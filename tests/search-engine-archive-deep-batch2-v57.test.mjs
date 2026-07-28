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
  "archive-deep-batch4.js",
  "archive-deep-engine.js",
  "archive-deep-portfolio.js",
  "search-engine.js",
];

const truth = [
  ["What is funniest in Michael Myers VS Jason Voorhees Kill V Kill LIVE?", "CFUHyfcJDTg", 1866, "moment", 1],
  ["Where is The Conjuring in SCREAM 7 UPDATE LIVE?", "o4EMYqQ5DDU", 2645, "topic", 2],
  ["Where is Saw in We Watched A Movie LIVE 8/26 HALLOWEEN, ALIEN EARTH, SAW & More?", "Z7ArdfA054w", 5487, "topic", 3],
  ["What is funniest in JASON VOORHEES ROYAL RUMBLE LIVE?", "k698GIJe8EA", 8035, "moment", 4],
  ["Where is Hellraiser in HALLOWEEN Update Live New Footage WOLVERINE Game Trailer?", "4X8EFw7MCmw", 590, "topic", 5],
  ["What topics are in We Watched A Movie LIVE 2/28 I Halloween Script Read?", "KIGg_I72x_M", 2243, "topic", 6],
  ["Where are Scream mentions in SCREAM Update LIVE Huge News?", "o2O9T4nwVw4", 4635, "topic", 7],
  ["What is funniest in Emergency SCREAM 7 Livestream?", "qONN2sNoK2k", 1052, "moment", 8],
  ["Where is Friday the 13th in THE FINAL CHAPTER Watch Along?", "QxJyVaAgZ_Y", 3608, "topic", 9],
  ["What is funniest in Jason Voorhees Deaths Tier List Ranking LIVE?", "0svLtx3nZJM", 6190, "moment", 10],
  ["Show Archive Deep Dr Challis signals in Michael Myers VS Jason Voorhees Kill V Kill LIVE", "CFUHyfcJDTg", 1047, "character", 1],
  ["Show Archive Deep Corey Feldman signals in JASON VOORHEES ROYAL RUMBLE LIVE", "k698GIJe8EA", 9049, "character", 4],
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
  const inputs = [
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
      window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    window.WWAMArchiveDeepEngine,
  );
  return {
    window,
    baseline: window.WWAMSearchEngine.create(...inputs),
    expanded: window.WWAMSearchEngine.create(
      ...inputs,
      portfolio.getSearchPayload(),
    ),
    portfolio,
  };
}

test("Batch 02 has a frozen source-exact Ask truth set with no cross-source leakage", async () => {
  const { expanded } = await fixture();

  for (const [query, id, at, kind, localRank] of truth) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.selectionPlan.source.sourceId, id, query);
    assert.equal(answer.selectionPlan.source.archiveBatchId, "archive-deep-batch-02", query);
    assert.equal(answer.selectionPlan.source.archiveBatchSequence, 2, query);
    assert.equal(answer.selectionPlan.source.archiveBatchRank, localRank, query);
    assert.equal(answer.selectionPlan.source.archivePortfolioRank, localRank + 10, query);
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every((result) => result.sourceId === id), query);
    assert.equal(answer.results[0].at, at, query);
    assert.equal(answer.results[0].kind, kind, query);
    assert.equal(answer.results[0].lane, "archive", query);
    assert.equal(answer.results[0].archiveBatchId, "archive-deep-batch-02", query);
    assert.equal(answer.results[0].archiveBatchRank, localRank, query);
    assert.equal(answer.results[0].archivePortfolioRank, localRank + 10, query);
    assert.equal(answer.results[0].speaker, null, query);
    assert.equal(answer.results[0].reviewStatus, "machine-candidate", query);
    assert.equal(answer.results[0].curatedRank, null, query);
  }
});

test("topic-only Batch 02 sources expose navigation and never caption excerpts or moments", async () => {
  const { expanded } = await fixture();
  const queries = truth.filter((row) =>
    ["4X8EFw7MCmw", "KIGg_I72x_M", "QxJyVaAgZ_Y"].includes(row[1])
  );

  for (const [query, id] of queries) {
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

test("visual-ranking questions refuse outcomes while caption topic and comedy routes remain usable", async () => {
  const { expanded } = await fixture();
  const refusals = [
    ["Which kill won in Michael Myers VS Jason Voorhees Kill V Kill LIVE?", "CFUHyfcJDTg"],
    ["What death ranked best in Jason Voorhees Deaths Tier List Ranking LIVE?", "0svLtx3nZJM"],
  ];

  for (const [query, id] of refusals) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "visual-context-unverified", query);
    assert.equal(answer.selectionPlan.source.sourceId, id, query);
    assert.equal(answer.selectionPlan.source.rightsMode, "visual-context-unverified", query);
    assert.equal(answer.selectionPlan.source.visualContextVerified, false, query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /cannot determine which on-screen kill or death won the ranking/i);
  }

  const comedy = plain(expanded.ask(
    "What is funniest in JASON VOORHEES ROYAL RUMBLE LIVE?",
  ));
  assert.equal(comedy.results[0].sourceId, "k698GIJe8EA");
  assert.equal(comedy.results[0].at, 8035);
  assert.match(comedy.results[0].evidenceWarnings.join(" "), /visual-ranking outcome is unverified/i);
});

test("Batch 02 grammar is explicit and a wrong sequel number fails closed", async () => {
  const { window, expanded } = await fixture();
  for (const query of [
    "Show Batch02 archive streams",
    "Show batch 2 archive streams",
    "Show the second Archive Deep batch",
    "List Archive Deep Batch 02 sources",
  ]) {
    const intent = plain(window.WWAMSearchEngine.parseIntent(query));
    assert.equal(intent.archiveRequested, true, query);
    assert.equal(intent.archiveBatchSequence, 2, query);
  }
  assert.equal(
    plain(window.WWAMSearchEngine.parseIntent("List archive streams")).archiveRequested,
    true,
  );

  const wrong = plain(expanded.ask(
    "What is funniest in Emergency SCREAM 8 Livestream?",
  ));
  assert.equal(wrong.status, "insufficient-evidence");
  assert.equal(wrong.selectionPlan.sourceTitleBoundary.reason, "unresolved-numbered-title");
  assert.deepEqual(wrong.results, []);
});

test("Fresh and Popular source selectors remain unchanged with the 40-source portfolio", async () => {
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
