import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const queue = fs.readFileSync(path.join(root, "scripts", "run_wwam_asr_queue.py"), "utf8");
const supervisor = fs.readFileSync(path.join(root, "scripts", "watch_wwam_asr_forever.ps1"), "utf8");

test("ASR queue refreshes the matching canon for watchalong transcripts", () => {
  assert.match(queue, /WATCHALONG_CANON_GENERATOR/);
  assert.match(queue, /row\.get\("kind"\).*watchalong/i);
  assert.match(queue, /generate-wwam-watchalong-canon\.mjs/);
});

test("ASR queue refreshes the visible livestream canon for livestream transcripts", () => {
  assert.match(queue, /LIVESTREAM_CANON_GENERATOR/);
  assert.match(queue, /row\.get\("kind"\).*livestream/i);
  assert.match(queue, /generate-wwam-livestream-canon\.mjs/);
  assert.match(queue, /TRANSCRIPT_PUBLICATION_AUDIT/);
  assert.match(queue, /audit-wwam-transcript-publication\.mjs/);
});

test("overnight publisher ships both livestream and watchalong audio artifacts", () => {
  assert.match(supervisor, /wwam-livestream-asr-excerpts\.js/);
  assert.match(supervisor, /wwam-livestream-canon\.js/);
  assert.match(supervisor, /wwam-livestream-cold-index\.js/);
  assert.match(supervisor, /wwam-watchalong-canon\.js/);
  assert.match(supervisor, /wwam-watchalong-route-index\.js/);
  assert.match(supervisor, /audit-wwam-transcript-publication\.mjs/);
  assert.match(supervisor, /audit-wwam-public-receipts\.mjs/);
  assert.match(supervisor, /transcript publication audit \/\/ running/);
  assert.match(supervisor, /transcript publication audit failed/);
  assert.match(supervisor, /combinedHash/);
});

test("overnight supervisor retries a genuinely stalled queue worker", () => {
  assert.match(supervisor, /function Test-QueueStall/);
  assert.match(supervisor, /no CPU\/log progress/);
  assert.match(supervisor, /Stop-Process -Id/);
  assert.match(supervisor, /QuietMinutes = 45/);
  assert.match(supervisor, /--batch-size\", \"4\"/);
});

test("overnight supervisor refuses competing instances", () => {
  assert.match(supervisor, /WWAM_After_Midnight_ASR_Supervisor/);
  assert.match(supervisor, /WaitOne\(0\)/);
});

test("transcript publication audit checks both visible canons", () => {
  const audit = fs.readFileSync(path.join(root, "scripts", "audit-wwam-transcript-publication.mjs"), "utf8");
  assert.match(audit, /wwam-livestream-canon\.js/);
  assert.match(audit, /wwam-watchalong-canon\.js/);
  assert.match(audit, /public-page-not-using-local-whisper/);
  assert.match(audit, /TRANSCRIPT PUBLICATION GATE: PASS/);
});

test("public receipt audit rejects clipped summary quotes", () => {
  const audit = fs.readFileSync(path.join(root, "scripts", "audit-wwam-public-receipts.mjs"), "utf8");
  assert.match(audit, /function inspectSummaryProse/);
  assert.match(audit, /clipped-summary-quote/);
  assert.match(audit, /fragment-tail/);
  assert.match(audit, /unbalanced-quote/);
  assert.match(audit, /malformed-terminal-punctuation/);
  assert.match(audit, /decoder-collision/);
  assert.match(audit, /clause-collision/);
  assert.match(audit, /adjacent-pronoun-collision/);
  assert.match(audit, /capitalized-clause-collision/);
  assert.match(audit, /repeated-negative-collision/);
  assert.match(audit, /dossier\.summary/);
});

test("public receipt audit rejects duplicate best-bit routes", () => {
  const audit = fs.readFileSync(path.join(root, "scripts", "audit-wwam-public-receipts.mjs"), "utf8");
  assert.match(audit, /function inspectRouteUniqueness/);
  assert.match(audit, /duplicate-route/);
  assert.match(audit, /inspectRouteUniqueness\(episode\.bestBits, id, "bestBits"/);
});

test("livestream Show Wiki separates acoustic-only cues into an expandable shelf", () => {
  const ui = fs.readFileSync(path.join(root, "public", "demo", "livestream-canon-ui.js"), "utf8");
  assert.match(ui, /function bestGrid\(e,a\)/);
  assert.match(ui, /lvc-best-audio-only/);
  assert.match(ui, /AUDIO-ONLY CUES \/\/ PRESS PLAY/);
  assert.match(ui, /captionAligned!==false/);
});

test("livestream listening doors prefer verified Whisper excerpts", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /captionWindowAt\(events, candidate\.t\)/);
  assert.match(generator, /canonical (?:YouTube )?audio \+ source-local Whisper transcript alignment/);
  assert.match(generator, /No local transcript window aligned; open the player at this timestamp/);
  assert.match(generator, /maxDistance = 42/);
});

test("local Whisper routes never fall back to stale automatic-caption text", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /const rawExcerpt = localWhisper\s*\?\s*captionWindowAt\(events, candidate\.t\)/);
  assert.match(generator, /canonical (?:YouTube )?audio route; local Whisper window unavailable at this timestamp/);
  assert.match(generator, /localWhisper \? captionWindowAt\(events, candidate\.t\) : \"\"/);
});

test("livestream watch-pass candidates use the bounded public receipt path", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /const captionExcerpt = localWhisper\s*\n\s*\? captionExcerptAt\(events, candidate\.t, 16\)/);
  assert.match(generator, /const publicCaptionExcerpt = isWeakPublicReceipt\(captionExcerpt\) \? "" : captionExcerpt/);
  assert.match(generator, /excerpt: publicCaptionExcerpt \|\| \(localWhisper/);
});

test("local Whisper evidence replaces legacy caption provenance", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /localWhisper \? \{\} : \(existing\?\.captionEvidence \|\| \{\}\)/);
  assert.match(generator, /Local Whisper transcript \(source audio\)/);
  assert.match(generator, /refreshArchiveSummary/);
});

test("existing machine moments are refreshed from the local transcript", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /refreshMachineMomentExcerpt/);
  assert.match(generator, /refreshedExistingMoments/);
  assert.match(generator, /source-local Whisper transcript alignment/);
});

test("visitor-facing recap quotes strip non-speech Whisper stage cues and vary their voice", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /snorts\?\|coughs\?\|sighs\?/);
  assert.match(generator, /screaming\|yelling\|shouting/);
  assert.match(generator, /A clean source line lands at/);
  assert.match(generator, /For a quick taste, press/);
  assert.match(generator, /The recurring WWAM lanes are/);
  assert.match(generator, /The chat contributes/);
  assert.match(generator, /The route points at the moment/);
  assert.match(generator, /Start with the door/);
  assert.doesNotMatch(generator, /The conversation keeps looping back to/);
  assert.doesNotMatch(generator, /I found \$\{listeningRoutes\.length\} extra places to press play/);
  assert.match(generator, /fillerWords <= 2/);
  assert.match(generator, /repeatedPhrases === 0/);
  assert.match(generator, /function quoteExcerpt\(value, limit = 22\)/);
  assert.match(generator, /function collapseRepeatedPhrases\(value\)/);
  assert.match(generator, /text = collapseRepeatedPhrases\(text\)/);
  assert.match(generator, /const publicWindow = words\(normalized\)\.slice\(0, publicLimit\)\.join\(" "\)/);
  assert.match(generator, /if \(!\/\[\.!\?\]\(\?:\\s\|\$\)\/.test\(publicWindow\)\) return ""/);
  assert.match(generator, /const fillerCount =/);
  assert.match(generator, /function isNoisyTranscript\(value\)/);
  assert.match(generator, /this\|that\|it\)\\s\+is\\s\+the\\s\+\(\?:to\|for\)\\s\+me/);
  assert.match(generator, /Adjacent pronouns followed by a fresh clause start/);
  assert.match(generator, /capitalization of two competing/);
  assert.match(generator, /Three competing negative starts/);
  assert.match(generator, /if \(isNoisyTranscript\(cased\)\) return ""/);
  assert.match(generator, /category: canonicalLaneLabel\(clean\(moment\.category/);
  assert.match(generator, /\}\)\)\.filter\(\(moment\) => moment\.excerpt \|\| moment\.captionAligned === false\);/);
  assert.match(generator, /const substantive = sentenceList\.filter/);
  assert.match(generator, /safeExcerpt\(receiptCandidate\.text, 16\)/);
  assert.match(generator, /const vividHits =/);
  assert.match(generator, /const adminHits =/);
  assert.ok(generator.includes("!/\\.\\.\\.$/.test(item.text)"));
  assert.match(generator, /item\.adminHits > 0 && item\.vividHits === 0/);
});

test("public moment and receipt shelves use the sentence-safe excerpt path", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /function safeExcerpt\(value, limit = 20\)/);
  assert.match(generator, /function captionFragments\(events, index/);
  assert.match(generator, /const expand = \(value\) => Array\.isArray\(value\) \? value : \[value\]/);
  assert.match(generator, /const publicLimit = Math\.min\(16, Math\.max\(8, Number\(limit\) \|\| 20\)\)/);
  assert.match(generator, /const boundedSentence = \(sentence\) =>/);
  assert.match(generator, /function trimDanglingClause\(value\)/);
  assert.match(generator, /function isLikelyFragment\(value\)/);
  assert.match(generator, /function sanitizePublicExcerpt\(value\)/);
  assert.match(generator, /dangling\s+\/\/\s+quote/);
  assert.match(generator, /\.replace\(\/\[,:;\]\\s\*\\\.\$\/, "\."\)/);
  assert.match(generator, /isLikelyFragment\(cased\)/);
  assert.match(generator, /refreshMachineMomentExcerpt/);
  assert.match(generator, /const refreshedExistingMoments = events\.length/);
  assert.match(generator, /excerpt: bestCaptionExcerpt\(captionWindow\(events, item\.index\)/);
  assert.match(generator, /excerpt: safeExcerpt\(route\.captionExcerpt \|\| route\.excerpt \|\| "", 24\)/);
  assert.match(generator, /excerpt: safeExcerpt\(moment\.excerpt \|\| moment\.quote \|\| "", 24\)/);
  assert.match(generator, /function bestBits[\s\S]*excerpt: safeExcerpt\(moment\.excerpt \|\| moment\.quote \|\| moment\.captionExcerpt \|\| "", 16\)/);
  assert.match(generator, /\.filter\(\(moment\) => moment\.excerpt && !isWeakPublicReceipt\(moment\.excerpt\)\)/);
  assert.match(generator, /source-local automatic caption alignment/);
});

test("best-bits keeps acoustic-only doors visible without inventing quotes", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /function bestBits\(moments, fan, listeningRoutes = \[\], audioCandidates = \[\]\)/);
  assert.match(generator, /A caption-ledger episode can already have a real audio watch pass/);
  assert.match(generator, /coveredAudioKeys = new Set\(listeningRoutes\.filter\(\(route\) => route\.captionAligned === true\)\.map/);
  assert.match(generator, /captionAligned: false/);
  assert.match(generator, /captionAligned: moment\.captionAligned === false \? false : moment\.captionAligned === true \? true : null/);
  assert.match(generator, /captionAligned: Boolean\(repairedExcerpt\)/);
  assert.match(generator, /moment\.excerpt \|\| moment\.captionAligned === false/);
  assert.match(generator, /bestBits\(moments, fan, listeningRoutes, audioCandidates\)/);
});

test("best-bits collapses duplicate timestamp lanes and prefers local evidence", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /const routeKey =/);
  assert.match(generator, /function canonicalLaneLabel\(value\)/);
  assert.match(generator, /category: canonicalLaneLabel/);
  assert.match(generator, /const routeRank =/);
  assert.match(generator, /const listeningKeys = new Set\(listeningRoutes\.map\(routeKey\)\)/);
  assert.match(generator, /const routeMap = new Map\(\)/);
  assert.match(generator, /routeRank\(moment\) > routeRank\(previous\)/);
});

test("sentence-safe receipts preserve punctuation across caption speaker markers", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /punctuation boundary followed by a plausible sentence starter/);
  assert.match(generator, /\?=\\s\*\(\?:>>\\s\*\)\?\[A-Z0-9/);
  assert.match(generator, /const bounded = trimDanglingClause\(clipped \|\| tokens\.slice\(0, limit\)\.join\(" "\)\);/);
  assert.match(generator, /return \/\[.!\?\]\$\/\.test\(bounded\) \? bounded : `\$\{bounded\}\.\`;/);
  assert.match(generator, /replace\(\/\\s\*>>\\s\*\/g, ""\)/);
  assert.match(generator, /two-token decoder stutter/);
  assert.match(generator, /\\1\\s\+\\2\\b/);
});

test("generic weekly recap headlines retain a date-level navigation handle", () => {
  const adapter = fs.readFileSync(path.join(root, "public", "demo", "wwam-episode-recap-adapter.js"), "utf8");
  assert.match(adapter, /genericTapeTitle = \/\(\?:we watched a movie\|movie news\|livestream\|live!\|let's watch scary videos\)/i);
  assert.match(adapter, /var dateTag = genericTapeTitle && clean\(metadata\.date\)/);
  assert.match(adapter, /if \(dateTag\) shortTapeTitle \+= dateTag/);
});

test("recap prose prefers bounded audio receipts over noisy topic fragments", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /const routeMoments = listeningRoutes\.length \? listeningRoutes : moments/);
  assert.match(generator, /hot\.excerpt \|\| hot\.captionExcerpt/);
  assert.match(generator, /let text = safeExcerpt\(sourceText, 16\)/);
  assert.match(generator, /const publicWindow = words\(sourceText\)\.slice\(0, 16\)\.join\(" "\)/);
  assert.match(generator, /const sentenceBound = \/\[\.!\?\]\(\?:\\s\|\$\)\/.test\(publicWindow\)/);
  assert.match(generator, /const generatedSummary = editorialPackBound \|\| \(!events\.length && tier === "source-brief"\)/);
  assert.match(generator, /item\.text && item\.sentenceBound/);
  assert.match(generator, /safeExcerpt\(receiptCandidate\.text, 16\)/);
});

test("visitor-facing route cards refuse punctuation-free decoder windows", () => {
  const livestreamUi = fs.readFileSync(path.join(root, "public", "demo", "livestream-canon-ui.js"), "utf8");
  const watchalongUi = fs.readFileSync(path.join(root, "public", "demo", "watchalong-canon-ui.js"), "utf8");
  assert.match(livestreamUi, /source=c\(z\.excerpt\|\|z\.quote\|\|z\.captionExcerpt\)/);
  assert.match(livestreamUi, /sourceWindow=.*slice\(0,16\)\.join\(" "\)/);
  assert.match(livestreamUi, /sourceWindow/);
  assert.match(livestreamUi, /test\(sourceWindow\)/);
  assert.match(watchalongUi, /long punctuation-free caption window/);
  assert.match(watchalongUi, /Transcript route available; open the timestamp to listen/);
  assert.match(watchalongUi, /excerpt\(item\.excerpt \|\| item\.quote, 190\) \|\| 'Transcript route available/);
});

test("watchalong listening cuts prefer local Whisper context", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-watchalong-canon.mjs"), "utf8");
  assert.match(generator, /function trimDanglingClause\(value\)/);
  assert.match(generator, /function isLikelyFragment\(value\)/);
  assert.match(generator, /long punctuation-free window/);
  assert.match(generator, /function sanitizeFanRead\(value\)/);
  assert.match(generator, /sanitizeFanRead\(guide\?\.fanRead\)/);
  assert.match(generator, /whisperContext/);
  assert.match(generator, /sourceKind === "local-whisper-transcript"/);
  assert.match(generator, /canonical YouTube audio \+ source-local Whisper transcript alignment/);
});

test("sparse long watchalongs receive neutral transcript checkpoints", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-watchalong-canon.mjs"), "utf8");
  assert.match(generator, /function runtimeCoverageFloor\(duration\)/);
  assert.match(generator, /if \(duration >= 10800\) return 12/);
  assert.match(generator, /function coverageMoments\(events, duration, existing\)/);
  assert.match(generator, /category: "TAPE CHECKPOINT"/);
  assert.match(generator, /baseMoments\.concat\(coverageMoments\(events, duration, baseMoments\)\)/);
  assert.match(generator, /source-local Whisper transcript coverage checkpoint/);
});

test("watchalong pilot shelves bound raw multi-window captions before publication", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-watchalong-canon.mjs"), "utf8");
  assert.match(generator, /public watch-pass shelf/);
  assert.match(generator, /captionExcerpt: text, excerpt: text/);
  assert.match(generator, /excerpt\(normalizeCaptionText\(candidate\.captionExcerpt \|\| candidate\.excerpt \|\| ""\), 16\)/);
});

test("local fan and recurring lanes carry local transcript provenance", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /source-local Whisper transcript fan-callout cluster/);
  assert.match(generator, /source-local Whisper transcript lane cue/);
  assert.match(generator, /\$\{eventEvidenceBasis\} \+ bounded timestamp receipts/);
  assert.match(generator, /source-local Whisper transcript route checkpoint/);
});

test("visible canon audit rejects stale automatic-caption lanes", () => {
  const audit = fs.readFileSync(path.join(root, "scripts", "audit-wwam-transcript-publication.mjs"), "utf8");
  assert.match(audit, /visible-canon-still-automatic-caption/);
  assert.match(audit, /episode\.conversationThreads/);
});

test("watchalong keyword and fan lanes preserve Whisper provenance", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-watchalong-canon.mjs"), "utf8");
  assert.match(generator, /source-local Whisper transcript keyword cluster/);
  assert.match(generator, /source-local Whisper transcript fan-callout cluster/);
  assert.match(generator, /source-local Whisper transcript route checkpoint/);
});

test("audio route pickers reserve multiple WWAM-native lanes before score fill", () => {
  const livestreamPass = fs.readFileSync(path.join(root, "scripts", "run_wwam_2026_livestream_audio_watch_pass.py"), "utf8");
  const sharedPass = fs.readFileSync(path.join(root, "scripts", "run_wwam_audio_watch_pass.py"), "utf8");
  assert.match(livestreamPass, /anchor_quota = 3 if max_candidates >= 24 else 2/);
  assert.match(sharedPass, /anchor_quota = 3 if max_candidates >= 24 else 2/);
  assert.match(livestreamPass, /from run_wwam_audio_watch_pass import/);
  assert.match(sharedPass, /candidate\["category"\] == category/);
});

test("empty moment shelves explain the audio route index instead of implying a missing show", () => {
  const ui = fs.readFileSync(path.join(root, "public", "demo", "livestream-canon-ui.js"), "utf8");
  assert.match(ui, /THE AUDIO ROUTE SHELF ABOVE IS THIS SHOW/);
});

test("cold Show Wiki shelves reserve native lanes before chronological fill", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /COLD_ROUTE_PRIORITY/);
  assert.match(generator, /chooseDiverseColdCuts\(cuts, 12\)/);
});

test("watchalong publication keeps special broadcasts visible and bounds nearby caption context", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-watchalong-canon.mjs"), "utf8");
  assert.match(generator, /sdiVxLTq67Q/);
  assert.match(generator, /anniversary broadcast; retained as a companion source/);
  assert.match(generator, /excerpt\(context\.text, 16\)/);
  assert.match(generator, /excerpt\(`NEARBY CAPTION CONTEXT \/\/ \$\{nearbyCaption\.text\}`, 16\)/);
  assert.match(generator, /function isNoisyTranscript\(value\)/);
  assert.match(generator, /obvious Whisper boundary joins/);
  assert.match(generator, /function sanitizePublicExcerpt\(value\)/);
  assert.match(generator, /function publicReceiptText\(value\)[\s\S]*isNoisyTranscript\(text\)/, "guide cuts use the same transcript splice quarantine");
  assert.match(generator, /isLikelyFragment\(cased\) \|\| isNoisyTranscript\(cased\)/);
});
