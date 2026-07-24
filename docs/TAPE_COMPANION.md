# Tape Companion V1 — The Tape Knows

## Product promise

**Press play. The archive wakes up at the right second.**

Tape Companion turns an official YouTube upload into a synchronized second
screen. It does not copy, extract, or replace the video. The official WWAM
player remains the source of truth while a separate memory rail reacts to the
current playback second.

## Current deterministic V1 derivation

Against the promoted 74-source Showcase corpus, the deterministic engine
compiles:

- 71 companion-ready sources;
- 3 visibly limited, source-only records;
- 872 exact receipt members;
- 869 conservative derived incidents containing those exact members, including
  3 fused incidents;
- 1,294 derived heat windows;
- 96 attached Red Band machine-rank annotations;
- 25 WWAM UP IN YA editorial-selection annotations;
- 25 recurring-character annotations; and
- 2,967 receipt-backed Lore connections.

Those figures do not include the ten-source Archive Deep quarantine. The
release suite directly pins the corpus/readiness, exact-member, heat-window,
and annotation totals. The incident-fusion and Lore-link totals are current
deterministic outputs and must be regenerated when the snapshot changes.

## The July 23 showcase

The July 23, 2026 livestream is the launch demonstration:

- 21 exact receipt members;
- 30 heat windows;
- 8 topic signals;
- 7 attached Red Band candidates; and
- 6 recurring-character annotations.

At `2:30:42.64`, the memory rail reaches the curated Dr. Loomis funding
receipt. That receipt carries Red Band candidate rank 44 and the owner-supplied
recurring-character mapping. A separate `FULL SEND` receipt arrives at
`2:30:46`.

The engine may group the compatible events into one incident, but it preserves
both exact members and both timestamps. In the playback UI's snapshot-safe
view at `2:30:43`, the later `FULL SEND` label, excerpt, and annotations remain
sealed. They appear only after playback crosses `2:30:46`.

## Fan workflow

1. Choose any promoted source or load the newest indexed livestream.
2. Play the official YouTube embed. Autoplay remains off.
3. The playback UI asks the snapshot-safe and crossed-event APIs for the current
   derived heat window and exact events already crossed.
4. The next marker exposes a countdown and timestamp, never future event text.
5. Open any crossed receipt on the official upload.
6. Copy a companion link bound to the source, second, channel, core archive
   ledger, and core source ledger.
7. Resume the last local companion state if those core bindings still verify.

If the YouTube player API is blocked, the official timestamp link and manual
sync rail remain available.

## Evidence contract

- Public archival excerpts are capped at 16 words before event fusion.
- Heat is labeled a deterministic derived model, not audience sentiment.
- Topic labels are timestamped signals, not claims of continuous chapters.
- Red Band means machine-ranked candidate, not funniest or creator-approved.
- UP IN YA means editorial collection membership, not a machine rank.
- An owner-mapped recurring character does not identify the speaker in the
  individual clip.
- Lore appears only when a matched Lore entry explicitly contains the
  supporting receipt ID.
- “Earliest indexed” never becomes a true-origin claim.
- The UI never reads a full compiled future timeline during playback; it uses
  snapshot-safe and crossed-event APIs.
- No synthetic character dialogue appears during source playback.
- No media, audio, captions, or transcript payload is copied into a share.

## Playback and seek behavior

`crossedEvents(sourceId, previous, current)` distinguishes normal forward
ticks from seeks:

- a small positive step returns only events whose exact markers were crossed;
- a reverse, stationary step, or large jump returns a replacement snapshot and
  fires no skipped-event parade.

This avoids a skipped-event notification parade when someone drags the player
forward. The replacement snapshot still shows history appropriate to the
target second.

## Share-state contract

`serializeShareState` produces a compact state containing:

- channel ID and channel fingerprint;
- archive fingerprint;
- source ID and source fingerprint; and
- exact playback second.

`restoreShareState` rejects malformed or tampered payloads, foreign channels,
stale archive or source fingerprints, unknown sources, and out-of-range
seconds. The checksum is a deterministic consistency check, not a signature.
The fingerprints bind the core archive/source ledger, not optional display
labels, excerpts, or annotations; those decorations may change without
invalidating a core share token.

## Universal portability

The engine consumes adapter labels and generic source, receipt, heat, entity,
and relationship records. A test-only neutral racing adapter/input fixture
compiles through the same generic engine and passes a vocabulary-leakage check;
it is not a full ChannelPack conformance or restore/tamper test matrix. A
production racing adapter could map lead changes, cautions, driver dossiers,
booth intensity, and historic connections while the official race broadcast
plays.

The synchronized evidence contract travels. The WWAM voice and taxonomy stay
channel-specific.
