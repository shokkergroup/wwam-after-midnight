import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  buildReviewedRelease,
  renderReviewedRelease,
} from "../scripts/generate-episode-guide-v2-reviewed-release.mjs";
import { buildReviewBatch } from "../scripts/generate-episode-guide-v2-review-batch.mjs";
import { buildEditorialReview } from "../scripts/audit-episode-guide-v2-review-batch.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");
const RELEASE_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-guide-v2-reviewed-release.js",
);
const MERGE_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-guide-v2-reviewed-merge.js",
);
const BASE_PATH = path.join(ROOT, "public", "demo", "episode-guides.js");
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
const HELD_IDS = new Set([
  "CFUHyfcJDTg",
  "Qb2rDe-kJkI",
  "Z7ArdfA054w",
  "wjJy46oVmow",
  "HLDAxs4_3U4",
  "vq6mrfqOgZw",
]);

const batch = buildReviewBatch({ rootDir: ROOT });
const editorialReview = buildEditorialReview({
  rootDir: ROOT,
  batch,
});
const release = buildReviewedRelease({
  rootDir: ROOT,
  batch,
  review: editorialReview,
});

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadWindowFiles(files) {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(fs.readFileSync(file, "utf8"), context, {
      filename: file,
    });
  }
  return context;
}

function allPromotionFlagsAreFalse(value) {
  if (Array.isArray(value)) return value.every(allPromotionFlagsAreFalse);
  if (!value || typeof value !== "object") return true;
  return Object.entries(value).every(
    ([key, child]) =>
      (key !== "promotionAllowed" || child === false) &&
      allPromotionFlagsAreFalse(child),
  );
}

test("seals the exact strongest ten IDs in editorial rank order", () => {
  assert.equal(
    release.schema,
    "wwam-episode-guide-v2-reviewed-release/v1",
  );
  assert.deepEqual(
    release.reviewReceipts.map((receipt) => receipt.id),
    EXPECTED_IDS,
  );
  assert.deepEqual(
    release.guides.map((guide) => guide.id),
    EXPECTED_IDS,
  );
  assert.deepEqual(
    release.reviewReceipts.map((receipt) => receipt.rank),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.deepEqual(release.meta.ranks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(release.meta.guides, 10);
  assert.equal(release.meta.chapters, 60);
  assert.equal(release.meta.cuts, 120);
  assert.equal(release.meta.recapParagraphs, 40);
});

test("every released guide carries passed source, locality, claim, title, audio, and excerpt gates", () => {
  const sourceRecords = new Map(
    batch.shards
      .flatMap((shard) => shard.guides)
      .map((record) => [record.id, record]),
  );
  const reviews = new Map(
    editorialReview.guideReviews.map((review) => [review.id, review]),
  );
  for (const receipt of release.reviewReceipts) {
    assert.deepEqual(
      receipt.gates,
      {
        sourceBinding: true,
        exactTemporalLocality: true,
        claimSafe: true,
        titleAligned: true,
        lowSourceAudioRisk: true,
        excerptFloor: true,
        promotionDisabled: true,
        allPassed: true,
      },
      receipt.id,
    );
    assert.equal(receipt.evidence.localityRate, 1, receipt.id);
    assert.equal(
      receipt.evidence.exactLocalityCuts,
      receipt.evidence.totalCuts,
      receipt.id,
    );
    assert.equal(receipt.evidence.claimHardGatePassed, true, receipt.id);
    assert.equal(receipt.evidence.titleCoverageRate, 1, receipt.id);
    assert.equal(receipt.evidence.leadAligned, true, receipt.id);
    assert.equal(receipt.evidence.sourceAudioRisk, "low", receipt.id);
    assert.ok(receipt.evidence.excerptQuality >= 93, receipt.id);
    assert.ok(receipt.evidence.lowestCutQuality >= 85, receipt.id);
    assert.equal(receipt.evidence.cutsBelow80, 0, receipt.id);
    assert.deepEqual(receipt.evidence.issueCodes, [], receipt.id);
    assert.equal(
      receipt.source.generationSha256,
      sourceRecords.get(receipt.id).generationSha256,
      receipt.id,
    );
    assert.equal(
      receipt.source.generationSha256,
      reviews.get(receipt.id).generationSha256,
      receipt.id,
    );
  }
});

test("released guide payloads are exact source-bound episodeGuide records", () => {
  const sourceRecords = new Map(
    batch.shards
      .flatMap((shard) => shard.guides)
      .map((record) => [record.id, record]),
  );
  for (const record of release.guides) {
    assert.deepEqual(
      record.episodeGuide,
      sourceRecords.get(record.id).episodeGuide,
      record.id,
    );
    assert.deepEqual(Object.keys(record), ["id", "episodeGuide"]);
  }
});

test("no title-gap or source-audio-held ID enters the release", () => {
  assert.deepEqual(
    release.guides
      .map((guide) => guide.id)
      .filter((id) => HELD_IDS.has(id)),
    [],
  );
});

test("the release remains promotion-disabled at every nested policy flag", () => {
  assert.equal(release.policy.promotionAllowed, false);
  assert.equal(release.policy.automaticPromotionAllowed, false);
  assert.equal(release.policy.reviewedRuntimeEligible, true);
  assert.equal(release.policy.automaticRuntimeHookAllowed, false);
  assert.equal(release.policy.explicitHostIntegrationRequired, true);
  assert.equal(release.policy.humanEditorialReviewRequiredForRuntime, false);
  assert.equal(release.policy.humanEditorialReviewRequiredForPromotion, true);
  assert.deepEqual(release.runtimeEligibility, {
    eligible: true,
    basis: "all-reviewed-release-gates-passed",
    requiredReceiptGate: "allPassed",
    mergeMode: "explicit-additive",
    automaticActivation: false,
  });
  assert.equal(allPromotionFlagsAreFalse(release), true);
});

test("reviewed IDs do not collide with the existing Episode Guide registry", () => {
  const context = loadWindowFiles([BASE_PATH]);
  const base = jsonClone(context.window.WWAM_EPISODE_GUIDES);
  const baseIds = new Set(base.guides.map((guide) => guide.id));
  assert.deepEqual(
    release.guides
      .map((guide) => guide.id)
      .filter((id) => baseIds.has(id)),
    [],
  );
});

test("pure helper merges additively without mutating either input", () => {
  const context = loadWindowFiles([BASE_PATH, MERGE_PATH]);
  const base = context.window.WWAM_EPISODE_GUIDES;
  const helper = context.window.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE;
  const baseBefore = jsonClone(base);
  const releaseBefore = jsonClone(release);
  const merged = helper.merge(base, release);
  const plainMerged = jsonClone(merged);

  assert.deepEqual(jsonClone(base), baseBefore);
  assert.deepEqual(jsonClone(release), releaseBefore);
  assert.equal(plainMerged.schema, baseBefore.schema);
  assert.equal(plainMerged.meta.guides, 48);
  assert.equal(plainMerged.meta.chapters, 289);
  assert.equal(plainMerged.meta.cuts, 692);
  assert.equal(plainMerged.meta.reviewedReleaseGuides, 10);
  assert.deepEqual(
    plainMerged.guides.map((guide) => guide.id),
    baseBefore.guides.map((guide) => guide.id).concat(EXPECTED_IDS),
  );
  assert.equal(
    new Set(plainMerged.guides.map((guide) => guide.id)).size,
    plainMerged.guides.length,
  );
  assert.equal(
    plainMerged.provenance.additiveReleases.at(-1).releaseSha256,
    release.releaseSha256,
  );

  merged.guides[0].episodeGuide.basis = "mutation probe";
  merged.guides.at(-1).episodeGuide.basis = "release mutation probe";
  assert.deepEqual(jsonClone(base), baseBefore);
  assert.deepEqual(jsonClone(release), releaseBefore);
});

test("merge helper rejects collisions in either registry or release", () => {
  const context = loadWindowFiles([BASE_PATH, MERGE_PATH]);
  const base = context.window.WWAM_EPISODE_GUIDES;
  const helper = context.window.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE;
  const duplicateRelease = jsonClone(release);
  duplicateRelease.guides[0].id = base.guides[0].id;
  assert.throws(
    () => helper.merge(base, duplicateRelease),
    /duplicate Episode Guide ID/i,
  );
  duplicateRelease.guides[0] = jsonClone(duplicateRelease.guides[1]);
  assert.throws(
    () => helper.merge(base, duplicateRelease),
    /duplicate guide ID/i,
  );

  const ineligibleRelease = jsonClone(release);
  ineligibleRelease.policy.reviewedRuntimeEligible = false;
  assert.throws(
    () => helper.merge(base, ineligibleRelease),
    /review-eligible/i,
  );
});

test("checked-in release is byte-identical to the deterministic generator", () => {
  assert.equal(
    fs.readFileSync(RELEASE_PATH, "utf8"),
    renderReviewedRelease(release),
  );
  assert.match(release.releaseSha256, /^sha256:[a-f0-9]{64}$/);
  const rebuilt = buildReviewedRelease({
    rootDir: ROOT,
    batch,
    review: editorialReview,
  });
  assert.deepEqual(rebuilt, release);
});

test("generator produces an explicit additive artifact without rewriting the base registry", () => {
  const baseBefore = fs.readFileSync(BASE_PATH, "utf8");
  buildReviewedRelease({
    rootDir: ROOT,
    batch,
    review: editorialReview,
  });
  assert.equal(fs.readFileSync(BASE_PATH, "utf8"), baseBefore);
});
