import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import { TOPIC_REBUILD_BATCH1_CONFIGS } from "../scripts/generate-episode-guide-v2-topic-rebuild-batch1.mjs";
import { TOPIC_REBUILD_BATCH2_CONFIGS } from "../scripts/generate-episode-guide-v2-topic-rebuild-batch2.mjs";
import { TOPIC_REBUILD_BATCH3_CONFIGS } from "../scripts/generate-episode-guide-v2-topic-rebuild-batch3.mjs";
import { TOPIC_REBUILD_BATCH4_CONFIGS } from "../scripts/generate-episode-guide-v2-topic-rebuild-batch4.mjs";
import {
  TOPIC_REBUILD_BATCH5_CONFIGS,
  buildTopicRebuildBatch5,
  payloadContentSha256,
  renderTopicRebuildBatch5,
} from "../scripts/generate-episode-guide-v2-topic-rebuild-batch5.mjs";
import { parseCaptionLines } from "../scripts/generate-episode-guide-v2-pilot.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");
const PUBLIC_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-guide-v2-topic-rebuild-batch5.js",
);
const EXPECTED_IDS = [
  "Bndzpde-ZZQ",
  "DDY3dPaghWg",
  "FTRWH0lgxa4",
  "Kv8kH3dusjM",
  "m1XIB-ZdQ3Y",
  "MbbQPoGezy0",
  "p7pL7mWBI58",
  "Q13obIV4Dqc",
  "SRZdhswykkA",
  "Ssp_-13AeKA",
  "vxKUwIxs72A",
  "x7ugsiecMio",
  "zPJ9hYgPH44",
];
const EXPECTED = {
  "Bndzpde-ZZQ": {
    title: "STU LIVES!!!!!!!!!!!!!",
    format: "breaking-news-and-qa",
  },
  DDY3dPaghWg: {
    title: "MA & GODZILLA LIVE STREAM REVIEWS + Q and A!!!!",
    format: "double-review-and-qa",
  },
  FTRWH0lgxa4: {
    title: "IT Welcome To Derry Episode 6 Recap LIVE!",
    format: "episode-recap-and-qa",
  },
  Kv8kH3dusjM: {
    title: "We Watched a Movie Live! Friday 1PM EST!",
    format: "livestream-review-and-qa",
  },
  "m1XIB-ZdQ3Y": {
    title: "20 MILLION VIEWS LIVE STREAM!!!!!!",
    format: "milestone-celebration",
  },
  MbbQPoGezy0: {
    title: "PLAY BUTTON UNBOXING LIVE!!!!!!",
    format: "play-button-unboxing",
  },
  p7pL7mWBI58: {
    title: "Movie News LIVE - WWAM Video 1/23",
    format: "movie-news",
  },
  Q13obIV4Dqc: {
    title: "We Watched A Movie LIVE! 11/17",
    format: "trailer-talk-and-qa",
  },
  SRZdhswykkA: {
    title: "Movie Review Marathon! Contracted, Creep (2004) & Clue",
    format: "three-movie-review-marathon",
  },
  "Ssp_-13AeKA": {
    title: "THE CROW Review Livestream",
    format: "spoiler-free-review-and-qa",
  },
  vxKUwIxs72A: {
    title: "Halloween Kills UPDATE!!!! #HalloweenAtHome Post show",
    format: "halloween-news-postshow",
  },
  x7ugsiecMio: {
    title: "LONGLEGS Spoiler Talk Live!",
    format: "spoiler-review-and-qa",
  },
  zPJ9hYgPH44: {
    title: "THE BATMAN Spoiler Free Review Live!",
    format: "spoiler-free-review-and-qa",
  },
};
const EXPECTED_COUNTS = {
  "Bndzpde-ZZQ": {
    "topic-door": 3,
    "format-cue": 2,
    "evaluation-candidate": 8,
    "comedy-candidate": 2,
  },
  DDY3dPaghWg: {
    "topic-door": 2,
    "format-cue": 3,
    "evaluation-candidate": 7,
    "comedy-candidate": 3,
  },
  FTRWH0lgxa4: {
    "topic-door": 4,
    "format-cue": 1,
    "evaluation-candidate": 5,
    "comedy-candidate": 5,
  },
  Kv8kH3dusjM: {
    "topic-door": 1,
    "format-cue": 1,
    "evaluation-candidate": 6,
    "comedy-candidate": 7,
  },
  "m1XIB-ZdQ3Y": {
    "topic-door": 1,
    "format-cue": 3,
    "evaluation-candidate": 4,
    "comedy-candidate": 7,
  },
  MbbQPoGezy0: {
    "topic-door": 2,
    "format-cue": 3,
    "evaluation-candidate": 5,
    "comedy-candidate": 5,
  },
  p7pL7mWBI58: {
    "topic-door": 2,
    "format-cue": 2,
    "evaluation-candidate": 6,
    "comedy-candidate": 5,
  },
  Q13obIV4Dqc: {
    "topic-door": 1,
    "format-cue": 0,
    "evaluation-candidate": 9,
    "comedy-candidate": 5,
  },
  SRZdhswykkA: {
    "topic-door": 3,
    "format-cue": 3,
    "evaluation-candidate": 6,
    "comedy-candidate": 3,
  },
  "Ssp_-13AeKA": {
    "topic-door": 1,
    "format-cue": 2,
    "evaluation-candidate": 10,
    "comedy-candidate": 2,
  },
  vxKUwIxs72A: {
    "topic-door": 2,
    "format-cue": 2,
    "evaluation-candidate": 9,
    "comedy-candidate": 2,
  },
  x7ugsiecMio: {
    "topic-door": 1,
    "format-cue": 2,
    "evaluation-candidate": 8,
    "comedy-candidate": 4,
  },
  zPJ9hYgPH44: {
    "topic-door": 0,
    "format-cue": 2,
    "evaluation-candidate": 10,
    "comedy-candidate": 3,
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
const GENERIC_LABEL =
  /^(?:FULL SEND|UP IN YA|THE ROOM BREAKS|TAKE GETS NUCLEAR|HIGHLIGHT|TOPIC|MOMENT)$/i;

const payload = buildTopicRebuildBatch5({ rootDir: ROOT });

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

test("freezes thirteen new advisories without overlapping Batches 1 through 4", () => {
  assert.equal(
    payload.schema,
    "wwam-episode-guide-v2-topic-rebuild-batch5/v1",
  );
  assert.deepEqual(payload.selection.ids, EXPECTED_IDS);
  assert.deepEqual(
    TOPIC_REBUILD_BATCH5_CONFIGS.map((configValue) => configValue.id),
    EXPECTED_IDS,
  );
  const earlierIds = new Set(
    [
      ...TOPIC_REBUILD_BATCH1_CONFIGS,
      ...TOPIC_REBUILD_BATCH2_CONFIGS,
      ...TOPIC_REBUILD_BATCH3_CONFIGS,
      ...TOPIC_REBUILD_BATCH4_CONFIGS,
    ].map((configValue) => configValue.id),
  );
  assert.deepEqual(
    EXPECTED_IDS.filter((id) => earlierIds.has(id)),
    [],
  );
  assert.equal(payload.selection.count, 13);
  assert.equal(payload.selection.integratedIntoSharedRuntime, false);
  assert.equal(payload.meta.guides, 13);
  assert.equal(payload.meta.cuts, 195);
  assert.equal(payload.meta.topicDoors, 49);
  assert.equal(payload.meta.evaluationCandidates, 93);
  assert.equal(payload.meta.comedyCandidates, 53);
  assert.deepEqual(
    new Set(payload.guides.map((record) => record.episodeGuide.format)),
    new Set(Object.values(EXPECTED).map((entry) => entry.format)),
  );
});

test("canonical identities, metadata, rights, ASR provenance, and hashes agree", () => {
  for (const configValue of TOPIC_REBUILD_BATCH5_CONFIGS) {
    const record = payload.guides.find(
      (guide) => guide.id === configValue.id,
    );
    const expected = EXPECTED[configValue.id];
    const artifactPath = path.join(ROOT, configValue.artifact);
    const captionPath = path.join(
      ROOT,
      "source-cache",
      "captions",
      `${configValue.id}.json`,
    );
    const metadataPath = path.join(
      ROOT,
      "source-cache",
      "metadata",
      `${configValue.id}.json`,
    );
    const canonicalPayload = loadWindowAssignment(
      artifactPath,
      configValue.global,
    );
    const canonicalSource = sourceRecords(canonicalPayload).find(
      (source) => source.id === configValue.id,
    );
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

    assert.ok(canonicalSource, configValue.id);
    assert.equal(record.title, expected.title, configValue.id);
    assert.equal(record.title, canonicalSource.title, configValue.id);
    assert.equal(clean(record.title), clean(metadata.title), configValue.id);
    assert.equal(
      record.duration,
      Number(canonicalSource.duration),
      configValue.id,
    );
    assert.equal(record.duration, Number(metadata.duration), configValue.id);
    assert.equal(
      record.episodeGuide.format,
      expected.format,
      configValue.id,
    );
    assert.equal(
      record.sourceAudit.advisory,
      "generic-label-dominance",
      configValue.id,
    );
    assert.equal(record.sourceAudit.score, 83, configValue.id);
    assert.equal(
      record.rightsPolicy.mode,
      "standard-caption-candidates",
      configValue.id,
    );
    assert.equal(
      record.inputEvidence.canonicalArtifactSha256,
      sha256(fs.readFileSync(artifactPath)),
      configValue.id,
    );
    assert.equal(
      record.inputEvidence.canonicalRecordSha256,
      sha256(JSON.stringify(stable(canonicalSource))),
      configValue.id,
    );
    assert.equal(
      record.inputEvidence.captionSha256,
      sha256(fs.readFileSync(captionPath)),
      configValue.id,
    );
    assert.equal(
      record.inputEvidence.metadataSha256,
      sha256(fs.readFileSync(metadataPath)),
      configValue.id,
    );
    assert.equal(
      record.inputEvidence.captionProvenance.type,
      "youtube-automatic-caption",
      configValue.id,
    );
    assert.equal(
      record.inputEvidence.captionProvenance.speakerDiarized,
      false,
      configValue.id,
    );
    assert.match(
      metadata.caption_url,
      /[?&]kind=asr(?:&|$)/,
      configValue.id,
    );
    assert.match(
      metadata.caption_url,
      /[?&]lang=en(?:&|$)/,
      configValue.id,
    );
  }
});

test("every show has fifteen chronological, bounded, exact, source-specific receipts", () => {
  for (const record of payload.guides) {
    const guide = record.episodeGuide;
    const ids = new Set(guide.cuts.map((cut) => cut.id));
    const labels = new Set(guide.cuts.map((cut) => cut.label));
    const classes = new Set(guide.cuts.map((cut) => cut.classification));

    assert.deepEqual(guide.classificationCounts, EXPECTED_COUNTS[record.id]);
    assert.equal(guide.cuts.length, 15, record.id);
    assert.equal(ids.size, 15, record.id);
    assert.equal(labels.size, 15, record.id);
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
      assert.ok(tokens(cut.label).length >= 3, cut.id);
      assert.doesNotMatch(cut.label, GENERIC_LABEL, cut.id);
      assert.ok(tokens(cut.summary).length >= 6, cut.id);
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

test("candidate lanes remain distinct from navigation and format doors", () => {
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

test("signature receipts preserve each source's real editorial spine", () => {
  const byId = Object.fromEntries(
    payload.guides.map((record) => [record.id, record.episodeGuide.cuts]),
  );
  assert.match(
    byId["Bndzpde-ZZQ"].find((cut) => cut.at === 4279).label,
    /NOSTALGIA AND META/,
  );
  assert.match(
    byId.DDY3dPaghWg.find((cut) => cut.at === 836).label,
    /GODZILLA VERDICT/,
  );
  assert.match(
    byId.FTRWH0lgxa4.find((cut) => cut.at === 818).label,
    /SEASON CHECKPOINT/,
  );
  assert.match(
    byId.Kv8kH3dusjM.find((cut) => cut.at === 2492).label,
    /CHUCKY TEASER/,
  );
  assert.match(
    byId["m1XIB-ZdQ3Y"].find((cut) => cut.at === 320).label,
    /TWENTY MILLION/,
  );
  assert.match(
    byId.MbbQPoGezy0.find((cut) => cut.at === 3646).label,
    /UNBOXING CALL/,
  );
  assert.match(
    byId.p7pL7mWBI58.find((cut) => cut.at === 752).label,
    /OSCAR MORNING/,
  );
  assert.match(
    byId.Q13obIV4Dqc.find((cut) => cut.at === 4926).label,
    /NIGHTMARE REMAKE/,
  );
  assert.match(
    byId.SRZdhswykkA.find((cut) => cut.at === 1557).label,
    /CLUE START/,
  );
  assert.match(
    byId.SRZdhswykkA.find((cut) => cut.at === 4984).label,
    /CREEP START/,
  );
  assert.match(
    byId["Ssp_-13AeKA"].find((cut) => cut.at === 1951).label,
    /SAVE YOUR MONEY/,
  );
  assert.match(
    byId.vxKUwIxs72A.find((cut) => cut.at === 320).label,
    /HALLOWEEN KILLS UPDATE/,
  );
  assert.match(
    byId.x7ugsiecMio.find((cut) => cut.at === 2783).label,
    /SATANIC REVEAL/,
  );
  assert.match(
    byId.zPJ9hYgPH44.find((cut) => cut.at === 205).label,
    /FAVORITE BATMAN/,
  );
});

test("content hash, deterministic rebuild, and browser payload agree", () => {
  assert.equal(
    payload.provenance.contentSha256,
    payloadContentSha256(payload),
  );
  assert.match(payload.provenance.contentSha256, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(buildTopicRebuildBatch5({ rootDir: ROOT }), payload);
  assert.equal(
    fs.readFileSync(PUBLIC_PATH, "utf8"),
    renderTopicRebuildBatch5(payload),
  );

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(PUBLIC_PATH, "utf8"), context, {
    filename: PUBLIC_PATH,
  });
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        context.window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH5,
      ),
    ),
    payload,
  );
});
