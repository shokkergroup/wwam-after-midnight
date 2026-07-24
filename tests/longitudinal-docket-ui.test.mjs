import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const uiPath = path.join(demo, "longitudinal-docket-ui.js");
const cssPath = path.join(demo, "longitudinal-docket.css");
const uiSource = fs.readFileSync(uiPath, "utf8");
const cssSource = fs.readFileSync(cssPath, "utf8");
const runtimeFiles = [
  "wwam-channel-dna.js",
  "wwam-channel-pack-adapter.js",
  "channel-pack-contract.js",
  "longitudinal-docket-data.js",
  "longitudinal-docket-engine.js",
  "longitudinal-docket-ui.js",
];
const forbiddenVerdicts = [
  "CALLED THAT SHIT",
  "AGED LIKE ROADKILL",
  "HALF PROPHET-HALF JACKASS",
];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadRuntime() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of runtimeFiles) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  }
  const { window } = sandbox;
  const channelPack = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER,
  );
  const engine = window.ShokkerLongitudinalDocket.create({
    channelPack,
    data: window.WWAM_LONGITUDINAL_DOCKETS,
  });
  return {
    api: window.WWAMLongitudinalDocketUI,
    channelPack,
    data: window.WWAM_LONGITUDINAL_DOCKETS,
    engine,
  };
}

function makeNode(documentRef, attributes = {}) {
  const attrs = new Map(
    Object.entries(attributes).map(([key, value]) => [key, String(value)]),
  );
  return {
    parentElement: null,
    value: "",
    textContent: "",
    hidden: false,
    focusCount: 0,
    clickCount: 0,
    setAttribute(name, value) {
      attrs.set(name, String(value));
    },
    getAttribute(name) {
      return attrs.has(name) ? attrs.get(name) : null;
    },
    removeAttribute(name) {
      attrs.delete(name);
    },
    focus() {
      this.focusCount += 1;
      documentRef.activeElement = this;
    },
    click() {
      this.clickCount += 1;
    },
    remove() {},
  };
}

function makeDom() {
  const listenerMap = new Map();
  const attributeMap = new Map();
  const focusNodes = new Map();
  const selectionNodes = new Map();
  const returnFocus = { focusCount: 0, focus() { this.focusCount += 1; } };
  const documentRef = {
    activeElement: returnFocus,
    body: {
      classList: { contains() { return false; } },
      appendChild() {},
    },
    getElementById(id) {
      return id === "memoryStage" ? root : null;
    },
    createElement() {
      return makeNode(documentRef);
    },
  };
  const statusNode = makeNode(documentRef);

  function selectionNode(id) {
    if (!selectionNodes.has(id)) {
      const node = makeNode(documentRef, {
        "data-longitudinal-select": id,
        "data-longitudinal-focus": `docket:${id}`,
      });
      node.parentElement = root;
      selectionNodes.set(id, node);
      focusNodes.set(`docket:${id}`, node);
    }
    return selectionNodes.get(id);
  }

  function focusNode(key) {
    if (focusNodes.has(key)) return focusNodes.get(key);
    const attributes = { "data-longitudinal-focus": key };
    if (key === "subject-filter") {
      attributes["data-longitudinal-subject"] = "";
    } else if (key.startsWith("duration:")) {
      attributes["data-longitudinal-duration"] = key.slice("duration:".length);
    } else if (key.startsWith("download:")) {
      attributes["data-longitudinal-download"] = "";
    }
    const node = makeNode(documentRef, attributes);
    node.parentElement = root;
    focusNodes.set(key, node);
    return node;
  }

  const root = {
    innerHTML: "<p>MEMORY OS HOME</p>",
    addEventListener(name, handler) {
      listenerMap.set(name, handler);
    },
    removeEventListener(name, handler) {
      if (listenerMap.get(name) === handler) listenerMap.delete(name);
    },
    setAttribute(name, value) {
      attributeMap.set(name, String(value));
    },
    getAttribute(name) {
      return attributeMap.has(name) ? attributeMap.get(name) : null;
    },
    removeAttribute(name) {
      attributeMap.delete(name);
    },
    querySelector(selector) {
      if (selector === "[data-longitudinal-status]") return statusNode;
      const match = selector.match(
        /^\[data-longitudinal-focus="([^"]+)"\]$/,
      );
      return match ? focusNode(match[1]) : null;
    },
    querySelectorAll(selector) {
      if (selector !== "[data-longitudinal-select]") return [];
      const ids = [];
      const pattern = /data-longitudinal-select="([^"]+)"/g;
      let match;
      while ((match = pattern.exec(root.innerHTML))) ids.push(match[1]);
      return ids.map(selectionNode);
    },
    dispatch(name, event = {}) {
      const handler = listenerMap.get(name);
      const envelope = {
        preventDefault() {
          envelope.defaultPrevented = true;
        },
        defaultPrevented: false,
        ...event,
      };
      if (handler) handler(envelope);
      return envelope;
    },
  };

  return {
    document: documentRef,
    root,
    returnFocus,
    statusNode,
    focusNode,
    selectionNode,
    listenerMap,
    attributeMap,
  };
}

function mounted(options = {}) {
  const runtime = loadRuntime();
  const dom = makeDom();
  const downloads = [];
  const controller = runtime.api.create({
    engine: options.engine || runtime.engine,
    document: dom.document,
    mount: dom.root,
    download(name, contents) {
      downloads.push({ name, contents });
    },
    restoreFocusOnDestroy: options.restoreFocusOnDestroy,
    restoreOnDestroy: options.restoreOnDestroy,
    initialSubjectId: options.initialSubjectId,
  });
  controller.mount();
  return {
    ...runtime,
    ...dom,
    controller,
    downloads,
  };
}

function assertNoPublicVerdict(markup) {
  for (const phrase of forbiddenVerdicts) {
    assert.doesNotMatch(markup, new RegExp(phrase, "i"));
  }
  assert.doesNotMatch(markup, /\b(?:confirmed|debunked|proved right|proved wrong)\b/i);
}

test("the lazy public API is deterministic and never mounts itself", () => {
  const { api } = loadRuntime();

  assert.equal(api.VERSION, "1.0.0");
  assert.deepEqual(plain(api.EDIT_DURATIONS), [30, 60, 90]);
  assert.deepEqual(
    plain(api.PAIR_SIGNALS),
    ["MAY_SUPPORT", "MAY_BE_MIXED", "OPEN"],
  );
  assert.equal(api.timecode(3_661), "01:01:01");
  assert.equal(
    api.officialLink({
      sourceId: "I6QKteG_hK0",
      t: 6823.679,
      url: "https://www.youtube.com/watch?v=I6QKteG_hK0&t=6823s",
    }),
    "https://www.youtube.com/watch?v=I6QKteG_hK0&t=6823s",
  );
  assert.equal(
    api.officialLink({
      sourceId: "too-short",
      t: 9,
      url: "https://example.test/not-official",
    }),
    "",
  );
  assert.deepEqual(plain(api.statusCopy("OPEN")), {
    formal: "OPEN",
    comedy: "THE JURY IS STILL BUYING POPCORN.",
  });
  assert.throws(() => api.statusCopy("MACHINE_SAYS_YES"), /held/i);
  assert.doesNotMatch(uiSource, /\.mount\(\)\s*;?\s*\}\)\(/);
});

test("the global factory can construct its engine from a pack and frozen data", () => {
  const runtime = loadRuntime();
  const dom = makeDom();
  const controller = runtime.api.create({
    channelPack: runtime.channelPack,
    data: runtime.data,
    document: dom.document,
    mount: dom.root,
    initialSubjectId: "film:scream-7",
    download() {},
  });

  controller.mount();
  assert.equal(controller.getState().docketCount, 1);
  assert.equal(
    controller.getState().selectedId,
    "docket:scream-7-commentary-plan-open",
  );
  assert.match(dom.root.innerHTML, /THE JURY IS STILL BUYING POPCORN/);
  controller.destroy();
});

test("real V5.13 data renders an honest before/status/after evidence docket", () => {
  const harness = mounted();
  harness.root.dispatch("click", {
    target: harness.selectionNode(
      "docket:halloween-ends-excitement-to-mixed-reaction",
    ),
  });
  const markup = harness.root.innerHTML;
  const state = harness.controller.getState();

  assert.equal(harness.channelPack.fingerprint, "cp1-f9ad38be22481b5d");
  assert.equal(harness.engine.verify().ok, true);
  assert.equal(state.mounted, true);
  assert.equal(state.docketCount, 4);
  assert.equal(
    state.selectedId,
    "docket:halloween-ends-excitement-to-mixed-reaction",
  );
  assert.equal(state.error, "");

  assert.match(markup, /V5\.13 \/\/ THE TAPE KEEPS SCORE/);
  assert.match(markup, /SCREAM 7 \/\/ 1 PAIR<\/option>/);
  assert.doesNotMatch(markup, /\/\/ 1 PAIRS<\/option>/);
  assert.match(markup, /BEFORE TAPE \/\/ FORECAST CANDIDATE/);
  assert.match(markup, /AFTER TAPE \/\/ RESPONSE CANDIDATE/);
  assert.match(markup, /MACHINE PAIR SIGNAL \/\/ NOT A VERDICT/);
  assert.match(markup, /MACHINE SIGNAL: MAY BE MIXED \/\/ NOT A VERDICT/);
  assert.match(markup, /THE TAPE PLEADS THE FIFTH\./);
  assert.match(markup, /THE TAPE BROUGHT A SECOND LAWYER\./);
  assert.match(markup, /MAY BE MIXED/);
  assert.match(markup, /UNREVIEWED/);
  assert.match(markup, /PUBLIC VERDICT WITHHELD/);
  assert.match(markup, /WHY THESE TAPES SHARE A DOCKET/);
  assert.match(markup, /MIXED RESPONSE RECEIPTS/);
  assert.match(markup, /AUTHENTICATED HUMAN REVIEW REQUIRED/);

  assert.match(markup, /4<\/b><span>BOUNDED PAIRS ON THE DOCKET/);
  assert.match(markup, /4<\/b><span>PAIRS SHOWN/);
  assert.match(markup, /3<\/b><span>TIMESTAMPED RECEIPTS IN OPEN DOCKET/);
  assert.match(markup, /8<\/b><span>DISTINCT OFFICIAL TAPES IN FILTER/);
  assert.match(markup, /0<\/b><span>PUBLIC VERDICTS/);

  assert.match(
    markup,
    /href="https:\/\/www\.youtube\.com\/watch\?v=ETuRUYiQEBM&amp;t=8507s"/,
  );
  assert.match(
    markup,
    /href="https:\/\/www\.youtube\.com\/watch\?v=I6QKteG_hK0&amp;t=6817s"/,
  );
  assert.match(
    markup,
    /href="https:\/\/www\.youtube\.com\/watch\?v=I6QKteG_hK0&amp;t=6823s"/,
  );
  assert.equal(
    (markup.match(/target="_blank" rel="noopener"/g) || []).length,
    3,
  );
  assert.match(markup, /LATER COUNTERWEIGHT 01/);
  assert.match(markup, /CONTRADICTIONS STAY IN THE ROOM/);
  assert.match(markup, /SOURCE DATE<\/dt><dd>2022-07-28/);
  assert.match(markup, /SOURCE DATE<\/dt><dd>2022-10-18/);
  assert.match(markup, /SOURCE LANE/);
  assert.match(markup, /RIGHTS MODE/);
  assert.match(markup, /EVIDENCE ACCESS/);
  assert.match(markup, /VISUAL CONTEXT/);
  assert.match(markup, /NO AUTOPLAY/);
  assertNoPublicVerdict(markup);
});

test("subject filtering preserves focus and never invents a substitute pair", () => {
  const harness = mounted();
  const subject = harness.focusNode("subject-filter");
  subject.value = "film:scream-7";
  harness.document.activeElement = subject;
  harness.root.dispatch("change", { target: subject });

  const state = harness.controller.getState();
  const markup = harness.root.innerHTML;
  assert.equal(state.subjectId, "film:scream-7");
  assert.equal(state.docketCount, 1);
  assert.equal(state.selectedId, "docket:scream-7-commentary-plan-open");
  assert.equal(harness.document.activeElement, subject);
  assert.ok(subject.focusCount > 0);
  assert.match(markup, /1<\/b><span>PAIRS SHOWN FOR SUBJECT/);
  assert.match(markup, /2<\/b><span>TIMESTAMPED RECEIPTS IN OPEN DOCKET/);
  assert.match(markup, /2<\/b><span>DISTINCT OFFICIAL TAPES IN FILTER/);
  assert.match(markup, /MACHINE PAIR SIGNAL \/\/ NOT A VERDICT<\/span><b>OPEN/);
  assert.match(markup, /THE JURY IS STILL BUYING POPCORN/);
  assert.match(markup, /Scream 7 \/\/ BEFORE TAPE → AFTER TAPE/);
  assert.doesNotMatch(markup, /Halloween Ends \/\/ BEFORE TAPE → AFTER TAPE/);
  assert.equal(
    state.status,
    "1 PAIR SHOWN // EVERY CASE REMAINS OPEN",
  );
  assertNoPublicVerdict(markup);

  subject.value = "film:not-indexed";
  harness.root.dispatch("change", { target: subject });
  assert.equal(harness.controller.getState().docketCount, 0);
  assert.match(harness.root.innerHTML, /DOCKET HELD \/\/ FAILED CLOSED/);
  assert.match(harness.root.innerHTML, /Unknown longitudinal subject ID/);
  assert.doesNotMatch(harness.root.innerHTML, /OPEN BEFORE TAPE/);
});

test("Ask handoffs can land on an exact initial subject through the public API", () => {
  const harness = mounted({ initialSubjectId: "film:scream-vi" });
  let state = harness.controller.getState();

  assert.equal(state.subjectId, "film:scream-vi");
  assert.equal(state.docketCount, 1);
  assert.equal(
    state.selectedId,
    "docket:scream-vi-anticipation-to-reception",
  );
  assert.equal(
    state.status,
    "1 BOUNDED PAIR READY FOR REQUESTED SUBJECT // ZERO PUBLIC VERDICTS",
  );
  assert.match(harness.root.innerHTML, /Scream VI \/\/ BEFORE TAPE → AFTER TAPE/);
  assert.doesNotMatch(
    harness.root.innerHTML,
    /Scream 7 \/\/ BEFORE TAPE → AFTER TAPE/,
  );

  harness.controller.setSubject("topic:anger-to-death-talk");
  state = harness.controller.getState();
  assert.equal(state.subjectId, "topic:anger-to-death-talk");
  assert.equal(state.docketCount, 1);
  assert.equal(state.selectedId, "docket:anger-forecast-to-death-talk");
  assert.match(harness.root.innerHTML, /Halloween \/\/ BEFORE TAPE → AFTER TAPE/);
  assert.match(
    harness.root.innerHTML,
    /MACHINE PAIR SIGNAL \/\/ NOT A VERDICT<\/span><b>OPEN/,
  );

  harness.controller.setSubject("film:not-indexed");
  state = harness.controller.getState();
  assert.equal(state.docketCount, 0);
  assert.notEqual(state.error, "");
  assert.match(harness.root.innerHTML, /DOCKET HELD \/\/ FAILED CLOSED/);
  assert.doesNotMatch(harness.root.innerHTML, /OPEN BEFORE TAPE/);
});

test("an unknown initial handoff subject fails closed without a fallback dossier", () => {
  const harness = mounted({ initialSubjectId: "film:not-indexed" });
  const state = harness.controller.getState();

  assert.equal(state.docketCount, 0);
  assert.equal(state.selectedId, "");
  assert.match(state.error, /Unknown longitudinal subject ID/);
  assert.match(harness.root.innerHTML, /THE TAPE REFUSED A PLAUSIBLE LIE/);
  assert.doesNotMatch(
    harness.root.innerHTML,
    /BEFORE TAPE \/\/ FORECAST CANDIDATE/,
  );
});

test("30, 60, and 90 second edit briefs include every mixed response receipt", () => {
  const harness = mounted({ initialSubjectId: "film:halloween-ends" });

  for (const duration of [30, 60, 90]) {
    const button = harness.focusNode(`duration:${duration}`);
    harness.document.activeElement = button;
    harness.root.dispatch("click", { target: button });
    const state = harness.controller.getState();
    const markup = harness.root.innerHTML;
    const brief = harness.engine.buildEditBrief(state.selectedId, {
      durationSeconds: duration,
    });

    assert.equal(state.editDuration, duration);
    assert.equal(harness.document.activeElement, button);
    assert.equal(brief.sequence.length, 3);
    assert.equal(brief.autoplay, false);
    assert.equal(brief.verdict, null);
    assert.equal(harness.engine.verify(brief).ok, true);
    assert.equal(
      brief.sequence.reduce(
        (total, item) => total + item.suggestedWindow.durationSeconds,
        0,
      ),
      duration,
    );
    assert.match(markup, /EDIT 01 \/\/ BEFORE/);
    assert.match(markup, /EDIT 02 \/\/ AFTER/);
    assert.match(markup, /EDIT 03 \/\/ AFTER/);
    assert.match(markup, /SOURCE DATE<\/dt><dd>2022-07-28/);
    assert.match(markup, /SOURCE DATE<\/dt><dd>2022-10-18/);
    assert.match(
      markup,
      new RegExp(
        brief.sequence[2].suggestedWindow.url
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace("&", "&amp;"),
      ),
    );
    assert.match(
      markup,
      new RegExp(`TARGET TOTAL // ${duration} SECONDS`),
    );
    assert.match(
      markup,
      /VERDICT NULL \/\/ AUTOPLAY FALSE \/\/ HUMAN REVIEW REQUIRED/,
    );
    assertNoPublicVerdict(markup);
  }
});

test("review download reverifies and serializes only the selected bounded packet", () => {
  const harness = mounted({ initialSubjectId: "film:halloween-ends" });
  const download = harness.focusNode(
    "download:docket:halloween-ends-excitement-to-mixed-reaction",
  );
  harness.root.dispatch("click", { target: download });

  assert.equal(harness.downloads.length, 1);
  assert.match(
    harness.downloads[0].name,
    /^wwam-longitudinal-review-docket-halloween-ends-excitement-to-mixed-reaction-fnv1a32-[a-f0-9]{8}\.json$/,
  );
  const packet = JSON.parse(harness.downloads[0].contents);
  assert.equal(
    packet.schema,
    "shokker-youtube-wiki/longitudinal-docket-inspection/v1",
  );
  assert.equal(
    packet.docket.id,
    "docket:halloween-ends-excitement-to-mixed-reaction",
  );
  assert.equal(packet.docket.relationship, "MAY_RESOLVE");
  assert.equal(packet.docket.verdict, null);
  assert.equal(packet.docket.promotionAllowed, false);
  assert.equal(packet.forecast.candidate.speaker, null);
  assert.equal(packet.response.candidate.additionalReceipts.length, 1);
  assert.equal(harness.engine.verify(packet).ok, true);
  assert.equal("records" in packet, false);
  assert.doesNotMatch(
    harness.downloads[0].contents,
    /"(?:audio|captions|events|media|rawcaptions|rawtranscript|segs|transcript|video)"\s*:/i,
  );
  assert.equal(
    harness.statusNode.textContent,
    "REVIEW PACKET DOWNLOADED // SOURCE LINKS ONLY // NO MEDIA OR VERDICT",
  );
});

test("unknown machine signals fail closed before a plausible dossier is rendered", () => {
  const runtime = loadRuntime();
  const badEngine = {
    getSubjects() {
      return runtime.engine.getSubjects();
    },
    list(filters) {
      const rows = plain(runtime.engine.list(filters));
      if (rows[0]) rows[0].pairSignal = "MACHINE_SAYS_YES";
      return rows;
    },
    inspect(id) {
      return runtime.engine.inspect(id);
    },
    buildEditBrief(id, options) {
      return runtime.engine.buildEditBrief(id, options);
    },
    verify(value) {
      return arguments.length ? runtime.engine.verify(value) : runtime.engine.verify();
    },
    serialize(value) {
      return runtime.engine.serialize(value);
    },
  };
  const harness = mounted({ engine: badEngine });
  const markup = harness.root.innerHTML;

  assert.notEqual(harness.controller.getState().error, "");
  assert.match(markup, /DOCKET HELD \/\/ FAILED CLOSED/);
  assert.match(markup, /THE TAPE REFUSED A PLAUSIBLE LIE/);
  assert.match(markup, /Unknown longitudinal pair signal/);
  assert.match(
    markup,
    /NO PAIR, VERDICT, SPEAKER, OR EDIT CLAIM WAS RENDERED/,
  );
  assert.doesNotMatch(markup, /BEFORE TAPE \/\/ FORECAST CANDIDATE/);
  assert.doesNotMatch(markup, /OPEN BEFORE TAPE/);
  assertNoPublicVerdict(markup);
});

test("docket navigation is keyboard reachable and destroy restores focus by default", () => {
  const harness = mounted();
  const buttons = harness.root.querySelectorAll(
    "[data-longitudinal-select]",
  );
  assert.equal(buttons.length, 4);

  const down = harness.root.dispatch("keydown", {
    target: buttons[0],
    key: "ArrowDown",
  });
  assert.equal(down.defaultPrevented, true);
  assert.equal(harness.document.activeElement, buttons[1]);

  harness.root.dispatch("keydown", {
    target: buttons[1],
    key: "End",
  });
  assert.equal(harness.document.activeElement, buttons[3]);

  harness.root.dispatch("keydown", {
    target: buttons[3],
    key: "Home",
  });
  assert.equal(harness.document.activeElement, buttons[0]);

  harness.controller.destroy();
  assert.equal(harness.root.innerHTML, "<p>MEMORY OS HOME</p>");
  assert.equal(harness.listenerMap.size, 0);
  assert.equal(harness.attributeMap.has("data-longitudinal-host"), false);
  assert.equal(harness.returnFocus.focusCount, 1);
  assert.equal(harness.controller.getState().mounted, false);
});

test("integrated tab teardown can opt out of stealing focus", () => {
  const harness = mounted({ restoreFocusOnDestroy: false });
  const otherTab = makeNode(harness.document);
  harness.document.activeElement = otherTab;
  harness.controller.destroy();

  assert.equal(harness.returnFocus.focusCount, 0);
  assert.equal(harness.document.activeElement, otherTab);
  assert.equal(harness.listenerMap.size, 0);
  assert.equal(harness.root.innerHTML, "<p>MEMORY OS HOME</p>");
});

test("the standalone visual layer is responsive, focus-visible, and motion-safe", () => {
  assert.ok(fs.statSync(uiPath).size < 36_000);
  assert.ok(fs.statSync(cssPath).size < 19_000);
  assert.match(
    cssSource,
    /\.longitudinal-docket :where\(a, button, select, \[tabindex\]\):focus-visible/,
  );
  assert.match(cssSource, /@media \(max-width: 1100px\)/);
  assert.match(cssSource, /@media \(max-width: 880px\)/);
  assert.match(cssSource, /@media \(max-width: 620px\)/);
  assert.match(cssSource, /@media \(max-width: 410px\)/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSource, /animation:\s*none !important/);
  assert.match(cssSource, /transition:\s*none !important/);

  assert.match(uiSource, /target="_blank" rel="noopener"/);
  assert.match(uiSource, /restoreFocusOnDestroy !== false/);
  assert.match(uiSource, /initialSubjectId/);
  assert.match(uiSource, /setSubject:\s*chooseSubject/);
  assert.doesNotMatch(
    uiSource,
    /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|<video|<iframe/i,
  );
  assert.doesNotMatch(uiSource, /autoplay\s*=\s*["']?true/i);
  for (const phrase of forbiddenVerdicts) {
    assert.doesNotMatch(uiSource, new RegExp(phrase, "i"));
  }
});
