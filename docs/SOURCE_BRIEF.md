# Show Wiki Source Brief

The Source Brief keeps every canonical upload useful before content
distillation is possible. It is a metadata interface, not a generated episode
summary.

## Product behavior

When a Source Dossier has `metadata-only` or `caption-limited` coverage, its
Show Wiki may expose:

- exact registered title;
- upload date;
- runtime;
- cached view count;
- registered source type;
- availability and live status;
- official source URL; and
- a format classification derived only from the registered title and source
  type, with that basis shown in the interface.

The page labels this state:

`SOURCE BRIEF // CONTENT NOT DISTILLED`

It also states that transcript-derived recap prose, Topics, Best Moments,
Funny Moments, WWAM UP IN YA, Straight to Steve's Asshole, Character Bits, and
watch-path claims remain sealed until source-local evidence survives
distillation.

## Portable contract

The adapter may register only this bounded object:

```js
{
  kind: "source-metadata-brief",
  scope: "canonical-source-metadata-only",
  format: "WWAM LIVESTREAM",
  formatBasis: "registered-source-type-and-title",
  queryAliases: [
    "what can you prove about this show",
    "show source brief",
    "source brief",
    "what is registered",
    "what do you know for sure"
  ]
}
```

The generic dossier engine accepts only:

- the exact `kind` and `scope` above;
- a bounded display format;
- one of `source-title-metadata`, `registered-source-type`, or
  `registered-source-type-and-title` as `formatBasis`; and
- bounded, normalized, unique query aliases.

Unknown fields and semantic payloads such as `overview`, `body`, `summary`,
`excerpt`, or receipt bindings are rejected. A Source Brief is rejected on a
caption-backed source, where the receipt-backed recap contract applies
instead.

## Ask behavior

Questions such as `What can you prove about this show?` may return the
canonical Source Brief with `contentClaim: false`. Questions such as `When was this uploaded?`, `How long is this tape?`,
`How many views?`, and `Where is the official upload?` return canonical source
proof rather than a content claim.

An inventory question may return registered counts and Source Brief
availability before the caption-coverage firewall.

Questions such as `Summarize this show`, `What happened?`, `What were the best
moments?`, or `What did they hate?` do not become metadata answers. Without
source-local transcript evidence, those content questions still return an
explicit refusal or lane-aware empty state.

## Why this matters

The Source Brief removes the dead-page feeling from a large archive without
using a title or thumbnail to hallucinate what happened inside the upload. The
same contract transfers to a racing broadcast, podcast, interview channel, or
any other ChannelPack because the reusable layer knows only canonical source
facts and evidence coverage.

