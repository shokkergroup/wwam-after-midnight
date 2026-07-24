# Red Band Memorability Index V2

Red Band V2 replaces a pile of equal “99” scores with an inspectable, deterministic ranking over the WWAM archive. It produces exactly 100 playable receipts when at least 100 eligible receipts exist. Every public excerpt is capped at 16 words.

## What the score means

The engine percentile-normalizes six independent archive signals:

| Signal | Weight | Evidence used |
| --- | ---: | --- |
| Category intensity | 25% | The existing moment category and its existing heat/score |
| Room break | 16% | `THE ROOM BREAKS`, `BREAKDOWN`, laughter, “lost it,” and equivalent caption markers |
| Language voltage | 16% | Profanity, kill language, gross-out language, and nuclear-take language already present in the excerpt/category |
| Lore/callback value | 17% | Grounded character soundbytes, recurring names, and lore/bit categories |
| Human curation | 16% | WWAM UP IN YA selections and receipts explicitly marked human-curated in their provenance |
| Source diversity | 10% | An inverse-density signal that rewards strong receipts from less-saturated tapes, lanes, and franchises |

The weighted subtotal is multiplied by an evidence modifier from 0.75 to 1.00. The modifier uses source/caption status, the confidence already recorded on a receipt, multi-provider agreement, and explicit uncertainty penalties. It does not guess a speaker.

Recency is excluded by default. A caller may explicitly enable a clearly labeled adjustment from -3 to +3 points. This prevents “new” from silently becoming a synonym for “memorable.”

## Editorial vote hook

Human editors can add a bounded vote without overwriting the evidence score:

- key: `sourceId@roundedTimestamp`
- range: -5 through +5
- effect: 1.5 points per vote
- default: exactly zero

Missing votes are never inferred. `getEditorialVoteTemplate()` returns a zero-filled object for the current 100.

## Determinism and ties

The stable tie policy is:

1. final score;
2. evidence percentile;
3. human-curation percentile;
4. category percentile;
5. source-diversity percentile;
6. a fingerprint derived from excerpt content, category, source date/title, and timestamp;
7. an opaque identity hash only if every content key is otherwise identical.

Source-ID lexical order is never a ranking comparator. Diagnostics expose merged input collisions, equal-score groups, the largest tie, and rank-key collisions. Every `rankKey` includes the unique ordinal plus an identity fingerprint.

## Evidence boundary

A ranked item proves only that a bounded caption excerpt is indexed at a playable timestamp. It does not prove:

- which host spoke;
- who originated a recurring joke;
- that an excerpt is a verbatim human-edited transcript;
- that a character performance belongs to a specific host unless separately verified.

Accordingly, every ranking carries `speaker: null`, `host: null`, `trueOriginClaim: false`, and `syntheticQuote: false`.

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

redBandV2.rankings;        // 100 ranked, playable receipts
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
item.score;
item.confidence;
item.confidenceLabel;
item.scoreComponents;
item.whyMemorable;
item.basis;
item.uncertainty;
item.editorialVoteKey;
item.editorialVote;
item.humanCurated;
item.humanCurationStatus;
item.characterLoreReceipt;
```

To apply reviewed votes:

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
