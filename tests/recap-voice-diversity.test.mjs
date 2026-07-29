import assert from "node:assert/strict";
import test from "node:test";

import {
  auditRecapVoiceDiversity,
  compileReadyRecaps,
  normalizeSentenceMold,
} from "../scripts/audit-recap-voice-diversity.mjs";

let cachedReport;

function report() {
  if (!cachedReport) {
    cachedReport = auditRecapVoiceDiversity(compileReadyRecaps());
  }
  return cachedReport;
}

test("voice mold normalization removes source-variable decoration", () => {
  const left = normalizeSentenceMold(
    "At 1:23:45, Halloween 4 lands on “the Shape came home.”",
    ["Halloween 4"],
  );
  const right = normalizeSentenceMold(
    "At 9:08, Scream lands on “Ghostface has the knife.”",
    ["Scream"],
  );

  assert.equal(left, "at <time> <entity> lands on <quote>");
  assert.equal(right, left);
});

test("all ready recaps are covered by the reusable voice audit", () => {
  const result = report();

  assert.equal(result.schema, "wwam-recap-voice-diversity-audit/v1");
  assert.equal(result.corpus.ready, 259);
  assert.equal(result.cohorts.storyOpening.eligibleRecaps, 259);
  assert.equal(result.cohorts.storyFinal.eligibleRecaps, 259);
  assert.equal(result.cohorts.storyBridge.eligibleRecaps > 225, true);
  assert.equal(result.cohorts.sectionOpening.sentences > 1_800, true);
});

test("no story opening, bridge, or final mold owns more than ten percent", () => {
  const result = report();

  assert.equal(result.gates.storyOpening.pass, true);
  assert.equal(result.gates.storyBridge.pass, true);
  assert.equal(result.gates.storyFinal.pass, true);
  assert.equal(
    result.cohorts.sectionOpening.dominantSentencePercent <=
      result.thresholds.maxDominantMoldPercent,
    true,
  );
  assert.equal(result.flags.dryInventory.occurrences, 0);
  assert.deepEqual(result.flags.repeatedDisclaimers.moldsOverLimit, []);
  assert.equal(result.flags.machineRoomJargon.occurrences, 0);
  assert.equal(result.flags.formatInappropriate.occurrences, 0);
  assert.equal(result.pass, true);
});
