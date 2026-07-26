# Receipt Matrix

Release contract for **V5.21 / 0.5.21**.

## Product promise

Receipt Matrix answers source-set questions without confusing a receipt count
with a source count.

It can answer:

- how many registered uploads contain eligible evidence for one entity;
- which uploads contain eligible evidence for every requested entity;
- which upload contains the most eligible receipts across a requested group;
- where the eligible performances for one entity occur in source-date order;
  and
- which exact bounded receipts support every source group in the answer.

Every answer is compiled from canonical Source Dossiers. Results remain grouped
by official upload, and a receipt that matches two requested entities remains
one receipt. A metadata mention, an artifact label, an unbounded machine
candidate, or a repeated receipt reference cannot inflate the answer.

Receipt Matrix lives inside the existing **Ask WWAM** surface. It does not add
another homepage section, navigation destination, player, archive, or truth
system.

## Current WWAM proof

The V5.21 release pins three questions against the complete 510-source Source
Dossier build:

| Question | Unique uploads | Eligible receipts |
| --- | ---: | ---: |
| How many uploads contain Dr. Loomis performances? | 5 | 7 |
| Which uploads contain both Dr. Loomis and Dr. Challis performances? | 4 | 11 |
| Which upload has the most performances by Loomis, Challis, Slenderman, or Corey Feldman? | 12 matching uploads | 25 total receipts |

The four-character ranking begins:

| Rank | Official source ID | Eligible receipts |
| ---: | --- | ---: |
| 1 | `LV2rmwEA0w4` | 6 |
| 2 | `ag3axSC9BpU` | 5 |
| 3 | `N-UahfG8-gM` | 3 |

The Loomis-only ledger is seven exact receipts in five sources:

| Source ID | Date | Loomis receipts |
| --- | --- | ---: |
| `WyT--HIrL8U` | 2022-08-20 | 1 |
| `Qc2vVFMO4ts` | 2023-08-13 | 1 |
| `N-UahfG8-gM` | 2026-06-04 | 2 |
| `ag3axSC9BpU` | 2026-07-09 | 1 |
| `LV2rmwEA0w4` | 2026-07-23 | 2 |

The Loomis-and-Challis intersection is:

| Source ID | Date | Combined exact receipts |
| --- | --- | ---: |
| `WyT--HIrL8U` | 2022-08-20 | 2 |
| `N-UahfG8-gM` | 2026-06-04 | 3 |
| `ag3axSC9BpU` | 2026-07-09 | 3 |
| `LV2rmwEA0w4` | 2026-07-23 | 3 |

These are release proofs, not hand-entered answer copy. The core recomputes them
from Source Dossier fingerprints and the exact eligible receipt contract.

## Exact lazy asset contract

The existing `#ask` section owns the feature declaration.

Its style list is exactly:

```text
ask-review.css,play-answer.css,receipt-matrix.css
```

Its script list is exactly:

```text
ask-review-engine.js,ask-review-ui.js,channel-pack-contract.js,wwam-channel-pack-adapter.js,play-answer-engine.js,play-answer-ui.js,receipt-matrix-query.js,receipt-matrix-engine.js,receipt-matrix-ui.js,wwam-receipt-matrix-host.js
```

The order is part of the contract. The query router is available before the
core/UI/host handoff, and the host is evaluated last. None of the four Receipt
Matrix assets may appear as an eager `<script>` or `<link>`.

The canonical Source Dossier adapter, engine, and archive data are not added to
that list. `WWAMSourceDossierAccess.load()` owns their existing demand-loaded
runtime and `WWAMSourceDossierAccess.get()` returns the resulting engine.

## Core contract

File: `public/demo/receipt-matrix-engine.js`

Global: `ShokkerReceiptMatrix`

The global is frozen and exposes:

```js
ShokkerReceiptMatrix.create({
  dossierEngine,
  policy
});
```

The returned engine is frozen and exposes:

```text
query(spec)
listEntities()
getStats()
fingerprint
bindings
policy
```

### Query request

```js
{
  schema: "shokker-receipt-matrix-request/v1", // optional
  entityIds: ["character:loomis"],             // 1-8 unique known IDs
  quantifier: "all",                           // "all" or "any"
  order: "receipt-count-desc"                  // one of four exact orders
}
```

The supported orders are:

- `receipt-count-desc`;
- `source-date-asc`;
- `source-date-desc`; and
- `title-asc`.

The schema, quantifier, and order are closed enums. Entity IDs are canonicalized
into sorted order before execution, so reversing equivalent input cannot alter
the answer or its fingerprint.

### Query result

The result schema is `shokker-receipt-matrix-result/v1`. A result contains:

- `status`: `supported` or `insufficient-evidence`;
- the canonical request;
- channel, archive, registry, and policy bindings;
- `uniqueSourceCount`;
- `eligibleReceiptCount`;
- per-entity source and receipt totals;
- source groups in the requested deterministic order;
- exact eligible receipt rows with source and dossier fingerprints;
- an explicit non-implication boundary;
- an all-false authority object; and
- a deterministic result fingerprint.

Every source group contains its official source ID, display title, source date,
official URL, source fingerprint, dossier fingerprint, receipt count,
per-entity coverage, exact receipt rows, and rank.

### Eligibility policy

The universal engine contains no WWAM, horror, movie, race, driver, or podcast
vocabulary. The channel adapter supplies an exact-match policy.

The WWAM V5.21 policy admits only:

```js
{
  kind: "character-performance",
  evidenceType: "curated-character-performance",
  evidenceBasis: "exact-showcase-receipt",
  reviewState: "timestamp-validated-human-curated-candidate",
  publicExcerptAllowed: true,
  promotionAllowed: false
}
```

The source must also be `promoted-lane`, `caption-backed`, public at the
snapshot, non-quarantined, and bound to the same channel/archive registry as
every other dossier.

Omitting `policy` activates the frozen closed-default policy. It admits zero
receipts. There is no broad `kind`, evidence-type, title, metadata, artifact,
or fuzzy fallback.

## Natural-language router contract

File: `public/demo/receipt-matrix-query.js`

Global: `ShokkerReceiptMatrixQuery`

The router is deterministic and local. It turns only supported,
source-matrix-shaped questions into a
`shokker-receipt-matrix-route/v1` object. A supported route supplies canonical,
sorted `matrix.entityIds`, an `all` or `any` quantifier, one of the four core
orders, display labels, an answer shape, and an honest chronology warning.

```js
const router = ShokkerReceiptMatrixQuery.create({
  entities: [{
    id: "character:loomis",
    label: "Dr. Loomis",
    aliases: ["Loomis", "Dr Loomis"]
  }],
  groups: [{
    id: "recurring-characters",
    label: "Recurring Characters",
    entityIds: [
      "character:loomis",
      "character:challis",
      "character:slenderman",
      "character:corey-feldman"
    ],
    aliases: ["characters", "character performances"]
  }],
  vocabulary: {
    sourceTerms: ["upload", "source", "stream"],
    performanceTerms: ["performance"],
    chronologyTerms: ["chronologically", "across years"],
    lineageTerms: ["lineage", "supercut"]
  }
});

router.route(query, {
  entityIds: ["character:loomis"] // optional exact-ID context; no other fields
});
```

The route contains:

```js
{
  schema: "shokker-receipt-matrix-route/v1",
  matched: true,
  status: "supported", // or "unknown-entity"
  mode,
  answerShape,
  matrix: {
    schema: "shokker-receipt-matrix-request/v1",
    entityIds,
    quantifier,
    order
  },
  matchedTerms,
  entityLabels,
  groupId,
  groupLabel,
  chronologyWarning,
  unknownTerms
}
```

The supported route modes are:

- `entity-source-count`;
- `source-entity-intersection`;
- `group-source-ranking`;
- `entity-performance-chronology`; and
- `entity-lineage`.

Examples:

| Natural-language request | Route mode | Core request |
| --- | --- | --- |
| `How many uploads feature Dr. Loomis?` | `entity-source-count` | Loomis, `any`, title ascending |
| `Which uploads contain both Dr. Loomis and Dr. Challis performances?` | `source-entity-intersection` | Challis + Loomis, `all`, receipt-count descending |
| `Which stream has the most Loomis, Challis, Slenderman, or Corey Feldman performances?` | `group-source-ranking` | all four characters, `any`, receipt-count descending |
| `Show every Dr. Loomis performance chronologically.` | `entity-performance-chronology` | Loomis, `all`, source-date ascending |
| `Build a Loomis supercut across years.` | `entity-lineage` | Loomis, `any`, source-date ascending |

“Both,” “all,” “every,” and explicit intersection language select `all`.
“Any,” “either,” “or,” group-ranking language, and single-entity requests
select `any`. “Earliest,” “oldest,” “first,” and chronological language select
`source-date-asc`; “latest,” “newest,” and recent language select
`source-date-desc`.

Unknown entities, ambiguous aliases, no recognized entities, unsupported
question shapes, unsafe objects, duplicate IDs, and more than eight entities do
not become a broad archive search. They return an explicit held/unsupported
route or fail closed according to the router API.

## Embedded UI contract

Files:

- `public/demo/receipt-matrix-ui.js`
- `public/demo/receipt-matrix.css`

Global: `ShokkerReceiptMatrixUI`

```js
const ui = ShokkerReceiptMatrixUI.create({
  document,
  mount,          // existing #askResults
  onPlay,
  onOpenSource,
  onOpenLineage,
  onExport,
  copy            // optional channel vocabulary
});

ui.open({ query, route, analysis, launcher });
ui.getState();
ui.destroy();
```

The render root is `.receipt-matrix`; its heading is
`#receiptMatrixHeading`; its live status is `#receiptMatrixStatus`; and the
existing mount receives `data-receipt-matrix-state`.

The first totals are **UNIQUE SOURCES** and **ELIGIBLE RECEIPTS**. Source groups
retain core order. Per-entity coverage, exact bounds, receipt keys, source
fingerprints, dossier fingerprints, evidence labels, review states, and
non-diarized speaker status remain inspectable.

The UI filters malformed, unbounded, or cross-source receipt rows before it
enables an action. It creates no iframe, video, audio element, dialog, section
destination, or second player.

## WWAM host contract

File: `public/demo/wwam-receipt-matrix-host.js`

Global: `WWAMReceiptMatrixHost`

The host auto-binds idempotently when its demand-loaded script is evaluated and
exposes:

```text
bind()
match(query)
handle(query, launcher?)
destroy()
getState()
```

The host:

1. observes the existing `#askForm`/`#askInput` path;
2. gives the deterministic router the first chance to recognize a matrix
   question;
3. leaves unsupported questions to the existing Ask engine;
4. loads `WWAMSourceDossierAccess` only for a recognized route;
5. creates the exact WWAM policy-bound Receipt Matrix;
6. queries it with `route.matrix`;
7. renders into the existing `#askResults`;
8. writes status through the existing `#askStatus`; and
9. hands a clicked receipt to `WWAMSourceDossierAccess.play(payload)`.

The host must not call a private player, construct embed HTML, or substitute a
different source when playback is unavailable. Source Dossier Access
re-resolves the canonical receipt and delegates to the existing shared player.

## Same-source non-implication boundary

Receipt membership in the same upload does not prove:

- the same speaker;
- an interaction or conversation between receipts;
- simultaneity or the same moment;
- speaker continuity;
- intentional callback or continuity;
- causality or influence;
- true origin or a first-ever performance;
- creator approval;
- rights clearance;
- Canon promotion or mutation;
- copied or downloaded media; or
- publication of an edit.

“Both characters have eligible receipts in this upload” is valid.
“Both characters interacted in this upload” is not established.

An `all` intersection requires at least one eligible receipt for every requested
entity in the same registered source. It does not require or imply that those
receipts overlap.

## Failure modes

The core fails closed on:

- unknown, duplicate, empty, or oversized entity requests;
- unknown schemas, quantifiers, orders, or request fields;
- accessors, symbols, inherited fields, cycles, sparse arrays, unsafe keys, or
  non-JSON values;
- an empty, duplicated, foreign, stale, or mixed-binding source registry;
- a dossier whose fingerprint no longer matches its body;
- a source fingerprint that disagrees with the canonical list;
- duplicate global receipt keys;
- a receipt or entity reference that leaves its canonical source;
- conflicting canonical metadata for one entity ID;
- non-finite, unbounded, reversed, or out-of-source time windows;
- speaker claims on eligible non-diarized receipts;
- unavailable, source-only, metadata-only, caption-limited, or quarantined
  source lanes;
- withheld, rejected, quarantined, promoted, or non-excerptable receipt
  contracts; and
- policies that weaken the non-diarized or non-promotional boundary.

An empty result means **insufficient evidence in the current eligible index**.
It never means the event or performance never happened.

## Local-only and source-dormant behavior

Routing, matrix compilation, grouping, ranking, and rendering are local browser
operations over packaged data. They make no API request and do not send a query
to an AI service.

The feature is source-dormant:

- its assets are demand-loaded with the existing Ask section;
- Source Dossiers load only after a supported matrix route;
- compiling or displaying a result creates no media;
- no official upload starts while binding, routing, compiling, rendering,
  expanding proof, opening lineage coverage, or exporting; and
- playback begins only when a visitor selects **PLAY EXACT RECEIPT** or the
  corresponding official-source action.

The selected `sourceId`, `receiptKey`, `at`, `end`, source fingerprint, and
dossier fingerprint remain attached to the handoff. A player failure retains
an official-source recovery path; it does not widen the receipt or silently
play a neighboring upload.

## Export limits

The UI export schema is `shokker-receipt-matrix-export/v1`.

An export may contain:

- the original local query;
- the deterministic route;
- the exact matrix analysis;
- rendered source, receipt, and entity IDs;
- counts and fingerprints;
- exact bounded coordinates;
- evidence/review labels; and
- the non-implication boundary.

An export is an evidence/navigation packet. It is not an edit decision or a
media package. It must not:

- copy audio or video;
- contain a media blob or embedded player;
- expand a short excerpt into a transcript;
- declare a speaker;
- grant creator approval or rights;
- promote Canon;
- claim causality, interaction, continuity, or origin; or
- publish anything.

## Channel-neutral racing adaptation

Receipt Matrix does not know what a character, movie, livestream, race, driver,
truck, track, or booth call is. A racing ChannelPack supplies those entities
and an exact receipt policy.

For example:

```js
const racingPolicy = {
  id: "league-reviewed-race-moments/v1",
  source: {
    authority: "promoted-lane",
    coverage: "caption-backed"
  },
  receiptContracts: [{
    kind: "race-moment",
    evidenceType: "caption-excerpt",
    evidenceBasis: "official-broadcast-caption",
    reviewState: "timestamp-validated-human-reviewed",
    publicExcerptAllowed: true,
    promotionAllowed: false
  }],
  requireSpeakerUndiarized: true
};
```

The same engine can then answer:

- How many Wednesday-night broadcasts contain a Ricky Whittenburg receipt?
- Which races contain both a lead-change receipt and a photo-finish receipt?
- Which Wednesday race contains the most eligible booth-and-race receipts?
- Show Alan Vaught’s eligible race moments in source-date order.
- Which broadcasts contain both an Announcer’s Curse setup candidate and its
  separately indexed incident candidate?

A single exact race receipt tagged to both `driver:car-33` and
`event:photo-finish` counts once in the group while satisfying both entity
coverage rows. A season-recap artifact, title alias, Friday race, Monday mock
race, quarantined booth scan, or unbounded crash signal contributes nothing
unless the league adapter registers an independently eligible exact receipt.

The engine can establish that two eligible racing entities have receipt
membership in the same official Wednesday-night broadcast. It cannot establish
that an announcer caused a wreck, a prediction was prophetic, two drivers
interacted, or one moment caused another without a separately reviewed
relationship contract.

This is the reusable formula:

```text
channel vocabulary and exact entity registry
  -> canonical Source Dossiers
  -> explicit exact-match receipt policy
  -> deterministic natural-language route
  -> source-grouped and deduplicated evidence
  -> local embedded proof UI
  -> visitor-initiated official-source playback
  -> no speaker, interaction, causality, origin, approval, rights, or Canon inflation
```
