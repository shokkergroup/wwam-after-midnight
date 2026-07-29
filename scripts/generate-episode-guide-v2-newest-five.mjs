import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  buildPilotPayload,
  parseCaptionLines,
} from "./generate-episode-guide-v2-pilot.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "demo",
  "episode-guide-v2-newest-five-candidates.js",
);
const GENERATED = "2026-07-29";
const EXCERPT_WORD_LIMIT = 16;
const TARGET_CUTS = 12;
const TARGET_CHAPTERS = 6;
const TARGET_THREADS = 6;
const OPENING_MAX_PERCENT = 10;
const CLOSING_MIN_PERCENT = 90;
const MIN_SPAN_PERCENT = 80;
const X6_ID = "x6tvsGRHgU0";

export const NEWEST_FIVE_CONFIGS = Object.freeze([
  {
    id: "LV2rmwEA0w4",
    artifact: "public/demo/livestream-distill.js",
    global: "WWAM_LIVESTREAMS",
    contentMode: "movie-news",
    guideFormat: "movie-news",
    role: "frozen-newest-01",
  },
  {
    id: "iz0WFhe6LYM",
    artifact: "public/demo/livestream-distill.js",
    global: "WWAM_LIVESTREAMS",
    contentMode: "movie-news",
    guideFormat: "movie-news",
    role: "frozen-newest-02",
  },
  {
    id: "ag3axSC9BpU",
    artifact: "public/demo/livestream-distill.js",
    global: "WWAM_LIVESTREAMS",
    contentMode: "movie-news",
    guideFormat: "movie-news",
    role: "frozen-newest-03",
  },
  {
    id: X6_ID,
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    contentMode: "visual-ranking",
    guideFormat: "ranking",
    role: "frozen-newest-04-recovered-local-asr",
  },
  {
    id: "7PzSj-oIRjA",
    artifact: "public/demo/livestream-distill.js",
    global: "WWAM_LIVESTREAMS",
    contentMode: "movie-news",
    guideFormat: "movie-news",
    role: "frozen-newest-05",
  },
]);

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/>>+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
}

function boundedExcerpt(value, limit = EXCERPT_WORD_LIMIT) {
  return words(value).slice(0, limit).join(" ");
}

function formatTime(totalSeconds) {
  const value = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return `sha256:${crypto.createHash("sha256").update(input).digest("hex")}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadWindowAssignment(filePath, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, {
    filename: filePath,
  });
  const payload = context.window[globalName];
  if (!payload || typeof payload !== "object") {
    throw new Error(`${globalName} was not found in ${filePath}.`);
  }
  return clone(payload);
}

function sourceRecords(payload) {
  for (const key of ["streams", "records", "sources"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  throw new Error("Canonical artifact does not expose a source array.");
}

function sourceInput(config, rootDir) {
  const artifactPath = path.join(rootDir, config.artifact);
  const artifactRaw = fs.readFileSync(artifactPath);
  const payload = loadWindowAssignment(artifactPath, config.global);
  const source = sourceRecords(payload).find((record) => record.id === config.id);
  if (!source) {
    throw new Error(`${config.id} was not found in ${config.artifact}.`);
  }
  const captionPath = path.join(
    rootDir,
    "source-cache",
    "captions",
    `${config.id}.json`,
  );
  const metadataPath = path.join(
    rootDir,
    "source-cache",
    "metadata",
    `${config.id}.json`,
  );
  const captionRaw = fs.readFileSync(captionPath);
  const captionPayload = JSON.parse(captionRaw.toString("utf8"));
  const metadataRaw = fs.readFileSync(metadataPath);
  const metadata = JSON.parse(metadataRaw.toString("utf8"));
  const lines = parseCaptionLines(captionPayload).filter(
    (line) =>
      line.at < Number(source.duration) &&
      words(line.text).length >= 4,
  );
  if (lines.length < 100) {
    throw new Error(`${config.id} caption/transcript cache is unexpectedly thin.`);
  }
  return {
    source,
    artifactRaw,
    captionRaw,
    captionPayload,
    metadataRaw,
    metadata,
    lines,
  };
}

function captionProvenance(config, input) {
  if (config.id === X6_ID) {
    const provenance = input.captionPayload._shokkerProvenance || {};
    if (
      provenance.kind !== "local-speech-to-text" ||
      provenance.engine !== "faster-whisper" ||
      provenance.model !== "large-v3-turbo" ||
      provenance.canonicalTimestampMapping !== true
    ) {
      throw new Error("x6 local-ASR provenance is incomplete or changed.");
    }
    return {
      type: "local-speech-to-text",
      track: "English local speech-to-text transcript from exact public YouTube audio",
      eventType: "local-asr-segment",
      engine: provenance.engine,
      model: provenance.model,
      language: provenance.language || "en",
      languageProbability: provenance.languageProbability,
      speakerDiarized: false,
      audioSourceKind: provenance.audioSourceKind,
      canonicalTimestampMapping: true,
      fullPayloadPublic: false,
    };
  }
  const captionUrl = clean(input.metadata.caption_url);
  if (!/[?&]kind=asr(?:&|$)/.test(captionUrl) || !/[?&]lang=en(?:&|$)/.test(captionUrl)) {
    throw new Error(`${config.id} metadata no longer proves the cached English ASR track.`);
  }
  return {
    type: "youtube-automatic-caption",
    track: "English YouTube automatic captions (JSON3)",
    eventType: "youtube-json3-caption-event",
    kind: "asr",
    language: "en",
    speakerDiarized: false,
    fullPayloadPublic: false,
  };
}

function evidenceFor(config, provenance, cut) {
  return {
    type: provenance.type,
    track: provenance.track,
    timestampStatus:
      config.id === X6_ID ? "local-asr-segment" : "caption-event",
    sourceAt: cut.at,
    excerptStatus: "short-source-fragment",
    speakerStatus: "not-diarized",
    performerStatus: "not-inferred",
    originStatus: "not-inferred",
    visualOutcomeStatus:
      config.guideFormat === "ranking" ? "not-verified" : "not-applicable",
    reviewStatus: "machine-candidate-unreviewed",
    promotionAllowed: false,
  };
}

function boundaryCut(config, input, provenance, boundary) {
  const duration = Number(input.source.duration);
  const targetPercent = boundary === "opening" ? 5 : 95;
  const target = duration * targetPercent / 100;
  const candidates = input.lines.filter((line) => {
    const percent = line.at / duration * 100;
    return boundary === "opening"
      ? percent <= OPENING_MAX_PERCENT
      : percent >= CLOSING_MIN_PERCENT;
  });
  if (!candidates.length) {
    throw new Error(`${config.id} has no ${boundary} source line inside the required band.`);
  }
  const line = candidates
    .slice()
    .sort(
      (left, right) =>
        Math.abs(left.at - target) - Math.abs(right.at - target) ||
        left.at - right.at,
    )[0];
  const at = Math.max(0, Math.floor(line.at));
  const end = Math.min(
    duration,
    Math.max(at + 1, Math.ceil(Number(line.end) || at + 4)),
  );
  const label = boundary === "opening"
    ? "TAPE OPEN // SOURCE TIMELINE"
    : "TAPE CLOSE // SOURCE TIMELINE";
  const cut = {
    id: "",
    at,
    end,
    label,
    category: boundary === "opening" ? "TAPE OPEN" : "TAPE CLOSE",
    topic: "Source timeline",
    excerpt: boundedExcerpt(line.text),
    score: 0,
    substance: Math.min(16, words(line.text).length),
    editorialEvidence: "",
    categorySupport: 0,
    categoryEvidence: "",
    topicBasis:
      config.id === X6_ID
        ? "runtime-boundary-local-asr-segment"
        : "runtime-boundary-caption-event",
    topicSupport: 0,
    topicEvidence: "",
    verdictSignal: 0,
    verdictEvidence: "",
    evidenceBasis:
      config.id === X6_ID
        ? "runtime-band+exact-source-local-asr"
        : "runtime-band+youtube-automatic-caption",
    anchor: {
      kind: config.id === X6_ID ? "local-asr-band" : "caption-band",
      at,
      targetAt: Math.floor(target),
      offsetSeconds: Math.round(at - target),
    },
  };
  cut.evidence = evidenceFor(config, provenance, cut);
  return cut;
}

function redundantCutIndex(cuts, boundary) {
  const counts = new Map();
  cuts.forEach((cut) => {
    counts.set(cut.topic, (counts.get(cut.topic) || 0) + 1);
  });
  const indexes = cuts
    .map((cut, index) => ({ cut, index }))
    .filter(({ cut }) => (counts.get(cut.topic) || 0) > 1);
  if (!indexes.length) {
    throw new Error("Cannot preserve six recurring threads while inserting a runtime boundary.");
  }
  return boundary === "opening"
    ? indexes.sort((left, right) => left.cut.at - right.cut.at)[0].index
    : indexes.sort((left, right) => right.cut.at - left.cut.at)[0].index;
}

function repairRuntimeCoverage(config, input, provenance, originalCuts) {
  const duration = Number(input.source.duration);
  const cuts = clone(originalCuts);
  cuts.forEach((cut) => {
    cut.excerpt = boundedExcerpt(cut.excerpt);
    cut.end = Math.min(duration, Math.max(cut.at + 1, Number(cut.end)));
    cut.evidence = evidenceFor(config, provenance, cut);
    if (config.id === X6_ID) {
      cut.topicBasis = clean(cut.topicBasis)
        .replace(/local-caption/gi, "local-asr");
      cut.evidenceBasis = clean(cut.evidenceBasis)
        .replace(/local-caption/gi, "local-asr");
    }
  });
  cuts.sort((left, right) => left.at - right.at || left.id.localeCompare(right.id));

  if (cuts[0].at / duration * 100 > OPENING_MAX_PERCENT) {
    const removeAt = redundantCutIndex(cuts, "opening");
    cuts.splice(removeAt, 1);
    cuts.push(boundaryCut(config, input, provenance, "opening"));
  }
  cuts.sort((left, right) => left.at - right.at || left.id.localeCompare(right.id));
  if (cuts.at(-1).end / duration * 100 < CLOSING_MIN_PERCENT) {
    const removeAt = redundantCutIndex(cuts, "closing");
    cuts.splice(removeAt, 1);
    cuts.push(boundaryCut(config, input, provenance, "closing"));
  }
  cuts.sort((left, right) => left.at - right.at || left.id.localeCompare(right.id));
  if (cuts.length !== TARGET_CUTS) {
    throw new Error(`${config.id} produced ${cuts.length} cuts instead of ${TARGET_CUTS}.`);
  }
  return cuts.map((cut, index) => ({
    ...cut,
    id: `newest-five-cut-${String(index + 1).padStart(2, "0")}-${cut.at}`,
  }));
}

function evenlySpaced(values, count) {
  return Array.from({ length: count }, (_, index) => {
    const at = Math.round(index * (values.length - 1) / (count - 1));
    return values[at];
  });
}

function chapterBody(config, cut) {
  const evidenceLabel = config.id === X6_ID
    ? "exact-source local-ASR transcript"
    : "exact English YouTube automatic-caption track";
  const rankingBoundary = config.guideFormat === "ranking"
    ? " No unseen ranking result is asserted."
    : "";
  return `${cut.label} reaches the ${evidenceLabel} at ${formatTime(cut.at)}. ` +
    `The short source fragment is "${cut.excerpt}". Speaker identity remains unset.${rankingBoundary}`;
}

function rebuildChapters(config, cuts) {
  return evenlySpaced(cuts, TARGET_CHAPTERS).map((cut, index) => ({
    id: `newest-five-act-${String(index + 1).padStart(2, "0")}`,
    act: index + 1,
    label: cut.label,
    at: cut.at,
    end: cut.end,
    body: chapterBody(config, cut),
    excerpt: cut.excerpt,
    category: cut.category,
    topic: cut.topic,
    cutId: cut.id,
    evidenceBasis: cut.evidenceBasis,
  }));
}

function rebuildTakeArc(config, cuts) {
  const selected = [cuts[0], cuts[Math.floor(cuts.length / 2)], cuts.at(-1)];
  const phases = ["OPENING READ", "MIDNIGHT TURN", "FINAL SOURCE WINDOW"];
  return selected.map((cut, index) => ({
    phase: phases[index],
    label: cut.label,
    at: cut.at,
    end: cut.end,
    body: chapterBody(config, cut),
    excerpt: cut.excerpt,
    category: cut.category,
    cutId: cut.id,
    evidenceBasis: cut.evidenceBasis,
  }));
}

function featureFromCut(key, label, cut) {
  if (!cut) return null;
  return {
    key,
    label,
    body: `${cut.label} reaches the source at ${formatTime(cut.at)}: "${cut.excerpt}".`,
    at: cut.at,
    end: cut.end,
    cutId: cut.id,
    category: cut.category,
    topic: cut.topic,
    excerpt: cut.excerpt,
    evidenceBasis: cut.evidenceBasis,
  };
}

function rebuildFanRead(original, cuts, threads) {
  const findOriginal = (value) => {
    if (!value || !Number.isFinite(Number(value.at))) return null;
    return cuts.find((cut) => cut.at === Number(value.at)) || null;
  };
  const strongest = cuts
    .filter((cut) => cut.topic !== "Source timeline")
    .slice()
    .sort((left, right) => right.score - left.score || left.at - right.at)[0];
  const wild = findOriginal(original.wildestDetour) ||
    cuts.find((cut) =>
      /FULL SEND|UP IN YA|THE ROOM BREAKS|OUT OF POCKET/.test(cut.category),
    );
  const loved = findOriginal(original.loved);
  return {
    whyThisNightMatters: {
      label: "WHY THIS NIGHT MATTERS",
      body: `${threads[0].name} and ${(threads[1] || threads[0]).name} carry the recurring source map. ` +
        `The strongest retained stop lands at ${formatTime(strongest.at)} without assigning the words to a speaker.`,
      primaryThread: threads[0].name,
      secondaryThread: (threads[1] || threads[0]).name,
      strongestCutId: strongest.id,
    },
    loved: featureFromCut("loved", "WHAT THE TAPE MAY BE DEFENDING", loved),
    hated: null,
    wildestDetour: featureFromCut("wildestDetour", "WWAM UP IN YA // CANDIDATE", wild),
    lastWord: featureFromCut(
      "lastWord",
      "FINAL SOURCE WINDOW",
      cuts.at(-1),
    ),
  };
}

function runtimeCoverage(duration, cuts) {
  const first = cuts[0].at;
  const last = cuts.at(-1).end;
  return {
    firstAt: first,
    lastEnd: last,
    openingPercent: Number((first / duration * 100).toFixed(2)),
    closingPercent: Number((last / duration * 100).toFixed(2)),
    spanPercent: Number(((last - first) / duration * 100).toFixed(2)),
    openingGatePercent: OPENING_MAX_PERCENT,
    closingGatePercent: CLOSING_MIN_PERCENT,
    spanGatePercent: MIN_SPAN_PERCENT,
  };
}

function newestGuide(config, input, pilotRecord, provenance) {
  const guide = clone(pilotRecord.episodeGuide);
  const cuts = repairRuntimeCoverage(
    config,
    input,
    provenance,
    guide.cuts,
  );
  const threads = clone(guide.threads).slice(0, TARGET_THREADS);
  const representedTopics = new Set(
    cuts.filter((cut) => cut.topic !== "Source timeline").map((cut) => cut.topic),
  );
  const missingThread = threads.find((thread) => !representedTopics.has(thread.name));
  if (missingThread) {
    throw new Error(
      `${config.id} lost its only displayed cut for thread ${missingThread.name}.`,
    );
  }
  const coverage = runtimeCoverage(Number(input.source.duration), cuts);
  const guideBasis = config.id === X6_ID
    ? "Canonical topics and public-moment candidates re-matched to bounded exact-source local faster-whisper ASR segments. Speaker, performer, origin, visual ranking outcome, creator approval, and human editorial review remain unverified."
    : "Canonical topics and public-moment candidates re-matched to bounded local English YouTube automatic-caption events. Speaker, performer, origin, creator approval, and human editorial review remain unverified.";
  const fanRead = rebuildFanRead(guide.fanRead || {}, cuts, threads);
  const chapters = rebuildChapters(config, cuts);
  const takeArc = rebuildTakeArc(config, cuts);
  const opening = cuts[0];
  const closing = cuts.at(-1);
  return {
    schema: "wwam-episode-guide/v2",
    variant: "newest-five-machine-candidate",
    format: config.guideFormat,
    sourceContentMode:
      config.id === X6_ID ? "ranking-show" : config.contentMode,
    publicationStatus: "review-quarantined",
    promotionAllowed: false,
    humanEditorialReviewPerformed: false,
    creatorApprovalClaimed: false,
    basis: guideBasis,
    overview:
      `${input.source.title} on ${input.source.date} becomes a six-chapter, twelve-stop exact-source map. ` +
      `The route opens at ${formatTime(opening.at)}, follows ${threads.slice(0, 3).map((thread) => thread.name).join(", ")}, ` +
      `and reaches the closing source window at ${formatTime(closing.at)}. ` +
      (config.guideFormat === "ranking"
        ? "The spoken discussion is mapped; no unseen tier or ranking result is claimed."
        : "The words remain attached to the source; no speaker identity is inferred."),
    evidenceSummary:
      `${config.id} maps ${cuts.length} bounded cuts, ${chapters.length} chapters, and ${threads.length} recurring threads. ` +
      `The route spans ${coverage.spanPercent}% of the exact runtime, from ${coverage.openingPercent}% to ${coverage.closingPercent}%. ` +
      `Every excerpt is capped at ${EXCERPT_WORD_LIMIT} words and promotion remains disabled.`,
    shape: {
      runtimeBand: "MARATHON",
      chapters: chapters.length,
      threads: threads.length,
      cuts: cuts.length,
    },
    runtimeCoverage: coverage,
    sourceEvidence: provenance,
    fanRead,
    chapters,
    takeArc,
    threads,
    cuts,
    reviewChecklist: [
      "Confirm every in/out point against the exact official upload.",
      "Keep speaker and performer fields unset until a human verifies them.",
      "Keep every evaluative fan-read lane candidate-only until reviewed in context.",
      ...(config.guideFormat === "ranking"
        ? ["Confirm any visual tier or ranking result from the picture before describing it."]
        : []),
      "Keep promotion disabled and creator approval unclaimed.",
    ],
    metrics: {
      chapters: chapters.length,
      threads: threads.length,
      cuts: cuts.length,
      praise: fanRead.loved ? 1 : 0,
      negative: 0,
      comedy: fanRead.wildestDetour ? 1 : 0,
      substantive: cuts.filter((cut) => Number(cut.substance) >= 8).length,
      openingPercent: coverage.openingPercent,
      closingPercent: coverage.closingPercent,
      runtimeSpanPercent: coverage.spanPercent,
    },
  };
}

function candidateRecord(config, input, pilotRecord) {
  const provenance = captionProvenance(config, input);
  const episodeGuide = newestGuide(config, input, pilotRecord, provenance);
  const record = {
    id: config.id,
    title: input.source.title,
    date: input.source.date,
    duration: Number(input.source.duration),
    role: config.role,
    guideFormat: config.guideFormat,
    sourceContentMode:
      config.id === X6_ID ? "ranking-show" : config.contentMode,
    sourceArtifact: config.artifact,
    sourceState: {
      coverage: "caption-backed",
      evidenceState: "machine-surfaced",
      reviewState: "machine-candidate-unreviewed",
      publicationStatus: "held-for-strict-machine-audit",
      promotionAllowed: false,
      humanEditorialReviewPerformed: false,
      creatorApprovalClaimed: false,
    },
    rightsPolicy: {
      ...(input.source.rightsPolicy || {}),
      restrictedToTopicNavigation: false,
      publicExcerptWordLimit: Math.min(
        EXCERPT_WORD_LIMIT,
        Number(input.source.rightsPolicy?.publicExcerptWordLimit) ||
          EXCERPT_WORD_LIMIT,
      ),
      speakerClaimsAllowed: false,
      performerClaimsAllowed: false,
      originClaimsAllowed: false,
      visualClaimsAllowed: false,
      visualResultClaimsAllowed: false,
      promotionAllowed: false,
    },
    inputEvidence: {
      canonicalArtifactSha256: sha256(input.artifactRaw),
      captionSha256: sha256(input.captionRaw),
      metadataSha256: sha256(input.metadataRaw),
      captionEventsParsed: input.lines.length,
      captionProvenance: provenance,
    },
    episodeGuide,
  };
  return {
    ...record,
    generationSha256: sha256(stableJson(record)),
  };
}

export function buildNewestFiveCandidates(options = {}) {
  const rootDir = options.rootDir || PROJECT_ROOT;
  const configs = options.configs || NEWEST_FIVE_CONFIGS;
  const pilot = buildPilotPayload({
    rootDir,
    configs: configs.map((config) => ({
      id: config.id,
      artifact: config.artifact,
      global: config.global,
      contentMode: config.contentMode,
      role: config.role,
    })),
  });
  const pilotById = new Map(pilot.guides.map((record) => [record.id, record]));
  const guides = configs.map((config) => {
    const pilotRecord = pilotById.get(config.id);
    if (!pilotRecord) {
      throw new Error(`The pilot builder did not return ${config.id}.`);
    }
    return candidateRecord(
      config,
      sourceInput(config, rootDir),
      pilotRecord,
    );
  });
  const core = {
    schema: "wwam-episode-guide-v2-newest-five-candidates/v1",
    generated: GENERATED,
    selection: {
      snapshot: "frozen-official-streams-feed-through-2026-07-23",
      ids: configs.map((config) => config.id),
      july23Included: configs.some(
        (config) => config.id === "LV2rmwEA0w4",
      ),
      sourceArtifacts: [...new Set(configs.map((config) => config.artifact))],
    },
    policy: {
      eligibleCoverage: "caption-backed",
      publicExcerptWordLimit: EXCERPT_WORD_LIMIT,
      openingMaxPercent: OPENING_MAX_PERCENT,
      closingMinPercent: CLOSING_MIN_PERCENT,
      minimumRuntimeSpanPercent: MIN_SPAN_PERCENT,
      speakerAttributionAllowed: false,
      performerAttributionAllowed: false,
      originAttributionAllowed: false,
      visualRankingOutcomeClaimsAllowed: false,
      promotionAllowed: false,
      humanEditorialReviewPerformed: false,
      creatorApprovalClaimed: false,
      reviewState: "machine-candidate-unreviewed",
    },
    provenance: {
      generator: "scripts/generate-episode-guide-v2-newest-five.mjs",
      method:
        "Deterministic exact-source guide generation from frozen canonical records, local caption/transcript caches, bounded source fragments, and enforced opening/closing runtime coverage.",
    },
    meta: {
      guides: guides.length,
      chapters: guides.reduce(
        (total, record) => total + record.episodeGuide.chapters.length,
        0,
      ),
      threads: guides.reduce(
        (total, record) => total + record.episodeGuide.threads.length,
        0,
      ),
      cuts: guides.reduce(
        (total, record) => total + record.episodeGuide.cuts.length,
        0,
      ),
    },
    guides,
  };
  const contentSha256 = sha256(stableJson(core));
  return {
    ...core,
    provenance: {
      ...core.provenance,
      contentSha256,
    },
  };
}

export function renderNewestFiveCandidates(payload) {
  return `window.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_CANDIDATES = ${JSON.stringify(payload)};\n`;
}

function cli() {
  const args = new Set(process.argv.slice(2));
  const payload = buildNewestFiveCandidates();
  const rendered = renderNewestFiveCandidates(payload);
  if (args.has("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated artifact: ${OUTPUT_PATH}`);
    }
    if (fs.readFileSync(OUTPUT_PATH, "utf8") !== rendered) {
      throw new Error(
        "episode-guide-v2-newest-five-candidates.js is stale; run the generator.",
      );
    }
    process.stdout.write(
      `Newest-five candidates are deterministic and current: ${payload.meta.guides} guides, ` +
        `${payload.meta.cuts} cuts, ${payload.provenance.contentSha256}\n`,
    );
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered, "utf8");
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}: ${payload.meta.guides} guides, ` +
      `${payload.meta.chapters} chapters, ${payload.meta.threads} threads, ` +
      `${payload.meta.cuts} cuts, ${payload.provenance.contentSha256}\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  cli();
}
