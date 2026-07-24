# WWAM After Midnight

An independent, source-linked living memory system for We Watched A Movie. It
turns commentary and livestream history into playable lore, fan games, recurring
character archaeology, topic paths, and creator-side editorial opportunities.

This is an unofficial fan prototype. It sends playback and source traffic back
to the official WWAM uploads.

Current documented release: **V5.19 / 0.5.19**.

## V5.19 The Midnight Cut

V5.19 lets a fan turn **three to eight canonical timed receipts** from the
Evidence Bag into one ordered route through the official WWAM uploads. **The
Midnight Cut** plays each exact source window inside the existing tape theater
with manual previous, replay, next, and direct-stop controls. It does not
instantiate a player before an explicit command, chain into another stop
automatically, stitch copied media, or turn a viewer's sequence into archive fact.

Compilation re-resolves every selection against the canonical Source Dossier
registry and fails closed on unknown, duplicate, quarantined, withheld,
stale-fingerprint, ambiguous, foreign, out-of-range, or untimed evidence.
Explicit human-curated end bounds survive compilation. A reviewed 14-second
window cannot quietly expand into a generic playback window.

A compact share packet carries ordered receipt keys, channel/archive/registry
bindings, bounded viewer prose, and deterministic cut/packet fingerprints. It
carries no transcripts, excerpts, summaries, speakers, generated dialogue, or
media.
Optional viewer title and introduction remain visibly labeled
**VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE**. Restore performs the same
fail-closed canonical resolution again.

The same sequence exports a JSON or Markdown creator edit brief with official
URLs and exact edit coordinates. It is a human-review handoff, not creator
approval, rights clearance, proof of speaker continuity or origin, a Canon
mutation, or an automatic publish action.

The launch preset, **The Character Ward // 2021–2026**, preserves five exact
14-second human-curated performance windows in this order: Slenderman stomach,
Challis boilermaker, Loomis biscuit job, Feldman atmosphere, and Loomis
funding. The feature launches from the Evidence Bag and existing tape theater;
it is deliberately not another homepage section or navigation item.

See [The Midnight Cut](docs/THE_MIDNIGHT_CUT.md).

## V5.18 Ask This Tape

V5.18 turns every Source Dossier into an exact-source question room. **Ask
This Tape** resolves the requested source ID and fingerprint before it
interprets the question. Every content result must come from that one source;
an upload with the same title, a hotter archive result, or a nearby source
cannot replace it. Unsupported questions return zero source-content receipts
instead of borrowing an answer from elsewhere in the archive.

The current canonical dossier registry contains **510 sources**: 111
caption-backed, 390 metadata-only, nine caption-limited, and zero unavailable.
Across those source files it registers **1,490 receipts** and **928
source-bound artifact records**. Those are current Source Dossier inventory
counts. They do not replace the immutable V5.4 proof of 84 source inputs and
872 promoted receipts.

The evidence ledger now preserves all **25 human-curated character-performance
windows** with their explicit end bounds. Every current window is exactly 14
seconds; the July 23 Loomis funding receipt remains
`LV2rmwEA0w4 @ 9042.64–9056.64`. Archive Deep's 52 machine-surfaced character
records are kept in different evidence classes: **24
`caption-character-signal` receipts and 28 `caption-character-context`
receipts**, with zero promoted as curated performances.

The Tape's Wake no longer lets its 16-result display window masquerade as the
complete relationship count. A dossier now exposes `matchingTotal`,
`displayed`, and `truncated`; `LV2rmwEA0w4` has **138 matching sources, 16
displayed, and `truncated: true`**. Tape Companion also accepts the complete
510-source registry: **71 sources are memory-ready and 439 remain visibly
source-only**.

The dossier opens in a compact Director's Cut, supports per-section progressive
disclosure and a full-file view, and keeps stable routes for Source Proof,
playback, Ask, receipts, Memory OS Footprint, Wake, chronology, work, and the
evidence boundary. Canonical links use the source ID—not the title—and can
retain an exact section:

```text
?source=LV2rmwEA0w4&at=9043&section=ask#archive
```

See [Ask This Tape](docs/ASK_THIS_TAPE.md) and
[The Source Dossier](docs/SOURCE_DOSSIER.md).

## V5.17 The Source Dossier — preserved

Every one of the **510 unique canonical uploads** now has one honest,
shareable source page. The registry reconciles 472 cached official
Streams-feed records with 39 commentary records and one exact overlap. Its
coverage remains explicit: 111 caption-backed, 390 metadata-only, nine
caption-limited, and zero classified unavailable.

The dossier gathers Source Proof, dormant in-page playback, Inside This Tape,
Memory OS Footprint, The Tape's Wake, creator actions, evidence boundaries,
and chronology around the upload that generated them. The July 23, 2026
livestream demonstrates the full path with 21 registered receipts, four bit
lineages, 13 Short candidates, six supercut memberships, and four resurfacing
opportunities. Metadata-only sources receive a useful page and a permanent
refusal instead of invented topics, quotes, characters, or sentiment.

Cross-source content links require dual-ended evidence or exact registered
artifact membership. Title similarity remains labeled metadata navigation.
The canonical route is `?source=ID&at=SECONDS#archive`; older `?tape=` and
`?live=` links remain readable. No player initializes until the visitor asks
for it, and the shared YouTube identity bridge keeps timestamped playback
inside the page.

See [The Source Dossier](docs/SOURCE_DOSSIER.md).

## V5.16 Evidence Relationship Gate

Ask now distinguishes **a receipt from a relevant source** from **a receipt
that is evidence about the requested subject**. Every subject-bearing
candidate receives one closed-vocabulary `claimRelation`:
`explicit-caption-target`, `exact-topic-receipt`,
`screen-referent-in-exact-commentary`, or `source-context-only`. The first
three may support neutral aboutness under their stated limits.
`source-context-only` may navigate to a source, but it cannot answer “what did
they say about X?”, enter an evidence chain, or become a Play the Answer stop.

This closes a reproduced V5.15 failure. `What do they say about Halloween?`
could rank `4UokRLETypU @ 809` (“Would you suck your own dick?”) and
`Q6SN-Om1gIo @ 2835`; the source titles were relevant, but the bounded remarks
did not establish Halloween as their subject. The equivalent Scream query
could rank `2G8lpFaeIdw @ 1585` and `jLIfEdg8Oc0 @ 4366`, while the Friday the
13th query could rank the curated Burp Defense. Those were precise,
source-linked, memorable wrong answers.

Relationship eligibility now runs before heat, curation, comedy, popularity,
or source-title score. None can upgrade `source-context-only`. Direct evidence
still survives: the Halloween 5 mask receipt at `AtcRT3Xkk6E @ 1327` remains
available, the absent Scream 3 ending subtopic still refuses, and the Elm
Street remake's two exact-commentary screen referents remain an
`archive-boundary` route rather than a host-level opinion claim.

The closed relationship vocabulary and Play enforcement are channel-neutral.
A racing adapter can apply the same distinction between a caption that names
car 33, an exact driver/event topic, a concrete referent inside the selected
race, and an unrelated exciting call that merely occurred in a race where car
33 started. The neutral fixture proves transport and rejection, not that
WWAM's film-specific search classifier can classify racing unchanged. This is
an accuracy moat, not another interface surface: the system must prove why the
exact played second is evidence for the question.

See [Evidence Relationship Gate](docs/EVIDENCE_RELATIONSHIP_GATE.md).

## V5.15 Play the Answer

Ask no longer stops at a stack of receipt cards. **Play the Answer** turns the
current ordered `evidenceChain` into one on-page source trail with Previous,
Replay, Next, player recovery, official-source, and share controls. A fan can
watch the primary and supporting receipts—or the earliest and latest indexed
receipts—in the exact order used by the answer.

The trail is not a generated recap. It adds no narration, transitions,
speaker identity, continuity, causality, opinion-change verdict, true-origin
claim, rights clearance, or copied media. Every stop reopens an official WWAM
upload at its registered indexed second, and the complete Ask limitation set
stays visible beside the player.

Eligibility is deliberately narrow: two to six unique timed receipts, all
registered and in range, with one V5.16-allowed `claimRelation` per stop.
Metadata-only answers, source-level summaries, source-context-only receipts,
one-receipt answers, global ranking handoffs, longitudinal handoffs,
adjudication handoffs, and unknown subjects cannot manufacture a trail.

Share packets contain the query, exact bindings, ordered receipt keys, roles,
source IDs, bounded coordinates, and exact claim relations—never excerpts,
captions, generated answer copy, or speaker fields. Restore reruns Ask and
opens only when the fresh trail matches exactly; stale, reordered, foreign, or
tampered packets fail closed. The same core passes a neutral racing fixture
without WWAM vocabulary.

The release pins two concrete watch paths: the Halloween trajectory from
`6VXSBDZ-3WE @ 1597` to `I6QKteG_hK0 @ 5993`, and the Elm Street remake
negative-language chain from `qTQdWKcwn4A @ 1132` to
`qTQdWKcwn4A @ 2101`. Neither is promoted into a host-level opinion claim.

Playback hardening now applies beyond the new theater: every shared-helper
player in commentary dossiers, loose receipts, and soundbytes carries a
visible **PLAYER ERROR? RECOVER HERE** action. It reloads the same official
video and exact bounds through the first-party hosted bridge instead of making
the visitor abandon the page when YouTube reports identity error 153.

See [Play the Answer](docs/PLAY_THE_ANSWER.md).

## V5.14 The Verdict Room

The machine still gets no vote. **The Verdict Room** is a demand-loaded,
device-local human review ledger layered over The Tape Keeps Score's four
canonical unresolved dockets. A caller-attested human must complete all
**12 explicit checks**, select one of only three codes—`SUPPORTED`,
`CONTRADICTED`, or `MIXED`—and lock that code together with its exact fixed,
code-specific scoped sentence. Final adjudication must byte-match both. Until
then, every formal label, comedy label, and reviewed wording stays `null`.

One adjudication creates one local overlay; it does not rewrite the source
docket, Canon, Ask, or any public/server record. Reviewer identity remains
unverified. Rights, speaker continuity, causality, creator approval, and
publication authority remain explicitly unclaimed. Revocation appends history
and immediately removes the active verdict without deleting the audit trail.
JSON and Markdown exports preserve the complete bounded review record; hostile,
foreign, stale, or malformed imports fail closed.

WWAM's fingerprint-bound verdict voice includes `CALLED THAT SHIT.`,
`AGED LIKE ROADKILL.`, and `HALF PROPHET. HALF JACKASS.` with a reduced-
profanity mode beside the formal scoped result. The core engine also passes a
neutral racing ChannelPack, proving the workflow travels without importing
WWAM copy. The current longitudinal input is bound to ChannelPack
`cp1-dd23bc386008689b`, caption set
`sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc`,
and structural fingerprint `fnv1a32:59b085f6`. These values detect and bind
change; they do not authenticate a reviewer or prove truth.

See [The Verdict Room](docs/VERDICT_ROOM_DESIGN.md) and
[The Tape Keeps Score](docs/LONGITUDINAL_DOCKET.md).

## V5.13 The Tape Keeps Score — preserved

The WWAM Memory OS now has a demand-loaded longitudinal review surface:
**before tape, machine status, after tape**. It joins forecast-shaped caption
receipts to later response-shaped caption receipts under `MAY_RESOLVE`, exposes
the complete pairing basis and blockers, and sends every playback back to the
official WWAM upload at the exact indexed second. It never autoplays.

The frozen July 23 snapshot contains **4 typed dockets across 8 distinct
official sources, 8 grounded subjects, and 9 short timestamped receipts**. Its
machine pair-signal distribution is **1 `MAY_SUPPORT`, 1 `MAY_BE_MIXED`, and
2 `OPEN`**. All four are unreviewed, keep `verdict: null`, and publish **zero
public verdicts**. The mixed Halloween Ends case retains its later
counterweight instead of editing the contradiction away.

The latest after tape is the July 23 livestream at
`LV2rmwEA0w4&t=3811s`, where Scream 7 is scheduled for July 31. It remains
`OPEN`: a plan is not proof of delivery. Public docket titles are generated
from a ChannelPack-registered subject and the pack's fixed before/after
vocabulary, so free-form artifact strings cannot smuggle in a verdict.

Ask prediction/outcome requests now return a typed handoff to **The Tape Keeps
Score**. Exact supported subjects open a scoped docket; unsupported subject IDs
fail closed or open the global four-case view without a substitute claim. The
surface can build source-linked **30-, 60-, or 90-second edit briefs** and
download one reverified review packet. Those outputs contain source windows,
not copied media, rights clearance, speaker attribution, visual verification,
or an adjudication.

The public ledger is **17,626 bytes**, bound to ChannelPack
`cp1-f9ad38be22481b5d`, caption set
`sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc`,
and structural fingerprint `fnv1a32:d4ca362e`. The data, engine, UI, adapter,
and stylesheet remain outside the eager path and total 160,410 source bytes.
See [The Tape Keeps Score](docs/LONGITUDINAL_DOCKET.md).

## V5.12 Archive Deep overlay — preserved

V5.12 composes four independently fingerprinted Archive Deep batches as one
read-only quarantine portfolio:

- 40 caption-audited sources;
- 97.7 audited hours, 1,216,993 words, and 173,675 parsed caption events;
- 400 topic lanes across 48 distinct normalized topics;
- 166 quarantined public moment candidates;
- 52 source-level character records: 24 machine character signals and 28
  machine persona/context records, not people or verified performances;
- 12 topic-only source-audio firewalls;
- 12 special visual-ranking quarantines;
- one disclosed limited available caption span;
- 445,949 cached snapshot views.

Every portfolio candidate remains machine-surfaced, speaker-undiarized,
origin-unattributed, unreviewed, and outside the promoted 872, Canon, Red Band,
WWAM UP IN YA, and creator-approved inventory. The portfolio fingerprint is
`fnv1a32:14050c7a`; its independently retained Batch 01, 02, 03, and 04 public
fingerprints are `fnv1a32:17045a51`, `fnv1a32:bcea5692`, and
`fnv1a32:f79f2399`, and `fnv1a32:56ca74df`. These are structural change
detectors, not signatures. All 40 sources forbid visual claims. The 12-count
identifies the special
visual-ranking quarantine lane; it does not imply verified visuals for the
other 28.

Across the promoted and quarantine lanes, the current audit covers 114 source
inputs: 111 caption-audited and 3 sealed or limited, with 3,097,866 audited
words across about 268.9 hours. The 872 promoted-receipt and 168 promoted core
memory-node counts remain unchanged; all 166 current Archive Deep moment
candidates remain quarantined.

The whole-feed Archive Atlas still maps 472 cached Streams-feed records.
Current evidence coverage is **74 deeply indexed, 390 metadata-only, and 8
caption-limited records**, or **15.7% deep coverage**. No record was classified
unavailable in the cached snapshot, and current availability was not rechecked.
All 40 Archive Deep sources are excluded from the next metadata-only queue.

## Immutable V5.4 proof — preserved release snapshot

The following values are the frozen V5.4 proof, not the later V5.12, V5.13, or
V5.14 overlays:
**84 inputs, 2,175,344 audited words, 194.9 caption-audited hours, 872 promoted
receipts, 42 then-quarantined Batch 01 candidates, and 168 promoted core memory
nodes**. The current forty-source portfolio does not retroactively change
those named release values, and its 166 candidates must not be added to the
promoted 872.

- 39 franchise commentaries: 13 Halloween, 12 Friday the 13th, 6 Scream, and
  8 A Nightmare on Elm Street
- The 10 newest official livestreams
- 25 additional official livestreams ranked by snapshot view count, with zero
  overlap against either source lane
- Archive Deep Batch 01: 10 additional caption-audited livestreams selected
  from the frozen Archive Atlas Distill Next queue
- 84 total source inputs: 81 caption-audited and 3 sealed or caption-limited
- 2,175,344 audited caption words across 194.89 caption-audited hours;
  201.15 hours of known source runtime
- 872 promoted, bounded, playable evidence receipts
- The 74-source promoted corpus contains 168 core memory nodes and 603
  source-backed core edges
- A separate whole-feed Archive Atlas with 472 cached Streams-feed records
  from 2018–2026: 1,197.0 known hours, 5,674,608 cached views, 44
  deeply indexed records, 420 metadata-only records, 8 caption-limited
  records, 0 records classified unavailable in the cached snapshot, and 9.3%
  deep coverage; current availability was not rechecked
- 177 Lore Galaxy entries, 822 graph edges, 19 constellations, and 51 indexed
  lineages
- 49 Take Time Machine timelines and 14 WWAM Court argument boards

Archive Deep Batch 01 contributes 23.7 audited hours, 294,471 words, 43,585
parsed caption events, 100 topic lanes, 42 public machine candidates, and 12
character signals. Four source-audio-sensitive uploads are deliberately
topic-navigation-only. All 42 candidates remain outside the promoted 872,
Canon, Red Band, and WWAM UP IN YA. Playback review can establish context, but
does not promote one candidate across those separate lanes; each lane applies
its own evidence policy and authenticated decision requirements.

The Popular 25 alone contributes 927,620 audited words, 1,467,586 snapshot
views, 240 topic chapters, 168 comedy moments, and 720 caption-backed heatmap
chapters. Its one uncaptioned source correctly contributes no fabricated map.

The Lore Galaxy exposes 953 labeled graph receipt links. That broader count
includes source entry points and context records; the 872 count is the
editorial-moment inventory.

## V5.12 Archive Deep Batch 04

Batch 04 freezes the exact next ten eligible Archive Atlas priority records
after all 30 earlier Archive Deep IDs are excluded. Its deterministic score is
cached-view gravity plus upload recency plus configured franchise-title
signals; it is not raw view rank, current popularity, or a quality score.

All ten sources have official automatic-caption tracks. One track covers
96.03% of its cached runtime and stays visibly
`limited-available-track`; the other nine cover at least 99.8%. The batch adds
20.5 hours, 259,563 audited words, 37,136 caption events, 100 topic lanes, 35
quarantined moments, and 11 character-name context signals. Three
trailer-audio-sensitive sources remain topic-only, and two tier-list sources
forbid visual-result claims.

Batch 04's public ledger is `fnv1a32:56ca74df`; the composed portfolio is
`fnv1a32:14050c7a`. Archive Atlas now reports 15.7% deep coverage and names
`RzSxi8rVQGI` as the next deterministic distill candidate at score 81.9. No
Batch 04 item enters the promoted 872, Canon, Red Band, WWAM UP IN YA, or the
creator-approved character set. Ask now recognizes explicit fourth-batch
grammar and all ten exact source titles; the complete Ask/search matrix passes
128/128 subtests. See
[Archive Deep Batch 04](docs/ARCHIVE_DEEP_BATCH4.md).

## V5.11 Ask the Tape: Answer Frame V2

Ask now compiles a channel-neutral answer frame before it ranks a receipt:
action, evidence scope, primary target, **secondary targets**, request
predicate, selector, and follow-up anchor. Finding the correct source title is
no longer enough. A question about “the mask in Halloween 5” must first find
the indexed commentary and then require **semantic target coverage** for the
mask before comedy heat can break a tie. If that target is absent, Ask gives an
**honest refusal** instead of substituting a hotter unrelated moment.

Source-first temporal questions now select the newest or oldest requested
source before retrieving its moments. Negated coverage, spelled list limits,
play commands, character profile-versus-performance-versus-mention questions,
and exact result navigation keep distinct answer contracts. **Follow-up
memory** preserves the selected source and second for next, previous, there,
replay, or another. An explicit new target overrides stale context.

A global “craziest ever” request hands off to the Red Band 100, while a global
“funniest” or “laugh hardest” request hands off to the Comedy Black Box. Ask
does not manufacture a private #1 beside a published ranking. The V5.11 gate
passed **122/122** Ask/search subtests, including the complete **157-query**
adversarial corpus, plus 8/8 focused answer-first cases. See
[Answer Frame V2](docs/ASK_ANSWER_FRAME_V2.md).

## V5.10 Comedy Black Box

**Riff Autopsy** upgrades the existing Riff Chemistry cards from opaque ranks
to inspectable evidence. The checked-in ledger contains **301 promoted
chemistry anchors across 69 sources**. Every inspection reproduces the six
published score dimensions and their weights, recomputes the score with
**zero permitted drift**, and opens the official YouTube source at the exact
promoted whole-second playback coordinate.

The inspector also frames a bounded playback window—15 seconds before and 20
seconds after the anchor—and shows the nearest indexed promoted receipt on
either side when one exists within fifteen minutes. Those neighbors are
navigation aids, not proof of setup, payoff, intent, or causality. The engine
reconstructs no surrounding dialogue and does not autoplay.

Only 13 of the 301 bounded excerpts contain a declared literal reaction cue;
the other **288 remain `UNKNOWN`**. A literal cue still receives no speaker or
audience attribution. The ledger also keeps its evidence split visible:
**276 machine-level anchors and 25 timestamp-validated human-curated
candidates**, none silently upgraded to editor or creator certification.

Copy and download now release one independently verified riff autopsy rather
than the entire roughly half-megabyte audit ledger. A separate full-ledger API
binds all 301 anchors to the promoted source, receipt, chemistry, evidence, and
ChannelPack fingerprints. Quarantine signals, recomputed basis drift, foreign
ledgers, hostile JSON shapes, formula drift, and reaction cues outside the
sixteen-word public excerpt fail closed. Both artifacts omit transcripts,
captions, event arrays, copied audio, and copied video. See
[Comedy Black Box](docs/RIFF_BLACK_BOX.md).

## V5.9 Archive Time Capsules

**The Years Have Teeth** opens any Atlas year from 2018 through 2026 as a
playable capsule while keeping three evidence ledgers visibly separate:

- **The Marquee** reports only cached Streams-feed metadata: record count,
  known runtime, cached views, coverage, and leading uploads at snapshot time.
- **What the Tapes Remember** reports separately indexed promoted-corpus
  sources and exact timestamped receipts from that year.
- **The Quarantine Drawer** reports Archive Deep sources, caption-derived
  topic lanes, and non-promotable machine candidates from that year.

The distinction is measurable. The 2019 cached feed contains 21 metadata-only
records, while the separate promoted commentary corpus contains 12 sources and
96 timestamped receipts. The capsule displays both facts without pretending
the twelve commentary sources belong to the cached feed slice. In 2024 and
2025, promoted memory is honestly empty while the quarantine drawer contains
5 sources / 19 candidates and 19 sources / 83 candidates, respectively.
Batch 04 also makes 3 sources / 10 candidates visible in the 2022 quarantine
drawer instead of silently degrading to an empty optional layer.

Every capsule can assemble a deterministic five-stop route using official
YouTube timestamps, copy a reproducible capsule link, and export a bounded
manifest. Quarantined stops remain marked `promotionAllowed: false` with no
speaker claim. The export omits transcripts, caption payloads, and full event
ledgers. See [Archive Time Capsules](docs/ARCHIVE_TIME_CAPSULES.md).

## V5.19 product map

The hero offers three deliberate entry points:

- **Fan Experience:** 510 canonical Source Dossiers, The Midnight Cut's
  evidence-safe personal viewing routes, the daily Night Shift
  return ritual, source-grounded Tape
  Trivia, Tape Companion's synchronized second screen, the Evidence Bag, the
  100-rank Red Band Memorability Candidate Index V2.1, WWAM UP IN YA, and
  playable descent paths.
- **Deep Dive:** relationship-gated Ask WWAM with Play the Answer source
  trails, Lore Galaxy, Take
  Time Machine, year-sized Archive Time Capsules, The Tape Keeps Score, The
  Verdict Room, Bit Ancestry, the
  Comedy Black Box / Riff Autopsy, WWAM Court, franchise labs, autopsies, Fresh
  10, Popular 25, and the whole-feed Archive Atlas.
- **Creator Proof:** Clip Lab edit briefs, exact-runtime Cold Open Factory
  boards, supercut spines, then/now resurfacing, Live Aftermath, Control Room,
  the Trust / Canon Desk, the local Creator Taste Calibration, Fresh Tape
  Intake, a 457-finding Human Review Session, and four evidence-backed Creator
  Pilot briefs.

Mike Mode is a six-beat private-screening walkthrough. Each beat exits the
pitch and opens working proof: Night Shift, Ask WWAM, the whole-feed Archive
Atlas, a Loomis constellation, the **Tonight's 12** first editorial pass, or a
measurable Archive Discovery Creator Pilot. The close asks for a narrow pilot
decision instead of treating a prototype feature tour as proof of canon or
business results.

Night Shift produces a deterministic three- to five-beat daily journey whose
five required roles are the newest indexed source, an older archive callback,
a playable receipt, a grounded Trivia/preference interaction, and a closing
payoff. Its share seed includes the archive fingerprint, its saved progress is
ordered and canonical-response-checked on restore, and its visible snapshot
notice says when newer uploads may be missing.

Tape Companion now compiles the complete 510-source dossier registry into one
source-synchronized rail: 71 sources are memory-ready and 439 remain visibly
source-only. The historical promoted subset is still 74 sources—71 ready plus
the same three disclosed caption gaps—and its 872 exact receipt members,
1,294 derived heat windows, and 96/25/25 annotation totals remain unchanged.
The current deterministic snapshot further derives 869 conservative incidents
and 2,967 receipt-backed Lore connections. The surface never copies media, the
player keeps autoplay off, and the playback UI exposes event text only through
snapshot-safe and crossed-event APIs after the indexed second is crossed. The
full compiled timeline remains an explicit audit API, not a playback feed.

Fresh Tape Intake is a bounded, device-local route for testing a newly supplied
source without pretending the public snapshot refreshed itself. It accepts
explicit source metadata plus WebVTT, SRT, YouTube JSON3, or plain text. Timed
inputs can produce source-bound machine candidates; plain text is held with
zero candidates because it has no timestamp evidence. The feature performs no
network fetch, does not verify channel ownership or user identity, assigns no
speaker, and cannot promote anything into canon or another product lane. Its
export omits the raw transcript and can be structurally rechecked against the
ChannelPack, rule set, source boundaries, exact-event ledger, and artifact
fingerprint. The deterministic FNV fingerprints are change detectors only;
they do not verify source content, authenticity, ownership, speaker identity,
or authority.

The current creator inventory contains 560 timestamped Short candidates across
71 sources, 32 multi-source supercut bundles, 21 then/now resurfacing
opportunities, and 117 exact-runtime cold-open storyboards spanning 163
receipts and 67 sources. These are reviewable edit plans, not predictions of
virality or auto-published media. Filtered campaign assets persist an exact
fingerprinted receipt/source ledger so a saved three-receipt package cannot
silently reload as its broader parent bundle.

Creator Taste Calibration turns that inventory into a 12-round local Cut Test:
10 unique, source-diverse, priority-blind learning matchups plus 2 side-reversed
non-learning consistency checks. With the default `MEDIUM` risk ceiling, the
current deterministic WWAM derivation finds 248 exact-ledger candidates across
54 sources and samples 20 sources. At least six non-repeat A/B choices are
required. `NEITHER` and `NEEDS_CONTEXT` record local workflow decisions but add
no preference weight, every modifier is capped at ±6, and the untouched
machine Top 12 remains beside the calibrated local Top 12. The operator is
always labeled unauthenticated; preference cannot alter evidence, risk, HOLD,
canon, speaker, rights, or creator-approval state. A computed
protected-projection audit stops artifact creation if any such mutation
appears.

Ask the Character supports the owner-supplied recurring mappings for J's Dr.
Loomis, J's Slenderman, Mike's Dr. Challis, and J's Corey Feldman. Generated
fan riffs are visibly labeled and kept separate from short, playable
timestamp-validated human-curated performance candidates. Those mappings identify the recurring character
performer generally; the individual auto-caption clips are not
speaker-diarized.

Ask WWAM now indexes those timestamp-validated human-curated performance
candidates as their own evidence lane. Questions about a character's latest,
earliest, funniest, or specific recurring bit can return the relevant source
second, while performer mapping, individual clip attribution, and true origin
remain three separate claims.
Its downloadable 37-case frozen release gate executes promoted-corpus
retrieval, Archive Deep quarantine behavior, result-anchored navigation,
collection counts and lists, year-scoped source rankings, character roster and
profile distinctions, curated soundbyte limits, exact Red Band ranks, Atlas
metadata discovery, surface handoffs, and honest abstention against fixed
expected source IDs and result kinds. Natural questions can also map the
latest livestream's topics, locate the earliest curated character performance
in the current set, and move before, after, replay, or to another indexed
same-source highlight. Context-bearing answer links preserve the exact source
and timestamp across a reload.

Answer Frame V2 additionally preserves the requested subject after a source or
entity match. Semantic fit is now a retrieval gate before archive heat, so a
direct answer cannot be buried beneath a merely popular receipt from the right
upload. Missing subtopics abstain, temporal source-content questions choose the
source before its moments, and query-plan explanations expose the action,
scope, targets, predicate, selector, and anchor used.

For Dr. Loomis, an unqualified “clips” or “how often” question returns the 7
timestamp-validated human-curated performance candidates in the bounded set. Only an
explicit caption-mention question returns the broader 696 caption matches
across 59 sources. The current snapshot contains 0 authenticated
editor-verified decisions, so neither count is labeled verification.

Archive Atlas source-discovery questions are a separate lane. They can locate
and order cached uploads by title metadata, year, date, or snapshot views, but
they do not answer what happened inside a metadata-only source. The
deterministic Distill Next queue scores only cached-view gravity, upload
recency, and configured franchise-title signals. Priority is not raw view rank.
Its current 472-record map is 74 deeply indexed, 390 metadata-only, 8
caption-limited, and 0 records classified unavailable in the cached snapshot:
15.7% deep coverage. Current availability was not rechecked. The Archive Deep
Portfolio exposes all four ten-source batches and their independent
provenance, while all 166 machine candidates remain quarantined from promoted
product lanes.

Ask Review Queue V1 turns **Flag This Answer** into a device-local,
append-only proposal ledger. A reviewer can optionally suggest a better source,
whole second, or expected answer, but the queue does not automatically mutate
Ask, Canon, certification, or any promoted evidence ledger.

The Red Band 100 now starts with 567 deduplicated playable candidates and
publishes exactly 100 unique ranks spanning 53 sources. Its raw score uses
percentile-normalized category intensity, room-break energy, language voltage,
callback value, preselected-candidate input, source diversity, and an evidence
modifier. This is the V2.1 successor to the Red Band Memorability Index V2. A
deterministic second pass constructs the Top 25 from a bounded 150-candidate
horizon, capped at four per category, five explicit body/sexual-lexical
excerpts, eight preselected candidates, two per source, and one near-duplicate
wording cluster.

The measured Top 25 currently spans eight categories and 21 sources, with five
explicit lexical hits, eight preselected candidates, zero relaxed selections,
and zero caption-coherence failures. Its mean coherence score is 73.76 and its
minimum is 58.93. The displayed score remains the raw machine score; rank is
the post-diversity candidate position, and the baseline rank plus every
deferral reason stays inspectable. Recency is off by default, all unsupplied
editorial votes are literal zero, no creator/editor vote is authenticated, and
no rank identifies an undiarized speaker. UP IN YA remains its own editorially
selected soundbyte lane; Red Band treats membership only as
preselected-candidate input.
Ask WWAM can retrieve an exact rank, bounded rank range, or top-ten cut by rank
key, and the full ranked ledger plus methodology is downloadable as JSON.

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
- The current Trust Desk still audits the 74-source promoted corpus: 71 healthy
  sources, 3 disclosed caption gaps, 0 structurally invalid or
  source-ID-mismatched URLs, 0 invalid indexed timestamps, and 95 human review
  candidates. Archive Deep Portfolio's forty caption-audited sources and 166
  quarantined candidates are reported as a separate current overlay and have
  not been silently merged into that legacy Trust/Canon contract.
- The promoted corpus spans 171.19 caption-audited hours and
  177.45 hours of known source runtime.
- The current entity registry yields 1,381 Correction Ripple records;
  the 95 Trust packets enumerate 921 exact-receipt and 2,480 same-source-only
  dependencies without applying any correction.
- Public transcript fragments are display-capped; exported edit suggestions
  remain clearly separated from archival excerpts.
- The local Human Review Session binds 95 Trust findings and 362 Canon warnings
  to the exact current corpus. Its workflow records caller-attested routing
  decisions but does not authenticate reviewer identity and cannot certify a
  speaker, creator, or canon claim.
- Creator Pilot Builder exports four deterministic draft proposals with real
  current counts and receipts. Business outcomes remain `MEASURE DURING PILOT`.
- Tape Companion's heat windows are deterministic derived navigation, not
  audience sentiment. A character annotation preserves owner mapping but does
  not diarize the speaker in the clip.
- Creator Taste Calibration records unauthenticated local preferences, not
  creator approval. Its deterministic checksum is a consistency check, not a
  signature.
- Fresh Tape Intake records local, quarantined review inventory only. A valid
  YouTube URL proves URL structure and source-ID agreement, not that the upload
  belongs to the configured channel. A verifiable export proves artifact
  consistency, not authorship, authentication, review, speaker identity, or
  promotion. Its explicit verification result keeps authenticity,
  source-content, and authority flags false.

### Evidence vocabulary

- **Source metadata** is the upload identity, title, date, duration, observed
  views, and caption availability. It is not a quote.
- **Source-level derived summary** is a deterministic whole-source synopsis or
  editorial description. Its source entry point does not imply anyone spoke
  that summary there.
- **Machine-surfaced timestamped receipt** has a resolvable source/time pair and
  bounded auto-caption fragment. Speaker, target, intent, category, and exact
  wording may still require human review.
- **Timestamp-validated human-curated candidate** is the current character
  evidence tier: a human selected a candidate whose source and second pass
  structural validation. It does not claim authenticated surrounding-context
  review or identify an undiarized speaker.
- **Editor verified** is a future production threshold, not a label applied in
  the current snapshot. It would require an authenticated editor to watch the
  source at the timestamp, check the immediate context, and record that
  decision. It still would not prove an undiarized speaker.
- **Owner-mapped character** describes the recurring performer relationship.
  **Clip-level speaker attribution** requires diarization or specific creator
  certification.

The frozen promoted snapshot contains 847 machine-level receipts and 25
timestamp-validated human-curated character-performance candidates, but 0
authenticated editor-verified decisions and 0 creator-certified receipts.
Their speakers are not diarized. The candidate records preserve source/time
provenance; they do not prove reviewer identity, surrounding-context review,
or clip-level speaker identity. The Trust Desk's “0 out-of-range
indexed timestamps” result validates each time against the known source
duration; it does not establish continuous network availability or the
semantic truth of a derived claim.

The current 1,490-receipt Source Dossier registry is a broader source
inventory and must not be relabeled as the promoted 872. Its Archive Deep
contribution includes 24 machine character signals and 28 machine character
contexts, not curated performances.

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
python pipeline/wwam_archive_deep_distill.py --check
python pipeline/wwam_archive_deep_batch2.py --check
python pipeline/wwam_archive_atlas.py --check
python pipeline/wwam_longitudinal_docket.py --check
```

Full caption payloads stay in the gitignored `source-cache/` directory. Public
artifacts contain derived measurements and short, timestamped fragments only.

## Documentation

- [V5.19 product overview](docs/V5_OVERVIEW.md)
- [The Midnight Cut ordered-receipt contract](docs/THE_MIDNIGHT_CUT.md)
- [Ask This Tape exact-source query contract](docs/ASK_THIS_TAPE.md)
- [The Source Dossier](docs/SOURCE_DOSSIER.md)
- [Evidence Relationship Gate](docs/EVIDENCE_RELATIONSHIP_GATE.md)
- [Play the Answer source-trail contract](docs/PLAY_THE_ANSWER.md)
- [The Tape Keeps Score longitudinal evidence contract](docs/LONGITUDINAL_DOCKET.md)
- [The Verdict Room local adjudication contract](docs/VERDICT_ROOM_DESIGN.md)
- [Ask the Tape: Answer Frame V2](docs/ASK_ANSWER_FRAME_V2.md)
- [Comedy Black Box evidence contract](docs/RIFF_BLACK_BOX.md)
- [Archive Time Capsules](docs/ARCHIVE_TIME_CAPSULES.md)
- [Creator demo runbook](docs/CREATOR_DEMO_RUNBOOK.md)
- [Product changelog](docs/CHANGELOG.md)
- [Reusable YouTube Wiki Memory OS](docs/YOUTUBE_WIKI_MEMORY_OS.md)
- [Executable ChannelPack V1 contract](docs/CHANNEL_PACK_CONTRACT.md)
- [Fresh Tape Intake contract](docs/FRESH_TAPE_INTAKE.md)
- [Tape Companion contract](docs/TAPE_COMPANION.md)
- [Creator Taste Calibration contract](docs/CREATOR_TASTE_CALIBRATION.md)
- [Creator Clip Lab contract](docs/CREATOR_CLIP_LAB.md)
- [Cold Open Factory contract](docs/COLD_OPEN_FACTORY.md)
- [Tape Trivia engine contract](docs/TAPE_TRIVIA_ENGINE.md)
- [Night Shift engine contract](docs/NIGHT_SHIFT_ENGINE.md)
- [Human Review Session contract](docs/HUMAN_REVIEW_SESSION.md)
- [Correction Ripple contract](docs/CORRECTION_RIPPLE.md)
- [Creator Pilot Builder contract](docs/CREATOR_PILOT_BUILDER.md)
- [Archive Atlas contract](docs/ARCHIVE_ATLAS.md)
- [Archive Deep Distill contract](docs/ARCHIVE_DEEP_DISTILL.md)
- [Archive Deep Portfolio contract](docs/ARCHIVE_DEEP_PORTFOLIO.md)
- [Ask Review Queue contract](docs/ASK_REVIEW_QUEUE.md)
- [Red Band Memorability Candidate Index V2.1](docs/RED_BAND_RANKING_V2.md)
