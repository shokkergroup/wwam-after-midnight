import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const uiPath = path.join(demo, "archive-atlas-ui.js");

function load() {
  const context = { window: {}, setTimeout };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "archive-atlas-ui.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const engine = context.window.WWAMArchiveAtlasEngine.create(
    context.window.WWAM_ARCHIVE_ATLAS,
  );
  const ui = context.window.WWAMArchiveAtlasUI.create({ engine });
  return { window: context.window, engine, ui };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function firstTitle(markup) {
  return markup.match(/<article><span>.*?<\/span><h4>(.*?)<\/h4>/s)?.[1];
}

test("publishes a compact isolated UI controller with lifecycle and Ask APIs", () => {
  const { window, ui } = load();

  assert.ok(fs.statSync(uiPath).size < 30_000);
  assert.equal(window.WWAMArchiveAtlasUI.VERSION, "1.0.0");
  for (const method of [
    "mount",
    "setEngine",
    "setLoading",
    "setError",
    "askMarkup",
    "getCopy",
    "getState",
    "destroy",
  ]) {
    assert.equal(typeof ui[method], "function", method);
  }
  assert.deepEqual(plain(ui.getState()), {
    query: "",
    year: "",
    month: "",
    coverage: "",
    limit: 18,
    busy: false,
    error: "",
    mounted: false,
    lastTotal: 0,
    lastShown: 0,
  });
});

test("snapshot and queue copy describe exactly what the evidence and formula prove", () => {
  const { ui } = load();
  const copy = ui.getCopy();

  assert.match(copy.snapshot, /present in the official Streams-feed snapshot/i);
  assert.match(copy.snapshot, /2026-07-23/);
  assert.match(copy.snapshot, /availability was not rechecked/i);
  assert.match(copy.boundary, /not what anyone said/i);
  assert.match(copy.queue, /archive-distill-priority\/v1/);
  assert.match(copy.queue, /0–50/);
  assert.match(copy.queue, /0–30/);
  assert.match(copy.queue, /0–20/);
  assert.match(copy.queue, /eligibility; it adds no points/i);
  assert.match(copy.queue, /no transcript, speaker, sentiment, humor, or topic score/i);
});

test("Ask applies oldest, newest, and cached-view ordering after title matching", () => {
  const { ui } = load();
  const oldest = ui.askMarkup("oldest Scream uploads");
  const newest = ui.askMarkup("newest Scream uploads");
  const viewed = ui.askMarkup("most viewed Scream uploads");

  assert.equal(firstTitle(oldest), "HALLOWEEN KILLS + SCREAM 5 UPDATES! Live!");
  assert.equal(firstTitle(newest), "SCREAM 7 Spoiler Review Party!");
  assert.equal(
    firstTitle(viewed),
    "Ranking HALLOWEEN + SCREAM + ANOES + FRIDAY THE 13th Live!",
  );
  assert.match(oldest, /ORDER: UPLOAD DATE, OLDEST FIRST/);
  assert.match(newest, /ORDER: UPLOAD DATE, NEWEST FIRST/);
  assert.match(viewed, /ORDER: CACHED VIEWS, HIGHEST FIRST/);
});

test("alias-aware Ask filtering rejects substring collateral before metadata sorting", () => {
  const { ui } = load();
  const oldest = ui.askMarkup("oldest Scream uploads");
  const trailers = ui.askMarkup("newest Scream trailer uploads");

  assert.doesNotMatch(oldest, /WWAM Livescream/);
  assert.match(oldest, /SCREAM 5/);
  assert.doesNotMatch(trailers, /SCREAM 7 Spoiler Review Party/);
  assert.match(trailers, /SCREAM 7 Teaser Trailer Breakdown/);
  assert.match(oldest, /SOURCE DISCOVERY \/\/ NOT A CONTENT ANSWER/);
  assert.match(oldest, /do not establish what anyone said/i);
});

test("Ask stays inside upload discovery and never impersonates transcript search", () => {
  const { ui } = load();

  assert.equal(ui.askMarkup("What did they think about Scream?"), "");
  const discovery = ui.askMarkup("Which Scream streams were uploaded in 2025?");
  assert.match(discovery, /CACHED 2026-07-23 SNAPSHOT/);
  assert.match(discovery, /2025-/);
  assert.doesNotMatch(discovery, /speaker|quote|transcript result/i);
});

test("loading and error transitions remain explicit even before a DOM is mounted", () => {
  const { ui } = load();

  ui.setLoading(true);
  assert.equal(ui.getState().busy, true);
  ui.setLoading(false);
  assert.equal(ui.getState().busy, false);
  ui.setError("ARCHIVE TEST FAILURE");
  assert.deepEqual(plain(ui.getState()), {
    query: "",
    year: "",
    month: "",
    coverage: "",
    limit: 18,
    busy: false,
    error: "ARCHIVE TEST FAILURE",
    mounted: false,
    lastTotal: 0,
    lastShown: 0,
  });
});

test("source contract includes live status, busy state, disabled controls, and focus restoration", () => {
  const source = fs.readFileSync(uiPath, "utf8");

  assert.match(source, /setAttribute\("role", "status"\)/);
  assert.match(source, /setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /setAttribute\("aria-busy"/);
  assert.match(source, /control\.disabled = Boolean\(disabled\)/);
  assert.match(source, /focusGenerated\("data-archive-year"/);
  assert.match(source, /focusGenerated\("data-archive-month"/);
  assert.match(source, /focusGenerated\("data-archive-coverage"/);
  assert.match(source, /ARCHIVE LEDGER IS STILL LOADING/);
  assert.doesNotMatch(source, /scheduleIdle|IntersectionObserver|createElement\("script"\)/);
});

test("rejects an incompatible engine instead of rendering plausible empty archive UI", () => {
  const { window } = load();

  assert.throws(
    () => window.WWAMArchiveAtlasUI.create({ engine: { getStats() {} } }),
    /incompatible engine/i,
  );
});
