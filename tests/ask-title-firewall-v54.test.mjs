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

test("numbered indexed titles outrank broad franchise aliases without losing the number", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask("Tell me about Scream 7"));

  assert.equal(answer.status, "supported");
  assert.equal(answer.selectionPlan.source.metric, "title-relevance");
  assert.equal(answer.selectionPlan.source.sourceId, "WKs1uPGMQvw");
  assert.equal(answer.selectionPlan.source.lane, "archive");
  assert.deepEqual(answer.selectionPlan.source.matchedTerms, ["scream", "7"]);
  assert.equal(answer.selectionPlan.source.tieBreak, "latest-indexed-source");
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => result.sourceId === "WKs1uPGMQvw"));
  assert.ok(answer.results.every((result) => result.lane === "archive"));
  assert.ok(answer.results.every((result) => result.source !== "commentary"));
});

test("a restricted exact title fails at the firewall instead of escaping to franchise comedy", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask(
    "What's the funniest thing in the Scream 7 trailer reaction?",
  ));

  assert.equal(answer.intent, "comedy");
  assert.equal(answer.status, "topic-only-boundary");
  assert.equal(answer.selectionPlan.source.sourceId, "fpNtQMexZiw");
  assert.equal(answer.selectionPlan.source.matchMode, "exact");
  assert.deepEqual(answer.results, []);
  assert.match(answer.answer, /topic navigation/i);
  assert.match(answer.answer, /source-audio firewall/i);
  assert.match(answer.answer, /will not substitute adjacent franchise content/i);
});

test("near-exact title recovery permits one text typo but never changes a sequel number", async () => {
  const engine = await createEngine();
  const typo = plain(engine.ask(
    "What's funniest in the Scream 7 trailor reaction?",
  ));
  const unknownNumber = plain(engine.ask("Tell me about Scream 8"));

  assert.equal(typo.status, "topic-only-boundary");
  assert.equal(typo.selectionPlan.source.sourceId, "fpNtQMexZiw");
  assert.equal(typo.selectionPlan.source.matchMode, "near-exact");
  assert.deepEqual(typo.results, []);

  assert.equal(unknownNumber.status, "insufficient-evidence");
  assert.equal(
    unknownNumber.selectionPlan.sourceTitleBoundary.reason,
    "unresolved-numbered-title",
  );
  assert.deepEqual(unknownNumber.results, []);
  assert.match(unknownNumber.answer, /sequel number is being kept exact/i);
  assert.doesNotMatch(unknownNumber.answer, /Scream \(1996\)/);
});

test("an unrestricted exact Archive Deep title returns only in-source comedy evidence", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask(
    "What is funniest in the Scream 7 Spoiler Review Party?",
  ));

  assert.equal(answer.status, "supported");
  assert.equal(answer.selectionPlan.source.sourceId, "WKs1uPGMQvw");
  assert.equal(answer.selectionPlan.source.matchMode, "exact");
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => result.sourceId === "WKs1uPGMQvw"));
  assert.ok(answer.results.every((result) => result.kind === "moment"));
  assert.ok(answer.results.every((result) => result.lane === "archive"));
  assert.equal(answer.context.resultAnchor.lane, "archive");
});

test("duplicate indexed titles and unknown speaker follow-ups fail closed", async () => {
  const engine = await createEngine();
  const collision = plain(engine.ask(
    "Tell me about We Watched A Movie Live Movie News and More",
  ));
  const orphan = plain(engine.ask("Who said that?"));

  assert.equal(collision.status, "insufficient-evidence");
  assert.equal(
    collision.selectionPlan.sourceTitleBoundary.reason,
    "duplicate-indexed-title",
  );
  assert.ok(collision.selectionPlan.sourceTitleBoundary.matches.length > 1);
  assert.deepEqual(collision.results, []);
  assert.match(collision.answer, /will not choose one arbitrarily/i);

  assert.equal(orphan.status, "speaker-unknown");
  assert.deepEqual(orphan.results, []);
  assert.match(orphan.answer, /cannot identify a host/i);
});

test("contextual speaker follow-ups retain the exact result and Archive Deep lane", async () => {
  const engine = await createEngine();
  const first = plain(engine.ask(
    "What is funniest in the Scream 7 Spoiler Review Party?",
  ));
  const followup = plain(engine.ask("Who said that?", first.context));

  assert.equal(followup.status, "speaker-unknown");
  assert.equal(followup.selectionPlan.mode, "exact");
  assert.equal(followup.results.length, 1);
  assert.equal(followup.results[0].key, first.results[0].key);
  assert.equal(followup.results[0].sourceId, "WKs1uPGMQvw");
  assert.equal(followup.results[0].lane, "archive");
  assert.equal(followup.context.resultAnchor.lane, "archive");
});

test("complete film aliases stay commentary-scoped unless source-title words remain", async () => {
  const engine = await createEngine();
  const film = plain(engine.ask("Tell me about Scream 6"));
  const source = plain(engine.ask(
    "What is funniest in the Scream VI Trailer Breakdown?",
  ));

  assert.equal(film.entityType, "film");
  assert.equal(film.results[0].sourceId, "ISDlaQ9DWSM");
  assert.equal(film.results[0].source, "commentary");
  assert.equal(film.selectionPlan, null);

  assert.equal(source.selectionPlan.source.sourceId, "3Ndidoo_s58");
  assert.equal(source.selectionPlan.source.matchMode, "exact");
  assert.ok(source.results.length > 0);
  assert.ok(source.results.every((result) => result.sourceId === "3Ndidoo_s58"));
});
