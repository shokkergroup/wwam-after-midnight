import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(here, "..", "public", "demo", "app.js");
const app = fs.readFileSync(appPath, "utf8");

test("the dossier lazy loader installs both additive releases explicitly and in order", () => {
  const base = app.indexOf('"episode-guides.js?v=2.1.5-referent"');
  const reviewed = app.indexOf('"episode-guide-v2-reviewed-release.js?v=1.0.1-runtime-eligible"');
  const newest = app.indexOf('"episode-guide-v2-newest-five-release.js?v=f5f3ca58"');
  const merge = app.indexOf('"episode-guide-v2-reviewed-merge.js?v=1.1.0-ordered-release"');

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
