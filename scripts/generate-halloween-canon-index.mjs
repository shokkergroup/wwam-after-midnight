import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = path.join(ROOT, "public", "demo");
const OUTPUT = path.join(DEMO, "halloween-canon-index.js");

function loadGlobal(file, key) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(DEMO, file), "utf8"), context, { filename: file });
  return context.window[key];
}

const catalog = loadGlobal("catalog.js", "WWAM_CATALOG");
const atlas = loadGlobal("archive-atlas-data.js", "WWAM_ARCHIVE_ATLAS");
const acquired = loadGlobal("halloween-acquired-distill.js", "WWAM_HALLOWEEN_ACQUIRED");
const enrichment = loadGlobal("halloween-commentary-enrichment.js", "WWAM_HALLOWEEN_COMMENTARY_ENRICHMENT");

const crossoverPayloads = [
  ["livestream-distill.js", "WWAM_LIVESTREAMS"],
  ["popular-live-distill.js", "WWAM_POPULAR_LIVE"],
  ["archive-deep-distill.js", "WWAM_ARCHIVE_DEEP"],
  ["archive-deep-batch2.js", "WWAM_ARCHIVE_DEEP_BATCH2"],
  ["archive-deep-batch3.js", "WWAM_ARCHIVE_DEEP_BATCH3"],
  ["archive-deep-batch4.js", "WWAM_ARCHIVE_DEEP_BATCH4"],
  ["year-canon-2025-2026.js", "WWAM_YEAR_CANON_2025_2026"],
].map(([file, key]) => loadGlobal(file, key));

const halloweenTitle = /(?:\bhalloween\b|\bmichael myers\b|\bdr\.?\s+loomis\b|\bloomis\b)/i;
const records = new Map();

for (const record of atlas.records) {
  if (!halloweenTitle.test(record.title || "")) continue;
  records.set(record.id, { ...record, atlas: true });
}
for (const item of catalog) {
  if (item.franchise !== "Halloween" && !halloweenTitle.test([item.title, item.film].join(" "))) continue;
  records.set(item.id, { ...(records.get(item.id) || {}), ...item, catalog: true });
}
for (const item of acquired.streams) {
  if (!halloweenTitle.test(item.title || "") && !item.lineage) continue;
  records.set(item.id, { ...(records.get(item.id) || {}), ...item, acquired: true });
}

const enrichedById = new Map(enrichment.records.map((record) => [record.id, record]));
const acquiredById = new Map(acquired.streams.map((record) => [record.id, record]));
const directDeepById = new Map();
for (const payload of crossoverPayloads) {
  for (const stream of payload.streams || []) {
    const existing = directDeepById.get(stream.id);
    const richness = Number(stream.wordsAudited || 0) +
      (stream.moments || []).length * 1000 + (stream.topics || []).length * 100;
    const existingRichness = existing ? Number(existing.wordsAudited || 0) +
      (existing.moments || []).length * 1000 + (existing.topics || []).length * 100 : -1;
    if (richness > existingRichness) directDeepById.set(stream.id, stream);
  }
}
const strictSteveTimes = new Map([
  ["28PfRNKoSCA", 980],
  ["AtcRT3Xkk6E", 1327],
  ["Q6SN-Om1gIo", 4387],
  ["M2iupVAFWt8", 3664],
  ["kX3wb5pBRDo", 5635],
  ["jG93HvyP420", 12774],
  ["2en5C2sNAN8", 5251],
  ["Z7ArdfA054w", 4894],
]);

const versionMap = new Map([
  ["6VXSBDZ-3WE", { family: "Halloween (1978)", version: "2017 full commentary", relation: "original WWAM commentary" }],
  ["NjH2tcGvmAY", { family: "Halloween (1978)", version: "2019 Halloween-night live repeat", relation: "repeat performance" }],
  ["28PfRNKoSCA", { family: "Halloween 4", version: "2017 full commentary", relation: "original WWAM commentary" }],
  ["KrBhfGxsJNM", { family: "Halloween 4", version: "2024 Halloween-night watch party", relation: "repeat performance" }],
  ["ZWF8TPnHr4Y", { family: "Halloween 6", version: "Producer's Cut", relation: "alternate cut" }],
  ["eE7I5NjXiqs", { family: "Halloween 6", version: "Theatrical / regular cut", relation: "alternate cut" }],
]);

function classify(title) {
  const text = String(title || "");
  if (/commentary|watch\s*party|watchalong/i.test(text)) return "watchalongs";
  if (/script\s+read/i.test(text)) return "script-readings";
  if (/tier\s+list|ranking|ranked|death\s+scenes|kill\s+v\s+kill|\bvs\.?\b|you\s+decide|fights/i.test(text)) return "rankings-and-events";
  if (/trailer/i.test(text)) return "trailers";
  if (/designer|writer|novelist|director|\bwith\b|\bw\s*['?]/i.test(text)) return "makers-and-guests";
  if (/review|spoiler|q\s*(?:and|\+|&)\s*a/i.test(text)) return "reviews-and-qas";
  return "news-theories-and-lore";
}

function coverageFor(record) {
  const acquiredRecord = acquiredById.get(record.id);
  if (acquiredRecord) return acquiredRecord.wikiStatus === "topic-navigation-only"
    ? "topic-navigation-only"
    : "caption-backed";
  if (record.catalog) return record.transcript === false ? "caption-limited" : "caption-backed";
  return record.coverage === "deeply-indexed" ? "caption-backed" : "metadata-only";
}

function evidenceLabel(coverage) {
  if (coverage === "caption-backed") return "PLAYABLE SHOW WIKI";
  if (coverage === "topic-navigation-only") return "PLAYABLE TOPIC MAP";
  if (coverage === "caption-limited") return "OFFICIAL SOURCE BRIEF";
  return "OFFICIAL SOURCE BRIEF";
}

function rolesFor(record, kind) {
  const title = String(record.title || "");
  const roles = [kind];
  if (/kills/i.test(title)) roles.push("Halloween Kills cycle");
  if (/ends/i.test(title)) roles.push("Halloween Ends cycle");
  if (/Halloween 4|Halloween IV/i.test(title)) roles.push("Halloween 4 mythology");
  if (/Halloween 6|Curse of Michael Myers/i.test(title)) roles.push("Halloween 6 mythology");
  if (/Michael Myers/i.test(title)) roles.push("Michael Myers");
  if (/Loomis/i.test(title)) roles.push("Dr. Loomis");
  if (/Season of the Witch|Halloween III/i.test(title)) roles.push("Dr. Challis");
  return [...new Set(roles)];
}

const sources = [...records.values()].map((record) => {
  const acquiredRecord = acquiredById.get(record.id);
  const enriched = enrichedById.get(record.id);
  const deepRecord = directDeepById.get(record.id);
  const detail = acquiredRecord || enriched || deepRecord || null;
  const kind = classify(record.title || record.film);
  const coverage = coverageFor(record);
  const rawMoments = detail ? (detail.moments || detail.bestMoments || []) : [];
  const rawTopics = detail ? (detail.topics || []) : [];
  const bestMoments = coverage === "caption-backed" ? rawMoments.slice(0, 8).map((moment) => ({
    t: Number(moment.t || moment.at || 0),
    label: moment.category || moment.label || "SOURCE MOMENT",
    excerpt: moment.excerpt || moment.quote || "",
    heat: Number(moment.heat || moment.score || 0),
    evidenceState: "source-local caption candidate; speaker not diarized",
  })) : [];
  const topics = !["metadata-only", "caption-limited"].includes(coverage)
    ? rawTopics.slice(0, 10).map((topic) => ({
      name: topic.name || topic.topic || "TOPIC",
      mentions: Number(topic.mentions || topic.count || 0),
      first: Number(topic.first || 0),
      peak: Number(topic.peak || topic.first || 0),
      receipt: topic.receipt || "",
      evidenceState: "source-local topic navigation",
    }))
    : [];
  const strictSteveTime = strictSteveTimes.get(record.id);
  const strictSteveRaw = strictSteveTime == null ? null : rawMoments.find((moment) =>
    Math.abs(Number(moment.t || moment.at || 0) - strictSteveTime) < 1
  );
  const stevesAsshole = strictSteveTime == null ? [] : [{
    t: strictSteveTime,
    label: "STRAIGHT TO STEVE'S ASSHOLE",
    excerpt: strictSteveRaw ? strictSteveRaw.excerpt || strictSteveRaw.quote || "" : "",
    originalLabel: strictSteveRaw ? strictSteveRaw.category || strictSteveRaw.label || "" : "",
    evidenceState: "strict hate/disgust phrase candidate; source coordinate verified",
  }];
  const source = {
    id: record.id,
    title: record.title || record.film,
    displayTitle: record.film || record.title,
    date: record.date || null,
    duration: Number(record.duration || 0),
    views: Number(record.views || 0),
    thumbnail: record.thumbnail || `https://i.ytimg.com/vi/${record.id}/maxresdefault.jpg`,
    url: record.url || `https://www.youtube.com/watch?v=${record.id}`,
    availability: record.availability || "not-captured",
    ageLimit: Number(record.ageLimit || 0),
    kind,
    roles: rolesFor(record, kind),
    coverage,
    evidenceLabel: evidenceLabel(coverage),
    playback: record.availability === "needs_auth" || Number(record.ageLimit || 0) >= 18
      ? "official-link-only"
      : "embedded-source",
    wordsAudited: Number(detail && detail.wordsAudited || 0),
    momentCount: bestMoments.length,
    topicCount: topics.length,
    summary: detail ? detail.summary || detail.editorial?.whyItMatters || "" : "",
    topics,
    bestMoments,
    upInYa: bestMoments.filter((moment) => /^(?:UP IN YA|OUT OF POCKET)$/i.test(moment.label)),
    stevesAsshole,
    sourceBasis: acquiredRecord ? "new caption acquisition" :
      enriched ? "commentary deep distill" :
      deepRecord ? "archive deep distill" :
      record.catalog ? "commentary catalog" : "official-feed metadata",
  };
  if (versionMap.has(record.id)) source.versionLineage = versionMap.get(record.id);
  return source;
}).sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title));

const crossoverMap = new Map();
for (const payload of crossoverPayloads) {
  for (const stream of payload.streams || []) {
    if (records.has(stream.id) || halloweenTitle.test(stream.title || "")) continue;
    const topic = (stream.topics || []).find((item) =>
      /^Halloween$/i.test(item.name || item.topic || "")
    );
    const mentions = Number(topic?.mentions || topic?.count || 0);
    if (mentions < 20) continue;
    const existing = crossoverMap.get(stream.id);
    if (existing && existing.mentions >= mentions) continue;
    const moments = (stream.moments || []).slice().sort((a, b) =>
      Number(b.heat || b.score || 0) - Number(a.heat || a.score || 0)
    );
    crossoverMap.set(stream.id, {
      id: stream.id,
      title: stream.title,
      date: stream.date || null,
      duration: Number(stream.duration || 0),
      thumbnail: stream.thumbnail || `https://i.ytimg.com/vi/${stream.id}/maxresdefault.jpg`,
      url: stream.url || `https://www.youtube.com/watch?v=${stream.id}`,
      mentions,
      first: Number(topic.first || 0),
      peak: Number(topic.peak || topic.first || 0),
      receipt: topic.receipt || "",
      strongestMoment: moments[0] ? {
        t: Number(moments[0].t || moments[0].at || 0),
        label: moments[0].category || moments[0].label || "SOURCE MOMENT",
        heat: Number(moments[0].heat || moments[0].score || 0),
      } : null,
      evidenceState: "caption-backed crossover topic map",
    });
  }
}
const crossovers = [...crossoverMap.values()].sort((a, b) => b.mentions - a.mentions || String(b.date).localeCompare(String(a.date)));

const byKind = Object.fromEntries([...new Set(sources.map((source) => source.kind))]
  .sort().map((kind) => [kind, sources.filter((source) => source.kind === kind).map((source) => source.id)]));
const byYear = Object.fromEntries([...new Set(sources.map((source) => String(source.date || "").slice(0, 4)).filter(Boolean))]
  .sort().map((year) => [year, sources.filter((source) => String(source.date || "").startsWith(year)).length]));

const watchalongLineage = sources.filter((source) =>
  source.kind === "watchalongs" || source.versionLineage
).map((source) => source.id);

const payload = {
  schema: "wwam-halloween-canon-index/v1",
  generated: "2026-07-26",
  titleRule: "Direct official-source title contains Halloween, Michael Myers, or Loomis; plus the WWAM Halloween commentary catalog and newly caption-acquired alternate cuts.",
  evidenceBoundary: "Caption-backed means source-local navigation exists. Metadata-only entries remain official-source briefs and receive no invented recap, moment, quote, speaker, or performance.",
  meta: {
    sources: sources.length,
    canonicalUnionBeforeNewAcquisition: 78,
    newlyDiscoveredAlternateCuts: sources.length - 78,
    captionBacked: sources.filter((source) => source.coverage === "caption-backed").length,
    topicNavigationOnly: sources.filter((source) => source.coverage === "topic-navigation-only").length,
    sourceBriefs: sources.filter((source) => ["metadata-only", "caption-limited"].includes(source.coverage)).length,
    summaryWikis: sources.filter((source) => source.summary).length,
    momentBackedWikis: sources.filter((source) => source.bestMoments.length).length,
    wordsAudited: sources.reduce((total, source) => total + source.wordsAudited, 0),
    momentReceipts: sources.reduce((total, source) => total + source.bestMoments.length, 0),
    machineUpInYaCandidates: sources.reduce((total, source) => total + source.upInYa.length, 0),
    strictSteveReceipts: sources.reduce((total, source) => total + source.stevesAsshole.length, 0),
    watchalongVersions: watchalongLineage.length,
    crossoverSources: crossovers.length,
    yearSpan: [sources.at(-1)?.date?.slice(0, 4), sources[0]?.date?.slice(0, 4)],
  },
  collections: {
    watchalongLineage,
    alternateNightPairs: Object.fromEntries([...new Set([...versionMap.values()].map((item) => item.family))]
      .map((family) => [family, sources.filter((source) => source.versionLineage?.family === family).map((source) => source.id)])),
    HalloweenKillsCycle: sources.filter((source) => source.roles.includes("Halloween Kills cycle")).map((source) => source.id),
    HalloweenEndsCycle: sources.filter((source) => source.roles.includes("Halloween Ends cycle")).map((source) => source.id),
    makersAndGuests: byKind["makers-and-guests"] || [],
    scriptReadings: byKind["script-readings"] || [],
    rankingsAndEvents: byKind["rankings-and-events"] || [],
    highPressureCrossovers: crossovers.map((source) => source.id),
  },
  byKind,
  byYear,
  sources,
  crossovers,
};

fs.writeFileSync(OUTPUT, `window.WWAM_HALLOWEEN_CANON = ${JSON.stringify(payload)};\n`, "utf8");
console.log(JSON.stringify(payload.meta, null, 2));

