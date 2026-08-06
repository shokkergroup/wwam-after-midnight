import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function firstClockSeconds(value) {
  const match = String(value ?? "").match(/\b(\d{1,3}):([0-5]\d)(?::([0-5]\d))?\b/);
  if (!match) return null;
  return (match[3] === undefined ? Number(match[1]) * 60 + Number(match[2]) :
    Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]));
}

function runtime(files) {
  const window = {};
  const sandbox = { window, globalThis: window };
  window.window = window;
  vm.createContext(sandbox);
  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return window;
}

function recapMap(sourceId, duration) {
  return {
    schema: "shokker-episode-recap/v1",
    evidenceState: "ready",
    sourceId,
    sourceFingerprint: `fnv1a32:${sourceId}`,
    semanticFingerprint: `fnv1a32:recap-${sourceId}`,
    mode: "receipt-recap",
    coverage: { state: "caption-backed", wordsAudited: 100, receipts: 1 },
    format: {
      id: "livestream",
      label: "LIVESTREAM",
      basis: "source-format-contract",
    },
    metadata: {
      title: "Synthetic source-local recap",
      date: "2025-12-24",
      duration,
      views: 1,
      url: `https://www.youtube.com/watch?v=${sourceId}`,
    },
    topics: [],
    topicMap: [],
    highlightRunway: [],
    sections: [],
    story: [],
    bestMoments: [],
    fanRead: {},
    caseFile: {},
    limitations: [],
  };
}

test("QMY human editorial pack is a complete, bounded public contract", () => {
  const window = runtime(["episode-editorial-packs.js"]);
  const registry = window.WWAM_EPISODE_EDITORIAL_PACKS;
  const pack = registry.sources.QMYgsEfPMg0;

  assert.equal(registry.schema, "shokker-episode-editorial-packs/v1");
  assert.equal(pack.sourceId, "QMYgsEfPMg0");
  assert.equal(pack.reviewState, "full-tape-human-editorial-read");
  assert.equal(pack.evidence.duration, 12_255);
  assert.equal(pack.story.length, 19);
  assert.equal(pack.highlights.length, 25);
  assert.equal(new Set(pack.story.map((beat) => beat.label)).size, 19);
  assert.equal(new Set(pack.highlights.map((moment) => moment.label)).size, 25);

  for (const [kind, entries] of [
    ["story beat", pack.story],
    ["highlight", pack.highlights],
  ]) {
    entries.forEach((entry, index) => {
      assert.ok(entry.label, `${kind} ${index + 1} needs a public label`);
      assert.ok(
        kind === "story beat" ? entry.body : entry.excerpt,
        `${kind} ${index + 1} needs human-readable copy`,
      );
      assert.ok(
        Number.isFinite(entry.at) &&
          Number.isFinite(entry.end) &&
          entry.at >= 0 &&
          entry.end > entry.at &&
          entry.end <= pack.evidence.duration,
        `${kind} ${index + 1} must stay inside the exact upload`,
      );
    });
  }
});

test("every registered human pack keeps fan reads and character performances source-bounded", () => {
  const packFiles = fs
    .readdirSync(demo)
    .filter((file) => /^episode-editorial-packs(?:-recent|-wave\d+)?\.js$/.test(file))
    .sort((left, right) => {
      if (left === "episode-editorial-packs.js") return -1;
      if (right === "episode-editorial-packs.js") return 1;
      return left.localeCompare(right, undefined, { numeric: true });
    });
  const window = runtime(packFiles);
  const packs = Object.values(
    window.WWAM_EPISODE_EDITORIAL_PACKS?.sources ?? {},
  );

  assert.ok(packs.length >= 8, "the current human editorial wave must be registered");
  for (const pack of packs) {
    assert.equal(
      pack.reviewState,
      "full-tape-human-editorial-read",
      `${pack.sourceId} must remain a human full-tape read`,
    );
    for (const [lane, item] of Object.entries(pack.fanRead ?? {})) {
      assert.equal(
        item.playAt,
        item.at,
        `${pack.sourceId} fanRead.${lane} must play its reviewed start`,
      );
      assert.equal(
        item.playEnd,
        item.end,
        `${pack.sourceId} fanRead.${lane} must play its reviewed end`,
      );
      assert.ok(
        item.at >= 0 &&
          item.end > item.at &&
          item.end <= pack.evidence.duration,
        `${pack.sourceId} fanRead.${lane} must stay inside the upload`,
      );
    }
    pack.highlights
      .filter((item) => item.category === "CHARACTER PERFORMANCE")
      .forEach((item, index) => {
        assert.ok(
          Array.isArray(item.characters) && item.characters.length > 0,
          `${pack.sourceId} character highlight ${index + 1} must name who was performed`,
        );
      });
    pack.highlights
      .filter((item) => Array.isArray(item.characters) && item.characters.length)
      .forEach((item, index) => {
        assert.equal(
          item.category,
          "CHARACTER PERFORMANCE",
          `${pack.sourceId} named character highlight ${index + 1} must use the reviewed performance category`,
        );
      });
  }
});

test("episode recap adapter applies a human pack only to its matching source and duration", () => {
  const window = runtime([
    "episode-editorial-packs.js",
    "wwam-episode-recap-adapter.js",
  ]);
  const adapter = window.WWAMEpisodeRecapAdapter;
  const expectedPack = window.WWAM_EPISODE_EDITORIAL_PACKS.sources.QMYgsEfPMg0;

  const exact = adapter.build({
    map: recapMap("QMYgsEfPMg0", expectedPack.evidence.duration),
  });
  assert.equal(exact.editorialState, "full-tape-human-editorial-read");
  assert.equal(exact.caseFile.humanEditorialRead, true);
  assert.equal(exact.story.length, 19);
  assert.equal(exact.highlightRunway.length, 25);
  assert.equal(exact.overview, expectedPack.overview);
  exact.story.forEach((beat) => {
    assert.equal(
      firstClockSeconds(beat.body),
      beat.playAt,
      `${beat.id} must expose its exact source-local play doorway first`,
    );
    const authored = expectedPack.story[beat.ordinal - 1];
    assert.equal(
      beat.editorialBody,
      authored?.body,
      `${beat.id} must retain the exact authored prose beside the playable body`,
    );
    assert.equal(
      firstClockSeconds(beat.displayBody),
      beat.playAt,
      `${beat.id} display copy must keep the playable doorway`,
    );
    assert.equal(
      beat.primarySubject,
      beat.narrative.primarySubject,
      `${beat.id} must keep its visible subject and narrative subject aligned`,
    );
  });
  Object.values(exact.fanRead).forEach((item) => {
    assert.equal(
      firstClockSeconds(item.body),
      item.playAt,
      "human fan reads must expose their exact source-local play doorway first",
    );
  });

  const wrongSource = adapter.build({
    map: recapMap("abcdefghijk", expectedPack.evidence.duration),
  });
  assert.equal(wrongSource.editorialState, "structured-source-summary");
  assert.equal(wrongSource.caseFile.humanEditorialRead, undefined);
  assert.equal(wrongSource.story.length, 0);
  assert.equal(wrongSource.highlightRunway.length, 0);

  const wrongDuration = adapter.build({
    map: recapMap("QMYgsEfPMg0", expectedPack.evidence.duration - 60),
  });
  assert.equal(wrongDuration.editorialState, "structured-source-summary");
  assert.equal(wrongDuration.caseFile.humanEditorialRead, undefined);
  assert.equal(wrongDuration.story.length, 0);
  assert.equal(wrongDuration.highlightRunway.length, 0);
});

test("machine character context stays a reference while reviewed performance stays an appearance", () => {
  const window = runtime(["episode-recap-engine.js"]);
  const sourceId = "abcdefghijk";
  const contextReceipt = {
    key: `${sourceId}:character-context`,
    sourceId,
    at: 120,
    end: 148,
    kind: "character-context",
    evidenceType: "caption-character-context",
    label: "Dr. Loomis",
    entityIds: ["character:dr-loomis"],
    excerpt: "A machine caption window in which the name Loomis appears.",
    publicExcerptAllowed: true,
    signalScore: 80,
    evidenceBasis: "automatic-caption-character-context",
  };
  const performanceReceipt = {
    key: `${sourceId}:reviewed-performance`,
    sourceId,
    at: 420,
    end: 462,
    kind: "character-performance",
    evidenceType: "reviewed-character-performance",
    label: "Dr. Challis",
    entityIds: ["character:dr-challis"],
    excerpt: "A reviewed source window with a confirmed character performance.",
    publicExcerptAllowed: true,
    signalScore: 90,
    evidenceBasis: "human-reviewed-character-performance",
  };
  const map = window.ShokkerEpisodeRecap.build({
    source: {
      id: sourceId,
      title: "Character boundary fixture",
      displayTitle: "Character boundary fixture",
      date: "2026-07-30",
      duration: 900,
      views: 1,
      url: `https://www.youtube.com/watch?v=${sourceId}`,
      coverage: "caption-backed",
      wordsAudited: 100,
    },
    receipts: [contextReceipt, performanceReceipt],
    format: {
      id: "livestream",
      label: "LIVESTREAM",
      basis: "source-format-contract",
    },
    context: {
      lanes: [
        {
          id: "character-references",
          label: "REFERENCES & CALLBACKS",
          receiptKeys: [contextReceipt.key],
        },
        {
          id: "character-bits",
          label: "CHARACTER PERFORMANCES",
          receiptKeys: [performanceReceipt.key],
        },
      ],
    },
  });

  const byKey = new Map(
    plain(map.highlightRunway).map((highlight) => [
      highlight.receiptKey,
      highlight,
    ]),
  );
  assert.equal(
    byKey.get(contextReceipt.key).category,
    "REFERENCE / CALLBACK",
  );
  assert.notEqual(
    byKey.get(contextReceipt.key).category,
    "CHARACTER APPEARANCE",
  );
  assert.equal(
    byKey.get(performanceReceipt.key).category,
    "CHARACTER APPEARANCE",
  );
});

class RenderMount {
  constructor() {
    this.innerHTML = "";
    this.listeners = new Map();
    this.attributes = new Map();
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

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  closest() {
    return null;
  }

  querySelector() {
    return null;
  }
}

function canonicalDossier(recap) {
  const sourceId = "QMYgsEfPMg0";
  const receipt = {
    key: `${sourceId}:legacy-moment`,
    sourceId,
    at: 60,
    end: 90,
    kind: "moment",
    label: "LEGACY LANE MOMENT",
    excerpt: "This exists only to prove the old lane would have rendered.",
    publicExcerptAllowed: true,
    evidenceBasis: "source-local-test",
  };
  return {
    schema: "shokker-source-dossier/v1",
    version: "1.0.0",
    bindings: {
      channelId: "wwam",
      channelLabel: "WWAM",
      channelPackFingerprint: "cp1-test",
      snapshotDate: "2026-07-30",
      archiveFingerprint: "archive-test",
    },
    source: {
      id: sourceId,
      title: "Christmas 2025",
      displayTitle: "Christmas 2025",
      date: "2025-12-24",
      duration: 12_255,
      views: 1,
      thumbnail: `https://i.ytimg.com/vi/${sourceId}/maxresdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${sourceId}`,
      availability: "public-at-snapshot",
      liveStatus: "was-live",
      coverage: "caption-backed",
      authority: "promoted-lane",
      lanes: ["year-canon-2025-2026"],
      sourceType: "livestream",
      wordsAudited: 45_739,
      summary: {
        text: "Legacy machine summary that must not stack under the human recap.",
        basis: "automatic-caption-summary",
      },
      rightsPolicy: { speakerClaimsAllowed: false, rightsCleared: false },
      warnings: [],
      showWiki: {
        label: "SHOW WIKI",
        status: "distilled",
        description: "A source-local episode page.",
        recap: {
          format: "LEGACY FORMAT DESK",
          overview: "Legacy summary.",
          blocks: [{ label: "LEGACY BLOCK", body: "Legacy body." }],
        },
        experience: {
          id: "midnight-cut",
          label: "LEGACY WATCH PATH",
          title: "THE MIDNIGHT CUT",
          routeReceiptKeys: [receipt.key],
          pulseReceiptKeys: [receipt.key],
        },
        episodeGuide: {
          schema: "wwam-episode-guide/v2",
          variant: "ranking",
          overview: "Legacy episode guide.",
          chapters: [
            {
              id: "legacy-chapter",
              at: 60,
              end: 90,
              label: "LEGACY GUIDE CHAPTER",
            },
          ],
          cuts: [
            {
              id: "legacy-cut",
              at: 60,
              end: 90,
              topic: "Legacy episode guide cut",
              category: "LEGACY GUIDE",
            },
          ],
        },
        lanes: [
          {
            id: "best-moments",
            label: "LEGACY BEST MOMENTS LANE",
            description: "Legacy category lane.",
            emptyState: "No legacy moments.",
            receiptKeys: [receipt.key],
          },
        ],
        episodeRecap: recap,
      },
      metrics: {},
      receipts: [receipt],
      entities: [],
      artifacts: [],
      sourceFingerprint: "fnv1a32:qmy-test",
    },
    proof: {
      coverage: "caption-backed",
      authority: "promoted-lane",
      sourceOnly: false,
      captionLimited: false,
      quarantined: false,
      speakerDiarized: false,
      creatorApproved: false,
      rightsCleared: false,
      evidenceBoundary: "Claims stop at this exact source.",
    },
    receiptSummary: {
      total: 1,
      byKind: { moment: 1 },
      byEvidenceType: { "source-local-test": 1 },
    },
    artifactSummary: { total: 0, byKind: {}, byAuthority: {} },
    wake: { total: 0, later: [], earlier: [] },
    chronology: { previous: null, next: null },
    fingerprint: "dossier-qmy-test",
  };
}

function humanEditorialRecap() {
  return {
    schema: "wwam-feldman-recap/v1",
    state: "ready",
    tier: "receipt-recap",
    editorialState: "full-tape-human-editorial-read",
    label: "THE SHOW, WITHOUT THE BULLSHIT",
    badge: "FULL-TAPE EDITORIAL WIKI",
    headline: "CHRISTMAS MOVIES & BATMAN PANIC",
    deck: "A real episode read replaces the machine inventory.",
    overview: "The ranking, the Batman argument and the filthy goodbye.",
    topics: ["Christmas movies", "Batman"],
    topicMap: [],
    sections: [
      {
        id: "editorial-story-01",
        label: "THE ARGUMENT STARTS",
        body: "The Batman argument starts here.",
        at: 1_332,
        end: 1_729,
        playAt: 1_332,
        playEnd: 1_729,
      },
    ],
    story: [
      {
        id: "editorial-story-01",
        label: "THE ARGUMENT STARTS",
        body: "The Batman argument starts here.",
        at: 1_332,
        end: 1_729,
        playAt: 1_332,
        playEnd: 1_729,
      },
    ],
    highlightRunway: [
      {
        receiptKey: "",
        guideCutId: "",
        kind: "human-editorial-highlight",
        category: "WWAM UP IN YA",
        label: "THE NAKED CHIMNEY GOODNIGHT",
        excerpt: "A sincere thank-you is capped by a threat to butt security.",
        at: 12_085,
        end: 12_255,
        playAt: 12_085,
        playEnd: 12_255,
      },
    ],
    bestMoments: [],
    fanRead: {},
    editorialPanels: [],
    caseFile: {
      humanEditorialRead: true,
      editorialHighlightCount: 1,
    },
    approval: {
      actualApproval: false,
      disclosure: "Independent fan archive.",
    },
    semanticFingerprint: "fnv1a32:human-editorial-test",
  };
}

test("public Show Wiki accepts editorial playAt highlights and renders one canonical recap", () => {
  const window = runtime([
    "episode-facts-pilot.js",
    "episode-facts-batch2.js",
    "episode-facts-batch3.js",
    "episode-format-experience.js",
    "episode-guide-v2-topic-rebuild-batch1.js",
    "episode-guide-v2-topic-rebuild-batch2.js",
    "episode-guide-v2-topic-rebuild-batch3.js",
    "episode-guide-v2-topic-rebuild-batch4.js",
    "episode-guide-v2-topic-rebuild-batch5.js",
    "episode-topic-rebuild-experience.js",
    "source-dossier-ui.js",
  ]);
  const recap = humanEditorialRecap();
  const dossier = canonicalDossier(recap);
  const mount = new RenderMount();
  const ui = window.WWAMSourceDossierUI.create({
    engine: {
      build(sourceId) {
        assert.equal(sourceId, dossier.source.id);
        return dossier;
      },
      exportManifest() {
        return {};
      },
    },
    document: {},
    mount,
  });

  ui.render(dossier.source.id, { fullFile: true });
  const html = mount.innerHTML;

  assert.match(html, /THE NAKED CHIMNEY GOODNIGHT/);
  assert.match(
    html,
    /data-source-dossier-action="play-guide-cut" data-guide-at="12085" data-guide-end="12255"/,
  );
  assert.match(html, /PLAY THE GOOD SHIT/);

  assert.doesNotMatch(html, /id="sourceDossierFormatExperience"/);
  assert.doesNotMatch(html, /id="sourceDossierDeepStops"/);
  assert.doesNotMatch(html, /id="sourceDossierFeldmanActs"/);
  assert.doesNotMatch(html, /id="sourceDossierEpisodeGuide"/);
  assert.doesNotMatch(html, /class="source-dossier-wiki-lanes"/);
  assert.doesNotMatch(html, /LEGACY BEST MOMENTS LANE/);
  assert.doesNotMatch(html, /LEGACY GUIDE CHAPTER/);
  assert.doesNotMatch(html, /LEGACY WATCH PATH/);
});
