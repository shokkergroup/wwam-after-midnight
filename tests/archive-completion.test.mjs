import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const artifact = path.join(demo, "archive-completion.js");
const manifestPath = path.join(
  root,
  "pipeline",
  "wwam_archive_completion_manifest.json",
);

function loadPayload() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(artifact, "utf8"), context, {
    filename: "archive-completion.js",
  });
  return JSON.parse(JSON.stringify(context.window.WWAM_ARCHIVE_COMPLETION));
}

test("archive completion covers every source frozen in the held manifest", () => {
  const payload = loadPayload();
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  assert.equal(
    payload.schema,
    "shokker-youtube-wiki/archive-completion/v1",
  );
  assert.equal(manifest.sourceCount, 251);
  assert.equal(payload.meta.streams, manifest.sourceCount);
  assert.equal(payload.meta.captioned, 250);
  assert.equal(payload.meta.youtubeCaptionSources, 242);
  assert.equal(payload.meta.localSpeechToTextSources, 8);
  assert.equal(payload.meta.exactSourceHolds, 1);
  assert.equal(payload.meta.substantialCaptionSpans, 250);
  assert.equal(payload.meta.retryQueue, 0);
  assert.deepEqual(
    payload.streams.map((stream) => stream.id),
    manifest.records.map((record) => record.id),
  );
  assert.equal(
    new Set(payload.streams.map((stream) => stream.id)).size,
    manifest.sourceCount,
  );

  const zombieH2 = payload.selection.records.find(
    (record) => record.id === "AzrcgoyE7C4",
  );
  assert.equal(zombieH2.contentMode, "movie-commentary");
  assert.equal(zombieH2.rightsMode, "film-audio-boundary-unverified");
  assert.equal(zombieH2.restrictedToTopicNavigation, true);
  assert.equal(zombieH2.exactSourceTranscriptState, "held-age-gated");
  assert.equal(
    zombieH2.alternateOfficialSource.timestampIsomorphic,
    false,
  );
  for (const id of ["2DbX4UsM-Fw", "rYnXBOwdog4"]) {
    const livestream = payload.selection.records.find(
      (record) => record.id === id,
    );
    assert.equal(livestream.contentMode, "livestream", id);
    assert.equal(livestream.restrictedToTopicNavigation, false, id);
  }
});

test("completion publishes bounded receipts, not full transcripts or invented speakers", () => {
  const source = fs.readFileSync(artifact, "utf8");
  const payload = loadPayload();

  assert.doesNotMatch(
    source,
    /"(?:events|segs|transcript)"\s*:/i,
  );
  for (const stream of payload.streams) {
    const evidence = stream.captionEvidence;
    assert.ok(
      [
        "youtube-automatic-caption",
        "local-speech-to-text",
        "exact-source-unavailable",
      ].includes(evidence.type),
      stream.id,
    );
    if (evidence.type === "exact-source-unavailable") {
      assert.equal(stream.captioned, false, stream.id);
      assert.equal(evidence.eventsAudited, 0, stream.id);
      assert.equal(evidence.eventsObserved, 0, stream.id);
      assert.equal(evidence.eventsWithinCanonicalRuntime, 0, stream.id);
      assert.equal(evidence.eventsDiscardedBeyondCanonicalRuntime, 0, stream.id);
      assert.equal(evidence.eventsClippedAtCanonicalRuntime, 0, stream.id);
      assert.equal(evidence.firstEventSeconds, 0, stream.id);
      assert.equal(evidence.lastEventSeconds, 0, stream.id);
      assert.equal(evidence.leadingGapSeconds, 0, stream.id);
      assert.equal(evidence.trailingGapSeconds, stream.duration, stream.id);
      assert.equal(evidence.spanSeconds, 0, stream.id);
      assert.equal(evidence.durationCoveragePercent, 0, stream.id);
      assert.equal(evidence.payloadSha256, null, stream.id);
      assert.deepEqual(stream.topics, [], stream.id);
      assert.deepEqual(stream.moments, [], stream.id);
      assert.deepEqual(stream.characters, [], stream.id);
      assert.deepEqual(stream.heatmap, [], stream.id);
      assert.equal(stream.peak, null, stream.id);
      assert.equal(
        stream.alternateOfficialSource.timestampIsomorphic,
        false,
        stream.id,
      );
    } else {
      assert.ok(evidence.eventsAudited >= 50, stream.id);
      assert.equal(
        evidence.eventsObserved,
        evidence.eventsWithinCanonicalRuntime +
          evidence.eventsDiscardedBeyondCanonicalRuntime,
        stream.id,
      );
      assert.equal(
        evidence.eventsWithinCanonicalRuntime,
        evidence.eventsAudited,
        stream.id,
      );
      assert.ok(evidence.eventsDiscardedBeyondCanonicalRuntime >= 0, stream.id);
      assert.ok(evidence.eventsClippedAtCanonicalRuntime >= 0, stream.id);
      assert.ok(evidence.durationCoveragePercent >= 80, stream.id);
      assert.ok(evidence.firstEventSeconds >= 0, stream.id);
      assert.ok(
        evidence.lastEventSeconds > evidence.firstEventSeconds,
        stream.id,
      );
      assert.ok(
        Math.abs(
          evidence.spanSeconds -
            Math.round(
              (evidence.lastEventSeconds - evidence.firstEventSeconds) * 10,
            ) / 10,
        ) <= 0.2,
        stream.id,
      );
      assert.ok(
        Math.abs(evidence.leadingGapSeconds - evidence.firstEventSeconds) <= 0.1,
        stream.id,
      );
      assert.ok(
        Math.abs(
          evidence.trailingGapSeconds -
            Math.max(0, stream.duration - evidence.lastEventSeconds),
        ) <= 0.2,
        stream.id,
      );
    }
    assert.match(
      evidence.coverageMeasurement,
      /first-to-last event timeline span.*not dialogue coverage/i,
      stream.id,
    );
    assert.equal(evidence.fullPayloadPublic, false, stream.id);
    assert.equal(evidence.speakerDiarized, false, stream.id);
    assert.equal(stream.rightsPolicy.speakerClaimsAllowed, false, stream.id);
    assert.equal(stream.rightsPolicy.performerClaimsAllowed, false, stream.id);
    assert.equal(stream.rightsPolicy.originClaimsAllowed, false, stream.id);
    assert.equal(stream.rightsPolicy.visualClaimsAllowed, false, stream.id);
    assert.equal(stream.rightsPolicy.promotionAllowed, false, stream.id);

    for (const item of [
      ...(stream.topics || []),
      ...(stream.moments || []),
      ...(stream.characters || []),
    ]) {
      if (item.evidence) {
        assert.equal(item.evidence.type, evidence.type, stream.id);
      }
      if ("speaker" in item) assert.equal(item.speaker, null, stream.id);
      const at = Number(item.at ?? item.t);
      const end = Number(item.end);
      if (Number.isFinite(at) && Number.isFinite(end)) {
        assert.ok(at >= 0 && at < end && end <= stream.duration, stream.id);
      }
    }
    for (const topic of stream.topics || []) {
      if (stream.rightsPolicy.restrictedToTopicNavigation) {
        assert.equal(topic.receipt, null, stream.id);
        assert.equal("receiptBasis" in topic, false, stream.id);
        assert.equal("receiptAt" in topic, false, stream.id);
        continue;
      }
      assert.equal(
        topic.receiptBasis,
        "topic-term-centered-caption-event",
        stream.id,
      );
      assert.ok(
        Math.abs(Number(topic.receiptAt) - Number(topic.at)) <= 2,
        stream.id,
      );
      assert.ok(topic.receipt.split(/\s+/).length <= 16, stream.id);
    }
  }

  const boundedAsr = payload.streams.find(
    (stream) => stream.id === "VNx810srEmw",
  );
  assert.equal(boundedAsr.captionEvidence.type, "local-speech-to-text");
  assert.equal(
    boundedAsr.captionEvidence.audioSourceKind,
    "canonical-youtube-media",
  );
  assert.equal(boundedAsr.captionEvidence.canonicalTimestampMapping, true);
  assert.ok(
    boundedAsr.captionEvidence.eventsDiscardedBeyondCanonicalRuntime >= 1,
  );
  assert.ok(
    boundedAsr.captionEvidence.eventsClippedAtCanonicalRuntime >= 1,
  );
  assert.equal(boundedAsr.captionEvidence.lastEventSeconds, boundedAsr.duration);
});

test("source-audio boundaries stay topic-only after completion", () => {
  const payload = loadPayload();
  const restricted = payload.streams.filter(
    (stream) => stream.rightsPolicy.restrictedToTopicNavigation,
  );

  assert.ok(restricted.length > 0);
  for (const stream of restricted) {
    if (stream.captionEvidence.type === "exact-source-unavailable") {
      assert.deepEqual(stream.topics, [], stream.id);
    } else {
      assert.ok(stream.topics.length > 0, stream.id);
      for (const topic of stream.topics) {
        assert.equal(topic.receipt, null, stream.id);
        assert.equal("receiptBasis" in topic, false, stream.id);
        assert.equal("receiptAt" in topic, false, stream.id);
      }
    }
    assert.deepEqual(stream.moments, [], stream.id);
    assert.deepEqual(stream.characters, [], stream.id);
    assert.deepEqual(stream.heatmap, [], stream.id);
    assert.equal(stream.peak, null, stream.id);
  }
});

test("the browser loader requires and merges the canonical completion lane", () => {
  const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");

  assert.match(
    app,
    /archive-completion\.js\?v=1\.0\.1-receipt-bound/,
  );
  assert.match(app, /WWAM_ARCHIVE_COMPLETION\.streams/);
  assert.match(app, /WWAM_ARCHIVE_COMPLETION\.topicIndex/);
  assert.match(app, /WWAM_ARCHIVE_COMPLETION\.characterIndex/);
  assert.match(app, /missingCompletion/);
});

test("the catalog-only held commentary survives the real adapter and engine path", () => {
  const result = childProcess.spawnSync(
    "node",
    [
      "scripts/audit-episode-recaps.mjs",
      "--source",
      "AzrcgoyE7C4",
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const file = JSON.parse(result.stdout);
  assert.equal(file.recap.state, "held");
  assert.equal(file.coverage, "metadata-only");
  assert.equal(file.officialAlternate.timestampIsomorphic, false);
  assert.equal(file.officialAlternate.publicPlaybackAllowed, true);
  assert.ok(
    file.warnings.some((warning) => (
      /OFFICIAL PODCAST EDITION AVAILABLE/.test(warning)
    )),
  );
  assert.deepEqual(file.receipts, []);
});

test("the checked-in completion artifact regenerates byte-identically", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const check = childProcess.spawnSync(
    "python",
    ["pipeline/wwam_archive_completion.py", "--check"],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  assert.equal(check.status, 0, check.stderr || check.stdout);
  assert.match(
    check.stdout,
    new RegExp(
      `Validated archive-completion\\.js: ${manifest.sourceCount} streams`,
    ),
  );
});
