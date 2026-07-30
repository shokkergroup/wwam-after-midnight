import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const corpusFiles = [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "character-lore.js",
  "wwam-channel-dna.js",
  "showcase-engine.js",
  "riff-black-box-engine.js",
];
const formula =
  "28% source heat + 20% escalation + 16% callback density + 16% derailment + 14% room break + 6% topic collision";
const weights = Object.freeze({
  heat: 0.28,
  escalation: 0.2,
  callbackDensity: 0.16,
  derailment: 0.16,
  roomBreak: 0.14,
  topicCollision: 0.06,
});

function load(files = ["riff-black-box-engine.js"]) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  });
  return context.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixtureData() {
  const sources = [
    {
      id: "source00001",
      title: "First promoted source",
      type: "livestream",
      date: "2026-07-22",
      duration: 300,
      promotionAllowed: true,
    },
    {
      id: "source00002",
      title: "Second promoted source",
      type: "commentary",
      date: "2026-07-15",
      duration: 400,
      promotionAllowed: true,
    },
  ];
  const receipts = [
    {
      id: "receipt:before",
      sourceId: "source00001",
      t: 50,
      category: "INDEXED RECEIPT",
      excerpt: "An earlier promoted coordinate supplies navigation and nothing more.",
      score: 40,
      type: "moment",
      evidenceLevel: "machine",
      entityIds: ["source:source00001"],
      promotionAllowed: true,
    },
    {
      id: "receipt:anchor-one",
      sourceId: "source00001",
      t: 100,
      category: "THE ROOM BREAKS",
      excerpt: "A bounded literal excerpt supplies the promoted evidence for this first deterministic anchor.",
      score: 80,
      type: "moment",
      evidenceLevel: "machine",
      entityIds: [
        "source:source00001",
        "bit:alpha",
        "film:alpha",
        "franchise:alpha",
        "topic:alpha",
        "character:alpha",
      ],
      promotionAllowed: true,
    },
    {
      id: "receipt:anchor-two",
      sourceId: "source00002",
      t: 200,
      category: "FULL SEND",
      excerpt: "A second promoted excerpt gives the fixture a separately curated evidence tier.",
      score: 60,
      type: "moment",
      evidenceLevel: "curated-candidate",
      entityIds: ["source:source00002", "topic:beta"],
      promotionAllowed: true,
    },
  ];
  const moments = [
    {
      receiptId: "receipt:anchor-one",
      sourceId: "source00001",
      t: 100,
      category: "THE ROOM BREAKS",
      score: 80,
      label: "FIRST ANCHOR",
      dimensions: {
        heat: 80,
        escalation: 80,
        callbackDensity: 80,
        derailment: 80,
        roomBreak: 80,
        topicCollision: 80,
      },
      basis: {
        sourceHeat: 80,
        matchedBits: 1,
        indexedSubjects: 3,
        category: "THE ROOM BREAKS",
      },
      promotionAllowed: true,
    },
    {
      receiptId: "receipt:anchor-two",
      sourceId: "source00002",
      t: 200,
      category: "FULL SEND",
      score: 60,
      label: "SECOND ANCHOR",
      dimensions: {
        heat: 60,
        escalation: 60,
        callbackDensity: 60,
        derailment: 60,
        roomBreak: 60,
        topicCollision: 60,
      },
      basis: {
        sourceHeat: 60,
        matchedBits: 0,
        indexedSubjects: 1,
        category: "FULL SEND",
      },
      promotionAllowed: true,
    },
  ];
  const chemistry = {
    formula,
    weights: { ...weights },
    moments,
  };
  const showcase = {
    inputFingerprint: "fixture:promoted-ledger",
    sources,
    receipts,
    getRiffChemistry() {
      return chemistry;
    },
  };
  return { showcase, chemistry };
}

function buildFixture(window, options = {}) {
  const data = fixtureData();
  if (options.mutate) options.mutate(data);
  const engine = window.ShokkerRiffBlackBoxEngine.create({
    showcase: data.showcase,
    packFingerprint: options.packFingerprint || "fixture:channel-pack",
    labels: options.labels,
    contextSeconds: options.contextSeconds,
    neighborhoodSeconds: options.neighborhoodSeconds,
  });
  return { ...data, engine };
}

function buildCorpus(window, packFingerprint = "fixture:wwam-promoted-pack", labels) {
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const engine = window.ShokkerRiffBlackBoxEngine.create({
    showcase,
    packFingerprint,
    labels,
  });
  return { showcase, engine };
}

function assertContractFailure(callback, label) {
  assert.throws(
    callback,
    (error) =>
      error &&
      error.name === "RiffBlackBoxContractError" &&
      typeof error.code === "string" &&
      error.code.length > 0,
    label,
  );
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((output, key) => {
        output[key] = stableValue(value[key]);
        return output;
      }, {});
  }
  return value;
}

function fnv1a32(value) {
  let hash = 2166136261;
  for (const byte of Buffer.from(value, "utf8")) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(`00000000${(hash >>> 0).toString(16)}`).slice(-8)}`;
}

function reFingerprint(packet) {
  const copy = plain(packet);
  delete copy.fingerprint;
  packet.fingerprint = fnv1a32(JSON.stringify(stableValue(copy)));
  return packet;
}

function wordCount(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function collectUnsafeFields(value, trail = "$", output = [], seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return output;
  seen.add(value);
  Object.keys(value).forEach((key) => {
    const childTrail = Array.isArray(value)
      ? `${trail}[${key}]`
      : `${trail}.${key}`;
    if (
      /^(?:transcript|transcripts|caption|captions|event|events|fullEvents|rawEvents|rawCaptionEvents|segment|segments|fullSegments|rawSegments)$/i.test(
        key,
      )
    ) {
      output.push(childTrail);
    }
    collectUnsafeFields(value[key], childTrail, output, seen);
  });
  return output;
}

function collectExcerpts(value, output = [], seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return output;
  seen.add(value);
  Object.entries(value).forEach(([key, child]) => {
    if (/^(?:excerpt|quote)$/i.test(key)) output.push(String(child || ""));
    collectExcerpts(child, output, seen);
  });
  return output;
}

function assertHostileFailsClosed(engine, packet, label) {
  let report;
  assert.doesNotThrow(() => {
    report = engine.verify(packet);
  }, `${label}: verify must not crash`);
  assert.equal(report && report.ok, false, `${label}: verify must fail closed`);
  assert.throws(
    () => engine.restore(packet),
    (error) => error && error.code === "SNAPSHOT_INVALID",
    `${label}: restore must use the controlled snapshot error`,
  );
  assert.throws(
    () => engine.serialize(packet),
    (error) => error && error.code === "SNAPSHOT_INVALID",
    `${label}: serialize must use the controlled snapshot error`,
  );
}

test("quarantine and promotion-denied signals are rejected at source, receipt, and anchor boundaries", () => {
  const window = load();
  const hostileCases = [
    [
      "source promotion denied",
      ({ showcase }) => {
        showcase.sources[0].promotionAllowed = false;
      },
    ],
    [
      "source archive-deep lane",
      ({ showcase }) => {
        showcase.sources[0].lane = "archive-deep";
      },
    ],
    [
      "receipt promotion denied",
      ({ showcase }) => {
        showcase.receipts[1].promotionAllowed = false;
      },
    ],
    [
      "receipt quarantine flag",
      ({ showcase }) => {
        showcase.receipts[1].quarantined = true;
      },
    ],
    [
      "anchor promotion denied",
      ({ chemistry }) => {
        chemistry.moments[0].promoted = false;
      },
    ],
    [
      "anchor quarantine status",
      ({ chemistry }) => {
        chemistry.moments[0].evidenceState = "quarantined";
      },
    ],
  ];

  hostileCases.forEach(([label, mutate]) => {
    assertContractFailure(
      () => buildFixture(window, { mutate }),
      `must reject ${label}`,
    );
  });
});

test("literal basis counts are recomputed from entityIds and evidence metadata is fingerprint-bound", () => {
  const window = load();
  const base = buildFixture(window);
  const inspection = base.engine.inspect("receipt:anchor-one");

  assert.equal(inspection.literalBasis.matchedBits, 1);
  assert.equal(inspection.literalBasis.indexedSubjects, 3);
  assert.equal(inspection.anchor.evidenceTier, "machine");
  assert.equal(
    inspection.anchor.evidenceStatus,
    "not-editor-or-creator-certified",
  );

  assertContractFailure(
    () =>
      buildFixture(window, {
        mutate({ chemistry }) {
          chemistry.moments[0].basis.matchedBits = 0;
        },
      }),
    "supplied matchedBits cannot override entityIds",
  );
  assertContractFailure(
    () =>
      buildFixture(window, {
        mutate({ chemistry }) {
          chemistry.moments[0].basis.indexedSubjects = 2;
        },
      }),
    "supplied indexedSubjects cannot override entityIds",
  );

  const changedEvidence = buildFixture(window, {
    mutate({ showcase }) {
      showcase.receipts[1].evidenceLevel = "curated-candidate";
    },
  }).engine;
  const changedEntities = buildFixture(window, {
    mutate({ showcase }) {
      showcase.receipts[1].entityIds.push("character:extra");
    },
  }).engine;
  assert.notEqual(
    changedEvidence.binding.ledgerFingerprint,
    base.engine.binding.ledgerFingerprint,
  );
  assert.notEqual(
    changedEvidence.snapshot().fingerprint,
    base.engine.snapshot().fingerprint,
  );
  assert.notEqual(
    changedEntities.binding.ledgerFingerprint,
    base.engine.binding.ledgerFingerprint,
  );
  assert.notEqual(
    changedEntities.snapshot().fingerprint,
    base.engine.snapshot().fingerprint,
  );

  const rehashedTierTamper = plain(base.engine.snapshot());
  rehashedTierTamper.anchors[0].evidenceTier = "curated-candidate";
  reFingerprint(rehashedTierTamper);
  assert.equal(base.engine.verify(rehashedTierTamper).ok, false);
});

test("reaction cues are derived only from the bounded sixteen-word public excerpt", () => {
  const window = load();
  const words = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "laughter",
  ];
  const engine = buildFixture(window, {
    mutate({ showcase }) {
      showcase.receipts[1].excerpt = words.join(" ");
    },
  }).engine;
  const inspection = engine.inspect("receipt:anchor-one");

  assert.equal(inspection.anchor.literalBasis.excerptWordCount, 16);
  assert.equal(inspection.anchor.literalBasis.excerptTruncated, true);
  assert.doesNotMatch(inspection.anchor.literalBasis.excerpt, /\blaughter\b/i);
  assert.equal(inspection.reactionCue.status, "unknown");
  assert.equal(inspection.reactionCue.literal, null);
});

test("source, receipt, moment, and entity permutations preserve canonical fingerprints", () => {
  const window = load();
  const base = buildFixture(window).engine;
  const permuted = buildFixture(window, {
    mutate({ showcase, chemistry }) {
      showcase.sources.reverse();
      showcase.receipts.reverse();
      chemistry.moments.reverse();
      showcase.receipts.forEach((receipt) => receipt.entityIds.reverse());
    },
  }).engine;

  assert.equal(
    permuted.binding.ledgerFingerprint,
    base.binding.ledgerFingerprint,
  );
  assert.equal(
    permuted.binding.chemistryFingerprint,
    base.binding.chemistryFingerprint,
  );
  assert.equal(permuted.snapshot().fingerprint, base.snapshot().fingerprint);
  assert.equal(permuted.serialize(), base.serialize());
});

test("formula grammar rejects undeclared terms and optional weights must match the public formula", () => {
  const window = load();

  assertContractFailure(
    () =>
      buildFixture(window, {
        mutate({ chemistry }) {
          chemistry.weights.heat = 0.27;
        },
      }),
    "mismatched optional weights",
  );
  assertContractFailure(
    () =>
      buildFixture(window, {
        mutate({ chemistry }) {
          chemistry.formula += " + 1% audience alchemy";
        },
      }),
    "extra formula term",
  );

  const withoutOptionalWeights = buildFixture(window, {
    mutate({ chemistry }) {
      delete chemistry.weights;
    },
  }).engine;
  assert.deepEqual(plain(withoutOptionalWeights.weights), weights);
});

test("numeric evidence rejects coercion and requires exact integers where the schema promises integers", () => {
  const window = load();
  const cases = [
    [
      "string source duration",
      ({ showcase }) => {
        showcase.sources[0].duration = "300";
      },
      {},
    ],
    [
      "fractional source duration",
      ({ showcase }) => {
        showcase.sources[0].duration = 300.5;
      },
      {},
    ],
    [
      "string receipt coordinate",
      ({ showcase }) => {
        showcase.receipts[1].t = "100";
      },
      {},
    ],
    [
      "string receipt score",
      ({ showcase }) => {
        showcase.receipts[1].score = "80";
      },
      {},
    ],
    [
      "string anchor coordinate",
      ({ chemistry }) => {
        chemistry.moments[0].t = "100";
      },
      {},
    ],
    [
      "string anchor score",
      ({ chemistry }) => {
        chemistry.moments[0].score = "80";
      },
      {},
    ],
    [
      "fractional anchor score",
      ({ chemistry }) => {
        chemistry.moments[0].score = 80.5;
      },
      {},
    ],
    [
      "string dimension",
      ({ chemistry }) => {
        chemistry.moments[0].dimensions.heat = "80";
      },
      {},
    ],
    [
      "fractional dimension",
      ({ chemistry }) => {
        chemistry.moments[0].dimensions.heat = 80.5;
      },
      {},
    ],
    [
      "string literal source heat",
      ({ chemistry }) => {
        chemistry.moments[0].basis.sourceHeat = "80";
      },
      {},
    ],
    [
      "fractional matched bit count",
      ({ chemistry }) => {
        chemistry.moments[0].basis.matchedBits = 1.5;
      },
      {},
    ],
    [
      "boolean matched bit count",
      ({ chemistry }) => {
        chemistry.moments[0].basis.matchedBits = true;
      },
      {},
    ],
    [
      "string subject count",
      ({ chemistry }) => {
        chemistry.moments[0].basis.indexedSubjects = "3";
      },
      {},
    ],
    ["boolean context setting", null, { contextSeconds: true }],
    ["string context setting", null, { contextSeconds: "15" }],
    ["fractional neighborhood setting", null, { neighborhoodSeconds: 900.5 }],
  ];

  cases.forEach(([label, mutate, settings]) => {
    assertContractFailure(
      () => buildFixture(window, { mutate, ...settings }),
      `must reject ${label}`,
    );
  });
});

test("fractional source coordinates stay bound exactly while public playback normalizes down to whole seconds", () => {
  const window = load();
  const fractional = buildFixture(window, {
    mutate({ showcase, chemistry }) {
      showcase.receipts[1].t = 100.75;
      chemistry.moments[0].t = 100.75;
      showcase.receipts[1].score = 80.25;
      chemistry.moments[0].basis.sourceHeat = 80.25;
    },
  }).engine;
  const alternateFraction = buildFixture(window, {
    mutate({ showcase, chemistry }) {
      showcase.receipts[1].t = 100.25;
      chemistry.moments[0].t = 100.25;
      showcase.receipts[1].score = 80.25;
      chemistry.moments[0].basis.sourceHeat = 80.25;
    },
  }).engine;
  const inspection = fractional.inspect("receipt:anchor-one");

  assert.equal(inspection.anchor.sourceAt, 100.75);
  assert.equal(inspection.anchor.at, 100);
  assert.equal(inspection.anchor.t, 100);
  assert.ok(inspection.anchor.coordinatePrecision);
  assert.equal(inspection.contextWindow.anchor, 100);
  assert.equal(inspection.literalBasis.sourceHeat, 80.25);
  assert.notEqual(
    fractional.binding.ledgerFingerprint,
    alternateFraction.binding.ledgerFingerprint,
  );
  assert.notEqual(
    fractional.binding.chemistryFingerprint,
    alternateFraction.binding.chemistryFingerprint,
  );
  assert.notEqual(
    fractional.snapshot().fingerprint,
    alternateFraction.snapshot().fingerprint,
  );

  assertContractFailure(
    () =>
      buildFixture(window, {
        mutate({ showcase, chemistry }) {
          showcase.receipts[1].t = 100.75;
          chemistry.moments[0].t = 100.5;
        },
      }),
    "chemistry coordinate must match the exact raw fractional source coordinate",
  );
});

test("the full WWAM ledger exposes the exact machine and curated-candidate evidence split", () => {
  const window = load(corpusFiles);
  const { engine } = buildCorpus(window);
  const counted = {
    machine: 0,
    curatedCandidate: 0,
    unknown: 0,
  };

  engine.list().forEach((anchor) => {
    if (anchor.evidenceTier === "machine") counted.machine += 1;
    else if (anchor.evidenceTier === "curated-candidate") {
      counted.curatedCandidate += 1;
    } else counted.unknown += 1;
    assert.equal(
      anchor.evidenceStatus,
      "not-editor-or-creator-certified",
      anchor.receiptId,
    );
  });

  assert.deepEqual(counted, {
    machine: 276,
    curatedCandidate: 32,
    unknown: 0,
  });
  assert.equal(engine.metrics.machineEvidenceCount, 276);
  assert.equal(engine.metrics.curatedCandidateEvidenceCount, 32);
  assert.equal(engine.metrics.evidenceTierCounts.machine, 276);
  assert.equal(engine.metrics.evidenceTierCounts["curated-candidate"], 32);
});

test("foreign pack and foreign promoted ledger failures stay diagnostically distinct", () => {
  const window = load();
  const base = buildFixture(window, {
    packFingerprint: "pack:shared",
  }).engine;
  const foreignPack = buildFixture(window, {
    packFingerprint: "pack:foreign",
  }).engine;
  const foreignLedger = buildFixture(window, {
    packFingerprint: "pack:shared",
    mutate({ showcase }) {
      showcase.receipts[1].entityIds.push("character:foreign-ledger");
    },
  }).engine;
  const packet = base.snapshot();

  const packReport = foreignPack.verify(packet);
  assert.equal(packReport.ok, false);
  assert.match(packReport.errors.join(" "), /foreign channel-pack fingerprint/i);
  assert.doesNotMatch(
    packReport.errors.join(" "),
    /foreign promoted-ledger fingerprint/i,
  );

  const ledgerReport = foreignLedger.verify(packet);
  assert.equal(ledgerReport.ok, false);
  assert.match(
    ledgerReport.errors.join(" "),
    /foreign promoted-ledger fingerprint/i,
  );
  assert.doesNotMatch(
    ledgerReport.errors.join(" "),
    /foreign channel-pack fingerprint/i,
  );
});

test("every inspection and export omits transcript-like payloads and caps excerpts at sixteen words", () => {
  const window = load(corpusFiles);
  const { engine } = buildCorpus(window);

  engine.list().forEach((anchor) => {
    const inspection = engine.inspect(anchor.receiptId);
    assert.ok(inspection, anchor.receiptId);
    assert.deepEqual(
      collectUnsafeFields(inspection),
      [],
      anchor.receiptId,
    );
    collectExcerpts(inspection).forEach((excerpt) => {
      assert.ok(wordCount(excerpt) <= 16, `${anchor.receiptId}: ${excerpt}`);
    });
  });

  const snapshot = engine.snapshot();
  assert.deepEqual(collectUnsafeFields(snapshot), []);
  collectExcerpts(snapshot).forEach((excerpt) => {
    assert.ok(wordCount(excerpt) <= 16, excerpt);
  });
  assert.doesNotMatch(
    engine.serialize(),
    /"(?:transcript|transcripts|caption|captions|event|events|segment|segments)"\s*:/i,
  );
});

test("custom-label snapshots are deterministic, label-sensitive, and pinned", () => {
  const window = load();
  const labels = {
    productName: "Portable Comedy Flight Recorder",
    anchorName: "Verified laugh coordinate",
    contextName: "Official playback window",
    literalReaction: "LITERAL TAPE REACTION",
    unknownReaction: "NO LITERAL REACTION IN EXCERPT",
    dimensions: {
      heat: "Pressure",
      escalation: "Escalation",
      callbackDensity: "Callback load",
      derailment: "Derailment",
      roomBreak: "Room response",
      topicCollision: "Topic collision",
    },
  };
  const first = buildFixture(window, {
    packFingerprint: "fixture:custom-label-pack",
    labels,
  }).engine;
  const second = buildFixture(window, {
    packFingerprint: "fixture:custom-label-pack",
    labels: plain(labels),
  }).engine;
  const defaults = buildFixture(window, {
    packFingerprint: "fixture:custom-label-pack",
  }).engine;

  assert.equal(first.snapshot().fingerprint, second.snapshot().fingerprint);
  assert.equal(first.serialize(), second.serialize());
  assert.notEqual(first.snapshot().fingerprint, defaults.snapshot().fingerprint);
  assert.match(first.snapshot().fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  // Runtime labels are part of the portable proof artifact, not decorative UI state.
  assert.equal(first.snapshot().fingerprint, "fnv1a32:f462032a");
});

test("hostile snapshots fail closed without prototype pollution or native serialization crashes", () => {
  const window = load();
  const engine = buildFixture(window).engine;
  const cleanSnapshot = engine.snapshot();
  const cases = [];

  const enumerableProto = plain(cleanSnapshot);
  Object.defineProperty(enumerableProto, "__proto__", {
    value: { polluted: true },
    enumerable: true,
    configurable: true,
    writable: true,
  });
  cases.push(["enumerable __proto__", enumerableProto]);

  const inherited = Object.assign(
    Object.create({ inheritedPoison: "present" }),
    plain(cleanSnapshot),
  );
  cases.push(["inherited enumerable property", inherited]);

  const arrayExtra = plain(cleanSnapshot);
  arrayExtra.anchors.unexpected = "array metadata";
  cases.push(["array extra property", arrayExtra]);

  const objectCycle = plain(cleanSnapshot);
  objectCycle.self = objectCycle;
  cases.push(["object cycle", objectCycle]);

  const arrayCycle = plain(cleanSnapshot);
  arrayCycle.anchors.push(arrayCycle.anchors);
  cases.push(["array cycle", arrayCycle]);

  const undefinedValue = plain(cleanSnapshot);
  undefinedValue.unexpected = undefined;
  cases.push(["undefined", undefinedValue]);

  const functionValue = plain(cleanSnapshot);
  functionValue.unexpected = () => "not serializable";
  cases.push(["function", functionValue]);

  const nanValue = plain(cleanSnapshot);
  nanValue.metrics.anchorCount = Number.NaN;
  cases.push(["NaN", nanValue]);

  const infinityValue = plain(cleanSnapshot);
  infinityValue.metrics.anchorCount = Number.POSITIVE_INFINITY;
  cases.push(["Infinity", infinityValue]);

  cases.forEach(([label, packet]) => {
    assertHostileFailsClosed(engine, packet, label);
  });
  assert.equal({}.polluted, undefined);
  assert.equal({}.inheritedPoison, undefined);
});

test("all returned surfaces are deeply frozen, detached from inputs, and mutation-isolated", () => {
  const window = load();
  const built = buildFixture(window);
  const { engine, showcase, chemistry } = built;
  const initial = plain(engine.snapshot());
  const anchors = engine.list();
  const inspection = engine.inspect("receipt:anchor-one");
  const snapshot = engine.snapshot();

  [
    engine,
    engine.binding,
    engine.labels,
    engine.labels.dimensions,
    engine.dimensions,
    engine.dimensions[0],
    engine.weights,
    engine.metrics,
    engine.metrics.evidenceTierCounts,
    engine.policy,
    anchors,
    anchors[0],
    anchors[0].dimensions,
    inspection,
    inspection.anchor,
    inspection.contextWindow,
    inspection.neighbors,
    inspection.literalBasis,
    snapshot,
    snapshot.binding,
    snapshot.anchors,
    snapshot.anchors[0],
  ].forEach((surface, index) => {
    assert.equal(Object.isFrozen(surface), true, `surface ${index} must be frozen`);
  });

  assert.throws(() => {
    engine.metrics.anchorCount = 999;
  }, (error) => error && error.name === "TypeError");
  assert.throws(() => {
    anchors[0].score = 0;
  }, (error) => error && error.name === "TypeError");
  assert.throws(() => {
    snapshot.anchors.push({});
  }, (error) => error && error.name === "TypeError");

  showcase.sources[0].title = "Mutated after construction";
  showcase.receipts[1].excerpt = "Mutated after construction";
  showcase.receipts[1].evidenceLevel = "creator";
  showcase.receipts[1].entityIds.push("bit:late-mutation");
  chemistry.moments[0].dimensions.heat = 0;
  chemistry.moments[0].basis.matchedBits = 999;

  assert.deepEqual(plain(engine.snapshot()), initial);
  assert.notEqual(engine.list(), anchors);
  assert.notEqual(engine.snapshot(), snapshot);
  assert.deepEqual(plain(engine.list()), plain(anchors));
});
