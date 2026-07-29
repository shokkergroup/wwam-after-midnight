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
    "archive-recovery-batch1.js",
    "WWAM_ARCHIVE_RECOVERY_BATCH1",
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

test("freezes one exact 25-source held-recovery manifest", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const payload = fixture();

  assert.equal(
    sha256Label(manifest),
    "sha256:14aec252b0e2e265206dd3d419f57aab4791ec160c4816dc39619e016ef23f32",
  );
  assert.equal(payload.schema, "shokker-youtube-wiki/archive-recovery-batch/v1");
  assert.equal(payload.selection.manifestSha256, sha256Label(manifest));
  assert.equal(payload.selection.frozen, true);
  assert.equal(manifest.records.length, 25);
  assert.equal(payload.streams.length, 25);
  assert.equal(new Set(payload.streams.map((stream) => stream.id)).size, 25);
  assert.deepEqual(
    payload.streams.map((stream) => stream.id),
    manifest.records.map((record) => record.id),
  );
  assert.deepEqual(
    payload.selection.records,
    manifest.records.map((record) => ({
      rank: record.rank,
      id: record.id,
      title: record.title,
      date: record.date,
      duration: record.duration,
      snapshotViews: record.snapshotViews,
      contentMode: record.contentMode,
      rightsMode: record.rightsMode,
    })),
  );
});

test("publishes only bounded, source-local, non-promotable receipts", () => {
  const payload = fixture();
  const byId = new Map(payload.streams.map((stream) => [stream.id, stream]));
  const publicCandidates = candidates(payload);
  const publicExcerpts = excerpts(payload);

  assert.equal(payload.lane.integrationStatus, "integrated-quarantine");
  assert.equal(payload.lane.promotionAllowed, false);
  assert.equal(payload.meta.streams, 25);
  assert.equal(payload.meta.captioned, 25);
  assert.equal(payload.meta.completeCaptionSpans, 25);
  assert.equal(payload.meta.captionEvents, 129_844);
  assert.equal(payload.meta.publicMomentCandidates, 150);
  assert.equal(payload.meta.retryQueue, 0);
  assert.ok(payload.streams.every((stream) => (
    stream.captionEvidence.eventsAudited >= 50
    && stream.captionEvidence.durationCoveragePercent >= 99.8
    && stream.captionEvidence.fullPayloadPublic === false
    && stream.captionEvidence.speakerDiarized === false
    && stream.captionEvidence.originAttribution === false
  )));
  assert.ok(payload.streams.every((stream) => (
    stream.rightsPolicy.speakerClaimsAllowed === false
    && stream.rightsPolicy.performerClaimsAllowed === false
    && stream.rightsPolicy.originClaimsAllowed === false
    && stream.rightsPolicy.visualClaimsAllowed === false
    && stream.rightsPolicy.visualResultClaimsAllowed === false
    && stream.rightsPolicy.promotionAllowed === false
  )));

  assert.ok(publicCandidates.length > 400);
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

test("preserves the visual-result firewall on ranking and bracket sources", () => {
  const payload = fixture();
  const visual = payload.streams.filter(
    (stream) => stream.rightsPolicy.mode === "visual-result-unverified",
  );

  assert.equal(visual.length, 12);
  assert.equal(payload.meta.visualResultFirewalls, 12);
  assert.ok(visual.every((stream) => (
    stream.rightsPolicy.visualClaimsAllowed === false
    && stream.rightsPolicy.visualResultClaimsAllowed === false
    && /remains unverified/i.test(stream.summary)
  )));
});

test("pins selection, caption set, and public receipts independently", () => {
  const payload = fixture();
  assert.deepEqual(payload.fingerprints, {
    manifestSha256: "sha256:14aec252b0e2e265206dd3d419f57aab4791ec160c4816dc39619e016ef23f32",
    selectionSha256: "sha256:dcf11d1cfd4c6137926c335cad767ff2cc559e3a613c54d11b12da6aa65d49b7",
    captionSetSha256: "sha256:fadb6eea6ec08db63affd796322d689048673582d618fa1655ef96b948b0a1cf",
    publicFnv1a: "fnv1a32:61fd8761",
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

test("loads the recovery overlay into Ask and every Source Dossier", () => {
  const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
  assert.match(app, /archive-recovery-batch1\.js\?v=1\.0\.0/);
  assert.match(app, /WWAM_ARCHIVE_RECOVERY_BATCH1\.streams/);
  assert.match(app, /WWAM_ARCHIVE_RECOVERY_BATCH1\.topicIndex/);
  assert.match(app, /WWAM_ARCHIVE_RECOVERY_BATCH1\.characterIndex/);
  assert.match(app, /missingRecovery/);
  assert.match(app, /recoveryBatch:/);
});

test("pipeline --check reproduces Recovery Batch 01 byte-for-byte", () => {
  const output = execFileSync(
    "python",
    ["pipeline/wwam_archive_recovery_batch1.py", "--check"],
    { cwd: root, encoding: "utf8", timeout: 180_000 },
  );
  assert.match(output, /Validated archive-recovery-batch1\.js: 25 streams/);
  assert.match(output, /71\.9 hours/);
  assert.match(output, /909,734 words/);
  assert.match(output, /129,844 caption events/);
  assert.match(output, /150 bounded moments/);
  assert.match(output, /422,520 public bytes/);
});
