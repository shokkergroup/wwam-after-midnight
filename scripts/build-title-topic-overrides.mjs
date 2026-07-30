import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "..");
export const OFFICIAL_CHANNEL_ID = "UC6ieEOZW4iXV8TcILJI8k5g";

const DEFAULTS = Object.freeze({
  metadataDir: path.join(REPO_ROOT, "source-cache", "metadata"),
  captionsDir: path.join(REPO_ROOT, "source-cache", "captions"),
  outputFile: path.join(REPO_ROOT, "public", "demo", "title-topic-overrides.js"),
});

const GENERIC_ONLY = new Set([
  "after party",
  "action",
  "discussion",
  "friday",
  "hanging out",
  "horror",
  "horror movie news",
  "in the morning",
  "latest movie news",
  "live",
  "livestream",
  "movie news",
  "movie news and more",
  "movie news more",
  "movies",
  "news",
  "news and more",
  "special",
  "the latest movie news",
  "trailer",
  "trailers",
  "update",
  "video",
  "wednesday",
  "we watched a movie",
]);

const GENERIC_TOKENS = new Set([
  "a",
  "about",
  "after",
  "all",
  "an",
  "and",
  "best",
  "discussion",
  "episode",
  "film",
  "films",
  "final",
  "franchise",
  "franchises",
  "hanging",
  "latest",
  "live",
  "livestream",
  "more",
  "movie",
  "movies",
  "news",
  "of",
  "on",
  "part",
  "party",
  "ranked",
  "ranking",
  "recap",
  "review",
  "season",
  "show",
  "special",
  "the",
  "to",
  "top",
  "trailer",
  "update",
  "video",
  "vs",
  "watch",
  "watched",
  "worst",
]);

const SMALL_WORDS = new Set(["a", "an", "and", "at", "for", "from", "in", "of", "on", "or", "the", "to", "vs"]);
const ACRONYMS = new Map([
  ["dc", "DC"],
  ["it", "IT"],
  ["mcu", "MCU"],
  ["nwa", "NWA"],
  ["tv", "TV"],
  ["vhs", "VHS"],
  ["vs", "vs."],
  ["wwam", "WWAM"],
]);

const FORMAT_SUFFIX = new RegExp(
  String.raw`\s+(?:` +
    [
      String.raw`tier\s+lists?(?:\s+ranking)?`,
      String.raw`posters?\s+(?:ranked|ranking)`,
      String.raw`bracket(?:\s+tournament)?`,
      String.raw`spoilers?(?:\s+live)?(?:\s+review)?\s+party`,
      String.raw`spoilers?`,
      String.raw`teaser\s+trailer\s+breakdown`,
      String.raw`trailer(?:\s+reaction)?(?:\s+and\s+discussion)?`,
      String.raw`trailer\s+breakdown`,
      String.raw`episode\s+\d+\s+(?:live\s+)?recap`,
      String.raw`season\s+(?:\d+|finale)\s+(?:live\s+)?(?:recap|review)`,
      String.raw`live\s+recap(?:\s+season\s+finale)?`,
      String.raw`recap(?:\s+season\s+finale)?`,
      String.raw`script\s+reading`,
      String.raw`live\s+discussion`,
      String.raw`breakdown`,
      String.raw`spoiler\s+review`,
      String.raw`review`,
      String.raw`reaction`,
      String.raw`after\s+party(?:\s+hangout)?`,
      String.raw`royal\s+rumble`,
      String.raw`q\s*&\s*a`,
      String.raw`update`,
    ].join("|") +
    String.raw`)\b.*$`,
  "i",
);

function normalizeSpace(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForMatch(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  const words = normalizeSpace(value).split(" ");
  return words
    .map((word, index) => {
      const punctuation = /['’]s$/i.test(word) ? "'s" : "";
      const bare = word.replace(/['’]s$/i, "").replace(/[^A-Za-z0-9]/g, "").toLowerCase();
      if (ACRONYMS.has(bare)) return `${ACRONYMS.get(bare)}${punctuation}`;
      if (index > 0 && SMALL_WORDS.has(bare)) return `${bare}${punctuation}`;
      if (/^\d+$/.test(bare)) return bare;
      return bare ? `${bare[0].toUpperCase()}${bare.slice(1)}${punctuation}` : "";
    })
    .filter(Boolean)
    .join(" ");
}

function cleanSegment(segment) {
  let value = normalizeSpace(segment)
    .replace(/\bwe\s+watched\s+a\s+movie(?:\s+video)?\b/gi, " ")
    .replace(/\bwwam\b/gi, " ")
    .replace(/\b(?:live(?:stream)?|livestream)\b/gi, " ")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, " ")
    .replace(/\b(?:movie\s+news|horror\s+movie\s+news|latest\s+movie\s+news)\b/gi, " ")
    .replace(/^\s*video\s+/i, "")
    .replace(/^\s*(?:friday\s+night\s+fights!?|movie\s+news)\s*/i, "")
    .replace(/^\s*(?:and|plus)\s+/i, "")
    .replace(/\s+(?:and|plus)\s+more!?\s*$/i, "")
    .replace(/\s+more!?\s*$/i, "")
    .replace(/\(\s*(?:\+\s*)?more\s*\)/gi, " ")
    .replace(/\(\s*also.*?movie\s+news.*?\)/gi, " ")
    .replace(/\s+hanging\s+out!?\s*$/i, "")
    .replace(/[!?|]+/g, " ");

  value = normalizeSpace(value.replace(FORMAT_SUFFIX, ""));
  value = normalizeSpace(value.replace(/^(?:the\s+latest|latest)\s+/i, ""));
  value = normalizeSpace(value.replace(/^(?:ranking|rank)\s+/i, ""));
  value = normalizeSpace(value.replace(/\s+(?:ranked|ranking)\b.*$/i, ""));
  return value.replace(/^[,;:\-]+|[,;:\-]+$/g, "").trim();
}

function isUsefulSubject(value) {
  const normalized = normalizeForMatch(value);
  if (!normalized || GENERIC_ONLY.has(normalized)) return false;
  if (/^top\s+\d+\s+all\s+time$/.test(normalized)) return false;
  if (/^\d{1,4}$/.test(normalized)) return false;
  const tokens = normalized.split(" ");
  const distinctive = tokens.filter((token) => !GENERIC_TOKENS.has(token) && !/^\d+$/.test(token));
  return distinctive.length > 0 && tokens.length <= 12;
}

function canonicalizeSubject(value, context) {
  let label = titleCase(value);
  if (/^top\s+\d+\s+movies?\s+of\s+(?:the\s+year\s+)?\d{4}$/i.test(label)) {
    const year = label.match(/\d{4}/)?.[0];
    label = `Movies of ${year}`;
  }
  if (/\btier\s+list\b/i.test(context) && /\bMovie$/i.test(label)) {
    label = `${label}s`;
  }
  label = label
    .replace(/^Movies About Aliens$/i, "Alien Movies")
    .replace(/^It Welcome to Derry$/i, "IT: Welcome to Derry")
    .replace(/^Alien Earth$/i, "Alien: Earth")
    .replace(/^Texas Chainsaw Massacre$/i, "The Texas Chain Saw Massacre");
  return label;
}

export function extractTitleSubjects(title) {
  const sourceTitle = normalizeSpace(title);
  if (!sourceTitle) return [];

  let working = sourceTitle
    .replace(/\bwe\s+watched\s+a\s+movie(?:\s+video)?\b/gi, " ")
    .replace(/\bwwam\b/gi, " ")
    .replace(/\b(?:live(?:stream)?|livestream)\b/gi, " ")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  working = working
    .replace(/\bQ\s*&\s*A\b/gi, "Q&A")
    .replace(/\(\s*(?:\+\s*)?more\s*\)/gi, " ")
    .replace(/\(\s*also.*?movie\s+news.*?\)/gi, " ")
    .replace(/\s+(?:-|[|])\s+(?:movie\s+news.*|news\s+and\s+more.*)$/i, " ")
    .replace(/\s+(?:&|\+)\s+(?:the\s+latest\s+)?(?:horror\s+)?movie\s+news.*$/i, " ");

  const segments = working
    .split(/\s+(?:\+|&|\||\/\/)\s+|\s+-\s+|,(?=\s*[A-Za-z0-9])/)
    .flatMap((segment) => {
      const cleaned = normalizeSpace(segment);
      if (/^(?:movie\s+news|news)\s+(?:and|plus)\s+/i.test(cleaned)) {
        return [cleaned.replace(/^(?:movie\s+news|news)\s+(?:and|plus)\s+/i, "")];
      }
      return [cleaned];
    })
    .map(cleanSegment)
    .filter(isUsefulSubject)
    .map((segment) => canonicalizeSubject(segment, sourceTitle));

  const unique = new Map();
  for (const label of segments) {
    const key = normalizeForMatch(label);
    if (!unique.has(key)) unique.set(key, label);
  }
  return [...unique.values()].slice(0, 4);
}

export function extractCaptionRows(captionPayload) {
  const events = Array.isArray(captionPayload?.events) ? captionPayload.events : [];
  return events
    .filter((event) => Array.isArray(event?.segs))
    .map((event) => {
      const text = normalizeSpace(event.segs.map((segment) => segment?.utf8 || "").join(""));
      return {
        at: Number(event.tStartMs || 0) / 1000,
        duration: Number(event.dDurationMs || 0) / 1000,
        text,
        normalized: normalizeForMatch(text),
      };
    })
    .filter((row) => row.text && row.normalized);
}

function meaningfulTokens(label) {
  const tokens = normalizeForMatch(label).split(" ").filter(Boolean);
  const distinctive = tokens.filter((token) => !GENERIC_TOKENS.has(token) && token.length > 1);
  return (distinctive.length ? distinctive : tokens).slice(0, 5);
}

function phrasePattern(label) {
  const tokens = normalizeForMatch(label).split(" ").filter(Boolean);
  if (!tokens.length) return null;
  const parts = tokens.map((token) => {
    if (token === "movie" || token === "movies") return "movies?";
    if (token === "franchise" || token === "franchises") return "franchises?";
    return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  return new RegExp(`\\b${parts.join("\\s+")}\\b`, "i");
}

function dedupeHits(hits, minimumGap = 3) {
  const sorted = [...hits].sort((left, right) => left.at - right.at);
  const result = [];
  for (const hit of sorted) {
    const previous = result[result.length - 1];
    if (!previous || hit.at - previous.at >= minimumGap) result.push(hit);
  }
  return result;
}

function captionHits(rows, label) {
  const exactPattern = phrasePattern(label);
  const exactHits = exactPattern
    ? rows.filter((row) => exactPattern.test(row.normalized)).map((row) => ({ ...row, matchMode: "exact-title-phrase" }))
    : [];
  const exact = dedupeHits(exactHits);
  const anchors = meaningfulTokens(label);
  if (!anchors.length) return exact;
  if (anchors.length === 1) {
    const tokenPattern = new RegExp(`\\b${anchors[0]}\\b`, "i");
    return dedupeHits(rows
      .filter((row) => tokenPattern.test(row.normalized))
      .map((row) => ({
        ...row,
        matchMode: exactPattern?.test(row.normalized) ? "exact-title-phrase" : "distinctive-title-token",
      })));
  }
  if (exact.length >= 2) return exact;

  const fallback = [];
  for (let index = 0; index < rows.length; index += 1) {
    const windowRows = rows.slice(index, index + 3);
    const normalized = windowRows.map((row) => row.normalized).join(" ");
    if (anchors.every((token) => new RegExp(`\\b${token}\\b`, "i").test(normalized))) {
      fallback.push({
        ...rows[index],
        text: windowRows.map((row) => row.text).join(" "),
        normalized,
        matchMode: "distinctive-title-tokens",
      });
    }
  }
  return dedupeHits(fallback);
}

function clusterHits(hits, duration) {
  if (!hits.length) return [];
  // Title-native segments often pause for chat or a related tangent. A ten-percent
  // bridge preserves those segments while still separating an isolated cold-open hit.
  const maximumGap = Math.max(420, Math.min(1200, Number(duration || 0) * 0.1));
  const clusters = [[hits[0]]];
  for (const hit of hits.slice(1)) {
    const cluster = clusters[clusters.length - 1];
    const previous = cluster[cluster.length - 1];
    if (hit.at - previous.at <= maximumGap) cluster.push(hit);
    else clusters.push([hit]);
  }
  return clusters;
}

function selectStrongestCluster(hits, duration) {
  const clusters = clusterHits(hits, duration);
  return clusters.sort((left, right) => {
    if (right.length !== left.length) return right.length - left.length;
    const leftSpan = left[left.length - 1].at - left[0].at;
    const rightSpan = right[right.length - 1].at - right[0].at;
    const leftDensity = left.length / Math.max(1, leftSpan);
    const rightDensity = right.length / Math.max(1, rightSpan);
    if (rightDensity !== leftDensity) return rightDensity - leftDensity;
    return left[0].at - right[0].at;
  })[0] || [];
}

function selectPeak(cluster) {
  let best = cluster[0];
  let bestNeighbors = -1;
  for (const hit of cluster) {
    const neighbors = cluster.filter((candidate) => Math.abs(candidate.at - hit.at) <= 120).length;
    if (neighbors > bestNeighbors) {
      best = hit;
      bestNeighbors = neighbors;
    }
  }
  return best;
}

export function boundedExcerpt(value, maximumWords = 16) {
  const cleaned = normalizeSpace(value)
    .replace(/>>/g, "")
    .replace(/\[Â?\s*__Â?\s*\]/g, "[bleep]")
    .replace(/\btier\s+listwise\b/gi, "tier-list-wise")
    .replace(/\s+/g, " ");
  return (cleaned.match(/\S+/g) || [])
    .slice(0, maximumWords)
    .join(" ")
    .replace(/\s+\bStarting\b[.!?]?\s*$/i, "")
    .trim();
}

export function readableReceipt(rows, receipt, label) {
  const index = rows.reduce((bestIndex, row, rowIndex) => (
    Math.abs(row.at - receipt.at) < Math.abs(rows[bestIndex]?.at - receipt.at)
      ? rowIndex
      : bestIndex
  ), 0);
  const windows = [
    rows.slice(index, index + 1),
    rows.slice(Math.max(0, index - 1), index + 1),
    rows.slice(Math.max(0, index - 2), index + 1),
    rows.slice(index, index + 2),
  ];
  const pattern = phrasePattern(label);
  const candidates = [];

  for (const windowRows of windows) {
    let text = normalizeSpace(windowRows.map((row) => row.text).join(" ")).replace(/>>/g, "").trim();
    const naturalLead = text.search(/\b(?:we\s+are|we're|tonight\s+we|today\s+we|let's|lets)\b/i);
    if (naturalLead > 0) text = text.slice(naturalLead);
    const excerpt = boundedExcerpt(text);
    const normalized = normalizeForMatch(excerpt);
    const hasPhrase = pattern ? pattern.test(normalized) : false;
    const wordCount = (excerpt.match(/\S+/g) || []).length;
    let score = hasPhrase ? 20 : 0;
    if (wordCount >= 5 && wordCount <= 16) score += 8;
    if (/^[A-Z]/.test(excerpt)) score += 2;
    if (/[.!?]$/.test(excerpt)) score += 2;
    if (/\b(?:uh|um)\b/i.test(excerpt)) score -= 2;
    candidates.push({ excerpt, score });
  }

  candidates.sort((left, right) => right.score - left.score || left.excerpt.length - right.excerpt.length);
  return candidates[0]?.excerpt || boundedExcerpt(receipt.text);
}

export function confirmTitleSubject({ sourceId, title, duration, label, rows }) {
  const hits = captionHits(rows, label);
  const cluster = selectStrongestCluster(hits, duration);
  const distinctiveCount = meaningfulTokens(label).length;
  if (!cluster.length) return null;
  if (cluster.length < 2 && distinctiveCount < 2) return null;

  const exactReceipts = cluster.filter((hit) => hit.matchMode === "exact-title-phrase");
  const receipts = exactReceipts.length >= 2 ? exactReceipts : cluster;
  const peak = selectPeak(receipts);
  const onset = Math.max(1, Math.round(cluster[0].at - (cluster[0].matchMode === "exact-title-phrase" ? 12 : 4)));
  return {
    sourceId,
    label,
    firstAt: onset,
    peakAt: Math.round(peak.at),
    mentions: receipts.length,
    excerpt: readableReceipt(rows, peak, label),
    evidenceBasis: `official-cached-title + source-local-caption ${peak.matchMode} strongest-cluster`,
    title,
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function stableDigest(records) {
  const hash = crypto.createHash("sha256");
  for (const record of records) {
    hash.update(`${record.id}\t${record.upload_date || ""}\t${record.title || ""}\t${record.captionBytes || 0}\n`);
  }
  return `sha256:${hash.digest("hex")}`;
}

export function buildTitleTopicOverrides({
  metadataDir = DEFAULTS.metadataDir,
  captionsDir = DEFAULTS.captionsDir,
} = {}) {
  const metadataFiles = fs.readdirSync(metadataDir)
    .filter((name) => name.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  const records = [];
  let officialMetadata = 0;
  let captionBacked = 0;
  let candidates = 0;

  for (const name of metadataFiles) {
    const metadataFile = path.join(metadataDir, name);
    const metadata = readJson(metadataFile);
    if (metadata.channel_id !== OFFICIAL_CHANNEL_ID) continue;
    officialMetadata += 1;

    const sourceId = String(metadata.id || path.basename(name, ".json"));
    const captionFile = path.join(captionsDir, `${sourceId}.json`);
    const captionBytes = fs.existsSync(captionFile) ? fs.statSync(captionFile).size : 0;
    records.push({
      id: sourceId,
      upload_date: String(metadata.upload_date || ""),
      title: String(metadata.title || ""),
      duration: Number(metadata.duration || 0),
      captionFile,
      captionBytes,
    });
  }

  records.sort((left, right) => (
    left.upload_date.localeCompare(right.upload_date) ||
    left.id.localeCompare(right.id)
  ));

  const topics = [];
  for (const record of records) {
    if (!record.captionBytes) continue;
    captionBacked += 1;
    const rows = extractCaptionRows(readJson(record.captionFile));
    const labels = extractTitleSubjects(record.title);
    candidates += labels.length;
    for (const label of labels) {
      const confirmed = confirmTitleSubject({
        sourceId: record.id,
        title: record.title,
        duration: record.duration,
        label,
        rows,
      });
      if (confirmed) topics.push(confirmed);
    }
  }

  topics.sort((left, right) => (
    left.sourceId.localeCompare(right.sourceId) ||
    left.firstAt - right.firstAt ||
    left.label.localeCompare(right.label)
  ));

  return {
    schema: "shokker-youtube-wiki/title-topic-overrides/v1",
    sourcePolicy: "Official cached WWAM metadata; source-local cached captions; strongest sustained caption cluster.",
    snapshotSha256: stableDigest(records),
    stats: {
      metadataScanned: metadataFiles.length,
      officialMetadata,
      captionBacked,
      titleSubjectsExtracted: candidates,
      overridesConfirmed: topics.length,
      sourcesEnriched: new Set(topics.map((topic) => topic.sourceId)).size,
    },
    topics,
  };
}

export function serializeArtifact(artifact) {
  return [
    "/* Generated by scripts/build-title-topic-overrides.mjs. Do not hand-edit. */",
    `window.WWAM_TITLE_TOPIC_OVERRIDES = Object.freeze(${JSON.stringify(artifact, null, 2)});`,
    "",
  ].join("\n");
}

function parseArguments(argv) {
  const options = { ...DEFAULTS, dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--metadata") options.metadataDir = path.resolve(argv[++index]);
    else if (argument === "--captions") options.captionsDir = path.resolve(argv[++index]);
    else if (argument === "--output") options.outputFile = path.resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const artifact = buildTitleTopicOverrides(options);
  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(options.outputFile), { recursive: true });
    fs.writeFileSync(options.outputFile, serializeArtifact(artifact), "utf8");
  }
  process.stdout.write(`${JSON.stringify({ output: options.dryRun ? null : options.outputFile, ...artifact.stats })}\n`);
  return artifact;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
