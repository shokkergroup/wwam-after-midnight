import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DEMO = path.join(ROOT, "public", "demo");
const METADATA_DIR = path.join(ROOT, "source-cache", "metadata");
const CAPTIONS_DIR = path.join(ROOT, "source-cache", "captions");

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

const catalog = catalogContext.WWAM_CATALOG || [];
const deep = deepContext.WWAM_DEEP_DISTILL || { tapes: [] };
const guides = guideContext.WWAM_EPISODE_GUIDES || { guides: [] };
const atlas = atlasContext.WWAM_ARCHIVE_ATLAS || { records: [] };
const overrides = overridesContext.WWAM_TITLE_TOPIC_OVERRIDES || { topics: [] };

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
  ["KrBhfGxsJNM", { franchiseKey: "halloween", franchiseTitle: "Halloween", movieKey: "halloween-4", movieTitle: "Halloween 4: The Return of Michael Myers", type: "watch-party", note: "2024 public watch-party repeat" }],
  ["QxJyVaAgZ_Y", { franchiseKey: "friday-the-13th", franchiseTitle: "Friday the 13th", movieKey: "friday-the-13th-part-4", movieTitle: "Friday the 13th: The Final Chapter", type: "watch-along", note: "2024 public watch-along repeat" }]
]);

const includedIds = new Set(catalog.map((record) => record.id));
metadata.forEach((record) => {
  if (/commentary/i.test(record.title)) includedIds.add(record.id);
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
  const file = path.join(CAPTIONS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return [];
  const payload = readJson(file);
  return (payload.events || []).filter((event) => Array.isArray(event.segs) && event.segs.length)
    .map((event) => ({
      t: Math.max(0, Number(event.tStartMs || 0) / 1000),
      end: Math.max(0, Number(event.tStartMs || 0) / 1000 + Number(event.dDurationMs || 0) / 1000),
      text: normalizeCaptionText(event.segs.map((segment) => segment && segment.utf8 || "").join(""))
    }))
    .filter((event) => event.text);
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
    .map((item) => ({ name: item.name, ...item.data, evidence: { type: "youtube-automatic-caption", timestampStatus: "caption-event", excerptStatus: "short-caption-fragment", speakerStatus: "not-diarized", reviewStatus: "machine-candidate" } }));
  const chapters = [0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
    const at = Math.round((duration || events.at(-1).end) * index / 8);
    const nearest = candidates.slice().sort((left, right) => Math.abs(left.t - at) - Math.abs(right.t - at))[0];
    return nearest ? { id: `act-${String(index + 1).padStart(2, "0")}`, act: index + 1, label: `${nearest.label} // ${nearest.category}`, at: nearest.t, end: nearest.end, body: `The source-local caption ledger puts ${nearest.label.toLowerCase()} at ${formatTimestamp(nearest.t)}. The jump is a machine candidate; open the tape before treating the line as a final read.`, excerpt: nearest.excerpt, category: nearest.category, cutId: nearest.id, evidenceBasis: nearest.evidenceBasis } : null;
  }).filter(Boolean);
  return { moments: candidates, topics: topicTerms, chapters, captionWords: words(events.map((event) => event.text).join(" ")).length, captionEvents: events.length };
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
  const title = clean(metadataRecord.title);
  return { franchiseKey: "uncategorized", franchiseTitle: "Uncategorized", movieKey: slug(title), movieTitle: title, type: "source-watchalong", note: "title-derived source record" };
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
  const aliases = [taxonomy.movieTitle, taxonomy.franchiseTitle, taxonomy.movieTitle.replace(/\s*\([^)]*\)/g, "")].filter(Boolean);
  // A deep record without a matching human guide is still useful when the local
  // caption ledger can provide bounded route receipts. Keep the evidence state
  // honest, but do not leave the episode as an empty shell.
  const derived = (!deepRecord || !guide) ? candidateMoments(events, duration, aliases) : null;
  const sourceTopics = (overrideById.get(id) || []).map((topic) => ({ name: topic.label, first: topic.firstAt, peak: topic.peakAt, mentions: topic.mentions, receipt: excerpt(topic.excerpt), evidenceBasis: topic.evidenceBasis }));
  const guideCuts = guide?.cuts || [];
  const moments = deepRecord && guide ? (deepRecord.moments || []).map((moment) => ({ ...moment, t: Number(moment.t || 0), end: Number(moment.end || moment.t || 0), excerpt: excerpt(moment.quote || moment.excerpt), reviewStatus: "distilled-editorial-candidate" })) : derived.moments;
  const chapters = deepRecord && guide ? (guide?.chapters || []).map((chapter) => ({ ...chapter, excerpt: excerpt(chapter.excerpt), body: clean(chapter.body) })) : derived.chapters;
  const topics = deepRecord && guide ? (guide?.threads || []).slice(0, 10).map((thread) => ({ name: thread.name, mentions: thread.mentions, first: thread.first, peak: thread.peak, cluster: thread.cluster, receipt: excerpt(thread.receipt), kind: thread.kind })) : (sourceTopics.length ? sourceTopics : derived.topics);
  const allMoments = deepRecord && guide ? guideCuts.map((cut) => ({
    id: cut.id, t: Number(cut.t || 0), end: Number(cut.end || cut.t || 0), category: cut.category, label: cut.label || cut.category,
    score: Number(cut.score || 0), excerpt: excerpt(cut.excerpt), topic: cut.topic || null, evidenceBasis: cut.evidenceBasis || "reviewed-guide-cut", reviewStatus: "distilled-editorial-candidate"
  })) : moments;
  const firstMoment = allMoments.slice().sort((left, right) => left.t - right.t)[0] || null;
  const strongestMoment = allMoments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
  const finalMoment = allMoments.slice().sort((left, right) => right.t - left.t)[0] || null;
  const laneCounts = ledgerLaneCounts(allMoments);
  const fanSignals = fanSignalCandidates(events, duration);
  const lanePhrase = Object.entries(laneCounts).sort((left, right) => right[1] - left[1]).slice(0, 3).map(([label, count]) => `${label} (${count})`).join(", ");
  const topicPhrase = topics.slice(0, 5).map((topic) => topic.name).filter((name) => name && !/watch\s*party|commentary|watch\s*along/i.test(name)).slice(0, 3).join(", ");
  const derivedSummary = `This ${taxonomy.type.replace(/-/g, " ")} for ${taxonomy.movieTitle} runs ${formatTimestamp(duration)}. The local caption ledger flags ${allMoments.length} playable leads${lanePhrase ? ` across ${lanePhrase}` : ""}${topicPhrase ? `, with the conversation repeatedly touching ${topicPhrase}` : ""}. It is a navigation dossier rather than a speaker-diarized transcript: press the timestamp, hear the full exchange, and decide whether the lead earns a place in the permanent cut.`;
  const summary = guide?.overview || (deepRecord && !guide
    ? `This catalog entry is held as a source brief for ${taxonomy.movieTitle}. The public upload and its archived editorial note are preserved, while the local caption ledger contributes ${allMoments.length} machine-found route receipts. Press play before treating any line as a reviewed quote.`
    : deepRecord?.verdict || derivedSummary);
  const dossier = {
    state: deepRecord && guide ? "full-editorial-dossier" : deepRecord ? "source-brief-dossier" : "caption-ledger-dossier",
    summary: clean(summary),
    evidenceSummary: guide?.evidenceSummary || `The source ledger contains ${events.length.toLocaleString("en-US")} caption events and ${(deepRecord?.wordsAudited || derived?.captionWords || 0).toLocaleString("en-US")} caption words. These timestamps are machine-found leads, not speaker-diarized quotes; press play before treating a line as canon.`,
    shape: guide?.shape || { runtimeBand: duration >= 9000 ? "MARATHON" : duration >= 5400 ? "FEATURE" : "SHORT", chapters: chapters.length, threads: topics.length, cuts: allMoments.length },
    fanRead: guide?.fanRead || (deepRecord ? null : ledgerFanRead(allMoments, finalMoment)),
    fanSignals,
    laneCounts,
    chapters,
    cuts: allMoments,
    route: { opening: firstMoment, strongest: strongestMoment, closing: finalMoment },
    caption: { words: deepRecord?.wordsAudited || derived?.captionWords || 0, events: events.length, minutes: deepRecord?.captionMinutes || Math.round(duration / 60), sourceFile: `source-cache/captions/${id}.json` }
  };
  return {
    id, title: clean(metadataRecord.title), date, duration, durationLabel: formatTimestamp(duration), views: Number(metadataRecord.view_count || 0),
    thumbnail: metadataRecord.thumbnail || catalogRecord?.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`, channel: metadataRecord.channel || "WeWatchedAMovie", channelId: metadataRecord.channel_id || null,
    publicSource: true, publicSourceBasis: "official cached YouTube metadata + local caption file", availability: atlasRecord?.availability || "public-source-snapshot",
    atlasCoverage: atlasRecord?.coverage || (deepRecord ? "catalog-distilled" : "caption-backed-local"), lanes: atlasRecord?.lanes || [],
    type: taxonomy.type, note: taxonomy.note, repeat: !catalogRecord, catalogMember: Boolean(catalogRecord), catalogOrder: catalogRecord?.order || null,
    franchiseKey: taxonomy.franchiseKey, franchiseTitle: taxonomy.franchiseTitle, movieKey: taxonomy.movieKey, movieTitle: taxonomy.movieTitle,
    aliases, transcript: Boolean(events.length || deepRecord?.wordsAudited), captioned: Boolean(events.length || deepRecord?.wordsAudited), deepIndexed: Boolean(deepRecord),
    topics, sourceTopics, dossier, metrics: deepRecord?.metrics || null, unhinged: deepRecord?.unhinged || null, verdict: deepRecord?.verdict || null,
    editorial: deepRecord?.arc ? { arc: deepRecord.arc, moments: moments } : { arc: chapters.map((chapter) => ({ chapter: chapter.act, at: chapter.at, dominant: chapter.category })), moments }
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

const titleCandidates = metadata.filter((record) => /commentary|watch party|watch along/i.test(record.title));
const excludedWatchalongCandidates = metadata.filter((record) => /watch|commentary/i.test(record.title) && !includedIds.has(record.id)).slice(0, 100).map((record) => ({ id: record.id, title: record.title, date: dateFrom(record.upload_date), reason: "title suggests watching or commentary, but no movie-specific watchalong signal was promoted into this canon" }));
const payload = {
  schema: "shokker-wwam-watchalong-canon/v1",
  generated: new Date().toISOString(),
  observedAt: "2026-07-30",
  sourcePolicy: "Official cached WWAM YouTube metadata and local caption files. Existing curated 39-tape dossiers are retained; title-explicit public commentaries and movie watch parties outside that set are added as caption-ledger or held source-brief dossiers. No speaker, intent, rights, or creator-approval claim is inferred.",
  scope: { metadataSources: metadata.length, titleCandidates: titleCandidates.length, episodes: episodes.length, captionFiles: fs.readdirSync(CAPTIONS_DIR).filter((file) => file.endsWith(".json")).length },
  stats: {
    episodes: episodes.length, deepDossiers: episodes.filter((episode) => episode.dossier.state === "full-editorial-dossier").length, captionLedgers: episodes.filter((episode) => episode.dossier.state === "caption-ledger-dossier").length, sourceBriefs: episodes.filter((episode) => episode.dossier.state === "source-brief-dossier").length, nonFullAdditions: episodes.filter((episode) => episode.dossier.state !== "full-editorial-dossier").length,
    franchises: franchises.length, movieGroups: groups.length, repeatedMovies: groups.filter((group) => group.repeatCount > 0).length,
    totalDurationSeconds: episodes.reduce((sum, episode) => sum + episode.duration, 0), totalViewsSnapshot: episodes.reduce((sum, episode) => sum + episode.views, 0),
    fanSignalReceipts: episodes.reduce((sum, episode) => sum + Number(episode.dossier?.fanSignals?.length || 0), 0),
    episodesWithFanSignals: episodes.filter((episode) => Number(episode.dossier?.fanSignals?.length || 0) > 0).length,
    firstDate: episodes[0]?.date || null, lastDate: episodes.at(-1)?.date || null,
    sourceCounts: { catalogCommentaries: catalog.length, titleCommentaries: titleCandidates.filter((record) => /commentary/i.test(record.title)).length, explicitWatchParties: explicitExtras.size - 9 }
  },
  taxonomy: { groups: groups.map((group) => ({ key: group.key, title: group.title, franchiseKey: group.franchiseKey })), aliases: Object.fromEntries(episodes.map((episode) => [episode.id, episode.aliases])) },
  franchises, groups, episodes, discovery: { titleCandidates: titleCandidates.map((record) => ({ id: record.id, title: record.title, date: dateFrom(record.upload_date), included: includedIds.has(record.id) })), excludedWatchalongCandidates }
};

const output = `/* Generated by scripts/generate-wwam-watchalong-canon.mjs. Source-bounded WWAM public watchalong registry. */\nwindow.WWAM_WATCHALONG_CANON = ${JSON.stringify(payload)};\n`;
fs.writeFileSync(path.join(PUBLIC_DEMO, "wwam-watchalong-canon.js"), output);
console.log(`Generated ${episodes.length} episodes, ${groups.length} movie groups, ${franchises.length} franchises.`);
