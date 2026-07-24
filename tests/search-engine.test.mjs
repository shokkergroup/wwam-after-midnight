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

async function createEngine() {
  const sandbox = { window: {} };
  for (const file of sourceFiles) {
    runInNewContext(await readFile(new URL(file, demoRoot), "utf8"), sandbox, {
      filename: file,
    });
  }
  const { window } = sandbox;
  return window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
  );
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("direct selectors respect explicit source, date, view, and archive metrics", async () => {
  const engine = await createEngine();

  const mostViewedCommentary = plain(engine.ask("What is the most viewed commentary?"));
  assert.equal(mostViewedCommentary.source, "commentary");
  assert.equal(mostViewedCommentary.metric, "views");
  assert.equal(mostViewedCommentary.results[0].sourceId, "6VXSBDZ-3WE");
  assert.equal(mostViewedCommentary.results[0].views, 60_727);
  assert.match(mostViewedCommentary.answer, /captured official view snapshot/i);

  const latestCommentary = plain(engine.ask("What is the latest commentary?"));
  assert.equal(latestCommentary.results[0].sourceId, "ISDlaQ9DWSM");
  assert.equal(latestCommentary.results[0].kind, "tape");
  assert.equal(latestCommentary.results[0].date, "2023-04-25");
  assert.match(latestCommentary.answer, /Most recent indexed commentary/);

  const newestScream = plain(engine.ask("Which Scream commentary is newest?"));
  assert.equal(newestScream.entity, "Scream");
  assert.equal(newestScream.entityType, "franchise");
  assert.equal(newestScream.results[0].sourceId, "ISDlaQ9DWSM");

  const unhinged = plain(engine.ask("Which commentary has the highest Unhinged Index?"));
  assert.equal(unhinged.metric, "unhinged");
  assert.equal(unhinged.results[0].kind, "tape");
  assert.equal(unhinged.results[0].unhinged, 98);
  assert.match(unhinged.answer, /tie for the highest indexed Unhinged Index/i);

  const liveHeat = plain(engine.ask("What is the most unhinged livestream?"));
  assert.equal(liveHeat.source, "livestream");
  assert.equal(liveHeat.metric, "live-heat");
  assert.equal(liveHeat.results[0].kind, "livestream");
  assert.ok(liveHeat.results[0].liveHeat >= 90);
  assert.match(liveHeat.answer, /average of its three hottest indexed moments/i);
});

test("exact film, franchise, topic, character, and curated-bit entities stay in scope", async () => {
  const engine = await createEngine();

  const remake = plain(engine.ask("What do they hate about the Elm Street remake?"));
  assert.equal(remake.entityType, "film");
  assert.equal(remake.results[0].sourceId, "qTQdWKcwn4A");
  assert.equal(remake.results[0].category, "FRANCHISE FELONY");
  assert.match(remake.answer, /not being promoted into a settled host opinion/i);

  const screamFour = plain(engine.ask("What did they say about Scream 4?"));
  assert.equal(screamFour.entity, "Scream 4");
  assert.ok(screamFour.results.length > 0);
  assert.ok(screamFour.results.every((result) => result.sourceId === "5et_A1tYnio"));

  const fanShorthand = [
    ["What happened in Friday 5?", "XfwzQJ9CJGs"],
    ["Show me Nightmare 3", "c15otfZ8HkU"],
    ["What do they say in Halloween 7?", "Q6SN-Om1gIo"],
  ];
  for (const [query, sourceId] of fanShorthand) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.entityType, "film", query);
    assert.equal(answer.results[0].sourceId, sourceId, query);
  }

  const loomis = plain(engine.ask("Where did Dr. Loomis show up?"));
  assert.equal(loomis.entityType, "character");
  assert.equal(loomis.results[0].kind, "character");
  assert.equal(loomis.results[0].speaker, null);
  assert.equal(loomis.results[0].speakerStatus, "not-diarized");
  assert.match(loomis.results[0].evidenceWarnings.join(" "), /does not establish who performed/i);

  const bit = plain(engine.ask("Where is The Burp Defense?"));
  assert.equal(bit.entityType, "bit");
  assert.equal(bit.results.length, 1);
  assert.equal(bit.results[0].sourceId, "BIbyzMlstmM");
  assert.equal(bit.results[0].at, 1528);
  assert.match(bit.results[0].reasons.join(" "), /exact curated bit/);

  const halloweenTakes = plain(engine.ask("Show me the best Halloween takes"));
  assert.equal(halloweenTakes.entityType, "franchise");
  assert.equal(halloweenTakes.intent, "positive");
  assert.equal(halloweenTakes.results[0].category, "LOVE LETTER");
});

test("unknown subjects and unverified performances fail closed instead of returning collateral", async () => {
  const engine = await createEngine();

  const unknown = plain(engine.ask("Did they hate Zzyzx Moon Quasar?"));
  assert.equal(unknown.status, "insufficient-evidence");
  assert.equal(unknown.confidence, 0);
  assert.deepEqual(unknown.results, []);
  assert.deepEqual(unknown.evidenceChain, []);
  assert.match(unknown.answer, /archive gap, not proof/i);
  assert.ok(unknown.suggestions.length >= 4);

  const wolfPack = plain(engine.ask("Where did Wolf Pack bit begin?"));
  assert.equal(wolfPack.results.length, 0);
  assert.equal(wolfPack.recommendedSurface.href, "#lore");
  assert.doesNotMatch(wolfPack.answer, /A New Beginning/i);

  const performance = plain(engine.ask("earliest Dr. Challis performance?"));
  assert.equal(performance.results.length, 0);
  assert.equal(performance.confidence, 0);
  assert.equal(performance.recommendedSurface.href, "#lore");
  assert.match(performance.answer, /no verified performance receipt/i);
  assert.match(performance.answer, /not being promoted into impressions/i);
});

test("origin and change questions use bounded timeline language", async () => {
  const engine = await createEngine();

  const origin = plain(engine.ask("When did the Dr. Loomis bit start?"));
  assert.equal(origin.temporal, "earliest");
  assert.equal(origin.entity, "Dr. Loomis");
  assert.equal(origin.results[0].date, "2018-10-21");
  assert.deepEqual(
    origin.evidenceChain.slice(0, 2).map((entry) => entry.role),
    [
      "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL",
      "LATER MACHINE-INDEXED CHARACTER SIGNAL",
    ],
  );
  assert.equal(origin.results[0].label, "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL");
  assert.equal(origin.results[0].archiveBoundary.trueOriginClaim, false);
  assert.match(origin.answer, /earliest machine-indexed Dr\. Loomis character signal/i);
  assert.match(
    origin.answer,
    /not the same as Lore's curated verified-performance archive-first receipt for the current verified set/i,
  );
  assert.match(origin.answer, /not a claim.*originated/i);
  assert.equal(origin.recommendedSurface.href, "#lore");

  const changed = plain(engine.ask("Did they change their mind about Halloween Ends?"));
  assert.equal(changed.intent, "trajectory");
  assert.equal(changed.recommendedSurface.href, "#canon");
  assert.match(changed.answer, /not enough evidence to claim they changed their mind/i);
  assert.ok(changed.limitations.some((warning) => /speaker identity/i.test(warning)));
});

test("opinion-change wording stays a Canon-routed trajectory with an archive boundary", async () => {
  const engine = await createEngine();
  const variants = [
    "Did their opinion on Halloween change?",
    "How did their opinion on Halloween change?",
    "Has their take on Halloween changed?",
    "Did their Halloween opinion change?",
    "Their opinion changed on Halloween?",
  ];

  for (const query of variants) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.intent, "trajectory", query);
    assert.equal(answer.entity, "Halloween", query);
    assert.equal(answer.entityType, "franchise", query);
    assert.ok(answer.results.length > 0, query);
    assert.equal(answer.status, "archive-boundary", query);
    assert.equal(
      answer.confidenceBasis[0],
      "receipt retrieval confidence; change claim not established",
      query,
    );
    assert.equal(answer.recommendedSurface.href, "#canon", query);
    assert.match(answer.answer, /^Archive boundary:/i, query);
    assert.match(answer.answer, /franchise-wide receipts may concern different films/i, query);
    assert.match(answer.answer, /cannot prove a host changed their mind/i, query);
    assert.deepEqual(
      answer.evidenceChain.map((entry) => entry.role),
      ["EARLIEST INDEXED RECEIPT", "LATEST INDEXED RECEIPT"],
      query,
    );
    assert.equal(answer.evidenceChain[0].result.sourceId, "6VXSBDZ-3WE", query);
    assert.ok(answer.evidenceChain[0].result.trajectoryEvidence.targetTerms.includes("scene"), query);
    assert.deepEqual(
      answer.results.slice(0, 2).map((result) => result.key),
      answer.evidenceChain.map((entry) => entry.result.key),
      query,
    );
    for (const result of answer.results) {
      assert.equal(result.kind, "moment", query);
      assert.equal(result.evidenceType, "caption-excerpt", query);
      assert.ok(
        ["LOVE LETTER", "FRANCHISE FELONY", "TAKE GETS NUCLEAR"].includes(result.category),
        `${query}: ${result.category}`,
      );
      assert.notEqual(result.category, "OUT OF POCKET", query);
      assert.equal(result.curatedRank, null, query);
      assert.equal(result.curatedLabel, null, query);
      assert.match(result.reasons.join(" "), /evaluative take evidence/i, query);
      assert.ok(result.trajectoryEvidence.evaluativeTerms.length > 0, query);
      assert.ok(result.trajectoryEvidence.targetTerms.length > 0, query);
      assert.equal(result.trajectoryEvidence.targetTerms.includes("kill"), false, query);
      assert.equal(result.trajectoryEvidence.targetTerms.includes("michael"), false, query);
      assert.doesNotMatch(result.excerpt, /American Pie 3/i, query);
    }
    for (const entry of answer.evidenceChain) {
      assert.equal(entry.result.kind, "moment", query);
      assert.equal(entry.result.curatedRank, null, query);
      assert.notEqual(entry.result.category, "OUT OF POCKET", query);
    }
  }
});

test("speaker questions preserve receipts but never invent Mike, J, or another host", async () => {
  const engine = await createEngine();

  const who = plain(engine.ask("Who loves Scream 4?"));
  assert.equal(who.status, "speaker-unknown");
  assert.ok(who.results.length > 0);
  assert.ok(who.results.every((result) => result.speaker === null));
  assert.match(who.answer, /won't invent a name/i);
  assert.equal(who.recommendedSurface.href, "#canon");

  const mike = plain(engine.ask("What did Mike say about Scream?"));
  assert.equal(mike.questionType, "speaker");
  assert.equal(mike.status, "speaker-unknown");
  assert.ok(mike.results.length > 0);
  assert.match(mike.answer, /not a speaker attribution/i);

  const jPerformance = plain(engine.ask("Show me J doing Dr. Loomis"));
  assert.equal(jPerformance.questionType, "speaker");
  assert.equal(jPerformance.status, "speaker-unknown");
  assert.equal(jPerformance.results.length, 0);
  assert.match(jPerformance.answer, /not speaker-diarized/i);
});

test("follow-ups retain the subject and source while allowing a new selector", async () => {
  const engine = await createEngine();

  const latest = plain(
    engine.ask("What did they say about Halloween on the latest livestream?"),
  );
  assert.equal(latest.results[0].sourceId, "LV2rmwEA0w4");
  assert.equal(latest.results[0].kind, "topic");
  assert.match(latest.results[0].reasons.join(" "), /newest stream/);

  const popular = plain(engine.ask("What about the most popular ones?", latest));
  assert.equal(popular.continuedFrom, true);
  assert.deepEqual(popular.contextUsed, ["entity", "source"]);
  assert.equal(popular.entity, "Halloween");
  assert.equal(popular.source, "livestream");
  assert.equal(popular.metric, "views");
  assert.equal(popular.results[0].sourceId, "jG93HvyP420");
  assert.equal(popular.results[0].views, 203_603);
  assert.match(popular.results[0].reasons.join(" "), /foundational popularity/);
});

test("rank explanations expose evidence components without claiming a speaker", async () => {
  const engine = await createEngine();
  const result = plain(engine.ask("What is funniest in the newest stream?"));
  const comedyCategories = [
    "OUT OF POCKET",
    "UP IN YA",
    "FULL SEND",
    "THE ROOM BREAKS",
    "BREAKDOWN",
  ];

  assert.equal(result.results[0].sourceId, "LV2rmwEA0w4");
  assert.equal(result.results[0].kind, "moment");
  assert.match(result.results[0].reasons.join(" "), /newest stream/);
  assert.match(result.results[0].reasons.join(" "), /comedy evidence/);
  assert.ok(result.results[0].explanation.totalScore > 0);
  assert.ok(result.results[0].explanation.components.length >= 3);
  assert.equal(result.results[0].speaker, null);
  assert.equal(result.results[0].evidenceLevel, "TIMESTAMPED CAPTION RECEIPT");
  assert.ok(result.results.every((receipt) => receipt.source === "livestream"));
  assert.ok(result.results.every((receipt) => receipt.kind === "moment"));
  assert.ok(result.results.every((receipt) => comedyCategories.includes(receipt.category)));
  assert.ok(result.results.every((receipt) => receipt.category !== "TAKE GETS NUCLEAR"));
  assert.ok(result.results.every((receipt) => receipt.category !== "LIVE MAP"));
  assert.ok(result.results.every((receipt) => receipt.category !== "TOPIC CHAPTER"));
  assert.ok(engine.examples.includes("Where is The Burp Defense?"));
  assert.equal(engine.evidencePolicy.origins.includes("never a true origin"), true);
});

test("neutral franchise-opinion questions use explicit take evidence, not comedy collateral", async () => {
  const engine = await createEngine();
  const query = "What do they think about Halloween as a franchise?";
  const answer = plain(engine.ask(query));
  const takeCategories = ["LOVE LETTER", "FRANCHISE FELONY", "TAKE GETS NUCLEAR"];

  assert.equal(answer.intent, "opinion");
  assert.equal(answer.status, "archive-boundary");
  assert.equal(answer.entity, "Halloween");
  assert.equal(answer.entityType, "franchise");
  assert.equal(answer.recommendedSurface.href, "#canon");
  assert.equal(
    answer.confidenceBasis[0],
    "receipt retrieval confidence; settled opinion not established",
  );
  assert.match(answer.answer, /^Archive boundary:/i);
  assert.match(answer.answer, /both positive- and critical-language receipts/i);
  assert.match(answer.answer, /does not establish one settled host opinion/i);
  assert.ok(answer.results.length > 0);
  assert.deepEqual(
    answer.evidenceChain.map((entry) => entry.role),
    ["POSITIVE-LANGUAGE RECEIPT", "CRITICAL-LANGUAGE RECEIPT"],
  );
  assert.deepEqual(
    answer.results.slice(0, 2).map((result) => result.category),
    ["LOVE LETTER", "FRANCHISE FELONY"],
  );
  for (const result of answer.results) {
    assert.equal(result.kind, "moment");
    assert.ok(takeCategories.includes(result.category), result.category);
    assert.equal(result.curatedRank, null);
    assert.equal(result.curatedLabel, null);
    assert.match(result.reasons.join(" "), /evaluative take evidence/i);
    assert.ok(result.takeEvidence.evaluativeTerms.length > 0);
    assert.ok(result.takeEvidence.targetTerms.length > 0);
  }
});
