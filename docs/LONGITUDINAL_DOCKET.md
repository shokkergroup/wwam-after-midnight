# The Tape Keeps Score — Longitudinal Docket V1

## What it is

V5.13 adds a demand-loaded before/after review surface to the WWAM Memory OS.
It joins one earlier forecast-shaped caption receipt to one later
response-shaped caption receipt under the only machine relationship the engine
may publish: `MAY_RESOLVE`.

The feature does **not** decide that a prediction came true, that a take aged
well or badly, that the same person spoke in both sources, that anyone changed
their mind, or that one event caused another. Every launch case remains
`machine-paired-unreviewed`, keeps `verdict: null`, and forbids promotion.
The interface states that boundary in its center column:

> MACHINE PAIR SIGNAL // NOT A VERDICT  
> THE TAPE PLEADS THE FIFTH.

An authenticated, authorized human-review workflow would still be required
before a production product could publish a verdict. V5.13 contains no
adjudication workflow and publishes **zero public verdicts**. V5.14 adds a
separate caller-attested, device-local review overlay; it does not alter that
public or machine-ledger count.

## Frozen V5.13 launch ledger

The July 23, 2026 snapshot contains **4 typed dockets, 8 distinct official
sources, 8 browsable subjects, and 9 short timestamped receipts**. The ninth
receipt is the countervailing Halloween Ends response fragment; it is retained
so the mixed case cannot become a one-sided highlight.

| Docket | Before tape | After tape | Machine pair signal |
| --- | --- | --- | --- |
| Halloween // BEFORE TAPE → AFTER TAPE | [Halloween spoiler Q&A — 2018-10-21 @ 1:42:11](https://www.youtube.com/watch?v=ZMaNz5FTCwY&t=6131s) | [Halloween Kills commentary — 2021-10-30 @ 1:41:50](https://www.youtube.com/watch?v=5HfhwoDSQ0E&t=6110s) | `OPEN` |
| Scream VI // BEFORE TAPE → AFTER TAPE | [Most Anticipated Movies of 2023 — 2022-12-29 @ 3:16:49](https://www.youtube.com/watch?v=O5vtdQnH7uc&t=11809s) | [Scream VI commentary — 2023-04-25 @ 1:57:47](https://www.youtube.com/watch?v=ISDlaQ9DWSM&t=7067s) | `MAY_SUPPORT` |
| Halloween Ends // BEFORE TAPE → AFTER TAPE | [Halloween Ends Q&A — 2022-07-28 @ 2:21:47](https://www.youtube.com/watch?v=ETuRUYiQEBM&t=8507s) | [Halloween Ends commentary — 2022-10-18 @ 1:53:37](https://www.youtube.com/watch?v=I6QKteG_hK0&t=6817s) plus [the retained positive counterweight @ 1:53:43](https://www.youtube.com/watch?v=I6QKteG_hK0&t=6823s) | `MAY_BE_MIXED` |
| Scream 7 // BEFORE TAPE → AFTER TAPE | [June 25, 2026 live @ 2:00:54](https://www.youtube.com/watch?v=7PzSj-oIRjA&t=7254s) | [July 23, 2026 live @ 1:03:31](https://www.youtube.com/watch?v=LV2rmwEA0w4&t=3811s) | `OPEN` |

The machine signals are retrieval labels, not findings:

- `MAY_SUPPORT` means the bounded later receipt has support-shaped language.
- `MAY_BE_MIXED` means the response side contains materially different local
  receipts that must remain together.
- `OPEN` means the checked snapshot does not support a narrower signal.

All four remain subordinate to `MAY_RESOLVE`. The final signal distribution is
**1 `MAY_SUPPORT`, 1 `MAY_BE_MIXED`, and 2 `OPEN`**.

The hardened Karen-related legacy docket illustrates why that distinction
matters. Its deterministic public title is now **Halloween // BEFORE TAPE →
AFTER TAPE**, its subjects are only Halloween plus the grounded anger/death
topic, and its signal is `OPEN`. The engine does not infer a Karen subject,
target continuity, or causality from two loosely related fragments.

The Halloween Ends before tape also comes from the caption-safe July 28 Q&A
rather than trailer-reaction source audio. The pair spans 82 days. The closing
commentary receipt says the film failed what it promised, while the immediately
adjacent counterweight says it still worked as a standalone movie. Both local
judgments stay visible together, but they do not prove a whole-work opinion or
a mind change.

The Scream 7 after tape is the exact July 23, 2026 livestream receipt at
`LV2rmwEA0w4&t=3811s`: “we're also doing Scream 7 on the 31st.” It is 28 days
after the June 25 plan. The docket stays `OPEN` because a scheduled July 31
commentary is not proof that the commentary was delivered.

## What a visitor can do

### Browse by subject

The subject filter uses exact IDs supplied by the verified engine. It can scope
the four-case list to Halloween, Scream, Halloween Ends, Scream VI, Scream 7,
anticipation/reception, commentary planning, or the grounded anger/death topic.
An unknown subject ID fails closed; the interface does not substitute a
similar-looking docket.

### Ask the Tape, then open the docket

Ask recognizes prediction/outcome requests and returns a typed
`longitudinal-handoff` rather than an improvised answer. When the requested
subject exactly matches this ledger, the handoff opens The Tape Keeps Score on
that subject. Unsupported entities open the global four-case view without
inventing a subject match.

Plot questions, title mentions, fan theories, future speculation, and casual
uses of words such as “prediction” do not automatically trigger the handoff.
Speaker, source-audio, and visual-outcome firewalls outrank it.

### Inspect the pairing receipt

Each docket shows:

- the before and after source titles, dates, bounded excerpts, cue terms, and
  exact official YouTube coordinates;
- source lane, rights mode, evidence access, and unverified visual status;
- the complete pairing basis and chronology;
- every reason the case remains unresolved; and
- the additional response receipt when a case contains a counterweight.

Playback always opens the official WWAM upload in a new tab. The feature has no
embedded player and never autoplays.

### Build a 30-, 60-, or 90-second edit brief

The edit-brief engine accepts exactly 30, 60, or 90 seconds. It divides that
budget across every receipt in the selected docket and returns source dates,
anchors, suggested source windows, bounded excerpts, and rights labels. The
mixed Halloween Ends case therefore produces three edit entries instead of
silently dropping its counterweight.

An edit brief is an editorial worksheet, not edited media, rights clearance,
or a verdict. It contains source links only and keeps `autoplay: false`,
`verdict: null`, and `relationship: MAY_RESOLVE`.

### Download one review packet

The download control re-inspects, re-verifies, and serializes only the selected
docket. It does not export the full caption payload or silently release all
four cases. The packet remains bound to its ChannelPack and deterministic
fingerprint.

## Evidence, rights, and authority boundaries

| Layer | What V5.13 may publish | What it may not claim |
| --- | --- | --- |
| Source | Official ID, title, date, lane, duration, rights label, and canonical URL | Ownership, rights clearance, current availability, or source-audio identity |
| Caption receipt | A normalized automatic-caption fragment of at most 16 words, its bounded window, cue terms, and exact whole-second source link | A perfect transcript, a speaker identity, or words outside the checked window |
| Subject binding | A registered ChannelPack subject explicitly grounded in the source title or bounded excerpt | A topic added through a free-form nearby cue merely because both sides were edited to share an ID |
| Pair | Chronology, shared grounded subjects, pairing basis, blockers, and `MAY_RESOLVE` | Causality, speaker continuity, mind change, correctness, or adjudication |
| Machine signal | `MAY_SUPPORT`, `MAY_BE_MIXED`, or `OPEN` | “Confirmed,” “debunked,” “called it,” or any equivalent verdict |
| Edit brief | Source-linked 30/60/90-second window suggestions | Copied media, autoplay, publication permission, or a completed edit |

Every source and candidate keeps:

- `speaker: null` and no speaker diarization;
- `originStatus: not-inferred`;
- `visualContextVerified: false`;
- `promotionAllowed: false`;
- short automatic-caption evidence rather than full captions; and
- official-source linking rather than copied audio or video.

Automatic captions can mishear people. The structural checks prove that the
published fragment is bounded to the checked local caption cache; they do not
authenticate a speaker, establish visual context, or turn the caption into an
official transcript.

The engine rejects verdict language hidden in titles, labels, provenance,
pairing bases, or blockers; duplicate claim/response pairs; non-numeric
coordinates; ungrounded cue terms; unrelated or unregistered subject injection;
free-form window-cue bindings; invented source lanes and subject types;
restricted source-audio shortcuts; missing speaker-continuity blockers;
oversized collections; receipt multiplication; caption-set drift; forged
ChannelPacks; and recursive prototype-sensitive keys. Titles are derived from
the primary registered non-topic subject plus ChannelPack-owned forecast and
response labels, rather than trusted as free-form evidence. Exact public
coordinates must land within three seconds of the bounded excerpt start.

## Deterministic release bindings

| Binding | Current V5.14-bound value |
| --- | --- |
| ChannelPack | `cp1-dd23bc386008689b` |
| Public artifact | `fnv1a32:59b085f6` |
| Registered caption set | `sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc` |
| Public artifact size | 17,626 bytes |
| Generated / source snapshot | 2026-07-24 / 2026-07-23 |

The receipts, case count, caption set, generated date, and source snapshot are
unchanged from V5.13. The ChannelPack and public-artifact fingerprints changed
in V5.14 because the pack now binds an adjudication vocabulary and
`human-adjudication-ledger` capability. The historical V5.13 values remain
recorded in the changelog.

The FNV value is a deterministic structural change detector, not a signature.
The caption-set SHA binds the registered local caption inputs; it does not
prove authorship, speaker identity, or truth. Runtime packet fingerprints
likewise detect mutation after inspection and do not authenticate an operator.

## Universal ChannelPack capability

The longitudinal engine is channel-neutral. A ChannelPack must pass the shared
validator, match the artifact identity and fingerprint, declare the
`longitudinal-claim-ledger` capability, and carry the required quarantine and
evidence policies. A forged object cannot replace a missing ChannelPack
validator.

WWAM supplies the launch subjects, source lanes, evidence, labels, and comedy
voice. The compiled pack carries the exact entity registry, five-label
longitudinal vocabulary, and three-code adjudication vocabulary that the
engines will accept; artifact strings cannot silently redefine any of them.
The same engines are tested against a neutral racing ChannelPack without WWAM
identity leakage. Another YouTube Wiki can therefore use the same
before/after and local-review contracts while supplying its own ontology and
presentation.

## Demand-loaded presentation

The feature is attached to the existing Memory OS rather than added to the
eager homepage path. Its data, engine, UI, adapter, and stylesheet are declared
as lazy assets and total **160,449 source bytes**. They load when the Memory OS
feature boundary is reached. The UI adds no fetch, XHR, WebSocket, beacon,
iframe, video element, or autoplay path.

The controller supports an exact initial Ask subject, programmatic subject
changes, keyboard docket navigation, focus preservation, responsive layouts,
reduced-motion behavior, and teardown without stealing focus when another
Memory tab takes over.

## Rebuild and verification

The offline generator reads checked public source metadata plus existing local
YouTube JSON3 automatic-caption caches. It performs no network refresh and
keeps the full caption/event payloads out of the public artifact.

```bash
python pipeline/wwam_longitudinal_docket.py --check
node --test tests/longitudinal-docket-engine.test.mjs
node --test tests/longitudinal-docket-adversarial.test.mjs
node --test tests/longitudinal-docket-ui.test.mjs
```

The generator check must reproduce **4 cases, 8 sources, 17,626 public bytes,
and `fnv1a32:59b085f6`** byte for byte.

## V5.14 local adjudication bridge

The Verdict Room re-resolves one canonical inspection packet from this engine
and binds it to the current ChannelPack, caption set, public artifact, receipt
set, and exact wording. It requires twelve explicit caller-attested human
checks before one local `SUPPORTED`, `CONTRADICTED`, or `MIXED` overlay may
render. Revocation appends history and suppresses that local result. It never
changes this docket's `verdict: null`, promotes a receipt, or publishes to a
shared service. See [The Verdict Room](VERDICT_ROOM_DESIGN.md).

## What remains production work

An authenticated review system could eventually verify reviewer identity,
record independently checked speaker identity, clear source-audio or whole-work
visual context, establish rights, and publish an authorized decision. Those are
future authority-bearing records, not properties that can be inferred from the
current pair signal or the device-local Verdict Room.

The product keeps the joke in the presentation and the restraint in the data:
the tape can open a case; only an explicitly scoped human action can close a
local review, and that local action still cannot publish itself.
