# WWAM Archive Atlas V1

Archive Atlas makes the complete **cached official WWAM Streams-feed snapshot**
navigable without pretending that every upload has been transcript-distilled.
It is a metadata map and a source-selection system, not a second transcript
search engine.

## Snapshot

- Official feed records: **472**
- Feed upload range: **October 19, 2018–July 23, 2026**
- Cached duration: **4,309,258 seconds / 1,197.0 hours**
- Cached views at the snapshot: **5,674,608**
- Source snapshot: **July 23, 2026**, day precision
- Network calls during generation: **zero**
- Public payload: below the **250 KB** release ceiling

The public artifact contains only ID, title, upload date, duration, cached view
count, derived YouTube/thumbnail URLs, evidence coverage, source lane, and the
two explicitly disclosed availability fields. It contains no captions,
excerpts, quotes, speaker labels, topic summaries, sentiment, or inferred
opinions.

## Evidence coverage

| Status | Count | Meaning |
| --- | ---: | --- |
| `deeply-indexed` | 74 | A current source lane has a usable caption-backed distill. |
| `metadata-only` | 390 | Only cached title/date/duration/view metadata is searchable. |
| `caption-limited` | 8 | No usable caption path survived in the cache; no transcript claims are made. |
| `unavailable` | 0 | Supported as a future fail-honest state, but no cached record currently needs it. |

The current feed-side source lanes are:

- Fresh 10: **10** records, including one caption-limited source
- Popular 25: **25** records, including one caption-limited source
- Archive Deep 10: **10** caption-backed records from the first frozen
  Distill Next batch
- Archive Deep Batch 02: **10** caption-backed records from the exact next
  frozen eligible priority batch
- Archive Deep Batch 03: **10** caption-backed records from the exact next
  frozen eligible priority batch after Batch 02 exclusion
- Archive Deep Batch 04: **10** caption-backed records from the exact next
  frozen eligible priority batch after all 30 earlier exclusions
- Commentary catalog overlap: **1** record (`3wK00_-K-Y0`)
- Archive metadata lane: **396** records

Those lanes describe current product coverage. They do not change what the
metadata itself proves. The 76 records selected into a source lane contain 74
usable caption distills and two disclosed caption gaps. Overall deep coverage
is **15.7%**.

Archive Deep 10 is independently generated and fingerprinted by
`pipeline/wwam_archive_deep_distill.py`; Archive Deep Batch 02 is independently
generated and fingerprinted by `pipeline/wwam_archive_deep_batch2.py`; Archive
Deep Batch 03 is independently generated and fingerprinted by
`pipeline/wwam_archive_deep_batch3.py`; Archive Deep Batch 04 is generated and
fingerprinted by `pipeline/wwam_archive_deep_batch4.py`. Atlas provenance retains each batch's
schema, generation/observation time, priority version, source-selection
fingerprint, selection fingerprint, caption fingerprint, and public FNV-1a
value. Batch 01 keeps the legacy `archive-deep-10` lane. Batches 02–04 use
their sequence-numbered `archive-deep-batch-0N` lanes with
`integrated-quarantine` state.

The combined current Archive Deep overlay covers **40 caption-audited sources,
97.7 hours, 1,216,993 words, 173,675 caption events, 400 topic lanes across 48
distinct topics, 166 quarantined moments, 52 source-level character signals,
12 topic-only source-audio firewalls, 12 special visual-ranking quarantines,
one disclosed limited available caption span, and 445,949 cached snapshot
views**. All 40 records forbid visual claims; the
12-count does not imply that the other 28 have verified visual context. All 40
are excluded from the remaining metadata-only queue, and no batch permits
candidate promotion.

Runtime FNV-1a values make the exact checked-in payloads independently
recomputable:

- portfolio: `fnv1a32:14050c7a`
- Batch 01: `fnv1a32:17045a51`
- Batch 02: `fnv1a32:bcea5692`
- Batch 03: `fnv1a32:f79f2399`
- Batch 04: `fnv1a32:56ca74df`
- Atlas canonical metadata: `sha256:c22572b2795edc2feb562362073eb8967a6f82793131d1e6671f42f9ac7579ac`
- Atlas runtime: `fnv1a32:0db0b888`

## Why availability says `not-captured`

The legacy local metadata cache preserves title, date, duration, view count,
channel, thumbnail, and a caption URL when one was exposed. It does **not**
preserve yt-dlp's `availability` or `live_status` fields. Archive Atlas therefore
publishes `not-captured` for those fields rather than backfilling `public`,
`was_live`, or any other unverified value.

The Atlas does not claim that July 23 availability is current on July 24 or
later. `cutoff.currentAvailabilityChecked` is deliberately `false`.

## Distill Next formula

Only `metadata-only` records enter the default queue. Already deep records,
caption-limited records, and unavailable records are excluded.

The score is transparent and capped at 100:

1. **Popularity, 0–50:** `50 × log1p(cached views) / log1p(highest eligible cached views)`
2. **Recency, 0–30:** linear upload recency between the oldest eligible upload
   and the July 23, 2026 snapshot
3. **Franchise relevance, 0–20:** cached-title aliases only
   - 20: one of the four current deep-distill franchises — Halloween, Friday
     the 13th, Scream, or A Nightmare on Elm Street
   - 14: another recurring horror franchise such as Chucky, Alien/Predator,
     The Conjuring, Terrifier, Evil Dead, Hellraiser, Texas Chainsaw,
     The Exorcist, or Saw
   - 6: a broad horror/slasher title signal
   - 0: no configured title signal

Every queued result returns the three components, matched title signals, global
rank, formula version, and the evidence basis
`cached title/date/views only`. No description, transcript topic, humor score,
or host opinion is manufactured for an undistilled upload.

Each completed batch freezes the exact next ten eligible records after all
earlier Archive Deep exclusions. Its priority order combines cached-view
gravity, upload recency, and configured franchise-title signals. It is not raw
view rank. A source with more cached views can appear below a newer or stronger
franchise-title match.

The score changes when a completed deep batch leaves the eligible pool because
popularity is normalized against the highest remaining eligible cached view
count. The underlying titles, dates, and views remain bound to the July 23
snapshot.

## Browser integration

Load the compact data before the engine:

```html
<script src="./archive-atlas-data.js"></script>
<script src="./archive-atlas-engine.js"></script>
```

Create one read-only engine:

```js
const atlas = window.WWAMArchiveAtlasEngine.create(
  window.WWAM_ARCHIVE_ATLAS
);
```

Core integration calls:

```js
const stats = atlas.getStats();
// { records: 472, coverage, lanes, yearStart, yearEnd, hours, ... }

const coverage = atlas.getCoverage();
// Definitions and exact counts for every evidence status and source lane.

const calendar = atlas.getBuckets();
// Decades -> years -> months, with record and coverage counts at every level.

const filters = atlas.getFilterOptions();
// Decades, years, months, coverage, lanes, title-franchise aliases,
// availability and live-status values.

const july = atlas.browse({
  year: 2026,
  month: "2026-07",
  coverage: ["deeply-indexed", "metadata-only"],
  sort: "newest",
  limit: 24,
  offset: 0
});

const titleSearch = atlas.search("Jason", {
  decade: "2020s",
  limit: 30
});
// Expands the title alias to Friday the 13th. The result explicitly returns
// transcriptSearch: false and basis: "cached title metadata".

const record = atlas.getRecord("LV2rmwEA0w4");

const queue = atlas.getDistillQueue({
  franchise: "scream",
  year: 2025,
  limit: 25
});

const provenance = atlas.getProvenance();
const integrity = atlas.verifyFingerprint();
```

### `browse(filters)`

Supported filters:

- `decade`: `2020`, `"2020"`, or `"2020s"`
- `year`: four-digit year
- `month`: `"YYYY-MM"` or a month number when `year` is also present
- `coverage`: one status or an array of statuses
- `lane`: `fresh-10`, `popular-25`, `archive-deep-10`,
  `archive-deep-batch-02`, `archive-deep-batch-03`,
  `archive-deep-batch-04`,
  `commentary-catalog`, or `archive-metadata`
- `availability` / `liveStatus`
- `minViews`
- `franchise`: a configured title-alias group ID
- `sort`: `newest`, `oldest`, `views`, `title`, `duration`, or
  `distill-priority`
- `limit` / `offset`

It returns `{ filters, total, offset, records, evidenceScope }`. Results are
defensive copies and can be safely decorated by the UI.

### `search(query, filters)`

Search is restricted to cached titles. Aliases improve discovery:

- `Jason`, `Voorhees`, and `Crystal Lake` route to Friday the 13th titles
- `Freddy` and `Elm Street` route to Nightmare titles
- `Myers` and `Loomis` route to Halloween titles
- `Ghostface` and `Woodsboro` route to Scream titles

The response always includes:

```js
{
  transcriptSearch: false,
  evidenceScope: "cached titles only; transcript search is disabled",
  expandedAliases: [],
  results: []
}
```

Each result's `match.basis` is `cached title metadata`. A UI should retain that
language anywhere metadata-only search results appear.

### `getDistillQueue(options)`

The queue returns a formula manifest, eligible/matched counts, exclusion counts,
and records with:

```js
record.priority = {
  rank: 1,
  score: 81.9,
  breakdown: {
    popularity: 45.5,
    recency: 16.4,
    franchise: 20
  },
  signals: [
    { id: "friday-the-13th", label: "Friday the 13th", tier: "core" }
  ],
  basis: "cached title/date/views only"
};
```

Filters do not silently rerank the archive. `priority.rank` remains the global
queue rank so a filtered sales/demo view and the full editorial queue stay
comparable.

## Regeneration

The generator is offline and deterministic:

```powershell
python pipeline\wwam_archive_atlas.py
python pipeline\wwam_archive_atlas.py --check
```

It reads the local metadata cache plus the checked-in Fresh 10, Popular 25,
all four Archive Deep batches, and commentary catalog to classify the current
source lanes. It asserts the reconciled 472-entry feed membership, validates
every record, refuses a public artifact at or above 250 KB, and emits:

- a SHA-256 fingerprint over sorted feed IDs;
- a SHA-256 fingerprint over canonical public metadata;
- an independently recomputable FNV-1a runtime fingerprint.

The browser engine fails closed if fingerprint-bound record metadata is
changed. Both SHA fingerprints remain available for export/audit workflows.

## V1 integration boundary

V1 deliberately does not add a visible section by itself. A UI can now build:

- a decade/year/month “video store wall”;
- metadata cards with real thumbnails and links;
- current deep-coverage overlays;
- a title-only archive search;
- an editorial Distill Next control room.

Turning any remaining metadata-only card into a topic map, quote, character
receipt, comedy heat score, or host take still requires a caption distill and
source review. The first 40 Archive Deep sources demonstrate that coverage can
grow without weakening the boundary for the remaining 390 metadata-only
records.
