import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "red-band-ranking-v2.js"
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file
    });
  }
  return context.window;
}

function createFull(overrides = {}) {
  const window = load();
  const index = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE,
    ...overrides
  });
  return { window, index };
}

function serial(value) {
  return JSON.parse(JSON.stringify(value));
}

function words(value) {
  return String(value).replace(/ …$/, "").trim().split(/\s+/).filter(Boolean);
}

function syntheticSource(id, title, quote, category = "FULL SEND") {
  return {
    source: {
      id,
      title,
      date: "2025-10-31",
      duration: 1000,
      url: `https://www.youtube.com/watch?v=${id}`,
      captioned: true,
      moments: [{ t: 100, quote, category, heat: 90 }]
    }
  };
}

test("creates exactly 100 unique playable bounded receipts over the current archive", () => {
  const { window, index } = createFull();

  assert.equal(window.WWAMRedBandRankingV2.VERSION, "2.0.0");
  assert.equal(window.WWAMRedBandRankingV2.DEFAULT_LIMIT, 100);
  assert.equal(window.WWAMRedBandRankingV2.EXCERPT_WORD_LIMIT, 16);
  assert.equal(index.rankings.length, 100);
  assert.equal(index.metrics.rankedReceipts, 100);
  assert.equal(index.metrics.uniqueRankKeys, 100);
  assert.equal(index.metrics.exactDefaultSatisfied, true);
  assert.ok(index.metrics.playableCandidates > 100);

  const rankKeys = new Set();
  const receiptKeys = new Set();
  index.rankings.forEach((item, offset) => {
    assert.equal(item.rank, offset + 1);
    assert.ok(!rankKeys.has(item.rankKey), item.rankKey);
    rankKeys.add(item.rankKey);
    assert.ok(!receiptKeys.has(`${item.sourceId}@${Math.round(item.t)}`));
    receiptKeys.add(`${item.sourceId}@${Math.round(item.t)}`);
    assert.match(item.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.ok(Number.isFinite(item.t));
    assert.equal(item.tapeId, item.sourceId);
    assert.equal(item.timestamp, item.t);
    assert.ok(item.category);
    assert.ok(item.quote);
    assert.ok(words(item.quote).length <= 16, item.quote);
    assert.equal(item.excerptWordLimit, 16);
    assert.ok(item.score >= 0 && item.score <= 100);
    assert.ok(item.confidence >= 0 && item.confidence <= 1);
    assert.equal(typeof item.humanCurated, "boolean");
    assert.match(item.humanCurationStatus, /HUMAN-CURATED|NO HUMAN-CURATION/);
    assert.equal(typeof item.characterLoreReceipt, "boolean");
    assert.ok(item.whyMemorable.length >= 1);
    assert.ok(item.basis.length >= 4);
  });
});

test("publishes transparent percentile components and never makes speaker or origin claims", () => {
  const { index } = createFull();
  const componentNames = [
    "categoryIntensity",
    "roomBreak",
    "languageVoltage",
    "loreCallback",
    "humanCuration",
    "sourceDiversity"
  ];

  index.rankings.forEach((item) => {
    componentNames.forEach((name) => {
      const component = item.scoreComponents[name];
      assert.ok(component);
      assert.ok(component.raw >= 0);
      assert.ok(component.percentile >= 0 && component.percentile <= 100);
      assert.ok(component.weight > 0);
      assert.ok(component.points >= 0);
    });
    assert.equal(item.scoreComponents.recency.enabled, false);
    assert.equal(item.scoreComponents.recency.adjustment, 0);
    assert.equal(item.scoreComponents.recency.label, "RECENCY EXCLUDED");
    assert.equal(item.speaker, null);
    assert.equal(item.host, null);
    assert.equal(item.trueOriginClaim, false);
    assert.equal(item.syntheticQuote, false);
    assert.equal(item.provenance.speakerStatus, "not-diarized");
    assert.equal(item.provenance.originClaim, false);
    assert.equal(item.provenance.hostAuthorshipClaim, false);
  });
});

test("editorial votes default to literal zero and move scores only when supplied", () => {
  const { index: baseline } = createFull();
  assert.equal(
    baseline.rankings.every((item) => item.editorialVote === 0),
    true
  );
  assert.equal(baseline.diagnostics.editorialVotes.suppliedNonZero, 0);
  assert.equal(
    Object.values(baseline.getEditorialVoteTemplate()).every((vote) => vote === 0),
    true
  );

  const target = baseline.rankings[45];
  const { index: voted } = createFull({
    editorialVotes: { [target.editorialVoteKey]: 5 }
  });
  const changed = voted.getByReceiptKey(target.editorialVoteKey);
  assert.equal(changed.editorialVote, 5);
  assert.equal(changed.scoreComponents.editorialVote.adjustment, 7.5);
  assert.equal(
    changed.scoreComponents.editorialVote.source,
    "SUPPLIED EDITORIAL VOTE"
  );
  assert.ok(changed.score > target.score);
});

test("recency is opt-in, explicitly labeled, and bounded", () => {
  const { index: baseline } = createFull();
  const { index: recency } = createFull({ includeRecency: true });

  assert.equal(baseline.diagnostics.recency.enabled, false);
  assert.equal(recency.diagnostics.recency.enabled, true);
  assert.equal(
    recency.diagnostics.recency.label,
    "RECENCY BOOST (EXPLICITLY ENABLED)"
  );
  recency.rankings.forEach((item) => {
    assert.equal(item.scoreComponents.recency.enabled, true);
    assert.match(item.scoreComponents.recency.label, /EXPLICITLY ENABLED/);
    assert.ok(Math.abs(item.scoreComponents.recency.adjustment) <= 3);
  });
});

test("ranking is deterministic even when all input arrays are reversed", () => {
  const window = load();
  const baseline = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE
  });
  const reversed = window.WWAMRedBandRankingV2.create({
    catalog: [...window.WWAM_CATALOG].reverse(),
    deep: {
      ...window.WWAM_DEEP_DISTILL,
      tapes: [...window.WWAM_DEEP_DISTILL.tapes].reverse().map((tape) => ({
        ...tape,
        moments: [...tape.moments].reverse()
      })),
      hot100: [...window.WWAM_DEEP_DISTILL.hot100].reverse()
    },
    live: {
      ...window.WWAM_LIVESTREAMS,
      streams: [...window.WWAM_LIVESTREAMS.streams].reverse().map((stream) => ({
        ...stream,
        moments: [...stream.moments].reverse()
      }))
    },
    popular: {
      ...window.WWAM_POPULAR_LIVE,
      streams: [...window.WWAM_POPULAR_LIVE.streams].reverse().map((stream) => ({
        ...stream,
        moments: [...stream.moments].reverse()
      }))
    },
    curation: {
      ...window.WWAM_CURATED,
      upInYa: [...window.WWAM_CURATED.upInYa].reverse()
    },
    characters: {
      ...window.WWAM_CHARACTER_LORE,
      characters: [...window.WWAM_CHARACTER_LORE.characters].reverse().map((character) => ({
        ...character,
        soundbytes: [...(character.soundbytes || [])].reverse(),
        creatorContext: [...(character.creatorContext || [])].reverse()
      }))
    }
  });

  assert.deepEqual(
    serial(reversed.rankings),
    serial(baseline.rankings)
  );
  assert.equal(reversed.metrics.archiveFingerprint, baseline.metrics.archiveFingerprint);
});

test("content-derived tie resolution does not follow source-ID lexical order", () => {
  const window = load();
  const first = syntheticSource(
    "aaa-source",
    "Second Content Tape",
    "goddamn killer nightmare garbage breaks the room into helpless laughter"
  );
  const second = syntheticSource(
    "zzz-source",
    "First Content Tape",
    "fucking murder theory turns into a giant callback and everyone loses it"
  );
  const create = (sources) =>
    window.WWAMRedBandRankingV2.create({
      catalog: [],
      deep: {},
      live: { streams: sources.map((item) => item.source) },
      popular: {},
      curation: {},
      characters: {},
      limit: 2
    });

  const original = create([first, second]);
  const renamed = create([
    {
      source: {
        ...first.source,
        id: "zzz-renamed",
        url: "https://www.youtube.com/watch?v=zzz-renamed"
      }
    },
    {
      source: {
        ...second.source,
        id: "aaa-renamed",
        url: "https://www.youtube.com/watch?v=aaa-renamed"
      }
    }
  ]);

  assert.deepEqual(
    original.rankings.map((item) => item.quote),
    renamed.rankings.map((item) => item.quote)
  );
  assert.match(original.diagnostics.collisions.tieBreakPolicy, /Source-ID lexical order is never/);
});

test("diagnostics report lane, franchise, category, collision, and tie health", () => {
  const { index } = createFull();
  const diversity = index.diagnostics.diversity;
  const collisions = index.diagnostics.collisions;

  assert.ok(diversity.ranked.lanes.length >= 2);
  assert.ok(diversity.ranked.franchises.length >= 4);
  assert.ok(diversity.ranked.categories.length >= 4);
  assert.ok(diversity.ranked.uniqueSources > 10);
  assert.ok(diversity.ranked.sourceConcentration > 0);
  assert.ok(collisions.ingestedContributions > collisions.uniquePlayableCandidates);
  assert.ok(collisions.mergedReceiptCollisions > 0);
  assert.equal(collisions.rankKeyCollisions, 0);
  assert.match(collisions.tieBreakPolicy, /content-derived fingerprint/);
  assert.equal(index.diagnostics.curation.supplied, 25);
  assert.ok(index.diagnostics.curation.matchedToPlayableReceipt >= 20);
});

test("small archives honestly return every available playable receipt", () => {
  const window = load();
  const source = syntheticSource(
    "small-source",
    "Small Archive",
    "the room breaks when the killer take goes completely nuclear"
  );
  const index = window.WWAMRedBandRankingV2.create({
    catalog: [],
    deep: {},
    live: { streams: [source.source] },
    popular: {},
    curation: {},
    characters: {}
  });

  assert.equal(index.rankings.length, 1);
  assert.equal(index.metrics.playableCandidates, 1);
  assert.equal(index.metrics.exactDefaultSatisfied, true);
});
