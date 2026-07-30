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

test("copy grammar guard rejects every known generated-prose regression", () => {
  const fixture = runReport(["--copy-grammar-negative-fixture"]);
  const failures = new Set(fixture.failures.map((item) => item.failure));

  assert.equal(fixture.pass, false);
  assert.deepEqual(failures, new Set([
    "doubled definite article",
    'numeric article should be "an" before 11',
    "duplicate paired timestamp",
    "single-character plural verb",
    "fallback subject leaked into fan copy",
    "stacked headline article",
  ]));
  assert.ok(fixture.failures.every((item) =>
    item.sourceId === "__copy-grammar-negative-fixture__" &&
    item.location &&
    item.text
  ));
});

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

test("recap prose stays readable without pasting caption fragments into its body", () => {
  const result = report();

  assert.equal(result.readability.flags.rawCaptionMarkers.occurrences, 0);
  assert.equal(result.readability.flags.forbiddenMetaphors.occurrences, 0);
  assert.equal(result.readability.flags.rawExcerptReuse.occurrences, 0);
  assert.equal(result.readability.flags.quoteSalad.occurrences, 0);
  assert.equal(result.readability.flags.againSuffixes.occurrences, 0);
  assert.equal(result.readability.flags.speakerOverclaims.occurrences, 0);
  assert.equal(result.readability.flags.firewallCopy.occurrences, 0);
  assert.equal(result.readability.pass, true);
  assert.deepEqual(result.quality.machineLabelLeaks, []);
  assert.deepEqual(result.quality.pluralAgreementErrors, []);
  assert.deepEqual(result.quality.generatedCopyGrammarFailures, []);
  assert.deepEqual(result.quality.duplicateActLabels, []);
  assert.equal(result.gates.noGrammarFailures, true);
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
    result.depth.story.registeredReceipts,
  );
  assert.ok(
    result.depth.story.registeredReceipts >= expected.expectedReceipts,
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
  assert.equal(
    result.depth.story.timelineReceiptsAccountedFor,
    result.depth.story.registeredTimelineReceipts,
  );
  assert.deepEqual(result.quality.duplicateVisibleTopologyTopics, []);
});

test("every ready recap has an evidence-owned authored story beat", () => {
  const result = report();

  assert.equal(
    result.depth.story.narrativeBeatSegments,
    result.depth.story.segments,
  );
  assert.equal(
    result.depth.story.namedSegments,
    result.depth.story.segments,
  );
  assert.equal(
    result.depth.story.directAnchorSegments +
      result.depth.story.separateSpikeSegments,
    result.depth.story.segments,
  );
  assert.equal(result.depth.story.inventoryOnlySegments, 0);
  assert.equal(
    result.depth.story.guidePointsAccountedFor,
    result.depth.story.registeredGuidePoints,
  );
  assert.ok(result.depth.story.guideBackedRecaps >= 48);
  assert.ok(result.depth.story.registeredGuidePoints >= 692);
  assert.ok(
    result.depth.story.minimumWordsPerSegment >=
      result.depth.story.requiredWordRange.minimum,
  );
  assert.ok(
    result.depth.story.maximumWordsPerSegment <=
      result.depth.story.requiredWordRange.maximum,
  );
  assert.deepEqual(result.quality.storyWordRangeFailures, []);
  assert.deepEqual(result.quality.namelessStorySegments, []);
  assert.deepEqual(result.quality.storyNarrativeBeatFailures, []);
  assert.deepEqual(result.quality.storySemanticAnchorFailures, []);
  assert.deepEqual(result.quality.bestMomentSelectionFailures, []);
  assert.deepEqual(result.quality.guideStoryCoverageFailures, []);
  assert.equal(result.gates.everyStoryReelHasNarrativeBeat, true);
  assert.equal(result.gates.everyStoryReelNamesItsEvidence, true);
  assert.equal(result.gates.noInventoryOnlyStoryReels, true);
  assert.equal(result.gates.narrativeBeatEvidencePass, true);
  assert.equal(result.gates.storySubjectAnchorSemanticsPass, true);
  assert.equal(result.gates.bestMomentsAreSelective, true);
  assert.equal(result.gates.reviewedGuideStoryCoveragePass, true);
  assert.equal(result.gates.hiddenTimelineReceiptsAccountedFor, true);
  assert.equal(result.gates.storyProseIsConcise, true);
  assert.equal(result.gates.visibleTopologyTopicsAreUnique, true);
  assert.equal(result.gates.recapReadabilityPass, true);
});

test("Christmas 2025 keeps its title subject and a late-tail playable chapter", () => {
  const result = report();
  const file = JSON.parse(childProcess.execFileSync(
    process.execPath,
    [audit, "--source", "QMYgsEfPMg0"],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  ));

  assert.deepEqual(result.quality.qmyGoldenFailures, []);
  assert.match(file.recap.headline, /CHRISTMAS/i);
  assert.ok(file.recap.topics.some((topic) => /CHRISTMAS/i.test(topic)));
  assert.match(file.registeredRecap.blocks[0].body, /CHRISTMAS/i);
  assert.ok(file.recap.caseFile.lastPlayableAnchorPercent >= 85);
  assert.equal(file.recap.caseFile.closingPhaseCovered, true);
  assert.ok(
    Math.max(...file.recap.story.map((segment) => segment.end)) /
      file.duration >= 0.9,
  );
  assert.equal(result.gates.qmyTitleSubjectAndLateTailPass, true);
});

test("Halloween 4 story uses the reviewed guide instead of three nameless reels", () => {
  const file = JSON.parse(childProcess.execFileSync(
    process.execPath,
    [audit, "--source", "28PfRNKoSCA"],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  ));
  const story = file.recap.story;
  const guideCutIds = new Set(
    story.flatMap((segment) => segment.guideCutIds || []),
  );
  const namedTopics = new Set(
    story.flatMap((segment) => segment.topicLabels || []),
  );

  assert.ok(story.length >= 4);
  assert.equal(file.recap.caseFile.storyGuidePointExpected, 13);
  assert.equal(file.recap.caseFile.storyGuidePointCount, 13);
  assert.equal(file.recap.caseFile.storyGuidePointCoveragePercent, 100);
  assert.equal(guideCutIds.size, 13);
  assert.ok(namedTopics.has("Michael Myers"));
  assert.ok(namedTopics.has("Dr. Loomis"));
  assert.ok(namedTopics.has("Ending and reveal"));
  assert.ok(story.every((segment) =>
    segment.narrative?.schema === "shokker-recap-narrative-beat/v1" &&
    segment.narrative.primarySubject &&
    (
      segment.guideCutIds.length
        ? segment.narrative.primaryEvidence.kind === "guide-cut" &&
          segment.guideCutIds.includes(segment.narrative.primaryEvidence.key)
        : segment.narrative.primaryEvidence.kind === "receipt" &&
          segment.receiptKeys.includes(segment.narrative.primaryEvidence.key)
    )
  ));
  assert.doesNotMatch(
    story.map((segment) => segment.body).join(" "),
    /without a named subject attached/i,
  );
});
