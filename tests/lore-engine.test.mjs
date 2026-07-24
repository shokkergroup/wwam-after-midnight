import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const context = { window: {} };
context.globalThis = context.window;
vm.createContext(context);

for (const file of [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "character-lore.js",
  "lore-engine.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
    filename: file
  });
}

const engine = context.window.WWAMLoreEngine.create({
  catalog: context.window.WWAM_CATALOG,
  deep: context.window.WWAM_DEEP_DISTILL,
  live: context.window.WWAM_LIVESTREAMS,
  popular: context.window.WWAM_POPULAR_LIVE,
  characters: context.window.WWAM_CHARACTER_LORE
});

test("builds a broad field guide from all unique source lanes", () => {
  const expectedSources = new Set([
    ...context.window.WWAM_CATALOG.map((source) => source.id),
    ...context.window.WWAM_LIVESTREAMS.streams.map((source) => source.id),
    ...context.window.WWAM_POPULAR_LIVE.streams.map((source) => source.id)
  ]);

  assert.equal(engine.scope.uniqueSources, expectedSources.size);
  assert.equal(engine.scope.uniqueSources, 74);
  assert.equal(engine.metrics.kinds.source, 74);
  assert.equal(engine.metrics.kinds.character, 4);
  assert.equal(engine.metrics.kinds["candidate-character"], 1);
  assert.equal(engine.metrics.kinds.franchise, 4);
  assert.ok(engine.metrics.kinds.category >= 12);
  assert.ok(engine.metrics.kinds.topic >= 40);
  assert.ok(engine.metrics.kinds.bit >= 15);
  assert.ok(engine.metrics.kinds.motif >= 15);
  assert.ok(engine.metrics.fieldGuideEntries >= 165);
});

test("never upgrades archive-first evidence into a true-origin claim", () => {
  assert.equal(engine.evidencePolicy.trueOriginClaimsMade, 0);
  assert.match(engine.evidencePolicy.originLabel, /INDEXED ARCHIVE/);
  assert.match(engine.evidencePolicy.disclaimer, /not a claim/i);
  assert.ok(engine.lineages.length >= 35);

  for (const lineage of engine.lineages) {
    assert.equal(lineage.trueOriginClaim, false);
    assert.match(lineage.archiveFirstLabel, /EARLIEST IN INDEXED ARCHIVE/);
    assert.match(lineage.disclaimer, /not a claim/i);
    assert.ok(lineage.events.length > 0);
    assert.equal(lineage.events[0].role, "earliest-in-indexed-archive");
  }

  for (const entry of engine.fieldGuide) {
    assert.equal(entry.originLanguage.trueOriginClaim, false);
    assert.match(entry.originLanguage.disclaimer, /not a claim/i);
  }
});

test("character and bit lineages resolve to verified playable receipts", () => {
  const loomis = engine.getEntry("character:loomis");
  const challis = engine.getEntry("character:challis");
  const slender = engine.getEntry("character:slenderman");
  const feldman = engine.getEntry("character:corey-feldman");
  const marky = engine.getEntry("candidate-character:marky-mark");

  assert.equal(loomis.metrics.verifiedPerformances, 7);
  assert.equal(challis.metrics.verifiedPerformances, 7);
  assert.equal(slender.metrics.verifiedPerformances, 6);
  assert.equal(feldman.metrics.verifiedPerformances, 5);
  assert.equal(marky.status, "locked-needs-human-verification");
  assert.equal(marky.confidence, 0);
  assert.match(marky.evidenceBasis, /performer identity/i);

  for (const character of [loomis, challis, slender, feldman]) {
    assert.ok(character.archiveFirst);
    assert.match(character.archiveFirst.url, /^https:\/\/www\.youtube\.com\/watch\?v=.+&t=\d+s$/);
    assert.ok(engine.getLineage(character.id));
    assert.ok(
      engine
        .trace(character.id)
        .edges.some((edge) => ["performed-in", "exhibits-behavior-pattern"].includes(edge.relation))
    );
  }

  const behavior = engine.getFieldGuide({ kind: ["bit"] });
  assert.ok(behavior.every((entry) => entry.details.characterEntryId));
  assert.ok(behavior.every((entry) => entry.receiptIds.length > 0));
  assert.ok(behavior.every((entry) => engine.getLineage(entry.id)));
});

test("all graph evidence resolves and every receipt is playable", () => {
  const nodeIds = new Set(engine.galaxy.nodes.map((node) => node.id));
  const receiptIds = new Set(engine.receipts.map((receipt) => receipt.id));

  assert.equal(nodeIds.size, engine.galaxy.nodes.length);
  assert.equal(receiptIds.size, engine.receipts.length);
  assert.ok(engine.metrics.nodes >= 165);
  assert.ok(engine.metrics.edges >= 500);
  assert.ok(engine.metrics.playableReceipts >= 800);

  for (const receipt of engine.receipts) {
    assert.ok(receipt.sourceId);
    assert.ok(receipt.sourceTitle);
    assert.ok(receipt.t >= 0);
    assert.match(receipt.url, /^https:\/\/www\.youtube\.com\/watch\?v=.+&t=\d+s$/);
    assert.match(receipt.embedUrl, /^https:\/\/www\.youtube\.com\/embed\//);
  }

  for (const edge of engine.galaxy.edges) {
    assert.ok(nodeIds.has(edge.from), `Missing graph node ${edge.from}`);
    assert.ok(nodeIds.has(edge.to), `Missing graph node ${edge.to}`);
    assert.ok(edge.receiptIds.length > 0, `Edge ${edge.id} has no evidence`);
    assert.ok(edge.receiptIds.every((id) => receiptIds.has(id)));
    assert.ok(edge.previewReceipt && receiptIds.has(edge.previewReceipt));
  }
});

test("deep-cut scoring is transparent, bounded, and useful for sorting", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(engine.deepCutModel.weights)),
    {
      archiveRarity: 0.5,
      receiptSpecificity: 0.2,
      archiveAge: 0.15,
      sourceVisibility: 0.15
    }
  );

  for (const entry of engine.fieldGuide) {
    assert.ok(Number.isInteger(entry.deepCutScore));
    assert.ok(entry.deepCutScore >= 0 && entry.deepCutScore <= 100);
    assert.ok(engine.deepCutModel.tiers.includes(entry.deepCutTier));
    assert.ok(entry.deepCutReason);
  }

  const cuts = engine.getFieldGuide({ sort: "deep-cut", limit: 20 });
  for (let index = 1; index < cuts.length; index += 1) {
    assert.ok(cuts[index - 1].deepCutScore >= cuts[index].deepCutScore);
  }
});

test("constellations, discovery prompts, search, and focused traces are UI-ready", () => {
  assert.ok(engine.galaxy.constellations.length >= 18);
  assert.ok(engine.discoveryPrompts.length >= 20);

  const nodeIds = new Set(engine.galaxy.nodes.map((node) => node.id));
  for (const constellation of engine.galaxy.constellations) {
    assert.ok(nodeIds.has(constellation.anchorNodeId));
    assert.ok(constellation.nodeIds.includes(constellation.anchorNodeId));
    assert.ok(constellation.edgeIds.length > 0);
    assert.ok(constellation.receiptIds.length > 0);
  }
  for (const prompt of engine.discoveryPrompts) {
    assert.ok(prompt.prompt.length > 20);
    assert.ok(prompt.payoff);
    assert.ok(prompt.targetIds.every((id) => nodeIds.has(id)));
  }

  const wolfPack = engine.search("wolf pack", { limit: 10 });
  assert.ok(wolfPack.some((entry) => entry.id === "character:corey-feldman"));
  assert.ok(wolfPack.some((entry) => entry.kind === "motif"));

  const halloween = engine.search("Halloween", { limit: 10 });
  assert.ok(halloween.some((entry) => entry.id === "franchise:halloween"));

  const focused = engine.getGalaxy({ focus: "character:loomis", depth: 2, limit: 60 });
  assert.equal(focused.center.id, "character:loomis");
  assert.ok(focused.nodes.length > 5);
  assert.ok(focused.edges.length > 5);
  assert.ok(focused.receipts.length > 5);
});
