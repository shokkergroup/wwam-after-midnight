import assert from "node:assert/strict";
import childProcess from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const audit = path.join(root, "scripts", "audit-episode-recaps.mjs");

function report() {
  return JSON.parse(childProcess.execFileSync(
    process.execPath,
    [audit, "--json"],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  ));
}

test("all canonical shows receive an evidence-bounded recap state", () => {
  const result = report();

  assert.equal(result.corpus.sources, 510);
  assert.equal(result.corpus.ready, 259);
  assert.equal(result.corpus.held, 251);
  assert.deepEqual(result.corpus.tiers, {
    "receipt-recap": 195,
    "source-safe-held": 251,
    "topic-recap": 16,
    "full-chronicle": 48,
  });
  assert.deepEqual(result.quality.missingCaseFiles, []);
});

test("recap prose consumes its real evidence without exposing machine taxonomy", () => {
  const result = report();

  assert.equal(result.quality.excerptBearingActs > 1_000, true);
  assert.equal(
    result.quality.excerptActsUsingSourceNugget,
    result.quality.excerptBearingActs,
  );
  assert.equal(result.quality.excerptUsePercent, 100);
  assert.deepEqual(result.quality.machineLabelLeaks, []);
  assert.deepEqual(result.quality.pluralAgreementErrors, []);
  assert.deepEqual(result.quality.duplicateActLabels, []);
});

test("title subjects, Steve lanes, and chronology survive the authored voice pack", () => {
  const result = report();

  assert.deepEqual(result.quality.titleGoldenFailures, []);
  assert.equal(result.quality.steveLaneSources, 33);
  assert.equal(result.quality.steveLaneCarriedIntoRecap, 33);
  assert.deepEqual(result.quality.missingSteve, []);
  assert.deepEqual(result.quality.earlyClosingLabels, []);
  assert.equal(result.depth.topics.recapsWithGenericFeldmanZoneHeadline, 0);
  assert.equal(result.depth.story.receiptsAccountedFor, 4_206);
  assert.equal(result.depth.story.registeredReceipts, 4_206);
  assert.equal(result.depth.story.segments >= 950, true);
  assert.equal(result.depth.actEvidence.usedPercentByKind.topic >= 58, true);
  assert.equal(
    result.depth.actEvidence.openingCategory.topic >
      result.depth.actEvidence.openingCategory.moment,
    true,
  );
  assert.deepEqual(result.quality.storyCoverageFailures, []);
  assert.deepEqual(result.quality.storyAnchorFailures, []);
  assert.equal(result.voice.uniqueDecks >= 225, true);
  assert.equal(result.voice.uniqueHeadlines >= 200, true);
});
