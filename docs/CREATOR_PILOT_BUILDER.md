# Creator Pilot Builder

The Creator Pilot Builder turns the WWAM showcase into a narrow, testable proposal instead of a vague promise. It can generate one of four deterministic pilot briefs:

- Archive Discovery
- Compilation Workflow
- Fan + Member Experience
- Recurring Lore System

Each brief carries the current indexed snapshot, a small set of playable source receipts, deliverables with acceptance checks, human approval gates, a measurement plan, exclusions, and a deterministic consistency ledger.

## What it refuses to invent

The builder does not claim revenue, conversion, retention, hours saved, rights clearance, creator endorsement, or canon status. Pilot measurements begin as `NOT YET OBSERVED`. A creator chooses the evaluation set and observation window before interpreting results.

Machine-surfaced output cannot approve itself. Missing engine metrics fail closed. A supplied Canon Integrity report must pass or the builder refuses to create a brief.

## Browser API

```js
const builder = WWAMCreatorPilotBuilder.create({
  showcase,
  lore,
  clipLab,
  coldOpen,
  trust,
  integrityReport
});

const brief = builder.build("compilation-workflow", {
  title: "WWAM Compilation Workflow Pilot",
  sourceLane: "TEN CREATOR-SELECTED LIVESTREAMS",
  sourceLimit: 10
});

builder.verify(brief);
builder.exportJSON(brief);
builder.exportMarkdown(brief);
```

Valid goal IDs are:

```text
archive-discovery
compilation-workflow
fan-member-experience
recurring-lore-system
```

`buildAll()` creates all four briefs. `verify()` checks the schema, goal,
input fingerprint, metric snapshot, engine and integrity bindings, receipt
ledger, draft/approval state, empty observed-results state, and the complete
generated semantic contract. These checks run independently of the
recomputable fingerprint, so recalculating that checksum cannot turn a forged
approval or invented business result into a valid brief.

The fingerprint is a deterministic consistency checksum, not a cryptographic
signature, owner authorization, or proof of authorship. Production workflows
that need authenticity require an owner-controlled signing or approval system.

## Commercial use

The output is a discussion artifact: it helps a creator choose what to test, what proof exists now, what humans still need to decide, and how a successful pilot would be observed. Scope, price, hosting, support, analytics, ownership, and rights remain part of a separate human agreement.
