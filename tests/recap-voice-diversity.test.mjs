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

  assert.equal(result.schema, "wwam-recap-readability-audit/v2");
  assert.equal(result.corpus.ready, expectedReady);
  assert.equal(result.cohorts.storyOpening.eligibleRecaps, expectedReady);
  assert.equal(result.cohorts.storyFinal.eligibleRecaps, expectedReady);
  assert.equal(result.cohorts.storyBridge.eligibleRecaps, expectedReady);
  assert.ok(
    result.cohorts.sectionOpening.sentences >=
      Math.max(1_800, expectedReady * 5),
  );
});

test("clear deterministic prose replaces randomized template diversity", () => {
  const result = report();

  assert.ok(result.cohorts.storyOpening.dominantRecapPercent > 10);
  assert.ok(result.cohorts.storyBridge.dominantRecapPercent > 10);
  assert.equal(result.gates.noRawCaptionMarkers, true);
  assert.equal(result.gates.noForbiddenMetaphors, true);
  assert.equal(result.gates.noRawExcerptReuse, true);
  assert.equal(result.gates.noQuoteSalad, true);
  assert.equal(result.gates.noAgainSuffixes, true);
  assert.equal(result.gates.noSpeakerOverclaims, true);
  assert.equal(result.gates.noFirewallCopy, true);
  assert.equal(result.flags.dryInventory.occurrences, 0);
  assert.deepEqual(result.flags.repeatedDisclaimers.moldsOverLimit, []);
  assert.equal(result.flags.machineRoomJargon.occurrences, 0);
  assert.equal(result.flags.formatInappropriate.occurrences, 0);
  assert.equal(result.pass, true);
});

test("readability gate catches caption debris, quote salad, and attribution firewalls", () => {
  const [compiled] = compileReadyRecaps();
  const file = structuredClone(compiled);
  const receipt = file.source.receipts[0];
  receipt.excerpt =
    "this raw caption fragment should never be pasted into editorial prose";
  file.recap.story[0].body =
    "The board opens its after-hours ledger. [Music] This raw caption fragment should never be pasted into editorial prose. " +
    "\"one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.\"";
  file.recap.story[0].label += " // AGAIN";
  file.registeredRecap = {
    overview: "Mike says the movie is finished.",
    blocks: [{
      body: "Playback decides who said what.",
    }],
  };

  const result = auditRecapVoiceDiversity([file]);

  assert.ok(result.flags.rawCaptionMarkers.occurrences >= 1);
  assert.ok(result.flags.forbiddenMetaphors.occurrences >= 1);
  assert.ok(result.flags.rawExcerptReuse.occurrences >= 1);
  assert.ok(result.flags.quoteSalad.occurrences >= 1);
  assert.ok(result.flags.againSuffixes.occurrences >= 1);
  assert.ok(result.flags.speakerOverclaims.occurrences >= 1);
  assert.ok(result.flags.firewallCopy.occurrences >= 1);
  assert.equal(result.pass, false);
});
