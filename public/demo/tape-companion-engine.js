(function (root, factory) {
  "use strict";

  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.YouTubeWikiTapeCompanionEngine = api;
    root.WWAMTapeCompanionEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var VERSION = "1.1.0";
  var SCHEMA = "youtube-wiki-tape-companion/v1";
  var SHARE_SCHEMA = "youtube-wiki-tape-companion-share/v1";
  var DEFAULT_EXCERPT_WORD_LIMIT = 16;
  var DEFAULT_FUSION_WINDOW_SECONDS = 5;
  var DEFAULT_TICK_THRESHOLD_SECONDS = 6;
  var DEFAULT_ACTIVE_WINDOW_SECONDS = 18;
  var DEFAULT_LABELS = Object.freeze({
    ready: "COMPANION READY",
    limited: "SOURCE ONLY",
    receipt: "INDEXED RECEIPT",
    topic: "TOPIC SIGNAL",
    heat: "DERIVED HEAT WINDOW",
    character: "RECURRING CHARACTER SIGNAL",
    rankedCandidate: "MACHINE-RANKED CANDIDATE",
    editorialSelection: "HUMAN-CURATED EDITORIAL SELECTION",
    archiveConnection: "RECEIPT-BACKED ARCHIVE CONNECTION",
    archivePerformanceConnection: "PERFORMANCE-CANDIDATE ARCHIVE CONNECTION",
    archiveContextConnection: "CREATOR-CONTEXT ARCHIVE CONNECTION",
    archiveMixedConnection: "MIXED PERFORMANCE/CONTEXT ARCHIVE CONNECTION"
  });

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback == null ? 0 : fallback;
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

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, number(value, minimum)));
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
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

  function serialCopy(value) {
    return JSON.parse(JSON.stringify(value));
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

  function words(value) {
    return clean(value).split(/\s+/).filter(Boolean);
  }

  function boundedExcerpt(value, limit) {
    var tokens = words(value);
    var maximum = Math.max(1, Math.floor(number(limit, DEFAULT_EXCERPT_WORD_LIMIT)));
    var truncated = tokens.length > maximum;
    return {
      text: tokens.slice(0, maximum).join(" ") + (truncated ? " \u2026" : ""),
      wordCount: Math.min(tokens.length, maximum),
      sourceWordCount: tokens.length,
      wordLimit: maximum,
      truncated: truncated
    };
  }

  function officialSourceUrl(sourceId, seconds) {
    var id = clean(sourceId);
    var at = Math.max(0, Math.round(number(seconds)));
    if (!id) return "";
    return "https://www.youtube.com/watch?v=" + encodeURIComponent(id) +
      (at ? "&t=" + at + "s" : "");
  }

  function roundTime(value) {
    return Math.round(number(value) * 100) / 100;
  }

  function normalizeLabels(input) {
    var custom = input || {};
    return Object.keys(DEFAULT_LABELS).reduce(function (labels, key) {
      labels[key] = clean(custom[key] || DEFAULT_LABELS[key]);
      return labels;
    }, {});
  }

  function sourceIdOf(value) {
    return clean(value && (
      value.sourceId ||
      value.videoId ||
      value.youtubeId ||
      value.source && value.source.id
    ));
  }

  function sourceTimeOf(value, fallback) {
    if (!value) return fallback == null ? -1 : fallback;
    var candidate = value.t;
    if (candidate == null) candidate = value.at;
    if (candidate == null) candidate = value.time;
    if (candidate == null) candidate = value.peak;
    var parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : fallback == null ? -1 : fallback;
  }

  function sourceDurationOf(value) {
    return Math.max(0, number(value && (
      value.durationSeconds == null ? value.duration : value.durationSeconds
    )));
  }

  function normalizeSource(raw) {
    var source = raw || {};
    var id = clean(source.id || source.videoId || source.youtubeId);
    var lanes = unique(
      array(source.lanes).concat(source.lane || [], source.type || [])
        .map(clean)
    );
    return {
      id: id,
      title: clean(source.title || source.name || source.film || id),
      date: clean(source.date || source.publishedAt || source.uploadDate),
      type: clean(source.type || source.sourceType || lanes[0] || "source"),
      lane: clean(source.lane || lanes[0] || source.type || "source"),
      lanes: lanes,
      durationSeconds: sourceDurationOf(source),
      captioned: source.captioned !== false && source.transcript !== false,
      url: clean(source.url) || officialSourceUrl(id, 0)
    };
  }

  function normalizeSources(input) {
    var showcase = input.showcase || {};
    var candidates = array(input.sources).length
      ? array(input.sources)
      : array(showcase.sources);
    var byId = new Map();
    candidates.forEach(function (raw) {
      var source = normalizeSource(raw);
      if (!source.id) return;
      var existing = byId.get(source.id);
      if (!existing) {
        byId.set(source.id, source);
        return;
      }
      existing.title = existing.title || source.title;
      existing.date = existing.date || source.date;
      existing.durationSeconds = existing.durationSeconds || source.durationSeconds;
      existing.captioned = existing.captioned && source.captioned;
      existing.url = existing.url || source.url;
      existing.lanes = unique(existing.lanes.concat(source.lanes));
    });
    return stableSort(Array.from(byId.values()), function (left, right) {
      return (
        right.date.localeCompare(left.date) ||
        left.title.localeCompare(right.title) ||
        left.id.localeCompare(right.id)
      );
    });
  }

  function receiptKind(raw) {
    var type = normalized(raw && (raw.type || raw.kind));
    var category = normalized(raw && (raw.category || raw.label));
    if (type.indexOf("topic") >= 0 || category.indexOf("topic") === 0) {
      return "topic-signal";
    }
    if (type.indexOf("character") >= 0 || category.indexOf("character") >= 0) {
      return "character-signal";
    }
    return "receipt";
  }

  function evidenceLevel(raw) {
    return clean(
      raw && (
        raw.evidenceLevel ||
        raw.provenance && raw.provenance.basis ||
        raw.provenance && raw.provenance.timestampStatus
      )
    ) || "machine";
  }

  function normalizeReceipt(raw, sourceById, excerptLimit, labels, index) {
    var sourceId = sourceIdOf(raw);
    var source = sourceById.get(sourceId);
    var at = sourceTimeOf(raw, -1);
    if (!source || at < 0) return null;
    if (source.durationSeconds && at > source.durationSeconds) return null;
    var excerpt = boundedExcerpt(
      raw.excerpt || raw.quote || raw.receipt || "",
      excerptLimit
    );
    var kind = receiptKind(raw);
    var label = clean(raw.category || raw.label) ||
      (kind === "topic-signal" ? labels.topic :
        kind === "character-signal" ? labels.character : labels.receipt);
    var id = clean(raw.receiptId || raw.id) ||
      sourceId + ":" + kind + ":" + roundTime(at) + ":" + index;
    return {
      id: "event:" + fingerprint([sourceId, id, roundTime(at)].join("|")),
      sourceId: sourceId,
      at: roundTime(at),
      endAt: Math.max(roundTime(at), roundTime(number(raw.end, at))),
      kind: kind,
      label: label,
      labels: [label],
      excerpt: excerpt.text,
      excerptWordCount: excerpt.wordCount,
      excerptSourceWordCount: excerpt.sourceWordCount,
      excerptWordLimit: excerpt.wordLimit,
      excerptTruncated: excerpt.truncated,
      receiptIds: [id],
      timestamps: [roundTime(at)],
      entityIds: unique(array(raw.entityIds).map(clean)),
      url: officialSourceUrl(sourceId, at),
      exact: true,
      derived: kind === "topic-signal",
      evidence: {
        basis: kind === "topic-signal"
          ? "timestamped-receipt-with-derived-topic-label"
          : "timestamped-receipt",
        level: kind === "character-signal"
          ? "human-curated-candidate"
          : evidenceLevel(raw),
        speaker: null,
        speakerStatus: "not-diarized",
        trueOriginClaim: false,
        syntheticQuote: false
      },
      annotations: [],
      loreConnections: []
    };
  }

  function topicKey(sourceId, at, label) {
    return [sourceId, Math.round(number(at)), normalized(label).replace(/^topic /, "")].join("|");
  }

  function topicSignalsFromStreams(streams) {
    var output = [];
    array(streams).forEach(function (stream) {
      array(stream.topics || stream.chapters).forEach(function (topic, index) {
        output.push({
          id: clean(topic.id) || clean(stream.id) + ":topic:" + index,
          sourceId: clean(stream.id),
          t: sourceTimeOf(topic, -1),
          label: clean(topic.name || topic.label || topic.topic),
          excerpt: clean(topic.receipt || topic.excerpt || topic.quote),
          evidenceLevel: "machine",
          type: "topic-signal",
          entityIds: array(topic.entityIds)
        });
      });
    });
    return output;
  }

  function collectTopicSignals(input) {
    var explicit = array(input.topicSignals);
    var fromSources = array(input.sources).flatMap(function (source) {
      return topicSignalsFromStreams([source]);
    });
    var live = input.live || {};
    var popular = input.popular || {};
    var archive = input.archiveDeep || {};
    return explicit
      .concat(fromSources)
      .concat(topicSignalsFromStreams(live.streams || live.items))
      .concat(topicSignalsFromStreams(popular.streams || popular.items || popular.popular))
      .concat(topicSignalsFromStreams(archive.streams || archive.items));
  }

  function normalizeReceipts(input, sourceById, excerptLimit, labels) {
    var showcase = input.showcase || {};
    var rawReceipts = array(input.receipts).length
      ? array(input.receipts)
      : array(showcase.receipts);
    var receipts = rawReceipts.map(function (raw, index) {
      return normalizeReceipt(raw, sourceById, excerptLimit, labels, index);
    }).filter(Boolean);
    var knownTopics = new Set(
      receipts
        .filter(function (event) {
          return event.kind === "topic-signal";
        })
        .map(function (event) {
          return topicKey(event.sourceId, event.at, event.label);
        })
    );
    collectTopicSignals(input).forEach(function (topic, index) {
      var sourceId = sourceIdOf(topic);
      var at = sourceTimeOf(topic, -1);
      var label = clean(topic.label || topic.name || topic.topic);
      var key = topicKey(sourceId, at, label);
      if (!sourceById.has(sourceId) || at < 0 || !label || knownTopics.has(key)) return;
      var normalizedTopic = normalizeReceipt({
        id: clean(topic.id) || sourceId + ":derived-topic:" + index,
        sourceId: sourceId,
        t: at,
        type: "topic-signal",
        category: label,
        excerpt: topic.excerpt || topic.receipt || topic.quote,
        evidenceLevel: topic.evidenceLevel || "machine",
        entityIds: topic.entityIds
      }, sourceById, excerptLimit, labels, rawReceipts.length + index);
      if (normalizedTopic) {
        normalizedTopic.derived = true;
        normalizedTopic.evidence.basis = "timestamped-derived-topic-signal";
        receipts.push(normalizedTopic);
        knownTopics.add(key);
      }
    });
    return stableSort(receipts, function (left, right) {
      return left.sourceId.localeCompare(right.sourceId) ||
        left.at - right.at ||
        left.id.localeCompare(right.id);
    });
  }

  function explicitHeatWindows(input) {
    return array(input.heatWindows).map(function (window) {
      return Object.assign({}, window);
    });
  }

  function heatWindowsFromStreams(streams) {
    var windows = [];
    array(streams).forEach(function (stream) {
      array(stream.heatmap || stream.heatWindows).forEach(function (bin, index) {
        windows.push({
          id: clean(bin.id) || clean(stream.id) + ":heat:" + index,
          sourceId: clean(stream.id),
          from: number(bin.from, number(bin.start, 0)),
          to: number(bin.to, number(bin.end, 0)),
          heat: number(bin.heat, number(bin.score, 0)),
          signal: clean(bin.signal || bin.dominant || bin.label),
          topic: clean(bin.topic),
          basis: clean(bin.basis) || "derived-caption-heat-window",
          model: clean(bin.model) || "source-supplied-heatmap"
        });
      });
    });
    return windows;
  }

  function heatWindowsFromCommentaries(deep, sourceById) {
    var windows = [];
    array(deep && deep.tapes).forEach(function (tape) {
      var source = sourceById.get(clean(tape.id));
      var arc = array(tape.arc);
      if (!source || !source.durationSeconds || !arc.length) return;
      arc.forEach(function (chapter, index) {
        var from = source.durationSeconds * index / arc.length;
        var to = source.durationSeconds * (index + 1) / arc.length;
        windows.push({
          id: clean(tape.id) + ":octant:" + (index + 1),
          sourceId: clean(tape.id),
          from: from,
          to: to,
          heat: number(chapter.heat),
          signal: clean(chapter.dominant),
          topic: "",
          basis: "derived-equal-runtime-window",
          model: "commentary-runtime-octants"
        });
      });
    });
    return windows;
  }

  function collectHeatWindows(input, sourceById) {
    var live = input.live || {};
    var popular = input.popular || {};
    var archive = input.archiveDeep || {};
    return explicitHeatWindows(input)
      .concat(heatWindowsFromStreams(input.sources))
      .concat(heatWindowsFromStreams(live.streams || live.items))
      .concat(heatWindowsFromStreams(popular.streams || popular.items || popular.popular))
      .concat(heatWindowsFromStreams(archive.streams || archive.items))
      .concat(heatWindowsFromCommentaries(input.deep || {}, sourceById));
  }

  function normalizeHeatWindows(input, sourceById, labels) {
    var seen = new Set();
    var output = [];
    collectHeatWindows(input, sourceById).forEach(function (raw, index) {
      var sourceId = sourceIdOf(raw);
      var source = sourceById.get(sourceId);
      var from = Math.max(0, number(raw.from, number(raw.start, 0)));
      var to = Math.max(from, number(raw.to, number(raw.end, from)));
      if (!source || to <= from) return;
      if (source.durationSeconds) {
        from = Math.min(from, source.durationSeconds);
        to = Math.min(to, source.durationSeconds);
      }
      if (to <= from) return;
      var key = [sourceId, roundTime(from), roundTime(to)].join("|");
      if (seen.has(key)) return;
      seen.add(key);
      var signal = clean(raw.signal || raw.dominant || raw.label);
      var label = signal || labels.heat;
      output.push({
        id: "heat:" + fingerprint([key, clean(raw.id) || index].join("|")),
        sourceId: sourceId,
        at: roundTime(from),
        endAt: roundTime(to),
        kind: "heat-window",
        label: label,
        activeLabel: labels.heat,
        labels: [label],
        excerpt: "",
        excerptWordCount: 0,
        excerptSourceWordCount: 0,
        excerptWordLimit: 0,
        excerptTruncated: false,
        receiptIds: [],
        timestamps: [roundTime(from)],
        entityIds: [],
        url: officialSourceUrl(sourceId, from),
        exact: false,
        derived: true,
        heat: {
          score: clamp(number(raw.heat, number(raw.score, 0)), 0, 100),
          signal: signal || null,
          topic: clean(raw.topic) || null,
          model: clean(raw.model) || "derived-heat-window",
          basis: clean(raw.basis) || "derived-heat-window"
        },
        evidence: {
          basis: clean(raw.basis) || "derived-heat-window",
          level: "machine-derived",
          speaker: null,
          speakerStatus: "not-applicable",
          trueOriginClaim: false,
          syntheticQuote: false
        },
        annotations: [],
        loreConnections: []
      });
    });
    return stableSort(output, function (left, right) {
      return left.sourceId.localeCompare(right.sourceId) ||
        left.at - right.at ||
        left.endAt - right.endAt;
    });
  }

  function annotationKey(annotation) {
    return [
      clean(annotation.type),
      clean(annotation.characterId),
      clean(annotation.displayLabel),
      number(annotation.rank, -1),
      roundTime(annotation.at)
    ].join("|");
  }

  function rankedCandidates(input) {
    if (Array.isArray(input.rankedCandidates)) return input.rankedCandidates;
    if (input.rankedCandidates && Array.isArray(input.rankedCandidates.rankings)) {
      return input.rankedCandidates.rankings;
    }
    if (Array.isArray(input.redBand)) return input.redBand;
    if (input.redBand && Array.isArray(input.redBand.rankings)) return input.redBand.rankings;
    return [];
  }

  function editorialSelections(input) {
    if (Array.isArray(input.editorialSelections)) return input.editorialSelections;
    var curation = input.curation || input.curated || {};
    return array(curation.editorialSelections).length
      ? array(curation.editorialSelections)
      : array(curation.upInYa);
  }

  function characterProfiles(input) {
    var characters = input.characters || input.characterLore || {};
    if (Array.isArray(characters)) return characters;
    return array(characters.characters);
  }

  function decorationSourceId(raw, kind) {
    var direct = sourceIdOf(raw);
    if (direct) return direct;
    if (kind === "editorial-selection") return clean(raw && raw.id);
    return "";
  }

  function buildDecorationIndex(input, labels) {
    var bySource = new Map();

    function add(sourceId, at, annotation) {
      if (!sourceId || at < 0) return;
      if (!bySource.has(sourceId)) bySource.set(sourceId, []);
      bySource.get(sourceId).push(Object.assign({}, annotation, {
        at: roundTime(at)
      }));
    }

    rankedCandidates(input).forEach(function (candidate) {
      var sourceId = decorationSourceId(candidate, "ranked-candidate");
      var at = sourceTimeOf(candidate, -1);
      add(sourceId, at, {
        type: "ranked-candidate",
        label: labels.rankedCandidate,
        displayLabel: clean(candidate.label || candidate.category) || labels.rankedCandidate,
        rank: Math.max(0, Math.floor(number(candidate.rank))),
        score: number(candidate.score, number(candidate.totalScore, 0)),
        methodVersion: clean(candidate.methodVersion || candidate.version ||
          input.redBand && input.redBand.version),
        selectionStatus: "machine-ranked",
        semantics:
          "A transparent machine-ranked candidate, not an authenticated creator or editor verdict."
      });
    });

    editorialSelections(input).forEach(function (selection) {
      var sourceId = decorationSourceId(selection, "editorial-selection");
      var at = sourceTimeOf(selection, -1);
      add(sourceId, at, {
        type: "editorial-selection",
        label: labels.editorialSelection,
        displayLabel: clean(selection.label || selection.title) || labels.editorialSelection,
        selectionStatus: "human-curated",
        semantics:
          "Editorial collection membership is distinct from machine rank and does not identify a speaker."
      });
    });

    characterProfiles(input).forEach(function (profile) {
      array(profile.soundbytes || profile.receipts || profile.signals).forEach(function (signal) {
        var sourceId = decorationSourceId(signal, "character-signal");
        var at = sourceTimeOf(signal, -1);
        var mapping = profile.hostAttribution || profile.performerMapping || {};
        add(sourceId, at, {
          type: "recurring-character",
          label: labels.character,
          displayLabel: clean(profile.displayName || profile.name || profile.label) || labels.character,
          characterId: clean(profile.id || profile.characterId || slug(profile.name)),
          behaviorLabel: clean(signal.trigger || signal.label || signal.note),
          ownerMapping: {
            recurringPerformer: clean(profile.performedBy || profile.performer) || null,
            status: clean(mapping.status) || (
              profile.performedBy || profile.performer ? "owner-supplied" : "unknown"
            ),
            basis: clean(mapping.basis) || null,
            scope: "recurring-character-only"
          },
          clipSpeaker: null,
          clipSpeakerStatus: "not-diarized",
          selectionStatus: clean(signal.provenance && signal.provenance.selection) ||
            "curated-performance-candidate",
          semantics:
            "A recurring-character mapping does not attribute the voice in this individual clip."
        });
      });
    });

    bySource.forEach(function (values, sourceId) {
      bySource.set(sourceId, stableSort(values, function (left, right) {
        return left.at - right.at || annotationKey(left).localeCompare(annotationKey(right));
      }));
    });
    return bySource;
  }

  function decorateEvents(events, decorationBySource) {
    events.forEach(function (event) {
      var annotations = array(decorationBySource.get(event.sourceId)).filter(function (annotation) {
        return Math.abs(annotation.at - event.at) <= 1;
      });
      var seen = new Set();
      event.annotations = annotations.filter(function (annotation) {
        var key = annotationKey(annotation);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  }

  function loreModel(input) {
    var lore = input.lore || {};
    var receipts = array(lore.receipts);
    var receiptById = new Map(receipts.map(function (receipt) {
      return [clean(receipt.id), receipt];
    }));
    var entries = array(lore.fieldGuide || lore.entries);
    var entryById = new Map(entries.map(function (entry) {
      return [clean(entry.id), entry];
    }));
    var entriesByReceiptId = new Map();
    entries.forEach(function (entry) {
      array(entry.receiptIds).forEach(function (receiptId) {
        var id = clean(receiptId);
        if (!id) return;
        if (!entriesByReceiptId.has(id)) entriesByReceiptId.set(id, []);
        entriesByReceiptId.get(id).push(entry);
      });
    });
    var receiptsBySource = new Map();
    receipts.forEach(function (receipt) {
      var sourceId = sourceIdOf(receipt);
      if (!sourceId || sourceTimeOf(receipt, -1) < 0 || !clean(receipt.id)) return;
      if (!receiptsBySource.has(sourceId)) receiptsBySource.set(sourceId, []);
      receiptsBySource.get(sourceId).push(receipt);
    });
    receiptsBySource.forEach(function (values, sourceId) {
      receiptsBySource.set(sourceId, stableSort(values, function (left, right) {
        return sourceTimeOf(left, 0) - sourceTimeOf(right, 0) ||
          clean(left.id).localeCompare(clean(right.id));
      }));
    });
    return {
      lore: lore,
      receiptById: receiptById,
      receiptsBySource: receiptsBySource,
      entriesByReceiptId: entriesByReceiptId,
      entryById: entryById
    };
  }

  function receiptRole(entry, receiptId) {
    if (array(entry.performanceReceiptIds).indexOf(receiptId) >= 0) {
      return "performance-candidate";
    }
    if (array(entry.contextReceiptIds).indexOf(receiptId) >= 0) {
      return "creator-context";
    }
    return "archive-receipt";
  }

  function receiptIdsForRole(entry, receiptIds, role) {
    return unique(receiptIds).filter(function (receiptId) {
      return receiptRole(entry, receiptId) === role;
    });
  }

  function sourceCountForReceiptIds(receiptIds, model) {
    return new Set(unique(receiptIds).map(function (receiptId) {
      var receipt = model.receiptById.get(receiptId);
      return receipt && clean(receipt.sourceId);
    }).filter(Boolean)).size;
  }

  function earliestReceipt(receiptIds, model) {
    return stableSort(unique(receiptIds).map(function (receiptId) {
      return model.receiptById.get(receiptId);
    }).filter(Boolean), function (left, right) {
      return clean(left.date || "9999").localeCompare(clean(right.date || "9999")) ||
        sourceTimeOf(left, 0) - sourceTimeOf(right, 0) ||
        clean(left.sourceId).localeCompare(clean(right.sourceId)) ||
        clean(left.id).localeCompare(clean(right.id));
    })[0] || null;
  }

  function publicEarliest(receipt, role, label) {
    if (!receipt) return null;
    return {
      receiptId: clean(receipt.receiptId || receipt.id),
      sourceId: clean(receipt.sourceId),
      at: roundTime(sourceTimeOf(receipt, 0)),
      date: clean(receipt.date),
      role: role,
      label: label,
      trueOriginClaim: false
    };
  }

  function connectionRole(performanceReceiptIds, contextReceiptIds) {
    if (performanceReceiptIds.length && contextReceiptIds.length) {
      return "mixed-performance-and-context";
    }
    if (performanceReceiptIds.length) return "performance-candidate";
    if (contextReceiptIds.length) return "creator-context";
    return "archive-receipt";
  }

  function connectionLabel(role, labels) {
    var copy = labels || DEFAULT_LABELS;
    if (role === "performance-candidate") {
      return copy.archivePerformanceConnection;
    }
    if (role === "creator-context") return copy.archiveContextConnection;
    if (role === "mixed-performance-and-context") {
      return copy.archiveMixedConnection;
    }
    return copy.archiveConnection;
  }

  function connectionSemantics(role) {
    if (role === "performance-candidate") {
      return "This performance-candidate connection exists because the Lore entry lists the matched receipt ID. Character chronology uses timestamp-validated curated performance candidates only; it is not a true-origin claim.";
    }
    if (role === "creator-context") {
      return "This creator-context connection exists because the Lore entry lists the matched receipt ID. Creator context is not a performance candidate and cannot establish character-performance chronology or true origin.";
    }
    if (role === "mixed-performance-and-context") {
      return "This fused connection preserves matched performance-candidate and creator-context receipt IDs separately. Context does not become performance evidence; character chronology uses performance candidates only and makes no true-origin claim.";
    }
    return "This connection exists because the Lore entry lists the matched receipt ID; it is not a claim of deliberate callback or true origin.";
  }

  function loreConnection(entry, supportReceiptIds, model, labels) {
    var lineage = typeof model.lore.getLineage === "function"
      ? model.lore.getLineage(entry.id)
      : null;
    var allReceiptIds = unique(array(entry.receiptIds).map(clean));
    if (!supportReceiptIds.length || !allReceiptIds.length) return null;
    var performanceReceiptIds = receiptIdsForRole(
      entry,
      allReceiptIds,
      "performance-candidate"
    );
    var contextReceiptIds = receiptIdsForRole(
      entry,
      allReceiptIds,
      "creator-context"
    );
    var archiveReceiptIds = receiptIdsForRole(
      entry,
      allReceiptIds,
      "archive-receipt"
    );
    var supportPerformanceReceiptIds = receiptIdsForRole(
      entry,
      supportReceiptIds,
      "performance-candidate"
    );
    var supportContextReceiptIds = receiptIdsForRole(
      entry,
      supportReceiptIds,
      "creator-context"
    );
    var supportArchiveReceiptIds = receiptIdsForRole(
      entry,
      supportReceiptIds,
      "archive-receipt"
    );
    var relatedReceiptIds = allReceiptIds.filter(function (receiptId) {
      return supportReceiptIds.indexOf(receiptId) < 0;
    });
    var role = connectionRole(
      supportPerformanceReceiptIds,
      supportContextReceiptIds
    );
    var roleSeparated = /character/i.test(clean(entry.kind)) ||
      performanceReceiptIds.length > 0 ||
      contextReceiptIds.length > 0;
    var performanceFirst = earliestReceipt(performanceReceiptIds, model);
    var genericFirst = lineage && lineage.earliestIndexedReceipt
      ? lineage.earliestIndexedReceipt
      : entry.archiveFirst;
    var earliest = roleSeparated
      ? publicEarliest(
        performanceFirst,
        "performance-candidate",
        "EARLIEST INDEXED PERFORMANCE CANDIDATE"
      )
      : publicEarliest(
        genericFirst,
        "archive-receipt",
        "EARLIEST IN INDEXED ARCHIVE"
      );
    return {
      type: "receipt-backed-archive-connection",
      entryId: clean(entry.id),
      entryKind: clean(entry.kind || entry.type || "entity"),
      displayLabel: clean(entry.name || entry.label || entry.id),
      supportReceiptIds: unique(supportReceiptIds),
      supportPerformanceReceiptIds: supportPerformanceReceiptIds,
      supportContextReceiptIds: supportContextReceiptIds,
      supportArchiveReceiptIds: supportArchiveReceiptIds,
      relatedReceiptIds: relatedReceiptIds,
      relatedPerformanceReceiptIds: receiptIdsForRole(
        entry,
        relatedReceiptIds,
        "performance-candidate"
      ),
      relatedContextReceiptIds: receiptIdsForRole(
        entry,
        relatedReceiptIds,
        "creator-context"
      ),
      relatedArchiveReceiptIds: receiptIdsForRole(
        entry,
        relatedReceiptIds,
        "archive-receipt"
      ),
      connectionRole: role,
      connectionLabel: connectionLabel(role, labels),
      evidenceCount: allReceiptIds.length,
      sourceCount: sourceCountForReceiptIds(allReceiptIds, model),
      performanceEvidenceCount: performanceReceiptIds.length,
      performanceSourceCount: sourceCountForReceiptIds(
        performanceReceiptIds,
        model
      ),
      contextEvidenceCount: contextReceiptIds.length,
      contextSourceCount: sourceCountForReceiptIds(contextReceiptIds, model),
      archiveEvidenceCount: archiveReceiptIds.length,
      archiveSourceCount: sourceCountForReceiptIds(archiveReceiptIds, model),
      earliestIndexed: earliest,
      earliestIndexedPerformance: roleSeparated ? earliest : null,
      chronologyBasis: roleSeparated
        ? "timestamp-validated-curated-performance-candidates-only"
        : "indexed-receipts",
      trueOriginClaim: false,
      semantics: connectionSemantics(role)
    };
  }

  function decorateLore(events, model, labels) {
    events.forEach(function (event) {
      var matchingReceipts = array(model.receiptsBySource.get(event.sourceId)).filter(function (receipt) {
        return Math.abs(sourceTimeOf(receipt, -1000) - event.at) <= 1;
      });
      var supportByEntryId = new Map();
      matchingReceipts.forEach(function (receipt) {
        array(model.entriesByReceiptId.get(clean(receipt.id))).forEach(function (entry) {
          if (!supportByEntryId.has(entry.id)) supportByEntryId.set(entry.id, []);
          supportByEntryId.get(entry.id).push(clean(receipt.id));
        });
      });
      event.loreConnections = stableSort(
        Array.from(supportByEntryId.entries()).map(function (pair) {
          var entry = model.entryById.get(pair[0]);
          return entry
            ? loreConnection(entry, unique(pair[1]), model, labels)
            : null;
        }).filter(Boolean),
        function (left, right) {
          return right.evidenceCount - left.evidenceCount ||
            left.entryId.localeCompare(right.entryId);
        }
      );
    });
  }

  function significantTokens(value) {
    var stop = new Set([
      "a", "an", "and", "are", "as", "at", "be", "but", "for", "from", "he",
      "her", "him", "his", "i", "in", "is", "it", "of", "on", "or", "she",
      "that", "the", "their", "they", "this", "to", "was", "we", "were", "with",
      "you", "your"
    ]);
    return new Set(words(normalized(value)).filter(function (token) {
      return token.length > 2 && !stop.has(token);
    }));
  }

  function tokenOverlap(left, right) {
    var a = significantTokens(left);
    var b = significantTokens(right);
    if (!a.size || !b.size) return { count: 0, ratio: 0 };
    var count = 0;
    a.forEach(function (token) {
      if (b.has(token)) count += 1;
    });
    return { count: count, ratio: count / Math.min(a.size, b.size) };
  }

  function nonSourceEntities(event) {
    return array(event.entityIds).filter(function (entityId) {
      return normalized(entityId).indexOf("source ") !== 0;
    });
  }

  function annotationTypes(event) {
    return new Set(array(event.annotations).map(function (annotation) {
      return annotation.type;
    }));
  }

  function compatibleExactEvents(left, right, fusionWindow) {
    if (left.sourceId !== right.sourceId) return false;
    if (Math.abs(left.at - right.at) > fusionWindow) return false;
    if (Math.abs(left.at - right.at) <= 0.25) return true;
    if (normalized(left.label) === normalized(right.label)) return true;
    var leftEntities = new Set(nonSourceEntities(left));
    if (nonSourceEntities(right).some(function (entityId) {
      return leftEntities.has(entityId);
    })) return true;
    var overlap = tokenOverlap(left.excerpt, right.excerpt);
    if (overlap.count >= 2 && overlap.ratio >= 0.2) return true;
    var leftTypes = annotationTypes(left);
    var rightTypes = annotationTypes(right);
    if (left.kind === "character-signal" || right.kind === "character-signal" ||
      leftTypes.has("recurring-character") || rightTypes.has("recurring-character")) {
      return true;
    }
    if (left.kind === "topic-signal" && right.kind === "topic-signal") {
      return normalized(left.label) === normalized(right.label);
    }
    return false;
  }

  function eventPriority(event) {
    var types = annotationTypes(event);
    if (types.has("editorial-selection")) return 100;
    if (types.has("recurring-character") || event.kind === "character-signal") return 90;
    if (types.has("ranked-candidate")) return 80;
    if (event.kind === "receipt") return 60;
    if (event.kind === "topic-signal") return 40;
    return 20;
  }

  function dedupeObjects(values, keyFunction) {
    var seen = new Set();
    return array(values).filter(function (value) {
      var key = keyFunction(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function memberFromEvent(event) {
    return {
      id: event.id,
      kind: event.kind,
      at: event.at,
      endAt: event.endAt,
      label: event.label,
      excerpt: event.excerpt,
      excerptWordCount: event.excerptWordCount,
      excerptSourceWordCount: event.excerptSourceWordCount,
      excerptWordLimit: event.excerptWordLimit,
      excerptTruncated: event.excerptTruncated,
      receiptIds: event.receiptIds.slice(),
      entityIds: event.entityIds.slice(),
      url: event.url,
      exact: true,
      derived: event.derived,
      evidence: serialCopy(event.evidence),
      annotations: serialCopy(event.annotations),
      loreConnections: serialCopy(event.loreConnections)
    };
  }

  function eventFromGroup(group, labels) {
    var ordered = stableSort(group, function (left, right) {
      return left.at - right.at || left.id.localeCompare(right.id);
    });
    var primary = stableSort(ordered, function (left, right) {
      return eventPriority(right) - eventPriority(left) ||
        left.at - right.at ||
        left.id.localeCompare(right.id);
    })[0];
    var members = ordered.map(memberFromEvent);
    var annotations = dedupeObjects(
      ordered.flatMap(function (event) {
        return event.annotations;
      }),
      annotationKey
    );
    var loreByEntryId = new Map();
    ordered.flatMap(function (event) {
      return event.loreConnections;
    }).forEach(function (connection) {
      var existing = loreByEntryId.get(connection.entryId);
      if (!existing) {
        loreByEntryId.set(connection.entryId, serialCopy(connection));
        return;
      }
      existing.supportReceiptIds = unique(
        existing.supportReceiptIds.concat(connection.supportReceiptIds)
      );
      existing.supportPerformanceReceiptIds = unique(
        existing.supportPerformanceReceiptIds.concat(
          connection.supportPerformanceReceiptIds
        )
      );
      existing.supportContextReceiptIds = unique(
        existing.supportContextReceiptIds.concat(
          connection.supportContextReceiptIds
        )
      );
      existing.supportArchiveReceiptIds = unique(
        existing.supportArchiveReceiptIds.concat(
          connection.supportArchiveReceiptIds
        )
      );
      existing.relatedReceiptIds = unique(
        existing.relatedReceiptIds.concat(connection.relatedReceiptIds)
      ).filter(function (receiptId) {
        return existing.supportReceiptIds.indexOf(receiptId) < 0;
      });
      existing.relatedPerformanceReceiptIds = unique(
        existing.relatedPerformanceReceiptIds.concat(
          connection.relatedPerformanceReceiptIds
        )
      ).filter(function (receiptId) {
        return existing.supportPerformanceReceiptIds.indexOf(receiptId) < 0;
      });
      existing.relatedContextReceiptIds = unique(
        existing.relatedContextReceiptIds.concat(
          connection.relatedContextReceiptIds
        )
      ).filter(function (receiptId) {
        return existing.supportContextReceiptIds.indexOf(receiptId) < 0;
      });
      existing.relatedArchiveReceiptIds = unique(
        existing.relatedArchiveReceiptIds.concat(
          connection.relatedArchiveReceiptIds
        )
      ).filter(function (receiptId) {
        return existing.supportArchiveReceiptIds.indexOf(receiptId) < 0;
      });
      existing.connectionRole = connectionRole(
        existing.supportPerformanceReceiptIds,
        existing.supportContextReceiptIds
      );
      existing.connectionLabel = connectionLabel(
        existing.connectionRole,
        labels
      );
      existing.semantics = connectionSemantics(existing.connectionRole);
      existing.evidenceCount = Math.max(
        existing.evidenceCount,
        connection.evidenceCount
      );
      existing.sourceCount = Math.max(existing.sourceCount, connection.sourceCount);
      existing.performanceEvidenceCount = Math.max(
        existing.performanceEvidenceCount,
        connection.performanceEvidenceCount
      );
      existing.performanceSourceCount = Math.max(
        existing.performanceSourceCount,
        connection.performanceSourceCount
      );
      existing.contextEvidenceCount = Math.max(
        existing.contextEvidenceCount,
        connection.contextEvidenceCount
      );
      existing.contextSourceCount = Math.max(
        existing.contextSourceCount,
        connection.contextSourceCount
      );
      existing.archiveEvidenceCount = Math.max(
        existing.archiveEvidenceCount,
        connection.archiveEvidenceCount
      );
      existing.archiveSourceCount = Math.max(
        existing.archiveSourceCount,
        connection.archiveSourceCount
      );
    });
    var loreConnections = stableSort(
      Array.from(loreByEntryId.values()),
      function (left, right) {
        return right.evidenceCount - left.evidenceCount ||
          left.entryId.localeCompare(right.entryId);
      }
    );
    var receiptIds = unique(
      ordered.flatMap(function (event) {
        return event.receiptIds;
      })
    );
    var timestamps = unique(
      ordered.map(function (event) {
        return roundTime(event.at);
      })
    ).sort(function (left, right) {
      return left - right;
    });
    return {
      id: "incident:" + fingerprint(
        ordered.map(function (event) {
          return event.id + "@" + event.at;
        }).join("|")
      ),
      sourceId: primary.sourceId,
      at: Math.min.apply(null, ordered.map(function (event) {
        return event.at;
      })),
      endAt: Math.max.apply(null, ordered.map(function (event) {
        return event.endAt;
      })),
      kind: ordered.length > 1 ? "incident" : primary.kind,
      label: primary.label,
      labels: unique(ordered.map(function (event) {
        return event.label;
      })),
      excerpt: primary.excerpt,
      excerptWordCount: primary.excerptWordCount,
      excerptSourceWordCount: primary.excerptSourceWordCount,
      excerptWordLimit: primary.excerptWordLimit,
      excerptTruncated: primary.excerptTruncated,
      receiptIds: receiptIds,
      timestamps: timestamps,
      entityIds: unique(ordered.flatMap(function (event) {
        return event.entityIds;
      })),
      url: officialSourceUrl(primary.sourceId, primary.at),
      exact: true,
      derived: ordered.every(function (event) {
        return event.derived;
      }),
      fused: ordered.length > 1,
      members: members,
      evidence: {
        basis: ordered.length > 1
          ? "fused-compatible-timestamped-receipts"
          : primary.evidence.basis,
        level: primary.evidence.level,
        speaker: null,
        speakerStatus: "not-diarized",
        trueOriginClaim: false,
        syntheticQuote: false
      },
      annotations: annotations,
      loreConnections: loreConnections
    };
  }

  function fuseExactEvents(events, fusionWindow, labels) {
    var bySource = new Map();
    array(events).forEach(function (event) {
      if (!bySource.has(event.sourceId)) bySource.set(event.sourceId, []);
      bySource.get(event.sourceId).push(event);
    });
    var fused = [];
    bySource.forEach(function (sourceEvents) {
      var ordered = stableSort(sourceEvents, function (left, right) {
        return left.at - right.at || left.id.localeCompare(right.id);
      });
      var group = [];
      ordered.forEach(function (event) {
        var canJoin = group.length &&
          event.at - group[0].at <= fusionWindow &&
          group.some(function (candidate) {
            return compatibleExactEvents(candidate, event, fusionWindow);
          });
        if (!canJoin && group.length) {
          fused.push(eventFromGroup(group, labels));
          group = [];
        }
        group.push(event);
      });
      if (group.length) fused.push(eventFromGroup(group, labels));
    });
    return stableSort(fused, function (left, right) {
      return left.sourceId.localeCompare(right.sourceId) ||
        left.at - right.at ||
        left.id.localeCompare(right.id);
    });
  }

  function loreConnectionMetrics(events) {
    var connections = array(events).flatMap(function (event) {
      return array(event.loreConnections);
    });
    function roleCount(role) {
      return connections.filter(function (connection) {
        return connection.connectionRole === role;
      }).length;
    }
    function receiptLinkCount(key) {
      return connections.reduce(function (sum, connection) {
        return sum + array(connection[key]).length;
      }, 0);
    }
    return {
      loreConnections: connections.length,
      lorePerformanceConnections: roleCount("performance-candidate"),
      loreContextConnections: roleCount("creator-context"),
      loreMixedConnections: roleCount("mixed-performance-and-context"),
      loreArchiveConnections: roleCount("archive-receipt"),
      lorePerformanceReceiptLinks: receiptLinkCount(
        "supportPerformanceReceiptIds"
      ),
      loreContextReceiptLinks: receiptLinkCount("supportContextReceiptIds"),
      loreArchiveReceiptLinks: receiptLinkCount("supportArchiveReceiptIds")
    };
  }

  function sourceFingerprint(source, exactEvents, heatWindows) {
    return "source-v1-" + fingerprint(stableJson({
      source: {
        id: source.id,
        date: source.date,
        durationSeconds: source.durationSeconds,
        captioned: source.captioned
      },
      exact: exactEvents.map(function (event) {
        return {
          id: event.id,
          at: event.at,
          receiptIds: event.receiptIds
        };
      }),
      heat: heatWindows.map(function (event) {
        return {
          at: event.at,
          endAt: event.endAt,
          score: event.heat.score,
          basis: event.heat.basis
        };
      })
    }));
  }

  function publicSource(source, fingerprintValue, readiness, counts) {
    return {
      id: source.id,
      title: source.title,
      date: source.date,
      type: source.type,
      lane: source.lane,
      lanes: source.lanes.slice(),
      durationSeconds: source.durationSeconds,
      captioned: source.captioned,
      url: source.url,
      fingerprint: fingerprintValue,
      readiness: serialCopy(readiness),
      counts: serialCopy(counts),
      playbackPolicy: {
        provider: "youtube",
        officialSourceOnly: true,
        copiedMedia: false,
        audioExtraction: false,
        autoplay: false
      }
    };
  }

  function readinessFor(source, exactEvents, heatWindows, labels) {
    var reasons = [];
    if (!source.captioned) reasons.push("caption-evidence-unavailable");
    if (!exactEvents.length) reasons.push("no-timestamped-receipts");
    if (!heatWindows.length) reasons.push("no-derived-heat-windows");
    var ready = reasons.length === 0;
    return {
      status: ready ? "companion-ready" : "limited",
      label: ready ? labels.ready : labels.limited,
      mode: ready ? "source-synced-companion" : "source-only",
      allowsTimedClaims: ready,
      reasons: reasons,
      limitation: ready ? null :
        "This source remains source-only because the current snapshot cannot support a synchronized evidence timeline."
    };
  }

  function archiveFingerprintFor(input, options, sources, exactEvents, heatWindows) {
    var showcase = input.showcase || {};
    var supplied = clean(
      options.archiveFingerprint ||
      input.archiveFingerprint ||
      showcase.inputFingerprint
    );
    if (supplied) return supplied;
    return "archive-v1-" + fingerprint(stableJson({
      sources: sources.map(function (source) {
        return [source.id, source.date, source.durationSeconds, source.captioned];
      }),
      exact: exactEvents.map(function (event) {
        return [event.id, event.sourceId, event.at, event.receiptIds];
      }),
      heat: heatWindows.map(function (event) {
        return [event.sourceId, event.at, event.endAt, event.heat.score];
      })
    }));
  }

  function markerRecords(timeline) {
    var records = [];
    timeline.events.forEach(function (event) {
      if (event.kind === "heat-window") return;
      array(event.members).forEach(function (member) {
        records.push({
          eventId: event.id,
          memberId: member.id,
          at: member.at,
          kind: member.kind
        });
      });
    });
    return stableSort(records, function (left, right) {
      return left.at - right.at ||
        left.eventId.localeCompare(right.eventId) ||
        left.memberId.localeCompare(right.memberId);
    });
  }

  function visibleEventAt(event, seconds) {
    if (event.kind === "heat-window") return null;
    var visibleMembers = array(event.members).filter(function (member) {
      return member.at <= seconds;
    });
    if (!visibleMembers.length) return null;
    var visible = eventFromGroup(visibleMembers.map(function (member) {
      return {
        id: member.id,
        sourceId: event.sourceId,
        at: member.at,
        endAt: member.endAt,
        kind: member.kind,
        label: member.label,
        excerpt: member.excerpt,
        excerptWordCount: member.excerptWordCount,
        excerptSourceWordCount: member.excerptSourceWordCount,
        excerptWordLimit: member.excerptWordLimit,
        excerptTruncated: member.excerptTruncated,
        receiptIds: member.receiptIds,
        entityIds: member.entityIds,
        url: member.url,
        exact: member.exact,
        derived: member.derived,
        evidence: member.evidence,
        annotations: member.annotations.filter(function (annotation) {
          return annotation.at <= seconds;
        }),
        loreConnections: member.loreConnections
      };
    }));
    visible.id = event.id;
    visible.latestRevealedMemberId =
      visible.members[visible.members.length - 1].id;
    visible.partiallyRevealed = visibleMembers.length < event.members.length;
    visible.hiddenMemberCount = event.members.length - visibleMembers.length;
    return visible;
  }

  function safeNextMarker(timeline, seconds) {
    var marker = timeline._markers.find(function (candidate) {
      return candidate.at > seconds;
    });
    if (!marker) return null;
    return {
      eventId: marker.eventId,
      at: marker.at,
      secondsUntil: roundTime(marker.at - seconds),
      reveal: "hidden-until-crossed"
    };
  }

  function snapshotFor(timeline, requestedSeconds, activeWindow) {
    var duration = timeline.source.durationSeconds;
    var seconds = Math.max(0, number(requestedSeconds));
    if (duration) seconds = Math.min(seconds, duration);
    seconds = roundTime(seconds);
    var heat = timeline.events.find(function (event) {
      return event.kind === "heat-window" &&
        event.at <= seconds &&
        event.endAt > seconds;
    }) || null;
    var visibleHeat = heat ? serialCopy(heat) : null;
    if (visibleHeat) {
      visibleHeat.label = visibleHeat.activeLabel || "HEAT WINDOW";
      visibleHeat.labels = [visibleHeat.label];
      visibleHeat.textStatus = "sealed-until-window-complete";
      if (visibleHeat.heat) {
        visibleHeat.heat.signal = null;
        visibleHeat.heat.topic = null;
      }
    }
    var exactEvents = timeline.events.filter(function (event) {
      return event.kind !== "heat-window" && event.at <= seconds;
    });
    var active = exactEvents.filter(function (event) {
      return seconds - event.at <= activeWindow;
    }).map(function (event) {
      return visibleEventAt(event, seconds);
    }).filter(Boolean);
    var history = exactEvents.filter(function (event) {
      return seconds - event.at > activeWindow;
    }).map(function (event) {
      return visibleEventAt(event, seconds);
    }).filter(Boolean);
    var futureMarkers = timeline._markers.filter(function (marker) {
      return marker.at > seconds;
    });
    return {
      channelId: timeline.channelId,
      archiveFingerprint: timeline.archiveFingerprint,
      source: serialCopy(timeline.source),
      readiness: serialCopy(timeline.readiness),
      requestedSeconds: roundTime(number(requestedSeconds)),
      seconds: seconds,
      currentHeat: visibleHeat,
      activeEvents: serialCopy(active),
      history: serialCopy(history),
      future: {
        markerCount: futureMarkers.length,
        next: safeNextMarker(timeline, seconds),
        textIncluded: false
      },
      evidenceBoundary: serialCopy(timeline.evidenceBoundary)
    };
  }

  function encodeSharePayload(payload) {
    return encodeURIComponent(stableJson(payload)).replace(/\./g, "%2E");
  }

  function decodeSharePayload(value) {
    return JSON.parse(decodeURIComponent(value));
  }

  function failure(code, message) {
    return {
      ok: false,
      code: code,
      message: message
    };
  }

  function create(inputs, options) {
    var input = inputs || {};
    var settings = options || {};
    var labels = normalizeLabels(settings.labels || input.labels);
    var excerptLimit = Math.max(
      1,
      Math.floor(number(
        settings.excerptWordLimit,
        DEFAULT_EXCERPT_WORD_LIMIT
      ))
    );
    var fusionWindow = clamp(
      number(settings.fusionWindowSeconds, DEFAULT_FUSION_WINDOW_SECONDS),
      0,
      DEFAULT_FUSION_WINDOW_SECONDS
    );
    var tickThreshold = Math.max(
      0.25,
      number(settings.tickThresholdSeconds, DEFAULT_TICK_THRESHOLD_SECONDS)
    );
    var activeWindow = Math.max(
      1,
      number(settings.activeWindowSeconds, DEFAULT_ACTIVE_WINDOW_SECONDS)
    );
    var showcase = input.showcase || {};
    var channelId = clean(
      settings.channelId ||
      input.channelId ||
      showcase.channelId ||
      "channel"
    );
    var snapshotDate = clean(
      settings.snapshotDate ||
      input.snapshotDate ||
      showcase.snapshotDate ||
      input.deep && input.deep.generated ||
      "undated"
    );
    var sources = normalizeSources(input);
    var sourceById = new Map(sources.map(function (source) {
      return [source.id, source];
    }));
    var exactEvents = normalizeReceipts(input, sourceById, excerptLimit, labels);
    var heatWindows = normalizeHeatWindows(input, sourceById, labels);
    var decorations = buildDecorationIndex(input, labels);
    decorateEvents(exactEvents, decorations);
    decorateLore(exactEvents, loreModel(input), labels);
    var fusedEvents = fuseExactEvents(exactEvents, fusionWindow, labels);
    var archiveFingerprint = archiveFingerprintFor(
      input,
      settings,
      sources,
      exactEvents,
      heatWindows
    );
    var channelFingerprint = "channel-v1-" + fingerprint(
      [channelId, snapshotDate, archiveFingerprint].join("|")
    );
    var timelines = new Map();

    sources.forEach(function (source) {
      var sourceCoreExact = exactEvents.filter(function (event) {
        return event.sourceId === source.id;
      });
      var sourceExact = fusedEvents.filter(function (event) {
        return event.sourceId === source.id;
      });
      var sourceHeat = heatWindows.filter(function (event) {
        return event.sourceId === source.id;
      });
      var readiness = readinessFor(source, sourceExact, sourceHeat, labels);
      var counts = Object.assign({
        events: sourceExact.length + sourceHeat.length,
        exactIncidents: sourceExact.length,
        exactReceiptMembers: sourceExact.reduce(function (sum, event) {
          return sum + event.members.length;
        }, 0),
        heatWindows: sourceHeat.length,
        topicSignals: sourceExact.reduce(function (sum, event) {
          return sum + event.members.filter(function (member) {
            return member.kind === "topic-signal";
          }).length;
        }, 0),
        fusedIncidents: sourceExact.filter(function (event) {
          return event.fused;
        }).length,
        rankedCandidateAnnotations: sourceExact.reduce(function (sum, event) {
          return sum + event.annotations.filter(function (annotation) {
            return annotation.type === "ranked-candidate";
          }).length;
        }, 0),
        editorialSelectionAnnotations: sourceExact.reduce(function (sum, event) {
          return sum + event.annotations.filter(function (annotation) {
            return annotation.type === "editorial-selection";
          }).length;
        }, 0),
        recurringCharacterAnnotations: sourceExact.reduce(function (sum, event) {
          return sum + event.annotations.filter(function (annotation) {
            return annotation.type === "recurring-character";
          }).length;
        }, 0)
      }, loreConnectionMetrics(sourceExact));
      var fingerprintValue = sourceFingerprint(source, sourceCoreExact, sourceHeat);
      var publicSourceValue = publicSource(
        source,
        fingerprintValue,
        readiness,
        counts
      );
      var events = stableSort(sourceHeat.concat(sourceExact), function (left, right) {
        return left.at - right.at ||
          (left.kind === "heat-window" ? -1 : 1) ||
          left.id.localeCompare(right.id);
      });
      var timeline = {
        engine: "YOUTUBE WIKI TAPE COMPANION",
        version: VERSION,
        schema: SCHEMA,
        channelId: channelId,
        channelFingerprint: channelFingerprint,
        snapshotDate: snapshotDate,
        archiveFingerprint: archiveFingerprint,
        source: publicSourceValue,
        readiness: readiness,
        counts: counts,
        events: events,
        evidenceBoundary: {
          publicExcerptWordLimit: excerptLimit,
          speakerAttribution: "not-diarized",
          recurringCharacterMappingScope: "recurring-character-only",
          rankedCandidateSemantics: "machine-ranked-not-creator-verdict",
          editorialSelectionSemantics: "human-curated-membership-not-rank",
          loreConnectionRequirement: "matched-lore-receipt-id",
          loreReceiptRoleSemantics:
            "performance-candidate-creator-context-and-general-receipts-kept-distinct",
          characterChronologyBasis:
            "timestamp-validated-curated-performance-candidates-only",
          trueOriginClaims: false,
          syntheticQuotes: false,
          copiedMedia: false,
          audioExtraction: false,
          autoplay: false
        }
      };
      timeline._markers = markerRecords(timeline);
      timelines.set(source.id, timeline);
    });

    var sourceSummaries = sources.map(function (source) {
      return timelines.get(source.id).source;
    });
    var readyCount = sourceSummaries.filter(function (source) {
      return source.readiness.status === "companion-ready";
    }).length;
    var metrics = Object.assign({
      sources: sourceSummaries.length,
      companionReady: readyCount,
      limited: sourceSummaries.length - readyCount,
      exactReceiptMembers: exactEvents.length,
      exactIncidents: fusedEvents.length,
      fusedIncidents: fusedEvents.filter(function (event) {
        return event.fused;
      }).length,
      heatWindows: heatWindows.length,
      rankedCandidateAnnotations: fusedEvents.reduce(function (sum, event) {
        return sum + event.annotations.filter(function (annotation) {
          return annotation.type === "ranked-candidate";
        }).length;
      }, 0),
      editorialSelectionAnnotations: fusedEvents.reduce(function (sum, event) {
        return sum + event.annotations.filter(function (annotation) {
          return annotation.type === "editorial-selection";
        }).length;
      }, 0),
      recurringCharacterAnnotations: fusedEvents.reduce(function (sum, event) {
        return sum + event.annotations.filter(function (annotation) {
          return annotation.type === "recurring-character";
        }).length;
      }, 0)
    }, loreConnectionMetrics(fusedEvents), {
      archiveFingerprint: archiveFingerprint,
      channelFingerprint: channelFingerprint,
      snapshotDate: snapshotDate
    });

    function listSources(filters) {
      var request = filters || {};
      var query = normalized(request.query);
      var lane = normalized(request.lane);
      var status = normalized(request.status);
      var output = sourceSummaries.filter(function (source) {
        if (query && normalized([
          source.title,
          source.date,
          source.type,
          source.lane,
          source.lanes.join(" ")
        ].join(" ")).indexOf(query) < 0) return false;
        if (lane && !source.lanes.some(function (candidate) {
          return normalized(candidate) === lane;
        }) && normalized(source.lane) !== lane) return false;
        if (status && normalized(source.readiness.status) !== status) return false;
        return true;
      });
      var limit = request.limit == null
        ? output.length
        : Math.max(0, Math.floor(number(request.limit)));
      return serialCopy(output.slice(0, limit));
    }

    function compileTimeline(sourceId) {
      var timeline = timelines.get(clean(sourceId));
      if (!timeline) return null;
      var copy = serialCopy(timeline);
      delete copy._markers;
      return copy;
    }

    function snapshotAt(sourceId, seconds) {
      var timeline = timelines.get(clean(sourceId));
      if (!timeline) return null;
      return snapshotFor(timeline, seconds, activeWindow);
    }

    function getNextMarker(sourceId, seconds) {
      var timeline = timelines.get(clean(sourceId));
      if (!timeline) return null;
      var duration = timeline.source.durationSeconds;
      var at = Math.max(0, number(seconds));
      if (duration) at = Math.min(at, duration);
      return safeNextMarker(timeline, roundTime(at));
    }

    function crossedEvents(sourceId, previous, current) {
      var timeline = timelines.get(clean(sourceId));
      if (!timeline) {
        return {
          mode: "unknown-source",
          events: [],
          snapshot: null
        };
      }
      var from = Math.max(0, number(previous));
      var to = Math.max(0, number(current));
      var delta = to - from;
      if (delta <= 0 || delta > tickThreshold) {
        return {
          mode: "snapshot",
          reason: delta <= 0 ? "reverse-or-stationary" : "seek-detected",
          events: [],
          snapshot: snapshotFor(timeline, to, activeWindow)
        };
      }
      var crossed = timeline._markers.filter(function (marker) {
        return marker.at > from && marker.at <= to;
      });
      var eventIds = unique(crossed.map(function (marker) {
        return marker.eventId;
      }));
      var events = eventIds.map(function (eventId) {
        var event = timeline.events.find(function (candidate) {
          return candidate.id === eventId;
        });
        return event ? visibleEventAt(event, to) : null;
      }).filter(Boolean);
      return {
        mode: "crossings",
        reason: "forward-playback-tick",
        events: serialCopy(events),
        snapshot: snapshotFor(timeline, to, activeWindow)
      };
    }

    function serializeShareState(sourceId, seconds) {
      var timeline = timelines.get(clean(sourceId));
      if (!timeline) return null;
      var at = Math.max(0, number(seconds));
      if (timeline.source.durationSeconds) {
        at = Math.min(at, timeline.source.durationSeconds);
      }
      var payload = {
        schema: SHARE_SCHEMA,
        channelId: channelId,
        channelFingerprint: channelFingerprint,
        archiveFingerprint: archiveFingerprint,
        sourceId: timeline.source.id,
        sourceFingerprint: timeline.source.fingerprint,
        seconds: roundTime(at)
      };
      var encoded = encodeSharePayload(payload);
      return "tc1." + encoded + "." + fingerprint(encoded);
    }

    function restoreShareState(token) {
      var value = clean(token);
      var match = value.match(/^tc1\.([^.]+)\.([0-9a-f]{8})$/);
      if (!match) return failure("malformed-share", "The companion share state is malformed.");
      if (fingerprint(match[1]) !== match[2]) {
        return failure("tampered-share", "The companion share state failed its integrity check.");
      }
      var payload;
      try {
        payload = decodeSharePayload(match[1]);
      } catch {
        return failure("malformed-share", "The companion share payload cannot be decoded.");
      }
      if (payload.schema !== SHARE_SCHEMA) {
        return failure("foreign-schema", "The companion share schema is not supported.");
      }
      if (clean(payload.channelId) !== channelId) {
        return failure("foreign-channel", "The companion share belongs to another channel.");
      }
      if (clean(payload.archiveFingerprint) !== archiveFingerprint) {
        return failure("stale-archive", "The companion share belongs to another archive snapshot.");
      }
      if (clean(payload.channelFingerprint) !== channelFingerprint) {
        return failure("stale-archive", "The companion share belongs to another archive snapshot.");
      }
      var timeline = timelines.get(clean(payload.sourceId));
      if (!timeline) {
        return failure("unknown-source", "The shared source is not present in this archive.");
      }
      if (clean(payload.sourceFingerprint) !== timeline.source.fingerprint) {
        return failure("stale-source", "The shared source changed after this state was created.");
      }
      var seconds = Number(payload.seconds);
      if (!Number.isFinite(seconds) || seconds < 0 ||
        timeline.source.durationSeconds && seconds > timeline.source.durationSeconds) {
        return failure("out-of-range", "The shared playback second is outside the source boundary.");
      }
      return {
        ok: true,
        sourceId: timeline.source.id,
        seconds: roundTime(seconds),
        channelId: channelId,
        archiveFingerprint: archiveFingerprint,
        sourceFingerprint: timeline.source.fingerprint,
        snapshot: snapshotFor(timeline, seconds, activeWindow)
      };
    }

    return Object.freeze({
      engine: "YOUTUBE WIKI TAPE COMPANION",
      version: VERSION,
      schema: SCHEMA,
      shareSchema: SHARE_SCHEMA,
      channelId: channelId,
      snapshotDate: snapshotDate,
      archiveFingerprint: archiveFingerprint,
      metrics: serialCopy(metrics),
      labels: serialCopy(labels),
      evidencePolicy: {
        publicExcerptWordLimit: excerptLimit,
        speakerAttribution: "not-diarized",
        ownerMappingScope: "recurring-character-only",
        futureTextInSnapshots: false,
        sourcePlaybackOnly: true,
        copiedMedia: false,
        audioExtraction: false,
        autoplay: false
      },
      listSources: listSources,
      compileTimeline: compileTimeline,
      snapshotAt: snapshotAt,
      crossedEvents: crossedEvents,
      getNextMarker: getNextMarker,
      serializeShareState: serializeShareState,
      restoreShareState: restoreShareState
    });
  }

  return Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    SHARE_SCHEMA: SHARE_SCHEMA,
    DEFAULT_EXCERPT_WORD_LIMIT: DEFAULT_EXCERPT_WORD_LIMIT,
    DEFAULT_FUSION_WINDOW_SECONDS: DEFAULT_FUSION_WINDOW_SECONDS,
    DEFAULT_TICK_THRESHOLD_SECONDS: DEFAULT_TICK_THRESHOLD_SECONDS,
    DEFAULT_LABELS: DEFAULT_LABELS,
    create: create
  });
});
