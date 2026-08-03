import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");

function loadWindow(file) {
  const source = fs.readFileSync(path.join(demo, file), "utf8");
  return JSON.parse(source.slice(source.indexOf("=") + 1).trim().replace(/;\s*$/, ""));
}

const ui = fs.readFileSync(path.join(demo, "livestream-canon-ui.js"), "utf8");
const forbidden = [
  "MACHINE-SURFACED DRAFT",
  "TAPE NOTE // EPISODE-SPECIFIC SOURCE READ",
  "TAPE HOOK // ROUGH CAPTION SURFACE",
];
const violations = forbidden.filter((needle) => ui.includes(needle));
const required = [
  "LISTENING NOTE // EPISODE ROUTE",
  "START HERE // BEST LISTENING DOOR",
  "ROOM HEAT // CLICK A BAR",
];
const missing = required.filter((needle) => !ui.includes(needle));

const canon = loadWindow("wwam-livestream-canon.js");
const episodes = Array.isArray(canon.episodes) ? canon.episodes : [];
const weakSummaries = episodes.filter((episode) => {
  const dossier = episode.dossier || {};
  const summary = String(dossier.summary || "").trim();
  return summary.length < 70 || />>|\[\s*__\s*\]|machine[- ]candidate|source-local automatic caption/i.test(summary);
});

console.log("WWAM READABLE SHELL AUDIT");
console.log(`Episodes checked: ${episodes.length}`);
console.log(`Forbidden machine-facing blocks: ${violations.length}`);
console.log(`Required human-facing route labels missing: ${missing.length}`);
console.log(`Weak dossier summaries: ${weakSummaries.length}`);

if (violations.length || missing.length || weakSummaries.length) {
  if (violations.length) console.log("Forbidden:", violations.join(" // "));
  if (missing.length) console.log("Missing:", missing.join(" // "));
  if (weakSummaries.length) console.log("Weak IDs:", weakSummaries.map((episode) => episode.id).join(", "));
  process.exitCode = 1;
} else {
  console.log("READABLE SHELL GATE: PASS");
}
