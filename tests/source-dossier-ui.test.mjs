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
const episodeFactsSource = fs.readFileSync(
  path.join(root, "public", "demo", "episode-facts-pilot.js"),
  "utf8",
);
const episodeFactsBatch2Source = fs.readFileSync(
  path.join(root, "public", "demo", "episode-facts-batch2.js"),
  "utf8",
);
const episodeFactsBatch3Source = fs.readFileSync(
  path.join(root, "public", "demo", "episode-facts-batch3.js"),
  "utf8",
);
const episodeFormatExperienceSource = fs.readFileSync(
  path.join(root, "public", "demo", "episode-format-experience.js"),
  "utf8",
);
const episodeFormatFallbackExperienceSource = fs.readFileSync(
  path.join(root, "public", "demo", "episode-format-fallback-experience.js"),
  "utf8",
);
const episodeTopicRebuildBatch1Source = fs.readFileSync(
  path.join(root, "public", "demo", "episode-guide-v2-topic-rebuild-batch1.js"),
  "utf8",
);
const episodeTopicRebuildBatch2Source = fs.readFileSync(
  path.join(root, "public", "demo", "episode-guide-v2-topic-rebuild-batch2.js"),
  "utf8",
);
const episodeTopicRebuildBatch3Source = fs.readFileSync(
  path.join(root, "public", "demo", "episode-guide-v2-topic-rebuild-batch3.js"),
  "utf8",
);
const episodeTopicRebuildBatch4Source = fs.readFileSync(
  path.join(root, "public", "demo", "episode-guide-v2-topic-rebuild-batch4.js"),
  "utf8",
);
const episodeTopicRebuildBatch5Source = fs.readFileSync(
  path.join(root, "public", "demo", "episode-guide-v2-topic-rebuild-batch5.js"),
  "utf8",
);
const episodeTopicRebuildExperienceSource = fs.readFileSync(
  path.join(root, "public", "demo", "episode-topic-rebuild-experience.js"),
  "utf8",
);
const cssSource = fs.readFileSync(
  path.join(root, "public", "demo", "source-dossier.css"),
  "utf8",
);
const editorialCssSource = fs.readFileSync(
  path.join(root, "public", "demo", "wwam-editorial-v2.css"),
  "utf8",
);

function runtime({
  withEpisodeFormat = false,
  withEpisodeFallback = false,
  withTopicRebuild = false,
} = {}) {
  const window = {};
  const sandbox = { window, globalThis: window };
  window.window = window;
  vm.createContext(sandbox);
  if (withEpisodeFormat) {
    vm.runInContext(episodeFactsSource, sandbox, {
      filename: "episode-facts-pilot.js",
    });
    vm.runInContext(episodeFactsBatch2Source, sandbox, {
      filename: "episode-facts-batch2.js",
    });
    vm.runInContext(episodeFactsBatch3Source, sandbox, {
      filename: "episode-facts-batch3.js",
    });
    vm.runInContext(episodeFormatExperienceSource, sandbox, {
      filename: "episode-format-experience.js",
    });
  }
  if (withEpisodeFallback) {
    vm.runInContext(episodeFormatFallbackExperienceSource, sandbox, {
      filename: "episode-format-fallback-experience.js",
    });
  }
  if (withTopicRebuild) {
    vm.runInContext(episodeTopicRebuildBatch1Source, sandbox, {
      filename: "episode-guide-v2-topic-rebuild-batch1.js",
    });
    vm.runInContext(episodeTopicRebuildBatch2Source, sandbox, {
      filename: "episode-guide-v2-topic-rebuild-batch2.js",
    });
    vm.runInContext(episodeTopicRebuildBatch3Source, sandbox, {
      filename: "episode-guide-v2-topic-rebuild-batch3.js",
    });
    vm.runInContext(episodeTopicRebuildBatch4Source, sandbox, {
      filename: "episode-guide-v2-topic-rebuild-batch4.js",
    });
    vm.runInContext(episodeTopicRebuildBatch5Source, sandbox, {
      filename: "episode-guide-v2-topic-rebuild-batch5.js",
    });
    vm.runInContext(episodeTopicRebuildExperienceSource, sandbox, {
      filename: "episode-topic-rebuild-experience.js",
    });
  }
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
    this.stickyNav = null;
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
    {
      hiddenResearch = false,
      requiresFullFile = false,
      rectTop = 0,
      audioFocus = false,
    } = {},
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
    const audio = {
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
    };
    const target = {
      heading,
      audio,
      requiresFullFile,
      scrollCalls: [],
      getBoundingClientRect() {
        return { top: rectTop, bottom: rectTop + 240, height: 240 };
      },
      querySelector(selector) {
        if (selector === "audio[controls]") return audioFocus ? audio : null;
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

  registerStickyNav(height, top = 0) {
    this.stickyNav = {
      getBoundingClientRect() {
        return { top, bottom: top + height, height };
      },
    };
    return this.stickyNav;
  }

  closest(selector) {
    return selector === "#tapeModal" ? this.modal : null;
  }

  querySelector(selector) {
    if (
      selector === ".source-dossier-explore" ||
      selector === ".source-dossier-wiki-local-nav"
    ) return this.stickyNav;
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
  const {
    withEpisodeFormat = false,
    withEpisodeFallback = false,
    withTopicRebuild = false,
    ...uiOverrides
  } = overrides;
  const api = runtime({
    withEpisodeFormat,
    withEpisodeFallback,
    withTopicRebuild,
  });
  const ui = api.create({
    engine,
    queryEngine,
    document: {},
    mount,
    ...uiOverrides,
  });
  return {
    api,
    ui,
    mount,
    engine,
    queryEngine: uiOverrides.queryEngine ?? queryEngine,
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

  assert.match(api.VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(ui.version, api.VERSION);
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

  assert.match(mount.innerHTML, /NONE FOUND FOR THIS SOURCE/);
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
  mount.registerStickyNav(112, 100);
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
  assert.equal(
    modal.scrollCalls[0].top,
    984,
    "wrapped local navigation receives 24px of breathing room above the target",
  );
  assert.equal(modal.scrollCalls[0].left, 0);
  assert.equal(modal.scrollCalls[0].behavior, "auto");
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
  assert.ok(html.includes('href="#sourceDossierPlayerSection">WATCH</a>'));
  assert.ok(html.includes('href="#sourceDossierShowWikiSummary">SUMMARY</a>'));
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

test("ready episode recaps render the Feldman label, playable evidence, and Damage Report", () => {
  const dossier = makeDossier();
  dossier.source.receipts[0].kind = "topic-receipt";
  dossier.source.receipts[0].evidenceType = "caption-topic-receipt";
  dossier.source.receipts[0].label = "TOPIC: HALLOWEEN";
  dossier.source.receipts[1].kind = "topic-receipt";
  dossier.source.receipts[1].evidenceType = "caption-topic-receipt";
  dossier.source.receipts[1].label = "TOPIC: SCREAM";
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "receipt-recap",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "RECEIPT RECAP",
    headline: "THE TAPE PUTS ON THE PURPLE JACKET.",
    deck: "The source-linked cuts provide the damage.",
    overview: "A chronological episode story assembled from this exact upload.",
    topics: ["Halloween", "Scream"],
    sections: [
      {
        id: "cold-open",
        label: "COLD OPEN // THE FIRST TURN",
        body: "The opening argument is attached to the source receipt.",
        at: dossier.source.receipts[0].at,
        end: dossier.source.receipts[0].end,
        excerpt: dossier.source.receipts[0].excerpt,
        receiptKeys: [dossier.source.receipts[0].key],
      },
      ...[1, 2, 3].map((index) => ({
        id: `act-${index + 1}`,
        label: `ACT ${index + 1} // THE NEXT TURN`,
        body: `Chronological recap body ${index + 1}.`,
        at: dossier.source.receipts[index].at,
        end: dossier.source.receipts[index].end,
        excerpt: dossier.source.receipts[index].excerpt,
        receiptKeys: [dossier.source.receipts[index].key],
      })),
    ],
    story: [
      {
        id: "reel-01",
        label: "REEL ONE // THE NIGHT SHIFT CLOCKS IN",
        body: "The written opening accounts for the first half of the registered source receipts.",
        at: dossier.source.receipts[0].at,
        end: dossier.source.receipts[1].end,
        anchorReceiptKey: dossier.source.receipts[1].key,
        anchorAt: dossier.source.receipts[1].at,
        excerpt: dossier.source.receipts[1].excerpt,
        guideAnchor: {
          id: "guide-cut-story-01",
          at: 90,
          end: 120,
          topic: "Halloween",
          category: "LOVE LETTER",
        },
        receiptKeys: [
          dossier.source.receipts[0].key,
          dossier.source.receipts[1].key,
        ],
      },
      {
        id: "reel-02",
        label: "REEL TWO // THE ROOM FINDS THE GAS PEDAL",
        body: "The written middle follows the next registered turns without turning chronology into causality.",
        at: dossier.source.receipts[2].at,
        end: dossier.source.receipts[3].end,
        anchorReceiptKey: dossier.source.receipts[3].key,
        anchorAt: dossier.source.receipts[3].at,
        excerpt: dossier.source.receipts[3].excerpt,
        receiptKeys: [
          dossier.source.receipts[2].key,
          dossier.source.receipts[3].key,
        ],
      },
      {
        id: "reel-03",
        label: "REEL THREE // THE DAMAGE REPORT ARRIVES",
        body: "The show moves into its strongest saved reactions and signature detours.",
        at: dossier.source.receipts[4].at,
        end: dossier.source.receipts[5].end,
        anchorReceiptKey: dossier.source.receipts[5].key,
        anchorAt: dossier.source.receipts[5].at,
        excerpt: dossier.source.receipts[5].excerpt,
        receiptKeys: [
          dossier.source.receipts[4].key,
          dossier.source.receipts[5].key,
        ],
      },
      {
        id: "reel-04",
        label: "LAST REEL // CLOSING TIME NEEDS A LAWYER",
        body: "The written close accounts for the final registered source receipts.",
        at: dossier.source.receipts[6].at,
        end: dossier.source.receipts[20].end,
        anchorReceiptKey: dossier.source.receipts[20].key,
        anchorAt: dossier.source.receipts[20].at,
        excerpt: dossier.source.receipts[20].excerpt,
        receiptKeys: dossier.source.receipts.slice(6).map((receipt) => receipt.key),
      },
    ],
    highlightRunway: dossier.source.receipts.map((receipt, index) => ({
      receiptKey: receipt.key,
      ordinal: index + 1,
      kind: receipt.kind,
      category: [
        "WWAM UP IN YA / STINGER",
        "STRAIGHT TO STEVE'S ASSHOLE",
        "CHARACTER APPEARANCE",
        "SOUNDBYTE / REPLAY",
        "MAJOR TOPIC TURN",
      ][index % 5],
      at: receipt.at,
      end: receipt.end,
      label: `RUNWAY MOMENT ${index + 1}`,
      excerpt: receipt.excerpt,
      evidenceBasis: receipt.evidenceBasis,
    })),
    fanRead: {
      hated: {
        label: "STRAIGHT TO STEVE'S ASSHOLE",
        topic: "THE COMPLAINT DESK",
        body: "The negative turn stays attached to the exact show.",
        at: dossier.source.receipts[5].at,
        end: dossier.source.receipts[5].end,
        receiptKey: dossier.source.receipts[5].key,
        excerpt: dossier.source.receipts[5].excerpt,
      },
    },
    caseFile: {
      receiptCount: 21,
      topicCount: 7,
      momentCount: 10,
      characterCount: 4,
      storySegmentCount: 4,
      storyReceiptCount: 21,
      storyCoveragePercent: 100,
      tapeSpanPercent: 84,
    },
    approval: {
      actualApproval: false,
      disclosure: "A running-bit label, not a creator endorsement.",
    },
    semanticFingerprint: "feldman-ready-ui-fixture",
  };
  const plays = [];
  const { ui, mount } = setup(dossier, {
    onPlay: (payload) => plays.push(payload),
  });

  ui.render(dossier.source.id);
  const html = mount.innerHTML;

  assert.match(html, /data-feldman-recap="ready"/);
  assert.match(html, /data-feldman-recap-expanded="false"/);
  assert.match(html, /WWAM FELDMAN APPROVED RECAP/);
  assert.doesNotMatch(html, /source-dossier-feldman-identity/);
  assert.match(html, /THE 30-SECOND VERSION/);
  assert.match(
    html,
    /class="source-dossier-recap-cta" href="#sourceDossierFeldmanStory">READ THE EPISODE WIKI/,
  );
  assert.match(html, /EXACT-SHOW CASE FILE/);
  assert.match(html, /data-feldman-stat="receipts"><b>21<\/b><small>RECEIPTS/);
  assert.match(html, /data-feldman-stat="topics"><b>7<\/b><small>TOPIC DOORS/);
  assert.match(html, /data-feldman-stat="moments"><b>10<\/b><small>SAVED SPIKES/);
  assert.match(html, /data-feldman-stat="characters"><b>4<\/b><small>CHARACTER LEADS/);
  assert.match(html, /data-feldman-stat="coverage"><b>100%<\/b><small>INDEXED RECEIPTS ACCOUNTED FOR/);
  assert.match(html, /data-feldman-stat="span"><b>84%<\/b><small>EVIDENCE SPAN/);
  assert.match(html, /JUMP THE TOPIC BOARD/);
  assert.match(html, /2 EXACT DOORS/);
  assert.match(html, />Halloween<\/b><time>/);
  assert.match(html, />Scream<\/b><time>/);
  assert.match(
    html,
    /Play Halloween from this show at 01:00/,
  );
  assert.match(html, /THE FELDMAN CUT \/\/ PLAYABLE EPISODE RECAP/);
  assert.match(html, /THE NIGHT&#39;S SAVED STORY, WITHOUT HUNTING THE TIMELINE/);
  assert.doesNotMatch(html, /THE FELDMAN CUT \/\/ FULL EPISODE RECAP/);
  assert.match(html, /data-feldman-story-count="4"/);
  assert.match(html, /data-feldman-story-expanded="false"/);
  assert.equal(
    (html.match(/class="source-dossier-feldman-story-reel"/g) ?? []).length,
    2,
  );
  assert.match(html, /data-feldman-story="reel-01"/);
  assert.match(html, /data-feldman-story="reel-02"/);
  assert.doesNotMatch(html, /data-feldman-story="reel-03"/);
  assert.match(
    html,
    /id="sourceDossierFeldmanStoryRemainder" hidden><\/div>/,
  );
  assert.match(html, /KEEP READING \/\/ OPEN ALL 4 REELS/);
  assert.match(
    html,
    /data-source-dossier-action="play-guide-cut" data-guide-at="90" data-guide-end="120"[^>]+Play episode story reel 1 at 01:30/,
  );
  assert.match(html, />&#9654;<\/span> PLAY 01:30<\/button>/);
  assert.match(html, /PLAYABLE EPISODE INDEX/);
  assert.match(html, /4 ACTS \/\/ EVERY ACT OPENS THIS EXACT SHOW/);
  assert.match(html, /START WITH THE TAPE/);
  assert.match(html, /Play the first saved turn at 01:00/);
  assert.match(
    html,
    /<button type="button" class="source-dossier-feldman-start" data-source-dossier-action="play-receipt"/,
  );
  assert.match(html, /data-source-dossier-action="toggle-episode-recap"/);
  assert.match(
    html,
    /aria-controls="sourceDossierFeldmanOmittedActs"/,
  );
  assert.match(html, /id="sourceDossierFeldmanActList"/);
  assert.match(
    html,
    /id="sourceDossierFeldmanOmittedActs" hidden><\/div>/,
  );
  assert.ok(
    html.indexOf('id="sourceDossierFeldmanActList"') <
      html.indexOf('id="sourceDossierFeldmanOmittedActs"'),
    "the three preview acts stay outside the disclosure-controlled remainder",
  );
  assert.match(html, /aria-expanded="false">SHOW ALL 4 ACTS/);
  assert.doesNotMatch(html, /data-feldman-act="act-4"/);
  assert.match(
    html,
    /data-source-dossier-action="play-receipt" data-receipt-key="SOURCE00001:receipt-0"/,
  );
  assert.match(html, /DAMAGE REPORT/);
  assert.match(html, /FEATURED SIGNATURE MOMENTS/);
  assert.match(html, /STRAIGHT TO STEVE&#39;S ASSHOLE/);
  assert.match(html, /id="sourceDossierFeldmanDamage-hated"/);
  const compactRunway = html.match(
    /<section class="source-dossier-feldman-best"[\s\S]*?<\/section>/,
  );
  assert.ok(compactRunway);
  assert.match(compactRunway[0], /PLAYABLE CLIPS TO CHECK OUT/);
  assert.match(compactRunway[0], /THE CLEANEST DOORS INTO THE SHOW/);
  assert.match(compactRunway[0], /21 SOURCE-BOUND STOPS/);
  assert.equal((compactRunway[0].match(/<article>/g) ?? []).length, 6);
  assert.match(compactRunway[0], /RUNWAY MOMENT 1/);
  assert.match(compactRunway[0], /RUNWAY MOMENT 6/);
  assert.doesNotMatch(compactRunway[0], /RUNWAY MOMENT 7/);
  assert.match(compactRunway[0], /WWAM UP IN YA \/ STINGER/);
  assert.match(compactRunway[0], /STRAIGHT TO STEVE&#39;S ASSHOLE/);
  assert.match(compactRunway[0], /CHARACTER APPEARANCE/);
  assert.match(compactRunway[0], /SOUNDBYTE \/ REPLAY/);
  assert.match(compactRunway[0], /MAJOR TOPIC TURN/);
  assert.match(
    compactRunway[0],
    /<h6><small>WWAM UP IN YA \/ STINGER<\/small>RUNWAY MOMENT 1<\/h6>/,
  );
  assert.match(compactRunway[0], /OPEN THE FULL 21-STOP RUNWAY/);
  assert.doesNotMatch(compactRunway[0], /\bFIVE\b/i);
  const compactExplore = html.match(
    /<nav class="source-dossier-explore"[\s\S]*?<\/nav>/,
  );
  assert.ok(compactExplore);
  assert.equal(
    (compactExplore[0].match(/>HIGHLIGHTS<\/a>/g) ?? []).length,
    1,
  );
  assert.match(
    compactExplore[0],
    /href="#sourceDossierFeldmanBest">HIGHLIGHTS<\/a>/,
  );
  assert.doesNotMatch(html, /class="source-dossier-wiki-local-nav"/);
  assert.ok(
    html.indexOf('class="source-dossier-feldman-quick-take"') <
      html.indexOf('class="source-dossier-feldman-story"') &&
      html.indexOf('class="source-dossier-feldman-story"') <
      html.indexOf('class="source-dossier-feldman-topic-rail"') &&
      html.indexOf('class="source-dossier-feldman-topic-rail"') <
        html.indexOf('class="source-dossier-feldman-damage"') &&
      html.indexOf('class="source-dossier-feldman-damage"') <
        html.indexOf('class="source-dossier-feldman-chronicle"') &&
      html.indexOf('class="source-dossier-feldman-chronicle"') <
        html.indexOf('class="source-dossier-feldman-receipts"') &&
      html.indexOf('class="source-dossier-feldman-receipts"') <
        html.indexOf('class="source-dossier-feldman-case-file"'),
    "short take, written story, topic doors, signature moments, playable index, then collapsed trust form one viewer-first flow",
  );
  const populatedDamageExplore = html.match(
    /<nav class="source-dossier-explore"[\s\S]*?<\/nav>/,
  );
  assert.ok(populatedDamageExplore);
  assert.doesNotMatch(html, /class="source-dossier-wiki-local-nav"/);
  assert.match(
    populatedDamageExplore[0],
    /href="#sourceDossierFeldmanTopics">TOPICS/,
  );
  assert.doesNotMatch(
    populatedDamageExplore[0],
    /href="#sourceDossierFeldmanDamage-hated"/,
  );

  ui.render(dossier.source.id, { fullFile: true });
  const fullExplore = mount.innerHTML.match(
    /<nav class="source-dossier-explore"[\s\S]*?<\/nav>/,
  );
  assert.ok(fullExplore);
  assert.match(
    fullExplore[0],
    /href="#sourceDossierFeldmanTopics">TOPICS/,
  );
  assert.doesNotMatch(
    fullExplore[0],
    /href="#sourceDossierShowWikiLane-topics-/,
  );
  assert.match(mount.innerHTML, /data-feldman-view="full"/);
  assert.match(mount.innerHTML, /data-feldman-story-expanded="true"/);
  assert.equal(
    (mount.innerHTML.match(/class="source-dossier-feldman-story-reel"/g) ?? []).length,
    4,
  );
  assert.doesNotMatch(
    mount.innerHTML,
    /class="source-dossier-feldman-story-toggle"/,
  );
  const fullRunway = mount.innerHTML.match(
    /<section class="source-dossier-feldman-best"[\s\S]*?<\/section>/,
  );
  assert.ok(fullRunway);
  assert.equal((fullRunway[0].match(/<article>/g) ?? []).length, 21);
  assert.match(fullRunway[0], /RUNWAY MOMENT 21/);
  assert.doesNotMatch(fullRunway[0], /OPEN THE FULL 21-STOP RUNWAY/);
  assert.doesNotMatch(fullRunway[0], /\bFIVE\b/i);
  ui.render(dossier.source.id);

  mount.click("toggle-episode-recap", { "data-owner-section": "wiki" });
  assert.match(mount.innerHTML, /data-feldman-view="recap"/);
  assert.match(mount.innerHTML, /data-feldman-recap-expanded="true"/);
  assert.match(mount.innerHTML, /data-feldman-story-expanded="true"/);
  assert.match(
    mount.innerHTML,
    /id="sourceDossierFeldmanStoryRemainder"><article class="source-dossier-feldman-story-reel"/,
  );
  assert.match(mount.innerHTML, /data-feldman-story="reel-04"/);
  assert.equal(
    (mount.innerHTML.match(/class="source-dossier-feldman-story-reel"/g) ?? []).length,
    4,
  );
  assert.match(mount.innerHTML, /BACK TO THE TWO-REEL CUT/);
  assert.match(
    mount.innerHTML,
    /id="sourceDossierFeldmanOmittedActs"><article class="source-dossier-feldman-act"/,
  );
  assert.match(mount.innerHTML, /aria-expanded="true">SHOW FEWER ACTS/);
  assert.match(mount.innerHTML, /data-feldman-act="act-4"/);
  const expandedRunway = mount.innerHTML.match(
    /<section class="source-dossier-feldman-best"[\s\S]*?<\/section>/,
  );
  assert.ok(expandedRunway);
  assert.equal((expandedRunway[0].match(/<article>/g) ?? []).length, 21);
  assert.match(expandedRunway[0], /RUNWAY MOMENT 21/);

  mount.click("toggle-episode-recap", { "data-owner-section": "wiki" });
  assert.match(mount.innerHTML, /data-feldman-view="highlights"/);
  assert.match(mount.innerHTML, /data-feldman-recap-expanded="false"/);
  assert.match(mount.innerHTML, /data-feldman-story-expanded="false"/);
  assert.doesNotMatch(mount.innerHTML, /data-feldman-story="reel-03"/);

  dossier.source.showWiki.episodeRecap.tier = "topic-recap";
  ui.render(dossier.source.id);
  assert.match(mount.innerHTML, /THE FELDMAN CUT \/\/ SOURCE SUBJECT MAP/);
  assert.match(
    mount.innerHTML,
    /THE INDEXED SUBJECT STOPS, IN TAPE ORDER/,
  );
  assert.match(mount.innerHTML, /SOURCE SUBJECT MAP/);
  assert.match(mount.innerHTML, /TOPIC NAVIGATION ONLY/);
  assert.match(mount.innerHTML, /SUBJECT MAP INCLUDED/);
  assert.match(mount.innerHTML, /TOPIC DOORS/);
  assert.doesNotMatch(mount.innerHTML, /HIGHLIGHTS? SHOWN/);
  assert.match(mount.innerHTML, /WHERE THEY TALK ABOUT IT/);
  assert.match(mount.innerHTML, /THE USEFUL SUBJECT JUMPS/);
  assert.match(mount.innerHTML, /A MAP, NOT A MIND READER/);
  assert.doesNotMatch(mount.innerHTML, /THE HIGHLIGHT RUNWAY \/\/ FULL-SHOW CUT/);

  mount.click("play-receipt", {
    "data-receipt-key": dossier.source.receipts[0].key,
    "data-owner-section": "wiki",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].receipt, dossier.source.receipts[0]);
  assert.equal(plays[0].section, "wiki");
});

test("human editorial ledgers render grouped rankings, readable verdicts, and playable character rows", () => {
  const dossier = makeDossier();
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "full-chronicle",
    editorialState: "full-tape-human-editorial-read",
    label: "WWAM HUMAN EDITORIAL RECAP",
    badge: "FULL TAPE REVIEWED",
    headline: "THE TAPE GETS ITS DAY IN COURT.",
    deck: "The human review keeps rankings, verdicts, and performances separate.",
    overview: "A source-bounded editorial recap with three useful ledgers.",
    topics: ["Movie rankings", "Character performances"],
    sections: [],
    story: [],
    highlightRunway: [],
    bestMoments: [],
    fanRead: {},
    editorialPanels: [
      {
        id: "ranking-board",
        type: "ranking-ledger",
        eyebrow: "THE RANKING",
        title: "THE BOARD",
        intro: "Only placements stated clearly enough on the tape appear here.",
        groups: [
          {
            label: "TOP TIER",
            items: ["Gremlins", "It's a Wonderful Life"],
          },
          {
            label: "STRAIGHT TO STEVE'S ASSHOLE",
            items: ["The Bad One"],
          },
        ],
      },
      {
        id: "verdict-ledger",
        type: "verdict-ledger",
        eyebrow: "WHAT THEY ACTUALLY THOUGHT",
        title: "THE PRAISE & THE PANIC",
        intro: "The cards preserve the tape's stated opinions.",
        items: [
          {
            subject: "Obsession & Soulm8te",
            verdict: "Strong acting, real scares, and some rough plot behavior.",
          },
          {
            subject: "Incomplete verdict",
            verdict: "",
          },
        ],
      },
      {
        id: "character-ledger",
        type: "character-ledger",
        eyebrow: "ACTUAL PERFORMANCES, NOT NAME-DROPS",
        title: "WHO REALLY SHOWED UP",
        items: [
          {
            at: 3803,
            end: 3830,
            character: "Dr. Loomis",
            label: "THE TALKING TACOS ALIBI",
          },
          {
            character: "Slenderman",
            label: "NAME-DROP ONLY",
          },
          {
            at: 9000,
            end: 9030,
            character: "Out Of Range",
            label: "MUST NOT BECOME PLAYABLE",
          },
        ],
        note: "A name-drop is not promoted into a performance.",
      },
    ],
    caseFile: {
      humanEditorialRead: true,
      receiptCount: 0,
      actCount: 0,
    },
    approval: {
      actualApproval: false,
      disclosure: "Human editorial copy without a creator endorsement.",
    },
    semanticFingerprint: "human-editorial-ledger-ui-fixture",
  };
  const plays = [];
  const { ui, mount } = setup(dossier, {
    onPlay: (payload) => plays.push(payload),
  });

  ui.render(dossier.source.id);
  const html = mount.innerHTML;
  assert.equal(
    (html.match(/class="source-dossier-editorial-ledger /g) ?? []).length,
    3,
  );
  assert.match(
    html,
    /data-editorial-panel="ranking-board" data-editorial-panel-type="ranking-ledger"/,
  );
  assert.match(html, /<h6>TOP TIER<\/h6><ul><li>Gremlins<\/li><li>It&#39;s a Wonderful Life<\/li>/);
  assert.match(html, /<h6>STRAIGHT TO STEVE&#39;S ASSHOLE<\/h6>/);
  assert.match(
    html,
    /data-editorial-panel="verdict-ledger" data-editorial-panel-type="verdict-ledger"/,
  );
  assert.match(html, /data-editorial-subject="Obsession &amp; Soulm8te"/);
  assert.match(
    html,
    /<h6>Obsession &amp; Soulm8te<\/h6><p>Strong acting, real scares, and some rough plot behavior\.<\/p>/,
  );
  assert.doesNotMatch(html, /Incomplete verdict/);

  const characterPanel = html.match(
    /<section class="source-dossier-editorial-ledger is-character-ledger"[\s\S]*?<\/section>/,
  );
  assert.ok(characterPanel);
  assert.match(characterPanel[0], /data-editorial-character="Dr\. Loomis"/);
  assert.match(characterPanel[0], /<h6>Dr\. Loomis<\/h6><p>THE TALKING TACOS ALIBI<\/p>/);
  assert.match(characterPanel[0], /<time>01:03:23&mdash;01:03:50<\/time>/);
  assert.match(
    characterPanel[0],
    /data-source-dossier-action="play-guide-cut" data-guide-at="3803" data-guide-end="3830"/,
  );
  assert.match(characterPanel[0], /data-guide-return="sourceDossierEditorialPanel-character-ledger-2"/);
  assert.match(characterPanel[0], /<h6>Slenderman<\/h6><p>NAME-DROP ONLY<\/p>/);
  assert.equal(
    (characterPanel[0].match(/data-source-dossier-action="play-guide-cut"/g) ?? []).length,
    1,
  );
  assert.match(characterPanel[0], /Out Of Range/);
  assert.match(characterPanel[0], /WHAT WE DID NOT GUESS/);
  assert.match(cssSource, /\.source-dossier-editorial-ledger-card\s*\{/);
  assert.match(
    cssSource,
    /\.source-dossier \.source-dossier-editorial-ledger-card > footer button\s*\{/,
  );

  mount.click("play-guide-cut", {
    "data-guide-at": "3803",
    "data-guide-end": "3830",
    "data-guide-label": "Dr. Loomis // THE TALKING TACOS ALIBI",
    "data-guide-return": "sourceDossierEditorialPanel-character-ledger-2",
    "data-guide-return-label": "WHO REALLY SHOWED UP",
    "data-owner-section": "wiki",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "episode-guide");
  assert.equal(plays[0].at, 3803);
  assert.equal(plays[0].end, 3830);
  assert.equal(plays[0].receipt, null);
  assert.equal(plays[0].section, "wiki");
  assert.match(mount.innerHTML, /data-now-playing-guide="3803:3830"/);
  assert.match(
    mount.innerHTML,
    /href="#sourceDossierEditorialPanel-character-ledger-2">RETURN TO WHO REALLY SHOWED UP/,
  );
});

test("structured summaries omit Show Menu links when editorial targets do not render", () => {
  const dossier = makeDossier();
  dossier.source.receipts[0].kind = "topic";
  dossier.source.receipts[0].evidenceType = "caption-topic-receipt";
  dossier.source.receipts[0].label = "TOPIC: HALLOWEEN";
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "receipt-recap",
    editorialState: "structured-source-summary",
    label: "SHOW WIKI // SOURCE-LINKED SUMMARY",
    badge: "PLAYABLE EPISODE INDEX",
    headline: "THE STRUCTURED SUMMARY",
    deck: "Only source-bound recap material should receive a navigation target.",
    overview: "Unresolved candidates stay out of the rendered recap.",
    topics: ["Halloween"],
    sections: [],
    story: [
      {
        id: "machine-story",
        label: "A STRUCTURED STORY CANDIDATE",
        at: 90,
        end: 120,
      },
    ],
    highlightRunway: [
      {
        receiptKey: dossier.source.receipts[0].key,
        ordinal: 1,
        category: "SOUNDBYTE / REPLAY",
        at: dossier.source.receipts[0].at,
        end: dossier.source.receipts[0].end,
        label: "THE ROOM BREAKS",
        excerpt: "she caught you goddamn hair off and then the room went",
      },
    ],
    bestMoments: [],
    fanRead: {
      hated: {
        label: "STRAIGHT TO STEVE'S ASSHOLE",
        topic: "AN AUTOMATIC GUESS",
        body: "This unresolved candidate must not become a public verdict.",
        at: dossier.source.receipts[0].at,
        end: dossier.source.receipts[0].end,
        receiptKey: dossier.source.receipts[0].key,
      },
    },
    caseFile: {
      receiptCount: 0,
      actCount: 0,
    },
    approval: {
      actualApproval: false,
      disclosure: "A structured summary, not a human editorial read.",
    },
    semanticFingerprint: "structured-summary-nav-ui-fixture",
  };
  const { ui, mount } = setup(dossier);

  ui.render(dossier.source.id);
  const html = mount.innerHTML;
  const showMenu = html.match(
    /<nav class="source-dossier-explore"[\s\S]*?<\/nav>/,
  );

  assert.ok(showMenu);
  assert.doesNotMatch(
    showMenu[0],
    /href="#sourceDossierFeldmanBest">HIGHLIGHTS<\/a>/,
  );
  assert.doesNotMatch(
    showMenu[0],
    /href="#sourceDossierFeldmanStory">EPISODE STORY<\/a>/,
  );
  assert.doesNotMatch(html, /id="sourceDossierFeldmanBest"/);
  assert.doesNotMatch(html, /id="sourceDossierFeldmanStory"/);
  assert.doesNotMatch(html, /THE ROOM BREAKS/);
  assert.doesNotMatch(html, /she caught you goddamn hair off/);
  assert.doesNotMatch(html, /AN AUTOMATIC GUESS/);
  assert.doesNotMatch(html, /STRAIGHT TO STEVE'S ASSHOLE/);
  assert.match(html, /WHAT CAME UP, WITHOUT A FAKE BEST-OF LIST/);
  assert.match(html, /1 PLAYABLE TOPIC DOOR \/\/ FULL STORY PENDING/);
  assert.match(html, /JUMP THE TOPIC BOARD/);
  assert.match(html, /Play Halloween from this show at 01:00/);
});

test("typed format facts turn the Christmas show into a playable ranking board", () => {
  const dossier = makeDossier();
  dossier.source.id = "QMYgsEfPMg0";
  dossier.source.title = "Christmas Movies Tier List 2025";
  dossier.source.displayTitle = "CHRISTMAS MOVIES TIER LIST 2025";
  dossier.source.duration = 12255;
  dossier.source.url = "https://www.youtube.com/watch?v=QMYgsEfPMg0";
  dossier.source.thumbnail =
    "https://i.ytimg.com/vi/QMYgsEfPMg0/maxresdefault.jpg";
  dossier.source.runtimeFormat = {
    id: "ranking",
    label: "CURATED PICKS",
    family: "ranking",
  };
  const receipt = dossier.source.receipts[0];
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "receipt-recap",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "PLAYABLE EPISODE RECAP",
    headline: "THE CHRISTMAS BOARD OPENS.",
    deck: "The episode file keeps its list events attached to the tape.",
    overview: "The show moves from news into a Christmas movie tier list.",
    topics: ["Christmas movies"],
    sections: [{
      id: "christmas-board",
      label: "THE BOARD OPENS",
      body: "The registered source receipt opens this episode file.",
      at: receipt.at,
      end: receipt.end,
      excerpt: receipt.excerpt,
      receiptKeys: [receipt.key],
    }],
    story: [{
      id: "reel-01",
      label: "OPENING // CHRISTMAS MOVIES",
      body: "The source-linked recap opens the Christmas movie board.",
      at: receipt.at,
      end: receipt.end,
      displayAt: receipt.at,
      displayEnd: receipt.end,
      anchorReceiptKey: receipt.key,
      anchorAt: receipt.at,
      anchor: receipt.label,
      primarySubject: "Christmas movies",
      excerpt: receipt.excerpt,
      receiptKeys: [receipt.key],
      narrative: { primarySubject: "Christmas movies" },
    }],
    highlightRunway: [],
    fanRead: {},
    caseFile: { receiptCount: 1, actCount: 1 },
    approval: {
      actualApproval: false,
      disclosure: "A running-bit label, not a creator endorsement.",
    },
    semanticFingerprint: "format-experience-ui-fixture",
  };
  const plays = [];
  const { ui, mount } = setup(dossier, {
    withEpisodeFormat: true,
    onPlay: (payload) => plays.push(payload),
  });

  ui.render(dossier.source.id);
  const html = mount.innerHTML;
  assert.match(html, /data-format-experience="ranking-board"/);
  assert.match(html, /THE RANKING BOARD/);
  assert.match(html, /NEWS BEFORE THE LIST/);
  assert.match(html, /CHRISTMAS LIST START/);
  assert.match(html, /HOME ALONE/);
  assert.match(html, /GRINCH/);
  assert.match(html, /data-guide-at="1032"/);
  assert.match(html, /captioned ranking statements/);
  assert.doesNotMatch(
    html,
    /sha256:|machine-surfaced|needs-editor-review|evidenceHash/i,
  );

  mount.click("play-guide-cut", {
    "data-guide-at": "1032",
    "data-guide-end": "1040",
    "data-guide-label": "NEWS BEFORE THE LIST",
    "data-guide-return": "sourceDossierFormatExperience",
    "data-guide-return-label": "RANKING BOARD",
    "data-owner-section": "wiki",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "episode-guide");
  assert.equal(plays[0].at, 1032);
  assert.equal(plays[0].end, 1040);
});

test("typed Batch 2 facts turn an episode recap into an accurate playable recap desk", () => {
  const dossier = makeDossier();
  Object.assign(dossier.source, {
    id: "rtWl8c57SYk",
    title: "IT: Welcome To Derry - Episode 1 Recap! LIVE!",
    displayTitle: "IT: WELCOME TO DERRY — EPISODE 1 RECAP",
    duration: 2060,
    url: "https://www.youtube.com/watch?v=rtWl8c57SYk",
  });
  const receipt = dossier.source.receipts[0];
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    sourceId: dossier.source.id,
    state: "ready",
    tier: "receipt-recap",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "PLAYABLE EPISODE RECAP",
    headline: "THE DERRY RECAP GETS AN EXACT-SOURCE MAP.",
    deck: "The episode file stays attached to this upload.",
    overview: "An exact-source episode recap with bounded playback.",
    topics: ["Welcome to Derry"],
    topicMap: [],
    highlightRunway: [],
    sections: [{
      id: "derry-open",
      label: "THE RECAP OPENS",
      body: "The registered recap opens this exact show.",
      at: receipt.at,
      end: receipt.end,
      excerpt: receipt.excerpt,
      receiptKeys: [receipt.key],
    }],
    story: [],
    fanRead: {},
    caseFile: { receiptCount: 1, actCount: 1 },
    approval: {
      actualApproval: false,
      disclosure: "A running-bit label, not a creator endorsement.",
    },
    semanticFingerprint: "typed-batch2-recap-ui-fixture",
  };
  const plays = [];
  const { ui, mount } = setup(dossier, {
    withEpisodeFormat: true,
    withTopicRebuild: true,
    onPlay: (payload) => plays.push(payload),
  });

  ui.render(dossier.source.id, { fullFile: true });
  const html = mount.innerHTML;
  assert.match(html, /data-format-experience="recap-desk"/);
  assert.match(html, /THE EPISODE RECAP/);
  assert.match(html, /11 TAPE-LOCKED STOPS/);
  assert.match(html, /OPENING CAR SCENE/);
  assert.match(html, /CGI COMPLAINT/);
  assert.match(html, /FINAL EPISODE VERDICT/);
  assert.match(
    html,
    /The closing verdict calls the episode really good and better than Alien: Earth\./,
  );
  assert.match(html, /speakers and depicted scenes unverified/i);
  assert.doesNotMatch(
    html,
    /sha256:|machine-surfaced|needs-editor-review|evidenceHash|promotionAllowed/i,
  );

  mount.click("play-guide-cut", {
    "data-guide-at": "1803",
    "data-guide-end": "1815",
    "data-guide-label": "Play FINAL EPISODE VERDICT",
    "data-guide-return": "sourceDossierFormatExperience",
    "data-guide-return-label": "EPISODE RECAP",
    "data-owner-section": "wiki",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "episode-guide");
  assert.equal(plays[0].at, 1803);
  assert.equal(plays[0].end, 1815);
});

test("final source rights block typed-fact excerpts before the restricted script page renders", () => {
  const dossier = makeDossier({ receiptCount: 1 });
  const leakedExcerpt = "taken excerpts from the Halloween Rob";
  Object.assign(dossier.source, {
    id: "R_bXrnNOcwg",
    title: "Reading the HALLOWEEN Script Live!",
    displayTitle: "READING THE HALLOWEEN SCRIPT LIVE!",
    duration: 7395,
    url: "https://www.youtube.com/watch?v=R_bXrnNOcwg",
    runtimeFormat: {
      id: "script",
      label: "SCRIPT READING",
      family: "script",
    },
    formatContract: { id: "script" },
    rightsPolicy: {
      restrictedToTopicNavigation: true,
      publicExcerptWordLimit: 0,
      promotionAllowed: false,
      speakerClaimsAllowed: false,
    },
  });
  const receipt = dossier.source.receipts[0];
  Object.assign(receipt, {
    kind: "topic-navigation",
    evidenceType: "caption-topic-navigation",
    excerpt: null,
    publicExcerptAllowed: false,
    label: "Live script reading",
  });
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    sourceId: dossier.source.id,
    state: "ready",
    tier: "topic-recap",
    headline: "THE SCRIPT SHOW GETS A TOPIC-ONLY MAP.",
    deck: "Only source-local subject doors are public.",
    overview: "The public page navigates the show without publishing script excerpts.",
    topics: ["Live script reading"],
    topicMap: [{
      receiptKey: receipt.key,
      label: "Live script reading",
      at: 225,
      end: 249,
      excerpt: leakedExcerpt,
    }],
    highlightRunway: [],
    sections: [],
    story: [],
    bestMoments: [],
    fanRead: {},
    caseFile: { receiptCount: 1, actCount: 0 },
    approval: {
      actualApproval: false,
      disclosure: "Topic navigation only.",
    },
    semanticFingerprint: "restricted-script-ui-fixture",
  };
  const { ui, mount } = setup(dossier, {
    withEpisodeFormat: true,
    withEpisodeFallback: true,
    withTopicRebuild: true,
  });

  ui.render(dossier.source.id, { fullFile: true });
  const html = mount.innerHTML;
  const formatDesk = html.match(
    /<section class="source-dossier-format-experience"[\s\S]*?<\/section>/,
  )?.[0] ?? "";
  assert.match(formatDesk, /THE SCRIPT SHOW MAP/);
  assert.match(formatDesk, /SCRIPT SUBJECT DOOR/);
  assert.doesNotMatch(formatDesk, /<blockquote/);
  assert.doesNotMatch(html, /THE SCRIPT SPINE/);
  assert.doesNotMatch(html, new RegExp(leakedExcerpt, "i"));
  assert.doesNotMatch(html, /11 FORMAT-SPECIFIC STOPS/);
});

test("final source rights suppress raw topic-rebuild packs on restricted shows", () => {
  const dossier = makeDossier({ receiptCount: 1 });
  Object.assign(dossier.source, {
    id: "vjyNEQmgxC8",
    title: "Let's Watch Scary Videos Together! Live!",
    displayTitle: "LET'S WATCH SCARY VIDEOS TOGETHER! LIVE!",
    duration: 10806,
    url: "https://www.youtube.com/watch?v=vjyNEQmgxC8",
    rightsPolicy: {
      restrictedToTopicNavigation: true,
      publicExcerptWordLimit: 0,
      promotionAllowed: false,
      speakerClaimsAllowed: false,
    },
  });
  const { ui, mount } = setup(dossier, { withTopicRebuild: true });

  ui.render(dossier.source.id, { fullFile: true });
  assert.doesNotMatch(mount.innerHTML, /data-topic-rebuild-experience="ready"/);
  assert.doesNotMatch(mount.innerHTML, /15 DEEP-SOURCE STOPS/);
});

test("every ready source can fall back to an honest format-native tape desk", () => {
  const dossier = makeDossier();
  const receipt = dossier.source.receipts[0];
  dossier.source.runtimeFormat = {
    id: "movie-news",
    label: "MOVIE NEWS",
    family: "news",
  };
  dossier.source.subtype = {
    id: "general-movie-news",
    label: "GENERAL MOVIE NEWS",
  };
  dossier.source.formatContract = { id: "movie-news" };
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    sourceId: dossier.source.id,
    state: "ready",
    tier: "receipt-recap",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "PLAYABLE EPISODE RECAP",
    headline: "THE NEWS TAPE GETS A SOURCE-LOCKED MAP.",
    deck: "The episode file keeps every registered coordinate on this show.",
    overview: "A news-format episode recap with navigation-only format context.",
    topics: ["Halloween"],
    topicMap: [{
      receiptKey: receipt.key,
      label: "Halloween",
      at: 420,
      end: 444,
    }],
    highlightRunway: [{
      receiptKey: receipt.key,
      label: "Up In Ya",
      category: "UP IN YA / STINGER",
      at: 920,
      end: 944,
      excerpt: receipt.excerpt,
    }, {
      receiptKey: receipt.key,
      label: "Halloween",
      category: "MAJOR TOPIC TURN",
      at: 420,
      end: 444,
      excerpt: receipt.excerpt,
    }],
    sections: [{
      id: "news-open",
      label: "THE NEWS OPENS",
      body: "The registered news recap opens this source-local episode file.",
      at: 120,
      end: 144,
      anchor: "Halloween",
      excerpt: receipt.excerpt,
      receiptKeys: [receipt.key],
    }, {
      id: "news-halloween-duplicate",
      label: "HALLOWEEN CHECKPOINT",
      body: "A second registered structure points to the same visitor stop.",
      at: 420,
      end: 444,
      anchor: "Halloween",
      excerpt: receipt.excerpt,
      receiptKeys: [receipt.key],
    }],
    story: [],
    fanRead: {},
    caseFile: { receiptCount: 1, actCount: 1 },
    approval: {
      actualApproval: false,
      disclosure: "A running-bit label, not a creator endorsement.",
    },
    semanticFingerprint: "format-fallback-ui-fixture",
  };
  const plays = [];
  const { ui, mount } = setup(dossier, {
    withEpisodeFallback: true,
    onPlay: (payload) => plays.push(payload),
  });

  ui.render(dossier.source.id, { fullFile: true });
  const html = mount.innerHTML;
  const deskHtml = html.match(
    /<section class="source-dossier-format-experience"[\s\S]*?<\/section>/,
  )?.[0] ?? "";
  assert.match(deskHtml, /data-format-experience="news-wire"/);
  assert.match(deskHtml, /THE MOVIE NEWS WIRE/);
  assert.match(deskHtml, /NEWS SUBJECT DOOR/);
  assert.match(deskHtml, /NEWS TAPE MARKER/);
  assert.match(deskHtml, /NEWS RECAP STOP/);
  assert.match(deskHtml, /TOPIC NAVIGATION IS NOT FACT CHECKING/);
  assert.match(
    deskHtml,
    /These stops do not decide whether a statement is reporting/,
  );
  assert.equal(
    (deskHtml.match(/data-guide-at="420"/g) || []).length,
    1,
    "same-time same-subject evidence should become one visitor stop",
  );
  assert.doesNotMatch(
    deskHtml,
    /speakerName|verdict|winner|ballot|questionEvidence/,
  );

  mount.click("play-guide-cut", {
    "data-guide-at": "420",
    "data-guide-end": "444",
    "data-guide-label": "Halloween",
    "data-guide-return": "sourceDossierFormatExperience",
    "data-guide-return-label": "NEWS WIRE",
    "data-owner-section": "wiki",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "episode-guide");
  assert.equal(plays[0].at, 420);
  assert.equal(plays[0].end, 444);
});

test("caption-derived rebuilds render all exact-source stops without leaking review machinery", () => {
  const dossier = makeDossier();
  const receipt = dossier.source.receipts[0];
  dossier.source.id = "vjyNEQmgxC8";
  dossier.source.title = "Let's Watch Scary Videos Together! Live!";
  dossier.source.displayTitle = "LET'S WATCH SCARY VIDEOS TOGETHER! LIVE!";
  dossier.source.duration = 10806;
  dossier.source.url = "https://www.youtube.com/watch?v=vjyNEQmgxC8";
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "receipt-recap",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "PLAYABLE EPISODE RECAP",
    headline: "THE SCARY-VIDEO TAPE GETS A SOURCE-LOCKED ROUTE.",
    deck: "Every surfaced stop stays attached to the exact upload.",
    overview: "The page follows the registered show evidence without assigning a speaker.",
    topics: ["Scary videos"],
    sections: [{
      id: "scary-video-open",
      label: "THE TAPE OPENS",
      body: "The first registered source receipt opens this episode file.",
      at: receipt.at,
      end: receipt.end,
      excerpt: receipt.excerpt,
      receiptKeys: [receipt.key],
    }],
    story: [{
      id: "reel-01",
      label: "OPENING // SCARY VIDEOS",
      body: "The source-linked recap opens the scary-video route.",
      at: receipt.at,
      end: receipt.end,
      displayAt: receipt.at,
      displayEnd: receipt.end,
      anchorReceiptKey: receipt.key,
      anchorAt: receipt.at,
      anchor: receipt.label,
      primarySubject: "Scary videos",
      excerpt: receipt.excerpt,
      receiptKeys: [receipt.key],
      narrative: { primarySubject: "Scary videos" },
    }],
    highlightRunway: [],
    fanRead: {},
    caseFile: { receiptCount: 1, actCount: 1 },
    approval: {
      actualApproval: false,
      disclosure: "A running-bit label, not a creator endorsement.",
    },
    semanticFingerprint: "topic-rebuild-ui-fixture",
  };
  const plays = [];
  const { ui, mount } = setup(dossier, {
    withTopicRebuild: true,
    onPlay: (payload) => plays.push(payload),
  });

  ui.render(dossier.source.id, { fullFile: true });
  const html = mount.innerHTML;
  assert.match(html, /data-topic-rebuild-experience="ready"/);
  assert.match(html, /15 EXACT-SOURCE STOPS/);
  assert.match(html, /TOPIC \/ FORMAT DOOR/);
  assert.match(html, /ON-TAPE TAKE/);
  assert.match(html, /COMEDY BEAT/);
  assert.match(html, /COLD OPEN \/\/ THE TAPE ROLLS/);
  assert.match(html, /CREATOR SALUTE \/\/ SHORTS OVER HOLLYWOOD/);
  assert.match(html, /data-guide-at="1"/);
  assert.match(html, /data-guide-at="10300"/);
  assert.match(html, /Play the clip to confirm who is speaking/i);
  assert.doesNotMatch(
    html,
    /sha256:|promotionAllowed|machine-surfaced|reviewState|rightsPolicy/i,
  );

  mount.click("play-guide-cut", {
    "data-guide-at": "1",
    "data-guide-end": "25",
    "data-guide-label": "COLD OPEN // THE TAPE ROLLS",
    "data-guide-return": "sourceDossierDeepStops",
    "data-guide-return-label": "EXACT-SOURCE STOPS",
    "data-owner-section": "wiki",
  });
  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "episode-guide");
  assert.equal(plays[0].at, 1);
  assert.equal(plays[0].end, 25);
});

test("combined Feldman recap and Episode Guide links reveal their full-file targets", () => {
  const dossier = makeDossier();
  const receipt = dossier.source.receipts[0];
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "receipt-recap",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "RECEIPT RECAP",
    headline: "THE RECAP AND THE DEEP DIVE SHARE THE SAME TAPE.",
    deck: "The compact recap keeps the full guide one honest jump away.",
    overview: "A source-bound recap with a separately mapped Episode Guide.",
    topics: ["Halloween"],
    sections: [{
      id: "cold-open",
      label: "COLD OPEN",
      body: "The first registered turn starts the recap.",
      at: receipt.at,
      end: receipt.end,
      excerpt: receipt.excerpt,
      receiptKeys: [receipt.key],
    }],
    fanRead: {},
    caseFile: { receiptCount: 1, actCount: 1 },
    approval: {
      actualApproval: false,
      disclosure: "A running-bit label, not a creator endorsement.",
    },
    semanticFingerprint: "combined-recap-guide-fixture",
  };
  dossier.source.showWiki.episodeGuide = {
    schema: "wwam-episode-guide/v2",
    basis: "Source-local caption guide fixture",
    metrics: { chapters: 0, threads: 0, cuts: 1, substantive: 1 },
    chapters: [],
    threads: [],
    takeArc: [],
    cuts: [{
      id: "guide-cut-1",
      at: receipt.at,
      end: receipt.end,
      score: 90,
      category: "LOVE LETTER",
      topic: "THE FIRST REGISTERED TURN",
      excerpt: receipt.excerpt,
    }],
    fanRead: {
      whyThisNightMatters: {
        label: "WHY THIS NIGHT MATTERS",
        body: "The recap and guide both resolve to the exact same upload.",
        strongestCutId: "guide-cut-1",
        primaryThread: "Halloween",
      },
      loved: {
        label: "WHAT THE TAPE DEFENDED",
        body: "The source-local opening earns the first replay.",
        cutId: "guide-cut-1",
        category: "LOVE LETTER",
        topic: "THE FIRST REGISTERED TURN",
        excerpt: receipt.excerpt,
      },
    },
  };
  const { ui, mount } = setup(dossier);

  ui.render(dossier.source.id);
  assert.match(mount.innerHTML, /href="#sourceDossierEpisodeGuide"/);
  assert.doesNotMatch(mount.innerHTML, /href="#sourceDossierFanRead"/);
  assert.doesNotMatch(mount.innerHTML, /id="sourceDossierEpisodeGuide"/);
  assert.doesNotMatch(mount.innerHTML, /id="sourceDossierFanRead"/);

  const guideTarget = mount.registerJumpTarget(
    "sourceDossierEpisodeGuide",
    { requiresFullFile: true },
  );
  assert.equal(mount.clickLink("#sourceDossierEpisodeGuide"), true);
  assert.match(mount.innerHTML, /data-source-dossier-view="full"/);
  assert.match(mount.innerHTML, /id="sourceDossierEpisodeGuide"/);
  assert.equal(guideTarget.heading.focusCount, 1);

  ui.render(dossier.source.id);
  const fanTarget = mount.registerJumpTarget(
    "sourceDossierFanRead",
    { requiresFullFile: true },
  );
  assert.equal(mount.clickLink("#sourceDossierFanRead"), true);
  assert.match(mount.innerHTML, /data-source-dossier-view="full"/);
  assert.match(mount.innerHTML, /id="sourceDossierFanRead"/);
  assert.equal(fanTarget.heading.focusCount, 1);
});

test("Damage Report shortcuts replace empty Steve and Up In Ya lanes and expand compact recaps", () => {
  const dossier = makeDossier();
  dossier.source.showWiki.lanes
    .filter((lane) => ["up-in-ya", "straight-to-steves-asshole"].includes(lane.id))
    .forEach((lane) => {
      lane.receiptKeys = [];
    });
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "receipt-recap",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "RECEIPT RECAP",
    headline: "THE DAMAGE REPORT HAS ITS OWN DOOR.",
    deck: "Two source-backed turns remain playable from the recap.",
    overview: "This exact show retains both named Damage Report categories.",
    sections: [
      {
        id: "cold-open",
        label: "COLD OPEN",
        body: "The tape opens with a registered receipt.",
        at: dossier.source.receipts[0].at,
        end: dossier.source.receipts[0].end,
        receiptKeys: [dossier.source.receipts[0].key],
      },
    ],
    fanRead: {
      hated: {
        label: "STRAIGHT TO STEVE'S ASSHOLE",
        topic: "THE COMPLAINT DESK",
        body: "The strongest negative turn remains attached to this tape.",
        at: dossier.source.receipts[5].at,
        end: dossier.source.receipts[5].end,
        receiptKey: dossier.source.receipts[5].key,
      },
      wildestDetour: {
        label: "WWAM UP IN YA",
        topic: "THE ROOM LEAVES THE ROAD",
        body: "The wildest detour remains attached to this tape.",
        at: dossier.source.receipts[4].at,
        end: dossier.source.receipts[4].end,
        receiptKey: dossier.source.receipts[4].key,
      },
    },
    approval: {
      actualApproval: false,
      disclosure: "A running-bit label, not a creator endorsement.",
    },
    semanticFingerprint: "feldman-damage-shortcut-fixture",
  };
  const { ui, mount } = setup(dossier);
  ui.render(dossier.source.id);

  const html = mount.innerHTML;
  const explore = html.match(
    /<nav class="source-dossier-explore"[\s\S]*?<\/nav>/,
  );
  assert.ok(explore);
  assert.doesNotMatch(html, /class="source-dossier-wiki-local-nav"/);
  [
    ["sourceDossierFeldmanDamage-hated", "STRAIGHT TO STEVE&#39;S ASSHOLE"],
    ["sourceDossierFeldmanDamage-wildest-detour", "WWAM UP IN YA"],
  ].forEach(([id, label]) => {
    assert.ok(explore[0].includes(`href="#${id}">${label}</a>`));
    assert.ok(html.includes(`<article id="${id}"`));
  });
  assert.match(html, /data-feldman-recap-expanded="false"/);

  const target = mount.registerJumpTarget("sourceDossierFeldmanDamage-hated");
  assert.equal(
    mount.clickLink("#sourceDossierFeldmanDamage-hated"),
    true,
  );
  assert.match(mount.innerHTML, /data-feldman-recap-expanded="true"/);
  assert.match(mount.innerHTML, /data-feldman-view="recap"/);
  assert.equal(target.scrollCalls.length, 1);
  assert.equal(target.scrollCalls[0].block, "start");
  assert.equal(target.heading.focusCount, 1);
});

test("full chronicles replace empty receipt classes with guide cuts and story threads", () => {
  const dossier = makeDossier();
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "full-chronicle",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "FULL CHRONICLE",
    headline: "HALLOWEEN AFTER MIDNIGHT.",
    deck: "A full-caption watchalong file.",
    overview: "The exact show has a playable full-runtime story.",
    sections: [{
      id: "act-01",
      label: "COLD OPEN // MICHAEL MYERS",
      body: "The first exact-show chapter.",
      at: dossier.source.receipts[0].at,
      end: dossier.source.receipts[0].end,
      excerpt: dossier.source.receipts[0].excerpt,
      receiptKeys: [dossier.source.receipts[0].key],
    }],
    fanRead: {},
    caseFile: {
      receiptCount: 8,
      topicCount: 0,
      momentCount: 8,
      characterCount: 0,
      actCount: 5,
      guideCutCount: 13,
      threadCount: 6,
      tapeSpanPercent: 65,
    },
    approval: {
      actualApproval: false,
      disclosure: "A running-bit label, not a creator endorsement.",
    },
    semanticFingerprint: "feldman-full-chronicle-ui-fixture",
  };
  const { ui, mount } = setup(dossier);

  ui.render(dossier.source.id);

  assert.match(
    mount.innerHTML,
    /data-feldman-stat="cuts"><b>13<\/b><small>FULL-CAPTION CUTS/,
  );
  assert.match(
    mount.innerHTML,
    /data-feldman-stat="threads"><b>6<\/b><small>STORY THREADS/,
  );
  assert.match(
    mount.innerHTML,
    /data-feldman-stat="acts"><b>5<\/b><small>RECAP ACTS/,
  );
  assert.doesNotMatch(mount.innerHTML, /<b>0<\/b><small>TOPIC DOORS/);
});

test("held episode recaps wait on the tape without claiming Feldman approval", () => {
  const dossier = makeDossier({ metadataOnly: true, receiptCount: 0 });
  dossier.source.availability = "age-restricted";
  dossier.source.exactSourceHold = {
    state: "held-age-gated",
    reason: "The exact YouTube cut requires age-authenticated media access.",
  };
  dossier.source.officialAlternate = {
    kind: "official-podcast-edition",
    title: "Official WWAM alternate commentary",
    episodeUrl: "https://podcasters.spotify.com/pod/show/example/episodes/tape",
    enclosureUrl: "https://traffic.megaphone.fm/EXAMPLE.mp3",
    duration: 7517.61,
    canonicalDuration: 7412,
    durationDelta: 105.61,
    timestampIsomorphic: false,
    publicPlaybackAllowed: true,
    evidenceBoundary: "Official alternate edit; not substituted for YouTube timestamps.",
    routes: [
      { id: "podcast-route-1", t: 501, end: 509, label: "WWAM UP IN YA", excerpt: "A bounded podcast-clock route." },
      { id: "podcast-route-2", t: 1090, end: 1102, label: "STRAIGHT TO STEVE'S ASSHOLE", excerpt: "A second bounded route." },
    ],
  };
  dossier.source.showWiki.episodeRecap = {
    schema: "wwam-feldman-recap/v1",
    state: "held",
    tier: "source-safe-held",
    label: "EPISODE RECAP",
    badge: "RECAP WAITING ON THE TAPE",
    headline: "THE UPLOAD IS REAL. THE RECAP ISN'T READY TO LIE FOR IT.",
    deck: "The official upload is registered and waiting for source-local captions.",
    overview: "Verified source details remain available without invented episode events.",
    sections: [],
    fanRead: {},
    format: {
      label: "MOVIE COMMENTARY",
    },
    approval: {
      actualApproval: false,
      disclosure: "No creator approval is claimed.",
    },
    semanticFingerprint: "feldman-held-ui-fixture",
  };
  const { ui, mount } = setup(dossier);

  ui.render(dossier.source.id);
  const html = mount.innerHTML;

  assert.match(html, /data-feldman-recap="held"/);
  assert.match(html, /RECAP WAITING ON THE TAPE/);
  assert.match(html, /NO MADE-UP EPISODE EVENTS/);
  assert.doesNotMatch(html, /sourceDossierFeldmanStory|data-feldman-story/);
  assert.doesNotMatch(html, /source-dossier-recap-cta/);
  assert.doesNotMatch(html, /source-dossier-feldman-identity/);
  assert.match(html, /source-dossier-feldman-held-action/);
  assert.match(html, /START THIS SHOW'S DEEP DIVE/);
  assert.match(html, /OFFICIAL WWAM ALTERNATE EDITION/);
  assert.match(html, /PLAYABLE HERE \/\/ TIMELINE KEPT SEPARATE/);
  assert.match(html, /<audio controls preload="none"/);
  assert.match(html, /PODCAST CLOCK/);
  assert.match(html, /2 AUDIO-BOUND ROUTES/);
  assert.match(html, /data-source-dossier-action="play-alternate-route"/);
  assert.match(html, /OPEN OFFICIAL AUDIO/);
  assert.doesNotMatch(html, /PLAY OFFICIAL ALTERNATE/);
  assert.match(html, /SOURCE STATUS<\/small><b>AGE RESTRICTED/);
  assert.match(html, /EXACT CUT UNAVAILABLE/);
  assert.ok(html.includes(dossier.source.officialAlternate.enclosureUrl));
  assert.ok(html.includes(dossier.source.officialAlternate.episodeUrl));
  assert.match(html, /1 minute 46 seconds longer than the canonical YouTube cut/);
  assert.ok(
    html.indexOf('class="source-dossier-official-alternate"') <
      html.indexOf('class="source-dossier-feldman-held-action"') &&
      html.indexOf('class="source-dossier-feldman-held-action"') <
      html.indexOf('class="source-dossier-feldman-facts"'),
    "the playable alternate comes before the intake action and upload facts",
  );
  assert.doesNotMatch(html, /data-source-dossier-action="play-source"/);
  assert.doesNotMatch(html, /WWAM FELDMAN APPROVED RECAP/);
  assert.doesNotMatch(html, /FELDMAN APPROVED/i);

  const audioTarget = mount.registerJumpTarget(
    "sourceDossierAlternatePlayer",
    { audioFocus: true },
  );
  assert.equal(mount.clickLink("#sourceDossierAlternatePlayer"), true);
  assert.equal(audioTarget.audio.focusCount, 1);
  assert.equal(audioTarget.heading.focusCount, 0);
});

test("a verified timeline-matched official edition plays age-gated WWAM audio in-page", () => {
  const dossier = makeDossier();
  dossier.source.availability = "age-restricted";
  dossier.source.officialAlternate = {
    kind: "official-podcast-edition",
    title: "Ranking every TERMINATOR, ROBOCOP + ALIEN Movie",
    episodeUrl: "https://podcasters.spotify.com/pod/show/example/episodes/ranking",
    enclosureUrl: "https://traffic.megaphone.fm/EXAMPLE.mp3",
    duration: 7411.71,
    canonicalDuration: 7412,
    durationDelta: 0.29,
    timestampIsomorphic: true,
    publicPlaybackAllowed: true,
    evidenceBoundary: "Official WWAM audio with verified canonical timestamp mapping.",
  };
  const { ui, mount } = setup(dossier);

  ui.render(dossier.source.id);
  const html = mount.innerHTML;

  assert.match(html, /AGE-GATED YOUTUBE \/\/ OFFICIAL WWAM AUDIO/);
  assert.match(html, /THE SAME SHOW PLAYS RIGHT HERE/);
  assert.match(html, /VERIFIED TIMELINE MATCH/);
  assert.match(html, /data-source-dossier-timeline-audio/);
  assert.match(html, /<audio controls preload="metadata"/);
  assert.match(html, /PLAY OFFICIAL AUDIO HERE/);
  assert.ok(html.includes(dossier.source.officialAlternate.enclosureUrl));
  assert.ok(html.includes(dossier.source.officialAlternate.episodeUrl));
  assert.doesNotMatch(html, /PLAYABLE EDIT, CLEARLY LABELED/);
});

test("official alternate Ask answers rebind to the canonical playable route", () => {
  const dossier = makeDossier({ metadataOnly: true, receiptCount: 0 });
  dossier.source.availability = "age-restricted";
  dossier.source.exactSourceHold = {
    state: "held-age-gated",
    reason: "The exact YouTube cut requires age-authenticated media access.",
  };
  dossier.source.officialAlternate = {
    kind: "official-podcast-edition",
    title: "Official WWAM alternate commentary",
    episodeUrl: "https://podcasters.spotify.com/pod/show/example/episodes/tape",
    enclosureUrl: "https://traffic.megaphone.fm/EXAMPLE.mp3",
    duration: 7517.61,
    canonicalDuration: 7412,
    durationDelta: 105.61,
    timestampIsomorphic: false,
    publicPlaybackAllowed: true,
    evidenceBoundary: "Official alternate edit; not substituted for YouTube timestamps.",
  };
  const queryEngine = {
    answer(request) {
      return makeQueryAnswer(dossier, {
        status: "proof",
        intent: "alternate",
        query: request.query,
        message: "Yes. The official alternate edition can play here.",
        results: [
          {
            type: "metadata",
            sourceId: dossier.source.id,
            field: "official-alternate",
            basis: "forged-basis",
            value: {
              available: true,
              officialAlternate: {
                title: "FORGED ALTERNATE",
                episodeUrl: "javascript:alert(1)",
                enclosureUrl: "javascript:alert(2)",
                timestampIsomorphic: true,
              },
            },
          },
        ],
      });
    },
  };
  const { ui, mount } = setup(dossier, { queryEngine });
  ui.render(dossier.source.id);
  mount.submit("Can I play this here?");

  assert.match(mount.innerHTML, /data-source-query-status="proof"/);
  assert.match(mount.innerHTML, /OFFICIAL ALTERNATE \/\/ PLAYABLE HERE/);
  assert.match(mount.innerHTML, /<b>AVAILABLE HERE<\/b>PLAYBACK/);
  assert.match(mount.innerHTML, /<b>SEPARATE EDIT<\/b>TIMELINE/);
  assert.match(mount.innerHTML, /href="#sourceDossierAlternatePlayer"/);
  assert.match(mount.innerHTML, /OPEN OFFICIAL AUDIO/);
  assert.doesNotMatch(mount.innerHTML, /PLAY OFFICIAL ALTERNATE/);
  assert.ok(mount.innerHTML.includes(dossier.source.officialAlternate.episodeUrl));
  assert.doesNotMatch(mount.innerHTML, /FORGED ALTERNATE|javascript:alert|forged-basis/i);
  assert.doesNotMatch(mount.innerHTML, /\[object Object\]/);
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
    mount.innerHTML.indexOf('href="#sourceDossierShowWikiSummary">SUMMARY</a>') <
      mount.innerHTML.indexOf('href="#sourceDossierEpisodeGuide">DEEP DIVE</a>'),
    "the viewer-facing summary leads the research spine in the shortcut strip",
  );
  assert.match(mount.innerHTML, /data-episode-guide-view="start-here"/);
  assert.doesNotMatch(mount.innerHTML, /href="#sourceDossierFanRead">FAN READ<\/a>/);
  assert.doesNotMatch(mount.innerHTML, /id="sourceDossierFanRead"/);
  assert.match(mount.innerHTML, /4 STARTER MOMENTS \/\/ 21 TIMESTAMPS/);
  assert.match(mount.innerHTML, /<b>8<\/b> CUTS IN THE FULL GUIDE/);
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
  assert.equal(guideTarget.scrollCalls[0].behavior, "auto");
  assert.equal(guideTarget.scrollCalls[0].block, "start");
  assert.equal(guideTarget.heading.focusCount, 1);
  assert.equal(guideTarget.heading.getAttribute("tabindex"), "-1");

  mount.click("play-guide-cut", {
    "data-guide-at": "480",
    "data-guide-end": "510",
    "data-guide-label": "Playable Cut 1",
    "data-guide-return": "sourceDossierEpisodeGuide",
    "data-guide-return-label": "EPISODE DEEP DIVE",
    "data-owner-section": "wiki",
  });

  assert.equal(plays.length, 1);
  assert.equal(plays[0].mode, "episode-guide");
  assert.equal(plays[0].at, 480);
  assert.equal(plays[0].end, 510);
  assert.equal(plays[0].receipt, null);
  assert.equal(plays[0].sourceId, "SOURCE00001");
  assert.match(mount.innerHTML, /class="source-dossier-now-playing"/);
  assert.match(
    mount.innerHTML,
    /class="source-dossier-now-playing" id="sourceDossierNowPlaying" role="status" aria-live="polite" aria-atomic="true"/,
  );
  assert.match(mount.innerHTML, /data-now-playing-guide="480:510"/);
  assert.match(mount.innerHTML, /<b>Playable Cut 1<\/b>/);
  assert.match(mount.innerHTML, /<time>08:00&mdash;08:30<\/time>/);
  assert.match(mount.innerHTML, /EPISODE GUIDE CUT/);
  assert.match(mount.innerHTML, /SPEAKER NOT CONFIRMED/);
  assert.match(
    mount.innerHTML,
    /href="#sourceDossierEpisodeGuide">RETURN TO EPISODE DEEP DIVE/,
  );

  const fanTarget = mount.registerJumpTarget("sourceDossierFanRead", {
    requiresFullFile: true,
  });
  assert.equal(mount.clickLink("#sourceDossierFanRead"), true);
  assert.match(mount.innerHTML, /data-source-dossier-view="full"/);
  assert.equal(fanTarget.scrollCalls.length, 1);
  assert.equal(fanTarget.scrollCalls[0].behavior, "auto");
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

test("guide-cut playback restores keyboard focus to the exact activated cut", () => {
  const document = { activeElement: null };
  const { ui, mount } = setup(makeDossier(), { document });
  ui.render("SOURCE00001", { fullFile: true });

  const attributes = {
    "data-source-dossier-action": "play-guide-cut",
    "data-guide-at": "480",
    "data-guide-end": "510",
    "data-guide-label": "Playable Cut 1",
    "data-guide-return": "sourceDossierEpisodeGuide",
  };
  const active = {
    getAttribute(name) {
      return attributes[name] ?? null;
    },
  };
  const candidate = (at) => ({
    focusCount: 0,
    getAttribute(name) {
      if (name === "data-source-dossier-action") return "play-guide-cut";
      if (name === "data-guide-at") return at;
      if (name === "data-guide-end") return at === "480" ? "510" : "930";
      if (name === "data-guide-label") {
        return at === "480" ? "Playable Cut 1" : "Playable Cut 2";
      }
      if (name === "data-guide-return") return "sourceDossierEpisodeGuide";
      return null;
    },
    focus() {
      this.focusCount += 1;
    },
  });
  const wrong = candidate("900");
  const exact = candidate("480");
  document.activeElement = active;
  mount.contains = (node) => node === active;
  mount.querySelectorAll = () => [wrong, exact];

  mount.click("play-guide-cut", {
    ...attributes,
    "data-owner-section": "wiki",
  });

  assert.equal(wrong.focusCount, 0);
  assert.equal(exact.focusCount, 1);
});

test("full-file density toggle restores focus to its rendered counterpart", () => {
  const document = { activeElement: null };
  const { ui, mount } = setup(makeDossier(), { document });
  ui.render("SOURCE00001");

  const control = (action) => ({
    action,
    focusCount: 0,
    getAttribute(name) {
      return name === "data-source-dossier-action" ? this.action : null;
    },
    focus() {
      this.focusCount += 1;
    },
  });
  const openActive = control("open-full-file");
  const closeRendered = control("close-full-file");
  document.activeElement = openActive;
  mount.contains = (node) => node === document.activeElement;
  mount.querySelectorAll = () => [closeRendered];

  mount.click("open-full-file");
  assert.match(mount.innerHTML, /data-source-dossier-view="full"/);
  assert.equal(closeRendered.focusCount, 1);

  const openRendered = control("open-full-file");
  document.activeElement = closeRendered;
  mount.querySelectorAll = () => [openRendered];
  mount.click("close-full-file");
  assert.match(mount.innerHTML, /data-source-dossier-view="compact"/);
  assert.equal(openRendered.focusCount, 1);
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

test("caption transport debris stays playable navigation instead of becoming prose", () => {
  const dossier = makeDossier();
  dossier.source.receipts[2].excerpt =
    "The argument turns here. >> Then the decoder keeps going >> and breaks.";
  dossier.source.receipts[4].excerpt = "Penis penis penis penis.";
  const { ui, mount } = setup(dossier);
  ui.render("SOURCE00001", { fullFile: true });

  assert.doesNotMatch(mount.innerHTML, /The argument turns here|Penis penis/);
  assert.match(mount.innerHTML, /JUMP TO 03:22/);
  assert.match(mount.innerHTML, /JUMP TO 05:44/);
});

test("stacked decoder clause joins are quarantined without losing the play door", () => {
  const dossier = makeDossier();
  dossier.source.receipts[2].excerpt =
    "It is is the it before this before that and the caption keeps going.";
  const { ui, mount } = setup(dossier);
  ui.render("SOURCE00001", { fullFile: true });

  assert.doesNotMatch(mount.innerHTML, /It is is the it before this before that/);
  assert.match(mount.innerHTML, /JUMP TO 03:22/);
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
    querySelector(selector) {
      return selector === "h2,h3,h4,h5" ? headingNode : null;
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
  assert.match(mount.innerHTML, /5 ON FILE \/\/ 5 MATCHED \/\/ 3 SHOWN/);
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
  assert.match(mount.innerHTML, /5 ON FILE \/\/ 5 MATCHED \/\/ 3 SHOWN/);
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
  assert.match(mount.innerHTML, /2 ON FILE \/\/ 2 MATCHED \/\/ 2 SHOWN/);
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
  assert.match(mount.innerHTML, /DEEP-DIVE CUT \/\/ SOURCE MOMENT MATCH/);
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
    "Show me the source brief.",
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
  assert.match(html, /<time>05:44&mdash;06:06<\/time>/);
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
  assert.match(mount.innerHTML, /<time>05:44&mdash;06:06<\/time>/);
});

test("one Show Menu replaces the duplicate local nav and keeps Source Brief navigation compact", () => {
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

  const showMenuMatch = mount.innerHTML.match(
    /<nav class="source-dossier-explore"[\s\S]*?<\/nav>/,
  );
  assert.ok(showMenuMatch);
  const showMenu = showMenuMatch[0];
  assert.equal((showMenu.match(/<a /g) ?? []).length, 7);
  assert.ok(showMenu.includes('href="#sourceDossierPlayerSection">WATCH</a>'));
  assert.ok(showMenu.includes('href="#sourceDossierShowWikiSummary">SUMMARY</a>'));
  assert.ok(showMenu.includes('href="#sourceDossierWwamFam">FAM ROLL CALL</a>'));
  assert.ok(showMenu.includes('href="#sourceDossierShowWikiLane-up-in-ya-2">UP IN YA</a>'));
  assert.ok(
    showMenu.includes(
      'href="#sourceDossierShowWikiLane-straight-to-steves-asshole-3">STEVE&#39;S ASSHOLE</a>',
    ),
  );
  assert.ok(showMenu.includes('href="#sourceDossierAsk">ASK THIS SHOW</a>'));
  assert.ok(showMenu.includes('href="#sourceDossierInside">MORE</a>'));
  assert.doesNotMatch(showMenu, /EMPTY PROTOTYPE/);
  assert.doesNotMatch(showMenu, /sourceDossierShowWikiLane-empty-prototype-5/);
  assert.doesNotMatch(mount.innerHTML, /class="source-dossier-wiki-local-nav"/);

  const sourceBrief = makeDossier({ metadataOnly: true, receiptCount: 0 });
  const briefSetup = setup(sourceBrief);
  briefSetup.ui.render("SOURCE00001");
  const briefNavMatch = briefSetup.mount.innerHTML.match(
    /<nav class="source-dossier-explore"[\s\S]*?<\/nav>/,
  );
  assert.ok(briefNavMatch);
  const briefNav = briefNavMatch[0];
  assert.equal((briefNav.match(/<a /g) ?? []).length, 4);
  assert.ok(briefNav.includes('href="#sourceDossierShowWikiSummary">SOURCE BRIEF</a>'));
  assert.ok(briefNav.includes('href="#sourceDossierWwamFam">FAM ROLL CALL</a>'));
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
  assert.match(cssSource, /\.source-dossier-feldman-case-file\s*\{/);
  assert.match(cssSource, /\.source-dossier-feldman-recap-toggle\s*\{/);
  assert.match(cssSource, /\.source-dossier-feldman-story\s*\{/);
  assert.match(cssSource, /\.source-dossier-feldman-best\s*\{/);
  assert.match(
    cssSource,
    /\.source-dossier-feldman-best h6 small\s*\{[^}]*display:\s*block[^}]*color:\s*var\(--dossier-lime/s,
  );
  assert.match(
    cssSource,
    /\.source-dossier-feldman-story-reel\s*\{[^}]*grid-template-columns:\s*86px minmax\(0,\s*1fr\) auto/s,
  );
  assert.match(
    cssSource,
    /\.source-dossier-feldman-story-remainder\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s,
  );
  assert.match(
    cssSource,
    /\[data-feldman-view="highlights"\] \.source-dossier-feldman-quick-take > p\s*\{[^}]*-webkit-line-clamp:\s*5/s,
  );
  assert.match(
    cssSource,
    /\.source-dossier-hero-copy > div > \.source-dossier-recap-cta\s*\{[^}]*min-height:\s*44px/s,
  );
  assert.match(
    cssSource,
    /\[data-feldman-recap-expanded="false"\] \.source-dossier-feldman-quick-take > p/,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier-feldman-topic-rail > div\s*\{[^}]*grid-template-columns:\s*1fr/s,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier \.source-dossier-feldman-topic-rail button\s*\{[^}]*display:\s*grid/s,
  );
  assert.match(
    cssSource,
    /\.source-dossier-feldman-topic-rail button b\s*\{[^}]*overflow-wrap:\s*normal[^}]*word-break:\s*normal/s,
  );
  assert.doesNotMatch(
    cssSource,
    /\[data-feldman-recap-expanded="false"\] \.source-dossier-feldman-damage (?:p|blockquote)[^{]*\{[^}]*display:\s*none/s,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier-feldman-facts\s*\{[^}]*grid-template-columns:\s*repeat\(2/s,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*460px\)[\s\S]*\.source-dossier-feldman-story-reel\s*\{[^}]*grid-template-columns:\s*1fr[^}]*"meta"[^}]*"copy"[^}]*"action"/s,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*380px\)[\s\S]*\.source-dossier-feldman-facts\s*\{[^}]*grid-template-columns:\s*1fr/s,
  );
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
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier-explore > div\s*\{[^}]*display:\s*flex[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/s,
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
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier > \.source-dossier-explore\s*\{[^}]*position:\s*sticky\s*!important[^}]*max-height:\s*60px[^}]*overflow:\s*hidden/s,
  );
  assert.doesNotMatch(cssSource, /@import/i);
});
test("390px full Show Wiki controls retain thumb-safe tap targets without overflow", () => {
  const contract = cssSource.slice(cssSource.indexOf(
    "/* Mobile full-file tap contract",
  ));
  const editorialWayfinder = editorialCssSource.slice(
    editorialCssSource.indexOf(
      "Keep the Show Wiki's phone wayfinder on one usable row",
    ),
  );
  const phoneOverflow = cssSource.slice(
    cssSource.indexOf("Final phone overflow contract"),
  );
  assert.ok(contract.length > 0);
  assert.ok(editorialWayfinder.length > 0);
  assert.ok(phoneOverflow.length > 0);
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
  assert.match(
    editorialWayfinder,
    /\.source-dossier > \.source-dossier-explore\s*\{[^}]*max-height:\s*60px[^}]*padding-right:\s*72px\s*!important[^}]*overflow:\s*hidden/s,
  );
  assert.match(
    editorialWayfinder,
    /\.source-dossier-explore > div\s*\{[^}]*min-height:\s*44px[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto[^}]*overflow-y:\s*hidden/s,
  );
  assert.match(
    editorialWayfinder,
    /\.source-dossier-explore > div > \.wwam-dossier-primary-link\s*\{[^}]*flex:\s*0 0 auto[^}]*width:\s*auto[^}]*min-height:\s*44px[^}]*white-space:\s*nowrap/s,
  );
  assert.match(
    editorialWayfinder,
    /\.source-dossier > \.source-dossier-explore::after\s*\{[^}]*content:\s*"SWIPE \\2192"[^}]*pointer-events:\s*none/s,
  );
  assert.match(
    cssSource,
    /\.source-dossier-feldman-recap\.is-held > footer a\s*\{[^}]*min-height:\s*44px/s,
  );
  assert.match(
    cssSource,
    /@media \(max-width:\s*600px\)[\s\S]*\.source-dossier-feldman-case-file small\s*\{[^}]*font-size:\s*8px/s,
  );
  assert.match(
    phoneOverflow,
    /\.source-dossier\s*\{[^}]*overflow-x:\s*clip[^}]*overflow-y:\s*visible/s,
  );
  assert.ok(
    cssSource.indexOf("Final phone overflow contract") >
      cssSource.lastIndexOf("overflow: visible;"),
    "the final 390px rule must win after the broad editorial overflow reset",
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
  assert.match(wiki, /21 TIMESTAMPS/);
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
