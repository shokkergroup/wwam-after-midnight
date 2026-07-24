import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "correction-ripple-engine.js",
    "trust-engine.js",
    "lore-engine.js",
    "creator-studio-engine.js",
    "canon-integrity-engine.js",
    "human-review-session-engine.js"
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file
    });
  });
  return sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildCurrent(window) {
  const input = {
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  };
  const showcase = window.WWAMShowcaseEngine.create(input);
  const trust = window.WWAMTrustEngine.create({ ...input, showcase });
  const lore = window.WWAMLoreEngine.create(input);
  const clip = window.WWAMCreatorClipLab.create({ showcase });
  const canon = window.WWAMCanonIntegrity.audit({
    ...input,
    showcase,
    lore,
    clip
  });
  return { showcase, trust, canon };
}

const window = load();
const current = buildCurrent(window);

function freshInput() {
  return plain(current);
}

function sessionInput(overrides = {}) {
  return {
    ...freshInput(),
    session: {
      id: "review-session-v52",
      name: "V5.2 Accuracy Pass",
      createdAt: "2026-07-23T23:00:00-04:00",
      ...(overrides.session || {})
    },
    ...Object.fromEntries(
      Object.entries(overrides).filter(([key]) => key !== "session")
    )
  };
}

function humanReviewer(role, details = {}) {
  return { role, humanAttested: true, ...details };
}

const COURT =
  "trust:court-review:court:film-a-nightmare-on-elm-street-1984";
const WORDING =
  "Machine-surfaced argument board; human context review remains required.";

function evidenceFor(session, candidateId = COURT) {
  const evidence = session
    .getCandidate(candidateId)
    .evidence.find((item) => item.eligibleForProgression);
  assert.ok(evidence, `expected eligible evidence for ${candidateId}`);
  return evidence.id;
}

function checkedDecision(session, at = "2026-07-23T23:05:00-04:00") {
  const evidenceReceiptId = evidenceFor(session);
  return session.recordDecision(COURT, {
    status: "wording-checked",
    at,
    reviewer: humanReviewer("editor", { name: "Ricky" }),
    notes:
      "Checked the wording against the selected receipt and preserved the inference boundary.",
    evidenceReceiptIds: [evidenceReceiptId],
    proposedWording: WORDING
  });
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        if (key !== undefined && typeof value[key] !== "function") {
          result[key] = stableValue(value[key]);
        }
        return result;
      }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function fingerprint(value) {
  const source = String(value ?? "");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (`00000000${(hash >>> 0).toString(16)}`).slice(-8);
}

function reproofDecision(decision) {
  const projection = { ...decision };
  delete projection.proofFingerprint;
  return fingerprint(`decision:${stableJson(projection)}`);
}

function reproofSnapshot(snapshot) {
  const projection = { ...snapshot };
  delete projection.snapshotFingerprint;
  return fingerprint(`snapshot:${stableJson(projection)}`);
}

test("current Trust and Canon findings form one deterministic local review queue", () => {
  const first = window.WWAMHumanReviewSession.create(sessionInput());
  const second = window.WWAMHumanReviewSession.create(sessionInput());

  assert.equal(window.WWAMHumanReviewSession.VERSION, "1.0.0");
  assert.equal(first.engine, "SHOKKER HUMAN REVIEW SESSION");
  assert.equal(first.schema, "shokker.human-review-session/v1");
  assert.deepEqual(plain(first.corpus), plain(second.corpus));
  assert.deepEqual(plain(first.metrics), plain(second.metrics));
  assert.equal(first.metrics.candidates, 457);
  assert.equal(first.metrics.trustCandidates, 95);
  assert.equal(first.metrics.canonCandidates, 362);
  assert.equal(first.metrics.unreviewed, 457);
  assert.equal(first.metrics.decisions, 0);
  assert.equal(first.metrics.canonMutations, 0);
  assert.equal(first.metrics.speakerCertifications, 0);
  assert.equal(first.metrics.creatorCertifications, 0);
  assert.match(first.corpus.sourceReceiptFingerprint, /^[0-9a-f]{8}$/);
  assert.match(first.corpus.reviewInputFingerprint, /^[0-9a-f]{8}$/);
  assert.equal(first.getQueue({ origin: "trust" }).length, 95);
  assert.equal(first.getQueue({ origin: "canon" }).length, 362);
  assert.equal(first.snapshot().snapshotFingerprint, second.snapshot().snapshotFingerprint);
});

test("positive progression preserves exact before/after, proof chain, evidence, and caller timestamps", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  const evidenceReceiptId = evidenceFor(session);
  const checked = checkedDecision(session);
  const ready = session.recordDecision(COURT, {
    status: "ready-for-creator-review",
    at: "2026-07-23T23:10:00-04:00",
    reviewer: humanReviewer("senior editor", { id: "reviewer-17" }),
    notes:
      "The checked wording remains unchanged and the same source receipt stays attached.",
    evidenceReceiptIds: [evidenceReceiptId]
  });

  assert.equal(checked.before.status, "unreviewed");
  assert.equal(checked.after.status, "wording-checked");
  assert.equal(checked.after.proposedWording, WORDING);
  assert.deepEqual(plain(checked.after.evidenceReceiptIds), [evidenceReceiptId]);
  assert.equal(checked.at, "2026-07-23T23:05:00-04:00");
  assert.equal(ready.before.status, "wording-checked");
  assert.equal(ready.before.proposedWording, WORDING);
  assert.equal(ready.after.status, "ready-for-creator-review");
  assert.equal(ready.after.proposedWording, WORDING);
  assert.equal(ready.previousDecisionFingerprint, checked.proofFingerprint);
  assert.equal(ready.sourceReceiptFingerprint, session.corpus.sourceReceiptFingerprint);
  assert.equal(ready.reviewInputFingerprint, session.corpus.reviewInputFingerprint);
  assert.deepEqual(plain(ready.boundary), {
    effect: "LOCAL REVIEW ROUTING ONLY",
    canonMutated: false,
    speakerCertified: false,
    creatorCertified: false,
    candidateSourceMutated: false,
    callerAttestedHuman: true,
    humanIdentityVerified: false,
    engineGenerated: false
  });
  assert.equal(session.getCandidate(COURT).reviewStatus, "ready-for-creator-review");
  assert.equal(session.metrics.decisions, 2);
  assert.equal(session.metrics.reviewedCandidates, 1);
  assert.equal(session.metrics.readyForCreatorReview, 1);
  assert.equal(session.metrics.positiveProgressions, 2);
  assert.equal(session.metrics.evidenceBackedDecisions, 2);
  assert.equal(session.metrics.callerAttestedHumanDecisions, 2);
  assert.equal(session.metrics.identityVerifiedHumanDecisions, 0);
  assert.equal(session.metrics.engineGeneratedDecisions, 0);
});

test("context and rejection decisions are human-authored but do not require positive evidence", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  const context = session.recordDecision(COURT, {
    status: "needs-context",
    at: "2026-07-23T23:02:00-04:00",
    reviewer: humanReviewer("researcher", { name: "Tape Desk" }),
    notes: "The candidate needs a wider source window before wording review."
  });
  const rejected = session.recordDecision(COURT, {
    status: "reject-candidate",
    at: "2026-07-23T23:03:00-04:00",
    reviewer: humanReviewer("editor"),
    notes: "The available context does not support retaining this candidate."
  });

  assert.deepEqual(plain(context.after.evidenceReceiptIds), []);
  assert.equal(rejected.before.status, "needs-context");
  assert.equal(session.metrics.rejected, 1);
  assert.throws(
    () =>
      session.recordDecision(COURT, {
        status: "needs-context",
        at: "2026-07-23T23:04:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "Attempt to reopen a terminal rejection."
      }),
    (error) => error.code === "TRANSITION_INVALID"
  );
});

test("positive decisions fail closed without caller human attestation, notes, exact evidence, wording, or timestamp", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  const evidenceReceiptId = evidenceFor(session);
  const base = {
    status: "wording-checked",
    at: "2026-07-23T23:05:00-04:00",
    reviewer: humanReviewer("editor"),
    notes: "Human checked this against a receipt.",
    evidenceReceiptIds: [evidenceReceiptId],
    proposedWording: WORDING
  };

  assert.throws(
    () => session.recordDecision(COURT, { ...base, evidenceReceiptIds: [] }),
    (error) => error.code === "EVIDENCE_REQUIRED"
  );
  assert.throws(
    () =>
      session.recordDecision(COURT, {
        ...base,
        evidenceReceiptIds: ["receipt-from-another-candidate"]
      }),
    (error) => error.code === "EVIDENCE_UNSUPPORTED"
  );
  assert.throws(
    () =>
      session.recordDecision(COURT, {
        ...base,
        reviewer: { role: "AI" }
      }),
    (error) => error.code === "HUMAN_ATTESTATION_REQUIRED"
  );
  assert.throws(
    () => session.recordDecision(COURT, { ...base, reviewer: {} }),
    (error) => error.code === "HUMAN_REVIEWER_REQUIRED"
  );
  assert.throws(
    () => session.recordDecision(COURT, { ...base, notes: " " }),
    (error) => error.code === "NOTES_REQUIRED"
  );
  assert.throws(
    () => session.recordDecision(COURT, { ...base, proposedWording: "" }),
    (error) => error.code === "WORDING_REQUIRED"
  );
  assert.throws(
    () => session.recordDecision(COURT, { ...base, at: "" }),
    (error) => error.code === "TIMESTAMP_REQUIRED"
  );
  assert.throws(
    () =>
      window.WWAMHumanReviewSession.create(
        sessionInput({ session: { createdAt: "" } })
      ),
    (error) => error.code === "TIMESTAMP_REQUIRED"
  );
});

test("human review requires explicit caller attestation and rejects automation-disclosed roles", () => {
  const base = {
    status: "needs-context",
    at: "2026-07-23T23:05:00-04:00",
    notes: "Caller is declaring who made this local routing decision."
  };

  const missing = window.WWAMHumanReviewSession.create(
    sessionInput({ session: { id: "attestation-missing" } })
  );
  assert.throws(
    () =>
      missing.recordDecision(COURT, {
        ...base,
        reviewer: { role: "editor" }
      }),
    (error) => error.code === "HUMAN_ATTESTATION_REQUIRED"
  );

  ["Claude", "GPT-5", "LLM reviewer", "algorithm", "AI assistant"].forEach(
    (role, index) => {
      const session = window.WWAMHumanReviewSession.create(
        sessionInput({ session: { id: `automation-role-${index}` } })
      );
      assert.throws(
        () =>
          session.recordDecision(COURT, {
            ...base,
            reviewer: { role, humanAttested: true }
          }),
        (error) => error.code === "HUMAN_ATTESTATION_CONFLICT"
      );
    }
  );

  const accepted = window.WWAMHumanReviewSession.create(
    sessionInput({ session: { id: "attestation-accepted" } })
  ).recordDecision(COURT, {
    ...base,
    reviewer: humanReviewer("editor")
  });
  assert.equal(accepted.reviewer.humanAttested, true);
  assert.equal(
    accepted.reviewer.attestationStatus,
    "CALLER-ATTESTED / NOT IDENTITY-VERIFIED"
  );
  assert.equal(accepted.boundary.humanIdentityVerified, false);
});

test("forged source, time, or URL fields cannot masquerade as canonical evidence", () => {
  const input = sessionInput({ session: { id: "forged-evidence" } });
  const canonical = input.showcase.receipts.find((receipt) => {
    const source = input.showcase.sources.find(
      (item) => item.id === receipt.sourceId
    );
    return source && Number.isFinite(source.duration) && receipt.t < source.duration;
  });
  assert.ok(canonical);
  input.trust.reviewCandidates.push({
    id: "forged-evidence-candidate",
    kind: "evidence-test",
    title: "Forged evidence candidate",
    claim: "This must never progress.",
    evidence: [
      {
        receiptId: canonical.id,
        sourceId: "WRONGSOURCE",
        t: canonical.t + 1,
        url: "https://www.youtube.com/watch?v=AAAAAAAAAAA&t=999s"
      }
    ]
  });

  const session = window.WWAMHumanReviewSession.create(input);
  const candidate = session.getCandidate("trust:forged-evidence-candidate");
  const evidence = candidate.evidence[0];
  assert.equal(evidence.canonicalReceipt, true);
  assert.equal(evidence.eligibleForProgression, false);
  assert.ok(evidence.validationIssues.includes("SUPPLIED_SOURCE_MISMATCH"));
  assert.ok(evidence.validationIssues.includes("SUPPLIED_TIMESTAMP_MISMATCH"));
  assert.ok(evidence.validationIssues.includes("SUPPLIED_URL_MISMATCH"));
  assert.throws(
    () =>
      session.recordDecision(candidate.id, {
        status: "wording-checked",
        at: "2026-07-23T23:05:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "This supplied locator does not match its registered receipt.",
        evidenceReceiptIds: [evidence.id],
        proposedWording: "Unsupported."
      }),
    (error) => error.code === "EVIDENCE_UNSUPPORTED"
  );
});

test("canonical receipts outside their registered source duration cannot support progression", () => {
  const input = sessionInput({ session: { id: "out-of-range-evidence" } });
  const canonical = input.showcase.receipts.find((receipt) =>
    input.showcase.sources.some(
      (source) => source.id === receipt.sourceId && source.duration > 0
    )
  );
  const source = input.showcase.sources.find(
    (item) => item.id === canonical.sourceId
  );
  canonical.t = source.duration + 30;
  canonical.url = `https://www.youtube.com/watch?v=${source.id}&t=${Math.round(
    canonical.t
  )}s`;
  input.trust.reviewCandidates.push({
    id: "out-of-range-evidence-candidate",
    kind: "evidence-test",
    title: "Out-of-range evidence candidate",
    evidence: [{ receiptId: canonical.id }]
  });

  const session = window.WWAMHumanReviewSession.create(input);
  const candidate = session.getCandidate(
    "trust:out-of-range-evidence-candidate"
  );
  assert.equal(candidate.evidence[0].eligibleForProgression, false);
  assert.ok(
    candidate.evidence[0].validationIssues.includes("TIMESTAMP_OUT_OF_RANGE")
  );
  assert.throws(
    () =>
      session.recordDecision(candidate.id, {
        status: "wording-checked",
        at: "2026-07-23T23:05:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "This timestamp is outside the source duration.",
        evidenceReceiptIds: [candidate.evidence[0].id],
        proposedWording: "Unsupported."
      }),
    (error) => error.code === "EVIDENCE_UNSUPPORTED"
  );
});

test("transition model rejects shortcuts, repeated states, changed checked wording, and certification statuses", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  const evidenceReceiptId = evidenceFor(session);

  assert.throws(
    () =>
      session.recordDecision(COURT, {
        status: "ready-for-creator-review",
        at: "2026-07-23T23:01:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "Attempted to skip the wording check.",
        evidenceReceiptIds: [evidenceReceiptId]
      }),
    (error) => error.code === "TRANSITION_INVALID"
  );
  assert.throws(
    () =>
      session.recordDecision(COURT, {
        status: "canon-certified",
        at: "2026-07-23T23:01:00-04:00",
        reviewer: humanReviewer("owner"),
        notes: "Unsupported status.",
        evidenceReceiptIds: [evidenceReceiptId]
      }),
    (error) => error.code === "STATUS_INVALID"
  );

  checkedDecision(session);
  assert.throws(
    () =>
      session.recordDecision(COURT, {
        status: "wording-checked",
        at: "2026-07-23T23:06:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "Repeated the same state.",
        evidenceReceiptIds: [evidenceReceiptId],
        proposedWording: WORDING
      }),
    (error) => error.code === "TRANSITION_INVALID"
  );
  assert.throws(
    () =>
      session.recordDecision(COURT, {
        status: "ready-for-creator-review",
        at: "2026-07-23T23:06:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "Attempted to alter wording during routing.",
        evidenceReceiptIds: [evidenceReceiptId],
        proposedWording: "A silently changed claim."
      }),
    (error) => error.code === "WORDING_CHANGED_AFTER_CHECK"
  );
  assert.throws(
    () =>
      session.recordDecision(COURT, {
        status: "ready-for-creator-review",
        at: "2026-07-23T23:05:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "Timestamp did not advance.",
        evidenceReceiptIds: [evidenceReceiptId]
      }),
    (error) => error.code === "TIMESTAMP_INVALID"
  );
});

test("local review rejects every explicit speaker, creator, or canon promotion attempt", () => {
  const actions = [
    { promoteToCanon: true },
    { certify: true },
    { creatorCertified: true },
    { speakerCredit: "Mike" },
    { speakerAttribution: "J" },
    { canonStatus: "approved" },
    { claims: { canonPromotion: true } },
    { claims: { speakerCertification: true } }
  ];

  actions.forEach((attempt, index) => {
    const session = window.WWAMHumanReviewSession.create(
      sessionInput({ session: { id: `cert-attempt-${index}` } })
    );
    assert.throws(
      () =>
        session.recordDecision(COURT, {
          status: "needs-context",
          at: "2026-07-23T23:01:00-04:00",
          reviewer: humanReviewer("owner"),
          notes: "This local note cannot change canon.",
          ...attempt
        }),
      (error) => error.code === "CERTIFICATION_UNSUPPORTED"
    );
    assert.equal(session.metrics.decisions, 0);
  });

  const wordingSession = window.WWAMHumanReviewSession.create(
    sessionInput({ session: { id: "cert-wording" } })
  );
  assert.throws(
    () =>
      wordingSession.recordDecision(COURT, {
        status: "wording-checked",
        at: "2026-07-23T23:01:00-04:00",
        reviewer: humanReviewer("owner"),
        notes: "Attempted unsafe public label.",
        evidenceReceiptIds: [evidenceFor(wordingSession)],
        proposedWording: "CREATOR CERTIFIED — this is now canon."
      }),
    (error) => error.code === "CERTIFICATION_UNSUPPORTED"
  );
});

test("Canon warnings use receipt-backed review evidence without becoming canon decisions", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  const candidate = session
    .getQueue({ origin: "canon" })
    .find((item) => item.evidence.length > 0);
  assert.ok(candidate);
  assert.equal(candidate.origin, "canon");
  assert.equal(candidate.evidence[0].showcaseReceipt, true);

  const decision = session.recordDecision(candidate.id, {
    status: "wording-checked",
    at: "2026-07-23T23:04:00-04:00",
    reviewer: humanReviewer("copy editor"),
    notes: "Confirmed this receipt must be shortened only at its public boundary.",
    evidenceReceiptIds: [candidate.evidence[0].id],
    proposedWording: "Bounded public excerpt; full receipt remains internal."
  });

  assert.equal(decision.candidateOrigin, "canon");
  assert.equal(decision.boundary.canonMutated, false);
  assert.equal(session.metrics.canonMutations, 0);
  assert.equal(session.metrics.creatorCertifications, 0);
});

test("snapshot restore and JSON/Markdown exports round-trip exactly with no generated timestamp", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  const evidenceReceiptId = evidenceFor(session);
  checkedDecision(session);
  session.recordDecision(COURT, {
    status: "ready-for-creator-review",
    at: "2026-07-23T23:10:00-04:00",
    reviewer: humanReviewer("editor", { name: "Ricky" }),
    notes: "Routing only; the creator still has to make any final decision.",
    evidenceReceiptIds: [evidenceReceiptId]
  });

  const snapshot = session.snapshot();
  const json = session.exportJSON();
  const markdown = session.exportMarkdown();
  const restored = window.WWAMHumanReviewSession.restore(
    JSON.parse(json),
    freshInput()
  );

  assert.deepEqual(plain(restored.snapshot()), plain(snapshot));
  assert.equal(restored.exportJSON(), json);
  assert.equal(restored.exportMarkdown(), markdown);
  assert.equal(session.exportJSON(), json);
  assert.equal(session.exportMarkdown(), markdown);
  assert.equal("generatedAt" in snapshot, false);
  assert.equal(json.includes("generatedAt"), false);
  assert.match(markdown, /local review routing only/i);
  assert.match(markdown, /Canon mutations: 0/);
  assert.match(markdown, /Speaker certifications: 0/);
  assert.equal(restored.metrics.readyForCreatorReview, 1);
});

test("restore rejects ordinary and checksum-recomputed semantic tampering", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  checkedDecision(session);
  const snapshot = session.snapshot();

  const ordinaryTamper = plain(snapshot);
  ordinaryTamper.ledger[0].after.notes = "Altered after export.";
  assert.throws(
    () =>
      window.WWAMHumanReviewSession.restore(ordinaryTamper, freshInput()),
    (error) => error.code === "SNAPSHOT_TAMPERED"
  );

  const semanticTamper = plain(snapshot);
  semanticTamper.ledger[0].boundary.canonMutated = true;
  semanticTamper.ledger[0].proofFingerprint = reproofDecision(
    semanticTamper.ledger[0]
  );
  semanticTamper.snapshotFingerprint = reproofSnapshot(semanticTamper);
  assert.throws(
    () =>
      window.WWAMHumanReviewSession.restore(semanticTamper, freshInput()),
    (error) => error.code === "SNAPSHOT_TAMPERED"
  );
});

test("restore and active sessions fail closed when corpus, receipts, or candidates change", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  checkedDecision(session);
  const snapshot = session.snapshot();

  const changedReceipt = freshInput();
  changedReceipt.showcase.receipts[0].excerpt += " changed";
  assert.throws(
    () =>
      window.WWAMHumanReviewSession.restore(snapshot, changedReceipt),
    (error) => error.code === "CORPUS_CHANGED"
  );

  const changedCandidate = freshInput();
  changedCandidate.trust.reviewCandidates[0].summary += " changed";
  assert.throws(
    () =>
      window.WWAMHumanReviewSession.restore(snapshot, changedCandidate),
    (error) => error.code === "CORPUS_CHANGED"
  );

  const liveInput = sessionInput({
    session: { id: "live-corpus-change" }
  });
  const live = window.WWAMHumanReviewSession.create(liveInput);
  liveInput.showcase.receipts[0].excerpt += " changed during review";
  assert.throws(
    () =>
      live.recordDecision(COURT, {
        status: "needs-context",
        at: "2026-07-23T23:01:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "This must fail before recording."
      }),
    (error) => error.code === "CORPUS_CHANGED"
  );
  assert.equal(live.metrics.decisions, 0);
});

test("candidates without playable evidence cannot receive positive progression", () => {
  const session = window.WWAMHumanReviewSession.create(sessionInput());
  const candidate = session.getCandidate("source-health:AzrcgoyE7C4");
  assert.equal(candidate.evidence.length, 0);
  assert.throws(
    () =>
      session.recordDecision(candidate.id, {
        status: "wording-checked",
        at: "2026-07-23T23:05:00-04:00",
        reviewer: humanReviewer("editor"),
        notes: "No receipt exists to support this progression.",
        proposedWording: "Source health checked."
      }),
    (error) => error.code === "EVIDENCE_REQUIRED"
  );
  assert.equal(session.metrics.callerAttestedHumanDecisions, 0);
  assert.equal(session.metrics.identityVerifiedHumanDecisions, 0);
  assert.equal(session.metrics.engineGeneratedDecisions, 0);
  assert.equal(session.metrics.canonMutations, 0);
  assert.equal(session.metrics.speakerCertifications, 0);
  assert.equal(session.metrics.creatorCertifications, 0);
});
