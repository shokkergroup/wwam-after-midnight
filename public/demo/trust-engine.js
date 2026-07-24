(function (root) {
  "use strict";

  var VERSION = "1.1.0";
  var YOUTUBE_WATCH = /^https:\/\/(?:www\.)?youtube\.com\/watch\?[^#]*\bv=([^&#]+)/i;
  var YOUTUBE_SHORT = /^https:\/\/youtu\.be\/([^?&#/]+)/i;
  var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  var SEVERITY_ORDER = { BLOCKER: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  var VERIFIED_LEVELS = new Set(["editor", "creator"]);

  var EVIDENCE_LEVELS = Object.freeze([
    Object.freeze({
      id: "creator",
      label: "CREATOR CERTIFIED",
      confidenceRange: "95–100",
      meaning:
        "A creator or authorized owner has certified the specific claim, not merely the general character mapping.",
      maySupport: [
        "canon metadata",
        "specific speaker attribution",
        "final editorial correction"
      ],
      mayNotSupport: ["claims beyond the exact certification"]
    }),
    Object.freeze({
      id: "editor",
      label: "EDITOR VERIFIED",
      confidenceRange: "78–94",
      meaning:
        "A human selected and checked the source, timestamp, and surrounding context.",
      maySupport: [
        "a bounded performance event",
        "a contextualized excerpt",
        "a labeled editorial finding"
      ],
      mayNotSupport: [
        "speaker identity when captions are not diarized",
        "a host's private or durable opinion"
      ]
    }),
    Object.freeze({
      id: "machine",
      label: "MACHINE SURFACED",
      confidenceRange: "40–77",
      meaning:
        "A deterministic process found the caption event, category, topic, or relationship.",
      maySupport: ["search", "discovery", "a review candidate"],
      mayNotSupport: [
        "speaker attribution",
        "character-performance canon",
        "an unlabeled opinion change"
      ]
    }),
    Object.freeze({
      id: "inference",
      label: "EVIDENCE-BASED INFERENCE",
      confidenceRange: "20–76",
      meaning:
        "The system connected multiple receipts into a timeline, argument, or pattern.",
      maySupport: ["a clearly labeled hypothesis", "an editor review queue"],
      mayNotSupport: ["canon without a human decision", "a fabricated quote"]
    }),
    Object.freeze({
      id: "locked",
      label: "LOCKED / INCOMPLETE",
      confidenceRange: "0–39",
      meaning:
        "A required source, transcript, performer identity, or review decision is absent.",
      maySupport: ["a contribution request"],
      mayNotSupport: ["public character generation", "canon claims"]
    })
  ]);

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

  function clean(value) {
    return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
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
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function words(value) {
    var body = clean(value);
    return body ? body.split(/\s+/).length : 0;
  }

  function fingerprint(value) {
    var source = clean(value);
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
      .sort(function (a, b) {
        return compare(a.value, b.value) || a.index - b.index;
      })
      .map(function (item) {
        return item.value;
      });
  }

  function compareSeverity(a, b) {
    return (
      number(SEVERITY_ORDER[a.severity], 9) -
        number(SEVERITY_ORDER[b.severity], 9) ||
      clean(a.kind).localeCompare(clean(b.kind)) ||
      clean(a.id).localeCompare(clean(b.id))
    );
  }

  function videoIdFromUrl(url) {
    var value = clean(url);
    var match = value.match(YOUTUBE_WATCH) || value.match(YOUTUBE_SHORT);
    return match ? clean(match[1]) : "";
  }

  function timestampUrl(source, seconds) {
    var base = clean(source && source.url);
    var t = Math.max(0, Math.floor(number(seconds)));
    if (!base) return "";
    if (!t) return base;
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + "t=" + t + "s";
  }

  function characterId(value) {
    var raw = clean(value);
    if (raw.indexOf("character:") === 0) return raw;
    return "character:" + slug(raw);
  }

  function internalCharacterReceiptId(soundbyte) {
    if (soundbyte && soundbyte.receiptId) return clean(soundbyte.receiptId);
    return "character-receipt:" + slug(soundbyte && soundbyte.id);
  }

  function confidenceBand(score) {
    var value = clamp(Math.round(score), 0, 100);
    if (value >= 95) return "CERTIFIED";
    if (value >= 78) return "SUPPORTED";
    if (value >= 40) return "PROVISIONAL";
    return "BLOCKED";
  }

  function makeConfidence(kind, id, score, factors, limits, capabilities) {
    var value = clamp(Math.round(score), 0, 100);
    return {
      kind: kind,
      id: clean(id),
      score: value,
      band: confidenceBand(value),
      factors: array(factors).filter(Boolean),
      limits: array(limits).filter(Boolean),
      capabilities: Object.assign(
        {
          searchable: true,
          displayableWithLabel: true,
          canonEligible: false
        },
        capabilities || {}
      )
    };
  }

  function asStreams(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    if (Array.isArray(data.streams)) return data.streams;
    if (Array.isArray(data.items)) return data.items;
    return [];
  }

  function resolveShowcase(input) {
    if (input.showcase) return input.showcase;
    if (!root.WWAMShowcaseEngine || typeof root.WWAMShowcaseEngine.create !== "function") {
      throw new Error(
        "WWAMTrustEngine requires a showcase instance or WWAMShowcaseEngine on the page."
      );
    }
    return root.WWAMShowcaseEngine.create({
      catalog: array(input.catalog),
      deep: input.deep || {},
      live: input.live || {},
      popular: input.popular || {},
      characters: input.characters || {},
      dna: input.dna || root.WWAM_CHANNEL_DNA || {}
    });
  }

  function resolveCorrectionRipple(showcase) {
    if (
      !root.WWAMCorrectionRippleEngine ||
      typeof root.WWAMCorrectionRippleEngine.create !== "function"
    ) {
      throw new Error(
        "WWAMTrustEngine requires WWAMCorrectionRippleEngine before trust-engine.js."
      );
    }
    return root.WWAMCorrectionRippleEngine.create({ showcase: showcase });
  }

  function rawSourceRegistry(input) {
    var registry = new Map();

    function add(item, lane, dataset) {
      var source = item || {};
      var id = clean(source.id || source.videoId);
      if (!id) return;
      if (!registry.has(id)) registry.set(id, []);
      registry.get(id).push({
        id: id,
        lane: lane,
        dataset: dataset,
        title: clean(source.title),
        date: clean(source.date),
        duration: number(source.duration),
        url: clean(source.url),
        captioned:
          source.captioned !== false &&
          source.transcript !== false
      });
    }

    array(input.catalog).forEach(function (item) {
      add(item, "commentary", "catalog");
    });
    asStreams(input.live).forEach(function (item) {
      add(item, "fresh-live", "fresh");
    });
    asStreams(input.popular).forEach(function (item) {
      add(item, "popular-live", "popular");
    });
    return registry;
  }

  function distinctValues(records, field) {
    return unique(
      array(records)
        .map(function (record) {
          return clean(record[field]);
        })
        .filter(Boolean)
    );
  }

  function sourceMethod(input, source) {
    if (source.lane === "popular-live") return clean(input.popular && input.popular.method);
    if (source.lane === "fresh-live") return clean(input.live && input.live.method);
    return clean(input.deep && input.deep.method);
  }

  function characterSoundbyteIndex(input) {
    var byReceiptId = new Map();
    var bySourceId = new Map();
    array(input.characters && input.characters.characters).forEach(function (character) {
      array(character.soundbytes || character.receipts || character.performances).forEach(
        function (soundbyte) {
          var enriched = {
            character: character,
            soundbyte: soundbyte,
            characterId: characterId(character.id || character.name || character.label),
            receiptId: internalCharacterReceiptId(soundbyte)
          };
          byReceiptId.set(enriched.receiptId, enriched);
          var sourceId = clean(soundbyte.sourceId || soundbyte.videoId);
          if (!bySourceId.has(sourceId)) bySourceId.set(sourceId, []);
          bySourceId.get(sourceId).push(enriched);
        }
      );
    });
    return { byReceiptId: byReceiptId, bySourceId: bySourceId };
  }

  function buildSourceHealth(input, showcase, sourceRecords, soundbytes, publicWordLimit) {
    var receiptsBySource = new Map();
    array(showcase.receipts).forEach(function (receipt) {
      if (!receiptsBySource.has(receipt.sourceId)) receiptsBySource.set(receipt.sourceId, []);
      receiptsBySource.get(receipt.sourceId).push(receipt);
    });

    return stableSort(
      array(showcase.sources).map(function (source) {
        var receipts = receiptsBySource.get(source.id) || [];
        var raw = sourceRecords.get(source.id) || [];
        var issues = [];
        var urlVideoId = videoIdFromUrl(source.url);
        var timestampFailures = receipts.filter(function (receipt) {
          return (
            !Number.isFinite(Number(receipt.t)) ||
            number(receipt.t) < 0 ||
            (number(source.duration) > 0 && number(receipt.t) > number(source.duration) + 1)
          );
        });
        var emptyExcerpts = receipts.filter(function (receipt) {
          return !clean(receipt.excerpt);
        });
        var longExcerpts = receipts.filter(function (receipt) {
          return words(receipt.excerpt) > publicWordLimit;
        });
        var metadataConflicts = ["title", "date", "duration", "url"].filter(function (field) {
          return distinctValues(raw, field).length > 1;
        });
        var itemProvenance = array(soundbytes.bySourceId.get(source.id)).length;

        if (!urlVideoId) issues.push("SOURCE_URL_INVALID");
        else if (urlVideoId !== source.id) issues.push("SOURCE_URL_ID_MISMATCH");
        if (!clean(source.title)) issues.push("TITLE_MISSING");
        if (!clean(source.date) || !ISO_DATE.test(clean(source.date))) issues.push("DATE_MISSING_OR_INVALID");
        if (number(source.duration) <= 0) issues.push("DURATION_MISSING");
        if (source.captioned === false) issues.push("CAPTIONS_UNAVAILABLE");
        if (source.captioned !== false && number(source.wordsAudited) <= 0) {
          issues.push("AUDITED_WORD_COUNT_MISSING");
        }
        if (source.captioned !== false && receipts.length === 0) issues.push("NO_RECEIPTS");
        if (timestampFailures.length) issues.push("TIMESTAMP_OUT_OF_RANGE");
        if (emptyExcerpts.length) issues.push("EMPTY_EXCERPT");
        if (metadataConflicts.length) issues.push("METADATA_CONFLICT");
        if (longExcerpts.length) issues.push("PUBLIC_EXCERPT_LIMIT");

        var blocked =
          issues.indexOf("SOURCE_URL_INVALID") >= 0 ||
          issues.indexOf("SOURCE_URL_ID_MISMATCH") >= 0 ||
          issues.indexOf("TIMESTAMP_OUT_OF_RANGE") >= 0 ||
          issues.indexOf("EMPTY_EXCERPT") >= 0;
        var limited = source.captioned === false;
        var review =
          issues.some(function (issue) {
            return [
              "TITLE_MISSING",
              "DATE_MISSING_OR_INVALID",
              "DURATION_MISSING",
              "AUDITED_WORD_COUNT_MISSING",
              "NO_RECEIPTS",
              "METADATA_CONFLICT"
            ].indexOf(issue) >= 0;
          }) && !blocked && !limited;
        var status = blocked ? "BLOCKED" : limited ? "LIMITED" : review ? "REVIEW" : "HEALTHY";
        var score = 100;
        if (!urlVideoId || urlVideoId !== source.id) score -= 45;
        if (!clean(source.title)) score -= 15;
        if (!clean(source.date) || !ISO_DATE.test(clean(source.date))) score -= 10;
        if (number(source.duration) <= 0) score -= 10;
        if (limited) score -= 45;
        if (source.captioned !== false && number(source.wordsAudited) <= 0) score -= 20;
        if (source.captioned !== false && receipts.length === 0) score -= 25;
        if (timestampFailures.length) score -= 35;
        if (emptyExcerpts.length) score -= 35;
        if (metadataConflicts.length) score -= 20;
        if (longExcerpts.length) score -= 5;
        score = clamp(score, 0, 100);

        return {
          id: source.id,
          title: source.title,
          lane: source.lane,
          lanes: array(source.lanes),
          url: source.url,
          date: source.date,
          duration: number(source.duration),
          captioned: source.captioned !== false,
          wordsAudited: number(source.wordsAudited),
          status: status,
          score: score,
          archiveReady: status === "HEALTHY",
          publicExcerptReady: longExcerpts.length === 0,
          canonClaimReady: false,
          issues: issues,
          provenance: {
            mode:
              itemProvenance > 0
                ? "dataset-method-plus-item-provenance"
                : source.captioned === false
                  ? "metadata-only"
                  : "dataset-method",
            method: sourceMethod(input, source),
            itemProvenanceReceipts: itemProvenance,
            caution:
              "A valid source and timestamp prove where an excerpt came from; they do not by themselves prove speaker, target, or intent."
          },
          receiptCoverage: {
            total: receipts.length,
            machine: receipts.filter(function (item) {
              return item.evidenceLevel === "machine";
            }).length,
            editor: receipts.filter(function (item) {
              return item.evidenceLevel === "editor";
            }).length,
            creator: receipts.filter(function (item) {
              return item.evidenceLevel === "creator";
            }).length,
            invalidTimestamps: timestampFailures.length,
            emptyExcerpts: emptyExcerpts.length,
            overPublicWordLimit: longExcerpts.length
          },
          metadataConflicts: metadataConflicts,
          confidence: makeConfidence(
            "source",
            source.id,
            score,
            [
              urlVideoId === source.id ? "YouTube URL resolves to the indexed source ID." : "",
              source.captioned !== false && number(source.wordsAudited) > 0
                ? number(source.wordsAudited).toLocaleString("en-US") +
                  " caption words were audited."
                : "",
              receipts.length
                ? receipts.length + " timestamped receipts resolve to this source."
                : "",
              itemProvenance
                ? itemProvenance + " human-curated character receipts include item provenance."
                : ""
            ],
            [
              source.captioned === false ? "No transcript is available for semantic claims." : "",
              longExcerpts.length
                ? longExcerpts.length +
                  " receipts exceed the configured public excerpt limit and require display trimming."
                : "",
              "Auto-captions are not a speaker-labeled transcript."
            ],
            {
              searchable: status !== "BLOCKED",
              displayableWithLabel: status !== "BLOCKED",
              canonEligible: false
            }
          )
        };
      }),
      function (a, b) {
        return a.id.localeCompare(b.id);
      }
    );
  }

  function explicitOpinionAssessment(receipt, subject, subjectType) {
    var body = normalized(receipt && receipt.excerpt);
    var target = normalized(subject)
      .replace(/\bfranchise\b$/, "")
      .replace(/\blive topic\b$/, "")
      .trim();
    var sentiment = clean(receipt && receipt.sentiment).toLowerCase();
    var positive =
      /\b(love|loved|favorite|best|great|amazing|awesome|excellent|perfect|rules)\b/.test(
        body
      );
    var negative =
      /\b(hate|hated|worst|bad|terrible|awful|garbage|sucks|sucked|ruined)\b/.test(
        body
      );
    var negativeNegationPattern =
      /\b(not|isnt|isn t|wasnt|wasn t|was not|is not|aint|ain t|never)\s+(that\s+)?(bad|terrible|awful|garbage|the worst)\b|\b(dont|don t) hate\b/g;
    var positiveNegationPattern =
      /\b(not|isnt|isn t|wasnt|wasn t|was not|is not|aint|ain t|never)\s+(that\s+)?(good|great|amazing|awesome|perfect|the best)\b/g;
    var negativeNegationFound = negativeNegationPattern.test(body);
    negativeNegationPattern.lastIndex = 0;
    var positiveNegationFound = positiveNegationPattern.test(body);
    positiveNegationPattern.lastIndex = 0;
    var negativeAfterNegation = body
      .replace(negativeNegationPattern, " ")
      .replace(/\s+/g, " ");
    var positiveAfterNegation = body
      .replace(positiveNegationPattern, " ")
      .replace(/\s+/g, " ");
    var negativeNegated =
      negativeNegationFound &&
      !/\b(hate|hated|worst|bad|terrible|awful|garbage|sucks|sucked|ruined)\b/.test(
        negativeAfterNegation
      );
    var positiveNegated =
      positiveNegationFound &&
      !/\b(love|loved|favorite|best|great|amazing|awesome|excellent|perfect|rules)\b/.test(
        positiveAfterNegation
      );
    var scoped =
      /\b(this|that|the)\s+(movie|film|sequel|franchise|series)\b/.test(body) ||
      /\b(my|our)\s+favorite\s+(movie|film|sequel|franchise|series)\b/.test(body) ||
      /\b(one of|the)\s+(best|worst)\s+(movie|movies|film|films|sequel|sequels|franchise|franchises)\b/.test(
        body
      );
    var targetExplicit = target.length >= 3 && body.indexOf(target) >= 0;
    var subjectOpinion =
      targetExplicit &&
      new RegExp(
        "(love|loved|hate|hated|favorite|best|worst|great|amazing|awesome|terrible|awful|garbage|sucks|rules)"
      ).test(body);
    var direct = scoped || subjectOpinion;
    if (subjectType === "topic" && !targetExplicit) direct = false;

    var polaritySupported =
      sentiment === "positive"
        ? positive && !positiveNegated
        : sentiment === "negative"
          ? negative && !negativeNegated
          : false;
    var contradiction =
      (sentiment === "negative" && negativeNegated) ||
      (sentiment === "positive" && positiveNegated);

    return {
      direct: direct && polaritySupported && !contradiction,
      scopeExplicit: scoped,
      targetExplicit: targetExplicit,
      polaritySupported: polaritySupported,
      contradiction: contradiction,
      reason: contradiction
        ? "The lexical polarity is reversed by nearby negation."
        : !direct
          ? "The excerpt does not explicitly rate the whole subject."
          : !polaritySupported
            ? "The excerpt does not directly support the assigned polarity."
            : "The excerpt explicitly connects evaluative language to the subject or whole work."
    };
  }

  function buildReceiptConfidence(showcase, sourceHealth, soundbytes, publicWordLimit) {
    var healthById = new Map(
      sourceHealth.map(function (item) {
        return [item.id, item];
      })
    );
    return stableSort(
      array(showcase.receipts).map(function (receipt) {
        var level = clean(receipt.evidenceLevel || "machine").toLowerCase();
        var score = level === "creator" ? 96 : level === "editor" ? 84 : 58;
        var source = healthById.get(receipt.sourceId);
        var rawPerformance = soundbytes.byReceiptId.get(receipt.id);
        var longExcerpt = words(receipt.excerpt) > publicWordLimit;
        var truncated = /…|\.\.\.$/.test(clean(receipt.excerpt));
        var factors = [];
        var limits = [];
        if (source && source.status !== "BLOCKED") {
          score += 4;
          factors.push("The source ID, YouTube URL, and timestamp resolve inside the index.");
        } else {
          score -= 25;
          limits.push("Source resolution is incomplete.");
        }
        if (rawPerformance) {
          score = Math.round(
            clamp(number(rawPerformance.soundbyte.confidence, 0.8) * 100, 0, 100) * 0.72 +
              22
          );
          factors.push("A human-curated character soundbyte carries exact-event provenance.");
          limits.push(
            "The performance event is verified, but the auto-caption track does not identify which host is speaking."
          );
        } else if (receipt.type === "character-performance") {
          score -= 35;
          limits.push(
            "This character-performance receipt is not present in the curated character soundbyte set."
          );
        }
        if (longExcerpt) {
          score -= 6;
          limits.push("The excerpt exceeds the configured public quote limit.");
        }
        if (truncated) {
          score -= 5;
          limits.push("The public excerpt is intentionally truncated; surrounding context remains in the source.");
        }
        if (level === "machine") {
          limits.push(
            "Category, subject, intent, and speaker have not been certified by a human."
          );
        }
        score = clamp(score, 0, 100);
        return makeConfidence(
          "receipt",
          receipt.id,
          score,
          factors,
          limits,
          {
            searchable: Boolean(source && source.status !== "BLOCKED"),
            displayableWithLabel: Boolean(source && source.status !== "BLOCKED"),
            canonEligible: level === "creator",
            performanceEventVerified: Boolean(rawPerformance),
            specificSpeakerVerified: false,
            wholeWorkOpinionVerified: false
          }
        );
      }),
      function (a, b) {
        return a.id.localeCompare(b.id);
      }
    );
  }

  function buildCharacterAudits(input, showcase, sourceHealth, soundbytes, publicWordLimit) {
    var sourceById = new Map(
      array(showcase.sources).map(function (source) {
        return [source.id, source];
      })
    );
    var receiptById = new Map(
      array(showcase.receipts).map(function (receipt) {
        return [receipt.id, receipt];
      })
    );
    var dnaById = new Map(
      array(input.dna && input.dna.characters).map(function (character) {
        return [character.id, character];
      })
    );
    var healthById = new Map(
      sourceHealth.map(function (health) {
        return [health.id, health];
      })
    );

    var grounded = array(input.characters && input.characters.characters).map(
      function (character) {
        var id = characterId(character.id || character.name || character.label);
        var dna = dnaById.get(id);
        var attribution = character.hostAttribution || {};
        var ownerMapped =
          ["user-supplied", "owner-confirmed", "creator-confirmed"].indexOf(
            clean(attribution.status)
          ) >= 0;
        var soundbyteAudits = array(
          character.soundbytes || character.receipts || character.performances
        ).map(function (soundbyte) {
          var receiptId = internalCharacterReceiptId(soundbyte);
          var receipt = receiptById.get(receiptId);
          var source = sourceById.get(clean(soundbyte.sourceId));
          var health = healthById.get(clean(soundbyte.sourceId));
          var provenance = soundbyte.provenance || {};
          var sourceResolved =
            Boolean(source) &&
            Boolean(health) &&
            health.status !== "BLOCKED" &&
            videoIdFromUrl(soundbyte.url || source.url) === clean(soundbyte.sourceId);
          var timestampValid =
            Number.isFinite(Number(soundbyte.t)) &&
            number(soundbyte.t) >= 0 &&
            Boolean(source) &&
            (number(source.duration) <= 0 ||
              number(soundbyte.t) <= number(source.duration) + 1);
          var exactCaption =
            clean(provenance.timestampStatus) === "exact-caption-event";
          var humanCurated =
            normalized(provenance.selection).indexOf("human curated") >= 0;
          var shortExcerpt = words(soundbyte.excerpt) <= publicWordLimit;
          var performanceVerified =
            Boolean(receipt) &&
            sourceResolved &&
            timestampValid &&
            exactCaption &&
            humanCurated &&
            number(soundbyte.confidence) >= 0.75;
          var speakerVerified =
            /speaker[- ]labeled|diarized|creator[- ]certified/.test(
              normalized(provenance.speakerBasis)
            ) &&
            clean(attribution.status) === "creator-confirmed";
          return {
            id: clean(soundbyte.id),
            receiptId: receiptId,
            sourceId: clean(soundbyte.sourceId),
            t: number(soundbyte.t),
            url: clean(soundbyte.url) || timestampUrl(source, soundbyte.t),
            excerpt: clean(soundbyte.excerpt),
            confidence: number(soundbyte.confidence),
            sourceResolved: sourceResolved,
            timestampValid: timestampValid,
            exactCaptionEvent: exactCaption,
            humanCurated: humanCurated,
            publicExcerptReady: shortExcerpt,
            performanceVerified: performanceVerified,
            specificSpeakerVerified: speakerVerified,
            attributionMode: speakerVerified
              ? "speaker-certified"
              : ownerMapped
                ? "owner-mapped-character / clip-not-diarized"
                : "unattributed"
          };
        });

        var ordinaryMentions = array(showcase.receipts).filter(function (receipt) {
          return (
            receipt.type !== "character-performance" &&
            array(receipt.entityIds).indexOf(id) >= 0
          );
        });
        var aliasCollisions = ordinaryMentions.filter(function (receipt) {
          var body = normalized(receipt.excerpt);
          return (
            (id === "character:loomis" && body.indexOf("billy loomis") >= 0) ||
            (id === "character:challis" && body.indexOf("linda chalice") >= 0)
          );
        });
        var minimum = number(
          dna && dna.minimumVerifiedReceiptsForAsk,
          number(
            input.dna &&
              input.dna.askCharacterPolicy &&
              input.dna.askCharacterPolicy.evidenceMinimum,
            3
          )
        );
        var verified = soundbyteAudits.filter(function (item) {
          return item.performanceVerified;
        });
        var speakerVerifiedCount = soundbyteAudits.filter(function (item) {
          return item.specificSpeakerVerified;
        }).length;
        var performerMatchesDNA =
          !dna || clean(dna.performer) === clean(character.performedBy || character.performer);
        var canAsk =
          character.askEnabled !== false &&
          character.status === "grounded" &&
          ownerMapped &&
          performerMatchesDNA &&
          verified.length >= minimum;
        var confidence = clamp(
          number(character.confidence, 0.75) * 72 +
            Math.min(verified.length, minimum) * 5 +
            (ownerMapped ? 8 : 0),
          0,
          94
        );

        return {
          id: id,
          name: clean(character.name || character.label),
          performedBy: clean(character.performedBy || character.performer),
          performerMappingStatus: clean(attribution.status) || "missing",
          ownerMapped: ownerMapped,
          performerMatchesDNA: performerMatchesDNA,
          status: clean(character.status),
          askEnabled: character.askEnabled !== false,
          minimumVerifiedPerformances: minimum,
          curatedPerformances: soundbyteAudits.length,
          verifiedPerformanceIds: verified.map(function (item) {
            return item.receiptId;
          }),
          speakerVerifiedPerformanceIds: soundbyteAudits
            .filter(function (item) {
              return item.specificSpeakerVerified;
            })
            .map(function (item) {
              return item.receiptId;
            }),
          ordinaryMentionReceiptIds: ordinaryMentions.map(function (item) {
            return item.id;
          }),
          aliasCollisionReceiptIds: aliasCollisions.map(function (item) {
            return item.id;
          }),
          soundbytes: soundbyteAudits,
          canGenerateLabeledTextParody: canAsk,
          canGenerateCharacterAudio: false,
          canClaimSpecificHostSpokeInEachClip:
            speakerVerifiedCount === soundbyteAudits.length && soundbyteAudits.length > 0,
          firewall:
            "Only curated soundbytes count as performances. Ordinary name mentions remain excluded, even when the memory graph links the alias.",
          confidence: makeConfidence(
            "character",
            id,
            confidence,
            [
              verified.length +
                " human-curated performance events resolve to source timestamps.",
              ownerMapped
                ? "The project owner supplied the recurring host-to-character mapping."
                : ""
            ],
            [
              ordinaryMentions.length
                ? ordinaryMentions.length +
                  " ordinary references are quarantined from the performance set."
                : "",
              aliasCollisions.length
                ? aliasCollisions.length + " name collisions require graph correction."
                : "",
              speakerVerifiedCount < soundbyteAudits.length
                ? "Auto-captions do not prove the speaker identity of each individual clip."
                : "",
              "Generated responses must remain labeled, original text; voice cloning is disabled."
            ],
            {
              searchable: true,
              displayableWithLabel: true,
              canonEligible: false,
              canGenerateLabeledTextParody: canAsk,
              canGenerateAudio: false,
              specificSpeakerVerified:
                speakerVerifiedCount === soundbyteAudits.length &&
                soundbyteAudits.length > 0
            }
          )
        };
      }
    );

    var locked = array(input.characters && input.characters.lockedCandidates).map(
      function (character) {
        return {
          id: characterId(character.id || character.name),
          name: clean(character.name),
          status: clean(character.status) || "candidate-needs-human-verification",
          performedBy: null,
          askEnabled: false,
          whyLocked: clean(character.whyLocked),
          candidateSoundbytes: array(character.soundbytes).map(function (soundbyte) {
            return {
              id: clean(soundbyte.id),
              sourceId: clean(soundbyte.sourceId),
              t: number(soundbyte.t),
              url: clean(soundbyte.url),
              excerpt: clean(soundbyte.excerpt),
              confidence: number(soundbyte.confidence)
            };
          }),
          confidence: makeConfidence(
            "character",
            characterId(character.id || character.name),
            24,
            [
              array(character.soundbytes).length +
                " candidate performance events resolve to sources."
            ],
            [
              "The performer is intentionally unknown.",
              "The character remains unavailable for Ask the Character."
            ],
            {
              searchable: true,
              displayableWithLabel: true,
              canonEligible: false,
              canGenerateLabeledTextParody: false,
              canGenerateAudio: false,
              specificSpeakerVerified: false
            }
          )
        };
      }
    );

    return {
      grounded: stableSort(grounded, function (a, b) {
        return a.id.localeCompare(b.id);
      }),
      locked: stableSort(locked, function (a, b) {
        return a.id.localeCompare(b.id);
      })
    };
  }

  function buildTimelineAudits(showcase) {
    var receiptById = new Map(
      array(showcase.receipts).map(function (receipt) {
        return [receipt.id, receipt];
      })
    );
    return stableSort(
      array(showcase.takeTimeMachines).map(function (timeline) {
        var receipts = array(timeline.receipts)
          .map(function (id) {
            return receiptById.get(id);
          })
          .filter(Boolean);
        var assessments = receipts.map(function (receipt) {
          return {
            receipt: receipt,
            assessment: explicitOpinionAssessment(
              receipt,
              timeline.subject,
              timeline.subjectType
            )
          };
        });
        var direct = assessments.filter(function (item) {
          return item.assessment.direct;
        });
        var directPositive = direct.filter(function (item) {
          return item.receipt.sentiment === "positive";
        });
        var directNegative = direct.filter(function (item) {
          return item.receipt.sentiment === "negative";
        });
        var verifiedDirect = direct.filter(function (item) {
          return VERIFIED_LEVELS.has(item.receipt.evidenceLevel);
        });
        var movementAudits = array(timeline.movements).map(function (movement, index) {
          var before = receiptById.get(movement.beforeReceiptId);
          var after = receiptById.get(movement.afterReceiptId);
          var beforeAssessment = explicitOpinionAssessment(
            before,
            timeline.subject,
            timeline.subjectType
          );
          var afterAssessment = explicitOpinionAssessment(
            after,
            timeline.subject,
            timeline.subjectType
          );
          var semanticSupport = beforeAssessment.direct && afterAssessment.direct;
          var humanVerified =
            Boolean(before) &&
            Boolean(after) &&
            VERIFIED_LEVELS.has(before.evidenceLevel) &&
            VERIFIED_LEVELS.has(after.evidenceLevel);
          return {
            id: timeline.id + ":movement:" + index,
            from: movement.from,
            to: movement.to,
            beforeReceiptId: movement.beforeReceiptId,
            afterReceiptId: movement.afterReceiptId,
            semanticSupport: semanticSupport,
            humanVerified: humanVerified,
            canonEligible: semanticSupport && humanVerified,
            safeLabel:
              semanticSupport && humanVerified
                ? "VERIFIED POSITION CHANGE"
                : "MACHINE-SURFACED POLARITY CHANGE"
          };
        });
        var directRatio = receipts.length ? direct.length / receipts.length : 0;
        var sourceCount = unique(
          receipts.map(function (receipt) {
            return receipt.sourceId;
          })
        ).length;
        var canonEligible =
          directPositive.length >= 2 &&
          directNegative.length >= 2 &&
          verifiedDirect.length === direct.length &&
          direct.length > 0 &&
          movementAudits.some(function (movement) {
            return movement.canonEligible;
          });
        var score = clamp(
          18 +
            directRatio * 44 +
            Math.min(sourceCount, 4) * 4 +
            (verifiedDirect.length ? 12 : 0),
          0,
          canonEligible ? 96 : 76
        );
        return {
          id: timeline.id,
          subjectId: timeline.subjectId,
          subject: timeline.subject,
          subjectType: timeline.subjectType,
          receipts: receipts.length,
          sourceCount: sourceCount,
          directOpinionReceiptIds: direct.map(function (item) {
            return item.receipt.id;
          }),
          projectedOrAmbiguousReceiptIds: assessments
            .filter(function (item) {
              return !item.assessment.direct;
            })
            .map(function (item) {
              return item.receipt.id;
            }),
          polarityContradictionReceiptIds: assessments
            .filter(function (item) {
              return item.assessment.contradiction;
            })
            .map(function (item) {
              return item.receipt.id;
            }),
          movementAudits: movementAudits,
          canonEligible: canonEligible,
          safePublicLabel: canonEligible
            ? "VERIFIED TAKE TIME MACHINE"
            : "EXCERPT-SENTIMENT TIMELINE — INFERENCE",
          prohibition:
            canonEligible
              ? ""
              : "Do not say a host changed their opinion. Say the indexed excerpt polarity changed, pending review.",
          confidence: makeConfidence(
            "timeline",
            timeline.id,
            score,
            [
              direct.length +
                " of " +
                receipts.length +
                " excerpts explicitly evaluate the subject.",
              sourceCount + " indexed sources contribute evidence."
            ],
            [
              receipts.length - direct.length
                ? receipts.length -
                  direct.length +
                  " excerpts discuss a scene, person, object, or adjacent topic rather than the whole subject."
                : "",
              verifiedDirect.length < direct.length
                ? "The direct-looking excerpts remain machine surfaced."
                : "",
              "Excerpt polarity is not a claim about either host's private or durable opinion."
            ],
            {
              searchable: true,
              displayableWithLabel: true,
              canonEligible: canonEligible
            }
          )
        };
      }),
      function (a, b) {
        return a.id.localeCompare(b.id);
      }
    );
  }

  function buildCourtAudits(showcase) {
    var receiptById = new Map(
      array(showcase.receipts).map(function (receipt) {
        return [receipt.id, receipt];
      })
    );
    return stableSort(
      array(showcase.courtCandidates).map(function (court) {
        function auditSide(items) {
          return array(items).map(function (item) {
            var receipt = receiptById.get(item.receiptId);
            var assessment = explicitOpinionAssessment(
              receipt,
              court.subject,
              receipt && array(receipt.entityIds).some(function (id) {
                return id.indexOf("franchise:") === 0;
              })
                ? "franchise"
                : "film"
            );
            return {
              receiptId: item.receiptId,
              sourceId: receipt ? receipt.sourceId : clean(item.sourceId),
              t: receipt ? receipt.t : number(item.t),
              url: receipt ? receipt.url : clean(item.url),
              excerpt: receipt ? receipt.excerpt : clean(item.excerpt),
              evidenceLevel: receipt ? receipt.evidenceLevel : "machine",
              directOpinion: assessment.direct,
              polarityContradiction: assessment.contradiction,
              reason: assessment.reason
            };
          });
        }

        var prosecution = auditSide(court.prosecution);
        var defense = auditSide(court.defense);
        var directProsecution = prosecution.filter(function (item) {
          return item.directOpinion;
        });
        var directDefense = defense.filter(function (item) {
          return item.directOpinion;
        });
        var allDirectVerified = directProsecution
          .concat(directDefense)
          .every(function (item) {
            return VERIFIED_LEVELS.has(item.evidenceLevel);
          });
        var canonEligible =
          directProsecution.length >= 2 &&
          directDefense.length >= 2 &&
          allDirectVerified;
        var argumentBoardEligible =
          directProsecution.length >= 1 && directDefense.length >= 1;
        var score = clamp(
          20 +
            directProsecution.length * 10 +
            directDefense.length * 10 +
            (allDirectVerified && directProsecution.length + directDefense.length > 0
              ? 18
              : 0),
          0,
          canonEligible ? 96 : 74
        );
        return {
          id: court.id,
          title: court.title || court.caseName,
          subjectId: court.subjectId,
          subject: court.subject,
          prosecution: prosecution,
          defense: defense,
          directProsecutionReceipts: directProsecution.map(function (item) {
            return item.receiptId;
          }),
          directDefenseReceipts: directDefense.map(function (item) {
            return item.receiptId;
          }),
          argumentBoardEligible: argumentBoardEligible,
          canonEligible: canonEligible,
          verdict: "OPEN",
          safePublicLabel: canonEligible
            ? "EDITOR-VERIFIED WWAM COURT"
            : "MACHINE-SURFACED ARGUMENT BOARD",
          prohibition:
            "No synthesized verdict or host opinion becomes canon without a human decision.",
          confidence: makeConfidence(
            "court",
            court.id,
            score,
            [
              directProsecution.length +
                " prosecution and " +
                directDefense.length +
                " defense excerpts explicitly evaluate the subject."
            ],
            [
              prosecution.length -
                directProsecution.length +
                defense.length -
                directDefense.length >
              0
                ? prosecution.length -
                  directProsecution.length +
                  defense.length -
                  directDefense.length +
                  " selected excerpts do not directly rate the whole subject."
                : "",
              allDirectVerified
                ? ""
                : "The available argument labels are machine surfaced, not editor-certified positions."
            ],
            {
              searchable: true,
              displayableWithLabel: true,
              canonEligible: canonEligible
            }
          )
        };
      }),
      function (a, b) {
        return a.id.localeCompare(b.id);
      }
    );
  }

  function buildPopularEditorialAudits(input, showcase, soundbytes) {
    var sourceById = new Map(
      array(showcase.sources).map(function (source) {
        return [source.id, source];
      })
    );
    var results = [];
    asStreams(input.popular).forEach(function (stream) {
      var claim = clean(stream.editorial && stream.editorial.whyItMatters);
      if (!/explicit performance cue/i.test(claim)) return;
      var characterCues = array(stream.characters).filter(function (character) {
        return number(character.performanceCues) > 0;
      });
      var curated = array(soundbytes.bySourceId.get(stream.id));
      var verifiedNearby = [];
      characterCues.forEach(function (cue) {
        curated.forEach(function (item) {
          var sameCharacter =
            normalized(cue.character) === normalized(item.character.name || item.character.label);
          if (
            sameCharacter &&
            Math.abs(number(cue.t) - number(item.soundbyte.t)) <= 45
          ) {
            verifiedNearby.push(item.receiptId);
          }
        });
      });
      var source = sourceById.get(stream.id);
      results.push({
        id: "editorial-performance-wording:" + stream.id,
        sourceId: stream.id,
        title: stream.title,
        claim: claim,
        machineCueCount: characterCues.reduce(function (sum, cue) {
          return sum + number(cue.performanceCues);
        }, 0),
        curatedNearbyReceiptIds: unique(verifiedNearby),
        canonEligible: false,
        currentWordingRisk:
          "A lexical persona cue or prompt is not proof that a performance occurred.",
        recommendedWording:
          verifiedNearby.length > 0
            ? "A machine-detected persona cue appears near an editor-verified performance receipt."
            : "The captions contain a machine-detected persona prompt or performance discussion.",
        evidence: characterCues.slice(0, 4).map(function (cue) {
          return {
            sourceId: stream.id,
            t: number(cue.t),
            url: timestampUrl(source || stream, cue.t),
            excerpt: clean(cue.receipt),
            character: clean(cue.character),
            status: clean(cue.status)
          };
        }),
        confidence: makeConfidence(
          "editorial-claim",
          "editorial-performance-wording:" + stream.id,
          verifiedNearby.length ? 58 : 28,
          [
            characterCues.length +
              " character cue groups were detected in the source captions.",
            verifiedNearby.length
              ? verifiedNearby.length + " curated performance receipt is nearby."
              : ""
          ],
          [
            "The machine cue can be a request, actor discussion, or ordinary character reference.",
            "The phrase “contains an explicit performance cue” overstates what the detector verified."
          ],
          {
            searchable: true,
            displayableWithLabel: true,
            canonEligible: false
          }
        )
      });
    });
    return stableSort(results, function (a, b) {
      return a.id.localeCompare(b.id);
    });
  }

  function buildRankingAudit(input) {
    var streams = asStreams(input.popular);
    var ids = streams.map(function (stream) {
      return clean(stream.id);
    });
    var ranksSequential = streams.every(function (stream, index) {
      return number(stream.rank) === index + 1;
    });
    var viewsDescending = streams.every(function (stream, index) {
      return index === 0 || number(streams[index - 1].views) >= number(stream.views);
    });
    var excluded = unique(
      array(input.popular && input.popular.selection && input.popular.selection.excludedFresh10)
        .concat(
          array(
            input.popular &&
              input.popular.selection &&
              input.popular.selection.excludedCommentaryCatalog
          )
        )
    );
    var overlap = ids.filter(function (id) {
      return excluded.indexOf(id) >= 0;
    });
    return {
      id: "popular-ranking",
      snapshot: clean(
        input.popular &&
          input.popular.selection &&
          input.popular.selection.snapshot
      ),
      rankingMethod: clean(
        input.popular &&
          input.popular.selection &&
          input.popular.selection.ranking
      ),
      sourceCount: streams.length,
      uniqueSourceIds: new Set(ids).size === ids.length,
      ranksSequential: ranksSequential,
      viewsDescending: viewsDescending,
      excludedSourceOverlap: unique(overlap),
      valid:
        streams.length > 0 &&
        new Set(ids).size === ids.length &&
        ranksSequential &&
        viewsDescending &&
        overlap.length === 0,
      caution:
        "“Popular” means public view count at the recorded snapshot, not an immutable all-time ranking."
    };
  }

  function evidenceFromReceipt(receipt) {
    return receipt
      ? {
          receiptId: receipt.id,
          sourceId: receipt.sourceId,
          t: number(receipt.t),
          url: receipt.url,
          excerpt: receipt.excerpt,
          evidenceLevel: receipt.evidenceLevel
        }
      : null;
  }

  function makeCandidate(candidate) {
    var item = candidate || {};
    return {
      id: clean(item.id),
      kind: clean(item.kind),
      severity: clean(item.severity || "MEDIUM").toUpperCase(),
      title: clean(item.title),
      summary: clean(item.summary),
      target: item.target || {},
      claim: clean(item.claim),
      recommendation: clean(item.recommendation),
      evidence: array(item.evidence).filter(Boolean),
      confidenceId: clean(item.confidenceId),
      canonBlocked: item.canonBlocked !== false
    };
  }

  function buildReviewQueue(
    input,
    showcase,
    sourceHealth,
    characterAudits,
    timelineAudits,
    courtAudits,
    editorialAudits,
    publicWordLimit
  ) {
    var receiptById = new Map(
      array(showcase.receipts).map(function (receipt) {
        return [receipt.id, receipt];
      })
    );
    var queue = [];

    sourceHealth
      .filter(function (source) {
        return source.status !== "HEALTHY";
      })
      .forEach(function (source) {
        queue.push(
          makeCandidate({
            id: "source-health:" + source.id,
            kind: "source-health",
            severity: source.status === "BLOCKED" ? "BLOCKER" : "HIGH",
            title: source.title || source.id,
            summary: source.issues.join(", "),
            target: { type: "source", id: source.id, sourceId: source.id },
            recommendation:
              source.captioned
                ? "Repair the missing metadata or receipt resolution before using this source for claims."
                : "Keep semantic features disabled until a transcript or human notes are contributed.",
            evidence: [],
            confidenceId: "source:" + source.id
          })
        );
      });

    var overLimit = array(showcase.receipts).filter(function (receipt) {
      return words(receipt.excerpt) > publicWordLimit;
    });
    if (overLimit.length) {
      queue.push(
        makeCandidate({
          id: "public-excerpt-limit",
          kind: "display-safety",
          severity: "MEDIUM",
          title: "PUBLIC EXCERPT LIMIT",
          summary:
            overLimit.length +
            " receipts exceed the configured " +
            publicWordLimit +
            "-word public excerpt limit.",
          target: { type: "receipt-set", id: "over-public-word-limit" },
          recommendation:
            "Trim only the displayed excerpt; preserve the exact source timestamp and internal context.",
          evidence: overLimit.slice(0, 8).map(evidenceFromReceipt),
          canonBlocked: false
        })
      );
    }

    characterAudits.grounded.forEach(function (character) {
      if (!character.canClaimSpecificHostSpokeInEachClip) {
        queue.push(
          makeCandidate({
            id: "speaker-attribution:" + character.id,
            kind: "speaker-attribution",
            severity: "MEDIUM",
            title: character.name + " — CLIP ATTRIBUTION",
            summary:
              "The recurring performer mapping is owner-supplied, but individual auto-caption events are not speaker diarized.",
            target: { type: "character", id: character.id },
            claim:
              character.performedBy +
              " is the recurring performer; the system cannot prove that host spoke every indexed clip.",
            recommendation:
              "Keep “performed by” tied to the owner mapping and label each clip “performance event; speaker not diarized” until creator-certified.",
            evidence: character.soundbytes.slice(0, 3).map(function (item) {
              return {
                receiptId: item.receiptId,
                sourceId: item.sourceId,
                t: item.t,
                url: item.url,
                excerpt: item.excerpt
              };
            }),
            confidenceId: "character:" + character.id,
            canonBlocked: false
          })
        );
      }
      if (character.ordinaryMentionReceiptIds.length) {
        queue.push(
          makeCandidate({
            id: "persona-entity-collision:" + character.id,
            kind: "entity-resolution",
            severity: character.aliasCollisionReceiptIds.length ? "HIGH" : "MEDIUM",
            title: character.name + " — PERSONA / CHARACTER COLLISION",
            summary:
              character.ordinaryMentionReceiptIds.length +
              " ordinary references currently share the persona entity. " +
              character.aliasCollisionReceiptIds.length +
              " are known name collisions.",
            target: { type: "entity", id: character.id },
            recommendation:
              "Split the fictional film character/name mention from the WWAM performed persona. Never count these receipts as performances.",
            evidence: character.ordinaryMentionReceiptIds
              .slice(0, 8)
              .map(function (id) {
                return evidenceFromReceipt(receiptById.get(id));
              }),
            confidenceId: "character:" + character.id
          })
        );
      }
    });

    characterAudits.locked.forEach(function (character) {
      queue.push(
        makeCandidate({
          id: "locked-character:" + character.id,
          kind: "character-verification",
          severity: "HIGH",
          title: character.name + " — LOCKED",
          summary: character.whyLocked,
          target: { type: "character", id: character.id },
          recommendation:
            "Obtain an owner or creator decision identifying the performer, or keep the character permanently locked.",
          evidence: character.candidateSoundbytes,
          confidenceId: "character:" + character.id
        })
      );
    });

    timelineAudits
      .filter(function (timeline) {
        return !timeline.canonEligible;
      })
      .forEach(function (timeline) {
        queue.push(
          makeCandidate({
            id: "timeline-review:" + timeline.id,
            kind: "opinion-inference",
            severity:
              timeline.directOpinionReceiptIds.length >= 2 ? "MEDIUM" : "HIGH",
            title: timeline.subject + " — TAKE TIME MACHINE",
            summary:
              timeline.projectedOrAmbiguousReceiptIds.length +
              " of " +
              timeline.receipts +
              " polarity receipts do not explicitly rate the whole subject.",
            target: { type: "timeline", id: timeline.id },
            claim: "The hosts changed position on " + timeline.subject + ".",
            recommendation: timeline.prohibition,
            evidence: timeline.projectedOrAmbiguousReceiptIds
              .slice(0, 6)
              .map(function (id) {
                return evidenceFromReceipt(receiptById.get(id));
              }),
            confidenceId: "timeline:" + timeline.id
          })
        );
      });

    courtAudits
      .filter(function (court) {
        return !court.canonEligible;
      })
      .forEach(function (court) {
        queue.push(
          makeCandidate({
            id: "court-review:" + court.id,
            kind: "court-inference",
            severity: court.argumentBoardEligible ? "MEDIUM" : "HIGH",
            title: court.title,
            summary:
              court.directProsecutionReceipts.length +
              " direct prosecution and " +
              court.directDefenseReceipts.length +
              " direct defense receipts survive strict target review.",
            target: { type: "court", id: court.id },
            claim: court.title,
            recommendation:
              "Present this only as a machine-surfaced argument board until an editor certifies both sides.",
            evidence: court.prosecution
              .concat(court.defense)
              .filter(function (item) {
                return !item.directOpinion;
              })
              .slice(0, 6),
            confidenceId: "court:" + court.id
          })
        );
      });

    editorialAudits.forEach(function (audit) {
      queue.push(
        makeCandidate({
          id: audit.id,
          kind: "performance-wording",
          severity: audit.curatedNearbyReceiptIds.length ? "MEDIUM" : "HIGH",
          title: audit.title,
          summary: audit.currentWordingRisk,
          target: { type: "popular-editorial", id: audit.id, sourceId: audit.sourceId },
          claim: audit.claim,
          recommendation: audit.recommendedWording,
          evidence: audit.evidence,
          confidenceId: "editorial-claim:" + audit.id
        })
      );
    });

    var projectionRisks = array(showcase.receipts).filter(function (receipt) {
      if (receipt.sentiment === "neutral") return false;
      var candidateEntities = array(showcase.memoryGraph && showcase.memoryGraph.nodes).filter(
        function (entity) {
          return (
            array(receipt.entityIds).indexOf(entity.id) >= 0 &&
            ["film", "franchise", "topic"].indexOf(entity.type) >= 0
          );
        }
      );
      if (!candidateEntities.length) return false;
      return !candidateEntities.some(function (entity) {
        return explicitOpinionAssessment(receipt, entity.label, entity.type).direct;
      });
    });
    if (projectionRisks.length) {
      queue.push(
        makeCandidate({
          id: "opinion-target-projection",
          kind: "opinion-inference",
          severity: "HIGH",
          title: "SCENE SENTIMENT PROJECTED ONTO WHOLE WORKS",
          summary:
            projectionRisks.length +
            " non-neutral receipts do not explicitly rate any linked film, franchise, or topic.",
          target: { type: "receipt-set", id: "opinion-target-projection" },
          recommendation:
            "Require explicit whole-work language before an excerpt can support a Take Time Machine movement or WWAM Court side.",
          evidence: projectionRisks.slice(0, 10).map(evidenceFromReceipt)
        })
      );
    }

    var polarityContradictions = array(showcase.receipts).filter(function (receipt) {
      if (receipt.sentiment === "neutral") return false;
      return explicitOpinionAssessment(receipt, "", "").contradiction;
    });
    if (polarityContradictions.length) {
      queue.push(
        makeCandidate({
          id: "negated-sentiment",
          kind: "sentiment-inference",
          severity: "HIGH",
          title: "NEGATION FLIPS MACHINE POLARITY",
          summary:
            polarityContradictions.length +
            " excerpts contain negation that contradicts the assigned lexical polarity.",
          target: { type: "receipt-set", id: "negated-sentiment" },
          recommendation:
            "Quarantine these receipts from opinion features until negation-aware classification or editor review.",
          evidence: polarityContradictions.slice(0, 10).map(evidenceFromReceipt)
        })
      );
    }

    return stableSort(queue, compareSeverity);
  }

  function correctionPacket(
    candidate,
    snapshotDate,
    inputFingerprint,
    correctionRipple
  ) {
    var item = makeCandidate(candidate);
    return {
      schema: "wwam.correction.v2",
      packetId: "correction:" + slug(item.id),
      status: "DRAFT",
      snapshotDate: clean(snapshotDate),
      inputFingerprint: clean(inputFingerprint),
      target: item.target,
      issue: {
        id: item.id,
        kind: item.kind,
        severity: item.severity,
        summary: item.summary
      },
      currentClaim: item.claim,
      recommendedAction: item.recommendation,
      evidence: item.evidence,
      reviewer: {
        requiredRole:
          item.kind === "speaker-attribution" ||
          item.kind === "character-verification"
            ? "OWNER_OR_CREATOR"
            : "EDITOR",
        decision: null,
        correctedValue: "",
        notes: ""
      },
      allowedDecisions: ["ACCEPT", "CORRECT", "REJECT", "NEEDS_MORE_EVIDENCE"],
      canonEffect:
        "No correction becomes canon until the required reviewer records a decision.",
      dryRunRipple: correctionRipple.analyze({
        candidateId: item.id,
        target: item.target,
        evidence: item.evidence
      })
    };
  }

  function contributionPacket(request, snapshotDate, inputFingerprint) {
    var item = request || {};
    return {
      schema: "wwam.contribution.v1",
      packetId:
        clean(item.packetId) ||
        "contribution:" +
          slug(item.kind || "evidence") +
          ":" +
          fingerprint(
            clean(item.targetId) +
              "|" +
              clean(item.sourceId) +
              "|" +
              number(item.t)
          ),
      status: "DRAFT",
      snapshotDate: clean(snapshotDate),
      inputFingerprint: clean(inputFingerprint),
      kind: clean(item.kind || "new-receipt"),
      target: {
        type: clean(item.targetType || "source"),
        id: clean(item.targetId || item.sourceId)
      },
      proposedEvidence: {
        sourceId: clean(item.sourceId),
        t: Number.isFinite(Number(item.t)) ? number(item.t) : null,
        url: clean(item.url),
        excerpt: clean(item.excerpt),
        performer: item.performer == null ? null : clean(item.performer)
      },
      requestedFields: array(item.requestedFields).length
        ? array(item.requestedFields)
        : ["sourceId", "timestamp", "short excerpt", "context note"],
      submitter: {
        name: "",
        relationship: "",
        notes: ""
      },
      verificationState: "UNREVIEWED",
      safety:
        "A contribution may propose evidence but cannot assign a speaker, certify a quote, or unlock a character without review."
    };
  }

  function buildContributionPackets(
    sourceHealth,
    characterAudits,
    snapshotDate,
    inputFingerprint
  ) {
    var packets = [];
    sourceHealth
      .filter(function (source) {
        return !source.captioned;
      })
      .forEach(function (source) {
        packets.push(
          contributionPacket(
            {
              packetId: "contribution:transcript:" + source.id,
              kind: "transcript-or-human-notes",
              targetType: "source",
              targetId: source.id,
              sourceId: source.id,
              url: source.url,
              requestedFields: [
                "authorized transcript or human notes",
                "timestamped short excerpts",
                "topic labels",
                "contributor relationship to source"
              ]
            },
            snapshotDate,
            inputFingerprint
          )
        );
      });
    characterAudits.locked.forEach(function (character) {
      var first = character.candidateSoundbytes[0] || {};
      packets.push(
        contributionPacket(
          {
            packetId: "contribution:performer:" + slug(character.id),
            kind: "performer-verification",
            targetType: "character",
            targetId: character.id,
            sourceId: first.sourceId,
            t: first.t,
            url: first.url,
            excerpt: first.excerpt,
            performer: null,
            requestedFields: [
              "owner or creator identity",
              "performer decision",
              "receipt-specific confirmation",
              "optional correction note"
            ]
          },
          snapshotDate,
          inputFingerprint
        )
      );
    });
    return stableSort(packets, function (a, b) {
      return a.packetId.localeCompare(b.packetId);
    });
  }

  function create(config) {
    var input = config || {};
    var showcase = resolveShowcase(input);
    var dna = input.dna || root.WWAM_CHANNEL_DNA || {};
    input = Object.assign({}, input, { dna: dna });
    var publicWordLimit = number(
      dna.qualityGates && dna.qualityGates.publicExcerptWords,
      16
    );
    var sourceRecords = rawSourceRegistry(input);
    var soundbytes = characterSoundbyteIndex(input);
    var sourceHealth = buildSourceHealth(
      input,
      showcase,
      sourceRecords,
      soundbytes,
      publicWordLimit
    );
    var receiptConfidence = buildReceiptConfidence(
      showcase,
      sourceHealth,
      soundbytes,
      publicWordLimit
    );
    var characterAudits = buildCharacterAudits(
      input,
      showcase,
      sourceHealth,
      soundbytes,
      publicWordLimit
    );
    var timelineAudits = buildTimelineAudits(showcase);
    var courtAudits = buildCourtAudits(showcase);
    var popularEditorialAudits = buildPopularEditorialAudits(
      input,
      showcase,
      soundbytes
    );
    var popularRankingAudit = buildRankingAudit(input);
    var reviewCandidates = buildReviewQueue(
      input,
      showcase,
      sourceHealth,
      characterAudits,
      timelineAudits,
      courtAudits,
      popularEditorialAudits,
      publicWordLimit
    );
    var snapshotDate =
      clean(showcase.snapshotDate) ||
      clean(input.popular && input.popular.generated) ||
      clean(input.deep && input.deep.generated);
    var inputFingerprint =
      clean(showcase.inputFingerprint) ||
      fingerprint(
        array(showcase.sources)
          .map(function (source) {
            return source.id;
          })
          .join("|")
      );
    var correctionRipple = resolveCorrectionRipple(showcase);
    var correctionPackets = reviewCandidates.map(function (candidate) {
      return correctionPacket(
        candidate,
        snapshotDate,
        inputFingerprint,
        correctionRipple
      );
    });
    var contributionPackets = buildContributionPackets(
      sourceHealth,
      characterAudits,
      snapshotDate,
      inputFingerprint
    );
    var confidenceIndex = new Map();
    sourceHealth.forEach(function (item) {
      confidenceIndex.set("source:" + item.id, item.confidence);
    });
    receiptConfidence.forEach(function (item) {
      confidenceIndex.set("receipt:" + item.id, item);
    });
    timelineAudits.forEach(function (item) {
      confidenceIndex.set("timeline:" + item.id, item.confidence);
    });
    courtAudits.forEach(function (item) {
      confidenceIndex.set("court:" + item.id, item.confidence);
    });
    characterAudits.grounded.concat(characterAudits.locked).forEach(function (item) {
      confidenceIndex.set("character:" + item.id, item.confidence);
    });
    popularEditorialAudits.forEach(function (item) {
      confidenceIndex.set("editorial-claim:" + item.id, item.confidence);
    });

    var ordinaryMentions = characterAudits.grounded.reduce(function (sum, item) {
      return sum + item.ordinaryMentionReceiptIds.length;
    }, 0);
    var aliasCollisions = characterAudits.grounded.reduce(function (sum, item) {
      return sum + item.aliasCollisionReceiptIds.length;
    }, 0);
    var verifiedPerformances = characterAudits.grounded.reduce(function (sum, item) {
      return sum + item.verifiedPerformanceIds.length;
    }, 0);
    var publicExcerptViolations = array(showcase.receipts).filter(function (receipt) {
      return words(receipt.excerpt) > publicWordLimit;
    }).length;
    var invalidTimestamps = sourceHealth.reduce(function (sum, source) {
      return sum + source.receiptCoverage.invalidTimestamps;
    }, 0);
    var brokenSourceLinks = sourceHealth.filter(function (source) {
      return (
        source.issues.indexOf("SOURCE_URL_INVALID") >= 0 ||
        source.issues.indexOf("SOURCE_URL_ID_MISMATCH") >= 0
      );
    }).length;
    var strictMovements = timelineAudits.reduce(function (sum, timeline) {
      return (
        sum +
        timeline.movementAudits.filter(function (movement) {
          return movement.canonEligible;
        }).length
      );
    }, 0);

    var result = {
      engine: "WWAM TRUST / CANON DESK",
      version: VERSION,
      snapshotDate: snapshotDate,
      inputFingerprint: inputFingerprint,
      policy: {
        publicExcerptWords: publicWordLimit,
        noSpeakerGuessing: true,
        ordinaryMentionsArePerformances: false,
        generatedCharacterAudioAllowed: false,
        opinionChangeRequiresExplicitTargetAndHumanReview: true,
        courtVerdictsRequireHumanDecision: true
      },
      evidenceLevels: EVIDENCE_LEVELS,
      metrics: {
        sources: sourceHealth.length,
        healthySources: sourceHealth.filter(function (item) {
          return item.status === "HEALTHY";
        }).length,
        limitedSources: sourceHealth.filter(function (item) {
          return item.status === "LIMITED";
        }).length,
        blockedSources: sourceHealth.filter(function (item) {
          return item.status === "BLOCKED";
        }).length,
        brokenSourceLinks: brokenSourceLinks,
        invalidTimestamps: invalidTimestamps,
        receipts: array(showcase.receipts).length,
        machineReceipts: array(showcase.receipts).filter(function (item) {
          return item.evidenceLevel === "machine";
        }).length,
        editorReceipts: array(showcase.receipts).filter(function (item) {
          return item.evidenceLevel === "editor";
        }).length,
        creatorReceipts: array(showcase.receipts).filter(function (item) {
          return item.evidenceLevel === "creator";
        }).length,
        publicExcerptViolations: publicExcerptViolations,
        groundedCharacters: characterAudits.grounded.length,
        lockedCharacters: characterAudits.locked.length,
        verifiedCuratedPerformances: verifiedPerformances,
        ordinaryCharacterMentionsQuarantined: ordinaryMentions,
        aliasCollisions: aliasCollisions,
        timelines: timelineAudits.length,
        canonEligibleTimelines: timelineAudits.filter(function (item) {
          return item.canonEligible;
        }).length,
        canonEligibleMovements: strictMovements,
        courts: courtAudits.length,
        canonEligibleCourts: courtAudits.filter(function (item) {
          return item.canonEligible;
        }).length,
        performanceWordingReviews: popularEditorialAudits.length,
        reviewCandidates: reviewCandidates.length,
        correctionPackets: correctionPackets.length,
        rippleReadyPackets: correctionPackets.filter(function (packet) {
          return packet.dryRunRipple.analysisComplete;
        }).length,
        rippleBlockedPackets: correctionPackets.filter(function (packet) {
          return !packet.dryRunRipple.analysisComplete;
        }).length,
        rippleExactReceiptRecords: correctionPackets.reduce(function (
          total,
          packet
        ) {
          return total + packet.dryRunRipple.totals.exactReceiptRecords;
        }, 0),
        rippleSourceOnlyRecords: correctionPackets.reduce(function (
          total,
          packet
        ) {
          return total + packet.dryRunRipple.totals.sourceOnlyRecords;
        }, 0),
        contributionPackets: contributionPackets.length
      },
      sourceHealth: sourceHealth,
      receiptConfidence: receiptConfidence,
      characterAudits: characterAudits,
      timelineAudits: timelineAudits,
      courtAudits: courtAudits,
      popularEditorialAudits: popularEditorialAudits,
      popularRankingAudit: popularRankingAudit,
      reviewCandidates: reviewCandidates,
      correctionPackets: correctionPackets,
      correctionRipple: {
        engine: correctionRipple.engine,
        version: correctionRipple.version,
        schema: correctionRipple.schema,
        registeredSurfaces: correctionRipple.registeredSurfaces,
        registeredRecords: correctionRipple.registeredRecords,
        registryHealth: correctionRipple.registryHealth
      },
      contributionPackets: contributionPackets,
      uiContract: {
        summaryCards: [
          "healthySources",
          "limitedSources",
          "reviewCandidates",
          "verifiedCuratedPerformances",
          "ordinaryCharacterMentionsQuarantined"
        ],
        deskLanes: [
          {
            id: "source-health",
            label: "SOURCE HEALTH",
            data: "sourceHealth"
          },
          {
            id: "canon-queue",
            label: "CANON REVIEW QUEUE",
            data: "reviewCandidates"
          },
          {
            id: "character-firewall",
            label: "CHARACTER FIREWALL",
            data: "characterAudits"
          },
          {
            id: "claim-audit",
            label: "TAKES + COURT AUDIT",
            data: "timelineAudits,courtAudits"
          },
          {
            id: "contribute",
            label: "CORRECTIONS + CONTRIBUTIONS",
            data: "correctionPackets,contributionPackets"
          }
        ],
        confidenceLookup:
          "explainConfidence({ kind: 'source|receipt|timeline|court|character|editorial-claim', id })"
      },
      getSourceHealth: function (id) {
        return (
          sourceHealth.find(function (item) {
            return item.id === clean(id);
          }) || null
        );
      },
      getReviewQueue: function (filters) {
        var options = filters || {};
        var values = reviewCandidates.filter(function (item) {
          if (
            options.severity &&
            item.severity !== clean(options.severity).toUpperCase()
          ) {
            return false;
          }
          if (options.kind && item.kind !== clean(options.kind)) return false;
          return true;
        });
        var limit = number(options.limit);
        return limit > 0 ? values.slice(0, limit) : values.slice();
      },
      explainConfidence: function (request) {
        var value = request || {};
        var kind = clean(value.kind);
        var id = clean(value.id);
        var found = confidenceIndex.get(kind + ":" + id);
        return (
          found ||
          makeConfidence(
            kind || "unknown",
            id,
            0,
            [],
            ["No confidence record resolves for this target."],
            {
              searchable: false,
              displayableWithLabel: false,
              canonEligible: false
            }
          )
        );
      },
      buildCorrectionPacket: function (request) {
        var candidate =
          typeof request === "string"
            ? reviewCandidates.find(function (item) {
                return item.id === request;
              })
            : request;
        if (!candidate) return null;
        return correctionPacket(
          candidate,
          snapshotDate,
          inputFingerprint,
          correctionRipple
        );
      },
      buildContributionPacket: function (request) {
        return contributionPacket(request, snapshotDate, inputFingerprint);
      }
    };
    return result;
  }

  root.WWAMTrustEngine = Object.freeze({
    VERSION: VERSION,
    EVIDENCE_LEVELS: EVIDENCE_LEVELS,
    create: create
  });
})(typeof window !== "undefined" ? window : globalThis);
