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
const dataPath = path.join(demo, "archive-deep-batch4.js");

const EXPECTED = [
  {
    id: "2FlxuJxv81s",
    rank: 1,
    score: 83.6,
    breakdown: { popularity: 47.9, recency: 15.7, franchise: 20 },
    duration: 7599,
    views: 18395,
  },
  {
    id: "MSVltTVeypc",
    rank: 2,
    score: 83.5,
    breakdown: { popularity: 48.3, recency: 15.2, franchise: 20 },
    duration: 3209,
    views: 20055,
  },
  {
    id: "Qb2rDe-kJkI",
    rank: 3,
    score: 83.3,
    breakdown: { popularity: 44.3, recency: 25, franchise: 14 },
    duration: 10749,
    views: 8777,
  },
  {
    id: "3Lu0beSDxcQ",
    rank: 4,
    score: 83.3,
    breakdown: { popularity: 43.9, recency: 19.4, franchise: 20 },
    duration: 7695,
    views: 8131,
  },
  {
    id: "21hL29hicoU",
    rank: 5,
    score: 83,
    breakdown: { popularity: 43.8, recency: 25.2, franchise: 14 },
    duration: 2335,
    views: 8030,
  },
  {
    id: "HLDAxs4_3U4",
    rank: 6,
    score: 82.9,
    breakdown: { popularity: 42.8, recency: 26.1, franchise: 14 },
    duration: 8852,
    views: 6492,
  },
  {
    id: "34BwSiucNEI",
    rank: 7,
    score: 82.9,
    breakdown: { popularity: 41.5, recency: 27.4, franchise: 14 },
    duration: 10212,
    views: 4988,
  },
  {
    id: "ETuRUYiQEBM",
    rank: 8,
    score: 82.8,
    breakdown: { popularity: 48.2, recency: 14.6, franchise: 20 },
    duration: 10777,
    views: 19585,
  },
  {
    id: "5k6I18ZekPQ",
    rank: 9,
    score: 82.7,
    breakdown: { popularity: 42.3, recency: 26.4, franchise: 14 },
    duration: 5810,
    views: 5888,
  },
  {
    id: "o0tcJcJk6MY",
    rank: 10,
    score: 82.2,
    breakdown: { popularity: 45, recency: 17.2, franchise: 20 },
    duration: 6578,
    views: 10119,
  },
];

function loadAssignment(filename, assignment) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(demo, filename), "utf8"), context, {
    filename,
  });
  return JSON.parse(JSON.stringify(context.window[assignment]));
}

function fixture() {
  return loadAssignment(
    "archive-deep-batch4.js",
    "WWAM_ARCHIVE_DEEP_BATCH4",
  );
}

function earlierIds() {
  return new Set([
    ...loadAssignment(
      "archive-deep-distill.js",
      "WWAM_ARCHIVE_DEEP",
    ).streams.map((stream) => stream.id),
    ...loadAssignment(
      "archive-deep-batch2.js",
      "WWAM_ARCHIVE_DEEP_BATCH2",
    ).streams.map((stream) => stream.id),
    ...loadAssignment(
      "archive-deep-batch3.js",
      "WWAM_ARCHIVE_DEEP_BATCH3",
    ).streams.map((stream) => stream.id),
  ]);
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

function publicEvidence(payload) {
  return payload.streams.flatMap((stream) => [
    ...stream.topics.map((topic) => topic.evidence),
    ...stream.moments.map((moment) => moment.evidence),
    ...stream.characters.map((character) => character.evidence),
  ]);
}

test("freezes the exact fourth Atlas queue after all 30 earlier sources", () => {
  const payload = fixture();
  const excluded = earlierIds();

  assert.equal(excluded.size, 30);
  assert.equal(payload.schema, "shokker-youtube-wiki/archive-deep-batch/v1");
  assert.deepEqual(payload.channel, {
    id: "we-watched-a-movie",
    label: "We Watched A Movie",
    platform: "youtube",
    canonicalUrl: "https://www.youtube.com/@WeWatchedAMovie",
  });
  assert.deepEqual(payload.lane, {
    id: "archive-deep-batch-04",
    kind: "caption-audited-quarantine",
    sequence: 4,
    integrationStatus: "integrated-quarantine",
    promotionAllowed: false,
    requiresAuthenticatedReview: true,
  });
  assert.equal(payload.selection.atlasSnapshotDate, "2026-07-23");
  assert.equal(payload.selection.priorityVersion, "archive-distill-priority/v1");
  assert.equal(
    payload.selection.sourceAtlasArchiveSha256,
    "sha256:b924d6f91c6a92b86e2d463fa22518f51bd09d57632e0c40f08f0876d97e1174",
  );
  assert.deepEqual(payload.selection.excludedLaneIds, [
    "archive-deep-batch-01",
    "archive-deep-batch-02",
    "archive-deep-batch-03",
  ]);
  assert.equal(
    payload.selection.excludedSourceIdsSha256,
    "sha256:42e8d84e2cb77c56b98c92286f876070e9195251a63ad068cd3145ab7c2e4878",
  );
  assert.equal(payload.selection.frozen, true);
  assert.deepEqual(
    payload.streams.map((stream) => ({
      id: stream.id,
      rank: stream.archivePriority.currentRank,
      score: stream.archivePriority.score,
      breakdown: stream.archivePriority.breakdown,
      duration: stream.duration,
      views: stream.views,
    })),
    EXPECTED,
  );
  assert.deepEqual(
    payload.selection.records.map((record) => record.id),
    EXPECTED.map((record) => record.id),
  );
  assert.ok(payload.streams.every((stream) => !excluded.has(stream.id)));
});

test("describes composite priority without pretending it is view rank", () => {
  const payload = fixture();
  assert.ok(payload.streams.every((stream) => (
    stream.archivePriority.rankStatus === "frozen-atlas-priority"
    && /view-gravity \+ recency \+ franchise-title/i.test(
      stream.archivePriority.basis,
    )
    && /not ranked by views alone/i.test(stream.archivePriority.basis)
    && /Batches 01-03 exclusion/i.test(stream.archivePriority.pool)
    && /Frozen Atlas priority #\d+/i.test(stream.editorial.whyItMatters)
    && /Cached views are a separate snapshot measurement/i.test(
      stream.editorial.whyItMatters,
    )
  )));
  assert.doesNotMatch(JSON.stringify(payload), /by archived views|view-count snapshot/i);
});

test("publishes exact derived metrics and one honest limited caption span", () => {
  const payload = fixture();
  assert.deepEqual(payload.meta, {
    streams: 10,
    captioned: 10,
    limitedCaptionSpan: 1,
    restricted: 3,
    visualContextUnverified: 2,
    hours: 20.5,
    wordsAudited: 259563,
    captionEvents: 37136,
    topicLanes: 100,
    distinctTopics: 33,
    publicMomentCandidates: 35,
    characterSignals: 11,
    snapshotViews: 110460,
  });
  assert.ok(fs.statSync(dataPath).size < 125_000);
  const limited = payload.streams.filter(
    (stream) => stream.captionEvidence.spanStatus === "limited-available-track",
  );
  assert.deepEqual(
    limited.map((stream) => [
      stream.id,
      stream.captionEvidence.durationCoveragePercent,
    ]),
    [["2FlxuJxv81s", 96.03]],
  );
  assert.ok(payload.streams.filter(
    (stream) => stream.captionEvidence.spanStatus === "complete-available",
  ).every((stream) => (
    stream.captionEvidence.durationCoveragePercent >= 99.8
  )));

  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /"events"\s*:\s*\[/);
  assert.doesNotMatch(serialized, /"segs"\s*:\s*\[/);
  assert.doesNotMatch(serialized, /"transcript"\s*:/i);
  assert.doesNotMatch(serialized, /"captions"\s*:/i);
  assert.ok(payload.streams.every((stream) => (
    stream.captionEvidence.fullPayloadPublic === false
    && stream.captionEvidence.speakerDiarized === false
    && stream.captionEvidence.originAttribution === false
    && /^sha256:[a-f0-9]{64}$/.test(stream.captionEvidence.payloadSha256)
  )));
});

test("holds every explicit trailer source behind a topic-only firewall", () => {
  const payload = fixture();
  const restricted = payload.streams.filter(
    (stream) => stream.rightsPolicy.restrictedToTopicNavigation,
  );

  assert.deepEqual(
    restricted.map((stream) => stream.id),
    ["MSVltTVeypc", "21hL29hicoU", "34BwSiucNEI"],
  );
  assert.ok(restricted.every((stream) => (
    stream.contentMode === "trailer-reaction"
    && stream.rightsPolicy.mode === "trailer-audio-boundary-unverified"
    && stream.moments.length === 0
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

test("keeps two tier lists navigable while denying every visual claim", () => {
  const payload = fixture();
  const visual = payload.streams.filter(
    (stream) => stream.rightsPolicy.mode === "visual-context-unverified",
  );

  assert.deepEqual(
    visual.map((stream) => stream.id),
    ["3Lu0beSDxcQ", "o0tcJcJk6MY"],
  );
  assert.ok(visual.every((stream) => (
    stream.contentMode === "visual-ranking"
    && stream.rightsPolicy.restrictedToTopicNavigation === false
    && stream.rightsPolicy.visualClaimsAllowed === false
    && stream.moments.length === 5
    && stream.heatmap.length === 30
  )));
  assert.match(payload.evidencePolicy.visualRankingSurface, /unverified/i);
  assert.match(payload.evidencePolicy.visualRankingSurface, /outcomes/i);
});

test("bounds every timestamp and public excerpt", () => {
  const payload = fixture();
  const excerpts = publicExcerpts(payload);
  assert.ok(excerpts.length > 60);
  assert.ok(excerpts.every(
    (excerpt) => excerpt.trim().split(/\s+/).length <= 16,
  ));
  assert.ok(excerpts.every((excerpt) => (
    !/\b(?:n[\W_]*[i1][\W_]*g[\W_]*g|f[\W_]*a[\W_]*g[\W_]*g|r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d)\w*/i.test(excerpt)
  )));

  for (const stream of payload.streams) {
    assert.ok(stream.duration > 0);
    assert.ok(stream.captionEvidence.eventsAudited > 50);
    assert.ok(stream.captionEvidence.durationCoveragePercent >= 95);
    for (const topic of stream.topics) {
      for (const timestamp of [topic.first, topic.peak]) {
        assert.ok(Number.isFinite(timestamp));
        assert.ok(timestamp >= 0 && timestamp <= stream.duration + 5);
      }
    }
    for (const collection of [
      stream.moments.map((moment) => moment.t),
      stream.characters.map((character) => character.t),
      stream.heatmap.flatMap((window) => [window.from, window.to]),
    ]) {
      assert.ok(collection.every((timestamp) => (
        Number.isFinite(timestamp)
        && timestamp >= 0
        && timestamp <= stream.duration + 5
      )));
    }
  }
});

test("never converts automatic captions into speaker, performance, or canon", () => {
  const payload = fixture();
  assert.equal(payload.evidencePolicy.speakerDiarized, false);
  assert.equal(payload.evidencePolicy.performerAttribution, false);
  assert.equal(payload.evidencePolicy.performanceEstablished, false);
  assert.equal(payload.evidencePolicy.originAttribution, false);
  assert.equal(payload.evidencePolicy.visualContextVerified, false);
  assert.equal(payload.evidencePolicy.candidateState, "quarantined");
  assert.ok(payload.streams.every((stream) => (
    stream.rightsPolicy.speakerClaimsAllowed === false
    && stream.rightsPolicy.performerClaimsAllowed === false
    && stream.rightsPolicy.originClaimsAllowed === false
    && stream.rightsPolicy.visualClaimsAllowed === false
    && stream.rightsPolicy.promotionAllowed === false
  )));
  assert.ok(publicEvidence(payload).every((evidence) => (
    evidence.type === "youtube-automatic-caption"
    && evidence.speakerStatus === "not-diarized"
    && evidence.originStatus === "not-inferred"
    && evidence.visualContextVerified === false
    && evidence.reviewStatus === "machine-candidate"
    && evidence.promotionStatus === "quarantined"
  )));
  assert.ok(payload.streams.flatMap((stream) => stream.characters).every(
    (character) => (
      character.performanceCues === 0
      && character.performanceStatus
        === "not-established-from-automatic-captions"
    ),
  ));
  assert.doesNotMatch(
    JSON.stringify(payload),
    /"speaker"\s*:|"performer"\s*:|creator-certified|editor-verified|canonized/i,
  );
});

test("pins selection, caption set, and public streams independently", () => {
  const payload = fixture();
  assert.equal(
    payload.fingerprints.selectionSha256,
    "sha256:cb5c2cd7528c1dcffa6726b8ab17abeda9b808151ecee92566e53bf0068d30af",
  );
  assert.equal(
    payload.fingerprints.selectionSha256,
    sha256Label(payload.selection.records),
  );
  assert.equal(
    payload.fingerprints.captionSetSha256,
    "sha256:dcfe15a3c00ff419f8afe50585f1b40acac25703e4f2dae5de063927e377b5c6",
  );
  assert.equal(payload.fingerprints.publicFnv1a, "fnv1a32:56ca74df");
  assert.equal(
    payload.fingerprints.publicFnv1a,
    fnv1a32(stableJson(payload.streams)),
  );

  const changed = structuredClone(payload);
  changed.streams[0].title += " changed";
  assert.notEqual(
    payload.fingerprints.publicFnv1a,
    fnv1a32(stableJson(changed.streams)),
  );
});

test("pipeline --check reproduces integrated Batch 04 byte-for-byte", () => {
  const output = execFileSync(
    "python",
    ["pipeline/wwam_archive_deep_batch4.py", "--check"],
    { cwd: root, encoding: "utf8", timeout: 120_000 },
  );
  assert.match(output, /Validated archive-deep-batch4\.js: 10 streams/);
  assert.match(output, /259,563 words/);
  assert.match(output, /35 moment candidates/);
  assert.match(output, /11 character signals/);
  assert.match(output, /114,973 public bytes/);
});
