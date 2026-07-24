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

async function createEngines() {
  const sandbox = { window: {} };
  for (const file of sourceFiles) {
    runInNewContext(await readFile(new URL(file, demoRoot), "utf8"), sandbox, {
      filename: file,
    });
  }
  const { window } = sandbox;
  const inputs = [
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
    window.WWAM_CHARACTER_LORE,
  ];
  return {
    baseline: window.WWAMSearchEngine.create(...inputs),
    expanded: window.WWAMSearchEngine.create(
      ...inputs,
      window.WWAM_ARCHIVE_DEEP,
    ),
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Archive Deep Batch 01 contributes searchable topic and moment candidates", async () => {
  const { expanded } = await createEngines();

  const topic = plain(expanded.ask(
    "Where did Nostalgia come up in Archive Deep?",
  ));
  assert.equal(topic.entity, "Nostalgia");
  assert.ok(topic.results.length > 0);
  assert.ok(topic.results.every((result) => result.lane === "archive"));
  assert.ok(topic.results.every((result) => result.kind === "topic"));
  assert.ok(topic.results.every((result) => result.reviewStatus === "machine-candidate"));

  const moment = plain(expanded.ask(
    "What is funniest about an AI version of us in Archive Deep?",
  ));
  assert.equal(moment.intent, "comedy");
  assert.equal(moment.results[0].sourceId, "1j3F9vAWBo4");
  assert.equal(moment.results[0].at, 7492);
  assert.equal(moment.results[0].kind, "moment");
  assert.equal(moment.results[0].lane, "archive");
  assert.equal(moment.results[0].reviewStatus, "machine-candidate");
  assert.equal(moment.results[0].speakerStatus, "not-diarized");
  assert.equal(moment.results[0].originStatus, "not-inferred");
  assert.equal(moment.results[0].originInferred, false);
  assert.equal(moment.results[0].curatedRank, null);
  assert.equal(moment.results[0].laneLabel, "ARCHIVE DEEP · MACHINE CANDIDATE");
  assert.match(moment.results[0].label, /ARCHIVE DEEP MOMENT CANDIDATE/);
  assert.match(moment.results[0].evidenceLevel, /MACHINE-CANDIDATE/);
  assert.match(
    moment.results[0].evidenceWarnings.join(" "),
    /not curated or Canon evidence/i,
  );
});

test("restricted Archive Deep sources expose topic navigation and nothing richer", async () => {
  const { expanded } = await createEngines();
  const answer = plain(expanded.ask(
    "Where is Movie Theaters in the Scream 7 trailer reaction in Archive Deep?",
  ));
  const restrictedResults = answer.results.filter(
    (result) => result.sourceId === "fpNtQMexZiw",
  );

  assert.ok(restrictedResults.length > 0);
  assert.ok(restrictedResults.every((result) => result.kind === "topic"));
  assert.ok(restrictedResults.every((result) => result.excerpt === ""));
  assert.ok(restrictedResults.every(
    (result) => result.evidenceType === "caption-topic-navigation",
  ));
  assert.ok(restrictedResults.every(
    (result) => result.restrictedToTopicNavigation === true,
  ));
  assert.ok(restrictedResults.every(
    (result) => result.reviewStatus === "machine-candidate",
  ));
  assert.match(restrictedResults[0].label, /ARCHIVE TOPIC NAVIGATION/);
  assert.match(
    restrictedResults[0].evidenceWarnings.join(" "),
    /excerpts, moments, character signals, and heat claims are withheld/i,
  );
});

test("Archive Deep character signals remain machine candidates, not performances", async () => {
  const { expanded } = await createEngines();
  const answer = plain(expanded.ask(
    "Show Archive Deep Dr. Challis character signals",
  ));

  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => result.lane === "archive"));
  assert.ok(answer.results.every((result) => result.kind === "character"));
  assert.ok(answer.results.every(
    (result) => result.reviewStatus === "machine-candidate",
  ));
  assert.ok(answer.results.every((result) => result.speakerStatus === "not-diarized"));
  assert.ok(answer.results.every((result) => result.originStatus === "not-inferred"));
  assert.ok(answer.results.every(
    (result) => result.evidenceType === "caption-character-signal",
  ));
  assert.ok(answer.results.every(
    (result) => !/CURATED CHARACTER PERFORMANCE/.test(result.label),
  ));
});

test("Fresh and Popular selectors are unchanged when Archive Deep is supplied", async () => {
  const { baseline, expanded } = await createEngines();
  const queries = [
    "What is the most viewed livestream?",
    "What is the newest livestream?",
    "What is the most unhinged livestream?",
    "What is funniest in the most viewed livestream?",
  ];

  for (const query of queries) {
    const before = plain(baseline.ask(query));
    const after = plain(expanded.ask(query));
    assert.equal(after.results[0].sourceId, before.results[0].sourceId, query);
    assert.equal(after.results[0].lane, before.results[0].lane, query);
    assert.notEqual(after.results[0].lane, "archive", query);
    assert.deepEqual(after.selectionPlan, before.selectionPlan, query);
  }
});
