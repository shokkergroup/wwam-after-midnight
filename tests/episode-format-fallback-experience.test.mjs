import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DEMO = path.join(ROOT, "public", "demo");
const RUNTIME_FILES = [
  "catalog.js",
  "deep-distill.js",
  "episode-guides.js",
  "episode-guide-v2-reviewed-release.js",
  "episode-guide-v2-newest-five-release.js",
  "episode-guide-v2-reviewed-merge.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "character-lore.js",
  "wwam-channel-dna.js",
  "showcase-engine.js",
  "creator-studio-engine.js",
  "archive-atlas-data.js",
  "archive-deep-distill.js",
  "archive-deep-batch2.js",
  "archive-deep-batch3.js",
  "archive-deep-batch4.js",
  "archive-deep-engine.js",
  "archive-deep-portfolio.js",
  "year-canon-2025-2026.js",
  "archive-recovery-batch1.js",
  "archive-recovery-batch2.js",
  "archive-completion.js",
  "title-topic-overrides.js",
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "episode-format-contracts.js",
  "wwam-source-dossier-adapter.js",
  "source-dossier-engine.js",
  "episode-format-fallback-experience.js",
];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function compileCanonicalRuntime() {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  for (const file of RUNTIME_FILES) {
    const absolute = path.join(DEMO, file);
    assert.equal(fs.existsSync(absolute), true, file);
    vm.runInContext(fs.readFileSync(absolute, "utf8"), sandbox, {
      filename: file,
    });
  }
  const runtime = sandbox.window;
  runtime.WWAM_EPISODE_GUIDES =
    runtime.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE.mergeOrdered(
      runtime.WWAM_EPISODE_GUIDES,
      [
        runtime.WWAM_EPISODE_GUIDE_V2_REVIEWED_RELEASE,
        runtime.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_RELEASE,
      ],
    );
  const showcase = runtime.WWAMShowcaseEngine.create({
    catalog: runtime.WWAM_CATALOG,
    deep: runtime.WWAM_DEEP_DISTILL,
    live: runtime.WWAM_LIVESTREAMS,
    popular: runtime.WWAM_POPULAR_LIVE,
    characters: runtime.WWAM_CHARACTER_LORE,
    titleTopicOverrides: runtime.WWAM_TITLE_TOPIC_OVERRIDES,
    dna: runtime.WWAM_CHANNEL_DNA,
  });
  const clipLab = runtime.WWAMCreatorClipLab.create({ showcase });
  const portfolio = runtime.WWAMArchiveDeepPortfolio.create(
    [
      runtime.WWAM_ARCHIVE_DEEP,
      runtime.WWAM_ARCHIVE_DEEP_BATCH2,
      runtime.WWAM_ARCHIVE_DEEP_BATCH3,
      runtime.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    runtime.WWAMArchiveDeepEngine,
  );
  const base = portfolio.getSearchPayload();
  const completion = runtime.WWAM_ARCHIVE_COMPLETION;
  const archiveSearch = {
    ...base,
    streams: base.streams.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.streams,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.streams,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.streams,
      completion.streams,
    ),
    topicIndex: base.topicIndex.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.topicIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.topicIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.topicIndex,
      completion.topicIndex,
    ),
    characterIndex: base.characterIndex.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.characterIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.characterIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.characterIndex,
      completion.characterIndex,
    ),
  };
  const adapterPayload = runtime.WWAMSourceDossierAdapter.build({
    atlas: runtime.WWAM_ARCHIVE_ATLAS,
    catalog: runtime.WWAM_CATALOG,
    deep: runtime.WWAM_DEEP_DISTILL,
    episodeGuides: runtime.WWAM_EPISODE_GUIDES,
    live: runtime.WWAM_LIVESTREAMS,
    popular: runtime.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: {
      getSearchPayload() {
        return archiveSearch;
      },
    },
    showcase,
    clipLab,
    characters: runtime.WWAM_CHARACTER_LORE,
    dna: runtime.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:format-fallback-test",
    },
  });
  const dossierEngine = runtime.ShokkerSourceDossier.create(adapterPayload);
  const sources = adapterPayload.sources.map(
    (source) => dossierEngine.build(source.id).source,
  );
  return {
    runtime,
    adapterPayload,
    dossierEngine,
    sources,
    api: runtime.WWAMEpisodeFormatFallbackExperience,
  };
}

function countBy(values, read) {
  return values.reduce((counts, value) => {
    const key = read(value);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function recursiveKeys(value, keys = []) {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    value.forEach((item) => recursiveKeys(item, keys));
    return keys;
  }
  for (const [key, nested] of Object.entries(value)) {
    keys.push(key);
    recursiveKeys(nested, keys);
  }
  return keys;
}

function evidenceLane(source, origin) {
  if (origin === "topic-map") {
    return source.showWiki.episodeRecap.topicMap;
  }
  if (origin === "highlight-runway") {
    return source.showWiki.episodeRecap.highlightRunway;
  }
  if (origin === "recap-section") {
    return source.showWiki.episodeRecap.sections;
  }
  return source.showWiki.episodeGuide?.cuts || [];
}

function evidenceReference(item) {
  return item.receiptKey || item.id;
}

const canonical = compileCanonicalRuntime();
const { runtime, sources, api } = canonical;
const readySources = sources.filter(
  (source) => source.showWiki.episodeRecap.state === "ready",
);
const heldSources = sources.filter(
  (source) => source.showWiki.episodeRecap.state === "held",
);
const pack = plain(api.buildAll(sources));
const audit = plain(api.audit(sources));

test("attaches a standalone normalized-source fallback presenter", () => {
  assert.equal(
    runtime.WWAM_EPISODE_FORMAT_FALLBACK_EXPERIENCE,
    runtime.WWAMEpisodeFormatFallbackExperience,
  );
  assert.equal(api.VERSION, "1.2.1");
  assert.equal(
    api.schema,
    "shokker-lore/episode-format-fallback-experience/v1",
  );
  assert.equal(
    api.auditSchema,
    "shokker-lore/episode-format-fallback-experience-audit/v1",
  );
  assert.deepEqual(Object.keys(api), [
    "VERSION",
    "schema",
    "auditSchema",
    "build",
    "buildAll",
    "audit",
    "formatTime",
  ]);
});

test("compiles the canonical 510-source runtime into 509 views and one held null", () => {
  assert.equal(sources.length, 510);
  assert.equal(readySources.length, 509);
  assert.equal(heldSources.length, 1);
  assert.equal(heldSources[0].id, "AzrcgoyE7C4");
  assert.equal(api.build(heldSources[0]), null);

  assert.equal(pack.totalSources, 510);
  assert.equal(pack.views, 509);
  assert.equal(pack.held, 1);
  assert.deepEqual(pack.heldSourceIds, ["AzrcgoyE7C4"]);
  assert.equal(pack.experiences.length, 509);
  assert.deepEqual(pack.modes, {
    "news-wire": 112,
    "ranking-board": 125,
    "livestream-wire": 122,
    "review-desk": 53,
    "trailer-desk": 24,
    "script-spine": 4,
    "scary-party": 4,
    "movie-companion": 49,
    "qa-desk": 16,
  });
});

test("covers every canonical runtime format with nine honest visitor views", () => {
  const byRuntime = countBy(
    pack.experiences,
    (view) => view.runtimeFormat.id,
  );
  assert.deepEqual(byRuntime, {
    "movie-news": 112,
    ranking: 125,
    livestream: 122,
    "movie-review": 53,
    "mixed-news-trailer": 8,
    "trailer-coverage": 16,
    script: 4,
    "watch-party": 4,
    "movie-companion": 49,
    "audience-q-and-a": 16,
  });
  assert.deepEqual(
    [...new Set(pack.experiences.map((view) => view.mode))].sort(),
    [
      "livestream-wire",
      "movie-companion",
      "news-wire",
      "qa-desk",
      "ranking-board",
      "review-desk",
      "scary-party",
      "script-spine",
      "trailer-desk",
    ],
  );

  const representativeByRuntime = new Map();
  pack.experiences.forEach((view) => {
    if (!representativeByRuntime.has(view.runtimeFormat.id)) {
      representativeByRuntime.set(view.runtimeFormat.id, view);
    }
  });
  assert.equal(representativeByRuntime.size, 10);
  assert.equal(
    new Set(
      [...representativeByRuntime.values()].map((view) => view.title),
    ).size,
    10,
  );
  for (const view of representativeByRuntime.values()) {
    assert.equal(view.claimLevel, "navigation-only", view.sourceId);
    assert.equal(view.fallback, true, view.sourceId);
    assert.match(view.boundary, /^These stops do not /, view.sourceId);
    assert.match(view.evidenceNotice, /\.$/, view.sourceId);
    assert.equal(view.description, view.deck, view.sourceId);
    assert.equal(view.boundary, view.boundaryCopy, view.sourceId);
  }
  const episodeRecapView = pack.experiences.find(
    (view) => view.formatContractId === "episode-recap",
  );
  assert.ok(episodeRecapView);
  assert.equal(episodeRecapView.mode, "review-desk");
  assert.equal(episodeRecapView.title, "THE EPISODE AFTERMATH");
  assert.equal(
    episodeRecapView.evidenceNotice,
    "A RECAP STOP IS NOT A VERIFIED PLOT FACT.",
  );
});

test("derives every card only from the owning recap and guide coordinates", () => {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  for (const view of pack.experiences) {
    const source = sourceById.get(view.sourceId);
    assert.ok(source, view.sourceId);
    assert.deepEqual(
      view.items.map((item) => item.at),
      view.items.map((item) => item.at).slice().sort((left, right) => left - right),
      `${view.sourceId} visitor stops must flow chronologically`,
    );
    const expectedCount =
      source.showWiki.episodeRecap.topicMap.length +
      source.showWiki.episodeRecap.highlightRunway.length +
      source.showWiki.episodeRecap.sections.length +
      (source.showWiki.episodeGuide?.cuts || []).length;
    assert.equal(view.itemCount, expectedCount, view.sourceId);
    assert.equal(view.items.length, expectedCount, view.sourceId);
    assert.equal(
      view.lanes.topicDoors.length,
      source.showWiki.episodeRecap.topicMap.length,
      view.sourceId,
    );
    assert.equal(
      view.lanes.highlightMarkers.length,
      source.showWiki.episodeRecap.highlightRunway.length,
      view.sourceId,
    );
    assert.equal(
      view.lanes.recapSections.length,
      source.showWiki.episodeRecap.sections.length,
      view.sourceId,
    );
    assert.equal(
      view.lanes.guideCuts.length,
      (source.showWiki.episodeGuide?.cuts || []).length,
      view.sourceId,
    );

    for (const item of view.items) {
      const sourceLane = evidenceLane(source, item.origin);
      const evidence = sourceLane[item.evidenceIndex];
      assert.ok(evidence, item.id);
      assert.equal(
        item.evidenceRef,
        evidenceReference(evidence) ||
          item.origin + "-" + String(item.evidenceIndex + 1),
        item.id,
      );
      assert.equal(item.sourceId, source.id, item.id);
      assert.equal(item.at, evidence.at, item.id);
      assert.equal(item.end, evidence.end, item.id);
      assert.equal(item.playback.sourceId, source.id, item.id);
      assert.equal(item.playback.at, evidence.at, item.id);
      assert.equal(item.playback.end, evidence.end, item.id);
      assert.equal(
        item.playback.durationSeconds,
        evidence.end - evidence.at,
        item.id,
      );
      assert.match(
        item.playback.url,
        new RegExp(
          "^https://www\\.youtube\\.com/watch\\?v=" +
            source.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
            "&t=\\d+s$",
        ),
        item.id,
      );
    }
  }
});

test("keeps every visitor-facing format introduction human and channel-native", () => {
  for (const view of pack.experiences) {
    const visibleIntroduction = [
      view.navLabel,
      view.eyebrow,
      view.title,
      view.deck,
      view.boundary,
      view.evidenceNotice,
      view.description,
    ].join(" ");
    assert.doesNotMatch(
      visibleIntroduction,
      /\b(?:source-local|registered subjects?|machine-candidate|quarantined|topic-rebuild|runtime adapter)\b/i,
      view.sourceId,
    );
  }
});

test("marks every topic-map card as topic-only without promoting other markers", () => {
  for (const view of pack.experiences) {
    assert.ok(view.lanes.topicDoors.length >= 4, view.sourceId);
    for (const item of view.items) {
      if (item.origin === "topic-map") {
        assert.equal(item.topicOnly, true, item.id);
        assert.equal(item.evidenceStatus, "topic-only-navigation", item.id);
        assert.match(item.summary, /Jump here when/i, item.id);
      } else {
        assert.equal(item.topicOnly, false, item.id);
        assert.match(item.evidenceStatus, /-navigation$/, item.id);
        assert.match(
          item.summary,
          /hear the surrounding show context/i,
          item.id,
        );
      }
      assert.equal(item.navigationOnly, true, item.id);
    }
  }
});

test("never emits inferred speaker, placement, pairing, visual, verdict, or reaction fields", () => {
  const keys = recursiveKeys(pack);
  const forbidden = new Set([
    "speaker",
    "speakerId",
    "speakerName",
    "performer",
    "placement",
    "position",
    "ballot",
    "winner",
    "question",
    "answer",
    "questionEvidence",
    "responseEvidence",
    "visual",
    "visualResult",
    "scene",
    "syncPoint",
    "verdict",
    "reaction",
  ]);
  assert.equal(keys.some((key) => forbidden.has(key)), false);
  assert.doesNotMatch(
    JSON.stringify(pack),
    /"creatorApproved":true|"promotionAllowed":true|"rightsCleared":true/i,
  );
});

test("respects the normalized excerpt ceiling without rewriting source text", () => {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  let visible = 0;
  let withheld = 0;
  for (const view of pack.experiences) {
    const source = sourceById.get(view.sourceId);
    const limit = Number(source.rightsPolicy.publicExcerptWordLimit);
    for (const item of view.items) {
      if (item.excerpt == null) {
        if (item.excerptStatus === "withheld-by-source-rights") withheld += 1;
        continue;
      }
      visible += 1;
      assert.equal(
        item.excerpt.split(/\s+/).filter(Boolean).length <= limit,
        true,
        item.id,
      );
      const evidence = evidenceLane(source, item.origin).find(
        (entry) => evidenceReference(entry) === item.evidenceRef,
      );
      assert.equal(item.excerpt, evidence.excerpt, item.id);
      assert.equal(item.excerptStatus, "exact-source-local-excerpt", item.id);
    }
  }
  assert.ok(visible > 0);
  assert.ok(withheld > 0);

  for (const view of pack.experiences.filter(
    (item) => item.runtimeFormat.id === "movie-companion",
  )) {
    const source = sourceById.get(view.sourceId);
    assert.equal(source.rightsPolicy.publicExcerptWordLimit, 0, source.id);
    assert.ok(view.items.every((item) => item.excerpt == null), source.id);
  }
});

test("the corpus audit reports zero cross-source coordinates or topic drift", () => {
  assert.deepEqual(audit, {
    schema: "shokker-lore/episode-format-fallback-experience-audit/v1",
    version: "1.2.1",
    totalSources: 510,
    views: 509,
    held: 1,
    heldSourceIds: ["AzrcgoyE7C4"],
    modes: pack.modes,
    items: pack.experiences.reduce(
      (total, view) => total + view.itemCount,
      0,
    ),
    crossSourceCoordinates: [],
    topicEvidenceMismatches: [],
    pass: true,
  });
});

test("fails closed on a foreign coordinate or unsupported normalized format", () => {
  const foreign = plain(readySources[0]);
  foreign.showWiki.episodeRecap.topicMap[0].sourceId = readySources[1].id;
  assert.throws(
    () => api.build(foreign),
    /cross-source topic-map coordinate/i,
  );

  const unknown = plain(readySources[0]);
  unknown.runtimeFormat.id = "unknown-future-format";
  assert.throws(
    () => api.build(unknown),
    /Unsupported normalized runtime format/,
  );
  assert.throws(
    () => api.build({}),
    /normalized source id and title/,
  );
  assert.throws(
    () => api.buildAll({}),
    /collection must be an array/,
  );
});

test("returns deterministic frozen views from the same normalized source", () => {
  const source = readySources.find(
    (item) => item.runtimeFormat.id === "movie-review",
  );
  const first = api.build(source);
  const second = api.build(source);
  assert.deepEqual(plain(first), plain(second));
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.items), true);
  assert.equal(Object.isFrozen(first.items[0].playback), true);
  assert.throws(
    () => {
      first.items.push({});
    },
    /object is not extensible/i,
  );
});
