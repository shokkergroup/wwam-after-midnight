import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");

function loadWindow(file) {
  const source = fs.readFileSync(path.join(demo, file), "utf8");
  return JSON.parse(source.slice(source.indexOf("=") + 1).trim().replace(/;\s*$/, ""));
}

const canon = loadWindow("wwam-livestream-canon.js");
const pass = fs.existsSync(path.join(demo, "wwam-livestream-audio-pass.js"))
  ? loadWindow("wwam-livestream-audio-pass.js")
  : { episodes: {}, coverage: {} };
const yearFilter = new Set(process.argv.slice(2).filter((value) => /^\d{4}$/.test(value)));
const episodes = canon.episodes.filter((episode) => !yearFilter.size || yearFilter.has(String(episode.year || episode.date || "").slice(0, 4)));
const records = pass.episodes || {};
const summary = {};
const missing = [];
for (const episode of episodes) {
  const year = String(episode.year || episode.date || "unknown").slice(0, 4);
  const record = records[episode.id];
  const rss = episode.rssAudioPass;
  const bucket = summary[year] || (summary[year] = { sources: 0, audio: 0, alternateAudio: 0, held: 0, candidates: 0, alternateCandidates: 0, audioSeconds: 0, alternateAudioSeconds: 0 });
  bucket.sources += 1;
  if (record?.status === "audio-feature-pass") {
    bucket.audio += 1;
    bucket.candidates += Number(record.audit?.candidateCount || 0);
    bucket.audioSeconds += Number(record.audit?.audioRows || 0);
  } else if (rss?.status === "rss-audio-feature-pass") {
    // Alternate official mirror: retain its podcast-local clock separately
    // instead of silently treating it as a YouTube timestamp lane.
    bucket.alternateAudio += 1;
    bucket.alternateCandidates += Number(rss.audit?.candidateCount || 0);
    bucket.alternateAudioSeconds += Number(rss.audit?.audioRows || rss.media?.durationSeconds || 0);
  } else {
    bucket.held += 1;
    missing.push({ id: episode.id, year, title: episode.title, status: record?.status || "not-indexed-in-audio-pass" });
  }
}
const totals = Object.values(summary).reduce((out, bucket) => {
  out.sources += bucket.sources;
  out.audio += bucket.audio;
  out.alternateAudio += bucket.alternateAudio;
  out.held += bucket.held;
  out.candidates += bucket.candidates;
  out.alternateCandidates += bucket.alternateCandidates;
  out.audioSeconds += bucket.audioSeconds;
  out.alternateAudioSeconds += bucket.alternateAudioSeconds;
  return out;
}, { sources: 0, audio: 0, alternateAudio: 0, held: 0, candidates: 0, alternateCandidates: 0, audioSeconds: 0, alternateAudioSeconds: 0 });
const result = {
  schema: "wwam-livestream-audio-coverage-audit/v1",
  generatedAt: new Date().toISOString(),
  filter: [...yearFilter].sort(),
  totals,
  years: summary,
  missing,
  passCoverage: pass.coverage ? { ...pass.coverage, alternateAudio: totals.alternateAudio, effectiveAudioAnalyzed: totals.audio + totals.alternateAudio, effectiveHeld: totals.held } : null,
};
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes("--check") && missing.length) process.exitCode = 2;
