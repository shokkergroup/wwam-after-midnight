(function (root) {
  "use strict";

  /*
   * THE SOURCE DOSSIER
   *
   * A channel-neutral, read-only projection of one upload into source proof,
   * local receipts, typed archive connections, and draft editorial actions.
   * The engine does not retrieve media, infer speakers, summarize missing
   * captions, promote evidence, clear rights, or publish anything.
   */

  var VERSION = "1.15.0";
  var INPUT_SCHEMA = "shokker-source-dossier-input/v1";
  var DOSSIER_SCHEMA = "shokker-source-dossier/v1";
  var EXPORT_SCHEMA = "shokker-source-dossier-export/v1";
  var SOURCE_ID = /^[A-Za-z0-9_-]{11}$/;
  var ENTITY_ID = /^[a-z0-9][a-z0-9:_-]{1,159}$/;
  var KEBAB_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var DATE = /^\d{4}-\d{2}-\d{2}$/;
  var COVERAGE = Object.freeze({
    "caption-backed": true,
    "caption-limited": true,
    "metadata-only": true,
    unavailable: true
  });
  var AUTHORITY = Object.freeze({
    "promoted-lane": true,
    "quarantined-lane": true,
    "source-only": true
  });
  var ENTITY_BASIS = Object.freeze({
    "timestamped-receipt": true,
    "catalog-declared-entity": true,
    "cached-title-alias": true
  });
  var ACTION_AUTHORITY = Object.freeze({
    "fan-navigation": true,
    "creator-draft": true,
    "editor-review": true
  });
  var CONTENT_RECEIPT_TYPES = Object.freeze({
    "caption-excerpt": true,
    "caption-topic-receipt": true,
    "caption-topic-navigation": true,
    "caption-title-topic-receipt": true,
    "caption-topic-timeline-navigation": true,
    "caption-character-signal": true,
    "caption-character-context": true,
    "curated-character-performance": true,
    "reviewed-guide-negative-take": true
  });
  var STEVE_EVIDENCE_STATES = Object.freeze({
    "editorially-screened-source-cut": true,
    "strict-candidate-playback-review-ready": true,
    "strict-source-bounded-negative-take": true
  });
  var SHOW_WIKI_BRIEF_FORMAT_BASIS = Object.freeze({
    "source-title-metadata": true,
    "registered-source-type": true,
    "registered-source-type-and-title": true
  });
  var SHOW_WIKI_BRIEF_FIELDS = Object.freeze({
    kind: true,
    scope: true,
    format: true,
    formatBasis: true,
    queryAliases: true
  });
  var PROHIBITED_AUTHORITY =
    /\b(?:creator[- ]approved|rights?[- ]cleared|speaker[- ]verified|canon[- ]promoted|published|authenticated creator|official verdict)\b/i;

  function SourceDossierError(code, message, path) {
    this.name = "SourceDossierError";
    this.code = code;
    this.message = message;
    this.path = path || "";
    if (Error.captureStackTrace) Error.captureStackTrace(this, SourceDossierError);
  }
  SourceDossierError.prototype = Object.create(Error.prototype);
  SourceDossierError.prototype.constructor = SourceDossierError;

  function fail(code, message, path) {
    throw new SourceDossierError(code, message, path);
  }

  function own(record, key) {
    return Object.prototype.hasOwnProperty.call(record, key);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function isRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    var prototype = Object.getPrototypeOf(value);
    return Object.prototype.toString.call(value) === "[object Object]" &&
      (prototype === null || Object.getPrototypeOf(prototype) === null);
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
    if (!Array.isArray(value) && !isRecord(value)) {
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
        fail("INHERITED_FIELD", location + " contains an inherited field.", location);
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
        fail("UNSAFE_DESCRIPTOR", location + "." + key + " must be enumerable own data.",
          location + "." + key);
      }
      if (Array.isArray(value) &&
          (!/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= expectedLength)) {
        fail("UNSAFE_ARRAY_KEY", location + "." + key + " is not a canonical array index.",
          location + "." + key);
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

  function clean(value, maximum) {
    var result = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    if (maximum && result.length > maximum) result = result.slice(0, maximum).trim();
    return result;
  }

  function boundedProse(value, maximum) {
    var result = clean(value);
    if (!maximum || result.length <= maximum) return result;
    var room = Math.max(1, maximum - 1);
    var clipped = result.slice(0, room);
    var sentenceEnd = Math.max(
      clipped.lastIndexOf("."),
      clipped.lastIndexOf("!"),
      clipped.lastIndexOf("?")
    );
    if (sentenceEnd >= Math.floor(maximum * 0.65)) {
      return clipped.slice(0, sentenceEnd + 1).trim();
    }
    var wordEnd = clipped.lastIndexOf(" ");
    if (wordEnd > 0) clipped = clipped.slice(0, wordEnd);
    return clipped.trim() + "…";
  }

  function requiredText(value, path, maximum) {
    var result = clean(value, maximum);
    if (!result) fail("REQUIRED_TEXT", path + " must be a non-empty string.", path);
    if (PROHIBITED_AUTHORITY.test(result)) {
      fail("AUTHORITY_INFLATION", path + " contains authority the dossier cannot grant.", path);
    }
    return result;
  }

  function stringList(value, path, options) {
    var settings = options || {};
    if (!Array.isArray(value)) fail("REQUIRED_LIST", path + " must be an array.", path);
    var output = value.map(function (entry, index) {
      return requiredText(entry, path + "[" + index + "]", settings.max || 180);
    });
    if (new Set(output).size !== output.length) {
      fail("DUPLICATE_VALUE", path + " must not contain duplicates.", path);
    }
    if (settings.minimum && output.length < settings.minimum) {
      fail("REQUIRED_LIST", path + " must contain at least " + settings.minimum + " value.", path);
    }
    return output;
  }

  function finiteNumber(value, path, minimum) {
    var output = Number(value);
    if (!Number.isFinite(output) || (minimum != null && output < minimum)) {
      fail("INVALID_NUMBER", path + " is outside the allowed numeric range.", path);
    }
    return output;
  }

  function normalizeSignal(raw, path) {
    if (raw.signalScore == null) {
      if (clean(raw.signalBasis)) {
        fail(
          "SIGNAL_BASIS_WITHOUT_SCORE",
          path + ".signalBasis requires a signalScore.",
          path + ".signalBasis"
        );
      }
      return { signalScore: null, signalBasis: null };
    }
    var score = Number(raw.signalScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      fail(
        "INVALID_SIGNAL_SCORE",
        path + ".signalScore must be between 0 and 100.",
        path + ".signalScore"
      );
    }
    return {
      signalScore: score,
      signalBasis: requiredText(raw.signalBasis, path + ".signalBasis", 160)
    };
  }

  function wordCount(value) {
    return clean(value).split(/\s+/).filter(Boolean).length;
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
    Object.keys(value).forEach(function (key) { freezeDeep(value[key]); });
    return value;
  }

  function serial(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function exactYoutubeUrl(url, sourceId, path) {
    var value = requiredText(url, path, 500);
    var match = value.match(/^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})(?:&.*)?$/);
    if (!match || match[1] !== sourceId) {
      fail("SOURCE_URL_MISMATCH", path + " must be the exact official-source watch URL.", path);
    }
    return value;
  }

  function exactHttpsUrl(url, path) {
    var value = requiredText(url, path, 900);
    if (!/^https:\/\/[A-Za-z0-9.-]+(?:[/:?#]|$)/.test(value)) {
      fail("INVALID_HTTPS_URL", path + " must be an absolute HTTPS URL.", path);
    }
    return value;
  }

  function normalizeOfficialAlternate(value, path) {
    if (value == null) return null;
    if (!isRecord(value)) {
      fail("INVALID_OFFICIAL_ALTERNATE", path + " must be an object or null.", path);
    }
    if (value.timestampIsomorphic !== false &&
        value.timestampIsomorphic !== true) {
      fail(
        "ALTERNATE_SOURCE_BOUNDARY",
        path + " must explicitly declare its canonical timestamp relationship.",
        path + ".timestampIsomorphic"
      );
    }
    if (value.publicPlaybackAllowed !== true) {
      fail(
        "ALTERNATE_SOURCE_PLAYBACK",
        path + " must carry explicit official public playback authority.",
        path + ".publicPlaybackAllowed"
      );
    }
    var durationDelta = finiteNumber(
      value.durationDelta,
      path + ".durationDelta"
    );
    if (value.timestampIsomorphic === true && Math.abs(durationDelta) > 1) {
      fail(
        "ALTERNATE_SOURCE_TIMELINE",
        path + " cannot claim a shared timestamp map with more than one second of runtime drift.",
        path + ".durationDelta"
      );
    }
    return {
      kind: requiredText(value.kind, path + ".kind", 100),
      title: requiredText(value.title, path + ".title", 320),
      episodeUrl: exactHttpsUrl(value.episodeUrl, path + ".episodeUrl"),
      enclosureUrl: exactHttpsUrl(value.enclosureUrl, path + ".enclosureUrl"),
      duration: finiteNumber(value.duration, path + ".duration", 1),
      canonicalDuration: finiteNumber(
        value.canonicalDuration,
        path + ".canonicalDuration",
        1
      ),
      durationDelta: durationDelta,
      timestampIsomorphic: value.timestampIsomorphic === true,
      publicPlaybackAllowed: true,
      evidenceBoundary: requiredText(
        value.evidenceBoundary,
        path + ".evidenceBoundary",
        420
      )
    };
  }

  function normalizeExactSourceHold(value, path) {
    if (value == null) return null;
    if (!isRecord(value)) {
      fail("INVALID_EXACT_SOURCE_HOLD", path + " must be an object or null.", path);
    }
    var state = requiredText(value.state, path + ".state", 100);
    if (state !== "held-age-gated") {
      fail(
        "UNKNOWN_EXACT_SOURCE_HOLD",
        path + ".state is not a supported exact-source hold.",
        path + ".state"
      );
    }
    return {
      state: state,
      reason: requiredText(value.reason, path + ".reason", 600)
    };
  }

  function normalizeSummary(value, path) {
    if (value == null) return null;
    if (!isRecord(value)) fail("INVALID_SUMMARY", path + " must be an object or null.", path);
    var text = requiredText(value.text, path + ".text", 800);
    var basis = requiredText(value.basis, path + ".basis", 120);
    return { text: text, basis: basis };
  }

  function normalizeReceipt(raw, source, index) {
    var path = "sources[" + source._index + "].receipts[" + index + "]";
    if (!isRecord(raw)) fail("INVALID_RECEIPT", path + " must be an object.", path);
    var key = requiredText(raw.key, path + ".key", 240);
    var at = finiteNumber(raw.at, path + ".at", 0);
    var end = raw.end == null ? Math.min(source.duration, Math.ceil(at) + 30) :
      finiteNumber(raw.end, path + ".end", 0);
    if (at > source.duration + 1 || end <= at || end > source.duration + 1) {
      fail("RECEIPT_OUT_OF_RANGE", path + " is outside its registered source duration.", path);
    }
    var kind = requiredText(raw.kind, path + ".kind", 80);
    var label = requiredText(raw.label, path + ".label", 180);
    var excerpt = clean(raw.excerpt, 600);
    if (wordCount(excerpt) > 25) {
      fail("EXCERPT_TOO_LONG", path + ".excerpt exceeds 25 words.", path + ".excerpt");
    }
    var evidenceType = requiredText(raw.evidenceType, path + ".evidenceType", 100);
    if (!own(CONTENT_RECEIPT_TYPES, evidenceType)) {
      fail("UNKNOWN_EVIDENCE_TYPE", path + " has an unsupported evidence type.", path + ".evidenceType");
    }
    var steveEvidenceState = clean(raw.steveEvidenceState, 100);
    if (steveEvidenceState && !own(STEVE_EVIDENCE_STATES, steveEvidenceState)) {
      fail(
        "UNKNOWN_STEVE_EVIDENCE_STATE",
        path + " has an unsupported Steve evidence state.",
        path + ".steveEvidenceState"
      );
    }
    var editorNote = clean(raw.editorNote, 400);
    if (editorNote && !steveEvidenceState) {
      fail(
        "UNBOUND_RECEIPT_EDITOR_NOTE",
        path + ".editorNote requires a screened Steve evidence state.",
        path + ".editorNote"
      );
    }
    var publicExcerptAllowed = raw.publicExcerptAllowed === true;
    if (!publicExcerptAllowed && excerpt) {
      fail("WITHHELD_EXCERPT", path + " cannot expose a withheld excerpt.", path + ".excerpt");
    }
    if (evidenceType === "caption-topic-navigation" && excerpt) {
      fail("TOPIC_NAVIGATION_EXCERPT", path + " topic navigation must not expose an excerpt.", path);
    }
    if (!own(raw, "speaker") || raw.speaker !== null ||
        raw.speakerStatus !== "not-diarized") {
      fail("SPEAKER_BOUNDARY", path + " must remain explicitly non-diarized.", path);
    }
    var signal = normalizeSignal(raw, path);
    var topicMentions = raw.topicMentions == null ? null :
      finiteNumber(raw.topicMentions, path + ".topicMentions", 0);
    var topicFirstAt = raw.topicFirstAt == null ? null :
      finiteNumber(raw.topicFirstAt, path + ".topicFirstAt", 0);
    var topicPeakAt = raw.topicPeakAt == null ? null :
      finiteNumber(raw.topicPeakAt, path + ".topicPeakAt", 0);
    var topicCluster = raw.topicCluster == null ? null :
      finiteNumber(raw.topicCluster, path + ".topicCluster", 0);
    if (topicFirstAt != null && topicFirstAt > source.duration + 1 ||
        topicPeakAt != null && topicPeakAt > source.duration + 1) {
      fail(
        "RECEIPT_TOPIC_TIMING_OUT_OF_RANGE",
        path + " topic timing metrics exceed the registered source duration.",
        path
      );
    }
    var topicMetricBasis = clean(raw.topicMetricBasis, 180);
    if (topicMetricBasis && topicMentions == null &&
        topicFirstAt == null && topicPeakAt == null && topicCluster == null) {
      fail(
        "RECEIPT_TOPIC_METRIC_BASIS_WITHOUT_METRIC",
        path + ".topicMetricBasis requires a registered topic metric.",
        path + ".topicMetricBasis"
      );
    }
    var entityIds = stringList(raw.entityIds || [], path + ".entityIds", { max: 160 });
    entityIds.forEach(function (entityId, entityIndex) {
      if (!ENTITY_ID.test(entityId)) {
        fail("INVALID_ENTITY_ID", path + ".entityIds[" + entityIndex + "] is invalid.",
          path + ".entityIds[" + entityIndex + "]");
      }
    });
    return {
      key: key,
      at: at,
      end: end,
      kind: kind,
      label: label,
      excerpt: excerpt,
      evidenceLevel: requiredText(raw.evidenceLevel, path + ".evidenceLevel", 160),
      evidenceType: evidenceType,
      evidenceBasis: requiredText(raw.evidenceBasis, path + ".evidenceBasis", 180),
      reviewState: requiredText(raw.reviewState, path + ".reviewState", 120),
      speaker: null,
      speakerStatus: "not-diarized",
      promotionAllowed: raw.promotionAllowed === true,
      publicExcerptAllowed: publicExcerptAllowed,
      signalScore: signal.signalScore,
      signalBasis: signal.signalBasis,
      topicMentions: topicMentions,
      topicFirstAt: topicFirstAt,
      topicPeakAt: topicPeakAt,
      topicCluster: topicCluster,
      topicMetricBasis: topicMetricBasis,
      steveEvidenceState: steveEvidenceState,
      editorNote: editorNote,
      entityIds: entityIds,
      url: "https://www.youtube.com/watch?v=" + source.id + "&t=" + Math.round(at) + "s"
    };
  }

  function normalizeEntity(raw, source, receiptMap, index) {
    var path = "sources[" + source._index + "].entities[" + index + "]";
    if (!isRecord(raw)) fail("INVALID_ENTITY", path + " must be an object.", path);
    var id = requiredText(raw.id, path + ".id", 160);
    if (!ENTITY_ID.test(id)) fail("INVALID_ENTITY_ID", path + ".id is invalid.", path + ".id");
    var basis = requiredText(raw.basis, path + ".basis", 80);
    if (!own(ENTITY_BASIS, basis)) {
      fail("UNKNOWN_ENTITY_BASIS", path + " has an unsupported evidence basis.", path + ".basis");
    }
    var receiptKeys = stringList(raw.receiptKeys || [], path + ".receiptKeys", { max: 240 });
    receiptKeys.forEach(function (key) {
      if (!receiptMap.has(key)) {
        fail("UNKNOWN_RECEIPT", path + " references a receipt outside the source.", path + ".receiptKeys");
      }
    });
    if (basis === "timestamped-receipt" && !receiptKeys.length) {
      fail("MISSING_ENTITY_RECEIPT", path + " requires a local timestamped receipt.", path);
    }
    if (basis === "cached-title-alias" && receiptKeys.length) {
      fail("TITLE_ALIAS_RECEIPT", path + " title metadata cannot claim a content receipt.", path);
    }
    return {
      id: id,
      label: requiredText(raw.label, path + ".label", 180),
      type: requiredText(raw.type, path + ".type", 80),
      basis: basis,
      receiptKeys: receiptKeys
    };
  }

  function normalizeArtifact(raw, source, index) {
    var path = "sources[" + source._index + "].artifacts[" + index + "]";
    if (!isRecord(raw)) fail("INVALID_ARTIFACT", path + " must be an object.", path);
    var id = requiredText(raw.id, path + ".id", 240);
    var kind = requiredText(raw.kind, path + ".kind", 80);
    if (!KEBAB_ID.test(kind)) fail("INVALID_ARTIFACT_KIND", path + ".kind is invalid.", path + ".kind");
    var authority = requiredText(raw.authority, path + ".authority", 80);
    if (!own(ACTION_AUTHORITY, authority)) {
      fail("ACTION_AUTHORITY", path + " claims unsupported action authority.", path + ".authority");
    }
    var sourceIds = stringList(raw.sourceIds || [], path + ".sourceIds", {
      max: 64,
      minimum: 1
    });
    if (sourceIds.indexOf(source.id) < 0) {
      fail("ARTIFACT_SOURCE_MISMATCH", path + " must name its owning source.", path + ".sourceIds");
    }
    sourceIds.forEach(function (sourceId, sourceIndex) {
      if (!SOURCE_ID.test(sourceId)) {
        fail("INVALID_SOURCE_ID", path + ".sourceIds[" + sourceIndex + "] is invalid.",
          path + ".sourceIds[" + sourceIndex + "]");
      }
    });
    return {
      id: id,
      kind: kind,
      label: requiredText(raw.label, path + ".label", 240),
      authority: authority,
      reviewState: requiredText(raw.reviewState, path + ".reviewState", 160),
      sourceIds: sourceIds,
      receiptKeys: stringList(raw.receiptKeys || [], path + ".receiptKeys", { max: 240 }),
      at: raw.at == null ? null : finiteNumber(raw.at, path + ".at", 0),
      targetSection: clean(raw.targetSection, 80),
      risk: clean(raw.risk, 80)
    };
  }

  function normalizeShowWikiAliases(value, path) {
    var aliases = stringList(value || [], path, { max: 160 });
    if (aliases.length > 16) {
      fail(
        "SHOW_WIKI_QUERY_ALIAS_LIMIT",
        path + " cannot contain more than 16 aliases.",
        path
      );
    }
    var normalizedAliases = aliases.map(function (alias) {
      return alias.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    });
    if (new Set(normalizedAliases).size !== normalizedAliases.length) {
      fail(
        "DUPLICATE_SHOW_WIKI_QUERY_ALIAS",
        path + " must not contain normalized duplicates.",
        path
      );
    }
    return aliases;
  }

  function normalizeEpisodeGuide(raw, source, path) {
    if (raw == null) return null;
    if (!isRecord(raw)) {
      fail("INVALID_EPISODE_GUIDE", path + " must be an object or null.", path);
    }
    if (source.coverage !== "caption-backed") {
      fail(
        "COVERAGE_EPISODE_GUIDE_OVERREACH",
        path + " requires caption-backed coverage.",
        path
      );
    }
    var schema = requiredText(raw.schema, path + ".schema", 80);
    if (schema !== "wwam-episode-guide/v2") {
      fail("INVALID_EPISODE_GUIDE_SCHEMA", path + ".schema is unsupported.", path + ".schema");
    }

    function boundedTime(value, itemPath) {
      var at = finiteNumber(value, itemPath, 0);
      if (at > source.duration + 1) {
        fail("EPISODE_GUIDE_TIME_OUT_OF_RANGE", itemPath + " exceeds the source runtime.", itemPath);
      }
      return at;
    }

    function boundedWindow(rawItem, itemPath) {
      var at = boundedTime(rawItem.at != null ? rawItem.at : rawItem.t, itemPath + ".at");
      var end = finiteNumber(rawItem.end, itemPath + ".end", 0);
      // Cached YouTube runtimes can differ by a few seconds across snapshots.
      // Clamp a trailing cut to the canonical runtime instead of discarding an
      // otherwise valid source-local timestamp.
      if (end > source.duration && end - source.duration <= 60) end = source.duration;
      if (end <= at || end > source.duration + 1) {
        fail("EPISODE_GUIDE_WINDOW_INVALID", itemPath + " must end inside the source after it begins.", itemPath);
      }
      return { at: at, end: end };
    }

    function boundedExcerpt(value, excerptPath) {
      var excerpt = requiredText(value, excerptPath, 600);
      if (wordCount(excerpt) > 25) {
        fail("EPISODE_GUIDE_EXCERPT_TOO_LONG", excerptPath + " exceeds 25 words.", excerptPath);
      }
      return excerpt;
    }

    if (!Array.isArray(raw.cuts) || raw.cuts.length < 8 || raw.cuts.length > 20) {
      fail("EPISODE_GUIDE_CUT_COUNT", path + ".cuts must contain between eight and twenty cuts.", path + ".cuts");
    }
    var cutIds = new Set();
    var cuts = raw.cuts.map(function (cut, index) {
      var cutPath = path + ".cuts[" + index + "]";
      if (!isRecord(cut)) fail("INVALID_EPISODE_GUIDE_CUT", cutPath + " must be an object.", cutPath);
      var id = requiredText(cut.id, cutPath + ".id", 80);
      if (!KEBAB_ID.test(id) || cutIds.has(id)) {
        fail("INVALID_EPISODE_GUIDE_CUT_ID", cutPath + ".id must be unique kebab-case.", cutPath + ".id");
      }
      cutIds.add(id);
      var window = boundedWindow(cut, cutPath);
      var score = finiteNumber(cut.score, cutPath + ".score", 0);
      if (score > 100) fail("INVALID_EPISODE_GUIDE_SCORE", cutPath + ".score exceeds 100.", cutPath + ".score");
      return {
        id: id,
        at: window.at,
        end: window.end,
        label: requiredText(cut.label, cutPath + ".label", 180),
        category: requiredText(cut.category, cutPath + ".category", 100),
        topic: requiredText(cut.topic, cutPath + ".topic", 180),
        excerpt: boundedExcerpt(cut.excerpt, cutPath + ".excerpt"),
        score: score,
        substance: cut.substance == null ? 0 : finiteNumber(cut.substance, cutPath + ".substance", 0),
        editorialEvidence: clean(cut.editorialEvidence, 180),
        categorySupport: cut.categorySupport == null ? 0 : finiteNumber(cut.categorySupport, cutPath + ".categorySupport", 0),
        categoryEvidence: clean(cut.categoryEvidence, 180),
        topicBasis: clean(cut.topicBasis, 100),
        topicSupport: cut.topicSupport == null ? 0 : finiteNumber(cut.topicSupport, cutPath + ".topicSupport", 0),
        topicEvidence: clean(cut.topicEvidence, 180),
        verdictSignal: cut.verdictSignal == null ? 0 : finiteNumber(cut.verdictSignal, cutPath + ".verdictSignal", 0),
        verdictEvidence: clean(cut.verdictEvidence, 180),
        evidenceBasis: clean(cut.evidenceBasis, 180)
      };
    });
    var cutMap = new Map(cuts.map(function (cut) { return [cut.id, cut]; }));

    if (!Array.isArray(raw.chapters) || raw.chapters.length < 4 || raw.chapters.length > 8) {
      fail("EPISODE_GUIDE_CHAPTER_COUNT", path + ".chapters must contain between four and eight chapters.", path + ".chapters");
    }
    var chapterIds = new Set();
    var chapters = raw.chapters.map(function (chapter, index) {
      var chapterPath = path + ".chapters[" + index + "]";
      if (!isRecord(chapter)) fail("INVALID_EPISODE_GUIDE_CHAPTER", chapterPath + " must be an object.", chapterPath);
      var id = requiredText(chapter.id, chapterPath + ".id", 80);
      var cutId = requiredText(chapter.cutId, chapterPath + ".cutId", 80);
      if (!KEBAB_ID.test(id) || chapterIds.has(id) || !cutIds.has(cutId)) {
        fail("INVALID_EPISODE_GUIDE_CHAPTER_ID", chapterPath + " has an invalid chapter or cut ID.", chapterPath);
      }
      chapterIds.add(id);
      var window = boundedWindow(chapter, chapterPath);
      var chapterCut = cutMap.get(cutId);
      var chapterExcerpt = boundedExcerpt(
        chapter.excerpt,
        chapterPath + ".excerpt"
      );
      var chapterCategory = requiredText(
        chapter.category,
        chapterPath + ".category",
        100
      );
      var chapterTopic = requiredText(
        chapter.topic,
        chapterPath + ".topic",
        180
      );
      if (
        Math.abs(window.at - chapterCut.at) > 0.001 ||
        Math.abs(window.end - chapterCut.end) > 0.001 ||
        chapterExcerpt !== chapterCut.excerpt ||
        chapterCategory !== chapterCut.category ||
        chapterTopic !== chapterCut.topic
      ) {
        fail(
          "EPISODE_GUIDE_CHAPTER_CUT_MISMATCH",
          chapterPath + " must inherit its window and evidence fields from its local guide cut.",
          chapterPath
        );
      }
      return {
        id: id,
        act: finiteNumber(chapter.act, chapterPath + ".act", 1),
        label: requiredText(chapter.label, chapterPath + ".label", 200),
        at: chapterCut.at,
        end: chapterCut.end,
        body: requiredText(chapter.body, chapterPath + ".body", 600),
        excerpt: chapterCut.excerpt,
        category: chapterCut.category,
        topic: chapterCut.topic,
        cutId: cutId,
        evidenceBasis: clean(chapter.evidenceBasis, 180)
      };
    });

    if (!Array.isArray(raw.takeArc) || raw.takeArc.length !== 3) {
      fail("EPISODE_GUIDE_TAKE_ARC_COUNT", path + ".takeArc must contain exactly three phases.", path + ".takeArc");
    }
    var takeArc = raw.takeArc.map(function (take, index) {
      var takePath = path + ".takeArc[" + index + "]";
      if (!isRecord(take)) fail("INVALID_EPISODE_GUIDE_TAKE", takePath + " must be an object.", takePath);
      var window = boundedWindow(take, takePath);
      var takeCutId = clean(take.cutId, 80);
      if (takeCutId && !cutIds.has(takeCutId)) {
        fail("UNKNOWN_EPISODE_GUIDE_TAKE_CUT", takePath + ".cutId is not in this guide.", takePath + ".cutId");
      }
      var takeExcerpt = boundedExcerpt(take.excerpt, takePath + ".excerpt");
      var takeCategory = requiredText(
        take.category,
        takePath + ".category",
        100
      );
      var takeCut = takeCutId ? cutMap.get(takeCutId) : null;
      if (takeCut && (
        Math.abs(window.at - takeCut.at) > 0.001 ||
        Math.abs(window.end - takeCut.end) > 0.001 ||
        takeExcerpt !== takeCut.excerpt ||
        takeCategory !== takeCut.category
      )) {
        fail(
          "EPISODE_GUIDE_TAKE_CUT_MISMATCH",
          takePath + " must inherit its window and evidence fields from its local guide cut.",
          takePath
        );
      }
      return {
        phase: requiredText(take.phase, takePath + ".phase", 80),
        label: requiredText(take.label, takePath + ".label", 200),
        at: takeCut ? takeCut.at : window.at,
        end: takeCut ? takeCut.end : window.end,
        body: requiredText(take.body, takePath + ".body", 600),
        excerpt: takeCut ? takeCut.excerpt : takeExcerpt,
        category: takeCut ? takeCut.category : takeCategory,
        cutId: takeCutId,
        evidenceBasis: clean(take.evidenceBasis, 180),
        promotionAllowed: take.promotionAllowed === false ? false : null
      };
    });

    if (!Array.isArray(raw.threads) || raw.threads.length < 3 || raw.threads.length > 10) {
      fail("EPISODE_GUIDE_THREAD_COUNT", path + ".threads must contain between three and ten threads.", path + ".threads");
    }
    var threadNames = new Set();
    var threads = raw.threads.map(function (thread, index) {
      var threadPath = path + ".threads[" + index + "]";
      if (!isRecord(thread)) fail("INVALID_EPISODE_GUIDE_THREAD", threadPath + " must be an object.", threadPath);
      var name = requiredText(thread.name, threadPath + ".name", 180);
      if (threadNames.has(name)) fail("DUPLICATE_EPISODE_GUIDE_THREAD", threadPath + " is duplicated.", threadPath);
      threadNames.add(name);
      var threadCutId = clean(thread.cutId, 80);
      if (threadCutId && !cutIds.has(threadCutId)) {
        fail(
          "UNKNOWN_EPISODE_GUIDE_THREAD_CUT",
          threadPath + ".cutId is not in this guide.",
          threadPath + ".cutId"
        );
      }
      var threadReceipt = boundedExcerpt(
        thread.receipt,
        threadPath + ".receipt"
      );
      if (threadCutId && threadReceipt !== cutMap.get(threadCutId).excerpt) {
        fail(
          "EPISODE_GUIDE_THREAD_CUT_MISMATCH",
          threadPath + ".receipt must come from its local guide cut.",
          threadPath + ".receipt"
        );
      }
      return {
        name: name,
        kind: requiredText(thread.kind, threadPath + ".kind", 80),
        mentions: finiteNumber(thread.mentions, threadPath + ".mentions", 1),
        cluster: finiteNumber(thread.cluster, threadPath + ".cluster", 1),
        first: boundedTime(thread.first, threadPath + ".first"),
        peak: boundedTime(thread.peak, threadPath + ".peak"),
        receipt: threadReceipt,
        cutId: threadCutId,
        score: finiteNumber(thread.score, threadPath + ".score", 0)
      };
    });

    var shape = null;
    if (raw.shape != null) {
      var shapePath = path + ".shape";
      if (!isRecord(raw.shape)) {
        fail("INVALID_EPISODE_GUIDE_SHAPE", shapePath + " must be an object.", shapePath);
      }
      var runtimeBand = requiredText(raw.shape.runtimeBand, shapePath + ".runtimeBand", 40);
      if (["FEATURE", "EXTENDED", "MARATHON"].indexOf(runtimeBand) < 0) {
        fail("INVALID_EPISODE_GUIDE_RUNTIME_BAND", shapePath + ".runtimeBand is unsupported.", shapePath + ".runtimeBand");
      }
      shape = {
        runtimeBand: runtimeBand,
        chapters: finiteNumber(raw.shape.chapters, shapePath + ".chapters", 0),
        threads: finiteNumber(raw.shape.threads, shapePath + ".threads", 0),
        cuts: finiteNumber(raw.shape.cuts, shapePath + ".cuts", 0)
      };
      if (shape.chapters !== chapters.length || shape.threads !== threads.length || shape.cuts !== cuts.length) {
        fail("EPISODE_GUIDE_SHAPE_MISMATCH", shapePath + " must match the normalized guide counts.", shapePath);
      }
    }

    var fanRead = null;
    if (raw.fanRead != null) {
      var fanPath = path + ".fanRead";
      if (!isRecord(raw.fanRead) || !isRecord(raw.fanRead.whyThisNightMatters)) {
        fail("INVALID_EPISODE_GUIDE_FAN_READ", fanPath + " must include whyThisNightMatters.", fanPath);
      }
      var whyRaw = raw.fanRead.whyThisNightMatters;
      var strongestCutId = requiredText(
        whyRaw.strongestCutId,
        fanPath + ".whyThisNightMatters.strongestCutId",
        80
      );
      if (!cutMap.has(strongestCutId)) {
        fail("UNKNOWN_EPISODE_GUIDE_FAN_CUT", fanPath + ".whyThisNightMatters.strongestCutId is not in this guide.", fanPath);
      }
      var primaryThread = requiredText(
        whyRaw.primaryThread,
        fanPath + ".whyThisNightMatters.primaryThread",
        180
      );
      var secondaryThread = requiredText(
        whyRaw.secondaryThread,
        fanPath + ".whyThisNightMatters.secondaryThread",
        180
      );
      if (!threadNames.has(primaryThread) || !threadNames.has(secondaryThread)) {
        fail("UNKNOWN_EPISODE_GUIDE_FAN_THREAD", fanPath + " must name threads from this guide.", fanPath);
      }

      function normalizeFanReceipt(key) {
        var fanRaw = raw.fanRead[key];
        if (fanRaw == null) return null;
        var itemPath = fanPath + "." + key;
        if (!isRecord(fanRaw)) {
          fail("INVALID_EPISODE_GUIDE_FAN_RECEIPT", itemPath + " must be an object or null.", itemPath);
        }
        var cutId = requiredText(fanRaw.cutId, itemPath + ".cutId", 80);
        var canonicalCut = cutMap.get(cutId);
        if (!canonicalCut) {
          fail("UNKNOWN_EPISODE_GUIDE_FAN_CUT", itemPath + ".cutId is not in this guide.", itemPath + ".cutId");
        }
        return {
          key: key,
          label: requiredText(fanRaw.label, itemPath + ".label", 180),
          body: requiredText(fanRaw.body, itemPath + ".body", 500),
          at: canonicalCut.at,
          end: canonicalCut.end,
          cutId: canonicalCut.id,
          category: canonicalCut.category,
          topic: canonicalCut.topic,
          excerpt: canonicalCut.excerpt,
          evidenceBasis: clean(fanRaw.evidenceBasis, 180) || canonicalCut.evidenceBasis
        };
      }

      fanRead = {
        whyThisNightMatters: {
          label: requiredText(
            whyRaw.label,
            fanPath + ".whyThisNightMatters.label",
            180
          ),
          body: requiredText(
            whyRaw.body,
            fanPath + ".whyThisNightMatters.body",
            700
          ),
          primaryThread: primaryThread,
          secondaryThread: secondaryThread,
          strongestCutId: strongestCutId
        },
        loved: normalizeFanReceipt("loved"),
        hated: normalizeFanReceipt("hated"),
        wildestDetour: normalizeFanReceipt("wildestDetour"),
        lastWord: normalizeFanReceipt("lastWord")
      };
    }

    var declaredFormat = clean(raw.format, 80);
    var runtimeFormat = null;
    if (raw.runtimeFormat != null) {
      var runtimeFormatPath = path + ".runtimeFormat";
      if (!isRecord(raw.runtimeFormat)) {
        fail(
          "INVALID_EPISODE_GUIDE_RUNTIME_FORMAT",
          runtimeFormatPath + " must be an object or null.",
          runtimeFormatPath
        );
      }
      var runtimeFormatId = requiredText(
        raw.runtimeFormat.id,
        runtimeFormatPath + ".id",
        80
      );
      if (!KEBAB_ID.test(runtimeFormatId)) {
        fail(
          "INVALID_EPISODE_GUIDE_RUNTIME_FORMAT_ID",
          runtimeFormatPath + ".id must be a kebab-case ID.",
          runtimeFormatPath + ".id"
        );
      }
      var declaredGuideFormat = clean(
        raw.runtimeFormat.declaredGuideFormat,
        80
      );
      if (declaredGuideFormat !== declaredFormat) {
        fail(
          "EPISODE_GUIDE_FORMAT_DRIFT",
          runtimeFormatPath + ".declaredGuideFormat must preserve the guide's declared format.",
          runtimeFormatPath + ".declaredGuideFormat"
        );
      }
      runtimeFormat = {
        id: runtimeFormatId,
        label: requiredText(
          raw.runtimeFormat.label,
          runtimeFormatPath + ".label",
          100
        ),
        basis: requiredText(
          raw.runtimeFormat.basis,
          runtimeFormatPath + ".basis",
          180
        ),
        declaredGuideFormat: declaredGuideFormat
      };
    }

    function canonicalGuideCut(rawItem, itemPath, options) {
      var settings = options || {};
      var cutId = requiredText(rawItem.cutId, itemPath + ".cutId", 80);
      var canonicalCut = cutMap.get(cutId);
      if (!canonicalCut) {
        fail(
          "UNKNOWN_EPISODE_GUIDE_EDITORIAL_CUT",
          itemPath + ".cutId is not in this source's guide.",
          itemPath + ".cutId"
        );
      }
      var window = boundedWindow(rawItem, itemPath);
      var excerpt = boundedExcerpt(rawItem.excerpt, itemPath + ".excerpt");
      if (
        Math.abs(window.at - canonicalCut.at) > 0.001 ||
        Math.abs(window.end - canonicalCut.end) > 0.001 ||
        excerpt !== canonicalCut.excerpt
      ) {
        fail(
          "EPISODE_GUIDE_EDITORIAL_CUT_MISMATCH",
          itemPath + " must inherit its timestamp and excerpt from its local guide cut.",
          itemPath
        );
      }
      if (settings.topic) {
        var topic = requiredText(rawItem.topic, itemPath + ".topic", 180);
        if (topic !== canonicalCut.topic) {
          fail(
            "EPISODE_GUIDE_EDITORIAL_TOPIC_MISMATCH",
            itemPath + ".topic must match its local guide cut.",
            itemPath + ".topic"
          );
        }
      }
      if (settings.category) {
        var category = requiredText(
          rawItem.category,
          itemPath + ".category",
          100
        );
        if (category !== canonicalCut.category) {
          fail(
            "EPISODE_GUIDE_EDITORIAL_CATEGORY_MISMATCH",
            itemPath + ".category must match its local guide cut.",
            itemPath + ".category"
          );
        }
      }
      return canonicalCut;
    }

    var reviewedRecap = null;
    if (raw.recap != null) {
      var reviewedRecapPath = path + ".recap";
      if (!isRecord(raw.recap)) {
        fail(
          "INVALID_EPISODE_GUIDE_RECAP",
          reviewedRecapPath + " must be an object or null.",
          reviewedRecapPath
        );
      }
      if (raw.recap.promotionAllowed !== false) {
        fail(
          "EPISODE_GUIDE_RECAP_PROMOTION_OVERREACH",
          reviewedRecapPath + ".promotionAllowed must remain false.",
          reviewedRecapPath + ".promotionAllowed"
        );
      }
      if (!Array.isArray(raw.recap.paragraphs) ||
          raw.recap.paragraphs.length < 1 ||
          raw.recap.paragraphs.length > 8) {
        fail(
          "EPISODE_GUIDE_RECAP_PARAGRAPH_COUNT",
          reviewedRecapPath + ".paragraphs must contain between one and eight source-bound paragraphs.",
          reviewedRecapPath + ".paragraphs"
        );
      }
      var recapParagraphs = raw.recap.paragraphs.map(function (paragraph, index) {
        var paragraphPath = reviewedRecapPath + ".paragraphs[" + index + "]";
        if (!isRecord(paragraph)) {
          fail(
            "INVALID_EPISODE_GUIDE_RECAP_PARAGRAPH",
            paragraphPath + " must be an object.",
            paragraphPath
          );
        }
        var paragraphCut = canonicalGuideCut(
          paragraph,
          paragraphPath,
          { topic: true }
        );
        return {
          ordinal: index + 1,
          at: paragraphCut.at,
          end: paragraphCut.end,
          cutId: paragraphCut.id,
          topic: paragraphCut.topic,
          excerpt: paragraphCut.excerpt,
          body: requiredText(
            paragraph.body,
            paragraphPath + ".body",
            1000
          ),
          evidenceBasis: requiredText(
            paragraph.evidenceBasis,
            paragraphPath + ".evidenceBasis",
            240
          )
        };
      });
      for (var paragraphIndex = 1;
        paragraphIndex < recapParagraphs.length;
        paragraphIndex += 1) {
        if (recapParagraphs[paragraphIndex].at <
            recapParagraphs[paragraphIndex - 1].at) {
          fail(
            "EPISODE_GUIDE_RECAP_PARAGRAPH_ORDER",
            reviewedRecapPath + ".paragraphs must remain chronological.",
            reviewedRecapPath + ".paragraphs[" + paragraphIndex + "]"
          );
        }
      }
      var sourceCutIds = stringList(
        raw.recap.sourceCutIds || [],
        reviewedRecapPath + ".sourceCutIds",
        { max: 80, minimum: 1 }
      );
      sourceCutIds.forEach(function (cutId, index) {
        if (!cutMap.has(cutId)) {
          fail(
            "UNKNOWN_EPISODE_GUIDE_RECAP_SOURCE_CUT",
            reviewedRecapPath + ".sourceCutIds[" + index + "] is not local to this guide.",
            reviewedRecapPath + ".sourceCutIds[" + index + "]"
          );
        }
      });
      recapParagraphs.forEach(function (paragraph, index) {
        if (sourceCutIds.indexOf(paragraph.cutId) < 0) {
          fail(
            "EPISODE_GUIDE_RECAP_PARAGRAPH_CUT_OMITTED",
            reviewedRecapPath + ".paragraphs[" + index + "] is not represented in sourceCutIds.",
            reviewedRecapPath + ".paragraphs[" + index + "].cutId"
          );
        }
      });
      reviewedRecap = {
        status: requiredText(
          raw.recap.status,
          reviewedRecapPath + ".status",
          100
        ),
        label: requiredText(
          raw.recap.label,
          reviewedRecapPath + ".label",
          180
        ),
        headline: requiredText(
          raw.recap.headline,
          reviewedRecapPath + ".headline",
          320
        ),
        dek: requiredText(
          raw.recap.dek,
          reviewedRecapPath + ".dek",
          700
        ),
        paragraphs: recapParagraphs,
        sourceCutIds: sourceCutIds,
        promotionAllowed: false
      };
    }

    var editorialLanes = null;
    if (raw.lanes != null) {
      var editorialLanesPath = path + ".lanes";
      if (!isRecord(raw.lanes)) {
        fail(
          "INVALID_EPISODE_GUIDE_LANES",
          editorialLanesPath + " must be an object or null.",
          editorialLanesPath
        );
      }
      var editorialLaneKeys = Object.keys(raw.lanes);
      if (editorialLaneKeys.length > 12) {
        fail(
          "EPISODE_GUIDE_LANE_LIMIT",
          editorialLanesPath + " cannot contain more than twelve lanes.",
          editorialLanesPath
        );
      }
      editorialLanes = {};
      editorialLaneKeys.forEach(function (laneName) {
        var lanePath = editorialLanesPath + "." + laneName;
        var lane = raw.lanes[laneName];
        if (!/^[A-Za-z][A-Za-z0-9]*$/.test(laneName)) {
          fail(
            "INVALID_EPISODE_GUIDE_LANE_NAME",
            lanePath + " has an invalid lane name.",
            lanePath
          );
        }
        if (lane == null) {
          editorialLanes[laneName] = null;
          return;
        }
        if (!isRecord(lane)) {
          fail(
            "INVALID_EPISODE_GUIDE_LANE",
            lanePath + " must be an object or null.",
            lanePath
          );
        }
        if (lane.promotionAllowed !== false) {
          fail(
            "EPISODE_GUIDE_LANE_PROMOTION_OVERREACH",
            lanePath + ".promotionAllowed must remain false.",
            lanePath + ".promotionAllowed"
          );
        }
        var laneCut = canonicalGuideCut(
          lane,
          lanePath,
          { topic: true, category: true }
        );
        editorialLanes[laneName] = {
          key: requiredText(lane.key, lanePath + ".key", 80),
          label: requiredText(lane.label, lanePath + ".label", 180),
          status: requiredText(lane.status, lanePath + ".status", 100),
          at: laneCut.at,
          end: laneCut.end,
          cutId: laneCut.id,
          category: laneCut.category,
          topic: laneCut.topic,
          excerpt: laneCut.excerpt,
          body: requiredText(lane.body, lanePath + ".body", 700),
          evidenceBasis: requiredText(
            lane.evidenceBasis,
            lanePath + ".evidenceBasis",
            240
          ),
          promotionAllowed: false
        };
      });
    }

    var reviewChecklist = stringList(
      raw.reviewChecklist || [],
      path + ".reviewChecklist",
      { max: 360 }
    );
    if (reviewChecklist.length > 12) {
      fail(
        "EPISODE_GUIDE_REVIEW_CHECKLIST_LIMIT",
        path + ".reviewChecklist cannot contain more than twelve checks.",
        path + ".reviewChecklist"
      );
    }
    if (raw.promotionAllowed === true) {
      fail(
        "EPISODE_GUIDE_PROMOTION_OVERREACH",
        path + ".promotionAllowed cannot promote machine-surfaced guide evidence.",
        path + ".promotionAllowed"
      );
    }

    return {
      schema: schema,
      variant: clean(raw.variant, 80),
      format: declaredFormat,
      runtimeFormat: runtimeFormat,
      sourceContentMode: clean(raw.sourceContentMode, 100),
      publicationStatus: clean(raw.publicationStatus, 100),
      promotionAllowed: raw.promotionAllowed === false ? false : null,
      basis: requiredText(raw.basis, path + ".basis", 360),
      overview: requiredText(raw.overview, path + ".overview", 1000),
      evidenceSummary: clean(raw.evidenceSummary, 1800),
      shape: shape,
      fanRead: fanRead,
      recap: reviewedRecap,
      lanes: editorialLanes,
      chapters: chapters,
      takeArc: takeArc,
      threads: threads,
      cuts: cuts,
      reviewChecklist: reviewChecklist,
      metrics: {
        chapters: chapters.length,
        threads: threads.length,
        cuts: cuts.length,
        praise: finiteNumber(raw.metrics && raw.metrics.praise, path + ".metrics.praise", 0),
        negative: finiteNumber(raw.metrics && raw.metrics.negative, path + ".metrics.negative", 0),
        comedy: finiteNumber(raw.metrics && raw.metrics.comedy, path + ".metrics.comedy", 0),
        substantive: finiteNumber(raw.metrics && raw.metrics.substantive, path + ".metrics.substantive", 0)
      }
    };
  }
  function normalizeEpisodeRecap(raw, source, receiptMap, episodeGuide, path) {
    if (raw == null) return null;
    if (!isRecord(raw)) {
      fail("INVALID_EPISODE_RECAP", path + " must be an object or null.", path);
    }
    var schema = requiredText(raw.schema, path + ".schema", 80);
    if (schema !== "wwam-feldman-recap/v1") {
      fail("INVALID_EPISODE_RECAP_SCHEMA", path + ".schema is unsupported.", path + ".schema");
    }
    var state = requiredText(raw.state, path + ".state", 40);
    if (state !== "ready" && state !== "held") {
      fail("INVALID_EPISODE_RECAP_STATE", path + ".state must be ready or held.", path + ".state");
    }
    if (requiredText(raw.sourceId, path + ".sourceId", 64) !== source.id) {
      fail("EPISODE_RECAP_SOURCE_MISMATCH", path + ".sourceId must match the owning source.", path + ".sourceId");
    }
    if (!isRecord(raw.approval) || raw.approval.actualApproval !== false) {
      fail(
        "EPISODE_RECAP_APPROVAL_OVERREACH",
        path + ".approval must explicitly state actualApproval: false.",
        path + ".approval"
      );
    }
    if (state === "ready" && source.coverage !== "caption-backed") {
      fail(
        "COVERAGE_EPISODE_RECAP_OVERREACH",
        path + " cannot expose a semantic recap under " + source.coverage + " coverage.",
        path
      );
    }
    var guideCuts = array(episodeGuide && episodeGuide.cuts);
    var guideCutMap = new Map(guideCuts.map(function (cut) {
      return [clean(cut.id), cut];
    }));
    var guideChapters = array(episodeGuide && episodeGuide.chapters);
    var guideChapterMap = new Map(guideChapters.map(function (chapter) {
      return [clean(chapter.id), chapter];
    }));
    var guideChapterByCutId = new Map();
    guideChapters.forEach(function (chapter) {
      guideChapterByCutId.set(clean(chapter.cutId), chapter);
    });
    var guideThreadNames = new Set(
      array(episodeGuide && episodeGuide.threads).map(function (thread) {
        return clean(thread.name);
      })
    );
    var guideThreadById = new Map(
      array(episodeGuide && episodeGuide.threads).map(function (thread) {
        var id = "thread-" + clean(thread.name).toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        return [id, thread];
      }).filter(function (entry) {
        return entry[0] !== "thread-";
      })
    );
    var guideThreadIds = new Set(guideThreadById.keys());
    var topics = stringList(raw.topics || [], path + ".topics", { max: 180 });
    if (state === "held" && topics.length) {
      fail(
        "HELD_EPISODE_RECAP_TOPIC_OVERREACH",
        path + ".topics must remain empty while the recap is held.",
        path + ".topics"
      );
    }

    function boundedWindow(item, itemPath) {
      var at = finiteNumber(item.at, itemPath + ".at", 0);
      var end = finiteNumber(item.end, itemPath + ".end", 0);
      if (end > source.duration && end - source.duration <= 60) end = source.duration;
      if (at > source.duration + 1 || end <= at || end > source.duration + 1) {
        fail(
          "EPISODE_RECAP_WINDOW_INVALID",
          itemPath + " must remain inside the owning source runtime.",
          itemPath
        );
      }
      return { at: at, end: end };
    }

    function localReceiptKeys(value, itemPath, maximum) {
      var keys = stringList(value || [], itemPath, { max: 240 });
      if (keys.length > maximum) {
        fail(
          "EPISODE_RECAP_RECEIPT_LIMIT",
          itemPath + " cannot contain more than " + maximum + " receipt keys.",
          itemPath
        );
      }
      keys.forEach(function (key, index) {
        if (!receiptMap.has(key)) {
          fail(
            "UNKNOWN_EPISODE_RECAP_RECEIPT",
            itemPath + "[" + index + "] is not local to this source.",
            itemPath + "[" + index + "]"
          );
        }
      });
      return keys;
    }

    function comparableExcerpt(value) {
      return clean(value, 600)
        .replace(
          /^[\s.\u2026\u00e2\u20ac\u00a6]+|[\s.\u2026\u00e2\u20ac\u00a6]+$/g,
          ""
        )
        .replace(/\s+/g, " ")
        .toLowerCase();
    }

    function guideCutId(value, itemPath) {
      var id = clean(value, 80);
      if (id && !guideCutMap.has(id)) {
        fail(
          "UNKNOWN_EPISODE_RECAP_GUIDE_CUT",
          itemPath + " is not in this source's Episode Guide.",
          itemPath
        );
      }
      return id;
    }

    function boundedLocalList(value, itemPath, maximum, known, code, noun) {
      var values = stringList(value || [], itemPath, { max: 180 });
      if (values.length > maximum) {
        fail(
          "EPISODE_RECAP_" + noun + "_LIMIT",
          itemPath + " cannot contain more than " + maximum + " values.",
          itemPath
        );
      }
      values.forEach(function (value, index) {
        if (!known.has(value)) {
          fail(
            code,
            itemPath + "[" + index + "] is not local to this source's Episode Guide.",
            itemPath + "[" + index + "]"
          );
        }
      });
      return values;
    }

    function evidenceLabel(value) {
      return clean(value, 180)
        .replace(
          /^(?:TOPIC|CHARACTER PERFORMANCE|CHARACTER|MOMENT)\s*:\s*/i,
          ""
        )
        .replace(/\s+/g, " ")
        .trim();
    }

    function naturalEvidenceLabel(value) {
      var text = evidenceLabel(value);
      if (!text || text !== text.toUpperCase()) return text;
      return text.toLowerCase().replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
      })
        .replace(/\bWwam\b/g, "WWAM")
        .replace(/\bA24\b/gi, "A24")
        .replace(/\bH20\b/gi, "H20")
        .replace(/\bTv\b/g, "TV")
        .replace(/\bVhs\b/g, "VHS");
    }

    function receiptProjectionLabel(receipt) {
      var identity = clean(receipt && receipt.kind).toLowerCase() + " " +
        clean(receipt && receipt.evidenceType).toLowerCase();
      if (identity.indexOf("character") >= 0) {
        var characterId = array(receipt && receipt.entityIds).find(function (id) {
          return clean(id).toLowerCase().indexOf("character:") === 0;
        });
        if (characterId) {
          var slug = clean(characterId).slice("character:".length).toLowerCase();
          var known = {
            "challis": "Dr. Challis",
            "corey-feldman": "Corey Feldman",
            "dr-challis": "Dr. Challis",
            "dr-loomis": "Dr. Loomis",
            "loomis": "Dr. Loomis",
            "slender-man": "Slenderman",
            "slenderman": "Slenderman",
          };
          if (known[slug]) return known[slug];
          return slug.split(/[-_]+/).filter(Boolean).map(function (part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
          }).join(" ");
        }
      }
      return naturalEvidenceLabel(receipt && receipt.label);
    }

    function sameWindow(actualAt, actualEnd, expected, itemPath, code) {
      if (Math.abs(actualAt - expected.at) > 0.001 ||
          Math.abs(actualEnd - expected.end) > 0.001) {
        fail(
          code,
          itemPath + " must inherit its timestamp window from local evidence.",
          itemPath
        );
      }
    }

    function uniqueStrings(values) {
      var output = [];
      array(values).map(function (value) {
        return clean(value, 180);
      }).filter(Boolean).forEach(function (value) {
        if (output.indexOf(value) < 0) output.push(value);
      });
      return output;
    }

    if (raw.topicMap != null && !Array.isArray(raw.topicMap)) {
      fail(
        "INVALID_EPISODE_RECAP_TOPIC_MAP",
        path + ".topicMap must be an array.",
        path + ".topicMap"
      );
    }
    var topicMap = array(raw.topicMap).map(function (item, index) {
      var itemPath = path + ".topicMap[" + index + "]";
      if (!isRecord(item)) {
        fail(
          "INVALID_EPISODE_RECAP_TOPIC_MAP_ITEM",
          itemPath + " must be an object.",
          itemPath
        );
      }
      var receiptKey = clean(item.receiptKey, 240);
      var cutId = clean(item.guideCutId, 80);
      if (receiptKey && !receiptMap.has(receiptKey)) {
        fail(
          "UNKNOWN_EPISODE_RECAP_TOPIC_RECEIPT",
          itemPath + ".receiptKey is not local to this source.",
          itemPath + ".receiptKey"
        );
      }
      if (cutId && !guideCutMap.has(cutId) && !guideThreadIds.has(cutId)) {
        fail(
          "UNKNOWN_EPISODE_RECAP_TOPIC_GUIDE_POINT",
          itemPath + ".guideCutId is not local to this source's Episode Guide.",
          itemPath + ".guideCutId"
        );
      }
      if (!receiptKey && !cutId) {
        fail(
          "EPISODE_RECAP_TOPIC_EVIDENCE_REQUIRED",
          itemPath + " must resolve to a local receipt or reviewed guide thread.",
          itemPath
        );
      }
      var window = boundedWindow(item, itemPath);
      var firstAt = finiteNumber(item.firstAt, itemPath + ".firstAt", 0);
      var peakAt = finiteNumber(item.peakAt, itemPath + ".peakAt", 0);
      if (firstAt > source.duration + 1 || peakAt > source.duration + 1) {
        fail(
          "EPISODE_RECAP_TOPIC_RUNTIME",
          itemPath + " timing metrics must stay inside the owning source runtime.",
          itemPath
        );
      }
      var mentions = finiteNumber(item.mentions, itemPath + ".mentions", 0);
      var cluster = finiteNumber(item.cluster, itemPath + ".cluster", 0);
      var rank = finiteNumber(item.rank, itemPath + ".rank", 0);
      var intensity = finiteNumber(item.intensity, itemPath + ".intensity", 0);
      var arrivalPercent = finiteNumber(
        item.arrivalPercent,
        itemPath + ".arrivalPercent",
        0
      );
      var peakPercent = finiteNumber(
        item.peakPercent,
        itemPath + ".peakPercent",
        0
      );
      if (intensity > 100 || arrivalPercent > 100 || peakPercent > 100) {
        fail(
          "EPISODE_RECAP_TOPIC_PERCENT",
          itemPath + " percentage metrics cannot exceed 100.",
          itemPath
        );
      }
      return {
        receiptKey: receiptKey,
        guideCutId: cutId,
        label: requiredText(item.label, itemPath + ".label", 180),
        at: window.at,
        end: window.end,
        mentions: mentions,
        firstAt: firstAt,
        peakAt: peakAt,
        cluster: cluster,
        rank: rank,
        intensity: intensity,
        arrivalPercent: arrivalPercent,
        peakPercent: peakPercent,
        metricBasis: clean(item.metricBasis, 240),
      };
    });
    var expectedTopicMap = topicMap.map(function (topic) {
      if (topic.receiptKey) {
        var receipt = receiptMap.get(topic.receiptKey);
        var mentions = receipt.topicMentions;
        if (mentions == null &&
            /topic-mention-count/i.test(clean(receipt.signalBasis))) {
          mentions = receipt.signalScore;
        }
        mentions = mentions == null ? 0 : Math.max(0, Math.round(mentions));
        var firstAt = receipt.topicFirstAt == null ?
          receipt.at : receipt.topicFirstAt;
        var peakAt = receipt.topicPeakAt == null ?
          receipt.at : receipt.topicPeakAt;
        var cluster = receipt.topicCluster == null ?
          0 : Math.max(0, Math.round(receipt.topicCluster));
        var metricBasis = clean(receipt.topicMetricBasis) ||
          (/topic-mention-count/i.test(clean(receipt.signalBasis)) ?
            "automatic-caption-topic-frequency-and-timing" : "");
        var matchingThread = array(episodeGuide && episodeGuide.threads).find(
          function (thread) {
            return clean(thread.name).toLowerCase() ===
              naturalEvidenceLabel(receipt.label).toLowerCase();
          }
        );
        if (matchingThread) {
          var receiptMentions = mentions;
          mentions = Math.max(mentions, Number(matchingThread.mentions || 0));
          firstAt = Math.min(firstAt, Number(matchingThread.first || 0));
          if (Number(matchingThread.mentions || 0) >= receiptMentions) {
            peakAt = Number(matchingThread.peak || 0);
          }
          metricBasis = metricBasis ||
            "reviewed-episode-guide-thread-frequency-and-timing";
        }
        return {
          receiptKey: topic.receiptKey,
          guideCutId: "",
          label: naturalEvidenceLabel(receipt.label),
          at: receipt.at,
          end: receipt.end,
          mentions: mentions,
          firstAt: firstAt,
          peakAt: peakAt,
          cluster: cluster,
          metricBasis: metricBasis,
        };
      }
      var thread = guideThreadById.get(topic.guideCutId);
      return {
        receiptKey: "",
        guideCutId: topic.guideCutId,
        label: naturalEvidenceLabel(thread && thread.name),
        at: Number(thread && thread.peak || 0),
        end: Math.min(
          Number(source.duration),
          Number(thread && thread.peak || 0) + 30
        ),
        mentions: Math.max(0, Math.round(Number(thread && thread.mentions || 0))),
        firstAt: Math.max(0, Number(thread && thread.first || 0)),
        peakAt: Math.max(0, Number(thread && thread.peak || 0)),
        cluster: Math.max(0, Math.round(Number(thread && thread.score || 0))),
        metricBasis: "reviewed-episode-guide-thread-frequency-and-timing",
      };
    });
    var strongestTopicMentions = expectedTopicMap.reduce(function (maximum, topic) {
      return Math.max(maximum, Number(topic.mentions || 0));
    }, 0);
    var expectedTopicOrder = expectedTopicMap.slice().sort(function (left, right) {
      return right.mentions - left.mentions ||
        right.cluster - left.cluster ||
        left.firstAt - right.firstAt ||
        left.label.localeCompare(right.label);
    });
    topicMap.forEach(function (topic, index) {
      var expected = expectedTopicMap[index];
      var expectedRanked = expectedTopicOrder[index];
      var expectedIntensity = strongestTopicMentions ?
        Math.max(
          4,
          Math.round(expected.mentions / strongestTopicMentions * 100)
        ) : 0;
      var expectedArrivalPercent = source.duration ?
        Math.max(0, Math.min(100, Math.round(expected.firstAt / source.duration * 100))) :
        0;
      var expectedPeakPercent = source.duration ?
        Math.max(0, Math.min(100, Math.round(expected.peakAt / source.duration * 100))) :
        0;
      var identityMatches =
        topic.receiptKey === expected.receiptKey &&
        topic.guideCutId === expected.guideCutId &&
        topic.label === expected.label &&
        topic.at === expected.at &&
        topic.mentions === expected.mentions &&
        topic.firstAt === expected.firstAt &&
        topic.peakAt === expected.peakAt &&
        topic.cluster === expected.cluster &&
        topic.metricBasis === expected.metricBasis;
      var windowMatches = topic.receiptKey ?
        topic.end <= expected.end + 0.001 && topic.end > topic.at :
        topic.end === expected.end;
      var rankMatches =
        topic.rank === index + 1 &&
        topic.receiptKey === expectedRanked.receiptKey &&
        topic.guideCutId === expectedRanked.guideCutId &&
        topic.intensity === expectedIntensity &&
        topic.arrivalPercent === expectedArrivalPercent &&
        topic.peakPercent === expectedPeakPercent;
      if (!identityMatches || !windowMatches || !rankMatches) {
        fail(
          "EPISODE_RECAP_TOPIC_MAP_DRIFT",
          path + ".topicMap[" + index +
            "] must project its local receipt or reviewed guide thread.",
          path + ".topicMap[" + index + "]"
        );
      }
    });
    if (state === "held" && topicMap.length) {
      fail(
        "HELD_EPISODE_RECAP_TOPIC_MAP_OVERREACH",
        path + ".topicMap must remain empty while the recap is held.",
        path + ".topicMap"
      );
    }

    if (!Array.isArray(raw.sections)) {
      fail("INVALID_EPISODE_RECAP_SECTIONS", path + ".sections must be an array.", path + ".sections");
    }
    if (state === "held" && raw.sections.length) {
      fail(
        "HELD_EPISODE_RECAP_SEMANTIC_OVERREACH",
        path + ".sections must remain empty while the recap is held.",
        path + ".sections"
      );
    }
    if (state === "ready" && (!raw.sections.length || raw.sections.length > 12)) {
      fail(
        "EPISODE_RECAP_SECTION_COUNT",
        path + ".sections must contain between one and twelve evidence-bound sections.",
        path + ".sections"
      );
    }
    var sectionIds = new Set();
    var sections = raw.sections.map(function (section, index) {
      var sectionPath = path + ".sections[" + index + "]";
      if (!isRecord(section)) {
        fail("INVALID_EPISODE_RECAP_SECTION", sectionPath + " must be an object.", sectionPath);
      }
      var id = requiredText(section.id, sectionPath + ".id", 80);
      if (!KEBAB_ID.test(id) || sectionIds.has(id)) {
        fail("INVALID_EPISODE_RECAP_SECTION_ID", sectionPath + ".id must be unique kebab-case.", sectionPath + ".id");
      }
      sectionIds.add(id);
      var window = boundedWindow(section, sectionPath);
      var receiptKeys = localReceiptKeys(
        section.receiptKeys,
        sectionPath + ".receiptKeys",
        32
      );
      var cutId = guideCutId(section.guideCutId, sectionPath + ".guideCutId");
      if (!receiptKeys.length && !cutId) {
        fail(
          "EPISODE_RECAP_SECTION_EVIDENCE_REQUIRED",
          sectionPath + " must resolve to a local receipt or guide cut.",
          sectionPath
        );
      }
      var excerpt = clean(section.excerpt, 600);
      if (excerpt && wordCount(excerpt) > 25) {
        fail(
          "EPISODE_RECAP_EXCERPT_TOO_LONG",
          sectionPath + ".excerpt exceeds 25 words.",
          sectionPath + ".excerpt"
        );
      }
      return {
        id: id,
        ordinal: finiteNumber(section.ordinal || index + 1, sectionPath + ".ordinal", 1),
        label: requiredText(section.label, sectionPath + ".label", 240),
        body: requiredText(section.body, sectionPath + ".body", 1000),
        at: window.at,
        end: window.end,
        anchor: clean(section.anchor, 180),
        category: clean(section.category, 100),
        excerpt: excerpt,
        receiptKeys: receiptKeys,
        guideCutId: cutId,
        evidenceBasis: requiredText(
          section.evidenceBasis,
          sectionPath + ".evidenceBasis",
          240
        ),
      };
    });
    for (var sectionIndex = 1; sectionIndex < sections.length; sectionIndex += 1) {
      if (sections[sectionIndex].at < sections[sectionIndex - 1].at) {
        fail(
          "EPISODE_RECAP_SECTION_ORDER",
          path + ".sections must remain chronological.",
          path + ".sections[" + sectionIndex + "]"
        );
      }
    }

    if (!Array.isArray(raw.story)) {
      fail(
        "INVALID_EPISODE_RECAP_STORY",
        path + ".story must be an array.",
        path + ".story"
      );
    }
    if (state === "held" && raw.story.length) {
      fail(
        "HELD_EPISODE_RECAP_STORY_OVERREACH",
        path + ".story must remain empty while the recap is held.",
        path + ".story"
      );
    }
    if (state === "ready" && receiptMap.size &&
        (!raw.story.length || raw.story.length > 12)) {
      fail(
        "EPISODE_RECAP_STORY_COUNT",
        path + ".story must contain between one and twelve evidence-bound reels.",
        path + ".story"
      );
    }
    var storyIds = new Set();
    var storyReceiptKeys = new Set();
    var story = raw.story.map(function (segment, index) {
      var segmentPath = path + ".story[" + index + "]";
      if (!isRecord(segment)) {
        fail(
          "INVALID_EPISODE_RECAP_STORY_SEGMENT",
          segmentPath + " must be an object.",
          segmentPath
        );
      }
      var id = requiredText(segment.id, segmentPath + ".id", 80);
      if (!KEBAB_ID.test(id) || storyIds.has(id)) {
        fail(
          "INVALID_EPISODE_RECAP_STORY_ID",
          segmentPath + ".id must be unique kebab-case.",
          segmentPath + ".id"
        );
      }
      storyIds.add(id);
      var window = boundedWindow(segment, segmentPath);
      var receiptKeys = localReceiptKeys(
        segment.receiptKeys,
        segmentPath + ".receiptKeys",
        12
      );
      if (!receiptKeys.length) {
        fail(
          "EPISODE_RECAP_STORY_EVIDENCE_REQUIRED",
          segmentPath + " must resolve to at least one local receipt.",
          segmentPath
        );
      }
      var anchorReceiptKey = requiredText(
        segment.anchorReceiptKey,
        segmentPath + ".anchorReceiptKey",
        240
      );
      if (receiptKeys.indexOf(anchorReceiptKey) < 0 ||
          !receiptMap.has(anchorReceiptKey)) {
        fail(
          "EPISODE_RECAP_STORY_ANCHOR_SCOPE",
          segmentPath + ".anchorReceiptKey must belong to this reel.",
          segmentPath + ".anchorReceiptKey"
        );
      }
      var anchorReceipt = receiptMap.get(anchorReceiptKey);
      var anchorAt = finiteNumber(
        segment.anchorAt,
        segmentPath + ".anchorAt",
        0
      );
      if (Math.abs(anchorReceipt.at - anchorAt) > 0.001 ||
          anchorAt < window.at - 0.001 ||
          anchorAt > window.end + 0.001) {
        fail(
          "EPISODE_RECAP_STORY_ANCHOR_TIME",
          segmentPath + ".anchorAt must match its local anchor receipt inside the reel.",
          segmentPath + ".anchorAt"
        );
      }
      receiptKeys.forEach(function (key) { storyReceiptKeys.add(key); });
      var excerpt = clean(segment.excerpt, 600);
      if (excerpt && wordCount(excerpt) > 25) {
        fail(
          "EPISODE_RECAP_STORY_EXCERPT_TOO_LONG",
          segmentPath + ".excerpt exceeds 25 words.",
          segmentPath + ".excerpt"
        );
      }
      if (excerpt && (
        !anchorReceipt.publicExcerptAllowed ||
        !comparableExcerpt(anchorReceipt.excerpt) ||
        comparableExcerpt(anchorReceipt.excerpt).indexOf(
          comparableExcerpt(excerpt)
        ) !== 0
      )) {
        fail(
          "EPISODE_RECAP_STORY_ANCHOR_EXCERPT",
          segmentPath + ".excerpt must come from its public anchor receipt.",
          segmentPath + ".excerpt"
        );
      }
      var topicLabels = stringList(
        segment.topicLabels || [],
        segmentPath + ".topicLabels",
        { max: 180 }
      );
      var momentLabels = stringList(
        segment.momentLabels || [],
        segmentPath + ".momentLabels",
        { max: 180 }
      );
      var characterLabels = stringList(
        segment.characterLabels || [],
        segmentPath + ".characterLabels",
        { max: 180 }
      );
      var localGuideCutIds = boundedLocalList(
        segment.guideCutIds,
        segmentPath + ".guideCutIds",
        20,
        new Set(guideCutMap.keys()),
        "UNKNOWN_EPISODE_RECAP_STORY_GUIDE_CUT",
        "STORY_GUIDE_CUT"
      );
      localGuideCutIds.forEach(function (cutId, cutIndex) {
        var cut = guideCutMap.get(cutId);
        if (cut.at < window.at - 0.001 || cut.end > window.end + 0.001) {
          fail(
            "EPISODE_RECAP_STORY_GUIDE_CUT_WINDOW",
            segmentPath + ".guideCutIds[" + cutIndex +
              "] falls outside this reel.",
            segmentPath + ".guideCutIds[" + cutIndex + "]"
          );
        }
      });
      var localGuideChapterIds = boundedLocalList(
        segment.guideChapterIds,
        segmentPath + ".guideChapterIds",
        8,
        new Set(guideChapterMap.keys()),
        "UNKNOWN_EPISODE_RECAP_STORY_GUIDE_CHAPTER",
        "STORY_GUIDE_CHAPTER"
      );
      localGuideChapterIds.forEach(function (chapterId, chapterIndex) {
        var chapter = guideChapterMap.get(chapterId);
        if (localGuideCutIds.indexOf(chapter.cutId) < 0) {
          fail(
            "EPISODE_RECAP_STORY_GUIDE_CHAPTER_SCOPE",
            segmentPath + ".guideChapterIds[" + chapterIndex +
              "] does not belong to a guide cut in this reel.",
            segmentPath + ".guideChapterIds[" + chapterIndex + "]"
          );
        }
      });
      var localThreadLabels = boundedLocalList(
        segment.threadLabels,
        segmentPath + ".threadLabels",
        10,
        guideThreadNames,
        "UNKNOWN_EPISODE_RECAP_STORY_THREAD",
        "STORY_THREAD"
      );
      var guideAnchor = null;
      if (segment.guideAnchor != null) {
        var guideAnchorPath = segmentPath + ".guideAnchor";
        if (!isRecord(segment.guideAnchor)) {
          fail(
            "INVALID_EPISODE_RECAP_STORY_GUIDE_ANCHOR",
            guideAnchorPath + " must be an object or null.",
            guideAnchorPath
          );
        }
        if (Object.keys(segment.guideAnchor).length) {
          var anchorCutId = requiredText(
            segment.guideAnchor.id,
            guideAnchorPath + ".id",
            80
          );
          var anchorCut = guideCutMap.get(anchorCutId);
          if (!anchorCut || localGuideCutIds.indexOf(anchorCutId) < 0) {
            fail(
              "EPISODE_RECAP_STORY_GUIDE_ANCHOR_SCOPE",
              guideAnchorPath + ".id must belong to a local guide cut in this reel.",
              guideAnchorPath + ".id"
            );
          }
          var guideAt = finiteNumber(
            segment.guideAnchor.at,
            guideAnchorPath + ".at",
            0
          );
          var guideEnd = finiteNumber(
            segment.guideAnchor.end,
            guideAnchorPath + ".end",
            0
          );
          sameWindow(
            guideAt,
            guideEnd,
            anchorCut,
            guideAnchorPath,
            "EPISODE_RECAP_STORY_GUIDE_ANCHOR_WINDOW"
          );
          var guideTopic = requiredText(
            segment.guideAnchor.topic,
            guideAnchorPath + ".topic",
            180
          );
          var guideCategory = requiredText(
            segment.guideAnchor.category,
            guideAnchorPath + ".category",
            100
          );
          if (guideTopic !== anchorCut.topic ||
              guideCategory !== anchorCut.category) {
            fail(
              "EPISODE_RECAP_STORY_GUIDE_ANCHOR_LABEL",
              guideAnchorPath + " must inherit topic and category from its guide cut.",
              guideAnchorPath
            );
          }
          var guideExcerpt = requiredText(
            segment.guideAnchor.excerpt,
            guideAnchorPath + ".excerpt",
            600
          );
          var projectedExcerpt = comparableExcerpt(guideExcerpt);
          var canonicalExcerpt = comparableExcerpt(anchorCut.excerpt);
          if (!projectedExcerpt ||
              canonicalExcerpt.indexOf(projectedExcerpt) !== 0 ||
              wordCount(projectedExcerpt) <
                Math.min(18, wordCount(canonicalExcerpt))) {
            fail(
              "EPISODE_RECAP_STORY_GUIDE_ANCHOR_EXCERPT",
              guideAnchorPath + ".excerpt must project its local guide cut.",
              guideAnchorPath + ".excerpt"
            );
          }
          var anchorChapter = guideChapterByCutId.get(anchorCutId) || null;
          var anchorChapterId = clean(
            segment.guideAnchor.chapterId,
            80
          );
          var expectedChapterId = anchorChapter ? anchorChapter.id : "";
          if (anchorChapterId !== expectedChapterId ||
              anchorChapterId &&
                localGuideChapterIds.indexOf(anchorChapterId) < 0) {
            fail(
              "EPISODE_RECAP_STORY_GUIDE_ANCHOR_CHAPTER",
              guideAnchorPath + ".chapterId must project this guide cut's chapter.",
              guideAnchorPath + ".chapterId"
            );
          }
          var expectedBasis = clean(anchorCut.evidenceBasis, 180) ||
            clean(anchorChapter && anchorChapter.evidenceBasis, 180) ||
            "reviewed-episode-guide-timestamp";
          var anchorBasis = requiredText(
            segment.guideAnchor.evidenceBasis,
            guideAnchorPath + ".evidenceBasis",
            240
          );
          if (anchorBasis !== expectedBasis) {
            fail(
              "EPISODE_RECAP_STORY_GUIDE_ANCHOR_BASIS",
              guideAnchorPath + ".evidenceBasis must project its guide cut.",
              guideAnchorPath + ".evidenceBasis"
            );
          }
          guideAnchor = {
            id: anchorCut.id,
            at: anchorCut.at,
            end: anchorCut.end,
            topic: anchorCut.topic,
            category: anchorCut.category,
            excerpt: guideExcerpt,
            chapterId: anchorChapterId,
            evidenceBasis: anchorBasis
          };
        }
      }
      function normalizeStoryReceiptEvidence(item, itemPath, expectedKind) {
        if (!isRecord(item)) {
          fail(
            "INVALID_EPISODE_RECAP_STORY_EVIDENCE",
            itemPath + " must be an object.",
            itemPath
          );
        }
        var key = requiredText(item.receiptKey, itemPath + ".receiptKey", 240);
        var receipt = receiptMap.get(key);
        if (!receipt || receiptKeys.indexOf(key) < 0) {
          fail(
            "UNKNOWN_EPISODE_RECAP_STORY_EVIDENCE",
            itemPath + ".receiptKey must belong to this reel.",
            itemPath + ".receiptKey"
          );
        }
        var identity = clean(receipt.kind).toLowerCase() + " " +
          clean(receipt.evidenceType).toLowerCase();
        if (expectedKind === "topic" && identity.indexOf("topic") < 0 ||
            expectedKind === "moment" && identity.indexOf("topic") >= 0) {
          fail(
            "EPISODE_RECAP_STORY_EVIDENCE_KIND",
            itemPath + " does not match its registered receipt kind.",
            itemPath
          );
        }
        var evidenceWindow = boundedWindow(item, itemPath);
        if (Math.abs(evidenceWindow.at - receipt.at) > 0.001 ||
            evidenceWindow.end > receipt.end + 0.001) {
          fail(
            "EPISODE_RECAP_STORY_EVIDENCE_WINDOW",
            itemPath + " must stay inside its local receipt window.",
            itemPath
          );
        }
        var evidenceExcerpt = clean(item.excerpt, 600);
        if (evidenceExcerpt && (
          !receipt.publicExcerptAllowed ||
          comparableExcerpt(receipt.excerpt).indexOf(
            comparableExcerpt(evidenceExcerpt)
          ) !== 0
        )) {
          fail(
            "EPISODE_RECAP_STORY_EVIDENCE_EXCERPT",
            itemPath + ".excerpt must come from its local receipt.",
            itemPath + ".excerpt"
          );
        }
        return {
          receiptKey: key,
          at: evidenceWindow.at,
          end: evidenceWindow.end,
          label: requiredText(item.label, itemPath + ".label", 180),
          excerpt: evidenceExcerpt,
          signalScore: finiteNumber(
            item.signalScore == null ? 0 : item.signalScore,
            itemPath + ".signalScore",
            0
          ),
          evidenceBasis: clean(item.evidenceBasis, 240),
        };
      }
      var topicEvidence = array(segment.topicEvidence).map(function (item, evidenceIndex) {
        var itemPath = segmentPath + ".topicEvidence[" + evidenceIndex + "]";
        var evidence = normalizeStoryReceiptEvidence(item, itemPath, "topic");
        evidence.mentions = finiteNumber(
          item.mentions,
          itemPath + ".mentions",
          0
        );
        evidence.firstAt = finiteNumber(
          item.firstAt,
          itemPath + ".firstAt",
          0
        );
        evidence.peakAt = finiteNumber(
          item.peakAt,
          itemPath + ".peakAt",
          0
        );
        evidence.metricBasis = clean(item.metricBasis, 240);
        return evidence;
      });
      var momentEvidence = array(segment.momentEvidence).map(
        function (item, evidenceIndex) {
          return normalizeStoryReceiptEvidence(
            item,
            segmentPath + ".momentEvidence[" + evidenceIndex + "]",
            "moment"
          );
        }
      );
      var evidenceTrail = array(segment.evidenceTrail).map(function (item, evidenceIndex) {
        var itemPath = segmentPath + ".evidenceTrail[" + evidenceIndex + "]";
        if (!isRecord(item)) {
          fail(
            "INVALID_EPISODE_RECAP_STORY_TRAIL",
            itemPath + " must be an object.",
            itemPath
          );
        }
        var trailReceiptKey = clean(item.receiptKey, 240);
        var trailCutId = clean(item.guideCutId, 80);
        var trailWindow = boundedWindow(item, itemPath);
        var trailReceipt = trailReceiptKey ? receiptMap.get(trailReceiptKey) : null;
        var trailCut = trailCutId ? guideCutMap.get(trailCutId) : null;
        if (trailReceipt && receiptKeys.indexOf(trailReceiptKey) >= 0) {
          if (Math.abs(trailWindow.at - trailReceipt.at) > 0.001 ||
              trailWindow.end > trailReceipt.end + 0.001) {
            fail(
              "EPISODE_RECAP_STORY_TRAIL_WINDOW",
              itemPath + " must stay inside its local receipt window.",
              itemPath
            );
          }
        } else if (trailCut && localGuideCutIds.indexOf(trailCutId) >= 0) {
          sameWindow(
            trailWindow.at,
            trailWindow.end,
            trailCut,
            itemPath,
            "EPISODE_RECAP_STORY_TRAIL_WINDOW"
          );
        } else {
          fail(
            "UNKNOWN_EPISODE_RECAP_STORY_TRAIL",
            itemPath + " must belong to this reel's local evidence.",
            itemPath
          );
        }
        var trailExcerpt = clean(item.excerpt, 600);
        var trailLabel = requiredText(item.label, itemPath + ".label", 180);
        var trailSignal = finiteNumber(
          item.signalScore,
          itemPath + ".signalScore",
          0
        );
        var trailBasis = requiredText(
          item.evidenceBasis,
          itemPath + ".evidenceBasis",
          240
        );
        var expectedTrailLabel = trailReceipt ?
          receiptProjectionLabel(trailReceipt) :
          naturalEvidenceLabel(trailCut.topic || trailCut.category);
        var expectedTrailSignal = Number(
          trailReceipt ? trailReceipt.signalScore || 0 : trailCut.score || 0
        );
        var expectedTrailBasis = trailReceipt ?
          clean(trailReceipt.evidenceBasis) ||
            clean(trailReceipt.evidenceType) || "source-local-receipt" :
          clean(trailCut.evidenceBasis) ||
            "reviewed-episode-guide-timestamp";
        var trailExcerptMatches = trailReceipt ?
          !trailExcerpt || (
            trailReceipt.publicExcerptAllowed &&
            comparableExcerpt(trailReceipt.excerpt).indexOf(
              comparableExcerpt(trailExcerpt)
            ) === 0
          ) :
          comparableExcerpt(trailCut.excerpt).indexOf(
            comparableExcerpt(trailExcerpt)
          ) === 0;
        if (trailLabel !== expectedTrailLabel ||
            trailSignal !== expectedTrailSignal ||
            trailBasis !== expectedTrailBasis ||
            !trailExcerptMatches) {
          fail(
            "EPISODE_RECAP_STORY_TRAIL_DRIFT",
            itemPath + " must project its local evidence without drift.",
            itemPath
          );
        }
        return {
          receiptKey: trailReceiptKey,
          guideCutId: trailCutId,
          at: trailWindow.at,
          end: trailWindow.end,
          label: trailLabel,
          excerpt: trailExcerpt,
          signalScore: trailSignal,
          evidenceBasis: trailBasis,
        };
      });
      var normalizedSegment = {
        id: id,
        ordinal: finiteNumber(segment.ordinal || index + 1, segmentPath + ".ordinal", 1),
        label: requiredText(segment.label, segmentPath + ".label", 240),
        body: requiredText(segment.body, segmentPath + ".body", 1400),
        at: window.at,
        end: window.end,
        anchorReceiptKey: anchorReceiptKey,
        anchorAt: anchorAt,
        anchor: clean(segment.anchor, 180),
        primarySubject: requiredText(
          segment.primarySubject,
          segmentPath + ".primarySubject",
          180
        ),
        excerpt: excerpt,
        topicLabels: topicLabels,
        topicEvidence: topicEvidence,
        momentLabels: momentLabels,
        momentEvidence: momentEvidence,
        evidenceTrail: evidenceTrail,
        characterLabels: characterLabels,
        threadLabels: localThreadLabels,
        receiptKeys: receiptKeys,
        guideCutIds: localGuideCutIds,
        guideChapterIds: localGuideChapterIds,
        guideAnchor: guideAnchor,
        evidenceBasis: requiredText(
          segment.evidenceBasis,
          segmentPath + ".evidenceBasis",
          240
        ),
      };
      var narrativePath = segmentPath + ".narrative";
      if (!isRecord(segment.narrative)) {
        fail(
          "INVALID_EPISODE_RECAP_STORY_NARRATIVE",
          narrativePath + " must be a source-bound narrative beat.",
          narrativePath
        );
      }
      var narrativeSchema = requiredText(
        segment.narrative.schema,
        narrativePath + ".schema",
        80
      );
      if (narrativeSchema !== "shokker-recap-narrative-beat/v1") {
        fail(
          "INVALID_EPISODE_RECAP_STORY_NARRATIVE_SCHEMA",
          narrativePath + ".schema is unsupported.",
          narrativePath + ".schema"
        );
      }
      var narrativeKind = requiredText(
        segment.narrative.kind,
        narrativePath + ".kind",
        80
      );
      if ([
        "opening-board",
        "last-reel",
        "returning-thread",
        "character-break-in",
        "chaos-spike",
        "topic-sweep",
        "hard-left"
      ].indexOf(narrativeKind) < 0) {
        fail(
          "INVALID_EPISODE_RECAP_STORY_NARRATIVE_KIND",
          narrativePath + ".kind is unsupported.",
          narrativePath + ".kind"
        );
      }
      var primarySubject = requiredText(
        segment.narrative.primarySubject,
        narrativePath + ".primarySubject",
        180
      );
      var expectedPrimarySubject = normalizedSegment.primarySubject;
      if (primarySubject !== expectedPrimarySubject) {
        fail(
          "EPISODE_RECAP_STORY_NARRATIVE_SUBJECT",
          narrativePath + ".primarySubject must come from this reel's local evidence.",
          narrativePath + ".primarySubject"
        );
      }
      if (normalizedSegment.primarySubject !== primarySubject) {
        fail(
          "EPISODE_RECAP_STORY_PRIMARY_SUBJECT_DRIFT",
          segmentPath + ".primarySubject must match its narrative subject.",
          segmentPath + ".primarySubject"
        );
      }
      var allSubjects = uniqueStrings(
        [primarySubject].concat(
          topicLabels,
          characterLabels,
          momentLabels
        )
      );
      var secondarySubjects = stringList(
        segment.narrative.secondarySubjects || [],
        narrativePath + ".secondarySubjects",
        { max: 180 }
      );
      if (secondarySubjects.length > 5 ||
          stableJson(secondarySubjects) !== stableJson(
            allSubjects.filter(function (subject) {
              return subject.toLowerCase() !== primarySubject.toLowerCase();
            }).slice(0, 5)
          )) {
        fail(
          "EPISODE_RECAP_STORY_NARRATIVE_SECONDARY",
          narrativePath + ".secondarySubjects must project this reel's named evidence.",
          narrativePath + ".secondarySubjects"
        );
      }
      var recurringSubjects = stringList(
        segment.narrative.recurringSubjects || [],
        narrativePath + ".recurringSubjects",
        { max: 180 }
      );
      if (recurringSubjects.length > 4 ||
          recurringSubjects.some(function (subject) {
            return allSubjects.indexOf(subject) < 0;
          })) {
        fail(
          "EPISODE_RECAP_STORY_NARRATIVE_RECURRING",
          narrativePath + ".recurringSubjects must stay inside this reel.",
          narrativePath + ".recurringSubjects"
        );
      }
      if (typeof segment.narrative.anchorSupportsPrimary !== "boolean") {
        fail(
          "INVALID_EPISODE_RECAP_STORY_ANCHOR_RELATION",
          narrativePath + ".anchorSupportsPrimary must be boolean.",
          narrativePath + ".anchorSupportsPrimary"
        );
      }
      var anchorSupportsPrimary =
        segment.narrative.anchorSupportsPrimary === true;
      var anchorSubject = requiredText(
        segment.narrative.anchorSubject,
        narrativePath + ".anchorSubject",
        180
      );
      var expectedAnchorSubject = evidenceLabel(
        guideAnchor ?
          guideAnchor.topic || guideAnchor.category :
          normalizedSegment.anchor
      );
      if (anchorSubject !== expectedAnchorSubject) {
        fail(
          "EPISODE_RECAP_STORY_ANCHOR_SUBJECT",
          narrativePath + ".anchorSubject must project this reel's anchor.",
          narrativePath + ".anchorSubject"
        );
      }
      var anchorRelation = requiredText(
        segment.narrative.anchorRelation,
        narrativePath + ".anchorRelation",
        80
      );
      var expectedAnchorRelation = anchorSupportsPrimary ?
        "direct-subject-anchor" : "separate-saved-spike";
      if (anchorRelation !== expectedAnchorRelation) {
        fail(
          "EPISODE_RECAP_STORY_ANCHOR_RELATION",
          narrativePath +
            ".anchorRelation must match anchorSupportsPrimary.",
          narrativePath + ".anchorRelation"
        );
      }
      var primaryEvidencePath = narrativePath + ".primaryEvidence";
      if (!isRecord(segment.narrative.primaryEvidence)) {
        fail(
          "INVALID_EPISODE_RECAP_STORY_PRIMARY_EVIDENCE",
          primaryEvidencePath + " must be an object.",
          primaryEvidencePath
        );
      }
      var primaryEvidenceKind = requiredText(
        segment.narrative.primaryEvidence.kind,
        primaryEvidencePath + ".kind",
        40
      );
      var primaryEvidenceKey = requiredText(
        segment.narrative.primaryEvidence.key,
        primaryEvidencePath + ".key",
        240
      );
      var primaryEvidenceAt = finiteNumber(
        segment.narrative.primaryEvidence.at,
        primaryEvidencePath + ".at",
        0
      );
      var primaryEvidenceEnd = finiteNumber(
        segment.narrative.primaryEvidence.end,
        primaryEvidencePath + ".end",
        0
      );
      var primaryEvidenceLabel = requiredText(
        segment.narrative.primaryEvidence.label,
        primaryEvidencePath + ".label",
        180
      );
      if (primaryEvidenceKind === "guide-cut") {
        var primaryCut = guideCutMap.get(primaryEvidenceKey);
        if (!guideAnchor || primaryEvidenceKey !== guideAnchor.id ||
            localGuideCutIds.indexOf(primaryEvidenceKey) < 0 || !primaryCut) {
          fail(
            "EPISODE_RECAP_STORY_PRIMARY_GUIDE_SCOPE",
            primaryEvidencePath + " must belong to this reel's guide anchor.",
            primaryEvidencePath
          );
        }
        sameWindow(
          primaryEvidenceAt,
          primaryEvidenceEnd,
          primaryCut,
          primaryEvidencePath,
          "EPISODE_RECAP_STORY_PRIMARY_GUIDE_WINDOW"
        );
        if (primaryEvidenceLabel !== anchorSubject) {
          fail(
            "EPISODE_RECAP_STORY_PRIMARY_GUIDE_LABEL",
            primaryEvidencePath + ".label must project its guide cut.",
            primaryEvidencePath + ".label"
          );
        }
      } else if (primaryEvidenceKind === "receipt") {
        var primaryReceipt = receiptMap.get(primaryEvidenceKey);
        if (!primaryReceipt ||
            localGuideCutIds.length && guideAnchor ||
            receiptKeys.indexOf(primaryEvidenceKey) < 0 ||
            primaryEvidenceKey !== anchorReceiptKey) {
          fail(
            "EPISODE_RECAP_STORY_PRIMARY_RECEIPT_SCOPE",
            primaryEvidencePath + " must belong to this reel's anchor receipt.",
            primaryEvidencePath
          );
        }
        if (Math.abs(primaryEvidenceAt - primaryReceipt.at) > 0.001 ||
            primaryEvidenceEnd <= primaryEvidenceAt ||
            primaryEvidenceEnd > primaryReceipt.end + 0.001) {
          fail(
            "EPISODE_RECAP_STORY_PRIMARY_RECEIPT_WINDOW",
            primaryEvidencePath +
              " must remain inside its local receipt window.",
            primaryEvidencePath
          );
        }
        if (primaryEvidenceLabel !== anchorSubject) {
          fail(
            "EPISODE_RECAP_STORY_PRIMARY_RECEIPT_LABEL",
            primaryEvidencePath + ".label must project its anchor receipt.",
            primaryEvidencePath + ".label"
          );
        }
      } else {
        fail(
          "INVALID_EPISODE_RECAP_STORY_PRIMARY_EVIDENCE_KIND",
          primaryEvidencePath + ".kind is unsupported.",
          primaryEvidencePath + ".kind"
        );
      }
      var shapePath = narrativePath + ".evidenceShape";
      if (!isRecord(segment.narrative.evidenceShape)) {
        fail(
          "INVALID_EPISODE_RECAP_STORY_EVIDENCE_SHAPE",
          shapePath + " must be an object.",
          shapePath
        );
      }
      var expectedShape = {
        receipts: receiptKeys.length,
        guideCuts: localGuideCutIds.length,
        guideChapters: localGuideChapterIds.length,
        topics: topicLabels.length,
        moments: momentLabels.length,
        characters: characterLabels.length,
        namedSubjects: allSubjects.length
      };
      Object.keys(expectedShape).forEach(function (key) {
        var shapeValue = finiteNumber(
          segment.narrative.evidenceShape[key],
          shapePath + "." + key,
          0
        );
        if (!Number.isInteger(shapeValue) || shapeValue !== expectedShape[key]) {
          fail(
            "EPISODE_RECAP_STORY_EVIDENCE_SHAPE_MISMATCH",
            shapePath + "." + key + " must match this reel's local evidence.",
            shapePath + "." + key
          );
        }
      });
      normalizedSegment.narrative = {
        schema: narrativeSchema,
        kind: narrativeKind,
        primarySubject: primarySubject,
        secondarySubjects: secondarySubjects,
        previousSubject: clean(
          segment.narrative.previousSubject,
          180
        ),
        nextSubject: clean(segment.narrative.nextSubject, 180),
        recurringSubjects: recurringSubjects,
        anchorSupportsPrimary: anchorSupportsPrimary,
        anchorSubject: anchorSubject,
        anchorRelation: anchorRelation,
        primaryEvidence: {
          kind: primaryEvidenceKind,
          key: primaryEvidenceKey,
          at: primaryEvidenceAt,
          end: primaryEvidenceEnd,
          label: primaryEvidenceLabel
        },
        evidenceShape: expectedShape
      };
      return normalizedSegment;
    });
    for (var storyIndex = 1; storyIndex < story.length; storyIndex += 1) {
      if (story[storyIndex].at < story[storyIndex - 1].at) {
        fail(
          "EPISODE_RECAP_STORY_ORDER",
          path + ".story must remain chronological.",
          path + ".story[" + storyIndex + "]"
        );
      }
    }
    var narrativeSubjectPositions = {};
    story.forEach(function (segment, index) {
      uniqueStrings(
        [segment.narrative.primarySubject]
          .concat(segment.topicLabels, segment.characterLabels)
      ).forEach(function (subject) {
        var key = subject.toLowerCase();
        if (!narrativeSubjectPositions[key]) {
          narrativeSubjectPositions[key] = [];
        }
        narrativeSubjectPositions[key].push(index);
      });
    });
    story.forEach(function (segment, index) {
      var narrativePath = path + ".story[" + index + "].narrative";
      var narrative = segment.narrative;
      var expectedPrevious = index ?
        story[index - 1].narrative.primarySubject : "";
      var expectedNext = index + 1 < story.length ?
        story[index + 1].narrative.primarySubject : "";
      if (narrative.previousSubject !== expectedPrevious ||
          narrative.nextSubject !== expectedNext) {
        fail(
          "EPISODE_RECAP_STORY_NARRATIVE_TRANSITION",
          narrativePath + " must point to the adjacent source-local reels.",
          narrativePath
        );
      }
      var subjects = uniqueStrings(
        [narrative.primarySubject].concat(
          segment.topicLabels,
          segment.characterLabels,
          segment.momentLabels
        )
      );
      var expectedRecurring = subjects.filter(function (subject) {
        return array(
          narrativeSubjectPositions[subject.toLowerCase()]
        ).length > 1;
      }).slice(0, 4);
      if (stableJson(narrative.recurringSubjects) !==
          stableJson(expectedRecurring)) {
        fail(
          "EPISODE_RECAP_STORY_NARRATIVE_RECURRING",
          narrativePath +
            ".recurringSubjects must match repeated source-local subjects.",
          narrativePath + ".recurringSubjects"
        );
      }
      var counts = narrative.evidenceShape;
      var expectedKind = index === 0 ? "opening-board" :
        index === story.length - 1 ? "last-reel" :
          expectedRecurring.length ? "returning-thread" :
            counts.characters ? "character-break-in" :
              counts.moments > counts.topics ? "chaos-spike" :
                counts.topics >= 3 ? "topic-sweep" :
                  "hard-left";
      if (narrative.kind !== expectedKind) {
        fail(
          "EPISODE_RECAP_STORY_NARRATIVE_KIND_MISMATCH",
          narrativePath + ".kind must match this reel's evidence shape.",
          narrativePath + ".kind"
        );
      }
    });
    if (state === "ready" && receiptMap.size &&
        (storyReceiptKeys.size !== receiptMap.size ||
          Array.from(receiptMap.keys()).some(function (key) {
            return !storyReceiptKeys.has(key);
          }))) {
      fail(
        "EPISODE_RECAP_STORY_COVERAGE",
        path + ".story must account for every registered receipt exactly by source-local key.",
        path + ".story"
      );
    }

    var fanRead = {};
    ["loved", "hated", "wildestDetour", "lastWord"].forEach(function (key) {
      var item = raw.fanRead && raw.fanRead[key];
      if (item == null) return;
      var itemPath = path + ".fanRead." + key;
      if (!isRecord(item)) {
        fail("INVALID_EPISODE_RECAP_FAN_READ", itemPath + " must be an object.", itemPath);
      }
      var window = boundedWindow(item, itemPath);
      var receiptKey = clean(item.receiptKey, 240);
      if (receiptKey && !receiptMap.has(receiptKey)) {
        fail(
          "UNKNOWN_EPISODE_RECAP_FAN_RECEIPT",
          itemPath + ".receiptKey is not local to this source.",
          itemPath + ".receiptKey"
        );
      }
      var cutId = guideCutId(item.guideCutId, itemPath + ".guideCutId");
      if (!receiptKey && !cutId) {
        fail(
          "EPISODE_RECAP_FAN_EVIDENCE_REQUIRED",
          itemPath + " must resolve to a local receipt or guide cut.",
          itemPath
        );
      }
      var excerpt = clean(item.excerpt, 600);
      if (excerpt && wordCount(excerpt) > 25) {
        fail(
          "EPISODE_RECAP_FAN_EXCERPT_TOO_LONG",
          itemPath + ".excerpt exceeds 25 words.",
          itemPath + ".excerpt"
        );
      }
      fanRead[key] = {
        label: requiredText(item.label, itemPath + ".label", 180),
        topic: clean(item.topic, 180),
        body: requiredText(item.body, itemPath + ".body", 700),
        at: window.at,
        end: window.end,
        receiptKey: receiptKey,
        guideCutId: cutId,
        excerpt: excerpt,
        evidenceBasis: requiredText(item.evidenceBasis, itemPath + ".evidenceBasis", 240),
      };
    });

    var bestMoments = array(raw.bestMoments).map(function (item, index) {
      var itemPath = path + ".bestMoments[" + index + "]";
      if (!isRecord(item)) {
        fail("INVALID_EPISODE_RECAP_MOMENT", itemPath + " must be an object.", itemPath);
      }
      var receiptKey = requiredText(item.receiptKey, itemPath + ".receiptKey", 240);
      if (!receiptMap.has(receiptKey)) {
        fail(
          "UNKNOWN_EPISODE_RECAP_MOMENT",
          itemPath + ".receiptKey is not local to this source.",
          itemPath + ".receiptKey"
        );
      }
      var window = boundedWindow(item, itemPath);
      return {
        receiptKey: receiptKey,
        at: window.at,
        end: window.end,
        label: requiredText(item.label, itemPath + ".label", 180),
        excerpt: clean(item.excerpt, 600),
        signalScore: finiteNumber(
          item.signalScore,
          itemPath + ".signalScore",
          0
        ),
        evidenceBasis: requiredText(item.evidenceBasis, itemPath + ".evidenceBasis", 240),
      };
    });
    if (state === "held" && bestMoments.length) {
      fail(
        "HELD_EPISODE_RECAP_MOMENT_OVERREACH",
        path + ".bestMoments must remain empty while the recap is held.",
        path + ".bestMoments"
      );
    }

    if (raw.highlightRunway != null && !Array.isArray(raw.highlightRunway)) {
      fail(
        "INVALID_EPISODE_RECAP_HIGHLIGHT_RUNWAY",
        path + ".highlightRunway must be an array.",
        path + ".highlightRunway"
      );
    }
    var highlightEvidenceKeys = new Set();
    var highlightRunway = array(raw.highlightRunway).map(function (item, index) {
      var itemPath = path + ".highlightRunway[" + index + "]";
      if (!isRecord(item)) {
        fail(
          "INVALID_EPISODE_RECAP_HIGHLIGHT",
          itemPath + " must be an object.",
          itemPath
        );
      }
      var receiptKey = clean(item.receiptKey, 240);
      var cutId = clean(item.guideCutId, 80);
      var localEvidence = receiptKey ? receiptMap.get(receiptKey) :
        cutId ? guideCutMap.get(cutId) : null;
      if (!localEvidence) {
        fail(
          "UNKNOWN_EPISODE_RECAP_HIGHLIGHT",
          itemPath + " must resolve to a local receipt or reviewed guide cut.",
          itemPath
        );
      }
      var evidenceKey = receiptKey ? "receipt:" + receiptKey : "guide:" + cutId;
      if (highlightEvidenceKeys.has(evidenceKey)) {
        fail(
          "DUPLICATE_EPISODE_RECAP_HIGHLIGHT",
          itemPath + " repeats a highlight already on this runway.",
          itemPath
        );
      }
      highlightEvidenceKeys.add(evidenceKey);
      var window = boundedWindow(item, itemPath);
      var windowMatchesEvidence = receiptKey ?
        Math.abs(window.at - localEvidence.at) <= 0.001 &&
          window.end <= localEvidence.end + 0.001 :
        Math.abs(window.at - localEvidence.at) <= 0.001 &&
          Math.abs(window.end - localEvidence.end) <= 0.001;
      if (!windowMatchesEvidence) {
        fail(
          "EPISODE_RECAP_HIGHLIGHT_WINDOW",
          itemPath + " must inherit a bounded timestamp window from local evidence.",
          itemPath
        );
      }
      var ordinal = finiteNumber(item.ordinal || index + 1, itemPath + ".ordinal", 1);
      if (!Number.isInteger(ordinal) || ordinal !== index + 1) {
        fail(
          "EPISODE_RECAP_HIGHLIGHT_ORDINAL",
          itemPath + ".ordinal must match its chronological runway position.",
          itemPath + ".ordinal"
        );
      }
      var excerpt = clean(item.excerpt, 600);
      if (excerpt && wordCount(excerpt) > 25) {
        fail(
          "EPISODE_RECAP_HIGHLIGHT_EXCERPT_TOO_LONG",
          itemPath + ".excerpt exceeds 25 words.",
          itemPath + ".excerpt"
        );
      }
      var projectedKind = requiredText(item.kind, itemPath + ".kind", 80);
      var projectedLabel = requiredText(item.label, itemPath + ".label", 180);
      var projectedSignal = finiteNumber(
        item.signalScore,
        itemPath + ".signalScore",
        0
      );
      var projectedBasis = requiredText(
        item.evidenceBasis,
        itemPath + ".evidenceBasis",
        240
      );
      var expectedKind;
      var expectedLabel;
      var expectedSignal;
      var expectedBasis;
      var excerptMatches;
      if (receiptKey) {
        var receiptIdentity = clean(localEvidence.kind).toLowerCase() + " " +
          clean(localEvidence.evidenceType).toLowerCase();
        expectedKind = receiptIdentity.indexOf("topic") >= 0 ? "topic" :
          receiptIdentity.indexOf("character") >= 0 ? "character" : "moment";
        expectedLabel = receiptProjectionLabel(localEvidence);
        expectedSignal = Number(localEvidence.signalScore || 0);
        if (!expectedSignal && expectedKind === "topic") {
          expectedSignal = Number(localEvidence.topicMentions || 0);
        }
        expectedBasis = clean(localEvidence.evidenceBasis) ||
          clean(localEvidence.evidenceType) || "source-local-receipt";
        excerptMatches = !excerpt || (
          localEvidence.publicExcerptAllowed &&
          comparableExcerpt(localEvidence.excerpt).indexOf(
            comparableExcerpt(excerpt)
          ) === 0
        );
      } else {
        expectedKind = "guide-cut";
        expectedLabel = naturalEvidenceLabel(
          localEvidence.topic || localEvidence.category || "Reviewed show cut"
        );
        expectedSignal = Number(localEvidence.score || 0);
        expectedBasis = clean(localEvidence.evidenceBasis) ||
          "reviewed-episode-guide-timestamp";
        excerptMatches =
          comparableExcerpt(excerpt) === comparableExcerpt(localEvidence.excerpt);
      }
      if (projectedKind !== expectedKind ||
          projectedLabel !== expectedLabel ||
          projectedSignal !== expectedSignal ||
          projectedBasis !== expectedBasis ||
          !excerptMatches) {
        fail(
          "EPISODE_RECAP_HIGHLIGHT_DRIFT",
          itemPath + " must project its local evidence without semantic drift.",
          itemPath
        );
      }
      return {
        receiptKey: receiptKey,
        guideCutId: cutId,
        ordinal: ordinal,
        kind: projectedKind,
        category: requiredText(item.category, itemPath + ".category", 120),
        at: window.at,
        end: window.end,
        label: projectedLabel,
        excerpt: excerpt,
        signalScore: projectedSignal,
        evidenceBasis: projectedBasis,
      };
    });
    for (var highlightIndex = 1;
      highlightIndex < highlightRunway.length;
      highlightIndex += 1) {
      if (highlightRunway[highlightIndex].at <
          highlightRunway[highlightIndex - 1].at) {
        fail(
          "EPISODE_RECAP_HIGHLIGHT_ORDER",
          path + ".highlightRunway must remain chronological.",
          path + ".highlightRunway[" + highlightIndex + "]"
        );
      }
    }
    var missingEditorialHighlights = [];
    receiptMap.forEach(function (receipt, key) {
      var identity = clean(receipt.kind).toLowerCase() + " " +
        clean(receipt.evidenceType).toLowerCase();
      if (identity.indexOf("topic") < 0 &&
          !highlightEvidenceKeys.has("receipt:" + key)) {
        missingEditorialHighlights.push(key);
      }
    });
    if (state === "ready" && missingEditorialHighlights.length) {
      fail(
        "EPISODE_RECAP_HIGHLIGHT_COVERAGE",
        path + ".highlightRunway must retain every registered moment and character receipt.",
        path + ".highlightRunway"
      );
    }
    if (state === "held" && highlightRunway.length) {
      fail(
        "HELD_EPISODE_RECAP_HIGHLIGHT_OVERREACH",
        path + ".highlightRunway must remain empty while the recap is held.",
        path + ".highlightRunway"
      );
    }

    var caseFile = null;
    if (raw.caseFile != null) {
      var casePath = path + ".caseFile";
      if (!isRecord(raw.caseFile)) {
        fail("INVALID_EPISODE_RECAP_CASE_FILE", casePath + " must be an object.", casePath);
      }
      var receiptCount = finiteNumber(raw.caseFile.receiptCount, casePath + ".receiptCount", 0);
      var topicCount = finiteNumber(raw.caseFile.topicCount, casePath + ".topicCount", 0);
      var topicMetricCount = finiteNumber(
        raw.caseFile.topicMetricCount == null ? 0 : raw.caseFile.topicMetricCount,
        casePath + ".topicMetricCount",
        0
      );
      var topicMentionTotal = finiteNumber(
        raw.caseFile.topicMentionTotal == null ? 0 : raw.caseFile.topicMentionTotal,
        casePath + ".topicMentionTotal",
        0
      );
      var highlightCount = finiteNumber(
        raw.caseFile.highlightCount == null ? 0 : raw.caseFile.highlightCount,
        casePath + ".highlightCount",
        0
      );
      var highlightCategoryCount = finiteNumber(
        raw.caseFile.highlightCategoryCount == null ?
          0 : raw.caseFile.highlightCategoryCount,
        casePath + ".highlightCategoryCount",
        0
      );
      var momentCount = finiteNumber(raw.caseFile.momentCount, casePath + ".momentCount", 0);
      var characterCount = finiteNumber(
        raw.caseFile.characterCount,
        casePath + ".characterCount",
        0
      );
      var actCount = finiteNumber(raw.caseFile.actCount, casePath + ".actCount", 0);
      var guideCutCount = finiteNumber(
        raw.caseFile.guideCutCount,
        casePath + ".guideCutCount",
        0
      );
      var threadCount = finiteNumber(
        raw.caseFile.threadCount,
        casePath + ".threadCount",
        0
      );
      var storySegmentCount = finiteNumber(
        raw.caseFile.storySegmentCount,
        casePath + ".storySegmentCount",
        0
      );
      var storyReceiptCount = finiteNumber(
        raw.caseFile.storyReceiptCount,
        casePath + ".storyReceiptCount",
        0
      );
      var storyCoveragePercent = finiteNumber(
        raw.caseFile.storyCoveragePercent,
        casePath + ".storyCoveragePercent",
        0
      );
      var tapeSpanPercent = finiteNumber(
        raw.caseFile.tapeSpanPercent,
        casePath + ".tapeSpanPercent",
        0
      );
      var firstAt = finiteNumber(
        raw.caseFile.firstAt == null ? 0 : raw.caseFile.firstAt,
        casePath + ".firstAt",
        0
      );
      var lastAt = finiteNumber(
        raw.caseFile.lastAt == null ? 0 : raw.caseFile.lastAt,
        casePath + ".lastAt",
        0
      );
      var storyNarrativeBeatCount = finiteNumber(
        raw.caseFile.storyNarrativeBeatCount,
        casePath + ".storyNarrativeBeatCount",
        0
      );
      var storyNamedSegmentCount = finiteNumber(
        raw.caseFile.storyNamedSegmentCount,
        casePath + ".storyNamedSegmentCount",
        0
      );
      var storyGuidePointCount = finiteNumber(
        raw.caseFile.storyGuidePointCount,
        casePath + ".storyGuidePointCount",
        0
      );
      var storyGuidePointExpected = finiteNumber(
        raw.caseFile.storyGuidePointExpected,
        casePath + ".storyGuidePointExpected",
        0
      );
      var storyGuidePointCoveragePercent = finiteNumber(
        raw.caseFile.storyGuidePointCoveragePercent,
        casePath + ".storyGuidePointCoveragePercent",
        0
      );
      var storyGuideChapterCount = finiteNumber(
        raw.caseFile.storyGuideChapterCount,
        casePath + ".storyGuideChapterCount",
        0
      );
      var storyGuideThreadCount = finiteNumber(
        raw.caseFile.storyGuideThreadCount,
        casePath + ".storyGuideThreadCount",
        0
      );
      var firstPlayableAnchorAt = finiteNumber(
        raw.caseFile.firstPlayableAnchorAt == null ?
          0 : raw.caseFile.firstPlayableAnchorAt,
        casePath + ".firstPlayableAnchorAt",
        0
      );
      var lastPlayableAnchorAt = finiteNumber(
        raw.caseFile.lastPlayableAnchorAt == null ?
          0 : raw.caseFile.lastPlayableAnchorAt,
        casePath + ".lastPlayableAnchorAt",
        0
      );
      var firstPlayableAnchorPercent = finiteNumber(
        raw.caseFile.firstPlayableAnchorPercent == null ?
          0 : raw.caseFile.firstPlayableAnchorPercent,
        casePath + ".firstPlayableAnchorPercent",
        0
      );
      var lastPlayableAnchorPercent = finiteNumber(
        raw.caseFile.lastPlayableAnchorPercent == null ?
          0 : raw.caseFile.lastPlayableAnchorPercent,
        casePath + ".lastPlayableAnchorPercent",
        0
      );
      var runtimePhaseCount = finiteNumber(
        raw.caseFile.runtimePhaseCount == null ?
          0 : raw.caseFile.runtimePhaseCount,
        casePath + ".runtimePhaseCount",
        0
      );
      var openingPhaseCovered = raw.caseFile.openingPhaseCovered === true;
      var middlePhaseCovered = raw.caseFile.middlePhaseCovered === true;
      var closingPhaseCovered = raw.caseFile.closingPhaseCovered === true;
      var runtimeCoverageLevel = clean(
        raw.caseFile.runtimeCoverageLevel,
        80
      );
      [
        ["receiptCount", receiptCount],
        ["topicCount", topicCount],
        ["topicMetricCount", topicMetricCount],
        ["topicMentionTotal", topicMentionTotal],
        ["highlightCount", highlightCount],
        ["highlightCategoryCount", highlightCategoryCount],
        ["momentCount", momentCount],
        ["characterCount", characterCount],
        ["actCount", actCount],
        ["guideCutCount", guideCutCount],
        ["threadCount", threadCount],
        ["storySegmentCount", storySegmentCount],
        ["storyReceiptCount", storyReceiptCount],
        ["storyNarrativeBeatCount", storyNarrativeBeatCount],
        ["storyNamedSegmentCount", storyNamedSegmentCount],
        ["storyGuidePointCount", storyGuidePointCount],
        ["storyGuidePointExpected", storyGuidePointExpected],
        ["storyGuideChapterCount", storyGuideChapterCount],
        ["storyGuideThreadCount", storyGuideThreadCount],
        ["runtimePhaseCount", runtimePhaseCount]
      ].forEach(function (entry) {
        if (!Number.isInteger(entry[1])) {
          fail(
            "EPISODE_RECAP_CASE_FILE_INTEGER",
            casePath + "." + entry[0] + " must be an integer.",
            casePath + "." + entry[0]
          );
        }
      });
      if (tapeSpanPercent > 100) {
        fail(
          "EPISODE_RECAP_CASE_FILE_SPAN",
          casePath + ".tapeSpanPercent cannot exceed 100.",
          casePath + ".tapeSpanPercent"
        );
      }
      if (storyCoveragePercent > 100) {
        fail(
          "EPISODE_RECAP_CASE_FILE_STORY_COVERAGE",
          casePath + ".storyCoveragePercent cannot exceed 100.",
          casePath + ".storyCoveragePercent"
        );
      }
      if (storyGuidePointCoveragePercent > 100) {
        fail(
          "EPISODE_RECAP_CASE_FILE_GUIDE_COVERAGE",
          casePath + ".storyGuidePointCoveragePercent cannot exceed 100.",
          casePath + ".storyGuidePointCoveragePercent"
        );
      }
      if (firstPlayableAnchorPercent > 100 || lastPlayableAnchorPercent > 100) {
        fail(
          "EPISODE_RECAP_CASE_FILE_ANCHOR_PERCENT",
          casePath + " playable-anchor percentages cannot exceed 100.",
          casePath
        );
      }
      if (runtimePhaseCount > 3) {
        fail(
          "EPISODE_RECAP_CASE_FILE_RUNTIME_PHASES",
          casePath + ".runtimePhaseCount cannot exceed three.",
          casePath + ".runtimePhaseCount"
        );
      }
      var expected = { receipts: 0, topics: 0, moments: 0, characters: 0 };
      receiptMap.forEach(function (receipt) {
        expected.receipts += 1;
        var kind = clean(receipt.kind).toLowerCase();
        var evidenceType = clean(receipt.evidenceType).toLowerCase();
        if (kind.indexOf("topic") >= 0 || evidenceType.indexOf("topic") >= 0) {
          expected.topics += 1;
        } else if (kind.indexOf("character") >= 0 ||
            evidenceType.indexOf("character") >= 0) {
          expected.characters += 1;
        } else {
          expected.moments += 1;
        }
      });
      var storyGuideCutIds = new Set();
      var storyGuideChapterIds = new Set();
      var storyThreadLabels = new Set();
      story.forEach(function (segment) {
        segment.guideCutIds.forEach(function (cutId) {
          storyGuideCutIds.add(cutId);
        });
        segment.guideChapterIds.forEach(function (chapterId) {
          storyGuideChapterIds.add(chapterId);
        });
        segment.threadLabels.forEach(function (threadLabel) {
          storyThreadLabels.add(threadLabel);
        });
      });
      var expectedGuidePointCount = guideCuts.length;
      var expectedGuideCoverage = expectedGuidePointCount ?
        Math.round(
          storyGuideCutIds.size / expectedGuidePointCount * 100
        ) : 100;
      var expectedTopicMetricCount = topicMap.filter(function (topic) {
        return clean(topic.metricBasis) &&
          (topic.mentions || topic.firstAt || topic.peakAt);
      }).length;
      var expectedTopicMentionTotal = topicMap.reduce(function (total, topic) {
        return total + Number(topic.mentions || 0);
      }, 0);
      var expectedHighlightCategoryCount = new Set(
        highlightRunway.map(function (item) {
          return clean(item.category);
        }).filter(Boolean)
      ).size;
      var sectionAnchorTimes = sections.map(function (section) {
        return Number(section.at || 0);
      }).sort(function (left, right) {
        return left - right;
      });
      var expectedFirstAnchorAt = sectionAnchorTimes.length ?
        sectionAnchorTimes[0] : 0;
      var expectedLastAnchorAt = sectionAnchorTimes.length ?
        sectionAnchorTimes[sectionAnchorTimes.length - 1] : 0;
      var expectedFirstAnchorPercent = source.duration ?
        Math.max(
          0,
          Math.min(100, Math.round(expectedFirstAnchorAt / source.duration * 100))
        ) : 0;
      var expectedLastAnchorPercent = source.duration ?
        Math.max(
          0,
          Math.min(100, Math.round(expectedLastAnchorAt / source.duration * 100))
        ) : 0;
      var expectedOpeningPhase = sectionAnchorTimes.some(function (at) {
        return source.duration && at / source.duration <= 0.15;
      });
      var expectedMiddlePhase = sectionAnchorTimes.some(function (at) {
        var progress = source.duration ? at / source.duration : 0;
        return progress >= 0.35 && progress <= 0.65;
      });
      var expectedClosingPhase = sectionAnchorTimes.some(function (at) {
        return source.duration && at / source.duration >= 0.85;
      });
      var expectedRuntimePhaseCount = Number(expectedOpeningPhase) +
        Number(expectedMiddlePhase) + Number(expectedClosingPhase);
      var expectedRuntimeCoverageLevel =
        expectedOpeningPhase && expectedMiddlePhase && expectedClosingPhase ?
          "opening-middle-closing" :
          expectedClosingPhase ? "closing-represented" : "indexed-highlights";
      var registeredReceiptValues = Array.from(receiptMap.values());
      var expectedFirstAt = registeredReceiptValues.length ?
        Math.min.apply(null, registeredReceiptValues.map(function (receipt) {
          return Number(receipt.at);
        })) : 0;
      var latestReceiptAt = registeredReceiptValues.length ?
        Math.max.apply(null, registeredReceiptValues.map(function (receipt) {
          return Number(receipt.at);
        })) : 0;
      var latestReceiptEnd = registeredReceiptValues.length ?
        Math.max.apply(null, registeredReceiptValues.map(function (receipt) {
          return Number(receipt.end);
        })) : 0;
      var expectedTapeSpanPercent = source.duration && registeredReceiptValues.length ?
        Math.max(
          1,
          Math.min(
            100,
            Math.round((lastAt - firstAt) / source.duration * 100)
          )
        ) : 0;
      var sourceSpanMatches =
        firstAt === expectedFirstAt &&
        lastAt >= latestReceiptAt &&
        lastAt <= latestReceiptEnd &&
        tapeSpanPercent === expectedTapeSpanPercent;
      if (state === "ready" && (
        receiptCount !== expected.receipts ||
        topicCount !== expected.topics ||
        topicMetricCount !== expectedTopicMetricCount ||
        topicMentionTotal !== expectedTopicMentionTotal ||
        highlightCount !== highlightRunway.length ||
        highlightCategoryCount !== expectedHighlightCategoryCount ||
        momentCount !== expected.moments ||
        characterCount !== expected.characters ||
        actCount !== sections.length ||
        guideCutCount !== array(episodeGuide && episodeGuide.cuts).length ||
        threadCount !== array(episodeGuide && episodeGuide.threads).length ||
        storySegmentCount !== story.length ||
        storyReceiptCount !== storyReceiptKeys.size ||
        storyCoveragePercent !==
          Math.round(storyReceiptKeys.size / Math.max(1, expected.receipts) * 100) ||
        storyNarrativeBeatCount !== story.length ||
        storyNamedSegmentCount !== story.length ||
        storyGuidePointCount !== storyGuideCutIds.size ||
        storyGuidePointExpected !== expectedGuidePointCount ||
        storyGuidePointCoveragePercent !== expectedGuideCoverage ||
        storyGuideChapterCount !== storyGuideChapterIds.size ||
        storyGuideThreadCount !== storyThreadLabels.size ||
        firstPlayableAnchorAt !== expectedFirstAnchorAt ||
        lastPlayableAnchorAt !== expectedLastAnchorAt ||
        firstPlayableAnchorPercent !== expectedFirstAnchorPercent ||
        lastPlayableAnchorPercent !== expectedLastAnchorPercent ||
        openingPhaseCovered !== expectedOpeningPhase ||
        middlePhaseCovered !== expectedMiddlePhase ||
        closingPhaseCovered !== expectedClosingPhase ||
        runtimePhaseCount !== expectedRuntimePhaseCount ||
        runtimeCoverageLevel !== expectedRuntimeCoverageLevel ||
        !sourceSpanMatches
      )) {
        fail(
          "EPISODE_RECAP_CASE_FILE_MISMATCH",
          casePath + " counts must match this source's registered receipts and recap acts.",
          casePath
        );
      }
      if (state === "held" && (
        receiptCount || topicCount || topicMetricCount || topicMentionTotal ||
        highlightCount || highlightCategoryCount ||
        momentCount || characterCount || actCount ||
        guideCutCount || threadCount || storySegmentCount || storyReceiptCount ||
        storyCoveragePercent || storyNarrativeBeatCount ||
        storyNamedSegmentCount || storyGuidePointCount ||
        storyGuidePointExpected || storyGuideChapterCount ||
        storyGuideThreadCount || tapeSpanPercent ||
        firstAt || lastAt ||
        firstPlayableAnchorAt || lastPlayableAnchorAt ||
        firstPlayableAnchorPercent || lastPlayableAnchorPercent ||
        runtimePhaseCount || openingPhaseCovered || middlePhaseCovered ||
        closingPhaseCovered || runtimeCoverageLevel ||
        storyGuidePointCoveragePercent !== 100
      )) {
        fail(
          "HELD_EPISODE_RECAP_CASE_FILE_OVERREACH",
          casePath + " must remain empty while the recap is held.",
          casePath
        );
      }
      caseFile = {
        receiptCount: receiptCount,
        topicCount: topicCount,
        topicMetricCount: topicMetricCount,
        topicMentionTotal: topicMentionTotal,
        highlightCount: highlightCount,
        highlightCategoryCount: highlightCategoryCount,
        momentCount: momentCount,
        characterCount: characterCount,
        actCount: actCount,
        guideCutCount: guideCutCount,
        threadCount: threadCount,
        storySegmentCount: storySegmentCount,
        storyReceiptCount: storyReceiptCount,
        storyCoveragePercent: storyCoveragePercent,
        storyNarrativeBeatCount: storyNarrativeBeatCount,
        storyNamedSegmentCount: storyNamedSegmentCount,
        storyGuidePointCount: storyGuidePointCount,
        storyGuidePointExpected: storyGuidePointExpected,
        storyGuidePointCoveragePercent: storyGuidePointCoveragePercent,
        storyGuideChapterCount: storyGuideChapterCount,
        storyGuideThreadCount: storyGuideThreadCount,
        tapeSpanPercent: tapeSpanPercent,
        firstAt: firstAt,
        lastAt: lastAt,
        firstPlayableAnchorAt: firstPlayableAnchorAt,
        lastPlayableAnchorAt: lastPlayableAnchorAt,
        firstPlayableAnchorPercent: firstPlayableAnchorPercent,
        lastPlayableAnchorPercent: lastPlayableAnchorPercent,
        runtimePhaseCount: runtimePhaseCount,
        openingPhaseCovered: openingPhaseCovered,
        middlePhaseCovered: middlePhaseCovered,
        closingPhaseCovered: closingPhaseCovered,
        runtimeCoverageLevel: runtimeCoverageLevel,
        laneCounts: isRecord(raw.caseFile.laneCounts) ?
          serial(raw.caseFile.laneCounts) : {},
      };
    }

    function recapParagraphProjection(paragraph) {
      return {
        at: paragraph.at,
        end: paragraph.end,
        cutId: paragraph.cutId,
        topic: paragraph.topic,
        excerpt: paragraph.excerpt,
        body: paragraph.body,
        evidenceBasis: paragraph.evidenceBasis
      };
    }

    function takeArcProjection(take) {
      var projected = {
        phase: take.phase,
        label: take.label,
        at: take.at,
        end: take.end,
        body: take.body,
        excerpt: take.excerpt,
        category: take.category,
        cutId: take.cutId,
        evidenceBasis: take.evidenceBasis
      };
      if (take.promotionAllowed === false) projected.promotionAllowed = false;
      return projected;
    }

    function guideRecapProjection(guide) {
      if (!guide) return null;
      var recapProjection = {};
      if (guide.recap) {
        recapProjection = {
          status: guide.recap.status,
          label: guide.recap.label,
          headline: guide.recap.headline,
          dek: guide.recap.dek,
          paragraphs: guide.recap.paragraphs.map(recapParagraphProjection),
          sourceCutIds: guide.recap.sourceCutIds.slice(),
          promotionAllowed: false
        };
      }
      return {
        overview: guide.overview,
        evidenceSummary: guide.evidenceSummary,
        recap: recapProjection,
        lanes: guide.lanes || {},
        takeArc: guide.takeArc.map(takeArcProjection),
        reviewChecklist: guide.reviewChecklist.slice(),
        variant: guide.variant,
        format: guide.format
      };
    }

    var guideRecap = guideRecapProjection(episodeGuide);
    if (raw.guideRecap != null) {
      var guideRecapPath = path + ".guideRecap";
      if (!isRecord(raw.guideRecap) || !guideRecap) {
        fail(
          "INVALID_EPISODE_RECAP_GUIDE_BRIDGE",
          guideRecapPath + " requires the owning normalized Episode Guide.",
          guideRecapPath
        );
      }
      if (stableJson(raw.guideRecap) !== stableJson(guideRecap)) {
        fail(
          "EPISODE_RECAP_GUIDE_BRIDGE_DRIFT",
          guideRecapPath + " must be an exact projection of this source's Episode Guide.",
          guideRecapPath
        );
      }
    }

    return {
      schema: schema,
      generatorVersion: requiredText(raw.generatorVersion, path + ".generatorVersion", 40),
      coreSchema: requiredText(raw.coreSchema, path + ".coreSchema", 80),
      sourceId: source.id,
      sourceFingerprint: requiredText(raw.sourceFingerprint, path + ".sourceFingerprint", 80),
      evidenceFingerprint: requiredText(
        raw.evidenceFingerprint || raw.sourceFingerprint,
        path + ".evidenceFingerprint",
        80
      ),
      semanticFingerprint: requiredText(raw.semanticFingerprint, path + ".semanticFingerprint", 80),
      state: state,
      tier: requiredText(raw.tier, path + ".tier", 80),
      label: requiredText(raw.label, path + ".label", 180),
      badge: requiredText(raw.badge, path + ".badge", 180),
      headline: requiredText(raw.headline, path + ".headline", 320),
      deck: requiredText(raw.deck, path + ".deck", 700),
      overview: requiredText(raw.overview, path + ".overview", 1800),
      topics: topics,
      topicMap: topicMap,
      sections: sections,
      story: story,
      highlightRunway: highlightRunway,
      bestMoments: bestMoments,
      fanRead: fanRead,
      guideRecap: guideRecap,
      caseFile: caseFile,
      coverage: isRecord(raw.coverage) ? serial(raw.coverage) : {},
      format: isRecord(raw.format) ? serial(raw.format) : {},
      limitations: stringList(raw.limitations || [], path + ".limitations", { max: 360 }),
      approval: {
        meaning: requiredText(raw.approval.meaning, path + ".approval.meaning", 120),
        actualApproval: false,
        disclosure: requiredText(raw.approval.disclosure, path + ".approval.disclosure", 400),
      },
    };
  }

  function normalizeShowWiki(raw, source, receiptMap) {
    if (raw == null) return null;
    var path = "sources[" + source._index + "].showWiki";
    if (!isRecord(raw)) fail("INVALID_SHOW_WIKI", path + " must be an object or null.", path);
    var episodeGuide = normalizeEpisodeGuide(
      raw.episodeGuide,
      source,
      path + ".episodeGuide"
    );
    var episodeRecap = normalizeEpisodeRecap(
      raw.episodeRecap,
      source,
      receiptMap,
      episodeGuide,
      path + ".episodeRecap"
    );
    if (!Array.isArray(raw.lanes) || !raw.lanes.length) {
      fail("SHOW_WIKI_LANES_REQUIRED", path + ".lanes must contain at least one lane.", path + ".lanes");
    }
    var laneIds = new Set();
    var lanes = raw.lanes.map(function (lane, index) {
      var lanePath = path + ".lanes[" + index + "]";
      if (!isRecord(lane)) fail("INVALID_SHOW_WIKI_LANE", lanePath + " must be an object.", lanePath);
      var id = requiredText(lane.id, lanePath + ".id", 80);
      if (!KEBAB_ID.test(id)) {
        fail("INVALID_SHOW_WIKI_LANE_ID", lanePath + ".id must be a kebab-case ID.", lanePath + ".id");
      }
      if (laneIds.has(id)) {
        fail("DUPLICATE_SHOW_WIKI_LANE", path + " contains duplicate lane " + id + ".", lanePath + ".id");
      }
      laneIds.add(id);
      var receiptKeys = stringList(lane.receiptKeys || [], lanePath + ".receiptKeys", { max: 240 });
      receiptKeys.forEach(function (key, receiptIndex) {
        if (!receiptMap.has(key)) {
          fail(
            "UNKNOWN_SHOW_WIKI_RECEIPT",
            lanePath + ".receiptKeys[" + receiptIndex + "] is not local to this source.",
            lanePath + ".receiptKeys[" + receiptIndex + "]"
          );
        }
      });
      return {
        id: id,
        label: requiredText(lane.label, lanePath + ".label", 180),
        description: requiredText(lane.description, lanePath + ".description", 420),
        emptyState: requiredText(lane.emptyState, lanePath + ".emptyState", 420),
        queryAliases: normalizeShowWikiAliases(
          lane.queryAliases,
          lanePath + ".queryAliases"
        ),
        receiptKeys: receiptKeys
      };
    });
    var experience = null;
    if (raw.experience != null) {
      var experiencePath = path + ".experience";
      if (!isRecord(raw.experience)) {
        fail(
          "INVALID_SHOW_WIKI_EXPERIENCE",
          experiencePath + " must be an object or null.",
          experiencePath
        );
      }
      var experienceId = requiredText(
        raw.experience.id,
        experiencePath + ".id",
        80
      );
      if (!KEBAB_ID.test(experienceId)) {
        fail(
          "INVALID_SHOW_WIKI_EXPERIENCE_ID",
          experiencePath + ".id must be a kebab-case ID.",
          experiencePath + ".id"
        );
      }
      var routeReceiptKeys = stringList(
        raw.experience.routeReceiptKeys || [],
        experiencePath + ".routeReceiptKeys",
        { max: 240 }
      );
      var pulseReceiptKeys = stringList(
        raw.experience.pulseReceiptKeys || [],
        experiencePath + ".pulseReceiptKeys",
        { max: 240 }
      );
      routeReceiptKeys.concat(pulseReceiptKeys).forEach(function (key, receiptIndex) {
        if (!receiptMap.has(key)) {
          fail(
            "UNKNOWN_SHOW_WIKI_EXPERIENCE_RECEIPT",
            experiencePath + " references a receipt outside this source.",
            experiencePath + ".receiptKeys[" + receiptIndex + "]"
          );
        }
      });
      if (routeReceiptKeys.length > 8) {
        fail(
          "SHOW_WIKI_EXPERIENCE_ROUTE_LIMIT",
          experiencePath + ".routeReceiptKeys cannot exceed eight stops.",
          experiencePath + ".routeReceiptKeys"
        );
      }
      if (pulseReceiptKeys.length > 32) {
        fail(
          "SHOW_WIKI_EXPERIENCE_PULSE_LIMIT",
          experiencePath + ".pulseReceiptKeys cannot exceed 32 signals.",
          experiencePath + ".pulseReceiptKeys"
        );
      }
      experience = {
        id: experienceId,
        label: requiredText(raw.experience.label, experiencePath + ".label", 180),
        title: requiredText(raw.experience.title, experiencePath + ".title", 240),
        description: requiredText(
          raw.experience.description,
          experiencePath + ".description",
          600
        ),
        selectionBasis: requiredText(
          raw.experience.selectionBasis,
          experiencePath + ".selectionBasis",
          240
        ),
        emptyState: requiredText(
          raw.experience.emptyState,
          experiencePath + ".emptyState",
          420
        ),
        queryAliases: normalizeShowWikiAliases(
          raw.experience.queryAliases,
          experiencePath + ".queryAliases"
        ),
        routeReceiptKeys: routeReceiptKeys,
        pulseReceiptKeys: pulseReceiptKeys
      };
    }
    var brief = null;
    if (raw.brief != null) {
      var briefPath = path + ".brief";
      if (!isRecord(raw.brief)) {
        fail(
          "INVALID_SHOW_WIKI_BRIEF",
          briefPath + " must be a constrained metadata object or null.",
          briefPath
        );
      }
      Object.keys(raw.brief).forEach(function (field) {
        if (!own(SHOW_WIKI_BRIEF_FIELDS, field)) {
          fail(
            "SHOW_WIKI_BRIEF_FIELD_OVERREACH",
            briefPath + "." + field +
              " is not canonical source metadata and cannot enter a Source Brief.",
            briefPath + "." + field
          );
        }
      });
      var briefKind = requiredText(raw.brief.kind, briefPath + ".kind", 80);
      if (briefKind !== "source-metadata-brief") {
        fail(
          "INVALID_SHOW_WIKI_BRIEF_KIND",
          briefPath + ".kind must be source-metadata-brief.",
          briefPath + ".kind"
        );
      }
      var briefScope = requiredText(raw.brief.scope, briefPath + ".scope", 80);
      if (briefScope !== "canonical-source-metadata-only") {
        fail(
          "INVALID_SHOW_WIKI_BRIEF_SCOPE",
          briefPath + ".scope must be canonical-source-metadata-only.",
          briefPath + ".scope"
        );
      }
      var briefFormatBasis = requiredText(
        raw.brief.formatBasis,
        briefPath + ".formatBasis",
        180
      );
      if (!own(SHOW_WIKI_BRIEF_FORMAT_BASIS, briefFormatBasis)) {
        fail(
          "INVALID_SHOW_WIKI_BRIEF_FORMAT_BASIS",
          briefPath + ".formatBasis is not an allowed canonical metadata basis.",
          briefPath + ".formatBasis"
        );
      }
      var briefAliases = normalizeShowWikiAliases(
        raw.brief.queryAliases,
        briefPath + ".queryAliases"
      );
      if (!briefAliases.length) {
        fail(
          "SHOW_WIKI_BRIEF_QUERY_ALIASES_REQUIRED",
          briefPath + ".queryAliases must contain at least one metadata-only question.",
          briefPath + ".queryAliases"
        );
      }
      brief = {
        kind: briefKind,
        scope: briefScope,
        format: requiredText(raw.brief.format, briefPath + ".format", 100),
        formatBasis: briefFormatBasis,
        queryAliases: briefAliases
      };
    }
    var recap = null;
    if (raw.recap != null) {
      var recapPath = path + ".recap";
      if (!isRecord(raw.recap)) {
        fail("INVALID_SHOW_WIKI_RECAP", recapPath + " must be an object or null.", recapPath);
      }
      if (!Array.isArray(raw.recap.blocks) || !raw.recap.blocks.length ||
          raw.recap.blocks.length > 4) {
        fail(
          "SHOW_WIKI_RECAP_BLOCKS_REQUIRED",
          recapPath + ".blocks must contain between one and four blocks.",
          recapPath + ".blocks"
        );
      }
      var recapBlockIds = new Set();
      var recapBlocks = raw.recap.blocks.map(function (block, blockIndex) {
        var blockPath = recapPath + ".blocks[" + blockIndex + "]";
        if (!isRecord(block)) {
          fail("INVALID_SHOW_WIKI_RECAP_BLOCK", blockPath + " must be an object.", blockPath);
        }
        var blockId = requiredText(block.id, blockPath + ".id", 80);
        if (!KEBAB_ID.test(blockId)) {
          fail("INVALID_SHOW_WIKI_RECAP_BLOCK_ID", blockPath + ".id is invalid.", blockPath + ".id");
        }
        if (recapBlockIds.has(blockId)) {
          fail("DUPLICATE_SHOW_WIKI_RECAP_BLOCK", recapPath + " contains duplicate block " + blockId + ".", blockPath + ".id");
        }
        recapBlockIds.add(blockId);
        var blockReceiptKeys = stringList(
          block.receiptKeys || [],
          blockPath + ".receiptKeys",
          { max: 240, minimum: 1 }
        );
        blockReceiptKeys.forEach(function (key, keyIndex) {
          if (!receiptMap.has(key)) {
            fail(
              "UNKNOWN_SHOW_WIKI_RECAP_RECEIPT",
              blockPath + ".receiptKeys[" + keyIndex + "] is not local to this source.",
              blockPath + ".receiptKeys[" + keyIndex + "]"
            );
          }
        });
        return {
          id: blockId,
          label: requiredText(block.label, blockPath + ".label", 180),
          body: requiredText(block.body, blockPath + ".body", 600),
          basis: requiredText(block.basis, blockPath + ".basis", 180),
          receiptKeys: blockReceiptKeys
        };
      });
      recap = {
        format: requiredText(raw.recap.format, recapPath + ".format", 100),
        formatBasis: requiredText(raw.recap.formatBasis, recapPath + ".formatBasis", 180),
        overview: requiredText(raw.recap.overview, recapPath + ".overview", 800),
        queryAliases: normalizeShowWikiAliases(
          raw.recap.queryAliases,
          recapPath + ".queryAliases"
        ),
        blocks: recapBlocks
      };
    }
    if (episodeRecap && episodeRecap.state === "ready") {
      var compatibilitySections = episodeRecap.sections.filter(function (section) {
        return section.receiptKeys.length > 0;
      }).slice(0, 3);
      if (compatibilitySections.length) {
        var recapFormat = isRecord(episodeRecap.format) ?
          episodeRecap.format : {};
        recap = {
          format: clean(recapFormat.label, 100) ||
            clean(recap && recap.format, 100) ||
            "SOURCE-LINKED EPISODE",
          formatBasis: clean(recapFormat.basis, 180) ||
            clean(recap && recap.formatBasis, 180) ||
            "episode-recap-compatibility-projection",
          overview: boundedProse(episodeRecap.overview, 800),
          queryAliases: recap && recap.queryAliases.length ?
            recap.queryAliases.slice() :
            ["summarize this show"],
          blocks: compatibilitySections.map(function (section) {
            return {
              id: section.id,
              label: clean(section.label, 180),
              body: boundedProse(section.body, 600),
              basis: clean(section.evidenceBasis, 180) ||
                "episode-recap-compatibility-projection",
              receiptKeys: section.receiptKeys.slice()
            };
          })
        };
      }
    }
    if (source.coverage !== "caption-backed" && recap) {
      fail(
        "COVERAGE_SHOW_WIKI_RECAP_OVERREACH",
        path + " cannot expose a semantic recap under " + source.coverage + " coverage.",
        path + ".recap"
      );
    }
    if (source.coverage === "caption-backed" && brief) {
      fail(
        "COVERAGE_SHOW_WIKI_BRIEF_MISMATCH",
        path + " cannot substitute a metadata-only Source Brief for a caption-backed Show Wiki.",
        path + ".brief"
      );
    }
    var status = requiredText(raw.status, path + ".status", 80);
    if ((status === "source-brief") !== Boolean(brief)) {
      fail(
        "SHOW_WIKI_BRIEF_STATUS_MISMATCH",
        path + ".status and .brief must declare the Source Brief state together.",
        path
      );
    }
    if (source.coverage !== "caption-backed" && (
      lanes.some(function (lane) { return lane.receiptKeys.length > 0; }) ||
      experience && (
        experience.routeReceiptKeys.length > 0 ||
        experience.pulseReceiptKeys.length > 0
      )
    )) {
      fail(
        "COVERAGE_SHOW_WIKI_OVERREACH",
        path + " cannot expose semantic Show Wiki receipts under " +
          source.coverage + " coverage.",
        path
      );
    }
    return {
      label: requiredText(raw.label, path + ".label", 180),
      status: status,
      description: requiredText(raw.description, path + ".description", 600),
      experience: experience,
      brief: brief,
      recap: recap,
      episodeRecap: episodeRecap,
      episodeGuide: episodeGuide,
      lanes: lanes
    };
  }

  function normalizeSource(raw, index) {
    var path = "sources[" + index + "]";
    if (!isRecord(raw)) fail("INVALID_SOURCE", path + " must be an object.", path);
    var id = requiredText(raw.id, path + ".id", 64);
    if (!SOURCE_ID.test(id)) fail("INVALID_SOURCE_ID", path + ".id is invalid.", path + ".id");
    var date = requiredText(raw.date, path + ".date", 10);
    if (!DATE.test(date) || Number.isNaN(Date.parse(date + "T00:00:00Z"))) {
      fail("INVALID_DATE", path + ".date is invalid.", path + ".date");
    }
    var coverage = requiredText(raw.coverage, path + ".coverage", 40);
    if (!own(COVERAGE, coverage)) {
      fail("UNKNOWN_COVERAGE", path + ".coverage is unsupported.", path + ".coverage");
    }
    var authority = requiredText(raw.authority, path + ".authority", 40);
    if (!own(AUTHORITY, authority)) {
      fail("UNKNOWN_AUTHORITY", path + ".authority is unsupported.", path + ".authority");
    }
    var source = {
      _index: index,
      id: id,
      title: requiredText(raw.title, path + ".title", 320),
      displayTitle: requiredText(raw.displayTitle || raw.title, path + ".displayTitle", 320),
      date: date,
      duration: finiteNumber(raw.duration, path + ".duration", 1),
      views: finiteNumber(raw.views, path + ".views", 0),
      thumbnail: requiredText(raw.thumbnail, path + ".thumbnail", 600),
      url: exactYoutubeUrl(raw.url, id, path + ".url"),
      availability: requiredText(raw.availability, path + ".availability", 80),
      liveStatus: requiredText(raw.liveStatus, path + ".liveStatus", 80),
      coverage: coverage,
      authority: authority,
      lanes: stringList(raw.lanes || [], path + ".lanes", { max: 100, minimum: 1 }),
      sourceType: requiredText(raw.sourceType, path + ".sourceType", 80),
      rawContentMode: raw.rawContentMode == null
        ? null
        : requiredText(raw.rawContentMode, path + ".rawContentMode", 120),
      runtimeFormat: isRecord(raw.runtimeFormat) ? serial(raw.runtimeFormat) : {},
      subtype: isRecord(raw.subtype) ? serial(raw.subtype) : {},
      formatContract: isRecord(raw.formatContract) ? serial(raw.formatContract) : {},
      wordsAudited: finiteNumber(raw.wordsAudited || 0, path + ".wordsAudited", 0),
      exactSourceHold: normalizeExactSourceHold(
        raw.exactSourceHold,
        path + ".exactSourceHold"
      ),
      officialAlternate: normalizeOfficialAlternate(
        raw.officialAlternate,
        path + ".officialAlternate"
      ),
      summary: normalizeSummary(raw.summary, path + ".summary"),
      rightsPolicy: isRecord(raw.rightsPolicy) ? serial(raw.rightsPolicy) : {},
      warnings: stringList(raw.warnings || [], path + ".warnings", { max: 420 }),
      metrics: isRecord(raw.metrics) ? serial(raw.metrics) : {},
      showWiki: null,
      receipts: [],
      entities: [],
      artifacts: []
    };
    source.receipts = (raw.receipts || []).map(function (receipt, receiptIndex) {
      return normalizeReceipt(receipt, source, receiptIndex);
    });
    if (coverage === "metadata-only" || coverage === "caption-limited" ||
        coverage === "unavailable") {
      if (source.receipts.length || source.summary) {
        fail(
          "COVERAGE_OVERREACH",
          path + " cannot expose semantic content under " + coverage + " coverage.",
          path
        );
      }
    }
    var receiptMap = new Map();
    source.receipts.forEach(function (receipt) {
      if (receiptMap.has(receipt.key)) {
        fail("DUPLICATE_RECEIPT", path + " contains a duplicate receipt key.", path + ".receipts");
      }
      receiptMap.set(receipt.key, receipt);
    });
    source.showWiki = normalizeShowWiki(raw.showWiki, source, receiptMap);
    if (source.showWiki && source.showWiki.recap &&
        source.showWiki.episodeRecap &&
        source.showWiki.episodeRecap.state === "ready") {
      source.summary = {
        text: source.showWiki.recap.overview,
        basis: "episode-recap-compatibility-projection"
      };
    }
    source.entities = (raw.entities || []).map(function (entity, entityIndex) {
      return normalizeEntity(entity, source, receiptMap, entityIndex);
    });
    var entityIds = new Set();
    source.entities.forEach(function (entity) {
      if (entityIds.has(entity.id)) {
        fail("DUPLICATE_ENTITY", path + " contains a duplicate entity.", path + ".entities");
      }
      entityIds.add(entity.id);
    });
    if ((coverage === "metadata-only" || coverage === "caption-limited" ||
        coverage === "unavailable") && source.entities.some(function (entity) {
      return entity.basis !== "cached-title-alias";
    })) {
      fail("COVERAGE_ENTITY_OVERREACH", path + " cannot expose semantic entities.", path + ".entities");
    }
    source.artifacts = (raw.artifacts || []).map(function (artifact, artifactIndex) {
      return normalizeArtifact(artifact, source, artifactIndex);
    });
    var artifactIds = new Set();
    source.artifacts.forEach(function (artifact) {
      if (artifactIds.has(artifact.id)) {
        fail("DUPLICATE_ARTIFACT", path + " contains a duplicate artifact.", path + ".artifacts");
      }
      artifactIds.add(artifact.id);
    });
    if (coverage === "metadata-only" || coverage === "caption-limited" ||
        coverage === "unavailable") {
      if (source.artifacts.length) {
        fail("COVERAGE_ARTIFACT_OVERREACH", path + " cannot expose content artifacts.", path);
      }
    }
    return source;
  }

  function sourceFingerprint(source) {
    return fnv1a(stableJson({
      id: source.id,
      title: source.title,
      date: source.date,
      duration: source.duration,
      views: source.views,
      coverage: source.coverage,
      authority: source.authority,
      lanes: source.lanes,
      rawContentMode: source.rawContentMode,
      runtimeFormat: source.runtimeFormat,
      subtype: source.subtype,
      formatContract: source.formatContract,
      exactSourceHold: source.exactSourceHold,
      officialAlternate: source.officialAlternate,
      receiptKeys: source.receipts.map(function (receipt) {
        return [receipt.key, receipt.at, receipt.end, receipt.evidenceType,
          receipt.signalScore, receipt.signalBasis];
      }),
      showWiki: source.showWiki,
      entities: source.entities.map(function (entity) {
        return [entity.id, entity.basis, entity.receiptKeys];
      }),
      artifacts: source.artifacts.map(function (artifact) {
        return [artifact.id, artifact.kind, artifact.label, artifact.authority,
          artifact.reviewState, artifact.sourceIds, artifact.receiptKeys,
          artifact.at, artifact.targetSection, artifact.risk];
      })
    }));
  }

  function artifactIdentity(artifact) {
    return {
      kind: artifact.kind,
      label: artifact.label,
      authority: artifact.authority,
      reviewState: artifact.reviewState,
      targetSection: artifact.targetSection,
      risk: artifact.risk
    };
  }

  function basisRank(value) {
    return value === "receipt-backed-entity" ? 4 :
      value === "exact-artifact-membership" ? 3 :
        value === "registered-source-entity" ? 2 : 1;
  }

  function relationForEntities(left, right) {
    if (left.basis === "timestamped-receipt" &&
        right.basis === "timestamped-receipt") return "receipt-backed-entity";
    if (left.basis !== "cached-title-alias" &&
        right.basis !== "cached-title-alias") return "registered-source-entity";
    return "source-metadata-neighbor";
  }

  function compileConnections(source, sources, sourceById) {
    var localEntities = new Map(source.entities.map(function (entity) {
      return [entity.id, entity];
    }));
    var localArtifacts = source.artifacts.filter(function (artifact) {
      return artifact.sourceIds.length > 1;
    });
    var matches = sources.filter(function (candidate) {
      return candidate.id !== source.id;
    }).map(function (candidate) {
      var sharedEntities = [];
      candidate.entities.forEach(function (entity) {
        var local = localEntities.get(entity.id);
        if (!local) return;
        sharedEntities.push({
          id: entity.id,
          label: entity.label,
          type: entity.type,
          basis: relationForEntities(local, entity),
          localReceiptKeys: local.receiptKeys.slice(),
          relatedReceiptKeys: entity.receiptKeys.slice()
        });
      });
      var artifactIds = localArtifacts.filter(function (artifact) {
        return artifact.sourceIds.indexOf(candidate.id) >= 0;
      }).map(function (artifact) { return artifact.id; });
      if (!sharedEntities.length && !artifactIds.length) return null;
      var basis = sharedEntities.reduce(function (best, entity) {
        return basisRank(entity.basis) > basisRank(best) ? entity.basis : best;
      }, artifactIds.length ? "exact-artifact-membership" : "source-metadata-neighbor");
      if (artifactIds.length && basisRank("exact-artifact-membership") > basisRank(basis)) {
        basis = "exact-artifact-membership";
      }
      return {
        sourceId: candidate.id,
        sourceFingerprint: candidate.sourceFingerprint,
        title: candidate.title,
        displayTitle: candidate.displayTitle,
        date: candidate.date,
        thumbnail: candidate.thumbnail,
        coverage: candidate.coverage,
        authority: candidate.authority,
        direction: candidate.date > source.date ? "later" :
          candidate.date < source.date ? "earlier" : "same-day",
        basis: basis,
        sharedEntities: sharedEntities.sort(function (left, right) {
          return basisRank(right.basis) - basisRank(left.basis) ||
            left.label.localeCompare(right.label);
        }),
        artifactIds: artifactIds.sort()
      };
    }).filter(Boolean).sort(function (left, right) {
      return basisRank(right.basis) - basisRank(left.basis) ||
        Number(right.direction === "later") - Number(left.direction === "later") ||
        right.sharedEntities.length - left.sharedEntities.length ||
        right.date.localeCompare(left.date) ||
        left.sourceId.localeCompare(right.sourceId);
    });
    var displayed = matches.slice(0, 16).map(function (connection) {
      if (!sourceById.has(connection.sourceId)) {
        fail("UNKNOWN_CONNECTION_SOURCE", "A connection left the source registry.");
      }
      return connection;
    });
    return {
      matchingTotal: matches.length,
      displayed: displayed.length,
      truncated: matches.length > displayed.length,
      connections: displayed
    };
  }

  function summarizeBy(values, key) {
    return values.reduce(function (output, item) {
      var value = item[key] || "unknown";
      output[value] = Number(output[value] || 0) + 1;
      return output;
    }, {});
  }

  function create(input) {
    var payload = snapshot(input, "input");
    if (!isRecord(payload)) fail("INVALID_INPUT", "Source Dossier input must be an object.");
    if (payload.schema !== INPUT_SCHEMA) {
      fail("FOREIGN_SCHEMA", "Source Dossier input schema is unsupported.", "input.schema");
    }
    if (!isRecord(payload.channel)) {
      fail("INVALID_CHANNEL", "Source Dossier requires channel bindings.", "input.channel");
    }
    var channel = {
      id: requiredText(payload.channel.id, "input.channel.id", 120),
      label: requiredText(payload.channel.label, "input.channel.label", 240),
      packFingerprint: requiredText(
        payload.channel.packFingerprint,
        "input.channel.packFingerprint",
        120
      )
    };
    var snapshotDate = requiredText(payload.snapshotDate, "input.snapshotDate", 10);
    if (!DATE.test(snapshotDate)) {
      fail("INVALID_DATE", "input.snapshotDate must be YYYY-MM-DD.", "input.snapshotDate");
    }
    if (!Array.isArray(payload.sources) || !payload.sources.length) {
      fail("EMPTY_REGISTRY", "Source Dossier requires at least one source.", "input.sources");
    }
    var sources = payload.sources.map(normalizeSource);
    var sourceById = new Map();
    var receiptSourceByKey = new Map();
    var artifactCopiesById = new Map();
    sources.forEach(function (source) {
      if (sourceById.has(source.id)) {
        fail("DUPLICATE_SOURCE", "Source Dossier contains duplicate source " + source.id + ".");
      }
      source.receipts.forEach(function (receipt) {
        if (receiptSourceByKey.has(receipt.key)) {
          fail("DUPLICATE_GLOBAL_RECEIPT", "Receipt key " + receipt.key + " is not globally unique.");
        }
        receiptSourceByKey.set(receipt.key, source.id);
      });
      sourceById.set(source.id, source);
    });
    sources.forEach(function (source) {
      source.artifacts.forEach(function (artifact, artifactIndex) {
        var artifactPath = "sources[" + source._index + "].artifacts[" +
          artifactIndex + "]";
        artifact.sourceIds.forEach(function (sourceId, sourceIndex) {
          if (!sourceById.has(sourceId)) {
            fail("UNKNOWN_ARTIFACT_SOURCE",
              "Artifact " + artifact.id + " references unknown source " + sourceId + ".",
              artifactPath + ".sourceIds[" + sourceIndex + "]");
          }
        });
        artifact.receiptKeys.forEach(function (receiptKey, receiptIndex) {
          if (!receiptSourceByKey.has(receiptKey)) {
            fail("UNKNOWN_ARTIFACT_RECEIPT",
              "Artifact " + artifact.id + " references unknown receipt " + receiptKey + ".",
              artifactPath + ".receiptKeys[" + receiptIndex + "]");
          }
          if (receiptSourceByKey.get(receiptKey) !== source.id) {
            fail(
              "FOREIGN_ARTIFACT_RECEIPT",
              "Artifact " + artifact.id + " must keep receipt " + receiptKey +
                " on its owning source copy.",
              artifactPath + ".receiptKeys[" + receiptIndex + "]"
            );
          }
        });
        if (artifact.at != null && artifact.at > source.duration + 1) {
          fail(
            "ARTIFACT_OUT_OF_RANGE",
            "Artifact " + artifact.id + " is outside its source.",
            artifactPath + ".at"
          );
        }
        if (!artifactCopiesById.has(artifact.id)) {
          artifactCopiesById.set(artifact.id, []);
        }
        artifactCopiesById.get(artifact.id).push({
          sourceId: source.id,
          artifact: artifact,
          path: artifactPath
        });
      });
    });
    artifactCopiesById.forEach(function (copies, artifactId) {
      var ordered = copies.slice().sort(function (left, right) {
        return left.sourceId.localeCompare(right.sourceId);
      });
      var canonicalCopy = ordered[0];
      var declaredSourceIds = canonicalCopy.artifact.sourceIds.slice().sort();
      var canonicalIdentity = stableJson(artifactIdentity(canonicalCopy.artifact));

      ordered.forEach(function (copy) {
        if (stableJson(copy.artifact.sourceIds.slice().sort()) !==
            stableJson(declaredSourceIds)) {
          fail(
            "ARTIFACT_MEMBERSHIP_MISMATCH",
            "Artifact " + artifactId +
              " declares inconsistent cross-source memberships across owner copies.",
            copy.path + ".sourceIds"
          );
        }
        if (stableJson(artifactIdentity(copy.artifact)) !== canonicalIdentity) {
          fail(
            "ARTIFACT_IDENTITY_MISMATCH",
            "Artifact " + artifactId +
              " has inconsistent identity fields across owner copies.",
            copy.path
          );
        }
      });

      declaredSourceIds.forEach(function (sourceId) {
        if (!ordered.some(function (copy) { return copy.sourceId === sourceId; })) {
          fail(
            "MISSING_ARTIFACT_OWNER_COPY",
            "Artifact " + artifactId + " declares source " + sourceId +
              " without an owner copy on that source.",
            canonicalCopy.path + ".sourceIds"
          );
        }
      });
    });
    sources.forEach(function (source) {
      delete source._index;
      source.sourceFingerprint = sourceFingerprint(source);
    });
    sources.sort(function (left, right) {
      return right.date.localeCompare(left.date) || left.id.localeCompare(right.id);
    });
    var archiveFingerprint = fnv1a(stableJson({
      channel: channel,
      snapshotDate: snapshotDate,
      sources: sources.map(function (source) {
        return [source.id, source.sourceFingerprint];
      })
    }));
    var connectionsById = new Map();
    sources.forEach(function (source) {
      connectionsById.set(source.id, compileConnections(source, sources, sourceById));
    });
    var chronological = sources.slice().sort(function (left, right) {
      return left.date.localeCompare(right.date) || left.id.localeCompare(right.id);
    });
    var chronologicalIndex = new Map(chronological.map(function (source, index) {
      return [source.id, index];
    }));
    var stats = {
      sources: sources.length,
      coverage: summarizeBy(sources, "coverage"),
      authority: summarizeBy(sources, "authority"),
      receipts: sources.reduce(function (total, source) {
        return total + source.receipts.length;
      }, 0),
      entities: sources.reduce(function (total, source) {
        return total + source.entities.length;
      }, 0),
      artifacts: sources.reduce(function (total, source) {
        return total + source.artifacts.length;
      }, 0),
      connectedSources: sources.filter(function (source) {
        var compiled = connectionsById.get(source.id);
        return compiled && compiled.matchingTotal > 0;
      }).length,
      archiveFingerprint: archiveFingerprint
    };

    function build(sourceId) {
      var source = sourceById.get(clean(sourceId));
      if (!source) fail("UNKNOWN_SOURCE", "Source " + clean(sourceId) + " is not registered.");
      var index = chronologicalIndex.get(source.id);
      var previous = index > 0 ? chronological[index - 1] : null;
      var next = index < chronological.length - 1 ? chronological[index + 1] : null;
      var compiledConnections = connectionsById.get(source.id) || {
        matchingTotal: 0,
        displayed: 0,
        truncated: false,
        connections: []
      };
      var connections = compiledConnections.connections;
      var dossier = {
        schema: DOSSIER_SCHEMA,
        version: VERSION,
        bindings: {
          channelId: channel.id,
          channelLabel: channel.label,
          channelPackFingerprint: channel.packFingerprint,
          snapshotDate: snapshotDate,
          archiveFingerprint: archiveFingerprint
        },
        source: serial(source),
        proof: {
          coverage: source.coverage,
          authority: source.authority,
          sourceOnly: source.coverage === "metadata-only",
          captionLimited: source.coverage === "caption-limited",
          quarantined: source.authority === "quarantined-lane",
          speakerDiarized: false,
          creatorApproved: false,
          rightsCleared: false,
          canonPromotedByDossier: false,
          evidenceBoundary: source.coverage === "metadata-only" ?
            "Cached source metadata only. No topic, quote, character, sentiment, speaker, or content-summary claim is available." :
            source.coverage === "caption-limited" ?
              "The source is cataloged, but no usable caption-backed content receipt is available." :
              source.authority === "quarantined-lane" ?
                "Caption-derived navigation remains quarantined and non-promotable until the applicable human review." :
                "Source-bounded caption evidence. Speaker identity, intent, rights, and creator approval remain outside this dossier."
        },
        receiptSummary: {
          total: source.receipts.length,
          byKind: summarizeBy(source.receipts, "kind"),
          byEvidenceType: summarizeBy(source.receipts, "evidenceType")
        },
        artifactSummary: {
          total: source.artifacts.length,
          byKind: summarizeBy(source.artifacts, "kind"),
          byAuthority: summarizeBy(source.artifacts, "authority")
        },
        wake: {
          total: compiledConnections.matchingTotal,
          matchingTotal: compiledConnections.matchingTotal,
          displayed: compiledConnections.displayed,
          truncated: compiledConnections.truncated,
          later: connections.filter(function (connection) {
            return connection.direction === "later";
          }),
          earlier: connections.filter(function (connection) {
            return connection.direction !== "later";
          })
        },
        chronology: {
          previous: previous ? {
            sourceId: previous.id,
            title: previous.title,
            date: previous.date,
            sourceFingerprint: previous.sourceFingerprint
          } : null,
          next: next ? {
            sourceId: next.id,
            title: next.title,
            date: next.date,
            sourceFingerprint: next.sourceFingerprint
          } : null
        }
      };
      dossier.fingerprint = fnv1a(stableJson(dossier));
      return freezeDeep(dossier);
    }

    function exportManifest(sourceId) {
      var dossier = build(sourceId);
      return freezeDeep({
        schema: EXPORT_SCHEMA,
        version: VERSION,
        bindings: serial(dossier.bindings),
        dossierFingerprint: dossier.fingerprint,
        source: {
          id: dossier.source.id,
          title: dossier.source.title,
          date: dossier.source.date,
          duration: dossier.source.duration,
          coverage: dossier.source.coverage,
          authority: dossier.source.authority,
          sourceFingerprint: dossier.source.sourceFingerprint,
          officialUrl: dossier.source.url,
          exactSourceHold: serial(dossier.source.exactSourceHold),
          officialAlternate: serial(dossier.source.officialAlternate)
        },
        receipts: dossier.source.receipts.map(function (receipt) {
          return {
            key: receipt.key,
            at: receipt.at,
            end: receipt.end,
            kind: receipt.kind,
            evidenceType: receipt.evidenceType,
            evidenceLevel: receipt.evidenceLevel,
            reviewState: receipt.reviewState,
            speaker: null,
            speakerStatus: "not-diarized",
            signalScore: receipt.signalScore,
            signalBasis: receipt.signalBasis,
            entityIds: receipt.entityIds.slice(),
            url: receipt.url
          };
        }),
        entities: dossier.source.entities.map(function (entity) {
          return {
            id: entity.id,
            type: entity.type,
            basis: entity.basis,
            receiptKeys: entity.receiptKeys.slice()
          };
        }),
        artifacts: dossier.source.artifacts.map(function (artifact) {
          return {
            id: artifact.id,
            kind: artifact.kind,
            authority: artifact.authority,
            reviewState: artifact.reviewState,
            sourceIds: artifact.sourceIds.slice(),
            receiptKeys: artifact.receiptKeys.slice()
          };
        }),
        connections: dossier.wake.later.concat(dossier.wake.earlier).map(function (connection) {
          return {
            sourceId: connection.sourceId,
            sourceFingerprint: connection.sourceFingerprint,
            basis: connection.basis,
            entityIds: connection.sharedEntities.map(function (entity) { return entity.id; }),
            artifactIds: connection.artifactIds.slice()
          };
        }),
        omissions: [
          "transcript payloads",
          "caption excerpts",
          "generated summaries",
          "speaker fields beyond explicit null",
          "media"
        ]
      });
    }

    return freezeDeep({
      engine: "SHOKKER SOURCE DOSSIER",
      version: VERSION,
      schema: DOSSIER_SCHEMA,
      archiveFingerprint: archiveFingerprint,
      channel: serial(channel),
      snapshotDate: snapshotDate,
      has: function (sourceId) {
        return sourceById.has(clean(sourceId));
      },
      getStats: function () {
        return serial(stats);
      },
      list: function () {
        return sources.map(function (source) {
          return {
            id: source.id,
            title: source.title,
            date: source.date,
            coverage: source.coverage,
            authority: source.authority,
            sourceFingerprint: source.sourceFingerprint
          };
        });
      },
      build: build,
      exportManifest: exportManifest
    });
  }

  root.ShokkerSourceDossier = freezeDeep({
    VERSION: VERSION,
    INPUT_SCHEMA: INPUT_SCHEMA,
    DOSSIER_SCHEMA: DOSSIER_SCHEMA,
    EXPORT_SCHEMA: EXPORT_SCHEMA,
    COVERAGE: Object.keys(COVERAGE),
    AUTHORITY: Object.keys(AUTHORITY),
    ENTITY_BASIS: Object.keys(ENTITY_BASIS),
    ACTION_AUTHORITY: Object.keys(ACTION_AUTHORITY),
    create: create
  });
})(typeof window !== "undefined" ? window : globalThis);
