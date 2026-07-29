import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

import {
  auditRecapVoiceDiversity,
  compileReadyRecaps,
  normalizeSentenceMold,
} from "../scripts/audit-recap-voice-diversity.mjs";

let cachedReport;
const manifestUrl = new URL(
  "../pipeline/wwam_archive_completion_manifest.json",
  import.meta.url,
);
const completionUrl = new URL(
  "../public/demo/archive-completion.js",
  import.meta.url,
);

function report() {
  if (!cachedReport) {
    cachedReport = auditRecapVoiceDiversity(compileReadyRecaps());
  }
  return cachedReport;
}

function expectedReadyCount() {
  const manifest = JSON.parse(fs.readFileSync(manifestUrl, "utf8"));
  const baselineReady = 510 - manifest.sourceCount;
  if (!fs.existsSync(completionUrl)) return baselineReady;

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(completionUrl, "utf8"), context, {
    filename: "archive-completion.js",
  });
  const completion = context.window.WWAM_ARCHIVE_COMPLETION;
  const captioned = completion.streams.filter((stream) => stream.captioned).length;
  assert.equal(completion.meta.captioned, captioned);
  assert.equal(completion.streams.length, manifest.sourceCount);
  return baselineReady + captioned;
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
  const expectedReady = expectedReadyCount();

  assert.equal(result.schema, "wwam-recap-voice-diversity-audit/v1");
  assert.equal(result.corpus.ready, expectedReady);
  assert.equal(result.cohorts.storyOpening.eligibleRecaps, expectedReady);
  assert.equal(result.cohorts.storyFinal.eligibleRecaps, expectedReady);
  assert.equal(result.cohorts.storyBridge.eligibleRecaps, expectedReady);
  assert.ok(
    result.cohorts.sectionOpening.sentences >=
      Math.max(1_800, expectedReady * 5),
  );
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
