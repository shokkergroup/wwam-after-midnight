# Evidence Relationship Gate

Release contract for **V5.16 / 0.5.16**.

## Product promise

Finding a relevant upload is not the same as finding evidence that answers a
question about a subject.

The Evidence Relationship Gate makes that distinction executable. Before heat,
curation, comedy, popularity, or source-title relevance can rank a receipt,
Ask must state how that exact receipt is related to the resolved subject.
Receipts that are merely inside a matching source may remain useful source
navigation, but they cannot answer an aboutness question and cannot become a
Play the Answer trail.

This is not another destination in the interface. It is an accuracy boundary
under Ask, evidence chains, source playback, and every future channel adapter.
The commercial proof is restraint: a generic chatbot can produce a plausible
answer from a relevant title; the Memory OS must be able to show why each
played second is evidence for the thing the visitor actually asked about.

## Reproduced pre-fix failure

The failure was observed in the checked-in V5.15 corpus and is preserved here
as a regression record, not hidden as an abstract edge case.

| Neutral aboutness question | Incorrect pre-fix receipts | Why they were invalid |
| --- | --- | --- |
| `What do they say about Halloween?` | `4UokRLETypU @ 809` (“Would you suck your own dick?”) and `Q6SN-Om1gIo @ 2835` | The moments were inside Halloween commentaries, but the bounded captions did not connect the remarks to Halloween. |
| `What do they say about Scream?` | `2G8lpFaeIdw @ 1585` (“Where's the dick?…”) and `jLIfEdg8Oc0 @ 4366` | The source titles matched Scream; the receipts did not establish Scream as the subject of those remarks. |
| `What do they say about Friday the 13th?` | `BIbyzMlstmM @ 1528`, the curated Burp Defense | The curated bit occurred in a Friday commentary, but that did not make the bit evidence about Friday the 13th. |

These were **source-context matches**, not subject evidence. Source/franchise
score plus a human-curated or high-heat bonus allowed unrelated moments to
outrank lower-heat topic evidence. The old result was deterministic and
playable, but still wrong. A timestamp proves where words occur; it does not
prove what those words are about.

## Canonical `claimRelation` vocabulary

Every candidate considered for a subject-bearing Ask answer receives exactly
one relationship code. V5.16 allows only this closed vocabulary:

| `claimRelation` | Required basis | Allowed use |
| --- | --- | --- |
| `explicit-caption-target` | The bounded caption receipt explicitly contains the resolved subject or a registered alias after normalization. | May support neutral aboutness. It may support a narrower evaluative or longitudinal input only when those separate evidence rules also pass. |
| `exact-topic-receipt` | A structured, timed topic receipt is canonically bound to the exact resolved entity/topic, rather than merely sharing a source lane. | May support neutral aboutness and exact topic navigation. A topic binding alone does not prove sentiment, speaker identity, continuity, or change. |
| `screen-referent-in-exact-commentary` | The receipt is from the exact resolved commentary and the bounded caption contains concrete screen-directed or evaluative referent language such as the movie, scene, mask, ending, character, part, or equivalent channel-pack vocabulary. | May support a bounded statement about what was said while watching that exact work. It does not establish a host, a franchise-wide position, or visual truth. |
| `source-context-only` | The source title, franchise, collection, or selected source matches, but the bounded receipt supplies none of the three relationships above. | Source discovery and surrounding-tape navigation only. It cannot answer aboutness, enter an answer evidence chain, or become a playable answer stop. |

Unknown, missing, or caller-invented relationship values fail closed. The
relation describes the receipt-to-subject basis; it is not an evidence tier,
confidence score, speaker claim, creator approval, or proof that an automatic
caption is verbatim.

### Exact commentary does not mean every second

`screen-referent-in-exact-commentary` is deliberately narrower than “this
happened during the watchalong.” A joke, tangent, room break, or unrelated bit
does not qualify merely because the film was playing. The bounded caption must
contain a concrete screen referent recognized by the relationship policy.
Visual identity remains unverified unless a separate visual-review contract
exists.

## Decision order

The gate runs before ranking:

```text
resolve query and subject
  -> retrieve possible receipts
  -> classify exact receipt-to-subject relationship
  -> remove source-context-only from aboutness evidence
  -> apply intent-specific evidence requirements
  -> rank only the eligible set
  -> build the evidence chain
  -> optionally project that chain into Play the Answer
```

Heat, Red Band rank, Riff Chemistry, profanity, source views, curation status,
and editorial priority may order receipts only after relationship eligibility
passes. None can upgrade `source-context-only`. A timestamp-validated
human-curated soundbyte is still not evidence about a film when its bounded
words do not connect to that film.

## Neutral aboutness versus opinion change

The relationship gate answers one question: **is this receipt about the
resolved subject strongly enough for this use?** It does not collapse all
question types into one claim.

### Neutral aboutness

Questions shaped like “what did they say/talk about/discuss/mention/think about
X?” may use:

- `explicit-caption-target`;
- `exact-topic-receipt`; or
- `screen-referent-in-exact-commentary`.

The answer may summarize the bounded indexed route, with the existing caption
and speaker cautions. It may not infer a settled opinion merely because the
receipt is positive, negative, funny, or highly ranked.

### Evaluative and change questions

An evaluative question needs both an allowed relationship and the existing
target-proximate evaluative evidence. A category label by itself is
insufficient.

A change/evolution question needs multiple chronology-compatible,
relationship-eligible evaluative receipts under the longitudinal/trajectory
rules. `exact-topic-receipt` alone cannot prove an opinion, and
`source-context-only` can never fill an earlier or later side. Even a valid
pair remains an archive-boundary result: undiarized captions cannot establish
that one host made both statements or changed a position.

The supported neutral Elm Street route demonstrates the distinction:
`What do they think about the Elm Street remake?` may return
`qTQdWKcwn4A @ 1132` and `qTQdWKcwn4A @ 2101` as
`screen-referent-in-exact-commentary`, while still refusing a host-level or
settled-opinion claim.

## Play the Answer boundary

Play the Answer is downstream of Ask; it cannot repair an invalid evidence
relationship by making the timestamp playable.

- `source-context-only` must not appear in `analysis.evidenceChain`.
- A relationship-gated answer with fewer than two eligible timed receipts
  exposes no `PLAY THIS ANSWER` action.
- The Play the Answer core rejects any supplied trail stop whose
  `claimRelation` is missing, unknown, or `source-context-only`.
- Share restore reruns current Ask. A stale V5.15 packet that depended on a
  now-rejected relationship cannot use its stored coordinates as substitute
  evidence.
- Official-source links may still be offered as source navigation without
  presenting them as an answer trail.

Playing an irrelevant receipt precisely would make the failure more immersive,
not more accurate. V5.16 closes that path.

## Concrete regression contract

The release gate pins these questions:

| Query | Required result |
| --- | --- |
| `What do they say about Halloween?` | No `4UokRLETypU @ 809` or `Q6SN-Om1gIo @ 2835`; every returned receipt has one of the three allowed aboutness relations. |
| `What do they say about Scream?` | No `2G8lpFaeIdw @ 1585` or `jLIfEdg8Oc0 @ 4366`; every returned receipt has one of the three allowed aboutness relations. |
| `What do they say about Friday the 13th?` | The Burp Defense at `BIbyzMlstmM @ 1528` is absent; curation cannot override the gate. |
| `What did they say about the mask in Halloween 5?` | The direct mask receipt `AtcRT3Xkk6E @ 1327` remains available as `explicit-caption-target`; unrelated heat from the same commentary stays out. |
| `What did they say about the ending in Scream 3?` | `insufficient-evidence`, zero results, and zero evidence-chain stops. Correct-source/wrong-subtopic substitution remains forbidden. |
| `What do they think about the Elm Street remake?` | The bounded `qTQdWKcwn4A @ 1132` and `@ 2101` route remains available under `archive-boundary`, with screen-referent relationships and no host-level verdict. |
| `How did their opinion on Halloween change?` | Only relationship-eligible evaluative receipts may form the chronological route; the result remains an archive boundary and cannot establish speaker continuity or a mind change. |

Every positive case also pins `speaker: null`,
`speakerStatus: "not-diarized"`, an official YouTube URL, and a finite,
non-negative whole-second coordinate. Every refusal pins an empty evidence
chain so Play the Answer cannot manufacture a trail.

## Universal portability

The closed relationship vocabulary and Play the Answer enforcement are
channel-neutral even though WWAM supplies the launch failures, classifier, and
display copy. A full Ask port for another channel must supply:

- canonical entity IDs and aliases;
- exact source/program bindings;
- structured topic bindings;
- concrete screen/event referent vocabulary; and
- intent-specific evidence rules.

A racing archive can therefore distinguish:

- a booth caption that explicitly names car 33
  (`explicit-caption-target`);
- a timed topic/event receipt canonically bound to driver 33
  (`exact-topic-receipt`);
- a concrete “that truck is loose off turn four” referent inside the exact
  selected race context (`screen-referent-in-exact-commentary`); and
- an unrelated crash call that merely occurred in a race where driver 33
  started (`source-context-only`).

The last record may be exciting and highly curated. It still cannot answer
“What happened to driver 33?” The same invariants, not WWAM vocabulary, decide
eligibility.

The V5.16 neutral racing fixture proves the relationship values, playable
trail, rejection, serialization, and restore boundary without WWAM vocabulary.
It does **not** prove that the current WWAM search classifier can classify a
racing corpus unchanged. The current classifier uses WWAM film/commentary
referents; a VRL release still needs an adapter-defined driver/event and
race-referent classifier plus its own query truth set.

## Commercial proof

The relationship gate is an accuracy moat, not a feature-count claim:

1. the failure is concrete and reproducible;
2. the fix exposes a typed reason rather than hiding behind a new score;
3. popular, funny, and human-curated distractions cannot buy their way back
   into an answer;
4. source playback inherits the same relationship boundary; and
5. the enforcement contract travels to another channel, while its registered
   entities and referent classifier remain channel-owned work.

The buyer-facing demonstration is short:

1. ask the Halloween question;
2. show that the two memorable but unrelated V5.15 soundbytes are gone;
3. open one surviving receipt and its `claimRelation`;
4. ask the Halloween 5 mask question and play the exact retained receipt; and
5. ask the unsupported Scream 3 ending question and show the honest refusal.

That sequence proves the system is not a generic chatbot searching titles and
then decorating the hottest match. It can distinguish **where a moment
happened** from **what the moment can support**.

## Non-goals

V5.16 does not claim:

- caption correctness;
- speaker diarization or host identity;
- visual verification;
- intent, causality, consensus, or opinion continuity;
- creator certification or rights clearance;
- that an allowed relationship makes a receipt editorially important; or
- that corpus absence proves a subject was never discussed.

Those boundaries remain governed by their existing evidence and review
contracts.
