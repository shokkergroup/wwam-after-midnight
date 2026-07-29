(function installReviewedEpisodeGuideMerge(root) {
  "use strict";

  var RELEASE_SCHEMA = "wwam-episode-guide-v2-reviewed-release/v1";

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

  function merge(baseRegistry, reviewedRelease) {
    assertObject(baseRegistry, "baseRegistry");
    assertObject(reviewedRelease, "reviewedRelease");
    if (reviewedRelease.schema !== RELEASE_SCHEMA) {
      throw new Error(
        "reviewedRelease.schema must be " + RELEASE_SCHEMA + ".",
      );
    }
    if (
      !reviewedRelease.policy ||
      reviewedRelease.policy.promotionAllowed !== false ||
      reviewedRelease.policy.reviewedRuntimeEligible !== true ||
      reviewedRelease.policy.automaticRuntimeHookAllowed !== false
    ) {
      throw new Error(
        "reviewedRelease must be promotion-disabled, review-eligible, and explicit-activation-only.",
      );
    }

    var baseIds = validateGuides(baseRegistry.guides, "baseRegistry");
    validateGuides(reviewedRelease.guides, "reviewedRelease");
    if (!Array.isArray(reviewedRelease.reviewReceipts)) {
      throw new TypeError("reviewedRelease.reviewReceipts must be an array.");
    }
    var passedReceiptIds = Object.create(null);
    reviewedRelease.reviewReceipts.forEach(function validateReceipt(receipt) {
      if (
        !receipt ||
        typeof receipt.id !== "string" ||
        !receipt.gates ||
        receipt.gates.allPassed !== true ||
        receipt.promotionAllowed !== false
      ) {
        throw new Error(
          "Every reviewed release receipt must pass all gates and remain promotion-disabled.",
        );
      }
      passedReceiptIds[receipt.id] = true;
    });
    reviewedRelease.guides.forEach(function rejectCollision(record) {
      if (baseIds[record.id]) {
        throw new Error(
          "Cannot merge duplicate Episode Guide ID " + record.id + ".",
        );
      }
      if (!passedReceiptIds[record.id]) {
        throw new Error(
          "Cannot merge guide without a passed review receipt: " +
            record.id +
            ".",
        );
      }
    });

    var base = cloneJson(baseRegistry);
    var release = cloneJson(reviewedRelease);
    var guides = base.guides.concat(release.guides);
    var provenance = base.provenance || {};
    var additiveReleases = Array.isArray(provenance.additiveReleases)
      ? provenance.additiveReleases.slice()
      : [];
    additiveReleases.push({
      schema: release.schema,
      releaseSha256: release.releaseSha256,
      sourceBatchSha256: release.sourceBatch.contentSha256,
      editorialReviewSha256: release.editorialReview.reportSha256,
      guideCount: release.guides.length,
      reviewedRuntimeEligible: true,
      promotionAllowed: false,
    });

    return Object.assign({}, base, {
      provenance: Object.assign({}, provenance, {
        additiveReleases: additiveReleases,
      }),
      meta: Object.assign({}, base.meta || {}, {
        guides: guides.length,
        chapters: countGuideArrays(guides, "chapters"),
        cuts: countGuideArrays(guides, "cuts"),
        reviewedReleaseGuides: release.guides.length,
      }),
      guides: guides,
    });
  }

  root.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE = Object.freeze({
    schema: "wwam-episode-guide-v2-reviewed-merge/v1",
    releaseSchema: RELEASE_SCHEMA,
    merge: merge,
  });
})(window);
