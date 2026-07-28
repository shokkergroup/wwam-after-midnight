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
    this.focusCount = 0;
    this.jumpTargets = new Map();
    this.modal = null;
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
        if (selector === "[data-source-dossier-action]") return this;
        if (
          selector === "[data-source-dossier-section]" &&
          attributes["data-owner-section"]
        ) {
          return {
            getAttribute(name) {
              return name === "data-source-dossier-section"
                ? attributes["data-owner-section"]
                : null;
            },
          };
        }
        return null;
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

  submit(query) {
    let prevented = false;
    const form = {
      matches(selector) {
        return selector === "[data-source-dossier-query-form]";
      },
      elements: {
        query: { value: query },
      },
    };
    this.listeners.get("submit")?.({
      target: form,
      preventDefault() {
        prevented = true;
      },
    });
    return prevented;
  }

  registerJumpTarget(
    id,
    { hiddenResearch = false, requiresFullFile = false, rectTop = 0 } = {},
  ) {
    const headingAttributes = new Map();
    const heading = {
      focusCount: 0,
      hasAttribute(name) {
        return headingAttributes.has(name);
      },
      setAttribute(name, value) {
        headingAttributes.set(name, String(value));
      },
      getAttribute(name) {
        return headingAttributes.get(name) ?? null;
      },
      focus() {
        this.focusCount += 1;
      },
    };
    const target = {
      heading,
      requiresFullFile,
      scrollCalls: [],
      getBoundingClientRect() {
        return { top: rectTop, bottom: rectTop + 240, height: 240 };
      },
      querySelector(selector) {
        return selector === "h2,h3,h4,h5" ? heading : null;
      },
      closest(selector) {
        return hiddenResearch && selector === "#sourceDossierDeepResearch[hidden]" ? {} : null;
      },
      scrollIntoView(options) {
        this.scrollCalls.push(options);
      },
    };
    this.jumpTargets.set(`#${id}`, target);
    return target;
  }

  clickLink(href) {
    let prevented = false;
    const target = {
      closest(selector) {
        return selector === 'a[href^="#sourceDossier"]' ? this : null;
      },
      getAttribute(name) {
        return name === "href" ? href : null;
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

  closest(selector) {
    return selector === "#tapeModal" ? this.modal : null;
  }

  querySelector(selector) {
    if (this.jumpTargets.has(selector)) {
      const target = this.jumpTargets.get(selector);
      if (
        target.requiresFullFile &&
        !this.innerHTML.includes('data-source-dossier-view="full"')
      ) return null;
      return target;
    }
    if (selector !== "#sourceDossierQuery") return null;
    return {
      focus: () => {
        this.focusCount += 1;
      },
      scrollIntoView() {},
    };
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
    signalScore: index === 2 ? 94.6 : index === 4 ? 87 : null,
    signalBasis: index === 2
      ? "caption density + room reaction"
      : index === 4
        ? "registered comedy signal"
        : "",
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
    showWiki: {
      label: "WWAM SHOW WIKI",
      status: metadataOnly ? "source-brief" : "distilled",
      description: metadataOnly
        ? "Canonical source identity is ready while content lanes remain sealed."
        : "A source-locked map of this broadcast, built from registered receipts only.",
      brief: metadataOnly
        ? {
            kind: "source-metadata-brief",
            scope: "canonical-source-metadata-only",
            format: "MOVIE COMMENTARY",
            formatBasis: "registered-source-type-and-title",
            queryAliases: ["show source brief", "what can you prove about this show"],
          }
        : null,
      recap: metadataOnly
        ? null
        : {
            format: "LIVE AFTERSHOW",
            formatBasis: "registered source type + caption-backed topic map",
            overview: "A chaotic franchise aftershow that moves from the opening argument into a full-room breakdown and a final recurring-character button.",
            blocks: [
              {
                label: "THE OPENING ARGUMENT",
                body: "The tape opens by setting the movie debate and the night’s first hard turn.",
                basis: "caption-backed topic receipts",
                receiptKeys: ["SOURCE00001:receipt-0", "SOURCE00001:receipt-1"],
              },
              {
                label: "THE ROOM BREAKS",
                body: "The strongest registered reaction signals cluster in the middle of the show.",
                basis: "registered heat + bounded excerpts",
                receiptKeys: ["SOURCE00001:receipt-2", "SOURCE00001:receipt-4"],
              },
              {
                label: "THE LAST WORD",
                body: "A recurring-character receipt closes the mapped editorial arc.",
                basis: "caption-backed character receipt",
                receiptKeys: ["SOURCE00001:receipt-6"],
              },
            ],
          },
      experience: {
        id: metadataOnly ? "source-brief" : "midnight-cut",
        label: metadataOnly ? "CONTENT ROUTE" : "TOPIC HOP // PLAYABLE SHOW ROUTE",
        title: metadataOnly ? "CONTENT ROUTE NOT DISTILLED" : "THE MIDNIGHT CUT",
        description: metadataOnly
          ? "No semantic watch route is inferred from canonical source metadata."
          : "A five-stop playable route through the strongest registered turns in this broadcast.",
        emptyState: metadataOnly
          ? "Content lanes remain sealed until source-local evidence is registered."
          : "No source-locked Midnight Cut route is registered for this show yet.",
        selectionBasis: metadataOnly
          ? "canonical-source-metadata-only"
          : "registered heat + topic spread + recurring-character coverage",
        routeReceiptKeys: metadataOnly
          ? []
          : [
              "SOURCE00001:receipt-2",
              "SOURCE00001:receipt-4",
              "SOURCE00001:receipt-5",
              "SOURCE00001:receipt-0",
              "SOURCE00001:receipt-6",
              "SOURCE00001:receipt-2",
              "SOURCE00001:not-registered",
            ],
        pulseReceiptKeys: metadataOnly
          ? []
          : [
              "SOURCE00001:receipt-2",
              "SOURCE00001:receipt-4",
              "SOURCE00001:receipt-0",
              "SOURCE00001:receipt-2",
            ],
      },
      lanes: [
        {
          id: "topics",
          label: "TOPICS DISCUSSED",
          description: "Playable topic doors registered to this upload.",
          emptyState: "No caption-backed topic receipt is registered for this show yet.",
          receiptKeys: metadataOnly
            ? []
            : ["SOURCE00001:receipt-0", "SOURCE00001:receipt-1"],
        },
        {
          id: "best-moments",
          label: "BEST MOMENTS",
          description: "The strongest registered archive signals from this show.",
          emptyState: "No Best Moments receipt is registered for this show yet.",
          receiptKeys: metadataOnly
            ? []
            : [
                "SOURCE00001:receipt-2",
                "SOURCE00001:receipt-2",
                "SOURCE00001:not-registered",
                "SOURCE00001:receipt-3",
              ],
        },
        {
          id: "up-in-ya",
          label: "WWAM UP IN YA",
          description: "Registered out-of-pocket comedy receipts.",
          emptyState: "No WWAM UP IN YA receipt is registered for this show yet.",
          receiptKeys: metadataOnly ? [] : ["SOURCE00001:receipt-4"],
        },
        {
          id: "straight-to-steves-asshole",
          label: "STRAIGHT TO STEVE'S ASSHOLE",
          description: "Registered strong-negative-take candidates from this upload.",
          emptyState: "No strong-negative-take receipt is registered for this show yet.",
          receiptKeys: metadataOnly ? [] : ["SOURCE00001:receipt-5"],
        },
        {
          id: "character-bits",
          label: "CHARACTER BITS",
          description: "Recurring-character performance receipts in this source.",
          emptyState: "No recurring-character receipt is registered for this show yet.",
          receiptKeys: metadataOnly
            ? []
            : ["SOURCE00001:receipt-0", "SOURCE00001:receipt-6"],
        },
      ],
    },
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
    sourceFingerprint: "fnv1a32:11111111",
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

function makeQueryAnswer(
  dossier,
  {
    status = "inventory",
    results = [
      {
        type: "metadata",
        sourceId: dossier.source.id,
        field: "source-inventory",
        value: {
          receipts: dossier.receiptSummary,
          entities: dossier.source.entities.length,
          artifacts: dossier.artifactSummary,
          connections: {
            total: dossier.wake.later.length + dossier.wake.earlier.length,
          },
          summaryAvailable: Boolean(dossier.source.summary),
          sourceBriefAvailable: Boolean(dossier.source.showWiki?.brief),
        },
        basis: "registered-dossier-inventory",
      },
    ],
    message = "This answer uses only the exact source dossier.",
    query = "What is actually indexed in this tape?",
    intent = "",
    episode = null,
  } = {},
) {
  return {
    schema: "shokker-source-query-result/v1",
    version: "1.0.0",
    status,
    intent,
    episode,
    scope: {
      exactSource: true,
      sourceId: dossier.source.id,
      sourceFingerprint: dossier.source.sourceFingerprint,
      dossierFingerprint: dossier.fingerprint,
      channelId: dossier.bindings.channelId,
      channelPackFingerprint: dossier.bindings.channelPackFingerprint,
      snapshotDate: dossier.bindings.snapshotDate,
      archiveFingerprint: dossier.bindings.archiveFingerprint,
      query,
      at: 0,
      limit: 3,
    },
    sourceProof: {
      sourceId: dossier.source.id,
      sourceFingerprint: dossier.source.sourceFingerprint,
      dossierFingerprint: dossier.fingerprint,
      title: dossier.source.displayTitle,
    },
    message,
    results,
    resultCount: results.length,
    limitations: [
      `Every content result is constrained to exact source ID ${dossier.source.id}.`,
    ],
    boundary: {
      exactSourceOnly: true,
      crossSourceSubstitutionAllowed: false,
      crossSourceSubstitution: false,
    },
    fingerprint: "fnv1a32:22222222",
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
  const queryEngine = {
    answerCalls: [],
    answer(request) {
      this.answerCalls.push(request);
      return makeQueryAnswer(dossier, { query: request.query });
    },
  };
  const api = runtime();
  const ui = api.create({
    engine,
    queryEngine,
    document: {},
    mount,
    ...overrides,
  });
  return {
    api,
    ui,
    mount,
    engine,
    queryEngine: overrides.queryEngine ?? queryEngine,
    dossier,
  };
}

function makeAftermathHarness(dossier) {
  const pack = {
    schema: "shokker.aftermath-pack/v1",
    version: "1.0.0",
    fingerprint: "ap1-ui-fixture",
    bindings: {
      dossierFingerprint: dossier.fingerprint,
      sourceFingerprint: dossier.source.sourceFingerprint,
      clipLabFingerprint: "clip-ui-fixture",
    },
    source: {
      id: dossier.source.id,
      title: dossier.source.displayTitle,
      date: dossier.source.date,
      duration: dossier.source.duration,
    },
    eligibility: {
      status: "REVIEW AVAILABLE",
      creatorApproved: false,
      rightsCleared: false,
    },
    showDelta: {
      summary: "This show added one bounded creator candidate.",
      inference: "Compared only with the previous indexed show.",
      newSincePreviousIndexedStream: ["Halloween"],
      peakChemistry: 88,
      funniest: { receiptId: "SOURCE00001:receipt-2" },
      strongestTopic: { receiptId: "SOURCE00001:receipt-0" },
      graphDelta: { topicNodesAdded: 1, timestampedReceiptsAdded: 21 },
    },
    metrics: {
      opportunities: 1,
      shorts: 1,
      supercutMemberships: 0,
      resurfacingPairs: 0,
      clipReady: 1,
      fastReview: 0,
      archiveExpansion: 0,
      researchQueue: 0,
      quarantined: 0,
      referenceThreads: 1,
      coldOpenStoryboards: 1,
      sourceReceipts: 21,
      registeredArtifactMemberships: 3,
    },
    opportunities: [
      {
        id: "short:ui-fixture",
        kind: "short",
        title: "DOCTOR EXAMPLE ENTERS THE ROOM",
        readiness: "clip-ready",
        sourceId: dossier.source.id,
        sourceFingerprint: dossier.source.sourceFingerprint,
        fingerprint: "ao1-ui-fixture",
        multiSource: false,
        coordinates: [
          {
            sourceId: dossier.source.id,
            receiptKey: "SOURCE00001:receipt-2",
            at: 273,
            timecode: "4:33",
            proposedWindow: {
              in: 270,
              out: 290,
              seconds: 20,
              inTimecode: "4:30",
              outTimecode: "4:50",
            },
            publicExcerpt: "Bounded source excerpt three.",
            excerptLabel: "ARCHIVAL CAPTION EXCERPT / MAX 16 WORDS",
            speakerStatus: "not-diarized",
          },
        ],
        relatedSources: [],
        editorial: {
          label: "SUGGESTED EDITORIAL COPY / NOT AN ARCHIVAL QUOTE",
          titleOptions: ["DOCTOR EXAMPLE ENTERS THE ROOM"],
          hookOptions: ["The tape found the exact turn."],
        },
        rationale: "Registered caption strength and curated review state.",
        score: {
          overall: 81,
          basis: "Transparent editorial priority.",
          components: [{ id: "receipt-strength", value: 82 }],
        },
        evidence: { label: "MEDIUM" },
        risk: { label: "LOW" },
        approval: { humanReviewRequired: true, checks: ["Watch context."] },
      },
    ],
    research: [
      {
        id: "lineage:ui-fixture",
        title: "DOCTOR EXAMPLE LINEAGE",
        boundary: "REFERENCE-ONLY RESEARCH THREAD",
        receipts: [{ receiptKey: "SOURCE00001:receipt-0", timecode: "2:11" }],
      },
    ],
    storyboards: [
      {
        id: "cold-open:ui-fixture",
        title: "DOCTOR EXAMPLE COLD OPEN",
        formatSeconds: 30,
        mode: "CALLBACK LADDER",
        registrationBoundary: "GENERATED STORYBOARD / SEPARATE FROM REGISTERED ARTIFACT MEMBERSHIPS",
        localSlots: [{ receiptKey: "SOURCE00001:receipt-2", timecode: "4:33" }],
      },
    ],
  };
  const review = (decisions = []) => {
    const counts = { keep: 0, hold: 0, reject: 0, unreviewed: pack.opportunities.length - decisions.length };
    decisions.forEach((decision) => { counts[decision.status] += 1; });
    return {
      schema: "shokker.aftermath-review/v1",
      version: "1.0.0",
      sourceId: dossier.source.id,
      decisions: decisions.map((decision) => ({
        ...decision,
        decisionMeaning: decision.status === "keep"
          ? "KEEP FOR CREATOR REVIEW"
          : decision.status === "hold"
            ? "HOLD FOR MORE CONTEXT"
            : "REJECT FROM THIS LOCAL PACK",
      })),
      counts,
      creatorApproved: false,
      rightsCleared: false,
      promotionAllowed: false,
      fingerprint: "ar1-ui-" + decisions.length,
    };
  };
  const engine = {
    buildCalls: [],
    createReviewCalls: [],
    exportCalls: [],
    build(sourceId) {
      this.buildCalls.push(sourceId);
      return pack;
    },
    createReview(sourceId, decisions) {
      this.createReviewCalls.push({ sourceId, decisions });
      return review(decisions);
    },
    restoreReview(sourceId, saved) {
      assert.equal(sourceId, dossier.source.id);
      return saved;
    },
    exportPacket(sourceId, savedReview) {
      this.exportCalls.push({ sourceId, savedReview });
      return {
        schema: "shokker.aftermath-editor-packet/v1",
        source: pack.source,
        summary: savedReview.counts,
        fingerprint: "ae1-ui-fixture",
      };
    },
    exportMarkdown() {
      return "# THE AFTERMATH PACK\n\nDraft editor brief.";
    },
  };
  return { pack, engine, review };
}

test("exports the per-show Wiki UI, keeps curated lanes first, and destroys cleanly", () => {
  const { api, ui, mount, engine, dossier } = setup();
  const rendered = ui.render("SOURCE00001", { at: 333 });

  assert.equal(api.VERSION, "1.10.0");
  assert.equal(ui.version, "1.10.0");
  assert.equal(rendered, dossier);
  assert.deepEqual(engine.buildCalls, ["SOURCE00001"]);
  assert.equal(mount.getAttribute("data-source-dossier-state"), "ready");
  assert.equal(mount.getAttribute("data-source-dossier-id"), "SOURCE00001");
  assert.equal(
    (mount.innerHTML.match(/class="source-dossier-receipt"/g) ?? []).length,
    0,
  );
  assert.equal(
    (
      mount.innerHTML.match(
        /class="source-dossier-receipt source-dossier-wiki-receipt"/g,
      ) ?? []
    ).length,
    0,
  );
  assert.match(mount.innerHTML, /3 STARTER MOMENTS\. NO HUNTING/);
  assert.match(mount.innerHTML, /OPEN THE COMPLETE WATCH PATH/);
  assert.match(mount.innerHTML, /21 EXACT TIMESTAMPS FROM THIS SHOW/);
  assert.match(mount.innerHTML, /0 OF 21 TIMESTAMPS VISIBLE/);
  assert.match(mount.innerHTML, /SHOW ALL 21 TIMESTAMPS/);
  assert.match(mount.innerHTML, /EXPLORE ALL/);
  assert.match(mount.innerHTML, /id="sourceDossierDeepResearch" hidden/);
  assert.match(mount.innerHTML, /FIND IT WITHOUT SCRUBBING FOR HOURS/);
  assert.match(mount.innerHTML, /MEMORY OS FOOTPRINT/);
  assert.match(mount.innerHTML, /PUT THE ARCHIVE TO WORK/);
  assert.match(mount.innerHTML, /HOW THIS PAGE STAYS HONEST/);
  assert.match(mount.innerHTML, /SOURCE-SPECIFIC EVIDENCE WARNINGS/);
  assert.match(mount.innerHTML, /Speakers are not diarized/);

  mount.click("open-full-file");
  assert.match(mount.innerHTML, /data-source-dossier-view="full"/);
  assert.equal(
    (mount.innerHTML.match(
      /class="source-dossier-receipt source-dossier-wiki-receipt"/g,
    ) ?? []).length,
    7,

  );
  ui.destroy();
  assert.equal(mount.innerHTML, "");
  assert.equal(mount.listeners.has("click"), false);
  assert.equal(mount.listeners.has("submit"), false);
  assert.equal(mount.getAttribute("data-source-dossier-state"), null);
  assert.throws(
    () => ui.render("SOURCE00001"),
    /has been destroyed/,
  );
});



test("inline Aftermath Pack turns a source into one bounded creator review desk", () => {
  const dossier = makeDossier();
  const harness = makeAftermathHarness(dossier);
  const { ui, mount } = setup(dossier, {
    aftermathEngine: harness.engine,
  });
  ui.render(dossier.source.id, { section: "aftermath" });

  assert.deepEqual(harness.engine.buildCalls, [dossier.source.id]);
  assert.match(mount.innerHTML, /THE AFTERMATH PACK \/\/ THIS UPLOAD CLOCKED IN FOR WORK/);
  assert.match(mount.innerHTML, /WHAT THIS SHOW ADDED/);
  assert.match(mount.innerHTML, /DOCTOR EXAMPLE ENTERS THE ROOM/);
  assert.match(mount.innerHTML, /SUGGESTED EDITORIAL COPY \/ NOT AN ARCHIVAL QUOTE/);
  assert.match(mount.innerHTML, /ARCHIVAL CAPTION EXCERPT \/ MAX 16 WORDS/);
  assert.match(mount.innerHTML, /KEEP FOR CREATOR REVIEW/);
  assert.match(mount.innerHTML, /HOLD FOR MORE CONTEXT/);
  assert.match(mount.innerHTML, /REJECT FROM THIS PACK/);
  assert.match(mount.innerHTML, /DOCTOR EXAMPLE LINEAGE/);
  assert.match(mount.innerHTML, /DOCTOR EXAMPLE COLD OPEN/);
  assert.match(mount.innerHTML, /1 SHORTS/);
  assert.doesNotMatch(mount.innerHTML, /13 SHORTS/);
  assert.match(mount.innerHTML, /SOURCE-LOCKED CREATOR WORKFLOW/);
  assert.match(mount.innerHTML, /THIS SHOW, READY FOR REVIEW/);
  assert.match(mount.innerHTML, /1 UNREVIEWED/);
  assert.doesNotMatch(mount.innerHTML, /creator approved/i);
});

test("Aftermath routing, export, copy, and exact-source Clip Lab handoff remain separate callbacks", () => {
  const dossier = makeDossier();
  const harness = makeAftermathHarness(dossier);
  const decisions = [];
  const exports = [];
  const copies = [];
  const clipOpens = [];
  const { ui, mount } = setup(dossier, {
    aftermathEngine: harness.engine,
    onAftermathDecision(payload) { decisions.push(payload); },
    onAftermathExport(payload) { exports.push(payload); },
    onAftermathCopy(payload) { copies.push(payload); },
    onOpenClipLab(payload) { clipOpens.push(payload); },
  });
  ui.render(dossier.source.id);

  assert.equal(
    mount.click("aftermath-decision", {
      "data-opportunity-id": "short:ui-fixture",
      "data-decision": "keep",
      "data-owner-section": "aftermath",
    }),
    true,
  );
  assert.equal(decisions.length, 1);
  assert.equal(decisions[0].sourceId, dossier.source.id);
  assert.equal(decisions[0].review.counts.keep, 1);
  assert.equal(decisions[0].review.creatorApproved, false);
  assert.match(mount.innerHTML, /LOCAL ROUTING COMPLETE/);
  assert.match(mount.innerHTML, /KEEP FOR CREATOR REVIEW/);

  mount.click("aftermath-export", { "data-owner-section": "aftermath" });
  mount.click("aftermath-copy", { "data-owner-section": "aftermath" });
  mount.click("open-clip-lab", {
    "data-owner-section": "aftermath",
    "data-clip-mode": "shorts",
  });
  assert.equal(exports.length, 1);
  assert.equal(exports[0].packet.schema, "shokker.aftermath-editor-packet/v1");
  assert.equal(copies.length, 1);
  assert.match(copies[0].markdown, /^# THE AFTERMATH PACK/);
  assert.equal(clipOpens.length, 1);
  assert.equal(clipOpens[0].sourceId, dossier.source.id);
  assert.equal(clipOpens[0].mode, "shorts");
});

test("zero-opportunity Aftermath pages stay source-specific and never invent a workflow callout", () => {
  const dossier = makeDossier({ metadataOnly: true, receiptCount: 0 });
  const harness = makeAftermathHarness(dossier);
  Object.assign(harness.pack.metrics, {
    opportunities: 0,
    shorts: 0,
    supercutMemberships: 0,
    resurfacingPairs: 0,
    clipReady: 0,
    fastReview: 0,
    archiveExpansion: 0,
    researchQueue: 0,
    quarantined: 0,
    referenceThreads: 0,
    coldOpenStoryboards: 0,
    sourceReceipts: 0,
    registeredArtifactMemberships: 0,
  });
  harness.pack.opportunities = [];
  harness.pack.research = [];
  harness.pack.storyboards = [];
  harness.pack.showDelta = null;
  harness.pack.eligibility.status = "NO RECEIPT-BACKED CREATOR OPPORTUNITIES YET";
  const { ui, mount } = setup(dossier, { aftermathEngine: harness.engine });
  ui.render(dossier.source.id, { section: "aftermath" });

  assert.match(mount.innerHTML, /NONE REGISTERED FOR THIS SOURCE/);
  assert.match(mount.innerHTML, /NO RECEIPT-BACKED HANDOFF YET/);
  assert.match(mount.innerHTML, /DOWNLOAD ELIGIBILITY RECEIPT/);
  assert.doesNotMatch(mount.innerHTML, /13 SHORTS/);
  assert.equal(mount.innerHTML.includes("SOURCE-LOCKED CREATOR WORKFLOW"), false);
  assert.doesNotMatch(mount.innerHTML, /OPEN THIS SOURCE IN CLIP LAB/);
  assert.doesNotMatch(mount.innerHTML, /CREATOR HANDOFF READY/);
});

test("a drifted saved Aftermath review stays visible as a held notice while a clean ledger opens", () => {
  const dossier = makeDossier();
  const harness = makeAftermathHarness(dossier);
  const { ui, mount } = setup(dossier, {
    aftermathEngine: harness.engine,
    loadAftermathReview() {
      return {
        aftermathRestoreHeld: true,
        notice: "The saved route no longer matches this source proof.",
        review: null,
      };
    },
  });
  ui.render(dossier.source.id, { section: "aftermath" });

  assert.match(mount.innerHTML, /AFTERMATH ACTION HELD/);
  assert.match(mount.innerHTML, /saved route no longer matches this source proof/i);
  assert.match(mount.innerHTML, /DOCTOR EXAMPLE ENTERS THE ROOM/);
  assert.match(mount.innerHTML, /1 UNREVIEWED/);
  assert.equal(harness.engine.createReviewCalls.at(-1).sourceId, dossier.source.id);
  assert.equal(harness.engine.createReviewCalls.at(-1).decisions.length, 0);
});

test("Aftermath Pack binding drift fails closed without taking down the Show Wiki", () => {
  const dossier = makeDossier();
  const harness = makeAftermathHarness(dossier);
  harness.pack.bindings.dossierFingerprint = "wrong-dossier";
  const { ui, mount } = setup(dossier, { aftermathEngine: harness.engine });
  const rendered = ui.render(dossier.source.id);

  assert.equal(rendered, dossier);
  assert.match(mount.innerHTML, /THE CREATOR HANDOFF IS HELD/);
  assert.match(mount.innerHTML, /failed its exact-source binding check/i);
  assert.doesNotMatch(mount.innerHTML, /DOCTOR EXAMPLE ENTERS THE ROOM/);
  assert.match(mount.innerHTML, /THE TAPE THAT REFUSED TO DIE/);
});

test("compact Show Wiki keeps Ask one click away and reveals its exact-show tools on demand", () => {
  const { ui, mount } = setup(makeDossier());
  ui.render("SOURCE00001");

  const exploreMatch = mount.innerHTML.match(
    /<nav class="source-dossier-explore"[\s\S]*?<\/nav>/,
  );
  assert.ok(exploreMatch);
  assert.ok(exploreMatch[0].includes('href="#sourceDossierAsk">ASK THIS SHOW</a>'));
  assert.match(
    uiSource,
    /fullFileDestination && !state\.fullFile[\s\S]*state\.fullFile = true;[\s\S]*renderCurrent\(\);/,
  );
  assert.match(
    uiSource,
    /function queueJumpAfterReflow[\s\S]*scheduleFrame\(function \(\) \{[\s\S]*scheduleFrame\(function \(\) \{/,
  );
  const askTarget = mount.registerJumpTarget("sourceDossierAsk", { hiddenResearch: true });
  assert.equal(mount.clickLink("#sourceDossierAsk"), true);
  assert.match(mount.innerHTML, /data-source-dossier-view="full"/);
  assert.equal(askTarget.scrollCalls.length, 1);
});
test("compact Show Wiki shortcuts expand and scroll the newly rendered target after reflow", () => {
  const frames = [];
  const modal = {
    scrollTop: 240,
    scrollCalls: [],
    getBoundingClientRect() {
      return { top: 100, bottom: 760, height: 660 };
    },
    scrollTo(options) {
      this.scrollCalls.push(options);
      this.scrollTop = options.top;
    },
  };
  const { ui, mount } = setup(makeDossier(), {
    document: {
      getElementById(id) {
        return id === "tapeModal" ? modal : null;
      },
    },
    requestAnimationFrame(callback) {
      frames.push(callback);
    },
  });
  ui.render("SOURCE00001");
  modal.scrollTop = 240;
  const target = mount.registerJumpTarget(
    "sourceDossierShowWikiLane-best-moments-1",
    { requiresFullFile: true, rectTop: 980 },
  );

  assert.equal(
    mount.clickLink("#sourceDossierShowWikiLane-best-moments-1"),
    true,
  );
  assert.match(mount.innerHTML, /data-source-dossier-view="full"/);
  assert.equal(modal.scrollCalls.length, 0, "the stale compact layout is never scrolled");
  assert.equal(frames.length, 1);

  frames.shift()();
  assert.equal(modal.scrollCalls.length, 0, "one paint is reserved for expansion reflow");
  assert.equal(frames.length, 1);
  frames.shift()();

  assert.equal(modal.scrollCalls.length, 1);
  assert.equal(modal.scrollCalls[0].top, 1032);
  assert.equal(modal.scrollCalls[0].left, 0);
  assert.equal(modal.scrollCalls[0].behavior, "smooth");
  assert.equal(target.scrollCalls.length, 0, "modal-relative scrolling owns the viewport");
  assert.equal(target.heading.focusCount, 1);
});

test("metadata-only sources render a permanent refusal instead of invented content", () => {
  const { ui, mount } = setup(makeDossier({
    metadataOnly: true,
    receiptCount: 0,
  }));
  ui.render("SOURCE00001");

  assert.match(mount.innerHTML, /UPLOAD DETAILS ONLY/);
  assert.match(mount.innerHTML, /THE UPLOAD IS HERE. THE CONVERSATION IS NOT READY/);
  assert.match(mount.innerHTML, /No caption-backed moments/);
  assert.match(mount.innerHTML, /No caption-backed recap/);
  assert.match(mount.innerHTML, /No guessed speakers/);
  assert.doesNotMatch(mount.innerHTML, /SOURCE-BOUNDED SUMMARY \x2F\x2F/);
  assert.doesNotMatch(mount.innerHTML, /class="source-dossier-receipt"/);
  assert.match(mount.innerHTML, /No topic, quote, character, or event claim/);
});

test("rich sources become navigable per-show Wikis with recap, Topic Hop, and exact playable lanes", () => {
  const plays = [];
  const bags = [];
  const { ui, mount, dossier } = setup(makeDossier(), {
    onPlay: (payload) => plays.push(payload),
    onBagReceipt: (payload) => bags.push(payload),
  });
  ui.render("SOURCE00001", { fullFile: true });
  const html = mount.innerHTML;

  assert.ok(html.includes("WWAM AFTER MIDNIGHT // SHOW WIKI // FULL SHOW WIKI"));
  assert.match(html, /aria-label="Explore this show"/);
  assert.ok(html.includes('href="#sourceDossierPlayerSection">WATCH THE SHOW</a>'));
  assert.ok(html.includes('href="#sourceDossierShowWikiSummary">SHOW SUMMARY</a>'));
  assert.ok(html.includes('href="#sourceDossierShowWikiExperience">THE MIDNIGHT CUT</a>'));
  assert.match(html, /COPY PAGE LINK/);
  assert.match(html, /THE SHOW IN PLAIN ENGLISH/);
  assert.match(html, /<h4>LIVE AFTERSHOW<\/h4>/);
  assert.match(html, /A chaotic franchise aftershow/);
  assert.equal((html.match(/<span>CHAPTER /g) ?? []).length, 3);
  assert.match(html, /THE OPENING ARGUMENT/);
  assert.match(html, /THE ROOM BREAKS/);
  assert.match(html, /THE LAST WORD/);
  assert.ok(html.includes("TOPIC HOP // PLAYABLE SHOW ROUTE"));
  assert.match(html, /THE MIDNIGHT CUT/);
  assert.match(html, /data-show-wiki-route-count="5"/);
  assert.equal(
    (html.match(/class="source-dossier-wiki-pulse-node"/g) ?? []).length,
    3,
  );
  assert.equal(
    (html.match(/class="source-dossier-wiki-route-stop"/g) ?? []).length,
    5,
  );
  assert.match(html, /SAVE ALL 5 MOMENTS/);
  assert.match(html, /Built only from saved timestamps on this exact upload/);
  assert.match(html, /THE WHOLE NIGHT, CUT TO THE PARTS WORTH REVISITING/);
  assert.match(html, /A recap, watch path, and timestamped moments from this exact upload/);
  assert.match(html, /TOPICS DISCUSSED/);
  assert.match(html, /BEST MOMENTS/);
  assert.match(html, /WWAM UP IN YA/);
  assert.match(html, /STRAIGHT TO STEVE&#39;S ASSHOLE/);
  assert.match(html, /CHARACTER BITS/);
  assert.match(html, /data-show-wiki-lane="best-moments" data-show-wiki-receipt-count="2"/);
  assert.match(html, /FEATURED HERE/);
  assert.doesNotMatch(html, /MOMENT HEAT|data-signal-score|SHOWCASE-RECEIPT-SCORE/);
  assert.doesNotMatch(html, /CAPTION DENSITY \+ ROOM REACTION/);
  assert.doesNotMatch(html, /MACHINE-SURFACED|OPERATOR/);
  assert.match(html, /Every jump opens this exact upload at a saved time/);
  assert.equal(
    (html.match(/class="source-dossier-receipt source-dossier-wiki-receipt"/g) ?? []).length,
    7,
  );
  assert.equal((html.match(/class="source-dossier-wiki-crosslinks"/g) ?? []).length, 1);
  assert.ok(html.includes("ALSO FEATURED ABOVE"));
  assert.ok(
    html.indexOf('id="sourceDossierPlayerSection"') <
      html.indexOf('id="sourceDossierShowWiki"'),
    "the official player appears before the distilled show map",
  );
  assert.ok(
    html.indexOf('id="sourceDossierShowWiki"') <
      html.indexOf('id="sourceDossierAsk"'),
    "the per-show Wiki remains ahead of supporting archive tools",
  );
  assert.ok(
    html.indexOf('class="source-dossier-wiki-recap"') <
      html.indexOf('id="sourceDossierShowWikiExperience"') &&
      html.indexOf('id="sourceDossierShowWikiExperience"') <
        html.indexOf('class="source-dossier-wiki-lanes"'),
    "recap, playable route, then detailed lanes preserve the intended hierarchy",
  );

  mount.click("play-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-2",
    "data-owner-section": "wiki",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "receipt");
  assert.equal(plays[0].section, "wiki");
  assert.equal(plays[0].receipt, dossier.source.receipts[2]);
  assert.equal(plays[0].at, dossier.source.receipts[2].at);

  mount.click("play-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-4",
    "data-owner-section": "wiki",
  });
  assert.equal(plays[1].receipt, dossier.source.receipts[4]);
  assert.equal(plays[1].at, dossier.source.receipts[4].at);

  mount.click("bag-experience", { "data-owner-section": "wiki" });
  assert.deepEqual(
    bags.map((payload) => payload.receipt.key),
    [
      "SOURCE00001:receipt-2",
      "SOURCE00001:receipt-4",
      "SOURCE00001:receipt-5",
      "SOURCE00001:receipt-0",
      "SOURCE00001:receipt-6",
    ],
  );
  assert.ok(bags.every((payload) => payload.section === "wiki"));
});

test("Episode Guide V2 exposes the episode spine and plays bounded source-local cuts", () => {
  const dossier = makeDossier();
  const phases = ["OPENING READ", "PRESSURE POINT", "FINAL WORD"];
  dossier.source.showWiki.episodeGuide = {
    schema: "wwam-episode-guide/v2",
    basis: "Full automatic-caption episode map",
    overview: "A source-local episode overview.",
    metrics: {
      chapters: 5,
      threads: 4,
      cuts: 8,
      comedy: 3,
    },
    chapters: Array.from({ length: 5 }, (_, index) => ({
      id: `chapter-${index + 1}`,
      at: 60 + index * 900,
      end: 90 + index * 900,
      label: `Chapter ${index + 1}`,
      body: `The commentary's ${index + 1} mapped turn.`,
      excerpt: `Bounded chapter excerpt ${index + 1}.`,
    })),
    takeArc: phases.map((phase, index) => ({
      id: `take-${index + 1}`,
      phase,
      at: 180 + index * 2400,
      end: 210 + index * 2400,
      label: `${phase} RECEIPT`,
      body: `The ${phase.toLowerCase()} is anchored to this upload.`,
      excerpt: `Bounded take excerpt ${index + 1}.`,
    })),
    threads: Array.from({ length: 4 }, (_, index) => ({
      id: `thread-${index + 1}`,
      kind: index === 0 ? "character" : "film craft",
      name: index === 0 ? "Doctor Example" : `Recurring Thread ${index + 1}`,
      mentions: 7 - index,
      peak: 300 + index * 600,
      at: 300 + index * 600,
      end: 330 + index * 600,
    })),
    cuts: Array.from({ length: 8 }, (_, index) => ({
      id: `guide-cut-${index + 1}`,
      at: 480 + index * 420,
      end: 510 + index * 420,
      category: index % 2 === 0 ? "COMEDY" : "FILM READ",
      topic: `Playable Cut ${index + 1}`,
      excerpt: `Bounded playable cut excerpt ${index + 1}.`,
      score: 100 - index,
    })),
    fanRead: {
      whyThisNightMatters: {
        label: "WHY THIS NIGHT MATTERS",
        body: "The night keeps returning to the movie's craft before ending on its hardest verdict.",
        primaryThread: "Doctor Example",
        secondaryThread: "Recurring Thread 2",
        strongestCutId: "guide-cut-1",
      },
      loved: {
        key: "loved",
        label: "WHAT THE TAPE DEFENDED",
        body: "The cleanest praise spike in the episode.",
        cutId: "guide-cut-2",
        category: "LOVE LETTER",
        topic: "The craft they defended",
        excerpt: "A bounded loved excerpt.",
      },
      hated: {
        key: "hated",
        label: "STRAIGHT TO STEVE'S ASSHOLE",
        body: "The tape's sharpest negative turn.",
        cutId: "guide-cut-3",
        category: "FRANCHISE FELONY",
        topic: "The choice they rejected",
        excerpt: "A bounded hated excerpt.",
      },
      wildestDetour: {
        key: "wildestDetour",
        label: "THE WILDEST DETOUR",
        body: "The funniest left turn away from the main thread.",
        cutId: "guide-cut-4",
        category: "UP IN YA",
        topic: "The unexpected detour",
        excerpt: "A bounded detour excerpt.",
      },
      lastWord: {
        key: "lastWord",
        label: "THE LAST WORD",
        body: "The late-show line that best closes the file.",
        cutId: "guide-cut-5",
        category: "FINAL VERDICT",
        topic: "The closing read",
        excerpt: "A bounded closing excerpt.",
      },
    },
  };
  const plays = [];
  const { ui, mount } = setup(dossier, {
    onPlay: (payload) => plays.push(payload),
  });

  ui.render("SOURCE00001");

  assert.match(mount.innerHTML, /data-episode-guide="v2"/);
  assert.match(
    mount.innerHTML,
    /class="source-dossier-deep-dive-cta" href="#sourceDossierEpisodeGuide">OPEN THE DEEP DIVE/,
  );
  assert.ok(
    mount.innerHTML.indexOf('href="#sourceDossierEpisodeGuide">DEEP DIVE</a>') <
      mount.innerHTML.indexOf('href="#sourceDossierShowWikiSummary">SHOW SUMMARY</a>'),
    "the episode spine is promoted ahead of the summary in the show shortcut strip",
  );
  assert.match(mount.innerHTML, /data-episode-guide-view="start-here"/);
  assert.match(mount.innerHTML, /href="#sourceDossierFanRead">FAN READ<\/a>/);
  assert.doesNotMatch(mount.innerHTML, /id="sourceDossierFanRead"/);
  assert.match(mount.innerHTML, /21 REGISTERED MOMENTS \/\/ 8 DEEP-DIVE CUTS/);
  assert.doesNotMatch(mount.innerHTML, /21 PLAYABLE MOMENTS/);
  assert.match(mount.innerHTML, /THE FASTEST WAY INTO THIS EPISODE/);
  assert.equal((mount.innerHTML.match(/MOVE \d\d \/\//g) ?? []).length, 4);
  assert.match(mount.innerHTML, /OPEN THE FULL DEEP DIVE/);
  assert.doesNotMatch(mount.innerHTML, /WHAT KEEPS COMING BACK/);
  assert.doesNotMatch(mount.innerHTML, /THE NIGHT, ACT BY ACT/);
  assert.doesNotMatch(mount.innerHTML, /THE TAKE ARC/);
  assert.match(mount.innerHTML, /data-source-dossier-action="play-guide-cut"/);

  const guideTarget = mount.registerJumpTarget("sourceDossierEpisodeGuide");
  assert.equal(mount.clickLink("#sourceDossierEpisodeGuide"), true);
  assert.equal(guideTarget.scrollCalls.length, 1);
  assert.equal(guideTarget.scrollCalls[0].behavior, "smooth");
  assert.equal(guideTarget.scrollCalls[0].block, "start");
  assert.equal(guideTarget.heading.focusCount, 1);
  assert.equal(guideTarget.heading.getAttribute("tabindex"), "-1");

  mount.click("play-guide-cut", {
    "data-guide-at": "480",
    "data-guide-end": "510",
    "data-owner-section": "wiki",
  });

  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "episode-guide");
  assert.equal(plays[0].at, 480);
  assert.equal(plays[0].end, 510);
  assert.equal(plays[0].receipt, null);
  assert.equal(plays[0].sourceId, "SOURCE00001");

  const fanTarget = mount.registerJumpTarget("sourceDossierFanRead", {
    requiresFullFile: true,
  });
  assert.equal(mount.clickLink("#sourceDossierFanRead"), true);
  assert.match(mount.innerHTML, /data-source-dossier-view="full"/);
  assert.equal(fanTarget.scrollCalls.length, 1);
  assert.equal(fanTarget.scrollCalls[0].behavior, "smooth");
  assert.equal(fanTarget.heading.focusCount, 1);
  assert.match(mount.innerHTML, /THE EPISODE ACTUALLY HAS A SHAPE/);
  assert.match(mount.innerHTML, /WHAT KEEPS COMING BACK/);
  assert.match(mount.innerHTML, /THE NIGHT, ACT BY ACT/);
  assert.match(mount.innerHTML, /5 STOPS ACROSS THE FULL RUNTIME/);
  assert.doesNotMatch(mount.innerHTML, /SIX STOPS ACROSS THE FULL RUNTIME/);
  assert.match(mount.innerHTML, /THE TAKE ARC/);
  assert.match(mount.innerHTML, /8 OF 8 SHOWN/);
  assert.match(mount.innerHTML, /id="sourceDossierFanRead"/);
  assert.match(mount.innerHTML, /WHY THIS NIGHT MATTERS/);
  assert.match(mount.innerHTML, /data-fan-read-key="loved"/);
  assert.match(mount.innerHTML, /STRAIGHT TO STEVE(?:'|&#39;)S ASSHOLE/);
  assert.match(mount.innerHTML, /data-fan-read-key="wildestDetour"/);
  assert.match(mount.innerHTML, /data-fan-read-key="lastWord"/);
  assert.ok(
    mount.innerHTML.indexOf('id="sourceDossierFanRead"') <
      mount.innerHTML.indexOf('id="sourceDossierEpisodeGuide"'),
    "the readable editorial entry precedes the research-heavy guide",
  );

  mount.click("play-guide-cut", {
    "data-guide-at": "900",
    "data-guide-end": "930",
    "data-owner-section": "wiki",
  });
  assert.equal(plays.length, 2);
  assert.equal(plays[1].mode, "episode-guide");
  assert.equal(plays[1].at, 900);
  assert.equal(plays[1].end, 930);
});
test("caption excerpts drop only leading YouTube speaker markers across cards and playback", () => {
  const dossier = makeDossier();
  dossier.source.receipts[2].excerpt = ">>   >> A bounded caption line.";
  const { ui, mount } = setup(dossier);
  ui.render("SOURCE00001", { fullFile: true });

  assert.match(mount.innerHTML, /&ldquo;A bounded caption line\.&rdquo;/);
  assert.doesNotMatch(mount.innerHTML, /&gt;&gt;|>>/);

  mount.click("play-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-2",
    "data-owner-section": "wiki",
  });
  assert.match(mount.innerHTML, /&ldquo;A bounded caption line\.&rdquo;/);
  assert.doesNotMatch(mount.innerHTML, /&gt;&gt;|>>/);
});

test("deep-linked player view resets the modal and focuses its short heading without scroll drift", () => {
  for (const [section, sectionId, headingId] of [
    ["player", "sourceDossierPlayerSection", "sourceDossierPlayerTitle"],
  ]) {
    const makeNode = () => ({
      attributes: new Map(),
      scrollCalls: [],
      focusCalls: [],
      hasAttribute(name) {
        return this.attributes.has(name);
      },
      setAttribute(name, value) {
        this.attributes.set(name, String(value));
      },
      getAttribute(name) {
        return this.attributes.get(name) ?? null;
      },
      scrollIntoView(options) {
        this.scrollCalls.push(options);
      },
      focus(options) {
        this.focusCalls.push(options);
      },
    });
    const modal = { scrollTop: 6707, scrollLeft: 19 };
    const sectionNode = makeNode();
    const headingNode = makeNode();
    const nodes = new Map([
      ["tapeModal", modal],
      [sectionId, sectionNode],
      [headingId, headingNode],
    ]);
    const document = {
      getElementById(id) {
        return nodes.get(id) ?? null;
      },
    };
    const { ui } = setup(makeDossier(), { document });

    ui.render("SOURCE00001", { section });

    assert.equal(modal.scrollTop, 0);
    assert.equal(modal.scrollLeft, 0);
    assert.equal(sectionNode.scrollCalls.length, 1);
    assert.equal(sectionNode.focusCalls.length, 0);
    assert.equal(headingNode.getAttribute("tabindex"), "-1");
    assert.equal(headingNode.scrollCalls.length, 0);
    assert.equal(sectionNode.scrollCalls[0].behavior, "auto");
    assert.equal(sectionNode.scrollCalls[0].block, "start");
    assert.equal(headingNode.focusCalls.length, 1);
    assert.equal(headingNode.focusCalls[0].preventScroll, true);
  }
});

test("deep-linked Show Wiki waits for hydration and lands below the mobile close control", () => {
  const frames = [];
  const headingNode = {
    attributes: new Map(),
    focusCalls: [],
    hasAttribute(name) {
      return this.attributes.has(name);
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    },
    focus(options) {
      this.focusCalls.push(options);
    },
  };
  const sectionNode = {
    rectTop: 1026,
    scrollCalls: [],
    getBoundingClientRect() {
      return { top: this.rectTop, bottom: this.rectTop + 5710, height: 5710 };
    },
    querySelector() {
      return headingNode;
    },
    scrollIntoView(options) {
      this.scrollCalls.push(options);
    },
  };
  const modal = {
    scrollTop: 6707,
    scrollLeft: 19,
    scrollCalls: [],
    getBoundingClientRect() {
      return { top: 0, bottom: 844, height: 844 };
    },
    scrollTo(options) {
      this.scrollCalls.push(options);
      this.scrollTop = options.top;
    },
  };
  const document = {
    getElementById(id) {
      if (id === "tapeModal") return modal;
      if (id === "sourceDossierShowWiki") return sectionNode;
      if (id === "sourceDossierShowWikiTitle") return headingNode;
      return null;
    },
  };
  const { ui } = setup(makeDossier(), {
    document,
    requestAnimationFrame(callback) {
      frames.push(callback);
    },
  });

  ui.render("SOURCE00001", { section: "wiki" });

  assert.equal(modal.scrollTop, 0);
  assert.equal(modal.scrollLeft, 0);
  assert.equal(modal.scrollCalls.length, 0);
  assert.equal(sectionNode.scrollCalls.length, 0);
  assert.equal(headingNode.focusCalls.length, 0);
  assert.equal(frames.length, 1);

  frames.shift()();
  assert.equal(modal.scrollCalls.length, 0);
  assert.equal(frames.length, 1);

  // Simulate the editorial/companion layer adding 170px above the Wiki
  // between the initial render and the post-hydration alignment.
  sectionNode.rectTop = 1196;
  frames.shift()();

  assert.equal(modal.scrollCalls.length, 1);
  assert.equal(modal.scrollCalls[0].top, 1124);
  assert.equal(modal.scrollCalls[0].left, 0);
  assert.equal(modal.scrollCalls[0].behavior, "auto");
  assert.equal(sectionNode.scrollCalls.length, 0);
  assert.equal(headingNode.getAttribute("tabindex"), "-1");
  assert.equal(headingNode.focusCalls.length, 1);
  assert.equal(headingNode.focusCalls[0].preventScroll, true);
});

test("metadata-only Show Wikis expose a canonical Source Brief without fake moments", () => {
  const dossier = makeDossier({ metadataOnly: true, receiptCount: 0 });
  const staged = [];
  const { ui, mount } = setup(dossier, {
    onStageIntake: (payload) => staged.push(payload),
  });
  ui.render("SOURCE00001");
  const html = mount.innerHTML;

  assert.match(html, /SHOW PAGE STARTED \/\/ DEEP DIVE NOT READY/);
  assert.match(html, /data-source-show-wiki-status="source-brief"/);
  assert.match(html, /data-show-wiki-brief="source-metadata-brief"/);
  assert.match(html, /THE TAPE THAT REFUSED TO DIE/);
  assert.match(html, /MOVIE COMMENTARY/);
  assert.match(html, /UPLOAD DATE<\/small><b>07\.23\.2026/);
  assert.match(html, /RUNTIME<\/small><b>2H 03M/);
  assert.match(html, /VIEWS WHEN INDEXED<\/small><b>987,654/);
  assert.match(html, /CAPTION COVERAGE<\/small><b>UPLOAD DETAILS ONLY/);
  assert.match(html, /WHY THIS PAGE IS LIMITED \/\/ VERIFIED UPLOAD DETAILS ONLY/);
  assert.match(html, /NO FAKE RECAP/);
  assert.match(html, /QUEUE THE DEEP DIVE/);
  assert.match(html, /WATCH ON YOUTUBE/);
  mount.click("stage-intake", { "data-owner-section": "wiki" });
  assert.equal(staged.length, 1);
  assert.equal(staged[0].sourceId, dossier.source.id);
  assert.equal(staged[0].dossier, dossier);
  assert.doesNotMatch(html, /EPISODE RECAP/);
  assert.doesNotMatch(html, /source-dossier-wiki-experience/);
  assert.doesNotMatch(html, /source-dossier-wiki-empty-lanes/);
  assert.doesNotMatch(html, /6 SIGNATURE LANES CHECKED/);
  assert.doesNotMatch(html, /class="source-dossier-wiki-lane has-receipts"/);
  assert.doesNotMatch(html, /source-dossier-wiki-receipt/);
  assert.doesNotMatch(html, /data-signal-score=/);
  assert.doesNotMatch(html, /class="source-dossier-receipt(?: |")/);
  assert.ok(html.includes(dossier.source.url));
});
test("Show Wiki adapter copy is escaped while internal scoring and selection notes stay private", () => {
  const dossier = makeDossier();
  dossier.source.showWiki = {
    label: '<img src=x onerror="wikiBoom">',
    status: 'deep"><script>alert("status")</script>',
    description: '<script>alert("description")</script>',
    recap: {
      format: '<b onmouseover="formatBoom">',
      formatBasis: '<img src=x onerror="formatBasisBoom">',
      overview: '<script>alert("overview")</script>',
      blocks: [
        {
          label: '<svg onload="recapLabelBoom">',
          body: '<img src=x onerror="recapBodyBoom">',
          basis: '<i onclick="recapBasisBoom">',
          receiptKeys: ["SOURCE00001:receipt-0"],
        },
      ],
    },
    experience: {
      id: 'cut"><script>alert("id")</script>',
      label: '<svg onload="experienceLabelBoom">',
      title: '<img src=x onerror="experienceTitleBoom">',
      description: '<script>alert("experienceDescription")</script>',
      emptyState: '<img src=x onerror="experienceEmptyBoom">',
      selectionBasis: '<b onmouseover="selectionBoom">',
      routeReceiptKeys: ["SOURCE00001:receipt-0"],
      pulseReceiptKeys: ["SOURCE00001:receipt-0"],
    },
    lanes: [
      {
        id: 'unsafe"><svg onload="laneBoom">',
        label: '<svg onload="labelBoom">',
        description: '<script>alert("lane")</script>',
        emptyState: '<img src=x onerror="emptyBoom">',
        receiptKeys: [],
      },
      {
        id: "heat",
        label: "SAFE HEAT LANE",
        description: "A registered receipt.",
        emptyState: "Not used.",
        receiptKeys: ["SOURCE00001:receipt-0"],
      },
    ],
  };
  dossier.source.receipts[0].signalScore = 88;
  dossier.source.receipts[0].signalBasis = '<img src=x onerror="heatBoom">';
  const { ui, mount } = setup(dossier);
  ui.render("SOURCE00001", { fullFile: true });
  const html = mount.innerHTML;

  assert.match(html, /&lt;img src=x onerror=&quot;wikiBoom&quot;&gt;/);
  assert.doesNotMatch(html, /description&quot;/);
  assert.match(html, /&lt;svg onload=&quot;labelBoom&quot;&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;emptyBoom&quot;&gt;/);
  assert.doesNotMatch(html, /HEATBOOM/i);
  assert.match(html, /&lt;b onmouseover=&quot;formatBoom&quot;&gt;/);
  assert.doesNotMatch(html, /FORMATBASISBOOM/i);
  assert.ok(html.includes("&lt;script&gt;alert(&quot;overview&quot;)&lt;/script&gt;"));
  assert.match(html, /&lt;svg onload=&quot;recapLabelBoom&quot;&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;recapBodyBoom&quot;&gt;/);
  assert.match(html, /&lt;svg onload=&quot;experienceLabelBoom&quot;&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;experienceTitleBoom&quot;&gt;/);
  assert.doesNotMatch(html, /experienceDescription|SELECTIONBOOM/i);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<svg onload="labelBoom">/);
  assert.doesNotMatch(html, /onerror="(?:wiki|empty|heat)Boom"/);
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
  assert.match(mount.innerHTML, /THE PLAYER LOADS WHEN YOU PRESS PLAY/);
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
  const { ui, mount, engine, queryEngine } = setup(makeDossier(), {
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
  mount.click("copy-link", { "data-owner-section": "inside" });
  mount.click("download");
  mount.click("ask-source");
  mount.click("open-companion");
  mount.click("open-source", {
    "data-source-id": "SOURCE00002",
    "data-source-at": "913",
  });
  mount.click("open-source", { "data-source-id": "SOURCE00000" });

  assert.equal(calls.play[0].mode, "receipt");
  assert.equal(calls.play[0].at, makeReceipt(2).at);
  assert.equal(calls.play[0].receipt.key, "SOURCE00001:receipt-2");
  assert.equal(calls.bag[0].receipt.key, "SOURCE00001:receipt-3");
  assert.equal(calls.copy[0].at, makeReceipt(2).at);
  assert.equal(calls.copy[0].section, "inside");
  assert.equal(calls.download[0].filename, "source-dossier-SOURCE00001.json");
  assert.equal(
    calls.download[0].manifest.schema,
    "shokker-source-dossier-export/v1",
  );
  assert.deepEqual(engine.exportCalls, ["SOURCE00001"]);
  assert.equal(calls.ask.length, 0);
  assert.equal(queryEngine.answerCalls.length, 1);
  assert.equal(queryEngine.answerCalls[0].schema, "shokker-source-query/v1");
  assert.equal(queryEngine.answerCalls[0].sourceId, "SOURCE00001");
  assert.equal(
    queryEngine.answerCalls[0].sourceFingerprint,
    "fnv1a32:11111111",
  );
  assert.equal(
    queryEngine.answerCalls[0].query,
    "What is actually indexed in this tape?",
  );
  assert.equal(queryEngine.answerCalls[0].at, makeReceipt(2).at);
  assert.equal(queryEngine.answerCalls[0].limit, 3);
  assert.equal(mount.focusCount, 1);
  assert.equal(calls.companion[0].at, makeReceipt(2).at);
  assert.equal(calls.open[0].targetSourceId, "SOURCE00002");
  assert.equal(calls.open[0].targetAt, 913);
  assert.equal(calls.open[0].connection.basis, "receipt-backed-entity");
  assert.equal(calls.open[0].chronology, "next");
  assert.equal(calls.open[1].chronology, "previous");
});

test("ASK THIS TAPE sends the permanent source lock and caps receipt answers at three", () => {
  const dossier = makeDossier();
  const plays = [];
  const bags = [];
  const queryEngine = {
    answerCalls: [],
    answer(request) {
      this.answerCalls.push(request);
      return makeQueryAnswer(dossier, {
        status: "supported",
        query: request.query,
        message: "Five matches exist; the compact answer returns the first three.",
        results: dossier.source.receipts.slice(0, 5).map((receipt) => ({
          type: "receipt",
          sourceId: dossier.source.id,
          key: receipt.key,
          matchedBy: "source-inventory",
        })),
      });
    },
  };
  const { ui, mount } = setup(dossier, {
    queryEngine,
    onPlay: (payload) => plays.push(payload),
    onBagReceipt: (payload) => bags.push(payload),
  });
  ui.render("SOURCE00001", { at: 512, section: "ask" });

  assert.equal(mount.submit("Show the registered moments in this tape."), true);
  assert.equal(queryEngine.answerCalls.length, 1);
  assert.equal(queryEngine.answerCalls[0].sourceId, dossier.source.id);
  assert.equal(
    queryEngine.answerCalls[0].sourceFingerprint,
    dossier.source.sourceFingerprint,
  );
  assert.equal(queryEngine.answerCalls[0].at, 512);
  assert.equal(queryEngine.answerCalls[0].limit, 3);
  assert.match(mount.innerHTML, /data-source-query-status="supported"/);
  assert.match(mount.innerHTML, /data-source-query-result-count="3"/);
  assert.equal(
    (
      mount.innerHTML.match(
        /class="source-dossier-receipt source-dossier-query-receipt"/g,
      ) ?? []
    ).length,
    3,
  );
  assert.doesNotMatch(
    mount.innerHTML,
    /source-dossier-query-receipt" data-receipt-key="SOURCE00001:receipt-3"/,
  );

  mount.click("play-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-1",
    "data-owner-section": "ask",
  });
  mount.click("bag-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-2",
    "data-owner-section": "ask",
  });
  assert.equal(plays[0].receipt, dossier.source.receipts[1]);
  assert.equal(bags[0].receipt, dossier.source.receipts[2]);
});

test("episode-aware answers validate registered recap, experience, and lane receipt sets and deep-link into the Show Wiki", () => {
  const dossier = makeDossier();
  const answers = {
    "Summarize this show.": {
      intent: "episode-recap",
      episode: {
        kind: "recap",
        id: "episode-recap",
        label: "EPISODE RECAP",
        matchedAlias: "summarize this show",
        totalReceipts: 5,
        matchedReceipts: 5,
        shownReceipts: 3,
      },
      keys: [
        "SOURCE00001:receipt-0",
        "SOURCE00001:receipt-2",
        "SOURCE00001:receipt-6",
      ],
    },
    "Give me the five-stop watch path.": {
      intent: "episode-experience",
      episode: {
        kind: "experience",
        id: "midnight-cut",
        label: "THE MIDNIGHT CUT",
        matchedAlias: "five-stop watch path",
        totalReceipts: 5,
        matchedReceipts: 5,
        shownReceipts: 3,
      },
      keys: [
        "SOURCE00001:receipt-2",
        "SOURCE00001:receipt-4",
        "SOURCE00001:receipt-5",
      ],
    },
    "What were the best moments?": {
      intent: "episode-lane",
      episode: {
        kind: "lane",
        id: "best-moments",
        label: "BEST MOMENTS",
        matchedAlias: "best moments",
        totalReceipts: 2,
        matchedReceipts: 2,
        shownReceipts: 2,
      },
      keys: ["SOURCE00001:receipt-2", "SOURCE00001:receipt-3"],
    },
  };
  const queryEngine = {
    answer(request) {
      const answer = answers[request.query];
      assert.ok(answer, "the fixture recognizes the episode question");
      return makeQueryAnswer(dossier, {
        status: "supported",
        query: request.query,
        intent: answer.intent,
        episode: answer.episode,
        results: answer.keys.map((key) => ({
          type: "receipt",
          sourceId: dossier.source.id,
          key,
          matchedBy: answer.intent,
        })),
      });
    },
  };
  const { ui, mount } = setup(dossier, { queryEngine });
  ui.render("SOURCE00001");

  mount.submit("Summarize this show.");
  assert.match(
    mount.innerHTML,
    /data-source-query-episode-kind="recap"/,
  );
  assert.match(mount.innerHTML, /5 REGISTERED \/\/ 5 MATCHED \/\/ 3 SHOWN/);
  assert.ok(
    mount.innerHTML.includes(
      'href="#sourceDossierShowWikiSummary">OPEN THE FULL RECAP',
    ),
  );

  mount.submit("Give me the five-stop watch path.");
  assert.match(
    mount.innerHTML,
    /data-source-query-episode-kind="experience"/,
  );
  assert.match(mount.innerHTML, /5 REGISTERED \/\/ 5 MATCHED \/\/ 3 SHOWN/);
  assert.ok(
    mount.innerHTML.includes(
      'href="#sourceDossierShowWikiExperience">OPEN THE FULL WATCH PATH',
    ),
  );

  mount.submit("What were the best moments?");
  assert.match(
    mount.innerHTML,
    /data-source-query-episode-kind="lane"/,
  );
  assert.match(mount.innerHTML, /2 REGISTERED \/\/ 2 MATCHED \/\/ 2 SHOWN/);
  assert.ok(
    mount.innerHTML.includes(
      'href="#sourceDossierShowWikiLane-best-moments-1">OPEN FULL BEST MOMENTS',
    ),
  );
});

test("exact-show Ask renders validated deep-dive cuts separately and plays their bounded source window", () => {
  const dossier = makeDossier();
  const panavision = {
    id: "guide-cut-panavision",
    at: 857,
    end: 893,
    label: "a camera-craft breakdown",
    category: "BREAKDOWN",
    topic: "Direction and camera",
    excerpt: "Dude, the Panavision here is amazing.",
    score: 99,
  };
  const overlapReceipt = dossier.source.receipts[2];
  const overlap = {
    id: "guide-cut-overlap",
    at: overlapReceipt.at,
    end: overlapReceipt.end,
    label: "a canonical timestamp that also survived the guide",
    category: "LOVE LETTER",
    topic: "Registered overlap",
    excerpt: "The registered beat survives the deep dive.",
    score: 100,
  };
  dossier.source.showWiki.episodeGuide = {
    schema: "wwam-episode-guide/v2",
    basis: "Full-caption exact-source episode map",
    overview: "Two bounded cuts for UI validation.",
    chapters: [],
    takeArc: [],
    threads: [],
    cuts: [overlap, panavision],
    metrics: { chapters: 0, threads: 0, cuts: 2, comedy: 0 },
  };
  const plays = [];
  const queryEngine = {
    answer(request) {
      return makeQueryAnswer(dossier, {
        status: "supported",
        query: request.query,
        intent: "episode-guide",
        episode: {
          kind: "guide",
          id: "episode-guide",
          label: "DEEP-DIVE CUTS",
          matchedAlias: "deep dive cuts",
          totalCuts: 2,
          matchedCuts: 2,
          shownCuts: 2,
        },
        results: [
          {
            type: "receipt",
            sourceId: dossier.source.id,
            key: overlapReceipt.key,
            guideCutId: overlap.id,
            matchedBy: "canonical-receipt-at-episode-guide-timestamp",
          },
          {
            type: "guide-cut",
            sourceId: dossier.source.id,
            id: panavision.id,
            at: panavision.at,
            end: panavision.end,
            label: panavision.label,
            category: panavision.category,
            topic: panavision.topic,
            excerpt: panavision.excerpt,
            matchedBy: "episode-guide-cut-text",
          },
        ],
      });
    },
  };
  const { ui, mount } = setup(dossier, {
    queryEngine,
    onPlay: (payload) => plays.push(payload),
  });
  ui.render(dossier.source.id);
  mount.submit("Show me the deep dive cuts");

  assert.match(mount.innerHTML, /data-source-query-episode-kind="guide"/);
  assert.match(mount.innerHTML, /2 CUTS \/\/ 2 MATCHED \/\/ 2 SHOWN/);
  assert.match(mount.innerHTML, /href="#sourceDossierEpisodeGuide">OPEN THE FULL DEEP DIVE/);
  assert.equal(
    (mount.innerHTML.match(/data-source-query-result-type="guide-cut"/g) ?? []).length,
    2,
  );
  assert.match(mount.innerHTML, /DEEP-DIVE CUT \/\/ REGISTERED MOMENT MATCH/);
  assert.match(mount.innerHTML, /DEEP-DIVE CUT/);
  assert.match(mount.innerHTML, /Panavision/);
  assert.match(mount.innerHTML, /data-guide-cut-basis="episode-guide"/);
  assert.doesNotMatch(mount.innerHTML, /data-receipt-key="guide-cut-panavision"/);

  mount.click("play-guide-cut", {
    "data-guide-at": "857",
    "data-guide-end": "893",
    "data-owner-section": "ask",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "episode-guide");
  assert.equal(plays[0].sourceId, dossier.source.id);
  assert.equal(plays[0].at, 857);
  assert.equal(plays[0].end, 893);
  assert.equal(plays[0].receipt, null);
});

test("episode-aware answers fail closed when lane identity or registered counts are tampered", () => {
  const cases = [
    {
      label: "lane id",
      patch: { id: "not-a-registered-lane" },
    },
    {
      label: "registered count",
      patch: { totalReceipts: 3 },
    },
    {
      label: "shown count",
      patch: { shownReceipts: 1 },
    },
    {
      label: "lane receipt membership",
      patch: {},
      keys: ["SOURCE00001:receipt-2", "SOURCE00001:receipt-4"],
    },
  ];

  for (const entry of cases) {
    const dossier = makeDossier();
    const query = "Tampered episode context: " + entry.label;
    const queryEngine = {
      answer(request) {
        return makeQueryAnswer(dossier, {
          status: "supported",
          query: request.query,
          intent: "episode-lane",
          episode: {
            kind: "lane",
            id: "best-moments",
            label: "BEST MOMENTS",
            matchedAlias: "best moments",
            totalReceipts: 2,
            matchedReceipts: 2,
            shownReceipts: 2,
            ...entry.patch,
          },
          results: (entry.keys ?? [
            "SOURCE00001:receipt-2",
            "SOURCE00001:receipt-3",
          ]).map((key) => ({
            type: "receipt",
            sourceId: dossier.source.id,
            key,
          })),
        });
      },
    };
    const { ui, mount } = setup(dossier, { queryEngine });
    ui.render("SOURCE00001");
    mount.submit(query);

    assert.equal(
      mount.getAttribute("data-source-query-state"),
      "held",
      entry.label,
    );
    assert.match(mount.innerHTML, /THIS RESULT DID NOT PASS THE SOURCE CHECK/, entry.label);
    assert.match(
      mount.innerHTML,
      /did not preserve its registered Show Wiki lane/,
      entry.label,
    );
    assert.doesNotMatch(
      mount.innerHTML,
      /source-dossier-query-episode-guide/,
      entry.label,
    );
    assert.doesNotMatch(
      mount.innerHTML,
      /source-dossier-query-receipt/,
      entry.label,
    );
  }
});

test("registered Source Brief answers re-read canonical facts and ignore forged query values", () => {
  const dossier = makeDossier({ metadataOnly: true, receiptCount: 0 });
  const queryEngine = {
    answer(request) {
      return makeQueryAnswer(dossier, {
        status: "proof",
        intent: "proof",
        query: request.query,
        results: [
          {
            type: "metadata",
            sourceId: dossier.source.id,
            field: "registered-source-brief",
            value: {
              kind: "forged-kind",
              scope: "forged-scope",
              format: "FORGED CONTENT SUMMARY",
              formatBasis: "forged-basis",
            },
            basis: "forged-query-basis",
          },
        ],
      });
    },
  };
  const { ui, mount } = setup(dossier, { queryEngine });
  ui.render("SOURCE00001");
  mount.submit("Show me the registered source brief.");

  assert.match(mount.innerHTML, /REGISTERED-SOURCE-BRIEF/);
  assert.match(mount.innerHTML, /SHOW DETAILS \/\/ DEEP DIVE NOT READY/);
  assert.match(mount.innerHTML, /MOVIE COMMENTARY/);
  assert.match(mount.innerHTML, /07\.23\.2026/);
  assert.match(mount.innerHTML, /2H 03M/);
  assert.match(mount.innerHTML, /987,654/);
  assert.match(mount.innerHTML, /FOUND FROM \/\/ REGISTERED-SOURCE-TYPE-AND-TITLE/);
  assert.doesNotMatch(mount.innerHTML, /FORGED CONTENT SUMMARY/);
  assert.doesNotMatch(mount.innerHTML, /forged-query-basis/i);
  assert.doesNotMatch(mount.innerHTML, /forged-scope/i);
});
test("Source Brief inventory exposes the safe page beside zero content receipts", () => {
  const dossier = makeDossier({ metadataOnly: true, receiptCount: 0 });
  const queryEngine = {
    answer(request) {
      return makeQueryAnswer(dossier, {
        status: "inventory",
        intent: "inventory",
        query: request.query,
      });
    },
  };
  const { ui, mount } = setup(dossier, { queryEngine });
  ui.render("SOURCE00001");
  mount.submit("What is actually indexed in this tape?");

  assert.equal(mount.getAttribute("data-source-query-state"), "inventory");
  assert.match(mount.innerHTML, /<b>AVAILABLE<\/b>SHOW DETAILS/);
  assert.match(mount.innerHTML, /<b>0<\/b>TIMESTAMPS/);
  assert.doesNotMatch(mount.innerHTML, /EPISODE RECAP/);
});
test("registered-summary answers render as an Episode Recap card", () => {
  const dossier = makeDossier();
  const queryEngine = {
    answer(request) {
      return makeQueryAnswer(dossier, {
        status: "supported",
        query: request.query,
        results: [
          {
            type: "metadata",
            sourceId: dossier.source.id,
            field: "registered-summary",
            value: dossier.source.summary,
            basis: dossier.source.summary.basis,
          },
        ],
      });
    },
  };
  const { ui, mount } = setup(dossier, { queryEngine });
  ui.render("SOURCE00001");
  mount.submit("Summarize this exact tape.");

  assert.match(
    mount.innerHTML,
    /data-source-query-result-type="metadata"><span>REGISTERED-SUMMARY<\/span><h5>EPISODE RECAP<\/h5>/,
  );
  assert.doesNotMatch(
    mount.innerHTML,
    /REGISTERED-SUMMARY<\/span><h5>REGISTERED SOURCE FACTS<\/h5>/,
  );
});

test("distilled shows expose episode prompts while Source Briefs expose canonical fact prompts", () => {
  const distilled = setup(makeDossier());
  distilled.ui.render("SOURCE00001");
  const episodePrompts = [
    "Summarize this show.",
    "What did they talk about?",
    "What were the funniest moments?",
    "What did they hate?",
    "Show me WWAM Up In Ya.",
    "Give me the five-stop watch path.",
  ];
  assert.equal(
    (
      distilled.mount.innerHTML.match(
        /data-source-dossier-action="query-prompt"/g,
      ) ?? []
    ).length,
    6,
  );
  for (const prompt of episodePrompts) {
    assert.ok(distilled.mount.innerHTML.includes('data-query="' + prompt + '"'));
  }
  assert.doesNotMatch(
    distilled.mount.innerHTML,
    /data-query="What is actually indexed in this tape\?"/,
  );

  const sourceBrief = setup(makeDossier({ metadataOnly: true, receiptCount: 0 }));
  sourceBrief.ui.render("SOURCE00001");
  const briefPrompts = [
    "Show me the registered source brief.",
    "When was this uploaded?",
    "How long is this tape?",
    "How many views?",
    "What is actually indexed in this tape?",
  ];
  assert.equal(
    (
      sourceBrief.mount.innerHTML.match(
        /data-source-dossier-action="query-prompt"/g,
      ) ?? []
    ).length,
    5,
  );
  for (const prompt of briefPrompts) {
    assert.ok(sourceBrief.mount.innerHTML.includes('data-query="' + prompt + '"'));
  }
  assert.doesNotMatch(
    sourceBrief.mount.innerHTML,
    /data-query="Summarize this show\."/,
  );
});

test("receipt answers render and play the canonical registered receipt", () => {
  const dossier = makeDossier();
  const plays = [];
  const queryEngine = {
    answer(request) {
      return makeQueryAnswer(dossier, {
        status: "supported",
        query: request.query,
        results: [
          {
            type: "receipt",
            sourceId: dossier.source.id,
            key: "SOURCE00001:receipt-2",
            label: "FORGED QUERY LABEL",
            excerpt: "Forged query excerpt.",
            receipt: {
              ...dossier.source.receipts[2],
              label: "FORGED NESTED LABEL",
              excerpt: "Forged nested excerpt.",
            },
          },
        ],
      });
    },
  };
  const { ui, mount } = setup(dossier, {
    queryEngine,
    onPlay: (payload) => plays.push(payload),
  });
  ui.render("SOURCE00001");
  mount.submit("Show one canonical receipt.");

  assert.match(mount.innerHTML, /INDEXED MOMENT 3/);
  assert.match(mount.innerHTML, /Bounded source excerpt 3\./);
  assert.doesNotMatch(mount.innerHTML, /FORGED QUERY LABEL/);
  assert.doesNotMatch(mount.innerHTML, /FORGED NESTED LABEL/);
  assert.doesNotMatch(mount.innerHTML, /Forged (?:query|nested) excerpt/);

  mount.click("play-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-2",
    "data-owner-section": "ask",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].receipt, dossier.source.receipts[2]);
});

test("ASK THIS TAPE renders metadata refusals and rejects cross-source substitutions", () => {
  const metadataDossier = makeDossier({ metadataOnly: true, receiptCount: 0 });
  const metadataQuery = {
    answer(request) {
      return makeQueryAnswer(metadataDossier, {
        status: "metadata-only",
        query: request.query,
        message: "This source has metadata, but no registered content receipt.",
        results: [],
      });
    },
  };
  const metadata = setup(metadataDossier, { queryEngine: metadataQuery });
  metadata.ui.render("SOURCE00001");
  metadata.mount.submit("Summarize the jokes in this tape.");

  assert.match(metadata.mount.innerHTML, /data-source-query-status="metadata-only"/);
  assert.match(metadata.mount.innerHTML, /THIS SHOW NEEDS CAPTIONS/);
  assert.match(metadata.mount.innerHTML, /NO MATCH IN THIS SHOW/);
  assert.match(metadata.mount.innerHTML, /OTHER SHOWS NOT INCLUDED/);
  assert.doesNotMatch(metadata.mount.innerHTML, /source-dossier-query-receipt/);

  const dossier = makeDossier();
  const hostileQuery = {
    answer(request) {
      return makeQueryAnswer(dossier, {
        status: "supported",
        query: request.query,
        results: [
          {
            type: "receipt",
            sourceId: "ANOTHER0001",
            key: "SOURCE00001:receipt-0",
          },
        ],
      });
    },
  };
  const hostile = setup(dossier, { queryEngine: hostileQuery });
  hostile.ui.render("SOURCE00001");
  hostile.mount.submit("Show the registered moments in this tape.");

  assert.equal(hostile.mount.getAttribute("data-source-query-state"), "held");
  assert.match(hostile.mount.innerHTML, /THIS RESULT DID NOT PASS THE SOURCE CHECK/);
  assert.match(hostile.mount.innerHTML, /attempted to cross the source lock/);
  assert.doesNotMatch(hostile.mount.innerHTML, /source-dossier-query-receipt/);
});

test("typed non-receipt answers render safely without becoming source claims", () => {
  const dossier = makeDossier();
  const queryEngine = {
    answer(request) {
      return makeQueryAnswer(dossier, {
        status: "supported",
        query: request.query,
        results: [
          {
            type: "metadata",
            sourceId: dossier.source.id,
            field: "source-proof",
            value: {
              date: dossier.source.date,
              duration: dossier.source.duration,
              views: dossier.source.views,
              coverage: dossier.source.coverage,
            },
            basis: "canonical-source-dossier",
          },
          {
            type: "entity",
            sourceId: dossier.source.id,
            id: "entity:unsafe",
            label: "<img src=x onerror=boom>",
            entityType: "character",
            basis: "timestamped-receipt",
            receiptKeys: ["SOURCE00001:receipt-0"],
          },
          {
            type: "artifact",
            sourceId: dossier.source.id,
            id: "artifact:demo",
            label: "REVIEWABLE SUPERCUT",
            kind: "supercut-draft",
            authority: "creator-draft",
            reviewState: "human-review-required",
            risk: "medium",
            receiptKeys: ["SOURCE00001:receipt-0"],
          },
        ],
      });
    },
  };
  const { ui, mount } = setup(dossier, { queryEngine });
  ui.render("SOURCE00001");
  mount.submit("What registered material exists here?");

  assert.match(mount.innerHTML, /data-source-query-result-type="metadata"/);
  assert.match(mount.innerHTML, /data-source-query-result-type="entity"/);
  assert.match(mount.innerHTML, /data-source-query-result-type="artifact"/);
  assert.match(mount.innerHTML, /&lt;img src=x onerror=boom&gt;/);
  assert.doesNotMatch(mount.innerHTML, /<img src=x onerror=boom>/);
  assert.ok(mount.innerHTML.includes("WWAM AFTER MIDNIGHT // SHOW WIKI"));
  assert.match(mount.innerHTML, /HUMAN-REVIEW-REQUIRED/);
});

test("progressive disclosure and deep render options preserve the full source file", () => {
  const { ui, mount, queryEngine } = setup();
  ui.render("SOURCE00001");
  const receiptCount = () =>
    (mount.innerHTML.match(/class="source-dossier-receipt"/g) ?? []).length;

  assert.equal(receiptCount(), 0);
  assert.match(mount.innerHTML, /data-source-dossier-density="compact"/);
  mount.click("toggle-section", { "data-section": "inside" });
  assert.equal(receiptCount(), 21);
  assert.match(mount.innerHTML, /RETURN TO COMPACT TIMESTAMPS/);
  mount.click("toggle-section", { "data-section": "inside" });
  assert.equal(receiptCount(), 0);

  mount.click("open-full-file");
  assert.equal(receiptCount(), 21);
  assert.match(mount.innerHTML, /data-source-dossier-density="full"/);
  assert.match(mount.innerHTML, /BACK TO SHOW HIGHLIGHTS/);
  mount.click("close-full-file");
  assert.equal(receiptCount(), 0);

  ui.render("SOURCE00001", {
    section: "inside",
    query: "What is actually indexed in this tape?",
  });
  assert.equal(receiptCount(), 21);
  assert.equal(queryEngine.answerCalls.length, 1);
  assert.equal(
    Object.prototype.hasOwnProperty.call(queryEngine.answerCalls[0], "at"),
    false,
  );
  assert.match(mount.innerHTML, /data-source-query-status="inventory"/);
});

test("every dossier lane exposes its stable deep-link ID and data marker", () => {
  const { ui, mount } = setup();
  ui.render("SOURCE00001");
  const sections = {
    proof: "sourceDossierProof",
    player: "sourceDossierPlayerSection",
    wiki: "sourceDossierShowWiki",
    inside: "sourceDossierInside",
    ask: "sourceDossierAsk",
    footprint: "sourceDossierFootprint",
    wake: "sourceDossierWake",
    chronology: "sourceDossierChronology",
    work: "sourceDossierWork",
    boundary: "sourceDossierBoundary",
  };
  for (const [section, id] of Object.entries(sections)) {
    const idPosition = mount.innerHTML.indexOf(`id="${id}"`);
    const markerPosition = mount.innerHTML.indexOf(
      `data-source-dossier-section="${section}"`,
      idPosition,
    );
    assert.ok(idPosition >= 0, `${section} has its stable ID`);
    assert.ok(markerPosition > idPosition, `${section} has its data marker`);
  }
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
  ui.render("SOURCE00001", { fullFile: true });

  assert.match(
    mount.innerHTML,
    /<article class="source-dossier[^"]*" data-source-dossier-view="full" aria-labelledby="sourceDossierTitle" aria-describedby="sourceDossierBoundary">/,
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
    /aria-label="Save INDEXED MOMENT 1 to saved clips"/,
  );
  assert.match(
    mount.innerHTML,
    /<nav class="source-dossier-chronology" id="sourceDossierChronology" data-source-dossier-section="chronology" aria-label="Source chronology">/,
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
  assert.match(mount.innerHTML, /THIS SHOW WIKI COULD NOT OPEN/);
  assert.match(mount.innerHTML, /No metadata, content, relationship, or authority claim/);
  assert.doesNotMatch(mount.innerHTML, /source-dossier-hero/);
});

test("destroy invalidates an in-flight source query and removes both delegates", async () => {
  const dossier = makeDossier();
  let resolveAnswer;
  const queryEngine = {
    answer() {
      return new Promise((resolve) => {
        resolveAnswer = resolve;
      });
    },
  };
  const { ui, mount } = setup(dossier, { queryEngine });
  ui.render("SOURCE00001");
  mount.submit("Show the registered moments in this tape.");
  assert.match(mount.innerHTML, /CHECKING THE TIMESTAMPS/);

  ui.destroy();
  resolveAnswer(makeQueryAnswer(dossier));
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(mount.innerHTML, "");
  assert.equal(mount.listeners.has("click"), false);
  assert.equal(mount.listeners.has("submit"), false);
  assert.equal(mount.getAttribute("data-source-query-state"), null);
});

test("receipt playback persists an exact Now Playing receipt with return, copy, and traversal controls", () => {
  const plays = [];
  const copies = [];
  const dossier = makeDossier();
  const { ui, mount } = setup(dossier, {
    onPlay: (payload) => plays.push(payload),
    onCopyLink: (payload) => copies.push(payload),
  });
  ui.render("SOURCE00001");

  assert.doesNotMatch(mount.innerHTML, /source-dossier-now-playing/);
  mount.click("play-receipt", {
    "data-receipt-key": "SOURCE00001:receipt-4",
    "data-owner-section": "wiki",
  });

  const receipt = dossier.source.receipts[4];
  const html = mount.innerHTML;
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "receipt");
  assert.equal(plays[0].receipt, receipt);
  assert.match(html, /class="source-dossier-now-playing"/);
  assert.match(html, /data-now-playing-receipt="SOURCE00001:receipt-4"/);
  assert.match(html, /<b>INDEXED MOMENT 5<\/b>/);
  assert.match(html, /<time>05:44—06:06<\/time>/);
  assert.match(html, /&ldquo;Bounded source excerpt 5\.&rdquo;/);
  assert.match(html, /THE MIDNIGHT CUT/);
  assert.match(html, /FROM THIS SHOW \/\/ SOURCE00001/);
  assert.match(
    html,
    /data-receipt-key="SOURCE00001:receipt-2"[^>]*>[^<]*PREVIOUS<\/button>/,
  );
  assert.match(
    html,
    /data-receipt-key="SOURCE00001:receipt-5"[^>]*>NEXT[^<]*<\/button>/,
  );
  assert.ok(
    html.includes(
      'href="#sourceDossierShowWikiLane-up-in-ya-2">RETURN TO WWAM UP IN YA',
    ),
  );
  assert.match(html, /data-source-dossier-action="copy-link">COPY THIS MOMENT<\/button>/);

  mount.click("copy-link", { "data-owner-section": "player" });
  assert.equal(copies.length, 1);
  assert.equal(copies[0].sourceId, "SOURCE00001");
  assert.equal(copies[0].at, receipt.at);

  mount.click("play-source", { "data-owner-section": "player" });
  assert.equal(plays.length, 2);
  assert.equal(plays[1].mode, "source");
  assert.equal(plays[1].at, receipt.at);
  assert.equal(plays[1].end, null);
  assert.equal(plays[1].receipt, null);
  assert.doesNotMatch(mount.innerHTML, /source-dossier-now-playing/);
});

test("opening an exact receipt coordinate activates its canonical Now Playing receipt", () => {
  const plays = [];
  const dossier = makeDossier();
  const receipt = dossier.source.receipts[4];
  const { ui, mount } = setup(dossier, {
    onPlay: (payload) => plays.push(payload),
  });
  ui.render("SOURCE00001", { at: receipt.at });

  assert.equal(plays.length, 0);
  assert.match(mount.innerHTML, /class="source-dossier-now-playing"/);
  assert.match(
    mount.innerHTML,
    /data-now-playing-receipt="SOURCE00001:receipt-4"/,
  );
  assert.match(mount.innerHTML, /<b>INDEXED MOMENT 5<\/b>/);
  assert.match(mount.innerHTML, /<time>05:44—06:06<\/time>/);
});

test("local Show Wiki navigation includes only populated lanes and keeps Source Brief navigation compact", () => {
  const dossier = makeDossier();
  dossier.source.showWiki.lanes.push({
    id: "empty-prototype",
    label: "EMPTY PROTOTYPE",
    description: "This lane intentionally has no registered receipts.",
    emptyState: "No receipt is registered.",
    receiptKeys: [],
  });
  const { ui, mount } = setup(dossier);
  ui.render("SOURCE00001");

  const localNavMatch = mount.innerHTML.match(
    /<nav class="source-dossier-wiki-local-nav"[\s\S]*?<\/nav>/,
  );
  assert.ok(localNavMatch);
  const localNav = localNavMatch[0];
  assert.equal((localNav.match(/<a /g) ?? []).length, 9);
  assert.ok(localNav.includes('href="#sourceDossierAftermath">AFTERMATH PACK</a>'));
  assert.ok(localNav.includes('href="#sourceDossierShowWikiSummary">RECAP</a>'));
  assert.ok(
    localNav.includes(
      'href="#sourceDossierShowWikiExperience">THE MIDNIGHT CUT</a>',
    ),
  );
  assert.ok(localNav.includes('href="#sourceDossierShowWikiLane-topics-0"'));
  assert.ok(localNav.includes('href="#sourceDossierShowWikiLane-best-moments-1"'));
  assert.ok(localNav.includes('href="#sourceDossierShowWikiLane-up-in-ya-2"'));
  assert.ok(
    localNav.includes(
      'href="#sourceDossierShowWikiLane-straight-to-steves-asshole-3"',
    ),
  );
  assert.ok(localNav.includes('href="#sourceDossierShowWikiLane-character-bits-4"'));
  assert.ok(localNav.includes('href="#sourceDossierAsk">ASK THIS SHOW</a>'));
  assert.doesNotMatch(localNav, /EMPTY PROTOTYPE/);
  assert.doesNotMatch(localNav, /sourceDossierShowWikiLane-empty-prototype-5/);

  const sourceBrief = makeDossier({ metadataOnly: true, receiptCount: 0 });
  const briefSetup = setup(sourceBrief);
  briefSetup.ui.render("SOURCE00001");
  const briefNavMatch = briefSetup.mount.innerHTML.match(
    /<nav class="source-dossier-wiki-local-nav"[\s\S]*?<\/nav>/,
  );
  assert.ok(briefNavMatch);
  const briefNav = briefNavMatch[0];
  assert.equal((briefNav.match(/<a /g) ?? []).length, 3);
  assert.ok(briefNav.includes('href="#sourceDossierShowWikiSummary">SOURCE BRIEF</a>'));
  assert.ok(briefNav.includes('href="#sourceDossierAftermath">AFTERMATH PACK</a>'));
  assert.ok(briefNav.includes('href="#sourceDossierAsk">ASK SOURCE FACTS</a>'));
  assert.doesNotMatch(briefNav, /sourceDossierShowWikiExperience/);
  assert.doesNotMatch(briefNav, /sourceDossierShowWikiLane-/);
  assert.match(briefSetup.mount.innerHTML, /NO FAKE RECAP/);
  assert.doesNotMatch(briefSetup.mount.innerHTML, /6 SIGNATURE LANES CHECKED/);
  assert.doesNotMatch(briefSetup.mount.innerHTML, /source-dossier-wiki-empty-lanes/);
});

test("the pulse map separates close timestamps into deterministic rows and expands its track", () => {
  const { ui, mount } = setup(makeDossier());
  ui.render("SOURCE00001", { fullFile: true });
  const html = mount.innerHTML;

  assert.match(
    html,
    /class="source-dossier-wiki-pulse-track" style="--pulse-extra-height:96px"/,
  );
  const pulseNodes = Array.from(
    html.matchAll(
      /class="source-dossier-wiki-pulse-node" style="([^"]+)"[^>]*data-receipt-key="([^"]+)"/g,
    ),
  );
  assert.equal(pulseNodes.length, 3);
  assert.deepEqual(
    pulseNodes.map((match) => [match[2], match[1].match(/--pulse-row:(\d+)/)?.[1]]),
    [
      ["SOURCE00001:receipt-0", "0"],
      ["SOURCE00001:receipt-2", "1"],
      ["SOURCE00001:receipt-4", "2"],
    ],
  );
  assert.ok(pulseNodes.every((match) => /--pulse-at:[\d.]+%;/.test(match[1])));
  assert.ok(pulseNodes.every((match) => /--pulse-heat:\d+px/.test(match[1])));
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
  assert.match(cssSource, /overflow-x:\s*clip/);
  assert.match(cssSource, /\.source-dossier > \.source-dossier-explore/);
  assert.match(cssSource, /\.source-dossier-wiki-receipts\s*\{/);
  assert.match(cssSource, /\.source-dossier-wiki-empty\s*\{/);
  assert.match(cssSource, /\.source-dossier-receipt-signal\s*\{/);
  assert.match(cssSource, /\.source-dossier-wiki-recap-blocks\s*\{/);
  assert.match(cssSource, /\.source-dossier-wiki-experience\s*\{/);
  assert.match(cssSource, /\.source-dossier-wiki-pulse-node\s*\{/);
  assert.match(cssSource, /\.source-dossier-wiki-route\s*\{/);
  assert.match(cssSource, /\.source-dossier-wiki-crosslinks\s*\{/);
  assert.match(cssSource, /\.source-dossier-wiki-empty-lanes\s*\{/);
  assert.match(cssSource, /\.source-dossier-aftermath\s*\{/);
  assert.match(cssSource, /\.source-aftermath-workbench\s*\{/);
  assert.match(cssSource, /\.source-aftermath-decision textarea\s*\{/);
  assert.match(
    cssSource,
    /\.source-dossier-wiki-pulse-node\s*\{[^}]*width:\s*44px[^}]*min-width:\s*44px/s,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*820px\)[\s\S]*\.source-dossier-wiki-receipts[\s\S]*grid-template-columns:\s*1fr/,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier-explore > div[\s\S]*grid-template-columns:\s*repeat\(2/,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*820px\)[\s\S]*\.source-dossier-wiki-route[\s\S]*grid-template-columns:\s*repeat\(2/,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier-wiki-recap[\s\S]*\.source-dossier-wiki-route[\s\S]*grid-template-columns:\s*1fr/,
  );
  assert.match(
    cssSource,
    /\.source-dossier-deep-research\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier-density\s*\{[^}]*position:\s*static\s*!important[^}]*max-height:\s*76px/s,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier > \.source-dossier-explore\s*\{[^}]*position:\s*static\s*!important[^}]*max-height:\s*none[^}]*overflow:\s*visible/s,
  );
  assert.doesNotMatch(cssSource, /@import/i);
});
test("390px full Show Wiki controls retain thumb-safe tap targets without overflow", () => {
  const contract = cssSource.slice(cssSource.indexOf(
    "/* Mobile full-file tap contract",
  ));
  assert.ok(contract.length > 0);
  assert.match(contract, /@media \(max-width:\s*600px\)/);
  assert.match(
    contract,
    /\.source-dossier button,\s*\n\s*\.source-dossier summary\s*\{[^}]*display:\s*inline-flex[^}]*align-items:\s*center[^}]*max-width:\s*100%[^}]*min-height:\s*44px[^}]*white-space:\s*normal[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    contract,
    /\.source-dossier summary\s*\{[^}]*width:\s*100%[^}]*justify-content:\s*flex-start/s,
  );
  assert.match(
    contract,
    /details:not\(\.context-trailer\):not\(\.context-card-media\) > summary::after\s*\{[^}]*content:\s*"\+"[^}]*margin-left:\s*auto/s,
  );
  assert.ok(
    cssSource.indexOf("/* Mobile full-file tap contract") >
      cssSource.indexOf(".source-dossier-fan-read button"),
    "the mobile contract must win the cascade after the 42px Fan Read rule",
  );
});
test("Show Wiki keeps the archive truth but removes machine-room language and duplicate sticky UI", () => {
  const { ui, mount } = setup(makeDossier());
  ui.render("SOURCE00001");
  const html = mount.innerHTML;
  const wikiStart = html.indexOf('class="source-dossier-show-wiki"');
  const askStart = html.indexOf('class="source-dossier-ask"');
  const proofStart = html.indexOf('class="source-dossier-proof"');
  const wiki = html.slice(wikiStart, askStart);
  const ask = html.slice(askStart, proofStart);

  assert.match(wiki, /THE WHOLE NIGHT, CUT TO THE PARTS WORTH REVISITING/);
  assert.match(wiki, /THE SHOW IN PLAIN ENGLISH/);
  assert.match(wiki, /REGISTERED MOMENTS/);
  assert.doesNotMatch(wiki, /HOW THESE TIMESTAMPS WORK/);
  assert.match(html, /data-source-dossier-view="compact"/);
  assert.match(html, /id="sourceDossierDeepResearch" hidden/);
  assert.match(html, />EXPLORE ALL<\/button>/);
  assert.equal(
    (wiki.match(/is-show-wiki-highlight/g) ?? []).length,
    0,
  );
  assert.doesNotMatch(wiki, /is-show-wiki-research/);
  assert.match(wiki, /source-dossier-wiki-experience/);
  assert.match(wiki, /3 STARTER MOMENTS\. NO HUNTING/);
  assert.match(wiki, /OPEN THE COMPLETE WATCH PATH/);
  assert.match(wiki, /source-dossier-wiki-recap-blocks/);
  assert.doesNotMatch(
    wiki,
    /MOMENT HEAT|SHOWCASE-RECEIPT-SCORE|data-signal-score|MACHINE|OPERATOR/i,
  );
  assert.doesNotMatch(
    wiki,
    /SOURCE-LOCAL CAPTION EVIDENCE|SOURCE-LOCKED RECEIPT|DISTILLATION STATUS|THE SHOW, DISTILLED TO PLAYABLE PROOF/,
  );
  assert.match(ask, /FIND IT WITHOUT SCRUBBING FOR HOURS/);
  assert.match(ask, /THIS SHOW\. NO OTHER UPLOADS/);
  assert.doesNotMatch(ask, /SOURCE-LOCKED INTERROGATION|EXHUME THIS TAPE/);

  mount.click("open-full-file");
  const fullHtml = mount.innerHTML;
  const fullWikiStart = fullHtml.indexOf('class="source-dossier-show-wiki"');
  const fullAskStart = fullHtml.indexOf('class="source-dossier-ask"');
  const fullWiki = fullHtml.slice(fullWikiStart, fullAskStart);
  assert.match(fullHtml, /data-source-dossier-view="full"/);
  assert.match(fullWiki, /HOW THESE TIMESTAMPS WORK/);
  assert.equal((fullWiki.match(/is-show-wiki-highlight/g) ?? []).length, 3);
  assert.match(fullWiki, /5 MOMENTS\. NO HUNTING/);

  assert.match(
    cssSource,
    /\.source-dossier-wiki-local-nav\s*\{[^}]*display:\s*none[^}]*position:\s*static/s,
  );
  assert.match(
    cssSource,
    /\.source-dossier-wiki-recap-blocks > article\s*\{[^}]*grid-template-areas:/s,
  );
  assert.match(
    cssSource,
    /\.source-dossier-wiki-receipt\s*\{[^}]*grid-template-areas:/s,
  );
  assert.match(cssSource, /\.source-dossier-wiki-pulse\s*\{[^}]*overflow:\s*hidden/s);
});
