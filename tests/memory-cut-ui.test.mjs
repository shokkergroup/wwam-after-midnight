import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const uiPath = path.join(demo, "memory-cut-ui.js");
const cssPath = path.join(demo, "memory-cut.css");
const uiSource = fs.readFileSync(uiPath, "utf8");
const cssSource = fs.readFileSync(cssPath, "utf8");

function runtime() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(uiSource, context, { filename: "memory-cut-ui.js" });
  return context.window.WWAMMemoryCutUI;
}

function focusNode() {
  return {
    focusCount: 0,
    textContent: "",
    focus() {
      this.focusCount += 1;
    },
  };
}

class FakeMount {
  constructor() {
    this.innerHTML = "";
    this.attributes = new Map();
    this.listeners = new Map();
    this.heading = focusNode();
    this.status = focusNode();
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  addEventListener(name, handler) {
    this.listeners.set(name, handler);
  }

  removeEventListener(name, handler) {
    if (this.listeners.get(name) === handler) this.listeners.delete(name);
  }

  querySelector(selector) {
    if (selector === "#memoryCutTitleHeading") return this.heading;
    if (selector === "#memoryCutStatus") return this.status;
    return null;
  }

  action(name, attributes = {}) {
    const values = new Map(Object.entries({
      "data-memory-cut-action": name,
      ...attributes,
    }));
    const button = {
      parentElement: this,
      getAttribute(key) {
        return values.has(key) ? values.get(key) : null;
      },
    };
    const event = {
      target: button,
      prevented: false,
      preventDefault() {
        this.prevented = true;
      },
    };
    this.listeners.get("click")?.(event);
    return event;
  }

  input(field, value) {
    const target = {
      value,
      getAttribute(name) {
        return name === "data-memory-cut-field" ? field : null;
      },
    };
    this.listeners.get("input")?.({ target });
  }

  keydown(key) {
    const event = {
      key,
      prevented: false,
      stopped: false,
      immediate: false,
      preventDefault() {
        this.prevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
      stopImmediatePropagation() {
        this.immediate = true;
      },
    };
    this.listeners.get("keydown")?.(event);
    return event;
  }
}

function selection(index, overrides = {}) {
  return {
    sourceId: `source0000${index % 3}`,
    receiptKey: `receipt:${index}`,
    at: 100 + index * 20,
    end: 114 + index * 20,
    title: `Evidence Bag item ${index}`,
    ...overrides,
  };
}

function cutFrom(request, compileNumber = 1) {
  const stops = request.selections.map((item, index) => ({
    inputIndex: index,
    order: index + 1,
    key: item.receiptKey || item.key,
    sourceId: item.sourceId || item.id,
    sourceFingerprint: item.sourceFingerprint || `fnv1a32:source-${index}`,
    dossierFingerprint: `fnv1a32:dossier-${index}`,
    title: item.sourceTitle || `OFFICIAL TAPE ${index + 1}`,
    date: "2026-07-23",
    at: item.at ?? item.start,
    start: item.at ?? item.start,
    end: item.end,
    url: `https://www.youtube.com/watch?v=${item.sourceId || item.id}&t=${item.at ?? item.start}s`,
    officialUrl: `https://www.youtube.com/watch?v=${item.sourceId || item.id}`,
    label: item.label || `CANONICAL MOMENT ${index + 1}`,
    kind: "timestamped-receipt",
    excerpt: item.excerpt ?? `Bounded context ${index + 1}`,
    evidenceType: "caption-excerpt",
    evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
    evidenceBasis: "canonical-source-dossier",
    reviewState: "promoted",
    warnings: item.warnings || [],
    speaker: null,
    speakerStatus: "not-diarized",
  }));
  return {
    schema: "shokker-memory-cut/v1",
    version: "1.0.0",
    status: "ready",
    eligible: true,
    title: request.title,
    introduction: request.introduction || "",
    viewerTextLabel: "VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE",
    bindings: { channelId: "fixture-channel" },
    stops,
    held: [],
    stats: {
      stopCount: stops.length,
      sourceCount: new Set(stops.map((stop) => stop.sourceId)).size,
      receiptCount: stops.length,
      runTimeSeconds: stops.reduce(
        (total, stop) => total + stop.end - stop.start,
        0,
      ),
    },
    boundary: {
      exactSourceNavigation: true,
      canonicalReceiptsOnly: true,
      copiedMediaIncluded: false,
      generatedNarrationIncluded: false,
      speakerVerified: false,
      creatorApproved: false,
      rightsCleared: false,
    },
    fingerprint: `fnv1a32:cut-${compileNumber}`,
  };
}

function engineFixture() {
  let compileNumber = 0;
  return {
    compileCalls: [],
    resolveCalls: [],
    shareCalls: [],
    exportCalls: [],
    resolveSelection(item) {
      this.resolveCalls.push(item);
      if (!item || item.invalid) {
        throw new Error(item?.reason || "UNKNOWN SOURCE RECEIPT // HELD.");
      }
      return item.receiptKey || item.key;
    },
    compile(request) {
      this.compileCalls.push(request);
      compileNumber += 1;
      if (request.selections.length < 3 || request.selections.length > 8) {
        throw new Error("A memory cut requires 3 to 8 receipts.");
      }
      return cutFrom(request, compileNumber);
    },
    share(cut) {
      this.shareCalls.push(cut);
      return {
        schema: "shokker-memory-cut-share/v1",
        title: cut.title,
        receiptKeys: cut.stops.map((stop) => stop.key),
        fingerprint: "fnv1a32:share",
      };
    },
    exportEditBrief(cut, format) {
      this.exportCalls.push({ cut, format });
      if (format === "markdown") {
        return `# ${cut.title}\n\nVIEWER-WRITTEN // NOT ARCHIVE EVIDENCE`;
      }
      return {
        schema: "shokker-memory-cut-edit-brief/v1",
        title: cut.title,
        timeline: cut.stops.map((stop) => ({
          sourceId: stop.sourceId,
          start: stop.start,
          end: stop.end,
        })),
      };
    },
    getPreset(id) {
      if (id !== "character-ward") throw new Error("Unknown preset.");
      return {
        title: "THE CHARACTER WARD // 2021–2026",
        introduction: "Five source-locked character windows.",
        selections: Array.from({ length: 5 }, (_, index) =>
          selection(index, {
            sourceId: `character${index}`,
            receiptKey: `character-receipt:${index}`,
            label: `CHARACTER WINDOW ${index + 1}`,
          })),
      };
    },
  };
}

function setup(overrides = {}) {
  const mount = new FakeMount();
  const engine = overrides.engine || engineFixture();
  const launcher = focusNode();
  const calls = {
    player: [],
    copy: [],
    download: [],
    close: [],
    bag: [],
  };
  const ui = runtime().create({
    document: { activeElement: launcher },
    mount,
    engine,
    onRenderPlayer: (payload) => calls.player.push(payload),
    onCopy: (payload) => calls.copy.push(payload),
    onDownload: (payload) => calls.download.push(payload),
    onClose: (payload) => calls.close.push(payload),
    onBagChange: (payload) => calls.bag.push(payload),
    ...overrides.options,
  });
  return { ui, mount, engine, launcher, calls };
}

test("exports the V5.19 UI contract and opens a media-dormant canonical cut", () => {
  const { ui, mount, engine, calls } = setup();
  const selections = [selection(0), selection(1), selection(2)];
  const cut = ui.open({
    selections,
    title: "MY NIGHTMARE ROUTE",
    introduction: "Three exact moments I want to revisit.",
  });

  assert.equal(runtime().VERSION, "1.0.0");
  assert.equal(ui.version, "1.0.0");
  assert.equal(cut.schema, "shokker-memory-cut/v1");
  assert.equal(engine.compileCalls.length, 1);
  assert.equal(
    engine.compileCalls[0].schema,
    "shokker-memory-cut-request/v1",
  );
  assert.equal(mount.getAttribute("data-memory-cut-state"), "ready");
  assert.equal(mount.getAttribute("data-memory-cut-preset"), "custom");
  assert.equal(calls.player.length, 0, "open never emits a player callback");
  assert.match(mount.innerHTML, /THE MIDNIGHT <em>CUT\.<\/em>/);
  assert.match(mount.innerHTML, /VIEWER-WRITTEN \/\/ NOT ARCHIVE EVIDENCE/);
  assert.match(mount.innerHTML, /THE ARRANGEMENT IS YOURS\. THE RECEIPTS ARE THE ARCHIVE’S\./);
  assert.match(mount.innerHTML, /3<\/b><span>CANONICAL STOPS/);
  assert.match(mount.innerHTML, /42S<\/b><span>BOUNDED PLAYBACK/);
  assert.match(mount.innerHTML, /PLAYER DORMANT\./);
  assert.match(mount.innerHTML, /The cut never autoplays\./);
  assert.match(mount.innerHTML, /aria-current="step"/);
  assert.equal((mount.innerHTML.match(/class="memory-cut-stop-select"/g) || []).length, 3);
  assert.doesNotMatch(mount.innerHTML, /<(iframe|video|audio)\b/i);
  assert.match(mount.innerHTML, /SPEAKER: NOT CLAIMED \/\/ CONTINUITY: NOT CLAIMED/);
  assert.match(mount.innerHTML, /OPEN OFFICIAL SOURCE ↗/);
  assert.equal(mount.heading.focusCount, 1);
});

test("explicit Play, Next, Previous, Replay, and direct-stop controls load exact bounded sources", () => {
  const { ui, mount, calls } = setup();
  ui.open({ selections: [selection(0), selection(1), selection(2)] });

  mount.action("play-current");
  mount.action("next");
  mount.action("previous");
  mount.action("select", { "data-index": "2" });
  mount.action("replay");

  assert.equal(calls.player.length, 5);
  assert.deepEqual(
    calls.player.map((call) => call.reason),
    ["play-current", "next", "previous", "direct", "replay"],
  );
  assert.deepEqual(
    calls.player.map((call) => [call.sourceId, call.start, call.end]),
    [
      ["source00000", 100, 114],
      ["source00001", 120, 134],
      ["source00000", 100, 114],
      ["source00002", 140, 154],
      ["source00002", 140, 154],
    ],
  );
  assert.equal(calls.player.every((call) => call.autoplay === true), true);
  assert.equal(calls.player.every((call) => call.mountId === "memoryCutPlayer"), true);
  assert.match(
    mount.status.textContent,
    /Stop 3 of 3 loaded at 02:20\. Playback advances only when you ask\./,
  );
  assert.equal(ui.getState().currentIndex, 2);
  assert.equal(ui.getState().playerLoaded, true);
});

test("reorder recompiles canonical order and remove fails closed below three stops", () => {
  const { ui, mount, engine, calls } = setup();
  ui.open({
    selections: [selection(0), selection(1), selection(2), selection(3)],
  });
  mount.action("move-down", { "data-index": "0" });

  assert.equal(engine.compileCalls.length, 2);
  assert.deepEqual(
    Array.from(
      engine.compileCalls[1].selections,
      (item) => item.receiptKey,
    ),
    ["receipt:1", "receipt:0", "receipt:2", "receipt:3"],
  );
  assert.equal(calls.bag[0].action, "reorder");
  assert.match(ui.getState().status, /Canonical timestamps did not move/);
  assert.equal(calls.player.length, 0, "editing never starts playback");

  mount.action("remove", { "data-index": "3" });
  assert.equal(ui.getState().cut.stops.length, 3);
  mount.action("remove", { "data-index": "2" });

  assert.equal(ui.getState().cut, null);
  assert.equal(mount.getAttribute("data-memory-cut-state"), "held");
  assert.match(mount.innerHTML, /THREE CANONICAL STOPS OR IT DOESN’T LEAVE THE EDIT BAY/);
  assert.match(mount.innerHTML, /2 ELIGIBLE/);
  assert.equal(calls.bag.at(-1).action, "remove");
  assert.equal(calls.player.length, 0);
});

test("invalid, duplicate, and over-limit selections are visibly held outside a valid cut", () => {
  const { ui, mount, engine } = setup();
  const items = [
    selection(0),
    selection(1),
    selection(2),
    selection(3, { receiptKey: "receipt:0" }),
    selection(4, { invalid: true, reason: "CAPTION PATH LIMITED // HELD." }),
    selection(5),
    selection(6),
    selection(7),
    selection(8),
    selection(9),
    selection(10),
  ];
  const cut = ui.open({ selections: items });

  assert.equal(cut.stops.length, 8);
  assert.equal(ui.getState().held.length, 3);
  assert.equal(engine.compileCalls[0].selections.length, 8);
  assert.match(mount.innerHTML, /3 HELD \/ INELIGIBLE ITEMS \/\/ NOT IN THE CUT/);
  assert.match(mount.innerHTML, /DUPLICATE CANONICAL RECEIPT \/\/ HELD OUTSIDE THE CUT/);
  assert.match(mount.innerHTML, /CAPTION PATH LIMITED \/\/ HELD\./);
  assert.match(mount.innerHTML, /CUT LIMIT \/\/ ONLY 8 CANONICAL STOPS MAY ENTER V1/);
  assert.match(mount.innerHTML, /Held items cannot borrow proof from another source/);
});

test("The Character Ward uses the normal selection contract and marks the preset", () => {
  const { ui, mount, engine } = setup();
  const characterWard = {
    title: "THE CHARACTER WARD // 2021–2026",
    introduction: "Five source-locked character-performance windows.",
    selections: Array.from({ length: 5 }, (_, index) =>
      selection(index, {
        sourceId: `character${index}`,
        receiptKey: `character-receipt:${index}`,
        label: `CHARACTER WINDOW ${index + 1}`,
      })),
  };
  ui.open(characterWard);

  assert.equal(engine.compileCalls.length, 1);
  assert.equal(engine.compileCalls[0].selections.length, 5);
  assert.equal(
    mount.getAttribute("data-memory-cut-preset"),
    "character-ward",
  );
  assert.match(mount.innerHTML, /CHARACTER WARD PRESET/);
  assert.match(mount.innerHTML, /THE CHARACTER WARD \/\/ 2021–2026/);
});

test("viewer copy recompiles before source-locked share and production export", () => {
  const { ui, mount, engine, calls } = setup();
  ui.open({ selections: [selection(0), selection(1), selection(2)] });
  mount.input("title", "My <feral> cut");
  mount.input("introduction", "A viewer-only introduction.");
  mount.action("copy");
  mount.action("download");
  mount.action("download-markdown");

  assert.equal(engine.shareCalls.length, 1);
  assert.equal(engine.exportCalls.length, 2);
  assert.equal(engine.shareCalls[0].title, "My <feral> cut");
  assert.equal(
    engine.exportCalls[0].cut.introduction,
    "A viewer-only introduction.",
  );
  assert.equal(engine.exportCalls[0].format, "json");
  assert.equal(engine.exportCalls[1].format, "markdown");
  assert.equal(calls.copy[0].packet.schema, "shokker-memory-cut-share/v1");
  assert.doesNotMatch(calls.copy[0].text, /Bounded context/);
  assert.equal(
    calls.download[0].filename,
    "wwam-my-feral-cut-production-brief.json",
  );
  assert.equal(
    calls.download[0].brief.schema,
    "shokker-memory-cut-edit-brief/v1",
  );
  assert.equal(
    calls.download[1].filename,
    "wwam-my-feral-cut-editor-checklist.md",
  );
  assert.match(calls.download[1].brief, /^# My <feral> cut/);
  assert.match(mount.status.textContent, /Markdown editor checklist/);
});

test("a held one-stop bag can explicitly load The Character Ward without playback", () => {
  const { ui, mount, engine, calls } = setup();
  ui.open({ selections: [selection(0)], title: "ONE LONELY RECEIPT" });

  assert.equal(ui.getState().cut, null);
  assert.match(mount.innerHTML, /LOAD THE CHARACTER WARD PRESET/);
  mount.action("load-character-ward");

  assert.equal(ui.getState().cut.stops.length, 5);
  assert.equal(engine.compileCalls.at(-1).title, "THE CHARACTER WARD // 2021–2026");
  assert.equal(mount.getAttribute("data-memory-cut-state"), "ready");
  assert.equal(mount.getAttribute("data-memory-cut-preset"), "character-ward");
  assert.equal(calls.player.length, 0);
  assert.match(ui.getState().status, /No video loaded/);
});

test("a supplied precompiled cut is canonically checked and remains dormant", () => {
  const { ui, mount, engine, calls } = setup();
  const cut = engine.compile({
    title: "RESTORED CUT",
    introduction: "",
    selections: [selection(0), selection(1), selection(2)],
  });
  engine.compileCalls.length = 0;
  engine.shareCalls.length = 0;

  const restored = ui.open({ cut });

  assert.equal(restored, cut);
  assert.equal(engine.compileCalls.length, 0);
  assert.equal(engine.shareCalls.length, 1, "share canonical-checks the supplied cut");
  assert.equal(calls.player.length, 0);
  assert.match(mount.innerHTML, /RESTORED CUT/);
  assert.match(mount.innerHTML, /PLAYER DORMANT/);
});

test("markup escapes source and viewer-controlled text", () => {
  const { ui, mount } = setup();
  ui.open({
    title: "<img src=x onerror=boom>",
    introduction: "<script>boom()</script>",
    selections: [
      selection(0, { label: "<svg onload=boom>", excerpt: "<b>not markup</b>" }),
      selection(1),
      selection(2),
    ],
  });

  assert.match(mount.innerHTML, /&lt;img src=x onerror=boom&gt;/);
  assert.match(mount.innerHTML, /&lt;script&gt;boom\(\)&lt;\/script&gt;/);
  assert.match(mount.innerHTML, /&lt;svg onload=boom&gt;/);
  assert.match(mount.innerHTML, /&lt;b&gt;not markup&lt;\/b&gt;/);
  assert.doesNotMatch(mount.innerHTML, /<img src=x|<script>boom|<svg onload|<b>not markup/);
});

test("Escape closes, clears any player markup, calls the host, and restores launcher focus", () => {
  const { ui, mount, launcher, calls } = setup();
  ui.open({ selections: [selection(0), selection(1), selection(2)] });
  mount.action("play-current");
  mount.innerHTML += "<iframe></iframe>";

  const event = mount.keydown("Escape");

  assert.equal(event.prevented, true);
  assert.equal(event.stopped, true);
  assert.equal(event.immediate, true);
  assert.equal(calls.close.length, 1);
  assert.equal(mount.innerHTML, "");
  assert.equal(mount.getAttribute("data-memory-cut-state"), null);
  assert.equal(launcher.focusCount, 1);
  assert.equal(ui.getState().open, false);
});

test("destroy removes every delegate and rejects later open calls", () => {
  const { ui, mount } = setup();
  ui.open({ selections: [selection(0), selection(1), selection(2)] });
  ui.destroy();

  assert.equal(mount.innerHTML, "");
  assert.equal(mount.listeners.has("click"), false);
  assert.equal(mount.listeners.has("input"), false);
  assert.equal(mount.listeners.has("keydown"), false);
  assert.throws(
    () => ui.open({ selections: [selection(0), selection(1), selection(2)] }),
    /has been destroyed/,
  );
});

test("stylesheet keeps 44px controls, a 390px vertical rail, focus, and reduced motion", () => {
  assert.match(
    cssSource,
    /\.memory-cut button,\s*\n\.memory-cut a,\s*\n\.memory-cut input,\s*\n\.memory-cut textarea\s*\{[^}]*min-height:\s*44px/s,
  );
  assert.match(cssSource, /:focus-visible/);
  assert.match(cssSource, /@media \(max-width:\s*390px\)/);
  assert.match(
    cssSource,
    /@media \(max-width:\s*860px\)[\s\S]*?\.memory-cut-rail > li\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.match(cssSource, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(cssSource, /transition-duration:\s*\.01ms\s*!important/);
  assert.match(cssSource, /scroll-behavior:\s*auto\s*!important/);
  assert.doesNotMatch(cssSource, /@import/i);
});
