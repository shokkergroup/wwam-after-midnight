import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const audit = path.join(root, "scripts", "audit-episode-recaps.mjs");
const completionArtifact = path.join(root, "public", "demo", "archive-completion.js");
let cachedReport;
let cachedBaselineReport;

function runReport(extraArgs = []) {
  return JSON.parse(childProcess.execFileSync(
      process.execPath,
      [audit, "--json", ...extraArgs],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
      },
    ));
}

function report() {
  if (!cachedReport) {
    cachedReport = runReport();
  }
  return cachedReport;
}

function baselineReport() {
  if (!cachedBaselineReport) {
    cachedBaselineReport = runReport(["--without-archive-completion"]);
  }
  return cachedBaselineReport;
}

function completionPayload() {
  if (!fs.existsSync(completionArtifact)) return null;
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(completionArtifact, "utf8"), context, {
    filename: "archive-completion.js",
  });
  return JSON.parse(JSON.stringify(context.window.WWAM_ARCHIVE_COMPLETION));
}

function expectedCompletionDelta() {
  const baseline = baselineReport();
  const completion = completionPayload();
  if (!completion) {
    return {
      baseline,
      addedReady: 0,
      expectedReady: baseline.corpus.ready,
      expectedHeld: baseline.corpus.held,
      expectedReceipts: baseline.depth.story.registeredReceipts,
    };
  }

  const captioned = completion.streams.filter((stream) => stream.captioned).length;
  const held = completion.streams.length - captioned;
  const completionReceipts = completion.streams.reduce(
    (total, stream) => total
      + (stream.topics || []).length
      + (stream.moments || []).length
      + (stream.characters || []).length,
    0,
  );
  assert.equal(completion.meta.captioned, captioned);
  assert.equal(completion.meta.exactSourceHolds, held);
  assert.equal(completion.streams.length, baseline.corpus.held);

  return {
    baseline,
    addedReady: captioned,
    expectedReady: baseline.corpus.ready + captioned,
    expectedHeld: held,
    expectedReceipts:
      baseline.depth.story.registeredReceipts + completionReceipts,
  };
}

test("all canonical shows receive an evidence-bounded recap state", () => {
  const result = report();
  const expected = expectedCompletionDelta();

  assert.equal(result.corpus.sources, 510);
  assert.equal(result.corpus.ready, expected.expectedReady);
  assert.equal(result.corpus.held, expected.expectedHeld);
  assert.equal(result.corpus.ready + result.corpus.held, result.corpus.sources);
  assert.equal(
    result.corpus.tiers["source-safe-held"],
    expected.expectedHeld,
  );
  assert.equal(
    Object.values(result.corpus.tiers).reduce((total, count) => total + count, 0),
    result.corpus.sources,
  );
  for (const tier of ["receipt-recap", "topic-recap", "full-chronicle"]) {
    assert.ok(
      result.corpus.tiers[tier] >= expected.baseline.corpus.tiers[tier],
      tier,
    );
  }
  assert.deepEqual(result.quality.missingCaseFiles, []);
});

test("recap prose consumes its real evidence without exposing machine taxonomy", () => {
  const result = report();
  const baseline = baselineReport();

  assert.ok(
    result.quality.excerptBearingActs >= baseline.quality.excerptBearingActs,
  );
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
  const expected = expectedCompletionDelta();

  assert.deepEqual(result.quality.titleGoldenFailures, []);
  assert.ok(
    result.quality.steveLaneSources >= expected.baseline.quality.steveLaneSources,
  );
  assert.equal(
    result.quality.steveLaneCarriedIntoRecap,
    result.quality.steveLaneSources,
  );
  assert.deepEqual(result.quality.missingSteve, []);
  assert.deepEqual(result.quality.earlyClosingLabels, []);
  assert.equal(result.depth.topics.recapsWithGenericFeldmanZoneHeadline, 0);
  assert.equal(
    result.depth.story.receiptsAccountedFor,
    expected.expectedReceipts,
  );
  assert.equal(
    result.depth.story.registeredReceipts,
    expected.expectedReceipts,
  );
  assert.ok(
    result.depth.story.segments >=
      expected.baseline.depth.story.segments + expected.addedReady,
  );
  assert.equal(result.depth.actEvidence.usedPercentByKind.topic >= 58, true);
  assert.equal(
    result.depth.actEvidence.openingCategory.topic >
      result.depth.actEvidence.openingCategory.moment,
    true,
  );
  assert.deepEqual(result.quality.storyCoverageFailures, []);
  assert.deepEqual(result.quality.storyAnchorFailures, []);
  assert.equal(result.voice.uniqueDecks, result.corpus.ready);
  assert.equal(result.voice.uniqueHeadlines, result.corpus.ready);
});
