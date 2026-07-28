import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const gateSource = fs.readFileSync(path.join(demo, "route-render-gate.js"), "utf8");
const index = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const guided = fs.readFileSync(path.join(demo, "guided-shell.js"), "utf8");
const groupNames = ["global", "dossier", "home", "shows", "watchalongs", "characters", "ask", "highlights", "studio"];

function harness({ search = "", hash = "#top", catalog = [] } = {}) {
  const listeners = new Map();
  const root = {
    URLSearchParams,
    location: { search, hash },
    WWAM_CATALOG: catalog,
    document: {
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
    },
  };
  root.window = root;
  root.globalThis = root;
  vm.runInNewContext(gateSource, root, { filename: "route-render-gate.js" });
  return {
    api: root.WWAMRouteRenderGate,
    journey(group) {
      const listener = listeners.get("wwam:journey-change");
      assert.equal(typeof listener, "function", "journey listener was not registered");
      listener({ detail: { group } });
    },
  };
}

function renderGroups(calls) {
  return Object.fromEntries(groupNames.map((name) => [name, [() => {
    calls[name] = (calls[name] || 0) + 1;
  }]]));
}

test("home startup builds only global chrome and the visible route", () => {
  const calls = {};
  const page = harness();
  page.api.start(renderGroups(calls));
  assert.deepEqual(calls, { global: 1, home: 1 });
  assert.equal(page.api.snapshot().active, "home");

  page.api.activate("home");
  assert.deepEqual(calls, { global: 1, home: 1 }, "same-route activation must be idempotent");

  page.journey("shows");
  assert.deepEqual(calls, { global: 1, home: 1, shows: 1 });
  page.journey("home");
  assert.deepEqual(calls, { global: 1, home: 1, shows: 1 });
});

test("invalidated hidden routes stay cold until the visitor opens them", () => {
  const calls = {};
  const page = harness();
  page.api.start(renderGroups(calls));
  page.api.invalidate("shows");
  assert.equal(calls.shows, undefined);

  page.journey("shows");
  assert.equal(calls.shows, 1);
  page.api.invalidate("shows");
  assert.equal(calls.shows, 2, "the active route should update immediately");

  page.journey("home");
  page.api.invalidate("shows");
  assert.equal(calls.shows, 2, "hidden route invalidation must not touch the DOM");
  page.journey("shows");
  assert.equal(calls.shows, 3);
});

test("a language refresh updates active content and leaves prior routes stale", () => {
  const calls = {};
  const page = harness();
  page.api.start(renderGroups(calls));
  page.journey("shows");
  page.api.refresh();
  assert.equal(calls.global, 2);
  assert.equal(calls.shows, 2);
  assert.equal(calls.home, 1);

  page.journey("home");
  assert.equal(calls.home, 2, "the stale route should rebuild on its next visit");
});

test("direct hashes and source dossiers hydrate the correct first route", () => {
  const highlighted = {};
  harness({ hash: "#red100" }).api.start(renderGroups(highlighted));
  assert.deepEqual(highlighted, { global: 1, highlights: 1 });

  const commentary = {};
  harness({
    search: "?source=commentary-1&section=wiki",
    hash: "#archive",
    catalog: [{ id: "commentary-1" }],
  }).api.start(renderGroups(commentary));
  assert.deepEqual(commentary, { global: 1, dossier: 1 });

  const livestream = {};
  harness({ search: "?source=show-1&section=wiki", hash: "#archive" })
    .api.start(renderGroups(livestream));
  assert.deepEqual(livestream, { global: 1, dossier: 1 });
});

test("all mode remains available for audits and fully expanded views", () => {
  const calls = {};
  const page = harness();
  page.api.start(renderGroups(calls));
  page.api.activate("all");
  groupNames.forEach((name) => assert.equal(calls[name], 1, `${name} was not hydrated`));
  assert.equal(page.api.snapshot().active, "all");
});

test("the demo wires route hydration before app startup and defers every heavy route", () => {
  const gateAt = index.indexOf('src="route-render-gate.js');
  const appAt = index.indexOf('src="app.js');
  const shellAt = index.indexOf('src="guided-shell.js');
  assert.ok(gateAt > 0 && gateAt < appAt && appAt < shellAt);
  assert.match(guided, /if \(sourceId\) return "dossier"/);
  assert.match(guided, /if \(active === "dossier"\) return allowed/);
  assert.match(app, /history\.replaceState\(nextState, "", url\);[\s\S]{0,140}dispatchEvent\(new Event\("hashchange"\)\)/);

  const init = app.slice(app.indexOf("function init()"), app.indexOf("\n  init();"));
  const firstPaint = init.slice(0, init.indexOf("    bindPage();"));
  assert.match(firstPaint, /WWAMRouteRenderGate\.start\(\{/);
  [
    "renderProof();", "renderMarquee();", "renderHot100();", "renderSoundbytes();",
    "renderCharacter();", "renderStreams();", "renderPopular();", "renderMemory();",
    "renderLore();", "renderNightShift();", "renderTrivia();", "renderControlRoom();",
    "renderClipLab();", "renderCanon();", "renderPilotBuilder();", "renderVault();",
  ].forEach((call) => assert.doesNotMatch(firstPaint, new RegExp(call.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));

  const deepEngines = app.slice(app.indexOf("function createDeepEngines()"), app.indexOf("function createFanEngines()"));
  const fanEngines = app.slice(app.indexOf("function createFanEngines()"), app.indexOf("function createPilotBuilder()"));
  const creatorEngines = app.slice(app.indexOf("function createCreatorEngines()"), app.indexOf("function scheduleIdle("));
  const dossierLoader = app.slice(app.indexOf("function loadSourceDossier()"), app.indexOf("window.WWAMSourceDossierAccess"));
  assert.match(deepEngines, /WWAMRouteRenderGate\.invalidate\(\["studio", "characters"\]\)/);
  assert.doesNotMatch(deepEngines, /scheduleIdle\(create(?:Fan|Creator)Engines/);
  assert.match(init, /characters:\[createDeepEngines,createFanEngines/);
  assert.match(init, /highlights:\[createDeepEngines,createFanEngines/);
  assert.match(init, /studio:\[createDeepEngines,createFanEngines,createCreatorEngines/);
  assert.match(fanEngines, /WWAMRouteRenderGate\.invalidate\(\["characters", "highlights"\]\)/);
  assert.match(creatorEngines, /WWAMRouteRenderGate\.invalidate\("studio"\)/);
  assert.match(dossierLoader, /loadDemoScript\("creator-studio-engine\.js"\)\.then\(createClipLab\)/);
  assert.doesNotMatch(dossierLoader, /createCreatorEngines/);
  assert.equal(fs.statSync(path.join(demo, "app.js")).size < 270000, true, "app.js crossed its size cap");
});