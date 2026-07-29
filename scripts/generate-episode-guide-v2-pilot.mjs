import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "demo",
  "episode-guide-v2-pilot.js",
);
const GENERATED = "2026-07-29";
const PUBLIC_EXCERPT_CEILING = 25;
const DEFAULT_EXCERPT_LIMIT = 16;

const PILOT_SOURCES = Object.freeze([
  {
    id: "LV2rmwEA0w4",
    artifact: "public/demo/livestream-distill.js",
    global: "WWAM_LIVESTREAMS",
    contentMode: "movie-news",
    role: "fresh-news-pilot",
  },
  {
    id: "iz0WFhe6LYM",
    artifact: "public/demo/livestream-distill.js",
    global: "WWAM_LIVESTREAMS",
    contentMode: "movie-news",
    role: "news-distinctiveness-control",
  },
  {
    id: "FVuwRHM0kcc",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    contentMode: "visual-ranking",
    role: "visual-ranking-pilot",
  },
  {
    id: "WKs1uPGMQvw",
    artifact: "public/demo/archive-deep-distill.js",
    global: "WWAM_ARCHIVE_DEEP",
    contentMode: "spoiler-review",
    role: "spoiler-review-pilot",
  },
]);

const TOPIC_ALIASES = Object.freeze({
  Alien: ["alien", "xenomorph"],
  "A Nightmare on Elm Street": [
    "a nightmare on elm street",
    "nightmare on elm street",
    "elm street",
    "freddy krueger",
    "freddy",
  ],
  Batman: ["batman", "bruce wayne", "joker"],
  Casting: ["casting", "cast", "actor", "actress"],
  "Chat & Superchats": ["super chat", "superchat", "the chat", "chat"],
  "Directors & Writers": ["director", "directed", "writer", "written"],
  "Evil Dead": ["evil dead", "ash williams"],
  "Fan Theories": ["fan theory", "theory", "theories"],
  "Friday the 13th": ["friday the 13th", "jason voorhees", "crystal lake"],
  Halloween: ["halloween", "michael myers", "loomis", "lumis"],
  Hellraiser: ["hellraiser", "pinhead"],
  Horror: ["horror"],
  Marvel: [
    "marvel",
    "avengers",
    "spider-man",
    "spider man",
    "fantastic four",
  ],
  "Rankings & Lists": ["ranking", "rankings", "tier list", "bracket"],
  "Remakes & Reboots": ["remake", "reboot"],
  Scream: ["scream", "ghostface", "sidney prescott"],
  Streaming: ["streaming", "netflix", "hbo max", "paramount plus", "peacock"],
  "Stranger Things": ["stranger things", "vecna"],
  Superheroes: ["superhero", "comic book movie"],
  Superman: ["superman", "clark kent"],
  Terrifier: ["terrifier", "art the clown"],
  Trailers: ["trailer", "teaser"],
});

const FORMAT_LABELS = Object.freeze({
  "movie-news": Object.freeze({
    opener: "COLD OPEN",
    default: "NEWS DESK",
    late: "LAST CALL",
    topic: Object.freeze({
      Trailers: "TRAILER COURT",
      Batman: "CAPE DESK",
      Marvel: "MARVEL WIRE",
      Halloween: "HADDONFIELD WIRE",
      Hellraiser: "HELLBOUND WIRE",
      "A Nightmare on Elm Street": "ELM STREET WIRE",
      "Friday the 13th": "CRYSTAL LAKE WIRE",
      "Evil Dead": "DEADITE WIRE",
    }),
  }),
  "visual-ranking": Object.freeze({
    opener: "BRACKET OPENER",
    default: "MATCHUP DESK",
    late: "FINAL BOARD CHECK",
    topic: Object.freeze({
      "Rankings & Lists": "BRACKET RULES",
      Batman: "BAT-FIELD",
      Superman: "METROPOLIS MATCHUP",
      Marvel: "MARVEL SIDE",
      Superheroes: "COMIC BOOK COLLISION",
    }),
  }),
  "spoiler-review": Object.freeze({
    opener: "OPENING VERDICT",
    default: "SPOILER KNIFE",
    late: "FINAL SPOILER PASS",
    topic: Object.freeze({
      Scream: "GHOSTFACE CASE FILE",
      "Fan Theories": "THEORY BOARD",
      Casting: "CASTING CASE",
      "Directors & Writers": "CRAFT CHECK",
      "Remakes & Reboots": "FRANCHISE MEMORY",
      "Rankings & Lists": "FRANCHISE RANK",
    }),
  }),
});

const MOMENT_CATEGORIES = new Set([
  "FULL SEND",
  "TAKE GETS NUCLEAR",
  "THE ROOM BREAKS",
  "UP IN YA",
  "CHAT DID THIS",
]);

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\[(?:\s*__\s*|\u00c2\s*__\s*\u00c2)\]/gi, "[BLEEP]")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/>>+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
}

function wordCount(value) {
  return words(value).length;
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

function loadWindowAssignment(filePath, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, {
    filename: filePath,
  });
  const payload = context.window[globalName];
  if (!payload || typeof payload !== "object") {
    throw new Error(`${globalName} was not found in ${filePath}`);
  }
  return JSON.parse(JSON.stringify(payload));
}

function sourceRecords(payload) {
  for (const key of ["streams", "records", "sources"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  throw new Error("Canonical artifact does not expose a source array.");
}

function defaultRightsPolicy() {
  return {
    mode: "standard-caption-candidates",
    restrictedToTopicNavigation: false,
    publicExcerptWordLimit: DEFAULT_EXCERPT_LIMIT,
    speakerClaimsAllowed: false,
    performerClaimsAllowed: false,
    originClaimsAllowed: false,
    visualClaimsAllowed: false,
    promotionAllowed: false,
  };
}

function normalizedRightsPolicy(source) {
  return {
    ...defaultRightsPolicy(),
    ...(source.rightsPolicy && typeof source.rightsPolicy === "object"
      ? source.rightsPolicy
      : {}),
  };
}

export function assertEligibleSource(source, rightsPolicy, captionPath) {
  if (!source || typeof source !== "object") {
    throw new Error("Pilot source must be a canonical source record.");
  }
  if (rightsPolicy.restrictedToTopicNavigation) {
    throw new Error(
      `${source.id} is topic-navigation-only and cannot receive Episode Guide V2.`,
    );
  }
  if (source.captioned === false) {
    throw new Error(`${source.id} is not caption-backed.`);
  }
  if (!captionPath || !fs.existsSync(captionPath)) {
    throw new Error(`${source.id} has no local caption cache.`);
  }
  if (!Array.isArray(source.topics) || source.topics.length < 3) {
    throw new Error(`${source.id} has too few canonical topics for a guide.`);
  }
}

export function parseCaptionLines(payload) {
  const lines = [];
  for (const event of Array.isArray(payload?.events) ? payload.events : []) {
    if (!Array.isArray(event.segs) || !Number.isFinite(event.tStartMs)) continue;
    const text = clean(event.segs.map((segment) => segment.utf8 || "").join(""));
    if (!text || text === "\\n") continue;
    const at = Math.max(0, Math.floor(event.tStartMs / 1000));
    const duration = Math.max(1, Math.ceil((event.dDurationMs || 4000) / 1000));
    if (lines.length && lines.at(-1).at === at && lines.at(-1).text === text) {
      continue;
    }
    lines.push({ at, end: at + duration, text });
  }
  return lines.sort((left, right) => left.at - right.at || left.text.localeCompare(right.text));
}

function normalizedTopicAliases(topicName) {
  const configured = TOPIC_ALIASES[topicName] || [];
  const fallback = clean(topicName)
    .toLowerCase()
    .replace(/\s*&\s*/g, " ")
    .replace(/[^a-z0-9' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [...new Set([...configured, fallback].map((value) => value.toLowerCase()))]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length || left.localeCompare(right));
}

function lineTopicMatch(line, topicName) {
  const haystack = ` ${clean(line.text).toLowerCase()} `;
  for (const alias of normalizedTopicAliases(topicName)) {
    const pattern = new RegExp(
      `(?:^|[^a-z0-9])${alias
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\ /g, "\\s+")}(?:$|[^a-z0-9])`,
      "i",
    );
    if (pattern.test(haystack)) return alias;
  }
  return "";
}

function closestTopicLine(lines, topicName, targetAt, maxDistance = 150) {
  let best = null;
  for (const line of lines) {
    const evidence = lineTopicMatch(line, topicName);
    if (!evidence) continue;
    const distance = Math.abs(line.at - targetAt);
    if (distance > maxDistance) continue;
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && line.at < best.line.at)
    ) {
      best = { line, evidence, distance };
    }
  }
  return best;
}

function closestAnyTopicLine(lines, topics, targetAt, maxDistance = 120) {
  let best = null;
  for (const topic of topics) {
    const match = closestTopicLine(lines, topic.name, targetAt, maxDistance);
    if (!match) continue;
    const topicWeight =
      Number(topic.cluster || 0) * 4 + Math.log2(Number(topic.mentions || 1) + 1);
    if (
      !best ||
      match.distance < best.distance ||
      (match.distance === best.distance && topicWeight > best.topicWeight) ||
      (match.distance === best.distance &&
        topicWeight === best.topicWeight &&
        topic.name.localeCompare(best.topic.name) < 0)
    ) {
      best = { ...match, topic, topicWeight };
    }
  }
  return best;
}

function localContext(lines, centerAt, radiusSeconds = 9) {
  return clean(
    lines
      .filter((line) => Math.abs(line.at - centerAt) <= radiusSeconds)
      .map((line) => line.text)
      .join(" "),
  );
}

function boundedExcerpt(text, topicName, limit) {
  const tokens = words(text);
  const cappedLimit = Math.max(4, Math.min(PUBLIC_EXCERPT_CEILING, limit));
  if (tokens.length <= cappedLimit) return tokens.join(" ");

  const aliases = normalizedTopicAliases(topicName).map((alias) => words(alias));
  let topicStart = -1;
  let topicLength = 1;
  for (const aliasTokens of aliases) {
    for (let index = 0; index <= tokens.length - aliasTokens.length; index += 1) {
      const candidate = tokens.slice(index, index + aliasTokens.length).join(" ").toLowerCase();
      if (candidate === aliasTokens.join(" ").toLowerCase()) {
        topicStart = index;
        topicLength = aliasTokens.length;
        break;
      }
    }
    if (topicStart >= 0) break;
  }
  const center = topicStart >= 0
    ? topicStart + Math.floor(topicLength / 2)
    : Math.floor(tokens.length / 2);
  const start = Math.max(0, Math.min(tokens.length - cappedLimit, center - Math.floor(cappedLimit / 2)));
  return tokens.slice(start, start + cappedLimit).join(" ");
}

function canonicalCandidates(source, lines) {
  const topics = source.topics
    .filter((topic) => topic && topic.name)
    .map((topic) => ({ ...topic, name: clean(topic.name) }));
  const candidates = [];

  for (const moment of Array.isArray(source.moments) ? source.moments : []) {
    if (!Number.isFinite(moment.t)) continue;
    const match = closestAnyTopicLine(lines, topics, Number(moment.t), 30);
    if (!match) continue;
    candidates.push({
      anchorKind: "public-moment",
      anchorAt: Math.floor(Number(moment.t)),
      anchorOffsetSeconds: match.line.at - Math.floor(Number(moment.t)),
      line: match.line,
      topic: match.topic,
      topicEvidence: match.evidence,
      momentCategory: MOMENT_CATEGORIES.has(clean(moment.category).toUpperCase())
        ? clean(moment.category).toUpperCase()
        : "",
      momentExcerpt: clean(moment.excerpt || moment.quote),
      heat: Math.max(0, Math.min(100, Number(moment.heat || 0))),
      seedScore: 1000 + Number(moment.heat || 0) * 5 - match.distance,
    });
  }

  for (const topic of topics) {
    for (const [anchorName, targetAt] of [
      ["topic-first", Number(topic.first)],
      ["topic-peak", Number(topic.peak)],
    ]) {
      if (!Number.isFinite(targetAt)) continue;
      const match = closestTopicLine(lines, topic.name, targetAt, 180);
      if (!match) continue;
      const anchorWeight = anchorName === "topic-peak" ? 140 : 80;
      candidates.push({
        anchorKind: anchorName,
        anchorAt: Math.floor(targetAt),
        anchorOffsetSeconds: match.line.at - Math.floor(targetAt),
        line: match.line,
        topic,
        topicEvidence: match.evidence,
        momentCategory: "",
        momentExcerpt: "",
        heat: 0,
        seedScore:
          300 +
          anchorWeight +
          Number(topic.cluster || 0) * 6 +
          Math.log2(Number(topic.mentions || 1) + 1) * 8 -
          match.distance,
      });
    }
  }

  return candidates
    .filter((candidate) => candidate.line.at < Number(source.duration || Infinity))
    .sort(
      (left, right) =>
        right.seedScore - left.seedScore ||
        left.line.at - right.line.at ||
        left.topic.name.localeCompare(right.topic.name),
    );
}

function selectCuts(candidates, source, target = 12) {
  const selected = [];
  const topicCounts = new Map();
  const bandCount = 6;
  const duration = Number(source.duration);

  function canAdd(candidate, minGap) {
    if (selected.some((item) => Math.abs(item.line.at - candidate.line.at) < minGap)) {
      return false;
    }
    return (topicCounts.get(candidate.topic.name) || 0) < 2;
  }

  function add(candidate) {
    selected.push(candidate);
    topicCounts.set(candidate.topic.name, (topicCounts.get(candidate.topic.name) || 0) + 1);
  }

  for (const candidate of candidates.filter((item) => item.anchorKind === "public-moment")) {
    if (selected.length >= 4) break;
    if ((topicCounts.get(candidate.topic.name) || 0) >= 1) continue;
    if (canAdd(candidate, 45)) add(candidate);
  }

  for (const topic of source.topics) {
    if (selected.length >= target) break;
    const candidate = candidates.find(
      (item) =>
        item.topic.name === topic.name &&
        item.anchorKind !== "public-moment" &&
        canAdd(item, 45),
    );
    if (candidate) add(candidate);
  }

  for (let band = 0; band < bandCount && selected.length < target; band += 1) {
    const from = (duration * band) / bandCount;
    const to = (duration * (band + 1)) / bandCount;
    const candidate = candidates.find(
      (item) =>
        item.line.at >= from &&
        item.line.at < to &&
        canAdd(item, 30),
    );
    if (candidate) add(candidate);
  }

  for (const candidate of candidates) {
    if (selected.length >= target) break;
    if (canAdd(candidate, 30)) add(candidate);
  }

  if (selected.length < 8) {
    throw new Error(
      `${source.id} produced only ${selected.length} locally topic-matched cuts.`,
    );
  }

  return selected
    .slice(0, target)
    .sort((left, right) => left.line.at - right.line.at);
}

function formatCategory(contentMode, candidate, source) {
  if (candidate.momentCategory) return candidate.momentCategory;
  const labels = FORMAT_LABELS[contentMode];
  const ratio = candidate.line.at / Number(source.duration || 1);
  return labels.topic[candidate.topic.name] ||
    (ratio < 0.12 ? labels.opener : ratio > 0.82 ? labels.late : labels.default);
}

function cutBody(contentMode, cut) {
  const time = formatTime(cut.at);
  const quote = `"${cut.excerpt}"`;
  const localSubject = lineTopicMatch({ text: cut.excerpt }, cut.topic);
  const topicLead = localSubject
    ? cut.topic
    : `${cut.category} beside the ${cut.topic} route`;
  if (contentMode === "visual-ranking") {
    return `${topicLead} reaches the bracket tape at ${time}. ${quote} is the caption-locked door; the on-screen winner and bracket state remain unverified.`;
  }
  if (contentMode === "spoiler-review") {
    return `${topicLead} takes the spoiler-review desk at ${time}. The bounded tape fragment is ${quote}; no speaker or final-review claim is assigned.`;
  }
  return `${topicLead} crosses the live news wire at ${time}. The source-locked fragment is ${quote}, with no speaker identity inferred.`;
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function guideOverview(source, contentMode, threads, cuts) {
  const first = cuts[0];
  const midpoint = cuts[Math.floor(cuts.length / 2)];
  const last = cuts.at(-1);
  const leaders = threads.slice(0, 3).map((thread) => thread.name);
  if (contentMode === "visual-ranking") {
    return `${source.title} on ${source.date} becomes a caption-locked bracket route led by ${leaders.join(", ")}. Enter at ${formatTime(first.at)} for ${first.topic}, hit ${midpoint.topic} at ${formatTime(midpoint.at)}, and leave through ${last.topic} at ${formatTime(last.at)}. This guide maps the arguments and eruptions the tape can prove in words; it does not invent an on-screen winner or bracket result.`;
  }
  if (contentMode === "spoiler-review") {
    return `${source.title} on ${source.date} gets a spoiler-desk map led by ${leaders.join(", ")}. The playable route opens on ${first.topic} at ${formatTime(first.at)}, turns toward ${midpoint.topic} at ${formatTime(midpoint.at)}, and closes on ${last.topic} at ${formatTime(last.at)}. Every stop is tied to a canonical topic and a short caption fragment, while speaker identity and a single final verdict remain unclaimed.`;
  }
  return `${source.title} on ${source.date} gets a live-wire map led by ${leaders.join(", ")}. Start with ${first.topic} at ${formatTime(first.at)}, cross into ${midpoint.topic} at ${formatTime(midpoint.at)}, and finish the indexed night on ${last.topic} at ${formatTime(last.at)}. The route follows what this exact upload put on the wire, not a generic movie-news template or an inferred speaker.`;
}

function evidenceSummary(source, contentMode, threads, cuts, input) {
  const momentAnchors = cuts.filter((cut) => cut.anchor.kind === "public-moment").length;
  const topicNames = [...new Set(cuts.map((cut) => cut.topic))];
  const boundary = contentMode === "visual-ranking"
    ? "Visual bracket outcomes remain outside the evidence boundary."
    : "No speaker, performer, clip-origin, or final-verdict identity is inferred.";
  return `${source.id} maps ${cuts.length} cuts and ${threads.length} recurring threads across ${topicNames.length} canonical topics. ${momentAnchors} cuts begin from registered public-moment anchors; every displayed fragment is re-matched against the local caption cache and capped at ${input.excerptLimit} words. ${boundary}`;
}

function chapterIndices(cuts, count = 6) {
  const indices = [];
  for (let index = 0; index < count; index += 1) {
    const candidate = Math.round((index * (cuts.length - 1)) / (count - 1));
    if (!indices.includes(candidate)) indices.push(candidate);
  }
  return indices;
}

function takeBody(contentMode, phase, cut) {
  const lead = phase === "OPENING READ"
    ? "Open the route"
    : phase === "MIDPOINT TURN"
      ? "The middle turn lands"
      : "The final indexed stop lands";
  const boundary = contentMode === "visual-ranking"
    ? "without claiming what the unseen board decided"
    : "without assigning the words to a speaker";
  const subject = lineTopicMatch({ text: cut.excerpt }, cut.topic)
    ? cut.topic
    : `${cut.category} beside the ${cut.topic} route`;
  return `${lead} on ${subject} at ${formatTime(cut.at)} ${boundary}: "${cut.excerpt}".`;
}

function fanReceipt(key, label, cut) {
  if (!cut) return null;
  const subject = lineTopicMatch({ text: cut.excerpt }, cut.topic)
    ? cut.topic
    : cut.category;
  return {
    key,
    label,
    body: `${subject} owns this source-locked lane at ${formatTime(cut.at)}: "${cut.excerpt}".`,
    at: cut.at,
    end: cut.end,
    cutId: cut.id,
    category: cut.category,
    topic: cut.topic,
    excerpt: cut.excerpt,
    evidenceBasis: cut.evidenceBasis,
  };
}

function cutNamesTopic(cut) {
  return Boolean(lineTopicMatch({ text: cut.excerpt }, cut.topic));
}

function positiveCut(cuts) {
  return cuts.find((cut) =>
    cutNamesTopic(cut) &&
    /\b(?:love|great|best|amazing|favorite|anticipated)\b/i.test(cut.excerpt) &&
    !/\b(?:doesn'?t|isn'?t|wasn'?t|weren'?t|not|never|no)\b(?:\W+\w+){0,2}\W+(?:great|best|amazing|love|favorite|anticipated)\b/i.test(cut.excerpt),
  );
}

function negativeCut(cuts) {
  return cuts.find((cut) =>
    cutNamesTopic(cut) &&
    /\b(?:hate|worst|terrible|awful|garbage|trash|sucks|stupid|atrocious)\b/i.test(cut.excerpt),
  );
}

function chaosCut(cuts) {
  return [...cuts]
    .sort((left, right) => right.score - left.score || left.at - right.at)
    .find((cut) =>
      ["UP IN YA", "FULL SEND", "THE ROOM BREAKS", "CHAT DID THIS"].includes(cut.category),
    );
}

function buildEpisodeGuide(source, contentMode, lines, input) {
  const rawCandidates = canonicalCandidates(source, lines);
  const visualOutcome = /\b(?:wins?|won|winner|takes down|advances?|eliminat(?:e|ed|es)|beats?)\b/i;
  const eligibleCandidates = contentMode === "visual-ranking"
    ? rawCandidates.filter((candidate) => {
        const displayed = candidate.momentExcerpt ||
          localContext(lines, candidate.line.at, 9);
        return !visualOutcome.test(displayed);
      })
    : rawCandidates;
  const chosen = selectCuts(eligibleCandidates, source, 12);
  const rightsLimit = Math.max(
    4,
    Math.min(
      PUBLIC_EXCERPT_CEILING,
      Number(input.rightsPolicy.publicExcerptWordLimit || DEFAULT_EXCERPT_LIMIT),
    ),
  );

  const cuts = chosen.map((candidate, index) => {
    const category = formatCategory(contentMode, candidate, source);
    const localText = localContext(lines, candidate.line.at, 9);
    const excerpt = boundedExcerpt(
      candidate.momentExcerpt || localText || candidate.line.text,
      candidate.topic.name,
      rightsLimit,
    );
    const at = Math.max(
      0,
      Math.floor(
        candidate.anchorKind === "public-moment"
          ? candidate.anchorAt
          : candidate.line.at,
      ),
    );
    const end = Math.min(
      Number(source.duration),
      candidate.anchorKind === "public-moment"
        ? at + 14
        : Math.max(at + 1, candidate.line.end),
    );
    const cut = {
      id: `pilot-cut-${String(index + 1).padStart(2, "0")}-${at}`,
      at,
      end,
      label: `${candidate.topic.name} // ${category}`,
      category,
      topic: candidate.topic.name,
      excerpt,
      score: Math.max(
        1,
        Math.min(
          100,
          Math.round(
            (candidate.heat || 55) +
            Math.min(20, Number(candidate.topic.cluster || 0) / 2),
          ),
        ),
      ),
      substance: Math.min(25, wordCount(excerpt)),
      editorialEvidence: "",
      categorySupport: candidate.momentCategory ? 1 : 0,
      categoryEvidence: candidate.momentCategory || "",
      topicBasis: "canonical-topic-local-caption-match",
      topicSupport: 1,
      topicEvidence: candidate.topicEvidence,
      verdictSignal: 0,
      verdictEvidence: "",
      evidenceBasis: `${candidate.anchorKind}+local-caption-topic-match`,
      anchor: {
        kind: candidate.anchorKind,
        at: candidate.anchorAt,
        offsetSeconds: candidate.anchorOffsetSeconds,
      },
    };
    return { ...cut, body: cutBody(contentMode, cut) };
  });

  const cutByTopic = new Map();
  for (const cut of cuts) {
    if (!cutByTopic.has(cut.topic)) cutByTopic.set(cut.topic, cut);
  }
  const threads = source.topics.slice(0, 6).map((topic) => {
    const cut = cutByTopic.get(topic.name) ||
      cuts.find((candidate) => candidate.topic === topic.name) ||
      cuts[0];
    return {
      name: topic.name,
      kind: contentMode === "visual-ranking"
        ? "bracket-subject"
        : contentMode === "spoiler-review"
          ? "review-subject"
          : "news-subject",
      mentions: Math.max(1, Number(topic.mentions || 1)),
      cluster: Math.max(1, Number(topic.cluster || 1)),
      first: Math.max(0, Math.min(Number(source.duration), Number(topic.first || cut.at))),
      peak: Math.max(0, Math.min(Number(source.duration), Number(topic.peak || cut.at))),
      receipt: cut.excerpt,
      score: Number(
        (
          Number(topic.cluster || 1) * 4 +
          Math.log2(Number(topic.mentions || 1) + 1)
        ).toFixed(2),
      ),
    };
  });

  const chapterCuts = chapterIndices(cuts, 6).map((index) => cuts[index]);
  const chapters = chapterCuts.map((cut, index) => ({
    id: `pilot-act-${String(index + 1).padStart(2, "0")}`,
    act: index + 1,
    label: cut.label,
    at: cut.at,
    end: cut.end,
    body: cut.body,
    excerpt: cut.excerpt,
    category: cut.category,
    topic: cut.topic,
    cutId: cut.id,
    evidenceBasis: cut.evidenceBasis,
  }));
  const arcCuts = [cuts[0], cuts[Math.floor(cuts.length / 2)], cuts.at(-1)];
  const phases = ["OPENING READ", "MIDPOINT TURN", "CLOSING READ"];
  const takeArc = arcCuts.map((cut, index) => ({
    phase: phases[index],
    label: cut.label,
    at: cut.at,
    end: cut.end,
    body: takeBody(contentMode, phases[index], cut),
    excerpt: cut.excerpt,
    category: cut.category,
    cutId: cut.id,
    evidenceBasis: cut.evidenceBasis,
  }));

  const strongest = [...cuts].sort(
    (left, right) =>
      Number(cutNamesTopic(right)) - Number(cutNamesTopic(left)) ||
      right.score - left.score ||
      Number(right.anchor.kind === "topic-peak") -
        Number(left.anchor.kind === "topic-peak") ||
      left.at - right.at,
  )[0];
  const primary = threads[0];
  const secondary = threads[1];
  const last = cuts.at(-1);
  const fanRead = {
    whyThisNightMatters: {
      label: "WHY THIS NIGHT MATTERS",
      body: `${primary.name} carries the heaviest recurring lane, while ${secondary.name} supplies the next pressure point. The must-play registered stop is ${strongest.topic} at ${formatTime(strongest.at)}: "${strongest.excerpt}".`,
      primaryThread: primary.name,
      secondaryThread: secondary.name,
      strongestCutId: strongest.id,
    },
    loved: fanReceipt(
      "loved",
      "WHAT THE TAPE DEFENDED",
      positiveCut(cuts),
    ),
    hated: fanReceipt(
      "hated",
      "STRAIGHT TO STEVE'S ASSHOLE",
      negativeCut(cuts),
    ),
    wildestDetour: fanReceipt(
      "wildestDetour",
      "WWAM UP IN YA",
      chaosCut(cuts),
    ),
    lastWord: fanReceipt(
      "lastWord",
      "FINAL INDEXED STOP",
      last,
    ),
  };

  const publicCuts = cuts.map((cut) => {
    const publicCut = { ...cut };
    delete publicCut.body;
    return publicCut;
  });
  return {
    schema: "wwam-episode-guide/v2",
    pilot: true,
    format: contentMode,
    basis:
      "Canonical topics and public moment candidates re-matched to bounded local automatic-caption context; speaker, performer, clip origin, visual state, and creator approval remain unverified.",
    overview: guideOverview(source, contentMode, threads, publicCuts),
    evidenceSummary: evidenceSummary(source, contentMode, threads, publicCuts, {
      excerptLimit: rightsLimit,
    }),
    shape: {
      runtimeBand: "MARATHON",
      chapters: chapters.length,
      threads: threads.length,
      cuts: publicCuts.length,
    },
    fanRead,
    chapters,
    takeArc,
    threads,
    cuts: publicCuts,
    metrics: {
      chapters: chapters.length,
      threads: threads.length,
      cuts: publicCuts.length,
      praise: publicCuts.filter((cut) => /\b(?:love|great|best|amazing)\b/i.test(cut.excerpt)).length,
      negative: publicCuts.filter((cut) =>
        cut.category === "TAKE GETS NUCLEAR" ||
        /\b(?:hate|worst|terrible|awful|garbage|trash|sucks|stupid|atrocious)\b/i.test(cut.excerpt),
      ).length,
      comedy: publicCuts.filter((cut) =>
        ["UP IN YA", "FULL SEND", "THE ROOM BREAKS", "CHAT DID THIS"].includes(cut.category),
      ).length,
      substantive: publicCuts.filter((cut) => cut.substance >= 8).length,
    },
  };
}

function readPilotInput(config, rootDir) {
  const artifactPath = path.join(rootDir, config.artifact);
  const payload = loadWindowAssignment(artifactPath, config.global);
  const source = sourceRecords(payload).find((record) => record.id === config.id);
  if (!source) {
    throw new Error(`${config.id} was not found in ${config.artifact}`);
  }
  const captionPath = path.join(rootDir, "source-cache", "captions", `${config.id}.json`);
  const rightsPolicy = normalizedRightsPolicy(source);
  assertEligibleSource(source, rightsPolicy, captionPath);
  const captionRaw = fs.readFileSync(captionPath);
  const captionPayload = JSON.parse(captionRaw.toString("utf8"));
  const lines = parseCaptionLines(captionPayload);
  if (lines.length < 100) {
    throw new Error(`${config.id} caption cache is unexpectedly thin.`);
  }
  return {
    config,
    source,
    rightsPolicy,
    lines,
    canonicalArtifactSha256: sha256(fs.readFileSync(artifactPath)),
    captionSha256: sha256(captionRaw),
  };
}

export function buildPilotPayload(options = {}) {
  const rootDir = options.rootDir || PROJECT_ROOT;
  const configs = options.configs || PILOT_SOURCES;
  const inputs = configs.map((config) => readPilotInput(config, rootDir));
  const guides = inputs.map((input) => {
    const episodeGuide = buildEpisodeGuide(
      input.source,
      input.config.contentMode,
      input.lines,
      input,
    );
    const record = {
      id: input.source.id,
      title: input.source.title,
      date: input.source.date,
      duration: input.source.duration,
      contentMode: input.config.contentMode,
      role: input.config.role,
      sourceArtifact: input.config.artifact.replace(/\\/g, "/"),
      sourceState: {
        coverage: "caption-backed",
        evidenceState: "machine-surfaced",
        reviewState: "pilot-unreviewed",
        promotionAllowed: false,
      },
      rightsPolicy: input.rightsPolicy,
      inputEvidence: {
        canonicalArtifactSha256: input.canonicalArtifactSha256,
        captionSha256: input.captionSha256,
      },
      episodeGuide,
    };
    return {
      ...record,
      generationSha256: sha256(stableJson(record)),
    };
  });
  const contentSha256 = sha256(stableJson(guides));
  const payload = {
    schema: "wwam-episode-guide-v2-pilot/v1",
    generated: GENERATED,
    provenance: {
      generator: "scripts/generate-episode-guide-v2-pilot.mjs",
      method:
        "Deterministic format-aware pilot using canonical topic/public-moment anchors plus bounded local caption matching.",
      contentSha256,
    },
    policy: {
      eligibleCoverage: "caption-backed",
      topicNavigationOnlyAllowed: false,
      publicExcerptWordCeiling: PUBLIC_EXCERPT_CEILING,
      speakerAttributionAllowed: false,
      performerAttributionAllowed: false,
      originAttributionAllowed: false,
      visualOutcomeClaimsAllowed: false,
      promotionAllowed: false,
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
      contentModes: Object.fromEntries(
        [...new Set(guides.map((record) => record.contentMode))]
          .sort()
          .map((mode) => [
            mode,
            guides.filter((record) => record.contentMode === mode).length,
          ]),
      ),
    },
    guides,
  };
  return payload;
}

export function renderArtifact(payload) {
  return `window.WWAM_EPISODE_GUIDE_V2_PILOT = ${JSON.stringify(payload)};\n`;
}

function cli() {
  const args = new Set(process.argv.slice(2));
  const payload = buildPilotPayload();
  const rendered = renderArtifact(payload);
  if (args.has("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated artifact: ${OUTPUT_PATH}`);
    }
    const current = fs.readFileSync(OUTPUT_PATH, "utf8");
    if (current !== rendered) {
      throw new Error(
        "episode-guide-v2-pilot.js is stale; run the generator without --check.",
      );
    }
    process.stdout.write(
      `Episode Guide V2 pilot is deterministic and current: ${payload.provenance.contentSha256}\n`,
    );
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered, "utf8");
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}: ` +
      `${payload.meta.guides} guides, ${payload.meta.chapters} chapters, ` +
      `${payload.meta.cuts} cuts, ${payload.provenance.contentSha256}\n`,
  );
}

const directPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (directPath === fileURLToPath(import.meta.url)) {
  cli();
}
