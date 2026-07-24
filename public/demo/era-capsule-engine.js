(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker-youtube-wiki/era-capsule/v1";
  var EXCERPT_WORD_LIMIT = 16;
  var EXCERPT_CHARACTER_LIMIT = 240;
  var SOURCE_PREVIEW_LIMIT = 12;
  var RECEIPT_PREVIEW_LIMIT = 12;
  var LORE_PREVIEW_LIMIT = 8;
  var QUARANTINE_PREVIEW_LIMIT = 12;
  var TOPIC_PREVIEW_LIMIT = 8;
  var ROUTE_LIMIT = 5;

  var DEFAULT_LABELS = Object.freeze({
    channelName: "The channel",
    capsuleName: "Year Capsule",
    feed: "Cached feed",
    memory: "Indexed memory",
    quarantine: "Quarantine drawer",
    route: "Play the year",
  });

  var POLICY = Object.freeze({
    separateLedgers: true,
    metadataClaimRule:
      "Feed metadata never supplies topics, sentiment, speakers, quotes, or summaries.",
    viewRule:
      "Cached views at the archive snapshot; not current views or unique audience.",
    indexedMemoryRule:
      "Content claims appear only in timestamped indexed receipts.",
    quarantineRule:
      "Archive Deep candidates are navigation candidates only; promotion and speaker attribution stay disabled.",
    routeRule:
      "A deterministic date-spread sample of indexed receipts; not a ranking.",
    exportRule:
      "Bounded public metadata and short receipts only; no transcripts, captions, or full event arrays.",
  });

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value, limit) {
    var output = String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
    return output.slice(0, limit == null ? 240 : limit);
  }

  function number(value, fallback) {
    var output = Number(value);
    return Number.isFinite(output) ? output : (fallback == null ? 0 : fallback);
  }

  function integer(value, fallback) {
    var output = Math.floor(number(value, fallback));
    return Number.isFinite(output) ? output : (fallback == null ? 0 : fallback);
  }

  function roundOne(value) {
    return Math.round(number(value) * 10) / 10;
  }

  function serialCopy(value) {
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
    var source = unescape(encodeURIComponent(String(value)));
    var output = [];
    for (var index = 0; index < source.length; index += 1) {
      output.push(source.charCodeAt(index));
    }
    return output;
  }

  function fnv1a32(value) {
    var hash = 2166136261;
    utf8Bytes(value).forEach(function (byte) {
      hash ^= byte;
      hash = Math.imul(hash, 16777619);
    });
    return "fnv1a32:" + ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) {
      deepFreeze(value[key]);
    });
    return Object.freeze(value);
  }

  function dateYear(value) {
    var match = clean(value, 20).match(/^(\d{4})-\d{2}-\d{2}$/);
    return match ? Number(match[1]) : null;
  }

  function validSourceId(value) {
    return /^[A-Za-z0-9_-]{11}$/.test(clean(value, 32));
  }

  function officialUrl(sourceId, seconds) {
    var url = "https://www.youtube.com/watch?v=" + sourceId;
    return seconds > 0 ? url + "&t=" + Math.floor(seconds) + "s" : url;
  }

  function formatTime(value) {
    var seconds = Math.max(0, Math.floor(number(value)));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var tail = seconds % 60;
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + String(tail).padStart(2, "0")
      : minutes + ":" + String(tail).padStart(2, "0");
  }

  function boundedExcerpt(value) {
    var words = clean(value, 1000).split(/\s+/).filter(Boolean);
    var output = words.slice(0, EXCERPT_WORD_LIMIT).join(" ");
    if (words.length > EXCERPT_WORD_LIMIT) output += " …";
    return output.slice(0, EXCERPT_CHARACTER_LIMIT);
  }

  function normalizeLabels(input) {
    var labels = input || {};
    return Object.keys(DEFAULT_LABELS).reduce(function (output, key) {
      output[key] = clean(labels[key] || DEFAULT_LABELS[key], 80);
      return output;
    }, {});
  }

  function coverageCounts(records) {
    var output = {
      deeplyIndexed: 0,
      metadataOnly: 0,
      captionLimited: 0,
      unavailable: 0,
    };
    array(records).forEach(function (record) {
      if (record.coverage === "deeply-indexed") output.deeplyIndexed += 1;
      else if (record.coverage === "metadata-only") output.metadataOnly += 1;
      else if (record.coverage === "caption-limited") output.captionLimited += 1;
      else output.unavailable += 1;
    });
    return output;
  }

  function batchReceipt(value) {
    var batch = value || {};
    return {
      id: clean(batch.id || "unavailable", 80),
      sequence: Math.max(0, integer(batch.sequence)),
      publicFnv1a: clean(batch.publicFnv1a || "unavailable", 80),
    };
  }

  function evenlySpaced(values, limit) {
    var input = array(values);
    var take = Math.min(Math.max(0, integer(limit)), input.length);
    if (!take) return [];
    if (take === 1) return [input[0]];
    var indexes = [];
    for (var index = 0; index < take; index += 1) {
      var position = Math.round(index * (input.length - 1) / (take - 1));
      if (!indexes.includes(position)) indexes.push(position);
    }
    return indexes.map(function (position) {
      return input[position];
    });
  }

  function create(options) {
    var settings = options || {};
    var atlas = settings.atlas;
    if (!atlas || typeof atlas.browse !== "function") {
      throw new Error("ShokkerEraCapsuleEngine requires an Archive Atlas browse API.");
    }

    var showcase = settings.showcase || null;
    var lore = settings.lore || null;
    var archiveDeep = settings.archiveDeep || null;
    var labels = normalizeLabels(settings.labels);

    function resolveYears() {
      var values = [];
      if (typeof atlas.getFilterOptions === "function") {
        values = array(atlas.getFilterOptions().years).map(function (entry) {
          return Number(entry && (entry.value == null ? entry.year : entry.value));
        });
      } else if (typeof atlas.getBuckets === "function") {
        values = array(atlas.getBuckets()).flatMap(function (decade) {
          return array(decade.years).map(function (entry) {
            return Number(entry.year);
          });
        });
      }
      return Array.from(new Set(values.filter(function (year) {
        return Number.isInteger(year) && year >= 1900 && year <= 2200;
      }))).sort(function (left, right) {
        return right - left;
      });
    }

    var years = resolveYears();
    if (!years.length) {
      throw new Error("Archive Atlas does not expose any valid year buckets.");
    }
    var yearSet = new Set(years);

    function atlasRecords(year) {
      var response = atlas.browse({
        year: String(year),
        sort: "views",
        limit: 1000,
      }) || {};
      return array(response.records).filter(function (record) {
        return dateYear(record.date) === year && validSourceId(record.id);
      });
    }

    function topUploads(records) {
      return records.slice().sort(function (left, right) {
        return number(right.views) - number(left.views)
          || clean(right.date).localeCompare(clean(left.date))
          || clean(left.id).localeCompare(clean(right.id));
      }).slice(0, 5).map(function (record) {
        return {
          sourceId: clean(record.id, 32),
          title: clean(record.title),
          date: clean(record.date, 20),
          durationSeconds: Math.max(0, integer(record.duration)),
          cachedViews: Math.max(0, integer(record.views)),
          thumbnail: clean(record.thumbnail, 500),
          url: officialUrl(clean(record.id, 32), 0),
          coverage: clean(record.coverage, 40),
        };
      });
    }

    function showcaseMemory(year) {
      var capable = Boolean(
        showcase && Array.isArray(showcase.sources) && Array.isArray(showcase.receipts)
      );
      if (!capable) {
        return {
          available: false,
          loreAvailable: Boolean(lore && Array.isArray(lore.fieldGuide)),
          basis: "No timestamped indexed-memory input was supplied for this capsule.",
          sourceCount: 0,
          receiptCount: 0,
          loreArrivalCount: 0,
          sources: [],
          receiptPreview: [],
          loreArrivals: [],
        };
      }

      var sources = showcase.sources.filter(function (source) {
        return dateYear(source.date) === year && validSourceId(source.id);
      }).sort(function (left, right) {
        return clean(left.date).localeCompare(clean(right.date))
          || clean(left.id).localeCompare(clean(right.id));
      });
      var sourceById = new Map(sources.map(function (source) {
        return [clean(source.id, 32), source];
      }));

      var receipts = showcase.receipts.map(function (receipt) {
        var sourceId = clean(receipt.sourceId, 32);
        var source = sourceById.get(sourceId);
        var seconds = Math.max(0, integer(receipt.t));
        if (!source || dateYear(receipt.date || source.date) !== year) return null;
        if (number(source.duration) > 0 && seconds > number(source.duration)) return null;
        var excerpt = boundedExcerpt(receipt.excerpt);
        if (!excerpt) return null;
        return {
          receiptId: clean(receipt.id || sourceId + ":" + seconds, 180),
          sourceId: sourceId,
          sourceTitle: clean(source.title || receipt.sourceTitle),
          date: clean(source.date, 20),
          t: seconds,
          timecode: formatTime(seconds),
          url: officialUrl(sourceId, seconds),
          type: clean(receipt.type || "indexed-receipt", 60),
          label: clean(receipt.category || receipt.type || "Indexed receipt", 120),
          excerpt: excerpt,
          evidenceLevel: clean(receipt.evidenceLevel || "indexed", 80),
          score: Math.max(0, Math.min(100, number(receipt.score, 0))),
        };
      }).filter(Boolean).sort(function (left, right) {
        return left.date.localeCompare(right.date)
          || left.t - right.t
          || left.receiptId.localeCompare(right.receiptId);
      });

      var loreEntries = lore && Array.isArray(lore.fieldGuide)
        ? lore.fieldGuide.filter(function (entry) {
          return entry
            && entry.kind !== "source"
            && entry.kind !== "era"
            && dateYear(entry.archiveFirst && entry.archiveFirst.date) === year
            && validSourceId(entry.archiveFirst && entry.archiveFirst.sourceId);
        }).map(function (entry) {
          var first = entry.archiveFirst;
          var seconds = Math.max(0, integer(first.t));
          return {
            entryId: clean(entry.id, 180),
            kind: clean(entry.kind, 60),
            name: clean(entry.name, 160),
            kicker: clean(entry.kicker, 120),
            archiveFirstLabel: "EARLIEST IN INDEXED ARCHIVE",
            sourceId: clean(first.sourceId, 32),
            date: clean(first.date, 20),
            t: seconds,
            timecode: formatTime(seconds),
            url: officialUrl(clean(first.sourceId, 32), seconds),
          };
        }).sort(function (left, right) {
          return left.date.localeCompare(right.date)
            || left.name.localeCompare(right.name)
            || left.entryId.localeCompare(right.entryId);
        })
        : [];

      return {
        available: true,
        loreAvailable: Boolean(lore && Array.isArray(lore.fieldGuide)),
        basis:
          "Timestamped receipts from the separately indexed source corpus; feed membership is not implied.",
        sourceCount: sources.length,
        receiptCount: receipts.length,
        loreArrivalCount: loreEntries.length,
        sources: sources.slice(0, SOURCE_PREVIEW_LIMIT).map(function (source) {
          return {
            sourceId: clean(source.id, 32),
            title: clean(source.title),
            date: clean(source.date, 20),
            type: clean(source.type || source.lane || "indexed-source", 60),
            lanes: array(source.lanes).map(function (lane) {
              return clean(lane, 60);
            }).slice(0, 8),
            durationSeconds: Math.max(0, integer(source.duration)),
            cachedViews: Math.max(0, integer(source.views)),
            thumbnail: clean(source.thumbnail, 500),
            url: officialUrl(clean(source.id, 32), 0),
          };
        }),
        receiptPreview: evenlySpaced(receipts, RECEIPT_PREVIEW_LIMIT).map(function (receipt) {
          var output = Object.assign({}, receipt);
          delete output.score;
          return output;
        }),
        loreArrivals: loreEntries.slice(0, LORE_PREVIEW_LIMIT),
        _routeReceipts: receipts,
      };
    }

    function quarantineMemory(year) {
      var capable = Boolean(archiveDeep && typeof archiveDeep.browse === "function");
      if (!capable) {
        return {
          available: false,
          basis: "No Archive Deep quarantine input was supplied for this capsule.",
          sourceCount: 0,
          candidateCount: 0,
          topicLaneCount: 0,
          promotionAllowed: false,
          speakerDiarized: false,
          candidates: [],
          topics: [],
        };
      }
      var response = archiveDeep.browse({ sort: "priority", limit: 100 }) || {};
      var streams = array(response.records).filter(function (stream) {
        return dateYear(stream.date) === year && validSourceId(stream.id);
      });
      var candidates = [];
      var topics = [];
      streams.forEach(function (stream) {
        var sourceId = clean(stream.id, 32);
        var sourceTitle = clean(stream.title);
        var date = clean(stream.date, 20);
        var batch = batchReceipt(stream.archiveBatch);
        array(stream.moments).forEach(function (moment, index) {
          var seconds = Math.max(0, integer(moment.t));
          candidates.push({
            candidateId: clean(
              moment.id || sourceId + ":candidate:" + seconds + ":" + index,
              180
            ),
            sourceId: sourceId,
            sourceTitle: sourceTitle,
            date: date,
            t: seconds,
            timecode: formatTime(seconds),
            url: officialUrl(sourceId, seconds),
            label: clean(moment.category || "Candidate", 120),
            excerpt: boundedExcerpt(moment.excerpt || moment.quote),
            heat: Math.max(0, Math.min(100, number(moment.heat || moment.score))),
            archiveBatch: batch,
            candidateState: "quarantined",
            promotionAllowed: false,
            speaker: null,
          });
        });
        array(stream.topics).forEach(function (topic) {
          var seconds = Math.max(0, integer(topic.peak || topic.first || topic.t));
          topics.push({
            sourceId: sourceId,
            sourceTitle: sourceTitle,
            date: date,
            name: clean(topic.name || topic.topic || topic.label, 120),
            t: seconds,
            timecode: formatTime(seconds),
            url: officialUrl(sourceId, seconds),
            mentions: Math.max(0, integer(topic.mentions)),
            archiveBatch: batch,
            candidateState: "quarantined",
            promotionAllowed: false,
            speaker: null,
          });
        });
      });
      candidates.sort(function (left, right) {
        return right.heat - left.heat
          || left.date.localeCompare(right.date)
          || left.sourceId.localeCompare(right.sourceId)
          || left.t - right.t;
      });
      topics.sort(function (left, right) {
        return right.mentions - left.mentions
          || left.name.localeCompare(right.name)
          || left.date.localeCompare(right.date)
          || left.sourceId.localeCompare(right.sourceId);
      });
      return {
        available: true,
        basis:
          "Caption-audited Archive Deep navigation candidates kept outside promoted memory.",
        sourceCount: streams.length,
        candidateCount: candidates.length,
        topicLaneCount: topics.length,
        promotionAllowed: false,
        speakerDiarized: false,
        candidates: candidates.slice(0, QUARANTINE_PREVIEW_LIMIT),
        topics: topics.slice(0, TOPIC_PREVIEW_LIMIT),
        _routeCandidates: candidates,
        _routeTopics: topics,
      };
    }

    function routeFromMemory(memory, quarantine) {
      var receipts = array(memory._routeReceipts);
      var bySource = new Map();
      receipts.forEach(function (receipt) {
        var existing = bySource.get(receipt.sourceId);
        if (!existing
            || receipt.score > existing.score
            || (receipt.score === existing.score && receipt.t < existing.t)
            || (receipt.score === existing.score
              && receipt.t === existing.t
              && receipt.receiptId < existing.receiptId)) {
          bySource.set(receipt.sourceId, receipt);
        }
      });
      var candidates = Array.from(bySource.values()).sort(function (left, right) {
        return left.date.localeCompare(right.date)
          || left.t - right.t
          || left.receiptId.localeCompare(right.receiptId);
      });
      var selectedReceipts = candidates.length > ROUTE_LIMIT
        ? evenlySpaced(candidates, ROUTE_LIMIT)
        : candidates.slice();
      if (selectedReceipts.length < ROUTE_LIMIT) {
        var selectedReceiptIds = new Set(selectedReceipts.map(function (receipt) {
          return receipt.receiptId;
        }));
        receipts.slice().sort(function (left, right) {
          return right.score - left.score
            || left.date.localeCompare(right.date)
            || left.t - right.t
            || left.receiptId.localeCompare(right.receiptId);
        }).some(function (receipt) {
          if (selectedReceipts.length >= ROUTE_LIMIT) return true;
          if (!selectedReceiptIds.has(receipt.receiptId)) {
            selectedReceiptIds.add(receipt.receiptId);
            selectedReceipts.push(receipt);
          }
          return false;
        });
        selectedReceipts.sort(function (left, right) {
          return left.date.localeCompare(right.date)
            || left.t - right.t
            || left.receiptId.localeCompare(right.receiptId);
        });
      }
      var stops = selectedReceipts.map(function (receipt, index) {
        return {
          order: index + 1,
          receiptId: receipt.receiptId,
          sourceId: receipt.sourceId,
          sourceTitle: receipt.sourceTitle,
          date: receipt.date,
          t: receipt.t,
          timecode: receipt.timecode,
          url: receipt.url,
          label: receipt.label,
          excerpt: receipt.excerpt,
          evidenceLevel: receipt.evidenceLevel,
        };
      });
      if (!stops.length) {
        var quarantineBySource = new Map();
        array(quarantine._routeCandidates).forEach(function (candidate) {
          var existing = quarantineBySource.get(candidate.sourceId);
          if (!existing
              || candidate.heat > existing.heat
              || (candidate.heat === existing.heat && candidate.t < existing.t)
              || (candidate.heat === existing.heat
                && candidate.t === existing.t
                && candidate.candidateId < existing.candidateId)) {
            quarantineBySource.set(candidate.sourceId, candidate);
          }
        });
        var topicRoutes = array(quarantine._routeTopics).map(function (topic) {
          return {
            candidateId: clean(
              topic.sourceId + ":topic-quarantine:" + topic.t + ":" + topic.name,
              180
            ),
            sourceId: topic.sourceId,
            sourceTitle: topic.sourceTitle,
            date: topic.date,
            t: topic.t,
            timecode: topic.timecode,
            url: topic.url,
            excerpt: boundedExcerpt(topic.name),
            heat: topic.mentions,
            archiveBatch: topic.archiveBatch,
            routeLabel: "ARCHIVE DEEP TOPIC QUARANTINE",
          };
        });
        topicRoutes.forEach(function (candidate) {
          if (quarantineBySource.has(candidate.sourceId)) return;
          var existing = quarantineBySource.get(candidate.sourceId);
          if (!existing
              || candidate.heat > existing.heat
              || (candidate.heat === existing.heat && candidate.t < existing.t)
              || (candidate.heat === existing.heat
                && candidate.t === existing.t
                && candidate.candidateId < existing.candidateId)) {
            quarantineBySource.set(candidate.sourceId, candidate);
          }
        });
        var quarantineCandidates = Array.from(quarantineBySource.values()).sort(
          function (left, right) {
            return left.date.localeCompare(right.date)
              || left.t - right.t
              || left.candidateId.localeCompare(right.candidateId);
          }
        );
        var selectedQuarantine = quarantineCandidates.length > ROUTE_LIMIT
          ? evenlySpaced(quarantineCandidates, ROUTE_LIMIT)
          : quarantineCandidates.slice();
        if (selectedQuarantine.length < ROUTE_LIMIT) {
          var selectedCandidateIds = new Set(selectedQuarantine.map(function (candidate) {
            return candidate.candidateId;
          }));
          array(quarantine._routeCandidates).concat(topicRoutes).sort(
            function (left, right) {
              return number(right.heat) - number(left.heat)
                || left.date.localeCompare(right.date)
                || left.sourceId.localeCompare(right.sourceId)
                || left.t - right.t
                || left.candidateId.localeCompare(right.candidateId);
            }
          ).some(function (candidate) {
            if (selectedQuarantine.length >= ROUTE_LIMIT) return true;
            if (!selectedCandidateIds.has(candidate.candidateId)) {
              selectedCandidateIds.add(candidate.candidateId);
              selectedQuarantine.push(candidate);
            }
            return false;
          });
          selectedQuarantine.sort(function (left, right) {
            return left.date.localeCompare(right.date)
              || left.t - right.t
              || left.candidateId.localeCompare(right.candidateId);
          });
        }
        stops = selectedQuarantine.map(
          function (candidate, index) {
            var routeLabel =
              candidate.routeLabel || "ARCHIVE DEEP QUARANTINE";
            return {
              order: index + 1,
              receiptId: candidate.candidateId,
              sourceId: candidate.sourceId,
              sourceTitle: candidate.sourceTitle,
              date: candidate.date,
              t: candidate.t,
              timecode: candidate.timecode,
              url: candidate.url,
              label: routeLabel,
              excerpt: candidate.excerpt,
              evidenceLevel: routeLabel,
              candidateState: "quarantined",
              promotionAllowed: false,
              speaker: null,
              archiveBatch: serialCopy(candidate.archiveBatch),
            };
          }
        );
      }
      var quarantineFallback = stops.length > 0 && stops.every(function (stop) {
        return stop.candidateState === "quarantined"
          && stop.promotionAllowed === false;
      });
      return {
        available: stops.length > 0,
        basis: quarantineFallback
          ? POLICY.routeRule + " This route stays inside the Archive Deep quarantine."
          : POLICY.routeRule,
        count: stops.length,
        autoplay: false,
        quarantineFallback: quarantineFallback,
        stops: stops,
      };
    }

    function fingerprintValue(api, key) {
      try {
        if (api && typeof api.verifyFingerprint === "function") {
          var verification = api.verifyFingerprint() || {};
          return clean(verification[key] || verification.actual || verification.expected, 120)
            || "unavailable";
        }
      } catch {
        return "unavailable";
      }
      return "unavailable";
    }

    function buildInternal(year) {
      var records = atlasRecords(year);
      var coverage = coverageCounts(records);
      var memory = showcaseMemory(year);
      var quarantine = quarantineMemory(year);
      var route = routeFromMemory(memory, quarantine);
      delete memory._routeReceipts;
      delete quarantine._routeCandidates;
      delete quarantine._routeTopics;
      var durationSeconds = records.reduce(function (sum, record) {
        return sum + Math.max(0, integer(record.duration));
      }, 0);
      var cachedViews = records.reduce(function (sum, record) {
        return sum + Math.max(0, integer(record.views));
      }, 0);
      var snapshotDate = "";
      try {
        snapshotDate = clean(
          typeof atlas.getProvenance === "function"
            ? (atlas.getProvenance() || {}).snapshotDate
            : "",
          20
        );
      } catch {
        snapshotDate = "";
      }

      var capsule = {
        schema: SCHEMA,
        version: VERSION,
        year: year,
        title: year + " " + labels.capsuleName,
        snapshotDate: snapshotDate || "undated",
        status: memory.receiptCount > 0
          ? (quarantine.sourceCount > 0
            ? "indexed-memory-plus-quarantine"
            : "indexed-memory")
          : (quarantine.sourceCount > 0
            ? "metadata-plus-quarantine"
            : "metadata-ledger-only"),
        labels: serialCopy(labels),
        policy: serialCopy(POLICY),
        feed: {
          basis:
            "Cached official-feed metadata at the archive snapshot; not a live channel request.",
          uploads: records.length,
          totalDurationSeconds: durationSeconds,
          hours: roundOne(durationSeconds / 3600),
          cachedViews: cachedViews,
          viewBasis: POLICY.viewRule,
          coverage: coverage,
          topUploads: topUploads(records),
        },
        memory: memory,
        quarantine: quarantine,
        route: route,
        provenance: {
          atlasFingerprint: fingerprintValue(atlas, "actual"),
          showcaseFingerprint: clean(
            showcase && showcase.inputFingerprint,
            120
          ) || "unavailable",
          archiveDeepFingerprint: fingerprintValue(archiveDeep, "actual"),
        },
      };
      capsule.fingerprint = fnv1a32(stableJson(capsule));
      return capsule;
    }

    function getYears() {
      return years.slice();
    }

    function build(rawYear) {
      var year = Number(rawYear);
      if (!Number.isInteger(year) || !yearSet.has(year)) {
        throw new RangeError("Year is not present in the Archive Atlas.");
      }
      return deepFreeze(buildInternal(year));
    }

    function forbiddenKeys(value, path, output) {
      if (Array.isArray(value)) {
        value.forEach(function (entry, index) {
          forbiddenKeys(entry, path + "[" + index + "]", output);
        });
        return output;
      }
      if (!value || typeof value !== "object") return output;
      Object.keys(value).forEach(function (key) {
        if (/^(?:transcript|transcripts|caption|captions|events|fullEvents)$/i.test(key)) {
          output.push(path + "." + key);
        }
        forbiddenKeys(value[key], path + "." + key, output);
      });
      return output;
    }

    function verify(capsule) {
      var errors = [];
      if (!capsule || typeof capsule !== "object" || Array.isArray(capsule)) {
        return {
          ok: false,
          expected: null,
          actual: null,
          errors: ["Capsule must be an object."],
        };
      }
      var year = Number(capsule.year);
      if (capsule.schema !== SCHEMA) errors.push("Schema mismatch.");
      if (!Number.isInteger(year) || !yearSet.has(year)) {
        errors.push("Year is not present in the Archive Atlas.");
      }
      var forbidden = forbiddenKeys(capsule, "$", []);
      if (forbidden.length) {
        errors.push("Forbidden export fields: " + forbidden.join(", "));
      }
      var expectedCapsule = Number.isInteger(year) && yearSet.has(year)
        ? buildInternal(year)
        : null;
      var supplied = serialCopy(capsule);
      var suppliedFingerprint = clean(supplied.fingerprint, 120);
      delete supplied.fingerprint;
      var actual = fnv1a32(stableJson(supplied));
      var expected = expectedCapsule ? expectedCapsule.fingerprint : null;
      if (!suppliedFingerprint || suppliedFingerprint !== actual) {
        errors.push("Fingerprint mismatch.");
      }
      if (expectedCapsule && stableJson(capsule) !== stableJson(expectedCapsule)) {
        errors.push("Capsule does not match the deterministic year build.");
      }
      return {
        ok: errors.length === 0,
        expected: expected,
        actual: actual,
        errors: errors,
      };
    }

    function serialize(capsule) {
      var verification = verify(capsule);
      if (!verification.ok) {
        throw new Error("Refusing to serialize an invalid era capsule: "
          + verification.errors.join(" "));
      }
      return stableJson(capsule);
    }

    return Object.freeze({
      engine: "SHOKKER YEAR CAPSULE ENGINE",
      version: VERSION,
      schema: SCHEMA,
      getYears: getYears,
      build: build,
      verify: verify,
      serialize: serialize,
    });
  }

  root.ShokkerEraCapsuleEngine = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    EXCERPT_WORD_LIMIT: EXCERPT_WORD_LIMIT,
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
