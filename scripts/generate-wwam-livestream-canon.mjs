import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = path.join(ROOT, "public", "demo");
const METADATA_DIR = path.join(ROOT, "source-cache", "metadata");
const CAPTIONS_DIR = path.join(ROOT, "source-cache", "captions");

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function loadScript(file) {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(DEMO, file), "utf8"), context, { filename: file });
  return context;
}
function clean(value) { return String(value == null ? "" : value).replace(/\s+/g, " ").trim(); }
function words(value) { return clean(value).split(/\s+/).filter(Boolean); }
function excerpt(value, limit = 20) {
  const tokens = words(String(value).replace(/\s*\n\s*/g, " "));
  return tokens.length <= limit ? tokens.join(" ") : `${tokens.slice(0, limit).join(" ")}...`;
}
function dateFrom(value) {
  const text = clean(value);
  return /^\d{8}$/.test(text) ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : text || null;
}
function clock(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
function normalizeCaptionText(value) {
  return clean(value).replace(/\[(?:\s*[_-]+\s*)+\]/g, " ")
    .replace(/\[(?:music|applause|laughter|inaudible|bleep)\]/gi, " ")
    .replace(/[_]+/g, " ").replace(/\s+([,.!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
}
function captionEvents(id) {
  const file = path.join(CAPTIONS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return [];
  const payload = readJson(file);
  return (payload.events || []).filter((event) => Array.isArray(event.segs) && event.segs.length)
    .map((event) => ({
      t: Math.max(0, Number(event.tStartMs || 0) / 1000),
      end: Math.max(0, Number(event.tStartMs || 0) / 1000 + Number(event.dDurationMs || 0) / 1000),
      text: normalizeCaptionText(event.segs.map((segment) => segment && segment.utf8 || "").join("")),
    })).filter((event) => event.text);
}
function captionWindow(events, index, before = 5, after = 12) {
  const anchor = events[index];
  if (!anchor) return "";
  const lines = [];
  for (let cursor = Math.max(0, index - 3); cursor <= Math.min(events.length - 1, index + 5); cursor += 1) {
    const event = events[cursor];
    if (event.t < anchor.t - before || event.t > anchor.t + after) continue;
    if (lines.length && event.t - events[cursor - 1].t > 6) continue;
    lines.push(event.text);
  }
  const deduped = [];
  lines.join(" ").split(/\s+/).forEach((token) => {
    if (token && (!deduped.length || deduped.at(-1).toLowerCase() !== token.toLowerCase())) deduped.push(token);
  });
  return deduped.join(" ");
}
function topicAnchor(events, term) {
  const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&").replace(/\\s+/g, "\\s+")}\\b`, "i");
  const hits = events.map((event, index) => ({ event, index })).filter(({ event }) => pattern.test(event.text));
  if (!hits.length) return null;
  const peak = hits.slice().sort((a, b) => b.event.text.length - a.event.text.length || a.event.t - b.event.t)[0];
  return { name: term, mentions: hits.length, first: hits[0].event.t, peak: peak.event.t, cluster: Math.min(24, hits.length), receipt: excerpt(captionWindow(events, peak.index), 20), at: Math.round(peak.event.t) };
}

const metadata = fs.readdirSync(METADATA_DIR).filter((file) => file.endsWith(".json")).map((file) => readJson(path.join(METADATA_DIR, file)));
const catalog = loadScript("catalog.js").WWAM_CATALOG || [];
const atlas = loadScript("archive-atlas-data.js").WWAM_ARCHIVE_ATLAS || { records: [] };
const completion = loadScript("archive-completion.js").WWAM_ARCHIVE_COMPLETION || { streams: [] };
const deep = loadScript("archive-deep-distill.js").WWAM_ARCHIVE_DEEP || { streams: [] };
const fresh = loadScript("livestream-distill.js").WWAM_LIVESTREAMS || { streams: [] };
const yearCanon = loadScript("year-canon-2025-2026.js").WWAM_YEAR_CANON_2025_2026 || { streams: [] };
const watchPilot = loadScript("wwam-watch-pass-pilot.js").WWAM_WATCH_PASS_PILOT || { episodes: {} };
const livestreamAudio = fs.existsSync(path.join(DEMO, "wwam-livestream-audio-pass.js"))
  ? loadScript("wwam-livestream-audio-pass.js").WWAM_LIVESTREAM_AUDIO_PASS || { episodes: {}, coverage: null }
  : { episodes: {}, coverage: null };
const livestreamRssAudio = fs.existsSync(path.join(DEMO, "wwam-livestream-rss-audio-pass.js"))
  ? loadScript("wwam-livestream-rss-audio-pass.js").WWAM_LIVESTREAM_RSS_AUDIO_PASS || { records: {} }
  : { records: {} };
// source-cache/metadata is shared with the watchalong audio acquisition lane.
// Keep the livestream registry source-bounded: the official atlas plus the
// original catalog are allowed in; newly acquired movie-commentary metadata
// must not silently turn into livestream episodes just because it exists
// locally. This preserves the existing 509-source livestream contract while
// the watchalong registry grows independently.
const atlasById = new Map((atlas.records || []).map((record) => [record.id, record]));
const completionById = new Map((completion.streams || []).map((record) => [record.id, record]));
const deepById = new Map((deep.streams || []).map((record) => [record.id, record]));
const freshById = new Map((fresh.streams || []).map((record) => [record.id, record]));
const yearCanonById = new Map((yearCanon.streams || []).map((record) => [record.id, record]));
const livestreamAllowIds = new Set([
  ...atlasById.keys(),
  ...catalog.map((record) => record.id),
]);
const canonicalMetadata = metadata.filter((record) => livestreamAllowIds.has(record.id));

const TOPIC_TERMS = [
  "Halloween", "Scream", "Friday the 13th", "A Nightmare on Elm Street", "Chucky", "Child's Play", "Michael Myers", "Freddy", "Jason", "Batman", "Marvel", "DC", "Superman", "Alien", "Predator", "Evil Dead", "Hellraiser", "Texas Chainsaw", "The Conjuring", "Terrifier", "Saw", "Mortal Kombat", "Ghostbusters", "Star Wars", "Jurassic", "Trailers", "Streaming", "Box Office", "Retro Rewind", "Rankings & Lists", "Horror", "Comedy", "Video Games", "Halloween Ends", "Scream 7", "Feldman", "Loomis", "Challis", "Slenderman"
];
const LANE_DEFS = [
  { key: "up-in-ya", label: "WWAM UP IN YA", pattern: /\b(fuck|fucking|dick|cock|balls?|cum|fart|shit|bitch|piss|boob|tits?|asshole|suck|boner|poop)\b/i },
  { key: "steves-asshole", label: "STRAIGHT TO STEVE'S ASSHOLE", pattern: /\b(hate|hated|worst|terrible|awful|sucks?|stupid|dumb|bullshit|garbage|lazy|weak|ruined|don't like|didn't like|not good)\b/i },
  { key: "room-breaks", label: "THE ROOM BREAKS", pattern: /\b(laugh|laughter|hilarious|funny|crying|dying|oh my god|what the fuck|no way)\b/i },
  { key: "character", label: "CHARACTER SIGNAL", pattern: /\b(loomis|chall[ie]s|slenderman|corey feldman|feldman|michael myers|freddy|jason|chucky|tiffany)\b/i },
  { key: "fan", label: "FAN SIGNAL", pattern: /super\s*chat|\bdonat(?:e|ed|ion)\b|lee(?:\s+the)?\s+machine|michael\s+part(?:on|in)|chat(?:'s| is) asking|question from (?:the )?chat|(?:thanks|welcome|appreciate|thank you).{0,45}(?:member|membership)|(?:new|another|our) member|(?:member|membership).{0,45}(?:joined|join|thanks|thank|gift)/i },
  { key: "take", label: "TAKE GETS NUCLEAR", pattern: /\b(obviously|literally|never|always|worst|best|greatest|insane|ridiculous|unacceptable|wrong|right|point blank|period)\b/i },
];
const CHARACTER_DEFS = [
  { key: "loomis", name: "Dr. Loomis", pattern: /\b(?:dr\.?\s*)?loomis\b/i },
  { key: "challis", name: "Dr. Challis", pattern: /\b(?:dr\.?\s*)?chall[ie]s\b/i },
  { key: "slenderman", name: "Slenderman", pattern: /\bslender\s*man\b/i },
  { key: "feldman", name: "Corey Feldman", pattern: /\b(?:corey\s+feldman|feldman)\b/i },
  { key: "myers", name: "Michael Myers", pattern: /\bmichael\s+myers\b/i },
  { key: "freddy", name: "Freddy Krueger", pattern: /\b(?:freddy(?:\s+krueger)?|krueger)\b/i },
  { key: "jason", name: "Jason Voorhees", pattern: /\bjason\s+voorhees\b/i },
  { key: "chucky", name: "Chucky", pattern: /\bchucky\b|\bchild['’]?s\s+play\b/i },
  { key: "ghostface", name: "Ghostface", pattern: /\bghostface\b/i },
  { key: "pleasence", name: "Donald Pleasence", pattern: /\bdonald\s+pleasence\b|\bpleasence\b/i },
  { key: "rob-zombie", name: "Rob Zombie", pattern: /\brob\s+zombie\b/i },
  { key: "leatherface", name: "Leatherface", pattern: /\bleatherface\b/i },
];
const RESTRICTED_MODES = new Set(["trailer-reaction", "source-video-watch-party"]);

function inferMode(title) {
  const text = clean(title);
  if (/commentary|watch\s*(party|along)|watchalong/i.test(text)) return /watch\s*(party|along)/i.test(text) ? "source-video-watch-party" : "movie-commentary";
  if (/trailer|teaser|breakdown/i.test(text)) return "trailer-reaction";
  if (/tier list|rank(?:ed|ing)?|bracket|versus|\bvs\.?\b|royal rumble|friday night fight/i.test(text)) return "ranking-show";
  if (/q\s*&?\s*a|questions|50 million views/i.test(text)) return "q-and-a";
  if (/interview|with (?:director|writer|actor|guest)|director .+\+|writer .+\+/i.test(text)) return "interview";
  if (/spoiler|review party/i.test(text)) return "spoiler-review";
  if (/review|movie reviews?/i.test(text)) return "review-show";
  if (/game|gaming|play(?:ing)? scary|video store/i.test(text)) return "special-event";
  if (/live|stream|movie news|we watched a movie/i.test(text)) return "livestream";
  return "special-event";
}
function inferSeries(title, mode) {
  const text = clean(title).toLowerCase();
  if (/friday night fight/.test(text)) return { key: "friday-night-fights", label: "Friday Night Fights" };
  if (/retro rewind|video store/.test(text)) return { key: "retro-rewind", label: "Retro Rewind" };
  if (/commentary|watch\s*(party|along)|watchalong/.test(text)) return { key: "watchalongs", label: "Movie Watchalongs" };
  if (/trailer|teaser|breakdown/.test(text)) return { key: "trailer-desk", label: "Trailer Desk" };
  if (/tier list|rank|bracket|versus|\bvs\.?\b|royal rumble/.test(text)) return { key: "ranking-room", label: "Ranking Room" };
  if (/q\s*&?\s*a|questions/.test(text)) return { key: "fan-mail", label: "Fan Mail / Q&A" };
  if (/interview|with (?:director|writer|actor|guest)/.test(text)) return { key: "guest-room", label: "Guest Room" };
  if (mode === "spoiler-review" || mode === "review-show") return { key: "review-desk", label: "Review Desk" };
  return { key: "wwam-live", label: "WWAM Live" };
}
function inferShape(title, mode, existing, yearSnapshot) {
  if (existing?.editorial?.showShape) return existing.editorial.showShape;
  if (yearSnapshot?.editorial?.showShape) return yearSnapshot.editorial.showShape;
  const text = clean(title);
  if (/friday night fights/i.test(text)) return "FIGHT NIGHT";
  if (/retro rewind|video store/i.test(text)) return "VIDEO STORE BUILD NIGHT";
  if (/tier list/i.test(text)) return "TIER-LIST NIGHT";
  if (/bracket|tournament/i.test(text)) return "BRACKET NIGHT";
  if (/trailer|teaser|breakdown/i.test(text)) return "TRAILER EMERGENCY";
  if (/review|spoiler/i.test(text)) return "REVIEW NIGHT";
  if (/movie news|news and more/i.test(text)) return "LIVE NEWS DESK";
  if (mode === "ranking-show") return "RANKING NIGHT";
  if (mode === "movie-commentary") return "MOVIE COMMENTARY";
  if (mode === "q-and-a") return "FAN MAIL";
  return "OPEN-LINE MOVIE NEWS";
}
function derivedTopics(events, title) {
  const titleTerms = TOPIC_TERMS.filter((term) => new RegExp(term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i").test(title));
  const found = TOPIC_TERMS.map((term) => topicAnchor(events, term)).filter(Boolean);
  const merged = [...found, ...titleTerms.filter((term) => !found.some((item) => item.name === term)).map((term) => ({ name: term, mentions: 0, first: 0, peak: 0, cluster: 0, receipt: "Title signal only; open the source before treating the topic as spoken.", at: 0 }))];
  return merged.sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name)).slice(0, 10);
}
function derivedMoments(events, duration, restricted = false) {
  if (!events.length || restricted) return [];
  const perLane = Math.max(3, Math.round((duration || 1) / 1800));
  const output = [];
  for (const lane of LANE_DEFS) {
    const ranked = events.map((event, index) => ({ event, index, hits: lane.pattern.test(event.text) })).filter((item) => item.hits)
      .sort((a, b) => b.event.text.length - a.event.text.length || a.event.t - b.event.t);
    const picked = [];
    for (const item of ranked) {
      if (picked.length >= perLane) break;
      if (picked.some((other) => Math.abs(other.event.t - item.event.t) < 50)) continue;
      picked.push(item);
    }
    for (const item of picked) output.push({
      id: `${lane.key}-${Math.round(item.event.t)}`, t: Math.round(item.event.t), end: Math.round(item.event.end || item.event.t + 36),
      category: lane.label, label: lane.label, score: Math.min(99, 62 + Math.min(28, words(item.event.text).length)),
      excerpt: excerpt(captionWindow(events, item.index), 24), evidenceBasis: "source-local automatic caption lane cluster", reviewStatus: "machine-candidate"
    });
  }
  return output.sort((a, b) => a.t - b.t);
}
function fanSignals(events, duration) {
  const lane = LANE_DEFS.find((item) => item.key === "fan");
  const ranked = events.map((event, index) => ({ event, index })).filter((item) => lane.pattern.test(item.event.text));
  const max = Math.max(3, Math.round((duration || 1) / 1800) + 2);
  const picked = [];
  ranked.forEach((item) => {
    if (picked.length >= max || picked.some((other) => Math.abs(other.event.t - item.event.t) < 55)) return;
    picked.push(item);
  });
  return picked.map((item) => ({ id: `fan-${Math.round(item.event.t)}`, t: Math.round(item.event.t), end: Math.round(item.event.end || item.event.t + 36), category: "FAN SIGNAL", label: "FAN SIGNAL", signalType: fanSignalType(item.event.text), score: 78, excerpt: excerpt(captionWindow(events, item.index), 24), evidenceBasis: "source-local automatic caption fan-callout cluster", reviewStatus: "machine-candidate" }));
}
function fanSignalType(text) {
  const value = clean(text);
  if (/lee(?:\s+the)?\s+machine/i.test(value)) return "LEE THE MACHINE CUE";
  if (/michael\s+part(?:on|in)/i.test(value)) return "MICHAEL PARTON/PARTIN CUE";
  if (/super\s*chat|donat(?:e|ed|ion)/i.test(value)) return "SUPER CHAT / DONATION CUE";
  if (/member|membership/i.test(value)) return "MEMBERSHIP CUE";
  return "CHAT / FAN CALLOUT";
}
function laneLabelMatches(value, laneLabel) {
  const candidate = clean(value).toLowerCase();
  const lane = clean(laneLabel).toLowerCase();
  if (candidate === lane) return true;
  const aliases = { "the room breaks": "room break", "wwam up in ya": "up in ya" };
  return aliases[lane] === candidate;
}
function recurringBits(events, moments, fan, duration, listeningRoutes = []) {
  const receiptLimit = Math.max(6, Math.round((duration || 1) / 450));
  return LANE_DEFS.map((lane) => {
    const hits = lane.key === "fan"
      ? fan.map((signal) => ({ t: signal.t, end: signal.end, text: signal.excerpt, index: -1, signalType: signal.signalType }))
      : events.map((event, index) => ({ event, index, t: event.t, end: event.end, text: event.text })).filter((item) => lane.pattern.test(item.text));
    if (!hits.length) return null;
    const ranked = hits.slice().sort((a, b) => words(b.text).length - words(a.text).length || a.t - b.t);
    const receipts = ranked.slice(0, receiptLimit).map((item) => ({
      t: Math.round(item.t), end: Math.round(item.end || item.t + 36),
      excerpt: excerpt(item.index >= 0 ? captionWindow(events, item.index) : item.text, 24),
      signalType: item.signalType || null, evidenceBasis: "source-local automatic caption lane cue", reviewStatus: "machine-candidate"
    }));
    const laneMoments = moments.filter((moment) => laneLabelMatches(moment.category || moment.label, lane.label));
    const listeningLaneMoments = listeningRoutes.filter((moment) => laneLabelMatches(moment.category || moment.label, lane.label));
    const peak = ranked[0];
    return {
      key: lane.key, label: lane.label, candidateCount: hits.length, momentReceipts: laneMoments.length + listeningLaneMoments.length,
      first: Math.round(hits.slice().sort((a, b) => a.t - b.t)[0].t), peak: Math.round(peak.t),
      receipts, evidenceBasis: "caption pattern + bounded timestamp receipts; not speaker-diarized", reviewStatus: "machine-candidate"
    };
  }).filter(Boolean);
}
function bestBits(moments, fan, listeningRoutes = []) {
  const seen = new Set();
  const routes = moments.concat(fan, listeningRoutes).filter((moment) => {
    const key = `${Math.round(Number(moment.t || 0))}|${clean(moment.category || moment.label || "SOURCE RECEIPT")}|${clean(moment.excerpt || moment.quote || moment.captionExcerpt || "").slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return routes.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0)).map((moment, index) => ({
    rank: index + 1, t: Number(moment.t || 0), end: Number(moment.end || moment.t || 0), category: clean(moment.category || moment.label || "SOURCE RECEIPT"),
    label: clean(moment.label || moment.category || "SOURCE RECEIPT"), excerpt: clean(moment.excerpt || moment.quote || moment.captionExcerpt || ""), score: Number(moment.score || 0),
    evidenceBasis: moment.evidenceBasis || "source-local listening route", reviewStatus: moment.reviewStatus || "machine-candidate"
  }));
}
function listPhrase(items) {
  const names = items.filter(Boolean).map(clean).filter(Boolean);
  if (!names.length) return "the night's open room";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
function contentFrame(title, shape, topics = []) {
  const text = `${clean(title)} ${clean(shape)} ${topics.map((topic) => topic?.name || "").join(" ")}`;
  if (/game of thrones|welcome to derry|episode\s+\d+|season\s+\d+|\brecap\b/i.test(text)) return "an episode-recap room";
  if (/trailer|teaser|spot|description|coming soon|\bbreakdown\b|delay talk|super bowl/i.test(text)) return "a trailer-and-news roundtable";
  if (/ranking|tier|bracket|mount rushmore|\bvs\b|versus/i.test(text)) return "a ranking-night argument";
  if (/q\s*&?\s*a|fan mail|super chat|member/i.test(text)) return "a fan-driven open line";
  if (/spoiler|review/i.test(text)) return "a spoiler-review hang";
  if (/commentary|watch\s*along|watch party/i.test(text)) return "a movie-side conversation";
  return "an open-line movie-news room";
}
function tapeNote(title, shape, topics, moments, fan, recurring, characterCues, listeningRoutes = []) {
  const topicList = listPhrase(topics.slice(0, 4).map((topic) => topic.name));
  const laneLead = recurring.slice().sort((a, b) => Number(b.candidateCount || 0) - Number(a.candidateCount || 0))[0];
  const routeMoments = moments.length ? moments : listeningRoutes;
  const hot = routeMoments.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0))[0];
  const characterList = listPhrase(characterCues.slice().sort((a, b) => Number(b.mentions || 0) - Number(a.mentions || 0)).slice(0, 3).map((character) => character.name));
  const fanTypes = Array.from(new Set(fan.map((signal) => signal.signalType))).slice(0, 2);
  const frame = contentFrame(title, shape, topics);
  const hook = hot ? `The first ${moments.length ? "caption" : "listening"} route worth pressing is ${clock(hot.t)} // ${hot.category}; open the source there and hear the exchange in full.` : "No bounded first-play hook survived this evidence tier.";
  const laneMood = laneLead?.label === "ROOM BREAK" ? "breakdown territory" : laneLead?.label === "TAKE GETS NUCLEAR" ? "an argumentative register" : laneLead?.label === "WWAM UP IN YA" ? "out-of-pocket territory" : laneLead?.label === "STRAIGHT TO STEVE'S ASSHOLE" ? "a hostile verdict lane" : "a sharp side-channel";
  const lane = laneLead ? `The dominant recurring lane is ${laneLead.label} (${laneLead.candidateCount} caption cues), which puts the night in ${laneMood}.` : "The recurring-bit lanes stay quiet in this pass.";
  const fanLine = fan.length ? `The fan ledger catches ${fan.length} ${fan.length === 1 ? "signal receipt" : "signal receipts"}${fanTypes.length ? `, including ${listPhrase(fanTypes)}` : ""}.` : "No fan-signal cluster survived this pass.";
  const characterLine = characterCues.length ? `Character traffic includes ${characterList}; the captions do not diarize who performed a cue.` : "No character cue was strong enough to retain in the caption map.";
  return `${shape} circles ${topicList} and plays like ${frame}. ${lane} ${hook} ${fanLine} ${characterLine}`;
}
function machineShapedSummary(value) {
  const text = clean(value);
  return !text || /(?:This completion pass maps|A bracket-and-ranking night from|A trailer-and-news night from|A movie watchalong from|A fan-mail night from|A spoiler-heavy review night from|An open-line movie-news night from|caption map opens on|timestamp candidates across|If you are dropping into this|The shape of the night is|has indexed doors on|The 2026 second pass maps|This is a machine-surfaced caption map|Ranked #\d+ among eligible archived livestreams|Selected #\d+ by the frozen Archive Atlas|Automatic captions support timestamped|Its caption map concentrates on)/i.test(text);
}
function voiceSummary(title, date, shape, topics, moments, fan, recurring, characterCues, evidenceTier, listeningRoutes = []) {
  const topicList = listPhrase(topics.slice(0, 4).map((topic) => topic.name));
  const laneLead = recurring.slice().sort((a, b) => Number(b.candidateCount || 0) - Number(a.candidateCount || 0))[0];
  const routeMoments = moments.length ? moments : listeningRoutes;
  const hot = routeMoments.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0))[0];
  const characterList = listPhrase(characterCues.slice().sort((a, b) => Number(b.mentions || 0) - Number(a.mentions || 0)).slice(0, 3).map((character) => character.name));
  const fanTypes = Array.from(new Set(fan.map((signal) => signal.signalType))).slice(0, 2);
  const frame = contentFrame(title, shape, topics);
  const mood = laneLead?.label === "ROOM BREAK" ? "the room keeps losing its composure" : laneLead?.label === "TAKE GETS NUCLEAR" ? "the takes keep catching fire" : laneLead?.label === "WWAM UP IN YA" ? "the conversation gets gloriously filthy" : laneLead?.label === "STRAIGHT TO STEVE'S ASSHOLE" ? "the verdict lane gets mean" : "the side conversations keep widening";
  const route = hot ? `Your best first ${moments.length ? "caption" : "listening"} stop is ${clock(hot.t)} // ${hot.category}; press play there and let the full exchange establish the context.` : "There is no honest single hook in this evidence tier, so the route stays chapter-first.";
  const fanLine = fan.length ? `The fan traffic is part of the show too: ${fan.length} retained callout${fan.length === 1 ? "" : "s"}${fanTypes.length ? ` across ${listPhrase(fanTypes)}` : ""}.` : "No fan callout cluster survived the source-local ledger.";
  const characterLine = characterCues.length ? `Character traffic includes ${characterList}, but captions do not prove who was performing the bit.` : "No character cue cleared the source-local threshold.";
  const evidenceLine = evidenceTier === "source-brief" ? "This one stays a source brief until a playable local receipt appears." : "The routes are machine-surfaced navigation aids, not speaker-diarized quotes or a claim that every funny beat has been found.";
  return `${clean(title)} is ${frame} from ${date}. It circles ${topicList} while ${mood}. ${route} ${fanLine} ${characterLine} ${evidenceLine}`;
}
function normalizeFanSignals(items) {
  return (items || []).map((signal) => ({ ...signal, signalType: clean(signal.signalType || fanSignalType(signal.excerpt || "")) })).filter((signal) => signal.excerpt || Number(signal.t || 0) >= 0);
}
function chapters(duration, moments, topics, restricted = false) {
  const output = [];
  for (let index = 0; index < 8; index += 1) {
    const target = Math.round((duration || 1) * index / 8);
    const route = moments.length ? moments.slice().sort((a, b) => Math.abs(a.t - target) - Math.abs(b.t - target))[0] : topics.slice().sort((a, b) => Math.abs((a.at || a.peak || 0) - target) - Math.abs((b.at || b.peak || 0) - target))[0];
    if (!route) continue;
    output.push({ id: `act-${String(index + 1).padStart(2, "0")}`, act: index + 1, at: Math.round(route.t ?? route.at ?? route.peak ?? target), end: Math.round(route.end ?? route.at ?? route.peak ?? target), label: route.label || route.category || route.name || "WATCH ROUTE", category: route.category || "TOPIC DOOR", excerpt: restricted ? "Topic-navigation checkpoint; excerpt withheld for this content mode." : excerpt(route.excerpt || route.receipt || "Open the source at this chapter checkpoint.", 24), body: restricted ? "The archive preserves this chapter as a source-local route without manufacturing a quote or visual claim." : `The tape's ${String(route.label || route.category || route.name || "route").toLowerCase()} lane surfaces here. Open the timestamp and hear the full exchange.`, evidenceBasis: restricted ? "restricted topic checkpoint" : "source-local caption route checkpoint" });
  }
  return output;
}
function heatmap(duration, events, moments, topics) {
  const count = duration > 10000 ? 24 : duration > 5400 ? 18 : 12;
  const step = Math.max(1, (duration || 1) / count);
  return Array.from({ length: count }, (_, index) => {
    const from = Math.round(index * step), to = Math.round(Math.min(duration || 1, (index + 1) * step));
    const local = events.filter((event) => event.t >= from && event.t < to);
    const signal = moments.filter((moment) => moment.t >= from && moment.t < to);
    const topic = topics.slice().sort((a, b) => Math.abs((a.at || a.peak || 0) - (from + to) / 2) - Math.abs((b.at || b.peak || 0) - (from + to) / 2))[0];
    return { from, to, heat: Math.min(100, Math.max(8, 10 + signal.length * 12 + Math.min(40, local.length / 8))), signal: signal[0]?.category || "OPEN MIC", topic: topic?.name || null };
  });
}
function characters(events) {
  return ["Dr. Loomis", "Dr. Challis", "Slenderman", "Corey Feldman", "Michael Myers", "Freddy", "Jason", "Chucky"].map((name) => {
    const pattern = new RegExp(name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i");
    const hits = events.filter((event) => pattern.test(event.text));
    return hits.length ? { name, mentions: hits.length, first: Math.round(hits[0].t), peak: Math.round(hits[0].t), receipt: excerpt(hits[0].text, 18), evidenceBasis: "source-local automatic caption character cue", reviewStatus: "machine-candidate" } : null;
  }).filter(Boolean);
}
function characterCues(events, duration) {
  const receiptLimit = Math.max(4, Math.round((duration || 1) / 600));
  return CHARACTER_DEFS.map((character) => {
    const hits = events.map((event, index) => ({ event, index })).filter((item) => character.pattern.test(item.event.text));
    if (!hits.length) return null;
    const ranked = hits.slice().sort((a, b) => words(b.event.text).length - words(a.event.text).length || a.event.t - b.event.t);
    return {
      key: character.key, name: character.name, mentions: hits.length, first: Math.round(hits[0].event.t), peak: Math.round(ranked[0].event.t),
      receipts: ranked.slice(0, receiptLimit).map((item) => ({ t: Math.round(item.event.t), end: Math.round(item.event.end || item.event.t + 36), excerpt: excerpt(captionWindow(events, item.index), 24), evidenceBasis: "source-local automatic caption character cue", reviewStatus: "machine-candidate" })),
      evidenceBasis: "source-local automatic caption character cue; host identity is not diarized", reviewStatus: "machine-candidate"
    };
  }).filter(Boolean);
}
function normalizeTopics(items) { return (items || []).slice(0, 10).map((topic) => ({ name: clean(topic.name), mentions: Number(topic.mentions || 0), first: Math.round(Number(topic.first || 0)), peak: Math.round(Number(topic.peak || topic.at || 0)), cluster: Number(topic.cluster || 0), receipt: clean(topic.receipt || ""), at: Math.round(Number(topic.at || topic.peak || topic.first || 0)), evidence: topic.evidence || { type: "source-local caption", speakerStatus: "not-diarized", reviewStatus: "machine-candidate" } })).filter((topic) => topic.name); }
function normalizeMoments(items, restricted = false) {
  if (restricted) return [];
  return (items || [])
    .map((moment, index) => ({
      id: moment.id || `moment-${index + 1}`,
      t: Math.round(Number(moment.t || 0)),
      end: Math.round(Number(moment.end || moment.t || 0)),
      category: clean(moment.category || moment.label || "SOURCE RECEIPT"),
      label: clean(moment.label || moment.category || "SOURCE RECEIPT"),
      score: Number(moment.heat || moment.score || 0),
      excerpt: normalizeCaptionText(moment.excerpt || moment.quote || ""),
      evidenceBasis: moment.evidenceBasis || "source-local caption candidate",
      reviewStatus: moment.reviewStatus || "machine-candidate"
    }))
    .filter((moment) => moment.excerpt || moment.t >= 0);
}
function conversationThreads(topics) {
  return topics.slice().sort((a, b) => Number(a.first || a.at || 0) - Number(b.first || b.at || 0) || Number(b.mentions || 0) - Number(a.mentions || 0)).map((topic, index) => ({
    rank: index + 1, name: topic.name, first: Number(topic.first || topic.at || 0), peak: Number(topic.peak || topic.at || topic.first || 0), mentions: Number(topic.mentions || 0), receipt: clean(topic.receipt || "Open the source at this topic door."), evidenceBasis: "source-local automatic caption topic anchor", reviewStatus: "machine-candidate"
  }));
}
function yearPass(record, events, topics, moments, fan, recurring, characterCues, existing, evidence, yearSnapshot) {
  const year = Number(String(record.upload_date || "").slice(0, 4) || 0);
  if (year !== 2026) return null;
  const duration = Number(record.duration || 0);
  const usableRoutes = moments.concat(fan).filter((route) => Number.isFinite(Number(route.t)));
  const segmentCount = duration >= 10800 ? 6 : duration >= 5400 ? 5 : 4;
  const sceneBeats = Array.from({ length: segmentCount }, (_, index) => {
    const from = Math.round(duration * index / segmentCount);
    const to = Math.round(duration * (index + 1) / segmentCount);
    const localMoments = moments.filter((moment) => moment.t >= from && moment.t < to);
    const localFans = fan.filter((signal) => signal.t >= from && signal.t < to);
    const localCharacters = characterCues.filter((character) => character.first >= from && character.first < to);
    const localTopics = topics.filter((topic) => (topic.at || topic.peak || topic.first || 0) >= from && (topic.at || topic.peak || topic.first || 0) < to);
    const topic = localTopics.slice().sort((a, b) => Number(b.mentions || 0) - Number(a.mentions || 0))[0]
      || topics.slice().sort((a, b) => Math.abs(Number(a.at || a.peak || a.first || 0) - (from + to) / 2) - Math.abs(Number(b.at || b.peak || b.first || 0) - (from + to) / 2))[0];
    const moment = localMoments.slice().sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(a.t || 0) - Number(b.t || 0))[0]
      || usableRoutes.slice().sort((a, b) => Math.abs(Number(a.t || 0) - (from + to) / 2) - Math.abs(Number(b.t || 0) - (from + to) / 2))[0];
    const label = clean(topic?.name || moment?.category || moment?.label || "OPEN ROOM");
    const at = Math.round(Number(moment?.t ?? topic?.at ?? topic?.peak ?? from) || from);
    const lane = clean(moment?.category || moment?.label || "TOPIC DOOR");
    const routeExcerpt = excerpt(moment?.excerpt || topic?.receipt || "", 18);
    return {
      act: index + 1, from, to, at, label, lane,
      topic: topic?.name || null,
      receipt: routeExcerpt,
      momentCandidates: localMoments.length,
      fanSignals: localFans.length,
      characterCues: localCharacters.reduce((sum, character) => sum + (character.receipts || []).length, 0),
      description: `${label} is the clearest searchable door in this stretch of the source. The map holds ${localMoments.length} moment candidate${localMoments.length === 1 ? "" : "s"}, ${localFans.length} fan signal${localFans.length === 1 ? "" : "s"}, and ${localCharacters.reduce((sum, character) => sum + (character.receipts || []).length, 0)} character cue${localCharacters.reduce((sum, character) => sum + (character.receipts || []).length, 0) === 1 ? "" : "s"}. Open ${clock(at)} for the actual exchange.`,
      evidenceBasis: events.length ? "2026 second-pass caption route; machine-surfaced" : "2026 second-pass source dossier route; machine-surfaced",
      reviewStatus: "machine-candidate"
    };
  });
  const laneTotals = recurring.slice().sort((a, b) => Number(b.candidateCount || 0) - Number(a.candidateCount || 0)).map((lane) => ({ key: lane.key, label: lane.label, candidateCount: Number(lane.candidateCount || 0), receipts: Number(lane.receipts?.length || 0) }));
  const characterReceipts = characterCues.reduce((sum, character) => sum + (character.receipts || []).length, 0);
  const eventCount = Number(evidence?.eventsAudited || evidence?.eventsObserved || events.length || 0);
  const crossCheck = yearSnapshot ? {
    observedAt: yearCanon.observedAt || null,
    showShape: clean(yearSnapshot.editorial?.showShape || ""),
    signature: clean(yearSnapshot.editorial?.signature || ""),
    note: "Retained as a cross-check from the earlier 2025–2026 machine pass; it does not upgrade this source's review state."
  } : null;
  return {
    version: "2026-wave-01",
    label: "2026 SECOND PASS // MACHINE ROUTE MAP",
    status: "machine-repass",
    note: `This 2026 file was run through the second-pass route map: ${topics.length} topic doors, ${moments.length} moment candidates, ${fan.length} fan signals, and ${characterReceipts} character cue receipts across ${clock(duration)}. It is built to make the source easier to explore; it is not a diarized transcript or a claim of human review.`,
    density: { durationSeconds: duration, eventsAudited: eventCount, wordsAudited: Number(existing?.wordsAudited || words(events.map((event) => event.text).join(" ")).length), topicDoors: topics.length, momentCandidates: moments.length, fanSignals: fan.length, characterCueReceipts: characterReceipts, recurringBitCues: recurring.reduce((sum, lane) => sum + Number(lane.candidateCount || 0), 0), evidenceTier: existing ? (completionById.has(record.id) ? "completion-dossier" : deepById.has(record.id) || freshById.has(record.id) ? "distill-dossier" : "caption-ledger") : "caption-ledger" },
    laneTotals, sceneBeats, crossCheck,
    sourceAuthority: "Official WWAM upload; captions are navigation, playback is the authority."
  };
}
const episodes = canonicalMetadata.map((record) => {
  const id = record.id;
  const events = captionEvents(id);
  const existing = completionById.get(id) || deepById.get(id) || freshById.get(id) || null;
  const mode = existing?.contentMode || inferMode(record.title);
  const restricted = RESTRICTED_MODES.has(mode) && existing && existing.moments && existing.moments.length === 0;
  const topics = normalizeTopics(existing?.topics || derivedTopics(events, record.title));
  const moments = normalizeMoments(existing?.moments, restricted).length ? normalizeMoments(existing?.moments, restricted) : derivedMoments(events, Number(record.duration || 0), restricted);
  const fan = fanSignals(events, Number(record.duration || 0));
  const chapterList = chapters(Number(record.duration || 0), moments, topics, restricted);
  const yearSnapshot = yearCanonById.get(id) || null;
  const shape = inferShape(record.title, mode, existing, yearSnapshot);
  const series = inferSeries(record.title, mode);
  const tier = completionById.has(id) ? "completion-dossier" : deepById.has(id) || freshById.has(id) ? "distill-dossier" : events.length ? "caption-ledger" : "source-brief";
  const watchPassRaw = livestreamAudio.episodes?.[id] || watchPilot.episodes?.[id] || null;
  const audioCandidates = Array.isArray(watchPassRaw?.candidates) ? watchPassRaw.candidates : [];
  const listeningRoutes = audioCandidates.map((candidate) => ({
    ...candidate,
    excerpt: normalizeCaptionText(candidate.captionExcerpt || candidate.excerpt || ""),
    evidenceBasis: candidate.evidenceBasis || "source-local listening route",
    reviewStatus: candidate.reviewStatus || "machine-candidate"
  }));
  const decodedAudio = watchPassRaw?.status === "audio-feature-pass" && watchPassRaw?.media?.canonicalAudioAvailable !== false;
  const audioStrongest = audioCandidates.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || Number(left.t || 0) - Number(right.t || 0))[0] || null;
  const audioSignalMix = Array.isArray(watchPassRaw?.listeningDigest?.signalMix)
    ? watchPassRaw.listeningDigest.signalMix
    : Object.entries(watchPassRaw?.audit?.candidateCategories || {}).sort((left, right) => Number(right[1]) - Number(left[1])).map(([label, count]) => `${label} (${count})`);
  const audioLine = decodedAudio && audioCandidates.length
    ? `The decoded audio pass adds ${audioCandidates.length} listening routes; its strongest acoustic lane is ${clock(audioStrongest?.t || 0)} // ${audioStrongest?.category || "SOURCE RECEIPT"}. ${audioSignalMix.length ? `The mix leans ${audioSignalMix.slice(0, 3).join(", ")}.` : ""} That is an evidence-backed browse cue, not proof of a joke, speaker, or visual reaction.`
    : watchPassRaw && audioCandidates.length
      ? `The caption-only fallback retains ${audioCandidates.length} source-local routes; its strongest caption lane is ${clock(audioStrongest?.t || 0)} // ${audioStrongest?.category || "SOURCE RECEIPT"}. These are navigation cues only because no decoded audio pass is attached.`
      : "No decoded audio pass is attached to this file; caption routes remain navigation only.";
  const topicNames = topics.slice(0, 3).map((topic) => topic.name);
  const topicRead = topicNames.length === 1 ? topicNames[0] : topicNames.length === 2 ? `${topicNames[0]} and ${topicNames[1]}` : topicNames.length > 2 ? `${topicNames.slice(0, -1).join(", ")}, and ${topicNames.at(-1)}` : "the night's open mic";
  const lead = mode === "ranking-show" ? "A bracket-and-ranking night" : mode === "trailer-reaction" ? "A trailer-and-news night" : mode === "movie-commentary" ? "A movie watchalong" : mode === "q-and-a" ? "A fan-mail night" : mode === "spoiler-review" ? "A spoiler-heavy review night" : "An open-line movie-news night";
  const hotLane = moments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0]?.category;
  const hotMoment = moments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || Number(left.t || 0) - Number(right.t || 0))[0] || null;
  const currentYear = Number(String(record.upload_date || "").slice(0, 4) || 0);
  const summaryVariant = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0) % 4;
  const hookLine = hotMoment ? `The first door worth pressing is ${clock(hotMoment.t)} // ${hotLane || hotMoment.category}; open that timestamp to hear the exchange.` : "No bounded tape hook survived this evidence tier.";
  const fanLine = fan.length ? `The file also keeps ${fan.length} ${fan.length === 1 ? "fan-signal receipt" : "fan-signal receipts"} in the room.` : "No fan-signal cluster was retained in this ledger.";
  const ledgerSummary = [
    `${lead} from ${dateFrom(record.upload_date)}. The caption map opens on ${topicRead}, with ${moments.length} timestamp candidates across ${clock(record.duration)}. ${hookLine} ${fanLine}`,
    `If you are dropping into this ${shape.toLowerCase()}, start with ${topicRead}. The ledger marks ${moments.length} places to press play across ${clock(record.duration)}; ${hookLine} ${fanLine}`,
    `The shape of the night is ${shape.toLowerCase()}. The clearest doors are ${topicRead}. There are ${moments.length} bounded routes across ${clock(record.duration)}. ${hookLine} ${fanLine}`,
    `This ${shape.toLowerCase()} has indexed doors on ${topicRead}. The source-local map surfaces ${moments.length} candidates across ${clock(record.duration)}. ${hookLine} ${fanLine}`
  ][summaryVariant];
  const secondPassSummary = currentYear === 2026
    ? `The 2026 second pass maps this ${shape.toLowerCase()} through ${topicRead}. It keeps ${topics.length} topic doors, ${moments.length} moment candidates, ${fan.length} ${fan.length === 1 ? "fan-signal receipt" : "fan-signal receipts"}, and ${characterCues(events, Number(record.duration || 0)).reduce((sum, character) => sum + character.receipts.length, 0)} character cue receipts across ${clock(record.duration)}. Start at ${hookLine.replace(/\.$/, "")} and use the scene beats below as a route through the night. Playback remains the authority; captions do not certify a speaker or intent.`
    : null;
  const summary = clean(existing?.summary || secondPassSummary || (events.length
    ? `${ledgerSummary} Captions are navigation, not a final quote or speaker verdict—open a receipt and hear the full exchange.`
    : `A source brief for ${clean(record.title)}. Metadata is preserved, but no local caption route survived for a responsible episode breakdown.`));
  const evidence = existing?.captionEvidence || { type: events.length ? "youtube-automatic-caption" : "metadata-only", eventsAudited: events.length, speakerDiarized: false, originAttribution: false, reviewStatus: events.length ? "machine-candidate" : "held" };
  const cueList = characterCues(events, Number(record.duration || 0));
  const recurring = recurringBits(events, moments, fan, Number(record.duration || 0), listeningRoutes);
  const note = tapeNote(record.title, shape, topics, moments, fan, recurring, cueList, listeningRoutes);
  const generatedSummary = currentYear === 2026 || machineShapedSummary(summary)
    ? voiceSummary(record.title, dateFrom(record.upload_date), shape, topics, moments, fan, recurring, cueList, tier, listeningRoutes)
    : summary;
  const finalSummary = clean(`${generatedSummary} ${audioLine}`);
  const pass = yearPass(record, events, topics, moments, fan, recurring, cueList, existing, evidence, yearSnapshot);
  const watchPass = watchPassRaw ? {
    ...watchPassRaw,
    candidates: (watchPassRaw.candidates || []).map((candidate) => {
      const captionExcerpt = normalizeCaptionText(candidate.captionExcerpt || "");
      return { ...candidate, captionExcerpt: captionExcerpt || "No caption fragment aligned; open the source and listen to this acoustic window.", captionAligned: Boolean(captionExcerpt) };
    })
  } : null;
  const rssAudioPass = livestreamRssAudio.records?.[id] || null;
  return {
    id, title: clean(record.title), date: dateFrom(record.upload_date), duration: Number(record.duration || 0), durationLabel: clock(record.duration), views: Number(record.view_count || 0),
    thumbnail: record.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, url: `https://www.youtube.com/watch?v=${id}`, channel: record.channel || "WeWatchedAMovie", publicSource: true,
    format: mode, seriesKey: series.key, seriesTitle: series.label, year: Number(String(record.upload_date || "").slice(0, 4) || 0),
    sourceInAtlas: atlasById.has(id), latestOutsideAtlas: !atlasById.has(id), atlasCoverage: atlasById.get(id)?.coverage || null, archiveLanes: atlasById.get(id)?.lanes || [],
    evidenceTier: tier, captioned: Boolean(events.length || existing?.captioned), wordsAudited: Number(existing?.wordsAudited || words(events.map((event) => event.text).join(" ")).length),
    topics, conversationThreads: conversationThreads(topics), moments, chapters: chapterList, heatmap: existing?.heatmap?.length ? existing.heatmap : heatmap(Number(record.duration || 0), events, moments, topics), fanSignals: normalizeFanSignals(fan),
    recurringBits: recurring, bestBits: bestBits(moments, fan, listeningRoutes), characterCues: cueList,
    characters: existing?.characters || characters(events), peak: existing?.peak || moments.slice().sort((a, b) => b.score - a.score)[0] || null,
    yearPass: pass, watchPass, rssAudioPass,
    dossier: { summary: finalSummary, tapeNote: clean(`${note} ${audioLine}`), archiveSummary: currentYear === 2026 && existing?.summary ? clean(existing.summary) : null, shape, hook: hotMoment ? { at: Number(hotMoment.t || 0), category: hotMoment.category || hotMoment.label || "SOURCE RECEIPT", excerpt: hotMoment.excerpt || "", evidenceBasis: hotMoment.evidenceBasis || "source-local caption candidate", reviewStatus: hotMoment.reviewStatus || "machine-candidate" } : null, audioRead: watchPassRaw ? { mode: decodedAudio ? "decoded-audio" : "caption-only", routeCount: audioCandidates.length, strongest: audioStrongest ? { t: Number(audioStrongest.t || 0), category: audioStrongest.category || audioStrongest.label || "SOURCE RECEIPT", score: Number(audioStrongest.score || 0) } : null, signalMix: audioSignalMix.slice(0, 8), evidence: decodedAudio ? "Decoded canonical audio re-ranked source-local windows; playback remains the authority." : "Caption-only source-local routes; no acoustic intensity claim is made." } : null, whyItMatters: clean(existing?.editorial?.whyItMatters || `This episode is part of the ${series.label} shelf. Its evidence tier is ${tier}; the official upload remains the authority for delivery, speaker, and intent. Use the bounded receipts as navigation, then play the source before treating the caption surface as a quote.`), evidence, restricted, reviewStatus: tier === "source-brief" ? "held-source-brief" : tier === "completion-dossier" ? "distilled-machine-candidate" : "machine-surfaced" }
  };
}).sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));

// Repeated livestream titles are legitimate (the channel reused the same
// weekly headline), but a title-only card makes two tapes indistinguishable.
// Keep the source title intact for search and provenance, and add a derived
// navigation title only when a collision exists. Same-day duplicates receive a
// short source-id suffix so every card still has a stable human-facing handle.
const titleGroups = new Map();
episodes.forEach((episode) => {
  const key = clean(episode.title).toLowerCase();
  if (!titleGroups.has(key)) titleGroups.set(key, []);
  titleGroups.get(key).push(episode);
});
titleGroups.forEach((group) => {
  if (group.length < 2) return;
  const dateCounts = new Map();
  group.forEach((episode) => dateCounts.set(episode.date, (dateCounts.get(episode.date) || 0) + 1));
  group.forEach((episode) => {
    const sameDay = Number(dateCounts.get(episode.date) || 0) > 1;
    const suffix = sameDay ? `${episode.date} // TAPE ${episode.id.slice(0, 6)}` : episode.date;
    episode.displayTitle = `${episode.title} // ${suffix}`;
  });
});

const seriesMap = new Map();
episodes.forEach((episode) => {
  if (!seriesMap.has(episode.seriesKey)) seriesMap.set(episode.seriesKey, { key: episode.seriesKey, title: episode.seriesTitle, episodeIds: [], totalDuration: 0, latestDate: episode.date, formats: new Set() });
  const series = seriesMap.get(episode.seriesKey); series.episodeIds.push(episode.id); series.totalDuration += episode.duration; series.formats.add(episode.format);
});
const series = Array.from(seriesMap.values()).map((item) => ({ ...item, formats: Array.from(item.formats), episodeCount: item.episodeIds.length }));
const years = {};
episodes.forEach((episode) => { years[episode.year] = (years[episode.year] || 0) + 1; });
function buildYearIndex(year) {
  const set = episodes.filter((episode) => episode.year === year);
  if (!set.length) return null;
  const topicMap = new Map();
  const laneMap = new Map();
  const monthMap = new Map();
  set.forEach((episode) => {
    const month = String(episode.date || "").slice(0, 7) || "unknown";
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
    episode.topics.forEach((topic) => {
      if (!topicMap.has(topic.name)) topicMap.set(topic.name, { name: topic.name, mentions: 0, episodeIds: [] });
      const item = topicMap.get(topic.name); item.mentions += Number(topic.mentions || 0); if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id);
    });
    episode.recurringBits.forEach((lane) => {
      if (!laneMap.has(lane.key)) laneMap.set(lane.key, { key: lane.key, label: lane.label, candidateCount: 0, episodeIds: [] });
      const item = laneMap.get(lane.key); item.candidateCount += Number(lane.candidateCount || 0); if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id);
    });
  });
  const passEpisodes = set.filter((episode) => episode.yearPass);
  const evidenceMix = {};
  set.forEach((episode) => { evidenceMix[episode.evidenceTier] = (evidenceMix[episode.evidenceTier] || 0) + 1; });
  return {
    year, label: `${year} SECOND PASS // YEAR AT A GLANCE`, episodeCount: set.length, episodeIds: set.map((episode) => episode.id), months: Object.fromEntries(Array.from(monthMap.entries()).sort()),
    totalDurationSeconds: set.reduce((sum, episode) => sum + episode.duration, 0), totalViewsSnapshot: set.reduce((sum, episode) => sum + episode.views, 0), wordsAudited: set.reduce((sum, episode) => sum + episode.wordsAudited, 0),
    captionBacked: set.filter((episode) => episode.captioned).length, sourceBriefs: set.filter((episode) => episode.evidenceTier === "source-brief").length,
    topicDoors: set.reduce((sum, episode) => sum + episode.topics.length, 0), momentCandidates: set.reduce((sum, episode) => sum + episode.moments.length, 0), fanSignals: set.reduce((sum, episode) => sum + episode.fanSignals.length, 0),
    characterCueReceipts: set.reduce((sum, episode) => sum + episode.characterCues.reduce((inner, character) => inner + character.receipts.length, 0), 0), recurringBitCues: set.reduce((sum, episode) => sum + episode.recurringBits.reduce((inner, lane) => inner + Number(lane.candidateCount || 0), 0), 0),
    topTopics: Array.from(topicMap.values()).sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name)).slice(0, 12),
    topLanes: Array.from(laneMap.values()).sort((a, b) => b.candidateCount - a.candidateCount || a.label.localeCompare(b.label)), evidenceMix,
    passEpisodes: passEpisodes.length, note: `All ${set.length} official ${year} source records are present. This is a machine-surfaced second pass built for navigation and comparison; playback remains the authority and human review is still required for speaker, intent, visual context, and final clip selection.`
  };
}
const yearIndex = Object.fromEntries(Object.keys(years).sort((left, right) => Number(right) - Number(left)).map((year) => [year, buildYearIndex(Number(year))]));
const topicMap = new Map();
episodes.forEach((episode) => episode.topics.forEach((topic) => {
  if (!topicMap.has(topic.name)) topicMap.set(topic.name, { name: topic.name, mentions: 0, episodeIds: [], latest: topic.at });
  const item = topicMap.get(topic.name); item.mentions += topic.mentions; item.episodeIds.push(episode.id); item.latest = Math.max(item.latest || 0, topic.at || 0);
}));
const topicIndex = Array.from(topicMap.values()).sort((a, b) => b.mentions - a.mentions).slice(0, 60);
const fanHallMap = new Map();
episodes.forEach((episode) => episode.fanSignals.forEach((signal) => {
  const key = signal.signalType || "CHAT / FAN CALLOUT";
  if (!fanHallMap.has(key)) fanHallMap.set(key, { key, label: key, receipts: 0, episodeIds: [], firstDate: episode.date, latestDate: episode.date });
  const item = fanHallMap.get(key); item.receipts += 1; if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id); item.firstDate = item.firstDate < episode.date ? item.firstDate : episode.date; item.latestDate = item.latestDate > episode.date ? item.latestDate : episode.date;
}));
const fanHall = Array.from(fanHallMap.values()).sort((a, b) => b.receipts - a.receipts || a.label.localeCompare(b.label));
const characterMap = new Map();
episodes.forEach((episode) => episode.characterCues.forEach((character) => {
  const key = character.key;
  if (!characterMap.has(key)) characterMap.set(key, { key, name: character.name, mentions: 0, episodeIds: [], receipts: 0, firstDate: episode.date, latestDate: episode.date });
  const item = characterMap.get(key); item.mentions += character.mentions; item.receipts += character.receipts.length; if (!item.episodeIds.includes(episode.id)) item.episodeIds.push(episode.id); item.firstDate = item.firstDate < episode.date ? item.firstDate : episode.date; item.latestDate = item.latestDate > episode.date ? item.latestDate : episode.date;
}));
const characterIndex = Array.from(characterMap.values()).sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name));
const audioPassCoverage = { ...(livestreamAudio.coverage || {}) };
const canonicalAudioIds = new Set(Object.entries(livestreamAudio.episodes || {}).filter(([, record]) => record?.status === "audio-feature-pass").map(([id]) => id));
const alternateAudioIds = new Set(episodes.filter((episode) => episode.rssAudioPass?.status === "rss-audio-feature-pass" && !canonicalAudioIds.has(episode.id)).map((episode) => episode.id));
audioPassCoverage.alternateAudio = alternateAudioIds.size;
audioPassCoverage.alternateAudioSeconds = episodes.filter((episode) => alternateAudioIds.has(episode.id)).reduce((sum, episode) => sum + Number(episode.rssAudioPass?.media?.durationSeconds || 0), 0);
audioPassCoverage.effectiveAudioAnalyzed = Number(audioPassCoverage.audioAnalyzed || 0) + alternateAudioIds.size;
audioPassCoverage.effectiveHeld = Math.max(0, episodes.length - audioPassCoverage.effectiveAudioAnalyzed);
const stats = {
  episodes: episodes.length, atlasRecords: atlas.records?.length || 0, latestOutsideAtlas: episodes.filter((episode) => episode.latestOutsideAtlas).length,
  completionDossiers: episodes.filter((episode) => episode.evidenceTier === "completion-dossier").length, distillDossiers: episodes.filter((episode) => episode.evidenceTier === "distill-dossier").length,
  captionLedgers: episodes.filter((episode) => episode.evidenceTier === "caption-ledger").length, sourceBriefs: episodes.filter((episode) => episode.evidenceTier === "source-brief").length,
  captionBacked: episodes.filter((episode) => episode.captioned).length, totalDurationSeconds: episodes.reduce((sum, episode) => sum + episode.duration, 0), totalViewsSnapshot: episodes.reduce((sum, episode) => sum + episode.views, 0),
  fanSignalReceipts: episodes.reduce((sum, episode) => sum + episode.fanSignals.length, 0), episodesWithFanSignals: episodes.filter((episode) => episode.fanSignals.length).length,
  recurringBitReceipts: episodes.reduce((sum, episode) => sum + episode.recurringBits.reduce((inner, lane) => inner + lane.candidateCount, 0), 0),
  characterCueReceipts: episodes.reduce((sum, episode) => sum + episode.characterCues.reduce((inner, character) => inner + character.receipts.length, 0), 0),
  yearPassEpisodes: episodes.filter((episode) => episode.yearPass).length,
  audioPassCoverage: audioPassCoverage,
  rssAudioMirrors: Object.keys(livestreamRssAudio.records || {}).length,
  firstDate: episodes.at(-1)?.date || null, lastDate: episodes[0]?.date || null, years
};
const payload = {
  schema: "shokker-wwam-livestream-canon/v1", generated: new Date().toISOString(), observedAt: "2026-07-31",
  sourcePolicy: "Every public WWAM source represented in the local official metadata snapshot is retained. Completion and distill artifacts are reused when present; remaining episodes receive bounded caption-ledger routes or a held source brief. Speaker, intent, visual context, rights, and creator approval are never inferred.",
  scope: { metadataSources: canonicalMetadata.length, rawMetadataSources: metadata.length, captionFiles: fs.readdirSync(CAPTIONS_DIR).filter((file) => file.endsWith(".json")).length, atlasRecords: atlas.records?.length || 0, completionSources: completion.streams?.length || 0, deepSources: deep.streams?.length || 0, freshSources: fresh.streams?.length || 0, yearCanonSources: yearCanon.streams?.length || 0 },
  stats, series, yearIndex, topicIndex, fanHall, characterIndex, episodes
};
fs.writeFileSync(path.join(DEMO, "wwam-livestream-canon.js"), `/* Generated by scripts/generate-wwam-livestream-canon.mjs. */\nwindow.WWAM_LIVESTREAM_CANON = ${JSON.stringify(payload)};\n`);
console.log(`Generated ${episodes.length} livestream episodes; ${stats.completionDossiers} completion dossiers, ${stats.distillDossiers} distill dossiers, ${stats.captionLedgers} caption ledgers, ${stats.sourceBriefs} source briefs.`);
