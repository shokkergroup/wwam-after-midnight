(function installReviewedEpisodeGuideMerge(root) {
  "use strict";

  var REVIEWED_RELEASE_SCHEMA =
    "wwam-episode-guide-v2-reviewed-release/v1";
  var DETERMINISTIC_RELEASE_SCHEMA =
    "wwam-episode-guide-v2-deterministic-release/v1";
  var RELEASE_SCHEMAS = Object.freeze([
    REVIEWED_RELEASE_SCHEMA,
    DETERMINISTIC_RELEASE_SCHEMA,
  ]);

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function assertObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(label + " must be an object.");
    }
  }

  function validateGuides(guides, label) {
    if (!Array.isArray(guides)) {
      throw new TypeError(label + ".guides must be an array.");
    }
    var seen = Object.create(null);
    guides.forEach(function validateGuide(record, index) {
      assertObject(record, label + ".guides[" + index + "]");
      if (typeof record.id !== "string" || !record.id.trim()) {
        throw new TypeError(
          label + ".guides[" + index + "].id must be a non-empty string.",
        );
      }
      if (seen[record.id]) {
        throw new Error(label + " contains duplicate guide ID " + record.id + ".");
      }
      seen[record.id] = true;
      assertObject(
        record.episodeGuide,
        label + ".guides[" + index + "].episodeGuide",
      );
    });
    return seen;
  }

  function countGuideArrays(guides, key) {
    return guides.reduce(function count(total, record) {
      return (
        total +
        (Array.isArray(record.episodeGuide[key])
          ? record.episodeGuide[key].length
          : 0)
      );
    }, 0);
  }

  function releaseReceipts(release) {
    if (release.schema === DETERMINISTIC_RELEASE_SCHEMA) {
      if (!Array.isArray(release.auditReceipts)) {
        throw new TypeError(
          "deterministicRelease.auditReceipts must be an array.",
        );
      }
      return release.auditReceipts;
    }
    if (!Array.isArray(release.reviewReceipts)) {
      throw new TypeError("reviewedRelease.reviewReceipts must be an array.");
    }
    return release.reviewReceipts;
  }

  function validateReleasePolicy(release) {
    if (release.schema === REVIEWED_RELEASE_SCHEMA) {
      if (
        !release.policy ||
        release.policy.promotionAllowed !== false ||
        release.policy.reviewedRuntimeEligible !== true ||
        release.policy.automaticRuntimeHookAllowed !== false
      ) {
        throw new Error(
          "reviewedRelease must be promotion-disabled, review-eligible, and explicit-activation-only.",
        );
      }
      return;
    }
    if (
      release.schema === DETERMINISTIC_RELEASE_SCHEMA &&
      release.policy &&
      release.policy.promotionAllowed === false &&
      release.policy.deterministicRuntimeEligible === true &&
      release.policy.automaticRuntimeHookAllowed === false &&
      release.policy.humanEditorialReviewPerformed === false &&
      release.policy.creatorApprovalClaimed === false
    ) {
      return;
    }
    throw new Error(
      "deterministicRelease must be promotion-disabled, strictly machine-audited, explicit-activation-only, and free of human-review or creator-approval claims.",
    );
  }

  function releaseAuditSha256(release) {
    if (release.schema === DETERMINISTIC_RELEASE_SCHEMA) {
      return release.machineAudit && release.machineAudit.reportSha256;
    }
    return release.editorialReview && release.editorialReview.reportSha256;
  }

  function validateReleaseReceipts(release, receipts) {
    if (
      !release.sourceBatch ||
      typeof release.sourceBatch.contentSha256 !== "string" ||
      !/^sha256:[a-f0-9]{64}$/.test(
        release.sourceBatch.contentSha256,
      )
    ) {
      throw new Error(
        "additiveRelease.sourceBatch.contentSha256 must be an immutable sha256 receipt.",
      );
    }
    var auditSha256 = releaseAuditSha256(release);
    if (
      typeof auditSha256 !== "string" ||
      !/^sha256:[a-f0-9]{64}$/.test(auditSha256)
    ) {
      throw new Error(
        "additiveRelease must carry an immutable audit sha256 receipt.",
      );
    }
    if (
      release.schema === DETERMINISTIC_RELEASE_SCHEMA &&
      (!release.machineAudit || release.machineAudit.allPassed !== true)
    ) {
      throw new Error(
        "deterministicRelease.machineAudit must pass every strict machine gate.",
      );
    }
    if (receipts.length !== release.guides.length) {
      throw new Error(
        "additiveRelease must carry exactly one passed receipt per guide.",
      );
    }
    var passedReceiptIds = Object.create(null);
    receipts.forEach(function validateReceipt(receipt) {
      if (
        !receipt ||
        typeof receipt.id !== "string" ||
        !receipt.gates ||
        receipt.gates.allPassed !== true ||
        receipt.promotionAllowed !== false
      ) {
        throw new Error(
          "Every additive release receipt must pass all gates and remain promotion-disabled.",
        );
      }
      if (passedReceiptIds[receipt.id]) {
        throw new Error(
          "additiveRelease contains duplicate receipt ID " +
            receipt.id +
            ".",
        );
      }
      passedReceiptIds[receipt.id] = true;
    });
    return passedReceiptIds;
  }

  function merge(baseRegistry, additiveRelease) {
    assertObject(baseRegistry, "baseRegistry");
    assertObject(additiveRelease, "additiveRelease");
    if (RELEASE_SCHEMAS.indexOf(additiveRelease.schema) < 0) {
      throw new Error(
        "additiveRelease.schema must be one of " +
          RELEASE_SCHEMAS.join(", ") + ".",
      );
    }
    validateReleasePolicy(additiveRelease);
    if (
      typeof additiveRelease.releaseSha256 !== "string" ||
      !/^sha256:[a-f0-9]{64}$/.test(additiveRelease.releaseSha256)
    ) {
      throw new Error(
        "additiveRelease.releaseSha256 must be an immutable sha256 receipt.",
      );
    }

    var baseIds = validateGuides(baseRegistry.guides, "baseRegistry");
    validateGuides(additiveRelease.guides, "additiveRelease");
    var receipts = releaseReceipts(additiveRelease);
    var passedReceiptIds = validateReleaseReceipts(
      additiveRelease,
      receipts,
    );
    additiveRelease.guides.forEach(function rejectCollision(record) {
      if (baseIds[record.id]) {
        throw new Error(
          "Cannot merge duplicate Episode Guide ID " + record.id + ".",
        );
      }
      if (!passedReceiptIds[record.id]) {
        throw new Error(
          "Cannot merge guide without a passed release receipt: " +
            record.id +
            ".",
        );
      }
    });

    var base = cloneJson(baseRegistry);
    var release = cloneJson(additiveRelease);
    var guides = base.guides.concat(release.guides);
    var provenance = base.provenance || {};
    var additiveReleases = Array.isArray(provenance.additiveReleases)
      ? provenance.additiveReleases.slice()
      : [];
    additiveReleases.push(
      Object.assign(
        {
          schema: release.schema,
          releaseSha256: release.releaseSha256,
          sourceBatchSha256: release.sourceBatch.contentSha256,
          auditSha256: releaseAuditSha256(release),
          guideCount: release.guides.length,
          runtimeEligibilityKind:
            release.schema === DETERMINISTIC_RELEASE_SCHEMA
              ? "deterministic-machine-audit"
              : "reviewed-release",
          reviewedRuntimeEligible:
            release.schema === REVIEWED_RELEASE_SCHEMA,
          deterministicRuntimeEligible:
            release.schema === DETERMINISTIC_RELEASE_SCHEMA,
          promotionAllowed: false,
        },
        release.schema === REVIEWED_RELEASE_SCHEMA
          ? {
              editorialReviewSha256:
                release.editorialReview.reportSha256,
            }
          : {
              machineAuditSha256:
                release.machineAudit.reportSha256,
            },
      ),
    );
    var baseMeta = base.meta || {};
    var reviewedReleaseGuides =
      Number(baseMeta.reviewedReleaseGuides) || 0;
    var deterministicReleaseGuides =
      Number(baseMeta.deterministicReleaseGuides) || 0;
    if (release.schema === REVIEWED_RELEASE_SCHEMA) {
      reviewedReleaseGuides += release.guides.length;
    } else {
      deterministicReleaseGuides += release.guides.length;
    }

    return Object.assign({}, base, {
      provenance: Object.assign({}, provenance, {
        additiveReleases: additiveReleases,
      }),
      meta: Object.assign({}, baseMeta, {
        guides: guides.length,
        chapters: countGuideArrays(guides, "chapters"),
        cuts: countGuideArrays(guides, "cuts"),
        reviewedReleaseGuides: reviewedReleaseGuides,
        deterministicReleaseGuides: deterministicReleaseGuides,
        additiveReleaseGuides:
          reviewedReleaseGuides + deterministicReleaseGuides,
      }),
      guides: guides,
    });
  }

  function mergeOrdered(baseRegistry, additiveReleases) {
    assertObject(baseRegistry, "baseRegistry");
    if (!Array.isArray(additiveReleases)) {
      throw new TypeError("additiveReleases must be an ordered array.");
    }
    var merged = cloneJson(baseRegistry);
    var installed = Object.create(null);
    var receipts =
      merged.provenance &&
      Array.isArray(merged.provenance.additiveReleases)
        ? merged.provenance.additiveReleases
        : [];
    receipts.forEach(function rememberInstalled(receipt) {
      if (receipt && receipt.releaseSha256) {
        installed[receipt.releaseSha256] = true;
      }
    });
    additiveReleases.forEach(function installRelease(release, index) {
      assertObject(release, "additiveReleases[" + index + "]");
      if (installed[release.releaseSha256]) return;
      merged = merge(merged, release);
      installed[release.releaseSha256] = true;
    });
    return merged;
  }

  root.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE = Object.freeze({
    schema: "wwam-episode-guide-v2-reviewed-merge/v1",
    releaseSchema: REVIEWED_RELEASE_SCHEMA,
    releaseSchemas: RELEASE_SCHEMAS,
    merge: merge,
    mergeOrdered: mergeOrdered,
  });
})(window);
