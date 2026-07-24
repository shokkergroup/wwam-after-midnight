# Cold Open Factory

Cold Open Factory is a deterministic planning layer on top of Creator Clip
Lab. It does not rank raw transcripts again. It takes Clip Lab's existing
source receipts, evidence labels, risk labels, and proposed edit boundaries and
turns them into 15-, 30-, 60-, and 90-second storyboard candidates.

It produces metadata, not media.

## Integration

Load `cold-open-engine.js` after `creator-studio-engine.js`:

```js
const clipLab = WWAMCreatorClipLab.create({ showcase });
const factory = WWAMColdOpenFactory.create({ clipLab });
```

The public contract is:

```js
factory.metrics
factory.facets
factory.storyboards
factory.getStoryboards(filters)
factory.get(id)
factory.explain(id)
factory.snapshotStoryboard(itemOrId)
factory.restoreStoryboard(snapshot)
factory.createCampaignMetadata(selection, options)
factory.exportCampaignMetadata(campaign)
factory.createManifest(selection, options) // alias
factory.exportManifest(campaign)           // alias
```

Supported filters are `format` or `duration`, `mode`, `anchorType`, `topic`,
`character`, `category`, `maxRisk` or `risk`, `minEvidence`, `query`, and
`limit`.

## Storyboard grammar

Every format has an exact, gapless timeline:

| Format | Source beats | Editorial cards | Shape |
| ---: | ---: | ---: | --- |
| 15 seconds | 2 | 1 | Hook → turn → payoff |
| 30 seconds | 3 | 2 | Hook → build → turn → payoff → button |
| 60 seconds | 5 | 2 | Hook → setup → build → turn → escalation → payoff → button |
| 90 seconds | 7 | 2 | Hook → setup → build → escalation → breath → callback → ramp → payoff → button |

Source beats remain inside the broader Clip Lab edit window. The narrower
micro-window is still only a proposed cut and always requires a context check.
Cards are explicitly labeled editorial copy and are never represented as
archival dialogue.

The sequencing mode comes from the existing supercut anchor:

- character anchors become a **Callback Ladder**;
- topic anchors become an **Archive Timeline**;
- category anchors become a **Controlled Escalation**.

Those names describe the edit structure. They do not claim a true bit origin,
an opinion change, or an objectively escalating real-world event.

## Evidence and safety contract

Every source slot carries:

- Clip Lab receipt ID;
- source ID, title, date, and original URL;
- exact receipt timestamp and playable source link;
- proposed source in/out points;
- a public archival excerpt capped at 16 words;
- visible truncation state and the original excerpt word count;
- inherited evidence and risk labels;
- an explicit null speaker credit.

The factory never assigns Mike, J, a guest, or a character as the speaker of a
slot. Owner-mapped character metadata may explain the shared anchor, but it does
not become clip-level diarization.

Every title, card, and connective phrase is marked:

> SUGGESTED EDITORIAL COPY — NOT AN ARCHIVAL QUOTE

Generated voiceover is disabled. No media is downloaded, copied, rendered,
licensed, or published.

## Persistence

`snapshotStoryboard` stores the exact storyboard ID, format, ordered receipt
ledger, source ledger, pacing-slot signature, and factory input fingerprint.
`restoreStoryboard` verifies every field and its proof fingerprint against the
current deterministic build. It returns `null` if the archive changed, a
receipt disappeared, a slot was altered, or the saved ledger was widened.

This keeps a saved 60-second cut as that exact 60-second cut after a page
reload. It never silently substitutes a newer or broader storyboard.

## Campaign export

`createCampaignMetadata` packages up to 24 storyboards and includes:

- the exact storyboard timelines and pacing roles;
- a deduplicated source and receipt ledger;
- every proposed source boundary;
- a Creator Clip Lab manifest for the underlying receipts;
- risk, evidence, and approval gates;
- public-safe excerpts capped at 16 words in both the edit-decision list and
  the embedded Clip Lab manifest;
- an explicit `mediaIncluded: false` boundary.

The same inputs produce the same campaign ID, ordering, and JSON.

## Suggested UI binding

The minimum useful storyboard card uses `title`, `formatSeconds`, `mode`,
`anchor.label`, `editorialPriority`, `risk.label`, `evidence.label`, and
`sourceCount`. Its timeline renders `slots[]` with `role`, `kind`,
`timelineIn`, `timelineOut`, and `seconds`.

For source slots, show `sourceTitle`, `receiptTimecode`, `sourceAtReceipt`,
`proposedSourceWindow`, `archivalExcerpt`, and `excerptTruncated`. For cards,
show `copy` beside `copyLabel`. Keep `approvalGate.status`, `proofLedger`, and
`pacing` visible in the detail view.

## Current deterministic sample

The current archive fixture produces 117 storyboards: 30 at 15 seconds, 32 at
30 seconds, 30 at 60 seconds, and 25 at 90 seconds. They span 163 receipts and
67 source uploads with zero unresolved source slots.

The integration test builds `cold-open:30:a6e51363`, the highest-ranked
eligible 30-second Dr. Loomis character-anchor candidate, as a Callback Ladder:

1. a source-backed hook;
2. a second receipt as the build;
3. a labeled editorial turn card;
4. a different source-backed payoff;
5. a labeled full-context button.

The sample uses `character-receipt:loomis-interview`,
`character-receipt:loomis-dj`, and `character-receipt:loomis-sam` across three
indexed source uploads. Its aggregate evidence is High, aggregate risk is
Medium, and editorial priority is 71. It assigns no clip speaker, copies no
media, and exports through the same Clip Lab receipt contract used by the rest
of the creator workbench.

Run:

```bash
node --test tests/cold-open-engine.test.mjs
```
