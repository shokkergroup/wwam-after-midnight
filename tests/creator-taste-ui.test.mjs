import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(demo, "creator-taste-ui.js"), "utf8");
const css = fs.readFileSync(path.join(demo, "creator-taste.css"), "utf8");

test("The Cut Test loads its universal contract before its channel skin", () => {
  assert.match(
    html,
    /id="cut-test"[\s\S]{0,180}data-feature-styles="creator-taste\.css"[\s\S]{0,180}data-feature-scripts="channel-pack-contract\.js,wwam-channel-pack-adapter\.js,creator-taste-engine\.js,creator-taste-ui\.js"/,
  );
  for (const id of [
    "cutTestProof",
    "cutTestGoal",
    "cutTestRisk",
    "cutTestStart",
    "cutTestStage",
    "cutTestResults",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test("the UI compiles the real ChannelPack and binds goal plus risk", () => {
  assert.match(
    ui,
    /ShokkerChannelPack\.compile\(\s*dna,\s*root\.WWAM_CHANNEL_PACK_ADAPTER\s*\)/,
  );
  assert.match(ui, /channelPack:\s*channelPack/);
  assert.match(ui, /clipLab:\s*clipLab/);
  assert.match(ui, /maxRisk:\s*risk/);
  assert.match(ui, /goal:\s*goal/);
  assert.match(ui, /created\.binding\.goal/);
  assert.match(ui, /created\.policy\.maxRisk/);
  assert.match(ui, /UNAUTHENTICATED LOCAL OPERATOR/);
  assert.match(html, /V1 does not silently filter the candidate inventory/);
});

test("blind matchups never expose machine rank or priority", () => {
  const candidateMarkup = ui.match(
    /function candidateMarkup\(candidate, side\) \{([\s\S]*?)\n  \}/,
  )?.[1] || "";
  assert.doesNotMatch(candidateMarkup, /baselineRank/);
  assert.doesNotMatch(candidateMarkup, /editPriority/);
  assert.match(candidateMarkup, /candidate\.receiptUrl/);
  assert.match(candidateMarkup, /candidate\.evidence\.label/);
  assert.match(candidateMarkup, /candidate\.risk\.label/);
});

test("all four explicit choices preserve the context-learning boundary", () => {
  for (const choice of ["A", "B", "NEITHER", "NEEDS_CONTEXT"]) {
    assert.match(ui, new RegExp(`data-cut-decision="${choice}"`));
  }
  assert.match(ui, /CONTEXT ROUTE RECORDED \/\/ ZERO PREFERENCE WEIGHT/);
  assert.match(ui, /NEITHER RECORDED \/\/ ZERO PREFERENCE WEIGHT/);
  assert.match(ui, /progress\.minimumReached/);
  assert.match(ui, /THE TEST NEEDS MORE ACTUAL PREFERENCES/);
});

test("results keep baseline beside the bounded calibration and verify exports", () => {
  assert.match(ui, /engine\.verify\(artifact\)/);
  assert.match(ui, /artifact\.shortlists\.baseline/);
  assert.match(ui, /artifact\.shortlists\.calibrated/);
  assert.match(ui, /UNTOUCHED MACHINE 12/);
  assert.match(ui, /YOUR CUT 12/);
  assert.match(ui, /metrics\.safety\.holdOverrides/);
  assert.match(ui, /metrics\.safety\.riskMutations/);
  assert.match(ui, /metrics\.safety\.protectedMutationTotal/);
  assert.match(ui, /session\.exportJSON\(2\)/);
});

test("status announcements stay concise and replacement views receive keyboard focus", () => {
  assert.doesNotMatch(ui, /COPY VERIFIED ARTIFACT|VERIFIED CUT TEST ARTIFACT/);
  assert.match(ui, /COPY REPRODUCIBLE ARTIFACT/);
  assert.match(ui, /REPRODUCIBLE CUT TEST ARTIFACT COPIED/);
  assert.match(ui, /elements\.proof\.removeAttribute\("aria-live"\)/);
  assert.match(ui, /elements\.stage\.removeAttribute\("aria-live"\)/);
  assert.match(ui, /elements\.results\.removeAttribute\("aria-live"\)/);
  assert.match(ui, /cutTestLiveStatus/);
  assert.match(ui, /setAttribute\("role", "status"\)/);
  assert.match(ui, /setAttribute\("aria-atomic", "true"\)/);
  assert.match(ui, /data-cut-round-focus/);
  assert.match(ui, /data-cut-result-focus/);
  assert.match(ui, /focusInside\(elements\.stage, "\[data-cut-round-focus\]"\)/);
  assert.match(ui, /focusInside\(elements\.results, "\[data-cut-result-focus\]"\)/);
  assert.match(ui, /"\[data-cut-copy\]"\s*\)/);
  assert.match(ui, /renderResults\("\[data-cut-download\]"\)/);
});

test("the Cut Test remains usable on narrow screens", () => {
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*?\.cut-matchup\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /@media \(max-width: 600px\)[\s\S]*?\.cut-decisions\s*\{\s*grid-template-columns:\s*1fr;/,
  );
});
