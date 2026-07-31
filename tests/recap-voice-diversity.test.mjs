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

function isHumanEditorial(file) {
  return /human-editorial/i.test(String(file.recap?.editorialState || "")) ||
    file.recap?.editorialEvidence?.humanEditorialRead === true ||
    file.recap?.caseFile?.humanEditorialRead === true ||
    file.editorialPack?.reviewState === "full-tape-human-editorial-read";
}

function isStructuredSummary(file) {
  return !isHumanEditorial(file) &&
    file.recap?.editorialState === "structured-source-summary";
}

function publicStoryFiles(files) {
  return files.filter((file) =>
    !isStructuredSummary(file) && (file.recap?.story || []).length
  );
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

test("the reusable voice audit discovers each live public recap model", () => {
  const files = compileReadyRecaps();
  const result = report();
  const expectedReady = expectedReadyCount();
  const human = files.filter(isHumanEditorial);
  const structured = files.filter(isStructuredSummary);
  const legacy = files.filter((file) =>
    !isHumanEditorial(file) && !isStructuredSummary(file)
  );
  const publicStories = publicStoryFiles(files);
  const publicBridges = publicStories.filter(
    (file) => file.recap.story.length > 1,
  );

  assert.equal(result.schema, "wwam-recap-readability-audit/v2");
  assert.equal(result.corpus.ready, expectedReady);
  assert.equal(files.length, expectedReady);
  assert.ok(human.length > 0);
  assert.ok(structured.length > 0);
  assert.equal(human.length + structured.length + legacy.length, files.length);
  assert.deepEqual(result.corpus.publicModels, {
    humanEditorial: human.length,
    structuredSourceSummary: structured.length,
    legacy: legacy.length,
  });
  assert.equal(
    result.cohorts.storyOpening.eligibleRecaps,
    publicStories.length,
  );
  assert.equal(
    result.cohorts.storyFinal.eligibleRecaps,
    publicStories.length,
  );
  assert.equal(
    result.cohorts.storyBridge.eligibleRecaps,
    publicBridges.length,
  );
  assert.equal(
    result.cohorts.sectionOpening.sentences,
    legacy.reduce(
      (total, file) => total + (file.recap.sections || []).length,
      0,
    ),
  );
  human.forEach((file) => {
    assert.equal(
      file.editorialPack?.reviewState,
      "full-tape-human-editorial-read",
      file.id,
    );
    assert.ok(file.recap.story.length > 0, file.id);
    assert.ok(file.recap.highlightRunway.length > 0, file.id);
  });
});

test("human editorial prose stays distinct and passes the public readability gate", () => {
  const result = report();

  assert.equal(
    result.cohorts.storyOpening.uniqueMolds,
    result.cohorts.storyOpening.sentences,
  );
  assert.equal(
    result.cohorts.storyFinal.uniqueMolds,
    result.cohorts.storyFinal.sentences,
  );
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

test("structured summaries do not audit hidden machine story scaffolding", () => {
  const compiled = compileReadyRecaps().find(isStructuredSummary);
  assert.ok(compiled);
  const file = structuredClone(compiled);
  file.recap.story[0].body =
    "The board opens its after-hours ledger. [Music] Mike says this is hidden.";
  file.recap.story[0].label += " // AGAIN";
  file.recap.sections[0].body =
    "Playback decides who said what inside hidden machine scaffolding.";
  file.registeredRecap = {
    overview: "Mike says this hidden recap is finished.",
    blocks: [{ body: "Playback decides who said what." }],
  };

  const result = auditRecapVoiceDiversity([file]);

  assert.equal(result.corpus.publicModels.structuredSourceSummary, 1);
  assert.equal(result.cohorts.storyOpening.sentences, 0);
  assert.equal(result.cohorts.sectionOpening.sentences, 0);
  assert.equal(result.flags.rawCaptionMarkers.occurrences, 0);
  assert.equal(result.flags.forbiddenMetaphors.occurrences, 0);
  assert.equal(result.flags.againSuffixes.occurrences, 0);
  assert.equal(result.flags.speakerOverclaims.occurrences, 0);
  assert.equal(result.flags.firewallCopy.occurrences, 0);
  assert.equal(result.pass, true);
});

test("legacy public recap mutations still trip every strict readability guard", () => {
  const compiled = compileReadyRecaps().find(isHumanEditorial);
  assert.ok(compiled);
  const file = structuredClone(compiled);
  file.recap.editorialState = "";
  file.recap.editorialEvidence = {};
  file.recap.caseFile.humanEditorialRead = false;
  file.editorialPack = null;
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

  assert.equal(result.corpus.publicModels.legacy, 1);
  assert.ok(result.flags.rawCaptionMarkers.occurrences >= 1);
  assert.ok(result.flags.forbiddenMetaphors.occurrences >= 1);
  assert.ok(result.flags.rawExcerptReuse.occurrences >= 1);
  assert.ok(result.flags.quoteSalad.occurrences >= 1);
  assert.ok(result.flags.againSuffixes.occurrences >= 1);
  assert.ok(result.flags.speakerOverclaims.occurrences >= 1);
  assert.ok(result.flags.firewallCopy.occurrences >= 1);
  assert.equal(result.pass, false);
});
