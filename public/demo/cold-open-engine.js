(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var COPY_LABEL = "SUGGESTED EDITORIAL COPY — NOT AN ARCHIVAL QUOTE";
  var CARD_LABEL = "SUGGESTED EDITORIAL CARD — NOT ARCHIVAL DIALOGUE";
  var WINDOW_LABEL = "PROPOSED MICRO-WINDOW — VERIFY CONTEXT AND FINAL CUT";
  var PUBLIC_EXCERPT_WORD_LIMIT = 16;
  var RISK_ORDER = { LOW: 1, MEDIUM: 2, HIGH: 3, HOLD: 4 };
  var EVIDENCE_ORDER = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  var FORMATS = Object.freeze({
    15: Object.freeze({
      seconds: 15,
      sourceSlots: 2,
      slots: Object.freeze([
        Object.freeze({ role: "HOOK", kind: "source", seconds: 6 }),
        Object.freeze({ role: "TURN", kind: "card", seconds: 2 }),
        Object.freeze({ role: "PAYOFF", kind: "source", seconds: 7 })
      ])
    }),
    30: Object.freeze({
      seconds: 30,
      sourceSlots: 3,
      slots: Object.freeze([
        Object.freeze({ role: "HOOK", kind: "source", seconds: 7 }),
        Object.freeze({ role: "BUILD", kind: "source", seconds: 8 }),
        Object.freeze({ role: "TURN", kind: "card", seconds: 2 }),
        Object.freeze({ role: "PAYOFF", kind: "source", seconds: 11 }),
        Object.freeze({ role: "BUTTON", kind: "card", seconds: 2 })
      ])
    }),
    60: Object.freeze({
      seconds: 60,
      sourceSlots: 5,
      slots: Object.freeze([
        Object.freeze({ role: "HOOK", kind: "source", seconds: 8 }),
        Object.freeze({ role: "SETUP", kind: "source", seconds: 10 }),
        Object.freeze({ role: "BUILD", kind: "source", seconds: 10 }),
        Object.freeze({ role: "TURN", kind: "card", seconds: 3 }),
        Object.freeze({ role: "ESCALATION", kind: "source", seconds: 12 }),
        Object.freeze({ role: "PAYOFF", kind: "source", seconds: 14 }),
        Object.freeze({ role: "BUTTON", kind: "card", seconds: 3 })
      ])
    }),
    90: Object.freeze({
      seconds: 90,
      sourceSlots: 7,
      slots: Object.freeze([
        Object.freeze({ role: "HOOK", kind: "source", seconds: 8 }),
        Object.freeze({ role: "SETUP", kind: "source", seconds: 10 }),
        Object.freeze({ role: "BUILD", kind: "source", seconds: 10 }),
        Object.freeze({ role: "ESCALATION", kind: "source", seconds: 11 }),
        Object.freeze({ role: "BREATH", kind: "card", seconds: 3 }),
        Object.freeze({ role: "CALLBACK", kind: "source", seconds: 11 }),
        Object.freeze({ role: "RAMP", kind: "source", seconds: 12 }),
        Object.freeze({ role: "PAYOFF", kind: "source", seconds: 15 }),
        Object.freeze({ role: "BUTTON", kind: "card", seconds: 10 })
      ])
    })
  });

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback || 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, number(value, min)));
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function clean(value) {
    return text(value).replace(/\s+/g, " ").trim();
  }

  function boundedExcerpt(value, maximumWords) {
    var words = clean(value).split(/\s+/).filter(Boolean);
    var limit = Math.max(1, Math.floor(number(maximumWords, PUBLIC_EXCERPT_WORD_LIMIT)));
    var truncated = words.length > limit;
    return {
      text: truncated ? words.slice(0, limit).join(" ") + "…" : words.join(" "),
      truncated: truncated,
      originalWordCount: words.length,
      publicWordLimit: limit
    };
  }

  function normalized(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function stableSort(values, compare) {
    return array(values)
      .map(function (value, index) {
        return { value: value, index: index };
      })
      .sort(function (a, b) {
        return compare(a.value, b.value) || a.index - b.index;
      })
      .map(function (entry) {
        return entry.value;
      });
  }

  function fingerprint(value) {
    var source = text(value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.floor(number(seconds)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = total % 60;
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0")
      : minutes + ":" + String(secs).padStart(2, "0");
  }

  function timestampUrl(url, seconds) {
    var base = clean(url).replace(/([?&])t=\d+s?(&|$)/, "$1").replace(/[?&]$/, "");
    if (!base) return "";
    return (
      base +
      (base.indexOf("?") >= 0 ? "&" : "?") +
      "t=" +
      Math.max(0, Math.floor(number(seconds))) +
      "s"
    );
  }

  function resolveClipLab(input) {
    var options = input || {};
    if (
      options.clipLab &&
      typeof options.clipLab.getShorts === "function" &&
      typeof options.clipLab.createClipManifest === "function"
    ) {
      return options.clipLab;
    }
    if (
      options.showcase &&
      root.WWAMCreatorClipLab &&
      typeof root.WWAMCreatorClipLab.create === "function"
    ) {
      return root.WWAMCreatorClipLab.create({ showcase: options.showcase });
    }
    throw new Error(
      "WWAMColdOpenFactory.create requires an existing Creator Clip Lab or Showcase result."
    );
  }

  function uniqueBy(values, field) {
    var seen = new Set();
    return array(values).filter(function (value) {
      var key = clean(value && value[field]);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function sameValues(left, right) {
    var a = array(left);
    var b = array(right);
    return a.length === b.length && a.every(function (value, index) {
      return value === b[index];
    });
  }

  function riskValue(candidate) {
    return number(candidate && candidate.risk && candidate.risk.score);
  }

  function evidenceValue(candidate) {
    return number(candidate && candidate.evidence && candidate.evidence.score);
  }

  function candidateHookScore(candidate) {
    var excerptWords = number(candidate.excerptWordCount);
    return (
      number(candidate.editPriority) * 0.6 +
      evidenceValue(candidate) * 0.22 -
      riskValue(candidate) * 0.2 +
      (excerptWords >= 6 && excerptWords <= 18 ? 8 : 0)
    );
  }

  function candidatePayoffScore(candidate) {
    return (
      number(candidate.editPriority) * 0.58 +
      number(candidate.scoreBreakdown && candidate.scoreBreakdown.receiptStrength) * 0.32 +
      evidenceValue(candidate) * 0.16 -
      riskValue(candidate) * 0.12
    );
  }

  function chronological(a, b) {
    return (
      clean(a.sourceDate).localeCompare(clean(b.sourceDate)) ||
      number(a.receiptAt) - number(b.receiptAt) ||
      clean(a.receiptId).localeCompare(clean(b.receiptId))
    );
  }

  function sourceDiverse(values) {
    var selected = [];
    var deferred = [];
    var sources = new Set();
    array(values).forEach(function (candidate) {
      if (!sources.has(candidate.sourceId)) {
        selected.push(candidate);
        sources.add(candidate.sourceId);
      } else {
        deferred.push(candidate);
      }
    });
    return selected.concat(deferred);
  }

  function modeForBundle(bundle) {
    if (bundle.anchorType === "character") return "CALLBACK LADDER";
    if (bundle.anchorType === "topic") return "ARCHIVE TIMELINE";
    return "CONTROLLED ESCALATION";
  }

  function maxSourceSlot(format) {
    return Math.max.apply(
      null,
      format.slots.filter(function (slot) {
        return slot.kind === "source";
      }).map(function (slot) {
        return slot.seconds;
      })
    );
  }

  function sequenceCandidates(bundle, format) {
    var required = format.sourceSlots;
    var minimumWindow = maxSourceSlot(format);
    var eligible = uniqueBy(bundle.segments, "receiptId").filter(function (candidate) {
      return (
        candidate.risk.label !== "HOLD" &&
        number(candidate.editWindow && candidate.editWindow.seconds) >= minimumWindow
      );
    });
    if (eligible.length < required) return [];

    var hook = stableSort(eligible, function (a, b) {
      return (
        candidateHookScore(b) - candidateHookScore(a) ||
        clean(a.receiptId).localeCompare(clean(b.receiptId))
      );
    })[0];
    var afterHook = eligible.filter(function (candidate) {
      return candidate.receiptId !== hook.receiptId;
    });
    var payoff = stableSort(afterHook, function (a, b) {
      return (
        candidatePayoffScore(b) - candidatePayoffScore(a) ||
        clean(a.receiptId).localeCompare(clean(b.receiptId))
      );
    })[0];
    var middle = afterHook.filter(function (candidate) {
      return candidate.receiptId !== payoff.receiptId;
    });
    if (modeForBundle(bundle) === "CONTROLLED ESCALATION") {
      middle = stableSort(middle, function (a, b) {
        return (
          number(a.editPriority) - number(b.editPriority) ||
          chronological(a, b)
        );
      });
    } else {
      middle = stableSort(middle, chronological);
    }
    middle = sourceDiverse(middle).slice(0, required - 2);
    if (middle.length !== required - 2) return [];
    return [hook].concat(middle, [payoff]);
  }

  function sourceWindow(candidate, seconds, role) {
    var originalIn = number(candidate.editWindow && candidate.editWindow.in);
    var originalOut = number(candidate.editWindow && candidate.editWindow.out);
    var receiptAt = number(candidate.receiptAt);
    var lead = role === "HOOK" ? 2 : role === "PAYOFF" ? 3 : 4;
    var latestStart = Math.max(originalIn, originalOut - seconds);
    var start = clamp(Math.floor(receiptAt) - lead, originalIn, latestStart);
    var end = start + seconds;
    return {
      in: start,
      out: end,
      seconds: seconds,
      inTimecode: formatTime(start),
      outTimecode: formatTime(end),
      receiptAt: receiptAt,
      receiptTimecode: candidate.timecode || formatTime(receiptAt),
      status: WINDOW_LABEL,
      withinClipLabWindow: start >= originalIn && end <= originalOut
    };
  }

  function sourcePurpose(role, mode) {
    var purposes = {
      HOOK: "Open on the strongest bounded receipt before any generated card appears.",
      SETUP: "Establish the shared archive anchor without naming an unverified speaker.",
      BUILD: "Add a second source-backed beat and increase edit density.",
      ESCALATION: "Raise observable receipt intensity; do not imply a factual escalation off tape.",
      CALLBACK: "Reconnect the anchor to a later indexed receipt.",
      RAMP: "Shorten the runway into the final source-backed beat.",
      PAYOFF: "Close on the strongest remaining receipt, then send viewers to full context."
    };
    return purposes[role] || "Advance the " + mode.toLowerCase() + " using a linked receipt.";
  }

  function cardCopy(role, anchor, mode) {
    if (role === "BUTTON") return "FULL CONTEXT LIVES IN THE ORIGINAL UPLOADS";
    if (role === "BREATH") {
      return mode === "ARCHIVE TIMELINE"
        ? "EARLIER / LATER IN THE INDEXED ARCHIVE"
        : "THE ARCHIVE WOULD LIKE A WORD";
    }
    return anchor.toUpperCase() + " // NEXT RECEIPT";
  }

  function titleFor(bundle, mode) {
    var label = clean(bundle.anchor).toUpperCase();
    if (mode === "CALLBACK LADDER") return label + ": COLD OPEN EMERGENCY";
    if (mode === "ARCHIVE TIMELINE") return label + ": THE ARCHIVE CUTS BACK";
    return label + ": ZERO-TO-CHAOS OPEN";
  }

  function aggregateEvidence(candidates) {
    var scores = candidates.map(evidenceValue);
    var minimum = Math.min.apply(null, scores);
    var average = Math.round(
      scores.reduce(function (sum, score) {
        return sum + score;
      }, 0) / scores.length
    );
    return {
      score: minimum,
      average: average,
      label: minimum >= 88 ? "HIGH" : minimum >= 70 ? "MEDIUM" : "LOW",
      basis:
        "The least-certain source receipt controls the storyboard evidence label."
    };
  }

  function aggregateRisk(candidates, format) {
    var base = Math.max.apply(null, candidates.map(riskValue));
    var compressionPenalty = format.seconds === 15 ? 12 : format.seconds === 30 ? 7 : 4;
    var score = clamp(base + compressionPenalty, 0, 100);
    var reasons = unique(
      candidates.flatMap(function (candidate) {
        return array(candidate.risk && candidate.risk.reasons);
      }).concat([
        "micro-windows-require-surrounding-context-review",
        format.seconds <= 30 ? "compressed-pacing-can-change-perceived-meaning" : ""
      ])
    );
    return {
      score: score,
      label: score >= 75 ? "HOLD" : score >= 48 ? "HIGH" : score >= 24 ? "MEDIUM" : "LOW",
      reasons: reasons,
      compressionPenalty: compressionPenalty,
      basis:
        "Highest underlying Clip Lab risk plus a transparent short-form compression penalty."
    };
  }

  function editorialPriority(candidates, risk) {
    var average = candidates.reduce(function (sum, candidate) {
      return sum + number(candidate.editPriority);
    }, 0) / candidates.length;
    return Math.round(clamp(average - risk.score * 0.12, 0, 100));
  }

  function buildStoryboard(bundle, format, inputFingerprint) {
    var candidates = sequenceCandidates(bundle, format);
    if (candidates.length !== format.sourceSlots) return null;
    var mode = modeForBundle(bundle);
    var sourceIndex = 0;
    var cursor = 0;
    var slots = format.slots.map(function (template, index) {
      var timelineIn = cursor;
      var timelineOut = cursor + template.seconds;
      cursor = timelineOut;
      if (template.kind === "card") {
        return {
          order: index + 1,
          role: template.role,
          kind: "editorial-card",
          timelineIn: timelineIn,
          timelineOut: timelineOut,
          seconds: template.seconds,
          copy: cardCopy(template.role, bundle.anchor, mode),
          copyLabel: CARD_LABEL,
          archivalQuote: false,
          generatedVoiceover: false,
          audioPolicy: "No generated host or character audio."
        };
      }
      var candidate = candidates[sourceIndex];
      sourceIndex += 1;
      var window = sourceWindow(candidate, template.seconds, template.role);
      var excerpt = boundedExcerpt(candidate.archivalExcerpt, PUBLIC_EXCERPT_WORD_LIMIT);
      return {
        order: index + 1,
        role: template.role,
        kind: "source-clip",
        timelineIn: timelineIn,
        timelineOut: timelineOut,
        seconds: template.seconds,
        receiptId: candidate.receiptId,
        sourceId: candidate.sourceId,
        sourceType: candidate.sourceType,
        sourceTitle: candidate.sourceTitle,
        sourceDate: candidate.sourceDate,
        sourceUrl: candidate.sourceUrl,
        sourceAtReceipt: candidate.receiptUrl,
        receiptAt: candidate.receiptAt,
        receiptTimecode: candidate.timecode,
        proposedSourceWindow: window,
        archivalExcerpt: excerpt.text,
        excerptTruncated: excerpt.truncated,
        originalExcerptWordCount: excerpt.originalWordCount,
        publicExcerptWordLimit: excerpt.publicWordLimit,
        excerptLabel: candidate.excerptLabel,
        category: candidate.category,
        topics: candidate.topics,
        characters: candidate.characters,
        editorialPurpose: sourcePurpose(template.role, mode),
        evidence: candidate.evidence,
        risk: candidate.risk,
        speakerCredit: null,
        speakerStatus: "NOT ASSIGNED BY COLD OPEN FACTORY",
        speakerBoundary:
          "Auto-captions are not speaker-diarized. Character metadata may name an owner-mapped recurring performer, but this slot does not convert that mapping into clip-level speaker proof.",
        mediaIncluded: false
      };
    });
    var sourceSlots = slots.filter(function (slot) {
      return slot.kind === "source-clip";
    });
    var sourceIds = unique(sourceSlots.map(function (slot) {
      return slot.sourceId;
    }));
    if (sourceIds.length < 2) return null;
    var evidence = aggregateEvidence(candidates);
    var risk = aggregateRisk(candidates, format);
    var id = "cold-open:" + format.seconds + ":" + fingerprint(
      [
        bundle.id,
        mode,
        sourceSlots.map(function (slot) {
          return slot.receiptId;
        }).join("|"),
        format.seconds
      ].join("::")
    );
    return {
      id: id,
      kind: "cold-open-storyboard",
      version: VERSION,
      formatSeconds: format.seconds,
      mode: mode,
      anchor: {
        type: bundle.anchorType,
        id: bundle.anchorId,
        label: bundle.anchor
      },
      title: titleFor(bundle, mode),
      copyLabel: COPY_LABEL,
      premise:
        "A source-backed " +
        format.seconds +
        "-second cold open built from a shared " +
        bundle.anchorType +
        " anchor.",
      slots: slots,
      hookReceiptId: sourceSlots[0].receiptId,
      payoffReceiptId: sourceSlots[sourceSlots.length - 1].receiptId,
      receiptIds: sourceSlots.map(function (slot) {
        return slot.receiptId;
      }),
      sourceIds: sourceIds,
      sourceCount: sourceIds.length,
      sourceClipCount: sourceSlots.length,
      editorialCardCount: slots.length - sourceSlots.length,
      evidence: evidence,
      risk: risk,
      editorialPriority: editorialPriority(candidates, risk),
      pacing: {
        exactRuntimeSeconds: cursor,
        sourceSeconds: sourceSlots.reduce(function (sum, slot) {
          return sum + slot.seconds;
        }, 0),
        cardSeconds: slots.filter(function (slot) {
          return slot.kind === "editorial-card";
        }).reduce(function (sum, slot) {
          return sum + slot.seconds;
        }, 0),
        sourceCutsPerMinute: Number(
          (sourceSlots.length / (format.seconds / 60)).toFixed(1)
        ),
        roles: slots.map(function (slot) {
          return slot.role;
        }),
        note:
          "Pacing is a deterministic edit proposal, not a prediction of retention or virality."
      },
      proofLedger: {
        receiptIds: sourceSlots.map(function (slot) {
          return slot.receiptId;
        }),
        sourceIds: sourceIds,
        exactTimestampedSlots: sourceSlots.length,
        unresolvedSlots: sourceSlots.filter(function (slot) {
          return !Number.isFinite(Number(slot.receiptAt)) || !slot.sourceAtReceipt;
        }).length,
        inferredSpeakersNamed: sourceSlots.filter(function (slot) {
          return Boolean(slot.speakerCredit);
        }).length,
        inputFingerprint: clean(inputFingerprint)
      },
      approvalGate: {
        status: risk.label === "HOLD" ? "HOLD" : "HUMAN EDIT REVIEW REQUIRED",
        requiredBeforePublish: [
          "Watch at least 15 seconds before and after every proposed source window.",
          "Set final picture and audio boundaries by ear.",
          "Confirm compressed sequencing does not reverse meaning.",
          "Do not add a host credit without clip-level human verification.",
          "Apply rights, language, and platform review."
        ]
      },
      rightsAndMedia:
        "Storyboard metadata only. No media is downloaded, copied, rendered, licensed, or published."
    };
  }

  function storyboardCompare(a, b) {
    return (
      number(b.editorialPriority) - number(a.editorialPriority) ||
      number(b.evidence.score) - number(a.evidence.score) ||
      number(a.risk.score) - number(b.risk.score) ||
      clean(a.id).localeCompare(clean(b.id))
    );
  }

  function choiceList(value) {
    return Array.isArray(value) ? value : value == null || value === "" ? [] : [value];
  }

  function includesChoice(values, choices) {
    var haystack = array(values).map(normalized);
    var needles = choiceList(choices).map(normalized).filter(Boolean);
    if (!needles.length) return true;
    return needles.some(function (needle) {
      return haystack.some(function (value) {
        return value === needle || value.indexOf(needle) >= 0 || needle.indexOf(value) >= 0;
      });
    });
  }

  function matchesStoryboard(storyboard, filters) {
    var options = filters || {};
    var format = number(options.format || options.duration);
    if (format && storyboard.formatSeconds !== format) return false;
    if (!includesChoice([storyboard.mode], options.mode)) return false;
    if (!includesChoice([storyboard.anchor.type], options.anchorType)) return false;
    var sourceSlots = storyboard.slots.filter(function (slot) {
      return slot.kind === "source-clip";
    });
    var topics = sourceSlots.flatMap(function (slot) {
      return slot.topics.map(function (topic) {
        return topic.id + " " + topic.label;
      });
    });
    var characters = sourceSlots.flatMap(function (slot) {
      return slot.characters.map(function (character) {
        return character.id + " " + character.label;
      });
    });
    var categories = sourceSlots.map(function (slot) {
      return slot.category;
    });
    if (!includesChoice(topics, options.topic)) return false;
    if (!includesChoice(characters, options.character)) return false;
    if (!includesChoice(categories, options.category)) return false;
    var maximumRisk = clean(options.maxRisk || options.risk).toUpperCase();
    if (
      maximumRisk &&
      number(RISK_ORDER[storyboard.risk.label], 4) > number(RISK_ORDER[maximumRisk], 4)
    ) {
      return false;
    }
    var minimumEvidence = clean(options.minEvidence).toUpperCase();
    if (
      minimumEvidence &&
      number(EVIDENCE_ORDER[storyboard.evidence.label], 1) <
        number(EVIDENCE_ORDER[minimumEvidence], 1)
    ) {
      return false;
    }
    var query = normalized(options.query);
    if (
      query &&
      normalized(
        [
          storyboard.title,
          storyboard.mode,
          storyboard.anchor.label,
          topics.join(" "),
          characters.join(" "),
          categories.join(" ")
        ].join(" ")
      ).indexOf(query) < 0
    ) {
      return false;
    }
    return true;
  }

  function limit(values, filters) {
    var requested = number(filters && filters.limit);
    return requested > 0 ? values.slice(0, requested) : values;
  }

  function exportSlot(storyboard, slot) {
    var base = {
      storyboardId: storyboard.id,
      storyboardFormatSeconds: storyboard.formatSeconds,
      order: slot.order,
      role: slot.role,
      kind: slot.kind,
      timelineIn: slot.timelineIn,
      timelineOut: slot.timelineOut,
      seconds: slot.seconds
    };
    if (slot.kind === "editorial-card") {
      return Object.assign(base, {
        copy: slot.copy,
        copyLabel: slot.copyLabel,
        archivalQuote: false,
        generatedVoiceover: false
      });
    }
    return Object.assign(base, {
      receiptId: slot.receiptId,
      sourceId: slot.sourceId,
      sourceTitle: slot.sourceTitle,
      sourceUrl: slot.sourceUrl,
      sourceAtReceipt: slot.sourceAtReceipt,
      receiptAt: slot.receiptAt,
      proposedSourceIn: slot.proposedSourceWindow.in,
      proposedSourceOut: slot.proposedSourceWindow.out,
      boundaryStatus: slot.proposedSourceWindow.status,
      archivalExcerpt: slot.archivalExcerpt,
      excerptTruncated: slot.excerptTruncated,
      originalExcerptWordCount: slot.originalExcerptWordCount,
      publicExcerptWordLimit: slot.publicExcerptWordLimit,
      excerptLabel: slot.excerptLabel,
      speakerCredit: null,
      speakerStatus: slot.speakerStatus,
      evidence: slot.evidence,
      risk: slot.risk,
      mediaIncluded: false
    });
  }

  function publicClipManifest(manifest) {
    if (!manifest || !Array.isArray(manifest.clips)) return manifest;
    return Object.assign({}, manifest, {
      clips: manifest.clips.map(function (clip) {
        var excerpt = boundedExcerpt(
          clip && clip.archivalExcerpt,
          PUBLIC_EXCERPT_WORD_LIMIT
        );
        return Object.assign({}, clip, {
          archivalExcerpt: excerpt.text,
          excerptTruncated: Boolean(clip.excerptTruncated) || excerpt.truncated,
          originalExcerptWordCount: Math.max(
            number(clip.originalExcerptWordCount),
            excerpt.originalWordCount
          ),
          publicExcerptWordLimit: excerpt.publicWordLimit
        });
      })
    });
  }

  function slotSignature(storyboard) {
    return array(storyboard && storyboard.slots).map(function (slot) {
      return {
        role: clean(slot.role),
        kind: clean(slot.kind),
        seconds: number(slot.seconds),
        receiptId: slot.kind === "source-clip" ? clean(slot.receiptId) : ""
      };
    });
  }

  function signatureValue(signature) {
    return array(signature).map(function (slot) {
      return [
        clean(slot && slot.role),
        clean(slot && slot.kind),
        number(slot && slot.seconds),
        clean(slot && slot.receiptId)
      ].join("|");
    });
  }

  function storyboardSnapshotFingerprint(snapshot) {
    return fingerprint(
      [
        clean(snapshot && snapshot.schema),
        clean(snapshot && snapshot.id),
        number(snapshot && snapshot.formatSeconds),
        array(snapshot && snapshot.receiptIds).join("|"),
        array(snapshot && snapshot.sourceIds).join("|"),
        signatureValue(snapshot && snapshot.slotSignature).join("~"),
        clean(snapshot && snapshot.inputFingerprint)
      ].join("::")
    );
  }

  function createStoryboardSnapshot(storyboard, inputFingerprint) {
    if (!storyboard || storyboard.kind !== "cold-open-storyboard") return null;
    var snapshot = {
      schema: "shokker.cold-open-storyboard-snapshot/v1",
      id: clean(storyboard.id),
      formatSeconds: number(storyboard.formatSeconds),
      receiptIds: array(storyboard.receiptIds).slice(),
      sourceIds: array(storyboard.sourceIds).slice(),
      slotSignature: slotSignature(storyboard),
      inputFingerprint: clean(inputFingerprint)
    };
    snapshot.proofFingerprint = storyboardSnapshotFingerprint(snapshot);
    return snapshot;
  }

  function createCampaign(factory, clipLab, selection, options) {
    var settings = options || {};
    var values = Array.isArray(selection) ? selection : selection ? [selection] : [];
    var requested = uniqueBy(values.filter(function (item) {
      return item && item.kind === "cold-open-storyboard";
    }), "id");
    if (requested.length > 24) {
      throw new RangeError("Cold Open campaign metadata is capped at 24 storyboards.");
    }
    var storyboards = requested.map(function (item) {
      return factory.get(item.id);
    });
    if (storyboards.some(function (storyboard) {
      return !storyboard;
    })) {
      throw new Error(
        "Cold Open campaign contains a storyboard missing from this deterministic factory build."
      );
    }
    var receiptIds = unique(storyboards.flatMap(function (storyboard) {
      return storyboard.receiptIds;
    }));
    var sourceIds = unique(storyboards.flatMap(function (storyboard) {
      return storyboard.sourceIds;
    }));
    var clipCandidates = receiptIds.map(function (receiptId) {
      return clipLab.fromReceipt(receiptId);
    });
    if (clipCandidates.some(function (candidate) {
      return !candidate;
    })) {
      throw new Error("Cold Open campaign contains a receipt missing from Creator Clip Lab.");
    }
    var name = clean(settings.name || "WWAM Cold Open Factory campaign");
    var campaignSeed = [
      name,
      storyboards.map(function (storyboard) {
        return storyboard.id;
      }).join("|"),
      receiptIds.join("|")
    ].join("::");
    var id = "cold-open-campaign:" + fingerprint(campaignSeed);
    var editDecisionList = storyboards.flatMap(function (storyboard) {
      return storyboard.slots.map(function (slot) {
        return exportSlot(storyboard, slot);
      });
    });
    var sourceSlots = editDecisionList.filter(function (slot) {
      return slot.kind === "source-clip";
    });
    var clipManifest = publicClipManifest(
      clipLab.createClipManifest(clipCandidates, {
        campaignId: id,
        name: name + " — source ledger"
      })
    );
    return {
      schema: "shokker.cold-open-campaign/v1",
      id: id,
      name: name,
      deterministicFingerprint: fingerprint(campaignSeed),
      factoryVersion: VERSION,
      inputFingerprint: factory.inputFingerprint,
      storyboardCount: storyboards.length,
      totalRuntimeSeconds: storyboards.reduce(function (sum, storyboard) {
        return sum + storyboard.formatSeconds;
      }, 0),
      formats: storyboards.map(function (storyboard) {
        return storyboard.formatSeconds;
      }),
      storyboardIds: storyboards.map(function (storyboard) {
        return storyboard.id;
      }),
      storyboards: storyboards,
      editDecisionList: editDecisionList,
      proofLedger: {
        receiptIds: receiptIds,
        sourceIds: sourceIds,
        receiptCount: receiptIds.length,
        sourceCount: sourceIds.length,
        timestampedSourceSlots: sourceSlots.length,
        unresolvedSourceSlots: sourceSlots.filter(function (slot) {
          return !slot.sourceAtReceipt || !Number.isFinite(Number(slot.receiptAt));
        }).length,
        inferredSpeakersNamed: sourceSlots.filter(function (slot) {
          return Boolean(slot.speakerCredit);
        }).length
      },
      clipLabManifest: clipManifest,
      approvalGate: {
        status: storyboards.some(function (storyboard) {
          return storyboard.risk.label === "HOLD";
        })
          ? "HOLD ITEMS PRESENT"
          : "HUMAN EDIT REVIEW REQUIRED",
        storyboardsRequiringReview: storyboards.length,
        publishAutomatically: false
      },
      mediaIncluded: false,
      exportBoundary:
        "Campaign metadata and source links only. No media, rights clearance, fabricated dialogue, or speaker inference."
    };
  }

  function facetCounts(storyboards, accessor) {
    var counts = new Map();
    storyboards.forEach(function (storyboard) {
      unique(accessor(storyboard)).forEach(function (value) {
        counts.set(value, number(counts.get(value)) + 1);
      });
    });
    return stableSort(
      Array.from(counts.entries()).map(function (entry) {
        return { value: entry[0], count: entry[1] };
      }),
      function (a, b) {
        return number(b.count) - number(a.count) || clean(a.value).localeCompare(clean(b.value));
      }
    );
  }

  function create(input) {
    var clipLab = resolveClipLab(input);
    var storyboards = stableSort(
      array(clipLab.supercuts).flatMap(function (bundle) {
        return Object.keys(FORMATS).map(function (seconds) {
          return buildStoryboard(bundle, FORMATS[seconds], clipLab.inputFingerprint);
        }).filter(Boolean);
      }),
      storyboardCompare
    );
    var byId = new Map(storyboards.map(function (storyboard) {
      return [storyboard.id, storyboard];
    }));
    var factory = {
      version: VERSION,
      inputFingerprint: fingerprint(
        [clipLab.inputFingerprint, VERSION, storyboards.map(function (item) {
          return item.id;
        }).join("|")].join("::")
      ),
      policy: {
        sourceOfTruth:
          "Creator Clip Lab supplies every source candidate, risk label, evidence label, and receipt.",
        copyLabel: COPY_LABEL,
        cardLabel: CARD_LABEL,
        speakerPolicy:
          "Cold Open Factory never assigns a speaker. Owner-mapped character metadata does not become clip-level speaker proof.",
        quotePolicy:
          "Public archival excerpts are capped at 16 words with visible truncation metadata. All new cards and titles are labeled editorial suggestions.",
        mediaPolicy:
          "No media downloading, copying, rendering, voice cloning, licensing, or publishing.",
        boundaryPolicy:
          "Every micro-window is an edit suggestion inside the broader Clip Lab window and requires context review."
      },
      metrics: {
        clipLabShorts: number(clipLab.metrics && clipLab.metrics.shortCandidates),
        clipLabSupercuts: number(clipLab.metrics && clipLab.metrics.supercutBundles),
        storyboards: storyboards.length,
        fifteenSecond: storyboards.filter(function (item) {
          return item.formatSeconds === 15;
        }).length,
        thirtySecond: storyboards.filter(function (item) {
          return item.formatSeconds === 30;
        }).length,
        sixtySecond: storyboards.filter(function (item) {
          return item.formatSeconds === 60;
        }).length,
        ninetySecond: storyboards.filter(function (item) {
          return item.formatSeconds === 90;
        }).length,
        uniqueReceipts: new Set(storyboards.flatMap(function (item) {
          return item.receiptIds;
        })).size,
        uniqueSources: new Set(storyboards.flatMap(function (item) {
          return item.sourceIds;
        })).size,
        heldStoryboards: storyboards.filter(function (item) {
          return item.risk.label === "HOLD";
        }).length,
        unresolvedSlots: storyboards.reduce(function (sum, item) {
          return sum + item.proofLedger.unresolvedSlots;
        }, 0),
        inferredSpeakersNamed: storyboards.reduce(function (sum, item) {
          return sum + item.proofLedger.inferredSpeakersNamed;
        }, 0),
        publicExcerptWordLimit: PUBLIC_EXCERPT_WORD_LIMIT,
        truncatedExcerptSlots: storyboards.reduce(function (sum, item) {
          return sum + item.slots.filter(function (slot) {
            return slot.kind === "source-clip" && slot.excerptTruncated;
          }).length;
        }, 0)
      },
      facets: {
        formats: facetCounts(storyboards, function (item) {
          return [String(item.formatSeconds)];
        }),
        modes: facetCounts(storyboards, function (item) {
          return [item.mode];
        }),
        anchors: facetCounts(storyboards, function (item) {
          return [item.anchor.label];
        }),
        risk: facetCounts(storyboards, function (item) {
          return [item.risk.label];
        }),
        evidence: facetCounts(storyboards, function (item) {
          return [item.evidence.label];
        })
      },
      storyboards: storyboards
    };
    factory.getStoryboards = function (filters) {
      return limit(storyboards.filter(function (storyboard) {
        return matchesStoryboard(storyboard, filters);
      }), filters);
    };
    factory.get = function (id) {
      return byId.get(clean(id)) || null;
    };
    factory.explain = function (id) {
      var storyboard = byId.get(clean(id));
      if (!storyboard) return null;
      return {
        id: storyboard.id,
        formatSeconds: storyboard.formatSeconds,
        mode: storyboard.mode,
        anchor: storyboard.anchor,
        editorialPriority: storyboard.editorialPriority,
        evidence: storyboard.evidence,
        risk: storyboard.risk,
        pacing: storyboard.pacing,
        proofLedger: storyboard.proofLedger,
        approvalGate: storyboard.approvalGate
      };
    };
    factory.snapshotStoryboard = function (item) {
      var storyboard = byId.get(clean(typeof item === "string" ? item : item && item.id));
      return createStoryboardSnapshot(storyboard, factory.inputFingerprint);
    };
    factory.restoreStoryboard = function (snapshot) {
      if (
        !snapshot ||
        snapshot.schema !== "shokker.cold-open-storyboard-snapshot/v1" ||
        !clean(snapshot.id) ||
        [15, 30, 60, 90].indexOf(number(snapshot.formatSeconds)) < 0 ||
        array(snapshot.receiptIds).length < 2 ||
        array(snapshot.receiptIds).length > 7 ||
        !sameValues(snapshot.receiptIds, unique(snapshot.receiptIds)) ||
        array(snapshot.sourceIds).length < 2 ||
        !sameValues(snapshot.sourceIds, unique(snapshot.sourceIds)) ||
        clean(snapshot.inputFingerprint) !== factory.inputFingerprint ||
        clean(snapshot.proofFingerprint) !== storyboardSnapshotFingerprint(snapshot)
      ) {
        return null;
      }
      var storyboard = byId.get(clean(snapshot.id));
      if (
        !storyboard ||
        storyboard.formatSeconds !== number(snapshot.formatSeconds) ||
        !sameValues(storyboard.receiptIds, snapshot.receiptIds) ||
        !sameValues(storyboard.sourceIds, snapshot.sourceIds) ||
        !sameValues(
          signatureValue(slotSignature(storyboard)),
          signatureValue(snapshot.slotSignature)
        )
      ) {
        return null;
      }
      return storyboard;
    };
    factory.createCampaignMetadata = function (selection, options) {
      return createCampaign(factory, clipLab, selection, options);
    };
    factory.exportCampaignMetadata = function (campaign, indentation) {
      return JSON.stringify(campaign, null, indentation == null ? 2 : indentation);
    };
    factory.createManifest = factory.createCampaignMetadata;
    factory.exportManifest = factory.exportCampaignMetadata;
    return factory;
  }

  root.WWAMColdOpenFactory = Object.freeze({
    VERSION: VERSION,
    FORMATS: FORMATS,
    labels: Object.freeze({
      editorialCopy: COPY_LABEL,
      editorialCard: CARD_LABEL,
      sourceWindow: WINDOW_LABEL,
      publicExcerptWordLimit: PUBLIC_EXCERPT_WORD_LIMIT
    }),
    create: create,
    formatTime: formatTime,
    timestampUrl: timestampUrl
  });
})(typeof window !== "undefined" ? window : globalThis);
