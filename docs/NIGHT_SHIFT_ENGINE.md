# WWAM Night Shift engine

`public/demo/night-shift-engine.js` is a deterministic daily return ritual over
the existing WWAM Showcase, Lore, and Tape Trivia engines. It assembles a
three- to five-beat visit from already indexed sources. It does not summarize
new transcripts, infer speakers, invent quotations, or claim where a recurring
bit truly began.

Night Shift is deliberately not another recommendation shelf:

- the date changes the deterministic rotation;
- every shift has a beginning, callback, interaction, and payoff;
- a shared seed recreates the exact journey against the same archive snapshot;
- ordered progress can be saved and restored by replaying each saved interaction
  from its canonical choice ID;
- every visible archival claim retains one or more playable receipts.

## Load and create

Load Night Shift after the three engines it composes:

```html
<script src="./showcase-engine.js"></script>
<script src="./lore-engine.js"></script>
<script src="./tape-trivia-engine.js"></script>
<script src="./night-shift-engine.js"></script>
```

```js
var nightShift = window.WWAMNightShiftEngine.create({
  showcase: showcaseEngine, // required
  lore: loreEngine,         // optional; enables Lore callbacks
  trivia: tapeTrivia,       // optional; enables a Tape Trivia handoff
  today: "2026-07-23"       // optional deterministic default date
});
```

The current full snapshot reports:

| Inventory | Count |
| --- | ---: |
| Indexed sources | 74 |
| Playable receipts | 872 |
| Dated sources with playable receipts | 71 |
| Lore Field Guide entries | 177 |
| Snapshot date | 2026-07-23 |
| Archive fingerprint | `78a94f54` |

These values come from `nightShift.metrics`; UI code should read them rather
than hard-code them.

## Public API

```js
nightShift.engine;
nightShift.version;
nightShift.product;
nightShift.modes;
nightShift.metrics;
nightShift.evidencePolicy;

nightShift.createDaily(options);
nightShift.createFromSeed(seed);
nightShift.parseSeed(seed);
nightShift.getSnapshotState(date);
nightShift.resolveChoice(journey, beatId, choiceId);
nightShift.createProgress(journey);
nightShift.restoreProgress(journey, savedProgress);
```

The static namespace also exposes `VERSION`, `MODES`, `PROGRESS_SCHEMA`,
`REQUIRED_ROLES`, `create()`, and `parseSeed()`.

## Create a shift

```js
var journey = nightShift.createDaily({
  date: "2026-07-23",
  mode: "lore",
  variant: "default", // optional shareable rotation key
  beatCount: 5        // optional integer: 3, 4, or 5
});
```

`date` must be a real `YYYY-MM-DD` calendar date. With the same archive
fingerprint, date, mode, franchise, and variant, the full serialized journey is
identical.

Each journey covers these five semantic roles:

1. `latest-indexed-source`
2. `archive-callback`
3. `playable-receipt`
4. `trivia-or-choice`
5. `closing-payoff`

A five-beat journey renders one role per beat. Four-beat mode merges the
playable receipt with the interaction. Three-beat mode also merges the newest
source with its playable receipt and the archive callback with the
interaction. `rolesCovered` remains complete in all three shapes.

The default is five beats when the scope has at least three sources and five
receipts. A reduced but still honest inventory defaults to three. Fewer than
two dated playable sources fails closed because there is no defensible older
archive callback.

## Modes

`lore`

: Uses a playable, older receipt attached to an eligible, source-backed Lore
  Field Guide
  `bit`, `topic`, or `motif`. Lore receipt kinds that are context-only,
  source-level, or awaiting human verification are excluded. The callback is
  explicitly labeled as an archive callback, not a true-origin claim.

`chaos`

: Uses Showcase Engine Riff Chemistry moments for the callback and feature
  pressure points. "Chaos" describes the archive classifier; it is not a claim
  about a creator's intent or objective quality.

`franchise`

: Keeps the latest source, older callback, feature, interaction, and payoff
  inside one cataloged franchise. Pass `franchise: "Halloween"` or omit it for
  a deterministic daily franchise rotation.

These modes sequence existing engine output. They do not create a second
Personalized Descent model or duplicate Tape Trivia question generation.

## Journey contract

The most useful top-level fields are:

```js
{
  id,
  date,
  dateBasis,
  mode,
  franchise,
  variant,
  seed,
  share,
  snapshot,
  scope,
  status,
  limitations,
  beats,
  rolesCovered,
  completionContract,
  metrics,
  evidencePolicy
}
```

Every beat includes:

```js
{
  id,
  order,
  kind,
  roles,
  title,
  kicker,
  copy,
  copyType: "derived-navigation-copy",
  source,
  receiptIds,
  evidence,
  evidenceCount,
  integrations,
  interaction,
  requiredAction,
  playable,
  claimBoundary
}
```

Every item in `beat.evidence` contains the source/video ID, title, date,
timestamp, playable YouTube URL, category, bounded excerpt, and evidence
labels. The public excerpt is capped at 16 words. `speaker` is always `null`;
speaker status is always `not-diarized`.

## Trivia and choice boundary

When Tape Trivia can build a scoped session, Night Shift exposes one public
round with no answer or answer ID. `resolveChoice()` reconstructs that exact
seeded session and returns the reveal with its playable evidence.

The attached receipt remains playable before submission, so following it can
reveal context or the answer. The interaction says this plainly with:

```js
{
  answerFieldsHidden: true,
  playableReceiptMayRevealAnswer: true,
  honorSystem: true
}
```

This avoids pretending the archive can be simultaneously playable and
spoiler-proof.

If Tape Trivia is unavailable for the selected scope, Night Shift creates a
two-receipt fan preference. It is explicitly marked `noCorrectAnswer: true`
and never manufactures a factual reveal.

## Share seed and archive identity

The readable seed format is:

```text
night-shift-v1|DATE|MODE|FRANCHISE|VARIANT|ARCHIVE_FINGERPRINT
```

Example:

```text
night-shift-v1|2026-07-23|lore|ANY|daily|78a94f54
```

Use `journey.share.parameter` for a query-string value and recreate it with:

```js
var restoredJourney = nightShift.createFromSeed(sharedSeed);
```

Recreation fails if the fingerprint belongs to another archive snapshot. It
does not silently substitute new receipts after the source inventory changes.

## Snapshot staleness

`journey.snapshot` and `getSnapshotState(date)` name both the requested journey
date and `indexedThrough`. The status is:

- `current` on the snapshot date;
- `recent` one through seven days later;
- `stale` more than seven days later;
- `snapshot-after-journey-date` for a historical share older than the snapshot;
- `unknown` when a usable snapshot date is unavailable.

Stale journeys remain deterministic, but `status` becomes
`ready-with-boundaries` and the exact limitation says newer uploads may be
missing.

## Ordered progress

```js
var progress = nightShift.createProgress(journey);

progress.getState();
progress.getCurrentBeat();
progress.completeCurrent(); // acknowledgment beat
progress.completeCurrent({ choiceId: selectedChoiceId }); // interaction beat

var saved = progress.exportState();
var restored = nightShift.restoreProgress(journey, saved);
```

The schema is `wwam-night-shift-progress/v1`. Completion is an ordered prefix
of the journey's exact beat IDs. An interaction cannot be completed without a
valid grounded choice. Each stored response includes `choiceId` (`null` for an
acknowledgment). On restore, the engine reruns `resolveChoice()` for every
completed interaction and requires the stored result—including correctness,
selected answer, explanation, evidence, and accuracy boundary—to exactly match
the canonical replay. Acknowledgment responses must match their exact canonical
shape as well.

Restore therefore rejects a different journey or seed, reordered beat IDs,
responses for incomplete beats, completed beats missing an accepted response
or choice ID, and forged result/explanation payloads. This is deterministic
semantic validation, not a cryptographic signature: a local attacker who can
rewrite the whole snapshot is outside this storage boundary.

Suggested persistence key:

```js
"wwam-night-shift:" + journey.id
```

## Minimal UI binding

1. Read `journey.snapshot.notice` above the experience.
2. Render the mode label, date, and progress percentage.
3. Render only `progress.getCurrentBeat()` as the active card.
4. Use `beat.source` for source context and `beat.evidence` for timestamp
   buttons.
5. For a Trivia interaction, render `interaction.round.prompt` and
   `interaction.round.choices`; for a preference, render
   `interaction.prompt` and `interaction.choices`.
6. Submit through `progress.completeCurrent({ choiceId })`, not by mutating the
   journey.
7. Show the returned reveal evidence, then advance to the next beat.
8. Put `journey.share.parameter` behind a Share Tonight's Shift action.

No Night Shift engine function downloads, edits, publishes, or licenses media.
It returns navigation metadata and timestamped source links only.
