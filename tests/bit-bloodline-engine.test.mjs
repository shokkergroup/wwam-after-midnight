import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const bloodlineSource = fs.readFileSync(
  path.join(demo, "bit-bloodline-engine.js"),
  "utf8",
);

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
    "episode-guides.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "memory-cut-engine.js",
    "bit-bloodline-engine.js",
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
    episodeGuides: window.WWAM_EPISODE_GUIDES,
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
  const engine = window.ShokkerBitBloodline.create({
    dossierEngine,
    lineages: showcase.getBitLineages(),
  });
  realFixture = { window, showcase, dossierEngine, engine };
  return realFixture;
}

const expected = {
  "ancestry:bit-challis-hotline": {
    label: "THE CHALLIS HOTLINE",
    appearances: 9,
    sources: 7,
    first: "2022-07-20",
    last: "2026-07-23",
    elapsed: 1464,
    echoes: [9, 11, 20],
    overlaps: 0,
    keys: [
      "character-receipt:challis-boilermaker",
      "character-receipt:challis-dj",
      "character-receipt:challis-alphabet",
      "character-receipt:challis-heman",
      "character-receipt:challis-game-impostor",
      "character-receipt:challis-courtney-answer",
      "character-receipt:challis-miguel",
      "character-receipt:challis-doctor",
      "character-receipt:challis-birthday",
    ],
  },
  "ancestry:bit-slenderman-dispatch": {
    label: "SLENDERMAN DISPATCH",
    appearances: 9,
    sources: 9,
    first: "2021-01-16",
    last: "2026-07-23",
    elapsed: 2014,
    echoes: [7, 5, 12],
    overlaps: 0,
    keys: [
      "character-receipt:slender-killer-knight",
      "character-receipt:slender-stomach",
      "character-receipt:slender-decade",
      "character-receipt:slender-jerry-shoutout",
      "character-receipt:slender-halloween-trailer",
      "character-receipt:slender-motivation",
      "character-receipt:slender-creed",
      "character-receipt:slender-last-resort",
      "character-receipt:slender-aliens",
    ],
  },
  "ancestry:bit-loomis-alert": {
    label: "THE LOOMIS ALERT SYSTEM",
    appearances: 9,
    sources: 7,
    first: "2022-08-20",
    last: "2026-07-23",
    elapsed: 1433,
    echoes: [6, 3, 9],
    overlaps: 0,
    keys: [
      "character-receipt:loomis-dj",
      "character-receipt:loomis-biscuit-job",
      "character-receipt:loomis-wolverine",
      "character-receipt:loomis-interview",
      "character-receipt:loomis-mortal-kombat",
      "character-receipt:loomis-zero-option",
      "character-receipt:loomis-sam",
      "character-receipt:loomis-funding",
      "character-receipt:loomis-pepto",
    ],
  },
  "ancestry:bit-feldman-frequency": {
    label: "THE FELDMAN FREQUENCY",
    appearances: 5,
    sources: 3,
    first: "2026-06-16",
    last: "2026-07-23",
    elapsed: 37,
    echoes: [6, 5, 11],
    overlaps: 1,
    keys: [
      "character-receipt:feldman-atmosphere",
      "character-receipt:feldman-titanic-two",
      "character-receipt:feldman-batman",
      "character-receipt:feldman-titanic",
      "character-receipt:feldman-wolfpack",
    ],
  },
};

const expectedOrder = [
  "ancestry:bit-slenderman-dispatch",
  "ancestry:bit-challis-hotline",
  "ancestry:bit-loomis-alert",
  "ancestry:bit-feldman-frequency",
];

test("exposes all four source-locked lineages and the exact 32 curated windows", () => {
  const { engine } = buildRealFixture();
  const lineages = plain(engine.list());

  assert.equal(engine.version, "1.0.0");
  assert.equal(lineages.length, 4);
  assert.deepEqual(
    lineages.map((lineage) => lineage.id),
    expectedOrder,
  );

  for (const lineage of lineages) {
    const pinned = expected[lineage.id];
    assert.ok(pinned, lineage.id);
    assert.equal(lineage.label, pinned.label);
    assert.equal(lineage.appearanceCount, pinned.appearances);
    assert.equal(lineage.appearances, pinned.appearances);
    assert.equal(lineage.laterAppearanceCount, pinned.appearances - 1);
    assert.equal(lineage.sourceCount, pinned.sources);
    assert.equal(lineage.firstDate, pinned.first);
    assert.equal(lineage.lastDate, pinned.last);
    assert.equal(lineage.elapsedDays, pinned.elapsed);
    assert.equal(lineage.echoStats.context, pinned.echoes[0]);
    assert.equal(lineage.echoStats.signal, pinned.echoes[1]);
    assert.equal(lineage.echoStats.total, pinned.echoes[2]);
    assert.equal(lineage.echoStats.sources, pinned.echoes[2]);
    assert.equal(lineage.overlapCount, pinned.overlaps);
    assert.deepEqual(lineage.receiptKeys, pinned.keys);
    assert.equal(lineage.performances[0].role, "earliest-curated-window");
    assert.equal(
      lineage.performances.at(-1).role,
      "latest-curated-window",
    );
    assert.ok(
      lineage.performances.slice(1, -1).every(
        (performance) => performance.role === "indexed-performance-candidate",
      ),
    );
    assert.ok(
      lineage.performances.every(
        (performance, index) => (
          performance.order === index + 1
          && performance.end > performance.at
          && performance.duration === 14
          && /^fnv1a32:[0-9a-f]{8}$/.test(performance.sourceFingerprint)
          && /^fnv1a32:[0-9a-f]{8}$/.test(performance.dossierFingerprint)
          && performance.evidenceType === "curated-character-performance"
          && performance.kind === "character-performance"
          && performance.evidenceBasis === "exact-showcase-receipt"
          && performance.reviewState === "timestamp-validated-human-curated-candidate"
          && performance.promotionAllowed === false
          && performance.publicExcerptAllowed === true
          && performance.entityIds.includes(lineage.bitId)
          && performance.entityIds.includes(lineage.characterId)
          && performance.speaker === null
          && performance.speakerStatus === "not-diarized"
        ),
      ),
    );
    assert.equal(lineage.artifactProof.kind, "bit-lineage");
    assert.equal(lineage.artifactProof.authority, "editor-review");
    assert.equal(lineage.artifactProof.reviewState, "derived-review-only");
    assert.equal(lineage.artifactProof.promotionAllowed, false);
    assert.equal(lineage.artifactProof.exactSourceMembership, true);
    assert.equal(lineage.artifactProof.exactReceiptMembership, true);
    assert.equal(lineage.profileMapping.characterId, lineage.characterId);
    assert.equal(lineage.profileMapping.clipSpeakerAttribution, false);
    assert.equal(lineage.boundaries.profileMappingIsSpeakerAttribution, false);
    assert.ok(lineage.echoes.every((echo) => (
      echo.navigationOnly === true
      && echo.machineCandidate === true
      && echo.quarantined === true
      && echo.playable === false
      && echo.cutEligible === false
      && echo.promotionAllowed === false
      && echo.boundedEnd === false
      && echo.performanceEvidence === false
      && echo.publicExcerptIncluded === false
      && echo.speaker === null
      && echo.speakerStatus === "not-diarized"
      && !Object.hasOwn(echo, "end")
      && !Object.hasOwn(echo, "duration")
      && !Object.hasOwn(echo, "excerpt")
      && !lineage.receiptKeys.includes(echo.receiptKey)
    )));
  }

  assert.deepEqual(plain(engine.getStats()), {
    lineages: 4,
    performances: 32,
    laterAppearances: 28,
    sources: 15,
    firstDate: "2021-01-16",
    lastDate: "2026-07-23",
    elapsedDays: 2014,
    overlaps: 1,
    echoes: 52,
    echoContext: 28,
    echoSignals: 24,
    echoSources: 25,
    playableEchoes: 0,
    cutEligibleEchoes: 0,
    profileMappings: 4,
    registrySources: 510,
    registryReceipts: 2047,
    registryFingerprint: engine.registryFingerprint,
  });
  assert.doesNotMatch(
    JSON.stringify(lineages),
    /first[\s-]*spark|later-echo|latest-indexed/i,
  );
  assert.doesNotMatch(
    bloodlineSource,
    /first[\s-]*spark|later-echo|latest-indexed/i,
  );
  assert.deepEqual(
    plain(engine.get("ancestry:bit-feldman-frequency").overlaps),
    [{
      sourceId: "ag3axSC9BpU",
      leftReceiptKey: "character-receipt:feldman-titanic-two",
      rightReceiptKey: "character-receipt:feldman-batman",
      overlapStart: 10925.68,
      overlapEnd: 10928.72,
      overlapSeconds: 3.04,
      preserved: true,
      merged: false,
    }],
  );
});

test("compiles a bloodline directly into an exact Memory Cut request", () => {
  const { window, dossierEngine, engine } = buildRealFixture();

  for (const id of Object.keys(expected)) {
    const lineage = plain(engine.get(id));
    const limit = Math.min(lineage.appearanceCount, 8);
    const packet = plain(engine.compileCutPacket(id, { limit }));
    const selectedPerformances = lineage.performances.length > limit
      ? lineage.performances.slice(0, limit - 1).concat(lineage.performances.at(-1))
      : lineage.performances;
    const selectedKeys = selectedPerformances.map(
      (performance) => performance.receiptKey,
    );
    assert.equal(packet.schema, "shokker-memory-cut-request/v1");
    assert.equal(packet.ok, true);
    assert.deepEqual(packet.rejected, []);
    assert.equal(
      packet.selectionPolicy,
      lineage.appearanceCount > limit
        ? "chronological-bookends"
        : "complete-chronology",
    );
    assert.doesNotMatch(
      JSON.stringify(packet),
      /first[\s-]*spark|later-echo|latest-indexed/i,
    );
    assert.deepEqual(
      packet.omittedReceiptKeys,
      lineage.receiptKeys.filter((key) => !selectedKeys.includes(key)),
    );
    assert.deepEqual(
      packet.selections.map((selection) => selection.receiptKey),
      selectedKeys,
    );
    assert.equal(packet.overlapCount, lineage.overlapCount);
    assert.deepEqual(packet.overlaps, lineage.overlaps);
    assert.ok(
      lineage.echoes.every(
        (echo) => !packet.selections.some(
          (selection) => selection.receiptKey === echo.receiptKey,
        ),
      ),
    );
    assert.ok(
      packet.selections.every((selection, index) => (
        selection.sourceId === selectedPerformances[index].sourceId
        && selection.sourceFingerprint === selectedPerformances[index].sourceFingerprint
        && selection.dossierFingerprint === selectedPerformances[index].dossierFingerprint
        && selection.at === selectedPerformances[index].at
        && selection.end === selectedPerformances[index].end
      )),
    );
    assert.ok(Object.values(packet.authority).every((value) => value === false));

    const cut = plain(
      window.ShokkerMemoryCut.create({ dossierEngine }).compile(packet),
    );
    assert.equal(cut.stats.stopCount, selectedPerformances.length);
    assert.deepEqual(
      cut.stops.map((stop) => stop.key),
      selectedKeys,
    );
  }
});

test("retains null-ended machine echoes while requiring exact ends for cut performances", () => {
  const { window, dossierEngine, showcase } = buildRealFixture();
  const unboundedEchoEngine = mutateDossierEngine(
    dossierEngine,
    (dossier) => {
      dossier.source.receipts.forEach((item) => {
        if ([
          "caption-character-context",
          "caption-character-signal",
        ].includes(item.evidenceType)) {
          item.end = null;
        }
      });
    },
  );
  const engine = window.ShokkerBitBloodline.create({
    dossierEngine: unboundedEchoEngine,
    lineages: showcase.getBitLineages(),
  });

  assert.equal(engine.getStats().echoes, 52);
  assert.ok(
    engine.list().flatMap((lineage) => lineage.echoes).every(
      (echo) => !Object.hasOwn(echo, "end") && echo.boundedEnd === false,
    ),
  );

  const neutral = neutralRuntime();
  const nullEndedPerformance = mutateDossierEngine(
    neutral.dossierEngine,
    (dossier, sourceId) => {
      if (sourceId === "RACEFILE02B") {
        dossier.source.receipts[0].end = null;
      }
    },
  );
  assert.throws(
    () => neutral.createEngine({ sourceEngine: nullEndedPerformance }),
    expectCode("UNTIMED_RECEIPT"),
  );
});

test("returns immutable deterministic views and honest origin/authority boundaries", () => {
  const { engine } = buildRealFixture();
  const first = engine.get("ancestry:bit-slenderman-dispatch");
  const byLabel = engine.get("SLENDERMAN DISPATCH");
  const again = engine.get("ancestry:bit-slenderman-dispatch");

  assert.deepEqual(plain(first), plain(byLabel));
  assert.deepEqual(plain(first), plain(again));
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.performances), true);
  assert.equal(first.boundaries.earliestKnownInIndexedCorpus, true);
  assert.equal(first.boundaries.exactSourceBounds, true);
  assert.equal(first.boundaries.trueOrigin, false);
  assert.ok(Object.values(first.authority).every((value) => value === false));
  assert.match(first.caution, /earliest curated window in current index/i);
  assert.match(first.caution, /not a claim of first-ever/i);
  assert.match(first.disclaimer, /speaker continuity/i);
  assert.throws(
    () => {
      first.performances.push({});
    },
    (error) => error?.name === "TypeError",
  );
});

function receipt({
  key,
  at,
  entityIds,
  publicExcerptAllowed = true,
  reviewState = "timestamp-validated-human-reviewed",
  kind = "race-moment",
  evidenceType = "caption-excerpt",
  evidenceBasis = "official-broadcast-caption",
  promotionAllowed = false,
}) {
  return {
    key,
    at,
    end: at + 12,
    kind,
    label: "INDEXED RECURRING CALL",
    excerpt: publicExcerptAllowed
      ? "The recurring call returns at the exact source timestamp."
      : "",
    evidenceLevel: "TIMESTAMP-VALIDATED RECEIPT",
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

function source({
  id,
  date,
  item,
  entityIds,
  lineageId,
  lineageSourceIds,
  authority = "promoted-lane",
  availability = "public-at-snapshot",
}) {
  return {
    id,
    title: `Round ${date}`,
    displayTitle: `Round ${date}`,
    date,
    duration: 5400,
    views: 900,
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`,
    availability,
    liveStatus: "was-live",
    coverage: "caption-backed",
    authority,
    lanes: ["weekly-event"],
    sourceType: "broadcast",
    wordsAudited: 12000,
    summary: {
      text: "A timestamped event broadcast.",
      basis: "caption-derived source summary",
    },
    receipts: [item],
    entities: entityIds.map((entityId) => ({
      id: entityId,
      label: entityId,
      type: entityId.split(":")[0],
      basis: "timestamped-receipt",
      receiptKeys: [item.key],
    })),
    artifacts: [{
      id: lineageId,
      kind: "recurrence-lineage",
      label: "CAR 33 RECURRING CHARGE",
      authority: "editor-review",
      reviewState: "derived-review-only",
      promotionAllowed: false,
      sourceIds: lineageSourceIds,
      receiptKeys: [item.key],
      at: null,
      targetSection: "",
      risk: "",
    }],
    rightsPolicy: {
      speakerClaimsAllowed: false,
      rightsCleared: false,
    },
    warnings: ["Speakers are not diarized."],
    metrics: {},
  };
}

function neutralInput({
  secondAuthority = "promoted-lane",
  secondPublicExcerpt = true,
  secondReviewState = "timestamp-validated-human-reviewed",
  secondKind = "race-moment",
  secondEvidenceType = "caption-excerpt",
  secondEvidenceBasis = "official-broadcast-caption",
  secondPromotionAllowed = false,
} = {}) {
  const patternId = "pattern:late-charge";
  const subjectId = "driver:car-33";
  const lineageId = "recurrence:car-33";
  const entityIds = [patternId, subjectId];
  const coordinates = [
    ["RACEFILE01A", "2026-05-01", 110],
    ["RACEFILE02B", "2026-06-01", 220],
    ["RACEFILE03C", "2026-07-01", 330],
  ];
  const lineageSourceIds = coordinates.map(([id]) => id);
  return {
    schema: "shokker-source-dossier-input/v1",
    channel: {
      id: "neutral-racing",
      label: "Neutral Racing Archive",
      packFingerprint: "cp1-neutral-racing",
    },
    snapshotDate: "2026-07-24",
    sources: coordinates.map(([id, date, at], index) => {
      const item = receipt({
        key: `recurrence:car-33:${index + 1}`,
        at,
        entityIds,
        publicExcerptAllowed: index === 1 ? secondPublicExcerpt : true,
        reviewState: index === 1
          ? secondReviewState
          : "timestamp-validated-human-reviewed",
        kind: index === 1 ? secondKind : "race-moment",
        evidenceType: index === 1
          ? secondEvidenceType
          : "caption-excerpt",
        evidenceBasis: index === 1
          ? secondEvidenceBasis
          : "official-broadcast-caption",
        promotionAllowed: index === 1 ? secondPromotionAllowed : false,
      });
      return source({
        id,
        date,
        item,
        entityIds,
        lineageId,
        lineageSourceIds,
        authority: index === 1 ? secondAuthority : "promoted-lane",
      });
    }),
  };
}

function neutralRuntime(input = neutralInput()) {
  const window = load([
    "source-dossier-engine.js",
    "memory-cut-engine.js",
    "bit-bloodline-engine.js",
  ]);
  const dossierEngine = window.ShokkerSourceDossier.create(input);
  const lineages = [{
    id: "recurrence:car-33",
    patternId: "pattern:late-charge",
    subjectId: "driver:car-33",
    label: "CAR 33 RECURRING CHARGE",
    subject: "Car 33",
    description: "Three exact calls across three event broadcasts.",
    performances: [
      {
        receiptId: "recurrence:car-33:3",
        sourceId: "RACEFILE03C",
        t: 330,
        end: 342,
      },
      {
        receiptId: "recurrence:car-33:1",
        sourceId: "RACEFILE01A",
        t: 110,
        end: 122,
      },
      {
        receiptId: "recurrence:car-33:2",
        sourceId: "RACEFILE02B",
        t: 220,
        end: 232,
      },
    ],
  }];
  const policy = {
    performance: {
      kind: "race-moment",
      evidenceType: "caption-excerpt",
      evidenceBasis: "official-broadcast-caption",
      reviewState: "timestamp-validated-human-reviewed",
      publicExcerptAllowed: true,
      promotionAllowed: false,
    },
    artifact: {
      kind: "recurrence-lineage",
      authority: "editor-review",
      reviewState: "derived-review-only",
      promotionAllowed: false,
    },
    entityFields: ["patternId", "subjectId"],
    profileEntityField: "subjectId",
    profileLabelField: "subject",
    echoes: { enabled: false, entityField: "subjectId" },
  };
  const createEngine = ({
    sourceEngine = dossierEngine,
    definitions = lineages,
  } = {}) => window.ShokkerBitBloodline.create({
    dossierEngine: sourceEngine,
    lineages: definitions,
    policy,
  });
  return { window, dossierEngine, lineages, policy, createEngine };
}

function expectCode(code) {
  return (error) => {
    assert.equal(error?.name, "BloodlineError");
    assert.equal(error?.code, code);
    return true;
  };
}

function mutateDossierEngine(engine, mutate) {
  return {
    list: engine.list,
    getStats: engine.getStats,
    build(sourceId) {
      const dossier = plain(engine.build(sourceId));
      mutate(dossier, sourceId);
      return dossier;
    },
  };
}

test("stays channel-neutral and sorts a racing recurrence from canonical dates", () => {
  const { window, dossierEngine, createEngine } = neutralRuntime();
  const engine = createEngine();
  const lineage = plain(engine.get("recurrence:car-33"));
  const packet = plain(engine.compileCutPacket(lineage.id));

  assert.deepEqual(
    lineage.performances.map((performance) => performance.receiptKey),
    [
      "recurrence:car-33:1",
      "recurrence:car-33:2",
      "recurrence:car-33:3",
    ],
  );
  assert.equal(lineage.sourceCount, 3);
  assert.equal(lineage.laterAppearanceCount, 2);
  assert.equal(lineage.elapsedDays, 61);
  assert.equal(lineage.elapsedLabel, "61 INDEXED DAYS");
  assert.deepEqual(lineage.entityBindings, {
    patternId: "pattern:late-charge",
    subjectId: "driver:car-33",
  });
  assert.equal(lineage.bitId, "");
  assert.equal(lineage.characterId, "");
  assert.equal(lineage.profileMapping.entityField, "subjectId");
  assert.equal(lineage.echoStats.total, 0);
  assert.equal(
    window.ShokkerMemoryCut.create({ dossierEngine }).compile(packet).stats.stopCount,
    3,
  );
  assert.doesNotMatch(
    bloodlineSource,
    /WWAM|Halloween|Loomis|Challis|Slenderman|Feldman|horror|movie/i,
  );
});

test("fails closed on stale, missing, duplicate, foreign, and untimed definitions", () => {
  const { lineages, createEngine } = neutralRuntime();
  const create = (definitions) => createEngine({ definitions });

  const staleSource = plain(lineages);
  staleSource[0].performances[0].sourceFingerprint = "fnv1a32:deadbeef";
  assert.throws(() => create(staleSource), expectCode("STALE_SOURCE"));

  const staleDossier = plain(lineages);
  staleDossier[0].performances[0].dossierFingerprint = "fnv1a32:deadbeef";
  assert.throws(() => create(staleDossier), expectCode("STALE_DOSSIER"));

  const missing = plain(lineages);
  missing[0].performances[0].receiptId = "recurrence:missing";
  assert.throws(() => create(missing), expectCode("MISSING_RECEIPT"));

  const duplicate = plain(lineages);
  duplicate[0].performances[1] = plain(duplicate[0].performances[0]);
  assert.throws(() => create(duplicate), expectCode("DUPLICATE_RECEIPT"));

  const foreign = plain(lineages);
  foreign[0].performances[0].sourceId = "RACEFILE01A";
  assert.throws(() => create(foreign), expectCode("FOREIGN_RECEIPT"));

  const untimed = plain(lineages);
  untimed[0].performances[0] = { sourceId: "RACEFILE03C" };
  assert.throws(() => create(untimed), expectCode("UNTIMED_RECEIPT"));

  const staleEnd = plain(lineages);
  staleEnd[0].performances[0].end = 999;
  assert.throws(() => create(staleEnd), expectCode("STALE_RECEIPT"));
});

test("fails closed on quarantined and withheld canonical receipts", () => {
  for (const [input, code] of [
    [neutralInput({ secondAuthority: "quarantined-lane" }), "QUARANTINED_RECEIPT"],
    [neutralInput({ secondPublicExcerpt: false }), "WITHHELD_RECEIPT"],
    [
      neutralInput({ secondReviewState: "withheld-source-boundary" }),
      "WITHHELD_RECEIPT",
    ],
  ]) {
    const { createEngine } = neutralRuntime(input);
    assert.throws(
      () => createEngine(),
      expectCode(code),
    );
  }
});

test("rejects context/signal substitution and every curated-performance contract mismatch", () => {
  const cases = [
    [
      {
        secondKind: "character-context",
        secondEvidenceType: "caption-character-context",
        secondEvidenceBasis: "archive-deep-quarantined-candidate",
        secondReviewState: "quarantined-machine-candidate",
      },
      "QUARANTINED_RECEIPT",
    ],
    [
      {
        secondKind: "character-signal",
        secondEvidenceType: "caption-character-signal",
        secondEvidenceBasis: "archive-deep-quarantined-candidate",
        secondReviewState: "quarantined-machine-candidate",
      },
      "QUARANTINED_RECEIPT",
    ],
    [
      { secondKind: "character-context" },
      "INVALID_PERFORMANCE_KIND",
    ],
    [
      { secondEvidenceType: "caption-character-context" },
      "INVALID_PERFORMANCE_EVIDENCE",
    ],
    [
      { secondEvidenceBasis: "archive-deep-quarantined-candidate" },
      "INVALID_PERFORMANCE_BASIS",
    ],
    [
      { secondReviewState: "machine-candidate" },
      "INVALID_PERFORMANCE_REVIEW",
    ],
    [
      { secondPromotionAllowed: true },
      "PROMOTION_OVERREACH",
    ],
  ];

  for (const [settings, code] of cases) {
    const { createEngine } = neutralRuntime(
      neutralInput(settings),
    );
    assert.throws(
      () => createEngine(),
      expectCode(code),
    );
  }
});

test("requires both configured entity memberships on every performance", () => {
  const input = neutralInput();
  input.sources[1].receipts[0].entityIds = ["driver:car-33"];
  const { createEngine } = neutralRuntime(input);

  assert.throws(
    () => createEngine(),
    expectCode("LINEAGE_ENTITY_MISMATCH"),
  );
});

test("verifies exact review-only artifact authority and source/receipt membership", () => {
  const authorityInput = neutralInput();
  authorityInput.sources.forEach((item) => {
    item.artifacts[0].authority = "creator-draft";
  });
  {
    const { createEngine } = neutralRuntime(authorityInput);
    assert.throws(
      () => createEngine(),
      expectCode("LINEAGE_ARTIFACT_MISMATCH"),
    );
  }

  const reviewInput = neutralInput();
  reviewInput.sources.forEach((item) => {
    item.artifacts[0].reviewState = "machine-candidate";
  });
  {
    const { createEngine } = neutralRuntime(reviewInput);
    assert.throws(
      () => createEngine(),
      expectCode("LINEAGE_ARTIFACT_MISMATCH"),
    );
  }

  const receiptInput = neutralInput();
  receiptInput.sources[1].artifacts[0].receiptKeys = [];
  {
    const { createEngine } = neutralRuntime(receiptInput);
    assert.throws(
      () => createEngine(),
      expectCode("LINEAGE_ARTIFACT_MEMBERSHIP"),
    );
  }

  const sourceInput = neutralInput();
  const extraSourceId = "RACEFILE04D";
  const expandedSourceIds = sourceInput.sources[0].artifacts[0].sourceIds
    .concat(extraSourceId);
  sourceInput.sources.forEach((item) => {
    item.artifacts[0].sourceIds = expandedSourceIds.slice();
  });
  sourceInput.sources.push(source({
    id: extraSourceId,
    date: "2026-07-15",
    item: receipt({
      key: "recurrence:car-33:4",
      at: 440,
      entityIds: ["pattern:late-charge", "driver:car-33"],
    }),
    entityIds: ["pattern:late-charge", "driver:car-33"],
    lineageId: "recurrence:car-33",
    lineageSourceIds: expandedSourceIds,
  }));
  {
    const { createEngine } = neutralRuntime(sourceInput);
    assert.throws(
      () => createEngine(),
      expectCode("LINEAGE_ARTIFACT_MEMBERSHIP"),
    );
  }

  {
    const { dossierEngine, createEngine } = neutralRuntime();
    const promotedArtifact = mutateDossierEngine(
      dossierEngine,
      (dossier, sourceId) => {
        if (sourceId === "RACEFILE02B") {
          dossier.source.artifacts[0].promotionAllowed = true;
        }
      },
    );
    assert.throws(
      () => createEngine({ sourceEngine: promotedArtifact }),
      expectCode("LINEAGE_ARTIFACT_MISMATCH"),
    );
  }
});

test("rejects stale registry and cross-channel registry substitutions", () => {
  const { window, dossierEngine, createEngine } = neutralRuntime();
  const staleList = {
    list() {
      const listed = plain(dossierEngine.list());
      listed[0].sourceFingerprint = "fnv1a32:deadbeef";
      return listed;
    },
    build: dossierEngine.build,
    getStats: dossierEngine.getStats,
  };
  assert.throws(
    () => createEngine({ sourceEngine: staleList }),
    expectCode("STALE_REGISTRY"),
  );

  const otherInput = neutralInput();
  otherInput.channel.id = "foreign-channel";
  otherInput.channel.label = "Foreign Channel";
  otherInput.channel.packFingerprint = "cp1-foreign";
  const foreignEngine = window.ShokkerSourceDossier.create(otherInput);
  const mixed = {
    list() {
      return dossierEngine.list();
    },
    build(sourceId) {
      return sourceId === "RACEFILE02B"
        ? foreignEngine.build(sourceId)
        : dossierEngine.build(sourceId);
    },
    getStats: dossierEngine.getStats,
  };
  assert.throws(
    () => createEngine({ sourceEngine: mixed }),
    expectCode("FOREIGN_REGISTRY"),
  );
});

test("keeps a bounded cut's earliest and latest curated windows", () => {
  const { engine } = buildRealFixture();
  const lineage = plain(engine.get("ancestry:bit-challis-hotline"));
  const packet = plain(engine.compileCutPacket(lineage.id, { limit: 4 }));

  assert.equal(packet.selectionPolicy, "chronological-bookends");
  assert.deepEqual(
    packet.selections.map((selection) => selection.receiptKey),
    lineage.receiptKeys.slice(0, 3).concat(lineage.receiptKeys.at(-1)),
  );
  assert.deepEqual(
    packet.omittedReceiptKeys,
    lineage.receiptKeys.slice(3, -1),
  );
  assert.throws(
    () => engine.compileCutPacket(lineage.id, { limit: 2 }),
    expectCode("INVALID_CUT_LIMIT"),
  );
  assert.throws(
    () => engine.get("not-a-lineage"),
    expectCode("UNKNOWN_LINEAGE"),
  );
});
