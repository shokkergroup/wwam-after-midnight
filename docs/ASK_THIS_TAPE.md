# Ask This Tape

Release contract for **V5.18 / 0.5.18**.

## Product promise

Ask This Tape answers one question about one canonical Source Dossier.

> Ask this upload what the archive has actually registered inside it. If this
> upload cannot support the answer, stop here.

This is deliberately different from archive-wide Ask WWAM. Archive-wide search
may discover another relevant source. Ask This Tape may not. It resolves and
verifies the requested source ID and optional source fingerprint before it
parses the question.

## Exact-source invariant

Every answer boundary records:

```text
exactSourceOnly: true
crossSourceSubstitution: false
titleInferenceUsed: false
```

Therefore:

- every content result carries the requested source ID;
- an identical upload title cannot redirect the question;
- a more popular or higher-scoring receipt in another source cannot replace
  missing local evidence;
- a title alias may support source navigation, but not a content answer;
- an unsupported subject returns zero local content receipts; and
- a stale source fingerprint refuses before query interpretation.

Connections are typed navigation results. They may identify another source,
but they cannot become substitute evidence, content claims about the target,
true-origin claims, or causality claims.

## Current WWAM source registry

Ask This Tape is available from every one of the 510 canonical dossiers:

| Coverage | Sources | Source-local behavior |
| --- | ---: | --- |
| `caption-backed` | 111 | May answer from registered local receipts, entities, artifacts, metadata, and summaries |
| `metadata-only` | 390 | May expose source proof; content questions refuse |
| `caption-limited` | 9 | May expose only the defensible source boundary; missing content is not reconstructed |
| `unavailable` | 0 | Would expose only the registered source boundary |

The full dossier registry contains **1,490 receipts** and **928 source-bound
artifact records**. Those current totals must not be conflated with the
immutable V5.4 proof of **84 source inputs and 872 promoted receipts**. The
84/872 proof is a frozen historical ledger.

The 1,490-receipt taxonomy is:

| Evidence type | Count |
| --- | ---: |
| `caption-excerpt` | 701 |
| `caption-topic-receipt` | 592 |
| `caption-topic-navigation` | 120 |
| `curated-character-performance` | 25 |
| `caption-character-signal` | 24 |
| `caption-character-context` | 28 |

Archive Deep's 24 character signals and 28 character contexts are
machine-surfaced, speaker-undiarized, and quarantined. None of those 52 records
is a curated performance.

## Supported question shapes

The portable engine recognizes typed source-local lanes:

- inventory;
- receipts or moments;
- entities, topics, characters, drivers, or events;
- artifacts, drafts, Shorts, supercuts, and opportunities;
- related-source connections;
- source proof and metadata;
- a registered source summary; and
- a bounded free-text search over the current dossier.

The output types are `receipt`, `entity`, `artifact`, `connection`, and
`metadata`.

The engine also preserves explicit non-answer states:

- `metadata-only`;
- `caption-limited`;
- `unavailable`;
- `insufficient-evidence`;
- `speaker-refused`;
- `ranking-refused`; and
- `stale-source`.

“Who said this?” cannot invent a speaker from undiarized automatic captions.
“What is the funniest/best/craziest moment?” cannot manufacture an objective
source ranking merely because receipt labels or heat values exist.

## Exact playback bounds

All 25 timestamp-validated human-curated character-performance receipts retain
their explicit human-curated start and end. Every current window is exactly 14
seconds; the dossier adapter does not replace it with a generic 30-second
fallback.

The launch example is:

```text
character-receipt:loomis-funding
source: LV2rmwEA0w4
start: 9042.64
end: 9056.64
```

The receipt is a human-curated candidate with exact source coordinates. It is
not an authenticated editor decision, a speaker-diarized clip, rights
clearance, or creator certification.

## The Tape's Wake

Wake output distinguishes truth from display density:

- `matchingTotal` is the number of registered relationships that passed;
- `displayed` is the number returned in the bounded collection; and
- `truncated` states whether more matches exist.

The engine display collection remains capped at 16. For `LV2rmwEA0w4`:

```text
matchingTotal: 138
displayed: 16
truncated: true
```

A compact UI may preview fewer cards, but 16—or the smaller preview—must never
be labeled as the complete match count.

## Compact interface and stable routes

The Source Dossier opens in a compact Director's Cut. Dense lanes can expand
individually, and **Open Full File** reveals the registered file. Disclosure
changes presentation only; it does not alter source scope, evidence, order, or
authority.

Canonical source routes may retain one closed section key:

```text
?source=LV2rmwEA0w4&at=9043&section=ask#archive
```

Supported sections are:

- `proof`;
- `player`;
- `ask`;
- `inside`;
- `footprint`;
- `wake`;
- `chronology`;
- `work`; and
- `boundary`.

Unknown section values are discarded. A section route focuses the rendered
dossier; it does not initialize playback.

## Mike demonstration path

### 1. July 23 Loomis proof

Open:

```text
?source=LV2rmwEA0w4&at=9043&section=ask#archive
```

Ask:

> Show me Dr. Loomis moments

The answer must stay on `LV2rmwEA0w4`. The two source-local Loomis receipts
include:

- `character-receipt:loomis-funding @ 9042.64–9056.64`;
- `character-receipt:loomis-pepto @ 10734.88–10748.88`.

Play the funding result and point out that the exact 14-second end survives
into in-page official-source playback.

### 2. Duplicate-title Challis proof

Open:

```text
?source=ag3axSC9BpU&section=ask#archive
```

The July 9 and July 23 uploads share the same generic livestream title pattern.
Ask:

> Show me Dr. Challis moments

The answer must contain only `ag3axSC9BpU` results:

- `character-receipt:challis-miguel @ 3860.72–3874.72`;
- `character-receipt:challis-doctor @ 9851.76–9865.76`.

It must not borrow
`character-receipt:challis-birthday @ 8309.12–8323.12` from
`LV2rmwEA0w4`. This proves that title text does not define source scope.

### 3. Metadata-only refusal

Open:

```text
?source=FVuwRHM0kcc&section=ask#archive
```

Ask:

> Who won the Marvel vs DC bracket?

The correct result is `metadata-only` with zero source-content receipts. The
cached title identifies the upload but cannot establish its winner. Source
proof and official navigation remain useful.

## Tape Companion handoff

**Watch With Memory** uses the same complete source registry. Tape Companion
lists all **510** canonical sources:

- **71 memory-ready**;
- **439 source-only**.

The historical promoted subset remains 74 sources—71 ready plus three
disclosed caption gaps—and 872 exact receipt members. Registering all 510
sources does not rewrite that frozen subset or invent synchronized events for
the 439 source-only records.

## Browser contract

Requests use `shokker-source-query/v1`; results use
`shokker-source-query-result/v1`.

```js
const dossiers = window.ShokkerSourceDossier.create(sourceDossierPayload);
const query = window.ShokkerSourceQuery.create({
  dossierEngine: dossiers
});
const dossier = dossiers.build("LV2rmwEA0w4");

const answer = query.answer({
  schema: "shokker-source-query/v1",
  sourceId: dossier.source.id,
  sourceFingerprint: dossier.source.sourceFingerprint,
  query: "Show me Dr. Loomis moments",
  at: 9042.64,
  limit: 8
});
```

The request accepts no title field. Channel-specific vocabulary may extend
intent matching, but it cannot weaken the exact-source invariant.

## Authority boundary

Ask This Tape does not establish:

- speaker identity;
- exact intent or target;
- continuity between receipts;
- true bit origin;
- causality or influence;
- an objective best/funniest ranking;
- rights clearance;
- creator approval;
- creator certification;
- Canon mutation;
- publication; or
- current network availability.

An exact timestamp proves where a registered receipt lives. A refusal proves
that this source file cannot currently support more. Both are successful
product outcomes.
