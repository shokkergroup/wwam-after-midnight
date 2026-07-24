# WWAM After Midnight

An independent, source-linked living memory system for We Watched A Movie.
It turns commentary and livestream history into playable lore, changing takes,
recurring bits, character archaeology, topic paths, and creator-side editorial
opportunities.

## Audited scope — July 23, 2026

- 39 franchise commentaries: 13 Halloween, 12 Friday the 13th, 6 Scream, and
  8 A Nightmare on Elm Street
- The 10 newest official livestreams
- 25 additional official livestreams ranked by snapshot view count, with zero
  overlap against either source lane
- 74 unique source videos; 71 with available captions and 3 disclosed gaps
- 1,880,873 audited caption words across roughly 177 hours
- 872 bounded, playable evidence receipts
- 168 memory nodes and 603 source-backed edges
- 49 Take Time Machine timelines and 4 verified character-bit lineages

The Popular 25 alone contributes 927,620 audited words, 1,467,586 snapshot
views, 240 topic chapters, 168 comedy moments, and 750 heatmap chapters.

## Product surfaces

- Ask WWAM with intent parsing, follow-up memory, direct answers, supporting
  receipts, counterpoints, popularity handling, and exact source jumps
- Ask the Character for J's Dr. Loomis, J's Slenderman, Mike's Dr. Challis, and
  J's Corey Feldman: generated fan riffs are visibly labeled and paired with a
  bounded real-performance soundbyte
- Take Time Machine, verified Bit Ancestry, Riff Chemistry, WWAM Court, and
  personalized playable Descent paths
- Popular 25 dossiers, topic doors, character sightings, editorial context,
  comedy heatmaps, and source receipts
- Live Wire maps for the rolling Fresh 10
- Live Aftermath and a creator-facing Control Room
- Red Band 100, WWAM UP IN YA, tape autopsies, Unhinged Index, franchise lore
  labs, red-band/office-bleep modes, share links, and an updated Mike Mode pitch

The Marky Mark candidate remains deliberately locked: three source performances
exist, but automatic captions cannot establish which host is speaking.

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

The reusable architecture, evidence contract, channel-DNA rules, editorial
levels, anti-slop checks, and update workflow live in
[`docs/YOUTUBE_WIKI_MEMORY_OS.md`](docs/YOUTUBE_WIKI_MEMORY_OS.md).

Auto-captions can be wrong. Speaker identity is never guessed, generated parody
is never represented as an archival quote, and every public fragment links back
to the official upload for verification.
