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
    "how", "i", "in", "into", "is", "it", "know", "me", "movie", "need", "of",
    "on", "or", "say", "said", "should", "show", "tell", "that", "the", "their",
    "them", "they",
    "thing", "things", "this", "to", "was", "were", "what", "when", "where",
    "which", "who", "why", "will", "with", "would", "want", "you",
  ];

  var QUERY_CUE_WORDS = [
    "about", "again", "anything", "archive", "archived", "audience", "batch", "began", "begin", "best", "biggest",
    "bit", "broadcast", "broadcasts", "called", "caption", "captions", "change", "changed", "chapter",
    "clip", "clips", "commentaries", "commentary", "crazy", "criticize", "criticized", "deranged",
    "cover", "covered", "coverage", "deep", "discuss", "discussed", "dislike", "disliked", "draw", "draws", "drew",
    "earliest", "episode", "episodes", "ever", "evidence", "favorite", "fewest",
    "first", "foundational", "fresh", "funniest", "funny", "garbage", "hate",
    "hated", "highest", "index", "indexed", "last", "latest", "laugh", "like",
    "liked", "live", "livestream", "livestreams", "love", "loved", "lowest",
    "happen", "happened", "mention", "mentioned", "mentions", "moment", "moments", "most", "never",
    "newest", "oldest", "one", "ones",
    "opinion", "popular", "praise", "praised", "prove", "ranking", "receipt", "recent", "recently", "score",
    "results", "second", "something", "soundbyte", "soundbytes", "source", "start", "started",
    "stream", "streams", "talk", "talked", "talking", "tape", "think", "topic",
    "topics", "discussing", "trash", "unhinged", "upload", "uploaded", "uploads",
    "posted", "published", "video", "videos",
    "viewed", "views", "watchalong", "watchalongs", "watched", "wild", "worst",
  ];

  var QUERY_CONTROL_WORDS = [
    "all", "another", "before", "count", "entire", "every", "exactly", "first",
    "five", "four", "highest", "hot", "hottest", "last", "least", "list",
    "many", "more", "most", "next", "night", "nights", "nine", "number",
    "oldest", "one", "previous", "ranked", "replay", "seven", "six", "ten",
    "three", "top", "total", "two", "whole", "yesterday",
  ];

  var NUMBER_WORDS = {
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
  };

  var ROMAN_NUMBER_WORDS = {
    ii: "2",
    iii: "3",
    iv: "4",
    v: "5",
    vi: "6",
    vii: "7",
    viii: "8",
    ix: "9",
    x: "10",
  };

  var SOURCE_TITLE_NOISE_WORDS = [
    "find", "franchise", "franchises", "jump", "live", "livestream", "movie", "movies",
    "open", "please", "show", "stream", "video", "watched", "we", "whats",
    "wheres", "whos",
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
    "dislike": ["worst", "garbage", "trash", "awful", "franchise felony", "take gets nuclear"],
    "disliked": ["worst", "garbage", "trash", "awful", "franchise felony", "take gets nuclear"],
    "despise": ["worst", "garbage", "trash", "awful", "franchise felony", "take gets nuclear"],
    "loathe": ["worst", "garbage", "trash", "awful", "franchise felony", "take gets nuclear"],
    "bad": ["worst", "garbage", "trash", "terrible", "franchise felony", "take gets nuclear"],
    "love": ["best", "favorite", "amazing", "love letter"],
    "loved": ["best", "favorite", "amazing", "love letter"],
    "like": ["favorite", "amazing", "love letter"],
    "liked": ["favorite", "amazing", "love letter"],
    "praise": ["best", "favorite", "amazing", "love letter"],
    "praised": ["best", "favorite", "amazing", "love letter"],
    "enjoy": ["favorite", "amazing", "love letter"],
    "enjoyed": ["favorite", "amazing", "love letter"],
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

  var NEGATIVE_EVALUATIVE_TERMS = [
    "never watch", "couldnt stand", "didnt like", "dont like", "not good",
    "hate", "hated", "worst", "awful", "terrible", "trash", "garbage",
    "sucks", "suck", "bad", "stupid", "dumb", "ruined", "boring", "ugly",
  ];

  var POSITIVE_EVALUATIVE_TERMS = [
    "really like", "i like", "love", "loved", "favorite", "best", "amazing",
    "awesome", "beautiful", "perfect", "great", "good", "excellent",
    "enjoy", "enjoyed",
  ];

  var TAKE_TARGET_TERMS = [
    "movie", "film", "franchise", "installment", "sequel", "prequel", "remake",
    "reboot", "scene", "sequence", "ending", "opening", "story", "plot", "script",
    "writing", "direction", "directing", "performance", "acting", "score", "music",
    "soundtrack", "shot", "cinematography", "mask", "part", "effect", "effects",
    "dialogue", "pacing", "tone", "design", "edit", "editing", "character",
    "characters", "actor", "actors", "cast", "costume", "look",
  ];

  var OPINION_PROXIMITY_WORDS = 8;
  var SCREEN_REFERENT_TERMS = ["this", "that", "it", "its"];
  var SCREEN_REFERENT_PROXIMITY_WORDS = 2;

  var QUERY_EXAMPLES = [
    "What do they think of Halloween Ends?",
    "What is funniest in the most-viewed livestream?",
    "Where is The Burp Defense?",
    "When did J first do Dr. Loomis?",
    "What is funniest about an AI version of us in Archive Deep?",
    "What is Red Band #25?",
    "Which Friday the 13th movie do they hate most?",
    "Which Halloween streams were uploaded in 2019?",
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

  function canonicalizeQuery(value) {
    var normalized = normalize(value)
      .replace(/\bh2o\b/g, "h20")
      .replace(/\bversus\b/g, "vs");
    var queryWords = normalized.split(" ");
    return queryWords.map(function (word, index) {
      if (ROMAN_NUMBER_WORDS[word]) return ROMAN_NUMBER_WORDS[word];
      var previous = queryWords[index - 1] || "";
      var beforePrevious = queryWords[index - 2] || "";
      var localSequelNumber = [
        "scream", "halloween", "friday", "nightmare", "elm", "part", "chapter",
      ].indexOf(previous) >= 0 || (
        ["movie", "part", "chapter"].indexOf(previous) >= 0 &&
        ["scream", "halloween", "friday", "nightmare", "elm"].indexOf(beforePrevious) >= 0
      );
      var commandBeforeNumber = ["show", "give", "list", "find"].indexOf(previous) >= 0 ||
        (previous === "me" &&
          ["show", "give", "list", "find"].indexOf(beforePrevious) >= 0);
      var outputNounAhead = queryWords.slice(index + 1, index + 5).some(function (candidate) {
        return ["soundbytes", "moments", "clips", "commentaries", "watchalongs",
          "livestreams", "streams", "uploads", "videos"].indexOf(candidate) >= 0;
      });
      var localLimitNumber = ["top", "rank", "number"].indexOf(previous) >= 0 ||
        (commandBeforeNumber && outputNounAhead);
      if (NUMBER_WORDS[word] && (localSequelNumber || localLimitNumber)) {
        return NUMBER_WORDS[word];
      }
      return word;
    }).join(" ");
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
    var q = canonicalizeQuery(query);
    var firstPerformanceGrammar =
      /\bfirst (?:do|does|did|perform|performed|portray|portrayed|play|played|voice|voiced)\b/.test(q);
    var firstAppearanceGrammar =
      /\b(?:first|earliest)(?: indexed)? (?:appear|appears|appeared|appearance|show up|showed up|debut)\b/.test(q);
    var sourceExplicit = false;
    var source = "all";
    var archiveBatchSequence = includesAny(q, [
      "batch 03", "batch 3", "batch03", "batch3", "third archive deep batch",
      "archive deep batch 03", "archive deep batch 3",
    ]) ? 3 : includesAny(q, [
      "batch 02", "batch 2", "batch02", "batch2", "second archive deep batch",
      "archive deep batch 02", "archive deep batch 2",
    ]) ? 2 : includesAny(q, [
      "batch 01", "batch 1", "batch01", "batch1", "first archive deep batch",
      "archive deep batch 01", "archive deep batch 1",
    ]) ? 1 : null;
    var archiveRequested = archiveBatchSequence != null || includesAny(q, [
      "archive deep", "deep archive", "archive batch",
      "archived livestream", "archived live stream", "archive livestream",
      "archive live stream", "archive stream", "archive streams",
    ]);
    if (includesAny(q, [
      "commentary", "commentaries", "watchalong", "watchalongs", "watch along",
      "watch alongs", "tape autopsy",
    ])) {
      source = "commentary";
      sourceExplicit = true;
    } else if (includesAny(q, [
      "livestream", "live stream", "stream", "live show", "live episode",
      "recent show", "newest show",
    ])) {
      source = "livestream";
      sourceExplicit = true;
    }

    var temporal = firstPerformanceGrammar || firstAppearanceGrammar || includesAny(q, [
      "earliest", "oldest", "first indexed", "first time", "first livestream",
      "first live stream", "first live show", "first commentary", "first watchalong",
      "first upload", "first video",
    ]) ? "earliest" :
      includesAny(q, [
        "latest", "newest", "most recent", "last time", "last livestream",
        "last live stream", "last stream", "last live show", "last commentary", "last watchalong",
        "last upload", "last video", "today", "last night", "last nights",
        "yesterday",
      ]) ? "latest" :
        q.indexOf("recent") >= 0 ? "recent" : "all";
    var viewSelector = includesAny(q, [
      "most viewed", "most watched", "most views", "highest views", "top by views",
      "biggest audience", "largest audience", "biggest stream", "top stream",
      "least viewed", "fewest views", "lowest views",
    ]);
    var popularity = includesAny(q, [
      "popular", "most viewed", "most watched", "most views", "highest views",
      "biggest audience", "largest audience", "biggest stream", "top stream", "foundational",
    ]) ? "popular" : "all";
    var originRequest = containsNormalizedPhrase(q, "origin") || includesAny(q, [
      "originate", "started", "start of", "began", "debut", "first ever",
      "first time", "earliest ever", "invented", "bit start", "bit begin",
    ]) || firstPerformanceGrammar || firstAppearanceGrammar || (
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
      "think about", "think of", "thought about", "thought of", "thoughts about",
      "thoughts on", "thoughts of", "opinion about", "opinion of", "opinion on",
      "take about", "take on", "feel about", "feel on", "make of",
      "do they like", "does he like", "does she like", "did they like",
    ]);
    var negativeExistence = includesAny(q, [
      "never cover", "never covered", "never discuss", "never discussed",
      "never talk about", "never talked about", "never mention", "never mentioned",
      "did not cover", "didnt cover", "did not discuss", "didnt discuss",
      "did not mention", "didnt mention", "have not covered", "havent covered",
      "has not covered", "hasnt covered",
    ]);
    var coverageLanguage = includesAny(q, [
      "cover", "covered", "discuss", "discussed", "talk about", "talked about",
      "mention", "mentioned", "indexed for", "anything indexed", "do you have",
      "is there",
    ]);
    var existenceRequest = negativeExistence || (
      coverageLanguage && (
        containsNormalizedPhrase(q, "ever") ||
        beginsWithAny(q, ["did", "do", "does", "have", "has", "is", "are", "was", "were", "prove"])
      )
    );

    var topicOverviewRequest = source === "livestream" && includesAny(q, [
      "what are they talking about", "what are they talking", "what do they talk about",
      "what did they talk about", "what topics", "which topics", "topic rundown",
      "topics are they discussing", "topics were they discussing",
      "what is being discussed", "what was being discussed", "whats being discussed",
      "what happened", "what happens",
    ]);
    var comedyRequest = includesAny(q, [
      "funny", "funniest", "laugh", "deranged", "wild", "crazy", "fucked", "soundbyte",
    ]);
    var compoundViewComedy = comedyRequest && viewSelector;
    var intent = "discovery";
    if (trajectory) intent = "trajectory";
    else if (!comedyRequest && (
      includesAny(q, ["highest", "lowest", "rank", "ranking", "most popular", "most unhinged",
        "least unhinged", "most viewed", "most watched", "most views", "least viewed",
        "fewest views", "biggest audience", "largest audience", "biggest stream",
        "top stream", "foundational"]) || viewSelector
    )) intent = "ranking";
    else if (includesAny(q, [
      "least favorite", "least favourite", "least liked", "like least",
      "liked least", "love least", "loved least",
      "hate", "hated", "worst", "bad", "sucks", "trash", "garbage", "criticize",
      "criticized", "dislike", "disliked", "despise", "despised", "loathe",
      "loathed", "didnt like", "did not like", "couldnt stand",
    ])) intent = "negative";
    else if (includesAny(q, [
      "love", "loved", "best", "favorite", "amazing", "positive about", "liked",
      "praise", "praised", "enjoy", "enjoyed",
    ])) intent = "positive";
    else if (neutralOpinion) intent = "opinion";
    else if (comedyRequest) intent = "comedy";
    else if (includesAny(q, ["theory", "predict", "prediction", "called it"])) intent = "theory";
    else if (includesAny(q, ["kill", "death", "murder", "stab"])) intent = "kills";
    else if (topicOverviewRequest || includesAny(q, [
      "talk about", "talked about", "talking about", "discuss", "mention", "topic", "jump to",
      "say about", "said about", "think about", "what did they say"])) intent = "topic";

    var namedHostAttribution = includesAny(q, [
      "what did mike", "what does mike", "mike say", "mikes take", "according to mike",
      "what did j say", "what does j say", "j said", "js take", "according to j",
      "show me j doing", "show j doing", "was that mike", "was this mike",
      "was that j", "was this j", "is that mike", "is this mike", "is that j", "is this j",
    ]) || (
      /(?:^| )(?:mike|mikes|j|js)(?: |$)/.test(q) &&
      includesAny(q, [
        "create", "created", "doing", "favorite", "hate", "invent", "invented",
        "love", "opinion", "owns", "perform", "performed", "portray", "portrayed",
        "say", "said", "take", "think", "thought", "voice", "voiced",
      ]) &&
      q.indexOf("mike myers") < 0
    );
    var anonymousSpeakerAttribution = includesAny(q, [
      "who said", "who performed", "who was performing", "who portrays", "who portrayed",
      "who voiced", "who created", "who invented", "who owns", "who came up with",
      "which host", "which one of them", "mike or j", "j or mike",
    ]);
    var mappingRequest = /^(?:who|which host) (?:usually |normally )?(?:performs|plays|portrays|voices|does) /.test(q) ||
      /^(?:who|which host) is .+ (?:played|performed|portrayed|voiced) by$/.test(q) ||
      includesAny(q, ["character performer", "recurring character mapping", "who is behind the character"]);
    var questionType = beginsWithAny(q, ["who", "which host", "which one of them"]) ||
      namedHostAttribution || anonymousSpeakerAttribution ? "speaker" :
      beginsWithAny(q, ["when"]) ? "when" :
        beginsWithAny(q, ["where"]) ? "where" :
          beginsWithAny(q, ["which"]) ? "which" :
            beginsWithAny(q, ["how many", "how often"]) ? "count" :
              beginsWithAny(q, ["did", "do", "does", "have", "has", "is", "are", "was", "were"]) ? "yes-no" :
                beginsWithAny(q, ["what", "how"]) ? "what" : "discovery";

    var liveHeatRequest = source === "livestream" && includesAny(q, [
      "chaos", "chaotic", "highest heat", "lowest heat", "hottest stream",
      "unhinged index", "unhinged score", "most unhinged", "least unhinged",
    ]);
    var unhingedRequest = includesAny(q, [
      "unhinged index", "unhinged score", "most unhinged", "least unhinged",
    ]);
    var mentionsRequest = includesAny(q, [
      "most discussed", "most mentioned", "mention", "mentions", "mentioned",
      "caption references", "caption reference",
    ]);
    var heatRequest = includesAny(q, ["hottest", "highest heat", "most chaotic"]);
    var viewMetricRequest = viewSelector || containsNormalizedPhrase(q, "views");
    var metric = compoundViewComedy ? "heat" :
      liveHeatRequest ? "live-heat" :
      unhingedRequest ? "unhinged" :
      viewMetricRequest || containsNormalizedPhrase(q, "popular") ? "views" :
        mentionsRequest ? "mentions" :
          heatRequest ? "heat" :
            temporal !== "all" ? "date" : "relevance";
    var direction = includesAny(q, ["lowest", "least", "earliest", "oldest"]) ? "ascending" : "descending";
    var opinionComparison = includesAny(q, [
      "hate most", "hated most", "like most", "liked most", "love most",
      "loved most", "least favorite", "least favourite", "least liked",
      "like least", "liked least", "love least", "loved least",
      "best", "worst", "favorite",
    ]);
    var performanceRequested = includesAny(q, [
      "performance", "performed", "performing", "impression", "impersonation",
      "in character", "portrays", "portrayed", "portrayal", "voiced", "voicing",
      "verified performance", "verified bit", "verified clip", "real performance",
      "real bit", "real clip", "performance receipt", "character clip",
      "doing loomis", "doing dr loomis", "doing doctor loomis", "did loomis",
      "do loomis", "does loomis", "doing challis", "doing dr challis",
      "doing doctor challis", "did challis", "do challis", "does challis",
      "doing slenderman", "doing slender man", "doing corey feldman",
    ]) || firstPerformanceGrammar || firstAppearanceGrammar || (
      includesAny(q, ["verified", "real"]) &&
      includesAny(q, ["bit", "clip", "performance", "moment", "receipt"])
    );
    var characterSignalRequested = !firstAppearanceGrammar && includesAny(q, [
      "character signal", "character signals", "ordinary reference", "ordinary references",
      "character reference", "character references", "caption signal", "caption signals",
      "signal", "signals", "reference", "references", "mentioned", "mentions",
      "show up", "showed up", "came up",
    ]);
    var yearMatch = q.match(/(?:^| )((?:19|20)\d{2})(?: |$)/);
    var visualResultRequest = includesAny(q, [
      "which kill won", "what kill won", "winning kill", "winner kill",
      "which death won", "what death won", "winning death", "winner death",
      "best kill", "best death", "kill ranked best", "death ranked best",
      "what kill ranked", "what death ranked", "which kill ranked",
      "which death ranked",
    ]);

    return {
      name: intent,
      source: source,
      sourceExplicit: sourceExplicit,
      archiveRequested: archiveRequested,
      archiveBatchSequence: archiveBatchSequence,
      visualResultRequest: visualResultRequest,
      temporal: temporal,
      temporalExplicit: temporal !== "all",
      popularity: popularity,
      popularityExplicit: popularity !== "all",
      topicOverviewRequest: topicOverviewRequest,
      firstAppearanceRequest: firstAppearanceGrammar,
      questionType: questionType,
      refusesSpeakerGuess: questionType === "speaker" && !mappingRequest,
      mappingRequest: mappingRequest,
      originRequest: originRequest,
      trajectory: trajectory,
      existenceRequest: existenceRequest,
      negativeExistence: negativeExistence,
      performanceRequested: performanceRequested,
      characterSignalRequested: characterSignalRequested,
      requestedYear: yearMatch ? Number(yearMatch[1]) : null,
      metric: metric,
      metricExplicit: compoundViewComedy || liveHeatRequest || unhingedRequest ||
        viewMetricRequest || mentionsRequest || heatRequest,
      direction: direction,
      sourceSelector: compoundViewComedy ? {
        metric: "views",
        direction: direction,
      } : null,
      opinionComparison: opinionComparison,
      normalized: q,
      words: tokens(q),
    };
  }

  function requestedLimitFromQuery(normalizedQuery) {
    var match = normalizedQuery.match(/\btop\s+(\d{1,2})\b/) ||
      normalizedQuery.match(
        /\b(?:show|give|list|find)(?:\s+me)?\s+(\d{1,2})\s+(?:(?:\w+)\s+){0,3}(?:soundbytes?|moments?|clips?|commentaries|watchalongs?|livestreams?|streams?|uploads?|videos?)\b/
      ) ||
      normalizedQuery.match(/\b(\d{1,2})\s+(?:newest|latest|oldest|most|least|funniest|wildest|craziest|soundbytes?|moments?|clips?|commentaries|watchalongs|livestreams|streams)\b/);
    if (!match) return null;
    return Math.max(1, Math.min(25, Number(match[1])));
  }

  function compileQueryPlan(query, parsedIntent) {
    var q = parsedIntent.normalized;
    var relativeTimeLanguage = includesAny(q, [
      "last night", "last nights", "yesterday",
    ]);
    var relativeStreamSelector = includesAny(q, [
      "last stream", "last livestream", "last live stream", "latest stream",
      "latest livestream", "latest live stream", "newest stream",
      "newest livestream", "newest live stream",
    ]);
    var relativeNewestStream = (relativeTimeLanguage || relativeStreamSelector) &&
      (!parsedIntent.sourceExplicit || parsedIntent.source === "livestream");
    var relativeExplicitLane = relativeTimeLanguage &&
      parsedIntent.sourceExplicit && parsedIntent.source !== "livestream";
    var yearFilter = Boolean(parsedIntent.requestedYear) && (
      new RegExp("\\b(?:in|from|during|uploaded|posted|published|released|dated)\\s+(?:" +
        "in\\s+)?"+ parsedIntent.requestedYear + "\\b").test(q) ||
      new RegExp("\\b" + parsedIntent.requestedYear + "\\s+(?:uploads?|commentaries|watchalongs|livestreams|streams|videos)\\b").test(q)
    );
    var requestedLimit = requestedLimitFromQuery(q);
    var countRequested = parsedIntent.questionType === "count" ||
      /\b(?:count|total|number of)\b/.test(q);
    var listRequested = /\b(?:list|every|all)\b/.test(q) ||
      Boolean(requestedLimit && requestedLimit > 1);
    var sourcePlural = /\b(?:commentaries|watchalongs|watch alongs|livestreams|live streams|streams|uploads|videos)\b/.test(q) ||
      (listRequested && /\b(?:commentary|watchalong|watch along|livestream|live stream|stream|upload|video)\b/.test(q));
    var recurringCharacterRoster = includesAny(q, [
      "recurring characters", "character roster", "characters do they do",
      "characters do they play", "characters do they portray",
      "who do they impersonate",
    ]);
    var characterProfileLanguage = includesAny(q, [
      "running gag", "recurring joke", "recurring jokes", "character profile",
      "what is the bit like", "what is the character like", "why is the",
      "tell me about the character",
    ]) || /\bwhat is .+ like\b/.test(q) ||
      /\brecurring\b.*\b(?:joke|jokes|bit|bits|gag|gags)\b/.test(q);
    var verifiedCharacterCountLanguage = countRequested && includesAny(q, [
      "verified", "performance", "performances", "soundbyte", "soundbytes",
      "character clip", "character clips", "clip", "clips", "bit", "bits",
    ]);
    var characterMentionCountLanguage = countRequested && includesAny(q, [
      "mention", "mentions", "mentioned", "reference", "references",
      "caption mention", "caption mentions", "caption reference",
      "caption references",
    ]);
    var curatedCharacterCountLanguage = verifiedCharacterCountLanguage ||
      (countRequested && includesAny(q, [
        "how often", "how many times do they do", "how many times does",
      ]));
    var curatedSoundbytes = includesAny(q, [
      "up in ya", "wwam up in ya",
    ]);
    var broadMemorabilitySuperlative = (
      includesAny(q, [
        "most deranged thing", "most deranged moment", "most deranged clip",
        "craziest thing", "craziest moment", "craziest clip",
        "wildest thing", "wildest moment", "wildest clip",
        "most fucked up thing", "most fucked up moment", "most fucked up clip",
      ]) ||
      /\btop\s+\d+\s+(?:craziest|wildest|most deranged|most fucked up)\s+(?:things?|moments?|clips?)\b/.test(q)
    );
    var outputShape = "single";
    if (broadMemorabilitySuperlative) outputShape = "surface-handoff";
    else if (recurringCharacterRoster) outputShape = "character-roster";
    else if (curatedSoundbytes) outputShape = "curated-soundbytes";
    else if (characterMentionCountLanguage) outputShape = "character-mention-count";
    else if (curatedCharacterCountLanguage) outputShape = "character-soundbyte-count";
    else if (characterProfileLanguage) outputShape = "character-profile";
    else if (countRequested && sourcePlural) outputShape = "source-count";
    else if (countRequested) outputShape = "count";
    else if (sourcePlural && (listRequested || yearFilter)) outputShape = "source-list";
    else if (parsedIntent.source !== "all" && (
      yearFilter ||
      /\b(?:least viewed|fewest views|lowest views)\b/.test(q)
    )) outputShape = "source-ranking";
    else if (requestedLimit && requestedLimit > 1) outputShape = "result-list";

    return {
      version: "query-plan/v1",
      canonicalQuery: q,
      subjectTerms: [],
      controls: {
        source: parsedIntent.source,
        relativeTime: relativeNewestStream ? "latest-indexed-stream" :
          relativeExplicitLane ? "latest-indexed-date-in-explicit-lane" : null,
        relativeDate: null,
        requestedYear: parsedIntent.requestedYear,
        yearFilter: yearFilter,
        selector: parsedIntent.metric,
        direction: parsedIntent.direction,
        requestedLimit: requestedLimit,
        navigation: null,
      },
      outputShape: outputShape,
      recurringCharacterRoster: recurringCharacterRoster,
      characterProfileLanguage: characterProfileLanguage,
      verifiedCharacterCountLanguage: verifiedCharacterCountLanguage,
      curatedCharacterCountLanguage: curatedCharacterCountLanguage,
      characterMentionCountLanguage: characterMentionCountLanguage,
      curatedSoundbytes: curatedSoundbytes,
      relativeNewestStream: relativeNewestStream,
      relativeExplicitLane: relativeExplicitLane,
      surfaceHandoff: broadMemorabilitySuperlative ? {
        id: "memorability-candidate-index-v2.1",
        href: "#red100",
        label: "Memorability Candidate Index V2.1",
        reason: "A global chaos superlative belongs to the published ranking engine, not unranked Ask retrieval.",
      } : null,
    };
  }

  function applyQueryPlan(parsedIntent, queryPlan) {
    var planned = Object.assign({}, parsedIntent, {
      queryPlan: queryPlan,
      yearFilter: queryPlan.controls.yearFilter,
    });
    if (queryPlan.relativeNewestStream) {
      planned.source = "livestream";
      planned.temporal = "latest";
      planned.temporalExplicit = true;
      planned.metric = "date";
      planned.metricExplicit = true;
      if (includesAny(planned.normalized, [
        "what did they talk about", "what are they talking about",
        "what topics", "which topics", "topic rundown", "what happened",
        "what happens",
      ])) {
        planned.name = "topic";
        planned.topicOverviewRequest = true;
      }
    }
    if (queryPlan.relativeExplicitLane) {
      planned.temporal = "latest";
      planned.temporalExplicit = true;
      planned.metric = "date";
      planned.metricExplicit = true;
    }
    if (queryPlan.curatedSoundbytes) {
      planned.name = "comedy";
      planned.sourceSelector = null;
    }
    queryPlan.controls.navigation = anchorMode(planned);
    queryPlan.controls.source = planned.source;
    queryPlan.controls.selector = planned.metric;
    return planned;
  }

  function romanVariant(value) {
    var roman = { ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10" };
    return normalize(value).split(" ").map(function (word) {
      return roman[word] || word;
    }).join(" ");
  }

  function aliasDefinitions(catalog, live, curated, characterLore) {
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
    ((characterLore && characterLore.characters) || []).forEach(function (profile) {
      var label = profile.name;
      var canonical = normalize(label);
      var existing = aliases.filter(function (definition) {
        return definition.type === "character" &&
          normalize(definition.character || definition.label) === canonical;
      })[0];
      var characterAliases = unique([canonical].concat(profile.aliases || []).map(normalize));
      var mapping = {
        characterId: profile.id || canonical.replace(/\s+/g, "-"),
        performedBy: profile.performedBy || null,
        hostAttribution: profile.hostAttribution || null,
      };
      if (existing) {
        existing.aliases = unique(existing.aliases.concat(characterAliases));
        existing.characterId = mapping.characterId;
        existing.performedBy = mapping.performedBy;
        existing.hostAttribution = mapping.hostAttribution;
      } else {
        aliases.push({
          type: "character",
          label: label,
          character: label,
          aliases: characterAliases,
          characterId: mapping.characterId,
          performedBy: mapping.performedBy,
          hostAttribution: mapping.hostAttribution,
        });
      }
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

  function containsNormalizedPhrase(query, phrase) {
    return (" " + query + " ").indexOf(" " + phrase + " ") >= 0;
  }

  function editDistance(left, right) {
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;
    var previous = [];
    var current = [];
    var index;
    for (index = 0; index <= right.length; index += 1) previous[index] = index;
    for (var leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      current = [leftIndex];
      for (var rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
        var substitution = previous[rightIndex - 1] +
          (left.charAt(leftIndex - 1) === right.charAt(rightIndex - 1) ? 0 : 1);
        current[rightIndex] = Math.min(
          current[rightIndex - 1] + 1,
          previous[rightIndex] + 1,
          substitution
        );
      }
      previous = current;
    }
    return previous[right.length];
  }

  function fuzzyTokenLimit(aliasWord, aliasWordCount) {
    if (/^\d+$/.test(aliasWord)) return 0;
    if (aliasWord.length >= 7) return 2;
    if (aliasWord.length >= 4) return 1;
    return aliasWordCount >= 3 && aliasWord.length >= 2 ? 1 : 0;
  }

  /*
   * Typo recovery is deliberately narrow: the phrase must be contiguous, every
   * token but one must be exact, and the remaining token gets only a small edit
   * budget. Single-word topic aliases are excluded because fuzzy matching words
   * such as "Saw" or "Horror" would create more false positives than value.
   */
  function fuzzyAliasDistance(queryWords, aliasWords, definition) {
    if (!aliasWords.length || queryWords.length < aliasWords.length) return null;
    if (definition.type === "topic" && aliasWords.length === 1) return null;
    if (aliasWords.length === 1 && aliasWords[0].length < 5) return null;

    var best = null;
    for (var start = 0; start <= queryWords.length - aliasWords.length; start += 1) {
      var changedWords = 0;
      var totalDistance = 0;
      var valid = true;
      for (var offset = 0; offset < aliasWords.length; offset += 1) {
        var aliasWord = aliasWords[offset];
        var queryWord = queryWords[start + offset];
        if (aliasWord === queryWord) continue;
        if (aliasWords.length === 1 && QUERY_CUE_WORDS.indexOf(queryWord) >= 0) {
          valid = false;
          break;
        }
        if (aliasWords.length === 1 && aliasWord.charAt(0) !== queryWord.charAt(0)) {
          valid = false;
          break;
        }
        changedWords += 1;
        if (changedWords > 1) {
          valid = false;
          break;
        }
        var distance = editDistance(aliasWord, queryWord);
        var distanceLimit = fuzzyTokenLimit(aliasWord, aliasWords.length);
        if (aliasWords.length === 1) distanceLimit = Math.min(1, distanceLimit);
        if (distance > distanceLimit) {
          valid = false;
          break;
        }
        totalDistance += distance;
      }
      if (valid && changedWords === 1 && (best == null || totalDistance < best)) {
        best = totalDistance;
      }
    }
    return best;
  }

  function identifyEntity(query, aliases, intent) {
    var q = canonicalizeQuery(query);
    var queryWords = q.split(" ").filter(Boolean);
    var matches = [];
    aliases.forEach(function (definition) {
      definition.aliases.forEach(function (alias) {
        var normalizedAlias = normalize(alias);
        if (!normalizedAlias) return;
        var aliasWords = normalizedAlias.split(" ");
        if (containsNormalizedPhrase(q, normalizedAlias)) {
          matches.push({
            definition: definition,
            alias: normalizedAlias,
            length: normalizedAlias.length,
            tokenCount: aliasWords.length,
            distance: 0,
            priority: entityPriority(definition, intent),
          });
          return;
        }
        var fuzzyDistance = fuzzyAliasDistance(queryWords, aliasWords, definition);
        if (fuzzyDistance != null) {
          matches.push({
            definition: definition,
            alias: normalizedAlias,
            length: normalizedAlias.length,
            tokenCount: aliasWords.length,
            distance: fuzzyDistance,
            priority: entityPriority(definition, intent),
          });
        }
      });
    });
    matches.sort(function (a, b) {
      return b.tokenCount - a.tokenCount ||
        a.distance - b.distance ||
        b.length - a.length ||
        b.priority - a.priority;
    });
    if (!matches.length) return null;
    return Object.assign({}, matches[0].definition, {
      matchedAlias: matches[0].alias,
      matchMode: matches[0].distance ? "conservative-typo" : "exact",
    });
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
      if (QUERY_CUE_WORDS.indexOf(word) >= 0) return false;
      if (QUERY_CONTROL_WORDS.indexOf(word) >= 0) return false;
      if (intent.archiveBatchSequence && /^(?:batch)?(?:0?[123]|first|second|third)$/.test(word)) return false;
      if (intent.yearFilter && String(intent.requestedYear) === word) return false;
      if (intent.queryPlan && intent.queryPlan.controls.requestedLimit != null &&
        String(intent.queryPlan.controls.requestedLimit) === word) return false;
      return !/^(?:st|nd|rd|th)$/.test(word);
    });
  }

  function sourceTitleTerms(value) {
    return unique(normalize(romanVariant(value)).split(" ").filter(function (word) {
      return (word.length > 1 || /^\d+$/.test(word)) &&
        STOP_WORDS.indexOf(word) < 0 &&
        (QUERY_CUE_WORDS.indexOf(word) < 0 ||
          word === "watchalong" || word === "watchalongs") &&
        SOURCE_TITLE_NOISE_WORDS.indexOf(word) < 0;
    }));
  }

  function indexedSourceRecords(candidates) {
    var records = {};
    candidates.forEach(function (candidate) {
      if (!candidate.sourceId || !candidate.sourceTitle) return;
      var key = candidate.source + "|" + candidate.sourceId;
      var record = records[key] || {
        source: candidate.source,
        sourceId: candidate.sourceId,
        sourceTitle: candidate.sourceTitle,
        date: candidate.date || "",
        views: Number(candidate.views || 0),
        lane: candidate.lane || null,
        restrictedToTopicNavigation: false,
        rightsMode: candidate.rightsMode || null,
        visualContextVerified: candidate.visualContextVerified,
        archiveBatchId: candidate.archiveBatchId || null,
        archiveBatchSequence: candidate.archiveBatchSequence || null,
        archiveBatchRank: candidate.archiveBatchRank || null,
        archivePortfolioRank: candidate.archivePortfolioRank || null,
      };
      record.restrictedToTopicNavigation = record.restrictedToTopicNavigation ||
        Boolean(candidate.restrictedToTopicNavigation);
      records[key] = record;
    });
    return Object.keys(records).map(function (key) {
      var record = records[key];
      record.titleTerms = sourceTitleTerms(record.sourceTitle);
      record.normalizedTitle = romanVariant(record.sourceTitle);
      return record;
    });
  }

  function sourceTitleTermMatch(queryTerms, titleTerms) {
    var used = {};
    var edits = 0;
    var exact = 0;
    for (var queryIndex = 0; queryIndex < queryTerms.length; queryIndex += 1) {
      var queryTerm = queryTerms[queryIndex];
      var exactIndex = -1;
      for (var titleIndex = 0; titleIndex < titleTerms.length; titleIndex += 1) {
        if (!used[titleIndex] && titleTerms[titleIndex] === queryTerm) {
          exactIndex = titleIndex;
          break;
        }
      }
      if (exactIndex >= 0) {
        used[exactIndex] = true;
        exact += 1;
        continue;
      }
      if (edits || /^\d+$/.test(queryTerm) || queryTerm.length < 5) return null;
      var fuzzyIndex = -1;
      for (var fuzzyCandidate = 0; fuzzyCandidate < titleTerms.length; fuzzyCandidate += 1) {
        var titleTerm = titleTerms[fuzzyCandidate];
        if (used[fuzzyCandidate] || /^\d+$/.test(titleTerm) ||
          titleTerm.charAt(0) !== queryTerm.charAt(0)) continue;
        if (editDistance(queryTerm, titleTerm) <= 1) {
          fuzzyIndex = fuzzyCandidate;
          break;
        }
      }
      if (fuzzyIndex < 0) return null;
      used[fuzzyIndex] = true;
      edits += 1;
    }
    return {
      edits: edits,
      exact: exact,
      residual: Math.max(0, titleTerms.length - queryTerms.length),
    };
  }

  function entityResidualTitleTerms(intent, entity) {
    if (!entity || !entity.matchedAlias) return [];
    var remaining = sourceTitleTerms(intent.normalized);
    sourceTitleTerms(entity.matchedAlias).forEach(function (aliasTerm) {
      var index = remaining.indexOf(aliasTerm);
      if (index >= 0) remaining.splice(index, 1);
    });
    return remaining;
  }

  /*
   * Indexed source titles are a separate namespace from film/franchise aliases.
   * A title may win over a broad franchise alias, but never over a complete film
   * alias unless the query also names source-specific words such as "trailer
   * breakdown". Numbers are exact-only so "Scream 8" cannot leak into Scream 1.
   */
  function selectIndexedSource(sourceIndex, intent, entity) {
    if (intent.sourceSelector || (entity && entity.type === "bit")) return null;
    var queryTerms = sourceTitleTerms(intent.normalized);
    var entityResidual = entityResidualTitleTerms(intent, entity);
    var entityScoped = entity &&
      (entity.type === "topic" || entity.type === "character");
    if (entityScoped && entityResidual.length) queryTerms = entityResidual;
    if (queryTerms.length < 2) return null;
    var watchAlongQuery = includesAny(intent.normalized, [
      "watchalong", "watchalongs", "watch along", "watch alongs",
    ]);
    if (entity && (entity.type === "film" || entity.type === "franchise") &&
      !entityResidual.length && !watchAlongQuery) return null;

    var matches = sourceIndex.filter(function (record) {
      var archiveWatchAlong = record.lane === "archive" && watchAlongQuery;
      if (intent.source !== "all" && record.source !== intent.source &&
        !archiveWatchAlong) return false;
      if (intent.archiveRequested && record.lane !== "archive") return false;
      if (intent.archiveBatchSequence &&
        record.archiveBatchSequence !== intent.archiveBatchSequence) return false;
      return true;
    }).map(function (record) {
      var titleContained = containsNormalizedPhrase(
        intent.normalized,
        record.normalizedTitle
      );
      var match = titleContained ? {
        edits: 0,
        exact: record.titleTerms.length,
        residual: 0,
      } : sourceTitleTermMatch(queryTerms, record.titleTerms);
      if (!match) return null;
      return Object.assign({}, record, match, {
        watchAlongTitle: Boolean(
          watchAlongQuery && record.lane === "archive" &&
          (record.titleTerms.indexOf("watchalong") >= 0 ||
            (record.titleTerms.indexOf("watch") >= 0 &&
              record.titleTerms.indexOf("along") >= 0))
        ),
        titleContained: titleContained,
        phraseExact: containsNormalizedPhrase(
          record.titleTerms.join(" "),
          queryTerms.join(" ")
        ),
      });
    }).filter(Boolean).sort(function (a, b) {
      return Number(b.watchAlongTitle) - Number(a.watchAlongTitle) ||
        Number(b.phraseExact) - Number(a.phraseExact) ||
        Number(b.titleContained) - Number(a.titleContained) ||
        a.edits - b.edits ||
        a.residual - b.residual ||
        dateValue(b.date) - dateValue(a.date) ||
        b.views - a.views ||
        a.sourceId.localeCompare(b.sourceId);
    });

    if (!matches.length) {
      var unresolvedNumber = entity &&
        (entity.type === "film" || entity.type === "franchise" || entity.type === "topic") &&
        entityResidual.some(function (term) { return /^\d+$/.test(term); });
      return unresolvedNumber ? {
        blocked: true,
        reason: "unresolved-numbered-title",
        queryTerms: queryTerms,
        matches: [],
      } : null;
    }

    var top = matches[0];
    var sameQuality = matches.filter(function (match) {
      return match.watchAlongTitle === top.watchAlongTitle &&
        match.phraseExact === top.phraseExact &&
        match.titleContained === top.titleContained &&
        match.edits === top.edits &&
        match.residual === top.residual;
    });
    var hasNumber = queryTerms.some(function (term) { return /^\d+$/.test(term); });
    var duplicateTitle = sameQuality.some(function (match) {
      return match.sourceId !== top.sourceId &&
        match.normalizedTitle === top.normalizedTitle;
    });
    if (duplicateTitle || (sameQuality.length > 1 && !hasNumber && queryTerms.length < 3)) {
      return {
        blocked: true,
        reason: duplicateTitle ? "duplicate-indexed-title" : "ambiguous-indexed-title",
        queryTerms: queryTerms,
        matches: sameQuality.slice(0, 5).map(function (match) {
          return {
            sourceId: match.sourceId,
            sourceTitle: match.sourceTitle,
            date: match.date,
            lane: match.lane,
          };
        }),
      };
    }
    return {
      mode: "indexed-title",
      source: top.source,
      sourceId: top.sourceId,
      sourceTitle: top.sourceTitle,
      date: top.date,
      views: top.views,
      lane: top.lane,
      restrictedToTopicNavigation: top.restrictedToTopicNavigation,
      rightsMode: top.rightsMode,
      visualContextVerified: top.visualContextVerified,
      archiveBatchId: top.archiveBatchId,
      archiveBatchSequence: top.archiveBatchSequence,
      archiveBatchRank: top.archiveBatchRank,
      archivePortfolioRank: top.archivePortfolioRank,
      metric: "title-relevance",
      direction: "descending",
      titleMatchMode: top.edits ? "near-exact" : "exact",
      matchedTerms: top.titleContained ? top.titleTerms : queryTerms,
      alternativeCount: Math.max(0, sameQuality.length - 1),
      tieBreak: sameQuality.length > 1 ? "latest-indexed-source" : null,
    };
  }

  /*
   * A generic "what are they talking about in the latest livestream?" query
   * names a source selector, not a topic entity. Resolve that source first,
   * then expose only its timestamped topic routes. This keeps the answer from
   * blending identically titled weekly streams or treating query words such
   * as "talking" as an archive subject.
   */
  function selectTopicOverviewSource(sourceIndex, intent) {
    if (!intent.topicOverviewRequest || intent.source !== "livestream") return null;
    if (["latest", "recent", "earliest"].indexOf(intent.temporal) < 0) return null;
    var direction = intent.temporal === "earliest" ? "ascending" : "descending";
    var records = sourceIndex.filter(function (record) {
      if (record.source !== "livestream") return false;
      if (intent.archiveRequested) return record.lane === "archive";
      return record.lane !== "archive";
    }).filter(function (record) {
      return dateValue(record.date) != null;
    }).sort(function (a, b) {
      var dateDifference = dateValue(a.date) - dateValue(b.date);
      if (dateDifference) return direction === "ascending" ? dateDifference : -dateDifference;
      return b.views - a.views || a.sourceId.localeCompare(b.sourceId);
    });
    if (!records.length) return null;
    var top = records[0];
    return {
      mode: "temporal-source",
      source: top.source,
      sourceId: top.sourceId,
      sourceTitle: top.sourceTitle,
      date: top.date,
      views: top.views,
      lane: top.lane,
      restrictedToTopicNavigation: top.restrictedToTopicNavigation,
      metric: "date",
      direction: direction,
      titleMatchMode: intent.temporal === "earliest" ?
        "earliest-indexed-livestream" : "latest-indexed-livestream",
      alternativeCount: 0,
      tieBreak: "captured date, then views, then source ID",
    };
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
      var lane = stream._lane || "fresh";
      var rightsPolicy = stream.rightsPolicy || {};
      var archiveBatch = stream.archiveBatch || {};
      var archiveFields = {
        archiveBatch: stream.archiveBatch || null,
        archiveBatchId: archiveBatch.id || null,
        archiveBatchSequence: Number(archiveBatch.sequence || 0) || null,
        archiveBatchRank: Number(archiveBatch.batchRank || 0) || null,
        archivePortfolioRank: Number(archiveBatch.portfolioRank || 0) || null,
        visualContextVerified: rightsPolicy.visualContextVerified === true,
      };
      var restrictedToTopicNavigation = lane === "archive" &&
        Boolean(rightsPolicy.restrictedToTopicNavigation);
      if (!restrictedToTopicNavigation) {
        output.push(Object.assign({
          key: "live-" + stream.id,
          kind: "livestream",
          source: "livestream",
          sourceId: stream.id,
          sourceTitle: stream.title,
          title: stream.title,
          subtitle: lane === "archive" ? "ARCHIVE DEEP" : "WWAM LIVE",
          franchise: "",
          date: stream.date,
          at: 0,
          category: lane === "archive" ? "ARCHIVE DEEP MAP" : "LIVE MAP",
          excerpt: sourceSummary,
          url: stream.url,
          streamRank: streamIndex,
          lane: lane,
          views: Number(stream.views || 0),
          liveHeat: liveHeat,
          duration: Number(stream.duration || 0),
          captioned: Boolean(stream.captioned),
          stream: stream,
          reviewStatus: lane === "archive" ? "machine-candidate" : null,
          originStatus: lane === "archive" ? "not-inferred" : null,
          restrictedToTopicNavigation: false,
          rightsMode: rightsPolicy.mode || null,
          evidenceType: "derived-source-summary",
        }, archiveFields));
      }
      (stream.topics || []).forEach(function (topic) {
        var topicEvidence = topic.evidence || {};
        output.push(Object.assign({
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
          excerpt: topic.receipt || "",
          mentions: Number(topic.mentions || 0),
          url: stream.url + "&t=" + Number(topic.peak || 0) + "s",
          streamRank: streamIndex,
          lane: lane,
          views: Number(stream.views || 0),
          liveHeat: liveHeat,
          captioned: Boolean(stream.captioned),
          stream: stream,
          reviewStatus: topicEvidence.reviewStatus ||
            (lane === "archive" ? "machine-candidate" : null),
          originStatus: topicEvidence.originStatus ||
            (lane === "archive" ? "not-inferred" : null),
          restrictedToTopicNavigation: restrictedToTopicNavigation,
          rightsMode: rightsPolicy.mode || null,
          evidence: topicEvidence,
          evidenceType: topic.receipt ? "caption-topic-receipt" : "caption-topic-navigation",
        }, archiveFields));
      });
      (stream.moments || []).forEach(function (moment, momentIndex) {
        var momentEvidence = moment.evidence || {};
        output.push(Object.assign({
          key: "live-moment-" + stream.id + "-" + Number(moment.t || 0),
          kind: "moment",
          source: "livestream",
          sourceId: stream.id,
          sourceTitle: stream.title,
          title: stream.title,
          subtitle: lane === "archive" ? "ARCHIVE DEEP MACHINE CANDIDATE" : "FRESH FROM LIVE",
          franchise: "",
          date: stream.date,
          at: Number(moment.t || 0),
          category: moment.category,
          excerpt: moment.quote || moment.excerpt || "",
          heat: Number(moment.heat || 0),
          url: stream.url + "&t=" + Number(moment.t || 0) + "s",
          streamRank: streamIndex,
          lane: lane,
          views: Number(stream.views || 0),
          liveHeat: liveHeat,
          captioned: Boolean(stream.captioned),
          momentRank: momentIndex,
          stream: stream,
          reviewStatus: momentEvidence.reviewStatus ||
            (lane === "archive" ? "machine-candidate" : null),
          originStatus: momentEvidence.originStatus ||
            (lane === "archive" ? "not-inferred" : null),
          restrictedToTopicNavigation: restrictedToTopicNavigation,
          rightsMode: rightsPolicy.mode || null,
          evidence: momentEvidence,
          evidenceType: "caption-excerpt",
        }, archiveFields));
      });
      (stream.characters || []).forEach(function (character, characterIndex) {
        var characterEvidence = character.evidence || {};
        output.push(Object.assign({
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
          lane: lane,
          views: Number(stream.views || 0),
          liveHeat: liveHeat,
          captioned: Boolean(stream.captioned),
          stream: stream,
          reviewStatus: characterEvidence.reviewStatus ||
            (lane === "archive" ? "machine-candidate" : null),
          originStatus: characterEvidence.originStatus ||
            (lane === "archive" ? "not-inferred" : null),
          restrictedToTopicNavigation: restrictedToTopicNavigation,
          rightsMode: rightsPolicy.mode || null,
          evidence: characterEvidence,
          evidenceType: "caption-character-signal",
        }, archiveFields));
      });
    });
    return output;
  }

  function sourceIdFromYouTubeUrl(value) {
    var source = String(value || "");
    var match =
      source.match(/^https:\/\/(?:www\.)?youtube\.com\/watch\?[^#]*\bv=([A-Za-z0-9_-]{11})(?:[&#]|$)/i) ||
      source.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[?#/]|$)/i);
    return match ? match[1] : "";
  }

  function characterPerformanceCandidates(characterLore, sourceById) {
    var output = [];
    ((characterLore && characterLore.characters) || []).forEach(function (profile) {
      (profile.soundbytes || []).forEach(function (receipt) {
        var source = sourceById.get(receipt.sourceId);
        var start = receipt.playback && Number(receipt.playback.start);
        var end = receipt.playback && Number(receipt.playback.end);
        var at = Number(receipt.t);
        var provenance = receipt.provenance || {};
        var duration = Number(source && source.duration || 0);
        var valid = receipt.id && receipt.sourceId && receipt.url && source &&
          sourceIdFromYouTubeUrl(receipt.url) === receipt.sourceId &&
          provenance.timestampStatus === "exact-caption-event" &&
          normalize(provenance.selection).indexOf("human curated") >= 0 &&
          Number(receipt.confidence || 0) >= 0.75 &&
          Number.isFinite(at) && at >= 0 &&
          (!duration || at <= duration + 1) &&
          Number.isFinite(start) && Number.isFinite(end) &&
          start <= at && end > at &&
          (!duration || end <= duration + 1);
        if (!valid) return;
        output.push({
          key: "character-performance-" + profile.id + "-" + receipt.id,
          kind: "character-performance",
          source: receipt.sourceType || "livestream",
          sourceId: receipt.sourceId,
          sourceTitle: receipt.sourceTitle,
          title: profile.name,
          subtitle: receipt.sourceTitle,
          franchise: "",
          date: receipt.date,
          at: Number(receipt.t),
          category: "CHARACTER PERFORMANCE",
          excerpt: receipt.excerpt,
          url: receipt.url,
          captioned: true,
          character: profile.name,
          characterId: profile.id,
          characterStatus: "human-curated performance candidate",
          trigger: receipt.trigger || "",
          note: receipt.note || "",
          curationConfidence: Number(receipt.confidence || 0),
          performanceReceiptId: receipt.id,
          playback: receipt.playback,
          provenance: receipt.provenance,
          evidenceType: "curated-character-performance",
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
      return (candidate.kind === "character" || candidate.kind === "character-performance") &&
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
      candidate.trigger,
      candidate.note,
    ].join(" "));
  }

  function termMatches(candidate, terms) {
    var text = candidateText(candidate);
    return terms.filter(function (term) {
      return containsNormalizedPhrase(text, normalize(term));
    });
  }

  function hasSubjectCoverage(candidate, subjectTerms) {
    if (!subjectTerms.length) return true;
    var matches = termMatches(candidate, subjectTerms).length;
    var required = subjectTerms.length === 1 ? 1 : Math.ceil(subjectTerms.length * 0.67);
    return matches >= required;
  }

  function phraseOccurrences(words, phrase) {
    var phraseWords = normalize(phrase).split(" ").filter(Boolean);
    var output = [];
    if (!phraseWords.length) return output;
    for (var start = 0; start <= words.length - phraseWords.length; start += 1) {
      var matches = true;
      for (var offset = 0; offset < phraseWords.length; offset += 1) {
        if (words[start + offset] !== phraseWords[offset]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        output.push({
          term: phrase,
          start: start,
          end: start + phraseWords.length - 1,
        });
      }
    }
    return output;
  }

  function negatedOccurrence(words, occurrence) {
    var normalizedTerm = normalize(occurrence.term);
    if (beginsWithAny(normalizedTerm, ["not", "dont", "didnt", "couldnt", "never"])) {
      return false;
    }
    var previous = words.slice(Math.max(0, occurrence.start - 4), occurrence.start);
    return previous.some(function (word) {
      return ["not", "no", "never", "dont", "doesnt", "didnt", "isnt", "wasnt", "without"].indexOf(word) >= 0;
    });
  }

  function occurrenceDistance(left, right) {
    if (left.end < right.start) return right.start - left.end - 1;
    if (right.end < left.start) return left.start - right.end - 1;
    return 0;
  }

  function evaluativeStrength(term, polarity) {
    var normalizedTerm = normalize(term);
    if (["worst", "best", "favorite", "never watch"].indexOf(normalizedTerm) >= 0) return 7;
    if (["hate", "hated", "love", "loved", "couldnt stand"].indexOf(normalizedTerm) >= 0) return 6;
    if (["awful", "terrible", "trash", "garbage", "amazing", "awesome", "perfect"].indexOf(normalizedTerm) >= 0) return 5;
    if (["dont like", "didnt like", "not good", "beautiful", "excellent", "really like"].indexOf(normalizedTerm) >= 0) return 4;
    if (polarity === "negative" && ["sucks", "suck", "stupid", "dumb", "ruined", "boring", "ugly"].indexOf(normalizedTerm) >= 0) return 3;
    return 2;
  }

  function proximityPairs(words, evaluativeTerms, targetHits, polarity, maximumDistance) {
    var pairs = [];
    var distanceLimit = Number.isFinite(Number(maximumDistance)) ?
      Number(maximumDistance) : OPINION_PROXIMITY_WORDS;
    evaluativeTerms.forEach(function (term) {
      phraseOccurrences(words, term).forEach(function (evaluation) {
        if (negatedOccurrence(words, evaluation)) return;
        targetHits.forEach(function (target) {
          var distance = occurrenceDistance(evaluation, target);
          if (distance > distanceLimit) return;
          pairs.push({
            polarity: polarity,
            evaluativeTerm: term,
            targetTerm: target.term,
            distance: distance,
            strength: evaluativeStrength(term, polarity) +
              Math.max(0, distanceLimit - distance) / 2,
          });
        });
      });
    });
    return pairs;
  }

  function polaritySupport(pairs, polarity) {
    var matching = pairs.filter(function (pair) { return pair.polarity === polarity; });
    return {
      evaluativeTerms: unique(matching.map(function (pair) { return pair.evaluativeTerm; })),
      targetTerms: unique(matching.map(function (pair) { return pair.targetTerm; })),
      pairs: matching,
      strength: matching.reduce(function (strongest, pair) {
        return Math.max(strongest, pair.strength);
      }, 0),
    };
  }

  function opinionEvidenceSupport(candidate) {
    var words = normalize(candidate.excerpt).split(" ").filter(Boolean);
    var targetHits = [];
    var referentHits = [];
    TAKE_TARGET_TERMS.forEach(function (term) {
      targetHits = targetHits.concat(phraseOccurrences(words, term));
    });
    SCREEN_REFERENT_TERMS.forEach(function (term) {
      referentHits = referentHits.concat(phraseOccurrences(words, term));
    });
    var directPairs = proximityPairs(words, NEGATIVE_EVALUATIVE_TERMS, targetHits, "negative")
      .concat(proximityPairs(words, POSITIVE_EVALUATIVE_TERMS, targetHits, "positive"));
    var referentialPairs = proximityPairs(
        words,
        NEGATIVE_EVALUATIVE_TERMS,
        referentHits,
        "negative",
        SCREEN_REFERENT_PROXIMITY_WORDS
      )
      .concat(proximityPairs(
        words,
        POSITIVE_EVALUATIVE_TERMS,
        referentHits,
        "positive",
        SCREEN_REFERENT_PROXIMITY_WORDS
      ));
    var pairs = directPairs.concat(referentialPairs);
    var negative = polaritySupport(pairs, "negative");
    var positive = polaritySupport(pairs, "positive");
    return {
      evaluativeTerms: unique(negative.evaluativeTerms.concat(positive.evaluativeTerms)),
      targetTerms: unique(negative.targetTerms.concat(positive.targetTerms)),
      proximityPairs: pairs,
      directProximityPairs: directPairs,
      referentialPairs: referentialPairs,
      maxDistance: OPINION_PROXIMITY_WORDS,
      strength: Math.max(negative.strength, positive.strength),
      negative: negative,
      positive: positive,
    };
  }

  function trajectoryEvidenceSupport(candidate) {
    var support = opinionEvidenceSupport(candidate);
    var directNegative = polaritySupport(support.directProximityPairs, "negative");
    var directPositive = polaritySupport(support.directProximityPairs, "positive");
    return {
      evaluativeTerms: unique(directNegative.evaluativeTerms.concat(directPositive.evaluativeTerms)),
      targetTerms: unique(directNegative.targetTerms.concat(directPositive.targetTerms)),
      proximityPairs: support.directProximityPairs,
      maxDistance: support.maxDistance,
      strength: Math.max(directNegative.strength, directPositive.strength),
    };
  }

  function isTrajectoryEvidence(candidate) {
    var support = trajectoryEvidenceSupport(candidate);
    return candidate.kind === "moment" &&
      candidate.evidenceType === "caption-excerpt" &&
      candidate.reviewStatus !== "machine-candidate" &&
      !candidate.curatedRank &&
      TAKE_EVIDENCE_CATEGORIES.indexOf(candidate.category) >= 0 &&
      support.proximityPairs.length > 0;
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
    var annotation = normalize([candidate.trigger, candidate.note].join(" "));
    var breakdown = [];
    var reasons = [];
    var matchedTerms = [];
    var matchedSubjectTerms = termMatches(candidate, subjectTerms);
    var opinionSupport = ["negative", "positive", "opinion", "trajectory"].indexOf(intent.name) >= 0 ?
      opinionEvidenceSupport(candidate) : null;

    if (entityMatches(candidate, entity)) {
      var entityPoints = entity.type === "bit" ? 190 :
        entity.type === "film" ? 165 :
          entity.type === "character" ? 155 :
            entity.type === "topic" ? 145 : 115;
      var entityReason = entity.type === "film" ? "exact film" :
        entity.type === "topic" ? "exact topic" :
          entity.type === "character" ?
            (candidate.kind === "character-performance" ? "exact curated character performance" : "exact character signal") :
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
      if (annotation.indexOf(term) >= 0) points = Math.max(points, 22);
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
    if (intent.selectedSource && candidate.sourceId === intent.selectedSource.sourceId) {
      addScore(
        breakdown,
        52,
        "inside selected source",
        intent.selectedSource.sourceTitle || intent.selectedSource.sourceId
      );
      reasons.push("inside selected source");
    }
    if (intent.anchorMode === "similar" && intent.resultAnchor &&
      candidate.category === intent.resultAnchor.category) {
      addScore(breakdown, 64, "same receipt category", candidate.category);
      reasons.push("same receipt category");
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
    if (intent.name === "negative" && opinionSupport && opinionSupport.negative.pairs.length) {
      addScore(
        breakdown,
        82 + opinionSupport.negative.strength * 5,
        "target-proximate negative evidence",
        opinionSupport.negative.evaluativeTerms.join(", ") + " → " +
          opinionSupport.negative.targetTerms.join(", ")
      );
      reasons.push("target-proximate negative evidence");
    }
    if (intent.name === "positive" && opinionSupport && opinionSupport.positive.pairs.length) {
      addScore(
        breakdown,
        82 + opinionSupport.positive.strength * 5,
        "target-proximate positive evidence",
        opinionSupport.positive.evaluativeTerms.join(", ") + " → " +
          opinionSupport.positive.targetTerms.join(", ")
      );
      reasons.push("target-proximate positive evidence");
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
    if (candidate.kind === "character-performance") {
      var performancePoints = intent.performanceRequested || intent.mappingRequest ? 112 :
        intent.name === "comedy" ? 96 :
          intent.temporal !== "all" ? 84 : 58;
      addScore(breakdown, performancePoints, "human-curated character performance", candidate.performanceReceiptId);
      addScore(breakdown, Math.round(Number(candidate.curationConfidence || 0) * 12),
        "curation confidence", String(candidate.curationConfidence || 0));
      reasons.unshift("human-curated character performance");
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
      opinionEvidence: intent.name === "negative" || intent.name === "positive" ?
        Object.assign({ category: candidate.category }, opinionSupport) : null,
    };
  }

  function hasOpinionEvidence(candidate, intent) {
    if (candidate.kind !== "moment" || candidate.evidenceType !== "caption-excerpt") return false;
    if (TAKE_EVIDENCE_CATEGORIES.indexOf(candidate.category) < 0) return false;
    var support = opinionEvidenceSupport(candidate);
    if (intent.name === "negative") {
      return CATEGORY_INTENTS.negative.indexOf(candidate.category) >= 0 &&
        support.negative.pairs.length > 0;
    }
    if (intent.name === "positive") {
      return CATEGORY_INTENTS.positive.indexOf(candidate.category) >= 0 &&
        support.positive.pairs.length > 0;
    }
    return support.proximityPairs.length > 0;
  }

  function candidateInScope(candidate, intent, entity, subjectTerms) {
    if (intent.source !== "all" && candidate.source !== intent.source) return false;
    if (intent.archiveRequested && candidate.lane !== "archive") return false;
    if (intent.archiveBatchSequence &&
      candidate.archiveBatchSequence !== intent.archiveBatchSequence) return false;
    if (candidate.lane === "archive" && !intent.archiveRequested &&
      (intent.metric !== "relevance" || intent.temporal !== "all")) return false;
    if (intent.yearFilter &&
      String(candidate.date || "").slice(0, 4) !== String(intent.requestedYear)) return false;
    if (intent.queryPlan && intent.queryPlan.controls.relativeDate &&
      candidate.date !== intent.queryPlan.controls.relativeDate) return false;
    var outputShape = intent.queryPlan && intent.queryPlan.outputShape;
    if (["source-count", "source-list", "source-ranking"].indexOf(outputShape) >= 0 &&
      candidate.kind !== "tape" && candidate.kind !== "livestream") return false;
    if (outputShape === "curated-soundbytes" && !candidate.curatedRank) return false;
    if ((outputShape === "character-soundbyte-count" ||
      outputShape === "character-profile" ||
      outputShape === "character-roster") &&
      candidate.kind !== "character-performance") return false;
    if (entity && !entityMatches(candidate, entity)) return false;
    if (!entity && subjectTerms.length && !hasSubjectCoverage(candidate, subjectTerms)) return false;
    if (intent.topicOverviewRequest && candidate.kind !== "topic") return false;
    if ((intent.name === "trajectory" || intent.name === "opinion") && !isTrajectoryEvidence(candidate)) return false;
    if (intent.name === "comedy" &&
      outputShape !== "curated-soundbytes" &&
      candidate.kind !== "character-performance" &&
      (candidate.kind !== "moment" ||
        (candidate.lane !== "archive" &&
          CATEGORY_INTENTS.comedy.indexOf(candidate.category) < 0))) return false;
    if ((intent.name === "negative" || intent.name === "positive") &&
      !intent.refusesSpeakerGuess && !hasOpinionEvidence(candidate, intent)) return false;
    if (intent.metric === "unhinged" && candidate.kind !== "tape") return false;
    if (intent.metric === "live-heat" && candidate.kind !== "livestream") return false;
    if (intent.metric === "mentions" && candidate.kind !== "topic" && candidate.kind !== "character") return false;
    if (intent.metric === "views" && candidate.kind !== "tape" && candidate.kind !== "livestream" &&
      !(entity && (entity.type === "topic" || entity.type === "character"))) return false;
    if (!intent.topicOverviewRequest &&
      (intent.temporal === "latest" || intent.temporal === "earliest") &&
      !entity && intent.name !== "comedy" && candidate.kind !== "tape" && candidate.kind !== "livestream") return false;
    if (entity && entity.type === "character") {
      var appearanceSignalFallback = intent.firstAppearanceRequest &&
        !intent.characterPerformanceArchiveAvailable;
      var performanceMode = (intent.performanceRequested && !appearanceSignalFallback) ||
        intent.mappingRequest ||
        (intent.characterPerformanceArchiveAvailable &&
          !intent.characterSignalRequested && !intent.originRequest &&
          (intent.name === "comedy" ||
            intent.temporal === "latest" || intent.temporal === "earliest" || intent.temporal === "recent"));
      var signalMode = intent.characterSignalRequested ||
        (intent.originRequest && (!intent.performanceRequested || appearanceSignalFallback));
      if (performanceMode && candidate.kind !== "character-performance") return false;
      if (signalMode && candidate.kind !== "character") return false;
    }
    return true;
  }

  function dateValue(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
    return Number(String(value).replace(/-/g, ""));
  }

  function sourceLevelRank(candidate, entity) {
    if (entity && entity.type === "topic" && candidate.kind === "topic") return 4;
    if (entity && entity.type === "character" && candidate.kind === "character-performance") return 5;
    if (entity && entity.type === "character" && candidate.kind === "character") return 4;
    if (entity && entity.type === "bit" && candidate.curatedLabel) return 4;
    if (candidate.kind === "tape" || candidate.kind === "livestream") return 3;
    if (candidate.kind === "topic" || candidate.kind === "character") return 2;
    return 1;
  }

  function compareCandidates(a, b, intent, entity) {
    var direction = intent.direction === "ascending" ? 1 : -1;
    if (intent.queryPlan && intent.queryPlan.outputShape === "curated-soundbytes") {
      var curatedDifference = Number(a.curatedRank || Number.MAX_SAFE_INTEGER) -
        Number(b.curatedRank || Number.MAX_SAFE_INTEGER);
      if (curatedDifference) return curatedDifference;
    }
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
    if (intent.name === "negative" || intent.name === "positive") {
      var polarity = intent.name;
      var aOpinionStrength = Number(
        a.opinionEvidence && a.opinionEvidence[polarity] &&
        a.opinionEvidence[polarity].strength || 0
      );
      var bOpinionStrength = Number(
        b.opinionEvidence && b.opinionEvidence[polarity] &&
        b.opinionEvidence[polarity].strength || 0
      );
      if (aOpinionStrength !== bOpinionStrength) return bOpinionStrength - aOpinionStrength;
    }
    if (intent.name === "comedy") {
      var aComedy = a.lane === "archive" && a.kind === "moment" ? 1 :
        (CATEGORY_INTENTS.comedy.indexOf(a.category) >= 0 ? 1 : 0);
      var bComedy = b.lane === "archive" && b.kind === "moment" ? 1 :
        (CATEGORY_INTENTS.comedy.indexOf(b.category) >= 0 ? 1 : 0);
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

  function isTimedReceipt(candidate) {
    return candidate.kind !== "tape" && candidate.kind !== "livestream" &&
      Number.isFinite(Number(candidate.at)) && Number(candidate.at) >= 0;
  }

  function exactAnchorMatch(candidate, anchor) {
    if (!anchor || candidate.sourceId !== anchor.sourceId) return false;
    if (anchor.key) return candidate.key === anchor.key;
    return Number(candidate.at || 0) === Number(anchor.at || 0) &&
      (!anchor.kind || candidate.kind === anchor.kind);
  }

  function anchorScopedCandidates(scoped, intent, anchor, mode) {
    if (!anchor || !mode) return scoped;
    var withinSource = scoped.filter(function (candidate) {
      return candidate.sourceId === anchor.sourceId;
    });
    if (mode === "exact") {
      return withinSource.filter(function (candidate) {
        return exactAnchorMatch(candidate, anchor);
      });
    }
    if (mode === "next") {
      return withinSource.filter(function (candidate) {
        return isTimedReceipt(candidate) && Number(candidate.at) > Number(anchor.at || 0);
      });
    }
    if (mode === "previous") {
      return withinSource.filter(function (candidate) {
        return isTimedReceipt(candidate) && Number(candidate.at) < Number(anchor.at || 0);
      });
    }
    if (mode === "similar") {
      withinSource = withinSource.filter(function (candidate) {
        return !exactAnchorMatch(candidate, anchor);
      });
    }
    if (anchorWantsMoment(intent, mode)) {
      var timed = withinSource.filter(isTimedReceipt);
      if (timed.length) return timed;
    }
    return withinSource;
  }

  function selectCompoundSource(candidates, intent, entity, subjectTerms) {
    if (!intent.sourceSelector) return null;
    var sourceIntent = Object.assign({}, intent, {
      name: "ranking",
      metric: intent.sourceSelector.metric,
      temporal: "all",
      sourceSelector: null,
      selectedSource: null,
    });
    var sourceCandidates = candidates.filter(function (candidate) {
      return candidateInScope(candidate, sourceIntent, entity, subjectTerms);
    }).map(function (candidate) {
      return Object.assign(
        {},
        candidate,
        scoreCandidate(candidate, sourceIntent, entity, expandedTerms(sourceIntent), subjectTerms)
      );
    }).sort(function (a, b) {
      return compareCandidates(a, b, sourceIntent, entity);
    });
    if (!sourceCandidates.length) return null;
    var top = sourceCandidates[0];
    return {
      source: top.source,
      sourceId: top.sourceId,
      sourceTitle: top.sourceTitle || top.title,
      date: top.date,
      views: Number(top.views || 0),
      metric: intent.sourceSelector.metric,
      direction: intent.sourceSelector.direction,
    };
  }

  function resultLabel(candidate) {
    if (candidate.kind === "character-performance") return "CURATED CHARACTER PERFORMANCE";
    if (candidate.lane === "archive") {
      if (candidate.kind === "topic" && candidate.restrictedToTopicNavigation) {
        return "ARCHIVE TOPIC NAVIGATION";
      }
      if (candidate.kind === "topic") return "ARCHIVE DEEP TOPIC CANDIDATE";
      if (candidate.kind === "character") return "ARCHIVE DEEP CHARACTER CANDIDATE";
      if (candidate.kind === "moment") return "ARCHIVE DEEP MOMENT CANDIDATE";
      return "ARCHIVE DEEP MAP";
    }
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
    if (intent.visualContextRefusal && intent.selectedSource) {
      return "The captions can route you inside " + intent.selectedSource.sourceTitle +
        ", but they cannot verify which on-screen kill or death won the visual ranking. " +
        "Open the original for that result; Ask the Tape will not convert caption text into a visual verdict.";
    }
    if (intent.titleBoundary) {
      if (intent.titleBoundary.reason === "unresolved-numbered-title") {
        return "No indexed source title matches \"" +
          intent.titleBoundary.queryTerms.join(" ") +
          "\". The sequel number is being kept exact, so I will not substitute an older franchise entry.";
      }
      return "That wording matches more than one indexed source title, so I will not choose one arbitrarily. " +
        "Add a date or a distinguishing title phrase such as trailer reaction, spoiler review, or breakdown.";
    }
    if (intent.selectedSource && intent.selectedSource.restrictedToTopicNavigation) {
      return intent.selectedSource.sourceTitle +
        " is available only as topic navigation under the source-audio firewall. " +
        "This source cannot supply comedy excerpts, character clips, or soundbytes, and I will not substitute adjacent franchise content.";
    }
    if (intent.refusesSpeakerGuess) {
      return "The available auto-captions are not speaker-diarized, so I cannot identify a host, and I found no defensible matching receipt to point to.";
    }
    if (intent.queryPlan && intent.queryPlan.controls.relativeDate) {
      return "No indexed " + sourceNoun(intent.source) + " dated " +
        intent.queryPlan.controls.relativeDate +
        " matches this question. The explicit source lane was preserved, and the engine did not substitute a livestream or an older upload.";
    }
    if (intent.performanceRequested && entity && entity.type === "character") {
      return "I found no timestamped curated performance candidate for " + entity.label +
        " in this search index. Ordinary character mentions are not being promoted into impressions.";
    }
    if (intent.name === "negative" || intent.name === "positive" || intent.name === "opinion") {
      return "No target-proximate evaluative receipt supports" +
        (subject ? ' "' + subject + '"' : " that opinion question") +
        " in the current index. Unrelated profanity, jokes, and isolated sentiment words were rejected. " +
        "That is an archive gap, not proof the subject was never discussed.";
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
    if (top.restrictedToTopicNavigation) {
      return "Topic-only navigation inside " + (top.sourceTitle || top.title) +
        " points to " + location +
        ". Excerpts, comedy moments, character clips, and soundbytes remain withheld by the source-audio firewall.";
    }
    if (intent.anchorMode === "exact" && intent.resultAnchor) {
      return "Exact receipt replay: " + location +
        ". The result stays on the same indexed source and timestamp; speaker attribution remains unavailable.";
    }
    if (intent.anchorMode === "previous" && intent.resultAnchor) {
      return "The previous indexed receipt in the same source before " +
        formatTime(intent.resultAnchor.at) + " is " + location +
        ". This is the previous indexed highlight, not a claim about the literal previous caption line.";
    }
    if (intent.anchorMode === "next" && intent.resultAnchor) {
      return "The next indexed receipt in the same source after " +
        formatTime(intent.resultAnchor.at) + " is " + location +
        ". This is the next indexed highlight, not a claim about the literal next spoken line.";
    }
    if (intent.anchorMode === "similar" && intent.resultAnchor) {
      return "Another indexed receipt from the same source is " + location +
        ". The original receipt was excluded; category similarity is a retrieval signal, not a claim that the moments are identical.";
    }
    if (intent.queryPlan && intent.queryPlan.outputShape === "source-count" &&
      intent.collection) {
      return "The current bounded index contains " + intent.collection.total + " unique indexed " +
        intent.collection.unit + (entity ? " for " + entityLabel : "") +
        ". This count is computed before the display limit and does not count multiple moments from one source as separate uploads.";
    }
    if (intent.queryPlan && intent.queryPlan.outputShape === "source-list" &&
      intent.collection) {
      return "The current bounded index contains " + intent.collection.total + " matching " +
        intent.collection.unit + (entity ? " for " + entityLabel : "") +
        ". " + Math.min(intent.collection.total, intent.collection.displayed || ranked.length) +
        " source-level records are shown in the requested order; moment receipts are not being counted as separate uploads.";
    }
    if (intent.queryPlan && intent.queryPlan.outputShape === "curated-soundbytes" &&
      intent.collection) {
      return "WWAM UP IN YA contains " + intent.collection.total +
        " curated timestamped soundbytes in the current set. Showing the first " +
        (intent.collection.displayed || ranked.length) +
        " in explicit curated order; this order is not being presented as a Mike/J vote.";
    }
    if (intent.queryPlan && intent.queryPlan.outputShape === "character-roster" &&
      intent.collection) {
      return "The grounded recurring-character roster contains " + intent.collection.total +
        " profiles: " + ranked.map(function (result) {
          var profile = result.rosterProfile || {};
          return (profile.name || result.character || result.title) + " (" +
            Number(profile.curatedPerformanceCandidates || 0) +
            " curated performance candidates)";
        }).join("; ") +
        ". Locked candidates are excluded, every playable clip remains speaker-undiarized, and none carries an authenticated editor-verification decision.";
    }
    if (intent.queryPlan && intent.queryPlan.outputShape === "character-profile" &&
      intent.characterProfile) {
      var behaviorLabels = (intent.characterProfile.behaviorPatterns || [])
        .slice(0, 4).map(function (pattern) { return pattern.label; });
      return "Grounded Character Lore profile for " + intent.characterProfile.name + ": " +
        intent.characterProfile.profile +
        (behaviorLabels.length ? " Recurring moves: " + behaviorLabels.join("; ") + "." : "") +
        " This derived profile resolves to " +
        Number(intent.characterProfile.metrics && intent.characterProfile.metrics.curatedPerformanceCandidates ||
          (intent.characterProfile.soundbytes || []).length) +
        " timestamped human-curated performance candidates; it is not a fabricated quote, an authenticated editor-verification decision, or a clip-level speaker claim.";
    }
    if (intent.queryPlan && intent.queryPlan.outputShape === "character-soundbyte-count" &&
      intent.collection && intent.characterProfile) {
      return "The current Character Lore set contains " + intent.collection.total +
        " timestamped human-curated " + intent.characterProfile.name +
        " performance candidates. None is being presented as an authenticated editor-verification decision. This is not " +
        Number(intent.characterProfile.metrics && intent.characterProfile.metrics.archiveMentions || 0) +
        " broad caption mentions or " +
        Number(intent.characterProfile.metrics && intent.characterProfile.metrics.sourcesWithMentions || 0) +
        " sources with mentions.";
    }
    if (intent.queryPlan && intent.queryPlan.outputShape === "character-mention-count" &&
      intent.collection && intent.characterProfile) {
      return "The broad caption index contains " + intent.collection.total + " " +
        intent.characterProfile.name + " mention matches across " +
        Number(intent.collection.sourceTotal || 0) +
        " sources. Mention matches include ordinary discussion and are not a count of curated performance candidates.";
    }
    if (intent.topicOverviewRequest && intent.selectedSource) {
      var overviewLabel = intent.temporal === "earliest" ?
        "Earliest" : "Newest";
      var topicRoutes = ranked.filter(function (result) {
        return result.kind === "topic";
      }).map(function (result) {
        return result.title + " at " + formatTime(result.at);
      });
      return overviewLabel + " indexed livestream in the current " +
        (intent.archiveRequested ? "Archive Deep" : "promoted") + " scope: " +
        intent.selectedSource.sourceTitle + " on " + intent.selectedSource.date +
        ". Its source-scoped topic map includes " + topicRoutes.join("; ") +
        ". These are indexed chapter receipts from that one source, not blended streams or invented dialogue; " +
        "open a route to inspect the captured caption evidence.";
    }
    if (intent.name === "comedy" && intent.selectedSource) {
      if (intent.selectedSource.mode === "indexed-title") {
        return "Inside the " + intent.selectedSource.titleMatchMode +
          " indexed source-title match " + intent.selectedSource.sourceTitle +
          ", the strongest available comedy route is " + location +
          ", filed as " + top.category + ".";
      }
      var sourceExtreme = intent.selectedSource.direction === "ascending" ?
        "least-viewed" : "most-viewed";
      return "Inside " + intent.selectedSource.sourceTitle + " — the " + sourceExtreme +
        " indexed " + sourceNoun(intent.selectedSource.source) + " at " +
        Number(intent.selectedSource.views || 0).toLocaleString("en-US") +
        " official views — the strongest indexed comedy route is " + location +
        ", filed as " + top.category + ".";
    }
    if (intent.originRequest) {
      if (entity && entity.type === "character") {
        if (top.kind === "character-performance") {
          return "Archive boundary: the earliest curated " + entityLabel +
            " performance candidate in the current bounded set is " + location +
            ". This is an archive-first receipt for the bounded set, not a claim that the bit or portrayal originated there.";
        }
        return "Archive boundary: the earliest machine-indexed " + entityLabel +
          " character signal in this broad caption index is " + location +
          ". This machine-indexed signal is not the same as Lore's timestamped human-curated performance candidate for the current bounded set. " +
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
    if (intent.existenceRequest) {
      if (intent.negativeExistence) {
        return "No — the current bounded index contains a defensible " + entityLabel +
          " receipt at " + location +
          ". That answers the archive-level “never” claim; it is not an exhaustive claim about every broadcast.";
      }
      return "Yes — the current bounded index contains a defensible " + entityLabel +
        " receipt at " + location + ".";
    }
    if (intent.metric === "views") {
      var viewExtreme = intent.direction === "ascending" ? "least-viewed" : "most-viewed";
      return "By the captured official view snapshot, " + (top.sourceTitle || top.title) +
        " is the " + viewExtreme + " indexed " + sourceNoun(top.source) +
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
      if (top.kind === "character-performance") {
        return "Strongest source-grounded comedy route in the current curated " + entityLabel +
          " performance set: " + location + ". This is a timestamped curated candidate route, not an objective claim that one bit is the funniest and not an authenticated verification.";
      }
      return "Fastest evidence-backed route to chaos: " + location + ", filed as " + top.category + ".";
    }
    if (intent.temporal === "latest") {
      if (top.kind === "character-performance") {
        return "Latest curated " + entityLabel + " performance candidate in the current bounded set: " +
          location + ".";
      }
      return "Most recent indexed " + sourceNoun(top.source) + " match: " + location + ".";
    }
    if (intent.temporal === "earliest") {
      if (top.kind === "character-performance") {
        return "Earliest curated " + entityLabel + " performance candidate in the current bounded set: " +
          location + ". This describes the bounded archive, not an all-time origin.";
      }
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
      return "The strongest target-proximate negative-language receipt for " + entityLabel + " is " + location +
        ". It supports this moment only; it is not being promoted into a settled host opinion" +
        (intent.opinionComparison ? " or authenticated “most hated” verdict." : ".");
    }
    if (intent.name === "positive") {
      return "The strongest target-proximate positive-language receipt for " + entityLabel + " is " + location +
        ". It supports this moment only; it is not being promoted into a settled host opinion" +
        (intent.opinionComparison ? " or authenticated “best” verdict." : ".");
    }
    if (entity && entity.type === "character") {
      if (top.kind === "character-performance") {
        return "Strongest curated " + entityLabel + " performance receipt: " + location +
          ", grounded by the timestamp-validated Lore set. The clip remains speaker-undiarized.";
      }
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

  function combineLiveData(live, popular, archiveDeep) {
    archiveDeep = archiveDeep || { streams: [], topicIndex: [], characterIndex: [] };
    var streams = (live.streams || []).map(function (stream) {
      return Object.assign({}, stream, { _lane: "fresh" });
    }).concat((popular.streams || []).map(function (stream) {
      return Object.assign({}, stream, { _lane: "popular" });
    })).concat((archiveDeep.streams || []).map(function (stream) {
      return Object.assign({}, stream, { _lane: "archive" });
    }));
    var groupedTopics = {};
    (live.topicIndex || []).concat(popular.topicIndex || [], archiveDeep.topicIndex || [])
      .forEach(function (topic) {
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
    (live.characterIndex || []).concat(
      popular.characterIndex || [],
      archiveDeep.characterIndex || []
    ).forEach(function (character) {
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

  function anchorMode(intent) {
    var q = intent.normalized;
    if (includesAny(q, [
      "what happened before", "what happens before", "what came before",
      "what was before", "what is before", "before that", "before this",
      "previous highlight", "previous one", "one before",
    ])) return "previous";
    if (includesAny(q, [
      "what happened next", "what happens next", "what came next",
      "what was next", "and then what", "what happened after",
      "what happens after", "what came after", "what was after",
      "what is after", "next after",
    ])) return "next";
    if (includesAny(q, [
      "same one", "same result", "show me that again", "show that again",
      "play it again", "play that again", "replay it", "replay that",
      "play it", "play that",
      "who said that", "who said it", "who said this",
      "was that mike", "was this mike", "was it mike",
      "was that j", "was this j", "was it j",
      "did mike say that", "did j say that",
    ])) return "exact";
    if (includesAny(q, [
      "more like that", "another like that", "another one like that",
      "something else like that", "give me another one", "show me another one",
      "give me another", "show another", "another one",
    ])) return "similar";
    if (includesAny(q, [
      "in that one", "in this one", "in it", "from that one", "from this one",
      "from it", "about it", "about that one", "about this one",
      "happens there", "happened there", "at that point",
    ])) return "source";
    return null;
  }

  function anchorRecord(candidate, fallbackSource) {
    if (!candidate || !candidate.sourceId) return null;
    return {
      key: candidate.key || "",
      source: candidate.source || fallbackSource || "all",
      sourceId: candidate.sourceId,
      sourceTitle: candidate.sourceTitle || candidate.title || "",
      title: candidate.title || candidate.sourceTitle || "",
      date: candidate.date || "",
      at: Number(candidate.at || 0),
      kind: candidate.kind || "",
      category: candidate.category || "",
      evidenceType: candidate.evidenceType || "",
      lane: candidate.lane || null,
    };
  }

  function resolveNamedResultAnchor(candidates, intent, entity) {
    var mode = anchorMode(intent);
    if (!entity || ["next", "previous"].indexOf(mode) < 0) return null;
    var matches = candidates.filter(function (candidate) {
      if (intent.source !== "all" && candidate.source !== intent.source) return false;
      if (intent.archiveRequested && candidate.lane !== "archive") return false;
      if (!intent.archiveRequested && candidate.lane === "archive") return false;
      return entityMatches(candidate, entity);
    }).filter(isTimedReceipt);
    if (matches.length !== 1) return null;
    return anchorRecord(matches[0], matches[0].source);
  }

  function resultAnchor(previous) {
    if (!previous) return null;
    var candidate = previous.resultAnchor ||
      (previous.context && previous.context.resultAnchor) ||
      (previous.results && previous.results[0]) ||
      previous.topResult;
    return anchorRecord(candidate, previous.source);
  }

  function anchorWantsMoment(intent, mode) {
    if (mode === "next" || mode === "previous" || mode === "similar" ||
      intent.name === "comedy") return true;
    return mode === "source" && includesAny(intent.normalized, [
      "what did they say", "what was said", "what happened", "what happens",
      "what was funniest", "what is funniest", "funniest", "funny",
    ]);
  }

  function isFollowup(intent) {
    var q = intent.normalized;
    if (anchorMode(intent)) return true;
    if (beginsWithAny(q, ["what about", "how about", "where about"])) {
      return includesAny(" " + q + " ", [
        " it ", " that ", " this ", " them ", " those ", " one ", " ones ",
        " another ", " more ", " same ", " instead ",
      ]);
    }
    if (beginsWithAny(q, ["and"])) {
      return beginsWithAny(q, [
        "and if", "and then", "and what about", "and how about", "and another",
        "and more", "and the", "and in", "and on", "and from", "and commentary",
        "and commentaries", "and livestream", "and livestreams", "and instead",
      ]);
    }
    return beginsWithAny(q, ["another"]) ||
      includesAny(q, ["did that", "was that", "show another", "more like", "same one", "those ones"]) ||
      (intent.words.length <= 4 && includesAny(" " + q + " ", [
        " it ", " this ", " them ", " that ", " those ", " one ", " ones ",
        " more ", " instead ",
      ]));
  }

  function contextualEntity(previous, aliases, intent, preferredSource) {
    if (!previous || !previous.entity) return null;
    return entityFromLabel(previous.entity, aliases, intent, preferredSource);
  }

  function applyContext(intent, previous, aliases) {
    if (!previous || !isFollowup(intent)) {
      return {
        intent: intent,
        entity: null,
        resultAnchor: null,
        anchorMode: null,
        continuedFrom: false,
        contextUsed: [],
      };
    }
    var inherited = Object.assign({}, intent);
    var contextUsed = [];
    var mode = anchorMode(intent);
    var anchor = mode ? resultAnchor(previous) : null;
    var previousIntent = parseIntent(previous.query || "");
    var preferredSource = inherited.source !== "all" ? inherited.source : previous.source;
    var entity = contextualEntity(previous, aliases, inherited, preferredSource);
    if (entity) contextUsed.push("entity");
    if (!inherited.sourceExplicit && previous.source && previous.source !== "all") {
      inherited.source = previous.source;
      contextUsed.push("source");
    }
    if (!anchor && !inherited.temporalExplicit && !inherited.popularityExplicit &&
      !inherited.metricExplicit && previousIntent.temporal !== "all") {
      inherited.temporal = previousIntent.temporal;
      inherited.metric = previousIntent.metric;
      inherited.direction = previousIntent.direction;
      contextUsed.push("temporal");
    }
    if (inherited.name === "discovery" && previous.intent && previous.intent !== "discovery") {
      inherited.name = previous.intent;
      contextUsed.push("intent");
    }
    if (anchor) contextUsed.push("result");
    return {
      intent: inherited,
      entity: entity,
      resultAnchor: anchor,
      anchorMode: anchor ? mode : null,
      continuedFrom: contextUsed.length > 0,
      contextUsed: unique(contextUsed),
    };
  }

  function evidenceWarnings(candidate) {
    var warnings = ["Speaker identity is not inferred from auto-captions."];
    if (candidate.reviewStatus === "machine-candidate") {
      warnings.push("Archive Deep marks this as a machine-candidate pending human review; it is not curated or Canon evidence.");
    }
    if (candidate.originStatus === "not-inferred") {
      warnings.push("No quote, bit, character, or performance origin is inferred from this receipt.");
    }
    if (candidate.restrictedToTopicNavigation) {
      warnings.push("This source is restricted to topic navigation; excerpts, moments, character signals, and heat claims are withheld.");
    }
    if (candidate.rightsMode === "visual-context-unverified") {
      warnings.push("The source's visual-ranking outcome is unverified; this result supports only the indexed caption route, not which kill or death won.");
    }
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
        warnings.push("This is an ordinary reference, not a timestamped curated performance candidate.");
      }
    }
    if (candidate.kind === "character-performance") {
      warnings.push("Human curation marks a performance candidate at this timestamp; it is not an authenticated editor-verification decision or proof of the voice in the clip.");
      warnings.push("Recurring-character owner mapping is response-level context and is not clip-speaker attribution.");
    }
    return warnings;
  }

  function enrichResult(candidate) {
    var evidenceLevel = candidate.reviewStatus === "machine-candidate" ?
      (candidate.restrictedToTopicNavigation ?
        "MACHINE-CANDIDATE TOPIC NAVIGATION" :
        "TIMESTAMPED MACHINE-CANDIDATE RECEIPT") :
      candidate.evidenceType === "curated-character-performance" ?
      "TIMESTAMPED CURATED PERFORMANCE RECEIPT" :
      candidate.evidenceType === "caption-excerpt" ||
      candidate.evidenceType === "caption-topic-receipt" ||
      candidate.evidenceType === "caption-character-signal" ? "TIMESTAMPED CAPTION RECEIPT" :
      candidate.captioned ? "SOURCE-LEVEL DERIVED SUMMARY" : "SOURCE METADATA ONLY";
    return Object.assign({}, candidate, {
      label: resultLabel(candidate),
      laneLabel: candidate.lane === "archive" ? "ARCHIVE DEEP · MACHINE CANDIDATE" :
        candidate.lane === "popular" ? "POPULAR 25" :
          candidate.lane === "fresh" ? "FRESH FROM LIVE" : "",
      speaker: null,
      speakerStatus: "not-diarized",
      originStatus: candidate.originStatus || "not-inferred",
      originInferred: false,
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
        opinionEvidence: candidate.opinionEvidence || null,
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
      var curatedPerformanceOrigin = characterOrigin && origins[0] &&
        origins[0].kind === "character-performance";
      var originChain = [{
        role: curatedPerformanceOrigin ? "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET" :
          characterOrigin ? "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL" : "EARLIEST INDEXED RECEIPT",
        result: origins[0],
      }];
      if (origins[1]) originChain.push({
        role: curatedPerformanceOrigin ? "LATER CURATED PERFORMANCE RECEIPT IN CURRENT SET" :
          characterOrigin ? "LATER MACHINE-INDEXED CHARACTER SIGNAL" : "LATER INDEXED RECEIPT",
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
    if (top.evidenceType === "curated-character-performance") confidence += 6;
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
      if (!preserveExactReceipts && candidate.kind === "character-performance") key += "|" + Number(candidate.at || 0);
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
        reason: "This surface has the bounded lineage and timestamped human-curated character-performance candidates.",
      };
    }
    return null;
  }

  function characterProfileForEntity(characterLore, entity) {
    if (!entity || entity.type !== "character") return null;
    return ((characterLore && characterLore.characters) || []).filter(function (profile) {
      return normalize(profile.name) === normalize(entity.character || entity.label);
    })[0] || null;
  }

  function sourceCollectionUnit(intent) {
    if (intent.source === "commentary") return "commentaries";
    if (intent.source === "livestream") return "livestreams";
    return "sources";
  }

  function dedupeSourceRanked(ranked) {
    var seen = {};
    return ranked.filter(function (candidate) {
      var key = candidate.source + "|" + candidate.sourceId;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function create(catalog, deep, live, curated, popular, characterLore, archiveDeep) {
    catalog = catalog || [];
    deep = deep || { tapes: [] };
    live = live || { streams: [], topicIndex: [] };
    popular = popular || { streams: [], topicIndex: [], characterIndex: [] };
    curated = curated || { upInYa: [] };
    characterLore = characterLore || { characters: [] };
    archiveDeep = archiveDeep || { streams: [], topicIndex: [], characterIndex: [] };

    var combinedLive = combineLiveData(live, popular, archiveDeep);
    var promotedSourceById = new Map(
      catalog
        .concat(live.streams || [], popular.streams || [])
        .filter(function (source) {
          return source && source.id;
        })
        .map(function (source) {
          return [source.id, source];
        })
    );
    var candidates = commentaryCandidates(catalog, deep)
      .concat(liveCandidates(combinedLive))
      .concat(characterPerformanceCandidates(characterLore, promotedSourceById));
    var performanceByCharacter = {};
    candidates.forEach(function (candidate) {
      if (candidate.kind !== "character-performance") return;
      var key = normalize(candidate.character);
      if (!performanceByCharacter[key]) performanceByCharacter[key] = [];
      performanceByCharacter[key].push(candidate);
    });
    var sourceIndex = indexedSourceRecords(candidates);
    var latestIndexedDate = sourceIndex.reduce(function (latest, record) {
      return record.date > latest ? record.date : latest;
    }, "");
    var aliases = aliasDefinitions(catalog, combinedLive, curated, characterLore);
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
      var parsedIntent = parseIntent(query);
      var queryPlan = compileQueryPlan(query, parsedIntent);
      if (queryPlan.relativeExplicitLane) {
        queryPlan.controls.relativeDate = latestIndexedDate || null;
      }
      var originalIntent = applyQueryPlan(parsedIntent, queryPlan);
      if (queryPlan.surfaceHandoff) {
        return {
          query: query,
          intent: "surface-handoff",
          questionType: "global memorability superlative",
          source: "all",
          temporal: originalIntent.temporal,
          popularity: originalIntent.popularity,
          metric: "memorability-candidate-index-v2.1",
          requestedYear: originalIntent.requestedYear,
          entity: null,
          entityType: null,
          ownerMapping: null,
          continuedFrom: false,
          contextUsed: [],
          resultAnchor: null,
          context: {
            query: query,
            intent: "surface-handoff",
            source: "all",
            temporal: originalIntent.temporal,
            popularity: originalIntent.popularity,
            metric: "memorability-candidate-index-v2.1",
            entity: null,
            entityType: null,
            resultAnchor: null,
          },
          queryPlan: queryPlan,
          surfaceHandoff: queryPlan.surfaceHandoff,
          selectionPlan: { surfaceHandoff: queryPlan.surfaceHandoff },
          confidence: 100,
          confidenceBasis: [
            "Query Plan identified a global memorability superlative",
            "Unranked retrieval refused to manufacture its own winner",
          ],
          status: "surface-handoff",
          answer: "This asks for a global chaos winner. Ask WWAM will not invent a separate #1; open the published Memorability Candidate Index V2.1 for the deterministic ranked answer.",
          limitations: [
            "No receipt is returned here because the separate ranking engine owns global candidate order.",
            "The Memorability Candidate Index is machine-ranked, not a creator vote or objective comedy verdict.",
          ],
          explanation: {
            method: "query-plan surface handoff",
            subjectTerms: [],
            topScore: 0,
            resultCountBeforeDisplayLimit: 0,
            safeguards: [
              "no competing unranked global winner",
              "no speaker guessing",
              "no unsupported creator-vote claim",
            ],
          },
          evidenceChain: [],
          results: [],
          suggestions: ["Show me the top 5 most memorable moments"],
          recommendedSurface: queryPlan.surfaceHandoff,
        };
      }
      var directEntity = identifyEntity(queryPlan.canonicalQuery, aliases, originalIntent);
      if (directEntity && directEntity.type === "film" &&
        ["source-count", "source-list"].indexOf(queryPlan.outputShape) >= 0 &&
        queryPlan.controls.yearFilter) {
        var withoutCollectionYear = queryPlan.canonicalQuery.replace(
          new RegExp("\\b" + originalIntent.requestedYear + "\\b", "g"),
          " "
        );
        var collectionEntity = identifyEntity(withoutCollectionYear, aliases, originalIntent);
        if (collectionEntity && collectionEntity.type === "franchise") {
          directEntity = collectionEntity;
        }
      }
      var context = applyContext(originalIntent, previous, aliases);
      var intent = context.intent;
      var entity = directEntity || context.entity;
      if (queryPlan.outputShape === "character-profile" &&
        (!entity || entity.type !== "character")) {
        queryPlan.outputShape = "single";
      }
      if (queryPlan.outputShape === "character-soundbyte-count" &&
        (!entity || entity.type !== "character")) {
        queryPlan.outputShape = "count";
      }
      if (queryPlan.outputShape === "character-mention-count" &&
        (!entity || entity.type !== "character")) {
        queryPlan.outputShape = "count";
      }
      if (queryPlan.outputShape === "count" && entity && entity.type === "character") {
        queryPlan.outputShape = queryPlan.characterMentionCountLanguage ?
          "character-mention-count" : "character-soundbyte-count";
      }
      var characterProfile = characterProfileForEntity(characterLore, entity);
      intent = Object.assign({}, intent, {
        queryPlan: queryPlan,
        yearFilter: queryPlan.controls.yearFilter,
        characterProfile: characterProfile,
        refusesSpeakerGuess: queryPlan.outputShape === "character-roster" ?
          false : intent.refusesSpeakerGuess,
      });
      var anchor = context.resultAnchor;
      var activeAnchorMode = context.anchorMode;
      var contextUsed = !directEntity || Boolean(anchor && activeAnchorMode) ?
        context.contextUsed : [];
      var namedResultAnchor = false;
      var requestedAnchorMode = anchorMode(intent);
      if (!anchor && directEntity &&
        ["next", "previous"].indexOf(requestedAnchorMode) >= 0) {
        anchor = resolveNamedResultAnchor(candidates, intent, directEntity);
        if (anchor) {
          activeAnchorMode = requestedAnchorMode;
          namedResultAnchor = true;
          contextUsed = unique(contextUsed.concat(["named-result"]));
        }
      }
      var anchorActive = Boolean(anchor && activeAnchorMode);
      var continuedFrom = context.continuedFrom && (!directEntity || anchorActive);
      var sourceCollectionShape = ["source-count", "source-list", "source-ranking"]
        .indexOf(queryPlan.outputShape) >= 0;
      var titleSelection = anchorActive || sourceCollectionShape ||
        queryPlan.outputShape === "curated-soundbytes" ||
        queryPlan.outputShape === "character-roster" ||
        queryPlan.outputShape === "character-profile" ||
        queryPlan.outputShape === "character-soundbyte-count" ||
        queryPlan.outputShape === "character-mention-count" ? null :
        selectIndexedSource(sourceIndex, intent, directEntity);
      var titleBoundary = titleSelection && titleSelection.blocked ?
        titleSelection : null;
      if (titleBoundary) entity = null;
      if (entity && entity.type === "character" && entity.matchedAlias &&
        intent.name === "negative") {
        var residualQuery = (" " + intent.normalized + " ").replace(
          " " + normalize(entity.matchedAlias) + " ",
          " "
        );
        if (!includesAny(residualQuery, [
          " hate", " hated", " worst", " bad", " sucks", " trash", " garbage",
          " criticize", " dislike", " despise", " loathe", " didnt like",
          " did not like", " couldnt stand",
        ])) {
          intent = Object.assign({}, intent, { name: "discovery" });
        }
      }
      var ownerMapping = null;
      if (intent.mappingRequest && entity && entity.type === "character" &&
        entity.performedBy && entity.hostAttribution) {
        ownerMapping = {
          character: entity.label,
          performer: entity.performedBy,
          status: entity.hostAttribution.status || "owner-supplied",
          confidence: Number(entity.hostAttribution.confidence || 0),
          basis: entity.hostAttribution.basis || "Project-owner recurring-character mapping.",
          scope: "recurring-character-only",
          clipSpeakerVerified: false,
        };
      } else if (intent.mappingRequest) {
        intent = Object.assign({}, intent, { refusesSpeakerGuess: true });
      }
      intent = Object.assign({}, intent, {
        characterPerformanceArchiveAvailable: Boolean((characterLore.characters || []).length),
        resultAnchor: anchorActive ? anchor : null,
        anchorMode: anchorActive ? activeAnchorMode : null,
        titleBoundary: titleBoundary,
      });
      var terms = expandedTerms(intent);
      var subjectTerms = entity || anchorActive ||
        ["character-roster", "curated-soundbytes"].indexOf(queryPlan.outputShape) >= 0 ?
        [] : querySubjectTerms(intent);
      queryPlan.subjectTerms = subjectTerms.slice();
      var topicOverviewSource = titleSelection || anchorActive ? null :
        selectTopicOverviewSource(sourceIndex, intent);
      var selectedSource = titleSelection && !titleSelection.blocked ?
        titleSelection :
        topicOverviewSource || selectCompoundSource(candidates, intent, entity, subjectTerms);
      if (selectedSource) {
        intent = Object.assign({}, intent, {
          selectedSource: selectedSource,
          source: selectedSource.source,
          archiveRequested: intent.archiveRequested || selectedSource.lane === "archive",
          visualContextRefusal: Boolean(
            intent.visualResultRequest &&
            /(?:visual-context|audio-boundary)-unverified/.test(
              selectedSource.rightsMode || ""
            ) &&
            selectedSource.visualContextVerified !== true
          ),
        });
      }
      var sourceEntity = null;
      if (selectedSource && (
        intent.questionType === "where" || intent.name === "topic" ||
        intent.metric === "mentions" || intent.characterSignalRequested
      )) {
        var entityKinds = intent.characterSignalRequested ?
          ["character"] : ["topic"];
        var sourceEntityMatch = intent.normalized.match(
          /\bwhere (?:is|are|did) (.+?)(?: mentions?)? in \b/
        ) || (intent.characterSignalRequested && intent.normalized.match(
          /\b(?:archive deep )?(.+?) signals? in \b/
        ));
        var sourceEntityNeedle = sourceEntityMatch ?
          normalize(sourceEntityMatch[1]) : "";
        var sourceEntityCandidate = candidates.filter(function (candidate) {
          return candidate.sourceId === selectedSource.sourceId &&
            entityKinds.indexOf(candidate.kind) >= 0 &&
            (!sourceEntityNeedle ||
              normalize(candidate.title) === sourceEntityNeedle ||
              containsNormalizedPhrase(sourceEntityNeedle, normalize(candidate.title))) &&
            containsNormalizedPhrase(intent.normalized, normalize(candidate.title));
        }).sort(function (left, right) {
          var leftExact = normalize(left.title) === sourceEntityNeedle;
          var rightExact = normalize(right.title) === sourceEntityNeedle;
          if (leftExact !== rightExact) return Number(rightExact) - Number(leftExact);
          return normalize(right.title).length - normalize(left.title).length;
        })[0];
        if (sourceEntityCandidate) {
          sourceEntity = sourceEntityCandidate.kind === "character" ? {
            type: "character",
            character: sourceEntityCandidate.character,
            label: sourceEntityCandidate.character,
          } : {
            type: "topic",
            topic: sourceEntityCandidate.title,
            label: sourceEntityCandidate.title,
          };
          entity = sourceEntity;
        }
      }
      var orphanSpeakerFollowup = intent.refusesSpeakerGuess &&
        !anchorActive && !entity && !subjectTerms.length;
      var rankingEntity = sourceEntity || (selectedSource && entity &&
        ["topic", "discovery"].indexOf(intent.name) >= 0 ? entity :
        selectedSource || anchorActive ? null : entity);

      var ranked = [];
      if (queryPlan.outputShape === "character-roster") {
        ranked = (characterLore.characters || []).map(function (profile) {
          var profileCandidates = performanceByCharacter[normalize(profile.name)] || [];
          var minimum = Math.max(
            1,
            Math.floor(Number(profile.minimumCuratedCandidatesForAsk || 3))
          );
          var profileCandidate = profileCandidates[0];
          if (!profileCandidate || profileCandidates.length < minimum) return null;
          var profileEntity = entityFromLabel(profile.name, aliases, intent, profileCandidate.source);
          return Object.assign(
            {},
            profileCandidate,
            scoreCandidate(profileCandidate, intent, profileEntity, terms, []),
            {
              rosterProfile: {
                id: profile.id,
                name: profile.name,
                displayName: profile.displayName,
                performedBy: profile.performedBy,
                hostAttribution: profile.hostAttribution,
                profile: profile.profile,
                curatedPerformanceCandidates: profileCandidates.length,
                curatedSources: new Set(profileCandidates.map(function (candidate) {
                  return candidate.sourceId;
                })).size,
                minimumCuratedCandidates: minimum,
                authenticatedEditorVerified: 0,
              },
            }
          );
        }).filter(Boolean);
      } else if (!intent.visualContextRefusal && !titleBoundary &&
        !orphanSpeakerFollowup && normalize(query) &&
        (!intent.sourceSelector || selectedSource)) {
        var scoped = candidates.filter(function (candidate) {
          if (selectedSource && candidate.sourceId !== selectedSource.sourceId) return false;
          return candidateInScope(candidate, intent, rankingEntity, subjectTerms);
        });
        scoped = anchorScopedCandidates(scoped, intent, anchor, activeAnchorMode);
        ranked = scoped.map(function (candidate) {
          return Object.assign({}, candidate, scoreCandidate(
            candidate,
            intent,
            rankingEntity,
            terms,
            subjectTerms
          ));
        }).filter(function (candidate) {
          if (rankingEntity) return entityMatches(candidate, rankingEntity);
          if (subjectTerms.length) {
            var requiredMatches = subjectTerms.length === 1 ? 1 : Math.ceil(subjectTerms.length * 0.67);
            return candidate.matchedSubjectTerms.length >= requiredMatches;
          }
          return anchorActive || Boolean(selectedSource) || candidate.score > 0;
        }).sort(function (a, b) {
          if (activeAnchorMode === "next") {
            var nextDifference = Number(a.at || 0) - Number(b.at || 0);
            if (nextDifference) return nextDifference;
          }
          if (activeAnchorMode === "previous") {
            var previousDifference = Number(b.at || 0) - Number(a.at || 0);
            if (previousDifference) return previousDifference;
          }
          if (intent.topicOverviewRequest) {
            var topicTimeDifference = Number(a.at || 0) - Number(b.at || 0);
            if (topicTimeDifference) return topicTimeDifference;
          }
          return compareCandidates(a, b, intent, rankingEntity);
        });
      }

      if (sourceCollectionShape) ranked = dedupeSourceRanked(ranked);
      var fullRanked = ranked.slice();
      var collection = null;
      if (["source-count", "source-list", "source-ranking"].indexOf(queryPlan.outputShape) >= 0) {
        collection = {
          shape: queryPlan.outputShape,
          total: fullRanked.length,
          unit: sourceCollectionUnit(intent),
          countBasis: "unique indexed source records after source, entity, lane, and year filters",
        };
      } else if (queryPlan.outputShape === "curated-soundbytes") {
        collection = {
          shape: queryPlan.outputShape,
          total: fullRanked.length,
          unit: "curated soundbytes",
          countBasis: "WWAM UP IN YA curated receipt order",
        };
      } else if (queryPlan.outputShape === "character-roster") {
        collection = {
          shape: queryPlan.outputShape,
          total: fullRanked.length,
          unit: "grounded recurring characters",
          countBasis: "grounded Character Lore profiles with playable curated receipts",
        };
      } else if (queryPlan.outputShape === "character-soundbyte-count" && characterProfile) {
        var validatedCharacterCandidates =
          performanceByCharacter[normalize(characterProfile.name)] || [];
        collection = {
          shape: queryPlan.outputShape,
          total: validatedCharacterCandidates.length,
          unit: "curated performance candidates",
          countBasis: "timestamped human-curated performance candidates; not authenticated editor verification, mentions, or unique sources",
          authenticatedEditorVerified: 0,
        };
      } else if (queryPlan.outputShape === "character-mention-count" && characterProfile) {
        collection = {
          shape: queryPlan.outputShape,
          total: Number(characterProfile.metrics && characterProfile.metrics.archiveMentions || 0),
          unit: "caption mention matches",
          countBasis: "broad caption mentions; ordinary references and performances are not conflated",
          sourceTotal: Number(characterProfile.metrics && characterProfile.metrics.sourcesWithMentions || 0),
        };
      }
      intent = Object.assign({}, intent, { collection: collection });
      var rawChain = evidenceChain(intent, rankingEntity, fullRanked);
      var chain = rawChain.map(function (entry) {
        return { role: entry.role, result: enrichResult(entry.result) };
      });
      var evidenceFirst = intent.name === "trajectory" || intent.name === "opinion";
      var displayRanked = evidenceFirst ?
        rawChain.map(function (entry) { return entry.result; }).concat(ranked.filter(function (candidate) {
          return !rawChain.some(function (entry) { return entry.result.key === candidate.key; });
        })) : ranked;
      var displayLimit = Number(queryPlan.controls.requestedLimit || 0) ||
        (queryPlan.outputShape === "source-list" ? 25 :
          queryPlan.outputShape === "character-roster" ? 4 : 7);
      var preserveDisplayedReceipts = evidenceFirst ||
        queryPlan.outputShape === "curated-soundbytes" ||
        queryPlan.outputShape === "character-roster" ||
        queryPlan.outputShape === "character-soundbyte-count";
      var results = dedupeCandidates(displayRanked, preserveDisplayedReceipts)
        .slice(0, displayLimit).map(enrichResult);
      if (collection) collection.displayed = results.length;
      if (intent.originRequest && entity && entity.type === "character" && results[0]) {
        if (results[0].kind === "character-performance") {
          results[0].label = "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET";
          results[0].archiveBoundary = {
            index: "Lore timestamp-validated curated performance receipts",
            differsFrom: "an exhaustive all-time origin claim",
            trueOriginClaim: false,
          };
        } else {
          results[0].label = "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL";
          results[0].archiveBoundary = {
            index: "broad machine-indexed caption signals",
            differsFrom: "Lore timestamped human-curated performance candidates in the current bounded set",
            trueOriginClaim: false,
          };
        }
      }
      var confidence = intent.visualContextRefusal ? 100 :
        ownerMapping ? Math.round(ownerMapping.confidence * 100) :
        confidenceFor(intent, rankingEntity, results);
      var status = intent.visualContextRefusal ? "visual-context-unverified" :
        ownerMapping ? "owner-mapped-character" :
        selectedSource && selectedSource.restrictedToTopicNavigation && !results.length ?
          "topic-only-boundary" :
        intent.refusesSpeakerGuess ? "speaker-unknown" :
        intent.name === "trajectory" || intent.name === "opinion" ? "archive-boundary" :
        !results.length ? "insufficient-evidence" : "supported";
      var answer = buildAnswer(intent, entity, results, combinedLive, chain, subjectTerms);
      if (ownerMapping) {
        answer = "Project-owner recurring-character mapping: " + ownerMapping.character +
          " is performed by " + ownerMapping.performer +
          ". This identifies the recurring character owner only; it does not verify who is speaking in any individual clip, so every result remains non-diarized.";
      }
      var nextResultAnchor = anchorRecord(results[0], intent.source);
      queryPlan.controls.navigation = activeAnchorMode || null;
      var conversationContext = {
        query: query,
        intent: intent.name,
        source: intent.source,
        temporal: intent.temporal,
        popularity: intent.popularity,
        metric: intent.metric,
        entity: entity ? entity.label : null,
        entityType: entity ? entity.type : null,
        resultAnchor: nextResultAnchor,
      };
      var selectionPlan = selectedSource ? {
        source: {
          metric: selectedSource.metric,
          direction: selectedSource.direction,
          sourceId: selectedSource.sourceId,
          sourceTitle: selectedSource.sourceTitle,
          views: selectedSource.views,
          lane: selectedSource.lane || null,
          matchMode: selectedSource.titleMatchMode || null,
          matchedTerms: selectedSource.matchedTerms || null,
          alternativeCount: Number(selectedSource.alternativeCount || 0),
          tieBreak: selectedSource.tieBreak || null,
          rightsMode: selectedSource.rightsMode || null,
          visualContextVerified: selectedSource.visualContextVerified === true,
          archiveBatchId: selectedSource.archiveBatchId || null,
          archiveBatchSequence: selectedSource.archiveBatchSequence || null,
          archiveBatchRank: selectedSource.archiveBatchRank || null,
          archivePortfolioRank: selectedSource.archivePortfolioRank || null,
        },
        withinSource: {
          intent: intent.name,
          metric: intent.metric,
        },
      } : titleBoundary ? {
        sourceTitleBoundary: {
          reason: titleBoundary.reason,
          queryTerms: titleBoundary.queryTerms,
          matches: titleBoundary.matches,
        },
      } : anchorActive ? {
        anchor: anchor,
        mode: activeAnchorMode,
        resolvedFrom: namedResultAnchor ? "named-result" : "conversation-context",
      } : collection ? {
        collection: {
          shape: collection.shape,
          total: collection.total,
          unit: collection.unit,
          countBasis: collection.countBasis,
          requestedLimit: queryPlan.controls.requestedLimit,
          year: queryPlan.controls.yearFilter ? queryPlan.controls.requestedYear : null,
          source: intent.source,
          metric: intent.metric,
          direction: intent.direction,
        },
      } : null;

      return {
        query: query,
        intent: intent.name,
        questionType: intent.questionType,
        source: intent.source,
        temporal: intent.temporal,
        popularity: intent.popularity,
        metric: intent.metric,
        requestedYear: intent.requestedYear,
        entity: entity ? entity.label : null,
        entityType: entity ? entity.type : null,
        ownerMapping: ownerMapping,
        continuedFrom: continuedFrom,
        contextUsed: contextUsed,
        resultAnchor: nextResultAnchor,
        context: conversationContext,
        queryPlan: queryPlan,
        collection: collection,
        selectionPlan: selectionPlan,
        confidence: confidence,
        confidenceBasis: intent.visualContextRefusal ? [
          "exact indexed source-title match",
          "source policy marks visual context unverified",
          "caption routes cannot establish an on-screen ranking result",
        ] : ownerMapping ? [
          "project-owner supplied recurring-character mapping",
          "mapping applies to the recurring character, not any individual clip",
          "result speakers remain not diarized",
        ] : results.length ? (intent.name === "trajectory" ? [
          "receipt retrieval confidence; change claim not established",
          entity ? "recognized archive entity" : "archive text match",
          results[0].evidenceLevel.toLowerCase(),
        ] : intent.name === "opinion" ? [
          "receipt retrieval confidence; settled opinion not established",
          entity ? "recognized archive entity" : "archive text match",
          results[0].evidenceLevel.toLowerCase(),
        ] : intent.name === "negative" || intent.name === "positive" ? [
          "target-proximate evaluative receipt",
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
        ]).concat(intent.visualContextRefusal ? [
          "Visual-ranking results require watching the original source; captions alone cannot establish which kill or death won.",
          "Caption topic and comedy candidates remain searchable because they make no visual-result claim.",
        ] : []).concat(ownerMapping ? [
          "Owner mapping does not establish the speaker at a specific timestamp.",
        ] : []).concat(intent.originRequest ? [
          "Earliest indexed receipt is not a claim of true origin.",
        ] : []).concat(intent.name === "trajectory" ? [
          entity && entity.type === "franchise" ?
            "Franchise-wide evaluative receipts may concern different films, scenes, or targets; they cannot prove a host changed their mind." :
            "Evaluative receipts can show an archive timeline but cannot prove a host changed their mind.",
        ] : intent.name === "opinion" ? [
          entity && entity.type === "franchise" ?
            "Franchise-wide evaluative receipts may concern different films, scenes, or targets; they do not establish one settled host opinion." :
            "An evaluative receipt supports a specific moment, not one settled host opinion.",
        ] : []).concat(intent.name === "negative" || intent.name === "positive" ? [
          "Evaluative language must occur within eight caption words of a film, scene, craft, character, or other screen target.",
          intent.opinionComparison ?
            "Comparative wording ranks the current relevant receipts; it does not authenticate a host's overall favorite or most-hated title." :
            "One relevant receipt does not establish a host's overall opinion.",
        ] : []).concat(anchorActive && activeAnchorMode === "next" ? [
          "“Next” means the next indexed highlight in this source, not the literal next caption line.",
        ] : []).concat(anchorActive && activeAnchorMode === "previous" ? [
          "“Previous” means the previous indexed highlight in this source, not the literal previous caption line.",
        ] : []).concat(anchorActive && activeAnchorMode === "similar" ? [
          "Similarity uses indexed source and category signals; it is not an identity or quality claim.",
        ] : [])),
        explanation: {
          method: selectedSource ?
            "source selector, within-source moment selector, caption evidence, editorial signals" :
            anchorActive ?
              (namedResultAnchor ? "named-result anchor" : "prior-result anchor") +
                ", within-source retrieval, caption evidence, editorial signals" :
              "entity scope, source scope, direct selector, caption evidence, editorial signals",
          subjectTerms: subjectTerms,
          queryPlan: queryPlan,
          topScore: results[0] ? results[0].score : 0,
          resultCountBeforeDisplayLimit: fullRanked.length,
          safeguards: [
            "no speaker guessing",
            "recurring-character ownership kept separate from clip attribution",
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
    canonicalizeQuery: canonicalizeQuery,
    parseIntent: parseIntent,
    compileQueryPlan: function (query) {
      var parsed = parseIntent(query);
      return compileQueryPlan(query, parsed);
    },
  };
})(window);
