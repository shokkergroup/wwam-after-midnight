import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const uiPath = path.join(demo, "riff-black-box-ui.js");
const cssPath = path.join(demo, "riff-black-box.css");
const htmlPath = path.join(demo, "index.html");
const uiSource = fs.readFileSync(uiPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const html = fs.readFileSync(htmlPath, "utf8");

function loadApi() {
  const context = { window: { URL, Promise } };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(uiSource, context, { filename: "riff-black-box-ui.js" });
  return context.window.WWAMRiffBlackBoxUI;
}

function classList(initial = []) {
  const classes = new Set(initial);
  return {
    add(...values) { values.forEach((value) => classes.add(value)); },
    remove(...values) { values.forEach((value) => classes.delete(value)); },
    contains(value) { return classes.has(value); },
    toggle(value, force) {
      if (force === true || (force == null && !classes.has(value))) classes.add(value);
      else classes.delete(value);
    },
  };
}

function node(tagName = "div") {
  const attributes = new Map();
  const listeners = new Map();
  const children = [];
  const value = {
    tagName: tagName.toUpperCase(),
    parentElement: null,
    classList: classList(),
    hidden: false,
    inert: false,
    innerHTML: "",
    textContent: "",
    style: {},
    onclick: null,
    focusCount: 0,
    setAttribute(name, entry) { attributes.set(name, String(entry)); },
    getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
    removeAttribute(name) { attributes.delete(name); },
    addEventListener(name, handler) {
      if (!listeners.has(name)) listeners.set(name, []);
      listeners.get(name).push(handler);
    },
    removeEventListener(name, handler) {
      if (!listeners.has(name)) return;
      listeners.set(name, listeners.get(name).filter((item) => item !== handler));
    },
    dispatch(name, event = {}) {
      const input = {
        target: value,
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
        ...event,
      };
      (listeners.get(name) || []).slice().forEach((handler) => handler(input));
      if (name === "click" && typeof value.onclick === "function") value.onclick(input);
    },
    appendChild(child) {
      children.push(child);
      child.parentElement = value;
      return child;
    },
    remove() {},
    focus() { value.focusCount += 1; },
    select() {},
    click() { value.dispatch("click"); },
    contains(candidate) {
      let current = candidate;
      while (current) {
        if (current === value) return true;
        current = current.parentElement;
      }
      return false;
    },
    matches(selector) {
      if (selector === 'button[data-memory-source][data-id][data-time]') {
        return value.tagName === "BUTTON" &&
          attributes.has("data-memory-source") &&
          attributes.has("data-id") &&
          attributes.has("data-time");
      }
      return false;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  return value;
}

function anchor() {
  return {
    receiptId: "riff:one",
    sourceId: "source00001",
    sourceTitle: "A fucking funny source",
    sourceType: "livestream",
    date: "2026-07-23",
    at: 90,
    t: 90,
    timecode: "1:30",
    url: "https://www.youtube.com/watch?v=source00001&t=90s",
    category: "ROOM BREAK",
    score: 91,
    scoreLabel: "TOTAL DERAILMENT",
    dimensions: {
      heat: 90,
      escalation: 95,
      callbackDensity: 80,
      derailment: 99,
      roomBreak: 90,
      topicCollision: 60,
    },
    weights: {
      heat: 0.28,
      escalation: 0.2,
      callbackDensity: 0.16,
      derailment: 0.16,
      roomBreak: 0.14,
      topicCollision: 0.06,
    },
    weightedContributions: {
      heat: 25.2,
      escalation: 19,
      callbackDensity: 12.8,
      derailment: 15.84,
      roomBreak: 12.6,
      topicCollision: 3.6,
    },
    recomputedScore: 91,
    scoreDrift: 0,
    literalBasis: {
      excerpt: "This fucking room has completely lost the movie.",
      excerptWordCount: 8,
      excerptSourceWordCount: 8,
      excerptWordLimit: 16,
      excerptTruncated: false,
      sourceHeat: 90,
      matchedBits: 2,
      indexedSubjects: 3,
      category: "ROOM BREAK",
      basisStatus: "Deterministic promoted inputs; not a causal explanation.",
    },
    reactionCue: {
      status: "unknown",
      label: "UNKNOWN",
      literal: null,
      basis: "No allowed literal reaction phrase appears.",
    },
    speaker: null,
    speakerStatus: "not-diarized",
  };
}

function inspection() {
  const item = anchor();
  return {
    schema: "shokker-youtube-wiki/riff-black-box/v1/inspection",
    anchor: item,
    source: {
      sourceId: item.sourceId,
      title: item.sourceTitle,
      durationSeconds: 600,
    },
    contextWindow: {
      start: 75,
      startTimecode: "1:15",
      startUrl: "https://www.youtube.com/watch?v=source00001&t=75s",
      anchor: 90,
      anchorTimecode: "1:30",
      anchorUrl: item.url,
      end: 110,
      endTimecode: "1:50",
      requestedBeforeSeconds: 15,
      requestedAfterSeconds: 20,
      dialogueReconstructed: false,
    },
    neighbors: {
      before: {
        sourceId: item.sourceId,
        category: "TOPIC TURN",
        at: 30,
        timecode: "0:30",
        url: "https://www.youtube.com/watch?v=source00001&t=30s",
        excerpt: "The movie conversation turns.",
        deltaSeconds: 60,
        speaker: null,
      },
      after: null,
      maximumDistanceSeconds: 900,
    },
    dimensions: item.dimensions,
    weights: item.weights,
    weightedContributions: item.weightedContributions,
    literalBasis: item.literalBasis,
    reactionCue: item.reactionCue,
    recomputedScore: 91,
    scoreDrift: 0,
    speaker: null,
    speakerStatus: "not-diarized",
  };
}

function harness({ match = true, reduced = false } = {}) {
  const ids = [
    "memory",
    "riffBlackBox",
    "riffBlackBoxClose",
    "riffBlackBoxTitle",
    "riffBlackBoxStage",
    "riffBlackBoxStatus",
  ];
  const nodes = new Map(ids.map((id) => [id, node(id === "riffBlackBoxClose" ? "button" : "div")]));
  const section = nodes.get("memory");
  const drawer = nodes.get("riffBlackBox");
  const close = nodes.get("riffBlackBoxClose");
  const title = nodes.get("riffBlackBoxTitle");
  const stage = nodes.get("riffBlackBoxStage");
  const status = nodes.get("riffBlackBoxStatus");
  const copy = node("button");
  const download = node("button");
  drawer.appendChild(close);
  drawer.appendChild(title);
  drawer.appendChild(stage);
  drawer.appendChild(status);
  stage.querySelector = (selector) => ({
    "[data-riff-copy]": copy,
    "[data-riff-download]": download,
  })[selector] || null;
  drawer.querySelectorAll = () => [close, copy, download];

  const documentListeners = new Map();
  const body = node("body");
  body.classList = classList(reduced ? ["office-bleep"] : []);
  const document = {
    body,
    activeElement: null,
    getElementById(id) { return nodes.get(id) || null; },
    createElement(tag) { return node(tag); },
    addEventListener(name, handler) {
      if (!documentListeners.has(name)) documentListeners.set(name, []);
      documentListeners.get(name).push(handler);
    },
    removeEventListener(name, handler) {
      documentListeners.set(
        name,
        (documentListeners.get(name) || []).filter((item) => item !== handler),
      );
    },
    dispatch(name, event = {}) {
      const input = {
        key: "",
        target: document.activeElement,
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
        ...event,
      };
      (documentListeners.get(name) || []).slice().forEach((handler) => handler(input));
    },
  };

  const dimensions = [
    ["heat", "SOURCE HEAT", 0.28],
    ["escalation", "ESCALATION", 0.2],
    ["callbackDensity", "CALLBACK DENSITY", 0.16],
    ["derailment", "DERAILMENT", 0.16],
    ["roomBreak", "ROOM BREAK", 0.14],
    ["topicCollision", "TOPIC COLLISION", 0.06],
  ].map(([id, label, weight]) => ({ id, label, weight }));
  let verifyCount = 0;
  let serializeCount = 0;
  let inspectCount = 0;
  const packet = Object.freeze({
    schema: "shokker-youtube-wiki/riff-black-box/v1/inspection-packet",
    fingerprint: "fnv1a32:fixture",
  });
  const engine = {
    labels: { dimensions: Object.fromEntries(dimensions.map((item) => [item.id, item.label])) },
    dimensions,
    weights: Object.fromEntries(dimensions.map((item) => [item.id, item.weight])),
    metrics: { anchorCount: 301 },
    binding: { chemistryFingerprint: "fnv1a32:chemistry" },
    formula: "28% source heat + 20% escalation + 16% callback density + 16% derailment + 14% room break + 6% topic collision",
    list({ sourceId }) {
      return match && sourceId === "source00001" ? [anchor()] : [];
    },
    inspect(receiptId) {
      inspectCount += 1;
      return receiptId === "riff:one" ? inspection() : null;
    },
    snapshot() { return packet; },
    verify(value) {
      verifyCount += 1;
      return { ok: value === packet };
    },
    serialize(value) {
      serializeCount += 1;
      assert.equal(value, packet);
      return JSON.stringify(value);
    },
    inspectionPacket(receiptId) {
      assert.equal(receiptId, "riff:one");
      return packet;
    },
    verifyInspection(value) {
      verifyCount += 1;
      return { ok: value === packet };
    },
    serializeInspection(value) {
      serializeCount += 1;
      assert.equal(value, packet);
      return JSON.stringify(value);
    },
  };
  let copied = "";
  let downloaded = null;
  const controller = loadApi().create({
    engine,
    document,
    navigator: {},
    copyText(value) { copied = value; },
    download(name, contents) { downloaded = { name, contents }; },
  });
  controller.mount();

  const chemistry = node("div");
  chemistry.classList.add("chemistry-grid");
  chemistry.parentElement = section;
  const button = node("button");
  button.setAttribute("data-memory-source", "livestream");
  button.setAttribute("data-id", "source00001");
  button.setAttribute("data-time", "90");
  button.textContent = "INSPECT THE RIFF";
  button.parentElement = chemistry;

  return {
    controller,
    document,
    nodes,
    section,
    drawer,
    close,
    title,
    stage,
    status,
    copy,
    download,
    button,
    readCopied: () => copied,
    readDownloaded: () => downloaded,
    readVerifyCount: () => verifyCount,
    readSerializeCount: () => serializeCount,
    readInspectCount: () => inspectCount,
  };
}

test("Comedy Black Box is one lazy enhancement on the existing Memory OS", () => {
  assert.match(
    html,
    /<section class="memory-os" id="memory"\s+data-feature-styles="riff-black-box\.css"\s+data-feature-scripts="riff-black-box-engine\.js,riff-black-box-ui\.js">/,
  );
  assert.doesNotMatch(html, /<script[^>]+src="riff-black-box-(?:engine|ui)\.js"/);
  assert.doesNotMatch(html, /<link[^>]+href="riff-black-box\.css"/);
  assert.match(html, /data-memory-tab="chemistry">RIFF CHEMISTRY<\/button>/);
  assert.doesNotMatch(html, /href="#riff-black-box"/);
});

test("the static drawer is sealed, labeled, modal, and inert before hydration", () => {
  assert.match(
    html,
    /id="riffBlackBox" hidden inert aria-hidden="true"\s+role="dialog" aria-modal="true"/,
  );
  assert.match(html, /aria-labelledby="riffBlackBoxTitle"/);
  assert.match(html, /aria-describedby="riffBlackBoxTruth"/);
  assert.match(html, /id="riffBlackBoxClose" type="button"\s+aria-label="Close Comedy Black Box"/);
  assert.match(
    html,
    /id="riffBlackBoxStatus" role="status"\s+aria-live="polite" aria-atomic="true"/,
  );
});

test("capture delegation intercepts only an exact Chemistry source-plus-second match", () => {
  const app = harness();
  let prevented = 0;
  let stopped = 0;
  app.section.dispatch("click", {
    target: app.button,
    preventDefault() { prevented += 1; },
    stopPropagation() { stopped += 1; },
    stopImmediatePropagation() { stopped += 1; },
  });
  const state = app.controller.getState();

  assert.equal(prevented, 1);
  assert.equal(stopped, 2);
  assert.equal(app.readInspectCount(), 1);
  assert.equal(state.open, true);
  assert.equal(state.receiptId, "riff:one");
  assert.equal(app.drawer.hidden, false);
  assert.equal(app.drawer.getAttribute("aria-hidden"), "false");
  assert.equal(app.title.focusCount, 1);
  assert.match(app.stage.innerHTML, /COMEDY BLACK BOX|SIX CHANNELS ENTER/);
});

test("identical source buttons outside Riff Chemistry keep their original behavior", () => {
  const app = harness();
  const outside = node("button");
  outside.setAttribute("data-memory-source", "livestream");
  outside.setAttribute("data-id", "source00001");
  outside.setAttribute("data-time", "90");
  outside.parentElement = app.section;
  let prevented = 0;
  app.section.dispatch("click", {
    target: outside,
    preventDefault() { prevented += 1; },
  });

  assert.equal(prevented, 0);
  assert.equal(app.readInspectCount(), 0);
  assert.equal(app.controller.getState().open, false);
});

test("an unmatched chemistry coordinate fails closed without inventing an autopsy", () => {
  const app = harness({ match: false });
  app.section.dispatch("click", { target: app.button });

  assert.equal(app.controller.getState().open, true);
  assert.equal(app.controller.getState().receiptId, "");
  assert.equal(app.readInspectCount(), 0);
  assert.match(app.stage.innerHTML, /BLACK BOX HELD/);
  assert.match(app.stage.innerHTML, /NO CLAIM LEFT THE MACHINE/);
  assert.match(app.stage.innerHTML, /exact promoted source-plus-second/i);
  assert.doesNotMatch(app.stage.innerHTML, /SIX CHANNELS ENTER/);
});

test("the autopsy exposes all dimensions, literal limits, and non-causal neighborhood language", () => {
  const app = harness();
  app.section.dispatch("click", { target: app.button });
  const markup = app.stage.innerHTML;

  for (const label of [
    "SOURCE HEAT",
    "ESCALATION",
    "CALLBACK DENSITY",
    "DERAILMENT",
    "ROOM BREAK",
    "TOPIC COLLISION",
  ]) {
    assert.ok(markup.includes(label), label);
  }
  assert.equal((markup.match(/role="progressbar"/g) || []).length, 6);
  assert.match(markup, /91 RECOMPUTED \/\/ 0 DRIFT/);
  assert.match(markup, /REACTION CHANNEL/);
  assert.match(markup, />UNKNOWN</);
  assert.match(markup, /SPEAKER: NULL \/\/ NOT DIARIZED/);
  assert.match(markup, /RUNWAY \/ IMPACT \/ AFTERSHOCK/);
  assert.match(markup, /not a causal setup or payoff/i);
  assert.match(markup, /NO INDEXED NEIGHBOR INSIDE ±15:00/);
  assert.match(markup, /target="_blank" rel="noopener"/);
  assert.doesNotMatch(markup, /<iframe|<video|autoplay\s*=/i);
});

test("Escape closes the drawer and restores focus to the intercepted card", () => {
  const app = harness();
  app.section.dispatch("click", { target: app.button });
  app.document.dispatch("keydown", { key: "Escape" });

  assert.equal(app.controller.getState().open, false);
  assert.equal(app.drawer.hidden, true);
  assert.equal(app.drawer.getAttribute("aria-hidden"), "true");
  assert.equal(app.drawer.getAttribute("inert"), "");
  assert.equal(app.button.focusCount, 1);
});

test("copy and download reverify and serialize only the selected autopsy packet", async () => {
  const app = harness();
  app.section.dispatch("click", { target: app.button });
  app.copy.onclick();
  await Promise.resolve();
  app.download.onclick();

  assert.equal(app.readVerifyCount(), 2);
  assert.equal(app.readSerializeCount(), 2);
  assert.deepEqual(JSON.parse(app.readCopied()), {
    schema: "shokker-youtube-wiki/riff-black-box/v1/inspection-packet",
    fingerprint: "fnv1a32:fixture",
  });
  assert.match(
    app.readDownloaded().name,
    /^wwam-comedy-black-box-riff-one-fnv1a32-fixture\.json$/,
  );
  assert.doesNotMatch(app.readDownloaded().contents, /caption|transcript|events/i);
});

test("reduced-language mode masks the visible autopsy without mutating its packet", () => {
  const app = harness({ reduced: true });
  app.section.dispatch("click", { target: app.button });

  assert.match(app.stage.innerHTML, /A \[BLEEP\] funny source/);
  assert.match(app.stage.innerHTML, /This \[BLEEP\] room/);
  assert.doesNotMatch(app.stage.innerHTML, /\bfucking\b/i);
});

test("runtime construction is closure-independent and binds the documented engine settings", () => {
  assert.match(uiSource, /WWAMShowcaseEngine\.create\(\{/);
  assert.match(uiSource, /ShokkerRiffBlackBoxEngine\.create\(\{/);
  assert.match(uiSource, /showcase:\s*showcase/);
  assert.match(uiSource, /contextSeconds:\s*15/);
  assert.match(uiSource, /neighborhoodSeconds:\s*900/);
  assert.match(uiSource, /packFingerprint:\s*showcase\.inputFingerprint/);
  assert.match(uiSource, /addEventListener\(eventName,\s*handler,\s*optionsValue\)/);
  assert.match(uiSource, /stopImmediatePropagation/);
  assert.doesNotMatch(uiSource, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
});

test("the isolated visual layer is responsive, focus-visible, and motion-safe", () => {
  assert.ok(fs.statSync(uiPath).size < 30_000);
  assert.ok(fs.statSync(cssPath).size < 16_000);
  assert.match(css, /V5\.10 \/\/ COMEDY BLACK BOX/);
  assert.match(css, /\.riff-black-box :where\(a, button, \[tabindex\]\):focus-visible/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation:\s*none !important/);
});
