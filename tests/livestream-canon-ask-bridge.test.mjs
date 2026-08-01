import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(".");

function loadEngine() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, "public/demo/search-engine.js"), "utf8"), sandbox);
  return sandbox.window.WWAMSearchEngine;
}

test("Ask can consume a canon episode loaded by the livestream feature", () => {
  const engineFactory = loadEngine();
  const canon = {
    episodes: [{
      id: "abc123", title: "Canon Test Live", date: "2026-07-22", duration: 3600, views: 42,
      url: "https://www.youtube.com/watch?v=abc123", captioned: true,
      dossier: { summary: "A caption ledger with Batman.", evidence: { type: "youtube-automatic-caption" } },
      topics: [{ name: "Batman", mentions: 3, peak: 120, receipt: "Batman signal" }],
      moments: [{ t: 120, score: 80, category: "WWAM UP IN YA", excerpt: "Batman is a freak" }],
      characterCues: [],
    }],
  };
  const engine = engineFactory.create([], { tapes: [], hot100: [] }, { streams: [], topicIndex: [] }, { upInYa: [] }, { streams: [], topicIndex: [] }, { characters: [] }, { streams: [], topicIndex: [], characterIndex: [] }, {}, { livestreamCanon: canon });
  const answer = engine.ask("What did they say about Batman on a livestream?");
  assert.equal(answer.source, "livestream");
  assert.equal(answer.resultAnchor.sourceId, "abc123");
  assert.equal(answer.resultAnchor.date, "2026-07-22");
  assert.match(answer.results[0].url, /abc123/);
  assert.equal(answer.results[0].lane, "archive");
});

test("the canon-ready event and Ask rebuild hook are wired", () => {
  const ui = fs.readFileSync(path.join(root, "public/demo/livestream-canon-ui.js"), "utf8");
  const app = fs.readFileSync(path.join(root, "public/demo/app.js"), "utf8");
  const engine = fs.readFileSync(path.join(root, "public/demo/search-engine.js"), "utf8");
  assert.match(ui, /wwam:livestream-canon-ready/);
  assert.match(app, /livestreamCanon: window\.WWAM_LIVESTREAM_CANON/);
  assert.match(engine, /canonStreamRecords/);
  assert.match(engine, /mergeCanonIntoStreams/);
});
