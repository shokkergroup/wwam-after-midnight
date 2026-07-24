import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const ui = fs.readFileSync(path.join(demo, "ask-review-ui.js"), "utf8");
const css = fs.readFileSync(path.join(demo, "ask-review.css"), "utf8");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");

test("Ask Review hydrates with its engine first and stays off the eager script path", () => {
  assert.match(
    html,
    /<section class="ask-room" id="ask"[\s\S]{0,220}data-feature-styles="ask-review\.css,play-answer\.css"[\s\S]{0,260}data-feature-scripts="ask-review-engine\.js,ask-review-ui\.js,channel-pack-contract\.js,wwam-channel-pack-adapter\.js,play-answer-engine\.js,play-answer-ui\.js"/,
  );
  assert.doesNotMatch(html, /<script[^>]+src="ask-review-(?:engine|ui)\.js"/);
  assert.doesNotMatch(html, /<link[^>]+href="ask-review\.css"/);
  assert.ok(
    html.indexOf('data-feature-scripts="ask-review-engine.js,ask-review-ui.js,channel-pack-contract.js,wwam-channel-pack-adapter.js,play-answer-engine.js,play-answer-ui.js"') <
      html.indexOf('<script src="feature-loader.js"></script>'),
  );
});

test("Ask Review UI captures only rendered answer coordinates into the bounded engine", () => {
  assert.match(ui, /query:\s*renderedQuery/);
  assert.match(ui, /getAttribute\("data-ask-query"\)/);
  assert.match(app, /resultsNode\.setAttribute\("data-ask-query",\s*String\(query \|\| ""\)\.trim\(\)\)/);
  assert.match(ui, /currentQuery !== renderedQuery/);
  assert.match(ui, /SUBMIT THE EDITED QUERY BEFORE REVIEWING IT/);
  assert.match(ui, /querySelectorAll\("\[data-ask-source\]\[data-id\]\[data-time\]"\)/);
  assert.match(ui, /querySelector\("\.derived-answer-copy, h3"\)/);
  assert.match(ui, /summary:\s*text\(answerSummary\)/);
  assert.match(ui, /sourceId:\s*button\.getAttribute\("data-id"\)/);
  assert.match(ui, /at:\s*Number\(button\.getAttribute\("data-time"\)\)/);
  assert.doesNotMatch(ui, /caption(?:Payload|Track)|transcript/i);
  assert.match(ui, /engine\.createPacket/);
  assert.match(ui, /data-ask-review-source/);
  assert.match(ui, /data-ask-review-time/);
  assert.match(ui, /data-ask-review-expected/);
  assert.match(ui, /parseSecond/);
});

test("review packets stay device-local until an explicit bounded export", () => {
  assert.match(ui, /wwam-ask-review-queue-v1/);
  assert.match(ui, /storage\.setItem\(STORAGE_KEY/);
  assert.match(ui, /DOWNLOAD QUEUE/);
  assert.match(ui, /wwam-ask-review-queue\.json/);
  assert.match(ui, /engine\.exportQueue\(queue\)/);
  assert.match(ui, /HELD IN MEMORY ONLY \/\/ STORAGE BLOCKED \/\/ DOWNLOAD QUEUE NOW/);
  assert.match(ui, /if \(!storage\) return false/);
  assert.doesNotMatch(ui, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
});

test("the interaction exposes useful and correction paths without claiming an apply", () => {
  for (const label of [
    "NAILED IT",
    "FLAG THIS ANSWER",
    "WRONG SOURCE",
    "WRONG SECOND",
    "WRONG ANSWER",
    "MISSING RECEIPT",
    "SPEAKER / ATTRIBUTION PROBLEM",
    "MISLEADING WORDING",
    "BETTER SOURCE ID // OPTIONAL",
    "BETTER SECOND // OPTIONAL",
    "EXPECTED ANSWER // OPTIONAL",
    "HOLD FOR REVIEW",
  ]) {
    assert.ok(ui.includes(label), label);
  }
  assert.match(ui, /NOTHING WAS SILENTLY REWRITTEN/);
  assert.match(ui, /DO NOT CHANGE ASK, CANON, OR SPEAKER CERTIFICATION/);
  assert.doesNotMatch(ui, /CORRECTION APPLIED|CANON UPDATED|SEARCH (?:FIXED|UPDATED)/);
});

test("the injected panel is accessible and restores a compact mobile stack", () => {
  assert.match(ui, /aria-labelledby/);
  assert.match(ui, /role="status" aria-live="polite"/);
  assert.match(ui, /type="submit"/);
  assert.match(ui, /type="button"/);
  assert.match(ui, /aria-expanded="false"/);
  assert.match(ui, /aria-controls="askReviewForm"/);
  assert.match(ui, /open\.focus\(\)/);
  assert.match(ui, /data-ask-review-helpful disabled/);
  assert.match(ui, /data-ask-review-open disabled/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /flex-direction:\s*column/);
  assert.match(css, /button:focus-visible/);
});

test("the lazy Ask Review assets remain separately bounded", () => {
  assert.ok(Buffer.byteLength(ui) < 15_000);
  assert.ok(Buffer.byteLength(css) < 6_000);
});
