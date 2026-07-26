(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker-distill-worklist/v1";
  var MANIFEST_SCHEMA = "shokker-distill-worklist-manifest/v1";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce(function (output, key) {
        output[key] = stableValue(value[key]);
        return output;
      }, {});
    }
    return value;
  }

  function stableJson(value) {
    return JSON.stringify(stableValue(value));
  }

  function utf8Bytes(value) {
    var source = String(value);
    var bytes = [];
    for (var index = 0; index < source.length; index += 1) {
      var point = source.charCodeAt(index);
      if (point >= 0xd800 && point <= 0xdbff && index + 1 < source.length) {
        var low = source.charCodeAt(index + 1);
        if (low >= 0xdc00 && low <= 0xdfff) {
          point = 0x10000 + ((point - 0xd800) << 10) + (low - 0xdc00);
          index += 1;
        }
      }
      if (point <= 0x7f) bytes.push(point);
      else if (point <= 0x7ff) {
        bytes.push(0xc0 | point >> 6, 0x80 | point & 0x3f);
      } else if (point <= 0xffff) {
        bytes.push(
          0xe0 | point >> 12,
          0x80 | point >> 6 & 0x3f,
          0x80 | point & 0x3f
        );
      } else {
        bytes.push(
          0xf0 | point >> 18,
          0x80 | point >> 12 & 0x3f,
          0x80 | point >> 6 & 0x3f,
          0x80 | point & 0x3f
        );
      }
    }
    return bytes;
  }

  function fnv1a32(value) {
    var hash = 2166136261;
    utf8Bytes(value).forEach(function (byte) {
      hash ^= byte;
      hash = Math.imul(hash, 16777619);
    });
    return "fnv1a32:" + ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function sourceMetadata(source, fallbackType) {
    return {
      id: clean(source.id),
      title: clean(source.title || source.film),
      displayTitle: clean(source.film || source.title),
      date: clean(source.date),
      duration: Number(source.duration || 0),
      views: Number(source.views || 0),
      thumbnail: clean(source.thumbnail),
      url: clean(source.url) ||
        "https://www.youtube.com/watch?v=" + encodeURIComponent(clean(source.id)),
      availability: clean(source.availability) || "not-captured",
      liveStatus: clean(source.liveStatus) || "not-captured",
      sourceType: fallbackType,
    };
  }

  function itemFingerprint(item) {
    var copy = clone(item);
    delete copy.fingerprint;
    return fnv1a32(stableJson(copy));
  }

  function stagePacket(item, manifestFingerprint) {
    return {
      schema: "shokker-distill-stage-packet/v1",
      worklistFingerprint: manifestFingerprint,
      workItemFingerprint: item.fingerprint,
      source: {
        id: item.id,
        url: item.url,
        title: item.displayTitle || item.title,
        date: item.date,
        duration: item.duration,
        views: item.views,
        coverage: item.coverage,
        priority: item.atlasPriority,
        stagedFrom: "distill-worklist",
      },
      transcript: {
        required: true,
        supplied: false,
        expectedFormat: "youtube-json3",
        expectedCacheBinding: item.expectedCacheBinding,
      },
      policy: {
        contentClaimsAllowed: false,
        speakerDiarized: false,
        visualContextVerified: false,
        promotionAllowed: false,
        nextState: "quarantine",
      },
    };
  }

  function create(options) {
    var input = options || {};
    var atlas = input.atlas;
    var atlasEngine = input.atlasEngine;
    var catalog = array(input.catalog);
    var channel = input.channel || {};
    if (!atlas || !Array.isArray(atlas.records)) {
      throw new Error("Distill Worklist requires the canonical Archive Atlas payload.");
    }
    if (!atlasEngine || typeof atlasEngine.getDistillQueue !== "function") {
      throw new Error("Distill Worklist requires an Archive Atlas engine.");
    }

    var atlasQueue = atlasEngine.getDistillQueue({ limit: 500 });
    if (atlasQueue.records.length !== atlasQueue.eligible) {
      throw new Error("Distill Worklist refuses a truncated Atlas acquisition queue.");
    }
    var priorityById = new Map(atlasQueue.records.map(function (record) {
      return [record.id, record.priority];
    }));
    var atlasIds = new Set();
    var records = [];

    atlas.records.forEach(function (source) {
      atlasIds.add(source.id);
      if (source.coverage !== "metadata-only" &&
          source.coverage !== "caption-limited") return;
      var metadata = sourceMetadata(source, "livestream");
      var acquire = source.coverage === "metadata-only";
      var priority = acquire ? priorityById.get(source.id) || null : null;
      if (acquire && !priority) {
        throw new Error("Distill Worklist lost Atlas priority for " + source.id + ".");
      }
      var item = Object.assign(metadata, {
        coverage: source.coverage,
        showWikiState: "source-brief",
        workType: acquire ? "acquire-caption" : "recover-caption",
        captionState: acquire ? "missing" : "limited-or-unavailable",
        currentStage: acquire ? "discover" : "recover",
        nextAction: acquire
          ? "Acquire a source-bound timed caption track, then run local intake."
          : "Recheck availability, authentication, and alternate caption paths before intake.",
        expectedCacheBinding: "source-cache/captions/" + source.id + ".json",
        atlasPriority: priority,
        lanes: array(source.lanes),
        riskReview: {
          sourceAudio: "unreviewed",
          visualContext: "unreviewed",
          rights: "unreviewed",
        },
        evidenceBoundary: {
          metadataOnly: acquire,
          transcriptRegistered: false,
          contentClaimsAllowed: false,
          speakerDiarized: false,
          visualContextVerified: false,
          promotionAllowed: false,
        },
      });
      item.fingerprint = itemFingerprint(item);
      records.push(item);
    });

    catalog.forEach(function (source) {
      if (source.transcript !== false || atlasIds.has(source.id)) return;
      var metadata = sourceMetadata(source, "commentary");
      var item = Object.assign(metadata, {
        coverage: "caption-limited",
        showWikiState: "source-brief",
        workType: "recover-caption",
        captionState: "limited-or-unavailable",
        currentStage: "recover",
        nextAction:
          "Recheck age-gate access and alternate caption paths; keep the Source Brief sealed until timed evidence survives.",
        expectedCacheBinding: "source-cache/captions/" + source.id + ".json",
        atlasPriority: null,
        lanes: ["commentary-catalog"],
        riskReview: {
          sourceAudio: "required",
          visualContext: "unreviewed",
          rights: "required",
        },
        evidenceBoundary: {
          metadataOnly: false,
          transcriptRegistered: false,
          contentClaimsAllowed: false,
          speakerDiarized: false,
          visualContextVerified: false,
          promotionAllowed: false,
        },
      });
      item.fingerprint = itemFingerprint(item);
      records.push(item);
    });

    var ids = new Set();
    records.forEach(function (item) {
      if (!item.id || ids.has(item.id)) {
        throw new Error("Distill Worklist contains a missing or duplicate source ID.");
      }
      ids.add(item.id);
      if (!item.title || !item.date || item.duration <= 0 || !item.url) {
        throw new Error("Distill Worklist source metadata is incomplete for " + item.id + ".");
      }
      if (item.showWikiState !== "source-brief" ||
          item.evidenceBoundary.contentClaimsAllowed ||
          item.evidenceBoundary.promotionAllowed) {
        throw new Error("Distill Worklist evidence firewall failed for " + item.id + ".");
      }
    });

    records.sort(function (left, right) {
      if (left.workType !== right.workType) {
        return left.workType === "recover-caption" ? -1 : 1;
      }
      if (left.workType === "acquire-caption") {
        return Number(left.atlasPriority.rank) - Number(right.atlasPriority.rank);
      }
      return right.date.localeCompare(left.date) ||
        right.views - left.views ||
        left.id.localeCompare(right.id);
    });
    var laneCounts = { "recover-caption": 0, "acquire-caption": 0 };
    records.forEach(function (item, index) {
      laneCounts[item.workType] += 1;
      item.workRank = index + 1;
      item.laneRank = laneCounts[item.workType];
      item.fingerprint = itemFingerprint(item);
    });

    var counts = records.reduce(function (output, item) {
      output[item.workType] += 1;
      output[item.coverage] += 1;
      return output;
    }, {
      "acquire-caption": 0,
      "recover-caption": 0,
      "metadata-only": 0,
      "caption-limited": 0,
    });
    var canonicalRecords = records.map(function (item) {
      return clone(item);
    });
    var fingerprint = fnv1a32(stableJson({
      schema: SCHEMA,
      version: VERSION,
      snapshotDate: atlas.snapshotDate,
      records: canonicalRecords,
    }));
    var stats = {
      workItems: records.length,
      acquireCaptions: counts["acquire-caption"],
      recoverCaptions: counts["recover-caption"],
      sourceBriefs: records.length,
      metadataOnly: counts["metadata-only"],
      captionLimited: counts["caption-limited"],
      contentClaims: 0,
      autoPromotions: 0,
    };
    var policy = {
      lifecycle: ["discover", "acquire-or-recover", "intake", "quarantine", "review", "promote"],
      transcriptRequiredForContentClaims: true,
      stagePacketsContainTranscript: false,
      speakerDiarized: false,
      visualContextVerified: false,
      promotionAllowed: false,
    };
    var manifest = {
      schema: MANIFEST_SCHEMA,
      version: VERSION,
      channel: {
        id: clean(channel.id) || "wwam",
        label: clean(channel.label) || "We Watched A Movie",
      },
      snapshotDate: clean(atlas.snapshotDate),
      atlasFingerprint: clean(atlas.fingerprints && atlas.fingerprints.runtimeFnv1a),
      fingerprint: fingerprint,
      stats: stats,
      policy: policy,
      records: records,
    };

    function filtered(settings) {
      var filters = settings || {};
      var output = records.filter(function (item) {
        if (filters.workType && item.workType !== filters.workType) return false;
        if (filters.coverage && item.coverage !== filters.coverage) return false;
        if (filters.year && item.date.slice(0, 4) !== String(filters.year)) return false;
        return true;
      });
      var limit = filters.limit == null
        ? output.length
        : Math.max(0, Math.min(1000, Number(filters.limit) || 0));
      return output.slice(0, limit);
    }

    return Object.freeze({
      engine: "Shokker Distill Worklist",
      version: VERSION,
      schema: SCHEMA,
      getStats: function () {
        return clone(stats);
      },
      getPolicy: function () {
        return clone(policy);
      },
      getRecord: function (id) {
        var found = records.find(function (item) {
          return item.id === clean(id);
        });
        return found ? clone(found) : null;
      },
      getWorklist: function (settings) {
        return {
          schema: SCHEMA,
          version: VERSION,
          snapshotDate: manifest.snapshotDate,
          fingerprint: fingerprint,
          total: records.length,
          matched: filtered(settings).length,
          records: clone(filtered(settings)),
        };
      },
      getStagePacket: function (id) {
        var item = records.find(function (candidate) {
          return candidate.id === clean(id);
        });
        return item ? clone(stagePacket(item, fingerprint)) : null;
      },
      getBatches: function (size) {
        var batchSize = Math.max(1, Math.min(50, Number(size) || 10));
        var batches = [];
        for (var index = 0; index < records.length; index += batchSize) {
          var members = records.slice(index, index + batchSize);
          var packet = {
            id: "distill-work-batch-" + String(batches.length + 1).padStart(2, "0"),
            rankStart: index + 1,
            rankEnd: index + members.length,
            sourceIds: members.map(function (item) { return item.id; }),
          };
          packet.fingerprint = fnv1a32(stableJson(packet));
          batches.push(packet);
        }
        return clone(batches);
      },
      exportManifest: function () {
        return clone(manifest);
      },
      verifyFingerprint: function () {
        var actual = fnv1a32(stableJson({
          schema: SCHEMA,
          version: VERSION,
          snapshotDate: atlas.snapshotDate,
          records: canonicalRecords,
        }));
        return {
          ok: actual === fingerprint,
          expected: fingerprint,
          actual: actual,
          scope: "deterministic-structural-change-detection",
          authenticityVerified: false,
        };
      },
    });
  }

  root.ShokkerDistillWorklist = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    MANIFEST_SCHEMA: MANIFEST_SCHEMA,
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
