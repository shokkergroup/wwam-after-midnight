import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ["character-lore.js", "character-receipt-audit.js"]) {
  vm.runInContext(
    fs.readFileSync(new URL(`../public/demo/${file}`, import.meta.url), "utf8"),
    sandbox,
    { filename: file },
  );
}

const lore = sandbox.window.WWAM_CHARACTER_LORE;
const audit = sandbox.window.WWAM_CHARACTER_RECEIPT_AUDIT;
const expectedPerCharacter = {
  loomis: 27,
  challis: 27,
  slenderman: 27,
  "corey-feldman": 27,
};
const blockedAvailability = new Set([
  "private",
  "unavailable",
  "needs_auth",
  "premium_only",
  "subscriber_only",
]);

function sourceIdFromWatchUrl(value) {
  return new URL(value).searchParams.get("v");
}

function cachedMetadata(sourceId) {
  return JSON.parse(
    fs.readFileSync(
      new URL(`../source-cache/metadata/${sourceId}.json`, import.meta.url),
      "utf8",
    ),
  );
}

test("publishes twenty-seven source-grounded playable performances per enabled character", () => {
  assert.equal(lore.version, "1.3.0");
  assert.equal(lore.scope.corpusMode, "all-locally-cached-official-caption-sources");
  assert.ok(lore.scope.officialCaptionSourcesScanned >= 209);
  assert.ok(lore.scope.captionEventsScanned >= 900_000);

  for (const character of lore.characters) {
    assert.equal(character.soundbytes.length, expectedPerCharacter[character.id], character.id);
    for (const receipt of character.soundbytes) {
      assert.equal(receipt.classification, "actual-character-performance", receipt.id);
      assert.equal(receipt.playability.status, "eligible", receipt.id);
      assert.equal(receipt.playability.provider, "youtube", receipt.id);
      assert.equal(sourceIdFromWatchUrl(receipt.url), receipt.sourceId, receipt.id);
      assert.match(receipt.playback.embedUrl, new RegExp(`/embed/${receipt.sourceId}\\?`), receipt.id);
      assert.equal(receipt.provenance.timestampStatus, "exact-caption-event", receipt.id);
      assert.ok(
        [
          "human-curated seed with deterministic caption validation",
          "editorially screened direct-address seed",
        ].includes(receipt.provenance.selection),
        receipt.id,
      );
      assert.ok(receipt.excerpt.split(/\s+/).length <= 16, receipt.id);
      assert.ok(receipt.playback.end > receipt.playback.start, receipt.id);

      const metadata = cachedMetadata(receipt.sourceId);
      assert.equal(metadata.id, receipt.sourceId, receipt.id);
      assert.equal(metadata.channel_id, "UC6ieEOZW4iXV8TcILJI8k5g", receipt.id);
      assert.ok(Number(metadata.duration) > receipt.t, receipt.id);
      assert.equal(metadata.is_private === true, false, receipt.id);
      assert.equal(Number(metadata.age_limit || 0) >= 18, false, receipt.id);
      assert.equal(metadata.age_restricted === true, false, receipt.id);
      assert.equal(
        blockedAvailability.has(String(metadata.availability || "public").toLowerCase()),
        false,
        receipt.id,
      );
    }
  }
  assert.equal(
    lore.characters.reduce((sum, character) => sum + character.soundbytes.length, 0),
    108,
  );
  assert.equal(lore.scope.legacyHumanCuratedPerformanceCandidates, 60);
  assert.equal(lore.scope.screenedDirectAddressPerformanceCandidates, 48);
  assert.equal(lore.scope.playablePerformanceCandidates, 108);
});

test("keeps the additive promotion audit distinct from ordinary alias mentions", () => {
  assert.equal(audit.version, "1.1.0");
  assert.equal(audit.counts.promotedPerformanceReceipts, 83);
  assert.equal(audit.counts.legacyPromotedPerformanceReceipts, 35);
  assert.equal(audit.counts.legacyHumanCuratedPerformanceReceipts, 60);
  assert.equal(audit.counts.screenedDirectAddressPerformanceReceipts, 48);
  assert.equal(audit.counts.rejectedMentionExamples, 4);
  assert.equal(audit.counts.libraryPerformanceReceipts, 108);
  assert.deepEqual(
    JSON.parse(JSON.stringify(audit.counts.perCharacter)),
    expectedPerCharacter,
  );

  const publicIds = new Set(
    lore.characters.flatMap((character) => character.soundbytes.map((item) => item.id)),
  );
  for (const receipt of audit.promotedPerformanceReceipts) {
    assert.equal(receipt.classification, "actual-character-performance", receipt.id);
    assert.equal(receipt.shelfEligible, true, receipt.id);
    assert.equal(publicIds.has(receipt.id), true, receipt.id);
  }
  for (const mention of audit.rejectedMentionExamples) {
    assert.equal(mention.classification, "mere-mention", mention.id);
    assert.equal(mention.shelfEligible, false, mention.id);
    assert.equal(publicIds.has(mention.id), false, mention.id);
    assert.match(mention.decision, /Rejected from the performance shelf/i, mention.id);
  }
});

test("classifies context and locked candidates without leaking them into the public shelf", () => {
  for (const character of lore.characters) {
    assert.ok(
      character.creatorContext.every(
        (receipt) => receipt.classification === "creator-context-not-performance",
      ),
      character.id,
    );
  }
  for (const candidate of lore.lockedCandidates) {
    assert.ok(
      candidate.soundbytes.every(
        (receipt) => receipt.classification === "candidate-unverified-performance",
      ),
      candidate.id,
    );
  }
});
