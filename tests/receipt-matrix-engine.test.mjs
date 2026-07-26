import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const matrixSource = fs.readFileSync(
  path.join(demo, "receipt-matrix-engine.js"),
  "utf8",
);

const WWAM_POLICY = {
  id: "wwam-curated-character-performance/v1",
  source: {
    authority: "promoted-lane",
    coverage: "caption-backed",
  },
  receiptContracts: [
    {
      kind: "character-performance",
      evidenceType: "curated-character-performance",
      evidenceBasis: "exact-showcase-receipt",
      reviewState: "timestamp-validated-human-curated-candidate",
      publicExcerptAllowed: true,
      promotionAllowed: false,
    },
  ],
  requireSpeakerUndiarized: true,
};

const RACING_POLICY = {
  id: "neutral-racing-caption-receipts/v1",
  source: {
    authority: "promoted-lane",
    coverage: "caption-backed",
  },
  receiptContracts: [
    {
      kind: "race-moment",
      evidenceType: "caption-excerpt",
      evidenceBasis: "official automatic caption event",
      reviewState: "machine-candidate",
      publicExcerptAllowed: true,
      promotionAllowed: false,
    },
  ],
  requireSpeakerUndiarized: true,
};

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load(files) {
  const window = {};
  const sandbox = { window, globalThis: window };
  window.window = window;
  vm.createContext(sandbox);
  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return window;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((output, key) => {
    output[key] = canonical(value[key]);
    return output;
  }, {});
}

function fnv1a(value) {
  const text = String(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    hash ^= code & 0xff;
    hash = Math.imul(hash, 0x01000193);
    hash ^= code >>> 8;
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function refingerprint(dossier) {
  const body = plain(dossier);
  delete body.fingerprint;
  dossier.fingerprint = fnv1a(JSON.stringify(canonical(body)));
  return dossier;
}

function expectMatrixCode(code) {
  return (error) => {
    assert.equal(error?.name, "ReceiptMatrixError");
    assert.equal(error?.code, code);
    return true;
  };
}

let realFixture;

function buildRealFixture() {
  if (realFixture) return realFixture;
  const window = load([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "creator-studio-engine.js",
    "archive-atlas-data.js",
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "receipt-matrix-engine.js",
  ]);
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const archiveDeep = window.WWAMArchiveDeepPortfolio.create(
    [
      window.WWAM_ARCHIVE_DEEP,
      window.WWAM_ARCHIVE_DEEP_BATCH2,
      window.WWAM_ARCHIVE_DEEP_BATCH3,
      window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    window.WWAMArchiveDeepEngine,
  );
  const adapted = window.WWAMSourceDossierAdapter.build({
    atlas: window.WWAM_ARCHIVE_ATLAS,
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: archiveDeep,
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:test-fixture",
    },
  });
  const dossierEngine = window.ShokkerSourceDossier.create(adapted);
  const engine = window.ShokkerReceiptMatrix.create({
    dossierEngine,
    policy: WWAM_POLICY,
  });
  realFixture = { window, dossierEngine, engine };
  return realFixture;
}

function raceReceipt({
  key,
  at,
  label,
  entityIds,
  kind = "race-moment",
  evidenceType = "caption-excerpt",
  evidenceBasis = "official automatic caption event",
  reviewState = "machine-candidate",
  publicExcerptAllowed = true,
  promotionAllowed = false,
}) {
  return {
    key,
    at,
    end: at + 20,
    kind,
    label,
    excerpt: publicExcerptAllowed
      ? "Car thirty three reaches the stripe in a photo finish."
      : "",
    evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
    evidenceType,
    evidenceBasis,
    reviewState,
    speaker: null,
    speakerStatus: "not-diarized",
    promotionAllowed,
    publicExcerptAllowed,
    entityIds,
  };
}

function raceEntity(id, label, receiptKeys, basis = "timestamped-receipt") {
  return {
    id,
    label,
    type: id.startsWith("driver:") ? "driver" : "event",
    basis,
    receiptKeys,
  };
}

function raceSource({
  id,
  title,
  date,
  coverage = "caption-backed",
  authority = "promoted-lane",
  receipts = [],
  entities = [],
  artifacts = [],
}) {
  return {
    id,
    title,
    displayTitle: title,
    date,
    duration: 4200,
    views: 1200,
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`,
    availability: "public-at-snapshot",
    liveStatus: "was-live",
    coverage,
    authority,
    lanes: ["race-broadcast"],
    sourceType: "race",
    wordsAudited: receipts.length ? 14000 : 0,
    summary: receipts.length
      ? {
          text: "A source-bounded race file with timed booth receipts.",
          basis: "caption-derived source summary",
        }
      : null,
    receipts,
    entities,
    artifacts,
    rightsPolicy: {
      speakerClaimsAllowed: false,
      rightsCleared: false,
    },
    warnings: ["Booth speakers are not diarized."],
    metrics: {},
  };
}

function racingInput(channel = {}) {
  const shared = raceReceipt({
    key: "RACEFILE01A:shared-finish",
    at: 118,
    label: "CAR 33 PHOTO FINISH",
    entityIds: ["driver:car-33", "event:photo-finish"],
  });
  const driverOnly = raceReceipt({
    key: "RACEFILE02B:car33-lead",
    at: 3590,
    label: "CAR 33 LEAD CALL",
    entityIds: ["driver:car-33"],
  });
  const quarantined = raceReceipt({
    key: "RACEFILE04D:quarantined-finish",
    at: 900,
    label: "UNREVIEWED PHOTO FINISH",
    entityIds: ["driver:car-33", "event:photo-finish"],
  });
  const withheld = raceReceipt({
    key: "RACEFILE05E:withheld-finish",
    at: 1200,
    label: "WITHHELD PHOTO FINISH",
    entityIds: ["driver:car-33", "event:photo-finish"],
    publicExcerptAllowed: false,
    reviewState: "editor-withheld",
  });
  return {
    schema: "shokker-source-dossier-input/v1",
    channel: {
      id: channel.id || "neutral-racing",
      label: channel.label || "Neutral Racing Archive",
      packFingerprint: channel.packFingerprint || "cp1-0000000000000001",
    },
    snapshotDate: "2026-07-24",
    sources: [
      raceSource({
        id: "RACEFILE01A",
        title: "Round One Race Broadcast",
        date: "2026-06-01",
        receipts: [shared],
        entities: [
          raceEntity("driver:car-33", "Car 33", [shared.key]),
          raceEntity("event:photo-finish", "Photo Finish", [shared.key]),
        ],
        artifacts: [
          {
            id: "race-cut:photo-finish-season",
            kind: "supercut-draft",
            label: "PHOTO FINISH SEASON CUT",
            authority: "creator-draft",
            reviewState: "human-review-required",
            sourceIds: ["RACEFILE01A", "RACEFILE02B"],
            receiptKeys: [shared.key],
            at: 118,
            targetSection: "clip-lab",
            risk: "MEDIUM",
          },
        ],
      }),
      raceSource({
        id: "RACEFILE02B",
        title: "Round Two Race Broadcast",
        date: "2026-07-01",
        receipts: [driverOnly],
        entities: [
          raceEntity("driver:car-33", "Car 33", [driverOnly.key]),
        ],
        artifacts: [
          {
            id: "race-cut:photo-finish-season",
            kind: "supercut-draft",
            label: "PHOTO FINISH SEASON CUT",
            authority: "creator-draft",
            reviewState: "human-review-required",
            sourceIds: ["RACEFILE02B", "RACEFILE01A"],
            receiptKeys: [driverOnly.key],
            at: 3590,
            targetSection: "clip-lab",
            risk: "MEDIUM",
          },
        ],
      }),
      raceSource({
        id: "RACEFILE03C",
        title: "Photo Finish Preview Show",
        date: "2026-07-10",
        coverage: "metadata-only",
        authority: "source-only",
        entities: [
          raceEntity(
            "event:photo-finish",
            "Photo Finish",
            [],
            "cached-title-alias",
          ),
        ],
      }),
      raceSource({
        id: "RACEFILE04D",
        title: "Quarantined Race Broadcast",
        date: "2026-07-15",
        authority: "quarantined-lane",
        receipts: [quarantined],
        entities: [
          raceEntity("driver:car-33", "Car 33", [quarantined.key]),
          raceEntity("event:photo-finish", "Photo Finish", [quarantined.key]),
        ],
      }),
      raceSource({
        id: "RACEFILE05E",
        title: "Withheld Race Broadcast",
        date: "2026-07-20",
        receipts: [withheld],
        entities: [
          raceEntity("driver:car-33", "Car 33", [withheld.key]),
          raceEntity("event:photo-finish", "Photo Finish", [withheld.key]),
        ],
      }),
    ],
  };
}

function buildRacingFixture(input = racingInput()) {
  const window = load([
    "source-dossier-engine.js",
    "receipt-matrix-engine.js",
  ]);
  const dossierEngine = window.ShokkerSourceDossier.create(input);
  const engine = window.ShokkerReceiptMatrix.create({
    dossierEngine,
    policy: RACING_POLICY,
  });
  return { window, dossierEngine, engine };
}

test("WWAM golden: Loomis resolves to seven exact receipts across five sources", () => {
  const { engine } = buildRealFixture();
  const result = plain(engine.query({
    entityIds: ["character:loomis"],
    quantifier: "all",
    order: "source-date-asc",
  }));

  assert.equal(engine.version, "1.0.0");
  assert.equal(engine.schema, "shokker-receipt-matrix-result/v1");
  assert.equal(result.status, "supported");
  assert.equal(result.uniqueSourceCount, 5);
  assert.equal(result.eligibleReceiptCount, 7);
  assert.deepEqual(
    result.groups.map((group) => group.sourceId),
    [
      "WyT--HIrL8U",
      "Qc2vVFMO4ts",
      "N-UahfG8-gM",
      "ag3axSC9BpU",
      "LV2rmwEA0w4",
    ],
  );
  assert.deepEqual(
    result.groups.map((group) => group.receiptCount),
    [1, 1, 2, 1, 2],
  );
  assert.deepEqual(result.entityTotals, [
    {
      entityId: "character:loomis",
      label: "Dr. Loomis",
      type: "character",
      eligibleReceiptCount: 7,
      uniqueSourceCount: 5,
      matchedGroupCount: 5,
    },
  ]);
  assert.equal(Object.isFrozen(engine), true);
  assert.equal(Object.isFrozen(engine.query({
    entityIds: ["character:loomis"],
  })), true);
});

test("WWAM golden: all Loomis and Challis returns four sources and eleven receipts", () => {
  const { engine } = buildRealFixture();
  const spec = {
    entityIds: ["character:loomis", "character:challis"],
    quantifier: "all",
    order: "source-date-asc",
  };
  const result = plain(engine.query(spec));
  const reversed = plain(engine.query({
    ...spec,
    entityIds: [...spec.entityIds].reverse(),
  }));

  assert.deepEqual(reversed, result);
  assert.deepEqual(result.request.entityIds, [
    "character:challis",
    "character:loomis",
  ]);
  assert.equal(result.uniqueSourceCount, 4);
  assert.equal(result.eligibleReceiptCount, 11);
  assert.deepEqual(
    result.groups.map((group) => [group.sourceId, group.receiptCount]),
    [
      ["WyT--HIrL8U", 2],
      ["N-UahfG8-gM", 3],
      ["ag3axSC9BpU", 3],
      ["LV2rmwEA0w4", 3],
    ],
  );
  assert.deepEqual(
    result.entityTotals.map((entity) => [
      entity.entityId,
      entity.eligibleReceiptCount,
      entity.uniqueSourceCount,
    ]),
    [
      ["character:challis", 5, 4],
      ["character:loomis", 6, 4],
    ],
  );
  assert.ok(result.groups.every((group) => (
    group.entityCoverage.complete
    && group.entityCoverage.matched === 2
    && group.entityCoverage.requested === 2
  )));
  assert.equal(result.authority.sameMoment, false);
  assert.equal(result.authority.interaction, false);
  assert.equal(result.authority.speakerVerified, false);
  assert.equal(result.authority.causality, false);
  assert.equal(result.authority.trueOrigin, false);
  assert.equal(result.authority.creatorApproved, false);
  assert.equal(result.authority.rightsCleared, false);
  assert.equal(result.authority.canonMutated, false);
  assert.equal(result.authority.mediaCopied, false);
  assert.equal(result.boundary.sameSourceEvidenceOnly, true);
  assert.equal(result.boundary.sameMomentEstablished, false);
});

test("WWAM golden: any recurring character ranks the true source leaders", () => {
  const { engine } = buildRealFixture();
  const result = plain(engine.query({
    entityIds: [
      "character:loomis",
      "character:challis",
      "character:slenderman",
      "character:corey-feldman",
    ],
    quantifier: "any",
    order: "receipt-count-desc",
  }));

  assert.equal(result.uniqueSourceCount, 12);
  assert.equal(result.eligibleReceiptCount, 25);
  assert.deepEqual(
    result.groups.slice(0, 3).map((group) => [
      group.sourceId,
      group.receiptCount,
    ]),
    [
      ["LV2rmwEA0w4", 6],
      ["ag3axSC9BpU", 5],
      ["N-UahfG8-gM", 3],
    ],
  );
  assert.deepEqual(
    result.groups.map((group) => group.rank),
    Array.from({ length: 12 }, (_, index) => index + 1),
  );
  assert.equal(new Set(
    result.groups.flatMap((group) => (
      group.receipts.map((receipt) => receipt.receiptKey)
    )),
  ).size, 25);
});

test("WWAM registry stats, entity coverage, bindings, and fingerprints are pinned", () => {
  const { engine } = buildRealFixture();
  const stats = plain(engine.getStats());
  const entities = plain(engine.listEntities());
  const loomis = entities.find((entity) => entity.id === "character:loomis");

  assert.equal(stats.registrySources, 510);
  assert.equal(stats.registryReceipts, 1490);
  assert.equal(stats.eligibleSources, 12);
  assert.equal(stats.eligibleReceipts, 25);
  assert.equal(stats.eligibleEntities, 9);
  assert.equal(stats.closedPolicy, false);
  assert.deepEqual(
    [loomis.eligibleSourceCount, loomis.eligibleReceiptCount],
    [5, 7],
  );
  assert.match(engine.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.match(engine.bindings.registryFingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.match(engine.bindings.policyFingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(engine.policy.id, WWAM_POLICY.id);
  assert.equal(Object.isFrozen(engine.listEntities()), true);
  assert.equal(Object.isFrozen(engine.getStats()), true);
});

test("registry enumeration order cannot change engine or query fingerprints", () => {
  const { window, dossierEngine, engine } = buildRealFixture();
  const reversedDossierEngine = {
    list: () => [...dossierEngine.list()].reverse(),
    build: (sourceId) => dossierEngine.build(sourceId),
    getStats: () => dossierEngine.getStats(),
  };
  const reversed = window.ShokkerReceiptMatrix.create({
    dossierEngine: reversedDossierEngine,
    policy: WWAM_POLICY,
  });
  const spec = {
    entityIds: ["character:loomis", "character:challis"],
    quantifier: "all",
    order: "source-date-desc",
  };

  assert.equal(reversed.fingerprint, engine.fingerprint);
  assert.deepEqual(plain(reversed.query(spec)), plain(engine.query(spec)));
});

test("all four declared orders are deterministic and retain exact membership", () => {
  const { engine } = buildRealFixture();
  const base = {
    entityIds: ["character:loomis"],
    quantifier: "any",
  };
  const orders = [
    "receipt-count-desc",
    "source-date-asc",
    "source-date-desc",
    "title-asc",
  ];
  const results = orders.map((order) => plain(engine.query({ ...base, order })));

  assert.ok(results.every((result) => (
    result.uniqueSourceCount === 5
    && result.eligibleReceiptCount === 7
  )));
  assert.deepEqual(
    results[1].groups.map((group) => group.sourceId),
    [...results[2].groups.map((group) => group.sourceId)].reverse(),
  );
  for (const [index, order] of orders.entries()) {
    assert.equal(results[index].request.order, order);
    assert.deepEqual(
      plain(engine.query({ ...base, order })),
      results[index],
    );
  }
});

test("channel-neutral racing: a shared receipt counts once while covering two entities", () => {
  const { engine } = buildRacingFixture();
  const result = plain(engine.query({
    entityIds: ["event:photo-finish", "driver:car-33"],
    quantifier: "all",
    order: "source-date-asc",
  }));

  assert.equal(result.status, "supported");
  assert.equal(result.uniqueSourceCount, 1);
  assert.equal(result.eligibleReceiptCount, 1);
  assert.equal(result.groups[0].sourceId, "RACEFILE01A");
  assert.equal(result.groups[0].receiptCount, 1);
  assert.deepEqual(
    result.groups[0].receipts[0].matchedEntityIds,
    ["driver:car-33", "event:photo-finish"],
  );
  assert.deepEqual(
    result.groups[0].perEntity.map((entity) => [
      entity.entityId,
      entity.receiptCount,
      entity.receiptKeys,
    ]),
    [
      ["driver:car-33", 1, ["RACEFILE01A:shared-finish"]],
      ["event:photo-finish", 1, ["RACEFILE01A:shared-finish"]],
    ],
  );
  assert.equal(result.groups[0].authority.sameMoment, false);
  assert.equal(result.groups[0].receipts[0].speaker, null);
  assert.equal(result.groups[0].receipts[0].speakerStatus, "not-diarized");
  assert.equal(result.groups[0].receipts[0].creatorApproved, false);
  assert.equal(result.groups[0].receipts[0].rightsCleared, false);
});

test("metadata, artifacts, quarantined lanes, and withheld rows do not inflate results", () => {
  const { engine } = buildRacingFixture();
  const driver = plain(engine.query({
    entityIds: ["driver:car-33"],
    quantifier: "any",
    order: "source-date-asc",
  }));
  const event = plain(engine.query({
    entityIds: ["event:photo-finish"],
    quantifier: "any",
    order: "source-date-asc",
  }));

  assert.deepEqual(
    driver.groups.map((group) => group.sourceId),
    ["RACEFILE01A", "RACEFILE02B"],
  );
  assert.deepEqual(
    event.groups.map((group) => group.sourceId),
    ["RACEFILE01A"],
  );
  assert.equal(engine.getStats().excludedMatchingReceipts, 1);
  assert.equal(engine.getStats().eligibleReceipts, 2);
  assert.ok(
    driver.groups.flatMap((group) => group.receipts)
      .every((receipt) => !/quarantined|withheld/i.test(receipt.receiptKey)),
  );
});

test("closed default policy admits no receipt implicitly", () => {
  const { window, dossierEngine } = buildRacingFixture();
  const closed = window.ShokkerReceiptMatrix.create({ dossierEngine });
  const result = plain(closed.query({
    entityIds: ["driver:car-33"],
    quantifier: "any",
  }));

  assert.equal(closed.getStats().closedPolicy, true);
  assert.equal(closed.getStats().eligibleReceipts, 0);
  assert.equal(closed.getStats().eligibleSources, 0);
  assert.equal(result.status, "insufficient-evidence");
  assert.equal(result.uniqueSourceCount, 0);
  assert.equal(result.eligibleReceiptCount, 0);
  assert.deepEqual(result.groups, []);
});

test("unknown, duplicate, oversized, and unsupported query shapes fail closed", () => {
  const { engine } = buildRacingFixture();

  assert.throws(
    () => engine.query({ entityIds: ["driver:unknown"] }),
    expectMatrixCode("UNKNOWN_ENTITY"),
  );
  assert.throws(
    () => engine.query({
      entityIds: ["driver:car-33", "driver:car-33"],
    }),
    expectMatrixCode("DUPLICATE_ENTITY"),
  );
  assert.throws(
    () => engine.query({ entityIds: [] }),
    expectMatrixCode("INVALID_ENTITY_COUNT"),
  );
  assert.throws(
    () => engine.query({
      entityIds: Array.from({ length: 9 }, (_, index) => `driver:${index}`),
    }),
    expectMatrixCode("INVALID_ENTITY_COUNT"),
  );
  assert.throws(
    () => engine.query({
      entityIds: ["driver:car-33"],
      quantifier: "none",
    }),
    expectMatrixCode("UNKNOWN_QUANTIFIER"),
  );
  assert.throws(
    () => engine.query({
      entityIds: ["driver:car-33"],
      order: "viral-score",
    }),
    expectMatrixCode("UNKNOWN_ORDER"),
  );
  assert.throws(
    () => engine.query({
      entityIds: ["driver:car-33"],
      authority: true,
    }),
    expectMatrixCode("UNEXPECTED_FIELD"),
  );
});

test("query and policy accessors, inheritance, symbols, cycles, and duplicate contracts fail", () => {
  const { window, dossierEngine, engine } = buildRacingFixture();
  let invoked = false;
  const accessor = {};
  Object.defineProperty(accessor, "entityIds", {
    enumerable: true,
    get() {
      invoked = true;
      return ["driver:car-33"];
    },
  });
  const inherited = Object.create({ order: "title-asc" });
  inherited.entityIds = ["driver:car-33"];
  const symbol = { entityIds: ["driver:car-33"] };
  symbol[Symbol("hidden")] = true;
  const circular = { entityIds: ["driver:car-33"] };
  circular.self = circular;

  assert.throws(() => engine.query(accessor), expectMatrixCode("UNSAFE_DESCRIPTOR"));
  assert.equal(invoked, false);
  assert.throws(() => engine.query(inherited), expectMatrixCode("UNSAFE_OBJECT"));
  assert.throws(() => engine.query(symbol), expectMatrixCode("UNSAFE_DESCRIPTOR"));
  assert.throws(() => engine.query(circular), expectMatrixCode("CIRCULAR_INPUT"));

  const duplicateContracts = plain(RACING_POLICY);
  duplicateContracts.receiptContracts.push(
    plain(duplicateContracts.receiptContracts[0]),
  );
  assert.throws(
    () => window.ShokkerReceiptMatrix.create({
      dossierEngine,
      policy: duplicateContracts,
    }),
    expectMatrixCode("DUPLICATE_CONTRACT"),
  );

  const unsafePolicy = plain(RACING_POLICY);
  unsafePolicy.receiptContracts[0].promotionAllowed = true;
  assert.throws(
    () => window.ShokkerReceiptMatrix.create({
      dossierEngine,
      policy: unsafePolicy,
    }),
    expectMatrixCode("UNSAFE_POLICY"),
  );

  const speakerPolicy = plain(RACING_POLICY);
  speakerPolicy.requireSpeakerUndiarized = false;
  assert.throws(
    () => window.ShokkerReceiptMatrix.create({
      dossierEngine,
      policy: speakerPolicy,
    }),
    expectMatrixCode("UNSAFE_POLICY"),
  );
});

test("stale, tampered, mixed-binding, and duplicate-key dossier views are rejected", () => {
  const { window, dossierEngine } = buildRacingFixture();
  const listed = plain(dossierEngine.list());
  const firstId = listed[0].id;

  const staleList = plain(listed);
  staleList[0].sourceFingerprint = "fnv1a32:00000000";
  assert.throws(
    () => window.ShokkerReceiptMatrix.create({
      dossierEngine: {
        list: () => staleList,
        build: (sourceId) => dossierEngine.build(sourceId),
        getStats: () => dossierEngine.getStats(),
      },
      policy: RACING_POLICY,
    }),
    expectMatrixCode("STALE_REGISTRY"),
  );

  assert.throws(
    () => window.ShokkerReceiptMatrix.create({
      dossierEngine: {
        list: () => listed,
        build: (sourceId) => {
          const dossier = plain(dossierEngine.build(sourceId));
          if (sourceId === firstId) dossier.source.title += " TAMPERED";
          return dossier;
        },
        getStats: () => dossierEngine.getStats(),
      },
      policy: RACING_POLICY,
    }),
    expectMatrixCode("TAMPERED_DOSSIER"),
  );

  const foreignInput = racingInput({
    id: "foreign-racing",
    label: "Foreign Racing Archive",
    packFingerprint: "cp1-0000000000000002",
  });
  const foreignEngine = window.ShokkerSourceDossier.create(foreignInput);
  const mixedId = "RACEFILE02B";
  assert.throws(
    () => window.ShokkerReceiptMatrix.create({
      dossierEngine: {
        list: () => listed,
        build: (sourceId) => (
          sourceId === mixedId
            ? foreignEngine.build(sourceId)
            : dossierEngine.build(sourceId)
        ),
        getStats: () => dossierEngine.getStats(),
      },
      policy: RACING_POLICY,
    }),
    expectMatrixCode("MIXED_BINDINGS"),
  );

  const duplicateKey = "RACEFILE01A:shared-finish";
  assert.throws(
    () => window.ShokkerReceiptMatrix.create({
      dossierEngine: {
        list: () => listed,
        build: (sourceId) => {
          const dossier = plain(dossierEngine.build(sourceId));
          if (sourceId === "RACEFILE02B") {
            dossier.source.receipts[0].key = duplicateKey;
            dossier.source.entities[0].receiptKeys = [duplicateKey];
            refingerprint(dossier);
          }
          return dossier;
        },
        getStats: () => dossierEngine.getStats(),
      },
      policy: RACING_POLICY,
    }),
    expectMatrixCode("DUPLICATE_RECEIPT"),
  );
});

test("API surface and implementation remain channel-neutral", () => {
  const { window, engine } = buildRacingFixture();

  assert.deepEqual(plain(window.ShokkerReceiptMatrix.QUANTIFIERS), ["all", "any"]);
  assert.deepEqual(plain(window.ShokkerReceiptMatrix.ORDERS), [
    "receipt-count-desc",
    "source-date-asc",
    "source-date-desc",
    "title-asc",
  ]);
  assert.equal(window.ShokkerReceiptMatrix.MAX_ENTITIES, 8);
  assert.equal(typeof engine.query, "function");
  assert.equal(typeof engine.listEntities, "function");
  assert.equal(typeof engine.getStats, "function");
  assert.doesNotMatch(
    matrixSource,
    /WWAM|Halloween|Loomis|Challis|Slenderman|Feldman|horror/i,
  );
});
