import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const read = (file) => fs.readFileSync(path.join(demo, file), "utf8");
const uiSource = read("play-answer-ui.js");
const css = read("play-answer.css");

const stackFiles = [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "curation.js",
  "archive-deep-distill.js",
  "archive-deep-batch2.js",
  "archive-deep-batch3.js",
  "archive-deep-batch4.js",
  "archive-atlas-data.js",
  "wwam-channel-dna.js",
  "wwam-channel-pack-adapter.js",
  "channel-pack-contract.js",
  "search-engine.js",
  "play-answer-engine.js",
  "play-answer-ui.js",
];

function load(files = stackFiles) {
  const window = {
    URL,
    URLSearchParams,
    btoa(value) {
      return Buffer.from(value, "binary").toString("base64");
    },
    atob(value) {
      return Buffer.from(value, "base64").toString("binary");
    },
  };
  window.window = window;
  vm.createContext(window);
  for (const file of files) {
    vm.runInContext(read(file), window, { filename: file });
  }
  return window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function neutralResult({
  key,
  sourceId,
  at,
  claimRelation,
  evidenceType = "caption-excerpt",
  kind = "moment",
}) {
  return {
    key,
    sourceId,
    at,
    claimRelation,
    evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
    evidenceType,
    evidenceWarnings: ["Broadcast speaker identity is not established."],
    speaker: null,
    speakerStatus: "not-diarized",
    originInferred: false,
    kind,
    captioned: true,
  };
}

function actualFixture(
  query = "How did their opinion on Halloween change?",
) {
  const window = load();
  const ask = window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
  );
  const registry = window.WWAMPlayAnswerUI.buildSourceRegistry(window);
  const bindings = window.WWAMPlayAnswerUI.compileBindings(window);
  const analysis = ask.ask(query);
  const engine = window.ShokkerPlayAnswer.create({
    analyze(value) {
      assert.equal(value, query);
      return analysis;
    },
    bindings,
    sources: registry.engineSources,
  });
  return { window, ask, registry, bindings, query, analysis, engine };
}

function fakeAskDocument(query, analysis) {
  class FakeElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.attributes = Object.create(null);
      this.children = [];
      this.listeners = Object.create(null);
      this.parentNode = null;
      this.value = "";
      this.innerHTML = "";
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }

    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    prepend(child) {
      child.parentNode = this;
      this.children.unshift(child);
      return child;
    }

    remove() {
      if (!this.parentNode) return;
      this.parentNode.children = this.parentNode.children.filter(
        (child) => child !== this,
      );
      this.parentNode = null;
    }

    addEventListener(type, callback) {
      this.listeners[type] = callback;
    }

    removeEventListener(type) {
      delete this.listeners[type];
    }

    querySelector(selector) {
      if (selector === "[data-play-answer-launch]") {
        return this.children.find((child) =>
          Object.prototype.hasOwnProperty.call(
            child.attributes,
            "data-play-answer-launch",
          ),
        ) || null;
      }
      return null;
    }
  }

  const answer = new FakeElement("section");
  const results = new FakeElement("div");
  const input = new FakeElement("input");
  const form = new FakeElement("form");
  results._trail = analysis;
  results.setAttribute("data-ask-query", query);
  input.value = query;
  results.querySelector = (selector) => {
    if (selector === ".answer-brief") return answer;
    if (selector === "[data-play-answer-slot]") {
      return answer.children.find((child) =>
        Object.prototype.hasOwnProperty.call(
          child.attributes,
          "data-play-answer-slot",
        ),
      ) || null;
    }
    if (selector === "[data-play-answer-restore-status]") return null;
    return null;
  };
  const elements = { askResults: results, askInput: input, askForm: form };
  const document = {
    activeElement: input,
    body: new FakeElement("body"),
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    getElementById(id) {
      return elements[id] || null;
    },
    contains() {
      return true;
    },
  };
  return { document, results, input, form, answer };
}

test("the UI builds the exact canonical WWAM binding and playable source registry", () => {
  const { registry, bindings } = actualFixture();

  assert.ok(registry.size >= 500);
  assert.equal(registry.engineSources.length, registry.size);
  assert.deepEqual(plain(bindings), {
    channelId: "wwam",
    channelPackFingerprint: "cp1-dd23bc386008689b",
    archiveAsOf: "2026-07-23",
    answerEngineVersion: "ask-v2.1.0",
  });
  assert.ok(
    registry.engineSources.every(
      (source) =>
        Object.keys(source).sort().join(",") ===
          "durationSeconds,playable,sourceId" &&
        Number.isInteger(source.durationSeconds) &&
        source.durationSeconds > 0 &&
        source.playable === true,
    ),
  );
  assert.ok(registry.byId["6VXSBDZ-3WE"].captioned);
  assert.equal(
    registry.byId["6VXSBDZ-3WE"].url,
    "https://www.youtube.com/watch?v=6VXSBDZ-3WE",
  );
});

test("a real standalone Ask trail compiles to exact bounded playable stops", () => {
  const fixture = actualFixture();
  const { window, registry, query, analysis, engine } = fixture;

  assert.equal(
    window.WWAMPlayAnswerUI.safeAskAnalysis(analysis, query, registry),
    analysis,
  );
  const raw = engine.build(query);
  const trail = window.WWAMPlayAnswerUI.normalizeTrail(
    raw,
    { query, analysis },
    registry,
  );

  assert.equal(trail.valid, true);
  assert.deepEqual(
    plain(
      trail.stops.map((stop) => [
        stop.role,
        stop.sourceId,
        stop.start,
        stop.end,
        stop.claimRelation,
      ]),
    ),
    [
      [
        "EARLIEST INDEXED RECEIPT",
        "6VXSBDZ-3WE",
        1597,
        1627,
        "screen-referent-in-exact-commentary",
      ],
      [
        "LATEST INDEXED RECEIPT",
        "I6QKteG_hK0",
        5993,
        6023,
        "screen-referent-in-exact-commentary",
      ],
    ],
  );
  assert.ok(trail.warnings.some((warning) => /cannot prove/i.test(warning)));
  assert.ok(trail.stops.every((stop) => stop.end > stop.start));
  assert.match(trail.stops[0].excerpt, /\S/);
});

test("the Elm Street launch chain preserves exact screen-referent relations", () => {
  const fixture = actualFixture(
    "What do they hate about the Elm Street remake?",
  );
  const { window, registry, query, analysis, engine } = fixture;
  assert.equal(
    window.WWAMPlayAnswerUI.safeAskAnalysis(analysis, query, registry),
    analysis,
  );
  const trail = window.WWAMPlayAnswerUI.normalizeTrail(
    engine.build(query),
    { query, analysis },
    registry,
  );

  assert.equal(trail.valid, true);
  assert.deepEqual(
    plain(trail.stops.map((stop) => [
      stop.sourceId,
      stop.start,
      stop.end,
      stop.claimRelation,
    ])),
    [
      [
        "qTQdWKcwn4A",
        1132,
        1162,
        "screen-referent-in-exact-commentary",
      ],
      [
        "qTQdWKcwn4A",
        2101,
        2131,
        "screen-referent-in-exact-commentary",
      ],
    ],
  );
});

test("the UI preserves all three exact claim relations for a neutral racing archive", () => {
  const window = load(["play-answer-engine.js", "play-answer-ui.js"]);
  const query = "Show the start, strategy call, and finish";
  const sources = [
    {
      id: "RACE00001A1",
      sourceId: "RACE00001A1",
      title: "Neutral Racing Round 1",
      duration: 4200,
      durationSeconds: 4200,
      captioned: true,
    },
    {
      id: "RACE00002B2",
      sourceId: "RACE00002B2",
      title: "Neutral Racing Round 2",
      duration: 4800,
      durationSeconds: 4800,
      captioned: true,
    },
  ];
  const registry = {
    byId: Object.fromEntries(sources.map((source) => [source.id, source])),
    list: sources,
    engineSources: sources.map((source) => ({
      sourceId: source.id,
      durationSeconds: source.durationSeconds,
      playable: true,
    })),
    size: sources.length,
  };
  const analysis = {
    query,
    status: "supported",
    continuedFrom: false,
    contextUsed: [],
    limitations: ["Order does not establish causality or speaker identity."],
    evidenceChain: [
      {
        role: "PRIMARY RECEIPT",
        result: neutralResult({
          key: "race-start",
          sourceId: "RACE00001A1",
          at: 118,
          claimRelation: "explicit-caption-target",
        }),
      },
      {
        role: "SUPPORTING RECEIPT",
        result: neutralResult({
          key: "strategy-topic",
          sourceId: "RACE00001A1",
          at: 900,
          claimRelation: "exact-topic-receipt",
          evidenceType: "caption-topic-receipt",
          kind: "topic",
        }),
      },
      {
        role: "COUNTERPOINT",
        result: neutralResult({
          key: "finish-screen-referent",
          sourceId: "RACE00002B2",
          at: 3598,
          claimRelation: "screen-referent-in-exact-commentary",
        }),
      },
    ],
  };
  const engine = window.ShokkerPlayAnswer.create({
    analyze() {
      return analysis;
    },
    bindings: {
      channelId: "neutral-racing",
      channelPackFingerprint: "cp1-0000000000000001",
      archiveAsOf: "2026-07-24",
      answerEngineVersion: "ask-v2.1.0",
    },
    sources: registry.engineSources,
  });

  assert.equal(
    window.WWAMPlayAnswerUI.safeAskAnalysis(analysis, query, registry),
    analysis,
  );
  const trail = window.WWAMPlayAnswerUI.normalizeTrail(
    engine.build(query),
    { query, analysis },
    registry,
  );
  assert.equal(trail.valid, true);
  assert.deepEqual(
    plain(trail.stops.map((stop) => stop.claimRelation)),
    [
      "explicit-caption-target",
      "exact-topic-receipt",
      "screen-referent-in-exact-commentary",
    ],
  );
  assert.doesNotMatch(JSON.stringify(trail), /WWAM|Halloween|Loomis/i);
});

test("the UI preflight rejects unsafe Ask surfaces before the playback core", () => {
  const { window, registry, query, analysis } = actualFixture();
  const cases = [
    (value) => {
      value.status = "speaker-unknown";
    },
    (value) => {
      value.continuedFrom = true;
    },
    (value) => {
      value.contextUsed = ["prior-result"];
    },
    (value) => {
      value.evidenceChain = value.evidenceChain.slice(0, 1);
    },
    (value) => {
      value.evidenceChain[0].role = "HOST PROVED THIS";
    },
    (value) => {
      value.evidenceChain[0].result.captioned = false;
    },
    (value) => {
      value.evidenceChain[0].result.reviewStatus = "machine-candidate";
    },
    (value) => {
      value.evidenceChain[0].result.restrictedToTopicNavigation = true;
    },
    (value) => {
      value.evidenceChain[0].result.rightsMode = "visual-context-unverified";
    },
    (value) => {
      value.evidenceChain[0].result.speaker = "Mike";
    },
    (value) => {
      value.evidenceChain[0].result.speakerStatus = "verified";
    },
    (value) => {
      value.evidenceChain[0].result.evidenceLevel = "SOURCE METADATA ONLY";
    },
    (value) => {
      delete value.evidenceChain[0].result.claimRelation;
    },
    (value) => {
      value.evidenceChain[0].result.claimRelation = "source-context-only";
    },
    (value) => {
      value.evidenceChain[0].result.claimRelation = "unknown";
    },
    (value) => {
      value.evidenceChain[1] = plain(value.evidenceChain[0]);
    },
  ];

  for (const mutate of cases) {
    const unsafe = plain(analysis);
    mutate(unsafe);
    assert.throws(
      () => window.WWAMPlayAnswerUI.safeAskAnalysis(unsafe, query, registry),
      /playback|trail|receipt|source|role|diarized|context|evidence|supported|played|relation/i,
    );
  }
});

test("normalization rejects the entire chain when one bound or receipt is bad", () => {
  const { window, registry, query, analysis, engine } = actualFixture();
  const raw = plain(engine.build(query));

  const missingEnd = plain(raw);
  delete missingEnd.stops[1].end;
  assert.equal(
    window.WWAMPlayAnswerUI.normalizeTrail(
      missingEnd,
      { query, analysis },
      registry,
    ).valid,
    false,
  );

  const duplicate = plain(raw);
  duplicate.stops[1] = plain(duplicate.stops[0]);
  assert.equal(
    window.WWAMPlayAnswerUI.normalizeTrail(
      duplicate,
      { query, analysis },
      registry,
    ).valid,
    false,
  );

  const unknown = plain(raw);
  unknown.stops[1].sourceId = "XXXXXXXXXXX";
  assert.equal(
    window.WWAMPlayAnswerUI.normalizeTrail(
      unknown,
      { query, analysis },
      registry,
    ).valid,
    false,
  );

  const missingRelation = plain(raw);
  delete missingRelation.stops[1].claimRelation;
  assert.equal(
    window.WWAMPlayAnswerUI.normalizeTrail(
      missingRelation,
      { query, analysis },
      registry,
    ).valid,
    false,
  );

  const sourceContextOnly = plain(raw);
  sourceContextOnly.stops[1].claimRelation = "source-context-only";
  assert.equal(
    window.WWAMPlayAnswerUI.normalizeTrail(
      sourceContextOnly,
      { query, analysis },
      registry,
    ).valid,
    false,
  );
});

test("share packets encode outside the core and restore only after a fresh exact rebuild", () => {
  const { window, query, engine } = actualFixture();
  const trail = engine.build(query);
  const packet = engine.createShare(query);
  const token = window.WWAMPlayAnswerUI.packetToken(packet);
  const decoded = window.WWAMPlayAnswerUI.packetFromToken(token);
  const restored = engine.restoreShare(decoded);

  assert.match(token, /^b1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(plain(decoded), plain(packet));
  assert.equal(restored.fingerprint, trail.fingerprint);
  assert.ok(
    decoded.stops.every(
      (stop) =>
        Number.isInteger(stop.at) &&
        Number.isInteger(stop.end) &&
        stop.end > stop.at &&
        [
          "explicit-caption-target",
          "exact-topic-receipt",
          "screen-referent-in-exact-commentary",
        ].includes(stop.claimRelation),
    ),
  );

  const tampered = plain(decoded);
  tampered.stops[0].end += 1;
  assert.throws(
    () => engine.restoreShare(tampered),
    (error) =>
      error &&
      ["INVALID_WINDOW", "TAMPERED_SHARE"].includes(error.code),
  );

  const relationTamper = plain(decoded);
  relationTamper.stops[0].claimRelation = "source-context-only";
  assert.throws(
    () => engine.restoreShare(relationTamper),
    (error) => error?.code === "NONPLAYABLE_CLAIM_RELATION",
  );
});

test("share URLs discard inherited secrets, tracking, junk, and file paths", () => {
  const { window } = actualFixture();
  window.location = {
    protocol: "https:",
    origin: "https://demo.example",
    pathname: "/demo/",
    href:
      "https://demo.example/demo/?qa=internal&token=secret&utm_source=x&junk=" +
      "z".repeat(50_000) +
      "#private",
  };
  const clean = window.WWAMPlayAnswerUI.shareUrl("b1.safe_packet");

  assert.equal(
    clean,
    "https://demo.example/demo/?playAnswer=b1.safe_packet#ask",
  );
  assert.doesNotMatch(clean, /qa=|token=|secret|utm_|junk=|private/);
  assert.ok(clean.length < 30_000);

  window.location = {
    protocol: "file:",
    origin: "null",
    pathname: "/C:/private/WWAM/index.html",
    href: "file:///C:/private/WWAM/index.html?auth=secret",
  };
  assert.equal(
    window.WWAMPlayAnswerUI.shareUrl("b1.safe_packet"),
    "https://wwam-after-midnight.downndirtytn.chatgpt.site/demo/" +
      "?playAnswer=b1.safe_packet#ask",
  );
});

test("the contextual launcher is observer-driven and appears only for a valid 2+ trail", () => {
  assert.match(uiSource, /resultsNode\._trail/);
  assert.match(uiSource, /new root\.MutationObserver\(queueRefresh\)/);
  assert.match(uiSource, /trail\.stops\.length < 2/);
  assert.match(uiSource, /data-play-answer-launch/);
  assert.match(uiSource, /PLAY THIS ANSWER/);
  assert.match(uiSource, /answer\.appendChild\(slot\)/);
  assert.doesNotMatch(uiSource, /nav-links|data-nav|appendChild\([^)]*nav/i);
  assert.match(
    uiSource,
    /safeAskAnalysis\(input\.analysis,\s*input\.query,\s*registry\)/,
  );
});

test("a rendered real Ask analysis injects one launcher and removal fails closed", () => {
  const fixture = actualFixture();
  const dom = fakeAskDocument(fixture.query, fixture.analysis);
  fixture.window.MutationObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
  };
  const instance = fixture.window.WWAMPlayAnswerUI.create({
    document: dom.document,
    core: fixture.window.ShokkerPlayAnswer,
    sources: fixture.registry,
    bindings: fixture.bindings,
  });

  assert.equal(instance.mount(), dom.results);
  assert.equal(dom.answer.children.length, 1);
  assert.ok(
    Object.prototype.hasOwnProperty.call(
      dom.answer.children[0].attributes,
      "data-play-answer-slot",
    ),
  );
  assert.equal(
    dom.answer.children[0].querySelector("[data-play-answer-launch]")
      .innerHTML.includes("PLAY THIS ANSWER"),
    true,
  );

  dom.results._trail = null;
  assert.equal(instance.refresh(), null);
  assert.equal(dom.answer.children.length, 0);
});

test("the theater uses exact helper bounds, persistent recovery, and manual advancement", () => {
  assert.match(
    uiSource,
    /playback\.iframe\(stop\.sourceId,\s*\{[\s\S]*?autoplay:\s*true,[\s\S]*?start:\s*stop\.start,[\s\S]*?end:\s*stop\.end,[\s\S]*?forceHostedBridge:\s*true/,
  );
  assert.match(uiSource, /hosted bridge is the proven first-click playback path/);
  assert.match(uiSource, /data-play-answer-recover>RECOVER PLAYER/);
  assert.match(
    uiSource,
    /PLAYER RECOVERY ATTEMPTED \/\/ HOSTED BRIDGE \/\/ SAME EXACT SOURCE BOUNDS/,
  );
  assert.doesNotMatch(uiSource, /PLAYER RECOVERED/);
  assert.match(uiSource, /PLAYBACK REQUESTED/);
  assert.doesNotMatch(uiSource, /PLAYING STOP/);
  assert.match(
    uiSource,
    /class="play-answer-transport" role="group" aria-label="Playback controls"/,
  );
  assert.match(uiSource, /data-play-answer-prev/);
  assert.match(uiSource, /data-play-answer-replay/);
  assert.match(uiSource, /data-play-answer-next/);
  assert.match(uiSource, /NO AUTO-ADVANCE/);
  assert.doesNotMatch(uiSource, /onStateChange|YT\.PlayerState\.ENDED|setInterval/);
  assert.match(uiSource, /OFFICIAL SOURCE ON YOUTUBE/);
  assert.match(css, /\.play-answer-player \.shokker-youtube-player/);
});

test("the theater preserves warnings and states every authority boundary", () => {
  for (const phrase of [
    "NOT SPEAKER IDENTITY",
    "SAME-PERSON CONTINUITY",
    "CAUSALITY",
    "OR A VERDICT",
  ]) {
    assert.match(uiSource, new RegExp(phrase));
  }
  assert.match(uiSource, /currentTrail\.warnings\.concat\(stop\.warnings\)/);
  assert.match(uiSource, /WARNINGS PRESERVED/);
  assert.match(uiSource, /speakerStatus !== "not-diarized"/);
  assert.match(uiSource, /reviewStatus === "machine-candidate"/);
  assert.match(uiSource, /rightsMode === "visual-context-unverified"/);
});

test("the dialog is keyboard-operable and restores focus without pre-launch media", () => {
  assert.match(uiSource, /documentRef\.createElement\("dialog"\)/);
  assert.match(uiSource, /aria-labelledby/);
  assert.match(uiSource, /aria-describedby/);
  assert.match(uiSource, /aria-live="polite"/);
  assert.match(uiSource, /event\.key === "Escape"/);
  assert.match(uiSource, /event\.key !== "Tab"/);
  assert.match(uiSource, /previousFocus = documentRef\.activeElement/);
  assert.match(uiSource, /target\.focus\(\)/);
  assert.match(uiSource, /function open\(trail\)[\s\S]*?makeTheater\(\)/);
  assert.equal((uiSource.match(/makeTheater\(\);/g) || []).length, 1);
});

test("share restore reruns Ask, exact-compares, and fails visibly closed", () => {
  assert.match(uiSource, /coreInstance\.createShare\(currentTrail\.query\)/);
  assert.match(uiSource, /packetFromToken\(token\)/);
  assert.match(uiSource, /formNode\.requestSubmit\(\)/);
  assert.match(uiSource, /coreInstance\.restoreShare\(restore\.packet\)/);
  assert.match(uiSource, /expected\.signature !== trail\.signature/);
  assert.match(uiSource, /expected\.engineFingerprint !== trail\.engineFingerprint/);
  assert.match(uiSource, /TAMPERED, STALE, OR NO LONGER MATCHING/);
  assert.match(uiSource, /removeLaunch\(\)/);
});

test("the 390px layout keeps controls tappable, bounded, and motion-safe", () => {
  assert.match(css, /@media \(max-width:\s*390px\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /width:\s*100vw/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /transition:\s*none !important/);
});
