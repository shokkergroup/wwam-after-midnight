# Product changelog

This changelog records product and evidence-contract changes. It does not by
itself indicate that a build has been deployed.

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
  topic-navigation-only. Six visual-context-unverified sources—three in each
  batch—can expose bounded caption navigation, but their visual ranking context
  remains unverified.
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
