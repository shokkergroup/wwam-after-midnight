import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  buildEditorialReview,
  renderEditorialReview,
} from "../scripts/audit-episode-guide-v2-review-batch.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");
const REPORT_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-guide-v2-editorial-review.js",
);
const EXPECTED_PROMOTION_IDS = [
  "lH0EXRN4xdw",
  "3UCnMrLMXbI",
  "fUCQoxTwKqo",
  "WKs1uPGMQvw",
  "k698GIJe8EA",
  "3iMZcaVcvTU",
  "o0tcJcJk6MY",
  "xBOTTKQ9pxU",
  "0svLtx3nZJM",
  "hagePawEnC4",
];
const EXPECTED_TITLE_GAP_IDS = [
  "CFUHyfcJDTg",
  "Qb2rDe-kJkI",
  "Z7ArdfA054w",
  "wjJy46oVmow",
].sort((left, right) => left.localeCompare(right));
const EXPECTED_SOURCE_AUDIO_GUARD_IDS = [
  "HLDAxs4_3U4",
  "Qb2rDe-kJkI",
  "Z7ArdfA054w",
  "vq6mrfqOgZw",
].sort((left, right) => left.localeCompare(right));

const report = buildEditorialReview({ rootDir: ROOT });

function loadReport() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(REPORT_PATH, "utf8"), context, {
    filename: REPORT_PATH,
  });
  return JSON.parse(
    JSON.stringify(context.window.WWAM_EPISODE_GUIDE_V2_EDITORIAL_REVIEW),
  );
}

test("publishes a machine-readable editorial audit for all 28 quarantined guides", () => {
  assert.equal(report.schema, "wwam-episode-guide-v2-editorial-review/v1");
  assert.equal(report.sourceBatch.guides, 28);
  assert.equal(report.sourceBatch.cuts, 336);
  assert.equal(report.summary.guidesAudited, 28);
  assert.equal(report.summary.cutsAudited, 336);
  assert.equal(report.summary.promotionCandidates, 10);
  assert.equal(report.summary.exactLocalityGuides, 28);
  assert.equal(report.summary.claimSafeGuides, 28);
  assert.equal(report.summary.lowSourceAudioRiskGuides, 24);
  assert.equal(report.summary.titleAlignedGuides, 24);
  assert.equal(report.summary.averageExcerptQuality, 94.23);
  assert.equal(report.policy.automaticPromotionAllowed, false);
  assert.equal(report.policy.appHookAllowed, false);
  assert.equal(report.policy.humanEditorialReviewRequired, true);
  assert.equal(report.policy.sourceAudioBoundaryMustBeReviewed, true);
  assert.equal(report.rubric.minimumRuntimeSpanRatio, 0.6);
  assert.equal(report.rubric.minimumExcerptQuality, 93);
  assert.equal(report.rubric.minimumLowestCutQuality, 85);
  assert.equal(report.rubric.requiredSourceAudioRisk, "low");
  assert.match(report.reportSha256, /^sha256:[a-f0-9]{64}$/);
});

test("locks the strongest ten first-production candidates without enabling promotion", () => {
  assert.deepEqual(
    report.promotionCandidates.map((candidate) => candidate.id),
    EXPECTED_PROMOTION_IDS,
  );
  assert.deepEqual(
    report.promotionCandidates.map((candidate) => candidate.rank),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  for (const candidate of report.promotionCandidates) {
    const review = report.guideReviews.find(
      (entry) => entry.id === candidate.id,
    );
    assert.ok(review, candidate.id);
    assert.equal(
      review.disposition,
      "first-production-promotion-candidate",
      candidate.id,
    );
    assert.equal(review.promotionCandidateRank, candidate.rank, candidate.id);
    assert.equal(review.promotionGatePassed, true, candidate.id);
    assert.equal(review.promotionAllowed, false, candidate.id);
    assert.equal(candidate.promotionAllowed, false, candidate.id);
    assert.equal(
      candidate.candidateStatus,
      "human-review-required-before-production-hook",
      candidate.id,
    );
    assert.ok(candidate.score >= 84, candidate.id);
    assert.equal(review.titleFit.coverageRate, 1, candidate.id);
    assert.equal(review.titleFit.leadAligned, true, candidate.id);
    assert.equal(review.temporal.localityRate, 1, candidate.id);
    assert.equal(review.temporal.chronological, true, candidate.id);
    assert.ok(review.temporal.runtimeSpanRatio >= 0.6, candidate.id);
    assert.ok(review.excerpts.score >= 93, candidate.id);
    assert.ok(review.excerpts.lowestCutScore >= 85, candidate.id);
    assert.ok(review.excerpts.cutsBelow80 <= 3, candidate.id);
    assert.equal(review.claims.hardGatePassed, true, candidate.id);
    assert.equal(review.claims.speakerClaims, 0, candidate.id);
    assert.equal(review.claims.visualRankingClaims, 0, candidate.id);
    assert.equal(review.claims.originOrPerformanceClaims, 0, candidate.id);
    assert.equal(review.sourceAudio.risk, "low", candidate.id);
    assert.deepEqual(candidate.issueCodes, [], candidate.id);
  }
});

test("reports title-model gaps instead of silently treating them as aligned", () => {
  const titleGapReviews = report.guideReviews
    .filter((review) =>
      review.issueCodes.includes(
        "TITLE_SUBJECT_MISSING_FROM_CANONICAL_TOPIC_MAP",
      ),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
  assert.deepEqual(
    titleGapReviews.map((review) => review.id),
    EXPECTED_TITLE_GAP_IDS,
  );
  for (const review of titleGapReviews) {
    assert.ok(review.titleFit.titleTopicsMissingFromCanonicalSource.length > 0);
    assert.ok(review.titleFit.coverageRate < 1);
    assert.equal(review.titleFit.leadAligned, false);
    assert.equal(review.promotionGatePassed, false);
    assert.equal(review.disposition, "hold-for-editorial-pass");
  }
});

test("source-audio ambiguity remains a guarded human-review lane", () => {
  const guarded = report.guideReviews
    .filter((review) => review.sourceAudio.risk === "guarded")
    .sort((left, right) => left.id.localeCompare(right.id));
  assert.deepEqual(
    guarded.map((review) => review.id),
    EXPECTED_SOURCE_AUDIO_GUARD_IDS,
  );
  for (const review of guarded) {
    assert.equal(review.sourceAudio.humanBoundaryReviewStillRequired, true);
    assert.equal(review.sourceAudio.rightsBoundaryHeld, false);
    assert.ok(
      review.sourceAudio.ambiguousTrailerCutIds.length +
        review.sourceAudio.embeddedMediaCueCutIds.length +
        Number(review.contentMode === "event-reaction") >
        0,
      review.id,
    );
    assert.equal(review.promotionGatePassed, false, review.id);
  }
  assert.ok(
    report.guideReviews.every(
      (review) => review.sourceAudio.risk !== "high",
    ),
  );
});

test("the audit proves temporal locality, excerpt quality, and claim safety per guide", () => {
  for (const review of report.guideReviews) {
    assert.equal(review.temporal.exactLocality, 12, review.id);
    assert.equal(review.temporal.excerptInWindow, 12, review.id);
    assert.equal(review.temporal.topicInExcerpt, 12, review.id);
    assert.equal(review.temporal.anchorWithinBound, 12, review.id);
    assert.equal(review.temporal.totalCuts, 12, review.id);
    assert.equal(review.temporal.localityRate, 1, review.id);
    assert.equal(review.temporal.chronological, true, review.id);
    assert.equal(review.excerpts.cutReviews.length, 12, review.id);
    assert.equal(
      review.excerpts.issueCounts.stageDirections,
      0,
      review.id,
    );
    assert.equal(
      review.excerpts.issueCounts.missingTopicEvidence,
      0,
      review.id,
    );
    assert.equal(review.claims.hardGatePassed, true, review.id);
    assert.equal(review.promotionAllowed, false, review.id);
  }
});

test("the prose diversification pass materially reduces template collisions", () => {
  assert.deepEqual(report.summary.repetition.headline, {
    uniqueTemplates: 22,
    totalGuides: 28,
    maximumGuidesOnOneTemplate: 2,
    collisionGroups: 6,
  });
  assert.deepEqual(report.summary.repetition.overview, {
    uniqueTemplates: 22,
    totalGuides: 28,
    maximumGuidesOnOneTemplate: 2,
    collisionGroups: 6,
  });
  assert.deepEqual(report.summary.repetition.recapLeadSet, {
    uniqueTemplates: 28,
    totalGuides: 28,
    maximumGuidesOnOneTemplate: 1,
    collisionGroups: 0,
  });
  assert.ok(
    report.guideReviews.every((review) => review.repetition.score >= 87),
  );
});

test("the checked-in report is deterministic and remains disconnected from production", () => {
  const loaded = loadReport();
  assert.deepEqual(loaded, report);
  assert.equal(fs.readFileSync(REPORT_PATH, "utf8"), renderEditorialReview(report));
  const app = fs.readFileSync(
    path.join(ROOT, "public", "demo", "app.js"),
    "utf8",
  );
  const index = fs.readFileSync(
    path.join(ROOT, "public", "demo", "index.html"),
    "utf8",
  );
  assert.doesNotMatch(app, /WWAM_EPISODE_GUIDE_V2_EDITORIAL_REVIEW/);
  assert.doesNotMatch(index, /episode-guide-v2-editorial-review/);
  assert.doesNotMatch(JSON.stringify(report), /\b(?:price|pricing|\$25,000)\b/i);
});
