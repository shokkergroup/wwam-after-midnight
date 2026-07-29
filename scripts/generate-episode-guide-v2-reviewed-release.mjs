import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildReviewBatch } from "./generate-episode-guide-v2-review-batch.mjs";
import { buildEditorialReview } from "./audit-episode-guide-v2-review-batch.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "demo",
  "episode-guide-v2-reviewed-release.js",
);
const GENERATED = "2026-07-29";
const RELEASE_SCHEMA = "wwam-episode-guide-v2-reviewed-release/v1";
const EXPECTED_IDS = [
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

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function sha256(value) {
  return `sha256:${crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex")}`;
}

function promotionFlagsAreFalse(value) {
  if (Array.isArray(value)) return value.every(promotionFlagsAreFalse);
  if (!value || typeof value !== "object") return true;
  return Object.entries(value).every(
    ([key, child]) =>
      (key !== "promotionAllowed" || child === false) &&
      promotionFlagsAreFalse(child),
  );
}

function gateReceipt(candidate, review, record, rubric) {
  const gates = {
    sourceBinding:
      record.id === candidate.id &&
      record.generationSha256 === review.generationSha256,
    exactTemporalLocality:
      review.temporal.localityRate === 1 &&
      review.temporal.exactLocality === review.temporal.totalCuts &&
      review.temporal.excerptInWindow === review.temporal.totalCuts &&
      review.temporal.topicInExcerpt === review.temporal.totalCuts &&
      review.temporal.anchorWithinBound === review.temporal.totalCuts &&
      review.temporal.chronological === true,
    claimSafe:
      review.claims.hardGatePassed === true &&
      review.claims.speakerClaims === 0 &&
      review.claims.originOrPerformanceClaims === 0 &&
      review.claims.visualRankingClaims === 0,
    titleAligned:
      review.titleFit.coverageRate === 1 &&
      review.titleFit.leadAligned === true &&
      review.titleFit.titleTopicsMissingFromCanonicalSource.length === 0,
    lowSourceAudioRisk:
      review.sourceAudio.risk === rubric.requiredSourceAudioRisk &&
      review.sourceAudio.rightsBoundaryHeld === false &&
      review.sourceAudio.ambiguousTrailerCutIds.length === 0 &&
      review.sourceAudio.embeddedMediaCueCutIds.length === 0 &&
      review.sourceAudio.stageDirectionCutIds.length === 0,
    excerptFloor:
      review.excerpts.score >= rubric.minimumExcerptQuality &&
      review.excerpts.lowestCutScore >= rubric.minimumLowestCutQuality &&
      review.excerpts.cutsBelow80 <= rubric.maximumSub80Excerpts,
    promotionDisabled:
      candidate.promotionAllowed === false &&
      review.promotionAllowed === false &&
      promotionFlagsAreFalse(record.episodeGuide),
  };
  return {
    rank: candidate.rank,
    id: candidate.id,
    title: candidate.title,
    date: candidate.date,
    guideFormat: candidate.guideFormat,
    contentMode: candidate.contentMode,
    score: candidate.score,
    source: {
      artifact: record.sourceArtifact,
      generationSha256: record.generationSha256,
      canonicalArtifactSha256:
        record.inputEvidence.canonicalArtifactSha256,
      captionSha256: record.inputEvidence.captionSha256,
    },
    gates: {
      ...gates,
      allPassed: Object.values(gates).every(Boolean),
    },
    evidence: {
      titleCoverageRate: review.titleFit.coverageRate,
      leadAligned: review.titleFit.leadAligned,
      localityRate: review.temporal.localityRate,
      exactLocalityCuts: review.temporal.exactLocality,
      totalCuts: review.temporal.totalCuts,
      claimHardGatePassed: review.claims.hardGatePassed,
      sourceAudioRisk: review.sourceAudio.risk,
      excerptQuality: review.excerpts.score,
      lowestCutQuality: review.excerpts.lowestCutScore,
      cutsBelow80: review.excerpts.cutsBelow80,
      issueCodes: review.issueCodes,
    },
    disposition: "reviewed-additive-runtime-eligible",
    promotionAllowed: false,
  };
}

export function buildReviewedRelease(options = {}) {
  const rootDir = options.rootDir || PROJECT_ROOT;
  const batch = options.batch || buildReviewBatch({ rootDir });
  const review =
    options.review || buildEditorialReview({ rootDir, batch });
  const records = new Map(
    batch.shards
      .flatMap((shard) => shard.guides)
      .map((record) => [record.id, record]),
  );
  const reviews = new Map(
    review.guideReviews.map((guideReview) => [
      guideReview.id,
      guideReview,
    ]),
  );
  const candidateIds = review.promotionCandidates.map(
    (candidate) => candidate.id,
  );
  if (JSON.stringify(candidateIds) !== JSON.stringify(EXPECTED_IDS)) {
    throw new Error(
      `Reviewed release membership changed: ${candidateIds.join(", ")}`,
    );
  }

  const reviewReceipts = review.promotionCandidates.map((candidate) => {
    const record = records.get(candidate.id);
    const guideReview = reviews.get(candidate.id);
    if (!record || !guideReview) {
      throw new Error(`Missing source or review for ${candidate.id}.`);
    }
    const receipt = gateReceipt(
      candidate,
      guideReview,
      record,
      review.rubric,
    );
    if (!receipt.gates.allPassed) {
      const failed = Object.entries(receipt.gates)
        .filter(([key, passed]) => key !== "allPassed" && !passed)
        .map(([key]) => key);
      throw new Error(
        `${candidate.id} failed reviewed release gates: ${failed.join(", ")}`,
      );
    }
    return receipt;
  });
  const guides = review.promotionCandidates.map((candidate) => {
    const record = records.get(candidate.id);
    return {
      id: record.id,
      episodeGuide: record.episodeGuide,
    };
  });
  const releaseCore = {
    schema: RELEASE_SCHEMA,
    generated: GENERATED,
    sourceBatch: {
      schema: batch.index.schema,
      contentSha256: batch.index.provenance.contentSha256,
      guidesAudited: review.sourceBatch.guides,
      cutsAudited: review.sourceBatch.cuts,
    },
    editorialReview: {
      schema: review.schema,
      reportSha256: review.reportSha256,
      promotionTarget: review.policy.promotionTarget,
    },
    policy: {
      promotionAllowed: false,
      automaticPromotionAllowed: false,
      reviewedRuntimeEligible: true,
      automaticRuntimeHookAllowed: false,
      explicitHostIntegrationRequired: true,
      humanEditorialReviewRequiredForRuntime: false,
      humanEditorialReviewRequiredForPromotion: true,
      sourceAudioBoundaryMustBeReviewed: true,
      reviewState: "deterministically-reviewed-additive",
    },
    runtimeEligibility: {
      eligible: true,
      basis: "all-reviewed-release-gates-passed",
      requiredReceiptGate: "allPassed",
      mergeMode: "explicit-additive",
      automaticActivation: false,
    },
    meta: {
      guides: guides.length,
      chapters: guides.reduce(
        (sum, record) => sum + record.episodeGuide.chapters.length,
        0,
      ),
      cuts: guides.reduce(
        (sum, record) => sum + record.episodeGuide.cuts.length,
        0,
      ),
      recapParagraphs: guides.reduce(
        (sum, record) =>
          sum + record.episodeGuide.recap.paragraphs.length,
        0,
      ),
      ranks: reviewReceipts.map((receipt) => receipt.rank),
    },
    reviewReceipts,
    guides,
  };
  return {
    ...releaseCore,
    releaseSha256: sha256(stableJson(releaseCore)),
  };
}

export function renderReviewedRelease(release) {
  return `window.WWAM_EPISODE_GUIDE_V2_REVIEWED_RELEASE = ${JSON.stringify(release)};\n`;
}

function cli() {
  const args = new Set(process.argv.slice(2));
  const release = buildReviewedRelease();
  const rendered = renderReviewedRelease(release);
  if (args.has("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated artifact: ${OUTPUT_PATH}`);
    }
    if (fs.readFileSync(OUTPUT_PATH, "utf8") !== rendered) {
      throw new Error(
        "episode-guide-v2-reviewed-release.js is stale; run the generator.",
      );
    }
    process.stdout.write(
      `Episode Guide V2 reviewed release is deterministic and current: ${release.meta.guides} guides, ${release.meta.cuts} cuts, ${release.releaseSha256}\n`,
    );
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered, "utf8");
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}: ${release.meta.guides} guides, ${release.meta.cuts} cuts, ${release.releaseSha256}\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  cli();
}
