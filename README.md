# WWAM After Midnight

An independent, source-linked product prototype for the We Watched A Movie
watchalong archive.

## Current bounded canon

- 13 Halloween commentaries
- 12 Friday the 13th commentaries
- 6 Scream commentaries
- 8 A Nightmare on Elm Street commentaries

The July 2026 deep distill processes every available English YouTube caption
track in that 39-tape scope. One age-gated upload remains cataloged but is
deliberately not scored.

## Product surfaces

- Red Band 100 with playable source receipts
- Per-tape autopsies, Unhinged Index, signal profile, and heat arc
- Source-ranked Ask the Commentary search
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
```

Full caption payloads are kept in the gitignored `source-cache/` directory.
Public output contains only derived measurements and short, timestamped
fragments in:

- `public/demo/catalog.js`
- `public/demo/deep-distill.js`

Auto-captions can be wrong, so speaker identity is never guessed and every
public fragment links back to the original upload for verification.
