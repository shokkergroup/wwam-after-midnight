import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.resolve(here, "../public/demo/receipt-matrix-query.js"),
  "utf8",
);

function runtime() {
  const window = {};
  const context = { window, globalThis: window };
  window.window = window;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "receipt-matrix-query.js" });
  return window.ShokkerReceiptMatrixQuery;
}

const entities = [
  {
    id: "character:loomis",
    label: "Dr. Loomis",
    type: "recurring-character",
    aliases: ["Loomis", "Doctor Loomis", "Lumas"],
  },
  {
    id: "character:challis",
    label: "Dr. Challis",
    type: "recurring-character",
    aliases: ["Challis", "Doctor Challis", "Chalice"],
  },
  {
    id: "character:slenderman",
    label: "Slenderman",
    type: "recurring-character",
    aliases: ["Slender Man", "Slendy"],
  },
  {
    id: "character:corey-feldman",
    label: "Corey Feldman",
    type: "recurring-character",
    aliases: ["Cory Feldman", "Corey Felman"],
  },
];

function create(overrides = {}) {
  return runtime().create({
    entities: overrides.entities || entities,
    groups: overrides.groups || [
      {
        id: "group:grounded-characters",
        label: "Grounded recurring characters",
        aliases: ["character", "characters", "recurring characters"],
        entityIds: entities.map((entity) => entity.id),
      },
    ],
    vocabulary: overrides.vocabulary,
  });
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("routes exact source counts without confusing receipts and sources", () => {
  const route = plain(
    create().route("How many uploads contain Dr. Loomis performances?"),
  );
  assert.equal(route.status, "supported");
  assert.equal(route.mode, "entity-source-count");
  assert.equal(route.answerShape, "source-count");
  assert.deepEqual(route.matrix, {
    schema: "shokker-receipt-matrix-request/v1",
    entityIds: ["character:loomis"],
    quantifier: "any",
    order: "source-date-asc",
  });
});

test("routes multi-entity intersections with all-entity source semantics", () => {
  const route = plain(
    create().route(
      "Which uploads contain both Dr. Loomis and Dr. Challis performances?",
    ),
  );
  assert.equal(route.mode, "source-entity-intersection");
  assert.equal(route.answerShape, "source-list");
  assert.deepEqual(route.matrix.entityIds, [
    "character:challis",
    "character:loomis",
  ]);
  assert.equal(route.matrix.quantifier, "all");
  assert.equal(route.matrix.order, "receipt-count-desc");
});

test("source-count intersections retain a count answer shape", () => {
  const route = plain(
    create().route(
      "How many streams contain both Challis and Loomis performances?",
    ),
  );
  assert.equal(route.mode, "source-entity-intersection");
  assert.equal(route.answerShape, "source-count");
  assert.equal(route.matrix.quantifier, "all");
});

test("routes group rankings over the configured entity directory", () => {
  const route = plain(
    create().route("Which source has the most character performances?"),
  );
  assert.equal(route.mode, "group-source-ranking");
  assert.equal(route.answerShape, "source-ranking");
  assert.equal(route.groupId, "group:grounded-characters");
  assert.deepEqual(route.matrix.entityIds, [
    "character:challis",
    "character:corey-feldman",
    "character:loomis",
    "character:slenderman",
  ]);
  assert.equal(route.matrix.quantifier, "any");
  assert.equal(route.matrix.order, "receipt-count-desc");
});

test("routes complete performance chronology without an origin claim", () => {
  const route = plain(
    create().route("Show every Dr. Loomis performance in chronological order"),
  );
  assert.equal(route.mode, "entity-performance-chronology");
  assert.equal(route.answerShape, "performance-list");
  assert.equal(route.matrix.order, "source-date-asc");
  assert.match(route.chronologyWarning, /current index/i);
  assert.match(route.chronologyWarning, /does not prove true origin/i);
});

test("routes bloodline, timeline, supercut, and change-over-time language", () => {
  const cases = [
    ["Play the Slenderman bloodline", "character:slenderman"],
    ["Give me the full Dr. Challis timeline", "character:challis"],
    ["Make me a Dr. Loomis supercut", "character:loomis"],
    ["How did the Slenderman bit change over time?", "character:slenderman"],
  ];
  const engine = create();
  for (const [query, id] of cases) {
    const route = plain(engine.route(query));
    assert.equal(route.mode, "entity-lineage", query);
    assert.equal(route.answerShape, "lineage", query);
    assert.deepEqual(route.matrix.entityIds, [id], query);
    assert.match(route.chronologyWarning, /does not prove.*change/i, query);
  }
});

test("ordinary Ask retrieval remains outside the narrow matrix router", () => {
  const engine = create();
  for (const query of [
    "How many Dr. Loomis clips are there?",
    "Tell me about the Corey Feldman bit",
    "Who performs Slenderman?",
    "Where did Dr. Challis show up?",
    "Which predictions came true?",
    "What is funniest in the newest stream?",
    "Show every funny moment in the newest livestream",
    "Show me the top 10 funniest moments last night",
  ]) {
    assert.equal(engine.route(query), null, query);
  }
});

test("unknown explicit subjects fail closed instead of falling into relevance", () => {
  const route = plain(
    create().route("How many uploads contain Zzyzx Moon Quasar performances?"),
  );
  assert.equal(route.matched, true);
  assert.equal(route.status, "unknown-entity");
  assert.equal(route.matrix, null);
  assert.deepEqual(route.unknownTerms, ["zzyzx", "moon", "quasar"]);
});

test("a known plus unknown intersection never silently drops the unknown side", () => {
  const route = plain(
    create().route(
      "Which streams contain both Dr. Loomis and Zzyzx performances?",
    ),
  );
  assert.equal(route.status, "unknown-entity");
  assert.deepEqual(route.entityIds, ["character:loomis"]);
  assert.ok(route.unknownTerms.includes("zzyzx"));
});

test("ambiguous configured aliases produce a held route", () => {
  const engine = create({
    entities: entities.concat([
      {
        id: "character:other-doctor",
        label: "Other Doctor",
        aliases: ["Doctor"],
      },
      {
        id: "character:second-doctor",
        label: "Second Doctor",
        aliases: ["Doctor"],
      },
    ]),
    groups: [],
  });
  const route = plain(
    engine.route("How many sources contain Doctor performances?"),
  );
  assert.equal(route.status, "ambiguous-entity");
  assert.equal(route.matrix, null);
});

test("follow-up context is accepted only as exact known entity IDs", () => {
  const engine = create();
  const exact = plain(
    engine.route(
      "Which uploads contain both of those performances?",
      { entityIds: ["character:loomis", "character:challis"] },
    ),
  );
  assert.equal(exact.status, "supported");
  assert.equal(exact.matrix.quantifier, "all");
  assert.deepEqual(exact.matrix.entityIds, [
    "character:challis",
    "character:loomis",
  ]);

  const vague = plain(
    engine.route(
      "Which uploads contain both of those performances?",
      { entity: "Dr. Loomis", label: "Dr. Challis" },
    ),
  );
  assert.equal(vague.status, "unknown-entity");
});

test("entity order and aliases cannot change the canonical matrix request", () => {
  const engine = create();
  const left = plain(
    engine.route(
      "Which uploads contain both Doctor Loomis and Chalice performances?",
    ),
  );
  const right = plain(
    engine.route(
      "Which uploads contain both Dr. Challis and Dr. Loomis performances?",
    ),
  );
  assert.deepEqual(left.matrix, right.matrix);
});

test("the same router supports a neutral racing vocabulary", () => {
  const engine = runtime().create({
    entities: [
      {
        id: "driver:33",
        label: "Car 33",
        type: "driver",
        aliases: ["33", "the 33"],
      },
      {
        id: "driver:12",
        label: "Car 12",
        type: "driver",
        aliases: ["12", "the 12"],
      },
    ],
    groups: [
      {
        id: "group:drivers",
        label: "Drivers",
        aliases: ["driver", "drivers"],
        entityIds: ["driver:33", "driver:12"],
      },
    ],
    vocabulary: {
      sourceTerms: ["race", "races", "event", "events"],
      performanceTerms: ["lead change", "lead changes", "moment", "moments"],
      lineagePhrases: ["season timeline", "through the season", "supercut"],
      sourceVerbs: ["contain", "contains", "feature", "features", "have", "has"],
    },
  });
  const intersection = plain(
    engine.route("Which races contain both Car 33 and Car 12 lead changes?"),
  );
  assert.equal(intersection.mode, "source-entity-intersection");
  assert.deepEqual(intersection.matrix.entityIds, ["driver:12", "driver:33"]);
  assert.equal(intersection.matrix.quantifier, "all");
  assert.doesNotMatch(JSON.stringify(intersection), /wwam|horror|loomis|character/i);

  const ranking = plain(
    engine.route("Which race has the most driver moments?"),
  );
  assert.equal(ranking.mode, "group-source-ranking");
  assert.deepEqual(ranking.matrix.entityIds, ["driver:12", "driver:33"]);
});

test("routes, nested requests, and exposed directories are immutable", () => {
  const engine = create();
  const route = engine.route(
    "Which uploads contain both Dr. Loomis and Dr. Challis performances?",
  );
  assert.equal(Object.isFrozen(engine), true);
  assert.equal(Object.isFrozen(route), true);
  assert.equal(Object.isFrozen(route.matrix), true);
  assert.equal(Object.isFrozen(route.matrix.entityIds), true);
  assert.throws(() => route.matrix.entityIds.push("character:slenderman"));
});

test("invalid directories fail before a plausible router is exposed", () => {
  const Query = runtime();
  assert.throws(
    () => Query.create({ entities: [] }),
    /entities must contain/i,
  );
  assert.throws(
    () => Query.create({
      entities,
      groups: [{
        id: "bad",
        label: "Bad",
        aliases: ["bad"],
        entityIds: ["driver:missing"],
      }],
    }),
    /unknown entity/i,
  );
});
