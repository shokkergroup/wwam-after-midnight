(function attachEpisodeFormatExperience(root, factory) {
  "use strict";

  var api = factory();
  if (root) {
    root.WWAM_EPISODE_FORMAT_EXPERIENCE = api;
    root.WWAMEpisodeFormatExperience = api;
    if (root.WWAM_EPISODE_FACTS_PILOT) {
      root.WWAM_EPISODE_FORMAT_VIEWS = api.presentAll(
        root.WWAM_EPISODE_FACTS_PILOT,
      );
    }
  }
})(typeof window !== "undefined" ? window : globalThis, function buildFactory() {
  "use strict";

  var SCHEMA = "wwam-episode-format-experience/v1";
  var VERSION = "1.2.0";
  var YOUTUBE_WATCH = "https://www.youtube.com/watch?v=";

  var VIEW_CONFIG = Object.freeze({
    "ranking-list": Object.freeze({
      mode: "ranking-board",
      navLabel: "RANKING BOARD",
      eyebrow: "THE TAPE-LOCKED LIST",
      title: "THE RANKING BOARD",
      deck: "Hear the rules, picks, placements, and pivots in the order they appear on this tape.",
      boundary:
        "These are captioned ranking statements, not verified on-screen placements, and no speaker is assigned.",
    }),
    "parallel-ranking": Object.freeze({
      mode: "ranking-board",
      navLabel: "DUELING BALLOTS",
      eyebrow: "TWO LISTS // KEPT APART",
      title: "THE DUELING RANKING BOARD",
      deck: "Follow both captioned ballots without collapsing repeated ranks into one list.",
      boundary:
        "The two caption sequences stay separate, but the tape does not identify either speaker or verify an on-screen result.",
    }),
    "question-and-answer": Object.freeze({
      mode: "qa-desk",
      navLabel: "Q&A DESK",
      eyebrow: "QUESTION IN // RESPONSE OUT",
      title: "THE Q&A DESK",
      deck: "Jump from each saved question cue to its nearby response window.",
      boundary:
        "Each card joins a source-local question cue to a nearby response window without assigning a speaker or proving answer ownership.",
    }),
    "review-and-qa": Object.freeze({
      mode: "qa-desk",
      navLabel: "REVIEW + Q&A",
      eyebrow: "REVIEW FLOOR // OPEN QUESTIONS",
      title: "THE REVIEW Q&A DESK",
      deck: "Enter where the review opens into questions, then play the saved response windows.",
      boundary:
        "Each card joins a source-local question cue to a nearby response window without assigning a speaker or proving answer ownership.",
    }),
    "news-agenda": Object.freeze({
      mode: "news-wire",
      navLabel: "NEWS WIRE",
      eyebrow: "SUBJECT DOORS // EXACT STOPS",
      title: "THE NEWS WIRE",
      deck: "Choose a subject and drop into the exact place it enters the indexed agenda.",
      boundary:
        "These are exact captioned subject doors, not claims about importance, uninterrupted coverage, or a final opinion.",
    }),
    "trailer-breakdown": Object.freeze({
      mode: "news-wire",
      navLabel: "BREAKDOWN WIRE",
      eyebrow: "THEORY // TRAILER // AFTERTALK",
      title: "THE BREAKDOWN WIRE",
      deck: "Move from theory talk to the trailer cue and the late business around the release.",
      boundary:
        "These are exact captioned subject doors, not claims about importance, uninterrupted coverage, or a final opinion.",
    }),
    "script-reading": Object.freeze({
      mode: "script-spine",
      navLabel: "SCRIPT SPINE",
      eyebrow: "SETUP // READ // SCENE CUES",
      title: "THE SCRIPT SPINE",
      deck: "Follow the saved setup, reading start, opening line, and scene-direction cues.",
      boundary:
        "These are captioned reading and scene-direction cues, while the source script, roles, and depicted visuals remain unverified.",
    }),
    "watchalong-commentary": Object.freeze({
      mode: "sync-desk",
      navLabel: "SYNC DESK",
      eyebrow: "PRESHOW // COUNTDOWN // PLAY",
      title: "THE SYNC DESK",
      deck: "Start with the preshow cue, then use the countdown and play-language stops.",
      boundary:
        "These are countdown and play-language cues, so verify the movie edition and frame sync before using them.",
    }),
    "review-desk": Object.freeze({
      mode: "review-desk",
      navLabel: "REVIEW DESK",
      eyebrow: "PRAISE // PROBLEMS // VERDICTS",
      title: "THE REVIEW DESK",
      deck: "Move through spoiler lines, scene reactions, criticisms, and saved verdict language in tape order.",
      boundary:
        "These cards restate captioned review language from this source without identifying a speaker or certifying any depicted scene.",
    }),
    "episode-recap": Object.freeze({
      mode: "recap-desk",
      navLabel: "EPISODE RECAP",
      eyebrow: "STORY BEATS // REACTIONS // VERDICT",
      title: "THE EPISODE RECAP",
      deck: "Follow the episode reactions, standout beats, criticisms, theories, and closing verdict in tape order.",
      boundary:
        "These cards restate captioned recap language from this source while keeping theories tentative and speakers and depicted scenes unverified.",
    }),
  });

  function clean(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
  }

  function integer(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
  }

  function formatTime(value) {
    var seconds = integer(value, 0);
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainder = seconds % 60;
    if (hours) {
      return (
        String(hours) +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainder).padStart(2, "0")
      );
    }
    return String(minutes) + ":" + String(remainder).padStart(2, "0");
  }

  function playback(sourceId, at, end) {
    var start = integer(at, 0);
    var stop = Math.max(start + 1, integer(end, start + 1));
    return {
      sourceId: sourceId,
      at: start,
      end: stop,
      durationSeconds: stop - start,
      timecode: formatTime(start),
      endTimecode: formatTime(stop),
      url: YOUTUBE_WATCH + encodeURIComponent(sourceId) + "&t=" + start + "s",
    };
  }

  function factShell(source, fact) {
    var at = integer(fact.at, 0);
    var end = Math.max(at + 1, integer(fact.end, 1));
    return {
      id: clean(fact.id),
      factId: clean(fact.id),
      at: at,
      end: end,
      excerpt: clean(fact.excerpt),
      playback: playback(source.id, fact.at, fact.end),
      meta: {
        timecode: formatTime(at),
        endTimecode: formatTime(end),
        durationSeconds: end - at,
      },
    };
  }

  function ballotBadge(fact) {
    if (fact.sequenceLane === "caption-ballot-a") return "BALLOT A";
    if (fact.sequenceLane === "caption-ballot-b") return "BALLOT B";
    if (fact.sequenceLane === "character-caption-sequence") {
      return "CHARACTER LIST";
    }
    if (Number.isFinite(Number(fact.position))) {
      return "RANK #" + String(Math.floor(Number(fact.position)));
    }
    if (fact.eventKind === "ranking-start") return "LIST START";
    if (fact.eventKind === "scope-rule") return "BOARD RULE";
    if (fact.eventKind === "scope-transition") return "NEW BOARD";
    if (fact.eventKind === "placement-debate") return "PLACEMENT DEBATE";
    return "RANKING STOP";
  }

  function rankingSummary(fact) {
    var subject = clean(fact.subject);
    var placement = clean(fact.placementLanguage);
    var position = Number(fact.position);
    if (subject && Number.isFinite(position)) {
      return (
        subject +
        " is paired with #" +
        String(Math.floor(position)) +
        " ranking language on " +
        (fact.sequenceLane === "caption-ballot-b"
          ? "Ballot B."
          : fact.sequenceLane === "caption-ballot-a"
            ? "Ballot A."
            : "this list.")
      );
    }
    if (subject && placement) {
      return (
        subject +
        ' is paired with the captioned placement phrase "' +
        placement +
        '".'
      );
    }
    if (fact.eventKind === "ranking-start") {
      return "The captioned ranking segment opens at this stop.";
    }
    if (fact.eventKind === "scope-rule") {
      return "The tape states the scope rule for the board at this stop.";
    }
    if (fact.eventKind === "scope-transition") {
      return "The tape opens a second board for character picks here.";
    }
    if (subject) {
      return subject + " enters the captioned ranking conversation here.";
    }
    return "This stop captures a captioned setup or pivot in the ranking.";
  }

  function rankingItem(source, fact) {
    var shell = factShell(source, fact);
    return Object.assign(shell, {
      label: ballotBadge(fact),
      title: clean(fact.label) || "RANKING STOP",
      summary: rankingSummary(fact),
      topic: clean(fact.subject) || "Ranking",
      subject: clean(fact.subject) || null,
      position: Number.isFinite(Number(fact.position))
        ? Math.floor(Number(fact.position))
        : null,
      placement: clean(fact.placementLanguage) || null,
      ballot:
        fact.sequenceLane === "caption-ballot-a"
          ? "A"
          : fact.sequenceLane === "caption-ballot-b"
            ? "B"
            : null,
      meta: Object.assign({}, shell.meta, {
        position: Number.isFinite(Number(fact.position))
          ? Math.floor(Number(fact.position))
          : null,
        placement: clean(fact.placementLanguage) || null,
        ballot:
          fact.sequenceLane === "caption-ballot-a"
            ? "A"
            : fact.sequenceLane === "caption-ballot-b"
              ? "B"
              : null,
      }),
    });
  }

  function qaItem(source, fact) {
    var question = fact.questionEvidence || {};
    var response = fact.responseEvidence || {};
    var subject = clean(fact.subject) || "this question";
    var shell = factShell(source, fact);
    var item = Object.assign(shell, {
      label: "QUESTION + RESPONSE",
      title: clean(fact.label) || "Q&A STOP",
      summary:
        "The question cue for " +
        subject +
        " starts at " +
        formatTime(question.at) +
        ", with the saved response window at " +
          formatTime(response.at) +
          ".",
      topic: clean(fact.subject) || "Q&A",
      subject: clean(fact.subject) || null,
      question: {
        at: integer(question.at, fact.at),
        end: Math.max(
          integer(question.at, fact.at) + 1,
          integer(question.end, fact.end),
        ),
        excerpt: clean(question.excerpt),
        playback: playback(
          source.id,
          question.at == null ? fact.at : question.at,
          question.end == null ? fact.end : question.end,
        ),
      },
      response: {
        at: integer(response.at, fact.at),
        end: Math.max(
          integer(response.at, fact.at) + 1,
          integer(response.end, fact.end),
        ),
        excerpt: clean(response.excerpt),
        playback: playback(
          source.id,
          response.at == null ? fact.at : response.at,
          response.end == null ? fact.end : response.end,
        ),
      },
      meta: Object.assign({}, shell.meta, {
        questionAt: integer(question.at, fact.at),
        responseAt: integer(response.at, fact.at),
      }),
    });
    return item;
  }

  function agendaItem(source, fact) {
    var subject = clean(fact.subject) || clean(fact.label) || "Subject";
    var peak = Number(fact.topicPeakAt);
    var hasPeak = Number.isFinite(peak) && peak > Number(fact.at);
    var shell = factShell(source, fact);
    return Object.assign(shell, {
      label: hasPeak ? "SUBJECT DOOR + SECOND SIGNAL" : "SUBJECT DOOR",
      title: clean(fact.label) || subject.toUpperCase(),
      summary: hasPeak
        ? subject +
          " opens at " +
          formatTime(fact.at) +
          ", with another saved subject signal at " +
          formatTime(peak) +
          "."
        : subject +
          " enters the indexed agenda at " +
          formatTime(fact.at) +
          ".",
      topic: subject,
      subject: subject,
      secondSignalAt: hasPeak ? Math.floor(peak) : null,
      secondSignalTimecode: hasPeak ? formatTime(peak) : null,
      meta: Object.assign({}, shell.meta, {
        secondSignalAt: hasPeak ? Math.floor(peak) : null,
        secondSignalTimecode: hasPeak ? formatTime(peak) : null,
      }),
    });
  }

  function scriptBadge(fact) {
    var cue = clean(fact.cueKind);
    if (cue === "show-setup") return "SETUP";
    if (cue === "script-metadata-language") return "SCRIPT NOTE";
    if (cue === "reading-start") return "READING START";
    if (cue === "captioned-title-line") return "OPENING LINE";
    if (cue === "captioned-scene-direction") return "SCENE DIRECTION";
    return "SCRIPT CUE";
  }

  function scriptItem(source, fact) {
    var badge = scriptBadge(fact);
    var shell = factShell(source, fact);
    return Object.assign(shell, {
      label: badge,
      title: clean(fact.label) || badge,
      summary:
        badge +
        " language appears in the captions at " +
        formatTime(fact.at) +
        ".",
      topic: "Script reading",
      cue: clean(fact.cueKind) || null,
      meta: Object.assign({}, shell.meta, {
        cue: clean(fact.cueKind) || null,
      }),
    });
  }

  function syncBadge(fact) {
    var cue = clean(fact.cueKind);
    if (cue === "start-setup") return "START SETUP";
    if (cue === "countdown") return "COUNTDOWN";
    if (cue === "play-press-language") return "PRESS PLAY";
    return "SYNC CUE";
  }

  function syncItem(source, fact) {
    var badge = syncBadge(fact);
    var shell = factShell(source, fact);
    return Object.assign(shell, {
      label: badge,
      title: clean(fact.label) || badge,
      summary:
        badge +
        " language appears in the commentary at " +
        formatTime(fact.at) +
        ".",
      topic: "Playback sync",
      cue: clean(fact.cueKind) || null,
      meta: Object.assign({}, shell.meta, {
        cue: clean(fact.cueKind) || null,
      }),
    });
  }

  function reviewBadge(fact, isRecap) {
    var moment = clean(fact.momentKind);
    if (moment === "captioned-section-score") return "SECTION SCORE";
    if (moment === "captioned-spoiler-boundary") return "SPOILER LINE";
    if (
      moment === "captioned-review-setup" ||
      moment === "captioned-recap-setup"
    ) {
      return isRecap ? "RECAP SETUP" : "REVIEW SETUP";
    }
    if (moment === "captioned-comedy-highlight") return "COMEDY HIT";
    if (
      moment === "captioned-review-highlight" ||
      moment === "captioned-recap-highlight"
    ) {
      return isRecap ? "STANDOUT BEAT" : "BEST BEAT";
    }
    if (
      moment === "captioned-review-critique" ||
      moment === "captioned-recap-critique"
    ) {
      return "THE MISS";
    }
    if (moment === "captioned-recap-theory") return "THEORY";
    if (
      moment === "captioned-review-verdict" ||
      moment === "captioned-recap-verdict"
    ) {
      return "VERDICT";
    }
    if (moment === "captioned-review-summary") return "TAKEAWAY";
    return isRecap ? "RECAP STOP" : "REVIEW STOP";
  }

  function stanceLabel(value) {
    var stance = clean(value);
    if (stance === "format") return "FORMAT";
    if (stance === "emotional-positive") return "EMOTIONAL HIT";
    if (stance === "positive-surprise") return "POSITIVE SURPRISE";
    if (stance === "positive") return "POSITIVE";
    if (stance === "mixed-positive" || stance === "positive-mixed") {
      return "MIXED-POSITIVE";
    }
    if (stance === "mixed") return "MIXED";
    if (stance === "negative") return "NEGATIVE";
    if (stance === "negative-mixed") return "MIXED-NEGATIVE";
    if (stance === "negative-prediction") return "NEGATIVE THEORY";
    return "UNSET";
  }

  function reviewSummary(fact, isRecap) {
    var claim = clean(fact.claim && fact.claim.text);
    if (claim) return claim;
    var subject = clean(fact.subject) || (isRecap ? "This recap beat" : "This review stop");
    var tone = stanceLabel(fact.stance);
    var score = clean(fact.scoreText);
    if (score) {
      return subject + " is paired with a captioned score of " + score + ".";
    }
    if (tone !== "UNSET" && tone !== "FORMAT") {
      return subject + " carries a " + tone.toLowerCase() + " reaction at this stop.";
    }
    return subject + " enters the captioned " + (isRecap ? "recap" : "review") + " here.";
  }

  function reviewItem(source, fact, isRecap) {
    var shell = factShell(source, fact);
    var badge = reviewBadge(fact, isRecap);
    var tone = stanceLabel(fact.stance);
    var score = clean(fact.scoreText) || null;
    return Object.assign(shell, {
      label: score ? badge + " // " + score.toUpperCase() : badge,
      title: clean(fact.label) || badge,
      summary: reviewSummary(fact, isRecap),
      topic: clean(fact.subject) || (isRecap ? "Episode recap" : "Review"),
      subject: clean(fact.subject) || null,
      tone: tone,
      score: score,
      moment: badge,
      meta: Object.assign({}, shell.meta, {
        tone: tone,
        score: score,
        moment: badge,
      }),
    });
  }

  function phaseItem(source, fact) {
    var shell = factShell(source, fact);
    return Object.assign(shell, {
      label: clean(fact.label) || "TAPE STOP",
      title: formatTime(fact.at),
      summary: "Open this evenly spaced route marker.",
      topic: "Timeline",
    });
  }

  function sourceItems(source, config) {
    var lane = source[source.formatSpecificFactType];
    if (!Array.isArray(lane)) return [];
    if (config.mode === "ranking-board") {
      return lane.map(function mapRanking(fact) {
        return rankingItem(source, fact);
      });
    }
    if (config.mode === "qa-desk") {
      return lane.map(function mapQa(fact) {
        return qaItem(source, fact);
      });
    }
    if (config.mode === "news-wire") {
      return lane.map(function mapAgenda(fact) {
        return agendaItem(source, fact);
      });
    }
    if (config.mode === "script-spine") {
      return lane.map(function mapScript(fact) {
        return scriptItem(source, fact);
      });
    }
    if (config.mode === "review-desk") {
      return lane.map(function mapReview(fact) {
        return reviewItem(source, fact, false);
      });
    }
    if (config.mode === "recap-desk") {
      return lane.map(function mapRecap(fact) {
        return reviewItem(source, fact, true);
      });
    }
    return lane.map(function mapSync(fact) {
      return syncItem(source, fact);
    });
  }

  function assertSource(source) {
    if (!source || typeof source !== "object") {
      throw new Error("Episode format presenter requires one source fact pack.");
    }
    if (!clean(source.id) || !clean(source.title)) {
      throw new Error("Episode format presenter requires a source id and title.");
    }
    if (!VIEW_CONFIG[source.format]) {
      throw new Error("Unsupported episode format: " + clean(source.format));
    }
    if (
      !clean(source.formatSpecificFactType) ||
      !Array.isArray(source[source.formatSpecificFactType])
    ) {
      throw new Error(
        clean(source.id) + " does not expose its typed presentation lane.",
      );
    }
  }

  function presentSource(source) {
    assertSource(source);
    var config = VIEW_CONFIG[source.format];
    var items = sourceItems(source, config);
    var phases = Array.isArray(source.phaseBoundaries)
      ? source.phaseBoundaries.map(function mapPhase(fact) {
          return phaseItem(source, fact);
        })
      : [];
    return {
      schema: SCHEMA,
      sourceId: clean(source.id),
      sourceTitle: clean(source.title),
      date: clean(source.date),
      duration: integer(source.duration, 0),
      durationTimecode: formatTime(source.duration),
      kind: config.mode,
      mode: config.mode,
      navLabel: config.navLabel,
      eyebrow: config.eyebrow,
      title: config.title,
      episodeTitle: clean(source.title),
      description: config.deck,
      deck: config.deck,
      boundary: config.boundary,
      boundaryCopy: config.boundary,
      itemCount: items.length,
      items: items,
      phaseRail: phases,
      sourcePlayback: playback(source.id, 0, Math.max(1, source.duration)),
    };
  }

  function presentAll(payload) {
    if (!payload || !Array.isArray(payload.sources)) {
      throw new Error("Episode format presenter requires a source collection.");
    }
    var experiences = payload.sources.map(presentSource);
    var modes = {};
    experiences.forEach(function countMode(experience) {
      modes[experience.mode] = (modes[experience.mode] || 0) + 1;
    });
    return {
      schema: SCHEMA,
      sources: experiences.length,
      items: experiences.reduce(function countItems(total, experience) {
        return total + experience.itemCount;
      }, 0),
      modes: modes,
      experiences: experiences,
    };
  }

  function getById(payload, sourceId) {
    var pack = presentAll(payload);
    return (
      pack.experiences.find(function findExperience(experience) {
        return experience.sourceId === clean(sourceId);
      }) || null
    );
  }

  function build(payload, sourceId) {
    if (!payload || !Array.isArray(payload.sources)) return null;
    var source =
      payload.sources.find(function findSource(candidate) {
        return clean(candidate && candidate.id) === clean(sourceId);
      }) || null;
    return source ? presentSource(source) : null;
  }

  function fromWindow(sourceId) {
    if (typeof window === "undefined") return null;
    var packs = [
      window.WWAM_EPISODE_FACTS_PILOT,
      window.WWAM_EPISODE_FACTS_BATCH2,
      window.WWAM_EPISODE_FACTS_BATCH3,
    ].filter(Boolean);
    for (var index = 0; index < packs.length; index += 1) {
      var experience = getById(packs[index], sourceId);
      if (experience) return experience;
    }
    return null;
  }

  return Object.freeze({
    VERSION: VERSION,
    schema: SCHEMA,
    build: build,
    formatTime: formatTime,
    presentSource: presentSource,
    presentAll: presentAll,
    getById: getById,
    fromWindow: fromWindow,
  });
});
