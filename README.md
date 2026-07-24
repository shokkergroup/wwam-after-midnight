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
- 1,880,873 audited caption words across 171.19 caption-audited hours;
  177.45 hours of known source runtime in the preserved July 23 distill
  snapshot
- 872 bounded, playable evidence receipts
- 168 core memory nodes and 603 source-backed core edges
- 177 Lore Galaxy entries, 821 graph edges, 19 constellations, and 51 indexed
  lineages
- 49 Take Time Machine timelines and 14 WWAM Court argument boards

The Popular 25 alone contributes 927,620 audited words, 1,467,586 snapshot
views, 240 topic chapters, 168 comedy moments, and 720 caption-backed heatmap
chapters. Its one uncaptioned source correctly contributes no fabricated map.

The Lore Galaxy exposes 953 labeled graph receipt links. That broader count
includes source entry points and context records; the 872 count is the
editorial-moment inventory.

## V5 product map

The hero offers three deliberate entry points:

- **Fan Experience:** the daily Night Shift return ritual, source-grounded Tape
  Trivia, the Evidence Bag, Red Band Roulette, WWAM UP IN YA, and playable
  descent paths.
- **Deep Dive:** Ask WWAM, Lore Galaxy, Take Time Machine, Bit Ancestry, Riff
  Chemistry, WWAM Court, franchise labs, autopsies, Fresh 10, and Popular 25.
- **Creator Proof:** Clip Lab edit briefs, exact-runtime Cold Open Factory
  boards, supercut spines, then/now resurfacing, Live Aftermath, Control Room,
  the Trust / Canon Desk, a 457-finding local Human Review Session, and four
  evidence-backed Creator Pilot briefs.

Mike Mode is a five-beat private-screening walkthrough. Each beat exits the
pitch and opens working proof: Night Shift, Ask WWAM, a Loomis constellation, a
Loomis edit queue, or the strict canon gate.

Night Shift produces a deterministic three- to five-beat daily journey whose
five required roles are the newest indexed source, an older archive callback,
a playable receipt, a grounded Trivia/preference interaction, and a closing
payoff. Its share seed includes the archive fingerprint, its saved progress is
ordered and canonical-response-checked on restore, and its visible snapshot
notice says when newer uploads may be missing.

The current creator inventory contains 560 timestamped Short candidates across
71 sources, 32 multi-source supercut bundles, 21 then/now resurfacing
opportunities, and 117 exact-runtime cold-open storyboards spanning 163
receipts and 67 sources. These are reviewable edit plans, not predictions of
virality or auto-published media. Filtered campaign assets persist an exact
fingerprinted receipt/source ledger so a saved three-receipt package cannot
silently reload as its broader parent bundle.

Ask the Character supports the owner-supplied recurring mappings for J's Dr.
Loomis, J's Slenderman, Mike's Dr. Challis, and J's Corey Feldman. Generated
fan riffs are visibly labeled and kept separate from short, playable
performance receipts. Those mappings identify the recurring character
performer generally; the individual auto-caption clips are not
speaker-diarized.

Ask WWAM now indexes those curated performance receipts as their own evidence
lane. Questions about a character's latest, earliest, funniest, or specific
recurring bit can return the relevant source second, while performer mapping,
individual clip attribution, and true origin remain three separate claims.

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
  0 structurally invalid or source-ID-mismatched URLs, 0 invalid indexed
  timestamps, and 95 human review candidates.
- Public transcript fragments are display-capped; exported edit suggestions
  remain clearly separated from archival excerpts.
- The local Human Review Session binds 95 Trust findings and 362 Canon warnings
  to the exact current corpus. Its workflow records caller-attested routing
  decisions but does not authenticate reviewer identity and cannot certify a
  speaker, creator, or canon claim.
- Creator Pilot Builder exports four deterministic draft proposals with real
  current counts and receipts. Business outcomes remain `MEASURE DURING PILOT`.

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

The current snapshot contains 847 machine-level receipts and 25 human-curated
character-performance candidates, but 0 authenticated editor-verified
decisions and 0 creator-certified receipts. The candidate records preserve
source/time provenance; they do not prove reviewer identity, surrounding-context
review, or clip-level speaker identity. The Trust Desk's “0 out-of-range
indexed timestamps” result validates each time against the known source
duration; it does not establish continuous network availability or the
semantic truth of a derived claim.

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
- [Cold Open Factory contract](docs/COLD_OPEN_FACTORY.md)
- [Tape Trivia engine contract](docs/TAPE_TRIVIA_ENGINE.md)
- [Night Shift engine contract](docs/NIGHT_SHIFT_ENGINE.md)
- [Human Review Session contract](docs/HUMAN_REVIEW_SESSION.md)
- [Creator Pilot Builder contract](docs/CREATOR_PILOT_BUILDER.md)
