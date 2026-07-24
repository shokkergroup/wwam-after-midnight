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

  var VERSION = "1.1.0";
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
    "caption-character-signal": true,
    "caption-character-context": true,
    "curated-character-performance": true
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
      wordsAudited: finiteNumber(raw.wordsAudited || 0, path + ".wordsAudited", 0),
      summary: normalizeSummary(raw.summary, path + ".summary"),
      rightsPolicy: isRecord(raw.rightsPolicy) ? serial(raw.rightsPolicy) : {},
      warnings: stringList(raw.warnings || [], path + ".warnings", { max: 420 }),
      metrics: isRecord(raw.metrics) ? serial(raw.metrics) : {},
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
      receiptKeys: source.receipts.map(function (receipt) {
        return [receipt.key, receipt.at, receipt.end, receipt.evidenceType];
      }),
      entities: source.entities.map(function (entity) {
        return [entity.id, entity.basis, entity.receiptKeys];
      }),
      artifacts: source.artifacts.map(function (artifact) {
        return [artifact.id, artifact.kind, artifact.authority, artifact.sourceIds,
          artifact.receiptKeys];
      })
    }));
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
    var globalReceiptKeys = new Set();
    sources.forEach(function (source) {
      if (sourceById.has(source.id)) {
        fail("DUPLICATE_SOURCE", "Source Dossier contains duplicate source " + source.id + ".");
      }
      source.receipts.forEach(function (receipt) {
        if (globalReceiptKeys.has(receipt.key)) {
          fail("DUPLICATE_GLOBAL_RECEIPT", "Receipt key " + receipt.key + " is not globally unique.");
        }
        globalReceiptKeys.add(receipt.key);
      });
      delete source._index;
      source.sourceFingerprint = sourceFingerprint(source);
      sourceById.set(source.id, source);
    });
    sources.forEach(function (source) {
      source.artifacts.forEach(function (artifact) {
        artifact.sourceIds.forEach(function (sourceId) {
          if (!sourceById.has(sourceId)) {
            fail("UNKNOWN_ARTIFACT_SOURCE",
              "Artifact " + artifact.id + " references unknown source " + sourceId + ".");
          }
        });
        artifact.receiptKeys.forEach(function (receiptKey) {
          if (!globalReceiptKeys.has(receiptKey)) {
            fail("UNKNOWN_ARTIFACT_RECEIPT",
              "Artifact " + artifact.id + " references unknown receipt " + receiptKey + ".");
          }
        });
        if (artifact.at != null && artifact.at > source.duration + 1) {
          fail("ARTIFACT_OUT_OF_RANGE", "Artifact " + artifact.id + " is outside its source.");
        }
      });
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
          officialUrl: dossier.source.url
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
