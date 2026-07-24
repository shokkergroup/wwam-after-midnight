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

test("natural latest-livestream questions return one source-scoped topic map", async () => {
  const engine = await createEngine();

  for (const query of [
    "What are they talking about in the latest livestream?",
    "Which topics were they discussing in the latest live stream?",
  ]) {
    const answer = plain(engine.ask(query));

    assert.equal(answer.status, "supported", query);
    assert.equal(answer.intent, "topic", query);
    assert.equal(answer.source, "livestream", query);
    assert.equal(answer.temporal, "latest", query);
    assert.equal(answer.selectionPlan.source.metric, "date", query);
    assert.equal(answer.selectionPlan.source.direction, "descending", query);
    assert.equal(answer.selectionPlan.source.sourceId, "LV2rmwEA0w4", query);
    assert.equal(answer.selectionPlan.source.matchMode, "latest-indexed-livestream", query);
    assert.equal(answer.selectionPlan.source.lane, "fresh", query);
    assert.ok(answer.results.length > 1, query);
    assert.ok(answer.results.every((result) => (
      result.sourceId === "LV2rmwEA0w4" &&
      result.kind === "topic" &&
      result.date === "2026-07-23"
    )), query);
    assert.deepEqual(
      answer.results.map((result) => result.at),
      answer.results.map((result) => result.at).sort((a, b) => a - b),
      query,
    );
    assert.match(answer.answer, /source-scoped topic map/i, query);
    assert.match(answer.answer, /not blended streams or invented dialogue/i, query);
    assert.match(answer.answer, /captured caption evidence/i, query);
  }
});

test("first appearance means earliest curated performance in the bounded current set", async () => {
  const engine = await createEngine();

  for (const query of [
    "When did Dr. Loomis first appear?",
    "What is Dr. Loomis's earliest appearance?",
  ]) {
    const answer = plain(engine.ask(query));

    assert.equal(answer.status, "supported", query);
    assert.equal(answer.entity, "Dr. Loomis", query);
    assert.equal(answer.temporal, "earliest", query);
    assert.equal(answer.results[0].kind, "character-performance", query);
    assert.equal(answer.results[0].performanceReceiptId, "loomis-dj", query);
    assert.equal(answer.results[0].date, "2022-08-20", query);
    assert.equal(
      answer.results[0].label,
      "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET",
      query,
    );
    assert.deepEqual(
      answer.evidenceChain.slice(0, 2).map((entry) => entry.role),
      [
        "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET",
        "LATER CURATED PERFORMANCE RECEIPT IN CURRENT SET",
      ],
      query,
    );
    assert.equal(answer.results[0].archiveBoundary.trueOriginClaim, false, query);
    assert.ok(answer.results.every((result) => result.speaker === null), query);
    assert.match(answer.answer, /current verified set/i, query);
    assert.match(answer.answer, /not a claim.*originated/i, query);
    assert.match(answer.limitations.join(" "), /not a claim of true origin/i, query);
  }
});

test("a resolvable named bit can anchor an in-source after query without prior context", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask("What happened after The Burp Defense?"));

  assert.equal(answer.status, "supported");
  assert.equal(answer.entity, "THE BURP DEFENSE");
  assert.equal(answer.continuedFrom, false);
  assert.deepEqual(answer.contextUsed, ["named-result"]);
  assert.equal(answer.selectionPlan.mode, "next");
  assert.equal(answer.selectionPlan.resolvedFrom, "named-result");
  assert.equal(answer.selectionPlan.anchor.sourceId, "BIbyzMlstmM");
  assert.equal(answer.selectionPlan.anchor.at, 1528);
  assert.equal(answer.results[0].sourceId, "BIbyzMlstmM");
  assert.equal(answer.results[0].at, 2373);
  assert.ok(answer.results.every((result) => (
    result.sourceId === "BIbyzMlstmM" && result.at > 1528
  )));
  assert.match(answer.answer, /next indexed receipt in the same source after 25:28/i);
  assert.match(answer.answer, /not a claim about the literal next spoken line/i);
  assert.match(answer.limitations.join(" "), /next indexed highlight/i);

  const nextAgain = plain(engine.ask("What happened next?", answer.context));
  assert.equal(nextAgain.selectionPlan.mode, "next");
  assert.equal(nextAgain.selectionPlan.resolvedFrom, "conversation-context");
  assert.equal(nextAgain.results[0].sourceId, "BIbyzMlstmM");
  assert.equal(nextAgain.results[0].at, 2622);
});

test("new natural routes leave source-title and speaker firewalls closed", async () => {
  const engine = await createEngine();
  const title = plain(engine.ask("Tell me about Scream 7"));
  const orphanSpeaker = plain(engine.ask("Who said that?"));

  assert.equal(title.selectionPlan.source.sourceId, "WKs1uPGMQvw");
  assert.ok(title.results.every((result) => result.sourceId === "WKs1uPGMQvw"));
  assert.equal(orphanSpeaker.status, "speaker-unknown");
  assert.deepEqual(orphanSpeaker.results, []);
  assert.match(orphanSpeaker.answer, /cannot identify a host/i);
});
