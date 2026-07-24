(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var TRAIL_SCHEMA = "shokker-play-answer/trail/v1";
  var SHARE_SCHEMA = "shokker-play-answer/share/v1";
  var REVIEW_WINDOW_SECONDS = 30;
  var SOURCE_ID = /^[A-Za-z0-9_-]{6,64}$/;
  var FINGERPRINT = /^fnv1a32:[0-9a-f]{8}$/;
  var DANGEROUS_KEYS = Object.create(null);
  DANGEROUS_KEYS.__proto__ = true;
  DANGEROUS_KEYS.constructor = true;
  DANGEROUS_KEYS.prototype = true;
  var ALLOWED_ROLES = Object.create(null);
  [
    "PRIMARY RECEIPT",
    "SUPPORTING RECEIPT",
    "COUNTERPOINT",
    "RUNNER-UP",
    "EARLIEST INDEXED RECEIPT",
    "LATEST INDEXED RECEIPT",
    "LATER INDEXED RECEIPT",
    "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET",
    "LATER CURATED PERFORMANCE RECEIPT IN CURRENT SET",
    "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL",
    "LATER MACHINE-INDEXED CHARACTER SIGNAL",
    "POSITIVE-LANGUAGE RECEIPT",
    "CRITICAL-LANGUAGE RECEIPT"
  ].forEach(function (role) {
    ALLOWED_ROLES[role] = true;
  });
  var ALLOWED_STATUSES = Object.create(null);
  ["supported", "archive-boundary"].forEach(function (status) {
    ALLOWED_STATUSES[status] = true;
  });
  var EVIDENCE_CONTRACTS = Object.create(null);
  [
    ["TIMESTAMPED CAPTION RECEIPT", "caption-excerpt", "moment"],
    ["TIMESTAMPED CAPTION RECEIPT", "caption-topic-receipt", "topic"],
    ["TIMESTAMPED CAPTION RECEIPT", "caption-character-signal", "character"],
    [
      "TIMESTAMPED CURATED PERFORMANCE RECEIPT",
      "curated-character-performance",
      "character-performance"
    ],
    [
      "TIMESTAMPED MACHINE-CANDIDATE RECEIPT",
      "caption-excerpt",
      "moment"
    ]
  ].forEach(function (contract) {
    EVIDENCE_CONTRACTS[contract[0] + "\u0000" + contract[1]] = contract[2];
  });
  var FALSE_CLAIMS = freezeDeep({
    continuity: false,
    causality: false,
    opinion: false,
    origin: false,
    rights: false,
    canon: false
  });
  var POLICY = freezeDeep({
    minimumStops: 2,
    maximumStops: 6,
    reviewWindowSeconds: REVIEW_WINDOW_SECONDS,
    sourceRegistryRequired: true,
    copiedMedia: false,
    speakerAttribution: false,
    continuityClaim: false,
    causalityClaim: false,
    settledOpinionClaim: false,
    trueOriginClaim: false,
    rightsClearance: false,
    canonPromotion: false,
    sharePayload: "query, bindings, exact ordered source coordinates, and fingerprints only"
  });

  function failure(code, message) {
    var error = new Error(message);
    error.name = "PlayAnswerError";
    Object.defineProperty(error, "code", {
      value: code,
      enumerable: true,
      writable: false,
      configurable: false
    });
    throw error;
  }

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) {
      freezeDeep(value[key]);
    });
    return Object.freeze(value);
  }

  function recordDescriptors(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      failure("UNSAFE_SHAPE", label + " must be a plain data record.");
    }
    var prototype;
    var descriptors;
    var keys;
    try {
      prototype = Object.getPrototypeOf(value);
      if (prototype !== null && Object.getPrototypeOf(prototype) !== null) {
        failure("UNSAFE_PROTOTYPE", label + " has a custom prototype.");
      }
      keys = Reflect.ownKeys(value);
      descriptors = Object.getOwnPropertyDescriptors(value);
    } catch (error) {
      if (error && error.code) throw error;
      failure("UNSAFE_SHAPE", label + " could not be inspected safely.");
    }
    keys.forEach(function (key) {
      if (typeof key !== "string") {
        failure("UNSAFE_DESCRIPTOR", label + " may not contain symbol fields.");
      }
      if (DANGEROUS_KEYS[key]) {
        failure("UNSAFE_KEY", label + " contains a prototype-sensitive field.");
      }
      var descriptor = descriptors[key];
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, "value") ||
          descriptor.enumerable !== true) {
        failure("UNSAFE_DESCRIPTOR", label + "." + key + " must be enumerable data.");
      }
    });
    return descriptors;
  }

  function arrayItems(value, label, minimum, maximum) {
    if (!Array.isArray(value)) {
      failure("UNSAFE_SHAPE", label + " must be a data array.");
    }
    var descriptors;
    var keys;
    try {
      descriptors = Object.getOwnPropertyDescriptors(value);
      keys = Reflect.ownKeys(value);
    } catch {
      failure("UNSAFE_SHAPE", label + " could not be inspected safely.");
    }
    var lengthDescriptor = descriptors.length;
    if (!lengthDescriptor || !Object.prototype.hasOwnProperty.call(lengthDescriptor, "value")) {
      failure("UNSAFE_DESCRIPTOR", label + " has no safe length.");
    }
    var length = lengthDescriptor.value;
    if (!Number.isInteger(length) || length < minimum || length > maximum) {
      failure("INVALID_COUNT", label + " must contain " + minimum + " to " + maximum + " items.");
    }
    keys.forEach(function (key) {
      if (key === "length") return;
      if (typeof key !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(key) ||
          Number(key) >= length) {
        failure("UNSAFE_DESCRIPTOR", label + " contains a non-index field.");
      }
      var descriptor = descriptors[key];
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, "value") ||
          descriptor.enumerable !== true) {
        failure("UNSAFE_DESCRIPTOR", label + "[" + key + "] must be enumerable data.");
      }
    });
    var output = [];
    for (var index = 0; index < length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(descriptors, String(index))) {
        failure("UNSAFE_DESCRIPTOR", label + " may not contain holes.");
      }
      output.push(descriptors[String(index)].value);
    }
    return output;
  }

  function ownValue(descriptors, key, label, required) {
    if (!Object.prototype.hasOwnProperty.call(descriptors, key)) {
      if (required) failure("MISSING_FIELD", label + "." + key + " is required.");
      return undefined;
    }
    return descriptors[key].value;
  }

  function exactKeys(descriptors, allowed, label) {
    Object.keys(descriptors).forEach(function (key) {
      if (allowed.indexOf(key) < 0) {
        failure("UNEXPECTED_FIELD", label + "." + key + " is not allowed.");
      }
    });
  }

  function cleanString(value, label, maximum, minimum) {
    var floor = minimum == null ? 1 : minimum;
    if (typeof value !== "string" || value.length < floor || value.length > maximum ||
        value !== value.trim() ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
      failure("INVALID_TEXT", label + " is not bounded safe text.");
    }
    return value;
  }

  function cleanQuery(value) {
    if (typeof value !== "string") failure("INVALID_QUERY", "A text query is required.");
    var query = value.replace(/\s+/g, " ").trim();
    if (query.length < 2 || query.length > 240 ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(query)) {
      failure("INVALID_QUERY", "The query must contain 2 to 240 safe characters.");
    }
    return query;
  }

  function canonical(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) {
      return "[" + value.map(canonical).join(",") + "]";
    }
    return "{" + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ":" + canonical(value[key]);
    }).join(",") + "}";
  }

  function fingerprint(value) {
    var input = typeof value === "string" ? value : canonical(value);
    var hash = 0x811c9dc5;
    for (var index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return "fnv1a32:" + (hash >>> 0).toString(16).padStart(8, "0");
  }

  function normalizedBindings(value) {
    var descriptors = recordDescriptors(value, "bindings");
    exactKeys(descriptors, [
      "channelId",
      "channelPackFingerprint",
      "archiveAsOf",
      "answerEngineVersion"
    ], "bindings");
    [
      "channelId",
      "channelPackFingerprint",
      "archiveAsOf",
      "answerEngineVersion"
    ].forEach(function (key) {
      ownValue(descriptors, key, "bindings", true);
    });
    var output = Object.create(null);
    output.channelId = cleanString(
      descriptors.channelId.value,
      "bindings.channelId",
      64,
      2
    );
    if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(output.channelId)) {
      failure("INVALID_BINDINGS", "bindings.channelId must be a safe channel slug.");
    }
    output.channelPackFingerprint = cleanString(
      descriptors.channelPackFingerprint.value,
      "bindings.channelPackFingerprint",
      20
    );
    if (!/^cp1-[0-9a-f]{16}$/.test(output.channelPackFingerprint)) {
      failure("INVALID_BINDINGS", "bindings.channelPackFingerprint is malformed.");
    }
    output.archiveAsOf = cleanString(
      descriptors.archiveAsOf.value,
      "bindings.archiveAsOf",
      10
    );
    var parsedDate = new Date(output.archiveAsOf + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(output.archiveAsOf) ||
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== output.archiveAsOf) {
      failure("INVALID_BINDINGS", "bindings.archiveAsOf must be a real YYYY-MM-DD date.");
    }
    output.answerEngineVersion = cleanString(
      descriptors.answerEngineVersion.value,
      "bindings.answerEngineVersion",
      64
    );
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(output.answerEngineVersion)) {
      failure("INVALID_BINDINGS", "bindings.answerEngineVersion is malformed.");
    }
    return freezeDeep(output);
  }

  function normalizedRegistry(value) {
    var rows = arrayItems(value, "sources", 1, 5000).map(function (row, index) {
      var label = "sources[" + index + "]";
      var descriptors = recordDescriptors(row, label);
      exactKeys(descriptors, ["sourceId", "durationSeconds", "playable"], label);
      var sourceId = ownValue(descriptors, "sourceId", label, true);
      var durationSeconds = ownValue(descriptors, "durationSeconds", label, true);
      var playable = ownValue(descriptors, "playable", label, false);
      if (typeof sourceId !== "string" || !SOURCE_ID.test(sourceId)) {
        failure("INVALID_SOURCE", label + " has an invalid sourceId.");
      }
      if (typeof durationSeconds !== "number" || !Number.isInteger(durationSeconds) ||
          durationSeconds <= 0 || durationSeconds > 10000000) {
        failure("INVALID_SOURCE", label + " has an invalid duration.");
      }
      if (playable !== true) {
        failure("UNPLAYABLE_SOURCE", label + " is not in the playable registry.");
      }
      return {
        sourceId: sourceId,
        durationSeconds: durationSeconds
      };
    }).sort(function (left, right) {
      return left.sourceId.localeCompare(right.sourceId);
    });
    var seen = Object.create(null);
    rows.forEach(function (row) {
      if (seen[row.sourceId]) failure("DUPLICATE_SOURCE", "The source registry contains a duplicate ID.");
      seen[row.sourceId] = true;
    });
    var registry = Object.create(null);
    rows.forEach(function (row) {
      registry[row.sourceId] = row.durationSeconds;
    });
    return {
      rows: freezeDeep(rows),
      byId: freezeDeep(registry),
      fingerprint: fingerprint(rows)
    };
  }

  function stringList(value, label, maximumItems, maximumLength) {
    if (value === undefined) return freezeDeep([]);
    return freezeDeep(arrayItems(value, label, 0, maximumItems).map(function (item, index) {
      return cleanString(item, label + "[" + index + "]", maximumLength);
    }));
  }

  function unsafeAuthority(descriptors, label) {
    var speaker = ownValue(descriptors, "speaker", label, false);
    if (speaker !== undefined && speaker !== null) {
      failure("AUTHORITY_CLAIM", label + " contains a speaker attribution.");
    }
    [
      "speakerCertification",
      "speakerVerified",
      "continuityEstablished",
      "causalityEstablished",
      "opinionEstablished",
      "trueOriginClaim",
      "originInferred",
      "rightsCleared",
      "rightsClearance",
      "canonApproved",
      "creatorCertified",
      "authenticatedEditorVerified",
      "visualContextVerified",
      "performanceEstablished"
    ].forEach(function (key) {
      if (ownValue(descriptors, key, label, false) === true) {
        failure("AUTHORITY_CLAIM", label + " contains an authority claim.");
      }
    });
    [
      "speakerStatus",
      "originStatus",
      "rightsStatus",
      "canonStatus"
    ].forEach(function (key) {
      var value = ownValue(descriptors, key, label, false);
      if (typeof value === "string" &&
          /\b(?:verified|certified|authenticated|cleared|licensed|approved|true-origin)\b/i.test(value) &&
          !/\b(?:unverified|not-verified|not-authenticated|not-cleared)\b/i.test(value)) {
        failure("AUTHORITY_CLAIM", label + "." + key + " exceeds the playback trail's authority.");
      }
    });
  }

  function validateStatus(status) {
    status = cleanString(status, "analysis.status", 80);
    if (!Object.prototype.hasOwnProperty.call(ALLOWED_STATUSES, status)) {
      failure("NONPLAYABLE_ANALYSIS", "Only a supported or archive-boundary answer can become a playback trail.");
    }
    return status;
  }

  function create(config) {
    var configDescriptors = recordDescriptors(config, "config");
    exactKeys(configDescriptors, ["analyze", "bindings", "sources"], "config");
    var analyze = ownValue(configDescriptors, "analyze", "config", true);
    if (typeof analyze !== "function") {
      failure("INVALID_ANALYZER", "config.analyze must synchronously rebuild an Ask analysis.");
    }
    var bindings = normalizedBindings(
      ownValue(configDescriptors, "bindings", "config", true)
    );
    var registry = normalizedRegistry(
      ownValue(configDescriptors, "sources", "config", true)
    );

    function compile(query, analysis) {
      var analysisDescriptors = recordDescriptors(analysis, "analysis");
      var analysisQuery = cleanQuery(
        ownValue(analysisDescriptors, "query", "analysis", true)
      );
      if (analysisQuery !== query) {
        failure("QUERY_MISMATCH", "The rebuilt analysis does not match the requested query.");
      }
      var status = validateStatus(
        ownValue(analysisDescriptors, "status", "analysis", true)
      );
      if (ownValue(analysisDescriptors, "continuedFrom", "analysis", true) !== false) {
        failure("CONTEXT_DEPENDENT", "A context-dependent follow-up cannot become a portable playback trail.");
      }
      var chain = arrayItems(
        ownValue(analysisDescriptors, "evidenceChain", "analysis", true),
        "analysis.evidenceChain",
        POLICY.minimumStops,
        POLICY.maximumStops
      );
      var limitations = stringList(
        ownValue(analysisDescriptors, "limitations", "analysis", false),
        "analysis.limitations",
        20,
        500
      );
      var keys = Object.create(null);
      var coordinates = Object.create(null);
      var stops = chain.map(function (entry, index) {
        var entryLabel = "analysis.evidenceChain[" + index + "]";
        var entryDescriptors = recordDescriptors(entry, entryLabel);
        var role = cleanString(
          ownValue(entryDescriptors, "role", entryLabel, true),
          entryLabel + ".role",
          160
        );
        if (!Object.prototype.hasOwnProperty.call(ALLOWED_ROLES, role)) {
          failure("UNSAFE_ROLE", entryLabel + ".role is not an engine-owned structural role.");
        }
        var result = ownValue(entryDescriptors, "result", entryLabel, true);
        var resultLabel = entryLabel + ".result";
        var resultDescriptors = recordDescriptors(result, resultLabel);
        if (!Object.prototype.hasOwnProperty.call(resultDescriptors, "speaker") ||
            resultDescriptors.speaker.value !== null) {
          failure("AUTHORITY_CLAIM", resultLabel + " must carry explicit speaker:null.");
        }
        if (ownValue(resultDescriptors, "speakerStatus", resultLabel, true) !== "not-diarized") {
          failure("AUTHORITY_CLAIM", resultLabel + " must remain explicitly not-diarized.");
        }
        unsafeAuthority(resultDescriptors, resultLabel);
        var key = cleanString(
          ownValue(resultDescriptors, "key", resultLabel, true),
          resultLabel + ".key",
          180
        );
        var sourceId = ownValue(resultDescriptors, "sourceId", resultLabel, true);
        var at = ownValue(resultDescriptors, "at", resultLabel, true);
        var evidenceLevel = cleanString(
          ownValue(resultDescriptors, "evidenceLevel", resultLabel, true),
          resultLabel + ".evidenceLevel",
          160
        );
        var evidenceType = cleanString(
          ownValue(resultDescriptors, "evidenceType", resultLabel, true),
          resultLabel + ".evidenceType",
          120
        );
        var restrictedToTopicNavigation = ownValue(
          resultDescriptors,
          "restrictedToTopicNavigation",
          resultLabel,
          false
        );
        var rightsMode = ownValue(resultDescriptors, "rightsMode", resultLabel, false);
        var reviewStatus = ownValue(resultDescriptors, "reviewStatus", resultLabel, false);
        var kind = ownValue(resultDescriptors, "kind", resultLabel, false);
        var promotionAllowed = ownValue(
          resultDescriptors,
          "promotionAllowed",
          resultLabel,
          false
        );
        if (restrictedToTopicNavigation === true) {
          failure("RESTRICTED_SOURCE", resultLabel + " is restricted to topic navigation.");
        }
        if (restrictedToTopicNavigation !== undefined &&
            typeof restrictedToTopicNavigation !== "boolean") {
          failure("INVALID_RECEIPT", resultLabel + " has malformed source restrictions.");
        }
        if (rightsMode === "visual-context-unverified") {
          failure("RESTRICTED_SOURCE", resultLabel + " has unverified visual context.");
        }
        if (rightsMode !== undefined && rightsMode !== null &&
            (typeof rightsMode !== "string" ||
              /\b(?:cleared|licensed|approved)\b/i.test(rightsMode))) {
          failure("AUTHORITY_CLAIM", resultLabel + " has an unsafe rights mode.");
        }
        if (reviewStatus !== undefined && reviewStatus !== null &&
            reviewStatus !== "machine-candidate") {
          failure("INVALID_RECEIPT", resultLabel + " has an unsupported review status.");
        }
        if (reviewStatus === "machine-candidate" &&
            (kind !== "moment" || evidenceType !== "caption-excerpt" ||
              evidenceLevel !== "TIMESTAMPED MACHINE-CANDIDATE RECEIPT" ||
              promotionAllowed !== false || restrictedToTopicNavigation !== false)) {
          failure(
            "UNSAFE_MACHINE_CANDIDATE",
            resultLabel + " is not an explicitly bounded, non-promotable timed moment."
          );
        }
        if (reviewStatus !== "machine-candidate" &&
            evidenceLevel === "TIMESTAMPED MACHINE-CANDIDATE RECEIPT") {
          failure(
            "UNSAFE_MACHINE_CANDIDATE",
            resultLabel + " has machine evidence without explicit machine-candidate safeguards."
          );
        }
        if (reviewStatus !== "machine-candidate" &&
            promotionAllowed !== undefined && promotionAllowed !== false) {
          failure("AUTHORITY_CLAIM", resultLabel + " contains a promotion claim.");
        }
        if (typeof sourceId !== "string" || !SOURCE_ID.test(sourceId)) {
          failure("INVALID_RECEIPT", resultLabel + " has an invalid sourceId.");
        }
        if (!Object.prototype.hasOwnProperty.call(registry.byId, sourceId)) {
          failure("UNKNOWN_SOURCE", resultLabel + " is outside the canonical source registry.");
        }
        if (typeof at !== "number" || !Number.isInteger(at) || at < 0 ||
            at >= registry.byId[sourceId]) {
          failure("OUT_OF_RANGE", resultLabel + " has an out-of-range source coordinate.");
        }
        var end = Math.min(registry.byId[sourceId], at + REVIEW_WINDOW_SECONDS);
        var evidenceContract =
          EVIDENCE_CONTRACTS[evidenceLevel + "\u0000" + evidenceType];
        if (!evidenceContract) {
          failure(
            "NONPLAYABLE_EVIDENCE",
            resultLabel + " is outside the engine-owned timed evidence contract."
          );
        }
        if (kind !== evidenceContract) {
          failure(
            "INVALID_RECEIPT",
            resultLabel + ".kind does not match its timed evidence contract."
          );
        }
        var warningItems = arrayItems(
          ownValue(resultDescriptors, "evidenceWarnings", resultLabel, true),
          resultLabel + ".evidenceWarnings",
          1,
          16
        );
        var warnings = freezeDeep(warningItems.map(function (warning, warningIndex) {
          return cleanString(
            warning,
            resultLabel + ".evidenceWarnings[" + warningIndex + "]",
            500
          );
        }));
        var coordinate = sourceId + "@" + String(at);
        if (keys[key] || coordinates[coordinate]) {
          failure("DUPLICATE_RECEIPT", "The evidence chain contains a duplicate receipt.");
        }
        keys[key] = true;
        coordinates[coordinate] = true;
        return freezeDeep({
          position: index + 1,
          role: role,
          key: key,
          sourceId: sourceId,
          at: at,
          end: end,
          evidenceLevel: evidenceLevel,
          evidenceType: evidenceType,
          warnings: warnings,
          speaker: null
        });
      });
      var base = {
        schema: TRAIL_SCHEMA,
        query: query,
        status: status,
        bindings: bindings,
        sourceRegistryFingerprint: registry.fingerprint,
        count: stops.length,
        stops: freezeDeep(stops),
        limitations: limitations,
        claims: FALSE_CLAIMS,
        mediaCopied: false
      };
      return freezeDeep(Object.assign({}, base, {
        fingerprint: fingerprint(base)
      }));
    }

    function build(queryValue) {
      var query = cleanQuery(queryValue);
      var analysis;
      try {
        analysis = analyze(query);
      } catch (error) {
        if (error && error.code) throw error;
        failure("ANALYSIS_FAILED", "The canonical Ask analyzer could not rebuild this query.");
      }
      return compile(query, analysis);
    }

    function packetFromTrail(trail) {
      var stops = trail.stops.map(function (stop) {
        return freezeDeep({
          key: stop.key,
          role: stop.role,
          sourceId: stop.sourceId,
          at: stop.at,
          end: stop.end
        });
      });
      var base = {
        schema: SHARE_SCHEMA,
        query: trail.query,
        bindings: bindings,
        sourceRegistryFingerprint: registry.fingerprint,
        stops: freezeDeep(stops),
        trailFingerprint: trail.fingerprint
      };
      return freezeDeep(Object.assign({}, base, {
        fingerprint: fingerprint(base)
      }));
    }

    function exportShare(trail) {
      var descriptors = recordDescriptors(trail, "trail");
      var schema = ownValue(descriptors, "schema", "trail", true);
      var query = cleanQuery(ownValue(descriptors, "query", "trail", true));
      var suppliedFingerprint = ownValue(descriptors, "fingerprint", "trail", true);
      if (schema !== TRAIL_SCHEMA || typeof suppliedFingerprint !== "string" ||
          !FINGERPRINT.test(suppliedFingerprint)) {
        failure("INVALID_TRAIL", "Only a canonical playback trail can be shared.");
      }
      var rebuilt = build(query);
      if (rebuilt.fingerprint !== suppliedFingerprint) {
        failure("STALE_TRAIL", "The playback trail no longer matches the canonical Ask answer.");
      }
      return packetFromTrail(rebuilt);
    }

    function createShare(query) {
      return packetFromTrail(build(query));
    }

    function readShare(packet) {
      var descriptors = recordDescriptors(packet, "share");
      exactKeys(descriptors, [
        "schema",
        "query",
        "bindings",
        "sourceRegistryFingerprint",
        "stops",
        "trailFingerprint",
        "fingerprint"
      ], "share");
      if (ownValue(descriptors, "schema", "share", true) !== SHARE_SCHEMA) {
        failure("FOREIGN_SHARE", "The share packet schema is not supported.");
      }
      var query = cleanQuery(ownValue(descriptors, "query", "share", true));
      var packetBindings = normalizedBindings(
        ownValue(descriptors, "bindings", "share", true)
      );
      if (canonical(packetBindings) !== canonical(bindings)) {
        failure("FOREIGN_BINDINGS", "The share packet belongs to different evidence bindings.");
      }
      var registryFingerprint = ownValue(
        descriptors,
        "sourceRegistryFingerprint",
        "share",
        true
      );
      if (registryFingerprint !== registry.fingerprint) {
        failure("STALE_REGISTRY", "The share packet belongs to a different source registry.");
      }
      var packetStops = arrayItems(
        ownValue(descriptors, "stops", "share", true),
        "share.stops",
        POLICY.minimumStops,
        POLICY.maximumStops
      ).map(function (stop, index) {
        var label = "share.stops[" + index + "]";
        var stopDescriptors = recordDescriptors(stop, label);
        exactKeys(stopDescriptors, ["key", "role", "sourceId", "at", "end"], label);
        var key = cleanString(
          ownValue(stopDescriptors, "key", label, true),
          label + ".key",
          180
        );
        var role = cleanString(
          ownValue(stopDescriptors, "role", label, true),
          label + ".role",
          160
        );
        if (!Object.prototype.hasOwnProperty.call(ALLOWED_ROLES, role)) {
          failure("UNSAFE_ROLE", label + ".role is not an engine-owned structural role.");
        }
        var sourceId = ownValue(stopDescriptors, "sourceId", label, true);
        var at = ownValue(stopDescriptors, "at", label, true);
        var end = ownValue(stopDescriptors, "end", label, true);
        if (typeof sourceId !== "string" || !SOURCE_ID.test(sourceId) ||
            !Object.prototype.hasOwnProperty.call(registry.byId, sourceId)) {
          failure("UNKNOWN_SOURCE", label + " is outside the canonical source registry.");
        }
        if (typeof at !== "number" || !Number.isInteger(at) || at < 0 ||
            at >= registry.byId[sourceId]) {
          failure("OUT_OF_RANGE", label + " has an out-of-range source coordinate.");
        }
        if (typeof end !== "number" || !Number.isInteger(end) ||
            end !== Math.min(registry.byId[sourceId], at + REVIEW_WINDOW_SECONDS) ||
            end <= at) {
          failure("INVALID_WINDOW", label + " has a non-canonical review window.");
        }
        return freezeDeep({
          key: key,
          role: role,
          sourceId: sourceId,
          at: at,
          end: end
        });
      });
      var packetKeys = Object.create(null);
      var packetCoordinates = Object.create(null);
      packetStops.forEach(function (stop) {
        var coordinate = stop.sourceId + "@" + String(stop.at);
        if (packetKeys[stop.key] || packetCoordinates[coordinate]) {
          failure("DUPLICATE_RECEIPT", "The share packet contains a duplicate receipt.");
        }
        packetKeys[stop.key] = true;
        packetCoordinates[coordinate] = true;
      });
      var trailFingerprint = ownValue(descriptors, "trailFingerprint", "share", true);
      var suppliedFingerprint = ownValue(descriptors, "fingerprint", "share", true);
      if (typeof trailFingerprint !== "string" || !FINGERPRINT.test(trailFingerprint) ||
          typeof suppliedFingerprint !== "string" || !FINGERPRINT.test(suppliedFingerprint)) {
        failure("INVALID_FINGERPRINT", "The share packet fingerprints are malformed.");
      }
      var base = {
        schema: SHARE_SCHEMA,
        query: query,
        bindings: packetBindings,
        sourceRegistryFingerprint: registryFingerprint,
        stops: packetStops,
        trailFingerprint: trailFingerprint
      };
      if (fingerprint(base) !== suppliedFingerprint) {
        failure("TAMPERED_SHARE", "The share packet fingerprint does not match its payload.");
      }
      return freezeDeep(Object.assign({}, base, {
        fingerprint: suppliedFingerprint
      }));
    }

    function restoreShare(packet) {
      var checked = readShare(packet);
      var rebuilt = build(checked.query);
      if (rebuilt.fingerprint !== checked.trailFingerprint) {
        failure("STALE_TRAIL", "The shared answer no longer matches a fresh canonical Ask rebuild.");
      }
      var exactStops = rebuilt.stops.map(function (stop) {
        return {
          key: stop.key,
          role: stop.role,
          sourceId: stop.sourceId,
          at: stop.at,
          end: stop.end
        };
      });
      if (canonical(exactStops) !== canonical(checked.stops)) {
        failure("TAMPERED_SHARE", "The shared receipt order does not match the canonical Ask chain.");
      }
      return rebuilt;
    }

    return freezeDeep({
      VERSION: VERSION,
      build: build,
      createShare: createShare,
      exportShare: exportShare,
      restoreShare: restoreShare,
      getPolicy: function () { return POLICY; },
      bindings: bindings,
      sourceCount: registry.rows.length,
      sourceRegistryFingerprint: registry.fingerprint
    });
  }

  var api = freezeDeep({
    VERSION: VERSION,
    TRAIL_SCHEMA: TRAIL_SCHEMA,
    SHARE_SCHEMA: SHARE_SCHEMA,
    create: create
  });

  Object.defineProperty(root, "ShokkerPlayAnswer", {
    value: api,
    enumerable: true,
    writable: false,
    configurable: false
  });
})(typeof window !== "undefined" ? window : globalThis);
