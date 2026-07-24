import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function actualFixture() {
  const window = load([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "lore-engine.js",
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "era-capsule-engine.js",
  ]);
  const atlas = window.WWAMArchiveAtlasEngine.create(window.WWAM_ARCHIVE_ATLAS);
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const lore = window.WWAMLoreEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
  });
  const archiveDeep = window.WWAMArchiveDeepPortfolio.create({
    batches: [
      plain(window.WWAM_ARCHIVE_DEEP),
      plain(window.WWAM_ARCHIVE_DEEP_BATCH2),
      plain(window.WWAM_ARCHIVE_DEEP_BATCH3),
    ],
    engineFactory: window.WWAMArchiveDeepEngine,
  });
  const engine = window.ShokkerEraCapsuleEngine.create({
    atlas,
    showcase,
    lore,
    archiveDeep,
    labels: {
      channelName: "WWAM",
      capsuleName: "THE YEARS HAVE TEETH",
      feed: "THE MARQUEE",
      memory: "WHAT THE TAPES REMEMBER",
      quarantine: "THE QUARANTINE DRAWER",
      route: "PLAY THE YEAR",
    },
  });
  return { window, atlas, showcase, lore, archiveDeep, engine };
}

function neutralAtlas(records) {
  const values = records.slice();
  const years = [...new Set(values.map((record) => Number(record.date.slice(0, 4))))];
  return {
    getFilterOptions() {
      return {
        years: years.map((year) => ({ value: year, count: values.length })),
      };
    },
    browse({ year }) {
      return {
        records: values.filter((record) => record.date.startsWith(`${year}-`)),
      };
    },
    getProvenance() {
      return { snapshotDate: "2026-07-24" };
    },
    verifyFingerprint() {
      return { ok: true, actual: "fnv1a32:neutral" };
    },
  };
}

function neutralFixture({ reverse = false, optional = true } = {}) {
  const records = [
    {
      id: "abcDEF12345",
      title: "Release Workshop",
      date: "2022-02-03",
      duration: 1800,
      views: 200,
      thumbnail: "https://i.ytimg.com/vi/abcDEF12345/maxresdefault.jpg",
      coverage: "deeply-indexed",
    },
    {
      id: "zyxWVU98765",
      title: "Community Questions",
      date: "2022-09-10",
      duration: 3600,
      views: 400,
      thumbnail: "https://i.ytimg.com/vi/zyxWVU98765/maxresdefault.jpg",
      coverage: "metadata-only",
    },
  ];
  const sources = [
    {
      id: "abcDEF12345",
      title: "Release Workshop",
      date: "2022-02-03",
      duration: 1800,
      views: 200,
      thumbnail: "https://i.ytimg.com/vi/abcDEF12345/maxresdefault.jpg",
      type: "workshop",
      lanes: ["release"],
    },
  ];
  const receipts = [
    {
      id: "receipt:one",
      sourceId: "abcDEF12345",
      sourceTitle: "Release Workshop",
      date: "2022-02-03",
      t: 75,
      type: "topic-chapter",
      category: "RELEASE PROCESS",
      excerpt: "A careful explanation of the release process and the decisions behind it.",
      evidenceLevel: "indexed",
      score: 80,
    },
    {
      id: "receipt:two",
      sourceId: "abcDEF12345",
      sourceTitle: "Release Workshop",
      date: "2022-02-03",
      t: 940,
      type: "moment",
      category: "COMMUNITY QUESTION",
      excerpt: "The hosts answer a practical audience question with a useful example.",
      evidenceLevel: "indexed",
      score: 60,
    },
  ];
  const atlas = neutralAtlas(reverse ? records.slice().reverse() : records);
  const showcase = optional ? {
    sources: reverse ? sources.slice().reverse() : sources,
    receipts: reverse ? receipts.slice().reverse() : receipts,
    inputFingerprint: "fnv1a32:neutral-memory",
  } : null;
  return { atlas, showcase };
}

test("builds exact 2025 feed and quarantine ledgers without inventing promoted memory", () => {
  const { engine } = actualFixture();
  const capsule = engine.build(2025);

  assert.equal(engine.version, "1.0.0");
  assert.equal(engine.schema, "shokker-youtube-wiki/era-capsule/v1");
  assert.deepEqual(plain(engine.getYears()), [
    2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018,
  ]);
  assert.equal(capsule.feed.uploads, 94);
  assert.equal(capsule.feed.totalDurationSeconds, 800_510);
  assert.equal(capsule.feed.hours, 222.4);
  assert.equal(capsule.feed.cachedViews, 637_619);
  assert.deepEqual(plain(capsule.feed.coverage), {
    deeplyIndexed: 14,
    metadataOnly: 80,
    captionLimited: 0,
    unavailable: 0,
  });
  assert.equal(capsule.memory.sourceCount, 0);
  assert.equal(capsule.memory.receiptCount, 0);
  assert.equal(capsule.quarantine.sourceCount, 14);
  assert.equal(capsule.quarantine.candidateCount, 68);
  assert.equal(capsule.quarantine.topicLaneCount, 140);
  assert.equal(capsule.route.available, true);
  assert.equal(capsule.route.count, 5);
  assert.equal(capsule.route.quarantineFallback, true);
  assert.equal(new Set(capsule.route.stops.map((stop) => stop.sourceId)).size, 5);
  assert.ok(capsule.route.stops.every((stop) => (
    /^ARCHIVE DEEP(?: TOPIC)? QUARANTINE$/.test(stop.label)
    && stop.evidenceLevel === stop.label
    && stop.candidateState === "quarantined"
    && stop.promotionAllowed === false
    && stop.speaker === null
    && stop.archiveBatch.id
  )));
  assert.equal(capsule.status, "metadata-plus-quarantine");
});

test("keeps the 2019 cached-feed ledger separate from its non-feed indexed corpus", () => {
  const { engine } = actualFixture();
  const capsule = engine.build(2019);

  assert.equal(capsule.feed.uploads, 21);
  assert.equal(capsule.feed.hours, 30.7);
  assert.equal(capsule.feed.cachedViews, 156_432);
  assert.equal(capsule.feed.coverage.deeplyIndexed, 0);
  assert.equal(capsule.feed.coverage.metadataOnly, 21);
  assert.equal(capsule.memory.sourceCount, 12);
  assert.equal(capsule.memory.receiptCount, 96);
  assert.equal(capsule.route.count, 5);
  assert.equal(capsule.route.autoplay, false);
  assert.ok(capsule.route.stops.every((stop, index) => (
    stop.order === index + 1
    && /^[A-Za-z0-9_-]{11}$/.test(stop.sourceId)
    && stop.url === `https://www.youtube.com/watch?v=${stop.sourceId}&t=${stop.t}s`
    && stop.excerpt.split(/\s+/).length <= 17
  )));
  assert.match(capsule.memory.basis, /feed membership is not implied/i);
});

test("reconciles the newest year across all three ledgers and builds a playable route", () => {
  const { engine } = actualFixture();
  const capsule = engine.build(2026);

  assert.equal(capsule.feed.uploads, 37);
  assert.equal(capsule.feed.hours, 120.9);
  assert.equal(capsule.feed.cachedViews, 291_240);
  assert.deepEqual(plain(capsule.feed.coverage), {
    deeplyIndexed: 13,
    metadataOnly: 23,
    captionLimited: 1,
    unavailable: 0,
  });
  assert.equal(capsule.memory.sourceCount, 10);
  assert.equal(capsule.memory.receiptCount, 153);
  assert.equal(capsule.quarantine.sourceCount, 4);
  assert.equal(capsule.quarantine.candidateCount, 17);
  assert.equal(capsule.quarantine.topicLaneCount, 40);
  assert.equal(capsule.route.count, 5);
  assert.ok(capsule.route.stops.every((stop) => stop.date.startsWith("2026-")));
});

test("topic-only quarantine sources honestly complete the 2024 five-stop route", () => {
  const { engine } = actualFixture();
  const capsule = engine.build(2024);

  assert.equal(capsule.memory.receiptCount, 0);
  assert.equal(capsule.quarantine.sourceCount, 5);
  assert.equal(capsule.quarantine.candidateCount, 19);
  assert.equal(capsule.route.count, 5);
  assert.equal(capsule.route.quarantineFallback, true);
  assert.equal(new Set(capsule.route.stops.map((stop) => stop.sourceId)).size, 5);
  assert.ok(capsule.route.stops.some(
    (stop) => stop.label === "ARCHIVE DEEP TOPIC QUARANTINE",
  ));
  assert.ok(capsule.route.stops.every((stop) => (
    stop.promotionAllowed === false
    && stop.speaker === null
    && stop.archiveBatch.id
  )));
});

test("quarantine previews preserve candidate, speaker, and batch firewalls", () => {
  const { engine } = actualFixture();
  const capsule = engine.build(2025);

  assert.equal(capsule.quarantine.promotionAllowed, false);
  assert.equal(capsule.quarantine.speakerDiarized, false);
  assert.equal(capsule.quarantine.candidates.length, 12);
  assert.equal(capsule.quarantine.topics.length, 8);
  for (const candidate of capsule.quarantine.candidates) {
    assert.equal(candidate.candidateState, "quarantined");
    assert.equal(candidate.promotionAllowed, false);
    assert.equal(candidate.speaker, null);
    assert.match(candidate.archiveBatch.id, /^archive-deep-batch-/);
    assert.match(candidate.archiveBatch.publicFnv1a, /^fnv1a32:/);
    assert.equal(
      candidate.url,
      `https://www.youtube.com/watch?v=${candidate.sourceId}&t=${candidate.t}s`,
    );
  }
  for (const topic of capsule.quarantine.topics) {
    assert.equal(topic.candidateState, "quarantined");
    assert.equal(topic.promotionAllowed, false);
    assert.equal(topic.speaker, null);
  }
});

test("metadata upload cards contain measurements but no content-derived claims", () => {
  const { engine } = actualFixture();
  const cards = engine.build(2025).feed.topUploads;
  const allowed = [
    "cachedViews",
    "coverage",
    "date",
    "durationSeconds",
    "sourceId",
    "thumbnail",
    "title",
    "url",
  ];

  assert.equal(cards.length, 5);
  assert.ok(cards.every((card) => (
    JSON.stringify(Object.keys(card).sort()) === JSON.stringify(allowed)
  )));
  assert.ok(cards.every((card) => (
    !("summary" in card)
    && !("topic" in card)
    && !("sentiment" in card)
    && !("speaker" in card)
    && !("quote" in card)
  )));
  assert.match(engine.build(2025).feed.viewBasis, /cached views/i);
  assert.match(engine.build(2025).feed.viewBasis, /not current/i);
  assert.match(engine.build(2025).feed.viewBasis, /not.*unique audience/i);
});

test("missing optional inputs degrades to an honest metadata-only neutral capsule", () => {
  const window = load(["era-capsule-engine.js"]);
  const fixture = neutralFixture({ optional: false });
  const engine = window.ShokkerEraCapsuleEngine.create({ atlas: fixture.atlas });
  const capsule = engine.build(2022);
  const body = JSON.stringify(capsule);

  assert.equal(capsule.status, "metadata-ledger-only");
  assert.equal(capsule.memory.available, false);
  assert.equal(capsule.quarantine.available, false);
  assert.equal(capsule.route.available, false);
  assert.equal(capsule.feed.uploads, 2);
  assert.doesNotMatch(body, /WWAM|Halloween|horror|movie/i);
});

test("generic indexed fixtures stay deterministic and do not leak project vocabulary", () => {
  const window = load(["era-capsule-engine.js"]);
  const firstInput = neutralFixture();
  const secondInput = neutralFixture({ reverse: true });
  const first = window.ShokkerEraCapsuleEngine.create(firstInput).build(2022);
  const second = window.ShokkerEraCapsuleEngine.create(secondInput).build(2022);
  const body = JSON.stringify(first);

  assert.deepEqual(plain(first), plain(second));
  assert.equal(first.memory.sourceCount, 1);
  assert.equal(first.memory.receiptCount, 2);
  assert.equal(first.route.count, 2);
  assert.doesNotMatch(body, /WWAM|Halloween|horror|movie/i);
  assert.match(first.route.stops[0].url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
});

test("verification is deterministic and tampered or overbroad packets fail closed", () => {
  const { engine } = actualFixture();
  const capsule = engine.build(2019);
  const encoded = engine.serialize(capsule);
  const decoded = JSON.parse(encoded);

  assert.deepEqual(plain(engine.verify(capsule)), {
    ok: true,
    expected: capsule.fingerprint,
    actual: capsule.fingerprint,
    errors: [],
  });
  assert.equal(engine.serialize(decoded), encoded);
  assert.ok(Object.isFrozen(capsule));
  assert.ok(Object.isFrozen(capsule.feed));

  const changed = plain(capsule);
  changed.feed.cachedViews += 1;
  assert.equal(engine.verify(changed).ok, false);
  assert.throws(() => engine.serialize(changed), /Refusing to serialize/);

  const overbroad = plain(capsule);
  overbroad.captions = ["raw caption event"];
  assert.equal(engine.verify(overbroad).ok, false);
  assert.match(engine.verify(overbroad).errors.join(" "), /Forbidden export fields/);
  assert.throws(() => engine.serialize(overbroad), /Refusing to serialize/);
});

test("exports remain bounded public manifests without raw caption or event arrays", () => {
  const { engine } = actualFixture();
  for (const year of engine.getYears()) {
    const capsule = engine.build(year);
    const encoded = engine.serialize(capsule);

    assert.ok(encoded.length < 45_000, `${year} capsule grew to ${encoded.length} bytes`);
    assert.equal(capsule.feed.topUploads.length <= 5, true);
    assert.equal(capsule.memory.sources.length <= 12, true);
    assert.equal(capsule.memory.receiptPreview.length <= 12, true);
    assert.equal(capsule.memory.loreArrivals.length <= 8, true);
    assert.equal(capsule.quarantine.candidates.length <= 12, true);
    assert.equal(capsule.quarantine.topics.length <= 8, true);
    assert.equal(capsule.route.stops.length <= 5, true);
    assert.equal(capsule.route.count, 5, `${year} should have five playable coordinates`);
    assert.doesNotMatch(encoded, /"(?:transcript|transcripts|caption|captions|events|fullEvents)"\s*:/i);
    assert.equal(engine.verify(capsule).ok, true);
  }
});

test("invalid years and missing Atlas capability fail before a capsule is made", () => {
  const window = load(["era-capsule-engine.js"]);
  const { atlas } = neutralFixture();
  const engine = window.ShokkerEraCapsuleEngine.create({ atlas });

  assert.throws(() => engine.build(2021), /not present in the Archive Atlas/);
  assert.throws(() => engine.build("not-a-year"), /not present in the Archive Atlas/);
  assert.throws(
    () => window.ShokkerEraCapsuleEngine.create({ atlas: {} }),
    /requires an Archive Atlas browse API/,
  );
});
