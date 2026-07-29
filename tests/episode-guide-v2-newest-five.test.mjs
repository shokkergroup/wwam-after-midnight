import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  buildNewestFiveCandidates,
  renderNewestFiveCandidates,
} from "../scripts/generate-episode-guide-v2-newest-five.mjs";
import {
  buildNewestFiveAudit,
  renderNewestFiveAudit,
} from "../scripts/audit-episode-guide-v2-newest-five.mjs";
import {
  buildNewestFiveRelease,
  renderNewestFiveRelease,
} from "../scripts/generate-episode-guide-v2-newest-five-release.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");
const PUBLIC_DIR = path.join(ROOT, "public", "demo");
const CANDIDATE_PATH = path.join(
  PUBLIC_DIR,
  "episode-guide-v2-newest-five-candidates.js",
);
const AUDIT_PATH = path.join(
  PUBLIC_DIR,
  "episode-guide-v2-newest-five-audit.js",
);
const RELEASE_PATH = path.join(
  PUBLIC_DIR,
  "episode-guide-v2-newest-five-release.js",
);
const OLD_RELEASE_PATH = path.join(
  PUBLIC_DIR,
  "episode-guide-v2-reviewed-release.js",
);
const MERGE_PATH = path.join(
  PUBLIC_DIR,
  "episode-guide-v2-reviewed-merge.js",
);
const BASE_PATH = path.join(PUBLIC_DIR, "episode-guides.js");
const EXPECTED_IDS = [
  "LV2rmwEA0w4",
  "iz0WFhe6LYM",
  "ag3axSC9BpU",
  "x6tvsGRHgU0",
  "7PzSj-oIRjA",
];
const X6_ID = "x6tvsGRHgU0";
const ATTRIBUTION_KEY =
  /^(?:speaker|speakerId|speakerName|host|hostId|performer|performerId|attributedTo|saidBy|quoteBy)$/i;

const candidates = buildNewestFiveCandidates({ rootDir: ROOT });
const audit = buildNewestFiveAudit({ rootDir: ROOT, candidates });
const release = buildNewestFiveRelease({
  rootDir: ROOT,
  candidates,
  audit,
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

function findAttributionKeys(value, pathPrefix = "", output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findAttributionKeys(item, `${pathPrefix}[${index}]`, output),
    );
    return output;
  }
  for (const [key, nested] of Object.entries(value)) {
    const keyPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    if (ATTRIBUTION_KEY.test(key)) output.push(keyPath);
    findAttributionKeys(nested, keyPath, output);
  }
  return output;
}

function buildDossierWithOrderedReleases() {
  const context = loadWindowFiles(
    [
      "catalog.js",
      "deep-distill.js",
      "episode-guides.js",
      "episode-guide-v2-reviewed-release.js",
      "episode-guide-v2-newest-five-release.js",
      "episode-guide-v2-reviewed-merge.js",
      "livestream-distill.js",
      "popular-live-distill.js",
      "character-lore.js",
      "wwam-channel-dna.js",
      "showcase-engine.js",
      "creator-studio-engine.js",
      "archive-atlas-data.js",
      "archive-deep-distill.js",
      "archive-deep-batch2.js",
      "archive-deep-batch3.js",
      "archive-deep-batch4.js",
      "archive-deep-engine.js",
      "archive-deep-portfolio.js",
      "year-canon-2025-2026.js",
      "archive-recovery-batch1.js",
      "archive-recovery-batch2.js",
      "archive-completion.js",
      "episode-recap-engine.js",
      "wwam-episode-recap-adapter.js",
      "wwam-source-dossier-adapter.js",
      "source-dossier-engine.js",
      "source-query-engine.js",
    ].map((file) => path.join(PUBLIC_DIR, file)),
  );
  const window = context.window;
  window.WWAM_EPISODE_GUIDES =
    window.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE.mergeOrdered(
      window.WWAM_EPISODE_GUIDES,
      [
        window.WWAM_EPISODE_GUIDE_V2_REVIEWED_RELEASE,
        window.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_RELEASE,
      ],
    );
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const archiveDeepBase = window.WWAMArchiveDeepPortfolio.create(
    [
      window.WWAM_ARCHIVE_DEEP,
      window.WWAM_ARCHIVE_DEEP_BATCH2,
      window.WWAM_ARCHIVE_DEEP_BATCH3,
      window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    window.WWAMArchiveDeepEngine,
  );
  const archiveSearchBase = archiveDeepBase.getSearchPayload();
  const supplemental = [
    window.WWAM_YEAR_CANON_2025_2026,
    window.WWAM_ARCHIVE_RECOVERY_BATCH1,
    window.WWAM_ARCHIVE_RECOVERY_BATCH2,
    window.WWAM_ARCHIVE_COMPLETION,
  ];
  const archiveSearch = {
    ...archiveSearchBase,
    streams: archiveSearchBase.streams.concat(
      ...supplemental.map((payload) => payload.streams),
    ),
    topicIndex: archiveSearchBase.topicIndex.concat(
      ...supplemental.map((payload) => payload.topicIndex),
    ),
    characterIndex: archiveSearchBase.characterIndex.concat(
      ...supplemental.map((payload) => payload.characterIndex),
    ),
  };
  const dossier = window.WWAMSourceDossierAdapter.build({
    atlas: window.WWAM_ARCHIVE_ATLAS,
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    episodeGuides: window.WWAM_EPISODE_GUIDES,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: {
      getSearchPayload() {
        return archiveSearch;
      },
    },
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:newest-five-integration-test",
    },
  });
  return {
    dossier,
    engine: window.ShokkerSourceDossier.create(dossier),
    registry: window.WWAM_EPISODE_GUIDES,
  };
}

test("freezes the exact newest five, including the July 23 upload", () => {
  assert.equal(
    candidates.schema,
    "wwam-episode-guide-v2-newest-five-candidates/v1",
  );
  assert.deepEqual(
    candidates.guides.map((record) => record.id),
    EXPECTED_IDS,
  );
  assert.equal(candidates.selection.july23Included, true);
  assert.equal(candidates.guides[0].date, "2026-07-23");
  assert.equal(candidates.meta.guides, 5);
  assert.equal(candidates.meta.chapters, 30);
  assert.equal(candidates.meta.threads, 30);
  assert.equal(candidates.meta.cuts, 60);
});

test("every guide has twelve chronological cuts, six chapters, six threads, and full-runtime coverage", () => {
  for (const record of candidates.guides) {
    const guide = record.episodeGuide;
    const cutIds = new Set(guide.cuts.map((cut) => cut.id));
    const representedTopics = new Set(
      guide.cuts
        .filter((cut) => cut.topic !== "Source timeline")
        .map((cut) => cut.topic),
    );

    assert.equal(guide.cuts.length, 12, record.id);
    assert.equal(guide.chapters.length, 6, record.id);
    assert.equal(guide.threads.length, 6, record.id);
    assert.equal(guide.takeArc.length, 3, record.id);
    assert.equal(cutIds.size, 12, record.id);
    assert.ok(guide.runtimeCoverage.openingPercent <= 10, record.id);
    assert.ok(guide.runtimeCoverage.closingPercent >= 90, record.id);
    assert.ok(guide.runtimeCoverage.spanPercent >= 80, record.id);
    assert.ok(
      guide.cuts.every(
        (cut, index) =>
          cut.at >= 0 &&
          cut.end > cut.at &&
          cut.end <= record.duration &&
          (!index || guide.cuts[index - 1].at <= cut.at),
      ),
      record.id,
    );
    assert.ok(
      guide.chapters.every((chapter) => cutIds.has(chapter.cutId)),
      record.id,
    );
    assert.ok(
      guide.takeArc.every((phase) => cutIds.has(phase.cutId)),
      record.id,
    );
    assert.ok(
      guide.threads.every((thread) => representedTopics.has(thread.name)),
      record.id,
    );
  }
});

test("preserves exact caption provenance and the x6 ranking/local-ASR boundary", () => {
  const x6 = candidates.guides.find((record) => record.id === X6_ID);
  const otherFour = candidates.guides.filter(
    (record) => record.id !== X6_ID,
  );

  assert.equal(x6.guideFormat, "ranking");
  assert.equal(x6.sourceContentMode, "ranking-show");
  assert.equal(x6.episodeGuide.format, "ranking");
  assert.equal(
    x6.inputEvidence.captionProvenance.type,
    "local-speech-to-text",
  );
  assert.equal(
    x6.inputEvidence.captionProvenance.engine,
    "faster-whisper",
  );
  assert.equal(
    x6.inputEvidence.captionProvenance.model,
    "large-v3-turbo",
  );
  assert.equal(
    x6.inputEvidence.captionProvenance.canonicalTimestampMapping,
    true,
  );
  assert.doesNotMatch(
    JSON.stringify(x6),
    /youtube automatic captions?|automatic-caption/i,
  );
  assert.match(
    x6.episodeGuide.overview,
    /no unseen tier or ranking result is claimed/i,
  );

  for (const record of otherFour) {
    assert.equal(record.guideFormat, "movie-news", record.id);
    assert.equal(
      record.inputEvidence.captionProvenance.type,
      "youtube-automatic-caption",
      record.id,
    );
    assert.equal(
      record.inputEvidence.captionProvenance.kind,
      "asr",
      record.id,
    );
    assert.equal(
      record.inputEvidence.captionProvenance.language,
      "en",
      record.id,
    );
  }
});

test("keeps unsafe attribution, visual results, promotion, approval, and Steve lanes out", () => {
  for (const record of candidates.guides) {
    const serialized = JSON.stringify(record);
    const guide = record.episodeGuide;

    assert.deepEqual(findAttributionKeys(guide), [], record.id);
    assert.doesNotMatch(
      serialized,
      /straight to steve|steve.?s asshole/i,
      record.id,
    );
    assert.equal(guide.fanRead.hated, null, record.id);
    assert.equal(guide.promotionAllowed, false, record.id);
    assert.equal(guide.humanEditorialReviewPerformed, false, record.id);
    assert.equal(guide.creatorApprovalClaimed, false, record.id);
    assert.equal(
      record.rightsPolicy.visualResultClaimsAllowed,
      false,
      record.id,
    );
    assert.equal(record.sourceState.promotionAllowed, false, record.id);
    assert.equal(
      record.sourceState.humanEditorialReviewPerformed,
      false,
      record.id,
    );
    assert.equal(
      record.sourceState.creatorApprovalClaimed,
      false,
      record.id,
    );
  }
});

test("strict audit passes every gate for all five guides and sixty cuts", () => {
  assert.equal(audit.schema, "wwam-episode-guide-v2-newest-five-audit/v1");
  assert.deepEqual(audit.summary, {
    guidesAudited: 5,
    cutsAudited: 60,
    allPassed: true,
    failedGuides: [],
    openingCoveragePassed: 5,
    closingCoveragePassed: 5,
    runtimeSpanPassed: 5,
    provenancePassed: 5,
  });
  for (const guideAudit of audit.guideAudits) {
    assert.equal(guideAudit.allPassed, true, guideAudit.id);
    assert.ok(
      Object.values(guideAudit.gates).every(Boolean),
      guideAudit.id,
    );
  }
});

test("release is deterministic-runtime eligible without claiming human review or creator approval", () => {
  assert.equal(
    release.schema,
    "wwam-episode-guide-v2-deterministic-release/v1",
  );
  assert.equal(release.meta.guides, 5);
  assert.equal(release.meta.chapters, 30);
  assert.equal(release.meta.threads, 30);
  assert.equal(release.meta.cuts, 60);
  assert.equal(release.auditReceipts.length, 5);
  assert.equal("reviewReceipts" in release, false);
  assert.equal(release.policy.promotionAllowed, false);
  assert.equal(release.policy.deterministicRuntimeEligible, true);
  assert.equal(release.policy.automaticRuntimeHookAllowed, false);
  assert.equal(release.policy.humanEditorialReviewPerformed, false);
  assert.equal(release.policy.humanEditorialReviewClaimAllowed, false);
  assert.equal(release.policy.creatorApprovalClaimed, false);
  assert.equal(release.policy.creatorApprovalClaimAllowed, false);
  assert.equal(release.runtimeEligibility.humanReviewState, "not-performed");
  assert.equal(release.runtimeEligibility.creatorApprovalState, "not-claimed");
  assert.ok(
    release.auditReceipts.every(
      (receipt) =>
        receipt.gates.allPassed === true &&
        receipt.promotionAllowed === false &&
        receipt.humanEditorialReviewPerformed === false &&
        receipt.creatorApprovalClaimed === false,
    ),
  );
});

test("checked-in candidate, audit, and release artifacts are byte-identical to their builders", () => {
  assert.equal(
    fs.readFileSync(CANDIDATE_PATH, "utf8"),
    renderNewestFiveCandidates(candidates),
  );
  assert.equal(
    fs.readFileSync(AUDIT_PATH, "utf8"),
    renderNewestFiveAudit(audit),
  );
  assert.equal(
    fs.readFileSync(RELEASE_PATH, "utf8"),
    renderNewestFiveRelease(release),
  );
  assert.match(candidates.provenance.contentSha256, /^sha256:[a-f0-9]{64}$/);
  assert.match(audit.reportSha256, /^sha256:[a-f0-9]{64}$/);
  assert.match(release.releaseSha256, /^sha256:[a-f0-9]{64}$/);
});

test("ordered merge installs the reviewed ten and newest five once, without mutating inputs", () => {
  const context = loadWindowFiles([
    BASE_PATH,
    OLD_RELEASE_PATH,
    RELEASE_PATH,
    MERGE_PATH,
  ]);
  const base = context.window.WWAM_EPISODE_GUIDES;
  const oldRelease =
    context.window.WWAM_EPISODE_GUIDE_V2_REVIEWED_RELEASE;
  const newestRelease =
    context.window.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_RELEASE;
  const helper =
    context.window.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE;
  const baseBefore = jsonClone(base);
  const oldBefore = jsonClone(oldRelease);
  const newestBefore = jsonClone(newestRelease);

  const merged = helper.mergeOrdered(base, [oldRelease, newestRelease]);
  const plainMerged = jsonClone(merged);
  assert.equal(plainMerged.meta.guides, 53);
  assert.equal(plainMerged.meta.chapters, 319);
  assert.equal(plainMerged.meta.cuts, 752);
  assert.equal(plainMerged.meta.reviewedReleaseGuides, 10);
  assert.equal(plainMerged.meta.deterministicReleaseGuides, 5);
  assert.equal(plainMerged.meta.additiveReleaseGuides, 15);
  assert.equal(plainMerged.provenance.additiveReleases.length, 2);
  assert.deepEqual(
    plainMerged.guides.slice(-5).map((record) => record.id),
    EXPECTED_IDS,
  );
  assert.equal(
    new Set(plainMerged.guides.map((record) => record.id)).size,
    53,
  );

  const mergedAgain = helper.mergeOrdered(merged, [
    oldRelease,
    newestRelease,
  ]);
  assert.deepEqual(jsonClone(mergedAgain), plainMerged);
  assert.deepEqual(jsonClone(base), baseBefore);
  assert.deepEqual(jsonClone(oldRelease), oldBefore);
  assert.deepEqual(jsonClone(newestRelease), newestBefore);
});

test("ordered merge rejects ineligible, failed-audit, and colliding deterministic releases", () => {
  const context = loadWindowFiles([BASE_PATH, MERGE_PATH]);
  const base = context.window.WWAM_EPISODE_GUIDES;
  const helper =
    context.window.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE;

  const ineligible = jsonClone(release);
  ineligible.policy.deterministicRuntimeEligible = false;
  assert.throws(
    () => helper.mergeOrdered(base, [ineligible]),
    /strictly machine-audited/i,
  );

  const failedAudit = jsonClone(release);
  failedAudit.auditReceipts[0].gates.allPassed = false;
  assert.throws(
    () => helper.mergeOrdered(base, [failedAudit]),
    /pass all gates/i,
  );

  const failedReport = jsonClone(release);
  failedReport.machineAudit.allPassed = false;
  assert.throws(
    () => helper.mergeOrdered(base, [failedReport]),
    /strict machine gate/i,
  );

  const duplicateReceipt = jsonClone(release);
  duplicateReceipt.auditReceipts[0] = jsonClone(
    duplicateReceipt.auditReceipts[1],
  );
  assert.throws(
    () => helper.mergeOrdered(base, [duplicateReceipt]),
    /duplicate receipt ID/i,
  );

  const collision = jsonClone(release);
  collision.guides[0].id = base.guides[0].id;
  assert.throws(
    () => helper.mergeOrdered(base, [collision]),
    /duplicate Episode Guide ID/i,
  );
});

test("all five compile through the real dossier engine as full chronicles", () => {
  const { dossier, engine, registry } = buildDossierWithOrderedReleases();
  assert.equal(dossier.sources.length, 510);
  assert.equal(registry.meta.guides, 53);

  for (const id of EXPECTED_IDS) {
    const source = dossier.sources.find((record) => record.id === id);
    assert.ok(source, id);
    assert.equal(source.coverage, "caption-backed", id);
    assert.equal(source.showWiki.status, "distilled", id);
    assert.equal(source.showWiki.episodeGuide.schema, "wwam-episode-guide/v2", id);
    assert.equal(source.showWiki.episodeGuide.chapters.length, 6, id);
    assert.equal(source.showWiki.episodeGuide.cuts.length, 12, id);
    assert.equal(source.showWiki.episodeRecap.state, "ready", id);
    assert.equal(source.showWiki.episodeRecap.tier, "full-chronicle", id);
    const compiled = engine.build(id);
    assert.equal(compiled.source.showWiki.episodeRecap.state, "ready", id);
    assert.equal(compiled.source.showWiki.episodeRecap.tier, "full-chronicle", id);
    assert.equal(compiled.source.showWiki.episodeGuide.cuts.length, 12, id);
  }
  const x6 = dossier.sources.find((record) => record.id === X6_ID);
  assert.equal(x6.showWiki.episodeGuide.format, "ranking");

  const ageMatched = dossier.sources.find(
    (record) => record.id === "cQAVmNFQmoI",
  );
  assert.equal(ageMatched.availability, "age-restricted");
  assert.equal(ageMatched.officialAlternate.timestampIsomorphic, true);
  assert.equal(ageMatched.officialAlternate.durationDelta, 0.29);
  assert.match(ageMatched.officialAlternate.enclosureUrl, /^https:/);
  assert.ok(ageMatched.warnings.some((warning) => (
    /VERIFIED OFFICIAL WWAM PODCAST TIMELINE PLAYS HERE/.test(warning)
  )));
});
