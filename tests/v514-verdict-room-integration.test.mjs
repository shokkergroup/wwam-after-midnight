import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const read = (file) => fs.readFileSync(path.join(demo, file), "utf8");
const html = read("index.html");
const app = read("app.js");
const styles = read("styles.css");
const surface = read("verdict-room-surface.js");

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  assert.ok(match, `${name} is missing`);
  return match[1];
}

function list(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function node(tag = "div") {
  const attributes = new Map();
  const listeners = new Map();
  return {
    tag,
    textContent: "",
    children: [],
    onclick: null,
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
    append(...children) {
      this.children.push(...children);
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    replaceChildren(...children) {
      this.children = children;
    },
    attributes,
    listeners,
  };
}

function loadSurface({ adapter = null, subject = "" } = {}) {
  const section = node("section");
  const stage = node("div");
  const status = node("p");
  const order = [];
  section.setAttribute("data-verdict-subject", subject);
  const document = {
    createElement: node,
    getElementById(id) {
      return {
        "verdict-room": section,
        verdictRoomStage: stage,
        verdictRoomStatus: status,
      }[id] || null;
    },
  };
  const window = {
    document,
    console: { error() {} },
    WWAMFeatureLoader: {
      loadStyle(file) {
        order.push(`style:${file}`);
        return Promise.resolve();
      },
    },
    WWAMVerdictRoomAdapter: adapter,
  };
  const sandbox = { window };
  sandbox.globalThis = window;
  vm.createContext(sandbox);
  vm.runInContext(surface, sandbox, { filename: "verdict-room-surface.js" });
  return { order, section, stage, status, window };
}

test("Verdict Room is an exact lazy dependency chain and a first-class route", () => {
  const match = html.match(/<section\b[^>]*\bid="verdict-room"[^>]*>/);
  assert.ok(match, "Verdict Room section is missing");
  assert.deepEqual(list(attribute(match[0], "data-feature-scripts")), [
    "longitudinal-docket-engine.js",
    "longitudinal-docket-data.js",
    "wwam-longitudinal-docket-adapter.js",
    "channel-pack-contract.js",
    "wwam-channel-pack-adapter.js",
    "verdict-room-engine.js",
    "wwam-verdict-room-adapter.js",
    "verdict-room-ui.js",
    "verdict-room-surface.js",
  ]);
  assert.equal(/\bdata-feature-styles=/.test(match[0]), false);
  assert.match(html, /<a href="#verdict-room">VERDICT ROOM<\/a>/);
  assert.match(
    html,
    /class="verdict-room-door" href="#verdict-room"[\s\S]{0,260}THE TAPE KEEPS SCORE[\s\S]{0,260}ENTER THE VERDICT ROOM/,
  );

  const eagerScripts = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
    (entry) => entry[1].split("?")[0],
  );
  for (const asset of [
    "verdict-room-engine.js",
    "wwam-verdict-room-adapter.js",
    "verdict-room-ui.js",
    "verdict-room-surface.js",
  ]) {
    assert.equal(eagerScripts.includes(asset), false, `${asset} must remain lazy`);
  }
  assert.doesNotMatch(html, /<link\b[^>]*href="verdict-room\.css"/);
});

test("buyer-facing copy states the entire authority and audit proposition", () => {
  const room = html.slice(
    html.indexOf('<section class="verdict-room-portal"'),
    html.indexOf('<section class="lore-galaxy"'),
  );
  for (const claim of [
    /Machine dockets stay unresolved/i,
    /exact before and after receipts/i,
    /12 explicit checks/i,
    /device/i,
    /revoke/i,
    /append-only audit trail/i,
    /does not identify a speaker/i,
    /prove causality/i,
    /clear rights/i,
    /certify canon/i,
  ]) {
    assert.match(room, claim);
  }
  assert.match(room, /id="verdictRoomStatus"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(room, /id="verdictRoomStage"/);
  assert.match(room, /0<\/b><span>MACHINE VERDICTS/);
});

test("CSS loads after the UI chain and only then mounts the bounded adapter", async () => {
  const calls = [];
  const controller = { id: "controller" };
  const adapter = {
    mount(stage) {
      calls.push(["mount", stage]);
      return controller;
    },
    open(subject) {
      calls.push(["open", subject]);
      return true;
    },
    destroy() {
      calls.push(["destroy"]);
    },
  };
  const current = loadSurface({
    adapter,
    subject: "film:scream-7",
  });
  const ready = current.section.listeners.get("wwam:feature-ready");
  assert.equal(typeof ready, "function");
  await ready();

  assert.deepEqual(current.order, ["style:verdict-room.css"]);
  assert.deepEqual(calls, [
    ["mount", current.stage],
    ["open", "film:scream-7"],
  ]);
  assert.equal(
    current.status.textContent,
    "HUMAN REVIEW READY // MACHINE DOCKETS REMAIN UNRESOLVED.",
  );
  assert.equal(current.section.getAttribute("aria-busy"), "false");
  assert.equal(current.section.getAttribute("data-verdict-room-state"), "ready");
});

test("missing authority fails visibly without manufacturing a decision", async () => {
  const current = loadSurface();
  await current.window.WWAMVerdictRoomSurface.mount();

  assert.match(current.status.textContent, /HELD/);
  assert.equal(current.section.getAttribute("data-verdict-room-state"), "failed");
  assert.equal(current.section.getAttribute("aria-busy"), "false");
  assert.equal(current.stage.children.length, 1);
  assert.match(current.stage.children[0].children[0].textContent, /GAVEL STAYS LOCKED/);
  assert.match(current.stage.children[0].children[1].textContent, /No decision was created/);
});

test("storage degradation and invalid saved ledgers are visible, not overwritten", async () => {
  let persistence = "memory-only";
  const adapter = {
    mount() {
      return {};
    },
    open() {
      return true;
    },
    destroy() {},
    getStatus() {
      return { persistence, restoreWarning: persistence };
    },
  };
  const current = loadSurface({ adapter });
  await current.window.WWAMVerdictRoomSurface.mount();
  assert.match(current.status.textContent, /STORAGE UNAVAILABLE.*MEMORY-ONLY/);

  persistence = "blocked-invalid-saved-ledger";
  current.stage.listeners.get("wwam:verdict-room-storage")();
  assert.match(current.status.textContent, /INVALID SAVED LEDGER HELD UNTOUCHED/);
  assert.equal(current.section.getAttribute("data-verdict-room-state"), "ready");
});

test("the Ask-safe event contract routes only an exact subject identifier", () => {
  assert.match(
    app,
    /analysis\.status === "adjudication-handoff" \? "HUMAN REVIEW \/\/ VERDICT ROOM"/,
  );
  assert.match(
    app,
    /#askResults a\[href="#verdict-room"\][\s\S]{0,260}detail: analysis\.adjudicationHandoff/,
  );
  assert.match(app, /addEventListener\("wwam:verdict-room-open"/);
  assert.match(
    app,
    /event\.detail && typeof event\.detail\.subjectId === "string" \? event\.detail\.subjectId : ""/,
  );
  assert.match(app, /location\.hash = "verdict-room"/);
  assert.match(app, /WWAMFeatureLoader\.hydrate\(room\)/);
  assert.match(
    app,
    /WWAMVerdictRoomSurface\.open\(room\.getAttribute\("data-verdict-subject"\)\)/,
  );
  assert.doesNotMatch(
    app,
    /wwam:verdict-room-open[\s\S]{0,500}(?:innerHTML|askResults|analysis\.answer)\s*=/,
  );

  const opened = [];
  const current = loadSurface({
    adapter: {
      mount() {
        return {};
      },
      open(subject) {
        opened.push(subject);
        return true;
      },
      destroy() {},
    },
  });
  assert.equal(
    current.window.WWAMVerdictRoomSurface.open("<script>"),
    false,
  );
  assert.deepEqual(opened, []);
  assert.equal(
    current.window.WWAMVerdictRoomSurface.open("film:halloween-ends"),
    true,
  );
  assert.deepEqual(opened, ["film:halloween-ends"]);
});

test("portal layout has mobile, keyboard, and reduced-motion treatment within caps", () => {
  assert.match(styles, /\.verdict-room-door:hover,\s*\.verdict-room-door:focus-visible/);
  assert.match(styles, /@media \(max-width: 820px\)[\s\S]*?\.verdict-room-portal/);
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*?\.verdict-room-door/);
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.verdict-room-loading i\s*\{\s*animation: none;/,
  );
  assert.ok(fs.statSync(path.join(demo, "app.js")).size < 255_000);
  assert.ok(fs.statSync(path.join(demo, "verdict-room-surface.js")).size < 12_000);
});
