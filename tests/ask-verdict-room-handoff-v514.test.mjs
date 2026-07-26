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

test("explicit human-review requests hand off to one zero-verdict local room", async () => {
  const engine = await createEngine();
  const cases = [
    ["Open the Verdict Room", "global", null],
    [
      "Review their Halloween Ends prediction",
      "subject",
      "film:halloween-ends",
    ],
    ["Adjudicate the Scream VI forecast", "subject", "film:scream-vi"],
    [
      "Put the Scream 7 prediction through human review",
      "subject",
      "film:scream-7",
    ],
    [
      "Open the human verdict ledger for Halloween",
      "subject",
      "franchise:halloween",
    ],
    ["Show me the verdict ledger", "global", null],
    ["Which verdicts have been reviewed?", "global", null],
    ["Show reviewed local verdicts", "global", null],
    ["Which dockets were adjudicated?", "global", null],
    ["Open the Verdict Room for Scream 3", "global", null],
  ];

  for (const [query, mode, subjectId] of cases) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.status, "adjudication-handoff", query);
    assert.equal(answer.intent, "human-adjudication", query);
    assert.equal(answer.questionType, "human-review", query);
    assert.equal(answer.metric, "human-adjudication-ledger", query);
    assert.equal(answer.queryPlan.adjudicationRequested, true, query);
    assert.equal(answer.queryPlan.outputShape, "adjudication-handoff", query);
    assert.equal(answer.queryPlan.longitudinalHandoff, null, query);
    assert.equal(answer.adjudicationHandoff.id, "verdict-room", query);
    assert.equal(
      answer.adjudicationHandoff.surface,
      "human-adjudication-ledger",
      query,
    );
    assert.equal(answer.adjudicationHandoff.href, "#verdict-room", query);
    assert.equal(answer.adjudicationHandoff.intent, "human-adjudication", query);
    assert.equal(answer.adjudicationHandoff.mode, mode, query);
    assert.equal(answer.adjudicationHandoff.subjectId ?? null, subjectId, query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /nothing has been adjudicated here/i, query);
    assert.match(
      answer.limitations.join(" "),
      /caller attestation, not verified identity/i,
      query,
    );
    assert.deepEqual(
      answer.selectionPlan.adjudicationHandoff,
      answer.adjudicationHandoff,
      query,
    );
    assert.deepEqual(answer.recommendedSurface, answer.adjudicationHandoff, query);
  }
});

test("ordinary prediction and outcome questions keep the V5.13 docket route", async () => {
  const engine = await createEngine();
  const queries = [
    "Which predictions came true?",
    "What did they predict about Halloween Ends?",
    "Did their Scream 7 prediction come true?",
    "Show me the prediction ledger",
    "Which takes aged badly?",
  ];

  for (const query of queries) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.status, "longitudinal-handoff", query);
    assert.equal(answer.intent, "longitudinal", query);
    assert.equal(answer.questionType, "prediction-outcome", query);
    assert.equal(answer.queryPlan.adjudicationRequested, false, query);
    assert.equal(answer.queryPlan.adjudicationHandoff, null, query);
    assert.equal(answer.longitudinalHandoff.href, "#tape-keeps-score", query);
  }
});

test("review and verdict words without an explicit docket action do not overfire", async () => {
  const engine = await createEngine();
  const queries = [
    "What was their review of Halloween Ends?",
    "Can you review the movie Scream VI?",
    "Review the Scream VI commentary",
    "What verdict did they give Halloween Ends?",
    "Who won the court verdict in Scream VI?",
    "Show me reviewed movies",
    "Open the Ask review ledger",
    "Which movie reviews have been published?",
    "Show reviewed Halloween movies",
    "Which courtroom verdicts were overturned in Scream VI?",
  ];

  for (const query of queries) {
    const answer = plain(engine.ask(query));
    assert.notEqual(answer.status, "adjudication-handoff", query);
    assert.equal(answer.queryPlan.adjudicationRequested, false, query);
    assert.equal(answer.queryPlan.adjudicationHandoff, null, query);
  }
});

test("speaker, source-audio, and visual firewalls outrank both handoffs", async () => {
  const engine = await createEngine();
  const speaker = plain(engine.ask(
    "Who should adjudicate their Halloween Ends prediction in the Verdict Room?",
  ));
  const namedSpeaker = plain(engine.ask(
    "Take Mike's Halloween Ends prediction to the Verdict Room",
  ));
  const sourceAudio = plain(engine.ask(
    "Put their Scream 7 trailer reaction prediction through human review",
  ));
  const visual = plain(engine.ask(
    "Adjudicate their prediction about which kill won in the Scream 7 trailer reaction",
  ));

  assert.equal(speaker.queryPlan.adjudicationRequested, true);
  assert.equal(speaker.status, "speaker-unknown");

  for (const answer of [speaker, namedSpeaker, sourceAudio, visual]) {
    assert.equal(answer.queryPlan.adjudicationRequested, true);
    assert.notEqual(answer.status, "adjudication-handoff");
    assert.notEqual(answer.status, "longitudinal-handoff");
    assert.equal(answer.queryPlan.outputShape, "single");
    assert.equal(answer.queryPlan.adjudicationHandoff, null);
    assert.equal(answer.queryPlan.longitudinalHandoff, null);
  }
});
