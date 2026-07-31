import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");

function read(file) {
  return fs.readFileSync(path.join(demo, file), "utf8");
}

function famIndex() {
  const window = {};
  window.window = window;
  window.globalThis = window;
  vm.createContext(window);
  vm.runInContext(read("wwam-fam-index.js"), window, {
    filename: "wwam-fam-index.js",
  });
  return window.WWAM_FAM_INDEX;
}

test("WWAM FAM Hall is a source-linked recognition index, not a guessed rich list", () => {
  const index = famIndex();
  assert.equal(index.schema, "shokker-lore/wwam-fam-index/v1");
  assert.equal(index.stats.captionSourcesAudited, 509);
  assert.ok(index.stats.showsWithPublishedFamCallouts >= 400);
  assert.ok(index.stats.publishedCallouts >= 2_000);
  assert.ok(index.stats.hallMembers >= 30);
  assert.match(index.evidencePolicy.publicClaim, /not donation totals/i);
  assert.match(index.evidencePolicy.liveChatSampleBoundary, /never lifetime totals/i);
  assert.doesNotMatch(JSON.stringify(index.shows), /paidUsd|purchaseAmount|donationTotal/i);
});

test("live-chat replay resolves Michael Parten and keeps caption spellings as aliases", () => {
  const index = famIndex();
  const michael = index.hallOfFame.find((member) => member.id === "michael-parten");
  assert.ok(michael);
  assert.equal(michael.displayName, "Michael Parten");
  assert.equal(michael.publicHandle, "@MichaelParten1");
  assert.equal(michael.youtubeChannelId, "UCSB6mfJpDk3EKgoI_SVZhug");
  assert.ok(michael.aliases.includes("Michael Parton"));
  assert.ok(michael.aliases.includes("Michael Barton"));
  assert.match(index.spellingDesk.michaelParten, /Parten/);
  assert.equal(michael.verifiedReplaySample.totalSampleShows, 5);
  assert.equal(michael.verifiedReplaySample.paidUsd, 107);
  assert.match(michael.verifiedReplaySample.boundary, /never a lifetime total/i);
});

test("Lee has an exact public handle and an explicitly bounded support sample", () => {
  const index = famIndex();
  const lee = index.hallOfFame.find(
    (member) => member.id === "lee-the-machine-bowers",
  );
  assert.ok(lee);
  assert.equal(lee.publicHandle, "@LeeTheMachineBowers");
  assert.equal(lee.youtubeChannelId, "UCuS6ICxtZ2JSdvhHObTsOhQ");
  assert.equal(lee.observedShows, 79);
  assert.equal(lee.verifiedReplaySample.showsPresent, 4);
  assert.equal(lee.verifiedReplaySample.totalSampleShows, 5);
  assert.equal(lee.verifiedReplaySample.paidMessages, 11);
  assert.equal(lee.verifiedReplaySample.paidUsd, 494.94);
  assert.match(lee.verifiedReplaySample.boundary, /never a lifetime total/i);
});

test("Christmas 2025 gets a real fan roll call with playable room receipts", () => {
  const index = famIndex();
  const christmas = index.shows.QMYgsEfPMg0;
  assert.ok(christmas);
  assert.ok(christmas.callouts.length >= 15);
  const ids = new Set(christmas.callouts.map((callout) => callout.fanId));
  [
    "lee-the-machine-bowers",
    "michael-parten",
    "logan-evans",
    "dan-cat-nine",
    "gary-mcdonald",
    "dr-corn-dog",
  ].forEach((fanId) => assert.ok(ids.has(fanId), fanId));
  const lee = christmas.callouts.find(
    (callout) => callout.fanId === "lee-the-machine-bowers",
  );
  assert.ok(Math.abs(lee.at - 3893) <= 4);
  assert.equal(lee.interactionType, "BIRTHDAY / ROOM RITUAL");
});

test("every published callout remains bounded to one exact source", () => {
  const index = famIndex();
  for (const [sourceId, show] of Object.entries(index.shows)) {
    assert.equal(show.sourceId, sourceId);
    assert.match(sourceId, /^[A-Za-z0-9_-]{11}$/);
    assert.ok(show.duration > 0);
    for (const callout of show.callouts) {
      assert.ok(callout.id.startsWith(`${sourceId}:fam:`));
      assert.ok(Number.isFinite(callout.at) && callout.at >= 0);
      assert.ok(Number.isFinite(callout.end) && callout.end > callout.at);
      assert.ok(callout.end <= show.duration);
      assert.equal(callout.evidenceState, "automatic-caption-name-readout");
      assert.ok(callout.displayName);
      assert.ok(callout.excerpt.split(/\s+/).length <= 21);
    }
  }
});

test("the public route and every Show Wiki expose the FAM layer", () => {
  const html = read("index.html");
  const shell = read("guided-shell.js");
  const assets = read("source-dossier-assets.js");
  const adapter = read("wwam-source-dossier-adapter.js");
  const engine = read("source-dossier-engine.js");
  const ui = read("source-dossier-ui.js");
  const css = read("source-dossier.css");

  assert.match(html, /href="#fam-hall" data-journey-link="fam">THE FAM/);
  assert.match(html, /id="fam-hall"/);
  assert.match(html, /wwam-fam-index\.js[^"]*,wwam-fam-ui\.js/);
  assert.match(shell, /"fam-hall": "fam"/);
  assert.match(shell, /fam: \["#fam-hall"\]/);
  assert.match(assets, /"wwam-fam-index\.js\?v=/);
  assert.match(adapter, /function famCalloutReceipts/);
  assert.match(adapter, /"wwam-fam"/);
  assert.match(engine, /"caption-fan-name-navigation": true/);
  assert.match(ui, /id="sourceDossierWwamFam"/);
  assert.match(ui, /THE FAM WAS IN THE BUILDING/);
  assert.match(css, /\.source-dossier-fam-grid/);
});
