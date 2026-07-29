import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEMO = path.join(ROOT, "public", "demo");
const SCHEMA = "wwam-recap-voice-diversity-audit/v1";
const DEFAULT_LIMIT_PERCENT = 10;
const WITHOUT_ARCHIVE_COMPLETION =
  process.argv.includes("--without-archive-completion");

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
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "wwam-source-dossier-adapter.js",
];

const EVIDENCE_LABELS = [
  "Straight to Steve's Asshole",
  "Steve's Asshole",
  "WWAM Up In Ya",
  "Take Gets Nuclear",
  "Franchise Felony",
  "Character Performance",
  "Saved Checkpoint",
  "Full Send",
  "Room Break",
  "Breakdown",
  "Kill Room",
  "Love Letter",
  "Film Read",
  "Out of Pocket",
];

const DRY_INVENTORY_PATTERNS = [
  ["indexed-stretch", /\bindexed stretch\b/i],
  ["registered-stretch", /\bregistered stretch\b/i],
  ["source-bound-route", /\bsource-bound route\b/i],
  ["timestamp-ledger", /\btimestamp ledger\b/i],
  ["named-character-register", /\bnamed-character register\b/i],
  ["registered-doors", /\bregistered doors\b/i],
  ["source-register", /\bsource register\b/i],
  ["indexed-conversation", /\bindexed conversation\b/i],
  ["receipts-accounted-for", /\breceipts? accounted for\b/i],
  ["topic-board-inventory", /\btopic board (?:pins|registers|names|lists)\b/i],
];

const MACHINE_ROOM_PATTERNS = [
  ["algorithm", /\balgorithm(?:ic|s)?\b/i],
  ["caption-derived", /\bcaption-derived\b/i],
  ["machine-taxonomy", /\bmachine taxonomy\b/i],
  ["machine-label", /\bmachine label\b/i],
  ["not-diarized", /\bnot-diarized\b/i],
  ["payload", /\bpayload\b/i],
  ["public-excerpt-flag", /\bpublicExcerptAllowed\b/i],
  ["quarantined", /\bquarantined\b/i],
  ["signal-score", /\bsignal score\b/i],
  ["synthetic-bridge", /\bsynthetic bridge\b/i],
];

const DISCLAIMER_PATTERN =
  /\b(?:not (?:a |the )?(?:performer|verdict|substitute)|without (?:assigning|inventing)|playback (?:decides|supplies)|tape decides|performer identity|no public excerpt|source does not establish)\b/i;

function readRuntime() {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  RUNTIME_FILES.filter((file) =>
    file !== "archive-completion.js" ||
    !WITHOUT_ARCHIVE_COMPLETION && fs.existsSync(path.join(DEMO, file))
  ).forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(DEMO, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  if (!sandbox.window.WWAM_ARCHIVE_COMPLETION) {
    sandbox.window.WWAM_ARCHIVE_COMPLETION = Object.freeze({
      streams: Object.freeze([]),
      topicIndex: Object.freeze([]),
      characterIndex: Object.freeze([]),
    });
  }
  return sandbox.window;
}

export function compileReadyRecaps() {
  const runtime = readRuntime();
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
  const archiveSearch = Object.assign({}, base, {
    streams: base.streams.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.streams,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.streams,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.streams,
      runtime.WWAM_ARCHIVE_COMPLETION.streams,
    ),
    topicIndex: base.topicIndex.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.topicIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.topicIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.topicIndex,
      runtime.WWAM_ARCHIVE_COMPLETION.topicIndex,
    ),
    characterIndex: base.characterIndex.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.characterIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.characterIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.characterIndex,
      runtime.WWAM_ARCHIVE_COMPLETION.characterIndex,
    ),
  });
  const dossier = runtime.WWAMSourceDossierAdapter.build({
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
      packFingerprint: "fnv1a32:recap-voice-diversity-audit",
    },
  });

  return dossier.sources
    .filter((source) => source.showWiki?.episodeRecap?.state === "ready")
    .map((source) => ({
      id: source.id,
      title: source.displayTitle || source.title || source.id,
      source,
      recap: source.showWiki.episodeRecap,
      tier: source.showWiki.episodeRecap.tier || "unknown",
      format: source.showWiki.episodeRecap.format?.id || "unknown",
    }));
}

function cleanMojibake(value) {
  return String(value || "")
    .replaceAll("â€œ", "“")
    .replaceAll("â€", "”")
    .replaceAll("â€¦", "…")
    .replaceAll("â€“", "–")
    .replaceAll("â€”", "—")
    .replaceAll("â†’", "→");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizationEntities(file) {
  const recap = file.recap;
  const receiptLabels = (file.source.receipts || []).map((receipt) => receipt.label);
  const sectionLabels = (recap.sections || []).flatMap((section) => [
    section.subject,
    section.anchor,
    ...(section.topicLabels || []),
    ...(section.momentLabels || []),
    ...(section.characterLabels || []),
  ]);
  const storyLabels = (recap.story || []).flatMap((segment) => [
    ...(segment.topicLabels || []),
    ...(segment.momentLabels || []),
    ...(segment.characterLabels || []),
  ]);
  return unique([
    file.id,
    file.title,
    file.source.title,
    file.source.displayTitle,
    ...receiptLabels,
    ...sectionLabels,
    ...storyLabels,
    ...EVIDENCE_LABELS,
  ])
    .map((value) => cleanMojibake(value).trim())
    .filter((value) => value.length >= 4)
    .sort((left, right) => right.length - left.length || left.localeCompare(right));
}

function replaceQuotedText(value) {
  return value
    .replace(/“[^”]*”/g, " __QUOTE__ ")
    .replace(/"[^"]*"/g, " __QUOTE__ ");
}

export function normalizeSentenceMold(value, entities = []) {
  let output = replaceQuotedText(cleanMojibake(value));
  output = output
    .replace(/\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b/g, " __TIME__ ")
    .replace(/\bhttps?:\/\/\S+\b/gi, " __URL__ ");
  entities.forEach((entity) => {
    const flags = entity.length <= 3 ? "g" : "gi";
    output = output.replace(new RegExp(escapeRegExp(entity), flags), " __ENTITY__ ");
  });
  return output
    .replace(/\b\d+(?:[.,]\d+)*(?:st|nd|rd|th|%|x)?\b/gi, " __NUMBER__ ")
    .toLowerCase()
    .replace(/__quote__/g, "<quote>")
    .replace(/__time__/g, "<time>")
    .replace(/__url__/g, "<url>")
    .replace(/__number__/g, "<number>")
    .replace(/__entity__/g, "<entity>")
    .replace(/[^\p{L}\p{N}<>']+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSentences(value) {
  const prepared = replaceQuotedText(cleanMojibake(value))
    .replace(/\s+/g, " ")
    .trim();
  if (!prepared) return [];
  return (prepared.match(/[^.!?]+(?:[.!?]+|$)/g) || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function percent(numerator, denominator) {
  return denominator ? Math.round(numerator / denominator * 1000) / 10 : 0;
}

function makeCohort(name, entries, eligibleRecaps) {
  const byMold = new Map();
  entries.forEach((entry) => {
    if (!entry.mold) return;
    const bucket = byMold.get(entry.mold) || {
      mold: entry.mold,
      occurrences: 0,
      sourceIds: new Set(),
      examples: [],
    };
    bucket.occurrences += 1;
    bucket.sourceIds.add(entry.sourceId);
    if (
      bucket.examples.length < 4 &&
      !bucket.examples.some((example) => example.text === entry.text)
    ) {
      bucket.examples.push({
        sourceId: entry.sourceId,
        tier: entry.tier,
        format: entry.format,
        text: entry.text,
      });
    }
    byMold.set(entry.mold, bucket);
  });
  const top = Array.from(byMold.values())
    .map((bucket) => ({
      mold: bucket.mold,
      occurrences: bucket.occurrences,
      recapCount: bucket.sourceIds.size,
      recapPercent: percent(bucket.sourceIds.size, eligibleRecaps),
      sentencePercent: percent(bucket.occurrences, entries.length),
      examples: bucket.examples,
    }))
    .sort((left, right) =>
      right.recapCount - left.recapCount ||
      right.occurrences - left.occurrences ||
      left.mold.localeCompare(right.mold),
    );
  return {
    name,
    eligibleRecaps,
    sentences: entries.length,
    uniqueMolds: top.length,
    dominantRecapPercent: top[0]?.recapPercent || 0,
    dominantSentencePercent: top[0]?.sentencePercent || 0,
    top: top.slice(0, 20),
  };
}

function sentenceEntry(file, text, field) {
  return {
    sourceId: file.id,
    tier: file.tier,
    format: file.format,
    field,
    text,
    mold: normalizeSentenceMold(text, normalizationEntities(file)),
  };
}

function proseFields(file) {
  const recap = file.recap;
  return [
    { field: "deck", text: recap.deck },
    { field: "overview", text: recap.overview },
    ...(recap.sections || []).map((section, index) => ({
      field: `section[${index}].body`,
      text: section.body,
    })),
    ...(recap.story || []).map((segment, index) => ({
      field: `story[${index}].body`,
      text: segment.body,
    })),
    ...Object.entries(recap.fanRead || {}).map(([lane, item]) => ({
      field: `fanRead.${lane}.body`,
      text: item?.body,
    })),
  ].filter((item) => String(item.text || "").trim());
}

function compactFlag(file, field, text, kind, token) {
  return {
    sourceId: file.id,
    tier: file.tier,
    format: file.format,
    field,
    kind,
    token,
    text,
  };
}

function flagSummary(values) {
  const kinds = unique(values.map((flag) => flag.kind)).sort();
  return {
    occurrences: values.length,
    affectedRecaps: new Set(values.map((flag) => flag.sourceId)).size,
    byKind: Object.fromEntries(kinds.map((kind) => {
      const matching = values.filter((flag) => flag.kind === kind);
      return [
        kind,
        {
          occurrences: matching.length,
          affectedRecaps: new Set(matching.map((flag) => flag.sourceId)).size,
        },
      ];
    })),
    examples: values.slice(0, 50),
  };
}

function lexiconFlags(files) {
  const dryInventory = [];
  const machineRoomJargon = [];
  const formatInappropriate = [];
  const disclaimerSentences = [];

  files.forEach((file) => {
    const entities = normalizationEntities(file);
    proseFields(file).forEach(({ field, text }) => {
      const unquoted = replaceQuotedText(cleanMojibake(text));
      DRY_INVENTORY_PATTERNS.forEach(([kind, pattern]) => {
        if (pattern.test(unquoted)) {
          dryInventory.push(compactFlag(file, field, text, kind, pattern.source));
        }
      });
      MACHINE_ROOM_PATTERNS.forEach(([kind, pattern]) => {
        if (pattern.test(unquoted)) {
          machineRoomJargon.push(compactFlag(file, field, text, kind, pattern.source));
        }
      });
      splitSentences(text).forEach((sentence) => {
        if (DISCLAIMER_PATTERN.test(sentence)) {
          disclaimerSentences.push(sentenceEntry(file, sentence, field));
        }
      });

      const normalized = normalizeSentenceMold(unquoted, entities);
      const incompatible = [];
      if (
        !["movie-commentary", "watch-party", "script-reading"].includes(file.format) &&
        /\bwatchalong (?:file|reel|route)\b/.test(normalized)
      ) {
        incompatible.push("watchalong-language-outside-watchalong");
      }
      if (
        !["ranking-show", "versus-show"].includes(file.format) &&
        /\b(?:ranking scorecard|bracket fights?|bracket robber(?:y|ies))\b/.test(normalized)
      ) {
        incompatible.push("ranking-language-outside-ranking");
      }
      if (
        file.tier === "topic-recap" &&
        /\b(?:defense|prosecution|verdict|loved|hated)\b/.test(normalized)
      ) {
        incompatible.push("assertive-language-in-topic-map");
      }
      incompatible.forEach((kind) => {
        formatInappropriate.push(compactFlag(file, field, text, kind, kind));
      });
    });
  });

  const repeatedDisclaimers = makeCohort(
    "repeated-disclaimers",
    disclaimerSentences,
    files.length,
  ).top.filter((item) => item.recapPercent > DEFAULT_LIMIT_PERCENT);

  return {
    dryInventory: flagSummary(dryInventory),
    repeatedDisclaimers: {
      dominantRecapPercent: repeatedDisclaimers[0]?.recapPercent || 0,
      moldsOverLimit: repeatedDisclaimers,
    },
    machineRoomJargon: flagSummary(machineRoomJargon),
    formatInappropriate: flagSummary(formatInappropriate),
  };
}

export function auditRecapVoiceDiversity(files, options = {}) {
  const limit = Number(options.maxDominantMoldPercent) || DEFAULT_LIMIT_PERCENT;
  const storyFiles = files.filter((file) => (file.recap.story || []).length);
  const bridgeFiles = files.filter((file) => (file.recap.story || []).length > 1);
  const openingEntries = [];
  const bridgeEntries = [];
  const finalEntries = [];
  const sectionOpeningEntries = [];

  storyFiles.forEach((file) => {
    const story = file.recap.story;
    const opening = splitSentences(story[0].body)[0];
    if (opening) openingEntries.push(sentenceEntry(file, opening, "story[0].opening"));

    story.slice(0, -1).forEach((segment, index) => {
      const sentences = splitSentences(segment.body);
      const bridge = sentences.at(-1);
      if (bridge) {
        bridgeEntries.push(sentenceEntry(file, bridge, `story[${index}].bridge`));
      }
    });

    const finalSentences = splitSentences(story.at(-1).body);
    const final = finalSentences.at(-1);
    if (final) {
      finalEntries.push(sentenceEntry(
        file,
        final,
        `story[${story.length - 1}].final`,
      ));
    }
  });

  files.forEach((file) => {
    (file.recap.sections || []).forEach((section, index) => {
      const opening = splitSentences(section.body)[0];
      if (opening) {
        sectionOpeningEntries.push(sentenceEntry(
          file,
          opening,
          `section[${index}].opening`,
        ));
      }
    });
  });

  const cohorts = {
    storyOpening: makeCohort(
      "story-opening",
      openingEntries,
      storyFiles.length,
    ),
    storyBridge: makeCohort(
      "story-bridge",
      bridgeEntries,
      bridgeFiles.length,
    ),
    storyFinal: makeCohort(
      "story-final",
      finalEntries,
      storyFiles.length,
    ),
    sectionOpening: makeCohort(
      "section-opening",
      sectionOpeningEntries,
      files.length,
    ),
  };
  const flags = lexiconFlags(files);
  const gates = {
    storyOpening: {
      actualPercent: cohorts.storyOpening.dominantRecapPercent,
      limitPercent: limit,
      pass: cohorts.storyOpening.dominantRecapPercent <= limit,
    },
    storyBridge: {
      actualPercent: cohorts.storyBridge.dominantRecapPercent,
      limitPercent: limit,
      pass: cohorts.storyBridge.dominantRecapPercent <= limit,
    },
    storyFinal: {
      actualPercent: cohorts.storyFinal.dominantRecapPercent,
      limitPercent: limit,
      pass: cohorts.storyFinal.dominantRecapPercent <= limit,
    },
  };

  return {
    schema: SCHEMA,
    normalization: {
      timestamps: "<time>",
      quotedSourceText: "<quote>",
      evidenceLabels: "<entity>",
      sourceTitles: "<entity>",
      sourceSpecificTopicsMomentsAndCharacters: "<entity>",
      numbers: "<number>",
    },
    thresholds: {
      maxDominantMoldPercent: limit,
      denominator: "unique ready recaps eligible for each sentence role",
      rationale:
        "Ten percent prevents one normalized authored sentence from appearing in roughly one out of every ten eligible show recaps while leaving deterministic voice-pack reuse possible.",
      sectionOpeningMeasure:
        "Section openings repeat within a recap, so their diagnostic share uses total section openings; they are reported but are not part of the one-opening/bridge/final story gate.",
    },
    corpus: {
      ready: files.length,
      tiers: Object.fromEntries(
        Array.from(new Set(files.map((file) => file.tier))).sort().map((tier) => [
          tier,
          files.filter((file) => file.tier === tier).length,
        ]),
      ),
      formats: Object.fromEntries(
        Array.from(new Set(files.map((file) => file.format))).sort().map((format) => [
          format,
          files.filter((file) => file.format === format).length,
        ]),
      ),
    },
    cohorts,
    flags,
    gates,
    pass: Object.values(gates).every((gate) => gate.pass),
  };
}

function summary(report) {
  const lines = [
    "WWAM RECAP VOICE-DIVERSITY AUDIT",
    `Ready recaps: ${report.corpus.ready}`,
    `Gate: no story opening / bridge / final mold above ${report.thresholds.maxDominantMoldPercent}% of eligible ready recaps`,
    "",
  ];
  ["storyOpening", "storyBridge", "storyFinal", "sectionOpening"].forEach((name) => {
    const cohort = report.cohorts[name];
    const dominant = name === "sectionOpening"
      ? `${cohort.dominantSentencePercent}% of section openings`
      : `${cohort.dominantRecapPercent}% of ${cohort.eligibleRecaps} recaps`;
    lines.push(
      `${cohort.name}: ${cohort.uniqueMolds} molds / ${cohort.sentences} sentences / top ${dominant}`,
    );
    cohort.top.slice(0, 3).forEach((item) => {
      const share = name === "sectionOpening"
        ? item.sentencePercent
        : item.recapPercent;
      lines.push(`  ${String(share).padStart(5)}%  ${item.mold}`);
    });
  });
  lines.push(
    "",
    `Dry inventory flags: ${report.flags.dryInventory.occurrences} across ${report.flags.dryInventory.affectedRecaps} recaps`,
    `Repeated disclaimer molds over limit: ${report.flags.repeatedDisclaimers.moldsOverLimit.length}`,
    `Machine-room jargon: ${report.flags.machineRoomJargon.occurrences} across ${report.flags.machineRoomJargon.affectedRecaps} recaps`,
    `Format-inappropriate vocabulary: ${report.flags.formatInappropriate.occurrences} across ${report.flags.formatInappropriate.affectedRecaps} recaps`,
    "",
    `VOICE GATE: ${report.pass ? "PASS" : "FAIL"}`,
  );
  return `${lines.join("\n")}\n`;
}

if (path.resolve(process.argv[1] || "") === path.resolve(SCRIPT_PATH)) {
  const report = auditRecapVoiceDiversity(compileReadyRecaps());
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(summary(report));
  }
  if (process.argv.includes("--check") && !report.pass) {
    process.exitCode = 1;
  }
}
