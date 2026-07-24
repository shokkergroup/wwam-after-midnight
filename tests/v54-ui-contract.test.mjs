import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const pitchTour = fs.readFileSync(path.join(demo, "pitch-tour-data.js"), "utf8");
const styles = fs.readFileSync(path.join(demo, "styles.css"), "utf8");
const atlasUi = fs.readFileSync(path.join(demo, "archive-atlas-ui.js"), "utf8");
const redEngine = fs.readFileSync(path.join(demo, "red-band-ranking-v2.js"), "utf8");
const redQuery = fs.readFileSync(path.join(demo, "red-band-query.js"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const changelog = fs.readFileSync(path.join(root, "docs", "CHANGELOG.md"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

test("V5.4 publishes its showcase surfaces without putting deferred ledgers on first load", () => {
  for (const id of [
    "red100",
    "redMethod",
    "redExport",
    "archive",
    "archiveStatus",
    "archiveSearch",
    "archiveQueueDownload",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `${id} is missing`);
  }

  assert.doesNotMatch(
    html,
    /<script[^>]+(?:archive-(?:atlas|deep)|red-band-(?:ranking-v2|query))/i,
  );
  assert.match(app, /loadDemoScript\("red-band-ranking-v2\.js"\)/);
  assert.match(app, /loadDemoScript\("red-band-query\.js"\)/);
  assert.match(app, /loadDemoScript\("archive-atlas-data\.js"\)/);
  assert.match(app, /loadDemoScript\("archive-atlas-engine\.js"\)/);
  assert.match(app, /loadDemoScript\("archive-atlas-ui\.js"\)/);
  const archiveAssets = [
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
  ];
  const positions = archiveAssets.map((asset) => app.indexOf(`"${asset}"`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual(positions, positions.slice().sort((left, right) => left - right));
  assert.match(app, /\.reduce\(function\(p,s\)\{return p\.then\(function\(\)\{return loadDemoScript\(s\);/);
});

test("Archive Atlas keeps metadata scope and incomplete coverage visible in static copy", () => {
  assert.match(html, /THE WHOLE CACHED STREAMS FEED/);
  assert.match(html, /SEARCH TITLE METADATA/);
  assert.match(html, /Only a deep-indexed badge means its available captions were actually distilled/i);
  assert.match(html, /Metadata-only status controls eligibility; it does not add points/i);
  assert.match(html, /id="archive" aria-busy="true"/);
  assert.match(html, /id="archiveStatus" role="status" aria-live="polite"/);
  assert.match(atlasUi, /availability was not rechecked/i);
  assert.match(atlasUi, /no transcript, speaker, sentiment, humor, or topic score/i);
});

test("the Red Band export and exact-rank Ask path expose the scoring boundary", () => {
  assert.match(html, /id="redExport"[^>]*>DOWNLOAD INDEX JSON/);
  assert.match(app, /engine\.exportSnapshot\(\)/);
  assert.match(app, /wwam-red-band-100-v2\.json/);
  assert.match(app, /redBandQueryEngine\.analyze\(query,\s*state\.askContext\)/);
  assert.match(redQuery, /ranking\.getByRank\(rank\)/);
  assert.match(app, /MACHINE-RANKED, NOT A CREATOR VOTE/);
  assert.match(redQuery, /Speaker not diarized; the receipt makes no host-authorship or true-origin claim/);
  assert.match(redEngine, /RECENCY EXCLUDED/);
  assert.match(redEngine, /ZERO DEFAULT · NO EDITORIAL VOTE SUPPLIED/);
});

test("every rendered Memorability Index card explains and opens its receipt", () => {
  assert.match(app, /moment\.whyMemorableSummary/);
  assert.match(app, /redSignalMarkup\(moment\)/);
  assert.match(app, /data-red-open=/);
  assert.match(app, /SPEAKER NOT DIARIZED/);
  assert.match(styles, /\.evidence-why/);
  assert.match(styles, /\.evidence-signals/);
});

test("Mike Mode has six coherent beats and opens Archive Atlas as live proof", () => {
  assert.equal((pitchTour.match(/\bnumber: "0[1-6]"/g) || []).length, 6);
  assert.match(pitchTour, /472 STREAMS\.<br>EVERY BLIND SPOT VISIBLE\./);
  assert.match(pitchTour, /kind: "archive", label: "OPEN THE ARCHIVE ATLAS"/);
  assert.match(app, /action\.kind === "archive" \? "archive"/);
  assert.match(app, /action\.kind === "archive"[\s\S]{0,240}loadArchiveAtlas\(\)/);
});

test("the current release identity preserves V5.4 headline proof", () => {
  assert.equal(packageJson.version, "0.5.15");
  assert.match(changelog, /## 0\.5\.7\b/);
  assert.match(changelog, /## 0\.5\.6\b/);
  assert.match(changelog, /## 0\.5\.5\b/);
  assert.match(changelog, /## 0\.5\.4\b/);
  assert.match(changelog, /472 cached feed records/);
  assert.match(changelog, /100 unique ranked receipts/);
  assert.match(readme, /Archive Atlas/i);
  assert.match(readme, /Memorability Index V2/i);
});

test("the mobile header keeps every primary route in a dedicated scroll lane", () => {
  assert.match(styles, /@media \(max-width: 600px\)[\s\S]*?grid-template-rows: 60px 42px/);
  assert.match(styles, /\.nav-links[\s\S]*?grid-column: 1 \/ -1[\s\S]*?scroll-snap-type: x proximity/);
  assert.match(styles, /\.nav-links a \{ min-height: 42px; scroll-snap-align: start; \}/);
  assert.match(styles, /scroll-padding-top: 110px/);
});
