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
});

test("overnight publisher ships both livestream and watchalong audio artifacts", () => {
  assert.match(supervisor, /wwam-livestream-asr-excerpts\.js/);
  assert.match(supervisor, /wwam-livestream-canon\.js/);
  assert.match(supervisor, /wwam-livestream-cold-index\.js/);
  assert.match(supervisor, /wwam-watchalong-canon\.js/);
  assert.match(supervisor, /wwam-watchalong-route-index\.js/);
  assert.match(supervisor, /audit-wwam-transcript-publication\.mjs/);
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
