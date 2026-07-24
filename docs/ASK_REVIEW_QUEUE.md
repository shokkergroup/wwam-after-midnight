# Ask Review Queue V1

Ask Review Queue turns a questionable rendered Ask the Tape answer into a small,
portable human-review proposal. It closes the feedback gap without claiming
that a fan click rewrote search, changed Canon, or certified a speaker.

## What a reviewer can record

- the exact submitted query;
- the bounded public answer summary that was rendered, capped at 500
  characters and kept separate from source excerpts;
- whether the answer was helpful, used the wrong source or second, gave the
  wrong answer, missed a receipt, implied an unsupported speaker, used
  misleading wording, or needs another kind of review;
- the source IDs and whole-second coordinates rendered by Ask;
- an optional exact replacement source ID and second;
- an optional expected answer and editor note.

The source, second, and expected answer are proposals. Their
`verificationStatus` remains `unverified user proposal` until a human checks
the original upload.

## Evidence boundary

The browser collector reads only the public answer already rendered in the
page. It records the bounded derived answer summary, not a result-card excerpt.
It does not accept a transcript, hidden caption payload, guessed speaker, or
excerpt copy. A packet can therefore identify the disputed wording and its
displayed receipts without becoming a second transcript store.

Every packet declares:

- `corpusMutation: NONE`;
- `canonMutation: NONE`;
- `askMutation: NONE`;
- `certificationEffect: NONE`;
- `reviewerRequired: true`.

This is intentionally separate from Correction Ripple. The current Ripple
registry does not claim Ask dependencies, so an Ask review packet cannot claim
that a correction will affect any registered downstream surface.

## Device-local workflow

1. Run a query in Ask the Tape.
2. Mark the answer helpful or open **Flag This Answer**.
3. Choose the failure type and optionally name a better source, second, or
   expected answer.
4. Hold the packet in the device-local queue. If browser storage is blocked,
   the interface says that the packet is in memory only and prompts an immediate
   download instead of claiming it was persisted.
5. Download the queue and hand it to an authorized human editor or creator for
   playback review.

Nothing is uploaded automatically. Clearing the queue removes only this
browser's local copy; a blocked-storage failure is reported rather than
presented as a successful persistent clear.

## Determinism and tamper detection

Packets use schema `shokker-youtube-wiki/ask-review/v1`. Queues use
`shokker-youtube-wiki/ask-review-queue/v1`.

The packet ID is derived from a stable FNV-1a fingerprint of the bounded
proposal. Identical observations deduplicate locally. Changing a query,
receipt, proposed correction, policy, workflow state, or observation time
invalidates the fingerprint. FNV is used for deterministic change detection,
not authentication.

## Why this matters commercially

A generated site can look clever once. A living wiki becomes defensible when
every miss can become structured evaluation material, every proposal stays
attached to exact source coordinates, and nothing quietly graduates into fact.
The same packet and review policy can travel to another channel through its
ChannelPack while its issue labels and editorial voice remain channel-native.
