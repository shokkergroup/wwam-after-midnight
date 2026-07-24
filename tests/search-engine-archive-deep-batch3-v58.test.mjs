import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const demoRoot = new URL("../public/demo/", import.meta.url);
const files = [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "curation.js",
  "character-lore.js",
  "archive-deep-distill.js",
  "archive-deep-batch2.js",
  "archive-deep-batch3.js",
  "archive-deep-engine.js",
  "archive-deep-portfolio.js",
  "search-engine.js",
];

const truth = [
  ["What is funniest in Halloween TV Series Talk LIVE! 3/11?", "M9_5cX8xowI", 4465, "moment", 1],
  ["Where is Texas Chainsaw in TEXAS CHAINSAW MASSACRE Posters Ranked LIVE!?", "tUJviU09fWM", 4846, "topic", 2],
  ["What is funniest in We Watched A Movie LIVE Movie News Saw Poster Rankings and Hanging Out?", "J5uGidPT9Jc", 14249, "moment", 3],
  ["Where are Slashers in FREDDY KRUEGER Death Scenes Tier List Ranking!?", "nv99WEtXGvE", 1933, "topic", 4],
  ["What is funniest in Halloween Movie Talk on Friday the 13th!?", "wjJy46oVmow", 1939, "moment", 5],
  ["Where is The Exorcist in Movie News Live SAW X Trailer HALLOWEEN The Exorcist Believer!?", "yMAvXBYAxko", 7405, "topic", 6],
  ["Where is Dr Loomis in Batch03 HALLOWEEN Q A LIVESTREAM?", "fUCQoxTwKqo", 3106, "character", 7],
  ["What is funniest in We Watched A Movie Live Movies About ALIENS Tier List Movie News!?", "3UCnMrLMXbI", 6382, "moment", 8],
  ["What is funniest in SCREAM VI Spoiler Party Live!?", "lH0EXRN4xdw", 9057, "moment", 9],
  ["What is funniest in SCREAM VI Update EVERY GHOSTFACE RANKED?", "xBOTTKQ9pxU", 2570, "moment", 10],
];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

async function fixture() {
  const sandbox = { window: {} };
  for (const file of files) {
    runInNewContext(await readFile(new URL(file, demoRoot), "utf8"), sandbox, {
      filename: file,
    });
  }
  const { window } = sandbox;
  const base = [
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
    window.WWAM_CHARACTER_LORE,
  ];
  const portfolio = window.WWAMArchiveDeepPortfolio.create(
    [
      window.WWAM_ARCHIVE_DEEP,
      window.WWAM_ARCHIVE_DEEP_BATCH2,
      window.WWAM_ARCHIVE_DEEP_BATCH3,
    ],
    window.WWAMArchiveDeepEngine,
  );
  return {
    window,
    baseline: window.WWAMSearchEngine.create(...base),
    expanded: window.WWAMSearchEngine.create(
      ...base,
      portfolio.getSearchPayload(),
    ),
  };
}

test("Batch 03 has a frozen source-exact Ask truth set with no cross-source leakage", async () => {
  const { expanded } = await fixture();
  for (const [query, id, at, kind, localRank] of truth) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.selectionPlan.source.sourceId, id, query);
    assert.equal(answer.selectionPlan.source.archiveBatchId, "archive-deep-batch-03", query);
    assert.equal(answer.selectionPlan.source.archiveBatchSequence, 3, query);
    assert.equal(answer.selectionPlan.source.archiveBatchRank, localRank, query);
    assert.equal(answer.selectionPlan.source.archivePortfolioRank, localRank + 20, query);
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every((result) => result.sourceId === id), query);
    assert.equal(answer.results[0].at, at, query);
    assert.equal(answer.results[0].kind, kind, query);
    assert.equal(answer.results[0].lane, "archive", query);
    assert.equal(answer.results[0].archiveBatchId, "archive-deep-batch-03", query);
    assert.equal(answer.results[0].archiveBatchSequence, 3, query);
    assert.equal(answer.results[0].archiveBatchRank, localRank, query);
    assert.equal(answer.results[0].archivePortfolioRank, localRank + 20, query);
    assert.equal(answer.results[0].speaker, null, query);
    assert.equal(answer.results[0].reviewStatus, "machine-candidate", query);
    assert.equal(answer.results[0].curatedRank, null, query);
  }
});

test("Batch 03 topic-only firewalls expose navigation and no excerpt or moment payload", async () => {
  const { expanded } = await fixture();
  for (const [query, id] of truth.filter((row) =>
    ["nv99WEtXGvE", "yMAvXBYAxko"].includes(row[1])
  )) {
    const answer = plain(expanded.ask(query));
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every((result) => result.sourceId === id), query);
    assert.ok(answer.results.every((result) => result.kind === "topic"), query);
    assert.ok(answer.results.every((result) => result.excerpt === ""), query);
    assert.ok(answer.results.every(
      (result) => result.evidenceType === "caption-topic-navigation",
    ), query);
    assert.ok(answer.results.every(
      (result) => result.restrictedToTopicNavigation === true,
    ), query);
  }
});

test("visual and source-audio locks refuse outcome claims while timed navigation remains usable", async () => {
  const { expanded } = await fixture();
  const refusals = [
    ["What death ranked best in TEXAS CHAINSAW MASSACRE Posters Ranked LIVE?", "tUJviU09fWM"],
    ["What death ranked best in We Watched A Movie LIVE Movie News Saw Poster Rankings and Hanging Out?", "J5uGidPT9Jc"],
    ["What death ranked best in We Watched A Movie Live Movies About ALIENS Tier List Movie News?", "3UCnMrLMXbI"],
    ["What death ranked best in Archive Deep SCREAM VI Update EVERY GHOSTFACE RANKED?", "xBOTTKQ9pxU"],
    ["Which death won in FREDDY KRUEGER Death Scenes Tier List Ranking?", "nv99WEtXGvE"],
  ];
  for (const [query, id] of refusals) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "visual-context-unverified", query);
    assert.equal(answer.selectionPlan.source.sourceId, id, query);
    assert.equal(answer.selectionPlan.source.visualContextVerified, false, query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /cannot verify which on-screen kill or death won/i);
  }

  const timed = plain(expanded.ask(truth[0][0]));
  assert.equal(timed.results[0].sourceId, "M9_5cX8xowI");
  assert.equal(timed.results[0].at, 4465);
  assert.ok(timed.results[0].at > 0);
});

test("Batch03 and third-batch grammar route only to Batch 03", async () => {
  const { window, expanded } = await fixture();
  for (const query of [
    "Show Batch03 archive streams",
    "Show batch 3 archive streams",
    "Show the third Archive Deep batch",
    "List Archive Deep Batch 03 sources",
  ]) {
    const intent = plain(window.WWAMSearchEngine.parseIntent(query));
    assert.equal(intent.archiveRequested, true, query);
    assert.equal(intent.archiveBatchSequence, 3, query);
  }
  for (const query of [
    "Show Batch03 archive streams",
    "Show the third Archive Deep batch",
  ]) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every(
      (result) => result.archiveBatchSequence === 3,
    ), query);
  }
});

test("a wrong SCREAM sequel boundary fails closed and timed Batch03 receipts beat Atlas metadata fallback", async () => {
  const { expanded } = await fixture();
  const wrong = plain(expanded.ask(
    "What is funniest in SCREAM VII Update EVERY GHOSTFACE RANKED?",
  ));
  assert.equal(wrong.status, "insufficient-evidence");
  assert.equal(wrong.selectionPlan.sourceTitleBoundary.reason, "unresolved-numbered-title");
  assert.deepEqual(wrong.results, []);

  const app = await readFile(new URL("app.js", demoRoot), "utf8");
  assert.match(
    app,
    /var timedDeepAnswer = results\.some\(function \(result\) \{[\s\S]{0,320}result\.lane === "archive"[\s\S]{0,220}Number\.isFinite\(Number\(result\.at\)\) && Number\(result\.at\) >= 0/,
  );
  assert.match(app, /var archiveFallback = timedDeepAnswer \? "" : archiveAskMarkup\(query\)/);
});

test("Fresh and Popular selectors remain unchanged with the 30-source portfolio", async () => {
  const { baseline, expanded } = await fixture();
  for (const query of [
    "What is the most viewed livestream?",
    "What is the newest livestream?",
    "What is the most unhinged livestream?",
    "What is funniest in the most viewed livestream?",
  ]) {
    const before = plain(baseline.ask(query));
    const after = plain(expanded.ask(query));
    assert.equal(after.results[0].sourceId, before.results[0].sourceId, query);
    assert.equal(after.results[0].lane, before.results[0].lane, query);
    assert.deepEqual(after.selectionPlan, before.selectionPlan, query);
    assert.notEqual(after.results[0].lane, "archive", query);
  }
});
