# WWAM Archive Deep Distill V1

Archive Deep Distill turns the first frozen **Archive Atlas “Distill Next”**
batch into a caption-backed evidence lane without changing the meaning of the
Fresh 10 or Popular 25.

It is intentionally not wired into the dossier or Ask UI yet. The pipeline,
compact public artifact, browser engine, tests, and private evidence cache are
complete, and Archive Atlas now recognizes the sources as the separate
`archive-deep-10` evidence lane.

## Result

- Selected sources: **10**
- Selection: exact global ranks 1–10 from
  `archive-distill-priority/v1` at the July 23, 2026 Atlas snapshot
- Runtime audited: **23.7 hours**
- Words audited: **294,471**
- Parsed caption events: **43,585**
- Topic lanes: **100**
- Public machine moment candidates: **42**
- Character-signal records: **12**
- Cached views at the frozen Atlas snapshot: **120,921**
- Public artifact: **104,530 bytes**
- Full caption payloads published: **0**

All ten sources now have a private local JSON3 payload in the gitignored
`source-cache/captions/` directory. A July 24 network probe found every source
public, completed (`was_live`), age-limit zero, and exposing English `en` /
`en-orig` automatic captions. No source exposed a manual English subtitle
track.

The normal yt-dlp extractor exposed all ten tracks. The previously hardcoded
`web_safari` client exposed only one of ten during the same probe, so the V1
pipeline now tries the normal extractor first and then `android_vr`, `tv`,
`web_embedded`, and `web_safari` fallbacks. This matters because signed caption
URLs expire; a URL-shaped cache field is not proof that a caption can still be
retrieved.

## Exact batch

Views are the cached July 23 Atlas values, not a live counter.

| Rank | Source | Upload | Cached views | Audited words | Parsed events | Public mode |
| ---: | --- | --- | ---: | ---: | ---: | --- |
| 1 | `fpNtQMexZiw` — SCREAM 7 Trailer Reaction and Discussion LIVE! | 2025-10-30 | 24,131 | 12,446 | 2,010 | Topic navigation only |
| 2 | `WKs1uPGMQvw` — SCREAM 7 Spoiler Review Party! | 2026-03-03 | 17,454 | 33,965 | 4,792 | Standard machine candidates |
| 3 | `vq6mrfqOgZw` — HALLOWEEN UPDATE Live! | 2025-08-20 | 14,433 | 19,967 | 2,982 | Standard machine candidates |
| 4 | `M3P4mMDpXUc` — SCREAM 7 Teaser Trailer Breakdown LIVE | 2026-01-13 | 10,059 | 10,472 | 1,505 | Topic navigation only |
| 5 | `1j3F9vAWBo4` — HALLOWEEN Movies & Activities Tier List w Chris from 3C Films LIVE! | 2025-10-08 | 10,703 | 42,614 | 6,308 | Candidates; visual context unverified |
| 6 | `3iMZcaVcvTU` — We Watched A Movie LIVE Movie News! Halloween Eve! | 2025-10-31 | 7,429 | 29,732 | 4,296 | Standard machine candidates |
| 7 | `gR_64RyPhEM` — SPIRIT HALLOWEEN Merchandise Tier List Ranking LIVE! | 2025-08-06 | 8,871 | 37,054 | 5,442 | Candidates; visual context unverified |
| 8 | `5T1wWUjCGWk` — Halloween 4 Script Reading LIVE! | 2025-10-29 | 7,186 | 37,020 | 6,087 | Topic navigation only |
| 9 | `KrBhfGxsJNM` — We Watched A Movie LIVE! Halloween 4 Watch Party | 2024-10-31 | 14,568 | 31,740 | 4,351 | Topic navigation only |
| 10 | `hagePawEnC4` — We Watched A Movie LIVE! Movie News & Ranking Friday the 13th Posters | 2025-11-20 | 6,087 | 39,461 | 5,812 | Candidates; visual context unverified |

The parsed event count is lower than the raw JSON3 segment-event count because
YouTube automatic captions contain overlapping rolling windows. The existing
parser collapses those windows before counting words or scoring signals.

## Evidence and rights boundary

The public artifact never includes full captions. It includes aggregate counts,
topic names/counts/timestamps, and short timestamped receipts capped at
**16 words**. Every receipt is passed through the existing public slur and
sensitive-topic rejection filters.

Automatic captions do not reliably identify:

- which host or guest spoke;
- whether a line came from a host, trailer, film, screenplay, or clip;
- which visual item is on screen;
- who originated a recurring joke or character performance.

Accordingly, all public candidate evidence says `speakerStatus:
"not-diarized"` and `originStatus: "not-inferred"`. Visual context is false
until a frame or human review verifies it.

Four sources are more restrictive:

1. Trailer reaction (`fpNtQMexZiw`)
2. Trailer breakdown (`M3P4mMDpXUc`)
3. Script reading (`5T1wWUjCGWk`)
4. Watch party (`KrBhfGxsJNM`)

For these, the public artifact keeps only topic names, counts, and timestamps.
It publishes no caption excerpt, comedy candidate, character candidate,
heatmap, or comparative comedy index. This prevents trailer dialogue,
screenplay text, or film audio from being mislabeled as host speech.

That restriction catches a real failure mode: the generic analyzer found 99
“Loomis” mentions in the Halloween 4 script reading. Those mentions establish
that the caption contains the name; they do **not** establish that J performed
the recurring Dr. Loomis character. V1 correctly publishes zero character
candidates for that source.

Tier-list, merchandise, and poster-ranking streams retain caption candidates,
but their visual context remains explicitly unverified. A caption timestamp can
prove what words survived; it cannot prove which poster, prop, or tier was on
screen.

The 42 public moments are machine candidates, not creator votes, confirmed
soundbytes, Red Band placements, or canonical “UP IN YA” selections. They need
source playback review before promotion.

## Public shape

The generated artifact is:

```text
public/demo/archive-deep-distill.js
window.WWAM_ARCHIVE_DEEP
```

Top-level shape:

```js
{
  schema: "wwam-archive-deep-distill/v1",
  generated,
  observedAt,
  scope,
  method,
  selection: {
    priorityVersion,
    atlasSnapshotDate,
    sourceAtlasArchiveSha256,
    frozen,
    records
  },
  evidencePolicy,
  meta,
  streams,
  topicIndex,
  characterIndex,
  fingerprints
}
```

Each stream reuses the proven Popular 25 topic, signal, character-cue, heatmap,
and index shape where the source boundary is safe enough. V1 adds:

- `archivePriority`: frozen original rank, score, 50/30/20 breakdown and basis;
- `contentMode`: trailer, spoiler review, news, visual ranking, script reading,
  or watch party;
- `rightsPolicy`: whether public output is topic-navigation-only;
- `captionEvidence`: event/coverage measurements and a SHA-256 fingerprint of
  the private payload;
- `evidence` on each public receipt;
- `summary`: an evidence-bounded source description.

Two combined fingerprints make changes auditable:

- `selectionSha256`: frozen selection manifest;
- `captionSetSha256`: source-to-private-payload fingerprints;
- `publicFnv1a`: browser-verifiable fingerprint over the public stream records.

## Browser engine

`public/demo/archive-deep-engine.js` exposes:

```js
const archiveDeep = WWAMArchiveDeepEngine.create(WWAM_ARCHIVE_DEEP);

archiveDeep.getMetrics();
archiveDeep.getEvidencePolicy();
archiveDeep.getSelection();
archiveDeep.getStream("WKs1uPGMQvw");
archiveDeep.browse({ restricted: false, sort: "priority" });
archiveDeep.search("Scream");
archiveDeep.getMomentCandidates({ minHeat: 90 });
archiveDeep.getTopicReceipts("Halloween");
archiveDeep.getTopicIndex();
archiveDeep.getCharacterIndex();
archiveDeep.verifyFingerprint();
archiveDeep.exportSnapshot();
```

Search is limited to the compact public record: title, topic names, character
names, and short public receipts. It does not search the private caption cache.
All returned objects are defensive copies.

## Reproduction

Offline, byte-identical validation:

```powershell
python pipeline\wwam_archive_deep_distill.py --check
```

Regenerate the public artifact from the existing private cache:

```powershell
python pipeline\wwam_archive_deep_distill.py
```

Refresh the ten private caption payloads using the default extractor and
explicit client fallbacks, then regenerate:

```powershell
python pipeline\wwam_archive_deep_distill.py --refresh-captions
```

Targeted engine/data tests:

```powershell
node --test tests\archive-deep-distill.test.mjs
```

## Atlas integration status

The first three Atlas-only steps are complete:

1. Keep this as a new `archive-deep-10` lane. Do not merge it into Popular 25;
   Popular 25 promises a different, view-ranked selection.
2. Teach `wwam_archive_atlas.py` to read this artifact and mark these ten IDs
   deeply indexed with the new lane.
3. Regenerate Atlas. Current coverage is now
   **44 deeply indexed / 420 metadata-only / 8 caption-limited**, the metadata
   lane falls from 436 to 426, and deep coverage becomes about **9.3%**.

The regenerated Atlas keeps all ten frozen batch IDs out of Distill Next. Its
new first eligible record is `CFUHyfcJDTg`, “Michael Myers VS Jason Voorhees
Kill V Kill LIVE!”, at 89.8. Atlas provenance records the Archive Deep schema,
generation/observation time, priority version, selection SHA-256, and public
FNV-1a fingerprint. Both pipelines retain byte-identical `--check` paths.

## Remaining UI integration plan

1. Lazy-load this 104 KB artifact and 13 KB engine with Archive Atlas rather
   than adding them to the initial page payload.
2. Add these streams to the internal dossier map and a merged Ask-the-Tape
   livestream search input, but keep Fresh 10 and Popular 25 UI counts intact.
3. Surface a small “Autopsied Batch 01” row above the recalculated
   Distill Next queue. Store the frozen original priority rank even though the
   remaining queue will rerank.
4. Do not send the 42 machine moments into Red Band, UP IN YA, character voice,
   or creator-facing exports until a playback reviewer promotes them. Restricted
   sources stay excluded by construction.

This sequence provides a real ten-source coverage gain first. Cross-product
promotion remains a separate human-review step instead of silently turning
automatic captions into canon.
