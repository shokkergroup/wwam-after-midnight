(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var PACK_SCHEMA = "shokker.aftermath-pack/v1";
  var REVIEW_SCHEMA = "shokker.aftermath-review/v1";
  var EXPORT_SCHEMA = "shokker.aftermath-editor-packet/v1";
  var PILOT_SCHEMA = "shokker.creator-pilot-offer/v1";
  var PUBLIC_EXCERPT_WORD_LIMIT = 16;
  var REVIEW_STATES = ["keep", "hold", "reject"];
  var PRODUCTION_KINDS = {
    "creator-short": "short",
    "creator-supercut": "supercut-membership",
    "creator-resurfacing": "resurfacing-pair"
  };

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!value || typeof value !== "object") return value;
    return Object.keys(value).sort().reduce(function (output, key) {
      output[key] = stableValue(value[key]);
      return output;
    }, {});
  }

  function stableJson(value) {
    return JSON.stringify(stableValue(value));
  }

  function fnv1a(value) {
    var hash = 0x811c9dc5;
    var source = text(value);
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return ("00000000" + hash.toString(16)).slice(-8);
  }

  function fingerprint(prefix, value) {
    return prefix + "-" + fnv1a(stableJson(value));
  }

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freezeDeep(value[key]); });
    return Object.freeze(value);
  }

  function fail(code, message) {
    var error = new Error(message);
    error.code = code;
    throw error;
  }

  function words(value) {
    return clean(value).split(/\s+/).filter(Boolean);
  }

  function publicExcerpt(value) {
    var tokens = words(value);
    return tokens.slice(0, PUBLIC_EXCERPT_WORD_LIMIT).join(" ") +
      (tokens.length > PUBLIC_EXCERPT_WORD_LIMIT ? "..." : "");
  }

  function timecode(value) {
    var total = Math.max(0, Math.round(number(value)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : String(minutes)) +
      ":" + String(seconds).padStart(2, "0");
  }

  function timestampUrl(base, at) {
    var url = clean(base);
    if (!url) return "";
    var cleaned = url.replace(/([?&])t=\d+s?(&|$)/, "$1").replace(/[?&]$/, "");
    var separator = cleaned.indexOf("?") >= 0 ? "&" : "?";
    return cleaned + separator + "t=" + Math.max(0, Math.floor(number(at))) + "s";
  }

  function sameStrings(left, right) {
    var a = array(left).map(clean).filter(Boolean).sort();
    var b = array(right).map(clean).filter(Boolean).sort();
    return a.length === b.length && a.every(function (value, index) {
      return value === b[index];
    });
  }

  function unique(values) {
    return Array.from(new Set(array(values).map(clean).filter(Boolean)));
  }

  function sourceReceipts(dossier) {
    return new Map(array(dossier && dossier.source && dossier.source.receipts).map(function (receipt) {
      return [clean(receipt.key), receipt];
    }));
  }

  function sourceArtifacts(dossier) {
    return new Map(array(dossier && dossier.source && dossier.source.artifacts).map(function (artifact) {
      return [clean(artifact.id), artifact];
    }));
  }

  function candidateSegments(item, sourceId) {
    if (item.kind === "short-candidate") return item.sourceId === sourceId ? [item] : [];
    if (item.kind === "supercut-bundle") {
      return array(item.segments).filter(function (segment) {
        return segment.sourceId === sourceId;
      });
    }
    if (item.kind === "episode-resurfacing") {
      return [item.archive, item.current].filter(function (segment) {
        return segment && segment.sourceId === sourceId;
      });
    }
    return [];
  }

  function relatedSegments(item, sourceId) {
    if (item.kind === "supercut-bundle") {
      return array(item.segments).filter(function (segment) {
        return segment.sourceId !== sourceId;
      });
    }
    if (item.kind === "episode-resurfacing") {
      return [item.archive, item.current].filter(function (segment) {
        return segment && segment.sourceId !== sourceId;
      });
    }
    return [];
  }

  function productionKindForItem(item) {
    if (item.kind === "short-candidate") return "short";
    if (item.kind === "supercut-bundle") return "supercut-membership";
    if (item.kind === "episode-resurfacing") return "resurfacing-pair";
    return "";
  }

  function validateSegment(segment, source, receiptMap) {
    var receiptId = clean(segment && segment.receiptId);
    var receipt = receiptMap.get(receiptId);
    if (!receipt) {
      fail("FOREIGN_OR_UNKNOWN_RECEIPT", "Aftermath opportunity references a receipt outside this exact source.");
    }
    if (clean(segment.sourceId) !== clean(source.id)) {
      fail("SOURCE_LOCK_VIOLATION", "Aftermath opportunity crossed the exact-source boundary.");
    }
    if (Math.abs(number(segment.receiptAt) - number(receipt.at)) > 0.75) {
      fail("RECEIPT_COORDINATE_DRIFT", "Clip Lab and Source Dossier disagree on the receipt coordinate.");
    }
    var window = record(segment.editWindow);
    var start = number(window.in);
    var end = number(window.out);
    if (!(start >= 0 && start <= number(receipt.at) && end > number(receipt.at) &&
        end <= number(source.duration) + 0.5 && number(window.seconds) === end - start)) {
      fail("EDIT_WINDOW_INVALID", "A proposed edit window escaped its source or receipt coordinate.");
    }
    if (!record(segment.evidence).label || !record(segment.risk).label ||
        !record(segment.approval).humanReviewRequired) {
      fail("REVIEW_FIELDS_INCOMPLETE", "A Clip Lab candidate is missing evidence, risk, or review controls.");
    }
    if (record(segment.speaker).display || record(segment.speaker).creditAllowed === true) {
      fail("SPEAKER_AUTHORITY_VIOLATION", "An unverified clip speaker cannot travel into an Aftermath Pack.");
    }
    return receipt;
  }

  function coordinate(segment, receipt, source) {
    var window = record(segment.editWindow);
    var excerpt = publicExcerpt(receipt.excerpt || segment.archivalExcerpt);
    return {
      sourceId: source.id,
      receiptKey: receipt.key,
      at: number(receipt.at),
      end: number(receipt.end),
      timecode: timecode(receipt.at),
      officialUrl: clean(receipt.url) || timestampUrl(source.url, receipt.at),
      proposedWindow: {
        in: number(window.in),
        out: number(window.out),
        seconds: number(window.seconds),
        inTimecode: clean(window.inTimecode) || timecode(window.in),
        outTimecode: clean(window.outTimecode) || timecode(window.out),
        status: clean(window.status) || "EDITORIAL WINDOW / CONTEXT REVIEW REQUIRED"
      },
      publicExcerpt: excerpt,
      publicExcerptWordCount: words(excerpt.replace(/\.\.\.$/, "")).length,
      excerptLabel: "ARCHIVAL CAPTION EXCERPT / MAX 16 WORDS",
      evidenceLevel: clean(receipt.evidenceLevel),
      evidenceType: clean(receipt.evidenceType),
      reviewState: clean(receipt.reviewState),
      speaker: null,
      speakerStatus: "not-diarized"
    };
  }

  function editorialCopy(item) {
    var editorial = record(item.editorial);
    if (item.kind === "short-candidate") {
      return {
        label: clean(editorial.label) || "SUGGESTED EDITORIAL COPY / NOT AN ARCHIVAL QUOTE",
        titleOptions: array(editorial.titleOptions).map(clean).filter(Boolean),
        hookOptions: array(editorial.hookOptions).map(clean).filter(Boolean),
        suggestedCaption: clean(editorial.suggestedCaption),
        claimsPolicy: clean(editorial.claimsPolicy)
      };
    }
    return {
      label: clean(item.editorialLabel) || "SUGGESTED EDITORIAL COPY / NOT AN ARCHIVAL QUOTE",
      titleOptions: [clean(item.title)].filter(Boolean),
      hookOptions: [clean(item.hook)].filter(Boolean),
      suggestedCaption: "",
      claimsPolicy: item.kind === "episode-resurfacing" ? clean(item.claimBoundary) : clean(item.editNote)
    };
  }

  function titleFor(item) {
    var copy = editorialCopy(item);
    return clean(copy.titleOptions[0]) || clean(item.title) || clean(item.anchor) || clean(item.id);
  }

  function scoreFor(item) {
    var components = [];
    var breakdown = record(item.scoreBreakdown);
    Object.keys(breakdown).forEach(function (key) {
      if (typeof breakdown[key] === "number") {
        components.push({ id: key, value: number(breakdown[key]) });
      }
    });
    if (item.kind === "supercut-bundle") {
      components = [
        { id: "sources", value: number(item.sourceCount), basis: "distinct indexed sources" },
        { id: "segments", value: number(item.segmentCount), basis: "bounded receipt segments" },
        { id: "minimum-evidence", value: number(record(item.evidence).minimum), basis: "least-certain segment" }
      ];
    }
    if (item.kind === "episode-resurfacing") {
      components = [
        { id: "archive-span-days", value: number(item.spanDays), basis: "indexed receipt distance" },
        { id: "minimum-evidence", value: number(record(item.evidence).minimum), basis: "least-certain endpoint" }
      ];
    }
    return {
      overall: number(item.editPriority || item.resurfaceScore),
      basis: clean(breakdown.formula) ||
        (item.kind === "supercut-bundle" ? "Clip Lab package priority with source diversity." :
          item.kind === "episode-resurfacing" ? "Then/Now archive span plus bounded receipt strength." :
          "Transparent Clip Lab editorial priority."),
      components: components
    };
  }

  function readinessFor(item) {
    var risk = clean(record(item.risk).label).toUpperCase();
    var evidence = record(item.evidence);
    if (item.kind === "short-candidate") {
      var level = clean(evidence.evidenceLevel).toLowerCase();
      if (level === "curated-candidate" && risk === "LOW") return "clip-ready";
      if (level === "curated-candidate" && risk === "MEDIUM") return "fast-review";
      if (level !== "curated-candidate" && risk === "MEDIUM") return "research";
      return "quarantine";
    }
    return risk === "LOW" || risk === "MEDIUM" ? "archive-expansion" : "quarantine";
  }

  function opportunity(item, source, dossier, artifact, receiptMap) {
    var segments = candidateSegments(item, source.id);
    if (!segments.length) fail("SOURCE_MEMBERSHIP_MISSING", "Registered opportunity has no local source segment.");
    var localReceiptKeys = segments.map(function (segment) {
      return clean(segment.receiptId);
    });
    if (!sameStrings(localReceiptKeys, artifact.receiptKeys)) {
      fail("ARTIFACT_RECEIPT_DRIFT", "The registered artifact and Clip Lab disagree on local receipt membership.");
    }
    var kind = productionKindForItem(item);
    if (!kind || PRODUCTION_KINDS[artifact.kind] !== kind) {
      fail("ARTIFACT_KIND_DRIFT", "The registered artifact kind does not match its exact Clip Lab production kind.");
    }
    var coordinates = segments.map(function (segment) {
      return coordinate(segment, validateSegment(segment, source, receiptMap), source);
    });
    var related = relatedSegments(item, source.id).map(function (segment) {
      return {
        sourceId: clean(segment.sourceId),
        receiptKey: clean(segment.receiptId),
        at: number(segment.receiptAt),
        timecode: timecode(segment.receiptAt),
        officialUrl: clean(segment.receiptUrl),
        relationship: "RELATED SOURCE SEGMENT / NOT LOCAL SOURCE PROOF"
      };
    });
    var score = scoreFor(item);
    var evidence = clone(record(item.evidence));
    var risk = clone(record(item.risk));
    var rationale = item.kind === "short-candidate"
      ? "Ranked from " + coordinates.length + " exact-source registered receipt" +
        (coordinates.length === 1 ? "" : "s") + ". " + score.basis +
        " Evidence: " + (clean(evidence.label) || "UNLABELED") +
        "; risk: " + (clean(risk.label) || "UNLABELED") + "."
      : item.kind === "supercut-bundle" ? clean(item.editNote) : clean(item.claimBoundary);
    var output = {
      id: clean(item.id),
      kind: kind,
      title: titleFor(item),
      sourceId: source.id,
      sourceFingerprint: source.sourceFingerprint,
      dossierFingerprint: dossier.fingerprint,
      artifactAuthority: clean(artifact.authority),
      artifactReviewState: clean(artifact.reviewState),
      localReceiptKeys: localReceiptKeys,
      coordinates: coordinates,
      relatedSources: related,
      multiSource: related.length > 0,
      editorial: editorialCopy(item),
      rationale: rationale,
      readiness: readinessFor(item),
      score: score,
      evidence: evidence,
      risk: risk,
      approval: item.kind === "short-candidate" ? clone(record(item.approval)) : {
        status: "HUMAN CONTEXT AND EDIT REVIEW REQUIRED",
        humanReviewRequired: true,
        checks: [
          "Watch every proposed source window with surrounding context.",
          "Confirm the package does not reverse meaning.",
          "Do not assign a speaker without clip-level human verification.",
          "Apply rights, language, and platform review."
        ]
      },
      speaker: null,
      speakerStatus: "not-diarized",
      creatorApproved: false,
      rightsCleared: false,
      promotionAllowed: false
    };
    output.fingerprint = fingerprint("ao1", output);
    return output;
  }

  function buildResearch(dossier, receiptMap) {
    return array(dossier.source.artifacts).filter(function (artifact) {
      return artifact.kind === "bit-lineage";
    }).map(function (artifact) {
      var receipts = array(artifact.receiptKeys).map(function (key) {
        var receipt = receiptMap.get(clean(key));
        if (!receipt) fail("RESEARCH_RECEIPT_DRIFT", "A research artifact references a foreign or unknown receipt.");
        return {
          receiptKey: receipt.key,
          at: number(receipt.at),
          timecode: timecode(receipt.at),
          officialUrl: clean(receipt.url) || timestampUrl(dossier.source.url, receipt.at),
          publicExcerpt: publicExcerpt(receipt.excerpt),
          speaker: null,
          speakerStatus: "not-diarized"
        };
      });
      return {
        id: artifact.id,
        kind: "bit-lineage-reference",
        title: artifact.label,
        sourceId: dossier.source.id,
        receiptKeys: array(artifact.receiptKeys).slice(),
        receipts: receipts,
        sourceIds: array(artifact.sourceIds).slice(),
        boundary: "REFERENCE-ONLY RESEARCH THREAD / NO EDIT WINDOW OR CREATOR-CERTIFIED ORIGIN",
        promotionAllowed: false
      };
    });
  }

  function receiptUrlTime(value) {
    var match = clean(value).match(/[?&](?:t|start)=([0-9]+(?:\.[0-9]+)?)s?(?:[&#]|$)/i);
    return match ? Number(match[1]) : NaN;
  }

  function storyboardCoordinate(slot, source, receipt) {
    if (Math.abs(number(slot.receiptAt) - number(receipt.at)) > 0.75) {
      fail("STORYBOARD_RECEIPT_COORDINATE_DRIFT", "A storyboard slot disagrees with its canonical dossier receipt time.");
    }
    var excerpt = publicExcerpt(receipt.excerpt);
    if (clean(slot.archivalExcerpt) !== excerpt) {
      fail("STORYBOARD_EXCERPT_DRIFT", "A storyboard slot excerpt disagrees with its canonical dossier receipt.");
    }
    var slotUrl = clean(slot.sourceAtReceipt);
    var canonicalUrl = clean(receipt.url) || timestampUrl(source.url, receipt.at);
    var slotUrlTime = receiptUrlTime(slotUrl);
    if (!slotUrl || slotUrl.indexOf(clean(source.url)) !== 0 || !Number.isFinite(slotUrlTime) ||
        Math.abs(slotUrlTime - number(receipt.at)) > 1) {
      fail("STORYBOARD_URL_DRIFT", "A storyboard slot URL no longer resolves to its canonical dossier receipt coordinate.");
    }
    var window = record(slot.proposedSourceWindow);
    var start = number(window.in);
    var end = number(window.out);
    var seconds = number(window.seconds);
    if (!(start >= 0 && start <= number(receipt.at) && end > number(receipt.at) &&
        end <= number(source.duration) + 0.5 && seconds === end - start &&
        seconds === number(slot.seconds)) ||
        (window.receiptAt != null && Math.abs(number(window.receiptAt) - number(receipt.at)) > 0.75)) {
      fail("STORYBOARD_WINDOW_INVALID", "A storyboard slot proposed window escaped its source or canonical receipt coordinate.");
    }
    return {
      receiptKey: clean(receipt.key),
      at: number(receipt.at),
      timecode: timecode(receipt.at),
      proposedWindow: {
        in: start,
        out: end,
        seconds: seconds,
        inTimecode: timecode(start),
        outTimecode: timecode(end),
        receiptAt: number(receipt.at),
        receiptTimecode: timecode(receipt.at),
        status: clean(window.status) || "PROPOSED MICRO-WINDOW / CONTEXT REVIEW REQUIRED",
        withinSource: true
      },
      officialUrl: canonicalUrl,
      publicExcerpt: excerpt,
      publicExcerptWordCount: words(excerpt.replace(/\.\.\.$/, "")).length,
      speaker: null,
      speakerStatus: "not-diarized"
    };
  }

  function buildStoryboards(coldOpen, source, receiptMap) {
    return array(coldOpen && coldOpen.storyboards).filter(function (board) {
      return array(board.sourceIds).indexOf(source.id) >= 0;
    }).map(function (board) {
      var localSlots = array(board.slots).filter(function (slot) {
        return slot.kind === "source-clip" && slot.sourceId === source.id;
      }).map(function (slot) {
        var receipt = receiptMap.get(clean(slot.receiptId));
        if (!receipt) {
          fail("STORYBOARD_SOURCE_DRIFT", "A source-linked storyboard lost its local registered receipt.");
        }
        return storyboardCoordinate(slot, source, receipt);
      });
      if (!localSlots.length) {
        fail("STORYBOARD_SOURCE_MEMBERSHIP_MISSING", "A storyboard declares this source without a local source-clip slot.");
      }
      return {
        id: clean(board.id),
        kind: "cold-open-storyboard",
        title: clean(board.title),
        formatSeconds: number(board.formatSeconds),
        mode: clean(board.mode),
        anchor: clone(record(board.anchor)),
        localSlots: localSlots,
        sourceIds: array(board.sourceIds).slice(),
        editorialPriority: number(board.editorialPriority),
        evidence: clone(record(board.evidence)),
        risk: clone(record(board.risk)),
        approvalGate: clone(record(board.approvalGate)),
        copyLabel: clean(board.copyLabel),
        registrationBoundary: "GENERATED STORYBOARD / SEPARATE FROM REGISTERED ARTIFACT MEMBERSHIPS",
        mediaIncluded: false,
        rightsCleared: false
      };
    });
  }

  function aftermathFor(showcase, sourceId) {
    var values = showcase && typeof showcase.getAftermath === "function" ? showcase.getAftermath() :
      array(showcase && showcase.liveAftermath);
    var report = array(values).filter(function (item) {
      return clean(item.sourceId) === clean(sourceId);
    })[0];
    if (!report) return null;
    return {
      sourceId: sourceId,
      status: clean(report.status),
      summary: clean(report.summary),
      dominantTopics: array(report.dominantTopics).map(clean).filter(Boolean),
      newSincePreviousIndexedStream: array(report.newSincePreviousIndexedStream).map(clean).filter(Boolean),
      funniest: report.funniest ? clone(report.funniest) : null,
      strongestTopic: report.strongestTopic ? clone(report.strongestTopic) : null,
      peakChemistry: number(report.peakChemistry),
      clipCandidateReceiptIds: array(report.clipCandidateReceiptIds).slice(),
      graphDelta: clone(record(report.graphDelta)),
      inference: clean(report.inference)
    };
  }

  function create(config) {
    var input = config || {};
    var dossierEngine = input.dossierEngine;
    var clipLab = input.clipLab;
    var showcase = input.showcase || null;
    var coldOpen = input.coldOpen || null;
    if (!dossierEngine || typeof dossierEngine.build !== "function" ||
        typeof dossierEngine.list !== "function") {
      throw new Error("Aftermath Pack requires a Source Dossier engine.");
    }
    if (!clipLab || !Array.isArray(clipLab.shorts) || !Array.isArray(clipLab.supercuts) ||
        !Array.isArray(clipLab.resurfacing)) {
      throw new Error("Aftermath Pack requires the Creator Clip Lab registry.");
    }
    var packCache = new Map();

    function build(sourceId) {
      var id = clean(sourceId);
      if (!id) fail("SOURCE_ID_REQUIRED", "Aftermath Pack requires one exact source ID.");
      if (packCache.has(id)) return packCache.get(id);
      var dossier = dossierEngine.build(id);
      if (!dossier || !dossier.source || clean(dossier.source.id) !== id) {
        fail("DOSSIER_SOURCE_MISMATCH", "The Source Dossier did not preserve the requested source.");
      }
      var source = dossier.source;
      var receiptMap = sourceReceipts(dossier);
      var artifactMap = sourceArtifacts(dossier);
      var raw = [];
      clipLab.shorts.forEach(function (item) {
        if (item.sourceId === id) raw.push(item);
      });
      clipLab.supercuts.forEach(function (item) {
        if (array(item.segments).some(function (segment) { return segment.sourceId === id; })) raw.push(item);
      });
      clipLab.resurfacing.forEach(function (item) {
        if ((item.archive && item.archive.sourceId === id) || (item.current && item.current.sourceId === id)) raw.push(item);
      });
      var registeredProduction = array(source.artifacts).filter(function (artifact) {
        return Object.prototype.hasOwnProperty.call(PRODUCTION_KINDS, artifact.kind);
      });
      var rawIds = raw.map(function (item) { return clean(item.id); });
      var registeredIds = registeredProduction.map(function (artifact) { return clean(artifact.id); });
      if (!sameStrings(rawIds, registeredIds)) {
        fail("ARTIFACT_REGISTRY_DRIFT", "Source Dossier membership and Clip Lab inventory no longer match.");
      }
      var opportunities = raw.map(function (item) {
        var artifact = artifactMap.get(clean(item.id));
        if (!artifact || PRODUCTION_KINDS[artifact.kind] == null) {
          fail("ARTIFACT_JOIN_FAILED", "A Clip Lab opportunity is not registered to this exact source.");
        }
        return opportunity(item, source, dossier, artifact, receiptMap);
      }).sort(function (left, right) {
        var lane = { "clip-ready": 0, "fast-review": 1, "archive-expansion": 2,
          research: 3, quarantine: 4 };
        return number(lane[left.readiness]) - number(lane[right.readiness]) ||
          number(right.score.overall) - number(left.score.overall) || left.id.localeCompare(right.id);
      });
      var research = buildResearch(dossier, receiptMap);
      var storyboards = buildStoryboards(coldOpen, source, receiptMap);
      var readiness = opportunities.reduce(function (counts, item) {
        counts[item.readiness] = number(counts[item.readiness]) + 1;
        return counts;
      }, {});
      var output = {
        schema: PACK_SCHEMA,
        version: VERSION,
        channel: {
          id: clean(dossier.bindings.channelId),
          label: clean(dossier.bindings.channelLabel),
          packFingerprint: clean(dossier.bindings.channelPackFingerprint)
        },
        bindings: {
          snapshotDate: dossier.bindings.snapshotDate,
          archiveFingerprint: dossier.bindings.archiveFingerprint,
          channelPackFingerprint: dossier.bindings.channelPackFingerprint,
          dossierFingerprint: dossier.fingerprint,
          sourceFingerprint: source.sourceFingerprint,
          clipLabFingerprint: clean(clipLab.inputFingerprint),
          coldOpenFingerprint: clean(coldOpen && coldOpen.inputFingerprint)
        },
        source: {
          id: source.id,
          title: source.displayTitle || source.title,
          date: source.date,
          duration: number(source.duration),
          thumbnail: source.thumbnail,
          officialUrl: source.url,
          coverage: source.coverage,
          authority: source.authority
        },
        eligibility: {
          status: opportunities.length ? "REVIEW AVAILABLE" : "NO RECEIPT-BACKED CREATOR OPPORTUNITIES YET",
          captionBacked: source.coverage === "caption-backed",
          exactSourceLocked: true,
          creatorApproved: false,
          rightsCleared: false
        },
        showDelta: aftermathFor(showcase, id),
        metrics: {
          opportunities: opportunities.length,
          shorts: opportunities.filter(function (item) { return item.kind === "short"; }).length,
          supercutMemberships: opportunities.filter(function (item) { return item.kind === "supercut-membership"; }).length,
          resurfacingPairs: opportunities.filter(function (item) { return item.kind === "resurfacing-pair"; }).length,
          clipReady: number(readiness["clip-ready"]),
          fastReview: number(readiness["fast-review"]),
          archiveExpansion: number(readiness["archive-expansion"]),
          researchQueue: number(readiness.research),
          quarantined: number(readiness.quarantine),
          referenceThreads: research.length,
          coldOpenStoryboards: storyboards.length,
          sourceReceipts: receiptMap.size,
          registeredArtifactMemberships: array(source.artifacts).length
        },
        opportunities: opportunities,
        research: research,
        storyboards: storyboards,
        boundaries: [
          "Machine opportunities are not creator choices.",
          "Keep, hold, and reject are local editorial routing decisions, not authenticated creator approval.",
          "No speaker is inferred from automatic captions.",
          "No media, rights clearance, publishing, virality, or performance guarantee is included.",
          "Cold-open storyboards are generated plans and remain separate from registered artifact-membership counts."
        ]
      };
      output.fingerprint = fingerprint("ap1", output);
      var frozen = freezeDeep(output);
      packCache.set(id, frozen);
      return frozen;
    }

    function normalizeDecisions(pack, decisions) {
      var values = [];
      if (Array.isArray(decisions)) values = decisions;
      else Object.keys(record(decisions)).forEach(function (id) {
        var raw = decisions[id];
        values.push(typeof raw === "string" ? { opportunityId: id, status: raw } :
          Object.assign({ opportunityId: id }, record(raw)));
      });
      var validIds = new Set(pack.opportunities.map(function (item) { return item.id; }));
      var seen = new Set();
      return values.map(function (raw) {
        var opportunityId = clean(raw.opportunityId || raw.id);
        var status = clean(raw.status).toLowerCase();
        var note = clean(raw.note);
        if (!validIds.has(opportunityId)) fail("UNKNOWN_OPPORTUNITY", "Review decision targets an opportunity outside this pack.");
        if (seen.has(opportunityId)) fail("DUPLICATE_DECISION", "Only one routing decision is allowed per opportunity.");
        if (REVIEW_STATES.indexOf(status) < 0) fail("REVIEW_STATE_INVALID", "Review state must be keep, hold, or reject.");
        if (note.length > 240) fail("REVIEW_NOTE_TOO_LONG", "Review notes are capped at 240 characters.");
        seen.add(opportunityId);
        return {
          opportunityId: opportunityId,
          status: status,
          note: note,
          decisionMeaning: status === "keep" ? "KEEP FOR CREATOR REVIEW" :
            status === "hold" ? "HOLD FOR MORE CONTEXT" : "REJECT FROM THIS LOCAL PACK",
          creatorApproved: false,
          promotionAllowed: false
        };
      }).sort(function (left, right) { return left.opportunityId.localeCompare(right.opportunityId); });
    }

    function createReview(sourceId, decisions) {
      var pack = build(sourceId);
      var normalized = normalizeDecisions(pack, decisions);
      var counts = { keep: 0, hold: 0, reject: 0, unreviewed: pack.opportunities.length - normalized.length };
      normalized.forEach(function (item) { counts[item.status] += 1; });
      var ledger = {
        schema: REVIEW_SCHEMA,
        version: VERSION,
        sourceId: pack.source.id,
        sourceFingerprint: pack.bindings.sourceFingerprint,
        packFingerprint: pack.fingerprint,
        clipLabFingerprint: pack.bindings.clipLabFingerprint,
        decisions: normalized,
        counts: counts,
        status: !pack.opportunities.length ? "NO ELIGIBLE OPPORTUNITIES / NOTHING TO ROUTE" :
          counts.unreviewed ? "DRAFT / UNREVIEWED OPPORTUNITIES REMAIN" :
            "LOCAL ROUTING COMPLETE / CREATOR APPROVAL STILL REQUIRED",
        authority: "LOCAL EDITORIAL ROUTING ONLY",
        creatorApproved: false,
        rightsCleared: false,
        promotionAllowed: false
      };
      ledger.fingerprint = fingerprint("ar1", ledger);
      return freezeDeep(ledger);
    }

    function restoreReview(sourceId, saved) {
      var raw = record(saved);
      if (raw.schema !== REVIEW_SCHEMA || raw.version !== VERSION) {
        fail("REVIEW_SCHEMA_MISMATCH", "Saved Aftermath review uses an incompatible schema.");
      }
      var pack = build(sourceId);
      if (raw.sourceId !== pack.source.id || raw.sourceFingerprint !== pack.bindings.sourceFingerprint ||
          raw.packFingerprint !== pack.fingerprint || raw.clipLabFingerprint !== pack.bindings.clipLabFingerprint) {
        fail("REVIEW_FINGERPRINT_DRIFT", "Saved review belongs to a different source or production build.");
      }
      var expected = createReview(sourceId, raw.decisions);
      if (raw.fingerprint !== expected.fingerprint || stableJson(raw) !== stableJson(expected)) {
        fail("REVIEW_TAMPERED", "Saved Aftermath review failed its deterministic proof check.");
      }
      return expected;
    }

    function packetOpportunity(opportunity, decision) {
      var route = decision || {
        status: "unreviewed",
        decisionMeaning: "UNREVIEWED / NO LOCAL ROUTING DECISION",
        note: ""
      };
      return {
        id: opportunity.id,
        kind: opportunity.kind,
        title: opportunity.title,
        decision: route.status,
        decisionMeaning: route.decisionMeaning,
        note: route.note,
        readiness: opportunity.readiness,
        sourceId: opportunity.sourceId,
        sourceFingerprint: opportunity.sourceFingerprint,
        opportunityFingerprint: opportunity.fingerprint,
        editorial: clone(opportunity.editorial),
        coordinates: opportunity.coordinates.map(function (coordinateItem) {
          return clone(coordinateItem);
        }),
        relatedSources: clone(opportunity.relatedSources),
        score: clone(opportunity.score),
        evidence: clone(opportunity.evidence),
        risk: clone(opportunity.risk),
        approval: clone(opportunity.approval),
        speaker: null,
        speakerStatus: "not-diarized",
        creatorApproved: false,
        rightsCleared: false,
        mediaIncluded: false
      };
    }

    function exportPacket(sourceId, review) {
      var pack = build(sourceId);
      var ledger = review ? restoreReview(sourceId, review) : createReview(sourceId, []);
      var byId = new Map(pack.opportunities.map(function (item) { return [item.id, item]; }));
      var kept = [];
      var held = [];
      var quarantined = [];
      var rejected = [];
      var decidedIds = new Set();
      ledger.decisions.forEach(function (decision) {
        var item = byId.get(decision.opportunityId);
        decidedIds.add(decision.opportunityId);
        if (decision.status === "reject") rejected.push(packetOpportunity(item, decision));
        else if (item.readiness === "quarantine") quarantined.push(packetOpportunity(item, decision));
        else if (decision.status === "keep") kept.push(packetOpportunity(item, decision));
        else held.push(packetOpportunity(item, decision));
      });
      var unreviewed = pack.opportunities.filter(function (item) {
        return !decidedIds.has(item.id);
      }).map(function (item) {
        return packetOpportunity(item, null);
      });
      var packet = {
        schema: EXPORT_SCHEMA,
        version: VERSION,
        status: !pack.opportunities.length ? "NO ELIGIBLE OPPORTUNITIES / NOTHING TO ROUTE" :
          ledger.counts.unreviewed ? "DRAFT / UNREVIEWED OPPORTUNITIES DISCLOSED" :
            "LOCAL ROUTING COMPLETE / HUMAN CREATOR REVIEW STILL REQUIRED",
        packFingerprint: pack.fingerprint,
        reviewFingerprint: ledger.fingerprint,
        bindings: clone(pack.bindings),
        source: clone(pack.source),
        showDelta: clone(pack.showDelta),
        summary: clone(ledger.counts),
        bucketSummary: {
          keptForCreatorReview: kept.length,
          heldForContext: held.length,
          quarantinedByRiskGate: quarantined.length,
          rejected: rejected.length,
          unreviewed: unreviewed.length
        },
        keptForCreatorReview: kept,
        heldForContext: held,
        quarantinedByRiskGate: quarantined,
        rejectedOpportunityIds: rejected.map(function (item) { return item.id; }),
        rejectedOpportunities: rejected,
        unreviewedOpportunityIds: unreviewed.map(function (item) { return item.id; }),
        unreviewedOpportunities: unreviewed,
        referenceThreads: clone(pack.research),
        coldOpenStoryboards: clone(pack.storyboards),
        acceptanceChecklist: [
          "Watch at least 15 seconds before and after each proposed window.",
          "Set final picture and audio boundaries by ear.",
          "Confirm the edit does not reverse meaning.",
          "Verify clip-level speaker credit or leave it unnamed.",
          "Apply rights, language, platform, title, thumbnail, and final-publish review.",
          "Record authenticated creator approval outside this local routing ledger."
        ],
        omissions: [
          "transcript payloads",
          "media files",
          "downloaded audio or video",
          "speaker inference",
          "rights clearance",
          "creator approval",
          "publication",
          "performance or virality guarantees"
        ]
      };
      packet.fingerprint = fingerprint("ae1", packet);
      return freezeDeep(packet);
    }

    function appendMarkdownBucket(lines, heading, values) {
      lines.push("", "## " + heading, "");
      var items = array(values);
      if (!items.length) {
        lines.push("- None.");
        return;
      }
      items.forEach(function (item) {
        lines.push("- **" + clean(item.title) + "** / " + clean(item.kind) +
          " / " + clean(item.readiness) + " / " + clean(item.decisionMeaning));
        if (clean(item.note)) lines.push("  - Review note: " + clean(item.note));
        array(item.coordinates).forEach(function (coordinateItem) {
          var window = record(coordinateItem.proposedWindow);
          lines.push("  - " + clean(coordinateItem.timecode) + " / window " +
            clean(window.inTimecode) + "–" + clean(window.outTimecode) +
            " / " + clean(coordinateItem.officialUrl));
        });
      });
    }

    function exportMarkdown(packet) {
      var value = record(packet);
      if (value.schema !== EXPORT_SCHEMA) fail("PACKET_SCHEMA_MISMATCH", "Aftermath Markdown requires an editor packet.");
      var lines = [
        "# THE AFTERMATH PACK",
        "",
        "**" + clean(record(value.source).title) + "**  ",
        clean(record(value.source).date) + " / source " + clean(record(value.source).id),
        "",
        "Status: " + clean(value.status),
        "Packet proof: " + clean(value.fingerprint),
        "",
        "## Routing",
        "",
        "- Keep for creator review: " + array(value.keptForCreatorReview).length,
        "- Hold for context: " + array(value.heldForContext).length,
        "- Risk quarantine: " + array(value.quarantinedByRiskGate).length,
        "- Rejected: " + array(value.rejectedOpportunities).length,
        "- Unreviewed: " + array(value.unreviewedOpportunities).length
      ];
      appendMarkdownBucket(lines, "Kept opportunities", value.keptForCreatorReview);
      appendMarkdownBucket(lines, "Held opportunities", value.heldForContext);
      appendMarkdownBucket(lines, "Risk quarantine", value.quarantinedByRiskGate);
      appendMarkdownBucket(lines, "Rejected opportunities", value.rejectedOpportunities);
      appendMarkdownBucket(lines, "Unreviewed opportunities", value.unreviewedOpportunities);
      lines.push("", "## Human gate", "");
      array(value.acceptanceChecklist).forEach(function (item) { lines.push("- " + item); });
      lines.push("", "No media, rights clearance, speaker inference, creator approval, publishing, or performance promise is included.");
      return lines.join("\n");
    }

    function buildPilot(options) {
      var settings = options || {};
      var requested = unique(settings.sourceIds);
      var sourceCounts = new Map();
      clipLab.shorts.forEach(function (item) {
        sourceCounts.set(item.sourceId, number(sourceCounts.get(item.sourceId)) + 1);
      });
      clipLab.supercuts.forEach(function (item) {
        unique(array(item.sourceIds)).forEach(function (id) {
          sourceCounts.set(id, number(sourceCounts.get(id)) + 1);
        });
      });
      clipLab.resurfacing.forEach(function (item) {
        unique(array(item.sourceIds)).forEach(function (id) {
          sourceCounts.set(id, number(sourceCounts.get(id)) + 1);
        });
      });
      var listById = new Map(dossierEngine.list().map(function (item) { return [item.id, item]; }));
      var candidates = Array.from(sourceCounts.keys()).filter(function (id) {
        return listById.has(id);
      }).sort(function (left, right) {
        var a = listById.get(left);
        var b = listById.get(right);
        return clean(b.date).localeCompare(clean(a.date)) ||
          number(sourceCounts.get(right)) - number(sourceCounts.get(left)) || left.localeCompare(right);
      });
      requested.forEach(function (id) {
        if (!listById.has(id) || !sourceCounts.has(id)) fail("PILOT_SOURCE_INELIGIBLE", "Pilot source has no registered creator opportunities.");
      });
      var selected = requested.slice(0, 3);
      candidates.forEach(function (id) {
        if (selected.length < 3 && selected.indexOf(id) < 0) selected.push(id);
      });
      if (selected.length !== 3) fail("PILOT_SOURCE_COUNT", "The proposed pilot requires exactly three eligible shows.");
      var packs = selected.map(build);
      var offer = {
        schema: PILOT_SCHEMA,
        version: VERSION,
        status: "PROPOSED PILOT / MUTUAL AGREEMENT REQUIRED",
        offer: {
          priceUsd: 500,
          shows: 3,
          durationDays: 14,
          label: "$500 / 3 SHOWS / 14 DAYS"
        },
        promise: "Turn three already-indexed shows into source-locked Aftermath review desks and editor handoff packets.",
        sources: packs.map(function (pack) {
          return {
            id: pack.source.id,
            title: pack.source.title,
            date: pack.source.date,
            packFingerprint: pack.fingerprint,
            opportunities: pack.metrics.opportunities,
            referenceThreads: pack.metrics.referenceThreads,
            coldOpenStoryboards: pack.metrics.coldOpenStoryboards
          };
        }),
        deliverables: [
          "Three exact-source Aftermath Packs with playable receipt coordinates.",
          "One local Keep / Hold / Reject review ledger per show.",
          "One bounded JSON plus Markdown editor handoff per show.",
          "One pilot-close review of gaps, holds, and next-corpus priorities."
        ],
        acceptanceChecks: [
          "Every surfaced opportunity resolves to the selected source and a registered receipt.",
          "Every proposed in/out point remains inside source duration and around its receipt.",
          "Generated copy stays labeled separately from archival excerpts.",
          "Risk, evidence, unreviewed work, and all withheld authority remain visible.",
          "Exports reproduce the same fingerprints against the same source build."
        ],
        excluded: [
          "media editing or download",
          "manual transcription or diarization",
          "rights clearance",
          "creator approval",
          "publishing",
          "guaranteed views, revenue, conversion, retention, or virality"
        ],
        commercialBoundary: "The $500 figure is a proposed fixed-scope creator pilot, not an invoice, guarantee, or completed agreement."
      };
      offer.fingerprint = fingerprint("po1", offer);
      return freezeDeep(offer);
    }

    return freezeDeep({
      engine: "SHOKKER AFTERMATH PACK",
      version: VERSION,
      schemas: {
        pack: PACK_SCHEMA,
        review: REVIEW_SCHEMA,
        export: EXPORT_SCHEMA,
        pilot: PILOT_SCHEMA
      },
      publicExcerptWordLimit: PUBLIC_EXCERPT_WORD_LIMIT,
      build: build,
      createReview: createReview,
      restoreReview: restoreReview,
      exportPacket: exportPacket,
      exportMarkdown: exportMarkdown,
      buildPilot: buildPilot
    });
  }

  root.ShokkerAftermathPack = freezeDeep({
    VERSION: VERSION,
    PACK_SCHEMA: PACK_SCHEMA,
    REVIEW_SCHEMA: REVIEW_SCHEMA,
    EXPORT_SCHEMA: EXPORT_SCHEMA,
    PILOT_SCHEMA: PILOT_SCHEMA,
    PUBLIC_EXCERPT_WORD_LIMIT: PUBLIC_EXCERPT_WORD_LIMIT,
    REVIEW_STATES: REVIEW_STATES.slice(),
    create: create
  });
})(typeof window !== "undefined" ? window : globalThis);
