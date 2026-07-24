# WWAM Archive Deep Portfolio V1

Archive Deep Portfolio is the current, read-only composition of three
independently generated ten-source Archive Deep batches. It makes thirty
caption-audited archive livestreams searchable as one quarantine collection
while preserving the selection, evidence policy, and fingerprints of each
source batch.

It is an evidence overlay, not a rewrite of the frozen V5.4 product proof. It
adds no item to the promoted 872-receipt ledger, Canon, Red Band, WWAM UP IN YA,
or the creator-approved character set.

## Current portfolio overlay

| Measurement | Current value |
| --- | ---: |
| Independent batches | 3 |
| Caption-audited sources | 30 |
| Audited runtime | 77.2 hours |
| Audited caption words | 957,430 |
| Parsed caption events | 136,539 |
| Topic lanes | 300 |
| Distinct normalized topics | 44 |
| Quarantined public moment candidates | 131 |
| Source-level character-signal records | 41 |
| Topic-only source-audio firewalls | 9 |
| Special visual-ranking quarantines | 10 |
| Cached snapshot views | 335,489 |

The 41 character-signal records are source-level automatic-caption signals.
They are not 41 people, performances, verified character appearances, or
speaker attributions. All 131 public moment candidates remain machine-surfaced,
speaker-undiarized, origin-unattributed, unreviewed, and quarantined.

Nine trailer, script-reading, watch-party, or film-clip-risk sources are
topic-navigation only. They expose topic names, counts, and timestamps, but no
public excerpt, comedy candidate, character candidate, or heatmap derived from
source audio. Ten sources occupy the special visual-ranking quarantine lane.
All 30 forbid visual claims; the 10-count does not imply that the other 20 have
verified visual context.

## Frozen V5.4 proof remains frozen

The current portfolio must not be substituted into the immutable V5.4 proof
headline. That proof remains exactly:

- **84 source inputs**
- **2,175,344 audited caption words**
- **194.9 caption-audited hours**
- **872 promoted, bounded receipts**
- **42 then-quarantined Batch 01 candidates**
- **168 promoted core memory nodes**

Those numbers describe the named V5.4 release snapshot. The thirty-source
portfolio numbers describe the current Archive Deep overlay. In particular,
the portfolio's 131 candidates are not promoted receipts and must not be added
to 872.

## Selection is priority, not raw view rank

Batch 01 freezes the first ten records chosen by Archive Atlas Distill Priority
V1. Batch 02 freezes the exact next ten eligible metadata-only records after
Batch 01 exclusion. Batch 03 freezes the exact next ten after both earlier
batches are excluded. All 30 selected records are excluded from the current
metadata-only Distill Next queue.

The priority score is a transparent composite:

1. cached-view gravity, up to 50 points;
2. upload recency, up to 30 points;
3. configured franchise-title signals, up to 20 points.

Accordingly, Archive Deep priority rank is **not raw view rank**, “most watched,”
“most popular,” or a content-quality ranking. Views are one dated metadata
input. Title metadata determines franchise points; it does not establish what
happened inside a source.

The portfolio preserves each source's batch rank and adds a collision-free
portfolio position from 1–30. That position means deterministic batch order,
not a cross-batch claim that one livestream is better or more viewed than
another.

## Independent fingerprints

Each batch retains its own:

- selection SHA-256;
- private-caption-set SHA-256 manifest;
- public-stream FNV-1a fingerprint.

The portfolio validates all three independently, rejects reordered batches,
duplicate source IDs, priority drift, evidence-policy drift, and mismatched
fingerprints, then adds a separate portfolio-manifest fingerprint.

The current public values are:

- portfolio: `fnv1a32:8e474ea8`;
- Batch 01: `fnv1a32:17045a51`;
- Batch 02: `fnv1a32:bcea5692`;
- Batch 03: `fnv1a32:f79f2399`.

These fingerprints detect structural changes. They are not signatures and do
not prove source authenticity, channel ownership, transcript correctness,
reviewer identity, speaker identity, rights clearance, or creator approval.

## Browser contract

Load all three public data artifacts, the established batch engine, and the
portfolio composer:

```html
<script src="./archive-deep-distill.js"></script>
<script src="./archive-deep-batch2.js"></script>
<script src="./archive-deep-batch3.js"></script>
<script src="./archive-deep-engine.js"></script>
<script src="./archive-deep-portfolio.js"></script>
```

Create the read-only portfolio:

```js
const archiveDeep = WWAMArchiveDeepPortfolio.create({
  batches: [
    WWAM_ARCHIVE_DEEP,
    WWAM_ARCHIVE_DEEP_BATCH2,
    WWAM_ARCHIVE_DEEP_BATCH3
  ],
  engineFactory: WWAMArchiveDeepEngine
});
```

The public surface provides:

```js
archiveDeep.getMetrics();
archiveDeep.getEvidencePolicy();
archiveDeep.getSelection();
archiveDeep.getStream("M9_5cX8xowI");
archiveDeep.browse({ batchId: "archive-deep-batch-03", sort: "priority" });
archiveDeep.search("Scream");
archiveDeep.getMomentCandidates({ batchId: "archive-deep-batch-03" });
archiveDeep.getTopicReceipts("Halloween");
archiveDeep.getTopicIndex();
archiveDeep.getCharacterIndex();
archiveDeep.verifyFingerprint();
archiveDeep.exportSnapshot();
archiveDeep.getSearchPayload();
```

Returned state is defensively copied. The bounded search payload contains
public source records and short receipts, never full captions.

## Twelve-query audit set

This audit matrix tests the answer boundary as well as retrieval. The wording
does not require the global Ask surface to accept every sentence verbatim; it
defines the correct result if a matching interaction is offered.

| Audit question or task | Correct result boundary |
| --- | --- |
| How many sources are in Archive Deep now? | 30 across three independent batches. |
| How much of the portfolio is caption audited? | 77.2 hours, 957,430 words, and 136,539 parsed events. |
| Show Batch 03 only. | Exactly ten sources, retaining their Batch 03 ranks. |
| Why is a Batch 03 source ranked there? | Show cached-view gravity + recency + franchise-title components; never call it raw view rank. |
| Which Batch 03 source has the most cached views? | Use the dated view metadata sort, not priority position. |
| Find Scream topics in Batch 03. | Return source/topic navigation with its evidence label. |
| Find a funny Batch 03 moment. | Return a quarantined machine candidate with exact source/time and no speaker. |
| Who said that line? | Abstain: automatic captions are not speaker-diarized. |
| Is this a verified Dr. Loomis performance? | No; a source-level character signal does not establish a performance. |
| Quote the trailer or death-scene-ranking audio. | Refuse the excerpt and keep the source topic-navigation-only. |
| Which poster or tier was on screen? | Abstain unless visual context is separately verified. |
| Add this candidate to Canon or Red Band. | Refuse automatic promotion; require the destination lane's authenticated, policy-compliant review. |

## Release checks

```powershell
python pipeline\wwam_archive_deep_distill.py --check
python pipeline\wwam_archive_deep_batch2.py --check
python pipeline\wwam_archive_deep_batch3.py --check
node --test tests\archive-deep-distill.test.mjs
node --test tests\archive-deep-batch2.test.mjs
node --test tests\archive-deep-batch3.test.mjs
node --test tests\archive-deep-portfolio.test.mjs
node --test tests\v58-release-contract.test.mjs
```

The private JSON3 caption payloads remain in the gitignored source cache.
Checked-in public artifacts contain aggregate measurements and bounded,
timestamped fragments only.
