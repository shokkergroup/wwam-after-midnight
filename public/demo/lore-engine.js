(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var ORIGIN_DISCLAIMER =
    "Earliest in the currently indexed WWAM archive is not a claim about the bit's true channel or real-world origin.";

  var CATEGORY_COPY = {
    "OUT OF POCKET": "The sentence has left adult supervision.",
    "FRANCHISE FELONY": "A charge filed against a movie, sequel, remake, or creative decision.",
    "LOVE LETTER": "The jokes stop just long enough for the movie love to become unmistakable.",
    "THEORY BOARD": "A take acquires string, pushpins, and suspicious confidence.",
    "KILL ROOM": "The hosts inspect how the horror machinery actually does its work.",
    "BIT ENERGY": "A throwaway thought develops a pulse and refuses to leave.",
    BREAKDOWN: "The room, the sentence, or both lose structural integrity.",
    "HORROR BRAIN": "Deep genre recall takes control of the broadcast.",
    "FULL SEND": "The volume knob and the commitment knob are now the same knob.",
    "TAKE GETS NUCLEAR": "An opinion reaches the portion of the map labeled consequences.",
    "THE ROOM BREAKS": "The laugh becomes the event.",
    "UP IN YA": "A soundbyte selected for maximum out-of-context danger.",
    "CHAT DID THIS": "The audience touched the controls and the room accepted the consequences."
  };

  var ERA_BANDS = [
    {
      id: "2016-2018",
      from: 2016,
      to: 2018,
      name: "Indexed Archive: 2016–2018",
      nickname: "THE EARLY COMMENTARY SHELF"
    },
    {
      id: "2019-2021",
      from: 2019,
      to: 2021,
      name: "Indexed Archive: 2019–2021",
      nickname: "THE FRANCHISE-MARATHON SHELF"
    },
    {
      id: "2022-2024",
      from: 2022,
      to: 2024,
      name: "Indexed Archive: 2022–2024",
      nickname: "THE SPOILER-PARTY SHELF"
    },
    {
      id: "2025-2026",
      from: 2025,
      to: 2026,
      name: "Indexed Archive: 2025–2026",
      nickname: "THE LIVE-ROOM SHELF"
    }
  ];

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clean(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
  }

  function slug(value) {
    return clean(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown";
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function youtubeUrl(sourceId, seconds) {
    if (!sourceId) return "";
    return (
      "https://www.youtube.com/watch?v=" +
      encodeURIComponent(sourceId) +
      "&t=" +
      Math.max(0, Math.round(number(seconds, 0))) +
      "s"
    );
  }

  function dateYear(value) {
    var match = String(value || "").match(/^(\d{4})/);
    return match ? Number(match[1]) : null;
  }

  function compareEvidence(a, b) {
    var aDate = a.date || "9999-99-99";
    var bDate = b.date || "9999-99-99";
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    if (a.sourceId !== b.sourceId) return a.sourceId.localeCompare(b.sourceId);
    return number(a.t, 0) - number(b.t, 0);
  }

  function formatCount(value) {
    return number(value, 0).toLocaleString("en-US");
  }

  function resolveEra(date) {
    var year = dateYear(date);
    if (!year) return null;
    return (
      ERA_BANDS.find(function (era) {
        return year >= era.from && year <= era.to;
      }) || null
    );
  }

  function firstKnown(receipts) {
    return array(receipts)
      .filter(function (receipt) {
        return Boolean(receipt.date);
      })
      .slice()
      .sort(compareEvidence)[0] || null;
  }

  function selectLineageReceipts(receipts, limit) {
    var sorted = array(receipts).slice().sort(compareEvidence);
    if (sorted.length <= limit) return sorted;

    var chosen = new Map();
    function keep(receipt) {
      if (receipt) chosen.set(receipt.id, receipt);
    }

    keep(sorted[0]);
    keep(sorted[sorted.length - 1]);
    sorted
      .slice()
      .sort(function (a, b) {
        return number(b.strength, 0) - number(a.strength, 0);
      })
      .slice(0, Math.max(2, limit - 4))
      .forEach(keep);

    var seenYears = new Set();
    sorted.forEach(function (receipt) {
      var year = dateYear(receipt.date);
      if (year && !seenYears.has(year) && chosen.size < limit) {
        seenYears.add(year);
        keep(receipt);
      }
    });

    if (chosen.size < limit) {
      var step = Math.max(1, Math.floor(sorted.length / (limit - chosen.size + 1)));
      for (var index = step; index < sorted.length && chosen.size < limit; index += step) {
        keep(sorted[index]);
      }
    }

    return Array.from(chosen.values()).sort(compareEvidence).slice(0, limit);
  }

  function create(input) {
    var options = input || {};
    var catalog = array(options.catalog || root.WWAM_CATALOG);
    var deep = options.deep || root.WWAM_DEEP_DISTILL || {};
    var live = options.live || root.WWAM_LIVESTREAMS || {};
    var popular = options.popular || root.WWAM_POPULAR_LIVE || {};
    var characterLore = options.characters || root.WWAM_CHARACTER_LORE || {};

    var sourceMap = new Map();
    var receiptMap = new Map();
    var fieldEntries = [];
    var lineages = [];
    var nodes = [];
    var nodeMap = new Map();
    var edgeMap = new Map();
    var sourceReceiptIds = new Map();
    var tapeMap = new Map(
      array(deep.tapes).map(function (tape) {
        return [tape.id, tape];
      })
    );
    var hotRankMap = new Map(
      array(deep.hot100).map(function (moment) {
        return [moment.id || moment.tapeId + "-" + moment.t, moment.rank];
      })
    );

    function addSource(raw, lane) {
      if (!raw || !raw.id) return null;
      var existing = sourceMap.get(raw.id);
      var tape = tapeMap.get(raw.id) || {};
      var next = existing || {
        id: raw.id,
        title: clean(raw.title || raw.film || raw.id),
        date: raw.date || null,
        duration: number(raw.duration, null),
        views: number(raw.views, null),
        thumbnail: raw.thumbnail || "",
        url: raw.url || "https://www.youtube.com/watch?v=" + raw.id,
        franchise: raw.franchise || null,
        film: raw.film || null,
        order: number(raw.order, null),
        transcript: raw.transcript !== false && (raw.captioned !== false || Boolean(tape.wordsAudited)),
        lanes: [],
        wordsAudited: number(raw.wordsAudited, number(tape.wordsAudited, 0)),
        summary: clean(
          raw.summary ||
            (raw.editorial && raw.editorial.whyItMatters) ||
            tape.verdict ||
            ""
        )
      };

      next.lanes = unique(next.lanes.concat(lane || []));
      if (!next.date && raw.date) next.date = raw.date;
      if (!next.title && raw.title) next.title = clean(raw.title);
      if (!next.franchise && raw.franchise) next.franchise = raw.franchise;
      if (!next.film && raw.film) next.film = raw.film;
      if (!next.wordsAudited && raw.wordsAudited) next.wordsAudited = number(raw.wordsAudited, 0);
      if (!next.summary && raw.summary) next.summary = clean(raw.summary);
      sourceMap.set(raw.id, next);
      return next;
    }

    catalog.forEach(function (source) {
      addSource(source, "commentary");
    });
    array(live.streams).forEach(function (source) {
      addSource(source, "fresh-livestream");
    });
    array(popular.streams).forEach(function (source) {
      addSource(source, "popular-livestream");
    });

    array(characterLore.characters)
      .concat(array(characterLore.lockedCandidates))
      .forEach(function (character) {
        array(character.soundbytes)
          .concat(array(character.creatorContext))
          .forEach(function (soundbyte) {
            addSource(
              {
                id: soundbyte.sourceId,
                title: soundbyte.sourceTitle,
                date: soundbyte.date,
                url: "https://www.youtube.com/watch?v=" + soundbyte.sourceId
              },
              "character-evidence"
            );
          });
      });

    function addReceipt(raw) {
      if (!raw || !raw.sourceId) return null;
      var source =
        sourceMap.get(raw.sourceId) ||
        addSource(
          {
            id: raw.sourceId,
            title: raw.sourceTitle || raw.sourceId,
            date: raw.date || null
          },
          raw.lane || "evidence"
        );
      var t = Math.max(0, number(raw.t, 0));
      var baseId =
        "receipt:" +
        slug(raw.kind || "evidence") +
        ":" +
        raw.sourceId +
        ":" +
        Math.round(t * 10) +
        ":" +
        slug(raw.label || raw.category || raw.character || "evidence");
      var id = baseId;
      var collision = 2;
      while (receiptMap.has(id) && clean(receiptMap.get(id).quote) !== clean(raw.quote)) {
        id = baseId + ":" + collision;
        collision += 1;
      }
      if (receiptMap.has(id)) return receiptMap.get(id);

      var receipt = {
        id: id,
        kind: raw.kind || "evidence",
        lane: raw.lane || source.lanes[0] || "archive",
        sourceId: source.id,
        sourceTitle: source.title,
        date: raw.date || source.date || null,
        t: t,
        end: number(raw.end, null),
        url: raw.url || youtubeUrl(source.id, t),
        embedUrl:
          (raw.playback && raw.playback.embedUrl) ||
          "https://www.youtube.com/embed/" +
            source.id +
            "?start=" +
            Math.round(t) +
            "&autoplay=1",
        label: clean(raw.label || raw.category || raw.character || "Indexed receipt"),
        quote: clean(raw.quote || raw.excerpt || ""),
        note: clean(raw.note || ""),
        strength: clamp(Math.round(number(raw.strength, raw.score || raw.heat || 50)), 0, 100),
        confidence: clamp(number(raw.confidence, 1), 0, 1),
        hotRank: number(raw.hotRank, null),
        provenance: raw.provenance || {
          basis: "Derived from the supplied WWAM archive data.",
          timestampStatus: "indexed-timestamp"
        }
      };
      receiptMap.set(id, receipt);
      return receipt;
    }

    sourceMap.forEach(function (source) {
      var receipt = addReceipt({
        kind: "archive-source",
        lane: source.lanes[0],
        sourceId: source.id,
        date: source.date,
        t: 0,
        label: source.film || source.title,
        quote: source.summary || source.title,
        strength: source.transcript ? 55 : 25,
        note: source.transcript
          ? "Playable opening of an indexed source."
          : "Indexed source without a caption-derived deep distill."
      });
      sourceReceiptIds.set(source.id, receipt.id);
    });

    array(deep.tapes).forEach(function (tape) {
      array(tape.moments).forEach(function (moment) {
        addReceipt({
          kind: "comedy-moment",
          lane: "commentary",
          sourceId: tape.id,
          t: moment.t,
          label: moment.category,
          quote: moment.quote,
          strength: moment.score,
          hotRank: hotRankMap.get(moment.id || tape.id + "-" + moment.t) || null,
          note: hotRankMap.has(moment.id || tape.id + "-" + moment.t)
            ? "Also ranked in the indexed Hot 100."
            : "Caption-derived commentary moment."
        });
      });
    });

    function addStreamEvidence(stream, lane) {
      array(stream.moments).forEach(function (moment) {
        addReceipt({
          kind: "comedy-moment",
          lane: lane,
          sourceId: stream.id,
          t: moment.t,
          label: moment.category,
          quote: moment.quote,
          strength: moment.heat,
          note: "Caption-derived livestream comedy receipt."
        });
      });
      array(stream.topics).forEach(function (topic) {
        addReceipt({
          kind: "topic-receipt",
          lane: lane,
          sourceId: stream.id,
          t: number(topic.peak, number(topic.first, 0)),
          label: topic.name,
          quote: topic.receipt,
          strength: clamp(number(topic.mentions, 0) + number(topic.cluster, 0) * 4, 1, 100),
          note:
            formatCount(topic.mentions) +
            " indexed mentions; peak topic cluster at this timestamp."
        });
      });
    }

    array(live.streams).forEach(function (stream) {
      addStreamEvidence(stream, "fresh-livestream");
    });
    array(popular.streams).forEach(function (stream) {
      addStreamEvidence(stream, "popular-livestream");
    });

    var characterReceiptLookup = new Map();
    array(characterLore.characters)
      .concat(array(characterLore.lockedCandidates))
      .forEach(function (character) {
        array(character.soundbytes).forEach(function (soundbyte) {
          var receipt = addReceipt({
            kind:
              character.status === "candidate-needs-human-verification"
                ? "candidate-performance"
                : "character-performance",
            lane: soundbyte.sourceType || "character-evidence",
            sourceId: soundbyte.sourceId,
            sourceTitle: soundbyte.sourceTitle,
            date: soundbyte.date,
            t: soundbyte.t,
            end: soundbyte.playback && soundbyte.playback.end,
            url: soundbyte.url,
            playback: soundbyte.playback,
            label: character.name + (soundbyte.trigger ? " · " + soundbyte.trigger : ""),
            quote: soundbyte.excerpt,
            note: soundbyte.note,
            strength: Math.round(number(soundbyte.confidence, 0.75) * 100),
            confidence: soundbyte.confidence,
            provenance: soundbyte.provenance
          });
          characterReceiptLookup.set(soundbyte.id, receipt.id);
        });
        array(character.creatorContext).forEach(function (context) {
          var receipt = addReceipt({
            kind: "creator-context",
            lane: context.sourceType || "character-evidence",
            sourceId: context.sourceId,
            sourceTitle: context.sourceTitle,
            date: context.date,
            t: context.t,
            end: context.playback && context.playback.end,
            url: context.url,
            playback: context.playback,
            label: character.name + " · creator context",
            quote: context.excerpt,
            note: context.note,
            strength: Math.round(number(context.confidence, 0.75) * 100),
            confidence: context.confidence,
            provenance: context.provenance
          });
          characterReceiptLookup.set(context.id, receipt.id);
        });
      });

    var receipts = Array.from(receiptMap.values());
    var knownYears = Array.from(sourceMap.values())
      .map(function (source) {
        return dateYear(source.date);
      })
      .filter(Boolean);
    var minYear = knownYears.length ? Math.min.apply(null, knownYears) : 2016;
    var maxYear = knownYears.length ? Math.max.apply(null, knownYears) : 2026;
    var maxViews = Math.max.apply(
      null,
      Array.from(sourceMap.values()).map(function (source) {
        return number(source.views, 0);
      }).concat([1])
    );

    function calculateDeepCut(entry) {
      var sourceCount = Math.max(1, number(entry.metrics && entry.metrics.sources, 1));
      var receiptCount = Math.max(1, number(entry.metrics && entry.metrics.receipts, 1));
      var rarity =
        1 - Math.min(1, Math.log1p(sourceCount) / Math.log1p(Math.max(2, sourceMap.size)));
      var specificity = 1 - Math.min(1, Math.log1p(receiptCount) / Math.log1p(30));
      var year = dateYear(entry.archiveFirst && entry.archiveFirst.date);
      var age =
        year && maxYear > minYear ? clamp((maxYear - year) / (maxYear - minYear), 0, 1) : 0;
      var views = number(entry.metrics && entry.metrics.views, null);
      var obscurity =
        views == null ? 0.45 : 1 - Math.log1p(Math.max(0, views)) / Math.log1p(maxViews);
      var score = Math.round(
        100 * (rarity * 0.5 + specificity * 0.2 + age * 0.15 + obscurity * 0.15)
      );
      return clamp(score, 0, 100);
    }

    function deepCutTier(score) {
      if (score >= 80) return "BASEMENT TAPE";
      if (score >= 65) return "DEEP SHELF";
      if (score >= 45) return "FAN TEST";
      return "FRONT-DOOR LORE";
    }

    function addEntry(raw) {
      var receiptIds = unique(raw.receiptIds).filter(function (id) {
        return receiptMap.has(id);
      });
      var entryReceipts = receiptIds.map(function (id) {
        return receiptMap.get(id);
      });
      var first = raw.archiveFirst || firstKnown(entryReceipts);
      var sourceCount = new Set(
        entryReceipts.map(function (receipt) {
          return receipt.sourceId;
        })
      ).size;
      var entry = {
        id: raw.id,
        kind: raw.kind,
        name: clean(raw.name),
        kicker: clean(raw.kicker || raw.kind),
        summary: clean(raw.summary),
        editorialFlavor: clean(raw.editorialFlavor || ""),
        status: raw.status || "grounded",
        aliases: unique(raw.aliases),
        tags: unique(raw.tags),
        confidence: clamp(number(raw.confidence, 1), 0, 1),
        evidenceBasis: clean(
          raw.evidenceBasis ||
            "Computed from the sources and timestamped receipts in the currently indexed archive."
        ),
        originLanguage: {
          label: "EARLIEST IN INDEXED ARCHIVE",
          trueOriginClaim: false,
          disclaimer: ORIGIN_DISCLAIMER
        },
        archiveFirst: first
          ? {
              receiptId: first.id,
              sourceId: first.sourceId,
              sourceTitle: first.sourceTitle,
              date: first.date,
              t: first.t,
              url: first.url,
              quote: first.quote
            }
          : null,
        receiptIds: receiptIds,
        metrics: Object.assign(
          {
            receipts: receiptIds.length,
            sources: sourceCount
          },
          raw.metrics || {}
        ),
        details: raw.details || {}
      };
      entry.deepCutScore = calculateDeepCut(entry);
      entry.deepCutTier = deepCutTier(entry.deepCutScore);
      entry.deepCutReason =
        sourceCount <= 1
          ? "Evidence currently lives in one indexed source."
          : sourceCount <= 3
            ? "Evidence spans only " + sourceCount + " indexed sources."
            : "Score balances archive rarity, receipt density, age, and source visibility.";
      fieldEntries.push(entry);
      return entry;
    }

    function addNode(entry) {
      if (!entry || nodeMap.has(entry.id)) return nodeMap.get(entry && entry.id);
      var node = {
        id: entry.id,
        entryId: entry.id,
        kind: entry.kind,
        label: entry.name,
        subtitle: entry.kicker,
        status: entry.status,
        deepCutScore: entry.deepCutScore,
        receiptCount: entry.receiptIds.length,
        sourceCount: number(entry.metrics.sources, 0),
        size: clamp(6 + Math.round(Math.log1p(entry.receiptIds.length) * 5), 7, 30),
        tags: entry.tags
      };
      nodeMap.set(node.id, node);
      nodes.push(node);
      return node;
    }

    function addEdge(from, to, relation, receiptIds, weight, note) {
      if (!from || !to || from === to || !nodeMap.has(from) || !nodeMap.has(to)) return null;
      var id = "edge:" + from + ":" + slug(relation) + ":" + to;
      var validReceiptIds = unique(receiptIds).filter(function (receiptId) {
        return receiptMap.has(receiptId);
      });
      if (edgeMap.has(id)) {
        var existing = edgeMap.get(id);
        existing.receiptIds = unique(existing.receiptIds.concat(validReceiptIds));
        existing.receiptCount = existing.receiptIds.length;
        existing.weight = clamp(existing.weight + number(weight, 1), 1, 100);
        return existing;
      }
      var edge = {
        id: id,
        from: from,
        to: to,
        relation: relation,
        weight: clamp(number(weight, Math.max(1, validReceiptIds.length)), 1, 100),
        receiptIds: validReceiptIds,
        receiptCount: validReceiptIds.length,
        previewReceipt: validReceiptIds[0] || null,
        note: clean(note || "")
      };
      edgeMap.set(id, edge);
      return edge;
    }

    var sourceEntries = new Map();
    Array.from(sourceMap.values())
      .sort(function (a, b) {
        return (a.date || "9999").localeCompare(b.date || "9999") || a.title.localeCompare(b.title);
      })
      .forEach(function (source) {
        var sourceReceipts = receipts.filter(function (receipt) {
          return receipt.sourceId === source.id;
        });
        var categories = unique(
          sourceReceipts
            .filter(function (receipt) {
              return receipt.kind === "comedy-moment";
            })
            .map(function (receipt) {
              return receipt.label;
            })
        );
        var topics = unique(
          sourceReceipts
            .filter(function (receipt) {
              return receipt.kind === "topic-receipt";
            })
            .map(function (receipt) {
              return receipt.label;
            })
        );
        var entry = addEntry({
          id: "source:" + source.id,
          kind: "source",
          name: source.title,
          kicker: source.lanes.join(" + ").toUpperCase(),
          summary:
            source.summary ||
            (source.film
              ? "Indexed " + source.franchise + " commentary source for " + source.film + "."
              : "Indexed WWAM source."),
          editorialFlavor:
            sourceReceipts.length > 1
              ? sourceReceipts.length + " ways into the tape; pick your damage."
              : "The front door to this source.",
          tags: unique(
            source.lanes.concat(source.franchise || [], categories, topics, resolveEra(source.date)?.id)
          ),
          archiveFirst: receiptMap.get(sourceReceiptIds.get(source.id)),
          receiptIds: sourceReceipts.map(function (receipt) {
            return receipt.id;
          }),
          metrics: {
            receipts: sourceReceipts.length,
            sources: 1,
            wordsAudited: source.wordsAudited,
            views: source.views,
            duration: source.duration,
            categories: categories.length,
            topics: topics.length
          },
          details: {
            sourceId: source.id,
            date: source.date,
            url: source.url,
            thumbnail: source.thumbnail,
            lanes: source.lanes,
            franchise: source.franchise,
            film: source.film,
            transcript: source.transcript,
            categories: categories,
            topics: topics
          }
        });
        sourceEntries.set(source.id, entry);
      });

    var franchiseGroups = new Map();
    catalog.forEach(function (source) {
      if (!source.franchise) return;
      if (!franchiseGroups.has(source.franchise)) franchiseGroups.set(source.franchise, []);
      franchiseGroups.get(source.franchise).push(sourceMap.get(source.id));
    });

    var franchiseEntries = new Map();
    franchiseGroups.forEach(function (sources, franchise) {
      var receiptIds = sources.flatMap(function (source) {
        return receipts
          .filter(function (receipt) {
            return receipt.sourceId === source.id;
          })
          .map(function (receipt) {
            return receipt.id;
          });
      });
      var orderedSources = sources.slice().sort(function (a, b) {
        return (a.date || "9999").localeCompare(b.date || "9999") || number(a.order, 0) - number(b.order, 0);
      });
      var entry = addEntry({
        id: "franchise:" + slug(franchise),
        kind: "franchise",
        name: franchise,
        kicker: "FRANCHISE FIELD GUIDE",
        summary:
          formatCount(sources.length) +
          " indexed commentaries, connected to " +
          formatCount(receiptIds.length) +
          " playable archive receipts.",
        editorialFlavor: "A complete shelf, several emotional felonies, no parole board.",
        tags: ["franchise", "commentary"],
        receiptIds: receiptIds,
        archiveFirst: receiptMap.get(sourceReceiptIds.get(orderedSources[0].id)),
        metrics: {
          sources: sources.length,
          receipts: receiptIds.length,
          wordsAudited: sources.reduce(function (sum, source) {
            return sum + number(source.wordsAudited, 0);
          }, 0)
        },
        details: {
          sourceIds: orderedSources.map(function (source) {
            return source.id;
          }),
          coverageOrders: orderedSources.map(function (source) {
            return source.order;
          })
        }
      });
      franchiseEntries.set(franchise, entry);
    });

    var categoryGroups = new Map();
    receipts
      .filter(function (receipt) {
        return receipt.kind === "comedy-moment";
      })
      .forEach(function (receipt) {
        if (!categoryGroups.has(receipt.label)) categoryGroups.set(receipt.label, []);
        categoryGroups.get(receipt.label).push(receipt);
      });

    var categoryEntries = new Map();
    categoryGroups.forEach(function (categoryReceipts, category) {
      var sourceCount = new Set(
        categoryReceipts.map(function (receipt) {
          return receipt.sourceId;
        })
      ).size;
      var hottest = categoryReceipts.slice().sort(function (a, b) {
        return b.strength - a.strength;
      })[0];
      var entry = addEntry({
        id: "category:" + slug(category),
        kind: "category",
        name: category,
        kicker: "WWAM CLASSIFICATION",
        summary:
          formatCount(categoryReceipts.length) +
          " indexed moments across " +
          formatCount(sourceCount) +
          " sources.",
        editorialFlavor: CATEGORY_COPY[category] || "An archive category backed by playable receipts.",
        tags: ["category", "comedy", category],
        receiptIds: categoryReceipts.map(function (receipt) {
          return receipt.id;
        }),
        metrics: {
          sources: sourceCount,
          receipts: categoryReceipts.length,
          peakStrength: hottest ? hottest.strength : 0
        },
        details: {
          definitionStatus: "editorial archive classification",
          highestHeatReceiptId: hottest && hottest.id
        }
      });
      categoryEntries.set(category, entry);
    });

    var topicGroups = new Map();
    receipts
      .filter(function (receipt) {
        return receipt.kind === "topic-receipt";
      })
      .forEach(function (receipt) {
        if (!topicGroups.has(receipt.label)) topicGroups.set(receipt.label, []);
        topicGroups.get(receipt.label).push(receipt);
      });

    var topicEntries = new Map();
    topicGroups.forEach(function (topicReceipts, topic) {
      var sourceCount = new Set(
        topicReceipts.map(function (receipt) {
          return receipt.sourceId;
        })
      ).size;
      var entry = addEntry({
        id: "topic:" + slug(topic),
        kind: "topic",
        name: topic,
        kicker: "LIVE-ROOM TOPIC",
        summary:
          formatCount(topicReceipts.length) +
          " timestamped topic lanes across " +
          formatCount(sourceCount) +
          " livestreams.",
        editorialFlavor:
          sourceCount === 1
            ? "One door in the archive. You either know it or you are about to."
            : "A recurring exit ramp the live room keeps taking.",
        tags: ["topic", "livestream"],
        receiptIds: topicReceipts.map(function (receipt) {
          return receipt.id;
        }),
        metrics: {
          sources: sourceCount,
          receipts: topicReceipts.length,
          totalSignal: topicReceipts.reduce(function (sum, receipt) {
            return sum + receipt.strength;
          }, 0)
        }
      });
      topicEntries.set(topic, entry);
    });

    var characterEntries = new Map();
    var bitEntries = new Map();
    var motifEntries = new Map();

    array(characterLore.characters)
      .concat(array(characterLore.lockedCandidates))
      .forEach(function (character) {
        var isLocked = character.status === "candidate-needs-human-verification";
        var soundbyteReceiptIds = array(character.soundbytes)
          .map(function (soundbyte) {
            return characterReceiptLookup.get(soundbyte.id);
          })
          .filter(Boolean);
        var contextReceiptIds = array(character.creatorContext)
          .map(function (context) {
            return characterReceiptLookup.get(context.id);
          })
          .filter(Boolean);
        var characterEntry = addEntry({
          id: (isLocked ? "candidate-character:" : "character:") + character.id,
          kind: isLocked ? "candidate-character" : "character",
          name: character.displayName || character.name,
          kicker: isLocked ? "LOCKED CHARACTER CANDIDATE" : "RECURRING CHARACTER",
          summary: character.profile,
          editorialFlavor: isLocked
            ? "The receipts exist. The speaker label does not. The velvet rope stays up."
            : "A recurring performance with the timestamp trail to prove it.",
          status: isLocked ? "locked-needs-human-verification" : "grounded",
          aliases: character.aliases,
          tags: unique(["character", character.performedBy, character.lineage]),
          confidence: isLocked ? 0 : character.confidence,
          receiptIds: soundbyteReceiptIds.concat(contextReceiptIds),
          metrics: {
            sources: new Set(
              soundbyteReceiptIds.map(function (receiptId) {
                return receiptMap.get(receiptId).sourceId;
              })
            ).size,
            receipts: soundbyteReceiptIds.length + contextReceiptIds.length,
            verifiedPerformances: soundbyteReceiptIds.length,
            creatorContext: contextReceiptIds.length,
            archiveMentions: number(character.metrics && character.metrics.archiveMentions, 0)
          },
          evidenceBasis: isLocked
            ? character.whyLocked
            : "Only curated performance soundbytes are treated as performance evidence; ordinary mentions are excluded.",
          details: {
            characterId: character.id,
            performedBy: character.performedBy,
            lineageLabel: character.lineage,
            askEnabled: Boolean(character.askEnabled),
            hostAttribution: character.hostAttribution,
            lexicon: array(character.lexicon),
            limitations: isLocked ? character.whyLocked : null
          }
        });
        characterEntries.set(character.id, characterEntry);

        array(character.behaviorPatterns).forEach(function (pattern) {
          var patternReceiptIds = array(pattern.evidence)
            .map(function (evidenceId) {
              return characterReceiptLookup.get(evidenceId);
            })
            .filter(Boolean);
          var bitId = "bit:" + character.id + ":" + slug(pattern.label);
          var bitEntry = addEntry({
            id: bitId,
            kind: "bit",
            name: pattern.label,
            kicker: character.name + " · BEHAVIOR PATTERN",
            summary: pattern.detail,
            editorialFlavor:
              patternReceiptIds.length > 1
                ? "It happened again, which is when a moment starts paying rent."
                : "One grounded receipt; promising lore, not declared canon.",
            status: patternReceiptIds.length > 1 ? "recurring-grounded" : "single-receipt",
            tags: ["bit", character.name, character.id],
            confidence: character.confidence,
            receiptIds: patternReceiptIds,
            metrics: {
              sources: new Set(
                patternReceiptIds.map(function (receiptId) {
                  return receiptMap.get(receiptId).sourceId;
                })
              ).size,
              receipts: patternReceiptIds.length
            },
            evidenceBasis:
              "Behavior label and supporting soundbyte IDs come from the curated character-lore dataset.",
            details: {
              characterEntryId: characterEntry.id,
              characterId: character.id,
              evidenceSoundbyteIds: array(pattern.evidence)
            }
          });
          bitEntries.set(bitId, bitEntry);
        });

        array(character.triggerSignals).forEach(function (signal) {
          var signalReceiptIds = array(character.soundbytes)
            .filter(function (soundbyte) {
              return soundbyte.trigger === signal.label;
            })
            .map(function (soundbyte) {
              return characterReceiptLookup.get(soundbyte.id);
            })
            .filter(Boolean);
          var motifId = "motif:" + character.id + ":" + slug(signal.label);
          var motifEntry = addEntry({
            id: motifId,
            kind: "motif",
            name: signal.label,
            kicker: character.name + " · RECURRING MOTIF",
            summary:
              formatCount(signal.hits) +
              " indexed trigger matches; " +
              formatCount(signalReceiptIds.length) +
              " manually verified performance receipts.",
            editorialFlavor: "Say the magic words. See which version of the problem walks through the door.",
            status: signalReceiptIds.length ? "grounded" : "index-signal-only",
            tags: ["motif", character.name, character.id],
            confidence: signalReceiptIds.length ? character.confidence : 0.6,
            receiptIds: signalReceiptIds,
            metrics: {
              sources: new Set(
                signalReceiptIds.map(function (receiptId) {
                  return receiptMap.get(receiptId).sourceId;
                })
              ).size,
              receipts: signalReceiptIds.length,
              indexedHits: number(signal.hits, 0)
            },
            evidenceBasis:
              "Trigger hit count comes from caption matching; only linked curated soundbytes count as verified performances.",
            details: {
              characterEntryId: characterEntry.id,
              characterId: character.id
            }
          });
          motifEntries.set(motifId, motifEntry);
        });
      });

    var eraEntries = new Map();
    ERA_BANDS.forEach(function (era) {
      var eraSources = Array.from(sourceMap.values()).filter(function (source) {
        var year = dateYear(source.date);
        return year && year >= era.from && year <= era.to;
      });
      if (!eraSources.length) return;
      var receiptIds = eraSources.flatMap(function (source) {
        return receipts
          .filter(function (receipt) {
            return receipt.sourceId === source.id;
          })
          .map(function (receipt) {
            return receipt.id;
          });
      });
      var entry = addEntry({
        id: "era:" + era.id,
        kind: "era",
        name: era.name,
        kicker: era.nickname,
        summary:
          formatCount(eraSources.length) +
          " indexed sources and " +
          formatCount(receiptIds.length) +
          " playable receipts.",
        editorialFlavor: "An archive-navigation label, not an official period declared by the channel.",
        tags: ["era", era.id],
        receiptIds: receiptIds,
        archiveFirst: receiptMap.get(
          sourceReceiptIds.get(
            eraSources.slice().sort(function (a, b) {
              return a.date.localeCompare(b.date);
            })[0].id
          )
        ),
        metrics: {
          sources: eraSources.length,
          receipts: receiptIds.length,
          wordsAudited: eraSources.reduce(function (sum, source) {
            return sum + number(source.wordsAudited, 0);
          }, 0)
        },
        evidenceBasis:
          "Date-bounded navigation group computed from source publication dates; the nickname is editorial.",
        details: {
          fromYear: era.from,
          toYear: era.to,
          designation: "archive-navigation-label",
          sourceIds: eraSources.map(function (source) {
            return source.id;
          })
        }
      });
      eraEntries.set(era.id, entry);
    });

    fieldEntries.forEach(addNode);

    sourceEntries.forEach(function (sourceEntry, sourceId) {
      var source = sourceMap.get(sourceId);
      var sourceReceipts = receipts.filter(function (receipt) {
        return receipt.sourceId === sourceId;
      });
      var sourceReceiptId = sourceReceiptIds.get(sourceId);

      if (source.franchise && franchiseEntries.has(source.franchise)) {
        addEdge(
          sourceEntry.id,
          franchiseEntries.get(source.franchise).id,
          "belongs-to-franchise",
          [sourceReceiptId],
          8,
          "Source metadata names this franchise."
        );
      }

      var era = resolveEra(source.date);
      if (era && eraEntries.has(era.id)) {
        addEdge(
          sourceEntry.id,
          eraEntries.get(era.id).id,
          "published-in-indexed-era",
          [sourceReceiptId],
          5,
          "Derived from the indexed publication date."
        );
      }

      categoryEntries.forEach(function (categoryEntry, category) {
        var matches = sourceReceipts
          .filter(function (receipt) {
            return receipt.kind === "comedy-moment" && receipt.label === category;
          })
          .map(function (receipt) {
            return receipt.id;
          });
        if (matches.length) {
          addEdge(
            sourceEntry.id,
            categoryEntry.id,
            "contains-category",
            matches,
            matches.length,
            "Caption-derived moments classified in this category."
          );
        }
      });

      topicEntries.forEach(function (topicEntry, topic) {
        var matches = sourceReceipts
          .filter(function (receipt) {
            return receipt.kind === "topic-receipt" && receipt.label === topic;
          })
          .map(function (receipt) {
            return receipt.id;
          });
        if (matches.length) {
          addEdge(
            sourceEntry.id,
            topicEntry.id,
            "discusses-topic",
            matches,
            matches.length,
            "Caption-derived topic lane."
          );
        }
      });

      characterEntries.forEach(function (characterEntry) {
        var matches = characterEntry.receiptIds.filter(function (receiptId) {
          return receiptMap.get(receiptId).sourceId === sourceId;
        });
        if (matches.length) {
          addEdge(
            characterEntry.id,
            sourceEntry.id,
            characterEntry.kind === "candidate-character"
              ? "candidate-performance-in"
              : "performed-in",
            matches,
            matches.length * 3,
            characterEntry.kind === "candidate-character"
              ? "Performance receipt exists; performer identity is not verified."
              : "Manually curated character-performance receipts."
          );
        }
      });
    });

    bitEntries.forEach(function (bitEntry) {
      var characterEntry = nodeMap.get(bitEntry.details.characterEntryId);
      if (characterEntry) {
        addEdge(
          characterEntry.id,
          bitEntry.id,
          "exhibits-behavior-pattern",
          bitEntry.receiptIds,
          Math.max(2, bitEntry.receiptIds.length * 4),
          "Curated behavior pattern with linked performance receipts."
        );
      }
      new Set(
        bitEntry.receiptIds.map(function (receiptId) {
          return receiptMap.get(receiptId).sourceId;
        })
      ).forEach(function (sourceId) {
        addEdge(
          bitEntry.id,
          "source:" + sourceId,
          "evidenced-in",
          bitEntry.receiptIds.filter(function (receiptId) {
            return receiptMap.get(receiptId).sourceId === sourceId;
          }),
          4,
          "Timestamped evidence for this behavior pattern."
        );
      });
    });

    motifEntries.forEach(function (motifEntry) {
      var characterEntry = nodeMap.get(motifEntry.details.characterEntryId);
      if (characterEntry && motifEntry.receiptIds.length) {
        addEdge(
          characterEntry.id,
          motifEntry.id,
          "uses-recurring-motif",
          motifEntry.receiptIds,
          Math.max(1, number(motifEntry.metrics.indexedHits, 1)),
          "Caption trigger signal with curated receipts where available."
        );
      }
      new Set(
        motifEntry.receiptIds.map(function (receiptId) {
          return receiptMap.get(receiptId).sourceId;
        })
      ).forEach(function (sourceId) {
        addEdge(
          motifEntry.id,
          "source:" + sourceId,
          "motif-receipt-in",
          motifEntry.receiptIds.filter(function (receiptId) {
            return receiptMap.get(receiptId).sourceId === sourceId;
          }),
          3,
          "Verified performance receipt carrying this motif."
        );
      });
    });

    function lineageEvents(receiptIds, limit) {
      var selected = selectLineageReceipts(
        receiptIds.map(function (id) {
          return receiptMap.get(id);
        }),
        limit
      );
      return selected.map(function (receipt, index) {
        return {
          receiptId: receipt.id,
          role:
            index === 0
              ? "earliest-in-indexed-archive"
              : index === selected.length - 1
                ? "latest-indexed-receipt"
                : "supporting-indexed-receipt",
          date: receipt.date,
          sourceId: receipt.sourceId,
          sourceTitle: receipt.sourceTitle,
          t: receipt.t,
          url: receipt.url,
          excerpt: receipt.quote,
          label: receipt.label,
          strength: receipt.strength
        };
      });
    }

    function addLineage(entry, limit) {
      if (!entry || !entry.receiptIds.length) return;
      var events = lineageEvents(entry.receiptIds, limit || 12);
      if (!events.length) return;
      lineages.push({
        id: "lineage:" + entry.id,
        subjectId: entry.id,
        subjectKind: entry.kind,
        title: entry.name + " · indexed evidence trail",
        archiveFirstLabel: "EARLIEST IN INDEXED ARCHIVE",
        earliestIndexedReceipt: events[0],
        latestIndexedReceipt: events[events.length - 1],
        trueOriginClaim: false,
        disclaimer: ORIGIN_DISCLAIMER,
        evidenceCount: entry.receiptIds.length,
        sourceCount: entry.metrics.sources,
        events: events
      });
    }

    characterEntries.forEach(function (entry) {
      addLineage(entry, 20);
    });
    bitEntries.forEach(function (entry) {
      addLineage(entry, 12);
    });
    motifEntries.forEach(function (entry) {
      addLineage(entry, 12);
    });
    categoryEntries.forEach(function (entry) {
      addLineage(entry, 12);
    });
    franchiseEntries.forEach(function (entry) {
      var sourceOpeningIds = entry.details.sourceIds.map(function (sourceId) {
        return sourceReceiptIds.get(sourceId);
      });
      addLineage(Object.assign({}, entry, { receiptIds: sourceOpeningIds }), 20);
    });

    var edges = Array.from(edgeMap.values());

    function buildConstellation(entry, kind) {
      var connectedEdges = edges
        .filter(function (edge) {
          return edge.from === entry.id || edge.to === entry.id;
        })
        .sort(function (a, b) {
          return b.weight - a.weight;
        });
      var nodeIds = unique(
        [entry.id].concat(
          connectedEdges.flatMap(function (edge) {
            return [edge.from, edge.to];
          })
        )
      );
      var receiptIds = unique(
        connectedEdges.flatMap(function (edge) {
          return edge.receiptIds;
        })
      );
      return {
        id: "constellation:" + entry.id,
        name: entry.name,
        kind: kind || entry.kind,
        anchorNodeId: entry.id,
        nodeIds: nodeIds,
        edgeIds: connectedEdges.map(function (edge) {
          return edge.id;
        }),
        receiptIds: receiptIds,
        description:
          formatCount(nodeIds.length - 1) +
          " connected lore nodes backed by " +
          formatCount(receiptIds.length) +
          " playable receipts.",
        discoveryPrompt:
          "Open " + entry.name + " and follow one evidence-backed connection you did not know existed."
      };
    }

    var constellations = [];
    characterEntries.forEach(function (entry) {
      constellations.push(buildConstellation(entry, "character-system"));
    });
    franchiseEntries.forEach(function (entry) {
      constellations.push(buildConstellation(entry, "franchise-system"));
    });
    Array.from(categoryEntries.values())
      .sort(function (a, b) {
        return b.metrics.receipts - a.metrics.receipts;
      })
      .slice(0, 6)
      .forEach(function (entry) {
        constellations.push(buildConstellation(entry, "comedy-category"));
      });
    eraEntries.forEach(function (entry) {
      constellations.push(buildConstellation(entry, "archive-era"));
    });

    var prompts = [];
    function addPrompt(raw) {
      prompts.push(
        Object.assign(
          {
            id: "prompt:" + (prompts.length + 1),
            receiptRequired: true
          },
          raw
        )
      );
    }

    characterEntries.forEach(function (entry) {
      addPrompt({
        prompt:
          "Find the earliest indexed " +
          entry.name +
          " performance, then show how the recurring moves change across later receipts.",
        mode: "lineage",
        targetIds: [entry.id],
        payoff: "A source-backed character evolution trail, not an invented origin story."
      });
    });
    franchiseEntries.forEach(function (entry) {
      var sourceIds = entry.details.sourceIds;
      var deepestSource = sourceIds
        .map(function (sourceId) {
          return sourceEntries.get(sourceId);
        })
        .sort(function (a, b) {
          return b.deepCutScore - a.deepCutScore;
        })[0];
      addPrompt({
        prompt:
          "Enter the " +
          entry.name +
          " shelf through its deepest indexed cut and work back toward the obvious classics.",
        mode: "deep-cut-path",
        targetIds: [entry.id, deepestSource.id],
        payoff: "The franchise through archive rarity instead of upload order."
      });
    });
    Array.from(categoryEntries.values())
      .sort(function (a, b) {
        return b.metrics.receipts - a.metrics.receipts;
      })
      .slice(0, 5)
      .forEach(function (entry) {
        addPrompt({
          prompt:
            "Give me the earliest, hottest, and most recent indexed " +
            entry.name +
            " receipts. Make the archive defend the category.",
          mode: "category-triple",
          targetIds: [entry.id],
          payoff: "Three playable receipts across time."
        });
      });
    Array.from(topicEntries.values())
      .sort(function (a, b) {
        return b.deepCutScore - a.deepCutScore;
      })
      .slice(0, 5)
      .forEach(function (entry) {
        addPrompt({
          prompt:
            "Take me to a deep-cut " +
            entry.name +
            " discussion, then show the nearest comedy spike in the same stream.",
          mode: "topic-to-comedy",
          targetIds: [entry.id],
          payoff: "A topic lane with an adjacent laugh or nuclear take."
        });
      });
    eraEntries.forEach(function (entry) {
      addPrompt({
        prompt:
          "Drop me into " +
          entry.name +
          " and show one character receipt, one franchise receipt, and one room-breaking moment if the evidence exists.",
        mode: "era-sampler",
        targetIds: [entry.id],
        payoff: "A cross-section of the indexed period, with gaps admitted."
      });
    });

    var entryMap = new Map(
      fieldEntries.map(function (entry) {
        return [entry.id, entry];
      })
    );
    var lineageMap = new Map(
      lineages.map(function (lineage) {
        return [lineage.subjectId, lineage];
      })
    );

    function getFieldGuide(filters) {
      var request = filters || {};
      var kinds = request.kind
        ? new Set(array(request.kind).length ? request.kind : [request.kind])
        : null;
      var status = request.status || null;
      var sorted = fieldEntries.filter(function (entry) {
        return (!kinds || kinds.has(entry.kind)) && (!status || entry.status === status);
      });
      var order = request.sort || "name";
      sorted.sort(function (a, b) {
        if (order === "deep-cut") return b.deepCutScore - a.deepCutScore || a.name.localeCompare(b.name);
        if (order === "evidence") return b.receiptIds.length - a.receiptIds.length || a.name.localeCompare(b.name);
        if (order === "oldest") {
          return (
            ((a.archiveFirst && a.archiveFirst.date) || "9999").localeCompare(
              (b.archiveFirst && b.archiveFirst.date) || "9999"
            ) || a.name.localeCompare(b.name)
          );
        }
        return a.name.localeCompare(b.name);
      });
      return request.limit ? sorted.slice(0, request.limit) : sorted;
    }

    function search(query, filters) {
      var normalizedQuery = clean(query).toLowerCase();
      var words = normalizedQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (!words.length) return getFieldGuide(filters).slice(0, number(filters && filters.limit, 20));
      var request = filters || {};
      var candidates = getFieldGuide({ kind: request.kind });
      return candidates
        .map(function (entry) {
          var haystack = [
            entry.name,
            entry.kicker,
            entry.summary,
            entry.editorialFlavor,
            entry.aliases.join(" "),
            entry.tags.join(" "),
            JSON.stringify(entry.details)
          ]
            .join(" ")
            .toLowerCase();
          var score = words.reduce(function (sum, word) {
            var nameHit = entry.name.toLowerCase().includes(word) ? 8 : 0;
            var tagHit = entry.tags.join(" ").toLowerCase().includes(word) ? 3 : 0;
            return sum + nameHit + tagHit + (haystack.includes(word) ? 1 : 0);
          }, 0);
          if (entry.name.toLowerCase() === normalizedQuery) score += 50;
          else if (entry.name.toLowerCase().startsWith(normalizedQuery)) score += 20;
          return { entry: entry, score: score };
        })
        .filter(function (result) {
          return result.score > 0;
        })
        .sort(function (a, b) {
          return b.score - a.score || b.entry.deepCutScore - a.entry.deepCutScore;
        })
        .slice(0, number(request.limit, 20))
        .map(function (result) {
          return Object.assign({ searchScore: result.score }, result.entry);
        });
    }

    function trace(entryId, traceOptions) {
      var request = traceOptions || {};
      var depth = clamp(number(request.depth, 1), 1, 3);
      var limit = clamp(number(request.limit, 40), 5, 200);
      var found = new Set([entryId]);
      var frontier = new Set([entryId]);
      var traceEdges = [];
      for (var level = 0; level < depth; level += 1) {
        var next = new Set();
        edges.forEach(function (edge) {
          if (frontier.has(edge.from) || frontier.has(edge.to)) {
            traceEdges.push(edge);
            if (!found.has(edge.from)) next.add(edge.from);
            if (!found.has(edge.to)) next.add(edge.to);
          }
        });
        var admitted = Array.from(next).slice(0, Math.max(0, limit - found.size));
        admitted.forEach(function (nodeId) {
          found.add(nodeId);
        });
        frontier = new Set(admitted);
        if (!frontier.size || found.size >= limit) break;
      }
      var validEdges = unique(
        traceEdges
          .filter(function (edge) {
            return found.has(edge.from) && found.has(edge.to);
          })
          .map(function (edge) {
            return edge.id;
          })
      ).map(function (edgeId) {
        return edgeMap.get(edgeId);
      });
      var traceReceiptIds = unique(
        validEdges.flatMap(function (edge) {
          return edge.receiptIds;
        })
      );
      return {
        center: entryMap.get(entryId) || null,
        nodes: Array.from(found)
          .map(function (nodeId) {
            return nodeMap.get(nodeId);
          })
          .filter(Boolean),
        edges: validEdges,
        receipts: traceReceiptIds
          .map(function (receiptId) {
            return receiptMap.get(receiptId);
          })
          .filter(Boolean)
      };
    }

    function getGalaxy(galaxyOptions) {
      var request = galaxyOptions || {};
      if (request.focus) return trace(request.focus, request);
      var kinds = request.kinds ? new Set(request.kinds) : null;
      var selectedNodes = kinds
        ? nodes.filter(function (node) {
            return kinds.has(node.kind);
          })
        : nodes.slice();
      if (request.limit) selectedNodes = selectedNodes.slice(0, request.limit);
      var selectedIds = new Set(
        selectedNodes.map(function (node) {
          return node.id;
        })
      );
      return {
        nodes: selectedNodes,
        edges: edges.filter(function (edge) {
          return selectedIds.has(edge.from) && selectedIds.has(edge.to);
        }),
        constellations: constellations
      };
    }

    var kindCounts = fieldEntries.reduce(function (counts, entry) {
      counts[entry.kind] = (counts[entry.kind] || 0) + 1;
      return counts;
    }, {});

    var api = {
      engine: "WWAM Lore Field Guide + Galaxy",
      version: VERSION,
      generatedFrom: "runtime archive inputs",
      scope: {
        uniqueSources: sourceMap.size,
        datedSources: Array.from(sourceMap.values()).filter(function (source) {
          return Boolean(source.date);
        }).length,
        archiveFrom: minYear,
        archiveTo: maxYear,
        groundedCharacters: array(characterLore.characters).length,
        lockedCharacterCandidates: array(characterLore.lockedCandidates).length
      },
      metrics: {
        fieldGuideEntries: fieldEntries.length,
        playableReceipts: receipts.length,
        nodes: nodes.length,
        edges: edges.length,
        constellations: constellations.length,
        lineages: lineages.length,
        discoveryPrompts: prompts.length,
        kinds: kindCounts
      },
      evidencePolicy: {
        originLabel: "EARLIEST IN INDEXED ARCHIVE",
        trueOriginClaimsMade: 0,
        disclaimer: ORIGIN_DISCLAIMER,
        performanceRule:
          "Only curated soundbytes are character performances; ordinary caption mentions are not.",
        lockedCandidateRule:
          "A recurring candidate stays locked when the archive cannot verify the performer."
      },
      deepCutModel: {
        range: [0, 100],
        meaning: "Higher means rarer within this indexed archive, not objectively better.",
        weights: {
          archiveRarity: 0.5,
          receiptSpecificity: 0.2,
          archiveAge: 0.15,
          sourceVisibility: 0.15
        },
        tiers: ["FRONT-DOOR LORE", "FAN TEST", "DEEP SHELF", "BASEMENT TAPE"]
      },
      fieldGuide: fieldEntries,
      lineages: lineages,
      galaxy: {
        nodes: nodes,
        edges: edges,
        constellations: constellations
      },
      discoveryPrompts: prompts,
      receipts: receipts,
      getFieldGuide: getFieldGuide,
      getEntry: function (entryId) {
        return entryMap.get(entryId) || null;
      },
      getReceipt: function (receiptId) {
        return receiptMap.get(receiptId) || null;
      },
      getLineage: function (entryId) {
        return lineageMap.get(entryId) || null;
      },
      getGalaxy: getGalaxy,
      getConstellation: function (constellationId) {
        return (
          constellations.find(function (constellation) {
            return constellation.id === constellationId;
          }) || null
        );
      },
      getDiscoveryPrompts: function (promptOptions) {
        var request = promptOptions || {};
        var filtered = request.mode
          ? prompts.filter(function (prompt) {
              return prompt.mode === request.mode;
            })
          : prompts.slice();
        return request.limit ? filtered.slice(0, request.limit) : filtered;
      },
      search: search,
      trace: trace
    };

    return api;
  }

  root.WWAMLoreEngine = Object.freeze({
    VERSION: VERSION,
    ORIGIN_DISCLAIMER: ORIGIN_DISCLAIMER,
    create: create,
    youtubeUrl: youtubeUrl
  });
})(typeof window !== "undefined" ? window : globalThis);
