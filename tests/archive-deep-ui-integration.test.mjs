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

test("Archive Deep is lazy-loaded before Atlas UI and registered as an internal dossier lane", () => {
  assert.doesNotMatch(html, /<script[^>]+archive-deep-(?:distill|engine)\.js/i);
  const createDeepBody = app.slice(
    app.indexOf("function createArchiveDeep"),
    app.indexOf("function loadArchiveDeep"),
  );

  const atlasData = app.indexOf('loadDemoScript("archive-atlas-data.js")');
  const deep = app.indexOf(".then(loadArchiveDeep)", atlasData);
  const atlasEngine = app.indexOf('loadDemoScript("archive-atlas-engine.js")', deep);
  const atlasView = app.indexOf('loadDemoScript("archive-atlas-ui.js")', atlasEngine);
  assert.ok(atlasData >= 0 && atlasData < deep && deep < atlasEngine && atlasEngine < atlasView);

  const deepData = app.indexOf('loadDemoScript("archive-deep-distill.js")');
  const deepEngine = app.indexOf('loadDemoScript("archive-deep-engine.js")', deepData);
  const deepCreate = app.indexOf(".then(createArchiveDeep)", deepEngine);
  assert.ok(deepData >= 0 && deepData < deepEngine && deepEngine < deepCreate);

  assert.match(createDeepBody, /archiveDeepEngine\.browse\(\{ sort: "priority" \}\)\.records/);
  assert.match(createDeepBody, /stream\._lane = "archive"/);
  assert.match(createDeepBody, /Object\.assign\(\{\}, moment, \{ quote: moment\.excerpt \|\| "" \}\)/);
  assert.match(createDeepBody, /streamById\[stream\.id\] = stream/);
  assert.match(
    app,
    /else loadArchiveAtlas\(\)\.then\(function \(\) \{ openLiveDossier\(id, params\.get\("at"\)\); \}\)/,
  );
  assert.match(
    app,
    /streamById\[id\] && streamById\[id\]\._lane === "archive" \? "archive" : "livewire"/,
  );
});

test("Archive Deep lane counts, dossier adaptation, and restricted surfaces stay truthful", () => {
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
  assert.equal(stats.coverage["deeply-indexed"], 44);
  assert.equal(stats.coverage["metadata-only"], 420);
  assert.equal(stats.coverage["caption-limited"], 8);
  assert.equal(stats.lanes["archive-deep-10"], 10);
  assert.equal(stats.deepCoveragePercent, 9.3);

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

  assert.match(atlasUi, /42 short machine candidates remain outside canon and Red Band/);
  assert.match(app, /SOURCE-AUDIO FIREWALL \/\/ TOPIC NAVIGATION ONLY/);
  assert.match(app, /No public joke or character receipts are exposed from this source/);
  assert.match(app, /SPEAKER NOT DIARIZED \/\/ VERIFY AGAINST ORIGINAL/);
});

test("the 42 Archive Deep candidates do not enter Red Band, UP IN YA, or creator output pools", () => {
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
