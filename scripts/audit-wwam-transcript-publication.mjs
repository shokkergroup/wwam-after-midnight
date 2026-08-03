import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const METADATA_DIR = path.join(ROOT, "source-cache", "metadata");
const CAPTIONS_DIR = path.join(ROOT, "source-cache", "captions");
const DEMO_DIR = path.join(ROOT, "public", "demo");

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function loadPublic(file, key) {
  const context = { console };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(DEMO_DIR, file), "utf8"), context, { filename: file });
  return context[key] || {};
}
function isWatchalong(title) {
  const value = String(title || "");
  if (/commentary|watch\s*(?:along|party)/i.test(value)) return true;
  // Short-form watchalongs often say “Let's Watch” or “We Watched” without
  // the word commentary. Keep ordinary live news uploads out of this lane.
  return /\b(?:let'?s|we)\s+watch(?:ed)?\b/i.test(value) && !/\blive|stream/i.test(value);
}
function statusFor(kind, episode) {
  if (!episode) return "missing-public-episode";
  if (kind === "watchalong") {
    const caption = episode.dossier?.caption || {};
    if (caption.sourceKind !== "local-whisper-transcript") return "public-page-not-using-local-whisper";
    if (!Number(caption.events || 0)) return "local-whisper-events-empty";
    if (!Number(episode.dossier?.shape?.cuts || 0)) return "local-whisper-dossier-empty";
    return "ready";
  }
  const evidence = episode.dossier?.evidence || {};
  if (evidence.type !== "local-whisper-transcript") return "public-page-not-using-local-whisper";
  if (!Number(evidence.eventsAudited || 0)) return "local-whisper-events-empty";
  if (!Array.isArray(episode.moments) || !episode.moments.length) return "local-whisper-dossier-empty";
  return "ready";
}

const metadata = new Map(fs.readdirSync(METADATA_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => readJson(path.join(METADATA_DIR, file)))
  .map((record) => [record.id, record]));
const ledgers = fs.readdirSync(CAPTIONS_DIR)
  .filter((file) => file.endsWith(".asr.json"))
  .map((file) => file.replace(/\.asr\.json$/, ""));
const livestream = loadPublic("wwam-livestream-canon.js", "WWAM_LIVESTREAM_CANON");
const watchalong = loadPublic("wwam-watchalong-canon.js", "WWAM_WATCHALONG_CANON");
const publicEpisodes = {
  livestream: new Map((livestream.episodes || []).map((episode) => [episode.id, episode])),
  watchalong: new Map((watchalong.episodes || []).map((episode) => [episode.id, episode]))
};

const rows = ledgers.map((id) => {
  const record = metadata.get(id);
  const kind = !record ? "unclassified" : isWatchalong(record.title) ? "watchalong" : "livestream";
  if (kind === "unclassified") return { id, kind, title: "unknown source", status: "unclassified" };
  const status = statusFor(kind, publicEpisodes[kind].get(id));
  return { id, kind, title: record?.title || "unknown source", status };
});
const byKind = (kind) => rows.filter((row) => row.kind === kind);
const failures = rows.filter((row) => row.status !== "ready" && row.status !== "unclassified");
console.log("WWAM TRANSCRIPT PUBLICATION AUDIT");
console.log(`Local Whisper ledgers: ${rows.length}`);
for (const kind of ["livestream", "watchalong", "unclassified"]) {
  const group = byKind(kind);
  console.log(`${kind}: ${group.length} ledgers // ${group.filter((row) => row.status === "ready").length} visible and ready`);
}
if (failures.length) {
  console.log("Failures:");
  failures.forEach((row) => console.log(`  ${row.kind}\t${row.id}\t${row.status}\t${row.title}`));
} else {
  console.log("TRANSCRIPT PUBLICATION GATE: PASS");
}
if (process.argv.includes("--strict") && failures.length) process.exitCode = 1;
