import assert from "node:assert/strict";
import childProcess from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const audit = path.join(root, "scripts", "audit-episode-semantics.mjs");
let cached;

function report() {
  if (!cached) {
    cached = JSON.parse(childProcess.execFileSync(
      process.execPath,
      [audit, "--summary-json"],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024,
      },
    ));
  }
  return cached;
}

test("all archived Show Wikis pass the semantic truth gates", () => {
  const result = report();

  assert.equal(result.corpus.canonicalSourcesCompiled, 510);
  assert.equal(result.corpus.ready, 509);
  assert.equal(result.corpus.held, 1);
  assert.equal(result.counts.overlappingStoryWindows, 0);
  assert.equal(result.counts.genericPrimarySubjects, 0);
  assert.equal(result.counts.sourceTimelinePublicSubjects, 0);
  assert.equal(result.counts.topicRecapFalseContinuousRanges, 0);
  assert.equal(result.counts.topicRecapFalseEpisodeNarrative, 0);
  assert.equal(result.counts.topicRecapFalseHighlightLanguage, 0);
  assert.equal(result.counts.titleTopicFirstOccurrenceFailures, 0);
  assert.equal(result.counts.invalidDisplayedStoryWindows, 0);
  assert.equal(result.pass, true);
});

test("subject repetition remains an editorial queue and never regresses silently", () => {
  const result = report();

  assert.ok(result.counts.duplicateAdjacentStorySubjects <= 55);
  assert.ok(result.counts.duplicateRepeatedStorySubjects <= 152);
});
