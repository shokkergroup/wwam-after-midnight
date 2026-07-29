import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const demoRoot = new URL("../public/demo/", import.meta.url);
const engineFiles = [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "curation.js",
  "character-lore.js",
  "archive-deep-distill.js",
  "wwam-channel-dna.js",
  "search-engine.js",
  "ask-deep-cut.js",
];

async function runtime() {
  const sandbox = { window: {} };
  sandbox.globalThis = sandbox.window;
  for (const file of engineFiles) {
    runInNewContext(await readFile(new URL(file, demoRoot), "utf8"), sandbox, {
      filename: file,
    });
  }
  const { window } = sandbox;
  const engine = window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
    window.WWAM_CHARACTER_LORE,
    window.WWAM_ARCHIVE_DEEP,
    window.WWAM_CHANNEL_DNA,
    { now: "2026-07-28T12:00:00-04:00" },
  );
  const loads = [];
  const loader = async (url) => {
    loads.push(url);
    assert.equal(url, "episode-guides.js?v=2.1.5-referent");
    runInNewContext(
      await readFile(new URL(url.split("?")[0], demoRoot), "utf8"),
      sandbox,
      { filename: url },
    );
  };
  return { sandbox, window, engine, loads, loader };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertExactBound(result, expected) {
  assert.equal(result.sourceId, expected.id);
  assert.equal(result.sourceTitle, expected.title);
  assert.equal(result.date, expected.date);
  assert.equal(result.source, "commentary");
  assert.equal(result.kind, "guide-cut");
  assert.equal(result.lane, "episode-guide");
  assert.equal(result.evidenceType, "caption-guide-cut");
  assert.equal(result.evidenceLevel, "EPISODE GUIDE V2 DEEP-DIVE CUT");
  assert.equal(result.speaker, null);
  assert.equal(result.speakerStatus, "not-diarized");
  assert.equal(result.playback.start, result.at);
  assert.equal(result.playback.end, result.end);
  assert.ok(result.end > result.at);
  assert.match(result.url, new RegExp(`watch\\?v=${expected.id}.*[?&]t=${result.at}s`));
}

function exactGuideCut(window, sourceId, terms) {
  const guide = window.WWAM_EPISODE_GUIDES.guides.find((item) => item.id === sourceId);
  assert.ok(guide?.episodeGuide?.cuts, `missing Episode Guide cuts for ${sourceId}`);
  const matches = guide.episodeGuide.cuts.filter((cut) => {
    const text = [cut.excerpt, cut.topic, cut.label, cut.category]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => text.includes(term.toLowerCase()));
  });
  assert.equal(matches.length, 1, `expected one exact ${terms.join(" + ")} guide cut`);
  return matches[0];
}

test("global Ask lazily bridges the real Halloween 1978 Panavision cut", async () => {
  const { window, engine, loads, loader } = await runtime();
  const query = "In Halloween 1978, where did they talk about Panavision?";
  const base = engine.ask(query);

  assert.equal(base.status, "insufficient-evidence");
  assert.equal(base.selectionPlan.source.sourceId, "6VXSBDZ-3WE");
  assert.equal(base.selectionPlan.source.matchMode, "exact");
  assert.equal(base.selectionPlan.source.alternativeCount, 0);
  assert.deepEqual([...base.queryPlan.subjectTerms], ["panavision"]);
  assert.equal(window.WWAM_EPISODE_GUIDES, undefined, "the 460KB+ guide is not eager");

  const answer = await window.WWAMAskDeepCut.resolve(
    query,
    window.WWAM_CATALOG,
    loader,
    base,
  );

  assert.deepEqual(loads, ["episode-guides.js?v=2.1.5-referent"]);
  assert.equal(answer.status, "supported");
  assert.equal(answer.results.length, 1);
  assertExactBound(answer.results[0], {
    id: "6VXSBDZ-3WE",
    title: "Halloween (1978)",
    date: "2017-10-31",
  });
  const expected = exactGuideCut(window, "6VXSBDZ-3WE", ["panavision"]);
  assert.equal(answer.results[0].guideCutId, expected.id);
  assert.equal(answer.results[0].at, expected.t);
  assert.equal(answer.results[0].end, expected.end);
  assert.match(answer.results[0].excerpt, /Panavision/i);
  assert.equal(answer.deepCutBridge.exactSourceOnly, true);
  assert.equal(answer.deepCutBridge.crossSourceSubstitution, false);
  assert.deepEqual([...answer.collection.sourceIds], ["6VXSBDZ-3WE"]);
  assert.match(answer.answer, /stays inside that exact upload; auto-captions can be imperfect/i);
  assert.ok(answer.limitations.some((item) => /no other upload was searched/i.test(item)));
});

test("the bridge generalizes across exact commentary titles and multi-term cuts", async () => {
  const { window, engine, loads, loader } = await runtime();
  const query = "In Halloween II 1981, where did they talk about Ben Tramer?";
  const base = engine.ask(query);
  const answer = await window.WWAMAskDeepCut.resolve(
    query,
    window.WWAM_CATALOG,
    loader,
    base,
  );

  assert.deepEqual([...base.queryPlan.subjectTerms], ["ben", "tramer"]);
  assert.deepEqual(loads, ["episode-guides.js?v=2.1.5-referent"]);
  assert.equal(answer.status, "supported");
  assert.ok(answer.results.length >= 1);
  assert.ok(answer.results.every((result) => result.sourceId === "ThPjds8iI9U"));
  assertExactBound(answer.results[0], {
    id: "ThPjds8iI9U",
    title: "Halloween II (1981)",
    date: "2017-11-07",
  });
  const expected = exactGuideCut(window, "ThPjds8iI9U", ["ben", "tramer"]);
  assert.match(answer.results[0].excerpt, /Ben tramer/i);
  assert.equal(answer.results[0].guideCutId, expected.id);
  assert.equal(answer.results[0].at, expected.t);
  assert.equal(answer.results[0].end, expected.end);
});

test("ambiguous, untitled, and tampered requests fail before loading guides", async () => {
  const { window, engine, loads, loader } = await runtime();
  const unboundedQuery = "Where did they talk about Panavision?";
  const unbounded = engine.ask(unboundedQuery);
  assert.equal(unbounded.status, "insufficient-evidence");
  assert.equal(unbounded.selectionPlan, null);
  assert.equal(
    await window.WWAMAskDeepCut.resolve(
      unboundedQuery,
      window.WWAM_CATALOG,
      loader,
      unbounded,
    ),
    null,
  );

  const exactQuery = "In Halloween 1978, where did they talk about Panavision?";
  const exact = clone(engine.ask(exactQuery));
  for (const mutate of [
    (answer) => { answer.selectionPlan.source.alternativeCount = 1; },
    (answer) => { answer.selectionPlan.source.date = "2017-11-01"; },
    (answer) => { answer.selectionPlan.source.sourceTitle = "Halloween II (1981)"; },
    (answer) => { answer.selectionPlan.source.sourceId = "ThPjds8iI9U"; },
  ]) {
    const tampered = clone(exact);
    mutate(tampered);
    assert.equal(
      await window.WWAMAskDeepCut.resolve(
        exactQuery,
        window.WWAM_CATALOG,
        loader,
        tampered,
      ),
      null,
    );
  }
  assert.deepEqual(loads, [], "invalid scopes must not request the heavy payload");
  assert.equal(window.WWAM_EPISODE_GUIDES, undefined);
});

test("an exact show with no matching guide cut returns no substitution", async () => {
  const { window, engine, loads, loader } = await runtime();
  const query = "In Halloween 1978, where did they talk about zxqvnever?";
  const base = engine.ask(query);
  const answer = await window.WWAMAskDeepCut.resolve(
    query,
    window.WWAM_CATALOG,
    loader,
    base,
  );

  assert.equal(base.selectionPlan.source.sourceId, "6VXSBDZ-3WE");
  assert.deepEqual(loads, ["episode-guides.js?v=2.1.5-referent"]);
  assert.equal(answer, null);
});

test("Ask page wires the bridge lazily and keeps the release byte ceiling", async () => {
  const [app, html, appInfo] = await Promise.all([
    readFile(new URL("app.js", demoRoot), "utf8"),
    readFile(new URL("index.html", demoRoot), "utf8"),
    stat(new URL("app.js", demoRoot)),
  ]);
  const askStart = app.indexOf("function ask(query, preservedAnalysis)");
  const analysis = app.indexOf("var analysis = rankedAnalysis", askStart);
  const bridge = app.indexOf('loadDemoScript("ask-deep-cut.js?v=1.0.0")', analysis);
  const render = app.indexOf("resultsNode._trail = analysis", analysis);

  assert.ok(askStart >= 0 && analysis > askStart && bridge > analysis && bridge < render);
  assert.match(app, /WWAMAskDeepCut\.resolve\(query,catalog,loadDemoScript,analysis\)/);
  assert.match(app, /result\.lane === "archive" \|\| result\.lane === "episode-guide"/);
  assert.match(app, /data-ask-source[\s\S]{0,240}data-time[\s\S]{0,120}data-end/);
  assert.match(app, /openDossier\(button\.dataset\.id,\+button\.dataset\.time,\+button\.dataset\.end\)/);
  assert.match(app, /loadPlayer\(sourceId,\+startTime,settings\.end\)/);
  assert.match(app, /episode-recap-engine\.js\?v=1\.2\.0-full-story/);
  assert.match(app, /wwam-episode-recap-adapter\.js\?v=1\.2\.0-full-story/);
  assert.match(app, /source-dossier-engine\.js\?v=1\.9\.0-full-story/);
  assert.doesNotMatch(html, /<script[^>]+(?:ask-deep-cut|episode-guides)\.js/i);
  assert.ok(
    appInfo.size < 275000,
    `app.js is ${appInfo.size} bytes; expected fewer than the 275000-byte ceiling`,
  );
});
