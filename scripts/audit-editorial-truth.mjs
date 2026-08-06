import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  compileCanonicalRecaps,
} from "./audit-episode-recap-copy-quality.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_DEMO = path.join(ROOT, "public", "demo");
const SCHEMA = "wwam-editorial-truth-audit/v1";
const HUMAN_REVIEW_STATE = "full-tape-human-editorial-read";
const STRUCTURED_REVIEW_STATE = "structured-source-summary";

const MOJIBAKE_PATTERN =
  /[\uFFFD\u00C3\u00C2]|\u00E2[\u0080-\u00BF]|(?:â€|ðŸ|ï¿½)/u;
const RAW_CAPTION_PATTERN =
  /(?:^|\s)(?:>>|>>>)(?:\s|$)|-->|<\/?(?:c|v|lang)\b|\[(?:__+|_+|inaudible|crosstalk)\]/i;
const TEMPLATE_PATTERN =
  /\{\{[^}]*\}\}|\$\{[^}]*\}|<%=?[^%]*%>|\[object Object\]|\b(?:undefined|NaN)\b/i;
const BACKEND_JARGON_PATTERNS = [
  [
    "machine-state",
    /\b(?:machine[- ]surfaced|machine[- ]candidate|machine[- ]generated|review[- ]quarantined)\b/i,
  ],
  [
    "source-routing",
    /\b(?:source[- ]local|source[- ]bounded|exact[- ]source map|canonical source|source receipt|topic receipt)\b/i,
  ],
  [
    "internal-contract",
    /\b(?:evidence basis|review state|promotion allowed|runtime band|schema payload|full payload public)\b/i,
  ],
  [
    "unverified-speaker-boilerplate",
    /\b(?:speaker identity remains unset|speaker attribution remains unset|not[- ]diarized)\b/i,
  ],
  [
    "machine-recap-formula",
    /\b(?:reaches the source at|recurring source map|route opens at|remains attached to the source)\b/i,
  ],
];

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

function normalized(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function wordCount(value) {
  return (clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [])
    .length;
}

function sameText(left, right) {
  return clean(left) === clean(right);
}

function humanMarker(recap) {
  recap = record(recap);
  return (
    clean(recap.editorialState) === HUMAN_REVIEW_STATE ||
    record(recap.caseFile).humanEditorialRead === true ||
    record(recap.editorialEvidence).humanEditorialRead === true ||
    recap.humanEditorialReviewPerformed === true
  );
}

function humanEvidenceLeak(recap) {
  recap = record(recap);
  return (
    array(recap.story).some((item) =>
      /human-editorial/i.test(
        `${clean(item?.evidenceBasis)} ${clean(record(item?.narrative).kind)}`,
      )
    ) ||
    array(recap.bestMoments).some((item) =>
      /human-editorial/i.test(
        `${clean(item?.kind)} ${clean(item?.evidenceBasis)} ${clean(item?.reviewState)}`,
      )
    ) ||
    array(recap.highlightRunway).some((item) =>
      /human-editorial/i.test(
        `${clean(item?.kind)} ${clean(item?.evidenceBasis)} ${clean(item?.reviewState)}`,
      )
    )
  );
}

function minimumDepth(duration) {
  if (duration >= 10800) return { story: 10, highlights: 15 };
  if (duration >= 7200) return { story: 8, highlights: 10 };
  if (duration >= 3600) return { story: 5, highlights: 6 };
  return { story: 3, highlights: 4 };
}

function failure(code, sourceId, field, message, extra = {}) {
  return {
    code,
    sourceId: clean(sourceId),
    field: clean(field),
    message: clean(message),
    ...extra,
  };
}

function packFilesIn(demoDir) {
  if (!fs.existsSync(demoDir)) {
    throw new Error(`WWAM demo directory is missing: ${demoDir}`);
  }
  const names = fs.readdirSync(demoDir)
    .filter((name) =>
      /^episode-editorial-packs(?:-[a-z0-9][a-z0-9-]*)?\.js$/i.test(name)
    );
  const base = "episode-editorial-packs.js";
  return names.sort((left, right) => {
    if (left === base) return -1;
    if (right === base) return 1;
    return left.localeCompare(right, "en");
  });
}

export function loadEditorialPackRegistry(demoDir = DEFAULT_DEMO) {
  const files = packFilesIn(demoDir);
  if (!files.length || files[0] !== "episode-editorial-packs.js") {
    throw new Error(
      `Editorial pack registry is missing: ${path.join(demoDir, "episode-editorial-packs.js")}`,
    );
  }
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  files.forEach((name) => {
    vm.runInContext(
      fs.readFileSync(path.join(demoDir, name), "utf8"),
      sandbox,
      { filename: name },
    );
  });
  return {
    files,
    registry: record(sandbox.window.WWAM_EPISODE_EDITORIAL_PACKS),
  };
}

function publicPackFields(pack) {
  const fields = [
    ["label", pack.label, 2],
    ["badge", pack.badge, 2],
    ["headline", pack.headline, 3],
    ["deck", pack.deck, 8],
    ["overview", pack.overview, 12],
  ];
  array(pack.story).forEach((item, index) => {
    fields.push(
      [`story[${index}].label`, item?.label, 2],
      [`story[${index}].body`, item?.body, 6],
    );
    if (clean(item?.excerpt)) {
      fields.push([`story[${index}].excerpt`, item.excerpt, 3]);
    }
  });
  array(pack.highlights).forEach((item, index) => {
    fields.push(
      [`highlights[${index}].category`, item?.category, 1],
      [`highlights[${index}].label`, item?.label, 2],
      [`highlights[${index}].excerpt`, item?.excerpt, 5],
    );
  });
  Object.entries(record(pack.fanRead)).forEach(([key, item]) => {
    item = record(item);
    [
      ["label", item.label, 1],
      ["topic", item.topic, 1],
      ["body", item.body, 6],
      ["excerpt", item.excerpt, 3],
    ].forEach(([name, value, minimum]) => {
      if (clean(value)) {
        fields.push([`fanRead.${key}.${name}`, value, minimum]);
      }
    });
  });
  array(pack.panels).forEach((panel, panelIndex) => {
    panel = record(panel);
    [
      ["eyebrow", panel.eyebrow, 1],
      ["title", panel.title, 2],
      ["intro", panel.intro, 6],
      ["note", panel.note, 6],
    ].forEach(([name, value, minimum]) => {
      if (clean(value)) {
        fields.push([`panels[${panelIndex}].${name}`, value, minimum]);
      }
    });
  });
  return fields;
}

function auditCopy(pack, sourceId, failures) {
  publicPackFields(pack).forEach(([field, value, minimumWords]) => {
    const text = clean(value);
    if (!text) {
      failures.push(failure(
        "copy-empty",
        sourceId,
        field,
        "Required public editorial copy is empty.",
      ));
      return;
    }
    if (wordCount(text) < minimumWords) {
      failures.push(failure(
        "copy-too-thin",
        sourceId,
        field,
        `Public editorial copy has ${wordCount(text)} words; minimum is ${minimumWords}.`,
        { text },
      ));
    }
    if (MOJIBAKE_PATTERN.test(text)) {
      failures.push(failure(
        "copy-mojibake",
        sourceId,
        field,
        "Public editorial copy contains broken character encoding.",
        { text },
      ));
    }
    if (RAW_CAPTION_PATTERN.test(text)) {
      failures.push(failure(
        "copy-raw-caption",
        sourceId,
        field,
        "Public editorial copy contains raw caption debris.",
        { text },
      ));
    }
    if (TEMPLATE_PATTERN.test(text)) {
      failures.push(failure(
        "copy-template-or-code",
        sourceId,
        field,
        "Public editorial copy contains a template, code, or missing-value leak.",
        { text },
      ));
    }
    BACKEND_JARGON_PATTERNS.forEach(([kind, pattern]) => {
      if (!pattern.test(text)) return;
      failures.push(failure(
        "copy-backend-jargon",
        sourceId,
        field,
        `Public editorial copy leaks backend language (${kind}).`,
        { kind, text },
      ));
    });
  });
}

function auditTimedEntries(
  values,
  kind,
  sourceId,
  duration,
  minimum,
  failures,
) {
  const entries = array(values);
  if (entries.length < minimum) {
    failures.push(failure(
      `${kind}-below-floor`,
      sourceId,
      kind,
      `${kind} has ${entries.length} entries; this runtime requires at least ${minimum}.`,
      { actual: entries.length, minimum, duration },
    ));
  }

  const windows = new Map();
  const labels = new Map();
  let previousAt = -1;
  entries.forEach((item, index) => {
    item = record(item);
    const field = `${kind}[${index}]`;
    const at = Number(item.at);
    const end = Number(item.end);
    if (
      !Number.isFinite(at) ||
      !Number.isFinite(end) ||
      at < 0 ||
      end <= at ||
      end > duration
    ) {
      failures.push(failure(
        `${kind}-out-of-bounds`,
        sourceId,
        field,
        `${kind} entry must satisfy 0 <= at < end <= ${duration}.`,
        { at: item.at, end: item.end, duration },
      ));
    }
    if (Number.isFinite(at) && at < previousAt) {
      failures.push(failure(
        `${kind}-not-chronological`,
        sourceId,
        field,
        `${kind} entries must be ordered by their source timestamp.`,
        { at, previousAt },
      ));
    }
    if (Number.isFinite(at)) previousAt = at;

    const windowKey = Number.isFinite(at) && Number.isFinite(end)
      ? `${at}:${end}`
      : "";
    if (windowKey) {
      if (windows.has(windowKey)) {
        failures.push(failure(
          `${kind}-duplicate-window`,
          sourceId,
          field,
          `${kind} duplicates the source window used by ${kind}[${windows.get(windowKey)}].`,
          { window: windowKey },
        ));
      } else {
        windows.set(windowKey, index);
      }
    }

    const labelKey = normalized(item.label);
    if (labelKey) {
      if (labels.has(labelKey)) {
        failures.push(failure(
          `${kind}-duplicate-label`,
          sourceId,
          field,
          `${kind} duplicates the label used by ${kind}[${labels.get(labelKey)}].`,
          { label: clean(item.label) },
        ));
      } else {
        labels.set(labelKey, index);
      }
    }
  });
}

function auditCharacterSemantics(pack, sourceId, failures) {
  array(pack.highlights).forEach((item, index) => {
    item = record(item);
    const category = normalized(item.category);
    const people = array(item.characters).map(clean).filter(Boolean);
    const performance = category === "character performance";
    if (performance && !people.length) {
      failures.push(failure(
        "character-performance-unconfirmed",
        sourceId,
        `highlights[${index}].characters`,
        "A CHARACTER PERFORMANCE highlight must name the performed character or characters.",
      ));
    }
    if (!performance && people.length) {
      failures.push(failure(
        "character-reference-promoted",
        sourceId,
        `highlights[${index}].characters`,
        "Character names may create performance receipts only when the category is exactly CHARACTER PERFORMANCE.",
        { category: clean(item.category), characters: people },
      ));
    }
    if (new Set(people.map(normalized)).size !== people.length) {
      failures.push(failure(
        "character-performance-duplicate",
        sourceId,
        `highlights[${index}].characters`,
        "A character performance names the same character more than once.",
        { characters: people },
      ));
    }
  });
}

function auditFanReadBounds(pack, sourceId, duration, failures) {
  Object.entries(record(pack.fanRead)).forEach(([key, item]) => {
    item = record(item);
    if (!Object.keys(item).length) return;
    const at = Number(item.at);
    const end = Number(item.end);
    if (
      !Number.isFinite(at) ||
      !Number.isFinite(end) ||
      at < 0 ||
      end <= at ||
      end > duration
    ) {
      failures.push(failure(
        "fan-read-out-of-bounds",
        sourceId,
        `fanRead.${key}`,
        `Fan-read window must satisfy 0 <= at < end <= ${duration}.`,
        { at: item.at, end: item.end, duration },
      ));
    }
  });
}

function auditApplication(file, pack, failures) {
  const sourceId = clean(file.id);
  const recap = record(file.recap);
  if (clean(recap.editorialState) !== HUMAN_REVIEW_STATE) {
    failures.push(failure(
      "pack-not-applied",
      sourceId,
      "recap.editorialState",
      "The compiled recap did not apply its human editorial pack.",
      {
        expected: HUMAN_REVIEW_STATE,
        actual: clean(recap.editorialState),
      },
    ));
    return;
  }
  if (!humanMarker(recap)) {
    failures.push(failure(
      "pack-human-marker-missing",
      sourceId,
      "recap.caseFile.humanEditorialRead",
      "The applied pack is missing the explicit human-read marker.",
    ));
  }

  [
    "label",
    "badge",
    "headline",
    "deck",
    "overview",
  ].forEach((field) => {
    if (sameText(recap[field], pack[field])) return;
    failures.push(failure(
      "pack-copy-not-applied",
      sourceId,
      `recap.${field}`,
      `Compiled ${field} does not exactly match the human editorial pack.`,
      { expected: clean(pack[field]), actual: clean(recap[field]) },
    ));
  });

  const recapStory = array(recap.story);
  const packStory = array(pack.story);
  if (recapStory.length !== packStory.length) {
    failures.push(failure(
      "pack-story-count-mismatch",
      sourceId,
      "recap.story",
      "Compiled story count does not match the human editorial pack.",
      { expected: packStory.length, actual: recapStory.length },
    ));
  }
  packStory.forEach((item, index) => {
    const applied = record(recapStory[index]);
    const appliedBody = clean(applied.editorialBody || applied.body);
    if (
      Number(applied.at) === Number(item.at) &&
      Number(applied.end) === Number(item.end) &&
      sameText(applied.label, item.label) &&
      sameText(appliedBody, item.body)
    ) return;
    failures.push(failure(
      "pack-story-entry-mismatch",
      sourceId,
      `recap.story[${index}]`,
      "Compiled story entry does not exactly match the human editorial pack.",
    ));
  });

  const recapHighlights = array(recap.highlightRunway);
  const packHighlights = array(pack.highlights);
  if (recapHighlights.length !== packHighlights.length) {
    failures.push(failure(
      "pack-highlight-count-mismatch",
      sourceId,
      "recap.highlightRunway",
      "Compiled highlight count does not match the human editorial pack.",
      { expected: packHighlights.length, actual: recapHighlights.length },
    ));
  }
  packHighlights.forEach((item, index) => {
    const applied = record(recapHighlights[index]);
    if (
      Number(applied.at) === Number(item.at) &&
      Number(applied.end) === Number(item.end) &&
      sameText(applied.category, item.category) &&
      sameText(applied.label, item.label) &&
      sameText(applied.excerpt, item.excerpt)
    ) return;
    failures.push(failure(
      "pack-highlight-entry-mismatch",
      sourceId,
      `recap.highlightRunway[${index}]`,
      "Compiled highlight entry does not exactly match the human editorial pack.",
    ));
  });

  if (
    Number(record(recap.editorialEvidence).duration) !==
    Number(record(pack.evidence).duration)
  ) {
    failures.push(failure(
      "pack-evidence-not-applied",
      sourceId,
      "recap.editorialEvidence.duration",
      "Compiled editorial evidence does not retain the pack's exact duration.",
    ));
  }
}

function auditSafeGeneric(file, hasPack, failures) {
  const sourceId = clean(file.id);
  const recap = record(file.recap);
  if (clean(recap.editorialState) !== STRUCTURED_REVIEW_STATE || hasPack) {
    return;
  }
  if (clean(recap.deck)) {
    failures.push(failure(
      "structured-summary-public-deck",
      sourceId,
      "recap.deck",
      "A structured-source summary may not publish an authored deck.",
      { text: clean(recap.deck) },
    ));
  }
  if (
    recap.storyPublic === true ||
    recap.publicStory === true ||
    array(recap.publicStory).length ||
    array(recap.publishedStory).length
  ) {
    failures.push(failure(
      "structured-summary-public-story",
      sourceId,
      "recap.publicStory",
      "A structured-source summary may keep machine navigation internally, but may not expose it as the written story.",
    ));
  }
  if (humanMarker(recap) || humanEvidenceLeak(recap)) {
    failures.push(failure(
      "structured-summary-fake-human",
      sourceId,
      "recap.editorialState",
      "An unfinished structured-source summary carries a human-editorial marker or human evidence.",
    ));
  }
  if (array(recap.editorialPanels).length) {
    failures.push(failure(
      "structured-summary-editorial-panels",
      sourceId,
      "recap.editorialPanels",
      "Human-authored editorial panels may not appear on an unfinished structured-source summary.",
    ));
  }
}

export function auditEditorialTruth(
  compiledFiles,
  registry,
  options = {},
) {
  const files = array(compiledFiles).map(record);
  registry = record(registry);
  const sources = record(registry.sources);
  const failures = [];
  const ready = files.filter((file) => clean(file.state) === "ready");
  const held = files.filter((file) => clean(file.state) !== "ready");
  const fileGroups = new Map();
  files.forEach((file) => {
    const id = clean(file.id);
    if (!fileGroups.has(id)) fileGroups.set(id, []);
    fileGroups.get(id).push(file);
  });
  fileGroups.forEach((group, sourceId) => {
    if (sourceId && group.length === 1) return;
    failures.push(failure(
      "canonical-source-identity-not-unique",
      sourceId,
      "compiledFiles",
      `Canonical source identity resolves to ${group.length} compiled entries.`,
    ));
  });

  if (clean(registry.schema) !== "shokker-episode-editorial-packs/v1") {
    failures.push(failure(
      "registry-schema",
      "",
      "registry.schema",
      "Editorial pack registry schema is missing or unsupported.",
      { actual: clean(registry.schema) },
    ));
  }

  const humanPacks = Object.entries(sources)
    .filter(([, pack]) =>
      clean(record(pack).reviewState) === HUMAN_REVIEW_STATE
    );
  const humanPackIds = new Set(humanPacks.map(([sourceId]) => clean(sourceId)));

  humanPacks.forEach(([registryId, rawPack]) => {
    const pack = record(rawPack);
    const sourceId = clean(registryId);
    if (clean(pack.sourceId) !== sourceId) {
      failures.push(failure(
        "pack-source-id-mismatch",
        sourceId,
        "pack.sourceId",
        "Pack sourceId must exactly match its registry key.",
        { expected: sourceId, actual: clean(pack.sourceId) },
      ));
    }
    const matches = fileGroups.get(sourceId) || [];
    if (matches.length !== 1) {
      failures.push(failure(
        "pack-source-not-found",
        sourceId,
        "compiledFiles",
        "Human editorial pack must resolve to exactly one canonical source.",
        { matches: matches.length },
      ));
      return;
    }
    const file = matches[0];
    const duration = Number(record(file.source).duration);
    const declaredDuration = Number(record(pack.evidence).duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      failures.push(failure(
        "canonical-duration-invalid",
        sourceId,
        "source.duration",
        "Canonical source duration must be a positive finite number.",
        { actual: record(file.source).duration },
      ));
      return;
    }
    if (declaredDuration !== duration) {
      failures.push(failure(
        "pack-duration-mismatch",
        sourceId,
        "pack.evidence.duration",
        "Human editorial pack duration must exactly equal the canonical source duration.",
        { expected: duration, actual: record(pack.evidence).duration },
      ));
    }
    if (clean(file.state) !== "ready") {
      failures.push(failure(
        "pack-source-not-ready",
        sourceId,
        "file.state",
        "A human editorial pack may only apply to a ready canonical source.",
        { actual: clean(file.state) },
      ));
    }

    const floors = minimumDepth(duration);
    auditTimedEntries(
      pack.story,
      "story",
      sourceId,
      duration,
      floors.story,
      failures,
    );
    auditTimedEntries(
      pack.highlights,
      "highlights",
      sourceId,
      duration,
      floors.highlights,
      failures,
    );
    auditFanReadBounds(pack, sourceId, duration, failures);
    auditCharacterSemantics(pack, sourceId, failures);
    auditCopy(pack, sourceId, failures);
    auditApplication(file, pack, failures);
  });

  ready.forEach((file) => {
    auditSafeGeneric(file, humanPackIds.has(clean(file.id)), failures);
    if (
      options.requireAllHuman === true &&
      !humanPackIds.has(clean(file.id))
    ) {
      failures.push(failure(
        "ready-source-missing-human-pack",
        file.id,
        "registry.sources",
        "Ready canonical source does not yet have a full-tape human editorial pack.",
      ));
    }
  });

  const counts = failures.reduce((output, item) => {
    output[item.code] = (output[item.code] || 0) + 1;
    return output;
  }, {});
  const humanApplied = ready.filter((file) =>
    humanPackIds.has(clean(file.id)) &&
    clean(record(file.recap).editorialState) === HUMAN_REVIEW_STATE &&
    humanMarker(file.recap)
  ).length;
  const safeStructured = ready.filter((file) =>
    !humanPackIds.has(clean(file.id)) &&
    clean(record(file.recap).editorialState) === STRUCTURED_REVIEW_STATE &&
    !clean(record(file.recap).deck) &&
    !humanMarker(file.recap) &&
    !humanEvidenceLeak(file.recap)
  ).length;
  const missingHuman = ready.filter((file) =>
    !humanPackIds.has(clean(file.id))
  ).length;
  const affectedSources = new Set(
    failures.map((item) => item.sourceId).filter(Boolean),
  ).size;

  return {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    mode: options.requireAllHuman === true
      ? "require-all-human"
      : "safe-progressive-release",
    corpus: {
      canonicalSources: files.length,
      ready: ready.length,
      held: held.length,
      registryEntries: Object.keys(sources).length,
      humanPacks: humanPacks.length,
      humanApplied,
      safeStructured,
      missingHuman,
    },
    floors: {
      underOneHour: { story: 3, highlights: 4 },
      oneToTwoHours: { story: 5, highlights: 6 },
      twoToThreeHours: { story: 8, highlights: 10 },
      threeHoursAndUp: { story: 10, highlights: 15 },
      maximum: null,
    },
    counts,
    affectedSources,
    pass: failures.length === 0,
    failures,
  };
}

export function editorialTruthSummary(report) {
  return {
    schema: report.schema,
    generatedAt: report.generatedAt,
    mode: report.mode,
    corpus: report.corpus,
    floors: report.floors,
    counts: report.counts,
    affectedSources: report.affectedSources,
    pass: report.pass,
  };
}

function humanOutput(report, registryFiles) {
  const c = report.corpus;
  const lines = [
    "WWAM EDITORIAL TRUTH AUDIT",
    `Mode: ${report.mode}`,
    `Registry: ${registryFiles.join(" -> ")}`,
    `Canon: ${c.canonicalSources} sources // ${c.ready} ready // ${c.held} held`,
    `Human packs: ${c.humanPacks} registered // ${c.humanApplied} applied`,
    `Safe unfinished summaries: ${c.safeStructured} // human packs still needed: ${c.missingHuman}`,
    "Depth floors: <1h 3/4 // 1-2h 5/6 // 2-3h 8/10 // 3h+ 10/15 // NO CAPS",
    `EDITORIAL TRUTH GATE: ${report.pass ? "PASS" : "FAIL"}`,
  ];
  if (!report.pass) {
    lines.push(
      "",
      `${report.failures.length} failure(s) across ${report.affectedSources} source(s):`,
      ...report.failures.slice(0, 24).map((item) =>
        `  ${item.sourceId || "REGISTRY"}  ${item.field || "n/a"}  ${item.code}  ${item.message}`
      ),
    );
    if (report.failures.length > 24) {
      lines.push(`  ... ${report.failures.length - 24} more failure(s); use --json for all.`);
    }
  }
  return `${lines.join("\n")}\n`;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(SCRIPT_PATH)) {
  const demoFlag = process.argv.indexOf("--demo-dir");
  const demoDir = demoFlag >= 0
    ? path.resolve(clean(process.argv[demoFlag + 1]))
    : DEFAULT_DEMO;
  if (
    demoFlag >= 0 &&
    (!clean(process.argv[demoFlag + 1]) ||
      clean(process.argv[demoFlag + 1]).startsWith("--"))
  ) {
    throw new Error("--demo-dir requires a directory path.");
  }
  const loaded = loadEditorialPackRegistry(demoDir);
  const compiled = compileCanonicalRecaps();
  const report = auditEditorialTruth(compiled, loaded.registry, {
    requireAllHuman: process.argv.includes("--require-all-human"),
  });
  if (process.argv.includes("--summary-json")) {
    process.stdout.write(
      `${JSON.stringify(editorialTruthSummary(report), null, 2)}\n`,
    );
  } else if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(humanOutput(report, loaded.files));
  }
  if (process.argv.includes("--check") && !report.pass) {
    process.exitCode = 1;
  }
}
