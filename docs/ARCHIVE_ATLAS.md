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
- Public payload: approximately **170 KB**, below the 250 KB ceiling

The public artifact contains only ID, title, upload date, duration, cached view
count, derived YouTube/thumbnail URLs, evidence coverage, source lane, and the
two explicitly disclosed availability fields. It contains no captions,
excerpts, quotes, speaker labels, topic summaries, sentiment, or inferred
opinions.

## Evidence coverage

| Status | Count | Meaning |
| --- | ---: | --- |
| `deeply-indexed` | 34 | A current source lane has a usable caption-backed distill. |
| `metadata-only` | 430 | Only cached title/date/duration/view metadata is searchable. |
| `caption-limited` | 8 | No usable caption path survived in the cache; no transcript claims are made. |
| `unavailable` | 0 | Supported as a future fail-honest state, but no cached record currently needs it. |

The current feed-side source lanes are:

- Fresh 10: **10** records, including one caption-limited source
- Popular 25: **25** records, including one caption-limited source
- Commentary catalog overlap: **1** record (`3wK00_-K-Y0`)
- Archive metadata lane: **436** records

Those lanes describe current product coverage. They do not change what the
metadata itself proves. The 36 records selected into a source lane contain 34
usable caption distills and two disclosed caption gaps.

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

At this snapshot the first queue item is **“SCREAM 7 Trailer Reaction and
Discussion LIVE!”** at **96.4**:

- Popularity: 49.2
- Recency: 27.2
- Core-franchise title signal: 20

The exact numbers remain bound to the July 23 snapshot and will only change
when the cached feed snapshot is intentionally refreshed and regenerated.

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
- `lane`: `fresh-10`, `popular-25`, `commentary-catalog`, or
  `archive-metadata`
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
  score: 96.4,
  breakdown: {
    popularity: 49.2,
    recency: 27.2,
    franchise: 20
  },
  signals: [
    { id: "scream", label: "Scream", tier: "core" }
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

It reads the local metadata cache plus the checked-in Fresh 10, Popular 25, and
commentary catalog to classify the current source lanes. It asserts the
reconciled 472-entry feed membership, validates every record, refuses a public
artifact at or above 250 KB, and emits:

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

Turning a metadata-only card into a topic map, quote, character receipt, comedy
heat score, or host take requires a future caption distill and source review.
