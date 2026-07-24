# Ask the Tape: Answer Frame V2

Answer Frame V2 makes Ask the Tape behave like a source-bound archive
retriever instead of a bag of high-scoring keywords. It compiles the question
into a small answer contract before any receipt is ranked.

## The answer frame

The public `compileQueryPlan()` explanation now separates:

- **action** — find, list, count, profile, play, or continue;
- **scope** — commentary, livestream, Archive Deep, Atlas metadata, character
  evidence, or the complete promoted corpus;
- **primary target** — the matched film, source, franchise, character, topic,
  rank, or collection;
- **secondary targets** — the subject that must still appear after a primary
  source or entity is found;
- **predicate** — words that describe the requested relationship rather than
  the subject itself;
- **selector** — relevance, date, count, cached views, comedy heat, or an exact
  published rank;
- **anchor** — the exact result or source position inherited by a follow-up.

This structure is channel-neutral. WWAM's films, characters, collections, and
comedy surfaces come from the ChannelPack and checked-in corpus, while the
query-frame concepts can travel to another living YouTube wiki.

## Direct answer before archive heat

A source-title match is not an answer by itself. For example, a question about
the mask in *Halloween 5* has two targets:

1. the indexed *Halloween 5* commentary; and
2. a receipt that actually contains mask evidence.

Earlier retrieval could consume the film title, discard the remaining target,
and let a globally hotter curated moment win. V2 preserves the secondary
target, requires semantic target coverage inside the bounded candidate, and
only then uses relevance, evidence quality, time, or heat to order valid
matches.

The same rule applies to a named character inside a named source. A general
Friday-the-13th receipt cannot answer a question about Jason merely because
the upload title is correct.

## Honest refusal

If the requested secondary target is absent from the indexed evidence, Ask
returns no receipt and says that the claim is not established. It does not:

- replace the missing target with a loosely related high-heat moment;
- use title metadata to claim what happened inside a source;
- turn a character mention into a verified performance;
- describe a movie's plot when the archive only contains commentary moments;
- invent one objective “funniest ever” result from unranked retrieval.

Global memorability questions hand off to the published Red Band 100.
Global funniest or laugh-hardest questions hand off to the Comedy Black Box,
where the six declared dimensions and evidence packet can be inspected.

## Grammar that changes the answer

Answer Frame V2 explicitly distinguishes several questions that share many of
the same words:

| Question shape | Answer contract |
| --- | --- |
| “Who is Dr. Loomis?” | grounded recurring-character profile |
| “Where did Loomis appear?” | timestamp-validated curated performance candidates |
| “How often is Loomis mentioned?” | broader caption-signal count, visibly not a performance count |
| “What did they say about Loomis?” | bounded mention receipts, without assigning a speaker |
| “Did they not cover Alien?” | coverage polarity is resolved before the answer is phrased |
| “What happens in the newest commentary?” | newest indexed commentary moments, explicitly not a plot summary |
| “Show the three newest commentaries” | exact requested collection size in date order |
| “Play Scream 7” | exact source-level playback result |

Spelled limits, non-contiguous negation, watch-along phrasing, temporal
qualifiers, and request predicates are controls. They are not allowed to
survive as accidental archive subjects.

## Follow-up memory

Result navigation remains receipt-anchored:

- **next** and **previous** move from the rendered result position;
- **there** and **replay** keep the exact selected source and second;
- **another** stays in the intended source or collection instead of restarting
  a global search;
- an explicit new film, character, source, or collection overrides stale
  follow-up context.

The returned context records the anchor. It is not inferred from whatever
high-scoring item happens to rank first on the next request.

## Evidence and ranking boundaries

Answer Frame V2 does not change the underlying evidence classes:

- promoted receipts remain source-linked, bounded archive evidence;
- Archive Deep candidates remain machine-surfaced quarantine;
- Atlas-only records remain cached title metadata;
- character performance candidates remain human-curated and
  timestamp-validated but not speaker-diarized;
- published ranking surfaces remain separate engines with their own declared
  formulas and fingerprints.

Semantic fit is a gate, not a new truth claim. A matching caption excerpt still
does not identify a speaker, prove intent, establish a true bit origin, or
certify an opinion.

## Evaluation contract

The release gate combines:

- focused answer-first questions with exact expected source IDs and seconds;
- the existing frozen Ask truth set;
- adversarial phrasing and typo coverage;
- title-firewall and source-boundary cases;
- query-plan fuzzing;
- follow-up navigation;
- character profile, mention, and performance distinctions;
- Archive Deep and Atlas non-promotion checks;
- browser checks against the rendered answer, status, handoff, and playback
  controls.

A test only passes when the requested evidence is first, irrelevant hot
receipts are absent, and unsupported requests abstain. Merely returning a
plausible source somewhere in a long list is not success.

The V5.11 handoff passed **122/122 Ask and search subtests**, including the
complete **157-query adversarial corpus**, plus **8/8 focused Answer Frame V2
cases**. Those counts describe executable regression coverage, not a claim that
natural-language retrieval is solved or that every future phrasing will work.

## What this does not claim

This remains deterministic retrieval over the checked-in snapshot. It is not a
general-purpose model, a complete transcript search engine, a plot database,
speaker diarization, creator approval, or proof that the current archive
contains every WWAM upload. Its value is narrower and more defensible: a
natural question resolves into an inspectable evidence contract, a direct
answer when one exists, and a visible refusal when one does not.
