import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const packageJson = JSON.parse(read("package.json"));
const packageLock = JSON.parse(read("package-lock.json"));
const readme = read("README.md");
const overview = read("docs/V5_OVERVIEW.md");
const portfolio = read("docs/ARCHIVE_DEEP_PORTFOLIO.md");
const atlas = read("docs/ARCHIVE_ATLAS.md");
const changelog = read("docs/CHANGELOG.md");
const runbook = read("docs/CREATOR_DEMO_RUNBOOK.md");
const reviewDocs = read("docs/ASK_REVIEW_QUEUE.md");
const reviewEngine = read("public/demo/ask-review-engine.js");
const reviewUi = read("public/demo/ask-review-ui.js");
const html = read("public/demo/index.html");
const batch3 = read("public/demo/archive-deep-batch3.js");

test("the historical V5.8 entry remains while current identity stays synchronized", () => {
  assert.equal(packageJson.version, "0.5.16");
  assert.equal(packageLock.version, "0.5.16");
  assert.equal(packageLock.packages[""].version, "0.5.16");
  assert.match(readme, /Current documented release: \*\*V5\.16 \/ 0\.5\.16\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.16/m);
  assert.match(runbook, /current V5\.16 build/i);
  assert.match(changelog, /^## 0\.5\.8 .*V5\.8/m);
});

test("the current four-batch portfolio publishes one exact measured vocabulary", () => {
  const proof = [readme, overview, portfolio, changelog, runbook].join("\n");
  for (const expected of [
    /40 (?:caption-audited )?sources/i,
    /97\.7 (?:audited )?hours/i,
    /1,216,993 (?:audited )?(?:caption )?words/i,
    /173,675 (?:parsed )?caption events/i,
    /400 topic lanes/i,
    /48 distinct/i,
    /166 quarantined/i,
    /52 (?:source-level )?character-signal/i,
    /12 topic-only/i,
    /12 (?:special )?visual-ranking quarantine/i,
    /445,949 cached/i,
  ]) {
    assert.match(proof, expected);
  }
  assert.match(portfolio, /fnv1a32:14050c7a/);
  assert.match(portfolio, /fnv1a32:17045a51/);
  assert.match(portfolio, /fnv1a32:bcea5692/);
  assert.match(portfolio, /fnv1a32:f79f2399/);
  assert.match(portfolio, /fnv1a32:56ca74df/);
});

test("Atlas coverage and the all-lane overlay remain distinct from promoted proof", () => {
  for (const expected of [
    /472/,
    /\|\s*`deeply-indexed`\s*\|\s*74\s*\|/i,
    /\|\s*`metadata-only`\s*\|\s*390\s*\|/i,
    /\|\s*`caption-limited`\s*\|\s*8\s*\|/i,
    /15\.7%/,
    /40.+(?:excluded|removed).+Distill Next/is,
  ]) {
    assert.match(atlas, expected);
  }
  const current = [readme, overview, runbook].join("\n");
  assert.match(current, /114\s+source\s+inputs/i);
  assert.match(current, /111 caption-audited/i);
  assert.match(current, /three (?:sealed or limited|sealed\/limited)/i);
  assert.match(current, /3,097,866 (?:audited )?words/i);
  assert.match(current, /268\.9 hours/i);
  assert.match(current, /872 promoted/i);
  assert.match(current, /168 promoted/i);
});

test("the immutable V5.4 proof remains explicit and does not absorb Batch 03", () => {
  const frozen = [readme, overview, portfolio].join("\n");
  assert.match(frozen, /84 inputs/i);
  assert.match(frozen, /2,175,344 (?:audited (?:caption )?)?words/i);
  assert.match(frozen, /194\.9 (?:caption-audited )?hours/i);
  assert.match(frozen, /872 promoted/i);
  assert.match(frozen, /42.+quarantined/is);
  assert.match(frozen, /168 promoted/i);
  assert.match(frozen, /(?:frozen|immutable).+V5\.4/is);
  assert.doesNotMatch(frozen, /V5\.4[^\n]{0,120}131 quarantined/i);
});

test("Batch 03 is integrated quarantine with independently pinned evidence", () => {
  assert.match(batch3, /"id":"archive-deep-batch-03"/);
  assert.match(batch3, /"sequence":3/);
  assert.match(batch3, /"integrationStatus":"integrated-quarantine"/);
  assert.match(batch3, /"publicMomentCandidates":40/);
  assert.match(batch3, /"characterSignals":18/);
  assert.match(batch3, /"restricted":2/);
  assert.match(batch3, /"visualContextUnverified":4/);
  assert.match(batch3, /"publicFnv1a":"fnv1a32:f79f2399"/);
  assert.match(batch3, /"promotionAllowed":false/);
});

test("Ask Review is a lazy, local proposal lane with no silent authority", () => {
  assert.match(html, /data-feature-scripts="ask-review-engine\.js,ask-review-ui\.js,[^"]*play-answer-engine\.js,play-answer-ui\.js"/);
  assert.match(html, /data-feature-styles="ask-review\.css,play-answer\.css"/);
  assert.match(reviewEngine, /shokker-youtube-wiki\/ask-review\/v1/);
  assert.match(reviewEngine, /corpusMutation:\s*"NONE"/);
  assert.match(reviewEngine, /canonMutation:\s*"NONE"/);
  assert.match(reviewEngine, /askMutation:\s*"NONE"/);
  assert.match(reviewEngine, /certificationEffect:\s*"NONE"/);
  assert.match(reviewUi, /wwam-ask-review-queue-v1/);
  assert.match(reviewUi, /data-ask-query/);
  assert.match(reviewUi, /STORAGE BLOCKED/);
  assert.doesNotMatch(reviewUi, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.match(reviewDocs, /device-local/i);
  assert.match(reviewDocs, /does not.+rewrote search|cannot claim.+affect/is);
  assert.match(reviewDocs, /unverified user proposal/);
});

test("static buyer-facing copy names the current quarantine without changing Trust scope", () => {
  assert.match(html, /40 Archive Deep sources across four independently fingerprinted batches/);
  assert.match(html, /July 24 Batch 04/);
  assert.match(html, /40-source Archive Deep portfolio/);
  assert.match(html, /74-source promoted corpus/);
});
