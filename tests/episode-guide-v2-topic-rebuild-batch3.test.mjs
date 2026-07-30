import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import { TOPIC_REBUILD_BATCH1_CONFIGS } from "../scripts/generate-episode-guide-v2-topic-rebuild-batch1.mjs";
import { TOPIC_REBUILD_BATCH2_CONFIGS } from "../scripts/generate-episode-guide-v2-topic-rebuild-batch2.mjs";
import {
  TOPIC_REBUILD_BATCH3_CONFIGS,
  buildTopicRebuildBatch3,
  payloadContentSha256,
  renderTopicRebuildBatch3,
} from "../scripts/generate-episode-guide-v2-topic-rebuild-batch3.mjs";
import { parseCaptionLines } from "../scripts/generate-episode-guide-v2-pilot.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");
const PUBLIC_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-guide-v2-topic-rebuild-batch3.js",
);
const EXPECTED_IDS = [
  "1luh7mKQfz8",
  "hZnTgxx7oUE",
  "rtWl8c57SYk",
  "VTy8U9-9qw8",
  "_QLSlETb9E0",
  "2m0BgJzEPCk",
  "MrBpbfwDlAQ",
  "-k3YduzBoGs",
  "NU-qb0l8pf0",
  "xVUR68diEHQ",
];
const EXPECTED = {
  "1luh7mKQfz8": {
    title: "AVENGERS: ENDGAME SPOILER REVIEW LIVE!!!!!!!",
    format: "spoiler-review",
    score: 90,
    provenance: "youtube-automatic-caption",
  },
  hZnTgxx7oUE: {
    title:
      'GAME OF THRONES RECAP LIVE! Episode 4 "The Last of The Starks\' Season 8',
    format: "episode-recap",
    score: 90,
    provenance: "youtube-automatic-caption",
  },
  rtWl8c57SYk: {
    title: "IT: Welcome To Derry - Episode 1 Recap! LIVE!",
    format: "episode-recap",
    score: 90,
    provenance: "youtube-automatic-caption",
  },
  "VTy8U9-9qw8": {
    title: "PEACEMAKER Season 2 Episode 1 Recap Livestream",
    format: "episode-recap",
    score: 90,
    provenance: "youtube-automatic-caption",
  },
  _QLSlETb9E0: {
    title: "Live w Roy from 'The Merkins'!",
    format: "guest-interview",
    score: 86,
    provenance: "local-speech-to-text",
  },
  "2m0BgJzEPCk": {
    title: "CHILD'S PLAY Spoiler Review LIVE!!!!!!",
    format: "spoiler-review",
    score: 86,
    provenance: "youtube-automatic-caption",
  },
  MrBpbfwDlAQ: {
    title: "DC FAN DOME LIVE! The Batman Panel",
    format: "news-panel",
    score: 86,
    provenance: "youtube-automatic-caption",
  },
  "-k3YduzBoGs": {
    title: "LIVE! HALLOWEEN 2018 REVIEW + Q and A",
    format: "review-and-qa",
    score: 83,
    provenance: "youtube-automatic-caption",
  },
  "NU-qb0l8pf0": {
    title: "Horror Movie News & Action Movie News LIVE - WWAM Video 1/22",
    format: "movie-news",
    score: 83,
    provenance: "youtube-automatic-caption",
  },
  xVUR68diEHQ: {
    title: "90K Subscribers Live Stream Q and A Celebration!!!!!",
    format: "question-and-answer",
    score: 83,
    provenance: "youtube-automatic-caption",
  },
};
const EXPECTED_COUNTS = {
  "1luh7mKQfz8": {
    "topic-door": 3,
    "format-cue": 1,
    "evaluation-candidate": 8,
    "comedy-candidate": 3,
  },
  hZnTgxx7oUE: {
    "topic-door": 1,
    "format-cue": 3,
    "evaluation-candidate": 7,
    "comedy-candidate": 4,
  },
  rtWl8c57SYk: {
    "topic-door": 1,
    "format-cue": 3,
    "evaluation-candidate": 7,
    "comedy-candidate": 4,
  },
  "VTy8U9-9qw8": {
    "topic-door": 2,
    "format-cue": 1,
    "evaluation-candidate": 8,
    "comedy-candidate": 4,
  },
  _QLSlETb9E0: {
    "topic-door": 4,
    "format-cue": 4,
    "evaluation-candidate": 3,
    "comedy-candidate": 4,
  },
  "2m0BgJzEPCk": {
    "topic-door": 4,
    "format-cue": 0,
    "evaluation-candidate": 9,
    "comedy-candidate": 2,
  },
  MrBpbfwDlAQ: {
    "topic-door": 2,
    "format-cue": 2,
    "evaluation-candidate": 5,
    "comedy-candidate": 6,
  },
  "-k3YduzBoGs": {
    "topic-door": 3,
    "format-cue": 2,
    "evaluation-candidate": 8,
    "comedy-candidate": 2,
  },
  "NU-qb0l8pf0": {
    "topic-door": 5,
    "format-cue": 0,
    "evaluation-candidate": 8,
    "comedy-candidate": 2,
  },
  xVUR68diEHQ: {
    "topic-door": 3,
    "format-cue": 3,
    "evaluation-candidate": 7,
    "comedy-candidate": 2,
  },
};
const CLASSIFICATIONS = new Set([
  "topic-door",
  "format-cue",
  "evaluation-candidate",
  "comedy-candidate",
]);
const ATTRIBUTION_KEY =
  /^(?:speaker|speakerId|speakerName|host|hostId|performer|performerId|attributedTo|saidBy|quoteBy)$/i;

const payload = buildTopicRebuildBatch3({ rootDir: ROOT });

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function tokens(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stable(value[key])]),
  );
}

function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return `sha256:${crypto.createHash("sha256").update(input).digest("hex")}`;
}

function loadWindowAssignment(filePath, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, {
    filename: filePath,
  });
  return context.window[globalName];
}

function sourceRecords(value) {
  return value.streams || value.records || value.sources;
}

function findAttributionKeys(value, prefix = "", output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findAttributionKeys(item, `${prefix}[${index}]`, output),
    );
    return output;
  }
  for (const [key, nested] of Object.entries(value)) {
    const location = prefix ? `${prefix}.${key}` : key;
    if (ATTRIBUTION_KEY.test(key)) output.push(location);
    findAttributionKeys(nested, location, output);
  }
  return output;
}

test("freezes ten new high-priority advisories across varied show formats", () => {
  assert.equal(
    payload.schema,
    "wwam-episode-guide-v2-topic-rebuild-batch3/v1",
  );
  assert.deepEqual(payload.selection.ids, EXPECTED_IDS);
  assert.deepEqual(
    TOPIC_REBUILD_BATCH3_CONFIGS.map((config) => config.id),
    EXPECTED_IDS,
  );
  const earlierIds = new Set(
    [...TOPIC_REBUILD_BATCH1_CONFIGS, ...TOPIC_REBUILD_BATCH2_CONFIGS].map(
      (config) => config.id,
    ),
  );
  assert.deepEqual(
    EXPECTED_IDS.filter((id) => earlierIds.has(id)),
    [],
  );
  assert.equal(payload.selection.count, 10);
  assert.equal(payload.selection.integratedIntoSharedRuntime, false);
  assert.equal(payload.meta.guides, 10);
  assert.equal(payload.meta.cuts, 150);
  assert.equal(payload.meta.topicDoors, 47);
  assert.equal(payload.meta.evaluationCandidates, 70);
  assert.equal(payload.meta.comedyCandidates, 33);
  assert.deepEqual(
    new Set(payload.guides.map((record) => record.episodeGuide.format)),
    new Set([
      "spoiler-review",
      "episode-recap",
      "guest-interview",
      "news-panel",
      "review-and-qa",
      "movie-news",
      "question-and-answer",
    ]),
  );
});

test("canonical records, metadata, captions, and hashes still agree", () => {
  for (const config of TOPIC_REBUILD_BATCH3_CONFIGS) {
    const record = payload.guides.find((guide) => guide.id === config.id);
    const expected = EXPECTED[config.id];
    const artifactPath = path.join(ROOT, config.artifact);
    const captionPath = path.join(
      ROOT,
      "source-cache",
      "captions",
      `${config.id}.json`,
    );
    const metadataPath = path.join(
      ROOT,
      "source-cache",
      "metadata",
      `${config.id}.json`,
    );
    const canonicalPayload = loadWindowAssignment(artifactPath, config.global);
    const canonicalSource = sourceRecords(canonicalPayload).find(
      (source) => source.id === config.id,
    );
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const captions = JSON.parse(fs.readFileSync(captionPath, "utf8"));

    assert.ok(canonicalSource, config.id);
    assert.equal(record.title, expected.title, config.id);
    assert.equal(record.title, canonicalSource.title, config.id);
    assert.equal(clean(record.title), clean(metadata.title), config.id);
    assert.equal(record.duration, Number(canonicalSource.duration), config.id);
    assert.equal(record.duration, Number(metadata.duration), config.id);
    assert.equal(record.episodeGuide.format, expected.format, config.id);
    assert.equal(record.sourceAudit.advisory, "generic-label-dominance");
    assert.equal(record.sourceAudit.score, expected.score, config.id);
    assert.equal(record.rightsPolicy.mode, "standard-caption-candidates");
    assert.equal(
      record.inputEvidence.canonicalArtifactSha256,
      sha256(fs.readFileSync(artifactPath)),
      config.id,
    );
    assert.equal(
      record.inputEvidence.canonicalRecordSha256,
      sha256(JSON.stringify(stable(canonicalSource))),
      config.id,
    );
    assert.equal(
      record.inputEvidence.captionSha256,
      sha256(fs.readFileSync(captionPath)),
      config.id,
    );
    assert.equal(
      record.inputEvidence.metadataSha256,
      sha256(fs.readFileSync(metadataPath)),
      config.id,
    );
    assert.equal(
      record.inputEvidence.captionProvenance.type,
      expected.provenance,
      config.id,
    );
    assert.equal(
      record.inputEvidence.captionProvenance.speakerDiarized,
      false,
      config.id,
    );

    if (expected.provenance === "youtube-automatic-caption") {
      assert.match(metadata.caption_url, /[?&]kind=asr(?:&|$)/, config.id);
      assert.match(metadata.caption_url, /[?&]lang=en(?:&|$)/, config.id);
    } else {
      assert.equal(metadata.caption_url, null, config.id);
      assert.equal(
        captions._shokkerProvenance.kind,
        "local-speech-to-text",
        config.id,
      );
      assert.equal(
        captions._shokkerProvenance.canonicalTimestampMapping,
        true,
        config.id,
      );
    }
  }
});

test("every show has fifteen chronological, bounded, and exact ASR receipts", () => {
  for (const record of payload.guides) {
    const guide = record.episodeGuide;
    const ids = new Set(guide.cuts.map((cut) => cut.id));
    const classes = new Set(guide.cuts.map((cut) => cut.classification));

    assert.deepEqual(guide.classificationCounts, EXPECTED_COUNTS[record.id]);
    assert.equal(guide.cuts.length, 15, record.id);
    assert.equal(ids.size, 15, record.id);
    assert.ok(
      classes.has("topic-door") || classes.has("format-cue"),
      record.id,
    );
    assert.ok(classes.has("evaluation-candidate"), record.id);
    assert.ok(classes.has("comedy-candidate"), record.id);
    assert.ok(guide.runtimeCoverage.spanPercent >= 75, record.id);
    assert.match(guide.generationSha256, /^sha256:[a-f0-9]{64}$/, record.id);

    for (const [index, cut] of guide.cuts.entries()) {
      assert.ok(CLASSIFICATIONS.has(cut.classification), cut.id);
      assert.ok(cut.at >= 0, cut.id);
      assert.ok(cut.end > cut.at, cut.id);
      assert.ok(cut.end <= record.duration, cut.id);
      assert.ok(cut.end - cut.at <= 24, cut.id);
      assert.equal(cut.evidenceAt, cut.at, cut.id);
      assert.ok(!index || guide.cuts[index - 1].at < cut.at, cut.id);
      assert.ok(tokens(cut.label).length >= 2, cut.id);
      assert.ok(tokens(cut.summary).length >= 7, cut.id);
      assert.ok(tokens(cut.excerpt).length >= 4, cut.id);
      assert.ok(tokens(cut.excerpt).length <= 16, cut.id);
      assert.equal(cut.promotionAllowed, false, cut.id);
      assert.equal(cut.humanEditorialReviewPerformed, false, cut.id);
      assert.equal(
        cut.evidence.reviewStatus,
        "machine-surfaced-unreviewed",
        cut.id,
      );
      assert.equal(cut.evidence.speakerStatus, "not-diarized", cut.id);
      assert.equal(cut.evidence.performerStatus, "not-inferred", cut.id);
      assert.equal(cut.evidence.originStatus, "not-inferred", cut.id);
      assert.equal(cut.evidence.visualContextStatus, "not-verified", cut.id);
      assert.equal(cut.evidence.placementStatus, "not-applicable", cut.id);
      assert.equal(cut.evidence.promotionAllowed, false, cut.id);
      assert.equal(cut.evidence.humanReviewRequired, true, cut.id);
      assert.equal(
        cut.evidence.type,
        record.inputEvidence.captionProvenance.type,
        cut.id,
      );
    }
  }
});

test("every public excerpt is rebuilt from its exact timestamped ASR window", () => {
  for (const record of payload.guides) {
    const captionPath = path.join(
      ROOT,
      "source-cache",
      "captions",
      `${record.id}.json`,
    );
    const lines = parseCaptionLines(
      JSON.parse(fs.readFileSync(captionPath, "utf8")),
    ).filter(
      (line) => line.at < record.duration && tokens(line.text).length > 0,
    );

    for (const cut of record.episodeGuide.cuts) {
      assert.ok(lines.some((line) => line.at === cut.at), cut.id);
      const expectedExcerpt = tokens(
        lines
          .filter((line) => line.at >= cut.at && line.at <= cut.at + 7)
          .slice(0, 4)
          .map((line) => line.text)
          .join(" "),
      )
        .slice(0, 16)
        .join(" ");
      assert.equal(cut.excerpt, expectedExcerpt, cut.id);
    }
  }
});

test("candidate lanes remain distinct from navigation doors", () => {
  for (const record of payload.guides) {
    for (const cut of record.episodeGuide.cuts) {
      if (cut.classification === "evaluation-candidate") {
        assert.equal(cut.claimLane, "spoken-evaluation-candidate", cut.id);
        assert.equal(cut.navigationOnly, false, cut.id);
        assert.equal(cut.candidateType, "evaluation", cut.id);
      } else if (cut.classification === "comedy-candidate") {
        assert.equal(cut.claimLane, "spoken-comedy-candidate", cut.id);
        assert.equal(cut.navigationOnly, false, cut.id);
        assert.equal(cut.candidateType, "comedy", cut.id);
      } else {
        assert.equal(cut.claimLane, "topic-navigation", cut.id);
        assert.equal(cut.navigationOnly, true, cut.id);
        assert.equal(cut.candidateType, null, cut.id);
      }
    }
  }
});

test("the shard preserves rights firewalls and makes no attribution", () => {
  assert.deepEqual(findAttributionKeys(payload), []);
  assert.equal(payload.policy.speakerAttributionAllowed, false);
  assert.equal(payload.policy.performerAttributionAllowed, false);
  assert.equal(payload.policy.originAttributionAllowed, false);
  assert.equal(payload.policy.visualClaimsAllowed, false);
  assert.equal(payload.policy.unverifiedPlacementClaimsAllowed, false);
  assert.equal(payload.policy.promotionAllowed, false);
  assert.equal(payload.policy.humanEditorialReviewPerformed, false);
  assert.equal(payload.policy.creatorApprovalClaimed, false);

  for (const record of payload.guides) {
    assert.equal(record.rightsPolicy.restrictedToTopicNavigation, false);
    assert.equal(record.rightsPolicy.speakerClaimsAllowed, false);
    assert.equal(record.rightsPolicy.performerClaimsAllowed, false);
    assert.equal(record.rightsPolicy.originClaimsAllowed, false);
    assert.equal(record.rightsPolicy.visualClaimsAllowed, false);
    assert.equal(record.rightsPolicy.visualResultClaimsAllowed, false);
    assert.equal(record.rightsPolicy.promotionAllowed, false);
    assert.equal(record.sourceState.promotionAllowed, false);
    assert.equal(record.sourceState.humanEditorialReviewPerformed, false);
    assert.equal(record.sourceState.creatorApprovalClaimed, false);
    assert.equal(record.episodeGuide.promotionAllowed, false);
    assert.equal(record.episodeGuide.humanEditorialReviewPerformed, false);
    assert.equal(record.episodeGuide.creatorApprovalClaimed, false);

    const prose = record.episodeGuide.cuts
      .map((cut) => `${cut.label} ${cut.summary}`)
      .join("\n");
    assert.doesNotMatch(
      prose,
      /\b(?:Mike|Jay|J|Roy)\s+(?:says|said|jokes|calls|places|ranks)\b/i,
      record.id,
    );
    assert.doesNotMatch(
      prose,
      /\b(?:we see|the screen shows|the scene shows|the image shows)\b/i,
      record.id,
    );
    assert.doesNotMatch(
      prose,
      /\b(?:played by|performed by|voiced by|read by)\b/i,
      record.id,
    );
  }
});

test("signature receipts preserve each show's specific editorial spine", () => {
  const byId = Object.fromEntries(
    payload.guides.map((record) => [record.id, record.episodeGuide.cuts]),
  );
  assert.match(
    byId["1luh7mKQfz8"].find((cut) => cut.at === 2993).label,
    /FINAL VERDICT/,
  );
  assert.equal(
    byId.hZnTgxx7oUE.find((cut) => cut.at === 2369).classification,
    "format-cue",
  );
  assert.match(
    byId.rtWl8c57SYk.find((cut) => cut.at === 1805).label,
    /FINAL VERDICT/,
  );
  assert.equal(
    byId["VTy8U9-9qw8"].find((cut) => cut.at === 3664).classification,
    "evaluation-candidate",
  );
  assert.match(
    byId._QLSlETb9E0.find((cut) => cut.at === 622).label,
    /BREAKOUT QUESTION/,
  );
  assert.match(
    byId["2m0BgJzEPCk"].find((cut) => cut.at === 3947).label,
    /FINAL TURNAROUND/,
  );
  assert.equal(
    byId.MrBpbfwDlAQ.find((cut) => cut.at === 1704).classification,
    "evaluation-candidate",
  );
  assert.match(
    byId["-k3YduzBoGs"].find((cut) => cut.at === 1086).label,
    /HALLOWEEN RANKING/,
  );
  assert.equal(
    byId["NU-qb0l8pf0"].find((cut) => cut.at === 5135).classification,
    "topic-door",
  );
  assert.match(
    byId.xVUR68diEHQ.find((cut) => cut.at === 6244).label,
    /COMMUNITY FINALE/,
  );
});

test("content hash, rebuild, and browser payload are deterministic", () => {
  assert.equal(
    payload.provenance.contentSha256,
    payloadContentSha256(payload),
  );
  assert.match(payload.provenance.contentSha256, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(buildTopicRebuildBatch3({ rootDir: ROOT }), payload);
  assert.equal(
    fs.readFileSync(PUBLIC_PATH, "utf8"),
    renderTopicRebuildBatch3(payload),
  );

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(PUBLIC_PATH, "utf8"), context, {
    filename: PUBLIC_PATH,
  });
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        context.window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH3,
      ),
    ),
    payload,
  );
});
