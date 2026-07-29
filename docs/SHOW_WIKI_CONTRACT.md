# Per-Show Wiki Contract

The per-show Wiki turns one canonical upload into a video-first, source-locked
episode page. **Version 1.5** adds a validated, metadata-only Source Brief for
uploads whose contents have not been distilled, plus conversational Ask aliases
that still resolve inside one exact source. Receipt-backed pages retain their
recap, watch path, persistent playback context, and responsive in-page
navigation. **Aftermath Pack V1** adds a source-bound creator review desk
without changing the episode's evidence or authority.

The visible WWAM experience is authored for WWAM. The evidence, query,
playback, and rendering contracts underneath it are channel-neutral.

## Product promise

A visitor opening one upload should be able to:

1. understand what kind of show it is and what the registered evidence supports;
2. jump directly to exact topics or memorable source moments;
3. ask a question about this episode without receiving another episode's answer;
4. keep the currently selected receipt, bounds, and lane visible while watching;
5. receive a useful Source Brief, or a fail-closed queued state, when the
   archive does not know enough about the upload's contents;
6. when registered production artifacts exist, inspect and locally route the
   exact show's creator opportunities without leaving its source boundary.

A Show Wiki is navigation over registered evidence. It is not a transcript,
speaker diarization system, objective review, rights decision, creator approval,
or replacement for the official upload.

## The per-show Aftermath desk

Aftermath joins the already-validated Source Dossier to Creator Clip Lab and
the available show-delta and Cold Open Factory records. The resulting desk
stays bound to one source ID, source fingerprint, dossier fingerprint, archive,
ChannelPack, and production build.

Its production-opportunity total includes only source-local Short candidates,
supercut memberships, and resurfacing pairs. Reference lineages and generated
cold-open storyboards render separately and do not inflate that total. The July
23, 2026 proof source `LV2rmwEA0w4` contains 21 registered receipts and exactly
23 opportunities: 13 Shorts, six supercut memberships, and four resurfacing
pairs. Its four reference lineages and nine separate storyboards are disclosed
as different inventory units.

Keep, Hold, and Reject mean **keep for creator review**, **hold for more
context**, and **reject from this local pack**. They are local editorial routing
states, not authenticated creator decisions. Review restore and editor export
bind the exact source, pack, Clip Lab build, decisions, and fingerprints; drift
or tampering fails closed.

The exported handoff separates kept, held, quarantined, rejected, and
unreviewed work. It includes bounded coordinates and evidence records, not
media, rights clearance, speaker inference, creator approval, publishing
authority, or a performance promise. See
[The Aftermath Pack](AFTERMATH_PACK.md).

## Universal core

The Source Dossier engine accepts a generic `showWiki` object with five
independently validated layers:

| Layer | Portable contract |
| --- | --- |
| `recap` | Detected format, title-specific overview, query aliases, and one to four narrative blocks bound to local receipt keys |
| `experience` | Adapter-named watch path, query aliases, route receipt keys, pulse receipt keys, selection basis, and honest empty state |
| `lanes` | Ordered channel-native categories with aliases, descriptions, local receipt keys, and explicit empty states |
| `brief` | A canonical metadata-only description of the source record: kind, scope, title/source-derived format, declared basis, and safe query aliases |
| `status` | The adapter's truthful projection of readiness without changing the source's underlying evidence coverage |

A Source Brief contains exactly `kind`, `scope`, `format`, `formatBasis`, and
`queryAliases`. Canonical title, source ID and URL, date, runtime, cached views,
registered source type, coverage, availability, and live state remain source
record facts rendered beside the brief; they are not semantic fields smuggled
into it. A brief carries no summary, recap, topic, reaction, quote, character,
verdict, or moment claim.

The engine rejects foreign receipt keys, duplicate or invalid IDs, normalized
duplicate aliases, oversized routes and pulses, recap blocks without local
proof, and semantic recap, route, pulse, or lane content on metadata-only and
caption-limited sources. It also rejects unknown or semantic Source Brief
fields, invalid kinds, scopes, or format bases, empty aliases, a brief attached
to a caption-backed source, and drift between the brief and projected status.
The source fingerprint includes the complete recap, experience, aliases, lane,
and brief projection.

The exact-source query engine builds and verifies the requested dossier before
it interprets the question and restricts episode results to that component's
registered receipt keys. The generic UI independently verifies the episode ID
and counts, exact source and fingerprint, canonical source-receipt identity,
and membership in the matched recap, experience, or lane. A mismatched ID,
count, source, or fingerprint, a foreign receipt, or a same-source receipt from
another episode lane is held instead of rendered. A brief answer must use the
`registered-source-brief` result type; the UI reconstructs its display from the
validated dossier and ignores forged result values.

## Four honest WWAM states

WWAM projects the generic evidence contract into four possible visible states:

| State | What the page may show | What it must not invent |
| --- | --- | --- |
| `distilled` | Source-bound recap, Midnight Cut, populated moment/topic lanes, exact Ask answers, official playback | Speaker identity, intent, objective verdicts, approval, or unsupported categories |
| `topic-nav-only` | Topic-backed recap, Topic Hop, exact topic doors, official playback | Host reactions, public comedy clips, character performances, visual outcomes, or source-audio attribution |
| `source-brief` | Canonical source facts, registered source type, title/source-derived format and its basis, official source/player access, and safe exact-source metadata answers | Recap prose, topics, best/funny moments, UP IN YA, Steve takes, character claims, quotes, or highlight routes |
| `queued` | Fail-closed canonical source/player access when even the Source Brief contract cannot be built | Any metadata interpretation or semantic content claim |

A Source Brief makes an undistilled upload useful without pretending that a
cached title, thumbnail, date, duration, or source type reveals what happened
inside it. It exposes only registered canonical metadata and the declared basis
for its bounded format label. `summary` and `recap` remain absent, and all
transcript-derived lanes stay sealed. The `queued` state remains a fail-closed
fallback rather than the normal metadata-only experience. A topic-navigation
page remains immersive without converting film, trailer, or watch-party audio
into host speech. See [The Source Brief Contract](SOURCE_BRIEF.md).

The integrated V1.5 audit projects the complete registered corpus:

| Audit measure | Certified result |
| --- | --- |
| Canonical Show Wikis | 510 |
| Truth-state split | 193 moment-backed `distilled` / 16 `topic-nav-only` / 301 source-safe held `source-brief` |
| Distinct receipt-bound recaps | 209 |
| Unique registered receipts | 3,315 |
| Strict Steve receipts | 30 |
| Character recap blocks | 126 named / 0 generic |
| Restored legacy comedy moments | 7 restored across BIT ENERGY and CHAT DID THIS |
| Title-relevant topic selection | 53/53 where topic evidence exists |
| Prior V1.4 integrated baseline | 178/178 relevant tests; build, lint, and diff green |

These are bounded inventory and verification counts, not creator approval,
speaker identification, objective rankings, or claims about unregistered
content.

`FELDMAN APPROVED RECAP` is a WWAM presentation label over an existing
receipt-bound recap, never evidence that Corey Feldman, Mike, J, or another
person approved the prose. A ready recap must retain `actualApproval: false`
and its exact local receipt bindings. The 301 source-safe held records remain
Source Briefs until this exact upload has defensible caption evidence; the
label cannot turn metadata into an episode recap.

## Episode Recap Compiler

WWAM's adapter compiles a show-specific recap only after receipts for the exact
source are stable. Its declared title/source-backed formats are:

| Format | Authored behavior |
| --- | --- |
| Movie commentary / watchalong | Commentary-first recap and lane order |
| WWAM livestream | Topic-first nightly map |
| Ranking / bracket show | Topics and strict negative-take candidates foregrounded |
| Horror news show | News/topic framing |
| Trailer reaction | Reaction framing under source-audio boundaries |
| Spoiler party | Spoiler-discussion framing |
| Q + A | Question/topic framing |

Each compiled overview names the exact upload. Every recap block states its
evidence basis and carries one or more local receipt keys. The compiler does
not promote character context into clip-speaker identity, turn machine heat
into a creator verdict, or use Atlas priority and cached views as public episode
prose. Technical measurements stay in Source Proof.

Generated recap copy remains visibly separate from archival excerpts. Its
receipt bindings make the route inspectable; they do not turn generated prose
into a quote.

## THE MIDNIGHT CUT / THE TOPIC HOP

A ready Show Wiki receives an adapter-authored route of up to five exact stops:

- a source with registered moment evidence receives **THE MIDNIGHT CUT**;
- a source mapped only through safe topic navigation receives **THE TOPIC HOP**;
- a Source Brief or queued fallback exposes zero invented stops while retaining
  official playback.

Midnight Cut balances preserved source-local heat, category variety, and
separation across the runtime, then restores chronological order for watching.
Topic Hop samples only registered topic-navigation receipts and never infers a
reaction, speaker, or visual outcome. Both can send their exact route to the
local Evidence Bag. Nothing autoplays before a person clicks.

### The episode pulse

The pulse map is a playable coordinate system, not decorative analytics:

- nodes are positioned from each receipt's timestamp against the exact runtime;
- node height visualizes the preserved archive signal, not a creator verdict;
- nearby timestamps are assigned deterministic vertical rows rather than
  overlapping each other;
- the track expands to fit those rows;
- each pulse target remains at least 44 by 44 pixels; and
- narrow-screen layouts reduce padding and stack route cards without removing
  exact controls. Reduced-motion preferences disable nonessential motion.

## WWAM channel adapter

WWAM retains six signature lanes:

| Lane | Exact admission rule |
| --- | --- |
| Topics | Registered source-local topic and topic-navigation receipts |
| Best Moments | Up to six local moment receipts in preserved signal order |
| Funny Moments | Up to six local moments carrying a canonical WWAM comedy category |
| WWAM UP IN YA | Only local moments explicitly registered with the `UP IN YA` label |
| Straight to Steve's Asshole | Local moments passing the strict negative-language, eligible-category, and movie-referent gate |
| Character Bits | Local character signals, contexts, and bounded curated-performance candidates with the speaker firewall intact |

Lane order is format-aware. Commentaries foreground Best Moments and comedy.
Ranking shows foreground Topics and strict negative-take candidates. General
livestreams retain topic-first navigation.

Straight to Steve's Asshole is intentionally conservative. A receipt needs an
eligible critical category, target-proximate negative language, and a concrete
movie-related referent. An explicit denial such as `I don't hate this` vetoes
the candidate instead of being reinterpreted as hate.

A receipt that belongs to several lanes renders once as a full evidence card
and thereafter as a compact playable cross-link. Empty categories collapse
into a checked/not-found record. Source Briefs receive one compact statement
that transcript-derived content lanes are sealed; queued fallbacks receive one
compact unavailable statement. Neither receives six pieces of empty-card
wallpaper.

## Exact-episode Ask routing

V1.5 makes the Source Brief, recap, watch path, and every lane directly
askable. Alias bundles are registered by the channel adapter and stored in the
exact source dossier. They are not hard-coded WWAM language in the generic
query engine.

| Example question | Registered destination |
| --- | --- |
| `What can you prove about this show?` | This source's metadata-only Source Brief |
| `Summarize this show` | Episode Recap and its bound receipts |
| `Give me the five-stop watch path` | Midnight Cut or Topic Hop route |
| `Where do they talk about Batman?` | Topics lane intersected with Batman evidence in this source |
| `Can I see the best?` or `Which parts should I watch?` | This source's registered Best Moments lane |
| `Where did they crack up?` or `Show the funniest moments` | This source's registered Funny Moments lane |
| `What's the craziest thing they said?` | This source's registered WWAM UP IN YA lane |
| `What did the guys hate?` or `What got sent straight to Steve's asshole?` | This source's registered Straight to Steve lane |
| `When do they do voices?` or `Show the character bits` | This source's registered Character Bits lane |

The routing rules are strict:

1. Resolve the exact source ID and fingerprint before parsing.
2. Preserve speaker refusal before any episode-lane match.
3. Match only aliases registered on this source's brief, recap, experience, or
   lanes.
4. If the question adds a subject, intersect that subject with the selected
   lane's receipt keys; do not search the rest of the archive or an unrelated
   lane.
5. Return `insufficient-evidence` when the registered lane is empty or none of
   its receipts matches the subject.
6. Return episode context containing the kind, ID, label, matched alias, total
   registered receipts, matched receipts, and shown receipts.
7. Let the UI revalidate that context and fail closed on a changed ID, count,
   source, fingerprint, foreign receipt, or same-source receipt outside the
   registered recap, experience, or lane.
8. Return a Source Brief as one `registered-source-brief` metadata result with
   zero receipts and `contentClaim: false`; never copy question text or
   unvalidated result fields into canonical source facts.

Bounded conversational scaffolding such as `can I see`, `what did they`, or
`where did they` may be removed while matching. Explicit subjects such as
`Alien`, `Batman`, `Ghostface`, or `Loomis` remain intact and still constrain
the exact selected lane. This lets natural wording work without broadening the
evidence boundary.

Source Brief and source-inventory questions are allowed before the
transcript-coverage gate because they return only canonical metadata. A request
to summarize, identify a speaker, name topics, rank moments, quote the hosts, or
describe what happened inside an undistilled upload still returns an explicit
insufficient-evidence refusal. The Source Brief is never substituted for a
recap.

This is how a phrase such as `best moments` can work honestly inside a Show
Wiki: it selects an adapter-registered navigation lane. A generic source with no
registered lane still receives `ranking-refused`; receipt heat or wording alone
cannot manufacture a ranking contract.

## Now Playing Receipt

Selecting a recap coordinate, pulse node, route stop, lane card, cross-link, or
Ask result activates one persistent **Now Playing Receipt** beside the official
player. The panel preserves:

- the exact receipt label and start/end bounds;
- the bounded public excerpt, or a visible withheld-excerpt state;
- the current watch-path or lane sequence;
- the exact source ID and `SPEAKER NOT DIARIZED` boundary;
- previous and next controls when the sequence supports them;
- a return link to the owning lane or watch path; and
- a copy-this-moment action using the canonical source coordinate.

Opening a Show Wiki at an exact registered receipt coordinate may preselect the
same Now Playing context, but it does not autoplay media. Choosing full-source
playback clears the receipt-specific context instead of leaving a stale label
beside the player.

## Local navigation and answer return paths

A sticky **THIS SHOW** rail links only to content that actually exists:

- Source Brief when the validated metadata-only projection exists;
- Recap when a recap or registered summary exists;
- Midnight Cut or Topic Hop when it has stops;
- populated signature lanes;
- Aftermath Pack when the exact source review desk builds successfully; and
- Ask This Show.

Empty lanes do not become dead navigation targets. A queued page keeps the rail
compact with Ask This Show only. A Source Brief page exposes Source Brief,
Aftermath when available, and Ask Source Facts without advertising sealed
semantic lanes. On narrow screens the links remain horizontally scrollable and
touch-sized.

Episode-aware Ask answers also include a direct return action: open the complete
recap, open all registered cuts, or open the full matched lane. Ask therefore
acts as another door into the page rather than a detached answer card.

## Universal engine versus channel adapter

| Reusable system | Universal responsibility |
| --- | --- |
| Source Dossier engine | Source identity, receipt/entity/artifact contracts, coverage firewalls, local-key validation, stable fingerprints |
| Exact-source query engine | Source lock, registered alias matching, lane-local subject intersection, typed results, refusal states, speaker boundary |
| Source Dossier UI | Safe rendering, episode-context revalidation, local navigation, persistent Now Playing state, responsive pulse and route controls |
| Shared YouTube bridge | Exact official source coordinates, bounded playback, identity-error recovery, no copied media |
| Aftermath Pack engine | Exact-source production joins, readiness lanes, local review semantics, fingerprinted restore, and bounded editor packets |
| ChannelPack boundary | Channel identity, storage isolation, evidence policy, update/review contract |

| WWAM-authored adapter | Channel-specific responsibility |
| --- | --- |
| Format grammar | Commentary, livestream, ranking, news, trailer, spoiler, and Q + A detection |
| Recap voice | WWAM-specific labels, prose structure, and evidence-basis wording |
| Lane grammar | Topics, Best, Funny, UP IN YA, Steve, and Character gates, aliases, and order |
| Watch ritual | Midnight Cut, Topic Hop, route selection, and pulse selection |
| Truth projection | `distilled`, `topic-nav-only`, `source-brief`, and fallback `queued` descriptions appropriate to WWAM's source-audio risks |

A racing adapter can author `Race in Five Turns`, close-finish and lead-change
lanes, driver topics, and racing-specific Ask aliases. A wrestling adapter can
author a match-story route and angle or promo lanes. Neither needs to fork the
source lock, receipt validator, player, Now Playing state, or mobile controls.

## Playback and evidence boundaries

Every receipt jump resolves to the exact official YouTube source and timestamp
through the shared on-page player. The recovery bridge keeps the same source
coordinates when YouTube rejects a direct embed configuration; final media
availability and embed permission remain controlled by YouTube and the source
owner.

Short excerpts remain within the public excerpt limit. Automatic captions do
not identify a speaker. Heat is archive ranking metadata, not creator judgment.
Generated recap prose, lane labels, and watch-path order are navigation and
interpretation layers bound to receipts, not archival quotes or creator canon.

## Adapter recipe for another channel

1. Register each official upload and its evidence coverage.
2. Produce bounded, source-local receipts.
3. Declare honest ready, restricted, metadata-brief, and queued fallback states.
4. Detect channel-native episode formats from declared metadata.
5. Compile a title-specific recap whose narrative blocks reference local receipts.
6. Define one channel-native watch ritual over a generic local-receipt route.
7. Define lane order, category gates, query aliases, and honest empty states.
8. Let the generic engine validate every local coordinate and fingerprint.
9. Let the generic query layer route only through registered local aliases and keys.
10. Join only source-registered production artifacts into the optional
    Aftermath desk; keep reference threads and generated storyboards separate.
11. Let the generic UI render, revalidate, play, review, and navigate the authored world.

The moat is not a generic page template. It is a validated source ledger,
exact-source question contract, persistent playable context, and reusable trust
boundary combined with a channel-specific recap compiler, watch ritual,
recurring grammar, and conservative editorial policy.

## V1.5 verification posture

The component contracts and neutral fixtures verify local-key enforcement,
episode alias routing, subject intersection, empty-lane refusal, generic ranking
refusal, speaker restraint, episode-context tamper rejection, same-source
receipt membership in the expected recap, experience, or lane, persistent Now
Playing behavior, populated-only local navigation, collision-safe pulse rows,
touch targets, narrow-screen layouts, and reduced motion. V1.5 fixtures also
verify the Source Brief schema, caption-backed exclusion, status drift,
metadata-only result type, safe pre-coverage routing, conversational aliases,
subject preservation, and refusal of semantic substitutions.

The 178/178 integrated gate remains the audited V1.4 baseline. V1.5's focused
contract suites extend that posture; current release verification should report
their final aggregate separately rather than relabeling the older count.
