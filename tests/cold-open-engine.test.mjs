import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "creator-studio-engine.js",
    "cold-open-engine.js"
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file
    });
  });
  return sandbox.window;
}

function build(window) {
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const factory = window.WWAMColdOpenFactory.create({ clipLab });
  return { showcase, clipLab, factory };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function words(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean);
}

function publicExcerpt(value, limit = 16) {
  const tokens = words(value);
  return tokens.length > limit
    ? `${tokens.slice(0, limit).join(" ")}…`
    : tokens.join(" ");
}

test("Cold Open Factory extends Clip Lab into all four deterministic formats", () => {
  const window = load();
  const first = build(window);
  const second = build(window);

  assert.equal(window.WWAMColdOpenFactory.VERSION, "1.0.0");
  assert.equal(Object.isFrozen(window.WWAMColdOpenFactory), true);
  assert.ok(first.factory.metrics.storyboards > 60);
  assert.ok(first.factory.metrics.fifteenSecond > 20);
  assert.ok(first.factory.metrics.thirtySecond > 20);
  assert.ok(first.factory.metrics.sixtySecond > 10);
  assert.ok(first.factory.metrics.ninetySecond > 5);
  assert.equal(first.factory.metrics.unresolvedSlots, 0);
  assert.equal(first.factory.metrics.inferredSpeakersNamed, 0);
  assert.equal(first.factory.metrics.publicExcerptWordLimit, 16);
  assert.ok(first.factory.metrics.truncatedExcerptSlots > 0);
  assert.equal(first.factory.inputFingerprint, second.factory.inputFingerprint);
  assert.deepEqual(plain(first.factory.metrics), plain(second.factory.metrics));
  assert.deepEqual(
    plain(first.factory.storyboards.slice(0, 12)),
    plain(second.factory.storyboards.slice(0, 12))
  );
});

test("every storyboard is exact length with hook, payoff, and gapless pacing slots", () => {
  const window = load();
  const { factory } = build(window);

  factory.storyboards.forEach((storyboard) => {
    assert.ok([15, 30, 60, 90].includes(storyboard.formatSeconds));
    assert.equal(
      storyboard.slots.reduce((sum, slot) => sum + slot.seconds, 0),
      storyboard.formatSeconds
    );
    assert.equal(storyboard.slots[0].timelineIn, 0);
    assert.equal(
      storyboard.slots.at(-1).timelineOut,
      storyboard.formatSeconds
    );
    storyboard.slots.forEach((slot, index) => {
      assert.equal(slot.order, index + 1);
      assert.equal(slot.timelineOut - slot.timelineIn, slot.seconds);
      if (index > 0) {
        assert.equal(slot.timelineIn, storyboard.slots[index - 1].timelineOut);
      }
    });
    assert.equal(storyboard.slots[0].role, "HOOK");
    assert.ok(storyboard.slots.some((slot) => slot.role === "PAYOFF"));
    assert.equal(storyboard.hookReceiptId, storyboard.receiptIds[0]);
    assert.equal(
      storyboard.payoffReceiptId,
      storyboard.receiptIds.at(-1)
    );
    assert.equal(storyboard.pacing.exactRuntimeSeconds, storyboard.formatSeconds);
  });
});

test("source slots resolve exactly to Clip Lab receipts and stay inside its edit windows", () => {
  const window = load();
  const { clipLab, factory } = build(window);

  factory.storyboards.forEach((storyboard) => {
    const slots = storyboard.slots.filter((slot) => slot.kind === "source-clip");
    assert.equal(slots.length, storyboard.sourceClipCount);
    assert.equal(new Set(storyboard.receiptIds).size, storyboard.receiptIds.length);
    assert.ok(storyboard.sourceCount >= 2);
    slots.forEach((slot) => {
      const candidate = clipLab.fromReceipt(slot.receiptId);
      assert.ok(candidate, slot.receiptId);
      assert.equal(slot.sourceId, candidate.sourceId);
      assert.equal(slot.receiptAt, candidate.receiptAt);
      assert.equal(slot.archivalExcerpt, publicExcerpt(candidate.archivalExcerpt));
      assert.ok(words(slot.archivalExcerpt).length <= 16);
      assert.equal(
        slot.originalExcerptWordCount,
        words(candidate.archivalExcerpt).length
      );
      assert.equal(
        slot.excerptTruncated,
        words(candidate.archivalExcerpt).length > 16
      );
      assert.equal(slot.publicExcerptWordLimit, 16);
      assert.equal(slot.sourceAtReceipt, candidate.receiptUrl);
      assert.match(slot.sourceAtReceipt, /^https:\/\/www\.youtube\.com\/watch\?v=/);
      assert.equal(slot.proposedSourceWindow.withinClipLabWindow, true);
      assert.ok(slot.proposedSourceWindow.in <= slot.receiptAt);
      assert.ok(slot.proposedSourceWindow.out > slot.receiptAt);
      assert.equal(slot.mediaIncluded, false);
    });
  });
});

test("new copy is labeled, public excerpts are bounded, and no speaker is inferred", () => {
  const window = load();
  const { factory } = build(window);

  factory.storyboards.forEach((storyboard) => {
    assert.match(storyboard.copyLabel, /^SUGGESTED EDITORIAL COPY/);
    assert.equal(storyboard.proofLedger.inferredSpeakersNamed, 0);
    storyboard.slots.forEach((slot) => {
      if (slot.kind === "editorial-card") {
        assert.match(slot.copyLabel, /^SUGGESTED EDITORIAL CARD/);
        assert.equal(slot.archivalQuote, false);
        assert.equal(slot.generatedVoiceover, false);
        assert.match(slot.audioPolicy, /No generated host or character audio/);
      } else {
        assert.ok(words(slot.archivalExcerpt).length <= 16);
        assert.equal(slot.speakerCredit, null);
        assert.equal(slot.speakerStatus, "NOT ASSIGNED BY COLD OPEN FACTORY");
        assert.match(slot.speakerBoundary, /not speaker-diarized/i);
        assert.match(slot.excerptLabel, /^ARCHIVAL CAPTION EXCERPT/);
      }
    });
  });
});

test("format, character, topic, category, risk, and evidence filters compose", () => {
  const window = load();
  const { factory } = build(window);
  const loomis = factory.getStoryboards({
    format: 30,
    character: "Loomis",
    maxRisk: "HIGH"
  });

  assert.ok(loomis.length > 0);
  loomis.forEach((storyboard) => {
    assert.equal(storyboard.formatSeconds, 30);
    assert.ok(["LOW", "MEDIUM", "HIGH"].includes(storyboard.risk.label));
    assert.ok(
      storyboard.slots
        .filter((slot) => slot.kind === "source-clip")
        .some((slot) =>
          slot.characters.some((character) =>
            character.label.toLowerCase().includes("loomis")
          )
        )
    );
  });

  const halloween = factory.getStoryboards({
    duration: 60,
    topic: "Halloween",
    minEvidence: "MEDIUM",
    limit: 5
  });
  assert.ok(halloween.length > 0);
  assert.ok(halloween.length <= 5);
  halloween.forEach((storyboard) => {
    assert.equal(storyboard.formatSeconds, 60);
    assert.ok(["MEDIUM", "HIGH"].includes(storyboard.evidence.label));
  });

  const category = factory.facets.anchors.find(
    (facet) => facet.value === "UP IN YA"
  );
  assert.ok(category);
  const categoryResults = factory.getStoryboards({
    category: "UP IN YA",
    mode: "CONTROLLED ESCALATION"
  });
  assert.ok(categoryResults.length > 0);
});

test("campaign metadata embeds a receipt-exact public Clip Lab manifest and no media", () => {
  const window = load();
  const { clipLab, factory } = build(window);
  const selection = [
    factory.getStoryboards({ format: 15 })[0],
    factory.getStoryboards({ format: 30 })[0],
    factory.getStoryboards({ format: 60 })[0],
    factory.getStoryboards({ format: 90 })[0]
  ];
  const first = factory.createCampaignMetadata(selection, {
    name: "Four-format launch packet"
  });
  const second = factory.createCampaignMetadata(selection, {
    name: "Four-format launch packet"
  });

  assert.deepEqual(plain(first), plain(second));
  assert.equal(first.schema, "shokker.cold-open-campaign/v1");
  assert.equal(first.storyboardCount, 4);
  assert.equal(first.totalRuntimeSeconds, 195);
  assert.deepEqual(plain(first.formats), [15, 30, 60, 90]);
  assert.equal(first.mediaIncluded, false);
  assert.equal(first.approvalGate.publishAutomatically, false);
  assert.equal(first.proofLedger.unresolvedSourceSlots, 0);
  assert.equal(first.proofLedger.inferredSpeakersNamed, 0);
  assert.equal(
    first.clipLabManifest.schema,
    "shokker.creator-clip-manifest/v1"
  );
  assert.deepEqual(
    plain(first.clipLabManifest.receiptIds),
    plain(first.proofLedger.receiptIds)
  );
  first.clipLabManifest.receiptIds.forEach((receiptId) => {
    assert.ok(clipLab.fromReceipt(receiptId));
  });
  first.clipLabManifest.clips.forEach((clip) => {
    const source = clipLab.fromReceipt(clip.receiptId);
    assert.ok(source);
    assert.ok(words(clip.archivalExcerpt).length <= 16);
    assert.equal(clip.archivalExcerpt, publicExcerpt(source.archivalExcerpt));
    assert.equal(clip.excerptTruncated, words(source.archivalExcerpt).length > 16);
    assert.equal(
      clip.originalExcerptWordCount,
      words(source.archivalExcerpt).length
    );
    assert.equal(clip.publicExcerptWordLimit, 16);
  });
  first.editDecisionList.forEach((slot) => {
    if (slot.kind === "source-clip") {
      assert.equal(slot.mediaIncluded, false);
      assert.equal(slot.speakerCredit, null);
      assert.ok(words(slot.archivalExcerpt).length <= 16);
      assert.equal(slot.publicExcerptWordLimit, 16);
      assert.match(slot.sourceAtReceipt, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    } else {
      assert.equal(slot.archivalQuote, false);
      assert.equal(slot.generatedVoiceover, false);
    }
  });

  const exported = factory.exportCampaignMetadata(first);
  assert.deepEqual(JSON.parse(exported), plain(first));
  assert.equal(factory.createManifest, factory.createCampaignMetadata);
  assert.equal(factory.exportManifest, factory.exportCampaignMetadata);

  const tampered = {
    ...selection[0],
    slots: selection[0].slots.map((slot, index) =>
      index === 0
        ? {
            ...slot,
            archivalExcerpt: "fabricated campaign text",
            speakerCredit: "fabricated speaker"
          }
        : slot
    )
  };
  const canonical = factory.createCampaignMetadata(tampered);
  const firstSource = canonical.editDecisionList.find(
    (slot) => slot.kind === "source-clip"
  );
  assert.notEqual(firstSource.archivalExcerpt, "fabricated campaign text");
  assert.equal(firstSource.speakerCredit, null);
});

test("storyboard snapshots restore exactly and reject a tampered ledger", () => {
  const window = load();
  const first = build(window).factory;
  const storyboard = first.getStoryboards({
    duration: 60,
    query: "Halloween",
    limit: 1
  })[0];

  assert.ok(storyboard);
  const saved = plain(first.snapshotStoryboard(storyboard.id));
  assert.equal(saved.schema, "shokker.cold-open-storyboard-snapshot/v1");
  assert.equal(saved.id, storyboard.id);
  assert.deepEqual(saved.receiptIds, plain(storyboard.receiptIds));
  assert.deepEqual(saved.sourceIds, plain(storyboard.sourceIds));
  assert.equal(saved.slotSignature.length, storyboard.slots.length);

  const reloaded = build(window).factory;
  const restored = reloaded.restoreStoryboard(
    JSON.parse(JSON.stringify(saved))
  );
  assert.ok(restored);
  assert.deepEqual(plain(restored), plain(storyboard));

  const tamperedReceipt = {
    ...saved,
    receiptIds: [...saved.receiptIds].reverse()
  };
  assert.equal(reloaded.restoreStoryboard(tamperedReceipt), null);
  const tamperedSlot = {
    ...saved,
    slotSignature: saved.slotSignature.map((slot, index) =>
      index === 0 ? { ...slot, seconds: slot.seconds + 1 } : slot
    )
  };
  assert.equal(reloaded.restoreStoryboard(tamperedSlot), null);
  assert.equal(reloaded.snapshotStoryboard("missing-storyboard"), null);
});

test("campaign cap and missing Clip Lab provenance fail closed", () => {
  const window = load();
  const { factory } = build(window);
  const tooMany = Array.from({ length: 25 }, (_, index) => ({
    ...factory.storyboards[index % factory.storyboards.length],
    id: `synthetic-selection-${index}`
  }));
  assert.throws(
    () => factory.createCampaignMetadata(tooMany),
    /capped at 24 storyboards/
  );
  assert.throws(
    () =>
      factory.createCampaignMetadata({
        ...factory.storyboards[0],
        id: "missing-storyboard"
      }),
    /missing from this deterministic factory build/
  );
  assert.throws(
    () => window.WWAMColdOpenFactory.create({ clipLab: {} }),
    /requires an existing Creator Clip Lab/
  );
});

test("the current Loomis 30-second sample is deterministic and fully sourced", () => {
  const window = load();
  const first = build(window).factory;
  const second = build(window).factory;
  const sampleA = first.getStoryboards({
    format: 30,
    anchorType: "character",
    character: "Dr. Loomis",
    maxRisk: "HIGH",
    limit: 1
  })[0];
  const sampleB = second.getStoryboards({
    format: 30,
    anchorType: "character",
    character: "Dr. Loomis",
    maxRisk: "HIGH",
    limit: 1
  })[0];

  assert.ok(sampleA);
  assert.deepEqual(plain(sampleA), plain(sampleB));
  assert.equal(sampleA.formatSeconds, 30);
  assert.equal(sampleA.anchor.label, "Dr. Loomis");
  assert.equal(sampleA.mode, "CALLBACK LADDER");
  assert.equal(sampleA.receiptIds.length, 3);
  assert.ok(sampleA.sourceIds.length >= 2);
  assert.equal(sampleA.proofLedger.unresolvedSlots, 0);
  assert.equal(sampleA.proofLedger.inferredSpeakersNamed, 0);
});
