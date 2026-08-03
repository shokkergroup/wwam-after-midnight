import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = path.join(ROOT, "public", "demo");
const LIMIT = 16;

function load(file, key) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(DEMO, file), "utf8"), context, { filename: file });
  return context.window[key];
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function inspect(value, sourceId, field, failures) {
  const text = clean(value);
  if (!text) return;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > LIMIT) failures.push({ sourceId, field, kind: "over-limit", words: words.length, text });
  if (/\[(?:screaming|yelling|shouting|laughter|music|inaudible|bleep)\]|(?:^|\s)>>(?=\s|$)/i.test(text)) {
    failures.push({ sourceId, field, kind: "stage-marker", text });
  }
  if (/\b(\w+)\s+(\w+)\s+\1\s+\2\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "two-token-loop", text });
  }
  if (/(?:\.{3,}|\u2026)\s*$/.test(text)) failures.push({ sourceId, field, kind: "trailing-ellipsis", text });
}

function inspectSummaryProse(value, sourceId, field, failures) {
  const text = clean(value);
  if (!text) return;
  // Summaries are intentionally longer than receipts. Audit only the quoted
  // transcript lines embedded inside them; those are the places where a hard
  // clip can make an otherwise useful dossier read like gibberish.
  const matches = text.matchAll(/[\u201c"]([^\u201d"]{8,180})[\u201d"]/g);
  for (const match of matches) {
    const quote = clean(match[1]);
    if (/\b(?:this|that|it)\s+is\s+(?:a|an|the)\s+[a-z0-9'â€™-]+\.?$/i.test(quote)
      || /\b(?:because|since|although|while|when|if)\s*\.?$/i.test(quote)
      || /\b(?:in|on|at|for|with|to|of|from)\s+(?:so|the|a|an|this|that|it|one)\.?$/i.test(quote)) {
      failures.push({ sourceId, field, kind: "clipped-summary-quote", text: quote });
    }
    if (/\[(?:screaming|yelling|shouting|laughter|music|inaudible|bleep)\]|(?:^|\s)>>(?=\s|$)/i.test(quote)) {
      failures.push({ sourceId, field, kind: "summary-stage-marker", text: quote });
    }
  }
}

function inspectLivestream(data, failures) {
  for (const episode of data.episodes || []) {
    const id = episode.id;
    inspectSummaryProse(episode.dossier?.summary, id, "dossier.summary", failures);
    inspectSummaryProse(episode.dossier?.tapeNote, id, "dossier.tapeNote", failures);
    inspectSummaryProse(episode.dossier?.whyItMatters, id, "dossier.whyItMatters", failures);
    for (const item of episode.moments || []) inspect(item.excerpt, id, "moments.excerpt", failures);
    for (const item of episode.chapters || []) inspect(item.excerpt, id, "chapters.excerpt", failures);
    for (const item of episode.fanSignals || []) inspect(item.excerpt, id, "fanSignals.excerpt", failures);
    for (const item of episode.bestBits || []) inspect(item.excerpt, id, "bestBits.excerpt", failures);
    for (const lane of episode.recurringBits || []) for (const item of lane.receipts || []) inspect(item.excerpt, id, "recurringBits.receipts.excerpt", failures);
    for (const character of episode.characterCues || []) for (const item of character.receipts || []) inspect(item.excerpt, id, "characterCues.receipts.excerpt", failures);
    for (const item of episode.watchPass?.candidates || []) {
      inspect(item.captionExcerpt, id, "watchPass.candidates.captionExcerpt", failures);
      inspect(item.excerpt, id, "watchPass.candidates.excerpt", failures);
    }
  }
}

function inspectWatchalong(data, failures) {
  for (const episode of data.episodes || []) {
    const id = episode.id;
    inspectSummaryProse(episode.dossier?.summary, id, "dossier.summary", failures);
    for (const item of episode.dossier?.cuts || []) inspect(item.excerpt, id, "dossier.cuts.excerpt", failures);
    for (const item of episode.dossier?.chapters || []) inspect(item.excerpt, id, "dossier.chapters.excerpt", failures);
    for (const item of episode.dossier?.fanSignals || []) inspect(item.excerpt, id, "dossier.fanSignals.excerpt", failures);
    for (const item of episode.topics || []) inspect(item.receipt, id, "topics.receipt", failures);
    for (const item of episode.sourceTopics || []) inspect(item.receipt, id, "sourceTopics.receipt", failures);
    for (const item of episode.watchPass?.candidates || []) {
      inspect(item.captionExcerpt, id, "watchPass.candidates.captionExcerpt", failures);
      inspect(item.excerpt, id, "watchPass.candidates.excerpt", failures);
    }
    for (const item of episode.alternateAudio?.routes || []) inspect(item.excerpt, id, "alternateAudio.routes.excerpt", failures);
  }
}

const failures = [];
const livestream = load("wwam-livestream-canon.js", "WWAM_LIVESTREAM_CANON");
const watchalong = load("wwam-watchalong-canon.js", "WWAM_WATCHALONG_CANON");
inspectLivestream(livestream, failures);
inspectWatchalong(watchalong, failures);
const checkedSources = new Set([...(livestream.episodes || []), ...(watchalong.episodes || [])].map((item) => item.id)).size;
console.log("WWAM PUBLIC RECEIPT AUDIT");
console.log(`Sources checked: ${checkedSources}`);
console.log(`Receipt failures: ${failures.length}`);
for (const failure of failures.slice(0, 20)) console.log(`  ${failure.sourceId} // ${failure.field} // ${failure.kind} // ${failure.text}`);
if (failures.length) process.exitCode = 1;
else console.log("PUBLIC RECEIPT GATE: PASS");
