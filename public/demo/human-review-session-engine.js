(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker.human-review-session/v1";
  var UNREVIEWED = "unreviewed";
  var STATUSES = Object.freeze([
    "needs-context",
    "wording-checked",
    "reject-candidate",
    "ready-for-creator-review"
  ]);
  var POSITIVE_STATUSES = new Set([
    "wording-checked",
    "ready-for-creator-review"
  ]);
  var AUTOMATION_DISCLOSURE =
    /\b(?:ai|automation|automated|algorithm|assistant|bot|claude|gpt(?:-\d+(?:\.\d+)?)?|llm|machine|model|system)\b/i;
  var FORBIDDEN_PUBLIC_LABELS =
    /\b(?:creator certified|canon approved|canon certified|speaker verified|confirmed speaker|promoted to canon)\b/i;
  var TRANSITIONS = Object.freeze({
    unreviewed: Object.freeze([
      "needs-context",
      "wording-checked",
      "reject-candidate"
    ]),
    "needs-context": Object.freeze([
      "wording-checked",
      "reject-candidate"
    ]),
    "wording-checked": Object.freeze([
      "ready-for-creator-review",
      "needs-context",
      "reject-candidate"
    ]),
    "ready-for-creator-review": Object.freeze([
      "needs-context",
      "reject-candidate"
    ]),
    "reject-candidate": Object.freeze([])
  });

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function clean(value) {
    return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
  }

  function lower(value) {
    return clean(value).toLowerCase();
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback || 0;
  }

  function unique(values) {
    return Array.from(new Set(array(values).map(clean).filter(Boolean)));
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce(function (result, key) {
          var nested = value[key];
          if (nested !== undefined && typeof nested !== "function") {
            result[key] = stableValue(nested);
          }
          return result;
        }, {});
    }
    return value;
  }

  function stableJson(value, indentation) {
    return JSON.stringify(
      stableValue(value),
      null,
      indentation == null ? 0 : indentation
    );
  }

  function fingerprint(value) {
    var source = String(value == null ? "" : value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function fail(code, message, details) {
    var error = new Error(message);
    error.name = "HumanReviewError";
    error.code = code;
    if (details && Object.keys(details).length) {
      error.details = stableValue(details);
    }
    throw error;
  }

  function validTimestamp(value) {
    var text = clean(value);
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
        text
      )
    ) {
      return false;
    }
    return Number.isFinite(Date.parse(text));
  }

  function requireTimestamp(value, path) {
    var text = clean(value);
    if (!validTimestamp(text)) {
      fail(
        "TIMESTAMP_REQUIRED",
        path +
          " must be a caller-supplied ISO 8601 timestamp with an explicit timezone.",
        { value: text }
      );
    }
    return text;
  }

  function compareId(a, b) {
    return clean(a && a.id).localeCompare(clean(b && b.id));
  }

  function duplicateId(records) {
    var seen = new Set();
    for (var index = 0; index < records.length; index += 1) {
      var id = clean(records[index] && records[index].id);
      if (!id || seen.has(id)) return id || "(missing)";
      seen.add(id);
    }
    return "";
  }

  function youtubeVideoId(value) {
    var match = clean(value).match(
      /^https:\/\/www\.youtube\.com\/watch\?(?:[^#\s]*&)?v=([A-Za-z0-9_-]{11})(?:&|$)/
    );
    return match ? match[1] : "";
  }

  function youtubeTimestamp(value) {
    var match = clean(value).match(/[?&]t=(\d+)s(?:&|$)/);
    return match ? Number(match[1]) : null;
  }

  function receiptTimeKey(sourceId, at) {
    return clean(sourceId) + "|" + Number(at).toFixed(3);
  }

  function requireInputs(input) {
    var options = object(input);
    var showcase = object(options.showcase);
    var trust = object(options.trust);
    var canon = object(options.canon);
    if (!Array.isArray(showcase.sources) || !Array.isArray(showcase.receipts)) {
      fail(
        "INPUT_INVALID",
        "Human Review Session requires showcase.sources and showcase.receipts arrays."
      );
    }
    if (!clean(showcase.inputFingerprint)) {
      fail(
        "INPUT_INVALID",
        "Human Review Session requires showcase.inputFingerprint."
      );
    }
    if (!Array.isArray(trust.reviewCandidates) || !clean(trust.inputFingerprint)) {
      fail(
        "INPUT_INVALID",
        "Human Review Session requires Trust reviewCandidates and inputFingerprint."
      );
    }
    if (!Array.isArray(canon.violations) || !clean(canon.fingerprint)) {
      fail(
        "INPUT_INVALID",
        "Human Review Session requires a deterministic Canon report."
      );
    }
    var duplicateSource = duplicateId(showcase.sources);
    var duplicateReceipt = duplicateId(showcase.receipts);
    if (duplicateSource || duplicateReceipt) {
      fail(
        "INPUT_INVALID",
        "Human Review Session refuses ambiguous source or receipt registries.",
        {
          duplicateSourceId: duplicateSource,
          duplicateReceiptId: duplicateReceipt
        }
      );
    }
    return options;
  }

  function sourceReceiptFingerprint(showcase) {
    var sourceProjection = array(showcase.sources)
      .map(function (source) {
        return {
          id: clean(source.id),
          title: clean(source.title),
          date: clean(source.date),
          duration: finite(source.duration) ? source.duration : null,
          url: clean(source.url),
          captioned: source.captioned !== false
        };
      })
      .sort(compareId);
    var receiptProjection = array(showcase.receipts)
      .map(function (receipt) {
        return {
          id: clean(receipt.id),
          sourceId: clean(receipt.sourceId),
          t: finite(receipt.t) ? receipt.t : null,
          type: clean(receipt.type),
          evidenceLevel: clean(receipt.evidenceLevel),
          excerpt: clean(receipt.excerpt),
          characterId: clean(receipt.characterId),
          performer: clean(receipt.performer)
        };
      })
      .sort(compareId);
    return fingerprint(
      "sources:" +
        stableJson(sourceProjection) +
        "::receipts:" +
        stableJson(receiptProjection)
    );
  }

  function normalizeTarget(target) {
    var value = object(target);
    return {
      type: clean(value.type),
      id: clean(value.id),
      path: clean(value.path)
    };
  }

  function evidenceId(evidence) {
    var value = object(evidence);
    return (
      clean(value.receiptId || value.id) ||
      "evidence:" +
        fingerprint(
          [
            clean(value.sourceId),
            finite(value.t) ? value.t : "",
            clean(value.url),
            clean(value.excerpt)
          ].join("|")
        )
    );
  }

  function resolveCanonicalReceipt(value, registry) {
    var requestedIds = unique([value.receiptId, value.id]);
    for (var index = 0; index < requestedIds.length; index += 1) {
      if (registry.receiptById.has(requestedIds[index])) {
        return registry.receiptById.get(requestedIds[index]);
      }
    }
    var sourceId = clean(value.sourceId);
    var at = finite(value.t) ? value.t : finite(value.at) ? value.at : null;
    if (!sourceId || at == null) return null;
    var matches =
      registry.receiptByTime.get(receiptTimeKey(sourceId, at)) || [];
    return matches.length === 1 ? matches[0] : null;
  }

  function normalizeEvidence(evidence, registry) {
    var value = object(evidence);
    var requestedId = evidenceId(value);
    var canonical = resolveCanonicalReceipt(value, registry);
    var canonicalId = clean(canonical && canonical.id);
    var sourceId = clean(canonical && canonical.sourceId);
    var t = canonical && finite(canonical.t) ? canonical.t : null;
    var url = clean(canonical && canonical.url);
    var source = registry.sourceById.get(sourceId);
    var issues = [];

    if (!canonical || !canonicalId) issues.push("CANONICAL_RECEIPT_NOT_FOUND");
    if (!source) issues.push("SOURCE_NOT_FOUND");
    if (t == null || t < 0) issues.push("TIMESTAMP_INVALID");
    if (!source || !finite(source.duration)) {
      issues.push("SOURCE_DURATION_UNAVAILABLE");
    } else if (t != null && t >= source.duration) {
      issues.push("TIMESTAMP_OUT_OF_RANGE");
    }
    if (
      !sourceId ||
      youtubeVideoId(url) !== sourceId ||
      youtubeTimestamp(url) !== Math.round(number(t, -1))
    ) {
      issues.push("CANONICAL_URL_INVALID");
    }

    var suppliedSourceId = clean(value.sourceId);
    var suppliedAt = finite(value.t)
      ? value.t
      : finite(value.at)
        ? value.at
        : null;
    var suppliedUrl = clean(value.url);
    if (canonical && suppliedSourceId && suppliedSourceId !== sourceId) {
      issues.push("SUPPLIED_SOURCE_MISMATCH");
    }
    if (
      canonical &&
      suppliedAt != null &&
      (t == null || Math.abs(suppliedAt - t) > 0.001)
    ) {
      issues.push("SUPPLIED_TIMESTAMP_MISMATCH");
    }
    if (
      canonical &&
      suppliedUrl &&
      (youtubeVideoId(suppliedUrl) !== sourceId ||
        youtubeTimestamp(suppliedUrl) !== Math.round(number(t, -1)))
    ) {
      issues.push("SUPPLIED_URL_MISMATCH");
    }

    var normalized = {
      id: canonicalId || requestedId,
      requestedEvidenceId: requestedId,
      receiptId: canonicalId,
      sourceId: sourceId || suppliedSourceId,
      t: t == null ? suppliedAt : t,
      url: url || suppliedUrl,
      excerpt: clean(
        value.excerpt ||
          value.quote ||
          (canonical && (canonical.excerpt || canonical.quote))
      ),
      evidenceLevel: clean(
        value.evidenceLevel || (canonical && canonical.evidenceLevel)
      ),
      eligibleForProgression: issues.length === 0,
      sourceResolved: Boolean(source),
      showcaseReceipt: Boolean(canonical),
      canonicalReceipt: Boolean(canonical),
      validationIssues: unique(issues)
    };
    normalized.fingerprint = fingerprint(
      stableJson({
        id: normalized.id,
        requestedEvidenceId: normalized.requestedEvidenceId,
        sourceId: normalized.sourceId,
        t: normalized.t,
        url: normalized.url,
        excerpt: normalized.excerpt,
        evidenceLevel: normalized.evidenceLevel,
        canonicalReceipt: normalized.canonicalReceipt,
        validationIssues: normalized.validationIssues
      })
    );
    return normalized;
  }

  function candidateFingerprint(candidate) {
    var projection = {
      id: candidate.id,
      origin: candidate.origin,
      originalId: candidate.originalId,
      kind: candidate.kind,
      severity: candidate.severity,
      title: candidate.title,
      summary: candidate.summary,
      target: candidate.target,
      claim: candidate.claim,
      recommendation: candidate.recommendation,
      canonBlocked: candidate.canonBlocked,
      evidence: candidate.evidence
    };
    return fingerprint(stableJson(projection));
  }

  function normalizeTrustCandidate(candidate, evidenceRegistry) {
    var value = object(candidate);
    var originalId = clean(value.id);
    var evidence = array(value.evidence)
      .map(function (item) {
        return normalizeEvidence(item, evidenceRegistry);
      })
      .sort(compareId);
    var duplicateEvidence = duplicateId(evidence);
    if (duplicateEvidence) {
      fail(
        "INPUT_INVALID",
        "Trust candidate has an ambiguous evidence ledger.",
        { candidateId: originalId, evidenceId: duplicateEvidence }
      );
    }
    var normalized = {
      id: "trust:" + originalId,
      origin: "trust",
      originalId: originalId,
      kind: clean(value.kind),
      severity: clean(value.severity).toUpperCase() || "UNSPECIFIED",
      title: clean(value.title) || originalId,
      summary: clean(value.summary),
      target: normalizeTarget(value.target),
      claim: clean(value.claim),
      recommendation: clean(value.recommendation),
      canonBlocked: value.canonBlocked !== false,
      evidence: evidence
    };
    normalized.fingerprint = candidateFingerprint(normalized);
    return normalized;
  }

  function normalizeCanonCandidate(violation, evidenceRegistry) {
    var value = object(violation);
    var details = object(value.details);
    var possibleReceiptId = clean(details.receiptId || value.id);
    var receipt = evidenceRegistry.receiptById.get(possibleReceiptId);
    var evidence = [];
    if (receipt) {
      evidence.push(
        normalizeEvidence(
          {
            receiptId: receipt.id,
            sourceId: receipt.sourceId,
            t: receipt.t,
            url: receipt.url,
            excerpt: receipt.excerpt,
            evidenceLevel: receipt.evidenceLevel
          },
          evidenceRegistry
        )
      );
    } else if (details.sourceId && finite(details.t)) {
      evidence.push(
        normalizeEvidence(
          {
            receiptId: possibleReceiptId,
            sourceId: details.sourceId,
            t: details.t,
            url: details.url,
            excerpt: details.excerpt,
            evidenceLevel: details.evidenceLevel
          },
          evidenceRegistry
        )
      );
    }
    var originalId = [
      clean(value.code) || "CANON_REVIEW",
      clean(value.id) || "unowned",
      fingerprint(
        [
          clean(value.domain),
          clean(value.path),
          clean(value.message)
        ].join("|")
      )
    ].join(":");
    var normalized = {
      id: "canon:" + originalId,
      origin: "canon",
      originalId: originalId,
      kind: lower(value.code) || "canon-review",
      severity: clean(value.severity).toUpperCase() || "UNSPECIFIED",
      title:
        (clean(value.code) || "CANON REVIEW") +
        (clean(value.id) ? " — " + clean(value.id) : ""),
      summary: clean(value.message),
      target: {
        type: clean(value.domain),
        id: clean(value.id),
        path: clean(value.path)
      },
      claim: "",
      recommendation:
        value.severity === "error"
          ? "Resolve this integrity error before release."
          : "Keep this boundary visible until a human review is complete.",
      canonBlocked: value.severity === "error",
      evidence: evidence
    };
    normalized.fingerprint = candidateFingerprint(normalized);
    return normalized;
  }

  function buildCandidateRegistry(options) {
    var showcase = object(options.showcase);
    var sourceById = new Map(
      array(showcase.sources).map(function (source) {
        return [clean(source.id), source];
      })
    );
    var receiptById = new Map(
      array(showcase.receipts).map(function (receipt) {
        return [clean(receipt.id), receipt];
      })
    );
    var receiptByTime = new Map();
    receiptById.forEach(function (receipt) {
      if (!clean(receipt.sourceId) || !finite(receipt.t)) return;
      var key = receiptTimeKey(receipt.sourceId, receipt.t);
      if (!receiptByTime.has(key)) receiptByTime.set(key, []);
      receiptByTime.get(key).push(receipt);
    });
    var evidenceRegistry = {
      sourceById: sourceById,
      receiptById: receiptById,
      receiptByTime: receiptByTime
    };
    var candidates = array(options.trust.reviewCandidates)
      .map(function (candidate) {
        return normalizeTrustCandidate(candidate, evidenceRegistry);
      })
      .concat(
        array(options.canon.violations).map(function (violation) {
          return normalizeCanonCandidate(violation, evidenceRegistry);
        })
      )
      .sort(compareId);
    var duplicateCandidate = duplicateId(candidates);
    if (duplicateCandidate) {
      fail(
        "INPUT_INVALID",
        "Human Review Session refuses duplicate candidate IDs.",
        { candidateId: duplicateCandidate }
      );
    }
    var byId = new Map(
      candidates.map(function (candidate) {
        return [candidate.id, candidate];
      })
    );
    var aliases = new Map();
    candidates.forEach(function (candidate) {
      var original = clean(candidate.originalId);
      if (!aliases.has(original)) aliases.set(original, []);
      aliases.get(original).push(candidate.id);
    });
    return {
      candidates: candidates,
      byId: byId,
      aliases: aliases,
      fingerprint: fingerprint(
        stableJson(
          candidates.map(function (candidate) {
            return {
              id: candidate.id,
              fingerprint: candidate.fingerprint
            };
          })
        )
      )
    };
  }

  function buildCorpusContext(input) {
    var options = requireInputs(input);
    var showcase = object(options.showcase);
    var registry = buildCandidateRegistry(options);
    var sourceFingerprint = sourceReceiptFingerprint(showcase);
    var context = {
      snapshotDate:
        clean(options.trust.snapshotDate) ||
        clean(options.canon.snapshotDate) ||
        clean(showcase.snapshotDate),
      showcaseInputFingerprint: clean(showcase.inputFingerprint),
      trustInputFingerprint: clean(options.trust.inputFingerprint),
      canonReportFingerprint: clean(options.canon.fingerprint),
      sourceReceiptFingerprint: sourceFingerprint,
      candidateSetFingerprint: registry.fingerprint
    };
    context.reviewInputFingerprint = fingerprint(stableJson(context));
    return { context: context, registry: registry };
  }

  function normalizeSession(session) {
    var value = object(session);
    var id = clean(value.id);
    var name = clean(value.name);
    var createdAt = requireTimestamp(value.createdAt, "session.createdAt");
    if (!id || !name) {
      fail(
        "SESSION_INVALID",
        "Human Review Session requires an explicit local session ID and name."
      );
    }
    return { id: id, name: name, createdAt: createdAt };
  }

  function resolveCandidateId(registry, requestedId) {
    var id = clean(requestedId);
    if (registry.byId.has(id)) return id;
    var aliases = registry.aliases.get(id);
    if (aliases && aliases.length === 1) return aliases[0];
    if (aliases && aliases.length > 1) {
      fail(
        "CANDIDATE_AMBIGUOUS",
        "Candidate alias resolves to more than one review source.",
        { candidateId: id, matches: aliases }
      );
    }
    fail("CANDIDATE_NOT_FOUND", "Review candidate does not exist.", {
      candidateId: id
    });
  }

  function statusFor(ledger, candidateId) {
    for (var index = ledger.length - 1; index >= 0; index -= 1) {
      if (ledger[index].candidateId === candidateId) {
        return ledger[index].after.status;
      }
    }
    return UNREVIEWED;
  }

  function lastDecisionFor(ledger, candidateId) {
    for (var index = ledger.length - 1; index >= 0; index -= 1) {
      if (ledger[index].candidateId === candidateId) return ledger[index];
    }
    return null;
  }

  function positiveStatus(status) {
    return POSITIVE_STATUSES.has(status);
  }

  function assertNoCertification(action, candidate) {
    var value = object(action);
    var claims = object(value.claims);
    var blockedBoolean =
      value.promoteToCanon === true ||
      value.certify === true ||
      value.certified === true ||
      value.creatorCertified === true ||
      value.canon === true ||
      claims.canonPromotion === true ||
      claims.creatorCertification === true ||
      claims.speakerCertification === true;
    var blockedText = clean(
      value.speaker ||
        value.speakerCredit ||
        value.speakerAttribution ||
        value.performer ||
        value.canonStatus ||
        claims.speakerAttribution ||
        claims.canonStatus
    );
    if (blockedBoolean || blockedText) {
      fail(
        "CERTIFICATION_UNSUPPORTED",
        "A local review session cannot certify a speaker, creator decision, or canon promotion.",
        { candidateId: candidate.id }
      );
    }
    if (FORBIDDEN_PUBLIC_LABELS.test(clean(value.proposedWording))) {
      fail(
        "CERTIFICATION_UNSUPPORTED",
        "Proposed wording contains a certification label this session cannot grant.",
        { candidateId: candidate.id }
      );
    }
  }

  function normalizeReviewer(reviewer) {
    var value = object(reviewer);
    var role = clean(value.role);
    if (!role) {
      fail(
        "HUMAN_REVIEWER_REQUIRED",
        "Every decision requires a reviewer role.",
        { role: role }
      );
    }
    if (value.humanAttested !== true) {
      fail(
        "HUMAN_ATTESTATION_REQUIRED",
        "Every decision requires the caller to explicitly attest that the reviewer is human; this is not identity verification.",
        { role: role, humanAttested: value.humanAttested === true }
      );
    }
    if (AUTOMATION_DISCLOSURE.test(role)) {
      fail(
        "HUMAN_ATTESTATION_CONFLICT",
        "The reviewer role identifies automation and conflicts with the caller's human attestation.",
        { role: role }
      );
    }
    return {
      role: role,
      name: clean(value.name),
      id: clean(value.id),
      humanAttested: true,
      attestationStatus: "CALLER-ATTESTED / NOT IDENTITY-VERIFIED"
    };
  }

  function normalizeEvidenceSelection(candidate, values, required) {
    var requested = unique(values);
    if (required && !requested.length) {
      fail(
        "EVIDENCE_REQUIRED",
        "Positive review progression requires at least one candidate evidence receipt.",
        { candidateId: candidate.id }
      );
    }
    var allowed = new Map(
      candidate.evidence.map(function (evidence) {
        return [evidence.id, evidence];
      })
    );
    requested.forEach(function (id) {
      var evidence = allowed.get(id);
      if (!evidence || !evidence.eligibleForProgression) {
        fail(
          "EVIDENCE_UNSUPPORTED",
          "Selected evidence is not a registered canonical playable receipt attached to this candidate.",
          { candidateId: candidate.id, evidenceReceiptId: id }
        );
      }
    });
    return requested.sort();
  }

  function compareTimestamp(left, right) {
    return Date.parse(left) - Date.parse(right);
  }

  function validateTransition(from, to, candidateId) {
    if (STATUSES.indexOf(to) < 0) {
      fail("STATUS_INVALID", "Unsupported human-review status.", {
        candidateId: candidateId,
        status: to
      });
    }
    if (array(TRANSITIONS[from]).indexOf(to) < 0) {
      fail(
        "TRANSITION_INVALID",
        "Human-review status transition is not allowed.",
        { candidateId: candidateId, from: from, to: to }
      );
    }
  }

  function decisionProof(record) {
    var projection = Object.assign({}, record);
    delete projection.proofFingerprint;
    return fingerprint("decision:" + stableJson(projection));
  }

  function snapshotProof(snapshot) {
    var projection = Object.assign({}, snapshot);
    delete projection.snapshotFingerprint;
    return fingerprint("snapshot:" + stableJson(projection));
  }

  function metricsFor(registry, ledger) {
    var statusCounts = {
      unreviewed: 0,
      "needs-context": 0,
      "wording-checked": 0,
      "reject-candidate": 0,
      "ready-for-creator-review": 0
    };
    registry.candidates.forEach(function (candidate) {
      statusCounts[statusFor(ledger, candidate.id)] += 1;
    });
    return {
      candidates: registry.candidates.length,
      trustCandidates: registry.candidates.filter(function (candidate) {
        return candidate.origin === "trust";
      }).length,
      canonCandidates: registry.candidates.filter(function (candidate) {
        return candidate.origin === "canon";
      }).length,
      decisions: ledger.length,
      reviewedCandidates:
        registry.candidates.length - statusCounts.unreviewed,
      unreviewed: statusCounts.unreviewed,
      needsContext: statusCounts["needs-context"],
      wordingChecked: statusCounts["wording-checked"],
      rejected: statusCounts["reject-candidate"],
      readyForCreatorReview:
        statusCounts["ready-for-creator-review"],
      positiveProgressions: ledger.filter(function (decision) {
        return positiveStatus(decision.after.status);
      }).length,
      evidenceBackedDecisions: ledger.filter(function (decision) {
        return decision.after.evidenceReceiptIds.length > 0;
      }).length,
      canonMutations: 0,
      speakerCertifications: 0,
      creatorCertifications: 0,
      callerAttestedHumanDecisions: ledger.filter(function (decision) {
        return (
          decision.reviewer &&
          decision.reviewer.humanAttested === true
        );
      }).length,
      identityVerifiedHumanDecisions: 0,
      engineGeneratedDecisions: 0
    };
  }

  function createApi(input, sessionInput) {
    var options = requireInputs(input);
    var session = normalizeSession(sessionInput);
    var built = buildCorpusContext(options);
    var baselineContext = built.context;
    var registry = built.registry;
    var ledger = [];

    function assertCorpusUnchanged() {
      var current = buildCorpusContext(options);
      if (
        current.context.reviewInputFingerprint !==
        baselineContext.reviewInputFingerprint
      ) {
        fail(
          "CORPUS_CHANGED",
          "Trust, Canon, source, receipt, or candidate data changed during this review session.",
          {
            expected: baselineContext.reviewInputFingerprint,
            actual: current.context.reviewInputFingerprint
          }
        );
      }
    }

    function recordDecision(requestedId, action) {
      assertCorpusUnchanged();
      var candidateId = resolveCandidateId(registry, requestedId);
      var candidate = registry.byId.get(candidateId);
      var value = object(action);
      var to = lower(value.status);
      var from = statusFor(ledger, candidateId);
      var previous = lastDecisionFor(ledger, candidateId);
      validateTransition(from, to, candidateId);
      assertNoCertification(value, candidate);
      var at = requireTimestamp(value.at, "decision.at");
      if (compareTimestamp(at, session.createdAt) < 0) {
        fail(
          "TIMESTAMP_INVALID",
          "Decision timestamp cannot precede the session timestamp.",
          { candidateId: candidateId, at: at, createdAt: session.createdAt }
        );
      }
      if (previous && compareTimestamp(at, previous.at) <= 0) {
        fail(
          "TIMESTAMP_INVALID",
          "A candidate's decision timestamps must increase strictly.",
          {
            candidateId: candidateId,
            at: at,
            previousAt: previous.at
          }
        );
      }
      var reviewer = normalizeReviewer(value.reviewer);
      var notes = clean(value.notes);
      if (!notes) {
        fail(
          "NOTES_REQUIRED",
          "Every human-review decision requires reviewer notes.",
          { candidateId: candidateId }
        );
      }
      var evidenceReceiptIds = normalizeEvidenceSelection(
        candidate,
        value.evidenceReceiptIds,
        positiveStatus(to)
      );
      var previousWording = previous
        ? clean(previous.after.proposedWording)
        : clean(candidate.claim);
      var proposedWording = clean(value.proposedWording);
      if (to === "wording-checked" && !proposedWording) {
        fail(
          "WORDING_REQUIRED",
          "wording-checked requires the exact reviewed wording.",
          { candidateId: candidateId }
        );
      }
      if (to === "ready-for-creator-review") {
        if (proposedWording && proposedWording !== previousWording) {
          fail(
            "WORDING_CHANGED_AFTER_CHECK",
            "Ready-for-creator-review cannot silently change wording after the wording-check step.",
            { candidateId: candidateId }
          );
        }
        proposedWording = previousWording;
      } else if (!proposedWording) {
        proposedWording = previousWording;
      }

      var sequence = ledger.length + 1;
      var previousProof = ledger.length
        ? ledger[ledger.length - 1].proofFingerprint
        : "";
      var record = {
        schema: "shokker.human-review-decision/v1",
        id:
          "review-decision:" +
          String(sequence).padStart(4, "0") +
          ":" +
          fingerprint(
            [
              session.id,
              candidateId,
              from,
              to,
              at,
              previousProof
            ].join("|")
          ),
        sequence: sequence,
        sessionId: session.id,
        candidateId: candidateId,
        candidateOrigin: candidate.origin,
        candidateFingerprint: candidate.fingerprint,
        sourceReceiptFingerprint:
          baselineContext.sourceReceiptFingerprint,
        reviewInputFingerprint:
          baselineContext.reviewInputFingerprint,
        at: at,
        reviewer: reviewer,
        before: {
          status: from,
          proposedWording: previousWording,
          notes: previous ? previous.after.notes : "",
          evidenceReceiptIds: previous
            ? previous.after.evidenceReceiptIds.slice()
            : []
        },
        after: {
          status: to,
          proposedWording: proposedWording,
          notes: notes,
          evidenceReceiptIds: evidenceReceiptIds
        },
        transition: {
          from: from,
          to: to,
          positiveProgression: positiveStatus(to)
        },
        previousDecisionFingerprint: previousProof,
        boundary: {
          effect: "LOCAL REVIEW ROUTING ONLY",
          canonMutated: false,
          speakerCertified: false,
          creatorCertified: false,
          candidateSourceMutated: false,
          callerAttestedHuman: true,
          humanIdentityVerified: false,
          engineGenerated: false
        }
      };
      record.proofFingerprint = decisionProof(record);
      ledger.push(record);
      return clone(record);
    }

    function getCandidate(requestedId) {
      var id = resolveCandidateId(registry, requestedId);
      var candidate = clone(registry.byId.get(id));
      candidate.reviewStatus = statusFor(ledger, id);
      candidate.historyCount = ledger.filter(function (decision) {
        return decision.candidateId === id;
      }).length;
      return candidate;
    }

    function getQueue(filters) {
      var request = object(filters);
      var status = lower(request.status);
      var origin = lower(request.origin);
      var kind = lower(request.kind);
      var severity = lower(request.severity);
      var query = lower(request.query);
      var values = registry.candidates
        .filter(function (candidate) {
          var currentStatus = statusFor(ledger, candidate.id);
          return (
            (!status || currentStatus === status) &&
            (!origin || candidate.origin === origin) &&
            (!kind || lower(candidate.kind) === kind) &&
            (!severity || lower(candidate.severity) === severity) &&
            (!query ||
              lower(
                [
                  candidate.id,
                  candidate.title,
                  candidate.summary,
                  candidate.claim,
                  candidate.recommendation
                ].join(" ")
              ).indexOf(query) >= 0)
          );
        })
        .map(function (candidate) {
          var result = clone(candidate);
          result.reviewStatus = statusFor(ledger, candidate.id);
          return result;
        });
      if (request.limit != null) {
        values = values.slice(
          0,
          Math.max(0, Math.floor(number(request.limit)))
        );
      }
      return values;
    }

    function getLedger(candidateId) {
      var selected = clean(candidateId);
      if (!selected) return clone(ledger);
      var resolved = resolveCandidateId(registry, selected);
      return clone(
        ledger.filter(function (decision) {
          return decision.candidateId === resolved;
        })
      );
    }

    function snapshot() {
      assertCorpusUnchanged();
      var value = {
        schema: SCHEMA,
        version: VERSION,
        session: clone(session),
        corpus: clone(baselineContext),
        policy: {
          localOnly: true,
          mutatesCanon: false,
          certifiesSpeakers: false,
          certifiesCreators: false,
          timestampsGeneratedByEngine: false,
          positiveProgressionRequiresEvidence: true,
          restoreFailsOnCorpusChange: true,
          callerAttestationRequired: true,
          attestationIsIdentityVerification: false,
          engineGeneratedDecisions: false
        },
        candidateFingerprints: registry.candidates.map(function (candidate) {
          return {
            id: candidate.id,
            fingerprint: candidate.fingerprint
          };
        }),
        ledger: clone(ledger),
        metrics: metricsFor(registry, ledger)
      };
      value.snapshotFingerprint = snapshotProof(value);
      return value;
    }

    function exportJson(indentation) {
      var spaces =
        indentation == null
          ? 2
          : Math.max(0, Math.min(8, Math.floor(number(indentation))));
      return stableJson(snapshot(), spaces);
    }

    function exportMarkdown() {
      var saved = snapshot();
      var lines = [
        "# Human Review Session — " + saved.session.name,
        "",
        "- Session ID: `" + saved.session.id + "`",
        "- Created: " + saved.session.createdAt,
        "- Corpus fingerprint: `" +
          saved.corpus.reviewInputFingerprint +
          "`",
        "- Source/receipt fingerprint: `" +
          saved.corpus.sourceReceiptFingerprint +
          "`",
        "- Snapshot fingerprint: `" +
          saved.snapshotFingerprint +
          "`",
        "- Boundary: local review routing only; no canon mutation or speaker/creator certification.",
        "",
        "## Metrics",
        "",
        "- Candidates: " + saved.metrics.candidates,
        "- Decisions: " + saved.metrics.decisions,
        "- Unreviewed: " + saved.metrics.unreviewed,
        "- Needs context: " + saved.metrics.needsContext,
        "- Wording checked: " + saved.metrics.wordingChecked,
        "- Rejected: " + saved.metrics.rejected,
        "- Ready for creator review: " +
          saved.metrics.readyForCreatorReview,
        "- Caller-attested human decisions: " +
          saved.metrics.callerAttestedHumanDecisions,
        "- Identity-verified human decisions: 0",
        "- Engine-generated decisions: 0",
        "- Canon mutations: 0",
        "- Speaker certifications: 0",
        "- Creator certifications: 0",
        "",
        "## Decision Ledger",
        ""
      ];
      if (!saved.ledger.length) {
        lines.push("_No human decisions recorded._");
      }
      saved.ledger.forEach(function (decision) {
        var candidate = registry.byId.get(decision.candidateId);
        lines.push(
          "### " +
            String(decision.sequence).padStart(3, "0") +
            " — " +
            clean(candidate && candidate.title)
        );
        lines.push("");
        lines.push("- Candidate: `" + decision.candidateId + "`");
        lines.push(
          "- Transition: `" +
            decision.before.status +
            "` → `" +
            decision.after.status +
            "`"
        );
        lines.push(
          "- Reviewer: " +
            decision.reviewer.role +
            (decision.reviewer.name
              ? " — " + decision.reviewer.name
              : "")
        );
        lines.push(
          "- Reviewer attestation: " +
            decision.reviewer.attestationStatus
        );
        lines.push("- Timestamp: " + decision.at);
        lines.push(
          "- Evidence receipts: " +
            (decision.after.evidenceReceiptIds.length
              ? decision.after.evidenceReceiptIds
                  .map(function (id) {
                    return "`" + id + "`";
                  })
                  .join(", ")
              : "none")
        );
        lines.push(
          "- Reviewed wording: " +
            (decision.after.proposedWording || "_none_")
        );
        lines.push("- Notes: " + decision.after.notes);
        lines.push(
          "- Decision proof: `" + decision.proofFingerprint + "`"
        );
        lines.push(
          "- Effect: local routing only; canon and attribution remain unchanged."
        );
        lines.push("");
      });
      return lines.join("\n").replace(/\n+$/, "") + "\n";
    }

    var api = {
      engine: "SHOKKER HUMAN REVIEW SESSION",
      version: VERSION,
      schema: SCHEMA,
      session: clone(session),
      corpus: clone(baselineContext),
      policy: {
        localOnly: true,
        allowedStatuses: STATUSES.slice(),
        positiveStatuses: Array.from(POSITIVE_STATUSES),
        mutatesCanon: false,
        certificationAvailable: false,
        callerAttestationRequired: true,
        attestationIsIdentityVerification: false,
        engineGeneratedDecisions: false
      },
      getCandidate: getCandidate,
      getQueue: getQueue,
      getLedger: getLedger,
      getMetrics: function () {
        return metricsFor(registry, ledger);
      },
      recordDecision: recordDecision,
      snapshot: snapshot,
      exportJSON: exportJson,
      exportMarkdown: exportMarkdown
    };
    Object.defineProperty(api, "metrics", {
      enumerable: true,
      get: function () {
        return metricsFor(registry, ledger);
      }
    });
    return api;
  }

  function create(input) {
    var options = object(input);
    return createApi(options, options.session);
  }

  function restore(saved, input) {
    var snapshot = object(saved);
    if (snapshot.schema !== SCHEMA || snapshot.version !== VERSION) {
      fail(
        "SNAPSHOT_INVALID",
        "Human Review Session snapshot schema or version is unsupported."
      );
    }
    if (
      !clean(snapshot.snapshotFingerprint) ||
      snapshot.snapshotFingerprint !== snapshotProof(snapshot)
    ) {
      fail(
        "SNAPSHOT_TAMPERED",
        "Human Review Session snapshot fingerprint does not match its contents."
      );
    }
    var options = Object.assign({}, object(input), {
      session: clone(snapshot.session)
    });
    var api = create(options);
    if (
      stableJson(api.corpus) !== stableJson(snapshot.corpus) ||
      api.corpus.reviewInputFingerprint !==
        snapshot.corpus.reviewInputFingerprint
    ) {
      fail(
        "CORPUS_CHANGED",
        "Snapshot cannot be restored against a changed Trust, Canon, source, receipt, or candidate corpus.",
        {
          expected: clean(
            snapshot.corpus && snapshot.corpus.reviewInputFingerprint
          ),
          actual: clean(api.corpus.reviewInputFingerprint)
        }
      );
    }
    var currentCandidateFingerprints = api
      .getQueue({})
      .map(function (candidate) {
        return {
          id: candidate.id,
          fingerprint: candidate.fingerprint
        };
      });
    if (
      stableJson(currentCandidateFingerprints) !==
      stableJson(snapshot.candidateFingerprints)
    ) {
      fail(
        "CORPUS_CHANGED",
        "Snapshot candidate fingerprints no longer match the current review queue."
      );
    }
    array(snapshot.ledger).forEach(function (decision, index) {
      var candidate = api.getCandidate(decision.candidateId);
      if (
        decision.sequence !== index + 1 ||
        decision.sessionId !== snapshot.session.id ||
        decision.candidateFingerprint !== candidate.fingerprint ||
        decision.sourceReceiptFingerprint !==
          snapshot.corpus.sourceReceiptFingerprint ||
        decision.reviewInputFingerprint !==
          snapshot.corpus.reviewInputFingerprint ||
        decision.proofFingerprint !== decisionProof(decision)
      ) {
        fail(
          "SNAPSHOT_TAMPERED",
          "Decision ledger proof or corpus binding is invalid.",
          { sequence: index + 1 }
        );
      }
      var replayed = api.recordDecision(decision.candidateId, {
        status: decision.after.status,
        at: decision.at,
        reviewer: decision.reviewer,
        notes: decision.after.notes,
        evidenceReceiptIds: decision.after.evidenceReceiptIds,
        proposedWording: decision.after.proposedWording
      });
      if (stableJson(replayed) !== stableJson(decision)) {
        fail(
          "SNAPSHOT_TAMPERED",
          "Decision ledger cannot be reproduced from its recorded human inputs.",
          { sequence: index + 1 }
        );
      }
      if (
        replayed.boundary.canonMutated ||
        replayed.boundary.speakerCertified ||
        replayed.boundary.creatorCertified ||
        replayed.boundary.candidateSourceMutated ||
        replayed.boundary.callerAttestedHuman !== true ||
        replayed.boundary.humanIdentityVerified !== false ||
        replayed.boundary.engineGenerated !== false
      ) {
        fail(
          "SNAPSHOT_TAMPERED",
          "Decision ledger attempts to cross the local-review boundary.",
          { sequence: index + 1 }
        );
      }
    });
    var rebuilt = api.snapshot();
    if (stableJson(rebuilt) !== stableJson(snapshot)) {
      fail(
        "SNAPSHOT_TAMPERED",
        "Restored Human Review Session does not exactly match its snapshot."
      );
    }
    return api;
  }

  root.WWAMHumanReviewSession = Object.freeze({
    VERSION: VERSION,
    SCHEMA: SCHEMA,
    STATUSES: STATUSES,
    TRANSITIONS: TRANSITIONS,
    create: create,
    restore: restore
  });
})(typeof window !== "undefined" ? window : globalThis);
