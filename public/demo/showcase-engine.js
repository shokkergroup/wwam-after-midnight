(function (root) {
  "use strict";

  var VERSION = "1.1.0";
  var POSITIVE_WORDS = [
    "love",
    "loved",
    "great",
    "best",
    "amazing",
    "perfect",
    "favorite",
    "beautiful",
    "awesome",
    "excellent"
  ];
  var NEGATIVE_WORDS = [
    "hate",
    "hated",
    "worst",
    "sucks",
    "sucked",
    "shitty",
    "terrible",
    "awful",
    "garbage",
    "bad"
  ];
  var COMEDY_CATEGORIES = new Set([
    "OUT OF POCKET",
    "BREAKDOWN",
    "BIT ENERGY",
    "THE ROOM BREAKS",
    "UP IN YA",
    "CHAT DID THIS",
    "FULL SEND"
  ]);
  var NEGATIVE_CATEGORIES = new Set(["FRANCHISE FELONY"]);
  var POSITIVE_CATEGORIES = new Set(["LOVE LETTER"]);

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

  function text(value) {
    return value == null ? "" : String(value);
  }

  function clean(value) {
    return text(value).replace(/\s+/g, " ").trim();
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
    return Array.from(new Set(values.filter(Boolean)));
  }

  function stableSort(values, compare) {
    return values
      .map(function (value, index) {
        return { value: value, index: index };
      })
      .sort(function (a, b) {
        return compare(a.value, b.value) || a.index - b.index;
      })
      .map(function (entry) {
        return entry.value;
      });
  }

  function newestFirst(a, b) {
    return (
      text(b.date).localeCompare(text(a.date)) ||
      text(a.sourceId || a.id).localeCompare(text(b.sourceId || b.id)) ||
      number(a.t) - number(b.t)
    );
  }

  function chronological(a, b) {
    return (
      text(a.date).localeCompare(text(b.date)) ||
      text(a.sourceId || a.id).localeCompare(text(b.sourceId || b.id)) ||
      number(a.t) - number(b.t) ||
      text(a.id).localeCompare(text(b.id))
    );
  }

  function words(value) {
    return clean(value).split(/\s+/).filter(Boolean);
  }

  function timestampUrl(url, seconds) {
    var base = clean(url);
    var t = Math.max(0, Math.floor(number(seconds)));
    if (!base) return "";
    if (!t) return base;
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + "t=" + t + "s";
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.floor(number(seconds)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = total % 60;
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0")
      : minutes + ":" + String(secs).padStart(2, "0");
  }

  function fingerprint(value) {
    var source = text(value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function asStreams(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    return array(data.streams).length
      ? data.streams
      : array(data.items).length
        ? data.items
        : array(data.popular);
  }

  function parseArguments(catalog, deep, live, popular, characters, dna) {
    if (
      catalog &&
      !Array.isArray(catalog) &&
      typeof catalog === "object" &&
      ("catalog" in catalog ||
        "deep" in catalog ||
        "live" in catalog ||
        "popular" in catalog ||
        "characters" in catalog)
    ) {
      return {
        catalog: array(catalog.catalog),
        deep: catalog.deep || {},
        live: catalog.live || {},
        popular: catalog.popular || {},
        characters: catalog.characters || {},
        dna: catalog.dna || root.WWAM_CHANNEL_DNA || {}
      };
    }
    return {
      catalog: array(catalog),
      deep: deep || {},
      live: live || {},
      popular: popular || {},
      characters: characters || {},
      dna: dna || root.WWAM_CHANNEL_DNA || {}
    };
  }

  function sourceFromStream(stream, lane) {
    var source = stream || {};
    return {
      id: clean(source.id || source.videoId),
      type: "livestream",
      lane: lane,
      lanes: [lane],
      title: clean(source.title || source.name),
      date: clean(source.date || source.uploadDate || source.publishedAt),
      duration: number(source.duration || source.durationSeconds),
      views: number(source.views || source.viewCount),
      thumbnail: clean(source.thumbnail),
      url: clean(source.url) || (source.id ? "https://www.youtube.com/watch?v=" + source.id : ""),
      captioned: source.captioned !== false && source.transcript !== false,
      wordsAudited: number(source.wordsAudited || source.words),
      summary: clean(source.summary || source.synopsis),
      topics: array(source.topics || source.chapters),
      moments: array(source.moments || source.highlights || source.soundbytes),
      heatmap: array(source.heatmap),
      peak: source.peak || null,
      raw: source
    };
  }

  function normalizeSources(input) {
    var catalogById = new Map(
      input.catalog.map(function (item) {
        return [clean(item.id), item];
      })
    );
    var deepById = new Map(
      array(input.deep.tapes).map(function (item) {
        return [clean(item.id), item];
      })
    );
    var sources = new Map();

    input.catalog.forEach(function (item) {
      var tape = deepById.get(clean(item.id)) || {};
      var source = {
        id: clean(item.id),
        type: "commentary",
        lane: "commentary",
        lanes: ["commentary"],
        title: clean(item.title),
        date: clean(item.date),
        duration: number(item.duration),
        views: number(item.views),
        thumbnail: clean(item.thumbnail),
        url: clean(item.url),
        captioned: item.transcript !== false,
        wordsAudited: number(tape.wordsAudited),
        summary: clean(tape.verdict),
        franchise: clean(item.franchise),
        film: clean(item.film),
        order: number(item.order),
        metrics: tape.metrics || {},
        moments: array(tape.moments),
        heatmap: array(tape.arc),
        unhinged: number(tape.unhinged),
        raw: item
      };
      if (source.id) sources.set(source.id, source);
    });

    array(input.deep.tapes).forEach(function (tape) {
      var id = clean(tape.id);
      if (!id || sources.has(id)) return;
      var catalogItem = catalogById.get(id) || {};
      sources.set(id, {
        id: id,
        type: "commentary",
        lane: "commentary",
        lanes: ["commentary"],
        title: clean(catalogItem.title || tape.title || id),
        date: clean(catalogItem.date || tape.date),
        duration: number(catalogItem.duration || tape.duration),
        views: number(catalogItem.views || tape.views),
        thumbnail: clean(catalogItem.thumbnail || tape.thumbnail),
        url:
          clean(catalogItem.url || tape.url) ||
          "https://www.youtube.com/watch?v=" + encodeURIComponent(id),
        captioned: tape.captioned !== false,
        wordsAudited: number(tape.wordsAudited),
        summary: clean(tape.verdict),
        franchise: clean(catalogItem.franchise || tape.franchise),
        film: clean(catalogItem.film || tape.film),
        order: number(catalogItem.order || tape.order),
        metrics: tape.metrics || {},
        moments: array(tape.moments),
        heatmap: array(tape.arc),
        unhinged: number(tape.unhinged),
        raw: tape
      });
    });

    [
      { data: input.live, lane: "fresh-live" },
      { data: input.popular, lane: "popular-live" }
    ].forEach(function (group) {
      asStreams(group.data).forEach(function (stream) {
        var incoming = sourceFromStream(stream, group.lane);
        if (!incoming.id) return;
        var existing = sources.get(incoming.id);
        if (existing) {
          existing.lanes = unique(existing.lanes.concat(incoming.lanes));
          if (existing.lane !== "fresh-live" && group.lane === "fresh-live") {
            existing.lane = "fresh-live";
          }
          if ((!existing.moments || !existing.moments.length) && incoming.moments.length) {
            existing.moments = incoming.moments;
          }
          if ((!existing.topics || !existing.topics.length) && incoming.topics.length) {
            existing.topics = incoming.topics;
          }
          if ((!existing.heatmap || !existing.heatmap.length) && incoming.heatmap.length) {
            existing.heatmap = incoming.heatmap;
          }
          if (!existing.wordsAudited && incoming.wordsAudited) existing.wordsAudited = incoming.wordsAudited;
          if (!existing.summary && incoming.summary) existing.summary = incoming.summary;
          if (!existing.peak && incoming.peak) existing.peak = incoming.peak;
          return;
        }
        sources.set(incoming.id, incoming);
      });
    });

    return stableSort(Array.from(sources.values()), function (a, b) {
      return text(a.id).localeCompare(text(b.id));
    });
  }

  function explicitCharacterReceipts(characterData) {
    var data = characterData || {};
    var results = [];

    array(data.receipts || data.performances).forEach(function (receipt) {
      results.push(Object.assign({}, receipt));
    });
    array(data.characters).forEach(function (character) {
      array(
        character.receipts ||
          character.performances ||
          character.soundbytes ||
          character.moments
      ).forEach(
        function (receipt) {
          var rawCharacterId = clean(character.id || character.slug);
          var provenance = receipt.provenance || {};
          var timestampValidatedCandidate =
            clean(provenance.timestampStatus) === "exact-caption-event" &&
            normalized(provenance.selection).indexOf("human curated") >= 0;
          results.push(
            Object.assign(
              {
                characterId: rawCharacterId.indexOf("character:") === 0
                  ? rawCharacterId
                  : "character:" + slug(rawCharacterId || character.label || character.name),
                character: character.label || character.name,
                performer: character.performer || character.performedBy,
                evidenceLevel:
                  receipt.evidenceLevel ||
                  (timestampValidatedCandidate ? "curated-candidate" : "machine"),
                curationStatus:
                  receipt.curationStatus ||
                  (timestampValidatedCandidate
                    ? "timestamp-validated-human-curated-candidate"
                    : "unreviewed-candidate")
              },
              receipt
            )
          );
        }
      );
    });
    array(data.bits).forEach(function (bit) {
      array(bit.receipts || bit.moments).forEach(function (receipt) {
        results.push(
          Object.assign(
            {
              bitId: bit.id,
              bit: bit.label || bit.name,
              characterId: bit.characterId
            },
            receipt
          )
        );
      });
    });
    return results;
  }

  function inferSentiment(category, excerpt, allowLexical) {
    var label = clean(category).toUpperCase();
    if (POSITIVE_CATEGORIES.has(label)) return { label: "positive", confidence: 0.96 };
    if (NEGATIVE_CATEGORIES.has(label)) return { label: "negative", confidence: 0.96 };

    if (!allowLexical) return { label: "neutral", confidence: 0 };
    var body = " " + normalized(excerpt) + " ";
    var positive = POSITIVE_WORDS.reduce(function (count, word) {
      return count + (body.indexOf(" " + word + " ") >= 0 ? 1 : 0);
    }, 0);
    var negative = NEGATIVE_WORDS.reduce(function (count, word) {
      return count + (body.indexOf(" " + word + " ") >= 0 ? 1 : 0);
    }, 0);
    if (positive === negative) return { label: "neutral", confidence: 0 };
    return {
      label: positive > negative ? "positive" : "negative",
      confidence: clamp(0.55 + Math.abs(positive - negative) * 0.1, 0, 0.85)
    };
  }

  function receiptId(sourceId, type, seconds, label, index) {
    return [
      clean(sourceId) || "unknown-source",
      slug(type),
      Math.floor(number(seconds)),
      slug(label),
      number(index)
    ].join(":");
  }

  function normalizeReceipts(sources, input) {
    var sourceById = new Map(
      sources.map(function (source) {
        return [source.id, source];
      })
    );
    var receipts = [];

    sources.forEach(function (source) {
      array(source.moments).forEach(function (moment, index) {
        var t = number(moment.t || moment.time || moment.timestamp);
        var category = clean(moment.category || moment.signal || moment.type || "MOMENT").toUpperCase();
        var excerpt = clean(moment.quote || moment.excerpt || moment.text || moment.receipt);
        if (!excerpt) return;
        var score = clamp(moment.score || moment.heat || moment.rank || 50, 0, 100);
        var sentiment = moment.sentiment
          ? {
              label: clean(moment.sentiment).toLowerCase(),
              confidence: clamp(moment.sentimentConfidence || 0.8, 0, 1)
            }
          : inferSentiment(category, excerpt, false);
        receipts.push({
          id: clean(moment.id) || receiptId(source.id, "moment", t, category, index),
          sourceId: source.id,
          sourceType: source.type,
          sourceLane: source.lane,
          sourceLanes: source.lanes.slice(),
          sourceTitle: source.title,
          date: source.date,
          t: t,
          timecode: formatTime(t),
          url: timestampUrl(source.url, t),
          type: "moment",
          category: category,
          excerpt: excerpt,
          score: score,
          sentiment: sentiment.label,
          sentimentConfidence: sentiment.confidence,
          evidenceLevel: clean(moment.evidenceLevel || moment.status || "machine"),
          entityIds: [],
          wordCount: words(excerpt).length
        });
      });

      array(source.topics).forEach(function (topic, index) {
        var name = clean(topic.name || topic.topic || topic.label);
        if (!name) return;
        var t = number(topic.peak || topic.first || topic.t || topic.timestamp);
        var excerpt = clean(topic.receipt || topic.quote || topic.excerpt);
        receipts.push({
          id: receiptId(source.id, "topic", t, name, index),
          sourceId: source.id,
          sourceType: source.type,
          sourceLane: source.lane,
          sourceLanes: source.lanes.slice(),
          sourceTitle: source.title,
          date: source.date,
          t: t,
          timecode: formatTime(t),
          url: timestampUrl(source.url, t),
          type: "topic-chapter",
          category: "TOPIC: " + name.toUpperCase(),
          excerpt: excerpt,
          score: clamp(45 + Math.log2(1 + number(topic.mentions || topic.cluster)) * 8, 0, 94),
          sentiment: inferSentiment("", excerpt, true),
          sentimentConfidence: inferSentiment("", excerpt, true).confidence,
          topic: name,
          mentions: number(topic.mentions),
          evidenceLevel: clean(topic.evidenceLevel || topic.status || "machine"),
          entityIds: [],
          wordCount: words(excerpt).length
        });
        var last = receipts[receipts.length - 1];
        if (last.sentiment && typeof last.sentiment === "object") {
          last.sentiment = last.sentiment.label;
        }
      });
    });

    explicitCharacterReceipts(input.characters).forEach(function (item, index) {
      var sourceId = clean(item.sourceId || item.videoId || item.id);
      var source = sourceById.get(sourceId);
      if (!source) return;
      var t = number(item.t || item.time || item.timestamp || item.seconds);
      var excerpt = clean(item.quote || item.excerpt || item.text);
      if (!excerpt) return;
      var rawCharacterId = clean(item.characterId) || slug(item.character);
      var characterId =
        rawCharacterId.indexOf("character:") === 0
          ? rawCharacterId
          : "character:" + slug(rawCharacterId);
      var configuredBit = array(input.dna.bitDefinitions).find(function (bit) {
        return bit.characterId === characterId;
      });
      var bitId =
        clean(item.bitId) ||
        (item.bit ? "bit:" + slug(item.bit) : configuredBit ? configuredBit.id : "");
      receipts.push({
        id:
          clean(item.receiptId) ||
          (item.id ? "character-receipt:" + slug(item.id) : "") ||
          receiptId(source.id, "character", t, characterId, index),
        sourceId: source.id,
        sourceType: source.type,
        sourceLane: source.lane,
        sourceLanes: source.lanes.slice(),
        sourceTitle: source.title,
        date: source.date,
        t: t,
        timecode: formatTime(t),
        url: timestampUrl(source.url, t),
        type: "character-performance",
        category: clean(item.category || "CHARACTER PERFORMANCE").toUpperCase(),
        excerpt: excerpt,
        score: clamp(item.score || item.heat || 72, 0, 100),
        sentiment: "neutral",
        sentimentConfidence: 0,
        evidenceLevel: clean(item.evidenceLevel || "machine"),
        curationStatus: clean(item.curationStatus),
        authenticatedEditorVerified: item.authenticatedEditorVerified === true,
        characterId: characterId,
        bitId: bitId,
        performer: clean(item.performer),
        entityIds: unique([characterId, bitId]),
        wordCount: words(excerpt).length
      });
    });

    return stableSort(receipts, chronological);
  }

  function addEntity(map, entity) {
    if (!entity || !clean(entity.id)) return;
    var id = clean(entity.id);
    var existing = map.get(id);
    if (existing) {
      existing.aliases = unique(array(existing.aliases).concat(array(entity.aliases)));
      return;
    }
    map.set(id, {
      id: id,
      type: clean(entity.type || id.split(":")[0] || "topic"),
      label: clean(entity.label || entity.name || id),
      aliases: unique(
        array(entity.aliases)
          .concat([entity.label, entity.name])
          .map(normalized)
      ),
      performer: clean(entity.performer),
      performerStatus: clean(entity.performerStatus),
      characterId: clean(entity.characterId),
      editorial: Boolean(entity.editorial)
    });
  }

  function hasAlias(body, aliases) {
    var haystack = " " + normalized(body) + " ";
    return array(aliases).some(function (alias) {
      var needle = normalized(alias);
      return needle && haystack.indexOf(" " + needle + " ") >= 0;
    });
  }

  function buildEntities(sources, receipts, input) {
    var entities = new Map();
    var dna = input.dna || {};

    array(dna.entities).forEach(function (entity) {
      addEntity(entities, Object.assign({ editorial: true }, entity));
    });
    array(dna.characters).forEach(function (entity) {
      addEntity(
        entities,
        Object.assign({ type: "character", editorial: true }, entity)
      );
    });
    array(input.characters && input.characters.characters).forEach(function (entity) {
      var rawId = clean(entity.id || entity.slug || entity.name);
      addEntity(entities, {
        id:
          rawId.indexOf("character:") === 0
            ? rawId
            : "character:" + slug(rawId),
        type: "character",
        label: entity.label || entity.name,
        aliases: entity.aliases,
        performer: entity.performer || entity.performedBy,
        performerStatus:
          entity.performerStatus ||
          (entity.hostAttribution && entity.hostAttribution.status) ||
          "",
        editorial: true
      });
    });
    array(dna.bitDefinitions).forEach(function (entity) {
      addEntity(
        entities,
        Object.assign({ type: "bit", editorial: true }, entity)
      );
    });

    sources.forEach(function (source) {
      addEntity(entities, {
        id: "source:" + source.id,
        type: "source",
        label: source.title || source.id
      });
      if (source.franchise) {
        addEntity(entities, {
          id: "franchise:" + slug(source.franchise),
          type: "franchise",
          label: source.franchise,
          aliases: [source.franchise]
        });
      }
      if (source.film) {
        addEntity(entities, {
          id: "film:" + slug(source.film),
          type: "film",
          label: source.film,
          aliases: [source.film]
        });
      }
      array(source.topics).forEach(function (topic) {
        var name = clean(topic.name || topic.topic || topic.label);
        if (name) {
          addEntity(entities, {
            id: "topic:" + slug(name),
            type: "topic",
            label: name,
            aliases: [name]
          });
        }
      });
    });

    var searchable = Array.from(entities.values()).filter(function (entity) {
      return entity.type !== "source" && entity.type !== "bit";
    });
    var bits = array(dna.bitDefinitions);

    receipts.forEach(function (receipt) {
      var source = sources.find(function (candidate) {
        return candidate.id === receipt.sourceId;
      });
      var ids = array(receipt.entityIds).slice();
      ids.push("source:" + receipt.sourceId);
      if (source && source.franchise) ids.push("franchise:" + slug(source.franchise));
      if (source && source.film) ids.push("film:" + slug(source.film));
      if (receipt.topic) ids.push("topic:" + slug(receipt.topic));

      searchable.forEach(function (entity) {
        if (hasAlias(receipt.excerpt, entity.aliases)) ids.push(entity.id);
      });
      bits.forEach(function (bit) {
        var requirements = array(bit.requireAny).length ? bit.requireAny : bit.aliases;
        if (
          (receipt.type === "character-performance" || receipt.category === "BIT ENERGY") &&
          hasAlias(receipt.excerpt, requirements)
        ) {
          ids.push(bit.id);
          if (bit.characterId) ids.push(bit.characterId);
        }
      });
      receipt.entityIds = unique(ids).sort();
    });

    return entities;
  }

  function buildGraph(sources, receipts, entityMap, input) {
    var edgeMap = new Map();
    var activeEntityIds = new Set();

    function edge(from, relationship, to, receiptIdValue, basis) {
      if (!from || !to || from === to) return;
      var key = from + "|" + relationship + "|" + to;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          id: "edge:" + fingerprint(key),
          from: from,
          relationship: relationship,
          to: to,
          receiptIds: [],
          basis: basis || "timestamped-receipt"
        });
      }
      if (receiptIdValue) edgeMap.get(key).receiptIds.push(receiptIdValue);
      activeEntityIds.add(from);
      activeEntityIds.add(to);
    }

    receipts.forEach(function (receipt) {
      var sourceNode = "source:" + receipt.sourceId;
      activeEntityIds.add(sourceNode);
      receipt.entityIds.forEach(function (entityId) {
        if (entityId !== sourceNode) {
          edge(sourceNode, "MENTIONS", entityId, receipt.id);
        }
      });
    });

    sources.forEach(function (source) {
      if (source.film && source.franchise) {
        var film = "film:" + slug(source.film);
        var franchise = "franchise:" + slug(source.franchise);
        var evidence = receipts.find(function (receipt) {
          return receipt.sourceId === source.id;
        });
        if (evidence) edge(film, "PART_OF", franchise, evidence.id);
      }
    });

    array(input.dna.bitDefinitions).forEach(function (bit) {
      if (!bit.characterId) return;
      var evidence = receipts.filter(function (receipt) {
        return (
          receipt.type === "character-performance" &&
          receipt.entityIds.indexOf(bit.id) >= 0
        );
      });
      evidence.forEach(function (receipt) {
        edge(bit.id, "PERFORMS_AS", bit.characterId, receipt.id);
      });
    });

    var edges = stableSort(Array.from(edgeMap.values()), function (a, b) {
      return a.id.localeCompare(b.id);
    }).map(function (item) {
      item.receiptIds = unique(item.receiptIds).sort();
      item.weight = item.receiptIds.length;
      return item;
    });
    var nodes = stableSort(
      Array.from(entityMap.values()).filter(function (entity) {
        return activeEntityIds.has(entity.id);
      }),
      function (a, b) {
        return a.id.localeCompare(b.id);
      }
    ).map(function (entity) {
      var receiptCount = receipts.filter(function (receipt) {
        return receipt.entityIds.indexOf(entity.id) >= 0;
      }).length;
      return Object.assign({}, entity, { receiptCount: receiptCount });
    });

    return {
      nodes: nodes,
      edges: edges,
      stats: {
        nodes: nodes.length,
        edges: edges.length,
        receipts: receipts.length,
        connectedReceipts: receipts.filter(function (receipt) {
          return receipt.entityIds.length > 1;
        }).length
      }
    };
  }

  function entityLookup(graph) {
    return new Map(
      graph.nodes.map(function (node) {
        return [node.id, node];
      })
    );
  }

  function buildTimeMachines(receipts, graph, minimum) {
    var lookup = entityLookup(graph);
    var grouped = new Map();
    receipts.forEach(function (receipt) {
      if (receipt.sentiment === "neutral") return;
      receipt.entityIds.forEach(function (entityId) {
        var entity = lookup.get(entityId);
        if (!entity || ["source", "bit", "character", "person"].indexOf(entity.type) >= 0) return;
        if (!grouped.has(entityId)) grouped.set(entityId, []);
        grouped.get(entityId).push(receipt);
      });
    });

    var machines = [];
    grouped.forEach(function (items, entityId) {
      var timeline = stableSort(items, chronological);
      if (timeline.length < minimum) return;
      var movements = [];
      for (var index = 1; index < timeline.length; index += 1) {
        if (timeline[index - 1].sentiment !== timeline[index].sentiment) {
          movements.push({
            from: timeline[index - 1].sentiment,
            to: timeline[index].sentiment,
            beforeReceiptId: timeline[index - 1].id,
            afterReceiptId: timeline[index].id,
            date: timeline[index].date,
            inference: true
          });
        }
      }
      var recent = timeline.slice(-3);
      var positive = recent.filter(function (item) {
        return item.sentiment === "positive";
      }).length;
      var negative = recent.length - positive;
      var apparent =
        positive === negative ? "mixed" : positive > negative ? "positive" : "negative";
      var entity = lookup.get(entityId);
      machines.push({
        id: "timeline:" + slug(entityId),
        subjectId: entityId,
        subject: entity.label,
        subjectType: entity.type,
        receipts: timeline.map(function (item) {
          return item.id;
        }),
        milestones: timeline.map(function (item) {
          return {
            date: item.date,
            sentiment: item.sentiment,
            confidence: item.sentimentConfidence,
            receiptId: item.id,
            sourceId: item.sourceId,
            t: item.t,
            url: item.url
          };
        }),
        movements: movements,
        apparentCurrentPosition: apparent,
        positionBasis: recent.map(function (item) {
          return item.id;
        }),
        inference: true,
        caution:
          "Sentiment is an evidence-based index of available excerpts, not a claim about either host's private opinion."
      });
    });

    return stableSort(machines, function (a, b) {
      return (
        b.movements.length - a.movements.length ||
        b.receipts.length - a.receipts.length ||
        a.subject.localeCompare(b.subject)
      );
    });
  }

  function buildBitAncestry(receipts, input, graph) {
    var lookup = entityLookup(graph);
    return stableSort(
      array(input.dna.bitDefinitions)
        .map(function (bit) {
          var matches = stableSort(
            receipts.filter(function (receipt) {
              return (
                receipt.type === "character-performance" &&
                receipt.entityIds.indexOf(bit.id) >= 0
              );
            }),
            chronological
          );
          if (!matches.length) return null;
          var sources = unique(
            matches.map(function (receipt) {
              return receipt.sourceId;
            })
          );
          var character = lookup.get(bit.characterId);
          return {
            id: "ancestry:" + slug(bit.id),
            bitId: bit.id,
            label: bit.label,
            characterId: bit.characterId || "",
            character: character ? character.label : "",
            origin: {
              receiptId: matches[0].id,
              sourceId: matches[0].sourceId,
              date: matches[0].date,
              t: matches[0].t,
              url: matches[0].url
            },
            appearances: matches.length,
            sourceCount: sources.length,
            sourceIds: sources,
            callbacks: matches.slice(1).map(function (receipt) {
              return receipt.id;
            }),
            performances: matches.map(function (receipt) {
              return {
                receiptId: receipt.id,
                sourceId: receipt.sourceId,
                date: receipt.date,
                t: receipt.t,
                url: receipt.url,
                evidenceLevel: receipt.evidenceLevel,
                curationStatus: receipt.curationStatus || "",
                authenticatedEditorVerified:
                  receipt.authenticatedEditorVerified === true
              };
            }),
            latestReceiptId: matches[matches.length - 1].id,
            evidenceLevel:
              matches.filter(function (receipt) {
                return receipt.evidenceLevel === "creator";
              }).length > 0
                ? "creator"
                  : matches.filter(function (receipt) {
                      return (
                        receipt.evidenceLevel === "editor" &&
                        receipt.authenticatedEditorVerified === true
                      );
                    }).length > 0
                  ? "editor"
                  : matches.filter(function (receipt) {
                        return receipt.evidenceLevel === "curated-candidate";
                      }).length > 0
                    ? "curated-candidate"
                    : "machine",
            caution:
              "Origin means earliest known receipt in the indexed corpus, not necessarily the first time the bit was ever performed."
          };
        })
        .filter(Boolean),
      function (a, b) {
        return (
          b.sourceCount - a.sourceCount ||
          b.appearances - a.appearances ||
          a.label.localeCompare(b.label)
        );
      }
    );
  }

  function chemistryLabel(score, dna) {
    var labels = array(dna.riffChemistry && dna.riffChemistry.labels);
    var found = labels.find(function (item) {
      return score >= number(item.min);
    });
    return found ? itemLabel(found) : score >= 80 ? "FULL MIDNIGHT EVENT" : "RIFF CHAIN ACTIVE";
  }

  function itemLabel(item) {
    return clean(item.label);
  }

  function chemistryFor(receipt, dna) {
    var category = receipt.category;
    var body = normalized(receipt.excerpt);
    var bitCount = receipt.entityIds.filter(function (id) {
      return id.indexOf("bit:") === 0;
    }).length;
    var subjectCount = receipt.entityIds.filter(function (id) {
      return (
        id.indexOf("film:") === 0 ||
        id.indexOf("franchise:") === 0 ||
        id.indexOf("topic:") === 0
      );
    }).length;
    var heat = clamp(receipt.score, 0, 100);
    var escalation = clamp(
      heat * 0.62 +
        (["BREAKDOWN", "FULL SEND", "TAKE GETS NUCLEAR", "THE ROOM BREAKS"].indexOf(category) >= 0
          ? 28
          : 8),
      0,
      100
    );
    var callbackDensity = clamp(
      bitCount * 42 +
        (category === "BIT ENERGY" ? 46 : 0) +
        (/\b(again|callback|remember|every time|always)\b/.test(body) ? 24 : 0),
      0,
      100
    );
    var derailment = clamp(
      (["OUT OF POCKET", "UP IN YA", "CHAT DID THIS", "THE ROOM BREAKS"].indexOf(category) >= 0
        ? 70
        : 12) +
        Math.max(0, heat - 70),
      0,
      100
    );
    var roomBreak = clamp(
      (category === "THE ROOM BREAKS" || /\b(laughing|laughter|can t breathe)\b/.test(body)
        ? 80
        : category === "BREAKDOWN"
          ? 62
          : 10) +
        Math.max(0, heat - 84),
      0,
      100
    );
    var topicCollision = clamp(Math.max(0, subjectCount - 1) * 34, 0, 100);
    var dimensions = {
      heat: Math.round(heat),
      escalation: Math.round(escalation),
      callbackDensity: Math.round(callbackDensity),
      derailment: Math.round(derailment),
      roomBreak: Math.round(roomBreak),
      topicCollision: Math.round(topicCollision)
    };
    var weights = Object.assign(
      {
        heat: 0.28,
        escalation: 0.2,
        callbackDensity: 0.16,
        derailment: 0.16,
        roomBreak: 0.14,
        topicCollision: 0.06
      },
      (dna.riffChemistry && dna.riffChemistry.weights) || {}
    );
    var overall = Math.round(
      Object.keys(dimensions).reduce(function (sum, key) {
        return sum + dimensions[key] * number(weights[key]);
      }, 0)
    );
    return {
      receiptId: receipt.id,
      sourceId: receipt.sourceId,
      date: receipt.date,
      t: receipt.t,
      url: receipt.url,
      category: receipt.category,
      score: clamp(overall, 0, 100),
      label: chemistryLabel(overall, dna),
      dimensions: dimensions,
      basis: {
        sourceHeat: receipt.score,
        matchedBits: bitCount,
        indexedSubjects: subjectCount,
        category: receipt.category
      }
    };
  }

  function buildRiffChemistry(receipts, sources, input) {
    var moments = stableSort(
      receipts
        .filter(function (receipt) {
          return COMEDY_CATEGORIES.has(receipt.category) || receipt.type === "character-performance";
        })
        .map(function (receipt) {
          return chemistryFor(receipt, input.dna);
        }),
      function (a, b) {
        return b.score - a.score || a.receiptId.localeCompare(b.receiptId);
      }
    );
    var bySource = new Map();
    moments.forEach(function (moment) {
      if (!bySource.has(moment.sourceId)) bySource.set(moment.sourceId, []);
      bySource.get(moment.sourceId).push(moment);
    });
    var profiles = stableSort(
      Array.from(bySource.entries()).map(function (entry) {
        var source = sources.find(function (candidate) {
          return candidate.id === entry[0];
        });
        var scores = entry[1].map(function (item) {
          return item.score;
        });
        return {
          sourceId: entry[0],
          title: source ? source.title : entry[0],
          lane: source ? source.lane : "",
          moments: scores.length,
          peak: Math.max.apply(Math, scores),
          average: Math.round(
            scores.reduce(function (sum, score) {
              return sum + score;
            }, 0) / scores.length
          ),
          topReceiptId: entry[1][0].receiptId
        };
      }),
      function (a, b) {
        return b.peak - a.peak || b.average - a.average || a.sourceId.localeCompare(b.sourceId);
      }
    );
    var receiptById = new Map(
      receipts.map(function (receipt) {
        return [receipt.id, receipt];
      })
    );
    var rankings = profiles.map(function (profile) {
      var top = moments.find(function (moment) {
        return moment.receiptId === profile.topReceiptId;
      });
      var receipt = top ? receiptById.get(top.receiptId) : null;
      return {
        title: profile.title,
        source: receipt ? receipt.sourceType : "livestream",
        sourceId: profile.sourceId,
        score: profile.peak,
        average: profile.average,
        escalation: top ? top.dimensions.escalation : 0,
        callbacks: top ? top.dimensions.callbackDensity : 0,
        roomBreaks: top ? top.dimensions.roomBreak : 0,
        peak: receipt
          ? {
              receiptId: receipt.id,
              sourceId: receipt.sourceId,
              t: receipt.t,
              at: receipt.t,
              url: receipt.url,
              excerpt: receipt.excerpt,
              category: receipt.category
            }
          : null
      };
    });
    return {
      formula:
        "28% source heat + 20% escalation + 16% callback density + 16% derailment + 14% room break + 6% topic collision",
      caution:
        "This ranks observable transcript and category signals. It does not pretend humor is objectively measurable.",
      moments: moments,
      sourceProfiles: profiles,
      rankings: rankings
    };
  }

  function receiptMap(showcase) {
    return new Map(
      array(showcase.receipts).map(function (receipt) {
        return [receipt.id, receipt];
      })
    );
  }

  function presentReceipt(showcase, receipt, additions) {
    if (!receipt) return null;
    var source = array(showcase.sources).find(function (candidate) {
      return candidate.id === receipt.sourceId;
    });
    return Object.assign(
      {
        receiptId: receipt.id,
        id: receipt.sourceId,
        sourceId: receipt.sourceId,
        source: receipt.sourceType,
        sourceType: receipt.sourceType,
        at: receipt.t,
        t: receipt.t,
        url: receipt.url,
        title: receipt.sourceTitle || (source && source.title) || receipt.sourceId,
        date: receipt.date || (source && source.date) || "",
        category: receipt.category,
        excerpt: receipt.excerpt,
        quote: receipt.excerpt,
        score: receipt.score,
        sentiment: receipt.sentiment,
        evidenceLevel: receipt.evidenceLevel
      },
      additions || {}
    );
  }

  function buildDescent(showcase, options) {
    var config =
      typeof options === "string" ? { query: options } : Object.assign({}, options || {});
    var query = normalized(config.query || config.topic || "");
    var entityId = clean(config.entityId);
    var lane = clean(config.lane);
    var requestedMode = clean(config.mode || "spiral");
    var theme = requestedMode.toUpperCase();
    var mode =
      theme === "CHAOS" || theme === "GRUDGES" || theme === "LOVE"
        ? "instant"
        : theme === "LORE"
          ? "chronological"
          : requestedMode.toLowerCase();
    var limit = clamp(
      config.limit || (config.minutes ? Math.round(number(config.minutes) / 3) : 8),
      1,
      25
    );
    var chemistryByReceipt = new Map(
      array(showcase.riffChemistry && showcase.riffChemistry.moments).map(function (moment) {
        return [moment.receiptId, moment];
      })
    );
    var themedCategories =
      theme === "GRUDGES"
        ? ["FRANCHISE FELONY", "TAKE GETS NUCLEAR"]
        : theme === "LOVE"
          ? ["LOVE LETTER"]
          : theme === "LORE"
            ? ["HORROR BRAIN", "THEORY BOARD", "BIT ENERGY", "CHARACTER PERFORMANCE"]
            : [];
    var candidates = array(showcase.receipts)
      .map(function (receipt) {
        var chemistry = chemistryByReceipt.get(receipt.id);
        return {
          chemistry:
            chemistry ||
            {
              receiptId: receipt.id,
              score: receipt.score,
              dimensions: {
                heat: receipt.score,
                escalation: receipt.score,
                callbackDensity: 0,
                derailment: 0,
                roomBreak: 0,
                topicCollision: 0
              }
            },
          receipt: receipt
        };
      })
      .filter(function (item) {
        if (!item.receipt) return false;
        if (
          themedCategories.length &&
          themedCategories.indexOf(item.receipt.category) < 0 &&
          !(theme === "LORE" && item.receipt.type === "character-performance")
        ) {
          return false;
        }
        if (
          !themedCategories.length &&
          !chemistryByReceipt.has(item.receipt.id)
        ) {
          return false;
        }
        if (lane && item.receipt.sourceLanes.indexOf(lane) < 0) return false;
        if (entityId && item.receipt.entityIds.indexOf(entityId) < 0) return false;
        if (
          query &&
          normalized(
            item.receipt.excerpt +
              " " +
              item.receipt.category +
              " " +
              item.receipt.sourceTitle +
              " " +
              item.receipt.entityIds.join(" ")
          ).indexOf(query) < 0
        ) {
          return false;
        }
        return true;
      });

    var ordered = stableSort(candidates, function (a, b) {
      if (mode === "chronological") return chronological(a.receipt, b.receipt);
      if (mode === "instant") {
        return (
          b.chemistry.score - a.chemistry.score ||
          a.chemistry.receiptId.localeCompare(b.chemistry.receiptId)
        );
      }
      return (
        a.chemistry.score - b.chemistry.score ||
        a.chemistry.receiptId.localeCompare(b.chemistry.receiptId)
      );
    });

    var selected = [];
    var sourceUse = new Map();
    ordered.forEach(function (item) {
      if (selected.length >= limit) return;
      var used = number(sourceUse.get(item.receipt.sourceId));
      if (used >= 2 && ordered.length > limit) return;
      selected.push(item);
      sourceUse.set(item.receipt.sourceId, used + 1);
    });
    if (selected.length < limit) {
      ordered.forEach(function (item) {
        if (selected.length >= limit || selected.indexOf(item) >= 0) return;
        selected.push(item);
      });
    }

    return {
      id:
        "descent:" +
        fingerprint([query, entityId, lane, mode, limit, selected.map(function (item) {
          return item.receipt.id;
        })].join("|")),
      query: clean(config.query || config.topic),
      entityId: entityId,
      lane: lane,
      mode: requestedMode,
      ordering: mode,
      minutes: number(config.minutes),
      count: selected.length,
      estimatedRuntimeSeconds: selected.length * number(config.clipSeconds || 45, 45),
      receiptIds: selected.map(function (item) {
        return item.receipt.id;
      }),
      stops: selected.map(function (item, index) {
        return {
          order: index + 1,
          receiptId: item.receipt.id,
          sourceId: item.receipt.sourceId,
          t: item.receipt.t,
          url: item.receipt.url,
          category: item.receipt.category,
          chemistry: item.chemistry.score,
          phase:
            mode === "spiral"
              ? index < selected.length / 3
                ? "THE DOOR OPENS"
                : index < (selected.length * 2) / 3
                  ? "CONTAINMENT FAILS"
                  : "FULL AFTER MIDNIGHT"
              : "DIRECT HIT"
        };
      }),
      path: selected.map(function (item, index) {
        return presentReceipt(showcase, item.receipt, {
          order: index + 1,
          chemistry: item.chemistry.score,
          phase:
            mode === "spiral"
              ? index < selected.length / 3
                ? "THE DOOR OPENS"
                : index < (selected.length * 2) / 3
                  ? "CONTAINMENT FAILS"
                  : "FULL AFTER MIDNIGHT"
              : "DIRECT HIT"
        });
      })
    };
  }

  function buildDescentPresets(showcase) {
    return {
      label: "PERSONALIZED DESCENT",
      routes: [
        {
          id: "slow-burn",
          label: "START NORMAL. END DERANGED.",
          request: { mode: "spiral", limit: 10 },
          route: buildDescent(showcase, { mode: "spiral", limit: 10 })
        },
        {
          id: "live-wire",
          label: "LIVE ROOM FAILURE",
          request: { mode: "instant", lane: "fresh-live", limit: 8 },
          route: buildDescent(showcase, {
            mode: "instant",
            lane: "fresh-live",
            limit: 8
          })
        },
        {
          id: "character-break",
          label: "THE CHARACTER HAS THE FLOOR",
          request: { mode: "chronological", entityId: "character:loomis", limit: 8 },
          route: buildDescent(showcase, {
            mode: "chronological",
            entityId: "character:loomis",
            limit: 8
          })
        }
      ]
    };
  }

  function buildCourts(timeMachines, receipts, minimumSides) {
    var lookup = new Map(
      receipts.map(function (receipt) {
        return [receipt.id, receipt];
      })
    );
    var courts = timeMachines
      .map(function (machine) {
        var items = machine.receipts
          .map(function (id) {
            return lookup.get(id);
          })
          .filter(Boolean);
        var prosecution = stableSort(
          items.filter(function (item) {
            return item.sentiment === "negative";
          }),
          function (a, b) {
            return b.score - a.score || a.id.localeCompare(b.id);
          }
        ).slice(0, 3);
        var defense = stableSort(
          items.filter(function (item) {
            return item.sentiment === "positive";
          }),
          function (a, b) {
            return b.score - a.score || a.id.localeCompare(b.id);
          }
        ).slice(0, 3);
        if (prosecution.length < minimumSides || defense.length < minimumSides) return null;
        var controversy = clamp(
          45 +
            machine.movements.length * 12 +
            Math.min(prosecution.length, defense.length) * 6,
          0,
          100
        );
        return {
          id: "court:" + slug(machine.subjectId),
          caseName: "THE PEOPLE vs. " + machine.subject.toUpperCase(),
          title: "THE PEOPLE vs. " + machine.subject.toUpperCase(),
          subjectId: machine.subjectId,
          subject: machine.subject,
          controversy: controversy,
          prosecutionReceiptIds: prosecution.map(function (item) {
            return item.id;
          }),
          prosecution: prosecution.map(function (item) {
            return {
              receiptId: item.id,
              id: item.sourceId,
              sourceId: item.sourceId,
              source: item.sourceType,
              sourceType: item.sourceType,
              at: item.t,
              t: item.t,
              url: item.url,
              title: item.sourceTitle,
              date: item.date,
              category: item.category,
              excerpt: item.excerpt,
              quote: item.excerpt,
              score: item.score
            };
          }),
          defenseReceiptIds: defense.map(function (item) {
            return item.id;
          }),
          defense: defense.map(function (item) {
            return {
              receiptId: item.id,
              id: item.sourceId,
              sourceId: item.sourceId,
              source: item.sourceType,
              sourceType: item.sourceType,
              at: item.t,
              t: item.t,
              url: item.url,
              title: item.sourceTitle,
              date: item.date,
              category: item.category,
              excerpt: item.excerpt,
              quote: item.excerpt,
              score: item.score
            };
          }),
          reversalReceiptIds: machine.movements
            .flatMap(function (movement) {
              return [movement.beforeReceiptId, movement.afterReceiptId];
            })
            .filter(Boolean),
          reversals: machine.movements.map(function (movement) {
            var before = lookup.get(movement.beforeReceiptId);
            var after = lookup.get(movement.afterReceiptId);
            return {
              before: before
                ? {
                    receiptId: before.id,
                    sourceId: before.sourceId,
                    t: before.t,
                    url: before.url
                  }
                : null,
              after: after
                ? {
                    receiptId: after.id,
                    sourceId: after.sourceId,
                    t: after.t,
                    url: after.url
                  }
                : null
            };
          }),
          verdict: "OPEN",
          verdictRule:
            "No synthesized verdict becomes canon until an editor or creator certifies the evidence."
        };
      })
      .filter(Boolean);
    return stableSort(courts, function (a, b) {
      return b.controversy - a.controversy || a.caseName.localeCompare(b.caseName);
    });
  }

  function streamTopics(source) {
    if (!source) return [];
    return array(source.topics)
      .map(function (topic) {
        return clean(topic.name || topic.topic || topic.label);
      })
      .filter(Boolean);
  }

  function buildAftermath(sources, receipts, chemistry) {
    var liveSources = stableSort(
      sources.filter(function (source) {
        return source.type === "livestream";
      }),
      newestFirst
    );
    var chemistryByReceipt = new Map(
      chemistry.moments.map(function (moment) {
        return [moment.receiptId, moment];
      })
    );

    return liveSources.map(function (source, index) {
      var older = liveSources[index + 1];
      var previousTopics = new Set(streamTopics(older).map(normalized));
      var currentTopics = streamTopics(source);
      var sourceReceipts = receipts.filter(function (receipt) {
        return receipt.sourceId === source.id;
      });
      var comedy = stableSort(
        sourceReceipts
          .filter(function (receipt) {
            return chemistryByReceipt.has(receipt.id);
          })
          .map(function (receipt) {
            return {
              receipt: receipt,
              chemistry: chemistryByReceipt.get(receipt.id)
            };
          }),
        function (a, b) {
          return b.chemistry.score - a.chemistry.score || a.receipt.id.localeCompare(b.receipt.id);
        }
      );
      var topicReceipts = sourceReceipts.filter(function (receipt) {
        return receipt.type === "topic-chapter";
      });
      return {
        id: "aftermath:" + source.id,
        sourceId: source.id,
        sourceLane: source.lane,
        date: source.date,
        title: source.title,
        captioned: source.captioned,
        summary: source.summary,
        dominantTopics: currentTopics.slice(0, 5),
        topics: currentTopics.slice(0, 5).map(function (name) {
          return { name: name };
        }),
        newSincePreviousIndexedStream: currentTopics
          .filter(function (topic) {
            return !previousTopics.has(normalized(topic));
          })
          .slice(0, 8),
        changes: currentTopics
          .filter(function (topic) {
            return !previousTopics.has(normalized(topic));
          })
          .slice(0, 8)
          .map(function (topic) {
            return topic + " entered the indexed live conversation";
          }),
        funniestReceiptId: comedy.length ? comedy[0].receipt.id : "",
        funniest: comedy.length
          ? {
              receiptId: comedy[0].receipt.id,
              sourceId: comedy[0].receipt.sourceId,
              t: comedy[0].receipt.t,
              url: comedy[0].receipt.url,
              chemistry: comedy[0].chemistry.score
            }
          : null,
        peakChemistry: comedy.length ? comedy[0].chemistry.score : 0,
        strongestTopicReceiptId: topicReceipts.length
          ? stableSort(topicReceipts, function (a, b) {
              return b.score - a.score || a.id.localeCompare(b.id);
            })[0].id
          : "",
        strongestTopic: topicReceipts.length
          ? (function () {
              var item = stableSort(topicReceipts, function (a, b) {
                return b.score - a.score || a.id.localeCompare(b.id);
              })[0];
              return {
                receiptId: item.id,
                sourceId: item.sourceId,
                t: item.t,
                url: item.url
              };
            })()
          : null,
        clipCandidateReceiptIds: comedy.slice(0, 5).map(function (item) {
          return item.receipt.id;
        }),
        clipCandidates: comedy.slice(0, 5).map(function (item) {
          return {
            receiptId: item.receipt.id,
            sourceId: item.receipt.sourceId,
            t: item.receipt.t,
            url: item.receipt.url,
            chemistry: item.chemistry.score
          };
        }),
        graphDelta: {
          topicNodesAdded: currentTopics.filter(function (topic) {
            return !previousTopics.has(normalized(topic));
          }).length,
          timestampedReceiptsAdded: sourceReceipts.length
        },
        status: source.captioned ? "DISTILLED — REVIEW AVAILABLE" : "CAPTIONS UNAVAILABLE",
        inference:
          "Newness compares this stream with the immediately previous indexed livestream, not the entire channel archive."
      };
    });
  }

  function characterReadiness(receipts, input) {
    var policy = (input.dna && input.dna.askCharacterPolicy) || {};
    return array(input.dna.characters).map(function (character) {
      var matches = receipts.filter(function (receipt) {
        return receipt.entityIds.indexOf(character.id) >= 0;
      });
      var curatedCandidates = matches.filter(function (receipt) {
        return ["curated-candidate", "editor", "creator"].indexOf(receipt.evidenceLevel) >= 0;
      });
      var authenticatedEditorVerified = matches.filter(function (receipt) {
        return (
          receipt.authenticatedEditorVerified === true &&
          (receipt.evidenceLevel === "editor" || receipt.evidenceLevel === "creator")
        );
      });
      var minimum = number(
        character.minimumCuratedCandidatesForAsk || policy.evidenceMinimum || 3,
        3
      );
      return {
        characterId: character.id,
        character: character.label,
        performer: character.performer,
        performerStatus: character.performerStatus,
        receiptIds: matches.map(function (receipt) {
          return receipt.id;
        }),
        curatedCandidateReceiptIds: curatedCandidates.map(function (receipt) {
          return receipt.id;
        }),
        authenticatedEditorVerifiedReceiptIds: authenticatedEditorVerified.map(function (receipt) {
          return receipt.id;
        }),
        minimumCuratedCandidates: minimum,
        readyForAskCharacter: curatedCandidates.length >= minimum,
        status:
          curatedCandidates.length >= minimum
            ? "READY FOR LABELED PARODY RECONSTRUCTION"
            : "DOSSIER IN PROGRESS — DO NOT GENERATE",
        disclosure: clean(policy.disclosure)
      };
    });
  }

  function buildControlRoom(sources, receipts, timeMachines, ancestry, readiness) {
    var queue = [];
    sources
      .filter(function (source) {
        return !source.captioned;
      })
      .forEach(function (source) {
        queue.push({
          id: "queue:captions:" + source.id,
          priority: 100,
          lane: "SOURCE HEALTH",
          action: "LOCATE OR CREATE CAPTIONS",
          sourceId: source.id,
          receiptIds: [],
          reason: "No transcript means no defensible topic, quote, or character extraction."
        });
      });

    stableSort(
      receipts.filter(function (receipt) {
        return receipt.score >= 90 && receipt.evidenceLevel === "machine";
      }),
      function (a, b) {
        return b.score - a.score || a.id.localeCompare(b.id);
      }
    )
      .slice(0, 30)
      .forEach(function (receipt) {
        queue.push({
          id: "queue:verify:" + receipt.id,
          priority: 70 + Math.round(receipt.score / 10),
          lane: "EDITORIAL REVIEW",
          action: "VERIFY HIGH-IMPACT RECEIPT",
          sourceId: receipt.sourceId,
          receiptIds: [receipt.id],
          reason: "This machine-surfaced moment is prominent enough to become public canon."
        });
      });

    timeMachines
      .filter(function (machine) {
        return machine.movements.length;
      })
      .slice(0, 12)
      .forEach(function (machine) {
        queue.push({
          id: "queue:timeline:" + slug(machine.subjectId),
          priority: 72 + Math.min(machine.movements.length, 8),
          lane: "TAKE TIME MACHINE",
          action: "REVIEW APPARENT OPINION CHANGE",
          sourceId: "",
          receiptIds: unique(
            machine.movements.flatMap(function (movement) {
              return [movement.beforeReceiptId, movement.afterReceiptId];
            })
          ),
          reason: "Opposing excerpt signals may show an evolution, a joke, or missing context."
        });
      });

    ancestry.forEach(function (bit) {
      if (bit.evidenceLevel !== "machine") return;
      queue.push({
        id: "queue:bit:" + slug(bit.bitId),
        priority: 82,
        lane: "BIT ANCESTRY",
        action: "CONFIRM BIT AND EARLIEST-KNOWN ORIGIN",
        sourceId: bit.origin.sourceId,
        receiptIds: [bit.origin.receiptId].concat(bit.callbacks.slice(0, 4)),
        reason: "Machine matching found a recurring-character pattern; a human should certify the bit."
      });
    });

    readiness
      .filter(function (character) {
        return !character.readyForAskCharacter;
      })
      .forEach(function (character) {
        queue.push({
          id: "queue:character:" + slug(character.characterId),
          priority: 88,
          lane: "CHARACTER STUDIO",
          action: "CURATE " + character.minimumCuratedCandidates + " TIMESTAMPED PERFORMANCE CANDIDATES",
          sourceId: "",
          receiptIds: character.receiptIds.slice(0, 8),
          reason:
            character.character +
            " stays locked until enough timestamped curated candidates support the parody pattern."
        });
      });

    var evidenceById = new Map(
      receipts.map(function (receipt) {
        return [receipt.id, receipt];
      })
    );
    queue.forEach(function (item) {
      item.evidence = item.receiptIds
        .map(function (id) {
          var receipt = evidenceById.get(id);
          return receipt
            ? {
                receiptId: receipt.id,
                sourceId: receipt.sourceId,
                t: receipt.t,
                url: receipt.url
              }
            : null;
        })
        .filter(Boolean);
    });
    return stableSort(queue, function (a, b) {
      return b.priority - a.priority || a.id.localeCompare(b.id);
    });
  }

  function create(catalog, deep, live, popular, characters, dna) {
    var input = parseArguments(catalog, deep, live, popular, characters, dna);
    var sources = normalizeSources(input);
    var receipts = normalizeReceipts(sources, input);
    var entities = buildEntities(sources, receipts, input);
    var graph = buildGraph(sources, receipts, entities, input);
    var minimumTimeline =
      number(input.dna.qualityGates && input.dna.qualityGates.minimumTimelineReceipts) || 2;
    var timeMachines = buildTimeMachines(receipts, graph, minimumTimeline);
    var bitAncestry = buildBitAncestry(receipts, input, graph);
    var riffChemistry = buildRiffChemistry(receipts, sources, input);
    var minimumCourt =
      number(input.dna.qualityGates && input.dna.qualityGates.minimumCourtSides) || 1;
    var courts = buildCourts(timeMachines, receipts, minimumCourt);
    var aftermath = buildAftermath(sources, receipts, riffChemistry);
    var readiness = characterReadiness(receipts, input);
    var snapshotDate =
      stableSort(
        sources
          .map(function (source) {
            return source.date;
          })
          .filter(Boolean),
        function (a, b) {
          return b.localeCompare(a);
        }
      )[0] ||
      clean(input.deep.generated || input.live.generated || input.popular.generated) ||
      "undated";
    var showcase = {
      engine: "YOUTUBE WIKI MEMORY OS / SHOWCASE ENGINE",
      version: VERSION,
      channelId: clean(input.dna.id || "channel"),
      snapshotDate: snapshotDate,
      inputFingerprint: fingerprint(
        sources
          .map(function (source) {
            return [source.id, source.date, source.wordsAudited].join(":");
          })
          .join("|") +
          "|" +
          receipts
            .map(function (receipt) {
              return receipt.id;
            })
            .join("|")
      ),
      audit: {
        sourceCount: sources.length,
        commentarySources: sources.filter(function (source) {
          return source.type === "commentary";
        }).length,
        livestreamSources: sources.filter(function (source) {
          return source.type === "livestream";
        }).length,
        popularLaneSources: sources.filter(function (source) {
          return source.lanes.indexOf("popular-live") >= 0;
        }).length,
        timestampedReceipts: receipts.length,
        wordsAudited: sources.reduce(function (sum, source) {
          return sum + number(source.wordsAudited);
        }, 0),
        unresolvedSources: sources.filter(function (source) {
          return !source.captioned;
        }).map(function (source) {
          return source.id;
        }),
        inferencePolicy:
          "Every derived assertion lists receipt IDs; opinion, origin, and humor scores remain labeled inference until human review."
      },
      sources: sources.map(function (source) {
        var copy = Object.assign({}, source);
        delete copy.raw;
        delete copy.moments;
        delete copy.topics;
        delete copy.metrics;
        delete copy.heatmap;
        return copy;
      }),
      receipts: receipts,
      memoryGraph: graph,
      takeTimeMachines: timeMachines,
      bitAncestry: bitAncestry,
      riffChemistry: riffChemistry,
      personalizedDescent: null,
      courtCandidates: courts,
      liveAftermath: aftermath,
      characterReadiness: readiness,
      creatorControlRoom: null
    };
    showcase.personalizedDescent = buildDescentPresets(showcase);
    showcase.creatorControlRoom = {
      evidenceLevels: [
        {
          id: "machine",
          label: "TAPE-INDEXED CANDIDATE",
          meaning: "Candidate found by deterministic transcript rules"
        },
        {
          id: "curated-candidate",
          label: "TIMESTAMP-VALIDATED HUMAN-CURATED CANDIDATE",
          meaning:
            "A human selected a structurally valid source/timestamp candidate; no authenticated editor decision or clip-speaker diarization is implied"
        },
        {
          id: "editor",
          label: "EDITOR VERIFIED",
          meaning: "Timestamp and context checked by the wiki editor"
        },
        {
          id: "creator",
          label: "CREATOR CERTIFIED",
          meaning: "Channel owner confirms the moment, speaker, or lore"
        }
      ],
      queue: buildControlRoom(
        sources,
        receipts,
        timeMachines,
        bitAncestry,
        readiness
      )
    };
    var presentationReceipts = receiptMap(showcase);
    showcase.creatorControlRoom.reviewQueue = showcase.creatorControlRoom.queue.map(
      function (item) {
        var receipt = item.evidence && item.evidence.length
          ? presentationReceipts.get(item.evidence[0].receiptId)
          : null;
        return {
          id: item.id,
          label: item.action,
          title: item.action,
          reason: item.reason,
          priority: item.priority,
          source: receipt ? receipt.sourceType : "",
          sourceId: receipt ? receipt.sourceId : item.sourceId,
          at: receipt ? receipt.t : 0,
          t: receipt ? receipt.t : 0,
          receiptIds: item.receiptIds
        };
      }
    );
    showcase.creatorControlRoom.approvals = showcase.creatorControlRoom.reviewQueue;
    var newestAftermath = showcase.liveAftermath[0];
    showcase.creatorControlRoom.contentOpportunities = newestAftermath
      ? newestAftermath.clipCandidates.map(function (candidate, index) {
          var receipt = presentationReceipts.get(candidate.receiptId);
          return {
            label:
              (receipt ? receipt.category : "LIVE MOMENT") +
              " clip candidate #" +
              (index + 1),
            reason:
              candidate.chemistry +
              " Riff Chemistry with an exact edit-decision timestamp",
            source: receipt ? receipt.sourceType : "livestream",
            sourceId: candidate.sourceId,
            at: candidate.t,
            t: candidate.t,
            receiptId: candidate.receiptId
          };
        })
      : [];
    showcase.creatorControlRoom.opportunities =
      showcase.creatorControlRoom.contentOpportunities;
    showcase.creatorControlRoom.archiveResurfaced = showcase.takeTimeMachines
      .slice(0, 5)
      .map(function (machine) {
        var receipt = presentationReceipts.get(
          machine.receipts[machine.receipts.length - 1]
        );
        return {
          label: machine.subject + " Take Time Machine",
          reason:
            machine.receipts.length +
            " receipts connect this subject across the indexed archive",
          source: receipt ? receipt.sourceType : "",
          sourceId: receipt ? receipt.sourceId : "",
          at: receipt ? receipt.t : 0,
          t: receipt ? receipt.t : 0,
          receiptId: receipt ? receipt.id : ""
        };
      });
    showcase.creatorControlRoom.resurfaced =
      showcase.creatorControlRoom.archiveResurfaced;
    showcase.metrics = {
      sources: showcase.audit.sourceCount,
      commentaries: showcase.audit.commentarySources,
      livestreams: showcase.audit.livestreamSources,
      popularLivestreams: showcase.audit.popularLaneSources,
      receipts: showcase.audit.timestampedReceipts,
      wordsAudited: showcase.audit.wordsAudited,
      graphNodes: showcase.memoryGraph.stats.nodes,
      graphEdges: showcase.memoryGraph.stats.edges,
      nodes: showcase.memoryGraph.stats.nodes,
      edges: showcase.memoryGraph.stats.edges,
      timeMachines: showcase.takeTimeMachines.length,
      bitLineages: showcase.bitAncestry.length,
      timelines: showcase.takeTimeMachines.length,
      bits: showcase.bitAncestry.length,
      riffMoments: showcase.riffChemistry.moments.length,
      courtCases: showcase.courtCandidates.length,
      aftermathReports: showcase.liveAftermath.length,
      controlRoomItems: showcase.creatorControlRoom.queue.length
    };
    showcase.getTimeMachines = function () {
      var duplicateLabels = showcase.takeTimeMachines.reduce(function (counts, machine) {
        counts[machine.subject] = number(counts[machine.subject]) + 1;
        return counts;
      }, {});
      return showcase.takeTimeMachines.map(function (machine) {
        var events = machine.receipts
          .map(function (id) {
            return presentReceipt(showcase, presentationReceipts.get(id));
          })
          .filter(Boolean);
        var displayName =
          duplicateLabels[machine.subject] > 1
            ? machine.subject +
              " — " +
              (machine.subjectType === "topic"
                ? "LIVE TOPIC"
                : machine.subjectType.toUpperCase())
            : machine.subject;
        return Object.assign({}, machine, {
          name: displayName,
          entity: displayName,
          title: displayName,
          events: events,
          receipts: events,
          receiptIds: machine.receipts.slice()
        });
      });
    };
    showcase.getBitLineages = function () {
      return showcase.bitAncestry.map(function (lineage) {
        var events = lineage.performances
          .map(function (performance) {
            return presentReceipt(
              showcase,
              presentationReceipts.get(performance.receiptId),
              { role: lineage.label }
            );
          })
          .filter(Boolean);
        return Object.assign({}, lineage, {
          name: lineage.label,
          bit: lineage.label,
          description:
            "Earliest-known indexed performance through its latest timestamped curated callback.",
          events: events,
          receipts: events,
          receiptIds: lineage.performances.map(function (performance) {
            return performance.receiptId;
          })
        });
      });
    };
    showcase.getRiffChemistry = function () {
      return showcase.riffChemistry;
    };
    showcase.getCourtCases = function () {
      return showcase.courtCandidates;
    };
    showcase.buildDescent = function (options) {
      return buildDescent(showcase, options);
    };
    showcase.getAftermath = function () {
      return showcase.liveAftermath;
    };
    showcase.getControlRoom = function () {
      return showcase.creatorControlRoom;
    };
    return showcase;
  }

  root.WWAMShowcaseEngine = Object.freeze({
    VERSION: VERSION,
    create: create,
    buildDescent: buildDescent,
    formatTime: formatTime,
    timestampUrl: timestampUrl
  });
})(typeof window !== "undefined" ? window : globalThis);
