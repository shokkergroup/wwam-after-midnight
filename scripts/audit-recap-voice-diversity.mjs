import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEMO = path.join(ROOT, "public", "demo");
const SCHEMA = "wwam-recap-readability-audit/v2";
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
  "title-topic-overrides.js",
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

export const RAW_CAPTION_PATTERNS = [
  ["double-chevron", /(?:^|\s)(?:>>|>>>|&gt;&gt;)(?:\s|$)/i],
  ["caption-arrow", /-->/],
  ["caption-cue-tag", /<\/?(?:c|v|lang)(?:\.[^>\s]+)?[^>]*>/i],
  ["caption-stage-direction", /\[(?:music|applause|laughter|inaudible|crosstalk|__+|_+)\]/i],
  ["music-note", /[♪♫]/],
];

export const FORBIDDEN_METAPHOR_PATTERNS = [
  ["after-hours-ledger", /\bafter-hours ledger\b/i],
  ["named-flashlight", /\bnamed flashlight\b/i],
  ["sequel-luggage", /\bsuspicious sequel luggage\b/i],
  ["unsafe-evidence-board", /\bunsafe evidence board\b/i],
  ["plants-the-flag", /\bplants? this reel'?s flag\b/i],
  ["source-clock", /\bsource clock\b/i],
  ["replay-board", /\breplay board\b/i],
  ["source-bound-beat", /\bsource-bound beat\b/i],
  ["starting-cold", /\bstarting cold\b/i],
  ["same-hallway", /\bthe same hallway\b/i],
  ["opens-its-ledger", /\bopens? its (?:after-hours )?ledger\b/i],
  ["evidence-board", /\bevidence board\b/i],
  ["receipt-baton", /\breceipt passes the baton\b/i],
  ["named-suspect", /\bnamed suspect\b/i],
  ["character-cellar", /\bcharacter cellar\b/i],
];

export const SPEAKER_OVERCLAIM_PATTERNS = [
  [
    "named-host-attribution",
    /\b(?:mike|j|jay)\s+(?:said|says|called|calls|argued|argues|thought|thinks|hated|hates|loved|loves|declared|declares)\b/i,
  ],
  [
    "generic-host-attribution",
    /\b(?:the host|a host|one of (?:the hosts|them)|they)\s+(?:said|says|argued|argues|thought|thinks|hated|hates|loved|loves)\b/i,
  ],
  ["speaker-identity-claim", /\b(?:speaker|performer) (?:is|was|says|said)\b/i],
];

export const FIREWALL_COPY_PATTERNS = [
  ["not-proof", /\bnot (?:proof|evidence)\b/i],
  ["kept-separate", /\b(?:kept|keeps?|keeping) (?:the two )?separate\b/i],
  ["separate-saved-spike", /\bseparate (?:saved )?(?:checkpoint|spike)\b/i],
  ["timestamp-not-assigned", /\btimestamp is not assigned\b/i],
  ["playback-decides", /\bplayback (?:decides|supplies|handles|owns)\b/i],
  ["tape-decides", /\btape decides\b/i],
  ["source-does-not-establish", /\bsource does not establish\b/i],
  ["performer-identity", /\bperformer identity\b/i],
  [
    "caption-speaker-firewall",
    /\bcaptions? (?:do|does) not (?:reliably )?(?:identify|establish|assign) (?:the )?(?:host|speaker|performer|voice)\b/i,
  ],
  [
    "transcript-speaker-firewall",
    /\btranscript timing does not (?:identify|establish|assign) (?:the )?(?:host|speaker|performer|voice)\b/i,
  ],
  ["cannot-mime", /\bcannot mime\b/i],
  ["who-said-what", /\bwho said what\b/i],
];

const DISCLAIMER_PATTERN = new RegExp(
  FIREWALL_COPY_PATTERNS.map(([, pattern]) => pattern.source).join("|"),
  "i",
);

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
      registeredRecap: source.showWiki.recap || null,
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
  const registered = file.registeredRecap || file.source.showWiki?.recap || {};
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
    { field: "registeredRecap.overview", text: registered.overview },
    ...(registered.blocks || []).map((block, index) => ({
      field: `registeredRecap.blocks[${index}].body`,
      text: block?.body,
    })),
  ].filter((item) => String(item.text || "").trim());
}

function visibleTextFields(file) {
  const recap = file.recap;
  return [
    ...proseFields(file),
    { field: "headline", text: recap.headline },
    ...(recap.sections || []).map((section, index) => ({
      field: `section[${index}].label`,
      text: section.label,
    })),
    ...(recap.story || []).map((segment, index) => ({
      field: `story[${index}].label`,
      text: segment.label,
    })),
  ].filter((item) => String(item.text || "").trim());
}

function normalizedWords(value) {
  return cleanMojibake(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeEntities(value, entities) {
  let output = cleanMojibake(value);
  entities.forEach((entity) => {
    output = output.replace(
      new RegExp(escapeRegExp(entity), entity.length <= 3 ? "g" : "gi"),
      " ",
    );
  });
  return normalizedWords(output);
}

function rawExcerptReuse(file, field, text) {
  if (!/\.body$/.test(field)) return [];
  const entities = normalizationEntities(file);
  const body = ` ${removeEntities(text, entities)} `;
  if (!body.trim()) return [];
  const failures = [];
  (file.source.receipts || []).forEach((receipt) => {
    const excerpt = removeEntities(receipt?.excerpt, entities);
    const tokens = excerpt.split(/\s+/).filter(Boolean);
    if (tokens.length < 5) return;
    for (let index = 0; index <= tokens.length - 5; index += 1) {
      const phrase = tokens.slice(index, index + 5).join(" ");
      if (` ${body} `.includes(` ${phrase} `)) {
        failures.push({
          receiptKey: String(receipt?.key || ""),
          phrase,
        });
        break;
      }
    }
  });
  return failures;
}

function quoteSalad(value) {
  const text = cleanMojibake(value);
  const spans = [];
  function collect(open, close) {
    let cursor = 0;
    while (cursor < text.length) {
      const start = text.indexOf(open, cursor);
      if (start < 0) return;
      const end = text.indexOf(close, start + open.length);
      if (end < 0) return;
      spans.push(text.slice(start, end + close.length));
      cursor = end + close.length;
    }
  }
  collect('"', '"');
  collect("“", "”");
  const substantial = spans.filter((span) =>
    normalizedWords(span).split(/\s+/).filter(Boolean).length >= 4
  );
  if (substantial.length > 1) return substantial;
  return substantial.filter((span) =>
    normalizedWords(span).split(/\s+/).filter(Boolean).length > 18 ||
    RAW_CAPTION_PATTERNS.some(([, pattern]) => pattern.test(span))
  );
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
  const rawCaptionMarkers = [];
  const forbiddenMetaphors = [];
  const rawExcerptReuseFlags = [];
  const quoteSaladFlags = [];
  const againSuffixes = [];
  const speakerOverclaims = [];
  const firewallCopy = [];

  files.forEach((file) => {
    const entities = normalizationEntities(file);
    visibleTextFields(file).forEach(({ field, text }) => {
      const unquoted = replaceQuotedText(cleanMojibake(text));
      RAW_CAPTION_PATTERNS.forEach(([kind, pattern]) => {
        if (pattern.test(text)) {
          rawCaptionMarkers.push(compactFlag(
            file,
            field,
            text,
            kind,
            pattern.source,
          ));
        }
      });
      FORBIDDEN_METAPHOR_PATTERNS.forEach(([kind, pattern]) => {
        if (pattern.test(unquoted)) {
          forbiddenMetaphors.push(compactFlag(
            file,
            field,
            text,
            kind,
            pattern.source,
          ));
        }
      });
      if (/\/\/\s*AGAIN\b/i.test(text)) {
        againSuffixes.push(compactFlag(
          file,
          field,
          text,
          "again-suffix",
          String.raw`//\s*AGAIN`,
        ));
      }
      SPEAKER_OVERCLAIM_PATTERNS.forEach(([kind, pattern]) => {
        if (pattern.test(unquoted)) {
          speakerOverclaims.push(compactFlag(
            file,
            field,
            text,
            kind,
            pattern.source,
          ));
        }
      });
      FIREWALL_COPY_PATTERNS.forEach(([kind, pattern]) => {
        if (pattern.test(unquoted)) {
          firewallCopy.push(compactFlag(
            file,
            field,
            text,
            kind,
            pattern.source,
          ));
        }
      });
      rawExcerptReuse(file, field, text).forEach((reuse) => {
        rawExcerptReuseFlags.push({
          ...compactFlag(
            file,
            field,
            text,
            "raw-excerpt-reuse",
            reuse.phrase,
          ),
          receiptKey: reuse.receiptKey,
        });
      });
      quoteSalad(text).forEach((span) => {
        quoteSaladFlags.push(compactFlag(
          file,
          field,
          text,
          "multiword-inline-quote",
          span,
        ));
      });
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
        !["ranking-show", "versus-show"].includes(file.format) &&
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
    rawCaptionMarkers: flagSummary(rawCaptionMarkers),
    forbiddenMetaphors: flagSummary(forbiddenMetaphors),
    rawExcerptReuse: flagSummary(rawExcerptReuseFlags),
    quoteSalad: flagSummary(quoteSaladFlags),
    againSuffixes: flagSummary(againSuffixes),
    speakerOverclaims: flagSummary(speakerOverclaims),
    firewallCopy: flagSummary(firewallCopy),
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
    noRawCaptionMarkers: flags.rawCaptionMarkers.occurrences === 0,
    noForbiddenMetaphors: flags.forbiddenMetaphors.occurrences === 0,
    noRawExcerptReuse: flags.rawExcerptReuse.occurrences === 0,
    noQuoteSalad: flags.quoteSalad.occurrences === 0,
    noAgainSuffixes: flags.againSuffixes.occurrences === 0,
    noSpeakerOverclaims: flags.speakerOverclaims.occurrences === 0,
    noFirewallCopy: flags.firewallCopy.occurrences === 0,
    noDryInventory: flags.dryInventory.occurrences === 0,
    noMachineRoomJargon: flags.machineRoomJargon.occurrences === 0,
    noFormatInappropriateLanguage: flags.formatInappropriate.occurrences === 0,
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
        "Sentence molds are diagnostic only. Readability now fails on caption debris, quote reuse, canned metaphors, attribution overclaims, and defensive evidence-firewall prose.",
      sectionOpeningMeasure:
        "Sentence-mold shares remain visible for editorial review but are not release gates; clear deterministic prose is preferable to randomized template noise.",
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
    pass: Object.values(gates).every(Boolean),
  };
}

function summary(report) {
  const lines = [
    "WWAM RECAP READABILITY AUDIT",
    `Ready recaps: ${report.corpus.ready}`,
    "Gate: concise editorial prose must stay free of raw caption debris, quote salad, canned metaphors, and unsupported attribution.",
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
    `Raw caption markers: ${report.flags.rawCaptionMarkers.occurrences}`,
    `Forbidden metaphors: ${report.flags.forbiddenMetaphors.occurrences}`,
    `Raw excerpt reuse: ${report.flags.rawExcerptReuse.occurrences}`,
    `Inline quote salad: ${report.flags.quoteSalad.occurrences}`,
    `// AGAIN suffixes: ${report.flags.againSuffixes.occurrences}`,
    `Speaker overclaims: ${report.flags.speakerOverclaims.occurrences}`,
    `Evidence-firewall copy: ${report.flags.firewallCopy.occurrences}`,
    `Dry inventory flags: ${report.flags.dryInventory.occurrences} across ${report.flags.dryInventory.affectedRecaps} recaps`,
    `Repeated disclaimer molds over limit: ${report.flags.repeatedDisclaimers.moldsOverLimit.length}`,
    `Machine-room jargon: ${report.flags.machineRoomJargon.occurrences} across ${report.flags.machineRoomJargon.affectedRecaps} recaps`,
    `Format-inappropriate vocabulary: ${report.flags.formatInappropriate.occurrences} across ${report.flags.formatInappropriate.affectedRecaps} recaps`,
    "",
    `READABILITY GATE: ${report.pass ? "PASS" : "FAIL"}`,
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
