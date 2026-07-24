# Creator Clip Lab

Creator Clip Lab converts the Wiki's existing source receipts into edit plans. It does not download media, guess speakers, claim virality, or turn generated copy into archival quotes.

## Integration

Load `creator-studio-engine.js` after `showcase-engine.js`, then pass the already-created showcase:

```js
const clipLab = WWAMCreatorClipLab.create({ showcase: showcaseEngine });
```

The public contract is:

```js
clipLab.metrics
clipLab.facets
clipLab.getShorts(filters)
clipLab.getSupercuts(filters)
clipLab.getResurfacing(filters)
clipLab.get(id)
clipLab.fromReceipt(receiptId)
clipLab.snapshotSelection(item)
clipLab.restoreSelection(snapshot)
clipLab.explain(id)
clipLab.createClipManifest(selection, options)
clipLab.exportManifest(manifest)
clipLab.buildCampaignPacket(options)
```

Supported candidate filters are `topic`, `character`, `category`, `length`, `sourceType`, `evidence`, `maxRisk`, `minPriority`, `query`, and `limit`. `risk` is accepted as a compatibility alias for `maxRisk`; both mean “show this risk level or safer.” `length` accepts a maximum number, `{ min, max }`, or `under 30`, `30-45`, and `45-60`. Supercut filters also accept `totalLength`.

## Evidence contract

Every clip candidate contains:

- a receipt ID, source ID, source title, exact source timestamp, and playable YouTube URL;
- the short archival caption excerpt that triggered the candidate;
- a proposed edit window explicitly labeled as an editorial suggestion;
- suggested titles, hooks, and captions explicitly labeled as non-archival copy;
- evidence confidence, contextual risk, approval status, and the factors behind the score;
- a speaker policy that refuses to name anyone from auto-captions.

The current promoted 74-source / 71-captioned corpus supplies 25
timestamp-validated human-curated character-performance candidates and 0
authenticated editor-verified decisions. Their clip speakers are not diarized.
Candidates can carry the owner-supplied Mike/J performer mapping, but that
mapping does not identify the speaker in an individual clip. A future
production `editor verified` tier would require a separate authenticated
surrounding-context decision.

## Defensible packages

Shorts candidates rank editorial usefulness, not predicted virality. The transparent formula weighs the existing receipt strength, evidence confidence, source reach, timestamp-validated curated-candidate status, and contextual risk.

Supercuts require at least three receipts across at least two sources.
Character-anchored supercuts use only timestamp-validated human-curated
performance candidates, not ordinary mentions of the character. Their
“origin” is labeled as the earliest receipt in that package, never the
first-ever bit.

Resurfacing pairs an older and newer receipt that share an indexed topic or character. The package explicitly does not claim that an opinion changed, a prediction came true, or the earlier receipt is the true origin.

Campaign packets deterministically select source-diverse Shorts, a supercut, and archive resurfacing opportunities. The embedded clip manifest acts like a portable EDL/proof ledger: it can be exported as JSON, but it contains no copied media. Public manifest excerpts are capped at 16 words and carry `excerptTruncated`, `originalExcerptWordCount`, and `publicExcerptWordLimit`; internal Clip Lab candidates retain their full bounded receipt text for editorial analysis.

`snapshotSelection` stores the exact receipt and source ledger for one campaign asset. `restoreSelection` verifies its fingerprint and reconstructs that same filtered package. It returns `null` instead of silently widening a filtered supercut when a receipt is missing or the ledger has been altered.

## Human gate

No item is auto-publishable. The final editor must watch surrounding context, set exact in/out points by ear and picture, verify any on-screen speaker credit, handle language and platform rules, and preserve the visual distinction between archival captions and promotional copy.
