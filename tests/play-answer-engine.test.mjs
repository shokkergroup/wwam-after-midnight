import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const demoRoot = new URL("../public/demo/", import.meta.url);
const engineSource = await readFile(
  new URL("play-answer-engine.js", demoRoot),
  "utf8",
);

function load(files = []) {
  const sandbox = { window: {} };
  for (const [name, source] of files) {
    runInNewContext(source, sandbox, { filename: name });
  }
  runInNewContext(engineSource, sandbox, {
    filename: "play-answer-engine.js",
  });
  return sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function receipt({
  key,
  sourceId,
  at,
  evidenceLevel = "TIMESTAMPED CAPTION RECEIPT",
  evidenceType = "caption-excerpt",
  claimRelation = "explicit-caption-target",
  warnings = ["Speaker identity is not established by this receipt."],
  ...extra
}) {
  return {
    key,
    sourceId,
    at,
    evidenceLevel,
    evidenceType,
    claimRelation,
    evidenceWarnings: warnings,
    speaker: null,
    speakerStatus: "not-diarized",
    originInferred: false,
    kind: "moment",
    ...extra,
  };
}

function analysis(query, stops, extra = {}) {
  return {
    query,
    status: "supported",
    continuedFrom: false,
    limitations: [
      "The ordered receipts do not establish continuity, causality, or a settled opinion.",
    ],
    evidenceChain: stops.map((stop) => ({
      role: stop.role,
      result: stop.result,
    })),
    ...extra,
  };
}

function neutralFixture(overrides = {}) {
  const query = overrides.query || "Show the opening call and the final-lap call";
  const current = {
    value:
      overrides.analysis ||
      analysis(query, [
        {
          role: "PRIMARY RECEIPT",
          result: receipt({
            key: "race-opening-call",
            sourceId: "RACE01A",
            at: 118,
            warnings: ["The booth speaker is not identified."],
          }),
        },
        {
          role: "SUPPORTING RECEIPT",
          result: receipt({
            key: "race-final-call",
            sourceId: "RACE02B",
            at: 3598,
            warnings: [
              "The booth speaker is not identified.",
              "Sequence does not establish causality.",
            ],
            claimRelation: "screen-referent-in-exact-commentary",
          }),
        },
      ]),
  };
  let calls = 0;
  const window = load();
  const instance = window.ShokkerPlayAnswer.create({
    analyze(value) {
      calls += 1;
      if (typeof overrides.analyze === "function") {
        return overrides.analyze(value, current);
      }
      return current.value;
    },
    bindings:
      overrides.bindings || {
        channelId: "neutral-racing",
        channelPackFingerprint: "cp1-0000000000000001",
        archiveAsOf: "2026-07-24",
        answerEngineVersion: "ask-v2.1.0",
      },
    sources:
      overrides.sources || [
        { sourceId: "RACE01A", durationSeconds: 4200, playable: true },
        { sourceId: "RACE02B", durationSeconds: 4800, playable: true },
      ],
  });
  return {
    window,
    instance,
    query,
    current,
    calls: () => calls,
  };
}

function errorCode(code) {
  return (error) => {
    assert.equal(error?.name, "PlayAnswerError");
    assert.equal(error?.code, code);
    return true;
  };
}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(",")}}`;
}

function fnv(value) {
  const input = typeof value === "string" ? value : canonical(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function rehash(packet) {
  const clone = structuredClone(packet);
  const { fingerprint: ignored, ...base } = clone;
  void ignored;
  clone.fingerprint = fnv(base);
  return clone;
}

function allKeys(value, output = []) {
  if (!value || typeof value !== "object") return output;
  for (const [key, child] of Object.entries(value)) {
    output.push(key);
    allKeys(child, output);
  }
  return output;
}

test("publishes one frozen, non-replaceable channel-neutral API", () => {
  const window = load();
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "ShokkerPlayAnswer",
  );

  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.enumerable, true);
  assert.ok(Object.isFrozen(window.ShokkerPlayAnswer));
  assert.equal(window.ShokkerPlayAnswer.VERSION, "2.0.0");
  assert.equal(
    window.ShokkerPlayAnswer.TRAIL_SCHEMA,
    "shokker-play-answer/trail/v2",
  );
  assert.equal(
    window.ShokkerPlayAnswer.SHARE_SCHEMA,
    "shokker-play-answer/share/v2",
  );
  assert.doesNotMatch(
    engineSource,
    /WWAM|Halloween|Loomis|Challis|Ghostface|Scream|Nightmare on Elm Street/i,
  );
});

test("compiles an exact ordered racing trail with every authority claim forced off", () => {
  const fixture = neutralFixture();
  const first = fixture.instance.build(fixture.query);
  const second = fixture.instance.build(fixture.query);

  assert.deepEqual(plain(first), plain(second));
  assert.equal(first.count, 2);
  assert.deepEqual(
    plain(first.stops.map((stop) => [
      stop.role,
      stop.key,
      stop.sourceId,
      stop.at,
      stop.end,
      stop.claimRelation,
    ])),
    [
      [
        "PRIMARY RECEIPT",
        "race-opening-call",
        "RACE01A",
        118,
        148,
        "explicit-caption-target",
      ],
      [
        "SUPPORTING RECEIPT",
        "race-final-call",
        "RACE02B",
        3598,
        3628,
        "screen-referent-in-exact-commentary",
      ],
    ],
  );
  assert.deepEqual(plain(first.stops[0].warnings), [
    "The booth speaker is not identified.",
  ]);
  assert.equal(first.stops[0].evidenceLevel, "TIMESTAMPED CAPTION RECEIPT");
  assert.ok(first.stops.every((stop) => stop.speaker === null));
  assert.deepEqual(plain(first.claims), {
    continuity: false,
    causality: false,
    opinion: false,
    origin: false,
    rights: false,
    canon: false,
  });
  assert.equal(first.mediaCopied, false);
  assert.deepEqual(plain(fixture.instance.getPolicy().allowedClaimRelations), [
    "explicit-caption-target",
    "exact-topic-receipt",
    "screen-referent-in-exact-commentary",
  ]);
  assert.equal(
    fixture.instance.getPolicy().sourceContextOnlyPlayable,
    false,
  );
  assert.match(first.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.stops));
  assert.ok(Object.isFrozen(first.stops[0]));
  assert.ok(Object.isFrozen(fixture.instance));
  assert.doesNotMatch(
    JSON.stringify(first),
    /WWAM|Halloween|Loomis|Challis|Ghostface/i,
  );
  assert.equal(fixture.calls(), 2);
});

test("accepts only the three exact claim relations in a neutral racing trail", () => {
  const fixture = neutralFixture();
  fixture.current.value = analysis(fixture.query, [
    {
      role: "PRIMARY RECEIPT",
      result: receipt({
        key: "explicit-booth-target",
        sourceId: "RACE01A",
        at: 118,
        claimRelation: "explicit-caption-target",
      }),
    },
    {
      role: "SUPPORTING RECEIPT",
      result: receipt({
        key: "exact-race-topic",
        sourceId: "RACE01A",
        at: 900,
        evidenceType: "caption-topic-receipt",
        kind: "topic",
        claimRelation: "exact-topic-receipt",
      }),
    },
    {
      role: "COUNTERPOINT",
      result: receipt({
        key: "screen-referent-call",
        sourceId: "RACE02B",
        at: 3598,
        claimRelation: "screen-referent-in-exact-commentary",
      }),
    },
  ]);

  const trail = fixture.instance.build(fixture.query);
  assert.deepEqual(
    plain(trail.stops.map((stop) => stop.claimRelation)),
    [
      "explicit-caption-target",
      "exact-topic-receipt",
      "screen-referent-in-exact-commentary",
    ],
  );

  for (const relation of [
    undefined,
    null,
    "",
    "source-context-only",
    "unknown",
    "EXPLICIT-CAPTION-TARGET",
  ]) {
    const unsafe = receipt({
      key: `unsafe-${String(relation)}`,
      sourceId: "RACE01A",
      at: 100,
      claimRelation: relation,
    });
    if (relation === undefined) delete unsafe.claimRelation;
    fixture.current.value = analysis(fixture.query, [
      { role: "PRIMARY RECEIPT", result: unsafe },
      {
        role: "SUPPORTING RECEIPT",
        result: receipt({
          key: "safe-relation",
          sourceId: "RACE02B",
          at: 200,
        }),
      },
    ]);
    assert.throws(
      () => fixture.instance.build(fixture.query),
      errorCode("NONPLAYABLE_CLAIM_RELATION"),
      String(relation),
    );
  }
});

test("shares coordinates only and restores solely through a fresh exact rebuild", () => {
  const fixture = neutralFixture();
  const packet = fixture.instance.createShare(fixture.query);

  assert.equal(packet.query, fixture.query);
  assert.equal(packet.stops.length, 2);
  assert.deepEqual(Object.keys(packet.stops[0]).sort(), [
    "at",
    "claimRelation",
    "end",
    "key",
    "role",
    "sourceId",
  ]);
  assert.ok(JSON.stringify(packet).length < 1800);
  assert.ok(
    allKeys(packet).every(
      (key) =>
        !/^(speaker|speakerStatus|excerpt|quote|caption|captions|transcript|audio|video|media)$/i.test(
          key,
        ),
    ),
  );

  const restored = fixture.instance.restoreShare(plain(packet));
  assert.equal(restored.fingerprint, packet.trailFingerprint);
  assert.deepEqual(
    plain(restored.stops.map((stop) => stop.key)),
    ["race-opening-call", "race-final-call"],
  );
  assert.equal(fixture.calls(), 2);
});

test("legacy v1 trails and shares fail as foreign contracts", () => {
  const fixture = neutralFixture();
  const trail = plain(fixture.instance.build(fixture.query));
  const packet = plain(fixture.instance.createShare(fixture.query));

  trail.schema = "shokker-play-answer/trail/v1";
  assert.throws(
    () => fixture.instance.exportShare(trail),
    errorCode("INVALID_TRAIL"),
  );

  packet.schema = "shokker-play-answer/share/v1";
  assert.throws(
    () => fixture.instance.restoreShare(rehash(packet)),
    errorCode("FOREIGN_SHARE"),
  );
});

test("reordered or altered shares fail even after an attacker recomputes the public checksum", () => {
  const fixture = neutralFixture();
  const packet = plain(fixture.instance.createShare(fixture.query));

  const ordinaryTamper = structuredClone(packet);
  ordinaryTamper.stops[0].at += 1;
  assert.throws(
    () => fixture.instance.restoreShare(ordinaryTamper),
    errorCode("INVALID_WINDOW"),
  );

  const reordered = structuredClone(packet);
  reordered.stops.reverse();
  assert.throws(
    () => fixture.instance.restoreShare(rehash(reordered)),
    errorCode("TAMPERED_SHARE"),
  );

  const relabeled = structuredClone(packet);
  relabeled.stops[0].role = "COUNTERPOINT";
  assert.throws(
    () => fixture.instance.restoreShare(rehash(relabeled)),
    errorCode("TAMPERED_SHARE"),
  );

  const unsafeRelabel = structuredClone(packet);
  unsafeRelabel.stops[0].role = "MIKE'S TAKE";
  assert.throws(
    () => fixture.instance.restoreShare(rehash(unsafeRelabel)),
    errorCode("UNSAFE_ROLE"),
  );

  const changedEnd = structuredClone(packet);
  changedEnd.stops[0].end += 1;
  assert.throws(
    () => fixture.instance.restoreShare(rehash(changedEnd)),
    errorCode("INVALID_WINDOW"),
  );

  const changedRelation = structuredClone(packet);
  changedRelation.stops[0].claimRelation =
    "screen-referent-in-exact-commentary";
  assert.throws(
    () => fixture.instance.restoreShare(rehash(changedRelation)),
    errorCode("TAMPERED_SHARE"),
  );

  const unsafeRelation = structuredClone(packet);
  unsafeRelation.stops[0].claimRelation = "source-context-only";
  assert.throws(
    () => fixture.instance.restoreShare(rehash(unsafeRelation)),
    errorCode("NONPLAYABLE_CLAIM_RELATION"),
  );

  const fakeTrail = structuredClone(packet);
  fakeTrail.trailFingerprint = "fnv1a32:00000000";
  assert.throws(
    () => fixture.instance.restoreShare(rehash(fakeTrail)),
    errorCode("STALE_TRAIL"),
  );
});

test("foreign bindings, changed source registries, and changed warning tiers invalidate restore", () => {
  const fixture = neutralFixture();
  const packet = plain(fixture.instance.createShare(fixture.query));

  const foreign = neutralFixture({
    bindings: {
      channelId: "neutral-racing",
      channelPackFingerprint: "cp1-0000000000000002",
      archiveAsOf: "2026-07-24",
      answerEngineVersion: "ask-v2.1.0",
    },
  });
  assert.throws(
    () => foreign.instance.restoreShare(packet),
    errorCode("FOREIGN_BINDINGS"),
  );

  const changedRegistry = neutralFixture({
    sources: [
      { sourceId: "RACE01A", durationSeconds: 4201, playable: true },
      { sourceId: "RACE02B", durationSeconds: 4800, playable: true },
    ],
  });
  assert.throws(
    () => changedRegistry.instance.restoreShare(packet),
    errorCode("STALE_REGISTRY"),
  );

  fixture.current.value.evidenceChain[0].result.evidenceWarnings = [
    "A human review changed this exact warning.",
  ];
  assert.throws(
    () => fixture.instance.restoreShare(packet),
    errorCode("STALE_TRAIL"),
  );
});

test("rejects short, long, duplicate, unknown, out-of-range, metadata, and handoff chains", () => {
  const base = neutralFixture();
  const sourceA = receipt({
    key: "one",
    sourceId: "RACE01A",
    at: 100,
  });
  const sourceB = receipt({
    key: "two",
    sourceId: "RACE02B",
    at: 200,
  });

  const cases = [
    {
      code: "INVALID_COUNT",
      value: analysis(base.query, [{ role: "ONLY", result: sourceA }]),
    },
    {
      code: "INVALID_COUNT",
      value: analysis(
        base.query,
        Array.from({ length: 7 }, (_, index) => ({
          role: `STOP ${index}`,
          result: receipt({
            key: `key-${index}`,
            sourceId: index % 2 ? "RACE01A" : "RACE02B",
            at: 300 + index,
          }),
        })),
      ),
    },
    {
      code: "DUPLICATE_RECEIPT",
      value: analysis(base.query, [
        { role: "PRIMARY RECEIPT", result: sourceA },
        {
          role: "SUPPORTING RECEIPT",
          result: receipt({
            key: "one",
            sourceId: "RACE02B",
            at: 200,
          }),
        },
      ]),
    },
    {
      code: "DUPLICATE_RECEIPT",
      value: analysis(base.query, [
        { role: "PRIMARY RECEIPT", result: sourceA },
        {
          role: "SUPPORTING RECEIPT",
          result: receipt({
            key: "different",
            sourceId: "RACE01A",
            at: 100,
          }),
        },
      ]),
    },
    {
      code: "UNKNOWN_SOURCE",
      value: analysis(base.query, [
        { role: "PRIMARY RECEIPT", result: sourceA },
        {
          role: "SUPPORTING RECEIPT",
          result: receipt({
            key: "unknown",
            sourceId: "RACE99Z",
            at: 10,
          }),
        },
      ]),
    },
    {
      code: "OUT_OF_RANGE",
      value: analysis(base.query, [
        { role: "PRIMARY RECEIPT", result: sourceA },
        {
          role: "SUPPORTING RECEIPT",
          result: receipt({
            key: "too-late",
            sourceId: "RACE02B",
            at: 4800,
          }),
        },
      ]),
    },
    {
      code: "OUT_OF_RANGE",
      value: analysis(base.query, [
        { role: "PRIMARY RECEIPT", result: sourceA },
        {
          role: "SUPPORTING RECEIPT",
          result: receipt({
            key: "fractional-time",
            sourceId: "RACE02B",
            at: 200.5,
          }),
        },
      ]),
    },
    {
      code: "NONPLAYABLE_EVIDENCE",
      value: analysis(base.query, [
        { role: "PRIMARY RECEIPT", result: sourceA },
        {
          role: "SUPPORTING RECEIPT",
          result: receipt({
            key: "metadata",
            sourceId: "RACE02B",
            at: 200,
            evidenceLevel: "SOURCE METADATA ONLY",
            evidenceType: "source-metadata",
          }),
        },
      ]),
    },
    {
      code: "NONPLAYABLE_EVIDENCE",
      value: analysis(base.query, [
        { role: "PRIMARY RECEIPT", result: sourceA },
        {
          role: "SUPPORTING RECEIPT",
          result: receipt({
            key: "summary",
            sourceId: "RACE02B",
            at: 200,
            evidenceLevel: "SOURCE-LEVEL DERIVED SUMMARY",
            evidenceType: "derived-source-summary",
          }),
        },
      ]),
    },
    {
      code: "NONPLAYABLE_ANALYSIS",
      value: analysis(base.query, [
        { role: "PRIMARY RECEIPT", result: sourceA },
        { role: "SUPPORTING RECEIPT", result: sourceB },
      ], { status: "surface-handoff" }),
    },
  ];

  for (const scenario of cases) {
    base.current.value = scenario.value;
    assert.throws(
      () => base.instance.build(base.query),
      errorCode(scenario.code),
      scenario.code,
    );
  }
});

test("accepts only exact playable statuses, portable queries, and structural roles", () => {
  const fixture = neutralFixture();
  const one = receipt({
    key: "one",
    sourceId: "RACE01A",
    at: 100,
  });
  const two = receipt({
    key: "two",
    sourceId: "RACE02B",
    at: 200,
  });

  for (const status of ["speaker-unknown", "SUPPORTED", "surface-handoff"]) {
    fixture.current.value = analysis(
      fixture.query,
      [
        { role: "PRIMARY RECEIPT", result: one },
        { role: "SUPPORTING RECEIPT", result: two },
      ],
      { status },
    );
    assert.throws(
      () => fixture.instance.build(fixture.query),
      errorCode("NONPLAYABLE_ANALYSIS"),
      status,
    );
  }

  fixture.current.value = analysis(
    fixture.query,
    [
      { role: "PRIMARY RECEIPT", result: one },
      { role: "SUPPORTING RECEIPT", result: two },
    ],
    { continuedFrom: true },
  );
  assert.throws(
    () => fixture.instance.build(fixture.query),
    errorCode("CONTEXT_DEPENDENT"),
  );

  for (const role of ["MIKE'S TAKE", "CRASH CAUSED BY CALL"]) {
    fixture.current.value = analysis(fixture.query, [
      { role, result: one },
      { role: "SUPPORTING RECEIPT", result: two },
    ]);
    assert.throws(
      () => fixture.instance.build(fixture.query),
      errorCode("UNSAFE_ROLE"),
      role,
    );
  }
});

test("enforces source restrictions and a narrow machine-candidate playback lane", () => {
  const fixture = neutralFixture();
  const safe = receipt({
    key: "safe",
    sourceId: "RACE02B",
    at: 200,
  });
  const scenarios = [
    {
      code: "RESTRICTED_SOURCE",
      result: receipt({
        key: "topic-only",
        sourceId: "RACE01A",
        at: 100,
        restrictedToTopicNavigation: true,
      }),
    },
    {
      code: "RESTRICTED_SOURCE",
      result: receipt({
        key: "visual-unverified",
        sourceId: "RACE01A",
        at: 100,
        rightsMode: "visual-context-unverified",
      }),
    },
    {
      code: "UNSAFE_MACHINE_CANDIDATE",
      result: receipt({
        key: "unbounded-machine",
        sourceId: "RACE01A",
        at: 100,
        reviewStatus: "machine-candidate",
      }),
    },
    {
      code: "UNSAFE_MACHINE_CANDIDATE",
      result: receipt({
        key: "promotable-machine",
        sourceId: "RACE01A",
        at: 100,
        reviewStatus: "machine-candidate",
        kind: "moment",
        evidenceLevel: "TIMESTAMPED MACHINE-CANDIDATE RECEIPT",
        promotionAllowed: true,
        restrictedToTopicNavigation: false,
      }),
    },
    {
      code: "INVALID_RECEIPT",
      result: receipt({
        key: "unsupported-review",
        sourceId: "RACE01A",
        at: 100,
        reviewStatus: "creator-approved",
      }),
    },
  ];

  for (const scenario of scenarios) {
    fixture.current.value = analysis(fixture.query, [
      { role: "PRIMARY RECEIPT", result: scenario.result },
      { role: "SUPPORTING RECEIPT", result: safe },
    ]);
    assert.throws(
      () => fixture.instance.build(fixture.query),
      errorCode(scenario.code),
      scenario.result.key,
    );
  }

  fixture.current.value = analysis(fixture.query, [
    {
      role: "PRIMARY RECEIPT",
      result: receipt({
        key: "bounded-machine-moment",
        sourceId: "RACE01A",
        at: 100,
        reviewStatus: "machine-candidate",
        kind: "moment",
        evidenceLevel: "TIMESTAMPED MACHINE-CANDIDATE RECEIPT",
        promotionAllowed: false,
        restrictedToTopicNavigation: false,
      }),
    },
    { role: "SUPPORTING RECEIPT", result: safe },
  ]);
  const trail = fixture.instance.build(fixture.query);
  assert.deepEqual(
    plain(trail.stops.map((stop) => [stop.key, stop.at, stop.end])),
    [
      ["bounded-machine-moment", 100, 130],
      ["safe", 200, 230],
    ],
  );
  assert.ok(trail.stops.every((stop) => stop.speaker === null));
  assert.equal(trail.claims.canon, false);
  assert.equal(trail.claims.rights, false);
});

test("rejects invented evidence tiers, types, kinds, and missing warnings", () => {
  const fixture = neutralFixture();
  const safe = receipt({
    key: "safe",
    sourceId: "RACE02B",
    at: 200,
  });
  const scenarios = [
    {
      code: "NONPLAYABLE_EVIDENCE",
      result: receipt({
        key: "invented-pair",
        sourceId: "RACE01A",
        at: 100,
        evidenceLevel: "TIMESTAMPED CANDIDATE",
        evidenceType: "anything-at-all",
        kind: "banana",
      }),
    },
    {
      code: "INVALID_RECEIPT",
      result: receipt({
        key: "wrong-kind",
        sourceId: "RACE01A",
        at: 100,
        kind: "banana",
      }),
    },
    {
      code: "INVALID_COUNT",
      result: receipt({
        key: "silent-warning-lane",
        sourceId: "RACE01A",
        at: 100,
        warnings: [],
      }),
    },
  ];

  for (const scenario of scenarios) {
    fixture.current.value = analysis(fixture.query, [
      { role: "PRIMARY RECEIPT", result: scenario.result },
      { role: "SUPPORTING RECEIPT", result: safe },
    ]);
    assert.throws(
      () => fixture.instance.build(fixture.query),
      errorCode(scenario.code),
      scenario.result.key,
    );
  }
});

test("requires explicit null speaker and not-diarized status on every receipt", () => {
  const fixture = neutralFixture();
  const safe = receipt({
    key: "safe",
    sourceId: "RACE02B",
    at: 200,
  });
  const missingSpeaker = receipt({
    key: "missing-speaker",
    sourceId: "RACE01A",
    at: 100,
  });
  delete missingSpeaker.speaker;
  const cases = [
    missingSpeaker,
    receipt({
      key: "unknown-speaker-status",
      sourceId: "RACE01A",
      at: 100,
      speakerStatus: "speaker-unknown",
    }),
  ];

  for (const result of cases) {
    fixture.current.value = analysis(fixture.query, [
      { role: "PRIMARY RECEIPT", result },
      { role: "SUPPORTING RECEIPT", result: safe },
    ]);
    assert.throws(
      () => fixture.instance.build(fixture.query),
      errorCode("AUTHORITY_CLAIM"),
      result.key,
    );
  }
});

test("requires exact immutable bindings and a whole-second playable source registry", () => {
  const window = load();
  const api = window.ShokkerPlayAnswer;
  const bindings = {
    channelId: "neutral-racing",
    channelPackFingerprint: "cp1-0000000000000001",
    archiveAsOf: "2026-07-24",
    answerEngineVersion: "ask-v2.1.0",
  };
  const sources = [
    { sourceId: "RACE01A", durationSeconds: 4200, playable: true },
  ];
  const make = (nextBindings = bindings, nextSources = sources) => () =>
    api.create({
      analyze() {
        return {};
      },
      bindings: nextBindings,
      sources: nextSources,
    });

  assert.throws(
    make({ ...bindings, rawCaptions: "must never become a binding" }),
    errorCode("UNEXPECTED_FIELD"),
  );
  const { answerEngineVersion: omitted, ...missingVersion } = bindings;
  void omitted;
  assert.throws(make(missingVersion), errorCode("MISSING_FIELD"));
  for (const [field, value] of [
    ["channelId", "Neutral Racing"],
    ["channelPackFingerprint", "cp1-not-a-digest"],
    ["archiveAsOf", "2026-02-30"],
    ["answerEngineVersion", "ask v2"],
  ]) {
    assert.throws(
      make({ ...bindings, [field]: value }),
      errorCode("INVALID_BINDINGS"),
      field,
    );
  }
  assert.throws(
    make(bindings, [
      { sourceId: "RACE01A", durationSeconds: 4200, playable: false },
    ]),
    errorCode("UNPLAYABLE_SOURCE"),
  );
  assert.throws(
    make(bindings, [
      { sourceId: "RACE01A", durationSeconds: 4200 },
    ]),
    errorCode("UNPLAYABLE_SOURCE"),
  );
  assert.throws(
    make(bindings, [
      { sourceId: "RACE01A", durationSeconds: 4200.5, playable: true },
    ]),
    errorCode("INVALID_SOURCE"),
  );
  assert.throws(
    make(bindings, [
      {
        sourceId: "RACE01A",
        durationSeconds: 4200,
        playable: true,
        captions: "private",
      },
    ]),
    errorCode("UNEXPECTED_FIELD"),
  );
});

test("prototype tricks and accessors are rejected without invoking attacker code", () => {
  const fixture = neutralFixture();

  fixture.current.value = Object.create({
    query: fixture.query,
    status: "supported",
    evidenceChain: [],
  });
  assert.throws(
    () => fixture.instance.build(fixture.query),
    errorCode("UNSAFE_PROTOTYPE"),
  );

  let getterCalls = 0;
  const accessor = {
    query: fixture.query,
    status: "supported",
    limitations: [],
  };
  Object.defineProperty(accessor, "evidenceChain", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return [];
    },
  });
  fixture.current.value = accessor;
  assert.throws(
    () => fixture.instance.build(fixture.query),
    errorCode("UNSAFE_DESCRIPTOR"),
  );
  assert.equal(getterCalls, 0);

  const poisonedResult = Object.create({ sourceId: "RACE01A" });
  Object.assign(poisonedResult, {
    key: "poisoned",
    at: 100,
    evidenceLevel: "TIMESTAMPED BROADCAST RECEIPT",
    evidenceType: "caption-excerpt",
    evidenceWarnings: [],
  });
  fixture.current.value = analysis(fixture.query, [
    { role: "PRIMARY RECEIPT", result: poisonedResult },
    {
      role: "SUPPORTING RECEIPT",
      result: receipt({ key: "safe", sourceId: "RACE02B", at: 200 }),
    },
  ]);
  assert.throws(
    () => fixture.instance.build(fixture.query),
    errorCode("UNSAFE_PROTOTYPE"),
  );
});

test("speaker, authority, origin, rights, canon, and opinion escalation fail closed", () => {
  const fixture = neutralFixture();
  const authorityCases = [
    { speaker: "Announcer A" },
    { speakerVerified: true },
    { continuityEstablished: true },
    { causalityEstablished: true },
    { opinionEstablished: true },
    { trueOriginClaim: true },
    { rightsCleared: true },
    { canonApproved: true },
    { creatorCertified: true },
    { authenticatedEditorVerified: true },
    { originStatus: "verified" },
    { rightsStatus: "licensed" },
  ];

  for (const [index, escalation] of authorityCases.entries()) {
    fixture.current.value = analysis(fixture.query, [
      {
        role: "PRIMARY RECEIPT",
        result: receipt({
          key: `authority-${index}`,
          sourceId: "RACE01A",
          at: 100 + index,
          ...escalation,
        }),
      },
      {
        role: "SUPPORTING RECEIPT",
        result: receipt({
          key: `safe-${index}`,
          sourceId: "RACE02B",
          at: 200 + index,
        }),
      },
    ]);
    assert.throws(
      () => fixture.instance.build(fixture.query),
      errorCode("AUTHORITY_CLAIM"),
    );
  }

  fixture.current.value = analysis(fixture.query, [
    {
      role: "SPEAKER VERIFIED",
      result: receipt({ key: "role-one", sourceId: "RACE01A", at: 100 }),
    },
    {
      role: "SUPPORTING RECEIPT",
      result: receipt({ key: "role-two", sourceId: "RACE02B", at: 200 }),
    },
  ]);
  assert.throws(
    () => fixture.instance.build(fixture.query),
    errorCode("UNSAFE_ROLE"),
  );
});

test("archival excerpts and hostile payload fields never leave the canonical Ask boundary", () => {
  const fixture = neutralFixture();
  fixture.current.value.evidenceChain[0].result.excerpt =
    "A private bounded archival excerpt that must not enter the trail.";
  fixture.current.value.evidenceChain[0].result.captionPayload = {
    events: ["private caption event"],
  };
  fixture.current.value.evidenceChain[1].result.video = "copied-video";
  fixture.current.value.evidenceChain[1].result.audio = "copied-audio";

  const trail = fixture.instance.build(fixture.query);
  const packet = fixture.instance.exportShare(trail);
  const trailText = JSON.stringify(trail);
  const packetText = JSON.stringify(packet);

  assert.doesNotMatch(trailText, /private bounded|private caption|copied-video|copied-audio/);
  assert.doesNotMatch(packetText, /private bounded|private caption|copied-video|copied-audio/);
  assert.ok(
    allKeys(packet).every(
      (key) =>
        !/^(speaker|speakerStatus|excerpt|quote|caption|captions|transcript|audio|video|media)$/i.test(
          key,
        ),
    ),
  );
});

test("real Ask launch chains preserve exact claim relations through round-trip", async () => {
  const sourceFiles = [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "search-engine.js",
  ];
  const files = [];
  for (const file of sourceFiles) {
    files.push([file, await readFile(new URL(file, demoRoot), "utf8")]);
  }
  const window = load(files);
  const ask = window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
  );
  const registry = new Map();
  for (const item of window.WWAM_CATALOG) {
    registry.set(item.id, Number(item.duration));
  }
  for (const source of [
    ...window.WWAM_LIVESTREAMS.streams,
    ...window.WWAM_POPULAR_LIVE.streams,
  ]) {
    registry.set(source.id, Number(source.duration));
  }
  const engine = window.ShokkerPlayAnswer.create({
    analyze(query) {
      return ask.ask(query);
    },
    bindings: {
      channelId: "wwam",
      channelPackFingerprint: "cp1-dd23bc386008689b",
      archiveAsOf: "2026-07-23",
      answerEngineVersion: "ask-v2.1.0",
    },
    sources: [...registry].map(([sourceId, durationSeconds]) => ({
      sourceId,
      durationSeconds,
      playable: true,
    })),
  });
  const cases = [
    {
      query: "How did their opinion on Halloween change?",
      status: "archive-boundary",
      limitation: /cannot prove a host changed their mind/i,
      stops: [
        [
          "EARLIEST INDEXED RECEIPT",
          "6VXSBDZ-3WE",
          1597,
          1627,
          "screen-referent-in-exact-commentary",
        ],
        [
          "LATEST INDEXED RECEIPT",
          "I6QKteG_hK0",
          5993,
          6023,
          "screen-referent-in-exact-commentary",
        ],
      ],
    },
    {
      query: "What do they hate about the Elm Street remake?",
      status: "supported",
      stops: [
        [
          "PRIMARY RECEIPT",
          "qTQdWKcwn4A",
          1132,
          1162,
          "screen-referent-in-exact-commentary",
        ],
        [
          "SUPPORTING RECEIPT",
          "qTQdWKcwn4A",
          2101,
          2131,
          "screen-referent-in-exact-commentary",
        ],
      ],
    },
  ];

  for (const scenario of cases) {
    const trail = engine.build(scenario.query);
    assert.equal(trail.status, scenario.status);
    assert.deepEqual(
      plain(trail.stops.map((stop) => [
        stop.role,
        stop.sourceId,
        stop.at,
        stop.end,
        stop.claimRelation,
      ])),
      scenario.stops,
    );
    if (scenario.limitation) {
      assert.match(trail.limitations.join(" "), scenario.limitation);
    }
    assert.ok(trail.stops.every((stop) => stop.speaker === null));

    const packet = engine.createShare(scenario.query);
    assert.deepEqual(
      plain(packet.stops.map((stop) => stop.claimRelation)),
      plain(trail.stops.map((stop) => stop.claimRelation)),
    );
    const restored = engine.restoreShare(plain(packet));
    assert.equal(restored.fingerprint, trail.fingerprint);
    assert.deepEqual(
      plain(restored.stops.map((stop) => stop.key)),
      plain(trail.stops.map((stop) => stop.key)),
    );
  }
});
