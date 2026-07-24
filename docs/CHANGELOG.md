# Product changelog

This changelog records product and evidence-contract changes. It does not by
itself indicate that a build has been deployed.

## 0.5.3 — V5.3 archive breadth and memorability pass — 2026-07-23

### Added

- Archive Atlas V1 maps all 472 records in the cached official Streams-feed
  snapshot from 2018–2026: 1,197.0 hours and 5,674,608 cached views. It
  distinguishes 34 caption-backed deep records, 430 metadata-only records, 8
  caption-limited records, and 0 unavailable records without treating a title
  or thumbnail as transcript knowledge.
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
