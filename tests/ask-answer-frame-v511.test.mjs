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
  "archive-deep-distill.js",
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
    window.WWAM_ARCHIVE_DEEP,
  );
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("recognized films retain secondary receipt targets before heat can rank", async () => {
  const engine = await createEngine();
  const mask = plain(engine.ask(
    "What did they say about the mask in Halloween 5?",
  ));
  const jason = plain(engine.ask(
    "What did they say about Jason in Friday 6?",
  ));

  assert.deepEqual(mask.queryPlan.subjectTerms, ["mask"]);
  assert.deepEqual(mask.queryPlan.concepts.secondaryTargets, ["mask"]);
  assert.equal(mask.results[0].sourceId, "AtcRT3Xkk6E");
  assert.equal(mask.results[0].at, 1327);
  assert.ok(mask.results.every((result) => /\bmask\b/i.test(result.excerpt)));
  assert.ok(mask.results.every((result) => result.at !== 5646));

  assert.deepEqual(jason.queryPlan.subjectTerms, ["jason"]);
  assert.equal(jason.results[0].sourceId, "BIbyzMlstmM");
  assert.ok(jason.results.some((result) => result.at === 1090));
  assert.ok(jason.results.some((result) => result.at === 4347));
  assert.ok(jason.results.every((result) => /\bjason\b/i.test(result.excerpt)));
  assert.ok(jason.results.every((result) => result.at !== 1528));
});

test("an unavailable requested subtopic abstains instead of returning a hot tangent", async () => {
  const engine = await createEngine();
  const ending = plain(engine.ask(
    "What did they say about the ending in Scream 3?",
  ));

  assert.equal(ending.entity, "Scream 3");
  assert.deepEqual(ending.queryPlan.subjectTerms, ["ending"]);
  assert.equal(ending.status, "insufficient-evidence");
  assert.equal(ending.confidence, 0);
  assert.deepEqual(ending.results, []);
  assert.match(ending.answer, /ending in Scream 3/i);
  assert.doesNotMatch(ending.answer, /Lance Henriksen/i);
});

test("coverage negation and command predicates keep their grammar", async () => {
  const engine = await createEngine();
  const coverage = plain(engine.ask("Did they not cover Alien?"));
  const play = plain(engine.ask("Play Scream 7"));
  const bad = plain(engine.ask("Do they think Scream 7 is bad?"));

  assert.equal(coverage.status, "supported");
  assert.equal(coverage.entity, "Alien");
  assert.deepEqual(coverage.queryPlan.subjectTerms, []);
  assert.match(coverage.answer, /^No — they did cover it\./);

  assert.equal(play.selectionPlan.source.sourceId, "WKs1uPGMQvw");
  assert.equal(play.selectionPlan.source.matchMode, "exact");
  assert.equal(play.queryPlan.concepts.action, "play");
  assert.deepEqual(play.queryPlan.concepts.sourceQualifiers, ["7"]);
  assert.ok(play.results.every((result) => result.sourceId === "WKs1uPGMQvw"));

  assert.equal(bad.selectionPlan.source.sourceId, "WKs1uPGMQvw");
  assert.equal(bad.status, "insufficient-evidence");
  assert.deepEqual(bad.results, []);
  assert.ok(bad.queryPlan.concepts.predicate.includes("bad"));
  assert.doesNotMatch(bad.answer, /No indexed source title matches/i);
});

test("latest, spelled limits, and generic oldest watchalong selectors stay literal", async () => {
  const engine = await createEngine();
  const lastLoomis = plain(engine.ask("When was the last Dr. Loomis bit?"));
  const newestThree = plain(engine.ask(
    "Show me the three newest commentaries",
  ));
  const oldest = plain(engine.ask("What is the oldest watch along?"));

  assert.equal(lastLoomis.temporal, "latest");
  assert.deepEqual(lastLoomis.queryPlan.subjectTerms, []);
  assert.equal(lastLoomis.results[0].performanceReceiptId, "loomis-pepto");
  assert.equal(lastLoomis.results[0].sourceId, "LV2rmwEA0w4");
  assert.equal(lastLoomis.results[0].date, "2026-07-23");

  assert.equal(newestThree.queryPlan.outputShape, "source-list");
  assert.equal(newestThree.queryPlan.controls.requestedLimit, 3);
  assert.equal(newestThree.results.length, 3);
  assert.deepEqual(
    newestThree.results.map((result) => result.sourceId),
    ["ISDlaQ9DWSM", "I6QKteG_hK0", "hQu1Y1GZozI"],
  );

  assert.equal(oldest.status, "supported");
  assert.equal(oldest.source, "commentary");
  assert.deepEqual(oldest.queryPlan.subjectTerms, []);
  assert.equal(oldest.results[0].kind, "tape");
  assert.equal(oldest.results[0].sourceId, "l4Ae4ywJvuo");
  assert.equal(oldest.results[0].date, "2016-02-01");
  assert.equal(oldest.selectionPlan, null);
});

test("newest-source content selects the source before ranking its receipts", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask(
    "What happens in the newest commentary?",
  ));

  assert.equal(answer.status, "supported");
  assert.equal(answer.selectionPlan.source.sourceId, "ISDlaQ9DWSM");
  assert.equal(
    answer.selectionPlan.source.matchMode,
    "latest-indexed-source-content",
  );
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => (
    result.sourceId === "ISDlaQ9DWSM" && result.kind === "moment"
  )));
  assert.match(answer.answer, /source-scoped archive route/i);
  assert.match(answer.answer, /not an invented plot summary/i);
});

test("character profile, performance, and mention requests remain distinct", async () => {
  const engine = await createEngine();
  const feldman = plain(engine.ask("Tell me about the Corey Feldman bit"));
  const slender = plain(engine.ask("Who is Slenderman?"));
  const mentions = plain(engine.ask(
    "What did they say about Corey Feldman?",
  ));
  const performance = plain(engine.ask("Play a Dr. Loomis performance"));

  assert.equal(feldman.queryPlan.outputShape, "character-profile");
  assert.match(feldman.answer, /fictional Wolf Pack/i);
  assert.match(feldman.answer, /Grounded Character Lore profile/i);

  assert.equal(slender.status, "supported");
  assert.equal(slender.queryPlan.outputShape, "character-profile");
  assert.match(slender.answer, /supernatural advice line/i);
  assert.doesNotMatch(slender.answer, /cannot identify a host/i);

  assert.equal(mentions.entity, "Corey Feldman");
  assert.ok(mentions.results.length > 0);
  assert.ok(mentions.results.every((result) => result.kind === "character"));
  assert.ok(mentions.results.every((result) => (
    result.evidenceType === "caption-character-signal"
  )));
  assert.match(mentions.answer, /character signal/i);

  assert.ok(performance.results.length > 0);
  assert.ok(performance.results.every((result) => (
    result.kind === "character-performance"
  )));
});

test("singular global comedy winners hand off to the published Comedy Black Box", async () => {
  const engine = await createEngine();

  for (const query of [
    "What made them laugh hardest?",
    "Show me their funniest moment",
  ]) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.status, "surface-handoff", query);
    assert.equal(answer.surfaceHandoff.id, "riff-black-box", query);
    assert.equal(answer.recommendedSurface.href, "#memory", query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /will not invent a separate #1/i, query);
    assert.match(answer.answer, /Comedy Black Box/i, query);
  }

  const rankedList = plain(engine.ask("Show me top 5 funniest moments"));
  assert.equal(rankedList.status, "supported");
  assert.equal(rankedList.results.length, 5);
});

test("next, previous, there, and another preserve the exact prior receipt anchor", async () => {
  const engine = await createEngine();
  const burp = plain(engine.ask("Where is The Burp Defense?"));
  const cases = [
    ["next one", "next", 2373],
    ["before it", "previous", 1090],
    ["What did they say there?", "exact", 1528],
    ["another moment", "similar", 2373],
  ];

  for (const [query, mode, at] of cases) {
    const answer = plain(engine.ask(query, burp.context));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.selectionPlan.mode, mode, query);
    assert.equal(answer.selectionPlan.resolvedFrom, "conversation-context", query);
    assert.equal(answer.selectionPlan.anchor.sourceId, "BIbyzMlstmM", query);
    assert.equal(answer.selectionPlan.anchor.at, 1528, query);
    assert.equal(answer.results[0].sourceId, "BIbyzMlstmM", query);
    assert.equal(answer.results[0].at, at, query);
  }
});
