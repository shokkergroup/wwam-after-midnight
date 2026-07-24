# Red Band Memorability Candidate Index V2.1

Red Band V2.1 replaces a pile of equal “99” scores with an inspectable,
deterministic candidate index over the WWAM archive. It produces exactly 100
playable receipts when at least 100 eligible receipts exist. Every public
excerpt is capped at 16 words.

“Candidate Index” is deliberate. The system ranks evidence-backed candidates;
it does not claim that Mike, J, or an authenticated editor chose the order.
The current snapshot contains 567 deduplicated playable candidates and
publishes 100 ranks across 53 sources.

## What the raw score means

The engine percentile-normalizes six independent archive signals:

| Signal | Weight | Evidence used |
| --- | ---: | --- |
| Category intensity | 25% | The existing moment category and its existing heat/score |
| Room break | 16% | `THE ROOM BREAKS`, `BREAKDOWN`, laughter, “lost it,” and equivalent caption markers |
| Language voltage | 16% | Profanity, kill language, gross-out language, and nuclear-take language already present in the excerpt/category |
| Lore/callback value | 17% | Timestamp-validated human-curated character candidates, recurring names, and lore/bit categories |
| Preselected-candidate input | 16% | Membership in the project’s UP IN YA or character-performance candidate sets; the compatibility component key remains `humanCuration` |
| Source diversity | 10% | An inverse-density signal that rewards strong receipts from less-saturated tapes, lanes, and franchises |

The weighted subtotal is multiplied by an evidence modifier from 0.75 to 1.00.
The modifier uses source/caption status, the confidence already recorded on a
receipt, preselected-candidate input, multi-provider agreement, and explicit
uncertainty penalties. It does not guess a speaker.

Recency is excluded by default. A caller may explicitly enable a clearly
labeled adjustment from -3 to +3 points. This prevents “new” from silently
becoming a synonym for “memorable.”

`item.score` is this raw machine score. `item.rank` is the candidate’s final
position after the Top-25 diversity and receipt-coherence pass described below.
A deferred candidate can therefore have a higher raw score than a candidate
promoted into the first 25. The API exposes
`diversityControl.baselineRank`, final-rank movement, receipt-coherence
measurements, and deferral reasons rather than hiding that distinction.

## Deterministic Top-25 diversity and receipt-coherence pass

The raw score establishes a stable baseline order. V2.1 then greedily selects
the first 25 candidates from a bounded 150-candidate horizon using these
deterministic controls:

| Top-25 control | Rule |
| --- | ---: |
| Caption-receipt coherence | Score at least 48/100 and no structural failure flag |
| Any one category | 4 |
| Excerpts containing the explicit body/sexual lexical family | 5 |
| Preselected candidates | 8 |
| Any one source | 2 |
| Near-duplicate transcript wording | One candidate at a similarity threshold of 0.72 |

The lexical control is evaluated against the same bounded excerpt the public
sees. Common proper-name uses such as Dick Tracy and Dick Warlock are excluded.
The near-duplicate control compares normalized content-token overlap using a
deterministic Jaccard/containment rule.

Candidates blocked from the first 25 are not deleted. They remain eligible
from rank 26 onward in baseline order. If a smaller archive cannot fill the
window under the caps, the engine relaxes constraints in baseline order and
labels every relaxation.

### What “receipt coherence” means

This is a conservative caption-fragment fitness check, not an AI opinion about
whether a line is funny. It runs on the same maximum-16-word excerpt the public
sees and publishes every input and result on `item.receiptCoherence`.

The score combines:

| Structural measure | Weight |
| --- | ---: |
| Lexical diversity | 25% |
| Non-filler content density | 25% |
| Resistance to repeated-token loops | 25% |
| Bounded-context completeness | 15% |
| Enough words to support the measurement | 10% |

For excerpts of eight or more lexical tokens, deterministic failure flags also
catch:

- fewer than three distinct content tokens when a boundary/filler signal is
  present;
- repeated-token share above 0.62 when a boundary/filler signal is present;
- filler share above 0.40;
- a thin fragment that also begins/ends at an incomplete boundary.

The check is intentionally language-neutral. Profanity, anatomy terms, sexual
language, gross-out language, and extreme horror language are **not** negative
coherence inputs. A coherent wild line can pass; an incoherent clean filler
loop can fail. Passing the gate does not certify exact human-edited wording,
comic quality, creator approval, or who spoke.

Diagnostics publish a controlled before/after comparison:
`beforeGate` reruns the identical diversity selection with only coherence
disabled; `afterGate` is the published Top 25. This makes the effect auditable
without rewriting the raw machine score.

For the current snapshot, the Top 25 contains:

- 5 explicit body/sexual lexical hits;
- 8 preselected candidates;
- 8 categories, with no category appearing more than 4 times;
- 21 sources;
- 0 constraint-relaxed selections.

The counterfactual diversity-only Top 25 contained 3 receipts that failed the
coherence check, with a mean score of 71.77 and a minimum of 44.17. The
published Top 25 contains 0 failures, with a mean coherence score of 73.76 and
a minimum of 58.93.

The known thin fragment at `kX3wb5pBRDo@1223` (“sauce yeah yeah yeah i can’t…”)
is still playable and inspectable. Its raw baseline rank remains 66, its
coherence score is 44.17, and it carries `thin-context`, `repetition-loop`, and
`boundary-fragment` flags. The pass defers it to candidate rank 80 rather than
deleting or censoring it.

These are measured diagnostics, not creator votes or subjective claims that
diversity or coherence alone makes a moment memorable.

## Editorial vote hook

A caller can explicitly supply a bounded adjustment without overwriting the
underlying evidence components:

- key: `sourceId@roundedTimestamp`
- range: -5 through +5
- effect: 1.5 points per vote
- default: exactly zero

Missing votes are never inferred. `getEditorialVoteTemplate()` returns a
zero-filled object for the current 100. The current snapshot supplies zero
non-zero votes, and the engine does not authenticate any adjustment as a Mike,
J, creator, or editor decision.

### UP IN YA remains a separate editorial lane

WWAM UP IN YA keeps its own editorial-selection semantics: it is the project’s
selected soundbyte collection. Importing one of those receipts into Red Band
means only that it entered the ranking pool through a preselected candidate
set. It does **not** turn UP IN YA membership into:

- an authenticated creator vote;
- an authenticated editor decision about the Red Band rank;
- verification of an undiarized speaker;
- certification that the bounded auto-caption wording is exact.

The same boundary applies to character-performance candidate sets. Red Band
preserves their source provenance but calls their ranking signal
“preselected,” not “human approved.”

## Determinism and ties

The stable baseline tie policy is:

1. raw machine score after the evidence modifier and any explicitly supplied
   editorial/recency adjustment;
2. evidence percentile;
3. preselection-signal percentile;
4. category percentile;
5. source-diversity percentile;
6. a fingerprint derived from excerpt content, category, source date/title, and timestamp;
7. an opaque identity hash only if every content key is otherwise identical.

The Top-25 diversity and receipt-coherence pass runs only after that baseline
order. Source-ID lexical order is never a ranking comparator. Diagnostics
expose merged input collisions, equal-score groups, the largest tie, rank-key
collisions, Top-25 category/source distributions, coherence before/after
measurements, cap counts, and any relaxed selections. Every `rankKey` includes
the unique ordinal plus an identity fingerprint and is stable for the same
inputs and policy.

## Evidence boundary

A ranked item proves only that a bounded caption excerpt is indexed at a playable timestamp. It does not prove:

- which host spoke;
- who originated a recurring joke;
- that an excerpt is a verbatim human-edited transcript;
- that a character performance belongs to a specific host unless separately verified;
- that a creator or authenticated editor voted for the receipt or its rank.

Accordingly, every ranking carries `speaker: null`, `host: null`,
`trueOriginClaim: false`, `syntheticQuote: false`, `creatorVoteClaim: false`,
and `editorSelectionAuthenticated: false`.

`humanCurated` remains as a legacy compatibility Boolean for existing
consumers. In V2.1 it mirrors `preselectedCandidate`; it must not be interpreted
as authenticated human review. `humanCurationStatus` and
`selectionProvenance` carry the truthful public wording.

## Browser integration

Load `red-band-ranking-v2.js` after the six data files, then create the index:

```js
var redBandV2 = window.WWAMRedBandRankingV2.create({
  catalog: window.WWAM_CATALOG,
  deep: window.WWAM_DEEP_DISTILL,
  live: window.WWAM_LIVESTREAMS,
  popular: window.WWAM_POPULAR_LIVE,
  curation: window.WWAM_CURATED,
  characters: window.WWAM_CHARACTER_LORE
});

redBandV2.rankings;        // 100 machine-ranked, playable candidates
redBandV2.getTop(10);      // presentation-ready top ten
redBandV2.getByRank(1);    // one receipt
redBandV2.getDiagnostics();
redBandV2.getEditorialVoteTemplate();
redBandV2.exportSnapshot();
```

Existing dossier buttons can keep using:

```js
item.tapeId;
item.t;
item.timestamp;
item.category;
item.quote;
item.url;
```

The new presentation fields are:

```js
item.rankKey;
item.score;                // raw machine score before Top-25 placement
item.rank;                 // post-diversity candidate position
item.confidence;
item.confidenceLabel;
item.scoreComponents;
item.whyMemorable;
item.whyMemorableSummary;
item.basis;
item.uncertainty;
item.editorialVoteKey;
item.editorialVote;
item.preselectedCandidate;
item.humanCurated;         // legacy compatibility alias
item.humanCurationStatus;
item.selectionProvenance;
item.creatorVoteClaim;
item.editorSelectionAuthenticated;
item.receiptCoherence;
item.diversityControl;
item.rankInterpretation;
item.characterLoreReceipt;
```

The public policy and current measured distribution are also inspectable:

```js
window.WWAMRedBandRankingV2.TOP_SLICE_POLICY;
window.WWAMRedBandRankingV2.RECEIPT_COHERENCE_POLICY;
redBandV2.diagnostics.topSliceDiversity;
redBandV2.methodology.topSliceDiversity;
```

To apply explicit caller-supplied adjustments:

```js
var voted = window.WWAMRedBandRankingV2.create({
  catalog: window.WWAM_CATALOG,
  deep: window.WWAM_DEEP_DISTILL,
  live: window.WWAM_LIVESTREAMS,
  popular: window.WWAM_POPULAR_LIVE,
  curation: window.WWAM_CURATED,
  characters: window.WWAM_CHARACTER_LORE,
  editorialVotes: {
    "LV2rmwEA0w4@2270": 2
  }
});
```

Enable recency only when the UI also displays the engine’s explicit label:

```js
var recencyCut = window.WWAMRedBandRankingV2.create({
  includeRecency: true
});

recencyCut.diagnostics.recency.label;
// "RECENCY BOOST (EXPLICITLY ENABLED)"
```
