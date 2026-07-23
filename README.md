# WWAM After Midnight

An independent, source-linked product prototype for the We Watched A Movie
watchalong archive and current livestream feed.

## Current bounded canon

- 13 Halloween commentaries
- 12 Friday the 13th commentaries
- 6 Scream commentaries
- 8 A Nightmare on Elm Street commentaries

The July 2026 deep distill processes every available English YouTube caption
track in that 39-tape scope, plus the ten newest official livestreams through
July 23, 2026. One age-gated commentary and one uncaptioned livestream remain
cataloged but are deliberately not machine-scored.

Current audited proof:

- 49 source videos
- 953,253 caption words
- 99 hours
- 100 ranked commentary moments
- 63 current-stream comedy signals
- 25 tracked livestream topics

## Product surfaces

- Red Band 100 with playable source receipts
- WWAM UP IN YA, a 25-hit human-curated soundbyte wall
- Per-tape autopsies, Unhinged Index, signal profile, and heat arc
- Live Wire maps for ten current streams with 30-chapter comedy heatmaps
- Exact jumps into current topics such as Batman, Halloween, trailers, and box office
- Intent-aware Ask across commentary and livestream evidence
- Franchise-specific lore labs
- Red-band and office-bleep display modes
- Shareable tape and timestamp links
- Five-act Mike Mode sales tour

## Local development

```bash
npm install
npm run dev
npm test
```

The application redirects `/` to the standalone static experience under
`/demo/index.html`.

## Rebuilding the distill

The pipeline requires Python and `yt-dlp`:

```bash
python pipeline/wwam_deep_distill.py --workers 4
python pipeline/wwam_livestream_distill.py --workers 4
```

Full caption payloads are kept in the gitignored `source-cache/` directory.
Public output contains only derived measurements and short, timestamped
fragments in:

- `public/demo/catalog.js`
- `public/demo/deep-distill.js`
- `public/demo/livestream-distill.js`
- `public/demo/curation.js`

Auto-captions can be wrong, so speaker identity is never guessed and every
public fragment links back to the original upload for verification.
