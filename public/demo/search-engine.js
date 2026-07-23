(function (global) {
  "use strict";

  var STOP_WORDS = [
    "what", "which", "where", "when", "who", "they", "them", "their", "that",
    "this", "about", "with", "from", "have", "does", "did", "show", "find",
    "movie", "moment", "thing", "things", "said", "say", "tell", "give",
  ];

  var EXPANSIONS = {
    "wild": ["deranged", "crazy", "unhinged", "out of pocket", "up in ya", "full send"],
    "crazy": ["wild", "deranged", "unhinged", "out of pocket", "up in ya"],
    "deranged": ["wild", "crazy", "unhinged", "out of pocket", "up in ya"],
    "fucked": ["out of pocket", "up in ya", "full send"],
    "funny": ["laugh", "hilarious", "breakdown", "the room breaks", "up in ya"],
    "funniest": ["laugh", "hilarious", "breakdown", "the room breaks", "up in ya"],
    "hate": ["worst", "garbage", "trash", "awful", "sucks", "franchise felony", "take gets nuclear"],
    "hated": ["worst", "garbage", "trash", "awful", "sucks", "franchise felony", "take gets nuclear"],
    "bad": ["worst", "garbage", "trash", "terrible", "franchise felony", "take gets nuclear"],
    "love": ["best", "favorite", "amazing", "love letter"],
    "loved": ["best", "favorite", "amazing", "love letter"],
    "topic": ["talk", "discuss", "mention", "chapter"],
    "talk": ["topic", "discuss", "mention"],
    "discuss": ["topic", "talk", "mention"],
    "latest": ["recent", "newest", "today"],
    "recent": ["latest", "newest", "today"],
    "live": ["livestream", "stream"],
  };

  var CATEGORY_INTENTS = {
    negative: ["FRANCHISE FELONY", "TAKE GETS NUCLEAR"],
    positive: ["LOVE LETTER"],
    comedy: ["OUT OF POCKET", "UP IN YA", "FULL SEND", "THE ROOM BREAKS", "BREAKDOWN"],
    theory: ["THEORY BOARD"],
    kills: ["KILL ROOM"],
    chat: ["CHAT DID THIS"],
  };

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function unique(values) {
    return values.filter(function (value, index) { return values.indexOf(value) === index; });
  }

  function tokens(value) {
    return unique(normalize(value).split(" ").filter(function (word) {
      return word.length > 2 && STOP_WORDS.indexOf(word) < 0;
    }));
  }

  function includesAny(haystack, needles) {
    return needles.some(function (needle) { return haystack.indexOf(needle) >= 0; });
  }

  function parseIntent(query) {
    var q = normalize(query);
    var intent = "discovery";
    if (includesAny(q, ["highest", "lowest", "most unhinged", "rank", "ranking"])) intent = "ranking";
    else if (includesAny(q, ["hate", "hated", "worst", "bad", "sucks", "trash", "garbage"])) intent = "negative";
    else if (includesAny(q, ["love", "loved", "best", "favorite", "amazing"])) intent = "positive";
    else if (includesAny(q, ["funny", "funniest", "laugh", "deranged", "wild", "crazy", "fucked", "soundbyte"])) intent = "comedy";
    else if (includesAny(q, ["theory", "predict", "prediction", "called it"])) intent = "theory";
    else if (includesAny(q, ["kill", "death", "murder", "stab"])) intent = "kills";
    else if (includesAny(q, ["talk about", "discuss", "mention", "topic", "jump to", "say about", "said about", "think about", "what did they say"])) intent = "topic";

    var source = includesAny(q, ["live", "livestream", "stream", "recent show", "newest show"]) ? "livestream" :
      includesAny(q, ["commentary", "watchalong", "tape"]) ? "commentary" : "all";
    var temporal = includesAny(q, ["latest", "newest", "most recent", "today", "last night"]) ? "latest" :
      q.indexOf("recent") >= 0 ? "recent" : "all";
    return {
      name: intent,
      source: source,
      temporal: temporal,
      refusesSpeakerGuess: q.indexOf("who ") === 0 || q.indexOf(" who ") >= 0,
      normalized: q,
      words: tokens(q),
    };
  }

  function aliasDefinitions(catalog, live) {
    var aliases = [
      { type: "film", label: "A Nightmare on Elm Street (2010)", id: "qTQdWKcwn4A", aliases: ["elm street remake", "nightmare remake", "freddy remake", "elm street 2010"] },
      { type: "film", label: "Jason X", id: "LiTEaN8mpl8", aliases: ["jason in space", "space jason", "jason x"] },
      { type: "film", label: "Rob Zombie's Halloween II", id: "AzrcgoyE7C4", aliases: ["rob zombie halloween 2", "rob zombies halloween 2", "rz halloween 2"] },
      { type: "film", label: "Scream (2022)", id: "hQu1Y1GZozI", aliases: ["scream 5", "scream 2022"] },
      { type: "film", label: "Scream VI", id: "ISDlaQ9DWSM", aliases: ["scream 6", "scream vi"] },
      { type: "franchise", label: "Halloween", franchise: "Halloween", aliases: ["halloween", "michael myers", "myers", "loomis"] },
      { type: "franchise", label: "Friday the 13th", franchise: "Friday the 13th", aliases: ["friday the 13th", "jason voorhees", "crystal lake", "jason"] },
      { type: "franchise", label: "Scream", franchise: "Scream", aliases: ["scream", "ghostface", "sidney prescott"] },
      { type: "franchise", label: "A Nightmare on Elm Street", franchise: "A Nightmare on Elm Street", aliases: ["nightmare on elm street", "elm street", "freddy krueger", "freddy"] },
    ];
    catalog.forEach(function (item) {
      var film = normalize(item.film).replace(/\b19\d\d\b|\b20\d\d\b/g, "").replace(/\s+/g, " ").trim();
      var franchise = normalize(item.franchise);
      if (film.length >= 5 && film !== franchise && film.split(" ").length > 1) {
        aliases.push({ type: "film", label: item.film, id: item.id, aliases: [film] });
      }
    });
    (live.topicIndex || []).forEach(function (topic) {
      aliases.push({ type: "topic", label: topic.name, topic: topic.name, aliases: [normalize(topic.name)] });
    });
    return aliases;
  }

  function identifyEntity(query, aliases, intent) {
    var q = normalize(query);
    var matches = [];
    aliases.forEach(function (definition) {
      definition.aliases.forEach(function (alias) {
        var normalizedAlias = normalize(alias);
        if (q.indexOf(normalizedAlias) >= 0) {
          matches.push({ definition: definition, length: normalizedAlias.length });
        }
      });
    });
    matches.sort(function (a, b) {
      if (b.length !== a.length) return b.length - a.length;
      if (intent && intent.source === "livestream") {
        if (a.definition.type === "topic" && b.definition.type !== "topic") return -1;
        if (b.definition.type === "topic" && a.definition.type !== "topic") return 1;
      }
      return a.definition.type === "film" ? -1 : 1;
    });
    return matches.length ? matches[0].definition : null;
  }

  function expandedTerms(intent) {
    var all = intent.words.slice();
    intent.words.forEach(function (word) {
      (EXPANSIONS[word] || []).forEach(function (expanded) {
        all = all.concat(tokens(expanded));
      });
    });
    return unique(all);
  }

  function commentaryCandidates(catalog, deep) {
    var tapeById = {};
    var hotRankById = {};
    (deep.tapes || []).forEach(function (tape) { tapeById[tape.id] = tape; });
    (deep.hot100 || []).forEach(function (moment) { hotRankById[moment.id] = moment.rank; });
    var output = [];
    catalog.forEach(function (item) {
      var tape = tapeById[item.id] || { moments: [], unhinged: 0, verdict: "", wordsAudited: 0 };
      output.push({
        key: "tape-" + item.id,
        kind: "tape",
        source: "commentary",
        sourceId: item.id,
        title: item.film,
        subtitle: item.franchise,
        franchise: item.franchise,
        date: item.date,
        at: 0,
        category: "TAPE AUTOPSY",
        excerpt: tape.verdict || "Source tape available.",
        url: item.url,
        unhinged: tape.unhinged || 0,
        tape: tape,
      });
      (tape.moments || []).forEach(function (moment) {
        output.push({
          key: "moment-" + moment.id,
          kind: "moment",
          source: "commentary",
          sourceId: item.id,
          title: item.film,
          subtitle: item.franchise,
          franchise: item.franchise,
          date: item.date,
          at: moment.t,
          category: moment.category,
          excerpt: moment.quote,
          url: item.url + "&t=" + moment.t + "s",
          unhinged: tape.unhinged || 0,
          heat: moment.score || 0,
          hotRank: hotRankById[moment.id] || null,
          tape: tape,
        });
      });
    });
    return output;
  }

  function liveCandidates(live) {
    var output = [];
    (live.streams || []).forEach(function (stream, streamIndex) {
      output.push({
        key: "live-" + stream.id,
        kind: "livestream",
        source: "livestream",
        sourceId: stream.id,
        title: stream.title,
        subtitle: "WWAM LIVE",
        franchise: "",
        date: stream.date,
        at: 0,
        category: "LIVE MAP",
        excerpt: stream.summary,
        url: stream.url,
        streamRank: streamIndex,
        stream: stream,
      });
      (stream.topics || []).forEach(function (topic) {
        output.push({
          key: "topic-" + stream.id + "-" + normalize(topic.name),
          kind: "topic",
          source: "livestream",
          sourceId: stream.id,
          title: topic.name,
          subtitle: stream.title,
          franchise: "",
          date: stream.date,
          at: topic.peak,
          category: "TOPIC CHAPTER",
          excerpt: topic.receipt,
          mentions: topic.mentions,
          url: stream.url + "&t=" + topic.peak + "s",
          streamRank: streamIndex,
          stream: stream,
        });
      });
      (stream.moments || []).forEach(function (moment, momentIndex) {
        output.push({
          key: "live-moment-" + stream.id + "-" + moment.t,
          kind: "moment",
          source: "livestream",
          sourceId: stream.id,
          title: stream.title,
          subtitle: "FRESH FROM LIVE",
          franchise: "",
          date: stream.date,
          at: moment.t,
          category: moment.category,
          excerpt: moment.quote,
          heat: moment.heat,
          url: stream.url + "&t=" + moment.t + "s",
          streamRank: streamIndex,
          momentRank: momentIndex,
          stream: stream,
        });
      });
    });
    return output;
  }

  function entityMatches(candidate, entity) {
    if (!entity) return false;
    if (entity.type === "film") return candidate.sourceId === entity.id;
    if (entity.type === "franchise") {
      return candidate.franchise === entity.franchise ||
        normalize(candidate.title + " " + candidate.subtitle).indexOf(normalize(entity.label)) >= 0;
    }
    return normalize(candidate.title) === normalize(entity.topic);
  }

  function scoreCandidate(candidate, intent, entity, terms) {
    var title = normalize(candidate.title);
    var subtitle = normalize(candidate.subtitle);
    var excerpt = normalize(candidate.excerpt);
    var category = normalize(candidate.category);
    var score = 1;
    var reasons = [];

    if (entityMatches(candidate, entity)) {
      score += entity.type === "film" ? 145 : entity.type === "topic" ? 115 : 80;
      reasons.push(entity.type === "film" ? "exact film" : entity.type === "topic" ? "exact topic" : "franchise match");
    } else if (entity && entity.type === "franchise" && candidate.franchise === entity.franchise) {
      score += 45;
      reasons.push("same franchise");
    }

    terms.forEach(function (term) {
      if (title.indexOf(term) >= 0) score += 18;
      if (subtitle.indexOf(term) >= 0) score += 8;
      if (category.indexOf(term) >= 0) score += 14;
      if (excerpt.indexOf(term) >= 0) score += 5;
    });

    if (intent.source !== "all") {
      if (candidate.source === intent.source) {
        score += 42;
        reasons.push(intent.source === "livestream" ? "live-source request" : "commentary-source request");
      } else {
        score -= 28;
      }
    }

    if (intent.temporal === "latest") {
      if (candidate.source === "livestream") {
        score += Math.max(0, 90 - (candidate.streamRank || 0) * 18);
        reasons.push((candidate.streamRank || 0) === 0 ? "newest stream" : "recent stream");
      } else {
        score -= 20;
      }
    } else if (intent.temporal === "recent" && candidate.source === "livestream") {
      score += Math.max(0, 48 - (candidate.streamRank || 0) * 6);
      reasons.push("recent stream");
    }

    var desiredCategories = CATEGORY_INTENTS[intent.name] || [];
    if (desiredCategories.indexOf(candidate.category) >= 0) {
      score += 58;
      reasons.push(intent.name + " evidence");
    }
    if (intent.name === "topic" && candidate.kind === "topic") {
      score += 65;
      reasons.push("topic chapter");
    }
    if (intent.name === "ranking" && candidate.kind === "tape") {
      score += candidate.unhinged || 0;
      reasons.push("Unhinged Index");
    }
    if (intent.name === "comedy" && candidate.heat) score += candidate.heat * .42;
    if (intent.name === "comedy" && candidate.hotRank) score += Math.max(0, 46 - candidate.hotRank * .45);
    if (candidate.kind === "moment" || candidate.kind === "topic") score += 10;

    return { score: score, reasons: unique(reasons).slice(0, 3) };
  }

  function resultLabel(candidate) {
    if (candidate.source === "livestream") {
      return candidate.kind === "topic" ? "LIVE TOPIC JUMP" :
        candidate.kind === "moment" ? "LIVE COMEDY HIT" : "LIVESTREAM MAP";
    }
    return candidate.kind === "moment" ? "COMMENTARY RECEIPT" : "TAPE AUTOPSY";
  }

  function buildAnswer(intent, entity, ranked, live) {
    if (!ranked.length) {
      return "I couldn't find a defensible source match in the current commentary and livestream scope. Try a film, franchise, topic, opinion, or recency cue.";
    }
    var top = ranked[0];
    var time = top.at ? " at " + formatTime(top.at) : "";
    var entityLabel = entity ? entity.label : top.title;
    if (intent.refusesSpeakerGuess) {
      return "The auto-captions do not identify speakers reliably, so I won't invent a name. The strongest source receipt is " + top.title + time + ".";
    }
    if (intent.name === "ranking") {
      return "Direct answer: " + top.title + " is the strongest ranking match, with an Unhinged Index of " + (top.unhinged || "—") + ".";
    }
    if (intent.name === "negative") {
      return "Direct answer: the strongest negative receipt for " + entityLabel + " is in " + top.title + time + ".";
    }
    if (intent.name === "positive") {
      return "Direct answer: the strongest positive receipt for " + entityLabel + " is in " + top.title + time + ".";
    }
    if (intent.name === "topic" && top.kind === "topic") {
      var aggregate = (live.topicIndex || []).filter(function (topic) {
        return normalize(topic.name) === normalize(top.title);
      })[0];
      return "Yes. " + top.title + " appears across " + (aggregate ? aggregate.streams.length : 1) +
        " recent stream" + (aggregate && aggregate.streams.length !== 1 ? "s" : "") +
        ". The densest matching chapter is " + top.subtitle + time + ".";
    }
    if (intent.name === "comedy") {
      return "Fastest route to chaos: " + top.title + time + ", filed as " + top.category + ".";
    }
    if (intent.temporal === "latest" && top.source === "livestream") {
      return "Newest-source answer: " + top.title + (top.at ? " jumps to " + formatTime(top.at) : "") + ".";
    }
    return "Best-supported answer: " + top.title + time + ". The engine ranked the source receipt before related collateral damage.";
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.round(seconds || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = String(total % 60).padStart(2, "0");
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : minutes) + ":" + secs;
  }

  function create(catalog, deep, live, curated) {
    catalog = catalog || [];
    deep = deep || { tapes: [] };
    live = live || { streams: [], topicIndex: [] };
    curated = curated || { upInYa: [] };
    var aliases = aliasDefinitions(catalog, live);
    var candidates = commentaryCandidates(catalog, deep).concat(liveCandidates(live));
    var curatedRanks = {};
    (curated.upInYa || []).forEach(function (item, index) {
      curatedRanks[item.source + "|" + item.id + "|" + item.t] = index + 1;
    });
    candidates.forEach(function (candidate) {
      candidate.curatedRank = curatedRanks[candidate.source + "|" + candidate.sourceId + "|" + candidate.at] || null;
    });

    return {
      ask: function (query) {
        var intent = parseIntent(query);
        var entity = identifyEntity(query, aliases, intent);
        var terms = expandedTerms(intent);
        var ranked = candidates.map(function (candidate) {
          var scored = scoreCandidate(candidate, intent, entity, terms);
          if (intent.name === "comedy" && candidate.curatedRank) {
            scored.score += Math.max(25, 88 - candidate.curatedRank * 2.5);
            scored.reasons = unique(["human-curated soundbyte"].concat(scored.reasons)).slice(0, 3);
          }
          return Object.assign({}, candidate, scored);
        }).filter(function (candidate) {
          if (candidate.score <= 7) return false;
          if (entity && entity.type === "film" && candidate.source === "commentary" && candidate.sourceId !== entity.id) {
            return candidate.score >= 55;
          }
          return true;
        }).sort(function (a, b) {
          return b.score - a.score ||
            (b.heat || 0) - (a.heat || 0) ||
            (b.unhinged || 0) - (a.unhinged || 0);
        });

        var deduped = [];
        var seen = {};
        ranked.forEach(function (candidate) {
          var key = candidate.source + "|" + candidate.sourceId + "|" + candidate.kind;
          if (seen[key]) return;
          seen[key] = true;
          deduped.push(candidate);
        });
        deduped = deduped.slice(0, 7);
        var topScore = deduped.length ? deduped[0].score : 0;
        var secondScore = deduped.length > 1 ? deduped[1].score : 0;
        var confidence = Math.max(36, Math.min(99, Math.round(54 + topScore * .12 + Math.max(0, topScore - secondScore) * .18)));
        return {
          query: query,
          intent: intent.name,
          source: intent.source,
          temporal: intent.temporal,
          entity: entity ? entity.label : null,
          confidence: confidence,
          answer: buildAnswer(intent, entity, deduped, live),
          results: deduped.map(function (candidate) {
            return Object.assign({}, candidate, { label: resultLabel(candidate) });
          }),
        };
      },
      aliases: aliases,
      candidateCount: candidates.length,
    };
  }

  global.WWAMSearchEngine = { create: create, normalize: normalize, parseIntent: parseIntent };
})(window);
