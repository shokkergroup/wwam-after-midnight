import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const GENERATED = "2026-07-29";
const EXCERPT_WORD_LIMIT = 16;
const LOCAL_WINDOW_SECONDS = 9;
const MAX_ANCHOR_DISTANCE_SECONDS = 30;
const TARGET_CUTS = 12;
const TARGET_CHAPTERS = 6;

const SOURCE_ARTIFACTS = Object.freeze([
  {
    file: "public/demo/archive-deep-distill.js",
    global: "WWAM_ARCHIVE_DEEP",
  },
  {
    file: "public/demo/archive-deep-batch2.js",
    global: "WWAM_ARCHIVE_DEEP_BATCH2",
  },
  {
    file: "public/demo/archive-deep-batch3.js",
    global: "WWAM_ARCHIVE_DEEP_BATCH3",
  },
  {
    file: "public/demo/archive-deep-batch4.js",
    global: "WWAM_ARCHIVE_DEEP_BATCH4",
  },
]);

const GUIDE_FORMAT_ORDER = Object.freeze([
  "movie-news",
  "ranking",
  "review-reaction",
  "livestream",
]);

const FORMAT_PROFILES = Object.freeze({
  "movie-news": Object.freeze({
    label: "LIVE WIRE",
    opener: "COLD OPEN",
    default: "NEWS DESK",
    late: "LAST CALL",
    threadKind: "news-subject",
    supportedContentModes: ["movie-news"],
    topicLabels: Object.freeze({
      Trailers: "TRAILER COURT",
      Batman: "CAPE DESK",
      Marvel: "MARVEL WIRE",
      Halloween: "HADDONFIELD WIRE",
      Hellraiser: "HELLBOUND WIRE",
      Scream: "GHOSTFACE WIRE",
      Streaming: "STREAMING WIRE",
    }),
  }),
  ranking: Object.freeze({
    label: "RANKING BOARD",
    opener: "BOARD OPENER",
    default: "MATCHUP DESK",
    late: "FINAL BOARD CHECK",
    threadKind: "ranking-subject",
    supportedContentModes: ["visual-ranking", "visual-ranking-guest"],
    topicLabels: Object.freeze({
      "Rankings & Lists": "BOARD RULES",
      Batman: "BAT-FIELD",
      Superman: "METROPOLIS MATCHUP",
      Marvel: "MARVEL SIDE",
      Superheroes: "COMIC BOOK COLLISION",
      Halloween: "HADDONFIELD BOARD",
      Scream: "GHOSTFACE BOARD",
      "Friday the 13th": "CRYSTAL LAKE BOARD",
    }),
  }),
  "review-reaction": Object.freeze({
    label: "REVIEW DESK",
    opener: "OPENING READ",
    default: "REACTION DESK",
    late: "FINAL REVIEW PASS",
    threadKind: "review-subject",
    supportedContentModes: [
      "spoiler-review",
      "event-reaction",
      "trailer-reaction",
      "trailer-breakdown",
    ],
    topicLabels: Object.freeze({
      Scream: "GHOSTFACE CASE FILE",
      Trailers: "TRAILER COURT",
      "Fan Theories": "THEORY BOARD",
      Casting: "CASTING CASE",
      "Directors & Writers": "CRAFT CHECK",
      "Remakes & Reboots": "FRANCHISE MEMORY",
      "Rankings & Lists": "FRANCHISE RANK",
    }),
  }),
  livestream: Object.freeze({
    label: "AFTER-HOURS FLOOR",
    opener: "FIRST CALL",
    default: "OPEN LINE",
    late: "LAST CALL",
    threadKind: "conversation-subject",
    supportedContentModes: [
      "franchise-discussion",
      "q-and-a",
      "after-party-discussion",
    ],
    topicLabels: Object.freeze({
      Halloween: "HADDONFIELD HOTLINE",
      Scream: "GHOSTFACE HOTLINE",
      "Chat & Superchats": "THE OPEN LINE",
      "Fan Theories": "THEORY FLOOR",
      Alien: "WEYLAND AFTER-PARTY",
    }),
  }),
});

const CONTENT_MODE_TO_FORMAT = Object.freeze(
  Object.fromEntries(
    Object.entries(FORMAT_PROFILES).flatMap(([format, profile]) =>
      profile.supportedContentModes.map((contentMode) => [contentMode, format]),
    ),
  ),
);

const TOPIC_ALIASES = Object.freeze({
  Alien: ["alien", "aliens", "xenomorph"],
  "A Nightmare on Elm Street": [
    "a nightmare on elm street",
    "nightmare on elm street",
    "elm street",
    "freddy krueger",
    "freddy",
  ],
  Batman: ["batman", "bruce wayne", "joker"],
  "Box Office": ["box office"],
  Casting: ["casting", "cast", "actor", "actors", "actress", "actresses"],
  "Chat & Superchats": ["super chat", "superchat", "the chat"],
  Chucky: ["chucky", "child's play"],
  "Directors & Writers": [
    "director",
    "directors",
    "directed",
    "writer",
    "writers",
    "writing",
    "screenplay",
  ],
  "Evil Dead": ["evil dead", "ash williams", "deadite"],
  "Fan Theories": ["fan theory", "fan theories", "theory", "theories"],
  "Final Destination": ["final destination"],
  "Friday the 13th": [
    "friday the 13th",
    "friday 13th",
    "jason voorhees",
    "crystal lake",
  ],
  Ghostbusters: ["ghostbusters", "ghost busters"],
  "Godzilla / Kong": ["godzilla", "king kong", "kong"],
  Halloween: ["halloween", "michael myers", "dr loomis", "loomis", "lumis"],
  Hellraiser: ["hellraiser", "pinhead"],
  Horror: ["horror", "horror movie", "horror movies"],
  Jurassic: ["jurassic park", "jurassic world", "jurassic"],
  Marvel: [
    "marvel",
    "avengers",
    "spider-man",
    "spider man",
    "fantastic four",
    "wolverine",
  ],
  "Mortal Kombat": ["mortal kombat"],
  "Movie News": ["movie news"],
  "Movie Theaters": ["movie theater", "movie theaters", "cinema", "theater"],
  Nostalgia: ["nostalgia", "nostalgic"],
  "Physical Media": [
    "physical media",
    "blu-ray",
    "blu ray",
    "bluray",
    "dvd",
    "4k disc",
  ],
  Predator: ["predator", "predators"],
  "Rankings & Lists": [
    "ranking",
    "rankings",
    "ranked",
    "tier list",
    "bracket",
    "top ten",
    "top 10",
  ],
  "Remakes & Reboots": ["remake", "remakes", "reboot", "reboots"],
  Saw: ["saw", "jigsaw"],
  Scream: ["scream", "ghostface", "sidney prescott"],
  "Sequels & Prequels": ["sequel", "sequels", "prequel", "prequels"],
  Slashers: ["slasher", "slashers"],
  "Stephen King": ["stephen king"],
  Streaming: [
    "streaming",
    "netflix",
    "hbo max",
    "max",
    "paramount plus",
    "peacock",
  ],
  Superheroes: ["superhero", "superheroes", "comic book movie"],
  Superman: ["superman", "clark kent"],
  Television: ["television", "tv series", "tv show"],
  Terrifier: ["terrifier", "art the clown"],
  "Texas Chainsaw": [
    "texas chainsaw",
    "texas chain saw",
    "leatherface",
  ],
  "The Conjuring": ["the conjuring", "conjuring"],
  "The Exorcist": ["the exorcist", "exorcist"],
  "The Shining": ["the shining"],
  Trailers: ["trailer", "trailers", "teaser"],
  "Universal Monsters": [
    "universal monsters",
    "dracula",
    "frankenstein",
    "wolf man",
  ],
  "Video Games": ["video game", "video games", "game trailer"],
});

const PUBLIC_MOMENT_CATEGORIES = new Set([
  "FULL SEND",
  "TAKE GETS NUCLEAR",
  "THE ROOM BREAKS",
  "UP IN YA",
  "CHAT DID THIS",
]);

const POSITIVE_CUES =
  /\b(?:love|loved|great|best|amazing|favorite|favourite|excellent|fantastic)\b/i;
const NEGATIVE_CUES =
  /\b(?:hate|hated|worst|terrible|awful|garbage|trash|sucks|stupid|atrocious)\b/i;
const NEGATED_POSITIVE_CUE =
  /\b(?:doesn'?t|isn'?t|wasn'?t|weren'?t|not|never|no)\b(?:\W+\w+){0,2}\W+(?:great|best|amazing|love|favorite|excellent|fantastic)\b/i;
const VISUAL_OUTCOME_CUE =
  /\b(?:wins?|won|winner|takes down|advances?|eliminat(?:e|ed|es)|beats?)\b/i;
const EXCERPT_CONNECTIVE_START =
  /^(?:and|but|so|because|that|the|then|uh|um|like|yeah|well)\b/i;
const EXCERPT_INCOMPLETE_END =
  /\b(?:and|or|but|to|the|a|an|of|with|for|because|like|that|if|when|while|i|you|we|is|are|was|were|be|been|being|have|has|had|do|does|did|going|got|said|made)\s*$/i;
const EXCERPT_FILLERS = new Set([
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
const TITLE_ALIAS_BLOCKLIST = new Set([
  "actor",
  "actors",
  "actress",
  "actresses",
  "cast",
  "casting",
  "chat",
  "max",
  "the chat",
  "theater",
  "writer",
  "writers",
]);
const STRUCTURAL_TITLE_TOPICS = new Set([
  "Movie News",
  "Rankings & Lists",
  "Trailers",
]);

const RECAP_PHASE_LEADS = Object.freeze({
  "movie-news": Object.freeze([
    Object.freeze([
      "The live wire opens",
      "The second bulletin lands",
      "The back-half file turns",
      "The final indexed bulletin lands",
    ]),
    Object.freeze([
      "First through the newsroom door",
      "The next source card moves",
      "Later, the wire routes",
      "The closing source card returns",
    ]),
    Object.freeze([
      "The tape files its first item",
      "A second desk marker arrives",
      "The later stack reaches",
      "The last registered item reaches",
    ]),
    Object.freeze([
      "The opening news route finds",
      "The guide then files",
      "Past the midpoint, the tape finds",
      "At the last indexed stop, the tape finds",
    ]),
  ]),
  ranking: Object.freeze([
    Object.freeze([
      "The spoken ranking route opens",
      "The next caption-backed matchup reaches",
      "The later board discussion moves",
      "The final indexed ranking subject lands",
    ]),
    Object.freeze([
      "First on the ranking tape",
      "The next listed subject arrives",
      "The back half of the spoken route reaches",
      "The last caption-backed board door reaches",
    ]),
    Object.freeze([
      "The guide enters the ranking discussion through",
      "A second spoken bracket door opens on",
      "Later, the caption track files",
      "The closing registered topic is",
    ]),
    Object.freeze([
      "The first board-side receipt names",
      "The next source card names",
      "Beyond the midpoint, the tape names",
      "The final source card names",
    ]),
  ]),
  "review-reaction": Object.freeze([
    Object.freeze([
      "The review route opens",
      "The next case-file turn lands",
      "The back-half reaction route reaches",
      "The final indexed review stop reaches",
    ]),
    Object.freeze([
      "First under the review light",
      "The source then files",
      "Later, the reaction desk reaches",
      "The closing caption-backed item is",
    ]),
    Object.freeze([
      "The tape starts its review map with",
      "A second source-locked read reaches",
      "Past the midpoint, the map moves to",
      "The last registered read returns to",
    ]),
    Object.freeze([
      "The opening case-file receipt names",
      "The next bounded receipt names",
      "The later review pass names",
      "The final bounded receipt names",
    ]),
  ]),
  livestream: Object.freeze([
    Object.freeze([
      "The after-hours route opens",
      "The next open-line turn reaches",
      "The back half of the conversation map reaches",
      "The final indexed open-line stop reaches",
    ]),
    Object.freeze([
      "First through the open line",
      "The source then routes",
      "Later, the after-hours floor reaches",
      "The closing registered subject is",
    ]),
    Object.freeze([
      "The tape starts its conversation map with",
      "A second source card reaches",
      "Past the midpoint, the map turns toward",
      "The last bounded receipt returns to",
    ]),
    Object.freeze([
      "The opening hotline receipt names",
      "The next caption-backed receipt names",
      "The later open-line pass names",
      "The final caption-backed receipt names",
    ]),
  ]),
});

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\[(?:\s*__+\s*|bleep)\]/gi, "BLEEP")
    .replace(/\[[^\]]{1,48}\]/g, " ")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/>>+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function wordCount(value) {
  return words(value).length;
}

function normalizedWords(value) {
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

function deterministicIndex(value, count) {
  if (!Number.isFinite(count) || count <= 1) return 0;
  const digest = crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16) % count;
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

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function normalizedRightsPolicy(source) {
  return {
    mode: "standard-caption-candidates",
    restrictedToTopicNavigation: false,
    publicExcerptWordLimit: EXCERPT_WORD_LIMIT,
    speakerClaimsAllowed: false,
    performerClaimsAllowed: false,
    originClaimsAllowed: false,
    visualClaimsAllowed: false,
    promotionAllowed: false,
    ...(source.rightsPolicy && typeof source.rightsPolicy === "object"
      ? source.rightsPolicy
      : {}),
    promotionAllowed: false,
  };
}

export function parseCaptionLines(payload) {
  const lines = [];
  for (const event of Array.isArray(payload?.events) ? payload.events : []) {
    if (!Array.isArray(event.segs) || !Number.isFinite(event.tStartMs)) continue;
    const text = clean(event.segs.map((segment) => segment.utf8 || "").join(""));
    if (!text || text === "\\n") continue;
    const at = Math.max(0, Math.floor(event.tStartMs / 1000));
    const duration = Math.max(
      1,
      Math.ceil((Number(event.dDurationMs) || 4000) / 1000),
    );
    if (lines.length && lines.at(-1).at === at && lines.at(-1).text === text) {
      continue;
    }
    lines.push({ at, end: at + duration, text });
  }
  return lines.sort(
    (left, right) =>
      left.at - right.at || left.text.localeCompare(right.text),
  );
}

function eligibilityReasons(source, rightsPolicy, captionPath) {
  const reasons = [];
  if (source.sourceType === "commentary") reasons.push("commentary-source");
  if (source.captioned === false) reasons.push("not-caption-backed");
  if (!captionPath || !fs.existsSync(captionPath)) reasons.push("missing-caption-cache");
  if (rightsPolicy.restrictedToTopicNavigation) {
    reasons.push("topic-navigation-only");
  }
  if (!Array.isArray(source.topics) || source.topics.length < 3) {
    reasons.push("insufficient-canonical-topics");
  }
  if (!CONTENT_MODE_TO_FORMAT[source.contentMode]) {
    reasons.push("unsupported-content-mode");
  }
  if (
    source.availability &&
    !["public", "unlisted"].includes(String(source.availability).toLowerCase())
  ) {
    reasons.push("source-not-publicly-available");
  }
  return [...new Set(reasons)].sort();
}

export function classifyGuideFormat(contentMode) {
  return CONTENT_MODE_TO_FORMAT[contentMode] || "";
}

function normalizedTopicAliases(topicName) {
  const configured = TOPIC_ALIASES[topicName] || [];
  const fallback = clean(topicName)
    .toLowerCase()
    .replace(/\s*&\s*/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .replace(/[^a-z0-9' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [...new Set([...configured, fallback].map((value) => clean(value).toLowerCase()))]
    .filter(Boolean)
    .sort(
      (left, right) =>
        words(right).length - words(left).length ||
        right.length - left.length ||
        left.localeCompare(right),
    );
}

function aliasPattern(alias) {
  return new RegExp(
    `(?:^|[^a-z0-9])${alias
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\ /g, "\\s+")}(?:$|[^a-z0-9])`,
    "i",
  );
}

export function titleTopicMatchWeight(title, topicName) {
  const haystack = ` ${clean(title).toLowerCase()} `;
  const normalizedTopic = clean(topicName)
    .toLowerCase()
    .replace(/\s*&\s*/g, " ")
    .replace(/\s*\/\s*/g, " ")
    .replace(/[^a-z0-9' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let best = 0;
  if (
    normalizedTopic &&
    !TITLE_ALIAS_BLOCKLIST.has(normalizedTopic) &&
    aliasPattern(normalizedTopic).test(haystack)
  ) {
    best = 200 + words(normalizedTopic).length * 10 + normalizedTopic.length;
  }
  for (const alias of normalizedTopicAliases(topicName)) {
    if (TITLE_ALIAS_BLOCKLIST.has(alias)) continue;
    if (alias.length < 4 && alias !== "saw") continue;
    if (!aliasPattern(alias).test(haystack)) continue;
    best = Math.max(best, 100 + words(alias).length * 10 + alias.length);
  }
  if (best && STRUCTURAL_TITLE_TOPICS.has(topicName)) {
    return Math.max(1, best - 90);
  }
  return best;
}

function titleOrderedTopics(source) {
  return source.topics
    .map((topic, sourceIndex) => ({
      topic,
      sourceIndex,
      titleWeight: titleTopicMatchWeight(source.title, topic.name),
    }))
    .sort(
      (left, right) =>
        right.titleWeight - left.titleWeight ||
        left.sourceIndex - right.sourceIndex,
    )
    .map((entry) => entry.topic);
}

function lineTopicMatch(line, topicName) {
  const haystack = ` ${clean(line.text).toLowerCase()} `;
  for (const alias of normalizedTopicAliases(topicName)) {
    if (aliasPattern(alias).test(haystack)) return alias;
  }
  return "";
}

function topicMatches(lines, topicName) {
  const matches = [];
  for (const line of lines) {
    const evidence = lineTopicMatch(line, topicName);
    if (evidence) matches.push({ line, evidence });
  }
  return matches;
}

function closestMatch(matches, targetAt, maxDistance) {
  let best = null;
  for (const match of matches) {
    const distance = Math.abs(match.line.at - targetAt);
    if (distance > maxDistance) continue;
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && match.line.at < best.line.at)
    ) {
      best = { ...match, distance };
    }
  }
  return best;
}

function localContext(lines, centerAt, radiusSeconds = LOCAL_WINDOW_SECONDS) {
  return clean(
    lines
      .filter((line) => Math.abs(line.at - centerAt) <= radiusSeconds)
      .map((line) => line.text)
      .join(" "),
  );
}

function boundedExcerpt(text, topicEvidence, limit = EXCERPT_WORD_LIMIT) {
  const tokens = words(text);
  const cap = Math.max(4, Math.min(EXCERPT_WORD_LIMIT, Number(limit) || 0));
  const aliasTokens = words(topicEvidence);
  if (!tokens.length || !aliasTokens.length) return "";

  let aliasStart = -1;
  const comparable = (token) =>
    String(token).toLowerCase().replace(/'s$/i, "");
  const normalizedAlias = aliasTokens.map(comparable).join(" ");
  for (let index = 0; index <= tokens.length - aliasTokens.length; index += 1) {
    if (
      tokens
        .slice(index, index + aliasTokens.length)
        .map(comparable)
        .join(" ") === normalizedAlias
    ) {
      aliasStart = index;
      break;
    }
  }
  if (aliasStart < 0) return "";
  const maxLength = Math.min(tokens.length, cap);
  const minLength = Math.min(
    maxLength,
    Math.max(aliasTokens.length + 5, 10),
  );
  const candidates = [];
  for (let length = minLength; length <= maxLength; length += 1) {
    const earliestStart = Math.max(
      0,
      aliasStart + aliasTokens.length - length,
    );
    const latestStart = Math.min(aliasStart, tokens.length - length);
    for (let start = earliestStart; start <= latestStart; start += 1) {
      const windowTokens = tokens.slice(start, start + length);
      const excerpt = windowTokens.join(" ");
      let adjacentRepeats = 0;
      for (let index = 1; index < windowTokens.length; index += 1) {
        if (comparable(windowTokens[index]) === comparable(windowTokens[index - 1])) {
          adjacentRepeats += 1;
        }
      }
      const fillerRatio =
        windowTokens.filter((token) =>
          EXCERPT_FILLERS.has(token.toLowerCase()),
        ).length / Math.max(1, windowTokens.length);
      const topicOffset = aliasStart - start;
      const hasBreathingRoom =
        topicOffset >= 2 &&
        topicOffset + aliasTokens.length <= windowTokens.length - 2;
      const score =
        length * 0.35 +
        Number(!EXCERPT_CONNECTIVE_START.test(excerpt)) * 8 +
        Number(!EXCERPT_INCOMPLETE_END.test(excerpt)) * 11 +
        Number(/^[A-Z0-9]/.test(excerpt)) * 5 +
        Number(hasBreathingRoom) * 3 -
        adjacentRepeats * 9 -
        fillerRatio * 18 -
        Math.abs(
          topicOffset +
            aliasTokens.length / 2 -
            windowTokens.length / 2,
        ) *
          0.12;
      candidates.push({
        excerpt,
        length,
        start,
        score,
      });
    }
  }
  return candidates.sort(
    (left, right) =>
      right.score - left.score ||
      right.length - left.length ||
      left.start - right.start,
  )[0]?.excerpt || "";
}

function captionLineExcerpt(
  lines,
  centerLine,
  topicEvidence,
  limit = EXCERPT_WORD_LIMIT,
) {
  const centerIndex = lines.findIndex(
    (line) =>
      line === centerLine ||
      (line.at === centerLine.at && line.text === centerLine.text),
  );
  if (centerIndex < 0) {
    return boundedExcerpt(
      localContext(lines, centerLine.at),
      topicEvidence,
      limit,
    );
  }
  const cap = Math.max(4, Math.min(EXCERPT_WORD_LIMIT, Number(limit) || 0));
  const aliasTokens = words(topicEvidence).map((token) =>
    token.toLowerCase().replace(/'s$/i, ""),
  );
  const candidates = [];
  for (let startOffset = -3; startOffset <= 0; startOffset += 1) {
    const startIndex = Math.max(0, centerIndex + startOffset);
    for (
      let endIndex = Math.max(centerIndex, startIndex);
      endIndex <= Math.min(lines.length - 1, centerIndex + 5);
      endIndex += 1
    ) {
      const selectedLines = lines.slice(startIndex, endIndex + 1);
      if (
        selectedLines.some(
          (line) =>
            Math.abs(line.at - centerLine.at) > LOCAL_WINDOW_SECONDS,
        )
      ) {
        continue;
      }
      const contextTokens = words(
        selectedLines
          .map((line) => line.text)
          .join(" "),
      );
      if (contextTokens.length < 8) continue;
      const windowTokens = contextTokens.slice(0, cap);
      let topicOffset = -1;
      for (
        let index = 0;
        index <= windowTokens.length - aliasTokens.length;
        index += 1
      ) {
        const comparableWindow = windowTokens
          .slice(index, index + aliasTokens.length)
          .map((token) => token.toLowerCase().replace(/'s$/i, ""))
          .join(" ");
        if (comparableWindow === aliasTokens.join(" ")) {
          topicOffset = index;
          break;
        }
      }
      if (topicOffset < 0) continue;
      const excerpt = windowTokens.join(" ");
      let repeats = 0;
      for (let index = 1; index < windowTokens.length; index += 1) {
        if (
          windowTokens[index].toLowerCase().replace(/'s$/i, "") ===
          windowTokens[index - 1].toLowerCase().replace(/'s$/i, "")
        ) {
          repeats += 1;
        }
      }
      const fillerRatio =
        windowTokens.filter((token) =>
          EXCERPT_FILLERS.has(token.toLowerCase()),
        ).length / windowTokens.length;
      const hasBreathingRoom =
        topicOffset >= 2 &&
        topicOffset + aliasTokens.length <= windowTokens.length - 2;
      const startPreference = {
        "-3": 1,
        "-2": 3,
        "-1": 6,
        0: 4,
      }[String(startOffset)] || 0;
      const score =
        windowTokens.length * 0.35 +
        Number(!EXCERPT_CONNECTIVE_START.test(excerpt)) * 8 +
        Number(!EXCERPT_INCOMPLETE_END.test(excerpt)) * 11 +
        Number(/^[A-Z0-9]/.test(excerpt)) * 4 +
        Number(hasBreathingRoom) * 4 +
        startPreference -
        repeats * 9 -
        fillerRatio * 18;
      candidates.push({
        excerpt,
        score,
        length: windowTokens.length,
        startIndex,
      });
      if (contextTokens.length >= cap) break;
    }
  }
  if (!candidates.length) {
    return boundedExcerpt(
      localContext(lines, centerLine.at),
      topicEvidence,
      limit,
    );
  }
  return candidates.sort(
    (left, right) =>
      right.score - left.score ||
      right.length - left.length ||
      left.startIndex - right.startIndex,
  )[0].excerpt;
}

function topicSignal(topic) {
  return (
    Number(topic.cluster || 0) * 7 +
    Math.log2(Number(topic.mentions || 1) + 1) * 10
  );
}

function candidateScore(candidate) {
  const anchorWeight = {
    "public-moment": 1100,
    "topic-peak": 620,
    "topic-first": 480,
    "caption-band": 260,
  }[candidate.anchorKind] || 0;
  return (
    anchorWeight +
    topicSignal(candidate.topic) +
    Number(candidate.heat || 0) * 4 -
    Number(candidate.anchorDeltaSeconds || 0)
  );
}

function createCandidate({
  anchorKind,
  anchorAt,
  match,
  topic,
  momentCategory = "",
  heat = 0,
}) {
  const candidate = {
    anchorKind,
    anchorAt: Math.floor(Number(anchorAt)),
    anchorDeltaSeconds: Math.abs(match.line.at - Number(anchorAt)),
    line: match.line,
    topic,
    topicEvidence: match.evidence,
    momentCategory,
    heat,
  };
  return { ...candidate, seedScore: candidateScore(candidate) };
}

function canonicalCandidates(source, lines) {
  const topics = source.topics
    .filter((topic) => topic && topic.name)
    .map((topic) => ({ ...topic, name: clean(topic.name) }));
  const matchesByTopic = new Map(
    topics.map((topic) => [topic.name, topicMatches(lines, topic.name)]),
  );
  const candidates = [];

  for (const topic of topics) {
    const matches = matchesByTopic.get(topic.name) || [];
    for (const [anchorKind, targetAt] of [
      ["topic-first", Number(topic.first)],
      ["topic-peak", Number(topic.peak)],
    ]) {
      if (!Number.isFinite(targetAt)) continue;
      const match = closestMatch(
        matches,
        targetAt,
        MAX_ANCHOR_DISTANCE_SECONDS,
      );
      if (!match) continue;
      candidates.push(
        createCandidate({ anchorKind, anchorAt: targetAt, match, topic }),
      );
    }

    const bandCount = 8;
    const duration = Number(source.duration || 1);
    for (let band = 0; band < bandCount; band += 1) {
      const from = (duration * band) / bandCount;
      const to = (duration * (band + 1)) / bandCount;
      const center = (from + to) / 2;
      const match = matches
        .filter((item) => item.line.at >= from && item.line.at < to)
        .sort(
          (left, right) =>
            Math.abs(left.line.at - center) - Math.abs(right.line.at - center) ||
            left.line.at - right.line.at,
        )[0];
      if (!match) continue;
      candidates.push(
        createCandidate({
          anchorKind: "caption-band",
          anchorAt: match.line.at,
          match,
          topic,
        }),
      );
    }
  }

  for (const moment of Array.isArray(source.moments) ? source.moments : []) {
    if (!Number.isFinite(moment.t)) continue;
    let best = null;
    for (const topic of topics) {
      const match = closestMatch(
        matchesByTopic.get(topic.name) || [],
        Number(moment.t),
        MAX_ANCHOR_DISTANCE_SECONDS,
      );
      if (!match) continue;
      if (
        !best ||
        match.distance < best.match.distance ||
        (match.distance === best.match.distance &&
          topicSignal(topic) > topicSignal(best.topic)) ||
        (match.distance === best.match.distance &&
          topicSignal(topic) === topicSignal(best.topic) &&
          topic.name.localeCompare(best.topic.name) < 0)
      ) {
        best = { match, topic };
      }
    }
    if (!best) continue;
    const category = clean(moment.category).toUpperCase();
    candidates.push(
      createCandidate({
        anchorKind: "public-moment",
        anchorAt: Number(moment.t),
        match: best.match,
        topic: best.topic,
        momentCategory: PUBLIC_MOMENT_CATEGORIES.has(category) ? category : "",
        heat: Math.max(0, Math.min(100, Number(moment.heat || 0))),
      }),
    );
  }

  const deduped = new Map();
  for (const candidate of candidates) {
    if (candidate.line.at >= Number(source.duration || Infinity)) continue;
    const key = `${candidate.line.at}|${candidate.topic.name}`;
    const current = deduped.get(key);
    if (
      !current ||
      candidate.seedScore > current.seedScore ||
      (candidate.seedScore === current.seedScore &&
        candidate.anchorKind.localeCompare(current.anchorKind) < 0)
    ) {
      deduped.set(key, candidate);
    }
  }
  return [...deduped.values()].sort(
    (left, right) =>
      right.seedScore - left.seedScore ||
      left.line.at - right.line.at ||
      left.topic.name.localeCompare(right.topic.name),
  );
}

function selectCandidates(candidates, source, guideFormat) {
  const rankingSafe =
    guideFormat === "ranking"
      ? candidates.filter((candidate) => {
          const excerpt = captionLineExcerpt(
            source.captionLines,
            candidate.line,
            candidate.topicEvidence,
          );
          return excerpt && !VISUAL_OUTCOME_CUE.test(excerpt);
        })
      : candidates;
  const selected = [];
  const topicCounts = new Map();

  function canAdd(candidate, minGap, maxPerTopic) {
    if (
      selected.some(
        (item) => Math.abs(item.line.at - candidate.line.at) < minGap,
      )
    ) {
      return false;
    }
    return (topicCounts.get(candidate.topic.name) || 0) < maxPerTopic;
  }

  function add(candidate) {
    selected.push(candidate);
    topicCounts.set(
      candidate.topic.name,
      (topicCounts.get(candidate.topic.name) || 0) + 1,
    );
  }

  for (const candidate of rankingSafe.filter(
    (item) => item.anchorKind === "public-moment",
  )) {
    if (selected.length >= 3) break;
    if ((topicCounts.get(candidate.topic.name) || 0) > 0) continue;
    if (canAdd(candidate, 35, 2)) add(candidate);
  }

  for (const topic of titleOrderedTopics(source)) {
    if (selected.length >= TARGET_CUTS) break;
    const candidate = rankingSafe.find(
      (item) =>
        item.topic.name === topic.name &&
        ["topic-peak", "topic-first"].includes(item.anchorKind) &&
        canAdd(item, 35, 2),
    );
    if (candidate) add(candidate);
  }

  const duration = Number(source.duration || 1);
  for (let band = 0; band < 6 && selected.length < TARGET_CUTS; band += 1) {
    const from = (duration * band) / 6;
    const to = (duration * (band + 1)) / 6;
    const candidate = rankingSafe.find(
      (item) =>
        item.line.at >= from &&
        item.line.at < to &&
        canAdd(item, 24, 2),
    );
    if (candidate) add(candidate);
  }

  for (const [minGap, maxPerTopic] of [
    [24, 2],
    [12, 3],
    [0, 3],
  ]) {
    for (const candidate of rankingSafe) {
      if (selected.length >= TARGET_CUTS) break;
      if (canAdd(candidate, minGap, maxPerTopic)) add(candidate);
    }
  }

  if (selected.length < 8) {
    throw new Error(
      `${source.id} produced only ${selected.length} safe local-topic cuts.`,
    );
  }
  return selected
    .slice(0, TARGET_CUTS)
    .sort(
      (left, right) =>
        left.line.at - right.line.at ||
        left.topic.name.localeCompare(right.topic.name),
    );
}

function formatCategory(guideFormat, candidate, source) {
  if (candidate.momentCategory) return candidate.momentCategory;
  const profile = FORMAT_PROFILES[guideFormat];
  const ratio = candidate.line.at / Number(source.duration || 1);
  return (
    profile.topicLabels[candidate.topic.name] ||
    (ratio < 0.12
      ? profile.opener
      : ratio > 0.82
        ? profile.late
        : profile.default)
  );
}

function cutBody(guideFormat, cut, sourceId, cutIndex) {
  const time = formatTime(cut.at);
  const variant = deterministicIndex(
    `${sourceId}|${cut.topic}|${cutIndex}|cut-body`,
    4,
  );
  if (guideFormat === "ranking") {
    return [
      `${cut.topic} reaches the caption-backed ranking route at ${time}. Tape door: "${cut.excerpt}". The spoken topic is established; no unseen board result is claimed.`,
      `At ${time}, the ranking tape opens a ${cut.topic} door: "${cut.excerpt}". That proves the spoken subject only; the picture supplies no certified result.`,
      `${time} files ${cut.topic} in the spoken ranking discussion. The bounded receipt is "${cut.excerpt}", while any board outcome stays unverified.`,
      `The caption track reaches ${cut.topic} at ${time}: "${cut.excerpt}". This guide records the discussion and leaves the unseen matchup state alone.`,
    ][variant];
  }
  if (guideFormat === "review-reaction") {
    return [
      `${cut.topic} reaches the review desk at ${time}. Tape door: "${cut.excerpt}". The fragment stays unassigned to a speaker and is not treated as a final verdict.`,
      `At ${time}, the reaction map files ${cut.topic}: "${cut.excerpt}". It is a source-local read, not a named host's final ruling.`,
      `${time} opens the ${cut.topic} case file with "${cut.excerpt}". The guide preserves the fragment without assigning a speaker or complete verdict.`,
      `The review tape turns toward ${cut.topic} at ${time}. Its bounded door is "${cut.excerpt}", with identity and intent still held for review.`,
    ][variant];
  }
  if (guideFormat === "livestream") {
    return [
      `${cut.topic} reaches the after-hours floor at ${time}. Tape door: "${cut.excerpt}". The guide identifies the subject, not a speaker or intent.`,
      `At ${time}, the open line routes into ${cut.topic}: "${cut.excerpt}". The bounded receipt establishes the subject and nothing about who delivered it.`,
      `${time} places ${cut.topic} on the conversation map. The source-local door is "${cut.excerpt}", while speaker and intent remain unassigned.`,
      `The after-hours tape reaches ${cut.topic} at ${time}: "${cut.excerpt}". It stays a playable subject receipt until an editor verifies the room.`,
    ][variant];
  }
  return [
    `${cut.topic} reaches the live wire at ${time}. Tape door: "${cut.excerpt}". The fragment remains source-locked with no speaker inferred.`,
    `At ${time}, the news map files ${cut.topic}: "${cut.excerpt}". The receipt stays attached to this upload and to no inferred host.`,
    `${time} routes the live wire into ${cut.topic}. Its bounded door is "${cut.excerpt}", with speaker identity deliberately left blank.`,
    `The source tape reaches ${cut.topic} at ${time}: "${cut.excerpt}". This records the bulletin subject without inventing who said it.`,
  ][variant];
}

function chapterIndices(cuts, count = TARGET_CHAPTERS) {
  const indices = [];
  for (let index = 0; index < count; index += 1) {
    const candidate = Math.round((index * (cuts.length - 1)) / (count - 1));
    if (!indices.includes(candidate)) indices.push(candidate);
  }
  return indices;
}

function threadRecords(source, guideFormat, cuts) {
  const profile = FORMAT_PROFILES[guideFormat];
  const cutByTopic = new Map();
  for (const cut of cuts) {
    if (!cutByTopic.has(cut.topic)) cutByTopic.set(cut.topic, cut);
  }
  const threads = [];
  for (const topic of titleOrderedTopics(source)) {
    const cut = cutByTopic.get(topic.name);
    if (!cut) continue;
    threads.push({
      name: topic.name,
      kind: profile.threadKind,
      mentions: Math.max(1, Number(topic.mentions || 1)),
      cluster: Math.max(1, Number(topic.cluster || 1)),
      first: Math.max(
        0,
        Math.min(Number(source.duration), Number(topic.first || cut.at)),
      ),
      peak: Math.max(
        0,
        Math.min(Number(source.duration), Number(topic.peak || cut.at)),
      ),
      receipt: cut.excerpt,
      cutId: cut.id,
      score: Number(topicSignal(topic).toFixed(2)),
    });
    if (threads.length >= 6) break;
  }
  if (!threads.length) {
    throw new Error(`${source.id} produced no caption-backed guide threads.`);
  }
  return threads;
}

function formatRecapHeadline(guideFormat, primary, secondary, sourceId) {
  const primaryVariant = deterministicIndex(
    `${sourceId}|recap-headline-primary`,
    4,
  );
  const secondaryVariant = deterministicIndex(
    `${sourceId}|recap-headline-secondary`,
    4,
  );
  let primaryParts;
  let secondaryParts;
  if (guideFormat === "ranking") {
    primaryParts = [
      `${primary} ON THE BOARD`,
      `${primary} GETS A RANKING FILE`,
      `${primary} AT THE TOP OF THE GUIDE`,
      `${primary} ENTERS THE TAPE`,
    ];
    secondaryParts = [
      `${secondary} IN THE SECOND COLUMN`,
      `${secondary} GETS ANOTHER`,
      `${secondary} ON THE NEXT CARD`,
      `${secondary} JOINS THE LIST`,
    ];
  } else if (guideFormat === "review-reaction") {
    primaryParts = [
      `${primary} AT THE OPEN`,
      `${primary} GETS THE CASE FILE`,
      `${primary} LEADS THE REVIEW MAP`,
      `${primary} IN THE FIRST FILE`,
    ];
    secondaryParts = [
      `${secondary} UNDER THE REVIEW LIGHT`,
      `${secondary} GETS THE SECOND READ`,
      `${secondary} TAKES THE NEXT CARD`,
      `${secondary} IN THE NEXT ONE`,
    ];
  } else if (guideFormat === "livestream") {
    primaryParts = [
      `${primary} OPENS THE LINE`,
      `${primary} ON THE HOTLINE`,
      `${primary} LEADS THE MAP`,
      `${primary} AT FIRST CALL`,
    ];
    secondaryParts = [
      `${secondary} GETS THE NEXT CALL`,
      `${secondary} ON THE SECOND CARD`,
      `${secondary} JOINS THE OPEN LINE`,
      `${secondary} IN THE NEXT FILE`,
    ];
  } else {
    primaryParts = [
      `${primary} TAKES THE WIRE`,
      `${primary} LEADS THE BULLETIN`,
      `${primary} AT FIRST CALL`,
      `${primary} OPENS THE NEWSROOM`,
    ];
    secondaryParts = [
      `${secondary} STAYS ON THE DESK`,
      `${secondary} GETS THE NEXT FILE`,
      `${secondary} IN THE SECOND STACK`,
      `${secondary} CLOSES THE NEXT FOLDER`,
    ];
  }
  return `${primaryParts[primaryVariant]}. ${secondaryParts[secondaryVariant]}.`;
}

function recapParagraphs(guideFormat, cuts, sourceId) {
  const indices = [
    0,
    Math.max(1, Math.floor((cuts.length - 1) / 3)),
    Math.max(2, Math.floor(((cuts.length - 1) * 2) / 3)),
    cuts.length - 1,
  ];
  const selected = [...new Set(indices)].map((index) => cuts[index]);
  const leadSets = RECAP_PHASE_LEADS[guideFormat];
  return selected.map((cut, index) => {
    const lead =
      leadSets[
        deterministicIndex(
          `${sourceId}|recap-paragraph|${index}`,
          leadSets.length,
        )
      ][index];
    return {
      at: cut.at,
      end: cut.end,
      cutId: cut.id,
      topic: cut.topic,
      excerpt: cut.excerpt,
      body: `${lead} on ${cut.topic} at ${formatTime(cut.at)}. The exact bounded door is "${cut.excerpt}".`,
      evidenceBasis: cut.evidenceBasis,
    };
  });
}

function laneCandidate(key, label, cut) {
  if (!cut) return null;
  return {
    key,
    label,
    status: "machine-candidate-review-required",
    at: cut.at,
    end: cut.end,
    cutId: cut.id,
    category: cut.category,
    topic: cut.topic,
    excerpt: cut.excerpt,
    body: `${cut.topic} supplies the source-local candidate at ${formatTime(cut.at)}: "${cut.excerpt}".`,
    evidenceBasis: cut.evidenceBasis,
    promotionAllowed: false,
  };
}

function positiveCut(cuts) {
  return cuts.find(
    (cut) =>
      POSITIVE_CUES.test(cut.excerpt) &&
      !NEGATED_POSITIVE_CUE.test(cut.excerpt),
  );
}

function negativeCut(cuts) {
  return cuts.find((cut) => NEGATIVE_CUES.test(cut.excerpt));
}

function chaosCut(cuts) {
  return [...cuts]
    .sort((left, right) => right.score - left.score || left.at - right.at)
    .find((cut) =>
      ["UP IN YA", "FULL SEND", "THE ROOM BREAKS", "CHAT DID THIS"].includes(
        cut.category,
      ),
    );
}

function guideOverview(source, guideFormat, threads, cuts) {
  const first = cuts[0];
  const midpoint = cuts[Math.floor(cuts.length / 2)];
  const last = cuts.at(-1);
  const leaders = threads.slice(0, 3).map((thread) => thread.name);
  const profile = FORMAT_PROFILES[guideFormat];
  const boundary =
    guideFormat === "ranking"
      ? "The map establishes spoken subjects only; unseen ranking outcomes remain outside the evidence boundary."
      : "Speaker identity, intent, and a single final verdict remain outside the evidence boundary.";
  const openerVariant = deterministicIndex(
    `${source.id}|guide-overview-opener`,
    4,
  );
  const routeVariant = deterministicIndex(
    `${source.id}|guide-overview-route`,
    4,
  );
  const openers = [
    `${source.title} on ${source.date} becomes a ${profile.label.toLowerCase()} route led by ${leaders.join(", ")}.`,
    `This ${profile.label.toLowerCase()} pass through ${source.title} (${source.date}) files ${leaders.join(", ")} as its leading subjects.`,
    `${source.title} receives a source-locked ${profile.label.toLowerCase()} map for ${source.date}, led by ${leaders.join(", ")}.`,
    `Filed from the ${source.date} upload, this ${profile.label.toLowerCase()} guide follows ${leaders.join(", ")} through ${source.title}.`,
  ];
  const routes = [
    `Enter through ${first.topic} at ${formatTime(first.at)}, cross ${midpoint.topic} at ${formatTime(midpoint.at)}, and leave through ${last.topic} at ${formatTime(last.at)}.`,
    `The playable spine runs from ${first.topic} at ${formatTime(first.at)} through ${midpoint.topic} at ${formatTime(midpoint.at)} to ${last.topic} at ${formatTime(last.at)}.`,
    `Three clean stops land at ${formatTime(first.at)}, ${formatTime(midpoint.at)}, and ${formatTime(last.at)} for ${first.topic}, ${midpoint.topic}, and ${last.topic}.`,
    `The route opens on ${first.topic} at ${formatTime(first.at)}, turns to ${midpoint.topic} at ${formatTime(midpoint.at)}, and closes on ${last.topic} at ${formatTime(last.at)}.`,
  ];
  return `${openers[openerVariant]} ${routes[routeVariant]} ${boundary}`;
}

function evidenceSummary(source, guideFormat, threads, cuts) {
  const anchored = cuts.filter(
    (cut) => cut.anchor.kind !== "caption-band",
  ).length;
  const topics = [...new Set(cuts.map((cut) => cut.topic))];
  return `${source.id} maps ${cuts.length} cuts and ${threads.length} recurring threads across ${topics.length} canonical topics. ${anchored} displayed cuts begin from a registered topic or public-moment anchor; every cut is re-timestamped to the matching local caption line and capped at ${EXCERPT_WORD_LIMIT} words. ${guideFormat === "ranking" ? "No visual ranking result is asserted." : "No speaker or performer is asserted."}`;
}

function buildEpisodeGuide(source, guideFormat, lines, rightsPolicy) {
  const sourceWithLines = { ...source, captionLines: lines };
  const candidates = canonicalCandidates(sourceWithLines, lines);
  const chosen = selectCandidates(candidates, sourceWithLines, guideFormat);
  const cuts = chosen.map((candidate, index) => {
    const local = localContext(lines, candidate.line.at);
    const excerpt = captionLineExcerpt(
      lines,
      candidate.line,
      candidate.topicEvidence,
      Math.min(
        EXCERPT_WORD_LIMIT,
        Number(rightsPolicy.publicExcerptWordLimit || EXCERPT_WORD_LIMIT),
      ),
    );
    if (!excerpt) {
      throw new Error(
        `${source.id} lost its local topic excerpt at ${candidate.line.at}.`,
      );
    }
    const at = candidate.line.at;
    const end = Math.min(
      Number(source.duration),
      Math.max(at + 1, candidate.line.end),
    );
    const category = formatCategory(guideFormat, candidate, source);
    const record = {
      id: `review-cut-${String(index + 1).padStart(2, "0")}-${at}`,
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
            (candidate.heat || 50) +
              Math.min(20, Number(candidate.topic.cluster || 0) / 2),
          ),
        ),
      ),
      substance: wordCount(excerpt),
      topicSupport: 1,
      topicEvidence: candidate.topicEvidence,
      categorySupport: candidate.momentCategory ? 1 : 0,
      categoryEvidence: candidate.momentCategory || "",
      evidenceBasis: `${candidate.anchorKind}+bounded-local-caption-topic-match`,
      evidence: {
        type: "youtube-automatic-caption",
        captionAt: candidate.line.at,
        localWindowSeconds: LOCAL_WINDOW_SECONDS,
        topicEvidence: candidate.topicEvidence,
        topicLocalityStatus: "exact-displayed-caption-window",
        captionWindowSha256: sha256(normalizedWords(local)),
        reviewState: "machine-surfaced-review-quarantine",
      },
      anchor: {
        kind: candidate.anchorKind,
        at: Math.floor(candidate.anchorAt),
        deltaSeconds: candidate.anchorDeltaSeconds,
        maxAllowedDeltaSeconds:
          candidate.anchorKind === "caption-band"
            ? 0
            : MAX_ANCHOR_DISTANCE_SECONDS,
      },
      promotionAllowed: false,
    };
    return {
      ...record,
      body: cutBody(guideFormat, record, source.id, index),
    };
  });

  const threads = threadRecords(source, guideFormat, cuts);
  const chapters = chapterIndices(cuts).map((cutIndex, index) => {
    const cut = cuts[cutIndex];
    return {
      id: `review-act-${String(index + 1).padStart(2, "0")}`,
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
      promotionAllowed: false,
    };
  });
  const arcPhases = ["OPENING READ", "MIDPOINT TURN", "CLOSING READ"];
  const arcIndexes = [0, Math.floor((cuts.length - 1) / 2), cuts.length - 1];
  const takeArc = arcIndexes.map((cutIndex, index) => {
    const cut = cuts[cutIndex];
    return {
      phase: arcPhases[index],
      label: cut.label,
      at: cut.at,
      end: cut.end,
      body: cut.body,
      excerpt: cut.excerpt,
      category: cut.category,
      cutId: cut.id,
      evidenceBasis: cut.evidenceBasis,
      promotionAllowed: false,
    };
  });

  const recap = {
    status: "machine-draft-review-required",
    label: "WWAM FELDMAN APPROVED RECAP // REVIEW CUT",
    headline: formatRecapHeadline(
      guideFormat,
      threads[0].name,
      (threads[1] || threads[0]).name,
      source.id,
    ),
    dek: `${cuts.length} playable, caption-backed stops trace this exact upload without assigning words to a host.`,
    paragraphs: recapParagraphs(guideFormat, cuts, source.id),
    sourceCutIds: cuts.map((cut) => cut.id),
    promotionAllowed: false,
  };

  const publicCuts = cuts.map((cut) => {
    const copy = { ...cut };
    delete copy.body;
    return copy;
  });
  const lanes = {
    loved: laneCandidate(
      "loved",
      "WHAT THE TAPE MAY BE DEFENDING",
      positiveCut(publicCuts),
    ),
    hated: laneCandidate(
      "hated",
      "STRAIGHT TO STEVE'S ASSHOLE // CANDIDATE",
      negativeCut(publicCuts),
    ),
    upInYa: laneCandidate(
      "up-in-ya",
      "WWAM UP IN YA // CANDIDATE",
      chaosCut(publicCuts),
    ),
    finalIndexedStop: laneCandidate(
      "final-indexed-stop",
      "FINAL INDEXED STOP",
      publicCuts.at(-1),
    ),
  };

  return {
    schema: "wwam-episode-guide/v2",
    variant: "review-batch",
    format: guideFormat,
    sourceContentMode: source.contentMode,
    publicationStatus: "review-quarantined",
    promotionAllowed: false,
    basis:
      "Canonical topics and registered public-moment anchors re-matched to bounded local automatic-caption context; every displayed timestamp is the matching caption line. Speaker, performer, intent, clip origin, visual state, and creator approval remain unverified.",
    overview: guideOverview(source, guideFormat, threads, publicCuts),
    evidenceSummary: evidenceSummary(
      source,
      guideFormat,
      threads,
      publicCuts,
    ),
    shape: {
      runtimeBand:
        Number(source.duration) >= 7200
          ? "MARATHON"
          : Number(source.duration) >= 3600
            ? "FEATURE"
            : "STANDARD",
      chapters: chapters.length,
      threads: threads.length,
      cuts: publicCuts.length,
      recapParagraphs: recap.paragraphs.length,
    },
    recap,
    lanes,
    chapters,
    takeArc,
    threads,
    cuts: publicCuts,
    reviewChecklist: [
      "Confirm in/out points against the official upload.",
      "Confirm host and guest identity before any speaker label is added.",
      "Confirm ranking outcomes from the picture before describing a winner.",
      "Confirm evaluative lanes in full context before promotion.",
      "Keep creator approval separate from machine-surfaced evidence.",
    ],
    metrics: {
      chapters: chapters.length,
      threads: threads.length,
      cuts: publicCuts.length,
      uniqueTopics: new Set(publicCuts.map((cut) => cut.topic)).size,
      anchoredCuts: publicCuts.filter(
        (cut) => cut.anchor.kind !== "caption-band",
      ).length,
      exactLocalityCuts: publicCuts.filter(
        (cut) =>
          cut.at === cut.evidence.captionAt &&
          cut.anchor.deltaSeconds <= cut.anchor.maxAllowedDeltaSeconds,
      ).length,
      evaluationCandidates: [lanes.loved, lanes.hated].filter(Boolean).length,
      comedyCandidates: lanes.upInYa ? 1 : 0,
      praise: lanes.loved ? 1 : 0,
      negative: lanes.hated ? 1 : 0,
      comedy: lanes.upInYa ? 1 : 0,
      substantive: publicCuts.filter((cut) => cut.substance >= 8).length,
      substantiveCuts: publicCuts.filter((cut) => cut.substance >= 8).length,
    },
  };
}

function inventory(rootDir, artifactDefinitions = SOURCE_ARTIFACTS) {
  const records = [];
  const exclusions = [];
  const seen = new Set();
  let scanned = 0;

  for (const definition of artifactDefinitions) {
    const artifactPath = path.join(rootDir, definition.file);
    const artifactRaw = fs.readFileSync(artifactPath);
    const payload = loadWindowAssignment(artifactPath, definition.global);
    for (const source of sourceRecords(payload)) {
      scanned += 1;
      if (seen.has(source.id)) {
        exclusions.push({
          id: source.id,
          title: source.title,
          contentMode: source.contentMode || "unknown",
          sourceArtifact: definition.file,
          reasons: ["duplicate-source-id"],
        });
        continue;
      }
      seen.add(source.id);
      const captionPath = path.join(
        rootDir,
        "source-cache",
        "captions",
        `${source.id}.json`,
      );
      const rightsPolicy = normalizedRightsPolicy(source);
      const reasons = eligibilityReasons(source, rightsPolicy, captionPath);
      if (reasons.length) {
        exclusions.push({
          id: source.id,
          title: source.title,
          contentMode: source.contentMode || "unknown",
          sourceArtifact: definition.file,
          reasons,
        });
        continue;
      }
      const captionRaw = fs.readFileSync(captionPath);
      const lines = parseCaptionLines(JSON.parse(captionRaw.toString("utf8")));
      if (lines.length < 100) {
        exclusions.push({
          id: source.id,
          title: source.title,
          contentMode: source.contentMode || "unknown",
          sourceArtifact: definition.file,
          reasons: ["caption-cache-unexpectedly-thin"],
        });
        continue;
      }
      records.push({
        source,
        guideFormat: classifyGuideFormat(source.contentMode),
        rightsPolicy,
        lines,
        sourceArtifact: definition.file,
        canonicalArtifactSha256: sha256(artifactRaw),
        captionSha256: sha256(captionRaw),
      });
    }
  }
  return { scanned, records, exclusions };
}

function buildGuideRecord(input) {
  const episodeGuide = buildEpisodeGuide(
    input.source,
    input.guideFormat,
    input.lines,
    input.rightsPolicy,
  );
  const record = {
    id: input.source.id,
    title: input.source.title,
    date: input.source.date,
    duration: input.source.duration,
    contentMode: input.source.contentMode,
    guideFormat: input.guideFormat,
    sourceArtifact: input.sourceArtifact,
    sourceState: {
      coverage: "caption-backed",
      evidenceState: "machine-surfaced",
      reviewState: "review-quarantined-unreviewed",
      publicationStatus: "held-for-human-review",
      promotionAllowed: false,
    },
    rightsPolicy: {
      ...input.rightsPolicy,
      promotionAllowed: false,
    },
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
}

function shardFile(format) {
  return `public/demo/episode-guide-v2-review-batch-${format}.js`;
}

function shardGlobal(format) {
  return `WWAM_EPISODE_GUIDE_V2_REVIEW_BATCH_${format
    .replace(/[^a-z0-9]+/gi, "_")
    .toUpperCase()}`;
}

export function buildReviewBatch(options = {}) {
  const rootDir = options.rootDir || PROJECT_ROOT;
  const artifacts = options.artifacts || SOURCE_ARTIFACTS;
  const sourceInventory = inventory(rootDir, artifacts);
  const guides = sourceInventory.records
    .map(buildGuideRecord)
    .sort(
      (left, right) =>
        GUIDE_FORMAT_ORDER.indexOf(left.guideFormat) -
          GUIDE_FORMAT_ORDER.indexOf(right.guideFormat) ||
        String(right.date).localeCompare(String(left.date)) ||
        left.id.localeCompare(right.id),
    );

  const shards = GUIDE_FORMAT_ORDER.map((format) => {
    const records = guides.filter((guide) => guide.guideFormat === format);
    const contentSha256 = sha256(stableJson(records));
    return {
      schema: "wwam-episode-guide-v2-review-shard/v1",
      generated: GENERATED,
      guideFormat: format,
      sourceContentModes: FORMAT_PROFILES[format].supportedContentModes,
      reviewState: "review-quarantined-unreviewed",
      publicationStatus: "held-for-human-review",
      promotionAllowed: false,
      provenance: {
        generator: "scripts/generate-episode-guide-v2-review-batch.mjs",
        method:
          "Deterministic format-aware guide generation from canonical topic/public-moment anchors plus bounded local caption matching.",
        contentSha256,
      },
      meta: {
        guides: records.length,
        chapters: records.reduce(
          (total, record) =>
            total + record.episodeGuide.chapters.length,
          0,
        ),
        cuts: records.reduce(
          (total, record) => total + record.episodeGuide.cuts.length,
          0,
        ),
        recapParagraphs: records.reduce(
          (total, record) =>
            total + record.episodeGuide.recap.paragraphs.length,
          0,
        ),
      },
      guides: records,
    };
  });

  const batchContentSha256 = sha256(
    stableJson({
      guides,
      exclusions: sourceInventory.exclusions,
    }),
  );
  const index = {
    schema: "wwam-episode-guide-v2-review-batch-index/v1",
    generated: GENERATED,
    provenance: {
      generator: "scripts/generate-episode-guide-v2-review-batch.mjs",
      method:
        "Review-quarantined production candidate batch over the four canonical Archive Deep distill slices.",
      contentSha256: batchContentSha256,
    },
    policy: {
      eligibleCoverage: "caption-backed",
      commentaryAllowed: false,
      topicNavigationOnlyAllowed: false,
      publicExcerptWordLimit: EXCERPT_WORD_LIMIT,
      maxAnchorDistanceSeconds: MAX_ANCHOR_DISTANCE_SECONDS,
      localCaptionWindowSeconds: LOCAL_WINDOW_SECONDS,
      speakerAttributionAllowed: false,
      performerAttributionAllowed: false,
      originAttributionAllowed: false,
      visualOutcomeClaimsAllowed: false,
      promotionAllowed: false,
      reviewState: "review-quarantined-unreviewed",
    },
    selection: {
      scannedSources: sourceInventory.scanned,
      eligibleGuides: guides.length,
      excludedSources: sourceInventory.exclusions.length,
      sourceArtifacts: artifacts.map((artifact) => artifact.file),
      guideFormats: Object.fromEntries(
        GUIDE_FORMAT_ORDER.map((format) => [
          format,
          guides.filter((guide) => guide.guideFormat === format).length,
        ]),
      ),
      sourceContentModes: Object.fromEntries(
        [...new Set(guides.map((guide) => guide.contentMode))]
          .sort()
          .map((contentMode) => [
            contentMode,
            guides.filter((guide) => guide.contentMode === contentMode).length,
          ]),
      ),
      guidesWithFullRecapDraft: guides.filter(
        (guide) =>
          guide.episodeGuide.recap.paragraphs.length >= 4,
      ).length,
      totalCuts: guides.reduce(
        (total, guide) => total + guide.episodeGuide.cuts.length,
        0,
      ),
    },
    shards: shards.map((shard) => ({
      guideFormat: shard.guideFormat,
      file: shardFile(shard.guideFormat),
      global: shardGlobal(shard.guideFormat),
      guides: shard.meta.guides,
      chapters: shard.meta.chapters,
      cuts: shard.meta.cuts,
      recapParagraphs: shard.meta.recapParagraphs,
      contentSha256: shard.provenance.contentSha256,
      ids: shard.guides.map((guide) => guide.id),
    })),
    exclusionReport: sourceInventory.exclusions.sort(
      (left, right) =>
        left.sourceArtifact.localeCompare(right.sourceArtifact) ||
        left.id.localeCompare(right.id),
    ),
  };
  return { index, shards };
}

export function renderReviewBatchArtifacts(batch) {
  const artifacts = new Map();
  artifacts.set(
    "public/demo/episode-guide-v2-review-batch-index.js",
    `window.WWAM_EPISODE_GUIDE_V2_REVIEW_BATCH_INDEX = ${JSON.stringify(batch.index)};\n`,
  );
  for (const shard of batch.shards) {
    artifacts.set(
      shardFile(shard.guideFormat),
      `window.${shardGlobal(shard.guideFormat)} = ${JSON.stringify(shard)};\n`,
    );
  }
  return artifacts;
}

function cli() {
  const args = new Set(process.argv.slice(2));
  const batch = buildReviewBatch();
  const artifacts = renderReviewBatchArtifacts(batch);
  if (args.has("--check")) {
    for (const [relativePath, rendered] of artifacts) {
      const outputPath = path.join(PROJECT_ROOT, relativePath);
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Missing generated artifact: ${relativePath}`);
      }
      if (fs.readFileSync(outputPath, "utf8") !== rendered) {
        throw new Error(
          `${relativePath} is stale; run the review-batch generator.`,
        );
      }
    }
    process.stdout.write(
      `Episode Guide V2 review batch is deterministic and current: ${batch.index.selection.eligibleGuides} guides, ${batch.index.selection.totalCuts} cuts, ${batch.index.provenance.contentSha256}\n`,
    );
    return;
  }
  for (const [relativePath, rendered] of artifacts) {
    fs.writeFileSync(path.join(PROJECT_ROOT, relativePath), rendered, "utf8");
  }
  process.stdout.write(
    `Wrote Episode Guide V2 review batch: ${batch.index.selection.eligibleGuides} guides across ${batch.shards.length} shards, ${batch.index.selection.totalCuts} cuts, ${batch.index.provenance.contentSha256}\n`,
  );
}

const directPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (directPath === fileURLToPath(import.meta.url)) {
  cli();
}
