import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of ["episode-recap-engine.js", "wwam-episode-recap-adapter.js"]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  }
  return sandbox.window;
}

function source(overrides = {}) {
  return {
    id: "abcdefghijk",
    title: "Horror News Live",
    displayTitle: "Horror News Live",
    date: "2026-07-23",
    duration: 7_800,
    views: 12_345,
    url: "https://www.youtube.com/watch?v=abcdefghijk",
    coverage: "caption-backed",
    wordsAudited: 40_000,
    ...overrides,
  };
}

function receipt(key, at, kind, label, signalScore = 50) {
  return {
    key,
    sourceId: "abcdefghijk",
    at,
    end: at + 24,
    kind,
    label,
    excerpt: kind === "moment" ? "bounded source excerpt" : "",
    publicExcerptAllowed: kind === "moment",
    signalScore,
    evidenceBasis: "synthetic-source-local-test",
  };
}

test("universal map and WWAM voice pack produce deterministic chronological recaps", () => {
  const window = load();
  const receipts = [
    receipt("topic:halloween", 90, "topic", "Halloween", 80),
    receipt("moment:open", 720, "moment", "THE ROOM BREAKS", 75),
    receipt("topic:scream", 1_900, "topic", "Scream", 70),
    receipt("moment:middle", 3_650, "moment", "UP IN YA", 99),
    receipt("topic:elm", 5_100, "topic", "A Nightmare on Elm Street", 60),
    receipt("moment:late", 7_200, "moment", "FULL SEND", 86),
  ];
  const input = {
    source: source(),
    receipts,
    format: { id: "horror-news", label: "HORROR NEWS SHOW", basis: "source-title-metadata" },
  };
  const firstMap = window.ShokkerEpisodeRecap.build(input);
  const secondMap = window.ShokkerEpisodeRecap.build(input);
  const first = window.WWAMEpisodeRecapAdapter.build({ map: firstMap });
  const second = window.WWAMEpisodeRecapAdapter.build({ map: secondMap });

  assert.equal(firstMap.schema, "shokker-episode-recap/v1");
  assert.equal(firstMap.evidenceState, "ready");
  assert.equal(firstMap.mode, "receipt-recap");
  assert.deepEqual(JSON.parse(JSON.stringify(firstMap)), JSON.parse(JSON.stringify(secondMap)));
  assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
  assert.equal(first.schema, "wwam-feldman-recap/v1");
  assert.equal(first.label, "WWAM FELDMAN APPROVED RECAP");
  assert.equal(first.approval.actualApproval, false);
  assert.ok(first.sections.length >= 4);
  assert.ok(first.sections.every((section) => section.receiptKeys.length));
  assert.deepEqual(
    first.sections.map((section) => section.at),
    first.sections.map((section) => section.at).slice().sort((a, b) => a - b),
  );
  assert.equal(first.caseFile.receiptCount, receipts.length);
  assert.equal(first.caseFile.topicCount, 3);
  assert.equal(first.caseFile.momentCount, 3);
  assert.equal(first.caseFile.storyReceiptCount, receipts.length);
  assert.equal(first.caseFile.storyCoveragePercent, 100);
  assert.ok(first.story.length >= 2);
  assert.deepEqual(
    Array.from(new Set(first.story.flatMap((segment) => segment.receiptKeys))).sort(),
    receipts.map((item) => item.key).sort(),
  );
  const receiptByKey = new Map(receipts.map((item) => [item.key, item]));
  assert.ok(first.story.some((segment) => segment.anchorAt !== segment.at));
  assert.ok(first.story.every((segment) => {
    const anchor = receiptByKey.get(segment.anchorReceiptKey);
    return anchor &&
      segment.receiptKeys.includes(segment.anchorReceiptKey) &&
      segment.anchorAt === anchor.at &&
      (!segment.excerpt || segment.excerpt === anchor.excerpt);
  }));
  assert.ok(first.story.every((segment) =>
    /source|tape|ledger|security footage|evidence/i.test(segment.body)
  ));
  assert.match(first.overview, /6 source-linked receipts/i);
  assert.match(first.overview, /6 of 6 registered receipts/i);
  assert.ok(first.sections.some((section) => /bounded source excerpt/i.test(section.body)));
  assert.match(first.limitations.join(" "), /automatic captions do not establish the speaker/i);
});

test("channel title topics outrank incidental signal without changing receipt evidence", () => {
  const window = load();
  const receipts = [
    receipt("topic:marvel", 90, "topic", "TOPIC: MARVEL", 100),
    receipt("topic:elm", 800, "topic", "TOPIC: A NIGHTMARE ON ELM STREET", 20),
    receipt("topic:halloween", 1_500, "topic", "TOPIC: HALLOWEEN", 80),
  ];
  const map = window.ShokkerEpisodeRecap.build({
    source: source({
      title: "FREDDY KRUEGER Death Scenes Tier List Ranking!",
      displayTitle: "FREDDY KRUEGER Death Scenes Tier List Ranking!",
      duration: 2_000,
    }),
    receipts,
    context: {
      titleTopics: ["A Nightmare on Elm Street", "Marvel", "Halloween"],
      lanes: [],
    },
    format: { id: "ranking-show", label: "RANKING / BRACKET SHOW", basis: "title" },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({ map });

  assert.equal(map.topics[0], "A Nightmare on Elm Street");
  assert.match(recap.headline, /A NIGHTMARE ON ELM STREET/);
  assert.doesNotMatch(recap.headline, /TOPIC:/);
  assert.equal(recap.caseFile.topicCount, 3);
});

test("playable acts reserve distinct subject doors instead of becoming a heat-only playlist", () => {
  const window = load();
  const receipts = [
    receipt("topic:halloween", 120, "topic", "Halloween", 12),
    receipt("moment:one", 720, "moment", "UP IN YA", 100),
    receipt("topic:scream", 1_440, "topic", "Scream", 11),
    receipt("moment:two", 2_100, "moment", "THE ROOM BREAKS", 99),
    receipt("topic:elm", 2_850, "topic", "A Nightmare on Elm Street", 10),
    receipt("moment:three", 3_550, "moment", "FULL SEND", 98),
    receipt("topic:friday", 4_200, "topic", "Friday the 13th", 9),
    receipt("moment:four", 4_900, "moment", "TAKE GETS NUCLEAR", 97),
    receipt("topic:evil-dead", 5_650, "topic", "Evil Dead", 8),
    receipt("moment:five", 6_300, "moment", "OUT OF POCKET", 96),
    receipt("topic:alien", 6_950, "topic", "Alien", 7),
    receipt("moment:six", 7_500, "moment", "THE ROOM BREAKS AGAIN", 95),
  ];
  const map = window.ShokkerEpisodeRecap.build({
    source: source({
      title: "Halloween and Scream Horror News Live",
      displayTitle: "Halloween and Scream Horror News Live",
    }),
    receipts,
    format: { id: "horror-news", label: "HORROR NEWS SHOW", basis: "title" },
  });
  const topicActs = map.sections.filter((section) => section.category === "topic");

  assert.equal(map.sections.length, 8);
  assert.ok(topicActs.length >= 4);
  assert.ok(topicActs.some((section) => section.anchor === "Halloween"));
  assert.ok(topicActs.some((section) => section.anchor === "Scream"));
});

test("receipt recap acts never borrow a distant topic for a different timestamp", () => {
  const window = load();
  const receipts = [
    receipt("topic:casting", 100, "topic", "TOPIC: CASTING", 100),
    receipt("moment:detour", 1_000, "moment", "UP IN YA", 99),
    receipt("topic:halloween", 1_090, "topic", "TOPIC: HALLOWEEN", 60),
    receipt("moment:late", 2_400, "moment", "THE ROOM BREAKS", 80),
    receipt("topic:scream", 2_900, "topic", "TOPIC: SCREAM", 90),
  ];
  const map = window.ShokkerEpisodeRecap.build({
    source: source({ duration: 3_200 }),
    receipts,
    format: { id: "horror-news", label: "HORROR NEWS SHOW", basis: "title" },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({ map });
  const detourMap = map.sections.find((section) => section.at === 1_000);
  const detourRecap = recap.sections.find((section) => section.at === 1_000);
  const lateMap = map.sections.find((section) => section.at === 2_400);
  const lateRecap = recap.sections.find((section) => section.at === 2_400);

  assert.ok(detourMap);
  assert.ok(detourRecap);
  assert.deepEqual(
    Array.from(detourMap.receiptKeys),
    ["moment:detour", "topic:halloween"],
  );
  assert.equal(detourMap.subject, "HALLOWEEN");
  assert.doesNotMatch(detourRecap.body, /CASTING|SCREAM/i);
  assert.match(detourRecap.body, /Halloween/i);

  assert.ok(lateMap);
  assert.ok(lateRecap);
  assert.deepEqual(Array.from(lateMap.receiptKeys), ["moment:late"]);
  assert.equal(lateMap.subject, "THE ROOM BREAKS");
  assert.doesNotMatch(lateRecap.body, /SCREAM/i);
  assert.equal(
    lateMap.evidenceBasis,
    "source-local-receipts-temporally-bound-to-anchor",
  );
});

test("metadata-only sources get a visible held module with zero semantic claims", () => {
  const window = load();
  const map = window.ShokkerEpisodeRecap.build({
    source: source({
      coverage: "metadata-only",
      wordsAudited: 0,
    }),
    receipts: [],
    format: { id: "livestream", label: "WWAM LIVESTREAM", basis: "registered-source-type" },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({ map });

  assert.equal(map.evidenceState, "held");
  assert.equal(recap.state, "held");
  assert.equal(recap.label, "EPISODE RECAP");
  assert.equal(recap.badge, "RECAP WAITING ON THE TAPE");
  assert.equal(recap.sections.length, 0);
  assert.equal(recap.story.length, 0);
  assert.equal(recap.bestMoments.length, 0);
  assert.equal(recap.approval.actualApproval, false);
  assert.doesNotMatch(recap.label, /feldman approved/i);
  assert.match(recap.overview, /describes no scenes, jokes, reactions, speakers, topics, or verdicts/i);
});
