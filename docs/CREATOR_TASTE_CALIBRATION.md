# Creator Taste Calibration V1 — The Cut Test

## Product promise

**Anyone can prompt an AI. This system remembers the exact receipts, then
learns from what a local operator explicitly chooses without confusing taste
with truth or creator approval.**

The Cut Test fills the gap between a machine shortlist and a local operator's
editorial preference. It presents 10 source-backed, priority-blind learning
matchups plus 2 side-reversed, non-learning consistency checks. It learns only
from explicit local A/B choices in the 10 base matchups.

It never authenticates the operator as Mike, J, a creator, or an editor. Every
session is labeled `UNAUTHENTICATED LOCAL OPERATOR`.

## Current deterministic V1 derivation

With the default `MEDIUM` maximum-risk gate, the current WWAM Clip Lab exposes:

- 560 total Short candidates;
- 248 exact-ledger eligible candidates;
- 54 represented eligible sources;
- 12 deterministic rounds;
- 10 unique learning matchups;
- 2 side-reversed non-learning repeat checks; and
- 20 unique sources in the current demonstration sample.

The round shape is regression-pinned. The 560/248/54 inventory totals and
20-source sample are current deterministic WWAM derivations and must be
regenerated when the Clip Lab snapshot or risk gate changes.

Every decision option carries a receipt ID, source ID, exact second, official
source URL, bounded excerpt, evidence state, risk state, and approval state.

## Four explicit choices

- `A` — prefer option A;
- `B` — prefer option B;
- `NEITHER` — record a local “neither” decision but add no preference weight;
  and
- `NEEDS_CONTEXT` — record locally that surrounding-tape review is needed but
  add no preference weight.

At least six non-repeat A/B decisions are required. A completed session with
too little preference data fails closed instead of inventing a profile.

## What the model learns

The transparent V1 model counts wins, losses, and exposure for adapter-defined
features:

- WWAM signal/category;
- movie or topic;
- recurring character/entity;
- suggested edit-runtime band; and
- source lane/type.

Only features that differ between the selected and unselected candidate learn
from that choice. Sparse observations are shrunk toward zero. The total
preference adjustment for any candidate is capped at `±6`.

The test’s declared goal is fingerprint-bound and visible, but descriptive in
V1. It does not silently filter or widen inventory. The declared maximum risk
is the actual input gate.

## Immutable safety boundary

Calibration can change only the derived preference modifier and calibrated
order. It cannot mutate:

- baseline machine score or rank;
- source, receipt, timestamp, or excerpt;
- evidence level or caveats;
- risk score, risk label, or HOLD state;
- approval checks;
- canon state;
- speaker state;
- rights state; or
- creator-approval state.

The untouched machine Top 12 stays visible beside the calibrated local Top 12.
Resetting the test always recovers the baseline.

## Repeat checks

Two base matchups reappear with their sides reversed. Consistency is reported
descriptively. It is not identity authentication, a quality score, or proof
that the operator is a creator.

## Artifact and restore contract

A completed session exports `shokker.creator-taste/v1` with:

- channel and ChannelPack fingerprints;
- Clip Lab, full-inventory, and risk-gated eligible-inventory fingerprints;
- declared goal and maximum risk;
- deterministic round blueprint;
- exact decision ledger;
- transparent feature weights;
- baseline and calibrated shortlists;
- coverage, repeat, shortlist-delta, and safety metrics;
- artifact fingerprint; and
- deterministic checksum.

Restore rejects tampering, a foreign channel, different ChannelPack, different
Clip Lab snapshot, changed full or eligible inventory, a different declared
goal or maximum-risk gate, altered round blueprints, and decision-ledger drift.
Neither the artifact fingerprint nor checksum is a cryptographic signature,
proof of authorship, identity authentication, or creator approval.

## Local UI workflow

1. Predeclare the calibration goal and maximum input risk.
2. Review two priority-blind candidates. Machine priority and baseline rank
   stay hidden during the choice; source, time, evidence, and risk stay visible.
3. Open either exact official source before deciding.
4. Complete twelve rounds.
5. Inspect the learned feature direction, exact-ledger coverage, repeat
   consistency, and computed protected-field projection audit. Artifact
   creation fails closed if that audit finds a mutation.
6. Compare the untouched machine Top 12 with the bounded local Cut 12.
7. Copy or download the reproducible, consistency-bound JSON artifact. No
   media is included.

The Cut Test makes no upload request for choice data. In-progress choices
persist only in the snapshot-namespaced store in this browser on this device.
A changed input binding quarantines that progress instead of replaying it
against new inventory. This narrow statement does not claim that every external
resource or official-source link on the surrounding demo page is offline.

## Universal portability

The engine uses adapter-defined labels and feature dimensions. A test-only
neutral racing fixture demonstrates adapter-driven labels and no WWAM or horror
vocabulary leakage. The generic determinism, safety, restore, tamper, and
shortlist invariants are covered separately with synthetic engine fixtures; the
neutral fixture does not itself rerun that full matrix.

A league could calibrate toward close finishes, lead-change density, booth
intensity, particular driver stories, or clip runtimes while preserving the
same evidence and risk boundaries.
