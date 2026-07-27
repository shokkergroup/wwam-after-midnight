import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "public", "demo", "wwam-memory-cut-launcher.js"),
  "utf8",
);
const app = fs.readFileSync(path.join(root, "public", "demo", "app.js"), "utf8");
const loader = fs.readFileSync(
  path.join(root, "public", "demo", "feature-loader.js"),
  "utf8",
);

function element(id = "") {
  const listeners = new Map();
  const attributes = new Map();
  const classes = new Set();
  return {
    id,
    innerHTML: "",
    textContent: "",
    style: {},
    focused: false,
    clicked: false,
    appended: [],
    classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); },
      contains(value) { return classes.has(value); },
    },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    removeAttribute(name) { attributes.delete(name); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    addEventListener(name, handler) { listeners.set(name, handler); },
    removeEventListener(name) { listeners.delete(name); },
    dispatch(name) {
      const handler = listeners.get(name);
      return handler ? handler({ target: this }) : undefined;
    },
    appendChild(child) { this.appended.push(child); return child; },
    remove() {},
    select() {},
    focus() { this.focused = true; },
    click() {
      this.clicked = true;
      return this.dispatch("click");
    },
    scrollIntoView(options) { this.scrollOptions = options; },
    hasClass(name) { return classes.has(name); },
    attribute(name) { return attributes.get(name); },
  };
}

function harness(bag = []) {
  const ids = Object.fromEntries([
    "toast",
    "tapeModal",
    "modalContent",
    "modalClose",
    "evidenceBagClose",
    "evidenceBagCut",
    "memoryCutPlayer",
  ].map((id) => [id, element(id)]));
  const background = [element("nav"), element("main"), element("footer")];
  const body = element("body");
  const calls = {
    engineCreates: [],
    uiCreates: [],
    opens: [],
    destroyed: 0,
    iframes: [],
  };
  const preset = {
    id: "character-ward",
    title: "THE CHARACTER WARD // 2021–2026",
    introduction: "Five exact source-locked character receipts.",
    selections: [
      { sourceId: "Mf-0Tv_KHCE", receiptKey: "character-receipt:slender-stomach" },
      { sourceId: "lCH31VtaSeI", receiptKey: "character-receipt:challis-boilermaker" },
      { sourceId: "Qc2vVFMO4ts", receiptKey: "character-receipt:loomis-biscuit-job" },
      { sourceId: "shoWljlgSUU", receiptKey: "character-receipt:feldman-atmosphere" },
      { sourceId: "LV2rmwEA0w4", receiptKey: "character-receipt:loomis-funding" },
    ],
  };
  const dossierEngine = { id: "canonical-dossier" };
  const cutEngine = {
    resolveSelection() {},
    compile() {},
    share() {},
    exportEditBrief() {},
    getPreset(id) {
      assert.equal(id, "character-ward");
      return preset;
    },
  };
  const document = {
    body,
    activeElement: ids.evidenceBagCut,
    getElementById(id) { return ids[id] || null; },
    querySelectorAll() { return background; },
    createElement(tag) { return element(tag); },
    execCommand() { return true; },
  };
  const window = {
    document,
    isSecureContext: false,
    matchMedia() { return { matches: true }; },
    WWAMSourceDossierAccess: {
      cutId: "evidenceBagCut",
      load: () => Promise.resolve(true),
      get: () => dossierEngine,
      bag: () => bag.slice(),
    },
    ShokkerMemoryCut: {
      create(options) {
        calls.engineCreates.push(options);
        return cutEngine;
      },
    },
    WWAMMemoryCutUI: {
      create(options) {
        calls.uiCreates.push(options);
        return {
          open(config) { calls.opens.push(config); },
          destroy() { calls.destroyed += 1; },
          getState() { return { open: true }; },
        };
      },
    },
    ShokkerYouTubePlayback: {
      iframe(sourceId, options) {
        calls.iframes.push({ sourceId, options });
        return `<iframe data-source="${sourceId}"></iframe>`;
      },
    },
  };
  const context = {
    window,
    document,
    navigator: {},
    Blob,
    URL: {
      createObjectURL: () => "blob:test",
      revokeObjectURL() {},
    },
    matchMedia: window.matchMedia,
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    console,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "wwam-memory-cut-launcher.js" });
  return { ...context, ids, background, calls, preset, dossierEngine };
}

test("lazy activation closes the bag and passes raw saved selections into the cut UI", async () => {
  const rawBag = [
    { id: "LV2rmwEA0w4", at: 9042.64, receiptKey: "character-receipt:loomis-funding" },
    { id: "unknown0000", at: 12 },
  ];
  const env = harness(rawBag);

  env.ids.evidenceBagCut.dispatch("wwam:feature-activate");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(env.ids.evidenceBagClose.clicked, true);
  assert.equal(env.ids.tapeModal.hasClass("show"), true);
  assert.equal(env.calls.engineCreates[0].dossierEngine, env.dossierEngine);
  assert.deepEqual(
    JSON.parse(JSON.stringify(env.calls.opens[0].selections)),
    rawBag,
    "the launcher must not silently discard an ineligible bag item",
  );
  assert.equal(env.calls.opens[0].title, "MY MIDNIGHT CUT");
  assert.equal(env.ids.tapeModal.attribute("aria-labelledby"), "memoryCutTitleHeading");
  assert.equal(env.ids.tapeModal.attribute("aria-describedby"), "memoryCutAuthority");
  assert.equal(env.calls.iframes.length, 0, "opening the cut must remain media-dormant");
});

test("an empty bag opens the exact preset and explicit playback stays in-page", () => {
  const env = harness([]);
  env.window.WWAMMemoryCutLauncher.open({
    dossierEngine: env.dossierEngine,
    selections: [],
  });

  assert.deepEqual(env.calls.opens[0].selections, env.preset.selections);
  assert.equal(env.calls.opens[0].title, env.preset.title);
  assert.equal(env.calls.iframes.length, 0);

  env.calls.uiCreates[0].onRenderPlayer({
    sourceId: "LV2rmwEA0w4",
    at: 9042.64,
    end: 9056.64,
    autoplay: true,
    mountId: "memoryCutPlayer",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(env.calls.iframes[0])), {
    sourceId: "LV2rmwEA0w4",
    options: {
      autoplay: true,
      start: 9042.64,
      end: 9056.64,
      title: "WWAM Midnight Cut source receipt",
    },
  });
  assert.match(env.ids.memoryCutPlayer.innerHTML, /LV2rmwEA0w4/);
  assert.equal(env.ids.memoryCutPlayer.scrollOptions.behavior, "auto");
});

test("the shell binds lazy activation and destroys the active cut on every modal close path", () => {
  assert.match(loader, /dataset\.featureActivate/);
  assert.match(loader, /wwam:feature-activate/);
  assert.match(app, /cutId:"evidenceBagCut"/);
  assert.match(
    app,
    /if\(window\.WWAMMemoryCutLauncher\)window\.WWAMMemoryCutLauncher\.destroy\(\)/,
  );
  assert.ok(fs.statSync(path.join(root, "public", "demo", "app.js")).size < 255_000);
  assert.ok(
    fs.statSync(path.join(root, "public", "demo", "feature-loader.js")).size < 6_000,
  );
});
