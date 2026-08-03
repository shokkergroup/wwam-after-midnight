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
  assert.match(generator, /localWhisper \? \(captionWindowAt\(events, candidate\.t\) \|\| \"No local transcript window aligned/);
  assert.match(generator, /canonical audio route; local Whisper window unavailable at this timestamp/);
  assert.match(generator, /localWhisper \? captionWindowAt\(events, candidate\.t\) : \"\"/);
});

test("existing machine moments are refreshed from the local transcript", () => {
  const generator = fs.readFileSync(path.join(root, "scripts", "generate-wwam-livestream-canon.mjs"), "utf8");
  assert.match(generator, /refreshMachineMomentExcerpt/);
  assert.match(generator, /refreshedExistingMoments/);
  assert.match(generator, /source-local Whisper transcript alignment/);
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
