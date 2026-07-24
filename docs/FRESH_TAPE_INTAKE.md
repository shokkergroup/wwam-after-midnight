# Fresh Tape Intake V1 contract

Fresh Tape Intake is the bounded on-ramp for testing a newly supplied YouTube
source before it enters any living-wiki ledger. It lets an operator answer
“does this tape contain reviewable material?” without pretending the source was
fetched, owned, authenticated, reviewed, or promoted.

The contract is universal. WWAM can look for horror topics and comedy signals;
a racing league can look for lead changes, booth escalation, or rollovers.
Each channel supplies its own lanes, public vocabulary, and literal rules
through a compiled ChannelPack. The safety state stays the same.

## What enters

An intake request has two explicit parts:

1. source metadata supplied by the operator; and
2. transcript content supplied by the operator.

Required source metadata is:

| Field | Boundary |
| --- | --- |
| `id` | Exact 11-character YouTube video ID |
| `url` | HTTPS YouTube watch, live, embed, Shorts, or `youtu.be` URL whose video ID matches `id` |
| `title` | Non-empty inert text, capped by the engine limit |
| `date` | Real `YYYY-MM-DD` calendar date |
| `durationSeconds` | Positive duration inside the configured hard limit |
| `lane` | An exact source-lane ID declared by the compiled ChannelPack |

URL validation proves format and video-ID agreement only. The resulting source
record always says:

```text
officialYouTubeUrlValidated: true
channelOwnershipVerified: false
authorityStatus: channel-ownership-unverified
```

The engine performs no network request and does not consult a feed, account,
browser session, YouTube API, or ownership registry. The operator remains
responsible for supplying accurate metadata and transcript content.

## Supported transcript formats

| Format | Intake result |
| --- | --- |
| WebVTT | Parsed into bounded exact-time caption events |
| SRT | Parsed into bounded exact-time caption events |
| YouTube JSON3 | Parsed into bounded exact-time caption events, with any supplied source ID cross-checked |
| Plain text | Held locally with `UNTIMED_TRANSCRIPT` and zero candidates |

Timed formats must contain usable events, and every event must remain within
the declared source duration and configured timestamp boundary. Duplicate
events are removed deterministically. The engine rejects malformed timecodes,
conflicting source IDs, unexpected fields, excessive payloads, event or word
limits, character limits, and transcript/source mismatches.

Default hard ceilings include 256 characters per word, 12,000 characters per
caption event, and 1,200 characters per public excerpt. These complement the
word-count boundaries so one giant token cannot amplify an event or bypass the
public excerpt ceiling.

Plain text is accepted only as an honest hold. Paragraph order, line numbers,
or word offsets are never converted into fake timestamps.

## How candidates are derived

The caller provides bounded topic and signal rules. Every rule has:

- a lowercase kebab-case ID;
- a short public label; and
- one or more literal phrases.

Matching uses normalized literal phrases, not a generative model or hidden
semantic guess. A timed event may produce a candidate only when it contains a
declared rule term. Candidate order is deterministic by timestamp, kind, rule,
and candidate ID.

Each candidate binds:

- channel and ChannelPack fingerprint;
- source ID, date, declared lane, duration, and canonical YouTube URL;
- exact caption-event fingerprint and indexed start/end seconds;
- rule kind, ID, label, matched literal phrases, and derivation method;
- a bounded public excerpt honoring the ChannelPack word ceiling; and
- a direct official YouTube timecode URL.

No raw transcript is stored in or recoverable from the public export. Unmatched
transcript text is not copied into the candidate ledger.

## The non-promotion firewall

Fresh Tape Intake has no review, certification, or promotion API. Every timed
candidate is emitted with these invariant values:

```text
state: quarantine
reviewStatus: unreviewed
machineSurfaced: true
promotionAllowed: false
speaker: null
speakerStatus: not-diarized
authenticatedReviewCount: 0
authenticatedCertificationCount: 0
```

Artifact metrics likewise fix authenticated human reviews, speaker
certifications, creator certifications, and canon promotions at zero.

An intake candidate does not automatically enter:

- the promoted receipt corpus;
- Ask results;
- Lore Galaxy or character lineages;
- Red Band or WWAM UP IN YA;
- Clip Lab, Time Machine, Court, or Canon; or
- any downstream league- or channel-specific product lane.

Playback can establish context, but each destination must apply its own
authorized, authenticated, policy-compliant decision. Fresh Tape Intake cannot
make that decision.

## Verifiable exports

`serialize()` emits canonical JSON only after the complete artifact passes the
same validator used by `verifyExport()`. The artifact includes:

- ChannelPack, storage namespace, source-lane, and rule bindings;
- payload and exact-event-ledger fingerprints;
- parse, deduplication, word, candidate, and hold metrics;
- bounded candidates, their derivation receipts, and a raw-text-free
  candidate-event receipt ledger;
- the explicit quarantine and authority policy; and
- an `fti1-…` fingerprint over the canonical artifact.

Verification fails if a caller changes a timestamp, source field, lane, rule,
excerpt, speaker state, authority count, candidate order, candidate-event
receipt, metric, binding, or fingerprint. Each candidate must reconcile with a
candidate-event receipt containing event/content/public-excerpt fingerprints
and the matched rule IDs; no raw event text is exported. All `ftp1`, `ftl1`,
`ftel1`, `ftx1`, `fte1`, `ftc1`, `ftr1`, and `fti1`
fingerprints are FNV-based deterministic structural change detectors only. A
successful verification means the artifact is internally consistent with this
engine instance; it does not verify the supplied source content or establish
that the source exists.

The verification result makes that limit machine-readable:

```text
scope: structural-change-detection-only
authenticityVerified: false
sourceContentVerified: false
authorityVerified: false
```

It is not a cryptographic signature and does not prove identity, source
authenticity, ownership, speaker identity, rights, human review, authority, or
creator approval.

## Browser API

Load the channel configuration, compiler, and intake engine:

```html
<script src="wwam-channel-dna.js"></script>
<script src="wwam-channel-pack-adapter.js"></script>
<script src="channel-pack-contract.js"></script>
<script src="fresh-tape-intake-engine.js"></script>
```

Create an engine with a compiled pack and channel-native rules:

```js
const channelPack = window.ShokkerChannelPack.compile(
  window.WWAM_CHANNEL_DNA,
  window.WWAM_CHANNEL_PACK_ADAPTER
);

const intake = window.ShokkerFreshTapeIntakeEngine.create({
  channelPack,
  rules: {
    topics: [
      { id: "halloween", label: "HALLOWEEN", terms: ["halloween", "michael myers"] }
    ],
    signals: [
      { id: "room-break", label: "THE ROOM BREAKS", terms: ["oh my god", "no way"] }
    ]
  }
});

const artifact = intake.intake({
  source: {
    id: "abcdefghijk",
    url: "https://www.youtube.com/watch?v=abcdefghijk",
    title: "Operator-supplied source title",
    date: "2026-07-24",
    durationSeconds: 7200,
    lane: "fresh-live"
  },
  transcript: {
    format: "webvtt",
    content: suppliedWebVtt,
    sourceId: "abcdefghijk"
  }
});

const canonicalJson = intake.serialize(artifact);
const verification = intake.verifyExport(canonicalJson);
```

Creation fails unless the compiled pack declares the
`fresh-tape-intake` capability and preserves the ChannelPack evidence
firewall.

## Portability proof

The focused suite runs the same 67,182-byte engine against:

- the real WWAM ChannelPack and horror/comedy rules; and
- a synthetic racing ChannelPack with racing-native lanes and rules.

The neutral serialization is checked for WWAM and horror-vocabulary leakage.
The suite also covers all four formats, source/URL/date/duration/lane binding,
deduplication, excerpt limits, deterministic output, defensive snapshots,
plain-text holds, capability opt-in, tamper rejection, and foreign-pack or
foreign-rule rejection.

Run the contract:

```bash
node --test tests/channel-pack-contract.test.mjs \
  tests/fresh-tape-intake-engine.test.mjs \
  tests/v56-fresh-tape-intake-contract.test.mjs
```
