(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker-youtube-wiki/archive-deep-portfolio/v1";
  var LEGACY_SCHEMA = "wwam-archive-deep-distill/v1";
  var BATCH_SCHEMA = "shokker-youtube-wiki/archive-deep-batch/v1";
  var EVIDENCE_SCOPE =
    "public aggregate data and short timestamped receipts only; " +
    "automatic captions remain private and every candidate remains quarantined";

  var BATCH_SPECS = Object.freeze([
    Object.freeze({
      id: "archive-deep-batch-01",
      sequence: 1,
      schema: LEGACY_SCHEMA,
      publicFnv1a: "fnv1a32:17045a51",
      selectionSha256:
        "sha256:36379617f6144dfc516cd3cb9e848477e056bb0e1f61bab3bbd82f8e4b1e7021",
      captionSetSha256:
        "sha256:42c3c16788cc66f3efe956435fd86609d02c31a639167212bb78a46cc9c35630",
      sourceAtlasArchiveSha256:
        "sha256:c9587ae64012aa3d9480b01cf25a571ed7d6ae9d5df57e3af17f39520a7d62a4",
    }),
    Object.freeze({
      id: "archive-deep-batch-02",
      sequence: 2,
      schema: BATCH_SCHEMA,
      publicFnv1a: "fnv1a32:bcea5692",
      selectionSha256:
        "sha256:74a060317ce5fedd59adba315b4ff888abce4bdb3b40c6473917e99e8ce9dec5",
      captionSetSha256:
        "sha256:2d40c45f985a9757b3a0bcaf113980d466cc28a5ac88a522a68d13557f2b6c2a",
      sourceAtlasArchiveSha256:
        "sha256:f11c4db03460f8854465718828ae8350e00462b93b4ecd13343d4a8f088d0855",
      excludedSourceIdsSha256:
        "sha256:615a048bc553de31ddd51652eb5a4721b7b436f553ddbab352953c6a9f676396",
    }),
  ]);

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

  function fail(message) {
    throw new Error("Archive Deep Portfolio: " + message);
  }

  function sameValue(left, right) {
    return stableJson(left) === stableJson(right);
  }

  function localRank(stream, sequence) {
    var priority = stream && stream.archivePriority;
    if (!priority) return NaN;
    return Number(sequence === 1 ? priority.originalRank : priority.currentRank);
  }

  function selectionRank(record, sequence) {
    return Number(sequence === 1 ? record.originalRank : record.currentPriorityRank);
  }

  function validateFactory(factory) {
    if (!factory || typeof factory.create !== "function" ||
        factory.SCHEMA !== LEGACY_SCHEMA) {
      fail("a compatible WWAMArchiveDeepEngine factory is required");
    }
  }

  function validateLane(payload, spec) {
    if (spec.sequence === 1) {
      if (payload.lane != null) {
        fail(spec.id + " must retain its original lane-less legacy envelope");
      }
      return;
    }
    var lane = payload.lane;
    if (!lane ||
        lane.id !== spec.id ||
        lane.kind !== "caption-audited-quarantine" ||
        lane.sequence !== spec.sequence ||
        lane.integrationStatus !== "integrated-quarantine" ||
        lane.promotionAllowed !== false ||
        lane.requiresAuthenticatedReview !== true) {
      fail(spec.id + " lane metadata is invalid");
    }
  }

  function validateSelection(payload, spec) {
    var selection = payload.selection;
    var records = selection && array(selection.records);
    var streams = array(payload.streams);
    if (!selection ||
        selection.priorityVersion !== "archive-distill-priority/v1" ||
        selection.atlasSnapshotDate !== "2026-07-23" ||
        selection.sourceAtlasArchiveSha256 !== spec.sourceAtlasArchiveSha256 ||
        selection.frozen !== true ||
        records.length !== 10) {
      fail(spec.id + " frozen selection metadata is invalid");
    }
    if (spec.sequence === 2 &&
        (!sameValue(selection.excludedLaneIds, ["archive-deep-batch-01"]) ||
         selection.excludedSourceIdsSha256 !== spec.excludedSourceIdsSha256)) {
      fail(spec.id + " exclusion boundary is invalid");
    }
    records.forEach(function (record, index) {
      var stream = streams[index];
      var rank = index + 1;
      if (!stream ||
          record.id !== stream.id ||
          selectionRank(record, spec.sequence) !== rank ||
          Number(record.priorityScore) !== Number(stream.archivePriority.score) ||
          Number(record.snapshotViews) !== Number(stream.views) ||
          !sameValue(record.breakdown, stream.archivePriority.breakdown)) {
        fail(spec.id + " selection record #" + rank + " does not bind its stream");
      }
    });
  }

  function validateBoundary(payload, spec) {
    var policy = payload.evidencePolicy;
    if (!policy ||
        policy.privateInput !== "full YouTube JSON3 automatic captions" ||
        policy.publicExcerptWordLimit !== 16 ||
        policy.speakerDiarized !== false ||
        policy.originAttribution !== false ||
        policy.visualContextVerified !== false) {
      fail(spec.id + " evidence boundary is invalid");
    }
    array(payload.streams).forEach(function (stream, index) {
      if (!stream.rightsPolicy ||
          stream.rightsPolicy.speakerClaimsAllowed !== false ||
          stream.rightsPolicy.originClaimsAllowed !== false ||
          !stream.captionEvidence ||
          stream.captionEvidence.fullPayloadPublic !== false ||
          stream.captionEvidence.speakerDiarized !== false ||
          stream.captionEvidence.originAttribution !== false) {
        fail(spec.id + " source #" + (index + 1) + " lost an evidence boundary");
      }
      if (spec.sequence === 2 &&
          (stream.rightsPolicy.promotionAllowed !== false ||
           stream.rightsPolicy.performerClaimsAllowed !== false)) {
        fail(spec.id + " source #" + (index + 1) + " lost its quarantine boundary");
      }
    });
  }

  function compatibilityEnvelope(payload, spec, factory) {
    var compatible = serialCopy(payload);
    compatible.schema = factory.SCHEMA;
    if (spec.sequence === 2) {
      compatible.streams.forEach(function (stream) {
        stream.archivePriority.originalRank = stream.archivePriority.currentRank;
      });
      compatible.fingerprints.publicFnv1a =
        fnv1a32(stableJson(compatible.streams));
    }
    return compatible;
  }

  function validateBatch(rawPayload, spec, factory) {
    if (!rawPayload || rawPayload.schema !== spec.schema) {
      fail(spec.id + " requires schema " + spec.schema);
    }
    if (array(rawPayload.streams).length !== 10) {
      fail(spec.id + " requires exactly ten streams");
    }
    validateLane(rawPayload, spec);
    validateSelection(rawPayload, spec);
    validateBoundary(rawPayload, spec);

    var fingerprints = rawPayload.fingerprints;
    if (!fingerprints ||
        fingerprints.publicFnv1a !== spec.publicFnv1a ||
        fingerprints.selectionSha256 !== spec.selectionSha256 ||
        fingerprints.captionSetSha256 !== spec.captionSetSha256) {
      fail(spec.id + " pinned fingerprints do not match");
    }
    var actualPublic = fnv1a32(stableJson(rawPayload.streams));
    if (actualPublic !== spec.publicFnv1a) {
      fail(spec.id + " public stream fingerprint mismatch");
    }

    var compatible = compatibilityEnvelope(rawPayload, spec, factory);
    var engine;
    try {
      engine = factory.create(compatible);
    } catch (error) {
      fail(spec.id + " failed legacy engine validation: " + clean(error.message));
    }
    var required = [
      "browse",
      "search",
      "getStream",
      "getMetrics",
      "getTopicIndex",
      "getCharacterIndex",
      "getMomentCandidates",
      "getTopicReceipts",
      "exportSnapshot",
      "verifyFingerprint",
    ];
    if (!engine || required.some(function (method) {
      return typeof engine[method] !== "function";
    })) {
      fail(spec.id + " produced an invalid legacy engine");
    }
    var verification = engine.verifyFingerprint();
    var exported = engine.exportSnapshot();
    if (!verification ||
        verification.ok !== true ||
        verification.actual !== compatible.fingerprints.publicFnv1a ||
        array(exported.streams).length !== 10 ||
        !sameValue(
          exported.streams.map(function (stream) { return stream.id; }),
          rawPayload.streams.map(function (stream) { return stream.id; })
        )) {
      fail(spec.id + " legacy engine verification did not reconcile");
    }
    return {
      payload: serialCopy(rawPayload),
      originalPublicFingerprint: actualPublic,
      compatibilityFingerprint: compatible.fingerprints.publicFnv1a,
      engineVerification: serialCopy(verification),
      spec: spec,
    };
  }

  function batchProvenance(batch, local, portfolio) {
    return {
      id: batch.spec.id,
      sequence: batch.spec.sequence,
      sourceSchema: batch.spec.schema,
      batchRank: local,
      portfolioRank: portfolio,
      candidateState: "quarantined",
      promotionAllowed: false,
      speakerDiarized: false,
      originAttribution: false,
      publicFnv1a: batch.spec.publicFnv1a,
      selectionSha256: batch.spec.selectionSha256,
      captionSetSha256: batch.spec.captionSetSha256,
    };
  }

  function mergeStreams(batches) {
    var ids = new Set();
    var priorities = new Set();
    var output = [];
    batches.forEach(function (batch) {
      batch.payload.streams.forEach(function (source, index) {
        var rank = localRank(source, batch.spec.sequence);
        var expectedRank = index + 1;
        var portfolioRank = ((batch.spec.sequence - 1) * 10) + rank;
        var priorityKey = source.archivePriority.version + ":" + portfolioRank;
        if (rank !== expectedRank) {
          fail(batch.spec.id + " archive priority order is invalid");
        }
        if (ids.has(source.id)) {
          fail("duplicate source ID " + source.id);
        }
        if (priorities.has(priorityKey)) {
          fail("archive-priority collision at " + priorityKey);
        }
        if (source.archivePriority.portfolioRank != null &&
            Number(source.archivePriority.portfolioRank) !== portfolioRank) {
          fail("archive-priority collision claimed by " + source.id);
        }
        ids.add(source.id);
        priorities.add(priorityKey);
        var stream = serialCopy(source);
        stream.archivePriority.batchRank = rank;
        stream.archivePriority.portfolioRank = portfolioRank;
        stream.archivePriority.archivePortfolioRank = portfolioRank;
        stream.archivePortfolioRank = portfolioRank;
        stream.archiveBatch = batchProvenance(batch, rank, portfolioRank);
        output.push(stream);
      });
    });
    if (output.length !== 20 || priorities.size !== 20) {
      fail("the portfolio must resolve to twenty unique priority positions");
    }
    return output;
  }

  function mergeTopicIndex(batches) {
    var byName = new Map();
    batches.forEach(function (batch) {
      array(batch.payload.topicIndex).forEach(function (sourceTopic) {
        var key = normalized(sourceTopic.name);
        var topic = byName.get(key);
        if (!topic) {
          topic = { name: sourceTopic.name, mentions: 0, streams: [] };
          byName.set(key, topic);
        }
        topic.mentions += Number(sourceTopic.mentions || 0);
        array(sourceTopic.streams).forEach(function (sourceRef) {
          var local = Number(sourceRef.rank);
          var ref = serialCopy(sourceRef);
          ref.batchRank = local;
          ref.rank = ((batch.spec.sequence - 1) * 10) + local;
          ref.portfolioRank = ref.rank;
          ref.archiveBatchId = batch.spec.id;
          topic.streams.push(ref);
        });
      });
    });
    return Array.from(byName.values()).map(function (topic) {
      topic.streams.sort(function (left, right) {
        return left.portfolioRank - right.portfolioRank;
      });
      return topic;
    }).sort(function (left, right) {
      return right.mentions - left.mentions || left.name.localeCompare(right.name);
    });
  }

  function mergeCharacterIndex(batches) {
    var byCharacter = new Map();
    batches.forEach(function (batch) {
      array(batch.payload.characterIndex).forEach(function (sourceCharacter) {
        var key = normalized(sourceCharacter.character);
        var character = byCharacter.get(key);
        if (!character) {
          character = {
            character: sourceCharacter.character,
            mentions: 0,
            performanceCues: 0,
            streams: [],
          };
          byCharacter.set(key, character);
        }
        character.mentions += Number(sourceCharacter.mentions || 0);
        character.performanceCues += Number(sourceCharacter.performanceCues || 0);
        array(sourceCharacter.streams).forEach(function (sourceRef) {
          var local = Number(sourceRef.rank);
          var ref = serialCopy(sourceRef);
          ref.batchRank = local;
          ref.rank = ((batch.spec.sequence - 1) * 10) + local;
          ref.portfolioRank = ref.rank;
          ref.archiveBatchId = batch.spec.id;
          character.streams.push(ref);
        });
      });
    });
    return Array.from(byCharacter.values()).map(function (character) {
      character.streams.sort(function (left, right) {
        return left.portfolioRank - right.portfolioRank;
      });
      return character;
    }).sort(function (left, right) {
      return right.mentions - left.mentions ||
        left.character.localeCompare(right.character);
    });
  }

  function sumMetric(batches, name, precision) {
    var total = batches.reduce(function (sum, batch) {
      return sum + Number(batch.payload.meta[name] || 0);
    }, 0);
    return precision == null ? total : Number(total.toFixed(precision));
  }

  function createMetrics(batches, topicIndex) {
    return {
      batches: 2,
      streams: sumMetric(batches, "streams"),
      captioned: sumMetric(batches, "captioned"),
      restricted: sumMetric(batches, "restricted"),
      visualContextUnverified: batches.reduce(function (total, batch) {
        return total + batch.payload.streams.filter(function (stream) {
          return stream.rightsPolicy.mode === "visual-context-unverified";
        }).length;
      }, 0),
      hours: sumMetric(batches, "hours", 1),
      wordsAudited: sumMetric(batches, "wordsAudited"),
      captionEvents: sumMetric(batches, "captionEvents"),
      topicLanes: sumMetric(batches, "topicLanes"),
      distinctTopics: topicIndex.length,
      publicMomentCandidates: sumMetric(batches, "publicMomentCandidates"),
      characterSignals: sumMetric(batches, "characterSignals"),
      snapshotViews: sumMetric(batches, "snapshotViews"),
    };
  }

  function streamBlob(stream) {
    return normalized([
      stream.title,
      stream.contentMode,
      stream.rightsPolicy && stream.rightsPolicy.mode,
      stream.archiveBatch && stream.archiveBatch.id,
      array(stream.topics).map(function (topic) { return topic.name; }).join(" "),
      array(stream.characters).map(function (character) {
        return character.character;
      }).join(" "),
      array(stream.moments).map(function (moment) {
        return moment.category + " " + moment.excerpt;
      }).join(" "),
    ].join(" "));
  }

  function create(input, explicitFactory) {
    var settings = Array.isArray(input) ?
      { batches: input, engineFactory: explicitFactory } : (input || {});
    var factory = settings.engineFactory || root.WWAMArchiveDeepEngine;
    var rawBatches = array(settings.batches);
    validateFactory(factory);
    if (rawBatches.length !== BATCH_SPECS.length) {
      fail("exactly two ordered batches are required");
    }

    var batches = rawBatches.map(function (payload, index) {
      return validateBatch(payload, BATCH_SPECS[index], factory);
    });
    var streams = mergeStreams(batches);
    var byId = new Map(streams.map(function (stream) {
      return [stream.id, stream];
    }));
    var topicIndex = mergeTopicIndex(batches);
    var characterIndex = mergeCharacterIndex(batches);
    var metrics = createMetrics(batches, topicIndex);
    var provenance = batches.map(function (batch) {
      return {
        id: batch.spec.id,
        sequence: batch.spec.sequence,
        sourceSchema: batch.spec.schema,
        streams: batch.payload.meta.streams,
        publicFnv1a: batch.spec.publicFnv1a,
        originalPublicFingerprint: batch.originalPublicFingerprint,
        selectionSha256: batch.spec.selectionSha256,
        captionSetSha256: batch.spec.captionSetSha256,
        legacyEngineVerification: batch.engineVerification,
        legacyCompatibilityFnv1a: batch.compatibilityFingerprint,
        candidateState: "quarantined",
        promotionAllowed: false,
      };
    });
    var portfolioFingerprint = fnv1a32(stableJson(provenance.map(function (batch) {
      return {
        id: batch.id,
        sequence: batch.sequence,
        sourceSchema: batch.sourceSchema,
        publicFnv1a: batch.publicFnv1a,
        selectionSha256: batch.selectionSha256,
        captionSetSha256: batch.captionSetSha256,
      };
    })));
    var evidencePolicy = {
      privateInput: "full YouTube JSON3 automatic captions remain outside this artifact",
      publicInput: "aggregate measurements and short timestamped receipts",
      publicExcerptWordLimit: 16,
      speakerDiarized: false,
      performerAttribution: false,
      originAttribution: false,
      visualContextVerified: false,
      candidateState: "quarantined",
      promotionAllowed: false,
      authenticatedReviewRequiredForPromotion: true,
      fingerprintScope:
        "structural-change-detection-only; checksums are not signatures or authenticity proof",
    };

    function browse(options) {
      var filters = options || {};
      var query = normalized(filters.query);
      var records = streams.filter(function (stream) {
        if (filters.contentMode && stream.contentMode !== filters.contentMode) {
          return false;
        }
        if (filters.rightsMode &&
            stream.rightsPolicy.mode !== filters.rightsMode) {
          return false;
        }
        if (filters.batchId &&
            stream.archiveBatch.id !== filters.batchId) {
          return false;
        }
        if (filters.batchSequence != null &&
            stream.archiveBatch.sequence !== Number(filters.batchSequence)) {
          return false;
        }
        if (filters.restricted != null &&
            stream.rightsPolicy.restrictedToTopicNavigation !==
              Boolean(filters.restricted)) {
          return false;
        }
        if (filters.minPriorityScore != null &&
            Number(stream.archivePriority.score) <
              Number(filters.minPriorityScore)) {
          return false;
        }
        return !query || streamBlob(stream).includes(query);
      });
      var sort = filters.sort || "priority";
      records.sort(function (left, right) {
        if (sort === "views") {
          return right.views - left.views ||
            left.archivePriority.portfolioRank -
              right.archivePriority.portfolioRank;
        }
        if (sort === "newest") {
          return right.date.localeCompare(left.date) ||
            left.archivePriority.portfolioRank -
              right.archivePriority.portfolioRank;
        }
        if (sort === "title") {
          return left.title.localeCompare(right.title) ||
            left.archivePriority.portfolioRank -
              right.archivePriority.portfolioRank;
        }
        return left.archivePriority.portfolioRank -
          right.archivePriority.portfolioRank;
      });
      var offset = Math.max(0, Number(filters.offset || 0));
      var limit = filters.limit == null ?
        records.length : Math.max(0, Math.min(100, Number(filters.limit) || 0));
      return {
        filters: serialCopy(filters),
        total: records.length,
        offset: offset,
        records: serialCopy(records.slice(offset, offset + limit)),
        evidenceScope: EVIDENCE_SCOPE,
      };
    }

    function search(query, options) {
      var needle = normalized(query);
      if (!needle) {
        return {
          query: clean(query),
          total: 0,
          results: [],
          evidenceScope: EVIDENCE_SCOPE,
        };
      }
      var result = browse(Object.assign({}, options || {}, { query: needle }));
      var ranked = result.records.map(function (stream) {
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
          left.archivePriority.portfolioRank -
            right.archivePriority.portfolioRank;
      });
      return {
        query: clean(query),
        total: ranked.length,
        results: serialCopy(ranked),
        evidenceScope: EVIDENCE_SCOPE,
      };
    }

    function getMomentCandidates(options) {
      var filters = options || {};
      var output = [];
      streams.forEach(function (stream) {
        array(stream.moments).forEach(function (moment) {
          if (filters.category && moment.category !== filters.category) return;
          if (filters.contentMode && stream.contentMode !== filters.contentMode) return;
          if (filters.batchId && stream.archiveBatch.id !== filters.batchId) return;
          if (filters.minHeat != null &&
              Number(moment.heat) < Number(filters.minHeat)) return;
          output.push(Object.assign({}, serialCopy(moment), {
            sourceId: stream.id,
            sourceTitle: stream.title,
            contentMode: stream.contentMode,
            sourceUrl: stream.url,
            playbackUrl: stream.url + "&t=" + Number(moment.t || 0) + "s",
            archiveBatch: serialCopy(stream.archiveBatch),
            candidateState: "quarantined",
            promotionAllowed: false,
            speaker: null,
          }));
        });
      });
      output.sort(function (left, right) {
        return right.heat - left.heat ||
          left.archiveBatch.portfolioRank - right.archiveBatch.portfolioRank ||
          left.t - right.t;
      });
      var limit = filters.limit == null ?
        output.length : Math.max(0, Math.min(100, Number(filters.limit) || 0));
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
            archiveBatch: serialCopy(stream.archiveBatch),
            speaker: null,
            originAttribution: false,
            promotionAllowed: false,
          });
        });
      });
      output.sort(function (left, right) {
        return right.topic.mentions - left.topic.mentions ||
          left.archiveBatch.portfolioRank - right.archiveBatch.portfolioRank;
      });
      return serialCopy(output);
    }

    function snapshot() {
      return {
        schema: SCHEMA,
        generated: batches.reduce(function (latest, batch) {
          return clean(batch.payload.generated) > latest ?
            clean(batch.payload.generated) : latest;
        }, ""),
        scope:
          "Deterministic public composition of Archive Deep Batch 01 and Batch 02.",
        evidencePolicy: serialCopy(evidencePolicy),
        meta: serialCopy(metrics),
        batches: serialCopy(provenance),
        streams: serialCopy(streams),
        topicIndex: serialCopy(topicIndex),
        characterIndex: serialCopy(characterIndex),
        fingerprints: {
          portfolioFnv1a: portfolioFingerprint,
          scope: "batch-manifest-structural-change-detection-only",
          batches: provenance.map(function (batch) {
            return {
              id: batch.id,
              publicFnv1a: batch.publicFnv1a,
              selectionSha256: batch.selectionSha256,
              captionSetSha256: batch.captionSetSha256,
            };
          }),
        },
      };
    }

    return Object.freeze({
      engine: "WWAM Archive Deep Portfolio",
      version: VERSION,
      schema: SCHEMA,
      getMetrics: function () { return serialCopy(metrics); },
      getEvidencePolicy: function () { return serialCopy(evidencePolicy); },
      getSelection: function () { return serialCopy(provenance); },
      getStream: function (id) {
        var stream = byId.get(clean(id));
        return stream ? serialCopy(stream) : null;
      },
      browse: browse,
      search: search,
      getMomentCandidates: getMomentCandidates,
      getTopicReceipts: getTopicReceipts,
      getTopicIndex: function () { return serialCopy(topicIndex); },
      getCharacterIndex: function () { return serialCopy(characterIndex); },
      verifyFingerprint: function () {
        return {
          ok: true,
          actual: portfolioFingerprint,
          scope: "structural-change-detection-only",
          authenticityVerified: false,
          batches: provenance.map(function (batch) {
            return {
              id: batch.id,
              sourceSchema: batch.sourceSchema,
              ok: batch.legacyEngineVerification.ok,
              expected: batch.publicFnv1a,
              actual: batch.originalPublicFingerprint,
              legacyCompatibilityFnv1a: batch.legacyCompatibilityFnv1a,
              legacyCompatibilityActual: batch.legacyEngineVerification.actual,
              selectionSha256: batch.selectionSha256,
              captionSetSha256: batch.captionSetSha256,
            };
          }),
        };
      },
      exportSnapshot: function () { return snapshot(); },
      getSearchPayload: function () { return snapshot(); },
    });
  }

  root.WWAMArchiveDeepPortfolio = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    LEGACY_SCHEMA: LEGACY_SCHEMA,
    BATCH_SCHEMA: BATCH_SCHEMA,
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
