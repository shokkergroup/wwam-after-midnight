import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const read = (file) => fs.readFileSync(path.join(demo, file), "utf8");
const app = read("app.js");
const html = read("index.html");
const featureLoader = read("feature-loader.js");
const atlasUi = read("archive-atlas-ui.js");

function namedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `function ${name} is missing`);
  const next = source.indexOf("\n  function ", start + 1);
  assert.ok(next > start, `function ${name} has no static boundary`);
  return source.slice(start, next).trim();
}

function evaluateNamed(name, globals = {}) {
  return vm.runInNewContext(
    `(${namedFunction(app, name)})`,
    globals,
    { filename: `app.js#${name}` },
  );
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function classList(initial = []) {
  const values = new Set(initial);
  return {
    add(...names) {
      names.forEach((name) => values.add(name));
    },
    remove(...names) {
      names.forEach((name) => values.delete(name));
    },
    contains(name) {
      return values.has(name);
    },
    values,
  };
}

function popstateFunction() {
  const call = 'addEventListener("popstate", ';
  const start = app.indexOf(call);
  assert.ok(start >= 0, "popstate listener is missing");
  const functionStart = start + call.length;
  const nextListener = '\n    });\n    addEventListener("wwam:verdict-room-open"';
  const closeStart = app.indexOf(nextListener, functionStart);
  assert.ok(closeStart > functionStart, "popstate listener boundary is missing");
  return app.slice(functionStart, closeStart + "\n    }".length);
}

function atlasRuntime() {
  const window = {};
  const sandbox = { window, globalThis: window, setTimeout };
  vm.createContext(sandbox);
  for (const file of [
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "archive-atlas-ui.js",
  ]) {
    vm.runInContext(read(file), sandbox, { filename: file });
  }
  return {
    window,
    engine: window.WWAMArchiveAtlasEngine.create(window.WWAM_ARCHIVE_ATLAS),
  };
}

function atlasNode() {
  const attributes = new Map();
  const listeners = new Map();
  return {
    disabled: false,
    hidden: false,
    innerHTML: "",
    textContent: "",
    attributes,
    listeners,
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    removeEventListener(name, listener) {
      if (listeners.get(name) === listener) listeners.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
  };
}

test("canonical source URLs use ?source=ID&at=SECONDS#archive and retain route-safe context", () => {
  const sourceDossierSection = evaluateNamed("sourceDossierSection", {
    SOURCE_DOSSIER_SECTION_IDS: {
      proof: "sourceDossierProof",
      player: "sourceDossierPlayerSection",
      wiki: "sourceDossierShowWiki",
      inside: "sourceDossierInside",
      ask: "sourceDossierAsk",
      footprint: "sourceDossierFootprint",
      wake: "sourceDossierWake",
      chronology: "sourceDossierChronology",
      work: "sourceDossierWork",
      boundary: "sourceDossierBoundary",
    },
  });
  const window = {
    location: {
      href: "https://memory.example/demo?campaign=friend&utm=midnight#pitch",
    },
  };
  const globals = { window, URL, sourceDossierSection };
  const shareUrl = evaluateNamed("sourceDossierShareUrl", globals);
  const routeUrl = evaluateNamed("sourceRouteUrl", globals);

  assert.equal(
    shareUrl("ABCDEFGHIJK", 92),
    "https://memory.example/demo?source=ABCDEFGHIJK&at=92#archive",
  );
  assert.equal(
    shareUrl("ABCDEFGHIJK", 92, "ask"),
    "https://memory.example/demo?source=ABCDEFGHIJK&at=92&section=ask#archive",
  );
  assert.equal(
    shareUrl("ABCDEFGHIJK", 92, "javascript:alert(1)"),
    "https://memory.example/demo?source=ABCDEFGHIJK&at=92#archive",
  );

  window.location.href = (
    "https://memory.example/demo?campaign=friend&tape=OLDSOURCE01&" +
    "live=OLDSOURCE02&utm=midnight#pitch"
  );
  const routed = routeUrl("ABCDEFGHIJK", 92, "", "push");
  assert.equal(routed.searchParams.get("source"), "ABCDEFGHIJK");
  assert.equal(routed.searchParams.get("at"), "92");
  assert.equal(routed.searchParams.get("campaign"), "friend");
  assert.equal(routed.searchParams.get("utm"), "midnight");
  assert.equal(routed.searchParams.has("tape"), false);
  assert.equal(routed.searchParams.has("live"), false);
  assert.equal(routed.hash, "#archive");

  const syncGlobals = {
    window,
    URL,
    sourceDossierSection,
    history: {
      state: { campaignState: "kept" },
      pushed: [],
      replaced: [],
      pushState(state, unused, url) {
        this.pushed.push({ state, unused, url: String(url) });
      },
      replaceState(state, unused, url) {
        this.replaced.push({ state, unused, url: String(url) });
      },
    },
  };
  vm.runInNewContext(
    `${namedFunction(app, "sourceRouteUrl")}\n` +
    `${namedFunction(app, "syncSourceRoute")}`,
    syncGlobals,
    { filename: "app.js#source-route-sync" },
  );
  syncGlobals.syncSourceRoute("ABCDEFGHIJK", 92, "", "push");
  assert.equal(syncGlobals.history.pushed.length, 1);
  assert.equal(
    syncGlobals.history.pushed[0].url,
    "https://memory.example/demo?campaign=friend&utm=midnight&" +
      "source=ABCDEFGHIJK&at=92#archive",
  );
  assert.deepEqual(
    plain(syncGlobals.history.pushed[0].state),
    {
      campaignState: "kept",
      wwamSourceDossier: true,
      wwamSourceDossierPushed: true,
      sourceId: "ABCDEFGHIJK",
    },
  );
});

test("canonical, legacy tape, and legacy live source routes remain readable", () => {
  const sourceDossierSection = evaluateNamed("sourceDossierSection", {
    SOURCE_DOSSIER_SECTION_IDS: {
      proof: "sourceDossierProof",
      player: "sourceDossierPlayerSection",
      wiki: "sourceDossierShowWiki",
      inside: "sourceDossierInside",
      ask: "sourceDossierAsk",
      footprint: "sourceDossierFootprint",
      wake: "sourceDossierWake",
      chronology: "sourceDossierChronology",
      work: "sourceDossierWork",
      boundary: "sourceDossierBoundary",
    },
  });
  const location = { search: "" };
  const readRoute = evaluateNamed("readSourceRoute", {
    location,
    URLSearchParams,
    sourceDossierSection,
  });

  location.search = "?source=ABCDEFGHIJK&at=92&section=wake";
  assert.deepEqual(plain(readRoute()), {
    sourceId: "ABCDEFGHIJK",
    at: 92,
    section: "wake",
    legacy: false,
  });

  location.search = "?tape=ABCDEFGHIJK&at=61&campaign=friend";
  assert.deepEqual(plain(readRoute()), {
    sourceId: "ABCDEFGHIJK",
    at: 61,
    section: "",
    legacy: true,
  });

  location.search = "?live=LMNOPQRSTUV&at=181";
  assert.deepEqual(plain(readRoute()), {
    sourceId: "LMNOPQRSTUV",
    at: 181,
    section: "",
    legacy: true,
  });

  location.search = "?source=too-short&tape=ABCDEFGHIJK";
  assert.equal(readRoute(), null);

  location.search = "?source=ABCDEFGHIJK&section=javascript%3Aalert%281%29";
  assert.equal(readRoute().section, "");

  const initialRoute = namedFunction(app, "openInitialRoute");
  assert.match(
    initialRoute,
    /routeMode:\s*sourceRoute\.legacy\s*\?\s*"replace"\s*:\s*"none"/,
  );
});

test("the app consumes every Source Dossier UI callback as one bounded payload object", () => {
  const runtime = namedFunction(app, "buildSourceDossierRuntime");
  const callbacks = [
    "onPlay",
    "onCopyLink",
    "onDownload",
    "onOpenSource",
    "onOpenCompanion",
    "onAftermathExport",
    "onAftermathCopy",
    "onBagReceipt",
  ];
  for (const callback of callbacks) {
    assert.match(
      runtime,
      new RegExp(`${callback}: function \\(payload\\)`),
      `${callback} must receive the UI payload object`,
    );
  }

  assert.match(runtime, /onAftermathDecision:\s*saveAftermathReview/);
  assert.match(namedFunction(app, "saveAftermathReview"), /function saveAftermathReview\(payload\)/);
  assert.match(runtime, /loadPlayer\(payload\.sourceId,\s*payload\.at,\s*payload\.end\)/);
  assert.match(
    runtime,
    /sourceDossierShareUrl\(payload\.sourceId,\s*payload\.at,\s*payload\.section\)/,
  );
  assert.match(runtime, /payload\.filename[\s\S]*payload\.manifest/);
  assert.match(runtime, /ShokkerSourceQuery\.create\(\{\s*dossierEngine:\s*sourceDossierEngine/);
  assert.match(runtime, /queryEngine:\s*sourceQueryEngine/);
  assert.doesNotMatch(runtime, /onAskSource/);
  assert.doesNotMatch(runtime, /What is indexed for/);
  assert.match(runtime, /openSourceDossier\(payload\.targetSourceId, targetAt/);
  assert.match(runtime, /data-companion-source",\s*payload\.sourceId/);
  assert.match(runtime, /data-companion-time",\s*Math\.round\(Number\(payload\.at/);
  assert.match(runtime, /var source = payload\.dossier\.source/);
  assert.match(runtime, /var receipt = payload\.receipt/);
  assert.doesNotMatch(
    runtime,
    /on(?:Play|CopyLink|Download|AskSource|OpenSource|OpenCompanion|BagReceipt):\s*function\s*\(\s*sourceId\s*,/,
  );
});

test("Aftermath handoff clears hidden Clip Lab filters before exact-source rendering", () => {
  const state = { clipSourceId: "", clipMode: "supercuts", clipQuery: "old", clipRisk: "LOW" };
  let focusCalls = 0;
  const fields = {
    clipSearch: { value: "Loomis", focus() { focusCalls += 1; } },
    clipRisk: { value: "LOW" },
    "clip-lab": { scrollIntoViewCalls: 0, scrollIntoView() { this.scrollIntoViewCalls += 1; } },
  };
  let closed = 0;
  let closeOptions = null;
  let rendered = 0;
  const open = evaluateNamed("openAftermathInClipLab", {
    state,
    document: { getElementById(id) { return fields[id] ?? null; } },
    closeDossier(options) { closed += 1; closeOptions = options; },
    renderClipLab() { rendered += 1; },
    setTimeout(callback) { callback(); },
  });

  open({ sourceId: "ABCDEFGHIJK", mode: "shorts" });
  assert.deepEqual(state, {
    clipSourceId: "ABCDEFGHIJK",
    clipMode: "shorts",
    clipQuery: "",
    clipRisk: "",
  });
  assert.equal(fields.clipSearch.value, "");
  assert.equal(fields.clipRisk.value, "");
  assert.equal(closed, 1);
  assert.deepEqual(plain(closeOptions), { replaceRoute: true, restoreFocus: false });
  assert.equal(focusCalls, 1);
  assert.equal(rendered, 1);
  assert.equal(fields["clip-lab"].scrollIntoViewCalls, 1);
});

test("the compilation workflow hydrates source-bound Aftermath proof on first entry", () => {
  const ensure = namedFunction(app, "ensureAftermathPilot");
  const render = namedFunction(app, "renderPilotBuilder");
  assert.match(ensure, /loadSourceDossier\(\)\.then/);
  assert.match(ensure, /renderPilotBuilder\(\)/);
  assert.match(render, /wantsAftermathPilot && !aftermathPackEngine\) ensureAftermathPilot\(\)/);
  assert.match(render, /VERIFYING THREE SOURCE-LOCKED SHOWS/);
});

test("all 472 Atlas records pass through one card-to-dossier route", () => {
  const { window, engine } = atlasRuntime();
  const records = engine.browse({ sort: "newest", limit: 1000 }).records;
  assert.equal(records.length, 472);
  assert.ok(records.every((record) => /^[A-Za-z0-9_-]{11}$/.test(record.id)));
  assert.ok(records.every((record) => engine.getRecord(record.id)?.id === record.id));

  const archive = atlasNode();
  const grid = atlasNode();
  const nodes = new Map([
    ["archive", archive],
    ["archiveGrid", grid],
  ]);
  const document = {
    listeners: new Map(),
    addEventListener(name, listener) {
      this.listeners.set(name, listener);
    },
    removeEventListener(name, listener) {
      if (this.listeners.get(name) === listener) this.listeners.delete(name);
    },
    getElementById(id) {
      return nodes.get(id) ?? null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const opened = [];
  window.WWAMArchiveAtlasUI.create({
    engine,
    document,
    openRecord(record) {
      opened.push(record.id);
    },
  }).mount();

  assert.equal(
    (grid.innerHTML.match(/data-archive-open=/g) ?? []).length,
    18,
  );
  const click = archive.listeners.get("click");
  assert.equal(typeof click, "function");
  for (const record of records) {
    const button = {
      closest(selector) {
        return selector === "button" ? this : null;
      },
      hasAttribute(name) {
        return name === "data-archive-open";
      },
      getAttribute(name) {
        return name === "data-archive-open" ? record.id : null;
      },
    };
    click({ target: button });
  }
  assert.deepEqual(opened, plain(records.map((record) => record.id)));

  assert.match(atlasUi, /records\.map\(card\)\.join\(""\)/);
  assert.match(
    atlasUi,
    /data-archive-open="' \+ escapeHtml\(record\.id\)/,
  );
  assert.match(
    atlasUi,
    /engine\.getRecord\(target\.getAttribute\("data-archive-open"\)\)/,
  );
  const appBridge = namedFunction(app, "openArchiveRecord");
  assert.match(appBridge, /openSourceDossier\(record\.id\)/);
});

test("dossier CSS and scripts load lazily through the feature loader, never eager index tags", () => {
  const eagerScripts = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );
  const eagerStyles = Array.from(
    html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );
  const dossierScripts = [
    "channel-pack-contract.js",
    "wwam-channel-pack-adapter.js",
      "episode-guides.js",
      "source-dossier-engine.js",
      "wwam-source-dossier-adapter.js",
      "source-query-engine.js",
      "aftermath-pack-engine.js",
      "source-dossier-ui.js",
  ];
  assert.equal(eagerStyles.includes("source-dossier.css"), false);
  for (const asset of dossierScripts) {
    assert.equal(eagerScripts.includes(asset), false, `${asset} must remain lazy`);
  }
  assert.ok(eagerScripts.includes("feature-loader.js"));
  assert.ok(
    eagerScripts.indexOf("feature-loader.js") < eagerScripts.indexOf("app.js"),
    "the lazy loader must exist before app.js handles copied Show Wiki routes",
  );

  const loader = namedFunction(app, "loadSourceDossier");
  assert.match(loader, /loader\.loadStyle\("source-dossier\.css\?v=1\.8\.1-deep4"\)/);
  const scriptList = loader
    .match(/return \[([\s\S]*?)\]\.reduce/)?.[1]
    .match(/"[^"]+\.js(?:\?[^"]*)?"/g)
    ?.map((asset) => asset.slice(1, -1).split("?")[0]);
  assert.deepEqual(scriptList, dossierScripts);
  assert.match(loader, /return promise\.then\(function \(\) \{ return loader\.load\(source\); \}\)/);
  assert.match(featureLoader, /function loadStyle\(/);
  assert.match(
    featureLoader,
    /WWAMFeatureLoader\s*=\s*Object\.freeze\(\{[\s\S]*loadStyle:\s*loadStyle/,
  );
});

test("modal teardown clears embedded media and removes only dossier query keys", () => {
  const modal = {
    classList: classList(["show"]),
    attributes: new Map([
      ["aria-hidden", "false"],
      ["aria-busy", "true"],
      ["aria-labelledby", "sourceDossierTitle"],
      ["aria-describedby", "sourceDossierBoundary"],
    ]),
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    removeAttribute(name) {
      this.attributes.delete(name);
    },
  };
  const content = {
    innerHTML: "<iframe src=\"youtube\"></iframe><audio autoplay></audio>",
  };
  const body = { classList: classList(["modal-open"]) };
  const document = {
    body,
    getElementById(id) {
      return {
        tapeModal: modal,
        modalContent: content,
      }[id] ?? null;
    },
  };
  const history = {
    state: {
      campaignState: "kept",
      wwamSourceDossier: true,
      wwamSourceDossierPushed: false,
      sourceId: "ABCDEFGHIJK",
    },
    replacements: [],
    backCalls: 0,
    back() {
      this.backCalls += 1;
    },
    replaceState(state, unused, url) {
      this.state = state;
      this.replacements.push({ state, unused, url: String(url) });
    },
  };
  const window = {
    location: {
      href: (
        "https://memory.example/demo?campaign=friend&source=ABCDEFGHIJK&" +
        "at=92&section=wake&utm=midnight#archive"
      ),
    },
  };
  let inertSyncs = 0;
  let focusRestores = 0;
  const close = evaluateNamed("closeDossier", {
    document,
    history,
    window,
    URL,
    syncBackgroundInert() {
      inertSyncs += 1;
    },
    restoreDialogFocus() {
      focusRestores += 1;
    },
  });
  close();

  assert.equal(history.backCalls, 0);
  assert.equal(content.innerHTML, "");
  assert.equal(modal.classList.contains("show"), false);
  assert.equal(body.classList.contains("modal-open"), false);
  assert.equal(modal.attributes.has("aria-labelledby"), false);
  assert.equal(modal.attributes.has("aria-describedby"), false);
  assert.equal(inertSyncs, 1);
  assert.equal(focusRestores, 1);
  assert.equal(history.replacements.length, 1);
  const closedUrl = new URL(history.replacements[0].url);
  assert.equal(closedUrl.searchParams.get("campaign"), "friend");
  assert.equal(closedUrl.searchParams.get("utm"), "midnight");
  for (const key of ["source", "tape", "live", "at", "section"]) {
    assert.equal(closedUrl.searchParams.has(key), false, `${key} must be cleared`);
  }
  assert.equal(closedUrl.hash, "#archive");
  assert.deepEqual(plain(history.state), { campaignState: "kept" });
});

test("popstate reopens canonical and legacy routes, then closes media after a back navigation", () => {
  let route = {
    sourceId: "ABCDEFGHIJK",
    at: 92,
    section: "wake",
    legacy: false,
  };
  const opened = [];
  const closed = [];
  const modal = { classList: classList(["show"]) };
  const sandbox = {
    readSourceRoute() {
      return route;
    },
    openSourceDossier(sourceId, at, options) {
      opened.push({ sourceId, at, options });
      return Promise.resolve(true);
    },
    closeDossier(options) {
      closed.push(options);
    },
    document: {
      getElementById(id) {
        return id === "tapeModal" ? modal : null;
      },
    },
  };
  const onPopstate = vm.runInNewContext(
    `(${popstateFunction()})`,
    sandbox,
    { filename: "app.js#popstate" },
  );

  onPopstate();
  assert.deepEqual(plain(opened[0]), {
    sourceId: "ABCDEFGHIJK",
    at: 92,
    options: { section: "wake", routeMode: "none", autoplay: false },
  });
  assert.equal(closed.length, 0);

  route = {
    sourceId: "LMNOPQRSTUV",
    at: 181,
    section: "",
    legacy: true,
  };
  onPopstate();
  assert.deepEqual(plain(opened[1]), {
    sourceId: "LMNOPQRSTUV",
    at: 181,
    options: { section: "", routeMode: "replace", autoplay: false },
  });

  route = null;
  onPopstate();
  assert.deepEqual(plain(closed[0]), {
    fromHistory: true,
    preserveRoute: true,
  });

  modal.classList.remove("show");
  onPopstate();
  assert.equal(closed.length, 1);
});
