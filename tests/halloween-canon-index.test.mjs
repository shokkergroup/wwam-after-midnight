import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "public", "demo", "halloween-canon-index.js"), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);
const canon = context.window.WWAM_HALLOWEEN_CANON;

test("Halloween calling-card index retains the complete direct-source universe", () => {
  assert.equal(canon.schema, "wwam-halloween-canon-index/v1");
  assert.equal(canon.meta.canonicalUnionBeforeNewAcquisition, 78);
  assert.equal(canon.meta.sources, 79);
  assert.equal(new Set(canon.sources.map((item) => item.id)).size, 79);
  assert.equal(canon.meta.watchalongVersions, 16);
  assert.equal(canon.meta.summaryWikis, 53);
  assert.equal(canon.meta.momentBackedWikis, 45);
  assert.equal(canon.meta.wordsAudited, 1453641);
  assert.equal(canon.meta.momentReceipts, 315);
  assert.equal(canon.meta.strictSteveReceipts, 8);
  assert.ok(canon.sources.some((item) => item.id === "eE7I5NjXiqs" &&
    item.versionLineage.version === "Theatrical / regular cut"));
});

test("alternate-night comparison rooms stay exact", () => {
  assert.deepEqual([...canon.collections.alternateNightPairs["Halloween (1978)"]].sort(),
    ["6VXSBDZ-3WE", "NjH2tcGvmAY"].sort());
  assert.deepEqual([...canon.collections.alternateNightPairs["Halloween 4"]].sort(),
    ["28PfRNKoSCA", "KrBhfGxsJNM"].sort());
  assert.deepEqual([...canon.collections.alternateNightPairs["Halloween 6"]].sort(),
    ["ZWF8TPnHr4Y", "eE7I5NjXiqs"].sort());
});

test("high-pressure crossover radar is thresholded and source-linked", () => {
  assert.equal(canon.meta.crossoverSources, 54);
  assert.equal(canon.crossovers[0].id, "saGLWUIxmZQ");
  assert.equal(canon.crossovers[0].mentions, 192);
  assert.ok(canon.crossovers.every((item) =>
    item.mentions >= 20 &&
    /^[A-Za-z0-9_-]{11}$/.test(item.id) &&
    item.evidenceState === "caption-backed crossover topic map"
  ));
});

test("metadata-only entries remain honest source briefs", () => {
  const briefs = canon.sources.filter((item) =>
    item.coverage === "metadata-only" || item.coverage === "caption-limited"
  );
  assert.equal(briefs.length, canon.meta.sourceBriefs);
  assert.ok(briefs.every((item) => item.evidenceLabel === "OFFICIAL SOURCE BRIEF"));
  assert.doesNotMatch(source, /\b(?:price|pricing|buy now|sales package)\b/i);
});

