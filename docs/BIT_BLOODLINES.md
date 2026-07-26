# Bit Bloodlines

Release contract for **V5.20 / 0.5.20**.

## Product promise

Bit Bloodlines turns a recurring-character label into a source-locked,
chronological route through every eligible performance candidate currently
registered to that lineage.

The feature answers a narrow, useful question:

> Where can I watch this recurring bit reappear across the indexed archive?

It does not answer:

- who performed an individual clip;
- whether a later appearance intentionally called back to an earlier one;
- whether the bit changed, mutated, or influenced another performance;
- where the bit was first performed in real life;
- whether the creator approves the grouping or an edit;
- whether rights are cleared; or
- whether the grouping belongs in creator Canon.

The current WWAM adapter exposes Bit Bloodlines inside the existing **Memory
OS** `bits` tab. It replaces the incomplete Bit Ancestry presentation; it does
not add another homepage section, navigation destination, or competing player.

## Current WWAM proof

The V5.20 adapter compiles exactly:

| Measurement | Current value |
| --- | ---: |
| Source-locked lineages | 4 |
| Timestamp-validated human-curated performance candidates | 25 |
| Unique official uploads | 12 |
| Exact bounded source time | 350 seconds / 5:50 |
| Duration of every current performance window | 14 seconds |
| Earliest current performance-candidate date | 2021-04-24 |
| Latest current performance-candidate date | 2026-07-23 |

Those 25 windows are `curated-character-performance` receipts with
`speaker: null`, `speakerStatus: not-diarized`, and
`promotionAllowed: false`. “Human-curated” means a human selected the candidate
and its source coordinates passed deterministic validation. It does not mean
an authenticated editor or creator certified the performance.

### Lineage totals

| Bloodline | Windows | Sources | Source time | Indexed span |
| --- | ---: | ---: | ---: | ---: |
| The Challis Hotline | 7 | 6 | 98 seconds | 1,464 days |
| Slenderman Dispatch | 6 | 6 | 84 seconds | 1,916 days |
| The Loomis Alert System | 7 | 5 | 98 seconds | 1,433 days |
| The Feldman Frequency | 5 | 3 | 70 seconds | 37 days |

The default demonstration opens **Slenderman Dispatch**:

> SIX TIMESTAMP-VALIDATED CURATED CANDIDATE WINDOWS // 6 OFFICIAL UPLOADS //
> 1,916 INDEXED DAYS

Its complete bloodline is 84 seconds of source time. Switching immediately to
the 37-day Feldman Frequency demonstrates that the same evidence system can
show both a five-year recurrence and a short, concentrated burst without
pretending either shape proves intent or origin.

## Exact performance ledger

The order is canonical source date, then exact source coordinate, then receipt
key. Every row below is a 14-second window.

### The Challis Hotline

| Receipt key | Source | Date | Exact bounds |
| --- | --- | --- | ---: |
| `character-receipt:challis-boilermaker` | `lCH31VtaSeI` | 2022-07-20 | `6511.44-6525.44` |
| `character-receipt:challis-dj` | `WyT--HIrL8U` | 2022-08-20 | `7990.56-8004.56` |
| `character-receipt:challis-alphabet` | `N-UahfG8-gM` | 2026-06-04 | `10780-10794` |
| `character-receipt:challis-heman` | `tL9zmuyrtl4` | 2026-06-09 | `7132.72-7146.72` |
| `character-receipt:challis-miguel` | `ag3axSC9BpU` | 2026-07-09 | `3860.72-3874.72` |
| `character-receipt:challis-doctor` | `ag3axSC9BpU` | 2026-07-09 | `9851.76-9865.76` |
| `character-receipt:challis-birthday` | `LV2rmwEA0w4` | 2026-07-23 | `8309.12-8323.12` |

### Slenderman Dispatch

| Receipt key | Source | Date | Exact bounds |
| --- | --- | --- | ---: |
| `character-receipt:slender-stomach` | `Mf-0Tv_KHCE` | 2021-04-24 | `541.04-555.04` |
| `character-receipt:slender-decade` | `sdiVxLTq67Q` | 2022-01-11 | `7558.72-7572.72` |
| `character-receipt:slender-motivation` | `aHB28aYdYto` | 2023-12-30 | `3294.08-3308.08` |
| `character-receipt:slender-creed` | `f9_OkfedZAs` | 2026-05-29 | `12518.16-12532.16` |
| `character-receipt:slender-last-resort` | `shoWljlgSUU` | 2026-06-16 | `8948.8-8962.8` |
| `character-receipt:slender-aliens` | `LV2rmwEA0w4` | 2026-07-23 | `10063.6-10077.6` |

### The Loomis Alert System

| Receipt key | Source | Date | Exact bounds |
| --- | --- | --- | ---: |
| `character-receipt:loomis-dj` | `WyT--HIrL8U` | 2022-08-20 | `8057.28-8071.28` |
| `character-receipt:loomis-biscuit-job` | `Qc2vVFMO4ts` | 2023-08-13 | `7693.02-7707.02` |
| `character-receipt:loomis-wolverine` | `N-UahfG8-gM` | 2026-06-04 | `3288.16-3302.16` |
| `character-receipt:loomis-interview` | `N-UahfG8-gM` | 2026-06-04 | `8086.72-8100.72` |
| `character-receipt:loomis-sam` | `ag3axSC9BpU` | 2026-07-09 | `11242.72-11256.72` |
| `character-receipt:loomis-funding` | `LV2rmwEA0w4` | 2026-07-23 | `9042.64-9056.64` |
| `character-receipt:loomis-pepto` | `LV2rmwEA0w4` | 2026-07-23 | `10734.88-10748.88` |

### The Feldman Frequency

| Receipt key | Source | Date | Exact bounds |
| --- | --- | --- | ---: |
| `character-receipt:feldman-atmosphere` | `shoWljlgSUU` | 2026-06-16 | `8097.2-8111.2` |
| `character-receipt:feldman-titanic-two` | `ag3axSC9BpU` | 2026-07-09 | `10914.72-10928.72` |
| `character-receipt:feldman-batman` | `ag3axSC9BpU` | 2026-07-09 | `10925.68-10939.68` |
| `character-receipt:feldman-titanic` | `LV2rmwEA0w4` | 2026-07-23 | `6367.2-6381.2` |
| `character-receipt:feldman-wolfpack` | `LV2rmwEA0w4` | 2026-07-23 | `10803.68-10817.68` |

The Feldman Titanic Two and Batman windows overlap by 3.04 seconds. The
registry preserves both human-curated windows exactly. The compiler may report
the overlap; it must not silently merge, trim, widen, or deduplicate them.

## Machine echoes are not performances

The Source Dossier registry also contains exactly **52 related Archive Deep
machine receipts**:

| Evidence class | Count | End bounds | Playback/cut authority |
| --- | ---: | ---: | --- |
| `caption-character-context` | 28 | 0 | none |
| `caption-character-signal` | 24 | 0 | none |
| Total | 52 | 0 | quarantined navigation only |

The per-lineage split is:

| Bloodline | Contexts | Signals |
| --- | ---: | ---: |
| The Challis Hotline | 9 | 11 |
| Slenderman Dispatch | 7 | 5 |
| The Loomis Alert System | 6 | 3 |
| The Feldman Frequency | 6 | 5 |

All 52 are timestamp-only, `quarantined-machine-candidate` records with
`promotionAllowed: false`. They may explain that the wider archive contains a
possible reference, prompt, persona discussion, or character signal. They
cannot:

- enter the playable performance rail;
- enter a Midnight Cut;
- become a bounded clip;
- establish a performer or speaker;
- be counted as one of the 25 curated performance candidates;
- establish continuity, mutation, callback, influence, or true origin; or
- be promoted because they appear near a curated lineage.

The UI must keep this machine-echo inventory visually and semantically
separate from the bounded performance rail. Missing end bounds are a hard
playback exclusion, not an invitation to manufacture a default clip length.

## Canonical compilation

The channel-neutral engine consumes:

1. a canonical Source Dossier engine;
2. channel-supplied lineage definitions;
3. exact receipt keys or exact source coordinates; and
4. an adapter policy describing which receipt classes may become playable
   recurrence evidence.

For every playable stop, the WWAM adapter re-resolves and verifies:

- the source ID and source fingerprint;
- the Source Dossier fingerprint and archive bindings;
- the globally unique receipt key;
- exact start and end coordinates;
- source date, title, official URL, and duration;
- `kind: character-performance`;
- `evidenceType: curated-character-performance`;
- `evidenceBasis: exact-showcase-receipt`;
- `reviewState: timestamp-validated-human-curated-candidate`;
- the matching character and bit entity IDs;
- a public, caption-backed, promoted source;
- `publicExcerptAllowed: true`;
- `speaker: null` and `speakerStatus: not-diarized`; and
- `promotionAllowed: false`.

An exact key with a changed coordinate is stale; it is not “close enough.”
Unknown, duplicate, foreign, ambiguous, unavailable, quarantined, withheld,
unbounded, out-of-range, entity-mismatched, artifact-mismatched, or
fingerprint-stale evidence fails closed.

The lineage artifact itself remains `authority: editor-review`,
`reviewState: derived-review-only`, and `promotionAllowed: false`. “Editor
review” names the destination queue; it is not proof that an authenticated
editor completed a decision.

## Honest chronology language

Chronology labels may say:

- **EARLIEST CURATED WINDOW IN CURRENT INDEX**;
- **INDEXED PERFORMANCE CANDIDATE 02**; and
- **LATEST CURATED WINDOW IN CURRENT INDEX**.

Chronology labels must not say:

- first-ever or true origin;
- first spark;
- mutation;
- callback confirmed;
- the bit evolved;
- the performer returned to the bit; or
- one source caused another.

The first row is the earliest eligible receipt in the current compiled set. A
newly indexed older source may move that boundary.

## Playback and The Midnight Cut

Individual playback is source-dormant until a visitor acts. The lineage
compiler has already resolved and verified the exact receipt; on click, the
host checks that its canonical source remains available, then sends the
resolved `sourceId`, `at`, and `end` to the shared in-page YouTube playback
bridge. There is no generic 26-second fallback for a 14-second candidate.

**Cut This Bloodline** compiles the selected lineage into The Midnight Cut:

- all current WWAM lineages fit the existing three-to-eight-stop limit;
- selections retain exact receipt, source, dossier, and boundary bindings;
- order remains chronological;
- advancing between official uploads remains manual;
- viewer-written title/context remains labeled non-evidence;
- share restore re-resolves every key;
- edit briefs copy no media and grant no authority; and
- an unavailable embed retains an official-source recovery action.

## Authority ceiling

Every compiled lineage and cut reports these claims as false:

| Claim | Value |
| --- | --- |
| Individual clip speaker established | `false` |
| Speaker continuity established | `false` |
| True origin established | `false` |
| Intentional callback established | `false` |
| Mutation/evolution established | `false` |
| Causality or influence established | `false` |
| Creator approved | `false` |
| Rights cleared | `false` |
| Canon promoted or mutated | `false` |
| Media copied or downloaded | `false` |
| Published | `false` |

The character profile may display an **OWNER-SUPPLIED PROFILE MAPPING** such as
J-to-Loomis or Mike-to-Challis. That profile-level mapping does not diarize the
speaker in an individual clip.

## Universal recurrence contract

Bit Bloodlines is not a horror-podcast engine. Its pure compiler knows
sources, bounded recurrence receipts, lineage definitions, chronology,
evidence policy, and authority ceilings. WWAM names them characters and bits.

A racing adapter can use the same compiler for:

- **The Announcer's Curse** - exact broadcast windows where positive booth
  commentary is followed by a separately bounded incident candidate;
- **The Great Carnac** - an exact prediction window paired with a later
  outcome window, still awaiting human causality review;
- recurring rivalries, victory rituals, booth phrases, or track-specific
  patterns; and
- a driver's recurring charge through the field.

The racing ChannelPack supplies race, driver, track, season, booth, and
Wednesday-night vocabulary. A recurrence trail can order exact source windows,
but it cannot declare that an announcer caused a wreck, a prediction was truly
prophetic, or two incidents form one continuous story without the required
human review.

This is the reusable formula:

```text
channel-specific lineage definition
  -> canonical bounded source receipts
  -> fail-closed eligibility policy
  -> neutral chronological recurrence
  -> exact in-page playback
  -> optional three-to-eight-stop Memory Cut
  -> no origin, continuity, causality, approval, rights, or Canon inflation
```
