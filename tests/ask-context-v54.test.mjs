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
  "character-lore.js",
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
    window.WWAM_CHARACTER_LORE,
  );
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const comedyCategories = new Set([
  "OUT OF POCKET",
  "UP IN YA",
  "FULL SEND",
  "THE ROOM BREAKS",
  "BREAKDOWN",
]);

test("compound view-plus-comedy questions select the source before ranking moments", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask("What is funniest in the most viewed livestream?"));

  assert.equal(answer.intent, "comedy");
  assert.equal(answer.source, "livestream");
  assert.equal(answer.metric, "heat");
  assert.equal(answer.selectionPlan.source.metric, "views");
  assert.equal(answer.selectionPlan.source.direction, "descending");
  assert.equal(answer.selectionPlan.source.sourceId, "jG93HvyP420");
  assert.equal(answer.selectionPlan.source.views, 203_603);
  assert.equal(answer.selectionPlan.withinSource.intent, "comedy");
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => result.sourceId === "jG93HvyP420"));
  assert.ok(answer.results.every((result) => result.kind === "moment"));
  assert.ok(answer.results.every((result) => comedyCategories.has(result.category)));
  assert.match(answer.answer, /most-viewed livestream here at 203,603 views/i);
  assert.match(answer.answer, /203,603 views/i);
});

test("speaker and content follow-ups remain anchored to the winning source", async () => {
  const engine = await createEngine();
  const newestScream = plain(engine.ask("What is the newest Scream commentary?"));

  assert.equal(newestScream.results[0].sourceId, "ISDlaQ9DWSM");
  assert.equal(newestScream.context.resultAnchor.sourceId, "ISDlaQ9DWSM");

  const speaker = plain(engine.ask("Who said that?", newestScream.context));
  assert.equal(speaker.continuedFrom, true);
  assert.ok(speaker.contextUsed.includes("result"));
  assert.equal(speaker.status, "speaker-unknown");
  assert.equal(speaker.results[0].sourceId, "ISDlaQ9DWSM");
  assert.equal(speaker.results[0].kind, newestScream.results[0].kind);
  assert.equal(speaker.results[0].at, newestScream.results[0].at);
  assert.match(speaker.answer, /captions don't reliably say who is speaking.*won't guess/i);

  const content = plain(engine.ask("What did they say about it?", newestScream.context));
  assert.equal(content.continuedFrom, true);
  assert.ok(content.contextUsed.includes("result"));
  assert.ok(content.results.length > 0);
  assert.ok(content.results.every((result) => result.sourceId === "ISDlaQ9DWSM"));
  assert.ok(content.results.every((result) => result.kind === "moment"));
});

test("that-one and next follow-ups stay inside the prior source", async () => {
  const engine = await createEngine();
  const mostViewedHalloween = plain(
    engine.ask("What is the most viewed Halloween livestream?"),
  );
  const funniest = plain(
    engine.ask("What is funniest in that one?", mostViewedHalloween.context),
  );

  assert.equal(mostViewedHalloween.results[0].sourceId, "jG93HvyP420");
  assert.equal(funniest.selectionPlan.mode, "source");
  assert.ok(funniest.results.length > 0);
  assert.ok(funniest.results.every((result) => result.sourceId === "jG93HvyP420"));
  assert.ok(funniest.results.every((result) => result.kind === "moment"));
  assert.ok(funniest.results.every((result) => comedyCategories.has(result.category)));

  const burp = plain(engine.ask("Where is The Burp Defense?"));
  const next = plain(engine.ask("What happened next?", burp));
  assert.equal(next.selectionPlan.mode, "next");
  assert.equal(next.results[0].sourceId, burp.results[0].sourceId);
  assert.ok(next.results[0].at > burp.results[0].at);
  assert.match(next.answer, /next saved moment in the same show/i);
  assert.match(next.limitations.join(" "), /next indexed highlight/i);
});

test("first-do character grammar returns the earliest curated current-set receipt", async () => {
  const engine = await createEngine();
  const cases = [
    ["When did J first do Dr. Loomis?", "loomis-dj", "2022-08-20"],
    ["When did Mike first perform Dr. Challis?", "challis-boilermaker", "2022-07-20"],
  ];

  for (const [query, receiptId, date] of cases) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.temporal, "earliest", query);
    assert.equal(answer.results[0].kind, "character-performance", query);
    assert.equal(answer.results[0].performanceReceiptId, receiptId, query);
    assert.equal(answer.results[0].date, date, query);
    assert.equal(
      answer.results[0].label,
      "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET",
      query,
    );
    assert.match(answer.limitations.join(" "), /not a claim of true origin/i, query);
    assert.ok(answer.results.every((result) => result.speaker === null), query);
  }
});

test("opinion phrasing requires target-proximate evaluative receipts", async () => {
  const engine = await createEngine();
  const halloween = plain(engine.ask("What do they think of Halloween Ends?"));

  assert.equal(halloween.intent, "opinion");
  assert.equal(halloween.status, "archive-boundary");
  assert.equal(halloween.entityType, "film");
  assert.equal(halloween.results[0].sourceId, "I6QKteG_hK0");
  assert.ok(halloween.results.length > 0);
  assert.ok(halloween.results.every((result) => result.kind === "moment"));
  assert.ok(halloween.results.every((result) => (
    result.takeEvidence &&
    result.takeEvidence.proximityPairs.length > 0 &&
    result.takeEvidence.proximityPairs.every((pair) => pair.distance <= 8)
  )));
  assert.ok(halloween.results.every((result) => result.category !== "OUT OF POCKET"));
  assert.match(halloween.answer, /The tape catches both positive and critical language/i);
  assert.match(halloween.answer, /not one clean final verdict/i);
  assert.match(halloween.results[0].excerpt, /worst part of the movie/i);
  assert.ok(halloween.results[0].takeEvidence.wholeWorkStrength > 0);
  assert.equal(halloween.results.length, 2);
  assert.ok(halloween.results.every((result) => result.at !== 4522));

  for (const query of [
    "How do they feel about Halloween Ends?",
    "What is their take on Halloween Ends?",
  ]) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.intent, "opinion", query);
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every((result) => result.sourceId === "I6QKteG_hK0"), query);
  }
});

test("comparative hate and do-they-like questions reject lexical comedy collateral", async () => {
  const engine = await createEngine();
  const friday = plain(
    engine.ask("Which Friday the 13th movie do they hate most?"),
  );

  assert.equal(friday.intent, "negative");
  assert.equal(friday.entity, "Friday the 13th");
  assert.ok(friday.results.length > 0);
  assert.ok(friday.results.every((result) => (
    result.explanation.opinionEvidence &&
    result.explanation.opinionEvidence.negative.pairs.length > 0
  )));
  assert.ok(
    friday.results.every((result) => !/garbage men think|pick up your trash/i.test(result.excerpt)),
  );
  assert.match(friday.answer, /clearest criticism of Friday the 13th/i);
  assert.match(friday.limitations.join(" "), /does not authenticate.*most-hated/i);

  const scream = plain(engine.ask("Do they like Scream 3?"));
  assert.equal(scream.intent, "opinion");
  assert.equal(scream.status, "archive-boundary");
  assert.equal(scream.entityType, "film");
  assert.equal(scream.results[0].sourceId, "jLIfEdg8Oc0");
  assert.match(scream.results[0].excerpt, /sound effect/i);
  assert.doesNotMatch(scream.results[0].excerpt, /dick|Lance Henriksen/i);
  assert.ok(scream.results[0].takeEvidence.proximityPairs.length > 0);

  const negated = plain(engine.ask("Do they hate Jason X?"));
  assert.ok(negated.results.every((result) => result.at !== 4711));
  assert.ok(negated.results.every((result) => (
    result.explanation.opinionEvidence &&
    result.explanation.opinionEvidence.negative.pairs.length > 0
  )));
});

test("opinion questions fail honestly when no target-proximate receipt exists", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask("Do they like Galactic Turnip Massacre?"));

  assert.equal(answer.intent, "opinion");
  assert.equal(answer.confidence, 0);
  assert.deepEqual(answer.results, []);
  assert.match(answer.answer, /couldn't find a clip close enough.*answer that take honestly/i);
  assert.match(answer.answer, /Unrelated swearing, jokes, and one-off reactions were left out/i);
});


test("fan-native bit and named-section language route to the right playable surface", async () => {
  const engine = await createEngine();
  const loomis = plain(engine.ask("Show me the best Loomis bit"));

  assert.equal(loomis.intent, "comedy");
  assert.equal(loomis.status, "supported");
  assert.ok(loomis.results.length > 0);
  assert.ok(loomis.results.every((result) => result.kind === "character-performance"));
  assert.ok(loomis.results.every((result) => result.title === "Dr. Loomis"));
  assert.match(loomis.answer, /For Dr\. Loomis, start with/i);

  const steve = plain(engine.ask("What was sent straight to Steve's asshole?"));
  assert.equal(steve.status, "surface-handoff");
  assert.equal(steve.recommendedSurface.href, "#steves-asshole");
  assert.equal(steve.recommendedSurface.namedRequest, true);
  assert.deepEqual(steve.results, []);
  assert.match(steve.answer, /WWAM rejection chute/i);
});


test("scoped Steve requests keep the film as a handoff filter", async () => {
  const engine = await createEngine();

  for (const query of [
    "What went straight to Steve's asshole in Halloween Ends?",
    "What did they send straight to Steve's asshole in Halloween Ends?",
  ]) {
    const answer = plain(engine.ask(query));

    assert.equal(answer.status, "surface-handoff", query);
    assert.equal(answer.queryPlan.outputShape, "surface-handoff", query);
    assert.equal(answer.entity, "Halloween Ends", query);
    assert.equal(answer.entityType, "film", query);
    assert.equal(answer.recommendedSurface.href, "#steves-asshole", query);
    assert.equal(answer.recommendedSurface.filterQuery, "Halloween Ends", query);
    assert.deepEqual(answer.recommendedSurface.subject, {
      type: "film",
      label: "Halloween Ends",
      id: "I6QKteG_hK0",
    }, query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /Halloween Ends kept as the filter/i, query);
  }
});

test("natural evaluative follow-ups retain the prior film and source", async () => {
  const engine = await createEngine();
  const opinion = plain(engine.ask("What did they think of Halloween Ends?"));
  const praise = plain(engine.ask("What did they love about it?", opinion.context));
  const criticism = plain(engine.ask("And what did they hate?", praise.context));

  assert.equal(criticism.status, "supported");
  assert.equal(criticism.intent, "negative");
  assert.equal(criticism.continuedFrom, true);
  assert.ok(criticism.contextUsed.includes("entity"));
  assert.equal(criticism.entity, "Halloween Ends");
  assert.ok(criticism.results.length > 0);
  assert.ok(criticism.results.every((result) => result.sourceId === "I6QKteG_hK0"));
  assert.match(criticism.answer, /criticism of Halloween Ends/i);
});


test("exact sealed comedy commentaries hand off to their verified Wiki shelf", async () => {
  const engine = await createEngine();
  for (const query of [
    "Where is the Waiting commentary?",
    "Open the Harold and Kumar watchalong",
    "Show me the Scary Movie 2 commentary wiki",
  ]) {
    const answer = engine.ask(query);
    assert.equal(answer.status, "surface-handoff", query);
    assert.equal(answer.recommendedSurface.href, "#comedy-vault", query);
    assert.equal(answer.questionType, "exact source navigation", query);
    assert.equal(answer.recommendedSurface.sealedSource, true, query);
    assert.equal(answer.results.length, 0, query);
    assert.match(answer.answer, /official WWAM source record is verified/i, query);
  }
});
