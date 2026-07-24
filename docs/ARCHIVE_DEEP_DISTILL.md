# WWAM Archive Deep Distill + Portfolio V1

Archive Deep Distill turns frozen **Archive Atlas “Distill Next”** batches into
caption-backed quarantine lanes without changing the meaning of the Fresh 10
or Popular 25.

Batch 01 preserves the original ten-source distill. Batch 02 freezes the exact
next ten eligible priority records after Batch 01 exclusion. Batch 03 freezes
the exact next ten after both earlier batches are excluded. Batch 04 freezes
the exact next ten after all 30 earlier records are excluded. Archive Deep
Portfolio validates all four independent artifacts and makes their bounded
public records available through one read-only discovery surface.

## Current portfolio result

- Independent batches: **4**
- Selected, caption-audited sources: **40**
- Runtime audited: **97.7 hours**
- Words audited: **1,216,993**
- Parsed caption events: **173,675**
- Topic lanes / distinct normalized topics: **400 / 48**
- Public machine moment candidates: **166**, all quarantined
- Source-level character-signal records: **52**
- Topic-only source-audio firewalls: **12**
- Special visual-ranking quarantines: **12**
- Limited available caption spans: **1**
- Cached views across the four frozen selections: **445,949**
- Full caption payloads published: **0**

All 40 sources forbid visual claims because caption timestamps cannot establish
what was on screen. The 12-count is the narrower number of sources placed in
the special visual-ranking quarantine lane; it does not mean the other 28 have
verified visual context. See `docs/ARCHIVE_DEEP_PORTFOLIO.md` for the complete
four-batch composition and audit matrix.

These are current overlay measurements. The immutable V5.4 proof remains
exactly 84 inputs, 2,175,344 audited words, 194.9 caption-audited hours, 872
promoted receipts, 42 then-quarantined Batch 01 candidates, and 168 promoted
core memory nodes.

## Batch 01 result

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
- Public artifact: below the **125 KB** batch ceiling
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

## Batch 02 result

Batch 02 contributes 23.1 audited hours, 284,532 words, 38,966 parsed caption
events, 100 topic lanes, 49 quarantined moment candidates, 11 source-level
character-signal records, and 93,357 cached snapshot views.

Its order is frozen Atlas priority, not raw view rank. The score combines
cached-view gravity, upload recency, and configured franchise-title signals.

| Batch rank | Source | Upload | Cached views | Audited words | Parsed events | Public mode |
| ---: | --- | --- | ---: | ---: | ---: | --- |
| 1 | `CFUHyfcJDTg` — Michael Myers VS Jason Voorhees Kill V Kill LIVE! | 2024-10-16 | 14,101 | 37,063 | 4,961 | Candidates; visual context unverified |
| 2 | `o4EMYqQ5DDU` — SCREAM 7 UPDATE LIVE! | 2025-09-01 | 6,819 | 10,878 | 1,543 | Standard machine candidates |
| 3 | `Z7ArdfA054w` — We Watched A Movie LIVE 8/26 HALLOWEEN, ALIEN EARTH, SAW & More | 2025-08-27 | 6,697 | 35,880 | 5,138 | Standard machine candidates |
| 4 | `k698GIJe8EA` — JASON VOORHEES ROYAL RUMBLE LIVE! | 2025-06-14 | 7,821 | 37,745 | 5,170 | Candidates; visual context unverified |
| 5 | `4X8EFw7MCmw` — HALLOWEEN Update Live! (New Footage + WOLVERINE Game Trailer) | 2025-09-25 | 6,281 | 17,793 | 2,612 | Topic navigation only |
| 6 | `KIGg_I72x_M` — We Watched A Movie LIVE 2/28 I Halloween Script Read! | 2025-03-01 | 7,484 | 32,498 | 4,408 | Topic navigation only |
| 7 | `o2O9T4nwVw4` — SCREAM Update LIVE! Huge News! | 2024-03-13 | 13,916 | 34,242 | 4,589 | Standard machine candidates |
| 8 | `qONN2sNoK2k` — Emergency SCREAM 7 Livestream | 2025-01-30 | 6,863 | 7,759 | 1,102 | Standard machine candidates |
| 9 | `QxJyVaAgZ_Y` — FRIDAY THE 13th Livestream! THE FINAL CHAPTER Watch Along | 2024-12-14 | 6,973 | 36,122 | 4,878 | Topic navigation only |
| 10 | `0svLtx3nZJM` — Jason Voorhees Deaths Tier List Ranking LIVE | 2023-11-14 | 16,402 | 34,552 | 4,565 | Candidates; visual context unverified |

The parsed event count is lower than the raw JSON3 segment-event count because
YouTube automatic captions contain overlapping rolling windows. The existing
parser collapses those windows before counting words or scoring signals.

## Batch 03 result

Batch 03 contributes **30.4 audited hours**, **378,427 words**, **53,988**
parsed caption events, **100 topic lanes / 32 distinct normalized topics**,
**40 quarantined moment candidates**, **18 source-level character-signal
records**, and **121,211 cached snapshot views**.

Its ten-source frozen selection is `M9_5cX8xowI`, `tUJviU09fWM`,
`J5uGidPT9Jc`, `nv99WEtXGvE`, `wjJy46oVmow`, `yMAvXBYAxko`,
`fUCQoxTwKqo`, `3UCnMrLMXbI`, `lH0EXRN4xdw`, and `xBOTTKQ9pxU`, in that
priority order. Two sources are topic-navigation-only; four occupy the special
visual-ranking quarantine lane. All ten still forbid visual claims. The
generated artifact and reproducible pipeline are
`public/demo/archive-deep-batch3.js` and
`pipeline/wwam_archive_deep_batch3.py`.

## Batch 04 result

Batch 04 contributes **20.5 audited hours**, **259,563 words**, **37,136**
parsed caption events, **100 topic lanes / 33 batch-local distinct topics**,
**35 quarantined moment candidates**, **11 source-level character-signal
records**, and **110,460 cached snapshot views**.

Its frozen selection is `2FlxuJxv81s`, `MSVltTVeypc`, `Qb2rDe-kJkI`,
`3Lu0beSDxcQ`, `21hL29hicoU`, `HLDAxs4_3U4`, `34BwSiucNEI`,
`ETuRUYiQEBM`, `5k6I18ZekPQ`, and `o0tcJcJk6MY`, in that priority order.
Three explicit trailer sources are topic-navigation-only. Two tier-list
sources occupy the visual-context-unverified lane. `2FlxuJxv81s` has a
disclosed 96.03% `limited-available-track`; the other nine available tracks
span at least 99.8%. No replacement or invented tail evidence was introduced.

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

Four Batch 01 sources are more restrictive:

1. Trailer reaction (`fpNtQMexZiw`)
2. Trailer breakdown (`M3P4mMDpXUc`)
3. Script reading (`5T1wWUjCGWk`)
4. Watch party (`KrBhfGxsJNM`)

For these, the public artifact keeps only topic names, counts, and timestamps.
It publishes no caption excerpt, comedy candidate, character candidate,
heatmap, or comparative comedy index. This prevents trailer dialogue,
screenplay text, or film audio from being mislabeled as host speech.

Batch 02 adds three more topic-only source-audio firewalls:

1. Trailer/new-footage reaction (`4X8EFw7MCmw`)
2. Script reading (`KIGg_I72x_M`)
3. Watchalong (`QxJyVaAgZ_Y`)

Batch 03 adds two topic-only firewalls: the Freddy death-scene ranking
`nv99WEtXGvE` and the SAW X trailer-reaction source `yMAvXBYAxko`.

Batch 04 adds three topic-only trailer firewalls:

1. HALLOWEEN ENDS final trailer (`MSVltTVeypc`)
2. PREDATOR BADLANDS trailer (`21hL29hicoU`)
3. HELLRAISER game trailer (`34BwSiucNEI`)

All 49 Batch 02 moment candidates are machine-surfaced, speaker-undiarized,
origin-unattributed, and quarantined. Its 11 character-signal records describe
source-level caption signals; they do not establish a performer, performance,
or verified character appearance.

That restriction catches a real failure mode: the generic analyzer found 99
“Loomis” mentions in the Halloween 4 script reading. Those mentions establish
that the caption contains the name; they do **not** establish that J performed
the recurring Dr. Loomis character. V1 correctly publishes zero character
candidates for that source.

Tier-list, merchandise, poster-ranking, and visual-ranking streams retain
caption candidates, but their visual context remains explicitly unverified.
Twelve sources across the portfolio—three in each of the first two batches,
four in Batch 03, and two in Batch 04—occupy that special visual-ranking
quarantine lane. All 40
sources forbid visual claims. A caption timestamp can prove what words
survived; it cannot prove which poster, prop, matchup, death, or tier was on
screen.

The 166 public moments are machine candidates, not creator votes, confirmed
soundbytes, Red Band placements, or canonical “UP IN YA” selections.
Playback review may establish context; it does not promote a candidate into any
downstream product lane. Each lane requires its own policy-compliant decision
by an authenticated, authorized reviewer.

## Public shape

The generated batch artifacts are:

```text
public/demo/archive-deep-distill.js
window.WWAM_ARCHIVE_DEEP

public/demo/archive-deep-batch2.js
window.WWAM_ARCHIVE_DEEP_BATCH2

public/demo/archive-deep-batch3.js
window.WWAM_ARCHIVE_DEEP_BATCH3

public/demo/archive-deep-batch4.js
window.WWAM_ARCHIVE_DEEP_BATCH4
```

Batch 01 retains the legacy `wwam-archive-deep-distill/v1` shape:

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

Batch 02 through Batch 04 use
`shokker-youtube-wiki/archive-deep-batch/v1`. Each adds explicit `channel` and
`lane` manifests, keeps batch topic and character indices derivable from its
bounded `streams`, and remains `caption-audited-quarantine`. The portfolio
composes all four into `shokker-youtube-wiki/archive-deep-portfolio/v1`
without mutating any checked-in artifact.

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

Three independent fingerprint families per batch make changes auditable:

- `selectionSha256`: frozen selection manifest;
- `captionSetSha256`: source-to-private-payload fingerprints;
- `publicFnv1a`: browser-verifiable fingerprint over the public stream records.

Archive Deep Portfolio retains all four batches' original values and adds a
portfolio-manifest FNV. The FNV values are structural change detectors, not
signatures or proof of authenticity, authorship, speaker identity, review,
rights, or approval.

## Browser engine

`public/demo/archive-deep-engine.js` validates each batch. The portfolio
composer exposes one current read-only interface:

```js
const archiveDeep = WWAMArchiveDeepPortfolio.create({
  batches: [
    WWAM_ARCHIVE_DEEP,
    WWAM_ARCHIVE_DEEP_BATCH2,
    WWAM_ARCHIVE_DEEP_BATCH3,
    WWAM_ARCHIVE_DEEP_BATCH4
  ],
  engineFactory: WWAMArchiveDeepEngine
});

archiveDeep.getMetrics();
archiveDeep.getEvidencePolicy();
archiveDeep.getSelection();
archiveDeep.getStream("WKs1uPGMQvw");
archiveDeep.browse({ restricted: false, sort: "priority" });
archiveDeep.browse({ batchId: "archive-deep-batch-03", sort: "priority" });
archiveDeep.search("Scream");
archiveDeep.getMomentCandidates({ minHeat: 90 });
archiveDeep.getTopicReceipts("Halloween");
archiveDeep.getTopicIndex();
archiveDeep.getCharacterIndex();
archiveDeep.verifyFingerprint();
archiveDeep.exportSnapshot();
archiveDeep.getSearchPayload();
```

Search is limited to the compact public record: title, topic names, character
names, and short public receipts. It does not search the private caption cache.
All returned objects are defensive copies.

## Reproduction

Offline, byte-identical validation:

```powershell
python pipeline\wwam_archive_deep_distill.py --check
python pipeline\wwam_archive_deep_batch2.py --check
python pipeline\wwam_archive_deep_batch3.py --check
python pipeline\wwam_archive_deep_batch4.py --check
```

Regenerate any public artifact from the existing private cache:

```powershell
python pipeline\wwam_archive_deep_distill.py
python pipeline\wwam_archive_deep_batch2.py
python pipeline\wwam_archive_deep_batch3.py
python pipeline\wwam_archive_deep_batch4.py
```

Refresh each batch's ten private caption payloads using the default extractor
and explicit client fallbacks, then regenerate:

```powershell
python pipeline\wwam_archive_deep_distill.py --refresh-captions
python pipeline\wwam_archive_deep_batch2.py --refresh-captions
python pipeline\wwam_archive_deep_batch3.py --refresh-captions
python pipeline\wwam_archive_deep_batch4.py --refresh-captions
```

Targeted engine/data tests:

```powershell
node --test tests\archive-deep-distill.test.mjs
node --test tests\archive-deep-batch2.test.mjs
node --test tests\archive-deep-batch3.test.mjs
node --test tests\archive-deep-batch4.test.mjs
node --test tests\archive-deep-portfolio.test.mjs
```

## Atlas integration status

All four batches are integrated as non-promotable evidence lanes:

1. Batch 01 retains the legacy `archive-deep-10` / “Archive Deep 10” lane.
2. Batch 02 uses `archive-deep-batch-02` / “Archive Deep Batch 02” with
   `integrated-quarantine` state.
3. Batch 03 uses `archive-deep-batch-03` / “Archive Deep Batch 03” with
   `integrated-quarantine` state.
4. Batch 04 uses `archive-deep-batch-04` / “Archive Deep Batch 04” with
   `integrated-quarantine` state.
5. Popular 25 remains separate because it promises a dated view-ranked
   selection; none of the Archive Deep batches does.
6. Current Atlas coverage is **74 deeply indexed / 390 metadata-only / 8
   caption-limited**, or **15.7%** of 472 sources.

The regenerated Atlas keeps all forty frozen batch IDs out of Distill Next.
Its provenance retains independent schema, source-selection, selection,
caption-set, and public-stream fingerprint records for each batch. All four
pipelines retain byte-identical `--check` paths.

## Product integration boundary

The browser lazy-loads all four compact batch artifacts and the portfolio
composer with Archive Deep rather than adding them to the first-load payload.
Search and the Archive Atlas can address all four batches, while Fresh 10 and
Popular 25 keep their original counts and selection semantics.

Do not send the 166 machine moments into Red Band, UP IN YA, character voice,
Canon, or creator-facing exports on playback review alone. Playback may
establish context; each destination lane requires its own policy-compliant
decision by an authenticated, authorized reviewer. Restricted sources stay
excluded by construction.

This sequence provides a real forty-source coverage gain while cross-product
promotion remains a set of separately scoped, authenticated and authorized
lane decisions instead of silently turning automatic captions into canon.
