# ChannelPack V1 executable contract

ChannelPack is the tested adapter boundary between the reusable Shokker
YouTube Wiki Memory OS and one channel's irreplaceable identity. It is code,
not a pitch-deck promise: one compiler accepts WWAM's existing Channel DNA and
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
- `tests/fixtures/channel-pack-neutral-racing.mjs` is a synthetic, test-only
  portability fixture. It is not VRL data and is never loaded by the WWAM
  public demo.

The compiler is intentionally not part of the first-load bundle. Buyers can
inspect or download the contract without making the fan experience heavier.

## The eight conformance domains

| Domain | What the pack must declare | What the compiler refuses |
| --- | --- | --- |
| Identity | Stable channel ID, pack version, public label, source channel, promise | Missing identity, free-form IDs, invalid versions |
| Source lanes | Label, purpose, and an explicit inclusion boundary for every lane | Inferred boundaries, orphan rules, empty lanes |
| Taxonomy | Entity, receipt, and relationship types | A taxonomy without the universal `source` entity or duplicate types |
| Evidence policy | Excerpt ceiling, source/timestamp requirements, speaker restraint, review state | Speaker guessing, synthetic character audio, machine-to-public promotion |
| Update contract | `discover → quarantine → review → promote`, official source, honest cadence | Skipped review, implied automation, silent source removal |
| Storage | Channel-scoped namespace, channel-first partitioning, source partition, export prefix | Namespace mismatch or storage that can mix channels |
| Surface vocabulary | Eight channel-native labels for ask, receipt, source, unknown, quarantine, review, certification, and correction | Generic missing states or duplicate labels |
| Capabilities | The product surfaces this channel actually enables | An empty capability claim |

Machine output must enter `quarantine`; public promotion requires human review.
Corrections are append-only, contradictory evidence survives certification,
and removed sources leave tombstones.

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
    reviewed: "A HUMAN-REVIEW LABEL",
    certified: "AN OWNER-CERTIFIED LABEL",
    correction: "A CORRECTION LABEL"
  },
  capabilities: ["receipt-search"]
}
```

There are no safety-relevant defaults. A missing policy produces a
`ChannelPackValidationError` with structured `path`, `code`, and `message`
issues.

## Determinism and isolation

Objects and semantic sets are normalized before fingerprinting. Equivalent
source-lane maps, taxonomies, and capability sets produce the same canonical
JSON and `cp1-…` fingerprint even if their input order differs. The
fingerprint is a reproducible change detector, not a cryptographic signature.
Any post-compile mutation invalidates it.

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

Run the proof:

```bash
node --test tests/channel-pack-contract.test.mjs
```
