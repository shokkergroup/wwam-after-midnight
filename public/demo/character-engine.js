(function (global) {
  "use strict";

  var INTENT_TERMS = {
    danger: ["danger", "evil", "michael", "myers", "kill", "hurt", "attack", "safe", "survive", "threat", "scary"],
    advice: ["advice", "help", "should", "how do", "what do i do", "doctor", "sick", "feel", "fix"],
    opinion: ["think", "opinion", "rate", "rank", "best", "worst", "better", "versus", "vs"],
    career: ["cast", "casting", "role", "movie", "sequel", "band", "song", "soundtrack", "career"],
    relationship: ["love", "date", "marry", "relationship", "girlfriend", "boyfriend", "romance"],
    technology: ["ai", "internet", "youtube", "phone", "computer", "stream", "social media", "app"],
    hypothetical: ["what if", "would you", "could you", "imagine", "suppose"],
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
        "You brought me {subject} and expected reassurance. I have none. I have a flashlight, a warning, and no patience left.",
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

  function detectIntent(question) {
    var q = normalize(question);
    var ranked = Object.keys(INTENT_TERMS).map(function (intent) {
      return {
        intent: intent,
        score: INTENT_TERMS[intent].reduce(function (total, term) {
          return total + (q.indexOf(term) >= 0 ? Math.max(1, term.split(" ").length) : 0);
        }, 0),
      };
    }).sort(function (a, b) { return b.score - a.score; });
    return ranked[0] && ranked[0].score ? ranked[0].intent : "open";
  }

  function extractSubject(question) {
    var subject = String(question || "").trim().replace(/[?!.]+$/g, "");
    subject = subject
      .replace(/^(hey|okay|ok|please)\s+/i, "")
      .replace(/^what\s+should\s+(we|i|you)\s+do\s+about\s+/i, "")
      .replace(/^how\s+should\s+(we|i|you)\s+(deal\s+with|handle|approach)\s+/i, "")
      .replace(/^(what|how|why|where|when|who)\s+(do|does|did|would|could|should|is|are|was|were|can)\s+(you\s+)?/i, "")
      .replace(/^(do|does|did|would|could|should|can)\s+you\s+/i, "")
      .replace(/^(tell me|give me|i want to know)\s+(about\s+)?/i, "")
      .replace(/^(think|feel|say)\s+(about\s+)?/i, "")
      .trim();
    if (!subject) subject = "this entire situation";
    if (subject.length > 78) subject = subject.slice(0, 75).replace(/\s+\S*$/, "") + "…";
    return subject;
  }

  function isFollowup(question) {
    var words = normalize(question).split(" ").filter(Boolean);
    return words.length <= 6 && includesAny(" " + normalize(question) + " ", [
      " it ", " that ", " them ", " this ", " what about ", " how about ", " and if ", " and ",
      " then ", " tomorrow ", " why ",
    ]);
  }

  function profileId(profile) {
    return profile.id || normalize(profile.name).replace(/\s+/g, "-");
  }

  function chooseReceipt(profile, intent, question) {
    var terms = RECEIPT_TERMS[intent] || RECEIPT_TERMS.open;
    var candidates = (profile.soundbytes || []).map(function (receipt) {
      var blob = normalize([receipt.trigger, receipt.note, receipt.excerpt].join(" "));
      var score = terms.reduce(function (total, term) {
        return total + (blob.indexOf(term) >= 0 ? 1 : 0);
      }, 0);
      return { receipt: receipt, score: score };
    }).sort(function (a, b) { return b.score - a.score; });
    if (!candidates.length) return null;
    var bestScore = candidates[0].score;
    var pool = candidates.filter(function (candidate) { return candidate.score === bestScore; });
    return pool[hash(question + profileId(profile) + intent) % pool.length].receipt;
  }

  function groundingMoves(profile, intent) {
    var patterns = (profile.behaviorPatterns || []).map(function (pattern) { return pattern.label; });
    var moves = profile.responseKit && profile.responseKit.moves || [];
    var offset = hash(profileId(profile) + intent) % Math.max(1, patterns.length || moves.length);
    var combined = patterns.concat(moves);
    var selected = [];
    for (var index = 0; index < combined.length && selected.length < 3; index += 1) {
      var value = combined[(offset + index) % combined.length];
      if (value && selected.indexOf(value) < 0) selected.push(value);
    }
    return selected;
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
            error: "That character remains locked until the archive has enough curated performance receipts.",
          };
        }
        var cleaned = String(question || "").trim();
        if (cleaned.length < 2) return { ok: false, error: "Ask a complete question." };
        var intent = detectIntent(cleaned);
        var continuedFrom = Boolean(previous && previous.characterId === characterId &&
          previous.subject && isFollowup(cleaned));
        var subject = continuedFrom ? previous.subject : extractSubject(cleaned);
        var bank = BANKS[characterId] || BANKS.loomis;
        var choices = bank[intent] || bank.open;
        var text = fill(choices[hash(cleaned + characterId + intent) % choices.length], subject);
        var receipt = chooseReceipt(profile, intent, cleaned);
        return {
          ok: true,
          characterId: characterId,
          character: profile.name,
          performer: profile.performedBy || profile.performer || null,
          question: cleaned,
          subject: subject,
          intent: intent,
          continuedFrom: continuedFrom,
          text: text,
          ingredients: groundingMoves(profile, intent),
          receipt: receipt,
          readiness: {
            verifiedSoundbytes: (profile.soundbytes || []).length,
            timestampValidatedReceipts: (profile.soundbytes || []).length,
            clipSpeakersDiarized: false,
            confidence: Math.min(98, 68 + (profile.soundbytes || []).length * 4),
            basis: "Owner-supplied recurring-character mapping plus timestamp-validated curated receipts; clip speakers are not diarized.",
          },
          disclaimer: "FAN-MADE GENERATED RIFF — NOT AN ARCHIVAL QUOTE OR THE HOST SPEAKING",
        };
      },
      getProfile: function (characterId) { return byId[characterId] || null; },
      ids: Object.keys(byId),
    };
  }

  global.WWAMCharacterEngine = {
    create: create,
    detectIntent: detectIntent,
    extractSubject: extractSubject,
  };
})(window);
