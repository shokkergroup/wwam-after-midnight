import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DEMO = path.join(ROOT, "public", "demo");
const METADATA_DIR = path.join(ROOT, "source-cache", "metadata");
const CAPTIONS_DIR = path.join(ROOT, "source-cache", "captions");
const DISCOVERY_MANIFEST_PATH = path.join(ROOT, "source-cache", "wwam-watchalong-discovery.json");
const PODCAST_AUDIT_PATH = path.join(ROOT, "source-cache", "wwam-podcast-commentary-audit.json");
const EDGE_AUDIT_PATH = path.join(ROOT, "source-cache", "wwam-watchalong-edge-audit.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadBrowserScript(name) {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(PUBLIC_DEMO, name), "utf8"), context, { filename: name });
  return context;
}

const catalogContext = loadBrowserScript("catalog.js");
const deepContext = loadBrowserScript("deep-distill.js");
const guideContext = loadBrowserScript("episode-guides.js");
const atlasContext = loadBrowserScript("archive-atlas-data.js");
const overridesContext = loadBrowserScript("title-topic-overrides.js");
const watchPassContext = loadBrowserScript("wwam-watch-pass-pilot.js");

const catalog = catalogContext.WWAM_CATALOG || [];
const deep = deepContext.WWAM_DEEP_DISTILL || { tapes: [] };
const guides = guideContext.WWAM_EPISODE_GUIDES || { guides: [] };
const atlas = atlasContext.WWAM_ARCHIVE_ATLAS || { records: [] };
const overrides = overridesContext.WWAM_TITLE_TOPIC_OVERRIDES || { topics: [] };
const watchPass = watchPassContext.WWAM_WATCH_PASS_PILOT || { episodes: {} };
const discoveryManifest = fs.existsSync(DISCOVERY_MANIFEST_PATH) ? readJson(DISCOVERY_MANIFEST_PATH) : null;
const podcastAuditData = fs.existsSync(PODCAST_AUDIT_PATH) ? readJson(PODCAST_AUDIT_PATH) : { records: [] };
const podcastFeedRecords = Array.isArray(podcastAuditData.records) ? podcastAuditData.records : [];
const podcastFeedCount = Number(podcastAuditData.titleExplicitFilmCommentaries || podcastFeedRecords.length || 0);
const edgeAuditData = fs.existsSync(EDGE_AUDIT_PATH) ? readJson(EDGE_AUDIT_PATH) : { publicEdgeLeads: 0, captionConfirmed: 0, records: [] };

const metadata = fs.readdirSync(METADATA_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => readJson(path.join(METADATA_DIR, file)));
const metadataById = new Map(metadata.map((record) => [record.id, record]));
const atlasById = new Map((atlas.records || []).map((record) => [record.id, record]));
const deepById = new Map((deep.tapes || []).map((record) => [record.id, record]));
const guideById = new Map((guides.guides || []).map((record) => [record.id, record.episodeGuide || record]));
const overrideById = new Map();
(overrides.topics || []).forEach((topic) => {
  if (!overrideById.has(topic.sourceId)) overrideById.set(topic.sourceId, []);
  overrideById.get(topic.sourceId).push(topic);
});

const catalogById = new Map(catalog.map((record) => [record.id, record]));

// These are the two later, movie-specific live events that were in the public
// source snapshot but outside the original 39-film catalog.
const explicitExtras = new Map([
  ["NjH2tcGvmAY", { franchiseKey: "halloween", franchiseTitle: "Halloween", movieKey: "halloween-1978", movieTitle: "Halloween (1978)", type: "commentary", note: "2019 repeat commentary cut" }],
  ["b5zdTJsgHmw", { franchiseKey: "pet-sematary", franchiseTitle: "Pet Sematary", movieKey: "pet-sematary-1989", movieTitle: "Pet Sematary (1989)", type: "commentary", note: "one-off commentary" }],
  ["Lllp-P-euww", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "childs-play-1988", movieTitle: "Child's Play (1988)", type: "commentary", note: "original Child's Play cut" }],
  ["ei1MrbmBcHA", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "childs-play-2", movieTitle: "Child's Play 2", type: "commentary", note: "sequel commentary" }],
  ["4UWF7ZsZfTY", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "childs-play-3", movieTitle: "Child's Play 3", type: "commentary", note: "third-film commentary" }],
  ["3Lu5KPrQhc8", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "bride-of-chucky", movieTitle: "Bride of Chucky", type: "commentary", note: "Chucky franchise commentary" }],
  ["YegOLKaN5dM", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "seed-of-chucky", movieTitle: "Seed of Chucky", type: "commentary", note: "Chucky franchise commentary" }],
  ["WqXiUhdG2PU", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "curse-of-chucky", movieTitle: "Curse of Chucky", type: "commentary", note: "Chucky franchise commentary" }],
  ["zJtK9KDE-sI", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "cult-of-chucky", movieTitle: "Cult of Chucky", type: "commentary", note: "Chucky franchise commentary" }],
  ["ot91NhcRSdM", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "childs-play-1988", movieTitle: "Child's Play (1988)", type: "watch-along", note: "edited highlight cut from the full live commentary" }],
  ["tGsSV60FmX0", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "cult-of-chucky", movieTitle: "Cult of Chucky", type: "watch-along", note: "edited highlight cut from the full live commentary" }],
  ["xWkQKdVHQKU", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "curse-of-chucky", movieTitle: "Curse of Chucky", type: "watch-along", note: "edited highlight cut from the full live commentary" }],
  ["-jTbmZb2EvE", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "seed-of-chucky", movieTitle: "Seed of Chucky", type: "watch-along", note: "edited highlight cut from the full live commentary" }],
  ["Uz04ygWeetA", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "bride-of-chucky", movieTitle: "Bride of Chucky", type: "watch-along", note: "edited highlight cut from the full live commentary" }],
  ["TyzZ2FbOdGg", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "childs-play-3", movieTitle: "Child's Play 3", type: "watch-along", note: "edited highlight cut from the full live commentary" }],
  ["v4TuS9kqPnM", { franchiseKey: "childs-play", franchiseTitle: "Child's Play / Chucky", movieKey: "childs-play-2", movieTitle: "Child's Play 2", type: "watch-along", note: "edited highlight cut from the full live commentary" }],
  ["9Kql8Y14bAw", { franchiseKey: "uncategorized", franchiseTitle: "Standalone / One-Offs", movieKey: "sinister-2012", movieTitle: "Sinister (2012)", type: "watch-along", note: "Patreon commentary highlight cut" }],
  ["0X8Jq7wxfJo", { franchiseKey: "dc", franchiseTitle: "DC / Batman", movieKey: "the-batman-2022", movieTitle: "The Batman (2022)", type: "watch-along", note: "Patreon commentary highlight cut" }],
  ["BqIiHSqSM_U", { franchiseKey: "uncategorized", franchiseTitle: "Standalone / One-Offs", movieKey: "candyman-1992", movieTitle: "Candyman (1992)", type: "watch-along", note: "Patreon commentary highlight cut" }],
  ["NZprZ1gWBIw", { franchiseKey: "halloween", franchiseTitle: "Halloween", movieKey: "halloween-2018", movieTitle: "Halloween (2018)", type: "watch-along", note: "edited highlight cut from the live commentary" }],
  ["KrBhfGxsJNM", { franchiseKey: "halloween", franchiseTitle: "Halloween", movieKey: "halloween-4", movieTitle: "Halloween 4: The Return of Michael Myers", type: "watch-party", note: "2024 public watch-party repeat" }],
  ["QxJyVaAgZ_Y", { franchiseKey: "friday-the-13th", franchiseTitle: "Friday the 13th", movieKey: "friday-the-13th-part-4", movieTitle: "Friday the 13th: The Final Chapter", type: "watch-along", note: "2024 public watch-along repeat" }]
]);

// The official WWAM podcast feed preserves a handful of full-film commentaries
// that no longer appear in the public YouTube channel snapshot. They are kept
// in a separate, playable evidence lane rather than being given fake YouTube
// IDs or invented timestamps. The RSS title, publication date, enclosure URL,
// and duration are the complete source boundary for this recovery slice.
const podcastOnlyCommentaries = [
  { key: "american-psycho-podcast-2023", title: "AMERICAN PSYCHO Full Movie Commentary", movieTitle: "American Psycho", franchiseKey: "podcast-recovered", franchiseTitle: "Podcast Recovered // Other Films", date: "2023-05-19", duration: 6207, bytes: 99322148, url: "https://traffic.megaphone.fm/APO4628987666.mp3", guid: "5c522702-8d22-4e6a-824f-59b44446d065", note: "Official WWAM podcast-feed commentary; no matching public YouTube upload was found in the live channel snapshot." },
  { key: "wayne-s-world-podcast-2022", title: "Wayne's World Commentary", movieTitle: "Wayne's World", franchiseKey: "podcast-recovered", franchiseTitle: "Podcast Recovered // Other Films", date: "2022-06-16", duration: 5723, bytes: 91576946, url: "https://traffic.megaphone.fm/APO6747829456.mp3", guid: "93e1bba5-3d3d-4ba5-8eab-e627e8e1c808", note: "Official WWAM podcast-feed commentary; comedy watchalong recovered outside the current YouTube canon." },
  { key: "planes-trains-automobiles-podcast-2020", title: "JUST LIKE THE MOVIES - Planes Trains and Automobiles FULL Movie Commentary", movieTitle: "Planes, Trains and Automobiles", franchiseKey: "podcast-recovered", franchiseTitle: "Podcast Recovered // Other Films", date: "2020-11-27", duration: 5734, bytes: 91748728, url: "https://traffic.megaphone.fm/APO7287494031.mp3", guid: "0458f154-9bf6-418a-953d-5a7427ae9167", note: "Official WWAM podcast-feed commentary; the holiday comedy lane is not represented in the current public YouTube canon." },
  { key: "once-upon-a-time-in-hollywood-podcast-2020", title: "Once Upon A Time In Hollywood Full Movie Commentary", movieTitle: "Once Upon a Time in Hollywood", franchiseKey: "podcast-recovered", franchiseTitle: "Podcast Recovered // Other Films", date: "2020-03-06", duration: 9630, bytes: 154084832, url: "https://traffic.megaphone.fm/APO2105851512.mp3", guid: "ac4bb1a2-56be-4ded-a707-92c0f4966422", note: "Official WWAM podcast-feed commentary; a full 2h40m film discussion recovered outside the current YouTube canon." },
  { key: "death-wish-podcast-2018", title: "'Death Wish' Movie Commentary", movieTitle: "Death Wish", franchiseKey: "podcast-recovered", franchiseTitle: "Podcast Recovered // Other Films", date: "2018-12-13", duration: 3829, bytes: 61273234, url: "https://traffic.megaphone.fm/APO2045620215.mp3", guid: "3866e446-7c07-49ba-ad6c-8a2cea88e1d2", note: "Official WWAM podcast-feed commentary; an early non-horror/action title missed by the live YouTube audit." },
  { key: "predator-1987-podcast-2018", title: "Predator (1987) COMMENTARY", movieTitle: "Predator (1987)", franchiseKey: "podcast-recovered", franchiseTitle: "Podcast Recovered // Other Films", date: "2018-11-12", duration: 6857, bytes: 109713867, url: "https://traffic.megaphone.fm/APO7781268085.mp3", guid: "e5055d90-8fc0-4142-9c87-2d10bc02b129", note: "Official WWAM podcast-feed commentary; the action/sci-fi lane is not present in the current public YouTube canon." }
].map((record) => ({
  ...record,
  sourceKind: "official-wwam-podcast",
  status: "recovered-audio-lead",
  sourceUrl: record.url,
  timestampPolicy: "No YouTube timestamp is manufactured. Any future listening notes must remain bound to this podcast audio file.",
  evidence: { type: "official-wwam-podcast-rss", titleExplicit: true, enclosureBytes: record.bytes, guid: record.guid, durationSeconds: record.duration, publicPlayback: true }
}));

const includedIds = new Set(catalog.map((record) => record.id));
metadata.forEach((record) => {
  // The public canon must not silently promote member-only uploads. They
  // remain visible in the discovery audit as held leads until access changes.
  if (record.availability !== "subscriber_only" && /commentary|watch\s*party|watch\s*along|full\s+movie|^\s*we\s+watched\s+(?!a\s+movie(?:\b|'s))(?!.{0,80}\bpodcast\b)(?!.*[,]\s)|^\s*let(?:'|’)?s\s+watch\s+(?!a\s+movie\b)(?!.*\b(?:live|scary\s+videos?|part\s+\d+|together)\b).+/i.test(record.title)) {
    includedIds.add(record.id);
  }
});
explicitExtras.forEach((_value, id) => includedIds.add(id));

function clean(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function slug(value) {
  return clean(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function words(value) {
  return clean(value).split(/\s+/).filter(Boolean);
}

function excerpt(value, limit = 16) {
  const text = clean(value).replace(/\s*\n\s*/g, " ");
  const tokens = words(text);
  return tokens.length <= limit ? tokens.join(" ") : `${tokens.slice(0, limit).join(" ")}...`;
}

function normalizeCaptionText(value) {
  return clean(value)
    .replace(/\[(?:\s*[_-]+\s*)+\]/g, " ")
    .replace(/\[(?:music|applause|laughter|inaudible|bleep)\]/gi, " ")
    .replace(/[_]+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function dateFrom(value) {
  const text = clean(value);
  if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  return text || null;
}

function formatTimestamp(seconds) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function captionEvents(id) {
  const captionFile = path.join(CAPTIONS_DIR, `${id}.json`);
  if (fs.existsSync(captionFile)) {
    const payload = readJson(captionFile);
    return (payload.events || []).filter((event) => Array.isArray(event.segs) && event.segs.length)
      .map((event) => ({
        t: Math.max(0, Number(event.tStartMs || 0) / 1000),
        end: Math.max(0, Number(event.tStartMs || 0) / 1000 + Number(event.dDurationMs || 0) / 1000),
        text: normalizeCaptionText(event.segs.map((segment) => segment && segment.utf8 || "").join("")),
        evidenceType: "youtube-automatic-caption"
      }))
      .filter((event) => event.text);
  }
  const asrFile = path.join(CAPTIONS_DIR, `${id}.asr.json`);
  if (!fs.existsSync(asrFile)) return [];
  const payload = readJson(asrFile);
  return (payload.segments || []).map((segment) => ({
    t: Math.max(0, Number(segment.start || 0)),
    end: Math.max(0, Number(segment.end || segment.start || 0)),
    text: normalizeCaptionText(segment.text),
    evidenceType: "local-whisper-transcript"
  })).filter((event) => event.text);
}

function captionSourceKind(id) {
  if (fs.existsSync(path.join(CAPTIONS_DIR, `${id}.json`))) return "youtube-automatic-caption";
  if (fs.existsSync(path.join(CAPTIONS_DIR, `${id}.asr.json`))) return "local-whisper-transcript";
  return null;
}

function captionWindow(events, index, before = 5, after = 10) {
  const anchor = events[index];
  if (!anchor) return "";
  const start = Math.max(0, index - 3);
  const end = Math.min(events.length - 1, index + 4);
  const lines = [];
  for (let cursor = start; cursor <= end; cursor += 1) {
    const event = events[cursor];
    if (event.t < anchor.t - before || event.t > anchor.t + after) continue;
    if (lines.length && event.t - events[cursor - 1].t > 5) continue;
    lines.push(event.text);
  }
  const deduped = [];
  lines.join(" ").split(/\s+/).forEach((token) => {
    if (!token) return;
    if (deduped.length && deduped[deduped.length - 1].toLowerCase() === token.toLowerCase()) return;
    deduped.push(token);
  });
  return deduped.join(" ");
}

function ledgerLaneCounts(items) {
  return items.reduce((counts, item) => {
    const key = clean(item.category || item.label || "SOURCE RECEIPT");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function ledgerFanRead(items, finalMoment) {
  const byCategory = new Map();
  items.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0)).forEach((item) => {
    const category = clean(item.category || item.label);
    if (category && !byCategory.has(category)) byCategory.set(category, item);
  });
  const lane = (category, label) => {
    const item = byCategory.get(category);
    return item ? { label, at: item.t, topic: item.category || category, body: `The caption ledger flags this as a ${label.toLowerCase()} lead: ${item.excerpt || "open the source jump for the full exchange."}` } : null;
  };
  return {
    loved: lane("FILM READ", "FILM READ"),
    hated: lane("STRAIGHT TO STEVE'S ASSHOLE", "STRAIGHT TO STEVE'S ASSHOLE"),
    wildestDetour: lane("UP IN YA", "WWAM UP IN YA"),
    lastWord: finalMoment ? { label: "LAST WORD", at: finalMoment.t, topic: finalMoment.category || "CLOSING READ", body: `The last indexed receipt lands here: ${finalMoment.excerpt || "open the source jump and hear where the show leaves you."}` } : null
  };
}

function fanSignalCandidates(events, duration) {
  if (!events.length) return [];
    const isFanSignal = (text) => /super\s*chat|\bdonat(?:e|ed|ion)\b|lee(?:\s+the)?\s+machine|michael\s+part(?:on|in)|chat(?:'s| is) asking|question from (?:the )?chat|(?:thanks|welcome|appreciate|thank you).{0,45}(?:member|membership)|(?:new|another|our) member|(?:member|membership).{0,45}(?:joined|join|thanks|thank|gift)/i.test(text);
  const ranked = events.map((event, index) => {
    if (!isFanSignal(event.text)) return null;
    const explicit = /super\s*chat|\bdonat(?:e|ed|ion)\b|lee(?:\s+the)?\s+machine|michael\s+part(?:on|in)/i.test(event.text) ? 1 : 0;
    return { event, index, score: Math.min(99, 62 + (explicit * 18) + Math.min(12, words(event.text).length)) };
  }).filter(Boolean).sort((left, right) => right.score - left.score || left.event.t - right.event.t);
  const maxSignals = Math.max(3, Math.min(14, Math.round((duration || 1) / 1800) + 2));
  const picked = [];
  ranked.forEach((candidate) => {
    if (picked.length >= maxSignals) return;
    if (picked.some((item) => Math.abs(item.event.t - candidate.event.t) < 55)) return;
    picked.push(candidate);
  });
  return picked.sort((left, right) => left.event.t - right.event.t).map((candidate) => ({
    id: `fan-signal-${Math.round(candidate.event.t)}`,
    t: Math.round(candidate.event.t),
    end: Math.round(candidate.event.end || candidate.event.t + 36),
    category: "FAN SIGNAL",
    label: "FAN SIGNAL",
    score: candidate.score,
    excerpt: excerpt(captionWindow(events, candidate.index), 24),
    evidenceBasis: "source-local automatic caption fan-callout cluster",
    reviewStatus: "machine-candidate"
  }));
}

function regexHits(text, pattern) {
  const matches = clean(text).toLowerCase().match(pattern);
  return matches ? matches.length : 0;
}

function topicAnchor(events, terms) {
  const patterns = terms.filter(Boolean).map((term) => {
    const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped.replace(/\s+/g, "\\s+")}\\b`, "i");
  });
  const hits = events.map((event) => ({ event, hits: patterns.reduce((sum, pattern) => sum + (pattern.test(event.text) ? 1 : 0), 0) }))
    .filter((entry) => entry.hits > 0);
  if (!hits.length) return null;
  const peak = hits.slice().sort((left, right) => right.hits - left.hits || left.event.t - right.event.t)[0];
  return { mentions: hits.reduce((sum, item) => sum + item.hits, 0), first: hits[0].event.t, peak: peak.event.t, cluster: Math.min(24, hits.length), receipt: excerpt(peak.event.text) };
}

const LANE_DEFS = [
  { key: "up-in-ya", label: "WWAM UP IN YA", category: "UP IN YA", pattern: /\b(fuck|fucking|dick|cock|balls?|cum|fart|shit|bitch|piss|boob|tits?|asshole|suck|boner)\b/i },
  { key: "steves-asshole", label: "STRAIGHT TO STEVE'S ASSHOLE", category: "STRAIGHT TO STEVE'S ASSHOLE", pattern: /\b(hate|hated|worst|terrible|awful|sucks?|stupid|dumb|bullshit|garbage|lazy|weak|ruined|don't like|didn't like|not good)\b/i },
  { key: "film-read", label: "FILM READ", category: "FILM READ", pattern: /\b(love|best|great|amazing|music|score|camera|director|actor|acting|scene|ending|character|story|plot|performance)\b/i },
  { key: "character-signal", label: "CHARACTER SIGNAL", category: "CHARACTER SIGNAL", pattern: /\b(loomis|chall[ie]s|slenderman|corey feldman|feldman|michael myers|michael|freddy|jason|chucky|tiffany)\b/i },
  { key: "fan-signal", label: "FAN SIGNAL", category: "FAN SIGNAL", pattern: /super ?chat|\bdonat(?:e|ed|ion)\b|lee(?:\s+the)?\s+machine|michael\s+part(?:on|in)|chat(?:'s| is) asking|question from (?:the )?chat|(?:thanks|welcome|appreciate|thank you).{0,45}(?:member|membership)|(?:new|another|our) member|(?:member|membership).{0,45}(?:joined|join|thanks|thank|gift)/i }
];

function candidateMoments(events, duration, aliases) {
  if (!events.length) return { moments: [], topics: [], chapters: [], captionWords: 0, captionEvents: 0 };
  const candidates = [];
  const seenByLane = new Map();
  const dynamicPerLane = Math.max(3, Math.min(9, Math.round((duration || 1) / 1800)));
  LANE_DEFS.forEach((lane) => {
    const ranked = events.map((event, index) => {
      const hits = regexHits(event.text, lane.pattern);
      if (!hits) return null;
      const subjectHits = aliases.reduce((sum, alias) => sum + regexHits(event.text, new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")), 0);
      const score = Math.min(99, 54 + hits * 10 + Math.min(25, subjectHits * 6) + Math.min(10, words(event.text).length));
      return { event, index, hits, score };
    }).filter(Boolean).sort((left, right) => right.score - left.score || left.event.t - right.event.t);
    const picked = [];
    ranked.forEach((candidate) => {
      if (picked.length >= dynamicPerLane) return;
      if (picked.some((item) => Math.abs(item.event.t - candidate.event.t) < 45)) return;
      picked.push(candidate);
    });
    seenByLane.set(lane.key, picked);
    picked.forEach((candidate) => candidates.push({
      id: `${lane.key}-${Math.round(candidate.event.t)}`,
      t: Math.round(candidate.event.t),
      end: Math.round(candidate.event.end || candidate.event.t + 36),
      category: lane.category,
      label: lane.label,
      score: candidate.score,
      excerpt: excerpt(captionWindow(events, candidate.index), 22),
      evidenceBasis: "source-local automatic caption keyword cluster",
      reviewStatus: "machine-candidate"
    }));
  });

  // Route checkpoints are derived from the same title/franchise terms used by the topic ledger.
  const routeTimes = [0, Math.round((duration || events.at(-1).end) * 0.33), Math.round((duration || events.at(-1).end) * 0.66), Math.round((duration || events.at(-1).end) * 0.9)];
  routeTimes.forEach((time, index) => {
    const nearest = events.slice().sort((left, right) => Math.abs(left.t - time) - Math.abs(right.t - time))[0];
    if (!nearest || candidates.some((item) => Math.abs(item.t - nearest.t) < 45)) return;
    candidates.push({
      id: `route-${index + 1}-${Math.round(nearest.t)}`,
      t: Math.round(nearest.t),
      end: Math.round(nearest.end || nearest.t + 36),
      category: index === 0 ? "OPENING READ" : index === 3 ? "CLOSING READ" : "WATCH ROUTE",
      label: index === 0 ? "OPENING READ" : index === 3 ? "CLOSING READ" : "WATCH ROUTE",
      score: 62,
      excerpt: excerpt(captionWindow(events, events.indexOf(nearest)), 22),
      evidenceBasis: "source-local caption route checkpoint",
      reviewStatus: "machine-candidate"
    });
  });
  candidates.sort((left, right) => left.t - right.t);
  const topicTerms = [...new Set([...aliases, "Halloween", "Scream", "Friday the 13th", "A Nightmare on Elm Street", "Child's Play", "Chucky", "Pet Sematary"])]
    .map((term) => ({ name: term, data: topicAnchor(events, [term]) }))
    .filter((item) => item.data)
    .sort((left, right) => right.data.mentions - left.data.mentions)
    .slice(0, 10)
    .map((item) => ({ name: item.name, ...item.data, evidence: { type: events[0]?.evidenceType || "source-local-transcript", timestampStatus: "caption-event", excerptStatus: "short-caption-fragment", speakerStatus: "not-diarized", reviewStatus: "machine-candidate" } }));
  const contextualCandidates = candidates.map((candidate) => {
    const generic = /^(?:WWAM UP IN YA|UP IN YA|STRAIGHT TO STEVE'S ASSHOLE|FILM READ|CHARACTER SIGNAL|FAN SIGNAL|OPENING READ|CLOSING READ|WATCH ROUTE)$/i.test(candidate.label || "");
    if (!generic) return candidate;
    const hintTerms = [...new Set([
      ...topicTerms.map((topic) => topic.name),
      "Michael Myers", "Ghostface", "Jason", "Freddy", "Chucky", "Tiffany",
      "Dr. Loomis", "Dr. Challis", "Slenderman", "Corey Feldman",
    ])].sort((left, right) => right.length - left.length);
    const excerptText = clean(candidate.excerpt);
    const excerptSubject = hintTerms.find((term) => new RegExp(
      `\\b${term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&").replace(/\\s+/g, "\\\\s+")}\\b`, "i"
    ).test(excerptText));
    const nearest = topicTerms.slice().sort((left, right) =>
      Math.abs(Number(left.at || left.peak || left.first || 0) - candidate.t) -
      Math.abs(Number(right.at || right.peak || right.first || 0) - candidate.t) ||
      Number(right.mentions || 0) - Number(left.mentions || 0)
    )[0];
    const subject = excerptSubject || nearest?.name || aliases[0] || "SOURCE CHECKPOINT";
    return { ...candidate, label: `${candidate.label} // ${subject}` };
  });
  const chapters = [0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
    const at = Math.round((duration || events.at(-1).end) * index / 8);
    const nearest = contextualCandidates.slice().sort((left, right) => Math.abs(left.t - at) - Math.abs(right.t - at))[0];
    return nearest ? { id: `act-${String(index + 1).padStart(2, "0")}`, act: index + 1, label: `${nearest.label} // ${nearest.category}`, at: nearest.t, end: nearest.end, body: `The source-local caption ledger puts ${nearest.label.toLowerCase()} at ${formatTimestamp(nearest.t)}. The jump is a machine candidate; open the tape before treating the line as a final read.`, excerpt: nearest.excerpt, category: nearest.category, cutId: nearest.id, evidenceBasis: nearest.evidenceBasis } : null;
  }).filter(Boolean);
  return { moments: contextualCandidates, topics: topicTerms, chapters, captionWords: words(events.map((event) => event.text).join(" ")).length, captionEvents: events.length };
}

function titleDerivedTaxonomy(title) {
  const source = clean(title);
  const normalized = source
    .replace(/^\s*we\s+watched\b/gi, " ")
    .replace(/\b(first\s+time\s+watch|reaction|live\s+commentary|full\s+video|full\s+movie|full|movie|video|audio|commentary|watch\s*(?:along|party)|on\s+riff\.?tv|w\/\s*video)\b/gi, " ")
    .replace(/[!]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+[-|:]\s*$/, "") || source;
  // “Freddy Got Fingered” is a Tom Green comedy, not a Nightmare on Elm Street entry.
  // Keep the title-driven family matcher from treating the actor's first name as franchise evidence.
  if (/freddy\s+got\s+fingered/i.test(source)) {
    return { franchiseKey: "comedy", franchiseTitle: "Comedy / Cult", movieKey: slug(normalized), movieTitle: normalized };
  }
  const families = [
    [/hellraiser/i, "hellraiser", "Hellraiser"],
    [/halloween/i, "halloween", "Halloween"],
    [/friday\s+the\s+13th|jason/i, "friday-the-13th", "Friday the 13th"],
    [/nightmare\s+on\s+elm|freddy/i, "a-nightmare-on-elm-street", "A Nightmare on Elm Street"],
    [/scream/i, "scream", "Scream"],
    [/child.?s\s+play|chucky/i, "childs-play", "Child's Play / Chucky"],
    [/batman|superman|justice\s+league|dark\s+knight/i, "dc", "DC / Batman"],
    [/terminator/i, "terminator", "Terminator"],
    [/mortal\s+kombat/i, "mortal-kombat", "Mortal Kombat"],
    [/saved\s+by\s+the\s+bell/i, "saved-by-the-bell", "Saved by the Bell"],
    [/rambo/i, "rambo", "Rambo"],
  ];
  const family = families.find(([pattern]) => pattern.test(source));
  if (family) return { franchiseKey: family[1], franchiseTitle: family[2], movieKey: slug(normalized), movieTitle: normalized };
  return { franchiseKey: "uncategorized", franchiseTitle: "Standalone / One-Offs", movieKey: slug(normalized), movieTitle: normalized };
}

function fallbackTaxonomy(id, metadataRecord, catalogRecord) {
  if (catalogRecord) {
    const canonicalFilm = id === "28PfRNKoSCA" ? { key: "halloween-4", title: "Halloween 4: The Return of Michael Myers" } :
      id === "kTJXSHz9BXw" ? { key: "friday-the-13th-part-4", title: "Friday the 13th: The Final Chapter" } :
        { key: slug(catalogRecord.film), title: catalogRecord.film };
    return {
      franchiseKey: slug(catalogRecord.franchise), franchiseTitle: catalogRecord.franchise,
      movieKey: canonicalFilm.key, movieTitle: canonicalFilm.title, type: "commentary", note: "original curated commentary"
    };
  }
  if (explicitExtras.has(id)) return explicitExtras.get(id);
  return { ...titleDerivedTaxonomy(metadataRecord.title), type: "source-watchalong", note: "title-derived public source record" };
}

function episodeFrom(id) {
  const catalogRecord = catalogById.get(id);
  const metadataRecord = metadataById.get(id) || (catalogRecord ? {
    id,
    title: catalogRecord.title,
    upload_date: String(catalogRecord.date || "").replace(/-/g, ""),
    duration: catalogRecord.duration,
    view_count: catalogRecord.views,
    channel: "WeWatchedAMovie",
    channel_id: "UC6ieEOZW4iXV8TcILJI8k5g",
    thumbnail: catalogRecord.thumbnail,
    caption_url: null
  } : null);
  if (!metadataRecord) throw new Error(`No source-cache metadata for ${id}`);
  const taxonomy = fallbackTaxonomy(id, metadataRecord, catalogRecord);
  const deepRecord = deepById.get(id);
  const guide = guideById.get(id);
  const atlasRecord = atlasById.get(id);
  const date = dateFrom(metadataRecord.upload_date || catalogRecord?.date);
  const duration = Number(metadataRecord.duration || catalogRecord?.duration || 0);
  const events = captionEvents(id);
  const sourceKind = captionSourceKind(id);
  const evidenceLabel = sourceKind === "local-whisper-transcript" ? "local Whisper audio transcript" : "local caption ledger";
  const captionSourceFile = sourceKind === "local-whisper-transcript" ? `source-cache/captions/${id}.asr.json` : `source-cache/captions/${id}.json`;
  const aliases = [taxonomy.movieTitle, taxonomy.franchiseTitle, taxonomy.movieTitle.replace(/\s*\([^)]*\)/g, "")].filter(Boolean);
  // A deep record without a matching human guide is still useful when the local
  // caption ledger can provide bounded route receipts. Keep the evidence state
  // honest, but do not leave the episode as an empty shell.
  const derived = (!deepRecord || !guide) ? candidateMoments(events, duration, aliases) : null;
  const sourceTopics = (overrideById.get(id) || []).map((topic) => ({ name: topic.label, first: topic.firstAt, peak: topic.peakAt, mentions: topic.mentions, receipt: excerpt(topic.excerpt), evidenceBasis: topic.evidenceBasis }));
  const guideCuts = guide?.cuts || [];
  const moments = deepRecord && guide ? (deepRecord.moments || []).map((moment) => ({ ...moment, t: Number(moment.t || 0), end: Number(moment.end || moment.t || 0), excerpt: excerpt(moment.quote || moment.excerpt), reviewStatus: "distilled-editorial-candidate" })) : derived.moments;
  const chapters = deepRecord && guide ? (guide?.chapters || []).map((chapter) => ({ ...chapter, excerpt: excerpt(chapter.excerpt), body: clean(chapter.body) })) : derived.chapters;
  const filmTitleLower = clean(taxonomy.movieTitle).toLowerCase();
  const filmTitleTokens = filmTitleLower.split(/\s+/).filter((token) => token.length >= 4 && !["this", "that", "the", "with", "from", "full", "movie"].includes(token));
  const derivedTopicDoors = (derived?.topics || []).filter((topic) => {
    const name = clean(topic.name).toLowerCase();
    const mentions = Number(topic.mentions || 0);
    const titleHit = name.length >= 4 && (filmTitleLower.includes(name) || filmTitleTokens.some((token) => name === token || name.includes(token)));
    return mentions >= 2 || titleHit;
  });
  const topics = deepRecord && guide ? (guide?.threads || []).slice(0, 10).map((thread) => ({ name: thread.name, mentions: thread.mentions, first: thread.first, peak: thread.peak, cluster: thread.cluster, receipt: excerpt(thread.receipt), kind: thread.kind })) : (sourceTopics.length ? sourceTopics : derivedTopicDoors);
  const watchPassRecord = watchPass.episodes?.[id] || null;
  const audioCandidates = watchPassRecord && watchPassRecord.status === "audio-feature-pilot"
    ? (watchPassRecord.candidates || [])
    : [];
  const audioCuts = audioCandidates.map((candidate, index) => {
      const at = Number(candidate.t || 0);
      const nearestTopic = topics.slice().sort((left, right) =>
        Math.abs(Number(left.peak || left.first || 0) - at) -
        Math.abs(Number(right.peak || right.first || 0) - at) ||
        Number(right.mentions || 0) - Number(left.mentions || 0)
      )[0];
      const category = clean(candidate.category || candidate.label || "AUDIO RECEIPT");
      const subject = clean(nearestTopic?.name || "SOURCE CHECKPOINT");
      const captionExcerpt = excerpt(normalizeCaptionText(candidate.captionExcerpt || ""), 22);
      return {
        id: `audio-${Math.round(at)}-${index + 1}`,
        t: Math.round(at),
        end: Math.round(Number(candidate.end || at + 8)),
        category,
        label: `${category} // ${subject}`,
        score: Number(candidate.score || 0),
        excerpt: captionExcerpt || "No caption fragment aligned; open the source and listen to this acoustic window.",
        captionAligned: Boolean(captionExcerpt),
        topic: nearestTopic?.name || null,
        audioRank: Number(candidate.rank || index + 1),
        audio: candidate.audio || null,
        evidenceBasis: "canonical YouTube audio + source-local caption alignment",
        reviewStatus: "audio-feature-candidate; playback remains the authority"
      };
    }).filter((candidate) => candidate.excerpt || candidate.t >= 0);
  const editorialMoments = deepRecord && guide ? guideCuts.map((cut) => ({
    id: cut.id, t: Number(cut.t || 0), end: Number(cut.end || cut.t || 0), category: cut.category, label: cut.label || cut.category,
    score: Number(cut.score || 0), excerpt: excerpt(cut.excerpt), topic: cut.topic || null, evidenceBasis: cut.evidenceBasis || "reviewed-guide-cut", reviewStatus: "distilled-editorial-candidate"
  })) : moments;
  const allMoments = editorialMoments.concat(audioCuts.filter((candidate) => !editorialMoments.some((moment) =>
    Math.abs(Number(moment.t || 0) - candidate.t) <= 18
  )));
  const firstMoment = allMoments.slice().sort((left, right) => left.t - right.t)[0] || null;
  const strongestMoment = allMoments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
  const finalMoment = allMoments.slice().sort((left, right) => right.t - left.t)[0] || null;
  const laneCounts = ledgerLaneCounts(allMoments);
  const fanSignals = fanSignalCandidates(events, duration);
  const lanePhrase = Object.entries(laneCounts).sort((left, right) => right[1] - left[1]).slice(0, 3).map(([label, count]) => `${label} (${count})`).join(", ");
  const topicPhrase = topics.slice(0, 5).map((topic) => topic.name).filter((name) => name && !/watch\s*party|commentary|watch\s*along/i.test(name)).slice(0, 3).join(", ");
  const leadLine = strongestMoment
    ? `The cleanest way in is ${formatTimestamp(strongestMoment.t)}, where the map tags a ${strongestMoment.category || "source"} lead.`
    : "No single lead is promoted above the rest.";
  const topicLine = topicPhrase ? `The indexed doors hit ${topicPhrase}; use them as jump points, not a claim that the whole conversation stays on those subjects.` : "The map stays close to the film without promoting a side-topic label.";
  const audioLine = audioCuts.length
    ? ` An audio-feature pass adds ${audioCuts.length} ranked intensity routes; it re-ranks caption windows but does not prove a joke, speaker, or visual reaction.`
    : "";
  const topLane = Object.entries(laneCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || "SOURCE RECEIPT";
  const roomTone = topLane === "ROOM BREAK"
    ? "a room that keeps losing its composure"
    : topLane === "TAKE GETS NUCLEAR"
      ? "an argument with a movie playing underneath it"
      : topLane === "STRAIGHT TO STEVE'S ASSHOLE"
        ? "a particularly hostile little courtroom"
        : topLane === "WWAM UP IN YA"
          ? "a chaotic out-of-pocket reel"
          : topLane === "CHARACTER SIGNAL"
            ? "a bit-heavy performance room"
            : "a film-first conversation with sharp detours";
  const laneSentence = lanePhrase ? `The loudest lanes are ${lanePhrase}.` : "The route mix stays intentionally modest.";
  const topicSentence = topicPhrase
    ? `The reliable topic doors are ${topicPhrase}; they are jump points into the tape, not a claim that every minute stays there.`
    : "The source stays close to the film without promoting a noisy side-topic label.";
  const openingStop = firstMoment ? `${formatTimestamp(firstMoment.t)} (${firstMoment.category || "SOURCE RECEIPT"})` : "the opening of the source";
  const closingStop = finalMoment ? `${formatTimestamp(finalMoment.t)} (${finalMoment.category || "SOURCE RECEIPT"})` : "the final stretch";
  const strongestStop = strongestMoment ? `${formatTimestamp(strongestMoment.t)} (${strongestMoment.category || "SOURCE RECEIPT"})` : "the strongest indexed route";
  const derivedSummary = `${taxonomy.type === "watch-party" ? "This watch-party" : "This commentary"} for ${taxonomy.movieTitle} runs ${formatTimestamp(duration)} and feels like ${roomTone}. ${laneSentence} The ledger leaves ${allMoments.length} bounded jump points, with the strongest route at ${strongestStop}. ${topicSentence} For a compact run, start at ${openingStop}, then finish at ${closingStop}.${audioLine} These are navigation receipts rather than speaker-diarized certainty; press play before treating a caption as canon.`;
  const alternateRouteCount = Number(watchPassRecord?.alternateAudio?.candidates?.length || 0);
  const summary = guide?.overview || (!events.length && !deepRecord
    ? (alternateRouteCount
      ? `This source brief preserves the official upload for ${taxonomy.movieTitle}, which is currently held for unauthenticated YouTube playback. The official WWAM podcast variant remains playable with ${alternateRouteCount} bounded audio routes in its own source-local clock; those routes are not pasted onto YouTube.`
      : `This source brief preserves the official upload for ${taxonomy.movieTitle}, but no local caption map was available in this observation. The source remains playable; no timestamps or speaker claims are manufactured.`)
    : (deepRecord && !guide
      ? (alternateRouteCount
        ? `This catalog entry is held as a source brief for ${taxonomy.movieTitle}. The canonical YouTube source is currently held, while the official podcast variant contributes ${alternateRouteCount} audio-bound routes on its own clock; no YouTube timestamp is manufactured.`
        : `This catalog entry is held as a source brief for ${taxonomy.movieTitle}. The public upload and its archived editorial note are preserved, while the local caption ledger contributes ${allMoments.length} machine-found route receipts. Press play before treating any line as a reviewed quote.`)
      : deepRecord?.verdict || derivedSummary));
  const evidenceSummary = guide?.evidenceSummary
    ? `${guide.evidenceSummary}${audioCuts.length ? ` The audio-feature pass contributes ${audioCuts.length} ranked routes; those acoustic windows are browse aids, not speaker or joke proof.` : ""}`
    : `The source ledger contains ${events.length.toLocaleString("en-US")} ${sourceKind === "local-whisper-transcript" ? "audio transcript segments" : "caption events"} and ${(deepRecord?.wordsAudited || derived?.captionWords || 0).toLocaleString("en-US")} words.${audioCuts.length ? ` The audio-feature pass contributes ${audioCuts.length} ranked routes.` : ""}${alternateRouteCount ? ` The official podcast variant contributes ${alternateRouteCount} audio-bound routes on its own clock; no YouTube mapping is claimed.` : ""} These timestamps are machine-found leads, not speaker-diarized quotes; press play before treating a line as canon.`;
  const dossier = {
    state: deepRecord && guide ? "full-editorial-dossier" : deepRecord || !events.length ? "source-brief-dossier" : "caption-ledger-dossier",
    summary: clean(summary),
    evidenceSummary,
    shape: guide?.shape ? { ...guide.shape, cuts: allMoments.length } : { runtimeBand: duration >= 9000 ? "MARATHON" : duration >= 5400 ? "FEATURE" : "SHORT", chapters: chapters.length, threads: topics.length, cuts: allMoments.length },
    fanRead: guide?.fanRead || (deepRecord ? null : ledgerFanRead(allMoments, finalMoment)),
    fanSignals,
    laneCounts,
    chapters,
    cuts: allMoments,
    route: { opening: firstMoment, strongest: strongestMoment, closing: finalMoment },
    caption: { words: deepRecord?.wordsAudited || derived?.captionWords || 0, events: events.length, minutes: deepRecord?.captionMinutes || Math.round(duration / 60), sourceFile: captionSourceFile, sourceKind }
  };
  return {
    id, title: clean(metadataRecord.title), date, duration, durationLabel: formatTimestamp(duration), views: Number(metadataRecord.view_count || 0),
    thumbnail: metadataRecord.thumbnail || catalogRecord?.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`, channel: metadataRecord.channel || "WeWatchedAMovie", channelId: metadataRecord.channel_id || null,
    publicSource: metadataRecord.availability !== "subscriber_only", publicSourceBasis: `official cached YouTube metadata + ${sourceKind === "local-whisper-transcript" ? "local audio transcript" : "local caption file"}`, availability: metadataRecord.availability || atlasRecord?.availability || "public-source-snapshot",
    sourceAvailability: metadataRecord.availability || null,
    atlasCoverage: atlasRecord?.coverage || (deepRecord ? "catalog-distilled" : "caption-backed-local"), lanes: atlasRecord?.lanes || [],
    type: taxonomy.type, note: taxonomy.note, repeat: !catalogRecord, catalogMember: Boolean(catalogRecord), catalogOrder: catalogRecord?.order || null,
    franchiseKey: taxonomy.franchiseKey, franchiseTitle: taxonomy.franchiseTitle, movieKey: taxonomy.movieKey, movieTitle: taxonomy.movieTitle,
    aliases, transcript: Boolean(events.length || deepRecord?.wordsAudited), captioned: Boolean(events.length || deepRecord?.wordsAudited), deepIndexed: Boolean(deepRecord),
    topics, sourceTopics, dossier, metrics: deepRecord?.metrics || null, unhinged: deepRecord?.unhinged || null, verdict: deepRecord?.verdict || null,
    watchPass: watchPassRecord,
    editorial: deepRecord?.arc ? { arc: deepRecord.arc, moments: allMoments } : { arc: chapters.map((chapter) => ({ chapter: chapter.act, at: chapter.at, dominant: chapter.category })), moments: allMoments }
  };
}

const episodes = Array.from(includedIds).map(episodeFrom)
  .sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title));

const groupsByKey = new Map();
episodes.forEach((episode) => {
  if (!groupsByKey.has(episode.movieKey)) groupsByKey.set(episode.movieKey, {
    key: episode.movieKey, title: episode.movieTitle, franchiseKey: episode.franchiseKey, franchiseTitle: episode.franchiseTitle,
    episodeIds: [], firstDate: episode.date, lastDate: episode.date, totalDuration: 0, cover: episode.thumbnail
  });
  const group = groupsByKey.get(episode.movieKey);
  group.episodeIds.push(episode.id); group.firstDate = group.firstDate < episode.date ? group.firstDate : episode.date; group.lastDate = group.lastDate > episode.date ? group.lastDate : episode.date; group.totalDuration += episode.duration;
});
const groups = Array.from(groupsByKey.values()).map((group) => ({ ...group, count: group.episodeIds.length, repeatCount: Math.max(0, group.episodeIds.length - 1) }));
const franchisesByKey = new Map();
groups.forEach((group) => {
  if (!franchisesByKey.has(group.franchiseKey)) franchisesByKey.set(group.franchiseKey, { key: group.franchiseKey, title: group.franchiseTitle, groupKeys: [], episodeIds: [], firstDate: group.firstDate, lastDate: group.lastDate, totalDuration: 0 });
  const franchise = franchisesByKey.get(group.franchiseKey);
  franchise.groupKeys.push(group.key); franchise.episodeIds.push(...group.episodeIds); franchise.firstDate = franchise.firstDate < group.firstDate ? franchise.firstDate : group.firstDate; franchise.lastDate = franchise.lastDate > group.lastDate ? franchise.lastDate : group.lastDate; franchise.totalDuration += group.totalDuration;
});
const franchises = Array.from(franchisesByKey.values()).map((franchise) => ({ ...franchise, groupCount: franchise.groupKeys.length, episodeCount: franchise.episodeIds.length }));

// WWAM's early edited watchalong cuts are titled "We Watched <movie>".
// Exclude generic podcasts/roundups; those remain in the discovery edge lane.
const titleSignal = /commentary|watch\s*party|watch\s*along|full\s+movie|^\s*we\s+watched\s+(?!a\s+movie(?:\b|'s))(?!.{0,80}\bpodcast\b)(?!.*[,]\s)|^\s*let(?:'|’)?s\s+watch\s+(?!a\s+movie\b)(?!.*\b(?:live|scary\s+videos?|part\s+\d+|together)\b).+/i;
const titleCandidates = metadata.filter((record) => record.availability !== "subscriber_only" && titleSignal.test(record.title));
const heldTitleCandidates = metadata.filter((record) => record.availability === "subscriber_only" && titleSignal.test(record.title));
const broadDiscoveryCandidates = Array.isArray(discoveryManifest?.broadCandidates) ? discoveryManifest.broadCandidates : [];
const liveStrictCandidates = broadDiscoveryCandidates.filter((candidate) => candidate.strictTitleMatch);
const liveStrictHeldCandidates = liveStrictCandidates.filter((candidate) => metadataById.get(candidate.id)?.availability === "subscriber_only");
const liveStrictPublicCandidates = liveStrictCandidates.filter((candidate) => metadataById.get(candidate.id)?.availability !== "subscriber_only");
const liveCandidateIds = new Set(broadDiscoveryCandidates.map((candidate) => candidate.id));
const legacyCatalogRetained = episodes.filter((episode) => !liveCandidateIds.has(episode.id));
const broadSignalCounts = broadDiscoveryCandidates.reduce((counts, candidate) => {
  const signal = candidate.signal || "broad-watch-signal";
  counts[signal] = (counts[signal] || 0) + 1;
  return counts;
}, {});
const broadDiscoveryOmissions = broadDiscoveryCandidates
  .filter((candidate) => !includedIds.has(candidate.id))
  .map((candidate) => {
    const sourceRecord = metadataById.get(candidate.id) || heldTitleCandidates.find((record) => record.id === candidate.id);
    return {
      id: candidate.id,
      title: candidate.title,
      signal: candidate.signal || "broad-watch-signal",
      strictTitleMatch: Boolean(candidate.strictTitleMatch),
      date: dateFrom(sourceRecord?.upload_date),
      availability: sourceRecord?.availability || "unknown",
      reason: sourceRecord?.availability === "subscriber_only"
        ? "held: YouTube currently reports this upload as members-only"
        : candidate.signal === "reaction-or-review"
          ? "not promoted: title reads as a review/reaction rather than a full movie commentary"
          : candidate.signal === "short-form-watch-lead"
            ? "not promoted: short-form watch lead; title and runtime do not establish a full watchalong"
            : "not promoted: broad title signal needs a source-specific watchalong confirmation"
    };
  });
const excludedWatchalongCandidates = heldTitleCandidates.concat(
  metadata.filter((record) => titleSignal.test(record.title) && !includedIds.has(record.id) && record.availability !== "subscriber_only")
).slice(0, 150).map((record) => ({
  id: record.id,
  title: record.title,
  date: dateFrom(record.upload_date),
  availability: record.availability || "unknown",
  reason: record.availability === "subscriber_only"
    ? "held: YouTube currently reports this upload as members-only; it is not promoted into public canon"
    : "held: title signal needs a stronger source-specific inclusion rule"
}));
// Title-led examples that prove this is not a horror-only archive. The lane
// is navigation metadata, not a claim about a film's complete genre.
const crossGenreSourceIds = [
  ["jJ8AQ9MPUy0", "ACTION / WAR"], ["wZqgaLkMq0U", "TELEVISION"], ["uiFBVvWp8r8", "SUPERHERO"],
  ["rtwpEu7zT24", "FAMILY / CULT"], ["LHK_KKVd8nw", "COMEDY / CULT"], ["rs0Nff3_ZwQ", "SCI-FI / ACTION"],
  ["NuGQKLkam_U", "SUPERHERO"], ["YXBC7WRF0Y4", "SCI-FI / ACTION"], ["MM8NiLDtWX4", "CRIME / CULT"],
  ["OSO_cQScRds", "SUPERHERO"], ["feYCMF5zkS0", "SCI-FI / ACTION"], ["0X8Jq7wxfJo", "SUPERHERO"],
  ["american-psycho-podcast-2023", "PODCAST // PSYCHOLOGICAL"], ["wayne-s-world-podcast-2022", "PODCAST // COMEDY"],
  ["planes-trains-automobiles-podcast-2020", "PODCAST // COMEDY"], ["once-upon-a-time-in-hollywood-podcast-2020", "PODCAST // CRIME / DRAMA"],
  ["death-wish-podcast-2018", "PODCAST // ACTION"], ["predator-1987-podcast-2018", "PODCAST // SCI-FI / ACTION"]
];
const crossGenreExamples = crossGenreSourceIds.map(([id, lane]) => {
  const episode = episodes.find((item) => item.id === id);
  const podcast = podcastOnlyCommentaries.find((item) => item.key === id);
  return episode ? { id, title: episode.movieTitle || episode.title, lane, source: "youtube", url: episode.url } : podcast ? { id, title: podcast.movieTitle, lane, source: "podcast", url: podcast.sourceUrl || podcast.url } : null;
}).filter(Boolean);
const coverageLedger = {
  channelUploads: discoveryManifest?.channelSnapshotSources || null,
  broadCandidates: broadDiscoveryCandidates.length,
  strictCandidates: liveStrictCandidates.length,
  publicYoutubeCanon: episodes.length,
  podcastRecoveries: podcastOnlyCommentaries.length,
  podcastFeedRecords: podcastFeedCount,
  podcastFeedOverlaps: Math.max(0, podcastFeedCount - podcastOnlyCommentaries.length),
  uniqueFilmSources: episodes.length + podcastOnlyCommentaries.length,
  heldStrictMembersOnly: liveStrictHeldCandidates.length,
  adjacentPublicLeads: broadDiscoveryOmissions.filter((item) => item.availability === "public").length,
  unresolvedEdgeLeads: broadDiscoveryOmissions.filter((item) => item.availability === "unknown").length,
  crossGenreExamples
};
const payload = {
  schema: "shokker-wwam-watchalong-canon/v1",
  generated: new Date().toISOString(),
  observedAt: discoveryManifest?.observedAt || "2026-07-30",
  podcastAudit: { ...podcastAuditData, feedItemsAudited: podcastAuditData.records?.length || podcastFeedCount, titleExplicitFilmCommentaries: podcastFeedCount, newToPublicYouTubeCanon: podcastOnlyCommentaries.length, method: "Official RSS title + enclosure + iTunes duration; no title-only RSS item is promoted without a full-film commentary signal." },
  sourcePolicy: "Official cached WWAM YouTube metadata plus local caption or audio-transcript receipts. Existing curated 39-tape dossiers are retained; title-explicit public commentaries, movie watch parties, and clearly labeled We Watched <film> highlight edits are added as caption-ledger or source-brief dossiers. Official podcast variants may add variant-bound audio routes only when their timeline is explicitly non-isomorphic; they never substitute for canonical YouTube timestamps. The official RSS audit also preserves six title-explicit, playable podcast-only film commentaries whose YouTube counterparts are absent from the current public snapshot; they remain a separate recovery lane with no invented timestamps. Members-only uploads stay in the discovery ledger until access changes. No speaker, intent, rights, or creator-approval claim is inferred.",
  scope: { metadataSources: metadata.length, channelSnapshotSources: discoveryManifest?.channelSnapshotSources || null, titleCandidates: titleCandidates.length, heldTitleCandidates: heldTitleCandidates.length, episodes: episodes.length, captionFiles: fs.readdirSync(CAPTIONS_DIR).filter((file) => file.endsWith(".json")).length },
  stats: {
    episodes: episodes.length, deepDossiers: episodes.filter((episode) => episode.dossier.state === "full-editorial-dossier").length, captionLedgers: episodes.filter((episode) => episode.dossier.state === "caption-ledger-dossier").length, sourceBriefs: episodes.filter((episode) => episode.dossier.state === "source-brief-dossier").length, nonFullAdditions: episodes.filter((episode) => episode.dossier.state !== "full-editorial-dossier").length,
    franchises: franchises.length, movieGroups: groups.length, repeatedMovies: groups.filter((group) => group.repeatCount > 0).length, podcastOnlyCommentaries: podcastOnlyCommentaries.length, podcastFeedRecords: podcastFeedCount, uniqueFilmSources: episodes.length + podcastOnlyCommentaries.length,
    totalDurationSeconds: episodes.reduce((sum, episode) => sum + episode.duration, 0), totalViewsSnapshot: episodes.reduce((sum, episode) => sum + episode.views, 0),
    fanSignalReceipts: episodes.reduce((sum, episode) => sum + Number(episode.dossier?.fanSignals?.length || 0), 0),
    episodesWithFanSignals: episodes.filter((episode) => Number(episode.dossier?.fanSignals?.length || 0) > 0).length,
    firstDate: episodes[0]?.date || null, lastDate: episodes.at(-1)?.date || null,
    sourceCounts: { catalogCommentaries: catalog.length, titleCommentaries: titleCandidates.filter((record) => /commentary/i.test(record.title)).length, explicitWatchParties: 2, heldMembersOnly: heldTitleCandidates.length, liveStrictCandidates: liveStrictCandidates.length, liveStrictPublicCandidates: liveStrictPublicCandidates.length, legacyCatalogRetained: legacyCatalogRetained.length, podcastOnlyCommentaries: podcastOnlyCommentaries.length }
  },
  taxonomy: { groups: groups.map((group) => ({ key: group.key, title: group.title, franchiseKey: group.franchiseKey })), aliases: Object.fromEntries(episodes.map((episode) => [episode.id, episode.aliases])) },
  coverageLedger,
  watchPassCoverage: watchPass.coverage || null,
  podcastCommentaries: podcastOnlyCommentaries,
  podcastFeedRecords,
  franchises, groups, episodes, discovery: {
    channelUrl: discoveryManifest?.channelUrl || "https://www.youtube.com/@WeWatchedAMovie/videos",
    titlePattern: discoveryManifest?.titlePattern || titleSignal.source,
    watchedMoviePattern: discoveryManifest?.watchedMoviePattern || null,
    letWatchMoviePattern: discoveryManifest?.letWatchMoviePattern || null,
    broadTitlePattern: discoveryManifest?.broadTitlePattern || null,
    channelSnapshotSources: discoveryManifest?.channelSnapshotSources || null,
    explicitCandidateCount: discoveryManifest?.explicitCandidateCount || null,
    broadCandidateCount: discoveryManifest?.broadCandidateCount || broadDiscoveryCandidates.length || null,
    liveStrictCandidateCount: liveStrictCandidates.length,
    liveStrictPublicCandidateCount: liveStrictPublicCandidates.length,
    liveStrictHeldCandidateCount: liveStrictHeldCandidates.length,
    legacyCatalogRetained: legacyCatalogRetained.map((episode) => ({ id: episode.id, title: episode.title, date: episode.date })),
    broadSignalCounts,
    broadDiscoveryOmissions,
    priorCanonCount: discoveryManifest?.priorCanonCount || null,
    heldTitleCandidates: heldTitleCandidates.map((record) => ({ id: record.id, title: record.title, date: dateFrom(record.upload_date), availability: record.availability, included: false })),
    titleCandidates: titleCandidates.map((record) => ({ id: record.id, title: record.title, date: dateFrom(record.upload_date), included: includedIds.has(record.id) })),
    excludedWatchalongCandidates,
    edgeReview: edgeAuditData
  }
};

const output = `/* Generated by scripts/generate-wwam-watchalong-canon.mjs. Source-bounded WWAM public watchalong registry. */\nwindow.WWAM_WATCHALONG_CANON = ${JSON.stringify(payload)};\n`;
fs.writeFileSync(path.join(PUBLIC_DEMO, "wwam-watchalong-canon.js"), output);
console.log(`Generated ${episodes.length} episodes, ${groups.length} movie groups, ${franchises.length} franchises.`);
