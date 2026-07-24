(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "wwam-archive-atlas/v1";
  var COVERAGE = [
    {
      id: "deeply-indexed",
      label: "DEEPLY INDEXED",
      definition: "A current source lane has a usable caption-backed distill.",
    },
    {
      id: "metadata-only",
      label: "METADATA ONLY",
      definition: "Only cached title, date, duration and view metadata are searchable.",
    },
    {
      id: "caption-limited",
      label: "CAPTION LIMITED",
      definition: "No usable cached caption path survived; no transcript claims are made.",
    },
    {
      id: "unavailable",
      label: "UNAVAILABLE",
      definition: "The feed entry survived but its metadata could not be recovered.",
    },
  ];
  var LANE_LABELS = {
    "fresh-10": "FRESH 10",
    "popular-25": "POPULAR 25",
    "archive-deep-10": "ARCHIVE DEEP 10",
    "archive-deep-batch-02": "ARCHIVE DEEP BATCH 02",
    "commentary-catalog": "COMMENTARY CATALOG",
    "archive-metadata": "ARCHIVE METADATA",
  };
  var MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  var QUEUE_FORMULA = Object.freeze({
    version: "archive-distill-priority/v1",
    popularity: "0–50 · logarithmic cached views against the highest eligible view count",
    recency: "0–30 · linear upload recency from the oldest eligible date to the snapshot date",
    franchise: "0–20 · cached-title match: current core 20, adjacent horror 14, broad horror 6",
    eligibility: "metadata-only records; current deep lanes and caption-limited records are excluded",
    evidence: "cached title/date/views only; no transcript, speaker, sentiment or topic inference",
  });
  var FRANCHISE_GROUPS = [
    {
      id: "halloween",
      label: "Halloween",
      tier: "core",
      aliases: ["halloween", "michael myers", "myers", "dr loomis", "doctor loomis", "loomis"],
    },
    {
      id: "friday-the-13th",
      label: "Friday the 13th",
      tier: "core",
      aliases: ["friday the 13th", "friday 13th", "jason voorhees", "voorhees", "crystal lake", "jason"],
    },
    {
      id: "scream",
      label: "Scream",
      tier: "core",
      aliases: ["scream", "ghostface", "sidney prescott", "woodsboro"],
    },
    {
      id: "nightmare-on-elm-street",
      label: "A Nightmare on Elm Street",
      tier: "core",
      aliases: ["a nightmare on elm street", "nightmare on elm street", "elm street", "freddy krueger", "freddy"],
    },
    {
      id: "chucky",
      label: "Chucky / Child's Play",
      tier: "adjacent",
      aliases: ["chucky", "child s play", "childs play"],
    },
    {
      id: "alien-predator",
      label: "Alien / Predator",
      tier: "adjacent",
      aliases: ["alien", "aliens", "xenomorph", "predator", "yautja"],
    },
    {
      id: "conjuring",
      label: "The Conjuring",
      tier: "adjacent",
      aliases: ["the conjuring", "conjuring", "annabelle", "the nun"],
    },
    {
      id: "terrifier",
      label: "Terrifier",
      tier: "adjacent",
      aliases: ["terrifier", "art the clown"],
    },
    {
      id: "evil-dead",
      label: "Evil Dead",
      tier: "adjacent",
      aliases: ["evil dead", "ash williams"],
    },
    {
      id: "hellraiser",
      label: "Hellraiser",
      tier: "adjacent",
      aliases: ["hellraiser", "pinhead"],
    },
    {
      id: "texas-chainsaw",
      label: "Texas Chainsaw",
      tier: "adjacent",
      aliases: ["texas chainsaw", "leatherface"],
    },
    {
      id: "exorcist",
      label: "The Exorcist",
      tier: "adjacent",
      aliases: ["the exorcist", "exorcist"],
    },
    {
      id: "saw",
      label: "Saw",
      tier: "adjacent",
      aliases: ["saw", "jigsaw"],
    },
    {
      id: "horror",
      label: "Horror / Slashers",
      tier: "broad",
      aliases: ["horror", "slasher", "slashers", "scary movie", "monster"],
    },
  ];

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

  function canonicalRecord(record) {
    return {
      id: record.id,
      title: record.title,
      date: record.date,
      duration: record.duration,
      views: record.views,
      availability: record.availability,
      liveStatus: record.liveStatus,
      coverage: record.coverage,
      lanes: record.lanes,
    };
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(value))) return false;
    var parsed = new Date(value + "T00:00:00Z");
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  function dayNumber(value) {
    return Math.floor(new Date(value + "T00:00:00Z").getTime() / 86400000);
  }

  function roundOne(value) {
    return Math.round(value * 10) / 10;
  }

  function containsPhrase(haystack, phrase) {
    return (" " + haystack + " ").includes(" " + phrase + " ");
  }

  function sortStable(values, compare) {
    return values
      .map(function (value, index) {
        return { value: value, index: index };
      })
      .sort(function (left, right) {
        return compare(left.value, right.value) || left.index - right.index;
      })
      .map(function (entry) {
        return entry.value;
      });
  }

  function groupMatches(title) {
    var haystack = normalized(title);
    return FRANCHISE_GROUPS.filter(function (group) {
      return group.aliases.some(function (alias) {
        return containsPhrase(haystack, normalized(alias));
      });
    });
  }

  function queryGroups(query) {
    var needle = normalized(query);
    if (!needle) return [];
    return FRANCHISE_GROUPS.filter(function (group) {
      return group.aliases.some(function (alias) {
        var candidate = normalized(alias);
        return candidate === needle
          || (needle.length >= 3 && candidate.includes(needle))
          || containsPhrase(needle, candidate);
      });
    });
  }

  function coverageCount(records) {
    return COVERAGE.reduce(function (output, status) {
      output[status.id] = records.filter(function (record) {
        return record.coverage === status.id;
      }).length;
      return output;
    }, {});
  }

  function laneCount(records) {
    return Object.keys(LANE_LABELS).reduce(function (output, lane) {
      output[lane] = records.filter(function (record) {
        return array(record.lanes).includes(lane);
      }).length;
      return output;
    }, {});
  }

  function validatePayload(payload) {
    if (!payload || payload.schema !== SCHEMA) {
      throw new Error("Archive Atlas requires " + SCHEMA);
    }
    var records = array(payload.records);
    if (!records.length || records.length !== Number(payload.stats && payload.stats.records)) {
      throw new Error("Archive Atlas record count does not match its manifest");
    }
    var ids = new Set();
    records.forEach(function (record) {
      if (!clean(record.id) || ids.has(record.id)) {
        throw new Error("Archive Atlas contains a missing or duplicate record ID");
      }
      ids.add(record.id);
      if (!clean(record.title) || !validDate(record.date)) {
        throw new Error("Archive Atlas contains invalid title/date metadata for " + record.id);
      }
      if (!Number.isFinite(record.duration) || record.duration < 0
        || !Number.isFinite(record.views) || record.views < 0) {
        throw new Error("Archive Atlas contains invalid measurements for " + record.id);
      }
      if (!COVERAGE.some(function (status) { return status.id === record.coverage; })) {
        throw new Error("Archive Atlas contains an unknown coverage status for " + record.id);
      }
      if (!clean(record.availability) || !clean(record.liveStatus)) {
        throw new Error("Archive Atlas must disclose availability/live-status gaps");
      }
    });
    var canonical = records.map(canonicalRecord);
    var actual = fnv1a32(stableJson(canonical));
    var expected = payload.fingerprints && payload.fingerprints.runtimeFnv1a;
    if (!expected || actual !== expected) {
      throw new Error("Archive Atlas fingerprint mismatch");
    }
    return { actual: actual, records: records };
  }

  function makeBuckets(records) {
    var decades = new Map();
    records.forEach(function (record) {
      var year = Number(record.date.slice(0, 4));
      var month = record.date.slice(0, 7);
      var decade = Math.floor(year / 10) * 10;
      if (!decades.has(decade)) decades.set(decade, new Map());
      var years = decades.get(decade);
      if (!years.has(year)) years.set(year, new Map());
      var months = years.get(year);
      if (!months.has(month)) months.set(month, []);
      months.get(month).push(record);
    });

    return Array.from(decades.keys()).sort(function (a, b) {
      return b - a;
    }).map(function (decade) {
      var years = decades.get(decade);
      var yearRows = Array.from(years.keys()).sort(function (a, b) {
        return b - a;
      }).map(function (year) {
        var months = years.get(year);
        var monthRows = Array.from(months.keys()).sort().reverse().map(function (month) {
          var members = months.get(month);
          return {
            month: month,
            label: MONTHS[Number(month.slice(5, 7)) - 1] + " " + year,
            count: members.length,
            coverage: coverageCount(members),
          };
        });
        var members = monthRows.reduce(function (sum, month) {
          return sum + month.count;
        }, 0);
        var yearRecords = records.filter(function (record) {
          return record.date.startsWith(String(year) + "-");
        });
        return {
          year: year,
          count: members,
          coverage: coverageCount(yearRecords),
          months: monthRows,
        };
      });
      var decadeRecords = records.filter(function (record) {
        return Number(record.date.slice(0, 4)) >= decade
          && Number(record.date.slice(0, 4)) < decade + 10;
      });
      return {
        decade: decade,
        label: decade + "s",
        count: decadeRecords.length,
        coverage: coverageCount(decadeRecords),
        years: yearRows,
      };
    });
  }

  function create(input) {
    var payload = serialCopy(input);
    var integrity = validatePayload(payload);
    var records = integrity.records;
    var recordMap = new Map(records.map(function (record) {
      return [record.id, record];
    }));
    var buckets = makeBuckets(records);
    var snapshotDay = dayNumber(payload.snapshotDate);
    var eligible = records.filter(function (record) {
      return record.coverage === "metadata-only";
    });
    var maxViews = Math.max.apply(null, eligible.map(function (record) {
      return record.views;
    }).concat([1]));
    var oldestDay = Math.min.apply(null, eligible.map(function (record) {
      return dayNumber(record.date);
    }).concat([snapshotDay]));
    var maxAgeDays = Math.max(1, snapshotDay - oldestDay);

    var queue = eligible.map(function (record) {
      var signals = groupMatches(record.title);
      var bestTier = signals.some(function (group) { return group.tier === "core"; })
        ? "core"
        : signals.some(function (group) { return group.tier === "adjacent"; })
          ? "adjacent"
          : signals.some(function (group) { return group.tier === "broad"; })
            ? "broad"
            : "none";
      var franchisePoints = {
        core: 20,
        adjacent: 14,
        broad: 6,
        none: 0,
      }[bestTier];
      var popularityPoints = roundOne(
        50 * Math.log1p(record.views) / Math.log1p(maxViews)
      );
      var ageDays = Math.max(0, snapshotDay - dayNumber(record.date));
      var recencyPoints = roundOne(30 * Math.max(0, 1 - ageDays / maxAgeDays));
      var score = roundOne(popularityPoints + recencyPoints + franchisePoints);
      return {
        record: record,
        score: score,
        breakdown: {
          popularity: popularityPoints,
          recency: recencyPoints,
          franchise: franchisePoints,
        },
        signals: signals.map(function (group) {
          return { id: group.id, label: group.label, tier: group.tier };
        }),
      };
    });
    queue = sortStable(queue, function (left, right) {
      return right.score - left.score
        || right.record.views - left.record.views
        || right.record.date.localeCompare(left.record.date)
        || left.record.id.localeCompare(right.record.id);
    });
    var priorityById = new Map(queue.map(function (entry, index) {
      return [entry.record.id, {
        rank: index + 1,
        score: entry.score,
        breakdown: entry.breakdown,
        signals: entry.signals,
      }];
    }));

    function passesFilters(record, rawFilters) {
      var filters = rawFilters || {};
      if (filters.decade != null) {
        var decade = Number(String(filters.decade).replace(/s$/i, ""));
        var year = Number(record.date.slice(0, 4));
        if (!Number.isFinite(decade) || year < decade || year >= decade + 10) return false;
      }
      if (filters.year != null && record.date.slice(0, 4) !== String(filters.year)) {
        return false;
      }
      if (filters.month != null) {
        var month = String(filters.month);
        if (/^\d{1,2}$/.test(month) && filters.year != null) {
          month = String(filters.year) + "-" + month.padStart(2, "0");
        }
        if (!/^\d{4}-\d{2}$/.test(month) || !record.date.startsWith(month + "-")) {
          return false;
        }
      }
      var statuses = array(filters.coverage).length
        ? array(filters.coverage)
        : filters.coverage ? [filters.coverage] : [];
      if (statuses.length && !statuses.includes(record.coverage)) return false;
      if (filters.lane && !array(record.lanes).includes(filters.lane)) return false;
      if (filters.availability && record.availability !== filters.availability) return false;
      if (filters.liveStatus && record.liveStatus !== filters.liveStatus) return false;
      if (filters.minViews != null && record.views < Number(filters.minViews)) return false;
      if (filters.franchise) {
        var franchise = FRANCHISE_GROUPS.find(function (group) {
          return group.id === filters.franchise;
        });
        if (!franchise || !groupMatches(record.title).some(function (group) {
          return group.id === franchise.id;
        })) return false;
      }
      return true;
    }

    function sortedRecords(values, sort) {
      var mode = sort || "newest";
      return sortStable(values.slice(), function (left, right) {
        if (mode === "oldest") {
          return left.date.localeCompare(right.date) || left.id.localeCompare(right.id);
        }
        if (mode === "views") {
          return right.views - left.views
            || right.date.localeCompare(left.date)
            || left.id.localeCompare(right.id);
        }
        if (mode === "title") {
          return left.title.localeCompare(right.title)
            || right.date.localeCompare(left.date)
            || left.id.localeCompare(right.id);
        }
        if (mode === "duration") {
          return right.duration - left.duration
            || right.date.localeCompare(left.date)
            || left.id.localeCompare(right.id);
        }
        if (mode === "distill-priority") {
          var leftPriority = priorityById.get(left.id);
          var rightPriority = priorityById.get(right.id);
          return (leftPriority ? leftPriority.rank : Number.MAX_SAFE_INTEGER)
            - (rightPriority ? rightPriority.rank : Number.MAX_SAFE_INTEGER)
            || right.date.localeCompare(left.date)
            || left.id.localeCompare(right.id);
        }
        return right.date.localeCompare(left.date) || left.id.localeCompare(right.id);
      });
    }

    function browse(rawFilters) {
      var filters = serialCopy(rawFilters || {});
      var filtered = records.filter(function (record) {
        return passesFilters(record, filters);
      });
      var sorted = sortedRecords(filtered, filters.sort);
      var offset = Math.max(0, Number(filters.offset) || 0);
      var requested = filters.limit == null ? sorted.length : Number(filters.limit);
      var limit = Math.max(0, Math.min(sorted.length, Number.isFinite(requested) ? requested : sorted.length));
      return {
        filters: filters,
        total: sorted.length,
        offset: offset,
        records: serialCopy(sorted.slice(offset, offset + limit)),
        evidenceScope: "cached YouTube metadata only",
      };
    }

    function search(query, rawFilters) {
      var needle = normalized(query);
      var groups = queryGroups(needle);
      if (!needle) {
        return {
          query: clean(query),
          normalizedQuery: needle,
          total: 0,
          results: [],
          expandedAliases: [],
          evidenceScope: "cached titles only; transcript search is disabled",
          transcriptSearch: false,
        };
      }
      var terms = needle.split(" ").filter(Boolean);
      var candidates = records.filter(function (record) {
        return passesFilters(record, rawFilters || {});
      }).map(function (record) {
        var title = normalized(record.title);
        var matchedTerms = terms.filter(function (term) {
          return title.includes(term);
        });
        var titleGroups = groupMatches(record.title);
        var matchedGroups = groups.filter(function (group) {
          return titleGroups.some(function (titleGroup) {
            return titleGroup.id === group.id;
          });
        });
        var score = title.includes(needle) ? 120 : 0;
        score += matchedTerms.length * 12;
        if (matchedTerms.length === terms.length) score += 35;
        score += matchedGroups.length * 60;
        return {
          record: record,
          score: score,
          matchedTerms: matchedTerms,
          matchedAliases: matchedGroups.map(function (group) {
            return group.label;
          }),
        };
      }).filter(function (entry) {
        return entry.score > 0;
      });
      candidates = sortStable(candidates, function (left, right) {
        return right.score - left.score
          || right.record.views - left.record.views
          || right.record.date.localeCompare(left.record.date)
          || left.record.id.localeCompare(right.record.id);
      });
      var limit = rawFilters && rawFilters.limit != null
        ? Math.max(0, Math.min(200, Number(rawFilters.limit) || 0))
        : 50;
      return {
        query: clean(query),
        normalizedQuery: needle,
        total: candidates.length,
        results: candidates.slice(0, limit).map(function (entry) {
          var output = serialCopy(entry.record);
          output.match = {
            score: entry.score,
            basis: "cached title metadata",
            matchedTerms: entry.matchedTerms,
            matchedAliases: entry.matchedAliases,
          };
          return output;
        }),
        expandedAliases: groups.map(function (group) {
          return { id: group.id, label: group.label };
        }),
        evidenceScope: "cached titles only; transcript search is disabled",
        transcriptSearch: false,
      };
    }

    function getDistillQueue(options) {
      var settings = options || {};
      var candidates = queue.filter(function (entry) {
        return passesFilters(entry.record, settings);
      });
      var limit = settings.limit == null
        ? 25
        : Math.max(0, Math.min(200, Number(settings.limit) || 0));
      return {
        formula: serialCopy(QUEUE_FORMULA),
        snapshotDate: payload.snapshotDate,
        eligible: queue.length,
        matched: candidates.length,
        excluded: {
          deeplyIndexed: records.filter(function (record) {
            return record.coverage === "deeply-indexed";
          }).length,
          captionLimited: records.filter(function (record) {
            return record.coverage === "caption-limited";
          }).length,
          unavailable: records.filter(function (record) {
            return record.coverage === "unavailable";
          }).length,
        },
        records: candidates.slice(0, limit).map(function (entry) {
          var output = serialCopy(entry.record);
          output.priority = {
            rank: priorityById.get(entry.record.id).rank,
            score: entry.score,
            breakdown: serialCopy(entry.breakdown),
            signals: serialCopy(entry.signals),
            basis: "cached title/date/views only",
          };
          return output;
        }),
      };
    }

    function getCoverage() {
      var counts = coverageCount(records);
      var lanes = laneCount(records);
      var selected = records.filter(function (record) {
        return array(record.lanes).some(function (lane) {
          return lane !== "archive-metadata";
        });
      });
      return {
        total: records.length,
        statuses: COVERAGE.map(function (status) {
          return {
            id: status.id,
            label: status.label,
            definition: status.definition,
            count: counts[status.id],
          };
        }),
        lanes: Object.keys(LANE_LABELS).map(function (lane) {
          return { id: lane, label: LANE_LABELS[lane], count: lanes[lane] };
        }),
        currentSourceLaneRecords: selected.length,
        captionBackedDeepRecords: counts["deeply-indexed"],
        selectedCaptionLimitedRecords: selected.filter(function (record) {
          return record.coverage === "caption-limited";
        }).length,
        deepCoveragePercent: roundOne(100 * counts["deeply-indexed"] / records.length),
        policy: "Metadata-only records have no transcript, topic, speaker, sentiment or quote claims.",
      };
    }

    function getFilterOptions() {
      return {
        decades: buckets.map(function (row) {
          return { value: row.decade, label: row.label, count: row.count };
        }),
        years: buckets.flatMap(function (decade) {
          return decade.years.map(function (row) {
            return { value: row.year, label: String(row.year), count: row.count };
          });
        }),
        months: buckets.flatMap(function (decade) {
          return decade.years.flatMap(function (year) {
            return year.months.map(function (row) {
              return { value: row.month, label: row.label, count: row.count };
            });
          });
        }),
        coverage: COVERAGE.map(function (status) {
          return { value: status.id, label: status.label };
        }),
        lanes: Object.keys(LANE_LABELS).map(function (lane) {
          return { value: lane, label: LANE_LABELS[lane] };
        }),
        franchises: FRANCHISE_GROUPS.map(function (group) {
          return { value: group.id, label: group.label, tier: group.tier };
        }),
        availability: Array.from(new Set(records.map(function (record) {
          return record.availability;
        }))).sort(),
        liveStatus: Array.from(new Set(records.map(function (record) {
          return record.liveStatus;
        }))).sort(),
      };
    }

    return Object.freeze({
      engine: "WWAM Archive Atlas",
      version: VERSION,
      schema: SCHEMA,
      getStats: function () {
        var stats = serialCopy(payload.stats);
        stats.hours = roundOne(stats.totalDurationSeconds / 3600);
        stats.deepCoveragePercent = roundOne(
          100 * stats.coverage["deeply-indexed"] / stats.records
        );
        return stats;
      },
      getBuckets: function () {
        return serialCopy(buckets);
      },
      getFilterOptions: getFilterOptions,
      getCoverage: getCoverage,
      getRecord: function (id) {
        var record = recordMap.get(clean(id));
        return record ? serialCopy(record) : null;
      },
      browse: browse,
      search: search,
      getDistillQueue: getDistillQueue,
      getProvenance: function () {
        return serialCopy({
          snapshotDate: payload.snapshotDate,
          cutoff: payload.cutoff,
          provenance: payload.provenance,
          fingerprints: payload.fingerprints,
        });
      },
      verifyFingerprint: function () {
        return {
          ok: true,
          expected: payload.fingerprints.runtimeFnv1a,
          actual: integrity.actual,
          archiveSha256: payload.fingerprints.archiveSha256,
          feedSha256: payload.fingerprints.feedSha256,
        };
      },
      formula: serialCopy(QUEUE_FORMULA),
      aliases: FRANCHISE_GROUPS.map(function (group) {
        return {
          id: group.id,
          label: group.label,
          tier: group.tier,
          aliases: group.aliases.slice(),
        };
      }),
    });
  }

  root.WWAMArchiveAtlasEngine = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    COVERAGE: serialCopy(COVERAGE),
    QUEUE_FORMULA: serialCopy(QUEUE_FORMULA),
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
