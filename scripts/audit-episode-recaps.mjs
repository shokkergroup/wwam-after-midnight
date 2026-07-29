import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const withoutArchiveCompletion = process.argv.includes(
  "--without-archive-completion",
);

const runtimeFiles = [
  "catalog.js",
  "deep-distill.js",
  "episode-guides.js",
  "episode-guide-v2-reviewed-release.js",
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
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "wwam-source-dossier-adapter.js",
].filter((file) => (
  file !== "archive-completion.js" ||
  !withoutArchiveCompletion && fs.existsSync(path.join(demo, file))
));

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
  runtime.WWAM_EPISODE_GUIDES =
    runtime.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE.merge(
      runtime.WWAM_EPISODE_GUIDES,
      runtime.WWAM_EPISODE_GUIDE_V2_REVIEWED_RELEASE,
    );
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
  const completion = runtime.WWAM_ARCHIVE_COMPLETION || {
    streams: [],
    topicIndex: [],
    characterIndex: [],
  };
  const archiveSearch = Object.assign({}, base, {
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

function receiptKind(receipt) {
  const kind = String(receipt?.kind || "").toLowerCase();
  const evidenceType = String(receipt?.evidenceType || "").toLowerCase();
  if (kind.includes("topic") || evidenceType.includes("topic")) return "topic";
  if (kind.includes("character") || evidenceType.includes("character")) return "character";
  return "moment";
}

function comparableExcerpt(value) {
  return String(value || "")
    .replace(/^[\s.\u2026\u00e2\u20ac\u00a6]+|[\s.\u2026\u00e2\u20ac\u00a6]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function recapText(file) {
  return [
    file.recap.headline,
    file.recap.deck,
    file.recap.overview,
    ...file.recap.story.flatMap((segment) => [segment.label, segment.body]),
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
const storySegments = ready.flatMap((file) =>
  file.recap.story.map((segment) => ({ sourceId: file.id, ...segment })),
);
const actEvidence = ready.map((file) => {
  const registered = file.source.receipts || [];
  const usedKeys = new Set(file.recap.sections.flatMap((section) => section.receiptKeys));
  const registeredByKind = {
    topic: registered.filter((receipt) => receiptKind(receipt) === "topic"),
    moment: registered.filter((receipt) => receiptKind(receipt) === "moment"),
    character: registered.filter((receipt) => receiptKind(receipt) === "character"),
  };
  const usedByKind = Object.fromEntries(
    Object.entries(registeredByKind).map(([kind, values]) => [
      kind,
      values.filter((receipt) => usedKeys.has(receipt.key)),
    ]),
  );
  return {
    sourceId: file.id,
    registered: registered.length,
    used: registered.filter((receipt) => usedKeys.has(receipt.key)).length,
    registeredByKind,
    usedByKind,
    openingCategory: file.recap.sections[0]?.category || "",
  };
});
const actEvidenceTotals = actEvidence.reduce((totals, item) => {
  totals.registered += item.registered;
  totals.used += item.used;
  for (const kind of ["topic", "moment", "character"]) {
    totals.registeredByKind[kind] += item.registeredByKind[kind].length;
    totals.usedByKind[kind] += item.usedByKind[kind].length;
  }
  totals.openings[item.openingCategory] =
    (totals.openings[item.openingCategory] || 0) + 1;
  return totals;
}, {
  registered: 0,
  used: 0,
  registeredByKind: { topic: 0, moment: 0, character: 0 },
  usedByKind: { topic: 0, moment: 0, character: 0 },
  openings: {},
});
const storyCoverageFailures = ready.flatMap((file) => {
  const registered = new Set(file.source.receipts.map((receipt) => receipt.key));
  const narrated = new Set(file.recap.story.flatMap((segment) => segment.receiptKeys));
  const missing = Array.from(registered).filter((key) => !narrated.has(key));
  const foreign = Array.from(narrated).filter((key) => !registered.has(key));
  return missing.length || foreign.length ||
      file.recap.caseFile.storyReceiptCount !== registered.size ||
      file.recap.caseFile.storyCoveragePercent !== 100
    ? [{
      sourceId: file.id,
      registered: registered.size,
      narrated: narrated.size,
      missing,
      foreign,
      reportedCoverage: file.recap.caseFile.storyCoveragePercent,
    }]
    : [];
});
const storyAnchorFailures = ready.flatMap((file) => {
  const receiptByKey = new Map(
    file.source.receipts.map((receipt) => [receipt.key, receipt]),
  );
  return file.recap.story.flatMap((segment) => {
    const anchor = receiptByKey.get(segment.anchorReceiptKey);
    const excerpt = comparableExcerpt(segment.excerpt);
    const ownedExcerpt = !excerpt || (
      anchor?.publicExcerptAllowed &&
      comparableExcerpt(anchor.excerpt).startsWith(excerpt)
    );
    return anchor &&
        segment.receiptKeys.includes(segment.anchorReceiptKey) &&
        Number(anchor.at) === Number(segment.anchorAt) &&
        ownedExcerpt
      ? []
      : [{
        sourceId: file.id,
        segmentId: segment.id,
        anchorReceiptKey: segment.anchorReceiptKey,
        anchorAt: segment.anchorAt,
        receiptAt: anchor?.at ?? null,
        ownedExcerpt,
      }];
  });
});
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
const duplicateHeadlineGroups = Array.from(
  ready.reduce((groups, file) => {
    if (!groups.has(file.recap.headline)) groups.set(file.recap.headline, []);
    groups.get(file.recap.headline).push({
      sourceId: file.id,
      title: file.title,
    });
    return groups;
  }, new Map()),
)
  .filter(([, members]) => members.length > 1)
  .map(([headline, members]) => ({ headline, members }))
  .sort((left, right) =>
    right.members.length - left.members.length ||
    left.headline.localeCompare(right.headline),
  );
const heldSemanticClaimFailures = held.filter((file) =>
  file.recap.sections.length ||
  file.recap.story.length ||
  file.recap.bestMoments.length ||
  file.recap.topics.length ||
  Object.keys(file.recap.fanRead || {}).length,
);

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
    story: {
      segments: storySegments.length,
      averageSegmentsPerReadyRecap: average(ready.map((file) => file.recap.story.length)),
      receiptsAccountedFor: ready.reduce(
        (total, file) => total + file.recap.caseFile.storyReceiptCount,
        0,
      ),
      registeredReceipts: ready.reduce(
        (total, file) => total + file.recap.caseFile.receiptCount,
        0,
      ),
    },
    actEvidence: {
      registeredReceipts: actEvidenceTotals.registered,
      usedReceipts: actEvidenceTotals.used,
      usedPercent: actEvidenceTotals.registered
        ? Math.round(actEvidenceTotals.used / actEvidenceTotals.registered * 1000) / 10
        : 100,
      registeredByKind: actEvidenceTotals.registeredByKind,
      usedByKind: actEvidenceTotals.usedByKind,
      usedPercentByKind: Object.fromEntries(
        Object.keys(actEvidenceTotals.registeredByKind).map((kind) => [
          kind,
          actEvidenceTotals.registeredByKind[kind]
            ? Math.round(
              actEvidenceTotals.usedByKind[kind] /
                actEvidenceTotals.registeredByKind[kind] * 1000,
            ) / 10
            : 100,
        ]),
      ),
      openingCategory: actEvidenceTotals.openings,
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
    duplicateHeadlineGroups,
    sectionLabelPrefixes: countBy(sections, (section) => prefix(section.label)),
    storyReelOpenings: countBy(storySegments, (segment) => prefix(segment.label)),
    repeatedOverviewColor: countBy(ready, (file) => {
      const match = file.recap.overview.match(
        /(In plain English[^.]*\.|This is the one where[^.]*\.|The tape moves like[^.]*\.|It starts as a show[^.]*\.)/,
      );
      return match ? match[1] : "GUIDE_OR_OTHER";
    }),
  },
  quality: {
    machineLabelLeaks: machineLeaks.map((file) => file.id),
    pluralAgreementErrors: agreementErrors.map((file) => ({
      sourceId: file.id,
      headline: file.recap.headline,
    })),
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
    heldSemanticClaimFailures: heldSemanticClaimFailures.map((file) => file.id),
    titleGoldenFailures,
    storyCoverageFailures,
    storyAnchorFailures,
  },
  unusedRegisteredOverviewSignal: {
    compared: comparison.length,
    averageWordOverlapPercent: average(comparison.map((item) => item.overlap)),
    under25Percent: comparison.filter((item) => item.overlap < 25).length,
    weakestExamples: comparison.slice(0, 15),
  },
};
report.gates = {
  everyRegisteredReceiptInPlayableActs:
    report.depth.actEvidence.usedReceipts ===
    report.depth.actEvidence.registeredReceipts,
  everyRegisteredReceiptInWrittenStory:
    report.depth.story.receiptsAccountedFor ===
    report.depth.story.registeredReceipts,
  everyTopicReceiptCarriedThrough:
    report.depth.actEvidence.usedByKind.topic ===
    report.depth.actEvidence.registeredByKind.topic,
  everyHeadlineUnique:
    report.voice.uniqueHeadlines === report.corpus.ready,
  everyDeckUnique:
    report.voice.uniqueDecks === report.corpus.ready,
  registeredOverviewRetained:
    report.unusedRegisteredOverviewSignal.under25Percent === 0,
  sourceNuggetsRetained:
    report.quality.excerptActsUsingSourceNugget ===
    report.quality.excerptBearingActs,
  steveLanesRetained:
    report.quality.steveLaneCarriedIntoRecap ===
    report.quality.steveLaneSources,
  noHeldSemanticClaims:
    report.quality.heldSemanticClaimFailures.length === 0,
  noMachineLabels:
    report.quality.machineLabelLeaks.length === 0,
  noGrammarFailures:
    report.quality.pluralAgreementErrors.length === 0,
  noDuplicateActLabels:
    report.quality.duplicateActLabels.length === 0,
  noEarlyClosingLabels:
    report.quality.earlyClosingLabels.length === 0,
  everyRecapHasCaseFile:
    report.quality.missingCaseFiles.length === 0,
  titleSubjectGoldensPass:
    report.quality.titleGoldenFailures.length === 0,
  writtenStoryCoveragePass:
    report.quality.storyCoverageFailures.length === 0,
  writtenStoryAnchorsPass:
    report.quality.storyAnchorFailures.length === 0,
};
report.pass = Object.values(report.gates).every(Boolean);

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
    officialAlternate: file.source.officialAlternate || null,
    warnings: file.source.warnings || [],
    episodeGuide: file.source.showWiki.episodeGuide,
    recap: file.recap,
    registeredRecap: file.legacyRecap,
    lanes: file.source.showWiki.lanes,
  }, null, 2)}\n`);
} else if (process.argv.includes("--inventory")) {
  process.stdout.write(`${JSON.stringify(files.map((file) => ({
    id: file.id,
    title: file.title,
    date: file.source.date,
    duration: file.source.duration,
    views: file.source.views,
    url: file.source.url,
    coverage: file.coverage,
    state: file.recap.state,
    tier: file.recap.tier,
    receiptCount: file.recap.caseFile?.receiptCount || 0,
    sectionCount: file.recap.sections.length,
    storyCount: file.recap.story.length,
    topicCount: file.recap.topics.length,
    bestMomentCount: file.recap.bestMoments.length,
    fanReadLanes: Object.keys(file.recap.fanRead || {}),
  })), null, 2)}\n`);
} else if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(
    [
      "WWAM EPISODE RECAP QUALITY AUDIT",
      `Sources: ${report.corpus.sources} // ready ${report.corpus.ready} // held ${report.corpus.held}`,
      `Tiers: ${JSON.stringify(report.corpus.tiers)}`,
      `Sections: ${report.depth.sections.total} total // ${report.depth.sections.averagePerReadyRecap} average`,
      `Written story: ${report.depth.story.segments} reels // ${report.depth.story.receiptsAccountedFor}/${report.depth.story.registeredReceipts} receipts accounted for`,
      `Playable acts: ${report.depth.actEvidence.usedReceipts}/${report.depth.actEvidence.registeredReceipts} receipts // ${report.depth.actEvidence.usedPercent}%`,
      `Act topic carry-through: ${report.depth.actEvidence.usedByKind.topic}/${report.depth.actEvidence.registeredByKind.topic} // ${report.depth.actEvidence.usedPercentByKind.topic}%`,
      `Act openings by evidence: ${JSON.stringify(report.depth.actEvidence.openingCategory)}`,
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
      `Written-story coverage failures: ${report.quality.storyCoverageFailures.length}`,
      `Written-story anchor failures: ${report.quality.storyAnchorFailures.length}`,
      `Held-source semantic claim failures: ${report.quality.heldSemanticClaimFailures.length}`,
      `RECAP QUALITY GATE: ${report.pass ? "PASS" : "FAIL"}`,
      "",
      "Most repeated section labels:",
      ...Object.entries(report.voice.sectionLabelPrefixes)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 12)
        .map(([label, count]) => `  ${String(count).padStart(3)}  ${label}`),
      "",
      "Repeated episode headlines:",
      ...(report.voice.duplicateHeadlineGroups.length
        ? report.voice.duplicateHeadlineGroups.slice(0, 10).map((group) =>
          `  ${String(group.members.length).padStart(3)}  ${group.headline}`,
        )
        : ["    0  NONE"]),
      "",
      "Weakest registered-overview carry-through:",
      ...report.unusedRegisteredOverviewSignal.weakestExamples
        .slice(0, 10)
        .map((item) => `  ${String(item.overlap).padStart(3)}%  ${item.sourceId}  ${item.title}`),
    ].join("\n") + "\n",
  );
}
if (process.argv.includes("--check") && !report.pass) {
  process.exitCode = 1;
}
