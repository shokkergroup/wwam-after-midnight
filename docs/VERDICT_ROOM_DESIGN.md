# V5.14 Release Contract — The Verdict Room

Status: implemented in release `0.5.14`. This document is the normative product,
authority, persistence, portability, and verification contract for the shipped
device-local workflow.

## Product boundary

**The Verdict Room** is a device-local, append-only human adjudication ledger layered on the verified output of the longitudinal docket engine.

It answers one narrow question: after a human has checked the bounded before/after evidence and every required caveat, what conclusion may the local experience display about that exact docket?

It must not:

- alter `WWAM_LONGITUDINAL_DOCKETS` or an existing docket packet;
- turn a machine `MAY_RESOLVE`, `MAY_SUPPORT`, `MAY_BE_MIXED`, or `OPEN` signal into a verdict by itself;
- infer a speaker, continuity of identity, intent, causality, or creator approval;
- claim server storage, login, identity verification, cryptographic authorship, rights clearance, or channel ownership;
- publish, certify, or promote anything into canon;
- accept an arbitrary re-fingerprinted packet as canonical input.

The original docket remains immutable and unresolved. An active Verdict Room decision is a separate, locally reviewed overlay with its own provenance and revocation history.

The released state machine requires twelve caller-attested human checks before
one scoped local result can exist.

## Implemented modules

- `verdict-room-engine.js`: channel-neutral state machine, canonical binding, validation, ledger, restore, and export.
- `verdict-room-ui.js`: accessible local review workflow. It contains no adjudication rules.
- `wwam-verdict-room-adapter.js`: compiles the canonical WWAM ChannelPack,
  binds the current docket artifact, and owns device-local persistence.
- `verdict-room-surface.js`: lazy route lifecycle and Ask/deep-link handoff.
- `verdict-room.css`: isolated visual layer.

The reusable global is `ShokkerVerdictRoom`; WWAM naming belongs only in the
adapter.

Released schemas:

- `shokker-youtube-wiki/verdict-room-session/v1`
- `shokker-youtube-wiki/verdict-room-event/v1`
- `shokker-youtube-wiki/verdict-room-export/v1`

## ChannelPack contract

A pack must pass `ShokkerChannelPack.validate` and declare both:

- `longitudinal-claim-ledger`
- `human-adjudication-ledger`

The second capability and its vocabulary become part of the compiled ChannelPack fingerprint. The core engine receives only canonical verdict codes; display labels come from the validated pack.

| Canonical code | WWAM formal label | WWAM comedy label |
| --- | --- | --- |
| `SUPPORTED` | `SUPPORTED WITHIN REVIEWED SCOPE` | `CALLED THAT SHIT.` |
| `CONTRADICTED` | `CONTRADICTED WITHIN REVIEWED SCOPE` | `AGED LIKE ROADKILL.` |
| `MIXED` | `MIXED WITHIN REVIEWED SCOPE` | `HALF PROPHET. HALF JACKASS.` |

These are the only verdict codes in V1. `NEEDS_CONTEXT`, `REJECTED`, and `REVOKED` are workflow states, not verdicts, and receive no comedy verdict label.

The engine never accepts a caller-supplied display label. It resolves the label
from the exact compiled pack only after an active `ADJUDICATED` event passes
replay. Every formal label begins with its canonical verdict code. Comedy copy
is decorative, and reduced-profanity mode may only replace profane words with
`[BLEEP]`; it cannot change the result. All modes reject authority-inflating
certification, canon, rights, identity, speaker, causal, approval, official, or
publication language.

A neutral racing pack can map the same codes to `SUPPORTED // CALL UPHELD`,
`CONTRADICTED // CALL OVERTURNED`, and `MIXED // SPLIT DECISION`. A portability
test must prove that the neutral export and UI contain no WWAM or horror
vocabulary.

## Canonical input binding

Creation requires:

```js
ShokkerVerdictRoom.create({
  channelPack,
  docketData,
  session: {
    id,
    name,
    createdAt
  }
});
```

The Verdict Room captures the already-loaded, frozen longitudinal-docket
factory when its module initializes; callers cannot substitute a docket engine.
For each exact docket ID, it creates a live engine from the supplied pack and
data, calls `inspect(id)`, `verify(packet)`, and `serialize(packet)`, and then
validates the parsed serialization as the one canonical review target. A caller
cannot inject a packet or engine in place of that lookup.

The immutable session binding includes:

- ChannelPack ID, exact fingerprint, required capabilities, and adjudication-vocabulary fingerprint;
- docket-data schema, public artifact fingerprint, and caption-set fingerprint;
- exact verified inspection-packet fingerprint and canonical serialization hash for every target;
- docket, claim, response, source, subject, and additional-receipt IDs;
- exact dates, numeric timestamps, official URLs, bounded excerpts, evidence windows, rights modes, and review blockers;
- the Verdict Room rule/schema version.

`reviewInputHash` is the SHA-256 of canonical JSON for that projection. It is recomputed before every event, snapshot, renderable verdict, and export. Any change places the session in `STALE_INPUT`; no old verdict may render against new evidence.

The existing public fingerprints remain useful input bindings but are not signatures. The Verdict Room must not describe FNV, SHA-256, or a chained hash as authentication, authorship, or proof of truth.

## State machine

State is derived by replaying the append-only event ledger. Stored summaries are never trusted.

| Current state | Allowed operation and result |
| --- | --- |
| `UNREVIEWED` | Append one unique evidence check; remain open until all eleven pass, then `EVIDENCE_CHECKED`. May instead become `NEEDS_CONTEXT` or `REJECTED`. |
| `NEEDS_CONTEXT` | Append one unique evidence check; remain open until all eleven pass, then `EVIDENCE_CHECKED`. May instead become `REJECTED`. |
| `EVIDENCE_CHECKED` | Lock one fixed code-specific sentence and become `WORDING_CHECKED`, or begin a new `NEEDS_CONTEXT` revision, or become `REJECTED`. |
| `WORDING_CHECKED` | Adjudicate the exact locked code and sentence, begin a new `NEEDS_CONTEXT` revision, or become `REJECTED`. |
| `ADJUDICATED` | Revoke the active decision and become `REVOKED`. |
| `REVOKED` | The first new check starts a new revision; rejection also starts a new terminal revision. |
| `REJECTED` | Terminal for that revision. |
| `STALE_INPUT` | No operation until restored against the exact bound input. |

No shortcut to `ADJUDICATED` is permitted. Repeating a state-changing command,
duplicating a check within one revision, moving timestamps backward, changing
the locked code or its fixed code-specific sentence during adjudication, or
creating a second active verdict for one docket fails closed.

### Undo and revoke

Undo never deletes history.

- A non-adjudication event may be undone only if it is the latest event for that docket and has no dependent event. The engine appends an `UNDO` event that references the target event ID, retains both hash-chain links, and restores the target's recorded `before` state.
- An adjudication cannot use generic undo. It requires a `REVOKE` event naming the active decision ID, with caller-supplied timestamp, reviewer notes, and explicit human attestation.
- Revocation immediately makes the derived verdict `null`; the comedy label disappears everywhere.
- Re-adjudication starts a new numbered revision and repeats all required checks. Old checks are visible context, not silently inherited authority.
- Rejection and revocation remain in JSON and human-readable exports.

## Required human checks

Every check has an exact code, an explicit `PASS`, reviewer notes,
caller-supplied timestamp, and reviewer record. V1 has no
`NOT_APPLICABLE` shortcut, and free-form check names are rejected.

| Check code | Required finding |
| --- | --- |
| `CANONICAL_PACKET` | The packet verifies and exactly matches the current docket engine. |
| `BEFORE_CONTEXT` | The earlier excerpt and surrounding context support the bounded proposition wording. |
| `AFTER_CONTEXT` | The later excerpt and surrounding context support the stated response meaning. |
| `CHRONOLOGY` | Source dates and exact anchors are in the claimed order. |
| `SUBJECT_SCOPE` | The same specific subject—not merely a shared injected ID—grounds both sides. |
| `CONTRADICTION_SWEEP` | Every attached additional receipt was reviewed and given `RELIED_ON` or `CONTEXT_ONLY` disposition with a reason. |
| `SOURCE_AUDIO_BOUNDARY` | The reviewer did not rely on trailer/movie/source audio as host speech. |
| `RIGHTS_BOUNDARY` | The result remains source-link/bounded-excerpt only; this is not a rights-clearance finding. |
| `OUTCOME_REVIEW` | A human checked the relevant whole-work outcome or other declared primary outcome source. The method and notes are recorded. |
| `SPEAKER_EXCLUDED` | The decision does not identify or imply a speaker or same-person continuity. |
| `CAUSALITY_EXCLUDED` | The decision does not claim the earlier statement caused the later event or reaction. |
| `PUBLIC_WORDING` | The selected verdict code and its exact fixed, code-specific scoped sentence were read together and approved for this local overlay. Caller-authored wording is not accepted. |

An adjudication requires all checks to pass, including `OUTCOME_REVIEW`.

The engine computes the required receipt set from the canonical docket. The reviewer must disposition the claim, response, and every additional response receipt; omitted or foreign IDs fail. `MIXED` additionally requires at least two relied-on later receipts with opposing, explicitly described local judgments.

`OUTCOME_REVIEW` is a caller-attested human check, not an automated fact oracle. Its method is limited to `WHOLE_WORK_REVIEW` or `DECLARED_PRIMARY_SOURCE`; notes and a source reference are required. The UI must say that the local engine did not independently authenticate the reviewer or source.

## Adjudication record

`lockWording()` accepts a verdict code only alongside the engine's exact fixed
sentence for that code. It rejects caller-authored variations. An
`ADJUDICATE` command then requires:

- exact target docket ID and current revision;
- the unchanged `verdictCode` from `WORDING_CHECKED`;
- the unchanged, byte-matched fixed sentence bound to that code;
- all required check-event IDs and evidence dispositions;
- reviewer role, optional local name/ID, and `humanAttested: true`;
- reviewer notes and a caller-supplied ISO 8601 timestamp with timezone.

The resulting event contains:

- deterministic sequence and event ID;
- session, channel, pack, docket, packet, artifact, and `reviewInputHash` bindings;
- exact before/after state and revision;
- canonical verdict code only;
- the exact reviewed public wording;
- the complete ordered check-event ID set; the referenced
  `CONTRADICTION_SWEEP` event retains every evidence disposition;
- previous global event hash and previous event hash for this docket;
- explicit boundaries: `localOnly: true`, `identityVerified: false`, `creatorCertified: false`, `speaker: null`, `speakerInferred: false`, `causalityClaimed: false`, `rightsCleared: false`, and `canonMutated: false`;
- its own canonical SHA-256 event hash.

The public projection is derived, never imported:

```js
{
  state: "ADJUDICATED",
  verdictCode: "SUPPORTED",
  formalLabel: "SUPPORTED WITHIN REVIEWED SCOPE",
  comedyLabel: "CALLED THAT SHIT.",
  reviewedWording: "...",
  decisionHash: "sha256:...",
  localHumanAttestation: true,
  identityVerified: false,
  speaker: null,
  causalityClaimed: false,
  creatorCertified: false
}
```

Before adjudication, after revocation, or on any verification failure, `verdictCode`, `formalLabel`, `comedyLabel`, and `reviewedWording` are all `null`.

The engine owns exactly three fixed scoped sentences, one per canonical verdict
code. Caller-authored public wording is rejected rather than sanitized.
Speaker continuity, causation, creator/canon certification, universal truth
beyond the bounded scope, and rights clearance cannot enter through the public
sentence.

## Reviewer and authority boundary

The existing Human Review Session pattern is retained:

- every event requires a reviewer role and `humanAttested: true`;
- automation-disclosed roles conflict with human attestation and are rejected;
- reviewer timestamps come from the caller; the engine never calls the clock;
- timestamps increase strictly per docket and event sequence;
- optional name and ID are local labels only.

The exported attestation text is always `CALLER-ATTESTED / NOT IDENTITY-VERIFIED`. A role such as `owner`, `creator`, or `league official` does not create authority. Final creator approval or organizational publication remains in an owner-controlled external workflow.

## Tamper evidence and validation

The implementation must combine deterministic hashes with semantic replay:

1. Accept only exact schemas, keys, primitive types, enums, and bounded collection/string sizes.
2. Recompute the canonical live-input binding.
3. Recompute every event hash and both hash-chain links.
4. Replay every transition, required check, wording lock, evidence disposition, reviewer attestation, and boundary field.
5. Recompute derived state, metrics, public projection, and snapshot hash.
6. Require the reconstructed snapshot to equal the imported snapshot exactly.

Re-fingerprinting a semantically forbidden field must still fail. Unknown fields, duplicate event IDs, duplicate active verdicts, reordered sequences, broken references, numeric strings, boolean timestamps, oversized notes, prototype-pollution keys, non-finite numbers, and excessive nesting or collection counts are rejected before rendering.

Recommended V1 ceilings:

- 2 MB import;
- 500 dockets per session;
- 10,000 events total and 250 events per docket;
- 4,000 characters per note or reviewed wording;
- 100 evidence/check references per event;
- 32 levels of JSON depth.

These hashes reveal structural change; they do not stop a person who can rewrite and rehash a local file. Semantic replay prevents that rewrite from granting capabilities the engine does not support, but no export is a cryptographic signature.

## Import, export, and local persistence

Supported exports:

- canonical JSON for exact restore;
- deterministic Markdown for human review and handoff.

Exports contain bounded excerpts and official source links only—never raw captions, media, cookies, tokens, browser history, or hidden reviewer data. No generated export timestamp is added.

`restore(saved, { channelPack, docketData })` is all-or-nothing. The canonical
longitudinal factory remains captured internally. Restore verifies the schema,
size caps, exact ChannelPack, current canonical input, hash chain, semantic
replay, and final snapshot equality before returning an API. No partial ledger
is rendered.

Automatic merge and fork detection are out of scope. After explicit local
confirmation, a fully validated import replaces the one active local slot for
that ChannelPack; it is never merged with the prior ledger. Two independently
valid exports may share the fixed local session ID, and either may replace the
slot. Cross-channel or cross-pack imports are rejected. A stale export may be
opened only in a clearly quarantined read-only inspector with no active verdict
projection.

Optional browser persistence is device-local and namespaced by storage
namespace, pack fingerprint, and the single active Verdict Room suffix. Local
storage is convenience, not secure storage. Clearing or replacing a session
requires explicit destructive confirmation; exported copies cannot be
recalled.

## UI and accessibility contract

- Use native form controls, `fieldset`/`legend`, explicit labels, and visible required-state text.
- Every check is keyboard reachable; verdict choice is a labeled radio group.
- Do not use color, animation, or comedy copy as the sole status signal.
- Provide a persistent evidence pane with official timestamp links and no autoplay.
- Announce validation failures, saved events, undo, and revocation through an atomic live region.
- Move focus to the error summary after a failed submit and back to the originating control after closing a dialog.
- Require a confirmation dialog that names the exact docket and consequence before adjudication or revocation.
- Respect `prefers-reduced-motion`, zoom/reflow at 400%, high contrast, and reduced-profanity mode.
- Keep the formal verdict adjacent to the comedy label. Never expose the comedy label as an accessible name without the scoped formal result.
- When input becomes stale or a decision is revoked, remove the verdict from the accessibility tree as well as visually.
- Destroy must remove listeners, restore the mount, and avoid stealing focus when embedded in Memory OS.

## Threat model

| Threat | Required response |
| --- | --- |
| Arbitrary or re-fingerprinted packet | Resolve by docket ID from the live engine and require exact canonical serialization. |
| Runtime factory replacement | Official ChannelPack, docket, and Verdict Room globals are frozen behind non-writable, non-configurable bindings; the adapter also verifies those descriptors. Deployment CSP/SRI remains required against a compromised same-origin script, which client code cannot self-authenticate after arbitrary script execution. |
| Cross-channel pack substitution | Bind channel ID, exact pack fingerprint, capabilities, and vocabulary; fail closed. |
| Semantic truth inflation | Whitelist three scoped codes and fixed display maps; replay all review gates. |
| Forged or cherry-picked evidence | Require canonical receipt IDs and disposition every attached receipt. |
| Source-audio or visual shortcut | Require explicit boundary and outcome checks; no label otherwise. |
| Speaker or causality smuggling | Reject speaker fields and unsafe public wording; boundaries remain false/null. |
| Fake reviewer identity | Require caller human attestation while always reporting identity unverified. |
| Ledger edit, deletion, or reorder | Verify sequence, dual previous hashes, event hashes, replay, and snapshot equality. |
| Hidden revocation | Derive active verdict from the full chain and export every revoke event. |
| Stale corpus | Recompute `reviewInputHash`; suppress verdict and enter `STALE_INPUT`. |
| XSS through notes or wording | Render as text, never HTML; apply length and character controls. |
| Import denial of service | Enforce byte, depth, count, and string caps before semantic work. |
| Local storage loss or theft | State plainly that storage is local convenience; offer export, not security claims. |

## Public API sketch

```js
const room = ShokkerVerdictRoom.create(options);

room.getQueue(filters);
room.getDocket(docketId);
room.getChecks(docketId);
room.recordCheck(docketId, check);
room.lockWording(docketId, action);
room.adjudicate(docketId, action);
room.undo(docketId, action);
room.revoke(docketId, action);
room.getLedger(docketId);
room.getPublicProjection(docketId);
room.snapshot();
room.exportJSON(2);
room.exportMarkdown();

const restored = ShokkerVerdictRoom.restore(saved, currentInputs);
```

All returned values are cloned/frozen projections. No method accepts a caller-authored inspection packet, comedy label, speaker, certification, or canon mutation.

## Test matrix

| Suite | Required proof |
| --- | --- |
| Engine happy path | All three verdict codes require the full check chain; each fixed code-specific sentence survives byte-for-byte; public label appears only at `ADJUDICATED`. |
| State transitions | Every allowed edge succeeds; shortcuts, repeats, timestamp reversal, changed locked wording, and two active verdicts fail. |
| Zero-verdict boundary | Every pre-review, needs-context, rejected, revoked, stale, and error state returns all verdict/public-copy fields as `null`. |
| Evidence | Foreign, missing, duplicate, mismatched, out-of-range, source-audio-sensitive, and omitted additional receipts fail. |
| Verdict rules | `MIXED` requires opposing later receipts; unsupported codes and caller labels fail; outcome review is mandatory. |
| Speaker/causality | Speaker fields, continuity claims, causal wording, creator certification, canon mutation, and rights-clearance claims fail. |
| Canonical binding | Changed pack, data fingerprint, caption set, source, excerpt, timestamp, subject, blocker, packet, or vocabulary produces `STALE_INPUT`/restore rejection. |
| Adversarial import | Ordinary tamper, arbitrary rehash, unknown keys, duplicate IDs, broken chains, prototype keys, coercible types, deep JSON, and cap overflow fail closed. |
| Restore/export | JSON restores byte-for-byte; Markdown is deterministic; no current time, raw captions, media, secrets, or unbounded text leaks. |
| Undo/revoke | Undo is append-only and dependency-safe; adjudication requires revoke; revoke removes all public labels; a new revision repeats checks. |
| Reviewer boundary | Missing attestation, automation-disclosed role, missing notes, or missing timezone fails; identity-verified count stays zero. |
| Portability | WWAM and neutral racing packs both work; fingerprints differ; racing output contains no WWAM vocabulary. |
| UI/accessibility | Keyboard-only completion, focus restoration, error summary, live announcements, reduced motion, 400% reflow, bleep mode, and no-autoplay pass. |
| Release integration | Lazy asset order, adapter lifecycle, one active controller, destroy cleanup, app size cap, hash/deep-link behavior, and no label before adjudication remain pinned. |

## Definition of done

V5.14 is complete only when an unauthenticated machine docket still shows zero verdicts, a fully checked caller-attested human decision can create exactly one scoped local verdict, a revoke removes it without erasing history, hostile imports cannot manufacture one, and the same engine passes a non-WWAM ChannelPack with no vocabulary leakage.

The released integration binds the current WWAM ChannelPack
`cp1-dd23bc386008689b`, longitudinal artifact `fnv1a32:59b085f6`, and caption
set
`sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc`.
Focused engine, UI, adapter, portability, and release-integration tests pin the
definition above. Those checks establish deterministic behavior and contract
consistency; they do not authenticate a reviewer, source, or conclusion.
