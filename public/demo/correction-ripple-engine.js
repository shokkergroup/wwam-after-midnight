(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "wwam.correction-ripple.v1";
  var SURFACES = Object.freeze([
    Object.freeze({ id: "memory-graph", label: "MEMORY GRAPH" }),
    Object.freeze({ id: "take-time-machine", label: "TAKE TIME MACHINE" }),
    Object.freeze({ id: "bit-ancestry", label: "BIT ANCESTRY" }),
    Object.freeze({ id: "riff-chemistry", label: "RIFF CHEMISTRY" }),
    Object.freeze({ id: "personalized-descent", label: "PERSONALIZED DESCENT" }),
    Object.freeze({ id: "courts", label: "WWAM COURTS" }),
    Object.freeze({ id: "live-aftermath", label: "LIVE AFTERMATH" }),
    Object.freeze({ id: "character-readiness", label: "CHARACTER READINESS" }),
    Object.freeze({ id: "creator-control-room", label: "CREATOR CONTROL ROOM" })
  ]);
  var NON_REGISTERED = Object.freeze([
    Object.freeze({
      id: "ask-the-tape",
      label: "ASK THE TAPE",
      status: "NOT_REGISTERED",
      effectClaim: "NONE",
      reason:
        "Ask retrieval does not expose a correction-bound dependency ledger in this snapshot."
    }),
    Object.freeze({
      id: "clip-lab",
      label: "CLIP LAB",
      status: "NOT_REGISTERED",
      effectClaim: "NONE",
      reason:
        "Clip Lab does not expose a correction-bound dependency ledger in this snapshot."
    })
  ]);

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value) {
    return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
  }

  function slug(value) {
    return (
      clean(value)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "unknown"
    );
  }

  function fingerprint(value) {
    var source = clean(value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function uniqueSorted(values) {
    return Array.from(
      new Set(
        array(values)
          .map(clean)
          .filter(Boolean)
      )
    ).sort();
  }

  function intersect(left, rightSet) {
    return uniqueSorted(left).filter(function (value) {
      return rightSet.has(value);
    });
  }

  function surfaceOrder(id) {
    var index = SURFACES.findIndex(function (surface) {
      return surface.id === id;
    });
    return index < 0 ? SURFACES.length : index;
  }

  function sortHits(values) {
    return array(values).sort(function (a, b) {
      return (
        surfaceOrder(a.surfaceId) - surfaceOrder(b.surfaceId) ||
        a.recordId.localeCompare(b.recordId)
      );
    });
  }

  function registry(showcase) {
    var data = showcase || {};
    var sources = array(data.sources);
    var receipts = array(data.receipts);
    var sourceById = new Map();
    var receiptById = new Map();
    var duplicateSourceIds = [];
    var duplicateReceiptIds = [];

    sources.forEach(function (source) {
      var id = clean(source && source.id);
      if (!id) return;
      if (sourceById.has(id)) duplicateSourceIds.push(id);
      else sourceById.set(id, source);
    });
    receipts.forEach(function (receipt) {
      var id = clean(receipt && receipt.id);
      if (!id) return;
      if (receiptById.has(id)) duplicateReceiptIds.push(id);
      else receiptById.set(id, receipt);
    });

    var records = [];
    var recordKeys = new Set();

    function add(surfaceId, recordId, receiptIds, sourceIds, relationship) {
      var exactIds = uniqueSorted(receiptIds);
      var directSourceIds = uniqueSorted(sourceIds);
      var derivedSourceIds = uniqueSorted(
        exactIds.map(function (receiptId) {
          var receipt = receiptById.get(receiptId);
          return receipt && receipt.sourceId;
        })
      );
      var key = clean(surfaceId) + "|" + clean(recordId);
      if (!clean(recordId) || recordKeys.has(key)) return;
      recordKeys.add(key);
      records.push({
        surfaceId: clean(surfaceId),
        recordId: clean(recordId),
        relationship: clean(relationship || "registered dependency"),
        receiptIds: exactIds,
        sourceIds: uniqueSorted(directSourceIds.concat(derivedSourceIds)),
        directSourceIds: directSourceIds,
        receiptDerivedSourceIds: derivedSourceIds
      });
    }

    var receiptsByEntity = new Map();
    receipts.forEach(function (receipt) {
      array(receipt && receipt.entityIds).forEach(function (entityId) {
        var id = clean(entityId);
        if (!id) return;
        if (!receiptsByEntity.has(id)) receiptsByEntity.set(id, []);
        receiptsByEntity.get(id).push(receipt.id);
      });
      var sourceNode = "source:" + clean(receipt && receipt.sourceId);
      if (!receiptsByEntity.has(sourceNode)) receiptsByEntity.set(sourceNode, []);
      receiptsByEntity.get(sourceNode).push(receipt.id);
    });

    array(data.memoryGraph && data.memoryGraph.nodes).forEach(function (node) {
      var nodeId = clean(node && node.id);
      var sourceId = nodeId.indexOf("source:") === 0 ? nodeId.slice(7) : "";
      add(
        "memory-graph",
        "node:" + nodeId,
        receiptsByEntity.get(nodeId),
        sourceId ? [sourceId] : [],
        "node receipt count or source node"
      );
    });
    array(data.memoryGraph && data.memoryGraph.edges).forEach(function (edge) {
      var edgeSources = [edge && edge.from, edge && edge.to]
        .map(clean)
        .filter(function (id) {
          return id.indexOf("source:") === 0;
        })
        .map(function (id) {
          return id.slice(7);
        });
      add(
        "memory-graph",
        clean(edge && edge.id) || "edge:" + slug(clean(edge && edge.from) + "-" + clean(edge && edge.to)),
        edge && edge.receiptIds,
        edgeSources,
        "edge evidence"
      );
    });

    array(data.takeTimeMachines).forEach(function (timeline) {
      add(
        "take-time-machine",
        clean(timeline && timeline.id),
        array(timeline && timeline.receipts)
          .concat(array(timeline && timeline.positionBasis))
          .concat(
            array(timeline && timeline.milestones).map(function (item) {
              return item && item.receiptId;
            })
          )
          .concat(
            array(timeline && timeline.movements).flatMap(function (item) {
              return [item && item.beforeReceiptId, item && item.afterReceiptId];
            })
          ),
        array(timeline && timeline.milestones).map(function (item) {
          return item && item.sourceId;
        }),
        "timeline evidence"
      );
    });

    array(data.bitAncestry).forEach(function (lineage) {
      add(
        "bit-ancestry",
        clean(lineage && lineage.id),
        [
          lineage && lineage.origin && lineage.origin.receiptId,
          lineage && lineage.latestReceiptId
        ]
          .concat(array(lineage && lineage.callbacks))
          .concat(
            array(lineage && lineage.performances).map(function (item) {
              return item && item.receiptId;
            })
          ),
        array(lineage && lineage.sourceIds).concat([
          lineage && lineage.origin && lineage.origin.sourceId
        ]),
        "lineage origin or callback"
      );
    });

    array(data.riffChemistry && data.riffChemistry.moments).forEach(function (moment) {
      add(
        "riff-chemistry",
        "moment:" + clean(moment && moment.receiptId),
        [moment && moment.receiptId],
        [moment && moment.sourceId],
        "chemistry moment"
      );
    });
    array(data.riffChemistry && data.riffChemistry.sourceProfiles).forEach(
      function (profile) {
        add(
          "riff-chemistry",
          "profile:" + clean(profile && profile.sourceId),
          [profile && profile.topReceiptId],
          [profile && profile.sourceId],
          "source chemistry profile"
        );
      }
    );
    array(data.riffChemistry && data.riffChemistry.rankings).forEach(function (ranking) {
      add(
        "riff-chemistry",
        "ranking:" + clean(ranking && ranking.sourceId),
        [ranking && ranking.peak && ranking.peak.receiptId],
        [
          ranking && ranking.sourceId,
          ranking && ranking.peak && ranking.peak.sourceId
        ],
        "source chemistry ranking"
      );
    });

    array(data.personalizedDescent && data.personalizedDescent.routes).forEach(
      function (preset) {
        var route = (preset && preset.route) || {};
        add(
          "personalized-descent",
          clean(preset && preset.id) || clean(route.id),
          array(route.receiptIds).concat(
            array(route.stops).map(function (item) {
              return item && item.receiptId;
            })
          ),
          array(route.stops).map(function (item) {
            return item && item.sourceId;
          }),
          "preset route"
        );
      }
    );

    array(data.courtCandidates).forEach(function (court) {
      add(
        "courts",
        clean(court && court.id),
        array(court && court.prosecutionReceiptIds)
          .concat(array(court && court.defenseReceiptIds))
          .concat(
            array(court && court.prosecution).map(function (item) {
              return item && item.receiptId;
            })
          )
          .concat(
            array(court && court.defense).map(function (item) {
              return item && item.receiptId;
            })
          )
          .concat(
            array(court && court.chronology).flatMap(function (item) {
              return [
                item && item.before && item.before.receiptId,
                item && item.after && item.after.receiptId
              ];
            })
          ),
        array(court && court.prosecution)
          .concat(array(court && court.defense))
          .flatMap(function (item) {
            return [item && item.sourceId, item && item.id];
          }),
        "argument-board evidence"
      );
    });

    array(data.liveAftermath).forEach(function (aftermath) {
      add(
        "live-aftermath",
        clean(aftermath && aftermath.id),
        [
          aftermath && aftermath.funniestReceiptId,
          aftermath && aftermath.strongestTopicReceiptId
        ]
          .concat(array(aftermath && aftermath.clipCandidateReceiptIds))
          .concat([
            aftermath && aftermath.funniest && aftermath.funniest.receiptId,
            aftermath &&
              aftermath.strongestTopic &&
              aftermath.strongestTopic.receiptId
          ]),
        [
          aftermath && aftermath.sourceId,
          aftermath && aftermath.funniest && aftermath.funniest.sourceId,
          aftermath &&
            aftermath.strongestTopic &&
            aftermath.strongestTopic.sourceId
        ],
        "stream aftermath summary"
      );
    });

    array(data.characterReadiness).forEach(function (character) {
      add(
        "character-readiness",
        clean(character && character.characterId),
        array(character && character.receiptIds).concat(
          array(character && character.verifiedReceiptIds)
        ),
        [],
        "readiness threshold evidence"
      );
    });

    var control = data.creatorControlRoom || {};
    array(control.queue).forEach(function (item) {
      add(
        "creator-control-room",
        "queue:" + clean(item && item.id),
        array(item && item.receiptIds).concat(
          array(item && item.evidence).map(function (evidence) {
            return evidence && evidence.receiptId;
          })
        ),
        [item && item.sourceId].concat(
          array(item && item.evidence).map(function (evidence) {
            return evidence && evidence.sourceId;
          })
        ),
        "review queue"
      );
    });
    array(control.contentOpportunities).forEach(function (item, index) {
      add(
        "creator-control-room",
        "opportunity:" + (clean(item && item.receiptId) || String(index + 1)),
        [item && item.receiptId],
        [item && item.sourceId],
        "content opportunity"
      );
    });
    array(control.archiveResurfaced).forEach(function (item, index) {
      add(
        "creator-control-room",
        "resurfaced:" + (clean(item && item.receiptId) || String(index + 1)),
        [item && item.receiptId],
        [item && item.sourceId],
        "archive resurfacing"
      );
    });

    records.sort(function (a, b) {
      return (
        surfaceOrder(a.surfaceId) - surfaceOrder(b.surfaceId) ||
        a.recordId.localeCompare(b.recordId)
      );
    });

    return {
      sourceById: sourceById,
      receiptById: receiptById,
      records: records,
      duplicateSourceIds: uniqueSorted(duplicateSourceIds),
      duplicateReceiptIds: uniqueSorted(duplicateReceiptIds)
    };
  }

  function create(config) {
    var input = config || {};
    var showcase = input.showcase || input;
    var registered = registry(showcase);
    var snapshotDate = clean(showcase && showcase.snapshotDate);
    var inputFingerprint = clean(showcase && showcase.inputFingerprint);

    function blockedReport(candidateId, target, scope, errors) {
      var stableErrors = array(errors)
        .map(function (error) {
          return {
            code: clean(error && error.code),
            receiptId: clean(error && error.receiptId),
            sourceId: clean(error && error.sourceId),
            message: clean(error && error.message)
          };
        })
        .sort(function (a, b) {
          return (
            a.code.localeCompare(b.code) ||
            a.receiptId.localeCompare(b.receiptId) ||
            a.sourceId.localeCompare(b.sourceId)
          );
        });
      var report = {
        schema: SCHEMA,
        engineVersion: VERSION,
        mode: "DRY_RUN",
        status: "BLOCKED_UNRESOLVED_EVIDENCE",
        analysisComplete: false,
        candidateId: clean(candidateId),
        snapshotDate: snapshotDate,
        inputFingerprint: inputFingerprint,
        target: target || {},
        scope: scope,
        errors: stableErrors,
        dependencies: {
          exactReceipt: [],
          sourceOnly: []
        },
        surfaceSummary: SURFACES.map(function (surface) {
          return {
            id: surface.id,
            label: surface.label,
            status: "NOT_EVALUATED",
            exactReceiptRecords: 0,
            sourceOnlyRecords: 0
          };
        }),
        totals: {
          resolvedReceipts: array(scope && scope.resolvedReceipts).length,
          resolvedSources: array(scope && scope.resolvedSources).length,
          exactReceiptRecords: 0,
          sourceOnlyRecords: 0,
          affectedSurfaces: 0
        },
        excludedSurfaces: NON_REGISTERED,
        mutationPolicy: {
          canonMutation: "NONE",
          askEffectClaim: "NONE",
          clipLabEffectClaim: "NONE",
          reason:
            "A dry-run report never mutates canon. Unresolved evidence blocks partial downstream claims."
        }
      };
      report.reportFingerprint = fingerprint(JSON.stringify(report));
      return report;
    }

    function analyze(request) {
      var item = request || {};
      var target = item.target || {};
      var evidence = array(item.evidence);
      var requestedReceiptIds = [];
      var requestedSourceIds = [];
      var errors = [];

      evidence.forEach(function (entry, index) {
        var receiptId = clean(entry && entry.receiptId);
        var sourceId = clean(entry && entry.sourceId);
        if (!receiptId && !sourceId) {
          errors.push({
            code: "EVIDENCE_REFERENCE_MISSING",
            message:
              "Evidence item " +
              String(index + 1) +
              " has neither a receiptId nor a sourceId."
          });
          return;
        }
        if (receiptId) requestedReceiptIds.push(receiptId);
        if (sourceId) requestedSourceIds.push(sourceId);
      });

      var targetType = clean(target.type).toLowerCase();
      var targetId = clean(target.id);
      var targetSourceId = clean(target.sourceId);
      if (targetType === "receipt" && targetId) requestedReceiptIds.push(targetId);
      if (targetSourceId) requestedSourceIds.push(targetSourceId);
      if (targetType === "source" && targetId) requestedSourceIds.push(targetId);

      requestedReceiptIds = uniqueSorted(requestedReceiptIds);
      requestedSourceIds = uniqueSorted(requestedSourceIds);

      var resolvedReceipts = [];
      requestedReceiptIds.forEach(function (receiptId) {
        var receipt = registered.receiptById.get(receiptId);
        if (!receipt) {
          errors.push({
            code: "RECEIPT_UNRESOLVED",
            receiptId: receiptId,
            message: "The requested receipt does not exist in the registered showcase."
          });
          return;
        }
        var receiptSourceId = clean(receipt.sourceId);
        resolvedReceipts.push({
          id: receiptId,
          sourceId: receiptSourceId
        });
        if (receiptSourceId) requestedSourceIds.push(receiptSourceId);
      });
      requestedSourceIds = uniqueSorted(requestedSourceIds);

      evidence.forEach(function (entry) {
        var receiptId = clean(entry && entry.receiptId);
        var assertedSourceId = clean(entry && entry.sourceId);
        if (!receiptId || !assertedSourceId) return;
        var receipt = registered.receiptById.get(receiptId);
        if (receipt && clean(receipt.sourceId) !== assertedSourceId) {
          errors.push({
            code: "RECEIPT_SOURCE_MISMATCH",
            receiptId: receiptId,
            sourceId: assertedSourceId,
            message:
              "The evidence sourceId does not match the registered receipt source."
          });
        }
      });

      var resolvedSources = [];
      requestedSourceIds.forEach(function (sourceId) {
        var source = registered.sourceById.get(sourceId);
        if (!source) {
          errors.push({
            code: "SOURCE_UNRESOLVED",
            sourceId: sourceId,
            message: "The requested source does not exist in the registered showcase."
          });
          return;
        }
        resolvedSources.push({
          id: sourceId,
          title: clean(source.title)
        });
      });

      registered.duplicateReceiptIds.forEach(function (receiptId) {
        if (requestedReceiptIds.indexOf(receiptId) >= 0) {
          errors.push({
            code: "RECEIPT_REGISTRY_AMBIGUOUS",
            receiptId: receiptId,
            message: "The requested receipt ID is duplicated in the showcase registry."
          });
        }
      });
      registered.duplicateSourceIds.forEach(function (sourceId) {
        if (requestedSourceIds.indexOf(sourceId) >= 0) {
          errors.push({
            code: "SOURCE_REGISTRY_AMBIGUOUS",
            sourceId: sourceId,
            message: "The requested source ID is duplicated in the showcase registry."
          });
        }
      });
      if (!requestedReceiptIds.length && !requestedSourceIds.length) {
        errors.push({
          code: "NO_RESOLVABLE_EVIDENCE_SCOPE",
          message:
            "The packet contains no registered receipt or source reference to analyze."
        });
      }

      var scope = {
        requestedReceiptIds: requestedReceiptIds,
        requestedSourceIds: requestedSourceIds,
        resolvedReceipts: resolvedReceipts.sort(function (a, b) {
          return a.id.localeCompare(b.id);
        }),
        resolvedSources: resolvedSources.sort(function (a, b) {
          return a.id.localeCompare(b.id);
        }),
        resolutionMode: resolvedReceipts.length
          ? "EXACT_RECEIPT"
          : resolvedSources.length
            ? "SOURCE_ONLY"
            : "UNRESOLVED"
      };
      if (errors.length) {
        return blockedReport(item.candidateId, target, scope, errors);
      }

      var receiptSet = new Set(
        resolvedReceipts.map(function (receipt) {
          return receipt.id;
        })
      );
      var sourceSet = new Set(
        resolvedSources.map(function (source) {
          return source.id;
        })
      );
      var exactHits = [];
      var sourceOnlyHits = [];

      registered.records.forEach(function (record) {
        var matchedReceiptIds = intersect(record.receiptIds, receiptSet);
        var matchedSourceIds = intersect(record.sourceIds, sourceSet);
        if (matchedReceiptIds.length) {
          exactHits.push({
            surfaceId: record.surfaceId,
            recordId: record.recordId,
            relationship: record.relationship,
            matchedReceiptIds: matchedReceiptIds,
            matchedSourceIds: matchedSourceIds,
            dependency: "EXACT_RECEIPT"
          });
          return;
        }
        if (matchedSourceIds.length) {
          sourceOnlyHits.push({
            surfaceId: record.surfaceId,
            recordId: record.recordId,
            relationship: record.relationship,
            matchedReceiptIds: [],
            matchedSourceIds: matchedSourceIds,
            dependency: "SOURCE_ONLY"
          });
        }
      });
      sortHits(exactHits);
      sortHits(sourceOnlyHits);

      var surfaceSummary = SURFACES.map(function (surface) {
        var exactCount = exactHits.filter(function (hit) {
          return hit.surfaceId === surface.id;
        }).length;
        var sourceOnlyCount = sourceOnlyHits.filter(function (hit) {
          return hit.surfaceId === surface.id;
        }).length;
        return {
          id: surface.id,
          label: surface.label,
          status:
            exactCount > 0
              ? "EXACT_RECEIPT_DEPENDENCY"
              : sourceOnlyCount > 0
                ? "SOURCE_ONLY_DEPENDENCY"
                : "NO_REGISTERED_DEPENDENCY",
          exactReceiptRecords: exactCount,
          sourceOnlyRecords: sourceOnlyCount
        };
      });
      var affectedSurfaces = surfaceSummary.filter(function (surface) {
        return (
          surface.exactReceiptRecords > 0 || surface.sourceOnlyRecords > 0
        );
      }).length;
      var report = {
        schema: SCHEMA,
        engineVersion: VERSION,
        mode: "DRY_RUN",
        status: "READY",
        analysisComplete: true,
        candidateId: clean(item.candidateId),
        snapshotDate: snapshotDate,
        inputFingerprint: inputFingerprint,
        target: target,
        scope: scope,
        errors: [],
        dependencies: {
          exactReceipt: exactHits,
          sourceOnly: sourceOnlyHits
        },
        surfaceSummary: surfaceSummary,
        totals: {
          resolvedReceipts: resolvedReceipts.length,
          resolvedSources: resolvedSources.length,
          exactReceiptRecords: exactHits.length,
          sourceOnlyRecords: sourceOnlyHits.length,
          affectedSurfaces: affectedSurfaces
        },
        excludedSurfaces: NON_REGISTERED,
        mutationPolicy: {
          canonMutation: "NONE",
          askEffectClaim: "NONE",
          clipLabEffectClaim: "NONE",
          reason:
            "This is a deterministic dependency dry run. Canon, Ask, and Clip Lab remain unchanged."
        }
      };
      report.reportFingerprint = fingerprint(JSON.stringify(report));
      return report;
    }

    return {
      engine: "WWAM CORRECTION RIPPLE",
      version: VERSION,
      schema: SCHEMA,
      snapshotDate: snapshotDate,
      inputFingerprint: inputFingerprint,
      registeredSurfaces: SURFACES,
      registeredRecords: registered.records.length,
      registryHealth: {
        sources: registered.sourceById.size,
        receipts: registered.receiptById.size,
        duplicateSourceIds: registered.duplicateSourceIds,
        duplicateReceiptIds: registered.duplicateReceiptIds
      },
      analyze: analyze
    };
  }

  root.WWAMCorrectionRippleEngine = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    SURFACES: SURFACES,
    NON_REGISTERED: NON_REGISTERED,
    create: create
  });
})(typeof window !== "undefined" ? window : globalThis);
