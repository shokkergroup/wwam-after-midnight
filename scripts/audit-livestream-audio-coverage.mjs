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
  const bucket = summary[year] || (summary[year] = { sources: 0, audio: 0, held: 0, candidates: 0, audioSeconds: 0 });
  bucket.sources += 1;
  if (record?.status === "audio-feature-pass") {
    bucket.audio += 1;
    bucket.candidates += Number(record.audit?.candidateCount || 0);
    bucket.audioSeconds += Number(record.audit?.audioRows || 0);
  } else {
    bucket.held += 1;
    missing.push({ id: episode.id, year, title: episode.title, status: record?.status || "not-indexed-in-audio-pass" });
  }
}
const totals = Object.values(summary).reduce((out, bucket) => {
  out.sources += bucket.sources;
  out.audio += bucket.audio;
  out.held += bucket.held;
  out.candidates += bucket.candidates;
  out.audioSeconds += bucket.audioSeconds;
  return out;
}, { sources: 0, audio: 0, held: 0, candidates: 0, audioSeconds: 0 });
const result = {
  schema: "wwam-livestream-audio-coverage-audit/v1",
  generatedAt: new Date().toISOString(),
  filter: [...yearFilter].sort(),
  totals,
  years: summary,
  missing,
  passCoverage: pass.coverage || null,
};
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes("--check") && missing.length) process.exitCode = 2;
