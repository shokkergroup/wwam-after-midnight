# Correction Ripple V1

Correction Ripple is the Trust Desk's deterministic, read-only blast-radius
report. Every `wwam.correction.v2` packet carries a `dryRunRipple` bound to the
same Showcase snapshot and input fingerprint as the correction.

It answers a narrow question before a human reviews a correction: which
registered evidence records and derived Showcase records currently depend on
the packet's receipt or source?

## Dependency classes

- `EXACT_RECEIPT` means the derived record lists one of the packet's resolved
  receipt IDs.
- `SOURCE_ONLY` means the record depends on the same resolved source, but does
  not list the packet's exact receipt. It is not promoted to an exact hit.
- `NO_REGISTERED_DEPENDENCY` means the surface has no registered dependency in
  the current snapshot.
- `BLOCKED_UNRESOLVED_EVIDENCE` means at least one requested receipt or source
  is missing, ambiguous, or disagrees with the registered receipt-to-source
  mapping. Partial impact lists are suppressed.

The nine registered Showcase surfaces are Memory Graph, Take Time Machine, Bit
Ancestry, Riff Chemistry, Personalized Descent, WWAM Courts, Live Aftermath,
Character Readiness, and Creator Control Room.

Ask the Tape and Clip Lab are explicitly `NOT_REGISTERED`. The report therefore
claims no Ask or Clip Lab effect. A future engine can only add either surface
after it exposes a correction-bound receipt/source dependency ledger.

## Safety contract

- `mode` is always `DRY_RUN`.
- `canonMutation`, `askEffectClaim`, and `clipLabEffectClaim` are always
  `NONE`.
- The engine never infers an ID from an excerpt or YouTube URL.
- A receipt/source mismatch blocks the whole analysis.
- A blocked report returns zero dependency records and marks every registered
  surface `NOT_EVALUATED`.
- Reports contain no generated timestamp. Identical snapshot, candidate, and
  evidence inputs produce the same eight-character report fingerprint.

The Trust Desk may copy the packet for a human reviewer. Copying it does not
apply the proposed correction, certify a claim, or rewrite any stored canon.

## V5.4 measured snapshot

For the promoted 74-source / 872-receipt Showcase snapshot:

- 1,374 derived records are registered across nine surfaces;
- all 95 Trust findings export a V2 correction packet with a dry-run report;
- 90 reports resolve enough evidence to complete;
- five reports stop closed because their current timeline findings attach no
  receipt or source evidence;
- the aggregate reports enumerate 904 exact-receipt record dependencies and
  2,403 same-source-only record dependencies.

Those aggregate counts describe packet-level reports and intentionally include
the same downstream record again when separate correction packets depend on
it.
