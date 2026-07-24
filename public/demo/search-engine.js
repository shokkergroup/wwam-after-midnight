(function (global) {
  "use strict";

  /*
   * Ask WWAM is a deterministic retrieval layer, not a free-form chatbot.
   *
   * Its contract is intentionally boring in the best way: every answer must be
   * reconstructable from an indexed YouTube source, and uncertainty must stay
   * visible. The UI only relies on create().ask(), but the extra explanation
   * fields below make the same engine useful to future editorial tools.
   */

  var STOP_WORDS = [
    "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can",
    "could", "do", "does", "did", "for", "from", "give", "had", "has", "have",
    "how", "i", "in", "into", "is", "it", "me", "movie", "of", "on", "or",
    "say", "said", "show", "tell", "that", "the", "their", "them", "they",
    "thing", "things", "this", "to", "was", "were", "what", "when", "where",
    "which", "who", "why", "will", "with", "would", "you",
  ];

  var QUERY_CUE_WORDS = [
    "about", "again", "anything", "archive", "archived", "began", "begin", "best", "biggest",
    "bit", "called", "caption", "captions", "change", "changed", "chapter",
    "clip", "commentary", "crazy", "criticize", "criticized", "deranged",
    "discuss", "discussed", "earliest", "ever", "evidence", "favorite",
    "first", "foundational", "fresh", "funniest", "funny", "garbage", "hate",
    "hated", "highest", "index", "indexed", "last", "latest", "laugh", "like",
    "liked", "live", "livestream", "love", "loved", "lowest", "mention",
    "mentioned", "moment", "most", "newest", "oldest", "one", "ones",
    "opinion", "popular", "ranking", "receipt", "recent", "recently", "score",
    "something", "soundbyte", "source", "start", "started", "stream", "talk", "talked", "tape",
    "think", "topic", "trash", "unhinged", "viewed", "views", "watchalong",
    "watched", "wild", "worst",
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
    "criticize": ["worst", "garbage", "trash", "awful", "franchise felony", "take gets nuclear"],
    "criticized": ["worst", "garbage", "trash", "awful", "franchise felony", "take gets nuclear"],
    "bad": ["worst", "garbage", "trash", "terrible", "franchise felony", "take gets nuclear"],
    "love": ["best", "favorite", "amazing", "love letter"],
    "loved": ["best", "favorite", "amazing", "love letter"],
    "like": ["favorite", "amazing", "love letter"],
    "liked": ["favorite", "amazing", "love letter"],
    "topic": ["talk", "discuss", "mention", "chapter"],
    "talk": ["topic", "discuss", "mention"],
    "talked": ["topic", "discuss", "mention"],
    "discuss": ["topic", "talk", "mention"],
    "latest": ["recent", "newest", "today"],
    "recent": ["latest", "newest", "today"],
    "live": ["livestream", "stream"],
    "popular": ["most viewed", "biggest", "foundational", "top stream"],
  };

  var CATEGORY_INTENTS = {
    negative: ["FRANCHISE FELONY", "TAKE GETS NUCLEAR"],
    positive: ["LOVE LETTER"],
    comedy: ["OUT OF POCKET", "UP IN YA", "FULL SEND", "THE ROOM BREAKS", "BREAKDOWN"],
    theory: ["THEORY BOARD"],
    kills: ["KILL ROOM"],
    chat: ["CHAT DID THIS"],
  };

  var TAKE_EVIDENCE_CATEGORIES = [
    "LOVE LETTER",
    "FRANCHISE FELONY",
    "TAKE GETS NUCLEAR",
  ];

  var EVALUATIVE_TERMS = [
    "love", "loved", "favorite", "amazing", "awesome", "beautiful", "perfect",
    "great", "good", "excellent", "enjoy", "hate", "hated", "worst", "awful",
    "terrible", "trash", "garbage", "sucks", "suck", "bad", "stupid", "dumb",
    "ruined", "boring", "ugly", "not good", "dont like", "didnt like", "i like",
  ];

  var TAKE_TARGET_TERMS = [
    "movie", "film", "franchise", "installment", "sequel", "prequel", "remake",
    "reboot", "scene", "sequence", "ending", "opening", "story", "plot", "script",
    "writing", "direction", "directing", "performance", "acting", "score", "music",
    "soundtrack", "shot", "cinematography", "mask", "part", "effect", "effects",
    "dialogue", "pacing", "tone", "design", "edit", "editing",
  ];

  var QUERY_EXAMPLES = [
    "Which commentary has the highest Unhinged Index?",
    "What is the most-viewed Halloween livestream?",
    "Which Scream commentary is newest?",
    "When did Batman come up most recently?",
    "Where is The Burp Defense?",
    "Show me indexed Dr. Loomis character signals",
    "What do they criticize in the Elm Street remake?",
    "What is funniest in the newest livestream?",
  ];

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[\u2018\u2019']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function unique(values) {
    return values.filter(function (value, index) {
      return value && values.indexOf(value) === index;
    });
  }

  function tokens(value) {
    return unique(normalize(value).split(" ").filter(function (word) {
      return word.length > 1 && STOP_WORDS.indexOf(word) < 0;
    }));
  }

  function includesAny(haystack, needles) {
    return needles.some(function (needle) { return haystack.indexOf(needle) >= 0; });
  }

  function beginsWithAny(value, prefixes) {
    return prefixes.some(function (prefix) {
      return value === prefix || value.indexOf(prefix + " ") === 0;
    });
  }

  function parseIntent(query) {
    var q = normalize(query);
    var sourceExplicit = false;
    var source = "all";
    if (includesAny(q, ["commentary", "watchalong", "watch along", "tape autopsy"])) {
      source = "commentary";
      sourceExplicit = true;
    } else if (includesAny(q, ["livestream", "live stream", "stream", "recent show", "newest show"])) {
      source = "livestream";
      sourceExplicit = true;
    }

    var temporal = includesAny(q, ["earliest", "oldest", "first indexed", "first time"]) ? "earliest" :
      includesAny(q, ["latest", "newest", "most recent", "last time", "today", "last night"]) ? "latest" :
        q.indexOf("recent") >= 0 ? "recent" : "all";
    var popularity = includesAny(q, [
      "popular", "most viewed", "most watched", "biggest stream", "top stream", "foundational",
    ]) ? "popular" : "all";
    var originRequest = includesAny(q, [
      "origin", "originate", "started", "start of", "began", "debut", "first ever",
      "first time", "earliest ever", "invented", "bit start", "bit begin",
    ]) || (
      includesAny(q, ["earliest", "first"]) &&
      includesAny(q, ["appearance", "bit", "character", "impression", "performance", "portrayal", "signal", "show up"])
    );
    if (originRequest && temporal === "all") temporal = "earliest";
    var trajectory = includesAny(q, [
      "opinion change", "opinion changed", "change over time", "changed over time",
      "change their mind", "changed their mind", "mind change", "reversal", "reversed",
      "then and now", "then vs now", "evolve", "evolved",
    ]) || (
      includesAny(q, ["opinion", "opinions", "take", "takes", "view", "views"]) &&
      includesAny(q, ["change", "changed", "changing", "evolve", "evolved", "shift", "shifted"])
    );
    var neutralOpinion = includesAny(q, [
      "think about", "thoughts about", "thoughts on", "opinion about", "opinion of",
      "opinion on", "take about", "take on", "feel about", "feel on",
    ]);

    var intent = "discovery";
    if (trajectory) intent = "trajectory";
    else if (includesAny(q, ["highest", "lowest", "rank", "ranking", "most popular", "most unhinged",
      "most viewed", "most watched", "biggest stream", "top stream", "foundational"])) intent = "ranking";
    else if (includesAny(q, ["hate", "hated", "worst", "bad", "sucks", "trash", "garbage", "criticize", "criticized"])) intent = "negative";
    else if (includesAny(q, ["love", "loved", "best", "favorite", "amazing", "positive about", "liked"])) intent = "positive";
    else if (neutralOpinion) intent = "opinion";
    else if (includesAny(q, ["funny", "funniest", "laugh", "deranged", "wild", "crazy", "fucked", "soundbyte"])) intent = "comedy";
    else if (includesAny(q, ["theory", "predict", "prediction", "called it"])) intent = "theory";
    else if (includesAny(q, ["kill", "death", "murder", "stab"])) intent = "kills";
    else if (includesAny(q, ["talk about", "talked about", "discuss", "mention", "topic", "jump to",
      "say about", "said about", "think about", "what did they say"])) intent = "topic";

    var namedHostAttribution = includesAny(q, [
      "what did mike", "what does mike", "mike say", "mikes take", "according to mike",
      "what did j say", "what does j say", "j said", "js take", "according to j",
      "show me j doing", "show j doing",
    ]) || (
      /(?:^| )(?:mike|mikes|j|js)(?: |$)/.test(q) &&
      includesAny(q, ["doing", "favorite", "hate", "love", "opinion", "say", "said", "take", "think", "thought"]) &&
      q.indexOf("mike myers") < 0
    );
    var questionType = beginsWithAny(q, ["who", "which host", "which one of them"]) || namedHostAttribution ? "speaker" :
      beginsWithAny(q, ["when"]) ? "when" :
        beginsWithAny(q, ["where"]) ? "where" :
          beginsWithAny(q, ["which"]) ? "which" :
            beginsWithAny(q, ["how many", "how often"]) ? "count" :
              beginsWithAny(q, ["did", "do", "does", "is", "are", "was", "were"]) ? "yes-no" :
                beginsWithAny(q, ["what", "how"]) ? "what" : "discovery";

    var liveHeatRequest = source === "livestream" && includesAny(q, [
      "chaos", "chaotic", "highest heat", "lowest heat", "hottest stream",
      "unhinged index", "unhinged score", "most unhinged", "least unhinged",
    ]);
    var metric = liveHeatRequest ? "live-heat" :
      includesAny(q, ["unhinged index", "unhinged score", "most unhinged", "least unhinged"]) ? "unhinged" :
      includesAny(q, ["most viewed", "most watched", "popular", "views"]) ? "views" :
        includesAny(q, ["most discussed", "most mentioned", "mentions", "how often"]) ? "mentions" :
          includesAny(q, ["hottest", "highest heat", "most chaotic"]) ? "heat" :
            temporal !== "all" ? "date" : "relevance";
    var direction = includesAny(q, ["lowest", "least", "earliest", "oldest"]) ? "ascending" : "descending";

    return {
      name: intent,
      source: source,
      sourceExplicit: sourceExplicit,
      temporal: temporal,
      temporalExplicit: temporal !== "all",
      popularity: popularity,
      popularityExplicit: popularity !== "all",
      questionType: questionType,
      refusesSpeakerGuess: questionType === "speaker" || includesAny(q, ["who said", "which host said", "mike or j"]),
      originRequest: originRequest,
      trajectory: trajectory,
      performanceRequested: includesAny(q, [
        "performance", "impression", "impersonation", "in character", "portrays", "portrayal",
        "doing loomis", "doing dr loomis", "doing doctor loomis", "doing challis",
        "doing dr challis", "doing doctor challis", "doing slenderman", "doing slender man",
        "doing corey feldman",
      ]),
      metric: metric,
      direction: direction,
      normalized: q,
      words: tokens(q),
    };
  }

  function romanVariant(value) {
    var roman = { i: "1", ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10" };
    return normalize(value).split(" ").map(function (word) {
      return roman[word] || word;
    }).join(" ");
  }

  function aliasDefinitions(catalog, live, curated) {
    var aliases = [
      { type: "film", label: "A Nightmare on Elm Street (2010)", id: "qTQdWKcwn4A", aliases: ["elm street remake", "nightmare remake", "freddy remake", "elm street 2010", "nightmare 2010"] },
      { type: "film", label: "Jason X", id: "LiTEaN8mpl8", aliases: ["jason in space", "space jason", "jason x"] },
      { type: "film", label: "Rob Zombie's Halloween II", id: "AzrcgoyE7C4", aliases: ["rob zombie halloween 2", "rob zombies halloween 2", "rz halloween 2"] },
      { type: "film", label: "Scream (2022)", id: "hQu1Y1GZozI", aliases: ["scream 5", "scream 2022"] },
      { type: "film", label: "Scream VI", id: "ISDlaQ9DWSM", aliases: ["scream 6", "scream vi"] },
      { type: "film", label: "Halloween (2018)", id: "3wK00_-K-Y0", aliases: ["halloween 2018"] },
      { type: "film", label: "Halloween (1978)", id: "6VXSBDZ-3WE", aliases: ["halloween 1978", "original halloween"] },
      { type: "film", label: "Friday the 13th (1980)", id: "WkYLphAdlYc", aliases: ["friday the 13th 1980", "original friday the 13th"] },
      { type: "film", label: "Friday the 13th (2009)", id: "bP5RMi24zBg", aliases: ["friday the 13th 2009", "friday remake"] },
      { type: "film", label: "A Nightmare on Elm Street (1984)", id: "7qgebnDYVi4", aliases: ["nightmare 1984", "elm street 1984", "original nightmare on elm street"] },
      { type: "franchise", label: "Halloween", franchise: "Halloween", aliases: ["halloween", "michael myers", "myers"] },
      { type: "franchise", label: "Friday the 13th", franchise: "Friday the 13th", aliases: ["friday the 13th", "jason voorhees", "crystal lake", "jason"] },
      { type: "franchise", label: "Scream", franchise: "Scream", aliases: ["scream", "ghostface", "sidney prescott"] },
      { type: "franchise", label: "A Nightmare on Elm Street", franchise: "A Nightmare on Elm Street", aliases: ["nightmare on elm street", "elm street", "freddy krueger", "freddy"] },
    ];

    catalog.forEach(function (item) {
      var full = normalize(item.film);
      var withoutYear = full.replace(/\b(?:19|20)\d\d\b/g, "").replace(/\s+/g, " ").trim();
      var franchise = normalize(item.franchise);
      var variants = [full, romanVariant(full)];
      var beforeColon = normalize(String(item.film || "").split(":")[0]);
      if (beforeColon.split(" ").length > 1) variants.push(beforeColon, romanVariant(beforeColon));
      if (withoutYear !== franchise && withoutYear.split(" ").length > 1) {
        variants.push(withoutYear, romanVariant(withoutYear));
      }
      if (item.franchise === "Friday the 13th" && item.order >= 1 && item.order <= 10) {
        variants = variants.concat([
          "friday " + item.order,
          "friday part " + item.order,
          "friday the 13th " + item.order,
          "friday the 13th part " + item.order,
        ]);
      }
      if (item.franchise === "Scream" && item.order >= 1 && item.order <= 6) {
        variants.push("scream " + item.order);
      }
      if (item.franchise === "A Nightmare on Elm Street" && item.order >= 1 && item.order <= 7) {
        variants = variants.concat(["nightmare " + item.order, "elm street " + item.order]);
      }
      if (item.franchise === "Halloween" && item.order >= 1 && item.order <= 8) {
        variants.push("halloween " + item.order);
      }
      aliases.push({
        type: "film",
        label: item.film,
        id: item.id,
        aliases: unique(variants.filter(function (variant) {
          return variant.length >= 4 && variant !== franchise;
        })),
      });
    });

    (live.topicIndex || []).forEach(function (topic) {
      aliases.push({ type: "topic", label: topic.name, topic: topic.name, aliases: [normalize(topic.name)] });
    });
    (live.characterIndex || []).forEach(function (character) {
      var label = character.character;
      var characterAliases = [normalize(label)];
      if (normalize(label) === "dr loomis") characterAliases = characterAliases.concat(["doctor loomis", "loomis bit", "loomis character", "loomis"]);
      if (normalize(label) === "dr challis") characterAliases = characterAliases.concat(["doctor challis", "challis bit", "challis character", "challis"]);
      if (normalize(label) === "slenderman") characterAliases = characterAliases.concat(["slender man", "slenderman bit", "slenderman character"]);
      if (normalize(label) === "corey feldman") characterAliases = characterAliases.concat(["feldman", "corey feldman bit", "corey character"]);
      aliases.push({
        type: "character",
        label: label,
        character: label,
        aliases: unique(characterAliases),
      });
    });
    (curated.upInYa || []).forEach(function (item) {
      var normalizedLabel = normalize(item.label);
      aliases.push({
        type: "bit",
        label: item.label,
        source: item.source,
        id: item.id,
        at: Number(item.t || 0),
        aliases: unique([
          normalizedLabel,
          normalizedLabel.replace(/^the /, ""),
        ]),
      });
    });
    return aliases;
  }

  function entityPriority(definition, intent) {
    if (definition.type === "bit") return 8;
    if (definition.type === "character") return 7;
    if (definition.type === "film") return 6;
    if (intent && intent.source === "livestream" && definition.type === "topic") return 5;
    if (intent && intent.source === "commentary" && definition.type === "franchise") return 5;
    if (intent && intent.source === "all" && definition.type === "franchise") return 5;
    if (definition.type === "topic") return 4;
    if (definition.type === "franchise") return 3;
    return 1;
  }

  function identifyEntity(query, aliases, intent) {
    var q = normalize(query);
    var matches = [];
    aliases.forEach(function (definition) {
      definition.aliases.forEach(function (alias) {
        var normalizedAlias = normalize(alias);
        if (normalizedAlias && q.indexOf(normalizedAlias) >= 0) {
          matches.push({
            definition: definition,
            alias: normalizedAlias,
            length: normalizedAlias.length,
            priority: entityPriority(definition, intent),
          });
        }
      });
    });
    matches.sort(function (a, b) {
      return b.length - a.length || b.priority - a.priority;
    });
    if (!matches.length) return null;
    return Object.assign({}, matches[0].definition, { matchedAlias: matches[0].alias });
  }

  function entityFromLabel(label, aliases, intent, preferredSource) {
    var matches = aliases.filter(function (definition) {
      return normalize(definition.label) === normalize(label);
    });
    if (!matches.length) return null;
    matches.sort(function (a, b) {
      var adjustedIntent = Object.assign({}, intent, { source: preferredSource || intent.source });
      return entityPriority(b, adjustedIntent) - entityPriority(a, adjustedIntent);
    });
    return Object.assign({}, matches[0]);
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

  function querySubjectTerms(intent) {
    return intent.words.filter(function (word) {
      return QUERY_CUE_WORDS.indexOf(word) < 0;
    });
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
        sourceTitle: item.film,
        title: item.film,
        subtitle: item.franchise,
        franchise: item.franchise,
        date: item.date,
        at: 0,
        category: "TAPE AUTOPSY",
        excerpt: tape.verdict || "Indexed source tape; no transcript-derived summary is available.",
        url: item.url,
        views: Number(item.views || 0),
        duration: Number(item.duration || 0),
        captioned: Boolean(item.transcript),
        unhinged: Number(tape.unhinged || 0),
        tape: tape,
        evidenceType: tape.verdict ? "derived-source-summary" : "source-metadata",
      });
      (tape.moments || []).forEach(function (moment) {
        output.push({
          key: "moment-" + moment.id,
          kind: "moment",
          source: "commentary",
          sourceId: item.id,
          sourceTitle: item.film,
          title: item.film,
          subtitle: item.franchise,
          franchise: item.franchise,
          date: item.date,
          at: Number(moment.t || 0),
          category: moment.category,
          excerpt: moment.quote,
          url: item.url + "&t=" + Number(moment.t || 0) + "s",
          views: Number(item.views || 0),
          captioned: Boolean(item.transcript),
          unhinged: Number(tape.unhinged || 0),
          heat: Number(moment.score || 0),
          hotRank: hotRankById[moment.id] || null,
          tape: tape,
          evidenceType: "caption-excerpt",
        });
      });
    });
    return output;
  }

  function liveHeatScore(stream) {
    var heats = (stream.moments || []).map(function (moment) {
      return Number(moment.heat || 0);
    }).filter(function (heat) {
      return heat > 0;
    }).sort(function (a, b) {
      return b - a;
    }).slice(0, 3);
    if (!heats.length) return 0;
    return Math.round(heats.reduce(function (total, heat) {
      return total + heat;
    }, 0) / heats.length);
  }

  function liveCandidates(live) {
    var output = [];
    (live.streams || []).forEach(function (stream, streamIndex) {
      var sourceSummary = stream.summary || stream.editorial || "Indexed livestream source.";
      var liveHeat = liveHeatScore(stream);
      output.push({
        key: "live-" + stream.id,
        kind: "livestream",
        source: "livestream",
        sourceId: stream.id,
        sourceTitle: stream.title,
        title: stream.title,
        subtitle: "WWAM LIVE",
        franchise: "",
        date: stream.date,
        at: 0,
        category: "LIVE MAP",
        excerpt: sourceSummary,
        url: stream.url,
        streamRank: streamIndex,
        lane: stream._lane || "fresh",
        views: Number(stream.views || 0),
        liveHeat: liveHeat,
        duration: Number(stream.duration || 0),
        captioned: Boolean(stream.captioned),
        stream: stream,
        evidenceType: "derived-source-summary",
      });
      (stream.topics || []).forEach(function (topic) {
        output.push({
          key: "topic-" + stream.id + "-" + normalize(topic.name),
          kind: "topic",
          source: "livestream",
          sourceId: stream.id,
          sourceTitle: stream.title,
          title: topic.name,
          subtitle: stream.title,
          franchise: "",
          date: stream.date,
          at: Number(topic.peak || 0),
          category: "TOPIC CHAPTER",
          excerpt: topic.receipt,
          mentions: Number(topic.mentions || 0),
          url: stream.url + "&t=" + Number(topic.peak || 0) + "s",
          streamRank: streamIndex,
          lane: stream._lane || "fresh",
          views: Number(stream.views || 0),
          liveHeat: liveHeat,
          captioned: Boolean(stream.captioned),
          stream: stream,
          evidenceType: "caption-topic-receipt",
        });
      });
      (stream.moments || []).forEach(function (moment, momentIndex) {
        output.push({
          key: "live-moment-" + stream.id + "-" + Number(moment.t || 0),
          kind: "moment",
          source: "livestream",
          sourceId: stream.id,
          sourceTitle: stream.title,
          title: stream.title,
          subtitle: "FRESH FROM LIVE",
          franchise: "",
          date: stream.date,
          at: Number(moment.t || 0),
          category: moment.category,
          excerpt: moment.quote,
          heat: Number(moment.heat || 0),
          url: stream.url + "&t=" + Number(moment.t || 0) + "s",
          streamRank: streamIndex,
          lane: stream._lane || "fresh",
          views: Number(stream.views || 0),
          liveHeat: liveHeat,
          captioned: Boolean(stream.captioned),
          momentRank: momentIndex,
          stream: stream,
          evidenceType: "caption-excerpt",
        });
      });
      (stream.characters || []).forEach(function (character, characterIndex) {
        output.push({
          key: "character-" + stream.id + "-" + normalize(character.character) + "-" + characterIndex,
          kind: "character",
          source: "livestream",
          sourceId: stream.id,
          sourceTitle: stream.title,
          title: character.character,
          subtitle: stream.title,
          franchise: "",
          date: stream.date,
          at: Number(character.t || 0),
          category: "CHARACTER SIGNAL",
          excerpt: character.receipt,
          character: character.character,
          characterStatus: character.status || "character reference",
          mentions: Number(character.mentions || 0),
          performanceCues: Number(character.performanceCues || 0),
          url: stream.url + "&t=" + Number(character.t || 0) + "s",
          streamRank: streamIndex,
          lane: stream._lane || "popular",
          views: Number(stream.views || 0),
          liveHeat: liveHeat,
          captioned: Boolean(stream.captioned),
          stream: stream,
          evidenceType: "caption-character-signal",
        });
      });
    });
    return output;
  }

  function entityMatches(candidate, entity) {
    if (!entity) return false;
    if (entity.type === "film") return candidate.source === "commentary" && candidate.sourceId === entity.id;
    if (entity.type === "franchise") {
      return candidate.franchise === entity.franchise ||
        (candidate.source === "livestream" && candidate.kind === "topic" &&
          normalize(candidate.title) === normalize(entity.label)) ||
        (candidate.kind === "livestream" &&
          normalize(candidate.title + " " + candidate.subtitle).indexOf(normalize(entity.label)) >= 0);
    }
    if (entity.type === "topic") {
      return candidate.source === "livestream" && candidate.kind === "topic" &&
        normalize(candidate.title) === normalize(entity.topic);
    }
    if (entity.type === "character") {
      return candidate.kind === "character" &&
        normalize(candidate.character) === normalize(entity.character);
    }
    if (entity.type === "bit") {
      return candidate.source === entity.source && candidate.sourceId === entity.id &&
        Number(candidate.at || 0) === Number(entity.at || 0);
    }
    return false;
  }

  function candidateText(candidate) {
    return normalize([
      candidate.title,
      candidate.subtitle,
      candidate.sourceTitle,
      candidate.franchise,
      candidate.category,
      candidate.excerpt,
      candidate.curatedLabel,
      candidate.characterStatus,
    ].join(" "));
  }

  function termMatches(candidate, terms) {
    var text = candidateText(candidate);
    return terms.filter(function (term) {
      return text.indexOf(normalize(term)) >= 0;
    });
  }

  function hasSubjectCoverage(candidate, subjectTerms) {
    if (!subjectTerms.length) return true;
    var matches = termMatches(candidate, subjectTerms).length;
    var required = subjectTerms.length === 1 ? 1 : Math.ceil(subjectTerms.length * 0.67);
    return matches >= required;
  }

  function matchedVocabulary(candidate, vocabulary) {
    var text = " " + normalize(candidate.excerpt) + " ";
    return vocabulary.filter(function (term) {
      return text.indexOf(" " + normalize(term) + " ") >= 0;
    });
  }

  function trajectoryEvidenceSupport(candidate) {
    return {
      evaluativeTerms: matchedVocabulary(candidate, EVALUATIVE_TERMS),
      targetTerms: matchedVocabulary(candidate, TAKE_TARGET_TERMS),
    };
  }

  function isTrajectoryEvidence(candidate) {
    var support = trajectoryEvidenceSupport(candidate);
    return candidate.kind === "moment" &&
      candidate.evidenceType === "caption-excerpt" &&
      !candidate.curatedRank &&
      TAKE_EVIDENCE_CATEGORIES.indexOf(candidate.category) >= 0 &&
      support.evaluativeTerms.length > 0 &&
      support.targetTerms.length > 0;
  }

  function addScore(breakdown, points, reason, detail) {
    if (!points) return;
    breakdown.push({ points: Math.round(points * 100) / 100, reason: reason, detail: detail || "" });
  }

  function scoreCandidate(candidate, intent, entity, terms, subjectTerms) {
    var title = normalize(candidate.title);
    var subtitle = normalize(candidate.subtitle);
    var excerpt = normalize(candidate.excerpt);
    var category = normalize(candidate.category);
    var breakdown = [];
    var reasons = [];
    var matchedTerms = [];
    var matchedSubjectTerms = termMatches(candidate, subjectTerms);

    if (entityMatches(candidate, entity)) {
      var entityPoints = entity.type === "bit" ? 190 :
        entity.type === "film" ? 165 :
          entity.type === "character" ? 155 :
            entity.type === "topic" ? 145 : 115;
      var entityReason = entity.type === "film" ? "exact film" :
        entity.type === "topic" ? "exact topic" :
          entity.type === "character" ? "exact character signal" :
            entity.type === "bit" ? "exact curated bit" : "franchise match";
      addScore(breakdown, entityPoints, entityReason, entity.label);
      reasons.push(entityReason);
    }

    terms.forEach(function (term) {
      var points = 0;
      if (title.indexOf(term) >= 0) points = Math.max(points, 20);
      if (subtitle.indexOf(term) >= 0) points = Math.max(points, 10);
      if (category.indexOf(term) >= 0) points = Math.max(points, 15);
      if (excerpt.indexOf(term) >= 0) points = Math.max(points, 6);
      if (points) {
        matchedTerms.push(term);
        addScore(breakdown, points, "text match", term);
      }
    });
    if (matchedSubjectTerms.length) {
      addScore(breakdown, 24 + Math.min(24, matchedSubjectTerms.length * 8), "subject text match", matchedSubjectTerms.join(", "));
      reasons.push("subject text match");
    }

    if (intent.source !== "all" && candidate.source === intent.source) {
      addScore(breakdown, 44, candidate.source === "livestream" ? "live-source request" : "commentary-source request");
      reasons.push(candidate.source === "livestream" ? "live-source request" : "commentary-source request");
    }

    if (intent.temporal === "latest" || intent.temporal === "recent") {
      var temporalReason = intent.temporal === "latest" ?
        (candidate.source === "livestream" ? "newest stream" : "newest commentary") :
        (candidate.source === "livestream" ? "recent stream" : "recent commentary");
      addScore(breakdown, 34, temporalReason, candidate.date);
      reasons.push(temporalReason);
    } else if (intent.temporal === "earliest") {
      addScore(breakdown, 34, "earliest indexed date", candidate.date);
      reasons.push("earliest indexed date");
    }

    if (intent.popularity === "popular") {
      if (candidate.lane === "popular") {
        addScore(breakdown, 52, "foundational popularity", "Popular 25 source");
        reasons.push("foundational popularity");
      }
      if (candidate.views) {
        addScore(breakdown, Math.min(44, Math.sqrt(candidate.views) / 11), "captured official views", String(candidate.views));
        reasons.push("captured view count");
      }
    }

    var desiredCategories = CATEGORY_INTENTS[intent.name] || [];
    if (desiredCategories.indexOf(candidate.category) >= 0) {
      addScore(breakdown, 72, intent.name + " evidence", candidate.category);
      reasons.push(intent.name + " evidence");
    }
    if ((intent.name === "trajectory" || intent.name === "opinion") && isTrajectoryEvidence(candidate)) {
      addScore(breakdown, 86, "evaluative take evidence", candidate.category);
      reasons.push("evaluative take evidence");
    }
    if (intent.name === "topic" && candidate.kind === "topic") {
      addScore(breakdown, 64, "topic chapter");
      reasons.push("topic chapter");
    }
    if (intent.metric === "unhinged" && candidate.kind === "tape") {
      addScore(breakdown, 58, "Unhinged Index", String(candidate.unhinged || 0));
      reasons.push("Unhinged Index");
    }
    if (intent.metric === "live-heat" && candidate.kind === "livestream") {
      addScore(breakdown, 58, "live heat index", String(candidate.liveHeat || 0));
      reasons.push("live heat index");
    }
    if (intent.metric === "mentions" && (candidate.kind === "topic" || candidate.kind === "character")) {
      addScore(breakdown, 48, "indexed mention count", String(candidate.mentions || 0));
      reasons.push("indexed mention count");
    }
    if (intent.name === "comedy" && candidate.heat) {
      addScore(breakdown, candidate.heat * 0.55, "comedy heat", String(candidate.heat));
      reasons.push("comedy heat");
    }
    if (intent.name === "comedy" && candidate.hotRank) {
      addScore(breakdown, Math.max(8, 52 - candidate.hotRank * 0.45), "Hot 100 placement", String(candidate.hotRank));
      reasons.push("Hot 100 placement");
    }
    if (candidate.curatedRank) {
      addScore(breakdown, Math.max(28, 92 - candidate.curatedRank * 2.4), "human-curated soundbyte", candidate.curatedLabel);
      reasons.unshift("human-curated soundbyte");
    }
    if (candidate.kind === "character") {
      addScore(breakdown, 36, "caption-indexed character signal", candidate.characterStatus);
      reasons.push("caption-indexed character signal");
    }
    if ((intent.metric === "views" || intent.metric === "date") &&
      (candidate.kind === "tape" || candidate.kind === "livestream")) {
      addScore(breakdown, 32, "source-level answer", candidate.kind);
      reasons.push("source-level answer");
    }

    return {
      score: breakdown.reduce(function (total, component) { return total + component.points; }, 0),
      reasons: unique(reasons).slice(0, 4),
      scoreBreakdown: breakdown,
      matchedTerms: unique(matchedTerms),
      matchedSubjectTerms: unique(matchedSubjectTerms),
      takeEvidence: intent.name === "trajectory" || intent.name === "opinion" ?
        Object.assign({ category: candidate.category }, trajectoryEvidenceSupport(candidate)) : null,
      trajectoryEvidence: intent.name === "trajectory" ?
        Object.assign({ category: candidate.category }, trajectoryEvidenceSupport(candidate)) : null,
    };
  }

  function hasOpinionEvidence(candidate, intent) {
    var categories = CATEGORY_INTENTS[intent.name] || [];
    if (!categories.length) return true;
    if (categories.indexOf(candidate.category) >= 0) return true;
    var excerpt = normalize(candidate.excerpt);
    if (intent.name === "negative") {
      return includesAny(excerpt, ["hate", "worst", "trash", "garbage", "awful", "terrible", "sucks"]);
    }
    if (intent.name === "positive") {
      return includesAny(excerpt, ["love", "best", "favorite", "amazing", "great", "really good", "want to watch"]);
    }
    return true;
  }

  function candidateInScope(candidate, intent, entity, subjectTerms) {
    if (intent.source !== "all" && candidate.source !== intent.source) return false;
    if (entity && !entityMatches(candidate, entity)) return false;
    if (!entity && subjectTerms.length && !hasSubjectCoverage(candidate, subjectTerms)) return false;
    if ((intent.name === "trajectory" || intent.name === "opinion") && !isTrajectoryEvidence(candidate)) return false;
    if (intent.name === "comedy" &&
      (candidate.kind !== "moment" || CATEGORY_INTENTS.comedy.indexOf(candidate.category) < 0)) return false;
    if ((intent.name === "negative" || intent.name === "positive") && !hasOpinionEvidence(candidate, intent)) return false;
    if (intent.metric === "unhinged" && candidate.kind !== "tape") return false;
    if (intent.metric === "live-heat" && candidate.kind !== "livestream") return false;
    if (intent.metric === "mentions" && candidate.kind !== "topic" && candidate.kind !== "character") return false;
    if (intent.metric === "views" && candidate.kind !== "tape" && candidate.kind !== "livestream" &&
      !(entity && (entity.type === "topic" || entity.type === "character"))) return false;
    if ((intent.temporal === "latest" || intent.temporal === "earliest") &&
      !entity && intent.name !== "comedy" && candidate.kind !== "tape" && candidate.kind !== "livestream") return false;
    /*
     * characterIndex stores caption signals and cue counts, not verified
     * performances. Performance questions belong to the Lore surface, which has
     * bounded verified soundbytes; returning a prompt here would overclaim.
     */
    if (intent.performanceRequested && entity && entity.type === "character") return false;
    return true;
  }

  function dateValue(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
    return Number(String(value).replace(/-/g, ""));
  }

  function sourceLevelRank(candidate, entity) {
    if (entity && entity.type === "topic" && candidate.kind === "topic") return 4;
    if (entity && entity.type === "character" && candidate.kind === "character") return 4;
    if (entity && entity.type === "bit" && candidate.curatedLabel) return 4;
    if (candidate.kind === "tape" || candidate.kind === "livestream") return 3;
    if (candidate.kind === "topic" || candidate.kind === "character") return 2;
    return 1;
  }

  function compareCandidates(a, b, intent, entity) {
    var direction = intent.direction === "ascending" ? 1 : -1;
    if (intent.metric === "views") {
      var viewDifference = Number(a.views || -1) - Number(b.views || -1);
      if (viewDifference) return viewDifference * direction;
    }
    if (intent.metric === "unhinged") {
      var unhingedDifference = Number(a.unhinged || 0) - Number(b.unhinged || 0);
      if (unhingedDifference) return unhingedDifference * direction;
      var aUnhingedDate = dateValue(a.date);
      var bUnhingedDate = dateValue(b.date);
      if (aUnhingedDate != null && bUnhingedDate != null && aUnhingedDate !== bUnhingedDate) {
        return aUnhingedDate - bUnhingedDate;
      }
    }
    if (intent.metric === "live-heat") {
      var liveHeatDifference = Number(a.liveHeat || 0) - Number(b.liveHeat || 0);
      if (liveHeatDifference) return liveHeatDifference * direction;
    }
    if (intent.metric === "mentions") {
      var mentionDifference = Number(a.mentions || 0) - Number(b.mentions || 0);
      if (mentionDifference) return mentionDifference * direction;
    }
    if (intent.metric === "heat") {
      var heatDifference = Number(a.heat || 0) - Number(b.heat || 0);
      if (heatDifference) return heatDifference * direction;
    }
    if (intent.temporal === "latest" || intent.temporal === "recent" || intent.temporal === "earliest") {
      var aDate = dateValue(a.date);
      var bDate = dateValue(b.date);
      if (aDate == null && bDate != null) return 1;
      if (bDate == null && aDate != null) return -1;
      if (aDate != null && bDate != null && aDate !== bDate) {
        return intent.temporal === "earliest" ? aDate - bDate : bDate - aDate;
      }
    }
    if (intent.name === "comedy") {
      var aComedy = (CATEGORY_INTENTS.comedy.indexOf(a.category) >= 0 ? 1 : 0);
      var bComedy = (CATEGORY_INTENTS.comedy.indexOf(b.category) >= 0 ? 1 : 0);
      if (aComedy !== bComedy) return bComedy - aComedy;
      var comedyHeatDifference = Number(b.heat || 0) - Number(a.heat || 0);
      if (comedyHeatDifference) return comedyHeatDifference;
    }
    var sourceRankDifference = sourceLevelRank(b, entity) - sourceLevelRank(a, entity);
    if (intent.name !== "comedy" &&
      (intent.metric !== "relevance" || intent.temporal !== "all") && sourceRankDifference) {
      return sourceRankDifference;
    }
    return b.score - a.score ||
      Number(b.heat || 0) - Number(a.heat || 0) ||
      Number(b.views || 0) - Number(a.views || 0) ||
      Number(b.unhinged || 0) - Number(a.unhinged || 0) ||
      String(a.key).localeCompare(String(b.key));
  }

  function resultLabel(candidate) {
    if (candidate.kind === "character") return "CHARACTER SIGNAL";
    if (candidate.curatedLabel) return "CURATED SOUNDBYTE";
    if (candidate.source === "livestream") {
      if (candidate.lane === "popular") {
        return candidate.kind === "topic" ? "FOUNDATIONAL TOPIC JUMP" :
          candidate.kind === "moment" ? "FOUNDATIONAL COMEDY HIT" : "POPULAR 25 MAP";
      }
      return candidate.kind === "topic" ? "LIVE TOPIC JUMP" :
        candidate.kind === "moment" ? "LIVE COMEDY HIT" : "LIVESTREAM MAP";
    }
    return candidate.kind === "moment" ? "COMMENTARY RECEIPT" : "TAPE AUTOPSY";
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.round(seconds || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = String(total % 60).padStart(2, "0");
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : minutes) + ":" + secs;
  }

  function resultLocation(result) {
    var title = result.sourceTitle || result.title;
    var date = result.date ? " on " + result.date : "";
    var time = result.at ? " at " + formatTime(result.at) : "";
    return title + date + time;
  }

  function sourceNoun(source) {
    return source === "commentary" ? "commentary" :
      source === "livestream" ? "livestream" : "source";
  }

  function buildNoEvidenceAnswer(intent, entity, subjectTerms) {
    var subject = entity ? entity.label : subjectTerms.join(" ");
    if (intent.refusesSpeakerGuess) {
      return "The available auto-captions are not speaker-diarized, so I cannot identify a host, and I found no defensible matching receipt to point to.";
    }
    if (intent.performanceRequested && entity && entity.type === "character") {
      return "I found no verified performance receipt for " + entity.label +
        " in this search index. Ordinary character mentions are not being promoted into impressions.";
    }
    return "No defensible indexed receipt matches" + (subject ? ' "' + subject + '"' : " that question") +
      " in the current commentary and livestream scope. That is an archive gap, not proof it was never discussed.";
  }

  function buildAnswer(intent, entity, ranked, live, chain, subjectTerms) {
    if (!ranked.length) return buildNoEvidenceAnswer(intent, entity, subjectTerms);
    var top = ranked[0];
    var entityLabel = entity ? entity.label : top.title;
    var location = resultLocation(top);

    if (intent.refusesSpeakerGuess) {
      return "The auto-captions do not identify speakers reliably, so I won't invent a name or host attribution. The strongest matching source jump is " +
        location + "; treat it as a receipt, not a speaker attribution.";
    }
    if (intent.originRequest) {
      if (entity && entity.type === "character") {
        return "Archive boundary: the earliest machine-indexed " + entityLabel +
          " character signal in this broad caption index is " + location +
          ". This machine-indexed signal is not the same as Lore's curated verified-performance archive-first receipt for the current verified set. " +
          "It is not a claim that the bit or character portrayal originated there.";
      }
      return "Archive boundary: the earliest indexed " + entityLabel + " receipt in this dataset is " +
        location + ". This is not a claim that the bit, topic, or character portrayal originated there.";
    }
    if (intent.name === "trajectory") {
      var earliest = chain.filter(function (entry) { return entry.role === "EARLIEST INDEXED RECEIPT"; })[0];
      var latest = chain.filter(function (entry) { return entry.role === "LATEST INDEXED RECEIPT"; })[0];
      var distinctSources = unique(chain.map(function (entry) {
        return entry.result.source + "|" + entry.result.sourceId;
      })).length;
      if (distinctSources < 2) {
        return "Archive boundary: I found indexed " + entityLabel +
          " receipts inside one source, but not a defensible before-and-after pair. " +
          "That is not enough evidence to claim they changed their mind.";
      }
      var span = latest ? " through " + resultLocation(latest.result) : "";
      var trajectoryCaveat = entity && entity.type === "franchise" ?
        " These franchise-wide receipts may concern different films, scenes, or evaluative targets and cannot prove a host changed their mind." :
        " These receipts can reveal an archive timeline, but captions alone cannot prove a host changed their mind.";
      return "Archive boundary: the index has explicit evaluative " + entityLabel + " receipts from " +
        (earliest ? resultLocation(earliest.result) : location) + span + "." + trajectoryCaveat;
    }
    if (intent.name === "opinion") {
      var hasPositiveReceipt = chain.some(function (entry) {
        return entry.role === "POSITIVE-LANGUAGE RECEIPT";
      });
      var hasCriticalReceipt = chain.some(function (entry) {
        return entry.role === "CRITICAL-LANGUAGE RECEIPT";
      });
      var polarityNote = hasPositiveReceipt && hasCriticalReceipt ?
        " The result window deliberately includes both positive- and critical-language receipts." : "";
      var opinionCaveat = entity && entity.type === "franchise" ?
        " Franchise-wide receipts may concern different films, scenes, or review targets, so this does not establish one settled host opinion about the franchise." :
        " This receipt supports a specific evaluative moment, not one settled host opinion.";
      return "Archive boundary: the index contains explicit evaluative receipts for " + entityLabel +
        ", including " + location + "." + polarityNote + opinionCaveat;
    }
    if (intent.metric === "views") {
      return "By the captured official view snapshot, " + (top.sourceTitle || top.title) +
        " is the most-viewed indexed " + sourceNoun(top.source) +
        (entity ? " match for " + entityLabel : "") + " at " +
        Number(top.views || 0).toLocaleString("en-US") + " official views.";
    }
    if (intent.metric === "unhinged") {
      var extreme = intent.direction === "ascending" ? "lowest" : "highest";
      var tied = ranked.filter(function (result) {
        return Number(result.unhinged || 0) === Number(top.unhinged || 0);
      });
      if (tied.length > 1) {
        return "Direct answer: " + tied.slice(0, 3).map(function (result) {
          return result.title;
        }).join(" and ") + " tie for the " + extreme +
          " indexed Unhinged Index in this scope at " + Number(top.unhinged || 0) + ".";
      }
      return "Direct answer: " + top.title + " has the " + extreme +
        " indexed Unhinged Index in this scope at " + Number(top.unhinged || 0) + ".";
    }
    if (intent.metric === "live-heat") {
      var liveExtreme = intent.direction === "ascending" ? "lowest" : "highest";
      return "Direct answer: " + (top.sourceTitle || top.title) +
        " has the " + liveExtreme + " indexed live heat score in this scope at " +
        Number(top.liveHeat || 0) + "/100. The score is the average of its three hottest indexed moments.";
    }
    if (intent.metric === "mentions") {
      return "Direct answer: " + top.title + " has the strongest indexed mention count in this scope at " +
        Number(top.mentions || 0).toLocaleString("en-US") + " caption matches.";
    }
    if (intent.name === "comedy") {
      return "Fastest evidence-backed route to chaos: " + location + ", filed as " + top.category + ".";
    }
    if (intent.temporal === "latest") {
      return "Most recent indexed " + sourceNoun(top.source) + " match: " + location + ".";
    }
    if (intent.temporal === "earliest") {
      return "Earliest indexed " + sourceNoun(top.source) + " match: " + location +
        ". This describes the current archive, not an all-time origin.";
    }
    if (intent.questionType === "count") {
      var sourceCount = unique(ranked.map(function (result) {
        return result.source + "|" + result.sourceId;
      })).length;
      return "The current result window contains " + sourceCount + " indexed source" +
        (sourceCount === 1 ? "" : "s") + " with defensible " + entityLabel + " receipts.";
    }
    if (intent.questionType === "when") {
      return "The strongest indexed match is dated " + (top.date || "date unavailable") +
        (top.at ? ", with the source jump at " + formatTime(top.at) : "") + ": " +
        (top.sourceTitle || top.title) + ".";
    }
    if (intent.questionType === "where") {
      return "The strongest indexed jump is " + location + ".";
    }
    if (intent.name === "negative") {
      return "The closest indexed negative-language receipt for " + entityLabel + " is " + location +
        ". It supports this moment only; it is not being promoted into a settled host opinion.";
    }
    if (intent.name === "positive") {
      return "The closest indexed positive-language receipt for " + entityLabel + " is " + location +
        ". It supports this moment only; it is not being promoted into a settled host opinion.";
    }
    if (entity && entity.type === "character") {
      return "Strongest indexed " + entityLabel + " character signal: " + location +
        ", labeled " + String(top.characterStatus || "character reference") +
        ". The label does not identify a performer.";
    }
    if (entity && entity.type === "bit") {
      return "Direct curated soundbyte match: " + entity.label + " in " + location + ".";
    }
    if (intent.name === "topic" && top.kind === "topic") {
      var aggregate = (live.topicIndex || []).filter(function (topic) {
        return normalize(topic.name) === normalize(top.title);
      })[0];
      return top.title + " appears across " + (aggregate ? aggregate.streams.length : 1) +
        " indexed stream" + (aggregate && aggregate.streams.length !== 1 ? "s" : "") +
        ". The strongest matching jump is " + location + ".";
    }
    if (intent.questionType === "which") {
      return "Strongest supported match: " + location + ".";
    }
    return "Best-supported indexed answer: " + location +
      ". Open the receipt to judge the caption context directly.";
  }

  function combineLiveData(live, popular) {
    var streams = (live.streams || []).map(function (stream) {
      return Object.assign({}, stream, { _lane: "fresh" });
    }).concat((popular.streams || []).map(function (stream) {
      return Object.assign({}, stream, { _lane: "popular" });
    }));
    var groupedTopics = {};
    (live.topicIndex || []).concat(popular.topicIndex || []).forEach(function (topic) {
      var key = normalize(topic.name);
      var record = groupedTopics[key] || { name: topic.name, mentions: 0, streams: [] };
      record.mentions += Number(topic.mentions || 0);
      (topic.streams || []).forEach(function (stream) {
        if (!record.streams.some(function (candidate) { return candidate.id === stream.id; })) {
          record.streams.push(stream);
        }
      });
      groupedTopics[key] = record;
    });
    var groupedCharacters = {};
    (live.characterIndex || []).concat(popular.characterIndex || []).forEach(function (character) {
      var key = normalize(character.character);
      var record = groupedCharacters[key] || {
        character: character.character,
        mentions: 0,
        performanceCues: 0,
        streams: [],
      };
      record.mentions += Number(character.mentions || 0);
      record.performanceCues += Number(character.performanceCues || 0);
      (character.streams || []).forEach(function (stream) {
        if (!record.streams.some(function (candidate) { return candidate.id === stream.id; })) {
          record.streams.push(stream);
        }
      });
      groupedCharacters[key] = record;
    });
    return {
      streams: streams,
      topicIndex: Object.keys(groupedTopics).map(function (key) { return groupedTopics[key]; }),
      characterIndex: Object.keys(groupedCharacters).map(function (key) { return groupedCharacters[key]; }),
    };
  }

  function isFollowup(intent) {
    return beginsWithAny(intent.normalized, ["and", "another", "how about", "what about", "where about"]) ||
      includesAny(intent.normalized, ["did that", "was that", "show another", "more like", "same one", "those ones"]) ||
      (intent.words.length <= 4 && includesAny(intent.normalized, ["that", "those", "one", "ones", "more", "instead"]));
  }

  function contextualEntity(previous, aliases, intent, preferredSource) {
    if (!previous || !previous.entity) return null;
    return entityFromLabel(previous.entity, aliases, intent, preferredSource);
  }

  function applyContext(intent, previous, aliases) {
    if (!previous || !isFollowup(intent)) {
      return { intent: intent, entity: null, continuedFrom: false, contextUsed: [] };
    }
    var inherited = Object.assign({}, intent);
    var contextUsed = [];
    var previousIntent = parseIntent(previous.query || "");
    var preferredSource = inherited.source !== "all" ? inherited.source : previous.source;
    var entity = contextualEntity(previous, aliases, inherited, preferredSource);
    if (entity) contextUsed.push("entity");
    if (!inherited.sourceExplicit && previous.source && previous.source !== "all") {
      inherited.source = previous.source;
      contextUsed.push("source");
    }
    if (!inherited.temporalExplicit && !inherited.popularityExplicit && previousIntent.temporal !== "all") {
      inherited.temporal = previousIntent.temporal;
      inherited.metric = previousIntent.metric;
      inherited.direction = previousIntent.direction;
      contextUsed.push("temporal");
    }
    if (inherited.name === "discovery" && previous.intent && previous.intent !== "discovery") {
      inherited.name = previous.intent;
      contextUsed.push("intent");
    }
    return {
      intent: inherited,
      entity: entity,
      continuedFrom: contextUsed.length > 0,
      contextUsed: unique(contextUsed),
    };
  }

  function evidenceWarnings(candidate) {
    var warnings = ["Speaker identity is not inferred from auto-captions."];
    if (!candidate.captioned) warnings.push("No transcript-derived receipt is available for this source.");
    if (candidate.evidenceType === "derived-source-summary") {
      warnings.push("This result is a derived source summary, not a verbatim quote.");
    }
    if (candidate.kind === "moment" || candidate.kind === "topic") {
      warnings.push("Category and topic labels are archive classifications, not host-authored claims.");
    }
    if (candidate.kind === "character") {
      warnings.push("A character signal does not establish who performed it.");
      if (candidate.characterStatus === "character reference") {
        warnings.push("This is an ordinary reference, not a verified character performance.");
      }
    }
    return warnings;
  }

  function enrichResult(candidate) {
    var evidenceLevel = candidate.evidenceType === "caption-excerpt" ||
      candidate.evidenceType === "caption-topic-receipt" ||
      candidate.evidenceType === "caption-character-signal" ? "TIMESTAMPED CAPTION RECEIPT" :
      candidate.captioned ? "SOURCE-LEVEL DERIVED SUMMARY" : "SOURCE METADATA ONLY";
    return Object.assign({}, candidate, {
      label: resultLabel(candidate),
      speaker: null,
      speakerStatus: "not-diarized",
      evidenceLevel: evidenceLevel,
      evidenceWarnings: evidenceWarnings(candidate),
      explanation: {
        totalScore: Math.round(candidate.score * 100) / 100,
        components: candidate.scoreBreakdown,
        matchedTerms: candidate.matchedTerms,
        matchedSubjectTerms: candidate.matchedSubjectTerms,
        evidenceType: candidate.evidenceType,
        takeEvidence: candidate.takeEvidence || null,
        trajectoryEvidence: candidate.trajectoryEvidence || null,
      },
    });
  }

  function evidenceChain(intent, entity, ranked) {
    if (!ranked.length) return [];
    if (intent.name === "trajectory") {
      var chronological = ranked.slice().filter(function (candidate) {
        return dateValue(candidate.date) != null;
      }).sort(function (a, b) {
        return dateValue(a.date) - dateValue(b.date) || a.at - b.at;
      });
      if (!chronological.length) return [{ role: "PRIMARY RECEIPT", result: ranked[0] }];
      var first = chronological[0];
      var last = chronological[chronological.length - 1];
      var trajectory = [{ role: "EARLIEST INDEXED RECEIPT", result: first }];
      if (last.key !== first.key) trajectory.push({ role: "LATEST INDEXED RECEIPT", result: last });
      return trajectory;
    }
    if (intent.originRequest) {
      var origins = ranked.slice().filter(function (candidate) {
        return dateValue(candidate.date) != null;
      }).sort(function (a, b) {
        return dateValue(a.date) - dateValue(b.date) || a.at - b.at;
      });
      if (!origins.length) origins = ranked;
      var characterOrigin = entity && entity.type === "character";
      var originChain = [{
        role: characterOrigin ? "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL" : "EARLIEST INDEXED RECEIPT",
        result: origins[0],
      }];
      if (origins[1]) originChain.push({
        role: characterOrigin ? "LATER MACHINE-INDEXED CHARACTER SIGNAL" : "LATER INDEXED RECEIPT",
        result: origins[1],
      });
      return originChain;
    }
    if (intent.name === "opinion") {
      var positiveTake = ranked.filter(function (candidate) {
        return candidate.category === "LOVE LETTER";
      })[0];
      var criticalTake = ranked.filter(function (candidate) {
        return candidate.category === "FRANCHISE FELONY" ||
          candidate.category === "TAKE GETS NUCLEAR";
      })[0];
      var opinionChain = [];
      if (positiveTake) opinionChain.push({ role: "POSITIVE-LANGUAGE RECEIPT", result: positiveTake });
      if (criticalTake && (!positiveTake || criticalTake.key !== positiveTake.key)) {
        opinionChain.push({ role: "CRITICAL-LANGUAGE RECEIPT", result: criticalTake });
      }
      if (!opinionChain.length) opinionChain.push({ role: "PRIMARY RECEIPT", result: ranked[0] });
      return opinionChain;
    }

    var top = ranked[0];
    var chain = [{ role: "PRIMARY RECEIPT", result: top }];
    var desiredCategories = CATEGORY_INTENTS[intent.name] || [];
    var support = ranked.filter(function (candidate) {
      if (candidate.key === top.key) return false;
      if (entity && !entityMatches(candidate, entity)) return false;
      if (desiredCategories.length) return desiredCategories.indexOf(candidate.category) >= 0;
      return candidate.sourceId !== top.sourceId || candidate.category === top.category;
    })[0] || ranked[1];
    if (support) chain.push({
      role: intent.name === "ranking" ? "RUNNER-UP" : "SUPPORTING RECEIPT",
      result: support,
    });
    var counterCategories = intent.name === "negative" ? ["LOVE LETTER"] :
      intent.name === "positive" ? ["FRANCHISE FELONY", "TAKE GETS NUCLEAR"] : [];
    var counter = ranked.filter(function (candidate) {
      return candidate.key !== top.key &&
        (!entity || entityMatches(candidate, entity)) &&
        counterCategories.indexOf(candidate.category) >= 0;
    })[0];
    if (counter) chain.push({ role: "COUNTERPOINT", result: counter });
    return chain;
  }

  function confidenceFor(intent, entity, ranked) {
    if (!ranked.length) return 0;
    var top = ranked[0];
    var second = ranked[1];
    var confidence = entity ? 78 : top.matchedSubjectTerms.length ? 68 : 62;
    if (entity && entityMatches(top, entity)) confidence += 8;
    if (top.evidenceType === "caption-excerpt" || top.evidenceType === "caption-topic-receipt") confidence += 4;
    if (intent.metric !== "relevance") confidence += 4;
    if (second && top.score > second.score) confidence += Math.min(5, Math.round((top.score - second.score) / 25));
    if (intent.name === "negative" || intent.name === "positive") confidence = Math.min(confidence, 84);
    if (intent.name === "opinion") confidence = Math.min(confidence, 78);
    if (intent.name === "trajectory") confidence = Math.min(confidence, 72);
    if (intent.originRequest) confidence = Math.min(confidence, 76);
    if (!top.captioned && top.evidenceType === "source-metadata") confidence = Math.min(confidence, 54);
    return Math.max(1, Math.min(96, confidence));
  }

  function dedupeCandidates(ranked, preserveExactReceipts) {
    var deduped = [];
    var seen = {};
    ranked.forEach(function (candidate) {
      var key = preserveExactReceipts ? candidate.key :
        candidate.source + "|" + candidate.sourceId + "|" + candidate.kind;
      if (!preserveExactReceipts && candidate.kind === "moment") key += "|" + candidate.category;
      if (!preserveExactReceipts && candidate.kind === "character") key += "|" + normalize(candidate.character);
      if (!preserveExactReceipts && candidate.kind === "topic") key += "|" + normalize(candidate.title);
      if (seen[key]) return;
      seen[key] = true;
      deduped.push(candidate);
    });
    return deduped;
  }

  function recommendedSurface(intent, entity) {
    if (intent.name === "trajectory" || intent.name === "opinion" || intent.refusesSpeakerGuess) {
      return {
        id: "canon",
        href: "#canon",
        label: "Canon Desk",
        reason: "This question needs attribution or timeline review beyond caption retrieval.",
      };
    }
    if (intent.performanceRequested || intent.originRequest ||
      (entity && (entity.type === "character" || entity.type === "bit"))) {
      return {
        id: "lore",
        href: "#lore",
        label: "Lore / Character Lab",
        reason: "This surface has the bounded lineage and verified character-soundbyte evidence.",
      };
    }
    return null;
  }

  function create(catalog, deep, live, curated, popular) {
    catalog = catalog || [];
    deep = deep || { tapes: [] };
    live = live || { streams: [], topicIndex: [] };
    popular = popular || { streams: [], topicIndex: [], characterIndex: [] };
    curated = curated || { upInYa: [] };

    var combinedLive = combineLiveData(live, popular);
    var candidates = commentaryCandidates(catalog, deep).concat(liveCandidates(combinedLive));
    var aliases = aliasDefinitions(catalog, combinedLive, curated);
    var curatedByReceipt = {};
    (curated.upInYa || []).forEach(function (item, index) {
      curatedByReceipt[item.source + "|" + item.id + "|" + Number(item.t || 0)] = {
        rank: index + 1,
        label: item.label,
      };
    });
    candidates.forEach(function (candidate) {
      var curatedItem = curatedByReceipt[
        candidate.source + "|" + candidate.sourceId + "|" + Number(candidate.at || 0)
      ];
      candidate.curatedRank = curatedItem ? curatedItem.rank : null;
      candidate.curatedLabel = curatedItem ? curatedItem.label : null;
    });

    function ask(query, previous) {
      var originalIntent = parseIntent(query);
      var directEntity = identifyEntity(query, aliases, originalIntent);
      var context = applyContext(originalIntent, previous, aliases);
      var intent = context.intent;
      var entity = directEntity || context.entity;
      var continuedFrom = !directEntity && context.continuedFrom;
      var contextUsed = !directEntity ? context.contextUsed : [];
      var terms = expandedTerms(intent);
      var subjectTerms = entity ? [] : querySubjectTerms(intent);

      var ranked = [];
      if (normalize(query)) {
        ranked = candidates.filter(function (candidate) {
          return candidateInScope(candidate, intent, entity, subjectTerms);
        }).map(function (candidate) {
          return Object.assign({}, candidate, scoreCandidate(candidate, intent, entity, terms, subjectTerms));
        }).filter(function (candidate) {
          if (entity) return entityMatches(candidate, entity);
          if (subjectTerms.length) {
            var requiredMatches = subjectTerms.length === 1 ? 1 : Math.ceil(subjectTerms.length * 0.67);
            return candidate.matchedSubjectTerms.length >= requiredMatches;
          }
          return candidate.score > 0;
        }).sort(function (a, b) {
          return compareCandidates(a, b, intent, entity);
        });
      }

      var fullRanked = ranked.slice();
      var rawChain = evidenceChain(intent, entity, fullRanked);
      var chain = rawChain.map(function (entry) {
        return { role: entry.role, result: enrichResult(entry.result) };
      });
      var evidenceFirst = intent.name === "trajectory" || intent.name === "opinion";
      var displayRanked = evidenceFirst ?
        rawChain.map(function (entry) { return entry.result; }).concat(ranked.filter(function (candidate) {
          return !rawChain.some(function (entry) { return entry.result.key === candidate.key; });
        })) : ranked;
      var results = dedupeCandidates(displayRanked, evidenceFirst).slice(0, 7).map(enrichResult);
      if (intent.originRequest && entity && entity.type === "character" && results[0]) {
        results[0].label = "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL";
        results[0].archiveBoundary = {
          index: "broad machine-indexed caption signals",
          differsFrom: "Lore curated verified-performance archive-first receipt for the current verified set",
          trueOriginClaim: false,
        };
      }
      var confidence = confidenceFor(intent, entity, results);
      var status = intent.refusesSpeakerGuess ? "speaker-unknown" :
        intent.name === "trajectory" || intent.name === "opinion" ? "archive-boundary" :
        !results.length ? "insufficient-evidence" : "supported";
      var answer = buildAnswer(intent, entity, results, combinedLive, chain, subjectTerms);

      return {
        query: query,
        intent: intent.name,
        questionType: intent.questionType,
        source: intent.source,
        temporal: intent.temporal,
        popularity: intent.popularity,
        metric: intent.metric,
        entity: entity ? entity.label : null,
        entityType: entity ? entity.type : null,
        continuedFrom: continuedFrom,
        contextUsed: contextUsed,
        confidence: confidence,
        confidenceBasis: results.length ? (intent.name === "trajectory" ? [
          "receipt retrieval confidence; change claim not established",
          entity ? "recognized archive entity" : "archive text match",
          results[0].evidenceLevel.toLowerCase(),
        ] : intent.name === "opinion" ? [
          "receipt retrieval confidence; settled opinion not established",
          entity ? "recognized archive entity" : "archive text match",
          results[0].evidenceLevel.toLowerCase(),
        ] : [
          entity ? "recognized archive entity" : "archive text match",
          results[0].evidenceLevel.toLowerCase(),
          intent.metric !== "relevance" ? "explicit selector: " + intent.metric : "relevance ranking",
        ]) : ["no matching indexed receipt"],
        status: status,
        answer: answer,
        limitations: unique((results[0] ? results[0].evidenceWarnings : [
          "Absence from this bounded index is not proof a subject was never discussed.",
        ]).concat(intent.originRequest ? [
          "Earliest indexed receipt is not a claim of true origin.",
        ] : []).concat(intent.name === "trajectory" ? [
          entity && entity.type === "franchise" ?
            "Franchise-wide evaluative receipts may concern different films, scenes, or targets; they cannot prove a host changed their mind." :
            "Evaluative receipts can show an archive timeline but cannot prove a host changed their mind.",
        ] : intent.name === "opinion" ? [
          entity && entity.type === "franchise" ?
            "Franchise-wide evaluative receipts may concern different films, scenes, or targets; they do not establish one settled host opinion." :
            "An evaluative receipt supports a specific moment, not one settled host opinion.",
        ] : [])),
        explanation: {
          method: "entity scope, source scope, direct selector, caption evidence, editorial signals",
          subjectTerms: subjectTerms,
          topScore: results[0] ? results[0].score : 0,
          resultCountBeforeDisplayLimit: fullRanked.length,
          safeguards: [
            "no speaker guessing",
            "no unsupported opinion claims",
            "no true-origin claims",
            "unknown subjects return no evidence",
          ],
        },
        evidenceChain: chain,
        results: results,
        suggestions: results.length ? [] : QUERY_EXAMPLES.slice(0, 4),
        recommendedSurface: recommendedSurface(intent, entity),
      };
    }

    return {
      ask: ask,
      aliases: aliases,
      candidateCount: candidates.length,
      examples: QUERY_EXAMPLES.slice(),
      evidencePolicy: {
        speakerAttribution: "Auto-captions are not diarized; result speaker is always null.",
        opinions: "A classified moment is evidence for that moment, not a settled host opinion.",
        origins: "The engine may identify the earliest indexed receipt, never a true origin.",
        noEvidence: "Unknown subjects return an empty result set instead of unrelated category matches.",
      },
    };
  }

  global.WWAMSearchEngine = {
    create: create,
    normalize: normalize,
    parseIntent: parseIntent,
  };
})(window);
