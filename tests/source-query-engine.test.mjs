import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const demoRoot = new URL("../public/demo/", import.meta.url);
const dossierSource = await readFile(
  new URL("source-dossier-engine.js", demoRoot),
  "utf8",
);
const querySource = await readFile(
  new URL("source-query-engine.js", demoRoot),
  "utf8",
);

function load() {
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(dossierSource, sandbox, {
    filename: "source-dossier-engine.js",
  });
  vm.runInContext(querySource, sandbox, {
    filename: "source-query-engine.js",
  });
  return sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function receipt({
  key,
  at,
  end = at + 20,
  kind = "moment",
  label,
  excerpt = "",
  evidenceType = "caption-excerpt",
  entityIds = [],
  publicExcerptAllowed = true,
  promotionAllowed = true,
}) {
  return {
    key,
    at,
    end,
    kind,
    label,
    excerpt,
    evidenceLevel: "timestamped-source-receipt",
    evidenceType,
    evidenceBasis: "exact-caption-coordinate",
    reviewState: "machine-surfaced",
    speaker: null,
    speakerStatus: "not-diarized",
    promotionAllowed,
    publicExcerptAllowed,
    entityIds,
  };
}

function entity({
  id,
  label,
  type,
  receiptKeys = [],
  basis = "timestamped-receipt",
}) {
  return { id, label, type, basis, receiptKeys };
}

function artifact({
  id,
  kind,
  label,
  sourceIds,
  receiptKeys,
  at = null,
  authority = "fan-navigation",
}) {
  return {
    id,
    kind,
    label,
    authority,
    reviewState: "review-required",
    sourceIds,
    receiptKeys,
    at,
    targetSection: "highlights",
    risk: "not-assigned",
  };
}

function source(overrides) {
  const id = overrides.id;
  return {
    id,
    title: overrides.title,
    displayTitle: overrides.displayTitle || overrides.title,
    date: overrides.date,
    duration: overrides.duration,
    views: overrides.views ?? 100,
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`,
    availability: overrides.availability || "not-captured",
    liveStatus: overrides.liveStatus || "not-captured",
    coverage: overrides.coverage || "caption-backed",
    authority: overrides.authority || "promoted-lane",
    lanes: overrides.lanes || ["primary"],
    sourceType: overrides.sourceType || "broadcast",
    wordsAudited: overrides.wordsAudited || 0,
    summary: overrides.summary ?? null,
    rightsPolicy: {},
    warnings: overrides.warnings || [
      "Automatic captions do not identify a speaker.",
    ],
    metrics: {},
    receipts: overrides.receipts || [],
    entities: overrides.entities || [],
    artifacts: overrides.artifacts || [],
  };
}

function fixtureInput() {
  const raceOne = "RACE00001A1";
  const raceTwo = "RACE00002B2";
  const latest = "LV2rmwEA0w4";
  const duplicateTitle = "ag3axSC9BpU";
  const metadataOnly = "FVuwRHM0kcc";
  const limited = "x6tvsGRHgU0";
  const unavailable = "GONE00001Z9";

  return {
    schema: "shokker-source-dossier-input/v1",
    snapshotDate: "2026-07-24",
    channel: {
      id: "neutral-memory",
      label: "Neutral Memory",
      packFingerprint: "cp1-0000000000000001",
    },
    sources: [
      source({
        id: raceOne,
        title: "Round One Broadcast",
        date: "2026-07-01",
        duration: 4200,
        wordsAudited: 52000,
        summary: {
          text: "A registered whole-source summary of the opening round.",
          basis: "caption-audited-source-summary",
        },
        receipts: [
          receipt({
            key: "race-start",
            at: 118,
            label: "Green flag scramble",
            excerpt: "The leaders run side by side into turn one.",
            entityIds: ["driver:car-33", "event:opening-lap"],
          }),
          receipt({
            key: "race-pit-route",
            at: 900,
            label: "Pit strategy route",
            excerpt: "",
            evidenceType: "caption-topic-navigation",
            kind: "topic-navigation",
            entityIds: ["topic:pit-strategy"],
            publicExcerptAllowed: false,
            promotionAllowed: false,
          }),
          receipt({
            key: "race-photo-finish",
            at: 3598,
            label: "Photo finish",
            excerpt: "They are door to door at the stripe.",
            entityIds: ["driver:car-33", "event:photo-finish"],
          }),
        ],
        entities: [
          entity({
            id: "driver:car-33",
            label: "Car 33",
            type: "driver",
            receiptKeys: ["race-start", "race-photo-finish"],
          }),
          entity({
            id: "event:opening-lap",
            label: "Opening lap",
            type: "event",
            receiptKeys: ["race-start"],
          }),
          entity({
            id: "event:photo-finish",
            label: "Photo finish",
            type: "event",
            receiptKeys: ["race-photo-finish"],
          }),
          entity({
            id: "topic:pit-strategy",
            label: "Pit strategy",
            type: "topic",
            receiptKeys: ["race-pit-route"],
          }),
        ],
        artifacts: [
          artifact({
            id: "race-feature-package",
            kind: "highlight-reel",
            label: "Round One Highlight Reel",
            sourceIds: [raceOne, raceTwo],
            receiptKeys: ["race-photo-finish", "race-restart"],
            at: 3598,
          }),
        ],
      }),
      source({
        id: raceTwo,
        title: "Round Two Broadcast",
        date: "2026-07-08",
        duration: 4600,
        receipts: [
          receipt({
            key: "race-restart",
            at: 3900,
            label: "Late restart",
            excerpt: "Car 33 leads the field back to the restart.",
            entityIds: ["driver:car-33", "event:late-restart"],
          }),
        ],
        entities: [
          entity({
            id: "driver:car-33",
            label: "Car 33",
            type: "driver",
            receiptKeys: ["race-restart"],
          }),
          entity({
            id: "event:late-restart",
            label: "Late restart",
            type: "event",
            receiptKeys: ["race-restart"],
          }),
        ],
      }),
      source({
        id: latest,
        title: "We Watched A Movie Live! Movie News and More",
        date: "2026-07-23",
        duration: 12785,
        views: 5067,
        sourceType: "livestream",
        wordsAudited: 43645,
        summary: {
          text: "A registered source summary covering movie news and recurring bits.",
          basis: "caption-audited-source-summary",
        },
        receipts: [
          receipt({
            key: "loomis-funding",
            at: 9042.64,
            end: 9056.64,
            label: "Bureaucratic combat",
            excerpt: "Vote in politicians that will give me funding.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-loomis"],
          }),
          receipt({
            key: "loomis-pepto",
            at: 10734.88,
            end: 10748.88,
            label: "Medical authority",
            excerpt: "Three Pepto to stop that chocolate spray.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-loomis"],
          }),
          receipt({
            key: "challis-birthday",
            at: 8309.12,
            end: 8323.12,
            label: "Birthday advice",
            excerpt: "This is the doctor if you could not tell.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-challis"],
          }),
        ],
        entities: [
          entity({
            id: "character:dr-loomis",
            label: "Dr. Loomis",
            type: "character",
            receiptKeys: ["loomis-funding", "loomis-pepto"],
          }),
          entity({
            id: "character:dr-challis",
            label: "Dr. Challis",
            type: "character",
            receiptKeys: ["challis-birthday"],
          }),
        ],
        artifacts: [
          artifact({
            id: "loomis-emergency-cut",
            kind: "character-supercut",
            label: "The Emergency Broadcast",
            sourceIds: [latest],
            receiptKeys: ["loomis-funding", "loomis-pepto"],
            authority: "creator-draft",
          }),
        ],
      }),
      source({
        id: duplicateTitle,
        title: "We Watched A Movie LIVE! Movie News and More",
        date: "2026-07-09",
        duration: 12360,
        views: 7567,
        sourceType: "livestream",
        receipts: [
          receipt({
            key: "challis-miguel",
            at: 3860.72,
            end: 3874.72,
            label: "Flirtation",
            excerpt: "My name is the doctor.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-challis"],
          }),
          receipt({
            key: "challis-doctor",
            at: 9851.76,
            end: 9865.76,
            label: "Questionable medicine",
            excerpt: "I am a real doctor.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-challis"],
          }),
        ],
        entities: [
          entity({
            id: "character:dr-challis",
            label: "Dr. Challis",
            type: "character",
            receiptKeys: ["challis-miguel", "challis-doctor"],
          }),
        ],
      }),
      source({
        id: metadataOnly,
        title: "Marvel VS DC Movies Bracket Tournament",
        date: "2026-05-26",
        duration: 11427,
        coverage: "metadata-only",
        authority: "source-only",
        lanes: ["archive-metadata"],
        entities: [
          entity({
            id: "topic:marvel-vs-dc",
            label: "Marvel vs DC",
            type: "topic",
            basis: "cached-title-alias",
            receiptKeys: [],
          }),
        ],
      }),
      source({
        id: limited,
        title: "Box Office Tier List",
        date: "2026-06-30",
        duration: 11484,
        coverage: "caption-limited",
        authority: "source-only",
        lanes: ["limited"],
        entities: [
          entity({
            id: "topic:box-office",
            label: "Box office",
            type: "topic",
            basis: "cached-title-alias",
            receiptKeys: [],
          }),
        ],
      }),
      source({
        id: unavailable,
        title: "Unavailable Broadcast",
        date: "2025-01-01",
        duration: 3600,
        coverage: "unavailable",
        authority: "source-only",
        availability: "unavailable",
        lanes: ["archive-metadata"],
      }),
    ],
  };
}

function runtime(options = {}) {
  const window = load();
  const dossierEngine = window.ShokkerSourceDossier.create(fixtureInput());
  const queryEngine = window.ShokkerSourceQuery.create({
    dossierEngine,
    vocabulary: options.vocabulary,
  });
  return { window, dossierEngine, queryEngine };
}

function request(sourceId, query, extra = {}) {
  return {
    schema: "shokker-source-query/v1",
    sourceId,
    query,
    ...extra,
  };
}

function errorCode(code) {
  return (error) => {
    assert.equal(error?.name, "SourceQueryError");
    assert.equal(error?.code, code);
    return true;
  };
}

test("publishes one frozen channel-neutral API and closed vocabularies", () => {
  const { window } = runtime();
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "ShokkerSourceQuery",
  );

  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.configurable, false);
  assert.ok(Object.isFrozen(window.ShokkerSourceQuery));
  assert.equal(window.ShokkerSourceQuery.VERSION, "1.0.0");
  assert.equal(
    window.ShokkerSourceQuery.REQUEST_SCHEMA,
    "shokker-source-query/v1",
  );
  assert.equal(
    window.ShokkerSourceQuery.RESULT_SCHEMA,
    "shokker-source-query-result/v1",
  );
  assert.deepEqual(plain(window.ShokkerSourceQuery.RESULT_TYPES), [
    "receipt",
    "entity",
    "artifact",
    "connection",
    "metadata",
  ]);
  assert.deepEqual(plain(window.ShokkerSourceQuery.STATUSES), [
    "supported",
    "inventory",
    "proof",
    "metadata-only",
    "caption-limited",
    "unavailable",
    "insufficient-evidence",
    "speaker-refused",
    "ranking-refused",
    "stale-source",
  ]);
  assert.doesNotMatch(
    querySource,
    /WWAM|Halloween|Loomis|Challis|Ghostface|Scream|Nightmare on Elm Street/i,
  );
});

test("builds the exact source before parsing and returns deterministic inventory proof", () => {
  const { dossierEngine, window } = runtime();
  const calls = [];
  const wrapped = {
    build(sourceId) {
      calls.push(sourceId);
      return dossierEngine.build(sourceId);
    },
  };
  const engine = window.ShokkerSourceQuery.create({
    dossierEngine: wrapped,
  });
  const input = request("RACE00001A1", "What is indexed here?");
  const first = engine.answer(input);
  const second = engine.answer(input);

  assert.deepEqual(calls, ["RACE00001A1", "RACE00001A1"]);
  assert.deepEqual(plain(first), plain(second));
  assert.equal(first.schema, "shokker-source-query-result/v1");
  assert.equal(first.status, "inventory");
  assert.equal(first.intent, "inventory");
  assert.equal(first.scope.sourceId, "RACE00001A1");
  assert.equal(first.sourceProof.sourceId, "RACE00001A1");
  assert.equal(first.sourceProof.receiptCount, 3);
  assert.equal(first.sourceProof.entityCount, 4);
  assert.equal(first.sourceProof.artifactCount, 1);
  assert.equal(first.results.length, 1);
  assert.equal(first.results[0].type, "metadata");
  assert.equal(first.results[0].field, "source-inventory");
  assert.equal(first.results[0].value.receipts.total, 3);
  assert.equal(first.boundary.exactSourceOnly, true);
  assert.equal(first.boundary.crossSourceSubstitution, false);
  assert.match(first.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.results));
  assert.ok(Object.isFrozen(first.results[0]));
});

test("neutral racing search returns only exact-source evidence and honors the anchor", () => {
  const { queryEngine } = runtime();
  const finish = queryEngine.answer(
    request(
      "RACE00001A1",
      "Show the photo finish for car 33",
      { limit: 4 },
    ),
  );

  assert.equal(finish.status, "supported");
  assert.equal(finish.scope.sourceId, "RACE00001A1");
  assert.equal(finish.results[0].type, "receipt");
  assert.equal(finish.results[0].key, "race-photo-finish");
  assert.ok(finish.results.every((result) =>
    result.sourceId === "RACE00001A1"));
  assert.ok(finish.results
    .filter((result) => result.type === "receipt")
    .every((result) => result.speaker === null));

  const nearFinish = queryEngine.answer(
    request("RACE00001A1", "Show receipts", {
      at: 3580,
      limit: 2,
    }),
  );
  assert.equal(nearFinish.results[0].key, "race-photo-finish");
  assert.equal(nearFinish.results[0].matchedBy, "anchor-proximity");

  const withheld = queryEngine.answer(
    request("RACE00001A1", "Show the pit strategy moment"),
  );
  assert.equal(withheld.status, "supported");
  assert.equal(withheld.results[0].key, "race-pit-route");
  assert.equal(withheld.results[0].excerpt, "");
  assert.equal(withheld.results[0].publicExcerptAllowed, false);
});

test("duplicate upload titles cannot redirect a source-bound character query", () => {
  const { queryEngine } = runtime();
  const latest = queryEngine.answer(
    request("LV2rmwEA0w4", "Show me Dr. Loomis moments"),
  );
  assert.equal(latest.status, "supported");
  assert.deepEqual(
    plain(latest.results
      .filter((result) => result.type === "receipt")
      .map((result) => [result.sourceId, result.key, result.at])),
    [
      ["LV2rmwEA0w4", "loomis-funding", 9042.64],
      ["LV2rmwEA0w4", "loomis-pepto", 10734.88],
    ],
  );

  const duplicate = queryEngine.answer(
    request("ag3axSC9BpU", "Show me Dr. Challis moments"),
  );
  assert.equal(duplicate.status, "supported");
  assert.deepEqual(
    plain(duplicate.results
      .filter((result) => result.type === "receipt")
      .map((result) => [result.sourceId, result.key, result.at])),
    [
      ["ag3axSC9BpU", "challis-miguel", 3860.72],
      ["ag3axSC9BpU", "challis-doctor", 9851.76],
    ],
  );
  assert.ok(duplicate.results.every((result) =>
    result.sourceId === "ag3axSC9BpU"));
  assert.ok(!JSON.stringify(duplicate).includes("challis-birthday"));
  assert.equal(duplicate.boundary.titleInferenceUsed, false);
});

test("wrong subjects refuse instead of borrowing evidence from another source", () => {
  const { queryEngine } = runtime();
  const result = queryEngine.answer(
    request("LV2rmwEA0w4", "Show me Ghostface moments"),
  );

  assert.equal(result.status, "insufficient-evidence");
  assert.equal(result.resultCount, 0);
  assert.deepEqual(plain(result.results), []);
  assert.equal(result.scope.sourceId, "LV2rmwEA0w4");
  assert.equal(result.boundary.returnedSourceId, "LV2rmwEA0w4");
  assert.equal(result.boundary.crossSourceSubstitution, false);
});

test("metadata-only, caption-limited, and unavailable sources fail closed", () => {
  const { queryEngine } = runtime();
  const metadata = queryEngine.answer(
    request("FVuwRHM0kcc", "Who won the Marvel vs DC bracket?"),
  );
  assert.equal(metadata.status, "metadata-only");
  assert.equal(metadata.resultCount, 0);
  assert.match(metadata.message, /contents are not indexed/i);
  assert.ok(metadata.limitations.some((item) =>
    /title cannot be used to infer/i.test(item)));
  assert.doesNotMatch(JSON.stringify(metadata), /\bwinner\b/i);

  const metadataProof = queryEngine.answer(
    request("FVuwRHM0kcc", "Show source proof"),
  );
  assert.equal(metadataProof.status, "proof");
  assert.equal(metadataProof.results[0].type, "metadata");
  assert.equal(metadataProof.results[0].field, "source-proof");
  assert.equal(metadataProof.results[0].value.coverage, "metadata-only");

  const limited = queryEngine.answer(
    request("x6tvsGRHgU0", "What topics are in this source?"),
  );
  assert.equal(limited.status, "caption-limited");
  assert.equal(limited.resultCount, 0);
  assert.doesNotMatch(JSON.stringify(limited.results), /box office/i);

  const unavailable = queryEngine.answer(
    request("GONE00001Z9", "What happened in this source?"),
  );
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.resultCount, 0);
});

test("speaker and ranking requests refuse without inflating authority", () => {
  const { queryEngine } = runtime();
  const speaker = queryEngine.answer(
    request("RACE00001A1", "Who said the photo finish line?"),
  );

  assert.equal(speaker.status, "speaker-refused");
  assert.ok(speaker.results.length >= 1);
  assert.ok(speaker.results.every((result) =>
    result.type === "receipt" &&
    result.sourceId === "RACE00001A1" &&
    result.speaker === null &&
    result.speakerStatus === "not-diarized"));
  assert.equal(speaker.boundary.speaker, null);
  assert.equal(speaker.boundary.speakerDiarized, false);
  assert.equal(speaker.boundary.originEstablished, false);
  assert.equal(speaker.boundary.causalityEstablished, false);
  assert.equal(speaker.boundary.rightsCleared, false);
  assert.equal(speaker.boundary.creatorApproved, false);

  const ranking = queryEngine.answer(
    request("RACE00001A1", "What is the most unhinged moment?"),
  );
  assert.equal(ranking.status, "ranking-refused");
  assert.equal(ranking.resultCount, 0);
  assert.ok(ranking.limitations.some((item) =>
    /not a ranking/i.test(item)));
});

test("summary, artifacts, entities, and connections remain typed and bounded", () => {
  const { queryEngine } = runtime();
  const summary = queryEngine.answer(
    request("RACE00001A1", "Summarize this source"),
  );
  assert.equal(summary.status, "supported");
  assert.equal(summary.results[0].type, "metadata");
  assert.equal(summary.results[0].field, "registered-summary");
  assert.equal(
    summary.results[0].value.basis,
    "caption-audited-source-summary",
  );

  const artifacts = queryEngine.answer(
    request("RACE00001A1", "Show highlight artifacts"),
  );
  assert.equal(artifacts.status, "supported");
  assert.equal(artifacts.results[0].type, "artifact");
  assert.equal(artifacts.results[0].id, "race-feature-package");
  assert.equal(artifacts.results[0].creatorApproved, false);
  assert.equal(artifacts.results[0].rightsCleared, false);

  const entities = queryEngine.answer(
    request("RACE00001A1", "Show topics"),
  );
  assert.equal(entities.status, "supported");
  assert.ok(entities.results.length >= 1);
  assert.ok(entities.results.every((result) =>
    result.type === "entity" &&
    result.sourceId === "RACE00001A1"));

  const connections = queryEngine.answer(
    request("RACE00001A1", "Show related sources"),
  );
  assert.equal(connections.status, "supported");
  assert.equal(connections.results[0].type, "connection");
  assert.equal(connections.results[0].sourceId, "RACE00001A1");
  assert.equal(connections.results[0].targetSourceId, "RACE00002B2");
  assert.equal(connections.results[0].relationshipOnly, true);
  assert.equal(connections.results[0].contentClaim, false);
  assert.equal(connections.results[0].originEstablished, false);
  assert.equal(connections.results[0].causalityEstablished, false);
  assert.equal(connections.boundary.crossSourceSubstitution, false);
});

test("stale source fingerprints refuse before query interpretation", () => {
  const { dossierEngine, window } = runtime();
  const calls = [];
  const engine = window.ShokkerSourceQuery.create({
    dossierEngine: {
      build(sourceId) {
        calls.push(sourceId);
        return dossierEngine.build(sourceId);
      },
    },
  });
  const result = engine.answer(
    request("LV2rmwEA0w4", "What is the funniest moment?", {
      sourceFingerprint: "fnv1a32:deadbeef",
    }),
  );

  assert.deepEqual(calls, ["LV2rmwEA0w4"]);
  assert.equal(result.status, "stale-source");
  assert.equal(result.intent, "unparsed");
  assert.equal(result.resultCount, 0);
  assert.ok(result.limitations.some((item) =>
    /no query was parsed/i.test(item)));
});

test("custom vocabulary changes intent only and cannot weaken source scope", () => {
  const { queryEngine } = runtime({
    vocabulary: {
      ranking: ["wildest"],
      stopwords: ["sequence"],
    },
  });
  const result = queryEngine.answer(
    request("RACE00001A1", "What is the wildest sequence?"),
  );

  assert.equal(result.status, "ranking-refused");
  assert.equal(result.resultCount, 0);
  assert.equal(result.scope.sourceId, "RACE00001A1");
  assert.equal(result.boundary.crossSourceSubstitution, false);
  assert.ok(queryEngine.getVocabulary().ranking.includes("wildest"));
  assert.equal(queryEngine.getPolicy().titleInferenceAllowed, false);
});

test("hostile requests and dishonest dossier engines fail closed", () => {
  const { queryEngine, dossierEngine, window } = runtime();

  assert.throws(
    () => queryEngine.answer({
      schema: "foreign/v1",
      sourceId: "RACE00001A1",
      query: "Show receipts",
    }),
    errorCode("FOREIGN_SCHEMA"),
  );
  assert.throws(
    () => queryEngine.answer({
      ...request("RACE00001A1", "Show receipts"),
      title: "A title must never become scope",
    }),
    errorCode("UNEXPECTED_FIELD"),
  );
  assert.throws(
    () => queryEngine.answer(
      request("RACE00001A1", "Show receipts", { limit: 21 }),
    ),
    errorCode("INVALID_LIMIT"),
  );
  assert.throws(
    () => queryEngine.answer(
      request("RACE00001A1", "Show receipts", { at: 9000 }),
    ),
    errorCode("INVALID_AT"),
  );
  assert.throws(
    () => queryEngine.answer(
      request("UNKNOWN0000", "Show receipts"),
    ),
    errorCode("SOURCE_BUILD_FAILED"),
  );

  const mismatched = window.ShokkerSourceQuery.create({
    dossierEngine: {
      build() {
        return dossierEngine.build("RACE00002B2");
      },
    },
  });
  assert.throws(
    () => mismatched.answer(
      request("RACE00001A1", "Show receipts"),
    ),
    errorCode("SOURCE_SCOPE_MISMATCH"),
  );

  const unsafe = {};
  Object.defineProperty(unsafe, "schema", {
    enumerable: true,
    get() {
      throw new Error("must not run");
    },
  });
  unsafe.sourceId = "RACE00001A1";
  unsafe.query = "Show receipts";
  assert.throws(
    () => queryEngine.answer(unsafe),
    errorCode("UNSAFE_DESCRIPTOR"),
  );
});
