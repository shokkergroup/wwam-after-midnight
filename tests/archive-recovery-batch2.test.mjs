import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const manifestPath = path.join(
  root,
  "pipeline",
  "wwam_archive_recovery_batch2_manifest.json",
);
const predecessorManifestPath = path.join(
  root,
  "pipeline",
  "wwam_archive_recovery_batch1_manifest.json",
);

function loadAssignment(filename, assignment) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(demo, filename), "utf8"), context, {
    filename,
  });
  return JSON.parse(JSON.stringify(context.window[assignment]));
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

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function sha256Label(value) {
  return `sha256:${crypto.createHash("sha256").update(stableJson(value)).digest("hex")}`;
}

function fnv1a32(value) {
  let current = 0x811c9dc5;
  for (const byte of Buffer.from(value, "utf8")) {
    current ^= byte;
    current = Math.imul(current, 0x01000193) >>> 0;
  }
  return `fnv1a32:${current.toString(16).padStart(8, "0")}`;
}

function words(value) {
  return (String(value || "").match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g) || []).length;
}

function fixture() {
  return loadAssignment(
    "archive-recovery-batch2.js",
    "WWAM_ARCHIVE_RECOVERY_BATCH2",
  );
}

function candidates(payload) {
  return payload.streams.flatMap((stream) => [
    ...stream.topics,
    ...stream.moments,
    ...stream.characters,
  ]);
}

function excerpts(payload) {
  return payload.streams.flatMap((stream) => [
    ...stream.topics.map((topic) => topic.receipt).filter(Boolean),
    ...stream.moments.map((moment) => moment.excerpt).filter(Boolean),
    ...stream.characters.map((character) => character.receipt).filter(Boolean),
  ]);
}

test("freezes the exact next 25-source recovery ledger without touching Batch 01", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const predecessor = JSON.parse(
    fs.readFileSync(predecessorManifestPath, "utf8"),
  );
  const batch1 = loadAssignment(
    "archive-recovery-batch1.js",
    "WWAM_ARCHIVE_RECOVERY_BATCH1",
  );
  const payload = fixture();
  const predecessorIds = new Set(predecessor.records.map((record) => record.id));

  assert.equal(
    sha256Label(manifest),
    "sha256:def7d7a22c354ca18dfc85c4f659ca610a8b43e46019a0af7a33f6e682b78fb2",
  );
  assert.equal(manifest.predecessor.manifestSha256, sha256Label(predecessor));
  assert.equal(batch1.fingerprints.manifestSha256, sha256Label(predecessor));
  assert.equal(payload.schema, "shokker-youtube-wiki/archive-recovery-batch/v1");
  assert.deepEqual(payload.lane, {
    id: "archive-recovery-batch-02",
    kind: "caption-audited-recovery-quarantine",
    sequence: 2,
    integrationStatus: "integrated-quarantine",
    promotionAllowed: false,
    requiresAuthenticatedReview: true,
  });
  assert.equal(payload.selection.manifestSha256, sha256Label(manifest));
  assert.equal(payload.selection.frozen, true);
  assert.equal(payload.streams.length, 25);
  assert.equal(new Set(payload.streams.map((stream) => stream.id)).size, 25);
  assert.equal(new Set(payload.streams.map((stream) => stream.date)).size, 25);
  assert.ok(payload.streams.every((stream) => !predecessorIds.has(stream.id)));
  assert.deepEqual(
    payload.streams.map((stream) => stream.id),
    manifest.records.map((record) => record.id),
  );
  assert.deepEqual(
    payload.selection.queueExclusionsBeforeCutoff,
    manifest.queueExclusionsBeforeCutoff,
  );
  assert.deepEqual(
    manifest.queueExclusionsBeforeCutoff.map((record) => record.id),
    [
      "WE3_YeRy7Xk",
      "Ppb0cXyB3rk",
      "7PpJUHsBsug",
      "oKVZG4z5wuU",
      "wW9bdu_GtgQ",
      "uoxOvi0J5zQ",
      "RR8A7Echta0",
    ],
  );
});

test("retains exact Atlas priority provenance and fresh public probes", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const payload = fixture();

  assert.deepEqual(
    payload.selection.records,
    manifest.records.map((record) => ({
      rank: record.rank,
      atlasPriorityRank: record.atlasPriorityRank,
      atlasPriorityScore: record.atlasPriorityScore,
      atlasPriorityBreakdown: record.atlasPriorityBreakdown,
      id: record.id,
      title: record.title,
      date: record.date,
      duration: record.duration,
      snapshotViews: record.snapshotViews,
      contentMode: record.contentMode,
      rightsMode: record.rightsMode,
    })),
  );
  assert.ok(manifest.records.every((record) => (
    record.probe.observedAt === manifest.frozenAt
    && record.probe.availability === "public"
    && record.probe.liveStatus === "was_live"
    && record.probe.ageLimit === 0
    && record.probe.englishJson3 === true
  )));
  assert.ok(payload.streams.every((stream, index) => (
    stream.archivePriority.atlasPriorityRank
      === manifest.records[index].atlasPriorityRank
    && stream.archivePriority.score
      === manifest.records[index].atlasPriorityScore
    && JSON.stringify(stream.archivePriority.breakdown)
      === JSON.stringify(manifest.records[index].atlasPriorityBreakdown)
  )));
});

test("publishes only bounded, source-local, non-promotable receipts", () => {
  const payload = fixture();
  const byId = new Map(payload.streams.map((stream) => [stream.id, stream]));
  const publicCandidates = candidates(payload);
  const publicExcerpts = excerpts(payload);

  assert.deepEqual(payload.meta, {
    streams: 25,
    captioned: 25,
    completeCaptionSpans: 25,
    restricted: 0,
    visualResultFirewalls: 11,
    hours: 65.9,
    wordsAudited: 818_768,
    captionEvents: 116_679,
    topicLanes: 250,
    distinctTopics: 45,
    publicMomentCandidates: 150,
    characterSignals: 51,
    snapshotViews: 295_468,
    retryQueue: 0,
  });
  assert.ok(payload.streams.every((stream) => (
    stream.captionEvidence.eventsAudited >= 50
    && stream.captionEvidence.durationCoveragePercent >= 99.8
    && stream.captionEvidence.fullPayloadPublic === false
    && stream.captionEvidence.speakerDiarized === false
    && stream.captionEvidence.originAttribution === false
    && stream.rightsPolicy.speakerClaimsAllowed === false
    && stream.rightsPolicy.performerClaimsAllowed === false
    && stream.rightsPolicy.originClaimsAllowed === false
    && stream.rightsPolicy.visualClaimsAllowed === false
    && stream.rightsPolicy.visualResultClaimsAllowed === false
    && stream.rightsPolicy.promotionAllowed === false
  )));

  assert.equal(publicCandidates.length, 451);
  for (const candidate of publicCandidates) {
    const source = byId.get(candidate.sourceId);
    assert.ok(source, candidate.sourceId);
    assert.ok(candidate.at >= 0 && candidate.at < candidate.end, candidate.sourceId);
    assert.ok(candidate.end <= source.duration, candidate.sourceId);
    assert.equal(candidate.speaker, null, candidate.sourceId);
    assert.equal(candidate.promotionAllowed, false, candidate.sourceId);
    assert.equal(candidate.reviewState, "machine-surfaced-quarantine", candidate.sourceId);
    assert.equal(candidate.evidence.speakerStatus, "not-diarized", candidate.sourceId);
    assert.equal(candidate.evidence.originStatus, "not-inferred", candidate.sourceId);
    assert.equal(candidate.evidence.visualContextVerified, false, candidate.sourceId);
    assert.equal(candidate.evidence.promotionStatus, "quarantined", candidate.sourceId);
  }
  assert.ok(publicExcerpts.length > 300);
  assert.ok(publicExcerpts.every((excerpt) => words(excerpt) <= 16));
  assert.doesNotMatch(
    JSON.stringify(payload),
    /"events"\s*:|"segs"\s*:|"transcript"\s*:|"performer"\s*:/i,
  );
});

test("preserves eleven visual-result firewalls", () => {
  const payload = fixture();
  const visual = payload.streams.filter(
    (stream) => stream.rightsPolicy.mode === "visual-result-unverified",
  );

  assert.equal(visual.length, 11);
  assert.equal(payload.meta.visualResultFirewalls, 11);
  assert.ok(visual.every((stream) => (
    stream.rightsPolicy.visualClaimsAllowed === false
    && stream.rightsPolicy.visualResultClaimsAllowed === false
    && /remains unverified/i.test(stream.summary)
  )));
});

test("pins selection, caption set, and public receipts independently", () => {
  const payload = fixture();
  assert.deepEqual(payload.fingerprints, {
    manifestSha256: "sha256:def7d7a22c354ca18dfc85c4f659ca610a8b43e46019a0af7a33f6e682b78fb2",
    selectionSha256: "sha256:a336a9384f0a02013a343b678e5b3975203e52a20586e0f25f58165bcb78f809",
    captionSetSha256: "sha256:e6987b853359ba3c3d6a6737c6ff08099141fc1efc54b7ae552cee240725f1e9",
    publicFnv1a: "fnv1a32:d24bd304",
  });
  assert.equal(
    payload.fingerprints.selectionSha256,
    sha256Label(payload.selection.records),
  );
  assert.equal(
    payload.fingerprints.publicFnv1a,
    fnv1a32(stableJson(payload.streams)),
  );
});

test("pipeline --check reproduces Recovery Batch 02 byte-for-byte", () => {
  const output = execFileSync(
    "python",
    ["pipeline/wwam_archive_recovery_batch2.py", "--check"],
    { cwd: root, encoding: "utf8", timeout: 180_000 },
  );
  assert.match(output, /Validated archive-recovery-batch2\.js: 25 streams/);
  assert.match(output, /65\.9 hours/);
  assert.match(output, /818,768 words/);
  assert.match(output, /116,679 caption events/);
  assert.match(output, /150 bounded moments/);
  assert.match(output, /440,843 public bytes/);
});
