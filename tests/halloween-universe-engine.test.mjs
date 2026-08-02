import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadRuntime(includeUi = false) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const files = [
    "catalog.js",
    "deep-distill.js",
    "curation.js",
    "character-lore.js",
    "halloween-acquired-distill.js",
    "halloween-commentary-enrichment.js",
    "halloween-canon-index.js",
    "halloween-universe-engine.js",
  ];
  if (includeUi) files.push("halloween-universe-ui.js");
  for (const file of files) {
    vm.runInContext(
      fs.readFileSync(new URL(`../public/demo/${file}`, import.meta.url), "utf8"),
      sandbox,
      { filename: file },
    );
  }
  return sandbox.window;
}

const runtime = loadRuntime();
const engine = runtime.WWAMHalloweenUniverseEngine.create();

test("builds the complete evidence-bounded Halloween Universe", () => {
  const summary = engine.summary();
  assert.equal(summary.films, 13);
  assert.equal(summary.captionBackedFilms, 12);
  assert.equal(summary.heldFilms, 1);
  assert.equal(summary.auditedWords, 185175);
  assert.equal(summary.topicDoors, 119);
  assert.equal(summary.characterCallbacks, 54);
  assert.equal(summary.loomisCallbacks, 27);
  assert.equal(summary.challisCallbacks, 27);
  assert.equal(summary.upInYa, 7);
  assert.equal(summary.strictSteveCandidates, 8);
  assert.equal(summary.coreStrictSteveCandidates, 4);
  assert.equal(summary.canonStrictSteveCandidates, 8);
  assert.equal(summary.alternateTreatments, 2);
  assert.equal(summary.acquiredSources, 10);
  assert.equal(summary.canonSources, 79);
  assert.equal(summary.watchalongVersions, 16);
  assert.equal(summary.crossoverSources, 54);
  assert.ok(summary.canonWordsAudited >= 1453641);
  assert.ok(summary.canonMomentCandidates >= 315);
  assert.ok(summary.characterReferenceMentions >= 171);
  assert.equal(engine.verify().ok, true);
  assert.equal(engine.verify().errors.length, 0);
});

test("keeps versions and repeat commentaries in explicit lineages", () => {
  const producersCut = engine.getFilm("ZWF8TPnHr4Y");
  const original1978 = engine.getFilm("6VXSBDZ-3WE");
  assert.equal(producersCut.variants.length, 1);
  assert.equal(producersCut.variants[0].id, "eE7I5NjXiqs");
  assert.match(producersCut.variants[0].version, /theatrical/i);
  assert.equal(original1978.variants.length, 1);
  assert.equal(original1978.variants[0].id, "NjH2tcGvmAY");
  assert.match(original1978.variants[0].version, /2019/i);
  assert.ok(producersCut.variants[0].anchors.length >= 5);
  assert.ok(original1978.variants[0].anchors.length >= 6);
});

test("carries the episode-specific human read into every enriched film dossier", () => {
  const halloween = engine.getFilm("6VXSBDZ-3WE");
  assert.ok(halloween.editorialDossier);
  assert.match(halloween.editorialDossier.summary, /Come to Halloween/i);
  assert.match(halloween.editorialDossier.evidenceSummary, /Source-bounded read/i);
  assert.match(halloween.editorialDossier.fanRead.hated.label, /STEVE'S ASSHOLE/i);
  assert.equal(Number(halloween.editorialDossier.laneCounts["STRAIGHT TO STEVE'S ASSHOLE"]), 0);
  assert.equal(halloween.editorialDossier.audioPass, false);
  assert.ok(engine.listFilms().filter((film) => film.access === "caption-backed" && film.editorialDossier).length >= 12);
});

test("holds the unavailable commentary open without manufacturing receipts", () => {
  const held = engine.getFilm("AzrcgoyE7C4");
  assert.equal(held.access, "held");
  assert.equal(held.evidenceState, "source-held-no-caption-map");
  assert.equal(held.moments.length, 0);
  assert.equal(held.topicDoors.length, 0);
  assert.equal(held.characterReferences.length, 0);
  assert.equal(held.url, "https://www.youtube.com/watch?v=AzrcgoyE7C4");
});

test("separates character performances from ordinary character references", () => {
  const callbacks = engine.listCallbacks();
  assert.equal(callbacks.length, 54);
  for (const callback of callbacks) {
    assert.equal(callback.kind, "character-performance");
    assert.equal(callback.evidenceState, "timestamp-validated-human-curated-candidate");
    assert.equal(callback.playable, true);
    assert.ok(callback.end > callback.start);
    assert.ok(callback.clipSeconds <= 14.001);
    assert.match(callback.url, new RegExp(`^https://www\\.youtube\\.com/watch\\?v=${callback.sourceId}&t=\\d+s$`));
  }
  const references = engine.listFilms().flatMap((film) => film.characterReferences);
  assert.ok(references.length >= 12);
  assert.ok(references.reduce((sum, item) => sum + item.mentions, 0) >= 171);
  for (const reference of references) {
    assert.equal(reference.kind, "character-reference");
    assert.equal(reference.performanceStatus, "not-established");
    assert.equal(reference.evidenceState, "topic-navigation-only");
  }
});

test("keeps Up In Ya curated and Steve signals quarantined", () => {
  const up = engine.listUpInYa();
  assert.equal(up.length, 7);
  assert.ok(up.some((item) => item.label === "THE MICHAEL DICK STORY"));
  for (const item of up) {
    assert.equal(item.evidenceState, "timestamp-validated-human-curated-candidate");
    assert.equal(item.clipSeconds, 14);
  }
  const steve = engine.listSteveQueue();
  assert.ok(steve.length >= 4);
  assert.equal(steve.filter((item) => /satellite/.test(item.id)).length > 0, true);
  for (const item of steve) {
    assert.equal(item.evidenceState, "quarantined-machine-candidate");
    assert.equal(item.reviewRequired, true);
    assert.equal("verified" in item, false);
  }
});

test("returns deterministic mixed-source search without merging evidence types", () => {
  const first = engine.search("Loomis", 12);
  const second = engine.search("Loomis", 12);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.ok(first.some((result) => result.kind === "character-reference"));
  assert.ok(first.some((result) => result.kind === "character-performance"));
  const h6 = engine.search("Halloween 6 theatrical", 12);
  assert.ok(h6.some((result) => result.id === "ZWF8TPnHr4Y" || result.item?.compareTo === "ZWF8TPnHr4Y"));
});

test("all exposed playable receipts use official source ids and bounded stops", () => {
  const paths = engine.listPaths();
  assert.equal(paths.length, 6);
  assert.equal(engine.listCanonSources().length, 79);
  const playable = [
    ...engine.listCallbacks(),
    ...engine.listUpInYa(),
    ...engine.listSteveQueue(),
    ...engine.listFilms().flatMap((film) => [...film.moments, ...film.topicDoors, ...film.characterReferences]),
  ];
  for (const item of playable) {
    assert.match(item.sourceId, /^[A-Za-z0-9_-]{11}$/);
    assert.ok(item.start >= 0);
    assert.ok(item.end > item.start);
    assert.equal(item.url.includes("youtube.com/watch?v=" + item.sourceId), true);
    assert.equal(item.url.includes("embed"), false);
  }
});
