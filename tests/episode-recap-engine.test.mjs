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
  assert.match(first.overview, /automatic captions do not name the speaker/i);
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
  assert.equal(recap.bestMoments.length, 0);
  assert.equal(recap.approval.actualApproval, false);
  assert.doesNotMatch(recap.label, /feldman approved/i);
  assert.match(recap.overview, /describes no scenes, jokes, reactions, speakers, topics, or verdicts/i);
});
