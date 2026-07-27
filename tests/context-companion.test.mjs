import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const demo = new URL("../public/demo/", import.meta.url);

async function loadWindow(files) {
  const sandbox = { window: {} };
  for (const file of files) {
    runInNewContext(await readFile(new URL(file, demo), "utf8"), sandbox, { filename: file });
  }
  return sandbox.window;
}

test("every watchalong receives a sourced external movie ledger", async () => {
  const root = await loadWindow(["catalog.js", "context-atlas.js"]);
  const catalog = root.WWAM_CATALOG;
  const atlas = root.WWAM_CONTEXT_ATLAS;
  assert.equal(catalog.length, 39);
  assert.equal(Object.keys(atlas.movies).length, 39);
  assert.deepEqual(
    JSON.parse(JSON.stringify(Object.keys(atlas.movies).sort())),
    JSON.parse(JSON.stringify(catalog.map((item) => item.id).sort())),
  );
  for (const item of Object.values(atlas.movies)) {
    assert.match(item.financialSource, /^https:\/\//);
    assert.ok(item.film && item.year && item.runtime && item.director);
    assert.match(item.budget, /\$/);
    assert.match(item.worldwide, /\$/);
    assert.ok(Array.isArray(item.facts) && item.facts.length >= 2);
  }
});

test("Halloween 4 carries public-domain art, financial context, and a trailer door", async () => {
  const { WWAM_CONTEXT_ATLAS: atlas } = await loadWindow(["context-atlas.js"]);
  const page = atlas.movies["28PfRNKoSCA"];
  assert.equal(page.film, "Halloween 4: The Return of Michael Myers");
  assert.equal(page.budget, "$5 million");
  assert.equal(page.worldwide, "$17.8 million");
  assert.match(page.image, /wikimedia\.org\/wikipedia\/commons/);
  assert.match(page.imageSource, /commons\.wikimedia\.org/);
  assert.match(page.imageLabel, /public domain/i);
  assert.match(page.trailerId, /^[A-Za-z0-9_-]{11}$/);
});

test("the latest five shows expose 19 timed context doors and one honest trust gap", async () => {
  const { WWAM_CONTEXT_ATLAS: atlas } = await loadWindow(["context-atlas.js"]);
  const expected = ["LV2rmwEA0w4", "iz0WFhe6LYM", "ag3axSC9BpU", "x6tvsGRHgU0", "7PzSj-oIRjA"];
  assert.deepEqual(Object.keys(atlas.recentShows), expected);
  const cards = Object.values(atlas.recentShows).flatMap((show) => show.cards);
  assert.equal(cards.length, 19);
  assert.ok(cards.every((card) => Number.isFinite(card.at) && card.at >= 0));
  assert.ok(cards.every((card) => card.claimState && card.sourceLabel));
  assert.match(atlas.recentShows.x6tvsGRHgU0.gap, /no usable English caption/i);
  assert.equal(atlas.recentShows.x6tvsGRHgU0.cards.length, 0);
});

test("the companion preserves source separation, retry mounting, and in-modal navigation", async () => {
  const script = await readFile(new URL("context-companion.js", demo), "utf8");
  const shell = await readFile(new URL("guided-shell.js", demo), "utf8");
  const css = await readFile(new URL("guided-shell.css", demo), "utf8");
  assert.match(script, /ABOUT THE MOVIE \/\/ EXTERNAL CONTEXT/);
  assert.match(script, /SYNC CALIBRATION REQUIRED/);
  assert.match(script, /MutationObserver/);
  assert.match(script, /setInterval/);
  assert.match(script, /modal\.scrollTo/);
  assert.match(shell, /groupSelectors/);
  assert.match(shell, /openGuidedMike/);
  assert.match(css, /source-dossier-player>\.shokker-youtube-player/);
  assert.match(css, /context-popup-timeline/);
});
