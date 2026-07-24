import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const atlasUi = fs.readFileSync(path.join(demo, "archive-atlas-ui.js"), "utf8");
const sourceDossierAdapter = fs.readFileSync(
  path.join(demo, "wwam-source-dossier-adapter.js"),
  "utf8",
);
const sourceDossierUi = fs.readFileSync(
  path.join(demo, "source-dossier-ui.js"),
  "utf8",
);

function load(files) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  return context.window;
}

function sourceIds(items) {
  return items.map((item) => item.sourceId || item.tapeId || item.id);
}

test("all four Archive Deep batches and their portfolio are lazy-loaded before Atlas UI", () => {
  assert.doesNotMatch(html, /<script[^>]+archive-deep-(?:distill|batch[234]|engine)\.js/i);
  const createDeepBody = app.slice(
    app.indexOf("function createArchiveDeep"),
    app.indexOf("function loadArchiveDeep"),
  );

  const atlasData = app.indexOf('loadDemoScript("archive-atlas-data.js")');
  const deep = app.indexOf(".then(loadArchiveDeep)", atlasData);
  const atlasEngine = app.indexOf('loadDemoScript("archive-atlas-engine.js")', deep);
  const atlasView = app.indexOf('loadDemoScript("archive-atlas-ui.js")', atlasEngine);
  assert.ok(atlasData >= 0 && atlasData < deep && deep < atlasEngine && atlasEngine < atlasView);

  const deepData = app.indexOf('"archive-deep-distill.js"');
  const batch2 = app.indexOf('"archive-deep-batch2.js"', deepData);
  const batch3 = app.indexOf('"archive-deep-batch3.js"', batch2);
  const batch4 = app.indexOf('"archive-deep-batch4.js"', batch3);
  const deepEngine = app.indexOf('"archive-deep-engine.js"', batch4);
  const portfolio = app.indexOf('"archive-deep-portfolio.js"', deepEngine);
  const deepCreate = app.indexOf(".then(createArchiveDeep)", portfolio);
  assert.ok(
    deepData >= 0
      && deepData < batch2
      && batch2 < batch3
      && batch3 < batch4
      && batch4 < deepEngine
      && deepEngine < portfolio
      && portfolio < deepCreate,
  );

  assert.match(createDeepBody, /WWAMArchiveDeepPortfolio\.create/);
  assert.match(createDeepBody, /WWAM_ARCHIVE_DEEP_BATCH2/);
  assert.match(createDeepBody, /WWAM_ARCHIVE_DEEP_BATCH3/);
  assert.match(createDeepBody, /WWAM_ARCHIVE_DEEP_BATCH4/);
  assert.match(createDeepBody, /archiveDeepEngine\.getSearchPayload\(\)/);
  assert.match(createDeepBody, /stream\._lane = "archive"/);
  assert.match(createDeepBody, /Object\.assign\(\{\}, moment, \{ quote: moment\.excerpt \|\| "" \}\)/);
  assert.match(createDeepBody, /streamById\[stream\.id\] = stream/);
  assert.match(
    app,
    /if \(sourceRoute\) \{[\s\S]{0,240}openSourceDossier\(sourceRoute\.sourceId, sourceRoute\.at/,
  );
  assert.match(
    sourceDossierAdapter,
    /var authority = archiveIds\.has\(id\)[\s\S]{0,90}\? "quarantined-lane"/,
  );
  assert.match(app, /OPENING ARCHIVE DEEP \/\/ 40 CAPTION AUDITS/);
  assert.match(atlasUi, /"archive-deep-10": "AUTOPSIED BATCH 01"/);
  assert.match(atlasUi, /"archive-deep-batch-02": "ARCHIVE DEEP BATCH 02"/);
  assert.match(atlasUi, /"archive-deep-batch-03": "ARCHIVE DEEP BATCH 03"/);
  assert.match(atlasUi, /"archive-deep-batch-04": "ARCHIVE DEEP BATCH 04"/);
  assert.match(
    html,
    /archive-deep-batch3\.js,archive-deep-batch4\.js,archive-deep-engine\.js/,
  );
});

test("Batch 01 remains immutable while Atlas and its current portfolio overlay stay truthful", () => {
  const window = load([
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "archive-deep-distill.js",
    "archive-deep-engine.js",
  ]);
  const atlas = window.WWAMArchiveAtlasEngine.create(window.WWAM_ARCHIVE_ATLAS);
  const engine = window.WWAMArchiveDeepEngine.create(window.WWAM_ARCHIVE_DEEP);
  const streams = engine.browse({ sort: "priority" }).records;
  const metrics = engine.getMetrics();
  const stats = atlas.getStats();

  assert.equal(streams.length, 10);
  assert.equal(metrics.publicMomentCandidates, 42);
  assert.equal(metrics.restricted, 4);
  assert.equal(stats.records, 472);
  assert.equal(stats.coverage["deeply-indexed"], 74);
  assert.equal(stats.coverage["metadata-only"], 390);
  assert.equal(stats.coverage["caption-limited"], 8);
  assert.equal(stats.lanes["archive-deep-10"], 10);
  assert.equal(stats.lanes["archive-deep-batch-02"], 10);
  assert.equal(stats.lanes["archive-deep-batch-03"], 10);
  assert.equal(stats.lanes["archive-deep-batch-04"], 10);
  assert.equal(stats.deepCoveragePercent, 15.7);

  for (const stream of streams) {
    const atlasRecord = atlas.getRecord(stream.id);
    assert.equal(atlasRecord.coverage, "deeply-indexed");
    assert.deepEqual(Array.from(atlasRecord.lanes), ["archive-deep-10"]);

    const adapted = stream.moments.map((moment) => ({
      ...moment,
      quote: moment.excerpt || "",
    }));
    assert.ok(adapted.every((moment) => moment.quote === moment.excerpt));

    if (stream.rightsPolicy.restrictedToTopicNavigation) {
      assert.equal(stream.moments.length, 0);
      assert.equal(stream.characters.length, 0);
      assert.equal(stream.heatmap.length, 0);
      assert.ok(stream.topics.every((topic) => topic.receipt === null));
    }
  }

  assert.match(atlasUi, /CURRENT ' \+ meta\.streams/);
  assert.match(atlasUi, /INDEPENDENT BATCH FINGERPRINTS/);
  assert.match(atlasUi, /archive-batch-fingerprints/);
  assert.match(atlasUi, /QUARANTINED CANDIDATES/);
  assert.match(atlasUi, /BATCH-LOCAL PRIORITY/);
  assert.match(atlasUi, /ATLAS SCORE/);
  assert.match(atlasUi, /CACHED VIEWS/);
  assert.doesNotMatch(atlasUi, /VIEW RANK/);
  assert.match(atlasUi, /TOPIC-ONLY FIREWALLS/);
  assert.match(
    atlasUi,
    /stream\.rightsPolicy\.mode === "visual-context-unverified"/,
  );
  assert.match(sourceDossierUi, /source-dossier-warnings/);
  assert.match(sourceDossierAdapter, /SOURCE-AUDIO FIREWALL \/\/ TOPIC NAVIGATION ONLY/);
  assert.match(
    sourceDossierAdapter,
    /NO PUBLIC JOKE OR CHARACTER RECEIPTS ARE EXPOSED FROM THIS SOURCE/,
  );
  assert.match(sourceDossierUi, /SPEAKER NOT DIARIZED/);
});

test("Batch 01's immutable 42 candidates do not enter Red Band, UP IN YA, or creator output pools", () => {
  const window = load([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "archive-deep-distill.js",
    "archive-deep-engine.js",
    "red-band-ranking-v2.js",
    "showcase-engine.js",
    "creator-studio-engine.js",
  ]);
  const archiveIds = new Set(window.WWAM_ARCHIVE_DEEP.streams.map((stream) => stream.id));
  const redBand = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE,
  });
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });

  assert.ok(window.WWAM_CURATED.upInYa.every((entry) => !archiveIds.has(entry.id)));
  assert.ok(sourceIds(redBand.rankings).every((id) => !archiveIds.has(id)));
  assert.ok(showcase.sources.every((source) => !archiveIds.has(source.id)));
  for (const pool of [clipLab.shorts, clipLab.supercuts, clipLab.resurfacing]) {
    assert.ok(sourceIds(pool).every((id) => !archiveIds.has(id)));
  }
  const outwardPayload = JSON.stringify({
    redBand: redBand.exportSnapshot(),
    upInYa: window.WWAM_CURATED.upInYa,
    showcaseSources: showcase.sources,
    shorts: clipLab.shorts,
    supercuts: clipLab.supercuts,
    resurfacing: clipLab.resurfacing,
  });
  for (const id of archiveIds) {
    assert.equal(outwardPayload.includes(id), false, `${id} leaked into an outward pool`);
  }

  assert.match(app, /return curated\.upInYa\.map\(resolveSoundbyte\)/);
  assert.doesNotMatch(
    app.slice(
      app.indexOf("function createRedBandRanking"),
      app.indexOf("function loadRedBandRanking"),
    ),
    /archiveDeep/,
  );
});

test("caption-timed Archive Deep answers suppress the metadata-only Atlas fallback", () => {
  assert.match(
    app,
    /var timedDeepAnswer = results\.some\(function \(result\) \{[\s\S]{0,320}result\.lane === "archive"[\s\S]{0,220}Number\.isFinite\(Number\(result\.at\)\) && Number\(result\.at\) >= 0/,
  );
  assert.match(app, /var archiveFallback = timedDeepAnswer \? "" : archiveAskMarkup\(query\)/);
});
