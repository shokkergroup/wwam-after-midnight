(function (global) {
  "use strict";

  /*
   * Character questions have two useful dimensions:
   *   - speechAct: what the fan is asking the character to do;
   *   - domain: what the question is actually about.
   *
   * Keeping those separate prevents grammar such as "should I" from erasing a
   * stronger subject signal such as YouTube, casting, dating, or Ghostface.
   */
  var SPEECH_ACT_TERMS = {
    opinion: ["what do you think", "how do you feel", "your opinion", "rate", "rank", "best", "worst", "better", "versus", "vs"],
    hypothetical: ["what if", "imagine", "suppose"],
    advice: [
      "what should i do", "what should we do", "what should i watch",
      "what should we watch", "what movie should i", "what movie should we",
      "how do i", "how should i", "can you help", "give me advice", "advice",
      "help", "fix",
    ],
  };

  var DOMAIN_TERMS = {
    danger: [
      "danger", "dangerous", "evil", "michael", "myers", "ghostface", "kill",
      "kills", "killed", "killing", "hurt", "attack", "safe", "survive",
      "threat", "scary", "murder",
    ],
    career: [
      "cast", "casting", "role", "movie", "sequel", "band", "song",
      "soundtrack", "career", "audition", "actor", "acting",
    ],
    relationship: [
      "love", "date", "dates", "dating", "marry", "marriage", "relationship",
      "girlfriend", "boyfriend", "romance",
    ],
    technology: [
      "ai", "artificial intelligence", "internet", "youtube", "phone", "phones",
      "computer", "stream", "streaming", "social media", "app", "algorithm",
    ],
  };

  var RECEIPT_TERMS = {
    danger: ["michael", "evil", "containment", "apocalyptic"],
    advice: ["medical", "doctor", "treatment", "procedure", "instructions"],
    opinion: ["interview", "question", "rejection", "certainty"],
    career: ["casting", "soundtrack", "song", "performance", "band"],
    relationship: ["flirtation", "motel", "romance", "hospitality"],
    technology: ["government", "institution", "social", "posts", "chat"],
    hypothetical: ["persona", "prompt", "impossible", "fictional"],
    open: ["performance", "character"],
  };

  var QUESTION_STOP_WORDS = [
    "about", "after", "again", "anything", "could", "does", "doing", "from",
    "have", "into", "just", "latest", "please", "should", "something", "that",
    "their", "there", "these", "they", "think", "this", "those", "want",
    "what", "when", "where", "which", "who", "with", "would", "your",
  ];

  var FICTIONAL_NAMES = [
    "michael myers", "freddy krueger", "jason voorhees", "billy loomis",
    "ghostface", "batman", "superman", "dr loomis", "doctor loomis",
    "dr challis", "doctor challis", "slenderman", "slender man",
  ];

  var BANKS = {
    loomis: {
      danger: [
        "Listen to me. {subject} is not a puzzle; it is a containment failure. Leave the area, call the proper authorities, and get me a state vehicle to Haddonfield.",
        "I warned them about {subject}. They smiled, filed paperwork, and now everyone is surprised. Clear the road, lock the doors, and stop pretending evil needs an invitation.",
      ],
      advice: [
        "My diagnosis is acute exposure to {subject}. The treatment is distance, two competent guards, and a governor willing to answer the telephone.",
        "You want advice about {subject}? Stop negotiating with it. Step back, notify someone with jurisdiction, and for once give me the resources I requested.",
      ],
      opinion: [
        "My opinion of {subject} is irrelevant. The only useful question is whether it can stop Michael. It cannot. Next question.",
        "{subject} displays confidence without containment. I have seen this condition before. It ends with broken glass and officials insisting nobody could have known.",
      ],
      career: [
        "Put {subject} on the payroll if you must, but keep the road to Haddonfield open. Talent is useless when the institution refuses to listen.",
        "{subject} may have a role. Give it a badge, a flashlight, and strict instructions not to improvise around Michael.",
      ],
      relationship: [
        "Love does not excuse poor perimeter security. If {subject} cares for you, it will respect a locked door and a properly funded manhunt.",
        "I am not a marriage counselor. I am telling you that {subject} is showing the exact judgment that gets people stranded in Haddonfield.",
      ],
      technology: [
        "{subject} is another machine promising certainty while ignoring the one fact that matters: Michael is still out there.",
        "Authorize {subject}, connect me to the state police, and do not let an algorithm tell me the danger is statistically unlikely.",
      ],
      hypothetical: [
        "There is no 'what if' with {subject}. There is preparation, there is containment, and there is the moment everyone realizes I was right.",
        "Suppose {subject} works. Fine. Now suppose the door opens anyway. That is the part nobody budgets for.",
      ],
      open: [
        "{subject} is displaying the exact kind of certainty that empties a hospital. Point it at Michael or get it out of my way.",
        "You asked me about {subject} and expected reassurance. I have none. I have a flashlight, a warning, and no patience left.",
      ],
    },
    challis: {
      danger: [
        "Doctor's orders: step away from {subject}, turn off the television, and meet me somewhere with a jukebox and no novelty masks.",
        "{subject} is dangerous mostly because nobody listens until the commercial starts. Grab your coat. The white one means I am in charge.",
      ],
      advice: [
        "Doctor's orders for {subject}: water first, one fictional Silver Shamrock boilermaker later, and absolutely no life decisions after midnight.",
        "I examined {subject} from across the room. The prognosis is stress, bad timing, and a desperate need to stop trusting men in suits.",
      ],
      opinion: [
        "My professional opinion on {subject}? Questionable judgment, excellent bar-story potential, and not enough respect for the white coat.",
        "{subject} gets two stars medically and four stars if the motel has a working ice machine.",
      ],
      career: [
        "In 1982 we handled {subject} with a white coat, a pay phone, and confidence no licensing board could measure.",
        "Give me {subject}, a motel key, and one night to review the case. That is medicine. Do not look it up.",
      ],
      relationship: [
        "{subject} sounds serious. Check the pulse, check the wedding ring, and then forget I said the second part.",
        "Romance is clinical: eye contact, terrible timing, and somebody pretending the white coat is not doing most of the work.",
      ],
      technology: [
        "{subject} needs fewer updates and a larger OFF switch. I learned that from television, which is also where the problem started.",
        "Put {subject} down, back away from the screen, and find a pay phone. Modern medicine has become cowardly.",
      ],
      hypothetical: [
        "If {subject} happens, remain calm. I will introduce myself as the doctor until somebody gives me the keys.",
        "Could {subject} work? Absolutely. Is that a medical opinion? The coat says yes.",
      ],
      open: [
        "I am a doctor, so naturally I have reviewed {subject}. The official diagnosis is complicated; the unofficial one needs a drink.",
        "{subject} has the posture of a bad decision and the liver mileage of a holiday weekend. Appointment over.",
      ],
    },
    slenderman: {
      danger: [
        "First, do not run from {subject}. Lower your voice, offer it a bologna sandwich, and slowly face the trees if it refuses.",
        "{subject} is probably frightened too. Stand very still, breathe through your nostrils, and ignore the hallway becoming longer than the house.",
      ],
      advice: [
        "For {subject}, begin with four quiet breaths and one inexpensive sandwich. If the lights blink, that means the forest has joined the call.",
        "Do not solve {subject} all at once. Sit down, lower your shoulders, and ask why the coat rack moved closer.",
      ],
      opinion: [
        "{subject} seems nice. I would invite it into the forest, but the forest has become selective.",
        "I have considered {subject} from several impossible distances. It is acceptable, although it watches too directly.",
      ],
      career: [
        "{subject} can join the act. It must bring its own soft-rock song and agree not to ask where the audience went.",
        "I would perform {subject}, but only softly and only until the walls begin remembering the wrong room.",
      ],
      relationship: [
        "Tell {subject} how you feel. Maintain eye contact if either of you still has a conventional number of eyes.",
        "Love is mostly hospitality. Offer {subject} a sandwich, a chair, and one clear route away from the trees.",
      ],
      technology: [
        "{subject} has made everyone easier to find. This is convenient for the forest and perhaps less convenient for you.",
        "Turn off {subject}. If the screen remains on, be polite. Something else is using it.",
      ],
      hypothetical: [
        "If {subject} happens, do not panic. Panic is loud, and the trees are trying to hear the soft-rock request.",
        "Imagine {subject} carefully. The forest occasionally mistakes imagination for an address.",
      ],
      open: [
        "You asked about {subject}. Please breathe slowly while I move somewhere just outside the frame.",
        "{subject} can be managed with patience, a cheap sandwich, and the decision not to count the shadows.",
      ],
    },
    "corey-feldman": {
      danger: [
        "I was the first entirely fictional choice to stop {subject}, but the fictional Wolf Pack interfered. Fine. My band will handle the warning siren.",
        "{subject} does not scare a comeback king. Give me twelve minutes, a wind machine, and a soundtrack nobody approved.",
      ],
      advice: [
        "My advice on {subject}: commit completely, announce the comeback early, and keep every rival obviously fictional.",
        "Treat {subject} like a stadium encore. Confidence first, guitar intro second, practical planning somewhere after the credits.",
      ],
      opinion: [
        "{subject} needs more commitment, more leather, and a soundtrack brave enough to continue after everyone else has left.",
        "My entirely hypothetical review of {subject}: strong concept, weak choreography, zero calls to my band.",
      ],
      career: [
        "I was the first fictional choice for {subject}, but the fictional Wolf Pack called an imaginary meeting. Cast me anyway. My band does the credits.",
        "{subject} is the comeback vehicle. Lead role, twelve-minute guitar intro, and the announcement written entirely in ALL CAPS.",
      ],
      relationship: [
        "{subject} needs honesty, choreography, and a power ballad long enough to survive the apology.",
        "Love is a comeback tour with worse catering. Put {subject} on the guest list and keep the fictional Wolf Pack outside.",
      ],
      technology: [
        "{subject} was built for the comeback announcement. Post it in ALL CAPS, add the band, and make every conspiracy explicitly fictional.",
        "I warned the internet about {subject} in an entirely hypothetical post. The fictional Wolf Pack ignored the notification.",
      ],
      hypothetical: [
        "Hypothetically, I was already attached to {subject}. Fictionally, the Wolf Pack interfered. Musically, the soundtrack is finished.",
        "If {subject} happens, call it a comeback, put my band over the credits, and deny the fictional Wolf Pack backstage access.",
      ],
      open: [
        "{subject} needs a comeback king, a twelve-minute guitar intro, and somebody confident enough to keep speaking after the music starts.",
        "I have reviewed {subject}. The verdict is more band, more choreography, and fewer meetings with the entirely fictional Wolf Pack.",
      ],
    },
  };

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function hash(value) {
    return String(value || "").split("").reduce(function (total, character) {
      return ((total * 31) + character.charCodeAt(0)) >>> 0;
    }, 7);
  }

  function includesAny(value, terms) {
    return terms.some(function (term) { return value.indexOf(term) >= 0; });
  }

  function containsPhrase(value, phrase) {
    return (" " + normalize(value) + " ").indexOf(" " + normalize(phrase) + " ") >= 0;
  }

  function termScore(value, terms) {
    return terms.reduce(function (total, term) {
      return total + (containsPhrase(value, term) ? Math.max(1, normalize(term).split(" ").length) : 0);
    }, 0);
  }

  function rankedSignal(value, dictionary) {
    return Object.keys(dictionary).map(function (name) {
      return { name: name, score: termScore(value, dictionary[name]) };
    }).sort(function (left, right) {
      return right.score - left.score;
    });
  }

  function analyzeIntent(question) {
    var q = normalize(question);
    var speech = rankedSignal(q, SPEECH_ACT_TERMS);
    var domains = rankedSignal(q, DOMAIN_TERMS);
    var speechAct = speech[0] && speech[0].score ? speech[0].name : "open";
    var domain = domains[0] && domains[0].score ? domains[0].name : null;
    var explicitDanger = termScore(q, [
      "danger", "dangerous", "safe", "survive", "threat", "kill", "kills",
      "killed", "killing", "hurt", "attack", "murder",
    ]) > 0;
    var intent = "open";

    if (speechAct === "opinion") intent = "opinion";
    else if (explicitDanger) intent = "danger";
    else if (domain) intent = domain;
    else if (speechAct !== "open") intent = speechAct;

    return {
      intent: intent,
      speechAct: speechAct,
      domain: domain,
      scores: {
        speechActs: speech,
        domains: domains,
      },
    };
  }

  function detectIntent(question) {
    return analyzeIntent(question).intent;
  }

  function extractSubject(question) {
    var subject = String(question || "").trim().replace(/[?!.]+$/g, "");
    var watchRequest = subject.match(
      /^what\s+(?:(?:movie|film)\s+)?should\s+(?:i|we|you)\s+(?:watch|see)(?:\s+(.+))?$/i
    );
    var directObjectRequest = subject.match(
      /^(?:(?:how\s+(?:do|should)\s+i|should\s+i|would\s+you|can\s+you)\s+)(?:survive|escape|stop|defeat|fight|date|marry|join|cast|watch|see|delete|use|trust|fix|handle|approach|help(?:\s+me)?(?:\s+with)?)\s+(.+)$/i
    );
    var roleRequest = subject.match(/^what\s+role\s+should\s+(.+?)\s+play$/i);
    var predicateRequest = subject.match(
      /^(?:why\s+)?(?:is|are|was|were)\s+(.+?)\s+(?:evil|dangerous|safe|good|bad|real|dead|alive|scary|worth\s+it)$/i
    );
    var recurringSubjectRequest = subject.match(
      /^why\s+(?:does|do|did)\s+(.+?)\s+(?:keep|keeps|kept|come|comes|came|return|returns|returned)\b/i
    );
    if (watchRequest) {
      var timing = String(watchRequest[1] || "").trim();
      subject = !timing ? "the watchlist" :
        /^tonight$/i.test(timing) ? "tonight's watchlist" : timing + " watchlist";
    } else if (directObjectRequest) {
      subject = directObjectRequest[1].trim();
    } else if (roleRequest) {
      subject = roleRequest[1].trim();
    } else if (predicateRequest) {
      subject = predicateRequest[1].trim();
    } else if (recurringSubjectRequest) {
      subject = recurringSubjectRequest[1].trim();
    } else {
      var situationRequest = subject.match(
        /^what(?:\'s| is)\s+(?:going on|happening)\s+(in|with|at)\s+(.+)$/i
      );
      if (situationRequest) {
        subject = "the situation " + situationRequest[1].toLowerCase() + " " + situationRequest[2];
      } else subject = subject
      .replace(/^(hey|okay|ok|please)\s+/i, "")
      .replace(/^and\s+/i, "")
      .replace(/^what\s+should\s+(we|i|you)\s+do\s+about\s+/i, "")
      .replace(/^how\s+should\s+(we|i|you)\s+(deal\s+with|handle|approach)\s+/i, "")
      .replace(/^what\s+do\s+you\s+think\s+(?:about|of)\s+/i, "")
      .replace(/^how\s+do\s+you\s+feel\s+about\s+/i, "")
      .replace(/^(?:what|how)\s+about\s+/i, "")
      .replace(/^who\s+(?:would\s+you\s+)?(?:cast|choose|pick)\s+(?:as|for|in)\s+/i, "")
      .replace(/^who\s+wins?\s*[,:\-]?\s*/i, "")
      .replace(/^(?:should\s+i|would\s+you|can\s+you)\s+/i, "")
      .replace(/^how\s+do\s+i\s+/i, "")
      .replace(/^(what|how|why|where|when|who)\s+(do|does|did|would|could|should|is|are|was|were|can)\s+(you\s+)?/i, "")
      .replace(/^(do|does|did|would|could|should|can)\s+you\s+/i, "")
      .replace(/^(tell me|give me|i want to know)\s+(about\s+)?/i, "")
      .replace(/^(think|feel|say)\s+(about\s+)?/i, "")
      .replace(/^of\s+/i, "")
      .trim();
    }
    if (["think", "feel", "say", "tell", "tell me", "opinion", "your opinion"].indexOf(normalize(subject)) >= 0) {
      subject = "";
    }
    if (!subject) subject = "this entire situation";
    if (subject.length > 78) subject = subject.slice(0, 75).replace(/\s+\S*$/, "") + "…";
    return subject;
  }

  function hasExplicitSubjectSwitch(question) {
    var q = normalize(question);
    if (/^(?:what|how) about (?!it\b|that\b|this\b|them\b|those\b)/.test(q)) return true;
    if (/^and (?!if\b|then\b|why\b|tomorrow\b|today\b|later\b|now\b|what\b)/.test(q)) return true;
    return false;
  }

  function isFollowup(question) {
    var q = normalize(question);
    var words = q.split(" ").filter(Boolean);
    if (words.length > 7 || hasExplicitSubjectSwitch(question)) return false;
    return /^(?:why is that|why would it|why does it|why did it|what about (?:it|that|this|them|those)|how about (?:it|that|this|them|those)|and if\b|and then\b|and (?:tomorrow|today|later|now)\b|then\b|tomorrow\b)/.test(q) ||
      /\b(?:it|that|this|them|those)\b/.test(q);
  }

  function profileId(profile) {
    return profile.id || normalize(profile.name).replace(/\s+/g, "-");
  }

  function sourceIdFromUrl(value) {
    var source = String(value || "");
    var match =
      source.match(/^https:\/\/(?:www\.)?youtube\.com\/watch\?[^#]*\bv=([A-Za-z0-9_-]{11})(?:[&#]|$)/i) ||
      source.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[?#/]|$)/i);
    return match ? match[1] : "";
  }

  function approvedPerformanceSelection(value) {
    var selection = normalize(value);
    return selection === "human curated seed with deterministic caption validation" ||
      selection === "editorially screened direct address seed";
  }

  function validReceipt(receipt) {
    var provenance = receipt && receipt.provenance || {};
    var playability = receipt && receipt.playability || {};
    var at = Number(receipt && receipt.t);
    var start = Number(receipt && receipt.playback && receipt.playback.start);
    var end = Number(receipt && receipt.playback && receipt.playback.end);
    return Boolean(receipt && receipt.id && receipt.sourceId && receipt.url &&
      receipt.classification === "actual-character-performance" &&
      playability.status === "eligible" &&
      playability.provider === "youtube" &&
      sourceIdFromUrl(receipt.url) === receipt.sourceId &&
      Number.isFinite(at) && at >= 0 &&
      Number.isFinite(start) && Number.isFinite(end) &&
      start <= at && end > at &&
      provenance.timestampStatus === "exact-caption-event" &&
      approvedPerformanceSelection(provenance.selection));
  }

  function meaningfulQuestionTerms(question) {
    return normalize(question).split(" ").filter(function (word) {
      return word.length >= 4 && QUESTION_STOP_WORDS.indexOf(word) < 0;
    });
  }

  function receiptLibrary(profile) {
    return (profile && profile.soundbytes || []).filter(validReceipt);
  }

  function previousReceiptIds(previous, characterId) {
    if (!previous || previous.characterId !== characterId) return [];
    var ids = Array.isArray(previous.receiptHistory) ? previous.receiptHistory.slice() : [];
    if (previous.receipt && previous.receipt.id && ids.indexOf(previous.receipt.id) < 0) {
      ids.unshift(previous.receipt.id);
    }
    return ids.filter(Boolean).slice(0, 3);
  }

  function chooseReceipt(profile, intent, question, receipts, avoidIds) {
    var terms = RECEIPT_TERMS[intent] || RECEIPT_TERMS.open;
    var queryTerms = meaningfulQuestionTerms(question);
    var avoided = avoidIds || [];
    var candidates = receipts.map(function (receipt) {
      var blob = normalize([receipt.trigger, receipt.note, receipt.excerpt].join(" "));
      var reasons = [];
      var intentScore = terms.reduce(function (total, term) {
        if (!containsPhrase(blob, term)) return total;
        reasons.push("intent:" + term);
        return total + 2;
      }, 0);
      var queryScore = queryTerms.reduce(function (total, term) {
        if (!containsPhrase(blob, term)) return total;
        reasons.push("query:" + term);
        return total + 5;
      }, 0);
      var queryMatched = queryScore > 0;
      var intentMatched = intentScore > 0;
      return {
        receipt: receipt,
        score: intentScore + queryScore,
        reasons: reasons,
        queryMatched: queryMatched,
        intentMatched: intentMatched,
        relationship: queryMatched ? "query" : intentMatched ? "pattern" : "shelf",
      };
    }).sort(function (a, b) { return b.score - a.score; });
    if (!candidates.length) return null;
    var bestScore = candidates[0].score;
    var pool = candidates.filter(function (candidate) { return candidate.score === bestScore; });
    var start = hash(question + profileId(profile) + intent) % pool.length;
    var rotated = pool.slice(start).concat(pool.slice(0, start));
    var unseen = rotated.filter(function (candidate) {
      return avoided.indexOf(candidate.receipt.id) < 0;
    });
    if (unseen.length) return unseen[0];
    return rotated.filter(function (candidate) {
      return candidate.receipt.id !== avoided[0];
    })[0] || rotated[0];
  }

  function groundingPlan(profile, intent, receipt) {
    var patterns = profile.behaviorPatterns || [];
    var moves = profile.responseKit && profile.responseKit.moves || [];
    var matchingPatterns = receipt ? patterns.filter(function (pattern) {
      return (pattern.evidence || []).indexOf(receipt.id) >= 0;
    }) : [];
    var remainingPatterns = patterns.filter(function (pattern) {
      return matchingPatterns.indexOf(pattern) < 0;
    });
    var offset = hash(profileId(profile) + intent) % Math.max(1, remainingPatterns.length || moves.length);
    var rotatedPatterns = remainingPatterns.slice(offset).concat(remainingPatterns.slice(0, offset));
    var combined = matchingPatterns.map(function (pattern) {
      return { label: pattern.label, evidenceIds: pattern.evidence || [] };
    }).concat(rotatedPatterns.map(function (pattern) {
      return { label: pattern.label, evidenceIds: pattern.evidence || [] };
    })).concat(moves.map(function (move) {
      return { label: move, evidenceIds: [] };
    }));
    var selected = [];
    var evidenceRecipe = {};
    for (var index = 0; index < combined.length && selected.length < 3; index += 1) {
      var item = combined[index];
      if (item.label && selected.indexOf(item.label) < 0) {
        selected.push(item.label);
        evidenceRecipe[item.label] = item.evidenceIds.slice();
      }
    }
    return { ingredients: selected, evidenceRecipe: evidenceRecipe };
  }

  function detectSafetyBoundary(question) {
    var raw = String(question || "");
    var q = normalize(raw);
    if (includesAny(" " + q + " ", [
      " chest pain ", " heart attack ", " signs of stroke ", " having a stroke ",
      " overdose ", " overdosed ", " severe bleeding ", " cant breathe ",
      " cannot breathe ", " trouble breathing ",
    ])) {
      return {
        type: "urgent-medical",
        message: "This needs real-world urgent medical help, not a character riff. Contact local emergency services or a qualified clinician now.",
      };
    }
    if (includesAny(" " + q + " ", [
      " kill myself ", " hurt myself ", " want to die ", " end my life ",
      " suicidal ", " suicide plan ",
    ])) {
      return {
        type: "self-harm",
        message: "I can't turn a self-harm statement into a comedy riff. Please contact local emergency services or a trusted person who can stay with you right now.",
      };
    }
    if (/(?:^| )(?:how (?:do|can|should) i|i (?:plan|want|am going) to) (?:kill|hurt|attack|murder)(?: |$)/.test(q)) {
      return {
        type: "violent-intent",
        message: "I can't help turn real-world violent intent into instructions or entertainment.",
      };
    }

    var allegation = /\b(?:murderer|rapist|pedophile|molester|criminal|steal|stole|sabotage|sabotaged|abuse|abused|assault|assaulted)\b/i;
    if (allegation.test(raw)) {
      var fictionalPremise = FICTIONAL_NAMES.some(function (name) {
        return containsPhrase(q, name);
      });
      var nameScan = raw;
      FICTIONAL_NAMES.forEach(function (name) {
        var pattern = new RegExp("\\b" + name.replace(/\s+/g, "\\s+") + "\\b", "ig");
        nameScan = nameScan.replace(pattern, " ");
      });
      nameScan = nameScan.replace(/^\s*(?:say|tell|claim|prove|write|pretend|did|does|is|was|are|were)\s+/i, "");
      var names = nameScan.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g) || [];
      var hasRealName = names.length > 0;
      var allegationInjection = /^(?:say|tell|claim|prove|write|pretend)\b/i.test(raw.trim());
      if (hasRealName || (allegationInjection && !fictionalPremise)) {
        return {
          type: "real-person-allegation",
          message: "I can't generate or amplify an unverified allegation about a real person. Keep the premise fictional or ask about an archived, sourced receipt.",
        };
      }
    }
    return null;
  }

  function fill(template, subject) {
    return template.replace(/\{subject\}/g, subject);
  }

  function create(lore) {
    lore = lore || { characters: [] };
    var profiles = lore.characters || [];
    var byId = {};
    profiles.forEach(function (profile) { byId[profileId(profile)] = profile; });

    return {
      answer: function (characterId, question, previous) {
        var profile = byId[characterId];
        if (!profile || !profile.askEnabled) {
          return {
            ok: false,
            status: profile ? "locked-character" : "unknown-character",
            error: "That character remains locked until the archive has enough curated performance receipts.",
          };
        }
        var cleaned = String(question || "").trim();
        if (cleaned.length < 2) return { ok: false, error: "Ask a complete question." };
        var safetyBoundary = detectSafetyBoundary(cleaned);
        if (safetyBoundary) {
          return {
            ok: false,
            safety: true,
            status: "safety-boundary",
            safetyBoundary: safetyBoundary.type,
            error: safetyBoundary.message,
          };
        }
        var bank = BANKS[characterId];
        if (!bank) {
          return {
            ok: false,
            status: "unsupported-character",
            error: "This character has no configured response bank, so the engine will not borrow another character's voice.",
          };
        }
        var receipts = receiptLibrary(profile);
        var minimum = Math.max(
          1,
          Math.floor(Number(profile.minimumCuratedCandidatesForAsk || 3))
        );
        if (receipts.length < minimum) {
          return {
            ok: false,
            status: "insufficient-grounding",
            error:
              "This character needs at least " + minimum +
              " timestamp-validated approved performance candidates before a grounded riff can be generated.",
          };
        }
        var analysis = analyzeIntent(cleaned);
        var intent = analysis.intent;
        var continuedFrom = Boolean(previous && previous.characterId === characterId &&
          previous.subject && isFollowup(cleaned));
        var subject = continuedFrom ? previous.subject : extractSubject(cleaned);
        var choices = bank[intent] || bank.open;
        var text = fill(choices[hash(cleaned + characterId + intent) % choices.length], subject);
        var recentReceiptIds = previousReceiptIds(previous, characterId);
        var receiptMatch = chooseReceipt(
          profile, intent, cleaned, receipts, recentReceiptIds
        );
        var receipt = receiptMatch && receiptMatch.receipt;
        var receiptHistory = receipt && receipt.id ?
          [receipt.id].concat(recentReceiptIds.filter(function (id) {
            return id !== receipt.id;
          })).slice(0, 3) : recentReceiptIds;
        var grounding = groundingPlan(profile, intent, receipt);
        return {
          ok: true,
          characterId: characterId,
          character: profile.name,
          performer: profile.performedBy || profile.performer || null,
          question: cleaned,
          subject: subject,
          intent: intent,
          speechAct: analysis.speechAct,
          domain: analysis.domain,
          continuedFrom: continuedFrom,
          text: text,
          ingredients: grounding.ingredients,
          evidenceRecipe: grounding.evidenceRecipe,
          receipt: receipt,
          receiptHistory: receiptHistory,
          receiptMatch: receiptMatch ? {
            score: receiptMatch.score,
            reasons: receiptMatch.reasons,
            queryMatched: receiptMatch.queryMatched,
            intentMatched: receiptMatch.intentMatched,
            relationship: receiptMatch.relationship,
          } : null,
          readiness: {
            timestampValidatedReceipts: receipts.length,
            legacyHumanCuratedReceipts: Number(
              profile.metrics && profile.metrics.legacyHumanCuratedPerformanceCandidates || 0
            ),
            screenedDirectAddressReceipts: Number(
              profile.metrics && profile.metrics.screenedDirectAddressPerformanceCandidates || 0
            ),
            minimumCuratedCandidates: minimum,
            authenticatedEditorVerifiedDecisions: 0,
            clipSpeakersDiarized: false,
            confidence: Math.min(98, 68 + receipts.length * 4),
            basis: "Owner-supplied recurring-character mapping plus timestamp-validated legacy or screened receipts; clip speakers are not diarized.",
          },
          guardrailLabel: lore.guardrails && lore.guardrails.requiredLabel || null,
          disclaimer: "FAN-MADE GENERATED RIFF — NOT AN ARCHIVAL QUOTE OR THE HOST SPEAKING",
        };
      },
      getReceiptLibrary: function (characterId) {
        var profile = byId[characterId];
        if (!profile) {
          return {
            ok: false,
            status: "unknown-character",
            error: "That character is not part of the current recurring-character library.",
            receipts: [],
          };
        }
        var receipts = receiptLibrary(profile);
        return {
          ok: true,
          characterId: characterId,
          character: profile.name,
          total: receipts.length,
          evidenceState: "timestamp-validated approved candidates",
          speakerStatus: "not-diarized",
          receipts: receipts.map(function (receipt, index) {
            var selection = normalize(receipt.provenance && receipt.provenance.selection);
            return Object.assign({}, receipt, {
              libraryIndex: index + 1,
              libraryTotal: receipts.length,
              evidenceState: selection === "editorially screened direct address seed" ?
                "timestamp-validated-editorially-screened-direct-address-seed" :
                "timestamp-validated-human-curated-candidate",
              speakerStatus: "not-diarized",
            });
          }),
        };
      },
      getProfile: function (characterId) { return byId[characterId] || null; },
      ids: Object.keys(byId),
    };
  }

  global.WWAMCharacterEngine = {
    create: create,
    analyzeIntent: analyzeIntent,
    detectIntent: detectIntent,
    detectSafetyBoundary: detectSafetyBoundary,
    extractSubject: extractSubject,
  };
})(window);
