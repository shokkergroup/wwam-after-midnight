import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  compileCanonicalRecaps,
} from "./audit-episode-recap-copy-quality.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DOSSIER_UI_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "source-dossier-ui.js",
);

export const PUBLIC_STRUCTURE_AUDIT_SCHEMA =
  "wwam-episode-recap-public-structure-audit/v1";
export const CANONICAL_DOSSIER_COUNT = 510;

const FAILURE_KEYS = [
  "canonicalSourceCountMismatches",
  "structuralShapeFailures",
  "sectionDisplayAtLocalAtMismatches",
  "nonMonotonicVisibleSectionTimes",
  "bodyPlayCoordinateMismatches",
  "storyLabelPrimarySubjectMismatches",
  "storyClockOutsideDisplayWindow",
  "unsafePublicFanReadEvidence",
  "duplicateSectionPayloadsWithoutDistinctLocalCoordinates",
  "incompleteTopicMapsFramedAsComplete",
];

const UNSAFE_FAN_EVIDENCE_PATTERNS = [
  ["quarantined", /\bquarantin(?:e|ed|ing)\b/i],
  [
    "machine-candidate",
    /\bmachine(?:[-\s]+(?:surfaced|candidate)|[-\s]+surfaced[-\s]+candidate)\b/i,
  ],
  [
    "review-required",
    /\b(?:review[-\s]+required|requires?[-\s]+review|review[-\s]+pending|unreviewed)\b/i,
  ],
];

const COMPLETE_TOPIC_FRAME_PATTERNS = [
  [
    "full-map",
    /\bfull\s+(?:source|subject|topic|episode|show|night)\s+(?:map|index|recap|file|route)\b/i,
  ],
  [
    "complete-map",
    /\bcomplete(?:d)?\s+(?:source|subject|topic|episode|show)\s+(?:map|index|recap|file|route)\b/i,
  ],
  ["topic-by-topic", /\btopic[-\s]+by[-\s]+topic\b/i],
  [
    "every-topic",
    /\bevery\s+(?:(?:confirmed|indexed|playable)\s+)?(?:topic|subject|jump|turn)s?\b/i,
  ],
  ["all-topics", /\ball\s+(?:confirmed\s+|indexed\s+)?(?:topics|subjects|jumps|turns)\b/i],
  ["terminal-topic", /\b(?:latest|last|final)\s+topic\b/i],
  ["source-subject-map", /\bsource\s+subject\s+map\b/i],
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

function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function coordinate(value) {
  const numeric = finiteNumber(value);
  return numeric === null ? null : Math.round(numeric);
}

function normalizeSubject(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactFailure(file, field, kind, extra = {}) {
  return {
    sourceId: clean(file.id),
    title: clean(file.title),
    state: clean(file.state),
    tier: clean(file.tier),
    field,
    kind,
    ...extra,
  };
}

function countBy(values, getter) {
  return values.reduce((counts, value) => {
    const key = clean(getter(value)) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

export function parsePublicClockTokens(value) {
  const text = clean(value);
  const clocks = [];
  const pattern = /\b(\d{1,3}):([0-5]\d)(?::([0-5]\d))?\b/g;
  let match;
  while ((match = pattern.exec(text))) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const third = match[3] === undefined ? null : Number(match[3]);
    clocks.push({
      text: match[0],
      seconds: third === null
        ? first * 60 + second
        : first * 3600 + second * 60 + third,
      index: match.index,
    });
  }
  return clocks;
}

function receiptMapFor(file) {
  return new Map(
    array(record(file.source).receipts)
      .map(record)
      .filter((receipt) => clean(receipt.key))
      .map((receipt) => [clean(receipt.key), receipt]),
  );
}

function guideCutMapFor(file) {
  const source = record(file.source);
  const showWiki = record(source.showWiki);
  const guide = record(showWiki.episodeGuide || source.episodeGuide);
  return new Map(
    array(guide.cuts)
      .map(record)
      .filter((cut) => clean(cut.id))
      .map((cut) => [clean(cut.id), cut]),
  );
}

function receiptCoordinate(receipt) {
  return coordinate(
    finiteNumber(receipt.at) === null ? receipt.t : receipt.at,
  );
}

function resolvePublicPlayCoordinate(file, item, receipts) {
  const publicPlayAt = coordinate(item.playAt);
  if (publicPlayAt !== null) {
    return {
      at: publicPlayAt,
      mechanism: "public-play-coordinate",
      key: clean(item.id),
    };
  }
  const guideAnchor = record(item.guideAnchor);
  if (clean(guideAnchor.id)) {
    const at = coordinate(guideAnchor.at);
    return at === null
      ? {
          at: null,
          mechanism: "guide-anchor",
          key: clean(guideAnchor.id),
          reason: "guide anchor has no finite coordinate",
        }
      : {
          at,
          mechanism: "guide-anchor",
          key: clean(guideAnchor.id),
        };
  }

  const anchorReceiptKey = clean(item.anchorReceiptKey);
  const receiptKey = clean(
    anchorReceiptKey || array(item.receiptKeys)[0] || item.receiptKey,
  );
  if (receiptKey) {
    const receipt = receipts.get(receiptKey);
    if (!receipt) {
      return {
        at: null,
        mechanism: "receipt",
        key: receiptKey,
        reason: "public play action references an unregistered receipt",
      };
    }
    const at = receiptCoordinate(receipt);
    return at === null
      ? {
          at: null,
          mechanism: "receipt",
          key: receiptKey,
          reason: "registered receipt has no finite coordinate",
        }
      : {
          at,
          mechanism: "receipt",
          key: receiptKey,
        };
  }

  const guideCutId = clean(item.guideCutId);
  if (guideCutId) {
    const at = coordinate(item.at);
    return at === null
      ? {
          at: null,
          mechanism: "guide-cut",
          key: guideCutId,
          reason: "guide-cut play action has no finite item coordinate",
        }
      : {
          at,
          mechanism: "guide-cut",
          key: guideCutId,
        };
  }

  return {
    at: null,
    mechanism: "none",
    key: "",
    reason: "public card has no resolvable play action",
  };
}

function bodyPlayFailure(file, item, field, receipts) {
  const clocks = parsePublicClockTokens(item.body);
  const play = resolvePublicPlayCoordinate(file, item, receipts);
  if (!clocks.length) {
    return compactFailure(file, field, "missing-body-clock", {
      body: clean(item.body),
      playAt: play.at,
      playMechanism: play.mechanism,
      playKey: play.key,
    });
  }
  if (play.at === null) {
    return compactFailure(file, field, "unresolved-play-coordinate", {
      bodyClock: clocks[0].text,
      bodyAt: clocks[0].seconds,
      playMechanism: play.mechanism,
      playKey: play.key,
      detail: play.reason,
    });
  }
  if (clocks[0].seconds !== play.at) {
    return compactFailure(file, field, "body-play-coordinate-disagreement", {
      bodyClock: clocks[0].text,
      bodyAt: clocks[0].seconds,
      playAt: play.at,
      playMechanism: play.mechanism,
      playKey: play.key,
    });
  }
  return null;
}

function storyLabelSuffix(value) {
  const parts = clean(value)
    .split(/\s*\/\/\s*/)
    .map(clean)
    .filter(Boolean);
  return parts.length >= 2 ? parts.at(-1) : "";
}

function evidenceProjection(value) {
  const item = record(value);
  return {
    evidenceBasis: item.evidenceBasis,
    evidenceState: item.evidenceState,
    evidenceLevel: item.evidenceLevel,
    reviewState: item.reviewState,
    reviewStatus: item.reviewStatus,
    publicationStatus: item.publicationStatus,
    promotionAllowed: item.promotionAllowed,
    humanEditorialReviewPerformed: item.humanEditorialReviewPerformed,
    sourceState: item.sourceState,
    rightsPolicy: item.rightsPolicy,
    evidence: item.evidence,
  };
}

function unsafeFanEvidence(item, receipt, cut) {
  const projections = [
    evidenceProjection(item),
    evidenceProjection(receipt),
    evidenceProjection(cut),
    evidenceProjection(record(item).guideAnchor),
  ];
  const evidenceText = JSON.stringify(projections);
  for (const [kind, pattern] of UNSAFE_FAN_EVIDENCE_PATTERNS) {
    const match = evidenceText.match(pattern);
    if (match) {
      return {
        kind,
        evidence: match[0],
      };
    }
  }
  const reviewRequired = projections.some((projection) => (
    projection.promotionAllowed === false ||
    projection.humanEditorialReviewPerformed === false ||
    record(projection.rightsPolicy).promotionAllowed === false
  ));
  return reviewRequired
    ? {
        kind: "review-required",
        evidence: "promotionAllowed:false or humanEditorialReviewPerformed:false",
      }
    : null;
}

function repeatedSectionPayloadKey(section) {
  const subject = normalizeSubject(
    section.subject || storyLabelSuffix(section.label) || section.anchor,
  );
  if (!subject) return "";
  const firstAt = coordinate(section.subjectFirstAt);
  const peakAt = coordinate(section.subjectPeakAt);
  const mentions = finiteNumber(section.subjectMentions);
  if (firstAt === null || peakAt === null || mentions === null) return "";
  return JSON.stringify([subject, firstAt, peakAt, mentions]);
}

function defaultGlobalTopicCompleteFrame() {
  if (!fs.existsSync(DOSSIER_UI_PATH)) return null;
  const source = fs.readFileSync(DOSSIER_UI_PATH, "utf8");
  const match = source.match(
    /topicMapOnly\s*\?\s*["']FULL\s+(?:SOURCE|SUBJECT|TOPIC)\s+(?:MAP|INDEX|RECAP)["']/i,
  );
  return match
    ? {
        field: "public/demo/source-dossier-ui.js",
        kind: "unconditional-topic-ui-frame",
        text: clean(match[0]),
      }
    : null;
}

function topicCompleteFrames(recap, globalFrame) {
  const fields = [
    ["recap.label", recap.label],
    ["recap.badge", recap.badge],
    ["recap.headline", recap.headline],
    ["recap.deck", recap.deck],
    ["recap.overview", recap.overview],
    ...array(recap.story).map((item, index) => [
      `recap.story[${index}].label`,
      record(item).label,
    ]),
  ];
  const frames = [];
  fields.forEach(([field, value]) => {
    const text = clean(value);
    if (!text || /\bpartial\b/i.test(text) || /\blast\s+indexed\s+topic\b/i.test(text)) {
      return;
    }
    COMPLETE_TOPIC_FRAME_PATTERNS.forEach(([kind, pattern]) => {
      if (pattern.test(text)) {
        frames.push({ field, kind, text });
      }
    });
  });
  if (globalFrame) frames.push(globalFrame);
  return frames;
}

function auditReadyFile(file, failures, globalTopicCompleteFrame) {
  const recap = record(file.recap);
  const sections = array(recap.sections).map(record);
  const story = array(recap.story).map(record);
  const receipts = receiptMapFor(file);
  const guideCuts = guideCutMapFor(file);

  if (!clean(recap.schema)) {
    failures.structuralShapeFailures.push(
      compactFailure(file, "recap.schema", "missing-recap-schema"),
    );
  }
  if (!sections.length) {
    failures.structuralShapeFailures.push(
      compactFailure(file, "recap.sections", "missing-public-sections"),
    );
  }
  if (!story.length) {
    failures.structuralShapeFailures.push(
      compactFailure(file, "recap.story", "missing-public-story"),
    );
  }

  let previousVisibleAt = null;
  sections.forEach((section, index) => {
    const field = `recap.sections[${index}]`;
    const localAt = coordinate(section.at);
    const displayAt = coordinate(section.displayAt);
    if (localAt === null || displayAt === null || localAt !== displayAt) {
      failures.sectionDisplayAtLocalAtMismatches.push(
        compactFailure(
          file,
          field,
          localAt === null || displayAt === null
            ? "missing-section-coordinate"
            : "displayAt-does-not-match-local-at",
          {
            sectionId: clean(section.id),
            label: clean(section.label),
            localAt,
            displayAt,
          },
        ),
      );
    }
    if (
      previousVisibleAt !== null &&
      displayAt !== null &&
      displayAt < previousVisibleAt
    ) {
      failures.nonMonotonicVisibleSectionTimes.push(
        compactFailure(file, field, "visible-section-time-moves-backward", {
          sectionId: clean(section.id),
          label: clean(section.label),
          previousDisplayAt: previousVisibleAt,
          displayAt,
        }),
      );
    }
    if (displayAt !== null) previousVisibleAt = displayAt;

    const bodyFailure = bodyPlayFailure(file, section, field, receipts);
    if (bodyFailure) {
      failures.bodyPlayCoordinateMismatches.push(bodyFailure);
    }
  });

  const repeatedPayloads = new Map();
  sections.forEach((section, index) => {
    const key = repeatedSectionPayloadKey(section);
    if (!key) return;
    const entries = repeatedPayloads.get(key) || [];
    entries.push({
      index,
      id: clean(section.id),
      label: clean(section.label),
      visibleAt: coordinate(section.displayAt),
    });
    repeatedPayloads.set(key, entries);
  });
  repeatedPayloads.forEach((entries, payload) => {
    if (entries.length < 2) return;
    const visibleCoordinates = entries.map((entry) => entry.visibleAt);
    const distinctCoordinates = new Set(
      visibleCoordinates.filter((value) => value !== null),
    );
    if (
      visibleCoordinates.some((value) => value === null) ||
      distinctCoordinates.size < entries.length
    ) {
      failures.duplicateSectionPayloadsWithoutDistinctLocalCoordinates.push(
        compactFailure(
          file,
          "recap.sections",
          "repeated-global-payload-without-distinct-visible-coordinate",
          {
            payload: JSON.parse(payload),
            sections: entries,
          },
        ),
      );
    }
  });

  story.forEach((segment, index) => {
    const field = `recap.story[${index}]`;
    const suffix = storyLabelSuffix(segment.label);
    const primarySubject = clean(
      segment.primarySubject || record(segment.narrative).primarySubject,
    );
    const labelIsPrimarySubject = normalizeSubject(segment.label) ===
      normalizeSubject(primarySubject);
    if (
      !primarySubject ||
      (!labelIsPrimarySubject &&
        (!suffix || normalizeSubject(suffix) !== normalizeSubject(primarySubject)))
    ) {
      failures.storyLabelPrimarySubjectMismatches.push(
        compactFailure(
          file,
          field,
          !primarySubject
            ? "missing-story-subject-contract"
            : "story-label-suffix-primary-subject-mismatch",
          {
            storyId: clean(segment.id),
            label: clean(segment.label),
            labelSuffix: suffix,
            primarySubject,
            labelIsPrimarySubject,
          },
        ),
      );
    }

    const displayAt = coordinate(segment.displayAt);
    const displayEnd = coordinate(segment.displayEnd);
    if (
      displayAt === null ||
      displayEnd === null ||
      displayEnd < displayAt
    ) {
      failures.structuralShapeFailures.push(
        compactFailure(file, field, "invalid-story-display-window", {
          storyId: clean(segment.id),
          displayAt,
          displayEnd,
        }),
      );
    } else {
      parsePublicClockTokens(segment.body).forEach((clock) => {
        if (clock.seconds < displayAt || clock.seconds > displayEnd) {
          failures.storyClockOutsideDisplayWindow.push(
            compactFailure(
              file,
              `${field}.body`,
              "story-clock-outside-display-window",
              {
                storyId: clean(segment.id),
                label: clean(segment.label),
                clock: clock.text,
                clockAt: clock.seconds,
                displayAt,
                displayEnd,
              },
            ),
          );
        }
      });
    }

    const bodyFailure = bodyPlayFailure(file, segment, field, receipts);
    if (bodyFailure) {
      failures.bodyPlayCoordinateMismatches.push(bodyFailure);
    }
  });

  Object.entries(record(recap.fanRead)).forEach(([key, value]) => {
    const item = record(value);
    if (!clean(item.body)) return;
    const field = `recap.fanRead.${key}`;
    const receiptKey = clean(
      item.anchorReceiptKey ||
      array(item.receiptKeys)[0] ||
      item.receiptKey,
    );
    const guideCutId = clean(
      record(item.guideAnchor).id || item.guideCutId || item.cutId,
    );
    const receipt = receipts.get(receiptKey);
    const cut = guideCuts.get(guideCutId);
    const unsafe = unsafeFanEvidence(item, receipt, cut);
    if (unsafe) {
      failures.unsafePublicFanReadEvidence.push(
        compactFailure(file, field, unsafe.kind, {
          label: clean(item.label),
          topic: clean(item.topic),
          receiptKey,
          guideCutId,
          evidence: unsafe.evidence,
        }),
      );
    }

    const bodyFailure = bodyPlayFailure(file, item, field, receipts);
    if (bodyFailure) {
      failures.bodyPlayCoordinateMismatches.push(bodyFailure);
    }
  });

  if (clean(recap.tier || file.tier) === "topic-recap") {
    const coverage = finiteNumber(record(recap.caseFile).lastPlayableAnchorPercent);
    const frames = topicCompleteFrames(recap, globalTopicCompleteFrame);
    if ((coverage === null || coverage < 85) && frames.length) {
      failures.incompleteTopicMapsFramedAsComplete.push(
        compactFailure(
          file,
          "recap.caseFile.lastPlayableAnchorPercent",
          coverage === null
            ? "complete-topic-frame-without-valid-coverage"
            : "below-85-percent-topic-map-framed-as-complete",
          {
            coverage,
            completeFrames: frames,
          },
        ),
      );
    }
  }
}

export function auditEpisodeRecapPublicStructure(files, options = {}) {
  const canonicalFiles = array(files).map(record);
  const expectedCanonicalSources = Number.isFinite(
    Number(options.expectedCanonicalSources),
  )
    ? Math.max(0, Math.floor(Number(options.expectedCanonicalSources)))
    : CANONICAL_DOSSIER_COUNT;
  const globalTopicCompleteFrame =
    options.globalTopicCompleteFrame === false
      ? null
      : options.globalTopicCompleteFrame
        ? {
            field: "global-topic-ui",
            kind: "unconditional-topic-ui-frame",
            text: clean(options.globalTopicCompleteFrame),
          }
        : defaultGlobalTopicCompleteFrame();
  const failures = Object.fromEntries(
    FAILURE_KEYS.map((key) => [key, []]),
  );

  if (canonicalFiles.length !== expectedCanonicalSources) {
    failures.canonicalSourceCountMismatches.push({
      sourceId: "ARCHIVE",
      title: "Canonical dossier corpus",
      state: "aggregate",
      tier: "aggregate",
      field: "corpus.canonicalSourcesCompiled",
      kind: "canonical-source-count-mismatch",
      expected: expectedCanonicalSources,
      actual: canonicalFiles.length,
    });
  }

  const idCounts = countBy(canonicalFiles, (file) => file.id);
  Object.entries(idCounts).forEach(([id, count]) => {
    if (id === "unknown" || count > 1) {
      failures.structuralShapeFailures.push({
        sourceId: id === "unknown" ? "" : id,
        title: "Canonical dossier corpus",
        state: "aggregate",
        tier: "aggregate",
        field: "file.id",
        kind: id === "unknown" ? "missing-source-id" : "duplicate-source-id",
        count,
      });
    }
  });

  canonicalFiles.forEach((file) => {
    const state = clean(file.state || record(file.recap).state);
    if (state === "held") return;
    if (state !== "ready") {
      failures.structuralShapeFailures.push(
        compactFailure(file, "recap.state", "unknown-recap-release-state", {
          releaseState: state,
        }),
      );
      return;
    }
    auditReadyFile(file, failures, globalTopicCompleteFrame);
  });

  const counts = Object.fromEntries(
    FAILURE_KEYS.map((key) => [key, failures[key].length]),
  );
  const gates = Object.fromEntries(
    FAILURE_KEYS.map((key) => [key, failures[key].length === 0]),
  );
  const ready = canonicalFiles.filter(
    (file) => clean(file.state || record(file.recap).state) === "ready",
  );
  const held = canonicalFiles.filter(
    (file) => clean(file.state || record(file.recap).state) === "held",
  );

  return {
    schema: PUBLIC_STRUCTURE_AUDIT_SCHEMA,
    generatedAt: new Date().toISOString(),
    thresholds: {
      expectedCanonicalSources,
      topicMapCompleteFramingMinimumPercent: 85,
    },
    corpus: {
      canonicalSourcesCompiled: canonicalFiles.length,
      ready: ready.length,
      held: held.length,
      tiers: countBy(canonicalFiles, (file) => file.tier),
      formats: countBy(canonicalFiles, (file) => file.format),
      sections: ready.reduce(
        (total, file) => total + array(record(file.recap).sections).length,
        0,
      ),
      storySegments: ready.reduce(
        (total, file) => total + array(record(file.recap).story).length,
        0,
      ),
      fanCards: ready.reduce(
        (total, file) => total + Object.values(record(record(file.recap).fanRead))
          .filter((item) => clean(record(item).body)).length,
        0,
      ),
      topicRecaps: canonicalFiles.filter(
        (file) => clean(file.tier || record(file.recap).tier) === "topic-recap",
      ).length,
    },
    counts,
    affectedSources: Object.fromEntries(
      FAILURE_KEYS.map((key) => [
        key,
        new Set(failures[key].map((failure) => failure.sourceId).filter(Boolean))
          .size,
      ]),
    ),
    gates,
    pass: Object.values(gates).every(Boolean),
    failures,
  };
}

export function compileAndAuditEpisodeRecapPublicStructure(options = {}) {
  return auditEpisodeRecapPublicStructure(compileCanonicalRecaps(), options);
}

export function episodeRecapPublicStructureSummary(report) {
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

function examples(report, key, limit = 5) {
  const values = array(record(report.failures)[key]);
  if (!values.length) return ["  0  NONE"];
  return values.slice(0, limit).map((failure) => (
    `  ${failure.sourceId || "ARCHIVE"}  ${failure.field}  ${failure.kind}`
  ));
}

function human(report) {
  const lines = [
    "WWAM ARCHIVE-WIDE PUBLIC RECAP STRUCTURE AUDIT",
    `Compiled: ${report.corpus.canonicalSourcesCompiled} canonical // ready ${report.corpus.ready} // held ${report.corpus.held}`,
    `Audited: ${report.corpus.sections} sections // ${report.corpus.storySegments} story reels // ${report.corpus.fanCards} fan cards // ${report.corpus.topicRecaps} topic recaps`,
    "",
    ...FAILURE_KEYS.map((key) => `${key}: ${report.counts[key]}`),
    "",
    `PUBLIC STRUCTURE RELEASE GATE: ${report.pass ? "PASS" : "FAIL"}`,
  ];
  FAILURE_KEYS.filter((key) => report.counts[key] > 0).forEach((key) => {
    lines.push("", `${key} examples:`, ...examples(report, key));
  });
  return `${lines.join("\n")}\n`;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(SCRIPT_PATH)) {
  const report = compileAndAuditEpisodeRecapPublicStructure();
  if (process.argv.includes("--summary-json")) {
    process.stdout.write(
      `${JSON.stringify(episodeRecapPublicStructureSummary(report), null, 2)}\n`,
    );
  } else if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(human(report));
  }
  if (process.argv.includes("--check") && !report.pass) {
    process.exitCode = 1;
  }
}
