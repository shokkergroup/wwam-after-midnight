# The Source Dossier

Release contract for **V5.18 / 0.5.18**.

## Product promise

Every canonical upload gets one durable page that answers:

> What does this archive actually know about this source, what did the source
> become elsewhere in the product, and what is still unknown?

The Source Dossier is the common source unit beneath commentary tapes,
livestreams, Archive Atlas records, future racing events, and other
ChannelPack-backed YouTube wikis. WWAM calls the relationship layer **The
Tape's Wake**. Another channel can change that label without changing the
evidence rules.

## Exact WWAM registry

The Source Dossier adapter deterministically reconciles:

- 472 cached official Streams-feed records;
- 39 commentary catalog records;
- one exact overlap, `3wK00_-K-Y0`;
- **510 unique canonical uploads**.

The resulting coverage split is:

| Coverage state | Sources | What the dossier may expose |
| --- | ---: | --- |
| `caption-backed` | 111 | Registered source receipts, entities, summaries, and exact artifact memberships |
| `metadata-only` | 390 | Cached source metadata, chronology, and explicitly labeled metadata navigation only |
| `caption-limited` | 9 | Only the defensible registered subset; no missing-caption reconstruction |
| `unavailable` | 0 | Source-record boundary only |

The 472 figure remains the scoped Archive Atlas Streams-feed count. It is not
silently relabeled as the complete channel union.

The current registry contains **1,490 source receipts** and **928 source-bound
artifact records**. The receipt ledger is:

| Evidence type | Receipts | Meaning |
| --- | ---: | --- |
| `caption-excerpt` | 701 | Bounded machine-surfaced excerpt |
| `caption-topic-receipt` | 592 | Bounded topic receipt |
| `caption-topic-navigation` | 120 | Topic-only navigation with public excerpt withheld |
| `curated-character-performance` | 25 | Timestamp-validated human-curated performance candidate |
| `caption-character-signal` | 24 | Machine-surfaced character reference |
| `caption-character-context` | 28 | Machine-surfaced persona/context/discussion candidate |

These current dossier totals are deliberately broader than the immutable V5.4
proof of **84 source inputs and 872 promoted receipts**. The frozen 84/872
ledger remains historical release proof; it is not a synonym for the current
510/1,490 registry.

## The newest-upload proof

The July 23, 2026 livestream `LV2rmwEA0w4` is the buyer-facing launch proof.
Its dossier joins inventory already present in the system:

- 43,645 audited caption words;
- 21 promoted source receipts: 7 moments, 8 topic chapters, and 6
  character-performance candidates;
- 4 recurring-bit lineages;
- 13 Short candidates;
- 6 supercut memberships;
- 4 resurfacing opportunities.

These are deterministic archive memberships. They are not creator approval,
rights clearance, virality predictions, or proof that a later upload was
caused by this source.

All 25 curated character-performance receipts keep their explicit
human-curated playback ends instead of receiving a generic fallback window.
Each current clip is 14 seconds. The launch proof includes
`character-receipt:loomis-funding` at the exact fractional bounds
`9042.64–9056.64`.

The same source has **138 matching Wake sources**. The engine returns the true
`matchingTotal`, a bounded `displayed` collection of 16, and
`truncated: true`. The 16-result display cap is not presented as the complete
relationship count.

## Ask This Tape

V5.18 adds a query layer inside every dossier. The engine resolves the exact
source ID and optional source fingerprint before parsing the question. It can
return typed source-local inventory, receipts, entities, artifacts,
connections, metadata, or a registered source summary.

It cannot substitute a different upload. This remains true when two sources
have the same generic livestream title, a different source contains a stronger
receipt, or a title alias looks semantically relevant. An unsupported subject
returns `insufficient-evidence`; a metadata-only source returns source proof
or a content refusal; a stale fingerprint refuses before query
interpretation.

See [Ask This Tape](ASK_THIS_TAPE.md) for the request/response contract and
the three-source buyer proof.

## Permanent dossier sections

1. **Source Proof** — official source identity, date, duration, cached views,
   coverage, authority, lanes, and evidence boundary.
2. **Official Source Playback** — an intentionally dormant in-page YouTube
   player with exact timestamp bounds and a visible identity-error recovery
   control.
3. **Ask This Tape** — exact-source questions with no cross-source
   substitutions and explicit refusal states.
4. **Inside This Tape** — registered source summary and playable receipts, or
   a permanent refusal when captions do not support content claims.
5. **Memory OS Footprint** — receipt, entity, relationship, and draft/review
   artifact inventory.
6. **The Tape's Wake** — true matching totals and bounded dual-ended evidence
   connections separated from title-metadata neighbors.
7. **Put the Archive to Work** — Tape Companion, evidence bag, share, and
   privacy-bounded manifest actions.
8. **What This Page Can Prove** — speaker, causality, origin, continuity,
   rights, creator-approval, and canon limits remain visible.
9. **Chronology** — previous and next registered uploads without pretending
   chronology is a content relationship.

In V5.18, Ask This Tape is a permanent source-locked section between playback
and Inside This Tape. The default Director's Cut is compact. Each dense
evidence lane can expand independently, and **Open Full File** reveals the
registered source file without changing evidence authority. Progressive
disclosure changes only how much inventory is visible; it never changes the
source, ranking, receipt ledger, or proof boundary.

## Relationship firewall

Cross-source content connections use a closed vocabulary:

- `receipt-backed-entity`;
- `exact-artifact-membership`;
- `registered-source-entity`.

Each must resolve both ends against registered source evidence. A
`source-metadata-neighbor` is allowed only as visibly labeled navigation. A
similar title, nearby date, shared lane, high heat score, or generated summary
cannot become a callback, influence, origin, or content claim.

Archive Deep remains quarantined. Its 12 topic-only source-audio firewalls may
expose topic navigation, but no excerpt, public moment, character performance,
heat claim, or promoted receipt. Sealed source `AzrcgoyE7C4` and limited source
`x6tvsGRHgU0` retain their explicit refusal boundaries.

The remaining Archive Deep character records are not performance evidence:
24 are `caption-character-signal` references and 28 are
`caption-character-context` persona/context/discussion candidates. All are
machine-surfaced, speaker-undiarized, and promotion-blocked.

## Universal engine contract

The channel-neutral engine accepts
`shokker-source-dossier-input/v1` and emits
`shokker-source-dossier/v1`. Every artifact is bound to:

- channel ID and ChannelPack fingerprint;
- archive fingerprint and snapshot date;
- source ID and source fingerprint;
- exact coverage and authority state;
- registered receipt, entity, relationship, and artifact references.

The WWAM adapter supplies channel data and language. It does not get to weaken
the engine's evidence meanings.

The exact-source query engine accepts `shokker-source-query/v1` and emits
`shokker-source-query-result/v1`. It builds the requested dossier first and
copies its source, archive, and dossier fingerprints into the answer. Its
boundary always records `exactSourceOnly: true`,
`crossSourceSubstitution: false`, and `titleInferenceUsed: false`.

Wake output reports:

- `matchingTotal`: every relationship that passed the registered evidence
  test;
- `displayed`: the bounded connection collection returned to the interface;
- `truncated`: whether `matchingTotal` is greater than `displayed`.

The returned connection collection remains capped at 16. Consumers must show
the true total when `truncated` is true.

Action authority is also closed:

- `fan-navigation`;
- `creator-draft`;
- `editor-review`.

No static-demo action can claim published, rights-cleared, creator-approved,
speaker-verified, or canon-promoted status.

## Routing and playback

The canonical share route is:

```text
?source=LV2rmwEA0w4&at=6455#archive
```

A stable section route adds only the closed `section` key:

```text
?source=LV2rmwEA0w4&at=9043&section=ask#archive
```

Supported values are `proof`, `player`, `ask`, `inside`, `footprint`, `wake`,
`chronology`, `work`, and `boundary`. The route focuses the requested section
after render; it does not change the evidence query or initialize playback.
Unknown section values are discarded instead of becoming selectors.

Legacy `?tape=` and `?live=` routes remain readable and normalize to
`?source=`. Closing a dossier removes only dossier coordinates and preserves
unrelated query state. Browser back and forward reopen the matching source
without initializing media.

Player requests use `strict-origin-when-cross-origin`, the current HTTPS
origin, and the first-party player bridge. YouTube error 153 recovery preserves
the exact source, start, end, and autoplay intent. The official-source link
remains available, but it is not the primary playback experience.

**Watch With Memory** uses the same canonical registry. Tape Companion lists
all 510 sources: 71 are memory-ready and 439 are source-only. A source-only
record may retain official playback and source navigation, but it receives no
invented synchronized timeline.

## Share and export privacy

Share URLs contain only the source ID, optional second, and section. Export
manifests contain bindings, coordinates, fingerprints, evidence types, and
authority states. They omit excerpts, captions, transcript text, generated
summaries, media, and speaker fields.

## What V5.18 does not claim

- complete transcripts for every upload;
- speaker diarization;
- visual verification;
- true bit origins;
- causality or influence between uploads;
- creator certification;
- publishing or rights authority;
- live availability rechecks for the cached feed;
- that a metadata-only source was discussed merely because its title matched;
- that 1,490 dossier receipts are the same ledger as the frozen 872 promoted
  receipts;
- that a 16-item Wake display is the complete relationship count;
- that Ask This Tape may answer from a different upload when this source lacks
  the requested evidence.

Unknown remains a successful result when the source cannot support more.
