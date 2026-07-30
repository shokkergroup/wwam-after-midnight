(function (root) {
  "use strict";

  var SCHEMA = "wwam-feldman-recap/v1";
  var VERSION = "1.6.2";

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

  function uniqueTopics(values) {
    var seen = {};
    return array(values).map(clean).filter(Boolean).filter(function (value) {
      var key = value.toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
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

  function agrees(values, singular, plural) {
    return unique(values).length === 1 ? singular : plural;
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

  function exactLabels(values) {
    var output = [];
    array(values).map(clean).filter(Boolean).forEach(function (value) {
      if (output.indexOf(value) < 0) output.push(value);
    });
    return output;
  }

  function storyPrimarySubject(segment) {
    var guideAnchor = record(segment.guideAnchor);
    var narrative = record(segment.narrative);
    return clean(
      guideAnchor.topic ||
      segment.primarySubject ||
      narrative.primarySubject ||
      array(segment.topicLabels)[0] ||
      array(segment.characterLabels)[0] ||
      segment.anchor ||
      array(segment.momentLabels)[0] ||
      "Saved checkpoint"
    );
  }

  function reprojectStoryNarratives(story) {
    var positions = {};
    story.forEach(function (segment, index) {
      exactLabels(
        [storyPrimarySubject(segment)]
          .concat(segment.topicLabels, segment.characterLabels)
      ).forEach(function (subject) {
        var key = subject.toLowerCase();
        if (!positions[key]) positions[key] = [];
        positions[key].push(index);
      });
    });

    return story.map(function (segment, index) {
      var current = record(segment.narrative);
      var primarySubject = storyPrimarySubject(segment);
      var subjects = exactLabels(
        [primarySubject]
          .concat(segment.topicLabels, segment.characterLabels, segment.momentLabels)
      );
      var recurringSubjects = subjects.filter(function (subject) {
        return array(positions[subject.toLowerCase()]).length > 1;
      }).slice(0, 4);
      var counts = {
        receipts: array(segment.receiptKeys).length,
        guideCuts: array(segment.guideCutIds).length,
        guideChapters: array(segment.guideChapterIds).length,
        topics: array(segment.topicLabels).length,
        moments: array(segment.momentLabels).length,
        characters: array(segment.characterLabels).length,
        namedSubjects: subjects.length,
      };
      var kind = index === 0 ? "opening-board" :
        index === story.length - 1 ? "last-reel" :
          recurringSubjects.length ? "returning-thread" :
            counts.characters ? "character-break-in" :
              counts.moments > counts.topics ? "chaos-spike" :
                counts.topics >= 3 ? "topic-sweep" :
                  "hard-left";
      segment.primarySubject = primarySubject;
      segment.narrative = Object.assign({}, current, {
        kind: kind,
        primarySubject: primarySubject,
        secondarySubjects: subjects.filter(function (subject) {
          return subject.toLowerCase() !== primarySubject.toLowerCase();
        }).slice(0, 5),
        previousSubject: index ? storyPrimarySubject(story[index - 1]) : "",
        nextSubject: index + 1 < story.length ?
          storyPrimarySubject(story[index + 1]) : "",
        recurringSubjects: recurringSubjects,
        evidenceShape: counts,
      });
      return segment;
    });
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

  function pluralSubject(value) {
    return /(?:\s&\s|\b(?:trailers|rankings|lists|remakes|reboots|sequels|prequels)\b)/i
      .test(clean(value));
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
    return uniqueTopics(displayLabels(map.topics).concat(sectionTopics)).map(naturalLabel);
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
        score: number(moment.signalScore) * 3 +
          phraseScore + wordScore + Math.max(0, candidates.length - index),
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
    var tapeWithArticle = /^the\s/i.test(displayTapeTitle) ?
      displayTapeTitle : "THE " + displayTapeTitle;
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
          tapeWithArticle + " TAPE // THE MATCH: " +
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
          tapeWithArticle + " TAPE // LAST WORD: " +
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

  function storyLabel(segment, index, total, sourceId, duration) {
    var narrative = record(segment.narrative);
    var topics = displayLabels(segment.topicLabels).map(naturalLabel);
    var moments = displayLabels(segment.momentLabels).map(naturalLabel);
    var characters = displayLabels(segment.characterLabels).map(naturalLabel);
    var subject = naturalLabel(narrative.primarySubject) ||
      topics[0] || moments[0] || characters[0] ||
      naturalLabel(segment.anchor) || "THE NIGHT MOVES";
    var subjectUpper = subject.toUpperCase();
    var plural = pluralSubject(subject);
    var articleSubject = /^THE\s/.test(subjectUpper) ?
      subjectUpper : "THE " + subjectUpper;
    if (index === 0) {
      return "REEL ONE // " + subjectUpper +
        (plural ? " SET THINGS IN MOTION" : " SETS THINGS IN MOTION");
    }
    if (index === total - 1) {
      var lastEvidence = record(narrative.primaryEvidence);
      var lastAt = Number.isFinite(Number(lastEvidence.at)) ?
        number(lastEvidence.at) : number(segment.anchorAt);
      if (number(duration) && lastAt / number(duration) < 0.75) {
        return "LAST SAVED REEL // " + subjectUpper + " CLOSES THE INDEX";
      }
      return "LAST REEL // " + subjectUpper +
        (plural ? " GET THE FINAL WORD" : " GETS THE FINAL WORD");
    }
    return choice(sourceId + "|story-label|" + index + "|" + subject, [
      "REEL " + (index + 1) + " // " + subjectUpper +
        (plural ? " CHANGE THE TEMPERATURE" : " CHANGES THE TEMPERATURE"),
      "REEL " + (index + 1) + " // " + articleSubject + " DETOUR",
      "REEL " + (index + 1) + " // " + subjectUpper + " AFTER CURFEW",
      "REEL " + (index + 1) + " // " + subjectUpper +
        (plural ? " TAKE THE HARD LEFT" : " TAKES THE HARD LEFT"),
    ]);
  }

  function storyWorld(formatId) {
    var id = clean(formatId);
    if (id === "movie-commentary" || id === "watch-party" ||
        id === "script-reading") {
      return {
        surface: "commentary",
        route: "watchalong",
        room: "screen-side conversation",
        checkpoint: "scene-side checkpoint",
      };
    }
    if (id === "ranking-show" || id === "versus-show") {
      return {
        surface: "board",
        route: "bracket",
        room: "scorecard",
        checkpoint: "board checkpoint",
      };
    }
    if (id === "trailer-reaction") {
      return {
        surface: "breakdown",
        route: "frame-by-frame path",
        room: "reaction",
        checkpoint: "footage checkpoint",
      };
    }
    return {
      surface: "show",
      route: "broadcast",
      room: "conversation",
      checkpoint: "show checkpoint",
    };
  }

  function storyBody(segment, index, total, sourceId, formatId, duration) {
    var narrative = record(segment.narrative);
    var shape = record(narrative.evidenceShape);
    var guideAnchor = record(segment.guideAnchor);
    var primaryEvidence = record(narrative.primaryEvidence);
    var topics = displayLabels(segment.topicLabels).map(naturalLabel);
    var topicEvidence = array(segment.topicEvidence).map(record).filter(function (item) {
      return clean(item.label);
    });
    var moments = displayLabels(segment.momentLabels).map(naturalLabel);
    var momentEvidence = array(segment.momentEvidence).map(record);
    var evidenceTrail = array(segment.evidenceTrail).map(record).filter(function (item) {
      return clean(item.label) && Number.isFinite(Number(item.at));
    });
    var characters = displayLabels(segment.characterLabels).map(naturalLabel);
    var threads = displayLabels(segment.threadLabels).map(naturalLabel);
    var primary = naturalLabel(narrative.primarySubject) ||
      topics[0] || characters[0] || moments[0] ||
      naturalLabel(segment.anchor) || "the next turn";
    var recurring = displayLabels(narrative.recurringSubjects).map(naturalLabel);
    var anchorSupportsPrimary = narrative.anchorSupportsPrimary !== false;
    var anchorSubject = naturalLabel(narrative.anchorSubject) ||
      naturalLabel(primaryEvidence.label) ||
      naturalLabel(segment.anchor) || "a saved checkpoint";
    var anchorAt = Number.isFinite(Number(primaryEvidence.at)) ?
      number(primaryEvidence.at) :
      (clean(guideAnchor.id) ? number(guideAnchor.at) : number(segment.anchorAt));
    var world = storyWorld(formatId);
    var excerpt = quotedExcerpt(
      clean(guideAnchor.id) ? guideAnchor.excerpt : segment.excerpt,
      18
    );
    var from = clock(segment.at);
    var to = clock(segment.end);
    var seed = sourceId + "|story-v15|" + index + "|" + primary + "|" +
      clean(narrative.kind);
    var lead = anchorSupportsPrimary ? choice(seed + "|authored-lead", [
      "At " + clock(anchorAt) + ", the " + world.surface +
        " plants this reel's flag on " + primary + ".",
      "The " + world.route + " unlocks " + primary + " at " +
        clock(anchorAt) + " and leaves the door swinging.",
      primary + " is the name under the " + world.surface +
        "'s flashlight at " + clock(anchorAt) + ".",
      "The recap finds " + primary + " waiting in the " + world.room +
        " at " + clock(anchorAt) + ".",
      "Through the " + world.route + " door at " + clock(anchorAt) +
        ": " + primary + ".",
      "The " + world.surface + " clocks in at " + clock(anchorAt) +
        " with " + primary + " already causing paperwork.",
      "At " + clock(anchorAt) + ", " + primary + " gives this " +
        world.route + " its pulse.",
      "This reel points the " + world.surface + " at " + primary +
        " by " + clock(anchorAt) + ".",
      "The " + world.route + " breadcrumb lands on " + primary +
        " at " + clock(anchorAt) + ".",
      "By " + clock(anchorAt) + ", the " + world.surface +
        " has handed this reel to " + primary + ".",
      primary + " answers the " + world.room + "'s roll call at " +
        clock(anchorAt) + ".",
      "The " + world.surface + " opens its after-hours ledger on " +
        primary + " at " + clock(anchorAt) + ".",
    ]) : choice(seed + "|separate-anchor", [
      "This reel covers " + primary + " from " + from + " to " + to +
        ". Its strongest saved spike lands at " + clock(anchorAt) +
        " under " + anchorSubject +
        ", a separate checkpoint in the same stretch.",
      primary + " owns the broader " + world.route + " chapter from " +
        from + " to " + to + ". The saved spike at " + clock(anchorAt) +
        " belongs to " + anchorSubject +
        "; it is a separate checkpoint, not proof that " + primary +
        " happened there.",
      "The broader subject here is " + primary + ". At " +
        clock(anchorAt) + ", " + anchorSubject +
        " supplies a separate saved spike; that timestamp is not assigned to " +
        primary + ".",
      "From " + from + " to " + to + ", the recap follows " + primary +
        ". Its strongest " + world.checkpoint + " is " + anchorSubject +
        " at " + clock(anchorAt) +
        ", and the two are kept separate.",
    ]);
    var topicLine = "";
    var topicOthers = topics.filter(function (topic) {
      return topic.toLowerCase() !== primary.toLowerCase();
    });
    var topicDetail = anchorSupportsPrimary && topicOthers.length ?
      " " + choice(seed + "|topics", [
        primary + " holds the flashlight while " + list(topicOthers.slice(0, 4), "") +
          " " + agrees(topicOthers.slice(0, 4), "crowds", "crowd") +
          " the same hallway.",
      "The same reel opens side doors for " + list(topicOthers.slice(0, 4), "") +
        ", but " + primary + " keeps the keys.",
      "Around that checkpoint, " + list(topicOthers.slice(0, 4), "") +
        " " + agrees(topicOthers.slice(0, 4), "joins", "join") + " " +
        primary + " on an increasingly unsafe evidence board.",
      "The watch path keeps " + primary + " in front and stacks " +
        list(topicOthers.slice(0, 4), "") + " behind it like suspicious sequel luggage.",
      primary + " is the marquee name; the trapdoor list underneath it reads " +
        list(topicOthers.slice(0, 4), "") + ".",
      "That puts " + primary + " at the center of a reel also carrying " +
        list(topicOthers.slice(0, 4), "") + ".",
    ]) : anchorSupportsPrimary ? " " + choice(seed + "|one-subject", [
      primary + " owns the named lane here; the rest of the context stays on the original " +
        world.surface + ".",
      "This reel keeps its named flashlight on " + primary +
        " instead of pretending the " + world.surface + " said more.",
      primary + " is the chapter's one named suspect, and the timestamp keeps the full interrogation.",
      "The map stays locked on " + primary + "; playback handles everything the recap cannot mime.",
    ]) : " " + choice(seed + "|separate-context", [
      "The reel-level subject remains " + primary +
        "; " + anchorSubject + " labels only the separate saved spike.",
      "That checkpoint belongs to " + anchorSubject +
        ", while " + primary + " describes the broader " + world.route + " stretch.",
      "The recap keeps " + primary + " as the chapter heading and " +
        anchorSubject + " as a separate piece of timestamped evidence.",
      "This is one reel with two evidence levels: broad subject " + primary +
        ", separate checkpoint " + anchorSubject + ".",
    ]);
    var measuredTopics = topicEvidence.filter(function (item) {
      return number(item.mentions) > 0;
    });
    var topicMetricLine = measuredTopics.length ? " " +
      choice(seed + "|topic-metrics", [
        naturalLabel(measuredTopics[0].label) + " registers " +
          number(measuredTopics[0].mentions) + " caption mentions, first at " +
          clock(measuredTopics[0].firstAt) + " and peaking at " +
          clock(measuredTopics[0].peakAt) + ".",
        "The caption map gives " + naturalLabel(measuredTopics[0].label) +
          " the heaviest recurrence here: " +
          number(measuredTopics[0].mentions) + " mentions from a first arrival at " +
          clock(measuredTopics[0].firstAt) + " to a peak at " +
          clock(measuredTopics[0].peakAt) + ".",
        "By the numbers, " + naturalLabel(measuredTopics[0].label) +
          " owns this stretch with " + number(measuredTopics[0].mentions) +
          " registered mentions; its first door is " +
          clock(measuredTopics[0].firstAt) + " and its peak is " +
          clock(measuredTopics[0].peakAt) + ".",
        "The source clock tracks " + naturalLabel(measuredTopics[0].label) +
          " from " + clock(measuredTopics[0].firstAt) + " to its densest point at " +
          clock(measuredTopics[0].peakAt) + ", across " +
          number(measuredTopics[0].mentions) + " mentions.",
      ]) : "";
    var category = naturalLabel(guideAnchor.category);
    var guideLine = clean(guideAnchor.id) ?
      " " + choice(seed + "|guide", [
        "Its " + (category || "saved") + " checkpoint is one of " +
          number(shape.guideCuts) + " exact guide stops inside this reel.",
        "The reviewed watch path gives this reel " + number(shape.guideCuts) +
          " timed stop" + (number(shape.guideCuts) === 1 ? "" : "s") +
          (category ? ", including the " + category + " turn" : "") + ".",
        "This stretch inherits " + number(shape.guideCuts) +
          " exact guide marker" + (number(shape.guideCuts) === 1 ? "" : "s") +
          (category ? "; " + category + " gets the sharpest one" : "") + ".",
        "The full-show map backs this reel with " + number(shape.guideCuts) +
          " timed checkpoint" + (number(shape.guideCuts) === 1 ? "" : "s") +
          (category ? ", led by " + category : "") + ".",
      ]) : "";
    var strongestMoment = record(momentEvidence[0]);
    var strongestMomentLabel = naturalLabel(strongestMoment.label) || moments[0];
    var strongestMomentExcerpt = quotedExcerpt(strongestMoment.excerpt, 14);
    var momentLine = strongestMomentLabel ?
      " " + choice(seed + "|moment-evidence", [
        "The strongest saved pressure point lands at " +
          clock(strongestMoment.at) + " under " + strongestMomentLabel +
          (strongestMomentExcerpt ? ", with the caption catching " +
            strongestMomentExcerpt : "") + ".",
        "The replay board puts " + strongestMomentLabel + " at " +
          clock(strongestMoment.at) +
          (strongestMomentExcerpt ? ": " + strongestMomentExcerpt : "."),
        "At " + clock(strongestMoment.at) + ", " + strongestMomentLabel +
          " becomes this reel's sharpest saved spike" +
          (strongestMomentExcerpt ? " as the caption records " +
            strongestMomentExcerpt : "") + ".",
        "The source-bound high point here is " + strongestMomentLabel +
          " at " + clock(strongestMoment.at) +
          (strongestMomentExcerpt ? ", where the saved line is " +
            strongestMomentExcerpt : "") + ".",
        "For the fastest route into this stretch, open " +
          clock(strongestMoment.at) + ": " + strongestMomentLabel +
          (strongestMomentExcerpt ? " leaves " + strongestMomentExcerpt +
            " on the tape." : "."),
      ]) : "";
    function evidenceBeat(item) {
      var excerpt = quotedExcerpt(item.excerpt, 11);
      return naturalLabel(item.label) + " at " + clock(item.at) +
        (excerpt ? " (" + excerpt + ")" : "");
    }
    var trailLine = evidenceTrail.length >= 2 ? " " +
      choice(seed + "|evidence-trail", [
        "Two source marks define the turn: " + evidenceBeat(evidenceTrail[0]) +
          ", then " + evidenceBeat(evidenceTrail[1]) + ".",
        "The timed trail moves from " + evidenceBeat(evidenceTrail[0]) +
          " to " + evidenceBeat(evidenceTrail[1]) + ".",
        "Inside this " + world.route + " stretch, " +
          evidenceBeat(evidenceTrail[0]) + " gives way to " +
          evidenceBeat(evidenceTrail[1]) + ".",
        "The original " + world.surface + " pins the progression to " +
          evidenceBeat(evidenceTrail[0]) + " and " +
          evidenceBeat(evidenceTrail[1]) + ".",
        "The reel has two distinct receipts: " +
          evidenceBeat(evidenceTrail[0]) + "; later, " +
          evidenceBeat(evidenceTrail[1]) + ".",
        "The source clock connects " + evidenceBeat(evidenceTrail[0]) +
          " with " + evidenceBeat(evidenceTrail[1]) + ".",
      ]) : "";
    var characterLine = characters.length ?
      " " + choice(seed + "|characters", [
        "Someone left the character cellar unlocked: " +
          list(characters.slice(0, 4), "") + " " +
          agrees(characters.slice(0, 4), "turns", "turn") +
          " up in the same reel.",
        "The character door also swings open for " +
          list(characters.slice(0, 4), "") +
          "; playback keeps the actual voices and delivery attached.",
        list(characters.slice(0, 4), "") +
          " " + agrees(characters.slice(0, 4), "shares", "share") +
          " this stretch, with the " + world.surface +
          " retaining who said what and how.",
        "Character-callback weather moves in around " +
          list(characters.slice(0, 4), "") +
          "; the original audio keeps the performance in bounds.",
      ]) : "";
    var threadLine = threads.length && !threads.every(function (thread) {
      return topics.some(function (topic) {
        return topic.toLowerCase() === thread.toLowerCase();
      });
    }) ? " The episode's larger thread map also keeps " +
      list(threads.slice(0, 4), "") + " in play." : "";
    var excerptLine = anchorSupportsPrimary ?
      (excerpt ? " " + choice(seed + "|excerpt", [
        "At " + clock(anchorAt) + ", the " + world.surface +
          " catches " + excerpt + ".",
        "The line at " + clock(anchorAt) + " lands as " + excerpt + ".",
        "Open " + clock(anchorAt) + " and the " + world.room +
          " gives us " + excerpt + ".",
        "At " + clock(anchorAt) + ", the saved line is " + excerpt + ".",
      ]) : "") :
      (excerpt ?
        " At " + clock(anchorAt) + ", that separate " + anchorSubject +
          " checkpoint catches " + excerpt + "." :
        " Open " + clock(anchorAt) + " for the separate " + anchorSubject +
          " checkpoint; it is not evidence that " + primary +
          " happened at that exact time.");
    var closesBeforeFinalQuarter = index === total - 1 && number(duration) &&
      anchorAt / number(duration) < 0.75;
    var close = closesBeforeFinalQuarter ?
      " " + choice(seed + "|indexed-tail", [
        "That closes the saved map at " + clock(anchorAt) +
          "; the episode itself keeps running on the original tape.",
        "The indexed evidence ends here, not the show. Playback owns the remaining runtime.",
        "This is the last proven checkpoint in the recap; it is not a rewritten ending.",
        "The saved path clocks out at " + clock(anchorAt) +
          ". The rest stays attached to the full episode above.",
        "The source-backed runway stops at " + clock(anchorAt) +
          "; hit the full upload for everything after it.",
        "That is the last indexed turn, not the final scene. The original show keeps the clock.",
        "Our playable evidence signs off at " + clock(anchorAt) +
          ", while the complete broadcast carries on above.",
        "The recap has reached its final proven marker. The tape has not reached its ending.",
        "The saved checkpoints run through " + clock(anchorAt) +
          "; the player remains the authority for the rest.",
        "This map leaves the road at " + clock(anchorAt) +
          ". The full episode stays behind the wheel.",
        "The last registered stop lands here, with the untouched remainder still in the player.",
        "The index closes before the show does; playback preserves the rest of the night.",
      ]) :
      index === total - 1 ?
      " " + choice(seed + "|final-handoff", [
        "That is where this recap hands the ending back to the show.",
        "The final word belongs to the original " + world.surface + ".",
        "The recap stops there; the complete exchange gets the last laugh.",
        "That closes the written path and leaves the ending on the " +
          world.surface + ".",
        "The last checkpoint hands control back to the show.",
        "From there, the original episode gets the final word.",
        "That is the point where the recap turns off the lights.",
        "The watch path ends there; the episode does not.",
        "The final reel closes on the " + world.surface + ", where it belongs.",
        "The recap clocks out and lets the ending play.",
        "That closes the case without rewriting the finish.",
        "The path ends there, with the original show still holding the room.",
        "That final checkpoint puts the ending back in its proper hands.",
        "The written story exits there; the " + world.surface +
          " keeps the last word.",
        "That is the end of this map, not a substitute for the show.",
        "The last saved turn closes the recap and opens the complete ending.",
      ]) :
      recurring.length ? " " + choice(seed + "|returning-thread", [
        "Like a slasher who missed the funeral, " + recurring[0] +
          " survives this reel and follows the map toward the next room.",
        recurring[0] +
          " refuses to stay buried; the next reel inherits the footprints.",
        "The sequel rule applies: " + recurring[0] +
          " is still breathing when the map turns the corner.",
        recurring[0] +
          " leaves fingerprints on more than one reel, and the next chapter picks up the trail.",
      ]) :
      " " + choice(seed + "|bridge-handoff", [
        "The next chapter inherits the mess.",
        "The conversation carries that thread into the next reel.",
        "The " + world.route + " keeps moving from there.",
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
        "The " + world.surface + " moves on, but the residue comes with it.",
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
        "The " + world.route + " carries the loose end forward.",
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
        "The next section starts where that timestamp leaves off.",
        "That evidence handoff puts the following reel on deck.",
        "The next cut arrives with the same subject still in the air.",
        "That saved beat clears a path into the following stretch.",
        "The conversation turns the page without closing the argument.",
        "The next reel opens with that timestamp still echoing.",
        "That stop points directly toward the next subject on the board.",
        "The following stretch takes over before the thread goes cold.",
        "That source marker becomes the hinge into what comes next.",
        "The next chapter collects the loose evidence.",
        "The show carries that turn into a different corner.",
        "That timestamp hands the night another problem to solve.",
        "The next act starts with the evidence board still crowded.",
        "That beat gives the following section its opening move.",
        "The conversation changes rooms but keeps the receipt.",
        "The next reel inherits the unresolved part.",
        "That turn sends the timeline toward its next marked stop.",
        "The following chapter opens with one more thread to pull.",
        "That source-bound beat keeps the next section from starting cold.",
        "The next stretch enters with the previous door still swinging.",
        "That receipt passes the baton to the chapter ahead.",
        "The timeline moves forward with that marker still attached.",
        "The next act follows the evidence instead of the smoke.",
        "That timestamp becomes the launch point for what follows.",
      ]);
    return lead + topicLine + topicDetail + topicMetricLine + guideLine + momentLine +
      trailLine + characterLine + threadLine + excerptLine + close;
  }

  function readableStoryLabel(segment, index, total) {
    var narrative = record(segment.narrative);
    var subject = naturalLabel(narrative.primarySubject) ||
      displayLabels(segment.topicLabels).map(naturalLabel)[0] ||
      displayLabels(segment.momentLabels).map(naturalLabel)[0] ||
      displayLabels(segment.characterLabels).map(naturalLabel)[0] ||
      naturalLabel(segment.anchor) ||
      "THE SHOW";
    var prefix = index === 0 ? "OPENING" :
      index === total - 1 ? "FINAL CHAPTER" :
        "CHAPTER " + (index + 1);
    return prefix + " // " + subject.toUpperCase();
  }

  function readableStoryBody(segment, index, total, duration) {
    var narrative = record(segment.narrative);
    var primaryEvidence = record(narrative.primaryEvidence);
    var topics = displayLabels(segment.topicLabels).map(naturalLabel);
    var moments = displayLabels(segment.momentLabels).map(naturalLabel);
    var characters = displayLabels(segment.characterLabels).map(naturalLabel);
    var evidenceTrail = array(segment.evidenceTrail).map(record).filter(function (item) {
      return clean(item.label) && Number.isFinite(Number(item.at));
    });
    var primary = naturalLabel(narrative.primarySubject) ||
      topics[0] || moments[0] || characters[0] ||
      naturalLabel(segment.anchor) || "the show";
    var anchorAt = Number.isFinite(Number(primaryEvidence.at)) ?
      number(primaryEvidence.at) : number(segment.anchorAt);
    var from = clock(segment.at);
    var to = clock(segment.end);
    var topicOthers = topics.filter(function (topic) {
      return topic.toLowerCase() !== primary.toLowerCase();
    }).slice(0, 3);
    var momentEvidence = array(segment.momentEvidence).map(record);
    var strongestMoment = momentEvidence[0];
    var strongestLabel = strongestMoment ?
      naturalLabel(strongestMoment.label) : moments[0];
    var sentences = [];

    if (index === 0) {
      sentences.push(
        "The episode opens with " + primary + " from " + from + " to " + to + "."
      );
    } else if (index === total - 1) {
      sentences.push(
        "The final indexed chapter runs from " + from + " to " + to +
          " and centers on " + primary + "."
      );
    } else {
      sentences.push(
        "From " + from + " to " + to + ", the conversation centers on " +
          primary + "."
      );
    }

    if (topicOthers.length) {
      sentences.push(
        "The same stretch also covers " + list(topicOthers, "") + "."
      );
    }
    if (strongestLabel) {
      var strongestAt = strongestMoment &&
        Number.isFinite(Number(strongestMoment.at)) ?
        number(strongestMoment.at) : anchorAt;
      sentences.push(
        "Its strongest saved beat is " + strongestLabel + " at " +
          clock(strongestAt) + "."
      );
    } else if (evidenceTrail.length >= 2) {
      sentences.push(
        "Useful jumps land at " + clock(evidenceTrail[0].at) + " for " +
          naturalLabel(evidenceTrail[0].label) + " and " +
          clock(evidenceTrail[1].at) + " for " +
          naturalLabel(evidenceTrail[1].label) + "."
      );
    }
    if (characters.length) {
      sentences.push(
        "Character context in this chapter includes " +
          list(characters.slice(0, 3), "") + "."
      );
    }
    var finalEvidenceAt = evidenceTrail.concat(momentEvidence).reduce(
      function (latest, item) {
        return Math.max(latest, number(item && item.at));
      },
      anchorAt
    );
    if (index === total - 1 && number(duration) &&
        finalEvidenceAt / number(duration) < 0.75) {
      sentences.push(
        "This is the last saved timestamp; the full player continues beyond the written map."
      );
    }
    return sentences.join(" ");
  }

  function readableSectionBody(section) {
    var time = clock(section.at);
    var subject = sectionSubject(section);
    var topics = displayLabels(section.topicLabels).map(naturalLabel).filter(function (topic) {
      return topic.toLowerCase() !== subject.toLowerCase();
    }).slice(0, 3);
    var moments = displayLabels(section.momentLabels).map(naturalLabel).slice(0, 3);
    var characters = displayLabels(section.characterLabels).map(naturalLabel).slice(0, 3);
    var sentences = [
      "At " + time + ", " + subject + " becomes the focus of this chapter.",
    ];
    if (topics.length) {
      sentences.push("The discussion also moves through " + list(topics, "") + ".");
    }
    if (moments.length) {
      sentences.push("Saved highlight markers here include " + list(moments, "") + ".");
    }
    if (characters.length) {
      sentences.push(
        "The caption map also flags character context for " +
          list(characters, "") + "."
      );
    }
    return sentences.join(" ");
  }

  function readableDeck(map) {
    var metadata = record(map.metadata);
    var story = array(map.story).map(record);
    var topics = recapTopics(map).map(naturalLabel);
    var subjects = story.map(function (segment) {
      return naturalLabel(segment.primarySubject);
    }).filter(Boolean);
    var focus = [];
    subjects.concat(topics).forEach(function (subject) {
      if (!focus.some(function (existing) {
        return existing.toLowerCase() === subject.toLowerCase();
      })) focus.push(subject);
    });
    var strongest = record(topReplay(map));
    var format = clean(record(map.format).label || record(map.format).id)
      .toLowerCase() || "episode";
    var output = "A " + runtime(metadata.duration) + " " + format +
      " organized into " + Math.max(1, story.length) +
      " chronological chapter" + (story.length === 1 ? "" : "s") + ".";
    if (focus.length) {
      output += " The main route covers " + list(focus.slice(0, 5), "") + ".";
    }
    if (clean(strongest.label)) {
      output += " The strongest saved moment starts at " +
        clock(strongest.at) + ".";
    }
    return output;
  }

  function readableOverview(map) {
    var metadata = record(map.metadata);
    var title = clean(metadata.title) || "This WWAM episode";
    var story = array(map.story).map(record);
    var topics = recapTopics(map).map(naturalLabel);
    var characters = recapCharacters(map).map(naturalLabel);
    var strongest = record(topReplay(map));
    var output = title + " runs " + runtime(metadata.duration) + ".";
    if (story.length) {
      var opening = story[0];
      var middle = story[Math.floor((story.length - 1) / 2)];
      var closing = story[story.length - 1];
      output += " The episode opens with " +
        naturalLabel(opening.primarySubject || opening.anchor) +
        " at " + clock(opening.at) + ".";
      var openingSubject = naturalLabel(
        opening.primarySubject || opening.anchor
      );
      var titleTopic = topics[0] || "";
      var titleTopicPoint = array(map.topicMap).map(record).find(function (topic) {
        return naturalLabel(topic.label).toLowerCase() ===
          titleTopic.toLowerCase();
      });
      if (titleTopic && titleTopicPoint &&
          titleTopic.toLowerCase() !== openingSubject.toLowerCase()) {
        output += " Its title subject, " + titleTopic +
          ", enters at " + clock(titleTopicPoint.at) + ".";
      }
      if (story.length > 2) {
        output += " Around the middle, it moves to " +
          naturalLabel(middle.primarySubject || middle.anchor) +
          " at " + clock(middle.at) + ".";
      }
      if (story.length > 1) {
        output += " The final indexed chapter reaches " +
          naturalLabel(closing.primarySubject || closing.anchor) +
          " at " + clock(closing.at) + ".";
      }
    }
    if (clean(strongest.label)) {
      output += " The strongest saved highlight is " +
        naturalLabel(strongest.label) + " at " + clock(strongest.at) + ".";
    }
    if (characters.length) {
      output += " Character context is indexed for " +
        list(characters.slice(0, 5), "") +
        "; the source player preserves the full context and delivery.";
    }
    return output;
  }

  function readableFanRead(map) {
    var specs = [
      ["loved", "WHAT THE SHOW DEFENDED", "The strongest saved positive take"],
      ["hated", "STRAIGHT TO STEVE'S ASSHOLE", "The strongest saved negative take"],
      ["wildestDetour", "WWAM UP IN YA", "The wildest saved detour"],
      ["lastWord", "THE LAST WORD", "The final saved highlight"],
    ];
    return specs.reduce(function (output, spec) {
      var item = record(record(map.fanRead)[spec[0]]);
      if (!clean(item.receiptKey) && !clean(item.guideCutId)) return output;
      var topic = naturalLabel(item.topic || item.label || spec[1]);
      output[spec[0]] = {
        label: spec[1],
        topic: topic,
        body: spec[2] + " is " + topic + " at " + clock(item.at) +
          ". Use the source clip for the complete exchange.",
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
    var scope = clean(map.mode) === "topic-recap" ?
      " This version can follow named subjects and timing, but it does not turn those markers into opinions." :
      "";
    var firstSentence = clean(map.registeredOverview) ||
      title + " runs " + runtime(metadata.duration) + ".";
    var deeper = guideChronology(map);
    var takeArc = guideTakeArc(map);
    return firstSentence + chronology + (deeper ? " " + deeper : "") +
      (takeArc ? " " + takeArc : "") + focus + highPoint + characterLine +
      scope;
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
      evidenceFingerprint: map.evidenceFingerprint,
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
        label += " // " + clock(section.at);
      }
      return {
        id: clean(section.id),
        ordinal: index + 1,
        label: label,
        body: readableSectionBody(section),
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
        label: readableStoryLabel(
          segment,
          index,
          values.length
        ),
        body: readableStoryBody(
          segment,
          index,
          values.length,
          number(record(map.metadata).duration)
        ),
        at: number(segment.at),
        end: number(segment.end),
        anchorReceiptKey: clean(segment.anchorReceiptKey),
        anchorAt: number(segment.anchorAt),
        anchor: clean(segment.anchor),
        primarySubject: naturalLabel(segment.primarySubject),
        excerpt: clean(segment.excerpt),
        topicLabels: displayLabels(segment.topicLabels),
        topicEvidence: array(segment.topicEvidence).map(function (topic) {
          return {
            receiptKey: clean(topic.receiptKey),
            label: naturalLabel(topic.label),
            at: number(topic.at),
            end: number(topic.end),
            mentions: number(topic.mentions),
            firstAt: number(topic.firstAt),
            peakAt: number(topic.peakAt),
            metricBasis: clean(topic.metricBasis),
          };
        }),
        momentLabels: displayLabels(segment.momentLabels),
        momentEvidence: array(segment.momentEvidence).map(function (moment) {
          return {
            receiptKey: clean(moment.receiptKey),
            at: number(moment.at),
            end: number(moment.end),
            label: naturalLabel(moment.label),
            excerpt: clean(moment.excerpt),
            signalScore: number(moment.signalScore),
            evidenceBasis: clean(moment.evidenceBasis),
          };
        }),
        evidenceTrail: array(segment.evidenceTrail).map(function (item) {
          return {
            receiptKey: clean(item.receiptKey),
            guideCutId: clean(item.guideCutId),
            at: number(item.at),
            end: number(item.end),
            label: naturalLabel(item.label),
            excerpt: clean(item.excerpt),
            signalScore: number(item.signalScore),
            evidenceBasis: clean(item.evidenceBasis),
          };
        }),
        characterLabels: displayLabels(segment.characterLabels),
        threadLabels: displayLabels(segment.threadLabels),
        receiptKeys: array(segment.receiptKeys).map(clean).filter(Boolean),
        guideCutIds: array(segment.guideCutIds).map(clean).filter(Boolean),
        guideChapterIds: array(segment.guideChapterIds).map(clean).filter(Boolean),
        guideAnchor: record(segment.guideAnchor),
        narrative: record(segment.narrative),
        evidenceBasis: clean(segment.evidenceBasis),
      };
    });
    story = reprojectStoryNarratives(story);
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
      deck: readableDeck(map),
      overview: readableOverview(map),
      topics: recapTopics(map),
      topicMap: array(map.topicMap).map(function (topic) {
        return {
          receiptKey: clean(topic.receiptKey),
          guideCutId: clean(topic.guideCutId),
          label: naturalLabel(topic.label),
          at: number(topic.at),
          end: number(topic.end),
          mentions: number(topic.mentions),
          firstAt: number(topic.firstAt),
          peakAt: number(topic.peakAt),
          cluster: number(topic.cluster),
          rank: number(topic.rank),
          intensity: number(topic.intensity),
          arrivalPercent: number(topic.arrivalPercent),
          peakPercent: number(topic.peakPercent),
          metricBasis: clean(topic.metricBasis),
        };
      }),
      sections: sections,
      story: story,
      highlightRunway: array(map.highlightRunway).map(function (moment) {
        return {
          receiptKey: clean(moment.receiptKey),
          guideCutId: clean(moment.guideCutId),
          ordinal: number(moment.ordinal),
          kind: clean(moment.kind),
          category: clean(moment.category),
          at: number(moment.at),
          end: number(moment.end),
          label: naturalLabel(moment.label),
          excerpt: clean(moment.excerpt),
          signalScore: number(moment.signalScore),
          evidenceBasis: clean(moment.evidenceBasis),
        };
      }),
      bestMoments: array(map.bestMoments),
      fanRead: readableFanRead(map),
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
