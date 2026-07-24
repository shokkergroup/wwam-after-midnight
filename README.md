# WWAM After Midnight

An independent, source-linked living memory system for We Watched A Movie. It
turns commentary and livestream history into playable lore, fan games, recurring
character archaeology, topic paths, and creator-side editorial opportunities.

This is an unofficial fan prototype. It sends playback and source traffic back
to the official WWAM uploads.

## Audited scope — July 23, 2026

- 39 franchise commentaries: 13 Halloween, 12 Friday the 13th, 6 Scream, and
  8 A Nightmare on Elm Street
- The 10 newest official livestreams
- 25 additional official livestreams ranked by snapshot view count, with zero
  overlap against either source lane
- 74 unique source videos; 71 with available captions and 3 disclosed gaps
- 1,880,873 audited caption words across roughly 177 hours
- 872 bounded, playable evidence receipts
- 168 core memory nodes and 603 source-backed core edges
- 177 Lore Galaxy entries, 820 graph edges, 19 constellations, and 51 indexed
  lineages
- 49 Take Time Machine timelines and 14 WWAM Court argument boards

The Popular 25 alone contributes 927,620 audited words, 1,467,586 snapshot
views, 240 topic chapters, 168 comedy moments, and 750 heatmap chapters.

The Lore Galaxy exposes 953 labeled graph receipt links. That broader count
includes source entry points and context records; the 872 count is the
editorial-moment inventory.

## V5 product map

The hero offers three deliberate entry points:

- **Fan Experience:** source-grounded Tape Trivia, the Evidence Bag, Red Band
  Roulette, WWAM UP IN YA, and playable descent paths.
- **Deep Dive:** Ask WWAM, Lore Galaxy, Take Time Machine, Bit Ancestry, Riff
  Chemistry, WWAM Court, franchise labs, autopsies, Fresh 10, and Popular 25.
- **Creator Proof:** Clip Lab edit briefs, supercut spines, then/now
  resurfacing, Live Aftermath, Control Room, and the Trust / Canon Desk.

Mike Mode is a five-beat private-screening walkthrough. Each beat exits the
pitch and opens working proof: Trivia, Ask WWAM, a Loomis constellation, a
Loomis edit queue, or the strict canon gate.

The current creator inventory contains 560 timestamped Short candidates across
71 sources, 32 multi-source supercut bundles, and 21 then/now resurfacing
opportunities. These are reviewable edit plans, not predictions of virality or
auto-published media. Filtered campaign assets persist an exact fingerprinted
receipt/source ledger so a saved three-receipt package cannot silently reload
as its broader parent bundle.

Ask the Character supports the owner-supplied recurring mappings for J's Dr.
Loomis, J's Slenderman, Mike's Dr. Challis, and J's Corey Feldman. Generated
fan riffs are visibly labeled and kept separate from short, playable
performance receipts. Those mappings identify the recurring character
performer generally; the individual auto-caption clips are not
speaker-diarized.

The Marky Mark candidate remains deliberately locked: three timestamped
character-performance candidates exist, but automatic captions cannot
establish which host is speaking.

## Trust contract

- Every item presented as a moment resolves to an official source and exact
  indexed timestamp.
- Auto-captions can be wrong; the interface does not guess individual speakers.
- Generated parody is never represented as an archival quote.
- Opinion timelines and Court cases remain discovery tools until a human
  certifies the underlying claim.
- The current Trust Desk reports 71 healthy sources, 3 disclosed caption gaps,
  0 broken source links, 0 invalid timestamps, and 95 human review candidates.
- Public transcript fragments are display-capped; exported edit suggestions
  remain clearly separated from archival excerpts.

### Evidence vocabulary

- **Source metadata** is the upload identity, title, date, duration, observed
  views, and caption availability. It is not a quote.
- **Source-level derived summary** is a deterministic whole-source synopsis or
  editorial description. Its source entry point does not imply anyone spoke
  that summary there.
- **Machine-surfaced timestamped receipt** has a resolvable source/time pair and
  bounded auto-caption fragment. Speaker, target, intent, category, and exact
  wording may still require human review.
- **Editor verified** means a human checked the source, timestamp, and immediate
  context. It still does not prove an undiarized speaker.
- **Owner-mapped character** describes the recurring performer relationship.
  **Clip-level speaker attribution** requires diarization or specific creator
  certification.

The current Trust Desk counts 847 machine-level receipts, 25 editor-level
receipts, and 0 creator-certified receipts. Its “0 invalid timestamps” result
validates source/time resolution, not the semantic truth of every derived
claim.

## Local development

```bash
npm install
npm run dev
npm test
npm run lint
```

The application redirects `/` to the standalone static experience at
`/demo/index.html`.

## Rebuilding and checking the distill

The pipelines require Python and `yt-dlp`:

```bash
python pipeline/wwam_deep_distill.py --workers 4
python pipeline/wwam_livestream_distill.py --workers 4
python pipeline/wwam_popular_live_distill.py --check
python pipeline/wwam_character_distill.py --check
```

Full caption payloads stay in the gitignored `source-cache/` directory. Public
artifacts contain derived measurements and short, timestamped fragments only.

## Documentation

- [V5 product overview](docs/V5_OVERVIEW.md)
- [Creator demo runbook](docs/CREATOR_DEMO_RUNBOOK.md)
- [Product changelog](docs/CHANGELOG.md)
- [Reusable YouTube Wiki Memory OS](docs/YOUTUBE_WIKI_MEMORY_OS.md)
- [Creator Clip Lab contract](docs/CREATOR_CLIP_LAB.md)
- [Tape Trivia engine contract](docs/TAPE_TRIVIA_ENGINE.md)
