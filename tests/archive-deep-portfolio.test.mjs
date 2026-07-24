import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const portfolioPath = path.join(demo, "archive-deep-portfolio.js");

const BATCH_01_IDS = [
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
];

const BATCH_02_IDS = [
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
];

const BATCH_03_IDS = [
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
];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  return context.window;
}

function fixture() {
  const window = load();
  const batch01 = plain(window.WWAM_ARCHIVE_DEEP);
  const batch02 = plain(window.WWAM_ARCHIVE_DEEP_BATCH2);
  const batch03 = plain(window.WWAM_ARCHIVE_DEEP_BATCH3);
  const engine = window.WWAMArchiveDeepPortfolio.create({
    batches: [batch01, batch02, batch03],
    engineFactory: window.WWAMArchiveDeepEngine,
  });
  return { window, batch01, batch02, batch03, engine };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((output, key) => {
      output[key] = stable(value[key]);
      return output;
    }, {});
  }
  return value;
}

function fnv1a32(value) {
  let current = 0x811c9dc5;
  for (const byte of Buffer.from(value, "utf8")) {
    current ^= byte;
    current = Math.imul(current, 0x01000193) >>> 0;
  }
  return `fnv1a32:${current.toString(16).padStart(8, "0")}`;
}

function resignPublicStreams(payload) {
  payload.fingerprints.publicFnv1a = fnv1a32(
    JSON.stringify(stable(payload.streams))
  );
}

function exactKeys(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => exactKeys(entry, output));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      output.push(key);
      exactKeys(entry, output);
    }
  }
  return output;
}

test("composes three pinned ten-source batches into truthful current metrics", () => {
  const { engine } = fixture();
  assert.equal(engine.engine, "WWAM Archive Deep Portfolio");
  assert.equal(engine.version, "1.1.0");
  assert.equal(
    engine.schema,
    "shokker-youtube-wiki/archive-deep-portfolio/v1"
  );
  assert.deepEqual(plain(engine.getMetrics()), {
    batches: 3,
    streams: 30,
    captioned: 30,
    restricted: 9,
    visualRankingQuarantines: 10,
    hours: 77.2,
    wordsAudited: 957430,
    captionEvents: 136539,
    topicLanes: 300,
    distinctTopics: 44,
    publicMomentCandidates: 131,
    characterSignals: 41,
    snapshotViews: 335489,
  });
});

test("keeps batch provenance and assigns one collision-free portfolio rank", () => {
  const { engine } = fixture();
  const streams = engine.browse({ sort: "priority" }).records;
  assert.deepEqual(
    plain(streams.map((stream) => stream.id)),
    [...BATCH_01_IDS, ...BATCH_02_IDS, ...BATCH_03_IDS]
  );
  assert.deepEqual(
    plain(streams.map((stream) => stream.archivePriority.batchRank)),
    [...Array.from({ length: 10 }, (_, index) => index + 1),
      ...Array.from({ length: 10 }, (_, index) => index + 1),
      ...Array.from({ length: 10 }, (_, index) => index + 1)]
  );
  assert.deepEqual(
    plain(streams.map((stream) => stream.archivePortfolioRank)),
    Array.from({ length: 30 }, (_, index) => index + 1)
  );
  assert.deepEqual(
    plain(streams.map((stream) => (
      stream.archivePriority.archivePortfolioRank
    ))),
    Array.from({ length: 30 }, (_, index) => index + 1)
  );
  assert.ok(streams.slice(0, 10).every(
    (stream) => stream.archiveBatch.id === "archive-deep-batch-01"
  ));
  assert.ok(streams.slice(10, 20).every(
    (stream) => stream.archiveBatch.id === "archive-deep-batch-02"
  ));
  assert.ok(streams.slice(20).every(
    (stream) => stream.archiveBatch.id === "archive-deep-batch-03"
  ));
  assert.ok(streams.every((stream) => (
    stream.archiveBatch.candidateState === "quarantined"
    && stream.archiveBatch.promotionAllowed === false
    && stream.archiveBatch.speakerDiarized === false
    && stream.archiveBatch.originAttribution === false
  )));
});

test("validates all batches through the legacy engine without mutating modern envelopes", () => {
  const window = load();
  const batch01 = plain(window.WWAM_ARCHIVE_DEEP);
  const batch02 = plain(window.WWAM_ARCHIVE_DEEP_BATCH2);
  const batch03 = plain(window.WWAM_ARCHIVE_DEEP_BATCH3);
  const calls = [];
  const factory = {
    SCHEMA: window.WWAMArchiveDeepEngine.SCHEMA,
    create(payload) {
      calls.push(plain(payload));
      return window.WWAMArchiveDeepEngine.create(payload);
    },
  };
  const engine = window.WWAMArchiveDeepPortfolio.create(
    [batch01, batch02, batch03],
    factory
  );
  assert.equal(calls.length, 3);
  assert.ok(calls.every((payload) => (
    payload.schema === "wwam-archive-deep-distill/v1"
  )));
  assert.deepEqual(
    calls[1].streams.map((stream) => stream.archivePriority.originalRank),
    Array.from({ length: 10 }, (_, index) => index + 1)
  );
  assert.deepEqual(
    calls[1].streams.map((stream) => stream.archivePriority.currentRank),
    Array.from({ length: 10 }, (_, index) => index + 1)
  );
  assert.ok(batch02.streams.every(
    (stream) => stream.archivePriority.originalRank === undefined
  ));
  assert.ok(batch03.streams.every(
    (stream) => stream.archivePriority.originalRank === undefined
  ));

  const verification = plain(engine.verifyFingerprint());
  assert.equal(verification.ok, true);
  assert.equal(verification.actual, "fnv1a32:8e474ea8");
  assert.equal(verification.authenticityVerified, false);
  assert.match(verification.scope, /structural-change-detection-only/);
  assert.deepEqual(
    verification.batches.map((batch) => batch.actual),
    ["fnv1a32:17045a51", "fnv1a32:bcea5692", "fnv1a32:f79f2399"]
  );
  assert.deepEqual(
    verification.batches.map((batch) => batch.expected),
    ["fnv1a32:17045a51", "fnv1a32:bcea5692", "fnv1a32:f79f2399"]
  );
  assert.notEqual(
    verification.batches[1].legacyCompatibilityFnv1a,
    verification.batches[1].actual
  );
  assert.equal(
    verification.batches[1].legacyCompatibilityActual,
    verification.batches[1].legacyCompatibilityFnv1a
  );
  assert.notEqual(
    verification.batches[2].legacyCompatibilityFnv1a,
    verification.batches[2].actual
  );
});

test("merges topic and character indexes with global source ranks", () => {
  const { engine } = fixture();
  const topics = engine.getTopicIndex();
  const characters = engine.getCharacterIndex();
  assert.equal(topics.length, 44);
  assert.equal(characters.length, 4);
  const scream = topics.find((topic) => topic.name === "Scream");
  assert.ok(scream.mentions > 327);
  assert.ok(scream.streams.some(
    (stream) => stream.archiveBatchId === "archive-deep-batch-01"
  ));
  assert.ok(scream.streams.some(
    (stream) => stream.archiveBatchId === "archive-deep-batch-02"
  ));
  assert.ok(scream.streams.some(
    (stream) => stream.archiveBatchId === "archive-deep-batch-03"
  ));
  assert.ok(scream.streams.every((stream) => (
    stream.rank === stream.portfolioRank
    && stream.portfolioRank >= 1
    && stream.portfolioRank <= 30
  )));
  const challis = characters.find(
    (character) => character.character === "Dr. Challis"
  );
  assert.ok(challis.mentions > 12);
  assert.ok(challis.streams.some((stream) => stream.portfolioRank > 20));
});

test("provides compatible browse, search, and source lookup surfaces", () => {
  const { engine } = fixture();
  assert.equal(engine.browse({ batchSequence: 1 }).total, 10);
  assert.equal(engine.browse({ batchId: "archive-deep-batch-02" }).total, 10);
  assert.equal(engine.browse({ batchSequence: 3 }).total, 10);
  assert.equal(engine.browse({ batchId: "archive-deep-batch-03" }).total, 10);
  assert.equal(engine.browse({ restricted: true }).total, 9);
  assert.equal(engine.browse({ restricted: false }).total, 21);
  assert.equal(engine.browse({ contentMode: "visual-ranking" }).total, 9);
  assert.equal(engine.browse({ minPriorityScore: 90 }).total, 9);
  assert.deepEqual(
    plain(engine.browse({ sort: "priority", offset: 19, limit: 2 }).records.map(
      (stream) => stream.archivePortfolioRank
    )),
    [20, 21]
  );
  assert.equal(engine.search("Scream").total, 21);
  assert.match(engine.search("Scream").evidenceScope, /captions remain private/i);
  assert.equal(engine.search("").total, 0);
  assert.equal(engine.getStream("CFUHyfcJDTg").archivePortfolioRank, 11);
  assert.equal(engine.getStream("M9_5cX8xowI").archivePortfolioRank, 21);
  assert.equal(engine.getStream("not-a-source"), null);
});

test("keeps all 131 public moment candidates quarantined and non-diarized", () => {
  const { engine } = fixture();
  const moments = engine.getMomentCandidates();
  assert.equal(moments.length, 131);
  assert.ok(moments.every((moment) => (
    moment.candidateState === "quarantined"
    && moment.promotionAllowed === false
    && moment.speaker === null
    && moment.archiveBatch.promotionAllowed === false
    && moment.evidence.speakerStatus === "not-diarized"
    && moment.evidence.originStatus === "not-inferred"
    && /youtube\.com\/watch\?v=.+&t=\d+s$/.test(moment.playbackUrl)
  )));
  assert.equal(
    engine.getMomentCandidates({ batchId: "archive-deep-batch-01" }).length,
    42
  );
  assert.equal(
    engine.getMomentCandidates({ batchId: "archive-deep-batch-02" }).length,
    49
  );
  assert.equal(
    engine.getMomentCandidates({ batchId: "archive-deep-batch-03" }).length,
    40
  );
  const receipts = engine.getTopicReceipts("Scream");
  assert.ok(receipts.length >= 10);
  assert.ok(receipts.every((receipt) => (
    receipt.speaker === null
    && receipt.originAttribution === false
    && receipt.promotionAllowed === false
  )));
});

test("exports a bounded search payload with all three original fingerprints", () => {
  const { engine } = fixture();
  const payload = engine.getSearchPayload();
  assert.equal(payload.schema, engine.schema);
  assert.equal(payload.streams.length, 30);
  assert.equal(payload.topicIndex.length, 44);
  assert.equal(payload.meta.publicMomentCandidates, 131);
  assert.deepEqual(
    plain(payload.batches.map((batch) => batch.publicFnv1a)),
    ["fnv1a32:17045a51", "fnv1a32:bcea5692", "fnv1a32:f79f2399"]
  );
  assert.deepEqual(
    plain(payload.fingerprints.batches.map((batch) => batch.publicFnv1a)),
    ["fnv1a32:17045a51", "fnv1a32:bcea5692", "fnv1a32:f79f2399"]
  );
  assert.match(
    payload.evidencePolicy.fingerprintScope,
    /not signatures or authenticity proof/i
  );
  const keys = exactKeys(payload);
  assert.equal(keys.includes("events"), false);
  assert.equal(keys.includes("segs"), false);
  assert.equal(keys.includes("transcript"), false);
  assert.equal(keys.includes("captions"), false);
});

test("returns defensive copies from every state-bearing surface", () => {
  const { engine } = fixture();
  const metrics = engine.getMetrics();
  metrics.streams = 0;
  const source = engine.getStream(BATCH_01_IDS[0]);
  source.title = "changed";
  source.topics[0].name = "changed";
  const browse = engine.browse({});
  browse.records.length = 0;
  browse.filters.invented = true;
  const topics = engine.getTopicIndex();
  topics.length = 0;
  const characters = engine.getCharacterIndex();
  characters[0].character = "changed";
  const moments = engine.getMomentCandidates();
  moments[0].sourceTitle = "changed";
  const selection = engine.getSelection();
  selection[0].publicFnv1a = "changed";
  const policy = engine.getEvidencePolicy();
  policy.promotionAllowed = true;
  const exported = engine.exportSnapshot();
  exported.streams.length = 0;
  exported.batches.length = 0;

  assert.equal(engine.getMetrics().streams, 30);
  assert.notEqual(engine.getStream(BATCH_01_IDS[0]).title, "changed");
  assert.notEqual(engine.getStream(BATCH_01_IDS[0]).topics[0].name, "changed");
  assert.equal(engine.browse({}).records.length, 30);
  assert.equal(engine.getTopicIndex().length, 44);
  assert.notEqual(engine.getCharacterIndex()[0].character, "changed");
  assert.notEqual(engine.getMomentCandidates()[0].sourceTitle, "changed");
  assert.equal(engine.getSelection()[0].publicFnv1a, "fnv1a32:17045a51");
  assert.equal(engine.getEvidencePolicy().promotionAllowed, false);
  assert.equal(engine.exportSnapshot().streams.length, 30);
});

test("fails closed on arbitrary schemas, reordered batches, and bad factory output", () => {
  const { window, batch01, batch02, batch03 } = fixture();
  const arbitrary = structuredClone(batch02);
  arbitrary.schema = "some-other/archive/v999";
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create(
      [batch01, arbitrary, batch03],
      window.WWAMArchiveDeepEngine
    ),
    /requires schema/i
  );
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create(
      [batch01, batch03, batch02],
      window.WWAMArchiveDeepEngine
    ),
    /lane metadata/i
  );
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create(
      [batch01, batch02],
      window.WWAMArchiveDeepEngine
    ),
    /exactly three ordered batches/i
  );
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create([batch01, batch02, batch03], {
      SCHEMA: "wrong",
      create() {},
    }),
    /compatible .* factory/i
  );
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create([batch01, batch02, batch03], {
      SCHEMA: window.WWAMArchiveDeepEngine.SCHEMA,
      create() { return {}; },
    }),
    /invalid legacy engine/i
  );
});

test("fails closed when lane, selection, exclusion, or priority metadata changes", () => {
  const { window, batch01, batch02, batch03 } = fixture();
  const cases = [
    (payload) => { payload.lane.promotionAllowed = true; },
    (payload) => { payload.lane.sequence = 1; },
    (payload) => { payload.lane.integrationStatus = "invented"; },
    (payload) => { payload.selection.frozen = false; },
    (payload) => { payload.selection.records[0].snapshotViews += 1; },
    (payload) => { payload.selection.excludedLaneIds = []; },
    (payload) => { payload.streams[0].archivePriority.currentRank = 2; },
    (payload) => { payload.streams[0].archivePriority.portfolioRank = 1; },
  ];
  for (const [sequence, source] of [[2, batch02], [3, batch03]]) {
    for (const mutate of cases) {
      const changed = structuredClone(source);
      mutate(changed);
      resignPublicStreams(changed);
      const inputs = [batch01, batch02, batch03];
      inputs[sequence - 1] = changed;
      assert.throws(
        () => window.WWAMArchiveDeepPortfolio.create(
          inputs,
          window.WWAMArchiveDeepEngine
        ),
        /Archive Deep Portfolio/
      );
    }
  }
});

test("rejects stream mutation even when an attacker recomputes the public FNV", () => {
  const { window, batch01, batch02, batch03 } = fixture();
  const changed = structuredClone(batch03);
  changed.streams[0].title = "self-signed mutation";
  resignPublicStreams(changed);
  assert.notEqual(changed.fingerprints.publicFnv1a, "fnv1a32:f79f2399");
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create(
      [batch01, batch02, changed],
      window.WWAMArchiveDeepEngine
    ),
    /pinned fingerprints/i
  );

  const hiddenCaption = structuredClone(batch01);
  hiddenCaption.streams[0].transcript = "this must never become public";
  resignPublicStreams(hiddenCaption);
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create(
      [hiddenCaption, batch02, batch03],
      window.WWAMArchiveDeepEngine
    ),
    /pinned fingerprints/i
  );
});

test("rejects duplicate source identities and broken evidence boundaries", () => {
  const { window, batch01, batch02, batch03 } = fixture();
  const duplicate = structuredClone(batch03);
  duplicate.streams[0].id = batch01.streams[0].id;
  duplicate.selection.records[0].id = batch01.streams[0].id;
  resignPublicStreams(duplicate);
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create(
      [batch01, batch02, duplicate],
      window.WWAMArchiveDeepEngine
    ),
    /Archive Deep Portfolio/
  );

  const diarized = structuredClone(batch03);
  diarized.streams[0].captionEvidence.speakerDiarized = true;
  resignPublicStreams(diarized);
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create(
      [batch01, batch02, diarized],
      window.WWAMArchiveDeepEngine
    ),
    /evidence boundary|pinned fingerprints/i
  );

  const promotable = structuredClone(batch03);
  promotable.streams[0].rightsPolicy.promotionAllowed = true;
  resignPublicStreams(promotable);
  assert.throws(
    () => window.WWAMArchiveDeepPortfolio.create(
      [batch01, batch02, promotable],
      window.WWAMArchiveDeepEngine
    ),
    /quarantine boundary|pinned fingerprints/i
  );
});

test("is deterministic and stays below its production size ceiling", () => {
  const { engine } = fixture();
  const second = fixture().engine;
  assert.deepEqual(plain(engine.exportSnapshot()), plain(second.exportSnapshot()));
  assert.equal(
    engine.verifyFingerprint().actual,
    second.verifyFingerprint().actual
  );
  assert.ok(fs.statSync(portfolioPath).size < 80_000);
});
