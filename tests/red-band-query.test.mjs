import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "red-band-ranking-v2.js",
    "red-band-query.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const window = context.window;
  const ranking = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE,
  });
  const query = window.WWAMRedBandQuery.create({
    ranking,
    boundedExcerpt(value) {
      return String(value).split(/\s+/).slice(0, 8).join(" ");
    },
    resolveSource(moment) {
      return {
        id: moment.sourceId,
        title: moment.sourceTitle,
        sourceType: moment.lane === "commentary" ? "commentary" : "livestream",
        laneLabel: moment.lane === "recent-livestream" ? "FRESH 10" :
          moment.lane === "popular-livestream" ? "POPULAR 25" : "COMMENTARY",
      };
    },
  });
  return { window, ranking, query };
}

test("publishes reusable query intent and bounded selector contracts", () => {
  const { window, query } = load();
  assert.equal(window.WWAMRedBandQuery.VERSION, "1.1.0");
  assert.equal(query.matches("What is Red Band rank #25?"), true);
  assert.equal(query.matches("What is the most memorable moment?"), true);
  assert.equal(query.matches("What is the funniest Scream commentary?"), false);
  assert.deepEqual(JSON.parse(JSON.stringify(query.select("rank #25"))), {
    start: 25,
    end: 25,
    mode: "exact",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(query.select("ranks 12 through 40"))), {
    start: 12,
    end: 21,
    requestedEnd: 40,
    mode: "range",
    truncated: true,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(query.select("top 999 most memorable moments"))), {
    start: 1,
    end: 10,
    requestedEnd: 999,
    mode: "top",
    truncated: true,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(
    query.select("What is the 25th most memorable moment?"),
  )), {
    start: 25,
    end: 25,
    mode: "exact",
  });
});

test("returns an exact source-linked rank without inventing a creator vote or speaker", () => {
  const { ranking, query } = load();
  const expected = ranking.getByRank(25);
  const analysis = query.analyze("What is Red Band rank #25?");

  assert.equal(analysis.status, "machine-ranked");
  assert.equal(analysis.results.length, 1);
  assert.equal(analysis.results[0].key, expected.rankKey);
  assert.equal(analysis.results[0].sourceId, expected.sourceId);
  assert.equal(analysis.results[0].at, expected.t);
  assert.equal(analysis.results[0].speaker, null);
  assert.match(analysis.results[0].title, /^#025 · /);
  assert.match(analysis.answer, /^#025 is /);
  assert.match(analysis.limitations.join(" "), /not an authenticated Mike\/J vote/i);
  assert.match(analysis.results[0].evidenceWarnings.join(" "), /Speaker not diarized/i);
});

test("returns top and range requests in exact index order with a ten-result ceiling", () => {
  const { query } = load();
  const top = query.analyze("Show me the top 5 most memorable moments");
  const range = query.analyze("Red Band ranks #98-#100");

  assert.deepEqual(Array.from(top.results, (item) => item.title.slice(0, 4)), [
    "#001", "#002", "#003", "#004", "#005",
  ]);
  assert.deepEqual(Array.from(range.results, (item) => item.title.slice(0, 4)), [
    "#098", "#099", "#100",
  ]);
  assert.equal(top.evidenceChain[0].role, "EXACT INDEX HIT");
  assert.equal(top.evidenceChain[1].role, "NEXT INDEX RANK");
});

test("rank follow-ups retain Red Band context and invalid ranks fail closed", () => {
  const { query } = load();
  const previous = { intent: "red-band-ranking", entity: "Red Band 100" };
  const followUp = query.analyze("What is #26?", previous);
  const tooHigh = query.analyze("Red Band rank #101");
  const zero = query.analyze("#0", previous);

  assert.equal(query.matches("What is #26?", previous), true);
  assert.match(followUp.results[0].title, /^#026 · /);
  assert.equal(tooHigh.status, "out-of-range");
  assert.equal(tooHigh.results.length, 0);
  assert.match(tooHigh.answer, /not silently changed/i);
  assert.equal(zero.status, "out-of-range");
  assert.equal(zero.results.length, 0);
});

test("unrelated questions fail closed and incompatible indexes are rejected", () => {
  const { window, query } = load();
  assert.equal(query.analyze("Who played Dr. Loomis?"), null);
  assert.throws(
    () => window.WWAMRedBandQuery.create({ ranking: {} }),
    /compatible ranking index/i,
  );
});
