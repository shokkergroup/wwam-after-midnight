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
const dataPath = path.join(root, "public", "demo", "archive-deep-batch3.js");

const EXPECTED = [
  {
    id: "M9_5cX8xowI",
    rank: 1,
    score: 86.8,
    breakdown: { popularity: 45.9, recency: 20.9, franchise: 20 },
    duration: 10799,
    views: 12209,
  },
  {
    id: "tUJviU09fWM",
    rank: 2,
    score: 86.8,
    breakdown: { popularity: 44.1, recency: 28.7, franchise: 14 },
    duration: 13026,
    views: 8417,
  },
  {
    id: "J5uGidPT9Jc",
    rank: 3,
    score: 85.8,
    breakdown: { popularity: 43.8, recency: 28, franchise: 14 },
    duration: 14815,
    views: 7968,
  },
  {
    id: "nv99WEtXGvE",
    rank: 4,
    score: 85.7,
    breakdown: { popularity: 46.2, recency: 19.5, franchise: 20 },
    duration: 10321,
    views: 12949,
  },
  {
    id: "wjJy46oVmow",
    rank: 5,
    score: 85.6,
    breakdown: { popularity: 46.3, recency: 19.3, franchise: 20 },
    duration: 11153,
    views: 13277,
  },
  {
    id: "yMAvXBYAxko",
    rank: 6,
    score: 85.5,
    breakdown: { popularity: 47, recency: 18.5, franchise: 20 },
    duration: 9578,
    views: 15311,
  },
  {
    id: "fUCQoxTwKqo",
    rank: 7,
    score: 84.8,
    breakdown: { popularity: 45.7, recency: 19.1, franchise: 20 },
    duration: 10270,
    views: 11665,
  },
  {
    id: "3UCnMrLMXbI",
    rank: 8,
    score: 84.7,
    breakdown: { popularity: 43, recency: 27.7, franchise: 14 },
    duration: 11424,
    views: 6752,
  },
  {
    id: "lH0EXRN4xdw",
    rank: 9,
    score: 84.6,
    breakdown: { popularity: 47.6, recency: 17, franchise: 20 },
    duration: 11621,
    views: 17238,
  },
  {
    id: "xBOTTKQ9pxU",
    rank: 10,
    score: 84.1,
    breakdown: { popularity: 47, recency: 17.1, franchise: 20 },
    duration: 6332,
    views: 15425,
  },
];

const EARLIER_BATCH_IDS = new Set([
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
]);

function fixture() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(dataPath, "utf8"), context, {
    filename: "archive-deep-batch3.js",
  });
  return JSON.parse(JSON.stringify(context.window.WWAM_ARCHIVE_DEEP_BATCH3));
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

test("freezes the exact third Atlas queue after both earlier batches", () => {
  const payload = fixture();

  assert.equal(payload.schema, "shokker-youtube-wiki/archive-deep-batch/v1");
  assert.deepEqual(payload.channel, {
    id: "we-watched-a-movie",
    label: "We Watched A Movie",
    platform: "youtube",
    canonicalUrl: "https://www.youtube.com/@WeWatchedAMovie",
  });
  assert.deepEqual(payload.lane, {
    id: "archive-deep-batch-03",
    kind: "caption-audited-quarantine",
    sequence: 3,
    integrationStatus: "integrated-quarantine",
    promotionAllowed: false,
    requiresAuthenticatedReview: true,
  });
  assert.equal(payload.selection.atlasSnapshotDate, "2026-07-23");
  assert.equal(payload.selection.priorityVersion, "archive-distill-priority/v1");
  assert.equal(
    payload.selection.sourceAtlasArchiveSha256,
    "sha256:8799e6de57d891952902bfaf26fe36839b75581cf7c3707f333473b3dcb75da5",
  );
  assert.deepEqual(payload.selection.excludedLaneIds, [
    "archive-deep-batch-01",
    "archive-deep-batch-02",
  ]);
  assert.equal(
    payload.selection.excludedSourceIdsSha256,
    "sha256:3ad06017c627aae67ab99e4207fca92b583b77e2a57f912dbbb76d3bfddb0cf8",
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
  assert.ok(payload.streams.every((stream) => !EARLIER_BATCH_IDS.has(stream.id)));
});

test("describes composite Atlas priority without pretending it is raw view rank", () => {
  const payload = fixture();
  assert.ok(payload.streams.every((stream) => (
    stream.archivePriority.rankStatus === "frozen-atlas-priority"
    && /view-gravity \+ recency \+ franchise-title/i.test(
      stream.archivePriority.basis,
    )
    && /not ranked by views alone/i.test(stream.archivePriority.basis)
    && /Batch 01 and Batch 02 exclusion/i.test(stream.archivePriority.pool)
    && /Frozen Atlas priority #\d+/i.test(stream.editorial.whyItMatters)
    && /Cached views are a separate snapshot measurement/i.test(
      stream.editorial.whyItMatters,
    )
  )));
  assert.doesNotMatch(JSON.stringify(payload), /by archived views|view-count snapshot/i);
});

test("publishes exact derived metrics without exposing full caption payloads", () => {
  const payload = fixture();
  assert.deepEqual(payload.meta, {
    streams: 10,
    captioned: 10,
    restricted: 2,
    visualContextUnverified: 4,
    hours: 30.4,
    wordsAudited: 378427,
    captionEvents: 53988,
    topicLanes: 100,
    distinctTopics: 32,
    publicMomentCandidates: 40,
    characterSignals: 18,
    snapshotViews: 121211,
  });
  assert.ok(fs.statSync(dataPath).size < 125_000);
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

test("holds trailer and death-scene source audio behind topic-only firewalls", () => {
  const payload = fixture();
  const restricted = payload.streams.filter(
    (stream) => stream.rightsPolicy.restrictedToTopicNavigation,
  );

  assert.deepEqual(
    restricted.map((stream) => stream.id),
    ["nv99WEtXGvE", "yMAvXBYAxko"],
  );
  assert.deepEqual(
    restricted.map((stream) => stream.contentMode),
    ["death-scene-ranking", "trailer-reaction"],
  );
  assert.deepEqual(
    restricted.map((stream) => stream.rightsPolicy.mode),
    [
      "film-clip-audio-boundary-unverified",
      "trailer-audio-boundary-unverified",
    ],
  );
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

test("keeps four ranking sources useful while denying every visual claim", () => {
  const payload = fixture();
  const visual = payload.streams.filter(
    (stream) => stream.rightsPolicy.mode === "visual-context-unverified",
  );

  assert.deepEqual(
    visual.map((stream) => stream.id),
    ["tUJviU09fWM", "J5uGidPT9Jc", "3UCnMrLMXbI", "xBOTTKQ9pxU"],
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

test("keeps every timestamp bounded and every public receipt at sixteen words", () => {
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
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /"speaker"\s*:/i);
  assert.doesNotMatch(serialized, /"performer"\s*:/i);
  assert.doesNotMatch(serialized, /creator-certified|editor-verified|canonized/i);
});

test("pins selection, caption set, and public streams independently", () => {
  const payload = fixture();
  assert.equal(
    payload.fingerprints.selectionSha256,
    "sha256:a06f9b2858be38a47fc83d003809f59e994756da68f01c88b46105754f1b6aa8",
  );
  assert.equal(
    payload.fingerprints.selectionSha256,
    sha256Label(payload.selection.records),
  );
  assert.equal(
    payload.fingerprints.captionSetSha256,
    "sha256:9251fdad02633189fd19071a641271b1ff9926ae1e392806f1e1ea9d8c49b1cb",
  );
  assert.equal(payload.fingerprints.publicFnv1a, "fnv1a32:f79f2399");
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

test("pipeline --check reproduces Batch 03 byte-for-byte", () => {
  const output = execFileSync(
    "python",
    ["pipeline/wwam_archive_deep_batch3.py", "--check"],
    { cwd: root, encoding: "utf8", timeout: 120_000 },
  );
  assert.match(output, /Validated archive-deep-batch3\.js: 10 streams/);
  assert.match(output, /378,427 words/);
  assert.match(output, /40 moment candidates/);
  assert.match(output, /18 character signals/);
  assert.match(output, /123,944 public bytes/);
});
