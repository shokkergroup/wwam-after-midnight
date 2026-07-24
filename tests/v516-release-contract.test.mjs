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

const ALLOWED_RELATIONS = new Set([
  "explicit-caption-target",
  "exact-topic-receipt",
  "screen-referent-in-exact-commentary",
]);

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
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
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
    window.WWAM_ARCHIVE_DEEP,
    window.WWAM_ARCHIVE_DEEP_BATCH2,
    window.WWAM_ARCHIVE_DEEP_BATCH3,
    window.WWAM_ARCHIVE_DEEP_BATCH4,
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

function coordinate(result) {
  return `${result.sourceId}@${result.at}`;
}

function assertRelationshipSafe(answer, query) {
  assert.ok(answer.results.length > 0, `${query}: expected relationship evidence`);
  for (const result of answer.results) {
    assert.ok(
      ALLOWED_RELATIONS.has(result.claimRelation),
      `${query}: unsafe result relation ${result.claimRelation}`,
    );
    assert.equal(result.speaker, null, `${query}: speaker must remain null`);
    assert.equal(
      result.speakerStatus,
      "not-diarized",
      `${query}: speaker boundary`,
    );
    assert.ok(Number.isInteger(result.at) && result.at >= 0, `${query}: time`);
    assert.match(result.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
  }
  for (const stop of answer.evidenceChain) {
    assert.ok(
      ALLOWED_RELATIONS.has(stop.result.claimRelation),
      `${query}: unsafe chain relation ${stop.result.claimRelation}`,
    );
  }
}

test("V5.16 release identity and documentation publish one relationship contract", () => {
  const manifest = JSON.parse(readRoot("package.json"));
  const lock = JSON.parse(readRoot("package-lock.json"));
  const html = readDemo("index.html");
  const readme = readRoot("README.md");
  const overview = readRoot("docs/V5_OVERVIEW.md");
  const contract = readRoot("docs/EVIDENCE_RELATIONSHIP_GATE.md");
  const changelog = readRoot("docs/CHANGELOG.md");
  const runbook = readRoot("docs/CREATOR_DEMO_RUNBOOK.md");
  const memoryOs = readRoot("docs/YOUTUBE_WIKI_MEMORY_OS.md");
  const combined = [
    readme,
    overview,
    contract,
    changelog,
    runbook,
    memoryOs,
  ].join("\n");

  assert.equal(manifest.version, "0.5.20");
  assert.equal(lock.version, "0.5.20");
  assert.equal(lock.packages[""].version, "0.5.20");
  assert.match(readme, /Current documented release: \*\*V5\.20 \/ 0\.5\.20\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.20/m);
  assert.match(changelog, /^## 0\.5\.16 .*Evidence Relationship Gate/m);
  assert.match(runbook, /current V5\.20 build/i);
  assert.match(html, /youtube-playback\.js\?v=0\.5\.20/);
  assert.match(html, /app\.js\?v=0\.5\.20/);

  for (const relation of [
    ...ALLOWED_RELATIONS,
    "source-context-only",
  ]) {
    assert.match(combined, new RegExp(`\\b${relation}\\b`));
  }
  for (const failure of [
    /4UokRLETypU @ 809/,
    /Q6SN-Om1gIo @ 2835/,
    /2G8lpFaeIdw @ 1585/,
    /jLIfEdg8Oc0 @ 4366/,
    /BIbyzMlstmM @ 1528/,
  ]) {
    assert.match(contract, failure);
  }
  assert.match(contract, /accuracy moat/i);
  assert.match(contract, /generic chatbot/i);
  assert.match(contract, /Heat[\s\S]{0,120}curation status/i);
  assert.match(contract, /None can upgrade `source-context-only`/i);
  assert.match(contract, /racing archive/i);
  assert.match(contract, /Play the Answer core rejects/i);
});

test("neutral franchise aboutness drops every reproduced source-context failure", () => {
  const { ask } = runtime();
  const cases = [
    {
      query: "What do they say about Halloween?",
      forbidden: ["4UokRLETypU@809", "Q6SN-Om1gIo@2835"],
    },
    {
      query: "What do they say about Scream?",
      forbidden: ["2G8lpFaeIdw@1585", "jLIfEdg8Oc0@4366"],
    },
    {
      query: "What do they say about Friday the 13th?",
      forbidden: ["BIbyzMlstmM@1528"],
    },
  ];

  for (const scenario of cases) {
    const answer = plain(ask.ask(scenario.query));
    const coordinates = new Set(answer.results.map(coordinate));
    assert.equal(answer.status, "supported", scenario.query);
    assertRelationshipSafe(answer, scenario.query);
    for (const forbidden of scenario.forbidden) {
      assert.equal(
        coordinates.has(forbidden),
        false,
        `${scenario.query}: source-context result survived at ${forbidden}`,
      );
    }
    assert.ok(
      answer.results.every((result) => (
        result.claimRelation === "exact-topic-receipt"
      )),
      `${scenario.query}: expected exact topic evidence in the current corpus`,
    );
  }
});

test("direct, absent, neutral-opinion, and change controls keep separate evidence contracts", () => {
  const { ask } = runtime();
  const mask = plain(ask.ask(
    "What did they say about the mask in Halloween 5?",
  ));
  const ending = plain(ask.ask(
    "What did they say about the ending in Scream 3?",
  ));
  const elm = plain(ask.ask(
    "What do they think about the Elm Street remake?",
  ));
  const change = plain(ask.ask(
    "How did their opinion on Halloween change?",
  ));

  assert.equal(mask.status, "supported");
  assert.equal(mask.results[0].sourceId, "AtcRT3Xkk6E");
  assert.equal(mask.results[0].at, 1327);
  assert.equal(mask.results[0].claimRelation, "explicit-caption-target");
  assertRelationshipSafe(mask, mask.query);

  assert.equal(ending.status, "insufficient-evidence");
  assert.equal(ending.confidence, 0);
  assert.deepEqual(ending.results, []);
  assert.deepEqual(ending.evidenceChain, []);

  assert.equal(elm.status, "archive-boundary");
  assert.deepEqual(
    new Set(elm.results.map(coordinate)),
    new Set(["qTQdWKcwn4A@2101", "qTQdWKcwn4A@1132"]),
  );
  assert.ok(elm.results.every((result) => (
    result.claimRelation === "screen-referent-in-exact-commentary"
  )));
  assert.match(elm.answer, /not one settled host opinion/i);
  assertRelationshipSafe(elm, elm.query);

  assert.equal(change.status, "archive-boundary");
  assert.deepEqual(
    change.evidenceChain.map((stop) => coordinate(stop.result)),
    ["6VXSBDZ-3WE@1597", "I6QKteG_hK0@5993"],
  );
  assert.ok(change.evidenceChain.every((stop) => (
    stop.result.claimRelation === "screen-referent-in-exact-commentary"
  )));
  assert.match(change.answer, /cannot prove a host changed their mind/i);
  assertRelationshipSafe(change, change.query);
});

test("Play the Answer preserves allowed relations and rejects source context directly", () => {
  const { window, ask, registry, bindings, play } = runtime();
  const query = "What do they say about Halloween?";
  const trail = play.build(query);
  const packet = plain(play.createShare(query));

  assert.ok(trail.stops.length >= 2);
  assert.ok(trail.stops.every((stop) => (
    stop.claimRelation === "exact-topic-receipt"
  )));
  assert.deepEqual(
    plain(packet.stops.map((stop) => stop.claimRelation)),
    plain(trail.stops.map((stop) => stop.claimRelation)),
  );
  assert.equal(
    play.restoreShare(packet).fingerprint,
    trail.fingerprint,
  );

  for (const unsafeRelation of [
    undefined,
    "source-context-only",
    "unknown",
  ]) {
    const unsafe = plain(ask.ask(query));
    if (unsafeRelation === undefined) {
      delete unsafe.evidenceChain[0].result.claimRelation;
    } else {
      unsafe.evidenceChain[0].result.claimRelation = unsafeRelation;
    }
    const unsafePlay = window.ShokkerPlayAnswer.create({
      analyze() {
        return unsafe;
      },
      bindings,
      sources: registry.engineSources,
    });
    assert.throws(
      () => unsafePlay.build(query),
      playError("NONPLAYABLE_CLAIM_RELATION"),
    );
  }
});

test("the same playable relationship boundary accepts a neutral racing trail", () => {
  const window = {};
  const sandbox = { window, globalThis: window };
  window.window = window;
  vm.createContext(sandbox);
  vm.runInContext(readDemo("play-answer-engine.js"), sandbox, {
    filename: "play-answer-engine.js",
  });
  const query = "Show the car 33 call and the finish";
  const analysis = {
    query,
    status: "supported",
    continuedFrom: false,
    limitations: [
      "The booth speaker is not identified and sequence does not prove causality.",
    ],
    evidenceChain: [
      {
        role: "PRIMARY RECEIPT",
        result: {
          key: "race-car-33-call",
          sourceId: "RACE01A",
          at: 118,
          kind: "moment",
          evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
          evidenceType: "caption-excerpt",
          claimRelation: "explicit-caption-target",
          evidenceWarnings: ["The booth speaker is not identified."],
          speaker: null,
          speakerStatus: "not-diarized",
          originInferred: false,
        },
      },
      {
        role: "SUPPORTING RECEIPT",
        result: {
          key: "race-finish-call",
          sourceId: "RACE02B",
          at: 3598,
          kind: "moment",
          evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
          evidenceType: "caption-excerpt",
          claimRelation: "screen-referent-in-exact-commentary",
          evidenceWarnings: ["Sequence does not prove causality."],
          speaker: null,
          speakerStatus: "not-diarized",
          originInferred: false,
        },
      },
    ],
  };
  const play = window.ShokkerPlayAnswer.create({
    analyze() {
      return analysis;
    },
    bindings: {
      channelId: "neutral-racing",
      channelPackFingerprint: "cp1-0000000000000001",
      archiveAsOf: "2026-07-24",
      answerEngineVersion: "ask-v2.1.0",
    },
    sources: [
      { sourceId: "RACE01A", durationSeconds: 4200, playable: true },
      { sourceId: "RACE02B", durationSeconds: 4800, playable: true },
    ],
  });
  const trail = plain(play.build(query));

  assert.deepEqual(
    trail.stops.map((stop) => stop.claimRelation),
    [
      "explicit-caption-target",
      "screen-referent-in-exact-commentary",
    ],
  );
  assert.doesNotMatch(
    JSON.stringify(trail),
    /WWAM|Halloween|Scream|Loomis|horror|Burp Defense/i,
  );

  const unsafe = plain(analysis);
  unsafe.evidenceChain[1].result.claimRelation = "source-context-only";
  const unsafePlay = window.ShokkerPlayAnswer.create({
    analyze() {
      return unsafe;
    },
    bindings: {
      channelId: "neutral-racing",
      channelPackFingerprint: "cp1-0000000000000001",
      archiveAsOf: "2026-07-24",
      answerEngineVersion: "ask-v2.1.0",
    },
    sources: [
      { sourceId: "RACE01A", durationSeconds: 4200, playable: true },
      { sourceId: "RACE02B", durationSeconds: 4800, playable: true },
    ],
  });
  assert.throws(
    () => unsafePlay.build(query),
    playError("NONPLAYABLE_CLAIM_RELATION"),
  );
});
