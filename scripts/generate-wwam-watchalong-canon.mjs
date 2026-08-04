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
  ["sdiVxLTq67Q", { franchiseKey: "wwam-specials", franchiseTitle: "WWAM Specials", movieKey: "wwam-10-year-anniversary", movieTitle: "WWAM 10-Year Anniversary Celebration", type: "special-event", note: "anniversary broadcast; retained as a companion source rather than misclassified as a film commentary" }],
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

function trimDanglingClause(value) {
  const text = clean(value);
  // Do not publish a hard-clipped subordinate clause such as
  // "...because I hate." Keep the complete main clause and leave the rest
  // for the player at the source timestamp.
  const trimmed = text
    .replace(/\s+(?:because|since|although|while|when|if|which|that|who)\s+(?:i|you|he|she|we|they)\s+[a-z0-9'â€™-]+\s*\.?\s*$/i, "")
    .replace(/\s+(?:because|since|although|while|when|if)\s*\.?\s*$/i, "")
    .replace(/\s+(?:in|on|at|for|with|to|of|from)\s+(?:so|the|a|an|this|that|it|one)\s*\.?\s*$/i, "")
    .trim();
  return trimmed || text;
}
function isLikelyFragment(value) {
  const text = clean(value);
  if (/\b(?:is|are|was|were|be|been|being|have|has|had|will|would|could|should|can|do|does|did|going|trying|want|wanted|need|needs|got|made|already|yet|again)\.?\s*$/i.test(text)) return true;
  if (/\b(?:and|but|or|because|since|although|while|when|if|which|that|who|with|for|to|of|about|using|like|as|all)\.?\s*$/i.test(text)) return true;
  return /\b(?:this|that|it)\s+is\s+(?:a|an|the)\s+[a-z0-9'â€™-]+\.?$/i.test(text)
    || /\b(?:because|since|although|while|when|if|which|that|who)\s+(?:i|you|he|she|we|they)\s+[a-z0-9'â€™-]+\.?$/i.test(text);
}

function isNoisyTranscript(value) {
  const text = clean(value);
  return /[,\.]\s*\.$/.test(text)
    || /\b(?:do you do|the both of you|i just don't i|the just the|i saw it in the just the)\b/i.test(text)
    || /\b(?:he|she|it|they|we|you|i)(?:'s|'re|'m)?\s+(?:a|an|the)\s+(?:all|by|with|to|from)\b/i.test(text)
    || /\b(?:like|so|yeah|well)\b.*\b(?:like|so|yeah|well)\b.*\b(?:like|so|yeah|well)\b/i.test(text)
    // Low-confidence decoder joins that look grammatical one word at a time
    // but read as a broken caption on the page. Keep the timestamped door;
    // suppress the false promise of a clean quotation.
    || /\b(?:the|a|an)\s+[a-z][a-z'-]*\s+(?:the|a|an)\s+[a-z][a-z'-]*\b/i.test(text)
    || /\b(?:what|who)\s+the\s+(?:who|what|is|the)\b/i.test(text)
    || /\b(?:got|have|has|was|were|is|are)\s+to\s+(?:this|that)\s+[a-z][a-z'-]*\s+(?:up|down)\b/i.test(text)
    || /^\s*(?:i|you|we|they|he|she)\s+maybe\b/i.test(text)
    || /\b(?:between|because|since|although|while|when|if|which|that|who|from|with|for|to|of|in|on|at|by|probably|perhaps|maybe)\.?$/i.test(text)
    || /[.!?]\s+[a-z]/.test(text)
    || /\b([a-z]{4,})(?:s|es|ed|ing)?\s+\1(?:s|es|ed|ing)?\b/i.test(text)
    || /\b(?:the|a|an)\s+(?:his|her|their|my|your|our|its)\b/i.test(text)
    || /\b(?:all|both|three)\s+(?:of\s+)?those\s+that\s+right\b/i.test(text)
    || /\b(?:these|those)\s+(?:this|that)\s+(?:one|right|is|was)\b/i.test(text)
    || /\bthat(?:'s|\s+is)\s+not\s+that\s+one(?:'s|\s+is)\b/i.test(text)
    || /\b(?:these|those)\s+and\s+these\s+this\b/i.test(text)
    // Preserve the audio route but suppress obvious Whisper boundary joins
    // such as "I If..." or "I it did..." from public clip receipts.
    || /\bI\s+(?:if|what|well|you|she|it|they|he|we)\b/.test(text)
    || /\b(?:I|you|he|she|we|they)\s+(?:I|you|he|she|we|they)\s+(?:did|does|do|don't|can't|won't|was|were|am|is|are|just|got)\b/i.test(text);
}

function sanitizePublicExcerpt(value) {
  let text = clean(value)
    .replace(/^\s*["”]\s*/, "")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  // A bounded caption window can stop after an opening quote. Preserve the
  // words, but remove the dangling marker instead of showing broken dialogue.
  if ((text.match(/"/g) || []).length % 2 === 1) text = text.replace(/"/g, "");
  const smartOpen = (text.match(/[“]/g) || []).length;
  const smartClose = (text.match(/[”]/g) || []).length;
  if (smartOpen !== smartClose) text = text.replace(/[“”]/g, "");
  return text
    .replace(/\b(said|says|asked|asks|was like|were like|be like)\s*,\s+(?=[A-Z])/i, "$1: ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function publicReceiptText(value) {
  const text = sanitizePublicExcerpt(value);
  // Editorial guide cuts can bypass the caption excerpt selector. Run the
  // same source-local splice quarantine here so stale decoder collisions are
  // never copied into the public dossier or cold route index.
  if (!text || /[,.]\s*\.$/.test(text) || /\bwhat the do\b/i.test(text) || isNoisyTranscript(text)) return "";
  return text;
}

function excerpt(value, limit = 16) {
  const normalized = normalizeCaptionText(value)
    .replace(/(?:\s*\.{3,}|\u2026)\s*$/g, "")
    .replace(/^(?:\.{2,}|\u2026)+\s*/g, "")
    .trim();
  if (!normalized) return "";
  const publicLimit = Math.min(16, Math.max(8, Number(limit) || 16));
  // A long punctuation-free window is a playable navigation lead, not a
  // sentence. Keep it out of public prose instead of manufacturing a period
  // around decoder fragments.
  const publicWindow = words(normalized).slice(0, publicLimit).join(" ");
  if (!/[.!?](?:\s|$)/.test(publicWindow) && words(normalized).length > publicLimit) return "";
  const sentenceList = normalized.match(/[^.!?]+[.!?](?=\s*(?:>>\s*)?[A-Za-z0-9"'“‘]|$)/g)?.map((sentence) => sentence.trim()) || [];
  const bounded = (sentence) => {
    const sentenceWords = words(sentence);
    if (sentenceWords.length <= publicLimit) return sentence.trim();
    const clipped = trimDanglingClause(sentenceWords.slice(0, publicLimit).join(" "))
      .replace(/\s+(?:the|a|an|and|or|but|to|of|in|on|for|with|from|that|this|it|i|you|he|she|we|they)$/i, "")
      .trim();
    return /[.!?]$/.test(clipped) ? clipped : `${clipped}.`;
  };
  const candidate = sentenceList.find((sentence) => words(sentence).length >= 8 && !isLikelyFragment(sentence) && !isNoisyTranscript(sentence)) || normalized;
  const text = bounded(candidate);
  let cased = `${text.charAt(0).toUpperCase()}${text.slice(1)}`
    .replace(/\bi\b/g, "I")
    .replace(/\s*>>\s*/g, "")
    .replace(/(?:\.{3,}|\u2026)/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
  for (let pass = 0; pass < 3; pass += 1) {
    cased = cased.replace(/\b([A-Za-z0-9][A-Za-z0-9'-]*)\s+([A-Za-z0-9][A-Za-z0-9'-]*)\s+\1\s+\2\b/gi, "$1 $2");
  }
  cased = trimDanglingClause(cased);
  cased = sanitizePublicExcerpt(cased);
  if (/[,.]\s*\.$/.test(cased) || /\bwhat the do\b/i.test(cased)) return "";
  if (isLikelyFragment(cased) || isNoisyTranscript(cased)) return "";
  return /[.!?]$/.test(cased) ? cased : `${cased}.`;
}

// Podcast enclosures sometimes begin with a baked-in sponsor read or show
// intro. The acoustic ranker can quite reasonably call that loud speech a
// "bit"; the Wiki must not. Keep the receipt playable, but label the boundary
// so a visitor never mistakes an ad for WWAM canon. This is intentionally
// narrow: only explicit ad/intro language near the opening is reclassified.
function podcastBoundaryKind(candidate) {
  const text = normalizeCaptionText(candidate?.captionExcerpt || candidate?.excerpt || "");
  const at = Number(candidate?.t || 0);
  if (at > 240) return null;
  if (/(?:capable device required|coverage not available|some uses may require|at ctmobile\.com|ctmobile\.com|this episode is brought to you|use promo code|sponsored by|download the app)/i.test(text)) {
    return "podcast-ad-or-intro";
  }
  return null;
}

function podcastSignalMix(routes) {
  const counts = routes.reduce((map, route) => {
    const category = clean(route.category || route.label || "PODCAST ROUTE");
    map[category] = (map[category] || 0) + 1;
    return map;
  }, {});
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([category, count]) => `${category} (${count})`);
}

function normalizePodcastCandidate(candidate, index) {
  const boundary = podcastBoundaryKind(candidate);
  const category = boundary ? "PODCAST AD / INTRO" : clean(candidate.category || candidate.label || "PODCAST ROUTE");
  const label = boundary ? "PODCAST AD / INTRO" : clean(candidate.label || candidate.category || "PODCAST ROUTE");
  return {
    ...candidate,
    id: clean(candidate.id || `podcast-route-${index + 1}`),
    category,
    label,
    segmentKind: boundary || "commentary-candidate",
    navigationQuality: boundary ? "ad-boundary" : "commentary-route",
    evidenceBasis: boundary
      ? "official WWAM podcast variant audio + local transcript; ad/intro boundary detected; not a canonical YouTube timestamp"
      : "official WWAM podcast variant audio + local transcript; not a canonical YouTube timestamp",
    reviewStatus: boundary
      ? "podcast-boundary; do not cite as a WWAM bit; playback remains the authority"
      : "audio-feature-candidate; podcast playback remains the authority"
  };
}

// Alternate editions are useful evidence, but their clocks are not
// interchangeable with the canonical YouTube upload. Keep the route index
// small and explicit: it carries the official podcast link, a playable
// enclosure when the feed exposes one, and routes that are visibly bound to
// the podcast clock. It never promotes those seconds into YouTube jumps.
function alternateAudioMeta(watchPassRecord, canonicalDuration) {
  const alternate = watchPassRecord?.alternateAudio;
  if (!alternate) return null;
  let provenance = null;
  const provenanceFile = alternate.provenanceFile || watchPassRecord.provenanceFile;
  if (provenanceFile) {
    const absolute = path.join(ROOT, provenanceFile);
    if (fs.existsSync(absolute)) {
      try { provenance = readJson(absolute); } catch (_error) { provenance = null; }
    }
  }
  const alternateSource = provenance?.alternateSource || {};
  const media = alternate.media || {};
  const alignment = alternate.alignment || {};
  const digest = alternate.listeningDigest || {};
  const routes = (alternate.candidates || []).map((candidate, index) => {
    const normalized = normalizePodcastCandidate(candidate, index);
    return {
    id: normalized.id,
    t: Math.round(Number(candidate.t || 0)),
    end: Math.round(Number(candidate.end || candidate.t || 0)),
    category: normalized.category,
    label: normalized.label,
    score: Number(candidate.score || 0),
    rank: Number(candidate.rank || index + 1),
    excerpt: excerpt(normalizeCaptionText(candidate.captionExcerpt || ""), 28),
    clock: "official WWAM podcast clock",
    segmentKind: normalized.segmentKind,
    navigationQuality: normalized.navigationQuality,
    evidenceBasis: normalized.evidenceBasis,
    reviewStatus: normalized.reviewStatus,
    audio: candidate.audio || null
  }; });
  return {
    status: alternate.status || "alternate-audio-feature-pilot",
    label: alternate.label || "OFFICIAL WWAM PODCAST VARIANT // SEPARATE CLOCK",
    sourceUrl: media.sourceUrl || alternateSource.episodeUrl || null,
    episodeUrl: alternateSource.episodeUrl || media.sourceUrl || null,
    enclosureUrl: media.enclosureUrl || alternateSource.enclosureUrl || null,
    publisher: alternateSource.publisher || "We Watched A Movie Podcast",
    publishedAt: alternateSource.publishedAt || null,
    durationSeconds: Number(media.durationSeconds || alternateSource.probedDurationSeconds || 0),
    canonicalDurationSeconds: Number(canonicalDuration || 0),
    durationDeltaSeconds: Number(alignment.durationDeltaFromCanonicalSeconds || alternateSource.durationDeltaFromCanonicalSeconds || 0),
    timestampIsomorphic: media.canonicalTimestampMapping === true && alignment.exactTimestampMappingEstablished === true,
    candidateCount: routes.length,
    routes,
    signalMix: podcastSignalMix(routes).slice(0, 8),
    strongest: digest.strongest ? { t: Number(digest.strongest.t || 0), category: clean(digest.strongest.category || "PODCAST ROUTE"), score: Number(digest.strongest.score || 0) } : null,
    evidence: clean(digest.evidence || alternate.note || "Podcast routes remain bound to the official podcast player."),
    note: clean(alternate.note || watchPassRecord.note || "This is an official alternate edition; its timestamps remain on its own clock."),
    provenanceFile: provenanceFile || null
  };
}

function normalizeCaptionText(value) {
  let text = clean(value)
    .replace(/\[(?:\s*[_-]+\s*)+\]/g, " ")
    .replace(/\[(?:music|applause|laughter|laughs?|screaming|yelling|shouting|inaudible|bleep)\]/gi, " ")
    .replace(/[_]+/g, " ")
    .replace(/[Â»>]{1,3}(?=\s)/g, " ")
    .replace(/Ã¢â‚¬â„¢/g, "'").replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â/g, '"').replace(/Ã¢â‚¬â€|Ã¢â‚¬â€œ/g, "â€”")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Keep an intentional two-word stutter, but collapse the decoder runs
  // that repeat a token four or more times across adjacent Whisper windows.
  for (let pass = 0; pass < 4; pass += 1) {
    text = text.replace(/\b([A-Za-z][A-Za-z'â€™-]*)\b(?:\s+\1\b){3,}/gi, "$1 $1");
  }
  for (let pass = 0; pass < 3; pass += 1) {
    text = text.replace(/\b([A-Za-z0-9][A-Za-z0-9'-]*)\s+([A-Za-z0-9][A-Za-z0-9'-]*)\s+\1\s+\2\b/gi, "$1 $2");
  }
  return text.replace(/\s{2,}/g, " ").trim();
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
  // Prefer a validated local Whisper ledger when one exists. Automatic
  // captions remain the fallback, but finished audio listening should not sit
  // unused merely because YouTube also supplied a caption track.
  const asrFile = path.join(CAPTIONS_DIR, `${id}.asr.json`);
  if (fs.existsSync(asrFile)) {
    const payload = readJson(asrFile);
    return (payload.segments || []).map((segment) => ({
      t: Math.max(0, Number(segment.start || 0)),
      end: Math.max(0, Number(segment.end || segment.start || 0)),
      text: normalizeCaptionText(segment.text),
      evidenceType: "local-whisper-transcript"
    })).filter((event) => event.text);
  }
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
  return [];
}

// Edge receipts use YouTube's archived .en.json3 filename so they can be
// audited without pretending the upload is a full-film commentary. Keep this
// parser separate from the canonical caption path: the prefix is part of the
// evidence boundary and should stay visible in the dossier.
function edgeCaptionEvents(id) {
  const captionFile = path.join(CAPTIONS_DIR, `edge-${id}.en.json3`);
  if (!fs.existsSync(captionFile)) return [];
  const payload = readJson(captionFile);
  return (payload.events || []).filter((event) => Array.isArray(event.segs) && event.segs.length)
    .map((event) => ({
      t: Math.max(0, Number(event.tStartMs || 0) / 1000),
      end: Math.max(0, Number(event.tStartMs || 0) / 1000 + Number(event.dDurationMs || 0) / 1000),
      text: normalizeCaptionText(event.segs.map((segment) => segment && segment.utf8 || "").join("")),
      evidenceType: "youtube-automatic-caption-edge"
    }))
    .filter((event) => event.text);
}

function captionSourceKind(id) {
  if (fs.existsSync(path.join(CAPTIONS_DIR, `${id}.asr.json`))) return "local-whisper-transcript";
  if (fs.existsSync(path.join(CAPTIONS_DIR, `${id}.json`))) return "youtube-automatic-caption";
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

function nearestCaptionContext(events, at, maxDistance = 75) {
  if (!Array.isArray(events) || !events.length) return null;
  let nearest = null;
  events.forEach((event, index) => {
    const text = clean(event?.text);
    if (!text) return;
    const distance = Math.abs(Number(event.t || 0) - Number(at || 0));
    if (distance > maxDistance || (nearest && distance >= nearest.distance)) return;
    nearest = { event, index, distance };
  });
  if (!nearest) return null;
  const text = excerpt(normalizeCaptionText(captionWindow(events, nearest.index, 5, 10)), 22);
  return text ? { text, at: Number(nearest.event.t || 0), distance: Number(nearest.distance.toFixed(1)) } : null;
}

function ledgerLaneCounts(items) {
  return items.reduce((counts, item) => {
    const key = clean(item.category || item.label || "SOURCE RECEIPT");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function topicIsRelevant(topic, taxonomy) {
  const name = clean(topic?.name);
  if (!name) return false;
  const normalizedName = name.toLowerCase();
  const title = clean(taxonomy?.movieTitle).toLowerCase();
  const franchise = clean(taxonomy?.franchiseTitle).toLowerCase();
  const titleTokens = title.split(/\s+/).filter((token) => token.length >= 4 && !["this", "that", "the", "with", "from", "full", "movie"].includes(token));
  const exactTitleHit = title.includes(normalizedName) || normalizedName.includes(title) || titleTokens.some((token) => normalizedName === token || normalizedName.includes(token));
  const franchiseHit = franchise && (franchise.includes(normalizedName) || normalizedName.includes(franchise));
  return Boolean(exactTitleHit || franchiseHit || Number(topic.mentions || 0) >= 4);
}

function relevantTopics(items, taxonomy) {
  return (items || []).filter((topic) => topicIsRelevant(topic, taxonomy)).slice(0, 6);
}

function watchalongVoiceSummary({ taxonomy, duration, laneCounts, topics, firstMoment, strongestMoment, strongestRouteMoment, finalMoment, allMoments, audioCuts }) {
  const title = clean(taxonomy.movieTitle) || "this source";
  const format = taxonomy.type === "watch-party" ? "watch-party" : taxonomy.type === "watch-along" ? "watch-along" : "commentary";
  const rankedLanes = Object.entries(laneCounts).sort((left, right) => right[1] - left[1]);
  const dominant = rankedLanes[0]?.[0] || "SOURCE RECEIPT";
  const secondary = rankedLanes[1]?.[0] || null;
  const laneNames = {
    "STRAIGHT TO STEVE'S ASSHOLE": "Steve's Asshole",
    "TAKE GETS NUCLEAR": "nuclear takes",
    "ROOM BREAK": "room breaks",
    "CHARACTER SIGNAL": "character bits",
    "WWAM UP IN YA": "dirty detours",
    "FILM READ": "movie talk",
    "FAN SIGNAL": "fan callouts",
    "FULL SEND": "full-send chaos",
    "WATCH ROUTE": "watch-route stops",
    "CLOSING READ": "closing reads"
  };
  const laneName = (label) => laneNames[label] || clean(label).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  const laneText = rankedLanes.slice(0, 3).map(([label, count]) => `${count} ${laneName(label)}`).join(", ");
  // Keep the article attached to the runtime noun. The old form produced
  // visitor copy such as “is marathon-length watch-party,” which reads like a
  // machine label instead of a person describing the show.
  const runtimeRead = duration >= 9000 ? "a marathon" : duration >= 5400 ? "a feature-length" : duration >= 1800 ? "a compact" : "a short";
  const seed = [...title].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 3, 0);
  const openingVariants = {
    "STRAIGHT TO STEVE'S ASSHOLE": [
      `${title} walks in with the knife already out, and the complaints find their target fast.`,
      `The ${title} rewatch arrives carrying a grievance list; Steve's Asshole gets work before the room settles.`,
      `${title} starts with the hate lane taking the first lap. Nobody is pretending this is a polite rewatch.`
    ],
    "TAKE GETS NUCLEAR": [
      `The ${title} room comes out swinging; the first big take makes the movie argue for its life.`,
      `There is no gentle warm-up here. ${title} starts scoring points against the screen.`,
      `${title} opens like somebody insulted a favorite franchise, and the booth answers in kind.`
    ],
    "ROOM BREAK": [
      `${title} gets through the setup and then the room starts coming apart in the fun way.`,
      `The ${title} tape loses its composure early; there is no straight line home.`,
      `${title} stays on course only until the booth finds a new reason to derail itself.`
    ],
    "CHARACTER SIGNAL": [
      `The ${title} watch keeps slipping its leash; the real detours are the voices, bits, and character work.`,
      `${title} has the brakes cut, turning movie talk into a little live radio play.`,
      `The ${title} room cannot leave a character alone. Improv keeps sneaking into the margins.`
    ],
    "WWAM UP IN YA": [
      `${title} keeps taking filthy side roads and somehow making them part of the route.`,
      `The ${title} tape knows exactly where the respectable conversation ends and the dirty detour begins.`,
      `${title} repeatedly opens a trapdoor under the movie and climbs into it.`
    ],
    "FILM READ": [
      `${title} keeps the movie in the room even when the booth starts misbehaving. There is an actual point of view here.`,
      `There is a real film argument underneath the mess in ${title}; the conversation refuses to stay on one lane.`,
      `The jokes in ${title} do not erase the movie talk; they make the argument louder.`
    ],
    "FAN SIGNAL": [
      `${title} gives the audience a genuine turn at the wheel, not just a credits-roll thank-you.`,
      `The ${title} room leaves the door open for the fans, and chat changes the rhythm.`,
      `${title} lets the fan lane interrupt the booth in the best possible way.`
    ]
  };
  const opening = (openingVariants[dominant] || [
      `${title} keeps one eye on the movie and one on whatever the booth finds funny next.`,
    `The ${title} tape keeps the movie moving while the room looks for its next bit.`,
    `${title} is a messy, funny rewatch with more than one way into it.`
  ])[seed];
  const toneVariants = {
    "STRAIGHT TO STEVE'S ASSHOLE": ["The hate lane keeps finding fresh mail for Steve's Asshole.", "The complaints are not decorative; they keep driving the rewatch.", "The tape is happiest when it can point at one more thing and say, absolutely not."],
    "TAKE GETS NUCLEAR": ["The takes hit hard enough that the movie has to keep answering for itself.", "Every weak spot gets an invitation to kick the door in.", "This is affectionate violence: a rewatch with a flamethrower and a memory."],
    "ROOM BREAK": ["The room's best moments arrive when it forgets to behave.", "Every derailment becomes another way through the tape.", "The laughter is not filler; it is the temperature reading."],
    "CHARACTER SIGNAL": ["The character work hijacks the program, and nobody seems eager to stop it.", "The tape keeps wandering into bits instead of behaving like a normal commentary.", "The voices and callbacks are part of the watch, not an afterthought."],
    "WWAM UP IN YA": ["The filthy detours are not background noise; they are part of the route.", "The booth keeps finding the kind of side road you would not put in a press kit.", "The quickest way to a laugh is sometimes straight through the gutter."],
    "FILM READ": ["The movie argument survives every detour and keeps the page anchored.", "The booth can set the scene on fire without losing why it was watching.", "The film talk is sturdy enough to survive the chaos around it."],
    "FAN SIGNAL": ["Fan traffic changes the room's rhythm instead of sitting politely at the edge.", "The audience is part of the episode's shape, not just a number under the video.", "The fan lane keeps the booth honest, surprised, and occasionally derailed."]
  };
  const tone = (toneVariants[dominant] || ["The source stays playful without pretending every timestamp is a finished verdict.", "The route is messy, but every door is bounded to the tape.", "This is a listening lead, not a machine-written verdict."])[seed];
  const topicNames = relevantTopics(topics, taxonomy).map((topic) => topic.name).filter(Boolean).slice(0, 3);
  const topicSentence = topicNames.length === 1
    ? `They keep circling back to ${topicNames[0]}, even when the room takes a side road.`
    : topicNames.length > 1
      ? `They keep circling back to ${topicNames.join(", ")}, even when the room takes a side road.`
      : "The movie stays at the center even when the conversation takes the scenic route.";
  const routePeak = strongestRouteMoment || strongestMoment;
  const strongestStop = routePeak ? `${formatTimestamp(routePeak.t)} for ${laneName(routePeak.category || "the hottest turn")}` : "the strongest moment on the page";
  const openingStop = firstMoment ? `${formatTimestamp(firstMoment.t)} for ${laneName(firstMoment.category || "the opening read")}` : "the opening minute";
  const closingStop = finalMoment ? `${formatTimestamp(finalMoment.t)} for ${laneName(finalMoment.category || "the closing read")}` : "the closing stretch";
  const routeLine = allMoments.length
    ? `Start at ${openingStop}, jump to ${strongestStop} when you want the temperature spike, and leave through ${closingStop}.`
    : "Open the player and let the room show you where to go next.";
  const audioLine = audioCuts.length
    ? `The listening shelf adds ${audioCuts.length} extra places to tap into the room.`
    : "Every door on this page stays tied to the playable episode.";
  const secondaryLine = secondary && secondary !== dominant
    ? secondary === "STRAIGHT TO STEVE'S ASSHOLE"
      ? " Steve's Asshole keeps resurfacing."
      : ` The ${laneName(secondary)} lane keeps resurfacing.`
    : "";
  const listeningLead = routePeak
    ? `The best listening lead lands at ${formatTimestamp(routePeak.t)}; open it to hear the exchange in context.`
    : "Open a door and hear the exchange in context.";
  return `${opening} It runs ${formatTimestamp(duration)} and is ${runtimeRead} ${format}. ${tone} The biggest lanes are ${laneText || "the movie and the room"}.${secondaryLine} ${topicSentence} ${routeLine} ${listeningLead} This page gives you ${allMoments.length} clickable moments, so you can skip the setup and drop straight into the good stuff. ${audioLine}`;
}

function ledgerFanRead(items, finalMoment) {
  const byCategory = new Map();
  items.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0)).forEach((item) => {
    const category = clean(item.category || item.label);
    if (category && !byCategory.has(category)) byCategory.set(category, item);
  });
  const lane = (category, label) => {
    const item = byCategory.get(category);
    return item ? { label, at: item.t, topic: item.category || category, body: `${label} shows up here. Tap in at ${formatTimestamp(item.t)} and hear the whole exchange before deciding whether it belongs in the permanent WWAM canon.` } : null;
  };
  return {
    loved: lane("FILM READ", "FILM READ"),
    hated: lane("STRAIGHT TO STEVE'S ASSHOLE", "STRAIGHT TO STEVE'S ASSHOLE"),
    wildestDetour: lane("UP IN YA", "WWAM UP IN YA"),
    lastWord: finalMoment ? { label: "LAST WORD", at: finalMoment.t, topic: finalMoment.category || "CLOSING READ", body: `The show leaves through this door at ${formatTimestamp(finalMoment.t)}. Open it and hear where the room actually lands.` } : null
  };
}

function sanitizeFanRead(value) {
  if (!value || typeof value !== "object") return null;
  const output = {};
  Object.entries(value).forEach(([key, lane]) => {
    if (!lane || typeof lane !== "object") {
      output[key] = lane;
      return;
    }
    const safe = { ...lane };
    if (typeof safe.excerpt === "string") safe.excerpt = excerpt(safe.excerpt, 16);
    if (typeof safe.body === "string") {
      const replacement = safe.excerpt ? `“${safe.excerpt}”` : "the full exchange";
      safe.body = clean(safe.body).replace(/“[^”]*”/g, replacement);
    }
    output[key] = safe;
  });
  return output;
}

function fanSignalCandidates(events, duration) {
  if (!events.length) return [];
  const evidenceBasis = events.some((event) => event.evidenceType === "local-whisper-transcript")
    ? "source-local Whisper transcript fan-callout cluster"
    : "source-local automatic caption fan-callout cluster";
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
    evidenceBasis,
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
  return { mentions: hits.reduce((sum, item) => sum + item.hits, 0), first: hits[0].event.t, peak: peak.event.t, cluster: Math.min(24, hits.length), receipt: publicReceiptText(excerpt(peak.event.text)) };
}

const LANE_DEFS = [
  { key: "up-in-ya", label: "WWAM UP IN YA", category: "UP IN YA", pattern: /\b(fuck|fucking|dick|cock|balls?|cum|fart|shit|bitch|piss|boob|tits?|asshole|suck|boner)\b/i },
  { key: "steves-asshole", label: "STRAIGHT TO STEVE'S ASSHOLE", category: "STRAIGHT TO STEVE'S ASSHOLE", pattern: /\b(hate|hated|worst|terrible|awful|sucks?|stupid|dumb|bullshit|garbage|lazy|weak|ruined|don't like|didn't like|not good)\b/i },
  { key: "film-read", label: "FILM READ", category: "FILM READ", pattern: /\b(love|best|great|amazing|music|score|camera|director|actor|acting|scene|ending|character|story|plot|performance)\b/i },
  { key: "character-signal", label: "CHARACTER SIGNAL", category: "CHARACTER SIGNAL", pattern: /\b(loomis|chall[ie]s|slenderman|corey feldman|feldman|michael myers|michael|freddy|jason|chucky|tiffany|ghostface|sidney(?: prescott)?|dewey(?: riley)?|laurie(?: strode)?|leatherface)\b/i },
  { key: "fan-signal", label: "FAN SIGNAL", category: "FAN SIGNAL", pattern: /super ?chat|\bdonat(?:e|ed|ion)\b|lee(?:\s+the)?\s+machine|michael\s+part(?:on|in)|chat(?:'s| is) asking|question from (?:the )?chat|(?:thanks|welcome|appreciate|thank you).{0,45}(?:member|membership)|(?:new|another|our) member|(?:member|membership).{0,45}(?:joined|join|thanks|thank|gift)/i }
];

function candidateMoments(events, duration, aliases, taxonomy = {}) {
  if (!events.length) return { moments: [], topics: [], chapters: [], captionWords: 0, captionEvents: 0 };
  const localWhisper = events.some((event) => event.evidenceType === "local-whisper-transcript");
  const evidenceBasis = localWhisper ? "source-local Whisper transcript keyword cluster" : "source-local automatic caption keyword cluster";
  const routeEvidenceBasis = localWhisper ? "source-local Whisper transcript route checkpoint" : "source-local caption route checkpoint";
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
      evidenceBasis,
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
      evidenceBasis: routeEvidenceBasis,
      reviewStatus: "machine-candidate"
    });
  });
  candidates.sort((left, right) => left.t - right.t);
  // Do not let a generic show intro such as "Halloween Horror Month" turn
  // every unrelated movie into a Halloween dossier. Franchise terms belong to
  // the taxonomy that earned them; standalone titles rely on their own aliases.
  const franchiseTerms = {
    halloween: ["Halloween", "Michael Myers"],
    "friday-the-13th": ["Friday the 13th", "Jason"],
    scream: ["Scream", "Ghostface"],
    "a-nightmare-on-elm-street": ["A Nightmare on Elm Street", "Freddy"],
    "childs-play": ["Child's Play", "Chucky", "Tiffany"],
    hellraiser: ["Hellraiser", "Pinhead"],
    dc: ["Batman", "Bruce Wayne", "Riddler", "Joker", "Superman"],
    terminator: ["Terminator", "John Connor"],
    rambo: ["Rambo"],
    "saved-by-the-bell": ["Saved by the Bell"],
    "pet-sematary": ["Pet Sematary"],
    comedy: ["Freddy Got Fingered", "Tom Green"],
  }[taxonomy.franchiseKey] || [];
  const topicTerms = [...new Set([...aliases, ...franchiseTerms])]
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
    // If the caption window never names the film or a verified topic, keep the
    // route generic. A title-derived label would look polished but imply a
    // source mention that the tape never actually gave us.
    const subject = excerptSubject || nearest?.name || "SOURCE CHECKPOINT";
    return { ...candidate, label: `${candidate.label} // ${subject}` };
  });
  // A chapter is a jump point, not a decorative repeat of the same receipt.
  // Older ledgers could select the same nearest candidate for several eighths
  // of a short tape, which made the chapter rail feel broken even though the
  // underlying moment count passed its depth floor. Prefer an unused timestamp
  // first, then an unused candidate id when a tape has clustered evidence.
  const usedChapterIds = new Set();
  const usedChapterTimes = new Set();
  const chapters = [0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
    const at = Math.round((duration || events.at(-1).end) * index / 8);
    const unused = contextualCandidates.filter((candidate) => !usedChapterIds.has(candidate.id) && !usedChapterTimes.has(candidate.t));
    const fallback = contextualCandidates.filter((candidate) => !usedChapterIds.has(candidate.id));
    const nearest = (unused.length ? unused : fallback).slice().sort((left, right) => Math.abs(left.t - at) - Math.abs(right.t - at))[0];
    if (!nearest) return null;
    usedChapterIds.add(nearest.id);
    usedChapterTimes.add(nearest.t);
    return { id: `act-${String(index + 1).padStart(2, "0")}`, act: index + 1, label: `${nearest.label} // ${nearest.category}`, at: nearest.t, end: nearest.end, body: `The source-local caption ledger puts ${nearest.label.toLowerCase()} at ${formatTimestamp(nearest.t)}. The jump is a machine candidate; open the tape before treating the line as a final read.`, excerpt: nearest.excerpt, category: nearest.category, cutId: nearest.id, evidenceBasis: nearest.evidenceBasis };
  }).filter(Boolean);
  return { moments: contextualCandidates, topics: topicTerms, chapters, captionWords: words(events.map((event) => event.text).join(" ")).length, captionEvents: events.length };
}

// A sparse transcript should not make a marathon commentary look like an
// eight-card stub. When the signal lanes do not naturally reach the runtime
// floor, add a few neutral, source-local checkpoints selected from clean
// transcript windows. These are navigation doors, not invented “best bits” or
// speaker claims; the exact exchange still lives in the player.
function runtimeCoverageFloor(duration) {
  if (duration >= 10800) return 12;
  if (duration >= 7200) return 10;
  if (duration >= 5400) return 8;
  return 6;
}

function coverageMoments(events, duration, existing) {
  const floor = runtimeCoverageFloor(Number(duration || 0));
  const deficit = Math.max(0, floor - (existing || []).length);
  if (!events.length || !deficit) return [];
  const localWhisper = events.some((event) => event.evidenceType === "local-whisper-transcript");
  const evidenceBasis = localWhisper
    ? "source-local Whisper transcript coverage checkpoint"
    : "source-local caption coverage checkpoint";
  const candidates = events.map((event, index) => {
    const receipt = publicReceiptText(excerpt(captionWindow(events, index), 16));
    if (!receipt || words(receipt).length < 5) return null;
    const signalHits = (receipt.match(/\b(?:fuck|fucking|shit|dick|asshole|hate|worst|terrible|awful|love|best|great|chucky|jason|freddy|loomis|challis|slenderman|feldman|super\s*chat|member)\b/gi) || []).length;
    const punctuationHits = (receipt.match(/[!?]/g) || []).length;
    return {
      event,
      index,
      receipt,
      score: Math.min(82, 48 + Math.min(16, words(receipt).length) + Math.min(12, signalHits * 4) + Math.min(6, punctuationHits * 2))
    };
  }).filter(Boolean).sort((left, right) => right.score - left.score || left.event.t - right.event.t);
  if (!candidates.length) return [];
  const picked = [];
  const spacing = Math.max(75, Math.round((Number(duration || 1) / Math.max(1, floor)) * 0.35));
  const targets = Array.from({ length: Math.max(deficit * 2, floor) }, (_, index) => (Number(duration || 0) * (index + 0.5)) / Math.max(deficit * 2, floor));
  for (const target of targets) {
    if (picked.length >= deficit) break;
    const nearest = candidates
      .filter((candidate) => !picked.some((item) => Math.abs(item.event.t - candidate.event.t) < spacing))
      .slice()
      .sort((left, right) => Math.abs(left.event.t - target) - Math.abs(right.event.t - target) || right.score - left.score)[0];
    if (nearest) picked.push(nearest);
  }
  for (const candidate of candidates) {
    if (picked.length >= deficit) break;
    if (!picked.some((item) => Math.abs(item.event.t - candidate.event.t) < spacing)) picked.push(candidate);
  }
  return picked.slice(0, deficit).sort((left, right) => left.event.t - right.event.t).map((candidate, index) => ({
    id: `coverage-${Math.round(candidate.event.t)}`,
    t: Math.round(candidate.event.t),
    end: Math.round(candidate.event.end || candidate.event.t + 36),
    category: "TAPE CHECKPOINT",
    label: `TAPE CHECKPOINT // ${index + 1}`,
    score: candidate.score,
    excerpt: candidate.receipt,
    evidenceBasis,
    reviewStatus: "machine-candidate"
  }));
}

function alternateChapterRoutes(routes, duration) {
  if (!routes.length) return [];
  const count = Math.min(8, Math.max(4, Math.ceil(routes.length / 6)));
  const used = new Set();
  return Array.from({ length: count }, (_, index) => {
    const target = (Number(duration || 0) * index) / count;
    const route = routes.filter((item) => !used.has(item.id)).slice().sort((left, right) => Math.abs(Number(left.t || 0) - target) - Math.abs(Number(right.t || 0) - target))[0]
      || routes.slice().sort((left, right) => Math.abs(Number(left.t || 0) - target) - Math.abs(Number(right.t || 0) - target))[0];
    if (!route) return null;
    used.add(route.id);
    return {
      id: `podcast-act-${String(index + 1).padStart(2, "0")}`,
      act: index + 1,
      label: `${clean(route.label || route.category || "PODCAST ROUTE")} // PODCAST CLOCK`,
      at: Number(route.t || 0),
      end: Number(route.end || route.t || 0),
      body: `The official WWAM podcast variant opens this stretch at ${formatTimestamp(route.t)} on its own clock. The route is playable evidence, not a YouTube timestamp.`,
      excerpt: clean(route.excerpt || "Open the official podcast variant and listen."),
      category: clean(route.category || route.label || "PODCAST ROUTE"),
      cutId: route.id,
      sourceKind: "podcast-variant",
      sourceClock: "official WWAM podcast clock",
      segmentKind: route.segmentKind || "commentary-candidate",
      navigationQuality: route.navigationQuality || "commentary-route",
      evidenceBasis: route.evidenceBasis || "official WWAM podcast variant audio + local transcript; not a canonical YouTube timestamp",
      reviewStatus: route.reviewStatus || "audio-feature-candidate; podcast playback remains the authority"
    };
  }).filter(Boolean);
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

// Caption ledgers often say the film title in a shortened or slightly mangled
// form ("Black Christmas" instead of "Let's Watch BLACK CHRISTMAS", "Save by
// the Bell" instead of "Saved By The Bell Season 5 THE FIGHT"). Keep the
// source boundary honest while giving the topic ledger the same human-readable
// handles a person would use when searching the tape.
function titleAliasTerms(taxonomy) {
  const raw = clean(taxonomy?.movieTitle);
  const normalized = raw
    .replace(/^\s*(?:let'?s|lets|we)\s+watch(?:\s+a)?(?:\s+movie)?\s*/i, "")
    .replace(/\b(?:full|video|movie|audio|commentary|watch\s*(?:along|party)|on\s+riff\.?tv)\b/gi, " ")
    .replace(/\bseason\s+\d+\b/gi, " ")
    .replace(/\s*[|:,-]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  const stop = new Set([
    "a", "an", "and", "the", "of", "to", "on", "in", "for", "from", "with",
    "this", "that", "full", "movie", "video", "audio", "commentary", "watch",
    "watched", "watchalong", "watch-party", "live", "season", "episode", "part",
    "together", "special", "specials", "year", "celebration", "lets", "let's", "we"
  ]);
  const tokens = normalized
    .replace(/[()\[\]{}]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9'-]+$/g, ""))
    .filter((token) => token.length >= 4 && !stop.has(token.toLowerCase()));
  const aliases = [raw, normalized, taxonomy?.franchiseTitle];
  if (tokens.length >= 2) aliases.push(tokens.join(" "));
  tokens.forEach((token) => aliases.push(token));
  return [...new Set(aliases.map(clean).filter(Boolean))];
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
  const aliases = titleAliasTerms(taxonomy);
  // A deep record without a matching human guide is still useful when the local
  // caption ledger can provide bounded route receipts. Keep the evidence state
  // honest, but do not leave the episode as an empty shell.
  const derived = (!deepRecord || !guide) ? candidateMoments(events, duration, aliases, taxonomy) : null;
  const sourceTopics = (overrideById.get(id) || []).map((topic) => ({ name: topic.label, first: topic.firstAt, peak: topic.peakAt, mentions: topic.mentions, receipt: publicReceiptText(excerpt(topic.excerpt)), evidenceBasis: topic.evidenceBasis }));
  const guideCuts = guide?.cuts || [];
  const baseMoments = deepRecord && guide ? (deepRecord.moments || []).map((moment) => ({ ...moment, t: Number(moment.t || 0), end: Number(moment.end || moment.t || 0), excerpt: publicReceiptText(excerpt(moment.quote || moment.excerpt)), reviewStatus: "distilled-editorial-candidate" })).filter((moment) => moment.excerpt) : (derived?.moments || []).map((moment) => ({ ...moment, excerpt: publicReceiptText(moment.excerpt) })).filter((moment) => moment.excerpt);
  const moments = baseMoments.concat(coverageMoments(events, duration, baseMoments));
  const chapters = deepRecord && guide ? (guide?.chapters || []).map((chapter) => ({ ...chapter, excerpt: excerpt(chapter.excerpt), body: clean(chapter.body) })) : derived.chapters;
  const filmTitleLower = clean(taxonomy.movieTitle).toLowerCase();
  const filmTitleTokens = filmTitleLower.split(/\s+/).filter((token) => token.length >= 4 && !["this", "that", "the", "with", "from", "full", "movie"].includes(token));
  const derivedTopicDoors = (derived?.topics || []).filter((topic) => {
    const name = clean(topic.name).toLowerCase();
    const mentions = Number(topic.mentions || 0);
    const titleHit = name.length >= 4 && (filmTitleLower.includes(name) || filmTitleTokens.some((token) => name === token || name.includes(token)));
    return mentions >= 2 || titleHit;
  });
  const topics = deepRecord && guide
    ? (guide?.threads || []).slice(0, 10).map((thread) => ({ name: thread.name, mentions: thread.mentions, first: thread.first, peak: thread.peak, cluster: thread.cluster, receipt: publicReceiptText(excerpt(thread.receipt)), kind: thread.kind }))
    : relevantTopics(sourceTopics.length ? sourceTopics : derivedTopicDoors, taxonomy);
  const watchPassRecord = watchPass.episodes?.[id] || null;
  const alternateAudio = alternateAudioMeta(watchPassRecord, duration);
  // Carry the same boundary labels into the held-source watch-pass card. The
  // UI reads this raw pass for its playable alternate shelf, while the dossier
  // below reads the compact `alternateAudio` routes.
  const normalizedWatchPass = watchPassRecord
    ? {
        ...watchPassRecord,
        // The pilot manifest is an internal audio ledger and may carry a
        // multi-window caption paragraph. Keep the public watch-pass shelf
        // bounded to the same readable receipt policy as the dossier cuts.
        candidates: (watchPassRecord.candidates || []).map((candidate) => {
          const context = sourceKind === "local-whisper-transcript" ? nearestCaptionContext(events, candidate.t) : null;
          const text = context?.text ? publicReceiptText(excerpt(context.text, 16)) : publicReceiptText(excerpt(normalizeCaptionText(candidate.captionExcerpt || candidate.excerpt || ""), 16));
          return { ...candidate, captionExcerpt: text, excerpt: text };
        }),
        ...(alternateAudio && watchPassRecord.alternateAudio ? {
          alternateAudio: {
            ...watchPassRecord.alternateAudio,
            candidates: alternateAudio.routes.map((route) => ({
              ...route,
              captionExcerpt: route.excerpt,
              excerpt: route.excerpt
            })),
            listeningDigest: {
              ...(watchPassRecord.alternateAudio.listeningDigest || {}),
              signalMix: alternateAudio.signalMix
            }
          }
        } : {})
      }
    : null;
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
      // Prefer the verified local Whisper window over the older automatic
      // caption fragment on every clickable audio door.
      const whisperContext = sourceKind === "local-whisper-transcript" ? nearestCaptionContext(events, at) : null;
      const captionExcerpt = whisperContext?.text
        ? publicReceiptText(excerpt(whisperContext.text, 16))
        : (sourceKind === "local-whisper-transcript" ? "" : publicReceiptText(excerpt(normalizeCaptionText(candidate.captionExcerpt || ""), 16)));
      const nearbyCaption = whisperContext || (captionExcerpt ? null : nearestCaptionContext(events, at));
      const nearbyReceipt = nearbyCaption
        ? publicReceiptText(excerpt(`NEARBY CAPTION CONTEXT // ${nearbyCaption.text}`, 16))
        : "";
      const receiptExcerpt = captionExcerpt
        || nearbyReceipt
        || "No caption fragment aligned; open the source and listen to this acoustic window.";
      return {
        id: `audio-${Math.round(at)}-${index + 1}`,
        t: Math.round(at),
        end: Math.round(Number(candidate.end || at + 8)),
        category,
        label: `${category} // ${subject}`,
        score: Number(candidate.score || 0),
        excerpt: receiptExcerpt,
        captionAligned: Boolean(captionExcerpt),
        // A nearest-event object alone is not a usable fallback. Mark this
        // as context only when the exact excerpt was not available and the
        // card is genuinely using a nearby caption window.
        captionContext: Boolean(nearbyCaption?.text && !captionExcerpt),
        captionContextAt: nearbyCaption?.at || null,
        captionContextDistance: nearbyCaption?.distance || null,
        topic: nearestTopic?.name || null,
        audioRank: Number(candidate.rank || index + 1),
        audio: candidate.audio || null,
        evidenceBasis: captionExcerpt && whisperContext
          ? "canonical YouTube audio + source-local Whisper transcript alignment"
          : captionExcerpt
            ? "canonical YouTube audio + source-local caption alignment"
          : nearbyCaption
            ? "canonical YouTube audio + nearby source-local caption context; not exact alignment"
            : "canonical YouTube audio; no nearby source-local caption context",
        reviewStatus: nearbyCaption
          ? "audio-feature-candidate; nearby caption context only; playback remains the authority"
          : "audio-feature-candidate; playback remains the authority"
      };
    }).filter((candidate) => candidate.excerpt || candidate.t >= 0);
  const alternateCuts = (alternateAudio?.routes || []).map((route, index) => ({
    id: `podcast-${Math.round(Number(route.t || 0))}-${index + 1}`,
    t: Number(route.t || 0),
    end: Number(route.end || route.t || 0),
    category: clean(route.category || route.label || "PODCAST ROUTE"),
    label: clean(route.label || route.category || "PODCAST ROUTE"),
    score: Number(route.score || 0),
    excerpt: excerpt(route.excerpt || "Open the official WWAM podcast variant and listen.", 16) || "Open the official WWAM podcast variant and listen.",
    clock: "official WWAM podcast clock",
    sourceClock: "official WWAM podcast clock",
    sourceKind: "podcast-variant",
    sourceUrl: alternateAudio.episodeUrl || alternateAudio.sourceUrl || null,
    audio: route.audio || null,
    audioRank: Number(route.rank || index + 1),
    segmentKind: route.segmentKind || "commentary-candidate",
    navigationQuality: route.navigationQuality || "commentary-route",
    evidenceBasis: route.evidenceBasis || "official WWAM podcast variant audio + local transcript; not a canonical YouTube timestamp",
    reviewStatus: route.reviewStatus || "audio-feature-candidate; podcast playback remains the authority"
  }));
  const editorialMoments = deepRecord && guide ? guideCuts.map((cut) => ({
    id: cut.id, t: Number(cut.t || 0), end: Number(cut.end || cut.t || 0), category: cut.category, label: cut.label || cut.category,
    score: Number(cut.score || 0), excerpt: publicReceiptText(excerpt(cut.excerpt)), topic: cut.topic || null, evidenceBasis: cut.evidenceBasis || "reviewed-guide-cut", reviewStatus: "distilled-editorial-candidate"
  })) : moments;
  // Deep dossiers have a curated guide, but the guide is not the whole tape.
  // Re-run the source-local lane detector for the explicit WWAM shelves so a
  // long commentary does not lose every vulgarity/character cue simply because
  // the editorial pack chose different highlight labels. These are additive
  // machine candidates, never promoted to human-reviewed quotes.
  const laneSupplement = deepRecord && guide
    ? candidateMoments(events, duration, aliases, taxonomy).moments.filter((candidate) => /^(?:UP IN YA|STRAIGHT TO STEVE'S ASSHOLE|CHARACTER SIGNAL|FAN SIGNAL)$/i.test(candidate.category || ""))
    : [];
  const editorialAndLane = editorialMoments.concat(laneSupplement.filter((candidate) => !editorialMoments.some((moment) => Math.abs(Number(moment.t || 0) - candidate.t) <= 18)));
  const allMoments = editorialAndLane.concat(audioCuts.filter((candidate) => !editorialAndLane.some((moment) =>
    Math.abs(Number(moment.t || 0) - candidate.t) <= 18
  )), alternateCuts);
  const dossierChapters = chapters.length ? chapters : alternateChapterRoutes(alternateCuts, alternateAudio?.media?.durationSeconds || duration);
  const firstMoment = allMoments.slice().sort((left, right) => left.t - right.t)[0] || null;
  const strongestMoment = allMoments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
  // Do not narrate the same timestamp as both the opening door and the
  // strongest turn. A distinct second stop makes short or highly concentrated
  // episodes read like a route a person would actually recommend.
  const strongestRouteMoment = allMoments
    .slice()
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
    .find((moment) => !firstMoment || Math.abs(Number(moment.t || 0) - Number(firstMoment.t || 0)) >= 24)
    || strongestMoment;
  const finalMoment = allMoments.slice().sort((left, right) => right.t - left.t)[0] || null;
  const laneCounts = ledgerLaneCounts(allMoments);
  const fanSignals = fanSignalCandidates(events, duration);
  const derivedSummary = watchalongVoiceSummary({ taxonomy, duration, laneCounts, topics, firstMoment, strongestMoment, strongestRouteMoment, finalMoment, allMoments, audioCuts });
  const alternateRouteCount = Number(watchPassRecord?.alternateAudio?.candidates?.length || 0);
  const strongestAudio = audioCuts.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
  const audioSummarySuffix = audioCuts.length && guide?.overview
    ? ` The local listening pass adds ${audioCuts.length} ranked browse windows, with its strongest signal at ${strongestAudio ? formatTimestamp(strongestAudio.t) : "the indexed peak"}; those windows are navigation aids, not speaker or joke proof.`
    : "";
  // Older guide overviews were written in internal audit shorthand. They are
  // useful evidence, but phrases such as "caption catches", "three-stop cut",
  // and "audio-feature pass" make the public Show Wiki sound like a debug log.
  // Keep that material in evidenceSummary and use the conversational route
  // read for the visitor-facing paragraph.
  const guideOverview = clean(guide?.overview || "");
  const guideOverviewNeedsRewrite = /caption(?: catches|[- ]aligned)|three-stop|source cut|audio-feature|ranked (?:browse )?windows?|bounded|source ledger|evidence map|listening lead|machine|route receipts|without forcing a verdict|calling-card moment|single clip|the short route|closing path|fades out|signs off|last honest read/i.test(guideOverview);
  const summary = guideOverview && !guideOverviewNeedsRewrite ? `${guideOverview}${audioSummarySuffix}` : (!events.length && !deepRecord
    ? (alternateRouteCount
      ? `This source brief preserves the official upload for ${taxonomy.movieTitle}, which is currently held for unauthenticated YouTube playback. The official WWAM podcast variant remains playable with ${alternateRouteCount} bounded audio routes in its own source-local clock; those routes are not pasted onto YouTube.`
      : `This source brief preserves the official upload for ${taxonomy.movieTitle}, but no local caption map was available in this observation. The source remains playable; no timestamps or speaker claims are manufactured.`)
    : (deepRecord && !guide
      ? (alternateRouteCount
        ? `This catalog entry is held as a source brief for ${taxonomy.movieTitle}. The canonical YouTube source is currently held, while the official podcast variant contributes ${alternateRouteCount} audio-bound routes on its own clock; no YouTube timestamp is manufactured.`
        : `This catalog entry is held as a source brief for ${taxonomy.movieTitle}. The public upload and its archived editorial note are preserved, while the local caption ledger contributes ${allMoments.length} machine-found route receipts. Press play before treating any line as a reviewed quote.`)
      : guide ? derivedSummary : deepRecord?.verdict || derivedSummary));
  const evidenceSummary = guide?.evidenceSummary
    ? `${guide.evidenceSummary}${audioCuts.length ? ` The local listening pass contributes ${audioCuts.length} ranked routes; those acoustic windows are browse aids, not speaker or joke proof.` : ""}`
    : `The source ledger contains ${events.length.toLocaleString("en-US")} ${sourceKind === "local-whisper-transcript" ? "audio transcript segments" : "caption events"} and ${(deepRecord?.wordsAudited || derived?.captionWords || 0).toLocaleString("en-US")} words.${audioCuts.length ? ` The local listening pass contributes ${audioCuts.length} ranked routes.` : ""}${alternateRouteCount ? ` The official podcast variant contributes ${alternateRouteCount} audio-bound routes on its own clock; no YouTube mapping is claimed.` : ""} These timestamps are machine-found leads, not speaker-diarized quotes; press play before treating a line as canon.`;
  const dossier = {
    state: deepRecord && guide ? "full-editorial-dossier" : deepRecord || !events.length ? "source-brief-dossier" : "caption-ledger-dossier",
    summary: clean(summary),
    evidenceSummary,
    shape: guide?.shape ? { ...guide.shape, cuts: allMoments.length } : { runtimeBand: duration >= 9000 ? "MARATHON" : duration >= 5400 ? "FEATURE" : "SHORT", chapters: dossierChapters.length, threads: topics.length, cuts: allMoments.length },
    fanRead: sanitizeFanRead(guide?.fanRead) || (deepRecord ? null : ledgerFanRead(allMoments, finalMoment)),
    fanSignals,
    laneCounts,
    chapters: dossierChapters,
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
    watchPass: normalizedWatchPass,
    alternateAudio,
    editorial: deepRecord?.arc ? { arc: deepRecord.arc, moments: allMoments } : { arc: dossierChapters.map((chapter) => ({ chapter: chapter.act, at: chapter.at, dominant: chapter.category })), moments: allMoments }
  };
}

const episodes = Array.from(includedIds).map(episodeFrom)
  .sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title));

// Public adjacent uploads deserve a real local room even when the archive
// policy correctly keeps them outside the full-film canon. Caption-confirmed
// reactions/reviews get bounded jump points; metadata-only leads remain a
// truthful source brief rather than an empty legacy shell.
function edgeEpisodeFrom(record) {
  const metadataRecord = metadataById.get(record.id) || {};
  const taxonomy = { ...titleDerivedTaxonomy(record.title), type: record.signal || "reaction-or-review", note: "public adjacent source; not promoted to the full-film watchalong canon" };
  const events = edgeCaptionEvents(record.id);
  const duration = Number(metadataRecord.duration || record.captionSpanSeconds || 0);
  const aliases = [taxonomy.movieTitle, taxonomy.franchiseTitle, taxonomy.movieTitle.replace(/\s*\([^)]*\)/g, "")].filter(Boolean);
  const derived = candidateMoments(events, duration, aliases, taxonomy);
  const allMoments = derived.moments;
  const laneCounts = ledgerLaneCounts(allMoments);
  const firstMoment = allMoments.slice().sort((left, right) => left.t - right.t)[0] || null;
  const strongestMoment = allMoments.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
  const finalMoment = allMoments.slice().sort((left, right) => right.t - left.t)[0] || null;
  const topicNames = derived.topics.map((topic) => topic.name).slice(0, 4);
  const evidenceSpan = Number(record.captionSpanSeconds || (events.at(-1)?.end || 0));
  const formatLabel = record.signal === "reaction-or-review" ? "reaction / review" : record.signal === "short-form-watch-lead" ? "short-form watch lead" : "early edited watchalong cut";
  const summary = events.length
    ? `${clean(record.title)} is a public adjacent ${formatLabel}, not a full-film commentary. The local caption receipt covers ${formatTimestamp(evidenceSpan)} of source-local speech and surfaces ${allMoments.length} bounded navigation routes. ${topicNames.length ? `The strongest subject doors are ${topicNames.join(", ")}. ` : "The caption map does not earn a reliable subject label beyond the title. "}The route mix leans ${Object.entries(laneCounts).sort((left, right) => right[1] - left[1]).slice(0, 3).map(([label, count]) => `${label} (${count})`).join(", ") || "source checkpoints"}. Press play before treating any caption fragment as a finished joke, speaker ID, or verdict.`
    : `${clean(record.title)} is a public adjacent ${formatLabel}, not a full-film commentary. The archive has verified the public metadata but does not yet have a source-local caption receipt, so this room stays a playable source brief with no invented timestamps.`;
  return {
    id: record.id,
    title: clean(record.title),
    displayTitle: clean(record.title),
    date: record.date || dateFrom(metadataRecord.upload_date),
    duration,
    durationLabel: formatTimestamp(duration),
    thumbnail: metadataRecord.thumbnail || `https://i.ytimg.com/vi/${record.id}/maxresdefault.jpg`,
    url: record.url || `https://www.youtube.com/watch?v=${record.id}`,
    channel: metadataRecord.channel || "WeWatchedAMovie",
    channelId: metadataRecord.channel_id || null,
    topics: derived.topics,
    sourceTopics: [],
    summary,
    verdict: null,
    note: "Adjacent public receipt; kept outside the full-film watchalong canon by policy.",
    availability: "public-adjacent",
    sourceAvailability: metadataRecord.availability || "public",
    franchiseKey: taxonomy.franchiseKey,
    franchiseTitle: taxonomy.franchiseTitle,
    movieKey: taxonomy.movieKey,
    movieTitle: taxonomy.movieTitle,
    edgeAdjacent: true,
    formatBoundary: "ADJACENT PUBLIC SOURCE // NOT A FULL-FILM COMMENTARY",
    dossier: {
      state: events.length ? "adjacent-caption-dossier" : "adjacent-source-brief",
      summary,
      evidenceSummary: events.length
        ? `Local edge receipt: ${events.length.toLocaleString("en-US")} caption events across ${formatTimestamp(evidenceSpan)}. These routes establish navigation only; the upload remains outside the full-film canon.`
        : "No local caption receipt is present in this observation. Metadata is preserved without manufacturing a route map.",
      shape: { runtimeBand: duration >= 1800 ? "FEATURE-LITE" : "SHORT", chapters: derived.chapters.length, threads: derived.topics.length, cuts: allMoments.length },
      fanRead: null,
      fanSignals: [],
      laneCounts,
      chapters: derived.chapters,
      cuts: allMoments,
      route: { opening: firstMoment, strongest: strongestMoment, closing: finalMoment },
      caption: { words: derived.captionWords, events: events.length, minutes: Math.round(evidenceSpan / 60), sourceFile: events.length ? `source-cache/captions/edge-${record.id}.en.json3` : null, sourceKind: events.length ? "youtube-automatic-caption-edge" : null }
    }
  };
}

const edgeAdjacentSources = edgeAuditData.records
  .filter((record) => record.status === "caption-confirmed-adjacent" || record.status === "public-metadata-only")
  .map(edgeEpisodeFrom);

// Early edited watchalong cuts and review/reaction uploads are not full-film
// canon, but several of them already have a local caption receipt. Give those
// rooms the same source-specific shape as the adjacent shelf instead of
// sending visitors into a generic metadata card. The boundary stays explicit:
// these are edited/short/reaction sources, and their routes belong only to
// this upload's clock.
function companionEpisodeFrom(candidate) {
  const acquired = edgeAcquisitionById.get(candidate.id) || {};
  const metadataRecord = metadataById.get(candidate.id) || acquired || {};
  const taxonomy = explicitExtras.get(candidate.id) || { ...titleDerivedTaxonomy(candidate.title), type: candidate.signal || "companion-source", note: "title-derived companion source" };
  const directEvents = captionEvents(candidate.id);
  const edgeEvents = edgeCaptionEvents(candidate.id);
  const events = directEvents.length ? directEvents : edgeEvents;
  const captionSourceFile = directEvents.length
    ? `source-cache/captions/${candidate.id}${fs.existsSync(path.join(CAPTIONS_DIR, `${candidate.id}.json`)) ? ".json" : ".asr.json"}`
    : edgeEvents.length ? `source-cache/captions/edge-${candidate.id}.en.json3` : null;
  const duration = Number(metadataRecord.duration || candidate.duration || 0);
  const aliases = [taxonomy.movieTitle, taxonomy.franchiseTitle, clean(candidate.title)].filter(Boolean);
  const derived = candidateMoments(events, duration, aliases, taxonomy);
  const allMoments = derived.moments;
  const fanSignals = fanSignalCandidates(events, duration);
  const momentsWithFans = [...allMoments, ...fanSignals].sort((left, right) => left.t - right.t);
  const laneCounts = ledgerLaneCounts(momentsWithFans);
  const firstMoment = momentsWithFans[0] || null;
  const strongestMoment = momentsWithFans.slice().sort((left, right) => Number(right.score || 0) - Number(left.score || 0))[0] || null;
  const finalMoment = momentsWithFans.slice().sort((left, right) => right.t - left.t)[0] || null;
  const formatLabel = candidate.signal === "watchalong-edit" ? "edited watchalong cut" : candidate.signal === "short-form-watch-lead" ? "short-form watch lead" : "reaction / review";
  const boundary = candidate.signal === "watchalong-edit"
    ? "EARLY EDITED WATCHALONG // NOT A FULL-FILM COMMENTARY"
    : candidate.signal === "short-form-watch-lead"
      ? "SHORT-FORM WATCH LEAD // NOT A FULL-FILM COMMENTARY"
      : "ADJACENT REACTION / REVIEW // NOT A FULL-FILM COMMENTARY";
  const captioned = events.length > 0;
  const summary = captioned
    ? `${watchalongVoiceSummary({ taxonomy: { ...taxonomy, type: taxonomy.type || "watch-along" }, duration, laneCounts, topics: derived.topics, firstMoment, strongestMoment, finalMoment, allMoments: momentsWithFans, audioCuts: [] })} This is a ${formatLabel}, not a full-film commentary; the local map is navigation evidence for this upload only.`
    : `${clean(candidate.title)} is a ${formatLabel} kept outside the full-film canon. The public metadata is preserved, but this observation has no local caption receipt, so the room stays playable without invented timestamps or fake speaker claims.`;
  return {
    id: candidate.id,
    title: clean(metadataRecord.title || candidate.title),
    displayTitle: clean(metadataRecord.title || candidate.title),
    date: dateFrom(metadataRecord.upload_date) || null,
    duration,
    durationLabel: formatTimestamp(duration),
    thumbnail: metadataRecord.thumbnail || `https://i.ytimg.com/vi/${candidate.id}/maxresdefault.jpg`,
    url: candidate.url || `https://www.youtube.com/watch?v=${candidate.id}`,
    channel: metadataRecord.channel || "WeWatchedAMovie",
    channelId: metadataRecord.channel_id || null,
    topics: derived.topics,
    sourceTopics: [],
    signal: candidate.signal,
    summary,
    verdict: null,
    note: taxonomy.note || "Companion public receipt; kept outside the full-film watchalong canon.",
    availability: metadataRecord.availability || "unresolved",
    sourceAvailability: metadataRecord.availability || null,
    publicSource: metadataRecord.availability !== "subscriber_only",
    franchiseKey: taxonomy.franchiseKey,
    franchiseTitle: taxonomy.franchiseTitle,
    movieKey: taxonomy.movieKey,
    movieTitle: taxonomy.movieTitle,
    formatBoundary: boundary,
    companionSource: true,
    captioned,
    captionEvents: events.length,
    status: metadataRecord.availability === "subscriber_only" ? "members-only-hold" : metadataRecord.availability ? "public-companion" : "playability-unresolved",
    dossier: {
      state: captioned ? "companion-caption-dossier" : "companion-source-brief",
      summary,
      evidenceSummary: captioned
        ? `Local companion receipt: ${events.length.toLocaleString("en-US")} caption events across ${formatTimestamp(events.at(-1)?.end || duration)}. Routes are bounded to this edited/reaction upload and do not claim a full-film timeline.`
        : "No local caption receipt is present in this observation. Metadata is preserved without manufacturing a route map.",
      shape: { runtimeBand: duration >= 1800 ? "FEATURE-LITE" : "SHORT", chapters: derived.chapters.length, threads: derived.topics.length, cuts: momentsWithFans.length },
      fanRead: captioned ? ledgerFanRead(momentsWithFans, finalMoment) : null,
      fanSignals,
      laneCounts,
      chapters: derived.chapters,
      cuts: momentsWithFans,
      route: { opening: firstMoment, strongest: strongestMoment, closing: finalMoment },
      caption: { words: derived.captionWords, events: events.length, minutes: Math.round((events.at(-1)?.end || duration) / 60), sourceFile: captionSourceFile, sourceKind: captioned ? (events[0]?.evidenceType || "source-local-transcript") : null }
    }
  };
}

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
const edgeAcquisitionById = new Map((discoveryManifest?.edgeResults || []).map((record) => [record.id, record]));
const companionWatchalongs = broadDiscoveryCandidates
  .filter((candidate) => candidate.signal === "watchalong-edit" && !includedIds.has(candidate.id))
  .map(companionEpisodeFrom);
const companionReviews = broadDiscoveryCandidates
  .filter((candidate) => ["reaction-or-review", "short-form-watch-lead"].includes(candidate.signal) && !includedIds.has(candidate.id))
  .map(companionEpisodeFrom);
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
  companionWatchalongs: companionWatchalongs.length,
  companionReviews: companionReviews.length,
  edgeAdjacentSources: edgeAdjacentSources.length,
  edgeCaptionConfirmed: edgeAdjacentSources.filter((item) => item.dossier?.caption?.events > 0).length,
  companionPublic: companionWatchalongs.filter((item) => item.publicSource).length + companionReviews.filter((item) => item.publicSource).length,
  companionHeld: companionWatchalongs.filter((item) => !item.publicSource).length + companionReviews.filter((item) => !item.publicSource).length,
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
    episodes: episodes.length, deepDossiers: episodes.filter((episode) => episode.dossier.state === "full-editorial-dossier").length, captionLedgers: episodes.filter((episode) => episode.dossier.state === "caption-ledger-dossier").length, sourceBriefs: episodes.filter((episode) => episode.dossier.state === "source-brief-dossier").length, nonFullAdditions: episodes.filter((episode) => episode.dossier.state !== "full-editorial-dossier").length, edgeAdjacentSources: edgeAdjacentSources.length, edgeCaptionConfirmed: edgeAdjacentSources.filter((item) => item.dossier?.caption?.events > 0).length,
    franchises: franchises.length, movieGroups: groups.length, repeatedMovies: groups.filter((group) => group.repeatCount > 0).length, podcastOnlyCommentaries: podcastOnlyCommentaries.length, podcastFeedRecords: podcastFeedCount, uniqueFilmSources: episodes.length + podcastOnlyCommentaries.length, companionWatchalongs: companionWatchalongs.length, companionReviews: companionReviews.length, knownMovieRoomSources: episodes.length + podcastOnlyCommentaries.length + companionWatchalongs.length + companionReviews.length, publicMovieRoomSources: episodes.length + podcastOnlyCommentaries.length + companionWatchalongs.filter((item) => item.publicSource).length + companionReviews.filter((item) => item.publicSource).length,
    totalDurationSeconds: episodes.reduce((sum, episode) => sum + episode.duration, 0), totalViewsSnapshot: episodes.reduce((sum, episode) => sum + episode.views, 0),
    fanSignalReceipts: episodes.reduce((sum, episode) => sum + Number(episode.dossier?.fanSignals?.length || 0), 0),
    episodesWithFanSignals: episodes.filter((episode) => Number(episode.dossier?.fanSignals?.length || 0) > 0).length,
    firstDate: episodes[0]?.date || null, lastDate: episodes.at(-1)?.date || null,
    sourceCounts: { catalogCommentaries: catalog.length, titleCommentaries: titleCandidates.filter((record) => /commentary/i.test(record.title)).length, explicitWatchParties: 2, heldMembersOnly: heldTitleCandidates.length, liveStrictCandidates: liveStrictCandidates.length, liveStrictPublicCandidates: liveStrictPublicCandidates.length, legacyCatalogRetained: legacyCatalogRetained.length, podcastOnlyCommentaries: podcastOnlyCommentaries.length }
  },
  taxonomy: { groups: groups.map((group) => ({ key: group.key, title: group.title, franchiseKey: group.franchiseKey })), aliases: Object.fromEntries(episodes.map((episode) => [episode.id, episode.aliases])) },
  coverageLedger,
  companionWatchalongs,
  companionReviews,
  edgeAdjacentSources,
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

// Direct Show Wiki links arrive before the full Watchalongs feature has
// hydrated. Keep a small, source-local route index for that cold path: it
// carries every dossier cut, but strips the large caption/audio ledgers that
// the full canon needs only after the visitor enters the Watchalongs room.
const routeSources = Array.from(new Map(
  [...episodes, ...companionWatchalongs, ...companionReviews, ...edgeAdjacentSources]
    .map((source) => [source.id, source])
).values());
const routeIndex = {
  schema: "shokker-wwam-watchalong-route-index/v1",
  generated: payload.generated,
  sources: routeSources.map((episode) => ({
    id: episode.id,
    title: episode.title,
    displayTitle: episode.displayTitle,
    date: episode.date,
    duration: episode.duration,
    durationLabel: episode.durationLabel,
    thumbnail: episode.thumbnail,
    url: episode.url,
    channel: episode.channel,
    channelId: episode.channelId,
    topics: episode.topics,
    sourceTopics: episode.sourceTopics,
    summary: episode.summary,
    verdict: episode.verdict,
    note: episode.note,
    edgeAdjacent: Boolean(episode.edgeAdjacent),
    formatBoundary: episode.formatBoundary || null,
    availability: episode.availability,
    sourceAvailability: episode.sourceAvailability,
    franchiseKey: episode.franchiseKey,
    franchiseTitle: episode.franchiseTitle,
    movieKey: episode.movieKey,
    movieTitle: episode.movieTitle,
    alternateAudio: episode.alternateAudio ? {
      status: episode.alternateAudio.status,
      label: episode.alternateAudio.label,
      sourceUrl: episode.alternateAudio.sourceUrl,
      episodeUrl: episode.alternateAudio.episodeUrl,
      enclosureUrl: episode.alternateAudio.enclosureUrl,
      publisher: episode.alternateAudio.publisher,
      publishedAt: episode.alternateAudio.publishedAt,
      durationSeconds: episode.alternateAudio.durationSeconds,
      canonicalDurationSeconds: episode.alternateAudio.canonicalDurationSeconds,
      durationDeltaSeconds: episode.alternateAudio.durationDeltaSeconds,
      timestampIsomorphic: episode.alternateAudio.timestampIsomorphic,
      candidateCount: episode.alternateAudio.candidateCount,
      signalMix: episode.alternateAudio.signalMix,
      strongest: episode.alternateAudio.strongest,
      evidence: episode.alternateAudio.evidence,
      note: episode.alternateAudio.note,
      provenanceFile: episode.alternateAudio.provenanceFile,
      routes: episode.alternateAudio.routes
    } : null,
    dossier: episode.dossier ? {
      state: episode.dossier.state,
      summary: episode.dossier.summary,
      evidenceSummary: episode.dossier.evidenceSummary,
      cuts: (episode.dossier.cuts || []).map((cut) => ({
        t: cut.t,
        end: cut.end,
        category: cut.category,
        label: cut.label,
        score: cut.score,
        excerpt: cut.excerpt,
        topic: cut.topic,
        audioRank: cut.audioRank,
        sourceKind: cut.sourceKind || null,
        sourceClock: cut.sourceClock || null,
        sourceUrl: cut.sourceUrl || null,
        segmentKind: cut.segmentKind || null,
        navigationQuality: cut.navigationQuality || null,
        evidenceBasis: cut.evidenceBasis || null,
        reviewStatus: cut.reviewStatus || null
      }))
    } : null
  }))
};
const routeOutput = `/* Generated by scripts/generate-wwam-watchalong-canon.mjs. Cold-route Show Wiki index. */\nwindow.WWAM_WATCHALONG_ROUTE_INDEX = ${JSON.stringify(routeIndex)};\n`;
fs.writeFileSync(path.join(PUBLIC_DEMO, "wwam-watchalong-route-index.js"), routeOutput);
console.log(`Generated ${episodes.length} episodes, ${groups.length} movie groups, ${franchises.length} franchises.`);
