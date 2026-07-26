(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var CANONICAL_DOCKET_FACTORY = root.ShokkerLongitudinalDocket || null;
  var CANONICAL_PACK_FACTORY = root.ShokkerChannelPack || null;
  var SESSION_SCHEMA = "shokker-youtube-wiki/verdict-room-session/v1";
  var EVENT_SCHEMA = "shokker-youtube-wiki/verdict-room-event/v1";
  var EXPORT_SCHEMA = "shokker-youtube-wiki/verdict-room-export/v1";
  var REQUIRED_CAPABILITIES = Object.freeze([
    "longitudinal-claim-ledger",
    "human-adjudication-ledger",
  ]);
  var VERDICT_CODES = Object.freeze([
    "SUPPORTED",
    "CONTRADICTED",
    "MIXED",
  ]);
  var VERDICT_WORDING = Object.freeze({
    SUPPORTED:
      "Within this reviewed docket, the relied-on later evidence supports the bounded earlier proposition.",
    CONTRADICTED:
      "Within this reviewed docket, the relied-on later evidence contradicts the bounded earlier proposition.",
    MIXED:
      "Within this reviewed docket, the relied-on later evidence both supports and contradicts parts of the bounded earlier proposition.",
  });
  var EVIDENCE_CHECK_CODES = Object.freeze([
    "CANONICAL_PACKET",
    "BEFORE_CONTEXT",
    "AFTER_CONTEXT",
    "CHRONOLOGY",
    "SUBJECT_SCOPE",
    "CONTRADICTION_SWEEP",
    "SOURCE_AUDIO_BOUNDARY",
    "RIGHTS_BOUNDARY",
    "OUTCOME_REVIEW",
    "SPEAKER_EXCLUDED",
    "CAUSALITY_EXCLUDED",
  ]);
  var CHECK_CODES = Object.freeze(
    EVIDENCE_CHECK_CODES.concat(["PUBLIC_WORDING"])
  );
  var STATES = Object.freeze([
    "UNREVIEWED",
    "NEEDS_CONTEXT",
    "EVIDENCE_CHECKED",
    "WORDING_CHECKED",
    "ADJUDICATED",
    "REVOKED",
    "REJECTED",
    "STALE_INPUT",
  ]);
  var EVENT_TYPES = Object.freeze([
    "CHECK",
    "NEEDS_CONTEXT",
    "REJECT",
    "LOCK_WORDING",
    "ADJUDICATE",
    "UNDO",
    "REVOKE",
  ]);
  var REJECTION_CODES = Object.freeze([
    "INSUFFICIENT_EVIDENCE",
    "OUT_OF_SCOPE",
    "RIGHTS_BOUNDARY",
    "DUPLICATE",
  ]);
  var OUTCOME_METHODS = Object.freeze([
    "WHOLE_WORK_REVIEW",
    "DECLARED_PRIMARY_SOURCE",
  ]);
  var DISPOSITIONS = Object.freeze(["RELIED_ON", "CONTEXT_ONLY"]);
  var STANCES = Object.freeze([
    "PROPOSITION",
    "SUPPORTING",
    "CONTRADICTING",
    "NEUTRAL",
  ]);
  var LIMITS = Object.freeze({
    importBytes: 2_000_000,
    ledgerBytes: 1_500_000,
    dockets: 500,
    events: 10_000,
    eventsPerDocket: 250,
    noteCharacters: 4_000,
    wordingCharacters: 4_000,
    referenceCharacters: 1_000,
    evidenceReferences: 100,
    jsonDepth: 32,
    packetBytes: 250_000,
  });
  var AUTOMATION_DISCLOSURE =
    /\b(?:a\s*i|artificial\s+intelligence|automation|automated|algorithm(?:ic)?|assistant|bot|robot|software|computer(?:\s+generated)?|synthetic|chat\s*gpt|open\s*ai|anthropic|claude|codex|co\s*pilot|gemini|grok|gpt(?:\s*\d+(?:\s*\.\s*\d+)?)?|l\s*l\s*m|m\s*l|large\s+language\s+model|machine(?:\s+learning)?|neural\s+network|generative\s+model|model|system)\b/i;
  var UNSAFE_WORDING = [
    /\b(?:he|she|they|him|her|them|his|hers|their|theirs)\b/i,
    /\b(?:according\s+to|in\s+(?:the|his|her|their)\s+words|same\s+(?:speaker|person|host|voice)|speaker\s+continuity)\b/i,
    /\b(?:speaker|host|announcer|commentator|performer|creator|person|voice|guy)\b/i,
    /\b[a-z][a-z'’-]{0,40}(?:['’]s|\s+)(?:claim|call|prediction|promise|words?|take|voice)\b/i,
    /\b[a-z][a-z'’-]{0,40}\s+(?:said|says|predicted|predicts|promised|called\s+it|knew|claimed|admitted|repeated|foresaw|nailed\s+it)\b/i,
    /\b[a-z][a-z'’-]{0,40}\s+(?:was|is|got\s+it)\s+(?:right|wrong|correct|incorrect)\b/i,
    /\b(?:said|spoken|predicted|promised|claimed|called)\s+by\b/i,
    /\b(?:cause[ds]?|causing|because\s+of|due\s+to|led\s+to|resulted\s+in|triggered|prompted|forced|drove|influenced|produced|created|sparked|brought\s+about|set\s+off|gave\s+rise\s+to|responsible\s+for|as\s+a\s+result\s+of|consequently|made\s+(?:it|that|this)\s+happen)\b/i,
    /\b(?:creator\s+certified|canon\s+approved|canon\s+certified|speaker\s+verified|rights?\s+clear(?:ed|ance)|copyright\s+clear(?:ed|ance)|licensed|authorized|permission\s+(?:granted|secured)|promoted\s+to\s+canon)\b/i,
    /\b(?:universally|definitively|objectively)\s+(?:true|false|proved|proven)\b/i,
    /[<>]/,
  ];
  var FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  var BOUNDARY = Object.freeze({
    localOnly: true,
    identityVerified: false,
    creatorCertified: false,
    speaker: null,
    speakerInferred: false,
    causalityClaimed: false,
    rightsCleared: false,
    canonMutated: false,
    serverPersisted: false,
    engineGeneratedDecision: false,
  });
  var SHA256_CONSTANTS = Object.freeze([
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
  ]);

  class VerdictRoomError extends Error {
    constructor(code, message, details) {
      super(message);
      this.name = "VerdictRoomError";
      this.code = code;
      if (details && Object.keys(details).length) {
        this.details = stableValue(details);
      }
    }
  }

  function fail(code, message, details) {
    throw new VerdictRoomError(code, message, details);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function requireOwn(value, key, path) {
    if (!value || typeof value !== "object" || !own(value, key)) {
      fail(
        "INHERITED_FIELD",
        path + "." + key + " must be an own ChannelPack field."
      );
    }
    return value[key];
  }

  function plainRecord(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return false;
    }
    var prototype = Object.getPrototypeOf(value);
    return (
      prototype === null ||
      (
        own(prototype, "constructor") &&
        prototype.constructor &&
        prototype.constructor.name === "Object" &&
        Object.getPrototypeOf(prototype) === null
      )
    );
  }

  function ownDataContainer(value, path, expectArray) {
    var wantsArray = expectArray === true;
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) !== wantsArray
    ) {
      fail(
        "TYPE_INVALID",
        path + (wantsArray ? " must be an array." : " must be an object.")
      );
    }
    if (!wantsArray && !plainRecord(value)) {
      fail(
        "UNSAFE_PROTOTYPE",
        path + " must not inherit from an incompatible prototype."
      );
    }
    if (Object.getOwnPropertySymbols(value).length) {
      fail("UNSAFE_DESCRIPTOR", path + " must not contain symbol fields.");
    }
    for (var inheritedKey in value) {
      if (!own(value, inheritedKey)) {
        fail(
          "INHERITED_FIELD",
          path + "." + inheritedKey + " must be an own field."
        );
      }
    }
    var output = wantsArray ? [] : {};
    var names = Object.getOwnPropertyNames(value);
    names.forEach(function (key) {
      if (wantsArray && key === "length") return;
      if (FORBIDDEN_KEYS.has(key)) {
        fail("UNSAFE_KEY", path + " contains a forbidden object key.", {
          key: key,
        });
      }
      var descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        !descriptor ||
        own(descriptor, "get") ||
        own(descriptor, "set") ||
        descriptor.enumerable !== true
      ) {
        fail(
          "UNSAFE_DESCRIPTOR",
          path + "." + key + " must be an enumerable own-data field."
        );
      }
      if (
        wantsArray &&
        (!/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)
      ) {
        fail(
          "UNSAFE_DESCRIPTOR",
          path + "." + key + " is not a canonical array index."
        );
      }
      output[key] = descriptor.value;
    });
    if (
      wantsArray &&
      (
        output.length !== value.length ||
        names.filter(function (key) { return key !== "length"; }).length !==
          value.length
      )
    ) {
      fail("TYPE_INVALID", path + " must not contain sparse array entries.");
    }
    return output;
  }

  function ownDataObject(value, path) {
    return ownDataContainer(value, path, false);
  }

  function ownDataArray(value, path) {
    return ownDataContainer(value, path, true);
  }

  function assertOwnedTree(value, path, seen) {
    if (!value || typeof value !== "object") return;
    var visited = seen || new Set();
    if (visited.has(value)) {
      fail("TYPE_INVALID", path + " contains a circular reference.");
    }
    var prototype = Object.getPrototypeOf(value);
    var canonicalArray = Array.isArray(value) && Boolean(
      prototype &&
      own(prototype, "constructor") &&
      prototype.constructor &&
      prototype.constructor.name === "Array"
    );
    if (
      (Array.isArray(value) && !canonicalArray) ||
      (!Array.isArray(value) && !plainRecord(value))
    ) {
      fail(
        "UNSAFE_PROTOTYPE",
        path + " must not inherit from a caller-defined prototype."
      );
    }
    if (!Object.isFrozen(value)) {
      fail(
        "MUTABLE_CHANNEL_PACK",
        path + " must be a deeply frozen compiled ChannelPack artifact."
      );
    }
    if (Object.getOwnPropertySymbols(value).length) {
      fail(
        "UNSAFE_DESCRIPTOR",
        path + " must not contain symbol-keyed ChannelPack fields."
      );
    }
    visited.add(value);
    for (var key in value) {
      if (!own(value, key)) {
        fail(
          "INHERITED_FIELD",
          path + "." + key + " must be an own field."
        );
      }
    }
    Object.getOwnPropertyNames(value).forEach(function (key) {
      var descriptor = Object.getOwnPropertyDescriptor(value, key);
      var arrayLength = Array.isArray(value) && key === "length";
      if (
        !descriptor ||
        own(descriptor, "get") ||
        own(descriptor, "set") ||
        descriptor.configurable !== false ||
        (own(descriptor, "writable") && descriptor.writable !== false) ||
        (!arrayLength && descriptor.enumerable !== true)
      ) {
        fail(
          "UNSAFE_DESCRIPTOR",
          path + "." + key +
            " must be a frozen enumerable own-data ChannelPack field."
        );
      }
      if (!arrayLength) {
        assertOwnedTree(
          descriptor.value,
          path + "." + key,
          visited
        );
      }
    });
    visited.delete(value);
  }

  function clean(value) {
    return typeof value === "string"
      ? value.replace(/\s+/g, " ").trim()
      : "";
  }

  function disclosureText(value) {
    var output = typeof value === "string" ? value : "";
    if (typeof output.normalize === "function") {
      output = output.normalize("NFKC");
    }
    return output
      .replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
      .replace(/[013457]/g, function (digit) {
        return {
          "0": "o",
          "1": "i",
          "3": "e",
          "4": "a",
          "5": "s",
          "7": "t",
        }[digit];
      })
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim();
  }

  function containsAutomationDisclosure(value) {
    return AUTOMATION_DISCLOSURE.test(disclosureText(value));
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function compareText(left, right) {
    return left < right ? -1 : (left > right ? 1 : 0);
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
    return value;
  }

  function frozen(value) {
    return freezeDeep(clone(value));
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value).sort(compareText).reduce(function (output, key) {
        var child = value[key];
        if (child !== undefined && typeof child !== "function") {
          output[key] = stableValue(child);
        }
        return output;
      }, {});
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

  function utf8Bytes(value) {
    var output = [];
    var source = String(value == null ? "" : value);
    for (var index = 0; index < source.length; index += 1) {
      var code = source.charCodeAt(index);
      if (code >= 0xd800 && code <= 0xdbff && index + 1 < source.length) {
        var next = source.charCodeAt(index + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
          index += 1;
        }
      }
      if (code <= 0x7f) {
        output.push(code);
      } else if (code <= 0x7ff) {
        output.push(0xc0 | (code >>> 6), 0x80 | (code & 0x3f));
      } else if (code <= 0xffff) {
        output.push(
          0xe0 | (code >>> 12),
          0x80 | ((code >>> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      } else {
        output.push(
          0xf0 | (code >>> 18),
          0x80 | ((code >>> 12) & 0x3f),
          0x80 | ((code >>> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      }
    }
    return output;
  }

  function rotateRight(value, shift) {
    return (value >>> shift) | (value << (32 - shift));
  }

  function sha256(value) {
    var bytes = utf8Bytes(value);
    var bitLength = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var high = Math.floor(bitLength / 0x100000000);
    var low = bitLength >>> 0;
    for (var highShift = 24; highShift >= 0; highShift -= 8) {
      bytes.push((high >>> highShift) & 0xff);
    }
    for (var lowShift = 24; lowShift >= 0; lowShift -= 8) {
      bytes.push((low >>> lowShift) & 0xff);
    }

    var hashes = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];
    var words = new Array(64);
    for (var offset = 0; offset < bytes.length; offset += 64) {
      for (var word = 0; word < 16; word += 1) {
        var at = offset + word * 4;
        words[word] = (
          (bytes[at] << 24) |
          (bytes[at + 1] << 16) |
          (bytes[at + 2] << 8) |
          bytes[at + 3]
        ) >>> 0;
      }
      for (var extend = 16; extend < 64; extend += 1) {
        var left = words[extend - 15];
        var right = words[extend - 2];
        var small0 =
          rotateRight(left, 7) ^ rotateRight(left, 18) ^ (left >>> 3);
        var small1 =
          rotateRight(right, 17) ^ rotateRight(right, 19) ^ (right >>> 10);
        words[extend] = (
          words[extend - 16] +
          small0 +
          words[extend - 7] +
          small1
        ) >>> 0;
      }

      var a = hashes[0];
      var b = hashes[1];
      var c = hashes[2];
      var d = hashes[3];
      var e = hashes[4];
      var f = hashes[5];
      var g = hashes[6];
      var h = hashes[7];
      for (var round = 0; round < 64; round += 1) {
        var big1 =
          rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        var choose = (e & f) ^ (~e & g);
        var temp1 = (
          h +
          big1 +
          choose +
          SHA256_CONSTANTS[round] +
          words[round]
        ) >>> 0;
        var big0 =
          rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        var majority = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (big0 + majority) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }
      hashes[0] = (hashes[0] + a) >>> 0;
      hashes[1] = (hashes[1] + b) >>> 0;
      hashes[2] = (hashes[2] + c) >>> 0;
      hashes[3] = (hashes[3] + d) >>> 0;
      hashes[4] = (hashes[4] + e) >>> 0;
      hashes[5] = (hashes[5] + f) >>> 0;
      hashes[6] = (hashes[6] + g) >>> 0;
      hashes[7] = (hashes[7] + h) >>> 0;
    }
    return "sha256:" + hashes.map(function (hash) {
      return hash.toString(16).padStart(8, "0");
    }).join("");
  }

  function hashCanonical(value) {
    return sha256(stableJson(value));
  }

  function byteLength(value) {
    return utf8Bytes(value).length;
  }

  function rejectUnknownKeys(value, allowed, path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail("TYPE_INVALID", path + " must be an object.");
    }
    Object.keys(value).forEach(function (key) {
      if (FORBIDDEN_KEYS.has(key)) {
        fail("UNSAFE_KEY", path + " contains a forbidden object key.", {
          key: key,
        });
      }
      if (allowed.indexOf(key) < 0) {
        fail("UNKNOWN_FIELD", path + " contains an unsupported field.", {
          key: key,
        });
      }
    });
  }

  function requiredString(value, path, maximum) {
    var output = clean(value);
    if (!output) fail("STRING_REQUIRED", path + " is required.");
    if (maximum && output.length > maximum) {
      fail("STRING_LIMIT", path + " exceeds its character limit.", {
        maximum: maximum,
      });
    }
    return output;
  }

  function enumValue(value, allowed, path) {
    var output = clean(value).toUpperCase();
    if (allowed.indexOf(output) < 0) {
      fail("ENUM_INVALID", path + " is unsupported.", {
        value: output,
      });
    }
    return output;
  }

  function validTimestamp(value) {
    var text = clean(value);
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
        text
      )
    ) {
      return false;
    }
    return Number.isFinite(Date.parse(text));
  }

  function requireTimestamp(value, path) {
    var output = clean(value);
    if (!validTimestamp(output)) {
      fail(
        "TIMESTAMP_REQUIRED",
        path + " must be caller-supplied ISO 8601 with an explicit timezone."
      );
    }
    return output;
  }

  function compareTimestamp(left, right) {
    return Date.parse(left) - Date.parse(right);
  }

  function scanSafe(value, path, depth, seen) {
    var level = depth || 0;
    var visited = seen || new Set();
    if (level > LIMITS.jsonDepth) {
      fail("IMPORT_LIMIT", "Imported JSON exceeds the depth limit.", {
        path: path,
      });
    }
    if (!value || typeof value !== "object") {
      if (typeof value === "number" && !Number.isFinite(value)) {
        fail("TYPE_INVALID", path + " contains a non-finite number.");
      }
      if (
        value !== null &&
        ["string", "number", "boolean"].indexOf(typeof value) < 0
      ) {
        fail("TYPE_INVALID", path + " contains a non-JSON value.");
      }
      return value;
    }
    if (visited.has(value)) {
      fail("TYPE_INVALID", path + " contains a circular reference.");
    }
    var isArray = Array.isArray(value);
    var source = isArray
      ? ownDataArray(value, path)
      : ownDataObject(value, path);
    var output = isArray ? [] : {};
    visited.add(value);
    Object.keys(source).forEach(function (key) {
      output[key] = scanSafe(
        source[key],
        path + "." + key,
        level + 1,
        visited
      );
    });
    visited.delete(value);
    return output;
  }

  function normalizeSession(value) {
    var session = ownDataObject(value, "session");
    rejectUnknownKeys(session, ["id", "name", "createdAt"], "session");
    return {
      id: requiredString(session.id, "session.id", 120),
      name: requiredString(session.name, "session.name", 200),
      createdAt: requireTimestamp(session.createdAt, "session.createdAt"),
    };
  }

  function normalizeReviewer(value) {
    var reviewer = ownDataObject(value, "reviewer");
    rejectUnknownKeys(
      reviewer,
      ["role", "name", "id", "humanAttested"],
      "reviewer"
    );
    var role = requiredString(reviewer.role, "reviewer.role", 120);
    var name = clean(reviewer.name).slice(0, 200);
    var id = clean(reviewer.id).slice(0, 120);
    if (reviewer.humanAttested !== true) {
      fail(
        "HUMAN_ATTESTATION_REQUIRED",
        "Every Verdict Room event requires caller human attestation."
      );
    }
    if (
      [role, name, id].some(function (label) {
        return containsAutomationDisclosure(label);
      })
    ) {
      fail(
        "HUMAN_ATTESTATION_CONFLICT",
        "An automation-disclosed reviewer label conflicts with human attestation."
      );
    }
    return {
      role: role,
      name: name,
      id: id,
      humanAttested: true,
      attestationStatus: "CALLER-ATTESTED / NOT IDENTITY-VERIFIED",
    };
  }

  function vocabularyFromPack(pack) {
    var vocabulary = requireOwn(
      pack,
      "adjudicationVocabulary",
      "channelPack"
    );
    rejectUnknownKeys(
      vocabulary,
      VERDICT_CODES,
      "channelPack.adjudicationVocabulary"
    );
    var labels = {};
    VERDICT_CODES.forEach(function (code) {
      var entry = requireOwn(
        vocabulary,
        code,
        "channelPack.adjudicationVocabulary"
      );
      rejectUnknownKeys(
        entry,
        ["formal", "comedy", "bleep"],
        "channelPack.adjudicationVocabulary." + code
      );
      labels[code] = {};
      ["formal", "comedy", "bleep"].forEach(function (mode) {
        labels[code][mode] = requiredString(
          requireOwn(
            entry,
            mode,
            "channelPack.adjudicationVocabulary." + code
          ),
          "channelPack.adjudicationVocabulary." + code + "." + mode,
          320
        );
      });
    });
    return labels;
  }

  function validateChannelPack(pack) {
    assertOwnedTree(pack, "channelPack");
    requireOwn(pack, "identity", "channelPack");
    requireOwn(pack.identity, "id", "channelPack.identity");
    requireOwn(pack, "fingerprint", "channelPack");
    requireOwn(pack, "capabilities", "channelPack");
    requireOwn(pack, "longitudinalVocabulary", "channelPack");
    requireOwn(pack, "adjudicationVocabulary", "channelPack");
    if (
      !CANONICAL_PACK_FACTORY ||
      !Object.isFrozen(CANONICAL_PACK_FACTORY) ||
      typeof CANONICAL_PACK_FACTORY.validate !== "function" ||
      root.ShokkerChannelPack !== CANONICAL_PACK_FACTORY
    ) {
      fail(
        "CHANNEL_PACK_VALIDATOR_REQUIRED",
        "Verdict Room requires the unchanged frozen ChannelPack validator."
      );
    }
    var report = CANONICAL_PACK_FACTORY.validate(pack);
    if (
      !report ||
      report.valid !== true ||
      report.fingerprintVerified !== true
    ) {
      fail("CHANNEL_PACK_INVALID", "Verdict Room rejected the ChannelPack.", {
        issues: report && report.issues || [],
      });
    }
    REQUIRED_CAPABILITIES.forEach(function (capability) {
      var count = array(pack.capabilities).filter(function (entry) {
        return entry === capability;
      }).length;
      if (count !== 1) {
        fail(
          "CAPABILITY_REQUIRED",
          "Verdict Room requires one exact ChannelPack capability.",
          { capability: capability, count: count }
        );
      }
    });
    return pack;
  }

  function officialUrl(sourceId, time) {
    return "https://www.youtube.com/watch?v=" + sourceId +
      "&t=" + Math.max(0, Math.floor(time)) + "s";
  }

  function validateCandidate(candidate, source, path, role) {
    var value = object(candidate);
    var sourceValue = object(source);
    var sourceId = requiredString(value.sourceId, path + ".sourceId", 32);
    if (
      !/^[A-Za-z0-9_-]{11}$/.test(sourceId) ||
      sourceId !== clean(sourceValue.id)
    ) {
      fail("CANONICAL_PACKET_INVALID", path + " has an invalid source ID.");
    }
    if (!finite(value.t) || value.t < 0) {
      fail("CANONICAL_PACKET_INVALID", path + ".t must be a finite number.");
    }
    if (clean(value.url) !== officialUrl(sourceId, value.t)) {
      fail("CANONICAL_PACKET_INVALID", path + " has a non-canonical URL.");
    }
    if (value.speaker !== null || value.promotionAllowed !== false) {
      fail(
        "CANONICAL_PACKET_INVALID",
        path + " crossed the speaker or promotion firewall."
      );
    }
    var excerpt = requiredString(value.excerpt, path + ".excerpt", 1_200);
    return {
      id: requiredString(value.id, path + ".id", 200),
      role: role,
      sourceId: sourceId,
      t: value.t,
      url: clean(value.url),
      excerpt: excerpt,
      sourceDate: requiredString(sourceValue.date, path + ".source.date", 40),
      sourceTitle: requiredString(
        sourceValue.title,
        path + ".source.title",
        500
      ),
      rightsMode: requiredString(
        sourceValue.rightsMode,
        path + ".source.rightsMode",
        120
      ),
      contentMode: requiredString(
        sourceValue.contentMode,
        path + ".source.contentMode",
        120
      ),
    };
  }

  function validateAdditionalReceipt(value, source, path) {
    var receipt = object(value);
    var sourceId = requiredString(
      receipt.sourceId || source.id,
      path + ".sourceId",
      32
    );
    if (
      !/^[A-Za-z0-9_-]{11}$/.test(sourceId) ||
      sourceId !== clean(source.id)
    ) {
      fail("CANONICAL_PACKET_INVALID", path + " has an invalid source ID.");
    }
    if (!finite(receipt.t) || receipt.t < 0) {
      fail("CANONICAL_PACKET_INVALID", path + ".t must be a finite number.");
    }
    if (clean(receipt.url) !== officialUrl(sourceId, receipt.t)) {
      fail("CANONICAL_PACKET_INVALID", path + " has a non-canonical URL.");
    }
    return {
      id: requiredString(receipt.id, path + ".id", 200),
      role: "ADDITIONAL_RESPONSE",
      sourceId: sourceId,
      t: receipt.t,
      url: clean(receipt.url),
      excerpt: requiredString(receipt.excerpt, path + ".excerpt", 1_200),
      sourceDate: requiredString(source.date, path + ".source.date", 40),
      sourceTitle: requiredString(source.title, path + ".source.title", 500),
      rightsMode: requiredString(
        source.rightsMode,
        path + ".source.rightsMode",
        120
      ),
      contentMode: requiredString(
        source.contentMode,
        path + ".source.contentMode",
        120
      ),
    };
  }

  function validateCanonicalPacket(packet, serialized, pack, expectedId) {
    var value = object(packet);
    var docket = object(value.docket);
    var forecast = object(value.forecast);
    var response = object(value.response);
    var forecastCandidate = object(forecast.candidate);
    var responseCandidate = object(response.candidate);
    var forecastSource = object(forecast.source);
    var responseSource = object(response.source);
    if (
      value.schema !==
        "shokker-youtube-wiki/longitudinal-docket-inspection/v1" ||
      clean(docket.id) !== expectedId ||
      clean(value.channel && value.channel.id) !== pack.identity.id ||
      clean(value.channel && value.channel.packFingerprint) !== pack.fingerprint
    ) {
      fail(
        "CANONICAL_PACKET_INVALID",
        "The canonical docket packet is bound to a different schema or pack.",
        { docketId: expectedId }
      );
    }
    if (
      docket.relationship !== "MAY_RESOLVE" ||
      docket.verdict !== null ||
      docket.resolutionStatus !== "unresolved" ||
      docket.reviewStatus !== "machine-paired-unreviewed" ||
      docket.speaker !== null ||
      docket.promotionAllowed !== false
    ) {
      fail(
        "CANONICAL_PACKET_INVALID",
        "Verdict Room accepts only unresolved machine-paired dockets.",
        { docketId: expectedId }
      );
    }
    if (!clean(value.fingerprint)) {
      fail(
        "CANONICAL_PACKET_INVALID",
        "The canonical docket packet requires its engine fingerprint."
      );
    }
    if (
      typeof serialized !== "string" ||
      byteLength(serialized) > LIMITS.packetBytes
    ) {
      fail(
        "CANONICAL_PACKET_INVALID",
        "The canonical docket serialization is missing or oversized."
      );
    }
    var parsed;
    try {
      parsed = JSON.parse(serialized);
    } catch {
      fail(
        "CANONICAL_PACKET_INVALID",
        "The docket engine returned non-JSON serialization."
      );
    }
    if (stableJson(parsed) !== stableJson(value)) {
      fail(
        "CANONICAL_PACKET_INVALID",
        "The docket engine serialization does not match its inspected packet."
      );
    }
    var receipts = [
      validateCandidate(
        forecastCandidate,
        forecastSource,
        "packet.forecast.candidate",
        "FORECAST"
      ),
      validateCandidate(
        responseCandidate,
        responseSource,
        "packet.response.candidate",
        "RESPONSE"
      ),
    ];
    array(responseCandidate.additionalReceipts).forEach(function (receipt, index) {
      receipts.push(
        validateAdditionalReceipt(
          receipt,
          responseSource,
          "packet.response.candidate.additionalReceipts[" + index + "]"
        )
      );
    });
    if (receipts.length > LIMITS.evidenceReferences) {
      fail(
        "CANONICAL_PACKET_INVALID",
        "The canonical docket has too many attached receipts."
      );
    }
    var receiptIds = receipts.map(function (receipt) {
      return receipt.id;
    });
    if (new Set(receiptIds).size !== receiptIds.length) {
      fail(
        "CANONICAL_PACKET_INVALID",
        "The canonical docket has duplicate receipt IDs."
      );
    }
    var subjects = array(docket.subjects).map(clean).filter(Boolean);
    if (!subjects.length || new Set(subjects).size !== subjects.length) {
      fail(
        "CANONICAL_PACKET_INVALID",
        "The canonical docket requires unique subjects."
      );
    }
    var packetHash = sha256(serialized);
    var binding = {
      id: expectedId,
      title: requiredString(docket.title, "packet.docket.title", 500),
      packetFingerprint: clean(value.fingerprint),
      packetHash: packetHash,
      pairSignal: requiredString(
        docket.pairSignal,
        "packet.docket.pairSignal",
        80
      ),
      subjectIds: subjects.slice().sort(compareText),
      requiredReceiptIds: receiptIds.slice(),
      requiresOutcomeVerification:
        docket.requiresOutcomeVerification === true,
      requiresWholeWorkVisualReview:
        docket.requiresWholeWorkVisualReview === true,
    };
    binding.bindingHash = hashCanonical(binding);
    return {
      binding: binding,
      receipts: receipts,
      receiptById: new Map(receipts.map(function (receipt) {
        return [receipt.id, receipt];
      })),
    };
  }

  function canonicalDocketEngine(pack, data) {
    var factory = CANONICAL_DOCKET_FACTORY;
    if (
      !factory ||
      typeof factory.create !== "function" ||
      !Object.isFrozen(factory)
    ) {
      fail(
        "DOCKET_ENGINE_REQUIRED",
        "Verdict Room requires the frozen canonical longitudinal docket factory."
      );
    }
    var engine = factory.create({
      channelPack: pack,
      data: data,
    });
    if (
      !engine ||
      !Object.isFrozen(engine) ||
      typeof engine.inspect !== "function" ||
      typeof engine.verify !== "function" ||
      typeof engine.serialize !== "function"
    ) {
      fail(
        "DOCKET_ENGINE_REQUIRED",
        "The canonical longitudinal factory returned an incompatible engine."
      );
    }
    return engine;
  }

  function buildInputs(input) {
    var options = ownDataObject(input, "options");
    rejectUnknownKeys(
      options,
      [
        "channelPack",
        "docketData",
        "session",
      ],
      "options"
    );
    var pack = validateChannelPack(options.channelPack);
    var data = freezeDeep(
      scanSafe(options.docketData, "docketData", 0)
    );
    var engine = canonicalDocketEngine(pack, data);
    var vocabulary = vocabularyFromPack(pack);
    if (
      !clean(data.schema) ||
      !data.channel ||
      clean(data.channel.id) !== pack.identity.id ||
      clean(data.channel.packFingerprint) !== pack.fingerprint
    ) {
      fail(
        "DOCKET_DATA_INVALID",
        "Docket data is not bound to the exact ChannelPack."
      );
    }
    if (
      !data.fingerprints ||
      !clean(data.fingerprints.publicFnv1a) ||
      !/^sha256:[a-f0-9]{64}$/.test(
        clean(data.fingerprints.captionSetSha256)
      )
    ) {
      fail(
        "DOCKET_DATA_INVALID",
        "Docket data requires public and caption-set fingerprints."
      );
    }
    if (
      !Array.isArray(data.dockets) ||
      !data.dockets.length ||
      data.dockets.length > LIMITS.dockets
    ) {
      fail(
        "DOCKET_DATA_INVALID",
        "Docket data requires a bounded, non-empty docket list."
      );
    }
    var dataReport = engine.verify();
    if (!dataReport || dataReport.ok !== true) {
      fail(
        "DOCKET_DATA_INVALID",
        "The longitudinal engine rejected its data artifact."
      );
    }
    var ids = data.dockets.map(function (docket, index) {
      return requiredString(
        docket && docket.id,
        "docketData.dockets[" + index + "].id",
        200
      );
    });
    if (new Set(ids).size !== ids.length) {
      fail("DOCKET_DATA_INVALID", "Docket IDs must be unique.");
    }
    ids.sort(compareText);
    var targets = new Map();
    ids.forEach(function (id) {
      var packet = engine.inspect(id);
      if (!packet) {
        fail(
          "CANONICAL_PACKET_INVALID",
          "A registered docket did not resolve through the live engine.",
          { docketId: id }
        );
      }
      var report = engine.verify(packet);
      if (!report || report.ok !== true) {
        fail(
          "CANONICAL_PACKET_INVALID",
          "The live engine rejected its own inspected docket.",
          { docketId: id }
        );
      }
      var first = engine.serialize(packet);
      var second = engine.serialize(engine.inspect(id));
      if (first !== second) {
        fail(
          "CANONICAL_PACKET_INVALID",
          "The live docket serialization is not deterministic.",
          { docketId: id }
        );
      }
      if (
        typeof first !== "string" ||
        byteLength(first) > LIMITS.packetBytes
      ) {
        fail(
          "CANONICAL_PACKET_INVALID",
          "The live docket serialization exceeds its bounded JSON contract.",
          { docketId: id }
        );
      }
      var canonicalPacket;
      try {
        canonicalPacket = scanSafe(
          JSON.parse(first),
          "canonicalPacket",
          0
        );
      } catch (error) {
        if (error && error.code) throw error;
        fail(
          "CANONICAL_PACKET_INVALID",
          "The live docket serialization is not canonical JSON.",
          { docketId: id }
        );
      }
      var canonicalReport = engine.verify(canonicalPacket);
      if (
        stableJson(canonicalPacket) !== first ||
        !canonicalReport ||
        canonicalReport.ok !== true ||
        engine.serialize(canonicalPacket) !== first
      ) {
        fail(
          "CANONICAL_PACKET_INVALID",
          "The serialized docket cannot reproduce one exact canonical packet.",
          { docketId: id }
        );
      }
      targets.set(
        id,
        validateCanonicalPacket(canonicalPacket, first, pack, id)
      );
    });
    var targetBindings = ids.map(function (id) {
      return clone(targets.get(id).binding);
    });
    var context = {
      ruleVersion: VERSION,
      channelId: pack.identity.id,
      channelPackFingerprint: pack.fingerprint,
      requiredCapabilities: REQUIRED_CAPABILITIES.slice(),
      vocabularyHash: hashCanonical(vocabulary),
      docketDataSchema: clean(data.schema),
      docketDataFingerprint: clean(data.fingerprints.publicFnv1a),
      captionSetFingerprint: clean(data.fingerprints.captionSetSha256),
      targetSetHash: hashCanonical(targetBindings),
    };
    context.reviewInputHash = hashCanonical(context);
    return {
      pack: pack,
      engine: engine,
      data: data,
      vocabulary: vocabulary,
      targets: targets,
      targetBindings: targetBindings,
      context: context,
    };
  }

  function emptyState(revision) {
    return {
      state: "UNREVIEWED",
      revision: revision || 1,
      checks: [],
      wording: "",
      wordingEventId: "",
      lockedVerdictCode: null,
      verdictCode: null,
      activeDecisionId: "",
      revokedDecisionId: "",
    };
  }

  function orderedChecks(checks) {
    return array(checks).slice().sort(function (left, right) {
      return CHECK_CODES.indexOf(left.code) - CHECK_CODES.indexOf(right.code);
    });
  }

  function stateWith(value, changes) {
    var output = Object.assign({}, clone(value), changes || {});
    output.checks = orderedChecks(output.checks);
    return output;
  }

  function hasCheck(state, code) {
    return state.checks.some(function (check) {
      return check.code === code && check.status === "PASS";
    });
  }

  function allChecks(state, codes) {
    return codes.every(function (code) {
      return hasCheck(state, code);
    });
  }

  function assertSafeWording(value, verdictCode) {
    var wording = requiredString(
      value,
      "action.wording",
      LIMITS.wordingCharacters
    );
    if (wording.length < 12) {
      fail(
        "WORDING_INVALID",
        "Reviewed wording must state a meaningful bounded proposition."
      );
    }
    if (UNSAFE_WORDING.some(function (pattern) {
      return pattern.test(wording);
    })) {
      fail(
        "WORDING_UNSAFE",
        "Reviewed wording cannot add speaker, causality, certification, universal-truth, rights, or markup claims."
      );
    }
    if (
      verdictCode &&
      (
        !own(VERDICT_WORDING, verdictCode) ||
        wording !== VERDICT_WORDING[verdictCode]
      )
    ) {
      fail(
        "WORDING_MISMATCH",
        "Public wording must exactly match the fixed scoped sentence for the selected verdict code.",
        { verdictCode: verdictCode }
      );
    }
    return wording;
  }

  function normalizeCommon(action, extraKeys) {
    var value = ownDataObject(action, "action");
    rejectUnknownKeys(
      value,
      ["at", "reviewer", "notes"].concat(extraKeys || []),
      "action"
    );
    return {
      at: requireTimestamp(value.at, "action.at"),
      reviewer: normalizeReviewer(value.reviewer),
      notes: requiredString(
        value.notes,
        "action.notes",
        LIMITS.noteCharacters
      ),
      source: value,
    };
  }

  function normalizeDispositions(value, target) {
    if (!Array.isArray(value)) {
      fail(
        "EVIDENCE_DISPOSITION_REQUIRED",
        "Contradiction review requires a bounded receipt-disposition list."
      );
    }
    var entries = ownDataArray(value, "action.receiptDispositions");
    if (!entries.length || entries.length > LIMITS.evidenceReferences) {
      fail(
        "EVIDENCE_DISPOSITION_REQUIRED",
        "Contradiction review requires a bounded receipt-disposition list."
      );
    }
    var byId = new Map();
    entries.forEach(function (entry, index) {
      var item = ownDataObject(
        entry,
        "action.receiptDispositions[" + index + "]"
      );
      rejectUnknownKeys(
        item,
        ["receiptId", "disposition", "stance", "reason"],
        "action.receiptDispositions[" + index + "]"
      );
      var receiptId = requiredString(
        item.receiptId,
        "action.receiptDispositions[" + index + "].receiptId",
        200
      );
      var receipt = target.receiptById.get(receiptId);
      if (!receipt || byId.has(receiptId)) {
        fail(
          "EVIDENCE_DISPOSITION_INVALID",
          "Every disposition must resolve once to this canonical docket.",
          { receiptId: receiptId }
        );
      }
      var disposition = enumValue(
        item.disposition,
        DISPOSITIONS,
        "action.receiptDispositions[" + index + "].disposition"
      );
      var stance = enumValue(
        item.stance,
        STANCES,
        "action.receiptDispositions[" + index + "].stance"
      );
      if (
        (receipt.role === "FORECAST" && stance !== "PROPOSITION") ||
        (receipt.role !== "FORECAST" && stance === "PROPOSITION")
      ) {
        fail(
          "EVIDENCE_DISPOSITION_INVALID",
          "Receipt stance conflicts with its canonical before/after role.",
          { receiptId: receiptId, role: receipt.role, stance: stance }
        );
      }
      byId.set(receiptId, {
        receiptId: receiptId,
        disposition: disposition,
        stance: stance,
        reason: requiredString(
          item.reason,
          "action.receiptDispositions[" + index + "].reason",
          1_000
        ),
      });
    });
    if (
      byId.size !== target.receipts.length ||
      target.receipts.some(function (receipt) {
        return !byId.has(receipt.id);
      })
    ) {
      fail(
        "EVIDENCE_DISPOSITION_INVALID",
        "Every canonical before, after, and additional receipt requires a disposition."
      );
    }
    return target.receipts.map(function (receipt) {
      return byId.get(receipt.id);
    });
  }

  function normalizeOutcomeReview(value) {
    var review = ownDataObject(value, "action.outcomeReview");
    rejectUnknownKeys(
      review,
      ["method", "sourceReference", "notes"],
      "action.outcomeReview"
    );
    return {
      method: enumValue(
        review.method,
        OUTCOME_METHODS,
        "action.outcomeReview.method"
      ),
      sourceReference: requiredString(
        review.sourceReference,
        "action.outcomeReview.sourceReference",
        LIMITS.referenceCharacters
      ),
      notes: requiredString(
        review.notes,
        "action.outcomeReview.notes",
        LIMITS.noteCharacters
      ),
    };
  }

  function eventProof(value) {
    var projection = clone(value);
    delete projection.eventHash;
    return hashCanonical(projection);
  }

  function snapshotProof(value) {
    var projection = clone(value);
    delete projection.snapshotHash;
    return hashCanonical(projection);
  }

  function markdownText(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/([\\`*_[\]{}()#+.!|])/g, "\\$1");
  }

  function markdownCode(value) {
    var text = String(value == null ? "" : value).replace(/\r?\n/g, " ");
    var runs = text.match(/`+/g) || [];
    var width = runs.reduce(function (maximum, run) {
      return Math.max(maximum, run.length + 1);
    }, 1);
    var fence = "`".repeat(width);
    return fence + " " + text + " " + fence;
  }

  function markdownJson(value) {
    var json = stableJson(value, 2);
    var runs = json.match(/`+/g) || [];
    var width = runs.reduce(function (maximum, run) {
      return Math.max(maximum, run.length + 1);
    }, 3);
    var fence = "`".repeat(width);
    return fence + "json\n" + json + "\n" + fence;
  }

  function createApi(input) {
    var options = ownDataObject(input, "options");
    rejectUnknownKeys(
      options,
      ["channelPack", "docketData", "session"],
      "options"
    );
    var session = normalizeSession(options.session);
    var baseline = buildInputs(options);
    options = {
      channelPack: baseline.pack,
      docketData: baseline.data,
      session: frozen(session),
    };
    var ledger = [];
    var states = new Map();
    var eventById = new Map();
    var lastDocketEvent = new Map();
    baseline.targetBindings.forEach(function (binding) {
      states.set(binding.id, emptyState(1));
    });

    function currentInputs() {
      return buildInputs(options);
    }

    function assertInputsUnchanged() {
      var current = currentInputs();
      if (
        current.context.reviewInputHash !==
          baseline.context.reviewInputHash ||
        stableJson(current.targetBindings) !==
          stableJson(baseline.targetBindings)
      ) {
        fail(
          "STALE_INPUT",
          "Verdict Room input changed; the old local verdict is suppressed.",
          {
            expected: baseline.context.reviewInputHash,
            actual: current.context.reviewInputHash,
          }
        );
      }
    }

    function resolveTarget(id) {
      var docketId = clean(id);
      var target = baseline.targets.get(docketId);
      if (!target) {
        fail("DOCKET_NOT_FOUND", "Verdict Room docket does not exist.", {
          docketId: docketId,
        });
      }
      return { id: docketId, target: target };
    }

    function stateFor(id) {
      return clone(states.get(id) || emptyState(1));
    }

    function eventsFor(id) {
      return ledger.filter(function (event) {
        return event.docketId === id;
      });
    }

    function normalizeEventTime(common, docketId) {
      if (compareTimestamp(common.at, session.createdAt) < 0) {
        fail(
          "TIMESTAMP_INVALID",
          "An event cannot precede the local session timestamp.",
          { docketId: docketId }
        );
      }
      var previous = ledger[ledger.length - 1];
      if (previous && compareTimestamp(common.at, previous.at) <= 0) {
        fail(
          "TIMESTAMP_INVALID",
          "Verdict Room event timestamps must increase strictly.",
          { previousAt: previous.at, at: common.at }
        );
      }
    }

    function appendEvent(docketId, type, common, payload, buildAfter) {
      assertInputsUnchanged();
      if (EVENT_TYPES.indexOf(type) < 0) {
        fail("EVENT_TYPE_INVALID", "Unsupported Verdict Room event type.");
      }
      if (
        ledger.length >= LIMITS.events ||
        eventsFor(docketId).length >= LIMITS.eventsPerDocket
      ) {
        fail("SESSION_LIMIT", "Verdict Room event limit reached.");
      }
      normalizeEventTime(common, docketId);
      var before = stateFor(docketId);
      var sequence = ledger.length + 1;
      var previousEventHash = ledger.length
        ? ledger[ledger.length - 1].eventHash
        : "";
      var previousDocket = lastDocketEvent.get(docketId);
      var previousDocketEventHash = previousDocket
        ? previousDocket.eventHash
        : "";
      var idHash = hashCanonical({
        sessionId: session.id,
        sequence: sequence,
        docketId: docketId,
        type: type,
        at: common.at,
        payload: payload,
        previousEventHash: previousEventHash,
      }).slice("sha256:".length, "sha256:".length + 20);
      var eventId =
        "verdict-event:" + String(sequence).padStart(5, "0") + ":" + idHash;
      var after = buildAfter(before, eventId);
      if (STATES.indexOf(after.state) < 0) {
        fail("STATE_INVALID", "Verdict Room produced an invalid state.");
      }
      var event = {
        schema: EVENT_SCHEMA,
        version: VERSION,
        id: eventId,
        sequence: sequence,
        sessionId: session.id,
        docketId: docketId,
        docketBindingHash:
          baseline.targets.get(docketId).binding.bindingHash,
        reviewInputHash: baseline.context.reviewInputHash,
        channelId: baseline.context.channelId,
        channelPackFingerprint:
          baseline.context.channelPackFingerprint,
        type: type,
        at: common.at,
        reviewer: common.reviewer,
        notes: common.notes,
        payload: payload,
        before: before,
        after: after,
        previousEventHash: previousEventHash,
        previousDocketEventHash: previousDocketEventHash,
        boundary: clone(BOUNDARY),
      };
      event.eventHash = eventProof(event);
      var projectedBytes = ledger.reduce(function (total, entry) {
        return total + byteLength(stableJson(entry));
      }, 0) + byteLength(stableJson(event));
      if (projectedBytes > LIMITS.ledgerBytes) {
        fail(
          "SESSION_LIMIT",
          "Verdict Room ledger exceeds its restorable byte budget."
        );
      }
      ledger.push(event);
      states.set(docketId, clone(after));
      eventById.set(event.id, event);
      lastDocketEvent.set(docketId, event);
      return frozen(event);
    }

    function recordCheck(docketId, action) {
      var resolved = resolveTarget(docketId);
      var common = normalizeCommon(
        action,
        [
          "code",
          "status",
          "receiptDispositions",
          "outcomeReview",
        ]
      );
      var code = enumValue(
        common.source.code,
        EVIDENCE_CHECK_CODES,
        "action.code"
      );
      if (enumValue(common.source.status, ["PASS"], "action.status") !== "PASS") {
        fail("CHECK_INVALID", "Only an explicit PASS can advance review.");
      }
      var dispositions = [];
      var outcomeReview = null;
      if (code === "CONTRADICTION_SWEEP") {
        dispositions = normalizeDispositions(
          common.source.receiptDispositions,
          resolved.target
        );
        if (own(common.source, "outcomeReview")) {
          fail(
            "CHECK_INVALID",
            "Outcome review belongs only to OUTCOME_REVIEW."
          );
        }
      } else if (code === "OUTCOME_REVIEW") {
        outcomeReview = normalizeOutcomeReview(common.source.outcomeReview);
        if (own(common.source, "receiptDispositions")) {
          fail(
            "CHECK_INVALID",
            "Receipt dispositions belong only to CONTRADICTION_SWEEP."
          );
        }
      } else if (
        own(common.source, "receiptDispositions") ||
        own(common.source, "outcomeReview")
      ) {
        fail(
          "CHECK_INVALID",
          "This check does not accept evidence or outcome detail fields."
        );
      }
      var payload = {
        code: code,
        status: "PASS",
        receiptDispositions: dispositions,
        outcomeReview: outcomeReview,
      };
      return appendEvent(
        resolved.id,
        "CHECK",
        common,
        payload,
        function (before, eventId) {
          var base = before;
          if (before.state === "REVOKED") {
            base = emptyState(before.revision + 1);
          }
          if (
            ["UNREVIEWED", "NEEDS_CONTEXT"].indexOf(base.state) < 0
          ) {
            fail(
              "TRANSITION_INVALID",
              "Checks can only be recorded in an open evidence-review state.",
              { from: before.state }
            );
          }
          if (hasCheck(base, code)) {
            fail(
              "CHECK_DUPLICATE",
              "A check can be recorded only once per review revision.",
              { code: code }
            );
          }
          var checks = base.checks.concat([{
            code: code,
            status: "PASS",
            eventId: eventId,
          }]);
          var after = stateWith(base, { checks: checks });
          if (allChecks(after, EVIDENCE_CHECK_CODES)) {
            after.state = "EVIDENCE_CHECKED";
          }
          return after;
        }
      );
    }

    function markNeedsContext(docketId, action) {
      var resolved = resolveTarget(docketId);
      var common = normalizeCommon(action, []);
      return appendEvent(
        resolved.id,
        "NEEDS_CONTEXT",
        common,
        {},
        function (before) {
          if (
            ["UNREVIEWED", "EVIDENCE_CHECKED", "WORDING_CHECKED"].indexOf(
              before.state
            ) < 0
          ) {
            fail(
              "TRANSITION_INVALID",
              "This docket cannot move to NEEDS_CONTEXT.",
              { from: before.state }
            );
          }
          var revision = before.revision;
          if (before.state !== "UNREVIEWED") revision += 1;
          return stateWith(emptyState(revision), {
            state: "NEEDS_CONTEXT",
          });
        }
      );
    }

    function reject(docketId, action) {
      var resolved = resolveTarget(docketId);
      var common = normalizeCommon(action, ["reasonCode"]);
      var reasonCode = enumValue(
        common.source.reasonCode,
        REJECTION_CODES,
        "action.reasonCode"
      );
      return appendEvent(
        resolved.id,
        "REJECT",
        common,
        { reasonCode: reasonCode },
        function (before) {
          if (
            ["ADJUDICATED", "REJECTED"].indexOf(before.state) >= 0
          ) {
            fail(
              "TRANSITION_INVALID",
              "An active adjudication must be revoked before rejection.",
              { from: before.state }
            );
          }
          var revision = before.state === "REVOKED"
            ? before.revision + 1
            : before.revision;
          return stateWith(emptyState(revision), {
            state: "REJECTED",
          });
        }
      );
    }

    function lockWording(docketId, action) {
      var resolved = resolveTarget(docketId);
      var common = normalizeCommon(action, ["wording", "verdictCode"]);
      var code = enumValue(
        common.source.verdictCode,
        VERDICT_CODES,
        "action.verdictCode"
      );
      var wording = assertSafeWording(common.source.wording, code);
      return appendEvent(
        resolved.id,
        "LOCK_WORDING",
        common,
        { wording: wording, verdictCode: code },
        function (before, eventId) {
          if (
            before.state !== "EVIDENCE_CHECKED" ||
            !allChecks(before, EVIDENCE_CHECK_CODES)
          ) {
            fail(
              "TRANSITION_INVALID",
              "Wording can be locked only after all evidence checks pass.",
              { from: before.state }
            );
          }
          return stateWith(before, {
            state: "WORDING_CHECKED",
            checks: before.checks.concat([{
              code: "PUBLIC_WORDING",
              status: "PASS",
              eventId: eventId,
            }]),
            wording: wording,
            wordingEventId: eventId,
            lockedVerdictCode: code,
          });
        }
      );
    }

    function contradictionPayload(state) {
      var check = state.checks.find(function (entry) {
        return entry.code === "CONTRADICTION_SWEEP";
      });
      var event = check && eventById.get(check.eventId);
      return event && event.payload || null;
    }

    function validateVerdictEvidence(code, state, target) {
      var payload = contradictionPayload(state);
      var dispositions = array(payload && payload.receiptDispositions);
      if (dispositions.length !== target.receipts.length) {
        fail(
          "VERDICT_EVIDENCE_INVALID",
          "Adjudication lost its complete contradiction sweep."
        );
      }
      var later = dispositions.filter(function (entry) {
        var receipt = target.receiptById.get(entry.receiptId);
        return (
          receipt &&
          receipt.role !== "FORECAST" &&
          entry.disposition === "RELIED_ON"
        );
      });
      var supports = later.some(function (entry) {
        return entry.stance === "SUPPORTING";
      });
      var contradicts = later.some(function (entry) {
        return entry.stance === "CONTRADICTING";
      });
      if (
        (code === "SUPPORTED" && (!supports || contradicts)) ||
        (code === "CONTRADICTED" && (!contradicts || supports)) ||
        (code === "MIXED" && (!supports || !contradicts))
      ) {
        fail(
          "VERDICT_EVIDENCE_INVALID",
          "Selected verdict code conflicts with the relied-on later receipts.",
          { verdictCode: code }
        );
      }
    }

    function normalizeAdjudicationBinding(source, verdictCode) {
      if (
        !Number.isInteger(source.expectedRevision) ||
        source.expectedRevision < 1
      ) {
        fail(
          "ADJUDICATION_BINDING_INVALID",
          "Adjudication requires the exact current integer revision."
        );
      }
      var wording = assertSafeWording(source.wording, verdictCode);
      if (source.wording !== wording) {
        fail(
          "ADJUDICATION_BINDING_INVALID",
          "Adjudication wording must byte-match the canonical locked wording."
        );
      }
      var wordingEventId = requiredString(
        source.wordingEventId,
        "action.wordingEventId",
        240
      );
      if (
        !Array.isArray(source.checkEventIds) ||
        source.checkEventIds.length !== CHECK_CODES.length ||
        source.checkEventIds.length > LIMITS.evidenceReferences
      ) {
        fail(
          "ADJUDICATION_BINDING_INVALID",
          "Adjudication requires the complete ordered check-event set."
        );
      }
      var checkEventIds = source.checkEventIds.map(function (id, index) {
        return requiredString(
          id,
          "action.checkEventIds[" + index + "]",
          240
        );
      });
      if (new Set(checkEventIds).size !== checkEventIds.length) {
        fail(
          "ADJUDICATION_BINDING_INVALID",
          "Adjudication check-event IDs must be unique."
        );
      }
      return {
        expectedRevision: source.expectedRevision,
        wording: wording,
        wordingEventId: wordingEventId,
        checkEventIds: checkEventIds,
      };
    }

    function adjudicate(docketId, action) {
      var resolved = resolveTarget(docketId);
      var common = normalizeCommon(
        action,
        [
          "verdictCode",
          "expectedRevision",
          "wording",
          "wordingEventId",
          "checkEventIds",
        ]
      );
      var code = enumValue(
        common.source.verdictCode,
        VERDICT_CODES,
        "action.verdictCode"
      );
      var binding = normalizeAdjudicationBinding(common.source, code);
      var payload = Object.assign({ verdictCode: code }, binding);
      return appendEvent(
        resolved.id,
        "ADJUDICATE",
        common,
        payload,
        function (before, eventId) {
          if (
            before.state !== "WORDING_CHECKED" ||
            !allChecks(before, CHECK_CODES) ||
            !before.wording
          ) {
            fail(
              "TRANSITION_INVALID",
              "Adjudication requires all twelve checks and locked wording.",
              { from: before.state }
            );
          }
          var currentCheckEventIds = before.checks.map(function (check) {
            return check.eventId;
          });
          if (
            binding.expectedRevision !== before.revision ||
            binding.wording !== before.wording ||
            binding.wordingEventId !== before.wordingEventId ||
            code !== before.lockedVerdictCode ||
            stableJson(binding.checkEventIds) !==
              stableJson(currentCheckEventIds)
          ) {
            fail(
              "ADJUDICATION_BINDING_INVALID",
              "Adjudication does not match the exact checked revision and locked wording.",
              {
                expectedRevision: before.revision,
                actualRevision: binding.expectedRevision,
              }
            );
          }
          validateVerdictEvidence(code, before, resolved.target);
          return stateWith(before, {
            state: "ADJUDICATED",
            verdictCode: code,
            activeDecisionId: eventId,
            revokedDecisionId: "",
          });
        }
      );
    }

    function revoke(docketId, action) {
      var resolved = resolveTarget(docketId);
      var common = normalizeCommon(action, ["decisionId"]);
      var decisionId = requiredString(
        common.source.decisionId,
        "action.decisionId",
        240
      );
      return appendEvent(
        resolved.id,
        "REVOKE",
        common,
        { decisionId: decisionId },
        function (before) {
          if (
            before.state !== "ADJUDICATED" ||
            before.activeDecisionId !== decisionId
          ) {
            fail(
              "TRANSITION_INVALID",
              "Revocation must name the active local adjudication.",
              { decisionId: decisionId }
            );
          }
          return stateWith(before, {
            state: "REVOKED",
            verdictCode: null,
            activeDecisionId: "",
            revokedDecisionId: decisionId,
          });
        }
      );
    }

    function undo(docketId, action) {
      var resolved = resolveTarget(docketId);
      var common = normalizeCommon(action, ["eventId"]);
      var targetEventId = requiredString(
        common.source.eventId,
        "action.eventId",
        240
      );
      return appendEvent(
        resolved.id,
        "UNDO",
        common,
        { targetEventId: targetEventId },
        function (before) {
          var targetEvent = eventById.get(targetEventId);
          var latest = lastDocketEvent.get(resolved.id);
          if (
            !targetEvent ||
            !latest ||
            latest.id !== targetEventId ||
            targetEvent.docketId !== resolved.id ||
            ["ADJUDICATE", "REJECT", "REVOKE", "UNDO"].indexOf(
              targetEvent.type
            ) >= 0 ||
            stableJson(before) !== stableJson(targetEvent.after)
          ) {
            fail(
              "UNDO_INVALID",
              "Undo is append-only and limited to the latest non-adjudication event for this docket.",
              { targetEventId: targetEventId }
            );
          }
          return clone(targetEvent.before);
        }
      );
    }

    function getPublicProjection(docketId, optionsValue) {
      var resolved = resolveTarget(docketId);
      var displayOptions = optionsValue == null
        ? {}
        : ownDataObject(optionsValue, "projection options");
      rejectUnknownKeys(
        displayOptions,
        ["reducedProfanity"],
        "projection options"
      );
      var reduced = displayOptions.reducedProfanity === true;
      try {
        assertInputsUnchanged();
      } catch (error) {
        if (!error || error.code !== "STALE_INPUT") throw error;
        return frozen({
          docketId: resolved.id,
          state: "STALE_INPUT",
          revision: stateFor(resolved.id).revision,
          verdictCode: null,
          formalLabel: null,
          comedyLabel: null,
          reviewedWording: null,
          decisionHash: null,
          localHumanAttestation: false,
          identityVerified: false,
          speaker: null,
          speakerInferred: false,
          causalityClaimed: false,
          creatorCertified: false,
          rightsCleared: false,
          canonMutated: false,
        });
      }
      var state = stateFor(resolved.id);
      var active = state.state === "ADJUDICATED"
        ? eventById.get(state.activeDecisionId)
        : null;
      var labels = active ? baseline.vocabulary[state.verdictCode] : null;
      return frozen({
        docketId: resolved.id,
        state: state.state,
        revision: state.revision,
        verdictCode: active ? state.verdictCode : null,
        formalLabel: active ? labels.formal : null,
        comedyLabel: active
          ? (reduced ? labels.bleep : labels.comedy)
          : null,
        reviewedWording: active ? state.wording : null,
        decisionHash: active ? active.eventHash : null,
        localHumanAttestation: Boolean(active),
        identityVerified: false,
        speaker: null,
        speakerInferred: false,
        causalityClaimed: false,
        creatorCertified: false,
        rightsCleared: false,
        canonMutated: false,
      });
    }

    function getDocket(docketId) {
      assertInputsUnchanged();
      var resolved = resolveTarget(docketId);
      return frozen({
        id: resolved.id,
        binding: resolved.target.binding,
        requiredReceipts: resolved.target.receipts,
        review: stateFor(resolved.id),
      });
    }

    function getChecks(docketId) {
      return frozen(getDocket(docketId).review.checks);
    }

    function getLedger(docketId) {
      assertInputsUnchanged();
      if (!clean(docketId)) return frozen(ledger);
      var resolved = resolveTarget(docketId);
      return frozen(eventsFor(resolved.id));
    }

    function getQueue(filters) {
      assertInputsUnchanged();
      var request = filters == null
        ? {}
        : ownDataObject(filters, "filters");
      rejectUnknownKeys(
        request,
        ["state", "verdictCode", "query", "limit"],
        "filters"
      );
      var stateFilter = clean(request.state).toUpperCase();
      var verdictFilter = clean(request.verdictCode).toUpperCase();
      if (stateFilter && STATES.indexOf(stateFilter) < 0) {
        fail("FILTER_INVALID", "Unsupported Verdict Room state filter.");
      }
      if (verdictFilter && VERDICT_CODES.indexOf(verdictFilter) < 0) {
        fail("FILTER_INVALID", "Unsupported verdict-code filter.");
      }
      var query = clean(request.query).toLowerCase();
      var limit = request.limit == null ? LIMITS.dockets : request.limit;
      if (!Number.isInteger(limit) || limit < 1 || limit > LIMITS.dockets) {
        fail("FILTER_INVALID", "Verdict Room limit is out of range.");
      }
      var output = baseline.targetBindings.map(function (binding) {
        var review = stateFor(binding.id);
        return {
          id: binding.id,
          title: binding.title,
          state: review.state,
          revision: review.revision,
          checkCount: review.checks.length,
          verdictCode: review.state === "ADJUDICATED"
            ? review.verdictCode
            : null,
          activeDecisionId: review.state === "ADJUDICATED"
            ? review.activeDecisionId
            : "",
          bindingHash: binding.bindingHash,
        };
      }).filter(function (entry) {
        return (
          (!stateFilter || entry.state === stateFilter) &&
          (!verdictFilter || entry.verdictCode === verdictFilter) &&
          (!query || [entry.id, entry.title].join(" ").toLowerCase()
            .indexOf(query) >= 0)
        );
      }).slice(0, limit);
      return frozen(output);
    }

    function metrics() {
      var values = Array.from(states.values());
      var counts = STATES.reduce(function (output, state) {
        output[state] = 0;
        return output;
      }, {});
      values.forEach(function (state) {
        counts[state.state] += 1;
      });
      return {
        dockets: values.length,
        events: ledger.length,
        unreviewed: counts.UNREVIEWED,
        needsContext: counts.NEEDS_CONTEXT,
        evidenceChecked: counts.EVIDENCE_CHECKED,
        wordingChecked: counts.WORDING_CHECKED,
        activeVerdicts: counts.ADJUDICATED,
        revoked: counts.REVOKED,
        rejected: counts.REJECTED,
        staleInput: 0,
        revisions: values.reduce(function (sum, state) {
          return sum + state.revision;
        }, 0),
        callerAttestedHumanEvents: ledger.length,
        identityVerifiedHumanEvents: 0,
        engineGeneratedDecisions: 0,
        speakerInferences: 0,
        causalityClaims: 0,
        rightsClearances: 0,
        creatorCertifications: 0,
        canonMutations: 0,
      };
    }

    function snapshot() {
      assertInputsUnchanged();
      var value = {
        schema: EXPORT_SCHEMA,
        version: VERSION,
        session: clone(session),
        context: clone(baseline.context),
        targetBindings: clone(baseline.targetBindings),
        policy: {
          localOnly: true,
          callerAttestationRequired: true,
          identityVerificationAvailable: false,
          serverPersistenceAvailable: false,
          engineGeneratedDecisions: false,
          speakerInferenceAvailable: false,
          causalityClaimsAvailable: false,
          rightsClearanceAvailable: false,
          creatorCertificationAvailable: false,
          canonMutationAvailable: false,
          comedyLabelsRequireActiveAdjudication: true,
          callerTimestampsOnly: true,
          appendOnlyLedger: true,
        },
        events: clone(ledger),
        states: baseline.targetBindings.map(function (binding) {
          return Object.assign(
            { docketId: binding.id },
            stateFor(binding.id)
          );
        }),
        metrics: metrics(),
      };
      value.snapshotHash = snapshotProof(value);
      if (byteLength(stableJson(value)) > LIMITS.importBytes) {
        fail("SESSION_LIMIT", "Verdict Room snapshot exceeds import budget.");
      }
      return frozen(value);
    }

    function exportJSON(indentation) {
      var spaces = indentation == null
        ? 2
        : Math.max(0, Math.min(8, Math.floor(Number(indentation) || 0)));
      return stableJson(snapshot(), spaces);
    }

    function buildMarkdown(saved) {
      var lines = [
        "# Verdict Room — " + markdownText(saved.session.name),
        "",
        "- Session ID: " + markdownCode(saved.session.id),
        "- Created: " + markdownCode(saved.session.createdAt),
        "- Channel: " + markdownCode(saved.context.channelId),
        "- ChannelPack: " +
          markdownCode(saved.context.channelPackFingerprint),
        "- Review input: " + markdownCode(saved.context.reviewInputHash),
        "- Snapshot: " + markdownCode(saved.snapshotHash),
        "- Boundary: device-local caller-attested review; no identity verification, server persistence, speaker inference, causality, rights clearance, creator certification, or canon mutation.",
        "",
        "## Session policy and canonical binding",
        "",
        markdownJson({
          context: saved.context,
          policy: saved.policy,
          metrics: saved.metrics,
        }),
        "",
        "## Docket review register",
        "",
      ];
      saved.states.forEach(function (state) {
        var target = baseline.targets.get(state.docketId);
        var binding = target.binding;
        var projection = state.state === "ADJUDICATED"
          ? getPublicProjection(state.docketId)
          : null;
        lines.push("### " + markdownText(binding.title), "");
        lines.push("- Docket: " + markdownCode(state.docketId));
        lines.push("- State: " + markdownCode(state.state));
        lines.push("- Revision: " + markdownCode(state.revision));
        lines.push("- Binding: " + markdownCode(binding.bindingHash));
        lines.push(
          "- Inspection packet: " + markdownCode(binding.packetHash) +
          " / " + markdownCode(binding.packetFingerprint)
        );
        lines.push(
          "- Subjects: " + binding.subjectIds.map(markdownCode).join(", ")
        );
        lines.push(
          "- Locked wording: " +
          (state.wording ? markdownCode(state.wording) : "_None._")
        );
        lines.push(
          "- Active verdict: " +
          (projection
            ? (
              markdownCode(projection.verdictCode) + " — " +
              markdownText(projection.formalLabel) + " / " +
              markdownText(projection.comedyLabel) + " — " +
              markdownCode(projection.decisionHash)
            )
            : "_None._")
        );
        lines.push("", "#### Human check chain", "");
        if (!state.checks.length) {
          lines.push("_No checks recorded in the current revision._");
        }
        state.checks.forEach(function (check) {
          lines.push(
            "- " + markdownCode(check.code) + ": " +
            markdownCode(check.status) + " via " +
            markdownCode(check.eventId)
          );
        });
        lines.push("", "#### Canonical bounded receipts", "");
        target.receipts.forEach(function (receipt) {
          lines.push(
            "- " + markdownCode(receipt.role) + " " +
            markdownCode(receipt.id) + " — " +
            markdownCode(receipt.sourceDate) + " — " +
            "[official source](" + receipt.url + ")"
          );
          lines.push("  - Source: " + markdownCode(receipt.sourceTitle));
          lines.push("  - Excerpt: " + markdownCode(receipt.excerpt));
          lines.push(
            "  - Rights/content boundary: " +
            markdownCode(receipt.rightsMode) + " / " +
            markdownCode(receipt.contentMode)
          );
        });
        lines.push("");
      });
      lines.push("## Complete append-only event ledger", "");
      if (!saved.events.length) {
        lines.push("_No local human events recorded._");
      }
      saved.events.forEach(function (event) {
        lines.push(
          "### Event " +
          String(event.sequence).padStart(4, "0") + " — " +
          markdownText(event.type),
          "",
          markdownJson(event),
          ""
        );
      });
      return lines.join("\n").replace(/\n+$/, "") + "\n";
    }

    function exportMarkdown() {
      return buildMarkdown(snapshot());
      /*
      var saved = snapshot();
      var lines = [
        "# Verdict Room — " + saved.session.name,
        "",
        "- Session ID: `" + saved.session.id + "`",
        "- Created: " + saved.session.createdAt,
        "- Channel: `" + saved.context.channelId + "`",
        "- ChannelPack: `" + saved.context.channelPackFingerprint + "`",
        "- Review input: `" + saved.context.reviewInputHash + "`",
        "- Snapshot: `" + saved.snapshotHash + "`",
        "- Boundary: device-local caller-attested review; no identity verification, server persistence, speaker inference, causality, rights clearance, creator certification, or canon mutation.",
        "",
        "## Active local verdicts",
        "",
      ];
      var active = saved.states.filter(function (state) {
        return state.state === "ADJUDICATED";
      });
      if (!active.length) lines.push("_Zero active local verdicts._");
      active.forEach(function (state) {
        var binding = baseline.targets.get(state.docketId).binding;
        var projection = getPublicProjection(state.docketId);
        lines.push("### " + binding.title);
        lines.push("");
        lines.push("- Docket: `" + state.docketId + "`");
        lines.push("- Formal: " + projection.formalLabel);
        lines.push("- Comedy: " + projection.comedyLabel);
        lines.push("- Scoped wording: " + projection.reviewedWording);
        lines.push("- Decision: `" + projection.decisionHash + "`");
        lines.push("");
      });
      lines.push("## Append-only event ledger", "");
      if (!saved.events.length) lines.push("_No local human events recorded._");
      saved.events.forEach(function (event) {
        lines.push(
          "- " +
          String(event.sequence).padStart(4, "0") +
          " `" + event.type + "` `" + event.docketId + "` " +
          event.at + " — `" + event.eventHash + "`"
        );
      });
      return lines.join("\n").replace(/\n+$/, "") + "\n";
      */
    }

    var api = {
      engine: "SHOKKER VERDICT ROOM",
      version: VERSION,
      schema: SESSION_SCHEMA,
      session: frozen(session),
      context: frozen(baseline.context),
      policy: frozen({
        localOnly: true,
        requiredCapabilities: REQUIRED_CAPABILITIES,
        verdictCodes: VERDICT_CODES,
        wordingByVerdictCode: VERDICT_WORDING,
        checkCodes: CHECK_CODES,
        identityVerificationAvailable: false,
        serverPersistenceAvailable: false,
        speakerInferenceAvailable: false,
        causalityClaimsAvailable: false,
        creatorCertificationAvailable: false,
        canonMutationAvailable: false,
      }),
      getQueue: getQueue,
      getDocket: getDocket,
      getChecks: getChecks,
      getLedger: getLedger,
      getPublicProjection: getPublicProjection,
      recordCheck: recordCheck,
      markNeedsContext: markNeedsContext,
      reject: reject,
      lockWording: lockWording,
      adjudicate: adjudicate,
      undo: undo,
      revoke: revoke,
      snapshot: snapshot,
      exportJSON: exportJSON,
      exportMarkdown: exportMarkdown,
      getMetrics: function () {
        assertInputsUnchanged();
        return frozen(metrics());
      },
    };
    Object.defineProperty(api, "metrics", {
      enumerable: true,
      get: function () {
        assertInputsUnchanged();
        return frozen(metrics());
      },
    });
    return Object.freeze(api);
  }

  function create(input) {
    return createApi(input);
  }

  function validateStoredSnapshot(snapshot) {
    snapshot = scanSafe(snapshot, "snapshot", 0);
    rejectUnknownKeys(
      snapshot,
      [
        "schema",
        "version",
        "session",
        "context",
        "targetBindings",
        "policy",
        "events",
        "states",
        "metrics",
        "snapshotHash",
      ],
      "snapshot"
    );
    if (
      snapshot.schema !== EXPORT_SCHEMA ||
      snapshot.version !== VERSION ||
      !Array.isArray(snapshot.events) ||
      snapshot.events.length > LIMITS.events ||
      !clean(snapshot.snapshotHash) ||
      snapshot.snapshotHash !== snapshotProof(snapshot)
    ) {
      fail(
        "SNAPSHOT_TAMPERED",
        "Verdict Room snapshot schema or structural hash is invalid."
      );
    }
    if (byteLength(stableJson(snapshot)) > LIMITS.importBytes) {
      fail("IMPORT_LIMIT", "Verdict Room import exceeds its byte limit.");
    }
    snapshot.events.forEach(function (event, index) {
      rejectUnknownKeys(
        object(event),
        [
          "schema",
          "version",
          "id",
          "sequence",
          "sessionId",
          "docketId",
          "docketBindingHash",
          "reviewInputHash",
          "channelId",
          "channelPackFingerprint",
          "type",
          "at",
          "reviewer",
          "notes",
          "payload",
          "before",
          "after",
          "previousEventHash",
          "previousDocketEventHash",
          "boundary",
          "eventHash",
        ],
        "snapshot.events[" + index + "]"
      );
      if (
        event.schema !== EVENT_SCHEMA ||
        event.version !== VERSION ||
        event.sequence !== index + 1 ||
        EVENT_TYPES.indexOf(event.type) < 0 ||
        event.eventHash !== eventProof(event)
      ) {
        fail(
          "SNAPSHOT_TAMPERED",
          "Verdict Room event shape or hash is invalid.",
          { sequence: index + 1 }
        );
      }
    });
    return snapshot;
  }

  function replayEvent(api, event) {
    var reviewer = {
      role: event.reviewer && event.reviewer.role,
      name: event.reviewer && event.reviewer.name,
      id: event.reviewer && event.reviewer.id,
      humanAttested: event.reviewer &&
        event.reviewer.humanAttested === true,
    };
    var common = {
      at: event.at,
      reviewer: reviewer,
      notes: event.notes,
    };
    if (event.type === "CHECK") {
      var checkAction = Object.assign(common, {
        code: event.payload.code,
        status: event.payload.status,
      });
      if (event.payload.code === "CONTRADICTION_SWEEP") {
        checkAction.receiptDispositions =
          event.payload.receiptDispositions;
      }
      if (event.payload.code === "OUTCOME_REVIEW") {
        checkAction.outcomeReview = event.payload.outcomeReview;
      }
      return api.recordCheck(event.docketId, checkAction);
    }
    if (event.type === "NEEDS_CONTEXT") {
      return api.markNeedsContext(event.docketId, common);
    }
    if (event.type === "REJECT") {
      return api.reject(event.docketId, Object.assign(common, {
        reasonCode: event.payload.reasonCode,
      }));
    }
    if (event.type === "LOCK_WORDING") {
      return api.lockWording(event.docketId, Object.assign(common, {
        wording: event.payload.wording,
        verdictCode: event.payload.verdictCode,
      }));
    }
    if (event.type === "ADJUDICATE") {
      return api.adjudicate(event.docketId, Object.assign(common, {
        verdictCode: event.payload.verdictCode,
        expectedRevision: event.payload.expectedRevision,
        wording: event.payload.wording,
        wordingEventId: event.payload.wordingEventId,
        checkEventIds: event.payload.checkEventIds,
      }));
    }
    if (event.type === "UNDO") {
      return api.undo(event.docketId, Object.assign(common, {
        eventId: event.payload.targetEventId,
      }));
    }
    if (event.type === "REVOKE") {
      return api.revoke(event.docketId, Object.assign(common, {
        decisionId: event.payload.decisionId,
      }));
    }
    fail("SNAPSHOT_TAMPERED", "Unsupported stored Verdict Room event.");
  }

  function restore(saved, input) {
    var snapshot = validateStoredSnapshot(saved);
    var current = ownDataObject(input, "restore options");
    rejectUnknownKeys(
      current,
      [
        "channelPack",
        "docketData",
        "session",
      ],
      "restore options"
    );
    var options = {
      channelPack: current.channelPack,
      docketData: current.docketData,
      session: snapshot.session,
    };
    var api = create(options);
    if (
      stableJson(api.context) !== stableJson(snapshot.context) ||
      stableJson(api.snapshot().targetBindings) !==
        stableJson(snapshot.targetBindings)
    ) {
      fail(
        "STALE_INPUT",
        "Verdict Room snapshot does not match the current canonical input."
      );
    }
    try {
      snapshot.events.forEach(function (event) {
        var replayed = replayEvent(api, event);
        if (stableJson(replayed) !== stableJson(event)) {
          fail(
            "SNAPSHOT_TAMPERED",
            "Stored event cannot be reproduced from its local human inputs.",
            { sequence: event.sequence }
          );
        }
      });
    } catch (error) {
      if (
        error &&
        ["STALE_INPUT", "SNAPSHOT_TAMPERED"].indexOf(error.code) >= 0
      ) {
        throw error;
      }
      fail(
        "SNAPSHOT_TAMPERED",
        "Verdict Room semantic replay rejected the stored ledger.",
        { causeCode: error && error.code || "UNKNOWN" }
      );
    }
    if (stableJson(api.snapshot()) !== stableJson(snapshot)) {
      fail(
        "SNAPSHOT_TAMPERED",
        "Restored Verdict Room state does not equal its snapshot."
      );
    }
    return api;
  }

  function importJSON(value, input) {
    if (typeof value !== "string") {
      fail("IMPORT_INVALID", "Verdict Room import must be JSON text.");
    }
    if (byteLength(value) > LIMITS.importBytes) {
      fail("IMPORT_LIMIT", "Verdict Room import exceeds its byte limit.");
    }
    var saved;
    try {
      saved = JSON.parse(value);
    } catch {
      fail("IMPORT_INVALID", "Verdict Room import is not valid JSON.");
    }
    return restore(saved, input);
  }

  var api = Object.freeze({
    VERSION: VERSION,
    SESSION_SCHEMA: SESSION_SCHEMA,
    EVENT_SCHEMA: EVENT_SCHEMA,
    EXPORT_SCHEMA: EXPORT_SCHEMA,
    REQUIRED_CAPABILITIES: REQUIRED_CAPABILITIES,
    VERDICT_CODES: VERDICT_CODES,
    CHECK_CODES: CHECK_CODES,
    STATES: STATES,
    LIMITS: LIMITS,
    create: create,
    restore: restore,
    importJSON: importJSON,
  });
  Object.defineProperty(root, "ShokkerVerdictRoom", {
    value: api,
    enumerable: true,
    writable: false,
    configurable: false,
  });
})(typeof window !== "undefined" ? window : globalThis);
