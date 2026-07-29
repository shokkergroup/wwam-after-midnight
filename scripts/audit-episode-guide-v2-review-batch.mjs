import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  buildReviewBatch,
  parseCaptionLines,
  titleTopicMatchWeight,
} from "./generate-episode-guide-v2-review-batch.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "demo",
  "episode-guide-v2-editorial-review.js",
);
const GENERATED = "2026-07-29";
const PROMOTION_TARGET = 10;
const STRUCTURAL_TITLE_TOPICS = new Set([
  "Movie News",
  "Rankings & Lists",
]);

const CONNECTIVE_START =
  /^(?:and|but|so|because|that|the|then|uh|um|like|yeah|well)\b/i;
const INCOMPLETE_END =
  /\b(?:and|or|but|to|the|a|an|of|with|for|because|like|that|if|when|while|i|you|we|is|are|was|were|be|been|being|have|has|had|do|does|did|going|got|said|made)\s*$/i;
const SPEAKER_CLAIM =
  /\b(?:Mike|J|Jay)\s+(?:says|said|calls|called|thinks|thought|hates|loves|predicts|predicted)\b|\bthey\s+(?:say|said|think|thought|love|hate|predict|predicted)\b/i;
const VISUAL_OUTCOME_CLAIM =
  /\b(?:wins?|won|winner|takes down|advances?|eliminat(?:e|ed|es)|beats?)\b/i;
const ORIGIN_OR_PERFORMANCE_CLAIM =
  /\b(?:performed|portrayed|voiced|impersonated|spoken by|said by|delivered by|played by)\b/i;
const OPINION_OR_HOST_DISCOURSE =
  /\b(?:i|i'm|i've|we|we're|we've|you|my|our|think|thought|love|hate|liked|movie|film|trailer|chat|ranking|rank|review|watch|watched)\b/i;
const EMBEDDED_MEDIA_CUE =
  /\b(?:play|playing|watch|watching|listen|listening)\b(?:\W+\w+){0,6}\W+\b(?:trailer|clip|footage)\b|\b(?:trailer|clip|footage)\b(?:\W+\w+){0,6}\W+\b(?:play|playing|watch|watching|listen|listening)\b/i;
const FILLER_WORDS = new Set([
  "ah",
  "basically",
  "er",
  "like",
  "literally",
  "uh",
  "um",
  "yeah",
  "well",
]);

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function normalized(value) {
  return words(value).join(" ").toLowerCase();
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

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function round(value, places = 2) {
  return Number(Number(value).toFixed(places));
}

function loadWindowPayload(filePath) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, {
    filename: filePath,
  });
  const values = Object.values(context.window);
  if (values.length !== 1 || !values[0] || typeof values[0] !== "object") {
    throw new Error(`Expected one window payload in ${filePath}`);
  }
  return JSON.parse(JSON.stringify(values[0]));
}

function sourceRecords(payload) {
  for (const key of ["streams", "records", "sources"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  throw new Error("Canonical source artifact has no source collection.");
}

function canonicalSources(rootDir, artifactPaths) {
  const sources = new Map();
  const topicUniverse = new Set();
  for (const relativePath of artifactPaths) {
    const payload = loadWindowPayload(path.join(rootDir, relativePath));
    for (const source of sourceRecords(payload)) {
      if (!sources.has(source.id)) sources.set(source.id, source);
      for (const topic of Array.isArray(source.topics) ? source.topics : []) {
        if (topic?.name) topicUniverse.add(topic.name);
      }
    }
  }
  return {
    sources,
    topicUniverse: [...topicUniverse].sort(),
  };
}

function allGuides(batch) {
  return batch.shards.flatMap((shard) => shard.guides);
}

function comparableToken(token) {
  return String(token).toLowerCase().replace(/'s$/i, "");
}

function topicEvidenceAppears(excerpt, evidence) {
  const excerptTokens = words(excerpt).map(comparableToken);
  const evidenceTokens = words(evidence).map(comparableToken);
  if (!evidenceTokens.length) return false;
  const needle = evidenceTokens.join(" ");
  for (
    let index = 0;
    index <= excerptTokens.length - evidenceTokens.length;
    index += 1
  ) {
    if (
      excerptTokens.slice(index, index + evidenceTokens.length).join(" ") ===
      needle
    ) {
      return true;
    }
  }
  return false;
}

function adjacentRepeatCount(tokens) {
  let repeats = 0;
  for (let index = 1; index < tokens.length; index += 1) {
    if (comparableToken(tokens[index]) === comparableToken(tokens[index - 1])) {
      repeats += 1;
    }
  }
  return repeats;
}

function excerptAudit(cuts) {
  const cutReviews = [];
  const totals = {
    connectiveStarts: 0,
    incompleteEnds: 0,
    adjacentRepeats: 0,
    highFiller: 0,
    lowercaseStarts: 0,
    shortExcerpts: 0,
    stageDirections: 0,
    missingTopicEvidence: 0,
    sensitiveLanguage: 0,
  };

  for (const cut of cuts) {
    const tokens = words(cut.excerpt);
    const fillerCount = tokens.filter((token) =>
      FILLER_WORDS.has(token.toLowerCase()),
    ).length;
    const fillerRatio = tokens.length ? fillerCount / tokens.length : 1;
    const repeats = adjacentRepeatCount(tokens);
    const flags = [];
    let score = 100;
    if (CONNECTIVE_START.test(cut.excerpt)) {
      flags.push("CONNECTIVE_START");
      totals.connectiveStarts += 1;
      score -= 4;
    }
    if (/^[a-z]/.test(cut.excerpt)) {
      flags.push("LOWERCASE_FRAGMENT_START");
      totals.lowercaseStarts += 1;
      score -= 7;
    }
    if (INCOMPLETE_END.test(cut.excerpt)) {
      flags.push("INCOMPLETE_END");
      totals.incompleteEnds += 1;
      score -= 7;
    }
    if (repeats) {
      flags.push("ADJACENT_WORD_REPEAT");
      totals.adjacentRepeats += repeats;
      score -= Math.min(12, repeats * 6);
    }
    if (fillerRatio > 0.25) {
      flags.push("HIGH_FILLER_DENSITY");
      totals.highFiller += 1;
      score -= 10;
    }
    if (tokens.length < 8) {
      flags.push("THIN_EXCERPT");
      totals.shortExcerpts += 1;
      score -= 18;
    }
    if (/\[[^\]]+\]/.test(cut.excerpt)) {
      flags.push("CAPTION_STAGE_DIRECTION");
      totals.stageDirections += 1;
      score -= 20;
    }
    if (!topicEvidenceAppears(cut.excerpt, cut.topicEvidence)) {
      flags.push("TOPIC_EVIDENCE_MISSING");
      totals.missingTopicEvidence += 1;
      score -= 35;
    }
    if (
      /\b(?:fuck|fucking|shit|dick|cock|asshole|bitch|bastard)\b/i.test(
        cut.excerpt,
      )
    ) {
      flags.push("SENSITIVE_LANGUAGE_REVIEW");
      totals.sensitiveLanguage += 1;
    }
    cutReviews.push({
      cutId: cut.id,
      at: cut.at,
      topic: cut.topic,
      wordCount: tokens.length,
      fillerRatio: round(fillerRatio, 3),
      flags,
      qualityScore: clamp(score),
    });
  }

  const averageScore = round(
    cutReviews.reduce((sum, cut) => sum + cut.qualityScore, 0) /
      Math.max(1, cutReviews.length),
  );
  return {
    score: averageScore,
    issueCounts: totals,
    lowestCutScore: Math.min(
      ...cutReviews.map((cut) => cut.qualityScore),
    ),
    cutsBelow80: cutReviews.filter((cut) => cut.qualityScore < 80).length,
    cutReviews,
  };
}

function captionAudit(record, rootDir) {
  const captionPath = path.join(
    rootDir,
    "source-cache",
    "captions",
    `${record.id}.json`,
  );
  const lines = parseCaptionLines(
    JSON.parse(fs.readFileSync(captionPath, "utf8")),
  );
  let exactLocality = 0;
  let excerptInWindow = 0;
  let topicInExcerpt = 0;
  let anchorWithinBound = 0;
  for (const cut of record.episodeGuide.cuts) {
    if (cut.at === cut.evidence.captionAt) exactLocality += 1;
    const local = lines
      .filter(
        (line) =>
          Math.abs(line.at - cut.evidence.captionAt) <=
          cut.evidence.localWindowSeconds,
      )
      .map((line) => line.text)
      .join(" ");
    if (normalized(local).includes(normalized(cut.excerpt))) {
      excerptInWindow += 1;
    }
    if (topicEvidenceAppears(cut.excerpt, cut.topicEvidence)) {
      topicInExcerpt += 1;
    }
    if (cut.anchor.deltaSeconds <= cut.anchor.maxAllowedDeltaSeconds) {
      anchorWithinBound += 1;
    }
  }
  const total = record.episodeGuide.cuts.length;
  const first = record.episodeGuide.cuts[0];
  const last = record.episodeGuide.cuts.at(-1);
  const runtimeSpanRatio = (last.at - first.at) / Number(record.duration || 1);
  const occupiedBands = new Set(
    record.episodeGuide.cuts.map((cut) =>
      Math.min(5, Math.floor((cut.at / Number(record.duration || 1)) * 6)),
    ),
  ).size;
  const localityRate =
    Math.min(
      exactLocality,
      excerptInWindow,
      topicInExcerpt,
      anchorWithinBound,
    ) / Math.max(1, total);
  const score = clamp(
    localityRate * 60 +
      Math.min(1, runtimeSpanRatio / 0.75) * 25 +
      Math.min(1, occupiedBands / 5) * 15,
  );
  return {
    score: round(score),
    exactLocality,
    excerptInWindow,
    topicInExcerpt,
    anchorWithinBound,
    totalCuts: total,
    localityRate: round(localityRate, 3),
    runtimeSpanRatio: round(runtimeSpanRatio, 3),
    occupiedRuntimeBands: occupiedBands,
    chronological:
      record.episodeGuide.cuts.every(
        (cut, index, cuts) => index === 0 || cut.at > cuts[index - 1].at,
      ),
  };
}

function titleAudit(record, source, topicUniverse) {
  const sourceTopics = new Set(source.topics.map((topic) => topic.name));
  const titleTopics = topicUniverse
    .map((topicName, universeIndex) => ({
      name: topicName,
      universeIndex,
      matchWeight: titleTopicMatchWeight(source.title, topicName),
    }))
    .filter((topic) => topic.matchWeight > 0)
    .sort(
      (left, right) =>
        right.matchWeight - left.matchWeight ||
        left.universeIndex - right.universeIndex,
    );
  const cutTopics = new Set(
    record.episodeGuide.cuts.map((cut) => cut.topic),
  );
  const threadTopics = new Set(
    record.episodeGuide.threads.map((thread) => thread.name),
  );
  const subjectTitleTopics = titleTopics.filter(
    (topic) => !STRUCTURAL_TITLE_TOPICS.has(topic.name),
  );
  const structuralTitleTopics = titleTopics.filter((topic) =>
    STRUCTURAL_TITLE_TOPICS.has(topic.name),
  );
  const covered = subjectTitleTopics.filter(
    (topic) => cutTopics.has(topic.name) && threadTopics.has(topic.name),
  );
  const missingFromCanonicalSource = subjectTitleTopics.filter(
    (topic) => !sourceTopics.has(topic.name),
  );
  const coverageRate = subjectTitleTopics.length
    ? covered.length / subjectTitleTopics.length
    : 1;
  const leadAligned = subjectTitleTopics.length
    ? subjectTitleTopics[0].name === record.episodeGuide.threads[0]?.name
    : true;
  const score = subjectTitleTopics.length
    ? clamp(coverageRate * 65 + Number(leadAligned) * 35)
    : 82;
  return {
    score: round(score),
    titleTopics: titleTopics.map((topic) => topic.name),
    subjectTitleTopics: subjectTitleTopics.map((topic) => topic.name),
    structuralTitleSignals: structuralTitleTopics.map((topic) => topic.name),
    coveredTitleTopics: covered.map((topic) => topic.name),
    titleTopicsMissingFromCanonicalSource: missingFromCanonicalSource.map(
      (topic) => topic.name,
    ),
    coverageRate: round(coverageRate, 3),
    leadThread: record.episodeGuide.threads[0]?.name || "",
    leadAligned,
    genericTitleWithoutCanonicalSubject: subjectTitleTopics.length === 0,
  };
}

function stripSourceExcerpts(text, record) {
  let stripped = String(text ?? "");
  for (const excerpt of record.episodeGuide.cuts
    .map((cut) => cut.excerpt)
    .sort((left, right) => right.length - left.length)) {
    stripped = stripped.split(excerpt).join("<SOURCE TAPE>");
  }
  return stripped;
}

function generatedProse(record) {
  const episode = record.episodeGuide;
  return stripSourceExcerpts(
    [
      episode.overview,
      episode.evidenceSummary,
      episode.recap.headline,
      episode.recap.dek,
      ...episode.recap.paragraphs.map((paragraph) => paragraph.body),
      ...episode.chapters.map((chapter) => chapter.body),
      ...Object.values(episode.lanes)
        .filter(Boolean)
        .map((lane) => lane.body),
    ].join("\n"),
    record,
  );
}

function claimAudit(record) {
  const prose = generatedProse(record);
  const speakerClaims = (prose.match(new RegExp(SPEAKER_CLAIM, "gi")) || [])
    .length;
  const originOrPerformanceClaims = (
    prose.match(new RegExp(ORIGIN_OR_PERFORMANCE_CLAIM, "gi")) || []
  ).length;
  const visualClaims =
    record.guideFormat === "ranking"
      ? (
          prose.match(new RegExp(VISUAL_OUTCOME_CLAIM, "gi")) || []
        ).length +
        record.episodeGuide.cuts.filter((cut) =>
          VISUAL_OUTCOME_CLAIM.test(cut.excerpt),
        ).length
      : 0;
  const total = speakerClaims + originOrPerformanceClaims + visualClaims;
  return {
    score: total ? 0 : 100,
    speakerClaims,
    originOrPerformanceClaims,
    visualRankingClaims: visualClaims,
    hardGatePassed: total === 0,
  };
}

function sourceAudioAudit(record) {
  const cuts = record.episodeGuide.cuts;
  const audioBoundaryMode =
    /\b(?:source|trailer|member|watch)[- ]audio[- ]boundary\b|\baudio[- ]boundary[- ]unverified\b/i.test(
      record.rightsPolicy.mode,
    );
  const rightsBoundaryHeld =
    record.rightsPolicy.restrictedToTopicNavigation ||
    audioBoundaryMode;
  const stageDirectionCuts = cuts.filter((cut) =>
    /\[[^\]]+\]/.test(cut.excerpt),
  );
  const ambiguousTrailerCuts = cuts.filter(
    (cut) =>
      cut.topic === "Trailers" &&
      !OPINION_OR_HOST_DISCOURSE.test(cut.excerpt),
  );
  const embeddedMediaCueCuts = cuts.filter(
    (cut) => EMBEDDED_MEDIA_CUE.test(cut.excerpt),
  );
  let riskPoints = 0;
  if (rightsBoundaryHeld) riskPoints += 20;
  if (record.contentMode === "event-reaction") riskPoints += 3;
  riskPoints += ambiguousTrailerCuts.length * 3;
  riskPoints += embeddedMediaCueCuts.length * 3;
  riskPoints += stageDirectionCuts.length * 5;
  const risk =
    rightsBoundaryHeld || riskPoints >= 10
      ? "high"
      : riskPoints >= 3
        ? "guarded"
        : "low";
  return {
    score: clamp(100 - riskPoints * 5),
    risk,
    rightsBoundaryHeld,
    ambiguousTrailerCutIds: ambiguousTrailerCuts.map((cut) => cut.id),
    embeddedMediaCueCutIds: embeddedMediaCueCuts.map((cut) => cut.id),
    stageDirectionCutIds: stageDirectionCuts.map((cut) => cut.id),
    humanBoundaryReviewStillRequired: true,
  };
}

function templateFingerprint(text, record) {
  let value = stripSourceExcerpts(text, record);
  const substitutions = [
    record.title,
    record.date,
    record.id,
    ...new Set([
      ...record.episodeGuide.threads.map((thread) => thread.name),
      ...record.episodeGuide.cuts.map((cut) => cut.topic),
    ]),
  ]
    .filter(Boolean)
    .sort((left, right) => String(right).length - String(left).length);
  for (const substitution of substitutions) {
    value = value
      .split(String(substitution))
      .join("<FIELD>");
  }
  return clean(value)
    .toLowerCase()
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "<TIME>")
    .replace(/\b\d+(?:\.\d+)?\b/g, "<N>")
    .replace(/\s+/g, " ")
    .trim();
}

function fingerprintMaps(guides) {
  const maps = {
    headline: new Map(),
    overview: new Map(),
    recapLeadSet: new Map(),
  };
  function add(map, fingerprint, id) {
    if (!map.has(fingerprint)) map.set(fingerprint, []);
    map.get(fingerprint).push(id);
  }
  for (const record of guides) {
    add(
      maps.headline,
      templateFingerprint(record.episodeGuide.recap.headline, record),
      record.id,
    );
    add(
      maps.overview,
      templateFingerprint(record.episodeGuide.overview, record),
      record.id,
    );
    add(
      maps.recapLeadSet,
      templateFingerprint(
        record.episodeGuide.recap.paragraphs
          .map((paragraph) =>
            paragraph.body.split(". The exact bounded door")[0],
          )
          .join(" | "),
        record,
      ),
      record.id,
    );
  }
  return maps;
}

function repetitionAudit(record, maps) {
  const fingerprints = {
    headline: templateFingerprint(
      record.episodeGuide.recap.headline,
      record,
    ),
    overview: templateFingerprint(record.episodeGuide.overview, record),
    recapLeadSet: templateFingerprint(
      record.episodeGuide.recap.paragraphs
        .map((paragraph) =>
          paragraph.body.split(". The exact bounded door")[0],
        )
        .join(" | "),
      record,
    ),
  };
  const collisions = {
    headline: Math.max(
      0,
      (maps.headline.get(fingerprints.headline) || []).length - 1,
    ),
    overview: Math.max(
      0,
      (maps.overview.get(fingerprints.overview) || []).length - 1,
    ),
    recapLeadSet: Math.max(
      0,
      (maps.recapLeadSet.get(fingerprints.recapLeadSet) || []).length - 1,
    ),
  };
  const score = clamp(
    100 -
      collisions.headline * 8 -
      collisions.overview * 5 -
      collisions.recapLeadSet * 4,
    55,
    100,
  );
  return { score, collisions, fingerprints };
}

function issueCodes(review) {
  const issues = [];
  if (review.titleFit.coverageRate < 1) issues.push("TITLE_TOPIC_NOT_COVERED");
  if (review.titleFit.titleTopicsMissingFromCanonicalSource.length) {
    issues.push("TITLE_SUBJECT_MISSING_FROM_CANONICAL_TOPIC_MAP");
  }
  if (!review.titleFit.leadAligned) issues.push("TITLE_LEAD_MISMATCH");
  if (review.temporal.localityRate < 1) issues.push("TEMPORAL_LOCALITY_FAILURE");
  if (!review.temporal.chronological) issues.push("NON_CHRONOLOGICAL_CUTS");
  if (review.temporal.runtimeSpanRatio < 0.6) issues.push("LOW_RUNTIME_SPAN");
  if (review.temporal.occupiedRuntimeBands < 5) {
    issues.push("NARROW_RUNTIME_COVERAGE");
  }
  if (review.excerpts.score < 82) issues.push("CHOPPY_EXCERPT_SET");
  if (review.excerpts.cutsBelow80 > 3) issues.push("EXCERPT_REVIEW_LOAD_HIGH");
  if (review.claims.speakerClaims) issues.push("SPEAKER_CLAIM");
  if (review.claims.visualRankingClaims) issues.push("VISUAL_RANKING_CLAIM");
  if (review.claims.originOrPerformanceClaims) {
    issues.push("ORIGIN_OR_PERFORMANCE_CLAIM");
  }
  if (review.sourceAudio.risk === "guarded") {
    issues.push("SOURCE_AUDIO_BOUNDARY_GUARDED");
  }
  if (review.sourceAudio.risk === "high") {
    issues.push("SOURCE_AUDIO_BOUNDARY_HIGH_RISK");
  }
  if (review.repetition.score < 75) issues.push("TEMPLATE_REPETITION_HIGH");
  return issues;
}

function strengths(review) {
  const result = [];
  if (review.titleFit.score === 100) result.push("TITLE_ALIGNED");
  if (
    review.temporal.localityRate === 1 &&
    review.temporal.runtimeSpanRatio >= 0.75
  ) {
    result.push("FULL_RUNTIME_LOCALITY");
  }
  if (review.excerpts.score >= 90) result.push("CLEAN_EXCERPT_SET");
  if (review.claims.score === 100) result.push("CLAIM_SAFE");
  if (review.sourceAudio.risk === "low") result.push("LOW_SOURCE_AUDIO_RISK");
  if (review.repetition.score >= 90) result.push("DISTINCT_TEMPLATE");
  return result;
}

function compositeScore(review) {
  return round(
    review.titleFit.score * 0.2 +
      review.temporal.score * 0.22 +
      review.excerpts.score * 0.22 +
      review.claims.score * 0.18 +
      review.sourceAudio.score * 0.1 +
      review.repetition.score * 0.08,
  );
}

function promotionEligible(review) {
  return (
    review.claims.hardGatePassed &&
    review.temporal.localityRate === 1 &&
    review.temporal.chronological &&
    review.temporal.runtimeSpanRatio >= 0.6 &&
    review.titleFit.coverageRate === 1 &&
    review.titleFit.leadAligned &&
    review.excerpts.score >= 93 &&
    review.excerpts.lowestCutScore >= 85 &&
    review.excerpts.cutsBelow80 <= 3 &&
    review.sourceAudio.risk === "low" &&
    review.score >= 84
  );
}

function reviewOne(record, source, topicUniverse, rootDir, maps) {
  const review = {
    id: record.id,
    sourceTitle: record.title,
    date: record.date,
    guideFormat: record.guideFormat,
    contentMode: record.contentMode,
    generationSha256: record.generationSha256,
    titleFit: titleAudit(record, source, topicUniverse),
    temporal: captionAudit(record, rootDir),
    excerpts: excerptAudit(record.episodeGuide.cuts),
    claims: claimAudit(record),
    sourceAudio: sourceAudioAudit(record),
    repetition: repetitionAudit(record, maps),
  };
  review.score = compositeScore(review);
  review.issueCodes = issueCodes(review);
  review.strengths = strengths(review);
  review.promotionGatePassed = promotionEligible(review);
  review.disposition = "hold-for-editorial-pass";
  review.promotionAllowed = false;
  return review;
}

function collisionSummary(map) {
  return {
    uniqueTemplates: map.size,
    totalGuides: [...map.values()].reduce(
      (sum, ids) => sum + ids.length,
      0,
    ),
    maximumGuidesOnOneTemplate: Math.max(
      ...[...map.values()].map((ids) => ids.length),
    ),
    collisionGroups: [...map.values()].filter((ids) => ids.length > 1)
      .length,
  };
}

export function buildEditorialReview(options = {}) {
  const rootDir = options.rootDir || PROJECT_ROOT;
  const batch = options.batch || buildReviewBatch({ rootDir });
  const guides = allGuides(batch);
  const canonical = canonicalSources(
    rootDir,
    batch.index.selection.sourceArtifacts,
  );
  const maps = fingerprintMaps(guides);
  const reviews = guides.map((record) => {
    const source = canonical.sources.get(record.id);
    if (!source) throw new Error(`Missing canonical source ${record.id}`);
    return reviewOne(
      record,
      source,
      canonical.topicUniverse,
      rootDir,
      maps,
    );
  });
  const promotionPool = reviews
    .filter((review) => review.promotionGatePassed)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.excerpts.score - left.excerpts.score ||
        right.temporal.score - left.temporal.score ||
        left.id.localeCompare(right.id),
    );
  if (promotionPool.length < PROMOTION_TARGET) {
    throw new Error(
      `Only ${promotionPool.length} guides cleared the editorial gate; ${PROMOTION_TARGET} are required.`,
    );
  }
  const selected = promotionPool.slice(0, PROMOTION_TARGET);
  const selectedById = new Map(
    selected.map((review, index) => [review.id, index + 1]),
  );
  for (const review of reviews) {
    const rank = selectedById.get(review.id) || null;
    if (rank) {
      review.disposition = "first-production-promotion-candidate";
      review.promotionCandidateRank = rank;
    } else if (review.promotionGatePassed) {
      review.disposition = "promotion-ready-reserve";
      review.promotionCandidateRank = null;
    } else {
      review.promotionCandidateRank = null;
    }
  }
  reviews.sort(
    (left, right) =>
      (left.promotionCandidateRank || Infinity) -
        (right.promotionCandidateRank || Infinity) ||
      right.score - left.score ||
      left.id.localeCompare(right.id),
  );

  const promotionCandidates = selected.map((review, index) => ({
    rank: index + 1,
    id: review.id,
    title: review.sourceTitle,
    date: review.date,
    guideFormat: review.guideFormat,
    contentMode: review.contentMode,
    score: review.score,
    quality: {
      title: review.titleFit.score,
      temporal: review.temporal.score,
      excerpts: review.excerpts.score,
      claims: review.claims.score,
      sourceAudio: review.sourceAudio.score,
      repetition: review.repetition.score,
    },
    strengths: review.strengths,
    issueCodes: review.issueCodes,
    candidateStatus: "human-review-required-before-production-hook",
    promotionAllowed: false,
  }));

  const issueCounts = {};
  for (const review of reviews) {
    for (const issue of review.issueCodes) {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    }
  }
  const reportCore = {
    schema: "wwam-episode-guide-v2-editorial-review/v1",
    generated: GENERATED,
    sourceBatch: {
      schema: batch.index.schema,
      contentSha256: batch.index.provenance.contentSha256,
      guides: guides.length,
      cuts: batch.index.selection.totalCuts,
    },
    policy: {
      promotionTarget: PROMOTION_TARGET,
      automaticPromotionAllowed: false,
      appHookAllowed: false,
      humanEditorialReviewRequired: true,
      excerptWordLimit: batch.index.policy.publicExcerptWordLimit,
      speakerAttributionAllowed: false,
      visualRankingOutcomeClaimsAllowed: false,
      sourceAudioBoundaryMustBeReviewed: true,
    },
    rubric: {
      titleAlignmentWeight: 0.2,
      temporalLocalityWeight: 0.22,
      excerptQualityWeight: 0.22,
      claimSafetyWeight: 0.18,
      sourceAudioBoundaryWeight: 0.1,
      languageDistinctivenessWeight: 0.08,
      minimumCompositeScore: 84,
      minimumRuntimeSpanRatio: 0.6,
      minimumExcerptQuality: 93,
      minimumLowestCutQuality: 85,
      maximumSub80Excerpts: 3,
      requiredSourceAudioRisk: "low",
    },
    summary: {
      guidesAudited: reviews.length,
      cutsAudited: guides.reduce(
        (sum, guide) => sum + guide.episodeGuide.cuts.length,
        0,
      ),
      promotionCandidates: promotionCandidates.length,
      promotionReadyReserve: reviews.filter(
        (review) => review.disposition === "promotion-ready-reserve",
      ).length,
      heldForEditorialPass: reviews.filter(
        (review) => review.disposition === "hold-for-editorial-pass",
      ).length,
      exactLocalityGuides: reviews.filter(
        (review) => review.temporal.localityRate === 1,
      ).length,
      claimSafeGuides: reviews.filter(
        (review) => review.claims.hardGatePassed,
      ).length,
      lowSourceAudioRiskGuides: reviews.filter(
        (review) => review.sourceAudio.risk === "low",
      ).length,
      titleAlignedGuides: reviews.filter(
        (review) =>
          review.titleFit.coverageRate === 1 && review.titleFit.leadAligned,
      ).length,
      averageCompositeScore: round(
        reviews.reduce((sum, review) => sum + review.score, 0) /
          reviews.length,
      ),
      averageExcerptQuality: round(
        reviews.reduce(
          (sum, review) => sum + review.excerpts.score,
          0,
        ) / reviews.length,
      ),
      issueCounts: Object.fromEntries(
        Object.entries(issueCounts).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
      repetition: {
        headline: collisionSummary(maps.headline),
        overview: collisionSummary(maps.overview),
        recapLeadSet: collisionSummary(maps.recapLeadSet),
      },
    },
    promotionCandidates,
    guideReviews: reviews,
  };
  return {
    ...reportCore,
    reportSha256: sha256(stableJson(reportCore)),
  };
}

export function renderEditorialReview(report) {
  return `window.WWAM_EPISODE_GUIDE_V2_EDITORIAL_REVIEW = ${JSON.stringify(report)};\n`;
}

function cli() {
  const args = new Set(process.argv.slice(2));
  const report = buildEditorialReview();
  const rendered = renderEditorialReview(report);
  if (args.has("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated review report: ${OUTPUT_PATH}`);
    }
    if (fs.readFileSync(OUTPUT_PATH, "utf8") !== rendered) {
      throw new Error(
        "episode-guide-v2-editorial-review.js is stale; run the audit script.",
      );
    }
    process.stdout.write(
      `Episode Guide V2 editorial review is deterministic and current: ${report.summary.guidesAudited} guides, ${report.summary.promotionCandidates} promotion candidates, ${report.reportSha256}\n`,
    );
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered, "utf8");
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}: ${report.summary.guidesAudited} guides audited, ${report.summary.promotionCandidates} promotion candidates, ${report.reportSha256}\n`,
  );
  for (const candidate of report.promotionCandidates) {
    process.stdout.write(
      `${String(candidate.rank).padStart(2, "0")} ${candidate.id} ${candidate.score.toFixed(2)} ${candidate.title}\n`,
    );
  }
}

const directPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (directPath === fileURLToPath(import.meta.url)) {
  cli();
}
