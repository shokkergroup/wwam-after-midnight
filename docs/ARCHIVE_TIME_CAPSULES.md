# Archive Time Capsules

## Product promise

**The Years Have Teeth** turns a calendar year into a playable, source-linked
archive route without pretending every upload has been watched, captioned, or
editorially verified.

The feature deliberately keeps three ledgers visible:

1. **The Marquee** describes records in the cached official Streams-feed
   snapshot: upload count, known runtime, cached views, coverage, and leading
   uploads by observed views.
2. **What the Tapes Remember** contains only promoted-corpus sources and
   timestamped receipts whose indexed source date belongs to the chosen year.
3. **The Quarantine Drawer** contains Archive Deep sources and machine
   candidates from the year. Those candidates remain non-promotable,
   speaker-undiarized, and origin-unattributed.

This separation is the feature. It prevents a metadata title from becoming a
content summary and prevents a machine candidate from quietly becoming canon.

## Public experience

A visitor chooses any year represented by Archive Atlas. The capsule provides:

- a year marquee with exact cached-feed measurements;
- the coverage split for deeply indexed, metadata-only, caption-limited, and
  unavailable records;
- leading cached uploads, labeled as snapshot observations rather than
  permanent popularity ranks;
- promoted-corpus source and receipt counts for that year;
- bounded, playable promoted-memory samples;
- Archive Deep source, topic-lane, and quarantined-candidate counts for that
  year;
- a deterministic five-stop **Play the Year** route assembled only from
  official source URLs and valid whole-second timestamps;
- a reproducible share packet and a bounded JSON evidence manifest.

The player never autoplays. Every route stop opens an official WWAM YouTube
source.

## Two-ledger example

The 2019 capsule is an important accuracy test:

- Archive Atlas contains 21 cached Streams-feed records from 2019, all
  metadata-only.
- The separately indexed promoted commentary corpus contains 12 sources and 96
  timestamped receipts from 2019.

Those figures are both true, but they describe different bounded sets. The
capsule must never relabel the twelve commentary sources as deeply indexed
members of the 21-record Streams-feed slice.

## Runtime contract

The browser engine is exposed as:

```js
const capsules = ShokkerEraCapsuleEngine.create({
  atlas,
  showcase,
  lore,
  archiveDeep,
  labels
});

capsules.getYears();
const capsule = capsules.build(2025);
capsules.verify(capsule);
capsules.serialize(capsule);
```

`labels` is an optional presentation adapter. The engine itself does not embed
WWAM, horror, or comedy vocabulary, allowing the same three-ledger pattern to
work for a racing league, sports channel, podcast, music archive, or another
YouTube catalog.

## Evidence rules

- A view count is a cached observation, not a current count or unique audience.
- The Atlas year total covers the cached Streams-feed snapshot, not every
  upload ever published by the channel.
- Metadata-only records can contribute title, date, duration, cached views,
  thumbnail, source URL, and coverage state. They cannot contribute inferred
  topics, quotes, sentiment, jokes, or a description of what happened inside
  the upload.
- Promoted-memory route stops must resolve to an indexed source and a valid
  timestamp within that source.
- Archive Deep moment candidates always retain `promotionAllowed: false` and
  `speaker: null`.
- Archive Deep source and topic information remains caption-derived,
  machine-surfaced, and quarantined.
- Automatic captions can be wrong.
- No capsule claims to be the definitive, best, funniest, or defining account
  of a year.
- FNV fingerprints detect structural changes. They are not signatures and do
  not establish authenticity, ownership, authorship, review, rights, or
  creator approval.
- Export packets omit raw transcripts, caption payloads, full caption-event
  arrays, and undisclosed context.

## Determinism and fail-closed behavior

Identical inputs and a chosen year produce identical ordering and a stable
fingerprint. A serialized packet carries enough bounded data to reproduce and
verify the capsule, but not enough to recreate the underlying caption corpus.

The verifier rejects:

- years that do not exist in the supplied Atlas;
- mismatched year totals or coverage counts;
- invalid or non-official playback coordinates;
- a promoted route stop whose source does not belong to the selected year;
- any quarantine item that claims promotion or a named speaker;
- unexpected transcript, caption, or full-event fields;
- an altered fingerprint.

If Showcase, Lore, or Archive Deep is absent, the engine degrades to an honest
metadata capsule. It does not manufacture a memory route to fill empty space.

## Reference snapshot

The current V5.12 four-batch data should reproduce these high-signal year
slices:

| Year | Cached feed | Known runtime | Cached views | Feed coverage | Separate indexed memory | Archive Deep quarantine |
| --- | ---: | ---: | ---: | --- | --- | --- |
| 2019 | 21 records | 30.7 h | 156,432 | 21 metadata-only | 12 sources / 96 receipts | none |
| 2022 | 51 records | 137.4 h | 1,368,453 | 13 deep / 37 metadata / 1 limited | 13 sources / 190 receipts | 3 sources / 10 candidates |
| 2024 | 63 records | 176.9 h | 643,691 | 5 deep / 58 metadata | none in promoted corpus | 5 sources / 19 candidates |
| 2025 | 94 records | 222.4 h | 637,619 | 19 deep / 75 metadata | none in promoted corpus | 19 sources / 83 candidates |
| 2026 | 37 records | 120.9 h | 291,240 | 13 deep / 23 metadata / 1 limited | 10 sources / 153 receipts | 4 sources / 17 candidates |

These are deterministic facts about the checked-in snapshots. They are not
live channel measurements.

## Commercial portability

The same feature can become:

- season capsules for a racing league;
- tour or album-era capsules for a music channel;
- annual topic recaps for a news or analysis channel;
- game, campaign, or cast-era capsules for an actual-play archive;
- sponsor-supported retro nights or anniversary routes.

The portable advantage is not a generic AI summary. It is the visible
distinction between inventory, evidence-backed memory, and material still
awaiting human review.
