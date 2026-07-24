(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker-youtube-wiki/ask-review/v1";
  var QUEUE_SCHEMA = "shokker-youtube-wiki/ask-review-queue/v1";
  var ISSUE_KINDS = Object.freeze([
    "helpful",
    "wrong-source",
    "wrong-timestamp",
    "wrong-answer",
    "missing-receipt",
    "speaker-attribution",
    "misleading-wording",
    "other"
  ]);
  var POLICY = Object.freeze({
    mode: "append-only-review-proposal",
    corpusMutation: "NONE",
    canonMutation: "NONE",
    askMutation: "NONE",
    certificationEffect: "NONE",
    reviewerRequired: true,
    reviewerRole: "authorized human editor or creator",
    privateCaptionPayloadAccepted: false
  });
  var PACKET_KEYS = Object.freeze([
    "answer",
    "evidenceBoundary",
    "fingerprint",
    "issueKind",
    "mutationPolicy",
    "note",
    "observedAt",
    "packetId",
    "proposal",
    "query",
    "receipts",
    "schema",
    "version",
    "workflow"
  ]);
  var QUEUE_KEYS = Object.freeze([
    "fingerprint",
    "metrics",
    "packets",
    "policy",
    "schema",
    "version"
  ]);

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function clean(value, limit) {
    var text = value == null ? "" : String(value).replace(/\s+/g, " ").trim();
    return limit && text.length > limit ? text.slice(0, limit).trim() : text;
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function exactKeys(value, keys) {
    return stableJson(Object.keys(object(value)).sort()) === stableJson(keys);
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce(function (result, key) {
        if (value[key] !== undefined && typeof value[key] !== "function") {
          result[key] = stableValue(value[key]);
        }
        return result;
      }, {});
    }
    return value;
  }

  function stableJson(value, indentation) {
    return JSON.stringify(stableValue(value), null, indentation == null ? 0 : indentation);
  }

  function fnv1a(value) {
    var hash = 0x811c9dc5;
    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function iso(value) {
    var text = clean(value, 40);
    if (!text || Number.isNaN(Date.parse(text))) return "";
    return new Date(text).toISOString();
  }

  function normalizeReceipt(value) {
    var receipt = object(value);
    var sourceId = clean(receipt.sourceId || receipt.id, 128);
    var at = Number(receipt.at);
    if (!sourceId || !/^[A-Za-z0-9_-]{6,128}$/.test(sourceId)) return null;
    if (!Number.isFinite(at) || at < 0 || at > 604800) return null;
    return {
      source: clean(receipt.source, 48) || "unknown",
      sourceId: sourceId,
      at: Math.round(at),
      title: clean(receipt.title, 220),
      evidenceLevel: clean(receipt.evidenceLevel, 100) || "rendered Ask receipt"
    };
  }

  function normalizeReceipts(values) {
    var seen = Object.create(null);
    return array(values).map(normalizeReceipt).filter(Boolean)
      .filter(function (receipt) {
        var key = receipt.source + ":" + receipt.sourceId + ":" + receipt.at;
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      }).slice(0, 10);
  }

  function normalizeAnswer(value) {
    var answer = object(value);
    var count = Number(answer.resultCount);
    return {
      readout: clean(answer.readout, 180),
      summary: clean(answer.summary, 500),
      answerStatus: clean(answer.answerStatus, 100),
      intent: clean(answer.intent, 80),
      entity: clean(answer.entity, 160),
      resultCount: Number.isFinite(count) && count >= 0 ? Math.min(100, Math.round(count)) : 0
    };
  }

  function normalizeProposal(value) {
    var proposal = object(value);
    var sourceId = clean(proposal.sourceId, 128);
    var at = proposal.at == null || proposal.at === "" ? null : Number(proposal.at);
    if (sourceId && !/^[A-Za-z0-9_-]{6,128}$/.test(sourceId)) {
      throw new Error("Proposed source must be an exact source ID.");
    }
    if (at != null && (!Number.isFinite(at) || at < 0 || at > 604800)) {
      throw new Error("Proposed second is outside the supported source range.");
    }
    return {
      sourceId: sourceId,
      at: at == null ? null : Math.round(at),
      expectedAnswer: clean(proposal.expectedAnswer, 500),
      verificationStatus: "unverified user proposal"
    };
  }

  function evidenceBoundaryFor(receipts) {
    return {
      surface: "Ask the Tape",
      capturedFrom: "rendered public answer",
      transcriptIncluded: false,
      privateCaptionPayloadIncluded: false,
      dependencyClaim: receipts.length ? "exact rendered receipt coordinates only" : "query-level only",
      limitation: "This packet records a review request; it does not prove the proposed correction."
    };
  }

  function workflowFor(issueKind) {
    return {
      state: "proposed",
      nextStep: "human playback review",
      positiveSignal: issueKind === "helpful",
      applied: false
    };
  }

  function coreFor(packet) {
    return {
      schema: packet.schema,
      version: packet.version,
      query: packet.query,
      issueKind: packet.issueKind,
      note: packet.note,
      observedAt: packet.observedAt,
      answer: packet.answer,
      receipts: packet.receipts,
      proposal: packet.proposal,
      evidenceBoundary: packet.evidenceBoundary,
      workflow: packet.workflow,
      mutationPolicy: packet.mutationPolicy
    };
  }

  function fingerprint(packet) {
    return "fnv1a32:" + fnv1a(stableJson(coreFor(packet)));
  }

  function buildPacket(input) {
    var request = object(input);
    var query = clean(request.query, 500);
    var issueKind = clean(request.issueKind, 40).toLowerCase();
    var observedAt = iso(request.observedAt);
    if (!query) throw new Error("Ask review requires the exact submitted query.");
    if (ISSUE_KINDS.indexOf(issueKind) < 0) {
      throw new Error("Ask review issue kind is not supported.");
    }
    if (!observedAt) throw new Error("Ask review requires a valid observation time.");
    var receipts = normalizeReceipts(request.receipts);
    var packet = {
      schema: SCHEMA,
      version: VERSION,
      query: query,
      issueKind: issueKind,
      note: clean(request.note, 500),
      observedAt: observedAt,
      answer: normalizeAnswer(request.answer),
      receipts: receipts,
      proposal: normalizeProposal(request.proposal),
      evidenceBoundary: evidenceBoundaryFor(receipts),
      workflow: workflowFor(issueKind),
      mutationPolicy: clone(POLICY)
    };
    packet.fingerprint = fingerprint(packet);
    packet.packetId = "ask-review:" + packet.fingerprint.slice(-8);
    return packet;
  }

  function validatePacket(value) {
    var packet = object(value);
    var errors = [];
    if (!exactKeys(packet, PACKET_KEYS)) errors.push("shape");
    if (packet.schema !== SCHEMA) errors.push("schema");
    if (packet.version !== VERSION) errors.push("version");
    if (!clean(packet.query, 500) || packet.query !== clean(packet.query, 500)) errors.push("query");
    if (ISSUE_KINDS.indexOf(packet.issueKind) < 0) errors.push("issueKind");
    if (!iso(packet.observedAt) || packet.observedAt !== iso(packet.observedAt)) errors.push("observedAt");
    if (packet.note !== clean(packet.note, 500)) errors.push("note");
    var normalizedReceipts = normalizeReceipts(packet.receipts);
    if (stableJson(normalizedReceipts) !== stableJson(packet.receipts)) {
      errors.push("receipts");
    }
    if (stableJson(normalizeAnswer(packet.answer)) !== stableJson(packet.answer)) errors.push("answer");
    try {
      if (stableJson(normalizeProposal(packet.proposal)) !== stableJson(packet.proposal)) {
        errors.push("proposal");
      }
    } catch {
      errors.push("proposal");
    }
    if (stableJson(evidenceBoundaryFor(normalizedReceipts)) !==
        stableJson(packet.evidenceBoundary)) errors.push("evidenceBoundary");
    if (stableJson(packet.mutationPolicy) !== stableJson(POLICY)) errors.push("mutationPolicy");
    if (stableJson(workflowFor(packet.issueKind)) !== stableJson(packet.workflow)) errors.push("workflow");
    var expected = fingerprint(packet);
    if (packet.fingerprint !== expected) errors.push("fingerprint");
    if (packet.packetId !== "ask-review:" + expected.slice(-8)) errors.push("packetId");
    return {
      valid: errors.length === 0,
      errors: errors,
      fingerprint: expected
    };
  }

  function normalizeQueue(values) {
    var seen = Object.create(null);
    return array(values).filter(function (packet) {
      return validatePacket(packet).valid;
    }).filter(function (packet) {
      if (seen[packet.packetId]) return false;
      seen[packet.packetId] = true;
      return true;
    }).map(clone);
  }

  function summarize(values) {
    var packets = normalizeQueue(values);
    var byIssue = ISSUE_KINDS.reduce(function (result, kind) {
      result[kind] = 0;
      return result;
    }, {});
    var queries = Object.create(null);
    packets.forEach(function (packet) {
      byIssue[packet.issueKind] += 1;
      queries[packet.query.toLowerCase()] = true;
    });
    return {
      total: packets.length,
      needsReview: packets.filter(function (packet) {
        return packet.issueKind !== "helpful";
      }).length,
      helpful: byIssue.helpful,
      receiptBound: packets.filter(function (packet) {
        return packet.receipts.length > 0;
      }).length,
      queryOnly: packets.filter(function (packet) {
        return packet.receipts.length === 0;
      }).length,
      uniqueQueries: Object.keys(queries).length,
      byIssue: byIssue
    };
  }

  function exportQueue(values, indentation) {
    var packets = normalizeQueue(values);
    var payload = {
      schema: QUEUE_SCHEMA,
      version: VERSION,
      policy: clone(POLICY),
      metrics: summarize(packets),
      packets: packets
    };
    payload.fingerprint = "fnv1a32:" + fnv1a(stableJson(payload));
    return stableJson(payload, indentation == null ? 2 : indentation);
  }

  function validateQueue(value) {
    var payload;
    var errors = [];
    try {
      payload = typeof value === "string" ? JSON.parse(value) : clone(value);
    } catch {
      return { valid: false, errors: ["json"], fingerprint: "" };
    }
    payload = object(payload);
    if (!exactKeys(payload, QUEUE_KEYS)) errors.push("shape");
    if (payload.schema !== QUEUE_SCHEMA) errors.push("schema");
    if (payload.version !== VERSION) errors.push("version");
    if (stableJson(payload.policy) !== stableJson(POLICY)) errors.push("policy");
    var packets = array(payload.packets);
    var normalized = normalizeQueue(packets);
    if (normalized.length !== packets.length ||
        packets.some(function (packet) { return !validatePacket(packet).valid; })) {
      errors.push("packets");
    }
    if (stableJson(payload.metrics) !== stableJson(summarize(packets))) errors.push("metrics");
    var core = {
      schema: payload.schema,
      version: payload.version,
      policy: payload.policy,
      metrics: payload.metrics,
      packets: payload.packets
    };
    var expected = "fnv1a32:" + fnv1a(stableJson(core));
    if (payload.fingerprint !== expected) errors.push("fingerprint");
    return { valid: errors.length === 0, errors: errors, fingerprint: expected };
  }

  function create() {
    return Object.freeze({
      schema: SCHEMA,
      queueSchema: QUEUE_SCHEMA,
      version: VERSION,
      issueKinds: ISSUE_KINDS.slice(),
      policy: clone(POLICY),
      createPacket: buildPacket,
      validatePacket: validatePacket,
      summarize: summarize,
      validateQueue: validateQueue,
      exportPacket: function (packet, indentation) {
        var validation = validatePacket(packet);
        if (!validation.valid) throw new Error("Invalid Ask review packet: " + validation.errors.join(", "));
        return stableJson(packet, indentation == null ? 2 : indentation);
      },
      exportQueue: exportQueue
    });
  }

  root.WWAMAskReviewEngine = Object.freeze({
    create: create,
    schema: SCHEMA,
    version: VERSION
  });
}(typeof window !== "undefined" ? window : globalThis));
