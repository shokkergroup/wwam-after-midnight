import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const uiPath = path.join(demo, "bit-bloodline-ui.js");
const cssPath = path.join(demo, "bit-bloodline.css");
const uiSource = fs.readFileSync(uiPath, "utf8");
const cssSource = fs.readFileSync(cssPath, "utf8");

function runtime() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(uiSource, context, { filename: "bit-bloodline-ui.js" });
  return context.window;
}

function focusNode(attributes = {}) {
  const values = new Map(Object.entries(attributes));
  return {
    focusCount: 0,
    parentElement: null,
    getAttribute(name) {
      return values.has(name) ? values.get(name) : null;
    },
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
    this.tabs = [];
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
    if (selector === "#bitBloodlineHeading") return this.heading;
    if (selector === "#bitBloodlineStatus") return this.status;
    return null;
  }

  querySelectorAll(selector) {
    if (selector !== '[data-bit-bloodline-action="select"]') return [];
    return this.tabs;
  }

  syncTabs(lineages) {
    this.tabs = lineages.map((lineage) => {
      const tab = focusNode({
        "data-bit-bloodline-action": "select",
        "data-lineage-id": lineage.id,
      });
      tab.parentElement = this;
      return tab;
    });
  }

  action(name, attributes = {}) {
    const node = focusNode({
      "data-bit-bloodline-action": name,
      ...attributes,
    });
    node.parentElement = this;
    const event = {
      target: node,
      prevented: false,
      preventDefault() {
        this.prevented = true;
      },
    };
    this.listeners.get("click")?.(event);
    return event;
  }

  keydown(key, target = null) {
    const event = {
      key,
      target: target || this,
      prevented: false,
      stopped: false,
      preventDefault() {
        this.prevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    };
    this.listeners.get("keydown")?.(event);
    return event;
  }
}

const definitions = [
  ["challis", "THE CHALLIS HOTLINE", "DR. CHALLIS", 7, 6, 1464],
  ["slenderman", "SLENDERMAN DISPATCH", "SLENDERMAN", 6, 6, 1916],
  ["loomis", "THE LOOMIS ALERT SYSTEM", "DR. LOOMIS", 7, 5, 1433],
  ["feldman", "THE FELDMAN FREQUENCY", "COREY FELDMAN", 5, 3, 37],
];

function performance(lineageId, index, count) {
  const at = 100 + index * 40;
  return {
    receiptKey: `character-receipt:${lineageId}-${index}`,
    sourceId: `source_${lineageId}_${index % 3}`,
    sourceFingerprint: `fnv1a32:source-${lineageId}-${index}`,
    dossierFingerprint: `fnv1a32:dossier-${lineageId}-${index}`,
    sourceTitle: `${lineageId.toUpperCase()} SOURCE ${index + 1}`,
    date: index === 0 ? "2021-04-24" : "2026-07-23",
    at,
    end: at + 14,
    excerpt: `Bounded ${lineageId} context ${index + 1}`,
    evidenceLevel: "curated-candidate",
    curationStatus: "human-curated",
    role: index === 0 ? "earliest-curated-window" :
      index === count - 1 ? "latest-curated-window" :
        "indexed-performance-candidate",
  };
}

function lineage(definition) {
  const [id, label, character, appearances, sourceCount, elapsedDays] = definition;
  return {
    id: `bloodline:${id}`,
    label,
    character,
    description: `Source-locked ${id} performance history.`,
    appearanceCount: appearances,
    laterAppearanceCount: appearances - 1,
    sourceCount,
    sourceIds: Array.from({ length: sourceCount }, (_, index) => `source_${index}`),
    firstDate: "2021-04-24",
    lastDate: "2026-07-23",
    elapsedDays,
    elapsedLabel: `${elapsedDays.toLocaleString("en-US")} DAYS ON THE INDEXED TAPE`,
    caution: "Earliest in the indexed corpus is not a true-origin claim.",
    boundary: {
      speakerContinuityEstablished: false,
      trueOriginEstablished: false,
      authorshipEstablished: false,
      causalityEstablished: false,
      creatorApproved: false,
      rightsCleared: false,
      copiedMediaIncluded: false,
    },
    echoes: id === "challis" ? [
      {
        receiptKey: "character-context:challis-machine-1",
        sourceId: "source_machine_echo",
        sourceTitle: "MACHINE-LOCATED SOURCE",
        date: "2025-10-31",
        at: 1222.5,
        context: "Possible character-context navigation signal.",
      },
      {
        receiptKey: "character-signal:challis-machine-2",
        sourceId: "source_machine_signal",
        sourceTitle: "SECOND MACHINE POSITION",
        date: "2026-02-13",
        at: 811.25,
        context: "Possible phrase signal for human review.",
      },
    ] : [],
    performances: Array.from(
      { length: appearances },
      (_, index) => performance(id, index, appearances),
    ),
  };
}

function engineFixture(overrides = {}) {
  const lineages = definitions.map(lineage);
  return {
    lineages,
    compileCalls: [],
    list() {
      return lineages;
    },
    get(id) {
      return lineages.find((item) => item.id === id) || null;
    },
    compileCutPacket(id) {
      this.compileCalls.push(id);
      const selected = this.get(id);
      if (!selected) throw new Error("UNKNOWN BLOODLINE");
      return {
        schema: "shokker-memory-cut-request/v1",
        ok: true,
        rejected: [],
        title: `${selected.label} // BLOODLINE CUT`,
        introduction: "Exact source-locked character windows.",
        selections: selected.performances.map((item) => ({
          receiptKey: item.receiptKey,
          sourceId: item.sourceId,
          sourceFingerprint: item.sourceFingerprint,
          dossierFingerprint: item.dossierFingerprint,
          at: item.at,
          end: item.end,
        })),
      };
    },
    ...overrides,
  };
}

function setup(overrides = {}) {
  const window = runtime();
  const engine = overrides.engine || engineFixture();
  const mount = new FakeMount();
  mount.syncTabs(engine.lineages || []);
  const launcher = focusNode();
  const calls = { play: [], cut: [], close: 0 };
  const ui = window.WWAMBitBloodlineUI.create({
    document: { activeElement: launcher },
    mount,
    engine,
    onPlay(...args) {
      calls.play.push(args);
    },
    onNavigateEcho(...args) {
      calls.echo = calls.echo || [];
      calls.echo.push(args);
    },
    onCutBloodline(...args) {
      calls.cut.push(args);
    },
    onClose() {
      calls.close += 1;
    },
    ...overrides.options,
  });
  return { window, engine, mount, launcher, calls, ui };
}

test("exports one channel-adaptable UI under Shokker and WWAM names", () => {
  const window = runtime();
  assert.equal(window.ShokkerBitBloodlineUI, window.WWAMBitBloodlineUI);
  assert.equal(window.WWAMBitBloodlineUI.VERSION, "1.0.0");
  assert.equal(typeof window.WWAMBitBloodlineUI.create, "function");
  assert.doesNotMatch(uiSource, /<iframe|<video|<audio/i);
});

test("open reveals all four lineages while focusing one exact timeline", () => {
  const { ui, mount } = setup();
  const state = ui.open();

  assert.equal(state.open, true);
  assert.equal(state.lineageCount, 4);
  assert.equal(state.selectedId, "bloodline:challis");
  definitions.forEach(([, label]) => assert.match(mount.innerHTML, new RegExp(label)));
  assert.match(mount.innerHTML, /THE CHALLIS HOTLINE/);
  assert.match(mount.innerHTML, /7 WINDOWS/);
  assert.match(mount.innerHTML, /6 OFFICIAL SOURCES|OFFICIAL SOURCES/);
  assert.match(mount.innerHTML, /1,464 DAYS ON THE INDEXED TAPE/);
  assert.match(mount.innerHTML, /EARLIEST CURATED WINDOW IN CURRENT INDEX/);
  assert.match(mount.innerHTML, /INDEXED PERFORMANCE CANDIDATE/);
  assert.match(mount.innerHTML, /LATEST CURATED WINDOW IN CURRENT INDEX/);
  assert.equal(mount.heading.focusCount, 1);
  assert.equal(mount.getAttribute("data-bit-bloodline-state"), "ready");
});

test("lineage switching exposes a hidden bloodline without causal mutation claims", () => {
  const { ui, mount } = setup();
  ui.open();
  const event = mount.action("select", { "data-lineage-id": "bloodline:feldman" });

  assert.equal(event.prevented, true);
  assert.equal(ui.getState().selectedId, "bloodline:feldman");
  assert.match(mount.innerHTML, /THE FELDMAN FREQUENCY/);
  assert.match(mount.innerHTML, /37 DAYS ON THE INDEXED TAPE/);
  assert.match(mount.innerHTML, /5 WINDOWS/);
  assert.doesNotMatch(mount.innerHTML, /FIRST SPARK|MUTATION/i);
});

test("exact receipt action hands bounded source identity to the host and loads no media", () => {
  const { ui, mount, calls } = setup();
  ui.open({ lineageId: "bloodline:loomis" });
  mount.action("play", { "data-performance-index": "2" });

  assert.equal(calls.play.length, 1);
  const [selection, selected, sourcePerformance] = calls.play[0];
  assert.deepEqual(
    JSON.parse(JSON.stringify(selection)),
    {
      receiptKey: "character-receipt:loomis-2",
      sourceId: "source_loomis_2",
      sourceFingerprint: "fnv1a32:source-loomis-2",
      dossierFingerprint: "fnv1a32:dossier-loomis-2",
      at: 180,
      end: 194,
    },
  );
  assert.equal(selected.id, "bloodline:loomis");
  assert.equal(sourcePerformance.excerpt, "Bounded loomis context 3");
  assert.doesNotMatch(mount.innerHTML, /<iframe|<video|<audio/i);
  assert.match(mount.innerHTML, /EXACT RECEIPT HANDED TO THE HOST PLAYER/);
});

test("machine echo radar stays quarantined and only hands off source navigation", () => {
  const { ui, mount, calls } = setup();
  ui.open();

  assert.match(mount.innerHTML, /MACHINE ECHO RADAR \/\/ NAVIGATION ONLY/);
  assert.match(mount.innerHTML, /NOT A CURATED PERFORMANCE/);
  assert.match(mount.innerHTML, /2 UNCURATED SIGNALS/);
  assert.doesNotMatch(mount.innerHTML, /MACHINE (?:PERFORMANCE|CALLBACK|MUTATION|ORIGIN)/i);

  mount.action("navigate-echo", { "data-echo-index": "1" });
  assert.equal(calls.echo.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(calls.echo[0][0])),
    {
      sourceId: "source_machine_signal",
      at: 811.25,
      receiptKey: "character-signal:challis-machine-2",
    },
  );
  assert.equal(calls.echo[0][1].id, "bloodline:challis");
  assert.match(mount.innerHTML, /NOT ADDED TO THE BLOODLINE/);
});

test("cut callback hands the host exact selections, title, introduction, and lineage", () => {
  const { ui, mount, calls, engine } = setup();
  ui.open({ lineageId: "bloodline:slenderman" });
  mount.action("cut");

  assert.deepEqual(engine.compileCalls, ["bloodline:slenderman"]);
  assert.equal(calls.cut.length, 1);
  const [handoff, rawPacket] = calls.cut[0];
  assert.equal(handoff.lineage.id, "bloodline:slenderman");
  assert.equal(handoff.selections.length, 6);
  assert.equal(handoff.title, "SLENDERMAN DISPATCH // BLOODLINE CUT");
  assert.equal(handoff.introduction, "Exact source-locked character windows.");
  handoff.selections.forEach((selection) => {
    assert.ok(selection.receiptKey);
    assert.ok(selection.sourceId);
    assert.ok(Number.isFinite(selection.at));
    assert.ok(selection.end > selection.at);
  });
  assert.equal(rawPacket.schema, "shokker-memory-cut-request/v1");
  assert.equal(
    handoff.selections.some((item) => /machine/i.test(item.receiptKey)),
    false,
  );
  assert.match(mount.innerHTML, /6 EXACT WINDOWS HANDED TO THE CUT ROOM/);
  assert.match(mount.innerHTML, /NO MEDIA COPIED/);
});

test("cut fails closed when one receipt loses its exact end bound", () => {
  const engine = engineFixture();
  engine.compileCutPacket = function compileCutPacket(id) {
    const packet = engineFixture().compileCutPacket(id);
    packet.selections[2].end = packet.selections[2].at;
    return packet;
  };
  const { ui, mount, calls } = setup({ engine });
  ui.open();
  mount.action("cut");

  assert.equal(calls.cut.length, 0);
  assert.match(mount.innerHTML, /CUT HELD CLOSED/);
  assert.match(mount.innerHTML, /EVERY WINDOW MUST RESOLVE/);
  assert.equal(mount.getAttribute("data-bit-bloodline-state"), "error");
});

test("authority boundary refuses unsupported historical and rights claims", () => {
  const { ui, mount } = setup();
  ui.open();

  for (const boundary of [
    "Speaker continuity",
    "true origin",
    "authorship",
    "causality",
    "creator approval",
    "rights clearance",
    "copied media",
  ]) {
    assert.match(mount.innerHTML, new RegExp(boundary, "i"));
  }
  assert.match(
    mount.innerHTML,
    /earliest in (?:(?:this|the) )?indexed (?:archive|corpus)/i,
  );
  assert.doesNotMatch(mount.innerHTML, /the first time the bit was ever performed/i);
  assert.doesNotMatch(mount.innerHTML, /creator approved|rights cleared/i);
  assert.doesNotMatch(mount.innerHTML, /confirmed callback|confirmed true origin/i);
  assert.doesNotMatch(mount.innerHTML, /FIRST SPARK|MUTATION|LATER ECHOES/i);
});

test("tabs support arrow, Home, and End keys and Escape restores launcher focus", () => {
  const { ui, mount, launcher } = setup();
  ui.open({ launcher });

  const firstTab = mount.tabs[0];
  const right = mount.keydown("ArrowRight", firstTab);
  assert.equal(right.prevented, true);
  assert.equal(ui.getState().selectedId, "bloodline:slenderman");
  assert.equal(mount.tabs[1].focusCount, 1);

  const secondTab = mount.tabs[1];
  mount.keydown("End", secondTab);
  assert.equal(ui.getState().selectedId, "bloodline:feldman");
  assert.equal(mount.tabs[3].focusCount, 1);

  mount.keydown("Home", mount.tabs[3]);
  assert.equal(ui.getState().selectedId, "bloodline:challis");

  const escape = mount.keydown("Escape");
  assert.equal(escape.prevented, true);
  assert.equal(escape.stopped, true);
  assert.equal(ui.getState().open, false);
  assert.equal(launcher.focusCount, 1);
});

test("does not create a nested dialog and safely escapes channel-adapted copy", () => {
  const { ui, mount } = setup({
    options: {
      copy: {
        title: '<img src=x onerror="alert(1)">',
        firstWindow: "ARCHIVE IGNITION",
        performanceCandidate: "INDEXED PULSE",
      },
    },
  });
  ui.open();

  assert.doesNotMatch(mount.innerHTML, /role="dialog"/);
  assert.doesNotMatch(mount.innerHTML, /<img src=x/);
  assert.match(mount.innerHTML, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(mount.innerHTML, /ARCHIVE IGNITION/);
  assert.match(mount.innerHTML, /INDEXED PULSE/);
});

test("embedded mode renders no close control and leaves Escape to its page host", () => {
  const window = runtime();
  const engine = engineFixture();
  const mount = new FakeMount();
  mount.syncTabs(engine.lineages);
  const ui = window.WWAMBitBloodlineUI.create({
    document: { activeElement: focusNode() },
    mount,
    engine,
  });
  ui.open();

  assert.doesNotMatch(mount.innerHTML, /data-bit-bloodline-action="close"/);
  const escape = mount.keydown("Escape");
  assert.equal(escape.prevented, false);
  assert.equal(escape.stopped, false);
  assert.equal(ui.getState().open, true);
});

test("destroy removes listeners and mount state without restoring focus", () => {
  const { ui, mount, launcher } = setup();
  ui.open({ launcher });
  ui.destroy();

  assert.equal(ui.getState().destroyed, true);
  assert.equal(mount.innerHTML, "");
  assert.equal(mount.listeners.has("click"), false);
  assert.equal(mount.listeners.has("keydown"), false);
  assert.equal(mount.getAttribute("data-bit-bloodline-state"), null);
  assert.equal(launcher.focusCount, 0);
});

test("CSS pins touch, 390px, reduced-motion, high-contrast, and forced-color behavior", () => {
  assert.match(cssSource, /\.bit-bloodline button\s*\{[\s\S]*min-height:\s*44px/);
  assert.match(cssSource, /@media \(max-width:\s*390px\)/);
  assert.match(cssSource, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(cssSource, /@media \(prefers-contrast:\s*more\)/);
  assert.match(cssSource, /@media \(forced-colors:\s*active\)/);
  assert.match(cssSource, /:focus-visible/);
});
