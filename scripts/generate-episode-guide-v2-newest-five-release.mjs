import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildNewestFiveCandidates,
} from "./generate-episode-guide-v2-newest-five.mjs";
import {
  buildNewestFiveAudit,
} from "./audit-episode-guide-v2-newest-five.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "demo",
  "episode-guide-v2-newest-five-release.js",
);
const GENERATED = "2026-07-29";

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function buildNewestFiveRelease(options = {}) {
  const rootDir = options.rootDir || PROJECT_ROOT;
  const candidates =
    options.candidates || buildNewestFiveCandidates({ rootDir });
  const audit =
    options.audit || buildNewestFiveAudit({ rootDir, candidates });
  if (!audit.summary.allPassed) {
    throw new Error("Newest-five release requires every strict machine gate to pass.");
  }
  const auditById = new Map(
    audit.guideAudits.map((guideAudit) => [guideAudit.id, guideAudit]),
  );
  const guides = candidates.guides.map((record) => {
    const guideAudit = auditById.get(record.id);
    if (!guideAudit || !guideAudit.allPassed) {
      throw new Error(`${record.id} has no passing strict machine audit.`);
    }
    return {
      id: record.id,
      episodeGuide: clone(record.episodeGuide),
    };
  });
  const auditReceipts = candidates.guides.map((record) => {
    const guideAudit = auditById.get(record.id);
    return {
      id: record.id,
      title: record.title,
      date: record.date,
      guideFormat: record.guideFormat,
      sourceContentMode: record.sourceContentMode,
      source: {
        artifact: record.sourceArtifact,
        generationSha256: record.generationSha256,
        canonicalArtifactSha256:
          record.inputEvidence.canonicalArtifactSha256,
        captionSha256: record.inputEvidence.captionSha256,
        metadataSha256: record.inputEvidence.metadataSha256,
        captionProvenance: clone(
          record.inputEvidence.captionProvenance,
        ),
      },
      gates: {
        ...clone(guideAudit.gates),
        allPassed: true,
      },
      coverage: clone(guideAudit.coverage),
      auditState: "strict-machine-audited-runtime-eligible",
      humanEditorialReviewPerformed: false,
      creatorApprovalClaimed: false,
      promotionAllowed: false,
    };
  });
  const core = {
    schema: "wwam-episode-guide-v2-deterministic-release/v1",
    generated: GENERATED,
    sourceBatch: {
      schema: candidates.schema,
      contentSha256: candidates.provenance.contentSha256,
      guides: candidates.meta.guides,
      cuts: candidates.meta.cuts,
    },
    machineAudit: {
      schema: audit.schema,
      reportSha256: audit.reportSha256,
      guidesAudited: audit.summary.guidesAudited,
      cutsAudited: audit.summary.cutsAudited,
      allPassed: true,
    },
    policy: {
      promotionAllowed: false,
      automaticPromotionAllowed: false,
      deterministicRuntimeEligible: true,
      automaticRuntimeHookAllowed: false,
      explicitHostIntegrationRequired: true,
      humanEditorialReviewPerformed: false,
      humanEditorialReviewClaimAllowed: false,
      creatorApprovalClaimed: false,
      creatorApprovalClaimAllowed: false,
      sourceAudioBoundaryReviewedByHuman: false,
      speakerAttributionAllowed: false,
      performerAttributionAllowed: false,
      visualRankingOutcomeClaimsAllowed: false,
      reviewState: "strict-machine-audited-additive",
    },
    runtimeEligibility: {
      eligible: true,
      kind: "deterministic-machine-audit",
      basis: "all-strict-machine-audit-gates-passed",
      requiredReceiptGate: "allPassed",
      mergeMode: "explicit-additive",
      automaticActivation: false,
      humanReviewState: "not-performed",
      creatorApprovalState: "not-claimed",
    },
    meta: {
      guides: guides.length,
      chapters: guides.reduce(
        (total, record) =>
          total + record.episodeGuide.chapters.length,
        0,
      ),
      threads: guides.reduce(
        (total, record) =>
          total + record.episodeGuide.threads.length,
        0,
      ),
      cuts: guides.reduce(
        (total, record) =>
          total + record.episodeGuide.cuts.length,
        0,
      ),
    },
    auditReceipts,
    guides,
  };
  return {
    ...core,
    releaseSha256: sha256(stableJson(core)),
  };
}

export function renderNewestFiveRelease(release) {
  return `window.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_RELEASE = ${JSON.stringify(release)};\n`;
}

function cli() {
  const args = new Set(process.argv.slice(2));
  const release = buildNewestFiveRelease();
  const rendered = renderNewestFiveRelease(release);
  if (args.has("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated artifact: ${OUTPUT_PATH}`);
    }
    if (fs.readFileSync(OUTPUT_PATH, "utf8") !== rendered) {
      throw new Error(
        "episode-guide-v2-newest-five-release.js is stale; run the generator.",
      );
    }
    process.stdout.write(
      `Newest-five deterministic release is current: ${release.meta.guides} guides, ` +
        `${release.meta.cuts} cuts, ${release.releaseSha256}\n`,
    );
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered, "utf8");
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}: ` +
      `${release.meta.guides} deterministic-runtime-eligible guides, ` +
      `${release.meta.cuts} cuts, ${release.releaseSha256}\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  cli();
}
