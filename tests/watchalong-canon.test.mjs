import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(demo, "watchalong-canon-ui.js"), "utf8");
const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(demo, "wwam-watchalong-canon.js"), "utf8"), context);
const canon = context.WWAM_WATCHALONG_CANON;

test("watchalong canon has the complete public source registry", () => {
  assert.equal(canon.schema, "shokker-wwam-watchalong-canon/v1");
  assert.equal(canon.stats.episodes, 50);
  assert.equal(canon.stats.movieGroups, 47);
  assert.equal(canon.stats.franchises, 6);
  assert.equal(canon.stats.deepDossiers, 38);
  assert.equal(canon.stats.captionLedgers, 11);
  assert.equal(canon.stats.sourceBriefs, 1);
  assert.equal(canon.stats.nonFullAdditions, 12);
  assert.equal(new Set(canon.episodes.map((episode) => episode.id)).size, canon.episodes.length);
});

test("repeated films stay separate while grouping into one movie file", () => {
  const halloweenFour = canon.groups.find((group) => group.key === "halloween-4");
  const finalChapter = canon.groups.find((group) => group.key === "friday-the-13th-part-4");
  const halloweenOriginal = canon.groups.find((group) => group.key === "halloween-1978");
  assert.deepEqual(Array.from(halloweenFour.episodeIds), ["28PfRNKoSCA", "KrBhfGxsJNM"]);
  assert.deepEqual(Array.from(finalChapter.episodeIds), ["kTJXSHz9BXw", "QxJyVaAgZ_Y"]);
  assert.deepEqual(Array.from(halloweenOriginal.episodeIds), ["6VXSBDZ-3WE", "NjH2tcGvmAY"]);
  assert.equal(halloweenFour.repeatCount, 1);
  assert.equal(finalChapter.repeatCount, 1);
  assert.equal(halloweenOriginal.repeatCount, 1);
});

test("every episode has an official source, evidence state, and playable receipt lane", () => {
  canon.episodes.forEach((episode) => {
    assert.match(episode.id, /^[A-Za-z0-9_-]{11}$/);
    assert.match(episode.url, new RegExp(episode.id));
    assert.ok(["full-editorial-dossier", "source-brief-dossier", "caption-ledger-dossier"].includes(episode.dossier.state));
    assert.ok(Array.isArray(episode.dossier.cuts));
    assert.ok(episode.dossier.summary.length > 30);
  });
  const halloweenParty = canon.episodes.find((episode) => episode.id === "KrBhfGxsJNM");
  assert.equal(halloweenParty.type, "watch-party");
  assert.equal(halloweenParty.movieKey, "halloween-4");
  assert.ok(halloweenParty.dossier.cuts.length >= 10);
  assert.ok(canon.stats.fanSignalReceipts >= 10);
  assert.ok(canon.episodes.some((episode) => episode.dossier.fanSignals.length > 0));
  const heldSource = canon.episodes.find((episode) => episode.id === "AzrcgoyE7C4");
  assert.equal(heldSource.dossier.state, "source-brief-dossier");
  assert.match(heldSource.dossier.summary, /source brief/i);
});

test("watchalong canon is reachable from the Watchalongs route", () => {
  assert.match(html, /id="watchalong-canon"/);
  assert.match(html, /href="#watchalong-canon"/);
  assert.match(html, /wwam-watchalong-canon\.js/);
  assert.match(html, /watchalong-canon\.css/);
  assert.match(ui, /MOVIE FILES \/\/ REPEATS STAY ATTACHED/);
  assert.match(ui, /data-wac-group/);
  assert.match(ui, /function fanSignalsMarkup\(episode, signals\)/);
  assert.match(ui, /fanSignalsMarkup\(episode, dossier\.fanSignals\)/);
});
