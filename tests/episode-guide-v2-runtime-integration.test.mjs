import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(here, "..", "public", "demo", "app.js");
const app = fs.readFileSync(appPath, "utf8");

test("the dossier lazy loader installs the reviewed release explicitly and in order", () => {
  const base = app.indexOf('"episode-guides.js?v=2.1.5-referent"');
  const release = app.indexOf('"episode-guide-v2-reviewed-release.js?v=1.0.1-runtime-eligible"');
  const merge = app.indexOf('"episode-guide-v2-reviewed-merge.js?v=1.0.1-runtime-eligible"');

  assert.ok(base >= 0);
  assert.ok(release > base);
  assert.ok(merge > release);
  assert.match(app, /function activateReviewedEpisodeGuides\(\)/);
  assert.match(app, /merger\.merge\(base, release\)/);
  assert.match(app, /episodeGuides: episodeGuides/);
});

test("reviewed release activation is idempotent by immutable release receipt", () => {
  assert.match(
    app,
    /receipt\.releaseSha256 === release\.releaseSha256/,
  );
  assert.match(
    app,
    /Number\(base\.meta\.reviewedReleaseGuides\) !== release\.guides\.length/,
  );
});
