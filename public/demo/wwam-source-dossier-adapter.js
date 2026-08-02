(function (root) {
  "use strict";

  var VERSION = "1.19.0";
  var SCHEMA = "shokker-source-dossier-input/v1";
  var PUBLIC_EXCERPT_WORDS = 16;
  var OFFICIAL_WWAM_CHANNEL_ID = "UC6ieEOZW4iXV8TcILJI8k5g";
  var MINIMUM_ATLAS_SOURCES = 472;
  var MINIMUM_CATALOG_SOURCES = 39;
  var MINIMUM_CANONICAL_SOURCES = 510;
  var BASELINE_RECEIPTS_BEFORE_YEAR_CANON = 1490;
  var MINIMUM_SHOWCASE_CHARACTER_RECEIPTS = 25;
  var EXPECTED_OVERLAP_ID = "3wK00_-K-Y0";
  var PINNED_SHOWCASE_SOURCE_ID = "LV2rmwEA0w4";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function episodeRecords(payload) {
    var episodes = payload && payload.episodes;
    if (Array.isArray(episodes)) return episodes;
    if (!episodes || typeof episodes !== "object") return [];
    return Object.keys(episodes).map(function (id) {
      return episodes[id];
    });
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

  function slug(value) {
    return normalized(value).replace(/\s+/g, "-") || "unknown";
  }

  function numberOrNull(value) {
    if (value == null || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function number(value) {
    var parsed = numberOrNull(value);
    return parsed == null ? 0 : parsed;
  }

  function boundedSignal(value) {
    var parsed = numberOrNull(value);
    if (parsed == null) return null;
    return Math.max(0, Math.min(100, parsed));
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(function (value) {
      return value != null && clean(value);
    }).map(function (value) {
      return clean(value);
    })));
  }

  function stableStrings(values) {
    return unique(values).sort(function (left, right) {
      return left.localeCompare(right);
    });
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function registeredRawContentMode(values) {
    var output = null;
    array(values).some(function (value) {
      if (!value || typeof value !== "object") return false;
      if (Object.prototype.hasOwnProperty.call(value, "rawContentMode")) {
        output = value.rawContentMode == null
          ? null
          : String(value.rawContentMode);
        return true;
      }
      if (Object.prototype.hasOwnProperty.call(value, "contentMode")) {
        output = value.contentMode == null ? null : String(value.contentMode);
        return true;
      }
      return false;
    });
    return output;
  }

  function words(value) {
    return clean(value).split(/\s+/).filter(Boolean);
  }

  function publicExcerpt(value) {
    var tokens = words(value);
    if (tokens.length <= PUBLIC_EXCERPT_WORDS) return tokens.join(" ");
    return tokens.slice(0, PUBLIC_EXCERPT_WORDS).join(" ") + "…";
  }

  function titleCase(value) {
    return clean(value).split(/[-_\s]+/).filter(Boolean).map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function adapterError(code, message) {
    var error = new Error(message);
    error.name = "WWAMSourceDossierAdapterError";
    error.code = code;
    return error;
  }

  function fail(code, message) {
    throw adapterError(code, message);
  }

  function mapById(values, label) {
    var output = new Map();
    array(values).forEach(function (value) {
      var id = clean(value && (value.id || value.videoId));
      if (!id) fail("SOURCE_ID_REQUIRED", label + " contains a source without an ID.");
      if (output.has(id)) {
        fail("SOURCE_ID_DUPLICATE", label + " contains duplicate source ID " + id + ".");
      }
      output.set(id, value);
    });
    return output;
  }

  function streamsFrom(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value.getSearchPayload === "function") {
      return array(value.getSearchPayload().streams);
    }
    if (typeof value.browse === "function") {
      var result = value.browse({ sort: "priority", limit: 100 });
      return array(result && result.records);
    }
    return array(value.streams || value.items || value.records);
  }

  function atlasRecordsFrom(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.records)) return value.records;
    if (typeof value.browse === "function") {
      return array(value.browse({}).records);
    }
    return [];
  }

  function assertMinimumCount(values, minimum, label) {
    if (array(values).length < minimum) {
      fail(
        "SOURCE_COUNT_INVALID",
        label + " fell below its " + minimum + "-source baseline; received " +
          array(values).length + "."
      );
    }
  }

  function assertSubset(values, allowed, label) {
    array(values).forEach(function (value) {
      var id = clean(value && (value.id || value.videoId));
      if (!allowed.has(id)) {
        fail("SOURCE_SCOPE_INVALID", label + " contains non-Atlas source " + id + ".");
      }
    });
  }

  function assertMetadataAgreement(left, right, id, label) {
    ["title", "date", "duration", "views", "thumbnail", "url"].forEach(function (field) {
      if (left[field] != null && right[field] != null &&
          String(left[field]) !== String(right[field])) {
        fail(
          "SOURCE_METADATA_CONFLICT",
          label + " conflicts with canonical metadata for " + id + "." + field + "."
        );
      }
    });
  }

  function coverage(value) {
    var status = clean(value);
    if (status === "deeply-indexed" || status === "caption-backed") {
      return "caption-backed";
    }
    if (status === "caption-limited") return "caption-limited";
    if (status === "unavailable") return "unavailable";
    return "metadata-only";
  }

  function sourceEnd(raw, at, duration) {
    var candidate = numberOrNull(
      raw && (
        raw.end != null ? raw.end :
          raw.to != null ? raw.to :
            raw.window && raw.window.to != null ? raw.window.to : null
      )
    );
    if (candidate == null || candidate < at || candidate > duration) return null;
    return candidate;
  }

  function curatedReceiptBounds(characterLore, showcase) {
    var showcaseSourceIds = new Set(
      array(showcase && showcase.sources).map(function (source) {
        return clean(source && source.id);
      }).filter(Boolean)
    );
    var promotedReceipts = array(showcase && showcase.receipts).filter(function (receipt) {
      return evidenceType(receipt && receipt.type) ===
        "curated-character-performance";
    });
    var promotedKeys = promotedReceipts.map(function (receipt) {
      return clean(receipt && receipt.id);
    });
    var promoted = new Set(promotedKeys.filter(Boolean));
    if (promotedKeys.some(function (key) { return !key; }) ||
        promoted.size !== promotedKeys.length) {
      fail(
        "CURATED_RECEIPT_SET_INVALID",
        "The Showcase character receipt ledger contains a missing or duplicate ID."
      );
    }
    if (promoted.size < MINIMUM_SHOWCASE_CHARACTER_RECEIPTS) {
      fail(
        "CURATED_RECEIPT_SET_INVALID",
        "The Showcase character receipt ledger fell below its " +
          MINIMUM_SHOWCASE_CHARACTER_RECEIPTS + "-receipt baseline."
      );
    }

    var bounds = new Map();
    var expected = new Set();
    array(characterLore && characterLore.characters).forEach(function (profile) {
      array(profile && profile.soundbytes).forEach(function (soundbyte) {
        var key = "character-receipt:" + clean(soundbyte && soundbyte.id);
        var sourceId = clean(soundbyte && soundbyte.sourceId);
        var provenance = soundbyte && soundbyte.provenance || {};
        var playability = soundbyte && soundbyte.playability || {};
        var selection = normalized(provenance.selection);
        var eligible =
          clean(soundbyte && soundbyte.classification) ===
            "actual-character-performance" &&
          clean(playability.status) === "eligible" &&
          clean(provenance.channelId) === OFFICIAL_WWAM_CHANNEL_ID &&
          clean(provenance.timestampStatus) === "exact-caption-event" &&
          (
            selection.indexOf("human curated") >= 0 ||
            selection.indexOf("editorially screened direct address seed") >= 0
          );
        if (!eligible || !showcaseSourceIds.has(sourceId)) return;
        expected.add(key);
        var at = numberOrNull(soundbyte && soundbyte.t);
        var playbackStart = numberOrNull(
          soundbyte && soundbyte.playback && soundbyte.playback.start
        );
        var end = numberOrNull(
          soundbyte && soundbyte.playback && soundbyte.playback.end
        );
        if (end == null && at != null) {
          var clipSeconds = numberOrNull(
            soundbyte && soundbyte.playback && soundbyte.playback.clipSeconds
          );
          if (clipSeconds != null) end = at + clipSeconds;
        }
        if (!key || key === "character-receipt:" || !sourceId ||
            at == null || end == null || at < 0 || end <= at ||
            playbackStart != null && Math.abs(playbackStart - at) > 0.01) {
          fail(
            "CURATED_RECEIPT_BOUND_INVALID",
            "Curated receipt " + key +
              " requires an exact source, start, and positive end bound."
          );
        }
        if (bounds.has(key)) {
          fail(
            "CURATED_RECEIPT_BOUND_DUPLICATE",
            "Curated receipt " + key + " has duplicate playback bounds."
          );
        }
        bounds.set(key, {
          sourceId: sourceId,
          at: at,
          end: end,
        });
      });
    });
    promoted.forEach(function (key) {
      if (!bounds.has(key)) {
          fail(
            "CURATED_RECEIPT_BOUND_MISSING",
            "Curated receipt " + key +
              " is missing its explicit screened playback bound."
          );
      }
    });
    var missingFromShowcase = Array.from(expected).filter(function (key) {
      return !promoted.has(key);
    });
    var foreignToLore = Array.from(promoted).filter(function (key) {
      return !expected.has(key);
    });
    if (missingFromShowcase.length || foreignToLore.length ||
        promoted.size !== expected.size) {
      fail(
        "CURATED_RECEIPT_SET_INVALID",
        "The Showcase character receipts must exactly match the eligible " +
          "Character Lore receipts whose sources are in the promoted Showcase."
      );
    }
    return bounds;
  }
  function evidenceType(kind, fallback) {
    var value = normalized(kind);
    if (value.indexOf("topic") >= 0) return "caption-topic-receipt";
    if (value.indexOf("character") >= 0) return "curated-character-performance";
    if (value.indexOf("moment") >= 0) return "caption-excerpt";
    return clean(fallback) || "caption-excerpt";
  }

  function reviewState(level, fallback) {
    var value = normalized(level);
    if (value.indexOf("curated") >= 0) {
      return "timestamp-validated-human-curated-candidate";
    }
    return clean(fallback) || "machine-surfaced";
  }

  function normalizedReceipt(raw, source, settings) {
    var at = numberOrNull(
      raw && (
        raw.t != null ? raw.t :
          raw.at != null ? raw.at :
            raw.time != null ? raw.time :
              raw.timestamp != null ? raw.timestamp : null
      )
    );
    if (at == null || at < 0 || at > source.duration) {
      fail(
        "RECEIPT_TIME_INVALID",
        "Receipt " + clean(raw && (raw.id || raw.key)) +
          " is outside source " + source.id + "."
      );
    }
    var kind = clean(settings.kind || raw.type || raw.kind || "receipt");
    var allowExcerpt = settings.publicExcerptAllowed !== false;
    var excerpt = allowExcerpt
      ? publicExcerpt(
          raw.excerpt || raw.quote || raw.receipt || raw.text || ""
        )
      : "";
    var ids = stableStrings(
      settings.entityIds || raw.entityIds || []
    ).filter(function (id) {
      return !/^source:[A-Za-z0-9_-]{11}$/.test(id);
    });
    return {
      key: clean(settings.key || raw.id || raw.key),
      at: at,
      end: sourceEnd(raw, at, source.duration),
      kind: kind,
      label: clean(
        settings.label || raw.category || raw.label || raw.name || kind
      ),
      excerpt: excerpt,
      evidenceLevel: clean(
        settings.evidenceLevel || raw.evidenceLevel || "machine"
      ),
      evidenceType: clean(
        settings.evidenceType || evidenceType(kind)
      ),
      evidenceBasis: clean(settings.evidenceBasis),
      reviewState: clean(
        settings.reviewState ||
          reviewState(raw.evidenceLevel, raw.reviewState)
      ),
      speaker: null,
      speakerStatus: "not-diarized",
      promotionAllowed: false,
      publicExcerptAllowed: Boolean(allowExcerpt && excerpt),
      signalScore: settings.signalScore == null ? null : settings.signalScore,
      signalBasis: settings.signalScore == null ? null : clean(settings.signalBasis),
      topicMentions: settings.topicMentions == null
        ? null
        : Math.max(0, Math.round(number(settings.topicMentions))),
      topicFirstAt: settings.topicFirstAt == null
        ? null
        : Math.max(0, number(settings.topicFirstAt)),
      topicPeakAt: settings.topicPeakAt == null
        ? null
        : Math.max(0, number(settings.topicPeakAt)),
      topicCluster: settings.topicCluster == null
        ? null
        : Math.max(0, Math.round(number(settings.topicCluster))),
      topicMetricBasis: settings.topicMentions == null &&
          settings.topicFirstAt == null &&
          settings.topicPeakAt == null
        ? null
        : clean(settings.topicMetricBasis),
      showWikiHidden: settings.showWikiHidden === true,
      editorNote: clean(settings.editorNote),
      entityIds: ids,
    };
  }

  function exactShowcaseReceipts(source, receipts, curatedBounds) {
    return array(receipts).map(function (receipt) {
      var raw = receipt;
      var key = clean(receipt && receipt.id);
      var bound = curatedBounds.get(key);
      if (evidenceType(receipt && receipt.type) ===
          "curated-character-performance") {
        if (!bound || bound.sourceId !== source.id ||
            Math.abs(number(receipt.t) - bound.at) > 0.01 ||
            bound.end > source.duration) {
          fail(
            "CURATED_RECEIPT_BOUND_MISMATCH",
            "Curated receipt " + key +
              " does not match its exact source playback boundary."
          );
        }
        raw = Object.assign({}, receipt, { end: bound.end });
      }
      return normalizedReceipt(raw, source, {
        key: receipt.id,
        kind: receipt.type,
        label: receipt.category,
        evidenceLevel: receipt.evidenceLevel || "machine",
        evidenceType: evidenceType(receipt.type),
        evidenceBasis: "exact-showcase-receipt",
        reviewState: reviewState(receipt.evidenceLevel),
        publicExcerptAllowed: true,
        signalScore: numberOrNull(receipt.score),
        signalBasis: numberOrNull(receipt.score) == null
          ? null
          : "showcase-receipt-score",
        entityIds: receipt.entityIds,
      });
    });
  }

  function rawTopicReceipt(source, topic, index, basis, restricted, entityIdForLabel) {
    var at = numberOrNull(topic.peak);
    if (at == null) at = numberOrNull(topic.first);
    var firstAt = numberOrNull(topic.first);
    var peakAt = numberOrNull(topic.peak);
    if (firstAt != null && (firstAt < 0 || firstAt > source.duration)) firstAt = null;
    if (peakAt != null && (peakAt < 0 || peakAt > source.duration)) peakAt = null;
    var label = clean(topic.name || topic.label || "TOPIC");
    var signalScore = boundedSignal(topic.score);
    var signalBasis = signalScore == null ? null : "caption-derived-topic-score";
    if (signalScore == null) {
      signalScore = boundedSignal(topic.mentions);
      signalBasis = signalScore == null
        ? null
        : "caption-derived-topic-mention-count-bounded";
    }
    if (signalScore == null) {
      signalScore = boundedSignal(topic.cluster);
      signalBasis = signalScore == null
        ? null
        : "caption-derived-topic-cluster";
    }
    return normalizedReceipt(
      {
        id: [
          source.id,
          "topic",
          slug(label),
          at == null ? index : Math.floor(at),
        ].join(":"),
        t: at,
        end: topic.end,
        type: "topic-navigation",
        label: label,
        excerpt: topic.receipt || topic.excerpt || "",
      },
      source,
      {
        kind: "topic-navigation",
        label: label,
        evidenceLevel: "machine",
        evidenceType: restricted
          ? "caption-topic-navigation"
          : "caption-topic-receipt",
        evidenceBasis: basis,
        reviewState: restricted
          ? "quarantined-topic-navigation"
          : "machine-surfaced",
        publicExcerptAllowed: !restricted,
        signalScore: signalScore,
        signalBasis: signalBasis,
        topicMentions: numberOrNull(topic.mentions),
        topicFirstAt: firstAt,
        topicPeakAt: peakAt,
        topicCluster: numberOrNull(topic.cluster),
        topicMetricBasis: "automatic-caption-topic-frequency-and-timing",
        entityIds: [entityIdForLabel(label, "topic")],
      }
    );
  }

  function rawMomentReceipt(source, moment, index, basis) {
    return normalizedReceipt(
      Object.assign({}, moment, {
        id: clean(moment.id) || [
          source.id,
          "moment",
          Math.floor(number(moment.t)),
          index,
        ].join(":"),
        type: "moment",
      }),
      source,
      {
        kind: "moment",
        label: moment.category || "MOMENT",
        evidenceLevel: "machine",
        evidenceType: "caption-excerpt",
        evidenceBasis: basis,
        reviewState: basis.indexOf("archive-deep") >= 0
          ? "quarantined-machine-candidate"
          : "machine-surfaced",
        publicExcerptAllowed: true,
        signalScore: numberOrNull(moment.heat),
        signalBasis: numberOrNull(moment.heat) == null
          ? null
          : "caption-derived-heat",
      }
    );
  }

  function rawCharacterReceipt(
    source,
    character,
    index,
    basis,
    entityIdForLabel
  ) {
    var label = clean(character.character || character.label || "CHARACTER");
    var status = normalized(character.status);
    var type = status === "character reference"
      ? "caption-character-signal"
      : "caption-character-context";
    var kind = type === "caption-character-signal"
      ? "character-signal"
      : "character-context";
    return normalizedReceipt(
      {
        id: [
          source.id,
          "character",
          slug(label),
          Math.floor(number(character.t)),
          index,
        ].join(":"),
        t: character.t,
        end: character.end,
        type: kind,
        label: label,
        excerpt: character.receipt || character.excerpt || "",
      },
      source,
      {
        kind: kind,
        label: label,
        evidenceLevel: "machine",
        evidenceType: type,
        evidenceBasis: basis,
        reviewState: basis.indexOf("archive-deep") >= 0
          ? "quarantined-machine-candidate"
          : "machine-surfaced",
        publicExcerptAllowed: true,
        entityIds: [entityIdForLabel(label, "character")],
      }
    );
  }

  function editorialPackReceipts(source, entityIdForLabel) {
    var registry = root.WWAM_EPISODE_EDITORIAL_PACKS;
    var pack = registry && registry.sources &&
      registry.sources[source.id];
    if (!pack || clean(pack.reviewState) !==
        "full-tape-human-editorial-read") {
      return [];
    }
    if (number(pack.evidence && pack.evidence.duration) &&
        Math.abs(number(pack.evidence.duration) - source.duration) > 2) {
      return [];
    }
    var output = [];
    array(pack.highlights).forEach(function (highlight, index) {
      var category = clean(highlight.category).toUpperCase();
      var people = array(highlight.characters);
      var isCharacter = category === "CHARACTER PERFORMANCE" &&
        people.length > 0;
      var entries = isCharacter ?
        [{ label: clean(highlight.label), performance: false }].concat(
          people.map(function (person) {
            return { label: person, performance: true };
          })
        ) :
        [{ label: clean(highlight.label), performance: false }];
      entries.forEach(function (entry, entryIndex) {
        var characterReceipt = isCharacter && entry.performance === true;
        var label = clean(entry.label || highlight.label || category);
        var evidenceType = characterReceipt ?
          "curated-character-performance" :
          category === "STRAIGHT TO STEVE'S ASSHOLE" ?
            "reviewed-guide-negative-take" :
            category === "WWAM UP IN YA" ?
              "reviewed-up-in-ya-highlight" :
              "reviewed-episode-highlight";
        output.push(normalizedReceipt(
          {
            id: [
              source.id,
              "editorial",
              String(index + 1).padStart(2, "0"),
              String(entryIndex + 1).padStart(2, "0"),
            ].join(":"),
            t: highlight.at,
            end: highlight.end,
            excerpt: highlight.excerpt,
          },
          source,
          {
            kind: characterReceipt ? "character-performance" : "moment",
            label: label,
            evidenceLevel: "human-editorial",
            evidenceType: evidenceType,
            evidenceBasis: "full-tape-human-editorial-read",
            reviewState: "human-editor-reviewed",
            publicExcerptAllowed: true,
            signalScore: Math.max(1, 100 - index),
            signalBasis: "human-editorial-selection-order",
            editorNote: category,
            entityIds: characterReceipt ?
              [entityIdForLabel(label, "character")] : [],
          }
        ));
      });
    });
    return output;
  }

  function famCalloutReceipts(source) {
    var index = root.WWAM_FAM_INDEX;
    var show = index && index.shows && index.shows[source.id];
    if (!show || source.coverage !== "caption-backed") return [];
    return array(show.callouts).filter(function (callout) {
      return number(callout && callout.at) >= 0 &&
        number(callout && callout.at) < source.duration;
    }).map(function (callout, index) {
      var at = Math.max(0, number(callout.at));
      var requestedEnd = Math.max(at + 8, number(callout.end));
      var end = Math.min(source.duration, requestedEnd);
      return normalizedReceipt(
        {
          id: clean(callout.id) || [
            source.id,
            "fam",
            slug(callout.displayName),
            Math.floor(at),
            index,
          ].join(":"),
          t: at,
          end: end,
          type: "fan-callout",
          label: clean(callout.displayName) || "WWAM FAM CALLOUT",
          excerpt: clean(callout.excerpt),
        },
        source,
        {
          kind: "fan-callout",
          label: clean(callout.displayName) || "WWAM FAM CALLOUT",
          evidenceLevel: "machine",
          evidenceType: "caption-fan-name-navigation",
          evidenceBasis: "automatic-caption-name-interaction-readout",
          reviewState: "machine-surfaced-name-readout",
          publicExcerptAllowed: true,
          entityIds: [],
        }
      );
    }).filter(function (receipt) {
      return receipt.at < receipt.end && receipt.end <= source.duration;
    });
  }

  // Both the watchalong and livestream canons carry a source-local listening
  // pass for public YouTube uploads. Keep one deterministic pass per source
  // (the richer watchalong record wins on the 49 overlaps) so the universal
  // Show Wiki can expose every available listening route without duplicating
  // the same timestamp. The audio pass is a ranking aid only: it never
  // upgrades a candidate into a human-reviewed joke, speaker, or intent claim.
  function sourceAudioPass(source, watchalongById, livestreamById) {
    var watchEpisode = watchalongById && watchalongById.get(source.id);
    var liveEpisode = livestreamById && livestreamById.get(source.id);
    var passFromEpisode = function (episode) {
      if (!episode) return null;
      return episode.watchPass ||
        (Array.isArray(episode.candidates) ? episode : null);
    };
    var watchPass = passFromEpisode(watchEpisode);
    var livePass = passFromEpisode(liveEpisode);
    var usable = function (pass) {
      return pass && pass.status !== "held-age-restricted" &&
        array(pass.candidates).length > 0;
    };
    if (usable(watchPass)) {
      return { pass: watchPass, origin: "watchalong" };
    }
    if (usable(livePass)) {
      return { pass: livePass, origin: "livestream" };
    }
    return null;
  }

  function sourceAudioPassReceipts(source, watchalongById, livestreamById) {
    var selected = sourceAudioPass(source, watchalongById, livestreamById);
    var pass = selected && selected.pass;
    if (!pass || source.coverage !== "caption-backed" ||
        pass.status === "held-age-restricted") return [];
    var candidates = array(pass.candidates).filter(function (candidate) {
      var at = numberOrNull(candidate && candidate.t);
      return at != null && at >= 0 && at <= source.duration;
    });
    return candidates.map(function (candidate, index) {
      var at = Math.max(0, number(candidate.t));
      var requestedEnd = Math.max(at + 8, number(candidate.end));
      var end = Math.min(source.duration, requestedEnd);
      var category = clean(candidate.category || candidate.label || "LISTENING SPIKE");
      var alignedExcerpt = clean(candidate.captionExcerpt || candidate.excerpt);
      var excerpt = alignedExcerpt ||
        "No caption fragment aligned; open the source and listen to this audio-ranked window.";
      var score = boundedSignal(candidate.score);
      var candidateBasis = clean(candidate.evidenceBasis);
      return normalizedReceipt(
        {
          id: source.id + ":audio-pass:" + Math.floor(at) + ":" + index,
          t: at,
          end: end,
          type: "audio-feature-candidate",
          label: category,
          excerpt: excerpt,
        },
        source,
        {
          kind: "moment",
          label: category,
          evidenceLevel: "machine",
          evidenceType: "audio-feature-candidate",
          evidenceBasis: "canonical " + selected.origin +
            " audio pass; " + (candidateBasis ||
              "local audio ranked against the source caption clock"),
          reviewState: "audio-feature-candidate; playback remains the authority",
          publicExcerptAllowed: Boolean(alignedExcerpt),
          signalScore: score,
          signalBasis: score == null ? null : "audio-pass-ranked-candidate",
        }
      );
    });
  }

  function timelineReceipts(source, overlay) {
    var heatmap = array(overlay && overlay.heatmap).filter(function (point) {
      return Number.isFinite(Number(point && point.from)) &&
        Number(point.from) >= 0 &&
        Number(point.from) <= source.duration;
    });
    if (!heatmap.length || !source.duration) return [];
    var targetCount = source.duration >= 10800 ? 10 :
      source.duration >= 7200 ? 8 :
        source.duration >= 3600 ? 6 : 4;
    var selected = [];
    for (var bin = 0; bin < targetCount; bin += 1) {
      var from = bin * source.duration / targetCount;
      var to = (bin + 1) * source.duration / targetCount;
      var candidates = heatmap.filter(function (point) {
        var at = number(point.from);
        return at >= from &&
          (bin + 1 === targetCount ? at <= to : at < to);
      }).sort(function (left, right) {
        return number(right.heat) - number(left.heat) ||
          number(left.from) - number(right.from);
      });
      if (candidates[0]) selected.push(candidates[0]);
    }
    return selected.map(function (point, index) {
      var at = Math.max(0, number(point.from));
      var end = Math.max(at + 1, Math.min(
        source.duration,
        number(point.to) || at + Math.max(30, source.duration / 30)
      ));
      var label = clean(point.topic || point.signal || "Show checkpoint");
      return normalizedReceipt(
        {
          id: [
            source.id,
            "timeline",
            String(index + 1).padStart(2, "0"),
            Math.floor(at),
          ].join(":"),
          t: at,
          end: end,
          type: "topic-timeline-navigation",
          label: label,
        },
        source,
        {
          kind: "topic-timeline-navigation",
          label: label,
          evidenceLevel: "machine",
          evidenceType: "caption-topic-timeline-navigation",
          evidenceBasis: "caption-heatmap-runtime-checkpoint",
          reviewState: "source-bounded-navigation",
          publicExcerptAllowed: false,
          signalScore: boundedSignal(point.heat),
          signalBasis: "caption-heatmap-zone-intensity",
          showWikiHidden: true,
        }
      );
    });
  }

  function titleTopicReceipt(source, topic, index, restricted) {
    var firstAt = numberOrNull(topic && topic.firstAt);
    var peakAt = numberOrNull(topic && topic.peakAt);
    var at = peakAt == null ? firstAt : peakAt;
    if (at == null || at < 0 || at > source.duration) return null;
    var label = clean(topic.label);
    if (!label) return null;
    return normalizedReceipt(
      {
        id: [
          source.id,
          "title-topic",
          slug(label),
          Math.floor(at),
          index,
        ].join(":"),
        t: at,
        excerpt: restricted ? "" : topic.excerpt,
      },
      source,
      {
        kind: "topic-navigation",
        label: label,
        evidenceLevel: "machine",
        evidenceType: "caption-title-topic-receipt",
        evidenceBasis: restricted
          ? "restricted-title-subject-caption-navigation"
          : clean(topic.evidenceBasis) ||
            "official-title-subject-confirmed-in-source-local-captions",
        reviewState: restricted
          ? "quarantined-topic-navigation"
          : "source-bounded-title-topic",
        publicExcerptAllowed: !restricted,
        signalScore: boundedSignal(topic.mentions),
        signalBasis: "exact-title-subject-caption-mention-count-bounded",
        topicMentions: topic.mentions,
        topicFirstAt: firstAt == null ? at : firstAt,
        topicPeakAt: peakAt == null ? at : peakAt,
        topicCluster: topic.mentions,
        topicMetricBasis:
          "official-title-subject-exact-caption-frequency-and-timing",
        entityIds: ["topic:" + slug(label)],
      }
    );
  }

  function mergeTitleTopicReceipts(source, receipts, topics, restricted) {
    var additions = array(topics).map(function (topic, index) {
      return titleTopicReceipt(source, topic, index, restricted);
    }).filter(Boolean);
    if (!additions.length) return receipts;
    var labels = new Set(additions.map(function (receipt) {
      return normalized(receipt.label);
    }));
    return array(receipts).filter(function (receipt) {
      var isTopic = normalized(receipt.kind).indexOf("topic") >= 0;
      return !isTopic || !labels.has(normalized(receipt.label));
    }).concat(additions);
  }

  function restrictedTopicNavigationReceipts(receipts) {
    return array(receipts).filter(function (receipt) {
      return normalized(receipt.kind).indexOf("topic") >= 0 ||
        normalized(receipt.evidenceType).indexOf("topic") >= 0;
    }).map(function (receipt) {
      var titleTopic =
        receipt.evidenceType === "caption-title-topic-receipt";
      return Object.assign({}, receipt, {
        kind: "topic-navigation",
        excerpt: "",
        evidenceType: titleTopic
          ? "caption-title-topic-receipt"
          : "caption-topic-navigation",
        evidenceBasis: titleTopic
          ? clean(receipt.evidenceBasis) ||
            "restricted-title-subject-caption-navigation"
          : "restricted-topic-navigation",
        reviewState: "quarantined-topic-navigation",
        speaker: null,
        speakerStatus: "not-diarized",
        promotionAllowed: false,
        publicExcerptAllowed: false,
      });
    });
  }

  function stableReceipts(receipts) {
    var keys = new Set();
    return array(receipts).slice().sort(function (left, right) {
      return left.at - right.at || left.key.localeCompare(right.key);
    }).filter(function (receipt) {
      if (!receipt.key || keys.has(receipt.key)) {
        if (receipt.key) {
          fail("RECEIPT_ID_DUPLICATE", "Duplicate dossier receipt " + receipt.key + ".");
        }
        fail("RECEIPT_ID_REQUIRED", "A dossier receipt is missing its key.");
      }
      keys.add(receipt.key);
      return true;
    });
  }

  function signalOrder(left, right) {
    var leftScore = left.signalScore == null ? -1 : left.signalScore;
    var rightScore = right.signalScore == null ? -1 : right.signalScore;
    return rightScore - leftScore || left.at - right.at || left.key.localeCompare(right.key);
  }

  var SHOW_WIKI_NEGATIVE_TERMS = [
    "never watch", "couldnt stand", "didnt like", "dont like", "not good",
    "hate", "hated", "worst", "awful", "terrible", "trash", "garbage",
    "sucks", "suck", "bad", "stupid", "dumb", "ruined", "boring", "ugly",
  ];
  var SHOW_WIKI_TARGET_TERMS = [
    "movie", "film", "franchise", "installment", "sequel", "prequel", "remake",
    "reboot", "scene", "sequence", "ending", "opening", "story", "plot", "script",
    "writing", "direction", "directing", "performance", "acting", "score", "music",
    "soundtrack", "shot", "cinematography", "mask", "effect", "effects",
    "dialogue", "pacing", "tone", "design", "edit", "editing", "character",
    "characters", "actor", "actors", "cast", "costume",
  ];
  var SHOW_WIKI_NEGATORS = [
    "not", "no", "never", "dont", "doesnt", "didnt", "wasnt", "isnt",
    "arent", "cant", "without",
  ];
  var REVIEWED_STEVE_GUIDE_CUTS = Object.freeze({
    "6VXSBDZ-3WE@2802": "The dog-death beat is the specific choice this commentary rejects.",
    "ThPjds8iI9U@3733": "The scalpel kill is the exact Halloween II choice taking the hit.",
    "4UokRLETypU@5234": "This is a direct whole-movie rejection of Halloween III on the commentary tape.",
    "28PfRNKoSCA@5411": "The ending and reveal are what this Halloween 4 take sends down the chute.",
    "AtcRT3Xkk6E@389": "The Halloween 5 mask gets a direct, unmistakable rejection.",
    "ZWF8TPnHr4Y@5380": "This late Michael-and-movie turn is dismissed as stupid and dumb.",
    "3wK00_-K-Y0@4483": "The cops and the movie logic are the targets of this Halloween 6 complaint.",
    "5HfhwoDSQ0E@2816": "One line is singled out as the worst line in Halloween Kills.",
    "WkYLphAdlYc@3153": "The kill itself is the specific Friday the 13th choice being rejected.",
    "vGIoZMLhz9k@4937": "The easy disposal of Jason is what sends this sequence down the chute.",
    "Y5-DV5MSURQ@5214": "The New Blood receives a direct whole-movie condemnation here.",
    "EIw3TG3XwxA@5612": "The writing and timeline logic are the precise targets of this complaint.",
    "bP5RMi24zBg@1962": "The line delivery and performance take the hit in this scene-specific verdict.",
    "7qgebnDYVi4@1012": "The remake's special effects are rejected as garbage.",
    "l8HKF-nXdyc@4450": "The lack of story is the center of this direct film complaint.",
    "e7aq2cqVf-k@32": "Freddy's Dead is introduced as the least favorite Freddy movie.",
    "vFdRkvErLmQ@5730": "The story logic is what this late commentary take cannot buy into.",
    "qTQdWKcwn4A@2102": "One remake kill is singled out as among the worst-executed kills.",
  });
  var REVIEWED_STEVE_MOMENT_CUTS = Object.freeze({
    "ReVyxwuuoAM@5500": "The ranked movie receives a direct rejection tied to the Steve running gag.",
    "7hPJ_zey7hc@10159": "The trailer-trash origin is the specific Halloween choice being rejected.",
    "nNglwg-IU5g@3915": "The actor is spared; the character itself is the target of this complaint.",
    "2lAONSSscQk@248": "One performance is singled out as the weak point in an otherwise defended cast.",
    "r7NqiQ_YLcY@6003": "This is a direct whole-movie rejection, saved with its original context.",
    "7hPJ_zey7hc@5895": "The Stephen King movie receives a blunt whole-film condemnation.",
  });
  var REJECTED_STEVE_MOMENT_CUTS = Object.freeze({
    "5svmLdmNud0@8642": true,
    "Q-ia3Nb9KvM@9804": true,
    "w8309SyyriA@7547": true,
  });

  function showWikiTokens(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2018\u2019']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function phraseOccurrences(tokens, phrase) {
    var phraseTokens = showWikiTokens(phrase);
    var output = [];
    for (var start = 0; start <= tokens.length - phraseTokens.length; start += 1) {
      var matches = phraseTokens.every(function (token, offset) {
        return tokens[start + offset] === token;
      });
      if (matches) {
        output.push({
          term: phrase,
          start: start,
          end: start + phraseTokens.length - 1,
        });
      }
    }
    return output;
  }

  function occurrenceDistance(left, right) {
    if (left.end < right.start) return right.start - left.end - 1;
    if (right.end < left.start) return left.start - right.end - 1;
    return 0;
  }

  function negatedEvaluation(tokens, occurrence) {
    var term = showWikiTokens(occurrence.term).join(" ");
    if (/^(?:not|dont|didnt|couldnt|never)\b/.test(term)) return false;
    return tokens.slice(Math.max(0, occurrence.start - 4), occurrence.start)
      .some(function (token) {
        return SHOW_WIKI_NEGATORS.indexOf(token) >= 0;
      });
  }

  function negativeOpinionReceipt(receipt) {
    var tokens = showWikiTokens(receipt.excerpt);
    var deniesHate = tokens.some(function (token, index) {
      if (token !== "hate" && token !== "hated") return false;
      var previous = tokens[index - 1] || "";
      var next = tokens[index + 1] || "";
      var afterNext = tokens[index + 2] || "";
      return ["dont", "didnt", "not", "never", "doesnt", "isnt", "wasnt"]
        .indexOf(previous) >= 0 ||
        (previous === "to" && tokens[index - 2] === "not") ||
        (previous === "not" && tokens[index - 2] === "do") ||
        (next === "to" && ["see", "say", "tell", "admit"].indexOf(afterNext) >= 0);
    });
    if (deniesHate) return false;
    var evaluations = [];
    var targets = [];
    SHOW_WIKI_NEGATIVE_TERMS.forEach(function (term) {
      evaluations = evaluations.concat(phraseOccurrences(tokens, term));
    });
    SHOW_WIKI_TARGET_TERMS.forEach(function (term) {
      targets = targets.concat(phraseOccurrences(tokens, term));
    });
    return evaluations.some(function (evaluation) {
      if (negatedEvaluation(tokens, evaluation)) return false;
      return targets.some(function (target) {
        return occurrenceDistance(evaluation, target) <= 8;
      });
    });
  }

  function reviewedGuideSteveReceipt(source, guide) {
    var fanRead = guide && typeof guide === "object" &&
      guide.fanRead && typeof guide.fanRead === "object" ?
      guide.fanRead : {};
    var hated = fanRead.hated && typeof fanRead.hated === "object" ?
      fanRead.hated : {};
    var at = numberOrNull(hated.at);
    if (at == null) return null;
    var identity = source.id + "@" + Math.floor(at);
    var note = REVIEWED_STEVE_GUIDE_CUTS[identity];
    if (!note) return null;
    return normalizedReceipt(
      {
        id: source.id + ":reviewed-steve-guide:" + Math.floor(at),
        t: at,
        end: hated.end,
        type: "moment",
        category: "FRANCHISE FELONY",
        excerpt: hated.excerpt,
      },
      source,
      {
        kind: "moment",
        label: "FRANCHISE FELONY",
        evidenceLevel: "reviewed",
        evidenceType: "reviewed-guide-negative-take",
        evidenceBasis: clean(hated.evidenceBasis) ||
          "reviewed-episode-guide-negative-cut",
        reviewState: "editorially-screened-source-cut",
        publicExcerptAllowed: true,
        signalScore: 99,
        signalBasis: "screened-explicit-negative-language-and-target",
        editorNote: note,
      }
    );
  }

  function showWikiFormat(source) {
    var haystack = clean(source.title + " " + source.displayTitle).toLowerCase();
    if (source.sourceType === "commentary" || /\b(?:commentary|watch\s*along)\b/.test(haystack)) {
      return { id: "movie-commentary", label: "MOVIE COMMENTARY", basis: "registered-source-type-and-title" };
    }
    if (/\b(?:script\s*(?:read|reading)|table\s*read|screenplay\s*(?:read|reading))\b/.test(haystack)) {
      return { id: "script-reading", label: "SCRIPT READING", basis: "source-title-metadata" };
    }
    if (/\b(?:watch\s*party|live\s*watch|watching\s+.*\s+live)\b/.test(haystack)) {
      return { id: "watch-party", label: "WATCH PARTY", basis: "source-title-metadata" };
    }
    if (/\b(?:ranking|ranked|tier\s*list|royal\s*rumble|tournament|bracket|countdown|top\s+\d+)\b/.test(haystack)) {
      return { id: "ranking-show", label: "RANKING / BRACKET SHOW", basis: "source-title-metadata" };
    }
    if (/\b(?:versus|vs\.?|fight|battle)\b/.test(haystack)) {
      return { id: "versus-show", label: "VERSUS / FIGHT SHOW", basis: "source-title-metadata" };
    }
    if (/\b(?:spoiler|ending\s*explained|after\s*party)\b/.test(haystack)) {
      return { id: "spoiler-party", label: "SPOILER PARTY", basis: "source-title-metadata" };
    }
    if (/\b(?:trailer|teaser|first\s*look)\b/.test(haystack)) {
      return { id: "trailer-reaction", label: "TRAILER REACTION", basis: "source-title-metadata" };
    }
    if (/(?:^|\s)q\s*(?:\+|&|and)\s*a(?:\s|$)/.test(haystack) || /\bquestions?\s+and\s+answers?\b/.test(haystack)) {
      return { id: "q-and-a", label: "Q + A", basis: "source-title-metadata" };
    }
    if (/\b(?:interview|special\s+guest|writer|director)\b/.test(haystack)) {
      return { id: "interview", label: "INTERVIEW / GUEST SHOW", basis: "source-title-metadata" };
    }
    if (/\b(?:anniversary|birthday\s+special|retrospective)\b/.test(haystack)) {
      return { id: "anniversary", label: "ANNIVERSARY SPECIAL", basis: "source-title-metadata" };
    }
    if (/\b(?:news|updates?|breaking|rumors?)\b/.test(haystack)) {
      return { id: "horror-news", label: "HORROR NEWS SHOW", basis: "source-title-metadata" };
    }
    return { id: "livestream", label: "WWAM LIVESTREAM", basis: "registered-source-type" };
  }

  var EPISODE_GUIDE_FORMAT_COMPATIBILITY = Object.freeze({
    "review-reaction": Object.freeze([
      "spoiler-party", "trailer-reaction", "livestream"
    ]),
    ranking: Object.freeze([
      "ranking-show", "versus-show"
    ]),
    livestream: Object.freeze([
      "livestream", "q-and-a", "interview", "anniversary",
      "spoiler-party", "horror-news"
    ]),
    "movie-news": Object.freeze([
      "horror-news", "livestream"
    ])
  });

  function episodeGuideForSource(source, rawGuide) {
    if (rawGuide == null) return null;
    if (typeof rawGuide !== "object" || Array.isArray(rawGuide)) {
      fail(
        "EPISODE_GUIDE_INVALID",
        "Episode Guide " + source.id + " must be a plain source-local object."
      );
    }
    var guide = clone(rawGuide);
    var declaredGuideFormat = clean(guide.format);
    var runtimeFormat = showWikiFormat(source);
    if (declaredGuideFormat) {
      var compatibleFormats =
        EPISODE_GUIDE_FORMAT_COMPATIBILITY[declaredGuideFormat];
      if (!compatibleFormats ||
          compatibleFormats.indexOf(runtimeFormat.id) < 0) {
        fail(
          "EPISODE_GUIDE_FORMAT_DRIFT",
          "Episode Guide " + source.id + " declares " +
            declaredGuideFormat + " but canonical source metadata resolves " +
            runtimeFormat.id + "."
        );
      }
    }
    guide.runtimeFormat = {
      id: runtimeFormat.id,
      label: runtimeFormat.label,
      basis: runtimeFormat.basis,
      declaredGuideFormat: declaredGuideFormat
    };
    return guide;
  }

  function showWikiBriefFor(source) {
    if (source.coverage === "caption-backed") return null;
    var format = showWikiFormat(source);
    return {
      kind: "source-metadata-brief",
      scope: "canonical-source-metadata-only",
      format: format.label,
      formatBasis: format.basis,
      queryAliases: [
        "what can you prove about this show",
        "show source brief",
        "source brief",
        "what is registered",
        "what do you know for sure"
      ],
    };
  }

  var SHOW_WIKI_TOPIC_STOPWORDS = new Set([
    "a", "an", "and", "at", "for", "from", "in", "live", "movie", "of", "on",
    "show", "the", "to", "with", "wwam"
  ]);
  var SHOW_WIKI_FRANCHISE_TOPIC_ALIASES = [
    { title: ["michael myers", "the shape"], topic: ["halloween"] },
    { title: ["ghostface", "woodsboro"], topic: ["scream"] },
    { title: ["jason voorhees", "crystal lake"], topic: ["friday the 13th"] },
    { title: ["freddy krueger", "springwood"], topic: ["nightmare on elm street"] }
  ];

  function showWikiTitleTopicScore(source, receipt) {
    var title = normalized(clean(source.title + " " + source.displayTitle));
    var topic = normalized([receipt.label].concat(array(receipt.entityIds)).join(" "));
    if (!title || !topic) return 0;
    // The title subject is the clearest entry door for an episode Wiki. The
    // caption-derived signal orders the remaining subjects without claiming
    // that title overlap proves a dominant opinion or verdict.
    var score = number(receipt.signalScore) * 10;
    if (normalized(receipt.evidenceType) === "caption title topic receipt") {
      score += 5000;
    }
    var proseTopic = normalized(showWikiProseLabel(receipt.label));
    if (proseTopic && (" " + title + " ").indexOf(" " + proseTopic + " ") >= 0) score += 1200;
    SHOW_WIKI_FRANCHISE_TOPIC_ALIASES.forEach(function (group) {
      var titleMatch = group.title.some(function (alias) {
        return (" " + title + " ").indexOf(" " + normalized(alias) + " ") >= 0;
      });
      var topicMatch = group.topic.some(function (alias) {
        return (" " + topic + " ").indexOf(" " + normalized(alias) + " ") >= 0;
      });
      if (titleMatch && topicMatch) score += 1200;
    });
    var titleTokens = new Set(title.split(" ").filter(function (token) {
      return token.length > 2 && !SHOW_WIKI_TOPIC_STOPWORDS.has(token);
    }));
    topic.split(" ").forEach(function (token) {
      if (token.length > 2 && titleTokens.has(token)) score += token.length >= 7 ? 12 : 7;
    });
    return score;
  }

  function showWikiSelectedTopics(source, topics, maximum) {
    return topics.map(function (receipt, index) {
      return { receipt: receipt, index: index, score: showWikiTitleTopicScore(source, receipt) };
    }).sort(function (left, right) {
      return right.score - left.score || left.index - right.index;
    }).slice(0, maximum).map(function (entry) { return entry.receipt; });
  }

  function showWikiProseLabel(value) {
    var label = clean(value).replace(/^topic:\s*/i, "");
    if (label && label === label.toUpperCase()) {
      label = label.toLowerCase().replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
      });
    }
    return label;
  }

  function showWikiCharacterNames(characterLore) {
    return new Map(array(characterLore && characterLore.characters).map(function (character) {
      return ["character:" + clean(character.id).toLowerCase(), clean(character.name)];
    }).filter(function (entry) { return entry[0] !== "character:" && entry[1]; }));
  }

  function showWikiList(values, fallback) {
    var unique = [];
    array(values).forEach(function (value) {
      var label = clean(value);
      if (label && unique.indexOf(label) < 0) unique.push(label);
    });
    if (!unique.length) return fallback || "the registered source map";
    if (unique.length === 1) return unique[0];
    if (unique.length === 2) return unique[0] + " and " + unique[1];
    return unique.slice(0, -1).join(", ") + ", and " + unique[unique.length - 1];
  }

  function showWikiRuntime(seconds) {
    var minutes = Math.max(1, Math.round(number(seconds) / 60));
    var hours = Math.floor(minutes / 60);
    var remainder = minutes % 60;
    return hours ? hours + " hr" + (remainder ? " " + remainder + " min" : "") : minutes + " min";
  }

  function showWikiClock(seconds) {
    var total = Math.max(0, Math.round(number(seconds)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var remainder = total % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : String(minutes)) +
      ":" + String(remainder).padStart(2, "0");
  }

  function showWikiEvenSample(values, limit) {
    var ordered = array(values).slice().sort(function (left, right) {
      return left.at - right.at || left.key.localeCompare(right.key);
    });
    if (ordered.length <= limit) return ordered;
    var sampled = [];
    for (var index = 0; index < limit; index += 1) {
      var offset = Math.round(index * (ordered.length - 1) / Math.max(1, limit - 1));
      if (sampled.indexOf(ordered[offset]) < 0) sampled.push(ordered[offset]);
    }
    return sampled;
  }

  function showWikiRoute(source, moments, topics) {
    if (!moments.length) return showWikiEvenSample(topics, 5);
    var remaining = moments.slice().sort(signalOrder);
    var selected = [];
    var labels = new Set();
    while (remaining.length && selected.length < 5) {
      var bestIndex = 0;
      var bestValue = -Infinity;
      remaining.forEach(function (receipt, index) {
        var heat = receipt.signalScore == null ? 45 : receipt.signalScore;
        var novelty = labels.has(receipt.label) ? 0 : 20;
        var separation = selected.length ? Math.min.apply(null, selected.map(function (chosen) {
          return Math.abs(chosen.at - receipt.at) / Math.max(1, source.duration);
        })) * 42 : 0;
        var value = heat + novelty + separation;
        if (value > bestValue || value === bestValue &&
            (receipt.at < remaining[bestIndex].at ||
             receipt.at === remaining[bestIndex].at && receipt.key < remaining[bestIndex].key)) {
          bestIndex = index;
          bestValue = value;
        }
      });
      var chosen = remaining.splice(bestIndex, 1)[0];
      selected.push(chosen);
      labels.add(chosen.label);
    }
    return selected.sort(function (left, right) {
      return left.at - right.at || left.key.localeCompare(right.key);
    });
  }

  function showWikiExperienceFor(source, moments, topics) {
    var route = showWikiRoute(source, moments, topics);
    var pulse = showWikiEvenSample(moments.length ? moments : topics, 24);
    var momentMode = moments.length > 0;
    var topicMode = !momentMode && topics.length > 0;
    if (!momentMode && !topicMode) {
      return {
        id: "source-brief",
        label: "CONTENT ROUTE",
        title: "CONTENT ROUTE NOT DISTILLED",
        description: "Canonical source identity is registered, but no source-local topic or moment receipt is available for a content route.",
        selectionBasis: "no-source-local-receipt-route",
        emptyState: "The official source remains available without an invented topic hop, highlight path, quote, reaction, or creator verdict.",
        queryAliases: [
          "content route status", "is this show distilled",
          "does this show have moments", "does this show have topics"
        ],
        routeReceiptKeys: [],
        pulseReceiptKeys: [],
      };
    }
    return {
      id: momentMode ? "midnight-cut" : "topic-hop",
      label: "WWAM WATCH PATH",
      title: momentMode ? "THE MIDNIGHT CUT" : "THE TOPIC HOP",
      description: momentMode
        ? "An optional five-stop sampler through this exact tape, balancing preserved archive heat, category variety, and separation across the runtime. The complete Highlight Runway remains available separately."
        : "A chronological route through the exact topic doors registered to this tape; no reaction, speaker, or visual outcome is inferred.",
      selectionBasis: momentMode
        ? "machine-assembled-from-source-local-moments-using-heat-variety-and-runtime-separation"
        : "machine-assembled-from-source-local-topic-navigation",
      emptyState: "This tape has no source-local receipt route yet. The player remains available without an invented highlight path.",
      queryAliases: [
        "give me the watch path", "show me the watch path",
        "five stop watch path", "quick watch", "play the highlights",
        "watch this show fast", momentMode ? "midnight cut" : "topic hop"
      ],
      routeReceiptKeys: route.map(function (receipt) { return receipt.key; }),
      pulseReceiptKeys: pulse.map(function (receipt) { return receipt.key; }),
    };
  }

  function showWikiFanOverview(source, format, title, topicPhrase, hasTopics, moments) {
    var runtime = showWikiRuntime(source.duration);
    var focus = hasTopics ? topicPhrase : "the night’s loose movie talk";
    var opening;
    if (format.id === "movie-commentary") {
      opening = title + " runs " + runtime + " as a commentary that keeps circling " + focus + ".";
    } else if (format.id === "ranking-show") {
      opening = title + " runs " + runtime + " as a ranking night built around " + focus + ".";
    } else if (format.id === "trailer-reaction") {
      opening = title + " runs " + runtime + " as a reaction stream moving through " + focus + ".";
    } else if (format.id === "spoiler-review") {
      opening = title + " runs " + runtime + " as a spoiler-room conversation centered on " + focus + ".";
    } else {
      opening = title + " runs " + runtime + " with " + focus + " on the table.";
    }
    if (moments.length) {
      return opening + " Jump in at " + showWikiClock(moments[0].at) + " for the first " +
        showWikiProseLabel(moments[0].label) +
        " spike, then use the chapters to roam the rest of the tape.";
    }
    if (hasTopics) {
      return opening + " The topic buttons go straight to each part of the original upload.";
    }
    return "";
  }
  function showWikiRecapFor(
    source,
    receipts,
    moments,
    topics,
    characters,
    steves,
    funny,
    characterNames
  ) {
    if (source.coverage !== "caption-backed" || !receipts.length) return null;
    var format = showWikiFormat(source);
    var title = clean(source.displayTitle || source.title);
    var recapTopics = showWikiSelectedTopics(source, topics, 4);
    var topicLabels = recapTopics.map(function (receipt) { return showWikiProseLabel(receipt.label); });
    var characterLabels = [];
    characters.slice(0, 4).forEach(function (receipt) {
      array(receipt.entityIds).forEach(function (entityId) {
        var characterId = clean(entityId).toLowerCase();
        if (characterId.indexOf("character:") !== 0) return;
        var label = characterNames.get(characterId) ||
          showWikiProseLabel(characterId.split(":").slice(1).join(":").replace(/[-_]+/g, " "));
        if (label && characterLabels.indexOf(label) < 0) characterLabels.push(label);
      });
    });
    if (!characterLabels.length) {
      characterLabels = characters.slice(0, 4).map(function (receipt) {
        return showWikiProseLabel(receipt.label);
      });
    }
    var topicPhrase = showWikiList(topicLabels, format.id === "movie-commentary" ? "the movie itself" : "the night itself");
    var episodeGuide = source.episodeGuide && typeof source.episodeGuide === "object"
      ? source.episodeGuide : null;
    var sourceSummary = source.summary && clean(source.summary.text);
    if (/explicit performance cue/i.test(sourceSummary)) sourceSummary = "";
    var summaryWithTitle = sourceSummary &&
      normalized(sourceSummary).indexOf(normalized(title)) >= 0
      ? sourceSummary : sourceSummary ? title + ". " + sourceSummary : "";
    var overview = clean(episodeGuide && episodeGuide.overview) ||
      showWikiFanOverview(source, format, title, topicPhrase, topicLabels.length > 0, moments) ||
      summaryWithTitle ||
      (title + " runs " + showWikiRuntime(source.duration) +
        ". This upload has no public topic or highlight path yet.");
    var blocks = [];
    if (topics.length) {
      blocks.push({
        id: "on-the-slab",
        label: format.id === "movie-commentary" ? "WHAT THE COMMENTARY KEEPS CIRCLING" : "WHAT IS ON THE SLAB",
        body: "Start with " + topicPhrase +
          ". Every button below opens this same upload where that conversation begins.",
        basis: "source-local-topic-navigation-receipts",
        receiptKeys: recapTopics.map(function (receipt) { return receipt.key; }),
      });
    }
    if (moments.length) {
      var first = moments[0];
      blocks.push({
        id: "where-it-spikes",
        label: format.id === "ranking-show" ? "WHERE THE BRACKET GETS BLOODY" :
          format.id === "movie-commentary" ? "WHERE THE COMMENTARY BITES" :
            format.id === "trailer-reaction" ? "WHERE THE REACTION SPIKES" : "WHERE THE NIGHT SPIKES",
        body: "The first stop is " + showWikiClock(first.at) +
          " for '" + showWikiProseLabel(first.label) + "'. The other jumps below are the next strongest moments from this show.",
        basis: "source-local-moment-receipts-ranked-by-preserved-signal",
        receiptKeys: moments.slice(0, 4).map(function (receipt) { return receipt.key; }),
      });
    }
    if (characters.length) {
      blocks.push({
        id: "characters-walk-in",
        label: "WHEN THE CHARACTERS WALK IN",
        body: "This tape pulls in " + showWikiList(characterLabels) +
          ". The timestamps below are where those character signals surface. Play the source for the complete context and delivery.",
        basis: "source-local-character-receipts-with-speaker-firewall",
        receiptKeys: characters.slice(0, 4).map(function (receipt) { return receipt.key; }),
      });
    } else {
      var flavor = steves.length ? steves : funny;
      if (flavor.length) {
        blocks.push({
          id: steves.length ? "what-gets-condemned" : "what-breaks-the-room",
          label: steves.length ? "WHAT GETS SENT TO STEVE" : "WHAT BREAKS THE ROOM",
          body: steves.length
            ? "This tape has some of the night's hardest negative takes. Every timestamp below opens the original tape for the complete exchange."
            : "The comedy map starts with " + showWikiList(flavor.slice(0, 4).map(function (receipt) { return showWikiProseLabel(receipt.label); })) +
              ". Each line below stays attached to its original timestamp.",
          basis: steves.length ? "strict-source-local-negative-take-gate" : "canonical-source-local-comedy-categories",
          receiptKeys: flavor.slice(0, 4).map(function (receipt) { return receipt.key; }),
        });
      }
    }
    return {
      format: format.label,
      formatBasis: format.basis,
      overview: overview,
      queryAliases: [
        "summarize this show", "summarize this episode", "summarize this tape",
        "summarize this commentary", "give me a summary", "show summary",
        "episode recap", "what happened in this show",
        "what is this show about", "give me the rundown"
      ],
      blocks: blocks.slice(0, 3),
    };
  }

  function showWikiFor(
    source,
    receipts,
    characterNames,
    comedyCategories,
    episodeRecap
  ) {
    var topics = receipts.filter(function (receipt) {
      return !receipt.showWikiHidden &&
        normalized(receipt.kind).indexOf("topic") >= 0;
    });
    var moments = receipts.filter(function (receipt) {
      return normalized(receipt.kind).indexOf("moment") >= 0;
    }).slice().sort(signalOrder);
    var editorialMoments = moments.filter(function (receipt) {
      return receipt.evidenceBasis === "full-tape-human-editorial-read";
    });
    if (editorialMoments.length) moments = editorialMoments;
    var funny = moments.filter(function (receipt) {
      return comedyCategories.has(receipt.label) ||
        receipt.evidenceBasis === "full-tape-human-editorial-read" &&
        /UP IN YA|ROOM BREAK|RANKING COMEDY|HORROR COMEDY|RUNNING BIT/i
          .test(clean(receipt.editorNote));
    });
    var upInYa = moments.filter(function (receipt) {
      return receipt.label === "UP IN YA" ||
        receipt.label === "OUT OF POCKET" ||
        receipt.evidenceType === "reviewed-up-in-ya-highlight";
    });
    var steves = moments.filter(function (receipt) {
      var identity = source.id + "@" + Math.floor(number(receipt.at));
      if (REJECTED_STEVE_MOMENT_CUTS[identity]) return false;
      if (REVIEWED_STEVE_MOMENT_CUTS[identity]) {
        receipt.editorNote = REVIEWED_STEVE_MOMENT_CUTS[identity];
        return true;
      }
      return receipt.evidenceType === "reviewed-guide-negative-take" ||
        negativeOpinionReceipt(receipt);
    });
    steves.forEach(function (receipt) {
      var identity = source.id + "@" + Math.floor(number(receipt.at));
      receipt.steveEvidenceState =
        receipt.evidenceType === "reviewed-guide-negative-take" ||
        REVIEWED_STEVE_MOMENT_CUTS[identity] ?
          "editorially-screened-source-cut" :
          /quarantined/i.test(clean(receipt.reviewState)) ?
            "strict-candidate-playback-review-ready" :
            "strict-source-bounded-negative-take";
    });
    var characterCandidates = receipts.filter(function (receipt) {
      return receipt.evidenceType === "curated-character-performance" ||
        receipt.evidenceType === "reviewed-character-performance";
    }).slice().sort(signalOrder);
    var characters = [];
    characterCandidates.forEach(function (receipt) {
      var identity = array(receipt.entityIds)[0] ||
        normalized(receipt.label);
      var duplicateIndex = characters.findIndex(function (candidate) {
        var candidateIdentity = array(candidate.entityIds)[0] ||
          normalized(candidate.label);
        return identity === candidateIdentity &&
          Math.abs(number(candidate.at) - number(receipt.at)) <= 12;
      });
      if (duplicateIndex < 0) {
        characters.push(receipt);
        return;
      }
      /*
       * A full-tape editorial receipt replaces an older narrow curated cut
       * at the same performance. This preserves the richer title and bounds
       * without counting one Loomis rant twice.
       */
      if (receipt.evidenceBasis === "full-tape-human-editorial-read" &&
          characters[duplicateIndex].evidenceBasis !==
            "full-tape-human-editorial-read") {
        characters[duplicateIndex] = receipt;
      }
    });
    characters.sort(signalOrder);
    var characterReferences = receipts.filter(function (receipt) {
      return receipt.evidenceType === "caption-character-signal" ||
        receipt.evidenceType === "caption-character-context";
    }).slice().sort(signalOrder);
    var famCallouts = receipts.filter(function (receipt) {
      return receipt.evidenceType === "caption-fan-name-navigation";
    }).slice().sort(function (left, right) {
      return number(left.at) - number(right.at);
    });
    var distilled = source.coverage === "caption-backed" &&
      Boolean(source.summary || receipts.length);
    var topicNavigationOnly = distilled && !moments.length && topics.length > 0;

    function lane(id, label, description, emptyState, values, queryAliases) {
      return {
        id: id,
        label: label,
        description: description,
        emptyState: emptyState,
        queryAliases: queryAliases,
        receiptKeys: values.map(function (receipt) { return receipt.key; }),
      };
    }

    var audioPassReceipts = receipts.filter(function (receipt) {
      return receipt.evidenceType === "audio-feature-candidate";
    }).slice().sort(signalOrder);
    var audioPassOrigin = audioPassReceipts.some(function (receipt) {
      return /^canonical livestream audio pass/i.test(receipt.evidenceBasis);
    }) ? "livestream" : "watchalong";

    var laneById = {
      topics: lane(
        "topics",
        "TOPICS",
        "Timestamped topic-navigation receipts registered to this exact upload.",
        "No source-local topic-navigation receipts are registered for this show yet.",
        topics,
        [
          "what did they talk about", "where do they talk about",
          "where did they talk about", "talk about", "what was discussed",
          "topics", "topics discussed", "what did they cover", "show the topics",
          "episode topics", "did they talk about any topics",
          "what topics did they get into", "what is covered in this episode"
        ]
      ),
      "best-moments": lane(
        "best-moments",
        editorialMoments.length ? "BEST MOMENTS" : "PLAYABLE CLIP CANDIDATES",
        editorialMoments.length ?
          "Human-reviewed highlights from the complete show; the list grows when the tape earns more." :
          "Source-linked moments worth checking. They are candidates until somebody reviews the complete exchange.",
        "No source-local moment receipts are registered for this show yet.",
        moments,
        [
          "best moments", "best moment", "top moments", "top moment",
          "strongest moments", "most memorable moments", "show the highlights",
          "episode highlights", "which parts should i watch"
        ]
      ),
      "funny-moments": lane(
        "funny-moments",
        editorialMoments.length ? "FUNNY MOMENTS" : "POSSIBLE COMEDY CLIPS",
        editorialMoments.length ?
          "Human-reviewed comedy turns from this complete show." :
          "Caption-flagged comedy candidates. Playback decides whether the room actually breaks.",
        "No source-local moment with a canonical comedy category is registered for this show yet.",
        funny,
        [
          "funniest moments", "funniest moment", "funny moments", "funny moment",
          "what made them laugh", "room breaks", "biggest laughs",
          "where did they crack up"
        ]
      ),
      "up-in-ya": lane(
        "up-in-ya",
        "WWAM UP IN YA",
        "Moment receipts labeled UP IN YA, plus the legacy OUT OF POCKET label that predates this shelf. Every receipt keeps its original label.",
        "No moment labeled UP IN YA or its legacy OUT OF POCKET alias is registered for this show yet.",
        upInYa,
        [
          "wwam up in ya", "up in ya", "most deranged moments",
          "most deranged moment", "wildest moments", "wildest moment",
          "out of pocket", "craziest thing they said", "craziest things they said",
          "deranged things they said"
        ]
      ),
      "straight-to-steves-asshole": lane(
        "straight-to-steves-asshole",
        "STRAIGHT TO STEVE'S ASSHOLE",
        "Strict strong-negative-take candidates: an eligible moment label plus negative language and an explicit movie-related referent.",
        "No source-local moment passes the strict negative-take evidence gate for this show yet.",
        steves,
        [
          "what did they hate", "what did they dislike", "worst moments",
          "worst moment", "negative takes", "straight to steve",
          "steves asshole", "sent to steve", "what did the guys hate",
          "what got sent straight to steve's asshole",
          "what got sent to steve's asshole"
        ]
      ),
      "character-bits": lane(
        "character-bits",
        "CHARACTER PERFORMANCES",
        "Editor-confirmed Loomis, Challis, Slenderman, Feldman, and other recurring-character performances from this exact show.",
        "No character performance has been confirmed in this show yet.",
        characters,
        [
          "which characters", "recurring characters", "character bits",
          "character moments", "what characters are indexed", "impressions",
          "character impressions", "character voices", "when do they do voices"
        ]
      ),
      "character-references": lane(
        "character-references",
        "REFERENCES & CALLBACKS",
        "Playable places where a recurring character is named or discussed. These are useful callbacks, not claimed performances.",
        "No recurring-character reference is indexed for this show yet.",
        characterReferences,
        [
          "character references", "character callbacks", "named characters",
          "where do they mention Loomis", "where do they mention Challis",
          "where do they mention Slenderman", "where do they mention Feldman"
        ]
      ),
      "wwam-fam": lane(
        "wwam-fam",
        "WWAM FAM ROLL CALL",
        "Public names and handles read from the live room, each attached to this exact upload and timestamp. Counts describe the caption index, not donation totals.",
        "No conservative public-name interaction readout is indexed for this tape yet.",
        famCallouts,
        [
          "who was in the chat", "fan callouts", "superchats",
          "super chats", "wwam fam", "fam roll call", "community moments",
          "which fans showed up", "who did they read from chat",
          "fan questions", "supporter moments"
        ]
      ),
    };
    if (audioPassReceipts.length) {
      laneById["audio-pass"] = lane(
        "audio-pass",
        "LISTENING PASS",
        "Audio-ranked windows from the local " + audioPassOrigin +
          " pass. These are useful places to press play, not proof that a joke, speaker, or intention landed.",
        "No source-local audio-ranked route is registered for this show yet.",
        audioPassReceipts,
        [
          "audio pass", "listening pass", "audio routes", "listen for the room",
          "acoustic moments", "soundbyte candidates"
        ]
      );
    }
    var format = showWikiFormat(source);
    var laneOrder = format.id === "movie-commentary"
      ? ["best-moments", "wwam-fam", "funny-moments", "up-in-ya", "straight-to-steves-asshole", "character-bits", "character-references", "topics"]
      : format.id === "ranking-show"
        ? ["topics", "wwam-fam", "straight-to-steves-asshole", "best-moments", "funny-moments", "up-in-ya", "character-bits", "character-references"]
        : ["topics", "wwam-fam", "best-moments", "funny-moments", "up-in-ya", "straight-to-steves-asshole", "character-bits", "character-references"];
    if (audioPassReceipts.length) {
      var audioIndex = format.id === "movie-commentary" ? 1 : 2;
      laneOrder.splice(Math.min(audioIndex, laneOrder.length), 0, "audio-pass");
    }
    var recap = distilled
      ? showWikiRecapFor(
        source, receipts, moments, topics, characters, steves, funny, characterNames
      )
      : null;
    var brief = showWikiBriefFor(source);

    return {
      label: "SHOW WIKI",
      status: topicNavigationOnly ? "topic-nav-only" : distilled ? "distilled" : brief ? "source-brief" : "queued",
      description: topicNavigationOnly
        ? "This source is mapped only through source-local topic navigation; public comedy, character, and reaction moments remain withheld under its audio-boundary policy."
        : distilled
          ? "This " + format.label.toLowerCase() + " is rebuilt from source-local caption evidence as a playable episode guide; speaker identity and intent remain unverified."
          : "Canonical source identity and title-derived format are registered; transcript-derived recap, topics, quotes, reactions, and moment lanes remain sealed until source-local evidence is distilled.",
      experience: showWikiExperienceFor(source, moments, topics),
      brief: brief,
      recap: recap,
      episodeRecap: episodeRecap || null,
      episodeGuide: source.coverage === "caption-backed" ? source.episodeGuide || null : null,
      lanes: laneOrder.map(function (id) { return laneById[id]; }),
    };
  }

  function artifactShell(raw, kind, receiptKeys, sourceIds, creatorDraft) {
    return {
      key: clean(raw.id || raw.key),
      kind: kind,
      label: clean(
        raw.label || raw.title || raw.subject || raw.anchor || raw.id || kind
      ),
      receiptKeys: stableStrings(receiptKeys),
      sourceIds: stableStrings(sourceIds),
      creatorDraft: Boolean(creatorDraft),
      reviewState: creatorDraft
        ? "creator-draft-review-only"
        : "derived-review-only",
      promotionAllowed: false,
    };
  }

  function buildArtifacts(showcase, clipLab) {
    var output = new Map();
    var receiptSource = new Map();

    function bucket(sourceId) {
      if (!output.has(sourceId)) {
        output.set(sourceId, {
          takeTimeMachines: [],
          bitLineages: [],
          shorts: [],
          supercuts: [],
          resurfacing: [],
        });
      }
      return output.get(sourceId);
    }

    function sourceIdsFromReceipts(receiptKeys) {
      return stableStrings(array(receiptKeys).map(function (key) {
        return receiptSource.get(clean(key));
      }).filter(Boolean));
    }

    function add(sourceId, collection, artifact) {
      var values = bucket(sourceId)[collection];
      if (!values.some(function (value) { return value.key === artifact.key; })) {
        values.push(artifact);
      }
    }

    array(showcase && showcase.receipts).forEach(function (receipt) {
      receiptSource.set(clean(receipt.id), clean(receipt.sourceId));
    });

    var timeMachines = array(
      showcase && (
        showcase.takeTimeMachines ||
        (typeof showcase.getTimeMachines === "function"
          ? showcase.getTimeMachines()
          : [])
      )
    );
    timeMachines.forEach(function (machine) {
      var receiptKeys = array(machine.receiptIds || machine.receipts).map(function (item) {
        return clean(typeof item === "string" ? item : item && (item.id || item.receiptId));
      }).filter(Boolean);
      var sourceIds = stableStrings(
        sourceIdsFromReceipts(receiptKeys).concat(
          array(machine.milestones).map(function (item) { return item.sourceId; })
        )
      );
      sourceIds.forEach(function (sourceId) {
        add(
          sourceId,
          "takeTimeMachines",
          artifactShell(
            machine,
            "take-time-machine",
            receiptKeys.filter(function (key) {
              return receiptSource.get(key) === sourceId;
            }),
            sourceIds,
            false
          )
        );
      });
    });

    var bitLineages = array(
      showcase && (
        showcase.bitAncestry ||
        (typeof showcase.getBitLineages === "function"
          ? showcase.getBitLineages()
          : [])
      )
    );
    bitLineages.forEach(function (lineage) {
      var performances = array(lineage.performances || lineage.events || lineage.receipts);
      var receiptKeys = performances.map(function (item) {
        return clean(
          typeof item === "string" ? item :
            item && (item.receiptId || item.id)
        );
      }).filter(Boolean);
      var sourceIds = stableStrings(
        performances.map(function (item) {
          return item && item.sourceId;
        }).concat(sourceIdsFromReceipts(receiptKeys))
      );
      sourceIds.forEach(function (sourceId) {
        add(
          sourceId,
          "bitLineages",
          artifactShell(
            lineage,
            "bit-lineage",
            receiptKeys.filter(function (key) {
              return receiptSource.get(key) === sourceId;
            }),
            sourceIds,
            false
          )
        );
      });
    });

    [
      { name: "shorts", kind: "creator-short" },
      { name: "supercuts", kind: "creator-supercut" },
      { name: "resurfacing", kind: "creator-resurfacing" },
    ].forEach(function (group) {
      array(
        clipLab && clipLab[group.name] ||
        showcase && showcase[group.name]
      ).forEach(function (artifact) {
        var receiptKeys = stableStrings(
          [artifact.receiptId].concat(artifact.receiptIds || [])
        );
        var sourceIds = stableStrings(
          [artifact.sourceId]
            .concat(artifact.sourceIds || [])
            .concat(sourceIdsFromReceipts(receiptKeys))
        );
        sourceIds.forEach(function (sourceId) {
          add(
            sourceId,
            group.name,
            artifactShell(
              artifact,
              group.kind,
              receiptKeys.filter(function (key) {
                return receiptSource.get(key) === sourceId;
              }),
              sourceIds,
              true
            )
          );
        });
      });
    });

    output.forEach(function (collections) {
      Object.keys(collections).forEach(function (key) {
        collections[key].sort(function (left, right) {
          return left.key.localeCompare(right.key);
        });
      });
    });
    return output;
  }

  function emptyArtifacts() {
    return {
      takeTimeMachines: [],
      bitLineages: [],
      shorts: [],
      supercuts: [],
      resurfacing: [],
    };
  }

  function flattenArtifacts(collections) {
    return Object.keys(emptyArtifacts()).reduce(function (output, key) {
      return output.concat(array(collections && collections[key]));
    }, []).map(function (artifact) {
      return {
        id: artifact.key,
        kind: artifact.kind,
        label: artifact.label,
        authority: artifact.creatorDraft ? "creator-draft" : "editor-review",
        reviewState: artifact.reviewState,
        sourceIds: stableStrings(artifact.sourceIds),
        receiptKeys: stableStrings(artifact.receiptKeys),
        at: null,
        targetSection: "",
        risk: "",
        creatorDraft: artifact.creatorDraft,
        promotionAllowed: false,
      };
    }).sort(function (left, right) {
      return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id);
    });
  }

  function enforceRestrictedArtifactFirewall(sources) {
    var restrictedSourceIds = new Set(array(sources).filter(function (source) {
      return source &&
        source.rightsPolicy &&
        source.rightsPolicy.restrictedToTopicNavigation;
    }).map(function (source) {
      return source.id;
    }));
    if (!restrictedSourceIds.size) return;

    array(sources).forEach(function (source) {
      source.artifacts = array(source.artifacts).filter(function (artifact) {
        return !array(artifact.sourceIds).some(function (sourceId) {
          return restrictedSourceIds.has(sourceId);
        });
      });
      if (!source.metrics) return;
      source.metrics.takeTimeMachines = source.artifacts.filter(function (artifact) {
        return artifact.kind === "take-time-machine";
      }).length;
      source.metrics.bitLineages = source.artifacts.filter(function (artifact) {
        return artifact.kind === "bit-lineage";
      }).length;
      source.metrics.shorts = source.artifacts.filter(function (artifact) {
        return artifact.kind === "creator-short";
      }).length;
      source.metrics.supercuts = source.artifacts.filter(function (artifact) {
        return artifact.kind === "creator-supercut";
      }).length;
      source.metrics.resurfacing = source.artifacts.filter(function (artifact) {
        return artifact.kind === "creator-resurfacing";
      }).length;
    });
  }

  function buildEntityDefinitions(dna, showcase) {
    var definitions = [];
    var byId = new Map();
    var titleEligible = new Set();

    function add(raw, fallbackType, allowTitleAlias) {
      if (!raw) return;
      var id = clean(raw.id);
      var label = clean(raw.label || raw.name);
      if (!id || !label) return;
      var definition = {
        id: id,
        type: clean(raw.type || fallbackType || id.split(":")[0]),
        label: label,
        aliases: stableStrings([label].concat(raw.aliases || [])),
      };
      definitions.push(definition);
      byId.set(id, definition);
      if (allowTitleAlias) titleEligible.add(id);
    }

    array(dna && dna.entities).forEach(function (item) { add(item, "", true); });
    array(dna && dna.characters).forEach(function (item) {
      add(item, "character", true);
    });
    array(dna && dna.bitDefinitions).forEach(function (item) {
      add(item, "bit", true);
    });
    array(
      showcase && showcase.memoryGraph && showcase.memoryGraph.nodes
    ).forEach(function (item) { add(item, "", false); });

    definitions = Array.from(new Map(definitions.map(function (item) {
      return [item.id, item];
    })).values()).sort(function (left, right) {
      return left.id.localeCompare(right.id);
    });

    function forLabel(label, type) {
      var target = normalized(label);
      var match = definitions.find(function (definition) {
        if (type && definition.type !== type) return false;
        return definition.aliases.some(function (alias) {
          return normalized(alias) === target;
        });
      });
      return match ? match.id : (type || "topic") + ":" + slug(label);
    }

    return {
      definitions: definitions,
      titleDefinitions: definitions.filter(function (definition) {
        return titleEligible.has(definition.id);
      }),
      byId: byId,
      forLabel: forLabel,
    };
  }

  function buildEntities(source, receipts, catalogItem, entityRegistry) {
    var values = new Map();
    var basisRank = {
      "cached-title-alias": 1,
      "catalog-declared-entity": 2,
      "timestamped-receipt": 3,
    };

    function add(id, basis, receiptKey, matchedAlias, labelHint) {
      id = clean(id);
      if (!id) return;
      var definition = entityRegistry.byId.get(id);
      var type = clean(definition && definition.type || id.split(":")[0] || "entity");
      var label = clean(
        definition && definition.label ||
        labelHint ||
        titleCase(id.split(":").slice(1).join(" "))
      );
      var existing = values.get(id);
      if (!existing) {
        existing = {
          id: id,
          type: type,
          label: label,
          basis: basis,
          matchedAlias: clean(matchedAlias) || null,
          receiptKeys: [],
        };
        values.set(id, existing);
      } else if (basisRank[basis] > basisRank[existing.basis]) {
        existing.basis = basis;
        existing.matchedAlias = clean(matchedAlias) || null;
      }
      if (receiptKey && existing.receiptKeys.indexOf(receiptKey) < 0) {
        existing.receiptKeys.push(receiptKey);
      }
    }

    receipts.forEach(function (receipt) {
      receipt.entityIds.forEach(function (id) {
        add(id, "timestamped-receipt", receipt.key, "", receipt.label);
      });
    });

    if (catalogItem && source.coverage === "caption-backed") {
      if (catalogItem.franchise) {
        add(
          entityRegistry.forLabel(catalogItem.franchise, "franchise"),
          "catalog-declared-entity",
          "",
          "",
          catalogItem.franchise
        );
      }
      if (catalogItem.film) {
        add(
          entityRegistry.forLabel(catalogItem.film, "film"),
          "catalog-declared-entity",
          "",
          "",
          catalogItem.film
        );
      }
    }

    var normalizedTitle = " " + normalized(source.title) + " ";
    entityRegistry.titleDefinitions.forEach(function (definition) {
      var alias = definition.aliases
        .slice()
        .sort(function (left, right) { return right.length - left.length; })
        .find(function (candidate) {
          var value = normalized(candidate);
          return value.length >= 3 &&
            normalizedTitle.indexOf(" " + value + " ") >= 0;
        });
      if (alias) {
        add(
          definition.id,
          "cached-title-alias",
          "",
          alias,
          definition.label
        );
      }
    });

    return Array.from(values.values()).map(function (entity) {
      entity.receiptKeys.sort(function (left, right) {
        return left.localeCompare(right);
      });
      return entity;
    }).sort(function (left, right) {
      return left.id.localeCompare(right.id);
    });
  }

  function rightsPolicy(source, archiveStream) {
    var raw = archiveStream && archiveStream.rightsPolicy || {};
    var restricted = Boolean(raw.restrictedToTopicNavigation);
    var mode = clean(raw.mode);
    if (!mode) {
      if (source.coverage === "metadata-only") mode = "source-metadata-only";
      else if (source.coverage === "caption-limited") mode = "caption-limited";
      else if (source.authority === "promoted-lane") mode = "promoted-caption-receipts";
      else mode = "source-only";
    }
    return {
      mode: mode,
      candidateState: source.authority,
      publicExcerptWordLimit: PUBLIC_EXCERPT_WORDS,
      restrictedToTopicNavigation: restricted,
      speakerClaimsAllowed: false,
      performerClaimsAllowed: false,
      originClaimsAllowed: false,
      visualClaimsAllowed: false,
      promotionAllowed: false,
    };
  }

  function canonicalFormatClassification(source, policy) {
    var registry = root.WWAMEpisodeFormatContracts;
    if (!registry || typeof registry.classify !== "function") return null;
    var classification = registry.classify({
      id: source.id,
      title: source.title,
      displayTitle: source.displayTitle,
      sourceType: source.sourceType,
      rawContentMode: source.rawContentMode,
      rightsPolicy: policy,
    });
    var regressions = typeof registry.rightsRegressions === "function"
      ? registry.rightsRegressions(policy, classification.rightsPolicy)
      : [];
    if (regressions.length) {
      fail(
        "FORMAT_RIGHTS_REGRESSION",
        "Episode format classification relaxed canonical rights for " +
          source.id + ": " + regressions.join(", ") + "."
      );
    }
    return classification;
  }

  function assertCanonicalFormatCoverage(sources) {
    var registry = root.WWAMEpisodeFormatContracts;
    if (!registry || typeof registry.driftReport !== "function") return;
    var missing = array(sources).filter(function (source) {
      return !source.runtimeFormat || !source.runtimeFormat.id ||
        !source.subtype || !source.subtype.id ||
        !source.formatContract || !source.formatContract.id;
    });
    if (missing.length) {
      fail(
        "FORMAT_CLASSIFICATION_INCOMPLETE",
        "The canonical format registry did not classify " +
          missing.length + " source(s)."
      );
    }
    var report = registry.driftReport(sources);
    if (report.classified !== sources.length ||
        report.rightsRegressions.length) {
      fail(
        "FORMAT_CLASSIFICATION_DRIFT",
        "The canonical format drift gate failed: " +
          report.classified + "/" + sources.length +
          " classified, " + report.rightsRegressions.length +
          " rights regression(s)."
      );
    }
  }

  function warningsFor(source, archiveStream, receipts) {
    var warnings = [
      "VIEWS ARE A CACHED SNAPSHOT, NOT A LIVE POPULARITY COUNT.",
    ];
    if (source.availability === "not-captured" ||
        source.liveStatus === "not-captured") {
      warnings.push("CURRENT YOUTUBE AVAILABILITY WAS NOT CAPTURED.");
    }
    if (source.coverage === "metadata-only") {
      warnings.push("SOURCE METADATA ONLY // NO CONTENT CLAIMS OR RECEIPTS.");
    }
    if (source.coverage === "caption-limited") {
      warnings.push("CAPTION-LIMITED // NO SEMANTIC SUMMARY OR CONTENT RECEIPTS.");
    }
    if (receipts.length) {
      warnings.push("AUTOMATIC-CAPTION RECEIPTS DO NOT IDENTIFY A SPEAKER.");
    }
    if (source.authority === "quarantined-lane") {
      warnings.push("ARCHIVE DEEP EVIDENCE IS QUARANTINED AND NON-PROMOTABLE.");
    }
    if (archiveStream && archiveStream.rightsPolicy &&
        archiveStream.rightsPolicy.restrictedToTopicNavigation) {
      warnings.push("SOURCE-AUDIO FIREWALL // TOPIC NAVIGATION ONLY.");
      warnings.push("NO PUBLIC JOKE OR CHARACTER RECEIPTS ARE EXPOSED FROM THIS SOURCE.");
    }
    var exactSourceHeld = Boolean(
      archiveStream && archiveStream.captionEvidence &&
      archiveStream.captionEvidence.type === "exact-source-unavailable"
    );
    if (exactSourceHeld) {
      warnings.push(
        "EXACT YOUTUBE CUT HELD // NO RECAP, TOPIC, QUOTE, CHARACTER, HEAT, OR TIMESTAMP CLAIMS."
      );
    }
    if (archiveStream && archiveStream.alternateOfficialSource &&
        archiveStream.alternateOfficialSource.timestampIsomorphic === false) {
      warnings.push(
        "OFFICIAL PODCAST EDITION AVAILABLE // ITS EDIT DOES NOT MATCH THIS YOUTUBE CUT."
      );
    }
    if (archiveStream && archiveStream.alternateOfficialSource &&
        archiveStream.alternateOfficialSource.timestampIsomorphic === true) {
      warnings.push(
        "YOUTUBE IS AGE-RESTRICTED // THE VERIFIED OFFICIAL WWAM PODCAST TIMELINE PLAYS HERE."
      );
    }
    var span = numberOrNull(
      archiveStream && archiveStream.captionEvidence &&
      archiveStream.captionEvidence.durationCoveragePercent
    );
    if (!exactSourceHeld && span != null && span < 100) {
      warnings.push("AVAILABLE CAPTION SPAN: " + span + "% OF SOURCE DURATION.");
    }
    return stableStrings(warnings);
  }

  function officialAlternateFor(archiveStream) {
    var alternate = archiveStream && archiveStream.alternateOfficialSource;
    if (!alternate || (alternate.timestampIsomorphic !== false &&
        alternate.timestampIsomorphic !== true)) return null;
    return {
      kind: clean(alternate.kind),
      title: clean(alternate.title),
      episodeUrl: clean(alternate.episodeUrl),
      enclosureUrl: clean(alternate.enclosureUrl),
      duration: number(alternate.duration),
      canonicalDuration: number(alternate.canonicalYouTubeDuration),
      durationDelta: number(alternate.durationDelta),
      timestampIsomorphic: alternate.timestampIsomorphic === true,
      publicPlaybackAllowed: alternate.publicPlaybackAllowed === true,
      evidenceBoundary: clean(alternate.evidenceBoundary),
    };
  }

  function exactSourceHoldFor(archiveStream) {
    if (!archiveStream || !clean(archiveStream.exactSourceTranscriptState)) {
      return null;
    }
    return {
      state: clean(archiveStream.exactSourceTranscriptState),
      reason: clean(archiveStream.exactSourceHoldReason),
    };
  }

  function metricsFor(source, overlay, receipts, entities, artifacts) {
    var counts = {
      topics: 0,
      moments: 0,
      characters: 0,
    };
    receipts.forEach(function (receipt) {
      var kind = normalized(receipt.kind);
      if (kind.indexOf("topic") >= 0) counts.topics += 1;
      else if (kind.indexOf("character") >= 0) counts.characters += 1;
      else if (kind.indexOf("moment") >= 0) counts.moments += 1;
    });
    var heat = array(overlay && (overlay.heatmap || overlay.arc)).length;
    return {
      receiptCount: receipts.length,
      publicExcerptReceipts: receipts.filter(function (receipt) {
        return receipt.publicExcerptAllowed;
      }).length,
      topicReceipts: counts.topics,
      momentReceipts: counts.moments,
      characterReceipts: counts.characters,
      entityCount: entities.length,
      heatSegments: heat,
      captionMinutes: number(overlay && overlay.captionMinutes),
      captionCoveragePercent: numberOrNull(
        overlay && overlay.captionEvidence &&
        overlay.captionEvidence.durationCoveragePercent
      ),
      unhinged: numberOrNull(overlay && overlay.unhinged),
      takeTimeMachines: artifacts.takeTimeMachines.length,
      bitLineages: artifacts.bitLineages.length,
      shorts: artifacts.shorts.length,
      supercuts: artifacts.supercuts.length,
      resurfacing: artifacts.resurfacing.length,
    };
  }

  function channelFrom(input, dna) {
    if (input.channel && typeof input.channel === "object") return clone(input.channel);
    if (typeof input.channel === "string") {
      return { id: clean(dna && dna.id || "wwam"), label: clean(input.channel) };
    }
    return {
      id: clean(dna && dna.id || "wwam"),
      label: clean(dna && dna.channel || "We Watched A Movie"),
      product: clean(dna && dna.label || "WWAM After Midnight"),
    };
  }

  function assertPinnedShowcaseProof(
    showcaseSources,
    showcaseReceipts,
    artifactBySource
  ) {
    if (!showcaseSources.has(PINNED_SHOWCASE_SOURCE_ID)) {
      fail(
        "SHOWCASE_PROOF_INCOMPLETE",
        "The pinned Showcase source " + PINNED_SHOWCASE_SOURCE_ID + " is missing."
      );
    }
    var receipts = showcaseReceipts.get(PINNED_SHOWCASE_SOURCE_ID) || [];
    var receiptCounts = receipts.reduce(function (counts, receipt) {
      var type = evidenceType(receipt.type);
      counts[type] = number(counts[type]) + 1;
      return counts;
    }, {});
    if (receipts.length < 21 ||
        number(receiptCounts["caption-excerpt"]) < 7 ||
        number(receiptCounts["caption-topic-receipt"]) < 8 ||
        number(receiptCounts["curated-character-performance"]) < 6) {
      fail(
        "SHOWCASE_PROOF_INCOMPLETE",
        "The pinned Showcase source fell below its 21-receipt proof baseline."
      );
    }
    var artifacts = artifactBySource.get(PINNED_SHOWCASE_SOURCE_ID) ||
      emptyArtifacts();
    if (array(artifacts.bitLineages).length < 4 ||
        array(artifacts.shorts).length < 13 ||
        array(artifacts.supercuts).length < 6 ||
        array(artifacts.resurfacing).length < 4) {
      fail(
        "SHOWCASE_ARTIFACT_PROOF_INCOMPLETE",
        "The pinned Showcase source fell below its 27-artifact membership baseline."
      );
    }
  }

  function build(input) {
    input = input || {};
    var atlasPayload = input.atlas || input.archiveAtlas;
    var atlasRecords = atlasRecordsFrom(atlasPayload);
    var catalog = array(input.catalog);
    var deep = input.deep || {};
    var episodeGuides = input.episodeGuides || {};
    var live = input.live || {};
    var livestreamCanon = input.livestreamCanon || {};
    var livestreamAudioIndex = input.livestreamAudioIndex || {};
    var watchalongAudioIndex = input.watchalongAudioIndex || {};
    var popular = input.popular || {};
    var watchalongCanon = input.watchalongCanon || {};
    var archiveStreams = streamsFrom(
      input.archiveDeepPortfolio || input.archiveDeep
    );
    var showcase = input.showcase || null;
    var clipLab = input.clipLab || null;
    var dna = input.dna || input.channelDNA || {};
    var characterLore = input.characters || input.characterLore || {};
    var titleTopicPayload =
      input.titleTopicOverrides || root.WWAM_TITLE_TOPIC_OVERRIDES || {};
    var titleTopicBySource = new Map();
    array(titleTopicPayload.topics).forEach(function (topic) {
      var sourceId = clean(topic && topic.sourceId);
      if (!sourceId) return;
      if (!titleTopicBySource.has(sourceId)) {
        titleTopicBySource.set(sourceId, []);
      }
      titleTopicBySource.get(sourceId).push(topic);
    });
    var showWikiCharacterNameMap = showWikiCharacterNames(characterLore);
    var showWikiComedyCategories = new Set(array(dna.taxonomy && dna.taxonomy.comedySignals)
      .map(clean).filter(Boolean));
    if (!showWikiComedyCategories.size) {
      ["OUT OF POCKET", "BREAKDOWN", "BIT ENERGY", "THE ROOM BREAKS",
       "UP IN YA", "CHAT DID THIS", "FULL SEND"].forEach(function (label) {
        showWikiComedyCategories.add(label);
      });
    }

    assertMinimumCount(atlasRecords, MINIMUM_ATLAS_SOURCES, "WWAM Archive Atlas");
    assertMinimumCount(catalog, MINIMUM_CATALOG_SOURCES, "WWAM commentary catalog");
    if (archiveStreams.length < 40) {
      fail(
        "ARCHIVE_DEEP_COUNT_INVALID",
        "The normalized Archive Deep portfolio fell below its 40-source baseline."
      );
    }
    if (!showcase || !Array.isArray(showcase.sources) ||
        !Array.isArray(showcase.receipts)) {
      fail(
        "SHOWCASE_REQUIRED",
        "The normalized WWAM dossier requires the complete Showcase proof."
      );
    }

    var atlasById = mapById(atlasRecords, "WWAM Archive Atlas");
    var catalogById = mapById(catalog, "WWAM commentary catalog");
    var deepById = mapById(array(deep.tapes), "WWAM commentary distill");
    var episodeGuideRecords = array(episodeGuides.guides);
    var episodeGuideById = mapById(episodeGuideRecords, "WWAM Episode Guide V2");
    var expectedEpisodeGuides = number(deep.meta && deep.meta.episodeGuides);
    if (expectedEpisodeGuides && episodeGuideById.size < expectedEpisodeGuides) {
      fail(
        "EPISODE_GUIDE_COUNT_INVALID",
        "The demand-loaded Episode Guide V2 registry is incomplete."
      );
    }
    var liveStreams = streamsFrom(live);
    var popularStreams = streamsFrom(popular);
    var liveById = mapById(liveStreams, "WWAM Fresh 10");
    var popularById = mapById(popularStreams, "WWAM Popular 25");
    var watchalongById = mapById(
      episodeRecords(watchalongCanon),
      "WWAM Watchalong Canon"
    );
    var watchalongAudioById = mapById(
      episodeRecords(watchalongAudioIndex),
      "WWAM Watchalong Audio Index"
    );
    var watchalongPassById = watchalongAudioById.size
      ? watchalongAudioById
      : watchalongById;
    var livestreamCanonById = mapById(
      episodeRecords(livestreamCanon),
      "WWAM Livestream Canon"
    );
    var livestreamAudioById = mapById(
      episodeRecords(livestreamAudioIndex),
      "WWAM Livestream Audio Index"
    );
    var livestreamById = livestreamAudioById.size
      ? livestreamAudioById
      : livestreamCanonById;
    var archiveById = mapById(archiveStreams, "WWAM Archive Deep");
    var atlasIds = new Set(atlasById.keys());

    if (deepById.size < MINIMUM_CATALOG_SOURCES) {
      fail(
        "DEEP_DISTILL_COUNT_INVALID",
        "Commentary Deep Distill fell below its " +
          MINIMUM_CATALOG_SOURCES + "-tape baseline."
      );
    }
    if (liveById.size && liveById.size !== 10) {
      fail("FRESH_COUNT_INVALID", "Fresh must contain exactly ten sources.");
    }
    if (popularById.size && popularById.size !== 25) {
      fail("POPULAR_COUNT_INVALID", "Popular must contain exactly 25 sources.");
    }
    assertSubset(liveStreams, atlasIds, "WWAM Fresh 10");
    assertSubset(popularStreams, atlasIds, "WWAM Popular 25");
    assertSubset(
      archiveStreams,
      new Set(Array.from(atlasIds).concat(Array.from(catalogById.keys()))),
      "WWAM Archive Deep"
    );

    assertSubset(
      array(deep.tapes),
      new Set(catalogById.keys()),
      "WWAM commentary Deep Distill"
    );    assertSubset(
      episodeGuideRecords,
      new Set(Array.from(catalogById.keys()).concat(Array.from(atlasById.keys()))),
      "WWAM Episode Guide V2"
    );
    var overlap = Array.from(catalogById.keys()).filter(function (id) {
      return atlasById.has(id);
    });
    if (overlap.indexOf(EXPECTED_OVERLAP_ID) < 0) {
      fail(
        "FEED_CATALOG_OVERLAP_INVALID",
        "WWAM feed/catalog overlap must retain " + EXPECTED_OVERLAP_ID + "."
      );
    }

    var promotedIds = new Set(
      Array.from(catalogById.keys())
        .concat(Array.from(liveById.keys()))
        .concat(Array.from(popularById.keys()))
    );
    var archiveIds = new Set(archiveById.keys());
    var showcaseSources = new Map(array(showcase && showcase.sources).map(function (source) {
      return [clean(source.id), source];
    }));
    var showcaseReceipts = new Map();
    array(showcase && showcase.receipts).forEach(function (receipt) {
      var id = clean(receipt.sourceId);
      if (!showcaseReceipts.has(id)) showcaseReceipts.set(id, []);
      showcaseReceipts.get(id).push(receipt);
    });
    var artifactBySource = buildArtifacts(showcase, clipLab);
    var curatedBounds = curatedReceiptBounds(characterLore, showcase);
    assertPinnedShowcaseProof(
      showcaseSources,
      showcaseReceipts,
      artifactBySource
    );
    var entityRegistry = buildEntityDefinitions(dna, showcase);
    var canonical = new Map();

    atlasRecords.forEach(function (record) {
      canonical.set(record.id, {
        id: record.id,
        title: clean(record.title),
        date: clean(record.date),
        duration: number(record.duration),
        views: number(record.views),
        thumbnail: clean(record.thumbnail),
        url: clean(record.url),
        availability: clean(record.availability) || "not-captured",
        liveStatus: clean(record.liveStatus) || "not-captured",
        coverage: coverage(record.coverage),
        lanes: stableStrings(["streams-feed"].concat(record.lanes || [])),
        atlasRecord: record,
        catalogItem: null,
      });
    });

    catalog.forEach(function (item) {
      var existing = canonical.get(item.id);
      if (existing) {
        assertMetadataAgreement(existing, item, item.id, "Commentary catalog");
        existing.catalogItem = item;
        existing.lanes = stableStrings(existing.lanes.concat(["commentary-catalog"]));
        return;
      }
      canonical.set(item.id, {
        id: item.id,
        title: clean(item.title),
        date: clean(item.date),
        duration: number(item.duration),
        views: number(item.views),
        thumbnail: clean(item.thumbnail),
        url: clean(item.url),
        availability: clean(item.availability) || "not-captured",
        liveStatus: clean(item.liveStatus) || "not-captured",
        coverage: item.transcript === false ? "caption-limited" : "caption-backed",
        lanes: ["commentary-catalog"],
        atlasRecord: null,
        catalogItem: item,
      });
    });

    var expectedCanonicalUnion =
      atlasById.size + catalogById.size - overlap.length;
    if (canonical.size !== expectedCanonicalUnion ||
        canonical.size < MINIMUM_CANONICAL_SOURCES) {
      fail(
        "CANONICAL_SOURCE_COUNT_INVALID",
        "WWAM canonical dossier union must equal the current de-duplicated " +
          "Atlas/catalog union and retain at least " +
          MINIMUM_CANONICAL_SOURCES + " source IDs."
      );
    }

    var sources = Array.from(canonical.values()).map(function (base) {
      var id = base.id;
      var catalogItem = base.catalogItem || catalogById.get(id) || null;
      var commentaryTape = deepById.get(id) || null;
      var liveStream = liveById.get(id) || null;
      var popularStream = popularById.get(id) || null;
      var archiveStream = archiveById.get(id) || null;
      var showcaseSource = showcaseSources.get(id) || null;
      var exactSourceHold = exactSourceHoldFor(archiveStream);
      var overlay = archiveStream || commentaryTape || liveStream || popularStream ||
        showcaseSource || null;
      var overlayHasCaptionEvidence = Boolean(overlay && (
        number(overlay.wordsAudited || overlay.words) > 0 ||
        array(overlay.topics || overlay.chapters).length > 0 ||
        array(overlay.moments || overlay.highlights || overlay.soundbytes).length > 0
      ));
      var authority = archiveIds.has(id)
        ? "quarantined-lane"
        : promotedIds.has(id)
          ? "promoted-lane"
          : "source-only";
      var source = {
        id: id,
        title: base.title,
        displayTitle: clean(catalogItem && catalogItem.film || base.title),
        date: base.date,
        duration: base.duration,
        views: base.views,
        thumbnail: base.thumbnail,
        url: base.url,
        availability: archiveStream
          ? clean(archiveStream.availability) || base.availability
          : base.availability,
        liveStatus: archiveStream
          ? clean(archiveStream.liveStatus) || base.liveStatus
          : base.liveStatus,
        coverage: exactSourceHold
          ? "metadata-only"
          : overlayHasCaptionEvidence
            ? "caption-backed"
            : base.coverage,
        authority: authority,
        lanes: base.lanes,
        sourceType: catalogItem ? "commentary" : "livestream",
        rawContentMode: registeredRawContentMode([
          archiveStream,
          commentaryTape,
          liveStream,
          popularStream,
          showcaseSource,
        ]),
        wordsAudited: number(
          archiveStream && archiveStream.wordsAudited ||
          commentaryTape && commentaryTape.wordsAudited ||
          liveStream && liveStream.wordsAudited ||
          popularStream && popularStream.wordsAudited ||
          showcaseSource && showcaseSource.wordsAudited
        ),
        exactSourceHold: exactSourceHold,
        officialAlternate: officialAlternateFor(archiveStream),
        episodeGuide: null,
      };
      source.episodeGuide = episodeGuideForSource(
        source,
        (episodeGuideById.get(id) &&
          episodeGuideById.get(id).episodeGuide) ||
          commentaryTape && commentaryTape.episodeGuide ||
          null
      );
      var policy = rightsPolicy(source, archiveStream);
      var formatClassification = canonicalFormatClassification(source, policy);
      if (formatClassification) {
        policy = clone(formatClassification.rightsPolicy);
        source.runtimeFormat = clone(formatClassification.runtimeFormat);
        source.subtype = clone(formatClassification.subtype);
        source.formatContract = {
          id: formatClassification.contractId,
          schema: formatClassification.schema,
          registryVersion: formatClassification.registryVersion,
          classificationBasis: clone(
            formatClassification.classificationBasis
          ),
        };
      }

      var summaryText = "";
      var summaryBasis = "";
      if (source.coverage === "caption-backed") {
        if (archiveStream && archiveStream.summary) {
          summaryText = archiveStream.summary;
          summaryBasis = "archive-deep-derived-summary";
        } else if (showcaseSource && showcaseSource.summary) {
          summaryText = showcaseSource.summary;
          summaryBasis = "derived-caption-source-summary";
        } else if (commentaryTape && commentaryTape.verdict) {
          summaryText = commentaryTape.verdict;
          summaryBasis = "derived-caption-source-summary";
        } else if (liveStream && liveStream.summary) {
          summaryText = liveStream.summary;
          summaryBasis = "derived-caption-source-summary";
        } else if (popularStream && popularStream.editorial &&
                   popularStream.editorial.whyItMatters) {
          summaryText = popularStream.editorial.whyItMatters;
          summaryBasis = "derived-caption-editorial-summary";
        }
      }
      source.summary = summaryText
        ? { text: clean(summaryText), basis: summaryBasis }
        : null;

      var receipts = [];
      if (archiveStream && source.coverage === "caption-backed") {
        var restricted = Boolean(policy.restrictedToTopicNavigation);
        array(archiveStream.topics).forEach(function (topic, index) {
          receipts.push(rawTopicReceipt(
            source,
            topic,
            index,
            "archive-deep-topic-navigation",
            restricted,
            entityRegistry.forLabel
          ));
        });
        if (!restricted) {
          array(archiveStream.moments).forEach(function (moment, index) {
            receipts.push(rawMomentReceipt(
              source,
              moment,
              index,
              "archive-deep-quarantined-candidate"
            ));
          });
          array(archiveStream.characters).forEach(function (character, index) {
            receipts.push(rawCharacterReceipt(
              source,
              character,
              index,
              "archive-deep-quarantined-candidate",
              entityRegistry.forLabel
            ));
          });
        }
      } else if (authority === "promoted-lane" &&
                 source.coverage === "caption-backed") {
        if (showcase) {
          receipts = exactShowcaseReceipts(
            source,
            showcaseReceipts.get(id) || [],
            curatedBounds
          );
        } else {
          var rawSource = commentaryTape || liveStream || popularStream || {};
          array(rawSource.moments).forEach(function (moment, index) {
            receipts.push(rawMomentReceipt(
              source,
              moment,
              index,
              "legacy-promoted-lane-caption"
            ));
          });
          array(rawSource.topics).forEach(function (topic, index) {
            receipts.push(rawTopicReceipt(
              source,
              topic,
              index,
              "legacy-promoted-lane-caption",
              false,
              entityRegistry.forLabel
            ));
          });
          array(rawSource.characters).forEach(function (character, index) {
            receipts.push(rawCharacterReceipt(
              source,
              character,
              index,
              "legacy-promoted-lane-caption",
              entityRegistry.forLabel
            ));
          });
        }
      }
      if (source.coverage === "caption-backed") {
        receipts = mergeTitleTopicReceipts(
          source,
          receipts,
          titleTopicBySource.get(source.id) || [],
          Boolean(policy.restrictedToTopicNavigation)
        );
        receipts = receipts.concat(timelineReceipts(source, overlay));
        var reviewedSteveReceipt = reviewedGuideSteveReceipt(
          source,
          source.episodeGuide
        );
        if (reviewedSteveReceipt) receipts.push(reviewedSteveReceipt);
        receipts = receipts.concat(editorialPackReceipts(
          source,
          entityRegistry.forLabel
        ));
        receipts = receipts.concat(famCalloutReceipts(source));
        receipts = receipts.concat(sourceAudioPassReceipts(
          source,
          watchalongPassById,
          livestreamById
        ));
      }
      if (policy.restrictedToTopicNavigation) {
        receipts = restrictedTopicNavigationReceipts(receipts);
      }
      receipts = stableReceipts(receipts);
      var showWiki = showWikiFor(
        source,
        receipts,
        showWikiCharacterNameMap,
        showWikiComedyCategories,
        null
      );
      var episodeRecap = null;
      if (root.ShokkerEpisodeRecap && root.WWAMEpisodeRecapAdapter) {
        var episodeRecapMap = root.ShokkerEpisodeRecap.build({
          source: source,
          receipts: receipts,
          episodeGuide: source.episodeGuide,
          format: showWikiFormat(source),
          context: {
            title: clean(source.displayTitle || source.title),
            titleTopics: showWikiSelectedTopics(
              source,
              receipts.filter(function (receipt) {
                return !receipt.showWikiHidden && (
                  clean(receipt.kind).toLowerCase().indexOf("topic") >= 0 ||
                  clean(receipt.evidenceType).toLowerCase().indexOf("topic") >= 0
                );
              }),
              8
            ).map(function (receipt) {
              return showWikiProseLabel(receipt.label);
            }),
            summary: source.summary ? clone(source.summary) : null,
            registeredOverview: clean(
              showWiki.recap && showWiki.recap.overview
            ),
            editorial: overlay && overlay.editorial
              ? clone(overlay.editorial)
              : null,
            indices: overlay && overlay.indices
              ? clone(overlay.indices)
              : null,
            peak: overlay && overlay.peak
              ? clone(overlay.peak)
              : null,
            lanes: showWiki.lanes.map(function (lane) {
              return {
                id: lane.id,
                label: lane.label,
                receiptKeys: lane.receiptKeys.slice(),
              };
            }),
          },
        });
        episodeRecap = root.WWAMEpisodeRecapAdapter.build({
          map: episodeRecapMap,
          source: source,
        });
        episodeRecap.evidenceFingerprint =
          episodeRecapMap.evidenceFingerprint;
        episodeRecap.guideRecap = clone(episodeRecapMap.guideRecap);
      }
      source.episodeRecap = episodeRecap;
      showWiki.episodeRecap = episodeRecap;
      if (episodeRecap && clean(episodeRecap.state) === "ready" &&
          clean(episodeRecap.overview)) {
        showWiki.recap = {
          format: clean(episodeRecap.format && episodeRecap.format.label) ||
            clean(showWiki.recap && showWiki.recap.format),
          formatBasis:
            clean(episodeRecap.format && episodeRecap.format.basis) ||
            clean(showWiki.recap && showWiki.recap.formatBasis),
          overview: clean(episodeRecap.overview),
          queryAliases: array(showWiki.recap && showWiki.recap.queryAliases),
          /*
           * The old blocks were a second machine-written episode story.
           * The canonical recap now owns the prose and moment index.
           */
          blocks: [],
        };
      }
      source.showWiki = showWiki;
      if (source.showWiki.recap) {
        source.summary = {
          text: source.showWiki.recap.overview,
          basis: clean(source.showWiki.episodeRecap &&
            source.showWiki.episodeRecap.editorialState) ||
            (source.showWiki.episodeGuide ?
              "full-caption-episode-guide/v2" :
              "source-local-format-aware-recap/v1"),
        };
      }

      var entities = buildEntities(
        source,
        receipts,
        catalogItem,
        entityRegistry
      );
      var artifactCollections = policy.restrictedToTopicNavigation
        ? emptyArtifacts()
        : clone(artifactBySource.get(id) || emptyArtifacts());
      var artifacts = flattenArtifacts(artifactCollections);
      var warnings = warningsFor(source, archiveStream, receipts);
      var metrics = metricsFor(
        source,
        overlay,
        receipts,
        entities,
        artifactCollections
      );

      source.receipts = receipts;
      source.entities = entities;
      source.artifacts = artifacts;
      source.rightsPolicy = policy;
      source.warnings = warnings;
      source.metrics = metrics;
      return source;
    }).sort(function (left, right) {
      return right.date.localeCompare(left.date) || left.id.localeCompare(right.id);
    });

    enforceRestrictedArtifactFirewall(sources);
    assertCanonicalFormatCoverage(sources);

    var receiptTotal = sources.reduce(function (total, source) {
      return total + source.receipts.length;
    }, 0);
    if (receiptTotal < BASELINE_RECEIPTS_BEFORE_YEAR_CANON) {
      fail(
        "NORMALIZED_RECEIPT_COUNT_INVALID",
        "The normalized WWAM dossier fell below the pre-expansion receipt baseline of " +
          BASELINE_RECEIPTS_BEFORE_YEAR_CANON + "."
      );
    }

    var result = {
      schema: SCHEMA,
      channel: channelFrom(input, dna),
      snapshotDate: clean(
        input.snapshotDate ||
        atlasPayload && atlasPayload.snapshotDate ||
        deep.generated ||
        live.generated ||
        popular.generated
      ),
      sources: sources,
    };
    return clone(result);
  }

  root.WWAMSourceDossierAdapter = Object.freeze({
    VERSION: VERSION,
    build: build,
  });
})(typeof window !== "undefined" ? window : globalThis);
