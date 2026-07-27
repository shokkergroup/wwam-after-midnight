import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

test("V5.9 publishes the lazy Time Capsule surface without growing app.js", () => {
  const html = read("public/demo/index.html");
  const requiredAssets = [
    "public/demo/era-capsule-engine.js",
    "public/demo/era-capsule-ui.js",
    "public/demo/era-capsule.css",
    "docs/ARCHIVE_TIME_CAPSULES.md",
  ];

  requiredAssets.forEach((relative) => {
    assert.ok(fs.statSync(path.join(root, relative)).size > 0, `${relative} is empty`);
  });

  assert.match(html, /href="#time-capsules"[^>]*data-journey-link="shows"><b>BY YEAR<\/b>/);
  assert.match(
    html,
    /<section class="era-capsule" id="time-capsules"[\s\S]{0,240}data-feature-styles="era-capsule\.css"/
  );
  assert.match(
    html,
    /data-feature-scripts="archive-deep-distill\.js,archive-deep-batch2\.js,archive-deep-batch3\.js,archive-deep-batch4\.js,archive-deep-engine\.js,archive-deep-portfolio\.js,archive-atlas-data\.js,archive-atlas-engine\.js,era-capsule-engine\.js,era-capsule-ui\.js\?v=1\.1\.0-human"/
  );
  assert.doesNotMatch(html, /<script[^>]+src="era-capsule-(?:engine|ui)\.js"/);
  assert.ok(
    html.indexOf('id="time-capsules"') <
      html.indexOf('<script src="feature-loader.js"></script>')
  );

  assert.ok(
    fs.statSync(path.join(demo, "app.js")).size < 270_000,
    "V5.9 must remain outside the app.js size ceiling"
  );
  assert.ok(fs.statSync(path.join(demo, "era-capsule-engine.js")).size < 80_000);
  assert.ok(fs.statSync(path.join(demo, "era-capsule-ui.js")).size < 45_000);
  assert.ok(fs.statSync(path.join(demo, "era-capsule.css")).size < 20_000);
});

test("V5.9 proof remains while current Time Capsule totals stay synchronized", () => {
  const manifest = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const readme = read("README.md");
  const overview = read("docs/V5_OVERVIEW.md");
  const capsules = read("docs/ARCHIVE_TIME_CAPSULES.md");
  const changelog = read("docs/CHANGELOG.md");
  const runbook = read("docs/CREATOR_DEMO_RUNBOOK.md");

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");
  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(changelog, /^## 0\.5\.9 .*V5\.9 Archive Time Capsules/m);
  assert.match(runbook, /current V5\.21 build/);

  [readme, overview, capsules, changelog].forEach((source) => {
    assert.match(source, /21 metadata-only/i);
    assert.match(source, /12 (?:separately indexed |indexed )?(?:commentary )?sources/i);
    assert.match(source, /96 (?:timestamped |playable )?(?:promoted )?receipts/i);
    assert.match(source, /19[^\n]{0,40}sources[^\n]{0,80}83[^\n]{0,40}candidates/i);
  });

  assert.match(capsules, /promotionAllowed: false/);
  assert.match(capsules, /speaker: null/);
  assert.match(capsules, /not (?:a )?current (?:count|counts|total|totals) or unique audience/i);
  assert.match(capsules, /omit raw transcripts, caption payloads, full caption-event/i);
});
