import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const demoRoot = new URL("../public/demo/", import.meta.url);
const sourceFiles = [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "curation.js",
  "search-engine.js",
];

const aliasCases = [
  ["Take me to Jason in space.", "LiTEaN8mpl8"],
  ["What do they say about the original Halloween?", "6VXSBDZ-3WE"],
  ["Pull up Scream 5.", "hQu1Y1GZozI"],
  ["RZ Halloween 2, please.", "AzrcgoyE7C4"],
  ["Take me to the Friday remake.", "bP5RMi24zBg"],
  ["Pull up the original Friday the 13th.", "WkYLphAdlYc"],
  ["Find the original Nightmare on Elm Street.", "7qgebnDYVi4"],
];

const franchiseSelectorCases = [
  {
    query: "Which Scream commentary is newest?",
    franchise: "Scream",
    selector: "latest",
  },
  {
    query: "Show me the most-viewed Halloween commentary.",
    franchise: "Halloween",
    selector: "views",
  },
  {
    query: "Which Friday the 13th commentary is newest?",
    franchise: "Friday the 13th",
    selector: "latest",
  },
  {
    query: "Find the newest Nightmare on Elm Street commentary.",
    franchise: "A Nightmare on Elm Street",
    selector: "latest",
  },
];

const livestreamCases = [
  "What is the newest livestream?",
  "Which livestream was the most popular?",
  "What is the most-viewed Halloween livestream?",
  "What Batman topics came up on the newest livestream?",
  "What did they discuss about Marvel in the latest stream?",
  "What is funniest in the newest livestream?",
];

const curatedBitCases = [
  {
    query: "Where is The Burp Defense?",
    label: "THE BURP DEFENSE",
    sourceId: "BIbyzMlstmM",
    at: 1528,
  },
  {
    query: "Find the Thor Dick Prophecy.",
    label: "THOR DICK PROPHECY",
    sourceId: "HNN0SEy2qtY",
    at: 2568,
  },
  {
    query: "Where is the Demon Jizz Weather Report?",
    label: "DEMON JIZZ WEATHER REPORT",
    sourceId: "LV2rmwEA0w4",
    at: 2270,
  },
];

const unknownCases = [
  "Did they ever cover Zzyzx Moon Quasar?",
  "Where did the Wolf Pack bit begin?",
];

const speakerCases = [
  "Who said they loved Scream 4?",
  "What did Mike say about Halloween?",
  "Show me J doing Dr. Loomis.",
];

const originCases = [
  {
    query: "When did the Dr. Loomis bit start?",
    entity: "Dr. Loomis",
    date: "2018-10-21",
  },
  {
    query: "Where did Dr. Challis first show up?",
    entity: "Dr. Challis",
    date: "2020-05-28",
  },
];

const opinionCases = [
  "What do they hate about the Elm Street remake?",
  "What do they love about Halloween?",
  "Did their opinion on Halloween change?",
  "How did their take on Halloween Ends evolve?",
  "What do they think about Halloween as a franchise?",
];

const followUpCases = [
  "What did they say about Halloween on the newest livestream?",
  "What about the most popular ones?",
];

const GOLDEN_QUERY_COUNT = [
  aliasCases,
  franchiseSelectorCases,
  livestreamCases,
  curatedBitCases,
  unknownCases,
  speakerCases,
  originCases,
  opinionCases,
  followUpCases,
].reduce((total, cases) => total + cases.length, 0);

const takeCategories = new Set([
  "LOVE LETTER",
  "FRANCHISE FELONY",
  "TAKE GETS NUCLEAR",
]);

const comedyCategories = new Set([
  "OUT OF POCKET",
  "UP IN YA",
  "FULL SEND",
  "THE ROOM BREAKS",
  "BREAKDOWN",
]);

let harnessPromise;

async function createHarness() {
  const sandbox = { window: {} };
  for (const file of sourceFiles) {
    runInNewContext(await readFile(new URL(file, demoRoot), "utf8"), sandbox, {
      filename: file,
    });
  }

  const { window } = sandbox;
  return {
    catalog: plain(window.WWAM_CATALOG),
    livestreams: plain(window.WWAM_LIVESTREAMS),
    popular: plain(window.WWAM_POPULAR_LIVE),
    engine: window.WWAMSearchEngine.create(
      window.WWAM_CATALOG,
      window.WWAM_DEEP_DISTILL,
      window.WWAM_LIVESTREAMS,
      window.WWAM_CURATED,
      window.WWAM_POPULAR_LIVE,
    ),
  };
}

function harness() {
  harnessPromise ||= createHarness();
  return harnessPromise;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function ask(engine, query, previous) {
  return plain(engine.ask(query, previous));
}

function uniqueStreams(livestreams, popular) {
  const byId = new Map();
  for (const stream of [...popular.streams, ...livestreams.streams]) {
    byId.set(stream.id, stream);
  }
  return [...byId.values()];
}

function maxBy(items, field) {
  return items.reduce((best, item) => {
    if (!best) return item;
    return item[field] > best[field] ? item : best;
  }, null);
}

function assertPlayableReceipts(answer, query) {
  assert.ok(answer.results.length > 0, `${query}: expected at least one receipt`);
  for (const result of answer.results) {
    assert.equal(result.speaker, null, `${query}: speaker must remain unknown`);
    assert.equal(result.speakerStatus, "not-diarized", `${query}: missing diarization boundary`);
    assert.equal(typeof result.sourceId, "string", `${query}: source ID missing`);
    assert.ok(Number.isFinite(result.at), `${query}: timestamp missing`);
    assert.ok(result.at >= 0, `${query}: timestamp must be non-negative`);
    assert.match(result.url, /^https:\/\/www\.youtube\.com\/watch\?v=/, `${query}: receipt URL`);
  }
}

test("golden battery contains a deliberate breadth of natural Ask WWAM queries", () => {
  assert.equal(GOLDEN_QUERY_COUNT, 34);
  assert.ok(GOLDEN_QUERY_COUNT >= 20);
});

test("fan shorthand resolves exact films without leaking into adjacent franchise entries", async () => {
  const { engine } = await harness();

  for (const [query, sourceId] of aliasCases) {
    const answer = ask(engine, query);
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.entityType, "film", query);
    assertPlayableReceipts(answer, query);
    assert.ok(
      answer.results.every((result) => result.sourceId === sourceId),
      `${query}: exact-film scope leaked`,
    );
  }
});

test("aboutness shorthand returns content evidence rather than an in-scope soundbyte", async () => {
  const { engine } = await harness();
  const query = "What do they say about the original Halloween?";
  const answer = ask(engine, query);

  assert.equal(answer.status, "supported");
  assert.equal(answer.entity, "Halloween (1978)");
  assert.ok(answer.results.length >= 2);
  assert.ok(answer.evidenceChain.length >= 2);
  assert.ok(answer.results.every((result) => result.sourceId === "6VXSBDZ-3WE"));
  assert.ok(answer.results.every((result) => result.curatedRank == null));
  assert.ok(answer.results.every((result) => (
    result.claimRelation === "explicit-caption-target" ||
    result.claimRelation === "screen-referent-in-exact-commentary"
  )));
  assert.ok(answer.evidenceChain.every((entry) => (
    entry.result.claimRelation !== "source-context-only"
  )));
  assert.ok(
    answer.evidenceChain.every((entry) => entry.result.key !== "moment-6VXSBDZ-3WE-3231"),
    "the unrelated curated Michael-motivation soundbyte must not answer aboutness",
  );
});

test("franchise commentary selectors stay scoped and honor archive date or view data", async () => {
  const { catalog, engine } = await harness();

  for (const scenario of franchiseSelectorCases) {
    const answer = ask(engine, scenario.query);
    const eligible = catalog.filter((item) => item.franchise === scenario.franchise);
    const expected = maxBy(
      eligible,
      scenario.selector === "views" ? "views" : "date",
    );

    assert.equal(answer.status, "supported", scenario.query);
    assert.equal(answer.entity, scenario.franchise, scenario.query);
    assert.equal(answer.entityType, "franchise", scenario.query);
    assert.equal(answer.source, "commentary", scenario.query);
    assert.equal(
      answer.metric,
      scenario.selector === "views" ? "views" : "date",
      scenario.query,
    );
    assert.equal(answer.results[0].sourceId, expected.id, scenario.query);
    assert.ok(
      answer.results.every((result) => (
        result.source === "commentary" && result.franchise === scenario.franchise
      )),
      `${scenario.query}: franchise or source scope leaked`,
    );
    assertPlayableReceipts(answer, scenario.query);
  }
});

test("newest, most-viewed, topic, and comedy livestream requests use the right stream lane", async () => {
  const { engine, livestreams, popular } = await harness();
  const streams = uniqueStreams(livestreams, popular);
  const newest = maxBy(streams, "date");
  const mostViewed = maxBy(streams, "views");
  const halloweenMostViewed = maxBy(
    streams.filter((stream) => (
      stream.topics || []
    ).some((topic) => topic.name === "Halloween")),
    "views",
  );

  const newestAnswer = ask(engine, livestreamCases[0]);
  assert.equal(newestAnswer.source, "livestream");
  assert.equal(newestAnswer.metric, "date");
  assert.equal(newestAnswer.results[0].sourceId, newest.id);

  const popularAnswer = ask(engine, livestreamCases[1]);
  assert.equal(popularAnswer.source, "livestream");
  assert.equal(popularAnswer.metric, "views");
  assert.equal(popularAnswer.results[0].sourceId, mostViewed.id);
  assert.equal(popularAnswer.results[0].views, mostViewed.views);

  const halloweenAnswer = ask(engine, livestreamCases[2]);
  assert.equal(halloweenAnswer.source, "livestream");
  assert.equal(halloweenAnswer.metric, "views");
  assert.equal(halloweenAnswer.entity, "Halloween");
  assert.equal(halloweenAnswer.results[0].sourceId, halloweenMostViewed.id);

  for (const query of livestreamCases.slice(3, 5)) {
    const answer = ask(engine, query);
    assert.equal(answer.source, "livestream", query);
    assert.equal(answer.metric, "date", query);
    assert.equal(answer.entityType, "topic", query);
    assert.equal(answer.results[0].sourceId, newest.id, query);
    assert.equal(answer.results[0].kind, "topic", query);
    assertPlayableReceipts(answer, query);
  }

  const comedyAnswer = ask(engine, livestreamCases[5]);
  assert.equal(comedyAnswer.intent, "comedy");
  assert.equal(comedyAnswer.source, "livestream");
  assert.equal(comedyAnswer.metric, "date");
  assert.equal(comedyAnswer.results[0].sourceId, newest.id);
  assert.ok(
    comedyAnswer.results.every((result) => (
      result.source === "livestream" && comedyCategories.has(result.category)
    )),
  );
  assertPlayableReceipts(comedyAnswer, livestreamCases[5]);
});

test("named recurring soundbytes resolve to their single human-curated timestamp", async () => {
  const { engine } = await harness();

  for (const scenario of curatedBitCases) {
    const answer = ask(engine, scenario.query);
    assert.equal(answer.status, "supported", scenario.query);
    assert.equal(answer.entityType, "bit", scenario.query);
    assert.equal(answer.results.length, 1, scenario.query);
    assert.equal(answer.results[0].sourceId, scenario.sourceId, scenario.query);
    assert.equal(answer.results[0].at, scenario.at, scenario.query);
    assert.equal(answer.results[0].curatedLabel, scenario.label, scenario.query);
    assert.match(answer.results[0].reasons.join(" "), /exact curated bit/i, scenario.query);
    assertPlayableReceipts(answer, scenario.query);
  }
});

test("unknown subjects fail closed without collateral archive results", async () => {
  const { engine } = await harness();

  for (const query of unknownCases) {
    const answer = ask(engine, query);
    assert.equal(answer.status, "insufficient-evidence", query);
    assert.equal(answer.confidence, 0, query);
    assert.deepEqual(answer.results, [], query);
    assert.deepEqual(answer.evidenceChain, [], query);
    assert.match(answer.answer, /doesn't prove.*never discussed/i, query);
    assert.ok(answer.suggestions.length > 0, query);
  }
});

test("speaker and owner-shaped questions preserve receipts but refuse invented attribution", async () => {
  const { engine } = await harness();

  for (const query of speakerCases) {
    const answer = ask(engine, query);
    assert.equal(answer.questionType, "speaker", query);
    assert.equal(answer.status, "speaker-unknown", query);
    assert.equal(answer.recommendedSurface.href, "#canon", query);
    assert.match(answer.answer, /won't guess|don't reliably say who is speaking/i, query);
    assert.doesNotMatch(
      answer.answer,
      /\b(?:Mike|J) (?:did|does|performed|portrayed|said)\b/i,
      query,
    );
    for (const result of answer.results) {
      assert.equal(result.speaker, null, query);
      assert.equal(result.speakerStatus, "not-diarized", query);
      assert.equal("owner" in result, false, query);
      assert.equal("host" in result, false, query);
    }
  }
});

test("character-origin questions expose an archive-first receipt without claiming true origin", async () => {
  const { engine } = await harness();

  for (const scenario of originCases) {
    const answer = ask(engine, scenario.query);
    assert.equal(answer.entity, scenario.entity, scenario.query);
    assert.equal(answer.entityType, "character", scenario.query);
    assert.equal(answer.temporal, "earliest", scenario.query);
    assert.equal(answer.results[0].date, scenario.date, scenario.query);
    assert.equal(
      answer.results[0].label,
      "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL",
      scenario.query,
    );
    assert.equal(answer.results[0].archiveBoundary.trueOriginClaim, false, scenario.query);
    assert.match(answer.evidenceChain[0].role, /EARLIEST MACHINE-INDEXED/i, scenario.query);
    assert.match(answer.answer, /not proof.*started there/i, scenario.query);
    assert.equal(answer.recommendedSurface.href, "#lore", scenario.query);
    assertPlayableReceipts(answer, scenario.query);
  }
});

test("explicit sentiment and trajectory questions return take evidence, not comedy collateral", async () => {
  const { engine } = await harness();

  const negative = ask(engine, opinionCases[0]);
  assert.equal(negative.intent, "negative");
  assert.ok(negative.results.every((result) => result.category === "FRANCHISE FELONY"));
  assert.ok(negative.results.every((result) => result.curatedRank === null));
  assert.ok(negative.results.every((result) => /negative evidence/i.test(result.reasons.join(" "))));

  const positive = ask(engine, opinionCases[1]);
  assert.equal(positive.intent, "positive");
  assert.ok(positive.results.every((result) => result.category === "LOVE LETTER"));
  assert.ok(positive.results.every((result) => result.curatedRank === null));
  assert.ok(positive.results.every((result) => /positive evidence/i.test(result.reasons.join(" "))));

  for (const query of opinionCases.slice(2, 4)) {
    const answer = ask(engine, query);
    assert.equal(answer.intent, "trajectory", query);
    assert.equal(answer.status, "archive-boundary", query);
    assert.equal(answer.recommendedSurface.href, "#canon", query);
    assert.match(answer.answer, /not proof|not enough tape/i, query);
    assert.ok(answer.results.length > 0, query);
    for (const result of answer.results) {
      assert.equal(result.kind, "moment", query);
      assert.ok(takeCategories.has(result.category), `${query}: ${result.category}`);
      assert.equal(result.curatedRank, null, query);
      assert.match(result.reasons.join(" "), /evaluative take evidence/i, query);
      assert.ok(result.trajectoryEvidence.evaluativeTerms.length > 0, query);
      assert.ok(result.trajectoryEvidence.targetTerms.length > 0, query);
    }
  }
});

test("semantic opinion wording cannot be answered by a profanity-only or comedy receipt", async () => {
  const { engine } = await harness();
  const query = opinionCases[4];
  const answer = ask(engine, query);

  assert.ok(
    ["positive", "negative", "trajectory", "opinion"].includes(answer.intent),
    `${query}: generic opinion language was treated as ${answer.intent}`,
  );
  assert.ok(answer.results.length > 0, query);
  for (const result of answer.results) {
    assert.equal(result.kind, "moment", query);
    assert.ok(takeCategories.has(result.category), `${query}: comedy collateral ${result.category}`);
    assert.equal(result.curatedRank, null, `${query}: curated profanity outranked opinion evidence`);
    assert.match(
      result.reasons.join(" "),
      /positive evidence|negative evidence|evaluative take evidence/i,
      `${query}: no explicit opinion-evidence basis`,
    );
  }
});

test("follow-up memory retains subject and source while allowing a new selector", async () => {
  const { engine, livestreams, popular } = await harness();
  const streams = uniqueStreams(livestreams, popular);
  const halloweenMostViewed = maxBy(
    streams.filter((stream) => (
      stream.topics || []
    ).some((topic) => topic.name === "Halloween")),
    "views",
  );

  const latest = ask(engine, followUpCases[0]);
  const followUp = ask(engine, followUpCases[1], latest);

  assert.equal(latest.entity, "Halloween");
  assert.equal(latest.source, "livestream");
  assert.equal(followUp.continuedFrom, true);
  assert.deepEqual(followUp.contextUsed, ["entity", "source"]);
  assert.equal(followUp.entity, "Halloween");
  assert.equal(followUp.source, "livestream");
  assert.equal(followUp.metric, "views");
  assert.equal(followUp.results[0].sourceId, halloweenMostViewed.id);
  assert.match(followUp.results[0].reasons.join(" "), /popularity|view/i);
  assertPlayableReceipts(followUp, followUpCases[1]);
});
