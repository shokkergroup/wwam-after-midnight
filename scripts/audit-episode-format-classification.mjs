import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DEFAULT_DEMO = path.join(ROOT, "public", "demo");

export const RUNTIME_FILES = Object.freeze([
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
  "episode-editorial-packs.js",
  "episode-editorial-packs-recent.js",
  "episode-editorial-packs-wave2.js",
  "episode-editorial-packs-wave3.js",
  "episode-editorial-packs-wave4.js",
  "episode-editorial-packs-wave5.js",
  "episode-editorial-packs-wave6.js",
  "episode-editorial-packs-wave7.js",
  "episode-editorial-packs-wave8.js",
  "episode-editorial-packs-wave9.js",
  "episode-editorial-packs-wave10.js",
  "episode-editorial-packs-wave11.js",
  "episode-editorial-packs-wave12.js",
  "episode-editorial-packs-wave13.js",
  "episode-editorial-packs-wave14.js",
  "episode-editorial-packs-wave15.js",
  "episode-editorial-packs-wave16.js",
  "episode-editorial-packs-wave17.js",
  "episode-editorial-packs-wave18.js",
  "episode-editorial-packs-wave19.js",
  "episode-editorial-packs-wave20.js",
  "episode-editorial-packs-wave21.js",
  "episode-editorial-packs-wave22.js",
  "episode-editorial-packs-wave23.js",
  "episode-editorial-packs-wave24.js",
  "episode-editorial-packs-wave25.js",
  "episode-editorial-packs-wave26.js",
  "episode-editorial-packs-wave27.js",
  "episode-editorial-packs-wave28.js",
  "episode-editorial-packs-wave29.js",
  "episode-editorial-packs-wave30.js",
  "episode-editorial-packs-wave31.js",
  "episode-editorial-packs-wave32.js",
  "episode-editorial-packs-wave33.js",
  "episode-editorial-packs-wave34.js",
  "episode-editorial-packs-wave35.js",
  "episode-editorial-packs-wave36.js",
  "episode-editorial-packs-wave37.js",
  "episode-editorial-packs-wave38.js",
  "episode-editorial-packs-wave39.js",
  "episode-editorial-packs-wave40.js",
  "episode-editorial-packs-wave41.js",
  "episode-editorial-packs-wave42.js",
  "episode-editorial-packs-wave43.js",
  "episode-editorial-packs-wave44.js",
  "episode-editorial-packs-wave45.js",
  "episode-editorial-packs-wave46.js",
  "episode-editorial-packs-wave47.js",
  "episode-editorial-packs-wave48.js",
  "episode-editorial-packs-wave49.js",
  "episode-editorial-packs-wave50.js",
  "episode-editorial-packs-wave51.js",
  "episode-editorial-packs-wave52.js",
  "episode-editorial-packs-wave53.js",
  "episode-editorial-packs-wave54.js",
  "episode-editorial-packs-wave55.js",
  "episode-editorial-packs-wave56.js",
  "episode-editorial-packs-wave57.js",
  "episode-editorial-packs-wave58.js",
  "episode-editorial-packs-wave59.js",
  "episode-editorial-packs-wave60.js",
  "episode-editorial-packs-wave61.js",
  "episode-editorial-packs-wave62.js",
  "episode-editorial-packs-wave63.js",
  "episode-editorial-packs-wave64.js",
  "episode-editorial-packs-wave65.js",
  "episode-editorial-packs-wave66.js",
  "episode-editorial-packs-wave67.js",
  "episode-editorial-packs-wave68.js",
  "episode-editorial-packs-wave69.js",
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "episode-format-contracts.js",
  "wwam-source-dossier-adapter.js",
  "source-dossier-engine.js",
]);

const REPORT_SCHEMA =
  "shokker-lore/episode-format-classification-quality-audit/v1";

const RECOMMENDATIONS = Object.freeze({
  "episode-recap-contract-mismatch":
    "Prioritize explicit recap/post-show title language ahead of generic review or livestream fallbacks and return the episode-recap contract.",
  "movie-news-classified-generic":
    "Expand the explicit movie-news title rule or move it ahead of the generic livestream fallback.",
  "review-family-mismatch":
    "Route explicit review title language to the movie-review family unless a stronger format signal intentionally owns the title.",
  "commentary-family-mismatch":
    "Route explicit commentary title language to movie-companion/movie-commentary before generic fallbacks.",
  "watchalong-family-mismatch":
    "Route explicit watchalong title language to movie-companion/movie-watchalong before generic fallbacks.",
  "watch-party-family-mismatch":
    "Route explicit watch-party language to the matching movie or source-video watch-party contract.",
  "script-family-mismatch":
    "Route explicit script, screenplay, or table-read title language to the script family before recap/review fallbacks.",
  "q-and-a-family-mismatch":
    "Route explicit Q&A title language to audience-q-and-a before generic news or livestream fallbacks.",
  "ranking-family-mismatch":
    "Route explicit ranking, bracket, tier-list, tournament, countdown, or Mount Rushmore language to the ranking family.",
  "trailer-family-mismatch":
    "Route explicit trailer/teaser/first-look language to trailer coverage, or the mixed news-and-trailer contract when both lanes are declared.",
  "normalized-classification-drift":
    "Rebuild the normalized dossier classification from the current registry so its persisted runtime, subtype, and contract match a fresh classification.",
});

function clean(value) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim();
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function countBy(values, read) {
  return values.reduce((counts, value) => {
    const key = clean(read(value)) || "none";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function exactTitle(source) {
  return clean(source.displayTitle || source.title);
}

function titleSignals(source) {
  const title = exactTitle(source);
  const lower = title.toLowerCase();
  const signals = {
    generatedScript:
      /\b(?:ai|a\.i\.|chatgpt|machine)\b.{0,60}\b(?:generated|written|writes?|wrote)\b.{0,60}\bscript\b|\bgenerated\s+(?:movie\s+)?script\b/i.test(
        lower,
      ),
    script:
      /\bscript\b|\bscreenplay\b|\btable\s+read\b/i.test(lower),
    commentary: /\bcommentary\b/i.test(lower),
    watchalong:
      /\bwatch\s*along\b|\bwatchalong\b/i.test(lower),
    watchParty:
      /\bwatch\s*party\b|\blive\s+watch\b|\bwatching\b.+\btogether\b/i.test(
        lower,
      ),
    watchTogether:
      /\b(?:let'?s\s+)?watch\b.+\btogether\b/i.test(lower),
    scaryVideo: /\bscary\s+videos?\b/i.test(lower),
    recap:
      /\brecap(?:s|ped|ping)?\b|\bpost[- ]show\b/i.test(lower),
    spoilerParty:
      /\bspoiler\b.{0,24}\b(?:party|talk|stream|livestream)\b/i.test(
        lower,
      ),
    mountRushmore: /\bmount\s+rushmore\b/i.test(lower),
    ranking:
      /\brank(?:ed|ing|ings)?\b|\btier\s+lists?\b|\bbracket\b|\btournament\b|\btop\s+\d+\b|\bcountdown\b/i.test(
        lower,
      ),
    trailer:
      /\btrailers?\b|\bteasers?\b|\bfirst\s+look\b/i.test(lower),
    movieNews:
      /\b(?:movie|horror|action)\s+news\b|\bnews\s+(?:live|stream)\b/i.test(
        lower,
      ),
    update: /\bupdates?\b|\bbreaking\b|\brumou?rs?\b/i.test(lower),
    qAndA:
      /\bq\s*(?:and|[+&])\s*a\b/i.test(lower) ||
      /\bquestions?\s*(?:and|[+&])\s*answers?\b/i.test(lower),
    review: /\breview(?:s|ed|ing)?\b/i.test(lower),
  };
  signals.mixedNewsTrailer =
    signals.trailer && (signals.movieNews || signals.update);
  return signals;
}

function expectation(config) {
  return Object.freeze({
    kind: config.kind,
    signal: config.signal,
    expectedRuntimeFormats: Object.freeze(
      config.expectedRuntimeFormats.slice(),
    ),
    expectedContracts: Object.freeze(config.expectedContracts.slice()),
    issue: config.issue,
  });
}

export function titleExpectation(source) {
  const signal = titleSignals(source);

  if (signal.generatedScript || signal.script) {
    return expectation({
      kind: "script",
      signal: signal.generatedScript
        ? "generated-script-title"
        : "script-title",
      expectedRuntimeFormats: ["script"],
      expectedContracts: [
        "generated-script-bit",
        "script-reading",
        "script-review",
      ],
      issue: "script-family-mismatch",
    });
  }
  if (signal.commentary) {
    return expectation({
      kind: "commentary",
      signal: "commentary-title",
      expectedRuntimeFormats: ["movie-companion"],
      expectedContracts: ["movie-commentary"],
      issue: "commentary-family-mismatch",
    });
  }
  if (signal.scaryVideo && (signal.watchParty || signal.watchTogether)) {
    return expectation({
      kind: "scary-video-watch-party",
      signal: "scary-video-watch-title",
      expectedRuntimeFormats: ["watch-party"],
      expectedContracts: ["scary-video-watch-party"],
      issue: "watch-party-family-mismatch",
    });
  }
  if (signal.watchalong || signal.watchTogether) {
    return expectation({
      kind: "watchalong",
      signal: "watchalong-title",
      expectedRuntimeFormats: ["movie-companion"],
      expectedContracts: ["movie-watchalong"],
      issue: "watchalong-family-mismatch",
    });
  }
  if (signal.watchParty) {
    return expectation({
      kind: "movie-watch-party",
      signal: "watch-party-title",
      expectedRuntimeFormats: ["movie-companion"],
      expectedContracts: ["movie-watch-party"],
      issue: "watch-party-family-mismatch",
    });
  }
  if (signal.recap) {
    return expectation({
      kind: "episode-recap",
      signal: "recap-or-post-show-title",
      expectedRuntimeFormats: ["movie-review"],
      expectedContracts: ["episode-recap"],
      issue: "episode-recap-contract-mismatch",
    });
  }
  if (signal.mountRushmore || signal.ranking) {
    return expectation({
      kind: "ranking",
      signal: signal.mountRushmore
        ? "mount-rushmore-title"
        : "ranking-title",
      expectedRuntimeFormats: ["ranking"],
      expectedContracts: signal.mountRushmore
        ? ["mount-rushmore"]
        : ["visual-ranking", "spoken-ranking"],
      issue: "ranking-family-mismatch",
    });
  }
  if (signal.mixedNewsTrailer) {
    return expectation({
      kind: "mixed-news-trailer",
      signal: "movie-news-and-trailer-title",
      expectedRuntimeFormats: ["mixed-news-trailer"],
      expectedContracts: ["mixed-news-trailer"],
      issue: "trailer-family-mismatch",
    });
  }
  if (signal.trailer) {
    return expectation({
      kind: "trailer",
      signal: "trailer-title",
      expectedRuntimeFormats: ["trailer-coverage"],
      expectedContracts: ["trailer-reaction", "trailer-breakdown"],
      issue: "trailer-family-mismatch",
    });
  }
  if (signal.qAndA) {
    return expectation({
      kind: "q-and-a",
      signal: "q-and-a-title",
      expectedRuntimeFormats: ["audience-q-and-a"],
      expectedContracts: ["q-and-a"],
      issue: "q-and-a-family-mismatch",
    });
  }
  if (signal.spoilerParty) {
    return expectation({
      kind: "review",
      signal: "spoiler-party-title",
      expectedRuntimeFormats: ["movie-review"],
      expectedContracts: ["spoiler-review"],
      issue: "review-family-mismatch",
    });
  }
  if (signal.movieNews) {
    return expectation({
      kind: "movie-news",
      signal: "explicit-movie-news-title",
      expectedRuntimeFormats: ["movie-news"],
      expectedContracts: ["movie-news"],
      issue: "movie-news-classified-generic",
    });
  }
  if (signal.review) {
    return expectation({
      kind: "review",
      signal: "review-title",
      expectedRuntimeFormats: ["movie-review"],
      expectedContracts: ["spoiler-review"],
      issue: "review-family-mismatch",
    });
  }
  return null;
}

function loadRuntime(demo) {
  for (const file of RUNTIME_FILES) {
    const absolute = path.join(demo, file);
    if (!fs.existsSync(absolute)) {
      throw new Error(`Format audit runtime file is missing: ${absolute}`);
    }
  }
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  for (const file of RUNTIME_FILES) {
    vm.runInContext(
      fs.readFileSync(path.join(demo, file), "utf8"),
      sandbox,
      { filename: file },
    );
  }
  return sandbox.window;
}

export function compileCanonicalSources(options = {}) {
  const demo = options.demo
    ? path.resolve(options.demo)
    : process.env.WWAM_FORMAT_AUDIT_DEMO_DIR
      ? path.resolve(process.env.WWAM_FORMAT_AUDIT_DEMO_DIR)
      : DEFAULT_DEMO;
  const runtime = loadRuntime(demo);
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
      packFingerprint: "fnv1a32:format-classification-audit",
    },
  });
  const dossierEngine = runtime.ShokkerSourceDossier.create(adapterPayload);
  const sources = adapterPayload.sources.map(
    (source) => dossierEngine.build(source.id).source,
  );
  return { demo, runtime, adapterPayload, dossierEngine, sources };
}

function mismatchFor(source, expected, actual) {
  if (!expected) return null;
  const runtimeMatches = expected.expectedRuntimeFormats.includes(
    actual.runtimeFormat,
  );
  const contractMatches = expected.expectedContracts.includes(
    actual.contractId,
  );
  if (runtimeMatches && contractMatches) return null;
  return {
    sourceId: clean(source.id),
    title: exactTitle(source),
    rawContentMode:
      source.rawContentMode == null ? null : String(source.rawContentMode),
    signal: expected.signal,
    issue: expected.issue,
    expected: {
      runtimeFormats: expected.expectedRuntimeFormats.slice(),
      contracts: expected.expectedContracts.slice(),
    },
    actual: {
      runtimeFormat: actual.runtimeFormat,
      subtype: actual.subtype,
      contractId: actual.contractId,
    },
    recommendation: RECOMMENDATIONS[expected.issue],
  };
}

function classificationDrift(source, classification) {
  const normalized = {
    runtimeFormat: clean(record(source.runtimeFormat).id),
    subtype: clean(record(source.subtype).id),
    contractId: clean(record(source.formatContract).id),
  };
  const fresh = {
    runtimeFormat: clean(record(classification.runtimeFormat).id),
    subtype: clean(record(classification.subtype).id),
    contractId: clean(classification.contractId),
  };
  if (
    normalized.runtimeFormat === fresh.runtimeFormat &&
    normalized.subtype === fresh.subtype &&
    normalized.contractId === fresh.contractId
  ) {
    return null;
  }
  return {
    sourceId: clean(source.id),
    title: exactTitle(source),
    rawContentMode:
      source.rawContentMode == null ? null : String(source.rawContentMode),
    signal: "normalized-classification-persistence",
    issue: "normalized-classification-drift",
    expected: fresh,
    actual: normalized,
    recommendation: RECOMMENDATIONS["normalized-classification-drift"],
  };
}

export function auditClassifications(sources, registry) {
  if (!Array.isArray(sources)) {
    throw new TypeError("Format classification audit requires a source array.");
  }
  if (
    !registry ||
    typeof registry.classify !== "function" ||
    typeof registry.rightsRegressions !== "function" ||
    typeof registry.driftReport !== "function"
  ) {
    throw new TypeError(
      "Format classification audit requires the episode-format registry.",
    );
  }
  const classifications = [];
  const expectations = [];
  const titleMismatches = [];
  const persistenceMismatches = [];
  const rightsRegressions = [];

  for (const source of sources) {
    const classification = registry.classify(source);
    classifications.push(classification);
    const expected = titleExpectation(source);
    if (expected) {
      expectations.push({
        sourceId: clean(source.id),
        kind: expected.kind,
        signal: expected.signal,
      });
    }
    const actual = {
      runtimeFormat: clean(record(classification.runtimeFormat).id),
      subtype: clean(record(classification.subtype).id),
      contractId: clean(classification.contractId),
    };
    const titleMismatch = mismatchFor(source, expected, actual);
    if (titleMismatch) titleMismatches.push(titleMismatch);
    const persistenceMismatch = classificationDrift(
      source,
      classification,
    );
    if (persistenceMismatch) {
      persistenceMismatches.push(persistenceMismatch);
    }
    const rightsFailures = registry.rightsRegressions(
      source.rightsPolicy,
      classification.rightsPolicy,
    );
    if (rightsFailures.length) {
      rightsRegressions.push({
        sourceId: clean(source.id),
        title: exactTitle(source),
        failures: rightsFailures.slice(),
      });
    }
  }

  const registryDrift = registry.driftReport(sources);
  const mismatches = titleMismatches.concat(persistenceMismatches);
  return {
    schema: REPORT_SCHEMA,
    registryVersion: clean(registry.VERSION),
    corpus: {
      total: sources.length,
      ready: sources.filter(
        (source) =>
          clean(record(record(source.showWiki).episodeRecap).state) ===
          "ready",
      ).length,
      held: sources.filter(
        (source) =>
          clean(record(record(source.showWiki).episodeRecap).state) ===
          "held",
      ).length,
    },
    expectedTitleSignals: expectations.length,
    untargetedTitles: sources.length - expectations.length,
    byExpectedKind: countBy(expectations, (item) => item.kind),
    byRuntimeFormat: countBy(
      classifications,
      (item) => record(item.runtimeFormat).id,
    ),
    byContract: countBy(classifications, (item) => item.contractId),
    titleMismatchCount: titleMismatches.length,
    persistenceMismatchCount: persistenceMismatches.length,
    mismatchCount: mismatches.length,
    mismatches,
    rightsRegressionCount: rightsRegressions.length,
    rightsRegressions,
    registryFormatConflicts: registryDrift.formatConflicts.slice(),
    duplicateSourceIds: registryDrift.duplicateSourceIds.slice(),
    pass:
      mismatches.length === 0 &&
      rightsRegressions.length === 0 &&
      registryDrift.formatConflicts.length === 0 &&
      registryDrift.duplicateSourceIds.length === 0,
  };
}

export function renderConciseReport(report) {
  const lines = [
    "WWAM FORMAT CLASSIFICATION QUALITY AUDIT",
    `Sources: ${report.corpus.total} // ready ${report.corpus.ready} // held ${report.corpus.held}`,
    `Registry: ${report.registryVersion}`,
    `Title signals checked: ${report.expectedTitleSignals} // untargeted ${report.untargetedTitles}`,
    `Mismatches: ${report.mismatchCount} // title ${report.titleMismatchCount} // persisted ${report.persistenceMismatchCount}`,
    `Rights regressions: ${report.rightsRegressionCount}`,
    `Registry format conflicts: ${report.registryFormatConflicts.length}`,
    `RESULT: ${report.pass ? "PASS" : "REVIEW REQUIRED"}`,
  ];
  if (report.mismatches.length) {
    lines.push("", "MISMATCHES");
    report.mismatches.forEach((item) => {
      const expectedRuntime =
        item.expected.runtimeFormats ||
        [item.expected.runtimeFormat];
      const expectedContract =
        item.expected.contracts ||
        [item.expected.contractId];
      lines.push(
        `${item.sourceId} // ${item.title}`,
        `  ${item.issue}: expected ${expectedRuntime.join("|")} / ${expectedContract.join("|")}; got ${item.actual.runtimeFormat} / ${item.actual.contractId}`,
        `  Fix: ${item.recommendation}`,
      );
    });
  }
  if (report.rightsRegressions.length) {
    lines.push("", "RIGHTS REGRESSIONS");
    report.rightsRegressions.forEach((item) => {
      lines.push(
        `${item.sourceId} // ${item.title} // ${item.failures.join(", ")}`,
      );
    });
  }
  return lines.join("\n");
}

function isDirectRun() {
  return (
    process.argv[1] &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isDirectRun()) {
  const compiled = compileCanonicalSources();
  const report = auditClassifications(
    compiled.sources,
    compiled.runtime.WWAMEpisodeFormatContracts,
  );
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderConciseReport(report)}\n`);
  }
  if (process.argv.includes("--check") && !report.pass) {
    process.exitCode = 1;
  }
}
