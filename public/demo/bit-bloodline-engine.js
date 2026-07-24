(function (root) {
  "use strict";

  /*
   * BIT BLOODLINES
   *
   * A channel-neutral compiler for recurring, source-locked evidence. The
   * caller supplies lineage definitions; the canonical Source Dossier registry
   * supplies every public receipt, bound, date, URL, and fingerprint.
   *
   * A bloodline is an indexed recurrence, not proof of the first-ever origin,
   * speaker continuity, causality, creator approval, rights clearance, or
   * canon. The engine copies no media and changes no archive state.
   */

  var VERSION = "1.0.0";
  var LINEAGE_SCHEMA = "shokker-bit-bloodline/v1";
  var CUT_REQUEST_SCHEMA = "shokker-memory-cut-request/v1";
  var DOSSIER_SCHEMA = "shokker-source-dossier/v1";
  var MIN_LINEAGE_RECEIPTS = 2;
  var MIN_CUT_RECEIPTS = 3;
  var MAX_CUT_RECEIPTS = 8;
  var RESOLVE_TOLERANCE_SECONDS = 0.55;
  var PERFORMANCE_CONTRACT = freezeDeep({
    kind: "character-performance",
    evidenceType: "curated-character-performance",
    evidenceBasis: "exact-showcase-receipt",
    reviewState: "timestamp-validated-human-curated-candidate",
    publicExcerptAllowed: true,
    promotionAllowed: false
  });
  var ARTIFACT_CONTRACT = freezeDeep({
    kind: "bit-lineage",
    authority: "editor-review",
    reviewState: "derived-review-only",
    promotionAllowed: false
  });
  var ECHO_TYPES = freezeDeep({
    "caption-character-context": "context",
    "caption-character-signal": "signal"
  });

  function BloodlineError(code, message, path) {
    this.name = "BloodlineError";
    this.code = code;
    this.message = message;
    this.path = path || "";
    if (Error.captureStackTrace) Error.captureStackTrace(this, BloodlineError);
  }
  BloodlineError.prototype = Object.create(Error.prototype);
  BloodlineError.prototype.constructor = BloodlineError;

  function fail(code, message, path) {
    throw new BloodlineError(code, message, path);
  }

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function record(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value, maximum) {
    var output = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return maximum && output.length > maximum
      ? output.slice(0, maximum).trim()
      : output;
  }

  function requiredText(value, path, maximum) {
    var output = clean(value, maximum);
    if (!output) fail("REQUIRED_TEXT", path + " must be non-empty.", path);
    return output;
  }

  function finite(value, path) {
    var output = Number(value);
    if (!Number.isFinite(output)) {
      fail("UNTIMED_RECEIPT", path + " must be a finite source coordinate.", path);
    }
    return output;
  }

  function serial(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      fail("NON_JSON_INPUT", "Bloodline input must be finite, acyclic JSON data.");
    }
  }

  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (!value || typeof value !== "object") return value;
    return Object.keys(value).sort().reduce(function (output, key) {
      output[key] = canonical(value[key]);
      return output;
    }, {});
  }

  function stableJson(value) {
    return JSON.stringify(canonical(value));
  }

  function fnv1a(value) {
    var text = String(value);
    var hash = 0x811c9dc5;
    for (var index = 0; index < text.length; index += 1) {
      var code = text.charCodeAt(index);
      hash ^= code & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= code >>> 8;
      hash = Math.imul(hash, 0x01000193);
    }
    return "fnv1a32:" + (hash >>> 0).toString(16).padStart(8, "0");
  }

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function (key) {
      freezeDeep(value[key]);
    });
    return value;
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function sameSet(left, right) {
    var a = unique(array(left)).sort();
    var b = unique(array(right)).sort();
    return a.length === b.length && a.every(function (value, index) {
      return value === b[index];
    });
  }

  function roundedSeconds(value) {
    return Math.round(Number(value) * 1000) / 1000;
  }

  function publicSnapshot(value) {
    var state = clean(value).toLowerCase();
    return Boolean(state) &&
      !/(?:unavailable|private|deleted|removed|blocked|members[- ]only)/.test(state);
  }

  function dateValue(value, path) {
    var date = requiredText(value, path, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date + "T00:00:00Z"))) {
      fail("INVALID_DATE", path + " must be an ISO calendar date.", path);
    }
    return date;
  }

  function daysBetween(first, last) {
    return Math.round(
      (Date.parse(last + "T00:00:00Z") - Date.parse(first + "T00:00:00Z")) /
        86400000
    );
  }

  function numberLabel(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function sameCoordinate(left, right) {
    return Math.abs(Number(left) - Number(right)) <=
      RESOLVE_TOLERANCE_SECONDS + 0.000001;
  }

  function exactCoordinate(left, right) {
    return Math.abs(Number(left) - Number(right)) <= 0.000001;
  }

  function firstCoordinate(raw) {
    if (!record(raw)) return null;
    var values = [];
    ["at", "t", "start"].forEach(function (key) {
      if (own(raw, key) && raw[key] != null && raw[key] !== "") {
        values.push(finite(raw[key], "performance." + key));
      }
    });
    if (record(raw.playback) && raw.playback.start != null) {
      values.push(finite(raw.playback.start, "performance.playback.start"));
    }
    if (values.length > 1 && values.some(function (value) {
      return !exactCoordinate(value, values[0]);
    })) {
      fail("CONFLICTING_COORDINATE", "A performance supplies conflicting start coordinates.");
    }
    return values.length ? values[0] : null;
  }

  function endingCoordinate(raw) {
    if (!record(raw)) return null;
    var values = [];
    if (own(raw, "end") && raw.end != null && raw.end !== "") {
      values.push(finite(raw.end, "performance.end"));
    }
    if (record(raw.playback) && raw.playback.end != null) {
      values.push(finite(raw.playback.end, "performance.playback.end"));
    }
    if (values.length > 1 && values.some(function (value) {
      return !exactCoordinate(value, values[0]);
    })) {
      fail("CONFLICTING_COORDINATE", "A performance supplies conflicting end coordinates.");
    }
    return values.length ? values[0] : null;
  }

  function performanceValues(definition) {
    return array(
      definition.performances ||
      definition.events ||
      definition.receipts ||
      definition.soundbytes
    );
  }

  function normalizePolicy(value) {
    var supplied = record(value) ? value : {};
    var performance = Object.assign(
      {},
      PERFORMANCE_CONTRACT,
      record(supplied.performance) ? supplied.performance : {}
    );
    var artifact = Object.assign(
      {},
      ARTIFACT_CONTRACT,
      record(supplied.artifact) ? supplied.artifact : {}
    );
    [
      ["performance.kind", performance.kind],
      ["performance.evidenceType", performance.evidenceType],
      ["performance.evidenceBasis", performance.evidenceBasis],
      ["performance.reviewState", performance.reviewState],
      ["artifact.kind", artifact.kind],
      ["artifact.authority", artifact.authority],
      ["artifact.reviewState", artifact.reviewState]
    ].forEach(function (entry) {
      requiredText(entry[1], "policy." + entry[0], 180);
    });
    if (typeof performance.publicExcerptAllowed !== "boolean" ||
        typeof performance.promotionAllowed !== "boolean" ||
        typeof artifact.promotionAllowed !== "boolean") {
      fail("INVALID_POLICY", "Policy authority fields must be explicit booleans.");
    }
    var entityFields = array(supplied.entityFields).length
      ? supplied.entityFields.map(function (field, index) {
          return requiredText(field, "policy.entityFields[" + index + "]", 80);
        })
      : ["bitId", "characterId"];
    if (!entityFields.length || new Set(entityFields).size !== entityFields.length) {
      fail("INVALID_POLICY", "Policy entity fields must be a unique non-empty list.");
    }
    var profileEntityField = requiredText(
      supplied.profileEntityField || "characterId",
      "policy.profileEntityField",
      80
    );
    if (entityFields.indexOf(profileEntityField) < 0) {
      fail("INVALID_POLICY", "The profile entity field must be one of policy.entityFields.");
    }
    var echoes = record(supplied.echoes) ? supplied.echoes : {};
    var echoEnabled = echoes.enabled !== false;
    var echoEntityField = requiredText(
      echoes.entityField || profileEntityField,
      "policy.echoes.entityField",
      80
    );
    if (echoEnabled && entityFields.indexOf(echoEntityField) < 0) {
      fail("INVALID_POLICY", "The echo entity field must be one of policy.entityFields.");
    }
    return freezeDeep({
      performance: performance,
      artifact: artifact,
      entityFields: entityFields,
      profileEntityField: profileEntityField,
      profileLabelField: clean(supplied.profileLabelField || "character", 80),
      echoes: {
        enabled: echoEnabled,
        entityField: echoEntityField
      }
    });
  }

  function create(options) {
    if (!record(options) || !options.dossierEngine) {
      fail("INVALID_DOSSIER_ENGINE", "create requires options.dossierEngine.", "options");
    }
    var dossierEngine = options.dossierEngine;
    if (typeof dossierEngine.list !== "function" ||
        typeof dossierEngine.build !== "function" ||
        typeof dossierEngine.getStats !== "function") {
      fail(
        "INVALID_DOSSIER_ENGINE",
        "The Source Dossier engine must provide list, build, and getStats.",
        "options.dossierEngine"
      );
    }
    var definitions = array(
      options.lineages ||
      options.definitions ||
      options.lineageSource && (
        options.lineageSource.lineages || options.lineageSource.characters
      )
    );
    if (!definitions.length) {
      fail("LINEAGES_REQUIRED", "create requires at least one lineage definition.", "options.lineages");
    }
    var policy = normalizePolicy(options.policy);

    var listed;
    try {
      listed = dossierEngine.list();
    } catch {
      fail("REGISTRY_READ_FAILED", "The canonical source registry could not be read.");
    }
    if (!Array.isArray(listed) || !listed.length) {
      fail("EMPTY_REGISTRY", "The canonical source registry is empty.");
    }

    var bindings = null;
    var sources = new Map();
    var receipts = new Map();

    listed.forEach(function (listedSource, sourceIndex) {
      if (!record(listedSource)) {
        fail("FOREIGN_REGISTRY", "Registry source " + sourceIndex + " is malformed.");
      }
      var sourceId = requiredText(listedSource.id, "registry[" + sourceIndex + "].id", 64);
      if (sources.has(sourceId)) {
        fail("DUPLICATE_SOURCE", "The canonical registry repeats source " + sourceId + ".");
      }
      var dossier;
      try {
        dossier = dossierEngine.build(sourceId);
      } catch {
        fail("SOURCE_BUILD_FAILED", "Canonical source " + sourceId + " could not be built.");
      }
      if (!record(dossier) || dossier.schema !== DOSSIER_SCHEMA ||
          !record(dossier.bindings) || !record(dossier.source) || !record(dossier.proof)) {
        fail("FOREIGN_DOSSIER", "Source " + sourceId + " is not a canonical Source Dossier.");
      }
      if (dossier.source.id !== sourceId ||
          dossier.source.sourceFingerprint !== listedSource.sourceFingerprint) {
        fail("STALE_REGISTRY", "Source " + sourceId + " disagrees with its registry fingerprint.");
      }
      var currentBindings = {
        channelId: requiredText(dossier.bindings.channelId, "bindings.channelId", 120),
        channelLabel: requiredText(dossier.bindings.channelLabel, "bindings.channelLabel", 240),
        channelPackFingerprint: requiredText(
          dossier.bindings.channelPackFingerprint,
          "bindings.channelPackFingerprint",
          180
        ),
        snapshotDate: requiredText(dossier.bindings.snapshotDate, "bindings.snapshotDate", 20),
        archiveFingerprint: requiredText(
          dossier.bindings.archiveFingerprint,
          "bindings.archiveFingerprint",
          180
        )
      };
      if (!bindings) {
        bindings = currentBindings;
      } else if (
        bindings.channelId !== currentBindings.channelId ||
        bindings.channelLabel !== currentBindings.channelLabel ||
        bindings.channelPackFingerprint !== currentBindings.channelPackFingerprint ||
        bindings.snapshotDate !== currentBindings.snapshotDate ||
        bindings.archiveFingerprint !== currentBindings.archiveFingerprint
      ) {
        fail("FOREIGN_REGISTRY", "The registry mixes incompatible source bindings.");
      }
      if (dossier.proof.creatorApproved !== false ||
          dossier.proof.rightsCleared !== false ||
          dossier.proof.speakerDiarized !== false ||
          dossier.proof.canonPromotedByDossier !== false) {
        fail("AUTHORITY_INFLATION", "Source " + sourceId + " overstates dossier authority.");
      }
      if (!Array.isArray(dossier.source.receipts)) {
        fail("FOREIGN_DOSSIER", "Source " + sourceId + " has no canonical receipt list.");
      }
      var duration = finite(dossier.source.duration, "source.duration");
      var sourceFingerprint = requiredText(
        dossier.source.sourceFingerprint,
        "source.sourceFingerprint",
        180
      );
      var dossierFingerprint = requiredText(dossier.fingerprint, "dossier.fingerprint", 180);
      var sourceDate = dateValue(dossier.source.date, "source.date");
      dossier.source.receipts.forEach(function (receipt, receiptIndex) {
        if (!record(receipt)) {
          fail("FOREIGN_RECEIPT", "Source " + sourceId + " has a malformed receipt.");
        }
        var key = requiredText(
          receipt.key,
          "source[" + sourceId + "].receipts[" + receiptIndex + "].key",
          240
        );
        if (receipts.has(key)) {
          fail("DUPLICATE_RECEIPT", "Canonical receipt " + key + " is not globally unique.");
        }
        var at = finite(receipt.at, "receipt.at");
        var navigationOnlyEcho = own(ECHO_TYPES, receipt.evidenceType);
        var end = receipt.end == null && navigationOnlyEcho
          ? null
          : finite(receipt.end, "receipt.end");
        if (at < 0 || at > duration + 1 ||
            (!navigationOnlyEcho && (end <= at || end > duration + 1)) ||
            (navigationOnlyEcho && end != null &&
              (end <= at || end > duration + 1))) {
          fail("UNTIMED_RECEIPT", "Canonical receipt " + key + " has invalid bounds.");
        }
        receipts.set(key, {
          key: key,
          sourceId: sourceId,
          sourceFingerprint: sourceFingerprint,
          dossierFingerprint: dossierFingerprint,
          sourceDate: sourceDate,
          source: dossier.source,
          proof: dossier.proof,
          receipt: receipt
        });
      });
      sources.set(sourceId, {
        listed: listedSource,
        dossier: dossier
      });
    });

    var registryFingerprint = fnv1a(stableJson({
      bindings: bindings,
      sources: Array.from(sources.keys()).sort().map(function (sourceId) {
        var source = sources.get(sourceId).dossier.source;
        return [source.id, source.sourceFingerprint];
      }),
      receipts: Array.from(receipts.values()).map(function (entry) {
        return [
          entry.key,
          entry.sourceId,
          entry.receipt.at,
          entry.receipt.end,
          entry.receipt.publicExcerptAllowed
        ];
      }).sort(function (left, right) {
        return left[0].localeCompare(right[0]);
      })
    }));
    bindings.registryFingerprint = registryFingerprint;

    if (record(options.channel)) {
      if (options.channel.id && clean(options.channel.id) !== bindings.channelId) {
        fail("FOREIGN_CHANNEL", "options.channel.id does not match the canonical registry.");
      }
      if (options.channel.label &&
          clean(options.channel.label) !== bindings.channelLabel) {
        fail("FOREIGN_CHANNEL", "options.channel.label does not match the canonical registry.");
      }
      if (options.channel.packFingerprint &&
          clean(options.channel.packFingerprint) !== bindings.channelPackFingerprint) {
        fail(
          "STALE_CHANNEL",
          "options.channel.packFingerprint does not match the canonical registry."
        );
      }
    }

    function eligible(entry, requiredEntityIds) {
      var source = entry.source;
      var proof = entry.proof;
      var receipt = entry.receipt;
      if (source.authority === "quarantined-lane" ||
          proof.quarantined === true ||
          /quarantin/i.test(clean(receipt.reviewState))) {
        fail("QUARANTINED_RECEIPT", "Receipt " + entry.key + " remains quarantined.");
      }
      if (source.authority !== "promoted-lane") {
        fail("UNPROMOTED_SOURCE", "Receipt " + entry.key + " is outside the promoted lane.");
      }
      if (source.coverage !== "caption-backed") {
        fail("INSUFFICIENT_COVERAGE", "Receipt " + entry.key + " is not caption-backed.");
      }
      if (!publicSnapshot(source.availability)) {
        fail("UNAVAILABLE_SOURCE", "Receipt " + entry.key + " is not in a public snapshot.");
      }
      if (receipt.publicExcerptAllowed !== true ||
          /withheld|reject/i.test(clean(receipt.reviewState))) {
        fail("WITHHELD_RECEIPT", "Receipt " + entry.key + " is withheld.");
      }
      if (receipt.speaker !== null || receipt.speakerStatus !== "not-diarized") {
        fail("SPEAKER_BOUNDARY", "Receipt " + entry.key + " overstates speaker identity.");
      }
      if (receipt.kind !== policy.performance.kind) {
        fail(
          "INVALID_PERFORMANCE_KIND",
          "Receipt " + entry.key + " does not match the configured performance kind."
        );
      }
      if (receipt.evidenceType !== policy.performance.evidenceType) {
        fail(
          "INVALID_PERFORMANCE_EVIDENCE",
          "Receipt " + entry.key + " has the wrong configured evidence type."
        );
      }
      if (receipt.evidenceBasis !== policy.performance.evidenceBasis) {
        fail(
          "INVALID_PERFORMANCE_BASIS",
          "Receipt " + entry.key + " has the wrong performance evidence basis."
        );
      }
      if (receipt.reviewState !== policy.performance.reviewState) {
        fail(
          "INVALID_PERFORMANCE_REVIEW",
          "Receipt " + entry.key + " has not passed the required curated-candidate review."
        );
      }
      if (receipt.promotionAllowed !== policy.performance.promotionAllowed) {
        fail(
          "PROMOTION_OVERREACH",
          "Receipt " + entry.key + " cannot grant promotion authority."
        );
      }
      if (receipt.publicExcerptAllowed !== policy.performance.publicExcerptAllowed) {
        fail("WITHHELD_RECEIPT", "Receipt " + entry.key + " is not public evidence.");
      }
      if (requiredEntityIds.some(function (entityId) {
        return array(receipt.entityIds).indexOf(entityId) < 0;
      })) {
        fail(
          "LINEAGE_ENTITY_MISMATCH",
          "Receipt " + entry.key + " is not bound to every configured lineage entity."
        );
      }
      return entry;
    }

    function resolve(raw, path, requiredEntityIds) {
      if (typeof raw === "string") raw = { receiptKey: raw };
      if (!record(raw)) fail("INVALID_PERFORMANCE", path + " must be an object.", path);
      var key = clean(raw.receiptKey || raw.key || raw.receiptId, 240);
      var sourceId = clean(raw.sourceId, 64);
      var at = firstCoordinate(raw);
      var end = endingCoordinate(raw);
      var entry;

      if (key) {
        entry = receipts.get(key);
        if (!entry) fail("MISSING_RECEIPT", "Receipt " + key + " is not registered.", path);
      } else {
        if (!sourceId || at == null) {
          fail(
            "UNTIMED_RECEIPT",
            path + " requires a canonical receipt key or sourceId plus a source coordinate.",
            path
          );
        }
        var sourceEntry = sources.get(sourceId);
        if (!sourceEntry) {
          fail("FOREIGN_SOURCE", "Source " + sourceId + " is not registered.", path);
        }
        var matches = sourceEntry.dossier.source.receipts.filter(function (receipt) {
          return sameCoordinate(receipt.at, at);
        });
        if (!matches.length) {
          fail("MISSING_RECEIPT", "No canonical receipt resolves at " + sourceId + " @ " + at + ".", path);
        }
        if (matches.length > 1) {
          fail("AMBIGUOUS_RECEIPT", "More than one receipt resolves at " + sourceId + " @ " + at + ".", path);
        }
        entry = receipts.get(matches[0].key);
      }
      if (sourceId && sourceId !== entry.sourceId) {
        fail("FOREIGN_RECEIPT", "Receipt " + entry.key + " belongs to another source.", path);
      }
      if (at != null && !sameCoordinate(entry.receipt.at, at)) {
        fail("STALE_RECEIPT", "Receipt " + entry.key + " no longer matches its start.", path);
      }
      if (end != null && !exactCoordinate(entry.receipt.end, end)) {
        fail("STALE_RECEIPT", "Receipt " + entry.key + " no longer matches its end.", path);
      }
      if (raw.date && clean(raw.date) !== entry.sourceDate) {
        fail("STALE_RECEIPT", "Receipt " + entry.key + " no longer matches its date.", path);
      }
      if (raw.sourceFingerprint &&
          clean(raw.sourceFingerprint) !== entry.sourceFingerprint) {
        fail("STALE_SOURCE", "Receipt " + entry.key + " has a stale source fingerprint.", path);
      }
      if (raw.dossierFingerprint &&
          clean(raw.dossierFingerprint) !== entry.dossierFingerprint) {
        fail("STALE_DOSSIER", "Receipt " + entry.key + " has a stale dossier fingerprint.", path);
      }
      return eligible(entry, requiredEntityIds);
    }

    function verifyLineageArtifacts(lineageId, resolved, sourceIds) {
      sourceIds.forEach(function (sourceId) {
        var source = sources.get(sourceId).dossier.source;
        var expectedReceiptKeys = resolved.filter(function (entry) {
          return entry.sourceId === sourceId;
        }).map(function (entry) {
          return entry.key;
        });
        var matches = array(source.artifacts).filter(function (artifact) {
          return artifact.id === lineageId;
        });
        if (matches.length !== 1) {
          fail(
            "LINEAGE_ARTIFACT_MISMATCH",
            "Source " + sourceId + " must contain one exact lineage review artifact."
          );
        }
        var artifact = matches[0];
        /*
         * Source Dossier v1 treats promotion as default-deny and does not
         * serialize a promotionAllowed field on artifacts. If a future or
         * foreign dossier supplies the extension, only explicit false is safe.
         */
        if (artifact.kind !== policy.artifact.kind ||
            artifact.authority !== policy.artifact.authority ||
            artifact.reviewState !== policy.artifact.reviewState ||
            (own(artifact, "promotionAllowed") &&
              artifact.promotionAllowed !== policy.artifact.promotionAllowed)) {
          fail(
            "LINEAGE_ARTIFACT_MISMATCH",
            "Source " + sourceId + " has an invalid lineage review artifact."
          );
        }
        if (!sameSet(artifact.sourceIds, sourceIds) ||
            !sameSet(artifact.receiptKeys, expectedReceiptKeys)) {
          fail(
            "LINEAGE_ARTIFACT_MEMBERSHIP",
            "Source " + sourceId + " has stale lineage artifact membership."
          );
        }
      });
      return {
        id: lineageId,
        kind: policy.artifact.kind,
        authority: policy.artifact.authority,
        reviewState: policy.artifact.reviewState,
        promotionAllowed: policy.artifact.promotionAllowed,
        verifiedSourceCount: sourceIds.length,
        exactSourceMembership: true,
        exactReceiptMembership: true
      };
    }

    function echoEntries(characterId) {
      if (!policy.echoes.enabled) return [];
      return Array.from(receipts.values()).filter(function (entry) {
        return own(ECHO_TYPES, entry.receipt.evidenceType) &&
          array(entry.receipt.entityIds).indexOf(characterId) >= 0;
      }).map(function (entry) {
        var receipt = entry.receipt;
        var source = entry.source;
        var expectedKind = ECHO_TYPES[receipt.evidenceType] === "context"
          ? "character-context"
          : "character-signal";
        if (receipt.kind !== expectedKind ||
            receipt.evidenceBasis !== "archive-deep-quarantined-candidate" ||
            receipt.reviewState !== "quarantined-machine-candidate" ||
            receipt.promotionAllowed !== false ||
            receipt.publicExcerptAllowed !== true ||
            receipt.speaker !== null ||
            receipt.speakerStatus !== "not-diarized" ||
            source.authority !== "quarantined-lane" ||
            entry.proof.quarantined !== true) {
          fail(
            "INVALID_ECHO_RECEIPT",
            "Receipt " + entry.key + " cannot enter the navigation-only echo layer."
          );
        }
        return entry;
      }).sort(function (left, right) {
        return left.sourceDate.localeCompare(right.sourceDate) ||
          left.receipt.at - right.receipt.at ||
          left.key.localeCompare(right.key);
      });
    }

    var authority = freezeDeep({
      speakerContinuity: false,
      trueOrigin: false,
      causality: false,
      creatorApproved: false,
      creatorApproval: false,
      performerVerified: false,
      profileMappingIsSpeakerAttribution: false,
      rightsCleared: false,
      canonPromoted: false,
      canonMutated: false,
      mediaCopied: false,
      copiedMediaIncluded: false,
      mediaDownloaded: false,
      published: false
    });
    var usedReceiptKeys = new Set();
    var usedEchoKeys = new Set();
    var lineageIds = new Set();
    var lineages = definitions.map(function (rawDefinition, definitionIndex) {
      if (!record(rawDefinition)) {
        fail(
          "INVALID_LINEAGE",
          "lineages[" + definitionIndex + "] must be an object.",
          "lineages[" + definitionIndex + "]"
        );
      }
      var id = requiredText(
        rawDefinition.id || rawDefinition.bitId,
        "lineages[" + definitionIndex + "].id",
        160
      );
      if (lineageIds.has(id)) {
        fail("DUPLICATE_LINEAGE", "Lineage " + id + " is repeated.", "lineages");
      }
      lineageIds.add(id);
      var entityBindings = {};
      policy.entityFields.forEach(function (field) {
        entityBindings[field] = requiredText(
          rawDefinition[field],
          "lineages[" + definitionIndex + "]." + field,
          160
        );
      });
      var requiredEntityIds = policy.entityFields.map(function (field) {
        return entityBindings[field];
      });
      var bitId = clean(entityBindings.bitId, 160);
      var characterId = clean(entityBindings.characterId, 160);
      var profileEntityId = entityBindings[policy.profileEntityField];
      var echoEntityId = entityBindings[policy.echoes.entityField];
      var rawPerformances = performanceValues(rawDefinition);
      if (rawPerformances.length < MIN_LINEAGE_RECEIPTS) {
        fail(
          "INSUFFICIENT_RECURRENCE",
          "Lineage " + id + " needs at least " + MIN_LINEAGE_RECEIPTS + " receipts.",
          "lineages[" + definitionIndex + "].performances"
        );
      }
      var resolved = rawPerformances.map(function (performance, performanceIndex) {
        var entry = resolve(
          performance,
          "lineages[" + definitionIndex + "].performances[" + performanceIndex + "]",
          requiredEntityIds
        );
        if (usedReceiptKeys.has(entry.key)) {
          fail(
            "DUPLICATE_RECEIPT",
            "Receipt " + entry.key + " is assigned more than once.",
            "lineages[" + definitionIndex + "].performances"
          );
        }
        usedReceiptKeys.add(entry.key);
        return entry;
      }).sort(function (left, right) {
        return left.sourceDate.localeCompare(right.sourceDate) ||
          left.receipt.at - right.receipt.at ||
          left.key.localeCompare(right.key);
      });
      var sourceIds = unique(resolved.map(function (entry) {
        return entry.sourceId;
      }));
      var artifactProof = verifyLineageArtifacts(id, resolved, sourceIds);
      var firstDate = resolved[0].sourceDate;
      var lastDate = resolved[resolved.length - 1].sourceDate;
      var elapsedDays = daysBetween(firstDate, lastDate);
      var performances = resolved.map(function (entry, performanceIndex) {
        var receipt = entry.receipt;
        var source = entry.source;
        return {
          order: performanceIndex + 1,
          role: performanceIndex === 0
            ? "earliest-curated-window"
            : performanceIndex === resolved.length - 1
              ? "latest-curated-window"
              : "indexed-performance-candidate",
          receiptKey: entry.key,
          sourceId: entry.sourceId,
          sourceTitle: source.displayTitle || source.title,
          date: entry.sourceDate,
          at: receipt.at,
          start: receipt.at,
          end: receipt.end,
          duration: receipt.end - receipt.at,
          url: receipt.url,
          officialUrl: source.url,
          excerpt: receipt.excerpt,
          label: receipt.label,
          kind: receipt.kind,
          evidenceType: receipt.evidenceType,
          evidenceLevel: receipt.evidenceLevel,
          evidenceBasis: receipt.evidenceBasis,
          reviewState: receipt.reviewState,
          curationStatus: receipt.reviewState,
          promotionAllowed: false,
          publicExcerptAllowed: true,
          entityIds: receipt.entityIds.slice(),
          bitId: bitId,
          characterId: characterId,
          entityBindings: serial(entityBindings),
          artifactId: id,
          sourceFingerprint: entry.sourceFingerprint,
          dossierFingerprint: entry.dossierFingerprint,
          speaker: null,
          speakerStatus: "not-diarized"
        };
      });
      var overlaps = [];
      performances.forEach(function (left, leftIndex) {
        performances.slice(leftIndex + 1).forEach(function (right) {
          if (left.sourceId !== right.sourceId) return;
          var overlapStart = Math.max(left.at, right.at);
          var overlapEnd = Math.min(left.end, right.end);
          if (overlapEnd <= overlapStart) return;
          overlaps.push({
            sourceId: left.sourceId,
            leftReceiptKey: left.receiptKey,
            rightReceiptKey: right.receiptKey,
            overlapStart: overlapStart,
            overlapEnd: overlapEnd,
            overlapSeconds: roundedSeconds(overlapEnd - overlapStart),
            preserved: true,
            merged: false
          });
        });
      });
      var resolvedEchoes = echoEntries(echoEntityId);
      var echoes = resolvedEchoes.map(function (entry, echoIndex) {
        if (usedEchoKeys.has(entry.key)) {
          fail(
            "DUPLICATE_ECHO",
            "Echo receipt " + entry.key + " maps to more than one lineage."
          );
        }
        usedEchoKeys.add(entry.key);
        return {
          order: echoIndex + 1,
          receiptKey: entry.key,
          sourceId: entry.sourceId,
          sourceTitle: entry.source.displayTitle || entry.source.title,
          date: entry.sourceDate,
          at: entry.receipt.at,
          url: entry.receipt.url,
          officialUrl: entry.source.url,
          echoType: ECHO_TYPES[entry.receipt.evidenceType],
          evidenceType: entry.receipt.evidenceType,
          evidenceBasis: entry.receipt.evidenceBasis,
          reviewState: entry.receipt.reviewState,
          sourceFingerprint: entry.sourceFingerprint,
          dossierFingerprint: entry.dossierFingerprint,
          machineCandidate: true,
          navigationOnly: true,
          boundedEnd: false,
          publicExcerptIncluded: false,
          performanceEvidence: false,
          playable: false,
          cutEligible: false,
          quarantined: true,
          promotionAllowed: false,
          speaker: null,
          speakerStatus: "not-diarized"
        };
      });
      var echoStats = {
        total: echoes.length,
        context: echoes.filter(function (echo) {
          return echo.echoType === "context";
        }).length,
        signal: echoes.filter(function (echo) {
          return echo.echoType === "signal";
        }).length,
        sources: unique(echoes.map(function (echo) {
          return echo.sourceId;
        })).length,
        navigationOnly: true,
        playable: 0,
        cutEligible: 0
      };
      var characterLabel = clean(
        rawDefinition[policy.profileLabelField] ||
        rawDefinition.subject ||
        rawDefinition[policy.profileEntityField] ||
        rawDefinition.displayName,
        240
      );
      var lineage = {
        schema: LINEAGE_SCHEMA,
        version: VERSION,
        id: id,
        bitId: bitId,
        characterId: characterId,
        entityBindings: entityBindings,
        label: requiredText(
          rawDefinition.label ||
          rawDefinition.name ||
          rawDefinition.bit ||
          rawDefinition.displayName,
          "lineages[" + definitionIndex + "].label",
          240
        ),
        character: characterLabel,
        description: clean(
          rawDefinition.description ||
          rawDefinition.profile ||
          "A chronological route through canonical recurring receipts.",
          700
        ),
        appearanceCount: performances.length,
        appearances: performances.length,
        laterAppearanceCount: Math.max(0, performances.length - 1),
        sourceCount: sourceIds.length,
        sourceIds: sourceIds,
        firstDate: firstDate,
        lastDate: lastDate,
        elapsedDays: elapsedDays,
        elapsedLabel: numberLabel(elapsedDays) + " INDEXED DAYS",
        performances: performances,
        overlapCount: overlaps.length,
        overlaps: overlaps,
        echoes: echoes,
        echoStats: echoStats,
        receiptKeys: performances.map(function (performance) {
          return performance.receiptKey;
        }),
        artifactProof: artifactProof,
        profileMapping: {
          entityField: policy.profileEntityField,
          entityId: profileEntityId,
          characterId: characterId,
          profileLabel: characterLabel,
          basis: "configured-profile-plus-canonical-entity-membership",
          clipSpeakerAttribution: false,
          performerVerification: false,
          statement:
            "Profile mapping groups canonical receipts; it does not identify any clip speaker."
        },
        boundaries: {
          canonicalReceiptsOnly: true,
          exactSourceBounds: true,
          exactPerformanceContract: true,
          exactLineageArtifactMembership: true,
          overlapsPreserved: true,
          echoesNavigationOnly: true,
          profileMappingIsSpeakerAttribution: false,
          earliestKnownInIndexedCorpus: true,
          speakerContinuity: false,
          trueOrigin: false,
          causality: false,
          creatorApproved: false,
          rightsCleared: false,
          canonMutated: false,
          mediaCopied: false
        },
        echoBoundary: {
          machineCandidate: true,
          quarantined: true,
          navigationOnly: true,
          boundedClip: false,
          performanceEvidence: false,
          originEvidence: false,
          playable: false,
          cutEligible: false,
          promotionAllowed: false,
          speakerDiarized: false,
          statement:
            "Echoes are quarantined machine-candidate source navigation, never performances or cut stops."
        },
        authority: authority,
        caution:
          "EARLIEST CURATED WINDOW IN CURRENT INDEX is a corpus boundary, not a claim of first-ever performance.",
        disclaimer:
          "Chronology does not establish speaker continuity, true origin, causality, approval, rights, or canon."
      };
      lineage.fingerprint = fnv1a(stableJson(lineage));
      return freezeDeep(lineage);
    });

    var lineageMap = new Map(lineages.map(function (lineage) {
      return [lineage.id, lineage];
    }));
    var labelMap = new Map();
    lineages.forEach(function (lineage) {
      var normalized = lineage.label.toLowerCase();
      if (!labelMap.has(normalized)) labelMap.set(normalized, lineage);
    });

    function requireLineage(id) {
      var key = clean(id);
      var lineage = lineageMap.get(key) || labelMap.get(key.toLowerCase());
      if (!lineage) fail("UNKNOWN_LINEAGE", "Lineage " + key + " is not registered.");
      return lineage;
    }

    function selectionsFor(lineage, limit) {
      var performances = lineage.performances.slice();
      if (limit != null) {
        var requested = Number(limit);
        if (!Number.isInteger(requested) ||
            requested < MIN_CUT_RECEIPTS ||
            requested > MAX_CUT_RECEIPTS ||
            requested > performances.length) {
          fail(
            "INVALID_CUT_LIMIT",
            "A bloodline cut limit must be 3 to 8 and cannot exceed its receipts."
          );
        }
        if (requested < performances.length) {
          performances = performances.slice(0, requested - 1).concat(
            performances[performances.length - 1]
          );
        }
      }
      if (performances.length < MIN_CUT_RECEIPTS) {
        fail("INSUFFICIENT_CUT_RECEIPTS", "A Memory Cut requires at least 3 receipts.");
      }
      if (performances.length > MAX_CUT_RECEIPTS) {
        fail(
          "CUT_LIMIT_REQUIRED",
          "This lineage exceeds 8 receipts; supply an explicit cut limit."
        );
      }
      return performances.map(function (performance) {
        return {
          receiptKey: performance.receiptKey,
          sourceId: performance.sourceId,
          sourceFingerprint: performance.sourceFingerprint,
          dossierFingerprint: performance.dossierFingerprint,
          at: performance.at,
          end: performance.end
        };
      });
    }

    function compileCutPacket(id, config) {
      var lineage = requireLineage(id);
      var settings = record(config) ? config : {};
      var selections = selectionsFor(lineage, settings.limit);
      var selectedKeys = new Set(selections.map(function (selection) {
        return selection.receiptKey;
      }));
      var packet = {
        schema: CUT_REQUEST_SCHEMA,
        title: clean(
          settings.title || lineage.label + " // SOURCE-LOCKED BLOODLINE",
          180
        ),
        introduction: clean(
          settings.introduction ||
          "An indexed recurrence assembled from exact canonical source windows. " +
          "Its earliest curated window is limited to the current index, not a claim of true origin.",
          600
        ),
        bindings: serial(bindings),
        selections: selections,
        ok: true,
        rejected: [],
        lineageId: lineage.id,
        lineageFingerprint: lineage.fingerprint,
        selectionPolicy:
          selections.length === lineage.performances.length
            ? "complete-chronology"
            : "chronological-bookends",
        overlapCount: lineage.overlaps.filter(function (overlap) {
          return selectedKeys.has(overlap.leftReceiptKey) &&
            selectedKeys.has(overlap.rightReceiptKey);
        }).length,
        overlaps: lineage.overlaps.filter(function (overlap) {
          return selectedKeys.has(overlap.leftReceiptKey) &&
            selectedKeys.has(overlap.rightReceiptKey);
        }),
        omittedReceiptKeys: lineage.receiptKeys.filter(function (key) {
          return !selectedKeys.has(key);
        }),
        authority: serial(authority)
      };
      packet.fingerprint = fnv1a(stableJson(packet));
      return freezeDeep(packet);
    }

    var dates = lineages.reduce(function (output, lineage) {
      return output.concat([lineage.firstDate, lineage.lastDate]);
    }, []).sort();
    var allSources = unique(lineages.reduce(function (output, lineage) {
      return output.concat(lineage.sourceIds);
    }, []));
    var allEchoes = lineages.reduce(function (output, lineage) {
      return output.concat(lineage.echoes);
    }, []);
    var stats = {
      lineages: lineages.length,
      performances: lineages.reduce(function (total, lineage) {
        return total + lineage.appearanceCount;
      }, 0),
      laterAppearances: lineages.reduce(function (total, lineage) {
        return total + lineage.laterAppearanceCount;
      }, 0),
      sources: allSources.length,
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      elapsedDays: daysBetween(dates[0], dates[dates.length - 1]),
      overlaps: lineages.reduce(function (total, lineage) {
        return total + lineage.overlapCount;
      }, 0),
      echoes: allEchoes.length,
      echoContext: allEchoes.filter(function (echo) {
        return echo.echoType === "context";
      }).length,
      echoSignals: allEchoes.filter(function (echo) {
        return echo.echoType === "signal";
      }).length,
      echoSources: unique(allEchoes.map(function (echo) {
        return echo.sourceId;
      })).length,
      playableEchoes: 0,
      cutEligibleEchoes: 0,
      profileMappings: lineages.length,
      registrySources: sources.size,
      registryReceipts: receipts.size,
      registryFingerprint: registryFingerprint
    };
    var engineFingerprint = fnv1a(stableJson({
      bindings: bindings,
      policy: policy,
      lineages: lineages.map(function (lineage) {
        return [lineage.id, lineage.fingerprint];
      })
    }));

    return freezeDeep({
      engine: "SHOKKER BIT BLOODLINE",
      version: VERSION,
      schema: LINEAGE_SCHEMA,
      bindings: serial(bindings),
      policy: serial(policy),
      registryFingerprint: registryFingerprint,
      fingerprint: engineFingerprint,
      list: function () {
        return freezeDeep(serial(lineages));
      },
      get: function (id) {
        return freezeDeep(serial(requireLineage(id)));
      },
      selection: function (id) {
        return freezeDeep(serial(selectionsFor(requireLineage(id))));
      },
      compileCutPacket: compileCutPacket,
      getStats: function () {
        return freezeDeep(serial(stats));
      }
    });
  }

  Object.defineProperty(root, "ShokkerBitBloodline", {
    value: freezeDeep({
      VERSION: VERSION,
      LINEAGE_SCHEMA: LINEAGE_SCHEMA,
      CUT_REQUEST_SCHEMA: CUT_REQUEST_SCHEMA,
      MIN_LINEAGE_RECEIPTS: MIN_LINEAGE_RECEIPTS,
      MIN_CUT_RECEIPTS: MIN_CUT_RECEIPTS,
      MAX_CUT_RECEIPTS: MAX_CUT_RECEIPTS,
      RESOLVE_TOLERANCE_SECONDS: RESOLVE_TOLERANCE_SECONDS,
      PERFORMANCE_CONTRACT: PERFORMANCE_CONTRACT,
      ARTIFACT_CONTRACT: ARTIFACT_CONTRACT,
      create: create
    }),
    enumerable: true,
    writable: false,
    configurable: false
  });
})(typeof window !== "undefined" ? window : globalThis);
