# Product changelog

This changelog records product and evidence-contract changes. It does not by
itself indicate that a build has been deployed.

## 0.5.19 — V5.19 The Midnight Cut — 2026-07-24

### Added

- **The Midnight Cut** turns three to eight canonical timed receipts from the
  Evidence Bag into one ordered, manually controlled route through official
  YouTube uploads.
- Compilation re-resolves every selection against the current Source Dossier
  registry. Unknown, duplicate, quarantined, withheld, stale-fingerprint,
  ambiguous, foreign, out-of-range, and untimed selections fail closed.
- Exact registered start/end bounds survive compilation, playback, sharing,
  restoration, and edit-brief export. Human-curated 14-second character
  windows are never widened to a generic fallback.
- Optional titles and introductions remain labeled **VIEWER-WRITTEN // NOT
  ARCHIVE EVIDENCE** and cannot become archive claims.
- The compact share packet carries ordered receipt keys,
  channel/archive/registry bindings, bounded viewer prose, and deterministic
  cut/packet fingerprints. It
  omits excerpts, transcripts, summaries, generated dialogue, speakers, and
  media.
- JSON and Markdown creator edit briefs provide exact official-source
  coordinates for human review without copying media, publishing, modifying
  Canon, clearing rights, authenticating approval, or proving speaker
  continuity, causality, opinion change, or true origin.
- The launch preset **The Character Ward // 2021–2026** orders five exact
  curated character-performance windows from 2021 through the July 23, 2026
  livestream.

### Product boundary

- Playback is dormant until the visitor acts and never autoplays the next
  stop.
- The feature launches from the existing Evidence Bag and tape theater. It
  does not add a homepage section or navigation destination.
- The ordered-cut compiler is channel-neutral. Channel-specific presets and
  voice belong to the ChannelPack/adapter rather than the evidence engine.

See [The Midnight Cut](THE_MIDNIGHT_CUT.md).

## 0.5.18 — V5.18 Ask This Tape — 2026-07-24

### Added

- **Ask This Tape** adds a channel-neutral exact-source query engine to every
  canonical Source Dossier. It resolves the requested source ID and optional
  source fingerprint before parsing the question.
- Content results can use only receipts registered to the requested source.
  Duplicate titles, hotter archive candidates, adjacent dates, and global
  search results cannot substitute another upload.
- Source-local inventory, receipt, entity, artifact, connection, metadata, and
  registered-summary questions are typed separately. Speaker and subjective
  ranking questions retain explicit refusal states.
- Metadata-only, caption-limited, unavailable, stale-fingerprint, and
  unsupported-subject questions fail closed without borrowing content.
- Source Dossiers now open as a compact Director's Cut with per-section
  progressive disclosure and a full-file view. Stable `section=` routes cover
  proof, player, Inside This Tape, Ask, footprint, Wake, chronology, work, and
  the evidence boundary.
- Tape Companion now registers all 510 canonical sources. **71 are
  memory-ready and 439 remain visibly source-only**; synchronization does not
  create receipts for the latter.

### Current Source Dossier proof

- The canonical union remains **510 sources: 111 caption-backed, 390
  metadata-only, nine caption-limited, and zero unavailable**.
- The adapter registers exactly **1,490 source receipts** and **928
  source-bound artifact records**.
- Receipt taxonomy is explicit: 701 `caption-excerpt`, 592
  `caption-topic-receipt`, 120 `caption-topic-navigation`, 25
  `curated-character-performance`, 24 `caption-character-signal`, and 28
  `caption-character-context`.
- All 25 curated character-performance receipts preserve their human-curated
  start and explicit end bounds. Each current window is 14 seconds, including
  `character-receipt:loomis-funding` at
  `LV2rmwEA0w4 @ 9042.64–9056.64`.
- Archive Deep contributes 24 character signals and 28 character contexts.
  All 52 remain machine-surfaced, speaker-undiarized, quarantined evidence;
  none is relabeled as a curated performance.
- The Tape's Wake retains a 16-result display cap but now reports the real
  `matchingTotal`, `displayed`, and `truncated` state. `LV2rmwEA0w4` reports
  138 matching sources, 16 displayed, and `truncated: true`.

### Buyer demonstration

- In `LV2rmwEA0w4`, **Show me Dr. Loomis moments** returns only the two Loomis
  receipts registered to that source, including the exact funding window.
- In duplicate-title source `ag3axSC9BpU`, **Show me Dr. Challis moments**
  returns only `challis-miguel @ 3860.72–3874.72` and
  `challis-doctor @ 9851.76–9865.76`; it does not borrow
  `challis-birthday` from `LV2rmwEA0w4`.
- In metadata-only source `FVuwRHM0kcc`, **Who won the Marvel vs DC bracket?**
  returns zero content receipts. Its title can identify the upload, not its
  winner.

### Preserved boundaries

- The immutable V5.4 sales proof remains exactly **84 source inputs and 872
  promoted receipts**. It is a frozen historical ledger, not the current
  510-source / 1,490-receipt Source Dossier inventory.
- Exact-source answers do not establish speaker identity, intent, origin,
  causality, rights clearance, creator approval, canon, or an objective
  funniest/best ranking.

See [Ask This Tape](ASK_THIS_TAPE.md) and
[The Source Dossier](SOURCE_DOSSIER.md).

## 0.5.17 — V5.17 The Source Dossier — 2026-07-24

### Added

- Every canonical upload now opens one Source Dossier. The deterministic WWAM
  adapter reconciles 472 Streams-feed records plus 39 commentary records minus
  one exact overlap into 510 unique sources.
- Coverage is fixed at 111 caption-backed, 390 metadata-only, nine
  caption-limited, and zero unavailable records. Source-only pages expose
  useful metadata and chronology while refusing invented content.
- Source Proof, dormant official playback, Inside This Tape, Memory OS
  Footprint, The Tape's Wake, creator actions, evidence boundaries, and
  chronology now live around the source rather than in disconnected features.
- The July 23 livestream dossier joins 21 registered receipts, four bit
  lineages, 13 Short candidates, six supercut memberships, and four
  resurfacing opportunities without promoting those drafts into approval.
- Canonical `?source=` routes replace separate commentary/live share routes.
  Legacy routes remain readable; browser history and modal close preserve
  unrelated state.
- Archive Atlas now opens a dossier for every record instead of sending
  metadata-only records away from the wiki.
- Source Dossier can hand an exact source and second into Tape Companion while
  keeping playback dormant.

### Evidence and playback boundaries

- Content relationships require dual-ended registered evidence or exact
  artifact membership. Title/date/lane neighbors remain labeled metadata
  navigation and cannot claim callback, origin, influence, or discussion.
- Archive Deep quarantine, 12 source-audio firewalls, sealed sources, and
  caption-limited sources retain their existing refusal rules.
- Share and export packets omit excerpts, transcripts, generated summaries,
  media, and speakers.
- YouTube playback now sends explicit client identity, supports the
  first-party recovery bridge, preserves exact clip bounds, and exposes a more
  visible recovery control. The public deployment must contain the bridge and
  helper files before this change is live.

See [The Source Dossier](SOURCE_DOSSIER.md).

## 0.5.16 — V5.16 Evidence Relationship Gate — 2026-07-24

### Accuracy moat

- Ask now classifies the exact relationship between every subject-bearing
  candidate and the resolved subject before ranking. The closed vocabulary is
  `explicit-caption-target`, `exact-topic-receipt`,
  `screen-referent-in-exact-commentary`, and `source-context-only`.
- Neutral aboutness questions accept only the first three relationships.
  `source-context-only` remains usable for source discovery or surrounding-tape
  navigation, but cannot answer aboutness, enter the evidence chain, or become
  a Play the Answer stop.
- The release preserves the reproduced failure rather than hiding it:
  `What do they say about Halloween?` previously promoted
  `4UokRLETypU @ 809` and `Q6SN-Om1gIo @ 2835`; the equivalent Scream query
  promoted `2G8lpFaeIdw @ 1585` and `jLIfEdg8Oc0 @ 4366`; and the Friday the
  13th query promoted the Burp Defense at `BIbyzMlstmM @ 1528`. All were
  source-context matches without bounded subject evidence.
- Heat, profanity, curation, Red Band rank, Riff Chemistry, source views, and
  editorial priority now operate only after relationship eligibility. None can
  upgrade `source-context-only`.
- Exact evidence remains reachable: `What did they say about the mask in
  Halloween 5?` retains `AtcRT3Xkk6E @ 1327`; the unsupported Scream 3 ending
  query keeps zero results; and the Elm Street remake's two bounded
  exact-commentary referents remain available under an `archive-boundary`
  answer without becoming a host-level verdict.
- Neutral aboutness, evaluative opinion, and change/evolution remain separate
  evidence contracts. Topic membership alone cannot prove sentiment; an
  eligible chronological pair cannot prove speaker continuity or a mind
  change.
- Play the Answer rejects missing, unknown, and `source-context-only`
  relationship stops directly. Fresh Ask analysis also removes those stops
  before trail construction, and share restore cannot use stale coordinates as
  replacement evidence.
- The relation vocabulary and Play enforcement are channel-neutral. A neutral
  racing fixture verifies allowed relation transport and rejects an unrelated
  source-context stop. It does not claim that WWAM's film-specific Ask
  classifier classifies racing unchanged; a racing port still needs its own
  registered entities, aliases, exact source/topic bindings, referent
  vocabulary, and query truth set.

See [Evidence Relationship Gate](EVIDENCE_RELATIONSHIP_GATE.md).

## 0.5.15 — V5.15 Play the Answer — 2026-07-24

### Added

- **Play the Answer** turns Ask's existing ordered evidence chain into one
  on-page official-source watch path instead of making the fan open every
  receipt separately.
- Eligible answers expose a contextual `PLAY THIS ANSWER` action. The theater
  preserves exact primary/support/counterpoint or earliest/latest roles and
  provides Previous, Replay, Next, Recover Player, official-source, share, and
  close controls.
- The launch contract pins the Halloween trajectory
  `6VXSBDZ-3WE @ 1597 → I6QKteG_hK0 @ 5993` and the Elm Street remake chain
  `qTQdWKcwn4A @ 1132 → qTQdWKcwn4A @ 2101`.
- Playback uses the shared origin-aware YouTube helper. Explicit recovery
  reloads the same source window through the hosted first-party bridge, while
  the exact official-source link remains available.
- Every older helper-backed source player now exposes the same persistent
  `PLAYER ERROR? RECOVER HERE` control. Recovery keeps the exact video, start,
  end, and autoplay intent and routes through the current site's first-party
  bridge; local-file launches retain the hosted bridge.
- Compact share state binds the current query, archive identity, ChannelPack,
  and exact ordered receipt coordinates. Restore reruns Ask and requires the
  rebuilt trail to match rather than accepting the packet as evidence.
- The engine and interface remain demand-loaded from the Ask surface. The
  channel-neutral core is exercised with a racing fixture that contains no
  WWAM or horror vocabulary.

### Accuracy and authority boundaries

- A trail requires two to six unique timed receipts from the current
  `analysis.evidenceChain`. Metadata-only answers, source-level summaries,
  single-receipt answers, handoffs, unknown sources, duplicates, and
  out-of-range coordinates fail closed.
- Trail order is answer order. Popularity, heat, profanity, visual ranking,
  and UI card order cannot rerank it.
- Every stop fixes speaker to `null` and keeps speaker continuity, causality,
  opinion change, true origin, rights clearance, creator approval, Canon
  mutation, and copied-media claims false.
- Share packets contain no excerpt, caption, transcript, generated answer,
  speaker, thumbnail, audio, or video. Foreign bindings, changed answers,
  reordered stops, added fields, and fingerprint drift are rejected.
- The bounded playback window is a navigation aid around an indexed second,
  not a claim that a complete setup, joke, take, or payoff begins and ends at
  those bounds.
- Ask's full limitations remain visible in the theater. Playing two receipts
  back-to-back cannot establish that the same host made both statements or
  changed an opinion.

## 0.5.14 — V5.14 The Verdict Room — 2026-07-24

### Added

- **The Verdict Room** adds a demand-loaded, device-local human adjudication
  ledger over The Tape Keeps Score's canonical unresolved dockets.
- A review requires all **12 explicit caller-attested human checks**. Check
  twelve locks one of only three V1 codes—`SUPPORTED`, `CONTRADICTED`, or
  `MIXED`—together with its exact fixed, code-specific scoped sentence. Final
  adjudication must byte-match both.
- The formal result stays adjacent to ChannelPack-owned comedy copy. WWAM
  supplies `CALLED THAT SHIT.`, `AGED LIKE ROADKILL.`, and `HALF PROPHET. HALF
  JACKASS.` plus reduced-profanity display variants.
- Adjudication and revocation append immutable events. Revocation immediately
  removes the active local result without deleting the earlier decision.
- Deterministic JSON and Markdown exports preserve the bounded review record.
  Exact restore replays the complete event chain; stale, foreign, malformed,
  oversized, or semantically forbidden imports fail closed.
- The WWAM adapter persists a namespaced local session across reloads. Corrupt
  saved input is held visibly rather than deleted or silently accepted.
  Unavailable browser storage degrades to a disclosed memory-only session while
  export remains available.
- A dedicated `#verdict-room` route, lazy surface controller, keyboard workflow,
  confirmation dialogs, live status, reduced-motion behavior, and explicit
  destroy lifecycle keep the feature isolated from the eager fan experience.
- The neutral racing ChannelPack carries its own steward-style verdict map
  through the same core engine, proving that adjudication logic and channel
  voice remain separate.
- Tape Companion now performs the fallback it promises: if YouTube returns
  player identity Error 153, the failed API player is replaced in-page by the
  first-party hosted bridge at the same source second. If the synchronized API
  itself cannot load, the official source still opens in a direct on-page
  player with the manual memory rail preserved.

### Accuracy and authority boundaries

- A machine docket still publishes **zero verdicts**. Every formal label,
  comedy label, and reviewed wording remains `null` before a complete human
  adjudication and after revocation or stale-input detection.
- The local caller attests that a human performed the review, but the prototype
  does not verify reviewer identity. It also does not clear rights, assign a
  speaker, prove continuity or causality, certify a creator, mutate Canon, or
  publish to a server.
- The engine re-resolves the live canonical inspection packet for every target.
  It accepts no caller-authored packet, speaker, label, certification, rights
  claim, or Canon mutation.
- `MIXED` requires opposing relied-on later evidence. Every result stays scoped
  to the reviewed docket and wording; the same conclusion cannot silently
  transfer to another subject, source set, or revision.
- The compiled ChannelPack now fingerprint-binds the three-code
  `adjudicationVocabulary` and declares `human-adjudication-ledger`. The current
  WWAM pack is `cp1-dd23bc386008689b`; the re-bound public longitudinal artifact
  is `fnv1a32:59b085f6`. The caption-set binding remains
  `sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc`.
  All are change detectors or input bindings, not authentication, authorship,
  or truth proofs.
- ChannelPack, longitudinal-docket, and Verdict Room factories now publish
  through non-writable, non-configurable bindings, and Verdict Room captures
  the exact frozen validator it loaded with. Portable formal labels must retain
  their canonical verdict-code prefix; comedy copy cannot claim outside
  authority; reduced-profanity copy may bleep words but cannot reverse the
  decision.
- The four dockets, eight official sources, nine short receipts, 17,626-byte
  public artifact, July 23 source snapshot, and all V5.13 historical evidence
  claims remain unchanged.

## 0.5.13 — V5.13 The Tape Keeps Score — 2026-07-24

### Added

- **The Tape Keeps Score** adds a demand-loaded before/status/after review
  surface inside the existing Memory OS.
- The frozen launch ledger contains **4 typed dockets, 8 distinct official
  sources, 8 grounded subjects, and 9 short timestamped receipts** from the
  July 23 snapshot.
- Ask prediction/outcome questions now return one typed longitudinal handoff.
  Exact supported subjects open the scoped docket; unsupported subjects cannot
  create a substitute match.
- Every case exposes its exact official source coordinates, source dates,
  rights and evidence labels, chronology, full pairing basis, and unresolved
  blockers. The mixed Halloween Ends case preserves its later counterweight.
- The workbench builds deterministic source-linked 30-, 60-, or 90-second edit
  briefs and downloads one reverified selected-docket review packet.
- The channel-neutral engine is gated by the ChannelPack
  `longitudinal-claim-ledger` capability and is exercised with a neutral racing
  pack as well as WWAM.
- Source receipts, bounded Clip Lab excerpts, and Tape Companion now share one
  YouTube playback identity contract. Every direct player supplies the current
  HTTP(S) origin and an explicit `strict-origin-when-cross-origin` referrer
  policy, preventing YouTube player Error 153 in normal hosted and localhost
  launches.
- Local-file launches keep video on the page through a small first-party hosted
  playback bridge. The bridge validates the video ID and time bounds, embeds
  only the original YouTube upload, and gives YouTube the HTTP page identity
  that a `file://` document cannot provide.
- Tape Companion reports Error 153 separately, preserves the exact official
  source link and manual memory-sync rail, and never strands the viewer in an
  unexplained dead player.

### Accuracy and authority boundaries

- Every machine pair remains `MAY_RESOLVE`,
  `machine-paired-unreviewed`, `verdict: null`, and
  `promotionAllowed: false`. The public verdict count is **zero**.
- Final signals are **1 `MAY_SUPPORT`, 1 `MAY_BE_MIXED`, and 2 `OPEN`**.
  Those are retrieval labels, not adjudication, causality, speaker continuity,
  mind-change, or correctness claims.
- The hardened anger/death case is `OPEN` and no longer claims a Karen subject,
  target continuity, or a Halloween Kills film binding unsupported by its
  before receipt.
- The Halloween Ends before tape now uses the caption-safe July 28 Q&A source
  at `ETuRUYiQEBM&t=8507s`, not mixed trailer-reaction source audio. Its
  response now preserves the closing negative assessment at
  `I6QKteG_hK0&t=6817s`, the immediately adjacent positive counterweight at
  `I6QKteG_hK0&t=6823s`, and an 82-day chronology.
- The Scream 7 response is now the July 23, 2026 scheduling receipt at
  `LV2rmwEA0w4&t=3811s`, 28 days after the June 25 forecast. It remains
  `OPEN` because a scheduled July 31 commentary is not verified delivery.
- Public excerpts are bounded to at most sixteen normalized automatic-caption
  words. Speaker stays null, origin is not inferred, visual context stays
  unverified, no media is copied, and playback never autoplays.
- Adversarial validation rejects hidden truth language in titles, labels, and
  provenance; duplicate pair inflation; coerced coordinates; ungrounded cue
  terms; free-form window-cue or unregistered-subject injection; invented
  lanes and subject types; source-audio or visual shortcuts; missing
  speaker-continuity blocks; oversized exports; caption-set drift; recursive
  prototype-sensitive keys; and forged ChannelPacks.
- Docket titles are deterministic combinations of the primary registered
  non-topic subject plus ChannelPack-owned forecast and response labels. The
  compiled pack now binds the exact entity registry and longitudinal
  vocabulary accepted by the engine.
- Expanding that registered entity ontology also updates the current derived
  Correction Ripple registry to **1,381 records**. Across the same 95 Trust
  packets, the current aggregates are **921 exact-receipt** and **2,480
  same-source-only** dependencies; the historical V5.5 snapshot remains
  recorded under its original counts.
- The public artifact is **17,626 bytes** with structural fingerprint
  `fnv1a32:d4ca362e`, caption-set binding
  `sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc`,
  and ChannelPack `cp1-f9ad38be22481b5d`. These are change detectors and input
  bindings, not signatures, source authentication, or verdict authority.
- The five lazy feature assets total **160,410 source bytes** and remain off
  the eager application path.

## 0.5.12 — V5.12 Archive Deep Batch 04 — 2026-07-24

### Added

- Archive Deep Batch 04 freezes the exact next ten eligible Atlas-priority
  sources after the thirty IDs in Batches 01–03 are excluded.
- The batch contributes **20.5 hours, 259,563 audited words, 37,136 caption
  events, 100 topic lanes, 35 quarantined machine moments, and 11
  character-name context signals**.
- Archive Deep Portfolio V1.2 now composes **four batches / 40 sources / 97.7
  hours / 1,216,993 words / 173,675 caption events / 166 quarantined moments /
  52 character signals**.
- Archive Atlas now reports **74 deeply indexed, 390 metadata-only, and 8
  caption-limited records**, or **15.7% deep coverage**, across the same 472
  cached feed records. All forty Archive Deep sources are excluded from the
  next queue.
- Ask recognizes Batch 04, Batch 4, Batch04, and fourth-batch grammar; routes
  all ten exact titles; and keeps source-audio, visual-result, character,
  sequel-number, and promotion firewalls closed.
- Archive Time Capsules now construct the four-batch portfolio. The 2022
  drawer exposes 3 Batch 04 sources / 10 candidates / 30 topic lanes, and 2025
  reconciles to 19 sources / 83 candidates / 190 topic lanes.

### Accuracy and authority boundaries

- All 166 current portfolio candidates remain machine-surfaced,
  speaker-undiarized, origin-unattributed, unreviewed, and promotion-forbidden.
- Three Batch 04 trailer-audio-sensitive sources remain topic-only. Two
  tier-list sources cannot answer visual-result questions.
- One official caption track spans 96.03% of cached runtime and remains
  `limited-available-track`; it is not silently presented as complete or
  replaced with a different source.
- Time Capsule runtime construction can no longer fail optional Archive Deep
  enrichment merely because it still supplied three batches. Object-shaped
  batch provenance renders its ID rather than `[object Object]`.
- Batch 04 keeps `fnv1a32:56ca74df`; the four-batch portfolio keeps
  `fnv1a32:14050c7a`; Atlas keeps
  `sha256:c22572b2795edc2feb562362073eb8967a6f82793131d1e6671f42f9ac7579ac`
  and runtime fingerprint `fnv1a32:0db0b888`.
- The complete Ask/search matrix passes **128/128** subtests. The archive
  integration gate passes **95/95** tests. These are structural and retrieval
  checks, not editor review, source authenticity, rights clearance, or creator
  certification.

## 0.5.11 — V5.11 Ask the Tape: Answer Frame V2 — 2026-07-24

### Added

- **Answer Frame V2** compiles action, evidence scope, primary target,
  secondary targets, request predicate, selector, and follow-up anchor before
  retrieval.
- Secondary target terms survive a film, source, franchise, or character
  match. A candidate must provide semantic target coverage before archive heat
  or curated priority can order it.
- Source-first temporal routing selects the newest or oldest requested
  commentary before retrieving its indexed moments, and labels the result as
  an archive route rather than a movie plot summary.
- Spelled limits, non-contiguous coverage negation, watch-along wording, play
  commands, and character profile / performance / mention phrasing receive
  separate answer contracts.
- Exact result context now anchors next, previous, there, replay, and another
  follow-ups to the selected source and second.
- Global “craziest” requests continue to hand off to Red Band 100. Global
  “funniest” or “laugh hardest” requests now hand off to the Comedy Black Box
  instead of receiving an invented independent winner.

### Accuracy and authority boundaries

- A correct upload title is no longer accepted as a correct content answer.
  The requested secondary target must be present in bounded indexed evidence.
- Missing subtopics return an honest zero-receipt refusal instead of an
  unrelated high-heat tangent.
- Character profiles, broad caption signals, and timestamp-validated curated
  performance candidates remain distinct evidence classes.
- Query-frame concepts are channel-neutral; WWAM entities and presentation
  still come from the checked-in ChannelPack and corpus.
- The release passed **122/122 Ask/search subtests**, including the complete
  **157-query adversarial corpus**, plus **8/8 focused V5.11 cases**. This is an
  executable regression gate, not a claim that natural-language retrieval is
  universally solved.
- No change grants speaker diarization, true-origin proof, creator approval,
  plot knowledge, or promotion authority to Ask.

## 0.5.10 — V5.10 Comedy Black Box — 2026-07-24

### Added

- **Comedy Black Box / Riff Autopsy** turns every existing Riff Chemistry card
  into an inspectable deterministic score instead of adding another homepage
  feature panel.
- The engine validates **301 promoted chemistry anchors across 69 sources**
  against the complete **74-source / 872-receipt** promoted ledger.
- Each inspection exposes the six declared dimensions—28% source heat, 20%
  escalation, 16% callback density, 16% derailment, 14% room break, and 6%
  topic collision—and refuses any score drift.
- Runway, Impact, and Aftershock controls open official YouTube playback at a
  bounded 15-seconds-before / 20-seconds-after context window with no autoplay.
- Same-source prior and next promoted receipts become explicitly non-causal
  navigation aids within a declared fifteen-minute neighborhood.
- A compact, independently re-verifiable one-riff packet makes a selected
  autopsy shareable without copying the roughly half-megabyte full audit
  ledger. The complete 301-anchor snapshot remains a separate release API.

### Accuracy and authority boundaries

- The Black Box reproduces an existing declared rank; it does not claim to
  explain why a joke worked or predict audience response.
- The 301-anchor ledger has **zero score drift**. Exactly **13** bounded
  excerpts contain one of the narrow literal reaction cues; **288** correctly
  remain `UNKNOWN`.
- Evidence tier remains visible: **276 machine-level anchors and 25
  timestamp-validated human-curated candidates**, with no silent editor or
  creator certification.
- Literal reaction language does not establish who reacted or whether it came
  from a host, guest, source audio, or another voice. Speaker stays null.
- Nearest receipts do not establish setup, payoff, intent, continuity, or
  causality. Context coordinates do not reconstruct dialogue.
- Twenty-four exact fractional source indexes remain fingerprint-bound while
  public YouTube playback explicitly normalizes down to a whole second.
- Quarantined or promotion-denied inputs, changed entity or evidence binding,
  recomputed basis drift, formula drift, hostile prototypes, circular or
  non-JSON values, and order-dependent ledger changes are covered by the
  fail-closed release suite.
- Exports cap excerpts at sixteen words and reject transcripts, captions, and
  full event arrays. FNV fingerprints detect structural change only; they are
  not identity, ownership, source-authenticity, review, or approval proof.

## 0.5.9 — V5.9 Archive Time Capsules — 2026-07-24

### Added

- **The Years Have Teeth** opens every cached Atlas year from 2018 through
  2026 as a deterministic Archive Time Capsule.
- **The Marquee** reconciles exact cached-feed record counts, runtime, cached
  views, coverage, and leading uploads without assigning content knowledge to
  metadata-only records.
- **What the Tapes Remember** separately counts and samples promoted-corpus
  sources and timestamped receipts dated to the selected year.
- **The Quarantine Drawer** separately counts Archive Deep sources,
  caption-derived topic lanes, and machine candidates. Its candidates remain
  non-promotable and speaker-undiarized.
- **Play the Year** assembles up to five official YouTube timestamp stops with
  no autoplay. Copy and download controls produce reproducible, bounded
  evidence manifests rather than transcript exports.
- The capsule engine is channel-neutral. WWAM personality is supplied through
  a presentation-label adapter so the three-ledger pattern can be reused for
  other YouTube channels and racing seasons.

### Accuracy and authority boundaries

- The 2019 capsule preserves two non-overlapping ledgers: **21 metadata-only
  cached Streams-feed records** and **12 separately indexed commentary sources
  with 96 timestamped promoted receipts**.
- Lore's twelve zero-second 2019 archive-source openings are inventory entry
  points, not additional spoken moments.
- The 2024 and 2025 promoted-memory ledgers are honestly empty. Their **19**
  and **68** playable Archive Deep candidates remain visibly quarantined.
- Cached views are snapshot observations, not current totals or unique
  audience. Atlas counts cover the cached Streams feed, not every upload ever
  published by the channel.
- Metadata-only sources never receive inferred topics, quotes, sentiment, or
  descriptions. Quarantine items never receive promotion, canon, speaker,
  performer, true-origin, or visual-context claims.
- Capsule fingerprints are deterministic structural change detectors, not
  signatures or proof of authenticity, ownership, authorship, review, rights,
  or creator approval.
- Capsule exports omit raw transcripts, caption payloads, and full event
  ledgers and fail closed when their bounded evidence packet is altered.

## 0.5.8 — V5.8 three-batch evidence depth and Ask review — 2026-07-24

### Added

- **Archive Deep Batch 03** freezes and caption-audits the exact next ten Atlas
  priority sources after Batch 01 and Batch 02 exclusion. Two source-audio-risk
  records remain topic-navigation-only, four additional ranking records deny
  visual-context claims, and all 40 new moment candidates remain quarantined.
- **Archive Deep Portfolio V1** now composes three independently fingerprinted
  batches into one read-only surface: **30 sources, 77.2 hours, 957,430 words,
  136,539 parsed caption events, 300 topic lanes across 44 distinct topics, 131
  quarantined moments, 41 source-level character signals, 9 topic-only
  source-audio firewalls, 10 special visual-ranking quarantines, and 335,489
  cached snapshot views**.
- The combined portfolio fingerprint is `fnv1a32:8e474ea8`. It retains the
  independent Batch 01, 02, and 03 public fingerprints
  `fnv1a32:17045a51`, `fnv1a32:bcea5692`, and `fnv1a32:f79f2399`.
- Archive Atlas now reports **64 deeply indexed, 400 metadata-only, 8
  caption-limited, and 0 unavailable records**, or **13.6% deep coverage**,
  across the unchanged 472-record cached feed. All 30 Archive Deep sources are
  excluded from Distill Next.
- **Ask Review Queue V1** turns a rendered Ask answer into a device-local,
  append-only review proposal. The packet retains the query and rendered
  receipt coordinates and can optionally propose a better source, whole
  second, expected answer, or editor note.

### Accuracy and authority boundaries

- Ask review packets are unverified proposals. They perform no automatic Ask,
  Canon, certification, corpus, or promoted-ledger mutation and do not
  authenticate the operator.
- All 131 Archive Deep moment candidates remain machine-surfaced,
  speaker-undiarized, origin-unattributed, unreviewed, and
  promotion-forbidden. All 30 sources forbid visual claims; the 10-count is
  the special visual-ranking quarantine lane, not a verified-visual count.
- The current promoted-plus-quarantine overlay covers **104 inputs: 101
  caption-audited and 3 sealed or limited, 2,838,303 audited words, and about
  248.4 hours**. Promoted counts remain **872 receipts and 168 core memory
  nodes**.
- The immutable V5.4 proof remains exactly **84 inputs, 2,175,344 audited
  words, 194.9 caption-audited hours, 872 promoted receipts, 42
  then-quarantined Batch 01 candidates, and 168 promoted core memory nodes**.
  The current V5.8 overlay does not retroactively rewrite that named proof.
- Portfolio and batch FNV values are deterministic structural change detectors,
  not signatures or proof of authenticity, authorship, review, speaker
  identity, visual context, rights, or creator approval.

## 0.5.7 — V5.7 Archive Deep Portfolio — 2026-07-24

### Added

- **Archive Deep Batch 02** freezes and caption-audits the exact next ten
  eligible Archive Atlas priority records after Batch 01 exclusion. Its
  priority is the declared combination of cached-view gravity, upload recency,
  and configured franchise-title signals—not raw view rank, popularity rank,
  or a claim about content quality.
- **Archive Deep Portfolio V1** validates and composes the two independent
  ten-source batches into one read-only discovery and quarantine surface. It
  preserves both batch selections and fingerprint chains, rejects duplicate
  source identities or priority drift, and emits its own
  structural-change-detection fingerprint.
- The current overlay spans **20 caption-audited sources, 46.8 hours, 579,003
  words, 82,551 parsed caption events, 200 topic lanes across 42 distinct
  topics, 91 quarantined public moment candidates, 23 source-level
  character-signal records, 7 topic-only source-audio firewalls, and 214,278
  cached snapshot views**.
- Archive Atlas now reports **54 deeply indexed, 410 metadata-only, and 8
  caption-limited records**, or **11.4% deep coverage**, across its unchanged
  472-record cached Streams-feed snapshot.
- A twelve-query portfolio audit matrix covers counts, batch filtering,
  priority explanation, dated view sorting, topic and moment retrieval,
  speaker abstention, character-signal boundaries, source-audio firewalls,
  visual-context abstention, and promotion refusal.

### Accuracy and release boundaries

- All 91 portfolio moments remain machine-surfaced, speaker-undiarized,
  origin-unattributed, unreviewed, and quarantined. They do not enter the
  promoted 872, Canon, Red Band, WWAM UP IN YA, character voice, or
  creator-approved inventory.
- The 23 source-level character-signal records are not 23 people,
  performances, verified appearances, or clip-level speaker attributions.
- Seven trailer, script-reading, or watch-party uploads are
  topic-navigation-only. Six sources—three in each batch—occupy the special
  visual-ranking quarantine lane. All 20 sources forbid visual claims; the
  six-count never meant the other 14 had verified visuals.
- Each batch retains independent selection, caption-set, and public-stream
  fingerprints. The portfolio adds a composition fingerprint. Every FNV value
  is a deterministic structural change detector, not a signature or proof of
  authenticity, authorship, review, speaker identity, rights, or approval.
- The immutable V5.4 proof remains exactly **84 inputs, 2,175,344 audited
  words, 194.9 caption-audited hours, 872 promoted receipts, 42
  then-quarantined Batch 01 candidates, and 168 promoted core memory nodes**.
  V5.7's twenty-source portfolio is a current overlay, not a retroactive
  rewrite of that named proof snapshot.

## 0.5.6 — V5.6 bounded fresh-tape intake — 2026-07-24

### Added

- **Fresh Tape Intake V1** provides a universal, browser-safe intake boundary
  for a newly supplied YouTube source and transcript. The 67,182-byte engine
  supports WebVTT, SRT, YouTube JSON3, and plain text, and its focused contract
  suite contains 23 cases.
- Timed transcripts produce deterministic topic and signal candidates bound to
  a declared ChannelPack lane, exact source ID, canonical official YouTube URL,
  source date, duration, caption event, literal matching rule, and indexed
  second.
- Untimed plain text enters a visible `held` state with
  `UNTIMED_TRANSCRIPT` and zero candidates. The system does not manufacture
  timestamps from paragraph order.
- Canonical JSON exports omit the raw transcript and bind the channel, current
  ChannelPack, intake rules, source, event ledger, bounded excerpts, and all
  candidate derivations. `verifyExport()` rejects drift or tampering.
- ChannelPack now declares `fresh-tape-intake` as an implemented WWAM
  capability. The resulting V5.6 pack fingerprint is
  `cp1-8ac1488f4f78448c`.

### Accuracy and authority boundaries

- Intake performs no network fetch. The operator supplies both source metadata
  and transcript content.
- Official YouTube URL shape and exact video-ID agreement are validated, but
  channel ownership is explicitly `channel-ownership-unverified`.
- Every derived item remains machine-surfaced, unreviewed, quarantined,
  undiarized, and ineligible for promotion. Intake authenticates no reviewer or
  creator, certifies no speaker, and writes nothing into Canon, Red Band, WWAM
  UP IN YA, Lore, Ask, or any promoted receipt ledger.
- Every intake fingerprint is an FNV-based deterministic structural change
  detector only. `verifyExport()` reports `structural-change-detection-only`
  while keeping source-content, authenticity, and authority verification
  explicitly false. A match is not source proof, an identity signature,
  ownership verification, speaker attribution, rights clearance, or creator
  approval.
- Candidate-event receipts bind each public candidate to its exported event
  time, content fingerprint, public-excerpt fingerprint, and matched rule IDs
  without retaining raw transcript text. This prevents internal
  candidate/ledger drift; it remains structural consistency, not authenticity.
- Word, caption-event, and public-excerpt word ceilings are reinforced with
  maximum character counts per word, caption event, and public excerpt so a
  single giant token cannot bypass the public boundary.
- The same engine is exercised with WWAM and synthetic racing vocabulary.
  ChannelPack lanes, labels, literal rules, storage binding, and export
  fingerprinting change; the quarantine contract does not.

## 0.5.5 — V5.5 synchronized memory and creator-taste pass — 2026-07-24

### Added

- **Tape Companion V1** adds a synchronized memory rail beside the official
  YouTube player. Its playback UI exposes only crossed receipts through
  snapshot-safe and crossed-event APIs, supports share/restore state bound to
  the core archive and source ledgers, and retains manual sync plus official timestamp
  links when the player API is unavailable. The full compiled timeline remains
  an audit API rather than a playback feed.
- **Creator Taste Calibration V1 / The Cut Test** presents ten deterministic
  source-diverse matchups plus two side-reversed repeat checks. It learns only
  from explicit local A/B decisions, keeps the untouched machine shortlist
  visible, and caps every derived preference modifier at ±6.
- Ask WWAM's visible **Query Plan V1** separates subjects from controls and
  adds bounded collection counts/lists, year-scoped rankings, character
  roster/profile distinctions, curated performance-candidate versus broad
  mention counts,
  curated soundbyte limits, named navigation, and explicit surface handoffs.
  The frozen release gate expands from the historical V5.4 set to 37
  executable cases.
- The new fan and creator surfaces load through two declared feature chains
  after the main application. Their engines and UI adapters remain independent
  of the initial script bundle.
- ChannelPack now declares `tape-companion` and
  `creator-taste-calibration` as implemented WWAM capabilities. The resulting
  V5.5 pack fingerprint is `cp1-59e4817559149f96`.
- Character evidence now has a distinct **timestamp-validated human-curated
  candidate** tier: 25 current candidates, 0 authenticated editor-verified
  decisions, and no clip-level speaker diarization. “Editor verified” remains
  an explicit future production threshold requiring an authenticated
  surrounding-context decision.
- The Character pipeline is sealed to the promoted 74-source corpus and its 71
  available caption files; Archive Deep candidates cannot silently enter the
  current character set.

### Accuracy and product boundaries

- Tape Companion does not copy media or infer audience sentiment, and its
  player keeps autoplay off. The playback UI's snapshot-safe and crossed-event
  calls do not disclose a future event's label, excerpt, or annotations before
  its indexed second is crossed.
- The promoted corpus has 71 companion-ready sources and three disclosed
  source-only gaps. Compatible events may fuse into an incident, but every
  exact member and timestamp remains preserved.
- Creator Taste Calibration labels the operator unauthenticated. `NEITHER` and
  `NEEDS_CONTEXT` add no preference weight, at least six non-repeat A/B choices
  are required, and the model cannot mutate evidence, risk, HOLD, approval,
  canon, speaker, rights, or creator-approval state. Each emitted shortlist
  card is compared with a fresh protected projection and artifact creation
  fails closed on any mismatch.
- The declared calibration goal is visible and fingerprint-bound but
  descriptive in V1. It does not silently filter or widen the inventory.
- Companion core-ledger fingerprints and calibration fingerprints/checksums are
  deterministic consistency bindings, not signatures, identity authentication,
  or proof of creator approval. Optional companion display decorations are not
  part of its core share binding.
- Questions owned by a ranked or specialized surface return an explicit
  handoff instead of fabricating a competing global answer.
- Clip Lab keeps the owner-mapped recurring performer in a separate
  `mappedPerformer` field while leaving clip-level `speaker.display` null and
  speaker credit disabled. Canon Integrity V1.1 rejects mismatched performer
  mappings and requires both authenticated creator certification and an
  explicit clip-attribution certification before any named clip credit can pass.

### Current deterministic derivations

These figures reproduce from the named V5.5 snapshot. The regression suite
directly pins the companion corpus/readiness, receipt-member, heat-window, and
annotation totals plus the 37-case Ask gate; incident fusion, Lore-link, July
subgroup, and real-WWAM calibration totals are current derivations rather than
separate numeric release assertions.

- Tape Companion compiles 872 exact receipt members into 869 conservative
  incidents, including three fused incidents, across the promoted 74-source
  corpus. It derives 1,294 heat windows, 96 Red Band annotations, 25 WWAM UP IN
  YA annotations, 25 recurring-character annotations, and 2,967
  receipt-backed Lore connections.
- The July 23, 2026 showcase source contains 21 exact receipt members, 30 heat
  windows, eight topic signals, seven Red Band candidates, and six
  recurring-character annotations. At `2:30:43`, the separate `FULL SEND`
  event at `2:30:46` remains sealed.
- With the `MEDIUM` maximum-risk gate, Creator Taste Calibration finds 248
  exact-ledger eligible candidates across 54 sources from the 560-candidate
  Clip Lab pool. Its 10 learning matchups plus 2 non-learning repeat checks
  currently sample 20 unique sources.
- The current Ask release gate contains 37 executable cases. Unqualified Dr.
  Loomis clip/how-often questions return 7 timestamped human-curated
  performance candidates; explicit mention wording returns 696 broad caption
  matches across 59 sources. The current set contains 0 authenticated
  editor-verified decisions.
- Lore Galaxy now exposes 177 field-guide entries, 822 receipt-backed graph
  edges, 19 constellations, and 51 indexed lineages. Character-performance
  receipts and source/context receipts are separate relationships; only the
  former can establish an archive-first performance candidate.

## 0.5.4 — V5.4 archive-deep, retrieval, and creator-pilot pass — 2026-07-24

### Added

- Archive Deep Batch 01 converts the first frozen ten records from the Archive
  Atlas Distill Next queue into a separate caption-audited lane. Its compact
  public artifact exposes bounded topic navigation, review-required machine
  candidates, source dossiers, provenance, and reproducible fingerprints
  without publishing full captions.
- An **Autopsied Batch 01** Atlas row opens all ten newly distilled source
  dossiers while keeping the remaining metadata queue and its evidence
  boundary visible.
- Ask WWAM can retain result-anchored source, timestamp, kind, and entity
  context for “that one,” “who said that?,” “what happened next?,” and a
  most-viewed-source-to-funniest-moment follow-up. Opinion questions require
  target-proximate evaluative evidence and abstain when that evidence is not
  present. Context-bearing answer links replay the exact bounded receipt after
  a reload, while numbered source titles, restricted source-audio firewalls,
  and contextless speaker pronouns fail closed.
- Natural questions about the latest livestream's topics, a recurring
  character's first appearance, and what happened after a named bit now route
  to one evidence-bounded source instead of broad lexical collateral.
- A frozen 22-case Ask truth set covers promoted content retrieval, quarantined
  Archive Deep candidates, exact Red Band rank lookup, Archive Atlas metadata
  discovery, context, and honest abstention.
- Correction Ripple adds a deterministic dry-run blast-radius report to every
  Trust Desk correction packet. It separates exact-receipt dependencies from
  same-source-only dependencies across nine registered Showcase surfaces.
- Red Band Memorability Candidate Index V2.1 adds deterministic Top 25
  diversity caps, exact rank/range queries, inspectable baseline deferrals, and
  candidate-specific ranking explanations. A language-neutral
  caption-coherence gate removes thin filler fragments from the Top 25 without
  penalizing wild or profane vocabulary. The raw machine score remains
  distinct from post-diversity rank.
- Mike Mode now closes on a measurable Creator Pilot. Clip Lab's
  **Tonight's 12** is explicitly a first editorial pass, not an automated
  publish queue, and the final proof action opens the Archive Discovery pilot
  with outcomes still marked `MEASURE DURING PILOT`.
- ChannelPack V1 turns the universal-core claim into an executable,
  downloadable contract. The same fail-closed compiler now validates WWAM and
  a synthetic racing fixture across identity, source lanes, taxonomy, evidence
  policy, update workflow, storage isolation, surface vocabulary, and
  capabilities; canonical fingerprints expose policy drift and the portfolio
  validator rejects channel or namespace collisions.

### Accuracy and evidence boundaries

- The stable proof reports a preserved July 23 source snapshot, with Archive
  Deep Batch 01 audited July 24: 84 total source inputs, 81 caption-audited
  inputs, 3 sealed or limited inputs, 2,175,344 audited words,
  194.89 caption-audited hours, 201.15 hours of known runtime, 872 promoted
  receipts, and 168 core memory nodes in the 74-source promoted corpus.
- Archive Deep Batch 01 contributes 10 streams, 23.7 audited hours, 294,471
  words, 43,585 parsed caption events, 100 topic lanes, 42 public machine
  candidates, and 12 character signals.
- Four trailer, script-reading, or watch-party sources are
  topic-navigation-only. They publish no excerpts, comedy candidates,
  character candidates, or heatmaps that could misattribute source audio as
  host speech.
- All 42 Archive Deep machine candidates remain outside the promoted 872,
  Canon, Red Band, and WWAM UP IN YA. Playback review can establish context but
  does not promote one candidate across those separate lanes; each applies its
  own evidence policy and authenticated decision requirements. Automatic
  captions do not establish the speaker, host-versus-source-audio origin,
  intent, or visual context.
- The Trust Desk's 71 healthy and 3 gap counts remain explicitly scoped to the
  74-source promoted corpus. Archive Deep is reported separately rather than
  being silently merged into the legacy Trust/Canon contract.
- Source artifacts are pinned to LF checkouts so generated fingerprints and
  tested byte budgets remain reproducible on Windows as well as Linux.
- Deferred Trust/Ripple loading reduces the static script payload to 1,255,382
  bytes (1,432,954 including styles). The two-row mobile header keeps every
  primary route reachable, and Clip Lab mode buttons expose their selected
  state to assistive technology.
- Correction Ripple blocks partial impact claims when evidence is missing or
  mismatched, performs no canon mutation, and explicitly reports Ask the Tape
  and Clip Lab as `NOT_REGISTERED` rather than inventing an effect.

### Current measured proof

- Archive Atlas: 472 cached feed records, with 44 deeply indexed, 420
  metadata-only, 8 caption-limited, and 0 records classified unavailable in
  the cached snapshot. Current availability was not rechecked. Deep coverage
  is 9.3%.
- Archive Deep Batch 01: 10 caption-backed sources, 4 restricted
  topic-navigation-only sources, and 42 review-required machine candidates.
- Promoted memory corpus: 872 bounded receipts and 168 core memory nodes;
  Archive Deep candidate promotion remains zero.
- Red Band Top 25: 8 categories, 21 source videos, 5 explicit lexical hits, 8
  preselected candidates, 0 relaxed selections, and 0 caption-coherence
  failures. Mean coherence is 73.76; minimum is 58.93.
- Correction Ripple: 1,374 registered records across nine surfaces; all 95
  correction packets include a dry run, with 90 complete and five stopped
  closed on unresolved evidence. The packet-level aggregate contains 904
  exact-receipt and 2,403 source-only dependency records.

## 0.5.3 — V5.3 archive breadth and memorability pass — 2026-07-23

### Added

- Archive Atlas V1 maps all 472 records in the cached official Streams-feed
  snapshot from 2018–2026: 1,197.0 hours and 5,674,608 cached views. It
  distinguishes 34 caption-backed deep records, 430 metadata-only records, 8
  caption-limited records, and 0 records classified unavailable in that cached
  snapshot without treating a title or thumbnail as transcript knowledge.
  Current availability was not rechecked.
- Year, month, title-metadata, and evidence-depth browsing with explicit
  snapshot provenance, deterministic fingerprints, original-source links, and
  an Ask WWAM source-discovery fallback that is visibly separate from content
  answers.
- An inspectable Distill Next queue. Its score is limited to cached-view
  gravity, upload recency, and configured franchise-title signals; missing
  evidence controls eligibility but contributes no score.
- Red Band Memorability Index V2 ranks exactly 100 playable receipts from 567
  deduplicated candidates across commentaries, the Fresh 10, and Popular 25.
  The current list spans 52 sources and publishes a short “why memorable”
  explanation plus percentile signal bars on every card.
- Exact Ask WWAM retrieval for a Red Band rank, bounded rank range, or top-ten
  cut, plus a downloadable JSON ranking snapshot with score components,
  provenance, uncertainty, and methodology.
- A sixth Mike Mode proof beat that exits the pitch directly into the
  472-record Archive Atlas and its visible coverage gaps.
- A zero-default editorial-vote hook, an off-by-default recency adjustment,
  unique content-derived rank keys, collision diagnostics, and transparent
  tie handling for the Red Band 100.

### Accuracy, access, and performance

- Archive metadata search never claims to search captions. Current
  availability was not rechecked; cards say they were present in the cached
  July 23 snapshot.
- “Most viewed,” “oldest,” and “newest” archive-discovery questions apply
  their requested metadata ordering after title matching instead of implying
  that relevance order is a date or view selector.
- The Archive Atlas data, engine, and interface are lazy-loaded near the
  section or on an explicit archive question. The static first-load payload
  remains inside the 1.5 MB release budget.
- Atlas loading, filtering, generated controls, and failures expose live
  status, `aria-busy`, disabled-control, and keyboard-focus behavior.
- Memorability scores do not infer a host, true origin, or synthetic quote.
  Recency supplies zero default points and unsupplied editorial votes are
  literal zero.

### Current measured proof

- Archive Atlas: 472 cached feed records, 2018–2026, 1,197.0 known hours,
  5,674,608 cached views, and a reproducible 430-item metadata-only distill
  queue.
- Memorability Index: 692 input contributions, 567 unique playable receipts,
  100 unique ranked receipts, 52 ranked sources, 7 equal-score groups, and 0
  rank-key collisions.

## 0.5.2 — V5.2 return, review, and creator-pilot pass — 2026-07-23

### Added

- Night Shift, a deterministic daily fan journey across the newest indexed
  source, an honest older callback, a playable receipt, a grounded Trivia or
  preference choice, and a closing payoff. Lore, Chaos, and Franchise modes
  preserve all five semantic roles across three-, four-, or five-beat cuts.
- Shareable Night Shift seeds bound to the archive fingerprint, local ordered
  progress, canonical-response-checked restore, date-controlled rotation, and
  explicit current/recent/stale snapshot language.
- Human Review Session, a local proof-chained editorial ledger covering 95
  Trust findings plus 362 Canon warnings. Its 457 candidates can move through
  needs-context, wording-checked, reject-candidate, and
  ready-for-creator-review states without mutating canon.
- Creator Pilot Builder with four narrow proposals: Archive Discovery,
  Compilation Workflow, Fan + Member Experience, and Recurring Lore System.
  Each export includes current snapshot counts, source receipts, acceptance
  checks, human gates, a measurement contract, and a deterministic consistency
  ledger. The fingerprint is reproducibility evidence, not an owner signature.
- Working public interfaces for all three systems, including Night Shift
  playback and choices, Canon Desk review decisions, and JSON/Markdown pilot
  exports.
- Character Intelligence V2 connects Ask WWAM to 25 curated recurring-character
  performance receipts. Latest, earliest, funniest, specific-bit, typo-alias,
  and owner-mapping questions now resolve through the character evidence lane
  while clip-level speaker claims remain locked.

### Accuracy and safety

- Corrected Popular 25 heatmap documentation from 750 to 720 caption-backed
  chapters and separated 171.19 caption-audited hours from the preserved
  snapshot's 177.45 hours of known source runtime.
- Recovered factual metadata for age-gated commentary `AzrcgoyE7C4` while
  retaining its sealed, zero-receipt status; no transcript or moment was
  invented.
- Future source rebuilds accept or derive an explicit timezone-aware
  observation time. Fresh-stream selection verifies completed live status;
  provenance records include ordered feed/source fingerprints and cutoff
  evidence where applicable.
- Night Shift public evidence is capped at 16 words, links to the original
  source second, and permanently reports zero speaker, true-origin, and
  synthetic-quote claims.
- Human Review positive progression requires an explicit caller attestation,
  reviewer role, notes, a human-entered timestamp, and a registered playable
  receipt whose source, URL, and timestamp match the indexed evidence.
  Wording-checked decisions require exact reviewed wording; the next state
  cannot silently change it.
- Review snapshots bind to the complete source/receipt, Trust, Canon, and
  candidate corpus. Inconsistent data or a changed corpus fails closed. The
  local attestation is recorded but does not authenticate reviewer identity.
- Local review cannot certify a creator, identify a speaker, promote a claim
  into canon, or alter the source candidate. Those metrics remain permanently
  zero.
- Pilot briefs begin as `DRAFT / HUMAN APPROVAL REQUIRED`, with results marked
  `MEASURE DURING PILOT`. The builder does not invent conversion, retention,
  revenue, labor savings, rights clearance, or creator endorsement.
- Character intent parsing now uses token and phrase boundaries, explicit topic
  switches override stale follow-up context, unknown voice banks fail closed,
  and urgent medical, self-harm, violent-intent, or real-person allegation
  prompts do not get recycled into parody dialogue.
- Archive metrics now distinguish 171.19 caption-audited hours from 177.45
  hours of known runtime and correct the Popular 25 to 720 caption-backed
  heatmap chapters. Rob Zombie's Halloween II retains recovered factual
  metadata while remaining visibly uncaptioned with zero invented receipts.
- Future distill runs record timezone-aware observation times, input
  fingerprints, completed-livestream status, and Popular ranking cutoffs
  instead of relying on hard-coded generation dates.

### Current measured proof

- Night Shift composes 74 indexed sources, 872 playable receipts, 71 dated
  playable sources, and 177 Lore Field Guide entries.
- The Human Review Session binds 457 local findings with zero automatic
  decisions, zero canon mutations, and zero speaker or creator certifications.
- All four pilot types reproduce deterministically from the same indexed
  snapshot and passed semantic-safety, corruption, boundary, and export tests.

## 0.5.1 — V5.1 accuracy and creator-operations pass — 2026-07-23

### Added

- A 157-query adversarial Ask WWAM benchmark spanning exact facts, aliases,
  characters, chronology, selectors, absence, follow-ups, typos, ambiguity,
  and unsupported-claim attempts.
- Cold Open Factory with 117 deterministic 15/30/60/90-second storyboards,
  gapless pacing slots, 163 receipt references across 67 sources, exact
  edit-decision ledgers, and zero inferred speakers.
- A deterministic Canon Integrity release audit that cross-checks source and
  receipt IDs, timestamp bounds, speaker claims, evidence levels, graph and
  lineage references, public excerpt policy, campaign ledgers, manifests, and
  approval gates. The current fingerprinted report has zero hard errors.
- A release-surface contract covering local assets, hash routes, accessibility
  relationships, runtime element lookups, social metadata, payload budgets,
  and documentation/version alignment.
- A visible freshness ledger that distinguishes index snapshot date, newest
  indexed source, and current/aging/refresh-due status.

### Improved

- Ask WWAM's adversarial pass rate rose from 114/157 (72.6%) to 157/157
  (100%). Fixes cover boundary-safe subject matching, conservative typo
  recovery, selector synonyms, yes/no presence questions, follow-up context,
  and broader refusal of unsupported speaker/performance claims.
- `ice cream` no longer collides with `Scream`, and short substrings no longer
  earn topic evidence through unrelated words.
- Creator Clip Lab and Cold Open public exports hard-cap archival fragments at
  16 words with explicit truncation metadata while leaving longer raw captions
  available only as internal audit warnings.
- Mike Mode's commercial proof now exits directly into a working 30-second
  Loomis cold-open storyboard and exact source ledger.
- Source health copy now states exactly what the structural audit proves:
  source URL/ID agreement and in-range indexed timestamps, not continuous
  network availability.

## 0.5.0 — V5 product pass — 2026-07-23

### Added

- Three hero doorways for Fan Experience, Deep Dive, and Creator Proof.
- Tape Trivia with deterministic 5/10-round sessions, five question modes,
  source filters, scoring, streaks, exact-timestamp reveals, Evidence Bag
  support, and JSON session export.
- Lore Galaxy with 177 field-guide entries, 821 receipt-backed graph edges, 19
  constellations, 51 indexed lineages, and 23 discovery prompts.
- Creator Clip Lab with 560 Short candidates, 32 multi-source supercut bundles,
  21 then/now resurfacing opportunities, risk gates, campaign selection, and
  deterministic JSON manifests.
- Fingerprinted campaign-selection snapshots that preserve the exact receipt
  and source ledger for filtered packages across reloads.
- Trust / Canon Desk with source-health reports, a 95-item human review queue,
  correction packets, character attribution firewalls, claim audits, and local
  community contribution packets.
- Evidence Bag actions across Ask WWAM, Character, Memory, Lore, Trivia, and
  Creator surfaces.
- Live proof actions in every Mike Mode slide.

### Improved

- Ask WWAM now uses exact entity scoping, aliases, query selectors, follow-up
  context, evidence-level explanations, limitations, counterpoints, and
  recommended next surfaces.
- Exact-title and character-origin questions now distinguish an early
  machine-indexed signal from the narrower curated Lore receipt set.
- Owner-provided recurring-character mappings are separated from the fact that
  individual auto-caption clips are not speaker-diarized.
- A valid source timestamp is explicitly separated from human verification of
  wording, target, intent, category, or speaker.
- Ask the Character handles follow-ups and keeps generated riffs separate from
  archival captions.
- Clip cards now display source title and date, proposed edit boundaries,
  evidence status, contextual risk, and suggested-copy labels.
- The Clip Lab Risk Gate now uses one maximum-risk contract: LOW returns only
  LOW material, while progressively higher selections include that level or
  safer.
- Filtered campaign supercuts now reconstruct from their saved receipt IDs and
  fail closed on missing or altered proof instead of widening to a parent
  bundle.
- Source metadata, source-level derived summaries, timestamped machine
  receipts, editor-verified events, and creator-certified claims are named as
  distinct evidence layers.
- Deep engines initialize in staged failure boundaries so one optional surface
  cannot strand the rest of the experience.
- Mobile navigation, focus visibility, dialog focus handling, live regions, and
  small-screen heading behavior were strengthened.
- Reduced-language mode now refreshes Ask, Trivia, the Evidence Bag, active
  soundbytes, character answers, and derived labels without recomputing or
  changing an answer's evidence chain.
- Clipboard and restricted-storage failures now degrade to a manual-copy path
  or clearly labeled tab-only state instead of reporting false durability.
- Community timestamps reject malformed or overflowing clock fields, and
  corrected form values immediately clear prior validation errors.
- Legacy micro-labels were raised to a readable 9–10px floor across the
  Popular 25, Memory OS, heat maps, receipts, Trivia, Clip Lab, and Canon Desk.
- Hero rotation pauses for keyboard focus, hover, hidden tabs, and every open
  dialog, including the first-visit content advisory.

### Trust and editorial controls

- Public archival excerpts are capped at the display layer.
- Generated character audio remains blocked.
- Ordinary character mentions are excluded from curated performance sets.
- “First ever” language is replaced by “earliest in the indexed archive” unless
  creator certification exists.
- Take Time Machine and WWAM Court are explicitly presented as inference and
  argument surfaces; the strict gate currently promotes none of their claims to
  creator canon.
- Popularity remains a dated view-count observation, never a permanent rank.
- The 3 caption-limited sources remain visible rather than receiving fabricated
  analysis.

### Current measured proof

- 74 unique sources; 71 healthy and 3 caption-limited.
- 1,880,873 audited caption words across 171.19 captioned hours, with 177.45
  hours of total known runtime including disclosed caption gaps.
- 872 bounded editorial receipts with 0 structurally invalid or
  source-ID-mismatched URLs and 0 out-of-range indexed timestamps.
- 847 machine-level receipts and 25 human-curated character-performance
  candidates; no authenticated editor-verification decisions are claimed.
- 0 creator-certified receipts in the current public snapshot.
- 25 curated character-performance receipts and 12 ordinary mentions
  quarantined from that set.

### Explicit prototype boundaries

- No media download, editing, hosting, or publishing.
- No automatic speaker attribution from captions.
- No voice cloning.
- No rights clearance or platform-safety approval.
- No shared account, server-side editorial queue, or creator certification
  workflow yet.
- No claim of virality, conversion lift, or revenue performance.
