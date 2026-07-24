import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const truthSet = JSON.parse(
  fs.readFileSync(path.join(demo, "ask-truth-set.json"), "utf8"),
);

function load(files) {
  const context = { window: {}, setTimeout };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  return context.window;
}

function askFixture() {
  const window = load([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "archive-deep-distill.js",
    "search-engine.js",
  ]);
  return window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
    window.WWAM_CHARACTER_LORE,
    window.WWAM_ARCHIVE_DEEP,
  );
}

function redFixture() {
  const window = load([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "red-band-ranking-v2.js",
    "red-band-query.js",
  ]);
  const ranking = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE,
  });
  return window.WWAMRedBandQuery.create({ ranking });
}

function atlasFixture() {
  const window = load([
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "archive-atlas-ui.js",
  ]);
  const engine = window.WWAMArchiveAtlasEngine.create(window.WWAM_ARCHIVE_ATLAS);
  return window.WWAMArchiveAtlasUI.create({ engine });
}

function firstAtlasTitle(markup) {
  return markup.match(/<article><span>.*?<\/span><h4>(.*?)<\/h4>/s)?.[1];
}

test("the frozen Ask truth set is versioned, bounded, and fully executable", () => {
  assert.equal(truthSet.schema, "shokker.ask-truth-set/v1");
  assert.equal(truthSet.frozen, "2026-07-24");
  assert.equal(truthSet.cases.length, 22);
  assert.equal(new Set(truthSet.cases.map((entry) => entry.id)).size, 22);

  const ask = askFixture();
  const red = redFixture();
  const atlas = atlasFixture();
  const contexts = new Map();

  for (const entry of truthSet.cases) {
    const expected = entry.expect;
    if (entry.surface === "ask") {
      const prior = entry.contextOf ? contexts.get(entry.contextOf) : undefined;
      const answer = ask.ask(entry.query, prior);
      if (expected.intent) assert.equal(answer.intent, expected.intent, entry.id);
      if (expected.status) assert.equal(answer.status, expected.status, entry.id);
      if (expected.resultCount != null) {
        assert.equal(answer.results.length, expected.resultCount, entry.id);
      }
      if (expected.confidence != null) {
        assert.equal(answer.confidence, expected.confidence, entry.id);
      }
      if (expected.sourceId) {
        assert.equal(answer.results[0]?.sourceId, expected.sourceId, entry.id);
      }
      if (expected.kind) assert.equal(answer.results[0]?.kind, expected.kind, entry.id);
      if (expected.at != null) assert.equal(answer.results[0]?.at, expected.at, entry.id);
      if (expected.lane) assert.equal(answer.results[0]?.lane, expected.lane, entry.id);
      if (expected.reviewStatus) {
        assert.equal(answer.results[0]?.reviewStatus, expected.reviewStatus, entry.id);
      }
      if (expected.restrictedToTopicNavigation != null) {
        assert.equal(
          answer.results[0]?.restrictedToTopicNavigation,
          expected.restrictedToTopicNavigation,
          entry.id,
        );
      }
      if (expected.performanceReceiptId) {
        assert.equal(
          answer.results[0]?.performanceReceiptId,
          expected.performanceReceiptId,
          entry.id,
        );
      }
      if (expected.selectionSourceId) {
        assert.equal(
          answer.selectionPlan?.source?.sourceId,
          expected.selectionSourceId,
          entry.id,
        );
      }
      if (expected.selectionMatchMode) {
        assert.equal(
          answer.selectionPlan?.source?.matchMode,
          expected.selectionMatchMode,
          entry.id,
        );
      }
      if (expected.selectionMode) {
        assert.equal(answer.selectionPlan?.mode, expected.selectionMode, entry.id);
      }
      if (expected.selectionResolvedFrom) {
        assert.equal(
          answer.selectionPlan?.resolvedFrom,
          expected.selectionResolvedFrom,
          entry.id,
        );
      }
      if (expected.trueOriginClaim != null) {
        assert.equal(
          answer.results[0]?.archiveBoundary?.trueOriginClaim,
          expected.trueOriginClaim,
          entry.id,
        );
      }
      if (expected.allResultsSameSource) {
        assert.ok(
          answer.results.every((result) => result.sourceId === expected.sourceId),
          entry.id,
        );
      }
      if (expected.targetProximityRequired) {
        assert.ok(
          answer.results.every(
            (result) =>
              result.takeEvidence?.proximityPairs?.length > 0 &&
              result.takeEvidence.proximityPairs.every((pair) => pair.distance <= 8),
          ),
          entry.id,
        );
      }
      if (expected.answerIncludes) {
        assert.match(
          answer.answer,
          new RegExp(expected.answerIncludes.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
          entry.id,
        );
      }
      contexts.set(entry.id, answer.context);
    } else if (entry.surface === "red-rank") {
      const answer = red.analyze(entry.query);
      assert.equal(answer.status, expected.status, entry.id);
      if (expected.rank != null) assert.equal(answer.results[0]?.rank, expected.rank, entry.id);
      if (expected.resultCount != null) {
        assert.equal(answer.results.length, expected.resultCount, entry.id);
      }
    } else {
      const markup = atlas.askMarkup(entry.query);
      assert.equal(firstAtlasTitle(markup), expected.firstTitle, entry.id);
      assert.match(markup, new RegExp(expected.markupIncludes), entry.id);
    }
  }
});
