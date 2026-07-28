(function (root) {
  "use strict";

  /*
   * EXACT-SOURCE QUERY
   *
   * A channel-neutral question layer over one canonical Source Dossier.
   * Source scope is data, never a phrase inferred from an upload title.
   * The engine builds and verifies the requested dossier before it parses the
   * question, and every content result remains inside that exact source.
   */

  var VERSION = "1.4.0";
  var REQUEST_SCHEMA = "shokker-source-query/v1";
  var RESULT_SCHEMA = "shokker-source-query-result/v1";
  var DOSSIER_SCHEMA = "shokker-source-dossier/v1";
  var SOURCE_ID = /^[A-Za-z0-9_-]{11}$/;
  var FINGERPRINT = /^fnv1a32:[0-9a-f]{8}$/;
  var MAX_QUERY = 320;
  var DEFAULT_LIMIT = 8;
  var MAX_LIMIT = 20;

  var STATUSES = Object.freeze([
    "supported",
    "inventory",
    "proof",
    "metadata-only",
    "caption-limited",
    "unavailable",
    "insufficient-evidence",
    "speaker-refused",
    "ranking-refused",
    "stale-source"
  ]);
  var RESULT_TYPES = Object.freeze([
    "receipt",
    "guide-cut",
    "entity",
    "artifact",
    "connection",
    "metadata"
  ]);

  var DEFAULT_VOCABULARY = Object.freeze({
    inventory: Object.freeze([
      "what is indexed",
      "what is actually indexed",
      "whats indexed",
      "show the inventory",
      "source inventory",
      "inside this source",
      "inside this tape",
      "what is here",
      "whats here",
      "everything indexed"
    ]),
    receipt: Object.freeze([
      "receipt",
      "receipts",
      "moment",
      "moments",
      "quote",
      "quotes",
      "clip",
      "clips",
      "timestamp",
      "timestamps",
      "mention",
      "mentions",
      "say",
      "said",
      "discuss",
      "discussion"
    ]),
    entity: Object.freeze([
      "entity",
      "entities",
      "topic",
      "topics",
      "subject",
      "subjects",
      "character",
      "characters",
      "driver",
      "drivers",
      "event",
      "events"
    ]),
    artifact: Object.freeze([
      "artifact",
      "artifacts",
      "draft",
      "drafts",
      "short",
      "shorts",
      "supercut",
      "supercuts",
      "edit",
      "edits",
      "campaign",
      "campaigns",
      "opportunity",
      "opportunities",
      "highlight",
      "highlights"
    ]),
    connection: Object.freeze([
      "connection",
      "connections",
      "related source",
      "related sources",
      "callback",
      "callbacks",
      "wake",
      "earlier source",
      "later source",
      "before this",
      "after this"
    ]),
    metadata: Object.freeze([
      "metadata",
      "source proof",
      "upload proof",
      "official url",
      "where is the official upload",
      "where can i watch the official upload",
      "source id",
      "upload date",
      "when was this uploaded",
      "when did this go up",
      "date",
      "runtime",
      "duration",
      "how long is this tape",
      "how long is this show",
      "how long is this upload",
      "views",
      "how many views",
      "coverage",
      "authority"
    ]),
    summary: Object.freeze([
      "summary",
      "summarize",
      "synopsis",
      "overview",
      "what is this source about",
      "what is this tape about"
    ]),
    speaker: Object.freeze([
      "who said",
      "which host",
      "who is speaking",
      "who was speaking",
      "identify the speaker",
      "speaker identity",
      "speaker"
    ]),
    ranking: Object.freeze([
      "funniest",
      "laugh hardest",
      "best moment",
      "worst moment",
      "craziest",
      "most unhinged",
      "most memorable",
      "top moment",
      "top moments",
      "highest rated",
      "rank",
      "ranking"
    ]),
    stopwords: Object.freeze([
      "a",
      "about",
      "all",
      "an",
      "and",
      "are",
      "at",
      "be",
      "did",
      "do",
      "does",
      "for",
      "from",
      "give",
      "here",
      "i",
      "in",
      "inside",
      "is",
      "it",
      "me",
      "of",
      "on",
      "please",
      "show",
      "source",
      "tape",
      "that",
      "the",
      "their",
      "they",
      "this",
      "to",
      "us",
      "was",
      "were",
      "what",
      "whats",
      "where",
      "which",
      "who",
      "with",
      "you"
    ])
  });

  var POLICY = Object.freeze({
    exactSourceBindingRequired: true,
    titleInferenceAllowed: false,
    crossSourceSubstitutionAllowed: false,
    publicExcerptsOnly: true,
    transcriptExportAllowed: false,
    speakerAttributionAllowed: false,
    originClaimAllowed: false,
    causalityClaimAllowed: false,
    continuityClaimAllowed: false,
    rightsClearanceAllowed: false,
    creatorApprovalAllowed: false,
    canonMutationAllowed: false,
    copiedMediaAllowed: false,
    defaultLimit: DEFAULT_LIMIT,
    maximumLimit: MAX_LIMIT
  });

  var DANGEROUS_KEYS = Object.create(null);
  DANGEROUS_KEYS.__proto__ = true;
  DANGEROUS_KEYS.constructor = true;
  DANGEROUS_KEYS.prototype = true;

  function SourceQueryError(code, message, path) {
    this.name = "SourceQueryError";
    this.code = code;
    this.message = message;
    this.path = path || "";
    if (Error.captureStackTrace) Error.captureStackTrace(this, SourceQueryError);
  }
  SourceQueryError.prototype = Object.create(Error.prototype);
  SourceQueryError.prototype.constructor = SourceQueryError;

  function fail(code, message, path) {
    throw new SourceQueryError(code, message, path);
  }

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) {
      freezeDeep(value[key]);
    });
    return Object.freeze(value);
  }

  function own(record, key) {
    return Object.prototype.hasOwnProperty.call(record, key);
  }

  function recordDescriptors(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail("UNSAFE_SHAPE", label + " must be a plain data record.", label);
    }
    var prototype;
    var keys;
    var descriptors;
    try {
      prototype = Object.getPrototypeOf(value);
      keys = Reflect.ownKeys(value);
      descriptors = Object.getOwnPropertyDescriptors(value);
    } catch {
      fail("UNSAFE_SHAPE", label + " could not be inspected safely.", label);
    }
    if (prototype !== null && Object.getPrototypeOf(prototype) !== null) {
      fail("UNSAFE_PROTOTYPE", label + " has a custom prototype.", label);
    }
    keys.forEach(function (key) {
      if (typeof key !== "string") {
        fail("UNSAFE_DESCRIPTOR", label + " may not contain symbol fields.", label);
      }
      if (DANGEROUS_KEYS[key]) {
        fail("UNSAFE_KEY", label + " contains a prototype-sensitive field.", label + "." + key);
      }
      var descriptor = descriptors[key];
      if (!descriptor || !own(descriptor, "value") || descriptor.enumerable !== true) {
        fail(
          "UNSAFE_DESCRIPTOR",
          label + "." + key + " must be an enumerable own data field.",
          label + "." + key
        );
      }
    });
    return descriptors;
  }

  function exactKeys(descriptors, allowed, label) {
    Object.keys(descriptors).forEach(function (key) {
      if (allowed.indexOf(key) < 0) {
        fail("UNEXPECTED_FIELD", label + "." + key + " is not allowed.", label + "." + key);
      }
    });
  }

  function ownValue(descriptors, key, label, required) {
    if (!own(descriptors, key)) {
      if (required) fail("MISSING_FIELD", label + "." + key + " is required.", label + "." + key);
      return undefined;
    }
    return descriptors[key].value;
  }

  function snapshot(value, label, depth, seen) {
    var level = depth || 0;
    var visited = seen || [];
    if (level > 64) fail("DEPTH_LIMIT", label + " exceeds the data depth limit.", label);
    if (value === null || typeof value === "string" || typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) fail("NON_FINITE_NUMBER", label + " must be finite.", label);
      return value;
    }
    if (!value || typeof value !== "object") {
      fail("NON_JSON_VALUE", label + " must contain JSON-compatible data.", label);
    }
    if (visited.indexOf(value) >= 0) fail("CIRCULAR_INPUT", label + " is circular.", label);
    if (Array.isArray(value)) {
      var arrayDescriptors;
      var arrayKeys;
      try {
        arrayDescriptors = Object.getOwnPropertyDescriptors(value);
        arrayKeys = Reflect.ownKeys(value);
      } catch {
        fail("UNSAFE_SHAPE", label + " could not be inspected safely.", label);
      }
      var lengthDescriptor = arrayDescriptors.length;
      if (!lengthDescriptor || !own(lengthDescriptor, "value") ||
          !Number.isInteger(lengthDescriptor.value) || lengthDescriptor.value < 0) {
        fail("UNSAFE_DESCRIPTOR", label + " has an unsafe length.", label);
      }
      var length = lengthDescriptor.value;
      arrayKeys.forEach(function (key) {
        if (key === "length") return;
        if (typeof key !== "string" || !/^(?:0|[1-9]\d*)$/.test(key) ||
            Number(key) >= length) {
          fail("UNSAFE_DESCRIPTOR", label + " contains a non-index field.", label);
        }
        var descriptor = arrayDescriptors[key];
        if (!descriptor || !own(descriptor, "value") || descriptor.enumerable !== true) {
          fail("UNSAFE_DESCRIPTOR", label + "[" + key + "] is unsafe.", label + "[" + key + "]");
        }
      });
      visited.push(value);
      var output = [];
      for (var index = 0; index < length; index += 1) {
        if (!own(arrayDescriptors, String(index))) {
          fail("SPARSE_ARRAY", label + " may not contain holes.", label);
        }
        output.push(snapshot(
          arrayDescriptors[String(index)].value,
          label + "[" + index + "]",
          level + 1,
          visited
        ));
      }
      visited.pop();
      return output;
    }
    var descriptors = recordDescriptors(value, label);
    visited.push(value);
    var record = {};
    Object.keys(descriptors).forEach(function (key) {
      record[key] = snapshot(
        descriptors[key].value,
        label + "." + key,
        level + 1,
        visited
      );
    });
    visited.pop();
    return record;
  }

  function clean(value, maximum) {
    var result = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    if (maximum && result.length > maximum) result = result.slice(0, maximum).trim();
    return result;
  }

  function normalize(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokens(value) {
    var normalized = normalize(value);
    return normalized ? normalized.split(" ") : [];
  }

  function unique(values) {
    return Array.from(new Set(values));
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

  function boundedQuery(value) {
    if (typeof value !== "string") {
      fail("INVALID_QUERY", "request.query must be text.", "request.query");
    }
    var query = value.replace(/\s+/g, " ").trim();
    if (query.length < 2 || query.length > MAX_QUERY ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(query)) {
      fail(
        "INVALID_QUERY",
        "request.query must contain 2 to " + MAX_QUERY + " safe characters.",
        "request.query"
      );
    }
    return query;
  }

  function stringList(value, label) {
    if (!Array.isArray(value)) {
      fail("INVALID_VOCABULARY", label + " must be an array.", label);
    }
    return unique(value.map(function (entry, index) {
      if (typeof entry !== "string") {
        fail("INVALID_VOCABULARY", label + "[" + index + "] must be text.", label);
      }
      var normalized = normalize(entry);
      if (!normalized || normalized.length > 120) {
        fail("INVALID_VOCABULARY", label + "[" + index + "] is invalid.", label);
      }
      return normalized;
    }));
  }

  function compileVocabulary(value) {
    if (value == null) {
      return Object.keys(DEFAULT_VOCABULARY).reduce(function (output, key) {
        output[key] = DEFAULT_VOCABULARY[key].slice();
        return output;
      }, {});
    }
    var payload = snapshot(value, "options.vocabulary");
    var allowed = Object.keys(DEFAULT_VOCABULARY);
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) {
        fail(
          "UNKNOWN_VOCABULARY",
          "options.vocabulary." + key + " is not a supported vocabulary lane.",
          "options.vocabulary." + key
        );
      }
    });
    return allowed.reduce(function (output, key) {
      var additions = own(payload, key) ? stringList(
        payload[key],
        "options.vocabulary." + key
      ) : [];
      output[key] = unique(DEFAULT_VOCABULARY[key].concat(additions));
      return output;
    }, {});
  }

  function hasPhrase(query, phrase) {
    return (" " + query + " ").indexOf(" " + normalize(phrase) + " ") >= 0;
  }

  function hasAnyPhrase(query, phrases) {
    return phrases.some(function (phrase) {
      return hasPhrase(query, phrase);
    });
  }

  function queryIntent(query, vocabulary) {
    var normalized = normalize(query);
    if (hasAnyPhrase(normalized, vocabulary.speaker)) return "speaker";
    if (hasAnyPhrase(normalized, vocabulary.ranking)) return "ranking";
    if (hasAnyPhrase(normalized, vocabulary.metadata)) return "metadata";
    if (hasAnyPhrase(normalized, vocabulary.summary)) return "summary";
    if (hasAnyPhrase(normalized, vocabulary.artifact)) return "artifact";
    if (hasAnyPhrase(normalized, vocabulary.connection)) return "connection";
    if (hasAnyPhrase(normalized, vocabulary.inventory)) return "inventory";
    if (hasAnyPhrase(normalized, vocabulary.entity)) return "entity";
    if (hasAnyPhrase(normalized, vocabulary.receipt)) return "receipt";
    return "search";
  }

  function controlTerms(vocabulary) {
    return unique(
      vocabulary.stopwords
        .concat(vocabulary.inventory)
        .concat(vocabulary.receipt)
        .concat(vocabulary.entity)
        .concat(vocabulary.artifact)
        .concat(vocabulary.connection)
        .concat(vocabulary.metadata)
        .concat(vocabulary.summary)
        .concat(vocabulary.speaker)
        .concat(vocabulary.ranking)
        .reduce(function (output, phrase) {
          return output.concat(tokens(phrase));
        }, [])
    );
  }

  function subjectTerms(query, vocabulary) {
    var controls = new Set(controlTerms(vocabulary));
    return unique(tokens(query).filter(function (token) {
      return token.length > 1 && !controls.has(token);
    }));
  }

  function validateDossier(raw, sourceId) {
    var dossier = snapshot(raw, "dossier");
    if (!dossier || dossier.schema !== DOSSIER_SCHEMA) {
      fail("INVALID_DOSSIER", "The dossier engine returned an unsupported schema.", "dossier.schema");
    }
    if (!dossier.source || dossier.source.id !== sourceId) {
      fail(
        "SOURCE_SCOPE_MISMATCH",
        "The dossier engine returned a different source than requested.",
        "dossier.source.id"
      );
    }
    if (!FINGERPRINT.test(clean(dossier.source.sourceFingerprint)) ||
        !FINGERPRINT.test(clean(dossier.fingerprint)) ||
        !dossier.bindings || !FINGERPRINT.test(clean(dossier.bindings.archiveFingerprint))) {
      fail("INVALID_DOSSIER", "The dossier fingerprints are invalid.", "dossier");
    }
    if (!Array.isArray(dossier.source.receipts) ||
        !Array.isArray(dossier.source.entities) ||
        !Array.isArray(dossier.source.artifacts) ||
        !dossier.wake || !Array.isArray(dossier.wake.later) ||
        !Array.isArray(dossier.wake.earlier)) {
      fail("INVALID_DOSSIER", "The dossier evidence collections are invalid.", "dossier");
    }
    dossier.source.receipts.forEach(function (receipt, index) {
      if (!receipt || receipt.speaker !== null ||
          receipt.speakerStatus !== "not-diarized") {
        fail(
          "SPEAKER_BOUNDARY",
          "A dossier receipt attempted to cross the speaker boundary.",
          "dossier.source.receipts[" + index + "]"
        );
      }
      if (receipt.publicExcerptAllowed !== true && clean(receipt.excerpt)) {
        fail(
          "WITHHELD_EXCERPT",
          "A dossier receipt exposed a withheld excerpt.",
          "dossier.source.receipts[" + index + "].excerpt"
        );
      }
    });
    return dossier;
  }

  function readRequest(value) {
    var descriptors = recordDescriptors(value, "request");
    exactKeys(
      descriptors,
      ["schema", "sourceId", "sourceFingerprint", "query", "at", "limit"],
      "request"
    );
    var schema = ownValue(descriptors, "schema", "request", true);
    if (schema !== REQUEST_SCHEMA) {
      fail("FOREIGN_SCHEMA", "request.schema is unsupported.", "request.schema");
    }
    var sourceId = ownValue(descriptors, "sourceId", "request", true);
    if (typeof sourceId !== "string" || !SOURCE_ID.test(sourceId)) {
      fail("INVALID_SOURCE_ID", "request.sourceId must be an exact source ID.", "request.sourceId");
    }
    var sourceFingerprint = ownValue(descriptors, "sourceFingerprint", "request", false);
    if (sourceFingerprint != null &&
        (typeof sourceFingerprint !== "string" ||
          !FINGERPRINT.test(sourceFingerprint))) {
      fail(
        "INVALID_FINGERPRINT",
        "request.sourceFingerprint must be a dossier source fingerprint.",
        "request.sourceFingerprint"
      );
    }
    var query = boundedQuery(ownValue(descriptors, "query", "request", true));
    var at = ownValue(descriptors, "at", "request", false);
    if (at != null && (!Number.isFinite(at) || at < 0)) {
      fail("INVALID_AT", "request.at must be a nonnegative finite number.", "request.at");
    }
    var limit = ownValue(descriptors, "limit", "request", false);
    if (limit == null) limit = DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      fail(
        "INVALID_LIMIT",
        "request.limit must be an integer from 1 to " + MAX_LIMIT + ".",
        "request.limit"
      );
    }
    return {
      schema: REQUEST_SCHEMA,
      sourceId: sourceId,
      sourceFingerprint: sourceFingerprint || null,
      query: query,
      at: at == null ? null : at,
      limit: limit
    };
  }

  function sourceProof(dossier) {
    var source = dossier.source;
    return {
      sourceId: source.id,
      sourceFingerprint: source.sourceFingerprint,
      dossierFingerprint: dossier.fingerprint,
      title: source.displayTitle || source.title,
      date: source.date,
      duration: source.duration,
      views: source.views,
      coverage: source.coverage,
      authority: source.authority,
      sourceType: source.sourceType,
      lanes: source.lanes.slice(),
      availability: source.availability,
      liveStatus: source.liveStatus,
      officialUrl: source.url,
      wordsAudited: source.wordsAudited,
      receiptCount: source.receipts.length,
      entityCount: source.entities.length,
      artifactCount: source.artifacts.length,
      connectionCount: dossier.wake.later.length + dossier.wake.earlier.length,
      summaryAvailable: Boolean(source.summary),
      sourceBriefAvailable: Boolean(source.showWiki && source.showWiki.brief)
    };
  }

  function boundary(sourceId) {
    return {
      exactSourceOnly: true,
      requestedSourceId: sourceId,
      returnedSourceId: sourceId,
      crossSourceSubstitution: false,
      titleInferenceUsed: false,
      publicExcerptsOnly: true,
      speaker: null,
      speakerDiarized: false,
      intentEstablished: false,
      continuityEstablished: false,
      originEstablished: false,
      causalityEstablished: false,
      rightsCleared: false,
      creatorApproved: false,
      canonMutated: false,
      mediaCopied: false,
      connectionsAreNavigationOnly: true
    };
  }

  function baseLimitations(dossier) {
    return unique([
      "Every content result is constrained to exact source ID " + dossier.source.id + ".",
      "Only registered public excerpts may be displayed; transcripts and withheld excerpts are excluded.",
      "Speaker identity, intent, continuity, origin, causality, rights clearance, creator approval, and canon are not established.",
      clean(dossier.proof && dossier.proof.evidenceBoundary)
    ].filter(Boolean));
  }

  function metadataResult(dossier, field, value, basis) {
    return {
      type: "metadata",
      sourceId: dossier.source.id,
      field: field,
      value: value,
      basis: basis,
      contentClaim: field === "registered-summary",
      speaker: null
    };
  }

  function proofResult(dossier) {
    return metadataResult(
      dossier,
      "source-proof",
      {
        title: dossier.source.displayTitle || dossier.source.title,
        date: dossier.source.date,
        duration: dossier.source.duration,
        views: dossier.source.views,
        coverage: dossier.source.coverage,
        authority: dossier.source.authority,
        sourceType: dossier.source.sourceType,
        lanes: dossier.source.lanes.slice(),
        availability: dossier.source.availability,
        liveStatus: dossier.source.liveStatus,
        officialUrl: dossier.source.url,
        sourceFingerprint: dossier.source.sourceFingerprint
      },
      "canonical-source-dossier"
    );
  }

  function inventoryResult(dossier) {
    return metadataResult(
      dossier,
      "source-inventory",
      {
        receipts: dossier.receiptSummary,
        entities: dossier.source.entities.length,
        artifacts: dossier.artifactSummary,
        connections: {
          total: dossier.wake.later.length + dossier.wake.earlier.length,
          later: dossier.wake.later.length,
          earlier: dossier.wake.earlier.length
        },
        summaryAvailable: Boolean(dossier.source.summary),
        sourceBriefAvailable: Boolean(
          dossier.source.showWiki && dossier.source.showWiki.brief
        )
      },
      "registered-dossier-inventory"
    );
  }

  function summaryResult(dossier) {
    return metadataResult(
      dossier,
      "registered-summary",
      {
        text: dossier.source.summary.text,
        basis: dossier.source.summary.basis
      },
      dossier.source.summary.basis
    );
  }

  function sourceBriefResult(dossier) {
    var source = dossier.source;
    var brief = source.showWiki.brief;
    return metadataResult(
      dossier,
      "registered-source-brief",
      {
        title: source.displayTitle || source.title,
        date: source.date,
        duration: source.duration,
        views: source.views,
        coverage: source.coverage,
        authority: source.authority,
        sourceType: source.sourceType,
        availability: source.availability,
        liveStatus: source.liveStatus,
        officialUrl: source.url,
        format: brief.format,
        formatBasis: brief.formatBasis,
        scope: brief.scope
      },
      "canonical-source-metadata-only"
    );
  }

  function receiptResult(dossier, receipt, matchedBy) {
    return {
      type: "receipt",
      sourceId: dossier.source.id,
      key: receipt.key,
      at: receipt.at,
      end: receipt.end,
      kind: receipt.kind,
      label: receipt.label,
      excerpt: receipt.publicExcerptAllowed === true ? clean(receipt.excerpt) : "",
      publicExcerptAllowed: receipt.publicExcerptAllowed === true,
      evidenceLevel: receipt.evidenceLevel,
      evidenceType: receipt.evidenceType,
      evidenceBasis: receipt.evidenceBasis,
      reviewState: receipt.reviewState,
      promotionAllowed: receipt.promotionAllowed === true,
      entityIds: receipt.entityIds.slice(),
      matchedBy: matchedBy,
      speaker: null,
      speakerStatus: "not-diarized",
      url: receipt.url
    };
  }

  function guideCutResult(dossier, cut, matchedBy) {
    var guide = sourceEpisodeGuide(dossier);
    return {
      type: "guide-cut",
      sourceId: dossier.source.id,
      id: cut.id,
      at: cut.at,
      end: cut.end,
      label: cut.label,
      category: cut.category,
      topic: cut.topic,
      excerpt: cut.excerpt,
      basis: guide ? guide.basis : "",
      matchedBy: matchedBy,
      speaker: null,
      speakerStatus: "not-diarized"
    };
  }

  function guideMatchedReceiptResult(dossier, receipt, cut, matchedBy) {
    var result = receiptResult(dossier, receipt, matchedBy);
    result.guideCutId = cut.id;
    result.guideBasis = clean(
      sourceEpisodeGuide(dossier) && sourceEpisodeGuide(dossier).basis
    );
    return result;
  }

  function entityResult(dossier, entity) {
    return {
      type: "entity",
      sourceId: dossier.source.id,
      id: entity.id,
      label: entity.label,
      entityType: entity.type,
      basis: entity.basis,
      receiptKeys: entity.receiptKeys.slice(),
      contentEvidence: entity.basis === "timestamped-receipt",
      speaker: null
    };
  }

  function artifactResult(dossier, artifact) {
    return {
      type: "artifact",
      sourceId: dossier.source.id,
      id: artifact.id,
      kind: artifact.kind,
      label: artifact.label,
      authority: artifact.authority,
      reviewState: artifact.reviewState,
      sourceIds: artifact.sourceIds.slice(),
      receiptKeys: artifact.receiptKeys.slice(),
      at: artifact.at,
      targetSection: artifact.targetSection,
      risk: artifact.risk,
      creatorApproved: false,
      rightsCleared: false,
      speaker: null
    };
  }

  function connectionResult(dossier, connection) {
    return {
      type: "connection",
      sourceId: dossier.source.id,
      targetSourceId: connection.sourceId,
      targetSourceFingerprint: connection.sourceFingerprint,
      targetTitle: connection.displayTitle || connection.title,
      targetDate: connection.date,
      targetCoverage: connection.coverage,
      targetAuthority: connection.authority,
      direction: connection.direction,
      basis: connection.basis,
      sharedEntities: connection.sharedEntities.map(function (entity) {
        return {
          id: entity.id,
          label: entity.label,
          entityType: entity.type,
          basis: entity.basis,
          localReceiptKeys: entity.localReceiptKeys.slice(),
          relatedReceiptKeys: entity.relatedReceiptKeys.slice()
        };
      }),
      artifactIds: connection.artifactIds.slice(),
      relationshipOnly: true,
      contentClaim: false,
      originEstablished: false,
      causalityEstablished: false,
      speaker: null
    };
  }

  function entitySearchText(entity) {
    return normalize([
      entity.id,
      entity.label,
      entity.type
    ].join(" "));
  }

  function phraseOrTermsMatch(text, terms, phrases) {
    var normalized = normalize(text);
    if (phrases.some(function (phrase) {
      return phrase && hasPhrase(normalized, phrase);
    })) return true;
    return terms.length > 0 && terms.every(function (term) {
      return (" " + normalized + " ").indexOf(" " + term + " ") >= 0;
    });
  }

  function exactEntityMatches(dossier, query, terms) {
    var normalizedQuery = normalize(query);
    return dossier.source.entities.filter(function (entity) {
      var label = normalize(entity.label);
      var id = normalize(entity.id);
      var idTail = id.split(" ").slice(1).join(" ");
      if (label && hasPhrase(normalizedQuery, label)) return true;
      if (idTail && hasPhrase(normalizedQuery, idTail)) return true;
      return terms.length > 0 && phraseOrTermsMatch(
        entitySearchText(entity),
        terms,
        []
      );
    });
  }

  function receiptMatches(dossier, query, terms, entities, at) {
    var entityById = new Map(dossier.source.entities.map(function (entity) {
      return [entity.id, entity];
    }));
    var entityReceiptKeys = new Set();
    entities.forEach(function (entity) {
      entity.receiptKeys.forEach(function (key) { entityReceiptKeys.add(key); });
    });
    var phrases = entities.map(function (entity) {
      return normalize(entity.label);
    }).filter(Boolean);
    return dossier.source.receipts.map(function (receipt) {
      var relatedEntities = receipt.entityIds.map(function (id) {
        return entityById.get(id);
      }).filter(Boolean);
      var text = [
        receipt.key,
        receipt.kind,
        receipt.label,
        receipt.publicExcerptAllowed === true ? receipt.excerpt : "",
        receipt.evidenceType,
        receipt.entityIds.join(" "),
        relatedEntities.map(function (entity) { return entity.label; }).join(" ")
      ].join(" ");
      var viaEntity = entityReceiptKeys.has(receipt.key);
      var direct = phraseOrTermsMatch(text, terms, phrases);
      if (!viaEntity && !direct) return null;
      var score = viaEntity ? 100 : 0;
      if (direct) score += 60;
      if (hasPhrase(normalize(text), normalize(receipt.label))) score += 5;
      if (terms.length && terms.every(function (term) {
        return (" " + normalize(text) + " ").indexOf(" " + term + " ") >= 0;
      })) score += 20;
      var distance = at == null ? 0 : Math.abs(Number(receipt.at) - at);
      return {
        receipt: receipt,
        score: score,
        distance: distance,
        matchedBy: viaEntity && direct ? "entity-and-receipt" :
          viaEntity ? "entity-receipt" : "receipt-text"
      };
    }).filter(Boolean).sort(function (left, right) {
      return right.score - left.score ||
        (at == null ? 0 : left.distance - right.distance) ||
        left.receipt.at - right.receipt.at ||
        left.receipt.key.localeCompare(right.receipt.key);
    });
  }

  function genericReceipts(dossier, at) {
    return dossier.source.receipts.slice().sort(function (left, right) {
      return (at == null ? 0 :
        Math.abs(left.at - at) - Math.abs(right.at - at)) ||
        left.at - right.at ||
        left.key.localeCompare(right.key);
    });
  }

  function sourceEpisodeGuide(dossier) {
    var source = dossier && dossier.source;
    var showWiki = source && source.showWiki;
    var guide = showWiki && showWiki.episodeGuide;
    if (!source || source.coverage !== "caption-backed" || !guide ||
        !/episode-guide\/v2$/.test(clean(guide.schema)) ||
        !Array.isArray(guide.cuts) || guide.cuts.length < 8 ||
        guide.cuts.length > 20 || !clean(guide.basis)) {
      return null;
    }
    var seen = new Set();
    var valid = guide.cuts.every(function (cut) {
      var id = clean(cut && cut.id);
      var at = Number(cut && cut.at);
      var end = Number(cut && cut.end);
      if (!id || seen.has(id) || !Number.isFinite(at) || !Number.isFinite(end) ||
          at < 0 || end <= at || end > Number(source.duration) + 1 ||
          !clean(cut.label) || !clean(cut.category) || !clean(cut.topic) ||
          !clean(cut.excerpt)) return false;
      seen.add(id);
      return true;
    });
    return valid ? guide : null;
  }

  function timestampKey(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number.toFixed(3) : "";
  }

  function guideCutMatches(dossier, terms, at) {
    var guide = sourceEpisodeGuide(dossier);
    if (!guide) return [];
    return guide.cuts.map(function (cut) {
      var text = [
        cut.id,
        cut.label,
        cut.category,
        cut.topic,
        cut.excerpt
      ].join(" ");
      if (terms.length && !phraseOrTermsMatch(text, terms, [])) return null;
      var normalizedText = normalize(text);
      var score = Number(cut.score) || 0;
      if (terms.length && terms.every(function (term) {
        return (" " + normalizedText + " ").indexOf(" " + term + " ") >= 0;
      })) score += 40;
      return {
        cut: cut,
        score: score,
        distance: at == null ? 0 : Math.abs(Number(cut.at) - at),
        matchedBy: terms.length ? "episode-guide-cut-text" : "episode-guide-cut-inventory"
      };
    }).filter(Boolean).sort(function (left, right) {
      return right.score - left.score ||
        (at == null ? 0 : left.distance - right.distance) ||
        left.cut.at - right.cut.at ||
        left.cut.id.localeCompare(right.cut.id);
    });
  }

  function guideCutResults(dossier, matches, limit) {
    var canonicalByTime = new Map();
    dossier.source.receipts.forEach(function (receipt) {
      var key = timestampKey(receipt.at);
      if (key && !canonicalByTime.has(key)) canonicalByTime.set(key, receipt);
    });
    var seenReceipts = new Set();
    var seenCuts = new Set();
    var results = [];
    matches.some(function (match) {
      var cut = match.cut;
      if (seenCuts.has(cut.id)) return false;
      seenCuts.add(cut.id);
      var canonical = canonicalByTime.get(timestampKey(cut.at));
      if (canonical) {
        if (seenReceipts.has(canonical.key)) return false;
        seenReceipts.add(canonical.key);
        results.push(guideMatchedReceiptResult(
          dossier,
          canonical,
          cut,
          "canonical-receipt-at-episode-guide-timestamp"
        ));
      } else {
        results.push(guideCutResult(dossier, cut, match.matchedBy));
      }
      return results.length >= limit;
    });
    return results;
  }

  function matchingArtifacts(dossier, query, terms) {
    return dossier.source.artifacts.filter(function (artifact) {
      if (!terms.length) return true;
      return phraseOrTermsMatch(
        [artifact.id, artifact.kind, artifact.label, artifact.targetSection].join(" "),
        terms,
        [normalize(query)]
      );
    }).sort(function (left, right) {
      return left.label.localeCompare(right.label) || left.id.localeCompare(right.id);
    });
  }

  function matchingConnections(dossier, query, terms) {
    return dossier.wake.later.concat(dossier.wake.earlier).filter(function (connection) {
      if (!terms.length) return true;
      var text = [
        connection.sourceId,
        connection.title,
        connection.displayTitle,
        connection.direction,
        connection.basis,
        connection.sharedEntities.map(function (entity) {
          return [entity.id, entity.label, entity.type].join(" ");
        }).join(" "),
        connection.artifactIds.join(" ")
      ].join(" ");
      return phraseOrTermsMatch(text, terms, [normalize(query)]);
    }).sort(function (left, right) {
      return Number(right.direction === "later") - Number(left.direction === "later") ||
        right.date.localeCompare(left.date) ||
        left.sourceId.localeCompare(right.sourceId);
    });
  }

  function showWikiSemanticAliases(kind, id, label, description) {
    var text = normalize([id, label, description].join(" "));
    if (kind === "guide") return [
      "deep dive", "deep dive cuts", "episode guide", "episode cuts",
      "guide cuts", "playable cuts", "cuts in the full guide",
    ];
    if (kind === "brief") return [
      "show facts", "source facts", "what is known for sure",
    ];
    if (kind === "recap") return [
      "recap", "summary", "summarize", "recap this show", "summarize this show",
      "summarize the show", "what happened in this show", "catch me up",
      "give me the rundown", "show rundown", "what was this show about", "show summary",
    ];
    if (kind === "experience") return [
      "quick tour", "essential watch path", "where should i start",
      "walk me through this show",
    ];
    if (kind !== "lane") return [];
    if (/\b(?:topic|subject|discussion)\b/.test(text)) return [
      "recurring topics", "main topics", "topic rundown",
      "what did they keep talking about", "what did they talk about",
      "where did they talk about", "what did they discuss", "what came up", "how many topics",
      "how many times did they mention",
    ];
    if (/\b(?:funny|funniest|comedy|laugh)\b/.test(text)) return [
      "what made them laugh", "where did they laugh", "funny parts",
      "funniest parts", "biggest laughs",
    ];
    if (/\b(?:negative|verdict|worst|hate|criticism|critical)\b/.test(text)) return [
      "what did they hate", "what did they dislike", "worst parts",
      "harshest takes", "negative verdicts", "strongest criticism",
    ];
    if (/\b(?:best|strongest|highlight|standout)\b/.test(text)) return [
      "best parts", "standout moments", "strongest moments", "show highlights",
      "highlights",
    ];
    if (/\b(?:character|portrayal|performance|impression)\b/.test(text)) return [
      "which character bits", "character performances", "impressions",
    ];
    return [];
  }

  function showWikiCandidates(dossier) {
    var showWiki = dossier.source.showWiki;
    if (!showWiki || typeof showWiki !== "object") return [];
    var output = [];
    function add(kind, id, label, aliases, receiptKeys, order, description) {
      var cleanAliases = unique((Array.isArray(aliases) ? aliases : [])
        .concat(showWikiSemanticAliases(kind, id, label, description))
        .map(normalize).filter(Boolean));
      if (!cleanAliases.length) return;
      output.push({
        kind: kind,
        id: clean(id),
        label: clean(label),
        aliases: cleanAliases,
        receiptKeys: unique((Array.isArray(receiptKeys) ? receiptKeys : []).map(function (key) {
          return clean(key);
        }).filter(Boolean)),
        order: order
      });
    }
    if (showWiki.brief) {
      add(
        "brief", "source-brief", "SOURCE BRIEF",
        showWiki.brief.queryAliases, [], 1, showWiki.description
      );
    }
    if (showWiki.recap) {
      var recapKeys = [];
      (Array.isArray(showWiki.recap.blocks) ? showWiki.recap.blocks : []).forEach(function (block) {
        recapKeys = recapKeys.concat(Array.isArray(block.receiptKeys) ? block.receiptKeys : []);
      });
      add(
        "recap", "episode-recap", "EPISODE RECAP",
        showWiki.recap.queryAliases, recapKeys, 1, showWiki.recap.overview
      );
    }
    if (sourceEpisodeGuide(dossier)) {
      add(
        "guide", "episode-guide", "DEEP-DIVE CUTS",
        [], [], 4, sourceEpisodeGuide(dossier).overview
      );
    }
    if (showWiki.experience) {
      add(
        "experience", clean(showWiki.experience.id) || "watch-path",
        clean(showWiki.experience.title || showWiki.experience.label || "WATCH PATH"),
        showWiki.experience.queryAliases,
        showWiki.experience.routeReceiptKeys,
        2,
        showWiki.experience.description
      );
    }
    (Array.isArray(showWiki.lanes) ? showWiki.lanes : []).forEach(function (lane) {
      add("lane", lane.id, lane.label, lane.queryAliases, lane.receiptKeys, 3,
        lane.description);
    });
    return output;
  }

  function matchShowWikiIntent(dossier, query) {
    var normalizedQuery = normalize(query);
    var queryForms = unique([
      normalizedQuery,
      normalizedQuery.replace(/\b([a-z0-9]+) s\b/g, "$1s"),
    ]);
    var matches = [];
    showWikiCandidates(dossier).forEach(function (candidate) {
      candidate.aliases.forEach(function (alias) {
        if (!queryForms.some(function (queryForm) {
          return hasPhrase(queryForm, alias);
        })) return;
        matches.push({
          kind: candidate.kind,
          id: candidate.id,
          label: candidate.label,
          receiptKeys: candidate.receiptKeys.slice(),
          matchedAlias: alias,
          aliasTokens: tokens(alias).length,
          order: candidate.order
        });
      });
    });
    matches.sort(function (left, right) {
      return right.aliasTokens - left.aliasTokens ||
        right.matchedAlias.length - left.matchedAlias.length ||
        right.order - left.order ||
        left.id.localeCompare(right.id);
    });
    return matches[0] || null;
  }

  function showWikiSubjectTerms(dossier, query, match, vocabulary) {
    var controls = new Set(controlTerms(vocabulary).concat(tokens(match.matchedAlias)).concat([
      "any", "anything", "appear", "appeared", "appears", "broadcast", "can",
      "count", "could", "current", "episode", "exact", "got", "have", "has", "had",
      "how", "indexed", "lane", "lanes", "last", "latest", "many", "may", "might",
      "newest", "night", "nights", "number", "often", "part", "parts", "recent",
      "registered", "see", "sent", "show", "some", "something", "stream", "talk",
      "talked", "talking", "tell", "there", "time", "times", "tonight", "wiki",
      "will", "would", "yesterday"
    ]));
    var normalizedQuery = normalize(query);
    var boundTitleTokens = new Set();
    unique([
      normalize(dossier.source.displayTitle),
      normalize(dossier.source.title),
    ].filter(Boolean)).forEach(function (title) {
      if (!hasPhrase(normalizedQuery, title)) return;
      tokens(title).forEach(function (token) { boundTitleTokens.add(token); });
    });
    return unique(tokens(query).filter(function (token) {
      return token.length > 1 && !controls.has(token) && !boundTitleTokens.has(token);
    }));
  }

  function episodeGuideAnswer(dossier, request, match, vocabulary, exactTerms) {
    var guide = sourceEpisodeGuide(dossier);
    if (!guide) return null;
    var terms = Array.isArray(exactTerms) ? exactTerms :
      showWikiSubjectTerms(dossier, request.query, match, vocabulary);
    var matches = guideCutMatches(dossier, terms, request.at);
    if (!matches.length) return null;
    var results = guideCutResults(dossier, matches, request.limit);
    var normalizedQuestion = normalize(request.query);
    var countRequested = /\b(?:how many|count|number of)\b/.test(normalizedQuestion);
    return {
      status: "supported",
      intent: "episode-guide",
      episode: {
        kind: "guide",
        id: "episode-guide",
        label: "DEEP-DIVE CUTS",
        matchedAlias: clean(match && match.matchedAlias) || "episode-guide subject match",
        totalCuts: guide.cuts.length,
        matchedCuts: matches.length,
        shownCuts: results.length,
        countRequested: countRequested,
        countBasis: countRequested ? "validated exact-source episode-guide cuts" : null
      },
      results: results,
      message: countRequested ?
        "This exact show has " + matches.length + " matching validated deep-dive cut" +
          (matches.length === 1 ? "" : "s") + "; " + results.length + " are shown." :
        "I found " + matches.length + " matching deep-dive cut" +
          (matches.length === 1 ? "" : "s") + " inside this exact show; " +
          results.length + " are shown.",
      limitations: [
        "Deep-dive cuts are source-local caption navigation, separate from the canonical registered-receipt count.",
        "A canonical receipt wins when it shares the exact timestamp with a deep-dive cut; duplicate results are suppressed."
      ]
    };
  }

  function showWikiAnswer(dossier, request, match, vocabulary) {
    if (match.kind === "guide") {
      return episodeGuideAnswer(dossier, request, match, vocabulary, null);
    }
    if (match.kind === "brief") {
      return {
        status: "supported",
        intent: "episode-brief",
        episode: {
          kind: "brief",
          id: "source-brief",
          label: "SOURCE BRIEF",
          matchedAlias: match.matchedAlias,
          totalReceipts: 0,
          matchedReceipts: 0,
          shownReceipts: 0
        },
        results: [sourceBriefResult(dossier)],
        message: "This is the canonical Source Brief for the exact upload; it is metadata only, not a transcript-derived episode summary or playable moment.",
        limitations: [
          "The Source Brief exposes canonical upload facts only. Topics, quotes, reactions, rankings, speakers, and moments remain sealed until source-local evidence is registered."
        ]
      };
    }
    var receiptByKey = new Map(dossier.source.receipts.map(function (receipt) {
      return [receipt.key, receipt];
    }));
    var allReceipts = match.receiptKeys.map(function (key) {
      return receiptByKey.get(key);
    }).filter(Boolean);
    var terms = showWikiSubjectTerms(dossier, request.query, match, vocabulary);
    var normalizedQuestion = normalize(request.query);
    var countRequested = /\b(?:how many|how often|count|number of)\b/.test(normalizedQuestion);
    var relativeTimeRequested = /\b(?:last night|last nights|yesterday|tonight|latest|newest|recent)\b/.test(
      normalizedQuestion
    );
    var selectedReceipts = allReceipts;
    if (terms.length) {
      var entities = exactEntityMatches(dossier, request.query, terms);
      var matchingKeys = new Set(receiptMatches(
        dossier, request.query, terms, entities, request.at
      ).map(function (entry) { return entry.receipt.key; }));
      selectedReceipts = allReceipts.filter(function (receipt) {
        return matchingKeys.has(receipt.key);
      });
    }
    if (terms.length && !selectedReceipts.length) {
      var guideFallback = episodeGuideAnswer(
        dossier,
        request,
        { matchedAlias: match.matchedAlias },
        vocabulary,
        terms
      );
      if (guideFallback) return guideFallback;
    }
    var results = [];
    var receiptLimit = request.limit;
    if (match.kind === "recap" && dossier.source.summary) {
      results.push(summaryResult(dossier));
      receiptLimit = Math.max(0, request.limit - 1);
    }
    results = results.concat(selectedReceipts.slice(0, receiptLimit).map(function (receipt) {
      return receiptResult(dossier, receipt, "show-wiki-" + match.kind);
    }));
    var shownReceipts = results.filter(function (result) {
      return result.type === "receipt";
    }).length;
    var supported = match.kind === "recap"
      ? results.length > 0
      : selectedReceipts.length > 0;
    var message;
    if (!allReceipts.length) {
      message = "I checked this exact show’s registered " + match.label +
        " lane. It has no playable receipt yet.";
    } else if (terms.length && !selectedReceipts.length) {
      message = "I checked all " + allReceipts.length + " registered " + match.label +
        " receipt" + (allReceipts.length === 1 ? "" : "s") +
        " on this exact show; none match the requested subject.";
    } else if (countRequested) {
      message = "This exact show has " + selectedReceipts.length + " matching registered " +
        match.label + " receipt" + (selectedReceipts.length === 1 ? "" : "s") + ". " +
        "That is a count of indexed source receipts, not every utterance or repeated mention; " +
        shownReceipts + " playable result" + (shownReceipts === 1 ? " is" : "s are") + " shown.";
    } else {
      message = "This exact show has " + allReceipts.length + " registered " + match.label +
        " receipt" + (allReceipts.length === 1 ? "" : "s") + "; " +
        shownReceipts + " playable result" + (shownReceipts === 1 ? " is" : "s are") + " shown.";
    }
    return {
      status: supported ? "supported" : "insufficient-evidence",
      intent: "episode-" + match.kind,
      episode: {
        kind: match.kind,
        id: match.id,
        label: match.label,
        matchedAlias: match.matchedAlias,
        totalReceipts: allReceipts.length,
        matchedReceipts: selectedReceipts.length,
        shownReceipts: shownReceipts,
        countRequested: countRequested,
        countBasis: countRequested ? "registered exact-source receipts" : null
      },
      results: results,
      message: message,
      limitations: [
        "This answer uses the registered Show Wiki lane for this exact source; its labels and order are navigation, not a creator verdict or speaker attribution."
      ].concat(countRequested ? [
        "Receipt counts do not measure every utterance, repeated word, or unique idea in the underlying captions."
      ] : []).concat(relativeTimeRequested ? [
        "Relative date wording did not rebind the request; the caller-supplied exact source ID remained the only source searched."
      ] : [])
    };
  }

  function resultMessage(status, dossier, count) {
    var source = dossier.source;
    if (status === "inventory") {
      var inventoryMessage = "This exact source has " + source.receipts.length + " registered receipt" +
        (source.receipts.length === 1 ? "" : "s") + ", " +
        source.entities.length + " entit" + (source.entities.length === 1 ? "y" : "ies") +
        ", " + source.artifacts.length + " artifact" +
        (source.artifacts.length === 1 ? "" : "s") + ", and " +
        (dossier.wake.later.length + dossier.wake.earlier.length) +
        " typed archive connection" +
        ((dossier.wake.later.length + dossier.wake.earlier.length) === 1 ? "" : "s") + ".";
      if (source.showWiki && source.showWiki.brief) {
        inventoryMessage += " A canonical Source Brief is registered.";
      }
      return inventoryMessage;
    }
    if (status === "proof") {
      return "This is canonical source proof, not a claim about the source contents.";
    }
    if (status === "metadata-only") {
      return "This source is registered from metadata, but its contents are not indexed.";
    }
    if (status === "caption-limited") {
      return "This source is registered, but no usable public caption-backed content receipt is available.";
    }
    if (status === "unavailable") {
      return "This source is registered as unavailable in the current snapshot.";
    }
    if (status === "speaker-refused") {
      return "The source receipts are not speaker-diarized, so the requested speaker cannot be identified.";
    }
    if (status === "ranking-refused") {
      return "This source dossier has no registered ranking contract for the requested superlative.";
    }
    if (status === "stale-source") {
      return "The supplied source fingerprint no longer matches the canonical dossier.";
    }
    if (status === "insufficient-evidence") {
      return "No exact-source evidence matches the requested subject.";
    }
    return "The exact source contains " + count + " matching registered result" +
      (count === 1 ? "" : "s") + ".";
  }

  function create(options) {
    var optionDescriptors = recordDescriptors(options, "options");
    exactKeys(optionDescriptors, ["dossierEngine", "vocabulary"], "options");
    var dossierEngine = ownValue(optionDescriptors, "dossierEngine", "options", true);
    if (!dossierEngine || typeof dossierEngine !== "object" ||
        typeof dossierEngine.build !== "function") {
      fail(
        "INVALID_DOSSIER_ENGINE",
        "options.dossierEngine must provide build(sourceId).",
        "options.dossierEngine"
      );
    }
    var vocabulary = compileVocabulary(
      ownValue(optionDescriptors, "vocabulary", "options", false)
    );

    function answer(input) {
      var request = readRequest(input);
      var rawDossier;
      try {
        rawDossier = dossierEngine.build(request.sourceId);
      } catch (error) {
        if (error && error.name === "SourceQueryError") throw error;
        fail(
          "SOURCE_BUILD_FAILED",
          "The exact requested source could not be built.",
          "request.sourceId"
        );
      }
      var dossier = validateDossier(rawDossier, request.sourceId);
      if (request.at != null && request.at > dossier.source.duration + 1) {
        fail("INVALID_AT", "request.at is outside the exact source duration.", "request.at");
      }

      var proof = sourceProof(dossier);
      var limitations = baseLimitations(dossier);
      var status;
      var intent = "unparsed";
      var episode = null;
      var customMessage = "";
      var results = [];

      if (request.sourceFingerprint &&
          request.sourceFingerprint !== dossier.source.sourceFingerprint) {
        status = "stale-source";
        limitations.push(
          "No query was parsed because the caller supplied a stale or altered source fingerprint."
        );
      } else {
        intent = queryIntent(request.query, vocabulary);
        var showWikiMatch = matchShowWikiIntent(dossier, request.query);

        if (intent === "metadata") {
          status = "proof";
          results = [proofResult(dossier)];
        } else if (intent === "inventory") {
          status = "inventory";
          results = [inventoryResult(dossier)];
        } else if (showWikiMatch && showWikiMatch.kind === "brief" &&
            intent !== "summary" && intent !== "speaker") {
          var sourceBriefAnswer = showWikiAnswer(
            dossier, request, showWikiMatch, vocabulary
          );
          status = sourceBriefAnswer.status;
          intent = sourceBriefAnswer.intent;
          episode = sourceBriefAnswer.episode;
          results = sourceBriefAnswer.results;
          customMessage = sourceBriefAnswer.message;
          limitations = limitations.concat(sourceBriefAnswer.limitations);
        } else if (dossier.source.coverage === "metadata-only") {
          status = "metadata-only";
          limitations.push(
            "The upload title cannot be used to infer topics, quotes, people, outcomes, sentiment, or summary."
          );
        } else if (dossier.source.coverage === "caption-limited") {
          status = "caption-limited";
          limitations.push(
            "Caption-limited registration supplies no public content receipt for this question."
          );
        } else if (dossier.source.coverage === "unavailable") {
          status = "unavailable";
          limitations.push(
            "Current source availability prevents a content answer in this snapshot."
          );
        } else if (intent === "speaker") {
          var speakerTerms = subjectTerms(request.query, vocabulary);
          var speakerEntities = exactEntityMatches(
            dossier,
            request.query,
            speakerTerms
          );
          results = receiptMatches(
            dossier,
            request.query,
            speakerTerms,
            speakerEntities,
            request.at
          ).slice(0, request.limit).map(function (match) {
            return receiptResult(dossier, match.receipt, "speaker-navigation-only");
          });
          status = "speaker-refused";
          limitations.push(
            "Any returned receipt is navigation only and cannot answer who spoke."
          );
        } else if (showWikiMatch) {
          var episodeAnswer = showWikiAnswer(
            dossier, request, showWikiMatch, vocabulary
          );
          status = episodeAnswer.status;
          intent = episodeAnswer.intent;
          episode = episodeAnswer.episode;
          results = episodeAnswer.results;
          customMessage = episodeAnswer.message;
          limitations = limitations.concat(episodeAnswer.limitations);
        } else if (intent === "ranking") {
          status = "ranking-refused";
          limitations.push(
            "Receipt order, profanity, excerpt wording, cached views, and dossier position are not a ranking."
          );
        } else if (intent === "summary") {
          if (dossier.source.summary) {
            status = "supported";
            results = [summaryResult(dossier)];
          } else {
            status = "insufficient-evidence";
            limitations.push(
              "No registered source-level summary exists for this exact source."
            );
          }
        } else if (intent === "artifact") {
          var artifactTerms = subjectTerms(request.query, vocabulary);
          results = matchingArtifacts(
            dossier,
            request.query,
            artifactTerms
          ).slice(0, request.limit).map(function (artifact) {
            return artifactResult(dossier, artifact);
          });
          status = results.length ? "supported" : "insufficient-evidence";
        } else if (intent === "connection") {
          var connectionTerms = subjectTerms(request.query, vocabulary);
          results = matchingConnections(
            dossier,
            request.query,
            connectionTerms
          ).slice(0, request.limit).map(function (connection) {
            return connectionResult(dossier, connection);
          });
          status = results.length ? "supported" : "insufficient-evidence";
          if (results.length) {
            limitations.push(
              "Connections expose typed archive navigation only; they do not substitute the related source as the answer."
            );
          }
        } else {
          var terms = subjectTerms(request.query, vocabulary);
          var entities = exactEntityMatches(dossier, request.query, terms);
          var genericEntityRequest = intent === "entity" && terms.length === 0;
          var genericReceiptRequest = intent === "receipt" && terms.length === 0;
          if (genericEntityRequest) {
            results = dossier.source.entities.slice().sort(function (left, right) {
              return left.label.localeCompare(right.label) || left.id.localeCompare(right.id);
            }).slice(0, request.limit).map(function (entity) {
              return entityResult(dossier, entity);
            });
          } else if (genericReceiptRequest || (!terms.length && intent === "search")) {
            results = genericReceipts(dossier, request.at)
              .slice(0, request.limit)
              .map(function (receipt) {
                return receiptResult(dossier, receipt, request.at == null ?
                  "source-inventory" : "anchor-proximity");
              });
          } else {
            var matches = receiptMatches(
              dossier,
              request.query,
              terms,
              entities,
              request.at
            );
            var receiptResults = matches.slice(0, request.limit).map(function (match) {
              return receiptResult(dossier, match.receipt, match.matchedBy);
            });
            var receiptKeys = new Set(receiptResults.map(function (result) {
              return result.key;
            }));
            var guideResults = guideCutResults(
              dossier,
              guideCutMatches(dossier, terms, request.at),
              request.limit
            ).filter(function (result) {
              return result.type !== "receipt" || !receiptKeys.has(result.key);
            });
            var contentResults = receiptResults.concat(guideResults).slice(0, request.limit);
            var remaining = Math.max(0, request.limit - contentResults.length);
            var entityResults = entities.slice(0, remaining).map(function (entity) {
              return entityResult(dossier, entity);
            });
            results = contentResults.concat(entityResults);
          }
          var contentReceipts = results.filter(function (result) {
            return result.type === "receipt" || result.type === "guide-cut";
          });
          var metadataOnlyEntities = results.length > 0 && results.every(function (result) {
            return result.type === "entity" && result.contentEvidence === false;
          });
          status = results.length && (contentReceipts.length || !metadataOnlyEntities) ?
            "supported" : "insufficient-evidence";
          if (metadataOnlyEntities) {
            limitations.push(
              "A cached-title entity match is source metadata, not evidence that the subject appears in the source."
            );
          }
        }
      }

      if (STATUSES.indexOf(status) < 0) {
        fail("INTERNAL_STATUS", "The source-query status left the closed vocabulary.");
      }
      results.forEach(function (result, index) {
        if (RESULT_TYPES.indexOf(result.type) < 0) {
          fail(
            "INTERNAL_RESULT_TYPE",
            "results[" + index + "] left the closed result vocabulary."
          );
        }
        if (result.sourceId !== request.sourceId) {
          fail(
            "CROSS_SOURCE_RESULT",
            "A result attempted to substitute another source.",
            "results[" + index + "].sourceId"
          );
        }
      });

      var output = {
        schema: RESULT_SCHEMA,
        version: VERSION,
        status: status,
        intent: intent,
        episode: episode,
        scope: {
          exactSource: true,
          sourceId: request.sourceId,
          sourceFingerprint: dossier.source.sourceFingerprint,
          dossierFingerprint: dossier.fingerprint,
          channelId: dossier.bindings.channelId,
          channelPackFingerprint: dossier.bindings.channelPackFingerprint,
          snapshotDate: dossier.bindings.snapshotDate,
          archiveFingerprint: dossier.bindings.archiveFingerprint,
          query: request.query,
          at: request.at,
          limit: request.limit
        },
        sourceProof: proof,
        message: customMessage || resultMessage(status, dossier, results.length),
        results: results,
        resultCount: results.length,
        limitations: unique(limitations),
        boundary: boundary(request.sourceId)
      };
      output.fingerprint = fnv1a(stableJson(output));
      return freezeDeep(output);
    }

    return freezeDeep({
      VERSION: VERSION,
      answer: answer,
      getPolicy: function () {
        return POLICY;
      },
      getVocabulary: function () {
        return freezeDeep(snapshot(vocabulary, "vocabulary"));
      }
    });
  }

  var api = freezeDeep({
    VERSION: VERSION,
    REQUEST_SCHEMA: REQUEST_SCHEMA,
    RESULT_SCHEMA: RESULT_SCHEMA,
    STATUSES: STATUSES.slice(),
    RESULT_TYPES: RESULT_TYPES.slice(),
    create: create
  });

  Object.defineProperty(root, "ShokkerSourceQuery", {
    value: api,
    enumerable: true,
    writable: false,
    configurable: false
  });
})(typeof window !== "undefined" ? window : globalThis);
