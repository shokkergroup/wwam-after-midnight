(function attachEpisodeFormatFallbackExperience(root, factory) {
  "use strict";

  var api = factory();
  if (root) {
    root.WWAM_EPISODE_FORMAT_FALLBACK_EXPERIENCE = api;
    root.WWAMEpisodeFormatFallbackExperience = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function buildFactory() {
  "use strict";

  var VERSION = "1.2.1";
  var SCHEMA = "shokker-lore/episode-format-fallback-experience/v1";
  var AUDIT_SCHEMA =
    "shokker-lore/episode-format-fallback-experience-audit/v1";
  var YOUTUBE_WATCH = "https://www.youtube.com/watch?v=";
  var ORIGIN_ORDER = [
    "topic-map",
    "highlight-runway",
    "recap-section",
    "guide-cut",
  ];

  var VIEW_CONFIG = Object.freeze({
    ranking: Object.freeze({
      mode: "ranking-board",
      navLabel: "RANKING TAPE",
      eyebrow: "THE BOARD // WITHOUT A FAKE ORDER",
      title: "THE RANKING TAPE MAP",
      deck:
        "Open the indexed subjects and saved tape stops around this ranking show.",
      boundary:
        "These stops do not establish a placement, ballot, winner, elimination, or visible board result.",
      evidenceNotice: "TOPIC DOORS ARE NOT RANKED RESULTS.",
      labels: Object.freeze({
        "topic-map": "RANKING SUBJECT DOOR",
        "highlight-runway": "RANKING TAPE MARKER",
        "recap-section": "RANKING RECAP STOP",
        "guide-cut": "RANKING GUIDE CUT",
      }),
    }),
    "audience-q-and-a": Object.freeze({
      mode: "qa-desk",
      navLabel: "Q&A TAPE",
      eyebrow: "QUESTIONS, ANSWERS & DETOURS",
      title: "THE Q&A TAPE MAP",
      deck:
        "Jump to the subjects and memorable turns we can place inside this Q&A.",
      boundary:
        "These stops do not pair a question with an answer or identify who asked or answered it.",
      evidenceNotice: "A TOPIC DOOR IS NOT A QUESTION-ANSWER PAIR.",
      labels: Object.freeze({
        "topic-map": "Q&A SUBJECT DOOR",
        "highlight-runway": "Q&A TAPE MARKER",
        "recap-section": "Q&A RECAP STOP",
        "guide-cut": "Q&A GUIDE CUT",
      }),
    }),
    "movie-news": Object.freeze({
      mode: "news-wire",
      navLabel: "NEWS WIRE",
      eyebrow: "WHAT HIT THE NEWS DESK",
      title: "THE MOVIE NEWS WIRE",
      deck:
        "Choose an indexed subject or saved stop from this movie-news tape.",
      boundary:
        "These stops do not decide whether a statement is reporting, rumor, opinion, or final news.",
      evidenceNotice: "TOPIC NAVIGATION IS NOT FACT CHECKING.",
      labels: Object.freeze({
        "topic-map": "NEWS SUBJECT DOOR",
        "highlight-runway": "NEWS TAPE MARKER",
        "recap-section": "NEWS RECAP STOP",
        "guide-cut": "NEWS GUIDE CUT",
      }),
    }),
    "movie-review": Object.freeze({
      mode: "review-desk",
      navLabel: "REVIEW TAPE",
      eyebrow: "PRAISE // PROBLEMS // VERDICTS",
      title: "THE REVIEW DESK",
      deck:
        "Jump to the movies, arguments, and review beats found in this show.",
      boundary:
        "These stops do not establish a verdict, sentiment, recommendation, joke, or reaction.",
      evidenceNotice: "A REVIEW TOPIC IS NOT A REVIEW VERDICT.",
      labels: Object.freeze({
        "topic-map": "REVIEW SUBJECT DOOR",
        "highlight-runway": "REVIEW TAPE MARKER",
        "recap-section": "REVIEW RECAP STOP",
        "guide-cut": "REVIEW GUIDE CUT",
      }),
    }),
    "episode-recap": Object.freeze({
      mode: "review-desk",
      navLabel: "EPISODE RECAP",
      eyebrow: "STORY BEATS // THE AFTERMATH",
      title: "THE EPISODE AFTERMATH",
      deck:
        "Follow the episode talk, theories, and biggest turns in the order they surface.",
      boundary:
        "These stops do not establish a plot fact, verdict, sentiment, recommendation, joke, or reaction.",
      evidenceNotice: "A RECAP STOP IS NOT A VERIFIED PLOT FACT.",
      labels: Object.freeze({
        "topic-map": "RECAP SUBJECT DOOR",
        "highlight-runway": "RECAP TAPE MARKER",
        "recap-section": "EPISODE RECAP STOP",
        "guide-cut": "RECAP GUIDE CUT",
      }),
    }),
    "trailer-coverage": Object.freeze({
      mode: "trailer-desk",
      navLabel: "TRAILER TAPE",
      eyebrow: "TRAILER TALK // THEORY BOARD",
      title: "THE TRAILER BREAKDOWN",
      deck:
        "Use the indexed subjects and saved source stops around this trailer coverage.",
      boundary:
        "These stops do not identify a trailer frame, dialogue origin, theory as fact, or host reaction.",
      evidenceNotice: "NO FRAME OR REACTION IS INFERRED.",
      labels: Object.freeze({
        "topic-map": "TRAILER SUBJECT DOOR",
        "highlight-runway": "TRAILER TAPE MARKER",
        "recap-section": "TRAILER RECAP STOP",
        "guide-cut": "TRAILER GUIDE CUT",
      }),
    }),
    "mixed-news-trailer": Object.freeze({
      mode: "trailer-desk",
      navLabel: "NEWS + TRAILER",
      eyebrow: "NEWS UP FRONT // TRAILER TALK",
      title: "THE NEWS + TRAILER BREAKDOWN",
      deck:
        "Jump between the news desk and trailer discussion without losing your place.",
      boundary:
        "These stops do not merge a news claim with a trailer frame, dialogue, theory, or reaction.",
      evidenceNotice: "THE NEWS AND TRAILER BOUNDARIES STAY SEPARATE.",
      labels: Object.freeze({
        "topic-map": "NEWS + TRAILER SUBJECT",
        "highlight-runway": "MIXED TAPE MARKER",
        "recap-section": "MIXED RECAP STOP",
        "guide-cut": "MIXED GUIDE CUT",
      }),
    }),
    "movie-companion": Object.freeze({
      mode: "movie-companion",
      navLabel: "COMPANION TAPE",
      eyebrow: "PRESS PLAY // WATCH WITH WWAM",
      title: "THE COMMENTARY COMPANION",
      deck:
        "Jump to the commentary's recurring subjects, detours, and character bits.",
      boundary:
        "These stops do not establish a movie scene, frame sync, audio origin, dialogue source, or host reaction.",
      evidenceNotice: "SOURCE TIME IS NOT MOVIE SYNC.",
      labels: Object.freeze({
        "topic-map": "COMPANION SUBJECT DOOR",
        "highlight-runway": "COMPANION TAPE MARKER",
        "recap-section": "COMPANION RECAP STOP",
        "guide-cut": "COMPANION GUIDE CUT",
      }),
    }),
    script: Object.freeze({
      mode: "script-spine",
      navLabel: "SCRIPT TAPE",
      eyebrow: "PAGE READS // RIFFS // DETOURS",
      title: "THE SCRIPT SHOW MAP",
      deck:
        "Follow the reading, riffs, and discussion through the original upload.",
      boundary:
        "These stops do not establish passage origin, authorship, role, speaker, depicted action, or script verdict.",
      evidenceNotice: "A TAPE STOP DOES NOT PROVE SCRIPT ORIGIN.",
      labels: Object.freeze({
        "topic-map": "SCRIPT SUBJECT DOOR",
        "highlight-runway": "SCRIPT TAPE MARKER",
        "recap-section": "SCRIPT RECAP STOP",
        "guide-cut": "SCRIPT GUIDE CUT",
      }),
    }),
    "watch-party": Object.freeze({
      mode: "scary-party",
      navLabel: "SCARE SCREEN",
      eyebrow: "SCARY VIDEO NIGHT // REACTION ROUTE",
      title: "THE SCARY-PARTY MAP",
      deck:
        "Jump to the subjects and turns we can place inside this scary-video party.",
      boundary:
        "These stops do not identify a watched item, third-party image, performer, scare, or host reaction.",
      evidenceNotice: "THE THIRD-PARTY VISUAL BOUNDARY STAYS CLOSED.",
      labels: Object.freeze({
        "topic-map": "SCARY-PARTY SUBJECT",
        "highlight-runway": "SCARY-PARTY TAPE MARKER",
        "recap-section": "SCARY-PARTY RECAP STOP",
        "guide-cut": "SCARY-PARTY GUIDE CUT",
      }),
    }),
    livestream: Object.freeze({
      mode: "livestream-wire",
      navLabel: "LIVE WIRE",
      eyebrow: "OPEN SHOW // ANYTHING CAN HAPPEN",
      title: "THE LIVESTREAM MAP",
      deck:
        "Browse the subjects, recap chapters, and memorable turns in this livestream.",
      boundary:
        "These stops do not assign a speaker, intent, verdict, visual context, or creator approval.",
      evidenceNotice: "THE MAP NAVIGATES; IT DOES NOT ATTRIBUTE.",
      labels: Object.freeze({
        "topic-map": "LIVESTREAM SUBJECT DOOR",
        "highlight-runway": "LIVESTREAM TAPE MARKER",
        "recap-section": "LIVESTREAM RECAP STOP",
        "guide-cut": "LIVESTREAM GUIDE CUT",
      }),
    }),
  });

  function clean(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function finite(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatTime(value) {
    var parsed = finite(value);
    var seconds = Math.max(0, Math.floor(parsed == null ? 0 : parsed));
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

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.keys(value).forEach(function freezeChild(key) {
      deepFreeze(value[key]);
    });
    return Object.freeze(value);
  }

  function viewConfig(source) {
    var runtimeId = clean(record(source.runtimeFormat).id);
    var contractId = clean(record(source.formatContract).id);
    var config = contractId === "episode-recap"
      ? VIEW_CONFIG["episode-recap"]
      : VIEW_CONFIG[runtimeId];
    if (!config) {
      throw new Error(
        "Unsupported normalized runtime format: " + (runtimeId || "missing"),
      );
    }
    return { runtimeId: runtimeId, config: config };
  }

  function recapFor(source) {
    return record(record(source.showWiki).episodeRecap);
  }

  function assertSource(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new TypeError(
        "Episode format fallback requires one normalized dossier source.",
      );
    }
    if (!clean(source.id) || !clean(source.title)) {
      throw new Error(
        "Episode format fallback requires a normalized source id and title.",
      );
    }
    if (!clean(record(source.runtimeFormat).id)) {
      throw new Error(
        clean(source.id) + " does not expose a normalized runtime format.",
      );
    }
  }

  function exactWindow(source, entry, origin, index) {
    var sourceId = clean(source.id);
    var embeddedSourceId = clean(entry.sourceId);
    if (embeddedSourceId && embeddedSourceId !== sourceId) {
      throw new Error(
        sourceId +
          " contains a cross-source " +
          origin +
          " coordinate at index " +
          index +
          ".",
      );
    }
    var at = finite(entry.at);
    var end = finite(entry.end);
    var duration = finite(source.duration);
    if (
      at == null ||
      end == null ||
      duration == null ||
      at < 0 ||
      end <= at ||
      end > duration + 1
    ) {
      throw new Error(
        sourceId +
          " contains an invalid " +
          origin +
          " window at index " +
          index +
          ".",
      );
    }
    return { at: at, end: end };
  }

  function playback(source, window) {
    var sourceId = clean(source.id);
    var startForUrl = Math.max(0, Math.floor(window.at));
    return {
      sourceId: sourceId,
      at: window.at,
      end: window.end,
      durationSeconds: window.end - window.at,
      timecode: formatTime(window.at),
      endTimecode: formatTime(window.end),
      url:
        YOUTUBE_WATCH +
        encodeURIComponent(sourceId) +
        "&t=" +
        startForUrl +
        "s",
    };
  }

  function excerptPolicy(source, value) {
    var excerpt = clean(value);
    if (!excerpt) {
      return { excerpt: null, excerptStatus: "not-registered" };
    }
    var policy = record(source.rightsPolicy);
    var limit = finite(policy.publicExcerptWordLimit);
    var words = excerpt.split(/\s+/).filter(Boolean).length;
    if (
      policy.restrictedToTopicNavigation === true ||
      limit == null ||
      limit <= 0 ||
      words > limit
    ) {
      return {
        excerpt: null,
        excerptStatus: "withheld-by-source-rights",
      };
    }
    return {
      excerpt: excerpt,
      excerptStatus: "exact-source-local-excerpt",
    };
  }

  function evidenceReference(entry, origin, index) {
    if (origin === "topic-map" || origin === "highlight-runway") {
      return clean(entry.receiptKey) || origin + "-" + String(index + 1);
    }
    if (origin === "recap-section") {
      return clean(entry.id) || origin + "-" + String(index + 1);
    }
    return clean(entry.id) || origin + "-" + String(index + 1);
  }

  function registeredTitle(entry, origin) {
    if (origin === "topic-map") return clean(entry.label) || "Indexed subject";
    if (origin === "highlight-runway") {
      return clean(entry.label) || clean(entry.category) || "Saved marker";
    }
    if (origin === "recap-section") {
      return clean(entry.label) || clean(entry.anchor) || "Recap stop";
    }
    return clean(entry.label) || clean(entry.topic) || "Guide cut";
  }

  function registeredSubject(entry, origin) {
    if (origin === "topic-map") return clean(entry.label) || null;
    if (origin === "highlight-runway") return clean(entry.label) || null;
    if (origin === "recap-section") return clean(entry.anchor) || null;
    return clean(entry.topic) || null;
  }

  function evidenceStatus(origin) {
    if (origin === "topic-map") return "topic-only-navigation";
    if (origin === "highlight-runway") {
      return "registered-highlight-marker-navigation";
    }
    if (origin === "recap-section") {
      return "registered-recap-section-navigation";
    }
    return "registered-guide-cut-navigation";
  }

  function exactRegisteredText(entry, origin) {
    if (origin === "recap-section") return clean(entry.body) || null;
    return null;
  }

  function itemSummary(config, origin, title, window) {
    var noun = clean(config.labels[origin]).toLowerCase();
    if (origin === "topic-map") {
      return (
        "Jump here when " +
        title +
        " enters the conversation at " +
        formatTime(window.at) +
        "."
      );
    }
    return (
      "Open this " +
      noun +
        " at " +
        formatTime(window.at) +
        " and hear the surrounding show context."
    );
  }

  function mapEntry(source, config, entry, origin, index) {
    var window = exactWindow(source, entry, origin, index);
    var reference = evidenceReference(entry, origin, index);
    var title = registeredTitle(entry, origin);
    var excerpt = excerptPolicy(
      source,
      origin === "recap-section" ? entry.excerpt : entry.excerpt,
    );
    return {
      id:
        clean(source.id) +
        "::fallback::" +
        origin +
        "::" +
        reference,
      sourceId: clean(source.id),
      origin: origin,
      evidenceIndex: index,
      evidenceRef: reference,
      evidenceStatus: evidenceStatus(origin),
      topicOnly: origin === "topic-map",
      navigationOnly: true,
      label: config.labels[origin],
      title: title,
      subject: registeredSubject(entry, origin),
      summary: itemSummary(config, origin, title, window),
      registeredText: exactRegisteredText(entry, origin),
      excerpt: excerpt.excerpt,
      excerptStatus: excerpt.excerptStatus,
      at: window.at,
      end: window.end,
      playback: playback(source, window),
    };
  }

  function mappedLane(source, config, values, origin) {
    return array(values).map(function mapEvidence(entry, index) {
      return mapEntry(source, config, record(entry), origin, index);
    });
  }

  function lanesFor(source, config, recap) {
    var guide = record(record(source.showWiki).episodeGuide);
    return {
      topicDoors: mappedLane(
        source,
        config,
        recap.topicMap,
        "topic-map",
      ),
      highlightMarkers: mappedLane(
        source,
        config,
        recap.highlightRunway,
        "highlight-runway",
      ),
      recapSections: mappedLane(
        source,
        config,
        recap.sections,
        "recap-section",
      ),
      guideCuts: mappedLane(
        source,
        config,
        guide.cuts,
        "guide-cut",
      ),
    };
  }

  function flattenLanes(lanes) {
    return ORIGIN_ORDER.reduce(function appendOrigin(items, origin) {
      var key =
        origin === "topic-map"
          ? "topicDoors"
          : origin === "highlight-runway"
            ? "highlightMarkers"
            : origin === "recap-section"
              ? "recapSections"
              : "guideCuts";
      return items.concat(lanes[key]);
    }, []).sort(function chronological(left, right) {
      return (
        left.at - right.at ||
        ORIGIN_ORDER.indexOf(left.origin) - ORIGIN_ORDER.indexOf(right.origin) ||
        left.evidenceIndex - right.evidenceIndex ||
        left.id.localeCompare(right.id)
      );
    });
  }

  function build(source) {
    assertSource(source);
    var recap = recapFor(source);
    if (clean(recap.state) !== "ready") return null;
    if (clean(recap.sourceId) && clean(recap.sourceId) !== clean(source.id)) {
      throw new Error(
        clean(source.id) + " contains a foreign episode recap source id.",
      );
    }
    var selected = viewConfig(source);
    var config = selected.config;
    var lanes = lanesFor(source, config, recap);
    var items = flattenLanes(lanes);
    if (!items.length) {
      throw new Error(
        clean(source.id) + " has a ready recap without fallback evidence.",
      );
    }
    return deepFreeze({
      schema: SCHEMA,
      version: VERSION,
      sourceId: clean(source.id),
      sourceTitle: clean(source.displayTitle || source.title),
      date: clean(source.date),
      duration: finite(source.duration),
      durationTimecode: formatTime(source.duration),
      runtimeFormat: {
        id: selected.runtimeId,
        label: clean(record(source.runtimeFormat).label),
        family: clean(record(source.runtimeFormat).family),
      },
      subtype: {
        id: clean(record(source.subtype).id),
        label: clean(record(source.subtype).label),
      },
      formatContractId: clean(record(source.formatContract).id),
      kind: config.mode,
      mode: config.mode,
      fallback: true,
      claimLevel: "navigation-only",
      navLabel: config.navLabel,
      eyebrow: config.eyebrow,
      title: config.title,
      episodeTitle: clean(source.displayTitle || source.title),
      description: config.deck,
      deck: config.deck,
      boundary: config.boundary,
      boundaryCopy: config.boundary,
      evidenceNotice: config.evidenceNotice,
      itemCount: items.length,
      items: items,
      lanes: lanes,
      sourcePlayback: playback(source, {
        at: 0,
        end: finite(source.duration),
      }),
    });
  }

  function buildAll(sources) {
    if (!Array.isArray(sources)) {
      throw new TypeError(
        "Episode format fallback collection must be an array.",
      );
    }
    var views = [];
    var heldSourceIds = [];
    sources.forEach(function buildSource(source) {
      var view = build(source);
      if (view) views.push(view);
      else heldSourceIds.push(clean(source && source.id));
    });
    var modes = views.reduce(function countMode(counts, view) {
      counts[view.mode] = (counts[view.mode] || 0) + 1;
      return counts;
    }, {});
    return deepFreeze({
      schema: SCHEMA,
      version: VERSION,
      totalSources: sources.length,
      views: views.length,
      held: heldSourceIds.length,
      heldSourceIds: heldSourceIds,
      modes: modes,
      experiences: views,
    });
  }

  function audit(sources) {
    var pack = buildAll(sources);
    var crossSourceCoordinates = [];
    var topicEvidenceMismatches = [];
    pack.experiences.forEach(function auditView(view) {
      view.items.forEach(function auditItem(item) {
        if (
          item.sourceId !== view.sourceId ||
          item.playback.sourceId !== view.sourceId
        ) {
          crossSourceCoordinates.push({
            sourceId: view.sourceId,
            itemId: item.id,
            itemSourceId: item.sourceId,
            playbackSourceId: item.playback.sourceId,
          });
        }
        if (
          (item.origin === "topic-map") !==
          (item.topicOnly === true &&
            item.evidenceStatus === "topic-only-navigation")
        ) {
          topicEvidenceMismatches.push({
            sourceId: view.sourceId,
            itemId: item.id,
          });
        }
      });
    });
    return deepFreeze({
      schema: AUDIT_SCHEMA,
      version: VERSION,
      totalSources: pack.totalSources,
      views: pack.views,
      held: pack.held,
      heldSourceIds: pack.heldSourceIds,
      modes: pack.modes,
      items: pack.experiences.reduce(function countItems(total, view) {
        return total + view.itemCount;
      }, 0),
      crossSourceCoordinates: crossSourceCoordinates,
      topicEvidenceMismatches: topicEvidenceMismatches,
      pass:
        crossSourceCoordinates.length === 0 &&
        topicEvidenceMismatches.length === 0 &&
        pack.views + pack.held === pack.totalSources,
    });
  }

  return deepFreeze({
    VERSION: VERSION,
    schema: SCHEMA,
    auditSchema: AUDIT_SCHEMA,
    build: build,
    buildAll: buildAll,
    audit: audit,
    formatTime: formatTime,
  });
});
