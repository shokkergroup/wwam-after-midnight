import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const dataPath = path.join(demo, "archive-atlas-data.js");

function load(files = [
  "catalog.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "archive-deep-distill.js",
  "archive-deep-batch2.js",
  "archive-deep-batch3.js",
  "archive-deep-batch4.js",
  "year-canon-2025-2026.js",
  "archive-atlas-data.js",
  "archive-atlas-engine.js",
]) {
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

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((output, key) => {
      output[key] = stableValue(value[key]);
      return output;
    }, {});
  }
  return value;
}

function sha256(value) {
  const source = JSON.stringify(stableValue(value));
  return `sha256:${crypto.createHash("sha256").update(source).digest("hex")}`;
}

function canonicalRecord(record) {
  return {
    id: record.id,
    title: record.title,
    date: record.date,
    duration: record.duration,
    views: record.views,
    availability: record.availability,
    liveStatus: record.liveStatus,
    coverage: record.coverage,
    lanes: record.lanes,
  };
}

function fixture() {
  const window = load();
  const data = plain(window.WWAM_ARCHIVE_ATLAS);
  const atlas = window.WWAMArchiveAtlasEngine.create(window.WWAM_ARCHIVE_ATLAS);
  return { window, data, atlas };
}

test("ships all 472 cached official-feed records in a compact metadata artifact", () => {
  const { data } = fixture();
  const bytes = fs.statSync(dataPath).size;

  assert.equal(data.schema, "wwam-archive-atlas/v1");
  assert.equal(data.records.length, 472);
  assert.equal(new Set(data.records.map((record) => record.id)).size, 472);
  assert.ok(bytes < 250_000, `${bytes.toLocaleString()} bytes exceeds the public-data ceiling`);
  assert.equal(data.records[0].id, "LV2rmwEA0w4");
  assert.equal(data.records[0].date, "2026-07-23");
  assert.equal(data.records.at(-1).date, "2018-10-19");
  assert.ok(data.records.every((record) => (
    record.title
    && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
    && Number.isInteger(record.duration)
    && record.duration >= 0
    && Number.isInteger(record.views)
    && record.views >= 0
    && record.thumbnail === `https://i.ytimg.com/vi/${record.id}/maxresdefault.jpg`
    && record.url === `https://www.youtube.com/watch?v=${record.id}`
    && record.availability
    && record.liveStatus
  )));
});

test("reconciles the feed with current deep-source lanes without importing catalog-only videos", () => {
  const { window, data } = fixture();
  const ids = new Set(data.records.map((record) => record.id));
  const catalogIds = new Set(window.WWAM_CATALOG.map((record) => record.id));
  const freshIds = window.WWAM_LIVESTREAMS.streams.map((record) => record.id);
  const popularIds = window.WWAM_POPULAR_LIVE.streams.map((record) => record.id);
  const archiveDeepIds = window.WWAM_ARCHIVE_DEEP.streams.map((record) => record.id);
  const archiveDeepBatch2Ids = window.WWAM_ARCHIVE_DEEP_BATCH2.streams.map(
    (record) => record.id
  );
  const archiveDeepBatch3Ids = window.WWAM_ARCHIVE_DEEP_BATCH3.streams.map(
    (record) => record.id
  );
  const archiveDeepBatch4Ids = window.WWAM_ARCHIVE_DEEP_BATCH4.streams.map(
    (record) => record.id
  );
  const deepIdSets = [
    new Set(archiveDeepIds),
    new Set(archiveDeepBatch2Ids),
    new Set(archiveDeepBatch3Ids),
    new Set(archiveDeepBatch4Ids),
  ];
  const catalogIntersection = [...catalogIds].filter((id) => ids.has(id));

  assert.deepEqual(catalogIntersection, ["3wK00_-K-Y0"]);
  assert.ok(freshIds.every((id) => ids.has(id)));
  assert.ok(popularIds.every((id) => ids.has(id)));
  assert.ok(archiveDeepIds.every((id) => ids.has(id)));
  assert.ok(archiveDeepBatch2Ids.every((id) => ids.has(id)));
  assert.ok(archiveDeepBatch3Ids.every((id) => ids.has(id)));
  assert.ok(archiveDeepBatch4Ids.every((id) => ids.has(id)));
  assert.equal(deepIdSets.some((left, index) => (
    deepIdSets.slice(index + 1).some((right) => (
      [...left].some((id) => right.has(id))
    ))
  )), false);
  assert.ok(archiveDeepIds.every((id) => {
    const record = data.records.find((candidate) => candidate.id === id);
    return (
      record.coverage === "deeply-indexed"
      && record.lanes.includes("archive-deep-10")
      && !record.lanes.includes("archive-metadata")
    );
  }));
  assert.ok(archiveDeepBatch2Ids.every((id) => {
    const record = data.records.find((candidate) => candidate.id === id);
    return (
      record.coverage === "deeply-indexed"
      && record.lanes.includes("archive-deep-batch-02")
      && !record.lanes.includes("archive-metadata")
    );
  }));
  assert.deepEqual(plain(archiveDeepBatch3Ids), [
    "M9_5cX8xowI",
    "tUJviU09fWM",
    "J5uGidPT9Jc",
    "nv99WEtXGvE",
    "wjJy46oVmow",
    "yMAvXBYAxko",
    "fUCQoxTwKqo",
    "3UCnMrLMXbI",
    "lH0EXRN4xdw",
    "xBOTTKQ9pxU",
  ]);
  assert.ok(archiveDeepBatch3Ids.every((id) => {
    const record = data.records.find((candidate) => candidate.id === id);
    return (
      record.coverage === "deeply-indexed"
      && record.lanes.includes("archive-deep-batch-03")
      && !record.lanes.includes("archive-metadata")
    );
  }));
  assert.deepEqual(plain(archiveDeepBatch4Ids), [
    "2FlxuJxv81s",
    "MSVltTVeypc",
    "Qb2rDe-kJkI",
    "3Lu0beSDxcQ",
    "21hL29hicoU",
    "HLDAxs4_3U4",
    "34BwSiucNEI",
    "ETuRUYiQEBM",
    "5k6I18ZekPQ",
    "o0tcJcJk6MY",
  ]);
  assert.ok(archiveDeepBatch4Ids.every((id) => {
    const record = data.records.find((candidate) => candidate.id === id);
    return (
      record.coverage === "deeply-indexed"
      && record.lanes.includes("archive-deep-batch-04")
      && !record.lanes.includes("archive-metadata")
    );
  }));
  assert.deepEqual(data.stats.lanes, {
    "fresh-10": 10,
    "popular-25": 25,
    "archive-deep-10": 10,
    "archive-deep-batch-02": 10,
    "archive-deep-batch-03": 10,
    "archive-deep-batch-04": 10,
    "year-canon-2025-2026": 98,
    "commentary-catalog": 1,
    "archive-metadata": 298,
  });
  assert.equal(data.provenance.sourceLanes.popularFeedEntries, 472);
  assert.equal(data.provenance.sourceLanes.archiveDeepSources, 40);
  assert.equal(
    data.provenance.sourceLanes.archiveDeepSchema,
    "wwam-archive-deep-distill/v1",
  );
  assert.equal(
    data.provenance.sourceLanes.archiveDeepPriorityVersion,
    "archive-distill-priority/v1",
  );
  assert.match(
    data.provenance.sourceLanes.archiveDeepSelectionSha256,
    /^sha256:[a-f0-9]{64}$/,
  );
  assert.match(
    data.provenance.sourceLanes.archiveDeepPublicFnv1a,
    /^fnv1a32:[a-f0-9]{8}$/,
  );
  const batchPayloads = [
    window.WWAM_ARCHIVE_DEEP,
    window.WWAM_ARCHIVE_DEEP_BATCH2,
    window.WWAM_ARCHIVE_DEEP_BATCH3,
    window.WWAM_ARCHIVE_DEEP_BATCH4,
  ];
  const sum = (key) => batchPayloads.reduce(
    (total, batch) => total + Number(batch.meta[key] || 0),
    0,
  );
  assert.deepEqual(data.provenance.sourceLanes.archiveDeepTotals, {
    batches: 4,
    sources: sum("streams"),
    hours: Math.round(sum("hours") * 10) / 10,
    wordsAudited: sum("wordsAudited"),
    captionEvents: sum("captionEvents"),
    topicLanes: sum("topicLanes"),
    publicMomentCandidates: sum("publicMomentCandidates"),
    characterSignals: sum("characterSignals"),
    snapshotViews: sum("snapshotViews"),
    restricted: sum("restricted"),
    limitedCaptionSpan: sum("limitedCaptionSpan"),
  });
  const deepBatches = data.provenance.sourceLanes.archiveDeepBatches;
  assert.deepEqual(
    deepBatches.map((batch) => [batch.batchId, batch.atlasLane, batch.sources]),
    [
      ["archive-deep-batch-01", "archive-deep-10", 10],
      ["archive-deep-batch-02", "archive-deep-batch-02", 10],
      ["archive-deep-batch-03", "archive-deep-batch-03", 10],
      ["archive-deep-batch-04", "archive-deep-batch-04", 10],
    ],
  );
  assert.deepEqual(
    deepBatches.map((batch) => batch.schema),
    [
      "wwam-archive-deep-distill/v1",
      "shokker-youtube-wiki/archive-deep-batch/v1",
      "shokker-youtube-wiki/archive-deep-batch/v1",
      "shokker-youtube-wiki/archive-deep-batch/v1",
    ],
  );
  assert.ok(deepBatches.every((batch) => (
    /^sha256:[a-f0-9]{64}$/.test(batch.selectionSourceAtlasSha256)
    && /^sha256:[a-f0-9]{64}$/.test(batch.selectionSha256)
    && /^sha256:[a-f0-9]{64}$/.test(batch.captionSetSha256)
    && /^fnv1a32:[a-f0-9]{8}$/.test(batch.publicFnv1a)
  )));
  assert.ok(deepBatches.slice(1).every((batch) => (
    batch.integrationStatus === "integrated-quarantine"
    && batch.promotionAllowed === false
  )));
});

test("labels deep, metadata-only, caption-limited and unavailable states honestly", () => {
  const { data, atlas } = fixture();
  const allowed = new Set([
    "deeply-indexed",
    "metadata-only",
    "caption-limited",
    "unavailable",
  ]);
  assert.deepEqual(data.stats.coverage, {
    "deeply-indexed": 172,
    "metadata-only": 292,
    "caption-limited": 8,
    unavailable: 0,
  });
  assert.equal(data.stats.deepCoveragePercent, 36.4);
  assert.ok(data.records.every((record) => allowed.has(record.coverage)));
  assert.equal(atlas.getRecord("x6tvsGRHgU0").coverage, "caption-limited");
  assert.equal(atlas.getRecord("cQAVmNFQmoI").coverage, "caption-limited");
  assert.equal(atlas.getRecord("LV2rmwEA0w4").coverage, "deeply-indexed");
  assert.equal(atlas.getRecord("fpNtQMexZiw").coverage, "deeply-indexed");
  assert.deepEqual(
    plain(atlas.getRecord("fpNtQMexZiw").lanes),
    ["archive-deep-10"],
  );
  assert.equal(atlas.getRecord("CFUHyfcJDTg").coverage, "deeply-indexed");
  assert.deepEqual(
    plain(atlas.getRecord("CFUHyfcJDTg").lanes),
    ["archive-deep-batch-02"],
  );
  assert.equal(atlas.getRecord("M9_5cX8xowI").coverage, "deeply-indexed");
  assert.deepEqual(
    plain(atlas.getRecord("M9_5cX8xowI").lanes),
    ["archive-deep-batch-03"],
  );
  assert.equal(atlas.getRecord("2FlxuJxv81s").coverage, "deeply-indexed");
  assert.deepEqual(
    plain(atlas.getRecord("2FlxuJxv81s").lanes),
    ["archive-deep-batch-04"],
  );
  assert.equal(atlas.getRecord("FVuwRHM0kcc").coverage, "deeply-indexed");

  const coverage = atlas.getCoverage();
  assert.equal(coverage.currentSourceLaneRecords, 174);
  assert.equal(coverage.captionBackedDeepRecords, 172);
  assert.equal(coverage.selectedCaptionLimitedRecords, 2);
  assert.equal(coverage.deepCoveragePercent, 36.4);
  assert.match(coverage.policy, /no transcript/i);
});

test("publishes only metadata and classification fields, never excerpts or synthetic summaries", () => {
  const { data } = fixture();
  const allowedKeys = [
    "availability",
    "coverage",
    "date",
    "duration",
    "id",
    "lanes",
    "liveStatus",
    "thumbnail",
    "title",
    "url",
    "views",
  ];
  for (const record of data.records) {
    assert.deepEqual(Object.keys(record).sort(), allowedKeys);
    for (const forbidden of [
      "caption",
      "excerpt",
      "heatmap",
      "moment",
      "quote",
      "speaker",
      "summary",
      "topic",
      "transcript",
    ]) {
      assert.equal(Object.hasOwn(record, forbidden), false);
    }
  }
  assert.match(data.provenance.fieldPolicy, /metadata-only records make no transcript claims/i);
});

test("binds feed membership and canonical metadata to deterministic fingerprints", () => {
  const { data, atlas } = fixture();
  const ids = data.records.map((record) => record.id).sort();
  const canonical = data.records.map(canonicalRecord);

  assert.equal(data.fingerprints.feedSha256, sha256(ids));
  assert.equal(data.fingerprints.archiveSha256, sha256(canonical));
  assert.deepEqual(plain(atlas.verifyFingerprint()), {
    ok: true,
    expected: data.fingerprints.runtimeFnv1a,
    actual: data.fingerprints.runtimeFnv1a,
    archiveSha256: data.fingerprints.archiveSha256,
    feedSha256: data.fingerprints.feedSha256,
  });
});

test("fails closed when any fingerprint-bound metadata is changed", () => {
  const window = load(["archive-atlas-data.js", "archive-atlas-engine.js"]);
  const tampered = plain(window.WWAM_ARCHIVE_ATLAS);
  tampered.records[0].title = "Invented replacement title";

  assert.throws(
    () => window.WWAMArchiveAtlasEngine.create(tampered),
    /fingerprint mismatch/i,
  );
});

test("builds complete decade, year and month buckets whose counts reconcile", () => {
  const { atlas } = fixture();
  const buckets = plain(atlas.getBuckets());

  assert.deepEqual(buckets.map((bucket) => [bucket.label, bucket.count]), [
    ["2020s", 447],
    ["2010s", 25],
  ]);
  assert.equal(buckets.reduce((sum, bucket) => sum + bucket.count, 0), 472);
  const years = buckets.flatMap((bucket) => bucket.years);
  assert.deepEqual(years.map((year) => [year.year, year.count]), [
    [2026, 37],
    [2025, 94],
    [2024, 63],
    [2023, 70],
    [2022, 51],
    [2021, 73],
    [2020, 59],
    [2019, 21],
    [2018, 4],
  ]);
  assert.ok(years.every((year) => (
    year.months.reduce((sum, month) => sum + month.count, 0) === year.count
  )));
  const july2026 = years
    .find((year) => year.year === 2026)
    .months.find((month) => month.month === "2026-07");
  assert.equal(july2026.count, 3);
  assert.equal(july2026.coverage["deeply-indexed"], 3);
});

test("browses by decade, year, month, coverage and source lane deterministically", () => {
  const { atlas } = fixture();

  assert.equal(atlas.browse({ decade: "2010s" }).total, 25);
  assert.equal(atlas.browse({ year: 2026, month: 7 }).total, 3);
  assert.equal(atlas.browse({ coverage: "metadata-only" }).total, 292);
  assert.equal(atlas.browse({ coverage: ["caption-limited", "unavailable"] }).total, 8);
  assert.equal(atlas.browse({ lane: "popular-25" }).total, 25);
  assert.equal(atlas.browse({ lane: "archive-deep-10" }).total, 10);
  assert.equal(atlas.browse({ lane: "archive-deep-batch-02" }).total, 10);
  assert.equal(atlas.browse({ lane: "archive-deep-batch-03" }).total, 10);
  assert.equal(atlas.browse({ lane: "archive-deep-batch-04" }).total, 10);
  assert.ok(
    atlas.getFilterOptions().lanes.some((lane) => (
      lane.value === "archive-deep-10" && lane.label === "ARCHIVE DEEP 10"
    )),
  );

  const topViews = atlas.browse({ sort: "views", limit: 3 });
  assert.equal(topViews.records.length, 3);
  assert.ok(topViews.records[0].views >= topViews.records[1].views);
  assert.equal(topViews.evidenceScope, "cached YouTube metadata only");

  const firstPage = atlas.browse({ year: 2025, limit: 5 });
  const secondPage = atlas.browse({ year: 2025, limit: 5, offset: 5 });
  assert.equal(firstPage.total, 94);
  assert.equal(secondPage.total, 94);
  assert.deepEqual(
    plain(
      firstPage.records.map((record) => record.id)
        .filter((id) => secondPage.records.some((record) => record.id === id)),
    ),
    [],
  );
});

test("expands useful title aliases while explicitly refusing transcript search", () => {
  const { atlas } = fixture();
  const jason = atlas.search("Jason", { limit: 20 });
  const loomis = atlas.search("Loomis", { limit: 20 });
  const empty = atlas.search("   ");

  assert.equal(jason.transcriptSearch, false);
  assert.match(jason.evidenceScope, /cached titles only/i);
  assert.ok(jason.total > 0);
  assert.ok(jason.expandedAliases.some((group) => group.id === "friday-the-13th"));
  assert.ok(jason.results.every((record) => record.match.basis === "cached title metadata"));
  assert.ok(jason.results.some((record) => /friday the 13th/i.test(record.title)));
  assert.ok(loomis.expandedAliases.some((group) => group.id === "halloween"));
  assert.ok(loomis.results.some((record) => /halloween/i.test(record.title)));
  assert.deepEqual(plain(empty.results), []);
  assert.equal(empty.transcriptSearch, false);
});

test("search and browse return defensive copies instead of mutating archive state", () => {
  const { atlas } = fixture();
  const original = atlas.getRecord("LV2rmwEA0w4");
  const searched = atlas.search("movie news", { limit: 1 }).results[0];
  const browsed = atlas.browse({ limit: 1 }).records[0];

  searched.title = "changed";
  browsed.lanes.push("changed");
  original.title = "changed again";

  const restored = atlas.getRecord("LV2rmwEA0w4");
  assert.equal(restored.title, "We Watched A Movie Live! Movie News and More");
  assert.deepEqual(plain(restored.lanes), ["fresh-10"]);
});

test("ranks a reproducible distill-next queue with a fully exposed 50/30/20 formula", () => {
  const { atlas } = fixture();
  const queue = atlas.getDistillQueue({ limit: 25 });
  const frozenBatch = new Set([
    "fpNtQMexZiw",
    "WKs1uPGMQvw",
    "vq6mrfqOgZw",
    "M3P4mMDpXUc",
    "1j3F9vAWBo4",
    "3iMZcaVcvTU",
    "gR_64RyPhEM",
    "5T1wWUjCGWk",
    "KrBhfGxsJNM",
    "hagePawEnC4",
    "CFUHyfcJDTg",
    "o4EMYqQ5DDU",
    "Z7ArdfA054w",
    "k698GIJe8EA",
    "4X8EFw7MCmw",
    "KIGg_I72x_M",
    "o2O9T4nwVw4",
    "qONN2sNoK2k",
    "QxJyVaAgZ_Y",
    "0svLtx3nZJM",
    "M9_5cX8xowI",
    "tUJviU09fWM",
    "J5uGidPT9Jc",
    "nv99WEtXGvE",
    "wjJy46oVmow",
    "yMAvXBYAxko",
    "fUCQoxTwKqo",
    "3UCnMrLMXbI",
    "lH0EXRN4xdw",
    "xBOTTKQ9pxU",
    "2FlxuJxv81s",
    "MSVltTVeypc",
    "Qb2rDe-kJkI",
    "3Lu0beSDxcQ",
    "21hL29hicoU",
    "HLDAxs4_3U4",
    "34BwSiucNEI",
    "ETuRUYiQEBM",
    "5k6I18ZekPQ",
    "o0tcJcJk6MY",
  ]);

  assert.equal(queue.eligible, 292);
  assert.equal(queue.matched, 292);
  assert.equal(queue.records.length, 25);
  assert.deepEqual(plain(queue.excluded), {
    deeplyIndexed: 172,
    captionLimited: 8,
    unavailable: 0,
  });
  assert.equal(queue.formula.version, "archive-distill-priority/v1");
  assert.match(queue.formula.popularity, /0–50/);
  assert.match(queue.formula.recency, /0–30/);
  assert.match(queue.formula.franchise, /0–20/);
  assert.ok(queue.records.every((record, index) => (
    record.coverage === "metadata-only"
    && record.priority.rank >= index + 1
    && record.priority.basis === "cached title/date/views only"
    && record.priority.score === Math.round((
      record.priority.breakdown.popularity
      + record.priority.breakdown.recency
      + record.priority.breakdown.franchise
    ) * 10) / 10
  )));
  assert.ok(queue.records.every((record) => !frozenBatch.has(record.id)));
  assert.ok([...frozenBatch].every((id) => (
    atlas.getRecord(id).coverage === "deeply-indexed"
  )));
  assert.equal(queue.records[0].id, "RzSxi8rVQGI");
  assert.equal(queue.records[0].title, "FRIDAY THE 13TH PARTY! Live!");
  assert.equal(queue.records[0].priority.score, 81.9);
  assert.equal(queue.records[0].priority.breakdown.franchise, 20);
});

test("filters the priority queue by title-grounded franchise and time without reranking it", () => {
  const { atlas } = fixture();
  const full = atlas.getDistillQueue({ limit: 200 });
  const scream = atlas.getDistillQueue({
    franchise: "scream",
    year: 2023,
    limit: 50,
  });
  const ranks = new Map(full.records.map((record) => [record.id, record.priority.rank]));

  assert.ok(scream.matched > 0);
  assert.ok(scream.records.every((record) => (
    record.date.startsWith("2023-")
    && /scream|ghostface|woodsboro/i.test(record.title)
    && record.priority.breakdown.franchise === 20
  )));
  assert.ok(scream.records.every((record) => (
    record.priority.rank === ranks.get(record.id)
  )));
});

test("discloses the date-only cutoff and never represents it as current availability", () => {
  const { atlas } = fixture();
  const provenance = atlas.getProvenance();

  assert.equal(provenance.snapshotDate, "2026-07-23");
  assert.equal(provenance.cutoff.uploadedThrough, "2026-07-23");
  assert.equal(provenance.cutoff.officialFeedEntries, 472);
  assert.equal(provenance.cutoff.currentAvailabilityChecked, false);
  assert.equal(provenance.provenance.networkUsed, true);
  assert.equal(provenance.provenance.snapshotPrecision, "day");
  assert.match(provenance.provenance.fieldPolicy, /metadata-only records make no transcript claims/i);
  assert.deepEqual(
    plain(atlas.getFilterOptions().availability),
    ["not-captured", "public"],
  );
  assert.deepEqual(
    plain(atlas.getFilterOptions().liveStatus),
    ["not-captured", "was_live"],
  );
});
