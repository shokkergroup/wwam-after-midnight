# V5.15 Release Contract — Play the Answer

Status: implemented in release `0.5.15`.

## Product promise

Ask already returns a conclusion, an ordered evidence chain, and the limitations
that keep the conclusion inside the indexed archive. **Play the Answer** turns
that existing chain into one on-page watch path:

```text
question
  → current deterministic Ask answer
  → exact ordered evidence-chain roles
  → official YouTube source at each indexed second
  → next receipt or original upload
```

It does not generate a recap video, narration, transition, host voice, verdict,
or new interpretation. The official WWAM uploads remain the media source.

## Eligibility

A trail exists only when the current Ask analysis supplies between two and six
unique, timed, playable evidence-chain entries.

Every stop must:

- retain its exact `analysis.evidenceChain` order and role;
- resolve to a registered official source;
- have a finite, in-range source coordinate;
- retain its evidence tier and warning set;
- be a moment-level or other explicitly timed receipt;
- remain free of a speaker claim.

Source metadata, source-level derived summaries, global-ranking handoffs,
longitudinal handoffs, adjudication handoffs, empty answers, one-receipt
answers, and unknown sources do not become trails.

Popularity, heat, profanity, and UI order cannot rerank the chain. Play the
Answer follows the answer contract; it does not run a second retrieval.

## Playback contract

Opening the theater is an explicit user gesture. Each stop uses the shared
YouTube playback helper, stays on the page, and starts at the indexed whole
second. The bounded playback window is a navigation aid around that coordinate,
not an editorial claim that a complete joke, take, setup, or payoff begins and
ends there.

The viewer controls Previous, Replay, Next, player recovery, the official-source
link, share, and close. Advancement remains manual in V1. Closing the theater
removes the player so playback cannot continue invisibly.

`RECOVER PLAYER` reloads the same official source and exact bounds through the
first-party hosted bridge. It does not swap videos or widen the evidence scope.
The official timestamp link remains available for restrictions unrelated to
player identity, including removed, private, age-gated, regional, or
embed-disabled uploads.

## Evidence boundary

The theater may display the already-public Ask answer, role, source title,
short public excerpt, evidence tier, and warnings. None of that copy enters the
share packet.

Every compiled trail fixes these authority fields:

| Field | V1 value |
| --- | --- |
| speaker | `null` |
| speaker continuity | `false` |
| opinion change established | `false` |
| causality established | `false` |
| true origin established | `false` |
| rights cleared | `false` |
| creator approved | `false` |
| canon mutated | `false` |
| copied media | `false` |

Playing two statements consecutively does not prove that the same person made
both, that anyone changed their mind, or that one event caused another. Ask's
limitations remain visible throughout the trail.

## Share and restore

A share packet contains only:

- schema and version;
- exact channel and archive bindings;
- the question;
- ordered chain roles;
- receipt keys;
- source IDs;
- whole-second starts and bounded ends;
- a deterministic fingerprint.

It contains no excerpt, transcript, caption event, generated answer, speaker,
thumbnail, copied audio, or copied video.

Restore first rebuilds the answer from the current archive. The packet opens
only if the newly compiled trail byte-matches the shared ordered chain and
bindings. A changed query result, reordered stop, changed coordinate, foreign
ChannelPack, stale archive snapshot, extra field, malformed value, or changed
fingerprint fails closed with a visible stale-trail state. Restore never uses
the packet as replacement evidence.

## Universal core

The core engine knows nothing about horror, WWAM characters, or WWAM comedy
labels. A channel supplies:

- one current structured answer;
- a canonical source registry;
- exact archive and ChannelPack bindings;
- channel-native UI copy.

A racing wiki can therefore play an ordered chain of race receipts—lead change,
booth escalation, late restart, finish—without importing WWAM vocabulary or
claiming a driver identity from undiarized audio.

## Release proof

The launch contract includes these exact current Ask chains:

1. `How did their opinion on Halloween change?`
   - `EARLIEST INDEXED RECEIPT` — `6VXSBDZ-3WE @ 1597`
   - `LATEST INDEXED RECEIPT` — `I6QKteG_hK0 @ 5993`
   - the visible boundary still says the receipts cannot prove a host changed
     their mind.
2. `What do they hate about the Elm Street remake?`
   - `PRIMARY RECEIPT` — `qTQdWKcwn4A @ 1132`
   - `SUPPORTING RECEIPT` — `qTQdWKcwn4A @ 2101`
   - the visible boundary still limits the answer to target-proximate
     evaluative moments.

The feature is complete only when both trails play on-page in the declared
order, ineligible answers cannot manufacture a trail, hostile share packets
fail closed, the same core passes a neutral racing fixture, and desktop,
keyboard, reduced-motion, and 390-pixel layouts remain usable.
