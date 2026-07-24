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
  [
    "What is funniest in The Future of the HALLOWEEN Franchise - Live!?",
    "2FlxuJxv81s",
    2403,
    "moment",
    1,
  ],
  [
    "Where is Halloween in HALLOWEEN ENDS FINAL TRAILER Reaction + Breakdown?",
    "MSVltTVeypc",
    1181,
    "topic",
    2,
  ],
  [
    "What is funniest in CINEMACON Warner Bros Panel Reactions LIVE! (Superman, The Conjuring 4 & More)?",
    "Qb2rDe-kJkI",
    2703,
    "moment",
    3,
  ],
  [
    "What is funniest in SCREAM Movies + TV + Ghostface Tier List LIVE!?",
    "3Lu0beSDxcQ",
    5536,
    "moment",
    4,
  ],
  [
    "Where is Predator in PREDATOR BADLANDS Trailer Reaction & Breakdown LIVE!?",
    "21hL29hicoU",
    1354,
    "topic",
    5,
  ],
  [
    "What is funniest in We Watched A Movie LIVE (HELLRAISER REVIVAL Breakdown, Fantastic Four Reactions & More)?",
    "HLDAxs4_3U4",
    1234,
    "moment",
    6,
  ],
  [
    "Where is Hellraiser in We Watched A Movie Live! HELLRAISER Game Trailer, Movie News, and more!?",
    "34BwSiucNEI",
    2790,
    "topic",
    7,
  ],
  [
    "What is funniest in Halloween Ends Q & A Plus Whatever! Live!?",
    "ETuRUYiQEBM",
    10288,
    "moment",
    8,
  ],
  [
    "What is funniest in ALIEN: EARTH After Party Hangout?",
    "5k6I18ZekPQ",
    4933,
    "moment",
    9,
  ],
  [
    "What is funniest in Rob Zombie's HALLOWEEN Character Tier List LIVE!?",
    "o0tcJcJk6MY",
    1372,
    "moment",
    10,
  ],
];

const restricted = new Map([
  ["MSVltTVeypc", "trailer-audio-boundary-unverified"],
  ["21hL29hicoU", "trailer-audio-boundary-unverified"],
  ["34BwSiucNEI", "trailer-audio-boundary-unverified"],
]);

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
      window.WWAM_ARCHIVE_DEEP_BATCH4,
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

test("Batch 04 grammar is explicit without consuming sequel numbers", async () => {
  const { window, expanded } = await fixture();
  const fourthBatchQueries = [
    "Show Batch 04 archive streams",
    "Show batch 4 archive streams",
    "Show Batch04 archive streams",
    "Show the fourth batch",
    "Show the fourth Archive Deep batch",
    "List Archive Deep Batch 04 sources",
  ];

  for (const query of fourthBatchQueries) {
    const intent = plain(window.WWAMSearchEngine.parseIntent(query));
    assert.equal(intent.archiveRequested, true, query);
    assert.equal(intent.archiveBatchSequence, 4, query);
  }

  for (const [query, sequence] of [
    ["Show Batch 01 archive streams", 1],
    ["Show Batch 02 archive streams", 2],
    ["Show Batch 03 archive streams", 3],
    ["Show Batch 04 archive streams", 4],
  ]) {
    assert.equal(
      plain(window.WWAMSearchEngine.parseIntent(query)).archiveBatchSequence,
      sequence,
      query,
    );
  }

  for (const query of [
    "Show Batch 04 archive streams",
    "Show the fourth batch",
  ]) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every(
      (result) => result.archiveBatchSequence === 4,
    ), query);
  }

  const sequel = plain(window.WWAMSearchEngine.parseIntent(
    "What is funniest in Halloween 4?",
  ));
  assert.equal(sequel.archiveRequested, false);
  assert.equal(sequel.archiveBatchSequence, null);
  assert.equal(
    plain(window.WWAMSearchEngine.parseIntent(
      "Show nonexistent Batch 40 archive streams",
    )).archiveBatchSequence,
    null,
  );

  const wrongTitleNumber = plain(expanded.ask(
    "What is funniest in SCREAM 5 Movies + TV + Ghostface Tier List LIVE!?",
  ));
  assert.equal(wrongTitleNumber.status, "insufficient-evidence");
  assert.deepEqual(wrongTitleNumber.results, []);
});

test("all ten frozen Batch 04 titles route only inside their exact source", async () => {
  const { expanded } = await fixture();

  for (const [query, id, at, kind, localRank] of truth) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.selectionPlan.source.sourceId, id, query);
    assert.equal(answer.selectionPlan.source.matchMode, "exact", query);
    assert.equal(
      answer.selectionPlan.source.archiveBatchId,
      "archive-deep-batch-04",
      query,
    );
    assert.equal(answer.selectionPlan.source.archiveBatchSequence, 4, query);
    assert.equal(answer.selectionPlan.source.archiveBatchRank, localRank, query);
    assert.equal(
      answer.selectionPlan.source.archivePortfolioRank,
      localRank + 30,
      query,
    );
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every((result) => result.sourceId === id), query);
    assert.equal(answer.results[0].at, at, query);
    assert.equal(answer.results[0].kind, kind, query);
    assert.equal(answer.results[0].lane, "archive", query);
    assert.equal(answer.results[0].archiveBatchId, "archive-deep-batch-04", query);
    assert.equal(answer.results[0].archiveBatchSequence, 4, query);
    assert.equal(answer.results[0].archiveBatchRank, localRank, query);
    assert.equal(answer.results[0].archivePortfolioRank, localRank + 30, query);
    assert.equal(answer.results[0].speaker, null, query);
    assert.equal(answer.results[0].reviewStatus, "machine-candidate", query);
    assert.equal(answer.results[0].curatedRank, null, query);
  }
});

test("Batch 04 source-audio firewalls expose only topic navigation", async () => {
  const { expanded } = await fixture();
  const topicQueries = truth.filter((row) => restricted.has(row[1]));

  for (const [query, id] of topicQueries) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.selectionPlan.source.sourceId, id, query);
    assert.equal(
      answer.selectionPlan.source.rightsMode,
      restricted.get(id),
      query,
    );
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

  for (const [query, id] of [
    [
      "What is funniest in HALLOWEEN ENDS FINAL TRAILER Reaction + Breakdown?",
      "MSVltTVeypc",
    ],
    [
      "What is funniest in PREDATOR BADLANDS Trailer Reaction & Breakdown LIVE!?",
      "21hL29hicoU",
    ],
    [
      "What is funniest in We Watched A Movie Live! HELLRAISER Game Trailer, Movie News, and more!?",
      "34BwSiucNEI",
    ],
  ]) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "topic-only-boundary", query);
    assert.equal(answer.selectionPlan.source.sourceId, id, query);
    assert.deepEqual(answer.results, [], query);
    assert.match(answer.answer, /source-audio firewall/i, query);
  }
});

test("Batch 04 visual-result questions fail closed at the exact source", async () => {
  const { expanded } = await fixture();
  const refusals = [
    [
      "What death ranked best in SCREAM Movies + TV + Ghostface Tier List LIVE!?",
      "3Lu0beSDxcQ",
    ],
    [
      "What death ranked best in Rob Zombie's HALLOWEEN Character Tier List LIVE!?",
      "o0tcJcJk6MY",
    ],
  ];

  for (const [query, id] of refusals) {
    const answer = plain(expanded.ask(query));
    assert.equal(answer.status, "visual-context-unverified", query);
    assert.equal(answer.selectionPlan.source.sourceId, id, query);
    assert.equal(
      answer.selectionPlan.source.rightsMode,
      "visual-context-unverified",
      query,
    );
    assert.equal(answer.selectionPlan.source.visualContextVerified, false);
    assert.deepEqual(answer.results, [], query);
    assert.match(
      answer.answer,
      /cannot verify which on-screen kill or death won/i,
      query,
    );
  }
});

test("Batch 04 character signals never become performance candidates", async () => {
  const { expanded } = await fixture();
  const signals = plain(expanded.ask(
    "Show Batch04 Archive Deep Dr Challis signals",
  ));

  assert.equal(signals.status, "supported");
  assert.ok(signals.results.length > 0);
  assert.ok(signals.results.every((result) => result.kind === "character"));
  assert.ok(signals.results.every(
    (result) => result.evidenceType === "caption-character-signal",
  ));
  assert.ok(signals.results.every(
    (result) => result.archiveBatchSequence === 4,
  ));
  assert.ok(signals.results.every((result) => result.performanceCues === 0));
  assert.ok(signals.results.every((result) => result.speaker === null));
  assert.ok(signals.results.every((result) => result.originInferred === false));
  assert.ok(signals.results.every((result) => result.curatedRank === null));
  assert.match(signals.answer, /does not identify a performer/i);

  const performance = plain(expanded.ask(
    "Show Batch04 Archive Deep verified Dr Challis performances",
  ));
  assert.equal(performance.status, "insufficient-evidence");
  assert.deepEqual(performance.results, []);
  assert.match(
    performance.answer,
    /ordinary character mentions are not being promoted into impressions/i,
  );
});

test("Fresh, Popular, and promoted selectors ignore the 40-source quarantine", async () => {
  const { baseline, expanded } = await fixture();
  const queries = [
    "What is the most viewed livestream?",
    "What is the newest livestream?",
    "What is the most unhinged livestream?",
    "What is funniest in the most viewed livestream?",
    "Where is The Burp Defense?",
    "When was the last Dr. Loomis bit?",
  ];

  for (const query of queries) {
    const before = plain(baseline.ask(query));
    const after = plain(expanded.ask(query));
    assert.equal(after.status, before.status, query);
    assert.deepEqual(after.selectionPlan, before.selectionPlan, query);
    assert.deepEqual(
      after.results.map((result) => [result.sourceId, result.at, result.kind]),
      before.results.map((result) => [result.sourceId, result.at, result.kind]),
      query,
    );
    assert.ok(after.results.every((result) => result.lane !== "archive"), query);
    assert.ok(after.results.every(
      (result) => result.archiveBatchSequence == null,
    ), query);
  }
});
