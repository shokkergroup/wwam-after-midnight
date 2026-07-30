import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  extractCaptionRows,
  extractTitleSubjects,
  normalizeForMatch,
} from "../scripts/build-title-topic-overrides.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const demo = path.join(root, "public", "demo");
const metadataDir = path.join(root, "source-cache", "metadata");
const captionsDir = path.join(root, "source-cache", "captions");

function loadArtifact() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(demo, "title-topic-overrides.js"), "utf8"),
    context,
    { filename: "title-topic-overrides.js" },
  );
  return JSON.parse(JSON.stringify(context.window.WWAM_TITLE_TOPIC_OVERRIDES));
}

function words(value) {
  return (String(value || "").match(/[A-Za-z0-9]+(?:[-'’][A-Za-z0-9]+)*/g) || []).length;
}

const artifact = loadArtifact();

test("extracts specific title-native subjects and rejects generic show furniture", () => {
  assert.deepEqual(
    extractTitleSubjects("CHRISTMAS MOVIE Tier List & Movie News - We Watched A Movie LIVE 12/22"),
    ["Christmas Movies"],
  );
  assert.deepEqual(
    extractTitleSubjects("HALLOWEEN Movie Franchise Q & A Live!"),
    ["Halloween Movie Franchise"],
  );
  assert.deepEqual(
    extractTitleSubjects("WWAM Video Live! Hellraiser, Daredevil + More Movie News"),
    ["Hellraiser", "Daredevil"],
  );
  assert.deepEqual(
    extractTitleSubjects("We Watched A Movie Live! Movie News and More"),
    [],
  );
});

test("publishes bounded, source-valid title-topic receipts", () => {
  assert.equal(artifact.schema, "shokker-youtube-wiki/title-topic-overrides/v1");
  assert.match(artifact.snapshotSha256, /^sha256:[a-f0-9]{64}$/);
  assert.ok(artifact.stats.metadataScanned >= 500);
  assert.ok(artifact.stats.overridesConfirmed >= 250);
  assert.equal(artifact.stats.overridesConfirmed, artifact.topics.length);

  const keys = new Set();
  for (const topic of artifact.topics) {
    const key = `${topic.sourceId}:${normalizeForMatch(topic.label)}`;
    assert.ok(!keys.has(key), `duplicate override ${key}`);
    keys.add(key);

    const metadataFile = path.join(metadataDir, `${topic.sourceId}.json`);
    assert.ok(fs.existsSync(metadataFile), `missing metadata ${topic.sourceId}`);
    const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));
    assert.ok(topic.firstAt > 0 && topic.firstAt <= metadata.duration, `${key}:firstAt`);
    assert.ok(topic.peakAt >= topic.firstAt && topic.peakAt <= metadata.duration, `${key}:peakAt`);
    assert.ok(Number.isInteger(topic.mentions) && topic.mentions > 0, `${key}:mentions`);
    assert.ok(topic.excerpt && words(topic.excerpt) <= 16, `${key}:excerpt`);
    assert.match(topic.evidenceBasis, /official-cached-title \+ source-local-caption/);
  }
});

test("locks Christmas Movies to the actual QMY tier-list onset, not early holiday chatter", () => {
  const sourceId = "QMYgsEfPMg0";
  const topic = artifact.topics.find((candidate) => (
    candidate.sourceId === sourceId && candidate.label === "Christmas Movies"
  ));
  assert.ok(topic, "QMY Christmas Movies override is required");
  assert.ok(topic.firstAt >= 2050 && topic.firstAt <= 2110, topic.firstAt);
  assert.ok(topic.peakAt >= 2080 && topic.peakAt <= 2120, topic.peakAt);
  assert.ok(topic.mentions >= 10, topic.mentions);
  assert.equal(topic.excerpt, "We are ranking tier-list-wise Christmas movies.");

  const payload = JSON.parse(fs.readFileSync(path.join(captionsDir, `${sourceId}.json`), "utf8"));
  const rows = extractCaptionRows(payload);
  const earlyHolidayChatter = rows.some((row) => row.at < 1_000 && /\bchristmas\b/.test(row.normalized));
  const evidenceWindow = rows
    .filter((row) => Math.abs(row.at - topic.peakAt) <= 10)
    .map((row) => row.normalized)
    .join(" ");
  assert.equal(earlyHolidayChatter, true);
  assert.match(evidenceWindow, /\bchristmas movies\b/);
});
