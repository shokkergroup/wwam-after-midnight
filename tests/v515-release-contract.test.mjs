import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const readRoot = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readDemo = (file) => fs.readFileSync(path.join(demo, file), "utf8");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function playError(code) {
  return (error) => {
    assert.equal(error?.name, "PlayAnswerError");
    assert.equal(error?.code, code);
    return true;
  };
}

let cachedRuntime;

function runtime() {
  if (cachedRuntime) return cachedRuntime;
  const window = {};
  const sandbox = {
    window,
    globalThis: window,
    URL,
    URLSearchParams,
  };
  window.window = window;
  vm.createContext(sandbox);
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "channel-pack-contract.js",
    "wwam-channel-pack-adapter.js",
    "search-engine.js",
    "play-answer-engine.js",
    "play-answer-ui.js",
  ]) {
    vm.runInContext(readDemo(file), sandbox, { filename: file });
  }
  const ask = window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
    window.WWAM_CHARACTER_LORE,
  );
  const registry = window.WWAMPlayAnswerUI.buildSourceRegistry(window);
  const bindings = window.WWAMPlayAnswerUI.compileBindings(window);
  const play = window.ShokkerPlayAnswer.create({
    analyze(query) {
      return ask.ask(query);
    },
    bindings,
    sources: registry.engineSources,
  });
  cachedRuntime = { window, ask, registry, bindings, play };
  return cachedRuntime;
}

function loadPlayback() {
  const window = {
    location: {
      protocol: "https:",
      origin: "https://wiki.example",
      pathname: "/demo/index.html",
    },
    URLSearchParams,
  };
  window.window = window;
  vm.createContext(window);
  vm.runInContext(readDemo("youtube-playback.js"), window, {
    filename: "youtube-playback.js",
  });
  return window.ShokkerYouTubePlayback;
}

test("V5.15 package, cache keys, lazy order, and source ceilings move together", () => {
  const manifest = JSON.parse(readRoot("package.json"));
  const lock = JSON.parse(readRoot("package-lock.json"));
  const html = readDemo("index.html");
  const featureLoader = readDemo("feature-loader.js");
  const askTag = html.match(
    /<section\b[^>]*\bid="ask"[^>]*data-feature-styles="[^"]*"[^>]*data-feature-scripts="[^"]*"[^>]*>/,
  )?.[0];

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");
  assert.ok(askTag, "The Ask section lost its lazy feature declaration.");
  assert.match(
    askTag,
    /data-feature-styles="ask-review\.css,play-answer\.css[^"]*"/,
  );
  assert.match(
    askTag,
    /data-feature-scripts="ask-review-engine\.js,ask-review-ui\.js,channel-pack-contract\.js,wwam-channel-pack-adapter\.js,play-answer-engine\.js,play-answer-ui\.js[^"]*"/,
  );
  assert.match(
    featureLoader,
    /series\(r,\s*loadStyle\)[\s\S]*series\(n,\s*load\)/,
  );
  assert.match(
    featureLoader,
    /return e\.then\(function\(\)\s*\{\s*return t\(r\);/,
  );

  const playbackTag =
    '<script src="youtube-playback.js?v=0.5.21-p1"></script>';
  const appTag = '<script src="app.js?v=0.5.21-ui15"></script>';
  assert.ok(html.indexOf(playbackTag) >= 0, "Playback cache key is stale.");
  assert.ok(
    html.indexOf(appTag) > html.indexOf(playbackTag),
    "The app must load after the shared playback helper.",
  );
  assert.ok(
    fs.statSync(path.join(demo, "app.js")).size < 270_000,
    "app.js exceeded the V5.21 255 KB release ceiling.",
  );
});

test("Play the Answer ships as complete lazy assets and never enters the eager path", () => {
  const html = readDemo("index.html");
  const assets = [
    "play-answer-engine.js",
    "play-answer-ui.js",
    "play-answer.css",
  ];
  const eagerScripts = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );
  const eagerStyles = Array.from(
    html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );

  for (const asset of assets) {
    assert.ok(fs.statSync(path.join(demo, asset)).size > 0, `${asset} is empty.`);
  }
  assert.equal(eagerScripts.includes("play-answer-engine.js"), false);
  assert.equal(eagerScripts.includes("play-answer-ui.js"), false);
  assert.equal(eagerStyles.includes("play-answer.css"), false);
  assert.doesNotMatch(
    readDemo("app.js"),
    /ShokkerPlayAnswer|WWAMPlayAnswerUI|play-answer-(?:engine|ui|surface|theater)/,
  );
});

test("V5.15 documentation pins the product, recovery, evidence, and universal boundaries", () => {
  const readme = readRoot("README.md");
  const overview = readRoot("docs/V5_OVERVIEW.md");
  const contract = readRoot("docs/PLAY_THE_ANSWER.md");
  const changelog = readRoot("docs/CHANGELOG.md");
  const runbook = readRoot("docs/CREATOR_DEMO_RUNBOOK.md");
  const memoryOs = readRoot("docs/YOUTUBE_WIKI_MEMORY_OS.md");

  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(contract, /^# V5\.15 Release Contract .* Play the Answer/m);
  assert.match(contract, /two and six|two-to-six/i);
  assert.match(contract, /same official source and exact bounds/i);
  assert.match(contract, /speaker continuity[\s\S]{0,80}`false`/i);
  assert.match(contract, /racing wiki/i);
  assert.match(changelog, /^## 0\.5\.15 .* V5\.15 Play the Answer/m);
  assert.match(runbook, /## V5\.15 Play the Answer proof/);
  assert.match(runbook, /RECOVER PLAYER/);
  assert.match(memoryOs, /same official source and exact bounded/i);
  assert.match(memoryOs, /ShokkerPlayAnswer/);
});

test("the exact Halloween and Elm Street launch chains remain playable and ordered", () => {
  const { play, bindings, registry } = runtime();

  assert.deepEqual(plain(bindings), {
    channelId: "wwam",
    channelPackFingerprint: "cp1-dd23bc386008689b",
    archiveAsOf: "2026-07-23",
    answerEngineVersion: "ask-v2.1.0",
  });
  assert.ok(registry.engineSources.length > 0);

  const cases = [
    {
      query: "How did their opinion on Halloween change?",
      status: "archive-boundary",
      stops: [
        ["EARLIEST INDEXED RECEIPT", "6VXSBDZ-3WE", 1597, 1627],
        ["LATEST INDEXED RECEIPT", "I6QKteG_hK0", 5993, 6023],
      ],
      limitation: /cannot prove a host changed their mind/i,
    },
    {
      query: "What do they hate about the Elm Street remake?",
      status: "supported",
      stops: [
        ["PRIMARY RECEIPT", "qTQdWKcwn4A", 1132, 1162],
        ["SUPPORTING RECEIPT", "qTQdWKcwn4A", 2101, 2131],
      ],
      limitation: /evaluative language must occur within eight caption words/i,
    },
  ];

  for (const scenario of cases) {
    const trail = play.build(scenario.query);
    assert.equal(trail.status, scenario.status);
    assert.deepEqual(
      plain(trail.stops.map((stop) => [
        stop.role,
        stop.sourceId,
        stop.at,
        stop.end,
      ])),
      scenario.stops,
    );
    assert.match(trail.limitations.join(" "), scenario.limitation);
    assert.ok(trail.stops.every((stop) => stop.speaker === null));
    assert.deepEqual(plain(trail.claims), {
      continuity: false,
      causality: false,
      opinion: false,
      origin: false,
      rights: false,
      canon: false,
    });
    const packet = play.createShare(scenario.query);
    const restored = play.restoreShare(plain(packet));
    assert.equal(restored.fingerprint, trail.fingerprint);
  }
});

test("one-stop answers, surface handoffs, and contextual follow-ups cannot launch", () => {
  const { window, ask, registry, bindings, play } = runtime();
  const singleQuery = "Where is The Burp Defense?";
  const single = ask.ask(singleQuery);
  assert.equal(single.status, "supported");
  assert.equal(single.evidenceChain.length, 1);
  assert.throws(() => play.build(singleQuery), playError("INVALID_COUNT"));

  const handoffQuery = "Show me their funniest moment";
  const handoff = ask.ask(handoffQuery);
  assert.equal(handoff.status, "surface-handoff");
  assert.equal(handoff.evidenceChain.length, 0);
  assert.throws(
    () => play.build(handoffQuery),
    playError("NONPLAYABLE_ANALYSIS"),
  );

  const contextQuery = "What happened next?";
  const contextual = ask.ask(contextQuery, single.context);
  assert.equal(contextual.status, "supported");
  assert.equal(contextual.continuedFrom, true);
  const contextPlay = window.ShokkerPlayAnswer.create({
    analyze(query) {
      assert.equal(query, contextQuery);
      return contextual;
    },
    bindings,
    sources: registry.engineSources,
  });
  assert.throws(
    () => contextPlay.build(contextQuery),
    playError("CONTEXT_DEPENDENT"),
  );
});

test("Error 153 recovery preserves every Elm stop's official source and bounds", () => {
  const { play } = runtime();
  const playback = loadPlayback();
  const trail = play.build("What do they hate about the Elm Street remake?");

  assert.equal(new Set(trail.stops.map((stop) => stop.sourceId)).size, 1);
  for (const stop of trail.stops) {
    const markup = playback.iframe(stop.sourceId, {
      autoplay: true,
      start: stop.at,
      end: stop.end,
      title: `Play the Answer stop ${stop.position}`,
    });
    assert.match(markup, new RegExp(`data-video-id="${stop.sourceId}"`));
    assert.match(markup, new RegExp(`data-start="${stop.at}"`));
    assert.match(markup, new RegExp(`data-end="${stop.end}"`));

    const attributes = new Map([
      ["data-video-id", stop.sourceId],
      ["data-start", String(stop.at)],
      ["data-end", String(stop.end)],
      ["data-autoplay", "1"],
    ]);
    const frame = {
      src: "",
      setAttribute(name, value) {
        if (name === "src") this.src = value;
      },
    };
    const player = {
      getAttribute(name) {
        return attributes.get(name) ?? "";
      },
      querySelector(selector) {
        return selector === "iframe" ? frame : null;
      },
    };
    const button = {
      textContent: "",
      disabled: false,
      closest(selector) {
        return selector === "[data-shokker-youtube-player]" ? player : null;
      },
      setAttribute(name, value) {
        attributes.set(name, value);
      },
    };

    playback.recoverPlayer(button);
    const recovered = new URL(frame.src);
    assert.equal(recovered.origin, "https://wwam-after-midnight.downndirtytn.chatgpt.site");
    assert.equal(recovered.pathname, "/demo/media-bridge.html");
    assert.equal(recovered.searchParams.get("video"), stop.sourceId);
    assert.equal(recovered.searchParams.get("start"), String(stop.at));
    assert.equal(recovered.searchParams.get("end"), String(stop.end));
    assert.equal(recovered.searchParams.get("autoplay"), "1");
    assert.equal(button.textContent, "RECOVERY PLAYER LOADED");
    assert.equal(button.disabled, true);
  }

  const ui = readDemo("play-answer-ui.js");
  assert.match(
    ui,
    /playback\.iframe\(stop\.sourceId,\s*\{[\s\S]{0,220}start:\s*stop\.start,[\s\S]{0,100}end:\s*stop\.end,[\s\S]{0,180}forceHostedBridge:\s*forceHostedBridge === true/,
  );
  assert.match(
    ui,
    /renderStop\(currentIndex,\s*true\)/,
  );
});
