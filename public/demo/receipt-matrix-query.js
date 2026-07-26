(function (root) {
  "use strict";

  /*
   * RECEIPT MATRIX QUERY
   *
   * A channel-neutral, deliberately narrow natural-language router for
   * source-grouped evidence questions. It does not answer the question. It
   * converts explicit count, intersection, ranking, chronology, and lineage
   * language into a deterministic Receipt Matrix request. Ordinary retrieval
   * remains outside this router.
   */

  var VERSION = "1.0.1";
  var ROUTE_SCHEMA = "shokker-receipt-matrix-route/v1";
  var MATRIX_SCHEMA = "shokker-receipt-matrix-request/v1";
  var STATUS = Object.freeze({
    supported: true,
    "unknown-entity": true,
    "ambiguous-entity": true
  });
  var SOURCE_TERMS = [
    "source", "sources", "upload", "uploads", "stream", "streams",
    "livestream", "livestreams", "video", "videos", "tape", "tapes"
  ];
  var PERFORMANCE_TERMS = [
    "performance", "performances", "receipt", "receipts", "clip", "clips",
    "bit", "bits", "moment", "moments", "appearance", "appearances"
  ];
  var LINEAGE_PHRASES = [
    "bloodline", "timeline", "through the years", "across the years",
    "across years", "across time", "over time", "oldest to newest",
    "full history", "complete history", "complete run", "supercut"
  ];
  var SOURCE_VERBS = [
    "contain", "contains", "containing", "have", "has", "having", "include",
    "includes", "including", "feature", "features", "featuring", "show",
    "shows", "showing"
  ];
  var STOP_WORDS = new Set([
    "a", "about", "all", "also", "an", "and", "any", "are", "around", "as",
    "at", "be", "both", "build", "by", "can", "canonical", "complete",
    "contain", "contains", "containing", "current", "did", "do", "does",
    "every", "exact", "find", "for", "from", "full", "give", "has", "have",
    "having", "how", "i", "in", "include", "includes", "including", "index",
    "indexed", "into", "is", "it", "list", "make", "many", "me", "most", "of", "on",
    "one", "order", "our", "please", "rank", "ranking", "show", "showing",
    "shows", "source", "sources", "the", "their", "them", "these", "this",
    "those", "through", "time", "to", "together", "top", "upload", "uploads",
    "video", "videos", "which", "with", "years"
  ]);

  function QueryError(code, message) {
    this.name = "ReceiptMatrixQueryError";
    this.code = code;
    this.message = message;
    if (Error.captureStackTrace) Error.captureStackTrace(this, QueryError);
  }
  QueryError.prototype = Object.create(Error.prototype);
  QueryError.prototype.constructor = QueryError;

  function fail(code, message) {
    throw new QueryError(code, message);
  }

  function record(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    var prototype = Object.getPrototypeOf(value);
    return Object.prototype.toString.call(value) === "[object Object]" &&
      (prototype === null || Object.getPrototypeOf(prototype) === null);
  }

  function clean(value, maximum) {
    var output = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    return maximum && output.length > maximum
      ? output.slice(0, maximum).trim()
      : output;
  }

  function normalize(value) {
    return clean(value, 1000)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[\u2018\u2019']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function (key) {
      freezeDeep(value[key]);
    });
    return value;
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function normalizedList(value, fallback, label) {
    var input = value == null ? fallback : value;
    if (!Array.isArray(input)) fail("INVALID_VOCABULARY", label + " must be an array.");
    var output = unique(input.map(normalize).filter(Boolean));
    if (!output.length) fail("INVALID_VOCABULARY", label + " cannot be empty.");
    return output.sort(function (left, right) {
      return right.length - left.length || left.localeCompare(right);
    });
  }

  function phrasePattern(phrase) {
    return new RegExp(
      "(?:^| )" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\s+/g, "\\s+") + "(?: |$)"
    );
  }

  function hasPhrase(text, phrase) {
    return phrasePattern(phrase).test(text);
  }

  function firstPhrases(text, phrases) {
    return phrases.filter(function (phrase) {
      return hasPhrase(text, phrase);
    });
  }

  function entityDefinition(raw, index) {
    if (!record(raw)) fail("INVALID_ENTITY", "entities[" + index + "] must be an object.");
    var id = clean(raw.id, 160);
    var label = clean(raw.label, 240);
    if (!id || !label) {
      fail("INVALID_ENTITY", "entities[" + index + "] requires id and label.");
    }
    var aliases = unique([label].concat(Array.isArray(raw.aliases) ? raw.aliases : [])
      .map(normalize).filter(Boolean));
    if (!aliases.length) fail("INVALID_ENTITY", "Entity " + id + " has no aliases.");
    return {
      id: id,
      label: label,
      type: clean(raw.type || "entity", 100),
      aliases: aliases.sort(function (left, right) {
        return right.length - left.length || left.localeCompare(right);
      })
    };
  }

  function groupDefinition(raw, index, entityById) {
    if (!record(raw)) fail("INVALID_GROUP", "groups[" + index + "] must be an object.");
    var id = clean(raw.id, 160);
    var label = clean(raw.label, 240);
    var entityIds = Array.isArray(raw.entityIds)
      ? unique(raw.entityIds.map(function (entry) { return clean(entry, 160); }))
      : [];
    if (!id || !label || !entityIds.length) {
      fail("INVALID_GROUP", "groups[" + index + "] requires id, label, and entityIds.");
    }
    entityIds.forEach(function (entityId) {
      if (!entityById.has(entityId)) {
        fail("UNKNOWN_GROUP_ENTITY", "Group " + id + " references unknown entity " + entityId + ".");
      }
    });
    return {
      id: id,
      label: label,
      entityIds: entityIds.sort(),
      aliases: unique([label].concat(Array.isArray(raw.aliases) ? raw.aliases : [])
        .map(normalize).filter(Boolean)).sort(function (left, right) {
          return right.length - left.length || left.localeCompare(right);
        })
    };
  }

  function create(options) {
    if (!record(options)) fail("INVALID_OPTIONS", "create requires a plain options object.");
    var rawEntities = options.entities;
    if (!Array.isArray(rawEntities) || !rawEntities.length || rawEntities.length > 160) {
      fail("INVALID_ENTITIES", "entities must contain 1 to 160 definitions.");
    }
    var entities = rawEntities.map(entityDefinition);
    var entityById = new Map();
    entities.forEach(function (entity) {
      if (entityById.has(entity.id)) fail("DUPLICATE_ENTITY", "Duplicate entity " + entity.id + ".");
      entityById.set(entity.id, entity);
    });
    var groups = (Array.isArray(options.groups) ? options.groups : [])
      .map(function (group, index) {
        return groupDefinition(group, index, entityById);
      });
    var groupById = new Map();
    groups.forEach(function (group) {
      if (groupById.has(group.id)) fail("DUPLICATE_GROUP", "Duplicate group " + group.id + ".");
      groupById.set(group.id, group);
    });
    var vocabulary = record(options.vocabulary) ? options.vocabulary : {};
    var sourceTerms = normalizedList(
      vocabulary.sourceTerms,
      SOURCE_TERMS,
      "vocabulary.sourceTerms"
    );
    var performanceTerms = normalizedList(
      vocabulary.performanceTerms,
      PERFORMANCE_TERMS,
      "vocabulary.performanceTerms"
    );
    var lineagePhrases = normalizedList(
      vocabulary.lineagePhrases,
      LINEAGE_PHRASES,
      "vocabulary.lineagePhrases"
    );
    var sourceVerbs = normalizedList(
      vocabulary.sourceVerbs,
      SOURCE_VERBS,
      "vocabulary.sourceVerbs"
    );
    var aliasIndex = new Map();
    entities.forEach(function (entity) {
      entity.aliases.forEach(function (alias) {
        if (!aliasIndex.has(alias)) aliasIndex.set(alias, []);
        aliasIndex.get(alias).push(entity.id);
      });
    });
    var groupAliases = [];
    groups.forEach(function (group) {
      group.aliases.forEach(function (alias) {
        groupAliases.push({ alias: alias, groupId: group.id });
      });
    });
    groupAliases.sort(function (left, right) {
      return right.alias.length - left.alias.length ||
        left.alias.localeCompare(right.alias);
    });

    function resolveEntities(text) {
      var hits = [];
      var ambiguous = [];
      Array.from(aliasIndex.keys()).sort(function (left, right) {
        return right.length - left.length || left.localeCompare(right);
      }).forEach(function (alias) {
        if (!hasPhrase(text, alias)) return;
        var ids = aliasIndex.get(alias);
        if (ids.length > 1) {
          ambiguous.push({ alias: alias, entityIds: ids.slice().sort() });
          return;
        }
        hits.push({ alias: alias, entityId: ids[0] });
      });
      var byEntity = new Map();
      hits.forEach(function (hit) {
        var current = byEntity.get(hit.entityId);
        if (!current || hit.alias.length > current.alias.length) {
          byEntity.set(hit.entityId, hit);
        }
      });
      return {
        hits: Array.from(byEntity.values()).sort(function (left, right) {
          return left.entityId.localeCompare(right.entityId);
        }),
        ambiguous: ambiguous
      };
    }

    function resolveGroup(text) {
      var matches = groupAliases.filter(function (entry) {
        return hasPhrase(text, entry.alias);
      });
      if (!matches.length) return null;
      var longest = matches[0].alias.length;
      var ids = unique(matches.filter(function (entry) {
        return entry.alias.length === longest;
      }).map(function (entry) {
        return entry.groupId;
      }));
      return ids.length === 1 ? groupById.get(ids[0]) : { ambiguous: ids };
    }

    function exactContextEntities(context) {
      if (!record(context) || !Array.isArray(context.entityIds)) return [];
      var ids = unique(context.entityIds.map(function (id) {
        return clean(id, 160);
      }).filter(Boolean));
      if (!ids.length || ids.some(function (id) { return !entityById.has(id); })) {
        return [];
      }
      return ids.sort();
    }

    function unknownWords(text, entityHits, group) {
      var remainder = " " + text + " ";
      entityHits.forEach(function (hit) {
        remainder = remainder.replace(phrasePattern(hit.alias), " ");
      });
      if (group && !group.ambiguous) {
        group.aliases.forEach(function (alias) {
          remainder = remainder.replace(phrasePattern(alias), " ");
        });
      }
      sourceTerms.concat(performanceTerms, lineagePhrases, sourceVerbs).forEach(function (term) {
        remainder = remainder.replace(phrasePattern(term), " ");
      });
      return unique(normalize(remainder).split(" ").filter(function (word) {
        return word && !STOP_WORDS.has(word) &&
          ["stream", "streams", "livestream", "livestreams", "tape", "tapes",
            "receipt", "receipts", "clip", "clips", "bit", "bits", "moment",
            "moments", "performance", "performances", "appearance",
            "appearances", "chronological", "chronologically", "history",
            "bloodline", "timeline", "supercut", "oldest", "newest", "over",
            "change", "changed", "evolve", "evolved", "feature", "features",
            "featuring", "ranked", "highest", "largest", "greatest"].indexOf(word) < 0;
      }));
    }

    function route(query, context) {
      var original = clean(query, 1000);
      var text = normalize(original);
      if (!text) return null;
      var sourceHits = firstPhrases(text, sourceTerms);
      var performanceHits = firstPhrases(text, performanceTerms);
      var lineageHits = firstPhrases(text, lineagePhrases);
      var verbHits = firstPhrases(text, sourceVerbs);
      var relationVerbHits = verbHits.filter(function (term) {
        return !(term === "show" && /^show\b/.test(text));
      });
      var resolved = resolveEntities(text);
      var group = resolveGroup(text);
      var sourceCountGrammar =
        /\bhow many\b/.test(text) && sourceHits.length > 0 &&
        (performanceHits.length > 0 || relationVerbHits.length > 0);
      var sourceListGrammar =
        sourceHits.length > 0 && relationVerbHits.length > 0 &&
        /\b(?:which|what|show|list|find|give)\b/.test(text);
      var rankingGrammar =
        sourceHits.length > 0 &&
        /\b(?:most|highest|largest|greatest|top)\b/.test(text) &&
        (performanceHits.length > 0 || Boolean(group));
      var explicitPerformanceOrder =
        /\b(?:chronological|chronologically|oldest to newest|newest to oldest|oldest first|newest first)\b/.test(text) ||
        /\bin (?:date|chronological) order\b/.test(text);
      var orderedPerformanceGrammar =
        performanceHits.length > 0 &&
        /\b(?:all|every|complete|full)\b/.test(text) &&
        (explicitPerformanceOrder ||
          lineageHits.length > 0);
      var lineageGrammar = lineageHits.length > 0 ||
        (
          performanceHits.length > 0 &&
          /\b(?:change|changed|evolve|evolved)\b/.test(text) &&
          /\b(?:over time|across time|through the years|across the years)\b/.test(text)
        );
      var explicit = sourceCountGrammar || sourceListGrammar ||
        rankingGrammar || orderedPerformanceGrammar || lineageGrammar;
      if (!explicit) return null;

      var contextIds = resolved.hits.length ? [] : exactContextEntities(context);
      var entityIds = resolved.hits.length
        ? resolved.hits.map(function (hit) { return hit.entityId; })
        : contextIds;
      var matchedTerms = unique(sourceHits.concat(
        performanceHits,
        lineageHits,
        verbHits,
        resolved.hits.map(function (hit) { return hit.alias; }),
        group && !group.ambiguous ? group.aliases.filter(function (alias) {
          return hasPhrase(text, alias);
        }) : []
      )).sort();
      var unknown = unknownWords(text, resolved.hits, group);

      if (resolved.ambiguous.length || (group && group.ambiguous)) {
        return freezeDeep({
          schema: ROUTE_SCHEMA,
          version: VERSION,
          matched: true,
          status: "ambiguous-entity",
          mode: "held",
          answerShape: "held",
          matrix: null,
          matchedTerms: matchedTerms,
          entityIds: [],
          entityLabels: [],
          groupId: null,
          groupLabel: null,
          chronologyWarning: null,
          ambiguous: resolved.ambiguous.concat(
            group && group.ambiguous
              ? [{ alias: "group", entityIds: group.ambiguous.slice() }]
              : []
          )
        });
      }

      if (rankingGrammar && group && !group.ambiguous) {
        entityIds = group.entityIds.slice();
        unknown = [];
      }
      var hasConnector = /\b(?:and|both|all)\b/.test(text);
      if (!entityIds.length ||
          (unknown.length && (hasConnector || !resolved.hits.length))) {
        return freezeDeep({
          schema: ROUTE_SCHEMA,
          version: VERSION,
          matched: true,
          status: "unknown-entity",
          mode: "held",
          answerShape: "held",
          matrix: null,
          matchedTerms: matchedTerms,
          entityIds: entityIds.slice().sort(),
          entityLabels: entityIds.slice().sort().map(function (id) {
            return entityById.get(id).label;
          }),
          groupId: group && !group.ambiguous ? group.id : null,
          groupLabel: group && !group.ambiguous ? group.label : null,
          chronologyWarning: null,
          unknownTerms: unknown.length ? unknown : ["unresolved subject"]
        });
      }

      entityIds = unique(entityIds).sort();
      var labels = entityIds.map(function (id) {
        return entityById.get(id).label;
      });
      var mode;
      var answerShape;
      var quantifier = "any";
      var order = "source-date-asc";
      var chronologyWarning = null;
      if (rankingGrammar) {
        mode = "group-source-ranking";
        answerShape = "source-ranking";
        order = "receipt-count-desc";
      } else if (sourceListGrammar && (entityIds.length > 1 || hasConnector)) {
        mode = "source-entity-intersection";
        answerShape = sourceCountGrammar ? "source-count" : "source-list";
        quantifier = "all";
        order = "receipt-count-desc";
      } else if (sourceCountGrammar) {
        mode = entityIds.length > 1
          ? "source-entity-intersection"
          : "entity-source-count";
        answerShape = "source-count";
        quantifier = entityIds.length > 1 ? "all" : "any";
        order = entityIds.length > 1 ? "receipt-count-desc" : "source-date-asc";
      } else if (lineageGrammar) {
        mode = "entity-lineage";
        answerShape = "lineage";
        order = "source-date-asc";
        chronologyWarning =
          "Chronology reflects eligible receipts in the current index. It does not prove true origin, continuity, interaction, change, causality, or intent.";
      } else {
        mode = "entity-performance-chronology";
        answerShape = "performance-list";
        order = "source-date-asc";
        chronologyWarning =
          "Chronology reflects eligible receipts in the current index. It does not prove true origin, continuity, interaction, change, causality, or intent.";
      }

      var matrix = {
        schema: MATRIX_SCHEMA,
        entityIds: entityIds,
        quantifier: quantifier,
        order: order
      };
      return freezeDeep({
        schema: ROUTE_SCHEMA,
        version: VERSION,
        matched: true,
        status: "supported",
        mode: mode,
        answerShape: answerShape,
        matrix: matrix,
        matchedTerms: matchedTerms,
        entityIds: entityIds,
        entityLabels: labels,
        groupId: group && !group.ambiguous ? group.id : null,
        groupLabel: group && !group.ambiguous ? group.label : null,
        chronologyWarning: chronologyWarning
      });
    }

    return freezeDeep({
      engine: "SHOKKER RECEIPT MATRIX QUERY",
      version: VERSION,
      schema: ROUTE_SCHEMA,
      statuses: Object.keys(STATUS),
      entities: entities.map(function (entity) {
        return {
          id: entity.id,
          label: entity.label,
          type: entity.type,
          aliases: entity.aliases.slice()
        };
      }),
      groups: groups.map(function (group) {
        return {
          id: group.id,
          label: group.label,
          entityIds: group.entityIds.slice(),
          aliases: group.aliases.slice()
        };
      }),
      route: route
    });
  }

  Object.defineProperty(root, "ShokkerReceiptMatrixQuery", {
    value: freezeDeep({
      VERSION: VERSION,
      ROUTE_SCHEMA: ROUTE_SCHEMA,
      MATRIX_SCHEMA: MATRIX_SCHEMA,
      create: create
    }),
    enumerable: true,
    writable: false,
    configurable: false
  });
})(typeof window !== "undefined" ? window : globalThis);
