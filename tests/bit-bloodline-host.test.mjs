import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const source = fs.readFileSync(
  path.join(demo, "wwam-bit-bloodline-host.js"),
  "utf8",
);
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");

function node(id = "") {
  const attributes = new Map();
  const classes = new Set();
  return {
    id,
    innerHTML: "",
    textContent: "",
    children: [],
    className: "",
    classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); },
      contains(value) { return classes.has(value); },
    },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    appendChild(child) { this.children.push(child); return child; },
    focus() {},
  };
}

function harness() {
  const elements = {
    toast: node("toast"),
    bitBloodlineMount: node("bitBloodlineMount"),
  };
  const calls = {
    engine: [],
    ui: [],
    opened: [],
    played: [],
    navigated: [],
    cut: [],
    loaded: [],
    styles: [],
  };
  const definitions = [
    { id: "ancestry:bit-challis-hotline", label: "THE CHALLIS HOTLINE" },
    { id: "ancestry:bit-slenderman-dispatch", label: "SLENDERMAN DISPATCH" },
  ];
  const engine = {
    fingerprint: "fnv1a32:bloodline",
    list() { return definitions; },
  };
  const access = {
    load: () => Promise.resolve(true),
    get: () => ({ id: "source-dossier" }),
    play(payload) { calls.played.push(payload); return Promise.resolve(true); },
    navigate(payload) { calls.navigated.push(payload); return Promise.resolve(true); },
  };
  const document = {
    getElementById(id) { return elements[id] || null; },
    querySelector(selector) {
      return selector === '[data-memory-tab="bits"]' ? node("bits-tab") : null;
    },
    createElement(tag) { return node(tag); },
  };
  const window = {
    document,
    WWAMSourceDossierAccess: access,
    ShokkerBitBloodline: {
      create(options) {
        calls.engine.push(options);
        return engine;
      },
    },
    WWAMBitBloodlineUI: {
      create(options) {
        calls.ui.push(options);
        return {
          open(config) { calls.opened.push(config); return { open: true }; },
          destroy() {},
          getState() { return { open: true }; },
        };
      },
    },
    WWAMFeatureLoader: {
      loadStyle(asset) { calls.styles.push(asset); return Promise.resolve(); },
      load(asset) { calls.loaded.push(asset); return Promise.resolve(); },
    },
    WWAMMemoryCutLauncher: {
      request(payload) { calls.cut.push(payload); return Promise.resolve(true); },
    },
  };
  const context = {
    window,
    document,
    setTimeout(callback) { queueMicrotask(callback); return 1; },
    clearTimeout() {},
    console,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "wwam-bit-bloodline-host.js" });
  return { window, document, elements, calls, definitions, engine, access };
}

test("the host re-resolves before mounting and features the 1,916-day Slenderman route", async () => {
  const env = harness();
  const markup = env.window.WWAMBitBloodlineHost.view(env.definitions);
  assert.match(markup, /VERIFYING THE CANONICAL PERFORMANCE LEDGER/);

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(env.calls.engine.length, 1);
  assert.equal(env.calls.engine[0].dossierEngine.id, "source-dossier");
  assert.deepEqual(env.calls.engine[0].lineages, env.definitions);
  assert.equal(env.calls.opened[0].lineageId, "ancestry:bit-slenderman-dispatch");
  assert.equal(env.elements.bitBloodlineMount.getAttribute("aria-busy"), "false");
});

test("individual evidence and full bloodline cuts use separate exact handoffs", async () => {
  const env = harness();
  env.window.WWAMBitBloodlineHost.view(env.definitions);
  await new Promise((resolve) => setImmediate(resolve));

  const receipt = {
    sourceId: "Mf-0Tv_KHCE",
    at: 541.04,
    end: 555.04,
    receiptKey: "character-receipt:slender-stomach",
  };
  await env.calls.ui[0].onPlay(receipt);
  assert.deepEqual(env.calls.played[0], receipt);
  const echo = { sourceId: "ETuRUYiQEBM", at: 2628 };
  await env.calls.ui[0].onNavigateEcho(echo);
  assert.deepEqual(env.calls.navigated[0], echo);

  const cut = {
    selections: [receipt, { sourceId: "sdiVxLTq67Q", at: 7558.72, end: 7572.72 }],
    title: "SLENDERMAN DISPATCH // SOURCE-LOCKED BLOODLINE",
    introduction: "Earliest indexed candidate; not true origin.",
  };
  await env.calls.ui[0].onCutBloodline(cut);
  assert.deepEqual(env.calls.styles, ["memory-cut.css"]);
  assert.deepEqual(env.calls.loaded, [
    "memory-cut-engine.js",
    "memory-cut-ui.js",
    "wwam-memory-cut-launcher.js",
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(env.calls.cut[0])), cut);
});

test("the integration replaces the overclaiming one-lineage renderer inside Memory OS", () => {
  const memoryStart = html.indexOf('<section class="memory-os" id="memory"');
  const memoryEnd = html.indexOf("</section>", memoryStart);
  const memory = html.slice(memoryStart, memoryEnd);

  assert.match(memory, /BIT BLOODLINES/);
  assert.match(memory, /bit-bloodline-engine\.js/);
  assert.match(memory, /bit-bloodline-ui\.js/);
  assert.match(memory, /wwam-bit-bloodline-host\.js/);
  assert.match(memory, /bit-bloodline\.css/);
  assert.doesNotMatch(html, /<script[^>]+bit-bloodline/i);
  assert.doesNotMatch(
    html,
    /<section[^>]+(?:id|class)=["'][^"']*bit-bloodline/i,
  );
  assert.doesNotMatch(app, /lineages\[0\]/);
  assert.doesNotMatch(app, /MUTATION 0/);
  assert.doesNotMatch(app, /PLAY THE LINEAGE/);
  assert.match(app, /WWAMBitBloodlineHost\.view\(lineages\)/);
  assert.match(app, /state\.memoryTab === "score" \|\| state\.memoryTab === "bits"/);
});
