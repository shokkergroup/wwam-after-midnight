import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const uiPath = path.join(demo, "era-capsule-ui.js");
const cssPath = path.join(demo, "era-capsule.css");
const htmlPath = path.join(demo, "index.html");
const uiSource = fs.readFileSync(uiPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const html = fs.readFileSync(htmlPath, "utf8");

function loadApi() {
  const context = { window: { URL } };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(uiSource, context, { filename: "era-capsule-ui.js" });
  return context.window.WWAMEraCapsuleUI;
}

function node() {
  const attributes = new Map();
  const listeners = new Map();
  return {
    disabled: false,
    value: "",
    innerHTML: "",
    textContent: "",
    onclick: null,
    style: {},
    focusCount: 0,
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) || null; },
    addEventListener(name, handler) { listeners.set(name, handler); },
    removeEventListener(name) { listeners.delete(name); },
    dispatch(name, event = {}) {
      const handler = listeners.get(name);
      if (handler) handler({ preventDefault() {}, ...event });
    },
    focus() { this.focusCount += 1; },
    querySelector() { return null; },
  };
}

function capsule(year) {
  const quarantinedYear = year === 2025;
  const stops = Array.from({ length: 5 }, (_, index) => ({
    order: index + 1,
    receiptId: `r${index}`,
    sourceId: `s${index}`,
    sourceTitle: `${year} TAPE ${index + 1}`,
    date: `${year}-10-0${index + 1}`,
    t: 60 + index,
    timecode: `00:01:0${index}`,
    url: `https://www.youtube.com/watch?v=source0000${index}&t=${60 + index}s`,
    label: quarantinedYear ? "ARCHIVE DEEP QUARANTINE" : "INDEXED RECEIPT",
    excerpt: `Bounded excerpt ${index + 1}`,
    evidenceLevel: quarantinedYear
      ? "archive-deep-quarantine"
      : "timestamp-bound",
  }));
  return {
    schema: "shokker-era-capsule/v1",
    version: "1.0.0",
    year,
    title: `${year} archive time capsule`,
    snapshotDate: "2026-07-23",
    status: "verified",
    labels: {},
    policy: {},
    feed: {
      basis: "cached-streams-feed",
      uploads: year === 2025 ? 94 : 37,
      totalDurationSeconds: 800_640,
      hours: 222.4,
      cachedViews: 637_619,
      viewBasis: "cached",
      coverage: {
        deeplyIndexed: 14,
        metadataOnly: 80,
        captionLimited: 0,
        unavailable: 0,
      },
      topUploads: [{
        sourceId: "metadata001",
        title: "TITLE METADATA ONLY",
        date: `${year}-12-01`,
        durationSeconds: 7_200,
        cachedViews: 99_999,
        thumbnail: "https://i.ytimg.com/example.jpg",
        url: "https://www.youtube.com/watch?v=metadata001",
        coverage: "metadata-only",
      }],
    },
    memory: {
      available: !quarantinedYear,
      basis: "promoted-corpus",
      sourceCount: quarantinedYear ? 0 : 12,
      receiptCount: quarantinedYear ? 0 : 96,
      loreArrivalCount: quarantinedYear ? 0 : 2,
      sources: [],
      receiptPreview: quarantinedYear ? [] : [{
        sourceTitle: "INDEXED SOURCE",
        date: `${year}-01-01`,
        t: 45,
        timecode: "00:00:45",
        url: "https://www.youtube.com/watch?v=indexed0001&t=45s",
        excerpt: "A bounded public excerpt",
        evidenceLevel: "caption-audited",
      }],
      loreArrivals: [],
    },
    quarantine: {
      available: quarantinedYear,
      basis: "archive-deep",
      sourceCount: quarantinedYear ? 14 : 0,
      candidateCount: quarantinedYear ? 68 : 0,
      topicLaneCount: quarantinedYear ? 18 : 0,
      promotionAllowed: false,
      speakerDiarized: false,
      candidates: quarantinedYear ? [{
        sourceTitle: "QUARANTINED SOURCE",
        excerpt: "Machine surfaced this bounded fragment",
        archiveBatch: { id: "archive-deep-batch-02" },
        speaker: null,
        promotionAllowed: false,
      }] : [],
      topics: quarantinedYear ? [{
        label: "HALLOWEEN",
        speaker: null,
        promotionAllowed: false,
      }] : [],
    },
    route: {
      available: true,
      basis: quarantinedYear ? "archive-deep-quarantine" : "promoted-corpus",
      count: 5,
      stops,
      autoplay: false,
    },
    provenance: {
      atlasFingerprint: "fnv1a32:atlas",
      showcaseFingerprint: "fnv1a32:showcase",
      archiveDeepFingerprint: "fnv1a32:deep",
    },
    fingerprint: `fnv1a32:${year}`,
  };
}

function mountedController(initialYear = 2025) {
  const ids = [
    "time-capsules",
    "eraCapsuleForm",
    "eraCapsuleYear",
    "eraCapsuleBuild",
    "eraCapsuleStatus",
    "eraCapsuleStage",
  ];
  const nodes = new Map(ids.map((id) => [id, node()]));
  const copy = node();
  const download = node();
  const focus = node();
  nodes.get("eraCapsuleStage").querySelector = (selector) => ({
    "[data-era-copy]": copy,
    "[data-era-download]": download,
    "[data-era-result-focus]": focus,
  })[selector] || null;
  const document = {
    body: {
      classList: { contains() { return false; } },
      appendChild() {},
    },
    getElementById(id) { return nodes.get(id) || null; },
    createElement() { return node(); },
  };
  let serialized = 0;
  let copied = "";
  let downloaded = null;
  const engine = {
    getYears() { return [2026, 2025, 2019]; },
    build(year) { return capsule(Number(year)); },
    verify(value) {
      return { ok: value && value.schema === "shokker-era-capsule/v1" };
    },
    serialize(value) {
      serialized += 1;
      return JSON.stringify({ schema: value.schema, year: value.year });
    },
  };
  const api = loadApi();
  const controller = api.create({
    engine,
    document,
    location: {
      href: `https://wiki.example/demo/?capsuleYear=${initialYear}#time-capsules`,
    },
    navigator: {},
    URL,
    copyText(value) { copied = value; },
    download(name, contents) { downloaded = { name, contents }; },
  });
  controller.mount();
  return {
    controller,
    nodes,
    copy,
    download,
    focus,
    readCopied: () => copied,
    readDownloaded: () => downloaded,
    readSerialized: () => serialized,
  };
}

test("Time Capsules hydrate as one ordered lazy feature and stay off the eager path", () => {
  assert.match(html, /href="#time-capsules"[^>]*><b>Time Capsules<\/b>/);
  assert.match(
    html,
    /<section class="era-capsule" id="time-capsules"[\s\S]{0,180}data-feature-styles="era-capsule\.css"[\s\S]{0,500}data-feature-scripts="[^"]*archive-deep-distill\.js[^"]*archive-atlas-data\.js[^"]*era-capsule-engine\.js,era-capsule-ui\.js\?v=1\.1\.0-human"/,
  );
  assert.doesNotMatch(html, /<script[^>]+src="era-capsule-(?:engine|ui)\.js"/);
  assert.doesNotMatch(html, /<link[^>]+href="era-capsule\.css"/);
  assert.ok(
    html.indexOf('id="time-capsules"') <
      html.indexOf('<script src="feature-loader.js"></script>'),
  );
});

test("the static surface is accessible before its lazy controller arrives", () => {
  for (const id of [
    "eraCapsuleForm",
    "eraCapsuleHelp",
    "eraCapsuleYear",
    "eraCapsuleBuild",
    "eraCapsuleStatus",
    "eraCapsuleStage",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /<label for="eraCapsuleYear">/);
  assert.match(html, /id="eraCapsuleYear" aria-describedby="eraCapsuleHelp" disabled/);
  assert.match(
    html,
    /id="eraCapsuleStatus" role="status"\s+aria-live="polite" aria-atomic="true"/,
  );
  assert.match(html, /UPLOAD LIST FROM THE WWAM FEED/);
  assert.match(html, /UNCHECKED MOMENTS STAY OFF THE MAIN LIST/);
  assert.match(html, /NO AUTOPLAY/);
});

test("public helpers keep year routing and time display deterministic", () => {
  const api = loadApi();
  assert.equal(api.VERSION, "1.0.0");
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.normalizeYears([2025, "2026", 2025, 0, null]))),
    [2026, 2025],
  );
  assert.equal(api.timecode(3_661), "01:01:01");
  assert.equal(api.formatHours(8_010), "2.2H");
  assert.equal(
    api.capsuleLink(
      "https://wiki.example/demo/?ask=loomis#ask",
      2025,
      URL,
    ),
    "https://wiki.example/demo/?ask=loomis&capsuleYear=2025#time-capsules",
  );
});

test("the controller opens the requested year with fan labels and folds internal review data away", () => {
  const harness = mountedController(2025);
  const state = harness.controller.getState();
  const markup = harness.nodes.get("eraCapsuleStage").innerHTML;

  assert.equal(state.mounted, true);
  assert.equal(state.year, 2025);
  assert.equal(state.error, "");
  assert.match(markup, /94<\/b><span>SHOWS FOUND/);
  assert.match(markup, /222\.4H<\/b><span>HOURS ON AIR/);
  assert.match(markup, /637,619<\/b><span>VIEWS AT OUR LAST CHECK/);
  assert.match(markup, /14 SHOW WIKIS \/\/ 80 WATCH ONLY/);
  assert.match(markup, /NOTHING WAS FILLED IN FROM TITLES ALONE/);
  assert.match(markup, /hidden aria-hidden="true"/);
  assert.match(markup, /MOMENTS STILL BEING CHECKED/);
  assert.match(markup, /VOICE NOT CONFIRMED/);
  assert.match(markup, /ARCHIVE-DEEP-BATCH-02/);
  assert.doesNotMatch(markup, /\[OBJECT OBJECT\]/);
  assert.equal(
    (markup.match(/PLAY ON YOUTUBE/g) || []).length,
    5,
  );
  assert.match(markup, /MOMENT TO CHECK/);
  assert.doesNotMatch(markup, /autoplay\s*=\s*["']?true/i);
});

test("2019 can expose indexed memory without pretending it belongs to the feed ledger", () => {
  const harness = mountedController(2019);
  const markup = harness.nodes.get("eraCapsuleStage").innerHTML;

  assert.match(markup, /WHAT THE TAPES REMEMBER/);
  assert.match(markup, /12 MAPPED SHOWS \/\/ 96 PLAYABLE MOMENTS/);
  assert.match(markup, /moments and running bits this archive can open at the right second/i);
  assert.match(markup, /PLAYABLE MOMENT/);
  assert.match(markup, /VOICE NOT CONFIRMED/);
});

test("copy and export reverify the capsule and emit only bounded engine output", async () => {
  const harness = mountedController(2025);
  harness.copy.onclick();
  await Promise.resolve();
  assert.match(
    harness.readCopied(),
    /capsuleYear=2025#time-capsules$/,
  );
  harness.download.onclick();
  assert.equal(harness.readSerialized(), 1);
  assert.match(
    harness.readDownloaded().name,
    /^wwam-time-capsule-2025-fnv1a32-2025\.json$/,
  );
  assert.deepEqual(
    JSON.parse(harness.readDownloaded().contents),
    { schema: "shokker-era-capsule/v1", year: 2025 },
  );
});

test("runtime construction is closure-independent and optional enrichment fails honestly", () => {
  assert.match(uiSource, /WWAMArchiveAtlasEngine\.create\(root\.WWAM_ARCHIVE_ATLAS\)/);
  assert.match(uiSource, /WWAMShowcaseEngine\.create\(\{/);
  assert.match(uiSource, /WWAMLoreEngine\.create\(\{/);
  assert.match(uiSource, /WWAMArchiveDeepPortfolio\.create\(\[/);
  assert.match(uiSource, /root\.WWAM_ARCHIVE_DEEP_BATCH4/);
  assert.match(
    uiSource,
    /rawBatch && typeof rawBatch === "object" \? rawBatch\.id : rawBatch/,
  );
  assert.match(uiSource, /showcase:\s*showcase/);
  assert.match(uiSource, /lore:\s*lore/);
  assert.match(uiSource, /archiveDeep:\s*archiveDeep/);
  assert.match(uiSource, /The cached archive ledger did not initialize/);
  assert.match(uiSource, /TIME CAPSULE PAUSED/);
  assert.match(uiSource, /We could not open the yearbook right now/);
});

test("manifest, playback, and dynamic-copy boundaries are explicit in source", () => {
  assert.match(uiSource, /engine\.verify\(state\.capsule\)/);
  assert.match(uiSource, /engine\.serialize\(state\.capsule\)/);
  assert.match(uiSource, /never raw captions or media/i);
  assert.match(uiSource, /target="_blank" rel="noopener"/);
  assert.match(uiSource, /displayText\(upload\.title, documentRef\)/);
  assert.match(uiSource, /esc\(displayText\(stop\.excerpt \|\| stop\.sourceTitle, documentRef\)\)/);
  assert.doesNotMatch(uiSource, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.doesNotMatch(uiSource, /<video|<iframe|autoplay=["']?true/i);
});

test("the isolated visual layer has responsive, keyboard, and reduced-motion states", () => {
  assert.ok(fs.statSync(uiPath).size < 30_000);
  assert.ok(fs.statSync(cssPath).size < 16_000);
  assert.match(css, /V5\.9 \/\/ THE YEARS HAVE TEETH/);
  assert.match(css, /\.era-capsule :where\(a, button, select\):focus-visible/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 470px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.era-capsule-loading i\s*\{\s*animation:\s*none;/);
});
