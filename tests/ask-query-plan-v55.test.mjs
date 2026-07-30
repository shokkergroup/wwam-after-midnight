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
  const sandbox = { window: {}, setTimeout };
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
  );
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Query Plan V1 separates relative-time controls from the latest stream subject", async () => {
  const engine = await createEngine();

  for (const query of [
    "What did they talk about last night?",
    "What did they talk about yesterday?",
  ]) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.queryPlan.version, "query-plan/v1", query);
    assert.equal(answer.queryPlan.outputShape, "single", query);
    assert.equal(answer.queryPlan.controls.relativeTime, "latest-indexed-stream", query);
    assert.equal(answer.queryPlan.controls.source, "livestream", query);
    assert.equal(answer.queryPlan.controls.selector, "date", query);
    assert.deepEqual(answer.queryPlan.subjectTerms, [], query);
    assert.equal(answer.selectionPlan.source.sourceId, "LV2rmwEA0w4", query);
    assert.equal(answer.selectionPlan.source.matchMode, "latest-indexed-livestream", query);
    assert.ok(answer.results.length > 1, query);
    assert.ok(answer.results.every((result) => (
      result.sourceId === "LV2rmwEA0w4" && result.kind === "topic"
    )), query);
  }
});

test("collection counts and lists use unique source records before the display cap", async () => {
  const engine = await createEngine();
  const halloween = plain(engine.ask("How many Halloween commentaries are there?"));
  const friday = plain(engine.ask("How many Friday the 13th commentaries have they done?"));
  const list = plain(engine.ask("List every Halloween commentary"));

  assert.equal(halloween.queryPlan.outputShape, "source-count");
  assert.equal(halloween.collection.total, 13);
  assert.equal(halloween.collection.displayed, 7);
  assert.equal(halloween.selectionPlan.collection.total, 13);
  assert.ok(halloween.results.every((result) => result.kind === "tape"));
  assert.match(halloween.answer, /13 different commentaries/i);

  assert.equal(friday.collection.total, 12);
  assert.match(friday.answer, /12 different commentaries/i);

  assert.equal(list.queryPlan.outputShape, "source-list");
  assert.equal(list.collection.total, 13);
  assert.equal(list.results.length, 13);
  assert.equal(new Set(list.results.map((result) => result.sourceId)).size, 13);
  assert.ok(list.results.every((result) => result.kind === "tape"));
});

test("year-scoped source rankings filter before applying view and date selectors", async () => {
  const engine = await createEngine();
  const mostViewed2018 = plain(engine.ask(
    "What was the most viewed commentary in 2018?",
  ));
  const newest2020 = plain(engine.ask("What was the newest commentary in 2020?"));
  const leastViewedLive = plain(engine.ask("Which was the least viewed livestream?"));

  assert.equal(mostViewed2018.queryPlan.outputShape, "source-ranking");
  assert.equal(mostViewed2018.queryPlan.controls.yearFilter, true);
  assert.equal(mostViewed2018.collection.total, 8);
  assert.equal(mostViewed2018.results[0].sourceId, "Q6SN-Om1gIo");
  assert.equal(mostViewed2018.results[0].views, 54551);
  assert.ok(mostViewed2018.results.every((result) => result.date.startsWith("2018")));

  assert.equal(newest2020.collection.total, 9);
  assert.equal(newest2020.results[0].sourceId, "qTQdWKcwn4A");
  assert.equal(newest2020.results[0].date, "2020-11-01");
  assert.ok(newest2020.results.every((result) => result.date.startsWith("2020")));

  assert.equal(leastViewedLive.queryPlan.controls.direction, "ascending");
  assert.equal(leastViewedLive.results[0].sourceId, "LV2rmwEA0w4");
  assert.equal(leastViewedLive.results[0].views, 5067);
  assert.match(leastViewedLive.answer, /least-viewed livestream/i);
});

test("least-favorite language is negative and still requires target-proximate evidence", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask(
    "What is their least favorite Friday the 13th movie?",
  ));

  assert.equal(answer.intent, "negative");
  assert.equal(answer.results[0].sourceId, "G2m0effDrwI");
  assert.ok(answer.results.every((result) => (
    result.opinionEvidence?.negative?.pairs?.length > 0
  )));
  assert.ok(answer.results.every((result) => result.category !== "LOVE LETTER"));
});

test("franchise shorthand canonicalizes local sequel numbers without damaging named bits", async () => {
  const engine = await createEngine();
  const cases = [
    ["Play the RZ Halloween II commentary", "AzrcgoyE7C4"],
    ["Halloween H2O commentary", "Q6SN-Om1gIo"],
    ["Freddy versus Jason commentary", "vN0kpXks-Lk"],
    ["Tell me about Scream seven", "WKs1uPGMQvw"],
  ];

  for (const [query, sourceId] of cases) {
    const answer = plain(engine.ask(query));
    assert.equal(answer.results[0]?.sourceId, sourceId, query);
  }

  const filmYear = plain(engine.ask("Tell me about Halloween 1978"));
  assert.equal(filmYear.queryPlan.controls.yearFilter, false);
  assert.equal(filmYear.results[0].sourceId, "6VXSBDZ-3WE");

  const namedBit = plain(engine.ask("Find the Three-Penis Rebot."));
  assert.equal(namedBit.entity, "THE THREE-PENIS REBOOT");
  assert.equal(namedBit.results[0].sourceId, "ag3axSC9BpU");
});

test("character roster, profiles, curated candidates, and broad mentions remain distinct", async () => {
  const engine = await createEngine();
  const roster = plain(engine.ask("What are their recurring characters?"));
  const profile = plain(engine.ask("What are the recurring Corey Feldman jokes?"));
  const curated = plain(engine.ask("How many verified Dr. Loomis clips are there?"));
  const plainClips = plain(engine.ask("How many Dr. Loomis clips are there?"));
  const howOften = plain(engine.ask("How often do they do Dr. Loomis?"));
  const mentions = plain(engine.ask("How many times do captions mention Dr. Loomis?"));

  assert.equal(roster.queryPlan.outputShape, "character-roster");
  assert.equal(roster.collection.total, 4);
  assert.deepEqual(
    roster.results.map((result) => result.rosterProfile.name),
    ["Dr. Loomis", "Dr. Challis", "Slenderman", "Corey Feldman"],
  );
  assert.ok(roster.results.every((result) => (
    result.kind === "character-performance" &&
    result.speaker === null
  )));
  assert.doesNotMatch(roster.answer, /Mark Wahlberg|Marky Mark/i);

  assert.equal(profile.queryPlan.outputShape, "character-profile");
  assert.match(profile.answer, /Wolf Pack/i);
  assert.match(profile.answer, /real source clips; any generated character reply is clearly labeled as a fan riff/i);

  for (const answer of [curated, plainClips, howOften]) {
    assert.equal(answer.queryPlan.outputShape, "character-soundbyte-count");
    assert.equal(answer.collection.total, 9);
    assert.equal(answer.collection.unit, "curated performance candidates");
    assert.equal(answer.collection.authenticatedEditorVerified, 0);
    assert.match(
      answer.answer,
      /legacy human-curated or editorially screened direct-address timestamps.*does not guess which host is speaking/i,
    );
    assert.ok(answer.results.every((result) => result.kind === "character-performance"));
  }

  assert.equal(mentions.collection.total, 4183);
  assert.equal(mentions.collection.sourceTotal, 461);
  assert.match(mentions.answer, /mixes casual discussion, jokes and possible impressions/i);
});

test("WWAM Up In Ya top-N follows all 25 curated receipt keys exactly", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask("Show me the top 5 WWAM Up In Ya soundbytes"));

  assert.equal(answer.queryPlan.outputShape, "curated-soundbytes");
  assert.equal(answer.queryPlan.controls.requestedLimit, 5);
  assert.equal(answer.collection.total, 25);
  assert.equal(answer.results.length, 5);
  assert.deepEqual(answer.results.map((result) => result.curatedRank), [1, 2, 3, 4, 5]);
  assert.deepEqual(
    [answer.results[0].sourceId, answer.results[0].at],
    ["4UokRLETypU", 809],
  );
});

test("replay, another, previous, and named-before navigation expose their anchor mode", async () => {
  const engine = await createEngine();
  const burp = plain(engine.ask("Where is The Burp Defense?"));
  const replay = plain(engine.ask("Play it again", burp.context));
  const another = plain(engine.ask("Give me another one", burp.context));
  const previous = plain(engine.ask("What about before that?", burp.context));
  const namedPrevious = plain(engine.ask("What happened before The Burp Defense?"));

  assert.equal(replay.selectionPlan.mode, "exact");
  assert.deepEqual(
    [replay.results[0].sourceId, replay.results[0].at],
    ["BIbyzMlstmM", 1528],
  );

  assert.equal(another.selectionPlan.mode, "similar");
  assert.equal(another.results[0].sourceId, "BIbyzMlstmM");
  assert.equal(another.results[0].at, 2373);
  assert.notEqual(another.results[0].key, burp.results[0].key);

  for (const answer of [previous, namedPrevious]) {
    assert.equal(answer.selectionPlan.mode, "previous");
    assert.deepEqual(
      [answer.results[0].sourceId, answer.results[0].at],
      ["BIbyzMlstmM", 1090],
    );
  }
  assert.equal(namedPrevious.selectionPlan.resolvedFrom, "named-result");
});

test("global deranged superlatives fail closed into the separate ranking surface", async () => {
  const engine = await createEngine();
  const answer = plain(engine.ask(
    "What is the most deranged thing they ever said?",
  ));

  assert.equal(answer.status, "surface-handoff");
  assert.equal(answer.queryPlan.outputShape, "surface-handoff");
  assert.equal(answer.surfaceHandoff.id, "memorability-candidate-index-v2.1");
  assert.deepEqual(answer.results, []);
  assert.match(answer.answer, /will not invent a separate #1/i);
});

test("new planning routes leave exact-title, speaker, and source-audio firewalls closed", async () => {
  const engine = await createEngine();
  const restricted = plain(engine.ask(
    "What's the funniest thing in the Scream 7 trailer reaction?",
  ));
  const speaker = plain(engine.ask("Who said that?"));

  assert.equal(restricted.status, "topic-only-boundary");
  assert.equal(restricted.selectionPlan.source.sourceId, "fpNtQMexZiw");
  assert.deepEqual(restricted.results, []);
  assert.match(restricted.answer, /won't swap in a different franchise video/i);

  assert.equal(speaker.status, "speaker-unknown");
  assert.deepEqual(speaker.results, []);
  assert.match(speaker.answer, /auto-captions don't reliably say who is speaking/i);
});
