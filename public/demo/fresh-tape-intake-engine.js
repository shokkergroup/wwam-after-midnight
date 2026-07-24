(function (root, factory) {
  "use strict";

  var api = factory(root && root.ShokkerChannelPack);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.ShokkerFreshTapeIntakeEngine = api;
    root.WWAMFreshTapeIntakeEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function (channelPackContract) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker.fresh-tape-intake/v1";
  var FINGERPRINT_PREFIX = "fti1";
  var YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
  var RULE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var SUPPORTED_FORMATS = Object.freeze([
    "webvtt",
    "srt",
    "youtube-json3",
    "plain-text"
  ]);
  var HARD_LIMITS = Object.freeze({
    maxBytes: 2000000,
    maxEvents: 50000,
    maxTimestampSeconds: 86400,
    maxDurationSeconds: 86400,
    maxWordsPerEvent: 200,
    maxCharactersPerWord: 256,
    maxCharactersPerEvent: 12000,
    maxExcerptCharacters: 1200,
    maxTotalWords: 500000,
    maxCandidates: 100000,
    maxRulesPerKind: 100,
    maxTermsPerRule: 25,
    maxTermCharacters: 80,
    maxTitleCharacters: 240
  });

  function FreshTapeIntakeError(code, message, details) {
    this.name = "FreshTapeIntakeError";
    this.code = code;
    this.message = message;
    this.details = details || null;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FreshTapeIntakeError);
    }
  }
  FreshTapeIntakeError.prototype = Object.create(Error.prototype);
  FreshTapeIntakeError.prototype.constructor = FreshTapeIntakeError;

  function fail(code, message, details) {
    throw new FreshTapeIntakeError(code, message, details);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function ownValue(value, key) {
    return own(value, key) ? value[key] : undefined;
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function clean(value) {
    return text(value).replace(/\s+/g, " ").trim();
  }

  function inertText(value) {
    return clean(
      text(value)
        .replace(/\u0000/g, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/[<>]/g, " ")
    );
  }

  function normalized(value) {
    return inertText(value)
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

  function round(value, digits) {
    var power = Math.pow(10, digits == null ? 3 : digits);
    return Math.round(number(value) * power) / power;
  }

  function words(value) {
    return inertText(value).split(/\s+/).filter(Boolean);
  }

  function serialCopy(value) {
    var serialized = JSON.stringify(value);
    return serialized === undefined ? undefined : JSON.parse(serialized);
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce(function (result, key) {
          if (value[key] !== undefined && typeof value[key] !== "function") {
            result[key] = stableValue(value[key]);
          }
          return result;
        }, Object.create(null));
    }
    return value;
  }

  function stableJson(value, indentation) {
    return JSON.stringify(
      stableValue(value),
      null,
      indentation == null ? 0 : indentation
    );
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function (key) {
      deepFreeze(value[key]);
    });
    return value;
  }

  function hash32(value, seed) {
    var hash = seed >>> 0;
    for (var index = 0; index < value.length; index += 1) {
      var code = value.charCodeAt(index);
      hash ^= code & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= code >>> 8;
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  function hex(value) {
    return value.toString(16).padStart(8, "0");
  }

  function compareText(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
  }

  function fingerprint(prefix, value) {
    var canonical = typeof value === "string" ? value : stableJson(value);
    var first = hash32(canonical, 0x811c9dc5);
    var second = hash32(prefix + "\u0000" + canonical, 0x9e3779b9);
    return prefix + "-" + hex(first) + hex(second);
  }

  function channelPackFingerprint(payload) {
    var canonical = stableJson(payload);
    var first = hash32(canonical, 0x811c9dc5);
    var second = hash32("channel-pack\u0000" + canonical, 0x9e3779b9);
    return "cp1-" + hex(first) + hex(second);
  }

  function utf8Bytes(value) {
    var source = text(value);
    var count = 0;
    for (var index = 0; index < source.length; index += 1) {
      var code = source.charCodeAt(index);
      if (code < 0x80) {
        count += 1;
      } else if (code < 0x800) {
        count += 2;
      } else if (code >= 0xd800 && code <= 0xdbff &&
          index + 1 < source.length &&
          source.charCodeAt(index + 1) >= 0xdc00 &&
          source.charCodeAt(index + 1) <= 0xdfff) {
        count += 4;
        index += 1;
      } else {
        count += 3;
      }
    }
    return count;
  }

  function unknownKeys(value, allowed) {
    return Object.keys(object(value)).filter(function (key) {
      return allowed.indexOf(key) < 0;
    });
  }

  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function exactKeys(value, expected) {
    if (!isRecord(value)) return false;
    var keys = Object.keys(value).sort();
    var wanted = expected.slice().sort();
    return stableJson(keys) === stableJson(wanted);
  }

  function sameValue(left, right) {
    return stableJson(left) === stableJson(right);
  }

  function boundedInteger(value, minimum, maximum) {
    return Number.isInteger(value) && value >= minimum && value <= maximum;
  }

  function validFingerprint(value, prefix) {
    return new RegExp("^" + prefix + "-[0-9a-f]{16}$").test(text(value));
  }

  function issue(list, code, path, message) {
    list.push({
      code: code,
      path: path,
      message: message
    });
  }

  function normalizeLimits(input) {
    var supplied = object(input);
    var unsupported = unknownKeys(supplied, Object.keys(HARD_LIMITS));
    if (unsupported.length) {
      fail("INVALID_LIMITS", "Fresh Tape Intake limits contain unsupported fields.", {
        fields: unsupported.sort()
      });
    }
    var output = {};
    Object.keys(HARD_LIMITS).forEach(function (key) {
      var value = own(supplied, key) ? Number(supplied[key]) : HARD_LIMITS[key];
      if (!Number.isInteger(value) || value < 1 || value > HARD_LIMITS[key]) {
        fail(
          "INVALID_LIMITS",
          key + " must be a positive integer no greater than the engine hard limit.",
          { key: key, hardLimit: HARD_LIMITS[key] }
        );
      }
      output[key] = value;
    });
    if (output.maxExcerptCharacters < output.maxCharactersPerWord ||
        output.maxCharactersPerEvent < output.maxCharactersPerWord) {
      fail(
        "INVALID_LIMITS",
        "Character limits must preserve room for at least one bounded word."
      );
    }
    return output;
  }

  function verifyCompiledChannelPack(pack) {
    var issues = [];
    if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
      fail("INVALID_CHANNEL_PACK", "Fresh Tape Intake requires a compiled ChannelPack.");
    }
    if (channelPackContract && typeof channelPackContract.validate === "function") {
      var report = channelPackContract.validate(pack);
      if (!report.valid || report.fingerprintVerified !== true) {
        fail(
          "INVALID_CHANNEL_PACK",
          "Fresh Tape Intake rejected an invalid compiled ChannelPack.",
          { issues: serialCopy(report.issues) }
        );
      }
      return;
    }

    if (pack.$schema !== "channel-pack-spec.json" ||
        pack.schemaVersion !== "1.0.0" ||
        pack.contractVersion !== "1.0.0") {
      issue(issues, "unsupported-contract", "channelPack", "Unsupported ChannelPack contract.");
    }
    if (!object(pack.identity).id ||
        !Array.isArray(pack.sourceLanes) ||
        !pack.sourceLanes.length) {
      issue(issues, "missing-boundary", "channelPack", "Channel identity and source lanes are required.");
    }
    var policy = object(pack.evidencePolicy);
    if (policy.machineOutputState !== "quarantine" ||
        policy.promotionRequiresHumanReview !== true ||
        policy.timestampRequired !== true ||
        policy.sourceUrlRequired !== true ||
        policy.noSpeakerGuessing !== true ||
        policy.generatedCharacterAudioAllowed !== false ||
        !Number.isInteger(policy.publicExcerptWords) ||
        policy.publicExcerptWords < 1 ||
        policy.publicExcerptWords > 25) {
      issue(issues, "unsafe-evidence-policy", "channelPack.evidencePolicy",
        "The ChannelPack does not preserve the intake safety boundary.");
    }
    var payload = serialCopy(pack);
    var suppliedFingerprint = clean(payload.fingerprint);
    delete payload.fingerprint;
    if (!suppliedFingerprint ||
        suppliedFingerprint !== channelPackFingerprint(payload)) {
      issue(issues, "fingerprint-mismatch", "channelPack.fingerprint",
        "The ChannelPack fingerprint does not match its payload.");
    }
    if (issues.length) {
      fail(
        "INVALID_CHANNEL_PACK",
        "Fresh Tape Intake rejected an invalid compiled ChannelPack.",
        { issues: issues }
      );
    }
  }

  function normalizeRule(rule, kind, index, limits) {
    var value = object(rule);
    var extra = unknownKeys(value, ["id", "label", "terms"]);
    if (extra.length) {
      fail("INVALID_RULE", "Intake rules contain unsupported fields.", {
        kind: kind,
        index: index,
        fields: extra.sort()
      });
    }
    var suppliedId = ownValue(value, "id");
    var suppliedLabel = ownValue(value, "label");
    if (typeof suppliedId !== "string" || typeof suppliedLabel !== "string") {
      fail("INVALID_RULE", "Every rule ID and label must be strings.", {
        kind: kind,
        index: index
      });
    }
    var id = clean(suppliedId);
    var label = inertText(suppliedLabel);
    if (!RULE_ID_PATTERN.test(id)) {
      fail("INVALID_RULE", "Every rule ID must be lowercase kebab-case.", {
        kind: kind,
        index: index
      });
    }
    if (!label || label.length > 120) {
      fail("INVALID_RULE", "Every rule needs a short, inert public label.", {
        kind: kind,
        index: index
      });
    }
    var suppliedTerms = ownValue(value, "terms");
    if (!Array.isArray(suppliedTerms) ||
        !suppliedTerms.length ||
        suppliedTerms.length > limits.maxTermsPerRule) {
      fail("INVALID_RULE", "Every rule needs a bounded list of literal terms.", {
        kind: kind,
        index: index
      });
    }
    var terms = suppliedTerms.map(function (term, termIndex) {
      if (typeof term !== "string") {
        fail("INVALID_RULE", "Every rule term must be a string.", {
          kind: kind,
          index: index,
          termIndex: termIndex
        });
      }
      var cleaned = normalized(term);
      if (!cleaned || cleaned.length > limits.maxTermCharacters) {
        fail("INVALID_RULE", "Every rule term must normalize to a bounded literal phrase.", {
          kind: kind,
          index: index,
          termIndex: termIndex
        });
      }
      return cleaned;
    }).sort();
    terms = Array.from(new Set(terms));
    if (!terms.length) {
      fail("INVALID_RULE", "Every rule needs at least one unique literal term.", {
        kind: kind,
        index: index
      });
    }
    return {
      id: id,
      kind: kind,
      label: label,
      terms: terms,
      matchMethod: "normalized-literal-phrase"
    };
  }

  function normalizeRules(input, limits) {
    var supplied = object(input);
    var extra = unknownKeys(supplied, ["topics", "signals"]);
    if (extra.length) {
      fail("INVALID_RULES", "Fresh Tape Intake rules contain unsupported groups.", {
        fields: extra.sort()
      });
    }
    var topics = array(ownValue(supplied, "topics"));
    var signals = array(ownValue(supplied, "signals"));
    if (!topics.length && !signals.length) {
      fail(
        "RULES_REQUIRED",
        "Fresh Tape Intake requires at least one explicit topic or signal rule."
      );
    }
    if (topics.length > limits.maxRulesPerKind ||
        signals.length > limits.maxRulesPerKind) {
      fail("RULE_LIMIT_EXCEEDED", "Fresh Tape Intake received too many rules.");
    }
    var output = {
      topics: topics.map(function (rule, index) {
        return normalizeRule(rule, "topic", index, limits);
      }),
      signals: signals.map(function (rule, index) {
        return normalizeRule(rule, "signal", index, limits);
      })
    };
    ["topics", "signals"].forEach(function (key) {
      var ids = output[key].map(function (rule) {
        return rule.id;
      });
      if (new Set(ids).size !== ids.length) {
        fail("DUPLICATE_RULE", "Rule IDs must be unique within each rule kind.", {
          kind: key
        });
      }
      output[key].sort(function (left, right) {
        return compareText(left.id, right.id);
      });
    });
    return output;
  }

  function youtubeIdFromUrl(value) {
    var url = clean(value);
    var match = url.match(
      /^https:\/\/(?:www\.|m\.)?youtube\.com\/(?:live|embed|shorts)\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/i
    );
    if (match) return match[1];
    match = url.match(
      /^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[?#].*)?$/i
    );
    if (match) return match[1];
    match = url.match(
      /^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?([^#]+)(?:#.*)?$/i
    );
    if (!match) return "";
    var parts = match[1].split("&");
    var ids = [];
    for (var index = 0; index < parts.length; index += 1) {
      var pair = parts[index].split("=");
      var key;
      var entry;
      try {
        key = decodeURIComponent(pair.shift() || "");
        entry = decodeURIComponent(pair.join("=") || "");
      } catch {
        return "";
      }
      if (key === "v") ids.push(entry);
    }
    return ids.length === 1 && YOUTUBE_ID_PATTERN.test(ids[0]) ? ids[0] : "";
  }

  function validDate(value) {
    var cleaned = clean(value);
    var match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }

  function normalizeSource(input, channelPack, limits) {
    var source = object(input);
    var extra = unknownKeys(source, [
      "id",
      "sourceId",
      "videoId",
      "url",
      "date",
      "durationSeconds",
      "duration",
      "lane",
      "title"
    ]);
    if (extra.length) {
      fail("INVALID_SOURCE", "Fresh Tape Intake source metadata contains unsupported fields.", {
        fields: extra.sort()
      });
    }
    var rawSourceIds = [
      ownValue(source, "id"),
      ownValue(source, "sourceId"),
      ownValue(source, "videoId")
    ];
    if (rawSourceIds.some(function (value) {
      return value != null && typeof value !== "string";
    })) {
      fail("INVALID_SOURCE_ID", "Source ID fields must be strings.");
    }
    var sourceIds = rawSourceIds
      .map(clean)
      .filter(Boolean);
    if (new Set(sourceIds).size > 1) {
      fail("SOURCE_ID_MISMATCH", "Conflicting source ID fields were supplied.");
    }
    var id = sourceIds[0] || "";
    var suppliedUrl = ownValue(source, "url");
    var suppliedTitle = ownValue(source, "title");
    var suppliedLane = ownValue(source, "lane");
    var suppliedDate = ownValue(source, "date");
    if ([suppliedUrl, suppliedTitle, suppliedLane, suppliedDate].some(function (value) {
      return typeof value !== "string";
    })) {
      fail("INVALID_SOURCE", "Source URL, title, date, and lane must be strings.");
    }
    var url = clean(suppliedUrl);
    var urlId = youtubeIdFromUrl(url);
    var title = inertText(suppliedTitle);
    var lane = clean(suppliedLane);
    var date = clean(suppliedDate);
    var suppliedDurationSeconds = ownValue(source, "durationSeconds");
    var suppliedDuration = ownValue(source, "duration");
    var durationInput =
      suppliedDurationSeconds == null ? suppliedDuration : suppliedDurationSeconds;
    if ((typeof durationInput !== "number" && typeof durationInput !== "string") ||
        (typeof durationInput === "string" &&
          !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(durationInput.trim()))) {
      fail("INVALID_SOURCE_DURATION", "Source duration must be a decimal number.");
    }
    var duration = Number(durationInput);
    if (suppliedDurationSeconds != null &&
        suppliedDuration != null &&
        Number(suppliedDurationSeconds) !== Number(suppliedDuration)) {
      fail("INVALID_SOURCE_DURATION", "Conflicting source duration fields were supplied.");
    }
    if (!YOUTUBE_ID_PATTERN.test(id)) {
      fail("INVALID_SOURCE_ID", "Source ID must be an exact 11-character YouTube video ID.");
    }
    if (!urlId) {
      fail("INVALID_SOURCE_URL", "Source URL must be an official HTTPS YouTube video URL.");
    }
    if (urlId !== id) {
      fail("SOURCE_ID_MISMATCH", "Source ID does not match the YouTube URL.", {
        sourceId: id,
        urlSourceId: urlId
      });
    }
    if (!validDate(date)) {
      fail("INVALID_SOURCE_DATE", "Source date must be a real YYYY-MM-DD calendar date.");
    }
    if (!Number.isFinite(duration) ||
        duration <= 0 ||
        duration > limits.maxDurationSeconds) {
      fail("INVALID_SOURCE_DURATION", "Source duration is outside the configured boundary.", {
        maxDurationSeconds: limits.maxDurationSeconds
      });
    }
    duration = round(duration);
    if (duration <= 0 || duration > limits.maxDurationSeconds) {
      fail("INVALID_SOURCE_DURATION", "Source duration loses its valid boundary after normalization.", {
        maxDurationSeconds: limits.maxDurationSeconds
      });
    }
    var laneRecord = array(channelPack.sourceLanes).filter(function (candidate) {
      return clean(candidate && candidate.id) === lane;
    })[0];
    if (!laneRecord) {
      fail("INVALID_SOURCE_LANE", "Source lane is not declared by this ChannelPack.", {
        lane: lane
      });
    }
    if (!title || title.length > limits.maxTitleCharacters) {
      fail("INVALID_SOURCE_TITLE", "Source title is missing or exceeds the configured boundary.");
    }
    return {
      id: id,
      url: "https://www.youtube.com/watch?v=" + id,
      title: title,
      date: date,
      durationSeconds: duration,
      lane: lane,
      laneLabel: inertText(laneRecord.label),
      officialYouTubeUrlValidated: true,
      channelOwnershipVerified: false,
      authorityStatus: "channel-ownership-unverified"
    };
  }

  function normalizeFormat(value) {
    if (typeof value !== "string") {
      fail("UNSUPPORTED_FORMAT", "Transcript format must be a supported string.", {
        supportedFormats: SUPPORTED_FORMATS.slice()
      });
    }
    var format = clean(value).toLowerCase();
    if (format === "vtt") format = "webvtt";
    if (format === "json3") format = "youtube-json3";
    if (format === "plain" || format === "text") format = "plain-text";
    if (SUPPORTED_FORMATS.indexOf(format) < 0) {
      fail("UNSUPPORTED_FORMAT", "Fresh Tape Intake does not support this transcript format.", {
        supportedFormats: SUPPORTED_FORMATS.slice()
      });
    }
    return format;
  }

  function parseClock(value) {
    var source = clean(value).replace(",", ".");
    var match = source.match(/^(\d{1,3}:)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (!match) return null;
    var hours = match[1] ? Number(match[1].slice(0, -1)) : 0;
    var minutes = Number(match[2]);
    var seconds = Number(match[3]);
    var milliseconds = Number((match[4] || "").padEnd(3, "0"));
    if (minutes >= 60 || seconds >= 60) return null;
    return round(hours * 3600 + minutes * 60 + seconds + milliseconds / 1000);
  }

  function parseCueText(lines) {
    return inertText(lines.join(" "));
  }

  function parseTimedText(payload, format) {
    var lines = text(payload).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
    var events = [];
    var index = 0;
    while (index < lines.length) {
      var line = lines[index].trim();
      if (!line) {
        index += 1;
        continue;
      }
      if (format === "webvtt" && (
        /^WEBVTT(?:\s|$)/i.test(line) ||
        /^(?:Kind|Language):/i.test(line)
      )) {
        index += 1;
        continue;
      }
      if (/^(?:NOTE|STYLE|REGION)(?:\s|$)/i.test(line)) {
        index += 1;
        while (index < lines.length && lines[index].trim()) index += 1;
        continue;
      }
      if (!line.includes("-->") &&
          index + 1 < lines.length &&
          lines[index + 1].includes("-->")) {
        index += 1;
        line = lines[index].trim();
      }
      if (!line.includes("-->")) {
        index += 1;
        continue;
      }
      var timing = line.split("-->");
      if (timing.length !== 2) {
        fail("MALFORMED_CAPTIONS", "A caption cue contains an invalid timing boundary.", {
          line: index + 1
        });
      }
      var start = parseClock(timing[0]);
      var endToken = timing[1].trim().split(/\s+/)[0];
      var end = parseClock(endToken);
      if (start == null || end == null || end < start) {
        fail("MALFORMED_CAPTIONS", "A caption cue contains an invalid timestamp.", {
          line: index + 1
        });
      }
      index += 1;
      var cueLines = [];
      while (index < lines.length && lines[index].trim()) {
        cueLines.push(lines[index]);
        index += 1;
      }
      var cueText = parseCueText(cueLines);
      if (cueText) {
        events.push({
          start: start,
          end: end,
          text: cueText
        });
      }
    }
    if (!events.length) {
      fail("NO_TIMED_EVENTS", "The timed transcript contains no usable caption events.");
    }
    return events;
  }

  function parseJson3Content(payload) {
    var value = payload;
    if (typeof payload === "string") {
      try {
        value = JSON.parse(payload);
      } catch {
        fail("MALFORMED_JSON3", "YouTube JSON3 input is not valid JSON.");
      }
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail("MALFORMED_JSON3", "YouTube JSON3 input must be an object.");
    }
    var suppliedEvents = ownValue(value, "events");
    if (!Array.isArray(suppliedEvents)) {
      fail("MALFORMED_JSON3", "YouTube JSON3 input is missing its events array.");
    }
    var events = suppliedEvents.map(function (event, index) {
      var candidate = object(event);
      var cueText = inertText(array(ownValue(candidate, "segs")).map(function (segment) {
        var segmentText = ownValue(object(segment), "utf8");
        if (segmentText != null && typeof segmentText !== "string") {
          fail("MALFORMED_JSON3", "A YouTube JSON3 caption segment must contain text.", {
            index: index
          });
        }
        return segmentText;
      }).join(""));
      if (!cueText) return null;
      var rawStartMs = ownValue(candidate, "tStartMs");
      var rawDurationMs = ownValue(candidate, "dDurationMs");
      if (typeof rawStartMs !== "number" ||
          typeof rawDurationMs !== "number") {
        fail("MALFORMED_JSON3", "A YouTube JSON3 event timestamp must be a number.", {
          index: index
        });
      }
      var startMs = rawStartMs;
      var durationMs = rawDurationMs;
      if (!Number.isFinite(startMs) || startMs < 0 ||
          !Number.isInteger(startMs) ||
          !Number.isFinite(durationMs) || durationMs < 0 ||
          !Number.isInteger(durationMs)) {
        fail("MALFORMED_JSON3", "A YouTube JSON3 event has an invalid timestamp.", {
          index: index
        });
      }
      return {
        start: round(startMs / 1000),
        end: round((startMs + durationMs) / 1000),
        text: cueText
      };
    }).filter(Boolean);
    if (!events.length) {
      fail("NO_TIMED_EVENTS", "The YouTube JSON3 payload contains no usable caption events.");
    }
    var rawDeclaredIds = [
      ownValue(value, "sourceId"),
      ownValue(value, "videoId")
    ];
    if (rawDeclaredIds.some(function (id) {
      return id != null && typeof id !== "string";
    })) {
      fail("SOURCE_ID_MISMATCH", "YouTube JSON3 source IDs must be strings.");
    }
    var declaredIds = rawDeclaredIds.map(clean).filter(Boolean);
    if (new Set(declaredIds).size > 1) {
      fail("SOURCE_ID_MISMATCH", "YouTube JSON3 contains conflicting source IDs.");
    }
    return {
      events: events,
      declaredSourceId: declaredIds[0] || ""
    };
  }

  function payloadText(content, format) {
    if (typeof content === "string") return content;
    if (format !== "youtube-json3") {
      fail("INVALID_TRANSCRIPT", "Timed text and plain-text input must be supplied as a string.");
    }
    try {
      return stableJson(content);
    } catch {
      fail("INVALID_TRANSCRIPT", "Transcript input cannot be serialized.");
    }
  }

  function eventLedger(rawEvents, source, limits) {
    if (rawEvents.length > limits.maxEvents) {
      fail("EVENT_LIMIT_EXCEEDED", "Transcript event count exceeds the configured boundary.", {
        eventCount: rawEvents.length,
        maxEvents: limits.maxEvents
      });
    }
    var rawWordCount = 0;
    var normalizedEvents = rawEvents.map(function (event, index) {
      var start = round(event.start);
      var end = round(event.end);
      var eventText = inertText(event.text);
      var eventWords = words(eventText);
      if (!Number.isFinite(start) ||
          !Number.isFinite(end) ||
          start < 0 ||
          end < start ||
          start > limits.maxTimestampSeconds ||
          end > limits.maxTimestampSeconds ||
          start > source.durationSeconds ||
          end > source.durationSeconds) {
        fail("TIMESTAMP_OUT_OF_RANGE", "A transcript event falls outside the source boundary.", {
          index: index,
          start: start,
          end: end,
          durationSeconds: source.durationSeconds
        });
      }
      if (eventWords.length > limits.maxWordsPerEvent) {
        fail("WORD_LIMIT_EXCEEDED", "A transcript event exceeds the per-event word boundary.", {
          index: index,
          wordCount: eventWords.length,
          maxWordsPerEvent: limits.maxWordsPerEvent
        });
      }
      if (eventText.length > limits.maxCharactersPerEvent ||
          eventWords.some(function (word) {
            return word.length > limits.maxCharactersPerWord;
          })) {
        fail("CHARACTER_LIMIT_EXCEEDED",
          "A transcript event exceeds the per-event character boundary.", {
            index: index,
            characters: eventText.length,
            maxCharactersPerEvent: limits.maxCharactersPerEvent,
            maxCharactersPerWord: limits.maxCharactersPerWord
          });
      }
      rawWordCount += eventWords.length;
      if (rawWordCount > limits.maxTotalWords) {
        fail("WORD_LIMIT_EXCEEDED", "Transcript word count exceeds the configured boundary.", {
          wordCount: rawWordCount,
          maxTotalWords: limits.maxTotalWords
        });
      }
      return {
        start: start,
        end: end,
        text: eventWords.join(" ")
      };
    });
    normalizedEvents.sort(function (left, right) {
      return left.start - right.start ||
        left.end - right.end ||
        compareText(left.text, right.text);
    });
    var seen = new Set();
    var unique = [];
    normalizedEvents.forEach(function (event) {
      var key = stableJson(event);
      if (seen.has(key)) return;
      seen.add(key);
      var contentFingerprint = fingerprint("ftx1", event.text);
      unique.push({
        id: fingerprint("fte1", {
          start: event.start,
          end: event.end,
          contentFingerprint: contentFingerprint
        }),
        start: event.start,
        end: event.end,
        text: event.text,
        contentFingerprint: contentFingerprint,
        normalizedText: normalized(event.text)
      });
    });
    return {
      events: unique,
      rawEventCount: rawEvents.length,
      uniqueEventCount: unique.length,
      duplicatesRemoved: rawEvents.length - unique.length,
      rawWordCount: rawWordCount,
      uniqueWordCount: unique.reduce(function (total, event) {
        return total + words(event.text).length;
      }, 0),
      fingerprint: fingerprint("ftl1", unique.map(function (event) {
        return {
          id: event.id,
          start: event.start,
          end: event.end,
          text: event.text
        };
      }))
    };
  }

  function boundedExcerpt(value, limit, characterLimit) {
    var tokens = words(value);
    var selected = [];
    for (var index = 0; index < tokens.length && selected.length < limit; index += 1) {
      var next = selected.concat(tokens[index]).join(" ");
      if (next.length > characterLimit) break;
      selected.push(tokens[index]);
    }
    var truncated = selected.length < tokens.length;
    return {
      text: selected.join(" ") + (truncated ? " \u2026" : ""),
      wordCount: selected.length,
      sourceWordCount: tokens.length,
      wordLimit: limit,
      characterCount: selected.join(" ").length,
      characterLimit: characterLimit,
      truncated: truncated
    };
  }

  function termMatches(normalizedText, term) {
    return (" " + normalizedText + " ").includes(" " + term + " ");
  }

  function candidateFor(rule, event, source, excerptLimit, excerptCharacterLimit,
      quarantineLabel) {
    var matches = rule.terms.filter(function (term) {
      return termMatches(event.normalizedText, term);
    });
    if (!matches.length) return null;
    var candidateKey = {
      kind: rule.kind,
      ruleId: rule.id,
      sourceId: source.id,
      eventId: event.id,
      at: event.start
    };
    return {
      id: fingerprint("ftc1", candidateKey),
      kind: rule.kind,
      ruleId: rule.id,
      label: rule.label,
      sourceId: source.id,
      sourceDate: source.date,
      lane: source.lane,
      at: event.start,
      end: event.end,
      timecodeUrl: source.url + "&t=" + Math.floor(event.start) + "s",
      excerpt: boundedExcerpt(event.text, excerptLimit, excerptCharacterLimit),
      derivation: {
        method: rule.matchMethod,
        matchedTerms: matches,
        eventFingerprint: event.id,
        contentFingerprint: event.contentFingerprint,
        publicExcerptFingerprint: fingerprint(
          "ftx1",
          boundedExcerpt(event.text, excerptLimit, excerptCharacterLimit)
        )
      },
      state: "quarantine",
      publicStateLabel: quarantineLabel,
      reviewStatus: "unreviewed",
      machineSurfaced: true,
      promotionAllowed: false,
      speaker: null,
      speakerStatus: "not-diarized",
      authenticatedReviewCount: 0,
      authenticatedCertificationCount: 0
    };
  }

  function deriveCandidates(ledger, source, rules, excerptLimit, quarantineLabel, limits) {
    var candidates = [];
    ledger.events.forEach(function (event) {
      rules.topics.concat(rules.signals).forEach(function (rule) {
        var candidate = candidateFor(
          rule,
          event,
          source,
          excerptLimit,
          limits.maxExcerptCharacters,
          quarantineLabel
        );
        if (!candidate) return;
        candidates.push(candidate);
        if (candidates.length > limits.maxCandidates) {
          fail("CANDIDATE_LIMIT_EXCEEDED",
            "Derived candidate count exceeds the configured boundary.", {
              maxCandidates: limits.maxCandidates
            });
        }
      });
    });
    candidates.sort(function (left, right) {
      return left.at - right.at ||
        compareText(left.kind, right.kind) ||
        compareText(left.ruleId, right.ruleId) ||
        compareText(left.id, right.id);
    });
    return candidates;
  }

  function buildEvidenceLedger(ledger, candidates, excerptLimit, excerptCharacterLimit) {
    var candidateEvents = Object.create(null);
    candidates.forEach(function (candidate) {
      var eventId = candidate.derivation.eventFingerprint;
      var ruleId = candidate.kind + ":" + candidate.ruleId;
      if (!candidateEvents[eventId]) candidateEvents[eventId] = Object.create(null);
      candidateEvents[eventId][ruleId] = candidate.derivation.matchedTerms.slice();
    });
    var entries = ledger.events.filter(function (event) {
      return !!candidateEvents[event.id];
    }).map(function (event) {
      return {
        eventFingerprint: event.id,
        start: event.start,
        end: event.end,
        contentFingerprint: event.contentFingerprint,
        publicExcerptFingerprint: fingerprint(
          "ftx1",
          boundedExcerpt(event.text, excerptLimit, excerptCharacterLimit)
        ),
        matchedRuleIds: Object.keys(candidateEvents[event.id]).sort(),
        matchedRuleTerms: Object.keys(candidateEvents[event.id]).sort().map(function (ruleId) {
          return {
            ruleId: ruleId,
            terms: candidateEvents[event.id][ruleId].slice()
          };
        })
      };
    }).sort(function (left, right) {
      return left.start - right.start ||
        left.end - right.end ||
        compareText(left.eventFingerprint, right.eventFingerprint);
    });
    return {
      scope: "candidate-events-only",
      rawTextRetained: false,
      entries: entries,
      fingerprint: fingerprint("ftel1", entries)
    };
  }

  function parseArtifact(payload) {
    if (typeof payload === "string") {
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
    try {
      return serialCopy(payload);
    } catch {
      return null;
    }
  }

  function artifactFingerprint(artifact) {
    var payload = serialCopy(artifact);
    delete payload.fingerprint;
    return fingerprint(FINGERPRINT_PREFIX, payload);
  }

  function create(options) {
    var settings = object(options);
    var extra = unknownKeys(settings, ["channelPack", "rules", "limits"]);
    if (extra.length) {
      fail("INVALID_OPTIONS", "Fresh Tape Intake received unsupported options.", {
        fields: extra.sort()
      });
    }
    var channelPack;
    try {
      channelPack = serialCopy(settings.channelPack);
    } catch {
      fail("INVALID_CHANNEL_PACK", "Fresh Tape Intake could not snapshot the ChannelPack.");
    }
    verifyCompiledChannelPack(channelPack);
    if (array(channelPack.capabilities).indexOf("fresh-tape-intake") < 0) {
      fail(
        "CAPABILITY_NOT_DECLARED",
        "The compiled ChannelPack does not declare the fresh-tape-intake capability."
      );
    }
    var limits = normalizeLimits(settings.limits);
    var rules = normalizeRules(ownValue(settings, "rules"), limits);
    var channelId = clean(channelPack.identity.id);
    var packFingerprint = clean(channelPack.fingerprint);
    var excerptLimit = Number(channelPack.evidencePolicy.publicExcerptWords);
    var quarantineLabel = inertText(channelPack.surfaceVocabulary.quarantine);
    var rulesFingerprint = fingerprint("ftr1", rules);
    var laneIds = array(channelPack.sourceLanes).map(function (lane) {
      return clean(lane.id);
    }).sort();
    var binding = {
      channelId: channelId,
      channelPackFingerprint: packFingerprint,
      channelPackContractVersion: clean(channelPack.contractVersion),
      storageNamespace: clean(channelPack.storage.namespace),
      rulesFingerprint: rulesFingerprint,
      sourceLanes: laneIds
    };

    function buildArtifact(input) {
      var request = object(input);
      var requestExtra = unknownKeys(request, ["source", "transcript"]);
      if (requestExtra.length) {
        fail("INVALID_INTAKE", "Fresh Tape Intake received unsupported intake fields.", {
          fields: requestExtra.sort()
        });
      }
      var source = normalizeSource(ownValue(request, "source"), channelPack, limits);
      var transcript = object(ownValue(request, "transcript"));
      var transcriptExtra = unknownKeys(transcript, [
        "format",
        "content",
        "sourceId",
        "videoId"
      ]);
      if (transcriptExtra.length) {
        fail("INVALID_TRANSCRIPT", "Transcript input contains unsupported fields.", {
          fields: transcriptExtra.sort()
        });
      }
      var format = normalizeFormat(ownValue(transcript, "format"));
      if (!own(transcript, "content")) {
        fail("INVALID_TRANSCRIPT", "Transcript content is required.");
      }
      var transcriptContent = ownValue(transcript, "content");
      var serializedPayload = payloadText(transcriptContent, format);
      var payloadBytes = utf8Bytes(serializedPayload);
      if (payloadBytes > limits.maxBytes) {
        fail("PAYLOAD_TOO_LARGE", "Transcript payload exceeds the configured byte boundary.", {
          payloadBytes: payloadBytes,
          maxBytes: limits.maxBytes
        });
      }
      var rawTranscriptSourceIds = [
        ownValue(transcript, "sourceId"),
        ownValue(transcript, "videoId")
      ];
      if (rawTranscriptSourceIds.some(function (id) {
        return id != null && typeof id !== "string";
      })) {
        fail("SOURCE_ID_MISMATCH", "Transcript source ID fields must be strings.");
      }
      var transcriptSourceIds = rawTranscriptSourceIds
        .map(clean)
        .filter(Boolean);
      if (new Set(transcriptSourceIds).size > 1) {
        fail("SOURCE_ID_MISMATCH", "Conflicting transcript source ID fields were supplied.");
      }
      var declaredSourceId = transcriptSourceIds[0] || "";
      var rawEvents = [];
      var ledger = null;
      var status = "quarantined";
      var holdReasons = [];

      if (format === "plain-text") {
        var plainWords = words(serializedPayload).length;
        if (plainWords > limits.maxTotalWords) {
          fail("WORD_LIMIT_EXCEEDED", "Untimed transcript word count exceeds the configured boundary.", {
            wordCount: plainWords,
            maxTotalWords: limits.maxTotalWords
          });
        }
        status = "held";
        holdReasons.push({
          code: "UNTIMED_TRANSCRIPT",
          message:
            "Plain text has no timestamp evidence. It is held locally with zero derived candidates."
        });
        ledger = {
          events: [],
          rawEventCount: 0,
          uniqueEventCount: 0,
          duplicatesRemoved: 0,
          rawWordCount: plainWords,
          uniqueWordCount: 0,
          fingerprint: fingerprint("ftl1", {
            format: format,
            payloadFingerprint: fingerprint("ftp1", serializedPayload),
            wordCount: plainWords
          })
        };
      } else if (format === "youtube-json3") {
        var parsedJson3 = parseJson3Content(transcriptContent);
        rawEvents = parsedJson3.events;
        if (declaredSourceId &&
            parsedJson3.declaredSourceId &&
            declaredSourceId !== parsedJson3.declaredSourceId) {
          fail("SOURCE_ID_MISMATCH",
            "Transcript metadata conflicts with the YouTube JSON3 source ID.", {
              transcriptSourceId: declaredSourceId,
              json3SourceId: parsedJson3.declaredSourceId
            });
        }
        declaredSourceId = declaredSourceId || parsedJson3.declaredSourceId;
        ledger = eventLedger(rawEvents, source, limits);
      } else {
        rawEvents = parseTimedText(serializedPayload, format);
        ledger = eventLedger(rawEvents, source, limits);
      }

      if (declaredSourceId && declaredSourceId !== source.id) {
        fail("SOURCE_ID_MISMATCH", "Transcript source ID does not match source metadata.", {
          sourceId: source.id,
          transcriptSourceId: declaredSourceId
        });
      }

      var candidates = status === "held" ? [] : deriveCandidates(
        ledger,
        source,
        rules,
        excerptLimit,
        quarantineLabel,
        limits
      );
      var evidenceLedger = buildEvidenceLedger(
        ledger,
        candidates,
        excerptLimit,
        limits.maxExcerptCharacters
      );
      var topicCandidates = candidates.filter(function (candidate) {
        return candidate.kind === "topic";
      }).length;
      var signalCandidates = candidates.length - topicCandidates;
      var artifact = {
        schema: SCHEMA,
        engineVersion: VERSION,
        status: status,
        binding: serialCopy(binding),
        source: source,
        ingest: {
          format: format,
          payloadBytes: payloadBytes,
          payloadFingerprint: fingerprint("ftp1", serializedPayload),
          exactEventLedgerFingerprint: ledger.fingerprint,
          parsedEvents: ledger.rawEventCount,
          uniqueEvents: ledger.uniqueEventCount,
          duplicatesRemoved: ledger.duplicatesRemoved,
          wordsAudited: ledger.rawWordCount,
          uniqueEventWords: ledger.uniqueWordCount,
          rawTranscriptRetained: false
        },
        rules: {
          fingerprint: rulesFingerprint,
          topicRules: rules.topics.length,
          signalRules: rules.signals.length,
          matching: "explicit normalized literal phrases only"
        },
        evidenceLedger: evidenceLedger,
        policy: {
          state: "quarantine",
          publicStateLabel: quarantineLabel,
          publicExcerptWordLimit: excerptLimit,
          publicExcerptCharacterLimit: limits.maxExcerptCharacters,
          rawTranscriptExported: false,
          speakerInference: false,
          channelOwnershipVerified: false,
          promotionAllowed: false,
          humanReviewRequired: true,
          fingerprintRole: "deterministic-change-detector",
          structuralValidationOnly: true,
          sourceAuthenticityVerified: false,
          candidateEventReceiptsExported: true
        },
        metrics: {
          candidates: candidates.length,
          topicCandidates: topicCandidates,
          signalCandidates: signalCandidates,
          heldInputs: status === "held" ? 1 : 0,
          authenticatedHumanReviews: 0,
          authenticatedSpeakerCertifications: 0,
          authenticatedCreatorCertifications: 0,
          canonPromotions: 0
        },
        holdReasons: holdReasons,
        candidates: candidates,
        fingerprint: ""
      };
      artifact.fingerprint = artifactFingerprint(artifact);
      return deepFreeze(artifact);
    }

    function validateExport(payload) {
      var artifact = parseArtifact(payload);
      var issues = [];
      if (!artifact) {
        issue(issues, "INVALID_EXPORT", "artifact", "Export must be a JSON object.");
        return { artifact: null, issues: issues };
      }
      var topKeys = [
        "schema",
        "engineVersion",
        "status",
        "binding",
        "source",
        "ingest",
        "rules",
        "evidenceLedger",
        "policy",
        "metrics",
        "holdReasons",
        "candidates",
        "fingerprint"
      ];
      var topExtra = unknownKeys(artifact, topKeys);
      if (topExtra.length) {
        issue(issues, "UNSUPPORTED_EXPORT_FIELD", "artifact",
          "Export contains unsupported top-level fields.");
      }
      if (!exactKeys(artifact, topKeys)) {
        issue(issues, "INVALID_STRUCTURE", "artifact",
          "Export must contain the complete canonical field set.");
      }
      if (artifact.schema !== SCHEMA || artifact.engineVersion !== VERSION) {
        issue(issues, "UNSUPPORTED_EXPORT", "schema",
          "Export schema or engine version is not supported.");
      }
      var artifactBinding = object(artifact.binding);
      if (clean(artifactBinding.channelId) !== channelId) {
        issue(issues, "FOREIGN_CHANNEL", "binding.channelId",
          "Export belongs to another channel.");
      }
      if (clean(artifactBinding.channelPackFingerprint) !== packFingerprint) {
        issue(issues, "FOREIGN_CHANNEL_PACK", "binding.channelPackFingerprint",
          "Export belongs to another ChannelPack.");
      }
      if (clean(artifactBinding.rulesFingerprint) !== rulesFingerprint ||
          clean(object(artifact.rules).fingerprint) !== rulesFingerprint) {
        issue(issues, "FOREIGN_RULES", "rules.fingerprint",
          "Export belongs to another explicit rule set.");
      }
      if (!sameValue(artifact.binding, binding)) {
        issue(issues, "INVALID_BINDING", "binding",
          "Export binding is incomplete or differs from this engine instance.");
      }

      var sourceRecord = object(artifact.source);
      var sourceKeys = [
        "id",
        "url",
        "title",
        "date",
        "durationSeconds",
        "lane",
        "laneLabel",
        "officialYouTubeUrlValidated",
        "channelOwnershipVerified",
        "authorityStatus"
      ];
      var canonicalSource = null;
      try {
        canonicalSource = normalizeSource({
          id: sourceRecord.id,
          url: sourceRecord.url,
          title: sourceRecord.title,
          date: sourceRecord.date,
          durationSeconds: sourceRecord.durationSeconds,
          lane: sourceRecord.lane
        }, channelPack, limits);
      } catch {
        issue(issues, "INVALID_SOURCE", "source",
          "Export source metadata fails the intake source boundary.");
      }
      if (!exactKeys(artifact.source, sourceKeys) ||
          !canonicalSource ||
          !sameValue(artifact.source, canonicalSource)) {
        issue(issues, "INVALID_SOURCE_BINDING", "source",
          "Export source metadata is not the canonical validated source.");
      }

      var expectedRules = {
        fingerprint: rulesFingerprint,
        topicRules: rules.topics.length,
        signalRules: rules.signals.length,
        matching: "explicit normalized literal phrases only"
      };
      if (!sameValue(artifact.rules, expectedRules)) {
        issue(issues, "INVALID_RULE_BINDING", "rules",
          "Export rule metadata differs from the engine rule set.");
      }

      var policy = object(artifact.policy);
      var expectedPolicy = {
        state: "quarantine",
        publicStateLabel: quarantineLabel,
        publicExcerptWordLimit: excerptLimit,
        publicExcerptCharacterLimit: limits.maxExcerptCharacters,
        rawTranscriptExported: false,
        speakerInference: false,
        channelOwnershipVerified: false,
        promotionAllowed: false,
        humanReviewRequired: true,
        fingerprintRole: "deterministic-change-detector",
        structuralValidationOnly: true,
        sourceAuthenticityVerified: false,
        candidateEventReceiptsExported: true
      };
      if (!sameValue(policy, expectedPolicy)) {
        issue(issues, "UNSAFE_POLICY", "policy",
          "Export does not preserve the intake quarantine boundary.");
      }

      var ingest = object(artifact.ingest);
      var ingestKeys = [
        "format",
        "payloadBytes",
        "payloadFingerprint",
        "exactEventLedgerFingerprint",
        "parsedEvents",
        "uniqueEvents",
        "duplicatesRemoved",
        "wordsAudited",
        "uniqueEventWords",
        "rawTranscriptRetained"
      ];
      var ingestShapeValid =
        exactKeys(artifact.ingest, ingestKeys) &&
        SUPPORTED_FORMATS.indexOf(ingest.format) >= 0 &&
        boundedInteger(ingest.payloadBytes, 0, limits.maxBytes) &&
        validFingerprint(ingest.payloadFingerprint, "ftp1") &&
        validFingerprint(ingest.exactEventLedgerFingerprint, "ftl1") &&
        boundedInteger(ingest.parsedEvents, 0, limits.maxEvents) &&
        boundedInteger(ingest.uniqueEvents, 0, ingest.parsedEvents) &&
        ingest.duplicatesRemoved === ingest.parsedEvents - ingest.uniqueEvents &&
        boundedInteger(ingest.wordsAudited, 0, limits.maxTotalWords) &&
        boundedInteger(ingest.uniqueEventWords, 0, ingest.wordsAudited) &&
        ingest.rawTranscriptRetained === false;
      if (!ingestShapeValid) {
        issue(issues, "INVALID_INGEST_LEDGER", "ingest",
          "Export ingest metrics or fingerprints are structurally inconsistent.");
      }
      if (ingest.rawTranscriptRetained !== false) {
        issue(issues, "RAW_TRANSCRIPT_BOUNDARY", "ingest.rawTranscriptRetained",
          "Raw transcript retention is forbidden in an intake export.");
      }

      var allowedLedgerRuleIds = new Set();
      var allowedLedgerRules = Object.create(null);
      rules.topics.concat(rules.signals).forEach(function (rule) {
        var ledgerRuleId = rule.kind + ":" + rule.id;
        allowedLedgerRuleIds.add(ledgerRuleId);
        allowedLedgerRules[ledgerRuleId] = rule;
      });
      var evidenceLedger = object(artifact.evidenceLedger);
      var evidenceEntries = Array.isArray(evidenceLedger.entries)
        ? evidenceLedger.entries
        : [];
      var evidenceByEvent = Object.create(null);
      var previousEvidence = null;
      var evidenceShapeValid =
        exactKeys(artifact.evidenceLedger, [
          "scope",
          "rawTextRetained",
          "entries",
          "fingerprint"
        ]) &&
        evidenceLedger.scope === "candidate-events-only" &&
        evidenceLedger.rawTextRetained === false &&
        Array.isArray(evidenceLedger.entries) &&
        evidenceEntries.length <= Number(ingest.uniqueEvents || 0);
      evidenceEntries.forEach(function (entryValue, index) {
        var entry = object(entryValue);
        var path = "evidenceLedger.entries[" + index + "]";
        var matchedRuleIds = array(entry.matchedRuleIds);
        var matchedRuleTerms = array(entry.matchedRuleTerms);
        var validTime = Number.isFinite(entry.start) &&
          Number.isFinite(entry.end) &&
          entry.start >= 0 &&
          entry.end >= entry.start &&
          entry.end <= limits.maxTimestampSeconds &&
          canonicalSource &&
          entry.end <= canonicalSource.durationSeconds;
        var expectedEventFingerprint = validTime &&
          validFingerprint(entry.contentFingerprint, "ftx1")
          ? fingerprint("fte1", {
              start: entry.start,
              end: entry.end,
              contentFingerprint: entry.contentFingerprint
            })
          : "";
        var entryValid =
          exactKeys(entryValue, [
            "eventFingerprint",
            "start",
            "end",
            "contentFingerprint",
            "publicExcerptFingerprint",
            "matchedRuleIds",
            "matchedRuleTerms"
          ]) &&
          validTime &&
          entry.eventFingerprint === expectedEventFingerprint &&
          validFingerprint(entry.publicExcerptFingerprint, "ftx1") &&
          matchedRuleIds.length > 0 &&
          matchedRuleIds.every(function (ruleId) {
            return typeof ruleId === "string" && allowedLedgerRuleIds.has(ruleId);
          }) &&
          new Set(matchedRuleIds).size === matchedRuleIds.length &&
          sameValue(matchedRuleIds, matchedRuleIds.slice().sort()) &&
          matchedRuleTerms.length === matchedRuleIds.length &&
          matchedRuleTerms.every(function (match, matchIndex) {
            var record = object(match);
            var ruleId = matchedRuleIds[matchIndex];
            var rule = allowedLedgerRules[ruleId];
            var terms = array(record.terms);
            return exactKeys(match, ["ruleId", "terms"]) &&
              record.ruleId === ruleId &&
              !!rule &&
              terms.length > 0 &&
              terms.every(function (term) {
                return typeof term === "string" && rule.terms.indexOf(term) >= 0;
              }) &&
              new Set(terms).size === terms.length &&
              sameValue(terms, terms.slice().sort());
          }) &&
          !evidenceByEvent[entry.eventFingerprint];
        if (!entryValid) {
          issue(issues, "INVALID_EVIDENCE_RECEIPT", path,
            "Candidate-event receipt is malformed, duplicated, or outside this rule/source boundary.");
        }
        if (previousEvidence) {
          var evidenceOrder = entry.start - previousEvidence.start ||
            entry.end - previousEvidence.end ||
            compareText(entry.eventFingerprint, previousEvidence.eventFingerprint);
          if (evidenceOrder < 0) {
            issue(issues, "NONDETERMINISTIC_EVIDENCE_ORDER", path,
              "Candidate-event receipts must remain in canonical order.");
          }
        }
        evidenceByEvent[entry.eventFingerprint] = entry;
        previousEvidence = entry;
      });
      if (!evidenceShapeValid ||
          evidenceLedger.fingerprint !== fingerprint("ftel1", evidenceEntries)) {
        issue(issues, "INVALID_EVIDENCE_LEDGER", "evidenceLedger",
          "Candidate-event ledger is incomplete or its structural fingerprint does not match.");
      }

      var candidateList = Array.isArray(artifact.candidates)
        ? artifact.candidates
        : [];
      if (!Array.isArray(artifact.candidates)) {
        issue(issues, "INVALID_CANDIDATES", "candidates",
          "Export candidates must be a canonical array.");
      }
      var ruleLookup = {
        topic: {},
        signal: {}
      };
      rules.topics.concat(rules.signals).forEach(function (rule) {
        ruleLookup[rule.kind][rule.id] = rule;
      });
      var seenCandidateIds = new Set();
      var referencedEvidenceIds = new Set();
      var previousCandidate = null;
      candidateList.forEach(function (candidateValue, index) {
        var candidate = object(candidateValue);
        var path = "candidates[" + index + "]";
        var candidateKeys = [
          "id",
          "kind",
          "ruleId",
          "label",
          "sourceId",
          "sourceDate",
          "lane",
          "at",
          "end",
          "timecodeUrl",
          "excerpt",
          "derivation",
          "state",
          "publicStateLabel",
          "reviewStatus",
          "machineSurfaced",
          "promotionAllowed",
          "speaker",
          "speakerStatus",
          "authenticatedReviewCount",
          "authenticatedCertificationCount"
        ];
        if (!exactKeys(candidateValue, candidateKeys)) {
          issue(issues, "INVALID_CANDIDATE_STRUCTURE", path,
            "Candidate does not contain the exact canonical field set.");
        }
        if (candidate.state !== "quarantine" ||
            candidate.publicStateLabel !== quarantineLabel ||
            candidate.reviewStatus !== "unreviewed" ||
            candidate.machineSurfaced !== true ||
            candidate.promotionAllowed !== false ||
            candidate.speaker !== null ||
            candidate.speakerStatus !== "not-diarized" ||
            candidate.authenticatedReviewCount !== 0 ||
            candidate.authenticatedCertificationCount !== 0) {
          issue(issues, "UNSAFE_CANDIDATE", path,
            "Every candidate must remain machine-surfaced, undiarized, and quarantined.");
        }
        var rule = isRecord(ruleLookup[candidate.kind])
          ? ruleLookup[candidate.kind][candidate.ruleId]
          : null;
        if (!rule || candidate.label !== rule.label) {
          issue(issues, "INVALID_CANDIDATE_RULE", path,
            "Candidate rule and label do not bind to this engine rule set.");
        }
        var validTime = Number.isFinite(candidate.at) &&
          Number.isFinite(candidate.end) &&
          candidate.at >= 0 &&
          candidate.end >= candidate.at &&
          candidate.end <= limits.maxTimestampSeconds &&
          canonicalSource &&
          candidate.end <= canonicalSource.durationSeconds;
        var expectedTimecode = canonicalSource && validTime
          ? canonicalSource.url + "&t=" + Math.floor(candidate.at) + "s"
          : "";
        if (!validTime ||
            candidate.sourceId !== sourceRecord.id ||
            candidate.sourceDate !== sourceRecord.date ||
            candidate.lane !== sourceRecord.lane ||
            candidate.timecodeUrl !== expectedTimecode) {
          issue(issues, "INVALID_CANDIDATE_SOURCE", path,
            "Candidate source and timestamp fields are not canonically bound.");
        }

        var derivation = object(candidate.derivation);
        var matchedTerms = array(derivation.matchedTerms);
        var expectedEventId = clean(derivation.eventFingerprint);
        var evidenceReceipt = evidenceByEvent[expectedEventId];
        var termsValid = !!rule &&
          exactKeys(candidate.derivation, [
            "method",
            "matchedTerms",
            "eventFingerprint",
            "contentFingerprint",
            "publicExcerptFingerprint"
          ]) &&
          derivation.method === rule.matchMethod &&
          matchedTerms.length > 0 &&
          matchedTerms.every(function (term) {
            return typeof term === "string" && rule.terms.indexOf(term) >= 0;
          }) &&
          new Set(matchedTerms).size === matchedTerms.length &&
          sameValue(matchedTerms, matchedTerms.slice().sort()) &&
          validFingerprint(derivation.contentFingerprint, "ftx1") &&
          validFingerprint(derivation.publicExcerptFingerprint, "ftx1");
        var expectedCandidateId = rule && validTime &&
          validFingerprint(expectedEventId, "fte1")
          ? fingerprint("ftc1", {
              kind: candidate.kind,
              ruleId: candidate.ruleId,
              sourceId: candidate.sourceId,
              eventId: expectedEventId,
              at: candidate.at
            })
          : "";
        if (!termsValid ||
            !validFingerprint(expectedEventId, "fte1") ||
            candidate.id !== expectedCandidateId ||
            seenCandidateIds.has(candidate.id)) {
          issue(issues, "INVALID_CANDIDATE_DERIVATION", path,
            "Candidate ID or derivation receipt is invalid or duplicated.");
        }
        seenCandidateIds.add(candidate.id);

        var excerpt = object(candidate.excerpt);
        var excerptText = text(excerpt.text);
        var displayedText = excerpt.truncated === true &&
          excerptText.endsWith(" \u2026")
          ? excerptText.slice(0, -2)
          : excerptText;
        var displayedWords = words(displayedText).length;
        var excerptValid =
          exactKeys(candidate.excerpt, [
            "text",
            "wordCount",
            "sourceWordCount",
            "wordLimit",
            "characterCount",
            "characterLimit",
            "truncated"
          ]) &&
          excerptText === clean(excerptText) &&
          !!excerptText &&
          !/[<>]/.test(excerptText) &&
          boundedInteger(excerpt.wordCount, 1, excerptLimit) &&
          boundedInteger(excerpt.sourceWordCount, excerpt.wordCount, limits.maxWordsPerEvent) &&
          excerpt.wordLimit === excerptLimit &&
          boundedInteger(excerpt.characterCount, 1, limits.maxExcerptCharacters) &&
          excerpt.characterLimit === limits.maxExcerptCharacters &&
          excerpt.characterCount === displayedText.length &&
          typeof excerpt.truncated === "boolean" &&
          displayedWords === excerpt.wordCount &&
          (excerpt.truncated
            ? excerptText.endsWith(" \u2026") &&
              (excerpt.wordCount === excerptLimit ||
                excerpt.characterCount + 1 <= excerpt.characterLimit) &&
              excerpt.sourceWordCount > excerpt.wordCount
            : excerpt.sourceWordCount === excerpt.wordCount);
        if (!excerptValid) {
          issue(issues, "UNSAFE_EXCERPT", path + ".excerpt",
            "Candidate excerpt exceeds or bypasses the public evidence boundary.");
        }
        var evidenceRuleId = candidate.kind + ":" + candidate.ruleId;
        var evidenceRuleTerms = evidenceReceipt &&
          array(evidenceReceipt.matchedRuleTerms).filter(function (entry) {
            return object(entry).ruleId === evidenceRuleId;
          })[0];
        if (!evidenceReceipt ||
            evidenceReceipt.start !== candidate.at ||
            evidenceReceipt.end !== candidate.end ||
            evidenceReceipt.contentFingerprint !== derivation.contentFingerprint ||
            evidenceReceipt.publicExcerptFingerprint !==
              derivation.publicExcerptFingerprint ||
            derivation.publicExcerptFingerprint !==
              fingerprint("ftx1", candidate.excerpt) ||
            evidenceReceipt.matchedRuleIds.indexOf(evidenceRuleId) < 0 ||
            !evidenceRuleTerms ||
            !sameValue(evidenceRuleTerms.terms, matchedTerms)) {
          issue(issues, "UNBOUND_CANDIDATE_EVIDENCE", path + ".derivation",
            "Candidate does not bind to its exported candidate-event receipt.");
        }
        if (evidenceReceipt) referencedEvidenceIds.add(expectedEventId);

        if (previousCandidate) {
          var order = candidate.at - previousCandidate.at ||
            compareText(candidate.kind, previousCandidate.kind) ||
            compareText(candidate.ruleId, previousCandidate.ruleId) ||
            compareText(candidate.id, previousCandidate.id);
          if (order < 0) {
            issue(issues, "NONDETERMINISTIC_ORDER", path,
              "Candidates must remain in canonical deterministic order.");
          }
        }
        previousCandidate = candidate;
      });
      evidenceEntries.forEach(function (entry, index) {
        if (!referencedEvidenceIds.has(object(entry).eventFingerprint)) {
          issue(issues, "UNREFERENCED_EVIDENCE_RECEIPT",
            "evidenceLedger.entries[" + index + "]",
            "Candidate-event receipts cannot exist without a matching exported candidate.");
        }
      });

      var topicCandidates = candidateList.filter(function (candidate) {
        return object(candidate).kind === "topic";
      }).length;
      var statusValid = artifact.status === "held"
        ? ingest.format === "plain-text" &&
          candidateList.length === 0 &&
          evidenceEntries.length === 0 &&
          ingest.parsedEvents === 0 &&
          ingest.uniqueEvents === 0 &&
          ingest.duplicatesRemoved === 0 &&
          ingest.uniqueEventWords === 0
        : artifact.status === "quarantined" &&
          ingest.format !== "plain-text" &&
          ingest.parsedEvents > 0 &&
          ingest.uniqueEvents > 0 &&
          evidenceEntries.length <= ingest.uniqueEvents;
      if (!statusValid) {
        issue(issues, "INVALID_STATUS", "status",
          "Export status does not match its transcript and candidate boundary.");
      }

      var expectedHoldReasons = artifact.status === "held"
        ? [{
            code: "UNTIMED_TRANSCRIPT",
            message:
              "Plain text has no timestamp evidence. It is held locally with zero derived candidates."
          }]
        : [];
      if (!sameValue(artifact.holdReasons, expectedHoldReasons)) {
        issue(issues, "INVALID_HOLD_STATE", "holdReasons",
          "Export hold reasons do not match its intake state.");
      }

      var metrics = object(artifact.metrics);
      var expectedMetrics = {
        candidates: candidateList.length,
        topicCandidates: topicCandidates,
        signalCandidates: candidateList.length - topicCandidates,
        heldInputs: artifact.status === "held" ? 1 : 0,
        authenticatedHumanReviews: 0,
        authenticatedSpeakerCertifications: 0,
        authenticatedCreatorCertifications: 0,
        canonPromotions: 0
      };
      if (!sameValue(metrics, expectedMetrics)) {
        issue(issues, "INVALID_METRICS", "metrics",
          "Export metrics do not reconcile with its canonical records.");
      }
      [
        "authenticatedHumanReviews",
        "authenticatedSpeakerCertifications",
        "authenticatedCreatorCertifications",
        "canonPromotions"
      ].forEach(function (key) {
        if (metrics[key] !== 0) {
          issue(issues, "UNSUPPORTED_AUTHORITY_CLAIM", "metrics." + key,
            "Fresh Tape Intake cannot authenticate review, certification, or promotion.");
        }
      });
      var suppliedFingerprint = clean(artifact.fingerprint);
      if (!suppliedFingerprint || suppliedFingerprint !== artifactFingerprint(artifact)) {
        issue(issues, "FINGERPRINT_MISMATCH", "fingerprint",
          "Export fingerprint does not match its canonical payload.");
      }
      return {
        artifact: artifact,
        issues: issues
      };
    }

    function verifyExport(payload) {
      var report = validateExport(payload);
      return deepFreeze({
        ok: report.issues.length === 0,
        fingerprint: report.issues.length ? null : report.artifact.fingerprint,
        scope: "structural-change-detection-only",
        authenticityVerified: false,
        sourceContentVerified: false,
        authorityVerified: false,
        issues: serialCopy(report.issues)
      });
    }

    function serialize(artifact) {
      var report = validateExport(artifact);
      if (report.issues.length) {
        fail("INVALID_EXPORT", "Fresh Tape Intake export failed verification.", {
          issues: report.issues
        });
      }
      return stableJson(report.artifact) + "\n";
    }

    return deepFreeze({
      version: VERSION,
      schema: SCHEMA,
      binding: serialCopy(binding),
      limits: serialCopy(limits),
      rules: serialCopy(rules),
      policy: {
        state: "quarantine",
        publicStateLabel: quarantineLabel,
        publicExcerptWordLimit: excerptLimit,
        publicExcerptCharacterLimit: limits.maxExcerptCharacters,
        rawTranscriptExported: false,
        speakerInference: false,
        channelOwnershipVerified: false,
        promotionAllowed: false,
        fingerprintRole: "deterministic-change-detector",
        structuralValidationOnly: true,
        sourceAuthenticityVerified: false,
        candidateEventReceiptsExported: true,
        authenticatedReviewCount: 0,
        authenticatedCertificationCount: 0
      },
      intake: buildArtifact,
      serialize: serialize,
      verifyExport: verifyExport
    });
  }

  return deepFreeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    SUPPORTED_FORMATS: SUPPORTED_FORMATS,
    HARD_LIMITS: HARD_LIMITS,
    FreshTapeIntakeError: FreshTapeIntakeError,
    create: create
  });
});
