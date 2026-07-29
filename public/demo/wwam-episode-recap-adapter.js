(function (root) {
  "use strict";

  var SCHEMA = "wwam-feldman-recap/v1";
  var VERSION = "1.4.0";

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

  function unique(values) {
    var seen = {};
    return array(values).map(clean).filter(Boolean).filter(function (value) {
      var key = value.toLowerCase();
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function list(values, fallback) {
    var items = unique(values);
    if (!items.length) return fallback !== undefined ? clean(fallback) : "the show";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + " and " + items[1];
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }

  function displayLabel(value) {
    return clean(value)
      .replace(/^(?:TOPIC|CHARACTER PERFORMANCE|CHARACTER|MOMENT)\s*:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function displayLabels(values) {
    return unique(array(values).map(displayLabel).filter(Boolean));
  }

  function naturalLabel(value) {
    var text = displayLabel(value);
    if (!text || text !== text.toUpperCase()) return text;
    return text.toLowerCase().replace(/\b[a-z]/g, function (letter) {
      return letter.toUpperCase();
    })
      .replace(/\bWwam\b/g, "WWAM")
      .replace(/\bA24\b/gi, "A24")
      .replace(/\bH20\b/gi, "H20")
      .replace(/\bTv\b/g, "TV")
      .replace(/\bVhs\b/g, "VHS");
  }

  function quotedExcerpt(value, limit) {
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
    if (ratio < 0.62) return "middle";
    if (ratio < 0.85) return "back half";
    return "home stretch";
  }

  function chronologicalSections(map) {
    return array(map.sections).slice().sort(function (left, right) {
      return number(left.at) - number(right.at) ||
        clean(left.id).localeCompare(clean(right.id));
    });
  }

  function sectionSubject(section) {
    return naturalLabel(
      displayLabel(section.subject) ||
      displayLabels(section.topicLabels)[0] ||
      displayLabels(section.characterLabels)[0] ||
      displayLabel(section.anchor) ||
      displayLabels(section.momentLabels)[0] ||
      "the next turn"
    );
  }

  function chronologicalSubjects(map) {
    return unique(chronologicalSections(map).map(sectionSubject).filter(Boolean));
  }

  function recapTopics(map) {
    var sectionTopics = chronologicalSections(map).reduce(function (output, section) {
      return output.concat(displayLabels(section.topicLabels));
    }, []);
    return unique(displayLabels(map.topics).concat(sectionTopics)).map(naturalLabel);
  }

  function recapCharacters(map) {
    return unique(chronologicalSections(map).reduce(function (output, section) {
      return output.concat(displayLabels(section.characterLabels));
    }, [])).map(naturalLabel);
  }

  function recapMoments(map) {
    var strongest = array(map.bestMoments).map(function (moment) {
      return naturalLabel(moment.label);
    });
    var sectionMoments = chronologicalSections(map).reduce(function (output, section) {
      return output.concat(displayLabels(section.momentLabels));
    }, []).map(naturalLabel);
    return unique(strongest.concat(sectionMoments));
  }

  function words(value) {
    return clean(value).toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(function (word) {
        return word.length >= 4 &&
          ["live", "movie", "movies", "watched", "watch", "party", "review",
            "ranking", "ranked", "commentary", "stream", "show", "night"].indexOf(word) < 0;
      });
  }

  function topReplay(map) {
    var candidates = array(map.bestMoments);
    if (!candidates.length) return {};
    var phrases = recapTopics(map).slice(0, 6)
      .concat(recapCharacters(map).slice(0, 4))
      .concat([clean(record(map.metadata).title)]);
    var signalWords = unique(phrases.reduce(function (output, phrase) {
      return output.concat(words(phrase));
    }, []));
    return candidates.map(function (moment, index) {
      var text = (clean(moment.label) + " " + clean(moment.excerpt)).toLowerCase();
      var phraseScore = phrases.reduce(function (score, phrase) {
        var normalized = clean(phrase).toLowerCase();
        return score + (normalized.length >= 5 && text.indexOf(normalized) >= 0 ? 30 : 0);
      }, 0);
      var wordScore = signalWords.reduce(function (score, word) {
        return score + (new RegExp("\\b" + word + "\\b", "i").test(text) ? 8 : 0);
      }, 0);
      return {
        moment: moment,
        score: phraseScore + wordScore + Math.max(0, candidates.length - index),
        index: index,
      };
    }).sort(function (left, right) {
      return right.score - left.score || left.index - right.index;
    })[0].moment;
  }

  function guidePoints(map) {
    var guide = record(map.guideRecap);
    var recap = record(guide.recap);
    return array(guide.takeArc).concat(array(recap.paragraphs)).filter(function (point) {
      return clean(point && (point.topic || point.label)) && number(point && point.at) >= 0;
    }).map(function (point) {
      return {
        at: number(point.at),
        end: number(point.end),
        cutId: clean(point.cutId),
        topic: naturalLabel(point.topic || clean(point.label).split("//")[0]),
        phase: clean(point.phase),
        excerpt: clean(point.excerpt),
      };
    });
  }

  function guidePointForSection(map, section) {
    var points = guidePoints(map);
    var exactCut = points.find(function (point) {
      return clean(section.guideCutId) && point.cutId === clean(section.guideCutId);
    });
    if (exactCut) return exactCut;
    var nearest = points.slice().sort(function (left, right) {
      return Math.abs(left.at - number(section.at)) -
        Math.abs(right.at - number(section.at));
    })[0] || null;
    return nearest && Math.abs(nearest.at - number(section.at)) <= 1 ? nearest : null;
  }

  function guideChronology(map) {
    var guide = record(map.guideRecap);
    var paragraphs = array(record(guide.recap).paragraphs).filter(function (point) {
      return clean(point && point.topic);
    });
    if (!paragraphs.length) return "";
    var points = paragraphs.slice(0, 4).map(function (point) {
      return naturalLabel(point.topic) + " at " + clock(point.at);
    });
    if (points.length === 1) {
      return "The deeper recap plants its flag on " + points[0] + ".";
    }
    if (points.length === 2) {
      return "The deeper recap moves from " + points[0] + " to " + points[1] + ".";
    }
    return "The deeper recap starts with " + points[0] + ", checks in on " +
      list(points.slice(1, -1), "") + ", and closes with " +
      points[points.length - 1] + ".";
  }

  function guideTakeArc(map) {
    var takes = array(record(map.guideRecap).takeArc).filter(function (take) {
      return clean(take && take.label);
    });
    if (takes.length < 2) return "";
    var points = takes.slice(0, 3).map(function (take) {
      return naturalLabel(clean(take.label).split("//")[0]) + " at " + clock(take.at);
    });
    return "The three-beat watch path runs from " + points[0] +
      (points.length > 2 ? ", through " + points[1] : "") +
      ", to " + points[points.length - 1] + ".";
  }

  function headline(map) {
    var metadata = record(map.metadata);
    var topics = recapTopics(map);
    var moments = recapMoments(map);
    var formatId = clean(record(map.format).id);
    var first = topics[0] || naturalLabel(chronologicalSubjects(map)[0]);
    var second = topics[1] || naturalLabel(chronologicalSubjects(map)[1]);
    var third = topics[2] || "";
    var wild = moments[0] || "";
    var seed = map.sourceId + "|feldman-headline|" + topics.join("|") + "|" + wild;
    var tapeTitle = naturalLabel(clean(metadata.title));
    var displayTapeTitle = tapeTitle.length > 78
      ? tapeTitle.slice(0, 75).replace(/\s+\S*$/, "") + "..."
      : tapeTitle;
    var supporting = unique(
      [first, second, third, wild].map(naturalLabel).filter(function (label) {
        return label &&
          label.toLowerCase() !== tapeTitle.toLowerCase();
      })
    );

    if ((formatId === "movie-commentary" || formatId === "watch-party") &&
        tapeTitle) {
      if (supporting.length >= 2) {
        return choice(seed + "|named-tape", [
          displayTapeTitle + " // " + supporting[0] + " // " + supporting[1] +
            " // COMMENTARY PRIVILEGES REVOKED.",
          "THE " + displayTapeTitle + " TAPE // THE MATCH: " +
            supporting[0] + " // THE GASOLINE: " + supporting[1] + ".",
          displayTapeTitle + ": " + supporting[0] + ", " + supporting[1] +
            ", AND A PAUSE BUTTON WITH REGRETS.",
          displayTapeTitle + " AFTER MIDNIGHT // " + supporting[0] +
            " AT THE FRONT DOOR, " + supporting[1] + " IN THE BASEMENT.",
          displayTapeTitle + " // " + supporting[0] + " // " + supporting[1] +
            " // THE MOVIE KEEPS PLAYING ANYWAY.",
          displayTapeTitle + ": " + supporting[0] + " MEETS " + supporting[1] +
            " AND THE WATCHALONG LOSES ITS CURFEW.",
        ]).toUpperCase();
      }
      if (supporting.length === 1) {
        return choice(seed + "|named-tape-one", [
          displayTapeTitle + ": " + supporting[0] + " AFTER MIDNIGHT.",
          displayTapeTitle + " // " + supporting[0] + " // REWIND AT YOUR OWN RISK.",
          "THE " + displayTapeTitle + " TAPE // LAST WORD: " +
            supporting[0] + ".",
        ]).toUpperCase();
      }
      return (displayTapeTitle + " // THE COMMENTARY TRACK WITH THE LIGHTS OFF")
        .toUpperCase();
    }

    if (displayTapeTitle && supporting.length >= 2) {
      if (formatId === "ranking-show" || formatId === "versus-show") {
        return choice(seed + "|named-board", [
          displayTapeTitle + ": " + supporting[0] + " AND " + supporting[1] +
            " HOLD THE BOARD HOSTAGE.",
          displayTapeTitle + " // " + supporting[0] + " VS. " + supporting[1] +
            " // THE BRACKET NEEDS A LAWYER.",
          displayTapeTitle + " // THE MATCH: " + supporting[0] +
            " // THE GASOLINE: " + supporting[1] + ".",
        ]).toUpperCase();
      }
      if (formatId === "trailer-reaction") {
        return choice(seed + "|named-trailer", [
          displayTapeTitle + ": " + supporting[0] + " AT THE FRONT DOOR, " +
            supporting[1] + " IN THE BASEMENT.",
          displayTapeTitle + " // " + supporting[0] + " // " + supporting[1] +
            " // THE TRAILER HAS QUESTIONS.",
          displayTapeTitle + ": " + supporting[0] + ", " + supporting[1] +
            ", AND ONE VERY BUSY PAUSE BUTTON.",
        ]).toUpperCase();
      }
      return choice(seed + "|named-show", [
        displayTapeTitle + " // " + supporting[0] + " AT THE FRONT DOOR // " +
          supporting[1] + " AFTER CURFEW.",
        displayTapeTitle + ": " + supporting[0] + ", " + supporting[1] +
          ", AND NO SENSIBLE EXIT.",
        displayTapeTitle + " // THE NIGHT OPENS WITH " + supporting[0] +
          " AND LEAVES WITH " + supporting[1] + ".",
        displayTapeTitle + " // FIRST CALL: " + supporting[0] +
          " // LAST WORD: " + supporting[1] + ".",
      ]).toUpperCase();
    }
    if (displayTapeTitle && supporting.length === 1) {
      return choice(seed + "|named-show-one", [
        displayTapeTitle + ": " + supporting[0] + " AFTER MIDNIGHT.",
        displayTapeTitle + " // " + supporting[0] + " // THE NIGHT STAYS WEIRD.",
        displayTapeTitle + " // LAST WORD: " + supporting[0] + ".",
      ]).toUpperCase();
    }

    if (first && second && third) {
      return choice(seed, [
        first + ", " + second + ", AND " + third + ": THIS SEEMED NORMAL ON PAPER.",
        first + ". " + second + ". " + third + ". THE HINGES NEVER HAD A CHANCE.",
        first + " // " + second + " // " + third + " // NOBODY CALLS A TIMEOUT.",
        first + " ON THE MARQUEE. " + second + " AND " + third +
          " ON THE 2 A.M. PHONE CALL.",
        first + ", " + second + ", " + third + ": A PERFECTLY REASONABLE WAY TO LOSE A NIGHT.",
        first + " // " + second + " // " + third +
          " // THE ARGUMENT NOW NEEDS A SEQUEL.",
      ]).toUpperCase();
    }
    if (first && second) {
      return choice(seed, [
        first + ". " + second + ". THE NIGHT GETS WEIRD.",
        first + " VS. " + second + ": NO JUDGES, NO GUARDRAILS, NO REFUNDS.",
        first + " ON THE MARQUEE. " + second + " WITH THE LAST WORD.",
        first + " AT THE FRONT DOOR. " + second + " AFTER CURFEW.",
        first + " AND " + second + ": TWO SUBJECTS ENTER, ADULT SUPERVISION LEAVES.",
        first + " ON THE FIRST CALL. " + second + " FROM THE BASEMENT.",
        first + " // " + second + " // THE NIGHT REFUSES TO PICK A LANE.",
        first + " WITH THE MATCH. " + second + " WITH THE GASOLINE.",
      ]).toUpperCase();
    }
    if (first && wild && first.toLowerCase() !== wild.toLowerCase()) {
      return choice(seed, [
        first + ": " + wild + " AFTER MIDNIGHT.",
        first + ". " + wild + ". THEN THE LIGHTS GO OUT.",
        first + " FOR ONE NIGHT. " + wild + " FOR THE POLICE REPORT.",
        first + " // " + wild + " // SOMEBODY HIDE THE REFUND POLICY.",
      ]).toUpperCase();
    }
    if (first) {
      return choice(seed, [
        first + ": ONE NIGHT, ZERO ADULT SUPERVISION.",
        first + " AFTER MIDNIGHT: THE DOOR SHOULD HAVE STAYED LOCKED.",
        first + " FOR THE WHOLE NIGHT: PRIVILEGES IMMEDIATELY REVOKED.",
        first + ": REWIND AT YOUR OWN RISK.",
      ]).toUpperCase();
    }
    var title = clean(metadata.title).replace(/\s+/g, " ").slice(0, 120);
    return (title || "WWAM AFTER MIDNIGHT") + " // THE RECAP WITH THE LIGHTS OFF";
  }

  function deck(map) {
    var topics = recapTopics(map);
    var subjects = chronologicalSubjects(map);
    var strongest = record(topReplay(map));
    var formatId = clean(record(map.format).id);
    var duration = runtime(record(map.metadata).duration);
    var acts = number(record(map.caseFile).actCount) || array(map.sections).length;
    var focus = list(topics.slice(0, 3), "the night's horror and movie talk");
    var opening = naturalLabel(subjects[0] || topics[0]);
    var closing = naturalLabel(subjects[subjects.length - 1] || topics[topics.length - 1]);
    var finish = opening && closing && opening.toLowerCase() !== closing.toLowerCase() ?
      " It moves from " + opening + " to " + closing + " without taking the sensible exit." :
      "";
    var replay = clean(strongest.label) ?
      " The top replay pick waits at " + clock(strongest.at) + "." : "";

    if (clean(map.mode) === "topic-recap") {
      return "A " + duration + " subject-by-subject pass through " + focus + "." +
        finish + " These " + acts +
        " clickable chapters map what comes up; the original tape carries the reactions.";
    }
    if (formatId === "movie-commentary" || formatId === "watch-party") {
      return "A " + duration + " watchalong built around " + focus +
        ", complete with side doors, callbacks, and the turns worth rewinding." +
        finish + replay;
    }
    if (formatId === "ranking-show" || formatId === "versus-show") {
      return "A " + duration + " ranking brawl over " + focus +
        ", where the bracket behaves right up until it absolutely does not." +
        finish + replay;
    }
    if (formatId === "trailer-reaction") {
      return "A " + duration + " trailer-night breakdown covering " + focus +
        ", then following every major turn that survives the first reaction." +
        finish + replay;
    }
    return "A " + duration + " night built around " + focus + ", told in " + acts +
      " clickable chapters instead of one giant wall of video." + finish + replay;
  }

  function sectionLabel(section, index, total, sourceId, duration, formatId) {
    var subject = sectionSubject(section).toUpperCase();
    var progress = number(duration) ? number(section.at) / number(duration) : 0;
    var beat = (displayLabel(section.beat) || displayLabel(section.anchor) ||
      clean(section.category)).toUpperCase();
    var seed = sourceId + "|section-label|" + clean(section.id);
    if (index === 0) {
      return choice(seed + "|opening", progress <= 0.15 ? [
        "COLD OPEN",
        "THE TAPE WAKES UP",
        "FIRST BLOOD",
        "NIGHT SHIFT STARTS",
        "THE DOOR OPENS",
      ] : [
        "FIRST BIG TURN",
        "THE TAPE JOINS IN",
        "THE FIRST HARD LEFT",
        "THE NIGHT GETS MOVING",
      ]) + " // " + subject;
    }
    if (index === total - 1) {
      return choice(seed + "|closing", progress >= 0.85 ? [
        "LAST CALL",
        "LIGHTS OUT",
        "THE FINAL WORD",
        "ONE LAST BODY",
        "THE TAPE CLOCKS OUT",
      ] : [
        "FINAL CHAPTER",
        "CLOSING ARGUMENT",
        "ONE MORE DOOR",
        "THE ENDGAME ARRIVES",
      ]) + " // " + subject;
    }
    if (/LOVE LETTER|DEFEND|PRAISE/.test(beat)) return "WORTH DEFENDING // " + subject;
    if (/FRANCHISE FELONY|STEVE|HATE|NEGATIVE/.test(beat)) {
      return "STRAIGHT TO STEVE'S ASSHOLE // " + subject;
    }
    if (/FILM READ|ANALYSIS|CRAFT/.test(beat)) return "UNDER THE KNIFE // " + subject;
    if (/THEORY|PREDICTION/.test(beat)) return "RED STRING TIME // " + subject;
    if (/UP IN YA|OUT OF POCKET|FULL SEND/.test(beat)) return "WWAM UP IN YA // " + subject;
    if (/ROOM BREAK|BREAKDOWN/.test(beat)) return "THE ROOM BREAKS // " + subject;
    if (/TAKE GETS NUCLEAR/.test(beat)) return "THE TAKE CATCHES FIRE // " + subject;
    if (/KILL ROOM/.test(beat)) return "THE KILL ROOM OPENS // " + subject;
    if (clean(section.category) === "character") {
      return choice(seed + "|character", [
        "CHARACTER BIT",
        "SOMEBODY LET THE CHARACTER IN",
        "THE BIT TAKES THE WHEEL",
        "ANOTHER VOICE FROM THE BASEMENT",
      ]) + " // " + subject;
    }
    if (clean(section.category) === "topic") {
      var formatTopics = {
        "movie-commentary": [
          "SCENE ON TRIAL",
          "THE COMMENTARY CHANGES LANES",
          "ANOTHER BODY ON THE BOARD",
          "THE MOVIE OPENS ANOTHER DOOR",
        ],
        "watch-party": [
          "THE WATCH PARTY TURNS",
          "THE SCREEN OPENS ANOTHER DOOR",
          "ANOTHER BODY ON THE BOARD",
          "THE COUCH TAKES A HARD LEFT",
        ],
        "ranking-show": [
          "NEXT INTO THE BRACKET",
          "THE BOARD GETS BLOODIER",
          "ANOTHER ENTRY FACES JUDGMENT",
          "THE LIST OPENS ANOTHER GRAVE",
        ],
        "versus-show": [
          "NEXT INTO THE FIGHT",
          "THE MATCHUP GETS MEANER",
          "ANOTHER NAME ENTERS THE RING",
          "THE BOARD DEMANDS A VERDICT",
        ],
        "trailer-reaction": [
          "THE TRAILER OPENS ANOTHER FILE",
          "FRAME BY FRAME, THINGS GET WEIRDER",
          "ANOTHER CLUE HITS THE BOARD",
          "THE BREAKDOWN CHANGES LANES",
        ],
        "q-and-a": [
          "ANOTHER QUESTION ESCAPES",
          "THE MAILBAG OPENS A TRAPDOOR",
          "CHAT SENDS IN ANOTHER SUSPECT",
          "THE ANSWER TAKES A HARD LEFT",
        ],
        "horror-news": [
          "NEW HEADLINE, SAME BASEMENT",
          "THE NIGHT OPENS ANOTHER FILE",
          "ANOTHER STORY HITS THE BOARD",
          "THE NEWS TAKES A HARD LEFT",
        ],
      };
      return choice(seed + "|topic|" + clean(formatId), (
        formatTopics[clean(formatId)] || [
          "THE NIGHT OPENS ANOTHER DOOR",
          "NEW SUSPECT, SAME BASEMENT",
          "THE TAPE CHANGES LANES",
          "ANOTHER FILE HITS THE BOARD",
          "THE CONVERSATION TAKES THE STAIRS",
          "THE NEXT WEIRD DOOR",
        ]
      )) + " // " + subject;
    }
    return choice(seed, [
      "THE HARD LEFT // " + subject,
      "THINGS GET LOUDER // " + subject,
      "THE NEXT DOOR // " + subject,
      "WORTH A REWIND // " + subject,
    ]);
  }

  function sectionBody(section, sourceId, duration, formatId, map) {
    var time = clock(section.at);
    var stretch = phase(section.at, duration);
    var guidePoint = guidePointForSection(map, section);
    var subject = naturalLabel(guidePoint && guidePoint.topic) || sectionSubject(section);
    var topics = displayLabels(section.topicLabels).map(naturalLabel);
    var moments = displayLabels(section.momentLabels).map(naturalLabel);
    var characters = displayLabels(section.characterLabels).map(naturalLabel);
    var otherTopics = topics.filter(function (topic) {
      return topic.toLowerCase() !== subject.toLowerCase();
    });
    var excerpt = quotedExcerpt(section.excerpt, 18);
    var beat = (displayLabel(section.beat) || displayLabel(section.anchor) ||
      clean(section.category)).toUpperCase();
    var seed = sourceId + "|act|" + clean(section.id) + "|" + time + "|" + subject;
    var lead;

    if (guidePoint && /OPENING/i.test(guidePoint.phase)) {
      lead = "The episode arc opens at " + time + " with " + subject + ".";
    } else if (guidePoint && /MIDPOINT/i.test(guidePoint.phase)) {
      lead = "The midpoint turn arrives at " + time + " with " + subject + ".";
    } else if (guidePoint && /CLOSING/i.test(guidePoint.phase)) {
      lead = "The closing read lands at " + time + " on " + subject + ".";
    } else if (clean(section.category) === "topic") {
      lead = choice(seed + "|topic", [
        "At " + time + ", " + subject + " takes over the conversation.",
        "The " + stretch + " turns toward " + subject + " at " + time + ".",
        subject + " gets the floor at " + time + ", and the night follows it through the next turn.",
        "Jump to " + time + " for the chapter where " + subject + " moves front and center.",
        "By " + time + ", the conversation has found its way to " + subject + ".",
        subject + " moves into the center of the show at " + time + ".",
        "The next door opens onto " + subject + " at " + time + ".",
        "The " + subject + " chapter begins at " + time + ".",
        "At " + time + ", the night changes lanes for " + subject + ".",
        "The show puts " + subject + " on the table at " + time + ".",
      ]);
    } else if (clean(section.category) === "character") {
      lead = choice(seed + "|character", [
        "At " + time + ", the " + subject + " character bit enters the show.",
        "The " + stretch + " makes room for a " + subject + " callback at " + time + ".",
        "Jump to " + time + " for the " + subject + " turn.",
        subject + " walks into the conversation at " + time + ".",
      ]);
    } else if (/FRANCHISE FELONY|STEVE|HATE|NEGATIVE/.test(beat)) {
      lead = choice(seed + "|steve", [
        "At " + time + ", " + subject +
          " takes the one-way trip Straight to Steve's Asshole.",
        subject + " gets the Straight to Steve's Asshole treatment at " + time + ".",
        "The trapdoor opens under " + subject + " at " + time +
          ": Straight to Steve's Asshole.",
        "By " + time + ", " + subject +
          " has earned a ticket Straight to Steve's Asshole.",
        "Straight to Steve's Asshole claims " + subject + " at " + time + ".",
        "The prosecution rests at " + time + "; " + subject +
          " goes Straight to Steve's Asshole.",
      ]);
    } else if (/UP IN YA|OUT OF POCKET|FULL SEND/.test(beat)) {
      lead = choice(seed + "|up-in-ya", [
        "At " + time + ", " + subject +
          " crosses into WWAM UP IN YA territory and adult supervision clocks out.",
        subject + " sends the chapter into WWAM UP IN YA territory at " + time + ".",
        "The " + time + " turn around " + subject + " earns the WWAM UP IN YA stamp.",
        "By " + time + ", " + subject +
          " has made adult supervision leave the building: WWAM UP IN YA.",
        "WWAM UP IN YA takes the wheel at " + time + " when " + subject + " arrives.",
        "The curfew breaks at " + time + " around " + subject + ": WWAM UP IN YA.",
        "At " + time + ", " + subject +
          " turns the chapter into a full WWAM UP IN YA incident.",
        subject + " opens the WWAM UP IN YA trapdoor at " + time + ".",
        "The show loses its indoor voice at " + time + " over " + subject +
          ": WWAM UP IN YA.",
        "Adult supervision files its resignation at " + time +
          " when " + subject + " enters WWAM UP IN YA territory.",
        "The " + subject + " turn at " + time +
          " is where WWAM UP IN YA officially takes custody.",
        "At " + time + ", " + subject +
          " sends good judgment home and WWAM UP IN YA takes over.",
      ]);
    } else if (/ROOM BREAK|BREAKDOWN/.test(beat)) {
      lead = choice(seed + "|room-break", [
        "At " + time + ", " + subject + " becomes the turn that breaks the room.",
        subject + " breaks the room open at " + time + ".",
        "The room gives up at " + time + " when " + subject + " lands.",
        "By " + time + ", " + subject + " has knocked the room off its hinges.",
        "The " + subject + " turn at " + time + " is where the room comes apart.",
        "At " + time + ", the room loses the fight with " + subject + ".",
      ]);
    } else if (/THEORY|PREDICTION/.test(beat)) {
      lead = choice(seed + "|theory", [
        "At " + time + ", " + subject + " puts another pin in the theory board.",
        subject + " adds red string to the wall at " + time + ".",
        "The theory board makes room for " + subject + " at " + time + ".",
        "At " + time + ", the red string finds " + subject + ".",
        "The " + subject + " theory enters the file at " + time + ".",
        "By " + time + ", " + subject + " has another corner of the board occupied.",
      ]);
    } else if (/TAKE GETS NUCLEAR/.test(beat)) {
      lead = choice(seed + "|nuclear", [
        "At " + time + ", the " + subject + " take reaches critical temperature.",
        subject + " sends the temperature gauge sideways at " + time + ".",
        "The take on " + subject + " goes nuclear at " + time + ".",
        "At " + time + ", " + subject + " takes the argument past the warning line.",
        "The " + subject + " discussion reaches reactor temperature at " + time + ".",
        "By " + time + ", the room needs a containment plan for " + subject + ".",
      ]);
    } else if (/LOVE LETTER|DEFEND|PRAISE/.test(beat)) {
      lead = choice(seed + "|defense", [
        "At " + time + ", " + subject + " gets a turn in the good pile.",
        subject + " earns a stay of execution at " + time + ".",
        "The defense makes its case for " + subject + " at " + time + ".",
        "At " + time + ", " + subject + " gets to leave with its dignity.",
        "The " + subject + " file lands on the worth-defending pile at " + time + ".",
        "By " + time + ", " + subject + " has survived the firing squad.",
      ]);
    } else {
      lead = choice(seed + "|moment", [
        "At " + time + ", " + subject + " becomes the " + stretch + "'s sharpest turn.",
        "The show hits " + subject + " at " + time + " and changes temperature.",
        "Jump to " + time + " for " + subject + ", the point where this chapter takes a hard left.",
        subject + " lands at " + time + " and gives the " + stretch + " its replay button.",
      ]);
    }

    var topicLine = otherTopics.length ?
      " The same chapter also moves through " + list(otherTopics.slice(0, 3), "") + "." : "";
    var momentLine = moments.length ?
      " Other replay markers here include " + list(moments.filter(function (moment) {
        return moment.toLowerCase() !== subject.toLowerCase();
      }).slice(0, 3), "") + "." : "";
    if (/include \.$/.test(momentLine) || /include \.$/.test(topicLine)) {
      momentLine = "";
    }
    var characterLine = characters.length ?
      " Character callbacks in this stretch include " + list(characters.slice(0, 3), "") +
        "; the clip keeps the actual voice and delivery in context." : "";
    var pointExcerpt = !excerpt && guidePoint ?
      quotedExcerpt(guidePoint.excerpt, 18) : "";
    var excerptLine = (excerpt || pointExcerpt) ?
      " The caption at " + time + " catches " + excerpt + "." :
      " The timestamp opens the complete exchange.";
    if (!excerpt && pointExcerpt) {
      excerptLine = " The caption at " + time + " catches " + pointExcerpt + ".";
    }
    return lead + topicLine + momentLine + characterLine + excerptLine;
  }

  function storyLabel(segment, index, total, sourceId) {
    var topics = displayLabels(segment.topicLabels).map(naturalLabel);
    var moments = displayLabels(segment.momentLabels).map(naturalLabel);
    var characters = displayLabels(segment.characterLabels).map(naturalLabel);
    var subject = topics[0] || moments[0] || characters[0] ||
      naturalLabel(segment.anchor) || "THE NIGHT MOVES";
    if (index === 0) return "REEL ONE // " + subject.toUpperCase() + " SETS THINGS IN MOTION";
    if (index === total - 1) {
      return "LAST REEL // " + subject.toUpperCase() + " GETS THE FINAL WORD";
    }
    return choice(sourceId + "|story-label|" + index + "|" + subject, [
      "REEL " + (index + 1) + " // " + subject.toUpperCase() + " CHANGES THE TEMPERATURE",
      "REEL " + (index + 1) + " // THE " + subject.toUpperCase() + " DETOUR",
      "REEL " + (index + 1) + " // " + subject.toUpperCase() + " AFTER CURFEW",
      "REEL " + (index + 1) + " // " + subject.toUpperCase() + " TAKES THE HARD LEFT",
    ]);
  }

  function storyBody(segment, index, total, sourceId) {
    var topics = displayLabels(segment.topicLabels).map(naturalLabel);
    var moments = displayLabels(segment.momentLabels).map(naturalLabel);
    var characters = displayLabels(segment.characterLabels).map(naturalLabel);
    var from = clock(segment.at);
    var to = clock(segment.end);
    var excerpt = quotedExcerpt(segment.excerpt, 18);
    var seed = sourceId + "|story|" + index + "|" + topics.join("|");
    var lead = choice(seed, [
      "From " + from + " to " + to + ", this part of the show",
      "The chapter between " + from + " and " + to,
      "Starting at " + from + " and running through " + to + ", the conversation",
      "This " + from + "–" + to + " stretch",
    ]);
    var topicLine = topics.length ?
      " moves through " + list(topics, "") + "." :
      " follows the night's next turn without a named subject attached.";
    if (/chapter between/.test(lead)) {
      topicLine = topics.length ?
        " moves through " + list(topics, "") + "." :
        " follows the night's next turn without a named subject attached.";
    }
    var momentLine = moments.length ?
      " The replay buttons light up around " + list(moments, "") + "." : "";
    var characterLine = characters.length ?
      " Character callbacks include " + list(characters, "") +
        ", with the clip preserving the actual performance." : "";
    var excerptLine = excerpt ?
      " At " + clock(segment.anchorAt) + ", the caption catches " + excerpt + "." :
      " Jump to " + clock(segment.anchorAt) + " for the full exchange.";
    var close = index === total - 1 ?
      " " + choice(seed + "|final-handoff", [
        "That is where this recap hands the ending back to the show.",
        "The final word belongs to the original tape.",
        "The recap stops there; the complete exchange gets the last laugh.",
        "That closes the written route and leaves the ending on the tape.",
        "The last checkpoint hands control back to the show.",
        "From there, the original episode gets the final word.",
        "That is the point where the recap turns off the lights.",
        "The watch path ends there; the episode does not.",
        "The final reel closes on the tape, where it belongs.",
        "The recap clocks out and lets the ending play.",
        "That closes the case file without rewriting the finish.",
        "The route ends there, with the original show still holding the room.",
        "That final checkpoint puts the ending back in its proper hands.",
        "The written story exits there; the tape keeps the last word.",
        "That is the end of this map, not a substitute for the show.",
        "The last saved turn closes the recap and opens the complete ending.",
      ]) :
      " " + choice(seed + "|bridge-handoff", [
        "The next chapter inherits the mess.",
        "The conversation carries that thread into the next reel.",
        "The tape keeps moving from there.",
        "That handoff opens the next door.",
        "The next section takes the wheel.",
        "The argument is not finished with the night.",
        "From there, the watch path moves to its next turn.",
        "That thread stays alive as the next chapter begins.",
        "The next saved stretch picks up the trail.",
        "The episode keeps rolling from that checkpoint.",
        "That is the handoff to the next reel.",
        "The next chapter starts with the room still warm.",
        "The show leaves that door open for what follows.",
        "The next turn arrives before the room can cool down.",
        "The tape moves on, but the residue comes with it.",
        "That checkpoint gives the next act somewhere to start.",
        "What follows starts from that loose end.",
        "The next reel finds the door already open.",
        "That turn feeds directly into the chapter ahead.",
        "The room carries that temperature into the next stretch.",
        "The next act arrives with the argument still running.",
        "That saved turn becomes the next chapter's starting line.",
        "The show changes lanes again from there.",
        "The following chapter picks up the same live wire.",
        "That moment leaves a trail for the next section.",
        "The next reel enters before the dust settles.",
        "From that point, the conversation finds another room.",
        "The tape carries the loose end forward.",
        "The next act opens on the aftershock.",
        "That exchange keeps breathing into what follows.",
        "The chapter ahead starts with unfinished business.",
        "The show takes that momentum around the next corner.",
        "That thread crosses the cut into the next stretch.",
        "The next section arrives with the door off its hinges.",
        "From there, the night finds another gear.",
        "That beat pushes the watch path into its next stop.",
        "The next chapter opens before the smoke clears.",
        "The conversation does not leave that behind quietly.",
        "That is enough fuel for the following act.",
        "The next reel takes custody of the loose end.",
        "That checkpoint sends the show toward its next problem.",
        "The following act catches the thread before it drops.",
        "That turn keeps the hallway light on for the next chapter.",
        "The next stretch begins with the room still buzzing.",
        "From there, the show follows the noise downstairs.",
        "That beat passes the trouble to the chapter ahead.",
        "The next act picks up before good judgment returns.",
        "That leaves the following reel with plenty to answer for.",
      ]);
    return lead + topicLine + momentLine + characterLine + excerptLine + close;
  }

  function overviewColor(map) {
    var formatId = clean(record(map.format).id);
    var options = {
      "movie-commentary": [
        "It plays like a watchalong that keeps finding side doors in a movie everyone thought they knew.",
        "The movie keeps running; the conversation keeps discovering new ways to escape it.",
      ],
      "watch-party": [
        "The watch-party clock survives, although good judgment takes several commercial breaks.",
        "It starts as synchronized viewing and ends with the rewind button begging for mercy.",
      ],
      "ranking-show": [
        "The bracket behaves for a while, then remembers where it is.",
        "By the end, the ranking board looks like it has survived a home invasion.",
      ],
      "versus-show": [
        "The fight card gets a winner; peace was never one of the available outcomes.",
        "The matchup gets settled. The argument absolutely does not.",
      ],
      "trailer-reaction": [
        "The trailer may be short, but the rabbit holes refuse to respect the runtime.",
        "A few minutes of footage somehow leave enough questions for an entire night shift.",
      ],
      "horror-news": [
        "The result is movie-news pinball: one headline, three trapdoors, and no gentle landing.",
        "It moves like a horror-news show with the emergency exit painted onto the wall.",
      ],
    };
    return choice(map.sourceId + "|overview-color|" + formatId,
      options[formatId] || [
        "It is less a straight line than a night drive with every suspicious exit taken.",
        "By the end, the conversation has found the basement, the attic, and the door nobody was meant to open.",
        "It starts as a show and gradually becomes something the rewind button has to explain.",
      ]);
  }

  function readyOverview(map) {
    var metadata = record(map.metadata);
    var topics = recapTopics(map);
    var characters = recapCharacters(map);
    var sections = chronologicalSections(map);
    var strongest = record(topReplay(map));
    var title = clean(metadata.title) || "This WWAM episode";
    var opening = record(sections[0]);
    var middle = record(sections[Math.floor((sections.length - 1) / 2)]);
    var closing = record(sections[sections.length - 1]);
    var openingSubject = sectionSubject(opening);
    var middleSubject = sectionSubject(middle);
    var closingSubject = sectionSubject(closing);
    var chronology = "";

    if (sections.length) {
      chronology = " The recap opens at " + clock(opening.at) + " with " + openingSubject;
      if (sections.length > 2 &&
          middleSubject.toLowerCase() !== openingSubject.toLowerCase() &&
          middleSubject.toLowerCase() !== closingSubject.toLowerCase()) {
        chronology += ", turns toward " + middleSubject + " around " + clock(middle.at);
      }
      if (closingSubject.toLowerCase() !== openingSubject.toLowerCase()) {
        chronology += ", and reaches " + closingSubject + " by " + clock(closing.at);
      }
      chronology += ".";
    }

    var focus = topics.length ?
      " The main subjects are " + list(topics.slice(0, 5), "") + "." : "";
    var highPoint = clean(strongest.label) ?
      " The top replay pick lands at " + clock(strongest.at) + " under " +
        naturalLabel(strongest.label) +
        (quotedExcerpt(strongest.excerpt, 16) ?
          ", where the caption catches " + quotedExcerpt(strongest.excerpt, 16) : "") + "." : "";
    var characterLine = characters.length ?
      " Character callbacks include " + list(characters.slice(0, 5), "") +
        "; playback keeps the voices and delivery attached to the original exchange." : "";
    var chapters = sections.length ?
      " All " + sections.length + " chapters are clickable, so the recap works as a story or a shortcut." :
      "";
    var scope = clean(map.mode) === "topic-recap" ?
      " This version can follow named subjects and timing, but it does not turn those markers into opinions." :
      "";
    var firstSentence = clean(map.registeredOverview) ||
      title + " runs " + runtime(metadata.duration) + ".";
    var deeper = guideChronology(map);
    var takeArc = guideTakeArc(map);
    return firstSentence + chronology + (deeper ? " " + deeper : "") +
      (takeArc ? " " + takeArc : "") + focus + highPoint + characterLine +
      chapters + scope + " " + overviewColor(map);
  }

  function heldRecap(map, source) {
    var metadata = record(map.metadata);
    var hold = record(record(source).exactSourceHold);
    var alternate = record(record(source).officialAlternate);
    var ageGated = clean(hold.state) === "held-age-gated";
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
      headline: ageGated ?
        "THE YOUTUBE CUT IS BEHIND THE AGE GATE. THE WIKI ISN'T GOING TO LIE." :
        "THE SHOW IS HERE. THE RECAP IS STILL IN THE PARKING LOT.",
      deck: ageGated ?
        clean(metadata.title) +
          " is in the canon, but the exact YouTube edit has no public caption or unauthenticated media route." :
        clean(metadata.title) +
          " is linked now, but its captions have not been recovered well enough for a real recap.",
      overview: ageGated ?
        "The canonical YouTube upload runs " + runtime(metadata.duration) +
          " and was posted " + clean(metadata.date) +
          ". Its source remains age-gated, so this page creates no scenes, jokes, reactions, speakers, topics, verdicts, or YouTube timestamps. " +
          (clean(alternate.title) ?
            "The official WWAM podcast edition below remains playable as a clearly separated alternate edit." :
            "The written recap waits until the exact dialogue can be checked.") :
        "The official upload runs " + runtime(metadata.duration) +
          " and was posted " + clean(metadata.date) +
          ". Until a usable caption track is available, this page will not invent scenes, jokes, reactions, speakers, topics, or verdicts. The official source link remains available; the written recap joins it after the dialogue can be checked.",
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
      ["loved", "WHAT THE SHOW DEFENDED"],
      ["hated", "STRAIGHT TO STEVE'S ASSHOLE"],
      ["wildestDetour", "WWAM UP IN YA"],
      ["lastWord", "THE LAST WORD"],
    ];
    return specs.reduce(function (output, spec) {
      var item = record(record(map.fanRead)[spec[0]]);
      if (!clean(item.receiptKey) && !clean(item.guideCutId)) return output;
      var itemTopic = naturalLabel(item.topic || item.label || spec[1]);
      var excerpt = quotedExcerpt(item.excerpt, 16);
      var label = spec[1];
      if (spec[0] === "lastWord" && number(record(map.metadata).duration) &&
          number(item.at) / number(record(map.metadata).duration) < 0.85) {
        label = "THE FINAL SAVED TURN";
      }
      var body;
      if (spec[0] === "hated") {
        body = "At " + clock(item.at) + ", " + itemTopic +
          " takes the one-way trip Straight to Steve's Asshole" +
          (excerpt ? ": " + excerpt + "." : ".");
      } else if (spec[0] === "wildestDetour") {
        body = "At " + clock(item.at) + ", adult supervision checks out around " +
          itemTopic + (excerpt ? ", leaving " + excerpt + " behind." : ".");
      } else if (spec[0] === "lastWord") {
        body = "The final saved turn arrives at " + clock(item.at) + " with " +
          itemTopic + (excerpt ? ": " + excerpt + "." : ".");
      } else {
        body = "At " + clock(item.at) + ", " + itemTopic +
          " gets a rare stay of execution" + (excerpt ? ": " + excerpt + "." : ".");
      }
      output[spec[0]] = {
        label: label,
        topic: itemTopic,
        body: body,
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
    if (clean(map.evidenceState) !== "ready") {
      return heldRecap(map, record(input.source));
    }
    var seenLabels = {};
    var sections = array(map.sections).map(function (section, index, values) {
      var label = sectionLabel(
        section,
        index,
        values.length,
        map.sourceId,
        number(record(map.metadata).duration),
        clean(record(map.format).id)
      );
      var labelKey = label.toLowerCase();
      seenLabels[labelKey] = (seenLabels[labelKey] || 0) + 1;
      if (seenLabels[labelKey] > 1) {
        label += " // AGAIN " + seenLabels[labelKey];
      }
      return {
        id: clean(section.id),
        ordinal: index + 1,
        label: label,
        body: sectionBody(
          section,
          map.sourceId,
          number(record(map.metadata).duration),
          clean(record(map.format).id),
          map
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
        label: storyLabel(segment, index, values.length, map.sourceId),
        body: storyBody(segment, index, values.length, map.sourceId),
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
      "full-chronicle": "FULL EPISODE CHRONICLE",
      "receipt-recap": "PLAYABLE EPISODE RECAP",
      "topic-recap": "TOPIC-BY-TOPIC RECAP",
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
      badge: tierLabels[map.mode] || "PLAYABLE EPISODE RECAP",
      headline: headline(map),
      deck: deck(map),
      overview: readyOverview(map),
      topics: recapTopics(map),
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
