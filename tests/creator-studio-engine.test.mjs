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
    "creator-studio-engine.js"
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
  return {
    showcase,
    lab: window.WWAMCreatorClipLab.create({ showcase })
  };
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

test("Creator Clip Lab builds a substantial deterministic editorial inventory", () => {
  const window = load();
  const first = build(window);
  const second = build(window);

  assert.equal(window.WWAMCreatorClipLab.VERSION, "1.1.0");
  assert.ok(first.lab.metrics.shortCandidates > 400);
  assert.ok(first.lab.metrics.supercutBundles > 20);
  assert.ok(first.lab.metrics.resurfacingOpportunities > 10);
  assert.ok(first.lab.metrics.sourcesRepresented > 50);
  assert.equal(first.lab.metrics.timestamped, first.lab.metrics.shortCandidates);
  assert.equal(first.lab.inputFingerprint, second.lab.inputFingerprint);
  assert.deepEqual(plain(first.lab.metrics), plain(second.lab.metrics));
  assert.deepEqual(
    plain(first.lab.shorts.slice(0, 10)),
    plain(second.lab.shorts.slice(0, 10))
  );
});

test("every Short candidate keeps archival evidence separate from suggested copy", () => {
  const window = load();
  const { showcase, lab } = build(window);
  const receiptById = new Map(showcase.receipts.map((receipt) => [receipt.id, receipt]));
  const sourceById = new Map(showcase.sources.map((source) => [source.id, source]));

  lab.shorts.forEach((candidate) => {
    const receipt = receiptById.get(candidate.receiptId);
    const source = sourceById.get(candidate.sourceId);
    assert.ok(receipt, candidate.receiptId);
    assert.ok(source, candidate.sourceId);
    assert.equal(candidate.archivalExcerpt, receipt.excerpt);
    assert.match(candidate.excerptLabel, /^ARCHIVAL CAPTION EXCERPT/);
    assert.match(candidate.editorial.label, /^SUGGESTED EDITORIAL COPY/);
    assert.match(candidate.editWindow.status, /^EDITORIAL WINDOW/);
    assert.ok(Number.isFinite(candidate.receiptAt));
    assert.ok(candidate.editWindow.in <= candidate.receiptAt);
    assert.ok(candidate.editWindow.out > candidate.receiptAt);
    assert.match(candidate.receiptUrl, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.equal(candidate.provenance.receiptId, receipt.id);
    assert.equal(candidate.provenance.sourceId, source.id);
    assert.equal(candidate.approval.humanReviewRequired, true);
  });
});

test("no clip speaker is named and character mappings remain separate context", () => {
  const window = load();
  const { lab } = build(window);
  const ordinary = lab.shorts.filter(
    (candidate) => candidate.characters.length === 0
  );
  const characters = lab.getShorts({
    character: "Dr. Loomis",
    category: "CHARACTER PERFORMANCE"
  });

  assert.ok(ordinary.length > 100);
  ordinary.forEach((candidate) => {
    assert.equal(candidate.speaker.display, null);
    assert.equal(candidate.speaker.creditAllowed, false);
    assert.match(candidate.speaker.basis, /not speaker-diarized/i);
  });

  assert.ok(characters.length >= 3);
  characters.forEach((candidate) => {
    assert.equal(candidate.speaker.display, null);
    assert.equal(candidate.speaker.mappedPerformer, "J");
    assert.equal(candidate.speaker.creditAllowed, false);
    assert.equal(candidate.speaker.clipAttributionCertified, false);
    assert.equal(
      candidate.speaker.status,
      "OWNER-MAPPED CHARACTER / CLIP SPEAKER NOT DIARIZED"
    );
    assert.match(candidate.speaker.basis, /project-owner mapping/i);
    assert.match(candidate.speaker.basis, /individual clip/i);
  });
});

test("topic, character, category, and length filters are precise and composable", () => {
  const window = load();
  const { lab } = build(window);

  const loomis = lab.getShorts({ character: "Loomis", length: "under 30" });
  assert.ok(loomis.length >= 3);
  loomis.forEach((candidate) => {
    assert.ok(candidate.editWindow.seconds <= 30);
    assert.ok(
      candidate.characters.some((character) =>
        character.label.toLowerCase().includes("loomis")
      )
    );
  });

  const fullSend = lab.getShorts({
    category: "FULL SEND",
    length: { min: 20, max: 35 },
    maxRisk: "HIGH",
    limit: 12
  });
  assert.ok(fullSend.length > 0);
  assert.ok(fullSend.length <= 12);
  fullSend.forEach((candidate) => {
    assert.equal(candidate.category, "FULL SEND");
    assert.ok(candidate.editWindow.seconds >= 20);
    assert.ok(candidate.editWindow.seconds <= 35);
    assert.notEqual(candidate.risk.label, "HOLD");
  });

  const topic = lab.facets.topics[0];
  assert.ok(topic);
  const topicResults = lab.getShorts({ topic: topic.value });
  assert.ok(topicResults.length > 0);
  topicResults.forEach((candidate) => {
    assert.ok(
      candidate.topics.some((item) =>
        item.label.toLowerCase().includes(topic.value.toLowerCase())
      )
    );
  });
});

test("risk and maxRisk are identical maximum-risk contracts", () => {
  const window = load();
  const { lab } = build(window);
  const alias = lab.getShorts({ risk: "LOW" });
  const canonical = lab.getShorts({ maxRisk: "LOW" });

  assert.ok(alias.length > 0);
  assert.deepEqual(
    alias.map((candidate) => candidate.id),
    canonical.map((candidate) => candidate.id)
  );
  alias.forEach((candidate) => assert.equal(candidate.risk.label, "LOW"));

  const medium = lab.getShorts({ risk: "MEDIUM" });
  assert.ok(medium.length >= alias.length);
  medium.forEach((candidate) => {
    assert.ok(["LOW", "MEDIUM"].includes(candidate.risk.label));
  });

  const lowSupercuts = lab.getSupercuts({ risk: "LOW" });
  assert.ok(lowSupercuts.length > 0);
  lowSupercuts.forEach((bundle) => {
    assert.equal(bundle.risk.label, "LOW");
    bundle.segments.forEach((segment) => assert.equal(segment.risk.label, "LOW"));
  });
});

test("supercut bundles are source-diverse stories with no false origin claim", () => {
  const window = load();
  const { lab } = build(window);

  lab.supercuts.forEach((bundle) => {
    assert.ok(bundle.segmentCount >= 3);
    assert.ok(bundle.sourceCount >= 2);
    assert.equal(bundle.segments.length, bundle.receiptIds.length);
    assert.equal(new Set(bundle.receiptIds).size, bundle.receiptIds.length);
    assert.match(bundle.editorialLabel, /^SUGGESTED EDITORIAL COPY/);
    assert.match(bundle.storyShape.originClaim, /Earliest in this indexed package only/i);
    bundle.segments.forEach((segment) => {
      assert.match(segment.receiptUrl, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    });
  });

  const characterBundles = lab.getSupercuts({ character: "Loomis" });
  assert.ok(characterBundles.length > 0);
  characterBundles.forEach((bundle) => {
    bundle.segments.forEach((segment) => {
      assert.equal(segment.speaker.display, null);
      assert.equal(segment.speaker.mappedPerformer, "J");
      assert.equal(segment.speaker.creditAllowed, false);
      assert.equal(segment.category, "CHARACTER PERFORMANCE");
      assert.ok(
        segment.characters.some((character) =>
          character.label.toLowerCase().includes("loomis")
        )
      );
    });
  });
  assert.ok(
    characterBundles.some(
      (bundle) =>
        bundle.anchorType === "character" &&
        bundle.anchor.toLowerCase().includes("loomis")
    )
  );
});

test("resurfacing connects exact receipts without inventing take changes or bit origins", () => {
  const window = load();
  const { lab } = build(window);

  lab.resurfacing.forEach((item) => {
    assert.notEqual(item.archive.sourceId, item.current.sourceId);
    assert.ok(item.archive.sourceDate <= item.current.sourceDate);
    assert.equal(item.receiptIds.length, 2);
    assert.match(item.claimBoundary, /does not claim an opinion changed/i);
    assert.match(item.claimBoundary, /true origin/i);
    assert.match(item.archive.receiptUrl, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.match(item.current.receiptUrl, /^https:\/\/www\.youtube\.com\/watch\?v=/);
  });
});

test("campaign packets and clip manifests are deterministic, exportable, and approval-gated", () => {
  const window = load();
  const { lab } = build(window);
  const options = {
    theme: "Loomis Emergency",
    character: "Loomis",
    shortCount: 3,
    supercutCount: 1,
    resurfaceCount: 1,
    maxRisk: "HIGH"
  };
  const first = lab.buildCampaignPacket(options);
  const second = lab.buildCampaignPacket(options);

  assert.deepEqual(plain(first), plain(second));
  assert.match(first.id, /^campaign:/);
  assert.match(first.titleLabel, /^SUGGESTED EDITORIAL COPY/);
  assert.ok(first.assets.shorts.length > 0);
  assert.ok(first.assets.shorts.length <= 3);
  first.assets.supercuts.forEach((bundle) => {
    bundle.segments.forEach((segment) => {
      assert.equal(segment.speaker.display, null);
      assert.equal(segment.speaker.mappedPerformer, "J");
      assert.equal(segment.speaker.creditAllowed, false);
      assert.ok(
        segment.characters.some((character) =>
          character.label.toLowerCase().includes("loomis")
        )
      );
    });
  });
  first.assets.resurfacing.forEach((item) => {
    [item.archive, item.current].forEach((segment) => {
      assert.equal(segment.speaker.display, null);
      assert.equal(segment.speaker.mappedPerformer, "J");
      assert.equal(segment.speaker.creditAllowed, false);
      assert.ok(
        segment.characters.some((character) =>
          character.label.toLowerCase().includes("loomis")
        )
      );
    });
  });
  assert.equal(first.proofLedger.unknownSpeakersNamed, 0);
  assert.equal(first.proofLedger.allClipsTimestamped, true);
  assert.match(first.brief.accuracyBoundary, /does not claim virality/i);

  const manifest = first.manifest;
  assert.equal(manifest.schema, "shokker.creator-clip-manifest/v1");
  assert.equal(manifest.clipCount, manifest.clips.length);
  assert.equal(manifest.publicExcerptWordLimit, 16);
  assert.equal(new Set(manifest.receiptIds).size, manifest.receiptIds.length);
  assert.match(manifest.approvalGate.status, /(HOLD|HUMAN EDIT REVIEW)/);
  manifest.clips.forEach((clip) => {
    const candidate = lab.fromReceipt(clip.receiptId);
    assert.ok(candidate);
    assert.equal(clip.mediaIncluded, false);
    assert.ok(words(clip.archivalExcerpt).length <= 16);
    assert.equal(clip.archivalExcerpt, publicExcerpt(candidate.archivalExcerpt));
    assert.equal(clip.excerptTruncated, words(candidate.archivalExcerpt).length > 16);
    assert.equal(
      clip.originalExcerptWordCount,
      words(candidate.archivalExcerpt).length
    );
    assert.equal(clip.publicExcerptWordLimit, 16);
    assert.match(clip.boundaryStatus, /^EDITORIAL WINDOW/);
    assert.match(clip.editorialCopy.label, /^SUGGESTED EDITORIAL COPY/);
    assert.match(clip.sourceAtReceipt, /^https:\/\/www\.youtube\.com\/watch\?v=/);
  });

  const exported = lab.exportManifest(manifest);
  assert.deepEqual(JSON.parse(exported), plain(manifest));

  const single = lab.createClipManifest(first.assets.shorts[0], {
    name: "Single receipt handoff"
  });
  assert.equal(single.clipCount, 1);
  assert.equal(single.receiptIds[0], first.assets.shorts[0].receiptId);

  const noShorts = lab.buildCampaignPacket({
    theme: "Supercut only",
    shortCount: 0,
    supercutCount: 1,
    resurfaceCount: 0
  });
  assert.equal(noShorts.assets.shorts.length, 0);
  assert.equal(noShorts.assets.resurfacing.length, 0);
  assert.ok(noShorts.assets.supercuts.length <= 1);
});

test("a filtered supercut survives a serialized campaign round trip without widening", () => {
  const window = load();
  const first = build(window).lab;
  const filtered = first
    .getSupercuts({ query: "Halloween" })
    .find((bundle) => {
      const base = first.get(bundle.id.split(":filter:")[0]);
      return base && bundle.segmentCount < base.segmentCount;
    });

  assert.ok(filtered);
  assert.match(filtered.id, /:filter:/);
  const base = first.get(filtered.id.split(":filter:")[0]);
  assert.ok(base.segmentCount > filtered.segmentCount);

  const saved = plain(first.snapshotSelection(filtered));
  assert.equal(saved.receiptIds.length, filtered.segmentCount);
  assert.deepEqual(saved.receiptIds, plain(filtered.receiptIds));
  assert.deepEqual(saved.sourceIds, plain(filtered.sourceIds));

  const reloaded = build(window).lab;
  const restored = reloaded.restoreSelection(JSON.parse(JSON.stringify(saved)));
  assert.ok(restored);
  assert.equal(restored.id, filtered.id);
  assert.equal(restored.segmentCount, filtered.segmentCount);
  assert.deepEqual(plain(restored.receiptIds), plain(filtered.receiptIds));
  assert.deepEqual(plain(restored.sourceIds), plain(filtered.sourceIds));

  const before = first.createClipManifest(filtered, {
    campaignId: "reload-proof",
    name: "Persistence proof"
  });
  const after = reloaded.createClipManifest(restored, {
    campaignId: "reload-proof",
    name: "Persistence proof"
  });
  assert.deepEqual(plain(after), plain(before));

  const tampered = { ...saved, receiptIds: [...saved.receiptIds, base.receiptIds.at(-1)] };
  assert.equal(reloaded.restoreSelection(tampered), null);
});

test("risk gate holds a synthetic unverified performance without a performer", () => {
  const window = load();
  const lab = window.WWAMCreatorClipLab.create({
    sources: [
      {
        id: "source-proof",
        title: "Synthetic source",
        date: "2026-01-01",
        duration: 100,
        captioned: true,
        url: "https://www.youtube.com/watch?v=source-proof"
      }
    ],
    receipts: [
      {
        id: "receipt-proof",
        sourceId: "source-proof",
        sourceTitle: "Synthetic source",
        date: "2026-01-01",
        t: 50,
        url: "https://www.youtube.com/watch?v=source-proof&t=50s",
        type: "character-performance",
        category: "CHARACTER PERFORMANCE",
        excerpt: "hello",
        evidenceLevel: "machine",
        characterId: "character:unknown",
        performer: "",
        score: 90,
        wordCount: 1,
        entityIds: ["character:unknown"]
      }
    ],
    memoryGraph: {
      nodes: [{ id: "character:unknown", type: "character", label: "Unknown Character" }]
    }
  });
  const candidate = lab.shorts[0];

  assert.equal(candidate.speaker.display, null);
  assert.equal(candidate.speaker.creditAllowed, false);
  assert.equal(candidate.risk.label, "HOLD");
  assert.ok(candidate.risk.reasons.includes("do-not-credit-performer-until-verified"));
  assert.equal(candidate.approval.status, "HOLD");
});
