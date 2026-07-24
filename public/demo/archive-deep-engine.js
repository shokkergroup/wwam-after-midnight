(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "wwam-archive-deep-distill/v1";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function normalized(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
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
      if (point <= 0x7f) {
        bytes.push(point);
      } else if (point <= 0x7ff) {
        bytes.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
      } else if (point <= 0xffff) {
        bytes.push(
          0xe0 | (point >> 12),
          0x80 | ((point >> 6) & 0x3f),
          0x80 | (point & 0x3f)
        );
      } else {
        bytes.push(
          0xf0 | (point >> 18),
          0x80 | ((point >> 12) & 0x3f),
          0x80 | ((point >> 6) & 0x3f),
          0x80 | (point & 0x3f)
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

  function publicExcerptValues(stream) {
    return array(stream.topics).map(function (topic) { return topic.receipt; })
      .concat(array(stream.moments).map(function (moment) { return moment.excerpt; }))
      .concat(array(stream.characters).map(function (character) {
        return character.receipt;
      }))
      .filter(Boolean);
  }

  function validate(payload) {
    if (!payload || payload.schema !== SCHEMA) {
      throw new Error("Archive Deep Engine requires " + SCHEMA);
    }
    var streams = array(payload.streams);
    if (streams.length !== 10) {
      throw new Error("Archive Deep V1 requires exactly ten streams");
    }
    if (new Set(streams.map(function (stream) { return stream.id; })).size !== streams.length) {
      throw new Error("Archive Deep source IDs must be unique");
    }
    streams.forEach(function (stream, index) {
      if (!stream.id || !stream.title || !stream.url || !stream.captioned) {
        throw new Error("Archive Deep source #" + (index + 1) + " is incomplete");
      }
      if (!stream.archivePriority ||
          stream.archivePriority.originalRank !== index + 1) {
        throw new Error("Archive Deep priority order is invalid");
      }
      if (!stream.captionEvidence ||
          stream.captionEvidence.speakerDiarized !== false ||
          stream.captionEvidence.originAttribution !== false ||
          stream.captionEvidence.fullPayloadPublic !== false) {
        throw new Error("Archive Deep evidence boundary is missing");
      }
      if (!stream.rightsPolicy ||
          stream.rightsPolicy.speakerClaimsAllowed !== false ||
          stream.rightsPolicy.originClaimsAllowed !== false) {
        throw new Error("Archive Deep rights boundary is missing");
      }
      publicExcerptValues(stream).forEach(function (excerpt) {
        if (clean(excerpt).split(/\s+/).length > 16) {
          throw new Error("Archive Deep public excerpt exceeds its 16-word limit");
        }
      });
      if (stream.rightsPolicy.restrictedToTopicNavigation &&
          (array(stream.moments).length ||
           array(stream.characters).length ||
           array(stream.heatmap).length ||
           array(stream.topics).some(function (topic) { return topic.receipt; }))) {
        throw new Error("Restricted Archive Deep source exposes an unsafe surface");
      }
    });
    var actual = fnv1a32(stableJson(streams));
    var expected = payload.fingerprints && payload.fingerprints.publicFnv1a;
    if (!expected || actual !== expected) {
      throw new Error("Archive Deep public fingerprint mismatch");
    }
    return actual;
  }

  function streamBlob(stream) {
    return normalized([
      stream.title,
      stream.contentMode,
      stream.rightsPolicy && stream.rightsPolicy.mode,
      array(stream.topics).map(function (topic) { return topic.name; }).join(" "),
      array(stream.characters).map(function (character) {
        return character.character;
      }).join(" "),
      array(stream.moments).map(function (moment) {
        return moment.category + " " + moment.excerpt;
      }).join(" "),
    ].join(" "));
  }

  function create(rawPayload) {
    var fingerprint = validate(rawPayload);
    var payload = serialCopy(rawPayload);
    var streams = payload.streams;
    var byId = new Map(streams.map(function (stream) {
      return [stream.id, stream];
    }));

    function browse(options) {
      var settings = options || {};
      var query = normalized(settings.query);
      var records = streams.filter(function (stream) {
        if (settings.contentMode && stream.contentMode !== settings.contentMode) {
          return false;
        }
        if (settings.rightsMode &&
            stream.rightsPolicy.mode !== settings.rightsMode) {
          return false;
        }
        if (settings.restricted != null &&
            stream.rightsPolicy.restrictedToTopicNavigation !== Boolean(settings.restricted)) {
          return false;
        }
        if (settings.minPriorityScore != null &&
            stream.archivePriority.score < Number(settings.minPriorityScore)) {
          return false;
        }
        return !query || streamBlob(stream).includes(query);
      });
      var sort = settings.sort || "priority";
      records.sort(function (left, right) {
        if (sort === "views") {
          return right.views - left.views || left.archivePriority.originalRank
            - right.archivePriority.originalRank;
        }
        if (sort === "newest") {
          return right.date.localeCompare(left.date) || left.archivePriority.originalRank
            - right.archivePriority.originalRank;
        }
        if (sort === "title") {
          return left.title.localeCompare(right.title);
        }
        return left.archivePriority.originalRank - right.archivePriority.originalRank;
      });
      var offset = Math.max(0, Number(settings.offset || 0));
      var limit = settings.limit == null
        ? records.length
        : Math.max(0, Math.min(100, Number(settings.limit) || 0));
      return {
        filters: serialCopy(settings),
        total: records.length,
        offset: offset,
        records: serialCopy(records.slice(offset, offset + limit)),
        evidenceScope: "public aggregate data and short timestamped receipts only",
      };
    }

    function search(query, options) {
      var needle = normalized(query);
      if (!needle) {
        return {
          query: clean(query),
          total: 0,
          results: [],
          evidenceScope: "public aggregate data and short timestamped receipts only",
        };
      }
      var settings = Object.assign({}, options || {}, { query: needle });
      var result = browse(settings);
      var results = result.records.map(function (stream) {
        var title = normalized(stream.title);
        var score = title === needle ? 200 : title.includes(needle) ? 120 : 40;
        score += array(stream.topics).filter(function (topic) {
          return normalized(topic.name).includes(needle);
        }).length * 30;
        score += array(stream.characters).filter(function (character) {
          return normalized(character.character).includes(needle);
        }).length * 25;
        return Object.assign({}, stream, {
          match: {
            score: score,
            basis: "public title/topic/character/short-receipt index",
          },
        });
      }).sort(function (left, right) {
        return right.match.score - left.match.score ||
          left.archivePriority.originalRank - right.archivePriority.originalRank;
      });
      return {
        query: clean(query),
        total: results.length,
        results: serialCopy(results),
        evidenceScope: result.evidenceScope,
      };
    }

    function getMomentCandidates(options) {
      var settings = options || {};
      var output = [];
      streams.forEach(function (stream) {
        array(stream.moments).forEach(function (moment) {
          if (settings.category && moment.category !== settings.category) return;
          if (settings.contentMode && stream.contentMode !== settings.contentMode) return;
          if (settings.minHeat != null && moment.heat < Number(settings.minHeat)) return;
          output.push(Object.assign({}, serialCopy(moment), {
            sourceId: stream.id,
            sourceTitle: stream.title,
            contentMode: stream.contentMode,
            sourceUrl: stream.url,
            playbackUrl: stream.url + "&t=" + Number(moment.t || 0) + "s",
          }));
        });
      });
      output.sort(function (left, right) {
        return right.heat - left.heat ||
          left.sourceTitle.localeCompare(right.sourceTitle) ||
          left.t - right.t;
      });
      var limit = settings.limit == null
        ? output.length
        : Math.max(0, Math.min(100, Number(settings.limit) || 0));
      return serialCopy(output.slice(0, limit));
    }

    function getTopicReceipts(topicName) {
      var needle = normalized(topicName);
      var output = [];
      streams.forEach(function (stream) {
        array(stream.topics).forEach(function (topic) {
          if (normalized(topic.name) !== needle) return;
          output.push({
            sourceId: stream.id,
            sourceTitle: stream.title,
            contentMode: stream.contentMode,
            topic: serialCopy(topic),
            playbackUrl: stream.url + "&t=" + Number(topic.peak || 0) + "s",
          });
        });
      });
      output.sort(function (left, right) {
        return right.topic.mentions - left.topic.mentions ||
          left.sourceTitle.localeCompare(right.sourceTitle);
      });
      return serialCopy(output);
    }

    return Object.freeze({
      engine: "WWAM Archive Deep Distill",
      version: VERSION,
      schema: SCHEMA,
      getMetrics: function () { return serialCopy(payload.meta); },
      getEvidencePolicy: function () { return serialCopy(payload.evidencePolicy); },
      getSelection: function () { return serialCopy(payload.selection); },
      getStream: function (id) {
        var stream = byId.get(clean(id));
        return stream ? serialCopy(stream) : null;
      },
      browse: browse,
      search: search,
      getMomentCandidates: getMomentCandidates,
      getTopicReceipts: getTopicReceipts,
      getTopicIndex: function () { return serialCopy(payload.topicIndex); },
      getCharacterIndex: function () { return serialCopy(payload.characterIndex); },
      verifyFingerprint: function () {
        return {
          ok: true,
          expected: payload.fingerprints.publicFnv1a,
          actual: fingerprint,
          selectionSha256: payload.fingerprints.selectionSha256,
          captionSetSha256: payload.fingerprints.captionSetSha256,
        };
      },
      exportSnapshot: function () {
        return serialCopy(payload);
      },
    });
  }

  root.WWAMArchiveDeepEngine = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
