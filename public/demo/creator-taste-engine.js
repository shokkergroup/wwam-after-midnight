(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker.creator-taste/v1";
  var ROUND_COUNT = 12;
  var BASE_ROUND_COUNT = 10;
  var REPEAT_COUNT = 2;
  var TOP_LIMIT = 12;
  var MINIMUM_PREFERENCE_DECISIONS = 6;
  var MODIFIER_MIN = -6;
  var MODIFIER_MAX = 6;
  var PUBLIC_EXCERPT_WORD_LIMIT = 16;
  var CHOICES = Object.freeze(["A", "B", "NEITHER", "NEEDS_CONTEXT"]);
  var RISK_ORDER = Object.freeze({ LOW: 1, MEDIUM: 2, HIGH: 3, HOLD: 4 });
  var DEFAULT_LABELS = Object.freeze({
    product: "CREATOR TASTE CALIBRATION",
    operator: "LOCAL OPERATOR",
    round: "CALIBRATION ROUND",
    optionA: "OPTION A",
    optionB: "OPTION B",
    neither: "NEITHER",
    needsContext: "NEEDS CONTEXT",
    baseline: "BASELINE TOP 12",
    calibrated: "CALIBRATED TOP 12",
    categoryFacet: "CATEGORY",
    topicFacet: "TOPIC",
    entityFacet: "ENTITY",
    runtimeFacet: "RUNTIME",
    sourceTypeFacet: "SOURCE TYPE"
  });

  function CreatorTasteCalibrationError(code, message, details) {
    this.name = "CreatorTasteCalibrationError";
    this.code = code;
    this.message = message;
    this.details = details || null;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CreatorTasteCalibrationError);
    }
  }
  CreatorTasteCalibrationError.prototype = Object.create(Error.prototype);
  CreatorTasteCalibrationError.prototype.constructor = CreatorTasteCalibrationError;

  function fail(code, message, details) {
    throw new CreatorTasteCalibrationError(code, message, details);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function clean(value) {
    return text(value).replace(/\s+/g, " ").trim();
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback == null ? 0 : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, number(value)));
  }

  function round(value, digits) {
    var power = Math.pow(10, digits == null ? 3 : digits);
    return Math.round(number(value) * power) / power;
  }

  function normalized(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function slug(value) {
    return normalized(value).replace(/\s+/g, "-") || "unknown";
  }

  function unique(values) {
    return Array.from(new Set(array(values).map(clean).filter(Boolean)));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce(function (output, key) {
          if (typeof value[key] !== "function" && value[key] !== undefined) {
            output[key] = stableValue(value[key]);
          }
          return output;
        }, {});
    }
    return value;
  }

  function stableJson(value, indentation) {
    return JSON.stringify(stableValue(value), null, indentation == null ? 0 : indentation);
  }

  function hash(value) {
    var source = typeof value === "string" ? value : stableJson(value);
    var result = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      result ^= source.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return ("00000000" + (result >>> 0).toString(16)).slice(-8);
  }

  function fingerprint(prefix, value) {
    return prefix + "-" + hash(value);
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function (key) {
      deepFreeze(value[key]);
    });
    return value;
  }

  function boundedExcerpt(value) {
    var words = clean(value).split(/\s+/).filter(Boolean);
    var truncated = words.length > PUBLIC_EXCERPT_WORD_LIMIT;
    return {
      text: truncated
        ? words.slice(0, PUBLIC_EXCERPT_WORD_LIMIT).join(" ") + "…"
        : words.join(" "),
      truncated: truncated,
      originalWordCount: words.length,
      publicWordLimit: PUBLIC_EXCERPT_WORD_LIMIT
    };
  }

  function getPath(value, path) {
    var cursor = value;
    var parts = clean(path).split(".").filter(Boolean);
    for (var index = 0; index < parts.length; index += 1) {
      if (cursor == null || typeof cursor !== "object") return undefined;
      cursor = cursor[parts[index]];
    }
    return cursor;
  }

  function firstPath(value, paths) {
    var candidates = array(paths);
    for (var index = 0; index < candidates.length; index += 1) {
      var found = getPath(value, candidates[index]);
      if (found != null && found !== "" && (!Array.isArray(found) || found.length)) {
        return found;
      }
    }
    return undefined;
  }

  function normalizeLabels(input) {
    var supplied = object(input);
    return Object.keys(DEFAULT_LABELS).reduce(function (labels, key) {
      labels[key] = clean(supplied[key]) || DEFAULT_LABELS[key];
      return labels;
    }, {});
  }

  function normalizeDimensions(adapter, labels) {
    var defaults = [
      {
        id: "category",
        label: labels.categoryFacet,
        kind: "scalar",
        paths: ["category"]
      },
      {
        id: "topic",
        label: labels.topicFacet,
        kind: "list",
        paths: ["topics"],
        idField: "id",
        labelField: "label"
      },
      {
        id: "entity",
        label: labels.entityFacet,
        kind: "list",
        paths: ["entities", "characters", "participants", "drivers"],
        idField: "id",
        labelField: "label"
      },
      {
        id: "runtime",
        label: labels.runtimeFacet,
        kind: "runtime-band",
        paths: ["editWindow.seconds", "durationSeconds"]
      },
      {
        id: "source-type",
        label: labels.sourceTypeFacet,
        kind: "scalar",
        paths: ["sourceType"]
      }
    ];
    var supplied = array(object(adapter).featureDimensions);
    var dimensions = supplied.length ? supplied : defaults;
    var ids = new Set();
    return dimensions.map(function (dimension, index) {
      var item = object(dimension);
      var id = slug(item.id);
      if (!clean(item.id) || ids.has(id)) {
        fail(
          "INVALID_FEATURE_DIMENSION",
          "Feature dimensions require unique non-empty IDs.",
          { index: index, id: item.id }
        );
      }
      ids.add(id);
      var kind = clean(item.kind || "scalar").toLowerCase();
      if (["scalar", "list", "runtime-band"].indexOf(kind) < 0) {
        fail(
          "INVALID_FEATURE_DIMENSION",
          "Feature dimension kind must be scalar, list, or runtime-band.",
          { index: index, kind: kind }
        );
      }
      var paths = unique(item.paths || (item.path ? [item.path] : []));
      if (!paths.length) {
        fail(
          "INVALID_FEATURE_DIMENSION",
          "Every feature dimension requires at least one candidate path.",
          { index: index, id: id }
        );
      }
      return {
        id: id,
        label: clean(item.label) || id.toUpperCase(),
        kind: kind,
        paths: paths,
        idField: clean(item.idField) || "id",
        labelField: clean(item.labelField) || "label"
      };
    });
  }

  function runtimeBand(seconds) {
    var value = Math.max(0, number(seconds));
    if (value < 30) return { id: "under-30", label: "UNDER 30" };
    if (value <= 45) return { id: "30-45", label: "30–45" };
    return { id: "over-45", label: "OVER 45" };
  }

  function featureValues(candidate, dimensions) {
    var values = [];
    dimensions.forEach(function (dimension) {
      var raw = firstPath(candidate, dimension.paths);
      var entries = [];
      if (dimension.kind === "runtime-band") {
        entries = [runtimeBand(raw)];
      } else if (dimension.kind === "list") {
        entries = array(raw).map(function (item) {
          if (item && typeof item === "object") {
            var itemId = clean(item[dimension.idField] || item[dimension.labelField]);
            var itemLabel = clean(item[dimension.labelField] || item[dimension.idField]);
            return { id: itemId, label: itemLabel };
          }
          return { id: clean(item), label: clean(item) };
        });
      } else if (raw != null && raw !== "") {
        if (raw && typeof raw === "object") {
          entries = [{
            id: clean(raw[dimension.idField] || raw[dimension.labelField]),
            label: clean(raw[dimension.labelField] || raw[dimension.idField])
          }];
        } else {
          entries = [{ id: clean(raw), label: clean(raw) }];
        }
      }
      entries.forEach(function (entry) {
        if (!entry.id && !entry.label) return;
        var valueId = slug(entry.id || entry.label);
        values.push({
          key: dimension.id + ":" + valueId,
          dimensionId: dimension.id,
          dimensionLabel: dimension.label,
          valueId: valueId,
          valueLabel: clean(entry.label || entry.id)
        });
      });
    });
    var seen = new Set();
    return values
      .filter(function (value) {
        if (seen.has(value.key)) return false;
        seen.add(value.key);
        return true;
      })
      .sort(function (left, right) {
        return left.key.localeCompare(right.key);
      });
  }

  function candidateId(candidate) {
    return clean(candidate && (candidate.id || candidate.receiptId));
  }

  function candidateRisk(candidate) {
    return clean(candidate && candidate.risk && candidate.risk.label).toUpperCase() || "HOLD";
  }

  function candidateScore(candidate) {
    return number(
      candidate && (
        candidate.editPriority != null
          ? candidate.editPriority
          : candidate.score
      )
    );
  }

  function exactLedgerReady(candidate) {
    return Boolean(
      candidateId(candidate) &&
      clean(candidate && candidate.receiptId) &&
      clean(candidate && candidate.sourceId) &&
      Number.isFinite(Number(candidate && candidate.receiptAt)) &&
      Number(candidate.receiptAt) >= 0 &&
      clean(candidate && candidate.receiptUrl)
    );
  }

  function riskAllowed(candidate, maximum) {
    var label = candidateRisk(candidate);
    if (label === "HOLD") return false;
    return number(RISK_ORDER[label], 4) <= number(RISK_ORDER[maximum], 2);
  }

  function compactEntityList(value) {
    return array(value).map(function (item) {
      if (item && typeof item === "object") {
        return {
          id: clean(item.id || item.label || item.name),
          label: clean(item.label || item.name || item.id)
        };
      }
      return { id: clean(item), label: clean(item) };
    }).filter(function (item) {
      return item.id || item.label;
    });
  }

  function candidateCard(candidate, baselineRank) {
    return {
      candidateId: candidateId(candidate),
      kind: clean(candidate.kind) || "clip-candidate",
      receiptId: clean(candidate.receiptId),
      sourceId: clean(candidate.sourceId),
      receiptAt: number(candidate.receiptAt),
      timecode: clean(candidate.timecode),
      receiptUrl: clean(candidate.receiptUrl),
      sourceTitle: clean(candidate.sourceTitle),
      sourceType: clean(candidate.sourceType),
      sourceDate: clean(candidate.sourceDate),
      category: clean(candidate.category),
      topics: compactEntityList(candidate.topics),
      entities: compactEntityList(
        array(candidate.entities).length
          ? candidate.entities
          : array(candidate.characters).length
            ? candidate.characters
            : array(candidate.participants).length
              ? candidate.participants
              : candidate.drivers
      ),
      durationSeconds: number(
        candidate.editWindow && candidate.editWindow.seconds,
        number(candidate.durationSeconds)
      ),
      excerpt: boundedExcerpt(candidate.archivalExcerpt || candidate.excerpt),
      editPriority: candidateScore(candidate),
      baselineRank: baselineRank,
      risk: clone(object(candidate.risk)),
      evidence: clone(object(candidate.evidence)),
      approval: candidate.approval == null ? null : clone(candidate.approval),
      canon: candidate.canon == null ? null : clone(candidate.canon),
      speaker: candidate.speaker == null ? null : clone(candidate.speaker),
      rights: candidate.rights == null ? null : clone(candidate.rights),
      creatorApproval:
        candidate.creatorApproval == null
          ? null
          : clone(candidate.creatorApproval)
    };
  }

  function compareBaseline(left, right) {
    var leftRank = Number(left && left.baselineRank);
    var rightRank = Number(right && right.baselineRank);
    if (Number.isFinite(leftRank) && Number.isFinite(rightRank) && leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return (
      candidateScore(right) - candidateScore(left) ||
      candidateId(left).localeCompare(candidateId(right))
    );
  }

  function inventoryFingerprint(shorts) {
    var records = array(shorts).map(function (candidate) {
      return {
        id: candidateId(candidate),
        value: stableValue(candidate)
      };
    }).sort(function (left, right) {
      return left.id.localeCompare(right.id) ||
        stableJson(left.value).localeCompare(stableJson(right.value));
    });
    return fingerprint("cti1", records);
  }

  function normalizeChoice(value) {
    return clean(value).toUpperCase().replace(/[\s-]+/g, "_");
  }

  function pairKey(left, right) {
    return [candidateId(left), candidateId(right)].sort().join("|");
  }

  function pairRounds(candidates, baselineRankById, seed) {
    var usage = new Map();
    var sourceUsage = new Map();
    var usedPairs = new Set();
    candidates.forEach(function (candidate) {
      usage.set(candidateId(candidate), 0);
      sourceUsage.set(clean(candidate.sourceId), 0);
    });

    function compareForRound(left, right, roundIndex, side) {
      return (
        number(usage.get(candidateId(left))) - number(usage.get(candidateId(right))) ||
        number(sourceUsage.get(clean(left.sourceId))) -
          number(sourceUsage.get(clean(right.sourceId))) ||
        hash(seed + "|" + roundIndex + "|" + side + "|" + candidateId(left))
          .localeCompare(
            hash(seed + "|" + roundIndex + "|" + side + "|" + candidateId(right))
          ) ||
        number(baselineRankById.get(candidateId(left))) -
          number(baselineRankById.get(candidateId(right)))
      );
    }

    var baseRounds = [];
    for (var roundIndex = 0; roundIndex < BASE_ROUND_COUNT; roundIndex += 1) {
      var optionA = candidates.slice().sort(function (left, right) {
        return compareForRound(left, right, roundIndex, "A");
      })[0];
      var optionB = candidates
        .filter(function (candidate) {
          return (
            candidateId(candidate) !== candidateId(optionA) &&
            clean(candidate.sourceId) !== clean(optionA.sourceId) &&
            !usedPairs.has(pairKey(optionA, candidate))
          );
        })
        .sort(function (left, right) {
          return compareForRound(left, right, roundIndex, "B");
        })[0];
      if (!optionA || !optionB) {
        fail(
          "PAIRING_FAILED",
          "The eligible inventory cannot produce ten distinct source-diverse pairs."
        );
      }
      usedPairs.add(pairKey(optionA, optionB));
      usage.set(candidateId(optionA), number(usage.get(candidateId(optionA))) + 1);
      usage.set(candidateId(optionB), number(usage.get(candidateId(optionB))) + 1);
      sourceUsage.set(clean(optionA.sourceId), number(sourceUsage.get(clean(optionA.sourceId))) + 1);
      sourceUsage.set(clean(optionB.sourceId), number(sourceUsage.get(clean(optionB.sourceId))) + 1);
      var id = fingerprint(
        "ctr1",
        seed + "|base|" + roundIndex + "|" + candidateId(optionA) + "|" + candidateId(optionB)
      );
      baseRounds.push({
        id: id,
        index: roundIndex + 1,
        repeatOf: null,
        optionAId: candidateId(optionA),
        optionBId: candidateId(optionB)
      });
    }

    var firstRepeat = parseInt(hash(seed + "|repeat-one").slice(-4), 16) %
      BASE_ROUND_COUNT;
    var secondRepeat = parseInt(hash(seed + "|repeat-two").slice(-4), 16) %
      BASE_ROUND_COUNT;
    if (secondRepeat === firstRepeat) {
      secondRepeat = (secondRepeat + Math.floor(BASE_ROUND_COUNT / 2)) %
        BASE_ROUND_COUNT;
    }
    var repeatIndexes = [firstRepeat, secondRepeat].sort(function (left, right) {
      return left - right;
    });
    var repeats = repeatIndexes.map(function (baseIndex, offset) {
      var original = baseRounds[baseIndex];
      return {
        id: fingerprint(
          "ctr1",
          seed + "|repeat|" + offset + "|" + original.id
        ),
        index: BASE_ROUND_COUNT + offset + 1,
        repeatOf: original.id,
        optionAId: original.optionBId,
        optionBId: original.optionAId
      };
    });
    return baseRounds.concat(repeats);
  }

  function median(values) {
    var sorted = array(values).slice().sort(function (left, right) {
      return left - right;
    });
    if (!sorted.length) return 0;
    var middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : round((sorted[middle - 1] + sorted[middle]) / 2, 3);
  }

  function create(config) {
    var input = object(config);
    var clipLab = object(input.clipLab);
    var channelPack = object(input.channelPack);
    var identity = object(channelPack.identity);
    var adapter = object(input.adapter);
    var labels = normalizeLabels(adapter.labels);
    var dimensions = normalizeDimensions(adapter, labels);
    var channelId = clean(identity.channelId || identity.id || input.channelId);
    var channelPackFingerprint = clean(
      channelPack.fingerprint || input.channelPackFingerprint
    );
    var clipLabFingerprint = clean(clipLab.inputFingerprint);
    var goal = slug(input.goal || adapter.goal || "shorts-calibration");
    var maxRisk = clean(input.maxRisk || adapter.maxRisk || "MEDIUM").toUpperCase();

    if (!channelId) {
      fail("CHANNEL_ID_REQUIRED", "Creator Taste Calibration requires a channel ID.");
    }
    if (!channelPackFingerprint) {
      fail(
        "CHANNEL_PACK_FINGERPRINT_REQUIRED",
        "Creator Taste Calibration requires a compiled ChannelPack fingerprint."
      );
    }
    if (!clipLabFingerprint) {
      fail(
        "CLIP_LAB_FINGERPRINT_REQUIRED",
        "Creator Taste Calibration requires Clip Lab's input fingerprint."
      );
    }
    if (!RISK_ORDER[maxRisk]) {
      fail("INVALID_RISK_CAP", "Risk cap must be LOW, MEDIUM, HIGH, or HOLD.");
    }

    var inventory = array(clipLab.shorts).slice();
    if (!inventory.length && typeof clipLab.getShorts === "function") {
      inventory = array(clipLab.getShorts({})).slice();
    }
    if (!inventory.length) {
      fail("CLIP_INVENTORY_REQUIRED", "Creator Taste Calibration requires Clip Lab shorts.");
    }

    var seenCandidateIds = new Set();
    inventory.forEach(function (candidate) {
      var id = candidateId(candidate);
      if (!id || seenCandidateIds.has(id)) {
        fail(
          "INVALID_CLIP_INVENTORY",
          "Clip inventory requires unique non-empty candidate IDs.",
          { candidateId: id }
        );
      }
      seenCandidateIds.add(id);
    });

    var getEligible = typeof clipLab.getShorts === "function"
      ? array(clipLab.getShorts({ maxRisk: maxRisk }))
      : inventory;
    var eligible = getEligible
      .filter(function (candidate) {
        return exactLedgerReady(candidate) && riskAllowed(candidate, maxRisk);
      })
      .slice()
      .sort(compareBaseline);
    var eligibleById = new Map();
    eligible.forEach(function (candidate) {
      eligibleById.set(candidateId(candidate), candidate);
    });
    if (eligible.length < TOP_LIMIT) {
      fail(
        "INSUFFICIENT_ELIGIBLE_CANDIDATES",
        "Calibration requires at least twelve exact-ledger, non-HOLD eligible candidates.",
        { eligible: eligible.length, required: TOP_LIMIT }
      );
    }
    var eligibleSources = unique(eligible.map(function (candidate) {
      return candidate.sourceId;
    }));
    if (eligibleSources.length < 8) {
      fail(
        "INSUFFICIENT_SOURCE_DIVERSITY",
        "Calibration requires at least eight represented eligible sources.",
        { sources: eligibleSources.length, required: 8 }
      );
    }

    var baselineRankById = new Map();
    eligible.forEach(function (candidate, index) {
      baselineRankById.set(candidateId(candidate), index + 1);
    });
    var eligibleInventoryFingerprint = inventoryFingerprint(eligible);
    var binding = {
      channelId: channelId,
      channelPackFingerprint: channelPackFingerprint,
      clipLabFingerprint: clipLabFingerprint,
      inventoryFingerprint: inventoryFingerprint(inventory),
      eligibleInventoryFingerprint: eligibleInventoryFingerprint,
      maxRisk: maxRisk,
      goal: goal
    };
    var seed = stableJson(binding);
    var roundBlueprints = pairRounds(eligible, baselineRankById, seed);
    var roundDefinitions = roundBlueprints.map(function (blueprint) {
      return {
        id: blueprint.id,
        index: blueprint.index,
        label: labels.round + " " + String(blueprint.index).padStart(2, "0"),
        repeatOf: blueprint.repeatOf,
        repeatCheck: Boolean(blueprint.repeatOf),
        optionA: candidateCard(
          eligibleById.get(blueprint.optionAId),
          baselineRankById.get(blueprint.optionAId)
        ),
        optionB: candidateCard(
          eligibleById.get(blueprint.optionBId),
          baselineRankById.get(blueprint.optionBId)
        )
      };
    });
    var roundById = new Map(roundDefinitions.map(function (roundDefinition) {
      return [roundDefinition.id, roundDefinition];
    }));

    function decisionFor(roundDefinition, choice) {
      var selected = choice === "A"
        ? roundDefinition.optionA
        : choice === "B"
          ? roundDefinition.optionB
          : null;
      return {
        decisionId: fingerprint(
          "ctd1",
          stableJson(binding) + "|" + roundDefinition.id + "|" + choice
        ),
        roundId: roundDefinition.id,
        roundIndex: roundDefinition.index,
        repeatOf: roundDefinition.repeatOf,
        choice: choice,
        selectedCandidateId: selected ? selected.candidateId : null,
        selectedReceiptId: selected ? selected.receiptId : null,
        selectedSourceId: selected ? selected.sourceId : null,
        selectedReceiptAt: selected ? selected.receiptAt : null,
        selectedReceiptUrl: selected ? selected.receiptUrl : null,
        learningEligible: !roundDefinition.repeatOf && (choice === "A" || choice === "B"),
        excludedFromLearning:
          choice === "NEEDS_CONTEXT"
            ? "CONTEXT REVIEW REQUIRED"
            : roundDefinition.repeatOf
              ? "DETERMINISTIC REPEAT CHECK"
              : choice === "NEITHER"
                ? "NO PREFERENCE SIGNAL"
                : null,
        exactLedger: {
          optionA: {
            candidateId: roundDefinition.optionA.candidateId,
            receiptId: roundDefinition.optionA.receiptId,
            sourceId: roundDefinition.optionA.sourceId,
            receiptAt: roundDefinition.optionA.receiptAt,
            receiptUrl: roundDefinition.optionA.receiptUrl
          },
          optionB: {
            candidateId: roundDefinition.optionB.candidateId,
            receiptId: roundDefinition.optionB.receiptId,
            sourceId: roundDefinition.optionB.sourceId,
            receiptAt: roundDefinition.optionB.receiptAt,
            receiptUrl: roundDefinition.optionB.receiptUrl
          }
        }
      };
    }

    function featureModel(decisions) {
      var stats = new Map();
      function ensure(feature) {
        if (!stats.has(feature.key)) {
          stats.set(feature.key, {
            key: feature.key,
            dimensionId: feature.dimensionId,
            dimensionLabel: feature.dimensionLabel,
            valueId: feature.valueId,
            valueLabel: feature.valueLabel,
            wins: 0,
            losses: 0
          });
        }
        return stats.get(feature.key);
      }
      decisions.filter(function (decision) {
        return decision.learningEligible;
      }).forEach(function (decision) {
        var roundDefinition = roundById.get(decision.roundId);
        var winnerCard = decision.choice === "A"
          ? roundDefinition.optionA
          : roundDefinition.optionB;
        var loserCard = decision.choice === "A"
          ? roundDefinition.optionB
          : roundDefinition.optionA;
        var winner = eligibleById.get(winnerCard.candidateId);
        var loser = eligibleById.get(loserCard.candidateId);
        var winnerFeatures = featureValues(winner, dimensions);
        var loserFeatures = featureValues(loser, dimensions);
        var winnerKeys = new Set(winnerFeatures.map(function (feature) {
          return feature.key;
        }));
        var loserKeys = new Set(loserFeatures.map(function (feature) {
          return feature.key;
        }));
        winnerFeatures.forEach(function (feature) {
          if (!loserKeys.has(feature.key)) ensure(feature).wins += 1;
        });
        loserFeatures.forEach(function (feature) {
          if (!winnerKeys.has(feature.key)) ensure(feature).losses += 1;
        });
      });
      var features = Array.from(stats.values()).map(function (feature) {
        var exposure = feature.wins + feature.losses;
        var weight = round(
          clamp(
            ((feature.wins - feature.losses) / (exposure + 2)) * 3,
            -3,
            3
          ),
          3
        );
        return Object.assign({}, feature, {
          exposure: exposure,
          weight: weight
        });
      }).sort(function (left, right) {
        return (
          Math.abs(right.weight) - Math.abs(left.weight) ||
          left.key.localeCompare(right.key)
        );
      });
      return {
        method:
          "Explicit pair choices update only features that differ between the selected and unselected candidate. Each feature uses a shrunk win/loss balance; the total candidate adjustment is capped at ±6.",
        minimumPreferenceDecisions: MINIMUM_PREFERENCE_DECISIONS,
        learningDecisionCount: decisions.filter(function (decision) {
          return decision.learningEligible;
        }).length,
        modifierRange: [MODIFIER_MIN, MODIFIER_MAX],
        featureWeights: features,
        contextPolicy:
          "NEEDS_CONTEXT, NEITHER, and repeat-check decisions add zero preference weight.",
        authorityBoundary:
          "This model describes unauthenticated local choices. It is not creator approval, canon, humor truth, virality evidence, or a speaker claim."
      };
    }

    function scoreCandidate(candidate, model) {
      var weightByKey = new Map(model.featureWeights.map(function (feature) {
        return [feature.key, feature];
      }));
      var contributions = featureValues(candidate, dimensions).map(function (feature) {
        var learned = weightByKey.get(feature.key);
        return learned
          ? {
              key: learned.key,
              dimensionLabel: learned.dimensionLabel,
              valueLabel: learned.valueLabel,
              weight: learned.weight
            }
          : null;
      }).filter(function (feature) {
        return feature && feature.weight !== 0;
      }).sort(function (left, right) {
        return (
          Math.abs(right.weight) - Math.abs(left.weight) ||
          left.key.localeCompare(right.key)
        );
      });
      var raw = contributions.reduce(function (total, feature) {
        return total + feature.weight;
      }, 0);
      var modifier = round(clamp(raw, MODIFIER_MIN, MODIFIER_MAX), 3);
      return {
        modifier: modifier,
        contributions: contributions,
        reasons: contributions.slice(0, 3).map(function (feature) {
          return (
            feature.dimensionLabel +
            " / " +
            feature.valueLabel +
            (feature.weight > 0
              ? " was favored by explicit local choices."
              : " was deprioritized by explicit local choices.")
          );
        })
      };
    }

    function rankedCandidate(candidate, baselineRank, modifier, calibratedRank, reasons) {
      var card = candidateCard(candidate, baselineRank);
      return Object.assign({}, card, {
        baselineEditPriority: card.editPriority,
        preferenceModifier: round(modifier, 3),
        calibratedScore: round(card.editPriority + modifier, 3),
        calibratedRank: calibratedRank,
        calibrationReasons: array(reasons).slice()
      });
    }

    function shortlistResult(model) {
      var scored = eligible.map(function (candidate) {
        var preference = scoreCandidate(candidate, model);
        return {
          candidate: candidate,
          baselineRank: baselineRankById.get(candidateId(candidate)),
          modifier: preference.modifier,
          reasons: preference.reasons
        };
      }).sort(function (left, right) {
        return (
          round(candidateScore(right.candidate) + right.modifier, 3) -
            round(candidateScore(left.candidate) + left.modifier, 3) ||
          left.baselineRank - right.baselineRank ||
          candidateId(left.candidate).localeCompare(candidateId(right.candidate))
        );
      });
      var calibratedRankById = new Map();
      scored.forEach(function (item, index) {
        calibratedRankById.set(candidateId(item.candidate), index + 1);
      });
      var baseline = eligible.slice(0, TOP_LIMIT).map(function (candidate) {
        var baselineRank = baselineRankById.get(candidateId(candidate));
        return rankedCandidate(candidate, baselineRank, 0, baselineRank, []);
      });
      var calibrated = scored.slice(0, TOP_LIMIT).map(function (item) {
        return rankedCandidate(
          item.candidate,
          item.baselineRank,
          item.modifier,
          calibratedRankById.get(candidateId(item.candidate)),
          item.reasons
        );
      });
      return {
        baseline: baseline,
        calibrated: calibrated,
        allCalibratedRanks: calibratedRankById
      };
    }

    function repeatMetrics(decisions) {
      var decisionByRound = new Map(decisions.map(function (decision) {
        return [decision.roundId, decision];
      }));
      var checks = roundDefinitions.filter(function (roundDefinition) {
        return roundDefinition.repeatOf;
      }).map(function (repeatRound) {
        var originalDecision = decisionByRound.get(repeatRound.repeatOf);
        var repeatDecision = decisionByRound.get(repeatRound.id);
        function outcome(decision) {
          if (!decision || decision.choice === "NEEDS_CONTEXT") return null;
          if (decision.choice === "NEITHER") return "NEITHER";
          return decision.selectedCandidateId;
        }
        var originalOutcome = outcome(originalDecision);
        var repeatOutcome = outcome(repeatDecision);
        var scorable = originalOutcome != null && repeatOutcome != null;
        return {
          originalRoundId: repeatRound.repeatOf,
          repeatRoundId: repeatRound.id,
          sideOrderReversed: true,
          scorable: scorable,
          consistent: scorable ? originalOutcome === repeatOutcome : null,
          originalOutcome: originalOutcome,
          repeatOutcome: repeatOutcome
        };
      });
      var scored = checks.filter(function (check) {
        return check.scorable;
      });
      var consistent = scored.filter(function (check) {
        return check.consistent;
      }).length;
      return {
        required: REPEAT_COUNT,
        present: checks.length,
        scored: scored.length,
        consistent: consistent,
        consistencyPercent: scored.length
          ? round((consistent / scored.length) * 100, 1)
          : null,
        interpretation:
          "Repeat consistency is descriptive only. It is not identity authentication or a quality score.",
        checks: checks
      };
    }

    function protectedFieldAudit(items) {
      var groups = {
        sourceReceiptMutations: [
          "candidateId",
          "kind",
          "receiptId",
          "sourceId",
          "receiptAt",
          "timecode",
          "receiptUrl",
          "sourceTitle",
          "sourceType",
          "sourceDate"
        ],
        contentMutations: [
          "category",
          "topics",
          "entities",
          "durationSeconds",
          "excerpt"
        ],
        evidenceMutations: ["evidence"],
        riskMutations: ["risk"],
        approvalMutations: ["approval"],
        canonMutations: ["canon"],
        speakerMutations: ["speaker"],
        rightsMutations: ["rights"],
        creatorApprovalMutations: ["creatorApproval"]
      };
      var counts = Object.keys(groups).reduce(function (result, key) {
        result[key] = 0;
        return result;
      }, {});
      var baselineMutations = 0;
      var unknownCandidates = 0;
      var holdOverrides = 0;

      array(items).forEach(function (item) {
        var original = eligibleById.get(clean(item && item.candidateId));
        if (!original) {
          unknownCandidates += 1;
          return;
        }
        var baselineRank = baselineRankById.get(candidateId(original));
        var expected = candidateCard(original, baselineRank);
        Object.keys(groups).forEach(function (groupName) {
          var changed = groups[groupName].some(function (field) {
            return stableJson(item[field]) !== stableJson(expected[field]);
          });
          if (changed) counts[groupName] += 1;
        });
        if (
          number(item.editPriority) !== number(expected.editPriority) ||
          number(item.baselineEditPriority) !== number(expected.editPriority) ||
          number(item.baselineRank) !== number(expected.baselineRank)
        ) {
          baselineMutations += 1;
        }
        if (
          candidateRisk(original) === "HOLD" ||
          clean(item.risk && item.risk.label).toUpperCase() === "HOLD"
        ) {
          holdOverrides += 1;
        }
      });

      var protectedMutationTotal = unknownCandidates + baselineMutations +
        Object.keys(counts).reduce(function (total, key) {
          return total + counts[key];
        }, 0);
      return Object.assign({
        auditMethod:
          "Every emitted shortlist card is compared with a fresh protected projection of its bound eligible candidate.",
        comparedCards: array(items).length,
        unknownCandidates: unknownCandidates,
        holdOverrides: holdOverrides,
        baselineMutations: baselineMutations
      }, counts, {
        protectedMutationTotal: protectedMutationTotal,
        failClosed: true,
        creatorApprovalClaims: counts.creatorApprovalMutations +
          counts.approvalMutations,
        speakerClaims: counts.speakerMutations
      });
    }

    function coverageMetrics(decisions, shortlists) {
      var cards = [];
      roundDefinitions.forEach(function (roundDefinition) {
        cards.push(roundDefinition.optionA, roundDefinition.optionB);
      });
      var uniqueCards = new Map();
      cards.forEach(function (card) {
        uniqueCards.set(card.candidateId, card);
      });
      var sampled = Array.from(uniqueCards.values());
      var sampledCandidates = sampled.map(function (card) {
        return eligibleById.get(card.candidateId);
      });
      var coverage = {
        sources: unique(sampled.map(function (card) {
          return card.sourceId;
        })),
        categories: unique(sampled.map(function (card) {
          return card.category;
        })),
        topics: unique(sampled.reduce(function (values, card) {
          return values.concat(card.topics.map(function (topic) {
            return topic.label || topic.id;
          }));
        }, [])),
        entities: unique(sampled.reduce(function (values, card) {
          return values.concat(card.entities.map(function (entity) {
            return entity.label || entity.id;
          }));
        }, [])),
        runtimeBands: unique(sampledCandidates.map(function (candidate) {
          return runtimeBand(
            candidate.editWindow && candidate.editWindow.seconds != null
              ? candidate.editWindow.seconds
              : candidate.durationSeconds
          ).label;
        }))
      };
      var choiceBreakdown = CHOICES.reduce(function (counts, choice) {
        counts[choice] = decisions.filter(function (decision) {
          return decision.choice === choice;
        }).length;
        return counts;
      }, {});
      var exactOptions = decisions.reduce(function (count, decision) {
        return count + ["optionA", "optionB"].filter(function (key) {
          var ledger = decision.exactLedger[key];
          return Boolean(
            ledger.receiptId &&
            ledger.sourceId &&
            Number.isFinite(Number(ledger.receiptAt)) &&
            ledger.receiptAt >= 0 &&
            ledger.receiptUrl
          );
        }).length;
      }, 0);
      var calibratedByBaselineRank = new Map(
        shortlists.calibrated.map(function (item) {
          return [item.baselineRank, item];
        })
      );
      var positionChanges = shortlists.calibrated.filter(function (item, index) {
        return shortlists.baseline[index] &&
          shortlists.baseline[index].candidateId !== item.candidateId;
      }).length;
      var baselineIds = new Set(shortlists.baseline.map(function (item) {
        return item.candidateId;
      }));
      var calibratedIds = new Set(shortlists.calibrated.map(function (item) {
        return item.candidateId;
      }));
      var membershipChanges = Array.from(baselineIds).filter(function (id) {
        return !calibratedIds.has(id);
      }).length;
      var rankMovement = shortlists.calibrated.map(function (item) {
        return Math.abs(item.calibratedRank - item.baselineRank);
      });
      var protectedItems = shortlists.baseline.concat(shortlists.calibrated);
      var safety = protectedFieldAudit(protectedItems);
      if (safety.protectedMutationTotal || safety.holdOverrides) {
        fail(
          "PROTECTED_FIELD_MUTATION",
          "Creator Taste Calibration changed protected candidate state.",
          safety
        );
      }
      return {
        decisionsCompleted: decisions.length,
        decisionsRequired: ROUND_COUNT,
        choiceBreakdown: choiceBreakdown,
        learningDecisions: decisions.filter(function (decision) {
          return decision.learningEligible;
        }).length,
        needsContextExcluded: choiceBreakdown.NEEDS_CONTEXT,
        sampleCoverage: {
          uniqueCandidates: sampled.length,
          uniqueSources: coverage.sources.length,
          uniqueCategories: coverage.categories.length,
          uniqueTopics: coverage.topics.length,
          uniqueEntities: coverage.entities.length,
          runtimeBands: coverage.runtimeBands.length,
          values: coverage
        },
        exactLedger: {
          decisionOptions: decisions.length * 2,
          completeOptions: exactOptions,
          coveragePercent: decisions.length
            ? round((exactOptions / (decisions.length * 2)) * 100, 1)
            : 0
        },
        repeatChecks: repeatMetrics(decisions),
        shortlistDelta: {
          positionChanges: positionChanges,
          membershipChanges: membershipChanges,
          medianAbsoluteRankMovement: median(rankMovement),
          baselineUniqueSources: new Set(shortlists.baseline.map(function (item) {
            return item.sourceId;
          })).size,
          calibratedUniqueSources: new Set(shortlists.calibrated.map(function (item) {
            return item.sourceId;
          })).size,
          comparedBaselineRanks: calibratedByBaselineRank.size
        },
        safety: safety
      };
    }

    function artifactFor(decisions) {
      if (decisions.length !== ROUND_COUNT) {
        fail(
          "INCOMPLETE_SESSION",
          "All twelve calibration rounds, including both repeat checks, must be decided.",
          { completed: decisions.length, required: ROUND_COUNT }
        );
      }
      var learningCount = decisions.filter(function (decision) {
        return decision.learningEligible;
      }).length;
      if (learningCount < MINIMUM_PREFERENCE_DECISIONS) {
        fail(
          "INSUFFICIENT_PREFERENCE_DATA",
          "Calibration requires at least six explicit A/B preferences from the ten base rounds.",
          {
            learningDecisions: learningCount,
            required: MINIMUM_PREFERENCE_DECISIONS
          }
        );
      }
      var model = featureModel(decisions);
      var shortlists = shortlistResult(model);
      var metrics = coverageMetrics(decisions, shortlists);
      var artifact = {
        schema: SCHEMA,
        engineVersion: VERSION,
        productLabel: labels.product,
        status: "CALIBRATED LOCAL PREFERENCE / HUMAN APPROVAL NOT IMPLIED",
        operator: {
          label: labels.operator,
          authentication: "UNAUTHENTICATED LOCAL OPERATOR",
          creatorApproval: false,
          identityVerified: false
        },
        binding: clone(binding),
        labels: clone(labels),
        policy: {
          roundCount: ROUND_COUNT,
          baseRoundCount: BASE_ROUND_COUNT,
          repeatCount: REPEAT_COUNT,
          minimumPreferenceDecisions: MINIMUM_PREFERENCE_DECISIONS,
          maximumRisk: maxRisk,
          goal: goal,
          goalBoundary:
            "The V1 goal is a descriptive, fingerprint-bound calibration scope. It does not silently filter or widen the eligible Clip Lab inventory; maximumRisk remains the inventory gate.",
          holdCandidatesEligible: false,
          modifierRange: [MODIFIER_MIN, MODIFIER_MAX],
          mutationBoundary:
            "Calibration may only add a bounded ranking modifier. Baseline score/rank, source evidence, risk, approval, canon, and speaker state remain unchanged.",
          contextBoundary:
            "NEEDS_CONTEXT is a review route and contributes no preference signal.",
          authorityBoundary:
            "A local choice is not authenticated creator approval, canon, a comedy verdict, a virality claim, or a rights decision.",
          checksumBoundary:
            "The checksum is a deterministic consistency check, not a signature or proof of authorship."
        },
        featureDimensions: clone(dimensions),
        rounds: clone(roundDefinitions),
        decisionLedger: clone(decisions),
        preferenceModel: model,
        shortlists: {
          baseline: shortlists.baseline,
          calibrated: shortlists.calibrated
        },
        metrics: metrics
      };
      artifact.fingerprint = fingerprint("ctp1", {
        binding: artifact.binding,
        decisions: artifact.decisionLedger,
        model: artifact.preferenceModel,
        shortlists: artifact.shortlists
      });
      artifact.checksum = fingerprint("ct1", artifact);
      return deepFreeze(artifact);
    }

    function createSession() {
      var decisions = [];
      var finalArtifact = null;
      function progress() {
        var learning = decisions.filter(function (decision) {
          return decision.learningEligible;
        }).length;
        return {
          completed: decisions.length,
          required: ROUND_COUNT,
          remaining: ROUND_COUNT - decisions.length,
          learningDecisions: learning,
          minimumPreferenceDecisions: MINIMUM_PREFERENCE_DECISIONS,
          minimumReached: learning >= MINIMUM_PREFERENCE_DECISIONS,
          nextRoundId:
            decisions.length < roundDefinitions.length
              ? roundDefinitions[decisions.length].id
              : null,
          status:
            decisions.length < ROUND_COUNT
              ? "IN PROGRESS"
              : learning >= MINIMUM_PREFERENCE_DECISIONS
                ? "READY TO CALIBRATE"
                : "COMPLETE / INSUFFICIENT PREFERENCE DATA"
        };
      }
      var session = {
        getRounds: function () {
          return clone(roundDefinitions);
        },
        getCurrentRound: function () {
          return decisions.length < roundDefinitions.length
            ? clone(roundDefinitions[decisions.length])
            : null;
        },
        getProgress: function () {
          return progress();
        },
        getDecisionLedger: function () {
          return clone(decisions);
        },
        decide: function (roundId, choiceValue) {
          if (finalArtifact || decisions.length >= ROUND_COUNT) {
            fail("SESSION_CLOSED", "The completed calibration session is immutable.");
          }
          var expected = roundDefinitions[decisions.length];
          if (clean(roundId) !== expected.id) {
            fail(
              "ROUND_ORDER_MISMATCH",
              "Calibration decisions must follow the deterministic round order.",
              { expectedRoundId: expected.id, receivedRoundId: clean(roundId) }
            );
          }
          var choice = normalizeChoice(choiceValue);
          if (CHOICES.indexOf(choice) < 0) {
            fail(
              "INVALID_DECISION",
              "Choice must be A, B, NEITHER, or NEEDS_CONTEXT.",
              { choice: choiceValue }
            );
          }
          decisions.push(decisionFor(expected, choice));
          return progress();
        },
        finalize: function () {
          if (!finalArtifact) finalArtifact = artifactFor(decisions);
          return clone(finalArtifact);
        },
        exportJSON: function (indentation) {
          if (!finalArtifact) finalArtifact = artifactFor(decisions);
          return stableJson(finalArtifact, indentation == null ? 2 : indentation);
        }
      };
      return Object.freeze(session);
    }

    function parseArtifact(payload) {
      if (typeof payload === "string") {
        try {
          return JSON.parse(payload);
        } catch {
          fail("INVALID_EXPORT_JSON", "Creator Taste export is not valid JSON.");
        }
      }
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        fail("INVALID_EXPORT", "Creator Taste restore requires an exported object or JSON.");
      }
      return clone(payload);
    }

    function preflightArtifact(payload) {
      var artifact = parseArtifact(payload);
      if (artifact.schema !== SCHEMA || artifact.engineVersion !== VERSION) {
        fail(
          "UNSUPPORTED_EXPORT",
          "Creator Taste export schema or engine version is not supported."
        );
      }
      var suppliedChecksum = clean(artifact.checksum);
      var checksumInput = clone(artifact);
      delete checksumInput.checksum;
      var expectedChecksum = fingerprint("ct1", checksumInput);
      if (!suppliedChecksum || suppliedChecksum !== expectedChecksum) {
        fail(
          "CHECKSUM_MISMATCH",
          "Creator Taste export checksum does not match its contents."
        );
      }
      var artifactBinding = object(artifact.binding);
      if (clean(artifactBinding.channelId) !== binding.channelId) {
        fail("FOREIGN_CHANNEL", "Creator Taste export belongs to another channel.");
      }
      if (
        clean(artifactBinding.channelPackFingerprint) !==
        binding.channelPackFingerprint
      ) {
        fail(
          "FOREIGN_CHANNEL_PACK",
          "Creator Taste export belongs to another ChannelPack snapshot."
        );
      }
      if (clean(artifactBinding.clipLabFingerprint) !== binding.clipLabFingerprint) {
        fail(
          "FOREIGN_CLIP_LAB",
          "Creator Taste export belongs to another Clip Lab snapshot."
        );
      }
      if (clean(artifactBinding.goal) !== binding.goal) {
        fail(
          "FOREIGN_GOAL",
          "Creator Taste export belongs to another calibration goal."
        );
      }
      if (clean(artifactBinding.maxRisk).toUpperCase() !== binding.maxRisk) {
        fail(
          "FOREIGN_RISK_GATE",
          "Creator Taste export belongs to another maximum-risk gate."
        );
      }
      if (clean(artifactBinding.inventoryFingerprint) !== binding.inventoryFingerprint) {
        fail(
          "INVENTORY_CHANGED",
          "Creator Taste export does not match the current Clip Lab inventory."
        );
      }
      if (
        clean(artifactBinding.eligibleInventoryFingerprint) !==
        binding.eligibleInventoryFingerprint
      ) {
        fail(
          "ELIGIBLE_INVENTORY_CHANGED",
          "Creator Taste export does not match the current risk-gated eligible inventory."
        );
      }
      if (stableJson(artifact.rounds) !== stableJson(roundDefinitions)) {
        fail(
          "ROUND_BLUEPRINT_MISMATCH",
          "Creator Taste export round definitions do not match the current inventory."
        );
      }
      return artifact;
    }

    function restore(payload) {
      var artifact = preflightArtifact(payload);
      var decisions = array(artifact.decisionLedger);
      if (decisions.length !== ROUND_COUNT) {
        fail("INCOMPLETE_EXPORT", "Creator Taste export does not contain twelve decisions.");
      }
      var session = createSession();
      decisions.forEach(function (decision, index) {
        var expectedRound = roundDefinitions[index];
        if (
          clean(decision.roundId) !== expectedRound.id ||
          stableJson(decision) !==
            stableJson(decisionFor(expectedRound, normalizeChoice(decision.choice)))
        ) {
          fail(
            "DECISION_LEDGER_MISMATCH",
            "Creator Taste decision ledger does not match its deterministic rounds.",
            { index: index }
          );
        }
        session.decide(expectedRound.id, decision.choice);
      });
      var rebuilt = session.finalize();
      if (stableJson(rebuilt) !== stableJson(artifact)) {
        fail(
          "RECOMPUTE_MISMATCH",
          "Creator Taste export does not reproduce from its bound decision ledger."
        );
      }
      return session;
    }

    function verify(payload) {
      try {
        var restored = restore(payload);
        var artifact = restored.finalize();
        return {
          ok: true,
          fingerprint: artifact.fingerprint,
          checksum: artifact.checksum,
          issues: []
        };
      } catch (error) {
        if (!(error instanceof CreatorTasteCalibrationError)) throw error;
        return {
          ok: false,
          fingerprint: null,
          checksum: null,
          issues: [{
            code: error.code,
            message: error.message,
            details: error.details || null
          }]
        };
      }
    }

    var engine = {
      version: VERSION,
      schema: SCHEMA,
      binding: clone(binding),
      labels: clone(labels),
      policy: {
        rounds: ROUND_COUNT,
        baseRounds: BASE_ROUND_COUNT,
        repeatChecks: REPEAT_COUNT,
        minimumPreferenceDecisions: MINIMUM_PREFERENCE_DECISIONS,
        modifierRange: [MODIFIER_MIN, MODIFIER_MAX],
        maxRisk: maxRisk,
        goal: goal,
        goalBoundary:
          "Descriptive and fingerprint-bound in V1; it does not silently filter candidates."
      },
      inventory: {
        total: inventory.length,
        eligible: eligible.length,
        excluded: inventory.length - eligible.length,
        eligibleSources: eligibleSources.length,
        eligibleFingerprint: eligibleInventoryFingerprint
      },
      start: createSession,
      restore: restore,
      verify: verify
    };
    return deepFreeze(engine);
  }

  root.ShokkerCreatorTasteCalibration = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    CHOICES: CHOICES,
    CreatorTasteCalibrationError: CreatorTasteCalibrationError,
    create: create
  });
})(typeof window !== "undefined" ? window : globalThis);
