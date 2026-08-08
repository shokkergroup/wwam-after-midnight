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
const sourceDossierAssets = read("source-dossier-assets.js");
const sourceDossierUi = read("source-dossier-ui.js");
const livestreamFallbackIndex = read("wwam-livestream-fallback-index.js");
const livestreamColdIndex = read("wwam-livestream-cold-index.js");
const sourceDossierCss = read("source-dossier.css");

function runtimeVersion(file) {
  const version = read(file).match(/\bvar VERSION = "(\d+\.\d+\.\d+)"/)?.[1];
  assert.ok(version, `${file} is missing its semantic runtime VERSION`);
  return version;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    document: {
      getElementById() {
        return {
          setAttribute(name, value) { this[name] = value; },
        };
      },
    },
    sourceReturnContext: null,
    sourceReturnRestorePending: null,
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

  // The full dossier promotes the cold shell with replaceState. That
  // replacement must remain closable back to the shelf that opened it.
  syncGlobals.history.state = syncGlobals.history.pushed[0].state;
  syncGlobals.syncSourceRoute("ABCDEFGHIJK", 92, "", "replace");
  assert.equal(syncGlobals.history.replaced.length, 1);
  assert.equal(syncGlobals.history.replaced[0].state.wwamSourceDossierPushed, true);

  // Deep links do not write a new history entry, but the X button still
  // explains whether it closes a clip or the whole Show Wiki.
  const directClose = {
    setAttribute(name, value) { this[name] = value; },
  };
  syncGlobals.document.getElementById = () => directClose;
  syncGlobals.syncSourceRoute("ABCDEFGHIJK", null, "wiki", "none");
  assert.equal(directClose["aria-label"], "Close Show Wiki");
  syncGlobals.syncSourceRoute("ABCDEFGHIJK", 92, "wiki", "none");
  assert.equal(directClose["aria-label"], "Close clip and keep Show Wiki");
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

test("fallback show wiki keeps the full local dossier route map", () => {
  const fallbackSourceMoments = evaluateNamed("fallbackSourceMoments", {
    tapeById: {},
    boundedExcerpt(value) {
      return String(value).slice(0, 240);
    },
  });
  const dossierCuts = Array.from({ length: 20 }, (_, index) => ({
    t: 100 + index * 17,
    end: 112 + index * 17,
    category: "WWAM UP IN YA",
    label: `verified dossier cut ${index + 1}`,
    score: 80 + index,
    excerpt: "A source-local receipt from the editorial dossier.",
  }));
  const routes = fallbackSourceMoments("ABCDEFGHIJK", {
    dossier: { cuts: dossierCuts },
    watchPass: {
      candidates: [{
        t: 900,
        end: 914,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "a later verified route",
        score: 99,
        captionExcerpt: "The later route must survive the fallback merge.",
      }],
    },
  });
  assert.equal(routes.length, 21);
  assert.equal(routes[0].at, 100);
  assert.equal(routes[0].lane, "WWAM UP IN YA");
  assert.equal(routes.at(-1).at, 900);
  assert.equal(routes.at(-1).lane, "STRAIGHT TO STEVE'S ASSHOLE");
  assert.match(routes.at(-1).excerpt, /later route/i);
  const sameSecondDifferentLanes = fallbackSourceMoments("ABCDEFGHIJK", {
    dossier: { cuts: [
      { t: 180, end: 188, category: "WWAM UP IN YA", label: "UP IN YA", excerpt: "one lane" },
      { t: 180, end: 192, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "STRAIGHT TO STEVE'S ASSHOLE", excerpt: "another lane" },
    ] },
  });
  assert.equal(sameSecondDifferentLanes.length, 2);
});

test("fallback show wiki promotes bounded Whisper excerpts without publishing empty fragments", () => {
  const fallbackSourceMoments = evaluateNamed("fallbackSourceMoments", {
    tapeById: {},
    boundedExcerpt(value) {
      return String(value).slice(0, 240);
    },
    window: {
      WWAM_LIVESTREAM_ASR_EXCERPTS: {
        sources: {
          ABCDEFGHIJK: {
            candidates: [
              { t: 120, excerpt: "A complete local transcript window." },
              { t: 180, excerpt: "" },
            ],
          },
        },
      },
      WWAM_LIVESTREAM_FALLBACK_INDEX: {
        episodes: {
          ABCDEFGHIJK: {
            candidates: [{
              t: 240,
              category: "STRAIGHT TO STEVE'S ASSHOLE",
              label: "STRAIGHT TO STEVE'S ASSHOLE",
              captionExcerpt: "A source-local Steve's Asshole candidate.",
              score: 88,
            }],
          },
        },
      },
    },
  });
  const routes = fallbackSourceMoments("ABCDEFGHIJK", {});
  assert.equal(routes.length, 2);
  assert.equal(routes[0].at, 120);
  assert.equal(routes[0].label, "TAPE DOOR // CONTEXT CLIP");
  assert.match(routes[0].excerpt, /complete local transcript/i);
  assert.equal(routes[1].label, "STRAIGHT TO STEVE'S ASSHOLE");
});

test("quality-gated Whisper excerpts win over same-second placeholder receipts", () => {
  const fallbackSourceMoments = evaluateNamed("fallbackSourceMoments", {
    tapeById: {},
    boundedExcerpt(value) {
      return String(value).trim();
    },
    window: {
      WWAM_LIVESTREAM_ASR_EXCERPTS: {
        sources: {
          ABCDEFGHIJK: {
            candidates: [{
              t: 1350,
              excerpt: "By the way, how many fucking times are we going to kill off Professor X, dude?",
            }],
          },
        },
      },
    },
  });
  const routes = fallbackSourceMoments("ABCDEFGHIJK", {
    dossier: {
      cuts: [{
        t: 1350,
        category: "LISTENING // TRANSCRIPT WINDOW",
        label: "LISTENING // TRANSCRIPT WINDOW",
        excerpt: "Source-local receipt; press play to hear the tape.",
        reviewStatus: "machine-candidate-unreviewed",
      }],
    },
  });
  assert.equal(routes.length, 1);
  assert.equal(routes[0].sourceKind, "local-whisper");
  assert.match(routes[0].excerpt, /how many fucking times/i);
});

test("cold-route Whisper text cues retain bounded playback ends and their score", () => {
  const fallbackSourceMoments = evaluateNamed("fallbackSourceMoments", {
    tapeById: {},
    boundedExcerpt(value) {
      return String(value).trim();
    },
    window: {
      WWAM_LIVESTREAM_ASR_EXCERPTS: {
        sources: {
          ABCDEFGHIJK: {
            candidates: [{
              t: 320,
              excerpt: "The clean transcript cue keeps the exact exchange attached.",
              selectionKind: "source-local-whisper-text-cue",
              selectionScore: 57,
              segmentRefs: [{ start: 315, end: 334 }],
            }],
          },
        },
      },
    },
  });
  const routes = fallbackSourceMoments("ABCDEFGHIJK", {});
  assert.equal(routes.length, 1);
  assert.equal(routes[0].label, "TAPE DOOR // TALKING POINT");
  assert.equal(routes[0].end, 334);
  assert.equal(routes[0].heat, 57);
});

test("fallback Show Wiki keeps unreviewed caption fragments out of public prose", () => {
  const fallbackMomentDescription = evaluateNamed("fallbackMomentDescription", {
    timestamp(value) { return `${value}s`; },
    boundedExcerpt(value) { return String(value || "").trim(); },
    cleanedCaptionReceipt(value) { return String(value || "").replace(/>>\s*/g, "").trim(); },
    captionLooksNoisy(value) { return /(?:^|\s)(?:uh|um|er)(?:\s|$)/i.test(String(value || "")); },
  });
  const machineCopy = fallbackMomentDescription({
    at: 1320,
    label: "FULL SEND",
    excerpt: "good movie. >> Yeah, that shit's so overblown, dude.",
  });
  assert.match(machineCopy, /full-send take starts at 1320s/i);
  assert.match(machineCopy, /press play to hear the full exchange/i);
  assert.doesNotMatch(machineCopy, /good movie|overblown/i);

  const reviewedCopy = fallbackMomentDescription({
    at: 1440,
    label: "FULL SEND",
    excerpt: "The hosts commit to the bit until the whole room folds.",
    reviewStatus: "human-reviewed",
  });
  assert.match(reviewedCopy, /hosts commit to the bit/i);

  const qualityWhisperCopy = fallbackMomentDescription({
    at: 1350,
    label: "LISTENING // TRANSCRIPT WINDOW",
    sourceKind: "local-whisper",
    excerpt: "By the way, how many fucking times are we going to kill off Professor X, dude?",
    reviewStatus: "machine-candidate-unreviewed",
  });
  assert.match(qualityWhisperCopy, /how many fucking times/i);
  assert.match(qualityWhisperCopy, /starts at 1350s/i);
});

test("the compact livestream fallback index is bounded and category-aware", () => {
  const payload = JSON.parse(livestreamFallbackIndex.match(/= (\{[\s\S]+\});\s*$/)[1]);
  assert.equal(payload.schema, "shokker-wwam-livestream-fallback-index/v1");
  assert.equal(Object.keys(payload.episodes).length, 509);
  assert.ok(Object.values(payload.episodes).every((episode) => episode.candidates.length <= 10));
  const latest = payload.episodes.LV2rmwEA0w4.candidates;
  assert.ok(latest.some((candidate) => candidate.category === "STRAIGHT TO STEVE'S ASSHOLE"));
  assert.ok(latest.some((candidate) => candidate.category === "FAN SIGNAL"));
  assert.ok(latest.every((candidate) => candidate.sourceKind === "audio-pass"));
  for (const episode of Object.values(payload.episodes)) {
    const keys = episode.candidates.map((candidate) => `${candidate.t}|${candidate.category}`);
    assert.equal(new Set(keys).size, keys.length, `${episode.id} must preserve distinct category lanes at one second`);
  }
});

test("cold livestream routes keep the conversational canon read", () => {
  const sandbox = { window: {} };
  vm.runInNewContext(livestreamColdIndex, sandbox);
  const christmas = sandbox.window.WWAM_LIVESTREAM_COLD_INDEX.episodes.QMYgsEfPMg0;
  assert.ok(christmas, "the Christmas 2025 route stays in the compact index");
  assert.match(christmas.dossier.summary, /failed audio check|proper WWAM holiday party|refuses to behave like a Christmas show/i);
  assert.equal(christmas.summary, christmas.dossier.summary);
  assert.doesNotMatch(
    christmas.dossier.summary,
    /caption map concentrates on|This ranking night maps|source-linked machine index/i,
    "cold route prose must not fall back to the old metadata boilerplate",
  );
});

test("cold source routes paint the local fallback before optional Watchalong hydration", () => {
  assert.match(app, /function ensureWatchalongCanonForSource\(sourceId\)/);
  assert.match(app, /wwam-watchalong-route-index\.js\?v=1\.2\.2-conversational-summaries/);
  assert.match(app, /raw\.length <= 900/, "rich route reads are allowed to reach the visitor-facing Show Wiki");
  assert.match(app, /_editorialPack/, "cold routes retain human editorial packs");
  assert.match(app, /var summaryCandidate = editorialPack && \(editorialPack\.overview \|\| editorialPack\.deck\) \|\|/, "human editorial prose outranks machine cold-route summaries");
  assert.match(app, /source-dossier-fallback-editorial-headline/, "cold routes expose the human editorial hook above the playable doors");
  assert.match(app, /fallbackMomentIsEditorial/, "cold routes separate reviewed reads from machine discovery windows");
  assert.match(app, /MORE DOORS \/\/ LISTENING LEADS/, "machine-ranked doors are clearly labeled instead of reading as finished prose");
  assert.match(app, /data-fallback-review/, "fallback play targets retain their review boundary");
  assert.match(html, /episode-editorial-packs\.js\?v=1\.0\.2-cold-fallback/, "flagship editorial pack is available before lazy dossier assets");
  assert.match(html, /episode-editorial-packs-recent\.js\?v=1\.0\.3-cold-fallback/, "newest editorial packs are available before lazy dossier assets");
  assert.match(html, /wwam-livestream-cold-index\.js\?v=1\.0\.1-human-cold-routes/, "livestream cold routes have a compact local index");
  assert.match(app, /wwam-livestream-asr-excerpts\.js\?v=1\.0\.5-low-signal-filter/);
  assert.match(app, /wwam-livestream-fallback-index\.js\?v=1\.0\.0-category-lanes/);
  assert.match(app, /WWAM_LIVESTREAM_FALLBACK_INDEX/);
  assert.match(app, /WWAM_YEAR_CANON_2025_2026 && window\.WWAM_YEAR_CANON_2025_2026\.streams/);
  assert.match(app, /WWAM_ARCHIVE_COMPLETION && window\.WWAM_ARCHIVE_COMPLETION\.streams/);
  assert.match(app, /TAPE DOOR \/\/ CONTEXT CLIP/);
  assert.match(app, /transcript window/);
  assert.match(app, /String\(index \+ 1\)\.padStart\(2, "0"\)/);
  assert.match(app, /source-dossier-fallback-lane-legend/);
  assert.match(app, /data-fallback-filter/);
  assert.match(app, /data-fallback-lane/);
  assert.match(sourceDossierCss, /\.source-dossier-fallback-lane-legend/);
  assert.match(sourceDossierCss, /\.source-dossier-fallback-editorial-headline/);
  assert.match(sourceDossierCss, /\.source-dossier-fallback-editorial-cut/);
  assert.match(sourceDossierCss, /\.source-dossier-fallback-discovery/);
  assert.match(app, /WWAM_WATCHALONG_ROUTE_INDEX && window\.WWAM_WATCHALONG_ROUTE_INDEX\.sources/);
  assert.match(app, /Prefer the cold-route index\/canon record/);
  assert.match(app, /var hydrated = fallbackSourceRecord\(sourceId\);[\s\S]*hasHydratedRecord/);
  assert.match(app, /if \(hasHydratedRecord\) \{[\s\S]*fallbackSourceWiki\(sourceId, liveAt, liveSection\);/);
  assert.ok(app.indexOf("fallbackSourceWiki(sourceId, routeAt, routeSection);") < app.indexOf("return ensureWatchalongCanonForSource(sourceId)"), "a stalled hydration cannot block the immediate local fallback shell");
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
  assert.match(runtime, /if \(!payload\.localOnly\) loadPlayer\(payload\.sourceId,\s*payload\.at,\s*payload\.end\)/,
    "local Show Wiki audio must mark the child route without replacing its player");
  assert.match(
    runtime,
    /var route = readSourceRoute\(\);[\s\S]*syncSourceRoute\(payload\.sourceId, clipAt, clipSection, "replace"\)/,
    "playing a clip from an open Show Wiki must mark the clip as child route state",
  );
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
  assert.match(sourceDossierUi, /function markLocalPlayback\(meta\)/,
    "timeline audio playback must emit a route receipt for the close button");
  assert.match(sourceDossierUi, /mode: "receipt-local"/);
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

test("dossier CSS brands cold routes immediately while heavy scripts remain lazy", () => {
  assert.match(
    html,
    /<script src="app\.js\?v=0\.5\.\d+-[a-z0-9-]+"><\/script>/,
  );
  const eagerScripts = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );
  const eagerStyles = Array.from(
    html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );
  const dossierScripts = [
    "source-dossier-assets.js",
    "channel-pack-contract.js",
    "wwam-channel-pack-adapter.js",
    "episode-format-contracts.js",
    "episode-format-fallback-experience.js",
    "episode-facts-pilot.js",
    "episode-facts-batch2.js",
    "episode-facts-batch3.js",
    "episode-format-experience.js",
    "episode-guide-v2-topic-rebuild-batch1.js",
    "episode-guide-v2-topic-rebuild-batch2.js",
    "episode-guide-v2-topic-rebuild-batch3.js",
    "episode-guide-v2-topic-rebuild-batch4.js",
    "episode-guide-v2-topic-rebuild-batch5.js",
    "episode-topic-rebuild-experience.js",
    "episode-guides.js",
    "episode-guide-v2-reviewed-release.js",
    "episode-guide-v2-newest-five-release.js",
    "episode-guide-v2-reviewed-merge.js",
    "title-topic-overrides.js",
    "episode-editorial-packs.js",
    "episode-editorial-packs-recent.js",
    "episode-editorial-packs-wave2.js",
    "episode-editorial-packs-wave3.js",
    "episode-editorial-packs-wave4.js",
    "episode-editorial-packs-wave5.js",
    "episode-editorial-packs-wave6.js",
    "episode-editorial-packs-wave7.js",
    "episode-editorial-packs-wave8.js",
    "episode-editorial-packs-wave9.js",
    "episode-editorial-packs-wave10.js",
    "episode-editorial-packs-wave11.js",
    "episode-editorial-packs-wave12.js",
    "episode-editorial-packs-wave13.js",
    "episode-editorial-packs-wave14.js",
    "episode-editorial-packs-wave15.js",
    "episode-editorial-packs-wave16.js",
    "episode-editorial-packs-wave17.js",
    "episode-editorial-packs-wave18.js",
    "episode-editorial-packs-wave19.js",
    "episode-editorial-packs-wave20.js",
    "episode-editorial-packs-wave21.js",
  "episode-editorial-packs-wave22.js",
  "episode-editorial-packs-wave23.js",
  "episode-editorial-packs-wave24.js",
  "episode-editorial-packs-wave25.js",
  "episode-editorial-packs-wave26.js",
  "episode-editorial-packs-wave27.js",
  "episode-editorial-packs-wave28.js",
  "episode-editorial-packs-wave29.js",
  "episode-editorial-packs-wave30.js",
  "episode-editorial-packs-wave31.js",
  "episode-editorial-packs-wave32.js",
  "episode-editorial-packs-wave33.js",
  "episode-editorial-packs-wave34.js",
  "episode-editorial-packs-wave35.js",
  "episode-editorial-packs-wave36.js",
  "episode-editorial-packs-wave37.js",
  "episode-editorial-packs-wave38.js",
  "episode-editorial-packs-wave39.js",
  "episode-editorial-packs-wave40.js",
  "episode-editorial-packs-wave41.js",
  "episode-editorial-packs-wave42.js",
  "episode-editorial-packs-wave43.js",
  "episode-editorial-packs-wave44.js",
  "episode-editorial-packs-wave45.js",
  "episode-editorial-packs-wave46.js",
  "episode-editorial-packs-wave47.js",
  "episode-editorial-packs-wave48.js",
  "episode-editorial-packs-wave49.js",
  "episode-editorial-packs-wave50.js",
  "episode-editorial-packs-wave51.js",
  "episode-editorial-packs-wave52.js",
  "episode-editorial-packs-wave53.js",
  "episode-editorial-packs-wave54.js",
  "episode-editorial-packs-wave55.js",
  "episode-editorial-packs-wave56.js",
  "episode-editorial-packs-wave57.js",
  "episode-editorial-packs-wave58.js",
  "episode-editorial-packs-wave59.js",
  "episode-editorial-packs-wave60.js",
  "episode-editorial-packs-wave61.js",
  "episode-editorial-packs-wave62.js",
  "episode-editorial-packs-wave63.js",
  "episode-editorial-packs-wave64.js",
  "episode-editorial-packs-wave65.js",
  "episode-editorial-packs-wave66.js",
  "episode-editorial-packs-wave67.js",
  "episode-editorial-packs-wave68.js",
  "episode-editorial-packs-wave69.js",
  "episode-editorial-packs-wave70.js",
  "episode-editorial-packs-wave71.js",
  "episode-editorial-packs-wave72.js",
  "episode-editorial-packs-wave73.js",
  "episode-editorial-packs-wave74.js",
  "episode-editorial-packs-wave75.js",
  "episode-editorial-packs-wave76.js",
  "episode-editorial-packs-wave77.js",
  "episode-editorial-packs-wave78.js",
  "episode-editorial-packs-wave79.js",
  "episode-editorial-packs-wave80.js",
  "episode-editorial-packs-wave81.js",
  "episode-editorial-packs-wave82.js",
  "episode-editorial-packs-wave83.js",
  "episode-editorial-packs-wave84.js",
  "episode-editorial-packs-wave85.js",
  "episode-editorial-packs-wave86.js",
  "episode-editorial-packs-wave87.js",
  "episode-editorial-packs-wave88.js",
  "episode-editorial-packs-wave89.js",
  "episode-editorial-packs-wave90.js",
  "episode-editorial-packs-wave91.js",
  "episode-editorial-packs-wave92.js",
  "episode-editorial-packs-wave93.js",
  "episode-editorial-packs-wave94.js",
  "episode-editorial-packs-wave95.js",
  "episode-editorial-packs-wave96.js",
  "episode-editorial-packs-wave97.js",
  "episode-editorial-packs-wave98.js",
  "episode-editorial-packs-wave99.js",
  "episode-editorial-packs-wave100.js",
  "episode-editorial-packs-wave101.js",
  "episode-editorial-packs-wave102.js",
  "episode-editorial-packs-wave103.js",
  "episode-editorial-packs-wave104.js",
  "episode-editorial-packs-wave105.js",
  "episode-editorial-packs-wave106.js",
  "episode-editorial-packs-wave107.js",
  "episode-editorial-packs-wave108.js",
  "episode-editorial-packs-wave109.js",
  "episode-editorial-packs-wave110.js",
  "episode-editorial-packs-wave111.js",
  "episode-editorial-packs-wave112.js",
  "episode-editorial-packs-wave113.js",
  "episode-editorial-packs-wave114.js",
  "episode-editorial-packs-wave115.js",
  "episode-editorial-packs-wave116.js",
  "episode-editorial-packs-wave117.js",
  "episode-editorial-packs-wave118.js",
  "episode-editorial-packs-wave119.js",
  "episode-editorial-packs-wave120.js",
  "episode-editorial-packs-wave121.js",
  "episode-editorial-packs-wave122.js",
  "episode-editorial-packs-wave123.js",
  "episode-editorial-packs-wave124.js",
  "episode-editorial-packs-wave125.js",
    "episode-editorial-packs-wave126.js",
    "episode-editorial-packs-wave127.js",
    "episode-editorial-packs-wave128.js",
    "episode-editorial-packs-wave129.js",
    "episode-editorial-packs-wave130.js",
    "episode-editorial-packs-wave131.js",
    "episode-editorial-packs-wave132.js",
    "episode-editorial-packs-wave133.js",
    "episode-editorial-packs-wave134.js",
    "episode-editorial-packs-wave135.js",
    "episode-editorial-packs-wave136.js",
    "episode-editorial-packs-wave137.js",
    "episode-editorial-packs-wave138.js",
    "episode-editorial-packs-wave139.js",
    "episode-editorial-packs-wave140.js",
    "episode-editorial-packs-wave141.js",
    "episode-editorial-packs-wave142.js",
    "episode-editorial-packs-wave143.js",
    "episode-editorial-packs-wave144.js",
    "episode-editorial-packs-wave145.js",
    "episode-editorial-packs-wave146.js",
    "episode-editorial-packs-wave147.js",
    "episode-editorial-packs-wave148.js",
  "episode-editorial-packs-wave149.js",
  "episode-editorial-packs-wave150.js",
  "episode-editorial-packs-wave151.js",
  "episode-editorial-packs-wave152.js",
  "episode-editorial-packs-wave153.js",
  "episode-editorial-packs-wave154.js",
  "episode-editorial-packs-wave155.js",
  "episode-editorial-packs-wave156.js",
  "episode-editorial-packs-wave157.js",
  "episode-editorial-packs-wave158.js",
   "episode-editorial-packs-wave159.js",
   "episode-editorial-packs-wave160.js",
   "episode-editorial-packs-wave161.js",
   "episode-editorial-packs-wave162.js",
   "episode-editorial-packs-wave163.js",
   "episode-editorial-packs-wave164.js",
   "episode-editorial-packs-wave165.js",
   "episode-editorial-packs-wave166.js",
   "episode-editorial-packs-wave167.js",
   "episode-editorial-packs-wave168.js",
   "episode-editorial-packs-wave169.js",
   "episode-editorial-packs-wave170.js",
   "episode-editorial-packs-wave171.js",
   "episode-editorial-packs-wave172.js",
   "episode-editorial-packs-wave173.js",
   "episode-editorial-packs-wave174.js",
   "episode-editorial-packs-wave175.js",
   "episode-editorial-packs-wave176.js",
   "episode-editorial-packs-wave177.js",
   "episode-editorial-packs-wave178.js",
   "episode-editorial-packs-wave179.js",
   "episode-editorial-packs-wave180.js",
   "episode-editorial-packs-wave181.js",
   "episode-editorial-packs-wave182.js",
   "episode-editorial-packs-wave183.js",
   "episode-editorial-packs-wave184.js",
   "episode-editorial-packs-wave185.js",
  "episode-editorial-packs-wave186.js",
  "episode-editorial-packs-wave187.js",
  "episode-editorial-packs-wave188.js",
  "episode-editorial-packs-wave189.js",
  "episode-editorial-packs-wave190.js",
  "episode-editorial-packs-wave191.js",
  "episode-editorial-packs-wave192.js",
  "episode-editorial-packs-wave193.js",
  "episode-editorial-packs-wave194.js",
  "episode-editorial-packs-wave195.js",
  "episode-editorial-packs-wave196.js",
  "episode-editorial-packs-wave197.js",
  "episode-editorial-packs-wave198.js",
  "episode-editorial-packs-wave199.js",
  "episode-editorial-packs-wave200.js",
  "episode-editorial-packs-wave201.js",
  "episode-editorial-packs-wave202.js",
  "episode-editorial-packs-wave203.js",
  "episode-editorial-packs-wave204.js",
  "episode-editorial-packs-wave205.js",
  "episode-editorial-packs-wave206.js",
  "episode-editorial-packs-wave207.js",
  "episode-editorial-packs-wave208.js",
  "episode-editorial-packs-wave209.js",
  "episode-editorial-packs-wave210.js",
  "episode-editorial-packs-wave211.js",
  "episode-editorial-packs-wave212.js",
  "episode-editorial-packs-wave213.js",
  "episode-editorial-packs-wave214.js",
  "episode-editorial-packs-wave215.js",
  "episode-editorial-packs-wave216.js",
  "episode-editorial-packs-wave217.js",
  "episode-editorial-packs-wave218.js",
  "episode-editorial-packs-wave219.js",
  "episode-editorial-packs-wave220.js",
  "episode-editorial-packs-wave221.js",
  "episode-editorial-packs-wave222.js",
  "episode-editorial-packs-wave223.js",
  "episode-editorial-packs-wave224.js",
  "episode-editorial-packs-wave225.js",
  "episode-editorial-packs-wave226.js",
  "episode-editorial-packs-wave227.js",
  "episode-editorial-packs-wave228.js",
  "episode-editorial-packs-wave229.js",
  "episode-editorial-packs-wave230.js",
  "episode-editorial-packs-wave231.js",
  "episode-editorial-packs-wave232.js",
  "episode-editorial-packs-wave233.js",
  "episode-editorial-packs-wave234.js",
  "episode-editorial-packs-wave235.js",
  "episode-editorial-packs-wave236.js",
  "episode-editorial-packs-wave237.js",
  "episode-editorial-packs-wave238.js",
  "episode-editorial-packs-wave239.js",
  "episode-editorial-packs-wave240.js",
  "episode-editorial-packs-wave241.js",
  "episode-editorial-packs-wave242.js",
  "episode-editorial-packs-wave243.js",
  "episode-editorial-packs-wave244.js",
  "episode-editorial-packs-wave245.js",
  "episode-editorial-packs-wave246.js",
  "episode-editorial-packs-wave247.js",
  "episode-editorial-packs-wave248.js",
  "episode-editorial-packs-wave249.js",
  "episode-editorial-packs-wave250.js",
  "episode-editorial-packs-wave251.js",
  "episode-editorial-packs-wave252.js",
  "episode-editorial-packs-wave253.js",
  "episode-editorial-packs-wave254.js",
  "episode-editorial-packs-wave255.js",
  "episode-editorial-packs-wave256.js",
  "episode-editorial-packs-wave257.js",
  "episode-editorial-packs-wave258.js",
  "episode-editorial-packs-wave259.js",
  "episode-editorial-packs-wave260.js",
  "episode-editorial-packs-wave261.js",
  "episode-editorial-packs-wave262.js",
  "episode-editorial-packs-wave263.js",
  "episode-editorial-packs-wave264.js",
  "episode-editorial-packs-wave265.js",
  "episode-editorial-packs-wave266.js",
  "episode-editorial-packs-wave267.js",
  "episode-editorial-packs-wave268.js",
  "episode-editorial-packs-wave269.js",
  "episode-editorial-packs-wave270.js",
  "episode-editorial-packs-wave271.js",
  "episode-editorial-packs-wave272.js",
  "episode-editorial-packs-wave273.js",
  "episode-editorial-packs-wave274.js",
  "episode-editorial-packs-wave275.js",
  "episode-editorial-packs-wave276.js",
  "episode-editorial-packs-wave277.js",
  "episode-editorial-packs-wave278.js",
  "episode-editorial-packs-wave279.js",
  "episode-editorial-packs-wave280.js",
  "episode-editorial-packs-wave281.js",
  "episode-editorial-packs-wave282.js",
  "episode-editorial-packs-wave283.js",
  "episode-editorial-packs-wave284.js",
  "episode-editorial-packs-wave285.js",
  "episode-editorial-packs-wave286.js",
  "episode-editorial-packs-wave287.js",
  "episode-editorial-packs-wave288.js",
  "episode-editorial-packs-wave289.js",
  "episode-editorial-packs-wave290.js",
    "wwam-fam-index.js",
    "episode-recap-engine.js",
    "wwam-episode-recap-adapter.js",
    "source-dossier-engine.js",
    "wwam-livestream-asr-excerpts.js",
    "wwam-source-dossier-adapter.js",
    "source-query-engine.js",
    "aftermath-pack-engine.js",
    "source-dossier-ui.js",
    "wwam-dossier-editorial.js",
  ];
  assert.equal(eagerStyles.includes("source-dossier.css"), true);
  const intentionalColdRouteScripts = new Set([
    "episode-editorial-packs.js",
    "episode-editorial-packs-recent.js",
    "episode-editorial-packs-wave4.js",
    "episode-editorial-packs-wave22.js",
    "episode-editorial-packs-wave23.js",
    "episode-editorial-packs-wave24.js",
    "episode-editorial-packs-wave25.js",
    "episode-editorial-packs-wave26.js",
    "episode-editorial-packs-wave27.js",
  "episode-editorial-packs-wave28.js",
  "episode-editorial-packs-wave29.js",
  "episode-editorial-packs-wave30.js",
  "episode-editorial-packs-wave31.js",
  "episode-editorial-packs-wave32.js",
  "episode-editorial-packs-wave33.js",
  "episode-editorial-packs-wave34.js",
  "episode-editorial-packs-wave35.js",
  ]);
  for (let wave = 2; wave <= 290; wave += 1) {
    intentionalColdRouteScripts.add(`episode-editorial-packs-wave${wave}.js`);
  }
  for (const asset of dossierScripts) {
    if (intentionalColdRouteScripts.has(asset)) continue;
    assert.equal(eagerScripts.includes(asset), false, `${asset} must remain lazy`);
  }
  assert.ok(eagerScripts.includes("feature-loader.js"));
  assert.ok(
    eagerScripts.indexOf("feature-loader.js") < eagerScripts.indexOf("app.js"),
    "the lazy loader must exist before app.js handles copied Show Wiki routes",
  );

  const loader = namedFunction(app, "loadSourceDossier");
  const loaderContract = `${loader}\n${sourceDossierAssets}`;
  const cssVersion = read("source-dossier.css").match(
    /^\/\* V(\d+\.\d+) \/\//,
  )?.[1];
  assert.ok(cssVersion, "source-dossier.css is missing its Vx.y release header");
  assert.match(
    loader,
    new RegExp(
      `loader\\.loadStyle\\("source-dossier\\.css\\?v=${escapeRegex(cssVersion)}-[a-z0-9-]+"\\)`,
    ),
  );
  for (const asset of [
    "episode-format-contracts.js",
    "episode-format-fallback-experience.js",
    "episode-format-experience.js",
    "episode-topic-rebuild-experience.js",
    "episode-recap-engine.js",
    "wwam-episode-recap-adapter.js",
    "source-dossier-engine.js",
    "wwam-source-dossier-adapter.js",
    "source-query-engine.js",
    "source-dossier-ui.js",
  ]) {
    assert.match(
      loaderContract,
      new RegExp(
        `"${escapeRegex(asset)}\\?v=${escapeRegex(runtimeVersion(asset))}-[a-z0-9-]+"`,
      ),
      `${asset} cache key must match its exported runtime VERSION`,
    );
  }
  const sourceDossierAdapter = read("wwam-source-dossier-adapter.js");
  const asrExcerptIndex = read("wwam-livestream-asr-excerpts.js");
  assert.match(
    sourceDossierAdapter,
    /canonicalDurationSeconds[^\n]+canonicalYouTubeDuration|canonicalYouTubeDuration/,
    "official podcast alternates must accept the archive manifest's canonicalYouTubeDuration alias",
  );
  assert.match(
    sourceDossierAdapter,
    /audio-feature-candidate[\s\S]*audio-listening-navigation/,
    "restricted commentaries must retain source-local audio listening doors",
  );
  assert.match(
    sourceDossierAdapter,
    /localWhisperExcerpt[\s\S]*faster-whisper transcript excerpt aligned/,
    "Show Wiki audio receipts must consume bounded local Whisper excerpts when available",
  );
  assert.match(
    sourceDossierAdapter,
    /function record\(value\)[\s\S]*localWhisperTextCueReceipts[\s\S]*secondary discovery door/,
    "Show Wiki adapter must safely expose transcript-led secondary listening doors",
  );
  assert.match(
    asrExcerptIndex,
    /wwam-livestream-asr-excerpts\/v1[\s\S]*publicExcerptWordLimit/,
    "the ASR overlay must declare its bounded public excerpt policy",
  );
  assert.match(asrExcerptIndex, /source-local-whisper-text-cue/, "the ASR overlay must retain secondary transcript-led doors beyond the acoustic shortlist");
  assert.match(asrExcerptIndex, /coverageMode/, "the ASR overlay must disclose whether Whisper coverage is full-source or windowed");
  assert.match(asrExcerptIndex, /secondary transcript-cue doors/, "the ASR overlay must label transcript-led doors as secondary listening leads");
  const asrSandbox = { window: {} };
  vm.runInNewContext(asrExcerptIndex, asrSandbox, { filename: "wwam-livestream-asr-excerpts.js" });
  const publicAsrExcerpts = Object.values(asrSandbox.window.WWAM_LIVESTREAM_ASR_EXCERPTS.sources || {})
    .flatMap((source) => source.candidates || [])
    .map((candidate) => String(candidate.excerpt || ""))
    .filter(Boolean);
  assert.ok(publicAsrExcerpts.length > 0, "the published ASR overlay must retain usable excerpts");
  assert.ok(
    Object.values(asrSandbox.window.WWAM_LIVESTREAM_ASR_EXCERPTS.sources || {})
      .flatMap((source) => source.candidates || [])
      .some((candidate) => candidate.selectionKind === "source-local-whisper-text-cue"),
    "the published ASR overlay must include at least one transcript-led discovery door",
  );
  for (const excerpt of publicAsrExcerpts) {
    assert.ok(excerpt.split(/\s+/).length >= 5, `ASR excerpt is too short: ${excerpt}`);
    assert.doesNotMatch(excerpt, /\b([A-Za-z][A-Za-z'-]*)\s+\1\b/i, `ASR adjacent stutter leaked: ${excerpt}`);
    assert.doesNotMatch(excerpt, /\b(?:did a good|one section|not allowed to|you're not allowed to)\b/i, `ASR hallucination tail leaked: ${excerpt}`);
  }
  assert.match(
    asrExcerptIndex,
    /LV2rmwEA0w4[\s\S]*iz0WFhe6LYM/,
    "the latest-two listening pass must publish both completed newest livestream ledgers",
  );
  assert.match(
    asrExcerptIndex,
    /iz0WFhe6LYM/,
    "the latest-three listening pass must publish the second completed newest livestream ledger",
  );
  assert.match(
    asrExcerptIndex,
    /ag3axSC9BpU/,
    "the latest-three listening pass must publish the third completed newest livestream ledger",
  );
  assert.match(
    sourceDossierUi,
    /showWikiAudioListeningMarkup[\s\S]*audio-feature-candidate[\s\S]*data-source-dossier-action=\"play-receipt\"/,
    "every Show Wiki must render source-local ranked listening windows as playable receipts",
  );
  assert.match(
    sourceDossierUi,
    /function listeningCaptionExcerpt[\s\S]*AUTO-RANKED AUDIO WINDOW\. PRESS PLAY AND DECIDE FOR YOURSELF\./,
    "listening rails must quarantine broken auto-caption fragments instead of presenting them as quotes",
  );
  assert.match(
    sourceDossierUi,
    /sourceDossierListeningPass[\s\S]*LISTENING PASS/,
    "Show Wiki local navigation must expose the listening pass as a first-class destination",
  );
  assert.match(
    sourceDossierUi,
    /data-source-listening-asr-count[\s\S]*WHISPER-ALIGNED LISTENING PASS/,
    "Show Wiki listening rails must disclose when local Whisper alignment has improved the excerpt",
  );
  assert.match(
    sourceDossierUi,
    /SOURCE-LOCAL WHISPER TEXT CUE/,
    "Show Wiki listening rails must label transcript cues as secondary discovery doors",
  );
  assert.match(sourceDossierUi, /SECONDARY DISCOVERY DOOR/);
  assert.doesNotMatch(
    sourceDossierUi,
    /\bnormalized\s*\(/,
    "Source Dossier UI must not call an undefined normalization helper",
  );
  assert.match(loader, /loadDemoScript\("creator-studio-engine\.js"\)\.then\(createClipLab\)/);
  assert.doesNotMatch(loader, /createCreatorEngines/);
  const scriptList = sourceDossierAssets
    .match(/Object\.freeze\(\[([\s\S]*?)\]\)/)?.[1]
    .match(/"[^"]+\.js(?:\?[^"]*)?"/g)
    ?.map((asset) => asset.slice(1, -1).split("?")[0]);
  assert.deepEqual(["source-dossier-assets.js"].concat(scriptList), dossierScripts);
  assert.match(loader, /return promise\.then\(function \(\) \{ return loader\.load\(source\); \}\)/);
  assert.match(
    app,
    /function buildRevisionAssetUrl[\s\S]*meta\[name="wwam-build-revision"\][\s\S]*build=/,
    "cold Show Wiki lazy scripts must carry the published build revision",
  );
  assert.match(featureLoader, /function loadStyle\(/);
  assert.match(
    featureLoader,
    /function buildRevisionUrl[\s\S]*wwam-build-revision[\s\S]*build=/,
    "feature-loader assets must carry the published build revision",
  );
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

test("closing an active clip restores the open Show Wiki before leaving the shelf", () => {
  const modal = {
    classList: classList(["show"]),
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, String(value)); },
    removeAttribute(name) { this.attributes.delete(name); },
  };
  const player = { innerHTML: "<iframe src=\"clip\"></iframe>" };
  const content = { innerHTML: "<article>show wiki</article>" };
  const body = { classList: classList(["modal-open"]) };
  const document = {
    body,
    getElementById(id) {
      return { tapeModal: modal, modalContent: content, modalPlayer: player }[id] ?? null;
    },
  };
  const history = {
    state: {
      wwamSourceDossier: true,
      wwamSourceDossierPushed: true,
      sourceId: "ABCDEFGHIJK",
    },
    replacements: [],
    backCalls: 0,
    back() { this.backCalls += 1; },
    replaceState(state, unused, url) {
      this.state = state;
      this.replacements.push({ state, unused, url: String(url) });
    },
  };
  const window = {
    location: {
      href: "https://memory.example/demo?source=ABCDEFGHIJK&at=92&section=wiki#archive",
    },
    ShokkerYouTubePlayback: {
      iframe(id, options) { return `<iframe data-source="${id}" data-autoplay="${options.autoplay}"></iframe>`; },
    },
  };
  const close = evaluateNamed("closeDossier", {
    document,
    history,
    window,
    URL,
    syncSourceRoute(sourceId, at, section, mode) {
      const url = new URL(window.location.href);
      url.searchParams.delete("at");
      if (sourceId) url.searchParams.set("source", sourceId);
      if (section) url.searchParams.set("section", section);
      history.replaceState(Object.assign({}, history.state, { sourceId }), "", url);
    },
    syncBackgroundInert() {},
    restoreDialogFocus() {},
  });
  close();
  assert.equal(history.backCalls, 0);
  assert.equal(history.replacements.length, 1);
  assert.equal(new URL(history.replacements[0].url).searchParams.has("at"), false);
  assert.match(player.innerHTML, /data-autoplay="false"/);
  assert.equal(modal.classList.contains("show"), true);
});

test("audio-only child clips keep the Show Wiki open even without a YouTube timestamp", () => {
  const modal = {
    scrollTop: 412,
    classList: classList(["show"]),
    setAttribute() {},
    removeAttribute() {},
  };
  const player = { innerHTML: "<audio></audio>" };
  const content = { innerHTML: "<article>show wiki</article>" };
  const body = { classList: classList(["modal-open"]) };
  const document = {
    body,
    getElementById(id) {
      return { tapeModal: modal, modalContent: content, modalPlayer: player }[id] ?? null;
    },
  };
  const history = {
    state: {
      wwamSourceDossier: true,
      wwamSourceDossierPushed: true,
      wwamSourceDossierClip: true,
      sourceId: "ABCDEFGHIJK",
    },
    replacements: [],
    backCalls: 0,
    back() { this.backCalls += 1; },
    replaceState(state, unused, url) {
      this.state = state;
      this.replacements.push({ state, unused, url: String(url) });
    },
  };
  const window = {
    location: {
      href: "https://memory.example/demo?source=ABCDEFGHIJK&section=wiki#archive",
    },
    ShokkerYouTubePlayback: {
      iframe(id, options) { return `<iframe data-source="${id}" data-autoplay="${options.autoplay}"></iframe>`; },
    },
  };
  const close = evaluateNamed("closeDossier", {
    document,
    history,
    window,
    URL,
    syncSourceRoute(sourceId, at, section) {
      const url = new URL(window.location.href);
      url.searchParams.delete("at");
      if (sourceId) url.searchParams.set("source", sourceId);
      if (section) url.searchParams.set("section", section);
      history.replaceState(Object.assign({}, history.state, { sourceId }), "", url);
    },
    syncBackgroundInert() {},
    restoreDialogFocus() {},
  });
  close();
  assert.equal(history.backCalls, 0);
  assert.equal(modal.classList.contains("show"), true);
  assert.equal(history.state.wwamSourceDossierClip, undefined);
  assert.equal(new URL(history.replacements.at(-1).url).searchParams.has("at"), false);
});

test("an in-memory Show Wiki receipt protects the first close before a child marker serializes", () => {
  const modal = {
    scrollTop: 287,
    classList: classList(["show"]),
    setAttribute() {},
    removeAttribute() {},
  };
  const player = { innerHTML: "<audio></audio>" };
  const content = { innerHTML: "<article>show wiki</article>" };
  const body = { classList: classList(["modal-open"]) };
  const document = {
    body,
    getElementById(id) {
      return { tapeModal: modal, modalContent: content, modalPlayer: player }[id] ?? null;
    },
  };
  const history = {
    state: {
      wwamSourceDossier: true,
      wwamSourceDossierPushed: true,
      sourceId: "ABCDEFGHIJK",
    },
    replacements: [],
    backCalls: 0,
    back() { this.backCalls += 1; },
    replaceState(state, unused, url) {
      this.state = state;
      this.replacements.push({ state, unused, url: String(url) });
    },
  };
  const window = {
    location: {
      href: "https://memory.example/demo?source=ABCDEFGHIJK&section=wiki#archive",
    },
    ShokkerYouTubePlayback: {
      iframe(id, options) { return `<iframe data-source="${id}" data-autoplay="${options.autoplay}"></iframe>`; },
    },
  };
  const close = evaluateNamed("closeDossier", {
    document,
    history,
    window,
    URL,
    setTimeout,
    sourceClipReturnContext: { sourceId: "ABCDEFGHIJK", section: "wiki", scrollTop: 287 },
    syncSourceRoute(sourceId, at, section) {
      const url = new URL(window.location.href);
      url.searchParams.delete("at");
      if (sourceId) url.searchParams.set("source", sourceId);
      if (section) url.searchParams.set("section", section);
      history.replaceState(Object.assign({}, history.state, { sourceId }), "", url);
    },
    syncBackgroundInert() {},
    restoreDialogFocus() {},
  });
  close();
  assert.equal(history.backCalls, 0);
  assert.equal(modal.classList.contains("show"), true);
  assert.equal(new URL(history.replacements.at(-1).url).searchParams.has("at"), false);
});

test("the serialized Show Wiki receipt protects the first close after a modal re-render", () => {
  const modal = {
    scrollTop: 0,
    classList: classList(["show"]),
    setAttribute() {},
    removeAttribute() {},
  };
  const player = { innerHTML: "<audio></audio>" };
  const content = { innerHTML: "<article>show wiki</article>" };
  const body = { classList: classList(["modal-open"]) };
  const document = {
    body,
    getElementById(id) {
      return { tapeModal: modal, modalContent: content, modalPlayer: player }[id] ?? null;
    },
  };
  const history = {
    state: {
      wwamSourceDossier: true,
      wwamSourceDossierPushed: true,
      wwamSourceDossierClip: true,
      wwamSourceDossierClipReceipt: {
        sourceId: "ABCDEFGHIJK",
        section: "wiki",
        scrollTop: 731,
        kind: "receipt-local",
      },
      sourceId: "ABCDEFGHIJK",
    },
    replacements: [],
    backCalls: 0,
    back() { this.backCalls += 1; },
    replaceState(state, unused, url) {
      this.state = state;
      this.replacements.push({ state, unused, url: String(url) });
    },
  };
  const window = {
    location: {
      href: "https://memory.example/demo?source=ABCDEFGHIJK&section=wiki#archive",
    },
    ShokkerYouTubePlayback: {
      iframe(id, options) { return `<iframe data-source="${id}" data-autoplay="${options.autoplay}"></iframe>`; },
    },
  };
  const close = evaluateNamed("closeDossier", {
    document,
    history,
    window,
    URL,
    setTimeout,
    syncSourceRoute(sourceId, at, section) {
      const url = new URL(window.location.href);
      url.searchParams.delete("at");
      if (sourceId) url.searchParams.set("source", sourceId);
      if (section) url.searchParams.set("section", section);
      history.replaceState(Object.assign({}, history.state, { sourceId }), "", url);
    },
    syncBackgroundInert() {},
    restoreDialogFocus() {},
  });
  close();
  assert.equal(history.backCalls, 0);
  assert.equal(modal.classList.contains("show"), true);
  assert.equal(history.state.wwamSourceDossierClip, undefined);
  assert.equal(history.state.wwamSourceDossierClipReceipt, undefined);
  assert.equal(new URL(history.replacements.at(-1).url).searchParams.has("at"), false);
});

test("clip callbacks carry the Show Wiki scroll receipt and close works without a player node", () => {
  assert.match(app, /sourceClipReturnContext = null/, "clip parent receipt state exists");
  assert.match(app, /payload\.returnScrollTop/, "local and iframe clips can carry the parent scroll position");
  assert.match(app, /var clipReturn = typeof sourceClipReturnContext/, "closing a clip reads the parent receipt");
  assert.match(app, /wwamSourceDossierClipReceipt/, "serialized child receipt survives a modal re-render");
  assert.doesNotMatch(app, /activeClipUrl\.searchParams\.has\("at"\) && activeClipPlayer/, "clip close is not gated on a player element");
  assert.match(read("source-dossier-ui.js"), /payload\.returnScrollTop = Math\.max\(0, Number\(ownerDialog\.scrollTop\)\)/);
  assert.match(read("source-dossier-ui.js"), /childPlayback: true/);
  assert.match(read("source-dossier-ui.js"), /action === "play-alternate-route"/);
});

test("loose clips opened from a Show Wiki carry a nested parent route", () => {
  assert.match(app, /sourceClipParentRoute = \{/, "nested source context is captured");
  assert.match(app, /nestedRouteMode = "push"/, "different-source loose clips get a child history entry");
  assert.match(app, /nestedRouteMode = "replace"/, "same-source loose clips stay in the current Show Wiki");
  assert.match(app, /nestedParentRoute\.sourceId !== activeSourceId/, "the first X recognizes a nested clip");
  assert.match(app, /history\.back\(\);\s*return;/, "nested clip close returns to its parent route");
});

test("local source interception captures the shelf before competing route listeners", () => {
  const appSource = fs.readFileSync(path.join(root, "public/demo/app.js"), "utf8");
  assert.match(appSource, /Capture the shelf before any route\/hash listener/);
  assert.match(appSource, /function captureSourceReturnContext\(\)/);
  assert.match(appSource, /parentReturnContext && hasActiveSourceRoute/);
});

test("editorial wave loading uses numeric precedence for duplicate source packs", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.ok(generator.includes("const editorialPackFiles = fs.readdirSync(DEMO)"));
  assert.ok(generator.includes(".sort((left, right) =>"));
  assert.ok(generator.includes("name.match(/-wave(\\d+)\\.js$/)"));
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
    sourceReturnContext: null,
    sourceReturnRestorePending: null,
    restoreSourceReturnContext() {},
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

test("guided shell honors a saved shelf position while a source return token is active", () => {
  const guided = fs.readFileSync(path.join(root, "public/demo/guided-shell.js"), "utf8");
  assert.match(guided, /__wwamSourceReturnRestore/);
  assert.match(guided, /Closing a clip\/show is a return journey/);
  assert.match(guided, /restoreShelfPosition\(\);/);
});
