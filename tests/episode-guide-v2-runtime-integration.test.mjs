import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(here, "..", "public", "demo", "app.js");
const assetsPath = path.join(here, "..", "public", "demo", "source-dossier-assets.js");
const app = fs.readFileSync(appPath, "utf8");
const assets = fs.readFileSync(assetsPath, "utf8");

test("the dossier asset manifest installs both additive releases explicitly and in order", () => {
  const base = assets.indexOf('"episode-guides.js?v=2.1.5-referent"');
  const reviewed = assets.indexOf('"episode-guide-v2-reviewed-release.js?v=1.0.1-runtime-eligible"');
  const newest = assets.indexOf('"episode-guide-v2-newest-five-release.js?v=f5f3ca58"');
  const merge = assets.indexOf('"episode-guide-v2-reviewed-merge.js?v=1.1.0-ordered-release"');
  const manifestLoad = app.search(/loader\.load\("source-dossier-assets\.js\?v=[^"]+"\)/);
  const manifestRead = app.indexOf("window.WWAM_SOURCE_DOSSIER_ASSETS");

  assert.match(app, /loader\.load\("source-dossier-assets\.js\?v=[^"]+"\)/);
  assert.match(app, /window\.WWAM_SOURCE_DOSSIER_ASSETS\s*\|\|\s*\[\]/);
  assert.match(assets, /WWAM_SOURCE_DOSSIER_ASSETS\s*=\s*Object\.freeze\(\[/);
  assert.ok(manifestLoad >= 0);
  assert.ok(manifestRead > manifestLoad, "the manifest must load before its global is read");
  assert.match(
    app,
    /return\s+assets\.reduce\(function\s*\(promise,\s*source\)\s*\{[\s\S]{0,180}loader\.load\(source\)[\s\S]{0,120}Promise\.resolve\(\)/,
    "every manifest entry must be consumed by the ordered script loader",
  );
  assert.ok(base >= 0);
  assert.ok(reviewed > base);
  assert.ok(newest > reviewed);
  assert.ok(merge > newest);
  assert.match(app, /function activateReviewedEpisodeGuides\(\)/);
  assert.match(app, /m\.mergeOrdered\(b,\[r,n\]\)/);
  assert.match(app, /episodeGuides: episodeGuides/);
});

test("ordered release activation verifies both runtime eligibility counters", () => {
  assert.match(
    app,
    /Number\(b\.meta\.reviewedReleaseGuides\)!==r\.guides\.length/,
  );
  assert.match(
    app,
    /Number\(b\.meta\.deterministicReleaseGuides\)!==n\.guides\.length/,
  );
});
