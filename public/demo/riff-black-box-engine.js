(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker-youtube-wiki/riff-black-box/v1";
  var EXCERPT_WORD_LIMIT = 16;
  var DEFAULT_CONTEXT_SECONDS = 15;
  var DEFAULT_NEIGHBORHOOD_SECONDS = 900;
  var DIMENSION_DEFINITIONS = Object.freeze([
    Object.freeze({ id: "heat", formulaTerm: "source heat", label: "Source heat" }),
    Object.freeze({ id: "escalation", formulaTerm: "escalation", label: "Escalation" }),
    Object.freeze({
      id: "callbackDensity",
      formulaTerm: "callback density",
      label: "Callback density",
    }),
    Object.freeze({ id: "derailment", formulaTerm: "derailment", label: "Derailment" }),
    Object.freeze({ id: "roomBreak", formulaTerm: "room break", label: "Room break" }),
    Object.freeze({
      id: "topicCollision",
      formulaTerm: "topic collision",
      label: "Topic collision",
    }),
  ]);
  var DEFAULT_LABELS = Object.freeze({
    productName: "Comedy Black Box",
    anchorName: "Promoted riff anchor",
    contextName: "Playback context",
    literalReaction: "LITERAL REACTION CUE",
    unknownReaction: "UNKNOWN",
  });
  var POLICY = Object.freeze({
    promotedLedgerOnly: true,
    scoreRule:
      "Scores and dimensions are reproduced from the promoted chemistry ledger with zero permitted drift.",
    contextRule:
      "Context windows are official playback coordinates only; no surrounding dialogue is reconstructed.",
    neighborRule:
      "Nearest indexed receipts are navigation aids, not evidence of a causal setup or payoff.",
    reactionRule:
      "A reaction cue is shown only when the promoted literal excerpt contains laughter, laughing, or can't breathe; otherwise it is UNKNOWN.",
    speakerRule:
      "No speaker is inferred from a source excerpt.",
    exportRule:
      "Exports contain bounded public excerpts and coordinates only; never transcripts, captions, or event arrays.",
    fingerprintRule:
      "Fingerprints detect deterministic change; they do not authenticate source ownership or editorial review.",
  });

  function clean(value, limit) {
    var output = String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
    return output.slice(0, limit == null ? 500 : limit);
  }

  function cleanList(value, limit) {
    if (!Array.isArray(value)) return [];
    return Array.from(
      new Set(
        value
          .map(function (entry) {
            return clean(entry, limit == null ? 160 : limit);
          })
          .filter(Boolean)
      )
    ).sort();
  }

  function carriesQuarantineSignal(value) {
    if (!value || typeof value !== "object") return false;
    if (
      value.promotionAllowed === false ||
      value.promoted === false ||
      value.quarantined === true ||
      value.quarantine === true
    ) {
      return true;
    }
    return [
      value.type,
      value.lane,
      Array.isArray(value.lanes) ? value.lanes.join(" ") : "",
      value.status,
      value.reviewStatus,
      value.evidenceState,
      value.integrationStatus,
      value.artifactLane,
      value.promotionStatus,
      value.promotionState,
    ].some(function (entry) {
      return /(?:archive[\s-]*deep|quarantin(?:e|ed)|promotion[\s-]*forbidden|non[\s-]*promotable)/i.test(
        clean(entry, 160)
      );
    });
  }

  function number(value, fallback) {
    var output = Number(value);
    return Number.isFinite(output) ? output : fallback == null ? 0 : fallback;
  }

  function isJsonFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function isJsonInteger(value) {
    return isJsonFiniteNumber(value) && Number.isInteger(value);
  }

  function integer(value, fallback) {
    var output = Math.floor(number(value, fallback));
    return Number.isFinite(output) ? output : fallback == null ? 0 : fallback;
  }

  function compareCodePoints(left, right) {
    var a = String(left == null ? "" : left);
    var b = String(right == null ? "" : right);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, number(value, minimum)));
  }

  function serialCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) {
      deepFreeze(value[key]);
    });
    return Object.freeze(value);
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce(function (output, key) {
          output[key] = stableValue(value[key]);
          return output;
        }, Object.create(null));
    }
    return value;
  }

  function stableJson(value) {
    return JSON.stringify(stableValue(value));
  }

  function utf8Bytes(value) {
    return unescape(encodeURIComponent(String(value))).split("").map(function (character) {
      return character.charCodeAt(0);
    });
  }

  function fingerprint(value) {
    var hash = 2166136261;
    utf8Bytes(value).forEach(function (byte) {
      hash ^= byte;
      hash = Math.imul(hash, 16777619);
    });
    return "fnv1a32:" + ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function validSourceId(value) {
    return /^[A-Za-z0-9_-]{11}$/.test(clean(value, 32));
  }

  function formatTime(value) {
    var total = Math.max(0, integer(value));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
      : minutes + ":" + String(seconds).padStart(2, "0");
  }

  function officialUrl(sourceId, seconds) {
    return (
      "https://www.youtube.com/watch?v=" +
      clean(sourceId, 32) +
      "&t=" +
      Math.max(0, integer(seconds)) +
      "s"
    );
  }

  function boundedExcerpt(value) {
    var source = clean(value, 4000);
    var sourceWords = source.split(/\s+/).filter(Boolean);
    var words = sourceWords.slice(0, EXCERPT_WORD_LIMIT);
    var output = words.join(" ");
    if (sourceWords.length > EXCERPT_WORD_LIMIT && output) output += "...";
    return {
      text: output.slice(0, 320),
      wordCount: words.length,
      sourceWordCount: sourceWords.length,
      wordLimit: EXCERPT_WORD_LIMIT,
      truncated: sourceWords.length > EXCERPT_WORD_LIMIT,
    };
  }

  function normalizeLabels(input) {
    var labels = input || {};
    var output = {};
    Object.keys(DEFAULT_LABELS).forEach(function (key) {
      output[key] = clean(labels[key] || DEFAULT_LABELS[key], 100);
    });
    var incomingDimensions = labels.dimensions || {};
    output.dimensions = {};
    DIMENSION_DEFINITIONS.forEach(function (definition) {
      output.dimensions[definition.id] = clean(
        incomingDimensions[definition.id] || definition.label,
        80
      );
    });
    return output;
  }

  function contractError(code, message) {
    var error = new Error(message);
    error.name = "RiffBlackBoxContractError";
    error.code = code;
    return error;
  }

  function assertContract(condition, code, message) {
    if (!condition) throw contractError(code, message);
  }

  function parseWeights(formula) {
    var source = clean(formula, 1000);
    assertContract(source, "FORMULA_MISSING", "The promoted chemistry formula is missing.");
    var percentageTerms = source.match(/\d+(?:\.\d+)?\s*%/g) || [];
    assertContract(
      percentageTerms.length === DIMENSION_DEFINITIONS.length,
      "FORMULA_TERM_COUNT",
      "The promoted chemistry formula must contain exactly the six declared percentage terms."
    );
    var weights = {};
    DIMENSION_DEFINITIONS.forEach(function (definition) {
      var escaped = definition.formulaTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var match = source.match(new RegExp("(\\d+(?:\\.\\d+)?)%\\s+" + escaped, "i"));
      assertContract(
        match,
        "FORMULA_DIMENSION_MISSING",
        "The promoted chemistry formula is missing " + definition.formulaTerm + "."
      );
      weights[definition.id] = Number(match[1]) / 100;
    });
    var total = Object.keys(weights).reduce(function (sum, key) {
      return sum + weights[key];
    }, 0);
    assertContract(
      Math.abs(total - 1) < 1e-9,
      "FORMULA_WEIGHT_TOTAL",
      "The promoted chemistry weights must total exactly 100%."
    );
    return weights;
  }

  function validateStructuredWeights(input, parsed) {
    if (input == null) return;
    assertContract(
      input && typeof input === "object" && !Array.isArray(input),
      "STRUCTURED_WEIGHTS_INVALID",
      "Structured chemistry weights must be an object when supplied."
    );
    var suppliedKeys = Object.keys(input).sort(compareCodePoints);
    var expectedKeys = DIMENSION_DEFINITIONS.map(function (definition) {
      return definition.id;
    }).sort(compareCodePoints);
    assertContract(
      stableJson(suppliedKeys) === stableJson(expectedKeys),
      "STRUCTURED_WEIGHT_SET",
      "Structured chemistry weights must expose exactly the six declared dimensions."
    );
    DIMENSION_DEFINITIONS.forEach(function (definition) {
      assertContract(
        isJsonFiniteNumber(input[definition.id]) &&
          input[definition.id] === parsed[definition.id],
        "STRUCTURED_WEIGHT_DRIFT",
        "Structured chemistry weights must exactly match the public formula."
      );
    });
  }

  function reactionCue(excerpt, labels) {
    var source = clean(excerpt, 4000);
    var match = source.match(/\b(?:laughter|laughing)\b|can['\u2019]t breathe/i);
    if (!match) {
      return {
        status: "unknown",
        label: labels.unknownReaction,
        literal: null,
        basis:
          "No allowed literal reaction phrase appears in the promoted excerpt; no reaction is inferred.",
      };
    }
    return {
      status: "literal-excerpt-cue",
      label: labels.literalReaction,
      literal: match[0],
      basis:
        "The cue is the exact allowed phrase present in the promoted excerpt; no speaker or audience is inferred.",
    };
  }

  function evidenceStatus(level) {
    var normalized = clean(level, 80).toLowerCase();
    if (normalized === "creator") return "creator-certified";
    if (normalized === "editor") return "editor-verified";
    return "not-editor-or-creator-certified";
  }

  function jsonShapeViolations(value, path, seen, output) {
    var location = path || "$";
    var violations = output || [];
    var valueType = typeof value;
    if (value === null || valueType === "string" || valueType === "boolean") {
      return violations;
    }
    if (valueType === "number") {
      if (!Number.isFinite(value)) {
        violations.push(location + " contains a non-finite number.");
      }
      return violations;
    }
    if (valueType !== "object") {
      violations.push(location + " contains a non-JSON " + valueType + " value.");
      return violations;
    }
    var visited = seen || new WeakSet();
    if (visited.has(value)) {
      violations.push(location + " contains a circular reference.");
      return violations;
    }
    visited.add(value);
    var tag = Object.prototype.toString.call(value);
    if (Array.isArray(value)) {
      var arrayKeys = Object.keys(value);
      arrayKeys.forEach(function (key) {
        if (
          !/^(?:0|[1-9]\d*)$/.test(key) ||
          Number(key) >= value.length
        ) {
          violations.push(location + " contains a non-JSON array property " + key + ".");
        }
      });
      for (var index = 0; index < value.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, index)) {
          violations.push(location + " contains a sparse array slot.");
        } else {
          jsonShapeViolations(
            value[index],
            location + "[" + index + "]",
            visited,
            violations
          );
        }
      }
      if (Object.getOwnPropertySymbols(value).length) {
        violations.push(location + " contains symbol-keyed array data.");
      }
      return violations;
    }
    if (tag !== "[object Object]") {
      violations.push(location + " contains a non-plain " + tag + " value.");
      return violations;
    }
    Object.getOwnPropertySymbols(value).forEach(function () {
      violations.push(location + " contains symbol-keyed object data.");
    });
    Object.getOwnPropertyNames(value).forEach(function (key) {
      var descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable) {
        violations.push(location + "." + key + " is not enumerable JSON data.");
        return;
      }
      if (descriptor.get || descriptor.set) {
        violations.push(location + "." + key + " is an accessor, not JSON data.");
        return;
      }
      if (/^(?:__proto__|prototype|constructor)$/.test(key)) {
        violations.push(location + "." + key + " is a forbidden structural key.");
        return;
      }
      jsonShapeViolations(
        descriptor.value,
        location + "." + key,
        visited,
        violations
      );
    });
    for (var inheritedKey in value) {
      if (!Object.prototype.hasOwnProperty.call(value, inheritedKey)) {
        violations.push(location + "." + inheritedKey + " is inherited data.");
      }
    }
    return violations;
  }

  function forbiddenFields(value, path, output) {
    if (Array.isArray(value)) {
      value.forEach(function (entry, index) {
        forbiddenFields(entry, path + "[" + index + "]", output);
      });
      return output;
    }
    if (!value || typeof value !== "object") return output;
    Object.keys(value).forEach(function (key) {
      if (
        /^(?:transcript|transcripts|caption|captions|captionEvents|events|fullEvents|rawEvents|rawCaptionEvents|segments|captionSegments|transcriptSegments)$/i.test(
          key
        )
      ) {
        output.push(path + "." + key);
      }
      forbiddenFields(value[key], path + "." + key, output);
    });
    return output;
  }

  function excerptViolations(value, path, output) {
    if (Array.isArray(value)) {
      value.forEach(function (entry, index) {
        excerptViolations(entry, path + "[" + index + "]", output);
      });
      return output;
    }
    if (!value || typeof value !== "object") return output;
    Object.keys(value).forEach(function (key) {
      if (/^(?:excerpt|quote)$/i.test(key)) {
        var count = clean(value[key], 4000).split(/\s+/).filter(Boolean).length;
        if (count > EXCERPT_WORD_LIMIT) output.push(path + "." + key);
      }
      excerptViolations(value[key], path + "." + key, output);
    });
    return output;
  }

  function create(options) {
    var settings = options || {};
    var showcase = settings.showcase;
    assertContract(
      showcase &&
        Array.isArray(showcase.sources) &&
        Array.isArray(showcase.receipts) &&
        typeof showcase.getRiffChemistry === "function",
      "SHOWCASE_REQUIRED",
      "Riff Black Box requires a promoted Showcase sources, receipts, and Riff Chemistry API."
    );

    var packFingerprint = clean(
      settings.packFingerprint || showcase.inputFingerprint,
      160
    );
    assertContract(
      packFingerprint,
      "PACK_FINGERPRINT_REQUIRED",
      "Riff Black Box requires a channel-pack fingerprint."
    );
    var labels = normalizeLabels(settings.labels);
    var contextSeconds =
      settings.contextSeconds == null
        ? DEFAULT_CONTEXT_SECONDS
        : settings.contextSeconds;
    var neighborhoodSeconds =
      settings.neighborhoodSeconds == null
        ? DEFAULT_NEIGHBORHOOD_SECONDS
        : settings.neighborhoodSeconds;
    assertContract(
      isJsonInteger(contextSeconds) &&
        contextSeconds >= 1 &&
        contextSeconds <= 120,
      "CONTEXT_RANGE",
      "Context seconds must be a whole-number JSON value between 1 and 120."
    );
    assertContract(
      isJsonInteger(neighborhoodSeconds) &&
        neighborhoodSeconds >= 1 &&
        neighborhoodSeconds <= 3600,
      "NEIGHBORHOOD_RANGE",
      "Neighborhood seconds must be a whole-number JSON value between 1 and 3600."
    );

    var sourceById = new Map();
    showcase.sources.forEach(function (rawSource) {
      assertContract(
        !carriesQuarantineSignal(rawSource),
        "SOURCE_QUARANTINED",
        "Riff Black Box refuses a quarantined or promotion-denied source."
      );
      var sourceId = clean(rawSource && rawSource.id, 32);
      assertContract(
        validSourceId(sourceId),
        "SOURCE_ID_INVALID",
        "Every promoted source must have an official eleven-character YouTube ID."
      );
      assertContract(
        !sourceById.has(sourceId),
        "SOURCE_ID_DUPLICATE",
        "Promoted source IDs must be unique."
      );
      var duration = rawSource && rawSource.duration;
      assertContract(
        isJsonInteger(duration) && duration >= 0,
        "SOURCE_DURATION_INVALID",
        "Every promoted source must have a non-negative whole-number duration."
      );
      var sourceLanes = cleanList(
        (Array.isArray(rawSource.lanes) ? rawSource.lanes : []).concat(
          rawSource.lane == null ? [] : [rawSource.lane]
        )
      );
      sourceById.set(sourceId, {
        sourceId: sourceId,
        title: clean(rawSource.title || sourceId, 240),
        date: clean(rawSource.date, 20),
        durationSeconds: duration,
        sourceType: clean(rawSource.type || rawSource.lane || "indexed-source", 80),
        lanes: sourceLanes,
        promotionAllowed: true,
        promotionStatus: clean(
          rawSource.promotionStatus || rawSource.reviewStatus || "promoted-ledger",
          80
        ),
        url: officialUrl(sourceId, 0),
      });
    });

    var receiptById = new Map();
    var receiptsBySource = new Map();
    showcase.receipts.forEach(function (rawReceipt) {
      assertContract(
        !carriesQuarantineSignal(rawReceipt),
        "RECEIPT_QUARANTINED",
        "Riff Black Box refuses a quarantined or promotion-denied receipt."
      );
      var receiptId = clean(rawReceipt && (rawReceipt.id || rawReceipt.receiptId), 240);
      var sourceId = clean(rawReceipt && rawReceipt.sourceId, 32);
      var source = sourceById.get(sourceId);
      var sourceAt =
        rawReceipt && (rawReceipt.t == null ? rawReceipt.at : rawReceipt.t);
      assertContract(receiptId, "RECEIPT_ID_MISSING", "Every promoted receipt needs an ID.");
      assertContract(
        !receiptById.has(receiptId),
        "RECEIPT_ID_DUPLICATE",
        "Promoted receipt IDs must be unique."
      );
      assertContract(
        source,
        "RECEIPT_SOURCE_FOREIGN",
        "Every promoted receipt must resolve to the promoted source ledger."
      );
      assertContract(
        isJsonFiniteNumber(sourceAt) &&
          sourceAt >= 0 &&
          sourceAt <= source.durationSeconds,
        "RECEIPT_TIME_OUT_OF_BOUNDS",
        "Every promoted receipt timestamp must be an exact finite JSON number inside its source duration."
      );
      var at = Math.floor(sourceAt);
      var excerpt = clean(rawReceipt.excerpt || rawReceipt.quote, 4000);
      assertContract(
        excerpt,
        "RECEIPT_EXCERPT_MISSING",
        "Every promoted receipt used by Riff Black Box needs a literal excerpt."
      );
      assertContract(
        isJsonFiniteNumber(rawReceipt.score) &&
          rawReceipt.score >= 0 &&
          rawReceipt.score <= 100,
        "RECEIPT_SCORE_INVALID",
        "Every promoted receipt used by Riff Black Box needs an exact JSON-number heat score from 0 through 100."
      );
      var entityIds = cleanList(rawReceipt.entityIds, 240);
      var receipt = {
        receiptId: receiptId,
        sourceId: sourceId,
        sourceAt: sourceAt,
        at: at,
        category: clean(rawReceipt.category || rawReceipt.type || "INDEXED RECEIPT", 120),
        excerpt: excerpt,
        score: rawReceipt.score,
        type: clean(rawReceipt.type || "indexed-receipt", 80),
        evidenceLevel: clean(rawReceipt.evidenceLevel || "unknown", 80),
        entityIds: entityIds,
        lanes: cleanList(
          (Array.isArray(rawReceipt.lanes) ? rawReceipt.lanes : []).concat(
            rawReceipt.lane == null ? [] : [rawReceipt.lane]
          )
        ),
        reviewStatus: clean(rawReceipt.reviewStatus || rawReceipt.status, 80),
        promotionAllowed: true,
        promotionStatus: clean(rawReceipt.promotionStatus || "promoted-ledger", 80),
      };
      receiptById.set(receiptId, receipt);
      if (!receiptsBySource.has(sourceId)) receiptsBySource.set(sourceId, []);
      receiptsBySource.get(sourceId).push(receipt);
    });
    receiptsBySource.forEach(function (receipts) {
      receipts.sort(function (left, right) {
        return left.at - right.at || compareCodePoints(left.receiptId, right.receiptId);
      });
    });

    var chemistry = showcase.getRiffChemistry();
    assertContract(
      chemistry && Array.isArray(chemistry.moments),
      "CHEMISTRY_REQUIRED",
      "The promoted Showcase must expose a Riff Chemistry moment ledger."
    );
    var formula = clean(chemistry.formula, 1000);
    var weights = parseWeights(formula);
    validateStructuredWeights(chemistry.weights, weights);
    var chemistryIds = new Set();
    var anchorSourceIds = new Set();
    var scoreDriftCount = 0;
    var maximumScoreDrift = 0;

    function publicReceipt(receipt) {
      var source = sourceById.get(receipt.sourceId);
      var excerpt = boundedExcerpt(receipt.excerpt);
      return {
        receiptId: receipt.receiptId,
        sourceId: receipt.sourceId,
        sourceTitle: source.title,
        sourceType: source.sourceType,
        date: source.date,
        sourceAt: receipt.sourceAt,
        at: receipt.at,
        t: receipt.at,
        timecode: formatTime(receipt.at),
        url: officialUrl(receipt.sourceId, receipt.at),
        category: receipt.category,
        excerpt: excerpt.text,
        excerptWordCount: excerpt.wordCount,
        excerptSourceWordCount: excerpt.sourceWordCount,
        excerptWordLimit: excerpt.wordLimit,
        excerptTruncated: excerpt.truncated,
        evidenceTier: receipt.evidenceLevel,
        evidenceStatus: evidenceStatus(receipt.evidenceLevel),
        coordinatePrecision:
          receipt.sourceAt === receipt.at
            ? "whole-second-source-coordinate"
            : "fractional-source-coordinate-normalized-down-to-whole-second",
        speaker: null,
        speakerStatus: "not-diarized",
      };
    }

    var anchors = chemistry.moments.map(function (moment) {
      assertContract(
        !carriesQuarantineSignal(moment),
        "CHEMISTRY_ANCHOR_QUARANTINED",
        "Riff Black Box refuses a quarantined or promotion-denied chemistry anchor."
      );
      var receiptId = clean(moment && moment.receiptId, 240);
      var receipt = receiptById.get(receiptId);
      assertContract(
        receipt,
        "CHEMISTRY_RECEIPT_FOREIGN",
        "Every chemistry anchor must resolve to the promoted receipt ledger."
      );
      assertContract(
        !chemistryIds.has(receiptId),
        "CHEMISTRY_RECEIPT_DUPLICATE",
        "Chemistry receipt IDs must be unique."
      );
      chemistryIds.add(receiptId);
      assertContract(
        clean(moment.sourceId, 32) === receipt.sourceId &&
          isJsonFiniteNumber(moment.t) &&
          moment.t === receipt.sourceAt,
        "CHEMISTRY_COORDINATE_DRIFT",
        "Chemistry coordinates must exactly match their promoted receipt."
      );
      assertContract(
        clean(moment.category, 120) === receipt.category,
        "CHEMISTRY_CATEGORY_DRIFT",
        "Chemistry categories must exactly match their promoted receipt."
      );

      var rawDimensions = moment.dimensions || {};
      var keys = Object.keys(rawDimensions).sort();
      var expectedKeys = DIMENSION_DEFINITIONS.map(function (definition) {
        return definition.id;
      }).sort();
      assertContract(
        stableJson(keys) === stableJson(expectedKeys),
        "CHEMISTRY_DIMENSION_SET",
        "Every chemistry anchor must expose exactly the six documented dimensions."
      );
      var dimensions = {};
      var contributions = {};
      DIMENSION_DEFINITIONS.forEach(function (definition) {
        var value = rawDimensions[definition.id];
        assertContract(
          isJsonInteger(value) && value >= 0 && value <= 100,
          "CHEMISTRY_DIMENSION_RANGE",
          "Chemistry dimensions must be whole-number JSON values from 0 through 100."
        );
        dimensions[definition.id] = value;
        contributions[definition.id] =
          Math.round(value * weights[definition.id] * 10000) / 10000;
      });
      var recomputed = Math.round(
        DIMENSION_DEFINITIONS.reduce(function (sum, definition) {
          return sum + dimensions[definition.id] * weights[definition.id];
        }, 0)
      );
      recomputed = clamp(recomputed, 0, 100);
      var suppliedScore = moment.score;
      assertContract(
        isJsonInteger(suppliedScore) &&
          suppliedScore >= 0 &&
          suppliedScore <= 100,
        "CHEMISTRY_SCORE_INVALID",
        "Every chemistry anchor must have a whole-number score from 0 through 100."
      );
      var drift = Math.abs(suppliedScore - recomputed);
      if (drift) scoreDriftCount += 1;
      maximumScoreDrift = Math.max(maximumScoreDrift, drift);
      assertContract(
        drift === 0,
        "CHEMISTRY_SCORE_DRIFT",
        "Riff Black Box refuses chemistry scores that drift from the published formula."
      );

      var basis = moment.basis || {};
      var matchedBits = receipt.entityIds.filter(function (id) {
        return id.indexOf("bit:") === 0;
      }).length;
      var indexedSubjects = receipt.entityIds.filter(function (id) {
        return (
          id.indexOf("film:") === 0 ||
          id.indexOf("franchise:") === 0 ||
          id.indexOf("topic:") === 0
        );
      }).length;
      assertContract(
        isJsonFiniteNumber(basis.sourceHeat) &&
          basis.sourceHeat >= 0 &&
          basis.sourceHeat <= 100 &&
          basis.sourceHeat === receipt.score &&
          isJsonInteger(basis.matchedBits) &&
          basis.matchedBits === matchedBits &&
          isJsonInteger(basis.indexedSubjects) &&
          basis.indexedSubjects === indexedSubjects &&
          clean(basis.category, 120) === receipt.category,
        "CHEMISTRY_LITERAL_BASIS_DRIFT",
        "Chemistry literal basis must be recomputable from the promoted receipt."
      );
      var excerpt = boundedExcerpt(receipt.excerpt);
      anchorSourceIds.add(receipt.sourceId);
      return {
        receiptId: receipt.receiptId,
        sourceId: receipt.sourceId,
        sourceTitle: sourceById.get(receipt.sourceId).title,
        sourceType: sourceById.get(receipt.sourceId).sourceType,
        date: sourceById.get(receipt.sourceId).date,
        at: receipt.at,
        sourceAt: receipt.sourceAt,
        t: receipt.at,
        timecode: formatTime(receipt.at),
        url: officialUrl(receipt.sourceId, receipt.at),
        category: receipt.category,
        score: suppliedScore,
        scoreLabel: clean(moment.label || "Unlabeled score", 120),
        dimensions: dimensions,
        weights: serialCopy(weights),
        weightedContributions: contributions,
        recomputedScore: recomputed,
        scoreDrift: drift,
        literalBasis: {
          excerpt: excerpt.text,
          excerptWordCount: excerpt.wordCount,
          excerptSourceWordCount: excerpt.sourceWordCount,
          excerptWordLimit: excerpt.wordLimit,
          excerptTruncated: excerpt.truncated,
          sourceHeat: receipt.score,
          matchedBits: matchedBits,
          indexedSubjects: indexedSubjects,
          category: receipt.category,
          evidenceTier: receipt.evidenceLevel,
          evidenceStatus: evidenceStatus(receipt.evidenceLevel),
          basisStatus:
            "Promoted ledger literals and deterministic score inputs; not a causal explanation of why a riff worked.",
        },
        reactionCue: reactionCue(excerpt.text, labels),
        coordinatePrecision:
          receipt.sourceAt === receipt.at
            ? "whole-second-source-coordinate"
            : "fractional-source-coordinate-normalized-down-to-whole-second",
        evidenceTier: receipt.evidenceLevel,
        evidenceStatus: evidenceStatus(receipt.evidenceLevel),
        speaker: null,
        speakerStatus: "not-diarized",
      };
    });

    anchors.sort(function (left, right) {
      return right.score - left.score || compareCodePoints(left.receiptId, right.receiptId);
    });
    assertContract(
      scoreDriftCount === 0 && maximumScoreDrift === 0,
      "CHEMISTRY_SCORE_DRIFT",
      "Riff Black Box permits zero score drift."
    );

    var ledgerFingerprint = fingerprint(
      stableJson({
        sources: Array.from(sourceById.values()).sort(function (left, right) {
          return compareCodePoints(left.sourceId, right.sourceId);
        }),
        receipts: Array.from(receiptById.values()).sort(function (left, right) {
          return compareCodePoints(left.receiptId, right.receiptId);
        }),
      })
    );
    var chemistryFingerprint = fingerprint(
      stableJson({
        formula: formula,
        anchors: anchors,
      })
    );
    var evidenceTierCounts = anchors.reduce(function (counts, anchor) {
      var tier = clean(anchor.evidenceTier || "unknown", 80);
      counts[tier] = (counts[tier] || 0) + 1;
      return counts;
    }, Object.create(null));
    var metrics = {
      anchorCount: anchors.length,
      sourceCount: anchorSourceIds.size,
      promotedSourceCount: sourceById.size,
      promotedReceiptCount: receiptById.size,
      dimensionCount: DIMENSION_DEFINITIONS.length,
      weightTotal: Object.keys(weights).reduce(function (sum, key) {
        return sum + weights[key];
      }, 0),
      scoreDriftCount: scoreDriftCount,
      maximumScoreDrift: maximumScoreDrift,
      literalReactionCueCount: anchors.filter(function (anchor) {
        return anchor.reactionCue.status === "literal-excerpt-cue";
      }).length,
      unknownReactionCount: anchors.filter(function (anchor) {
        return anchor.reactionCue.status === "unknown";
      }).length,
      evidenceTierCounts: serialCopy(evidenceTierCounts),
      machineEvidenceCount: evidenceTierCounts.machine || 0,
      curatedCandidateEvidenceCount:
        evidenceTierCounts["curated-candidate"] || 0,
    };
    var binding = {
      packFingerprint: packFingerprint,
      showcaseFingerprint: clean(showcase.inputFingerprint, 160) || "unavailable",
      ledgerFingerprint: ledgerFingerprint,
      chemistryFingerprint: chemistryFingerprint,
      contextSeconds: contextSeconds,
      contextAfterSeconds: contextSeconds + 5,
      neighborhoodSeconds: neighborhoodSeconds,
    };
    binding.evidenceFingerprint = fingerprint(
      stableJson({
        ledgerFingerprint: binding.ledgerFingerprint,
        chemistryFingerprint: binding.chemistryFingerprint,
        contextSeconds: binding.contextSeconds,
        contextAfterSeconds: binding.contextAfterSeconds,
        neighborhoodSeconds: binding.neighborhoodSeconds,
      })
    );

    function list(options) {
      var query = options || {};
      var sourceId = clean(query.sourceId, 32);
      var filtered = sourceId
        ? anchors.filter(function (anchor) {
            return anchor.sourceId === sourceId;
          })
        : anchors;
      var offset = Math.max(0, integer(query.offset, 0));
      var requestedLimit =
        query.limit == null ? filtered.length : Math.max(0, integer(query.limit, 0));
      return deepFreeze(serialCopy(filtered.slice(offset, offset + requestedLimit)));
    }

    function navigationNeighbor(receipt, relation, deltaSeconds) {
      if (!receipt) return null;
      var output = publicReceipt(receipt);
      output.relation = relation;
      output.deltaSeconds = deltaSeconds;
      output.navigationOnly = true;
      output.disclaimer = POLICY.neighborRule;
      return output;
    }

    function inspect(rawReceiptId) {
      var receiptId = clean(rawReceiptId, 240);
      var anchor = anchors.find(function (candidate) {
        return candidate.receiptId === receiptId;
      });
      if (!anchor) return null;
      var source = sourceById.get(anchor.sourceId);
      var sameSource = receiptsBySource.get(anchor.sourceId) || [];
      var before = null;
      var after = null;
      sameSource.forEach(function (receipt) {
        if (receipt.receiptId === anchor.receiptId) return;
        if (receipt.at < anchor.at && (!before || receipt.at > before.at)) before = receipt;
        if (receipt.at > anchor.at && (!after || receipt.at < after.at)) after = receipt;
      });
      var beforeDelta = before ? anchor.at - before.at : null;
      var afterDelta = after ? after.at - anchor.at : null;
      if (beforeDelta == null || beforeDelta > neighborhoodSeconds) before = null;
      if (afterDelta == null || afterDelta > neighborhoodSeconds) after = null;
      var contextStart = Math.max(0, anchor.at - contextSeconds);
      var contextEnd = Math.min(source.durationSeconds, anchor.at + contextSeconds + 5);
      return deepFreeze({
        schema: SCHEMA + "/inspection",
        product: labels.productName,
        anchor: serialCopy(anchor),
        source: serialCopy(source),
        contextWindow: {
          label: labels.contextName,
          start: contextStart,
          startTimecode: formatTime(contextStart),
          startUrl: officialUrl(anchor.sourceId, contextStart),
          anchor: anchor.at,
          anchorTimecode: anchor.timecode,
          anchorUrl: anchor.url,
          end: contextEnd,
          endTimecode: formatTime(contextEnd),
          endUrl: officialUrl(anchor.sourceId, contextEnd),
          requestedBeforeSeconds: contextSeconds,
          requestedAfterSeconds: contextSeconds + 5,
          coordinateBasis: "official-source-playback",
          dialogueReconstructed: false,
          excerptSupplied: false,
        },
        neighbors: {
          before: navigationNeighbor(
            before,
            "nearest-indexed-before",
            before ? anchor.at - before.at : null
          ),
          after: navigationNeighbor(
            after,
            "nearest-indexed-after",
            after ? after.at - anchor.at : null
          ),
          maximumDistanceSeconds: neighborhoodSeconds,
          disclaimer: POLICY.neighborRule,
        },
        dimensions: serialCopy(anchor.dimensions),
        weights: serialCopy(anchor.weights),
        weightedContributions: serialCopy(anchor.weightedContributions),
        literalBasis: serialCopy(anchor.literalBasis),
        reactionCue: serialCopy(anchor.reactionCue),
        recomputedScore: anchor.recomputedScore,
        scoreDrift: anchor.scoreDrift,
        speaker: null,
        speakerStatus: "not-diarized",
        disclaimer:
          "This is a deterministic autopsy of promoted score inputs. Navigation neighbors do not establish setup, payoff, intent, or causality.",
      });
    }

    var snapshotBase = {
      schema: SCHEMA,
      version: VERSION,
      engine: "SHOKKER RIFF BLACK BOX ENGINE",
      labels: serialCopy(labels),
      binding: serialCopy(binding),
      formula: formula,
      dimensions: DIMENSION_DEFINITIONS.map(function (definition) {
        return {
          id: definition.id,
          label: labels.dimensions[definition.id],
          formulaTerm: definition.formulaTerm,
          weight: weights[definition.id],
        };
      }),
      metrics: serialCopy(metrics),
      policy: serialCopy(POLICY),
      anchors: serialCopy(anchors),
    };
    var snapshotArtifact = serialCopy(snapshotBase);
    snapshotArtifact.fingerprint = fingerprint(stableJson(snapshotBase));
    deepFreeze(snapshotArtifact);

    function snapshot() {
      return deepFreeze(serialCopy(snapshotArtifact));
    }

    function verify(packet) {
      var errors = [];
      var shapeErrors = [];
      try {
        jsonShapeViolations(packet, "$", new WeakSet(), shapeErrors);
      } catch (error) {
        shapeErrors.push(
          "Snapshot shape inspection failed safely: " +
            clean(error && error.message ? error.message : error, 240)
        );
      }
      if (
        !packet ||
        typeof packet !== "object" ||
        Array.isArray(packet) ||
        shapeErrors.length
      ) {
        return {
          ok: false,
          expected: snapshotArtifact.fingerprint,
          actual: null,
          errors: (
            (!packet || typeof packet !== "object" || Array.isArray(packet)
              ? ["Snapshot must be a plain JSON object."]
              : [])
          ).concat(shapeErrors),
        };
      }
      if (packet.schema !== SCHEMA) errors.push("Schema mismatch.");
      if (packet.version !== VERSION) errors.push("Version mismatch.");
      if (
        !packet.binding ||
        clean(packet.binding.packFingerprint, 160) !== packFingerprint
      ) {
        errors.push("Foreign channel-pack fingerprint.");
      }
      if (
        !packet.binding ||
        clean(packet.binding.ledgerFingerprint, 160) !== ledgerFingerprint ||
        clean(packet.binding.chemistryFingerprint, 160) !== chemistryFingerprint ||
        clean(packet.binding.evidenceFingerprint, 160) !==
          binding.evidenceFingerprint
      ) {
        errors.push("Foreign promoted-ledger fingerprint.");
      }
      var forbidden = forbiddenFields(packet, "$", []);
      if (forbidden.length) {
        errors.push("Forbidden export fields: " + forbidden.join(", ") + ".");
      }
      var longExcerpts = excerptViolations(packet, "$", []);
      if (longExcerpts.length) {
        errors.push("Excerpt word limit exceeded: " + longExcerpts.join(", ") + ".");
      }
      var actual = null;
      try {
        var supplied = serialCopy(packet);
        var suppliedFingerprint = clean(supplied.fingerprint, 160);
        delete supplied.fingerprint;
        actual = fingerprint(stableJson(supplied));
        if (!suppliedFingerprint || suppliedFingerprint !== actual) {
          errors.push("Fingerprint mismatch.");
        }
        if (stableJson(packet) !== stableJson(snapshotArtifact)) {
          errors.push("Snapshot does not match the deterministic promoted ledger.");
        }
      } catch (error) {
        errors.push(
          "Snapshot canonicalization failed safely: " +
            clean(error && error.message ? error.message : error, 240)
        );
      }
      return {
        ok: errors.length === 0,
        expected: snapshotArtifact.fingerprint,
        actual: actual,
        errors: errors,
      };
    }

    function restore(packet) {
      var report = verify(packet);
      if (!report.ok) {
        throw contractError(
          "SNAPSHOT_INVALID",
          "Refusing to restore an invalid Riff Black Box snapshot: " +
            report.errors.join(" ")
        );
      }
      return snapshot();
    }

    function serialize(packet) {
      var artifact = packet == null ? snapshotArtifact : packet;
      var report = verify(artifact);
      if (!report.ok) {
        throw contractError(
          "SNAPSHOT_INVALID",
          "Refusing to serialize an invalid Riff Black Box snapshot: " +
            report.errors.join(" ")
        );
      }
      return stableJson(artifact) + "\n";
    }

    function buildInspectionPacket(receiptId) {
      var inspection = inspect(receiptId);
      if (!inspection) return null;
      var packetBase = {
        schema: SCHEMA + "/inspection-packet",
        version: VERSION,
        engine: "SHOKKER RIFF BLACK BOX ENGINE",
        labels: serialCopy(labels),
        binding: serialCopy(binding),
        snapshotFingerprint: snapshotArtifact.fingerprint,
        formula: formula,
        dimensions: serialCopy(snapshotBase.dimensions),
        policy: serialCopy(POLICY),
        inspection: serialCopy(inspection),
      };
      var packet = serialCopy(packetBase);
      packet.fingerprint = fingerprint(stableJson(packetBase));
      return deepFreeze(packet);
    }

    function inspectionPacket(receiptId) {
      var packet = buildInspectionPacket(receiptId);
      return packet ? deepFreeze(serialCopy(packet)) : null;
    }

    function verifyInspection(packet) {
      var errors = [];
      var shapeErrors = [];
      try {
        jsonShapeViolations(packet, "$", new WeakSet(), shapeErrors);
      } catch (error) {
        shapeErrors.push(
          "Inspection packet shape inspection failed safely: " +
            clean(error && error.message ? error.message : error, 240)
        );
      }
      if (
        !packet ||
        typeof packet !== "object" ||
        Array.isArray(packet) ||
        shapeErrors.length
      ) {
        return {
          ok: false,
          expected: null,
          actual: null,
          errors: (
            (!packet || typeof packet !== "object" || Array.isArray(packet)
              ? ["Inspection packet must be a plain JSON object."]
              : [])
          ).concat(shapeErrors),
        };
      }
      var receiptId = clean(
        packet.inspection &&
          packet.inspection.anchor &&
          packet.inspection.anchor.receiptId,
        240
      );
      var expectedPacket = receiptId ? buildInspectionPacket(receiptId) : null;
      if (!expectedPacket) {
        errors.push("Inspection packet does not resolve to a promoted chemistry anchor.");
      }
      var actual = null;
      try {
        var supplied = serialCopy(packet);
        var suppliedFingerprint = clean(supplied.fingerprint, 160);
        delete supplied.fingerprint;
        actual = fingerprint(stableJson(supplied));
        if (!suppliedFingerprint || suppliedFingerprint !== actual) {
          errors.push("Inspection packet fingerprint mismatch.");
        }
        var forbidden = forbiddenFields(packet, "$", []);
        if (forbidden.length) {
          errors.push("Forbidden inspection fields: " + forbidden.join(", ") + ".");
        }
        var longExcerpts = excerptViolations(packet, "$", []);
        if (longExcerpts.length) {
          errors.push(
            "Inspection excerpt word limit exceeded: " +
              longExcerpts.join(", ") +
              "."
          );
        }
        if (
          expectedPacket &&
          stableJson(packet) !== stableJson(expectedPacket)
        ) {
          errors.push(
            "Inspection packet does not match the deterministic promoted receipt."
          );
        }
      } catch (error) {
        errors.push(
          "Inspection packet canonicalization failed safely: " +
            clean(error && error.message ? error.message : error, 240)
        );
      }
      return {
        ok: errors.length === 0,
        expected: expectedPacket ? expectedPacket.fingerprint : null,
        actual: actual,
        errors: errors,
      };
    }

    function serializeInspection(packetOrReceiptId) {
      var artifact =
        typeof packetOrReceiptId === "string"
          ? inspectionPacket(packetOrReceiptId)
          : packetOrReceiptId;
      var report = verifyInspection(artifact);
      if (!report.ok) {
        throw contractError(
          "INSPECTION_PACKET_INVALID",
          "Refusing to serialize an invalid Riff Black Box inspection packet: " +
            report.errors.join(" ")
        );
      }
      return stableJson(artifact) + "\n";
    }

    return deepFreeze({
      engine: "SHOKKER RIFF BLACK BOX ENGINE",
      version: VERSION,
      schema: SCHEMA,
      binding: serialCopy(binding),
      labels: serialCopy(labels),
      formula: formula,
      dimensions: snapshotBase.dimensions,
      weights: serialCopy(weights),
      metrics: serialCopy(metrics),
      policy: serialCopy(POLICY),
      list: list,
      inspect: inspect,
      snapshot: snapshot,
      verify: verify,
      restore: restore,
      serialize: serialize,
      inspectionPacket: inspectionPacket,
      verifyInspection: verifyInspection,
      serializeInspection: serializeInspection,
    });
  }

  root.ShokkerRiffBlackBoxEngine = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    EXCERPT_WORD_LIMIT: EXCERPT_WORD_LIMIT,
    DIMENSION_IDS: Object.freeze(
      DIMENSION_DEFINITIONS.map(function (definition) {
        return definition.id;
      })
    ),
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
