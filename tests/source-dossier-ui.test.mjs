import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiSource = fs.readFileSync(
  path.join(root, "public", "demo", "source-dossier-ui.js"),
  "utf8",
);
const cssSource = fs.readFileSync(
  path.join(root, "public", "demo", "source-dossier.css"),
  "utf8",
);

function runtime() {
  const window = {};
  const sandbox = { window, globalThis: window };
  window.window = window;
  vm.createContext(sandbox);
  vm.runInContext(uiSource, sandbox, {
    filename: "source-dossier-ui.js",
  });
  return window.WWAMSourceDossierUI;
}

class FakeMount {
  constructor() {
    this.attributes = new Map();
    this.listeners = new Map();
    this.innerHTML = "";
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  click(action, attributes = {}) {
    let prevented = false;
    const target = {
      closest(selector) {
        return selector === "[data-source-dossier-action]" ? this : null;
      },
      getAttribute(name) {
        if (name === "data-source-dossier-action") return action;
        return attributes[name] ?? null;
      },
    };
    this.listeners.get("click")?.({
      target,
      preventDefault() {
        prevented = true;
      },
    });
    return prevented;
  }
}

function makeReceipt(index) {
  return {
    key: `SOURCE00001:receipt-${index}`,
    at: 60 + index * 71,
    end: 82 + index * 71,
    kind: index % 3 === 0 ? "character-bit" : "commentary-beat",
    label: `INDEXED MOMENT ${index + 1}`,
    excerpt: `Bounded source excerpt ${index + 1}.`,
    evidenceLevel: "timestamped-caption-receipt",
    evidenceType: "caption-excerpt",
    evidenceBasis: "official automatic caption event",
    reviewState: index % 2 === 0 ? "machine-candidate" : "human-reviewed",
    speaker: null,
    speakerStatus: "not-diarized",
    promotionAllowed: false,
    publicExcerptAllowed: true,
    entityIds: ["character:doctor-example"],
    url: `https://www.youtube.com/watch?v=SOURCE00001&t=${60 + index * 71}s`,
  };
}

function connection({
  sourceId,
  title,
  date,
  direction,
  basis,
  withReceipts = true,
}) {
  return {
    sourceId,
    sourceFingerprint: `src-${sourceId}`,
    title,
    displayTitle: title,
    date,
    thumbnail: `https://i.ytimg.com/vi/${sourceId}/maxresdefault.jpg`,
    coverage: withReceipts ? "caption-backed" : "metadata-only",
    authority: withReceipts ? "promoted-lane" : "source-only",
    direction,
    basis,
    sharedEntities: [
      {
        id: "character:doctor-example",
        label: "Doctor Example",
        type: "character",
        basis: withReceipts ? "timestamped-receipt" : "cached-title-alias",
        localReceiptKeys: withReceipts ? ["SOURCE00001:receipt-0"] : [],
        relatedReceiptKeys: withReceipts ? [`${sourceId}:receipt-0`] : [],
      },
    ],
    artifactIds: [],
  };
}

function makeDossier({ metadataOnly = false, receiptCount = 21 } = {}) {
  const receipts = metadataOnly
    ? []
    : Array.from({ length: receiptCount }, (_, index) => makeReceipt(index));
  const source = {
    id: "SOURCE00001",
    title: "The Tape That Refused to Die",
    displayTitle: "THE TAPE THAT REFUSED TO DIE",
    date: "2026-07-23",
    duration: 7412,
    views: 987654,
    thumbnail: "https://i.ytimg.com/vi/SOURCE00001/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=SOURCE00001",
    availability: "public-at-snapshot",
    liveStatus: "was-live",
    coverage: metadataOnly ? "metadata-only" : "caption-backed",
    authority: metadataOnly ? "source-only" : "promoted-lane",
    lanes: ["watchalong", "live-stream"],
    sourceType: "commentary",
    wordsAudited: metadataOnly ? 0 : 18340,
    summary: metadataOnly
      ? null
      : {
          text: "A bounded description assembled only from this source file.",
          basis: "caption-derived source summary",
        },
    rightsPolicy: {
      speakerClaimsAllowed: false,
      rightsCleared: false,
    },
    warnings: ["Speakers are not diarized."],
    metrics: {},
    receipts,
    entities: metadataOnly
      ? [
          {
            id: "title:doctor-example",
            label: "Doctor Example",
            type: "title-alias",
            basis: "cached-title-alias",
            receiptKeys: [],
          },
        ]
      : [
          {
            id: "character:doctor-example",
            label: "Doctor Example",
            type: "character",
            basis: "timestamped-receipt",
            receiptKeys: ["SOURCE00001:receipt-0"],
          },
          {
            id: "franchise:example",
            label: "Example Franchise",
            type: "franchise",
            basis: "catalog-declared-entity",
            receiptKeys: [],
          },
        ],
    artifacts: metadataOnly
      ? []
      : [
          {
            id: "artifact:supercut",
            kind: "supercut-draft",
            label: "DOCTOR EXAMPLE SUPERCUT",
            authority: "creator-draft",
            reviewState: "human-review-required",
            sourceIds: ["SOURCE00001", "SOURCE00002"],
            receiptKeys: ["SOURCE00001:receipt-0"],
            at: 60,
            targetSection: "clip-lab",
            risk: "medium",
          },
          {
            id: "artifact:fact-check",
            kind: "fact-check-card",
            label: "CONTINUITY REVIEW CARD",
            authority: "editor-review",
            reviewState: "editor-review-required",
            sourceIds: ["SOURCE00001"],
            receiptKeys: ["SOURCE00001:receipt-1"],
            at: 131,
            targetSection: "review-desk",
            risk: "high",
          },
        ],
    sourceFingerprint: "src-SOURCE00001",
  };
  const laterEvidence = connection({
    sourceId: "SOURCE00002",
    title: "A Later Receipt-Backed Tape",
    date: "2026-07-24",
    direction: "later",
    basis: "receipt-backed-entity",
  });
  const laterMetadata = connection({
    sourceId: "SOURCE00003",
    title: "Later Title Metadata Only",
    date: "2026-07-25",
    direction: "later",
    basis: "source-metadata-neighbor",
    withReceipts: false,
  });
  const earlier = connection({
    sourceId: "SOURCE00000",
    title: "Earlier Archive Neighbor",
    date: "2026-07-20",
    direction: "earlier",
    basis: "registered-source-entity",
  });

  return {
    schema: "shokker-source-dossier/v1",
    version: "1.0.0",
    bindings: {
      channelId: "channel-neutral-fixture",
      channelLabel: "Channel Neutral Fixture",
      channelPackFingerprint: "cp1-fixture",
      snapshotDate: "2026-07-24",
      archiveFingerprint: "archive-fixture",
    },
    source,
    proof: {
      coverage: source.coverage,
      authority: source.authority,
      sourceOnly: metadataOnly,
      captionLimited: false,
      quarantined: false,
      speakerDiarized: false,
      creatorApproved: false,
      rightsCleared: false,
      canonPromotedByDossier: false,
      evidenceBoundary: metadataOnly
        ? "No topic, quote, character, or event claim can be made from title metadata."
        : "Claims stop at the bounded coordinates and typed inventory in this dossier.",
    },
    receiptSummary: {
      total: receipts.length,
      byKind: metadataOnly
        ? {}
        : { "commentary-beat": 14, "character-bit": 7 },
      byEvidenceType: metadataOnly ? {} : { "caption-excerpt": receipts.length },
    },
    artifactSummary: {
      total: source.artifacts.length,
      byKind: metadataOnly
        ? {}
        : { "supercut-draft": 1, "fact-check-card": 1 },
      byAuthority: metadataOnly
        ? {}
        : { "creator-draft": 1, "editor-review": 1 },
    },
    wake: {
      total: 3,
      later: [laterEvidence, laterMetadata],
      earlier: [earlier],
    },
    chronology: {
      previous: {
        sourceId: "SOURCE00000",
        title: "Earlier Archive Neighbor",
        date: "2026-07-20",
      },
      next: {
        sourceId: "SOURCE00002",
        title: "A Later Receipt-Backed Tape",
        date: "2026-07-24",
      },
    },
    fingerprint: "dossier-fixture",
  };
}

function setup(dossier = makeDossier(), overrides = {}) {
  const mount = new FakeMount();
  const engine = {
    buildCalls: [],
    exportCalls: [],
    build(sourceId) {
      this.buildCalls.push(sourceId);
      return dossier;
    },
    exportManifest(sourceId) {
      this.exportCalls.push(sourceId);
      return {
        schema: "shokker-source-dossier-export/v1",
        source: { id: sourceId },
      };
    },
  };
  const api = runtime();
  const ui = api.create({
    engine,
    document: {},
    mount,
    ...overrides,
  });
  return { api, ui, mount, engine, dossier };
}

test("exports the isolated UI API, renders 21 receipts, and destroys cleanly", () => {
  const { api, ui, mount, engine, dossier } = setup();
  const rendered = ui.render("SOURCE00001", { at: 333 });

  assert.equal(api.VERSION, "1.0.0");
  assert.equal(ui.version, "1.0.0");
  assert.equal(rendered, dossier);
  assert.deepEqual(engine.buildCalls, ["SOURCE00001"]);
  assert.equal(mount.getAttribute("data-source-dossier-state"), "ready");
  assert.equal(mount.getAttribute("data-source-dossier-id"), "SOURCE00001");
  assert.equal(
    (mount.innerHTML.match(/class="source-dossier-receipt"/g) ?? []).length,
    21,
  );
  assert.match(mount.innerHTML, /21 PLAYABLE SOURCE RECEIPTS/);
  assert.match(mount.innerHTML, /MEMORY OS FOOTPRINT/);
  assert.match(mount.innerHTML, /PUT THE ARCHIVE TO WORK/);
  assert.match(mount.innerHTML, /WHAT THIS PAGE CAN PROVE/);
  assert.match(mount.innerHTML, /SOURCE-SPECIFIC EVIDENCE WARNINGS/);
  assert.match(mount.innerHTML, /Speakers are not diarized/);

  ui.destroy();
  assert.equal(mount.innerHTML, "");
  assert.equal(mount.listeners.has("click"), false);
  assert.equal(mount.getAttribute("data-source-dossier-state"), null);
  assert.throws(
    () => ui.render("SOURCE00001"),
    /has been destroyed/,
  );
});

test("metadata-only sources render a permanent refusal instead of invented content", () => {
  const { ui, mount } = setup(makeDossier({
    metadataOnly: true,
    receiptCount: 0,
  }));
  ui.render("SOURCE00001");

  assert.match(mount.innerHTML, /METADATA-ONLY REFUSAL/);
  assert.match(mount.innerHTML, /THE ARCHIVE REFUSES TO INVENT THE MISSING TAPE/);
  assert.match(mount.innerHTML, /0 transcript-derived receipts/);
  assert.match(mount.innerHTML, /0 content summaries/);
  assert.match(mount.innerHTML, /0 speaker claims/);
  assert.doesNotMatch(mount.innerHTML, /SOURCE-BOUNDED SUMMARY/);
  assert.doesNotMatch(mount.innerHTML, /class="source-dossier-receipt"/);
  assert.match(mount.innerHTML, /No topic, quote, character, or event claim/);
});

test("render stays media-dormant until the app receives an explicit play callback", () => {
  const plays = [];
  const { ui, mount } = setup(makeDossier(), {
    onPlay(payload) {
      plays.push(payload);
    },
  });
  ui.render("SOURCE00001", { at: 333 });

  assert.equal(plays.length, 0);
  assert.match(mount.innerHTML, /id="modalPlayer"/);
  assert.match(mount.innerHTML, /THE PLAYER STAYS DORMANT UNTIL YOU ASK FOR IT/);
  assert.doesNotMatch(mount.innerHTML, /<(iframe|video|audio)\b/i);
  assert.doesNotMatch(mount.innerHTML, /\bautoplay\b/i);
  assert.equal(mount.click("play-source"), true);
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "source");
  assert.equal(plays[0].sourceId, "SOURCE00001");
  assert.equal(plays[0].at, 333);
});

test("delegated controls provide bounded payloads for every app-owned action", () => {
  const calls = {
    play: [],
    bag: [],
    copy: [],
    download: [],
    ask: [],
    companion: [],
    open: [],
  };
  const { ui, mount, engine } = setup(makeDossier(), {
    onPlay: (payload) => calls.play.push(payload),
    onBagReceipt: (payload) => calls.bag.push(payload),
    onCopyLink: (payload) => calls.copy.push(payload),
    onDownload: (payload) => calls.download.push(payload),
    onAskSource: (payload) => calls.ask.push(payload),
    onOpenCompanion: (payload) => calls.companion.push(payload),
    onOpenSource: (payload) => calls.open.push(payload),
  });
  ui.render("SOURCE00001", { at: 444 });

  mount.click("play-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-2",
  });
  mount.click("bag-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-3",
  });
  mount.click("copy-link");
  mount.click("download");
  mount.click("ask-source");
  mount.click("open-companion");
  mount.click("open-source", { "data-source-id": "SOURCE00002" });
  mount.click("open-source", { "data-source-id": "SOURCE00000" });

  assert.equal(calls.play[0].mode, "receipt");
  assert.equal(calls.play[0].at, makeReceipt(2).at);
  assert.equal(calls.play[0].receipt.key, "SOURCE00001:receipt-2");
  assert.equal(calls.bag[0].receipt.key, "SOURCE00001:receipt-3");
  assert.equal(calls.copy[0].at, 444);
  assert.equal(calls.download[0].filename, "source-dossier-SOURCE00001.json");
  assert.equal(
    calls.download[0].manifest.schema,
    "shokker-source-dossier-export/v1",
  );
  assert.deepEqual(engine.exportCalls, ["SOURCE00001"]);
  assert.equal(calls.ask[0].title, "THE TAPE THAT REFUSED TO DIE");
  assert.equal(calls.companion[0].at, 444);
  assert.equal(calls.open[0].targetSourceId, "SOURCE00002");
  assert.equal(calls.open[0].connection.basis, "receipt-backed-entity");
  assert.equal(calls.open[0].chronology, "next");
  assert.equal(calls.open[1].chronology, "previous");
});

test("the Tape's Wake visibly separates dual-ended evidence from metadata and earlier neighbors", () => {
  const { ui, mount } = setup();
  ui.render("SOURCE00001");
  const html = mount.innerHTML;
  const laterHeading = html.indexOf("LATER // DUAL-ENDED EVIDENCE");
  const evidence = html.indexOf("A Later Receipt-Backed Tape");
  const neighborHeading = html.indexOf("TITLE / EARLIER NEIGHBORHOOD");
  const metadata = html.indexOf("Later Title Metadata Only");
  const earlier = html.indexOf("Earlier Archive Neighbor");

  assert.ok(laterHeading >= 0);
  assert.ok(evidence > laterHeading);
  assert.ok(neighborHeading > evidence);
  assert.ok(metadata > neighborHeading);
  assert.ok(earlier > neighborHeading);
  assert.equal(
    html.slice(laterHeading, neighborHeading).includes("Later Title Metadata Only"),
    false,
  );
  assert.match(html, /does not prove influence, causality, a callback/);
  assert.match(html, /TITLE-METADATA NEIGHBOR \/\/ NOT CONTENT EVIDENCE/);
  assert.match(html, /KEPT OUTSIDE THE CALLBACK CLAIM/);
});

test("markup exposes landmarks, accessible control names, and safe official links", () => {
  const { ui, mount } = setup();
  ui.render("SOURCE00001");

  assert.match(
    mount.innerHTML,
    /<article class="source-dossier[^"]*" aria-labelledby="sourceDossierTitle" aria-describedby="sourceDossierBoundary">/,
  );
  assert.match(
    mount.innerHTML,
    /<h2 id="sourceDossierTitle" tabindex="-1">/,
  );
  assert.match(
    mount.innerHTML,
    /id="modalPlayer"[^>]*aria-live="polite"/,
  );
  assert.match(
    mount.innerHTML,
    /aria-label="Play THE TAPE THAT REFUSED TO DIE inside this page"/,
  );
  assert.match(
    mount.innerHTML,
    /aria-label="Save INDEXED MOMENT 1 to the evidence bag"/,
  );
  assert.match(
    mount.innerHTML,
    /<nav class="source-dossier-chronology" aria-label="Source chronology">/,
  );
  assert.match(
    mount.innerHTML,
    /target="_blank" rel="noopener"/,
  );
  assert.doesNotMatch(mount.innerHTML, /\sonclick=/i);
});

test("invalid engine output fails closed and renders no unverified source claim", () => {
  const mount = new FakeMount();
  const ui = runtime().create({
    engine: {
      build() {
        return { source: { id: "BAD" } };
      },
    },
    mount,
  });

  assert.equal(ui.render("BAD"), null);
  assert.equal(mount.getAttribute("data-source-dossier-state"), "failed");
  assert.match(mount.innerHTML, /THE PAGE FAILED CLOSED/);
  assert.match(mount.innerHTML, /No metadata, content, relationship, or authority claim/);
  assert.doesNotMatch(mount.innerHTML, /source-dossier-hero/);
});

test("responsive stylesheet preserves touch targets, focus, and reduced motion", () => {
  assert.match(cssSource, /@media \(max-width:\s*820px\)/);
  assert.match(cssSource, /@media \(max-width:\s*600px\)/);
  assert.match(cssSource, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(
    cssSource,
    /\.source-dossier button,\s*\n\.source-dossier a\s*\{[^}]*min-height:\s*44px/s,
  );
  assert.match(cssSource, /:focus-visible/);
  assert.match(cssSource, /transition-duration:\s*\.01ms\s*!important/);
  assert.doesNotMatch(cssSource, /@import/i);
});
