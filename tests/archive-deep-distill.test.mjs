import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const dataPath = path.join(demo, "archive-deep-distill.js");

const EXPECTED_IDS = [
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixture() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "archive-deep-distill.js",
    "archive-deep-engine.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const atlas = context.window.WWAMArchiveAtlasEngine.create(
    context.window.WWAM_ARCHIVE_ATLAS
  );
  const archiveDeep = context.window.WWAM_ARCHIVE_DEEP;
  const engine = context.window.WWAMArchiveDeepEngine.create(archiveDeep);
  return { context, atlas, archiveDeep, engine };
}

function excerpts(payload) {
  return payload.streams.flatMap((stream) => [
    ...stream.topics.map((topic) => topic.receipt).filter(Boolean),
    ...stream.moments.map((moment) => moment.excerpt).filter(Boolean),
    ...stream.characters.map((character) => character.receipt).filter(Boolean),
  ]);
}

test("freezes the exact first Archive Atlas priority V1 batch", () => {
  const { atlas, archiveDeep } = fixture();
  assert.equal(archiveDeep.schema, "wwam-archive-deep-distill/v1");
  assert.equal(archiveDeep.selection.priorityVersion, "archive-distill-priority/v1");
  assert.equal(archiveDeep.selection.atlasSnapshotDate, "2026-07-23");
  assert.equal(archiveDeep.selection.frozen, true);
  assert.deepEqual(
    plain(archiveDeep.streams.map((stream) => stream.id)),
    EXPECTED_IDS
  );
  assert.deepEqual(
    plain(archiveDeep.streams.map((stream) => stream.archivePriority.originalRank)),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  );
  assert.deepEqual(
    plain(archiveDeep.streams.map((stream) => stream.archivePriority.score)),
    [96.4, 96.1, 93.1, 92.9, 92.2, 90.7, 90.6, 90.5, 90.1, 89.9]
  );

  const selectedCoverage = EXPECTED_IDS.map((id) => atlas.getRecord(id).coverage);
  if (selectedCoverage.every((status) => status === "metadata-only")) {
    assert.deepEqual(
      plain(atlas.getDistillQueue({ limit: 10 }).records.map((record) => record.id)),
      EXPECTED_IDS
    );
  } else {
    assert.ok(selectedCoverage.every((status) => status === "deeply-indexed"));
  }
});

test("publishes ten complete caption audits without publishing caption payloads", () => {
  const { archiveDeep } = fixture();
  assert.deepEqual(plain(archiveDeep.meta), {
    streams: 10,
    captioned: 10,
    restricted: 4,
    hours: 23.7,
    wordsAudited: 294471,
    captionEvents: 43585,
    topicLanes: 100,
    distinctTopics: 37,
    publicMomentCandidates: 42,
    characterSignals: 12,
    snapshotViews: 120921,
  });
  assert.ok(archiveDeep.streams.every((stream) => (
    stream.captionEvidence.durationCoveragePercent >= 99.8
    && stream.captionEvidence.fullPayloadPublic === false
    && stream.captionEvidence.speakerDiarized === false
    && stream.captionEvidence.originAttribution === false
    && /^sha256:[a-f0-9]{64}$/.test(stream.captionEvidence.payloadSha256)
  )));
  const serialized = JSON.stringify(archiveDeep);
  assert.doesNotMatch(serialized, /"events"\s*:\s*\[/);
  assert.doesNotMatch(serialized, /"segs"\s*:\s*\[/);
  assert.ok(fs.statSync(dataPath).size < 125_000);
});

test("keeps every public receipt short, timestamped and attribution-safe", () => {
  const { archiveDeep } = fixture();
  const publicExcerpts = excerpts(archiveDeep);
  assert.ok(publicExcerpts.length > 50);
  assert.ok(publicExcerpts.every((excerpt) => excerpt.trim().split(/\s+/).length <= 16));
  assert.ok(publicExcerpts.every((excerpt) => (
    !/\b(?:n[\W_]*[i1][\W_]*g[\W_]*g|f[\W_]*a[\W_]*g[\W_]*g|r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d)\w*/i.test(excerpt)
  )));
  for (const stream of archiveDeep.streams) {
    assert.equal(stream.rightsPolicy.speakerClaimsAllowed, false);
    assert.equal(stream.rightsPolicy.originClaimsAllowed, false);
    for (const moment of stream.moments) {
      assert.ok(Number.isFinite(moment.t));
      assert.equal(moment.evidence.speakerStatus, "not-diarized");
      assert.equal(moment.evidence.originStatus, "not-inferred");
      assert.equal(moment.evidence.reviewStatus, "machine-candidate");
    }
  }
});

test("holds trailer, script and watch-party sources to topic navigation only", () => {
  const { archiveDeep } = fixture();
  const restrictedModes = new Set([
    "trailer-reaction",
    "trailer-breakdown",
    "script-reading",
    "watch-party",
  ]);
  const restricted = archiveDeep.streams.filter(
    (stream) => stream.rightsPolicy.restrictedToTopicNavigation
  );
  assert.equal(restricted.length, 4);
  assert.ok(restricted.every((stream) => restrictedModes.has(stream.contentMode)));
  assert.ok(restricted.every((stream) => (
    stream.moments.length === 0
    && stream.characters.length === 0
    && stream.heatmap.length === 0
    && stream.peak === null
    && stream.topics.every((topic) => topic.receipt === null)
  )));
  const script = restricted.find((stream) => stream.contentMode === "script-reading");
  assert.match(script.summary, /public comedy, character and excerpt candidates are withheld/i);
});

test("engine exposes useful public search and receipt surfaces without hidden transcript search", () => {
  const { engine } = fixture();
  assert.equal(engine.engine, "WWAM Archive Deep Distill");
  assert.equal(engine.getMetrics().streams, 10);
  assert.equal(engine.browse({ restricted: true }).total, 4);
  assert.equal(engine.browse({ restricted: false }).total, 6);
  assert.equal(engine.browse({ contentMode: "movie-news" }).total, 2);
  assert.equal(engine.browse({ minPriorityScore: 93 }).total, 3);
  assert.equal(engine.search("Scream").total >= 3, true);
  assert.match(
    engine.search("Scream").evidenceScope,
    /public aggregate data and short timestamped receipts only/i
  );

  const moments = engine.getMomentCandidates();
  assert.equal(moments.length, 42);
  assert.ok(moments.every((moment) => (
    moment.evidence.speakerStatus === "not-diarized"
    && moment.evidence.originStatus === "not-inferred"
    && /youtube\.com\/watch\?v=.+&t=\d+s$/.test(moment.playbackUrl)
  )));
  assert.ok(engine.getTopicReceipts("Halloween").length >= 7);
  assert.ok(engine.getTopicIndex().length >= 30);
  assert.ok(engine.getCharacterIndex().length >= 3);
});

test("engine returns defensive copies and verifies the public fingerprint", () => {
  const { context, archiveDeep, engine } = fixture();
  const first = engine.getStream(EXPECTED_IDS[0]);
  first.title = "changed";
  first.topics[0].name = "changed";
  assert.notEqual(engine.getStream(EXPECTED_IDS[0]).title, "changed");
  assert.notEqual(engine.getStream(EXPECTED_IDS[0]).topics[0].name, "changed");
  const exported = engine.exportSnapshot();
  exported.streams.length = 0;
  assert.equal(engine.getMetrics().streams, 10);
  assert.equal(engine.verifyFingerprint().ok, true);
  assert.match(engine.verifyFingerprint().actual, /^fnv1a32:[a-f0-9]{8}$/);

  const tampered = plain(archiveDeep);
  tampered.streams[0].title += " changed";
  assert.throws(
    () => context.window.WWAMArchiveDeepEngine.create(tampered),
    /fingerprint mismatch/i
  );
});
