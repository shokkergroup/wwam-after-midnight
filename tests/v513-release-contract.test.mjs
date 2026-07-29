import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  NEUTRAL_RACING_ADAPTER,
  NEUTRAL_RACING_DNA,
} from "./fixtures/channel-pack-neutral-racing.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const demo = path.join(root, "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");

const longitudinalFiles = [
  "channel-pack-contract.js",
  "wwam-channel-pack-adapter.js",
  "longitudinal-docket-data.js",
  "longitudinal-docket-engine.js",
  "longitudinal-docket-ui.js",
  "wwam-longitudinal-docket-adapter.js",
];

const searchFiles = [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "curation.js",
  "character-lore.js",
  "archive-deep-distill.js",
  "search-engine.js",
];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load(files, windowSeed = {}) {
  const sandbox = { window: windowSeed };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  for (const file of files) {
    vm.runInContext(
      fs.readFileSync(path.join(demo, file), "utf8"),
      sandbox,
      { filename: file },
    );
  }
  return sandbox.window;
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  assert.ok(match, `${name} is missing from ${tag}`);
  return match[1];
}

function commaList(value) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function makeStage() {
  const listeners = new Map();
  const attributes = new Map();
  const stage = {
    innerHTML: "<p>MEMORY OS HOME</p>",
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
    removeEventListener(name, handler) {
      if (listeners.get(name) === handler) listeners.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const document = {
    activeElement: null,
    body: {
      classList: {
        contains() {
          return false;
        },
      },
    },
    getElementById(id) {
      return id === "memoryStage" ? stage : null;
    },
  };
  return { attributes, document, listeners, stage };
}

function createSearchEngine() {
  const window = load(searchFiles);
  return window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
    window.WWAM_CHARACTER_LORE,
    window.WWAM_ARCHIVE_DEEP,
  );
}

test("V5.13 stays a correctly ordered lazy Memory OS enhancement", () => {
  const memoryTag = html.match(/<section\b[^>]*\bid="memory"[^>]*>/);
  assert.ok(memoryTag, "The Memory OS section is missing.");

  const styles = commaList(attribute(memoryTag[0], "data-feature-styles"));
  const scripts = commaList(attribute(memoryTag[0], "data-feature-scripts"));
  assert.deepEqual(styles.slice(0, 2), [
    "longitudinal-docket.css",
    "riff-black-box.css",
  ]);
  assert.deepEqual(scripts.slice(0, longitudinalFiles.length + 2), [
    ...longitudinalFiles,
    "riff-black-box-engine.js",
    "riff-black-box-ui.js",
  ]);

  for (const file of [...styles, ...longitudinalFiles]) {
    assert.ok(
      fs.statSync(path.join(demo, file)).size > 0,
      `${file} must exist and be non-empty`,
    );
  }

  const eagerScripts = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
    (match) => match[1],
  );
  for (const file of longitudinalFiles) {
    assert.equal(
      eagerScripts.includes(file),
      false,
      `${file} must remain lazy`,
    );
  }
  assert.doesNotMatch(
    html,
    /<link\b[^>]*\bhref="longitudinal-docket\.css"/,
  );

  assert.equal(eagerScripts.includes("pitch-tour-data.js"), false);
  assert.match(
    app,
    /loadDemoScript\("pitch-tour-data\.js"\)[\s\S]{0,160}WWAM_PITCH_TOUR/,
    "Showcase Mode data must remain demand-loaded.",
  );
});

test("the score tab owns its hash route, direct reopen, and non-score exit", () => {
  assert.match(
    html,
    /<button id="tape-keeps-score" data-memory-tab="score">THE TAPE KEEPS SCORE<\/button>/,
  );
  assert.match(
    app,
    /state\.memoryTab = button\.getAttribute\("data-memory-tab"\);[\s\S]{0,180}state\.memoryTab === "score"[\s\S]{0,180}#tape-keeps-score[\s\S]{0,180}else if \(location\.hash === "#tape-keeps-score"\)[\s\S]{0,180}#memory[\s\S]{0,120}renderMemory\(\);/,
    "Selecting score must set its route, while another Memory tab clears it.",
  );
  assert.match(
    app,
    /addEventListener\("hashchange", function \(\) \{\s*if \(location\.hash !== "#tape-keeps-score"\) return;\s*document\.getElementById\("tape-keeps-score"\)\.click\(\);\s*\}\);/,
    "A new score hash must reopen the score tab.",
  );
  assert.match(
    app,
    /else if \(location\.hash === "#tape-keeps-score"\) \{\s*setTimeout\(function \(\) \{ document\.getElementById\("tape-keeps-score"\)\.click\(\); \}, 50\);/,
    "A direct page load at the score hash must open the score tab.",
  );
  assert.match(
    app,
    /var scoreLink = document\.querySelector\('#askResults a\[href="#tape-keeps-score"\]'\);[\s\S]{0,120}scoreLink\.onclick = function \(\) \{\s*state\.memoryTab = "score";\s*renderMemory\(\);\s*\};/,
    "Ask must reopen score directly even when the URL already has the same hash.",
  );
});

test("Ask hands one exact subject through the score route", () => {
  const answer = plain(
    createSearchEngine().ask("did the Scream 7 commentary promise happen?"),
  );

  assert.equal(answer.status, "longitudinal-handoff");
  assert.equal(answer.intent, "longitudinal");
  assert.deepEqual(answer.results, []);
  assert.deepEqual(answer.longitudinalHandoff, {
    id: "tape-keeps-score",
    surface: "longitudinal-docket",
    href: "#tape-keeps-score",
    label: "THE TAPE KEEPS SCORE",
    intent: "longitudinal",
    reason:
      "Prediction and outcome comparisons belong to the typed, receipt-linked longitudinal docket.",
    mode: "subject",
    query: "did the Scream 7 commentary promise happen?",
    subjectId: "film:scream-7",
    subject: "Scream 7",
    subjectType: "film",
  });
  assert.deepEqual(
    answer.selectionPlan.longitudinalHandoff,
    answer.longitudinalHandoff,
  );
  assert.match(answer.answer, /has not independently proved/i);
});

test("the WWAM adapter compiles, remounts, and destroys one active controller", () => {
  const compileCalls = [];
  const createCalls = [];
  const controllers = [];
  const pack = Object.freeze({
    fingerprint: "cp1-adapter-contract",
    capabilities: Object.freeze(["longitudinal-claim-ledger"]),
  });
  const data = Object.freeze({ schema: "longitudinal-adapter-fixture" });
  const wwamAdapter = Object.freeze({ id: "wwam-adapter-fixture" });
  const window = load(["wwam-longitudinal-docket-adapter.js"], {
    ShokkerChannelPack: {
      compile(dna, adapter) {
        compileCalls.push({ adapter, dna });
        return pack;
      },
    },
    WWAM_CHANNEL_PACK_ADAPTER: wwamAdapter,
    WWAM_LONGITUDINAL_DOCKETS: data,
    WWAMLongitudinalDocketUI: {
      create(options) {
        createCalls.push(options);
        const id = controllers.length + 1;
        const controller = {
          destroyCount: 0,
          mountCount: 0,
          destroy() {
            this.destroyCount += 1;
          },
          mount() {
            this.mountCount += 1;
            return `mounted:${id}`;
          },
        };
        controllers.push(controller);
        return controller;
      },
    },
  });
  const stage = { id: "memoryStage" };
  const dna = { id: "wwam" };

  assert.equal(
    window.WWAMLongitudinalDocketDemo.mount(
      stage,
      dna,
      "film:scream-7",
    ),
    "mounted:1",
  );
  assert.equal(compileCalls.length, 1);
  assert.equal(compileCalls[0].dna, dna);
  assert.equal(compileCalls[0].adapter, wwamAdapter);
  assert.equal(createCalls[0].channelPack, pack);
  assert.equal(createCalls[0].data, data);
  assert.equal(createCalls[0].mount, stage);
  assert.equal(createCalls[0].initialSubjectId, "film:scream-7");
  assert.equal(createCalls[0].restoreFocusOnDestroy, false);
  assert.equal(controllers[0].mountCount, 1);

  assert.equal(
    window.WWAMLongitudinalDocketDemo.mount(
      stage,
      dna,
      "film:halloween-ends",
    ),
    "mounted:2",
  );
  assert.equal(controllers[0].destroyCount, 1);
  assert.equal(createCalls[1].initialSubjectId, "film:halloween-ends");
  assert.equal(controllers[1].mountCount, 1);

  window.WWAMLongitudinalDocketDemo.destroy();
  window.WWAMLongitudinalDocketDemo.destroy();
  assert.equal(
    controllers[1].destroyCount,
    1,
    "Adapter destroy must be idempotent after clearing the active controller.",
  );
});

test("the real adapter renders zero verdicts under one universal ChannelPack contract", () => {
  const dom = makeStage();
  const window = load([
    "wwam-channel-dna.js",
    ...longitudinalFiles,
  ], { document: dom.document });
  const pack = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER,
  );
  const racing = window.ShokkerChannelPack.compile(
    NEUTRAL_RACING_DNA,
    NEUTRAL_RACING_ADAPTER,
  );

  assert.equal(pack.fingerprint, "cp1-dd23bc386008689b");
  assert.equal(
    window.WWAM_LONGITUDINAL_DOCKETS.channel.packFingerprint,
    pack.fingerprint,
  );
  assert.equal(
    window.WWAM_LONGITUDINAL_DOCKETS.fingerprints.publicFnv1a,
    "fnv1a32:59b085f6",
  );
  assert.equal(
    window.WWAM_LONGITUDINAL_DOCKETS.fingerprints.captionSetSha256,
    "sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc",
  );
  assert.equal(window.WWAM_LONGITUDINAL_DOCKETS.sources.length, 8);
  assert.equal(window.WWAM_LONGITUDINAL_DOCKETS.dockets.length, 4);
  assert.deepEqual(
    plain(window.WWAM_LONGITUDINAL_DOCKETS.dockets.map(
      (docket) => docket.pairSignal,
    ).sort()),
    ["MAY_BE_MIXED", "MAY_SUPPORT", "OPEN", "OPEN"],
  );
  assert.equal(window.ShokkerChannelPack.validate(pack).valid, true);
  assert.equal(window.ShokkerChannelPack.validate(racing).valid, true);
  assert.equal(
    pack.capabilities.filter(
      (capability) => capability === "longitudinal-claim-ledger",
    ).length,
    1,
  );
  assert.equal(
    racing.capabilities.filter(
      (capability) => capability === "longitudinal-claim-ledger",
    ).length,
    1,
  );
  assert.notEqual(racing.fingerprint, pack.fingerprint);
  assert.equal(
    window.ShokkerChannelPack.validatePortfolio([pack, racing]).valid,
    true,
  );

  const controller = window.WWAMLongitudinalDocketDemo.mount(
    dom.stage,
    window.WWAM_CHANNEL_DNA,
    "film:scream-7",
  );
  const state = plain(controller.getState());
  assert.equal(state.subjectId, "film:scream-7");
  assert.equal(state.docketCount, 1);
  assert.equal(state.error, "");
  assert.match(state.status, /ZERO PUBLIC VERDICTS/);
  assert.match(
    dom.stage.innerHTML,
    /<b>0<\/b><span>PUBLIC VERDICTS<\/span>/,
  );
  assert.doesNotMatch(
    dom.stage.innerHTML,
    /\b(?:confirmed|debunked|proved right|proved wrong|prediction correct|prediction wrong)\b/i,
  );
  assert.ok(
    window.WWAM_LONGITUDINAL_DOCKETS.dockets.every((docket) => (
      docket.verdict === null &&
      docket.relationship === "MAY_RESOLVE" &&
      docket.resolutionStatus === "unresolved"
    )),
  );

  window.WWAMLongitudinalDocketDemo.destroy();
  assert.equal(dom.stage.innerHTML, "<p>MEMORY OS HOME</p>");
  assert.equal(dom.listeners.size, 0);
  assert.equal(dom.attributes.has("data-longitudinal-host"), false);
});
