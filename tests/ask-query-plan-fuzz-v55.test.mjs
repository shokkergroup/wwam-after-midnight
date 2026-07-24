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
    assert.match(answer.answer, /did not substitute a livestream or an older upload/i, query);
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
