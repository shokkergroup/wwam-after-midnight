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
    ...context.window.WWAM_POPULAR_LIVE.streams.map((source) => source.id),
    ...context.window.WWAM_CHARACTER_LORE.characters.flatMap((character) =>
      [...character.soundbytes, ...character.creatorContext].map((receipt) => receipt.sourceId)
    ),
    ...context.window.WWAM_CHARACTER_LORE.lockedCandidates.flatMap((candidate) =>
      candidate.soundbytes.map((receipt) => receipt.sourceId)
    )
  ]);

  assert.equal(engine.scope.uniqueSources, expectedSources.size);
  assert.equal(engine.scope.uniqueSources, 97);
  assert.equal(engine.metrics.kinds.source, 97);
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

test("character and bit lineages resolve to timestamp-validated curated candidates", () => {
  const loomis = engine.getEntry("character:loomis");
  const challis = engine.getEntry("character:challis");
  const slender = engine.getEntry("character:slenderman");
  const feldman = engine.getEntry("character:corey-feldman");
  const marky = engine.getEntry("candidate-character:marky-mark");

  assert.equal(loomis.metrics.curatedPerformanceCandidates, 15);
  assert.equal(challis.metrics.curatedPerformanceCandidates, 15);
  assert.equal(slender.metrics.curatedPerformanceCandidates, 15);
  assert.equal(feldman.metrics.curatedPerformanceCandidates, 15);
  assert.equal(marky.status, "locked-needs-human-verification");
  assert.equal(marky.confidence, 0);
  assert.match(marky.evidenceBasis, /performer identity/i);

  const expectedArchiveFirst = new Map([
    [loomis.id, "2022-08-20"],
    [challis.id, "2022-07-20"],
    [slender.id, "2021-04-24"],
    [feldman.id, "2025-05-25"]
  ]);

  for (const character of [loomis, challis, slender, feldman]) {
    assert.ok(character.archiveFirst);
    assert.equal(character.archiveFirst.date, expectedArchiveFirst.get(character.id));
    assert.match(character.archiveFirst.url, /^https:\/\/www\.youtube\.com\/watch\?v=.+&t=\d+s$/);
    assert.ok(character.performanceReceiptIds.includes(character.archiveFirst.receiptId));
    assert.ok(!character.contextReceiptIds.includes(character.archiveFirst.receiptId));
    assert.equal(
      new Set([...character.performanceReceiptIds, ...character.contextReceiptIds]).size,
      character.receiptIds.length
    );
    assert.ok(
      character.performanceReceiptIds.every(
        (receiptId) => engine.getReceipt(receiptId).kind === "character-performance"
      )
    );
    assert.ok(
      character.contextReceiptIds.every(
        (receiptId) => engine.getReceipt(receiptId).kind === "creator-context"
      )
    );
    const lineage = engine.getLineage(character.id);
    assert.ok(lineage);
    assert.equal(lineage.evidenceCount, character.performanceReceiptIds.length);
    assert.ok(
      lineage.events.every((event) => character.performanceReceiptIds.includes(event.receiptId))
    );
    assert.ok(
      engine
        .trace(character.id)
        .edges.some((edge) => ["performed-in", "exhibits-behavior-pattern"].includes(edge.relation))
    );
  }

  assert.equal(loomis.contextReceiptIds.length, 1);
  assert.equal(challis.contextReceiptIds.length, 2);
  assert.equal(slender.contextReceiptIds.length, 1);
  assert.equal(feldman.contextReceiptIds.length, 0);

  const behavior = engine.getFieldGuide({ kind: ["bit"] });
  assert.ok(behavior.every((entry) => entry.details.characterEntryId));
  assert.ok(behavior.every((entry) => entry.receiptIds.length > 0));
  assert.ok(behavior.every((entry) => engine.getLineage(entry.id)));
});

test("character-to-source edges keep performance and creator context semantically distinct", () => {
  const performanceRelations = new Set(["performed-in", "candidate-performance-in"]);
  const characterSourceEdges = engine.galaxy.edges.filter(
    (edge) =>
      (edge.from.startsWith("character:") || edge.from.startsWith("candidate-character:")) &&
      edge.to.startsWith("source:")
  );
  const contextEdges = characterSourceEdges.filter(
    (edge) => edge.relation === "creator-context-in"
  );

  assert.equal(contextEdges.length, 3);
  assert.ok(characterSourceEdges.some((edge) => performanceRelations.has(edge.relation)));

  for (const edge of characterSourceEdges) {
    const kinds = edge.receiptIds.map((receiptId) => engine.getReceipt(receiptId).kind);
    if (performanceRelations.has(edge.relation)) {
      assert.ok(
        kinds.every((kind) =>
          ["character-performance", "candidate-performance"].includes(kind)
        )
      );
      assert.ok(!kinds.includes("creator-context"));
    } else if (edge.relation === "creator-context-in") {
      assert.ok(kinds.every((kind) => kind === "creator-context"));
      assert.match(edge.note, /not performance candidates/i);
    } else {
      assert.fail(`Unexpected character-to-source relation: ${edge.relation}`);
    }
  }
});

test("machine-only or non-exact soundbytes cannot become performance archive-first", () => {
  const characterLore = JSON.parse(JSON.stringify(context.window.WWAM_CHARACTER_LORE));
  const loomis = characterLore.characters.find((character) => character.id === "loomis");
  loomis.soundbytes.push({
    ...loomis.soundbytes[0],
    id: "loomis-machine-only-early-candidate",
    date: "2016-01-01",
    t: 1,
    excerpt: "Machine-only early candidate.",
    provenance: {
      ...loomis.soundbytes[0].provenance,
      timestampStatus: "caption-window",
      selection: "machine candidate"
    }
  });

  const conservativeEngine = context.window.WWAMLoreEngine.create({
    catalog: context.window.WWAM_CATALOG,
    deep: context.window.WWAM_DEEP_DISTILL,
    live: context.window.WWAM_LIVESTREAMS,
    popular: context.window.WWAM_POPULAR_LIVE,
    characters: characterLore
  });
  const conservativeLoomis = conservativeEngine.getEntry("character:loomis");

  assert.equal(conservativeLoomis.performanceReceiptIds.length, 15);
  assert.equal(conservativeLoomis.archiveFirst.date, "2022-08-20");
  assert.ok(
    !conservativeLoomis.performanceReceiptIds.some(
      (receiptId) =>
        conservativeEngine.getReceipt(receiptId).quote === "Machine-only early candidate."
    )
  );

  loomis.soundbytes = [loomis.soundbytes.at(-1)];
  const contextOnlyEngine = context.window.WWAMLoreEngine.create({
    catalog: context.window.WWAM_CATALOG,
    deep: context.window.WWAM_DEEP_DISTILL,
    live: context.window.WWAM_LIVESTREAMS,
    popular: context.window.WWAM_POPULAR_LIVE,
    characters: characterLore
  });
  const contextOnlyLoomis = contextOnlyEngine.getEntry("character:loomis");

  assert.equal(contextOnlyLoomis.performanceReceiptIds.length, 0);
  assert.equal(contextOnlyLoomis.contextReceiptIds.length, 1);
  assert.equal(contextOnlyLoomis.archiveFirst, null);
  assert.equal(contextOnlyEngine.getLineage("character:loomis"), null);
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
