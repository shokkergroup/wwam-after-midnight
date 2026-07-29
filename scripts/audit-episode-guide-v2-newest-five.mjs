import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildNewestFiveCandidates,
  NEWEST_FIVE_CONFIGS,
} from "./generate-episode-guide-v2-newest-five.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "demo",
  "episode-guide-v2-newest-five-audit.js",
);
const GENERATED = "2026-07-29";
const EXPECTED_IDS = NEWEST_FIVE_CONFIGS.map((config) => config.id);
const X6_ID = "x6tvsGRHgU0";
const ATTRIBUTION_KEY = /^(?:speaker|speakerId|speakerName|host|hostId|performer|performerId|attributedTo|saidBy|quoteBy)$/i;

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function words(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
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

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function sha256(value) {
  return `sha256:${crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex")}`;
}

function attributionKeys(value, pathPrefix = "", output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      attributionKeys(item, `${pathPrefix}[${index}]`, output),
    );
    return output;
  }
  for (const [key, nested] of Object.entries(value)) {
    const keyPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    if (ATTRIBUTION_KEY.test(key)) output.push(keyPath);
    attributionKeys(nested, keyPath, output);
  }
  return output;
}

function allTrue(gates) {
  return Object.values(gates).every(Boolean);
}

function auditGuide(record) {
  const guide = record.episodeGuide;
  const cuts = guide.cuts;
  const chapters = guide.chapters;
  const threads = guide.threads;
  const duration = Number(record.duration);
  const cutIds = new Set(cuts.map((cut) => cut.id));
  const serialized = JSON.stringify(record);
  const isX6 = record.id === X6_ID;
  const provenance = record.inputEvidence.captionProvenance;
  const representedTopics = new Set(
    cuts
      .filter((cut) => cut.topic !== "Source timeline")
      .map((cut) => cut.topic),
  );
  const gates = {
    canonicalIdentity:
      /^[A-Za-z0-9_-]{11}$/.test(record.id) &&
      clean(record.title).length > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(record.date),
    exactGuideShape:
      guide.schema === "wwam-episode-guide/v2" &&
      cuts.length === 12 &&
      chapters.length === 6 &&
      threads.length === 6 &&
      guide.takeArc.length === 3,
    chronologicalUniqueCuts:
      cutIds.size === cuts.length &&
      cuts.every(
        (cut, index) =>
          Number.isInteger(cut.at) &&
          Number.isInteger(cut.end) &&
          cut.at >= 0 &&
          cut.end > cut.at &&
          cut.end <= duration &&
          (!index || cuts[index - 1].at <= cut.at),
      ),
    boundedPublicExcerpts: cuts.every(
      (cut) =>
        words(cut.excerpt).length > 0 &&
        words(cut.excerpt).length <=
          Math.min(16, Number(record.rightsPolicy.publicExcerptWordLimit)),
    ),
    openingCoverage:
      guide.runtimeCoverage.openingPercent <= 10 &&
      cuts[0].at / duration * 100 <= 10,
    closingCoverage:
      guide.runtimeCoverage.closingPercent >= 90 &&
      cuts.at(-1).end / duration * 100 >= 90,
    runtimeSpan:
      guide.runtimeCoverage.spanPercent >= 80 &&
      (cuts.at(-1).end - cuts[0].at) / duration * 100 >= 80,
    chapterBinding:
      chapters.every(
        (chapter) =>
          cutIds.has(chapter.cutId) &&
          chapter.at >= 0 &&
          chapter.end > chapter.at &&
          chapter.end <= duration,
      ),
    takeArcBinding: guide.takeArc.every((phase) => cutIds.has(phase.cutId)),
    recurringThreadEvidence: threads.every((thread) =>
      representedTopics.has(thread.name),
    ),
    exactCaptionProvenance: isX6
      ? provenance.type === "local-speech-to-text" &&
        provenance.engine === "faster-whisper" &&
        provenance.model === "large-v3-turbo" &&
        provenance.canonicalTimestampMapping === true &&
        !/youtube automatic captions?|automatic-caption/i.test(serialized)
      : provenance.type === "youtube-automatic-caption" &&
        provenance.kind === "asr" &&
        provenance.language === "en" &&
        /English YouTube automatic captions \(JSON3\)/.test(provenance.track),
    cutEvidenceProvenance: cuts.every(
      (cut) =>
        cut.evidence &&
        cut.evidence.type === provenance.type &&
        cut.evidence.speakerStatus === "not-diarized" &&
        cut.evidence.reviewStatus === "machine-candidate-unreviewed" &&
        cut.evidence.promotionAllowed === false,
    ),
    canonicalRankingFormat: isX6
      ? guide.format === "ranking" &&
        record.guideFormat === "ranking" &&
        record.sourceContentMode === "ranking-show"
      : guide.format === "movie-news",
    visualOutcomeGuard: isX6
      ? record.rightsPolicy.visualResultClaimsAllowed === false &&
        /no unseen tier or ranking result is claimed/i.test(guide.overview) &&
        guide.chapters.every((chapter) =>
          /No unseen ranking result is asserted\./.test(chapter.body),
        )
      : true,
    noSpeakerInference: attributionKeys(guide).length === 0,
    noFabricatedSteveLane:
      guide.fanRead.hated === null &&
      !guide.lanes &&
      !/straight to steve|steve.?s asshole/i.test(serialized),
    trustBoundary:
      record.sourceState.reviewState === "machine-candidate-unreviewed" &&
      record.sourceState.humanEditorialReviewPerformed === false &&
      record.sourceState.creatorApprovalClaimed === false &&
      record.sourceState.promotionAllowed === false &&
      guide.humanEditorialReviewPerformed === false &&
      guide.creatorApprovalClaimed === false &&
      guide.promotionAllowed === false &&
      guide.publicationStatus === "review-quarantined",
    sourceHashes:
      /^sha256:[a-f0-9]{64}$/.test(
        record.inputEvidence.canonicalArtifactSha256,
      ) &&
      /^sha256:[a-f0-9]{64}$/.test(record.inputEvidence.captionSha256) &&
      /^sha256:[a-f0-9]{64}$/.test(record.inputEvidence.metadataSha256) &&
      /^sha256:[a-f0-9]{64}$/.test(record.generationSha256),
  };
  return {
    id: record.id,
    title: record.title,
    date: record.date,
    guideFormat: record.guideFormat,
    captionProvenance: {
      type: provenance.type,
      track: provenance.track,
      engine: provenance.engine || null,
      model: provenance.model || null,
    },
    coverage: guide.runtimeCoverage,
    counts: {
      cuts: cuts.length,
      chapters: chapters.length,
      threads: threads.length,
      takeArc: guide.takeArc.length,
    },
    gates,
    issues: Object.entries(gates)
      .filter(([, passed]) => !passed)
      .map(([gate]) => gate),
    allPassed: allTrue(gates),
  };
}

export function buildNewestFiveAudit(options = {}) {
  const candidates =
    options.candidates ||
    buildNewestFiveCandidates({ rootDir: options.rootDir || PROJECT_ROOT });
  if (candidates.schema !== "wwam-episode-guide-v2-newest-five-candidates/v1") {
    throw new Error("Newest-five audit requires the candidate-batch schema.");
  }
  const actualIds = candidates.guides.map((record) => record.id);
  if (
    actualIds.length !== EXPECTED_IDS.length ||
    actualIds.some((id, index) => id !== EXPECTED_IDS[index])
  ) {
    throw new Error("Newest-five candidate identity or order drifted.");
  }
  const guideAudits = candidates.guides.map(auditGuide);
  const core = {
    schema: "wwam-episode-guide-v2-newest-five-audit/v1",
    generated: GENERATED,
    sourceBatch: {
      schema: candidates.schema,
      contentSha256: candidates.provenance.contentSha256,
      guides: candidates.meta.guides,
      cuts: candidates.meta.cuts,
    },
    policy: {
      auditKind: "strict-deterministic-machine-audit",
      runtimeEligibilityTarget: "deterministic-additive-only",
      promotionAllowed: false,
      automaticPromotionAllowed: false,
      humanEditorialReviewPerformed: false,
      humanEditorialReviewClaimAllowed: false,
      creatorApprovalClaimAllowed: false,
      speakerAttributionAllowed: false,
      visualRankingOutcomeClaimsAllowed: false,
    },
    summary: {
      guidesAudited: guideAudits.length,
      cutsAudited: guideAudits.reduce(
        (total, audit) => total + audit.counts.cuts,
        0,
      ),
      allPassed: guideAudits.every((audit) => audit.allPassed),
      failedGuides: guideAudits
        .filter((audit) => !audit.allPassed)
        .map((audit) => audit.id),
      openingCoveragePassed: guideAudits.filter(
        (audit) => audit.gates.openingCoverage,
      ).length,
      closingCoveragePassed: guideAudits.filter(
        (audit) => audit.gates.closingCoverage,
      ).length,
      runtimeSpanPassed: guideAudits.filter(
        (audit) => audit.gates.runtimeSpan,
      ).length,
      provenancePassed: guideAudits.filter(
        (audit) =>
          audit.gates.exactCaptionProvenance &&
          audit.gates.cutEvidenceProvenance,
      ).length,
    },
    guideAudits,
  };
  return {
    ...core,
    reportSha256: sha256(stableJson(core)),
  };
}

export function renderNewestFiveAudit(report) {
  return `window.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_AUDIT = ${JSON.stringify(report)};\n`;
}

function cli() {
  const args = new Set(process.argv.slice(2));
  const report = buildNewestFiveAudit();
  if (!report.summary.allPassed) {
    throw new Error(
      `Newest-five strict audit failed: ${report.summary.failedGuides.join(", ")}`,
    );
  }
  const rendered = renderNewestFiveAudit(report);
  if (args.has("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated audit artifact: ${OUTPUT_PATH}`);
    }
    if (fs.readFileSync(OUTPUT_PATH, "utf8") !== rendered) {
      throw new Error(
        "episode-guide-v2-newest-five-audit.js is stale; run the audit.",
      );
    }
    process.stdout.write(
      `Newest-five strict machine audit is deterministic and current: ` +
        `${report.summary.guidesAudited} guides, ${report.summary.cutsAudited} cuts, ` +
        `${report.reportSha256}\n`,
    );
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered, "utf8");
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}: ` +
      `${report.summary.guidesAudited} guides passed every strict machine gate, ` +
      `${report.reportSha256}\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  cli();
}
