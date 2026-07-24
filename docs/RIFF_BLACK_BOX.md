# Comedy Black Box

## What it is

Comedy Black Box turns the existing Riff Chemistry ranking into an inspectable
score autopsy. A ranked card is no longer the end of the explanation. It opens
the exact promoted receipt, reproduces the six declared score dimensions,
shows each dimension's weight and contribution, frames an official-source
playback window, and identifies the nearest promoted receipts from the same
upload.

The product promise is deliberately narrow:

> rank a promoted moment, expose the deterministic inputs, and make the tape
> one click away.

It does not claim to know why a joke worked, who said it, who laughed, whether
the adjacent receipt caused the moment, or whether the score predicts audience
response.

## Audited ledger

The checked-in V5.10 snapshot contains 301 chemistry anchors across 69 sources:

| Measurement | Exact value |
| --- | ---: |
| Promoted Riff Chemistry anchors | 301 |
| Sources represented by those anchors | 69 |
| Promoted sources available to the engine | 74 |
| Promoted receipts available to the engine | 872 |
| Declared score dimensions | 6 |
| Score drift accepted | 0 |
| Machine-level anchors | 276 |
| Timestamp-validated human-curated candidates | 25 |
| Literal reaction cues in bounded excerpts | 13 |
| Reaction state left `UNKNOWN` | 288 |
| Fractional source indexes bound and normalized for playback | 24 |

The public evidence split is 276 machine-level anchors and 25
timestamp-validated human-curated candidates; neither tier implies editor or
creator certification.

The engine binds those records to:

- ChannelPack / Showcase fingerprint `68c87daa`;
- promoted source-and-receipt ledger fingerprint `fnv1a32:b144f5f0`;
- Riff Chemistry ledger fingerprint `fnv1a32:fe44c66e`;
- label-independent evidence fingerprint `fnv1a32:56d6edef`; and
- runtime-label full snapshot fingerprint `fnv1a32:8764544e`.

These FNV fingerprints are structural change detectors. They are not
signatures, ownership checks, source authentication, human-review proof, or
creator approval. The complete snapshot fingerprint is presentation-label
sensitive; the evidence fingerprint remains stable when only labels change.

## The score, without magic

Every anchor reproduces the published weighted formula:

| Dimension | Weight | What the engine exposes |
| --- | ---: | --- |
| Source heat | 28% | The promoted receipt's existing heat input |
| Escalation | 20% | The existing chemistry-ledger escalation value |
| Callback density | 16% | The existing callback-density value |
| Derailment | 16% | The existing derailment value |
| Room break | 14% | The existing room-break value |
| Topic collision | 6% | The existing topic-collision value |

The six weights total exactly 100%. The displayed whole-number score must
recompute from those inputs with zero drift or the engine refuses to build.
The Black Box does not quietly rescore moments, train on audience behavior, or
replace editorial judgment. It makes the already-declared calculation
inspectable.

## Playback context, not invented dialogue

Each inspection provides three playback coordinates:

- **Runway:** 15 seconds before the anchor, clamped to the official source
  boundary;
- **Impact:** the promoted whole-second playback coordinate; and
- **Aftershock:** 20 seconds after the anchor, also clamped to the source
  boundary.

Those labels are navigation language, not causal findings. The engine does not
reconstruct surrounding dialogue and exports no surrounding caption events.
The official YouTube links do not autoplay.

Twenty-four human-curated source indexes include fractional seconds. The
engine binds the exact finite source value as `sourceAt`, then deliberately
normalizes down to a whole playback second as `at`. Both values and the
normalization policy are exported. Numeric strings, booleans, non-finite
numbers, and out-of-bounds coordinates are refused rather than coerced.

The Black Box also looks for the nearest promoted receipt before and after the
anchor in the same source, with a maximum distance of fifteen minutes. These
are neighboring indexed receipts, not automatically a setup and payoff. Across
the 301-anchor snapshot:

| Neighbor state | Anchors |
| --- | ---: |
| A neighbor on both sides | 147 |
| A neighbor on one side | 126 |
| No neighbor inside the declared window | 28 |

The interface must say that the neighbors are navigation aids. Temporal
proximity does not establish intent, causality, a callback, or even continuous
conversation.

## Literal reaction firewall

A reaction badge appears only when the bounded promoted excerpt literally
contains one of the declared cues: `laughter`, `laughing`, or `can't breathe`.
Thirteen anchors meet that literal test. The other 288 display `UNKNOWN`.

Even a literal cue does not identify who reacted or whether the words came
from Mike, J, a guest, source audio, a soundboard, or another voice. Every
inspection therefore retains `speaker: null` and
`speakerStatus: not-diarized`.

## Portable proof

The interface copies or downloads a deterministic **one-riff autopsy**, not a
half-megabyte dump of all 301 anchors. The reference inspection at
`R_bXrnNOcwg` / `1:03:30` serializes to about 8 KB and verifies independently
against the complete runtime snapshot. The engine retains a separate
full-ledger audit API for release checks.

Both artifacts contain bounded public excerpts of no more than sixteen words,
official source IDs, whole-second playback coordinates, exact source indexes,
declared scoring inputs, policies, and structural fingerprints. They reject:

- a foreign ChannelPack or promoted ledger;
- an Archive Deep, quarantined, or promotion-denied source, receipt, or
  chemistry anchor;
- a changed source, receipt, timestamp, evidence tier, entity binding,
  category, dimension, score, or recomputed literal score basis;
- undeclared formula terms or structured weights that disagree with the public
  formula;
- a fingerprint mismatch;
- hostile prototypes, inherited payloads, circular values, sparse or decorated
  arrays, and non-JSON values;
- transcript, caption, segment, or full event-array fields; and
- excerpts that exceed the public word limit.

The export is an audit artifact, not a media package. It contains no copied
video or audio. Source, receipt, chemistry, and entity ordering is canonical,
so semantically identical input ledgers retain the same evidence fingerprint.

## Why this matters commercially

Most archive demos stop at a ranked list. Comedy Black Box creates a stronger
four-step proof loop:

1. **Rank:** surface a memorable promoted moment.
2. **Anatomy:** show exactly which declared inputs produced the score.
3. **Tape:** jump to the official upload at the relevant playback window.
4. **Portable proof:** preserve the exact inspected ledger state so another
   person can reproduce or challenge it.

That pattern is channel-neutral even though this V1 implementation has six
fixed semantic slots. An iRacing league can map its own validated inputs into
those slots—or use the same packet contract with a future race-specific
formula—for finish margin, lead changes, booth intensity, incident stakes,
and championship consequence. A movie podcast can use escalation, callbacks,
derailment, reaction evidence, and topic collision. The presentation and
formula adapter change; the evidence discipline does not.

## Production boundary

V5.10 is an audited deterministic prototype over the checked-in promoted
snapshot. A production system should add authenticated editorial decisions,
versioned review notes, rights-aware clip workflows, accessibility review, and
scheduled refreshes. It should not turn a structural fingerprint into an
identity claim or silently treat automatic captions as diarized truth.
