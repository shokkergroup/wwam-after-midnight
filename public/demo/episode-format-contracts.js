(function (root) {
  "use strict";

  var VERSION = "1.2.0";
  var CLASSIFICATION_SCHEMA =
    "shokker-lore/episode-format-classification/v1";
  var DRIFT_SCHEMA = "shokker-lore/episode-format-drift-report/v1";
  var RIGHTS_BOOLEAN_FIELDS = [
    "speakerClaimsAllowed",
    "performerClaimsAllowed",
    "originClaimsAllowed",
    "visualClaimsAllowed",
    "visualResultClaimsAllowed",
    "promotionAllowed",
  ];

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function normalized(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function unique(values) {
    var seen = new Set();
    return array(values).filter(function (value) {
      var key = clean(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function countBy(values, read) {
    return array(values).reduce(function (counts, value) {
      var key = clean(read(value)) || "unknown";
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
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

  function fact(field, type, evidence, note) {
    return {
      field: field,
      type: type,
      evidence: evidence,
      note: note || "",
    };
  }

  var COMMON_FACTS = [
    fact("sourceId", "non-empty-string", "canonical-source-metadata"),
    fact("title", "non-empty-string", "canonical-source-metadata"),
    fact("durationSeconds", "non-negative-number", "canonical-source-metadata"),
    fact(
      "playbackUrl",
      "absolute-url",
      "canonical-source-metadata",
      "Required before a public play or jump control is shown."
    ),
  ];

  var COMMON_PROHIBITIONS = [
    "Do not infer a speaker from undiarized captions.",
    "Do not infer a performer from a character-name match.",
    "Do not infer quote or audio origin from chronological proximity.",
    "Do not turn a machine-surfaced candidate into creator approval.",
    "Do not claim a visual result from captions alone.",
    "Do not treat recurrence as proof of origin, intent, or causality.",
  ];

  function contract(config) {
    return deepFreeze({
      id: config.id,
      runtimeFormat: {
        id: config.runtimeFormat,
        label: config.runtimeLabel,
        family: config.family || config.runtimeFormat,
      },
      defaultSubtype: config.defaultSubtype,
      allowedPublicClaims: unique([
        "canonical-source identity, title, date, duration, and playback URL",
        "source-declared format language preserved from title metadata",
      ].concat(config.allowedPublicClaims || [])),
      requiredTypedFacts: COMMON_FACTS.concat(config.requiredTypedFacts || []),
      prohibitedInferences: unique(
        COMMON_PROHIBITIONS.concat(config.prohibitedInferences || [])
      ),
      rightsFloor: {
        forceDeny: unique(
          ["promotionAllowed"].concat(config.forceDeny || [])
        ),
        forceTopicNavigation: Boolean(config.forceTopicNavigation),
        maxPublicExcerptWords:
          config.maxPublicExcerptWords == null
            ? 16
            : Math.max(0, Number(config.maxPublicExcerptWords) || 0),
      },
      ui: {
        eyebrow: config.eyebrow,
        badge: config.badge,
        primarySection: config.primarySection,
        navigationNoun: config.navigationNoun,
        playCta: config.playCta || "PLAY EXACT SOURCE",
        evidenceNotice: config.evidenceNotice,
      },
    });
  }

  var CONTRACTS = [
    contract({
      id: "mount-rushmore",
      runtimeFormat: "ranking",
      runtimeLabel: "CURATED PICKS",
      defaultSubtype: "mount-rushmore",
      allowedPublicClaims: [
        "the source-title Mount Rushmore prompt",
        "timestamped, explicitly spoken selections when typed selection facts exist",
      ],
      requiredTypedFacts: [
        fact(
          "prompt",
          "string",
          "source-title-or-reviewed-caption",
          "The category being placed on the Mount Rushmore."
        ),
        fact(
          "selections",
          "array<timestamped-selection>",
          "reviewed-spoken-evidence",
          "Needed before naming a person or title as one of the four picks."
        ),
      ],
      prohibitedInferences: [
        "Do not fill an empty fourth slot from surrounding topic mentions.",
        "Do not convert a nomination into a final Mount Rushmore selection.",
      ],
      eyebrow: "THE FOUR FACES",
      badge: "MOUNT RUSHMORE",
      primarySection: "THE PICKS ON THE TAPE",
      navigationNoun: "SELECTION",
      evidenceNotice: "A PICK NEEDS AN EXPLICIT, TIMESTAMPED SELECTION.",
    }),
    contract({
      id: "q-and-a",
      runtimeFormat: "audience-q-and-a",
      runtimeLabel: "Q + A",
      defaultSubtype: "general-q-and-a",
      allowedPublicClaims: [
        "timestamped question or subject doors",
        "reviewed answer summaries tied to the exact question receipt",
      ],
      requiredTypedFacts: [
        fact("question", "timestamped-text", "source-local-receipt"),
        fact(
          "answer",
          "timestamped-summary",
          "reviewed-source-local-evidence",
          "Needed before the page says the hosts answered a question."
        ),
      ],
      prohibitedInferences: [
        "Do not pair a nearby statement with a question unless the answer link is reviewed.",
        "Do not attribute a question to chat, a host, or a guest without typed identity evidence.",
      ],
      eyebrow: "OPEN PHONE LINE",
      badge: "Q + A",
      primarySection: "QUESTIONS ON THE TAPE",
      navigationNoun: "QUESTION",
      evidenceNotice: "QUESTIONS AND ANSWERS STAY SOURCE-LOCAL.",
    }),
    contract({
      id: "movie-commentary",
      runtimeFormat: "movie-companion",
      runtimeLabel: "MOVIE COMPANION",
      defaultSubtype: "commentary",
      allowedPublicClaims: [
        "the movie named by the official source title",
        "timestamped topic navigation within the commentary upload",
        "reviewed reactions whose source and bounds are explicit",
      ],
      requiredTypedFacts: [
        fact("companionTitle", "string", "canonical-source-title"),
        fact(
          "reaction",
          "timestamped-reviewed-receipt",
          "exact-source-playback",
          "Required before describing a reaction, joke, verdict, or scene response."
        ),
      ],
      prohibitedInferences: [
        "Do not present film dialogue or soundtrack audio as host speech.",
        "Do not name the on-screen scene without a verified sync point.",
        "Do not infer what image was visible from a caption timestamp.",
      ],
      forceDeny: ["originClaimsAllowed", "visualClaimsAllowed"],
      maxPublicExcerptWords: 0,
      eyebrow: "COMMENTARY TRACK",
      badge: "MOVIE COMMENTARY",
      primarySection: "THE COMPANION TIMELINE",
      navigationNoun: "SYNC POINT",
      evidenceNotice: "THE FILM-AUDIO BOUNDARY STAYS CLOSED.",
    }),
    contract({
      id: "movie-watchalong",
      runtimeFormat: "movie-companion",
      runtimeLabel: "MOVIE COMPANION",
      defaultSubtype: "watchalong",
      allowedPublicClaims: [
        "the movie named by the official source title",
        "timestamped watchalong topic and reviewed reaction receipts",
      ],
      requiredTypedFacts: [
        fact("companionTitle", "string", "canonical-source-title"),
        fact("syncPoint", "timestamped-receipt", "reviewed-source-local-evidence"),
      ],
      prohibitedInferences: [
        "Do not assume the source and movie begin at the same second.",
        "Do not present film audio as host speech.",
        "Do not infer a scene description without reviewed visual or sync evidence.",
      ],
      forceDeny: ["originClaimsAllowed", "visualClaimsAllowed"],
      maxPublicExcerptWords: 0,
      eyebrow: "WATCHALONG",
      badge: "MOVIE WATCHALONG",
      primarySection: "WATCH WITH THE TAPE",
      navigationNoun: "SYNC POINT",
      evidenceNotice: "SYNC AND SOURCE-AUDIO ORIGIN REQUIRE REVIEW.",
    }),
    contract({
      id: "movie-watch-party",
      runtimeFormat: "movie-companion",
      runtimeLabel: "MOVIE COMPANION",
      defaultSubtype: "watch-party",
      allowedPublicClaims: [
        "the watch-party title declared by official source metadata",
        "topic navigation and reviewed reactions inside the exact upload",
      ],
      requiredTypedFacts: [
        fact("watchedTitle", "string", "canonical-source-title"),
        fact("watchBounds", "timestamp-range", "reviewed-source-local-evidence"),
      ],
      prohibitedInferences: [
        "Do not claim a film scene, result, or reaction target from captions alone.",
        "Do not present third-party source audio as host speech.",
      ],
      forceDeny: ["originClaimsAllowed", "visualClaimsAllowed"],
      maxPublicExcerptWords: 0,
      eyebrow: "WATCH PARTY",
      badge: "MOVIE WATCH PARTY",
      primarySection: "THE PARTY TIMELINE",
      navigationNoun: "WATCH STOP",
      evidenceNotice: "THE WATCHED MEDIA AND HOST AUDIO STAY SEPARATE.",
    }),
    contract({
      id: "scary-video-watch-party",
      runtimeFormat: "watch-party",
      runtimeLabel: "SOURCE-VIDEO WATCH PARTY",
      defaultSubtype: "scary-video-watch-party",
      allowedPublicClaims: [
        "that the official title declares a scary-video watch party",
        "timestamped topic doors and reviewed host-side reactions",
      ],
      requiredTypedFacts: [
        fact("watchedItem", "timestamped-source-item", "reviewed-source-local-evidence"),
        fact("reaction", "timestamped-reviewed-receipt", "exact-source-playback"),
      ],
      prohibitedInferences: [
        "Do not describe a third-party scary video from audio captions alone.",
        "Do not identify a linked source video unless the source relation is verified.",
        "Do not present source-video audio as a host quote.",
      ],
      forceDeny: [
        "originClaimsAllowed",
        "visualClaimsAllowed",
        "visualResultClaimsAllowed",
      ],
      maxPublicExcerptWords: 0,
      eyebrow: "SCARY VIDEO NIGHT",
      badge: "WATCH PARTY",
      primarySection: "THE REACTION RUN",
      navigationNoun: "VIDEO STOP",
      evidenceNotice: "SOURCE VIDEO, VISUAL, AND AUDIO ORIGIN ARE UNVERIFIED.",
    }),
    contract({
      id: "trailer-reaction",
      runtimeFormat: "trailer-coverage",
      runtimeLabel: "TRAILER COVERAGE",
      defaultSubtype: "reaction",
      allowedPublicClaims: [
        "the trailer named by the official source title",
        "reviewed, timestamped host-side reaction receipts",
      ],
      requiredTypedFacts: [
        fact("trailerTitle", "string", "canonical-source-title"),
        fact("reaction", "timestamped-reviewed-receipt", "exact-source-playback"),
      ],
      prohibitedInferences: [
        "Do not quote trailer dialogue as host speech.",
        "Do not describe trailer images from captions alone.",
        "Do not infer a positive or negative reaction from proximity to trailer audio.",
      ],
      forceDeny: ["originClaimsAllowed", "visualClaimsAllowed"],
      maxPublicExcerptWords: 0,
      eyebrow: "FIRST IMPACT",
      badge: "TRAILER REACTION",
      primarySection: "THE REACTION TIMELINE",
      navigationNoun: "REACTION",
      evidenceNotice: "TRAILER AUDIO AND HOST REACTION MUST BE DISAMBIGUATED.",
    }),
    contract({
      id: "trailer-breakdown",
      runtimeFormat: "trailer-coverage",
      runtimeLabel: "TRAILER COVERAGE",
      defaultSubtype: "breakdown",
      allowedPublicClaims: [
        "the trailer named by the official source title",
        "reviewed, timestamped breakdown points",
      ],
      requiredTypedFacts: [
        fact("trailerTitle", "string", "canonical-source-title"),
        fact("breakdownPoint", "timestamped-reviewed-fact", "exact-source-playback"),
      ],
      prohibitedInferences: [
        "Do not turn speculation into a trailer fact.",
        "Do not describe a frame without reviewed visual evidence.",
        "Do not quote trailer audio as host speech.",
      ],
      forceDeny: ["originClaimsAllowed", "visualClaimsAllowed"],
      maxPublicExcerptWords: 0,
      eyebrow: "FRAME BY FRAME",
      badge: "TRAILER BREAKDOWN",
      primarySection: "THE BREAKDOWN BOARD",
      navigationNoun: "BREAKDOWN POINT",
      evidenceNotice: "THEORY, SPOKEN FACT, AND VISIBLE FRAME STAY DISTINCT.",
    }),
    contract({
      id: "mixed-news-trailer",
      runtimeFormat: "mixed-news-trailer",
      runtimeLabel: "NEWS + TRAILER SHOW",
      defaultSubtype: "news-plus-trailer",
      allowedPublicClaims: [
        "source-title-declared news and trailer lanes",
        "timestamped topic navigation for each lane",
        "reviewed news summaries and trailer reactions kept in separate typed facts",
      ],
      requiredTypedFacts: [
        fact("lane", "enum<news,trailer>", "source-local-section"),
        fact("newsItem", "timestamped-reviewed-summary", "source-local-evidence"),
        fact("trailerReaction", "timestamped-reviewed-receipt", "exact-source-playback"),
      ],
      prohibitedInferences: [
        "Do not apply trailer-audio restrictions to an unrelated news segment without bounds.",
        "Do not apply a news claim to a trailer-reaction segment by proximity.",
        "Do not quote trailer audio as host speech.",
      ],
      forceDeny: ["originClaimsAllowed", "visualClaimsAllowed"],
      eyebrow: "TWO-LANE NIGHT",
      badge: "NEWS + TRAILERS",
      primarySection: "THE SHOW LANES",
      navigationNoun: "LANE CHANGE",
      evidenceNotice: "NEWS FACTS AND TRAILER REACTIONS USE DIFFERENT RECEIPTS.",
    }),
    contract({
      id: "spoiler-review",
      runtimeFormat: "movie-review",
      runtimeLabel: "MOVIE REVIEW",
      defaultSubtype: "spoiler-review",
      allowedPublicClaims: [
        "the reviewed title and spoiler status declared by source metadata",
        "reviewed, timestamped opinions and verdicts",
        "timestamped topic navigation without inferred sentiment",
      ],
      requiredTypedFacts: [
        fact("reviewedTitle", "string", "canonical-source-title"),
        fact("spoilerStatus", "enum<spoiler,spoiler-free>", "canonical-source-title"),
        fact("opinion", "timestamped-reviewed-opinion", "exact-source-playback"),
      ],
      prohibitedInferences: [
        "Do not infer a verdict from topic frequency or heat.",
        "Do not assign an opinion to a host without speaker evidence.",
        "Do not describe a plot event from an isolated automatic-caption fragment.",
      ],
      eyebrow: "VERDICT ROOM",
      badge: "SPOILER REVIEW",
      primarySection: "THE REVIEW TIMELINE",
      navigationNoun: "TAKE",
      evidenceNotice: "OPINIONS REQUIRE REVIEWED, SOURCE-LOCAL RECEIPTS.",
    }),
    contract({
      id: "episode-recap",
      runtimeFormat: "movie-review",
      runtimeLabel: "EPISODE RECAP",
      defaultSubtype: "episode-recap",
      allowedPublicClaims: [
        "the episode or series named by the official source title",
        "timestamped subject navigation inside the recap upload",
        "reviewed, source-local opinions tied to exact playback windows",
      ],
      requiredTypedFacts: [
        fact("recappedTitle", "string", "canonical-source-title"),
        fact("episodeScope", "string", "canonical-source-title"),
        fact(
          "opinion",
          "timestamped-reviewed-opinion",
          "exact-source-playback",
          "Required before presenting a verdict, reaction, or recommendation."
        ),
      ],
      prohibitedInferences: [
        "Do not turn an isolated automatic-caption fragment into a plot fact.",
        "Do not infer a verdict from topic frequency, heat, or recap placement.",
        "Do not assign an opinion to a host without speaker evidence.",
      ],
      eyebrow: "EPISODE AFTERMATH",
      badge: "EPISODE RECAP",
      primarySection: "THE RECAP TIMELINE",
      navigationNoun: "RECAP STOP",
      evidenceNotice: "PLOT FACTS AND OPINIONS REQUIRE SOURCE-LOCAL REVIEW.",
    }),
    contract({
      id: "movie-news",
      runtimeFormat: "movie-news",
      runtimeLabel: "MOVIE NEWS",
      defaultSubtype: "news-roundup",
      allowedPublicClaims: [
        "source-title-declared movie-news scope",
        "timestamped subject doors",
        "reviewed summaries that distinguish reported fact, rumor, and host opinion",
      ],
      requiredTypedFacts: [
        fact("newsItem", "timestamped-news-item", "reviewed-source-local-evidence"),
        fact("claimState", "enum<reported,rumor,opinion,unknown>", "editorial-review"),
      ],
      prohibitedInferences: [
        "Do not convert a host prediction into reported news.",
        "Do not convert a rumor into a confirmed fact.",
        "Do not use upload date as the event date without a typed event date.",
      ],
      eyebrow: "NIGHT WIRE",
      badge: "MOVIE NEWS",
      primarySection: "THE NEWS DESK",
      navigationNoun: "STORY",
      evidenceNotice: "FACT, RUMOR, AND OPINION STAY LABELED.",
    }),
    contract({
      id: "visual-ranking",
      runtimeFormat: "ranking",
      runtimeLabel: "RANKING / BRACKET",
      defaultSubtype: "visual-ranking",
      allowedPublicClaims: [
        "the ranking, bracket, or tier-list premise declared by the title",
        "caption-derived item navigation",
        "placements only when a reviewed visual or explicit spoken result fact exists",
      ],
      requiredTypedFacts: [
        fact("rankedItem", "identified-item", "reviewed-source-local-evidence"),
        fact(
          "placement",
          "integer-or-tier",
          "reviewed-visual-or-explicit-spoken-result",
          "Required before publishing order, tier, winner, or elimination."
        ),
      ],
      prohibitedInferences: [
        "Do not infer visible order, tier, bracket advancement, or winner from mention order.",
        "Do not treat a nomination, matchup, or chat suggestion as the final result.",
        "Do not claim the on-screen board was seen unless visual evidence was reviewed.",
      ],
      forceDeny: ["visualClaimsAllowed", "visualResultClaimsAllowed"],
      eyebrow: "THE BIG BOARD",
      badge: "VISUAL RANKING",
      primarySection: "THE RANKING TAPE",
      navigationNoun: "MATCHUP",
      evidenceNotice: "VISIBLE RESULTS REQUIRE REVIEWED VISUAL EVIDENCE.",
    }),
    contract({
      id: "spoken-ranking",
      runtimeFormat: "ranking",
      runtimeLabel: "RANKING / COUNTDOWN",
      defaultSubtype: "spoken-ranking",
      allowedPublicClaims: [
        "the ranking or countdown premise declared by the title",
        "caption-supported item navigation",
        "explicitly spoken placements tied to exact timestamps",
      ],
      requiredTypedFacts: [
        fact("rankedItem", "identified-item", "reviewed-source-local-evidence"),
        fact("placement", "integer-or-tier", "explicit-spoken-result"),
      ],
      prohibitedInferences: [
        "Do not infer final order from mention order.",
        "Do not convert a debate candidate into a final placement.",
        "Do not claim a winner unless an explicit result fact exists.",
      ],
      eyebrow: "THE COUNTDOWN",
      badge: "SPOKEN RANKING",
      primarySection: "THE LIST ON THE TAPE",
      navigationNoun: "PLACEMENT",
      evidenceNotice: "MENTION ORDER IS NOT FINAL ORDER.",
    }),
    contract({
      id: "script-reading",
      runtimeFormat: "script",
      runtimeLabel: "SCRIPT SHOW",
      defaultSubtype: "script-reading",
      allowedPublicClaims: [
        "the script-reading premise declared by source metadata",
        "timestamped topic navigation with no script-text origin claim",
      ],
      requiredTypedFacts: [
        fact("scriptTitle", "string", "canonical-source-title"),
        fact("passageOrigin", "enum<script,host,guest,unknown>", "reviewed-audio-origin"),
      ],
      prohibitedInferences: [
        "Do not present script text as host-authored commentary.",
        "Do not present host commentary as canonical script text.",
        "Do not quote screenplay text without origin and rights review.",
      ],
      forceDeny: ["originClaimsAllowed"],
      forceTopicNavigation: true,
      maxPublicExcerptWords: 0,
      eyebrow: "TABLE READ",
      badge: "SCRIPT READING",
      primarySection: "THE SCRIPT MAP",
      navigationNoun: "PASSAGE",
      evidenceNotice: "SCRIPT TEXT AND HOST SPEECH REQUIRE ORIGIN REVIEW.",
    }),
    contract({
      id: "script-review",
      runtimeFormat: "script",
      runtimeLabel: "SCRIPT SHOW",
      defaultSubtype: "script-review",
      allowedPublicClaims: [
        "the script review or recap premise declared by source metadata",
        "reviewed summaries and opinions tied to exact source moments",
      ],
      requiredTypedFacts: [
        fact("scriptTitle", "string", "canonical-source-title"),
        fact("summaryPoint", "timestamped-reviewed-summary", "source-local-evidence"),
        fact("opinion", "timestamped-reviewed-opinion", "exact-source-playback"),
      ],
      prohibitedInferences: [
        "Do not present a recap as a verbatim script reading.",
        "Do not present a host paraphrase as canonical screenplay text.",
        "Do not infer script authorship or version without typed metadata.",
      ],
      forceDeny: ["originClaimsAllowed"],
      eyebrow: "SCRIPT DOCTOR",
      badge: "SCRIPT REVIEW",
      primarySection: "THE SCRIPT BREAKDOWN",
      navigationNoun: "STORY POINT",
      evidenceNotice: "PARAPHRASE, SCRIPT TEXT, AND OPINION STAY DISTINCT.",
    }),
    contract({
      id: "generated-script-bit",
      runtimeFormat: "script",
      runtimeLabel: "SCRIPT SHOW",
      defaultSubtype: "generated-script-bit",
      allowedPublicClaims: [
        "the generated-script comedy premise declared by source metadata",
        "reviewed performance beats tied to the exact upload",
      ],
      requiredTypedFacts: [
        fact("generatorState", "enum<declared,verified,unknown>", "source-metadata-or-review"),
        fact("generatedPassage", "timestamp-range", "reviewed-origin-boundary"),
        fact("hostPerformance", "timestamped-reviewed-receipt", "exact-source-playback"),
      ],
      prohibitedInferences: [
        "Do not claim a model generated text unless the source declares or verifies it.",
        "Do not present generated copy as an archival fact.",
        "Do not attribute generated words to a host outside reviewed performance bounds.",
      ],
      forceDeny: ["originClaimsAllowed"],
      maxPublicExcerptWords: 0,
      eyebrow: "THE MACHINE WROTE WHAT?",
      badge: "GENERATED SCRIPT BIT",
      primarySection: "THE BIT TIMELINE",
      navigationNoun: "BIT BEAT",
      evidenceNotice: "GENERATED COPY IS NOT ARCHIVAL EVIDENCE.",
    }),
    contract({
      id: "generic-livestream",
      runtimeFormat: "livestream",
      runtimeLabel: "LIVESTREAM",
      defaultSubtype: "generic-livestream",
      allowedPublicClaims: [
        "canonical source metadata",
        "timestamped topic navigation when caption evidence exists",
        "reviewed source-local moments with explicit evidence state",
      ],
      requiredTypedFacts: [
        fact("topic", "timestamped-topic", "source-local-receipt"),
      ],
      prohibitedInferences: [
        "Do not invent a show premise when the title only says livestream.",
        "Do not call a topic door a summary, opinion, joke, or verdict.",
      ],
      eyebrow: "OPEN CHANNEL",
      badge: "WWAM LIVESTREAM",
      primarySection: "THE SOURCE MAP",
      navigationNoun: "TAPE STOP",
      evidenceNotice: "UNKNOWN FORMAT DETAILS REMAIN UNKNOWN.",
    }),
  ];

  var CONTRACT_BY_ID = new Map(
    CONTRACTS.map(function (item) {
      return [item.id, item];
    })
  );

  var RAW_MODE_FAMILIES = deepFreeze({
    "after-party-discussion": "movie-review",
    "anticipated-movies": "ranking",
    "death-scene-ranking": "ranking",
    "feature-commentary": "movie-companion",
    "fight-ranking": "ranking",
    "franchise-q-and-a": "audience-q-and-a",
    "movie-commentary": "movie-companion",
    "movie-news": "movie-news",
    "movie-news-dreamcast": "movie-news",
    "movie-news-review": "movie-news",
    "news-q-and-a": "audience-q-and-a",
    "news-ranking": "ranking",
    "q-and-a": "audience-q-and-a",
    "ranking-show": "ranking",
    "review-discussion": "movie-review",
    "review-news": "movie-review",
    "review-reaction": "movie-review",
    "review-show": "movie-review",
    "script-reading": "script",
    "source-video-watch-party": "watch-party",
    "spoiler-free-review": "movie-review",
    "spoiler-q-and-a": "audience-q-and-a",
    "spoiler-ranking": "ranking",
    "spoiler-review": "movie-review",
    "trailer-breakdown": "trailer-coverage",
    "trailer-reaction": "trailer-coverage",
    "visual-ranking": "ranking",
    "visual-ranking-guest": "ranking",
    "watch-party": "movie-companion",
  });

  function rawContentMode(source) {
    if (source && source.rawContentMode != null) {
      return String(source.rawContentMode);
    }
    if (source && source.contentMode != null) {
      return String(source.contentMode);
    }
    return null;
  }

  function titleFeatures(source) {
    var title = clean(
      (source && source.title) + " " + (source && source.displayTitle || "")
    );
    var lower = title.toLowerCase();
    var words = normalized(title);
    var feature = {
      mountRushmore: /\bmount\s+rushmore\b/i.test(lower),
      qAndA:
        /\bq\s*(?:and|[+&])\s*a\b/i.test(lower) ||
        /\bquestions?\s*(?:and|[+&])\s*answers?\b/i.test(lower),
      commentary: /\bcommentary\b/i.test(lower),
      watchalong: /\bwatch\s*along\b|\bwatchalong\b/i.test(lower),
      watchParty:
        /\bwatch\s*party\b|\blive\s+watch\b|\bwatching\b.+\btogether\b/i.test(
          lower
        ),
      watchTogether: /\b(?:let'?s\s+)?watch\b.+\btogether\b/i.test(lower),
      scaryVideo: /\bscary\s+videos?\b/i.test(lower),
      trailer: /\btrailers?\b|\bteasers?\b|\bfirst\s+look\b/i.test(lower),
      trailerReaction: /\breaction(?:s)?\b|\breacts?\b/i.test(lower),
      trailerBreakdown: /\bbreakdown\b|\bframe\s+by\s+frame\b/i.test(lower),
      spoiler: /\bspoiler(?:s)?\b|\bspoiler\s+free\b/i.test(lower),
      spoilerFree: /\bspoiler\s+free\b/i.test(lower),
      review: /\breview(?:s)?\b|\breviewing\b/i.test(lower),
      recap:
        /\brecap(?:s|ped|ping)?\b|\bpost[- ]show\b/i.test(lower),
      spoilerParty:
        /\bspoiler\b.{0,24}\b(?:party|talk|stream|livestream)\b/i.test(lower),
      movieNews:
        /\b(?:movie|horror|action)\s+news\b|\bnews\s+(?:live|stream)\b/i.test(
          lower
        ),
      update: /\bupdates?\b|\bbreaking\b|\brumou?rs?\b/i.test(lower),
      ranking:
        /\brank(?:ed|ing|ings)?\b|\btier\s+list\b|\bbracket\b|\btournament\b|\btop\s+\d+\b|\bcountdown\b/i.test(
          lower
        ),
      tierList: /\btier\s+list\b/i.test(lower),
      bracket: /\bbracket\b|\btournament\b/i.test(lower),
      topList: /\btop\s+\d+\b|\bcountdown\b/i.test(lower),
      versus: /\bvs\b|\bversus\b|\bfriday\s+night\s+fights?\b/i.test(words),
      visualRankingSubject:
        /\bposters?\b|\bcostumes?\b|\bdeath\s+scenes?\b|\bmerchandise\b|\bmasks?\b|\bcovers?\b|\bthumbnails?\b|\blooks?\b|\bartwork\b/i.test(
          lower
        ),
      script: /\bscript\b|\bscreenplay\b|\btable\s+read\b/i.test(lower),
      scriptReading:
        /\bscript\s+(?:read|reading)\b|\bscreenplay\s+(?:read|reading)\b|\btable\s+read\b/i.test(
          lower
        ),
      scriptReview:
        /\bscript\s+(?:review|recap|breakdown|discussion)\b|\bscreenplay\s+(?:review|recap|breakdown)\b/i.test(
          lower
        ),
      generatedScript:
        /\b(?:ai|a\.i\.|chatgpt|machine)\b.{0,60}\b(?:generated|written|writes?|wrote)\b.{0,60}\bscript\b|\b(?:ai|a\.i\.|chatgpt|machine)[ -]?(?:generated|written|writes?|wrote)?\s*(?:movie\s+)?script\b|\bgenerated\s+(?:movie\s+)?script\b|\bscript\s+(?:written|generated)\s+by\s+(?:ai|a\.i\.|chatgpt|a\s+machine)\b/i.test(
          lower
        ),
    };
    feature.mixedNewsTrailer =
      feature.trailer && (feature.movieNews || feature.update);
    feature.matched = Object.keys(feature).filter(function (key) {
      return key !== "matched" && feature[key] === true;
    });
    return feature;
  }

  function rankingSubtype(feature) {
    if (feature.bracket) return "bracket";
    if (feature.tierList) return "tier-list";
    if (feature.topList) return "countdown";
    if (feature.versus) return "versus-show";
    return "ranking";
  }

  function qAndASubtype(feature, rawMode) {
    var raw = normalized(rawMode);
    if (feature.spoiler || raw.indexOf("spoiler") >= 0) return "spoiler-q-and-a";
    if (feature.movieNews || raw.indexOf("news") >= 0) return "news-q-and-a";
    if (raw.indexOf("franchise") >= 0) return "franchise-q-and-a";
    return "general-q-and-a";
  }

  function spoilerSubtype(feature, rawMode) {
    var raw = normalized(rawMode);
    if (feature.spoilerFree || raw.indexOf("spoiler-free") >= 0) {
      return "spoiler-free-review";
    }
    if (feature.spoilerParty) return "spoiler-party";
    if (raw.indexOf("after-party") >= 0) return "after-party-discussion";
    return "spoiler-review";
  }

  function chooseContract(source, feature, rawMode) {
    var raw = normalized(rawMode);
    var rawIs = function (pattern) { return pattern.test(raw); };

    if (feature.generatedScript || rawIs(/generated script|script bit/)) {
      return { id: "generated-script-bit", subtype: "generated-script-bit" };
    }
    if (feature.scriptReading || rawIs(/^script reading$/)) {
      return { id: "script-reading", subtype: "script-reading" };
    }
    if (feature.scriptReview || rawIs(/script review|script recap/)) {
      return { id: "script-review", subtype: "script-review" };
    }
    if (feature.scaryVideo &&
        (feature.watchParty || feature.watchTogether ||
          rawIs(/source video watch party/))) {
      return {
        id: "scary-video-watch-party",
        subtype: "scary-video-watch-party",
      };
    }
    if (feature.commentary || rawIs(/feature commentary|movie commentary/)) {
      return { id: "movie-commentary", subtype: "commentary" };
    }
    if (feature.watchalong ||
        feature.watchTogether && !feature.scaryVideo) {
      return { id: "movie-watchalong", subtype: "watchalong" };
    }
    if (feature.watchParty || rawIs(/^watch party$/)) {
      return { id: "movie-watch-party", subtype: "watch-party" };
    }
    if (feature.mountRushmore) {
      return { id: "mount-rushmore", subtype: "mount-rushmore" };
    }
    if (feature.ranking ||
        rawIs(/ranking|anticipated movies|versus show|fight ranking/)) {
      var isVisual =
        feature.visualRankingSubject ||
        feature.tierList ||
        feature.bracket ||
        rawIs(/visual ranking/);
      return {
        id: isVisual ? "visual-ranking" : "spoken-ranking",
        subtype: rankingSubtype(feature),
      };
    }
    if (feature.mixedNewsTrailer ||
        feature.trailer && rawIs(/movie news|news /) ||
        feature.movieNews && rawIs(/trailer/)) {
      return { id: "mixed-news-trailer", subtype: "news-plus-trailer" };
    }
    if (feature.trailer || rawIs(/trailer reaction|trailer breakdown/)) {
      if (feature.trailerBreakdown || rawIs(/trailer breakdown/)) {
        return { id: "trailer-breakdown", subtype: "breakdown" };
      }
      return { id: "trailer-reaction", subtype: "reaction" };
    }
    if (feature.qAndA || rawIs(/q and a/)) {
      return {
        id: "q-and-a",
        subtype: qAndASubtype(feature, rawMode),
      };
    }
    if (
      feature.spoilerParty ||
      feature.spoiler && feature.review ||
      rawIs(/spoiler review|review reaction|review discussion|after party/)
    ) {
      return {
        id: "spoiler-review",
        subtype: spoilerSubtype(feature, rawMode),
      };
    }
    if (feature.recap || rawIs(/episode recap|recap show|series recap/)) {
      return {
        id: "episode-recap",
        subtype: "episode-recap",
      };
    }
    if (
      feature.movieNews ||
      !feature.review && rawIs(/movie news|news q and a|news ranking/)
    ) {
      return { id: "movie-news", subtype: "news-roundup" };
    }
    if (feature.review || rawIs(/review show|review news/)) {
      return {
        id: "spoiler-review",
        subtype: feature.spoilerFree ? "spoiler-free-review" : "review",
      };
    }
    return { id: "generic-livestream", subtype: "generic-livestream" };
  }

  function boundaryMode(mode) {
    return /(?:audio|origin)-boundary-unverified/.test(normalized(mode));
  }

  function effectiveRights(policy, selectedContract) {
    var input = policy && typeof policy === "object" ? clone(policy) : {};
    var output = clone(input);
    var denied = new Set(selectedContract.rightsFloor.forceDeny);

    RIGHTS_BOOLEAN_FIELDS.forEach(function (field) {
      output[field] = denied.has(field) ? false : input[field] === true;
    });
    output.restrictedToTopicNavigation = Boolean(
      input.restrictedToTopicNavigation ||
      selectedContract.rightsFloor.forceTopicNavigation ||
      boundaryMode(input.mode)
    );

    var sourceLimit = Number(input.publicExcerptWordLimit);
    var hasSourceLimit =
      input.publicExcerptWordLimit != null &&
      Number.isFinite(sourceLimit) &&
      sourceLimit >= 0;
    output.publicExcerptWordLimit = Math.min(
      hasSourceLimit ? sourceLimit : 0,
      selectedContract.rightsFloor.maxPublicExcerptWords
    );
    return output;
  }

  function rightsRegressions(inputPolicy, outputPolicy) {
    var input =
      inputPolicy && typeof inputPolicy === "object" ? inputPolicy : {};
    var output =
      outputPolicy && typeof outputPolicy === "object" ? outputPolicy : {};
    var failures = [];
    RIGHTS_BOOLEAN_FIELDS.forEach(function (field) {
      if (input[field] === false && output[field] !== false) {
        failures.push(field + ":false-became-allowed");
      }
    });
    if (
      input.restrictedToTopicNavigation === true &&
      output.restrictedToTopicNavigation !== true
    ) {
      failures.push("restrictedToTopicNavigation:true-became-false");
    }
    var inputLimit = Number(input.publicExcerptWordLimit);
    var outputLimit = Number(output.publicExcerptWordLimit);
    if (
      input.publicExcerptWordLimit != null &&
      Number.isFinite(inputLimit) &&
      Number.isFinite(outputLimit) &&
      outputLimit > inputLimit
    ) {
      failures.push("publicExcerptWordLimit:increased");
    }
    return failures;
  }

  function effectiveClaims(selectedContract, policy) {
    return selectedContract.allowedPublicClaims.filter(function (claim) {
      var value = claim.toLowerCase();
      if (
        policy.restrictedToTopicNavigation &&
        /reaction|opinion|verdict|joke|excerpt|answer summar/.test(value)
      ) {
        return false;
      }
      if (
        policy.publicExcerptWordLimit <= 0 &&
        /excerpt|quote|script text/.test(value)
      ) {
        return false;
      }
      if (policy.visualClaimsAllowed === false && /visible frame|visual description/.test(value)) {
        return false;
      }
      if (
        policy.visualResultClaimsAllowed === false &&
        /placement|winner|elimination|visible result/.test(value)
      ) {
        return false;
      }
      return true;
    });
  }

  function subtypeLabel(value) {
    return clean(value)
      .replace(/[-_]+/g, " ")
      .toUpperCase();
  }

  function classify(source) {
    if (!source || typeof source !== "object") {
      throw new TypeError("Episode format classification requires a source object.");
    }
    var rawMode = rawContentMode(source);
    var features = titleFeatures(source);
    var selected = chooseContract(source, features, rawMode);
    var selectedContract = CONTRACT_BY_ID.get(selected.id);
    var inputRights =
      source.rightsPolicy && typeof source.rightsPolicy === "object"
        ? source.rightsPolicy
        : {};
    var outputRights = effectiveRights(inputRights, selectedContract);
    var result = {
      schema: CLASSIFICATION_SCHEMA,
      registryVersion: VERSION,
      sourceId: clean(source.id || source.sourceId),
      title: clean(source.title || source.displayTitle),
      rawContentMode: rawMode,
      runtimeFormat: clone(selectedContract.runtimeFormat),
      subtype: {
        id: selected.subtype || selectedContract.defaultSubtype,
        label: subtypeLabel(
          selected.subtype || selectedContract.defaultSubtype
        ),
        qualifiers: unique([
          features.movieNews &&
          selectedContract.runtimeFormat.id !== "movie-news"
            ? "with-movie-news"
            : "",
          features.qAndA &&
          selectedContract.runtimeFormat.id !== "audience-q-and-a"
            ? "with-q-and-a"
            : "",
          features.spoiler &&
          selectedContract.runtimeFormat.id !== "movie-review"
            ? "spoiler"
            : "",
        ]),
      },
      contractId: selectedContract.id,
      classificationBasis: {
        rawContentMode: rawMode == null ? "not-registered" : "preserved",
        titleFeatures: features.matched.slice(),
        rightsMode: clean(inputRights.mode) || "not-registered",
      },
      rightsPolicy: outputRights,
      allowedPublicClaims: selectedContract.allowedPublicClaims.slice(),
      effectiveAllowedPublicClaims: effectiveClaims(
        selectedContract,
        outputRights
      ),
      requiredTypedFacts: clone(selectedContract.requiredTypedFacts),
      prohibitedInferences: selectedContract.prohibitedInferences.slice(),
      ui: clone(selectedContract.ui),
    };
    return deepFreeze(result);
  }

  function expectedFamily(rawMode) {
    return RAW_MODE_FAMILIES[normalized(rawMode)] || "";
  }

  function driftReport(sources) {
    var ids = new Set();
    var classifications = [];
    var duplicateSourceIds = [];
    var rightsFailures = [];
    var formatConflicts = [];
    var refinements = [];

    array(sources).forEach(function (source, index) {
      var classification = classify(source);
      var sourceId = classification.sourceId || "index:" + index;
      if (ids.has(sourceId)) duplicateSourceIds.push(sourceId);
      ids.add(sourceId);
      classifications.push(classification);

      var regressions = rightsRegressions(
        source && source.rightsPolicy,
        classification.rightsPolicy
      );
      if (regressions.length) {
        rightsFailures.push({
          sourceId: sourceId,
          failures: regressions,
        });
      }

      var rawFamily = expectedFamily(classification.rawContentMode);
      if (
        rawFamily &&
        rawFamily !== classification.runtimeFormat.family
      ) {
        formatConflicts.push({
          sourceId: sourceId,
          rawContentMode: classification.rawContentMode,
          rawFamily: rawFamily,
          runtimeFormat: classification.runtimeFormat.id,
          runtimeFamily: classification.runtimeFormat.family,
        });
      } else if (
        normalized(classification.rawContentMode) === "livestream" &&
        classification.runtimeFormat.id !== "livestream"
      ) {
        refinements.push({
          sourceId: sourceId,
          rawContentMode: classification.rawContentMode,
          runtimeFormat: classification.runtimeFormat.id,
          subtype: classification.subtype.id,
          basis: "generic-raw-mode-refined-by-title-features",
        });
      }
    });

    return deepFreeze({
      schema: DRIFT_SCHEMA,
      registryVersion: VERSION,
      total: array(sources).length,
      classified: classifications.length,
      uniqueSourceIds: ids.size,
      missingRawContentMode: classifications.filter(function (item) {
        return item.rawContentMode == null;
      }).length,
      duplicateSourceIds: unique(duplicateSourceIds).sort(),
      byContract: countBy(classifications, function (item) {
        return item.contractId;
      }),
      byRuntimeFormat: countBy(classifications, function (item) {
        return item.runtimeFormat.id;
      }),
      bySubtype: countBy(classifications, function (item) {
        return item.subtype.id;
      }),
      formatConflicts: formatConflicts,
      titleRefinements: refinements,
      rightsRegressions: rightsFailures,
      restrictiveRightsPreserved: rightsFailures.length === 0,
      classifications: classifications,
    });
  }

  function getContract(id) {
    return CONTRACT_BY_ID.get(clean(id)) || null;
  }

  root.WWAMEpisodeFormatContracts = deepFreeze({
    VERSION: VERSION,
    CLASSIFICATION_SCHEMA: CLASSIFICATION_SCHEMA,
    DRIFT_SCHEMA: DRIFT_SCHEMA,
    CONTRACTS: CONTRACTS,
    classify: classify,
    driftReport: driftReport,
    getContract: getContract,
    rightsRegressions: rightsRegressions,
  });
})(typeof self !== "undefined" ? self : this);
