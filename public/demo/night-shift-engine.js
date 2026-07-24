(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var PRODUCT = "WWAM AFTER MIDNIGHT · NIGHT SHIFT";
  var PROGRESS_SCHEMA = "wwam-night-shift-progress/v1";
  var SHARE_PREFIX = "night-shift-v1";
  var EXCERPT_WORD_LIMIT = 16;
  var STALE_AFTER_DAYS = 7;
  var REQUIRED_ROLES = [
    "latest-indexed-source",
    "archive-callback",
    "playable-receipt",
    "trivia-or-choice",
    "closing-payoff",
  ];
  var MODES = [
    {
      id: "lore",
      label: "LORE AFTER HOURS",
      description: "A Lore Field Guide callback connects tonight to an older indexed receipt.",
    },
    {
      id: "chaos",
      label: "CHAOS CLOCK",
      description: "Riff Chemistry steers the shift toward high-escalation archive receipts.",
    },
    {
      id: "franchise",
      label: "FRANCHISE GRAVEYARD",
      description: "Every beat stays inside one cataloged commentary franchise.",
    },
  ];
  var EXCLUDED_LORE_RECEIPT_KINDS = new Set([
    "archive-source",
    "creator-context",
    "candidate-performance",
  ]);

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function normalized(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback == null ? 0 : fallback;
  }

  function serialCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce(function (result, key) {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
    }
    return value;
  }

  function stableJson(value) {
    return JSON.stringify(stableValue(value));
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function fingerprint(value) {
    var source = String(value == null ? "" : value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function stableSort(values, compare) {
    return array(values)
      .map(function (value, index) {
        return { value: value, index: index };
      })
      .sort(function (left, right) {
        return compare(left.value, right.value) || left.index - right.index;
      })
      .map(function (entry) {
        return entry.value;
      });
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.round(number(seconds)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var remainder = String(total % 60).padStart(2, "0");
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + remainder
      : minutes + ":" + remainder;
  }

  function boundedExcerpt(value) {
    var words = clean(value).split(/\s+/).filter(Boolean);
    var truncated = words.length > EXCERPT_WORD_LIMIT;
    return {
      text: words.slice(0, EXCERPT_WORD_LIMIT).join(" ") + (truncated ? " …" : ""),
      wordCount: Math.min(words.length, EXCERPT_WORD_LIMIT),
      sourceWordCount: words.length,
      truncated: truncated,
    };
  }

  function validDate(value) {
    var date = clean(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    var parsed = new Date(date + "T00:00:00Z");
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  }

  function dateKey(value, fallback) {
    var candidate = clean(value || fallback);
    if (!candidate) candidate = new Date().toISOString().slice(0, 10);
    if (!validDate(candidate)) {
      throw new Error("Night Shift dates must use a real YYYY-MM-DD calendar date.");
    }
    return candidate;
  }

  function dayNumber(value) {
    if (!validDate(value)) return null;
    return Math.floor(new Date(value + "T00:00:00Z").getTime() / 86400000);
  }

  function rawReceiptId(receipt) {
    return clean(receipt && (receipt.receiptId || receipt.id));
  }

  function receiptKey(receipt) {
    return [
      clean(receipt && receipt.sourceId),
      Math.round(number(receipt && (receipt.t == null ? receipt.at : receipt.t))),
      normalized(receipt && (receipt.category || receipt.label || receipt.kind || receipt.type)),
    ].join("|");
  }

  function isPlayable(receipt) {
    if (!receipt || !clean(receipt.sourceId)) return false;
    var at = number(receipt.t == null ? receipt.at : receipt.t, -1);
    return at >= 0 && /^https:\/\/www\.youtube\.com\/watch\?v=/.test(clean(receipt.url));
  }

  function receiptExcerpt(receipt) {
    return clean(receipt && (receipt.excerpt || receipt.quote));
  }

  function sourceDate(receipt, sourceById) {
    var source = sourceById.get(clean(receipt && receipt.sourceId));
    return clean((receipt && receipt.date) || (source && source.date));
  }

  function publicReceipt(raw, sourceById, provider) {
    if (!raw) return null;
    var sourceId = clean(raw.sourceId || (raw.receiptId ? raw.id : ""));
    var source = sourceById.get(sourceId) || {};
    var at = number(raw.t == null ? raw.at : raw.t, -1);
    var url = clean(raw.url);
    var excerpt = boundedExcerpt(receiptExcerpt(raw));
    if (!sourceId || at < 0 || !/^https:\/\/www\.youtube\.com\/watch\?v=/.test(url)) return null;
    return {
      receiptId: rawReceiptId(raw) || sourceId + ":" + Math.round(at),
      sourceId: sourceId,
      sourceType: clean(raw.sourceType || raw.source || source.type || "archive"),
      sourceTitle: clean(raw.sourceTitle || raw.title || source.title || sourceId),
      date: clean(raw.date || source.date),
      at: at,
      t: at,
      timecode: clean(raw.timecode) || formatTime(at),
      url: url,
      category: clean(raw.category || raw.label || raw.kind || raw.type || "INDEXED RECEIPT"),
      excerpt: excerpt.text,
      excerptWordCount: excerpt.wordCount,
      excerptSourceWordCount: excerpt.sourceWordCount,
      excerptWordLimit: EXCERPT_WORD_LIMIT,
      excerptTruncated: excerpt.truncated,
      evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
      archiveEvidenceLevel: clean(raw.evidenceLevel || raw.provenance && raw.provenance.basis || "indexed"),
      evidenceType: "caption-excerpt",
      provider: clean(provider || "WWAM archive"),
      speaker: null,
      speakerStatus: "not-diarized",
      trueOriginClaim: false,
      syntheticQuote: false,
      provenance: {
        timestampStatus: "indexed-timestamp",
        excerptStatus: "bounded-source-excerpt",
        speakerStatus: "not-diarized",
      },
    };
  }

  function evidenceList(rawReceipts, sourceById, provider) {
    var seen = new Set();
    return array(rawReceipts)
      .map(function (receipt) {
        return publicReceipt(receipt, sourceById, provider);
      })
      .filter(function (receipt) {
        if (!receipt) return false;
        var key = receiptKey(receipt);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function hashNumber(value) {
    return parseInt(fingerprint(value), 16) >>> 0;
  }

  function rotatingPick(values, selectionKey, day, usedKeys, identity) {
    var list = stableSort(array(values).filter(Boolean), function (left, right) {
      return clean(identity(left)).localeCompare(clean(identity(right)));
    });
    if (!list.length) return null;
    var offset = (Math.abs(day) + hashNumber(selectionKey)) % list.length;
    for (var step = 0; step < list.length; step += 1) {
      var candidate = list[(offset + step) % list.length];
      if (!usedKeys || !usedKeys.has(receiptKey(candidate))) return candidate;
    }
    return list[offset];
  }

  function latestFirst(left, right) {
    return clean(right.date).localeCompare(clean(left.date)) ||
      clean(left.id).localeCompare(clean(right.id));
  }

  function sanitizeLoreSubject(value) {
    return clean(value).replace(/^(?:Mike|J)\s+as\s+/i, "");
  }

  function modeDefinition(mode) {
    var target = normalized(mode || "lore");
    var match = MODES.find(function (candidate) {
      return candidate.id === target;
    });
    if (!match) throw new Error("Unknown Night Shift mode: " + mode);
    return match;
  }

  function parseInputs(input) {
    var request = input || {};
    var showcase = request.showcase || null;
    if (!showcase || !Array.isArray(showcase.sources) || !Array.isArray(showcase.receipts)) {
      throw new Error("Night Shift requires a created WWAM Showcase Engine instance.");
    }
    return {
      showcase: showcase,
      lore: request.lore || null,
      trivia: request.trivia || null,
      today: clean(request.today),
    };
  }

  function deriveInputFingerprint(showcase) {
    return clean(showcase.inputFingerprint) || fingerprint(
      array(showcase.sources).map(function (source) {
        return [source.id, source.date].join(":");
      }).join("|") + "|" + array(showcase.receipts).map(rawReceiptId).join("|")
    );
  }

  function snapshotState(journeyDate, indexedThrough, inputFingerprint) {
    var journeyDay = dayNumber(journeyDate);
    var snapshotDay = dayNumber(indexedThrough);
    if (journeyDay == null || snapshotDay == null) {
      return {
        journeyDate: journeyDate,
        indexedThrough: clean(indexedThrough) || "undated",
        inputFingerprint: inputFingerprint,
        ageDays: null,
        staleAfterDays: STALE_AFTER_DAYS,
        status: "unknown",
        isStale: true,
        notice: "Archive snapshot date is unavailable; treat recency as unknown.",
      };
    }
    var age = journeyDay - snapshotDay;
    if (age < 0) {
      return {
        journeyDate: journeyDate,
        indexedThrough: indexedThrough,
        inputFingerprint: inputFingerprint,
        ageDays: 0,
        staleAfterDays: STALE_AFTER_DAYS,
        status: "snapshot-after-journey-date",
        isStale: false,
        notice: "Archive snapshot is indexed through " + indexedThrough +
          ", after this shared Night Shift date.",
      };
    }
    var stale = age > STALE_AFTER_DAYS;
    return {
      journeyDate: journeyDate,
      indexedThrough: indexedThrough,
      inputFingerprint: inputFingerprint,
      ageDays: age,
      staleAfterDays: STALE_AFTER_DAYS,
      status: stale ? "stale" : age === 0 ? "current" : "recent",
      isStale: stale,
      notice: stale
        ? "Archive snapshot is indexed through " + indexedThrough + ", " + age +
          " days before this Night Shift. Newer uploads may be missing."
        : "Archive snapshot is indexed through " + indexedThrough + " (" + age +
          (age === 1 ? " day" : " days") + " behind this Night Shift).",
    };
  }

  function encodeSeedPart(value) {
    return encodeURIComponent(clean(value)).replace(/\|/g, "%7C");
  }

  function decodeSeedPart(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      throw new Error("Invalid Night Shift share seed.");
    }
  }

  function makeSeed(date, mode, franchise, variant, inputFingerprint) {
    return [
      SHARE_PREFIX,
      date,
      mode,
      encodeSeedPart(franchise || "ANY"),
      encodeSeedPart(variant || "daily"),
      inputFingerprint,
    ].join("|");
  }

  function parseSeed(seed) {
    var parts = clean(seed).split("|");
    if (parts.length !== 6 || parts[0] !== SHARE_PREFIX || !validDate(parts[1])) {
      throw new Error("Invalid Night Shift share seed.");
    }
    return {
      date: parts[1],
      mode: parts[2],
      franchise: decodeSeedPart(parts[3]) === "ANY" ? "" : decodeSeedPart(parts[3]),
      variant: decodeSeedPart(parts[4]),
      inputFingerprint: parts[5],
    };
  }

  function buildBeat(kind, roles, title, kicker, copy, evidence, integrations, interaction, extra) {
    var receipts = array(evidence);
    if (!receipts.length) throw new Error("Every Night Shift beat requires playable evidence.");
    return Object.assign({
      id: "",
      order: 0,
      kind: kind,
      roles: unique(roles),
      title: title,
      kicker: kicker,
      copy: copy,
      copyType: "derived-navigation-copy",
      source: {
        id: receipts[0].sourceId,
        type: receipts[0].sourceType,
        title: receipts[0].sourceTitle,
        date: receipts[0].date,
      },
      receiptIds: receipts.map(function (receipt) {
        return receipt.receiptId;
      }),
      evidence: receipts,
      evidenceCount: receipts.length,
      integrations: unique(integrations),
      interaction: interaction || null,
      requiredAction: interaction ? "choose" : "acknowledge",
      playable: receipts.every(function (receipt) {
        return /^https:\/\/www\.youtube\.com\/watch\?v=/.test(receipt.url);
      }),
      claimBoundary: {
        speakerClaimMade: false,
        trueOriginClaim: false,
        syntheticQuoteMade: false,
        copyBasis: "Source metadata plus bounded timestamped receipts.",
      },
    }, extra || {});
  }

  function mergeEvidence(left, right) {
    var seen = new Set();
    return array(left).concat(array(right)).filter(function (receipt) {
      var key = receiptKey(receipt);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function mergeBeats(left, right, kind, title, kicker) {
    return buildBeat(
      kind,
      left.roles.concat(right.roles),
      title,
      kicker,
      left.copy + " " + right.copy,
      mergeEvidence(left.evidence, right.evidence),
      left.integrations.concat(right.integrations),
      right.interaction || left.interaction,
      {
        mergedFrom: [left.kind, right.kind],
        requiredAction: right.interaction || left.interaction ? "choose" : "acknowledge",
      }
    );
  }

  function finalizeBeats(beats, seed) {
    return array(beats).map(function (beat, index) {
      beat.order = index + 1;
      beat.id = "night-beat:" + (index + 1) + ":" + fingerprint(
        seed + "|" + beat.roles.join(",") + "|" + beat.receiptIds.join(",")
      );
      return beat;
    });
  }

  function create(input) {
    var parsed = parseInputs(input);
    var showcase = parsed.showcase;
    var lore = parsed.lore;
    var trivia = parsed.trivia;
    var sources = stableSort(array(showcase.sources).map(function (source) {
      return Object.assign({}, source);
    }), function (left, right) {
      return clean(left.id).localeCompare(clean(right.id));
    });
    var sourceById = new Map(sources.map(function (source) {
      return [clean(source.id), source];
    }));
    var showcaseReceipts = array(showcase.receipts).filter(isPlayable);
    var showcaseReceiptById = new Map(showcaseReceipts.map(function (receipt) {
      return [rawReceiptId(receipt), receipt];
    }));
    var receiptsBySource = new Map();
    showcaseReceipts.forEach(function (receipt) {
      if (!receiptsBySource.has(receipt.sourceId)) receiptsBySource.set(receipt.sourceId, []);
      receiptsBySource.get(receipt.sourceId).push(receipt);
    });
    var inputFingerprint = deriveInputFingerprint(showcase);
    var datedSources = stableSort(
      sources.filter(function (source) {
        return validDate(source.date);
      }),
      latestFirst
    );
    var snapshotDate = clean(showcase.snapshotDate) ||
      (datedSources[0] && clean(datedSources[0].date)) ||
      "undated";
    var franchises = unique(sources.map(function (source) {
      return clean(source.franchise);
    })).sort();
    function resolveFranchise(requested, day, selectionKey) {
      if (requested) {
        var exact = franchises.find(function (franchise) {
          return normalized(franchise) === normalized(requested);
        });
        if (!exact) throw new Error("Unknown Night Shift franchise: " + requested);
        return exact;
      }
      return rotatingPick(
        franchises,
        selectionKey + "|franchise",
        day,
        null,
        function (value) { return value; }
      );
    }

    function scopedSources(mode, franchise) {
      var selected = mode === "franchise"
        ? sources.filter(function (source) {
          return normalized(source.franchise) === normalized(franchise);
        })
        : sources.slice();
      return selected.filter(function (source) {
        return validDate(source.date) && array(receiptsBySource.get(source.id)).length;
      });
    }

    function scopedShowcaseReceipts(sourceIds) {
      return showcaseReceipts.filter(function (receipt) {
        return sourceIds.has(receipt.sourceId);
      });
    }

    function loreCallbackCandidates(latestDate, sourceIds) {
      if (!lore || !Array.isArray(lore.fieldGuide) || typeof lore.getReceipt !== "function") return [];
      var candidates = [];
      lore.fieldGuide
        .filter(function (entry) {
          return ["bit", "topic", "motif"].indexOf(entry.kind) >= 0 &&
            entry.status !== "locked-needs-human-verification";
        })
        .forEach(function (entry) {
          array(entry.receiptIds).forEach(function (receiptId) {
            var receipt = lore.getReceipt(receiptId);
            if (!receipt || EXCLUDED_LORE_RECEIPT_KINDS.has(receipt.kind) || !isPlayable(receipt)) return;
            if (sourceIds && !sourceIds.has(receipt.sourceId)) return;
            if (!validDate(receipt.date) || receipt.date >= latestDate) return;
            candidates.push({
              receipt: receipt,
              subject: sanitizeLoreSubject(entry.name || entry.id),
              entryId: entry.id,
              entryKind: entry.kind,
              deepCutScore: number(entry.deepCutScore),
            });
          });
        });
      return candidates;
    }

    function chaosReceipts(latestDate, sourceIds) {
      if (!showcase.getRiffChemistry) return [];
      return array(showcase.getRiffChemistry().moments)
        .map(function (moment) {
          return showcaseReceiptById.get(moment.receiptId);
        })
        .filter(function (receipt) {
          return receipt && sourceIds.has(receipt.sourceId) &&
            (!latestDate || !validDate(receipt.date) || receipt.date < latestDate);
        });
    }

    function triviaComponent(seed, franchise, sourceByIdForJourney) {
      if (!trivia || typeof trivia.createSession !== "function") return null;
      for (var attempt = 0; attempt < 4; attempt += 1) {
        var sessionOptions = {
          seed: seed + "|tape-trivia|" + attempt,
          length: 5,
          difficulty: "mixed",
        };
        if (franchise) sessionOptions.franchise = franchise;
        try {
          var session = trivia.createSession(sessionOptions);
          var round = serialCopy(session.getCurrentRound());
          if (!round || !round.choices || !round.choices.length) continue;
          var proof = session.submit(round.choices[0].id);
          var proofEvidence = evidenceList(
            proof && proof.reveal && proof.reveal.receipts,
            sourceByIdForJourney,
            "WWAM Tape Trivia"
          );
          if (!proofEvidence.length) continue;
          return {
            interaction: {
              provider: "WWAM Tape Trivia",
              providerVersion: clean(trivia.version),
              type: "trivia",
              sessionOptions: sessionOptions,
              round: round,
              answerHidden: true,
              answerFieldsHidden: true,
              playableReceiptMayRevealAnswer: true,
              honorSystem: true,
              correctAnswerIncluded: false,
              evidenceNotice: clean(round.evidenceNotice),
              speakerNotice: clean(round.speakerNotice),
            },
            evidence: proofEvidence,
          };
        } catch {
          // A reduced archive may not have enough eligible Trivia material.
        }
      }
      return null;
    }

    function fallbackChoiceComponent(receipts) {
      var options = array(receipts).slice(0, 2);
      if (!options.length) return null;
      return {
        interaction: {
          provider: "Night Shift grounded preference",
          providerVersion: VERSION,
          type: "preference",
          prompt: "Which timestamp should the next Night Shift pin for you?",
          choices: options.map(function (receipt) {
            return {
              id: "receipt:" + receipt.receiptId,
              label: receipt.sourceTitle + " · " + receipt.timecode,
              detail: "NO CORRECT ANSWER · PLAYABLE RECEIPT",
              receiptId: receipt.receiptId,
            };
          }),
          answerHidden: false,
          correctAnswerIncluded: false,
          noCorrectAnswer: true,
        },
        evidence: options,
      };
    }

    function buildDaily(options) {
      var request = options || {};
      var mode = modeDefinition(request.mode);
      var journeyDate = dateKey(request.date, parsed.today);
      var day = dayNumber(journeyDate);
      var variant = clean(request.variant || "daily").replace(/\|/g, "-").slice(0, 60) || "daily";
      var preliminaryKey = [mode.id, variant, inputFingerprint].join("|");
      var franchise = mode.id === "franchise"
        ? resolveFranchise(clean(request.franchise), day, preliminaryKey)
        : "";
      var seed = makeSeed(journeyDate, mode.id, franchise, variant, inputFingerprint);
      var selectionKey = [mode.id, franchise || "ANY", variant, inputFingerprint].join("|");
      var scopeSources = scopedSources(mode.id, franchise);
      var sourceIds = new Set(scopeSources.map(function (source) { return source.id; }));
      var scopeReceipts = scopedShowcaseReceipts(sourceIds);
      if (scopeSources.length < 2 || scopeReceipts.length < 2) {
        throw new Error("Night Shift needs at least two dated playable sources to make an honest archive callback.");
      }
      var orderedSources = stableSort(scopeSources, latestFirst);
      var latestSource = orderedSources[0];
      var latestCandidates = array(receiptsBySource.get(latestSource.id));
      var used = new Set();
      var latestRaw = rotatingPick(
        latestCandidates,
        selectionKey + "|latest",
        day,
        used,
        rawReceiptId
      );
      used.add(receiptKey(latestRaw));
      var latestEvidence = evidenceList([latestRaw], sourceById, "WWAM Showcase Engine");

      var callbackRaw;
      var callbackSubject = "";
      var callbackIntegration = "WWAM Showcase Engine";
      var callbackDetails = {};
      if (mode.id === "lore") {
        var loreCandidates = loreCallbackCandidates(latestSource.date, sourceIds);
        var lorePick = rotatingPick(
          loreCandidates.filter(function (candidate) {
            return !used.has(receiptKey(candidate.receipt));
          }),
          selectionKey + "|lore-callback",
          day,
          null,
          function (candidate) {
            return candidate.entryId + "|" + rawReceiptId(candidate.receipt);
          }
        );
        if (lorePick) {
          callbackRaw = lorePick.receipt;
          callbackSubject = lorePick.subject;
          callbackIntegration = "WWAM Lore Engine";
          callbackDetails = {
            loreEntryId: lorePick.entryId,
            loreEntryKind: lorePick.entryKind,
            deepCutScore: lorePick.deepCutScore,
          };
        }
      } else if (mode.id === "chaos") {
        callbackRaw = rotatingPick(
          chaosReceipts(latestSource.date, sourceIds),
          selectionKey + "|chaos-callback",
          day,
          used,
          rawReceiptId
        );
        if (callbackRaw) callbackIntegration = "WWAM Showcase Engine · Riff Chemistry";
      }
      if (!callbackRaw) {
        callbackRaw = rotatingPick(
          scopeReceipts.filter(function (receipt) {
            return validDate(sourceDate(receipt, sourceById)) &&
              sourceDate(receipt, sourceById) < latestSource.date &&
              receipt.sourceId !== latestSource.id;
          }),
          selectionKey + "|archive-callback",
          day,
          used,
          rawReceiptId
        );
      }
      if (!callbackRaw) {
        throw new Error("Night Shift could not find an older receipt for an honest archive callback.");
      }
      used.add(receiptKey(callbackRaw));
      var callbackEvidence = evidenceList([callbackRaw], sourceById, callbackIntegration);

      var featurePool = mode.id === "chaos"
        ? chaosReceipts("", sourceIds)
        : scopeReceipts;
      var featureRaw = rotatingPick(
        featurePool,
        selectionKey + "|playable",
        day,
        used,
        rawReceiptId
      ) || latestRaw;
      used.add(receiptKey(featureRaw));
      var featureEvidence = evidenceList(
        [featureRaw],
        sourceById,
        mode.id === "chaos" ? "WWAM Showcase Engine · Riff Chemistry" : "WWAM Showcase Engine"
      );

      var closingRaw = rotatingPick(
        scopeReceipts,
        selectionKey + "|closing",
        day,
        used,
        rawReceiptId
      ) || callbackRaw;
      used.add(receiptKey(closingRaw));
      var closingEvidence = evidenceList([closingRaw], sourceById, "WWAM Showcase Engine");

      var triviaData = triviaComponent(seed, franchise, sourceById);
      var fallbackData = triviaData || fallbackChoiceComponent(
        mergeEvidence(featureEvidence, callbackEvidence)
      );
      if (!fallbackData) throw new Error("Night Shift could not build a source-grounded choice beat.");

      var latestBeat = buildBeat(
        "latest-source",
        ["latest-indexed-source"],
        "TONIGHT'S TRANSMISSION",
        "NEWEST DATED SOURCE IN SCOPE",
        latestSource.title + " (" + latestSource.date +
          ") is the newest dated source with a playable receipt in this Night Shift scope.",
        latestEvidence,
        ["WWAM Showcase Engine"],
        null,
        {
          scopeLatestDate: latestSource.date,
          latestSourceVerifiedBy: "date + playable receipt",
        }
      );
      var callbackBeat = buildBeat(
        "archive-callback",
        ["archive-callback"],
        "THE CALLBACK CAME BACK",
        mode.id === "lore" ? "LORE FILE REOPENED" : "OLDER TAPE RESURFACED",
        (callbackSubject ? callbackSubject + " resurfaces through " : "An older indexed receipt resurfaces through ") +
          callbackEvidence[0].sourceTitle + " (" + callbackEvidence[0].date +
          "). This is an archive callback, not a true-origin claim.",
        callbackEvidence,
        [callbackIntegration],
        null,
        Object.assign({
          archiveFirstLabel: "ARCHIVE CALLBACK · NOT A TRUE-ORIGIN CLAIM",
        }, callbackDetails)
      );
      var featureBeat = buildBeat(
        "playable-receipt",
        ["playable-receipt"],
        "PLAY THE TAPE",
        mode.id === "chaos" ? "RIFF CHEMISTRY PRESSURE SPIKE" : "TIMESTAMP OR IT DIDN'T HAPPEN",
        "The archive classifies this receipt as " + featureEvidence[0].category +
          ". Open the timestamp to judge the source context directly.",
        featureEvidence,
        [mode.id === "chaos" ? "WWAM Showcase Engine · Riff Chemistry" : "WWAM Showcase Engine"]
      );
      var choiceBeat = buildBeat(
        "trivia-choice",
        ["trivia-or-choice"],
        "ONE QUESTION BEFORE LAST CALL",
        triviaData ? "TAPE TRIVIA HANDOFF" : "GROUNDED PREFERENCE",
        triviaData
          ? "Tape Trivia supplies one bounded archive question; answer fields stay hidden until a choice is submitted. Opening its receipt is an honor-system reveal."
          : "Choose which exact timestamp the next shift should remember. This preference has no correct answer.",
        fallbackData.evidence,
        [fallbackData.interaction.provider],
        fallbackData.interaction
      );
      var closingBeat = buildBeat(
        "closing-payoff",
        ["closing-payoff"],
        "LAST CALL",
        "THE SHIFT CLOSES ON A RECEIPT",
        "The shift closes on " + closingEvidence[0].sourceTitle + " at " +
          closingEvidence[0].timecode +
          ". That timestamp—not generated dialogue—is tonight's payoff.",
        closingEvidence,
        ["WWAM Showcase Engine"]
      );

      var defaultBeatCount = scopeSources.length >= 3 && scopeReceipts.length >= 5 ? 5 : 3;
      var beatCount = defaultBeatCount;
      if (request.beatCount != null) {
        beatCount = number(request.beatCount, NaN);
        if (!Number.isInteger(beatCount) || beatCount < 3 || beatCount > 5) {
          throw new Error("Night Shift beatCount must be an integer from 3 through 5.");
        }
      }
      var beats = beatCount === 5
        ? [latestBeat, callbackBeat, featureBeat, choiceBeat, closingBeat]
        : beatCount === 4
          ? [
            latestBeat,
            callbackBeat,
            mergeBeats(
              featureBeat,
              choiceBeat,
              "receipt-choice",
              "PLAY IT, THEN CALL IT",
              "ONE RECEIPT · ONE GROUNDED CHOICE"
            ),
            closingBeat,
          ]
          : [
            mergeBeats(
              latestBeat,
              featureBeat,
              "latest-receipt",
              "TONIGHT'S TRANSMISSION",
              "NEWEST SOURCE · PLAYABLE RECEIPT"
            ),
            mergeBeats(
              callbackBeat,
              choiceBeat,
              "callback-choice",
              "THE CALLBACK CHOOSES YOU",
              "OLDER RECEIPT · GROUNDED CHOICE"
            ),
            closingBeat,
          ];
      beats = finalizeBeats(beats, seed);
      var allEvidence = beats.flatMap(function (beat) {
        return beat.evidence;
      });
      var rolesCovered = unique(beats.flatMap(function (beat) {
        return beat.roles;
      }));
      var limitations = [];
      if (!lore) limitations.push("Lore Engine unavailable; callback selection used Showcase receipts.");
      if (!triviaData) limitations.push("Tape Trivia unavailable for this scope; the interaction is a no-answer preference.");
      if (beatCount < 5) limitations.push("Reduced inventory or compact mode merged semantic roles into " + beatCount + " beats.");
      var snapshot = snapshotState(journeyDate, snapshotDate, inputFingerprint);
      if (snapshot.isStale) limitations.push(snapshot.notice);
      var journeyId = "night-shift:" + fingerprint(seed + "|" + beats.map(function (beat) {
        return beat.id;
      }).join("|"));
      return {
        product: PRODUCT,
        engine: "WWAM Night Shift",
        version: VERSION,
        id: journeyId,
        date: journeyDate,
        dateBasis: "explicit YYYY-MM-DD date key; no local-time conversion",
        mode: serialCopy(mode),
        franchise: franchise || null,
        variant: variant,
        seed: seed,
        share: {
          seed: seed,
          token: fingerprint(seed),
          parameter: "nightShift=" + encodeURIComponent(seed),
          recreationMethod: "createFromSeed(seed)",
        },
        snapshot: snapshot,
        scope: {
          sourceCount: scopeSources.length,
          playableReceiptCount: scopeReceipts.length,
          latestSourceId: latestSource.id,
          indexedThrough: latestSource.date,
          franchise: franchise || "ANY",
        },
        status: limitations.length ? "ready-with-boundaries" : "ready",
        limitations: limitations,
        beats: beats,
        rolesCovered: rolesCovered,
        completionContract: {
          schema: PROGRESS_SCHEMA,
          ordered: true,
          choiceRequiredWhenInteractionPresent: true,
          responsesReplayedFromChoiceIdOnRestore: true,
          methods: ["getState", "getCurrentBeat", "completeCurrent", "exportState"],
          restoreMethod: "restoreProgress(journey, snapshot)",
        },
        metrics: {
          beats: beats.length,
          rolesCovered: rolesCovered.length,
          uniqueReceipts: new Set(allEvidence.map(function (receipt) {
            return receiptKey(receipt);
          })).size,
          uniqueSources: new Set(allEvidence.map(function (receipt) {
            return receipt.sourceId;
          })).size,
          triviaBeats: beats.filter(function (beat) {
            return beat.interaction && beat.interaction.type === "trivia";
          }).length,
          preferenceBeats: beats.filter(function (beat) {
            return beat.interaction && beat.interaction.type === "preference";
          }).length,
          speakerClaims: 0,
          trueOriginClaims: 0,
          syntheticQuotes: 0,
        },
        evidencePolicy: {
          sourceGroundedOnly: true,
          excerptsAreBoundedSourceText: true,
          excerptWordLimit: EXCERPT_WORD_LIMIT,
          speakerAttribution: "No speaker is inferred from non-diarized captions.",
          originLanguage: "Archive callback is not a true-origin claim.",
          generatedDialogue: false,
          triviaProvider: triviaData ? "WWAM Tape Trivia" : "unavailable for this scope",
        },
      };
    }

    function fromSeed(seed) {
      var parsedSeed = parseSeed(seed);
      if (parsedSeed.inputFingerprint !== inputFingerprint) {
        throw new Error("Night Shift share seed belongs to a different archive snapshot.");
      }
      return buildDaily({
        date: parsedSeed.date,
        mode: parsedSeed.mode,
        franchise: parsedSeed.franchise,
        variant: parsedSeed.variant,
      });
    }

    function findInteractionBeat(journey, beatId) {
      if (!journey || journey.engine !== "WWAM Night Shift") {
        throw new Error("Choice resolution requires a Night Shift journey.");
      }
      return array(journey.beats).find(function (beat) {
        return beat.id === beatId && beat.interaction;
      }) || null;
    }

    function resolveChoice(journey, beatId, choiceId) {
      var beat = findInteractionBeat(journey, beatId);
      if (!beat) return { accepted: false, reason: "interaction-beat-not-found" };
      var interaction = beat.interaction;
      if (interaction.type === "preference") {
        var selected = array(interaction.choices).find(function (choice) {
          return choice.id === choiceId;
        });
        if (!selected) return { accepted: false, reason: "unknown-choice" };
        return {
          accepted: true,
          provider: interaction.provider,
          type: "preference",
          roundId: null,
          correct: null,
          selected: serialCopy(selected),
          answer: null,
          explanation: "This is a fan preference, not a factual quiz answer.",
          evidence: beat.evidence.filter(function (receipt) {
            return receipt.receiptId === selected.receiptId;
          }),
          accuracy: {
            speakerClaimMade: false,
            syntheticQuoteMade: false,
            trueOriginClaim: false,
          },
        };
      }
      if (!trivia || typeof trivia.createSession !== "function") {
        return { accepted: false, reason: "trivia-provider-unavailable" };
      }
      try {
        var session = trivia.createSession(serialCopy(interaction.sessionOptions));
        var round = session.getCurrentRound();
        if (!round || round.id !== interaction.round.id) {
          return { accepted: false, reason: "trivia-round-mismatch" };
        }
        var result = session.submit(choiceId);
        if (!result || !result.accepted) {
          return { accepted: false, reason: result && result.reason || "choice-rejected" };
        }
        var reveal = result.reveal || {};
        var accuracy = reveal.accuracy || {};
        if (accuracy.speakerClaimMade || accuracy.syntheticQuoteMade) {
          return { accepted: false, reason: "upstream-evidence-boundary-failed" };
        }
        var resolvedEvidence = evidenceList(reveal.receipts, sourceById, "WWAM Tape Trivia");
        if (!resolvedEvidence.length) {
          return { accepted: false, reason: "trivia-evidence-unavailable" };
        }
        return {
          accepted: true,
          provider: interaction.provider,
          type: "trivia",
          roundId: round.id,
          correct: Boolean(result.correct),
          selected: serialCopy(reveal.selected),
          answer: serialCopy(reveal.answer),
          explanation: clean(reveal.explanation),
          evidence: resolvedEvidence,
          accuracy: {
            basis: clean(accuracy.basis),
            speakerClaimMade: false,
            syntheticQuoteMade: false,
            trueOriginClaim: false,
            timestampStatus: clean(accuracy.timestampStatus || "indexed-timestamp"),
          },
        };
      } catch {
        return { accepted: false, reason: "trivia-provider-error" };
      }
    }

    function progressController(journey, restoredState) {
      if (!journey || journey.engine !== "WWAM Night Shift" || journey.version !== VERSION) {
        throw new Error("Progress requires a compatible Night Shift journey.");
      }
      var restored = restoredState ? serialCopy(restoredState) : null;
      var completed = [];
      var responses = {};
      if (restored) {
        if (restored.schema !== PROGRESS_SCHEMA ||
          restored.journeyId !== journey.id ||
          restored.seed !== journey.seed) {
          throw new Error("Night Shift progress snapshot does not match this journey.");
        }
        completed = array(restored.completedBeatIds).slice();
        for (var index = 0; index < completed.length; index += 1) {
          if (!journey.beats[index] || journey.beats[index].id !== completed[index]) {
            throw new Error("Night Shift progress must be an untampered ordered beat prefix.");
          }
        }
        responses = restored.responses && typeof restored.responses === "object"
          ? serialCopy(restored.responses)
          : {};
        completed.forEach(function (beatId, index) {
          var stored = responses[beatId];
          if (!stored || stored.accepted !== true) {
            throw new Error("Night Shift progress is missing an accepted response for a completed beat.");
          }
          var beat = journey.beats[index];
          var expected;
          if (beat.interaction) {
            var restoredChoiceId = clean(stored.choiceId);
            if (!restoredChoiceId) {
              throw new Error("Night Shift progress is missing the canonical choice ID for an interaction response.");
            }
            expected = resolveChoice(journey, beat.id, restoredChoiceId);
            if (!expected.accepted) {
              throw new Error("Night Shift progress choice no longer resolves against the canonical interaction.");
            }
            expected.choiceId = restoredChoiceId;
          } else {
            expected = {
              accepted: true,
              type: "acknowledged",
              choiceId: null,
            };
          }
          if (stableJson(stored) !== stableJson(expected)) {
            throw new Error("Night Shift progress response does not match the canonical beat result.");
          }
        });
        Object.keys(responses).forEach(function (beatId) {
          if (completed.indexOf(beatId) < 0) {
            throw new Error("Night Shift progress contains a response for an incomplete beat.");
          }
        });
      }

      function state() {
        var cursor = completed.length;
        var total = journey.beats.length;
        return {
          schema: PROGRESS_SCHEMA,
          journeyId: journey.id,
          seed: journey.seed,
          currentIndex: cursor,
          currentBeatId: cursor < total ? journey.beats[cursor].id : null,
          completedBeatIds: completed.slice(),
          responses: serialCopy(responses),
          progress: {
            completed: cursor,
            total: total,
            percent: total ? Math.round((cursor / total) * 100) : 100,
          },
          complete: cursor >= total,
        };
      }

      function completeCurrent(payload) {
        var current = state();
        if (current.complete) {
          return { accepted: false, reason: "journey-complete", state: current };
        }
        var beat = journey.beats[current.currentIndex];
        var response = {
          accepted: true,
          type: "acknowledged",
          choiceId: null,
        };
        if (beat.interaction) {
          var choiceId = clean(payload && payload.choiceId);
          if (!choiceId) {
            return { accepted: false, reason: "choice-required", state: current };
          }
          response = resolveChoice(journey, beat.id, choiceId);
          if (!response.accepted) {
            return { accepted: false, reason: response.reason, state: current };
          }
          response.choiceId = choiceId;
        }
        completed.push(beat.id);
        responses[beat.id] = serialCopy(response);
        return {
          accepted: true,
          beatId: beat.id,
          response: serialCopy(response),
          state: state(),
        };
      }

      return Object.freeze({
        getState: function () {
          return serialCopy(state());
        },
        getCurrentBeat: function () {
          var current = state();
          return current.complete ? null : serialCopy(journey.beats[current.currentIndex]);
        },
        completeCurrent: completeCurrent,
        exportState: function () {
          return serialCopy(state());
        },
      });
    }

    var metrics = {
      modes: MODES.length,
      indexedSources: sources.length,
      playableReceipts: showcaseReceipts.length,
      loreEntries: lore && Array.isArray(lore.fieldGuide) ? lore.fieldGuide.length : 0,
      triviaAvailable: Boolean(trivia && typeof trivia.createSession === "function"),
      archiveFingerprint: inputFingerprint,
      snapshotDate: snapshotDate,
      datedPlayableSources: sources.filter(function (source) {
        return validDate(source.date) && array(receiptsBySource.get(source.id)).length;
      }).length,
    };

    return Object.freeze({
      engine: "WWAM Night Shift",
      version: VERSION,
      product: PRODUCT,
      modes: serialCopy(MODES),
      metrics: metrics,
      evidencePolicy: {
        sourceGroundedOnly: true,
        excerptWordLimit: EXCERPT_WORD_LIMIT,
        speakerClaims: 0,
        trueOriginClaims: 0,
        syntheticQuotes: 0,
        excludedLoreReceiptKinds: Array.from(EXCLUDED_LORE_RECEIPT_KINDS),
      },
      createDaily: buildDaily,
      createFromSeed: fromSeed,
      parseSeed: parseSeed,
      getSnapshotState: function (date) {
        return snapshotState(dateKey(date, parsed.today), snapshotDate, inputFingerprint);
      },
      resolveChoice: resolveChoice,
      createProgress: function (journey) {
        return progressController(journey, null);
      },
      restoreProgress: function (journey, snapshot) {
        return progressController(journey, snapshot);
      },
    });
  }

  root.WWAMNightShiftEngine = Object.freeze({
    VERSION: VERSION,
    MODES: serialCopy(MODES),
    PROGRESS_SCHEMA: PROGRESS_SCHEMA,
    REQUIRED_ROLES: REQUIRED_ROLES.slice(),
    create: create,
    parseSeed: parseSeed,
  });
})(typeof window !== "undefined" ? window : globalThis);
