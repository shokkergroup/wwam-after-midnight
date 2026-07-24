(function (root) {
  "use strict";

  /*
   * A channel-neutral, source-grounded prediction/response docket.
   *
   * This engine deliberately does not decide whether a prediction was right.
   * It joins a timestamped forecast candidate to a later timestamped response
   * candidate under MAY_RESOLVE, then keeps the pair quarantined until an
   * authenticated human reviews the speakers, source boundaries, and outcome.
   */

  var VERSION = "1.0.0";
  var SCHEMA = "shokker-youtube-wiki/longitudinal-docket/v1";
  var DATA_SCHEMA = "shokker-youtube-wiki/longitudinal-docket-data/v1";
  var INSPECTION_SCHEMA =
    "shokker-youtube-wiki/longitudinal-docket-inspection/v1";
  var EDIT_BRIEF_SCHEMA =
    "shokker-youtube-wiki/longitudinal-docket-edit-brief/v1";
  var EXPORT_SCHEMA =
    "shokker-youtube-wiki/longitudinal-docket-export/v1";
  var PACK_FINGERPRINT = /^cp1-[a-f0-9]{16}$/;
  var SHA256 = /^sha256:[a-f0-9]{64}$/;
  var FNV1A32 = /^fnv1a32:[a-f0-9]{8}$/;
  var SOURCE_ID = /^[A-Za-z0-9_-]{11}$/;
  var ENTITY_ID = /^[a-z0-9][a-z0-9:-]{1,119}$/;
  var DATE = /^\d{4}-\d{2}-\d{2}$/;
  var KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var EDIT_DURATIONS = Object.freeze([30, 60, 90]);
  var MAX_DATA_BYTES = 96_000;
  var MAX_PACKET_BYTES = 128_000;
  var MAX_COLLECTIONS = Object.freeze({
    subjects: 250,
    sources: 100,
    claims: 100,
    responses: 100,
    dockets: 100,
    candidateSubjects: 12,
    subjectBindings: 12,
    cueTerms: 8,
    additionalReceipts: 4,
    pairBasis: 12,
    resolutionBlockedBy: 12,
  });
  var CANDIDATE_RIGHTS = Object.freeze([
    "standard-caption-candidates",
    "visual-context-unverified",
  ]);
  var RESTRICTED_RIGHTS = Object.freeze([
    "metadata-only",
    "topic-navigation-only",
    "trailer-audio-boundary-unverified",
    "source-audio-boundary-unverified",
  ]);
  var FORBIDDEN_EXPORT_KEYS = Object.freeze([
    "audio",
    "captions",
    "events",
    "media",
    "rawcaptions",
    "rawtranscript",
    "segs",
    "transcript",
    "video",
  ]);
  var PROTOTYPE_KEYS = Object.freeze([
    "__proto__",
    "constructor",
    "prototype",
  ]);

  var TOP_KEYS = Object.freeze([
    "schema",
    "schemaVersion",
    "generated",
    "snapshotDate",
    "channel",
    "labels",
    "policy",
    "provenance",
    "subjects",
    "sources",
    "claims",
    "responses",
    "dockets",
    "fingerprints",
  ]);
  var CHANNEL_KEYS = Object.freeze([
    "id",
    "label",
    "packFingerprint",
    "platform",
    "canonicalUrl",
  ]);
  var LABEL_KEYS = Object.freeze([
    "product",
    "forecast",
    "response",
    "unresolved",
    "editBrief",
  ]);
  var POLICY_KEYS = Object.freeze([
    "machineOutputState",
    "machinePairRelationship",
    "verdictAuthority",
    "promotionRequiresHumanReview",
    "preserveContradictions",
    "publicExcerptWords",
    "timestampRequired",
    "sourceUrlRequired",
    "noSpeakerGuessing",
    "trailerAudioBoundaryRule",
    "visualOutcomeRule",
    "exportRule",
  ]);
  var PROVENANCE_KEYS = Object.freeze([
    "generator",
    "networkUsed",
    "privateInput",
    "publicInput",
    "fullCaptionPayloadPublic",
    "integrityNote",
  ]);
  var SUBJECT_KEYS = Object.freeze(["id", "label", "type"]);
  var SOURCE_KEYS = Object.freeze([
    "id",
    "title",
    "date",
    "durationSeconds",
    "url",
    "lane",
    "contentMode",
    "rightsMode",
    "evidenceAccess",
    "captionTrack",
    "captionPayloadSha256",
    "speakerDiarized",
    "originAttribution",
    "visualContextVerified",
    "promotionAllowed",
  ]);
  var CANDIDATE_KEYS = Object.freeze([
    "id",
    "sourceId",
    "role",
    "t",
    "url",
    "window",
    "excerpt",
    "excerptMode",
    "subjects",
    "subjectBindings",
    "cueType",
    "cueTerms",
    "additionalReceipts",
    "speaker",
    "originStatus",
    "reviewStatus",
    "promotionAllowed",
    "visualContextVerified",
  ]);
  var SUBJECT_BINDING_KEYS = Object.freeze([
    "subjectId",
    "basis",
    "cue",
  ]);
  var ADDITIONAL_RECEIPT_KEYS = Object.freeze([
    "id",
    "t",
    "url",
    "window",
    "excerpt",
    "excerptMode",
    "cueTerms",
  ]);
  var WINDOW_KEYS = Object.freeze(["from", "to"]);
  var DOCKET_KEYS = Object.freeze([
    "id",
    "title",
    "claimId",
    "responseId",
    "subjects",
    "relationship",
    "pairSignal",
    "pairBasis",
    "chronology",
    "verdict",
    "resolutionStatus",
    "reviewStatus",
    "resolutionBlockedBy",
    "requiresOutcomeVerification",
    "requiresWholeWorkVisualReview",
    "visualOutcomeVerified",
    "speaker",
    "promotionAllowed",
  ]);
  var CHRONOLOGY_KEYS = Object.freeze([
    "forecastDate",
    "responseDate",
    "daysBetween",
  ]);
  var FINGERPRINT_KEYS = Object.freeze([
    "captionSetSha256",
    "publicFnv1a",
  ]);
  var PAIR_BASIS_VALUES = Object.freeze([
    "absence-not-channel-wide",
    "chronological-distinct-sources",
    "expectation-reception-candidate",
    "local-judgments-only",
    "mixed-response-receipts",
    "no-causality-claim",
    "no-mind-change-claim",
    "no-speaker-continuity-claim",
    "open-corpus-snapshot",
    "planning-continuation-candidate",
    "role-cues-present",
    "shared-subjects",
    "target-outcome-candidate",
  ]);
  var RESOLUTION_BLOCK_VALUES = Object.freeze([
    "authenticated-human-review-required",
    "corpus-absence-not-channel-wide",
    "future-delivery-unverified",
    "mixed-local-judgments",
    "outcome-not-independently-verified",
    "source-audio-boundary-human-review-required",
    "speaker-not-diarized",
    "whole-work-visual-review-required",
  ]);
  var PROVENANCE_VALUES = Object.freeze({
    generator: "offline-bounded-evidence-pipeline",
    privateInput: "local-caption-cache",
    publicInput: "bounded-source-metadata-and-caption-excerpts",
    integrityNote: "change-detector-only",
  });
  var UNSAFE_TRUTH_LANGUAGE =
    /\b(?:(?:called|calls|called)\s+it(?:\s+exactly)?|nailed\s+it|came\s+true|affirmed|confirmed|contradicted|correct|debunked|definitely|disproved|false|fulfilled|inaccurate|incorrect|proved|proven|right|settled|supported|true|verified|vindicated|wrong|(?:prediction|forecast|promise)\s+(?:delivered|failed|fulfilled|kept|resolved))\b/i;

  function DocketValidationError(issues) {
    var count = Array.isArray(issues) ? issues.length : 0;
    var error = Error.call(
      this,
      "Longitudinal docket rejected with " + count +
        " conformance issue" + (count === 1 ? "" : "s") + "."
    );
    this.name = "DocketValidationError";
    this.message = error.message;
    this.stack = error.stack;
    this.code = "LONGITUDINAL_DOCKET_REJECTED";
    this.issues = issues || [];
  }
  DocketValidationError.prototype = Object.create(Error.prototype);
  DocketValidationError.prototype.constructor = DocketValidationError;

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value) {
    return typeof value === "string"
      ? value.replace(/\s+/g, " ").trim()
      : "";
  }

  function number(value) {
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : null;
  }

  function roundHundredth(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function serialCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.keys(value).forEach(function (key) {
      deepFreeze(value[key]);
    });
    return Object.freeze(value);
  }

  function compareText(left, right) {
    return left < right ? -1 : (left > right ? 1 : 0);
  }

  function semanticValue(value) {
    if (Array.isArray(value)) {
      var mapped = value.map(semanticValue);
      if (mapped.every(function (entry) { return typeof entry === "string"; })) {
        return mapped.slice().sort(compareText);
      }
      if (
        mapped.length > 0 &&
        mapped.every(function (entry) {
          return isRecord(entry) && typeof entry.id === "string";
        })
      ) {
        return mapped.slice().sort(function (left, right) {
          return compareText(left.id, right.id);
        });
      }
      if (
        mapped.length > 0 &&
        mapped.every(function (entry) {
          return isRecord(entry) && typeof entry.subjectId === "string";
        })
      ) {
        return mapped.slice().sort(function (left, right) {
          return (
            compareText(left.subjectId, right.subjectId) ||
            compareText(clean(left.basis), clean(right.basis)) ||
            compareText(clean(left.cue), clean(right.cue))
          );
        });
      }
      return mapped;
    }
    if (isRecord(value)) {
      return Object.keys(value)
        .sort(compareText)
        .reduce(function (output, key) {
          output[key] = semanticValue(value[key]);
          return output;
        }, Object.create(null));
    }
    return value;
  }

  function stableJson(value) {
    return JSON.stringify(semanticValue(value));
  }

  function utf8Bytes(value) {
    var source = unescape(encodeURIComponent(String(value)));
    var output = [];
    for (var index = 0; index < source.length; index += 1) {
      output.push(source.charCodeAt(index));
    }
    return output;
  }

  function fnv1a32(value) {
    var hash = 0x811c9dc5;
    utf8Bytes(value).forEach(function (byte) {
      hash ^= byte;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    });
    return "fnv1a32:" + hash.toString(16).padStart(8, "0");
  }

  function sha256Hex(value) {
    var bytes = utf8Bytes(value);
    var bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var high = Math.floor(bitLength / 0x100000000);
    var low = bitLength >>> 0;
    for (var shift = 24; shift >= 0; shift -= 8) {
      bytes.push((high >>> shift) & 0xff);
    }
    for (var lowShift = 24; lowShift >= 0; lowShift -= 8) {
      bytes.push((low >>> lowShift) & 0xff);
    }

    var constants = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
      0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
      0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
      0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
      0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
      0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    var state = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];
    var words = new Array(64);
    function rotateRight(input, amount) {
      return (input >>> amount) | (input << (32 - amount));
    }
    for (var chunk = 0; chunk < bytes.length; chunk += 64) {
      for (var wordIndex = 0; wordIndex < 16; wordIndex += 1) {
        var base = chunk + wordIndex * 4;
        words[wordIndex] = (
          (bytes[base] << 24) |
          (bytes[base + 1] << 16) |
          (bytes[base + 2] << 8) |
          bytes[base + 3]
        ) >>> 0;
      }
      for (var expand = 16; expand < 64; expand += 1) {
        var prior15 = words[expand - 15];
        var prior2 = words[expand - 2];
        var sigma0 =
          rotateRight(prior15, 7) ^
          rotateRight(prior15, 18) ^
          (prior15 >>> 3);
        var sigma1 =
          rotateRight(prior2, 17) ^
          rotateRight(prior2, 19) ^
          (prior2 >>> 10);
        words[expand] = (
          words[expand - 16] +
          sigma0 +
          words[expand - 7] +
          sigma1
        ) >>> 0;
      }

      var a = state[0];
      var b = state[1];
      var c = state[2];
      var d = state[3];
      var e = state[4];
      var f = state[5];
      var g = state[6];
      var h = state[7];
      for (var round = 0; round < 64; round += 1) {
        var upper =
          rotateRight(e, 6) ^
          rotateRight(e, 11) ^
          rotateRight(e, 25);
        var choose = (e & f) ^ (~e & g);
        var first = (h + upper + choose + constants[round] + words[round]) >>> 0;
        var lower =
          rotateRight(a, 2) ^
          rotateRight(a, 13) ^
          rotateRight(a, 22);
        var majority = (a & b) ^ (a & c) ^ (b & c);
        var second = (lower + majority) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + first) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (first + second) >>> 0;
      }
      state[0] = (state[0] + a) >>> 0;
      state[1] = (state[1] + b) >>> 0;
      state[2] = (state[2] + c) >>> 0;
      state[3] = (state[3] + d) >>> 0;
      state[4] = (state[4] + e) >>> 0;
      state[5] = (state[5] + f) >>> 0;
      state[6] = (state[6] + g) >>> 0;
      state[7] = (state[7] + h) >>> 0;
    }
    return state.map(function (entry) {
      return entry.toString(16).padStart(8, "0");
    }).join("");
  }

  function captionSetFingerprint(sources) {
    var manifest = Object.create(null);
    array(sources).forEach(function (source) {
      if (isRecord(source) && typeof source.id === "string") {
        manifest[source.id] = source.captionPayloadSha256;
      }
    });
    return "sha256:" + sha256Hex(stableJson(manifest));
  }

  function packetFingerprint(value) {
    var copy = serialCopy(value);
    delete copy.fingerprint;
    return fnv1a32(stableJson(copy));
  }

  function artifactFingerprint(value) {
    var copy = serialCopy(value);
    if (isRecord(copy.fingerprints)) {
      delete copy.fingerprints.publicFnv1a;
    }
    return fnv1a32(stableJson(copy));
  }

  function issue(issues, path, code, message) {
    issues.push({ path: path, code: code, message: message });
  }

  function rejectUnknownKeys(issues, value, path, allowed) {
    if (!isRecord(value)) return;
    Object.keys(value).forEach(function (key) {
      if (!allowed.includes(key)) {
        issue(
          issues,
          path ? path + "." + key : key,
          "unknown-field",
          (path || "object") + " contains an unsupported field."
        );
      }
    });
  }

  function requireRecord(issues, value, path) {
    if (!isRecord(value)) {
      issue(issues, path, "required-object", path + " must be an object.");
      return false;
    }
    return true;
  }

  function requireArray(issues, value, path, minimum, maximum) {
    if (!Array.isArray(value) || value.length < (minimum || 0)) {
      issue(
        issues,
        path,
        "required-list",
        path + " must contain at least " + (minimum || 0) + " item(s)."
      );
      return [];
    }
    if (maximum && value.length > maximum) {
      issue(
        issues,
        path,
        "collection-limit",
        path + " must contain no more than " + maximum + " item(s)."
      );
    }
    return value;
  }

  function requireString(issues, value, path, options) {
    var settings = options || {};
    var output = clean(value);
    if (!output) {
      issue(issues, path, "required-string", path + " must be a non-empty string.");
      return "";
    }
    if (typeof value === "string" && value !== output) {
      issue(
        issues,
        path,
        "noncanonical-string",
        path + " must be trimmed and use canonical single spacing."
      );
    }
    if (settings.max && output.length > settings.max) {
      issue(
        issues,
        path,
        "too-long",
        path + " must be " + settings.max + " characters or fewer."
      );
    }
    if (settings.pattern && !settings.pattern.test(output)) {
      issue(issues, path, "invalid-format", path + " has an invalid format.");
    }
    return output;
  }

  function requireExact(issues, value, expected, path, code) {
    if (value !== expected) {
      issue(
        issues,
        path,
        code || "unsafe-policy",
        path + " must be " + JSON.stringify(expected) + "."
      );
    }
  }

  function uniqueStrings(issues, value, path, options) {
    var settings = options || {};
    var values = requireArray(
      issues,
      value,
      path,
      settings.minimum == null ? 1 : settings.minimum,
      settings.maximum
    )
      .map(function (entry, index) {
        return requireString(issues, entry, path + "[" + index + "]", {
          max: settings.max || 120,
          pattern: settings.pattern,
        });
      })
      .filter(Boolean);
    if (new Set(values).size !== values.length) {
      issue(issues, path, "duplicate-value", path + " contains duplicate values.");
    }
    return values;
  }

  function normalizedWords(value) {
    var text = clean(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[‘’]/g, "'")
      .replace(/\[\s*(?:_+\s*_*|bleep)\s*\]/gi, " bleep ")
      .toLowerCase();
    var matches = text.match(/[a-z0-9]+(?:'[a-z0-9]+)?/g);
    return matches || [];
  }

  function containsWords(haystack, needle) {
    if (!needle.length || needle.length > haystack.length) return false;
    for (var index = 0; index <= haystack.length - needle.length; index += 1) {
      var match = true;
      for (var offset = 0; offset < needle.length; offset += 1) {
        if (haystack[index + offset] !== needle[offset]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  }

  function containsPhrase(haystack, needle) {
    return containsWords(normalizedWords(haystack), normalizedWords(needle));
  }

  function rejectTruthLanguage(issues, value, path) {
    var text = clean(value);
    if (
      PAIR_BASIS_VALUES.includes(text) ||
      RESOLUTION_BLOCK_VALUES.includes(text)
    ) {
      return;
    }
    if (text && UNSAFE_TRUTH_LANGUAGE.test(text)) {
      issue(
        issues,
        path,
        "truth-language-firewall",
        path + " cannot imply that an unresolved machine pair is true, false, correct, or confirmed."
      );
    }
  }

  function validDate(value) {
    var text = clean(value);
    if (!DATE.test(text)) return false;
    var parts = text.split("-").map(Number);
    var instant = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return (
      instant.getUTCFullYear() === parts[0] &&
      instant.getUTCMonth() === parts[1] - 1 &&
      instant.getUTCDate() === parts[2]
    );
  }

  function daysBetween(left, right) {
    var first = Date.parse(left + "T00:00:00Z");
    var second = Date.parse(right + "T00:00:00Z");
    return Math.round((second - first) / 86400000);
  }

  function wordCount(value) {
    return normalizedWords(value).length;
  }

  function officialUrl(sourceId, seconds) {
    var url = "https://www.youtube.com/watch?v=" + sourceId;
    return seconds == null
      ? url
      : url + "&t=" + Math.max(0, Math.floor(Number(seconds))) + "s";
  }

  function formatTime(value) {
    var seconds = Math.max(0, Math.floor(Number(value) || 0));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var tail = seconds % 60;
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" +
          String(tail).padStart(2, "0")
      : minutes + ":" + String(tail).padStart(2, "0");
  }

  function indexUnique(issues, values, path) {
    var output = new Map();
    values.forEach(function (value, index) {
      if (!isRecord(value)) return;
      var id = clean(value.id);
      if (output.has(id)) {
        issue(
          issues,
          path + "[" + index + "].id",
          "duplicate-id",
          path + " IDs must be unique."
        );
      } else if (id) {
        output.set(id, value);
      }
    });
    return output;
  }

  function scanForbiddenKeys(issues, value, path) {
    if (Array.isArray(value)) {
      value.forEach(function (entry, index) {
        scanForbiddenKeys(issues, entry, path + "[" + index + "]");
      });
      return;
    }
    if (!isRecord(value)) return;
    Object.keys(value).forEach(function (key) {
      if (PROTOTYPE_KEYS.includes(key)) {
        issue(
          issues,
          path ? path + "." + key : key,
          "prototype-key-firewall",
          "Prototype-sensitive keys are forbidden in longitudinal data and packets."
        );
      }
      if (FORBIDDEN_EXPORT_KEYS.includes(key.toLowerCase())) {
        issue(
          issues,
          path ? path + "." + key : key,
          "private-payload-field",
          "Raw caption, event, audio, video, and media payload fields are forbidden."
        );
      }
      scanForbiddenKeys(
        issues,
        value[key],
        path ? path + "." + key : key
      );
    });
  }

  function validateChannelPack(issues, channelPack) {
    if (!requireRecord(issues, channelPack, "channelPack")) return;
    if (
      !root.ShokkerChannelPack ||
      typeof root.ShokkerChannelPack.validate !== "function"
    ) {
      issue(
        issues,
        "channelPack",
        "missing-channel-pack-validator",
        "The canonical ChannelPack validator must be loaded before this engine."
      );
    } else {
      var report = root.ShokkerChannelPack.validate(channelPack);
      if (!report || !report.valid || !report.fingerprintVerified) {
        issue(
          issues,
          "channelPack",
          "invalid-channel-pack",
          "The compiled ChannelPack failed its own conformance or fingerprint check."
        );
      }
    }

    var identity = channelPack.identity;
    if (!requireRecord(issues, identity, "channelPack.identity")) return;
    requireString(issues, identity.id, "channelPack.identity.id", {
      max: 64,
      pattern: KEBAB,
    });
    requireString(issues, channelPack.fingerprint, "channelPack.fingerprint", {
      pattern: PACK_FINGERPRINT,
    });

    var policy = channelPack.evidencePolicy;
    if (!requireRecord(issues, policy, "channelPack.evidencePolicy")) return;
    if (
      !Number.isInteger(policy.publicExcerptWords) ||
      policy.publicExcerptWords < 1 ||
      policy.publicExcerptWords > 25
    ) {
      issue(
        issues,
        "channelPack.evidencePolicy.publicExcerptWords",
        "unsafe-excerpt-limit",
        "The ChannelPack public excerpt limit must be between 1 and 25 words."
      );
    }
    [
      ["timestampRequired", true],
      ["sourceUrlRequired", true],
      ["noSpeakerGuessing", true],
      ["promotionRequiresHumanReview", true],
      ["preserveContradictions", true],
      ["machineOutputState", "quarantine"],
    ].forEach(function (entry) {
      requireExact(
        issues,
        policy[entry[0]],
        entry[1],
        "channelPack.evidencePolicy." + entry[0],
        "unsafe-channel-policy"
      );
    });
    if (
      !Array.isArray(channelPack.capabilities) ||
      !channelPack.capabilities.includes("longitudinal-claim-ledger")
    ) {
      issue(
        issues,
        "channelPack.capabilities",
        "missing-capability",
        "The ChannelPack must explicitly declare longitudinal-claim-ledger."
      );
    }
    if (!isRecord(channelPack.longitudinalVocabulary)) {
      issue(
        issues,
        "channelPack.longitudinalVocabulary",
        "missing-longitudinal-vocabulary",
        "The ChannelPack must bind every machine-public longitudinal display label."
      );
    }
    if (
      !Array.isArray(channelPack.entityRegistry) ||
      channelPack.entityRegistry.length < 1
    ) {
      issue(
        issues,
        "channelPack.entityRegistry",
        "missing-entity-registry",
        "The ChannelPack must provide the trusted subject label registry."
      );
    }
  }

  function validateChannel(issues, channel, channelPack) {
    if (!requireRecord(issues, channel, "data.channel")) return;
    rejectUnknownKeys(issues, channel, "data.channel", CHANNEL_KEYS);
    var channelId = requireString(issues, channel.id, "data.channel.id", {
      max: 64,
      pattern: KEBAB,
    });
    var channelLabel = requireString(
      issues,
      channel.label,
      "data.channel.label",
      { max: 120 }
    );
    var fingerprint = requireString(
      issues,
      channel.packFingerprint,
      "data.channel.packFingerprint",
      { pattern: PACK_FINGERPRINT }
    );
    requireExact(
      issues,
      channel.platform,
      "youtube",
      "data.channel.platform",
      "unsupported-platform"
    );
    requireString(
      issues,
      channel.canonicalUrl,
      "data.channel.canonicalUrl",
      { max: 500 }
    );

    if (
      isRecord(channelPack) &&
      isRecord(channelPack.identity) &&
      channelId &&
      channelPack.identity.id !== channelId
    ) {
      issue(
        issues,
        "data.channel.id",
        "channel-pack-mismatch",
        "The docket channel ID must exactly match the ChannelPack identity."
      );
    }
    if (
      isRecord(channelPack) &&
      isRecord(channelPack.identity) &&
      channelLabel &&
      channelPack.identity.channel !== channelLabel
    ) {
      issue(
        issues,
        "data.channel.label",
        "channel-pack-mismatch",
        "The public channel label must exactly match the bound ChannelPack."
      );
    }
    if (
      isRecord(channelPack) &&
      fingerprint &&
      channelPack.fingerprint !== fingerprint
    ) {
      issue(
        issues,
        "data.channel.packFingerprint",
        "channel-pack-mismatch",
        "The docket must bind to the exact compiled ChannelPack fingerprint."
      );
    }
  }

  function validateLabels(issues, labels, channelPack) {
    if (!requireRecord(issues, labels, "data.labels")) return;
    rejectUnknownKeys(issues, labels, "data.labels", LABEL_KEYS);
    LABEL_KEYS.forEach(function (key) {
      var path = "data.labels." + key;
      var label = requireString(issues, labels[key], path, { max: 100 });
      if (
        isRecord(channelPack) &&
        isRecord(channelPack.longitudinalVocabulary) &&
        label &&
        label !== channelPack.longitudinalVocabulary[key]
      ) {
        issue(
          issues,
          path,
          "longitudinal-vocabulary-mismatch",
          "Machine-public longitudinal labels must exactly match the bound ChannelPack vocabulary."
        );
      }
      rejectTruthLanguage(issues, label, path);
    });
  }

  function validatePolicy(issues, policy, channelPack) {
    if (!requireRecord(issues, policy, "data.policy")) return;
    rejectUnknownKeys(issues, policy, "data.policy", POLICY_KEYS);
    var safeValues = [
      ["machineOutputState", "quarantine"],
      ["machinePairRelationship", "MAY_RESOLVE"],
      ["verdictAuthority", "authenticated-human-review-required"],
      ["promotionRequiresHumanReview", true],
      ["preserveContradictions", true],
      ["timestampRequired", true],
      ["sourceUrlRequired", true],
      ["noSpeakerGuessing", true],
      ["trailerAudioBoundaryRule", "topic-navigation-only"],
      ["visualOutcomeRule", "unresolved-until-whole-work-review"],
      ["exportRule", "bounded-public-evidence-only"],
    ];
    safeValues.forEach(function (entry) {
      requireExact(
        issues,
        policy[entry[0]],
        entry[1],
        "data.policy." + entry[0],
        "unsafe-docket-policy"
      );
    });
    if (
      !Number.isInteger(policy.publicExcerptWords) ||
      policy.publicExcerptWords < 1 ||
      policy.publicExcerptWords > 25
    ) {
      issue(
        issues,
        "data.policy.publicExcerptWords",
        "unsafe-excerpt-limit",
        "The docket public excerpt limit must be between 1 and 25 words."
      );
    }
    if (
      isRecord(channelPack) &&
      isRecord(channelPack.evidencePolicy) &&
      policy.publicExcerptWords !== channelPack.evidencePolicy.publicExcerptWords
    ) {
      issue(
        issues,
        "data.policy.publicExcerptWords",
        "channel-pack-mismatch",
        "The docket excerpt limit must match the bound ChannelPack."
      );
    }
  }

  function validateProvenance(issues, provenance) {
    if (!requireRecord(issues, provenance, "data.provenance")) return;
    rejectUnknownKeys(issues, provenance, "data.provenance", PROVENANCE_KEYS);
    requireExact(
      issues,
      provenance.generator,
      PROVENANCE_VALUES.generator,
      "data.provenance.generator",
      "provenance-vocabulary-mismatch"
    );
    requireExact(
      issues,
      provenance.networkUsed,
      false,
      "data.provenance.networkUsed",
      "network-boundary"
    );
    requireExact(
      issues,
      provenance.privateInput,
      PROVENANCE_VALUES.privateInput,
      "data.provenance.privateInput",
      "provenance-vocabulary-mismatch"
    );
    requireExact(
      issues,
      provenance.publicInput,
      PROVENANCE_VALUES.publicInput,
      "data.provenance.publicInput",
      "provenance-vocabulary-mismatch"
    );
    requireExact(
      issues,
      provenance.fullCaptionPayloadPublic,
      false,
      "data.provenance.fullCaptionPayloadPublic",
      "private-caption-boundary"
    );
    requireExact(
      issues,
      provenance.integrityNote,
      PROVENANCE_VALUES.integrityNote,
      "data.provenance.integrityNote",
      "provenance-vocabulary-mismatch"
    );
  }

  function validateSubjects(issues, subjects, channelPack) {
    var allowedTypes = new Set(
      isRecord(channelPack) &&
      isRecord(channelPack.taxonomy) &&
      Array.isArray(channelPack.taxonomy.entityTypes)
        ? channelPack.taxonomy.entityTypes
        : []
    );
    var registry = new Map(
      isRecord(channelPack) && Array.isArray(channelPack.entityRegistry)
        ? channelPack.entityRegistry.map(function (entry) {
            return [clean(entry && entry.id), entry];
          })
        : []
    );
    requireArray(
      issues,
      subjects,
      "data.subjects",
      1,
      MAX_COLLECTIONS.subjects
    ).forEach(
      function (subject, index) {
        var path = "data.subjects[" + index + "]";
        if (!requireRecord(issues, subject, path)) return;
        rejectUnknownKeys(issues, subject, path, SUBJECT_KEYS);
        var subjectId = requireString(issues, subject.id, path + ".id", {
          pattern: ENTITY_ID,
          max: 120,
        });
        var subjectLabel = requireString(
          issues,
          subject.label,
          path + ".label",
          { max: 120 }
        );
        var subjectType = requireString(issues, subject.type, path + ".type", {
          pattern: KEBAB,
          max: 60,
        });
        if (subjectType && !allowedTypes.has(subjectType)) {
          issue(
            issues,
            path + ".type",
            "channel-pack-taxonomy-mismatch",
            "Subject types must be declared by the bound ChannelPack taxonomy."
          );
        }
        var registered = registry.get(subjectId);
        if (
          subjectId &&
          (
            !isRecord(registered) ||
            registered.label !== subjectLabel ||
            registered.type !== subjectType
          )
        ) {
          issue(
            issues,
            path,
            "channel-pack-entity-mismatch",
            "Subject IDs, labels, and types must exactly match the bound ChannelPack entity registry."
          );
        }
      }
    );
  }

  function validateSources(issues, sources, channelPack) {
    var allowedLanes = new Set(
      isRecord(channelPack) && Array.isArray(channelPack.sourceLanes)
        ? channelPack.sourceLanes.map(function (lane) {
            return isRecord(lane) ? clean(lane.id) : "";
          }).filter(Boolean)
        : []
    );
    requireArray(
      issues,
      sources,
      "data.sources",
      2,
      MAX_COLLECTIONS.sources
    ).forEach(
      function (source, index) {
        var path = "data.sources[" + index + "]";
        if (!requireRecord(issues, source, path)) return;
        rejectUnknownKeys(issues, source, path, SOURCE_KEYS);
        var id = requireString(issues, source.id, path + ".id", {
          pattern: SOURCE_ID,
        });
        requireString(issues, source.title, path + ".title", { max: 220 });
        if (!validDate(source.date)) {
          issue(issues, path + ".date", "invalid-date", "Source dates must be real ISO dates.");
        }
        if (
          !Number.isInteger(source.durationSeconds) ||
          source.durationSeconds < 1 ||
          source.durationSeconds > 172800
        ) {
          issue(
            issues,
            path + ".durationSeconds",
            "invalid-duration",
            "Source duration must be an integer between 1 and 172800 seconds."
          );
        }
        if (id && source.url !== officialUrl(id)) {
          issue(
            issues,
            path + ".url",
            "noncanonical-source-url",
            "Source URLs must be canonical YouTube watch URLs."
          );
        }
        var sourceLane = requireString(issues, source.lane, path + ".lane", {
          pattern: KEBAB,
          max: 80,
        });
        if (sourceLane && !allowedLanes.has(sourceLane)) {
          issue(
            issues,
            path + ".lane",
            "channel-pack-source-lane-mismatch",
            "Source lanes must be declared by the bound ChannelPack."
          );
        }
        var contentMode = requireString(
          issues,
          source.contentMode,
          path + ".contentMode",
          {
          pattern: KEBAB,
          max: 80,
          }
        );
        var rights = requireString(
          issues,
          source.rightsMode,
          path + ".rightsMode",
          { max: 80 }
        );
        if (!CANDIDATE_RIGHTS.includes(rights) && !RESTRICTED_RIGHTS.includes(rights)) {
          issue(
            issues,
            path + ".rightsMode",
            "unsupported-rights-mode",
            "The source rights mode is not recognized."
          );
        }
        if (
          /(?:trailer-reaction|watch-party|script-reading)/.test(contentMode) &&
          CANDIDATE_RIGHTS.includes(rights)
        ) {
          issue(
            issues,
            path + ".rightsMode",
            "source-audio-boundary-firewall",
            "Mixed source-audio modes cannot self-declare short-caption candidate safety."
          );
        }
        if (
          /(?:visual-outcome|visual-ranking|tier-list)/.test(contentMode) &&
          rights !== "visual-context-unverified"
        ) {
          issue(
            issues,
            path + ".rightsMode",
            "visual-source-firewall",
            "Visual-outcome modes require the visual-context-unverified rights boundary."
          );
        }
        var expectedAccess = CANDIDATE_RIGHTS.includes(rights)
          ? "short-caption-candidate"
          : rights === "metadata-only"
            ? "metadata-only"
            : "topic-navigation-only";
        if (source.evidenceAccess !== expectedAccess) {
          issue(
            issues,
            path + ".evidenceAccess",
            "rights-access-mismatch",
            "Evidence access must match the declared source rights mode."
          );
        }
        requireExact(
          issues,
          source.captionTrack,
          "youtube-automatic-caption",
          path + ".captionTrack",
          "unsupported-caption-track"
        );
        requireString(
          issues,
          source.captionPayloadSha256,
          path + ".captionPayloadSha256",
          { pattern: SHA256 }
        );
        [
          ["speakerDiarized", false],
          ["originAttribution", false],
          ["visualContextVerified", false],
          ["promotionAllowed", false],
        ].forEach(function (entry) {
          requireExact(
            issues,
            source[entry[0]],
            entry[1],
            path + "." + entry[0],
            "unsafe-source-evidence"
          );
        });
      }
    );
  }

  function validateCandidateCollection(
    issues,
    values,
    collectionName,
    role,
    sourceMap,
    subjectMap,
    excerptLimit
  ) {
    var pathRoot = "data." + collectionName;
    requireArray(
      issues,
      values,
      pathRoot,
      1,
      MAX_COLLECTIONS[collectionName]
    ).forEach(
      function (candidate, index) {
        var path = pathRoot + "[" + index + "]";
        if (!requireRecord(issues, candidate, path)) return;
        rejectUnknownKeys(issues, candidate, path, CANDIDATE_KEYS);
        requireString(issues, candidate.id, path + ".id", {
          pattern: ENTITY_ID,
          max: 120,
        });
        var sourceId = requireString(
          issues,
          candidate.sourceId,
          path + ".sourceId",
          { pattern: SOURCE_ID }
        );
        requireExact(
          issues,
          candidate.role,
          role,
          path + ".role",
          "candidate-role-mismatch"
        );
        var timestamp = number(candidate.t);
        if (timestamp == null || timestamp < 0) {
          issue(
            issues,
            path + ".t",
            "invalid-timestamp",
            "Candidate timestamps must be finite and non-negative."
          );
        }
        var source = sourceMap.get(sourceId);
        if (!source) {
          issue(
            issues,
            path + ".sourceId",
            "unknown-source",
            "Candidate source IDs must resolve to a registered source."
          );
        } else {
          if (timestamp != null && timestamp >= source.durationSeconds) {
            issue(
              issues,
              path + ".t",
              "timestamp-out-of-range",
              "Candidate timestamps must fall inside the source duration."
            );
          }
          if (!CANDIDATE_RIGHTS.includes(source.rightsMode)) {
            issue(
              issues,
              path + ".sourceId",
              "source-evidence-firewall",
              "Metadata-only and topic-only sources cannot supply docket candidates."
            );
          }
          if (candidate.url !== officialUrl(sourceId, timestamp)) {
            issue(
              issues,
              path + ".url",
              "noncanonical-timestamp-url",
              "Candidate URLs must link to the exact registered source timestamp."
            );
          }
        }
        if (requireRecord(issues, candidate.window, path + ".window")) {
          rejectUnknownKeys(
            issues,
            candidate.window,
            path + ".window",
            WINDOW_KEYS
          );
          var from = number(candidate.window.from);
          var to = number(candidate.window.to);
          if (
            from == null ||
            to == null ||
            from < 0 ||
            to <= from ||
            timestamp == null ||
            timestamp < from ||
            timestamp > to
          ) {
            issue(
              issues,
              path + ".window",
              "invalid-evidence-window",
              "Evidence windows must contain the candidate timestamp."
            );
          }
          if (source && to != null && to > source.durationSeconds) {
            issue(
              issues,
              path + ".window.to",
              "window-out-of-range",
              "Evidence windows must remain inside the source duration."
            );
          }
        }
        var excerpt = requireString(
          issues,
          candidate.excerpt,
          path + ".excerpt",
          { max: 300 }
        );
        var words = wordCount(excerpt);
        if (!words || words > excerptLimit) {
          issue(
            issues,
            path + ".excerpt",
            "excerpt-limit",
            "Candidate excerpts must contain 1-" + excerptLimit + " words."
          );
        }
        var excerptMode = requireString(
          issues,
          candidate.excerptMode,
          path + ".excerptMode",
          { max: 100 }
        );
        if (
          excerptMode !== "normalized-automatic-caption-sequence" &&
          excerptMode !==
            "normalized-automatic-caption-fragments-with-marked-omission"
        ) {
          issue(
            issues,
            path + ".excerptMode",
            "unsupported-excerpt-mode",
            "Caption excerpts must declare a supported normalization mode."
          );
        }
        if (
          excerptMode ===
            "normalized-automatic-caption-fragments-with-marked-omission" &&
          !excerpt.includes("…")
        ) {
          issue(
            issues,
            path + ".excerpt",
            "unmarked-omission",
            "Joined caption fragments must visibly mark the omission."
          );
        }
        if (
          excerptMode === "normalized-automatic-caption-sequence" &&
          excerpt.includes("…")
        ) {
          issue(
            issues,
            path + ".excerpt",
            "unexpected-omission",
            "Continuous caption sequences cannot contain an editorial omission."
          );
        }
        var subjects = uniqueStrings(
          issues,
          candidate.subjects,
          path + ".subjects",
          {
            minimum: 1,
            maximum: MAX_COLLECTIONS.candidateSubjects,
            max: 120,
            pattern: ENTITY_ID,
          }
        );
        subjects.forEach(function (subjectId, subjectIndex) {
          if (!subjectMap.has(subjectId)) {
            issue(
              issues,
              path + ".subjects[" + subjectIndex + "]",
              "unknown-subject",
              "Candidate subjects must resolve to registered subject IDs."
            );
          }
        });
        requireExact(
          issues,
          candidate.cueType,
          role === "forecast"
            ? "explicit-forecast-language"
            : "retrospective-response-language",
          path + ".cueType",
          "candidate-cue-mismatch"
        );
        var cueTerms = uniqueStrings(
          issues,
          candidate.cueTerms,
          path + ".cueTerms",
          {
          minimum: 1,
          maximum: MAX_COLLECTIONS.cueTerms,
          max: 80,
          }
        );
        cueTerms.forEach(function (cue, cueIndex) {
          if (wordCount(cue) > excerptLimit) {
            issue(
              issues,
              path + ".cueTerms[" + cueIndex + "]",
              "cue-limit",
              "Cue terms must remain inside the public excerpt word limit."
            );
          }
          if (!containsPhrase(excerpt, cue)) {
            issue(
              issues,
              path + ".cueTerms[" + cueIndex + "]",
              "ungrounded-cue",
              "Every role cue must be a normalized phrase inside its public excerpt."
            );
          }
        });
        var bindings = requireArray(
          issues,
          candidate.subjectBindings,
          path + ".subjectBindings",
          1,
          MAX_COLLECTIONS.subjectBindings
        );
        var boundSubjects = [];
        bindings.forEach(function (binding, bindingIndex) {
          var bindingPath =
            path + ".subjectBindings[" + bindingIndex + "]";
          if (!requireRecord(issues, binding, bindingPath)) return;
          rejectUnknownKeys(
            issues,
            binding,
            bindingPath,
            SUBJECT_BINDING_KEYS
          );
          var boundSubject = requireString(
            issues,
            binding.subjectId,
            bindingPath + ".subjectId",
            { pattern: ENTITY_ID, max: 120 }
          );
          boundSubjects.push(boundSubject);
          var basis = requireString(
            issues,
            binding.basis,
            bindingPath + ".basis",
            { pattern: KEBAB, max: 40 }
          );
          if (!["excerpt", "source-title"].includes(basis)) {
            issue(
              issues,
              bindingPath + ".basis",
              "unsupported-subject-binding",
              "Subject bindings must use portable excerpt or source-title evidence."
            );
          }
          var bindingCue = requireString(
            issues,
            binding.cue,
            bindingPath + ".cue",
            { max: 100 }
          );
          if (basis === "excerpt" && !containsPhrase(excerpt, bindingCue)) {
            issue(
              issues,
              bindingPath + ".cue",
              "ungrounded-subject",
              "Excerpt-bound subjects require a cue inside the public excerpt."
            );
          }
          if (
            basis === "source-title" &&
            (!source || !containsPhrase(source.title, bindingCue))
          ) {
            issue(
              issues,
              bindingPath + ".cue",
              "ungrounded-subject",
              "Source-title-bound subjects require a cue inside the registered title."
            );
          }
        });
        if (
          stableJson(boundSubjects.slice().sort()) !==
          stableJson(subjects.slice().sort())
        ) {
          issue(
            issues,
            path + ".subjectBindings",
            "subject-binding-mismatch",
            "Subject bindings must account for every declared candidate subject exactly once."
          );
        }
        var additionalIds = new Set();
        requireArray(
          issues,
          candidate.additionalReceipts,
          path + ".additionalReceipts",
          0,
          MAX_COLLECTIONS.additionalReceipts
        ).forEach(function (receipt, receiptIndex) {
          var receiptPath =
            path + ".additionalReceipts[" + receiptIndex + "]";
          if (!requireRecord(issues, receipt, receiptPath)) return;
          rejectUnknownKeys(
            issues,
            receipt,
            receiptPath,
            ADDITIONAL_RECEIPT_KEYS
          );
          var receiptId = requireString(
            issues,
            receipt.id,
            receiptPath + ".id",
            { pattern: ENTITY_ID, max: 120 }
          );
          if (additionalIds.has(receiptId) || receiptId === candidate.id) {
            issue(
              issues,
              receiptPath + ".id",
              "duplicate-id",
              "Additional receipt IDs must be unique inside the candidate."
            );
          }
          additionalIds.add(receiptId);
          var receiptT = number(receipt.t);
          if (
            receiptT == null ||
            receiptT < 0 ||
            (source && receiptT >= source.durationSeconds)
          ) {
            issue(
              issues,
              receiptPath + ".t",
              "invalid-timestamp",
              "Additional receipt timestamps must fall inside the candidate source."
            );
          }
          if (
            sourceId &&
            receipt.url !== officialUrl(sourceId, receiptT)
          ) {
            issue(
              issues,
              receiptPath + ".url",
              "noncanonical-timestamp-url",
              "Additional receipt URLs must link to their exact source timestamp."
            );
          }
          if (requireRecord(issues, receipt.window, receiptPath + ".window")) {
            rejectUnknownKeys(
              issues,
              receipt.window,
              receiptPath + ".window",
              WINDOW_KEYS
            );
            var receiptFrom = number(receipt.window.from);
            var receiptTo = number(receipt.window.to);
            if (
              receiptFrom == null ||
              receiptTo == null ||
              receiptFrom < 0 ||
              receiptTo <= receiptFrom ||
              receiptT == null ||
              receiptT < receiptFrom ||
              receiptT > receiptTo ||
              (source && receiptTo > source.durationSeconds)
            ) {
              issue(
                issues,
                receiptPath + ".window",
                "invalid-evidence-window",
                "Additional evidence windows must contain the timestamp and remain inside the source."
              );
            }
          }
          var receiptExcerpt = requireString(
            issues,
            receipt.excerpt,
            receiptPath + ".excerpt",
            { max: 300 }
          );
          var receiptWords = wordCount(receiptExcerpt);
          if (!receiptWords || receiptWords > excerptLimit) {
            issue(
              issues,
              receiptPath + ".excerpt",
              "excerpt-limit",
              "Additional receipt excerpts must contain 1-" +
                excerptLimit + " words."
            );
          }
          var receiptMode = requireString(
            issues,
            receipt.excerptMode,
            receiptPath + ".excerptMode",
            { max: 100 }
          );
          if (receiptMode !== "normalized-automatic-caption-sequence") {
            issue(
              issues,
              receiptPath + ".excerptMode",
              "unsupported-excerpt-mode",
              "Each additional receipt must be one continuous caption sequence."
            );
          }
          uniqueStrings(
            issues,
            receipt.cueTerms,
            receiptPath + ".cueTerms",
            {
              minimum: 1,
              maximum: MAX_COLLECTIONS.cueTerms,
              max: 80,
            }
          ).forEach(function (cue, cueIndex) {
            if (wordCount(cue) > excerptLimit) {
              issue(
                issues,
                receiptPath + ".cueTerms[" + cueIndex + "]",
                "cue-limit",
                "Additional receipt cue terms must stay inside the excerpt limit."
              );
            }
            if (!containsPhrase(receiptExcerpt, cue)) {
              issue(
                issues,
                receiptPath + ".cueTerms[" + cueIndex + "]",
                "ungrounded-cue",
                "Every additional-receipt cue must occur inside that receipt excerpt."
              );
            }
          });
        });
        requireExact(
          issues,
          candidate.speaker,
          null,
          path + ".speaker",
          "speaker-inference-firewall"
        );
        requireExact(
          issues,
          candidate.originStatus,
          "not-inferred",
          path + ".originStatus",
          "origin-inference-firewall"
        );
        requireExact(
          issues,
          candidate.reviewStatus,
          "machine-candidate",
          path + ".reviewStatus",
          "review-state-firewall"
        );
        requireExact(
          issues,
          candidate.promotionAllowed,
          false,
          path + ".promotionAllowed",
          "promotion-firewall"
        );
        requireExact(
          issues,
          candidate.visualContextVerified,
          false,
          path + ".visualContextVerified",
          "visual-evidence-firewall"
        );
      }
    );
  }

  function validateDockets(
    issues,
    dockets,
    claimMap,
    responseMap,
    sourceMap,
    subjectMap,
    labels
  ) {
    var pairCoordinates = new Set();
    requireArray(
      issues,
      dockets,
      "data.dockets",
      1,
      MAX_COLLECTIONS.dockets
    ).forEach(
      function (docket, index) {
        var path = "data.dockets[" + index + "]";
        if (!requireRecord(issues, docket, path)) return;
        rejectUnknownKeys(issues, docket, path, DOCKET_KEYS);
        requireString(issues, docket.id, path + ".id", {
          pattern: ENTITY_ID,
          max: 120,
        });
        var docketTitle = requireString(
          issues,
          docket.title,
          path + ".title",
          { max: 220 }
        );
        rejectTruthLanguage(issues, docketTitle, path + ".title");
        var claimId = requireString(
          issues,
          docket.claimId,
          path + ".claimId",
          { pattern: ENTITY_ID }
        );
        var responseId = requireString(
          issues,
          docket.responseId,
          path + ".responseId",
          { pattern: ENTITY_ID }
        );
        var claim = claimMap.get(claimId);
        var response = responseMap.get(responseId);
        var coordinate = claimId + "\u0000" + responseId;
        if (pairCoordinates.has(coordinate)) {
          issue(
            issues,
            path,
            "duplicate-pair",
            "Each forecast/response coordinate may appear in only one canonical docket."
          );
        }
        pairCoordinates.add(coordinate);
        if (!claim) {
          issue(
            issues,
            path + ".claimId",
            "unknown-claim",
            "Docket claim IDs must resolve to forecast candidates."
          );
        }
        if (!response) {
          issue(
            issues,
            path + ".responseId",
            "unknown-response",
            "Docket response IDs must resolve to response candidates."
          );
        }
        if (claim && response && claim.sourceId === response.sourceId) {
          issue(
            issues,
            path,
            "same-source-pair",
            "A longitudinal pair must use two distinct sources."
          );
        }

        var docketSubjects = uniqueStrings(
          issues,
          docket.subjects,
          path + ".subjects",
          {
            minimum: 1,
            maximum: MAX_COLLECTIONS.candidateSubjects,
            max: 120,
            pattern: ENTITY_ID,
          }
        );
        var primarySubject = docketSubjects
          .map(function (subjectId) { return subjectMap.get(subjectId); })
          .filter(Boolean)
          .sort(function (left, right) {
            return (
              Number(left.type === "topic") - Number(right.type === "topic") ||
              compareText(left.id, right.id)
            );
          })[0];
        var expectedTitle = primarySubject && isRecord(labels)
          ? primarySubject.label + " // " + labels.forecast +
            " \u2192 " + labels.response
          : "";
        if (docketTitle && expectedTitle && docketTitle !== expectedTitle) {
          issue(
            issues,
            path + ".title",
            "docket-title-vocabulary-mismatch",
            "Machine docket titles must use the deterministic subject // forecast-to-response formula."
          );
        }
        docketSubjects.forEach(function (subjectId, subjectIndex) {
          if (!subjectMap.has(subjectId)) {
            issue(
              issues,
              path + ".subjects[" + subjectIndex + "]",
              "unknown-subject",
              "Docket subjects must resolve to registered subject IDs."
            );
          }
        });
        if (claim && response) {
          var shared = claim.subjects.filter(function (subjectId) {
            return response.subjects.includes(subjectId);
          }).sort();
          var declared = docketSubjects.slice().sort();
          if (!shared.length || stableJson(shared) !== stableJson(declared)) {
            issue(
              issues,
              path + ".subjects",
              "subject-pair-mismatch",
              "Docket subjects must exactly equal the shared candidate subjects."
            );
          }
        }

        requireExact(
          issues,
          docket.relationship,
          "MAY_RESOLVE",
          path + ".relationship",
          "truth-claim-firewall"
        );
        if (
          !["MAY_SUPPORT", "MAY_BE_MIXED", "OPEN"].includes(
            docket.pairSignal
          )
        ) {
          issue(
            issues,
            path + ".pairSignal",
            "unsupported-pair-signal",
            "Pair signals must be MAY_SUPPORT, MAY_BE_MIXED, or OPEN."
          );
        }
        var pairBasis = uniqueStrings(
          issues,
          docket.pairBasis,
          path + ".pairBasis",
          {
            minimum: 3,
            maximum: MAX_COLLECTIONS.pairBasis,
            max: 100,
            pattern: KEBAB,
          }
        );
        pairBasis.forEach(function (basis, basisIndex) {
          if (!PAIR_BASIS_VALUES.includes(basis)) {
            issue(
              issues,
              path + ".pairBasis[" + basisIndex + "]",
              "unsupported-pair-basis",
              "Machine pair bases must use the bounded neutral vocabulary."
            );
          }
          rejectTruthLanguage(
            issues,
            basis,
            path + ".pairBasis[" + basisIndex + "]"
          );
        });
        [
          "chronological-distinct-sources",
          "no-speaker-continuity-claim",
          "role-cues-present",
          "shared-subjects",
        ].forEach(function (required) {
          if (!pairBasis.includes(required)) {
            issue(
              issues,
              path + ".pairBasis",
              "missing-pair-basis",
              "Machine pairs require " + required + "."
            );
          }
        });
        if (
          docket.pairSignal === "MAY_BE_MIXED" &&
          (
            !response ||
            !Array.isArray(response.additionalReceipts) ||
            response.additionalReceipts.length < 1 ||
            !pairBasis.includes("mixed-response-receipts")
          )
        ) {
          issue(
            issues,
            path + ".pairSignal",
            "mixed-signal-firewall",
            "MAY_BE_MIXED requires multiple later response receipts and an explicit mixed-response basis."
          );
        }

        if (requireRecord(issues, docket.chronology, path + ".chronology")) {
          rejectUnknownKeys(
            issues,
            docket.chronology,
            path + ".chronology",
            CHRONOLOGY_KEYS
          );
          if (
            !validDate(docket.chronology.forecastDate) ||
            !validDate(docket.chronology.responseDate)
          ) {
            issue(
              issues,
              path + ".chronology",
              "invalid-date",
              "Docket chronology must contain real ISO dates."
            );
          }
          if (claim && response) {
            var claimSource = sourceMap.get(claim.sourceId);
            var responseSource = sourceMap.get(response.sourceId);
            if (claimSource && responseSource) {
              var expectedDays = daysBetween(
                claimSource.date,
                responseSource.date
              );
              if (expectedDays <= 0) {
                issue(
                  issues,
                  path + ".chronology",
                  "non-longitudinal-pair",
                  "The response source must be later than the forecast source."
                );
              }
              if (
                docket.chronology.forecastDate !== claimSource.date ||
                docket.chronology.responseDate !== responseSource.date ||
                docket.chronology.daysBetween !== expectedDays
              ) {
                issue(
                  issues,
                  path + ".chronology",
                  "chronology-mismatch",
                  "Declared chronology must exactly match the paired sources."
                );
              }
            }
          }
        }

        requireExact(
          issues,
          docket.verdict,
          null,
          path + ".verdict",
          "verdict-firewall"
        );
        requireExact(
          issues,
          docket.resolutionStatus,
          "unresolved",
          path + ".resolutionStatus",
          "resolution-firewall"
        );
        requireExact(
          issues,
          docket.reviewStatus,
          "machine-paired-unreviewed",
          path + ".reviewStatus",
          "review-state-firewall"
        );
        var blocked = uniqueStrings(
          issues,
          docket.resolutionBlockedBy,
          path + ".resolutionBlockedBy",
          {
            minimum: 2,
            maximum: MAX_COLLECTIONS.resolutionBlockedBy,
            max: 100,
            pattern: KEBAB,
          }
        );
        blocked.forEach(function (blocker, blockerIndex) {
          if (!RESOLUTION_BLOCK_VALUES.includes(blocker)) {
            issue(
              issues,
              path + ".resolutionBlockedBy[" + blockerIndex + "]",
              "unsupported-resolution-block",
              "Resolution blocks must use the bounded unresolved-state vocabulary."
            );
          }
          rejectTruthLanguage(
            issues,
            blocker,
            path + ".resolutionBlockedBy[" + blockerIndex + "]"
          );
        });
        [
          "authenticated-human-review-required",
          "outcome-not-independently-verified",
          "speaker-not-diarized",
        ].forEach(function (required) {
          if (!blocked.includes(required)) {
            issue(
              issues,
              path + ".resolutionBlockedBy",
              "missing-resolution-block",
              "Unreviewed pairs must retain " + required + "."
            );
          }
        });
        requireExact(
          issues,
          docket.requiresOutcomeVerification,
          true,
          path + ".requiresOutcomeVerification",
          "outcome-verification-firewall"
        );
        if (typeof docket.requiresWholeWorkVisualReview !== "boolean") {
          issue(
            issues,
            path + ".requiresWholeWorkVisualReview",
            "required-boolean",
            "Whole-work visual review must be declared explicitly."
          );
        }
        var visualClaimSource = claim
          ? sourceMap.get(claim.sourceId)
          : null;
        var visualResponseSource = response
          ? sourceMap.get(response.sourceId)
          : null;
        if (
          (
            (
              visualClaimSource &&
              visualClaimSource.rightsMode === "visual-context-unverified"
            ) ||
            (
              visualResponseSource &&
              visualResponseSource.rightsMode ===
                "visual-context-unverified"
            )
          ) &&
          docket.requiresWholeWorkVisualReview !== true
        ) {
          issue(
            issues,
            path + ".requiresWholeWorkVisualReview",
            "visual-source-firewall",
            "Visual-context-unverified sources require whole-work visual review."
          );
        }
        if (
          docket.requiresWholeWorkVisualReview === true &&
          !blocked.includes("whole-work-visual-review-required")
        ) {
          issue(
            issues,
            path + ".resolutionBlockedBy",
            "missing-visual-resolution-block",
            "Visual-outcome pairs must keep the whole-work review block."
          );
        }
        requireExact(
          issues,
          docket.visualOutcomeVerified,
          false,
          path + ".visualOutcomeVerified",
          "visual-outcome-firewall"
        );
        requireExact(
          issues,
          docket.speaker,
          null,
          path + ".speaker",
          "speaker-inference-firewall"
        );
        requireExact(
          issues,
          docket.promotionAllowed,
          false,
          path + ".promotionAllowed",
          "promotion-firewall"
        );
      }
    );
  }

  function validateFingerprints(issues, data) {
    var fingerprints = data.fingerprints;
    if (!requireRecord(issues, fingerprints, "data.fingerprints")) return;
    rejectUnknownKeys(
      issues,
      fingerprints,
      "data.fingerprints",
      FINGERPRINT_KEYS
    );
    var declaredCaptionSet = requireString(
      issues,
      fingerprints.captionSetSha256,
      "data.fingerprints.captionSetSha256",
      { pattern: SHA256 }
    );
    var actualCaptionSet = captionSetFingerprint(data.sources);
    if (declaredCaptionSet && declaredCaptionSet !== actualCaptionSet) {
      issue(
        issues,
        "data.fingerprints.captionSetSha256",
        "caption-set-fingerprint-mismatch",
        "The caption-set hash must be recomputed from every registered source hash."
      );
    }
    var declared = requireString(
      issues,
      fingerprints.publicFnv1a,
      "data.fingerprints.publicFnv1a",
      { pattern: FNV1A32 }
    );
    var actual = artifactFingerprint(data);
    if (declared && declared !== actual) {
      issue(
        issues,
        "data.fingerprints.publicFnv1a",
        "fingerprint-mismatch",
        "The public docket artifact changed after its deterministic fingerprint."
      );
    }
  }

  function validateData(data, channelPack) {
    var issues = [];
    if (!requireRecord(issues, data, "data")) return issues;
    var serializedBytes = utf8Bytes(JSON.stringify(data)).length;
    if (serializedBytes > MAX_DATA_BYTES) {
      issue(
        issues,
        "data",
        "data-byte-limit",
        "The public longitudinal docket exceeds its " +
          MAX_DATA_BYTES + "-byte validation budget."
      );
    }
    rejectUnknownKeys(issues, data, "data", TOP_KEYS);
    scanForbiddenKeys(issues, data, "data");
    requireExact(
      issues,
      data.schema,
      DATA_SCHEMA,
      "data.schema",
      "wrong-schema"
    );
    requireExact(
      issues,
      data.schemaVersion,
      VERSION,
      "data.schemaVersion",
      "unsupported-version"
    );
    if (!validDate(data.generated)) {
      issue(issues, "data.generated", "invalid-date", "Generated date must be a real ISO date.");
    }
    if (!validDate(data.snapshotDate)) {
      issue(issues, "data.snapshotDate", "invalid-date", "Snapshot date must be a real ISO date.");
    }
    validateChannelPack(issues, channelPack);
    validateChannel(issues, data.channel, channelPack);
    validateLabels(issues, data.labels, channelPack);
    validatePolicy(issues, data.policy, channelPack);
    validateProvenance(issues, data.provenance);
    validateSubjects(issues, data.subjects, channelPack);
    validateSources(issues, data.sources, channelPack);

    var subjectMap = indexUnique(issues, array(data.subjects), "data.subjects");
    var sourceMap = indexUnique(issues, array(data.sources), "data.sources");
    validateCandidateCollection(
      issues,
      data.claims,
      "claims",
      "forecast",
      sourceMap,
      subjectMap,
      data.policy && data.policy.publicExcerptWords
    );
    validateCandidateCollection(
      issues,
      data.responses,
      "responses",
      "response",
      sourceMap,
      subjectMap,
      data.policy && data.policy.publicExcerptWords
    );
    var claimMap = indexUnique(issues, array(data.claims), "data.claims");
    var responseMap = indexUnique(issues, array(data.responses), "data.responses");
    validateDockets(
      issues,
      data.dockets,
      claimMap,
      responseMap,
      sourceMap,
      subjectMap,
      data.labels
    );
    indexUnique(issues, array(data.dockets), "data.dockets");
    validateFingerprints(issues, data);
    return issues;
  }

  function normalizedData(data) {
    var copy = serialCopy(data);
    ["subjects", "sources", "claims", "responses", "dockets"].forEach(
      function (key) {
        copy[key] = array(copy[key]).slice().sort(function (left, right) {
          return clean(left.id).localeCompare(clean(right.id));
        });
      }
    );
    ["claims", "responses"].forEach(function (key) {
      copy[key].forEach(function (candidate) {
        candidate.subjects = candidate.subjects.slice().sort();
        candidate.subjectBindings = candidate.subjectBindings
          .slice()
          .sort(function (left, right) {
            return (
              left.subjectId.localeCompare(right.subjectId) ||
              left.basis.localeCompare(right.basis) ||
              left.cue.localeCompare(right.cue)
            );
          });
        candidate.cueTerms = candidate.cueTerms.slice().sort();
        candidate.additionalReceipts = candidate.additionalReceipts
          .slice()
          .sort(function (left, right) {
            return left.t - right.t || left.id.localeCompare(right.id);
          });
        candidate.additionalReceipts.forEach(function (receipt) {
          receipt.cueTerms = receipt.cueTerms.slice().sort();
        });
      });
    });
    copy.dockets.forEach(function (docket) {
      docket.subjects = docket.subjects.slice().sort();
      docket.pairBasis = docket.pairBasis.slice().sort();
      docket.resolutionBlockedBy = docket.resolutionBlockedBy.slice().sort();
    });
    return deepFreeze(copy);
  }

  function publicSource(source) {
    return {
      id: source.id,
      title: source.title,
      date: source.date,
      durationSeconds: source.durationSeconds,
      url: source.url,
      lane: source.lane,
      contentMode: source.contentMode,
      rightsMode: source.rightsMode,
      evidenceAccess: source.evidenceAccess,
      captionTrack: source.captionTrack,
      captionPayloadSha256: source.captionPayloadSha256,
      speakerDiarized: false,
      originAttribution: false,
      visualContextVerified: false,
      promotionAllowed: false,
    };
  }

  function publicCandidate(candidate) {
    return {
      id: candidate.id,
      sourceId: candidate.sourceId,
      role: candidate.role,
      t: candidate.t,
      timecode: formatTime(candidate.t),
      url: candidate.url,
      window: serialCopy(candidate.window),
      excerpt: candidate.excerpt,
      excerptMode: candidate.excerptMode,
      subjects: candidate.subjects.slice(),
      cueType: candidate.cueType,
      cueTerms: candidate.cueTerms.slice(),
      additionalReceipts: candidate.additionalReceipts.map(
        function (receipt) {
          return {
            id: receipt.id,
            sourceId: candidate.sourceId,
            t: receipt.t,
            timecode: formatTime(receipt.t),
            url: receipt.url,
            window: serialCopy(receipt.window),
            excerpt: receipt.excerpt,
            excerptMode: receipt.excerptMode,
            cueTerms: receipt.cueTerms.slice(),
          };
        }
      ),
      speaker: null,
      originStatus: "not-inferred",
      reviewStatus: "machine-candidate",
      promotionAllowed: false,
      visualContextVerified: false,
    };
  }

  function withFingerprint(value) {
    var packet = serialCopy(value);
    packet.fingerprint = packetFingerprint(packet);
    return deepFreeze(packet);
  }

  function scanPacketFirewalls(value, excerptLimit) {
    var errors = [];
    scanForbiddenKeys(errors, value, "packet");

    function walk(entry, path) {
      if (Array.isArray(entry)) {
        entry.forEach(function (child, index) {
          walk(child, path + "[" + index + "]");
        });
        return;
      }
      if (!isRecord(entry)) return;
      Object.keys(entry).forEach(function (key) {
        var childPath = path ? path + "." + key : key;
        var child = entry[key];
        if (key === "speaker" && child !== null) {
          errors.push({
            path: childPath,
            code: "speaker-inference-firewall",
            message: "Serialized machine packets cannot attribute a speaker.",
          });
        }
        if (key === "promotionAllowed" && child !== false) {
          errors.push({
            path: childPath,
            code: "promotion-firewall",
            message: "Serialized machine packets cannot allow promotion.",
          });
        }
        if (key === "verdict" && child !== null) {
          errors.push({
            path: childPath,
            code: "verdict-firewall",
            message: "Serialized machine packets cannot state a verdict.",
          });
        }
        if (key === "relationship" && child !== "MAY_RESOLVE") {
          errors.push({
            path: childPath,
            code: "truth-claim-firewall",
            message: "Serialized pairs may only claim MAY_RESOLVE.",
          });
        }
        if (
          key === "pairSignal" &&
          !["MAY_SUPPORT", "MAY_BE_MIXED", "OPEN"].includes(child)
        ) {
          errors.push({
            path: childPath,
            code: "unsupported-pair-signal",
            message: "Serialized pair signals must remain provisional navigation states.",
          });
        }
        if (
          key === "reviewStatus" &&
          !["machine-candidate", "machine-paired-unreviewed"].includes(child)
        ) {
          errors.push({
            path: childPath,
            code: "review-state-firewall",
            message: "Serialized machine packets cannot claim human review.",
          });
        }
        if (key === "resolutionStatus" && child !== "unresolved") {
          errors.push({
            path: childPath,
            code: "resolution-firewall",
            message: "Serialized machine packets must remain unresolved.",
          });
        }
        if (key === "originStatus" && child !== "not-inferred") {
          errors.push({
            path: childPath,
            code: "origin-inference-firewall",
            message: "Serialized machine packets cannot infer quote origin.",
          });
        }
        if (
          key === "speakerDiarized" ||
          key === "originAttribution" ||
          key === "visualContextVerified" ||
          key === "sourceMediaIncluded" ||
          key === "fullCaptionPayloadPublic" ||
          key === "autoplay"
        ) {
          if (child !== false) {
            errors.push({
              path: childPath,
              code: "evidence-boundary-firewall",
              message: "Serialized evidence-boundary flags must remain false.",
            });
          }
        }
        if (
          key === "requiresAuthenticatedHumanReview" &&
          child !== true
        ) {
          errors.push({
            path: childPath,
            code: "review-state-firewall",
            message: "Serialized packets must retain authenticated human review.",
          });
        }
        if (key === "assetStatus" && child !== "source-link-only") {
          errors.push({
            path: childPath,
            code: "asset-boundary-firewall",
            message: "Edit packets may contain source links only.",
          });
        }
        if (key === "visualOutcomeVerified" && child !== false) {
          errors.push({
            path: childPath,
            code: "visual-outcome-firewall",
            message: "Serialized machine packets cannot verify visual outcomes.",
          });
        }
        if (key === "excerpt" && wordCount(child) > excerptLimit) {
          errors.push({
            path: childPath,
            code: "excerpt-limit",
            message: "Serialized excerpts exceed the ChannelPack limit.",
          });
        }
        walk(child, childPath);
      });
    }
    walk(value, "packet");
    return errors;
  }

  function create(options, legacyData) {
    var settings;
    if (arguments.length > 1) {
      settings = { channelPack: options, data: legacyData };
    } else {
      settings = options || {};
    }
    var channelPack = settings.channelPack;
    var input = settings.data;
    var data;
    try {
      data = serialCopy(input);
    } catch {
      throw new DocketValidationError([{
        path: "data",
        code: "non-serializable",
        message: "Docket data must be a finite JSON-compatible object.",
      }]);
    }
    var issues = validateData(data, channelPack);
    if (issues.length) throw new DocketValidationError(issues);
    data = normalizedData(data);

    var subjectMap = new Map(data.subjects.map(function (entry) {
      return [entry.id, entry];
    }));
    var sourceMap = new Map(data.sources.map(function (entry) {
      return [entry.id, entry];
    }));
    var claimMap = new Map(data.claims.map(function (entry) {
      return [entry.id, entry];
    }));
    var responseMap = new Map(data.responses.map(function (entry) {
      return [entry.id, entry];
    }));
    var docketMap = new Map(data.dockets.map(function (entry) {
      return [entry.id, entry];
    }));

    function channelReceipt() {
      return {
        id: data.channel.id,
        label: data.channel.label,
        packFingerprint: data.channel.packFingerprint,
      };
    }

    function getSubjects() {
      var output = data.subjects.map(function (subject) {
        return {
          id: subject.id,
          label: subject.label,
          type: subject.type,
          forecastCount: data.claims.filter(function (claim) {
            return claim.subjects.includes(subject.id);
          }).length,
          responseCount: data.responses.filter(function (response) {
            return response.subjects.includes(subject.id);
          }).length,
          docketCount: data.dockets.filter(function (docket) {
            return docket.subjects.includes(subject.id);
          }).length,
        };
      });
      return deepFreeze(serialCopy(output));
    }

    function summary(docket) {
      var claim = claimMap.get(docket.claimId);
      var response = responseMap.get(docket.responseId);
      var claimSource = sourceMap.get(claim.sourceId);
      var responseSource = sourceMap.get(response.sourceId);
      return {
        id: docket.id,
        title: docket.title,
        subjects: docket.subjects.slice(),
        forecast: {
          sourceId: claimSource.id,
          date: claimSource.date,
          t: claim.t,
          timecode: formatTime(claim.t),
          url: claim.url,
        },
        response: {
          sourceId: responseSource.id,
          date: responseSource.date,
          t: response.t,
          timecode: formatTime(response.t),
          url: response.url,
        },
        relationship: "MAY_RESOLVE",
        pairSignal: docket.pairSignal,
        verdict: null,
        resolutionStatus: "unresolved",
        reviewStatus: "machine-paired-unreviewed",
        requiresWholeWorkVisualReview:
          docket.requiresWholeWorkVisualReview,
        visualOutcomeVerified: false,
        speaker: null,
        promotionAllowed: false,
      };
    }

    function list(filters) {
      var query = filters || {};
      if (!isRecord(query)) {
        throw new TypeError("Longitudinal docket filters must be an object.");
      }
      var allowed = ["subjectId", "reviewStatus", "limit"];
      Object.keys(query).forEach(function (key) {
        if (!allowed.includes(key)) {
          throw new TypeError("Unsupported longitudinal docket filter: " + key);
        }
      });
      var subjectId = clean(query.subjectId);
      if (subjectId && !subjectMap.has(subjectId)) return deepFreeze([]);
      var reviewStatus = clean(query.reviewStatus);
      if (
        reviewStatus &&
        reviewStatus !== "machine-paired-unreviewed"
      ) {
        return deepFreeze([]);
      }
      var limit = query.limit == null ? 100 : Math.floor(Number(query.limit));
      if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
        throw new RangeError("Longitudinal docket limit must be between 1 and 100.");
      }
      var output = data.dockets.filter(function (docket) {
        return (
          (!subjectId || docket.subjects.includes(subjectId)) &&
          (!reviewStatus || docket.reviewStatus === reviewStatus)
        );
      }).slice(0, limit).map(summary);
      return deepFreeze(serialCopy(output));
    }

    function inspectionCore(docket) {
      var claim = claimMap.get(docket.claimId);
      var response = responseMap.get(docket.responseId);
      return {
        channel: channelReceipt(),
        labels: serialCopy(data.labels),
        docket: serialCopy(docket),
        forecast: {
          candidate: publicCandidate(claim),
          source: publicSource(sourceMap.get(claim.sourceId)),
        },
        response: {
          candidate: publicCandidate(response),
          source: publicSource(sourceMap.get(response.sourceId)),
        },
        guardrail: {
          relationshipAuthority: "MAY_RESOLVE only",
          verdictAuthority: data.policy.verdictAuthority,
          sourceMediaIncluded: false,
          requiresAuthenticatedHumanReview: true,
        },
      };
    }

    function inspect(docketId) {
      var docket = docketMap.get(clean(docketId));
      if (!docket) return null;
      var core = inspectionCore(docket);
      core.schema = INSPECTION_SCHEMA;
      core.schemaVersion = VERSION;
      core.generated = data.generated;
      return withFingerprint(core);
    }

    function clipWindow(
      receipt,
      source,
      clipDuration,
      role,
      label,
      order
    ) {
      var before = clipDuration / 3;
      var from = Math.max(0, receipt.t - before);
      var to = Math.min(source.durationSeconds, from + clipDuration);
      if (to - from < clipDuration && to === source.durationSeconds) {
        from = Math.max(0, to - clipDuration);
      }
      from = roundHundredth(from);
      to = roundHundredth(to);
      return {
        order: order,
        role: role,
        label: label,
        sourceId: source.id,
        sourceTitle: source.title,
        sourceDate: source.date,
        anchorT: receipt.t,
        anchorTimecode: formatTime(receipt.t),
        receiptUrl: receipt.url,
        suggestedWindow: {
          from: from,
          to: to,
          durationSeconds: roundHundredth(to - from),
          url: officialUrl(source.id, from),
        },
        excerpt: receipt.excerpt,
        excerptMode: receipt.excerptMode,
        rightsMode: source.rightsMode,
        assetStatus: "source-link-only",
        speaker: null,
        promotionAllowed: false,
      };
    }

    function buildEditBrief(docketId, options) {
      var docket = docketMap.get(clean(docketId));
      if (!docket) return null;
      var query = options || {};
      if (!isRecord(query)) {
        throw new TypeError("Edit-brief options must be an object.");
      }
      Object.keys(query).forEach(function (key) {
        if (key !== "durationSeconds") {
          throw new TypeError("Unsupported edit-brief option: " + key);
        }
      });
      var duration = query.durationSeconds == null
        ? 60
        : Number(query.durationSeconds);
      if (!EDIT_DURATIONS.includes(duration)) {
        throw new RangeError("Edit briefs support exactly 30, 60, or 90 seconds.");
      }
      var claim = claimMap.get(docket.claimId);
      var response = responseMap.get(docket.responseId);
      var receiptCount = 2 + response.additionalReceipts.length;
      var clipDuration = duration / receiptCount;
      var sequence = [
        clipWindow(
          claim,
          sourceMap.get(claim.sourceId),
          clipDuration,
          "forecast",
          data.labels.forecast,
          1
        ),
        clipWindow(
          response,
          sourceMap.get(response.sourceId),
          clipDuration,
          "response",
          data.labels.response +
            (response.additionalReceipts.length ? " · 1" : ""),
          2
        ),
      ];
      response.additionalReceipts.forEach(function (receipt, index) {
        sequence.push(
          clipWindow(
            receipt,
            sourceMap.get(response.sourceId),
            clipDuration,
            "response",
            data.labels.response + " · " + (index + 2),
            index + 3
          )
        );
      });
      var core = {
        schema: EDIT_BRIEF_SCHEMA,
        schemaVersion: VERSION,
        generated: data.generated,
        channel: channelReceipt(),
        docketId: docket.id,
        title: docket.title,
        label: data.labels.editBrief,
        targetDurationSeconds: duration,
        sequence: sequence,
        relationship: "MAY_RESOLVE",
        pairSignal: docket.pairSignal,
        verdict: null,
        resolutionStatus: "unresolved",
        visualOutcomeVerified: false,
        speaker: null,
        promotionAllowed: false,
        requiresAuthenticatedHumanReview: true,
        autoplay: false,
        editorialGuardrails: [
          "Retain the on-screen source title, date, and timestamp for both receipts.",
          "Present the pairing as MAY_RESOLVE; do not add right, wrong, support, or contradiction language.",
          "Human-check speaker identity, source-audio boundaries, and the whole-work outcome before publication.",
          "This packet contains source links and edit suggestions, not source media or rights clearance.",
        ],
      };
      return withFingerprint(core);
    }

    function exportPacket() {
      var core = {
        schema: EXPORT_SCHEMA,
        schemaVersion: VERSION,
        generated: data.generated,
        snapshotDate: data.snapshotDate,
        channel: channelReceipt(),
        labels: serialCopy(data.labels),
        policy: {
          machineOutputState: "quarantine",
          relationship: "MAY_RESOLVE",
          verdictAuthority: data.policy.verdictAuthority,
          publicExcerptWords: data.policy.publicExcerptWords,
          promotionRequiresHumanReview: true,
          preserveContradictions: true,
          sourceMediaIncluded: false,
          fullCaptionPayloadPublic: false,
        },
        subjects: serialCopy(getSubjects()),
        records: data.dockets.map(inspectionCore),
        provenance: {
          generator: data.provenance.generator,
          networkUsed: false,
          dataFingerprint: data.fingerprints.publicFnv1a,
          captionSetSha256: data.fingerprints.captionSetSha256,
        },
      };
      return withFingerprint(core);
    }

    function verify(value) {
      if (arguments.length === 0 || value == null) {
        var actual = artifactFingerprint(data);
        return deepFreeze({
          ok: actual === data.fingerprints.publicFnv1a,
          kind: "data-artifact",
          schema: DATA_SCHEMA,
          expected: data.fingerprints.publicFnv1a,
          actual: actual,
          errors: [],
          changeDetectorOnly: true,
        });
      }
      var errors = [];
      var canonicalPacket = null;
      var packetSerializable = true;
      var packetBytes = 0;
      try {
        packetBytes = utf8Bytes(JSON.stringify(value)).length;
      } catch {
        packetSerializable = false;
        errors.push({
          path: "packet",
          code: "non-serializable",
          message: "Only finite JSON-compatible packets can be verified.",
        });
      }
      if (packetBytes > MAX_PACKET_BYTES) {
        errors.push({
          path: "packet",
          code: "packet-byte-limit",
          message: "The bounded packet exceeds its public byte budget.",
        });
      }
      if (!isRecord(value)) {
        errors.push({
          path: "packet",
          code: "required-object",
          message: "Only engine packet objects can be verified.",
        });
      } else if (!packetSerializable) {
        canonicalPacket = null;
      } else {
        if (
          ![INSPECTION_SCHEMA, EDIT_BRIEF_SCHEMA, EXPORT_SCHEMA].includes(
            value.schema
          )
        ) {
          errors.push({
            path: "packet.schema",
            code: "wrong-schema",
            message: "The packet schema is not a longitudinal docket export schema.",
          });
        } else {
          try {
            if (value.schema === INSPECTION_SCHEMA) {
              canonicalPacket = inspect(
                value.docket && value.docket.id
              );
            } else if (value.schema === EDIT_BRIEF_SCHEMA) {
              canonicalPacket = buildEditBrief(value.docketId, {
                durationSeconds: value.targetDurationSeconds,
              });
            } else {
              canonicalPacket = exportPacket();
            }
          } catch {
            canonicalPacket = null;
          }
          if (
            !canonicalPacket ||
            stableJson(value) !== stableJson(canonicalPacket)
          ) {
            errors.push({
              path: "packet",
              code: "packet-shape-mismatch",
              message: "The packet is not a bounded canonical output of this engine.",
            });
          }
        }
        if (
          !isRecord(value.channel) ||
          value.channel.id !== data.channel.id ||
          value.channel.packFingerprint !== data.channel.packFingerprint
        ) {
          errors.push({
            path: "packet.channel",
            code: "channel-pack-mismatch",
            message: "The packet does not bind to this engine's ChannelPack.",
          });
        }
        errors.push.apply(
          errors,
          scanPacketFirewalls(value, data.policy.publicExcerptWords)
        );
      }
      var expected = isRecord(value) ? clean(value.fingerprint) : "";
      var actualFingerprint = "";
      if (isRecord(value) && packetSerializable) {
        try {
          actualFingerprint = packetFingerprint(value);
        } catch {
          errors.push({
            path: "packet",
            code: "non-serializable",
            message: "Only finite JSON-compatible packets can be verified.",
          });
        }
      }
      if (!expected || expected !== actualFingerprint) {
        errors.push({
          path: "packet.fingerprint",
          code: "fingerprint-mismatch",
          message: "The packet changed after its deterministic fingerprint.",
        });
      }
      return deepFreeze({
        ok: errors.length === 0,
        kind: "bounded-packet",
        schema: isRecord(value) ? clean(value.schema) : "",
        expected: expected,
        actual: actualFingerprint,
        errors: serialCopy(errors),
        changeDetectorOnly: true,
      });
    }

    function serialize(value) {
      var packet = arguments.length === 0 ? exportPacket() : value;
      var report = verify(packet);
      if (!report.ok) {
        throw new DocketValidationError(report.errors);
      }
      return stableJson(packet);
    }

    return deepFreeze({
      version: VERSION,
      schema: SCHEMA,
      getSubjects: getSubjects,
      list: list,
      inspect: inspect,
      buildEditBrief: buildEditBrief,
      verify: verify,
      serialize: serialize,
    });
  }

  var api = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    DATA_SCHEMA: DATA_SCHEMA,
    INSPECTION_SCHEMA: INSPECTION_SCHEMA,
    EDIT_BRIEF_SCHEMA: EDIT_BRIEF_SCHEMA,
    EXPORT_SCHEMA: EXPORT_SCHEMA,
    DocketValidationError: DocketValidationError,
    create: create,
  });
  Object.defineProperty(root, "ShokkerLongitudinalDocket", {
    value: api,
    enumerable: true,
    writable: false,
    configurable: false,
  });
})(typeof window !== "undefined" ? window : globalThis);
