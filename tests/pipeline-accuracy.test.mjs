import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadPublic(files) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  files.forEach((file) => {
    vm.runInContext(read(path.join("public", "demo", file)), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

test("sealed Rob Zombie Halloween II keeps factual metadata without invented receipts", () => {
  const window = loadPublic(["catalog.js", "deep-distill.js"]);
  const source = window.WWAM_CATALOG.find((item) => item.id === "AzrcgoyE7C4");
  const tape = window.WWAM_DEEP_DISTILL.tapes.find((item) => item.id === source.id);

  assert.equal(source.title, "HALLOWEEN 2 Full Movie Commentary (Rob Zombie's H2)");
  assert.equal(source.date, "2018-03-22");
  assert.equal(source.duration, 7_247);
  assert.equal(source.views, 25_612);
  assert.equal(source.viewsObservedAt, "2026-07-24T00:10:12-04:00");
  assert.equal(source.ageLimit, 18);
  assert.equal(source.availability, "needs_auth");
  assert.equal(source.liveStatus, "not_live");
  assert.equal(source.transcript, false);
  assert.equal(tape.wordsAudited, 0);
  assert.deepEqual(Array.from(tape.moments), []);
});

test("public audit copy distinguishes captioned runtime and uses the real heatmap count", () => {
  const readme = read("README.md");

  assert.match(readme, /171\.19 caption-audited hours/);
  assert.match(readme, /177\.45 hours of known source runtime/);
  assert.match(readme, /720 caption-backed heatmap/);
  assert.doesNotMatch(readme, /750 heatmap/);
  assert.match(
    readme,
    /60\s+timestamp-validated human-curated character-performance candidates/,
  );
  assert.match(readme, /0\s+authenticated editor-verified\s+decisions/);
});

test("Character Lore scans the complete cached official corpus and never aliases validation as verification", () => {
  const window = loadPublic(["character-lore.js"]);
  const lore = window.WWAM_CHARACTER_LORE;
  const pipeline = read(path.join("pipeline", "wwam_character_distill.py"));

  assert.equal(lore.scope.corpusMode, "all-locally-cached-official-caption-sources");
  assert.equal(lore.scope.officialCaptionSourcesScanned, 209);
  assert.equal(lore.scope.captionFilesScanned, 209);
  assert.equal(lore.scope.curatedPerformanceCandidates, 60);
  assert.equal(lore.scope.lockedPerformanceCandidates, 3);
  assert.equal(lore.scope.authenticatedEditorVerifiedDecisions, 0);
  assert.equal("verifiedSoundbytes" in lore.scope, false);
  lore.characters.forEach((character) => {
    assert.equal("verifiedSoundbytes" in character.metrics, false);
    assert.equal(character.metrics.curatedPerformanceCandidates, 15);
    character.soundbytes.forEach((soundbyte) => {
      assert.match(
        soundbyte.provenance.speakerBasis,
        /host identity comes only from the owner-supplied mapping/i,
      );
    });
  });
  const locked = lore.lockedCandidates.find(
    (candidate) => candidate.id === "marky-mark",
  );
  assert.ok(locked);
  locked.soundbytes.forEach((soundbyte) => {
    assert.match(
      soundbyte.provenance.speakerBasis,
      /both the clip speaker and the recurring-character performer remain unknown/i,
    );
    assert.match(
      soundbyte.provenance.speakerBasis,
      /no owner-supplied performer mapping exists/i,
    );
    assert.doesNotMatch(
      soundbyte.provenance.speakerBasis,
      /host identity comes only from the owner-supplied mapping/i,
    );
  });
  assert.match(pipeline, /def official_cached_source_ids\(/);
  assert.match(pipeline, /all-locally-cached-official-caption-sources/);
  assert.doesNotMatch(pipeline, /Expected the promoted 74-source corpus/);
});

test("future pipeline builds use explicit observation provenance and verified completion", () => {
  const deep = read(path.join("pipeline", "wwam_deep_distill.py"));
  const fresh = read(path.join("pipeline", "wwam_livestream_distill.py"));
  const popular = read(path.join("pipeline", "wwam_popular_live_distill.py"));

  for (const source of [deep, fresh, popular]) {
    assert.match(source, /--observed-at/);
    assert.match(source, /observedAt/);
    assert.doesNotMatch(source, /"generated": "2026-07-23"/);
  }

  assert.match(deep, /ignore_no_formats_error/);
  assert.match(deep, /ageLimit/);
  assert.match(deep, /sourceFingerprint/);

  assert.match(fresh, /COMPLETED_LIVE_STATUSES/);
  assert.match(fresh, /select_completed_streams/);
  assert.match(fresh, /live_status in COMPLETED_LIVE_STATUSES/);
  assert.match(fresh, /feedFingerprint/);
  assert.match(fresh, /"cutoff": cutoff/);

  assert.match(popular, /feedFingerprint/);
  assert.match(popular, /eligibleCompletedEntries/);
  assert.match(popular, /"cutoff": cutoff/);
  assert.match(popular, /viewMargin/);
  assert.match(popular, /legacy metadata cache without observation\/live-status/);
});
