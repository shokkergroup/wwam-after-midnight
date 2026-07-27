import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const uiPath = path.join(demo, "archive-atlas-ui.js");

function load() {
  const context = { window: {}, setTimeout };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "archive-atlas-ui.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const engine = context.window.WWAMArchiveAtlasEngine.create(
    context.window.WWAM_ARCHIVE_ATLAS,
  );
  const ui = context.window.WWAMArchiveAtlasUI.create({ engine });
  return { window: context.window, engine, ui };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function firstTitle(markup) {
  return markup.match(/<article><span>.*?<\/span><h4>(.*?)<\/h4>/s)?.[1];
}

function renderedPortfolio() {
  const nodes = new Map();
  function node() {
    return {
      disabled: false,
      hidden: true,
      innerHTML: "",
      textContent: "",
      addEventListener() {},
      removeEventListener() {},
      setAttribute() {},
    };
  }
  nodes.set("archive", node());
  nodes.set("archiveBatch", node());
  nodes.set("archiveGrid", node());
  nodes.set("archiveStatus", node());
  nodes.set("archiveLoadMore", node());
  const document = {
    addEventListener() {},
    getElementById(id) { return nodes.get(id) || null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  const context = { window: {}, setTimeout };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "archive-atlas-ui.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const archiveDeepEngine = context.window.WWAMArchiveDeepPortfolio.create(
    [
      context.window.WWAM_ARCHIVE_DEEP,
      context.window.WWAM_ARCHIVE_DEEP_BATCH2,
      context.window.WWAM_ARCHIVE_DEEP_BATCH3,
      context.window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    context.window.WWAMArchiveDeepEngine,
  );
  const engine = context.window.WWAMArchiveAtlasEngine.create(
    context.window.WWAM_ARCHIVE_ATLAS,
  );
  const deepRecord = engine.getRecord("2FlxuJxv81s");
  const metadataRecord = engine.browse({ coverage: "metadata-only", limit: 1 }).records[0];
  const focusedEngine = {
    formula: engine.formula,
    getStats: (...args) => engine.getStats(...args),
    getCoverage: (...args) => engine.getCoverage(...args),
    getBuckets: (...args) => engine.getBuckets(...args),
    getFilterOptions: (...args) => engine.getFilterOptions(...args),
    getRecord: (...args) => engine.getRecord(...args),
    browse: () => ({ total: 2, records: [deepRecord, metadataRecord] }),
    search: (...args) => engine.search(...args),
    getDistillQueue: (...args) => engine.getDistillQueue(...args),
    getProvenance: (...args) => engine.getProvenance(...args),
  };
  context.window.WWAMArchiveAtlasUI.create({
    engine: focusedEngine,
    archiveDeepEngine,
    document,
  }).mount();
  return {
    batch: nodes.get("archiveBatch").innerHTML,
    grid: nodes.get("archiveGrid").innerHTML,
    deepRecord,
    metadataRecord,
    deepSummary: archiveDeepEngine.getStream(deepRecord.id).summary,
  };
}

test("publishes a compact isolated UI controller with lifecycle and Ask APIs", () => {
  const { window, ui } = load();

  assert.ok(fs.statSync(uiPath).size < 36_000);
  assert.equal(window.WWAMArchiveAtlasUI.VERSION, "1.4.1");
  for (const method of [
    "mount",
    "setEngine",
    "setLoading",
    "setError",
    "askMarkup",
    "getCopy",
    "getState",
    "destroy",
  ]) {
    assert.equal(typeof ui[method], "function", method);
  }
  assert.deepEqual(plain(ui.getState()), {
    query: "",
    year: "",
    month: "",
    coverage: "",
    limit: 18,
    busy: false,
    error: "",
    mounted: false,
    lastTotal: 0,
    lastShown: 0,
  });
});

test("snapshot and queue copy describe exactly what the evidence and formula prove", () => {
  const { ui } = load();
  const copy = ui.getCopy();

  assert.match(copy.snapshot, /Browse every WWAM livestream/i);
  assert.match(copy.snapshot, /2026-07-23/);
  assert.match(copy.boundary, /usable captions open as full Wikis/i);
  assert.match(copy.boundary, /watch-only instead of pretending/i);
  assert.match(copy.queue, /archive-distill-priority\/v1/);
  assert.match(copy.queue, /0–50/);
  assert.match(copy.queue, /0–30/);
  assert.match(copy.queue, /0–20/);
  assert.match(copy.queue, /eligibility; it adds no points/i);
  assert.match(copy.queue, /no transcript, speaker, sentiment, humor, or topic score/i);
});

test("Ask applies oldest, newest, and cached-view ordering after title matching", () => {
  const { ui } = load();
  const oldest = ui.askMarkup("oldest Scream uploads");
  const newest = ui.askMarkup("newest Scream uploads");
  const viewed = ui.askMarkup("most viewed Scream uploads");
  const hyphenated = ui.askMarkup("What is the most-viewed Halloween livestream?");
  const pluralQuestion = ui.askMarkup("What are the oldest Scream uploads?");

  assert.equal(firstTitle(oldest), "HALLOWEEN KILLS + SCREAM 5 UPDATES! Live!");
  assert.equal(firstTitle(newest), "SCREAM 7 Spoiler Review Party!");
  assert.equal(
    firstTitle(viewed),
    "Ranking HALLOWEEN + SCREAM + ANOES + FRIDAY THE 13th Live!",
  );
  assert.match(oldest, /ORDER: UPLOAD DATE, OLDEST FIRST/);
  assert.match(newest, /ORDER: UPLOAD DATE, NEWEST FIRST/);
  assert.match(viewed, /ORDER: CACHED VIEWS, HIGHEST FIRST/);
  assert.equal(firstTitle(hyphenated), "HALLOWEEN ENDS Spoiler Party Live!");
  assert.match(hyphenated, /ORDER: CACHED VIEWS, HIGHEST FIRST/);
  assert.equal(firstTitle(pluralQuestion), "HALLOWEEN KILLS + SCREAM 5 UPDATES! Live!");
  assert.match(pluralQuestion, /ORDER: UPLOAD DATE, OLDEST FIRST/);
});

test("alias-aware Ask filtering rejects substring collateral before metadata sorting", () => {
  const { ui } = load();
  const oldest = ui.askMarkup("oldest Scream uploads");
  const trailers = ui.askMarkup("newest Scream trailer uploads");

  assert.doesNotMatch(oldest, /WWAM Livescream/);
  assert.match(oldest, /SCREAM 5/);
  assert.doesNotMatch(trailers, /SCREAM 7 Spoiler Review Party/);
  assert.match(trailers, /SCREAM 7 Teaser Trailer Breakdown/);
  assert.match(oldest, /SOURCE DISCOVERY \/\/ NOT A CONTENT ANSWER/);
  assert.match(oldest, /do not establish what anyone said/i);
});

test("Ask stays inside upload discovery and never impersonates transcript search", () => {
  const { ui } = load();

  assert.equal(ui.askMarkup("What did they think about Scream?"), "");
  const discovery = ui.askMarkup("Which Scream streams were uploaded in 2025?");
  assert.match(discovery, /CACHED 2026-07-23 SNAPSHOT/);
  assert.match(discovery, /2025-/);
  assert.doesNotMatch(discovery, /speaker|quote|transcript result/i);
});

test("loading and error transitions remain explicit even before a DOM is mounted", () => {
  const { ui } = load();

  ui.setLoading(true);
  assert.equal(ui.getState().busy, true);
  ui.setLoading(false);
  assert.equal(ui.getState().busy, false);
  ui.setError("ARCHIVE TEST FAILURE");
  assert.deepEqual(plain(ui.getState()), {
    query: "",
    year: "",
    month: "",
    coverage: "",
    limit: 18,
    busy: false,
    error: "ARCHIVE TEST FAILURE",
    mounted: false,
    lastTotal: 0,
    lastShown: 0,
  });
});

test("source contract includes live status, busy state, disabled controls, and focus restoration", () => {
  const source = fs.readFileSync(uiPath, "utf8");

  assert.match(source, /setAttribute\("role", "status"\)/);
  assert.match(source, /setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /setAttribute\("aria-busy"/);
  assert.match(source, /control\.disabled = Boolean\(disabled\)/);
  assert.match(source, /focusGenerated\("data-archive-year"/);
  assert.match(source, /focusGenerated\("data-archive-month"/);
  assert.match(source, /focusGenerated\("data-archive-coverage"/);
  assert.match(source, /ARCHIVE LEDGER IS STILL LOADING/);
  assert.doesNotMatch(source, /scheduleIdle|IntersectionObserver|createElement\("script"\)/);
});

test("Archive Deep overlay keeps all forty source doors without exposing production scoring", () => {
  const source = fs.readFileSync(uiPath, "utf8");

  assert.match(source, /40 OLDER SHOWS WITH EXTRA CHAPTERS/);
  assert.match(source, /THE DEEP-DIVE SHELF/);
  assert.match(source, /DEEP DIVE #/);
  assert.match(source, /VIEWS WHEN ADDED/);
  assert.match(source, /TOPIC JUMPS ONLY/);
  assert.match(source, /ARTWORK NEEDS A LOOK/);
  assert.doesNotMatch(source, /BATCH-LOCAL PRIORITY|PORTFOLIO #|ATLAS SCORE|publicFnv1a|VISUAL RESULT UNVERIFIED/);
});

test("renders all 40 deep-dive show doors with fan-facing labels", () => {
  const { batch: markup } = renderedPortfolio();

  assert.match(markup, /40 OLDER SHOWS WITH EXTRA CHAPTERS/);
  assert.match(markup, /THE DEEP-DIVE SHELF/);
  assert.match(markup, /445,949/);
  assert.equal((markup.match(/data-archive-open=/g) || []).length, 40);
  assert.equal((markup.match(/DEEP DIVE #/g) || []).length, 40);
  assert.match(markup, /TOPIC JUMPS ONLY/);
  assert.match(markup, /ARTWORK NEEDS A LOOK/);
  assert.equal((markup.match(/OPEN SHOW WIKI &rarr;/g) || []).length, 40);
  assert.equal((markup.match(/aria-label="Open show wiki for /g) || []).length, 40);
  assert.doesNotMatch(markup, /QUARANTINED|FINGERPRINT|BATCH-LOCAL|ATLAS SCORE|NaN|undefined/);
});

test("main Atlas cards turn registered data into natural show summaries and preserve every source door", () => {
  const { grid, deepRecord, metadataRecord } = renderedPortfolio();
  const cards = grid.match(/<article class="archive-card[\s\S]*?<\/article>/g) || [];

  assert.equal(cards.length, 2);
  assert.equal((grid.match(/data-archive-open=/g) || []).length, 2);
  assert.equal((grid.match(/class="archive-card-summary"/g) || []).length, 1);
  assert.match(grid, /WHAT THIS NIGHT WAS ABOUT/);
  assert.match(grid, /Start with/);
  assert.doesNotMatch(grid, /machine-surfaced|REGISTERED DISTILL|source-locked|unverified until human review/);

  const deepCard = cards.find((card) => card.includes(deepRecord.title));
  const metadataCard = cards.find((card) => card.includes(metadataRecord.title));
  assert.match(deepCard, /archive-card-summary/);
  assert.doesNotMatch(metadataCard, /archive-card-summary/);
  assert.match(metadataCard, /WATCH ONLY/);
});

test("deep cards may receive a registered summary from another indexed lane without leaking to metadata cards", () => {
  const nodes = new Map();
  function node() {
    return {
      disabled: false,
      hidden: true,
      innerHTML: "",
      textContent: "",
      addEventListener() {},
      removeEventListener() {},
      setAttribute() {},
    };
  }
  for (const id of ["archive", "archiveBatch", "archiveGrid", "archiveStatus", "archiveLoadMore"]) {
    nodes.set(id, node());
  }
  const document = {
    addEventListener() {},
    getElementById(id) { return nodes.get(id) || null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  const { window, engine } = load();
  const fresh = engine.getRecord("LV2rmwEA0w4");
  const metadata = engine.browse({ coverage: "metadata-only", limit: 1 }).records[0];
  const focusedEngine = {
    formula: engine.formula,
    getStats: (...args) => engine.getStats(...args),
    getCoverage: (...args) => engine.getCoverage(...args),
    getBuckets: (...args) => engine.getBuckets(...args),
    getFilterOptions: (...args) => engine.getFilterOptions(...args),
    getRecord: (...args) => engine.getRecord(...args),
    browse: () => ({ total: 2, records: [fresh, metadata] }),
    search: (...args) => engine.search(...args),
    getDistillQueue: (...args) => engine.getDistillQueue(...args),
    getProvenance: (...args) => engine.getProvenance(...args),
  };
  const registered = "A registered caption-backed live-room summary.";

  window.WWAMArchiveAtlasUI.create({
    engine: focusedEngine,
    document,
    getSourceSummary(id) { return id === fresh.id || id === metadata.id ? registered : ""; },
  }).mount();

  const markup = nodes.get("archiveGrid").innerHTML;
  const cards = markup.match(/<article class="archive-card[\s\S]*?<\/article>/g) || [];
  assert.equal((markup.match(/class="archive-card-summary"/g) || []).length, 1);
  assert.match(cards.find((card) => card.includes(fresh.title)), /This Show Wiki has a recap, topic jumps, and a few good places to start/);
  assert.doesNotMatch(cards.find((card) => card.includes(metadata.title)), /archive-card-summary/);
});

test("rejects an incompatible engine instead of rendering plausible empty archive UI", () => {
  const { window } = load();

  assert.throws(
    () => window.WWAMArchiveAtlasUI.create({ engine: { getStats() {} } }),
    /incompatible engine/i,
  );
});
