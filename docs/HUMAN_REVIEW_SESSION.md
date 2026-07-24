# Human Review Session

`WWAMHumanReviewSession` is a local decision ledger for the findings already produced by the Trust Desk and Canon Integrity audit. It does not edit either engine, modify source data, certify a speaker, or promote anything into canon.

The engine lives at `public/demo/human-review-session-engine.js` and is wired into the public demo's **Trust / Canon Desk → Human Review Session** tab.

## Safety boundary

Every session is bound to:

- the Showcase input fingerprint;
- a fingerprint of every current source and receipt;
- the Trust input fingerprint and complete review-candidate set;
- the Canon report fingerprint and complete violation set.

The engine recomputes that binding before every decision, snapshot, and export. Restore fails with `CORPUS_CHANGED` if any source, receipt, Trust candidate, or Canon finding changed.

All timestamps come from the caller. The engine never inserts the current time.

Decision records always carry:

- exact before and after status, wording, notes, and evidence IDs;
- reviewer role, an explicit `humanAttested: true` caller declaration, and optional reviewer name or ID;
- caller-supplied timestamp;
- candidate, source/receipt, and complete review-input fingerprints;
- the prior decision proof, forming an ordered local chain;
- explicit `false` values for canon mutation, speaker/creator certification, identity verification, and engine-generated decisions.

The attestation is deliberately narrow: the caller states that a human made the decision. This local engine has no login, identity provider, or remote authentication, so it never reports an identity-verified human decision. A missing attestation fails closed. A role that discloses automation (for example `Claude`, `GPT-5`, `LLM reviewer`, or `algorithm`) conflicts with a human attestation and is rejected.

Candidate evidence is resolved back to a registered Showcase receipt. The engine validates the receipt's source ID, official YouTube video ID, timestamp query, source duration bound, and any caller-supplied source/time/URL fields. A copied or forged locator cannot qualify merely because it looks playable.

## Status workflow

| From | Allowed next status |
| --- | --- |
| `unreviewed` | `needs-context`, `wording-checked`, `reject-candidate` |
| `needs-context` | `wording-checked`, `reject-candidate` |
| `wording-checked` | `ready-for-creator-review`, `needs-context`, `reject-candidate` |
| `ready-for-creator-review` | `needs-context`, `reject-candidate` |
| `reject-candidate` | Terminal |

`wording-checked` and `ready-for-creator-review` are positive routing steps. Both require an explicitly caller-attested human reviewer, notes, and at least one validated canonical playable receipt already attached to that candidate. `wording-checked` also requires the exact reviewed wording. The ready step cannot silently change it.

`ready-for-creator-review` means only that a packet is ready to be shown to a creator. It is not creator approval.

## Creating a session

Load the module after Showcase, Trust, and Canon have been created:

```js
const review = window.WWAMHumanReviewSession.create({
  showcase,
  trust,
  canon,
  session: {
    id: "july-accuracy-pass",
    name: "July Accuracy Pass",
    createdAt: "2026-07-23T23:00:00-04:00"
  }
});
```

The current queue can be filtered without mutating it:

```js
const openTrustFindings = review.getQueue({
  origin: "trust",
  status: "unreviewed",
  severity: "high"
});

const candidate = review.getCandidate(openTrustFindings[0].id);
const receiptId = candidate.evidence[0].id;
```

## Recording decisions

```js
review.recordDecision(candidate.id, {
  status: "wording-checked",
  at: "2026-07-23T23:10:00-04:00",
  reviewer: {
    role: "editor",
    name: "Ricky",
    humanAttested: true
  },
  notes: "Checked the wording against the selected receipt.",
  evidenceReceiptIds: [receiptId],
  proposedWording:
    "Machine-surfaced argument board; human context review remains required."
});

review.recordDecision(candidate.id, {
  status: "ready-for-creator-review",
  at: "2026-07-23T23:15:00-04:00",
  reviewer: {
    role: "senior editor",
    humanAttested: true
  },
  notes: "The checked wording is unchanged and the receipt remains attached.",
  evidenceReceiptIds: [receiptId]
});
```

Explicit fields such as `speakerCredit`, `speakerAttribution`, `promoteToCanon`, `creatorCertified`, or `canonStatus` are rejected. Certification-style proposed labels are rejected as well.

## Snapshot, restore, and export

```js
const snapshot = review.snapshot();
const json = review.exportJSON(2);
const markdown = review.exportMarkdown();

const restored = window.WWAMHumanReviewSession.restore(
  JSON.parse(json),
  { showcase, trust, canon }
);
```

Restore verifies the snapshot checksum, every decision proof, the ordered proof chain, all before/after transitions, caller attestation, canonical evidence requirements, zero-certification boundaries, candidate fingerprints, and the complete current corpus binding. The restored snapshot and both exports are byte-for-byte deterministic.

Snapshots are integrity checks, not cryptographic signatures or remote authorization. Keep final creator approval in the appropriate owner-controlled system.

## Metrics

`review.metrics` and `review.getMetrics()` report:

- candidate counts split by Trust and Canon;
- decision and reviewed-candidate counts;
- current count in each review status;
- positive and evidence-backed decision counts;
- caller-attested human decisions;
- identity-verified human decisions and engine-generated decisions — permanently zero because this local engine performs neither;
- canon mutations, speaker certifications, and creator certifications — permanently zero.

## Error codes

Expected fail-closed errors include:

- `INPUT_INVALID`
- `SESSION_INVALID`
- `TIMESTAMP_REQUIRED`
- `TIMESTAMP_INVALID`
- `CANDIDATE_NOT_FOUND`
- `CANDIDATE_AMBIGUOUS`
- `STATUS_INVALID`
- `TRANSITION_INVALID`
- `HUMAN_REVIEWER_REQUIRED`
- `HUMAN_ATTESTATION_REQUIRED`
- `HUMAN_ATTESTATION_CONFLICT`
- `NOTES_REQUIRED`
- `EVIDENCE_REQUIRED`
- `EVIDENCE_UNSUPPORTED`
- `WORDING_REQUIRED`
- `WORDING_CHANGED_AFTER_CHECK`
- `CERTIFICATION_UNSUPPORTED`
- `SNAPSHOT_INVALID`
- `SNAPSHOT_TAMPERED`
- `CORPUS_CHANGED`

The engine throws `HumanReviewError` with a stable `code` and, when useful, deterministic `details`.
