import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");

const runtimeFiles = [
  "catalog.js",
  "deep-distill.js",
  "episode-guides.js",
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
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "wwam-source-dossier-adapter.js",
];

function compile() {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  runtimeFiles.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  const runtime = sandbox.window;
  const showcase = runtime.WWAMShowcaseEngine.create({
    catalog: runtime.WWAM_CATALOG,
    deep: runtime.WWAM_DEEP_DISTILL,
    live: runtime.WWAM_LIVESTREAMS,
    popular: runtime.WWAM_POPULAR_LIVE,
    characters: runtime.WWAM_CHARACTER_LORE,
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
  const archiveSearch = Object.assign({}, base, {
    streams: base.streams.concat(runtime.WWAM_YEAR_CANON_2025_2026.streams),
    topicIndex: base.topicIndex.concat(runtime.WWAM_YEAR_CANON_2025_2026.topicIndex),
    characterIndex: base.characterIndex.concat(runtime.WWAM_YEAR_CANON_2025_2026.characterIndex),
  });
  return runtime.WWAMSourceDossierAdapter.build({
    atlas: runtime.WWAM_ARCHIVE_ATLAS,
    catalog: runtime.WWAM_CATALOG,
    deep: runtime.WWAM_DEEP_DISTILL,
    episodeGuides: runtime.WWAM_EPISODE_GUIDES,
    live: runtime.WWAM_LIVESTREAMS,
    popular: runtime.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: { getSearchPayload: () => archiveSearch },
    showcase,
    clipLab,
    characters: runtime.WWAM_CHARACTER_LORE,
    dna: runtime.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:recap-quality-audit",
    },
  });
}

function average(values) {
  return values.length
    ? Math.round(values.reduce((total, value) => total + value, 0) / values.length * 10) / 10
    : 0;
}

function countBy(values, getter) {
  return values.reduce((counts, value) => {
    const key = String(getter(value) || "NONE");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function words(value) {
  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );
}

function overlap(left, right) {
  const a = words(left);
  const b = words(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((word) => {
    if (b.has(word)) shared += 1;
  });
  return Math.round(shared / Math.min(a.size, b.size) * 100);
}

function prefix(value) {
  return String(value || "").split("//")[0].trim();
}

function prose(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function usesExcerpt(section) {
  const excerptWords = prose(section.excerpt).split(" ").filter(Boolean);
  const body = ` ${prose(section.body)} `;
  if (!excerptWords.length) return true;
  const size = Math.min(3, excerptWords.length);
  for (let index = 0; index <= excerptWords.length - size; index += 1) {
    const nugget = ` ${excerptWords.slice(index, index + size).join(" ")} `;
    if (body.includes(nugget)) return true;
  }
  return false;
}

function recapText(file) {
  return [
    file.recap.headline,
    file.recap.deck,
    file.recap.overview,
    ...file.recap.sections.flatMap((section) => [section.label, section.body]),
    ...Object.values(file.recap.fanRead || {}).flatMap((item) => [
      item.label,
      item.topic,
      item.body,
    ]),
  ].join(" ");
}

const result = compile();
const files = result.sources.map((source) => ({
  id: source.id,
  title: source.displayTitle || source.title,
  coverage: source.coverage,
  source,
  recap: source.showWiki.episodeRecap,
  legacyRecap: source.showWiki.recap,
}));
const ready = files.filter((file) => file.recap.state === "ready");
const held = files.filter((file) => file.recap.state === "held");
const sections = ready.flatMap((file) =>
  file.recap.sections.map((section) => ({ sourceId: file.id, ...section })),
);
const comparison = ready
  .filter((file) => file.legacyRecap && file.legacyRecap.overview)
  .map((file) => ({
    sourceId: file.id,
    title: file.title,
    tier: file.recap.tier,
    overlap: overlap(file.recap.overview, file.legacyRecap.overview),
    recapOverview: file.recap.overview,
    registeredOverview: file.legacyRecap.overview,
  }))
  .sort((left, right) => left.overlap - right.overlap || left.sourceId.localeCompare(right.sourceId));
const excerptSections = sections.filter((section) => String(section.excerpt || "").trim());
const excerptMisses = excerptSections.filter((section) => !usesExcerpt(section));
const machineLeaks = ready.filter((file) =>
  /\bTOPIC\s*:|CHARACTER PERFORMANCE|A CHARACTER PERFORMANCE\b/i.test(recapText(file)),
);
const agreementErrors = ready.filter((file) =>
  /\b(?:RANKINGS? & LISTS?|REMAKES? & REBOOTS?|SEQUELS? & PREQUELS?|TRAILERS)\s+(?:GETS|WALKS|STARTS|OPENS|TAKES|LEAVES|HIDES|KICKS)\b/i
    .test(file.recap.headline),
);
const duplicateLabels = ready.filter((file) => {
  const labels = file.recap.sections.map((section) => section.label.toLowerCase());
  return new Set(labels).size !== labels.length;
});
const steveFiles = ready.filter((file) => {
  const lane = file.source.showWiki.lanes.find(
    (candidate) => candidate.id === "straight-to-steves-asshole",
  );
  return lane && lane.receiptKeys.length;
});
const missingSteve = steveFiles.filter((file) => !file.recap.fanRead?.hated);
const earlyClosingLabels = ready.flatMap((file) =>
  file.recap.sections
    .filter((section) => /^LAST (?:CALL|WORD)\b/.test(section.label))
    .filter((section) => section.at / Math.max(1, file.source.duration) < 0.85)
    .map((section) => ({
      sourceId: file.id,
      at: section.at,
      duration: file.source.duration,
      label: section.label,
    })),
);
const missingCaseFiles = files.filter((file) => !file.recap.caseFile);
const titleGoldens = {
  M3P4mMDpXUc: /SCREAM/,
  QxJyVaAgZ_Y: /FRIDAY THE 13TH/,
  KrBhfGxsJNM: /HALLOWEEN/,
  nv99WEtXGvE: /A NIGHTMARE ON ELM STREET/,
  qfJFZaC9pTE: /IT|DERRY/,
  tUJviU09fWM: /TEXAS CHAINSAW/,
  MSVltTVeypc: /HALLOWEEN/,
  "Oi-s0ZuWDbM": /HORROR/,
};
const titleGoldenFailures = Object.entries(titleGoldens).flatMap(([sourceId, pattern]) => {
  const file = ready.find((candidate) => candidate.id === sourceId);
  return !file || !pattern.test(file.recap.headline)
    ? [{ sourceId, headline: file?.recap.headline || "MISSING" }]
    : [];
});

const report = {
  generatedAt: new Date().toISOString(),
  corpus: {
    sources: files.length,
    ready: ready.length,
    held: held.length,
    tiers: countBy(files, (file) => file.recap.tier),
  },
  depth: {
    sections: {
      total: sections.length,
      averagePerReadyRecap: average(ready.map((file) => file.recap.sections.length)),
      minimum: Math.min(...ready.map((file) => file.recap.sections.length)),
      maximum: Math.max(...ready.map((file) => file.recap.sections.length)),
    },
    topics: {
      averagePerReadyRecap: average(ready.map((file) =>
        new Set(file.recap.sections.flatMap((section) => section.receiptKeys)).size,
      )),
      recapsWithGenericFeldmanZoneHeadline: ready.filter((file) =>
        /TAPE HAS ENTERED THE FELDMAN ZONE/.test(file.recap.headline),
      ).length,
    },
    bestMomentsAverage: average(ready.map((file) => file.recap.bestMoments.length)),
    fanReadLanes: countBy(
      ready.flatMap((file) => Object.keys(file.recap.fanRead || {})),
      (lane) => lane,
    ),
  },
  voice: {
    uniqueHeadlines: new Set(ready.map((file) => file.recap.headline)).size,
    uniqueDecks: new Set(ready.map((file) => file.recap.deck)).size,
    sectionLabelPrefixes: countBy(sections, (section) => prefix(section.label)),
    repeatedOverviewColor: countBy(ready, (file) => {
      const match = file.recap.overview.match(
        /(In plain English[^.]*\.|This is the one where[^.]*\.|The tape moves like[^.]*\.|It starts as a show[^.]*\.)/,
      );
      return match ? match[1] : "GUIDE_OR_OTHER";
    }),
  },
  quality: {
    machineLabelLeaks: machineLeaks.map((file) => file.id),
    pluralAgreementErrors: agreementErrors.map((file) => file.id),
    duplicateActLabels: duplicateLabels.map((file) => file.id),
    excerptBearingActs: excerptSections.length,
    excerptActsUsingSourceNugget: excerptSections.length - excerptMisses.length,
    excerptUsePercent: excerptSections.length
      ? Math.round((excerptSections.length - excerptMisses.length) / excerptSections.length * 1000) / 10
      : 100,
    excerptMisses: excerptMisses.slice(0, 25).map((section) => ({
      sourceId: section.sourceId,
      label: section.label,
    })),
    steveLaneSources: steveFiles.length,
    steveLaneCarriedIntoRecap: steveFiles.length - missingSteve.length,
    missingSteve: missingSteve.map((file) => file.id),
    earlyClosingLabels,
    missingCaseFiles: missingCaseFiles.map((file) => file.id),
    titleGoldenFailures,
  },
  unusedRegisteredOverviewSignal: {
    compared: comparison.length,
    averageWordOverlapPercent: average(comparison.map((item) => item.overlap)),
    under25Percent: comparison.filter((item) => item.overlap < 25).length,
    weakestExamples: comparison.slice(0, 15),
  },
};

const sourceFlag = process.argv.indexOf("--source");
if (sourceFlag >= 0) {
  const sourceId = String(process.argv[sourceFlag + 1] || "");
  const file = files.find((item) => item.id === sourceId);
  if (!file) {
    throw new Error(`Unknown canonical source: ${sourceId}`);
  }
  process.stdout.write(`${JSON.stringify({
    id: file.id,
    title: file.title,
    coverage: file.coverage,
    receipts: file.source.receipts,
    episodeGuide: file.source.showWiki.episodeGuide,
    recap: file.recap,
    registeredRecap: file.legacyRecap,
    lanes: file.source.showWiki.lanes,
  }, null, 2)}\n`);
} else if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(
    [
      "WWAM EPISODE RECAP QUALITY AUDIT",
      `Sources: ${report.corpus.sources} // ready ${report.corpus.ready} // held ${report.corpus.held}`,
      `Tiers: ${JSON.stringify(report.corpus.tiers)}`,
      `Sections: ${report.depth.sections.total} total // ${report.depth.sections.averagePerReadyRecap} average`,
      `Unique headlines: ${report.voice.uniqueHeadlines}/${report.corpus.ready}`,
      `Unique decks: ${report.voice.uniqueDecks}/${report.corpus.ready}`,
      `Registered-overview overlap: ${report.unusedRegisteredOverviewSignal.averageWordOverlapPercent}% average`,
      `Recaps below 25% registered-overview overlap: ${report.unusedRegisteredOverviewSignal.under25Percent}`,
      `Excerpt-bearing acts using a source nugget: ${report.quality.excerptActsUsingSourceNugget}/${report.quality.excerptBearingActs} (${report.quality.excerptUsePercent}%)`,
      `Machine-label leaks: ${report.quality.machineLabelLeaks.length}`,
      `Plural-agreement failures: ${report.quality.pluralAgreementErrors.length}`,
      `Duplicate act labels: ${report.quality.duplicateActLabels.length}`,
      `Steve lanes carried into recap: ${report.quality.steveLaneCarriedIntoRecap}/${report.quality.steveLaneSources}`,
      `Early LAST WORD labels: ${report.quality.earlyClosingLabels.length}`,
      `Missing case files: ${report.quality.missingCaseFiles.length}`,
      `Title-subject golden failures: ${report.quality.titleGoldenFailures.length}`,
      "",
      "Most repeated section labels:",
      ...Object.entries(report.voice.sectionLabelPrefixes)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 12)
        .map(([label, count]) => `  ${String(count).padStart(3)}  ${label}`),
      "",
      "Weakest registered-overview carry-through:",
      ...report.unusedRegisteredOverviewSignal.weakestExamples
        .slice(0, 10)
        .map((item) => `  ${String(item.overlap).padStart(3)}%  ${item.sourceId}  ${item.title}`),
    ].join("\n") + "\n",
  );
}
