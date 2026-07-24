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

test("prediction/outcome questions use one typed docket handoff without a verdict", async () => {
  const engine = await createEngine();
  const cases = [
    ["Which predictions came true?", "global", null],
    ["what did they predict about Halloween Ends?", "subject", "film:halloween-ends"],
    ["did the Scream 7 commentary promise happen?", "subject", "film:scream-7"],
    ["which takes aged badly?", "global", null],
    ["Show me their called-it moments", "global", null],
    ["List forecast outcomes", "global", null],
  ];

  for (const [query, mode, subjectId] of cases) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.status, "longitudinal-handoff", query);
    assert.equal(answer.intent, "longitudinal", query);
    assert.equal(answer.questionType, "prediction-outcome", query);
    assert.equal(answer.queryPlan.longitudinalRequested, true, query);
    assert.equal(answer.queryPlan.outputShape, "longitudinal-handoff", query);
    assert.equal(answer.longitudinalHandoff.id, "tape-keeps-score", query);
    assert.equal(answer.longitudinalHandoff.surface, "longitudinal-docket", query);
    assert.equal(answer.longitudinalHandoff.href, "#tape-keeps-score", query);
    assert.equal(answer.longitudinalHandoff.mode, mode, query);
    assert.equal(answer.longitudinalHandoff.subjectId ?? null, subjectId, query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /has not independently proved/i, query);
    assert.deepEqual(
      answer.selectionPlan.longitudinalHandoff,
      answer.longitudinalHandoff,
      query,
    );
  }
});

test("only exact docket subjects are passed; unsupported entities stay global", async () => {
  const engine = await createEngine();
  const halloween = plain(engine.ask("What did they predict about Halloween?"));
  const halloweenKills = plain(
    engine.ask("Which Halloween Kills predictions came true?"),
  );
  const screamSix = plain(engine.ask("Which Scream VI predictions came true?"));
  const screamThree = plain(engine.ask("Which Scream 3 predictions came true?"));

  assert.equal(halloween.longitudinalHandoff.subjectId, "franchise:halloween");
  assert.equal(halloweenKills.status, "longitudinal-handoff");
  assert.equal(
    halloweenKills.longitudinalHandoff.subjectId,
    "franchise:halloween",
  );
  assert.notEqual(
    halloweenKills.longitudinalHandoff.subjectId,
    "film:halloween-kills",
  );
  assert.equal(screamSix.longitudinalHandoff.subjectId, "film:scream-vi");
  assert.equal(screamThree.status, "longitudinal-handoff");
  assert.equal(screamThree.longitudinalHandoff.mode, "global");
  assert.equal("subjectId" in screamThree.longitudinalHandoff, false);
  assert.match(screamThree.limitations.join(" "), /opens globally/i);
});

test("plot, theory, title, and future-prediction language does not overfire", async () => {
  const engine = await createEngine();
  const negatives = [
    "What happens in The Prediction scene in Scream 3?",
    "What theory did they discuss in Scream VI?",
    "What if Stu comes back in Scream 7?",
    "Show me the THEORY BOARD moments",
    "Did they talk about the movie Premonition?",
    "What did Ghostface predict in the movie?",
    "Which character predicted the ending in Scream 3?",
    "I predict Halloween Ends is their funniest commentary",
    "Can you predict what they will say about Scream 8?",
    "What did they say about the forecast in The Fog?",
    "What was the outcome of Halloween Ends?",
    "Did they discuss predictions about Scream VI?",
  ];

  for (const query of negatives) {
    const answer = plain(engine.ask(query));
    assert.notEqual(answer.status, "longitudinal-handoff", query);
    assert.equal(answer.queryPlan.longitudinalRequested, false, query);
    assert.equal(answer.queryPlan.longitudinalHandoff, null, query);
  }
});

test("speaker, source-audio, and visual firewalls outrank a docket handoff", async () => {
  const engine = await createEngine();
  const speaker = plain(engine.ask("Who called it about Halloween Ends?"));
  const sourceAudio = plain(engine.ask(
    "Did their Scream 7 trailer reaction promise come true?",
  ));
  const visual = plain(engine.ask(
    "Did their prediction about which kill won in the Scream 7 trailer reaction come true?",
  ));

  assert.equal(speaker.queryPlan.longitudinalRequested, true);
  assert.equal(speaker.status, "speaker-unknown");
  assert.equal(speaker.queryPlan.outputShape, "single");
  assert.equal(speaker.queryPlan.longitudinalHandoff, null);

  for (const answer of [sourceAudio, visual]) {
    assert.equal(answer.queryPlan.longitudinalRequested, true);
    assert.notEqual(answer.status, "longitudinal-handoff");
    assert.equal(answer.queryPlan.outputShape, "single");
    assert.equal(answer.queryPlan.longitudinalHandoff, null);
  }
});
