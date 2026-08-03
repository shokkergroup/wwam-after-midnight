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

test("livestream listening doors prefer verified Whisper excerpts", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /captionWindowAt\(events, candidate\.t\)/);
  assert.match(generator, /canonical audio \+ source-local Whisper transcript alignment/);
  assert.match(generator, /No local transcript window aligned; open the player at this timestamp/);
  assert.match(generator, /maxDistance = 42/);
});

test("local Whisper routes never fall back to stale automatic-caption text", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /localWhisper\s*\?\s*\(captionWindowAt\(events, candidate\.t\) \|\| \"No local transcript window aligned/);
  assert.match(generator, /canonical audio route; local Whisper window unavailable at this timestamp/);
  assert.match(generator, /localWhisper \? captionWindowAt\(events, candidate\.t\) : \"\"/);
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
  assert.match(generator, /The cleanest bit of tape I found starts at/);
  assert.match(generator, /For a quick taste, press/);
  assert.match(generator, /The house specialties here are/);
  assert.match(generator, /Fan traffic adds/);
  assert.match(generator, /The route points at the moment/);
  assert.match(generator, /Start with the timestamp/);
  assert.match(generator, /humanMomentLabel\(hot\?\.category \|\| "the first big turn"\)\.replace/);
  assert.match(generator, /fillerWords <= 2/);
  assert.match(generator, /repeatedPhrases === 0/);
  assert.match(generator, /function quoteExcerpt\(value, limit = 22\)/);
  assert.match(generator, /const substantive = sentenceList\.find/);
  assert.match(generator, /quoteExcerpt\(receiptCandidate\.text, 22\)/);
  assert.match(generator, /const vividHits =/);
  assert.match(generator, /const adminHits =/);
  assert.ok(generator.includes("!/\\.\\.\\.$/.test(item.text)"));
  assert.match(generator, /item\.adminHits > 0 && item\.vividHits === 0/);
});

test("public moment and receipt shelves use the sentence-safe excerpt path", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /function safeExcerpt\(value, limit = 20\)/);
  assert.match(generator, /refreshMachineMomentExcerpt/);
  assert.match(generator, /const refreshedExistingMoments = events\.length/);
  assert.match(generator, /excerpt: safeExcerpt\(captionWindow\(events, item\.index\), 24\)/);
  assert.match(generator, /excerpt: safeExcerpt\(route\.captionExcerpt \|\| route\.excerpt \|\| "", 24\)/);
  assert.match(generator, /excerpt: safeExcerpt\(moment\.excerpt \|\| moment\.quote \|\| "", 24\)/);
  assert.match(generator, /source-local automatic caption alignment/);
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
});

test("watchalong listening cuts prefer local Whisper context", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-watchalong-canon.mjs"), "utf8");
  assert.match(generator, /whisperContext/);
  assert.match(generator, /sourceKind === "local-whisper-transcript"/);
  assert.match(generator, /canonical YouTube audio \+ source-local Whisper transcript alignment/);
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
