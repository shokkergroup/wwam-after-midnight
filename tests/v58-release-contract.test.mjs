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

test("release identity stays synchronized after the V5.8 evidence pass", () => {
  assert.equal(packageJson.version, "0.5.10");
  assert.equal(packageLock.version, "0.5.10");
  assert.equal(packageLock.packages[""].version, "0.5.10");
  for (const document of [readme, overview, changelog, runbook]) {
    assert.match(document, /V5\.8/i);
  }
  assert.match(changelog, /0\.5\.8/);
});

test("the current three-batch portfolio publishes one exact measured vocabulary", () => {
  const proof = [readme, overview, portfolio, changelog, runbook].join("\n");
  for (const expected of [
    /30 (?:caption-audited )?sources/i,
    /77\.2 hours/i,
    /957,430 words/i,
    /136,539 (?:parsed )?caption events/i,
    /300 topic lanes/i,
    /44 distinct topics/i,
    /131 quarantined/i,
    /41 (?:source-level )?character-signal/i,
    /9 topic-only/i,
    /10 (?:special )?visual-ranking quarantine/i,
    /335,489 cached/i,
  ]) {
    assert.match(proof, expected);
  }
  assert.match(portfolio, /fnv1a32:8e474ea8/);
  assert.match(portfolio, /fnv1a32:17045a51/);
  assert.match(portfolio, /fnv1a32:bcea5692/);
  assert.match(portfolio, /fnv1a32:f79f2399/);
});

test("Atlas coverage and the all-lane overlay remain distinct from promoted proof", () => {
  for (const expected of [
    /472/,
    /\|\s*`deeply-indexed`\s*\|\s*64\s*\|/i,
    /\|\s*`metadata-only`\s*\|\s*400\s*\|/i,
    /\|\s*`caption-limited`\s*\|\s*8\s*\|/i,
    /13\.6%/,
    /30.+(?:excluded|removed).+Distill Next/is,
  ]) {
    assert.match(atlas, expected);
  }
  const current = [readme, overview, runbook].join("\n");
  assert.match(current, /104\s+source\s+inputs/i);
  assert.match(current, /101 caption-audited/i);
  assert.match(current, /three (?:sealed or limited|sealed\/limited)/i);
  assert.match(current, /2,838,303 words/i);
  assert.match(current, /248\.4 hours/i);
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
  assert.match(html, /data-feature-scripts="ask-review-engine\.js,ask-review-ui\.js"/);
  assert.match(html, /data-feature-styles="ask-review\.css"/);
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
  assert.match(html, /30 Archive Deep sources across three independently fingerprinted batches/);
  assert.match(html, /July 24 Batch 03/);
  assert.match(html, /30-source Archive Deep portfolio/);
  assert.match(html, /74-source promoted corpus/);
});
