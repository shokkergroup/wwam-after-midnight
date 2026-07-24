# YouTube Wiki Memory OS

Current WWAM demonstration release: **V5.20 / 0.5.20**.

Version 1.0 — a reusable, evidence-first operating system for living channel archives.

## Product thesis

A transcript summary is a disposable output. A channel memory is a compounding asset.

The Memory OS turns every indexed upload into:

- a canonical Source Dossier that remains useful even when content evidence is
  unavailable;
- durable, timestamped evidence;
- connections to people, topics, events, jokes, characters, and earlier uploads;
- editorial work queues that improve trust;
- fan experiences that become richer as the archive grows;
- creator tools that can turn old material into new programming;
- a channel-specific knowledge pack that transfers the system without flattening the channel’s identity.

The defensible product is not “AI made a website.” It is a source-backed memory graph plus human editorial judgment. Every new upload adds evidence, relationships, and known vocabulary. A copycat can generate another summary; it cannot instantly recreate years of source-linked, indexed lore and corrections.

## Non-negotiable rules

1. **A public factual claim must resolve to evidence.** Video ID and timestamp are the minimum viable receipt.
2. **A relevant source is not automatically subject evidence.** Every
   subject-bearing answer must expose how the bounded receipt is related to
   the requested subject before ranking can use heat, curation, or popularity.
3. **Inference must identify itself.** Opinion changes, joke origins, excitement scores, and humor scores are useful interpretations—not facts.
4. **Unknown is a valid answer.** Missing captions or ambiguous speakers remain unknown until reviewed.
5. **The machine proposes canon; people certify it.** High-value findings enter a review queue.
6. **The archive must sound like the channel without pretending to be the channel.**
7. **Generated character dialogue is never presented as a real quote.** Archival audio and generated text are separate surfaces.
8. **Every new feature must improve discovery, trust, creator utility, or fan delight.** If it does none of those, it is decoration.
9. **Every canonical source gets one page, but not the same depth of claim.**
   Metadata-only and caption-limited sources must refuse unsupported semantic
   sections rather than borrowing conclusions from titles or neighboring
   uploads.
10. **An exact-source question never escapes its source.** Resolve and verify
    the requested source ID and fingerprint before interpreting the question.
    A duplicate title, nearby upload, or stronger global result cannot
    substitute another source.
11. **A fan-authored sequence never becomes archive evidence.** Re-resolve
    every ordered receipt against the canonical registry, preserve exact
    bounds, label viewer prose as non-evidence, and fail closed rather than
    substitute, pad, or widen a cut.
12. **A recurrence is chronology, not continuity.** A lineage may order
    eligible bounded receipts under a channel-supplied label. It does not prove
    a first occurrence, mutation, intentional callback, shared speaker,
    influence, causality, approval, rights, or Canon.

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
  "claimRelation": "explicit-caption-target",
  "score": 92
}
```

Receipt requirements:

- `sourceId`, `t`, and playable `url`;
- a bounded excerpt when transcripts are used;
- the extraction method and evidence level;
- a closed-vocabulary receipt-to-subject relationship whenever the receipt is
  used to answer about a resolved subject;
- no named speaker unless the evidence supports it;
- deterministic ID generation so corrections do not create silent duplicates.

Evidence type must describe what was established, not what would make the card
more exciting. In the current WWAM adapter:

- `curated-character-performance` is reserved for 25 human-curated,
  timestamp-validated candidates with explicit start/end windows;
- `caption-character-signal` describes 24 machine-detected character
  references; and
- `caption-character-context` describes 28 machine-detected persona prompts,
  character-name contexts, or performance discussions.

The latter 52 Archive Deep records remain machine-surfaced and quarantined.
They are not performances. Curated clip normalization must preserve explicit
human end bounds; it may not replace a 14-second reviewed window with a
generic 30-second fallback.

### Ordered receipt cut

A viewer-authored route through canonical receipts.

```json
{
  "schema": "shokker-memory-cut-share/v1",
  "version": "1.0.0",
  "title": "Viewer-written title",
  "introduction": "Viewer-written introduction",
  "viewerTextLabel": "VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE",
  "bindings": {
    "channelId": "channel-pack-id",
    "channelPackFingerprint": "channel-pack-change-detector",
    "archiveFingerprint": "archive-change-detector",
    "registryFingerprint": "source-registry-change-detector"
  },
  "receiptKeys": [
    "canonical-receipt-key-1",
    "canonical-receipt-key-2",
    "canonical-receipt-key-3"
  ],
  "cutFingerprint": "compiled-cut-change-detector",
  "fingerprint": "share-packet-change-detector"
}
```

Ordered-cut requirements:

- three to eight unique promoted timed receipts;
- canonical re-resolution before compile and again on share restore;
- exact registered start/end preservation;
- fail-closed rejection of unknown, duplicate, quarantined, withheld,
  stale-fingerprint, ambiguous, foreign, out-of-range, or untimed selections;
- manual in-page playback from official sources with no player before an
  explicit command and no automatic chaining into another stop;
- viewer title/introduction labeled as non-evidence;
- share packets limited to keys, channel/archive/registry bindings, bounded
  viewer prose, and deterministic cut/packet fingerprints; and
- JSON/Markdown creator briefs treated as human-review plans rather than
  approval, rights clearance, copied media, Canon mutation, or publication.

The ordered-cut engine is universal. A comedy ChannelPack may define a
character-archaeology preset; a racing ChannelPack may order a restart, lead
change, booth reaction, final-lap battle, and finish. The sequence contract
does not inherit either channel's vocabulary.

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

### Evidence Relationship Gate

A graph edge, matching source title, or matching franchise supplies retrieval
context. It does not by itself prove that one bounded receipt is about the
resolved subject. The universal answer layer therefore assigns exactly one
`claimRelation` before a subject-bearing receipt may rank:

| Relation | Meaning |
| --- | --- |
| `explicit-caption-target` | The bounded caption explicitly names the canonical subject or a registered alias. |
| `exact-topic-receipt` | A structured timed topic record is canonically bound to the exact subject. |
| `screen-referent-in-exact-commentary` | The receipt belongs to the exact resolved commentary/program and its bounded caption contains a concrete screen/event referent governed by channel vocabulary. |
| `source-context-only` | The source context matches, but the bounded receipt supplies no eligible subject relationship. |

Only the first three may answer neutral aboutness. `source-context-only` can
help a visitor find or inspect the relevant upload, but it cannot enter the
answer evidence chain or a playable answer projection.

The classifier runs before ranking. Heat, profanity, source views, human
curation, memorability rank, comedy score, and editorial priority cannot
upgrade an ineligible relationship. Exact-commentary context also does not
make every second eligible: the bounded caption must contain a concrete
screen/event referent rather than an unrelated tangent that occurred while the
program was playing.

Relationship eligibility is not opinion evidence. A neutral aboutness route
may use an exact topic record without implying sentiment. Evaluative answers
also need target-proximate evaluative evidence. Change/evolution answers need
multiple relationship-eligible, chronology-compatible evaluative receipts and
still cannot infer speaker continuity or one person's mind change from
undiarized captions.

This is a portable accuracy contract. WWAM supplies film/franchise aliases and
screen referents; a racing pack supplies driver/event aliases and race-event
referents. An unrelated high-heat crash call remains `source-context-only` for
a question about car 33 merely because car 33 was entered in that race. The
current V5.16 neutral fixture proves relationship transport and Play rejection;
it does not rerun the WWAM search classifier against a neutral corpus. Each
channel still requires its own classifier adapter and query truth set.

See `docs/EVIDENCE_RELATIONSHIP_GATE.md` for the reproduced V5.15 failures,
positive controls, Play the Answer boundary, and release regressions.

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

### 2. Timestamp-validated human-curated candidate

This is the current WWAM character tier. A human selected a candidate whose
source and second pass structural validation. It preserves provenance without
claiming authenticated surrounding-context review or clip-level speaker
identity.

Additional allowed uses:

- public feature cards;
- “earliest known in the indexed archive” language;
- editorial collections;
- character-pattern training evidence.

The current snapshot contains 25 such character-performance candidates, 0
authenticated editor-verified decisions, and no diarized clip speakers.

### 3. Editor verified — future production threshold

An authenticated editor checked the source at the timestamp, reviewed the
immediate context, and recorded the decision. Structural timestamp validation
or human curation alone must never populate this tier. Editor verification
still does not identify a speaker in undiarized audio.

### 4. Creator certified

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

V5.5 adds `tape-companion` and `creator-taste-calibration` to WWAM’s compiled
capability set. The declaration says those runtime contracts are enabled; it
does not prove their outputs or authorize an operator. The current WWAM and
generic synthetic suites cover determinism, tamper, restore, and protected
state. Separate neutral racing fixtures demonstrate adapter-driven vocabulary
without WWAM leakage; they do not rerun every generic invariant on neutral
data.

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

### Bit Bloodlines

Orders bounded canonical recurrence candidates under a channel-supplied
lineage definition. It is a watch path through the current index, not proof
that the first row originated the bit or that any later row intentionally
called back to it.

The V5.20 WWAM projection contains:

| Measurement | Current value |
| --- | ---: |
| Lineages | 4 |
| Curated performance candidates | 25 |
| Unique official uploads | 12 |
| Bounded source time | 350 seconds |
| Challis windows / sources / seconds / days | 7 / 6 / 98 / 1,464 |
| Slenderman windows / sources / seconds / days | 6 / 6 / 84 / 1,916 |
| Loomis windows / sources / seconds / days | 7 / 5 / 98 / 1,433 |
| Feldman windows / sources / seconds / days | 5 / 3 / 70 / 37 |

Every current performance window is exactly 14 seconds. The lineage compiler
resolves the Source Dossier key and exact end bound; on click, the host
rechecks canonical source availability before using those resolved coordinates.
A complete WWAM lineage contains five to seven receipts, so it can enter the existing
three-to-eight-stop ordered-cut contract without trimming.

The 28 character contexts and 24 character signals remain a separate
52-record machine-echo layer. All 52 are unbounded, quarantined, and forbidden
from the performance rail and Memory Cut. Neutral labels describe the earliest
and latest eligible windows in the current index; the UI must not call the
middle rows mutations or confirmed callbacks.

A future production policy may require authenticated editor decisions. That
threshold is distinct from the current timestamp-validated human-curated
candidate tier and cannot be inferred from a derived review artifact.

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
- one owner-mapped character with sufficient timestamp-validated curated
  candidates;
- fresh livestreams only;
- a creator-defined runtime.

The route must diversify sources and return exact timestamps.

### Canonical Source Dossier and Ask This Tape

Every canonical source receives one dossier even when it has no defensible
content receipts. The portable dossier separates source proof, bounded
receipts, entities, artifacts, connections, chronology, actions, and evidence
limits.

The exact-source query layer is intentionally smaller than archive-wide
search. It must:

- build the requested dossier before parsing the question;
- optionally compare the request's source fingerprint with the freshly built
  dossier;
- return content results only when every result carries the requested source
  ID;
- treat titles as display metadata rather than source scope;
- refuse metadata-only, caption-limited, unavailable, stale, and unsupported
  content requests without global fallback;
- preserve `speaker: null` and the complete authority boundary; and
- expose typed inventory, receipt, entity, artifact, connection, metadata, and
  registered-summary results.

Connections are navigation, not replacement answers. A connection result may
name a target source, but the answer itself remains scoped to the open source
and cannot claim origin, causality, or content in the target.

The universal Wake contract separates:

- `matchingTotal`, the true number of passing relationships;
- `displayed`, the size of the bounded returned collection; and
- `truncated`, whether additional matches exist.

The current return cap is 16. A compact UI may preview fewer cards, but it must
never label the preview or cap as the complete total. Progressive disclosure
and full-file mode change presentation only.

Stable source routes use closed section keys rather than DOM selectors:
`proof`, `player`, `ask`, `inside`, `footprint`, `wake`, `chronology`, `work`,
and `boundary`. Unknown values fail to the dossier default.

### Synchronized Tape Companion

Turns official playback into a second-screen memory route without copying the
media. The portable input is a channel-scoped set of sources, receipts, heat
windows, entities, relationships, annotations, and channel-native labels.

Required behavior:

- autoplay stays off and playback remains on the official source;
- the playback UI exposes event text only through snapshot-safe and
  crossed-event APIs after the exact timestamp has been crossed;
- a future marker may expose time remaining, but not its label, excerpt, or
  annotations;
- compatible-event fusion preserves every exact member and timestamp;
- heat is labeled deterministic navigation, never audience sentiment;
- reverse, stationary, or large seeks replace the snapshot instead of firing
  a parade of skipped moments;
- companion-limited sources remain honest source-only records;
- the complete canonical registry remains discoverable even when only a
  smaller subset is memory-ready;
- manual sync and official timestamp links remain usable when the player API
  is unavailable; and
- shared state binds channel plus the core archive/source ledgers and playback
  second.

A checksum proves deterministic consistency only. It does not prove identity,
authorship, approval, or source availability.

In the V5.18 WWAM demonstration, Tape Companion receives all 510 canonical
sources. Seventy-one are memory-ready and 439 remain source-only. The
historical promoted subset is still 74 sources—71 ready and three disclosed
gaps—with 872 exact receipt members. Expanding registry breadth does not
rewrite that frozen evidence ledger.

The public `compileTimeline` audit API returns the complete compiled timeline.
Playback code must not use it as a live feed. Optional display labels, excerpts,
and annotations are not part of the companion's core share fingerprint.

### Playable Answer Projection

A structured answer may become a short, ordered watch path only when its
existing evidence chain contains two to six unique, registered, in-range,
timed receipts, each carrying one allowed Evidence Relationship Gate relation.
This projection is downstream of retrieval: it preserves the answer engine's
exact role, relationship, and receipt order and cannot rerank by heat,
popularity, profanity, or interface position. Missing, unknown, and
`source-context-only` relations fail closed.

The portable trail stores only the question, channel/archive bindings,
receipt keys, fixed roles, official source IDs, whole-second starts, bounded
ends, exact claim relations, and deterministic fingerprints. It stores no
answer prose, excerpt, caption payload, speaker, thumbnail, audio, or video.
Restore reruns the current standalone answer and opens only after an exact
trail match, including every relationship value.

Playing adjacent receipts is navigation, not a documentary claim. It does not
establish speaker identity or continuity, causality, opinion change, true
origin, rights clearance, creator approval, or Canon. Context-dependent
follow-ups, one-stop answers, metadata/summary answers, handoffs, restricted
source-audio or visual lanes, and machine quarantine remain ineligible.

Every official-source player must retain:

- the exact timestamp link as a fallback;
- explicit referrer/origin identity;
- an in-page recovery action that reloads the same source coordinates through
  a hosted first-party bridge when an embed rejects page identity; and
- copy that says recovery was attempted, never that playback was verified.

### Creator Taste Calibration

Learns a bounded local ordering from 10 priority-blind, exact-ledger learning
matchups. Channel adapters supply labels and feature dimensions; the engine
adds 2 side-reversed non-learning consistency checks, sparse-weight shrinkage,
artifact binding, and fail-closed restore.

Required behavior:

- the operator is labeled unauthenticated;
- machine priority and baseline rank remain hidden during a choice;
- `NEITHER` and `NEEDS_CONTEXT` record local workflow decisions but add zero
  preference weight and do not route work to an external review system;
- too few non-repeat A/B choices produce no profile;
- a visible maximum risk is an input gate, never a learned override;
- every preference modifier is bounded and the untouched baseline remains
  recoverable;
- source, receipt, timestamp, excerpt, evidence, risk, HOLD, approval, canon,
  speaker, rights, and creator-approval state are immutable; and
- export/restore binds channel, ChannelPack, candidate snapshot, full and
  eligible inventory, goal, risk ceiling, round blueprint, and exact decision
  ledger.

Preference can help order an editorial review queue. It cannot become proof,
canon, identity authentication, rights clearance, or creator approval.

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

**The real performance candidate**

- plays source audio only;
- includes video, timestamp, performer status, curation tier, and any separate
  certification level;
- never uses generated or cloned host audio.

**The parody reconstruction**

- returns new text;
- is visibly labeled `PARODY RECONSTRUCTION — NOT AN ACTUAL QUOTE`;
- cites at least three timestamp-validated human-curated performance candidates
  in the current prototype;
- explains the performance ingredients it used;
- becomes unavailable when the dossier is below threshold.

### Character dossier

```json
{
  "characterId": "character:loomis",
  "performer": "J",
  "performerStatus": "owner-confirmed",
  "curatedCandidateReceiptIds": ["a", "b", "c"],
  "authenticatedEditorVerifiedReceiptIds": [],
  "clipSpeakersDiarized": false,
  "performanceShape": [
    "urgent public-safety warning",
    "absolute certainty",
    "apocalyptic escalation"
  ],
  "readyForAskCharacter": true
}
```

Do not “learn a voice” from a fictional description. Learn repeatable writing
patterns from timestamp-validated human-curated performance candidates. A
generated answer should cite those patterns and receipts. The current 25
candidates are not authenticated editor decisions, and their clip speakers are
not diarized. A future production `editor verified` tier must require a separate
authenticated context-review decision.

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
- Use source playback to establish context.
- Confirm speakers only when evidence permits.
- Never treat playback review alone as editor verification or cross-lane
  promotion.
- Record a separate policy-compliant decision for every destination lane
  through an authenticated, authorized editor or creator.
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
- Record synchronization failures such as future-text leaks, stale source
  bindings, and unsafe seek behavior.
- Keep local preference artifacts separate from certified memory, and bind
  them to the exact pack, inventory, goal, and decision blueprint they used.
- Learn taste only from explicit eligible A/B choices; do not reinterpret
  abstentions or context requests as hidden preference.
- Version scoring changes.
- Never tune a metric silently after publication.

## Permanent project knowledge

Each YouTube Wiki should retain:

```text
knowledge/
├── UNIVERSAL_SCHEMA.md
├── EDITORIAL_POLICY.md
├── ARTIFACT_BINDINGS.md
├── PREFERENCE_POLICY.md
├── EVALUATION_QUERIES.json
├── METHOD_CHANGELOG.md
├── FAILURE_PATTERNS.md
└── channels/
    ├── wwam/
    │   ├── channel-dna.js
    │   ├── aliases.json
    │   ├── companion-labels.json
    │   ├── taste-dimensions.json
    │   ├── certified-lore.json
    │   └── corrections.json
    └── vrl/
        ├── channel-dna.js
        ├── driver-identities.json
        ├── season-rules.json
        ├── companion-labels.json
        ├── taste-dimensions.json
        └── corrections.json
```

This tree is the portable project convention, not a claim that every file
already exists in every prototype. It keeps preference policy and share-state
bindings beside—but separate from—certified memory. Prompts are replaceable;
verified data, corrections, vocabulary, and evaluation history are not.

## Anti-AI-slop criteria

A surface fails if any of these are true:

- It could be pasted onto an unrelated channel by changing the logo.
- It uses adjectives where a source receipt should be.
- It repeats the transcript instead of explaining why the moment matters.
- It invents a speaker, intention, consensus, or “first ever.”
- It hides missing data.
- It treats a matching source title or collection as proof that an unrelated
  bounded receipt is about the requested subject.
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
- Every explicit curated playback end survives normalization unchanged.
- Every Wake satisfies `displayed <= 16`,
  `truncated === (matchingTotal > displayed)`, and
  `displayed === later.length + earlier.length`.

### Search and answer quality

Maintain at least 25 real user questions per channel:

- exact-title lookup;
- alias lookup;
- “latest” and “most popular” scope;
- positive and negative takes;
- topic across multiple sources;
- neutral aboutness where the hottest receipts are unrelated source context;
- recurring bit;
- apparent opinion change;
- missing-caption question;
- ambiguous “who said” question;
- follow-up question that depends on prior context;
- exact-source duplicate-title isolation;
- exact-source wrong-subject refusal;
- metadata-only content refusal without a global-search fallback.

Score:

- top-1 relevance;
- top-3 recall;
- correct lane;
- exact timestamp;
- allowed receipt-to-subject relationship;
- faithful synthesis;
- refusal to invent unsupported identity.

### Character Studio

- stays locked below the timestamp-validated curated-candidate threshold;
- labels generated text as parody;
- cites at least three timestamp-validated human-curated candidates;
- never labels generated dialogue as a quote;
- never produces cloned host audio;
- links every real soundbyte to a source.

### Synchronization

- The playback UI's snapshot-safe and crossed-event path keeps future event
  text unavailable before the indexed second is crossed; the full timeline
  remains an explicit audit API.
- Compatible fusion never drops exact receipt IDs or timestamps.
- Reverse and large seeks produce replacement snapshots, not skipped-event
  notifications.
- Share restore rejects foreign channels, changed channel/archive bindings, stale source
  fingerprints, unknown sources, out-of-range seconds, and tampering.
- A blocked player API leaves a working manual rail and official timestamp
  fallback.
- Every playable-answer trail preserves the structured answer's exact
  two-to-six-stop role/key/source/start/end order; no context-dependent
  follow-up can be restored as a standalone query.
- Every subject-bearing playable-answer stop has
  `explicit-caption-target`, `exact-topic-receipt`, or
  `screen-referent-in-exact-commentary`. Missing, unknown, and
  `source-context-only` relations fail closed even when the source and
  timestamp are otherwise valid.
- Player recovery preserves the same official source and exact bounded
  coordinates. Direct, recovered, and file-mode playback all retain a visible
  official timestamp fallback.
- Playable-answer shares contain coordinates and bindings only. Tampering,
  foreign or stale bindings, changed registries, and a changed fresh answer
  fail closed before playback.
- Neutral fixtures contain no source-channel vocabulary leakage; this check is
  narrower than the generic determinism/restore/tamper suite.

### Creator taste calibration

- Identical bound inputs produce the same matchup blueprint and shortlist.
- Repeat checks reverse sides without changing candidate identity.
- Abstention and context choices add zero preference weight.
- Insufficient A/B evidence fails closed.
- Every modifier stays inside its declared bound.
- A computed protected-projection audit remains at zero and artifact creation
  fails closed if any protected mutation is detected.
- Restore rejects foreign channels, packs, candidate snapshots, inventories,
  goals, risk gates, blueprints, ledgers, and tampering.
- Neutral fixtures retain their own labels and dimensions.

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
- companion labels for topics, heat, ranked candidates, editorial selections,
  and recurring-character callbacks;
- taste dimensions for signal/category, movie/topic, recurring entity, edit
  runtime, and source lane.

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
- source-locked recurrence trails for booth phrases, rivalries, rituals, and
  Announcer's Curse candidates; chronology cannot claim that commentary caused
  an incident or that a later call intentionally continued an earlier one;
- a race companion that can wake up lead changes, cautions, incidents, booth
  calls, and driver-history connections as the official broadcast plays;
- taste dimensions for finish type, track, driver story, booth intensity,
  incident stakes, and proposed clip runtime.

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

Create a channel-neutral Source Dossier registry and exact-source query layer:

```js
const dossiers = window.ShokkerSourceDossier.create(sourceDossierPayload);
const sourceQuery = window.ShokkerSourceQuery.create({
  dossierEngine: dossiers
});

const dossier = dossiers.build("LV2rmwEA0w4");
const answer = sourceQuery.answer({
  schema: "shokker-source-query/v1",
  sourceId: dossier.source.id,
  sourceFingerprint: dossier.source.sourceFingerprint,
  query: "Show me Dr. Loomis moments",
  at: 9042.64,
  limit: 8
});
```

The query result remains bound to the requested source and includes an explicit
`crossSourceSubstitution: false` boundary. Channel-specific vocabulary may
change intent detection; it cannot weaken source scope.

Create a portable synchronized companion from channel-shaped inputs:

```js
const companion = window.YouTubeWikiTapeCompanionEngine.create(
  {
    channelId,
    snapshotDate,
    sources,
    receipts,
    heatWindows,
    rankedCandidates,
    curation,
    characters,
    lore
  },
  {
    labels: channelCompanionAdapter.labels,
    archiveFingerprint: archiveFingerprint
  }
);

companion.compileTimeline(sourceId);
companion.snapshotAt(sourceId, playbackSecond);
companion.crossedEvents(sourceId, previousSecond, playbackSecond);
```

Create a bounded local taste session from a compiled pack and an exact-ledger
candidate inventory:

```js
const calibration = window.ShokkerCreatorTasteCalibration.create({
  channelPack,
  clipLab,
  goal: "shorts-calibration",
  maxRisk: "MEDIUM",
  adapter: channelTasteAdapter
});

const session = calibration.start();
const round = session.getCurrentRound();
session.decide(round.id, "A");
```

Create a channel-neutral playable answer from a fresh structured-answer
function and canonical official-source registry:

```js
const player = window.ShokkerPlayAnswer.create({
  analyze: (query) => ask.ask(query),
  bindings: {
    channelId,
    channelPackFingerprint,
    archiveAsOf,
    answerEngineVersion
  },
  sources: sourceRegistry
});

const trail = player.build("Show me the call and the finish");
const share = player.exportShare(trail);
const verifiedFreshTrail = player.restoreShare(share);
```

Compile a channel-supplied recurrence only after the canonical Source Dossier
registry is available:

```js
const bloodlines = window.ShokkerBitBloodline.create({
  dossierEngine,
  lineages: channelAdapter.lineages
});

const lineage = bloodlines.get("channel-lineage-id");
const exactCutRequest = bloodlines.compileCutPacket(lineage.id);
const playableCut = memoryCut.compile(exactCutRequest);
```

The adapter may call the object Slenderman Dispatch, The Announcer's Curse, or
a victory ritual. The pure compiler retains source IDs, receipt keys,
fingerprints, and exact bounds; it does not inherit the adapter's mythology as
an origin or causality claim.

## Current implementation boundary

`public/demo/showcase-engine.js`, `public/demo/bit-bloodline-engine.js`,
`public/demo/source-dossier-engine.js`,
`public/demo/source-query-engine.js`,
`public/demo/tape-companion-engine.js`, and
`public/demo/creator-taste-engine.js` are intentionally pure browser engines:

- no network calls;
- no clock reads;
- no random values;
- no DOM dependency;
- stable ordering;
- optional inputs;
- source IDs and timestamps retained in every derived artifact.

It is a presentation-independent foundation. WWAM can render it as a horror evidence room; VRL can render the same contracts as a race-control archive.

The V5.20 WWAM adapters are intentionally stricter than the universal core.
The Source Dossier adapter fails closed unless the canonical union remains 510 sources and the receipt
ledger remains 1,490. Its current proof is 111 caption-backed, 390
metadata-only, nine caption-limited, zero unavailable, 928 source-bound
artifact records, 25 exact curated windows, and a 24/28 Archive Deep
signal/context split. Those adapter assertions are channel snapshot checks,
not universal constants. The Bit Bloodlines adapter further pins 4 lineages,
25 bounded performance candidates, 12 official uploads, 350 source seconds,
and zero playable members from the separate 52-record unbounded machine-echo
layer.

The current companion UI stores core archive/source-ledger-bound local state;
optional display decorations are outside that binding. Calibration stores
input-bound local state. Neither UI authenticates an operator, writes public
canon, publishes media, or provides a server-side collaboration workflow.
