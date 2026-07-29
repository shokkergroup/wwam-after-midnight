(function (root) {
  "use strict";

  var SCHEMA = "wwam-feldman-recap/v1";
  var VERSION = "1.2.0";

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function hash(value) {
    var text = clean(value);
    var output = 2166136261;
    for (var index = 0; index < text.length; index += 1) {
      output ^= text.charCodeAt(index);
      output = Math.imul(output, 16777619);
    }
    return output >>> 0;
  }

  function choice(seed, values) {
    return values[hash(seed) % values.length];
  }

  function clock(seconds) {
    var total = Math.max(0, Math.round(number(seconds)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var remainder = total % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : String(minutes)) +
      ":" + String(remainder).padStart(2, "0");
  }

  function runtime(seconds) {
    var minutes = Math.max(1, Math.round(number(seconds) / 60));
    var hours = Math.floor(minutes / 60);
    var remainder = minutes % 60;
    return hours ? hours + " hr" + (remainder ? " " + remainder + " min" : "") :
      minutes + " min";
  }

  function list(values, fallback) {
    var unique = [];
    array(values).map(clean).filter(Boolean).forEach(function (value) {
      if (unique.indexOf(value) < 0) unique.push(value);
    });
    if (!unique.length) return fallback !== undefined ? clean(fallback) : "the registered tape";
    if (unique.length === 1) return unique[0];
    if (unique.length === 2) return unique[0] + " and " + unique[1];
    return unique.slice(0, -1).join(", ") + ", and " + unique[unique.length - 1];
  }

  function titleCase(value) {
    return clean(value).toLowerCase().replace(/\b[a-z]/g, function (letter) {
      return letter.toUpperCase();
    });
  }

  function displayLabel(value) {
    return clean(value)
      .replace(/^(?:TOPIC|CHARACTER PERFORMANCE|CHARACTER|MOMENT)\s*:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function displayLabels(values) {
    return array(values).map(displayLabel).filter(Boolean);
  }

  function quote(value, limit) {
    var text = clean(value)
      .replace(/^[\s.…]+|[\s.…]+$/g, "")
      .replace(/\s+/g, " ");
    if (!text) return "";
    var words = text.split(/\s+/);
    var shown = words.slice(0, Math.max(1, limit || 18));
    return "“" + shown.join(" ") + (words.length > shown.length ? "…" : "") + "”";
  }

  function phase(at, duration) {
    var ratio = number(duration) ? number(at) / number(duration) : 0;
    if (ratio < 0.15) return "opening stretch";
    if (ratio < 0.42) return "first half";
    if (ratio < 0.62) return "midpoint";
    if (ratio < 0.85) return "back half";
    return "final stretch";
  }

  function plural(count, one, many) {
    return number(count) === 1 ? one : many;
  }

  function headline(map) {
    var topics = displayLabels(map.topics);
    if (topics.length >= 2) {
      return choice(map.sourceId + "|headline|two", [
        topics[0] + " ON THE MARQUEE. " + topics[1] + " IN THE GETAWAY CAR.",
        topics[0] + " IN THE TITLE CARD. " + topics[1] + " AFTER THE COPS LEAVE.",
        topics[0] + " AFTER MIDNIGHT. " + topics[1] + " UNDER NO SUPERVISION.",
        topics[0] + " // " + topics[1] + " // ONE NIGHT WITH NO SAFE DISTANCE.",
        topics[0] + " IN THE FRONT WINDOW. " + topics[1] + " BEHIND THE COUNTER.",
        topics[0] + " ON AISLE ONE. " + topics[1] + " IN THE POLICE REPORT.",
        topics[0] + " AT CLOSING TIME. " + topics[1] + " WITH THE SECURITY FOOTAGE.",
        topics[0] + " ABOVE THE FOLD. " + topics[1] + " BELOW THE FLOORBOARDS.",
      ]).toUpperCase();
    }
    if (topics.length === 1) {
      return (topics[0] + ". ONE NIGHT. ZERO SAFE DISTANCE.").toUpperCase();
    }
    return "THE NIGHT SHIFT LEFT A RECEIPT.";
  }

  function deck(map) {
    var topics = displayLabels(map.topics);
    var lead = list(topics.slice(0, 3), "the night's movie talk");
    var file = record(map.caseFile);
    var acts = number(file.actCount) || array(map.sections).length;
    var receipts = number(file.receiptCount) || number(record(map.coverage).receipts);
    if (clean(map.mode) === "topic-recap") {
      return "This is a source-linked topic map: " + lead +
        " build a " + acts + "-stop route through the subjects named on the tape.";
    }
    if (clean(record(map.format).id) === "movie-commentary") {
      return lead + " anchor a " + acts +
        "-act watchalong file tracking the defense, the prosecution, and the after-midnight derailments.";
    }
    if (clean(record(map.format).id) === "ranking-show") {
      return receipts + " registered receipts follow " + lead +
        " through the bracket fights, robberies, and final indexed turn.";
    }
    return receipts + " source-linked receipts build a " + acts +
      "-act route through " + lead + ", with every stop wired back to playback.";
  }

  function sectionLabel(section, index, total, sourceId, duration) {
    var subject = displayLabel(section.subject) ||
      displayLabels(section.topicLabels)[0] ||
      displayLabels(section.characterLabels)[0] ||
      displayLabel(section.anchor) || "SAVED CHECKPOINT";
    var progress = number(duration) ? number(section.at) / number(duration) : 0;
    if (index === 0) {
      return (progress <= 0.15 ? "COLD OPEN" : "FIRST INDEXED STOP") + " // " + subject;
    }
    if (index === total - 1) {
      return (progress >= 0.85 ? "LAST WORD" : "FINAL INDEXED STOP") + " // " + subject;
    }
    var beat = (displayLabel(section.beat) || displayLabel(section.anchor) ||
      clean(section.category)).toUpperCase();
    var prefix = "PLAYABLE TURN";
    if (/LOVE LETTER|DEFEND|PRAISE/.test(beat)) prefix = "THE DEFENSE RESTS";
    else if (/FRANCHISE FELONY|STEVE|HATE|NEGATIVE/.test(beat)) {
      prefix = "STEVE RECEIVES THE EVIDENCE";
    } else if (/FILM READ|ANALYSIS|CRAFT/.test(beat)) {
      prefix = "THE MOVIE GOES UNDER THE KNIFE";
    } else if (/THEORY|PREDICTION/.test(beat)) prefix = "RED STRING ON THE WALL";
    else if (/UP IN YA|OUT OF POCKET/.test(beat)) prefix = "WWAM UP IN YA";
    else if (/ROOM BREAK|BREAKDOWN/.test(beat)) prefix = "THE ROOM LOSES IT";
    else if (/TAKE GETS NUCLEAR/.test(beat)) prefix = "THE TAKE CATCHES FIRE";
    else if (/FULL SEND/.test(beat)) prefix = "THE BRAKES LEAVE THE BUILDING";
    else if (/KILL ROOM/.test(beat)) prefix = "THE KILL ROOM OPENS";
    else if (clean(section.category) === "character") prefix = "CHARACTER BIT";
    else if (clean(section.category) === "topic") prefix = "ON THE MARQUEE";
    return prefix + " // " + subject;
  }

  function sectionBody(section, sourceId, duration, formatId) {
    if (clean(section.sourceBody)) return clean(section.sourceBody);
    var time = clock(section.at);
    var anchor = titleCase(displayLabel(section.anchor)) || "Saved Checkpoint";
    var subjects = displayLabels(section.topicLabels);
    var charactersList = displayLabels(section.characterLabels);
    var subject = titleCase(displayLabel(section.subject) || subjects[0] ||
      charactersList[0] || anchor);
    var topics = list(subjects.filter(function (value) {
      return displayLabel(value).toLowerCase() !== displayLabel(subject).toLowerCase();
    }), "");
    var characters = list(charactersList, "");
    var excerpt = quote(section.excerpt, 18);
    var stretch = phase(section.at, duration);
    var desk = storyDesk(formatId);
    var seed = sourceId + "|act-body|" + clean(section.id) + "|" + time;
    var detail = topics ? " Also in the same stretch: " + topics + "." : "";
    if (characters) {
      detail += " " + choice(seed + "|character-context", [
        "Character callbacks in this window include " + characters +
          "; the source audio—not this page—settles the performance.",
        "The character track adds " + characters +
          "; playback carries the voice and context.",
        "The tape tags " + characters +
          " as a character bit; no host attribution is added here.",
        "Character names in this stretch: " + characters +
          ". Press play for the actual delivery.",
        "The callback list adds " + characters +
          "; the clip keeps custody of who says it and how.",
        "This stretch includes " + characters +
          " as a character callback; the evidence button opens the real performance context.",
        "The character lane crosses paths with " + characters +
          " here; the linked source supplies the speaker and delivery.",
        "This window adds " + characters +
          " to the character lane; attribution stays with the tape.",
        "Callbacks involving " + characters +
          " land here; playback—not guesswork—identifies the voice.",
        "The show drops character callbacks involving " + characters +
          " in this stretch; the original clip carries the performance.",
        "This chapter names " + characters +
          " on the character track; the source keeps the casting answer.",
        "A character cue points to " + characters +
          " here; one click restores the full delivery.",
        "The callback board catches " + characters +
          "; the tape remains the authority on who performs it.",
        "Character markers for " + characters +
          " sit in this window; the evidence clip provides the voice.",
        "The character route reaches " + characters +
          " here; this page leaves speaker identity to playback.",
        "The character thread reaches " + characters +
          "; the source, not a label, supplies the performer context.",
      ]);
    }
    if (clean(section.category) === "topic") {
      var topicLead = choice(seed + "|topic", [
        "At " + time + ", the " + stretch + " puts " + subject + " on the marquee.",
        "At " + time + ", " + subject + " takes over the " + desk + ".",
        "The subject door marked " + subject + " opens at " + time + ".",
        "The conversation turns to " + subject + " at " + time + ".",
        subject + " moves to the front of the room at " + time + ".",
        "Playback reaches " + subject + " during the " + stretch + ".",
        "The " + desk + " calls roll on " + subject + " at " + time + ".",
        "The spotlight moves to " + subject + " at " + time + ".",
        "The next lane opens with " + subject + " at " + time + ".",
        "The room settles onto " + subject + " during the " + stretch + ".",
        "The source brings " + subject + " forward at " + time + ".",
        "The clock lands on " + subject + " at " + time + ".",
        "This chapter pivots toward " + subject + " at " + time + ".",
        subject + " takes the floor at " + time + ".",
        "The tape arrives at " + subject + " in the " + stretch + ".",
        "The conversation finds " + subject + " at " + time + ".",
      ]);
      var topicEvidence = excerpt ? " " + choice(seed + "|topic-evidence", [
        "The exact caption catches " + excerpt + ".",
        "The playable source window opens on " + excerpt + ".",
        "The saved caption receipt reads " + excerpt + ".",
        "One click lands on " + excerpt + ".",
        "The tape preserves " + excerpt + " at that stop.",
        "Its source-linked caption nugget is " + excerpt + ".",
      ]) : " The timestamp establishes the subject; playback carries the take.";
      return topicLead + topicEvidence + detail;
    }
    if (clean(section.category) === "character") {
      var characterLead = choice(seed + "|character", [
        "At " + time + ", " + subject + " enters the " + stretch + " character file.",
        "The source tags a " + subject + " callback at " + time + ".",
        "At " + time + ", the character board lights up for " + subject + ".",
        "The " + desk + " meets " + subject + " at " + time + ".",
        "Playback reaches the " + subject + " bit at " + time + ".",
        subject + " joins the " + stretch + " at " + time + ".",
        "The character lane opens for " + subject + " at " + time + ".",
        "The show turns toward " + subject + " at " + time + ".",
        "A " + subject + " callback lands at " + time + ".",
        "The tape finds " + subject + " during the " + stretch + ".",
        "At " + time + ", " + subject + " walks into the room.",
        "The clock catches a " + subject + " turn at " + time + ".",
      ]);
      var characterEvidence = excerpt ? " " + choice(seed + "|character-evidence", [
        "The caption window catches " + excerpt + ".",
        "Its playable caption nugget is " + excerpt + ".",
        "The exact source receipt preserves " + excerpt + ".",
        "Playback opens on " + excerpt + ".",
      ]) : "";
      return characterLead + characterEvidence + detail;
    }
    var beat = (displayLabel(section.beat) || anchor).toUpperCase();
    var lead = choice(seed + "|generic", [
      "At " + time + ", the " + stretch + " spikes under " + anchor + ".",
      "The incident log flashes " + anchor + " at " + time + ".",
      "At " + time + ", the " + desk + " files " + anchor + ".",
      "The source reaches " + anchor + " at " + time + ".",
      "Playback turns toward " + anchor + " at " + time + ".",
      "The " + stretch + " hits " + anchor + " at " + time + ".",
      anchor + " takes over the room at " + time + ".",
      "The tape swings into " + anchor + " during the " + stretch + ".",
      "At " + time + ", the show opens the " + anchor + " door.",
      "The clock catches " + anchor + " at " + time + ".",
      "The " + desk + " lights up under " + anchor + " at " + time + ".",
      "This chapter finds " + anchor + " at " + time + ".",
    ]);
    var subjectMatchesAnchor = displayLabel(subject).toLowerCase() ===
      displayLabel(anchor).toLowerCase();
    if (/LOVE LETTER|DEFEND|PRAISE/.test(beat)) {
      lead = choice(seed + "|defense", subjectMatchesAnchor ? [
        "At " + time + ", the " + stretch + " files a defense exhibit.",
        "The defense desk opens at " + time + ".",
        "At " + time + ", the tape enters something worth defending.",
        "The " + desk + " submits a positive receipt at " + time + ".",
        "Playback reaches the defense file at " + time + ".",
        "The source puts an exhibit in the good pile at " + time + ".",
      ] : [
        "At " + time + ", the " + stretch + " files a defense exhibit under " + subject + ".",
        "The defense desk opens for " + subject + " at " + time + ".",
        "At " + time + ", " + subject + " enters the tape's defense file.",
        "The " + desk + " puts " + subject + " in the good pile at " + time + ".",
        "Playback reaches the source's " + subject + " defense at " + time + ".",
        "The positive receipt for " + subject + " lands at " + time + ".",
      ]);
    } else if (/FRANCHISE FELONY|STEVE|HATE|NEGATIVE/.test(beat)) {
      lead = choice(seed + "|steve", subjectMatchesAnchor ? [
        "At " + time + ", the " + stretch + " heads toward Steve's paperwork.",
        "Steve's complaint desk opens at " + time + ".",
        "At " + time + ", the source sends a grievance downstairs.",
        "The " + desk + " stamps a negative receipt at " + time + ".",
        "Playback reaches Steve's incoming tray at " + time + ".",
        "The tape files one for the bad pile at " + time + ".",
      ] : [
        "At " + time + ", the " + stretch + " sends " + subject + " toward Steve's paperwork.",
        "Steve's complaint desk receives " + subject + " at " + time + ".",
        "At " + time + ", " + subject + " enters the grievance file.",
        "The " + desk + " stamps " + subject + " for Steve at " + time + ".",
        "Playback delivers " + subject + " to the bad pile at " + time + ".",
        "The negative receipt for " + subject + " lands at " + time + ".",
      ]);
    } else if (/THEORY|PREDICTION/.test(beat)) {
      lead = choice(seed + "|theory", subjectMatchesAnchor ? [
        "At " + time + ", the " + stretch + " adds red string to the case file.",
        "The theory board gets another pin at " + time + ".",
        "At " + time + ", the source opens the speculation drawer.",
        "The " + desk + " reaches a red-string receipt at " + time + ".",
        "Playback clocks a theory turn at " + time + ".",
        "The tape adds one more question mark at " + time + ".",
      ] : [
        "At " + time + ", the " + stretch + " adds red string to " + subject + ".",
        "The theory board pins " + subject + " at " + time + ".",
        "At " + time + ", " + subject + " enters the speculation drawer.",
        "The " + desk + " reaches a " + subject + " theory at " + time + ".",
        "Playback clocks the " + subject + " red-string turn at " + time + ".",
        "The tape adds a question mark beside " + subject + " at " + time + ".",
      ]);
    } else if (/UP IN YA|OUT OF POCKET|FULL SEND/.test(beat)) {
      lead = choice(seed + "|up-in-ya", subjectMatchesAnchor ? [
        "At " + time + ", adult supervision leaves the " + stretch + " under " + anchor + ".",
        "The brakes leave the building at " + time + " under " + anchor + ".",
        "At " + time + ", the incident report gets stamped " + anchor + ".",
        "The " + desk + " loses its chaperone at " + time + ".",
        "Playback reaches the no-supervision zone at " + time + ".",
        "The tape takes the emergency exit at " + time + " under " + anchor + ".",
        "At " + time + ", good judgment misses the bus.",
        "The source enters after-midnight airspace at " + time + ".",
      ] : [
        "At " + time + ", " + subject + " loses adult supervision in the " +
          stretch + " under " + anchor + ".",
        "The brakes leave " + subject + " behind at " + time + ".",
        "At " + time + ", the incident report files " + subject + " under " + anchor + ".",
        "The " + desk + " loses its chaperone around " + subject + " at " + time + ".",
        "Playback reaches the " + subject + " no-supervision zone at " + time + ".",
        "The tape takes an emergency exit through " + subject + " at " + time + ".",
        "At " + time + ", good judgment abandons " + subject + ".",
        "The source sends " + subject + " into after-midnight airspace at " + time + ".",
      ]);
    } else if (/ROOM BREAK|BREAKDOWN/.test(beat)) {
      lead = choice(seed + "|room-break", subjectMatchesAnchor ? [
        "At " + time + ", the " + stretch + " files a room-breaker.",
        "The room loses structural integrity at " + time + ".",
        "At " + time + ", the laughter alarm enters the record.",
        "The " + desk + " tags a room-break at " + time + ".",
        "Playback reaches the point where the room needs repairs at " + time + ".",
        "The tape files a breakdown receipt at " + time + ".",
      ] : [
        "At " + time + ", the " + stretch + " files a room-breaker under " + subject + ".",
        subject + " costs the room its structural integrity at " + time + ".",
        "At " + time + ", the laughter alarm goes off around " + subject + ".",
        "The " + desk + " tags a " + subject + " room-break at " + time + ".",
        "Playback reaches the " + subject + " repair bill at " + time + ".",
        "The tape files " + subject + " as a breakdown receipt at " + time + ".",
      ]);
    } else if (/TAKE GETS NUCLEAR/.test(beat)) {
      lead = choice(seed + "|nuclear", subjectMatchesAnchor ? [
        "At " + time + ", the " + stretch + " catches fire under a Take Gets Nuclear marker.",
        "The take alarm hits red at " + time + ".",
        "At " + time + ", the tape opens the hot-take containment unit.",
        "The " + desk + " registers a nuclear marker at " + time + ".",
        "Playback reaches critical temperature at " + time + ".",
        "The source files a scorched receipt at " + time + ".",
      ] : [
        "At " + time + ", the " + stretch + " catches fire under " + subject + ".",
        "The " + subject + " take alarm hits red at " + time + ".",
        "At " + time + ", the tape puts " + subject + " in hot-take containment.",
        "The " + desk + " registers a nuclear " + subject + " marker at " + time + ".",
        "Playback takes " + subject + " to critical temperature at " + time + ".",
        "The source files a scorched " + subject + " receipt at " + time + ".",
      ]);
    }
    var momentEvidence = excerpt ? " " + choice(seed + "|moment-evidence", [
      "The preserved caption nugget is " + excerpt + ".",
      "The exact-show receipt catches " + excerpt + ".",
      "Playback opens on " + excerpt + ".",
      "The source window preserves " + excerpt + ".",
      "Its playable caption evidence reads " + excerpt + ".",
      "The timestamp lands on " + excerpt + ".",
      "The caption ledger keeps " + excerpt + ".",
      "One click returns to " + excerpt + ".",
    ]) : " Playback carries the delivery and surrounding context.";
    return lead + momentEvidence + detail;
  }

  function storyDesk(formatId) {
    var desks = {
      "anniversary": "anniversary file",
      "horror-news": "movie-news desk",
      "interview": "guest chair",
      "movie-commentary": "watchalong reel",
      "q-and-a": "mailbag",
      "ranking-show": "ranking scorecard",
      "script-reading": "script ledger",
      "spoiler-party": "spoiler desk",
      "trailer-reaction": "trailer desk",
      "versus-show": "fight card",
      "watch-party": "watch-party clock",
    };
    return desks[clean(formatId)] || "after-hours switchboard";
  }

  function storyRoute(values) {
    var items = array(values);
    if (!items.length) return "";
    if (items.length === 1) return "through " + items[0];
    if (items.length === 2) return "from " + items[0] + " to " + items[1];
    return "from " + items[0] + " through " +
      list(items.slice(1, -1), "") + " to " + items[items.length - 1];
  }

  function storyLabel(segment, index, total, sourceId, formatId) {
    var desk = storyDesk(formatId).toUpperCase();
    if (index === 0) {
      return choice(sourceId + "|story-open|" + formatId, [
        "REEL ONE // THE " + desk + " CLOCKS IN",
        "REEL ONE // THE " + desk + " FINDS THE ON SWITCH",
        "REEL ONE // BEFORE THE EVIDENCE BAG STARTS TALKING",
        "REEL ONE // THE FRONT DOOR IS STILL TECHNICALLY ATTACHED",
        "REEL ONE // OPENING NIGHT NEEDS AN INCIDENT NUMBER",
        "REEL ONE // THE SOURCE HITS PLAY AFTER CURFEW",
        "REEL ONE // THE FIRST RECEIPT WALKS INTO THE ROOM",
        "REEL ONE // SOMEBODY LEFT THE " + desk + " RUNNING",
      ]);
    }
    if (index === total - 1) {
      return choice(sourceId + "|story-close|" + formatId, [
        "LAST REEL // THE " + desk + " FILES OVERTIME",
        "LAST REEL // CLOSING TIME NEEDS A LAWYER",
        "LAST REEL // THE SECURITY FOOTAGE KEEPS ROLLING",
        "LAST REEL // SOMEBODY CALL THE VIDEO STORE",
        "LAST REEL // THE FINAL RECEIPT REFUSES TO LEAVE",
        "LAST REEL // THE SOURCE GETS THE LAST WORD",
        "LAST REEL // REWIND IS NOW PART OF THE SENTENCE",
        "LAST REEL // THE " + desk + " TURNS OUT THE LIGHTS",
      ]);
    }
    return choice(sourceId + "|story-middle|" + index + "|" + formatId, [
      "REEL " + (index + 1) + " // THE NIGHT STOPS PRETENDING TO BE NORMAL",
      "REEL " + (index + 1) + " // THE TOPIC BOARD NEEDS MORE RED STRING",
      "REEL " + (index + 1) + " // ADULT SUPERVISION MISSES ANOTHER EXIT",
      "REEL " + (index + 1) + " // THE INCIDENT REPORT GETS A SEQUEL",
      "REEL " + (index + 1) + " // THE " + desk + " LOSES ITS ALIBI",
      "REEL " + (index + 1) + " // ANOTHER RECEIPT ENTERS THE CHAT",
      "REEL " + (index + 1) + " // THE SOURCE TAKES A HARD LEFT",
      "REEL " + (index + 1) + " // THE EVIDENCE CART HITS A SPEED BUMP",
      "REEL " + (index + 1) + " // THE " + desk + " STAYS AFTER CLOSING",
      "REEL " + (index + 1) + " // THE NEXT AISLE HAS QUESTIONS",
    ]);
  }

  function storyBody(segment, index, total, sourceId, formatId) {
    var topics = displayLabels(segment.topicLabels);
    var moments = displayLabels(segment.momentLabels);
    var characters = displayLabels(segment.characterLabels);
    var from = clock(segment.at);
    var to = clock(segment.end);
    var desk = storyDesk(formatId);
    var leadOptions = [
      "The " + desk + " clocks this reel from " + from + " to " + to + ".",
      "From " + from + " to " + to + ", the " + desk + " keeps the register open.",
      "The source stays on the " + desk + " between " + from + " and " + to + ".",
      "This reel takes the " + desk + " from " + from + " to " + to + ".",
      "At " + from + ", the " + desk + " opens; this chapter lands at " + to + ".",
      "The cameras stay with this reel from " + from + " through " + to + ".",
      "This chapter of the source runs " + from + " to " + to + " on the " + desk + ".",
      "The tape holds this reel inside " + from + "–" + to + ".",
      "Playback brackets this part of the night between " + from + " and " + to + ".",
      "The next stretch begins at " + from + " and checks out at " + to + ".",
      "The " + desk + " inherits the tape at " + from + " and holds it through " + to + ".",
      "The night crosses " + from + "–" + to + " before this reel lets go.",
      "This part of the show lives between " + from + " and " + to + ".",
      "The clock enters at " + from + " and leaves this chapter at " + to + ".",
      "From " + from + " onward, the conversation stays with the " + desk +
        " until " + to + ".",
      "Rewind to " + from + " and ride this chapter through " + to + ".",
      "The chapter opens at " + from + " and hands the tape back at " + to + ".",
      "The show settles into the " + desk + " at " + from +
        " and moves on at " + to + ".",
      "This pass through the " + desk + " starts at " + from +
        " and clears at " + to + ".",
      "The " + desk + " owns the clock from " + from + " through " + to + ".",
      "The source gives this chapter the window between " + from + " and " + to + ".",
      "Between " + from + " and " + to + ", the " + desk + " has the floor.",
      "The room moves onto the " + desk + " at " + from +
        " and stays there until " + to + ".",
      "The route through this reel opens at " + from + " and closes at " + to + ".",
    ];
    if (index === total - 1) {
      leadOptions = [
        "The last chapter keeps the " + desk + " open from " + from + " to " + to + ".",
        "Closing time catches the source between " + from + " and " + to + ".",
        "The " + desk + " opens its last reel at " + from + " and checks out at " + to + ".",
        "The last lap covers " + from + " through " + to + ".",
        "This route reaches its closing reel at " + from + " and holds through " + to + ".",
        "The final time window runs " + from + "–" + to + ".",
        "The " + desk + " carries the finish from " + from + " to " + to + ".",
        "The closing stretch starts at " + from + " and releases the tape at " + to + ".",
        "The last part of the show lives between " + from + " and " + to + ".",
        "From " + from + " onward, the " + desk + " takes the closing shift to " + to + ".",
        "The tape reaches its last doorway at " + from + " and exits at " + to + ".",
        "The final chapter clocks in at " + from + " and signs off at " + to + ".",
        "Playback enters the home stretch at " + from + " and lands at " + to + ".",
        "The room stays with the " + desk + " from " + from + " until " + to + ".",
        "The source saves its closing window for " + from + " through " + to + ".",
        "One last reel runs from " + from + " to " + to + " on the " + desk + ".",
      ];
    }
    var lead = choice(sourceId + "|story-lead|" + index + "|" + formatId, leadOptions);
    var topicLine = topics.length ? " " +
      choice(sourceId + "|story-topics|" + index, [
        "The named subject route runs " + storyRoute(topics) + ".",
        "The conversation turns to " + list(topics, "") + ".",
        "This stretch moves through " + topics.join(" → ") + ".",
        "The reel follows " + list(topics, "") + ".",
        "Across these minutes, the talk carries " + list(topics, "") + ".",
        "On screen for this chapter: " + list(topics, "") + ".",
        "The room circles " + list(topics, "") + ".",
        "The subject map moves " + storyRoute(topics) + ".",
        "The tape winds " + storyRoute(topics) + ".",
        "This part of the show links " + list(topics, "") + ".",
        "The night makes room for " + list(topics, "") + ".",
        "The chapter checks in with " + list(topics, "") + ".",
      ]) :
      " No named subject is attached to this reel, so the chapter stays with the clock.";
    var momentLine = moments.length ? " " +
      choice(sourceId + "|story-moments|" + index, [
        "The replay list catches " + list(moments, "") + ".",
        "The incident log flags " + list(moments, "") + ".",
        "The biggest detours here are " + list(moments, "") + ".",
        "The tape also lights up for " + list(moments, "") + ".",
        "Filed under moments worth replaying: " + list(moments, "") + ".",
        "The chapter's sharpest turns are " + list(moments, "") + ".",
        "The moments that break the straight line are " + list(moments, "") + ".",
        "This reel saves a seat for " + list(moments, "") + ".",
        "The after-midnight alarms go off for " + list(moments, "") + ".",
        "The route gets louder around " + list(moments, "") + ".",
        "The show leaves replay marks on " + list(moments, "") + ".",
        "The trouble spots worth another look are " + list(moments, "") + ".",
      ]) : "";
    var characterLine = characters.length ? " " +
      choice(sourceId + "|story-characters|" + index, [
        "The character file logs " + list(characters, "") + "; those names identify the bit, not a performer.",
        "Character receipts add " + list(characters, "") + " to the case file, without assigning a performer.",
        "The character track includes " + list(characters, "") +
          "; the linked clip carries the actual delivery.",
        "Also on the character board: " + list(characters, "") + ". The label follows the bit, never a performer claim.",
        "The source index tags " + list(characters, "") + " as character callbacks; the tape decides the delivery.",
        "Character evidence names " + list(characters, "") + ", with performer identity deliberately left to playback.",
      ]) : "";
    var excerpt = quote(segment.excerpt, 18);
    var evidenceLine = excerpt ?
      " " + choice(sourceId + "|story-evidence|" + index, [
        "The exact evidence button lands at " + clock(segment.anchorAt) + " on " + excerpt + ".",
        "At " + clock(segment.anchorAt) + ", the playable caption window catches " + excerpt + ".",
        "The reel's playback anchor is " + clock(segment.anchorAt) + ": " + excerpt + ".",
        "One click opens the source at " + clock(segment.anchorAt) + ", where the caption reads " + excerpt + ".",
        "The source receipt at " + clock(segment.anchorAt) + " preserves " + excerpt + ".",
        "The strongest playable caption stop sits at " + clock(segment.anchorAt) + " with " + excerpt + ".",
        "Evidence playback starts at " + clock(segment.anchorAt) + " on " + excerpt + ".",
        "The exact-show receipt at " + clock(segment.anchorAt) + " catches " + excerpt + ".",
      ]) :
      " The evidence button still opens the exact source at " +
        clock(segment.anchorAt) + "; no public excerpt is exposed here.";
    var close;
    if (index === total - 1) {
      var finalOpen = choice(sourceId + "|story-final-open|" + formatId, [
        "The lights come up",
        "Closing time finally arrives",
        "The counter goes dark",
        "The last reel reaches the door",
        "The room calls last orders",
        "The night files for overtime",
        "The final frame leaves the screen",
        "The " + desk + " turns out its lamp",
        "The credits can start rolling",
        "The last chapter checks the clock",
        "The video-store bell rings once more",
        "The rewind button gets the final vote",
        "The closing reel stops here",
        "The after-hours shift signs off",
        "The closing bell lands",
        "The chapter reaches its last doorway",
      ]);
      var finalHandOff = choice(sourceId + "|story-final-hand-off|" + formatId, [
        "the upload keeps the final word",
        "playback still owns the context",
        "the source remains one click away",
        "rewind is the only honest appeal",
        "the tape gets the last say",
        "the evidence button carries the rest",
        "the show, not this page, owns what comes next",
        "one click returns the whole room",
        "the source keeps custody of the ending",
        "the final handoff belongs to playback",
        "the original upload holds the closing argument",
        "the tape is still the authority",
        "the page steps aside for the show",
        "the full context stays with the source",
        "the next move is to press play",
        "the complete exchange remains on the tape",
      ]);
      close = " " + finalOpen + "; " + finalHandOff + ".";
    } else {
      var bridgeOpen = choice(
        sourceId + "|story-bridge-open|" + index + "|" + formatId,
        [
          "The tape keeps moving",
          "The night has one more door",
          "That checkpoint hands off cleanly",
          "The counter is not closed yet",
          "Playback keeps the room open",
          "The next aisle is already lit",
          "That receipt clears the counter",
          "The reel change happens on the source",
          "The file stays in motion",
          "The timestamp trail keeps going",
          "The conversation is not done yet",
          "That chapter leaves the lights on",
          "The " + desk + " keeps the late shift",
          "The purple jacket objects to closing time",
          "The show refuses to clock out",
          "That turn leaves another door unlocked",
        ],
      );
      var bridgeHandOff = choice(
        sourceId + "|story-bridge-hand-off|" + index + "|" + formatId,
        [
          "the next reel takes it from here",
          "another source-linked stop is waiting",
          "playback supplies the handoff",
          "the following timestamp opens the next door",
          "one more evidence button is already queued",
          "the next chapter inherits the clock",
          "another verified stop follows",
          "the source has the next move",
          "the route continues at the next timestamp",
          "the following reel picks up the thread",
          "the next checkpoint is one click away",
          "the upload carries the story forward",
          "another chapter is waiting down the hall",
          "the next turn is already on the tape",
          "one more reel has something to say",
          "the source opens the following door",
        ],
      );
      close = " " + bridgeOpen + "; " + bridgeHandOff + ".";
    }
    return lead + topicLine + momentLine + characterLine + evidenceLine + close;
  }

  function readyOverview(map) {
    var metadata = record(map.metadata);
    var topics = displayLabels(map.topics);
    var file = record(map.caseFile);
    var strongest = record(array(map.bestMoments)[0]);
    var sections = array(map.sections);
    var receiptCount = number(file.receiptCount) || number(record(map.coverage).receipts);
    var topicCount = number(file.topicCount);
    var momentCount = number(file.momentCount);
    var characterCount = number(file.characterCount);
    var opening = metadata.title + " runs " + runtime(metadata.duration) + " and leaves " +
      receiptCount + " source-linked " + plural(receiptCount, "receipt", "receipts") +
      " on the counter: " + topicCount + " topic " + plural(topicCount, "door", "doors") +
      ", " + momentCount + " saved " + plural(momentCount, "spike", "spikes") +
      ", and " + characterCount + " named character " +
      plural(characterCount, "lead", "leads") + ".";
    var subject = topics.length ?
      " " + topics[0] + " leads the index" +
        (topics.length > 1 ? "; " + list(topics.slice(1, 4), "") + " keep crossing the route." : ".") :
      " The available receipts do not establish a dominant topic.";
    var heat = clean(strongest.label) ?
      " The hottest saved turn is " + titleCase(displayLabel(strongest.label)) +
        " at " + clock(strongest.at) +
        (quote(strongest.excerpt, 14) ? ", where the caption window catches " +
          quote(strongest.excerpt, 14) : "") + "." : "";
    var route = sections.length ?
      " " + sections.length + " playable acts span " + number(file.tapeSpanPercent) +
        "% of the indexed runtime, from " + titleCase(displayLabel(sections[0].subject) ||
          displayLabel(sections[0].anchor)) + " to " +
        titleCase(displayLabel(sections[sections.length - 1].subject) ||
          displayLabel(sections[sections.length - 1].anchor)) + "." : "";
    var story = number(file.storySegmentCount) && number(file.storyReceiptCount) ?
      " The full written route carries " + number(file.storyReceiptCount) + " of " +
        receiptCount + " registered receipts across " + number(file.storySegmentCount) +
        " chronological " + plural(file.storySegmentCount, "reel", "reels") + "." : "";
    if (clean(map.guideOverview)) {
      return clean(map.guideOverview) + " " +
        choice(map.sourceId + "|guide-close", [
          "The Feldman file adds playable chapters without separating the jokes from their original room.",
          "The purple jacket is zipped, the chapters are chronological, and every turn still opens the source.",
          "This one graduates from a timestamp bucket into a full episode story.",
        ]);
    }
    var color = choice(map.sourceId + "|overview-color|" + receiptCount, [
      " The video-store clerk is not explaining why the evidence bag smells like popcorn.",
      " Somebody locked the front door, and the conversation kept finding new aisles.",
      " By closing time, the topic board needs its own incident report.",
      " The night begins as programming and ends as something the security camera remembers.",
      " The archive found a spine, several hard left turns, and one very nervous late-fee policy.",
      " No one approved the route; the timestamps simply kept opening doors.",
    ]);
    var scope = clean(map.mode) === "topic-recap" ?
      " This is a topic map rather than a full-opinion chronicle; it identifies doors, not verdicts." : "";
    return opening + subject + heat + route + story + scope + color;
  }

  function heldRecap(map) {
    var metadata = record(map.metadata);
    return {
      schema: SCHEMA,
      generatorVersion: VERSION,
      coreSchema: clean(map.schema),
      sourceId: map.sourceId,
      sourceFingerprint: map.sourceFingerprint,
      semanticFingerprint: map.semanticFingerprint,
      state: "held",
      tier: "source-safe-held",
      label: "EPISODE RECAP",
      badge: "RECAP WAITING ON THE TAPE",
      headline: "THE UPLOAD IS REAL. THE RECAP ISN'T READY TO LIE FOR IT.",
      deck: metadata.title + " is registered, playable, and waiting for source-local captions.",
      overview: "The official source record confirms a " + runtime(metadata.duration) +
        " upload dated " + clean(metadata.date) + ". The archive does not have a usable local caption map, so this file describes no scenes, jokes, reactions, speakers, topics, or verdicts. The paperwork is filed; the tape is still outside arguing with security.",
      topics: [],
      sections: [],
      story: [],
      bestMoments: [],
      fanRead: {},
      caseFile: map.caseFile,
      coverage: map.coverage,
      format: map.format,
      limitations: map.limitations,
      approval: {
        meaning: "wwam-editorial-parody-label",
        actualApproval: false,
        disclosure: "A recurring-bit-inspired archive label, not an endorsement by Corey Feldman, Mike, J, or WWAM.",
      },
    };
  }

  function fanRead(map) {
    var specs = [
      ["loved", "WHAT THE TAPE DEFENDED"],
      ["hated", "STRAIGHT TO STEVE'S ASSHOLE"],
      ["wildestDetour", "WWAM UP IN YA"],
      ["lastWord", "THE LAST WORD"],
    ];
    return specs.reduce(function (output, spec) {
      var item = record(record(map.fanRead)[spec[0]]);
      if (!clean(item.receiptKey) && !clean(item.guideCutId)) return output;
      var itemTopic = displayLabel(item.topic) || displayLabel(item.label) || spec[1];
      var excerpt = quote(item.excerpt, 16);
      var label = spec[1];
      if (spec[0] === "lastWord" && number(record(map.metadata).duration) &&
          number(item.at) / number(record(map.metadata).duration) < 0.85) {
        label = "FINAL INDEXED WORD";
      }
      var generatedBody = "";
      if (spec[0] === "hated") {
        generatedBody = "At " + clock(item.at) + ", Steve receives the " + itemTopic +
          " paperwork" + (excerpt ? ": " + excerpt + "." : ".");
      } else if (spec[0] === "wildestDetour") {
        generatedBody = "Adult supervision exits at " + clock(item.at) +
          (excerpt ? ", leaving " + excerpt + " in the incident report." : ".");
      } else if (spec[0] === "lastWord") {
        generatedBody = "The final indexed turn lands at " + clock(item.at) +
          (excerpt ? " with " + excerpt + "." : ".");
      } else {
        generatedBody = "The defense exhibit opens at " + clock(item.at) +
          (excerpt ? " on " + excerpt + "." : ".");
      }
      output[spec[0]] = {
        label: label,
        topic: itemTopic,
        body: clean(item.body) || generatedBody,
        at: number(item.at),
        end: number(item.end),
        receiptKey: clean(item.receiptKey),
        guideCutId: clean(item.guideCutId),
        excerpt: clean(item.excerpt),
        evidenceBasis: clean(item.evidenceBasis),
      };
      return output;
    }, {});
  }

  function build(input) {
    input = record(input);
    var map = record(input.map || input.episodeRecap);
    if (clean(map.schema) !== "shokker-episode-recap/v1") {
      throw new Error("WWAM Episode Recap Adapter requires shokker-episode-recap/v1.");
    }
    if (clean(map.evidenceState) !== "ready") return heldRecap(map);
    var seenLabels = {};
    var sections = array(map.sections).map(function (section, index, values) {
      var label = sectionLabel(
        section,
        index,
        values.length,
        map.sourceId,
        number(record(map.metadata).duration)
      );
      var labelKey = label.toLowerCase();
      seenLabels[labelKey] = (seenLabels[labelKey] || 0) + 1;
      if (seenLabels[labelKey] > 1) {
        label += " // RETURN " + seenLabels[labelKey];
      }
      return {
        id: clean(section.id),
        ordinal: index + 1,
        label: label,
        body: sectionBody(
          section,
          map.sourceId,
          number(record(map.metadata).duration),
          clean(record(map.format).id)
        ),
        at: number(section.at),
        end: number(section.end),
        anchor: clean(section.anchor),
        category: clean(section.category),
        excerpt: clean(section.excerpt),
        receiptKeys: array(section.receiptKeys).map(clean).filter(Boolean),
        guideCutId: clean(section.guideCutId),
        evidenceBasis: clean(section.evidenceBasis),
      };
    });
    var story = array(map.story).map(function (segment, index, values) {
      return {
        id: clean(segment.id),
        ordinal: index + 1,
        label: storyLabel(
          segment,
          index,
          values.length,
          map.sourceId,
          clean(record(map.format).id)
        ),
        body: storyBody(
          segment,
          index,
          values.length,
          map.sourceId,
          clean(record(map.format).id)
        ),
        at: number(segment.at),
        end: number(segment.end),
        anchorReceiptKey: clean(segment.anchorReceiptKey),
        anchorAt: number(segment.anchorAt),
        anchor: clean(segment.anchor),
        excerpt: clean(segment.excerpt),
        topicLabels: displayLabels(segment.topicLabels),
        momentLabels: displayLabels(segment.momentLabels),
        characterLabels: displayLabels(segment.characterLabels),
        receiptKeys: array(segment.receiptKeys).map(clean).filter(Boolean),
        evidenceBasis: clean(segment.evidenceBasis),
      };
    });
    var tierLabels = {
      "full-chronicle": "FULL CHRONICLE",
      "receipt-recap": "RECEIPT RECAP",
      "topic-recap": "TOPIC-TAPE RECAP",
    };
    return {
      schema: SCHEMA,
      generatorVersion: VERSION,
      coreSchema: clean(map.schema),
      sourceId: map.sourceId,
      sourceFingerprint: map.sourceFingerprint,
      semanticFingerprint: map.semanticFingerprint,
      state: "ready",
      tier: clean(map.mode),
      label: "WWAM FELDMAN APPROVED RECAP",
      badge: tierLabels[map.mode] || "SOURCE-LINKED RECAP",
      headline: headline(map),
      deck: deck(map),
      overview: readyOverview(map),
      topics: displayLabels(map.topics),
      sections: sections,
      story: story,
      bestMoments: array(map.bestMoments),
      fanRead: fanRead(map),
      caseFile: map.caseFile,
      coverage: map.coverage,
      format: map.format,
      limitations: map.limitations,
      approval: {
        meaning: "wwam-editorial-parody-label",
        actualApproval: false,
        disclosure: "A recurring-bit-inspired archive label, not an endorsement by Corey Feldman, Mike, J, or WWAM.",
      },
    };
  }

  root.WWAMEpisodeRecapAdapter = Object.freeze({
    SCHEMA: SCHEMA,
    VERSION: VERSION,
    build: build,
  });
}("undefined" !== typeof window ? window : globalThis));
