(function (root) {
  "use strict";

  var VERSION = "2.1.0";
  var PRODUCT = "WWAM AFTER MIDNIGHT · RED BAND MEMORABILITY CANDIDATE INDEX";
  var DEFAULT_LIMIT = 100;
  var EXCERPT_WORD_LIMIT = 16;
  var EDITORIAL_VOTE_MIN = -5;
  var EDITORIAL_VOTE_MAX = 5;
  var TOP_SLICE_POLICY = {
    window: 25,
    candidateHorizonMultiplier: 6,
    maximumPerCategory: 4,
    maximumExplicitBodyOrSexualLexical: 5,
    maximumPreselectedCandidates: 8,
    maximumPerSource: 2,
    maximumNearDuplicateSimilarity: 0.72,
    minimumReceiptCoherenceScore: 48
  };
  var RECEIPT_COHERENCE_POLICY = {
    version: "receipt-coherence/v1",
    minimumScore: 48,
    structuralGateMinimumTokens: 8,
    minimumDistinctContentTokens: 3,
    maximumRepeatedTokenShare: 0.62,
    maximumFillerTokenShare: 0.4,
    languageNeutral: true,
    interpretation:
      "A deterministic caption-fragment check for showcase placement. It measures lexical variety, non-filler content, repetition, and bounded-context edges; profanity and sexual/gross language are not negative inputs."
  };
  var CATEGORY_BASELINES = {
    "THE ROOM BREAKS": 100,
    "OUT OF POCKET": 99,
    "UP IN YA": 98,
    "CHARACTER CALLBACK": 96,
    "FULL SEND": 93,
    "TAKE GETS NUCLEAR": 91,
    BREAKDOWN: 88,
    "BIT ENERGY": 85,
    "CHAT DID THIS": 83,
    "KILL ROOM": 79,
    "FRANCHISE FELONY": 75,
    "HORROR BRAIN": 65,
    "THEORY BOARD": 61,
    "LOVE LETTER": 57
  };
  var SCORE_WEIGHTS = {
    categoryIntensity: 0.25,
    roomBreak: 0.16,
    languageVoltage: 0.16,
    loreCallback: 0.17,
    humanCuration: 0.16,
    sourceDiversity: 0.10
  };
  var PROVIDER_PRIORITY = {
    "character-soundbyte": 8,
    "character-context": 7,
    "curated-up-in-ya": 6,
    "recent-livestream": 5,
    "popular-livestream": 4,
    "deep-moment": 3,
    "deep-hot100": 2
  };
  var FRANCHISE_RULES = [
    {
      label: "Friday the 13th",
      pattern: /\bfriday(?: the)? 13(?:th)?\b|\bjason\b|\bcrystal lake\b/i
    },
    {
      label: "A Nightmare on Elm Street",
      pattern: /\bnightmare on elm street\b|\belm street\b|\bfreddy\b|\bkrueger\b/i
    },
    {
      label: "Halloween",
      pattern: /\bhalloween\b|\bmichael myers\b|\bloomis\b|\bdr challis\b/i
    },
    {
      label: "Scream",
      pattern: /\bscream(?:\s+[2-6vi]+|\s+19|\s+20|\b)|\bghostface\b/i
    }
  ];
  var ROOM_BREAK_PATTERNS = [
    { pattern: /\b(?:laugh|laughing|laughter|laughed|giggl|cackl)\w*\b/gi, weight: 3 },
    { pattern: /\b(?:haha+|ha ha|lol|lmao)\b/gi, weight: 3 },
    { pattern: /\b(?:i can'?t breathe|losing it|lost it|the room breaks)\b/gi, weight: 5 },
    { pattern: /\[(?:laughter|laughs)\]/gi, weight: 5 }
  ];
  var LANGUAGE_PATTERNS = [
    { pattern: /\[(?:bleep|censored)\]/gi, weight: 2.5, lane: "profanity" },
    {
      pattern: /\b(?:fuck|fucking|fucked|shit|shitty|goddamn|damn|ass|bastard|bitch)\w*\b/gi,
      weight: 2.5,
      lane: "profanity"
    },
    {
      pattern: /\b(?:dick|cock|penis|jizz|splooge|butt|poop|fart|balls?)\w*\b/gi,
      weight: 2,
      lane: "gross-out"
    },
    {
      pattern: /\b(?:kill|killed|killer|murder|murdered|death|dead|die|died|blood)\w*\b/gi,
      weight: 1.5,
      lane: "kill-language"
    },
    {
      pattern: /\b(?:hate|worst|terrible|awful|garbage|stupid|sucks?|nuclear)\w*\b/gi,
      weight: 1.25,
      lane: "take-language"
    }
  ];
  var LORE_PATTERNS = [
    /\bdr\.?\s+loomis\b/i,
    /\bdr\.?\s+challis\b/i,
    /\bslender(?:man)?\b/i,
    /\bcorey feldman\b/i,
    /\bwolf pack\b/i,
    /\bsilver shamrock\b/i,
    /\bthe shape\b/i,
    /\bghostface\b/i,
    /\bfreddy\b/i,
    /\bjason\b/i,
    /\bmichael myers\b/i
  ];
  var EXPLICIT_BODY_OR_SEXUAL_PATTERNS = [
    {
      label: "sexual/anatomy",
      pattern:
        /\b(?:dick|cock|penis|jizz|splooge|cum|pussy|vagina|balls?|testicles?|tits?|boobs?)\w*\b/gi
    },
    {
      label: "explicit-body",
      pattern: /\b(?:butt\s*plug|butthole|asshole)\w*\b/gi
    }
  ];
  var NEAR_DUPLICATE_STOPWORDS = new Set(
    (
      "a an and are as at be because been but by can did do does for from had has " +
      "have he her here him his how i if in into is it its just like me my no not " +
      "of oh on one or our out she so some that the their them then there they this " +
      "to up was we were what when where which who why will with would yeah yes you your"
    ).split(/\s+/)
  );
  var RECEIPT_COHERENCE_STOPWORDS = new Set(
    (
      "a an and are as at be because been being but by can cant can't could couldnt " +
      "did didnt do does doesnt doing dont don't for from had has have he her here hers " +
      "him his how i id ill im i'm if in into is isnt it its it's just me might my no " +
      "not of on one or our ours she should so some than that the their them then there " +
      "these they this those to too up us was we were what when where wheres where's " +
      "which who why will with would wouldnt you your yours bleep"
    ).split(/\s+/)
  );
  var RECEIPT_COHERENCE_FILLERS = new Set(
    (
      "ah alright anyways basically eh er hey hmm huh like literally look okay ok " +
      "right so uh um well yeah yep yo"
    ).split(/\s+/)
  );
  var RECEIPT_COHERENCE_CONNECTORS = new Set(
    (
      "a an and as at because but by for from i if in into like of on or she so " +
      "that the they this to we what when where which who with you"
    ).split(/\s+/)
  );

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

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

  function explicitLexicalSignals(value) {
    var text = clean(value).replace(/\bdick\s+(?:tracy|warlock)\b/gi, "proper name");
    var families = {};
    var count = 0;
    EXPLICIT_BODY_OR_SEXUAL_PATTERNS.forEach(function (item) {
      var matches = text.match(item.pattern);
      if (!matches || !matches.length) return;
      families[item.label] = matches.length;
      count += matches.length;
    });
    return {
      hit: count > 0,
      count: count,
      families: families
    };
  }

  function nearDuplicateTokens(value) {
    return unique(
      normalized(value)
        .split(/\s+/)
        .filter(function (token) {
          return (
            token.length >= 3 &&
            !NEAR_DUPLICATE_STOPWORDS.has(token) &&
            token !== "bleep"
          );
        })
    ).sort();
  }

  function tokenSimilarity(leftTokens, rightTokens) {
    var left = array(leftTokens);
    var right = array(rightTokens);
    if (Math.min(left.length, right.length) < 4) return 0;
    var rightSet = new Set(right);
    var intersection = left.reduce(function (count, token) {
      return count + (rightSet.has(token) ? 1 : 0);
    }, 0);
    if (intersection < 4) return 0;
    var union = new Set(left.concat(right)).size;
    var jaccard = intersection / Math.max(1, union);
    var containment = intersection / Math.max(1, Math.min(left.length, right.length));
    return round(Math.max(jaccard, containment * 0.9), 4);
  }

  function shortText(value, limit) {
    var text = clean(value);
    var maximum = Math.max(12, number(limit, 64));
    return text.length > maximum ? text.slice(0, maximum - 1).trim() + "…" : text;
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback == null ? 0 : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, number(value)));
  }

  function round(value, places) {
    var factor = Math.pow(10, places == null ? 2 : places);
    return Math.round(number(value) * factor) / factor;
  }

  function serialCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce(function (result, key) {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
    }
    return value;
  }

  function stableJson(value) {
    return JSON.stringify(stableValue(value));
  }

  function fingerprint(value) {
    var source = String(value == null ? "" : value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function stableSort(values, compare) {
    return array(values)
      .map(function (value, index) {
        return { value: value, index: index };
      })
      .sort(function (left, right) {
        return compare(left.value, right.value) || left.index - right.index;
      })
      .map(function (entry) {
        return entry.value;
      });
  }

  function countWords(value) {
    return clean(value).split(/\s+/).filter(Boolean).length;
  }

  function coherenceTokens(value) {
    var matches = clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .match(/[a-z0-9]+(?:['\u2019][a-z0-9]+)*/g);
    return array(matches).map(function (token) {
      return token.replace(/\u2019/g, "'");
    });
  }

  function receiptCoherence(value, excerpt) {
    var text = clean(value);
    var tokens = coherenceTokens(text);
    var frequencies = {};
    tokens.forEach(function (token) {
      frequencies[token] = number(frequencies[token]) + 1;
    });
    var uniqueTokens = Object.keys(frequencies);
    var fillerCount = tokens.filter(function (token) {
      return RECEIPT_COHERENCE_FILLERS.has(token);
    }).length;
    var contentTokens = tokens.filter(function (token) {
      return (
        !RECEIPT_COHERENCE_STOPWORDS.has(token) &&
        !RECEIPT_COHERENCE_FILLERS.has(token)
      );
    });
    var distinctContentTokens = unique(contentTokens);
    var repeatedTokenCount = Object.keys(frequencies).reduce(function (count, token) {
      return count + (frequencies[token] > 1 ? frequencies[token] : 0);
    }, 0);
    var tokenCount = tokens.length;
    var lexicalDiversity = tokenCount
      ? (uniqueTokens.length / tokenCount) * 100
      : 0;
    var contentDensity = tokenCount
      ? (contentTokens.length / tokenCount) * 100
      : 0;
    var repeatedTokenShare = tokenCount
      ? repeatedTokenCount / tokenCount
      : 1;
    var fillerTokenShare = tokenCount ? fillerCount / tokenCount : 1;
    var leadingFragment = /^(?:\u2026|\.{3})/.test(text);
    var trailingFragment =
      /(?:\u2026|\.{3})$/.test(text) ||
      Boolean(excerpt && excerpt.truncated);
    var finalToken = tokens[tokens.length - 1] || "";
    var connectorEnding = RECEIPT_COHERENCE_CONNECTORS.has(finalToken);
    var boundaryCompleteness = clamp(
      100 -
        (leadingFragment ? 20 : 0) -
        (trailingFragment ? 25 : 0) -
        (connectorEnding ? 20 : 0),
      0,
      100
    );
    var repetitionResistance = (1 - repeatedTokenShare) * 100;
    var lengthSupport = Math.min(100, (tokenCount / 8) * 100);
    var score = round(
      lexicalDiversity * 0.25 +
        contentDensity * 0.25 +
        repetitionResistance * 0.25 +
        boundaryCompleteness * 0.15 +
        lengthSupport * 0.1,
      2
    );
    var structuralGateApplies =
      tokenCount >= RECEIPT_COHERENCE_POLICY.structuralGateMinimumTokens;
    var boundarySignal =
      leadingFragment || trailingFragment || connectorEnding;
    var flags = [];
    if (
      structuralGateApplies &&
      distinctContentTokens.length <
        RECEIPT_COHERENCE_POLICY.minimumDistinctContentTokens &&
      (
        boundarySignal ||
        fillerTokenShare >= 0.2
      )
    ) {
      flags.push("thin-context");
    }
    if (
      structuralGateApplies &&
      repeatedTokenShare >
        RECEIPT_COHERENCE_POLICY.maximumRepeatedTokenShare &&
      (
        boundarySignal ||
        fillerTokenShare >= 0.2
      )
    ) {
      flags.push("repetition-loop");
    }
    if (
      structuralGateApplies &&
      fillerTokenShare >
        RECEIPT_COHERENCE_POLICY.maximumFillerTokenShare
    ) {
      flags.push("filler-heavy");
    }
    if (
      structuralGateApplies &&
      boundarySignal &&
      distinctContentTokens.length <
        RECEIPT_COHERENCE_POLICY.minimumDistinctContentTokens
    ) {
      flags.push("boundary-fragment");
    }
    var scorePass = score >= RECEIPT_COHERENCE_POLICY.minimumScore;
    return {
      policyVersion: RECEIPT_COHERENCE_POLICY.version,
      score: score,
      minimumScore: RECEIPT_COHERENCE_POLICY.minimumScore,
      eligibleForTopSlice: scorePass && flags.length === 0,
      languageNeutral: true,
      lexicalTokenCount: tokenCount,
      uniqueLexicalTokens: uniqueTokens.length,
      distinctContentTokens: distinctContentTokens.length,
      measures: {
        lexicalDiversity: round(lexicalDiversity, 2),
        contentDensity: round(contentDensity, 2),
        repetitionResistance: round(repetitionResistance, 2),
        repeatedTokenShare: round(repeatedTokenShare, 4),
        fillerTokenShare: round(fillerTokenShare, 4),
        boundaryCompleteness: round(boundaryCompleteness, 2),
        lengthSupport: round(lengthSupport, 2)
      },
      boundary: {
        leadingFragment: leadingFragment,
        trailingFragment: trailingFragment,
        connectorEnding: connectorEnding
      },
      flags: flags,
      interpretation:
        "Structural caption-receipt coherence only; not a claim about humor, taste, creator approval, or exact human-edited wording."
    };
  }

  function boundedExcerpt(value) {
    var words = clean(value).split(/\s+/).filter(Boolean);
    var truncated = words.length > EXCERPT_WORD_LIMIT;
    return {
      text: words.slice(0, EXCERPT_WORD_LIMIT).join(" ") + (truncated ? " …" : ""),
      wordCount: Math.min(words.length, EXCERPT_WORD_LIMIT),
      sourceWordCount: words.length,
      truncated: truncated
    };
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.round(number(seconds)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var remainder = String(total % 60).padStart(2, "0");
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + remainder
      : minutes + ":" + remainder;
  }

  function timestampUrl(url, seconds) {
    var base = clean(url)
      .replace(/([?&])t=\d+(?:\.\d+)?s?/gi, "")
      .replace(/[?&]$/, "");
    if (!/^https:\/\/www\.youtube\.com\/watch\?v=/.test(base)) return "";
    return base + "&t=" + Math.max(0, Math.round(number(seconds))) + "s";
  }

  function embedUrl(sourceId, start) {
    var from = Math.max(0, Math.round(number(start)));
    return (
      "https://www.youtube.com/embed/" +
      encodeURIComponent(clean(sourceId)) +
      "?start=" +
      from +
      "&end=" +
      (from + 16) +
      "&autoplay=1"
    );
  }

  function canonicalCategory(value) {
    var category = clean(value).toUpperCase();
    return category || "ARCHIVE MOMENT";
  }

  function inferFranchise(value) {
    var source = clean(value);
    var matches = FRANCHISE_RULES.filter(function (rule) {
      return rule.pattern.test(source);
    }).map(function (rule) {
      return rule.label;
    });
    if (matches.length > 1) return "Multi-franchise Horror";
    return matches[0] || "General Horror";
  }

  function sourceLane(sourceType, fallback) {
    var value = normalized(sourceType);
    if (value.indexOf("commentary") >= 0) return "commentary";
    if (value.indexOf("livestream") >= 0 || value.indexOf("live stream") >= 0) {
      return fallback || "livestream-archive";
    }
    return fallback || "archive";
  }

  function asInput(options) {
    var input = options && typeof options === "object" ? options : {};
    return {
      catalog: array(input.catalog || root.WWAM_CATALOG),
      deep: input.deep || root.WWAM_DEEP_DISTILL || {},
      live: input.live || root.WWAM_LIVESTREAMS || {},
      popular: input.popular || root.WWAM_POPULAR_LIVE || {},
      curation: input.curation || root.WWAM_CURATED || {},
      characters: input.characters || root.WWAM_CHARACTER_LORE || {},
      editorialVotes: input.editorialVotes || {},
      includeRecency: input.includeRecency === true,
      limit: Math.max(1, Math.floor(number(input.limit, DEFAULT_LIMIT)))
    };
  }

  function registerSource(sourceById, raw, lane, franchiseHint) {
    var id = clean(raw && (raw.id || raw.sourceId));
    if (!id) return null;
    var existing = sourceById.get(id);
    var topicText = array(raw && raw.topics)
      .map(function (topic) {
        return clean(topic && (topic.name || topic.label || topic));
      })
      .join(" ");
    var titleFranchise = inferFranchise(
      [raw && raw.title, raw && raw.film, raw && raw.sourceTitle].join(" ")
    );
    var franchise =
      clean(raw && raw.franchise) ||
      clean(franchiseHint) ||
      (titleFranchise !== "General Horror"
        ? titleFranchise
        : inferFranchise(topicText));
    var next = {
      id: id,
      title: clean(raw && (raw.title || raw.sourceTitle)) || id,
      date: clean(raw && raw.date),
      url:
        timestampUrl(clean(raw && raw.url), 0) ||
        "https://www.youtube.com/watch?v=" + encodeURIComponent(id),
      lane: clean(lane) || sourceLane(raw && raw.sourceType),
      lanes: unique([clean(lane), sourceLane(raw && raw.sourceType)].filter(Boolean)),
      franchise: franchise || "General Horror",
      captioned:
        raw && (raw.captioned === true || raw.transcript === true)
          ? true
          : raw && (raw.captioned === false || raw.transcript === false)
            ? false
            : null,
      duration: number(raw && raw.duration, 0)
    };
    if (!existing) {
      sourceById.set(id, next);
      return next;
    }
    existing.title = existing.title === existing.id && next.title !== next.id
      ? next.title
      : existing.title;
    existing.date = existing.date || next.date;
    existing.url = existing.url || next.url;
    existing.franchise =
      existing.franchise === "General Horror" && next.franchise !== "General Horror"
        ? next.franchise
        : existing.franchise;
    existing.captioned = existing.captioned === true || next.captioned === true
      ? true
      : existing.captioned === false && next.captioned === false
        ? false
        : null;
    existing.duration = existing.duration || next.duration;
    existing.lanes = unique(existing.lanes.concat(next.lanes));
    if (existing.lane === "popular-livestream" && next.lane === "recent-livestream") {
      existing.lane = "recent-livestream";
    }
    return existing;
  }

  function buildSources(input) {
    var sourceById = new Map();
    input.catalog.forEach(function (source) {
      registerSource(sourceById, source, "commentary", source.franchise);
    });
    array(input.live.streams).forEach(function (source) {
      registerSource(sourceById, source, "recent-livestream");
    });
    array(input.popular.streams).forEach(function (source) {
      registerSource(sourceById, source, "popular-livestream");
    });
    array(input.characters.characters)
      .concat(array(input.characters.lockedCandidates))
      .forEach(function (character) {
        array(character.soundbytes)
          .concat(array(character.creatorContext))
          .forEach(function (receipt) {
            registerSource(
              sourceById,
              receipt,
              sourceLane(receipt.sourceType, "livestream-archive")
            );
          });
      });
    return sourceById;
  }

  function contributionIdentity(contribution) {
    return [
      contribution.provider,
      normalized(contribution.quote),
      contribution.category,
      round(contribution.intensity, 2)
    ].join("|");
  }

  function receiptIdentity(sourceId, seconds) {
    return clean(sourceId) + "@" + Math.max(0, Math.round(number(seconds)));
  }

  function addContribution(candidateByKey, sourceById, raw) {
    var sourceId = clean(raw && (raw.sourceId || raw.tapeId || raw.id));
    var at = number(raw && (raw.t == null ? raw.at : raw.t), -1);
    var quote = clean(raw && (raw.quote || raw.excerpt));
    if (!sourceId || at < 0 || countWords(quote) < 2) return false;
    var source = sourceById.get(sourceId);
    if (!source) {
      source = registerSource(
        sourceById,
        {
          sourceId: sourceId,
          sourceTitle: raw.sourceTitle,
          date: raw.date,
          url: raw.url,
          sourceType: raw.sourceType
        },
        sourceLane(raw.sourceType, "archive")
      );
    }
    var url = timestampUrl((source && source.url) || raw.url, at);
    if (!url) return false;
    var key = receiptIdentity(sourceId, at);
    if (!candidateByKey.has(key)) {
      candidateByKey.set(key, {
        internalKey: key,
        sourceId: sourceId,
        t: at,
        source: source,
        contributions: [],
        curationLabels: [],
        selectionSources: [],
        preselectedCandidate: false,
        humanCurated: false,
        characterGrounded: false,
        lockedCharacterCandidate: false
      });
    }
    var candidate = candidateByKey.get(key);
    var preselectedCandidate =
      raw.preselectedCandidate === true || raw.humanCurated === true;
    var selectionSource = clean(raw.selectionSource) || (
      preselectedCandidate
        ? raw.provider === "curated-up-in-ya"
          ? "WWAM UP IN YA preselected candidate list"
          : "character-performance preselected candidate list"
        : ""
    );
    candidate.contributions.push({
      provider: clean(raw.provider) || "archive",
      quote: quote,
      category: canonicalCategory(raw.category),
      intensity: clamp(raw.intensity, 0, 100),
      confidence: clamp(raw.confidence == null ? 0.82 : raw.confidence, 0, 1),
      preselectedCandidate: preselectedCandidate,
      humanCurated: preselectedCandidate,
      selectionSource: selectionSource,
      characterGrounded: raw.characterGrounded === true,
      lockedCharacterCandidate: raw.lockedCharacterCandidate === true,
      originalId: clean(raw.originalId),
      sourceRank: number(raw.sourceRank, 0)
    });
    candidate.preselectedCandidate =
      candidate.preselectedCandidate || preselectedCandidate;
    candidate.humanCurated = candidate.preselectedCandidate;
    if (selectionSource) candidate.selectionSources.push(selectionSource);
    candidate.characterGrounded =
      candidate.characterGrounded || raw.characterGrounded === true;
    candidate.lockedCharacterCandidate =
      candidate.lockedCharacterCandidate || raw.lockedCharacterCandidate === true;
    return true;
  }

  function ingestDeep(input, candidateByKey, sourceById) {
    array(input.deep.tapes).forEach(function (tape) {
      array(tape.moments).forEach(function (moment) {
        addContribution(candidateByKey, sourceById, {
          sourceId: tape.id,
          t: moment.t,
          quote: moment.quote,
          category: moment.category,
          intensity: moment.score,
          confidence: 0.86,
          provider: "deep-moment",
          originalId: moment.id
        });
      });
    });
    array(input.deep.hot100).forEach(function (moment) {
      addContribution(candidateByKey, sourceById, {
        sourceId: moment.tapeId || moment.sourceId,
        t: moment.t,
        quote: moment.quote,
        category: moment.category,
        intensity: moment.score,
        confidence: 0.88,
        provider: "deep-hot100",
        originalId: moment.id,
        sourceRank: moment.rank
      });
    });
  }

  function ingestStreams(streams, provider, lane, candidateByKey, sourceById) {
    array(streams).forEach(function (stream) {
      registerSource(sourceById, stream, lane);
      array(stream.moments).forEach(function (moment) {
        addContribution(candidateByKey, sourceById, {
          sourceId: stream.id,
          t: moment.t,
          quote: moment.quote,
          category: moment.category,
          intensity: moment.heat,
          confidence: 0.84,
          provider: provider,
          originalId: clean(moment.id)
        });
      });
    });
  }

  function preselectedSelection(receipt) {
    return normalized(
      receipt &&
      receipt.provenance &&
      receipt.provenance.selection
    ).indexOf("human curated") >= 0;
  }

  function ingestCharacters(input, candidateByKey, sourceById) {
    array(input.characters.characters).forEach(function (character) {
      array(character.soundbytes).forEach(function (receipt) {
        addContribution(candidateByKey, sourceById, {
          sourceId: receipt.sourceId,
          sourceTitle: receipt.sourceTitle,
          sourceType: receipt.sourceType,
          date: receipt.date,
          url: receipt.url,
          t: receipt.t,
          quote: receipt.excerpt,
          category: "CHARACTER CALLBACK",
          intensity: 96,
          confidence: receipt.confidence,
          provider: "character-soundbyte",
          preselectedCandidate: preselectedSelection(receipt),
          selectionSource: "character-performance preselected candidate list",
          characterGrounded: true,
          originalId: receipt.id
        });
      });
      array(character.creatorContext).forEach(function (receipt) {
        addContribution(candidateByKey, sourceById, {
          sourceId: receipt.sourceId,
          sourceTitle: receipt.sourceTitle,
          sourceType: receipt.sourceType,
          date: receipt.date,
          url: receipt.url,
          t: receipt.t,
          quote: receipt.excerpt,
          category: "CHARACTER CALLBACK",
          intensity: 88,
          confidence: receipt.confidence,
          provider: "character-context",
          preselectedCandidate: preselectedSelection(receipt),
          selectionSource: "character-context preselected candidate list",
          characterGrounded: true,
          originalId: receipt.id
        });
      });
    });
    array(input.characters.lockedCandidates).forEach(function (character) {
      array(character.soundbytes).forEach(function (receipt) {
        addContribution(candidateByKey, sourceById, {
          sourceId: receipt.sourceId,
          sourceTitle: receipt.sourceTitle,
          sourceType: receipt.sourceType,
          date: receipt.date,
          url: receipt.url,
          t: receipt.t,
          quote: receipt.excerpt,
          category: "CHARACTER CALLBACK",
          intensity: 82,
          confidence: receipt.confidence,
          provider: "character-soundbyte",
          preselectedCandidate: preselectedSelection(receipt),
          selectionSource: "unverified-character preselected candidate list",
          characterGrounded: true,
          lockedCharacterCandidate: true,
          originalId: receipt.id
        });
      });
    });
  }

  function nearestCandidate(candidateByKey, sourceId, at) {
    var exact = candidateByKey.get(receiptIdentity(sourceId, at));
    if (exact) return exact;
    var best = null;
    candidateByKey.forEach(function (candidate) {
      if (candidate.sourceId !== sourceId) return;
      var distance = Math.abs(number(candidate.t) - number(at));
      if (distance > 2) return;
      if (!best || distance < best.distance) best = { candidate: candidate, distance: distance };
    });
    return best && best.candidate;
  }

  function applyCuration(input, candidateByKey) {
    var matched = 0;
    var unmatched = [];
    array(input.curation.upInYa).forEach(function (curated) {
      var candidate = nearestCandidate(candidateByKey, clean(curated.id), number(curated.t));
      if (!candidate) {
        unmatched.push({
          sourceId: clean(curated.id),
          t: number(curated.t),
          label: clean(curated.label)
        });
        return;
      }
      matched += 1;
      candidate.preselectedCandidate = true;
      candidate.humanCurated = true;
      candidate.selectionSources.push("WWAM UP IN YA preselected candidate list");
      candidate.curationLabels.push(clean(curated.label));
      candidate.contributions.push({
        provider: "curated-up-in-ya",
        quote: "",
        category: "UP IN YA",
        intensity: 98,
        confidence: 0.96,
        preselectedCandidate: true,
        humanCurated: true,
        selectionSource: "WWAM UP IN YA preselected candidate list",
        characterGrounded: false,
        lockedCharacterCandidate: false,
        originalId: clean(curated.label),
        sourceRank: 0
      });
    });
    return { matched: matched, unmatched: unmatched };
  }

  function patternScore(value, patterns) {
    var text = clean(value);
    return array(patterns).reduce(function (total, item) {
      var matches = text.match(item.pattern);
      return total + (matches ? matches.length * item.weight : 0);
    }, 0);
  }

  function languageSignals(value) {
    var text = clean(value);
    var byLane = {};
    var raw = 0;
    LANGUAGE_PATTERNS.forEach(function (item) {
      var matches = text.match(item.pattern);
      var count = matches ? matches.length : 0;
      if (!count) return;
      byLane[item.lane] = (byLane[item.lane] || 0) + count;
      raw += count * item.weight;
    });
    return { raw: raw, byLane: byLane };
  }

  function selectPrimary(contributions) {
    var withQuotes = array(contributions).filter(function (contribution) {
      return countWords(contribution.quote) >= 2;
    });
    return stableSort(withQuotes, function (left, right) {
      return (
        Number(right.humanCurated) - Number(left.humanCurated) ||
        Number(right.characterGrounded) - Number(left.characterGrounded) ||
        number(right.confidence) - number(left.confidence) ||
        number(right.intensity) - number(left.intensity) ||
        countWords(right.quote) - countWords(left.quote) ||
        number(PROVIDER_PRIORITY[right.provider]) - number(PROVIDER_PRIORITY[left.provider]) ||
        fingerprint(
          normalized(left.quote) + "|" + left.category + "|" + left.provider
        ).localeCompare(
          fingerprint(normalized(right.quote) + "|" + right.category + "|" + right.provider)
        )
      );
    })[0];
  }

  function categoryBaseline(contributions, primary) {
    var categories = array(contributions)
      .map(function (contribution) {
        return contribution.category;
      })
      .filter(Boolean);
    var baseline = categories.reduce(function (maximum, category) {
      return Math.max(maximum, number(CATEGORY_BASELINES[category], 50));
    }, number(CATEGORY_BASELINES[primary.category], 50));
    var observed = array(contributions).reduce(function (maximum, contribution) {
      return Math.max(maximum, number(contribution.intensity));
    }, 0);
    return round(baseline * 0.58 + observed * 0.42, 3);
  }

  function categoryBonus(category, mapping) {
    return number(mapping[canonicalCategory(category)], 0);
  }

  function loreRaw(candidate, text, categories) {
    var score = candidate.characterGrounded ? 12 : 0;
    LORE_PATTERNS.forEach(function (pattern) {
      if (pattern.test(text)) score += 3;
    });
    categories.forEach(function (category) {
      score += categoryBonus(category, {
        "CHARACTER CALLBACK": 8,
        "BIT ENERGY": 4,
        "THEORY BOARD": 3,
        "HORROR BRAIN": 2
      });
    });
    if (candidate.curationLabels.length) score += 2;
    return score;
  }

  function roomRaw(text, categories) {
    var score = patternScore(text, ROOM_BREAK_PATTERNS);
    categories.forEach(function (category) {
      score += categoryBonus(category, {
        "THE ROOM BREAKS": 12,
        BREAKDOWN: 8,
        "CHAT DID THIS": 5,
        "FULL SEND": 2
      });
    });
    return score;
  }

  function languageRaw(text, categories) {
    var signals = languageSignals(text);
    categories.forEach(function (category) {
      signals.raw += categoryBonus(category, {
        "TAKE GETS NUCLEAR": 6,
        "KILL ROOM": 5,
        "FRANCHISE FELONY": 4,
        "OUT OF POCKET": 3,
        "UP IN YA": 3,
        "FULL SEND": 2
      });
    });
    return signals;
  }

  function readEditorialVote(votes, key) {
    var raw = votes && Object.prototype.hasOwnProperty.call(votes, key) ? votes[key] : 0;
    var value = raw && typeof raw === "object" ? raw.vote : raw;
    return clamp(value, EDITORIAL_VOTE_MIN, EDITORIAL_VOTE_MAX);
  }

  function buildPool(input, sourceById, candidateByKey) {
    var sourceCounts = {};
    var laneCounts = {};
    var franchiseCounts = {};
    candidateByKey.forEach(function (candidate) {
      sourceCounts[candidate.sourceId] = (sourceCounts[candidate.sourceId] || 0) + 1;
      laneCounts[candidate.source.lane] = (laneCounts[candidate.source.lane] || 0) + 1;
      franchiseCounts[candidate.source.franchise] =
        (franchiseCounts[candidate.source.franchise] || 0) + 1;
    });
    var pool = [];
    candidateByKey.forEach(function (candidate) {
      var primary = selectPrimary(candidate.contributions);
      if (!primary) return;
      var excerpt = boundedExcerpt(primary.quote);
      var url = timestampUrl(candidate.source.url, candidate.t);
      if (!url || excerpt.wordCount < 2) return;
      var categories = unique(
        candidate.contributions
          .map(function (contribution) {
            return contribution.category;
          })
          .filter(Boolean)
      );
      var providerIdentities = unique(
        candidate.contributions.map(contributionIdentity)
      );
      var providers = unique(
        candidate.contributions
          .map(function (contribution) {
            return contribution.provider;
          })
          .filter(Boolean)
      );
      var highestConfidence = candidate.contributions.reduce(function (maximum, contribution) {
        return Math.max(maximum, number(contribution.confidence));
      }, 0);
      var language = languageRaw(primary.quote + " " + categories.join(" "), categories);
      var explicitLexical = explicitLexicalSignals(excerpt.text);
      var duplicateTokens = nearDuplicateTokens(excerpt.text);
      var coherence = receiptCoherence(excerpt.text, excerpt);
      var evidenceRaw =
        64 +
        highestConfidence * 20 +
        Math.min(3, Math.max(0, providers.length - 1)) * 4 +
        (candidate.source.captioned === true ? 5 : 0) +
        (candidate.preselectedCandidate ? 3 : 0) -
        (candidate.lockedCharacterCandidate ? 13 : 0) -
        (/â€¦|�/.test(primary.quote) ? 4 : 0);
      var diversityRaw =
        1000 / Math.max(1, sourceCounts[candidate.sourceId]) +
        350 / Math.max(1, laneCounts[candidate.source.lane]) +
        250 / Math.max(1, franchiseCounts[candidate.source.franchise]);
      var voteKey = receiptIdentity(candidate.sourceId, candidate.t);
      var vote = readEditorialVote(input.editorialVotes, voteKey);
      var tieMaterial = [
        normalized(primary.quote),
        primary.category,
        candidate.source.date,
        Math.round(candidate.t),
        normalized(candidate.source.title)
      ].join("|");
      pool.push({
        internalKey: candidate.internalKey,
        sourceId: candidate.sourceId,
        tapeId: candidate.sourceId,
        t: candidate.t,
        timestamp: candidate.t,
        timecode: formatTime(candidate.t),
        sourceTitle: candidate.source.title,
        sourceDate: candidate.source.date,
        sourceCaptioned: candidate.source.captioned,
        lane: candidate.source.lane,
        sourceLanes: candidate.source.lanes,
        franchise: candidate.source.franchise,
        category: primary.category,
        categories: categories,
        quote: excerpt.text,
        excerpt: excerpt,
        url: url,
        playback: {
          provider: "youtube",
          start: candidate.t,
          end: candidate.t + 16,
          clipSeconds: 16,
          embedUrl: embedUrl(candidate.sourceId, candidate.t)
        },
        providers: providers,
        contributionCount: candidate.contributions.length,
        distinctContributionCount: providerIdentities.length,
        curationLabels: unique(candidate.curationLabels),
        selectionSources: unique(candidate.selectionSources),
        preselectedCandidate: candidate.preselectedCandidate,
        humanCurated: candidate.preselectedCandidate,
        characterGrounded: candidate.characterGrounded,
        lockedCharacterCandidate: candidate.lockedCharacterCandidate,
        editorialVoteKey: voteKey,
        editorialVote: vote,
        rawSignals: {
          categoryIntensity: categoryBaseline(candidate.contributions, primary),
          roomBreak: roomRaw(primary.quote, categories),
          languageVoltage: language.raw,
          loreCallback: loreRaw(candidate, primary.quote, categories),
          humanCuration:
            (candidate.preselectedCandidate ? 10 : 0) +
            (candidate.curationLabels.length ? 4 : 0) +
            (candidate.characterGrounded ? 2 : 0),
          sourceDiversity: diversityRaw,
          evidence: clamp(evidenceRaw, 0, 100),
          recency: candidate.source.date
            ? number(candidate.source.date.replace(/-/g, ""), 0)
            : 0
        },
        languageLanes: language.byLane,
        diversitySignals: {
          explicitBodyOrSexualLexical: explicitLexical.hit,
          explicitBodyOrSexualLexicalCount: explicitLexical.count,
          explicitBodyOrSexualFamilies: explicitLexical.families,
          nearDuplicateTokens: duplicateTokens,
          nearDuplicateSignature: fingerprint(duplicateTokens.join("|")),
          receiptCoherence: coherence,
          sourceCandidateCount: sourceCounts[candidate.sourceId],
          laneCandidateCount: laneCounts[candidate.source.lane],
          franchiseCandidateCount: franchiseCounts[candidate.source.franchise]
        },
        tieBreaker: {
          contentFingerprint: fingerprint(tieMaterial),
          identityFingerprint: fingerprint(tieMaterial + "|" + fingerprint(candidate.sourceId)),
          policy:
            "score → evidence → preselection signal → category → diversity → content fingerprint → opaque identity hash only for otherwise identical receipts"
        }
      });
    });
    return pool;
  }

  function percentileTable(pool, signal, allowZero) {
    var values = pool
      .map(function (candidate) {
        return number(candidate.rawSignals[signal]);
      })
      .filter(function (value) {
        return allowZero ? value >= 0 : value > 0;
      })
      .sort(function (left, right) {
        return left - right;
      });
    return function (raw) {
      var value = number(raw);
      if (!values.length || (!allowZero && value <= 0)) return 0;
      var atOrBelow = values.reduce(function (count, candidateValue) {
        return count + (candidateValue <= value ? 1 : 0);
      }, 0);
      return round((atOrBelow / values.length) * 100, 2);
    };
  }

  function languageLaneDetail(candidate) {
    var labels = stableSort(
      Object.keys(candidate.languageLanes || {}).map(function (lane) {
        return {
          lane: lane,
          count: number(candidate.languageLanes[lane])
        };
      }),
      function (left, right) {
        return (
          right.count - left.count ||
          left.lane.localeCompare(right.lane)
        );
      }
    );
    return labels.map(function (item) {
      return item.count + " " + item.lane + " hit" + (item.count === 1 ? "" : "s");
    }).join(", ");
  }

  function reasonFor(component, candidate, scoredComponent) {
    var raw = round(scoredComponent && scoredComponent.raw, 2);
    var percentile = round(scoredComponent && scoredComponent.percentile, 2);
    if (component === "categoryIntensity") {
      return (
        candidate.category +
        " contributes a " +
        raw +
        "/100 intensity signal (" +
        percentile +
        "th percentile in this candidate pool)."
      );
    }
    if (component === "roomBreak") {
      return (
        "Room-reaction signal is " +
        raw +
        " (" +
        percentile +
        "th percentile), from bounded transcript wording and/or the " +
        candidate.category +
        " category prior."
      );
    }
    if (component === "languageVoltage") {
      var lanes = languageLaneDetail(candidate);
      return lanes
        ? "Bounded-text voltage includes " + lanes + "; scored raw " + raw + "."
        : candidate.category +
            " supplies the language-voltage prior; no explicit lexical hit is required.";
    }
    if (component === "loreCallback") {
      return candidate.characterGrounded
        ? "Character-candidate evidence supplies a " +
            raw +
            " callback signal; performer attribution still follows its separate provenance."
        : "Horror-name/category callback signal is " + raw + " for this bounded receipt.";
    }
    if (component === "humanCuration") {
      var source =
        candidate.selectionSources[0] || "a preselected candidate list";
      var label = candidate.curationLabels[0]
        ? ' (“' + shortText(candidate.curationLabels[0], 42) + '”)'
        : "";
      return (
        "Preselection signal comes from " +
        source +
        label +
        "; it is not an authenticated creator or editor vote."
      );
    }
    return (
      shortText(candidate.sourceTitle, 58) +
      " contributes " +
      candidate.diversitySignals.sourceCandidateCount +
      " candidate receipts to the current pool; source scarcity scores " +
      raw +
      "."
    );
  }

  function receiptAnchorReason(candidate) {
    return (
      "Receipt anchor: " +
      shortText(candidate.sourceTitle, 54) +
      " at " +
      candidate.timecode +
      ", backed by " +
      candidate.providers.length +
      " indexed provider" +
      (candidate.providers.length === 1 ? "" : "s") +
      "; speaker remains undiarized."
    );
  }

  function scorePool(pool, input) {
    var percentiles = {};
    Object.keys(SCORE_WEIGHTS).forEach(function (signal) {
      percentiles[signal] = percentileTable(pool, signal, false);
    });
    percentiles.evidence = percentileTable(pool, "evidence", true);
    percentiles.recency = percentileTable(pool, "recency", false);
    pool.forEach(function (candidate) {
      var scoreComponents = {};
      var baseScore = 0;
      Object.keys(SCORE_WEIGHTS).forEach(function (signal) {
        var percentile = percentiles[signal](candidate.rawSignals[signal]);
        var points = percentile * SCORE_WEIGHTS[signal];
        scoreComponents[signal] = {
          raw: round(candidate.rawSignals[signal], 3),
          percentile: percentile,
          weight: SCORE_WEIGHTS[signal],
          points: round(points, 2)
        };
        baseScore += points;
      });
      var evidencePercentile = percentiles.evidence(candidate.rawSignals.evidence);
      var evidenceModifier = 0.75 + (evidencePercentile / 100) * 0.25;
      var editorialAdjustment = candidate.editorialVote * 1.5;
      var recencyPercentile = input.includeRecency
        ? percentiles.recency(candidate.rawSignals.recency)
        : 0;
      var recencyAdjustment = input.includeRecency
        ? (recencyPercentile - 50) * 0.06
        : 0;
      var finalScore = clamp(
        baseScore * evidenceModifier + editorialAdjustment + recencyAdjustment,
        0,
        100
      );
      scoreComponents.evidenceModifier = {
        raw: round(candidate.rawSignals.evidence, 2),
        percentile: evidencePercentile,
        multiplier: round(evidenceModifier, 4),
        label: "EVIDENCE / UNCERTAINTY MODIFIER"
      };
      scoreComponents.recency = {
        enabled: input.includeRecency,
        raw: input.includeRecency ? candidate.rawSignals.recency : 0,
        percentile: recencyPercentile,
        adjustment: round(recencyAdjustment, 2),
        label: input.includeRecency
          ? "RECENCY BOOST (EXPLICITLY ENABLED)"
          : "RECENCY EXCLUDED"
      };
      scoreComponents.editorialVote = {
        vote: candidate.editorialVote,
        minimum: EDITORIAL_VOTE_MIN,
        maximum: EDITORIAL_VOTE_MAX,
        adjustment: round(editorialAdjustment, 2),
        source:
          candidate.editorialVote === 0
            ? "ZERO DEFAULT · NO EDITORIAL VOTE SUPPLIED"
            : "SUPPLIED EDITORIAL VOTE"
      };
      var rankedReasons = stableSort(
        Object.keys(SCORE_WEIGHTS).map(function (signal) {
          return {
            signal: signal,
            points: scoreComponents[signal].points,
            reason: reasonFor(signal, candidate, scoreComponents[signal])
          };
        }),
        function (left, right) {
          return (
            right.points - left.points ||
            fingerprint(left.signal).localeCompare(fingerprint(right.signal))
          );
        }
      );
      var why = rankedReasons
        .filter(function (entry) {
          return entry.points > 0;
        })
        .slice(0, 2)
        .map(function (entry) {
          return entry.reason;
        });
      why.push(receiptAnchorReason(candidate));
      if (candidate.editorialVote) {
        why.push(
          "A supplied editorial vote applies a transparent " +
          (editorialAdjustment >= 0 ? "+" : "") +
          round(editorialAdjustment, 2) +
          "-point adjustment."
        );
      }
      candidate.score = round(finalScore, 2);
      candidate.confidence = round(candidate.rawSignals.evidence / 100, 3);
      candidate.confidenceLabel =
        candidate.rawSignals.evidence >= 92
          ? "HIGH RECEIPT CONFIDENCE"
          : candidate.rawSignals.evidence >= 80
            ? "SUPPORTED RECEIPT"
            : "BOUNDED / REVIEW ADVISED";
      candidate.scoreComponents = scoreComponents;
      candidate.whyMemorable = why;
      candidate.whyMemorableSummary = why.join(" ");
      candidate.basis = [
        "Playable YouTube timestamp",
        candidate.excerpt.truncated
          ? "Caption excerpt bounded to " + EXCERPT_WORD_LIMIT + " words"
          : "Caption excerpt within " + EXCERPT_WORD_LIMIT + "-word boundary",
        "Receipt-coherence check " +
          candidate.diversitySignals.receiptCoherence.score +
          "/100; structural and language-neutral, not a comedy verdict",
        candidate.providers.length +
          " indexed evidence provider" +
          (candidate.providers.length === 1 ? "" : "s"),
        candidate.preselectedCandidate
          ? "Preselected candidate input present; no authenticated creator/editor vote claimed"
          : "No preselected-candidate input claimed",
        "Speaker not diarized; no host-authorship or true-origin claim"
      ];
      candidate.uncertainty = {
        score: round(100 - candidate.rawSignals.evidence, 2),
        label:
          candidate.rawSignals.evidence >= 92
            ? "LOW"
            : candidate.rawSignals.evidence >= 80
              ? "MODERATE"
              : "REVIEW",
        reasons: unique(
          [
            candidate.lockedCharacterCandidate
              ? "Character performer remains unverified."
              : "",
            candidate.providers.length === 1
              ? "Only one indexed provider contributes to this receipt."
              : "",
            candidate.sourceCaptioned === true
              ? ""
              : "Caption availability is not affirmatively recorded on the source.",
            candidate.diversitySignals.receiptCoherence.eligibleForTopSlice
              ? ""
              : "Bounded excerpt is playable but does not clear the machine receipt-coherence showcase gate."
          ].filter(Boolean)
        )
      };
    });
    return pool;
  }

  function compareRank(left, right) {
    return (
      right.score - left.score ||
      right.scoreComponents.evidenceModifier.percentile -
        left.scoreComponents.evidenceModifier.percentile ||
      right.scoreComponents.humanCuration.percentile -
        left.scoreComponents.humanCuration.percentile ||
      right.scoreComponents.categoryIntensity.percentile -
        left.scoreComponents.categoryIntensity.percentile ||
      right.scoreComponents.sourceDiversity.percentile -
        left.scoreComponents.sourceDiversity.percentile ||
      left.tieBreaker.contentFingerprint.localeCompare(
        right.tieBreaker.contentFingerprint
      ) ||
      left.tieBreaker.identityFingerprint.localeCompare(
        right.tieBreaker.identityFingerprint
      )
    );
  }

  function nearestSelectedDuplicate(candidate, selected) {
    var best = null;
    array(selected).forEach(function (other) {
      var similarity = tokenSimilarity(
        candidate.diversitySignals.nearDuplicateTokens,
        other.diversitySignals.nearDuplicateTokens
      );
      if (similarity < TOP_SLICE_POLICY.maximumNearDuplicateSimilarity) return;
      if (
        !best ||
        similarity > best.similarity ||
        (
          similarity === best.similarity &&
          other.tieBreaker.contentFingerprint.localeCompare(
            best.candidate.tieBreaker.contentFingerprint
          ) < 0
        )
      ) {
        best = { candidate: other, similarity: similarity };
      }
    });
    return best;
  }

  function coherenceViolationReasons(candidate) {
    var coherence = candidate.diversitySignals.receiptCoherence;
    if (!coherence || coherence.eligibleForTopSlice) return [];
    var reasons = [];
    if (coherence.score < RECEIPT_COHERENCE_POLICY.minimumScore) {
      reasons.push(
        "receipt-coherence-score:" +
        coherence.score.toFixed(2) +
        "<" +
        RECEIPT_COHERENCE_POLICY.minimumScore
      );
    }
    coherence.flags.forEach(function (flag) {
      reasons.push("receipt-coherence:" + flag);
    });
    return reasons;
  }

  function topSliceViolations(candidate, selected, counts, includeCoherence) {
    var reasons = [];
    if (includeCoherence !== false) {
      reasons = reasons.concat(coherenceViolationReasons(candidate));
    }
    if (
      number(counts.categories[candidate.category]) >=
      TOP_SLICE_POLICY.maximumPerCategory
    ) {
      reasons.push("category-cap:" + candidate.category);
    }
    if (
      candidate.diversitySignals.explicitBodyOrSexualLexical &&
      counts.explicitBodyOrSexualLexical >=
        TOP_SLICE_POLICY.maximumExplicitBodyOrSexualLexical
    ) {
      reasons.push("explicit-body-or-sexual-lexical-cap");
    }
    if (
      candidate.preselectedCandidate &&
      counts.preselectedCandidates >= TOP_SLICE_POLICY.maximumPreselectedCandidates
    ) {
      reasons.push("preselected-candidate-cap");
    }
    if (
      number(counts.sources[candidate.sourceId]) >= TOP_SLICE_POLICY.maximumPerSource
    ) {
      reasons.push("source-cap:" + candidate.sourceId);
    }
    var duplicate = nearestSelectedDuplicate(candidate, selected);
    if (duplicate) {
      reasons.push(
        "near-duplicate:" +
        duplicate.candidate.tieBreaker.contentFingerprint +
        ":" +
        duplicate.similarity.toFixed(2)
      );
    }
    return reasons;
  }

  function strictTopSliceSelection(rankedPool, target, horizon, includeCoherence) {
    var selected = [];
    var counts = {
      categories: {},
      sources: {},
      explicitBodyOrSexualLexical: 0,
      preselectedCandidates: 0
    };
    for (var index = 0; index < horizon && selected.length < target; index += 1) {
      var candidate = rankedPool[index];
      var violations = topSliceViolations(
        candidate,
        selected,
        counts,
        includeCoherence
      );
      if (violations.length) continue;
      selected.push(candidate);
      addTopSliceCount(candidate, counts);
    }
    return selected;
  }

  function coherenceSelectionSummary(candidates) {
    var values = array(candidates);
    var scores = values.map(function (candidate) {
      return candidate.diversitySignals.receiptCoherence.score;
    });
    var failed = values.filter(function (candidate) {
      return !candidate.diversitySignals.receiptCoherence.eligibleForTopSlice;
    });
    return {
      candidates: values.length,
      eligible: values.length - failed.length,
      failed: failed.length,
      meanScore: scores.length
        ? round(
            scores.reduce(function (total, score) {
              return total + score;
            }, 0) / scores.length,
            2
          )
        : 0,
      minimumScore: scores.length ? round(Math.min.apply(null, scores), 2) : 0,
      failedReceipts: failed.map(function (candidate) {
        return {
          receiptKey: candidate.internalKey,
          score: candidate.diversitySignals.receiptCoherence.score,
          flags: candidate.diversitySignals.receiptCoherence.flags
        };
      })
    };
  }

  function addTopSliceCount(candidate, counts) {
    counts.categories[candidate.category] =
      number(counts.categories[candidate.category]) + 1;
    counts.sources[candidate.sourceId] =
      number(counts.sources[candidate.sourceId]) + 1;
    if (candidate.diversitySignals.explicitBodyOrSexualLexical) {
      counts.explicitBodyOrSexualLexical += 1;
    }
    if (candidate.preselectedCandidate) counts.preselectedCandidates += 1;
  }

  function applyTopSliceDiversity(rankedPool, requestedLimit) {
    var target = Math.min(
      TOP_SLICE_POLICY.window,
      Math.max(0, Math.floor(number(requestedLimit))),
      rankedPool.length
    );
    var horizon = Math.min(
      rankedPool.length,
      Math.max(
        target,
        TOP_SLICE_POLICY.window * TOP_SLICE_POLICY.candidateHorizonMultiplier
      )
    );
    var beforeCoherenceGate = strictTopSliceSelection(
      rankedPool,
      target,
      horizon,
      false
    );
    var selected = [];
    var selectedKeys = new Set();
    var deferredReasons = new Map();
    var counts = {
      categories: {},
      sources: {},
      explicitBodyOrSexualLexical: 0,
      preselectedCandidates: 0
    };

    rankedPool.forEach(function (candidate, index) {
      candidate.diversityControl = {
        policyVersion: "top-slice-diversity/v2",
        baselineRank: index + 1,
        finalRank: null,
        rankMovement: 0,
        selectedInTopSlice: false,
        strictPolicyPass: false,
        constraintRelaxed: false,
        deferredFromTopSlice: false,
        deferralReasons: []
      };
    });

    for (var index = 0; index < horizon && selected.length < target; index += 1) {
      var candidate = rankedPool[index];
      var violations = topSliceViolations(candidate, selected, counts);
      if (violations.length) {
        deferredReasons.set(candidate.internalKey, violations);
        continue;
      }
      selected.push(candidate);
      selectedKeys.add(candidate.internalKey);
      addTopSliceCount(candidate, counts);
      candidate.diversityControl.selectedInTopSlice = true;
      candidate.diversityControl.strictPolicyPass = true;
    }

    if (selected.length < target) {
      rankedPool.some(function (candidate) {
        if (selected.length >= target) return true;
        if (selectedKeys.has(candidate.internalKey)) return false;
        var violations =
          deferredReasons.get(candidate.internalKey) ||
          topSliceViolations(candidate, selected, counts);
        selected.push(candidate);
        selectedKeys.add(candidate.internalKey);
        addTopSliceCount(candidate, counts);
        candidate.diversityControl.selectedInTopSlice = true;
        candidate.diversityControl.constraintRelaxed = violations.length > 0;
        candidate.diversityControl.deferralReasons = violations;
        return false;
      });
    }

    var ordered = selected.concat(
      rankedPool.filter(function (candidate) {
        return !selectedKeys.has(candidate.internalKey);
      })
    );
    ordered.forEach(function (candidate, index) {
      var control = candidate.diversityControl;
      control.finalRank = index + 1;
      control.rankMovement = control.baselineRank - control.finalRank;
      if (
        !control.selectedInTopSlice &&
        deferredReasons.has(candidate.internalKey)
      ) {
        control.deferredFromTopSlice = true;
        control.deferralReasons = deferredReasons.get(candidate.internalKey);
      }
    });

    return {
      ordered: ordered,
      diagnostics: {
        policyVersion: "top-slice-diversity/v2",
        window: target,
        candidateHorizon: horizon,
        caps: serialCopy(TOP_SLICE_POLICY),
        selectedUnderStrictPolicy: selected.filter(function (candidate) {
          return candidate.diversityControl.strictPolicyPass;
        }).length,
        selectedAfterConstraintRelaxation: selected.filter(function (candidate) {
          return candidate.diversityControl.constraintRelaxed;
        }).length,
        candidatesDeferredFromTopSlice: deferredReasons.size,
        candidatesDeferredForReceiptCoherence: Array.from(
          deferredReasons.values()
        ).filter(function (reasons) {
          return reasons.some(function (reason) {
            return reason.indexOf("receipt-coherence") === 0;
          });
        }).length,
        explicitBodyOrSexualLexicalCount:
          counts.explicitBodyOrSexualLexical,
        preselectedCandidateCount: counts.preselectedCandidates,
        categoryDistribution: distribution(
          selected.map(function (candidate) {
            return candidate.category;
          })
        ),
        uniqueCategories: new Set(
          selected.map(function (candidate) {
            return candidate.category;
          })
        ).size,
        uniqueSources: new Set(
          selected.map(function (candidate) {
            return candidate.sourceId;
          })
        ).size,
        receiptCoherence: {
          policy: serialCopy(RECEIPT_COHERENCE_POLICY),
          beforeGate: coherenceSelectionSummary(beforeCoherenceGate),
          afterGate: coherenceSelectionSummary(selected),
          interpretation:
            "Before-gate is the same deterministic diversity selection with only the receipt-coherence check disabled. After-gate is the published Top-25 selection. This comparison measures caption-fragment fitness, not comedy quality."
        },
        interpretation:
          "Raw machine scores are computed first. The first 25 candidate positions then use a deterministic receipt-coherence gate plus caps for category repetition, explicit body/sexual lexical repetition, preselected-candidate repetition, source repetition, and near-duplicate transcript wording. Deferred candidates remain eligible for ranks 26-100; constraints relax only when the archive cannot fill the window."
      }
    };
  }

  function publicRanking(candidate, rank) {
    return {
      rank: rank,
      rankKey:
        "red-band-v2:" + rank + ":" + candidate.tieBreaker.identityFingerprint,
      id: candidate.internalKey,
      tapeId: candidate.tapeId,
      sourceId: candidate.sourceId,
      t: candidate.t,
      timestamp: candidate.timestamp,
      timecode: candidate.timecode,
      sourceTitle: candidate.sourceTitle,
      sourceDate: candidate.sourceDate,
      lane: candidate.lane,
      sourceLanes: candidate.sourceLanes,
      franchise: candidate.franchise,
      category: candidate.category,
      categories: candidate.categories,
      quote: candidate.quote,
      excerpt: candidate.quote,
      excerptWordCount: candidate.excerpt.wordCount,
      excerptSourceWordCount: candidate.excerpt.sourceWordCount,
      excerptWordLimit: EXCERPT_WORD_LIMIT,
      excerptTruncated: candidate.excerpt.truncated,
      url: candidate.url,
      playback: candidate.playback,
      score: candidate.score,
      confidence: candidate.confidence,
      confidenceLabel: candidate.confidenceLabel,
      basis: candidate.basis,
      scoreComponents: candidate.scoreComponents,
      whyMemorable: candidate.whyMemorable,
      whyMemorableSummary: candidate.whyMemorableSummary,
      uncertainty: candidate.uncertainty,
      editorialVoteKey: candidate.editorialVoteKey,
      editorialVote: candidate.editorialVote,
      preselectedCandidate: candidate.preselectedCandidate,
      humanCurated: candidate.humanCurated,
      humanCurationStatus: candidate.preselectedCandidate
        ? "PRESELECTED CANDIDATE · NOT AN AUTHENTICATED CREATOR/EDITOR VOTE"
        : "NO PRESELECTED-CANDIDATE CLAIM",
      selectionProvenance: {
        status: candidate.preselectedCandidate
          ? "owner/project candidate set"
          : "machine candidate pool only",
        sources: candidate.selectionSources,
        authenticatedCreatorVote: false,
        authenticatedEditorDecision: false,
        legacyHumanCuratedCompatibilityFlag: candidate.humanCurated
      },
      creatorVoteClaim: false,
      editorSelectionAuthenticated: false,
      characterLoreReceipt: candidate.characterGrounded,
      curationLabels: candidate.curationLabels,
      evidenceProviders: candidate.providers,
      evidenceContributionCount: candidate.contributionCount,
      receiptCoherence: serialCopy(
        candidate.diversitySignals.receiptCoherence
      ),
      diversityControl: {
        policyVersion: candidate.diversityControl.policyVersion,
        baselineRank: candidate.diversityControl.baselineRank,
        finalRank: rank,
        rankMovement: candidate.diversityControl.baselineRank - rank,
        selectedInTopSlice: candidate.diversityControl.selectedInTopSlice,
        strictPolicyPass: candidate.diversityControl.strictPolicyPass,
        constraintRelaxed: candidate.diversityControl.constraintRelaxed,
        deferredFromTopSlice: candidate.diversityControl.deferredFromTopSlice,
        deferralReasons: candidate.diversityControl.deferralReasons,
        explicitBodyOrSexualLexical:
          candidate.diversitySignals.explicitBodyOrSexualLexical,
        explicitBodyOrSexualLexicalCount:
          candidate.diversitySignals.explicitBodyOrSexualLexicalCount,
        explicitBodyOrSexualFamilies:
          candidate.diversitySignals.explicitBodyOrSexualFamilies,
        nearDuplicateSignature:
          candidate.diversitySignals.nearDuplicateSignature,
        receiptCoherenceScore:
          candidate.diversitySignals.receiptCoherence.score,
        receiptCoherenceEligibleForTopSlice:
          candidate.diversitySignals.receiptCoherence.eligibleForTopSlice,
        receiptCoherenceFlags:
          candidate.diversitySignals.receiptCoherence.flags
      },
      rankInterpretation:
        "Machine-scored candidate position after the deterministic Top-25 diversity and receipt-coherence pass; not a creator vote, comedy verdict, or authenticated editor ranking.",
      tieBreaker: candidate.tieBreaker,
      provenance: {
        evidenceType: "timestamped-caption-receipt",
        excerptStatus: "bounded-source-excerpt",
        speakerStatus: "not-diarized",
        originClaim: false,
        hostAuthorshipClaim: false,
        syntheticQuote: false,
        authenticatedCreatorVote: false,
        authenticatedEditorDecision: false
      },
      speaker: null,
      host: null,
      trueOriginClaim: false,
      syntheticQuote: false
    };
  }

  function distribution(values) {
    var counts = {};
    array(values).forEach(function (value) {
      var key = clean(value) || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    });
    var total = Math.max(1, values.length);
    return stableSort(
      Object.keys(counts).map(function (label) {
        return {
          label: label,
          count: counts[label],
          share: round((counts[label] / total) * 100, 2)
        };
      }),
      function (left, right) {
        return (
          right.count - left.count ||
          fingerprint(left.label).localeCompare(fingerprint(right.label))
        );
      }
    );
  }

  function concentration(values) {
    var parts = distribution(values);
    return round(
      parts.reduce(function (sum, part) {
        return sum + Math.pow(part.share / 100, 2);
      }, 0),
      4
    );
  }

  function collisionDiagnostics(candidateByKey, pool, rankings) {
    var contributionCount = 0;
    var mergedReceiptCollisions = 0;
    var duplicateContributions = 0;
    candidateByKey.forEach(function (candidate) {
      contributionCount += candidate.contributions.length;
      if (candidate.contributions.length > 1) mergedReceiptCollisions += 1;
      duplicateContributions +=
        candidate.contributions.length -
        unique(candidate.contributions.map(contributionIdentity)).length;
    });
    var scoreGroups = {};
    rankings.forEach(function (ranking) {
      var key = ranking.score.toFixed(2);
      if (!scoreGroups[key]) scoreGroups[key] = [];
      scoreGroups[key].push(ranking.rank);
    });
    var ties = Object.keys(scoreGroups)
      .filter(function (score) {
        return scoreGroups[score].length > 1;
      })
      .map(function (score) {
        return {
          score: number(score),
          size: scoreGroups[score].length,
          ranks: scoreGroups[score]
        };
      });
    var rankKeys = rankings.map(function (ranking) {
      return ranking.rankKey;
    });
    return {
      ingestedContributions: contributionCount,
      uniquePlayableCandidates: pool.length,
      mergedReceiptCollisions: mergedReceiptCollisions,
      exactDuplicateContributionsIgnoredBySignals: duplicateContributions,
      scoreTieGroups: ties.length,
      scoreTieCandidates: ties.reduce(function (sum, tie) {
        return sum + tie.size;
      }, 0),
      largestScoreTie: ties.reduce(function (maximum, tie) {
        return Math.max(maximum, tie.size);
      }, 0),
      rankKeyCollisions: rankKeys.length - new Set(rankKeys).size,
      tieBreakPolicy:
        "Baseline order uses score, evidence percentile, preselection-signal percentile, category percentile, source-diversity percentile, then a content-derived fingerprint. The deterministic Top-25 diversity and receipt-coherence pass runs after this baseline order. An opaque identity hash is used only when every content key collides. Source-ID lexical order is never a ranking comparator.",
      tieGroups: ties
    };
  }

  function diversityDiagnostics(rankings, pool) {
    return {
      ranked: {
        lanes: distribution(rankings.map(function (item) { return item.lane; })),
        franchises: distribution(rankings.map(function (item) { return item.franchise; })),
        categories: distribution(rankings.map(function (item) { return item.category; })),
        uniqueSources: new Set(rankings.map(function (item) { return item.sourceId; })).size,
        sourceConcentration: concentration(
          rankings.map(function (item) { return item.sourceId; })
        )
      },
      candidatePool: {
        lanes: distribution(pool.map(function (item) { return item.lane; })),
        franchises: distribution(pool.map(function (item) { return item.franchise; })),
        categories: distribution(pool.map(function (item) { return item.category; })),
        uniqueSources: new Set(pool.map(function (item) { return item.sourceId; })).size,
        sourceConcentration: concentration(
          pool.map(function (item) { return item.sourceId; })
        )
      },
      interpretation:
        "Lower source concentration means the list is spread across more tapes. Distribution diagnostics describe representation; they do not invent a diversity verdict."
    };
  }

  function snapshotDate(sourceById) {
    return stableSort(
      Array.from(sourceById.values())
        .map(function (source) {
          return source.date;
        })
        .filter(function (date) {
          return /^\d{4}-\d{2}-\d{2}$/.test(date);
        }),
      function (left, right) {
        return right.localeCompare(left);
      }
    )[0] || "";
  }

  function create(options) {
    var input = asInput(options);
    var sourceById = buildSources(input);
    var candidateByKey = new Map();
    ingestDeep(input, candidateByKey, sourceById);
    ingestStreams(
      input.live.streams,
      "recent-livestream",
      "recent-livestream",
      candidateByKey,
      sourceById
    );
    ingestStreams(
      input.popular.streams,
      "popular-livestream",
      "popular-livestream",
      candidateByKey,
      sourceById
    );
    ingestCharacters(input, candidateByKey, sourceById);
    var curation = applyCuration(input, candidateByKey);
    var pool = scorePool(
      buildPool(input, sourceById, candidateByKey),
      input
    );
    var baselineRankedPool = stableSort(pool, compareRank);
    var requestedLimit = Math.min(input.limit, baselineRankedPool.length);
    var diversityPass = applyTopSliceDiversity(
      baselineRankedPool,
      requestedLimit
    );
    var rankedPool = diversityPass.ordered;
    var rankings = rankedPool.slice(0, requestedLimit).map(function (candidate, index) {
      return publicRanking(candidate, index + 1);
    });
    var diagnostics = {
      diversity: diversityDiagnostics(rankings, pool),
      topSliceDiversity: diversityPass.diagnostics,
      collisions: collisionDiagnostics(candidateByKey, pool, rankings),
      curation: {
        supplied: array(input.curation.upInYa).length,
        matchedToPlayableReceipt: curation.matched,
        unmatched: curation.unmatched,
        interpretation:
          "These are preselected project candidate inputs. They are not authenticated Mike/J votes or authenticated editor decisions."
      },
      recency: {
        enabled: input.includeRecency,
        label: input.includeRecency
          ? "RECENCY BOOST (EXPLICITLY ENABLED)"
          : "RECENCY EXCLUDED",
        maximumAdjustmentPoints: input.includeRecency ? 3 : 0
      },
      editorialVotes: {
        default: 0,
        range: [EDITORIAL_VOTE_MIN, EDITORIAL_VOTE_MAX],
        pointsPerVote: 1.5,
        suppliedNonZero: rankings.filter(function (item) {
          return item.editorialVote !== 0;
        }).length,
        policy:
          "No vote is inferred. Missing keys are exactly zero; only caller-supplied votes move a score."
      }
    };
    var archiveFingerprint = fingerprint(
      stableJson(
        rankedPool.map(function (candidate) {
          return [
            candidate.internalKey,
            candidate.quote,
            candidate.category,
            candidate.score,
            candidate.editorialVote
          ];
        })
      )
    );
    var methodology = {
      name: "Red Band Memorability Candidate Index V2.1",
      rankingLimit: DEFAULT_LIMIT,
      formula:
        "Weighted percentile signals × evidence modifier + explicit editorial-vote adjustment + optional explicitly labeled recency adjustment, followed by the deterministic Top-25 diversity and receipt-coherence pass.",
      percentileSignals: serialCopy(SCORE_WEIGHTS),
      evidenceModifier: {
        minimum: 0.75,
        maximum: 1,
        inputs:
          "caption/source status, confidence already present in the archive, preselected-candidate input, multi-provider agreement, and explicit uncertainty penalties"
      },
      editorialVoteHook: {
        key: "sourceId@roundedTimestamp",
        default: 0,
        range: [EDITORIAL_VOTE_MIN, EDITORIAL_VOTE_MAX],
        pointsPerVote: 1.5
      },
      recency:
        "Off by default. Set includeRecency: true to add a clearly labeled adjustment from -3 to +3 points.",
      topSliceDiversity: {
        policy: serialCopy(TOP_SLICE_POLICY),
        receiptCoherence: serialCopy(RECEIPT_COHERENCE_POLICY),
        order:
          "Raw machine scores establish the baseline order. A greedy deterministic pass selects the first 25 from a bounded six-window horizon while enforcing a language-neutral caption-receipt coherence gate plus category, explicit body/sexual lexical, preselected-candidate, source, and near-duplicate caps. Deferred candidates remain in baseline order from rank 26 onward. If a small archive cannot fill the window, constraints relax in baseline order and every relaxation is labeled.",
        creatorVoteClaim: false,
        authenticatedEditorDecision: false,
        comedyQualityClaim: false
      },
      tieBreak:
        diagnostics.collisions.tieBreakPolicy
    };
    var evidencePolicy = {
      excerptWordLimit: EXCERPT_WORD_LIMIT,
      playableRequired: true,
      speakerStatus: "not-diarized",
      hostAuthorshipClaims: false,
      trueOriginClaims: false,
      creatorVoteClaims: false,
      authenticatedEditorDecisionClaims: false,
      syntheticQuotes: false,
      receiptCoherence:
        "Top-25 placement requires a deterministic structural caption-fragment check. Wild language is not penalized, and passing does not certify humor or human-edited wording.",
      note:
        "A ranked item is a bounded timestamped caption receipt and machine-ranked candidate. Rank does not identify who said it, establish the true origin of a recurring bit, or represent an authenticated creator/editor vote."
    };
    var metrics = {
      candidateContributions: diagnostics.collisions.ingestedContributions,
      playableCandidates: pool.length,
      rankedReceipts: rankings.length,
      requestedReceipts: input.limit,
      defaultReceipts: DEFAULT_LIMIT,
      exactDefaultSatisfied:
        input.limit === DEFAULT_LIMIT
          ? rankings.length === Math.min(DEFAULT_LIMIT, pool.length)
          : null,
      uniqueRankKeys: new Set(
        rankings.map(function (ranking) {
          return ranking.rankKey;
        })
      ).size,
      uniqueRankedSources: diagnostics.diversity.ranked.uniqueSources,
      archiveSources: sourceById.size,
      snapshotDate: snapshotDate(sourceById),
      archiveFingerprint: archiveFingerprint
    };
    var byRankKey = new Map(
      rankings.map(function (ranking) {
        return [ranking.rankKey, ranking];
      })
    );
    var byReceiptKey = new Map(
      rankings.map(function (ranking) {
        return [ranking.editorialVoteKey, ranking];
      })
    );

    return {
      product: PRODUCT,
      version: VERSION,
      rankings: rankings,
      metrics: metrics,
      methodology: methodology,
      evidencePolicy: evidencePolicy,
      diagnostics: diagnostics,
      getTop: function (limit) {
        return rankings.slice(0, Math.max(0, Math.floor(number(limit, 10))));
      },
      getByRank: function (rank) {
        return rankings[Math.floor(number(rank)) - 1] || null;
      },
      getByRankKey: function (rankKey) {
        return byRankKey.get(clean(rankKey)) || null;
      },
      getByReceiptKey: function (receiptKey) {
        return byReceiptKey.get(clean(receiptKey)) || null;
      },
      getDiagnostics: function () {
        return serialCopy(diagnostics);
      },
      getEditorialVoteTemplate: function () {
        return rankings.reduce(function (template, ranking) {
          template[ranking.editorialVoteKey] = 0;
          return template;
        }, {});
      },
      exportSnapshot: function () {
        return serialCopy({
          product: PRODUCT,
          version: VERSION,
          metrics: metrics,
          methodology: methodology,
          evidencePolicy: evidencePolicy,
          diagnostics: diagnostics,
          rankings: rankings
        });
      }
    };
  }

  var api = {
    VERSION: VERSION,
    PRODUCT: PRODUCT,
    DEFAULT_LIMIT: DEFAULT_LIMIT,
    EXCERPT_WORD_LIMIT: EXCERPT_WORD_LIMIT,
    SCORE_WEIGHTS: serialCopy(SCORE_WEIGHTS),
    TOP_SLICE_POLICY: serialCopy(TOP_SLICE_POLICY),
    RECEIPT_COHERENCE_POLICY: serialCopy(RECEIPT_COHERENCE_POLICY),
    EDITORIAL_VOTE_RANGE: [EDITORIAL_VOTE_MIN, EDITORIAL_VOTE_MAX],
    voteKey: receiptIdentity,
    create: create
  };

  root.WWAMRedBandRankingV2 = api;
})(typeof window !== "undefined" ? window : globalThis);
