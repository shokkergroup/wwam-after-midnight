import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const uiPath = path.join(demo, "receipt-matrix-ui.js");
const cssPath = path.join(demo, "receipt-matrix.css");
const uiSource = fs.readFileSync(uiPath, "utf8");
const cssSource = fs.readFileSync(cssPath, "utf8");

function runtime() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(uiSource, context, { filename: "receipt-matrix-ui.js" });
  return context.window;
}

function focusNode(attributes = {}) {
  const values = new Map(Object.entries(attributes));
  return {
    disabled: false,
    focusCount: 0,
    isConnected: true,
    parentElement: null,
    textContent: "",
    focus() {
      this.focusCount += 1;
    },
    getAttribute(name) {
      return values.has(name) ? values.get(name) : null;
    },
    setAttribute(name, value) {
      values.set(name, String(value));
    },
  };
}

class FakeMount {
  constructor() {
    this.attributes = new Map();
    this.heading = focusNode();
    this.innerHTML = "";
    this.listeners = new Map();
    this.status = focusNode();
  }

  addEventListener(name, handler) {
    this.listeners.set(name, handler);
  }

  removeEventListener(name, handler) {
    if (this.listeners.get(name) === handler) this.listeners.delete(name);
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

  querySelector(selector) {
    if (selector === "#receiptMatrixHeading") return this.heading;
    if (selector === "#receiptMatrixStatus") return this.status;
    return null;
  }

  action(action, attributes = {}) {
    const node = focusNode({
      "data-receipt-matrix-action": action,
      ...attributes,
    });
    node.parentElement = this;
    const event = {
      target: node,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    this.listeners.get("click")?.(event);
    return event;
  }

  keydown(key, attributes = {}) {
    const event = {
      key,
      target: attributes.target || this,
      defaultPrevented: false,
      altKey: attributes.altKey || false,
      ctrlKey: attributes.ctrlKey || false,
      metaKey: attributes.metaKey || false,
      shiftKey: attributes.shiftKey || false,
      stopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    };
    this.listeners.get("keydown")?.(event);
    return event;
  }
}

function routeFixture(overrides = {}) {
  return {
    schema: "shokker-receipt-matrix-route/v1",
    status: "supported",
    mode: "source-entity-intersection",
    answerShape: "source-list",
    matrix: {
      entityIds: ["entity:alpha", "entity:beta"],
      quantifier: "all",
      order: "receipt-count-desc",
    },
    entityLabels: ["Alpha Signal", "Beta Signal"],
    groupLabel: "OFFICIAL SOURCE",
    chronologyWarning:
      "Source dates order uploads; they do not prove a relationship between receipts.",
    ...overrides,
  };
}

function receipt(overrides = {}) {
  return {
    receiptKey: "receipt:alpha-1",
    sourceId: "SOURCE_BETA",
    at: 90.5,
    end: 104.75,
    date: "2026-06-02",
    excerpt: "A bounded source excerpt for human inspection.",
    label: "Alpha event",
    kind: "indexed-event",
    evidenceType: "caption-event",
    evidenceLevel: "timestamped-source-receipt",
    evidenceBasis: ["exact source ID", "bounded time window"],
    reviewState: "human-review-required",
    entityIds: ["entity:alpha"],
    matchedEntityIds: ["entity:alpha"],
    sourceFingerprint: "fnv1a32:source-beta",
    dossierFingerprint: "fnv1a32:dossier-beta",
    speaker: null,
    speakerStatus: "not-diarized",
    creatorApproved: false,
    rightsCleared: false,
    canonMutated: false,
    mediaCopied: false,
    ...overrides,
  };
}

function analysisFixture(overrides = {}) {
  const betaReceipts = [
    receipt(),
    receipt({
      receiptKey: "receipt:beta-2",
      at: 501.2,
      end: 515.2,
      label: "Beta event",
      matchedEntityIds: ["entity:beta"],
      entityIds: ["entity:beta"],
    }),
  ];
  const alphaReceipts = [
    receipt({
      receiptKey: "receipt:alpha-3",
      sourceId: "SOURCE_ALPHA",
      at: 14,
      end: 29.5,
      date: "2025-01-04",
      label: "Earlier alpha event",
      sourceFingerprint: "fnv1a32:source-alpha",
      dossierFingerprint: "fnv1a32:dossier-alpha",
    }),
  ];
  return {
    schema: "shokker-receipt-matrix-result/v1",
    status: "supported",
    bindings: {
      channelPackFingerprint: "fnv1a32:pack",
      archiveFingerprint: "fnv1a32:archive",
    },
    uniqueSourceCount: 2,
    eligibleReceiptCount: 3,
    entityTotals: [
      {
        entityId: "entity:alpha",
        eligibleReceiptCount: 2,
        uniqueSourceCount: 2,
        matchedGroupCount: 2,
      },
      {
        entityId: "entity:beta",
        eligibleReceiptCount: 1,
        uniqueSourceCount: 1,
        matchedGroupCount: 1,
      },
    ],
    groups: [
      {
        rank: 1,
        sourceId: "SOURCE_BETA",
        sourceTitle: "Second title, ranked first",
        date: "2026-06-02",
        officialUrl: "https://example.test/source-beta",
        sourceFingerprint: "fnv1a32:source-beta",
        dossierFingerprint: "fnv1a32:dossier-beta",
        receiptCount: 2,
        entityCoverage: {
          matched: 2,
          requested: 2,
          complete: true,
          entityIds: ["entity:alpha", "entity:beta"],
        },
        perEntity: [
          {
            entityId: "entity:alpha",
            receiptCount: 1,
            receiptKeys: ["receipt:alpha-1"],
          },
          {
            entityId: "entity:beta",
            receiptCount: 1,
            receiptKeys: ["receipt:beta-2"],
          },
        ],
        receipts: betaReceipts,
      },
      {
        rank: 2,
        sourceId: "SOURCE_ALPHA",
        sourceTitle: "First title, ranked second",
        date: "2025-01-04",
        officialUrl: "https://example.test/source-alpha",
        sourceFingerprint: "fnv1a32:source-alpha",
        dossierFingerprint: "fnv1a32:dossier-alpha",
        receiptCount: 1,
        perEntity: [
          {
            entityId: "entity:alpha",
            receiptCount: 1,
            receiptKeys: ["receipt:alpha-3"],
          },
        ],
        receipts: alphaReceipts,
      },
    ],
    authority: {
      sameSpeakerEstablished: false,
      interactionEstablished: false,
      continuityEstablished: false,
      causalityEstablished: false,
      trueOriginEstablished: false,
    },
    limitations: [
      "The index establishes receipt membership, not a relationship between moments.",
    ],
    fingerprint: "fnv1a32:matrix-result",
    ...overrides,
  };
}

function setup(overrides = {}) {
  const window = runtime();
  const mount = new FakeMount();
  const calls = {
    export: [],
    lineage: [],
    play: [],
    source: [],
  };
  const ui = window.ShokkerReceiptMatrixUI.create({
    document: { activeElement: null },
    mount,
    onPlay(...args) {
      calls.play.push(args);
    },
    onOpenSource(...args) {
      calls.source.push(args);
    },
    onOpenLineage(...args) {
      calls.lineage.push(args);
    },
    onExport(...args) {
      calls.export.push(args);
    },
    ...overrides.options,
  });
  return { window, mount, calls, ui };
}

test("exports one neutral embedded UI and never preloads media or a dialog", () => {
  const window = runtime();

  assert.equal(window.ShokkerReceiptMatrixUI.VERSION, "1.0.0");
  assert.equal(
    window.ShokkerReceiptMatrixUI.EXPORT_SCHEMA,
    "shokker-receipt-matrix-export/v1",
  );
  assert.equal(typeof window.ShokkerReceiptMatrixUI.create, "function");
  assert.doesNotMatch(uiSource, /<iframe|<video|<audio|role=["']dialog/i);
  assert.doesNotMatch(uiSource, /WWAM|Loomis|Challis|Slenderman|horror/i);
});

test("leads with distinct source and receipt totals and preserves analysis group order", () => {
  const { ui, mount } = setup();
  const state = ui.open({
    query: "Which sources contain both signals?",
    route: routeFixture(),
    analysis: analysisFixture(),
  });

  assert.equal(state.kind, "ready");
  assert.equal(state.uniqueSourceCount, 2);
  assert.equal(state.eligibleReceiptCount, 3);
  assert.equal(state.groupCount, 2);
  assert.equal(state.entityCount, 2);
  assert.equal(mount.getAttribute("data-receipt-matrix-state"), "ready");
  assert.match(mount.innerHTML, /UNIQUE SOURCES/);
  assert.match(mount.innerHTML, /ELIGIBLE RECEIPTS/);
  assert.match(
    mount.innerHTML,
    /Receipts remain grouped by source so repeated evidence inside one upload cannot inflate source coverage/,
  );
  assert.ok(
    mount.innerHTML.indexOf("Second title, ranked first") <
      mount.innerHTML.indexOf("First title, ranked second"),
  );
  assert.match(mount.innerHTML, /OFFICIAL SOURCE 01/);
  assert.match(mount.innerHTML, /OFFICIAL SOURCE 02/);
  assert.equal(mount.heading.focusCount, 1);
});

test("renders per-entity coverage, exact bounded rows, and expandable proof", () => {
  const { ui, mount } = setup();
  ui.open({
    query: "Show the matrix",
    route: routeFixture(),
    analysis: analysisFixture(),
  });

  assert.match(mount.innerHTML, /PER-ENTITY COVERAGE/);
  assert.match(mount.innerHTML, /Alpha Signal/);
  assert.match(mount.innerHTML, /2 SOURCES \/\/ 2 RECEIPTS/);
  assert.match(mount.innerHTML, /Beta Signal/);
  assert.match(mount.innerHTML, /1 SOURCE \/\/ 1 RECEIPT/);
  assert.match(mount.innerHTML, /01:30\.5 &rarr; 01:44\.75/);
  assert.match(mount.innerHTML, /08:21\.2 &rarr; 08:35\.2/);
  assert.match(mount.innerHTML, /TIMESTAMPED-SOURCE-RECEIPT/i);
  assert.match(mount.innerHTML, /NOT-DIARIZED/);
  assert.match(mount.innerHTML, /EXPAND SOURCE PROOF/);
  assert.match(mount.innerHTML, /EXPAND RECEIPT PROOF/);
  assert.match(mount.innerHTML, /fnv1a32:source-beta/);
  assert.match(mount.innerHTML, /fnv1a32:dossier-beta/);
  assert.match(mount.innerHTML, /receipt:alpha-1/);
  assert.match(mount.innerHTML, /exact source ID \/\/ bounded time window/i);
});

test("states the same-upload non-implication boundary without causal shortcuts", () => {
  const { ui, mount } = setup();
  ui.open({
    query: "Did these events happen together?",
    route: routeFixture(),
    analysis: analysisFixture(),
  });

  assert.match(mount.innerHTML, /NON-IMPLICATION BOUNDARY/);
  for (const phrase of [
    "same speaker",
    "interaction",
    "simultaneity",
    "continuity",
    "causality",
    "origin",
  ]) {
    assert.match(mount.innerHTML, new RegExp(phrase, "i"));
  }
  assert.match(mount.innerHTML, /Source dates order uploads/);
  assert.doesNotMatch(
    mount.innerHTML,
    /they interacted|same conversation|confirmed callback|true origin/i,
  );
});

test("play and source actions hand exact canonical coordinates to the host only on click", () => {
  const { ui, mount, calls } = setup();
  ui.open({
    query: "Show the matrix",
    route: routeFixture(),
    analysis: analysisFixture(),
  });

  assert.equal(calls.play.length, 0);
  assert.equal(calls.source.length, 0);
  assert.doesNotMatch(mount.innerHTML, /<iframe|<video|<audio/i);

  mount.action("play", {
    "data-group-index": "0",
    "data-receipt-index": "1",
  });
  assert.equal(calls.play.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(calls.play[0][0])),
    {
      receiptKey: "receipt:beta-2",
      sourceId: "SOURCE_BETA",
      sourceTitle: "Second title, ranked first",
      officialUrl: "https://example.test/source-beta",
      sourceFingerprint: "fnv1a32:source-beta",
      dossierFingerprint: "fnv1a32:dossier-beta",
      at: 501.2,
      end: 515.2,
      date: "2026-06-02",
      excerpt: "A bounded source excerpt for human inspection.",
      label: "Beta event",
      kind: "indexed-event",
      evidenceType: "caption-event",
      evidenceLevel: "timestamped-source-receipt",
      evidenceBasis: ["exact source ID", "bounded time window"],
      reviewState: "human-review-required",
      speaker: null,
      speakerStatus: "not-diarized",
      entityIds: ["entity:beta"],
      matchedEntityIds: ["entity:beta"],
      creatorApproved: false,
      rightsCleared: false,
      canonMutated: false,
      mediaCopied: false,
    },
  );
  assert.equal(
    mount.status.textContent,
    "EXACT RECEIPT HANDED TO THE HOST PLAYER.",
  );

  mount.action("source", {
    "data-group-index": "1",
    "data-receipt-index": "0",
  });
  assert.equal(calls.source.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(calls.source[0][0])),
    {
      sourceId: "SOURCE_ALPHA",
      at: 14,
      end: 29.5,
      receiptKey: "receipt:alpha-3",
      sourceFingerprint: "fnv1a32:source-alpha",
      dossierFingerprint: "fnv1a32:dossier-alpha",
      officialUrl: "https://example.test/source-alpha",
    },
  );
});

test("optional lineage and export actions preserve the neutral route and analysis", () => {
  const { ui, mount, calls } = setup();
  const route = routeFixture();
  const analysis = analysisFixture();
  ui.open({ query: "Show the matrix", route, analysis });

  mount.action("lineage", { "data-entity-index": "1" });
  assert.equal(calls.lineage.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(calls.lineage[0][0])),
    {
      entityId: "entity:beta",
      label: "Beta Signal",
      sourceCount: 1,
      receiptCount: 1,
      query: "Show the matrix",
    },
  );
  assert.equal(calls.lineage[0][1], route);
  assert.equal(calls.lineage[0][2], analysis);

  mount.action("export");
  assert.equal(calls.export.length, 1);
  const payload = calls.export[0][0];
  assert.equal(payload.schema, "shokker-receipt-matrix-export/v1");
  assert.equal(payload.query, "Show the matrix");
  assert.equal(payload.route, route);
  assert.equal(payload.analysis, analysis);
  assert.deepEqual(
    JSON.parse(JSON.stringify(payload.rendered)),
    {
      uniqueSourceCount: 2,
      eligibleReceiptCount: 3,
      groupSourceIds: ["SOURCE_BETA", "SOURCE_ALPHA"],
      entityIds: ["entity:alpha", "entity:beta"],
      state: "ready",
    },
  );
  assert.match(payload.boundary, /same speaker.*interaction.*simultaneity/i);
});

test("canonical array aliases render without inventing omitted entity labels", () => {
  const { ui, mount } = setup();
  const analysis = analysisFixture({
    entityTotals: undefined,
    entityCoverage: [
      {
        entityId: "entity:alpha",
        sourceCount: 2,
        receiptCount: 2,
      },
    ],
    groups: [
      {
        ...analysisFixture().groups[0],
        perEntity: undefined,
        entityCoverage: [
          {
            entityId: "entity:alpha",
            sourceCount: 1,
            receiptCount: 1,
          },
        ],
      },
    ],
    uniqueSourceCount: 1,
    eligibleReceiptCount: 2,
  });
  ui.open({
    query: "Show one entity",
    route: routeFixture({
      matrix: { entityIds: ["entity:alpha"], quantifier: "any" },
      entityLabels: [],
    }),
    analysis,
  });

  assert.match(mount.innerHTML, /entity:alpha/);
  assert.doesNotMatch(mount.innerHTML, /UNKNOWN ENTITY|Untitled entity/i);
  assert.equal(ui.getState().kind, "ready");
});

test("unknown, insufficient, and held routes render honest non-action states", () => {
  const { ui, mount, calls } = setup();

  ui.open({
    query: "Unknown entity?",
    route: routeFixture({ status: "unknown-entity" }),
    analysis: null,
  });
  assert.equal(ui.getState().kind, "unknown");
  assert.match(mount.innerHTML, /THE REQUEST COULD NOT BE RESOLVED/);
  assert.doesNotMatch(mount.innerHTML, /data-receipt-matrix-action="play"/);

  ui.open({
    query: "No exact evidence?",
    route: routeFixture(),
    analysis: {
      status: "insufficient-evidence",
      uniqueSourceCount: 0,
      eligibleReceiptCount: 0,
      groups: [],
      limitations: ["Absence in this index is not proof of absence."],
    },
  });
  assert.equal(ui.getState().kind, "insufficient");
  assert.match(mount.innerHTML, /NO ELIGIBLE RECEIPTS IN THIS SCOPE/);
  assert.match(mount.innerHTML, /not proof the subject never appeared/i);

  ui.open({
    query: "Stale evidence?",
    route: routeFixture(),
    analysis: {
      status: "stale-binding-held",
      uniqueSourceCount: 0,
      eligibleReceiptCount: 0,
      groups: [],
    },
  });
  assert.equal(ui.getState().kind, "held");
  assert.match(mount.innerHTML, /MATRIX HELD CLOSED/);
  assert.match(mount.innerHTML, /No receipt action was enabled/);
  assert.equal(calls.play.length, 0);
  assert.equal(calls.source.length, 0);
});

test("malformed and foreign rows fail closed while valid exact rows remain usable", () => {
  const { ui, mount, calls } = setup();
  const base = analysisFixture();
  const group = base.groups[0];
  const analysis = analysisFixture({
    uniqueSourceCount: 1,
    eligibleReceiptCount: 1,
    groups: [{
      ...group,
      receiptCount: 1,
      receipts: [
        group.receipts[0],
        receipt({
          receiptKey: "receipt:no-end",
          at: 40,
          end: 40,
        }),
        receipt({
          receiptKey: "receipt:foreign",
          sourceId: "OTHER_SOURCE",
          at: 50,
          end: 60,
        }),
      ],
    }],
  });
  ui.open({
    query: "Show only exact rows",
    route: routeFixture(),
    analysis,
  });

  assert.equal(ui.getState().kind, "ready");
  assert.match(mount.innerHTML, /2 RECEIPT ROWS HELD/);
  assert.match(
    mount.innerHTML,
    /EXACT SOURCE ID, START, AND END ARE REQUIRED/,
  );
  assert.doesNotMatch(mount.innerHTML, /receipt:no-end|receipt:foreign/);
  assert.equal(
    (mount.innerHTML.match(/data-receipt-matrix-action="play"/g) || []).length,
    1,
  );
  mount.action("play", {
    "data-group-index": "0",
    "data-receipt-index": "1",
  });
  assert.equal(calls.play.length, 0);
  assert.match(mount.status.textContent, /RECEIPT HELD/);
});

test("escapes query, vocabulary, entity, source, and excerpt copy", () => {
  const { ui, mount } = setup({
    options: {
      copy: {
        title: '<img src=x onerror="alert(1)">',
      },
    },
  });
  const analysis = analysisFixture();
  analysis.groups[0].sourceTitle = "<script>source()</script>";
  analysis.groups[0].receipts[0].excerpt = '<svg onload="alert(1)">';
  analysis.entityTotals[0].label = "<b>entity</b>";
  ui.open({
    query: '<img src=x onerror="query()">',
    route: routeFixture(),
    analysis,
  });

  assert.doesNotMatch(mount.innerHTML, /<img src=x|<script>|<svg|<b>entity<\/b>/);
  assert.match(
    mount.innerHTML,
    /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/,
  );
  assert.match(mount.innerHTML, /&lt;script&gt;source\(\)&lt;\/script&gt;/);
  assert.match(mount.innerHTML, /&lt;svg onload=&quot;alert\(1\)&quot;&gt;/);
  assert.match(mount.innerHTML, /&lt;b&gt;entity&lt;\/b&gt;/);
});

test("Escape only restores an appropriate explicit launcher and never clears results", () => {
  const launcher = focusNode();
  const { ui, mount } = setup();
  ui.open({
    query: "Show the matrix",
    route: routeFixture(),
    analysis: analysisFixture(),
    launcher,
  });

  const escaped = mount.keydown("Escape");
  assert.equal(escaped.defaultPrevented, true);
  assert.equal(escaped.stopped, true);
  assert.equal(launcher.focusCount, 1);
  assert.equal(ui.getState().open, true);
  assert.match(mount.innerHTML, /Second title, ranked first/);

  const withoutLauncher = setup();
  withoutLauncher.ui.open({
    query: "Show the matrix",
    route: routeFixture(),
    analysis: analysisFixture(),
  });
  const ignored = withoutLauncher.mount.keydown("Escape");
  assert.equal(ignored.defaultPrevented, false);

  const disconnected = focusNode();
  disconnected.isConnected = false;
  const disconnectedSetup = setup();
  disconnectedSetup.ui.open({
    query: "Show the matrix",
    route: routeFixture(),
    analysis: analysisFixture(),
    launcher: disconnected,
  });
  const disconnectedEscape = disconnectedSetup.mount.keydown("Escape");
  assert.equal(disconnectedEscape.defaultPrevented, false);
  assert.equal(disconnected.focusCount, 0);
});

test("destroy removes listeners and mount state without restoring focus", () => {
  const launcher = focusNode();
  const { ui, mount } = setup();
  ui.open({
    query: "Show the matrix",
    route: routeFixture(),
    analysis: analysisFixture(),
    launcher,
  });
  ui.destroy();

  assert.equal(ui.getState().destroyed, true);
  assert.equal(ui.getState().open, false);
  assert.equal(mount.innerHTML, "");
  assert.equal(mount.listeners.has("click"), false);
  assert.equal(mount.listeners.has("keydown"), false);
  assert.equal(mount.getAttribute("data-receipt-matrix-state"), null);
  assert.equal(launcher.focusCount, 0);
  assert.throws(() => ui.open({}), /destroyed/i);
});

test("CSS pins touch, 390px, reduced-motion, contrast, and forced-color behavior", () => {
  assert.match(cssSource, /\.receipt-matrix button,[\s\S]*min-height:\s*44px/);
  assert.match(cssSource, /touch-action:\s*manipulation/);
  assert.match(cssSource, /@media \(max-width:\s*390px\)/);
  assert.match(cssSource, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(cssSource, /@media \(prefers-contrast:\s*more\)/);
  assert.match(cssSource, /@media \(forced-colors:\s*active\)/);
  assert.match(cssSource, /:focus-visible/);
  assert.doesNotMatch(cssSource, /min-width:\s*[4-9]\d\dpx/);
});
