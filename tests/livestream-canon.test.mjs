import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(".");
function loadCanon() {
  const source = fs.readFileSync(path.join(root, "public/demo/wwam-livestream-canon.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.WWAM_LIVESTREAM_CANON;
}

test("livestream canon contains the complete source registry", () => {
  const canon = loadCanon();
  assert.equal(canon.schema, "shokker-wwam-livestream-canon/v1");
  assert.equal(canon.stats.episodes, 509);
  assert.equal(canon.episodes.length, 509);
  assert.equal(new Set(canon.episodes.map((episode) => episode.id)).size, 509);
  assert.equal(canon.episodes[0].id, "LV2rmwEA0w4");
  assert.equal(canon.episodes.at(-1).date, "2016-02-01");
});

test("each source has an honest evidence tier and playable source link", () => {
  const canon = loadCanon();
  const allowed = new Set(["distill-dossier", "completion-dossier", "caption-ledger", "source-brief"]);
  for (const episode of canon.episodes) {
    assert.equal(episode.publicSource, true);
    assert.match(episode.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.ok(allowed.has(episode.evidenceTier));
    assert.ok(episode.dossier && episode.dossier.summary);
    assert.ok(Array.isArray(episode.topics));
    assert.ok(Array.isArray(episode.chapters));
    assert.ok(Array.isArray(episode.moments));
    assert.ok(Array.isArray(episode.fanSignals));
  }
  assert.ok(canon.stats.completionDossiers >= 200);
  assert.ok(canon.stats.distillDossiers >= 10);
  assert.ok(canon.stats.captionLedgers >= 200);
  assert.ok(canon.stats.latestOutsideAtlas > 0);
  assert.ok(canon.stats.fanSignalReceipts > 0);
  const ledgerSummaries = canon.episodes.filter((episode) => episode.evidenceTier === "caption-ledger").map((episode) => episode.dossier.summary);
  assert.ok(ledgerSummaries.length >= 200);
  assert.equal(ledgerSummaries.some((summary) => /\bA open-line\b/i.test(summary)), false);
  assert.equal(ledgerSummaries.some((summary) => summary.includes("Open the timestamp before treating")), false);
  assert.ok(ledgerSummaries.some((summary) => summary.includes("fan-signal receipts")));
});

test("livestream canon surface is wired into the page and route shell", () => {
  const html = fs.readFileSync(path.join(root, "public/demo/index.html"), "utf8");
  const guided = fs.readFileSync(path.join(root, "public/demo/guided-shell.js"), "utf8");
  const gate = fs.readFileSync(path.join(root, "public/demo/route-render-gate.js"), "utf8");
  const ui = fs.readFileSync(path.join(root, "public/demo/livestream-canon-ui.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "public/demo/livestream-canon.css"), "utf8");
  assert.match(html, /id="livestream-canon"/);
  assert.match(html, /wwam-livestream-canon\.js/);
  assert.match(html, /livestream-canon-ui\.js/);
  assert.match(guided, /"livestream-canon": "shows"/);
  assert.match(guided, /#livestream-canon/);
  assert.match(gate, /"livestream-canon": "shows"/);
  assert.match(ui, /OPEN FULL SHOW WIKI/);
  assert.match(ui, /data-lvc-open/);
  assert.match(css, /\.lvc-card-grid/);
});
