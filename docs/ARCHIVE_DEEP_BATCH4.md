# Archive Deep Batch 04 — integration record

Archive Deep Batch 04 is an **integrated quarantine lane**. It adds the exact
next ten Archive Atlas Distill Priority V1 sources after the 30 sources in
Batches 01–03 are excluded. It changes the Archive Atlas and Archive Deep
Portfolio overlay without changing the promoted Showcase corpus.

## Frozen selection

Snapshot: `2026-07-23`

Priority is the declared composite of cached-view gravity, upload recency, and
franchise-title signal. It is not a raw views leaderboard.

| Rank | Video ID | Score | Cached views | Source |
| ---: | --- | ---: | ---: | --- |
| 1 | `2FlxuJxv81s` | 83.6 | 18,395 | The Future of the HALLOWEEN Franchise - Live! |
| 2 | `MSVltTVeypc` | 83.5 | 20,055 | HALLOWEEN ENDS FINAL TRAILER Reaction + Breakdown |
| 3 | `Qb2rDe-kJkI` | 83.3 | 8,777 | CINEMACON Warner Bros Panel Reactions LIVE! |
| 4 | `3Lu0beSDxcQ` | 83.3 | 8,131 | SCREAM Movies + TV + Ghostface Tier List LIVE! |
| 5 | `21hL29hicoU` | 83.0 | 8,030 | PREDATOR BADLANDS Trailer Reaction & Breakdown LIVE! |
| 6 | `HLDAxs4_3U4` | 82.9 | 6,492 | WWAM LIVE — HELLRAISER REVIVAL Breakdown and more |
| 7 | `34BwSiucNEI` | 82.9 | 4,988 | WWAM Live — HELLRAISER Game Trailer and Movie News |
| 8 | `ETuRUYiQEBM` | 82.8 | 19,585 | Halloween Ends Q & A Plus Whatever! Live! |
| 9 | `5k6I18ZekPQ` | 82.7 | 5,888 | ALIEN: EARTH After Party Hangout |
| 10 | `o0tcJcJk6MY` | 82.2 | 10,119 | Rob Zombie's HALLOWEEN Character Tier List LIVE! |

The source Atlas reconstruction, prior 30-ID exclusion set, and selected ten
records are all independently fingerprinted. The selection does not substitute
a more popular source when evidence is inconvenient.

## Evidence pass

All ten official English YouTube automatic-caption JSON3 tracks were fetched
through the established client fallback. Full caption payloads remain in the
gitignored source cache. The public artifact carries only aggregate
measurements, ten topic lanes per source, short timestamped machine candidates,
and character-name context signals.

One source has an honestly limited available track:

- `2FlxuJxv81s` spans 96.03% of the cached video duration and is labeled
  `limited-available-track`.
- The other nine tracks span at least 99.8% and are labeled
  `complete-available`.

No replacement was made because a substantial official track exists and the
frozen selection contract does not permit skipping an eligible record merely
for incomplete tail coverage.

## Exact batch measurements

- 10 caption-audited sources
- 20.5 cached video hours
- 259,563 caption words audited
- 37,136 caption events
- 100 timestamped topic lanes
- 33 distinct topic labels
- 35 bounded, still-quarantined moment candidates
- 11 character-name context signals
- 3 source-audio-restricted records
- 2 visual-context-unverified tier-list records
- 110,460 cached snapshot views, reported separately from priority
- 114,973 public artifact bytes

## Firewalls

The explicit trailer sources `MSVltTVeypc`, `21hL29hicoU`, and
`34BwSiucNEI` expose topic names, counts, and timestamps only. Public excerpts,
moments, character signals, heatmaps, peaks, and derived indices are withheld
because automatic captions cannot establish the host/trailer audio boundary.

The tier-list sources `3Lu0beSDxcQ` and `o0tcJcJk6MY` may expose bounded
caption-derived navigation and machine candidates. They never claim what is on
screen, which tier a character occupies, or any visual ranking outcome.

Across every source:

- speaker diarization: false
- performer attribution: false
- quote-origin attribution: false
- visual verification: false
- promotion allowed: false
- candidate state: quarantined
- public excerpt limit: 16 words

Character-name matches are context candidates only. They do not establish that
Mike or J performed a character.

## Fingerprints

- source Atlas:
  `sha256:b924d6f91c6a92b86e2d463fa22518f51bd09d57632e0c40f08f0876d97e1174`
- excluded 30-source set:
  `sha256:42e8d84e2cb77c56b98c92286f876070e9195251a63ad068cd3145ab7c2e4878`
- selected ten records:
  `sha256:cb5c2cd7528c1dcffa6726b8ab17abeda9b808151ecee92566e53bf0068d30af`
- private caption set:
  `sha256:dcfe15a3c00ff419f8afe50585f1b40acac25703e4f2dae5de063927e377b5c6`
- public stream ledger:
  `fnv1a32:56ca74df`

## Reproduction

```powershell
python pipeline\wwam_archive_deep_batch4.py --check
node --test tests\archive-deep-batch4.test.mjs
```

`--refresh-captions` is an explicit network operation and may change the
private caption-set fingerprint if YouTube changes the official automatic
caption payload:

```powershell
python pipeline\wwam_archive_deep_batch4.py --refresh-captions
```

## Integration contract

1. The lane stays `integrated-quarantine`; promotion remains false.
2. Archive Atlas validates the fourth artifact and marks only these ten records
   as deep-captioned in `archive-deep-batch-04`.
3. Archive Deep Portfolio validates all four pinned batch manifests and derives
   the 40-source totals.
4. Search/Ask surfaces must keep Batch 04 evidence source-scoped and may never
   let it silently outrank promoted Showcase evidence.
5. Browser loading must keep Batch 04 before the Portfolio constructor.
6. Release copy must derive four-batch totals from the ledgers rather than
   reclassifying quarantine as canon.

## Integrated four-batch result

The composed quarantine portfolio now derives:

- 40 sources across four independent batches
- 97.7 hours, 1,216,993 words, and 173,675 caption events
- 400 topic lanes across 48 normalized topics
- 166 quarantined moments and 52 character-context signals
- 12 source-audio firewalls and 12 visual-ranking quarantines
- one disclosed limited available caption span
- 445,949 cached snapshot views
- portfolio manifest `fnv1a32:14050c7a`

Archive Atlas now reports **74 deeply indexed / 390 metadata-only / 8
caption-limited**, or **15.7%** deep coverage. Its canonical metadata
fingerprint is
`sha256:c22572b2795edc2feb562362073eb8967a6f82793131d1e6671f42f9ac7579ac`
and its runtime fingerprint is `fnv1a32:0db0b888`. All 40 Archive Deep IDs are
excluded from the next deterministic metadata-only queue.
