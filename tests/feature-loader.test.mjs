import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, "..", "public", "demo", "feature-loader.js"),
  "utf8",
);

function fixture(options = {}) {
  const appended = [];
  const scripts = [];
  let failuresRemaining = Number(options.failures || 0);
  const document = {
    readyState: "complete",
    scripts,
    body: {
      appendChild(script) {
        scripts.push(script);
        appended.push(script.src);
        if (failuresRemaining > 0) {
          failuresRemaining -= 1;
          queueMicrotask(() => script.onerror());
        } else {
          queueMicrotask(() => script.onload());
        }
      },
    },
    createElement() {
      const attributes = new Map();
      const element = {
        readyState: "",
        addEventListener() {},
        getAttribute(name) {
          if (name === "src") return this.src;
          return attributes.has(name) ? attributes.get(name) : null;
        },
        setAttribute(name, value) {
          attributes.set(name, String(value));
        },
      };
      element.remove = () => {
        const index = scripts.indexOf(element);
        if (index >= 0) scripts.splice(index, 1);
      };
      return element;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
  };
  const window = {
    document,
    location: { hash: "" },
    innerHeight: 800,
    addEventListener() {},
    removeEventListener() {},
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
      }
    },
  };
  window.window = window;
  window.globalThis = window;
  vm.createContext(window);
  vm.runInContext(source, window, { filename: "feature-loader.js" });
  return { window, appended };
}

function section(scriptList) {
  const attributes = new Map([["data-feature-scripts", scriptList]]);
  const events = [];
  const prepended = [];
  return {
    id: "feature",
    events,
    prepended,
    getAttribute(name) {
      return attributes.get(name) || null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    addEventListener() {},
    querySelector(selector) {
      if (selector !== "[data-feature-retry]") return null;
      return prepended.find((item) => item.getAttribute("data-feature-retry") !== null) || null;
    },
    prepend(item) {
      item.remove = () => {
        const index = prepended.indexOf(item);
        if (index >= 0) prepended.splice(index, 1);
      };
      prepended.unshift(item);
    },
    dispatchEvent(event) {
      events.push(event);
    },
  };
}

test("feature scripts load once even when requested concurrently", async () => {
  const { window, appended } = fixture();
  const [first, second] = await Promise.all([
    window.WWAMFeatureLoader.load("feature-a.js"),
    window.WWAMFeatureLoader.load("feature-a.js"),
  ]);

  assert.equal(first, undefined);
  assert.equal(second, undefined);
  assert.deepEqual(appended, ["feature-a.js"]);
});

test("feature-loaded scripts advertise compatibility with the main lazy loader", async () => {
  const { window } = fixture();
  await window.WWAMFeatureLoader.load("shared-engine.js");
  const script = window.document.scripts[0];
  assert.equal(script.getAttribute("data-feature-source"), "shared-engine.js");
  assert.equal(script.getAttribute("data-lazy-source"), "shared-engine.js");
  assert.equal(script.getAttribute("data-feature-loaded"), "true");
  assert.equal(script.getAttribute("data-loaded"), "true");
});

test("section hydration is ordered, idempotent, and reports ready", async () => {
  const { window, appended } = fixture();
  const target = section("engine.js, ui.js");

  assert.equal(await window.WWAMFeatureLoader.hydrate(target), true);
  assert.equal(target.getAttribute("aria-busy"), "false");
  assert.equal(target.getAttribute("data-feature-state"), "ready");
  assert.deepEqual(appended, ["engine.js", "ui.js"]);
  assert.equal(target.events.at(-1).type, "wwam:feature-ready");
  assert.deepEqual(Array.from(target.events.at(-1).detail.scripts), ["engine.js", "ui.js"]);

  assert.equal(await window.WWAMFeatureLoader.hydrate(target), true);
  assert.deepEqual(appended, ["engine.js", "ui.js"]);
});

test("a transient script failure exposes a retry and does not poison hydration", async () => {
  const { window, appended } = fixture({ failures: 1 });
  const target = section("engine.js, ui.js");

  assert.equal(await window.WWAMFeatureLoader.hydrate(target), false);
  assert.equal(target.getAttribute("data-feature-state"), "failed");
  assert.equal(target._featureHydration, null);
  assert.equal(target.prepended.length, 1);
  assert.equal(target.prepended[0].textContent, "FEATURE HELD // RETRY LOAD");

  assert.equal(await window.WWAMFeatureLoader.hydrate(target), true);
  assert.equal(target.getAttribute("data-feature-state"), "ready");
  assert.equal(target.prepended.length, 0);
  assert.deepEqual(appended, ["engine.js", "engine.js", "ui.js"]);
});
