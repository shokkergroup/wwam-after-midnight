# WWAM Tape Trivia engine

`public/demo/tape-trivia-engine.js` is a deterministic, browser-ready fan game layer over the existing Showcase and Lore engines.

## Load and create

Load it after `showcase-engine.js` and `lore-engine.js`, then create one shared engine:

```js
var tapeTrivia = window.WWAMTapeTriviaEngine.create({
  showcase: showcaseEngine,
  lore: loreEngine
});
```

The engine does not read transcripts or invent questions at runtime. It uses the existing catalog metadata and 872 timestamped Lore receipts. Synthetic source summaries, creator-context notes, and the locked Marky Mark candidate are excluded.

## UI-ready API

```js
var session = tapeTrivia.createSession({
  seed: "fan-visible-seed",
  length: 5, // 5 or 10
  difficulty: "mixed", // easy, medium, hard, mixed
  franchise: "Halloween", // optional
  category: "OUT OF POCKET", // optional
  questionTypes: ["source", "movie", "franchise", "category", "earlier-later"]
});

session.getState();
session.getCurrentRound();
session.submit(choiceId); // alias: answer()
session.next();           // alias: advance()
session.getSummary();
session.exportSession();
```

`getCurrentRound()` deliberately omits the answer. `submit()` returns the reveal, score, streak, and one or two exact source receipts. Every item in `result.reveal.evidenceBag` can be passed directly to the page's existing `addToEvidenceBag()` flow:

```js
{
  receiptId,
  source,    // commentary or livestream
  id,        // source/video ID
  sourceId,
  at,
  t,
  title,
  category,
  excerpt,
  date,
  url,
  timecode
}
```

## Round types

- `source`: identify the exact indexed upload.
- `movie`: identify the cataloged movie attached to a commentary.
- `franchise`: identify one of the four cataloged watchalong franchises.
- `category`: identify the existing editorial archive classification.
- `earlier-later`: compare either indexed archive dates (easy) or two timestamps inside the same upload (medium/hard).

The engine never asks who spoke a line. Available captions are not speaker-diarized, and the reveal repeats that evidence limitation.

## Discovery and metrics

Use `tapeTrivia.metrics`, `tapeTrivia.filters`, `tapeTrivia.evidencePolicy`, `getAvailableQuestionTypes(filters)`, and `getPoolMetrics(filters)` to populate controls and proof counters without duplicating archive logic in the UI. The current build reports 74 indexed sources; 71 of those contain at least one short playable game receipt.
