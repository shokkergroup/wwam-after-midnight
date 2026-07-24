(function (root) {
  "use strict";

  /*
   * ChannelPack is the executable boundary between the reusable Memory OS and
   * one channel's editorial identity. It deliberately compiles configuration,
   * never source evidence. A valid pack cannot promote a machine claim.
   */

  const VERSION = "1.0.0";
  const SCHEMA = "channel-pack-spec.json";
  const REQUIRED_VOCABULARY = Object.freeze([
    "ask",
    "receipt",
    "source",
    "unknown",
    "quarantine",
    "curatedCandidate",
    "reviewed",
    "certified",
    "correction"
  ]);
  const REQUIRED_LONGITUDINAL_VOCABULARY = Object.freeze([
    "product",
    "forecast",
    "response",
    "unresolved",
    "editBrief"
  ]);
  const REQUIRED_ADJUDICATION_CODES = Object.freeze([
    "SUPPORTED",
    "CONTRADICTED",
    "MIXED"
  ]);
  const REQUIRED_ADJUDICATION_LABELS = Object.freeze([
    "formal",
    "comedy",
    "bleep"
  ]);
  const REQUIRED_UPDATE_STAGES = Object.freeze([
    "discover",
    "quarantine",
    "review",
    "promote"
  ]);
  const REQUIRED_PROOF_LABELS = Object.freeze([
    "machine",
    "curatedCandidate",
    "editor",
    "creator",
    "inference"
  ]);
  const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const ENTITY_ID_PATTERN = /^[a-z0-9][a-z0-9:-]{1,119}$/;
  const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
  const NAMESPACE_PATTERN = /^shokker\.youtube-wiki\.([a-z0-9]+(?:-[a-z0-9]+)*)\.v(\d+)$/;
  const RELATIONSHIP_PATTERN = /^[A-Z][A-Z0-9_]*$/;

  class ChannelPackValidationError extends Error {
    constructor(issues) {
      super(`ChannelPack rejected with ${issues.length} conformance issue${issues.length === 1 ? "" : "s"}.`);
      this.name = "ChannelPackValidationError";
      this.code = "CHANNEL_PACK_REJECTED";
      this.issues = issues;
    }
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function own(record, key) {
    return Object.prototype.hasOwnProperty.call(record, key);
  }

  function cleanString(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function cleanStringArray(value, options) {
    const settings = options || {};
    if (!Array.isArray(value)) return [];
    const cleaned = value
      .map(cleanString)
      .filter(Boolean);
    const unique = [...new Set(cleaned)];
    return settings.preserveOrder ? unique : unique.sort((left, right) => left.localeCompare(right));
  }

  function cloneStable(value) {
    if (Array.isArray(value)) return value.map(cloneStable);
    if (!isRecord(value)) return value;
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce((copy, key) => {
        copy[key] = cloneStable(value[key]);
        return copy;
      }, {});
  }

  function stableStringify(value) {
    return JSON.stringify(cloneStable(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function snapshotOwnDataTree(value, path, issues, depth, seen) {
    const level = depth || 0;
    const visited = seen || new Set();
    if (level > 64) {
      issue(issues, path, "depth-limit", `${path} exceeds the artifact depth limit.`);
      return null;
    }
    if (!value || typeof value !== "object") {
      if (
        value !== null &&
        !["string", "number", "boolean"].includes(typeof value)
      ) {
        issue(issues, path, "non-json-value", `${path} must be JSON-compatible data.`);
        return null;
      }
      if (typeof value === "number" && !Number.isFinite(value)) {
        issue(issues, path, "non-finite-number", `${path} must be finite.`);
        return null;
      }
      return value;
    }
    if (visited.has(value)) {
      issue(issues, path, "circular-reference", `${path} must not be circular.`);
      return null;
    }
    if (!Array.isArray(value) && !isRecord(value)) {
      issue(issues, path, "required-object", `${path} must be plain data.`);
      return null;
    }
    let descriptors;
    try {
      descriptors = Object.getOwnPropertyDescriptors(value);
    } catch {
      issue(issues, path, "unsafe-descriptor", `${path} descriptors could not be read safely.`);
      return null;
    }
    if (Object.getOwnPropertySymbols(value).length) {
      issue(issues, path, "unsafe-descriptor", `${path} must not contain symbol fields.`);
    }
    for (const inheritedKey in value) {
      if (!own(value, inheritedKey)) {
        issue(
          issues,
          `${path}.${inheritedKey}`,
          "inherited-field",
          `${path}.${inheritedKey} must be an own field.`
        );
      }
    }
    const output = Array.isArray(value) ? [] : Object.create(null);
    const names = Object.keys(descriptors);
    const lengthDescriptor = Array.isArray(value) ? descriptors.length : null;
    const expectedLength = lengthDescriptor && Number.isInteger(lengthDescriptor.value) ?
      lengthDescriptor.value :
      0;
    visited.add(value);
    names.forEach((key) => {
      if (Array.isArray(value) && key === "length") return;
      const descriptor = descriptors[key];
      if (["__proto__", "prototype", "constructor"].includes(key)) {
        issue(
          issues,
          `${path}.${key}`,
          "unsafe-key",
          `${path}.${key} is a prototype-sensitive field.`
        );
        return;
      }
      if (
        !descriptor ||
        own(descriptor, "get") ||
        own(descriptor, "set") ||
        descriptor.enumerable !== true
      ) {
        issue(
          issues,
          `${path}.${key}`,
          "unsafe-descriptor",
          `${path}.${key} must be an enumerable own-data field.`
        );
        return;
      }
      if (
        Array.isArray(value) &&
        (!/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= expectedLength)
      ) {
        issue(
          issues,
          `${path}.${key}`,
          "unsafe-array-key",
          `${path}.${key} is not a canonical array index.`
        );
        return;
      }
      output[key] = snapshotOwnDataTree(
        descriptor.value,
        `${path}.${key}`,
        issues,
        level + 1,
        visited
      );
    });
    visited.delete(value);
    if (
      Array.isArray(value) &&
      names.filter((key) => key !== "length").length !== expectedLength
    ) {
      issue(issues, path, "sparse-array", `${path} must not contain sparse entries.`);
    }
    return output;
  }

  function hash32(value, seed) {
    let hash = seed >>> 0;
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      hash ^= code & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= code >>> 8;
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  function toHex(value) {
    return value.toString(16).padStart(8, "0");
  }

  function fingerprintPayload(payload) {
    const canonical = stableStringify(payload);
    const first = hash32(canonical, 0x811c9dc5);
    const second = hash32(`channel-pack\u0000${canonical}`, 0x9e3779b9);
    return `cp1-${toHex(first)}${toHex(second)}`;
  }

  function issue(list, path, code, message) {
    list.push({ path, code, message });
  }

  function rejectUnknownKeys(list, record, path, allowed) {
    if (!isRecord(record)) return;
    Object.keys(record).forEach((key) => {
      if (!allowed.includes(key)) {
        issue(
          list,
          path ? `${path}.${key}` : key,
          "unknown-field",
          `${path || "object"} contains an unsupported field.`
        );
      }
    });
  }

  function requireString(list, value, path, options) {
    const settings = options || {};
    const cleaned = cleanString(value);
    if (!cleaned) {
      issue(list, path, "required-string", `${path} must be a non-empty string.`);
      return "";
    }
    if (settings.pattern && !settings.pattern.test(cleaned)) {
      issue(list, path, "invalid-format", `${path} has an invalid format.`);
    }
    if (settings.max && cleaned.length > settings.max) {
      issue(list, path, "too-long", `${path} must be ${settings.max} characters or fewer.`);
    }
    return cleaned;
  }

  function requireUniqueStrings(list, value, path, options) {
    const settings = options || {};
    const minimum = Number.isInteger(settings.minimum) ? settings.minimum : 1;
    if (!Array.isArray(value) || value.length < minimum) {
      issue(list, path, "required-list", `${path} must contain at least ${minimum} value.`);
      return [];
    }
    const cleaned = value.map((entry, index) =>
      requireString(list, entry, `${path}[${index}]`, settings.entryOptions)
    );
    const usable = cleaned.filter(Boolean);
    if (new Set(usable).size !== usable.length) {
      issue(list, path, "duplicate-value", `${path} must not contain duplicate values.`);
    }
    return cleanStringArray(usable, { preserveOrder: settings.preserveOrder });
  }

  function requireOwnedUniqueStrings(list, value, path, options) {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!own(value, String(index))) {
          issue(
            list,
            `${path}[${index}]`,
            "inherited-value",
            `${path} must contain only own array entries.`
          );
        }
      }
    }
    return requireUniqueStrings(list, value, path, options);
  }

  function validateAdjudicationVocabulary(list, value, path) {
    const authorityClaim =
      /\b(?:official|authoritative|authenticated|identity\s+verified|creator|canon|rights?\s+(?:clear(?:ed|ance)?|approved|granted|verified)|copyright|licensed|authorized|permission|published|speaker\s+verified|causality\s+(?:proved|verified)|certified|approved)\b/i;
    const profanity =
      /\b(?:fuck(?:ing|ed|er|ers)?|shit(?:ty|ting)?|jackass|dick|cock|pussy|cunt|asshole|bitch(?:es)?|goddamn)\b/gi;
    const semanticBleep = (entry) => cleanString(entry)
      .toLocaleLowerCase()
      .replace(/\[\s*bleep\s*\]/gi, "[bleep]")
      .replace(profanity, "[bleep]")
      .replace(/\s+/g, " ")
      .trim();
    if (!isRecord(value)) {
      issue(
        list,
        path,
        "required-object",
        `${path} must bind every canonical adjudication code to fixed display labels.`
      );
      return;
    }
    rejectUnknownKeys(list, value, path, REQUIRED_ADJUDICATION_CODES);
    REQUIRED_ADJUDICATION_CODES.forEach((code) => {
      if (!own(value, code)) {
        issue(
          list,
          `${path}.${code}`,
          "required-object",
          `${path}.${code} must be an own verdict-label map.`
        );
        return;
      }
      const labels = value[code];
      if (!isRecord(labels)) {
        issue(
          list,
          `${path}.${code}`,
          "required-object",
          `${path}.${code} must be a verdict-label map.`
        );
        return;
      }
      rejectUnknownKeys(
        list,
        labels,
        `${path}.${code}`,
        REQUIRED_ADJUDICATION_LABELS
      );
      REQUIRED_ADJUDICATION_LABELS.forEach((mode) => {
        if (!own(labels, mode)) {
          issue(
            list,
            `${path}.${code}.${mode}`,
            "required-string",
            `${path}.${code}.${mode} must be an own non-empty string.`
          );
          return;
        }
        requireString(
          list,
          labels[mode],
          `${path}.${code}.${mode}`,
          { max: 320 }
        );
        const label = cleanString(labels[mode]);
        if (authorityClaim.test(label)) {
          issue(
            list,
            `${path}.${code}.${mode}`,
            "adjudication-authority-claim",
            "Verdict display labels cannot claim official, creator, canon, rights, identity, speaker, causal, publication, or approval authority."
          );
        }
      });
      const formal = cleanString(labels.formal);
      if (
        formal &&
        !new RegExp(`^${code}(?:$|[\\s:/|—-])`, "i").test(formal)
      ) {
        issue(
          list,
          `${path}.${code}.formal`,
          "canonical-code-prefix",
          `The formal label must begin with canonical code ${code}.`
        );
      }
      const comedy = cleanString(labels.comedy);
      const bleep = cleanString(labels.bleep);
      if (
        comedy &&
        bleep &&
        semanticBleep(comedy) !== semanticBleep(bleep)
      ) {
        issue(
          list,
          `${path}.${code}.bleep`,
          "bleep-semantic-mismatch",
          "Reduced-profanity copy may replace profanity with [BLEEP], but it cannot change the verdict meaning."
        );
      }
    });
    REQUIRED_ADJUDICATION_LABELS.forEach((mode) => {
      const labels = REQUIRED_ADJUDICATION_CODES
        .map((code) => (
          isRecord(value[code]) ? cleanString(value[code][mode]).toLocaleLowerCase() : ""
        ))
        .filter(Boolean);
      if (new Set(labels).size !== labels.length) {
        issue(
          list,
          path,
          "duplicate-adjudication-label",
          `Every ${mode} adjudication label must identify one canonical verdict code.`
        );
      }
    });
  }

  function validateSourceDna(dna, adapter) {
    const issues = [];
    if (!isRecord(dna)) {
      issue(issues, "dna", "required-object", "dna must be an object.");
      return issues;
    }
    if (!isRecord(adapter)) {
      issue(issues, "adapter", "required-object", "adapter must be an object.");
      return issues;
    }
    rejectUnknownKeys(issues, adapter, "adapter", [
      "laneInclusion",
      "evidencePolicy",
      "updateContract",
      "storage",
      "surfaceVocabulary",
      "longitudinalVocabulary",
      "adjudicationVocabulary",
      "capabilities"
    ]);

    const channelId = requireString(issues, dna.id, "dna.id", { pattern: ID_PATTERN, max: 64 });
    requireString(issues, dna.version, "dna.version", { pattern: VERSION_PATTERN });
    requireString(issues, dna.label, "dna.label", { max: 100 });
    requireString(issues, dna.channel, "dna.channel", { max: 120 });
    requireString(issues, dna.promise, "dna.promise", { max: 240 });

    if (!isRecord(dna.sourceLanes) || Object.keys(dna.sourceLanes).length === 0) {
      issue(issues, "dna.sourceLanes", "required-map", "dna.sourceLanes must define at least one lane.");
    } else {
      Object.keys(dna.sourceLanes).forEach((laneId) => {
        if (!ID_PATTERN.test(laneId)) {
          issue(issues, `dna.sourceLanes.${laneId}`, "invalid-id", "Source-lane IDs must be lowercase kebab-case.");
        }
        const lane = dna.sourceLanes[laneId];
        if (!isRecord(lane)) {
          issue(issues, `dna.sourceLanes.${laneId}`, "required-object", "Every source lane must be an object.");
          return;
        }
        requireString(issues, lane.label, `dna.sourceLanes.${laneId}.label`, { max: 100 });
        requireString(issues, lane.purpose, `dna.sourceLanes.${laneId}.purpose`, { max: 240 });
        if (!isRecord(adapter.laneInclusion) || !cleanString(adapter.laneInclusion[laneId])) {
          issue(
            issues,
            `adapter.laneInclusion.${laneId}`,
            "missing-inclusion-rule",
            "Every source lane needs an explicit inclusion boundary; the compiler will not infer one."
          );
        }
      });
      if (isRecord(adapter.laneInclusion)) {
        Object.keys(adapter.laneInclusion).forEach((laneId) => {
          if (!own(dna.sourceLanes, laneId)) {
            issue(
              issues,
              `adapter.laneInclusion.${laneId}`,
              "unknown-lane",
              "An inclusion rule cannot target a source lane absent from the channel DNA."
            );
          }
        });
      }
    }

    if (!isRecord(dna.taxonomy)) {
      issue(issues, "dna.taxonomy", "required-object", "dna.taxonomy must be an object.");
    } else {
      const entityTypes = requireUniqueStrings(issues, dna.taxonomy.entityTypes, "dna.taxonomy.entityTypes");
      requireUniqueStrings(issues, dna.taxonomy.receiptTypes, "dna.taxonomy.receiptTypes");
      requireUniqueStrings(issues, dna.taxonomy.relationships, "dna.taxonomy.relationships", {
        entryOptions: { pattern: RELATIONSHIP_PATTERN }
      });
      if (!entityTypes.includes("source")) {
        issue(issues, "dna.taxonomy.entityTypes", "missing-universal-entity", 'The universal "source" entity is required.');
      }
    }

    if (!Array.isArray(dna.entities) || dna.entities.length === 0) {
      issue(issues, "dna.entities", "required-list", "dna.entities must define the pack entity registry.");
    } else {
      const entityIds = [];
      const entityTypes = isRecord(dna.taxonomy) && Array.isArray(dna.taxonomy.entityTypes) ?
        dna.taxonomy.entityTypes :
        [];
      dna.entities.forEach((entity, index) => {
        const path = `dna.entities[${index}]`;
        if (!isRecord(entity)) {
          issue(issues, path, "required-object", "Every registered entity must be an object.");
          return;
        }
        const id = requireString(issues, entity.id, `${path}.id`, {
          pattern: ENTITY_ID_PATTERN,
          max: 120
        });
        const type = requireString(issues, entity.type, `${path}.type`, {
          pattern: ID_PATTERN,
          max: 60
        });
        requireString(issues, entity.label, `${path}.label`, { max: 120 });
        entityIds.push(id);
        if (type && !entityTypes.includes(type)) {
          issue(
            issues,
            `${path}.type`,
            "unknown-entity-type",
            "Registered entity types must exist in dna.taxonomy.entityTypes."
          );
        }
      });
      if (new Set(entityIds.filter(Boolean)).size !== entityIds.filter(Boolean).length) {
        issue(issues, "dna.entities", "duplicate-entity", "Registered entity IDs must be unique.");
      }
    }

    const quality = dna.qualityGates;
    if (!isRecord(quality)) {
      issue(issues, "dna.qualityGates", "required-object", "dna.qualityGates must be an object.");
    } else {
      if (!Number.isInteger(quality.publicExcerptWords) ||
          quality.publicExcerptWords < 1 ||
          quality.publicExcerptWords > 25) {
        issue(
          issues,
          "dna.qualityGates.publicExcerptWords",
          "unsafe-excerpt-limit",
          "Public excerpts must be limited to 1–25 words."
        );
      }
      [
        ["timestampRequired", true],
        ["sourceUrlRequired", true],
        ["noSpeakerGuessing", true],
        ["generatedCharacterAudioAllowed", false]
      ].forEach(([key, safeValue]) => {
        if (quality[key] !== safeValue) {
          issue(
            issues,
            `dna.qualityGates.${key}`,
            "unsafe-evidence-policy",
            `${key} must be ${String(safeValue)} for a conforming public pack.`
          );
        }
      });
    }

    const evidence = adapter.evidencePolicy;
    if (!isRecord(evidence)) {
      issue(issues, "adapter.evidencePolicy", "required-object", "adapter.evidencePolicy must be an object.");
    } else {
      rejectUnknownKeys(issues, evidence, "adapter.evidencePolicy", [
        "machineOutputState",
        "curatedCandidateState",
        "curatedCandidateAuthenticated",
        "editorVerificationRequiresAuthentication",
        "promotionRequiresHumanReview",
        "corrections",
        "preserveContradictions"
      ]);
      if (evidence.machineOutputState !== "quarantine") {
        issue(
          issues,
          "adapter.evidencePolicy.machineOutputState",
          "unsafe-machine-state",
          'Machine output must enter "quarantine".'
        );
      }
      if (evidence.curatedCandidateState !== "timestamp-validated-human-curated-candidate" ||
          evidence.curatedCandidateAuthenticated !== false ||
          evidence.editorVerificationRequiresAuthentication !== true) {
        issue(
          issues,
          "adapter.evidencePolicy",
          "unsafe-curated-candidate-tier",
          "Curated candidates must remain a timestamp-validated, human-curated, non-authenticated tier below editor verification."
        );
      }
      if (evidence.promotionRequiresHumanReview !== true) {
        issue(
          issues,
          "adapter.evidencePolicy.promotionRequiresHumanReview",
          "unsafe-promotion",
          "Public promotion must require human review."
        );
      }
      if (evidence.corrections !== "append-only") {
        issue(
          issues,
          "adapter.evidencePolicy.corrections",
          "unsafe-correction-policy",
          'Corrections must be "append-only".'
        );
      }
      if (evidence.preserveContradictions !== true) {
        issue(
          issues,
          "adapter.evidencePolicy.preserveContradictions",
          "unsafe-certification-policy",
          "Creator certification must preserve contradictory evidence."
        );
      }
    }

    const update = adapter.updateContract;
    if (!isRecord(update)) {
      issue(issues, "adapter.updateContract", "required-object", "adapter.updateContract must be an object.");
    } else {
      rejectUnknownKeys(issues, update, "adapter.updateContract", [
        "stages",
        "sourceOfTruth",
        "cadenceClaim",
        "removalPolicy"
      ]);
      const stages = requireUniqueStrings(issues, update.stages, "adapter.updateContract.stages", {
        minimum: 4,
        preserveOrder: true
      });
      if (stages.join("|") !== REQUIRED_UPDATE_STAGES.join("|")) {
        issue(
          issues,
          "adapter.updateContract.stages",
          "unsafe-update-order",
          `Update stages must be ${REQUIRED_UPDATE_STAGES.join(" → ")} in that order.`
        );
      }
      requireString(issues, update.sourceOfTruth, "adapter.updateContract.sourceOfTruth", { max: 180 });
      requireString(issues, update.cadenceClaim, "adapter.updateContract.cadenceClaim", { max: 180 });
      if (update.removalPolicy !== "tombstone") {
        issue(
          issues,
          "adapter.updateContract.removalPolicy",
          "unsafe-removal-policy",
          'Removed sources must leave a "tombstone" instead of silently disappearing.'
        );
      }
    }

    const storage = adapter.storage;
    if (!isRecord(storage)) {
      issue(issues, "adapter.storage", "required-object", "adapter.storage must be an object.");
    } else {
      rejectUnknownKeys(issues, storage, "adapter.storage", [
        "namespace",
        "partitionKeys",
        "exportPrefix"
      ]);
      const namespace = requireString(issues, storage.namespace, "adapter.storage.namespace", {
        pattern: NAMESPACE_PATTERN,
        max: 120
      });
      const match = namespace.match(NAMESPACE_PATTERN);
      if (match && channelId && match[1] !== channelId) {
        issue(
          issues,
          "adapter.storage.namespace",
          "namespace-channel-mismatch",
          "The storage namespace must contain the exact channel ID."
        );
      }
      const partitionKeys = requireUniqueStrings(
        issues,
        storage.partitionKeys,
        "adapter.storage.partitionKeys",
        { minimum: 2, preserveOrder: true }
      );
      if (partitionKeys[0] !== "channelId" || !partitionKeys.includes("sourceId")) {
        issue(
          issues,
          "adapter.storage.partitionKeys",
          "unsafe-partitioning",
          'Storage must be channel-scoped first and include "sourceId".'
        );
      }
      requireString(issues, storage.exportPrefix, "adapter.storage.exportPrefix", {
        pattern: ID_PATTERN,
        max: 80
      });
    }

    if (!isRecord(adapter.surfaceVocabulary)) {
      issue(
        issues,
        "adapter.surfaceVocabulary",
        "required-object",
        "adapter.surfaceVocabulary must be an object."
      );
    } else {
      rejectUnknownKeys(
        issues,
        adapter.surfaceVocabulary,
        "adapter.surfaceVocabulary",
        REQUIRED_VOCABULARY
      );
      REQUIRED_VOCABULARY.forEach((key) => {
        requireString(
          issues,
          adapter.surfaceVocabulary[key],
          `adapter.surfaceVocabulary.${key}`,
          { max: 100 }
        );
      });
      const values = REQUIRED_VOCABULARY
        .map((key) => cleanString(adapter.surfaceVocabulary[key]).toLocaleLowerCase())
        .filter(Boolean);
      if (new Set(values).size !== values.length) {
        issue(
          issues,
          "adapter.surfaceVocabulary",
          "duplicate-vocabulary",
          "Each surface state must have a distinct public label."
        );
      }
    }

    if (!isRecord(adapter.longitudinalVocabulary)) {
      issue(
        issues,
        "adapter.longitudinalVocabulary",
        "required-object",
        "adapter.longitudinalVocabulary must bind every machine-public longitudinal label."
      );
    } else {
      rejectUnknownKeys(
        issues,
        adapter.longitudinalVocabulary,
        "adapter.longitudinalVocabulary",
        REQUIRED_LONGITUDINAL_VOCABULARY
      );
      REQUIRED_LONGITUDINAL_VOCABULARY.forEach((key) => {
        requireString(
          issues,
          adapter.longitudinalVocabulary[key],
          `adapter.longitudinalVocabulary.${key}`,
          { max: 100 }
        );
      });
    }

    if (!own(adapter, "adjudicationVocabulary")) {
      issue(
        issues,
        "adapter.adjudicationVocabulary",
        "inherited-field",
        "adapter.adjudicationVocabulary must be an own ChannelPack field."
      );
    } else {
      validateAdjudicationVocabulary(
        issues,
        adapter.adjudicationVocabulary,
        "adapter.adjudicationVocabulary"
      );
    }

    const proofLabels = isRecord(dna.voice) && dna.voice.proofLabels;
    if (!isRecord(proofLabels)) {
      issue(issues, "dna.voice.proofLabels", "required-object", "dna.voice.proofLabels must be an object.");
    } else {
      REQUIRED_PROOF_LABELS.forEach((key) =>
        requireString(issues, proofLabels[key], `dna.voice.proofLabels.${key}`, { max: 100 })
      );
    }

    if (!own(adapter, "capabilities")) {
      issue(
        issues,
        "adapter.capabilities",
        "inherited-field",
        "adapter.capabilities must be an own ChannelPack field."
      );
    } else {
      requireOwnedUniqueStrings(
        issues,
        adapter.capabilities,
        "adapter.capabilities"
      );
    }
    return issues;
  }

  function normalize(dna, adapter) {
    const proofLabels = isRecord(dna.voice) && isRecord(dna.voice.proofLabels) ?
      cloneStable(dna.voice.proofLabels) :
      {};
    const categorySignals = isRecord(dna.taxonomy) ?
      cleanStringArray(dna.taxonomy.comedySignals) :
      [];
    const characterIds = Array.isArray(dna.characters) ?
      cleanStringArray(dna.characters.map((character) => character && character.id)) :
      [];
    const bitIds = Array.isArray(dna.bitDefinitions) ?
      cleanStringArray(dna.bitDefinitions.map((bit) => bit && bit.id)) :
      [];

    return {
      $schema: SCHEMA,
      schemaVersion: VERSION,
      contractVersion: VERSION,
      identity: {
        id: cleanString(dna.id),
        packVersion: cleanString(dna.version),
        label: cleanString(dna.label),
        channel: cleanString(dna.channel),
        promise: cleanString(dna.promise)
      },
      sourceLanes: Object.keys(dna.sourceLanes)
        .sort((left, right) => left.localeCompare(right))
        .map((id) => ({
          id,
          label: cleanString(dna.sourceLanes[id].label),
          purpose: cleanString(dna.sourceLanes[id].purpose),
          inclusion: cleanString(adapter.laneInclusion[id])
        })),
      taxonomy: {
        entityTypes: cleanStringArray(dna.taxonomy.entityTypes),
        receiptTypes: cleanStringArray(dna.taxonomy.receiptTypes),
        relationships: cleanStringArray(dna.taxonomy.relationships)
      },
      entityRegistry: dna.entities
        .map((entity) => ({
          id: cleanString(entity.id),
          label: cleanString(entity.label),
          type: cleanString(entity.type)
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
      evidencePolicy: {
        publicExcerptWords: dna.qualityGates.publicExcerptWords,
        timestampRequired: true,
        sourceUrlRequired: true,
        noSpeakerGuessing: true,
        generatedCharacterAudioAllowed: false,
        machineOutputState: "quarantine",
        curatedCandidateState: "timestamp-validated-human-curated-candidate",
        curatedCandidateAuthenticated: false,
        editorVerificationRequiresAuthentication: true,
        promotionRequiresHumanReview: true,
        corrections: "append-only",
        preserveContradictions: true
      },
      updateContract: {
        stages: REQUIRED_UPDATE_STAGES.slice(),
        sourceOfTruth: cleanString(adapter.updateContract.sourceOfTruth),
        cadenceClaim: cleanString(adapter.updateContract.cadenceClaim),
        removalPolicy: "tombstone"
      },
      storage: {
        namespace: cleanString(adapter.storage.namespace),
        partitionKeys: cleanStringArray(adapter.storage.partitionKeys, { preserveOrder: true }),
        exportPrefix: cleanString(adapter.storage.exportPrefix)
      },
      surfaceVocabulary: REQUIRED_VOCABULARY.reduce((vocabulary, key) => {
        vocabulary[key] = cleanString(adapter.surfaceVocabulary[key]);
        return vocabulary;
      }, {}),
      longitudinalVocabulary: REQUIRED_LONGITUDINAL_VOCABULARY.reduce((vocabulary, key) => {
        vocabulary[key] = cleanString(adapter.longitudinalVocabulary[key]);
        return vocabulary;
      }, {}),
      adjudicationVocabulary: REQUIRED_ADJUDICATION_CODES.reduce((vocabulary, code) => {
        vocabulary[code] = REQUIRED_ADJUDICATION_LABELS.reduce((labels, mode) => {
          labels[mode] = cleanString(adapter.adjudicationVocabulary[code][mode]);
          return labels;
        }, {});
        return vocabulary;
      }, {}),
      capabilities: cleanStringArray(adapter.capabilities),
      channelExtensions: {
        categorySignals,
        characterIds,
        bitIds,
        proofLabels
      }
    };
  }

  function payloadWithoutFingerprint(pack) {
    const payload = cloneStable(pack);
    delete payload.fingerprint;
    return payload;
  }

  function validateArtifact(pack) {
    const issues = [];
    if (!isRecord(pack)) {
      issue(issues, "pack", "required-object", "ChannelPack must be an object.");
      return { valid: false, issues, fingerprintVerified: false };
    }
    pack = snapshotOwnDataTree(pack, "pack", issues, 0);
    if (issues.length || !isRecord(pack)) {
      return { valid: false, issues, fingerprintVerified: false };
    }
    rejectUnknownKeys(issues, pack, "", [
      "$schema",
      "schemaVersion",
      "contractVersion",
      "fingerprint",
      "identity",
      "sourceLanes",
      "taxonomy",
      "entityRegistry",
      "evidencePolicy",
      "updateContract",
      "storage",
      "surfaceVocabulary",
      "longitudinalVocabulary",
      "adjudicationVocabulary",
      "capabilities",
      "channelExtensions"
    ]);
    if (pack.$schema !== SCHEMA) {
      issue(issues, "$schema", "wrong-schema", `ChannelPack must target ${SCHEMA}.`);
    }
    if (pack.schemaVersion !== VERSION || pack.contractVersion !== VERSION) {
      issue(issues, "schemaVersion", "unsupported-version", `Only ChannelPack ${VERSION} is supported.`);
    }
    const id = isRecord(pack.identity) ?
      requireString(issues, pack.identity.id, "identity.id", { pattern: ID_PATTERN }) :
      "";
    if (!isRecord(pack.identity)) {
      issue(issues, "identity", "required-object", "identity must be an object.");
    } else {
      rejectUnknownKeys(issues, pack.identity, "identity", [
        "id",
        "packVersion",
        "label",
        "channel",
        "promise"
      ]);
      requireString(issues, pack.identity.packVersion, "identity.packVersion", { pattern: VERSION_PATTERN });
      requireString(issues, pack.identity.label, "identity.label");
      requireString(issues, pack.identity.channel, "identity.channel");
      requireString(issues, pack.identity.promise, "identity.promise");
    }
    if (!Array.isArray(pack.sourceLanes) || pack.sourceLanes.length === 0) {
      issue(issues, "sourceLanes", "required-list", "At least one compiled source lane is required.");
    } else {
      const laneIds = [];
      pack.sourceLanes.forEach((lane, index) => {
        if (!isRecord(lane)) {
          issue(issues, `sourceLanes[${index}]`, "required-object", "Each source lane must be an object.");
          return;
        }
        rejectUnknownKeys(issues, lane, `sourceLanes[${index}]`, [
          "id",
          "label",
          "purpose",
          "inclusion"
        ]);
        laneIds.push(requireString(issues, lane.id, `sourceLanes[${index}].id`, { pattern: ID_PATTERN }));
        requireString(issues, lane.label, `sourceLanes[${index}].label`);
        requireString(issues, lane.purpose, `sourceLanes[${index}].purpose`);
        requireString(issues, lane.inclusion, `sourceLanes[${index}].inclusion`);
      });
      if (new Set(laneIds.filter(Boolean)).size !== laneIds.filter(Boolean).length) {
        issue(issues, "sourceLanes", "duplicate-lane", "Compiled source-lane IDs must be unique.");
      }
    }
    if (!isRecord(pack.taxonomy)) {
      issue(issues, "taxonomy", "required-object", "taxonomy must be an object.");
    } else {
      rejectUnknownKeys(issues, pack.taxonomy, "taxonomy", [
        "entityTypes",
        "receiptTypes",
        "relationships"
      ]);
      const entities = requireUniqueStrings(issues, pack.taxonomy.entityTypes, "taxonomy.entityTypes");
      requireUniqueStrings(issues, pack.taxonomy.receiptTypes, "taxonomy.receiptTypes");
      requireUniqueStrings(issues, pack.taxonomy.relationships, "taxonomy.relationships", {
        entryOptions: { pattern: RELATIONSHIP_PATTERN }
      });
      if (!entities.includes("source")) {
        issue(issues, "taxonomy.entityTypes", "missing-universal-entity", 'The universal "source" entity is required.');
      }
    }
    if (!Array.isArray(pack.entityRegistry) || pack.entityRegistry.length === 0) {
      issue(issues, "entityRegistry", "required-list", "The compiled entity registry is required.");
    } else {
      const entityIds = [];
      const entityTypes = isRecord(pack.taxonomy) && Array.isArray(pack.taxonomy.entityTypes) ?
        pack.taxonomy.entityTypes :
        [];
      pack.entityRegistry.forEach((entity, index) => {
        const path = `entityRegistry[${index}]`;
        if (!isRecord(entity)) {
          issue(issues, path, "required-object", "Each compiled entity must be an object.");
          return;
        }
        rejectUnknownKeys(issues, entity, path, ["id", "label", "type"]);
        const entityId = requireString(issues, entity.id, `${path}.id`, {
          pattern: ENTITY_ID_PATTERN,
          max: 120
        });
        const entityType = requireString(issues, entity.type, `${path}.type`, {
          pattern: ID_PATTERN,
          max: 60
        });
        requireString(issues, entity.label, `${path}.label`, { max: 120 });
        entityIds.push(entityId);
        if (entityType && !entityTypes.includes(entityType)) {
          issue(
            issues,
            `${path}.type`,
            "unknown-entity-type",
            "Compiled entity types must exist in the pack taxonomy."
          );
        }
      });
      if (new Set(entityIds.filter(Boolean)).size !== entityIds.filter(Boolean).length) {
        issue(issues, "entityRegistry", "duplicate-entity", "Compiled entity IDs must be unique.");
      }
    }
    const evidence = pack.evidencePolicy;
    if (isRecord(evidence)) {
      rejectUnknownKeys(issues, evidence, "evidencePolicy", [
        "publicExcerptWords",
        "timestampRequired",
        "sourceUrlRequired",
        "noSpeakerGuessing",
        "generatedCharacterAudioAllowed",
        "machineOutputState",
        "curatedCandidateState",
        "curatedCandidateAuthenticated",
        "editorVerificationRequiresAuthentication",
        "promotionRequiresHumanReview",
        "corrections",
        "preserveContradictions"
      ]);
    }
    if (!isRecord(evidence) ||
        !Number.isInteger(evidence.publicExcerptWords) ||
        evidence.publicExcerptWords < 1 ||
        evidence.publicExcerptWords > 25 ||
        evidence.timestampRequired !== true ||
        evidence.sourceUrlRequired !== true ||
        evidence.noSpeakerGuessing !== true ||
        evidence.generatedCharacterAudioAllowed !== false ||
        evidence.machineOutputState !== "quarantine" ||
        evidence.curatedCandidateState !== "timestamp-validated-human-curated-candidate" ||
        evidence.curatedCandidateAuthenticated !== false ||
        evidence.editorVerificationRequiresAuthentication !== true ||
        evidence.promotionRequiresHumanReview !== true ||
        evidence.corrections !== "append-only" ||
        evidence.preserveContradictions !== true) {
      issue(
        issues,
        "evidencePolicy",
        "unsafe-evidence-policy",
        "The compiled evidence policy must preserve every public safety invariant."
      );
    }
    const update = pack.updateContract;
    if (isRecord(update)) {
      rejectUnknownKeys(issues, update, "updateContract", [
        "stages",
        "sourceOfTruth",
        "cadenceClaim",
        "removalPolicy"
      ]);
    }
    if (!isRecord(update) ||
        !Array.isArray(update.stages) ||
        update.stages.join("|") !== REQUIRED_UPDATE_STAGES.join("|") ||
        update.removalPolicy !== "tombstone" ||
        !cleanString(update.sourceOfTruth) ||
        !cleanString(update.cadenceClaim)) {
      issue(
        issues,
        "updateContract",
        "unsafe-update-contract",
        "The compiled update contract must be explicit, ordered, and tombstone removals."
      );
    }
    if (!isRecord(pack.storage)) {
      issue(issues, "storage", "required-object", "storage must be an object.");
    } else {
      rejectUnknownKeys(issues, pack.storage, "storage", [
        "namespace",
        "partitionKeys",
        "exportPrefix"
      ]);
      const namespace = requireString(issues, pack.storage.namespace, "storage.namespace", {
        pattern: NAMESPACE_PATTERN
      });
      const match = namespace.match(NAMESPACE_PATTERN);
      if (match && id && match[1] !== id) {
        issue(issues, "storage.namespace", "namespace-channel-mismatch", "Storage namespace and channel ID differ.");
      }
      const partitions = requireUniqueStrings(issues, pack.storage.partitionKeys, "storage.partitionKeys", {
        minimum: 2,
        preserveOrder: true
      });
      if (partitions[0] !== "channelId" || !partitions.includes("sourceId")) {
        issue(issues, "storage.partitionKeys", "unsafe-partitioning", "Storage is not safely channel-scoped.");
      }
      requireString(issues, pack.storage.exportPrefix, "storage.exportPrefix", { pattern: ID_PATTERN });
    }
    if (!isRecord(pack.surfaceVocabulary)) {
      issue(issues, "surfaceVocabulary", "required-object", "surfaceVocabulary must be an object.");
    } else {
      rejectUnknownKeys(
        issues,
        pack.surfaceVocabulary,
        "surfaceVocabulary",
        REQUIRED_VOCABULARY
      );
      REQUIRED_VOCABULARY.forEach((key) =>
        requireString(issues, pack.surfaceVocabulary[key], `surfaceVocabulary.${key}`)
      );
      const vocabularyValues = REQUIRED_VOCABULARY
        .map((key) => cleanString(pack.surfaceVocabulary[key]).toLocaleLowerCase())
        .filter(Boolean);
      if (new Set(vocabularyValues).size !== vocabularyValues.length) {
        issue(
          issues,
          "surfaceVocabulary",
          "duplicate-vocabulary",
          "Each surface state must have a distinct public label."
        );
      }
    }
    if (!isRecord(pack.longitudinalVocabulary)) {
      issue(
        issues,
        "longitudinalVocabulary",
        "required-object",
        "The compiled longitudinal display vocabulary is required."
      );
    } else {
      rejectUnknownKeys(
        issues,
        pack.longitudinalVocabulary,
        "longitudinalVocabulary",
        REQUIRED_LONGITUDINAL_VOCABULARY
      );
      REQUIRED_LONGITUDINAL_VOCABULARY.forEach((key) =>
        requireString(
          issues,
          pack.longitudinalVocabulary[key],
          `longitudinalVocabulary.${key}`,
          { max: 100 }
        )
      );
    }
    if (!own(pack, "adjudicationVocabulary")) {
      issue(
        issues,
        "adjudicationVocabulary",
        "inherited-field",
        "adjudicationVocabulary must be an own ChannelPack field."
      );
    } else {
      validateAdjudicationVocabulary(
        issues,
        pack.adjudicationVocabulary,
        "adjudicationVocabulary"
      );
    }
    if (!own(pack, "capabilities")) {
      issue(
        issues,
        "capabilities",
        "inherited-field",
        "capabilities must be an own ChannelPack field."
      );
    } else {
      requireOwnedUniqueStrings(issues, pack.capabilities, "capabilities");
    }
    if (!isRecord(pack.channelExtensions)) {
      issue(issues, "channelExtensions", "required-object", "channelExtensions must be an object.");
    } else {
      rejectUnknownKeys(issues, pack.channelExtensions, "channelExtensions", [
        "categorySignals",
        "characterIds",
        "bitIds",
        "proofLabels"
      ]);
      requireUniqueStrings(
        issues,
        pack.channelExtensions.categorySignals,
        "channelExtensions.categorySignals",
        { minimum: 0 }
      );
      requireUniqueStrings(
        issues,
        pack.channelExtensions.characterIds,
        "channelExtensions.characterIds",
        { minimum: 0 }
      );
      requireUniqueStrings(
        issues,
        pack.channelExtensions.bitIds,
        "channelExtensions.bitIds",
        { minimum: 0 }
      );
      if (!isRecord(pack.channelExtensions.proofLabels)) {
        issue(
          issues,
          "channelExtensions.proofLabels",
          "required-object",
          "channelExtensions.proofLabels must be an object."
        );
      } else {
        REQUIRED_PROOF_LABELS.forEach((key) =>
          requireString(
            issues,
            pack.channelExtensions.proofLabels[key],
            `channelExtensions.proofLabels.${key}`,
            { max: 100 }
          )
        );
      }
    }

    const expected = fingerprintPayload(payloadWithoutFingerprint(pack));
    const fingerprintVerified = pack.fingerprint === expected;
    if (!fingerprintVerified) {
      issue(
        issues,
        "fingerprint",
        "fingerprint-mismatch",
        "The pack fingerprint does not match its canonical payload."
      );
    }
    return {
      valid: issues.length === 0,
      issues,
      fingerprintVerified
    };
  }

  function compile(dna, adapter) {
    const issues = validateSourceDna(dna, adapter);
    if (issues.length) throw new ChannelPackValidationError(issues);
    const payload = normalize(dna, adapter);
    const pack = {
      ...payload,
      fingerprint: fingerprintPayload(payload)
    };
    const report = validateArtifact(pack);
    if (!report.valid) throw new ChannelPackValidationError(report.issues);
    return deepFreeze(pack);
  }

  function serialize(pack) {
    const report = validateArtifact(pack);
    if (!report.valid) throw new ChannelPackValidationError(report.issues);
    const issues = [];
    const snapshot = snapshotOwnDataTree(pack, "pack", issues, 0);
    if (issues.length) throw new ChannelPackValidationError(issues);
    return `${stableStringify(snapshot)}\n`;
  }

  function validatePortfolio(packs) {
    const issues = [];
    if (!Array.isArray(packs) || packs.length === 0) {
      issue(issues, "packs", "required-list", "A ChannelPack portfolio must contain at least one pack.");
      return { valid: false, issues };
    }
    const identities = new Map();
    const namespaces = new Map();
    packs.forEach((pack, index) => {
      const snapshotIssues = [];
      const snapshot = snapshotOwnDataTree(
        pack,
        `packs[${index}]`,
        snapshotIssues,
        0
      );
      snapshotIssues.forEach((entry) => {
        issue(issues, entry.path, entry.code, entry.message);
      });
      const report = snapshotIssues.length ?
        { valid: false, issues: [] } :
        validateArtifact(snapshot);
      report.issues.forEach((entry) => {
        issue(issues, `packs[${index}].${entry.path}`, entry.code, entry.message);
      });
      if (!isRecord(snapshot)) return;
      const id = isRecord(snapshot.identity) ? snapshot.identity.id : "";
      const namespace = isRecord(snapshot.storage) ? snapshot.storage.namespace : "";
      if (id && identities.has(id)) {
        issue(
          issues,
          `packs[${index}].identity.id`,
          "duplicate-channel",
          `Channel ID collides with packs[${identities.get(id)}].`
        );
      } else if (id) {
        identities.set(id, index);
      }
      if (namespace && namespaces.has(namespace)) {
        issue(
          issues,
          `packs[${index}].storage.namespace`,
          "namespace-collision",
          `Storage namespace collides with packs[${namespaces.get(namespace)}].`
        );
      } else if (namespace) {
        namespaces.set(namespace, index);
      }
    });
    return {
      valid: issues.length === 0,
      issues,
      packCount: packs.length,
      channelIds: [...identities.keys()].sort((left, right) => left.localeCompare(right))
    };
  }

  const api = Object.freeze({
    VERSION,
    SCHEMA,
    REQUIRED_VOCABULARY,
    REQUIRED_LONGITUDINAL_VOCABULARY,
    REQUIRED_ADJUDICATION_CODES,
    REQUIRED_ADJUDICATION_LABELS,
    REQUIRED_UPDATE_STAGES,
    ChannelPackValidationError,
    compile,
    serialize,
    validate: validateArtifact,
    validatePortfolio
  });
  Object.defineProperty(root, "ShokkerChannelPack", {
    value: api,
    enumerable: true,
    writable: false,
    configurable: false
  });
})(typeof window !== "undefined" ? window : globalThis);
