import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const sourceDossierSource = fs.readFileSync(
  path.join(demo, "source-dossier-engine.js"),
  "utf8",
);
const memoryCutSource = fs.readFileSync(
  path.join(demo, "memory-cut-engine.js"),
  "utf8",
);

function runtime() {
  const window = {};
  const sandbox = { window, globalThis: window };
  window.window = window;
  vm.createContext(sandbox);
  vm.runInContext(sourceDossierSource, sandbox, {
    filename: "source-dossier-engine.js",
  });
  vm.runInContext(memoryCutSource, sandbox, {
    filename: "memory-cut-engine.js",
  });
  return window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function receipt({
  key,
  at,
  end,
  label,
  entityIds = [],
  excerpt = "The field compresses and car thirty three takes the lead.",
  publicExcerptAllowed = true,
  reviewState = "timestamp-validated-human-curated-candidate",
}) {
  return {
    key,
    at,
    end,
    kind: "race-moment",
    label,
    excerpt: publicExcerptAllowed ? excerpt : "",
    evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
    evidenceType: publicExcerptAllowed
      ? "caption-excerpt"
      : "caption-topic-navigation",
    evidenceBasis: "official automatic-caption event",
    reviewState,
    speaker: null,
    speakerStatus: "not-diarized",
    promotionAllowed: false,
    publicExcerptAllowed,
    entityIds,
  };
}

function source({
  id,
  date,
  receipts = [],
  authority = "promoted-lane",
  title = `Round ${id.slice(-3)} Race Broadcast`,
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
    coverage: "caption-backed",
    authority,
    lanes: ["race-broadcast"],
    sourceType: "race",
    wordsAudited: 14000,
    summary: {
      text: "A source-bounded race file with timed booth receipts.",
      basis: "caption-derived source summary",
    },
    receipts,
    entities: [],
    artifacts: [],
    rightsPolicy: {
      speakerClaimsAllowed: false,
      rightsCleared: false,
    },
    warnings: ["Booth speakers are not diarized."],
    metrics: {},
  };
}

function racingFixture(overrides = {}) {
  return {
    schema: "shokker-source-dossier-input/v1",
    channel: {
      id: overrides.channelId || "neutral-racing",
      label: overrides.channelLabel || "Neutral Racing Archive",
      packFingerprint:
        overrides.packFingerprint || "cp1-neutral-racing-0001",
    },
    snapshotDate: overrides.snapshotDate || "2026-07-24",
    sources: [
      source({
        id: "RACEFILE01A",
        date: "2026-05-01",
        receipts: [
          receipt({
            key: "race:lead-change",
            at: 118,
            end: 130,
            label: "CAR 33 TAKES THE LEAD",
            entityIds: ["driver:car-33"],
          }),
        ],
      }),
      source({
        id: "RACEFILE02B",
        date: "2026-06-01",
        receipts: [
          receipt({
            key: "race:pit-cycle",
            at: 450.25,
            end: 466.25,
            label: "GREEN FLAG PIT CYCLE",
            entityIds: ["driver:car-33"],
          }),
        ],
      }),
      source({
        id: "RACEFILE03C",
        date: "2026-07-01",
        receipts: [
          receipt({
            key: "race:photo-finish",
            at: 3590.5,
            end: 3604.5,
            label: "PHOTO FINISH",
            entityIds: ["driver:car-33"],
            excerpt:
              "Car thirty three wins by one hundredth of a second at the stripe.",
          }),
        ],
      }),
      source({
        id: "RACEFILE04D",
        date: "2026-07-02",
        receipts: [
          receipt({
            key: "race:close-one",
            at: 700,
            end: 710,
            label: "FIRST NEARBY CALL",
          }),
          receipt({
            key: "race:close-two",
            at: 700.4,
            end: 711,
            label: "SECOND NEARBY CALL",
          }),
        ],
      }),
      source({
        id: "RACEFILE05E",
        date: "2026-07-03",
        authority: "quarantined-lane",
        receipts: [
          receipt({
            key: "race:quarantined",
            at: 800,
            end: 812,
            label: "UNREVIEWED CANDIDATE",
            reviewState: "quarantined-machine-candidate",
          }),
        ],
      }),
      source({
        id: "RACEFILE06F",
        date: "2026-07-04",
        receipts: [
          receipt({
            key: "race:withheld",
            at: 900,
            end: 912,
            label: "WITHHELD NAVIGATION",
            publicExcerptAllowed: false,
            reviewState: "withheld-source-boundary",
          }),
        ],
      }),
      source({
        id: "RACEFILE07G",
        date: "2026-07-05",
        authority: "source-only",
        receipts: [
          receipt({
            key: "race:source-only",
            at: 1000,
            end: 1012,
            label: "SOURCE ONLY CALL",
          }),
        ],
      }),
    ],
  };
}

function buildNeutral(overrides) {
  const window = runtime();
  const dossierEngine = window.ShokkerSourceDossier.create(
    racingFixture(overrides),
  );
  return {
    window,
    dossierEngine,
    engine: window.ShokkerMemoryCut.create({ dossierEngine }),
  };
}

function neutralRequest() {
  return {
    title: "CAR 33 // THREE-RACE PRESSURE CUT",
    introduction:
      "Three exact booth-navigation windows in explicit editorial order.",
    selections: [
      { id: "RACEFILE01A", at: 118 },
      { sourceId: "RACEFILE02B", receiptKey: "race:pit-cycle", at: 450 },
      { sourceId: "RACEFILE03C", key: "race:photo-finish", start: 3590.5 },
    ],
  };
}

function expectCode(code) {
  return (error) => {
    assert.equal(error?.name, "MemoryCutError");
    assert.equal(error?.code, code);
    return true;
  };
}

test("exports a deterministic closed API and exact launch preset", () => {
  const { window } = buildNeutral();
  const api = window.ShokkerMemoryCut;

  assert.equal(api.VERSION, "1.0.0");
  assert.equal(api.REQUEST_SCHEMA, "shokker-memory-cut-request/v1");
  assert.equal(api.CUT_SCHEMA, "shokker-memory-cut/v1");
  assert.equal(api.SHARE_SCHEMA, "shokker-memory-cut-share/v1");
  assert.equal(
    api.EDIT_BRIEF_SCHEMA,
    "shokker-memory-cut-edit-brief/v1",
  );
  assert.equal(api.MIN_STOPS, 3);
  assert.equal(api.MAX_STOPS, 8);
  assert.equal(api.RESOLVE_TOLERANCE_SECONDS, 0.55);
  assert.equal(
    api.VIEWER_TEXT_LABEL,
    "VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE",
  );

  const preset = plain(api.getPreset("character-ward"));
  assert.deepEqual(preset, plain(api.PRESETS.characterWard));
  assert.equal(preset.title, "THE CHARACTER WARD // 2021–2026");
  assert.deepEqual(
    preset.selections.map(({ sourceId, receiptKey, at, end }) => [
      sourceId,
      receiptKey,
      at,
      end,
    ]),
    [
      [
        "Mf-0Tv_KHCE",
        "character-receipt:slender-stomach",
        541.04,
        555.04,
      ],
      [
        "lCH31VtaSeI",
        "character-receipt:challis-boilermaker",
        6511.44,
        6525.44,
      ],
      [
        "Qc2vVFMO4ts",
        "character-receipt:loomis-biscuit-job",
        7693.02,
        7707.02,
      ],
      [
        "shoWljlgSUU",
        "character-receipt:feldman-atmosphere",
        8097.2,
        8111.2,
      ],
      [
        "LV2rmwEA0w4",
        "character-receipt:loomis-funding",
        9042.64,
        9056.64,
      ],
    ],
  );
  assert.equal(Object.isFrozen(api.PRESETS.characterWard), true);
  assert.throws(() => api.getPreset("made-up"), expectCode("UNKNOWN_PRESET"));
});

test("compiles a vocabulary-neutral racing cut in caller order with exact bounds", () => {
  const { engine } = buildNeutral();
  const cut = engine.compile(neutralRequest());
  const again = engine.compile(neutralRequest());

  assert.equal(cut.schema, "shokker-memory-cut/v1");
  assert.equal(cut.status, "ready");
  assert.equal(cut.eligible, true);
  assert.equal(
    cut.viewerTextLabel,
    "VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE",
  );
  assert.deepEqual(plain(cut.held), []);
  assert.deepEqual(
    plain(cut.stops.map((stop) => [stop.order, stop.key, stop.at, stop.end])),
    [
      [1, "race:lead-change", 118, 130],
      [2, "race:pit-cycle", 450.25, 466.25],
      [3, "race:photo-finish", 3590.5, 3604.5],
    ],
  );
  assert.deepEqual(
    plain(cut.stops.map((stop) => stop.inputIndex)),
    [0, 1, 2],
  );
  assert.equal(cut.stats.stopCount, 3);
  assert.equal(cut.stats.sourceCount, 3);
  assert.equal(cut.stats.runTimeSeconds, 42);
  assert.equal(cut.boundary.exactSourceNavigation, true);
  assert.equal(cut.boundary.transcriptIncluded, false);
  assert.equal(cut.boundary.copiedMediaIncluded, false);
  assert.equal(cut.boundary.creatorApproved, false);
  assert.equal(cut.boundary.rightsCleared, false);
  assert.equal(cut.boundary.speakerVerified, false);
  assert.equal(cut.boundary.speakerContinuity, false);
  assert.equal(cut.boundary.causality, false);
  assert.equal(cut.boundary.opinionChange, false);
  assert.equal(cut.boundary.trueOrigin, false);
  assert.equal(cut.boundary.creatorApproval, false);
  assert.equal(cut.boundary.canonMutated, false);
  assert.equal(cut.boundary.mediaCopied, false);
  assert.equal(cut.boundary.published, false);
  assert.equal(cut.fingerprint, again.fingerprint);
  assert.deepEqual(plain(cut), plain(again));
  assert.equal(Object.isFrozen(cut), true);
  assert.equal(Object.isFrozen(cut.stops[0]), true);
  assert.doesNotMatch(
    JSON.stringify(cut),
    /\b(?:wwam|halloween|loomis|challis|slenderman|feldman|horror)\b/i,
  );
});

test("exposes stable registry stats and bindings", () => {
  const { engine } = buildNeutral();
  const stats = plain(engine.getStats());
  const again = plain(engine.getStats());

  assert.deepEqual(stats, again);
  assert.deepEqual(stats, {
    sources: 7,
    receipts: 8,
    eligibleSources: 5,
    eligibleReceipts: 5,
    quarantinedSources: 1,
    withheldReceipts: 1,
    minimumStops: 3,
    maximumStops: 8,
    resolveToleranceSeconds: 0.55,
    registryFingerprint: engine.registryFingerprint,
  });
  assert.match(engine.registryFingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(
    engine.bindings.registryFingerprint,
    engine.registryFingerprint,
  );
  assert.equal(Object.isFrozen(engine.getStats()), true);
});

test("resolves canonical keys from receipt identity or one tight unique coordinate", () => {
  const { engine, dossierEngine } = buildNeutral();
  const fingerprint = dossierEngine
    .list()
    .find((sourceEntry) => sourceEntry.id === "RACEFILE02B")
    .sourceFingerprint;

  assert.equal(
    engine.resolveSelection({
      sourceId: "RACEFILE02B",
      receiptKey: "race:pit-cycle",
    }),
    "race:pit-cycle",
  );
  assert.equal(
    engine.resolveSelection({
      id: "RACEFILE02B",
      at: 450,
      sourceFingerprint: fingerprint,
    }),
    "race:pit-cycle",
  );
  assert.equal(
    engine.resolveSelection({
      sourceId: "RACEFILE02B",
      at: 450.8,
    }),
    "race:pit-cycle",
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE02B",
        receiptKey: "race:pit-cycle",
        at: 451,
      }),
    expectCode("COORDINATE_MISMATCH"),
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE04D",
        at: 700.2,
      }),
    expectCode("AMBIGUOUS_RECEIPT"),
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE02B",
        at: 800,
      }),
    expectCode("UNKNOWN_RECEIPT"),
  );
});

test("resolver and compiler fail closed on stale, foreign, and unknown identity", () => {
  const { engine } = buildNeutral();

  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE02B",
        sourceFingerprint: "fnv1a32:stale000",
        receiptKey: "race:pit-cycle",
      }),
    expectCode("STALE_SOURCE"),
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE01A",
        receiptKey: "race:pit-cycle",
      }),
    expectCode("FOREIGN_RECEIPT"),
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "NOTREGISTER",
        receiptKey: "race:pit-cycle",
      }),
    expectCode("UNKNOWN_SOURCE"),
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        id: "RACEFILE01A",
        sourceId: "RACEFILE02B",
        receiptKey: "race:pit-cycle",
      }),
    expectCode("FOREIGN_SELECTION"),
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE02B",
        receiptKey: "missing",
      }),
    expectCode("UNKNOWN_RECEIPT"),
  );
});

test("quarantined, withheld, and source-only receipts can never enter a cut", () => {
  const { engine } = buildNeutral();

  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE05E",
        receiptKey: "race:quarantined",
      }),
    expectCode("QUARANTINED_RECEIPT"),
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE06F",
        receiptKey: "race:withheld",
      }),
    expectCode("WITHHELD_RECEIPT"),
  );
  assert.throws(
    () =>
      engine.resolveSelection({
        sourceId: "RACEFILE07G",
        receiptKey: "race:source-only",
      }),
    expectCode("UNPROMOTED_SOURCE"),
  );
});

test("compile enforces three to eight unique receipts and rejects foreign authority", () => {
  const { engine } = buildNeutral();
  const request = neutralRequest();

  assert.throws(
    () =>
      engine.compile({
        title: request.title,
        selections: request.selections.slice(0, 2),
      }),
    expectCode("INVALID_STOP_COUNT"),
  );
  assert.throws(
    () =>
      engine.compile({
        title: request.title,
        selections: Array.from({ length: 9 }, () => request.selections[0]),
      }),
    expectCode("INVALID_STOP_COUNT"),
  );
  assert.throws(
    () =>
      engine.compile({
        title: request.title,
        selections: [
          request.selections[0],
          request.selections[0],
          request.selections[2],
        ],
      }),
    expectCode("DUPLICATE_RECEIPT"),
  );
  assert.throws(
    () =>
      engine.compile({
        ...request,
        schema: "some-other-cut/v1",
      }),
    expectCode("FOREIGN_SCHEMA"),
  );
  assert.throws(
    () =>
      engine.compile({
        ...request,
        title: "THE CREATOR-APPROVED FINAL CUT",
      }),
    expectCode("AUTHORITY_INFLATION"),
  );
  assert.throws(
    () =>
      engine.compile({
        ...request,
        introduction: "The rights-cleared official release.",
      }),
    expectCode("AUTHORITY_INFLATION"),
  );
});

test("compiled stop records can be reordered and recompiled without inventing evidence", () => {
  const { engine } = buildNeutral();
  const first = engine.compile(neutralRequest());
  const reordered = engine.compile({
    title: "REVERSE PRESSURE CUT",
    introduction: "",
    selections: [first.stops[2], first.stops[1], first.stops[0]],
  });

  assert.deepEqual(
    plain(reordered.stops.map((stop) => stop.key)),
    ["race:photo-finish", "race:pit-cycle", "race:lead-change"],
  );
  assert.deepEqual(
    plain(reordered.stops.map((stop) => [stop.at, stop.end])),
    [
      [3590.5, 3604.5],
      [450.25, 466.25],
      [118, 130],
    ],
  );
  assert.notEqual(reordered.fingerprint, first.fingerprint);
});

test("share packets are compact, keys-only, transcript-free, and exactly restorable", () => {
  const { engine } = buildNeutral();
  const cut = engine.compile(neutralRequest());
  const packet = engine.share(cut);
  const restored = engine.restore(packet);
  const text = JSON.stringify(packet);

  assert.deepEqual(Object.keys(plain(packet)), [
    "schema",
    "version",
    "title",
    "introduction",
    "viewerTextLabel",
    "bindings",
    "receiptKeys",
    "cutFingerprint",
    "fingerprint",
  ]);
  assert.deepEqual(plain(packet.receiptKeys), [
    "race:lead-change",
    "race:pit-cycle",
    "race:photo-finish",
  ]);
  assert.doesNotMatch(
    text,
    /sourceId|sourceFingerprint|dossierFingerprint|excerpt|caption|transcript|speaker|thumbnail|audio|video|start|end/,
  );
  assert.ok(text.length < 1000);
  assert.deepEqual(plain(restored), plain(cut));
  assert.equal(Object.isFrozen(packet), true);
  assert.equal(Object.isFrozen(restored), true);
});

test("share and restore reject altered cuts, packets, fields, and order", () => {
  const { engine } = buildNeutral();
  const cut = engine.compile(neutralRequest());
  const packet = plain(engine.share(cut));

  const alteredCut = plain(cut);
  alteredCut.stops[0].excerpt = "A replacement transcript claim.";
  assert.throws(() => engine.share(alteredCut), expectCode("TAMPERED_CUT"));

  const reordered = structuredClone(packet);
  reordered.receiptKeys.reverse();
  assert.throws(
    () => engine.restore(reordered),
    expectCode("TAMPERED_SHARE"),
  );

  const injected = structuredClone(packet);
  injected.excerpt = "not allowed";
  assert.throws(
    () => engine.restore(injected),
    expectCode("UNEXPECTED_FIELD"),
  );

  const duplicate = engine.share(
    engine.compile({
      ...neutralRequest(),
      title: "A DIFFERENT VALID CUT",
      selections: [
        neutralRequest().selections[2],
        neutralRequest().selections[1],
        neutralRequest().selections[0],
      ],
    }),
  );
  const duplicateTamper = plain(duplicate);
  duplicateTamper.receiptKeys[1] = duplicateTamper.receiptKeys[0];
  assert.throws(
    () => engine.restore(duplicateTamper),
    expectCode("TAMPERED_SHARE"),
  );
});

test("valid shares from foreign channels and stale snapshots fail closed", () => {
  const local = buildNeutral().engine;
  const foreign = buildNeutral({
    channelId: "different-racing",
    channelLabel: "Different Racing Archive",
    packFingerprint: "cp1-foreign-racing-001",
  }).engine;
  const stale = buildNeutral({
    snapshotDate: "2026-07-25",
  }).engine;

  assert.throws(
    () => local.restore(foreign.share(foreign.compile(neutralRequest()))),
    expectCode("FOREIGN_BINDINGS"),
  );
  assert.throws(
    () => local.restore(stale.share(stale.compile(neutralRequest()))),
    expectCode("STALE_REGISTRY"),
  );
});

test("creator edit briefs are deterministic JSON and Markdown with false authority claims", () => {
  const { engine } = buildNeutral();
  const cut = engine.compile(neutralRequest());
  const json = engine.exportEditBrief(cut);
  const explicitJson = engine.exportEditBrief(cut, { format: "json" });
  const markdown = engine.exportEditBrief(cut, "markdown");

  assert.equal(json.schema, "shokker-memory-cut-edit-brief/v1");
  assert.equal(json.timeline.length, 3);
  assert.equal(
    json.viewerTextLabel,
    "VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE",
  );
  assert.deepEqual(plain(json), plain(explicitJson));
  assert.match(json.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.ok(Object.values(json.authority).every((value) => value === false));
  assert.doesNotMatch(
    JSON.stringify(json),
    /The field compresses|one hundredth of a second/,
  );
  assert.match(
    markdown,
    /^> \*\*VIEWER-WRITTEN \/\/ NOT ARCHIVE EVIDENCE\*\*/m,
  );
  assert.match(markdown, /^# CAR 33 \/\/ THREE-RACE PRESSURE CUT/m);
  assert.match(markdown, /Creator approved: \*\*NO\*\*/);
  assert.match(markdown, /Rights cleared: \*\*NO\*\*/);
  assert.match(markdown, /Copied media included: \*\*NO\*\*/);
  assert.match(markdown, /Speaker verified: \*\*NO\*\*/);
  assert.match(markdown, /Published or final edit: \*\*NO\*\*/);
  assert.match(markdown, /race:lead-change/);
  assert.doesNotMatch(
    markdown,
    /The field compresses|one hundredth of a second/,
  );
  assert.equal(
    engine.exportEditBrief(cut, "md"),
    markdown,
  );
  assert.throws(
    () => engine.exportEditBrief(cut, "pdf"),
    expectCode("UNKNOWN_EXPORT_FORMAT"),
  );
});

test("the five-stop Character Ward compiles against all exact canonical WWAM receipts", () => {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  [
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
    "episode-guides.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "memory-cut-engine.js",
  ].forEach((file) => {
    vm.runInContext(
      fs.readFileSync(path.join(demo, file), "utf8"),
      sandbox,
      { filename: file },
    );
  });
  const window = sandbox.window;
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const archiveDeepPortfolio = window.WWAMArchiveDeepPortfolio.create(
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
    archiveDeepPortfolio,
    episodeGuides: window.WWAM_EPISODE_GUIDES,
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:memory-cut-test",
    },
  });
  const dossierEngine = window.ShokkerSourceDossier.create(adapted);
  const engine = window.ShokkerMemoryCut.create({ dossierEngine });
  const preset = window.ShokkerMemoryCut.getPreset("character-ward");
  const cut = engine.compile(preset);

  assert.equal(cut.title, "THE CHARACTER WARD // 2021–2026");
  assert.equal(cut.stats.stopCount, 5);
  assert.equal(cut.stats.sourceCount, 5);
  assert.equal(cut.stats.runTimeSeconds, 70);
  assert.deepEqual(
    plain(cut.stops.map((stop) => [stop.key, stop.at, stop.end])),
    [
      ["character-receipt:slender-stomach", 541.04, 555.04],
      ["character-receipt:challis-boilermaker", 6511.44, 6525.44],
      ["character-receipt:loomis-biscuit-job", 7693.02, 7707.02],
      ["character-receipt:feldman-atmosphere", 8097.2, 8111.2],
      ["character-receipt:loomis-funding", 9042.64, 9056.64],
    ],
  );
  assert.ok(
    cut.stops.every(
      (stop) =>
        stop.authority === "promoted-lane" &&
        stop.coverage === "caption-backed" &&
        stop.publicExcerptAllowed === true &&
        stop.quarantined === false,
    ),
  );
  assert.deepEqual(
    plain(engine.restore(engine.share(cut))),
    plain(cut),
  );
  assert.deepEqual(
    plain(engine.getStats()),
    {
      sources: 510,
      receipts: 1495,
      eligibleSources: 71,
      eligibleReceipts: 877,
      quarantinedSources: 40,
      withheldReceipts: 120,
      minimumStops: 3,
      maximumStops: 8,
      resolveToleranceSeconds: 0.55,
      registryFingerprint: engine.registryFingerprint,
    },
  );
  assert.deepEqual(plain(cut.stats), {
    stopCount: 5,
    sourceCount: 5,
    receiptCount: 5,
    runTimeSeconds: 70,
    firstSourceDate: "2021-04-24",
    lastSourceDate: "2026-07-23",
    evidenceTypes: ["curated-character-performance"],
  });
});
