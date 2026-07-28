# Universal Living Wiki Patterns

This document captures the reusable product rules proven in the WWAM After Midnight build. It is a blueprint for future creator archives, not a WWAM skin.

## The product promise

A Living Wiki should answer four fan questions in seconds:

1. What happened in this upload?
2. Where is the part I care about?
3. What should I watch next?
4. Can I trust that every answer belongs to the source it names?

The archive should feel written for fans of the channel. Its evidence system should stay invisible until the fan asks for proof.

## The two inventories

Never collapse these into one number.

- **Registered moments** are the smaller, public, source-local set used by established archive features.
- **Deep-dive cuts** are the larger episode-guide set used to explain a whole upload.

The UI must label both counts. A deep-dive cut is not silently promoted into a registered moment, a quote, a speaker claim, or canon.

## The fan-first episode shape

Every deeply indexed upload should expose this order:

1. A plain-English “why this night matters” summary.
2. A short starter path of the best playable stops.
3. What the hosts loved.
4. What the hosts hated.
5. The wildest detour or biggest room break.
6. The last meaningful word of the show.
7. Topic doors and related episodes.
8. The full timestamp and evidence file.

The shape must adapt to the tape. A quiet interview, a four-hour livestream, a movie commentary, and a racing broadcast should not all manufacture the same number of chapters.

## Playback: bridge first, escape hatch always

YouTube embeds can fail even when the public source page works. First-click playback should use the hosted media bridge with an exact source ID, start time, and bounded end time. Keep a visible YouTube link beside it.

Playback must never:

- substitute a different upload;
- silently reset to the start;
- imply a clip was downloaded or rehosted;
- strand the fan in an error-only player.

## Search: interpret the requested answer unit

Search should determine what the fan wants counted or returned:

- “How many shows…” returns unique uploads.
- “How many times…” may return distinct timestamped mentions.
- “Where…” returns the best playable source receipt.
- “Summarize this show…” stays inside one exact upload.
- “Last night…” resolves against the channel timezone and abstains if there was no indexed show on that date.

Every result card needs a source title, source date, timestamp, and a playable route. Duplicate archive records must never inflate show counts.

## Relative-date honesty

Words such as “today,” “last night,” “this week,” and “newest” are data requests, not decorative copy.

1. Resolve the date in the channel’s declared timezone.
2. Look for an exact indexed source on that date.
3. If none exists, say so.
4. Offer the newest indexed source separately, clearly labeled as a fallback.

Never answer “last night” with “the latest thing we have” while pretending those are equivalent.

## Channel DNA

The reusable engine supplies evidence, search, playback, chronology, and trust boundaries. A channel pack supplies the voice:

- recurring bits and aliases;
- character performances;
- fan-native category names;
- franchise or subject hierarchies;
- sensitive-language rules;
- show formats;
- visual tokens;
- channel timezone.

This separation is what makes the system universal without making every project feel identical.

## Relationship language

The interface should distinguish:

- **query match** — the requested words or entity occur in this receipt;
- **intent match** — the receipt matches the requested category, such as praise or a negative take;
- **character-pattern clip** — a real clip from that character’s shelf, but not necessarily about the user’s subject;
- **related source** — a shared indexed entity exists on both sides;
- **title-only neighbor** — metadata proximity only.

Do not call a generic pattern clip “matched to your question.”

## Human-feeling summaries

Avoid production-room phrases in the fan layer:

- machine-surfaced;
- weighted candidate;
- caption cluster;
- evidence registry;
- automatic-caption map;
- promotion state.

Prefer direct fan language:

- “Batman, Hellraiser, and Halloween lead the night.”
- “Start here for the first room-breaking detour.”
- “They spend the final stretch tearing into the ending.”

Keep the technical wording in an expandable evidence boundary.

## Quality gates

A release is not ready until all of these pass:

- every public timestamp is inside its exact source runtime;
- every first-click play action opens the intended source and second;
- source-bound search cannot leak results from another upload;
- unsupported speaker and intent claims fail closed;
- no duplicate HTML IDs or dead deep links;
- 320 px layouts have no horizontal overflow;
- primary controls meet a 44 px mobile target;
- compact episode wikis expose the useful fan layer before the research layer;
- static asset cache keys change whenever the asset changes;
- the production build completes from the committed source state.

## Reusable “wow” features

These features earn their complexity because they help a fan do something:

- **Ask the Tape** — one-upload question answering with receipts.
- **Time Machine** — follow a take, character, rivalry, or bit across years.
- **Driver / Creator DNA** — a sourced profile built from appearances and moments.
- **Night Shift** — a stable curated route through several uploads.
- **Saved Clips** — build and export a personal replay list locally.
- **Character Shelf** — real performances plus clearly labeled synthetic riffs.
- **Show Wiki** — recap, best moments, topic jumps, context, and related episodes.
- **Community Memory** — fan-submitted corrections or lore held for human review.

The rule is simple: a feature stays only if it shortens discovery, deepens context, or creates a memorable way to revisit the tape.
