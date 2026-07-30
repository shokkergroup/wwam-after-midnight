import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load(files = []) {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  [...files, "episode-format-contracts.js"].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

function restrictiveRights(overrides = {}) {
  return {
    mode: "standard-caption-candidates",
    restrictedToTopicNavigation: false,
    publicExcerptWordLimit: 16,
    speakerClaimsAllowed: false,
    performerClaimsAllowed: false,
    originClaimsAllowed: false,
    visualClaimsAllowed: false,
    visualResultClaimsAllowed: false,
    promotionAllowed: false,
    ...overrides,
  };
}

function source(title, rawContentMode = "livestream", rightsPolicy = null) {
  return {
    id: `fixture-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title,
    duration: 7200,
    url: "https://www.youtube.com/watch?v=fixture",
    rawContentMode,
    rightsPolicy: rightsPolicy || restrictiveRights(),
  };
}

test("registry publishes a complete evidence contract for every canonical format", () => {
  const registry = load().WWAMEpisodeFormatContracts;
  const requiredIds = [
    "mount-rushmore",
    "q-and-a",
    "movie-commentary",
    "movie-watchalong",
    "movie-watch-party",
    "scary-video-watch-party",
    "trailer-reaction",
    "trailer-breakdown",
    "mixed-news-trailer",
    "spoiler-review",
    "episode-recap",
    "movie-news",
    "visual-ranking",
    "spoken-ranking",
    "script-reading",
    "script-review",
    "generated-script-bit",
    "generic-livestream",
  ];

  assert.match(registry.VERSION, /^\d+\.\d+\.\d+$/);
  assert.deepEqual(
    plain(registry.CONTRACTS.map((contract) => contract.id)),
    requiredIds,
  );
  registry.CONTRACTS.forEach((contract) => {
    assert.ok(contract.allowedPublicClaims.length >= 3, contract.id);
    assert.ok(contract.requiredTypedFacts.length >= 5, contract.id);
    assert.ok(contract.prohibitedInferences.length >= 7, contract.id);
    assert.ok(contract.ui.eyebrow, contract.id);
    assert.ok(contract.ui.badge, contract.id);
    assert.ok(contract.ui.primarySection, contract.id);
    assert.ok(contract.ui.navigationNoun, contract.id);
    assert.ok(contract.ui.playCta, contract.id);
    assert.ok(contract.ui.evidenceNotice, contract.id);
  });
  assert.equal(Object.isFrozen(registry.CONTRACTS), true);
  assert.equal(Object.isFrozen(registry.CONTRACTS[0].ui), true);
});

test("classification preserves rawContentMode while deriving runtime format and subtype", () => {
  const registry = load().WWAMEpisodeFormatContracts;
  const fixtures = [
    ["Who's in your Mafia Film Mount Rushmore? LIVE!", "livestream", "mount-rushmore", "ranking", "mount-rushmore"],
    ["HALLOWEEN Movie Franchise Q and A Live!", "franchise-q-and-a", "q-and-a", "audience-q-and-a", "franchise-q-and-a"],
    ["WWAM Live Q+A!", "q-and-a", "q-and-a", "audience-q-and-a", "general-q-and-a"],
    ["WWAM Live Q&A!", "q-and-a", "q-and-a", "audience-q-and-a", "general-q-and-a"],
    ["BRIDE OF CHUCKY LIVE COMMENTARY!", "movie-commentary", "movie-commentary", "movie-companion", "commentary"],
    ["Halloween Watchalong Live!", "livestream", "movie-watchalong", "movie-companion", "watchalong"],
    ["We Watched A Movie LIVE! Halloween 4 Watch Party", "watch-party", "movie-watch-party", "movie-companion", "watch-party"],
    ["Let's Watch Scary Videos Together! Live!", "source-video-watch-party", "scary-video-watch-party", "watch-party", "scary-video-watch-party"],
    ["SUPERMAN Trailer Reaction LIVE", "trailer-reaction", "trailer-reaction", "trailer-coverage", "reaction"],
    ["SCREAM 7 Teaser Trailer Breakdown LIVE", "trailer-breakdown", "trailer-breakdown", "trailer-coverage", "breakdown"],
    ["Movie News + Trailers & More!", "movie-news", "mixed-news-trailer", "mixed-news-trailer", "news-plus-trailer"],
    ["SCREAM 7 Spoiler Review Party!", "spoiler-review", "spoiler-review", "movie-review", "spoiler-party"],
    ["IT: Welcome to Derry Episode 1 Recap LIVE!", "livestream", "episode-recap", "movie-review", "episode-recap"],
    ["We Watched A Movie Live! Movie News and More", "movie-news", "movie-news", "movie-news", "news-roundup"],
    ["Horror Posters Tier List LIVE!", "visual-ranking", "visual-ranking", "ranking", "tier-list"],
    ["Marvel VS DC Movies Bracket Tournament!", "ranking-show", "visual-ranking", "ranking", "bracket"],
    ["Top 10 Horror Movies Ranked LIVE!", "ranking-show", "spoken-ranking", "ranking", "countdown"],
    ["Rob Zombie's HALLOWEEN Script Reading LIVE!", "script-reading", "script-reading", "script", "script-reading"],
    ["Justice League Script Recap LIVE!", "livestream", "script-review", "script", "script-review"],
    ["ChatGPT Wrote a Halloween Script and We Read It LIVE!", "livestream", "generated-script-bit", "script", "generated-script-bit"],
    ["WWAM VIDEO LIVESTREAM!!!!!!", "livestream", "generic-livestream", "livestream", "generic-livestream"],
  ];

  fixtures.forEach(([title, raw, contractId, runtimeFormat, subtype]) => {
    const classified = registry.classify(source(title, raw));
    assert.equal(classified.rawContentMode, raw, title);
    assert.equal(classified.contractId, contractId, title);
    assert.equal(classified.runtimeFormat.id, runtimeFormat, title);
    assert.equal(classified.subtype.id, subtype, title);
    assert.ok(classified.allowedPublicClaims.length, title);
    assert.ok(classified.requiredTypedFacts.length, title);
    assert.ok(classified.prohibitedInferences.length, title);
    assert.ok(classified.ui.evidenceNotice, title);
  });

  const exactRaw = "  Legacy/Internal Mode v7  ";
  assert.equal(
    registry.classify(source("Plain Livestream", exactRaw)).rawContentMode,
    exactRaw,
  );
});

test("rights composition is monotonic and adds format-specific firewalls", () => {
  const registry = load().WWAMEpisodeFormatContracts;
  const input = restrictiveRights({
    mode: "film-audio-boundary-unverified",
    restrictedToTopicNavigation: true,
    publicExcerptWordLimit: 9,
    speakerClaimsAllowed: false,
    performerClaimsAllowed: false,
    originClaimsAllowed: false,
    visualClaimsAllowed: false,
    visualResultClaimsAllowed: false,
    promotionAllowed: false,
  });
  const classified = registry.classify(
    source("HALLOWEEN LIVE COMMENTARY!", "movie-commentary", input),
  );

  assert.deepEqual(
    plain(registry.rightsRegressions(input, classified.rightsPolicy)),
    [],
  );
  assert.equal(classified.rightsPolicy.mode, input.mode);
  assert.equal(classified.rightsPolicy.restrictedToTopicNavigation, true);
  assert.equal(classified.rightsPolicy.publicExcerptWordLimit, 0);
  [
    "speakerClaimsAllowed",
    "performerClaimsAllowed",
    "originClaimsAllowed",
    "visualClaimsAllowed",
    "visualResultClaimsAllowed",
    "promotionAllowed",
  ].forEach((field) => {
    assert.equal(classified.rightsPolicy[field], false, field);
  });
  assert.ok(
    classified.effectiveAllowedPublicClaims.length <
      classified.allowedPublicClaims.length,
  );

  const deliberateRegression = {
    ...classified.rightsPolicy,
    speakerClaimsAllowed: true,
    restrictedToTopicNavigation: false,
    publicExcerptWordLimit: 20,
  };
  assert.deepEqual(
    plain(registry.rightsRegressions(input, deliberateRegression).sort()),
    [
      "publicExcerptWordLimit:increased",
      "restrictedToTopicNavigation:true-became-false",
      "speakerClaimsAllowed:false-became-allowed",
    ],
  );
});

function canonical510(window) {
  const byId = new Map();
  window.WWAM_ARCHIVE_ATLAS.records.forEach((record) => {
    byId.set(record.id, { ...plain(record), sourceType: "livestream" });
  });
  window.WWAM_CATALOG.forEach((record) => {
    const current = byId.get(record.id) || {};
    byId.set(record.id, {
      ...current,
      ...plain(record),
      sourceType: "commentary",
    });
  });

  const overlayById = new Map();
  [
    window.WWAM_ARCHIVE_DEEP,
    window.WWAM_ARCHIVE_DEEP_BATCH2,
    window.WWAM_ARCHIVE_DEEP_BATCH3,
    window.WWAM_ARCHIVE_DEEP_BATCH4,
    window.WWAM_YEAR_CANON_2025_2026,
    window.WWAM_ARCHIVE_RECOVERY_BATCH1,
    window.WWAM_ARCHIVE_RECOVERY_BATCH2,
    window.WWAM_ARCHIVE_COMPLETION,
  ].filter(Boolean).forEach((payload) => {
    (payload.streams || []).forEach((stream) => {
      overlayById.set(stream.id, plain(stream));
    });
  });

  return [...byId.values()].map((record) => {
    const overlay = overlayById.get(record.id) || {};
    const commentary = record.sourceType === "commentary";
    return {
      id: record.id,
      title: record.title,
      displayTitle: record.film || record.title,
      duration: record.duration,
      url: record.url,
      rawContentMode:
        overlay.contentMode ||
        (commentary ? "movie-commentary" : "livestream"),
      rightsPolicy:
        overlay.rightsPolicy ||
        restrictiveRights({
          mode: commentary
            ? "film-audio-boundary-unverified"
            : "source-metadata-only",
          restrictedToTopicNavigation: commentary,
        }),
    };
  });
}

test("drift report classifies the exact 510-source canon without relaxing one right", () => {
  const window = load([
    "catalog.js",
    "archive-atlas-data.js",
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "year-canon-2025-2026.js",
    "archive-recovery-batch1.js",
    "archive-recovery-batch2.js",
    "archive-completion.js",
  ]);
  const sources = canonical510(window);
  const registry = window.WWAMEpisodeFormatContracts;
  const report = registry.driftReport(sources);

  assert.equal(sources.length, 510);
  assert.equal(new Set(sources.map((item) => item.id)).size, 510);
  assert.equal(report.schema, registry.DRIFT_SCHEMA);
  assert.equal(report.total, 510);
  assert.equal(report.classified, 510);
  assert.equal(report.uniqueSourceIds, 510);
  assert.equal(report.missingRawContentMode, 0);
  assert.deepEqual(plain(report.duplicateSourceIds), []);
  assert.deepEqual(plain(report.rightsRegressions), []);
  assert.equal(report.restrictiveRightsPreserved, true);
  assert.equal(
    Object.values(report.byRuntimeFormat).reduce((sum, count) => sum + count, 0),
    510,
  );
  assert.equal(
    Object.values(report.byContract).reduce((sum, count) => sum + count, 0),
    510,
  );
  assert.ok(report.byRuntimeFormat.livestream > 0);
  assert.ok(report.byRuntimeFormat["movie-companion"] > 0);
  assert.ok(report.byRuntimeFormat.ranking > 0);
  assert.ok(report.byRuntimeFormat["movie-news"] > 0);
  assert.ok(report.byRuntimeFormat.script > 0);
  assert.ok(report.byRuntimeFormat["trailer-coverage"] > 0);

  report.classifications.forEach((classification) => {
    const original = sources.find(
      (candidate) => candidate.id === classification.sourceId,
    );
    assert.equal(
      classification.rawContentMode,
      original.rawContentMode,
      classification.sourceId,
    );
    assert.deepEqual(
      plain(registry.rightsRegressions(
        original.rightsPolicy,
        classification.rightsPolicy,
      )),
      [],
      classification.sourceId,
    );
    assert.ok(classification.requiredTypedFacts.length >= 5);
    assert.ok(classification.prohibitedInferences.length >= 7);
    assert.ok(classification.ui.playCta);
  });
});
