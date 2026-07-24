import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load(files = []) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    ...files
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file
    });
  });
  return sandbox.window;
}

function createBase(window) {
  return window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    dna: window.WWAM_CHANNEL_DNA
  });
}

function serializable(value) {
  return JSON.parse(JSON.stringify(value));
}

test("showcase engine exposes the integration contract and tolerates optional inputs", () => {
  const window = load();
  const first = createBase(window);
  const second = createBase(window);

  assert.equal(window.WWAMShowcaseEngine.VERSION, "1.1.0");
  assert.equal(first.metrics.sources, 49);
  assert.equal(first.metrics.commentaries, 39);
  assert.equal(first.metrics.livestreams, 10);
  assert.equal(first.metrics.popularLivestreams, 0);
  assert.equal(first.metrics.wordsAudited, 953253);
  assert.ok(first.metrics.graphNodes > 50);
  assert.ok(first.metrics.graphEdges > 100);
  assert.ok(first.metrics.timeMachines > 0);
  assert.ok(first.metrics.riffMoments > 0);
  assert.ok(first.metrics.courtCases > 0);
  assert.equal(first.metrics.aftermathReports, 10);

  assert.equal(typeof first.getTimeMachines, "function");
  assert.equal(typeof first.getBitLineages, "function");
  assert.equal(typeof first.getRiffChemistry, "function");
  assert.equal(typeof first.getCourtCases, "function");
  assert.equal(typeof first.buildDescent, "function");
  assert.equal(typeof first.getAftermath, "function");
  assert.equal(typeof first.getControlRoom, "function");

  assert.equal(first.inputFingerprint, second.inputFingerprint);
  assert.deepEqual(serializable(first.metrics), serializable(second.metrics));
  assert.deepEqual(
    serializable(first.getTimeMachines()),
    serializable(second.getTimeMachines())
  );
});

test("all graph and showcase artifacts resolve to timestamped source receipts", () => {
  const window = load();
  const showcase = createBase(window);
  const sourceIds = new Set(showcase.sources.map((source) => source.id));
  const receiptById = new Map(showcase.receipts.map((receipt) => [receipt.id, receipt]));

  assert.equal(receiptById.size, showcase.receipts.length);
  showcase.receipts.forEach((receipt) => {
    assert.ok(sourceIds.has(receipt.sourceId), receipt.id);
    assert.ok(Number.isFinite(receipt.t), receipt.id);
    assert.match(receipt.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
  });

  showcase.memoryGraph.edges.forEach((edge) => {
    assert.ok(edge.receiptIds.length > 0, edge.id);
    edge.receiptIds.forEach((receiptId) => assert.ok(receiptById.has(receiptId), receiptId));
  });

  showcase.getTimeMachines().forEach((timeline) => {
    assert.ok(timeline.milestones.length >= 2);
    timeline.milestones.forEach((milestone) => {
      assert.ok(sourceIds.has(milestone.sourceId));
      assert.ok(receiptById.has(milestone.receiptId));
      assert.ok(Number.isFinite(milestone.t));
    });
  });

  showcase.getRiffChemistry().moments.forEach((moment) => {
    assert.ok(receiptById.has(moment.receiptId));
    assert.ok(sourceIds.has(moment.sourceId));
    assert.ok(Number.isFinite(moment.t));
  });

  showcase.getCourtCases().forEach((court) => {
    assert.ok(court.prosecution.length > 0);
    assert.ok(court.defense.length > 0);
    [...court.prosecution, ...court.defense].forEach((item) => {
      assert.ok(receiptById.has(item.receiptId));
      assert.ok(sourceIds.has(item.sourceId));
      assert.ok(Number.isFinite(item.t));
    });
  });

  showcase.getAftermath().forEach((report) => {
    assert.ok(sourceIds.has(report.sourceId));
    report.clipCandidates.forEach((item) => {
      assert.ok(receiptById.has(item.receiptId));
      assert.equal(item.sourceId, report.sourceId);
      assert.ok(Number.isFinite(item.t));
    });
  });
});

test("Popular 25 and curated character-performance candidates extend the model without special cases", () => {
  const window = load();
  const popular = {
    streams: [
      {
        id: "popular-proof",
        title: "Popular archive proof",
        date: "2025-10-31",
        duration: 7200,
        views: 250000,
        url: "https://www.youtube.com/watch?v=popular-proof",
        captioned: true,
        wordsAudited: 21000,
        topics: [
          {
            name: "Halloween",
            peak: 900,
            mentions: 24,
            receipt: "Halloween is perfect and we love this movie."
          }
        ],
        moments: [
          {
            t: 930,
            quote: "Dr Loomis warned you that Michael is evil and escaped again.",
            category: "BIT ENERGY",
            heat: 93
          }
        ]
      }
    ]
  };
  const characters = {
    characters: [
      {
        id: "character:loomis",
        label: "Dr. Loomis",
        performer: "J",
        receipts: [
          {
            sourceId: "popular-proof",
            t: 930,
            quote: "Dr Loomis warned you that Michael is evil and escaped again.",
            bitId: "bit:loomis-alert",
            evidenceLevel: "curated-candidate",
            curationStatus: "timestamp-validated-human-curated-candidate"
          },
          {
            sourceId: "6VXSBDZ-3WE",
            t: 1200,
            quote: "As Loomis, Michael is evil and the town was warned.",
            bitId: "bit:loomis-alert",
            evidenceLevel: "curated-candidate",
            curationStatus: "timestamp-validated-human-curated-candidate"
          },
          {
            sourceId: "ThPjds8iI9U",
            t: 1600,
            quote: "Doctor Loomis says Michael escaped into the night.",
            bitId: "bit:loomis-alert",
            evidenceLevel: "creator",
            authenticatedEditorVerified: true
          }
        ]
      }
    ]
  };

  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular,
    characters,
    dna: window.WWAM_CHANNEL_DNA
  });

  assert.equal(showcase.metrics.sources, 50);
  assert.equal(showcase.metrics.popularLivestreams, 1);
  assert.equal(showcase.metrics.wordsAudited, 974253);

  const loomis = showcase.characterReadiness.find(
    (character) => character.characterId === "character:loomis"
  );
  assert.equal(loomis.readyForAskCharacter, true);
  assert.equal(loomis.curatedCandidateReceiptIds.length, 3);
  assert.equal(loomis.authenticatedEditorVerifiedReceiptIds.length, 1);

  const lineage = showcase
    .getBitLineages()
    .find((item) => item.bitId === "bit:loomis-alert");
  assert.ok(lineage);
  assert.ok(lineage.performances.length >= 3);
  assert.ok(
    lineage.performances.some(
      (performance) => performance.evidenceLevel === "curated-candidate",
    ),
  );
  lineage.performances.forEach((performance) => {
    assert.ok(performance.sourceId);
    assert.ok(Number.isFinite(performance.t));
    assert.match(performance.url, /[?&]t=\d+s$/);
  });
  assert.deepEqual(
    serializable(showcase.creatorControlRoom.evidenceLevels.map((level) => level.id)),
    ["machine", "curated-candidate", "editor", "creator"],
  );
  assert.match(
    showcase.creatorControlRoom.evidenceLevels[1].meaning,
    /no authenticated editor decision/i,
  );
});

test("legacy confidence flags cannot promote character evidence into curated or authenticated tiers", () => {
  const window = load();
  const characters = {
    characters: [
      {
        id: "character:loomis",
        label: "Dr. Loomis",
        performer: "J",
        status: "grounded",
        receipts: [
          {
            sourceId: "6VXSBDZ-3WE",
            t: 900,
            quote: "A legacy verified flag is not an editorial decision.",
            verified: true
          },
          {
            sourceId: "ThPjds8iI9U",
            t: 1200,
            quote: "A legacy certified flag is not an editorial decision.",
            certified: true
          },
          {
            sourceId: "6VXSBDZ-3WE",
            t: 1500,
            quote: "An editor label alone still requires an authenticated decision.",
            evidenceLevel: "editor"
          },
          {
            sourceId: "ThPjds8iI9U",
            t: 1800,
            quote: "An authentication flag cannot replace a defined evidence tier.",
            authenticatedEditorVerified: true
          }
        ]
      }
    ]
  };

  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters,
    dna: window.WWAM_CHANNEL_DNA
  });

  const loomis = showcase.characterReadiness.find(
    (character) => character.characterId === "character:loomis"
  );
  const receipts = showcase.receipts.filter(
    (receipt) => receipt.characterId === "character:loomis"
  );

  assert.deepEqual(
    serializable(receipts.map((receipt) => receipt.evidenceLevel).sort()),
    ["editor", "machine", "machine", "machine"]
  );
  assert.equal(loomis.curatedCandidateReceiptIds.length, 1);
  assert.deepEqual(serializable(loomis.authenticatedEditorVerifiedReceiptIds), []);
  assert.equal(loomis.readyForAskCharacter, false);
});

test("Personalized Descent is deterministic, playable, and source-diverse", () => {
  const window = load();
  const showcase = createBase(window);
  const request = { mode: "spiral", lane: "fresh-live", limit: 8 };
  const first = showcase.buildDescent(request);
  const second = showcase.buildDescent(request);

  assert.deepEqual(serializable(first), serializable(second));
  assert.equal(first.mode, "spiral");
  assert.ok(first.count > 0);
  assert.ok(first.count <= 8);
  first.stops.forEach((stop, index) => {
    assert.equal(stop.order, index + 1);
    assert.ok(stop.sourceId);
    assert.ok(Number.isFinite(stop.t));
    assert.match(stop.url, /[?&]t=\d+s$/);
  });

  const chemistry = first.stops.map((stop) => stop.chemistry);
  assert.deepEqual(
    serializable(chemistry),
    [...serializable(chemistry)].sort((a, b) => a - b)
  );
});

test("current Popular 25 and Character Lore artifacts satisfy the live integration contract", () => {
  const window = load(["popular-live-distill.js", "character-lore.js"]);
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  });

  assert.equal(showcase.metrics.popularLivestreams, 25);
  assert.ok(showcase.metrics.sources >= 73);
  assert.ok(showcase.metrics.receipts > 800);
  assert.ok(showcase.metrics.wordsAudited > 1_800_000);
  assert.equal(showcase.metrics.bitLineages, 4);

  showcase.characterReadiness.forEach((character) => {
    assert.equal(character.readyForAskCharacter, true, character.character);
    assert.ok(character.curatedCandidateReceiptIds.length >= 3, character.character);
    assert.equal(character.authenticatedEditorVerifiedReceiptIds.length, 0);
  });
  showcase.getBitLineages().forEach((lineage) => {
    assert.ok(lineage.performances.length >= 3, lineage.label);
    lineage.performances.forEach((performance) => {
      assert.ok(performance.sourceId);
      assert.ok(Number.isFinite(performance.t));
      assert.match(performance.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    });
  });
});

test("presentation accessors provide the exact playable shapes consumed by the showcase UI", () => {
  const window = load(["popular-live-distill.js", "character-lore.js"]);
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  });

  assert.equal(showcase.metrics.nodes, showcase.metrics.graphNodes);
  assert.equal(showcase.metrics.edges, showcase.metrics.graphEdges);
  assert.equal(showcase.metrics.timelines, showcase.metrics.timeMachines);
  assert.equal(showcase.metrics.bits, showcase.metrics.bitLineages);

  const timeline = showcase.getTimeMachines()[0];
  assert.ok(timeline.name);
  assert.ok(timeline.events.length >= 2);
  assert.ok(timeline.events[0].sourceId);
  assert.ok(Number.isFinite(timeline.events[0].t));

  const lineage = showcase.getBitLineages()[0];
  assert.ok(lineage.name);
  assert.ok(lineage.events.length >= 3);
  assert.ok(lineage.events[0].source);
  assert.match(lineage.events[0].url, /^https:\/\/www\.youtube\.com\/watch\?v=/);

  const chemistry = showcase.getRiffChemistry();
  assert.ok(chemistry.rankings.length > 0);
  assert.ok(chemistry.rankings[0].sourceId);
  assert.ok(Number.isFinite(chemistry.rankings[0].peak.t));

  const court = showcase.getCourtCases()[0];
  assert.ok(court.title);
  assert.ok(court.prosecution[0].excerpt);
  assert.ok(court.defense[0].excerpt);

  ["CHAOS", "GRUDGES", "LOVE", "LORE"].forEach((mode) => {
    const descent = showcase.buildDescent({ mode, minutes: 20 });
    assert.ok(descent.path.length > 0, mode);
    assert.ok(descent.path[0].sourceId, mode);
    assert.ok(Number.isFinite(descent.path[0].t), mode);
  });

  const aftermath = showcase.getAftermath()[0];
  assert.ok(aftermath.sourceId);
  assert.ok(aftermath.topics.length > 0);
  assert.ok(Array.isArray(aftermath.changes));

  const control = showcase.getControlRoom();
  assert.ok(control.approvals.length > 0);
  assert.ok(control.opportunities.length > 0);
  assert.ok(control.resurfaced.length > 0);
});
