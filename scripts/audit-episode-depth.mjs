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
  "wwam-source-dossier-adapter.js",
];

const genericHighlightLabels = new Set([
  "big laugh",
  "biggest laugh",
  "full send",
  "funny moment",
  "high heat",
  "hot take",
  "out of pocket",
  "reviewed show cut",
  "show checkpoint",
  "soundbyte",
  "soundbyte replay",
  "stinger",
  "take gets nuclear",
  "the room breaks",
  "up in ya",
  "wildest detour",
]);

const categoryOrder = [
  "STRAIGHT TO STEVE'S ASSHOLE",
  "UP IN YA / STINGER",
  "CHARACTER APPEARANCE",
  "SOUNDBYTE / REPLAY",
  "MAJOR TOPIC TURN",
];

function array(value) {
  return Array.isArray(value) ? value : [];
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function topologyKey(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/^(?:topic|character performance|character|moment)\s*:\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clock(seconds) {
  const total = Math.max(0, Math.floor(number(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const remainder = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function runtimeBand(duration) {
  const seconds = number(duration);
  if (seconds < 2700) return "under-45m";
  if (seconds < 5400) return "45m-89m";
  if (seconds < 7200) return "90m-119m";
  if (seconds < 10800) return "2h-3h";
  return "3h-plus";
}

function runtimeHighlightFloor(duration) {
  const seconds = number(duration);
  if (seconds < 2700) return 5;
  if (seconds < 5400) return 8;
  if (seconds < 7200) return 10;
  if (seconds < 10800) return 12;
  return 15;
}

function receiptKind(receipt) {
  const kind = clean(receipt?.kind).toLowerCase();
  const evidenceType = clean(receipt?.evidenceType).toLowerCase();
  if (kind.includes("topic") || evidenceType.includes("topic")) return "topic";
  if (kind.includes("character") || evidenceType.includes("character")) {
    return "character";
  }
  return "moment";
}

function receiptAt(receipt) {
  return Math.max(0, number(receipt?.at ?? receipt?.t));
}

function cutAt(cut) {
  return Math.max(0, number(cut?.at ?? cut?.t));
}

function validGuideCuts(source) {
  return array(source?.showWiki?.episodeGuide?.cuts).filter((cut) =>
    clean(cut?.id) && number(cut?.end) > cutAt(cut)
  );
}

function storyReceiptKeys(recap) {
  return new Set(array(recap?.story).flatMap((segment) => [
    ...array(segment?.receiptKeys),
    ...array(segment?.hiddenReceiptKeys),
    ...array(segment?.timelineReceiptKeys),
    ...array(segment?.hiddenTimelineReceiptKeys),
    ...array(segment?.timelineReceipts).map((receipt) =>
      receipt?.receiptKey || receipt?.key
    ),
    ...array(segment?.hiddenTimelineReceipts).map((receipt) =>
      receipt?.receiptKey || receipt?.key
    ),
  ]).map(clean).filter(Boolean));
}

function storyGuideCutIds(recap) {
  return new Set(array(recap?.story).flatMap((segment) =>
    array(segment?.guideCutIds)
  ).map(clean).filter(Boolean));
}

function sectionReceiptKeys(recap) {
  return new Set(array(recap?.sections).flatMap((section) =>
    array(section?.receiptKeys)
  ).map(clean).filter(Boolean));
}

function sectionGuideCutIds(recap) {
  return new Set(array(recap?.sections).map((section) =>
    clean(section?.guideCutId)
  ).filter(Boolean));
}

function normalizedText(values) {
  return array(values).flat(Infinity).map(clean).filter(Boolean).join(" ")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textContainsLabel(text, label) {
  const needle = topologyKey(label);
  if (!needle) return false;
  return ` ${text} `.includes(` ${needle} `);
}

function genericLabel(value) {
  const key = topologyKey(value);
  return genericHighlightLabels.has(key) ||
    /^(?:chapter|reel|runtime|segment|part)\s+\d+$/.test(key) ||
    /^(?:opening|closing|finale|next turn|the next turn)$/.test(key);
}

function laneKeys(source, pattern) {
  return new Set(array(source?.showWiki?.lanes)
    .filter((lane) => pattern.test(
      `${clean(lane?.id)} ${clean(lane?.label)}`,
    ))
    .flatMap((lane) => array(lane?.receiptKeys))
    .map(clean)
    .filter(Boolean));
}

function expectedReceiptCategory(receipt, steveKeys, upInYaKeys) {
  const kind = receiptKind(receipt);
  const key = clean(receipt?.key);
  const label = clean(receipt?.label).toUpperCase();
  if (kind === "character") return "CHARACTER APPEARANCE";
  if (steveKeys.has(key)) return "STRAIGHT TO STEVE'S ASSHOLE";
  if (
    upInYaKeys.has(key) ||
    /UP IN YA|OUT OF POCKET|FULL SEND|STINGER/.test(label)
  ) {
    return "UP IN YA / STINGER";
  }
  if (kind === "moment") return "SOUNDBYTE / REPLAY";
  return "MAJOR TOPIC TURN";
}

function expectedGuideCategory(source, cut) {
  const guide = source?.showWiki?.episodeGuide || {};
  const fanRead = guide?.fanRead || {};
  const cutId = clean(cut?.id);
  if (clean(fanRead?.hated?.cutId) === cutId) {
    return "STRAIGHT TO STEVE'S ASSHOLE";
  }
  if (clean(fanRead?.wildestDetour?.cutId) === cutId) {
    return "UP IN YA / STINGER";
  }
  const topic = topologyKey(cut?.topic);
  const isCharacter = array(guide?.threads).some((thread) =>
    clean(thread?.kind).toLowerCase() === "character" &&
    topologyKey(thread?.name) === topic
  );
  return isCharacter ? "CHARACTER APPEARANCE" : "SOUNDBYTE / REPLAY";
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((left, right) => left - right);
  return sorted[Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * fraction)),
  )];
}

function average(values) {
  return values.length
    ? Math.round(
      values.reduce((total, value) => total + value, 0) / values.length * 10,
    ) / 10
    : 0;
}

function countBy(values, getter) {
  return values.reduce((counts, item) => {
    const key = clean(getter(item)) || "NONE";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function compileCorpus({ withoutArchiveCompletion = false } = {}) {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  runtimeFiles
    .filter((file) =>
      file !== "archive-completion.js" ||
      !withoutArchiveCompletion && fs.existsSync(path.join(demo, file))
    )
    .forEach((file) => {
      vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
        filename: file,
      });
    });

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
      packFingerprint: "fnv1a32:episode-depth-audit",
    },
  });
}

function issue(source, metric, severity, score, message, detail = {}) {
  return {
    sourceId: clean(source?.id),
    title: clean(source?.displayTitle || source?.title),
    duration: number(source?.duration),
    runtime: clock(source?.duration),
    metric,
    severity,
    score,
    message,
    detail,
  };
}

function auditSource(source) {
  const recap = source?.showWiki?.episodeRecap || {};
  const receipts = array(source?.receipts);
  const visibleReceipts = receipts.filter((receipt) =>
    receipt?.showWikiHidden !== true
  );
  const requiredReceipts = visibleReceipts.filter((receipt) =>
    receiptKind(receipt) !== "topic"
  );
  const topicReceipts = visibleReceipts.filter((receipt) =>
    receiptKind(receipt) === "topic"
  );
  const titleReceipts = topicReceipts.filter((receipt) =>
    clean(receipt?.evidenceType) === "caption-title-topic-receipt"
  );
  const guideCuts = validGuideCuts(source);
  const runway = array(recap?.highlightRunway);
  const runwayReceiptKeys = new Set(runway.map((item) =>
    clean(item?.receiptKey)
  ).filter(Boolean));
  const runwayGuideIds = new Set(runway.map((item) =>
    clean(item?.guideCutId)
  ).filter(Boolean));
  const sourceReceiptKeys = new Set(receipts.map((receipt) =>
    clean(receipt?.key)
  ).filter(Boolean));
  const guideCutIds = new Set(guideCuts.map((cut) =>
    clean(cut?.id)
  ).filter(Boolean));
  const storyKeys = storyReceiptKeys(recap);
  const sectionKeys = sectionReceiptKeys(recap);
  const storyGuideIds = storyGuideCutIds(recap);
  const sectionGuideIds = sectionGuideCutIds(recap);
  const surfacedReceiptKeys = new Set([
    ...runwayReceiptKeys,
    ...storyKeys,
    ...sectionKeys,
    ...array(recap?.topicMap).map((topic) => clean(topic?.receiptKey)),
  ].filter(Boolean));
  const surfacedGuideIds = new Set([
    ...runwayGuideIds,
    ...storyGuideIds,
    ...sectionGuideIds,
    ...array(recap?.topicMap).map((topic) => clean(topic?.guideCutId)),
  ].filter(Boolean));
  const steveKeys = laneKeys(
    source,
    /straight[- ]to[- ]steve|steve'?s?\s+asshole/i,
  );
  const upInYaKeys = laneKeys(
    source,
    /up[- ]in[- ]ya|out[- ]of[- ]pocket/i,
  );
  const availableCategories = new Set([
    ...visibleReceipts.map((receipt) =>
      expectedReceiptCategory(receipt, steveKeys, upInYaKeys)
    ),
    ...guideCuts.map((cut) => expectedGuideCategory(source, cut)),
  ]);
  const actualCategories = new Set(runway.map((item) =>
    clean(item?.category)
  ).filter(Boolean));
  // Exact topic navigation is still playable source evidence. A "ready" show
  // with ten timestamped topic doors and zero comedy/character candidates
  // must not be excused into a zero-highlight wiki.
  const hasNavigableEvidence =
    visibleReceipts.length > 0 || guideCuts.length > 0;
  const targetFloor = hasNavigableEvidence
    ? runtimeHighlightFloor(source?.duration)
    : 0;
  const featureCapacity = visibleReceipts.length + guideCuts.length;
  const achievableFloor = hasNavigableEvidence
    ? Math.min(targetFloor, featureCapacity)
    : 0;

  const missingRequired = requiredReceipts.filter((receipt) =>
    !runwayReceiptKeys.has(clean(receipt?.key))
  );
  const duplicateRunwayKeys = runway.map((item) =>
    clean(item?.receiptKey)
      ? `receipt:${clean(item?.receiptKey)}`
      : clean(item?.guideCutId)
        ? `guide:${clean(item?.guideCutId)}`
        : ""
  ).filter(Boolean);
  const duplicateFeatureCount =
    duplicateRunwayKeys.length - new Set(duplicateRunwayKeys).size;
  const foreignFeatures = runway.filter((item) => {
    const receiptKey = clean(item?.receiptKey);
    const guideCutId = clean(item?.guideCutId);
    if (receiptKey) return !sourceReceiptKeys.has(receiptKey);
    if (guideCutId) return !guideCutIds.has(guideCutId);
    return true;
  });

  const recapTopicLabels = array(recap?.topics).map(clean).filter(Boolean);
  const actualTopicKeys = recapTopicLabels.map(topologyKey).filter(Boolean);
  const uniqueActualTopicKeys = new Set(actualTopicKeys);
  const expectedTopicLabels = Array.from(new Map(topicReceipts.map((receipt) => [
    topologyKey(receipt?.label),
    clean(receipt?.label),
  ])).entries()).filter(([key]) => key);
  const expectedTopicKeys = new Set(expectedTopicLabels.map(([key]) => key));
  const duplicateTopicDoors =
    actualTopicKeys.length - uniqueActualTopicKeys.size;
  const minimumTopicDoors = Math.min(3, expectedTopicKeys.size);
  const missingTopicDoors = expectedTopicLabels.filter(([key]) =>
    !uniqueActualTopicKeys.has(key)
  );

  const recapText = normalizedText([
    recap?.headline,
    recap?.deck,
    recap?.overview,
    recapTopicLabels,
    array(recap?.story).flatMap((segment) => [
      segment?.label,
      segment?.body,
      segment?.primarySubject,
      segment?.narrative?.primarySubject,
      segment?.narrative?.secondarySubjects,
      segment?.topicLabels,
    ]),
    array(recap?.sections).flatMap((section) => [
      section?.label,
      section?.body,
      section?.anchor,
    ]),
    runway.map((item) => item?.label),
  ]);
  const missingTitleSubjects = titleReceipts.filter((receipt) => {
    const key = clean(receipt?.key);
    return !surfacedReceiptKeys.has(key) ||
      !textContainsLabel(recapText, receipt?.label);
  });

  const duration = Math.max(1, number(source?.duration));
  const lateReceiptEvidence = visibleReceipts.filter((receipt) =>
    receiptAt(receipt) / duration >= 0.75
  );
  const lateGuideEvidence = guideCuts.filter((cut) =>
    cutAt(cut) / duration >= 0.75
  );
  const missingLateReceipts = lateReceiptEvidence.filter((receipt) =>
    !surfacedReceiptKeys.has(clean(receipt?.key))
  );
  const missingLateGuideCuts = lateGuideEvidence.filter((cut) =>
    !surfacedGuideIds.has(clean(cut?.id))
  );
  const latestSurfaceAt = Math.max(0, ...[
    ...runway.map((item) => number(item?.at)),
    ...array(recap?.story).map((segment) =>
      Math.max(number(segment?.at), number(segment?.anchorAt))
    ),
    ...array(recap?.sections).map((section) => number(section?.at)),
  ]);
  const latestEligibleAt = Math.max(0, ...[
    ...lateReceiptEvidence.map(receiptAt),
    ...lateGuideEvidence.map(cutAt),
  ]);

  const highlightLabels = runway.map((item) => clean(item?.label))
    .filter(Boolean);
  const genericCount = highlightLabels.filter(genericLabel).length;
  const genericRatio = highlightLabels.length
    ? genericCount / highlightLabels.length
    : 0;
  const labelCounts = countBy(highlightLabels, topologyKey);
  const dominantLabelEntry = Object.entries(labelCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0] ||
      ["", 0];
  const dominantLabelRatio = highlightLabels.length
    ? dominantLabelEntry[1] / highlightLabels.length
    : 0;

  const issues = [];
  if (runway.length < achievableFloor) {
    const deficit = achievableFloor - runway.length;
    issues.push(issue(
      source,
      "highlight-floor",
      "blocker",
      100 + deficit * 12,
      `${runway.length} playable highlights is below the achievable ${achievableFloor}-highlight runtime floor.`,
      {
        runtimeBand: runtimeBand(duration),
        targetFloor,
        achievableFloor,
        actual: runway.length,
        featureCapacity,
        deficit,
      },
    ));
  }
  if (missingRequired.length) {
    issues.push(issue(
      source,
      "uncapped-carry-through",
      "blocker",
      180 + missingRequired.length * 15,
      `${missingRequired.length} registered moment/character receipt(s) were dropped from the playable runway.`,
      {
        registeredMomentAndCharacterCount: requiredReceipts.length,
        actualRunwayCount: runway.length,
        missing: missingRequired.slice(0, 25).map((receipt) => ({
          key: clean(receipt?.key),
          at: receiptAt(receipt),
          label: clean(receipt?.label),
          kind: receiptKind(receipt),
        })),
      },
    ));
  }
  if (foreignFeatures.length || duplicateFeatureCount) {
    issues.push(issue(
      source,
      "runway-identity",
      "blocker",
      170 + foreignFeatures.length * 15 + duplicateFeatureCount * 10,
      "The playable runway contains foreign, unkeyed, or duplicate feature identities.",
      {
        foreign: foreignFeatures.slice(0, 25).map((item) => ({
          receiptKey: clean(item?.receiptKey),
          guideCutId: clean(item?.guideCutId),
          at: number(item?.at),
          label: clean(item?.label),
        })),
        duplicateFeatureCount,
      },
    ));
  }

  const categoryFloor = Math.min(
    3,
    availableCategories.size,
    runway.length,
  );
  if (
    runway.length >= 8 &&
    categoryFloor >= 2 &&
    actualCategories.size < categoryFloor
  ) {
    issues.push(issue(
      source,
      "category-diversity",
      actualCategories.size < 2 ? "blocker" : "advisory",
      95 + (categoryFloor - actualCategories.size) * 20,
      `${actualCategories.size} highlight category lane(s) surface despite ${availableCategories.size} evidence-backed lane(s) being available.`,
      {
        requiredDiversity: categoryFloor,
        actualCategories: Array.from(actualCategories).sort(),
        availableCategories: categoryOrder.filter((category) =>
          availableCategories.has(category)
        ),
      },
    ));
  }

  if (missingLateReceipts.length || missingLateGuideCuts.length) {
    issues.push(issue(
      source,
      "late-tail-coverage",
      "blocker",
      160 + (missingLateReceipts.length + missingLateGuideCuts.length) * 12,
      "Source-backed evidence from the final quarter is missing from the public recap structures.",
      {
        latestEligibleAt,
        latestEligibleClock: clock(latestEligibleAt),
        latestSurfaceAt,
        latestSurfaceClock: clock(latestSurfaceAt),
        missingReceipts: missingLateReceipts.slice(0, 25).map((receipt) => ({
          key: clean(receipt?.key),
          at: receiptAt(receipt),
          label: clean(receipt?.label),
        })),
        missingGuideCuts: missingLateGuideCuts.slice(0, 25).map((cut) => ({
          id: clean(cut?.id),
          at: cutAt(cut),
          topic: clean(cut?.topic),
        })),
      },
    ));
  } else if (
    duration >= 5400 &&
    latestEligibleAt >= duration * 0.75 &&
    latestSurfaceAt < duration * 0.7
  ) {
    issues.push(issue(
      source,
      "late-tail-coverage",
      "advisory",
      70,
      "Late evidence is structurally retained, but the visible anchor map appears front-loaded.",
      {
        latestEligibleAt,
        latestEligibleClock: clock(latestEligibleAt),
        latestSurfaceAt,
        latestSurfaceClock: clock(latestSurfaceAt),
      },
    ));
  }

  if (missingTitleSubjects.length) {
    issues.push(issue(
      source,
      "title-subject-presence",
      "blocker",
      210 + missingTitleSubjects.length * 20,
      "A caption-confirmed title subject is absent from the visible recap or its source-bound structure.",
      {
        missing: missingTitleSubjects.map((receipt) => ({
          key: clean(receipt?.key),
          at: receiptAt(receipt),
          label: clean(receipt?.label),
          structurallySurfaced: surfacedReceiptKeys.has(clean(receipt?.key)),
          textPresent: textContainsLabel(recapText, receipt?.label),
        })),
      },
    ));
  }

  if (duplicateTopicDoors) {
    issues.push(issue(
      source,
      "unique-topic-doors",
      "blocker",
      145 + duplicateTopicDoors * 12,
      `${duplicateTopicDoors} duplicate visible topic door(s) collapse navigation choices.`,
      {
        actual: recapTopicLabels,
        duplicateCount: duplicateTopicDoors,
      },
    ));
  }
  if (uniqueActualTopicKeys.size < minimumTopicDoors) {
    issues.push(issue(
      source,
      "unique-topic-doors",
      "blocker",
      135 + (minimumTopicDoors - uniqueActualTopicKeys.size) * 18,
      `${uniqueActualTopicKeys.size} unique topic door(s) surface despite ${expectedTopicKeys.size} source-backed topic(s).`,
      {
        minimumTopicDoors,
        expectedTopicCount: expectedTopicKeys.size,
        actualTopicCount: uniqueActualTopicKeys.size,
        missingTopics: missingTopicDoors.slice(0, 25).map((entry) => entry[1]),
      },
    ));
  } else if (
    expectedTopicKeys.size >= 6 &&
    uniqueActualTopicKeys.size / expectedTopicKeys.size < 0.5
  ) {
    issues.push(issue(
      source,
      "unique-topic-doors",
      "advisory",
      60 + Math.round(
        (1 - uniqueActualTopicKeys.size / expectedTopicKeys.size) * 40,
      ),
      "Fewer than half of the distinct registered topics are exposed as direct topic doors.",
      {
        expectedTopicCount: expectedTopicKeys.size,
        actualTopicCount: uniqueActualTopicKeys.size,
        missingTopics: missingTopicDoors.slice(0, 25).map((entry) => entry[1]),
      },
    ));
  }

  if (
    highlightLabels.length >= 8 &&
    genericRatio >= 0.9 &&
    dominantLabelRatio >= 0.65 &&
    expectedTopicKeys.size >= 3
  ) {
    issues.push(issue(
      source,
      "generic-label-dominance",
      "blocker",
      125 + Math.round(genericRatio * 50 + dominantLabelRatio * 30),
      "The highlight runway is overwhelmingly generic and dominated by one repeated label despite richer topic evidence.",
      {
        highlightCount: highlightLabels.length,
        genericCount,
        genericPercent: Math.round(genericRatio * 100),
        dominantLabel: dominantLabelEntry[0],
        dominantLabelCount: dominantLabelEntry[1],
        dominantLabelPercent: Math.round(dominantLabelRatio * 100),
        uniqueTopicDoors: uniqueActualTopicKeys.size,
      },
    ));
  } else if (
    highlightLabels.length >= 6 &&
    (genericRatio >= 0.7 || dominantLabelRatio >= 0.5)
  ) {
    issues.push(issue(
      source,
      "generic-label-dominance",
      "advisory",
      55 + Math.round(Math.max(genericRatio, dominantLabelRatio) * 40),
      "Generic or repeated highlight labels dominate this show and merit an editorial naming pass.",
      {
        highlightCount: highlightLabels.length,
        genericCount,
        genericPercent: Math.round(genericRatio * 100),
        dominantLabel: dominantLabelEntry[0],
        dominantLabelCount: dominantLabelEntry[1],
        dominantLabelPercent: Math.round(dominantLabelRatio * 100),
      },
    ));
  }

  return {
    sourceId: clean(source?.id),
    title: clean(source?.displayTitle || source?.title),
    headline: clean(recap?.headline),
    date: clean(source?.date),
    duration,
    runtime: clock(duration),
    runtimeBand: runtimeBand(duration),
    recapState: clean(recap?.state),
    highlight: {
      targetFloor,
      achievableFloor,
      featureCapacity,
      actual: runway.length,
      registeredMomentsAndCharacters: requiredReceipts.length,
      missingRegisteredMomentsAndCharacters: missingRequired.length,
      overFloor: Math.max(0, runway.length - achievableFloor),
      uncapped: runway.length > targetFloor,
    },
    categories: {
      available: Array.from(availableCategories).sort(),
      actual: Array.from(actualCategories).sort(),
      requiredDiversity: categoryFloor,
    },
    lateTail: {
      availableEvidence: lateReceiptEvidence.length + lateGuideEvidence.length,
      missingEvidence: missingLateReceipts.length + missingLateGuideCuts.length,
      latestEligibleAt,
      latestSurfaceAt,
      closingPhaseCovered: recap?.caseFile?.closingPhaseCovered === true,
    },
    titleSubjects: {
      registered: titleReceipts.map((receipt) => clean(receipt?.label)),
      missing: missingTitleSubjects.map((receipt) => clean(receipt?.label)),
    },
    topicDoors: {
      registeredUnique: expectedTopicKeys.size,
      visibleUnique: uniqueActualTopicKeys.size,
      duplicateCount: duplicateTopicDoors,
      missingCount: missingTopicDoors.length,
    },
    labels: {
      highlightCount: highlightLabels.length,
      genericCount,
      genericPercent: Math.round(genericRatio * 100),
      dominantLabel: dominantLabelEntry[0],
      dominantLabelCount: dominantLabelEntry[1],
      dominantLabelPercent: Math.round(dominantLabelRatio * 100),
    },
    issues,
  };
}

export function auditEpisodeDepth({
  withoutArchiveCompletion = false,
  sourceId = "",
} = {}) {
  const compiled = compileCorpus({ withoutArchiveCompletion });
  const allSources = array(compiled?.sources);
  const readySources = allSources.filter((source) =>
    clean(source?.showWiki?.episodeRecap?.state) === "ready"
  );
  const selected = sourceId
    ? readySources.filter((source) => clean(source?.id) === clean(sourceId))
    : readySources;
  if (sourceId && !selected.length) {
    throw new Error(`Unknown or non-ready canonical source: ${sourceId}`);
  }
  const shows = selected.map(auditSource);
  const issues = shows.flatMap((show) => show.issues).sort((left, right) =>
    (left.severity === right.severity
      ? 0
      : left.severity === "blocker"
        ? -1
        : 1) ||
    right.score - left.score ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.metric.localeCompare(right.metric)
  );
  const blockers = issues.filter((item) => item.severity === "blocker");
  const advisories = issues.filter((item) => item.severity === "advisory");
  const floorFailures = shows.filter((show) =>
    show.highlight.actual < show.highlight.achievableFloor
  );
  const carryThroughFailures = shows.filter((show) =>
    show.highlight.missingRegisteredMomentsAndCharacters > 0
  );
  const categoryFailures = shows.filter((show) =>
    show.highlight.actual >= 8 &&
    show.categories.actual.length < show.categories.requiredDiversity
  );
  const lateTailFailures = shows.filter((show) =>
    show.lateTail.missingEvidence > 0
  );
  const titleSubjectFailures = shows.filter((show) =>
    show.titleSubjects.missing.length > 0
  );
  const uniqueTopicDoorFailures = shows.filter((show) =>
    show.topicDoors.duplicateCount > 0 ||
    show.topicDoors.visibleUnique < Math.min(3, show.topicDoors.registeredUnique)
  );
  const genericBlockers = blockers.filter((item) =>
    item.metric === "generic-label-dominance"
  );
  const categoryBlockers = blockers.filter((item) =>
    item.metric === "category-diversity"
  );
  const highlightCounts = shows.map((show) => show.highlight.actual);
  const headlineGroups = new Map();
  shows.forEach((show) => {
    const key = clean(show.headline);
    if (!key) return;
    if (!headlineGroups.has(key)) headlineGroups.set(key, []);
    headlineGroups.get(key).push(show);
  });
  const repeatedHeadlines = Array.from(headlineGroups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([headline, group]) => ({
      headline,
      sourceIds: group.map((show) => show.sourceId),
      titles: group.map((show) => show.title),
    }));

  const gates = {
    runtimeHighlightFloorsPass: floorFailures.length === 0,
    uncappedMomentCharacterCarryThroughPass:
      carryThroughFailures.length === 0,
    categoryDiversityPass: categoryBlockers.length === 0,
    lateTailCoveragePass: lateTailFailures.length === 0,
    titleSubjectPresencePass: titleSubjectFailures.length === 0,
    uniqueTopicDoorsPass: uniqueTopicDoorFailures.length === 0,
    noGenericLabelBlockers: genericBlockers.length === 0,
    uniqueEpisodeHeadlinesPass: repeatedHeadlines.length === 0,
  };
  const summary = {
    schema: "wwam-episode-depth-audit-summary/v1",
    generatedAt: new Date().toISOString(),
    corpus: {
      canonicalSources: allSources.length,
      readySources: readySources.length,
      heldSources: allSources.length - readySources.length,
      auditedReadySources: shows.length,
      runtimeBands: countBy(shows, (show) => show.runtimeBand),
    },
    highlightDepth: {
      total: highlightCounts.reduce((total, value) => total + value, 0),
      average: average(highlightCounts),
      minimum: highlightCounts.length ? Math.min(...highlightCounts) : 0,
      p25: percentile(highlightCounts, 0.25),
      median: percentile(highlightCounts, 0.5),
      p75: percentile(highlightCounts, 0.75),
      maximum: highlightCounts.length ? Math.max(...highlightCounts) : 0,
      showsOver15: shows.filter((show) => show.highlight.actual > 15).length,
      showsOver20: shows.filter((show) => show.highlight.actual > 20).length,
      floorFailures: floorFailures.length,
      carryThroughFailures: carryThroughFailures.length,
    },
    categoryDiversity: {
      failures: categoryFailures.length,
      averageVisibleCategories: average(
        shows.map((show) => show.categories.actual.length),
      ),
    },
    lateTailCoverage: {
      showsWithLateEvidence: shows.filter((show) =>
        show.lateTail.availableEvidence > 0
      ).length,
      failures: lateTailFailures.length,
    },
    titleSubjects: {
      registered: shows.reduce(
        (total, show) => total + show.titleSubjects.registered.length,
        0,
      ),
      failures: titleSubjectFailures.length,
    },
    topicDoors: {
      averageVisibleUnique: average(
        shows.map((show) => show.topicDoors.visibleUnique),
      ),
      failures: uniqueTopicDoorFailures.length,
    },
    genericLabels: {
      blockerShows: genericBlockers.length,
      advisoryShows: advisories.filter((item) =>
        item.metric === "generic-label-dominance"
      ).length,
      averagePercent: average(
        shows.map((show) => show.labels.genericPercent),
      ),
    },
    headlineUniqueness: {
      populated: headlineGroups.size,
      repeatedGroups: repeatedHeadlines.length,
      collisions: repeatedHeadlines,
    },
    issues: {
      blockers: blockers.length,
      advisories: advisories.length,
      byMetric: countBy(issues, (item) =>
        `${item.severity}:${item.metric}`
      ),
      topBlockers: blockers.slice(0, 20).map((item) => ({
        sourceId: item.sourceId,
        metric: item.metric,
        score: item.score,
      })),
    },
    gates,
    pass: Object.values(gates).every(Boolean),
  };

  return {
    schema: "wwam-episode-depth-audit/v1",
    summary,
    shows,
    rankedIssues: issues,
  };
}

function printHuman(report) {
  const summary = report.summary;
  const ranked = report.rankedIssues;
  const lines = [
    "WWAM ALL-CORPUS EPISODE DEPTH AUDIT",
    `Sources: ${summary.corpus.canonicalSources} canonical // ${summary.corpus.readySources} ready // ${summary.corpus.heldSources} held // ${summary.corpus.auditedReadySources} audited`,
    `Highlights: ${summary.highlightDepth.total} total // ${summary.highlightDepth.average} average // ${summary.highlightDepth.minimum}-${summary.highlightDepth.maximum} range // p25 ${summary.highlightDepth.p25} // median ${summary.highlightDepth.median} // p75 ${summary.highlightDepth.p75}`,
    `Uncapped depth: ${summary.highlightDepth.showsOver15} shows over 15 // ${summary.highlightDepth.showsOver20} shows over 20`,
    `Runtime floors: ${summary.highlightDepth.floorFailures} failures`,
    `Moment/character carry-through: ${summary.highlightDepth.carryThroughFailures} failures`,
    `Category diversity: ${summary.categoryDiversity.failures} failures // ${summary.categoryDiversity.averageVisibleCategories} average visible lanes`,
    `Late tail: ${summary.lateTailCoverage.showsWithLateEvidence} shows with final-quarter evidence // ${summary.lateTailCoverage.failures} failures`,
    `Title subjects: ${summary.titleSubjects.registered} registered // ${summary.titleSubjects.failures} failures`,
    `Topic doors: ${summary.topicDoors.averageVisibleUnique} average unique // ${summary.topicDoors.failures} failures`,
    `Generic labels: ${summary.genericLabels.blockerShows} blockers // ${summary.genericLabels.advisoryShows} advisories // ${summary.genericLabels.averagePercent}% corpus average`,
    `Episode headlines: ${summary.headlineUniqueness.populated} populated // ${summary.headlineUniqueness.repeatedGroups} repeated groups`,
    `Issues: ${summary.issues.blockers} blockers // ${summary.issues.advisories} advisories`,
    `DEPTH RELEASE GATE: ${summary.pass ? "PASS" : "FAIL"}`,
    "",
    "RANKED DEPTH ISSUES",
  ];
  if (!ranked.length) {
    lines.push("    0  NONE");
  } else {
    ranked.slice(0, 60).forEach((item, index) => {
      lines.push(
        `${String(index + 1).padStart(3)}  ${item.severity.toUpperCase().padEnd(8)} ` +
        `${String(item.score).padStart(3)}  ${item.sourceId}  ${item.metric}`,
      );
      lines.push(`     ${item.runtime} // ${item.title}`);
      lines.push(`     ${item.message}`);
    });
  }
  lines.push(
    "",
    `MACHINE_SUMMARY ${JSON.stringify(summary)}`,
  );
  process.stdout.write(`${lines.join("\n")}\n`);
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? clean(process.argv[index + 1]) : "";
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = auditEpisodeDepth({
    withoutArchiveCompletion: process.argv.includes(
      "--without-archive-completion",
    ),
    sourceId: optionValue("--source"),
  });
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (process.argv.includes("--summary-json")) {
    process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);
  } else {
    printHuman(report);
  }
  if (process.argv.includes("--check") && !report.summary.pass) {
    process.exitCode = 1;
  }
}
