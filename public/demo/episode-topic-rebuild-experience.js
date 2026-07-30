(function attachEpisodeTopicRebuildExperience(root, factory) {
  "use strict";

  var api = factory();
  if (root) {
    root.WWAM_EPISODE_TOPIC_REBUILD_EXPERIENCE = api;
    root.WWAMEpisodeTopicRebuildExperience = api;
  }
})(
  typeof window !== "undefined" ? window : globalThis,
  function buildFactory() {
    "use strict";

    var SCHEMA = "wwam-episode-topic-rebuild-experience/v1";
    var VERSION = "1.2.0";
    var YOUTUBE_WATCH = "https://www.youtube.com/watch?v=";
    var BOUNDARY =
      "These stops were located from the upload's captions. Play the clip to confirm who is speaking and see the full audio and visual context.";

    var LANE_CONFIG = Object.freeze({
      "topic-door": Object.freeze({
        id: "topic-format-door",
        label: "TOPIC / FORMAT DOOR",
      }),
      "format-cue": Object.freeze({
        id: "topic-format-door",
        label: "TOPIC / FORMAT DOOR",
      }),
      "evaluation-candidate": Object.freeze({
        id: "spoken-take-candidate",
        label: "ON-TAPE TAKE",
      }),
      "comedy-candidate": Object.freeze({
        id: "comedy-candidate",
        label: "COMEDY BEAT",
      }),
    });

    var FORMAT_LABELS = Object.freeze({
      "movie-commentary": "MOVIE COMMENTARY",
      "scary-video-watch-party": "SCARY-VIDEO WATCH PARTY",
      "death-scene-tier-ranking": "DEATH-SCENE RANKING",
      "trailer-reaction": "TRAILER + NEWS LIVE SHOW",
      "script-reading": "SCRIPT READING",
      "watch-party": "MOVIE WATCH PARTY",
      "source-video-watch-party": "SCARY-VIDEO WATCH PARTY",
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

    function normalizePayloads(payloads) {
      if (Array.isArray(payloads)) return payloads;
      if (!payloads || typeof payloads !== "object") return [];
      if (Array.isArray(payloads.guides)) return [payloads];
      if (Array.isArray(payloads.batches)) return payloads.batches;
      return Object.keys(payloads)
        .map(function getPayload(key) {
          return payloads[key];
        })
        .filter(function hasGuides(payload) {
          return payload && Array.isArray(payload.guides);
        });
    }

    function guideIndex(payloads) {
      var index = new Map();
      normalizePayloads(payloads).forEach(function addPayload(payload) {
        if (!payload || !Array.isArray(payload.guides)) return;
        payload.guides.forEach(function addGuide(guide) {
          var id = clean(guide && guide.id);
          if (!id) {
            throw new Error("Topic rebuild presenter found a source without an id.");
          }
          if (index.has(id)) {
            throw new Error("Topic rebuild presenter found duplicate source " + id + ".");
          }
          index.set(id, guide);
        });
      });
      return index;
    }

    function assertGuide(guide) {
      if (!guide || typeof guide !== "object") {
        throw new Error("Topic rebuild presenter requires one source guide.");
      }
      var id = clean(guide.id);
      var title = clean(guide.title);
      var duration = integer(guide.duration, 0);
      var episodeGuide = guide.episodeGuide;
      var cuts = episodeGuide && episodeGuide.cuts;
      if (!id || !title || !duration) {
        throw new Error("Topic rebuild presenter requires source identity.");
      }
      if (!Array.isArray(cuts) || cuts.length !== 15) {
        throw new Error(id + " must expose exactly 15 source stops.");
      }
      cuts.forEach(function validateCut(cut, index) {
        var classification = clean(cut && cut.classification);
        var at = integer(cut && cut.at, -1);
        var end = integer(cut && cut.end, -1);
        if (!LANE_CONFIG[classification]) {
          throw new Error(id + " has an unsupported stop classification.");
        }
        for (var key of [
          "id",
          "label",
          "topic",
          "summary",
          "excerpt",
          "classification",
        ]) {
          if (!clean(cut && cut[key])) {
            throw new Error(id + " has an incomplete stop at position " + index + ".");
          }
        }
        if (at < 0 || end <= at || end > duration) {
          throw new Error(id + " has an invalid playback window.");
        }
        if (index && integer(cuts[index - 1].at, -1) >= at) {
          throw new Error(id + " source stops are not chronological.");
        }
      });
    }

    function presentStop(guide, cut, index) {
      var classification = clean(cut.classification);
      var lane = LANE_CONFIG[classification];
      var at = integer(cut.at, 0);
      var end = integer(cut.end, at + 1);
      return {
        number: index + 1,
        id: clean(cut.id),
        at: at,
        end: end,
        label: clean(cut.label),
        topic: clean(cut.topic),
        summary: clean(cut.summary),
        excerpt: clean(cut.excerpt),
        classification: classification,
        visitorLane: lane.id,
        visitorLabel: lane.label,
        timecode: formatTime(at),
        endTimecode: formatTime(end),
        playback: playback(clean(guide.id), at, end),
      };
    }

    function laneSummary(stops) {
      var counts = {
        "topic-format-door": 0,
        "spoken-take-candidate": 0,
        "comedy-candidate": 0,
      };
      stops.forEach(function countStop(stop) {
        counts[stop.visitorLane] += 1;
      });
      return [
        {
          id: "topic-format-door",
          label: "TOPIC / FORMAT DOOR",
          count: counts["topic-format-door"],
        },
        {
          id: "spoken-take-candidate",
          label: "ON-TAPE TAKE",
          count: counts["spoken-take-candidate"],
        },
        {
          id: "comedy-candidate",
          label: "COMEDY BEAT",
          count: counts["comedy-candidate"],
        },
      ];
    }

    function presentGuide(guide) {
      assertGuide(guide);
      var sourceId = clean(guide.id);
      var duration = integer(guide.duration, 0);
      var format = clean(guide.episodeGuide.format);
      var stops = guide.episodeGuide.cuts.map(function mapCut(cut, index) {
        return presentStop(guide, cut, index);
      });
      return {
        schema: SCHEMA,
        kind: "exact-source-stop-guide",
        sourceId: sourceId,
        sourceTitle: clean(guide.title),
        date: clean(guide.date),
        duration: duration,
        durationTimecode: formatTime(duration),
        sourceUrl: clean(guide.url),
        thumbnail: clean(guide.thumbnail),
        format: format,
        formatLabel: FORMAT_LABELS[format] || "LIVE SHOW",
        eyebrow: "PLAY THE TAPE // FOLLOW THE STOPS",
        title: "15 EXACT-SOURCE STOPS",
        description:
          "Choose a topic, an on-tape take, or a comedy beat and jump directly to that point in the official upload.",
        boundary: BOUNDARY,
        stopCount: stops.length,
        lanes: laneSummary(stops),
        stops: stops,
        sourcePlayback: playback(sourceId, 0, duration),
      };
    }

    function build(payloads, sourceId) {
      var id = clean(sourceId);
      if (!id) return null;
      var guide = guideIndex(payloads).get(id) || null;
      return guide ? presentGuide(guide) : null;
    }

    function buildAll(payloads) {
      var guides = Array.from(guideIndex(payloads).values());
      var experiences = guides.map(presentGuide);
      return {
        schema: SCHEMA,
        sourceCount: experiences.length,
        stopCount: experiences.reduce(function countStops(total, experience) {
          return total + experience.stopCount;
        }, 0),
        experiences: experiences,
      };
    }

    function fromWindow(sourceId) {
      if (typeof window === "undefined") return null;
      var batches = [
        window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH1,
        window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH2,
        window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH3,
        window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH4,
        window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH5,
      ].filter(Boolean);
      return batches.length ? build(batches, sourceId) : null;
    }

    return Object.freeze({
      VERSION: VERSION,
      schema: SCHEMA,
      build: build,
      buildAll: buildAll,
      formatTime: formatTime,
      fromWindow: fromWindow,
    });
  },
);
