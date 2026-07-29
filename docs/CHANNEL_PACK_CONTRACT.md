# ChannelPack V1 executable contract

ChannelPack is the tested adapter boundary between the reusable Shokker
YouTube Wiki Memory OS and one channel's irreplaceable identity. It is code,
not a presentation-only promise: one compiler accepts WWAM's existing Channel DNA and
a synthetic racing fixture, produces canonical artifacts and fingerprints,
and rejects incomplete or unsafe packs.

ChannelPack compiles editorial configuration only. It does not turn a keyword,
title, transcript fragment, or machine candidate into evidence.

## Public artifacts

- `public/demo/channel-pack-spec.json` is the downloadable JSON Schema and
  conformance policy.
- `public/demo/channel-pack-contract.js` exposes the browser-safe compiler,
  validator, serializer, and portfolio-isolation validator.
- `public/demo/wwam-channel-dna.js` remains WWAM's identity input.
- `public/demo/wwam-channel-pack-adapter.js` declares WWAM's operational
  evidence, update, storage, and surface-language policy.
- `public/demo/tape-companion-engine.js` implements the portable synchronized
  evidence contract documented in `docs/TAPE_COMPANION.md`.
- `public/demo/creator-taste-engine.js` implements the portable bounded
  preference contract documented in `docs/CREATOR_TASTE_CALIBRATION.md`.
- `public/demo/fresh-tape-intake-engine.js` implements the portable bounded
  intake contract documented in `docs/FRESH_TAPE_INTAKE.md`.
- `public/demo/longitudinal-docket-engine.js` implements the portable
  before/after evidence contract documented in
  `docs/LONGITUDINAL_DOCKET.md`.
- `public/demo/verdict-room-engine.js` implements the portable, device-local
  human adjudication ledger documented in `docs/VERDICT_ROOM_DESIGN.md`.
- `tests/fixtures/channel-pack-neutral-racing.mjs` is a synthetic, test-only
  portability fixture. It is not VRL data and is never loaded by the WWAM
  public demo.

The compiler is intentionally not part of the first-load bundle. Reviewers can
inspect or download the contract without making the fan experience heavier.

## The eleven conformance domains

| Domain | What the pack must declare | What the compiler refuses |
| --- | --- | --- |
| Identity | Stable channel ID, pack version, public label, source channel, promise | Missing identity, free-form IDs, invalid versions |
| Source lanes | Label, purpose, and an explicit inclusion boundary for every lane | Inferred boundaries, orphan rules, empty lanes |
| Taxonomy | Entity, receipt, and relationship types | A taxonomy without the universal `source` entity or duplicate types |
| Entity registry | Stable entity ID, public label, and declared taxonomy type for every browsable subject | Duplicate IDs, unknown types, or artifact-authored subject labels |
| Evidence policy | Excerpt ceiling, source/timestamp requirements, speaker restraint, and distinct machine, curated-candidate, editor, and creator states | Speaker guessing, synthetic character audio, machine-to-public promotion, or treating curation as authenticated review |
| Update contract | `discover → quarantine → review → promote`, official source, honest cadence | Skipped review, implied automation, silent source removal |
| Storage | Channel-scoped namespace, channel-first partitioning, source partition, export prefix | Namespace mismatch or storage that can mix channels |
| Surface vocabulary | Nine channel-native labels for ask, receipt, source, unknown, quarantine, curated candidate, review, certification, and correction | Generic missing states, collapsed evidence tiers, or duplicate labels |
| Longitudinal vocabulary | Exact product, forecast, response, unresolved, and edit-brief labels | Free-form artifact labels that can redefine public docket meaning |
| Adjudication vocabulary | Formal, comedy, and reduced-profanity labels for exactly `SUPPORTED`, `CONTRADICTED`, and `MIXED` | Caller-authored labels, missing display modes, extra verdict codes, or cross-channel voice leakage |
| Capabilities | The product surfaces this channel actually enables | An empty capability claim |

Machine output must enter `quarantine`. A `curatedCandidate` is a distinct
timestamp-validated, human-curated, non-authenticated tier between machine and
editor; it cannot silently become `EDITOR VERIFIED`. Public promotion requires
human review, and editor verification requires authentication. Corrections are
append-only, contradictory evidence survives certification, and removed
sources leave tombstones.

## Compiler API

Load the channel DNA first:

```html
<script src="wwam-channel-dna.js"></script>
<script src="wwam-channel-pack-adapter.js"></script>
<script src="channel-pack-contract.js"></script>
```

Compile a pack from the DNA plus the channel's explicit operational adapter:

```js
const pack = window.ShokkerChannelPack.compile(
  window.WWAM_CHANNEL_DNA,
  window.WWAM_CHANNEL_PACK_ADAPTER
);

pack.fingerprint;
window.ShokkerChannelPack.validate(pack);
window.ShokkerChannelPack.serialize(pack);
```

The adapter must explicitly provide:

```js
{
  laneInclusion: {
    commentary: "The exact editorial inclusion rule"
  },
  evidencePolicy: {
    machineOutputState: "quarantine",
    curatedCandidateState: "timestamp-validated-human-curated-candidate",
    curatedCandidateAuthenticated: false,
    editorVerificationRequiresAuthentication: true,
    promotionRequiresHumanReview: true,
    corrections: "append-only",
    preserveContradictions: true
  },
  updateContract: {
    stages: ["discover", "quarantine", "review", "promote"],
    sourceOfTruth: "The official upload feed",
    cadenceClaim: "The cadence the product can honestly prove",
    removalPolicy: "tombstone"
  },
  storage: {
    namespace: "shokker.youtube-wiki.channel-id.v1",
    partitionKeys: ["channelId", "sourceId"],
    exportPrefix: "channel-id-memory"
  },
  surfaceVocabulary: {
    ask: "A CHANNEL-NATIVE ASK LABEL",
    receipt: "A CHANNEL-NATIVE RECEIPT LABEL",
    source: "A CHANNEL-NATIVE SOURCE LABEL",
    unknown: "AN HONEST UNKNOWN LABEL",
    quarantine: "A MACHINE-CANDIDATE LABEL",
    curatedCandidate: "A TIMESTAMP-VALIDATED HUMAN-CURATED CANDIDATE LABEL",
    reviewed: "A HUMAN-REVIEW LABEL",
    certified: "AN OWNER-CERTIFIED LABEL",
    correction: "A CORRECTION LABEL"
  },
  longitudinalVocabulary: {
    product: "A CHANNEL-NATIVE LONGITUDINAL PRODUCT LABEL",
    forecast: "A CHANNEL-NATIVE BEFORE-TAPE LABEL",
    response: "A CHANNEL-NATIVE AFTER-TAPE LABEL",
    unresolved: "AN HONEST UNRESOLVED LABEL",
    editBrief: "A CHANNEL-NATIVE EDIT-BRIEF LABEL"
  },
  adjudicationVocabulary: {
    SUPPORTED: {
      formal: "SUPPORTED // A SCOPED CHANNEL-NATIVE LABEL",
      comedy: "A CHANNEL-NATIVE SUPPORTED LABEL",
      bleep: "A CHANNEL-NATIVE SUPPORTED LABEL"
    },
    CONTRADICTED: {
      formal: "CONTRADICTED // A SCOPED CHANNEL-NATIVE LABEL",
      comedy: "A CHANNEL-NATIVE CONTRADICTED LABEL",
      bleep: "A CHANNEL-NATIVE CONTRADICTED LABEL"
    },
    MIXED: {
      formal: "MIXED // A SCOPED CHANNEL-NATIVE LABEL",
      comedy: "A CHANNEL-NATIVE MIXED LABEL",
      bleep: "A CHANNEL-NATIVE MIXED LABEL"
    }
  },
  capabilities: [
    "receipt-search",
    "tape-companion",
    "creator-taste-calibration",
    "fresh-tape-intake",
    "human-adjudication-ledger",
    "longitudinal-claim-ledger"
  ]
}
```

There are no safety-relevant defaults. A missing policy produces a
`ChannelPackValidationError` with structured `path`, `code`, and `message`
issues.

Each formal adjudication label must begin with its canonical code. Comedy copy
is decorative; its reduced-profanity variant may only replace profanity with
`[BLEEP]`, never change the result. Every display mode rejects language that
claims official, creator, canon, rights, identity, speaker, causal,
publication, certification, or approval authority.

The browser compiler publishes its API through a non-writable,
non-configurable global binding. Verdict Room captures that exact frozen API
and fails if it changes. This prevents later global substitution; production
hosting must still use script-integrity controls such as a restrictive CSP
and/or SRI because client code cannot prove its own authenticity after an
arbitrary same-origin script compromise.

Channel DNA must likewise declare `voice.proofLabels.curatedCandidate`
separately from its machine, editor, creator, and inference labels. Its
`entities` collection becomes the compiled `entityRegistry`; every entity ID
must have a unique label and a type declared in the DNA taxonomy.

A capability is a declared runtime contract, not evidence that a feature is
correct or authorized. ChannelPack validates the declaration and isolates its
configuration. Feature-level regression suites must still prove the engine's
behavior against real and neutral inputs.

## Determinism and isolation

Objects and semantic sets are normalized before fingerprinting. Equivalent
source-lane maps, taxonomies, entity registries, longitudinal vocabularies,
adjudication vocabularies, and capability sets produce the same canonical JSON
and `cp1-…` fingerprint even
if their semantic-set input order differs. Prototype-sensitive keys are
rejected recursively before canonicalization. The fingerprint is a
reproducible change detector, not a cryptographic signature. Any post-compile
mutation invalidates it.

The current WWAM V5.14 artifact is `cp1-dd23bc386008689b`. This value is a
dated change detector for the compiled policy, not a permanent ID. The V5.13
artifact was `cp1-f9ad38be22481b5d`; declaring the fingerprint-bound
`adjudicationVocabulary` and `human-adjudication-ledger` capability
intentionally changed it. The V5.6 artifact was `cp1-8ac1488f4f78448c`.

Multiple products can be checked together:

```js
const report = window.ShokkerChannelPack.validatePortfolio([
  wwamPack,
  anotherChannelPack
]);
```

The portfolio validator rejects duplicate channel IDs and storage namespaces.
That makes "same engine, separate products" an executable rule instead of a
folder-naming convention.

## Portable capability patterns

### Tape Companion

The companion consumes channel labels plus generic source, receipt, heat,
entity, and relationship records. Its share state binds the channel ID and
derived channel fingerprint, archive fingerprint, source fingerprint, and
playback position. A valid binding can restore a view; it cannot promote
evidence or prove who operated it. Playback APIs return only snapshot-safe and
already-crossed events, while a manual rail and official timestamp link
preserve utility when the embedded player API is unavailable.

### Creator Taste Calibration

The calibration engine consumes adapter-defined labels and candidate feature
dimensions. Its artifact binds the channel, ChannelPack, Clip Lab snapshot,
eligible inventory, declared goal, risk ceiling, round blueprint, and exact
decision ledger. Local preference may change only a bounded derived modifier
and ordering. It cannot become evidence, canon, identity, rights clearance, or
creator approval.

### Fresh Tape Intake

The intake engine consumes a compiled ChannelPack, explicit channel-native
topic and signal rules, manually supplied YouTube source metadata, and a
manually supplied transcript payload. It performs no network discovery or
download. WebVTT, SRT, and YouTube JSON3 can yield exact-event candidates;
plain text has no timestamp proof and is held with zero candidates.

Every candidate remains machine-surfaced, unreviewed, quarantined, undiarized,
and promotion-ineligible. URL validation establishes only canonical YouTube
shape and video-ID agreement. It does not verify channel ownership. Export
verification binds the ChannelPack fingerprint, source lanes, rule
fingerprint, event-ledger fingerprint, safe excerpt limit, and candidate
derivation. It does not authenticate an operator or convert a local artifact
into a promoted product record. All intake fingerprints are FNV-based
deterministic structural change detectors only. `verifyExport()` leaves source
content, authenticity, and authority verification explicitly false; it does
not prove ownership, speaker identity, or any other authority claim.

Configured word and event limits are paired with maximum characters per word,
caption event, and public excerpt. This prevents a single oversized token from
bypassing the public excerpt boundary.

### The Verdict Room

The adjudication engine consumes only a validated ChannelPack that declares
both `longitudinal-claim-ledger` and `human-adjudication-ledger`. The pack must
own exact `formal`, `comedy`, and `bleep` labels for the three canonical V1
codes: `SUPPORTED`, `CONTRADICTED`, and `MIXED`. Runtime callers choose a code;
they never supply a label.

Those labels travel inside the compiled fingerprint, so a changed or foreign
vocabulary makes saved review input stale. The engine independently re-resolves
the live canonical docket packet and requires twelve caller-attested human
checks before one scoped local result can render. This declaration does not
verify the reviewer, clear rights, assign a speaker, prove causality, certify a
creator, mutate Canon, or publish to a server. Revoke is append-only and
suppresses the active result without erasing its history.

These patterns are deliberately separate from channel voice. A horror channel
can synchronize recurring-character callbacks, calibrate dark-comedy edit
inventory, and render its own adjudication copy; a racing channel can
synchronize lead changes and cautions, calibrate close-finish or
booth-intensity inventory, and render steward-style verdict labels through the
same contracts. Both can also run Fresh Tape Intake with their own source lanes
and literal rules. The rules and labels change; the bounded evidence and
authority boundaries do not.

## Portability proof

The regression suite compiles:

1. the real `WWAM_CHANNEL_DNA`, with four current evidence lanes and WWAM-native
   surface language; and
2. a tiny fictional racing archive with event/participant/track taxonomy and
   racing-native surface language.

Both pass the same compiler. The racing serialization is explicitly checked
for WWAM, Loomis, Scream, horror, and UP IN YA leakage. Invalid lane boundaries,
machine promotion, skipped review, foreign namespaces, speaker guessing,
missing vocabulary, artifact tampering, and portfolio collisions all fail
closed.

The Tape Companion, Creator Taste, and Fresh Tape Intake suites separately
compile neutral racing inputs and reject WWAM or horror vocabulary leakage.

Run the proofs:

```bash
node --test tests/channel-pack-contract.test.mjs \
  tests/tape-companion-engine.test.mjs \
  tests/creator-taste-engine.test.mjs \
  tests/fresh-tape-intake-engine.test.mjs \
  tests/v56-fresh-tape-intake-contract.test.mjs
```
