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
  if ((text.match(/"/g) || []).length % 2 === 1) failures.push({ sourceId, field, kind: "unbalanced-quote", text });
  if (/[,.]\s*\.$/.test(text)) failures.push({ sourceId, field, kind: "malformed-terminal-punctuation", text });
  if (/\b(?:do you do|the both of you|i just don't i|the just the|i saw it in the just the|what the do|i'm not it's not)\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "decoder-collision", text });
  }
  if (/\b(?:this|that|it)\s+is\s+the\s+(?:to|for)\s+me\b/i.test(text)
    || /\b(?:i|you|he|she|we|they)\s+(?:hate|love|like)\s+(?:this|that|it)\s+is\s+the\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "clause-collision", text });
  }
  if (/\b(?:i|you|he|she|we|they)\s+(?:i|you|he|she|we|they)\s+(?:don't|can't|won't|didn't|haven't|hasn't|am|is|are|was|were|thought|got|just)\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "adjacent-pronoun-collision", text });
  }
  if (/\bI\s+(?:if|what|well|you|she|it|they|he|we)\b/.test(text)) {
    failures.push({ sourceId, field, kind: "capitalized-clause-collision", text });
  }
  if (/\b(?:i|you|he|she|we|they)\s+(?:don't|can't|won't|didn't)\b(?:\s+[a-z']+){0,3}\s+\b(?:i|you|he|she|we|they)\s+(?:don't|can't|won't|didn't)\b(?:\s+[a-z']+){0,3}\s+\b(?:i|you|he|she|we|they)\s+(?:don't|can't|won't|didn't)\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "repeated-negative-collision", text });
  }
  if (/\b(?:like|so|yeah|well)\b.*\b(?:like|so|yeah|well)\b.*\b(?:like|so|yeah|well)\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "filler-collision", text });
  }
  // A route can be playable and still be a bad public receipt. Keep these
  // decoder-boundary checks in the audit as a backstop for future generators:
  // lower-case sentence restarts, unfinished adverb tails, repeated stems,
  // and determiner/pronoun collisions are navigation cues, not clean quotes.
  if (/[.!?]\s+[a-z]/.test(text)) {
    failures.push({ sourceId, field, kind: "lowercase-boundary-restart", text });
  }
  if (/\b([a-z]{4,})(?:s|es|ed|ing)?\s+\1(?:s|es|ed|ing)?\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "repeated-word-stem", text });
  }
  if (/\b(?:the|a|an)\s+(?:that|this|his|her|their|my|your|our|its)\b/i.test(text)
    || /\b(?:all|both|three)\s+(?:of\s+)?those\s+that\s+right\b/i.test(text)
    || /\b(?:these|those)\s+(?:this|that)\s+(?:one|right|is|was)\b/i.test(text)
    || /\bthat(?:'s|\s+is)\s+not\s+that\s+one(?:'s|\s+is)\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "determiner-boundary-collision", text });
  }
  if (/\b(?:probably|perhaps|maybe)\.?$/i.test(text)) {
    failures.push({ sourceId, field, kind: "unfinished-adverb-tail", text });
  }
  if (/\blook at\s+(?:his|her|the)\s+look at\b/i.test(text)
    || /\b(?:it's got|it has)\s+(?:we got|we have|they got|they have)\b/i.test(text)
    || /\b(?:that's|there's|it's)\s+(?:just|one|the)\s+(?:that's|there's|it's)\b/i.test(text)
    || /\bbefore\b[^.!?]{0,50}\bbefore\s+(?:just|you|we|i)\b/i.test(text)
    || /\b[A-Z][a-z]+,\s+[A-Z]{3,}\b/.test(text)
    || /\b(?:oh|he|hey)\s+(?:he|hey)\s+(?:hey|he)\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "capitalized-boundary-splice", text });
  }
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
    if (/\b(?:and|but|or|because|since|although|while|when|if|which|that|who|with|for|to|of|about|using|like|as)\.?\s*$/i.test(quote)
      || /\b(?:that|this|it|i|you|he|she|we|they)\s+(?:makes?|was|were|am|is|are|have|has|had|did|do|does|will|would|could|should|can)\.?\s*$/i.test(quote)) {
      failures.push({ sourceId, field, kind: "fragment-tail", text: quote });
    }
    if (/\b(?:this|that|it)\s+is\s+(?:a|an|the)\s+[a-z0-9'â€™-]+\.?$/i.test(quote)
      || /\b(?:because|since|although|while|when|if)\s*\.?$/i.test(quote)
      || /\b(?:in|on|at|for|with|to|of|from)\s+(?:so|the|a|an|this|that|it|one)\.?$/i.test(quote)) {
      failures.push({ sourceId, field, kind: "clipped-summary-quote", text: quote });
    }
    if (/\[(?:screaming|yelling|shouting|laughter|music|inaudible|bleep)\]|(?:^|\s)>>(?=\s|$)/i.test(quote)) {
      failures.push({ sourceId, field, kind: "summary-stage-marker", text: quote });
    }
    if (/[.!?]\s+[a-z]/.test(quote)
      || /\b(?:probably|perhaps|maybe)\.?$/i.test(quote)
      || /\b(?:the|a|an)\s+(?:that|this|his|her|their|my|your|our|its)\b/i.test(quote)) {
      failures.push({ sourceId, field, kind: "summary-decoder-boundary", text: quote });
    }
  }
}

function inspectRouteUniqueness(items, sourceId, field, failures) {
  const seen = new Set();
  for (const item of items || []) {
    const key = `${Math.round(Number(item?.t || 0))}|${clean(item?.category || item?.label || "SOURCE RECEIPT")}`;
    if (seen.has(key)) failures.push({ sourceId, field, kind: "duplicate-route", text: key });
    seen.add(key);
  }
}

function inspectFanReadBody(value, sourceId, field, failures) {
  const text = clean(value);
  if (!text) return;
  // Fan-facing cards are authored prose, not transcript receipts, but they
  // still need the same basic sentence hygiene. These checks catch the exact
  // failure mode that made the archive feel machine-written: a plural lane
  // taking a singular verb or a withheld quote starting a sentence lowercase.
  if (/[.!?]\s+[a-z]/.test(text)) {
    failures.push({ sourceId, field, kind: "editorial-lowercase-boundary", text });
  }
  if (/\b(?:kill scenes|effects and gore|the mask and the look|direction and camera|score and sound|performances|lore and continuity)\s+is the\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "editorial-plural-lane-grammar", text });
  }
  if (/\bthe full exchange\b/i.test(text)) {
    failures.push({ sourceId, field, kind: "editorial-placeholder-quote", text });
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
    inspectRouteUniqueness(episode.bestBits, id, "bestBits", failures);
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
    inspectFanReadBody(episode.dossier?.fanRead?.whyThisNightMatters?.body, id, "dossier.fanRead.whyThisNightMatters.body", failures);
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
