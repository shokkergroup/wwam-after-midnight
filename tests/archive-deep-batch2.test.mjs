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
const dataPath = path.join(root, "public", "demo", "archive-deep-batch2.js");

const EXPECTED = [
  {
    id: "CFUHyfcJDTg",
    rank: 1,
    score: 89.8,
    breakdown: { popularity: 46.6, recency: 23.2, franchise: 20 },
    duration: 10935,
  },
  {
    id: "o4EMYqQ5DDU",
    rank: 2,
    score: 89.7,
    breakdown: { popularity: 43.1, recency: 26.6, franchise: 20 },
    duration: 3571,
  },
  {
    id: "Z7ArdfA054w",
    rank: 3,
    score: 89.5,
    breakdown: { popularity: 43, recency: 26.5, franchise: 20 },
    duration: 9469,
  },
  {
    id: "k698GIJe8EA",
    rank: 4,
    score: 89.4,
    breakdown: { popularity: 43.7, recency: 25.7, franchise: 20 },
    duration: 10776,
  },
  {
    id: "4X8EFw7MCmw",
    rank: 5,
    score: 89.4,
    breakdown: { popularity: 42.6, recency: 26.8, franchise: 20 },
    duration: 4800,
  },
  {
    id: "KIGg_I72x_M",
    rank: 6,
    score: 88.1,
    breakdown: { popularity: 43.5, recency: 24.6, franchise: 20 },
    duration: 10101,
  },
  {
    id: "o2O9T4nwVw4",
    rank: 7,
    score: 87.4,
    breakdown: { popularity: 46.5, recency: 20.9, franchise: 20 },
    duration: 9928,
  },
  {
    id: "qONN2sNoK2k",
    rank: 8,
    score: 87.4,
    breakdown: { popularity: 43.1, recency: 24.3, franchise: 20 },
    duration: 2531,
  },
  {
    id: "QxJyVaAgZ_Y",
    rank: 9,
    score: 87,
    breakdown: { popularity: 43.2, recency: 23.8, franchise: 20 },
    duration: 11231,
  },
  {
    id: "0svLtx3nZJM",
    rank: 10,
    score: 86.9,
    breakdown: { popularity: 47.3, recency: 19.6, franchise: 20 },
    duration: 9771,
  },
];

const BATCH1_IDS = new Set([
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
]);

function fixture() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(dataPath, "utf8"), context, {
    filename: "archive-deep-batch2.js",
  });
  return JSON.parse(JSON.stringify(context.window.WWAM_ARCHIVE_DEEP_BATCH2));
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

function publicExcerpts(payload) {
  return payload.streams.flatMap((stream) => [
    ...stream.topics.map((topic) => topic.receipt).filter(Boolean),
    ...stream.moments.map((moment) => moment.excerpt).filter(Boolean),
    ...stream.characters.map((character) => character.receipt).filter(Boolean),
  ]);
}

function allEvidence(payload) {
  return payload.streams.flatMap((stream) => [
    ...stream.topics.map((topic) => topic.evidence),
    ...stream.moments.map((moment) => moment.evidence),
    ...stream.characters.map((character) => character.evidence),
  ]);
}

test("freezes the exact second Atlas queue after Batch 01 exclusion", () => {
  const payload = fixture();
  assert.equal(payload.schema, "shokker-youtube-wiki/archive-deep-batch/v1");
  assert.deepEqual(payload.channel, {
    id: "we-watched-a-movie",
    label: "We Watched A Movie",
    platform: "youtube",
    canonicalUrl: "https://www.youtube.com/@WeWatchedAMovie",
  });
  assert.deepEqual(payload.lane, {
    id: "archive-deep-batch-02",
    kind: "caption-audited-quarantine",
    sequence: 2,
    integrationStatus: "integrated-quarantine",
    promotionAllowed: false,
    requiresAuthenticatedReview: true,
  });
  assert.equal(payload.selection.atlasSnapshotDate, "2026-07-23");
  assert.equal(payload.selection.priorityVersion, "archive-distill-priority/v1");
  assert.equal(
    payload.selection.sourceAtlasArchiveSha256,
    "sha256:f11c4db03460f8854465718828ae8350e00462b93b4ecd13343d4a8f088d0855"
  );
  assert.deepEqual(payload.selection.excludedLaneIds, ["archive-deep-batch-01"]);
  assert.equal(payload.selection.frozen, true);

  assert.deepEqual(
    payload.streams.map((stream) => ({
      id: stream.id,
      rank: stream.archivePriority.currentRank,
      score: stream.archivePriority.score,
      breakdown: stream.archivePriority.breakdown,
      duration: stream.duration,
    })),
    EXPECTED
  );
  assert.deepEqual(
    payload.selection.records.map((record) => record.id),
    EXPECTED.map((record) => record.id)
  );
  assert.ok(payload.streams.every((stream) => !BATCH1_IDS.has(stream.id)));
});

test("describes frozen Atlas priority without turning cached views into the ranking", () => {
  const payload = fixture();
  assert.match(payload.scope, /view gravity, upload recency, and franchise-title signal/i);
  assert.match(payload.scope, /cached views remain a separate measurement/i);
  assert.equal(payload.evidencePolicy.performanceEstablished, false);
  assert.ok(payload.streams.every((stream) => (
    stream.archivePriority.rankStatus === "frozen-atlas-priority"
    && /view-gravity \+ recency \+ franchise-title/i.test(
      stream.archivePriority.basis
    )
    && /not ranked by views alone/i.test(stream.archivePriority.basis)
    && /Frozen Atlas priority #\d+/i.test(stream.editorial.whyItMatters)
    && /Cached views are a separate snapshot measurement/i.test(
      stream.editorial.whyItMatters
    )
    && stream.editorial.basis.some((line) => /priority components/i.test(line))
  )));
  assert.ok(payload.streams.flatMap((stream) => stream.characters).every(
    (character) => (
      character.performanceCues === 0
      && character.performanceStatus
        === "not-established-from-automatic-captions"
    ),
  ));
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /by archived views|view-count snapshot/i);
  assert.doesNotMatch(
    serialized,
    /explicit performance cue|persona prompt|performance discussion/i,
  );
});

test("publishes a bounded aggregate artifact, never the full caption payload", () => {
  const payload = fixture();
  assert.deepEqual(payload.meta, {
    streams: 10,
    captioned: 10,
    restricted: 3,
    visualContextUnverified: 3,
    hours: 23.1,
    wordsAudited: 284532,
    captionEvents: 38966,
    topicLanes: 100,
    distinctTopics: 32,
    publicMomentCandidates: 49,
    characterSignals: 11,
    snapshotViews: 93357,
  });
  assert.ok(fs.statSync(dataPath).size < 125_000);
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /"events"\s*:\s*\[/);
  assert.doesNotMatch(serialized, /"segs"\s*:\s*\[/);
  assert.doesNotMatch(serialized, /"transcript"\s*:/i);
  assert.ok(payload.streams.every((stream) => (
    stream.captionEvidence.fullPayloadPublic === false
    && stream.captionEvidence.speakerDiarized === false
    && stream.captionEvidence.originAttribution === false
    && /^sha256:[a-f0-9]{64}$/.test(stream.captionEvidence.payloadSha256)
  )));
});

test("enforces topic-only boundaries for trailer, script, and watch-party audio", () => {
  const payload = fixture();
  const restrictedIds = ["4X8EFw7MCmw", "KIGg_I72x_M", "QxJyVaAgZ_Y"];
  const restrictedModes = ["trailer-reaction", "script-reading", "watch-party"];
  const restricted = payload.streams.filter(
    (stream) => stream.rightsPolicy.restrictedToTopicNavigation
  );
  assert.deepEqual(restricted.map((stream) => stream.id), restrictedIds);
  assert.deepEqual(restricted.map((stream) => stream.contentMode), restrictedModes);
  assert.ok(restricted.every((stream) => (
    stream.moments.length === 0
    && stream.characters.length === 0
    && stream.heatmap.length === 0
    && stream.peak === null
    && stream.topics.every((topic) => topic.receipt === null)
    && Object.values(stream.indices).every((value) => value === null)
  )));
  assert.ok(restricted.every((stream) => (
    /withheld-source-boundary/.test(stream.topics[0].evidence.excerptStatus)
    && /source-audio boundary/i.test(stream.indicesUnavailableReason)
  )));
});

test("keeps visual rankings useful but makes their visual context unverified", () => {
  const payload = fixture();
  const visual = payload.streams.filter(
    (stream) => stream.contentMode === "visual-ranking"
  );
  assert.deepEqual(
    visual.map((stream) => stream.id),
    ["CFUHyfcJDTg", "k698GIJe8EA", "0svLtx3nZJM"]
  );
  assert.ok(visual.every((stream) => (
    stream.rightsPolicy.mode === "visual-context-unverified"
    && stream.rightsPolicy.restrictedToTopicNavigation === false
    && stream.rightsPolicy.visualClaimsAllowed === false
    && stream.moments.length > 0
  )));
  assert.match(payload.evidencePolicy.visualRankingSurface, /unverified/i);
});

test("keeps every timestamp inside its source and every receipt to sixteen words", () => {
  const payload = fixture();
  const excerpts = publicExcerpts(payload);
  assert.ok(excerpts.length > 50);
  assert.ok(excerpts.every((excerpt) => excerpt.trim().split(/\s+/).length <= 16));
  assert.ok(excerpts.every((excerpt) => (
    !/\b(?:n[\W_]*[i1][\W_]*g[\W_]*g|f[\W_]*a[\W_]*g[\W_]*g|r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d)\w*/i.test(excerpt)
  )));

  for (const stream of payload.streams) {
    assert.ok(stream.duration > 0);
    assert.ok(stream.captionEvidence.eventsAudited > 50);
    assert.ok(stream.captionEvidence.spanSeconds >= stream.duration * 0.998);
    assert.ok(stream.captionEvidence.durationCoveragePercent >= 99.8);
    for (const topic of stream.topics) {
      for (const timestamp of [topic.first, topic.peak]) {
        assert.ok(Number.isFinite(timestamp));
        assert.ok(timestamp >= 0 && timestamp <= stream.duration + 5);
      }
    }
    for (const moment of stream.moments) {
      assert.ok(Number.isFinite(moment.t));
      assert.ok(moment.t >= 0 && moment.t <= stream.duration + 5);
    }
    for (const character of stream.characters) {
      assert.ok(Number.isFinite(character.t));
      assert.ok(character.t >= 0 && character.t <= stream.duration + 5);
    }
    for (const window of stream.heatmap) {
      assert.ok(window.from >= 0 && window.from <= stream.duration + 5);
      assert.ok(window.to >= window.from && window.to <= stream.duration + 5);
    }
  }
});

test("never turns automatic-caption candidates into attribution or canon", () => {
  const payload = fixture();
  assert.equal(payload.evidencePolicy.speakerDiarized, false);
  assert.equal(payload.evidencePolicy.performerAttribution, false);
  assert.equal(payload.evidencePolicy.originAttribution, false);
  assert.equal(payload.evidencePolicy.candidateState, "quarantined");
  assert.ok(payload.streams.every((stream) => (
    stream.rightsPolicy.speakerClaimsAllowed === false
    && stream.rightsPolicy.performerClaimsAllowed === false
    && stream.rightsPolicy.originClaimsAllowed === false
    && stream.rightsPolicy.visualClaimsAllowed === false
    && stream.rightsPolicy.promotionAllowed === false
  )));
  assert.ok(allEvidence(payload).every((evidence) => (
    evidence.type === "youtube-automatic-caption"
    && evidence.speakerStatus === "not-diarized"
    && evidence.originStatus === "not-inferred"
    && evidence.visualContextVerified === false
    && evidence.reviewStatus === "machine-candidate"
    && evidence.promotionStatus === "quarantined"
  )));
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /"speaker"\s*:/i);
  assert.doesNotMatch(serialized, /"performer"\s*:/i);
  assert.doesNotMatch(serialized, /creator-certified|editor-verified|canonized/i);
});

test("binds selection and public streams to deterministic fingerprints", () => {
  const payload = fixture();
  assert.equal(
    payload.fingerprints.selectionSha256,
    sha256Label(payload.selection.records)
  );
  assert.equal(
    payload.fingerprints.publicFnv1a,
    fnv1a32(stableJson(payload.streams))
  );
  assert.match(payload.fingerprints.captionSetSha256, /^sha256:[a-f0-9]{64}$/);
  assert.match(payload.selection.excludedSourceIdsSha256, /^sha256:[a-f0-9]{64}$/);

  const tampered = structuredClone(payload);
  tampered.streams[0].title += " changed";
  assert.notEqual(
    payload.fingerprints.publicFnv1a,
    fnv1a32(stableJson(tampered.streams))
  );
});

test("pipeline --check reproduces the frozen public artifact byte-for-byte", () => {
  const output = execFileSync(
    "python",
    ["pipeline/wwam_archive_deep_batch2.py", "--check"],
    { cwd: root, encoding: "utf8", timeout: 120_000 }
  );
  assert.match(output, /Validated archive-deep-batch2\.js: 10 streams/);
  assert.match(output, /284,532 words/);
  assert.match(output, /122,143 public bytes/);
});
