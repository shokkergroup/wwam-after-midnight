import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function createEngine() {
  const context = { window: {}, setTimeout };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "archive-deep-distill.js",
    "search-engine.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const { window } = context;
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

const engine = createEngine();

test("a conversational pronoun I never becomes sequel one", () => {
  for (const [query, entity] of [
    ["What do I need to know about Halloween?", "Halloween"],
    ["Can you tell me what I should know about Scream?", "Scream"],
  ]) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.entity, entity, query);
    assert.deepEqual(answer.queryPlan.subjectTerms, [], query);
    assert.doesNotMatch(answer.queryPlan.canonicalQuery, /\b1\b/, query);
    assert.doesNotMatch(answer.answer, /No indexed source title matches/i, query);
  }

  const commentary = plain(engine.ask("I want the Halloween commentary"));
  assert.equal(commentary.status, "supported");
  assert.equal(commentary.source, "commentary");
  assert.equal(commentary.entity, "Halloween");
  assert.ok(commentary.results.every((result) => result.source === "commentary"));
});

test("sequel numerals remain title identity rather than accidental list limits", () => {
  for (const [query, entity, sourceId] of [
    ["Show me Halloween II commentary", "Halloween II (1981)", "ThPjds8iI9U"],
    [
      "Show me Halloween IV commentary",
      "Halloween 4: The Return of Michael Myers",
      "28PfRNKoSCA",
    ],
  ]) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.queryPlan.controls.requestedLimit, null, query);
    assert.equal(answer.queryPlan.outputShape, "single", query);
    assert.equal(answer.entity, entity, query);
    assert.equal(answer.results[0].sourceId, sourceId, query);
    assert.ok(answer.results.every((result) => result.sourceId === sourceId), query);
  }
});

test("spelled source-list limits return source records before the display cap", () => {
  for (const query of [
    "Give me three Halloween commentaries",
    "Show me three Halloween commentaries",
  ]) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.queryPlan.controls.requestedLimit, 3, query);
    assert.equal(answer.queryPlan.outputShape, "source-list", query);
    assert.equal(answer.collection.total, 13, query);
    assert.equal(answer.results.length, 3, query);
    assert.equal(new Set(answer.results.map((result) => result.sourceId)).size, 3, query);
    assert.ok(answer.results.every((result) => result.kind === "tape"), query);
  }
});

test("explicit commentary lanes beat relative-time livestream shorthand", () => {
  for (const query of [
    "Which commentary was uploaded yesterday?",
    "What was last night's Halloween commentary?",
  ]) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.source, "commentary", query);
    assert.equal(
      answer.queryPlan.controls.relativeTime,
      "latest-indexed-date-in-explicit-lane",
      query,
    );
    assert.equal(answer.queryPlan.controls.relativeDate, "2026-07-23", query);
    assert.equal(answer.status, "insufficient-evidence", query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /kept the show type and date you asked for/i, query);
  }
});

test("happened language opens the newest source-scoped topic map", () => {
  for (const query of [
    "What happened yesterday?",
    "What happened on the last stream?",
  ]) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.intent, "topic", query);
    assert.equal(answer.queryPlan.controls.relativeTime, "latest-indexed-stream", query);
    assert.deepEqual(answer.queryPlan.subjectTerms, [], query);
    assert.ok(answer.results.length > 1, query);
    assert.ok(answer.results.every((result) => (
      result.sourceId === "LV2rmwEA0w4" && result.kind === "topic"
    )), query);
  }
});

test("generic output nouns do not become required comedy subjects", () => {
  const answer = plain(engine.ask("Show me top 5 funniest moments"));
  assert.equal(answer.status, "supported");
  assert.equal(answer.intent, "comedy");
  assert.equal(answer.queryPlan.outputShape, "result-list");
  assert.equal(answer.queryPlan.controls.requestedLimit, 5);
  assert.deepEqual(answer.queryPlan.subjectTerms, []);
  assert.equal(answer.results.length, 5);
  assert.ok(answer.results.every((result) => result.kind === "moment"));
});

test("plural source mention questions count unique streams instead of caption matches", () => {
  const answer = plain(engine.ask("How many streams mention Batman?"));

  assert.equal(answer.queryPlan.outputShape, "source-count");
  assert.equal(answer.queryPlan.sourceMentionCollection, true);
  assert.equal(answer.collection.unit, "livestreams");
  assert.ok(answer.collection.total > 1);
  assert.equal(
    answer.collection.total,
    answer.explanation.resultCountBeforeDisplayLimit,
  );
  assert.match(answer.answer, /different livestreams/i);
  assert.ok(answer.results.every((result) => (
    result.kind === "topic" && result.title === "Batman"
  )));
  assert.equal(
    new Set(answer.results.map((result) => result.sourceId)).size,
    answer.results.length,
  );
  assert.notEqual(answer.collection.total, 71);
});

test("which/list source mention questions return playable unique topic receipts", () => {
  const answers = [
    plain(engine.ask("Which streams mention Batman?")),
    plain(engine.ask("List all streams that mention Batman")),
  ];

  for (const answer of answers) {
    assert.equal(answer.queryPlan.outputShape, "source-list");
    assert.equal(answer.queryPlan.sourceMentionCollection, true);
    assert.equal(answer.collection.unit, "livestreams");
    assert.ok(answer.collection.total > 1);
    assert.equal(answer.results.length, answer.collection.total);
    assert.equal(
      new Set(answer.results.map((result) => result.sourceId)).size,
      answer.results.length,
    );
    assert.ok(answer.results.every((result) => (
      result.kind === "topic" && result.title === "Batman" && /[?&]t=\d+s$/.test(result.url)
    )));
  }
});

test("source nouns also disambiguate character source counts from raw mention counts", () => {
  const streams = plain(engine.ask("How many streams mention Dr. Loomis?"));
  const mentions = plain(engine.ask("How many mentions of Dr. Loomis are indexed?"));

  assert.equal(streams.queryPlan.outputShape, "source-count");
  assert.equal(streams.collection.unit, "livestreams");
  assert.ok(streams.collection.total > 1);
  assert.ok(streams.results.every((result) => (
    result.kind === "character" && result.character === "Dr. Loomis"
  )));
  assert.equal(
    new Set(streams.results.map((result) => result.sourceId)).size,
    streams.results.length,
  );

  assert.equal(mentions.queryPlan.outputShape, "character-mention-count");
  assert.equal(mentions.collection.unit, "caption mention matches");
  assert.ok(mentions.collection.total > streams.collection.total);
  assert.match(mentions.answer, /times in captions across/i);
});

test("last-night result limits lock to one exact livestream and never backfill", () => {
  const answer = plain(engine.ask("Show me the top 10 funniest moments last night"));

  assert.equal(answer.queryPlan.outputShape, "result-list");
  assert.equal(answer.queryPlan.temporalSourceContent, true);
  assert.equal(answer.queryPlan.controls.requestedLimit, 10);
  assert.equal(answer.selectionPlan.source.sourceId, "LV2rmwEA0w4");
  assert.equal(answer.selectionPlan.source.matchMode, "latest-indexed-livestream");
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.length < 10, "do not pad the requested limit from older streams");
  assert.ok(answer.results.every((result) => (
    result.sourceId === "LV2rmwEA0w4" && result.kind === "moment"
  )));
  assert.match(answer.answer, /No indexed show is mapped.*On that fallback, start with/i);
});

test("every funny moment in the newest livestream is a result list, not a source list", () => {
  const answer = plain(engine.ask("Show every funny moment in the newest livestream"));

  assert.equal(answer.queryPlan.outputShape, "result-list");
  assert.equal(answer.queryPlan.resultPlural, true);
  assert.equal(answer.queryPlan.allResultsRequested, true);
  assert.equal(answer.queryPlan.temporalSourceContent, true);
  assert.equal(answer.selectionPlan.source.sourceId, "LV2rmwEA0w4");
  assert.equal(answer.selectionPlan.source.matchMode, "latest-indexed-livestream");
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => (
    result.sourceId === "LV2rmwEA0w4" && result.kind === "moment"
  )));
  assert.equal(
    answer.results.length,
    answer.explanation.resultCountBeforeDisplayLimit,
  );
});

test("topic chronology ranks matching receipts instead of selecting an unrelated earliest source", () => {
  const answer = plain(engine.ask("What is the earliest indexed Scream livestream topic?"));

  assert.equal(answer.status, "supported");
  assert.equal(answer.queryPlan.temporalSourceContent, false);
  assert.equal(answer.entity, "Scream");
  assert.equal(answer.results[0].sourceId, "R_bXrnNOcwg");
  assert.equal(answer.results[0].kind, "topic");
});
