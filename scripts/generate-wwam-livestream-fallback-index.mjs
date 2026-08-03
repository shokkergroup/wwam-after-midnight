import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const sourcePath = path.join(demo, "wwam-livestream-audio-pass.js");
const outputPath = path.join(demo, "wwam-livestream-fallback-index.js");
const source = fs.readFileSync(sourcePath, "utf8");
const json = JSON.parse(source.slice(source.indexOf("=") + 1).trim().replace(/;\s*$/, ""));

const laneOrder = [
  "STRAIGHT TO STEVE'S ASSHOLE",
  "WWAM UP IN YA",
  "CHARACTER SIGNAL",
  "FAN SIGNAL",
  "TAKE GETS NUCLEAR",
  "FULL SEND",
  "ROOM BREAK",
];

function words(value) {
  return String(value || "").match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function excerpt(value, limit = 16) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Source-local audio candidate; press play to hear the tape.";
  const tokens = words(clean);
  return tokens.length <= limit ? clean : `${tokens.slice(0, limit).join(" ")}…`;
}

function normalize(candidate) {
  return {
    t: Number(candidate.t || 0),
    end: Number(candidate.end || 0) || null,
    category: String(candidate.category || candidate.label || "AUDIO ROUTE"),
    label: String(candidate.label || candidate.category || "AUDIO ROUTE"),
    score: Number(candidate.score || 0),
    excerpt: excerpt(candidate.captionExcerpt),
    evidenceBasis: String(candidate.evidenceBasis || "canonical YouTube audio + source-local caption alignment"),
    sourceKind: "audio-pass",
    reviewStatus: String(candidate.reviewStatus || "audio-feature-candidate; playback remains the authority"),
  };
}

function selectCandidates(candidates) {
  const normalized = (candidates || [])
    .map(normalize)
    .filter((candidate) => Number.isFinite(candidate.t) && candidate.t > 0)
    .sort((a, b) => b.score - a.score || a.t - b.t);
  const selected = [];
  const used = new Set();
  for (const lane of laneOrder) {
    const hit = normalized.find((candidate) => candidate.category === lane && !used.has(candidate.t));
    if (hit) {
      selected.push(hit);
      used.add(hit.t);
    }
  }
  for (const candidate of normalized) {
    if (selected.length >= 10) break;
    if (used.has(candidate.t)) continue;
    selected.push(candidate);
    used.add(candidate.t);
  }
  return selected.sort((a, b) => a.t - b.t);
}

const episodes = {};
for (const [id, episode] of Object.entries(json.episodes || {})) {
  const candidates = selectCandidates(episode.candidates);
  if (!candidates.length) continue;
  episodes[id] = {
    id,
    status: "audio-feature-fallback-index",
    candidates,
  };
}

const payload = {
  schema: "shokker-wwam-livestream-fallback-index/v1",
  generated: new Date().toISOString(),
  policy: "Small source-local category lane index; audio windows remain candidates and playback remains authoritative.",
  laneOrder,
  maxCandidatesPerEpisode: 10,
  episodes,
};

fs.writeFileSync(
  outputPath,
  `/* Generated from the checked-in audio-feature pass. */\nwindow.WWAM_LIVESTREAM_FALLBACK_INDEX = ${JSON.stringify(payload)};\n`,
  "utf8",
);
console.log(`Wrote ${outputPath}: ${Object.keys(episodes).length} episodes // ${Object.values(episodes).reduce((sum, episode) => sum + episode.candidates.length, 0)} category routes`);
