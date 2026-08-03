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

test("overnight publisher ships both livestream and watchalong audio artifacts", () => {
  assert.match(supervisor, /wwam-livestream-asr-excerpts\.js/);
  assert.match(supervisor, /wwam-watchalong-canon\.js/);
  assert.match(supervisor, /wwam-watchalong-route-index\.js/);
  assert.match(supervisor, /combinedHash/);
});
