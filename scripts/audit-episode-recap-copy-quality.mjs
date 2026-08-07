import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  normalizeSentenceMold,
  splitSentences,
} from "./audit-recap-voice-diversity.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEMO = process.env.WWAM_RECAP_COPY_DEMO_DIR
  ? path.resolve(process.env.WWAM_RECAP_COPY_DEMO_DIR)
  : path.join(ROOT, "public", "demo");
const SCHEMA = "wwam-episode-recap-copy-quality-audit/v1";
const PATHOLOGICAL_MOLD_PERCENT = 50;
const MIN_PATHOLOGICAL_MOLD_RECAPS = 25;
const MIN_MOLD_WORDS = 8;
const MIN_DUPLICATE_WORDS = 8;

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
  "episode-editorial-packs-wave70.js",
  "episode-editorial-packs-wave71.js",
  "episode-editorial-packs-wave72.js",
  "episode-editorial-packs-wave73.js",
  "episode-editorial-packs-wave74.js",
  "episode-editorial-packs-wave75.js",
  "episode-editorial-packs-wave76.js",
  "episode-editorial-packs-wave77.js",
  "episode-editorial-packs-wave78.js",
  "episode-editorial-packs-wave79.js",
  "episode-editorial-packs-wave80.js",
  "episode-editorial-packs-wave81.js",
  "episode-editorial-packs-wave82.js",
  "episode-editorial-packs-wave83.js",
  "episode-editorial-packs-wave84.js",
  "episode-editorial-packs-wave85.js",
  "episode-editorial-packs-wave86.js",
  "episode-editorial-packs-wave87.js",
  "episode-editorial-packs-wave88.js",
  "episode-editorial-packs-wave89.js",
  "episode-editorial-packs-wave90.js",
  "episode-editorial-packs-wave91.js",
  "episode-editorial-packs-wave92.js",
  "episode-editorial-packs-wave93.js",
  "episode-editorial-packs-wave94.js",
  "episode-editorial-packs-wave95.js",
  "episode-editorial-packs-wave96.js",
  "episode-editorial-packs-wave97.js",
  "episode-editorial-packs-wave98.js",
  "episode-editorial-packs-wave99.js",
  "episode-editorial-packs-wave100.js",
  "episode-editorial-packs-wave101.js",
  "episode-editorial-packs-wave102.js",
  "episode-editorial-packs-wave103.js",
  "episode-editorial-packs-wave104.js",
  "episode-editorial-packs-wave105.js",
"episode-editorial-packs-wave106.js",
"episode-editorial-packs-wave107.js",
"episode-editorial-packs-wave108.js",
"episode-editorial-packs-wave109.js",
"episode-editorial-packs-wave110.js",
"episode-editorial-packs-wave111.js",
"episode-editorial-packs-wave112.js",
"episode-editorial-packs-wave113.js",
"episode-editorial-packs-wave114.js",
"episode-editorial-packs-wave115.js",
"episode-editorial-packs-wave116.js",
"episode-editorial-packs-wave117.js",
  "episode-editorial-packs-wave118.js",
  "episode-editorial-packs-wave119.js",
  "episode-editorial-packs-wave120.js",
  "episode-editorial-packs-wave121.js",
  "episode-editorial-packs-wave122.js",
  "episode-editorial-packs-wave123.js",
  "episode-editorial-packs-wave124.js",
  "episode-editorial-packs-wave125.js",
  "episode-editorial-packs-wave126.js",
  "episode-editorial-packs-wave127.js",
  "episode-editorial-packs-wave128.js",
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "wwam-source-dossier-adapter.js",
];

const MACHINE_ROOM_PATTERNS = [
  [
    "machine-state",
    /\b(?:machine[- ]surfaced|machine[- ]candidate|not-diarized|quarantined)\b/i,
  ],
  [
    "review-state",
    /\b(?:reviewStatus|evidenceState|promotionAllowed|publicExcerptAllowed|humanEditorialReviewPerformed|creatorApprovalClaimed)\b/i,
  ],
  [
    "fingerprint-or-hash",
    /\b(?:fnv1a32|sha256|sourceFingerprint|evidenceFingerprint|semanticFingerprint)\b/i,
  ],
  [
    "runtime-contract",
    /\b(?:runtime adapter|source dossier adapter|canonical artifact|topic-rebuild|schema payload)\b/i,
  ],
  ["javascript-value", /\b(?:undefined|NaN)\b|\[object Object\]/i],
];

const RAW_EDITORIAL_JARGON_PATTERNS = [
  ["source-local", /\bsource-local\b/i],
  ["source-index", /\bsource index\b/i],
  ["topic-map", /\btopic map\b/i],
  ["replay-lane", /\breplay lane\b/i],
  ["registered-reaction-marker", /\bregistered reaction marker\b/i],
  ["playable-reaction-marker", /\bplayable reaction marker\b/i],
  ["matched-mentions-registered", /\bmatched mentions are registered\b/i],
  ["registered-subjects", /\bregistered subjects?\b/i],
  ["source-bound", /\bsource-bound\b/i],
  [
    "receipt-language",
    /\b(?:source|evidence|topic|clip|timestamp) receipts?\b|\breceipt (?:key|registry|coverage|state)\b/i,
  ],
];

const GIBBERISH_PATTERNS = [
  ["replacement-or-mojibake", /[\uFFFD\u00C3\u00C2]|\u00E2[\u0080-\u00BF]/u],
  ["template-token", /\{\{[^}]*\}\}|\$\{[^}]*\}|<%=?[^%]*%>/],
  ["raw-caption-marker", /(?:^|\s)(?:>>|>>>)(?:\s|$)|-->|<\/?(?:c|v|lang)\b/i],
  [
    "caption-stage-direction",
    /\[(?:music|applause|laughter|inaudible|crosstalk|__+|_+)\]/i,
  ],
  ["code-fragment", /<script\b|\bfunction\s*\(|=>\s*\{/i],
  ["word-loop", /\b([a-z][a-z'-]{1,})\b(?:[\s,.;:!?]+\1\b){3,}/i],
  ["separator-loop", /(?:\/\/\s*){2,}|(?:\.\s*){4,}/],
];

const DANGLING_WORD_PATTERN =
  /\b(?:and|or|but|because|with|to|from|of|the|a|an|which|who|while|when|where|as|at|in|on|for|by)\s*[.!?]?$/i;

function array(value) {
  return Array.isArray(value) ? value : [];
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function normalizeProse(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function percent(numerator, denominator) {
  return denominator
    ? Math.round(numerator / denominator * 1000) / 10
    : 0;
}

function countBy(values, getter) {
  return values.reduce((counts, value) => {
    const key = String(getter(value) || "NONE");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function compactFailure(file, field, kind, text, extra = {}) {
  return {
    sourceId: clean(file.id),
    title: clean(file.title),
    state: clean(file.state),
    tier: clean(file.tier),
    field,
    kind,
    text: clean(text),
    ...extra,
  };
}

function loadRuntime() {
  RUNTIME_FILES.forEach((file) => {
    const filePath = path.join(DEMO, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Recap-copy audit runtime file is missing: ${filePath}`);
    }
  });
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  RUNTIME_FILES.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(DEMO, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

export function compileCanonicalRecaps() {
  const runtime = loadRuntime();
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
      packFingerprint: "fnv1a32:recap-copy-quality-audit",
    },
  });

  return dossier.sources.map((source) => {
    const recap = record(record(source.showWiki).episodeRecap);
    return {
      id: clean(source.id),
      title: clean(source.displayTitle || source.title || source.id),
      state: clean(recap.state || "missing"),
      tier: clean(recap.tier || "unknown"),
      format: clean(record(recap.format).id || "unknown"),
      source,
      recap,
    };
  });
}

function sourceEntities(file) {
  const recap = record(file.recap);
  const story = array(recap.story);
  const sections = array(recap.sections);
  return unique([
    file.id,
    file.title,
    file.source?.title,
    file.source?.displayTitle,
    ...array(recap.topics),
    ...story.flatMap((segment) => [
      segment?.label,
      segment?.narrative?.primarySubject,
      ...(segment?.topicLabels || []),
      ...(segment?.momentLabels || []),
      ...(segment?.characterLabels || []),
    ]),
    ...sections.flatMap((section) => [
      section?.label,
      section?.subject,
      section?.anchor,
      ...(section?.topicLabels || []),
      ...(section?.momentLabels || []),
      ...(section?.characterLabels || []),
    ]),
  ])
    .map(clean)
    .filter((value) => value.length >= 4)
    .sort((left, right) => right.length - left.length);
}

function declaredFields(file) {
  const recap = record(file.recap);
  const structuredSummary =
    clean(recap.editorialState) === "structured-source-summary";
  const humanEditorial =
    clean(recap.editorialState) === "full-tape-human-editorial-read";
  const fields = [
    {
      field: "label",
      text: recap.label,
      role: "label",
      required: true,
    },
    {
      field: "badge",
      text: recap.badge,
      role: "label",
      required: true,
    },
    {
      field: "headline",
      text: recap.headline,
      role: "label",
      required: true,
    },
    {
      field: "deck",
      text: recap.deck,
      role: "prose",
      required: !structuredSummary,
    },
    {
      field: "overview",
      text: recap.overview,
      role: "prose",
      required: true,
    },
    {
      field: "format.label",
      text: record(recap.format).label,
      role: "label",
      required: true,
    },
    {
      field: "approval.disclosure",
      text: record(recap.approval).disclosure,
      role: "disclosure",
      required: true,
    },
    ...array(recap.topics).map((text, index) => ({
      field: `topics[${index}]`,
      text,
      role: "label",
      required: true,
    })),
  ];
  if (!structuredSummary) {
    array(recap.story).forEach((segment, index) => {
      fields.push(
        {
          field: `story[${index}].label`,
          text: segment?.label,
          role: "label",
          required: true,
        },
        {
          field: `story[${index}].body`,
          text: segment?.body,
          role: "prose",
          required: true,
        },
      );
    });
  }
  // A human pack projects its canonical story into `sections` for older
  // consumers, but the visitor UI renders that story once. Auditing both
  // compatibility fields would report public duplication that does not exist.
  if (!structuredSummary && !humanEditorial) {
    array(recap.sections).forEach((section, index) => {
      fields.push(
        {
          field: `sections[${index}].label`,
          text: section?.label,
          role: "label",
          required: true,
        },
        {
          field: `sections[${index}].body`,
          text: section?.body,
          role: "prose",
          required: true,
        },
      );
    });
  }
  if (!structuredSummary) array(recap.bestMoments).forEach((moment, index) => {
    for (const [name, role] of [
      ["label", "label"],
      ["topic", "label"],
      ["why", "prose"],
      ["body", "prose"],
    ]) {
      if (Object.prototype.hasOwnProperty.call(record(moment), name)) {
        fields.push({
          field: `bestMoments[${index}].${name}`,
          text: moment?.[name],
          role,
          required: true,
        });
      }
    }
  });
  if (!structuredSummary) array(recap.highlightRunway).forEach((moment, index) => {
    for (const name of ["label", "category"]) {
      fields.push({
        field: `highlightRunway[${index}].${name}`,
        text: moment?.[name],
        role: "label",
        required: true,
      });
    }
  });
  array(recap.topicMap).forEach((topic, index) => {
    fields.push({
      field: `topicMap[${index}].label`,
      text: topic?.label,
      role: "label",
      required: true,
    });
  });
  Object.entries(record(recap.fanRead)).forEach(([lane, item]) => {
    for (const [name, role] of [
      ["label", "label"],
      ["topic", "label"],
      ["body", "prose"],
    ]) {
      if (Object.prototype.hasOwnProperty.call(record(item), name)) {
        fields.push({
          field: `fanRead.${lane}.${name}`,
          text: item?.[name],
          role,
          required: true,
        });
      }
    }
  });
  return fields;
}

function coreShapeFailures(file) {
  const recap = record(file.recap);
  const failures = [];
  const structuredSummary =
    clean(recap.editorialState) === "structured-source-summary";
  const humanEditorial =
    clean(recap.editorialState) === "full-tape-human-editorial-read";
  if (file.state === "ready" && !structuredSummary) {
    if (!array(recap.story).length) {
      failures.push(compactFailure(
        file,
        "story",
        "ready-recap-has-no-story",
        "",
      ));
    }
    if (!humanEditorial && !array(recap.sections).length) {
      failures.push(compactFailure(
        file,
        "sections",
        "ready-recap-has-no-sections",
        "",
      ));
    }
  }
  return failures;
}

function patternFailures(file, field, patterns) {
  const text = clean(field.text);
  if (!text) return [];
  return patterns.flatMap(([kind, pattern]) =>
    pattern.test(text)
      ? [compactFailure(file, field.field, kind, text)]
      : []
  );
}

function balanceFailures(file, field) {
  const text = clean(field.text);
  if (!text) return [];
  const failures = [];
  for (const [kind, open, close] of [
    ["unbalanced-parentheses", "(", ")"],
    ["unbalanced-brackets", "[", "]"],
    ["unbalanced-braces", "{", "}"],
  ]) {
    const opens = text.split(open).length - 1;
    const closes = text.split(close).length - 1;
    if (opens !== closes) {
      failures.push(compactFailure(
        file,
        field.field,
        kind,
        text,
        { opens, closes },
      ));
    }
  }
  return failures;
}

function fragmentFailures(file, field) {
  if (field.role !== "prose") return [];
  const text = clean(field.text);
  if (!text) return [];
  const failures = [];
  const tokenCount = words(text).length;
  if (tokenCount < 5) {
    failures.push(compactFailure(
      file,
      field.field,
      "prose-too-short",
      text,
      { tokenCount },
    ));
  }
  if (/^[a-z]/.test(text)) {
    failures.push(compactFailure(
      file,
      field.field,
      "lowercase-fragment-opening",
      text,
    ));
  }
  if (!/[.!?]["')\]]?$/.test(text)) {
    failures.push(compactFailure(
      file,
      field.field,
      "missing-terminal-punctuation",
      text,
    ));
  }
  if (DANGLING_WORD_PATTERN.test(text)) {
    failures.push(compactFailure(
      file,
      field.field,
      "dangling-terminal-word",
      text,
    ));
  }
  if (
    /^(?:and|or|but|because|which|who(?!['’]s\b)|while|when|where)\b/i.test(text)
  ) {
    failures.push(compactFailure(
      file,
      field.field,
      "dangling-opening-clause",
      text,
    ));
  }
  return failures;
}

function duplicateProseFailures(file, fields) {
  const prose = fields
    .filter((field) => field.role === "prose" && clean(field.text))
    .map((field) => ({
      field: field.field,
      text: clean(field.text),
      normalized: normalizeProse(field.text),
    }))
    .filter((field) => words(field.normalized).length >= MIN_DUPLICATE_WORDS);
  const groups = new Map();
  prose.forEach((field) => {
    const bucket = groups.get(field.normalized) || [];
    bucket.push(field);
    groups.set(field.normalized, bucket);
  });
  return Array.from(groups.values()).flatMap((group) =>
    group.length > 1
      ? [{
          sourceId: file.id,
          title: file.title,
          state: file.state,
          tier: file.tier,
          kind: "duplicate-prose-within-recap",
          normalized: group[0].normalized,
          fields: group.map((item) => item.field),
          text: group[0].text,
        }]
      : []
  );
}

function repeatedSentenceFailures(file, fields) {
  return fields
    .filter((field) => field.role === "prose" && clean(field.text))
    .flatMap((field) => {
      const sentences = splitSentences(field.text)
        .map((sentence) => ({
          text: sentence,
          normalized: normalizeProse(sentence),
        }))
        .filter((sentence) =>
          words(sentence.normalized).length >= MIN_DUPLICATE_WORDS
        );
      const counts = countBy(sentences, (sentence) => sentence.normalized);
      return sentences.flatMap((sentence, index) =>
        counts[sentence.normalized] > 1 &&
          sentences.findIndex((item) =>
            item.normalized === sentence.normalized
          ) === index
          ? [compactFailure(
              file,
              field.field,
              "repeated-sentence-within-field",
              sentence.text,
              { occurrences: counts[sentence.normalized] },
            )]
          : []
      );
    });
}

function pathologicalMolds(files, fieldsBySource, options) {
  // Structured summaries intentionally share a transparent first-pass frame.
  // They are not published as authored editorial prose, so measure voice
  // repetition only across recaps that claim a finished editorial read.
  const ready = files.filter((file) =>
    file.state === "ready" &&
    clean(record(file.recap).editorialState) !== "structured-source-summary"
  );
  const moldPercent = Number.isFinite(Number(options.pathologicalMoldPercent))
    ? Math.max(0, Math.min(100, Number(options.pathologicalMoldPercent)))
    : PATHOLOGICAL_MOLD_PERCENT;
  const minimumAffectedRecaps = Number.isFinite(
    Number(options.minimumPathologicalMoldRecaps),
  )
    ? Math.max(2, Math.floor(Number(options.minimumPathologicalMoldRecaps)))
    : MIN_PATHOLOGICAL_MOLD_RECAPS;
  const groups = new Map();
  ready.forEach((file) => {
    const entities = sourceEntities(file);
    fieldsBySource.get(file.id)
      .filter((field) => field.role === "prose" && clean(field.text))
      .forEach((field) => {
        splitSentences(field.text).forEach((sentence) => {
          const mold = normalizeSentenceMold(sentence, entities);
          if (words(mold).length < MIN_MOLD_WORDS) return;
          const bucket = groups.get(mold) || {
            mold,
            occurrences: 0,
            sourceIds: new Set(),
            examples: [],
          };
          bucket.occurrences += 1;
          bucket.sourceIds.add(file.id);
          if (
            bucket.examples.length < 4 &&
            !bucket.examples.some((example) => example.text === sentence)
          ) {
            bucket.examples.push({
              sourceId: file.id,
              field: field.field,
              text: sentence,
            });
          }
          groups.set(mold, bucket);
        });
      });
  });
  return Array.from(groups.values())
    .map((group) => ({
      kind: "pathological-cross-corpus-mold",
      mold: group.mold,
      occurrences: group.occurrences,
      affectedRecaps: group.sourceIds.size,
      recapPercent: percent(group.sourceIds.size, ready.length),
      sourceIds: Array.from(group.sourceIds).sort(),
      examples: group.examples,
    }))
    .filter((group) =>
      group.affectedRecaps >= minimumAffectedRecaps &&
      group.recapPercent >= moldPercent
    )
    .sort((left, right) =>
      right.affectedRecaps - left.affectedRecaps ||
      right.occurrences - left.occurrences ||
      left.mold.localeCompare(right.mold)
    );
}

export function auditRecapCopy(files, options = {}) {
  const fieldsBySource = new Map(
    files.map((file) => [file.id, declaredFields(file)]),
  );
  const emptyFields = [];
  const shapeFailures = [];
  const machineRoomLeaks = [];
  const editorialJargonLeaks = [];
  const gibberishLeaks = [];
  const brokenFragments = [];
  const unbalancedPunctuation = [];
  const duplicateProseGroups = [];
  const repeatedSentences = [];

  files.forEach((file) => {
    const fields = fieldsBySource.get(file.id);
    shapeFailures.push(...coreShapeFailures(file));
    fields.forEach((field) => {
      if (field.required && !clean(field.text)) {
        emptyFields.push(compactFailure(
          file,
          field.field,
          "empty-public-copy",
          "",
        ));
        return;
      }
      machineRoomLeaks.push(
        ...patternFailures(file, field, MACHINE_ROOM_PATTERNS),
      );
      editorialJargonLeaks.push(
        ...patternFailures(file, field, RAW_EDITORIAL_JARGON_PATTERNS),
      );
      gibberishLeaks.push(
        ...patternFailures(file, field, GIBBERISH_PATTERNS),
      );
      brokenFragments.push(...fragmentFailures(file, field));
      unbalancedPunctuation.push(...balanceFailures(file, field));
    });
    duplicateProseGroups.push(...duplicateProseFailures(file, fields));
    repeatedSentences.push(...repeatedSentenceFailures(file, fields));
  });

  const crossCorpusMolds = pathologicalMolds(files, fieldsBySource, options);
  const ready = files.filter((file) => file.state === "ready");
  const held = files.filter((file) => file.state === "held");
  const allFields = Array.from(fieldsBySource.values()).flat();
  const proseFields = allFields.filter((field) => field.role === "prose");
  const failures = {
    emptyFields,
    shapeFailures,
    machineRoomLeaks,
    editorialJargonLeaks,
    gibberishLeaks,
    brokenFragments,
    unbalancedPunctuation,
    duplicateProseGroups,
    repeatedSentences,
    pathologicalCrossCorpusMolds: crossCorpusMolds,
  };
  const counts = Object.fromEntries(
    Object.entries(failures).map(([key, values]) => [key, values.length]),
  );
  const gates = {
    everyPublicFieldHasCopy:
      counts.emptyFields === 0 && counts.shapeFailures === 0,
    noMachineRoomLeakage: counts.machineRoomLeaks === 0,
    noRawEditorialJargon: counts.editorialJargonLeaks === 0,
    noGibberishLeakage: counts.gibberishLeaks === 0,
    noBrokenFragments:
      counts.brokenFragments === 0 &&
      counts.unbalancedPunctuation === 0,
    noPathologicalRepeatedProse:
      counts.duplicateProseGroups === 0 &&
      counts.repeatedSentences === 0 &&
      counts.pathologicalCrossCorpusMolds === 0,
  };
  return {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    thresholds: {
      minimumProseWords: 5,
      minimumDuplicateWords: MIN_DUPLICATE_WORDS,
      minimumMoldWords: MIN_MOLD_WORDS,
      pathologicalCrossCorpusMoldPercent:
        Number.isFinite(Number(options.pathologicalMoldPercent))
          ? Math.max(
              0,
              Math.min(100, Number(options.pathologicalMoldPercent)),
            )
          : PATHOLOGICAL_MOLD_PERCENT,
      minimumPathologicalMoldRecaps:
        Number.isFinite(Number(options.minimumPathologicalMoldRecaps))
          ? Math.max(
              2,
              Math.floor(Number(options.minimumPathologicalMoldRecaps)),
            )
          : MIN_PATHOLOGICAL_MOLD_RECAPS,
    },
    corpus: {
      canonicalSourcesCompiled: files.length,
      ready: ready.length,
      held: held.length,
      tiers: countBy(files, (file) => file.tier),
      formats: countBy(files, (file) => file.format),
      publicFieldsAudited: allFields.length,
      proseFieldsAudited: proseFields.length,
      authoredSentencesAudited: proseFields.reduce(
        (total, field) => total + splitSentences(field.text).length,
        0,
      ),
    },
    counts,
    affectedSources: Object.fromEntries(
      Object.entries(failures).map(([key, values]) => [
        key,
        new Set(
          values.flatMap((failure) =>
            failure.sourceId
              ? [failure.sourceId]
              : array(failure.sourceIds).length
                ? failure.sourceIds
                : array(failure.examples).map((example) => example.sourceId)
          ),
        ).size,
      ]),
    ),
    gates,
    pass: Object.values(gates).every(Boolean),
    failures,
  };
}

function reportSummary(report) {
  return {
    schema: report.schema,
    generatedAt: report.generatedAt,
    thresholds: report.thresholds,
    corpus: report.corpus,
    counts: report.counts,
    affectedSources: report.affectedSources,
    gates: report.gates,
    pass: report.pass,
  };
}

function examples(report, key, limit = 6) {
  const failures = report.failures[key] || [];
  if (!failures.length) return ["    0  NONE"];
  return failures.slice(0, limit).map((failure) => {
    const source = failure.sourceId ||
      failure.examples?.[0]?.sourceId ||
      "CROSS-CORPUS";
    const field = failure.field ||
      failure.fields?.join(", ") ||
      `${failure.affectedRecaps || 0} recaps`;
    const label = failure.kind || key;
    return `  ${source}  ${field}  ${label}`;
  });
}

function human(report) {
  const c = report.counts;
  return [
    "WWAM ARCHIVE-WIDE RECAP COPY QUALITY AUDIT",
    `Compiled: ${report.corpus.canonicalSourcesCompiled} canonical // ready ${report.corpus.ready} // held ${report.corpus.held}`,
    `Audited: ${report.corpus.publicFieldsAudited} public fields // ${report.corpus.proseFieldsAudited} prose fields // ${report.corpus.authoredSentencesAudited} sentences`,
    "",
    `Empty public copy: ${c.emptyFields} // shape failures ${c.shapeFailures}`,
    `Machine-room leaks: ${c.machineRoomLeaks} across ${report.affectedSources.machineRoomLeaks} sources`,
    `Raw editorial jargon: ${c.editorialJargonLeaks} across ${report.affectedSources.editorialJargonLeaks} sources`,
    `Gibberish or encoding leaks: ${c.gibberishLeaks} across ${report.affectedSources.gibberishLeaks} sources`,
    `Broken fragments: ${c.brokenFragments} // unbalanced punctuation ${c.unbalancedPunctuation}`,
    `Duplicate prose groups: ${c.duplicateProseGroups} across ${report.affectedSources.duplicateProseGroups} sources`,
    `Repeated sentences inside fields: ${c.repeatedSentences}`,
    `Cross-corpus sentence molds at or above ${report.thresholds.pathologicalCrossCorpusMoldPercent}%: ${c.pathologicalCrossCorpusMolds}`,
    `COPY QUALITY GATE: ${report.pass ? "PASS" : "FAIL"}`,
    "",
    "Raw editorial-jargon examples:",
    ...examples(report, "editorialJargonLeaks"),
    "",
    "Duplicate-prose examples:",
    ...examples(report, "duplicateProseGroups"),
    "",
    "Cross-corpus repetition examples:",
    ...examples(report, "pathologicalCrossCorpusMolds"),
  ].join("\n") + "\n";
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(SCRIPT_PATH)) {
  const sourceFlag = process.argv.indexOf("--source");
  const sourceId = sourceFlag >= 0
    ? clean(process.argv[sourceFlag + 1])
    : "";
  if (sourceFlag >= 0 && (!sourceId || sourceId.startsWith("--"))) {
    throw new Error("--source requires one canonical source ID.");
  }
  const compiled = compileCanonicalRecaps();
  const selected = sourceId
    ? compiled.filter((file) => file.id === sourceId)
    : compiled;
  if (sourceId && !selected.length) {
    throw new Error(`Unknown canonical source: ${sourceId}`);
  }
  const report = auditRecapCopy(selected);
  if (process.argv.includes("--summary-json")) {
    process.stdout.write(`${JSON.stringify(reportSummary(report), null, 2)}\n`);
  } else if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(human(report));
  }
  if (process.argv.includes("--check") && !report.pass) {
    process.exitCode = 1;
  }
}
