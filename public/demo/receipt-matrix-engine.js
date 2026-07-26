(function (root) {
  "use strict";

  /*
   * RECEIPT MATRIX
   *
   * A channel-neutral, source-locked grouping engine over canonical Source
   * Dossiers. It answers set questions such as "which registered sources have
   * evidence for every requested entity?" without turning same-source evidence
   * into a same-moment, interaction, speaker, causality, or origin claim.
   */

  var VERSION = "1.0.0";
  var RESULT_SCHEMA = "shokker-receipt-matrix-result/v1";
  var REQUEST_SCHEMA = "shokker-receipt-matrix-request/v1";
  var DOSSIER_SCHEMA = "shokker-source-dossier/v1";
  var MAX_ENTITIES = 8;
  var QUANTIFIERS = Object.freeze({ all: true, any: true });
  var ORDERS = Object.freeze({
    "receipt-count-desc": true,
    "source-date-asc": true,
    "source-date-desc": true,
    "title-asc": true
  });
  var CLOSED_POLICY = Object.freeze({
    id: "closed-default/v1",
    source: Object.freeze({
      authority: "promoted-lane",
      coverage: "caption-backed"
    }),
    receiptContracts: Object.freeze([]),
    requireSpeakerUndiarized: true
  });

  function MatrixError(code, message, path) {
    this.name = "ReceiptMatrixError";
    this.code = code;
    this.message = message;
    this.path = path || "";
    if (Error.captureStackTrace) Error.captureStackTrace(this, MatrixError);
  }
  MatrixError.prototype = Object.create(Error.prototype);
  MatrixError.prototype.constructor = MatrixError;

  function fail(code, message, path) {
    throw new MatrixError(code, message, path);
  }

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function record(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    var prototype = Object.getPrototypeOf(value);
    return Object.prototype.toString.call(value) === "[object Object]" &&
      (prototype === null || Object.getPrototypeOf(prototype) === null);
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
      fail("INVALID_NUMBER", path + " must be finite.", path);
    }
    return output;
  }

  function snapshot(value, path, depth, seen) {
    var location = path || "input";
    var level = depth || 0;
    var visited = seen || [];
    if (level > 64) fail("DEPTH_LIMIT", location + " exceeds the data depth limit.", location);
    if (value === null || ["string", "boolean"].indexOf(typeof value) >= 0) return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        fail("NON_FINITE_NUMBER", location + " must be finite.", location);
      }
      return value;
    }
    if (!value || typeof value !== "object") {
      fail("NON_JSON_VALUE", location + " must contain JSON-compatible data.", location);
    }
    if (visited.indexOf(value) >= 0) {
      fail("CIRCULAR_INPUT", location + " must not be circular.", location);
    }
    if (!Array.isArray(value) && !record(value)) {
      fail("UNSAFE_OBJECT", location + " must be a plain data object.", location);
    }
    if (Object.getOwnPropertySymbols(value).length) {
      fail("UNSAFE_DESCRIPTOR", location + " must not contain symbol fields.", location);
    }
    var descriptors;
    try {
      descriptors = Object.getOwnPropertyDescriptors(value);
    } catch {
      fail("UNSAFE_DESCRIPTOR", location + " descriptors could not be read.", location);
    }
    for (var inherited in value) {
      if (!own(value, inherited)) {
        fail("INHERITED_FIELD", location + " contains inherited data.", location);
      }
    }
    var output = Array.isArray(value) ? [] : {};
    var names = Object.keys(descriptors);
    var expectedLength = Array.isArray(value) && descriptors.length &&
      Number.isInteger(descriptors.length.value) ? descriptors.length.value : 0;
    visited.push(value);
    names.forEach(function (key) {
      if (Array.isArray(value) && key === "length") return;
      if (["__proto__", "prototype", "constructor"].indexOf(key) >= 0) {
        fail("UNSAFE_KEY", location + "." + key + " is prototype-sensitive.", location + "." + key);
      }
      var descriptor = descriptors[key];
      if (!descriptor || own(descriptor, "get") || own(descriptor, "set") ||
          descriptor.enumerable !== true) {
        fail(
          "UNSAFE_DESCRIPTOR",
          location + "." + key + " must be enumerable own data.",
          location + "." + key
        );
      }
      if (Array.isArray(value) &&
          (!/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= expectedLength)) {
        fail("UNSAFE_ARRAY_KEY", location + "." + key + " is not a canonical array index.");
      }
      output[key] = snapshot(
        descriptor.value,
        location + (Array.isArray(value) ? "[" + key + "]" : "." + key),
        level + 1,
        visited
      );
    });
    visited.pop();
    if (Array.isArray(value) &&
        names.filter(function (key) { return key !== "length"; }).length !== expectedLength) {
      fail("SPARSE_ARRAY", location + " must not contain sparse entries.", location);
    }
    return output;
  }

  function serial(value) {
    return JSON.parse(JSON.stringify(value));
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

  function compareText(left, right) {
    var a = clean(left).toLowerCase();
    var b = clean(right).toLowerCase();
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function validDate(value, path) {
    var date = requiredText(value, path, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date + "T00:00:00Z"))) {
      fail("INVALID_DATE", path + " must be an ISO date.", path);
    }
    return date;
  }

  function publicSnapshot(value) {
    var state = clean(value).toLowerCase();
    return Boolean(state) &&
      !/(?:unavailable|private|deleted|removed|blocked|members[- ]only)/.test(state);
  }

  function exactKeys(value, allowed, required, path) {
    if (!record(value)) fail("INVALID_OBJECT", path + " must be an object.", path);
    var allow = new Set(allowed);
    Object.keys(value).forEach(function (key) {
      if (!allow.has(key)) {
        fail("UNEXPECTED_FIELD", path + "." + key + " is unsupported.", path + "." + key);
      }
    });
    required.forEach(function (key) {
      if (!own(value, key)) {
        fail("MISSING_FIELD", path + "." + key + " is required.", path + "." + key);
      }
    });
  }

  function normalizePolicy(input) {
    if (input == null) return freezeDeep(serial(CLOSED_POLICY));
    var raw = snapshot(input, "policy");
    exactKeys(
      raw,
      ["id", "source", "receiptContracts", "requireSpeakerUndiarized"],
      ["id", "source", "receiptContracts"],
      "policy"
    );
    exactKeys(
      raw.source,
      ["authority", "coverage"],
      ["authority", "coverage"],
      "policy.source"
    );
    var authority = requiredText(raw.source.authority, "policy.source.authority", 80);
    var coverage = requiredText(raw.source.coverage, "policy.source.coverage", 80);
    if (authority !== "promoted-lane" || coverage !== "caption-backed") {
      fail(
        "UNSAFE_POLICY",
        "Receipt Matrix source policy must remain promoted-lane and caption-backed."
      );
    }
    if (!Array.isArray(raw.receiptContracts) || raw.receiptContracts.length > 16) {
      fail("INVALID_POLICY", "policy.receiptContracts must contain at most 16 contracts.");
    }
    var contracts = raw.receiptContracts.map(function (contract, index) {
      var path = "policy.receiptContracts[" + index + "]";
      exactKeys(
        contract,
        [
          "kind",
          "evidenceType",
          "evidenceBasis",
          "reviewState",
          "publicExcerptAllowed",
          "promotionAllowed"
        ],
        [
          "kind",
          "evidenceType",
          "evidenceBasis",
          "reviewState",
          "publicExcerptAllowed",
          "promotionAllowed"
        ],
        path
      );
      var normalized = {
        kind: requiredText(contract.kind, path + ".kind", 100),
        evidenceType: requiredText(contract.evidenceType, path + ".evidenceType", 120),
        evidenceBasis: requiredText(contract.evidenceBasis, path + ".evidenceBasis", 180),
        reviewState: requiredText(contract.reviewState, path + ".reviewState", 160),
        publicExcerptAllowed: contract.publicExcerptAllowed,
        promotionAllowed: contract.promotionAllowed
      };
      if (normalized.publicExcerptAllowed !== true ||
          normalized.promotionAllowed !== false ||
          /quarantin|withheld|reject/i.test(normalized.reviewState)) {
        fail(
          "UNSAFE_POLICY",
          path + " attempts to admit withheld, promoted, or quarantined evidence."
        );
      }
      return normalized;
    });
    var contractKeys = contracts.map(stableJson);
    if (new Set(contractKeys).size !== contractKeys.length) {
      fail("DUPLICATE_CONTRACT", "policy.receiptContracts must be unique.");
    }
    var requireSpeakerUndiarized = own(raw, "requireSpeakerUndiarized")
      ? raw.requireSpeakerUndiarized
      : true;
    if (requireSpeakerUndiarized !== true) {
      fail("UNSAFE_POLICY", "Receipt Matrix requires non-diarized speaker boundaries.");
    }
    return freezeDeep({
      id: requiredText(raw.id, "policy.id", 160),
      source: { authority: authority, coverage: coverage },
      receiptContracts: contracts,
      requireSpeakerUndiarized: true
    });
  }

  function contractMatch(receipt, contracts) {
    return contracts.some(function (contract) {
      return receipt.kind === contract.kind &&
        receipt.evidenceType === contract.evidenceType &&
        receipt.evidenceBasis === contract.evidenceBasis &&
        receipt.reviewState === contract.reviewState &&
        receipt.publicExcerptAllowed === contract.publicExcerptAllowed &&
        receipt.promotionAllowed === contract.promotionAllowed;
    });
  }

  function create(options) {
    if (!record(options)) fail("INVALID_OPTIONS", "create requires a plain options object.");
    var descriptors = Object.getOwnPropertyDescriptors(options);
    ["dossierEngine", "policy"].forEach(function (key) {
      if (!own(descriptors, key)) return;
      if (own(descriptors[key], "get") || own(descriptors[key], "set")) {
        fail("UNSAFE_DESCRIPTOR", "options." + key + " must be own data.", "options." + key);
      }
    });
    Object.keys(descriptors).forEach(function (key) {
      if (["dossierEngine", "policy"].indexOf(key) < 0) {
        fail("UNEXPECTED_FIELD", "options." + key + " is unsupported.", "options." + key);
      }
    });
    var dossierEngine = options.dossierEngine;
    if (!dossierEngine || typeof dossierEngine.list !== "function" ||
        typeof dossierEngine.build !== "function" ||
        typeof dossierEngine.getStats !== "function") {
      fail(
        "INVALID_DOSSIER_ENGINE",
        "options.dossierEngine must provide list, build, and getStats."
      );
    }
    var policy = normalizePolicy(options.policy);
    var policyFingerprint = fnv1a(stableJson(policy));
    var listed;
    try {
      listed = snapshot(dossierEngine.list(), "registry");
    } catch (error) {
      if (error && error.name === "ReceiptMatrixError") throw error;
      fail("REGISTRY_READ_FAILED", "The canonical source registry could not be read.");
    }
    if (!Array.isArray(listed) || !listed.length) {
      fail("EMPTY_REGISTRY", "The canonical source registry is empty.");
    }

    var sources = new Map();
    var bindings = null;
    listed.forEach(function (listedSource, index) {
      if (!record(listedSource)) {
        fail("FOREIGN_REGISTRY", "registry[" + index + "] is malformed.");
      }
      var sourceId = requiredText(listedSource.id, "registry[" + index + "].id", 64);
      if (sources.has(sourceId)) {
        fail("DUPLICATE_SOURCE", "The source registry repeats " + sourceId + ".");
      }
      var rawDossier;
      try {
        rawDossier = dossierEngine.build(sourceId);
      } catch {
        fail("SOURCE_BUILD_FAILED", "Canonical source " + sourceId + " could not be built.");
      }
      var dossier = snapshot(rawDossier, "dossier[" + sourceId + "]");
      if (dossier.schema !== DOSSIER_SCHEMA ||
          !record(dossier.bindings) || !record(dossier.source) || !record(dossier.proof)) {
        fail("FOREIGN_DOSSIER", "Source " + sourceId + " is not a canonical Source Dossier.");
      }
      var suppliedDossierFingerprint = requiredText(
        dossier.fingerprint,
        "dossier[" + sourceId + "].fingerprint",
        180
      );
      var fingerprintBody = serial(dossier);
      delete fingerprintBody.fingerprint;
      if (fnv1a(stableJson(fingerprintBody)) !== suppliedDossierFingerprint) {
        fail("TAMPERED_DOSSIER", "Source " + sourceId + " has a stale dossier fingerprint.");
      }
      if (dossier.source.id !== sourceId ||
          dossier.source.sourceFingerprint !== listedSource.sourceFingerprint) {
        fail("STALE_REGISTRY", "Source " + sourceId + " disagrees with the registry.");
      }
      if (dossier.proof.creatorApproved !== false ||
          dossier.proof.rightsCleared !== false ||
          dossier.proof.speakerDiarized !== false ||
          dossier.proof.canonPromotedByDossier !== false) {
        fail("AUTHORITY_INFLATION", "Source " + sourceId + " overstates dossier authority.");
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
        fail("MIXED_BINDINGS", "The registry mixes incompatible channel bindings.");
      }
      if (!Array.isArray(dossier.source.receipts) ||
          !Array.isArray(dossier.source.entities) ||
          !Array.isArray(dossier.source.artifacts)) {
        fail("FOREIGN_DOSSIER", "Source " + sourceId + " has incomplete canonical arrays.");
      }
      sources.set(sourceId, {
        id: sourceId,
        listed: listedSource,
        dossier: dossier,
        date: validDate(dossier.source.date, "source[" + sourceId + "].date"),
        sourceFingerprint: requiredText(
          dossier.source.sourceFingerprint,
          "source[" + sourceId + "].sourceFingerprint",
          180
        ),
        dossierFingerprint: suppliedDossierFingerprint,
        eligibleSource:
          dossier.source.authority === policy.source.authority &&
          dossier.source.coverage === policy.source.coverage &&
          dossier.proof.quarantined !== true &&
          publicSnapshot(dossier.source.availability)
      });
    });

    var entities = new Map();
    sources.forEach(function (sourceEntry) {
      var localIds = new Set();
      sourceEntry.dossier.source.entities.forEach(function (entity, index) {
        if (!record(entity)) {
          fail("FOREIGN_ENTITY", "Source " + sourceEntry.id + " has a malformed entity.");
        }
        var entityId = requiredText(
          entity.id,
          "source[" + sourceEntry.id + "].entities[" + index + "].id",
          160
        );
        if (localIds.has(entityId)) {
          fail("DUPLICATE_ENTITY", "Source " + sourceEntry.id + " repeats entity " + entityId + ".");
        }
        localIds.add(entityId);
        var label = requiredText(entity.label, "entity.label", 240);
        var type = requiredText(entity.type, "entity.type", 100);
        var existing = entities.get(entityId);
        if (existing && (existing.label !== label || existing.type !== type)) {
          fail("ENTITY_CONFLICT", "Entity " + entityId + " has conflicting canonical metadata.");
        }
        if (!existing) {
          existing = {
            id: entityId,
            label: label,
            type: type,
            sourceIds: new Set(),
            eligibleSourceIds: new Set(),
            eligibleReceiptKeys: new Set()
          };
          entities.set(entityId, existing);
        }
        existing.sourceIds.add(sourceEntry.id);
      });
      sourceEntry.localEntityIds = localIds;
    });

    var receiptKeys = new Set();
    var eligibleReceipts = [];
    var eligibleBySource = new Map();
    var excludedMatchingReceipts = 0;
    sources.forEach(function (sourceEntry) {
      var duration = finite(
        sourceEntry.dossier.source.duration,
        "source[" + sourceEntry.id + "].duration"
      );
      var localReceiptKeys = new Set();
      sourceEntry.dossier.source.receipts.forEach(function (receipt, index) {
        if (!record(receipt)) {
          fail("FOREIGN_RECEIPT", "Source " + sourceEntry.id + " has a malformed receipt.");
        }
        var key = requiredText(
          receipt.key,
          "source[" + sourceEntry.id + "].receipts[" + index + "].key",
          240
        );
        if (localReceiptKeys.has(key) || receiptKeys.has(key)) {
          fail("DUPLICATE_RECEIPT", "Canonical receipt " + key + " is not globally unique.");
        }
        localReceiptKeys.add(key);
        receiptKeys.add(key);
        array(receipt.entityIds).forEach(function (entityId) {
          if (!sourceEntry.localEntityIds.has(entityId) || !entities.has(entityId)) {
            fail(
              "FOREIGN_RECEIPT_ENTITY",
              "Receipt " + key + " references an entity outside its canonical source."
            );
          }
        });
        if (!contractMatch(receipt, policy.receiptContracts)) return;
        if (!sourceEntry.eligibleSource ||
            /quarantin|withheld|reject/i.test(clean(receipt.reviewState))) {
          excludedMatchingReceipts += 1;
          return;
        }
        if (policy.requireSpeakerUndiarized &&
            (receipt.speaker !== null || receipt.speakerStatus !== "not-diarized")) {
          fail("SPEAKER_BOUNDARY", "Eligible receipt " + key + " overstates speaker identity.");
        }
        var at = finite(receipt.at, "receipt[" + key + "].at");
        var end = finite(receipt.end, "receipt[" + key + "].end");
        if (at < 0 || end <= at || end > duration + 1) {
          fail("UNTIMED_ELIGIBLE_RECEIPT", "Eligible receipt " + key + " has invalid bounds.");
        }
        var eligible = {
          receiptKey: key,
          sourceId: sourceEntry.id,
          at: at,
          start: at,
          end: end,
          duration: end - at,
          url: requiredText(receipt.url, "receipt[" + key + "].url", 600),
          label: requiredText(receipt.label, "receipt[" + key + "].label", 240),
          excerpt: clean(receipt.excerpt, 600),
          kind: receipt.kind,
          evidenceType: receipt.evidenceType,
          evidenceLevel: requiredText(receipt.evidenceLevel, "receipt.evidenceLevel", 180),
          evidenceBasis: receipt.evidenceBasis,
          reviewState: receipt.reviewState,
          publicExcerptAllowed: true,
          promotionAllowed: false,
          entityIds: unique(receipt.entityIds).sort(),
          sourceFingerprint: sourceEntry.sourceFingerprint,
          dossierFingerprint: sourceEntry.dossierFingerprint,
          speaker: null,
          speakerStatus: "not-diarized",
          creatorApproved: false,
          rightsCleared: false,
          canonMutated: false,
          mediaCopied: false
        };
        eligibleReceipts.push(eligible);
        if (!eligibleBySource.has(sourceEntry.id)) eligibleBySource.set(sourceEntry.id, []);
        eligibleBySource.get(sourceEntry.id).push(eligible);
        eligible.entityIds.forEach(function (entityId) {
          var entity = entities.get(entityId);
          entity.eligibleSourceIds.add(sourceEntry.id);
          entity.eligibleReceiptKeys.add(key);
        });
      });
      sourceEntry.localReceiptKeys = localReceiptKeys;
      sourceEntry.dossier.source.entities.forEach(function (entity) {
        array(entity.receiptKeys).forEach(function (key) {
          if (!localReceiptKeys.has(key)) {
            fail(
              "FOREIGN_ENTITY_RECEIPT",
              "Entity " + entity.id + " references a receipt outside its source."
            );
          }
        });
      });
    });
    eligibleBySource.forEach(function (values) {
      values.sort(function (left, right) {
        return left.at - right.at || compareText(left.receiptKey, right.receiptKey);
      });
    });

    var registryFingerprint = fnv1a(stableJson({
      bindings: bindings,
      sources: Array.from(sources.values()).map(function (source) {
        return [source.id, source.sourceFingerprint, source.dossierFingerprint];
      }).sort(function (left, right) {
        return compareText(left[0], right[0]);
      }),
      receipts: Array.from(receiptKeys).sort(),
      entities: Array.from(entities.keys()).sort()
    }));
    bindings = Object.assign({}, bindings, {
      registryFingerprint: registryFingerprint,
      policyFingerprint: policyFingerprint
    });

    var authority = freezeDeep({
      sameMoment: false,
      interaction: false,
      speakerVerified: false,
      speakerContinuity: false,
      causality: false,
      trueOrigin: false,
      creatorApproved: false,
      creatorApproval: false,
      rightsCleared: false,
      canonPromoted: false,
      canonMutated: false,
      mediaCopied: false,
      mediaDownloaded: false,
      published: false
    });
    var boundary = freezeDeep({
      canonicalSourceDossiersOnly: true,
      exactReceiptContractsOnly: true,
      groupedByCanonicalSource: true,
      sameSourceEvidenceOnly: true,
      sameMomentEstablished: false,
      interactionEstablished: false,
      speakerContinuityEstablished: false,
      causalityEstablished: false,
      trueOriginEstablished: false,
      statement:
        "A matching group proves only that eligible receipts for the requested entities exist in the same registered source."
    });

    function entityView(entity) {
      return {
        id: entity.id,
        entityId: entity.id,
        label: entity.label,
        type: entity.type,
        canonicalSourceCount: entity.sourceIds.size,
        eligibleSourceCount: entity.eligibleSourceIds.size,
        eligibleReceiptCount: entity.eligibleReceiptKeys.size
      };
    }

    var entityList = Array.from(entities.values()).map(entityView).sort(function (left, right) {
      return compareText(left.label, right.label) || compareText(left.id, right.id);
    });

    function readQuery(input) {
      var spec = snapshot(input, "spec");
      exactKeys(
        spec,
        ["schema", "entityIds", "quantifier", "order"],
        ["entityIds"],
        "spec"
      );
      if (spec.schema && spec.schema !== REQUEST_SCHEMA) {
        fail("FOREIGN_SCHEMA", "spec.schema is unsupported.", "spec.schema");
      }
      if (!Array.isArray(spec.entityIds) ||
          spec.entityIds.length < 1 ||
          spec.entityIds.length > MAX_ENTITIES) {
        fail("INVALID_ENTITY_COUNT", "spec.entityIds must contain 1 to 8 entity IDs.");
      }
      var entityIds = spec.entityIds.map(function (entityId, index) {
        return requiredText(entityId, "spec.entityIds[" + index + "]", 160);
      });
      if (new Set(entityIds).size !== entityIds.length) {
        fail("DUPLICATE_ENTITY", "spec.entityIds must not repeat an entity.");
      }
      entityIds.forEach(function (entityId) {
        if (!entities.has(entityId)) {
          fail("UNKNOWN_ENTITY", "Entity " + entityId + " is not in the canonical registry.");
        }
      });
      var quantifier = clean(spec.quantifier || "all").toLowerCase();
      var order = clean(spec.order || "receipt-count-desc").toLowerCase();
      if (!own(QUANTIFIERS, quantifier)) {
        fail("UNKNOWN_QUANTIFIER", "spec.quantifier must be all or any.");
      }
      if (!own(ORDERS, order)) {
        fail("UNKNOWN_ORDER", "spec.order is unsupported.");
      }
      return {
        entityIds: entityIds.sort(),
        quantifier: quantifier,
        order: order
      };
    }

    function groupComparator(order) {
      if (order === "source-date-asc") {
        return function (left, right) {
          return left.date.localeCompare(right.date) || compareText(left.sourceId, right.sourceId);
        };
      }
      if (order === "source-date-desc") {
        return function (left, right) {
          return right.date.localeCompare(left.date) || compareText(left.sourceId, right.sourceId);
        };
      }
      if (order === "title-asc") {
        return function (left, right) {
          return compareText(left.sourceTitle, right.sourceTitle) ||
            left.date.localeCompare(right.date) ||
            compareText(left.sourceId, right.sourceId);
        };
      }
      return function (left, right) {
        return right.receiptCount - left.receiptCount ||
          right.date.localeCompare(left.date) ||
          compareText(left.sourceId, right.sourceId);
      };
    }

    function query(input) {
      var request = readQuery(input);
      var requested = new Set(request.entityIds);
      var groups = [];
      sources.forEach(function (sourceEntry) {
        if (!sourceEntry.eligibleSource) return;
        var related = array(eligibleBySource.get(sourceEntry.id)).filter(function (receipt) {
          return receipt.entityIds.some(function (entityId) {
            return requested.has(entityId);
          });
        });
        if (!related.length) return;
        var coverage = request.entityIds.filter(function (entityId) {
          return related.some(function (receipt) {
            return receipt.entityIds.indexOf(entityId) >= 0;
          });
        });
        var qualifies = request.quantifier === "all"
          ? coverage.length === request.entityIds.length
          : coverage.length > 0;
        if (!qualifies) return;
        var receipts = related.map(function (receipt) {
          return Object.assign({}, receipt, {
            matchedEntityIds: receipt.entityIds.filter(function (entityId) {
              return requested.has(entityId);
            })
          });
        });
        var perEntity = request.entityIds.map(function (entityId) {
          var matching = receipts.filter(function (receipt) {
            return receipt.matchedEntityIds.indexOf(entityId) >= 0;
          });
          var entity = entities.get(entityId);
          return {
            entityId: entityId,
            label: entity.label,
            type: entity.type,
            receiptCount: matching.length,
            receiptKeys: matching.map(function (receipt) {
              return receipt.receiptKey;
            })
          };
        });
        groups.push({
          rank: 0,
          sourceId: sourceEntry.id,
          sourceTitle:
            sourceEntry.dossier.source.displayTitle || sourceEntry.dossier.source.title,
          date: sourceEntry.date,
          officialUrl: sourceEntry.dossier.source.url,
          sourceFingerprint: sourceEntry.sourceFingerprint,
          dossierFingerprint: sourceEntry.dossierFingerprint,
          receiptCount: receipts.length,
          entityCoverage: {
            matched: coverage.length,
            requested: request.entityIds.length,
            complete: coverage.length === request.entityIds.length,
            entityIds: coverage
          },
          perEntity: perEntity,
          receipts: receipts,
          authority: serial(authority)
        });
      });
      groups.sort(groupComparator(request.order));
      groups.forEach(function (group, index) {
        group.rank = index + 1;
      });
      var entityTotals = request.entityIds.map(function (entityId) {
        var receiptSet = new Set();
        var sourceSet = new Set();
        groups.forEach(function (group) {
          var entry = group.perEntity.find(function (item) {
            return item.entityId === entityId;
          });
          if (!entry || !entry.receiptCount) return;
          sourceSet.add(group.sourceId);
          entry.receiptKeys.forEach(function (key) {
            receiptSet.add(key);
          });
        });
        var entity = entities.get(entityId);
        return {
          entityId: entityId,
          label: entity.label,
          type: entity.type,
          eligibleReceiptCount: receiptSet.size,
          uniqueSourceCount: sourceSet.size,
          matchedGroupCount: sourceSet.size
        };
      });
      var output = {
        schema: RESULT_SCHEMA,
        version: VERSION,
        status: groups.length ? "supported" : "insufficient-evidence",
        request: {
          entityIds: request.entityIds,
          quantifier: request.quantifier,
          order: request.order
        },
        bindings: serial(bindings),
        policy: {
          id: policy.id,
          fingerprint: policyFingerprint,
          closed: policy.receiptContracts.length === 0
        },
        uniqueSourceCount: groups.length,
        eligibleReceiptCount: groups.reduce(function (total, group) {
          return total + group.receiptCount;
        }, 0),
        entityTotals: entityTotals,
        groups: groups,
        authority: serial(authority),
        boundary: serial(boundary)
      };
      output.fingerprint = fnv1a(stableJson(output));
      return freezeDeep(output);
    }

    var stats = {
      registrySources: sources.size,
      registryReceipts: receiptKeys.size,
      registryEntities: entities.size,
      eligibleSources: eligibleBySource.size,
      eligibleReceipts: eligibleReceipts.length,
      eligibleEntities: entityList.filter(function (entity) {
        return entity.eligibleReceiptCount > 0;
      }).length,
      excludedMatchingReceipts: excludedMatchingReceipts,
      closedPolicy: policy.receiptContracts.length === 0,
      registryFingerprint: registryFingerprint,
      policyFingerprint: policyFingerprint
    };
    var engineFingerprint = fnv1a(stableJson({
      bindings: bindings,
      policy: policy,
      eligibleReceipts: eligibleReceipts.map(function (receipt) {
        return [
          receipt.receiptKey,
          receipt.sourceId,
          receipt.at,
          receipt.end,
          receipt.entityIds
        ];
      }).sort(function (left, right) {
        return compareText(left[0], right[0]);
      })
    }));

    return freezeDeep({
      engine: "SHOKKER RECEIPT MATRIX",
      version: VERSION,
      schema: RESULT_SCHEMA,
      fingerprint: engineFingerprint,
      bindings: serial(bindings),
      policy: serial(policy),
      query: query,
      listEntities: function () {
        return freezeDeep(serial(entityList));
      },
      getStats: function () {
        return freezeDeep(serial(stats));
      }
    });
  }

  Object.defineProperty(root, "ShokkerReceiptMatrix", {
    value: freezeDeep({
      VERSION: VERSION,
      RESULT_SCHEMA: RESULT_SCHEMA,
      REQUEST_SCHEMA: REQUEST_SCHEMA,
      MAX_ENTITIES: MAX_ENTITIES,
      QUANTIFIERS: Object.keys(QUANTIFIERS),
      ORDERS: Object.keys(ORDERS),
      CLOSED_POLICY: CLOSED_POLICY,
      create: create
    }),
    enumerable: true,
    writable: false,
    configurable: false
  });
})(typeof window !== "undefined" ? window : globalThis);
