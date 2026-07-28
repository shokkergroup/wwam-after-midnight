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
  "wwam-channel-dna.js",
  "search-engine.js",
];

async function createEngine({
  now = "2026-07-28T12:00:00-04:00",
  withChannelDNA = true,
} = {}) {
  const sandbox = { window: {} };
  sandbox.globalThis = sandbox.window;
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
    withChannelDNA ? window.WWAM_CHANNEL_DNA : {},
    { now },
  );
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function ask(engine, query) {
  return plain(engine.ask(query));
}

function assertSourceBoundReceipts(answer, query) {
  assert.ok(answer.results.length > 0, query);
  assert.ok(answer.results.every((result) => result.speaker === null), query);
  assert.ok(answer.results.every((result) => result.speakerStatus === "not-diarized"), query);
  assert.ok(answer.results.every((result) => /^https:\/\/www\.youtube\.com\/watch\?v=/.test(result.url)), query);
}

test("recurring-topic questions aggregate unique shows instead of returning one stream's local count", async () => {
  const engine = await createEngine();
  const questions = [
    "What topics come up the most across livestreams?",
    "What do they keep coming back to on the live shows?",
    "Rank the recurring livestream topics",
    "What are the most discussed topics in livestreams?",
    "What are the most common themes in their livestreams?",
    "Which topics recur most often?",
  ];

  for (const query of questions) {
    const answer = ask(engine, query);
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.intent, "topic", query);
    assert.equal(answer.source, "livestream", query);
    assert.equal(answer.metric, "mentions", query);
    assert.equal(answer.queryPlan.outputShape, "topic-ranking", query);
    assert.deepEqual(answer.queryPlan.subjectTerms, [], query);
    assert.ok(answer.collection.total > 10, query);
    assert.ok(answer.collection.sourceTotal > 1, query);
    assert.match(answer.collection.countBasis, /duplicate source records count once/i, query);
    assertSourceBoundReceipts(answer, query);
    assert.ok(answer.results.every((result) => result.kind === "topic"), query);
    assert.equal(
      new Set(answer.results.map((result) => result.title.toLowerCase())).size,
      answer.results.length,
      query,
    );
    assert.ok(answer.results[0].recurrence.indexedSources > 1, query);
    assert.equal(
      new Set(answer.results[0].recurrence.sourceIds).size,
      answer.results[0].recurrence.sourceIds.length,
      query,
    );
    assert.ok(answer.results[0].mentions >= answer.results[1].mentions, query);
    assert.match(answer.answer, /archive labels, not host-authored rankings/i, query);
  }

  const least = ask(engine, "Which topics recur least often?");
  assert.equal(least.status, "supported");
  assert.equal(least.queryPlan.controls.direction, "ascending");
  assert.ok(least.results[0].mentions <= least.results[1].mentions);
  assert.match(least.answer, /least recurring indexed livestream topic/i);
  assert.doesNotMatch(least.answer, /\b1 shows\b/i);
});

test("show-shaped source questions count and list unique uploads in the requested unit", async () => {
  const engine = await createEngine();
  const count = ask(engine, "How many shows mention Batman?");
  const list = ask(engine, "Which shows mention Batman?");
  const episodeCount = ask(engine, "How many episodes mention Batman?");
  const singularList = ask(engine, "Which show mentions Batman?");

  assert.equal(count.queryPlan.outputShape, "source-count");
  assert.equal(count.collection.unit, "shows");
  assert.ok(count.collection.total > 1);
  assert.match(count.answer, /different shows/i);
  assert.ok(count.results.every((result) => result.kind === "topic"));
  assert.equal(new Set(count.results.map((result) => result.sourceId)).size, count.results.length);

  assert.equal(list.queryPlan.outputShape, "source-list");
  assert.equal(list.collection.unit, "shows");
  assert.equal(list.collection.total, count.collection.total);
  assert.equal(list.results.length, list.collection.total);
  assert.equal(new Set(list.results.map((result) => result.sourceId)).size, list.results.length);
  assert.ok(list.results.every((result) => result.title === "Batman"));

  assert.equal(episodeCount.queryPlan.outputShape, "source-count");
  assert.equal(episodeCount.collection.unit, "shows");
  assert.equal(episodeCount.collection.total, count.collection.total);

  assert.equal(singularList.queryPlan.outputShape, "source-list");
  assert.equal(singularList.collection.unit, "shows");
  assert.equal(singularList.collection.total, count.collection.total);
});

test("number-word newest and oldest show lists return source records in chronological order", async () => {
  const engine = await createEngine();
  const newest = ask(engine, "List the last five shows");
  const oldest = ask(engine, "Give me the first three broadcasts");

  assert.equal(newest.queryPlan.outputShape, "source-list");
  assert.equal(newest.queryPlan.controls.requestedLimit, 5);
  assert.equal(newest.temporal, "latest");
  assert.equal(newest.collection.unit, "shows");
  assert.equal(newest.results.length, 5);
  assert.deepEqual(
    newest.results.map((result) => result.date),
    newest.results.map((result) => result.date).sort().reverse(),
  );
  assert.ok(newest.results.every((result) => (
    result.kind === "tape" || result.kind === "livestream"
  )));
  assert.match(newest.answer, /This scope contains .* shows/i);

  assert.equal(oldest.queryPlan.outputShape, "source-list");
  assert.equal(oldest.queryPlan.controls.requestedLimit, 3);
  assert.equal(oldest.temporal, "earliest");
  assert.equal(oldest.results.length, 3);
  assert.deepEqual(
    oldest.results.map((result) => result.date),
    oldest.results.map((result) => result.date).sort(),
  );
});

test("last-night recaps and funniest-part requests lock to one newest indexed show", async () => {
  const engine = await createEngine();
  const recap = ask(engine, "Give me a recap of last night's show");
  const comedy = ask(engine, "What were the funniest parts of last night's show?");

  assert.equal(recap.status, "supported");
  assert.equal(recap.queryPlan.outputShape, "source-summary");
  assert.equal(recap.selectionPlan.source.matchMode, "latest-indexed-livestream");
  assert.equal(recap.results.length, 1);
  assert.equal(recap.results[0].sourceId, recap.selectionPlan.source.sourceId);
  assert.equal(recap.results[0].kind, "livestream");
  assert.match(recap.answer, /Archive recap:/i);
  assert.match(recap.answer, /derived source summary, not a verbatim transcript/i);

  assert.equal(comedy.status, "supported");
  assert.equal(comedy.intent, "comedy");
  assert.equal(comedy.queryPlan.temporalSourceContent, true);
  assert.equal(comedy.selectionPlan.source.sourceId, recap.results[0].sourceId);
  assert.ok(comedy.results.length > 0);
  assert.ok(comedy.results.every((result) => (
    result.kind === "moment" && result.sourceId === recap.results[0].sourceId
  )));
  assertSourceBoundReceipts(comedy, comedy.query);
});

test("topic counts state their unit and keep one exact latest-show scope when requested", async () => {
  const engine = await createEngine();
  const archive = ask(engine, "How many topics are indexed?");
  const latest = ask(engine, "How many topics were in last night's show?");

  for (const answer of [archive, latest]) {
    assert.equal(answer.status, "supported");
    assert.equal(answer.queryPlan.outputShape, "topic-count");
    assert.ok(answer.collection.total > 0);
    assert.match(answer.collection.countBasis, /normalized topic labels/i);
    assert.match(answer.answer, /not a count of unique spoken ideas/i);
    assert.ok(answer.results.every((result) => result.kind === "topic"));
  }
  assert.equal(latest.collection.sourceTotal, 1);
  assert.equal(latest.selectionPlan.source.matchMode, "latest-indexed-livestream");
  assert.ok(latest.results.every((result) => (
    result.sourceId === latest.selectionPlan.source.sourceId
  )));
});

test("global best, funniest, and most-hated superlatives use their owned surfaces", async () => {
  const engine = await createEngine();
  const cases = [
    ["What is their best moment ever?", "memorability-candidate-index-v2.1"],
    ["What is the funniest moment ever?", "riff-black-box"],
    ["What did they hate the most?", "steves-asshole"],
  ];

  for (const [query, surfaceId] of cases) {
    const answer = ask(engine, query);
    assert.equal(answer.status, "surface-handoff", query);
    assert.equal(answer.queryPlan.outputShape, "surface-handoff", query);
    assert.equal(answer.surfaceHandoff.id, surfaceId, query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /will not invent a separate #1/i, query);
    assert.ok(answer.limitations.some((item) => /not a creator/i.test(item)), query);
  }
});
test("natural recurring-bit questions use the curated Channel DNA ledger", async () => {
  const engine = await createEngine();
  const questions = [
    "What recurring bits do they go back to most?",
    "Which bits do they return to?",
    "What bits do they repeat most?",
  ];

  for (const query of questions) {
    const answer = ask(engine, query);
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.queryPlan.outputShape, "recurring-bit-ledger", query);
    assert.equal(answer.entity, null, query);
    assert.deepEqual(answer.queryPlan.subjectTerms, [], query);
    assert.equal(answer.collection.unit, "curated recurring bits", query);
    assert.equal(answer.collection.total, 4, query);
    assert.equal(answer.collection.ledgerAvailable, true, query);
    assert.match(answer.collection.countBasis, /Channel DNA bit definitions/i, query);
    assert.match(answer.collection.countBasis, /each source counts once per bit/i, query);
    assertSourceBoundReceipts(answer, query);
    assert.ok(answer.results.every((result) => (
      result.kind === "character-performance" &&
      result.bitLedger &&
      result.bitLedger.sourceCount === new Set(result.bitLedger.sourceIds).size &&
      result.bitLedger.receiptCount >= result.bitLedger.sourceCount &&
      result.performanceReceiptId === result.bitLedger.representativeReceiptId
    )), query);
    assert.deepEqual(
      answer.results.map((result) => result.bitLedger.sourceCount),
      answer.results.map((result) => result.bitLedger.sourceCount)
        .slice().sort((left, right) => right - left),
      query,
    );
    assert.match(answer.answer, /representative timestamped receipt/i, query);
    assert.match(answer.answer, /not a search for the noun bits/i, query);
  }
});

test("recurring-bit questions fail closed when no curated ledger is supplied", async () => {
  const engine = await createEngine({ withChannelDNA: false });
  const answer = ask(engine, "What recurring bits do they go back to most?");

  assert.equal(answer.queryPlan.outputShape, "recurring-bit-ledger");
  assert.equal(answer.status, "insufficient-evidence");
  assert.equal(answer.collection.total, 0);
  assert.equal(answer.collection.ledgerAvailable, false);
  assert.deepEqual(answer.results, []);
  assert.match(answer.answer, /No curated recurring-bit ledger is available/i);
  assert.match(answer.answer, /will not turn the generic word bits into a transcript subject/i);
});

test("last night resolves to yesterday in New York and labels a newest-show fallback honestly", async () => {
  const fallbackEngine = await createEngine({
    now: "2026-07-28T12:00:00-04:00",
  });
  const recap = ask(fallbackEngine, "Give me a recap of last night's show");
  const comedy = ask(fallbackEngine, "What were the funniest parts of last night's show?");

  assert.equal(recap.queryPlan.controls.relativeTimeZone, "America/New_York");
  assert.equal(recap.queryPlan.controls.requestedRelativeDate, "2026-07-27");
  assert.equal(recap.selectionPlan.source.requestedRelativeDate, "2026-07-27");
  assert.equal(recap.selectionPlan.source.relativeDateMatched, false);
  assert.equal(recap.selectionPlan.source.fallbackOffered, true);
  assert.equal(recap.selectionPlan.source.date, "2026-07-23");
  assert.match(recap.answer, /No indexed show is mapped for 2026-07-27/i);
  assert.match(recap.answer, /newest mapped show I can offer instead/i);
  assert.equal(recap.results.length, 1);
  assert.equal(
    new Set(recap.results.map((result) => result.sourceId)).size,
    1,
  );

  assert.equal(comedy.selectionPlan.source.fallbackOffered, true);
  assert.ok(comedy.results.length > 0);
  assert.ok(comedy.results.every((result) => (
    result.sourceId === recap.selectionPlan.source.sourceId
  )));
  assert.match(comedy.answer, /No indexed show is mapped for 2026-07-27/i);
  assert.match(comedy.answer, /On that fallback, start with/i);
  assert.doesNotMatch(comedy.answer, /here \(the offered fallback\)/i);

  const boundaryEngine = await createEngine({ now: "2026-07-28T02:30:00Z" });
  const boundary = ask(boundaryEngine, "What happened yesterday?");
  assert.equal(boundary.queryPlan.controls.requestedRelativeDate, "2026-07-26");
});

test("an exact yesterday match stays exact instead of being described as a fallback", async () => {
  const engine = await createEngine({ now: "2026-07-24T12:00:00-04:00" });
  const answer = ask(engine, "Give me a recap of last night's show");

  assert.equal(answer.queryPlan.controls.requestedRelativeDate, "2026-07-23");
  assert.equal(answer.selectionPlan.source.date, "2026-07-23");
  assert.equal(answer.selectionPlan.source.relativeDateMatched, true);
  assert.equal(answer.selectionPlan.source.fallbackOffered, false);
  assert.match(answer.answer, /indexed show mapped for 2026-07-23/i);
  assert.doesNotMatch(answer.answer, /No indexed show is mapped/i);
  assert.equal(answer.results.length, 1);
  assert.ok(answer.results.every((result) => (
    result.sourceId === answer.selectionPlan.source.sourceId
  )));
});

test("global Ask cards render an explicit source title and date provenance line", async () => {
  const app = await readFile(new URL("app.js", demoRoot), "utf8");
  const askStart = app.indexOf("  function ask(query, preservedAnalysis)");
  const askEnd = app.indexOf("  function showcaseCall(", askStart);
  const askMarkup = app.slice(askStart, askEnd);

  assert.match(askMarkup, /class="ask-result-source">SOURCE \/\//);
  assert.match(askMarkup, /result\.sourceTitle \|\| result\.title/);
  assert.match(askMarkup, /result\.date \|\| 'DATE NOT MAPPED'/);
  assert.ok(
    askMarkup.indexOf('class="ask-result-source"') <
      askMarkup.indexOf("WHY THIS MATCH?"),
    "source provenance should be visible before the collapsed explanation",
  );
});
