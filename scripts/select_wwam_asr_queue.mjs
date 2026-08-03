import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const audioDir = path.join(root, "source-cache", "audio");
const captionDir = path.join(root, "source-cache", "captions");
const output = path.join(root, "source-cache", "wwam-asr-queue.json");

function loadJsJson(file) {
  const text = fs.readFileSync(path.join(demo, file), "utf8");
  return JSON.parse(text.slice(text.indexOf("=") + 1).trim().replace(/;\s*$/, ""));
}

function episodeRows(data) {
  return Array.isArray(data.episodes) ? data.episodes : Object.values(data.episodes || {});
}

function localAudio(id) {
  for (const suffix of [".m4a", ".webm", ".mp3"]) {
    const file = path.join(audioDir, `${id}${suffix}`);
    if (fs.existsSync(file) && fs.statSync(file).size > 1024) return `source-cache/audio/${id}${suffix}`;
  }
  return null;
}

function hasAsr(id) {
  return fs.existsSync(path.join(captionDir, `${id}.asr.json`));
}

const titleSignals = [
  ["Halloween", 28], ["Scream", 25], ["Nightmare", 24], ["Friday the 13th", 24],
  ["Michael Myers", 24], ["Jason", 20], ["character", 12], ["tier list", 10],
  ["spoiler", 8], ["movie news", 5],
];

function score(row, kind) {
  const title = String(row.title || "");
  const titleScore = titleSignals.reduce((sum, [signal, value]) =>
    sum + (title.toLowerCase().includes(signal.toLowerCase()) ? value : 0), 0);
  const year = Number(String(row.date || "").slice(0, 4)) || 0;
  const recency = Math.max(0, year - 2015) * 1.4;
  const views = Math.min(24, Math.log10(Math.max(1, Number(row.views || 0))) * 4);
  const runtime = Math.min(12, Math.max(0, Number(row.duration || 0) / 1800));
  const kindBonus = kind === "watchalong" ? 9 : 0;
  return Math.round((titleScore + recency + views + runtime + kindBonus) * 100) / 100;
}

const candidates = [];
for (const [file, kind] of [["wwam-livestream-canon.js", "livestream"], ["wwam-watchalong-canon.js", "watchalong"]]) {
  for (const row of episodeRows(loadJsJson(file))) {
    const id = String(row.id || "").trim();
    const audio = id && localAudio(id);
    if (!id || !audio || hasAsr(id)) continue;
    candidates.push({
      id, kind, title: row.title || id, date: row.date || null,
      duration: Number(row.duration || 0), views: Number(row.views || 0),
      audio, priority: score(row, kind),
    });
  }
}
candidates.sort((left, right) => right.priority - left.priority || String(right.date).localeCompare(String(left.date)));
const payload = {
  schema: "wwam-asr-queue/v1",
  generatedAt: new Date().toISOString(),
  policy: "local audio only; full ledgers remain private; publish bounded excerpts after alignment checks",
  available: candidates.length,
  next: candidates.slice(0, 30),
};
fs.writeFileSync(output, JSON.stringify(payload, null, 2) + "\n");
console.log(`ASR queue: ${candidates.length} local-audio sources still without a Whisper ledger`);
for (const row of payload.next.slice(0, 12)) console.log(`${row.kind}\t${row.id}\t${row.priority}\t${row.date}\t${row.title}`);
