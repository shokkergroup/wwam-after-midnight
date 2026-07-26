# The Midnight Cut

Release contract for **V5.19 / 0.5.19**.

## Product promise

The Midnight Cut turns three to eight timed receipts from the Evidence Bag
into one ordered, manually controlled viewing route. Every stop plays inside
the page from the official YouTube upload and preserves the canonical start
and end bounds registered by the Source Dossier.

It is a fan-made route through existing evidence, not a new transcript, a
copied compilation, or an AI-generated claim about the hosts. The cut reuses
the archive's receipts without changing them.

The feature lives inside the existing Evidence Bag and tape theater. It does
not add another homepage section or navigation destination.

## What a valid cut contains

A cut contains:

- three to eight unique, promoted, timed public receipts;
- an explicit order;
- canonical receipt keys, source bindings, and exact start/end bounds;
- an optional viewer-written title and introduction;
- a deterministic fingerprint over the evidence-bearing packet; and
- manual controls for previous, replay, next, direct-stop selection, recovery,
  and opening the official upload.

The title and introduction must be labeled:

> VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE

That label is part of the product boundary. Viewer prose cannot become a
receipt, summary, quote, relationship, entity claim, or search fact.

## Canonical compilation

Compilation is source-first and fail-closed:

1. Resolve each selected receipt against the current canonical Source Dossier
   registry.
2. Require a unique registered receipt. A legacy bag item may supply a
   source ID and start second only when those coordinates resolve to exactly
   one canonical receipt.
3. Re-read the canonical source ID, source fingerprint, start, end, evidence
   class, and public playback URL from that registry.
4. Reject unknown, duplicate, quarantined, withheld, stale-fingerprint,
   out-of-range, ambiguous, foreign-channel, or untimed selections.
5. Require three to eight surviving receipts. Do not silently pad a cut with
   nearby moments.
6. Preserve explicit human-curated end bounds. A reviewed 14-second window
   cannot expand into a generic fallback window.

A rejected selection is reported as held evidence. It cannot play or enter a
share packet merely because it was once stored in local browser state.

## Playback

Playback is a sequence of bounded official-source windows, not a stitched
media file.

- Playback starts only after a visitor presses a control.
- The feature never autoplays the next stop.
- Moving between stops requires an explicit previous, replay, next, or
  direct-stop action.
- The current stop stays visible with its order, source ID, exact bounds,
  evidence class, and recovery route.
- The in-page player uses the same first-party YouTube identity and recovery
  path as the Source Dossier.
- If in-page playback fails, the official timestamped YouTube link remains
  available.

No source audio or video is copied into the cut, share packet, or export.

## Share packet

The share form is a compact reconstruction packet, not a content export. It
may contain:

- schema/version;
- ordered canonical receipt keys;
- channel, ChannelPack, archive, and current-registry bindings;
- bounded viewer-written title and introduction;
- deterministic cut fingerprint; and
- deterministic packet fingerprint.

It must not contain transcript excerpts, captions, summaries, generated
dialogue, speakers, media, or a claim that the route was approved by WWAM.
Restore re-resolves every key against the current canonical registry and
fails closed on changed or missing evidence.

The fingerprint detects structural change. It does not authenticate the
viewer, establish authorship, prove source integrity, or confer publication
authority.

## Creator edit brief

The same ordered cut can export a JSON or Markdown production brief. The brief
contains exact source IDs, official URLs, start/end bounds, order, evidence
classes, source bindings, and the viewer-written fields under their
non-evidence label.

The brief is an edit plan. A human must review context, speaker, rights,
continuity, and editorial suitability before production. Export does not:

- download or copy media;
- approve a clip;
- clear rights;
- authenticate a creator;
- prove speaker continuity;
- prove causality, opinion change, or a bit's true origin;
- mutate Canon; or
- publish anything.

## Launch preset: The Character Ward // 2021–2026

The launch preset is an exact five-stop demonstration of ordered,
source-bounded character archaeology:

| # | Receipt key | Source | Exact window |
| ---: | --- | --- | ---: |
| 1 | `character-receipt:slender-stomach` | `Mf-0Tv_KHCE` | `541.04–555.04` |
| 2 | `character-receipt:challis-boilermaker` | `lCH31VtaSeI` | `6511.44–6525.44` |
| 3 | `character-receipt:loomis-biscuit-job` | `Qc2vVFMO4ts` | `7693.02–7707.02` |
| 4 | `character-receipt:feldman-atmosphere` | `shoWljlgSUU` | `8097.2–8111.2` |
| 5 | `character-receipt:loomis-funding` | `LV2rmwEA0w4` | `9042.64–9056.64` |

All five are human-curated character-performance candidates. Each exact
14-second bound must survive compilation, playback, sharing, restoration, and
production-brief export.

The preset is a demonstration route, not proof of character ownership,
speaker identity in an individual clip, a definitive origin sequence, or
creator approval.

## Universal Memory OS contract

The compiler is channel-neutral. Another ChannelPack can provide canonical
timed receipts and use the same ordered-cut contract without importing WWAM's
characters, comedy taxonomy, copy, or preset.

For a racing wiki, a valid preset could order a restart, lead change, booth
reaction, final-lap battle, and finish from official race broadcasts. The
engine must still re-resolve the exact canonical receipt keys, keep manual
playback, preserve bounds, and refuse any selection that the racing adapter
marks quarantined or unsupported.

The reusable value is the evidence-safe sequence:

```text
Evidence Bag
  -> canonical re-resolution
  -> ordered bounded official-source playback
  -> keys-only share reconstruction
  -> human-reviewed creator edit brief
```

Channel voice belongs in the adapter and presentation layer. Evidence
authority belongs in the canonical registry.

## Explicit authority ceiling

Every compiled cut keeps these authorities false:

- `speakerContinuity`
- `causality`
- `opinionChange`
- `trueOrigin`
- `creatorApproval`
- `rightsCleared`
- `canonMutated`
- `mediaCopied`

The Midnight Cut is valuable because it makes a fan's path replayable,
inspectable, and useful to an editor while preserving those limits.
