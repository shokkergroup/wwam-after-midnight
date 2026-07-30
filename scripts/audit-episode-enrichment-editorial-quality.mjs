import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const GENERATED = "2026-07-30";
const FACT_PACK =
  /^episode-facts-(?:pilot|batch\d+)\.js$/;
const TOPIC_REBUILD_PACK =
  /^episode-guide-v2-topic-rebuild-batch\d+\.js$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const WORD = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;
const SENTENCE_END = /[.!?](?:["'”’)]*)$/;
const GENERIC_LABEL =
  /^(?:moment|highlight|topic|segment|section|discussion|reaction|take|clip|item|event|opening|closing|tape stop|full send|up in ya|the room breaks|take gets nuclear|on[- ]tape take|comedy beat)(?:\s*(?:#|no\.?)?\s*\d+)?$/i;
const SYNC_NATIVE_LABELS = new Set([
  "countdown",
  "press play",
]);
const TOPIC_REBUILD_NATIVE_LABELS = new Map([
  ["evaluation-candidate", "on tape take"],
  ["comedy-candidate", "comedy beat"],
]);
const PLACEHOLDER_COPY =
  /\b(?:undefined|null|tbd|todo|lorem ipsum|placeholder copy)\b/i;
const MOJIBAKE = /(?:\uFFFD|Ã.|Â.|â(?:€|€™|€œ|€|€“|€”))/;
const MACHINE_ROOM =
  /\b(?:automatic-caption event|runtime[- ]quantile|configured[- ]alias|source-local caption anchor|timeline[- ]bin|machine-surfaced|anchor phrase|anchor set|evidence hash|caption events parsed|json3|claim lane|review state|topic-door|format-cue|generation sha|sha256)\b/i;
const NAMED_SPEAKER_CLAIM =
  /\b(?:Mike|Jay|J|Roy|Katie)\s+(?:says|said|jokes|joked|calls|called|ranks|ranked|places|placed|thinks|thought|believes|argues|claims)\b/i;
const UNSUPPORTED_VISUAL_CLAIM =
  /\b(?:we see|the screen shows|the image shows|the video shows|the frame shows|visibly|on[- ]screen (?:shows|confirms|proves))\b/i;
const IDENTITY_KEY =
  /^(?:speaker|speakerId|speakerName|host|hostId|performer|performerId|attributedTo|saidBy|quoteBy)$/i;
const UNSUPPORTED_TRUE_KEY =
  /^(?:speakerClaim|performerClaim|visualResultClaim|intentClaim|originClaim|frameMatchVerified|sourceScriptOriginVerified|creatorApprovalClaimed|creatorApproved)$/i;

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function words(value) {
  return clean(value).match(WORD) || [];
}

function normalizedLabel(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return `sha256:${crypto.createHash("sha256").update(input).digest("hex")}`;
}

function isTruthyIdentity(value) {
  return !(
    value === null ||
    value === undefined ||
    value === false ||
    value === ""
  );
}

function walkUnsupportedFields(value, prefix = "", output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walkUnsupportedFields(item, `${prefix}[${index}]`, output),
    );
    return output;
  }
  for (const [key, nested] of Object.entries(value)) {
    const location = prefix ? `${prefix}.${key}` : key;
    if (IDENTITY_KEY.test(key) && isTruthyIdentity(nested)) {
      output.push({
        location,
        value: nested,
        reason: "unverified-identity-field",
      });
    }
    if (UNSUPPORTED_TRUE_KEY.test(key) && nested === true) {
      output.push({
        location,
        value: true,
        reason: "unsupported-claim-enabled",
      });
    }
    walkUnsupportedFields(nested, location, output);
  }
  return output;
}

function loadWindowArtifact(filePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, {
    filename: filePath,
  });
  const assignments = Object.entries(context.window);
  if (assignments.length !== 1) {
    throw new Error(
      `${filePath} must publish exactly one window assignment; found ${assignments.length}.`,
    );
  }
  return {
    globalName: assignments[0][0],
    payload: JSON.parse(JSON.stringify(assignments[0][1])),
  };
}

function addFinding(findings, {
  severity,
  code,
  packFile,
  packKind,
  sourceId = "",
  itemId = "",
  label = "",
  message,
  detail = {},
}) {
  findings.push({
    severity,
    code,
    packFile,
    packKind,
    sourceId,
    itemId,
    label,
    message,
    detail,
  });
}

function editorialSummary(item, packKind) {
  if (packKind === "topic-rebuild") return clean(item.summary);
  return clean(item?.claim?.text || item.summary);
}

function factItems(source) {
  const key = clean(source.formatSpecificFactType);
  return {
    key,
    items: key && Array.isArray(source[key]) ? source[key] : [],
  };
}

function quartiles(items, duration) {
  if (!(duration > 0)) return [];
  return [
    ...new Set(
      items.map((item) =>
        Math.min(3, Math.max(0, Math.floor((Number(item.at) / duration) * 4))),
      ),
    ),
  ].sort();
}

function distributionFor(items, duration) {
  if (!items.length || !(duration > 0)) {
    return {
      firstAt: 0,
      lastEnd: 0,
      spanPercent: 0,
      quartiles: [],
    };
  }
  const firstAt = Math.min(...items.map((item) => Number(item.at)));
  const lastEnd = Math.max(...items.map((item) => Number(item.end)));
  return {
    firstAt,
    lastEnd,
    spanPercent: Number(
      (((lastEnd - firstAt) / duration) * 100).toFixed(2),
    ),
    quartiles: quartiles(items, duration),
  };
}

function auditMetadata({
  rootDir,
  packFile,
  packKind,
  source,
  findings,
}) {
  const sourceId = clean(source.id);
  if (!YOUTUBE_ID.test(sourceId)) {
    addFinding(findings, {
      severity: "blocker",
      code: "invalid-source-id",
      packFile,
      packKind,
      sourceId,
      message: "The source id is not an exact eleven-character YouTube id.",
      detail: { value: sourceId },
    });
    return;
  }

  const metadataPath = path.join(
    rootDir,
    "source-cache",
    "metadata",
    `${sourceId}.json`,
  );
  if (!fs.existsSync(metadataPath)) {
    addFinding(findings, {
      severity: "blocker",
      code: "missing-source-metadata",
      packFile,
      packKind,
      sourceId,
      message: "The pack source id has no matching private metadata record.",
      detail: {
        expectedPath: path.relative(rootDir, metadataPath),
      },
    });
    return;
  }

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    addFinding(findings, {
      severity: "blocker",
      code: "invalid-source-metadata",
      packFile,
      packKind,
      sourceId,
      message: "The matching source metadata file could not be parsed.",
      detail: { error: error.message },
    });
    return;
  }

  const mismatches = {};
  if (clean(metadata.id) !== sourceId) {
    mismatches.id = {
      pack: sourceId,
      metadata: clean(metadata.id),
    };
  }
  if (clean(metadata.title) !== clean(source.title)) {
    mismatches.title = {
      pack: clean(source.title),
      metadata: clean(metadata.title),
    };
  }
  if (Number(metadata.duration) !== Number(source.duration)) {
    mismatches.duration = {
      pack: Number(source.duration),
      metadata: Number(metadata.duration),
    };
  }
  if (Object.keys(mismatches).length) {
    addFinding(findings, {
      severity: "blocker",
      code: "source-identity-mismatch",
      packFile,
      packKind,
      sourceId,
      message: "The public pack identity diverges from the source metadata.",
      detail: { mismatches },
    });
  }
}

function auditItem({
  packFile,
  packKind,
  source,
  item,
  itemIndex,
  laneKey,
  findings,
}) {
  const sourceId = clean(source.id);
  const itemId = clean(item.id);
  const label = clean(item.label);
  const summary = editorialSummary(item, packKind);
  const summaryWords = words(summary);
  const itemType = clean(item.type);
  const at = Number(item.at);
  const end = Number(item.end);
  const duration = Number(source.duration);
  const maxWindow = packKind === "topic-rebuild" ? 24 : 120;

  if (!itemId || !itemId.includes(sourceId)) {
    addFinding(findings, {
      severity: "blocker",
      code: "item-source-id-mismatch",
      packFile,
      packKind,
      sourceId,
      itemId,
      label,
      message: "The item id does not preserve its exact source id.",
      detail: { laneKey, itemIndex },
    });
  }
  if (!label) {
    addFinding(findings, {
      severity: "blocker",
      code: "missing-editorial-label",
      packFile,
      packKind,
      sourceId,
      itemId,
      message: "A public item has no editorial label.",
      detail: { laneKey, itemIndex },
    });
  } else {
    const normalized = normalizedLabel(label);
    const formatNative =
      (itemType === "syncCue" &&
        SYNC_NATIVE_LABELS.has(normalized)) ||
      (packKind === "topic-rebuild" &&
        TOPIC_REBUILD_NATIVE_LABELS.get(clean(item.classification)) ===
          normalized);
    if (
      !formatNative &&
      (GENERIC_LABEL.test(label) ||
        PLACEHOLDER_COPY.test(label) ||
        words(label).length < 1)
    ) {
      addFinding(findings, {
        severity: "blocker",
        code: "generic-editorial-label",
        packFile,
        packKind,
        sourceId,
        itemId,
        label,
        message: "The public label is generic or placeholder copy.",
        detail: { laneKey, itemIndex },
      });
    }
    if (MOJIBAKE.test(label)) {
      addFinding(findings, {
        severity: "blocker",
        code: "unreadable-editorial-copy",
        packFile,
        packKind,
        sourceId,
        itemId,
        label,
        message: "The public label contains mojibake or a replacement character.",
        detail: { field: "label" },
      });
    }
  }

  if (!summary) {
    addFinding(findings, {
      severity: "blocker",
      code: "missing-editorial-summary",
      packFile,
      packKind,
      sourceId,
      itemId,
      label,
      message: "A public item has no readable editorial summary.",
      detail: { laneKey, itemIndex },
    });
  } else {
    if (
      summaryWords.length < 5 ||
      summaryWords.length > 80 ||
      !SENTENCE_END.test(summary) ||
      PLACEHOLDER_COPY.test(summary) ||
      MOJIBAKE.test(summary)
    ) {
      addFinding(findings, {
        severity: "blocker",
        code: "unreadable-editorial-copy",
        packFile,
        packKind,
        sourceId,
        itemId,
        label,
        message: "The public summary is incomplete, malformed, or unreadable.",
        detail: {
          field: "summary",
          wordCount: summaryWords.length,
          sentenceTerminated: SENTENCE_END.test(summary),
        },
      });
    }
    if (
      clean(summary).toLowerCase() === clean(item.excerpt).toLowerCase()
    ) {
      addFinding(findings, {
        severity: "blocker",
        code: "raw-excerpt-used-as-summary",
        packFile,
        packKind,
        sourceId,
        itemId,
        label,
        message: "The public summary merely repeats the raw source excerpt.",
      });
    }
  }

  const publicCopy = `${label} ${summary}`;
  if (MACHINE_ROOM.test(publicCopy)) {
    addFinding(findings, {
      severity: "blocker",
      code: "machine-room-copy-leak",
      packFile,
      packKind,
      sourceId,
      itemId,
      label,
      message: "Internal processing vocabulary leaked into public editorial copy.",
      detail: {
        matched: publicCopy.match(MACHINE_ROOM)?.[0] || "",
      },
    });
  }
  if (NAMED_SPEAKER_CLAIM.test(publicCopy)) {
    addFinding(findings, {
      severity: "blocker",
      code: "unsupported-speaker-claim",
      packFile,
      packKind,
      sourceId,
      itemId,
      label,
      message: "Public copy assigns speech to a named person without reviewed identity evidence.",
    });
  }
  if (UNSUPPORTED_VISUAL_CLAIM.test(publicCopy)) {
    addFinding(findings, {
      severity: "blocker",
      code: "unsupported-visual-claim",
      packFile,
      packKind,
      sourceId,
      itemId,
      label,
      message: "Public copy asserts unverified visual evidence.",
    });
  }
  for (const unsupported of walkUnsupportedFields(item)) {
    addFinding(findings, {
      severity: "blocker",
      code:
        unsupported.reason === "unverified-identity-field"
          ? "unsupported-speaker-claim"
          : "unsupported-evidence-claim",
      packFile,
      packKind,
      sourceId,
      itemId,
      label,
      message:
        "An item enables identity, visual, origin, intent, or creator-approval authority that the pack does not establish.",
      detail: unsupported,
    });
  }

  if (
    !Number.isFinite(at) ||
    !Number.isFinite(end) ||
    at < 0 ||
    end <= at ||
    end > duration ||
    end - at > maxWindow
  ) {
    addFinding(findings, {
      severity: "blocker",
      code: "invalid-playback-window",
      packFile,
      packKind,
      sourceId,
      itemId,
      label,
      message: "The public playback window is missing, unbounded, or outside the source.",
      detail: {
        at,
        end,
        duration,
        windowSeconds: end - at,
        maximumSeconds: maxWindow,
      },
    });
  }

  if (packKind === "topic-rebuild") {
    if (Number(item.evidenceAt) !== at) {
      addFinding(findings, {
        severity: "blocker",
        code: "playback-evidence-mismatch",
        packFile,
        packKind,
        sourceId,
        itemId,
        label,
        message: "The topic-rebuild playback start does not match its evidence timestamp.",
        detail: {
          at,
          evidenceAt: Number(item.evidenceAt),
        },
      });
    }
  } else {
    const anchorAt = Number(item?.evidence?.anchorAt);
    if (
      !Number.isFinite(anchorAt) ||
      anchorAt < at ||
      anchorAt > end
    ) {
      addFinding(findings, {
        severity: "blocker",
        code: "playback-evidence-mismatch",
        packFile,
        packKind,
        sourceId,
        itemId,
        label,
        message: "The typed fact's evidence anchor falls outside its public playback window.",
        detail: { at, end, anchorAt },
      });
    }
    if (item.responseAt !== undefined || item.responseEnd !== undefined) {
      const responseAt = Number(item.responseAt);
      const responseEnd = Number(item.responseEnd);
      if (
        !Number.isFinite(responseAt) ||
        !Number.isFinite(responseEnd) ||
        responseAt < at ||
        responseEnd <= responseAt ||
        responseEnd > end
      ) {
        addFinding(findings, {
          severity: "blocker",
          code: "invalid-response-window",
          packFile,
          packKind,
          sourceId,
          itemId,
          label,
          message: "The answer window falls outside its question-and-answer playback window.",
          detail: { at, end, responseAt, responseEnd },
        });
      }
    }
  }
}

function auditSource({
  rootDir,
  packFile,
  packKind,
  source,
  findings,
}) {
  auditMetadata({
    rootDir,
    packFile,
    packKind,
    source,
    findings,
  });

  let laneKey;
  let items;
  if (packKind === "episode-facts") {
    const lane = factItems(source);
    laneKey = lane.key;
    items = lane.items;
    if (!laneKey || !items.length) {
      addFinding(findings, {
        severity: "blocker",
        code: "missing-public-editorial-lane",
        packFile,
        packKind,
        sourceId: clean(source.id),
        message: "The fact source has no populated format-specific public lane.",
        detail: { laneKey },
      });
    }
  } else {
    laneKey = "episodeGuide.cuts";
    items = Array.isArray(source?.episodeGuide?.cuts)
      ? source.episodeGuide.cuts
      : [];
    if (!items.length) {
      addFinding(findings, {
        severity: "blocker",
        code: "missing-public-editorial-lane",
        packFile,
        packKind,
        sourceId: clean(source.id),
        message: "The topic rebuild has no public cut lane.",
      });
    }
  }

  const itemIds = new Set();
  const labels = new Map();
  for (const [itemIndex, item] of items.entries()) {
    const itemId = clean(item.id);
    if (itemIds.has(itemId)) {
      addFinding(findings, {
        severity: "blocker",
        code: "duplicate-item-id",
        packFile,
        packKind,
        sourceId: clean(source.id),
        itemId,
        label: clean(item.label),
        message: "A public source lane repeats an item id.",
      });
    }
    itemIds.add(itemId);
    const labelKey = normalizedLabel(item.label);
    if (labelKey) {
      const matches = labels.get(labelKey) || [];
      matches.push(itemId);
      labels.set(labelKey, matches);
    }
    auditItem({
      packFile,
      packKind,
      source,
      item,
      itemIndex,
      laneKey,
      findings,
    });
  }

  for (const [labelKey, itemMatches] of labels) {
    if (itemMatches.length < 2) continue;
    addFinding(findings, {
      severity: "blocker",
      code: "duplicate-editorial-label",
      packFile,
      packKind,
      sourceId: clean(source.id),
      label: labelKey,
      message: "A public source lane repeats the same editorial label.",
      detail: { itemIds: itemMatches },
    });
  }

  for (let index = 1; index < items.length; index += 1) {
    const previousAt = Number(items[index - 1].at);
    const currentAt = Number(items[index].at);
    if (currentAt >= previousAt) continue;
    addFinding(findings, {
      severity: "blocker",
      code: "non-chronological-playback",
      packFile,
      packKind,
      sourceId: clean(source.id),
      itemId: clean(items[index].id),
      label: clean(items[index].label),
      message: "Public playback items move backward in time.",
      detail: {
        previousItemId: clean(items[index - 1].id),
        previousAt,
        currentAt,
        laneKey,
      },
    });
  }

  const distribution = distributionFor(items, Number(source.duration));
  const factDistributionExempt = new Set([
    "questionAnswerPairs",
    "scriptSceneCues",
    "syncCues",
  ]);
  if (packKind === "topic-rebuild" && items.length >= 10) {
    if (distribution.spanPercent < 40) {
      addFinding(findings, {
        severity: "blocker",
        code: "thin-runtime-distribution",
        packFile,
        packKind,
        sourceId: clean(source.id),
        message: "A fifteen-stop rebuild covers less than forty percent of the source.",
        detail: distribution,
      });
    } else if (distribution.spanPercent < 70) {
      addFinding(findings, {
        severity: "advisory",
        code: "thin-runtime-distribution",
        packFile,
        packKind,
        sourceId: clean(source.id),
        message: "The rebuild is playable but concentrated within less than seventy percent of the source.",
        detail: distribution,
      });
    }
  } else if (
    packKind === "episode-facts" &&
    items.length >= 6 &&
    !factDistributionExempt.has(laneKey)
  ) {
    if (distribution.spanPercent < 20) {
      addFinding(findings, {
        severity: "blocker",
        code: "thin-runtime-distribution",
        packFile,
        packKind,
        sourceId: clean(source.id),
        message: "The typed public lane covers less than twenty percent of the source.",
        detail: distribution,
      });
    } else if (distribution.spanPercent < 30) {
      addFinding(findings, {
        severity: "advisory",
        code: "thin-runtime-distribution",
        packFile,
        packKind,
        sourceId: clean(source.id),
        message: "The typed public lane is concentrated within less than thirty percent of the source.",
        detail: distribution,
      });
    }
  }

  return {
    id: clean(source.id),
    title: clean(source.title),
    duration: Number(source.duration),
    laneKey,
    items: items.length,
    distribution,
  };
}

function countBy(values, keyer) {
  return values.reduce((result, value) => {
    const key = keyer(value);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

export function discoverEpisodeEnrichmentPacks({
  rootDir = PROJECT_ROOT,
} = {}) {
  const publicDir = path.join(rootDir, "public", "demo");
  if (!fs.existsSync(publicDir)) return [];
  return fs
    .readdirSync(publicDir)
    .filter(
      (name) => FACT_PACK.test(name) || TOPIC_REBUILD_PACK.test(name),
    )
    .sort((left, right) => left.localeCompare(right))
    .map((name) => path.join(publicDir, name));
}

export function auditEpisodeEnrichmentEditorialQuality({
  rootDir = PROJECT_ROOT,
} = {}) {
  const packPaths = discoverEpisodeEnrichmentPacks({ rootDir });
  const findings = [];
  const packs = [];
  const allSourceIds = new Set();
  const allItemIds = new Set();

  if (!packPaths.length) {
    addFinding(findings, {
      severity: "blocker",
      code: "no-enrichment-packs",
      packFile: "",
      packKind: "unknown",
      message: "No episode-facts or topic-rebuild packs were discovered.",
    });
  }

  for (const packPath of packPaths) {
    const packFile = path
      .relative(rootDir, packPath)
      .replace(/\\/g, "/");
    const packKind = FACT_PACK.test(path.basename(packPath))
      ? "episode-facts"
      : "topic-rebuild";
    let loaded;
    try {
      loaded = loadWindowArtifact(packPath);
    } catch (error) {
      addFinding(findings, {
        severity: "blocker",
        code: "invalid-pack-artifact",
        packFile,
        packKind,
        message: "The public enrichment artifact could not be loaded.",
        detail: { error: error.message },
      });
      continue;
    }

    const payload = loaded.payload;
    const sources =
      packKind === "episode-facts"
        ? payload.sources
        : payload.guides;
    if (!Array.isArray(sources)) {
      addFinding(findings, {
        severity: "blocker",
        code: "invalid-pack-source-list",
        packFile,
        packKind,
        message: "The enrichment artifact has no source list.",
      });
      continue;
    }

    const packSourceIds = new Set();
    const sourceReports = [];
    const beforeItems = allItemIds.size;
    for (const source of sources) {
      const sourceId = clean(source.id);
      if (packSourceIds.has(sourceId)) {
        addFinding(findings, {
          severity: "blocker",
          code: "duplicate-pack-source-id",
          packFile,
          packKind,
          sourceId,
          message: "The same source id appears twice in one pack.",
        });
      }
      packSourceIds.add(sourceId);
      allSourceIds.add(sourceId);
      const sourceReport = auditSource({
        rootDir,
        packFile,
        packKind,
        source,
        findings,
      });
      sourceReports.push(sourceReport);

      const sourceItems =
        packKind === "episode-facts"
          ? factItems(source).items
          : source?.episodeGuide?.cuts || [];
      sourceItems.forEach((item) => allItemIds.add(clean(item.id)));
    }

    packs.push({
      file: packFile,
      globalName: loaded.globalName,
      schema: clean(payload.schema),
      kind: packKind,
      sha256: sha256(fs.readFileSync(packPath)),
      sources: sourceReports.length,
      items: allItemIds.size - beforeItems,
      sourceReports,
    });
  }

  findings.sort((left, right) =>
    (left.severity === right.severity
      ? 0
      : left.severity === "blocker"
        ? -1
        : 1) ||
    left.packFile.localeCompare(right.packFile) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.code.localeCompare(right.code) ||
    left.itemId.localeCompare(right.itemId)
  );
  const blockers = findings.filter(
    (finding) => finding.severity === "blocker",
  );
  const advisories = findings.filter(
    (finding) => finding.severity === "advisory",
  );
  const totalSourceEntries = packs.reduce(
    (total, pack) => total + pack.sources,
    0,
  );
  const totalItems = packs.reduce(
    (total, pack) => total + pack.items,
    0,
  );
  const inputFingerprint = sha256(
    JSON.stringify(
      packs.map((pack) => ({
        file: pack.file,
        sha256: pack.sha256,
      })),
    ),
  );

  return {
    schema: "wwam-episode-enrichment-editorial-quality-audit/v1",
    generated: GENERATED,
    inputFingerprint,
    policy: {
      publicLanesOnly: true,
      structuralSupportLanesAudited: false,
      structuralSupportReason:
        "Phase rails, local reel anchors, and topic-cluster support records are not rendered as the format-specific editorial card lane.",
      maximumFactWindowSeconds: 120,
      maximumTopicRebuildWindowSeconds: 24,
      topicRebuildDistributionAdvisoryPercent: 70,
      topicRebuildDistributionBlockerPercent: 40,
      typedLaneDistributionAdvisoryPercent: 30,
      typedLaneDistributionBlockerPercent: 20,
      typedLaneDistributionExemptions: [
        "questionAnswerPairs",
        "scriptSceneCues",
        "syncCues",
      ],
      formatNativeLabelExceptions: {
        syncCue: [...SYNC_NATIVE_LABELS],
        topicRebuildByClassification: Object.fromEntries(
          TOPIC_REBUILD_NATIVE_LABELS,
        ),
      },
    },
    summary: {
      packs: packs.length,
      factPacks: packs.filter((pack) => pack.kind === "episode-facts")
        .length,
      topicRebuildPacks: packs.filter(
        (pack) => pack.kind === "topic-rebuild",
      ).length,
      sourceEntries: totalSourceEntries,
      uniqueSources: allSourceIds.size,
      items: totalItems,
      blockers: blockers.length,
      advisories: advisories.length,
      findingsByCode: countBy(findings, (finding) => finding.code),
      findingsBySeverityAndCode: countBy(
        findings,
        (finding) => `${finding.severity}:${finding.code}`,
      ),
      pass: blockers.length === 0,
    },
    packs,
    findings,
  };
}

function humanReport(report) {
  const summary = report.summary;
  const lines = [
    "WWAM episode enrichment editorial-quality audit",
    `Packs: ${summary.packs} (${summary.factPacks} fact, ${summary.topicRebuildPacks} topic rebuild)`,
    `Source entries: ${summary.sourceEntries} (${summary.uniqueSources} unique)`,
    `Public editorial items: ${summary.items}`,
    `Findings: ${summary.blockers} blockers, ${summary.advisories} advisories`,
    `Result: ${summary.pass ? "PASS" : "NEEDS EDITORIAL REPAIR"}`,
  ];
  if (report.findings.length) {
    lines.push("", "Findings:");
    for (const finding of report.findings) {
      const identity = [
        finding.packFile,
        finding.sourceId,
        finding.itemId,
      ]
        .filter(Boolean)
        .join(" :: ");
      lines.push(
        `- ${finding.severity.toUpperCase()} ${finding.code} :: ${identity}`,
      );
      lines.push(`  ${finding.message}`);
      if (finding.code === "non-chronological-playback") {
        lines.push(
          `  ${finding.detail.previousAt}s -> ${finding.detail.currentAt}s`,
        );
      } else if (finding.code === "thin-runtime-distribution") {
        lines.push(
          `  ${finding.detail.spanPercent}% span; quartiles ${finding.detail.quartiles.join(", ")}`,
        );
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const report = auditEpisodeEnrichmentEditorialQuality();
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(humanReport(report));
  }
  if (process.argv.includes("--check") && !report.summary.pass) {
    process.exitCode = 1;
  }
}

if (path.resolve(process.argv[1] || "") === path.resolve(SCRIPT_PATH)) {
  main();
}
