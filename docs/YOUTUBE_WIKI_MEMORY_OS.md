# YouTube Wiki Memory OS

Version 1.0 — a reusable, evidence-first operating system for living channel archives.

## Product thesis

A transcript summary is a disposable output. A channel memory is a compounding asset.

The Memory OS turns every indexed upload into:

- durable, timestamped evidence;
- connections to people, topics, events, jokes, characters, and earlier uploads;
- editorial work queues that improve trust;
- fan experiences that become richer as the archive grows;
- creator tools that can turn old material into new programming;
- a channel-specific knowledge pack that transfers the system without flattening the channel’s identity.

The defensible product is not “AI made a website.” It is a source-backed memory graph plus human editorial judgment. Every new upload adds evidence, relationships, and known vocabulary. A copycat can generate another summary; it cannot instantly recreate years of verified lore.

## Non-negotiable rules

1. **A public factual claim must resolve to evidence.** Video ID and timestamp are the minimum viable receipt.
2. **Inference must identify itself.** Opinion changes, joke origins, excitement scores, and humor scores are useful interpretations—not facts.
3. **Unknown is a valid answer.** Missing captions or ambiguous speakers remain unknown until reviewed.
4. **The machine proposes canon; people certify it.** High-value findings enter a review queue.
5. **The archive must sound like the channel without pretending to be the channel.**
6. **Generated character dialogue is never presented as a real quote.** Archival audio and generated text are separate surfaces.
7. **Every new feature must improve discovery, trust, creator utility, or fan delight.** If it does none of those, it is decoration.

## Universal evidence schema

The implementation can live in JSON, a relational database, or a graph database. The semantics must remain stable.

### Source

One canonical video or audio program.

```json
{
  "id": "youtube-video-id",
  "channelId": "wwam",
  "type": "livestream",
  "lanes": ["fresh-live", "popular-live"],
  "title": "Source title",
  "publishedAt": "2026-07-23",
  "durationSeconds": 12785,
  "viewCountObserved": 5067,
  "viewCountObservedAt": "2026-07-23",
  "url": "https://www.youtube.com/watch?v=...",
  "captionStatus": "available",
  "captionKind": "auto",
  "wordsAudited": 42000,
  "ingestFingerprint": "stable-content-hash"
}
```

Important distinctions:

- `publishedAt` is historical.
- Views are a time-stamped observation and will change.
- One source may belong to several lanes. “Fresh 10” and “Popular 25” are collections, not duplicate videos.
- Caption availability is never implied by source discovery.

### Receipt

The smallest replayable unit of evidence.

```json
{
  "id": "video-id:moment:2270:room-break:0",
  "sourceId": "video-id",
  "t": 2270,
  "end": 2290,
  "url": "https://www.youtube.com/watch?v=...&t=2270s",
  "type": "moment",
  "category": "THE ROOM BREAKS",
  "excerpt": "Short, copyright-bounded transcript excerpt",
  "evidenceLevel": "machine",
  "speaker": null,
  "speakerConfidence": 0,
  "entityIds": ["topic:halloween"],
  "score": 92
}
```

Receipt requirements:

- `sourceId`, `t`, and playable `url`;
- a bounded excerpt when transcripts are used;
- the extraction method and evidence level;
- no named speaker unless the evidence supports it;
- deterministic ID generation so corrections do not create silent duplicates.

### Entity

Something the channel repeatedly talks about or performs.

```json
{
  "id": "character:loomis",
  "type": "character",
  "label": "Dr. Loomis",
  "aliases": ["loomis", "dr loomis", "doctor loomis"],
  "channelAttributes": {
    "performer": "J",
    "performerStatus": "owner-confirmed"
  }
}
```

Universal entity types:

- source;
- series, season, or franchise;
- episode, race, film, or event;
- topic;
- person, participant, driver, host, or guest;
- character;
- recurring bit;
- team, venue, product, or other channel-specific object.

### Relationship

A graph connection that lists the receipts supporting it.

```json
{
  "id": "edge:stable-hash",
  "from": "source:video-id",
  "relationship": "MENTIONS",
  "to": "topic:halloween",
  "receiptIds": ["video-id:topic:7792:halloween:0"],
  "weight": 1,
  "basis": "timestamped-receipt"
}
```

Recommended universal relationships:

- `CONTAINS`
- `PART_OF`
- `MENTIONS`
- `PERFORMS_AS`
- `CALLS_BACK_TO`
- `SUPPORTS`
- `CONTRADICTS`
- `COMPETES_WITH`
- `PRECEDES`
- `RESULTED_IN`

Do not create a factual relationship merely because a language model says it is plausible.

### Derivation

A useful interpretation produced from receipts.

```json
{
  "id": "timeline:topic-halloween",
  "kind": "take-time-machine",
  "receiptIds": ["receipt-a", "receipt-b"],
  "methodVersion": "sentiment-rules-1.0",
  "inference": true,
  "status": "machine",
  "caution": "Available excerpts suggest a change; context requires review."
}
```

A derivation must retain:

- input receipt IDs;
- method and version;
- inference flag;
- editorial status;
- a concise limitation statement.

### Correction

Corrections are first-class data rather than destructive overwrites.

```json
{
  "id": "correction:uuid",
  "targetId": "receipt-id",
  "field": "speaker",
  "before": null,
  "after": "J",
  "reason": "Creator confirmed",
  "editor": "creator",
  "createdAt": "2026-07-24"
}
```

The current public value can be materialized for speed, but the correction history should remain.

## Evidence levels

### 1. Machine surfaced

The pipeline found a candidate using a reproducible rule, model, or metric.

Allowed:

- search results;
- clearly labeled heatmaps;
- review queues;
- tentative topic, joke, or opinion connections.

Not allowed:

- definitive speaker attribution;
- “first ever” claims;
- creator-canon status;
- an unlabeled generated character answer.

### 2. Editor verified

An editor checked the source at the timestamp and confirmed the excerpt and immediate context.

Additional allowed uses:

- public feature cards;
- “earliest known in the indexed archive” language;
- editorial collections;
- character-pattern training evidence.

### 3. Creator certified

The channel owner confirms a speaker, recurring bit, intended meaning, lore connection, or canonical label.

Creator certification should never erase contradictory evidence. It adds authoritative context.

## Channel DNA pack

The universal engine should know how to remember. The DNA pack tells it what matters for one channel.

Required fields:

- channel ID, public label, and product promise;
- source lanes and inclusion rules;
- entity taxonomy and aliases;
- recurring categories and metrics;
- editorial voice principles and banned generic phrases;
- quality gates;
- feature-specific vocabulary;
- characters and recurring-bit definitions;
- correction and speaker-certainty policies.

The DNA pack is configuration, not proof. “Look for Loomis” does not prove a Loomis performance. The resulting timestamp must be checked.

WWAM’s current pack is `public/demo/wwam-channel-dna.js`.

### Executable ChannelPack conformance

Channel DNA now passes through an executable portability boundary instead of
remaining an architectural claim. `public/demo/channel-pack-contract.js`
compiles DNA plus explicit operational policy into the downloadable
`public/demo/channel-pack-spec.json` shape.

The compiler validates eight domains: identity, source lanes and inclusion
boundaries, taxonomy, evidence policy, update contract, storage namespace,
surface vocabulary, and capabilities. It has no safety-relevant defaults. A
pack fails closed if it can silently promote machine output, skip human review,
guess a speaker, synthesize character audio, erase corrections, omit an
inclusion boundary, mix storage namespaces, or claim an update cadence it did
not declare.

The compiled artifact is canonicalized and fingerprinted. Reordering semantic
sets does not alter the result, but changing any public policy invalidates the
fingerprint. `validatePortfolio()` additionally rejects duplicate channel IDs
and storage namespaces, making product separation executable.

The conformance suite runs the real WWAM DNA and a synthetic test-only racing
fixture through the same compiler, then verifies that the neutral result leaks
none of WWAM’s vocabulary. That fixture is not VRL data and is never loaded by
the WWAM demo. See `docs/CHANNEL_PACK_CONTRACT.md` for the adapter shape,
failure modes, and browser API.

## Showcase derivations

### Memory Graph

Connects sources to films, franchises, topics, characters, and bits. An edge stores every receipt that supports it. The graph enables:

- “Where else did this happen?”
- callbacks across years;
- topic and character dossiers;
- related-moment recommendations;
- change detection after new uploads.

### Take Time Machine

Orders positive and negative receipt signals for a subject. It can show a possible change, reversal, or long-running disagreement.

Required language:

- “available excerpts suggest”;
- “apparent current position”;
- “earliest known in the indexed corpus.”

Forbidden language without certification:

- “Mike always believed”;
- “J changed his mind on this date”;
- “the first time ever.”

### Bit Ancestry

Tracks the earliest known receipt, later callbacks, sources, mutations, and verified performers for a recurring bit.

The ancestry only becomes strong when it has:

1. at least three verified performance receipts;
2. at least two separate sources;
3. a human-confirmed bit label;
4. a checked earliest-known receipt.

### Riff Chemistry

WWAM’s initial formula:

```text
28% source heat
20% escalation
16% callback density
16% derailment
14% room break
 6% topic collision
```

This is a discovery index, not an objective measurement of comedy. It should always expose its component scores.

Other channels replace the dimensions:

- racing: lead changes, finish margin, booth intensity, incident stakes;
- cooking: technique density, failure recovery, reveal payoff;
- interviews: disclosure depth, disagreement, callback, audience reaction;
- gaming: clutch probability, mechanical difficulty, team reaction.

### Personalized Descent

Builds a playable path across receipts. Useful modes:

- slow spiral from normal to deranged;
- instant maximum intensity;
- chronological lore path;
- one topic or franchise;
- one verified character;
- fresh livestreams only;
- a creator-defined runtime.

The route must diversify sources and return exact timestamps.

### WWAM Court

Creates a case only when the archive contains meaningful receipts on both sides. Prosecution and defense are editorial metaphors for negative and positive evidence. The machine leaves the verdict open.

### Live Aftermath

For every new indexed livestream:

- dominant topics;
- new topics compared with the previous indexed stream;
- strongest topic receipt;
- funniest receipt by transparent chemistry score;
- five clip candidates;
- what the stream added to the graph;
- caption or review status.

### Creator Control Room

The system’s honesty dashboard. Queues include:

- sources without captions;
- high-impact machine moments needing context checks;
- apparent opinion changes;
- possible bit origins;
- character dossiers below the evidence threshold;
- duplicate identities or aliases;
- creator-certification candidates.

## Character Studio standard

“Ask the character” can be exceptional if it behaves like an evidence-backed parody writer’s room—not a host impersonator.

### Two deliberately separate outputs

**The real performance**

- plays source audio only;
- includes video, timestamp, performer status, and certification level;
- never uses generated or cloned host audio.

**The parody reconstruction**

- returns new text;
- is visibly labeled `PARODY RECONSTRUCTION — NOT AN ACTUAL QUOTE`;
- cites at least three verified performance receipts;
- explains the performance ingredients it used;
- becomes unavailable when the dossier is below threshold.

### Character dossier

```json
{
  "characterId": "character:loomis",
  "performer": "J",
  "performerStatus": "owner-confirmed",
  "verifiedReceiptIds": ["a", "b", "c"],
  "performanceShape": [
    "urgent public-safety warning",
    "absolute certainty",
    "apocalyptic escalation"
  ],
  "readyForAskCharacter": true
}
```

Do not “learn a voice” from a fictional description. Learn repeatable writing patterns from verified performances. A generated answer should cite those patterns and receipts. This produces a better joke and a more defensible product.

## Update workflow

### 1. Discover

- Fetch channel uploads from the official source.
- Apply explicit inclusion and exclusion rules.
- Capture current metadata and observation date.
- Deduplicate by canonical video ID.

### 2. Acquire evidence

- Download available captions or transcripts.
- Preserve raw files in a non-public cache.
- Record language, caption kind, and availability.
- Never fabricate a transcript for an unavailable source.

### 3. Distill

- Segment by time.
- Detect topics, entities, sentiment signals, comedy signals, and channel-specific events.
- Bound public excerpts.
- Generate stable receipt IDs.
- Produce deterministic outputs from the same inputs.

### 4. Connect

- Match aliases through the DNA pack.
- Add receipt-backed graph edges.
- Recalculate timelines, lineages, metrics, and live aftermath.
- Flag new or contradictory findings.

### 5. Review

- Prioritize missing captions and high-impact moments.
- Check source context.
- Confirm speakers only when evidence permits.
- Promote machine findings to editor verified.
- Request creator certification for lore and character identity.

### 6. Publish

- Show evidence labels.
- Link every moment to the exact source time.
- Keep inference cautions close to the conclusion.
- Report coverage gaps.
- Run the evaluation suite.

### 7. Learn

- Add confirmed aliases and bit names to channel DNA.
- Add failed searches to the regression suite.
- Record corrections and false-positive patterns.
- Version scoring changes.
- Never tune a metric silently after publication.

## Permanent project knowledge

Each YouTube Wiki should retain:

```text
knowledge/
├── UNIVERSAL_SCHEMA.md
├── EDITORIAL_POLICY.md
├── EVALUATION_QUERIES.json
├── METHOD_CHANGELOG.md
├── FAILURE_PATTERNS.md
└── channels/
    ├── wwam/
    │   ├── channel-dna.js
    │   ├── aliases.json
    │   ├── certified-lore.json
    │   └── corrections.json
    └── vrl/
        ├── channel-dna.js
        ├── driver-identities.json
        ├── season-rules.json
        └── corrections.json
```

This is the compounding memory. Prompts are replaceable; verified data, corrections, vocabulary, and evaluation history are not.

## Anti-AI-slop criteria

A surface fails if any of these are true:

- It could be pasted onto an unrelated channel by changing the logo.
- It uses adjectives where a source receipt should be.
- It repeats the transcript instead of explaining why the moment matters.
- It invents a speaker, intention, consensus, or “first ever.”
- It hides missing data.
- It gives one result where the question requires an evidence chain.
- Its scores have no formula or visible dimensions.
- It uses synthetic host audio.
- It calls machine output “canon.”
- It has no creator or fan action beyond scrolling.
- Its categories reflect generic sentiment instead of the channel’s actual culture.
- It adds a feature without adding trust, utility, discovery, or delight.

An artifact passes the “authored” test when:

- the label is specific to the channel;
- the moment is playable;
- the editorial reason is clear;
- uncertainty is visible;
- a correction improves future outputs;
- the same system can support another channel without copying WWAM’s personality.

## Evaluation suite

Every build should run deterministic contract checks and a human benchmark.

### Data integrity

- Every receipt resolves to an existing source.
- Every timestamp is within the source duration when duration is known.
- Every graph edge references existing receipts.
- Receipt IDs are unique.
- No required source is silently dropped.
- The same input produces the same fingerprint and ordered outputs.

### Search and answer quality

Maintain at least 25 real user questions per channel:

- exact-title lookup;
- alias lookup;
- “latest” and “most popular” scope;
- positive and negative takes;
- topic across multiple sources;
- recurring bit;
- apparent opinion change;
- missing-caption question;
- ambiguous “who said” question;
- follow-up question that depends on prior context.

Score:

- top-1 relevance;
- top-3 recall;
- correct lane;
- exact timestamp;
- faithful synthesis;
- refusal to invent unsupported identity.

### Character Studio

- stays locked below the verified-receipt threshold;
- labels generated text as parody;
- cites at least three verified performances;
- never labels generated dialogue as a quote;
- never produces cloned host audio;
- links every real soundbyte to a source.

### Editorial quality

Human reviewers grade each showcase card:

1. Is it specific?
2. Is it true to the source?
3. Does the title earn its attitude?
4. Is the evidence sufficient?
5. Would a fan share it?
6. Would the creator find it useful?

Anything averaging below 4/5 returns to review.

### Regression gates

- Known queries keep their correct top result.
- Alias corrections never split one person or entity again.
- New scoring versions are compared against the previous benchmark.
- Public excerpt limits remain enforced.
- Missing captions remain visible.

## Repeatability by channel

### WWAM

Universal objects:

- source, topic, person, character, recurring bit, receipt.

Channel-specific DNA:

- horror franchises and aliases;
- dark-comedy categories;
- Riff Chemistry;
- WWAM Court;
- Dr. Loomis, Dr. Challis, Slenderman, and Corey Feldman performance dossiers;
- Fresh 10 and Popular 25 lanes.

### Vigilante Racing League

Universal objects:

- source, event, participant, series, topic, recurring bit, receipt.

VRL DNA:

- season, race, track, driver, number, team, broadcaster;
- Wednesday-night inclusion rules;
- close finishes, lead changes, late passes, cautions, and booth intensity;
- Announcer’s Curse, Great Carnac, Upside Down;
- driver identity reconciliation;
- excitement score and Hot 100 moments.

The engine is the same. The taxonomy, evidence extractors, and metrics change.

### Future channel

Launch sequence:

1. define the inclusion boundary;
2. sample ten representative uploads;
3. interview the owner or expert about channel-specific lore;
4. write the first DNA pack;
5. create 25 benchmark questions;
6. ingest sources into the universal schema;
7. validate false positives;
8. ship one creator tool and one fan delight surface;
9. capture corrections;
10. expand coverage only after the quality gates pass.

## Browser API

Load the DNA and engine after the source datasets:

```html
<script src="wwam-channel-dna.js"></script>
<script src="showcase-engine.js"></script>
```

Create the deterministic showcase model:

```js
const showcase = window.WWAMShowcaseEngine.create({
  catalog: window.WWAM_CATALOG,
  deep: window.WWAM_DEEP_DISTILL,
  live: window.WWAM_LIVESTREAMS,
  popular: window.WWAM_POPULAR_LIVESTREAMS,
  characters: window.WWAM_CHARACTER_DATA,
  dna: window.WWAM_CHANNEL_DNA
});
```

Supported accessors:

```js
showcase.metrics;
showcase.getTimeMachines();
showcase.getBitLineages();
showcase.getRiffChemistry();
showcase.getCourtCases();
showcase.buildDescent({ mode: "spiral", entityId: "topic:halloween", limit: 10 });
showcase.getAftermath();
showcase.getControlRoom();
```

Both Popular 25 and character data are optional. The engine still returns a complete, deterministic model and honest readiness states when they are absent.

## Current implementation boundary

`public/demo/showcase-engine.js` is intentionally a pure browser engine:

- no network calls;
- no clock reads;
- no random values;
- no DOM dependency;
- stable ordering;
- optional inputs;
- source IDs and timestamps retained in every derived artifact.

It is a presentation-independent foundation. WWAM can render it as a horror evidence room; VRL can render the same contracts as a race-control archive.
