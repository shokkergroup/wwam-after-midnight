(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker.creator-workflow-brief/v1";
  var DRAFT_STATUS = "DRAFT / HUMAN APPROVAL REQUIRED";
  var MEASUREMENT_STATUS = "MEASURE DURING REVIEW";

  var GOALS = [
    {
      id: "archive-discovery",
      label: "ARCHIVE DISCOVERY",
      question: "Can a fan reach the right source moment without knowing which upload contains it?",
      promise:
        "Turn source-linked archive evidence into fast, honest paths from a fan question to the full context.",
      deliverables: [
        {
          id: "discovery-route",
          label: "Source-linked discovery route",
          description:
            "A focused question-to-receipt path that either resolves to playable source context or says the indexed archive is insufficient.",
          acceptanceCheck:
            "Every surfaced answer resolves to an indexed source and timestamp, or displays an explicit insufficient-evidence state."
        },
        {
          id: "archive-callback",
          label: "Archive callback trail",
          description:
            "A compact trail from a current topic to an older indexed receipt without claiming a first-ever origin.",
          acceptanceCheck:
            "Each callback carries its receipt ledger and uses earliest-in-indexed-archive wording where origin is unknown."
        },
        {
          id: "query-review",
          label: "Failed-query review",
          description:
            "A human-readable list of questions the archive could not answer cleanly.",
          acceptanceCheck:
            "Reviewers can separate missing coverage, alias issues, and ambiguous intent without silently fabricating an answer."
        }
      ],
      instruments: [
        "Record whether each review question produced a source-linked answer, an honest hold, or an irrelevant result.",
        "Record source-open actions only after review analytics are intentionally enabled.",
        "Human-review a fixed question set before and after each retrieval change."
      ]
    },
    {
      id: "compilation-workflow",
      label: "COMPILATION WORKFLOW",
      question: "Can the archive reduce the hunt for a compilation while preserving editorial judgment?",
      promise:
        "Package source-ledgered edit candidates, cold-open structures, and review holds into a repeatable creator workflow.",
      deliverables: [
        {
          id: "edit-candidate-board",
          label: "Edit candidate board",
          description:
            "A bounded set of timestamped candidates with risk, evidence, and context-review states.",
          acceptanceCheck:
            "Every candidate retains its source, timestamp, receipt ID, proposed edit boundary, and unresolved review state."
        },
        {
          id: "cold-open-packet",
          label: "Cold-open decision packet",
          description:
            "A deterministic storyboard packet assembled from source clips and clearly labeled editorial cards.",
          acceptanceCheck:
            "No generated host voice, guessed speaker, downloaded media, or unlabeled archival excerpt is introduced."
        },
        {
          id: "approval-ledger",
          label: "Human approval ledger",
          description:
            "A review queue that distinguishes ready-for-context-review, hold, reject, and creator-decision items.",
          acceptanceCheck:
            "No item advances to publish language without a named reviewer decision and preserved evidence ledger."
        }
      ],
      instruments: [
        "Count candidates reviewed, held, rejected, and advanced during the review.",
        "Count packets whose source and receipt ledgers remain complete after export and re-import.",
        "Record unresolved-context items; do not translate this count into claimed hours saved."
      ]
    },
    {
      id: "fan-member-experience",
      label: "FAN + MEMBER EXPERIENCE",
      question: "Will fans return because the archive gives them a different, source-grounded journey each visit?",
      promise:
        "Combine daily archive journeys, playable receipts, trivia, and deep-cut trails without turning inference into canon.",
      deliverables: [
        {
          id: "return-journey",
          label: "Seeded return journey",
          description:
            "A repeatable daily path through a recent source, an archive callback, a playable receipt, and a closing payoff.",
          acceptanceCheck:
            "The same date and mode reproduce the same route; a new seed changes the route without losing provenance."
        },
        {
          id: "deep-cut-trail",
          label: "Deep-cut trail",
          description:
            "A fan-facing path through field-guide entries and related receipts with rarity explicitly scoped to the indexed archive.",
          acceptanceCheck:
            "Every jump preserves the source link and never advertises machine-ranked rarity as objective quality."
        },
        {
          id: "member-feedback-loop",
          label: "Member memory prompt",
          description:
            "A correction/contribution route for fans who remember missing context.",
          acceptanceCheck:
            "Submissions remain proposed memory until an authorized human reviews the supplied source evidence."
        }
      ],
      instruments: [
        "If analytics are enabled, record completed journeys, source opens, and voluntary return sessions.",
        "Ask showcase viewers which route felt useful and which result needed more context.",
        "Keep engagement observations descriptive until the review produces enough sessions for an agreed evaluation."
      ]
    },
    {
      id: "recurring-lore-system",
      label: "RECURRING LORE SYSTEM",
      question: "Can recurring characters, bits, and callbacks become navigable without inventing canon?",
      promise:
        "Build a living lore layer whose claims can be reviewed, corrected, and traced back to source receipts.",
      deliverables: [
        {
          id: "lore-dossier",
          label: "Receipt-backed lore dossier",
          description:
            "A field-guide view for recurring bits, characters, motifs, topics, and source relationships.",
          acceptanceCheck:
            "Each claim type displays its evidence boundary and preserves the exact source trail."
        },
        {
          id: "origin-firewall",
          label: "Origin firewall",
          description:
            "A hard distinction between earliest indexed evidence and creator-certified origin.",
          acceptanceCheck:
            "No first-ever or true-origin language appears without an authorized creator decision."
        },
        {
          id: "canon-review-cycle",
          label: "Canon review cycle",
          description:
            "A queue for wording checks, context holds, rejection candidates, and creator review.",
          acceptanceCheck:
            "Indexed candidates cannot self-certify or silently mutate the public canon."
        }
      ],
      instruments: [
        "Count claims reviewed, held, rejected, and creator-certified during the review.",
        "Audit every promoted claim for a complete receipt trail and authorized decision.",
        "Record corrections as versioned editorial decisions rather than erasing the earlier state."
      ]
    }
  ];

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function clean(value) {
    return text(value).replace(/\s+/g, " ").trim();
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function unique(values) {
    return Array.from(new Set(array(values).map(clean).filter(Boolean)));
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce(function (output, key) {
          if (typeof value[key] !== "function" && value[key] !== undefined) {
            output[key] = stableValue(value[key]);
          }
          return output;
        }, {});
    }
    return value;
  }

  function stableJson(value) {
    return JSON.stringify(stableValue(value));
  }

  function fingerprint(value) {
    var source = typeof value === "string" ? value : stableJson(value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function metricSnapshot(input) {
    return {
      archive: {
        sources: number(input.showcase.metrics.sources),
        commentarySources: number(input.showcase.metrics.commentaries),
        livestreamSources: number(input.showcase.metrics.livestreams),
        popularLivestreams: number(input.showcase.metrics.popularLivestreams),
        receipts: number(input.showcase.metrics.receipts),
        wordsAudited: number(input.showcase.metrics.wordsAudited)
      },
      memory: {
        graphNodes: number(input.showcase.metrics.graphNodes),
        graphEdges: number(input.showcase.metrics.graphEdges),
        timelines: number(input.showcase.metrics.timelines),
        bitLineages: number(input.showcase.metrics.bitLineages),
        courtCases: number(input.showcase.metrics.courtCases)
      },
      lore: {
        fieldGuideEntries: number(input.lore.metrics.fieldGuideEntries),
        playableReceipts: number(input.lore.metrics.playableReceipts),
        constellations: number(input.lore.metrics.constellations),
        lineages: number(input.lore.metrics.lineages)
      },
      creator: {
        shortCandidates: number(input.clipLab.metrics.shortCandidates),
        supercutBundles: number(input.clipLab.metrics.supercutBundles),
        coldOpenStoryboards: number(input.coldOpen.metrics.storyboards),
        heldClipCandidates: number(input.clipLab.metrics.holds)
      },
      trust: {
        healthySources: number(input.trust.metrics.healthySources),
        limitedSources: number(input.trust.metrics.limitedSources),
        reviewCandidates: number(input.trust.metrics.reviewCandidates),
        creatorCertifiedReceipts: number(input.trust.metrics.creatorReceipts),
        canonEligibleTimelines: number(input.trust.metrics.canonEligibleTimelines),
        canonEligibleCourts: number(input.trust.metrics.canonEligibleCourts)
      }
    };
  }

  function assertMetricGroup(engineName, engine, required) {
    if (!engine || typeof engine !== "object") {
      throw new TypeError("Creator Workflow Builder requires " + engineName + ".");
    }
    var metrics = object(engine.metrics);
    required.forEach(function (name) {
      if (!Number.isFinite(Number(metrics[name])) || Number(metrics[name]) < 0) {
        throw new TypeError(
          "Creator Workflow Builder requires " +
            engineName +
            ".metrics." +
            name +
            " as a non-negative number."
        );
      }
    });
  }

  function normalizeInput(config) {
    var input = config || {};
    var normalized = {
      showcase: input.showcase,
      lore: input.lore,
      clipLab: input.clipLab || input.clip,
      coldOpen: input.coldOpen,
      trust: input.trust,
      integrityReport: input.integrityReport || null,
      asOf: clean(input.asOf)
    };
    assertMetricGroup("showcase", normalized.showcase, [
      "sources",
      "commentaries",
      "livestreams",
      "popularLivestreams",
      "receipts",
      "wordsAudited",
      "graphNodes",
      "graphEdges",
      "timelines",
      "bitLineages",
      "courtCases"
    ]);
    assertMetricGroup("lore", normalized.lore, [
      "fieldGuideEntries",
      "playableReceipts",
      "constellations",
      "lineages"
    ]);
    assertMetricGroup("clipLab", normalized.clipLab, [
      "shortCandidates",
      "supercutBundles",
      "holds"
    ]);
    assertMetricGroup("coldOpen", normalized.coldOpen, ["storyboards"]);
    assertMetricGroup("trust", normalized.trust, [
      "healthySources",
      "limitedSources",
      "reviewCandidates",
      "creatorReceipts",
      "canonEligibleTimelines",
      "canonEligibleCourts"
    ]);
    if (!array(normalized.showcase.sources).length) {
      throw new TypeError("Creator Workflow Builder requires indexed showcase sources.");
    }
    if (!array(normalized.showcase.receipts).length) {
      throw new TypeError("Creator Workflow Builder requires timestamped showcase receipts.");
    }
    if (
      normalized.integrityReport &&
      (normalized.integrityReport.ok !== true ||
        clean(normalized.integrityReport.status) !== "PASS")
    ) {
      var error = new Error(
        "Creator Workflow Builder stopped because the supplied Canon Integrity report did not pass."
      );
      error.name = "WorkflowIntegrityError";
      error.report = normalized.integrityReport;
      throw error;
    }
    return normalized;
  }

  function goalById(goalId) {
    var id = clean(goalId);
    return (
      GOALS.find(function (goal) {
        return goal.id === id;
      }) || null
    );
  }

  function sourceMaps(showcase) {
    var sources = new Map();
    array(showcase.sources).forEach(function (source) {
      if (source && clean(source.id)) sources.set(clean(source.id), source);
    });
    var receipts = new Map();
    array(showcase.receipts).forEach(function (receipt) {
      if (receipt && clean(receipt.id)) receipts.set(clean(receipt.id), receipt);
    });
    return { sources: sources, receipts: receipts };
  }

  function receiptUrl(receipt, source) {
    var direct = clean(receipt && receipt.url);
    if (direct) return direct;
    var base = clean(source && source.url);
    var at = Math.max(0, Math.floor(number(receipt && receipt.t)));
    if (!base) return "";
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + "t=" + at + "s";
  }

  function sampleProof(input, goalId) {
    var maps = sourceMaps(input.showcase);
    var candidates = [];

    if (goalId === "compilation-workflow") {
      candidates = array(input.clipLab.shorts)
        .filter(function (item) {
          return clean(item.receiptId) && clean(item.sourceId);
        })
        .map(function (item) {
          return {
            receiptId: clean(item.receiptId),
            sourceId: clean(item.sourceId),
            reason: "Timestamped edit candidate"
          };
        });
    } else if (goalId === "recurring-lore-system") {
      array(input.lore.lineages).forEach(function (lineage) {
        array(lineage.receiptIds || lineage.receipts).slice(0, 2).forEach(function (item) {
          candidates.push({
            receiptId: clean(typeof item === "string" ? item : item && item.id),
            sourceId: clean(item && item.sourceId),
            reason: "Indexed lore-lineage receipt"
          });
        });
      });
    } else if (goalId === "fan-member-experience") {
      array(input.showcase.takeTimeMachines).forEach(function (timeline) {
        array(timeline.receipts).slice(-1).forEach(function (receiptId) {
          candidates.push({
            receiptId: clean(receiptId),
            sourceId: "",
            reason: "Playable archive callback"
          });
        });
      });
    } else {
      array(input.showcase.takeTimeMachines).forEach(function (timeline) {
        array(timeline.receipts).slice(0, 1).forEach(function (receiptId) {
          candidates.push({
            receiptId: clean(receiptId),
            sourceId: "",
            reason: "Source-linked discovery receipt"
          });
        });
      });
    }

    if (!candidates.length) {
      candidates = array(input.showcase.receipts).map(function (receipt) {
        return {
          receiptId: clean(receipt.id),
          sourceId: clean(receipt.sourceId),
          reason: "Fallback indexed archive receipt"
        };
      });
    }

    var seen = new Set();
    return candidates
      .sort(function (a, b) {
        return (
          clean(a.sourceId).localeCompare(clean(b.sourceId)) ||
          clean(a.receiptId).localeCompare(clean(b.receiptId))
        );
      })
      .map(function (candidate) {
        var receipt = maps.receipts.get(candidate.receiptId);
        if (!receipt) return null;
        var sourceId = clean(candidate.sourceId || receipt.sourceId);
        var source = maps.sources.get(sourceId);
        if (!source || !sourceId || seen.has(candidate.receiptId)) return null;
        seen.add(candidate.receiptId);
        return {
          receiptId: candidate.receiptId,
          sourceId: sourceId,
          sourceTitle: clean(source.title),
          sourceDate: clean(source.date),
          at: number(receipt.t),
          url: receiptUrl(receipt, source),
          evidenceLevel: clean(receipt.evidenceLevel || "machine"),
          reason: candidate.reason,
          boundary:
            "Proof of indexed coverage only; context and wording still require human review."
        };
      })
      .filter(Boolean)
      .slice(0, 6);
  }

  function archiveSpan(showcase) {
    var dates = array(showcase.sources)
      .map(function (source) {
        return clean(source.date);
      })
      .filter(Boolean)
      .sort();
    return {
      earliestIndexedDate: dates[0] || "undated",
      latestIndexedDate: dates[dates.length - 1] || "undated",
      wording:
        "This span describes the indexed snapshot, not the channel's complete publishing history."
    };
  }

  function goalProofSummary(goalId, metrics) {
    if (goalId === "archive-discovery") {
      return [
        metrics.archive.sources + " promoted-corpus indexed sources",
        metrics.archive.receipts + " timestamped receipts",
        metrics.memory.timelines + " candidate take timelines",
        metrics.lore.playableReceipts + " lore-layer playable receipts"
      ];
    }
    if (goalId === "compilation-workflow") {
      return [
        metrics.creator.shortCandidates + " source-ledgered short candidates",
        metrics.creator.supercutBundles + " supercut bundles",
        metrics.creator.coldOpenStoryboards + " cold-open storyboards",
        metrics.creator.heldClipCandidates + " candidates held by current risk rules"
      ];
    }
    if (goalId === "fan-member-experience") {
      return [
        metrics.lore.fieldGuideEntries + " field-guide entries",
        metrics.lore.constellations + " lore constellations",
        metrics.memory.timelines + " archive callback trails",
        metrics.archive.sources + " indexed sources available for return journeys"
      ];
    }
    return [
      metrics.lore.lineages + " indexed lore lineages",
      metrics.memory.bitLineages + " showcase bit lineages",
      metrics.trust.reviewCandidates + " unresolved trust-review candidates",
      metrics.trust.creatorCertifiedReceipts + " creator-certified receipts in this snapshot"
    ];
  }

  function workflow(goal) {
    return [
      {
        order: 1,
        stage: "SCOPE",
        owner: "CREATOR + EDITOR",
        decision:
          "Choose one audience promise, source lane, and intentionally small evaluation set.",
        gate: "No work begins until the creator agrees that the chosen goal matters."
      },
      {
        order: 2,
        stage: "ASSEMBLE",
        owner: "WIKI SYSTEM",
        decision:
          "Generate source-linked candidates and preserve the receipt ledger for every surfaced item.",
        gate: "Missing provenance becomes a hold, not a best guess."
      },
      {
        order: 3,
        stage: "REVIEW",
        owner: "HUMAN EDITOR",
        decision:
          "Check surrounding context, wording, speaker attribution, and the exact acceptance checks.",
        gate: "Indexed output cannot approve itself."
      },
      {
        order: 4,
        stage: "TRY",
        owner: "AUTHORIZED OPERATOR",
        decision:
          "Run the bounded review and record only the observations named in the measurement plan.",
        gate: "Rights, platform, and brand decisions stay with the creator."
      },
      {
        order: 5,
        stage: "DECIDE",
        owner: "CREATOR",
        decision:
          "Continue, revise, or stop based on reviewed evidence and qualitative creator judgment.",
        gate:
          "The builder recommends no publishing or canon promotion on its own."
      }
    ].map(function (step) {
      return Object.assign({ goalId: goal.id }, step);
    });
  }

  function measurementPlan(goal) {
    return {
      status: MEASUREMENT_STATUS,
      baseline: "NOT YET OBSERVED",
      observedResults: [],
      instruments: goal.instruments.slice(),
      evaluationRule:
        "The creator chooses the sample, observation window, and acceptable result before interpreting review observations.",
      claimsBoundary:
        "This static workbench contains no verified workflow, labor-savings, or audience-impact result."
    };
  }

  function buildBrief(builder, goalId, options) {
    var goal = goalById(goalId);
    if (!goal) {
      throw new RangeError(
        "Unknown Creator Workflow goal: " +
          clean(goalId) +
          ". Expected one of: " +
          GOALS.map(function (item) {
            return item.id;
          }).join(", ") +
          "."
      );
    }
    var request = options || {};
    var title =
      clean(request.title) || "WWAM After Midnight / " + goal.label + " Workflow";
    var proof = sampleProof(builder._input, goal.id);
    var brief = {
      schema: SCHEMA,
      engineVersion: VERSION,
      briefId:
        "workflow:" +
        goal.id +
        ":" +
        fingerprint([builder.inputFingerprint, goal.id, title].join("|")),
      title: title,
      status: DRAFT_STATUS,
      creatorDecisionState: "NOT REVIEWED",
      snapshotDate: builder.snapshotDate,
      goal: clone(goal),
      summary:
        goal.promise +
        " This workflow is deliberately bounded so the creator can judge it with source evidence before expanding it.",
      currentProof: {
        label: "CURRENT PROMOTED-CORPUS SNAPSHOT / NOT A PERFORMANCE CLAIM",
        summary: goalProofSummary(goal.id, builder.metrics),
        sampleReceipts: proof
      },
      reviewScope: {
        sourceLane: clean(request.sourceLane) || "CREATOR-SELECTED REVIEW LANE",
        sourceLimit:
          number(request.sourceLimit) > 0
            ? Math.floor(number(request.sourceLimit))
            : "CHOOSE WITH CREATOR",
        archiveSpan: archiveSpan(builder._input.showcase),
        exclusions: [
          "No media files are copied or bundled by this brief.",
          "No rights clearance, platform approval, or brand-safety approval is implied.",
          "No guessed speaker, true-origin claim, or unlabeled archival quote is permitted.",
          "No creator endorsement, publishing authority, or canon promotion is recorded."
        ]
      },
      deliverables: goal.deliverables.map(function (deliverable) {
        return Object.assign({}, deliverable, {
          reviewOwner: "HUMAN EDITOR",
          approvalState: "NOT REVIEWED"
        });
      }),
      workflow: workflow(goal),
      measurementPlan: measurementPlan(goal),
      humanDecisionsRequired: [
        "Confirm the workflow goal and source lane.",
        "Name the authorized context reviewer and creator decision-maker.",
        "Approve the evaluation set and observation window.",
        "Resolve every rights, attribution, and brand-safety question before publication.",
        "Choose continue, revise, or stop after reviewing workflow evidence."
      ],
      prototypeBoundary:
        "This editorial workbench records no creator approval, publishing authority, rights clearance, or performance claim.",
      proofLedger: {
        inputFingerprint: builder.inputFingerprint,
        engineFingerprints: clone(builder.engineFingerprints),
        integrityStatus: builder.integrity.status,
        integrityFingerprint: builder.integrity.fingerprint,
        metricSnapshot: clone(builder.metrics),
        receiptIds: proof.map(function (item) {
          return item.receiptId;
        }),
        sourceIds: unique(
          proof.map(function (item) {
            return item.sourceId;
          })
        ),
        policy:
          "Counts describe this deterministic indexed snapshot. Sample receipts prove coverage, not truth beyond their source context."
      }
    };
    brief.fingerprint = fingerprint(brief);
    return brief;
  }

  function markdownEscape(value) {
    return clean(value).replace(/\|/g, "\\|");
  }

  function exportMarkdown(brief) {
    if (!brief || brief.schema !== SCHEMA) {
      throw new TypeError("exportMarkdown requires a Creator Workflow brief.");
    }
    var lines = [
      "# " + clean(brief.title),
      "",
      "**Status:** " + clean(brief.status),
      "",
      "**Snapshot:** " + clean(brief.snapshotDate),
      "",
      "## Workflow purpose",
      "",
      clean(brief.summary),
      "",
      "## What the current index can prove",
      ""
    ];
    array(brief.currentProof && brief.currentProof.summary).forEach(function (item) {
      lines.push("- " + clean(item));
    });
    lines.push("", "These are snapshot counts, not verified performance results.", "");
    lines.push("## Deliverables", "");
    array(brief.deliverables).forEach(function (item) {
      lines.push(
        "### " + clean(item.label),
        "",
        clean(item.description),
        "",
        "- Acceptance: " + clean(item.acceptanceCheck),
        "- Approval: " + clean(item.approvalState),
        ""
      );
    });
    lines.push("## Review workflow", "");
    array(brief.workflow).forEach(function (step) {
      lines.push(
        step.order +
          ". **" +
          markdownEscape(step.stage) +
          " / " +
          markdownEscape(step.owner) +
          ":** " +
          clean(step.decision) +
          " Gate: " +
          clean(step.gate)
      );
    });
    lines.push(
      "",
      "## Measurement",
      "",
      "**Status:** " + clean(brief.measurementPlan && brief.measurementPlan.status),
      "",
      clean(brief.measurementPlan && brief.measurementPlan.claimsBoundary),
      ""
    );
    array(brief.measurementPlan && brief.measurementPlan.instruments).forEach(function (item) {
      lines.push("- " + clean(item));
    });
    lines.push("", "## Human decisions still required", "");
    array(brief.humanDecisionsRequired).forEach(function (item) {
      lines.push("- " + clean(item));
    });
    lines.push("", "## Proof ledger", "");
    lines.push(
      "- Brief fingerprint: `" + clean(brief.fingerprint) + "`",
      "- Input fingerprint: `" +
        clean(brief.proofLedger && brief.proofLedger.inputFingerprint) +
        "`",
      "- Integrity status: " +
        clean(brief.proofLedger && brief.proofLedger.integrityStatus),
      "- Integrity fingerprint: `" +
        clean(brief.proofLedger && brief.proofLedger.integrityFingerprint) +
        "`",
      ""
    );
    array(brief.currentProof && brief.currentProof.sampleReceipts).forEach(function (item) {
      lines.push(
        "- [" +
          markdownEscape(item.sourceTitle || item.sourceId) +
          "](" +
          clean(item.url) +
          ") - receipt `" +
          clean(item.receiptId) +
          "`; " +
          clean(item.boundary)
      );
    });
    lines.push(
      "",
      "## Boundary",
      "",
      clean(brief.prototypeBoundary),
      ""
    );
    array(brief.reviewScope && brief.reviewScope.exclusions).forEach(function (item) {
      lines.push("- " + clean(item));
    });
    return lines.join("\n");
  }

  function sameSet(left, right) {
    return stableJson(unique(left).sort()) === stableJson(unique(right).sort());
  }

  function semanticProblems(builder, brief) {
    var problems = [];
    var measurement = object(brief.measurementPlan);
    var proofLedger = object(brief.proofLedger);
    var currentProof = object(brief.currentProof);
    var reviewScope = object(brief.reviewScope);
    var deliverables = array(brief.deliverables);

    if (clean(brief.status) !== DRAFT_STATUS) {
      problems.push("DRAFT_STATUS_REQUIRED");
    }
    if (clean(brief.creatorDecisionState) !== "NOT REVIEWED") {
      problems.push("CREATOR_DECISION_UNREVIEWED_REQUIRED");
    }
    if (
      clean(measurement.status) !== MEASUREMENT_STATUS ||
      clean(measurement.baseline) !== "NOT YET OBSERVED"
    ) {
      problems.push("MEASUREMENT_CONTRACT_MISMATCH");
    }
    if (array(measurement.observedResults).length) {
      problems.push("OBSERVED_RESULTS_NOT_ALLOWED");
    }
    if (
      deliverables.length !== array(brief.goal && brief.goal.deliverables).length ||
      deliverables.some(function (item) {
        return (
          clean(item.approvalState) !== "NOT REVIEWED" ||
          clean(item.reviewOwner) !== "HUMAN EDITOR"
        );
      })
    ) {
      problems.push("DELIVERABLE_APPROVAL_INVALID");
    }
    if (
      stableJson(proofLedger.engineFingerprints) !==
      stableJson(builder.engineFingerprints)
    ) {
      problems.push("ENGINE_FINGERPRINT_MISMATCH");
    }
    if (
      clean(proofLedger.integrityStatus) !== clean(builder.integrity.status) ||
      clean(proofLedger.integrityFingerprint) !==
        clean(builder.integrity.fingerprint)
    ) {
      problems.push("INTEGRITY_BINDING_MISMATCH");
    }

    var receipts = array(currentProof.sampleReceipts);
    var receiptIds = receipts.map(function (item) {
      return clean(item && item.receiptId);
    });
    var sourceIds = receipts.map(function (item) {
      return clean(item && item.sourceId);
    });
    if (
      !sameSet(receiptIds, proofLedger.receiptIds) ||
      !sameSet(sourceIds, proofLedger.sourceIds)
    ) {
      problems.push("PROOF_RECEIPT_LEDGER_MISMATCH");
    }

    var expected = buildBrief(builder, brief.goal && brief.goal.id, {
      title: clean(brief.title),
      sourceLane: clean(reviewScope.sourceLane),
      sourceLimit:
        typeof reviewScope.sourceLimit === "number"
          ? reviewScope.sourceLimit
          : undefined
    });
    var suppliedProjection = clone(brief);
    var expectedProjection = clone(expected);
    delete suppliedProjection.fingerprint;
    delete expectedProjection.fingerprint;
    if (stableJson(suppliedProjection) !== stableJson(expectedProjection)) {
      problems.push("SEMANTIC_CONTRACT_MISMATCH");
    }
    return unique(problems);
  }

  function verifyBrief(builder, brief) {
    var problems = [];
    if (!brief || typeof brief !== "object") {
      return { ok: false, problems: ["BRIEF_MISSING"] };
    }
    if (brief.schema !== SCHEMA) problems.push("SCHEMA_MISMATCH");
    if (!goalById(brief.goal && brief.goal.id)) problems.push("GOAL_UNKNOWN");
    if (
      clean(brief.proofLedger && brief.proofLedger.inputFingerprint) !==
      builder.inputFingerprint
    ) {
      problems.push("INPUT_FINGERPRINT_MISMATCH");
    }
    if (
      stableJson(brief.proofLedger && brief.proofLedger.metricSnapshot) !==
      stableJson(builder.metrics)
    ) {
      problems.push("METRIC_SNAPSHOT_MISMATCH");
    }
    var copy = clone(brief);
    var supplied = clean(copy.fingerprint);
    delete copy.fingerprint;
    var expected = fingerprint(copy);
    if (!supplied || supplied !== expected) problems.push("BRIEF_TAMPERED");
    if (goalById(brief.goal && brief.goal.id)) {
      problems = problems.concat(semanticProblems(builder, brief));
    }
    problems = unique(problems);
    return {
      ok: problems.length === 0,
      problems: problems,
      suppliedFingerprint: supplied,
      expectedFingerprint: expected,
      verificationKind:
        "DETERMINISTIC CONSISTENCY + SEMANTIC SAFETY CHECK; NOT AN OWNER SIGNATURE"
    };
  }

  function create(config) {
    var input = normalizeInput(config);
    var metrics = metricSnapshot(input);
    var snapshotDate =
      input.asOf ||
      clean(input.showcase.snapshotDate) ||
      clean(input.trust.snapshotDate) ||
      "undated";
    var engineFingerprints = {
      showcase: clean(input.showcase.inputFingerprint) || fingerprint(metrics.archive),
      lore: clean(input.lore.inputFingerprint) || fingerprint(metrics.lore),
      clipLab: clean(input.clipLab.inputFingerprint) || fingerprint(metrics.creator),
      coldOpen: clean(input.coldOpen.inputFingerprint) || fingerprint(input.coldOpen.metrics),
      trust: clean(input.trust.inputFingerprint) || fingerprint(metrics.trust)
    };
    var integrity = {
      status: input.integrityReport ? clean(input.integrityReport.status) : "NOT SUPPLIED",
      fingerprint: input.integrityReport
        ? clean(input.integrityReport.fingerprint)
        : "NOT SUPPLIED",
      boundary: input.integrityReport
        ? "The supplied deterministic integrity audit passed for its declared inputs."
        : "No Canon Integrity report was supplied; every brief remains draft and human review is mandatory."
    };
    var inputFingerprint = fingerprint({
      snapshotDate: snapshotDate,
      metrics: metrics,
      engineFingerprints: engineFingerprints,
      integrity: integrity
    });
    var builder = {
      engine: "SHOKKER CREATOR WORKFLOW BUILDER",
      version: VERSION,
      schema: SCHEMA,
      snapshotDate: snapshotDate,
      inputFingerprint: inputFingerprint,
      status: DRAFT_STATUS,
      metrics: metrics,
      engineFingerprints: engineFingerprints,
      integrity: integrity,
      goals: clone(GOALS),
      policy: {
        failClosed: true,
        noInventedPerformanceResults: true,
        noCreatorApprovalByDefault: true,
        noRightsClearanceByDefault: true,
        noAutomaticCanonPromotion: true,
        measurementStatus: MEASUREMENT_STATUS
      },
      _input: input
    };
    builder.build = function (goalId, options) {
      return buildBrief(builder, goalId, options);
    };
    builder.buildAll = function (options) {
      return GOALS.map(function (goal) {
        return buildBrief(builder, goal.id, options);
      });
    };
    builder.verify = function (brief) {
      return verifyBrief(builder, brief);
    };
    builder.exportJSON = function (brief, indentation) {
      var verification = verifyBrief(builder, brief);
      if (!verification.ok) {
        throw new Error(
          "Creator Workflow brief failed verification: " +
            verification.problems.join(", ")
        );
      }
      return JSON.stringify(brief, null, indentation == null ? 2 : indentation);
    };
    builder.exportMarkdown = function (brief) {
      var verification = verifyBrief(builder, brief);
      if (!verification.ok) {
        throw new Error(
          "Creator Workflow brief failed verification: " +
            verification.problems.join(", ")
        );
      }
      return exportMarkdown(brief);
    };
    return builder;
  }

  root.WWAMCreatorPilotBuilder = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    GOALS: Object.freeze(clone(GOALS)),
    create: create,
    fingerprint: fingerprint
  });
})(typeof window !== "undefined" ? window : globalThis);
