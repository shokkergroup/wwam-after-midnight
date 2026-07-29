(function (root) {
  "use strict";

  var SCHEMA = "wwam-feldman-recap/v1";
  var VERSION = "1.1.1";

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
      return "This is an indexed topic map, not a synthetic show verdict: " + lead +
        " build a " + acts + "-stop route through the available source.";
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

  function sectionBody(section, sourceId, duration) {
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
    var detail = topics ? " Also indexed in this window: " + topics + "." : "";
    if (characters) {
      detail += " The same window carries " +
        (charactersList.length === 1 ? "a named character receipt for " : "named character receipts for ") +
        characters + "; that identifies the bit, not the performer.";
    }
    if (clean(section.category) === "topic") {
      return "At " + time + ", the " + stretch + " opens a topic door for " + subject + "." +
        (excerpt ? " The caption window catches " + excerpt + "." :
          " The timestamp confirms the subject without inventing an opinion.") + detail;
    }
    if (clean(section.category) === "character") {
      return "At " + time + ", " + subject + " enters the " + stretch + " case file." +
        (excerpt ? " The caption window catches " + excerpt + "." : "") +
        " This receipt names the character bit; playback decides the voice." + detail;
    }
    var beat = (displayLabel(section.beat) || anchor).toUpperCase();
    var lead = "At " + time + ", the " + stretch + " spikes under " + anchor + ".";
    var subjectMatchesAnchor = displayLabel(subject).toLowerCase() ===
      displayLabel(anchor).toLowerCase();
    if (/LOVE LETTER|DEFEND|PRAISE/.test(beat)) {
      lead = subjectMatchesAnchor ?
        "At " + time + ", the " + stretch + " files a defense exhibit." :
        "At " + time + ", the " + stretch + " files a defense exhibit under " + subject + ".";
    } else if (/FRANCHISE FELONY|STEVE|HATE|NEGATIVE/.test(beat)) {
      lead = subjectMatchesAnchor ?
        "At " + time + ", the " + stretch + " heads toward Steve's paperwork." :
        "At " + time + ", the " + stretch + " sends " + subject + " toward Steve's paperwork.";
    } else if (/THEORY|PREDICTION/.test(beat)) {
      lead = subjectMatchesAnchor ?
        "At " + time + ", the " + stretch + " adds red string to the case file." :
        "At " + time + ", the " + stretch + " adds red string to " + subject + ".";
    } else if (/UP IN YA|OUT OF POCKET|FULL SEND/.test(beat)) {
      lead = subjectMatchesAnchor ?
        "At " + time + ", adult supervision leaves the " + stretch + " under " + anchor + "." :
        "At " + time + ", " + subject + " loses adult supervision in the " +
          stretch + " under " + anchor + ".";
    } else if (/ROOM BREAK|BREAKDOWN/.test(beat)) {
      lead = subjectMatchesAnchor ?
        "At " + time + ", the " + stretch + " files a room-breaker." :
        "At " + time + ", the " + stretch + " files a room-breaker under " + subject + ".";
    } else if (/TAKE GETS NUCLEAR/.test(beat)) {
      lead = subjectMatchesAnchor ?
        "At " + time + ", the " + stretch + " catches fire under a Take Gets Nuclear marker." :
        "At " + time + ", the " + stretch + " catches fire under " + subject + ".";
    }
    return lead + (excerpt ?
      " The preserved caption nugget is " + excerpt + "." :
      " Playback carries the delivery and surrounding context.") + detail;
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
    return opening + subject + heat + route + scope + color;
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
      sections: [],
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
        body: sectionBody(section, map.sourceId, number(record(map.metadata).duration)),
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
      sections: sections,
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
