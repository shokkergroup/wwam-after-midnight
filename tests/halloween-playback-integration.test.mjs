import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(ROOT, "public", "demo", "app.js"), "utf8");

test("Halloween Universe receipts enter the in-page Show Wiki and player", () => {
  assert.match(app, /document\.addEventListener\("wwam:halloween-play"/);
  assert.match(app, /openSourceDossier\(sourceId, start, \{/);
  assert.match(app, /autoplay: false/);
  assert.match(app, /if \(hasStart\) loadPlayer\(sourceId, start, end\)/);
});

test("newly discovered official uploads keep a playable local fallback", () => {
  assert.match(app, /if \(!\/\^\[A-Za-z0-9_-\]\{11\}\$\/\.test\(sourceId\)\) return/);
  assert.match(app, /openLooseSource\(sourceId, start \|\| 0, label, end\)/);
  assert.match(app, /PLAYING THE VERIFIED SOURCE COORDINATE/);
});

test("the integration never invents a missing timestamp", () => {
  assert.match(app, /var hasStart = detail\.start != null && Number\.isFinite\(Number\(detail\.start\)\)/);
  assert.match(app, /var start = hasStart \? Math\.max\(0, Number\(detail\.start\)\) : null/);
});
