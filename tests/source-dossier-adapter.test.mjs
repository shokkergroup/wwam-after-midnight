import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
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
    "archive-atlas-data.js",
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "source-query-engine.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

function buildFixture() {
  const window = load();
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const archiveDeep = window.WWAMArchiveDeepPortfolio.create(
    [
      window.WWAM_ARCHIVE_DEEP,
      window.WWAM_ARCHIVE_DEEP_BATCH2,
      window.WWAM_ARCHIVE_DEEP_BATCH3,
      window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    window.WWAMArchiveDeepEngine,
  );
  const input = {
    atlas: window.WWAM_ARCHIVE_ATLAS,
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: archiveDeep,
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:test-fixture",
    },
  };
  return {
    window,
    showcase,
    clipLab,
    archiveDeep,
    input,
    result: window.WWAMSourceDossierAdapter.build(input),
  };
}

function byId(result, id) {
  const source = result.sources.find((item) => item.id === id);
  assert.ok(source, id);
  return source;
}

function countBy(values, field) {
  return values.reduce((counts, value) => {
    counts[value[field]] = (counts[value[field]] || 0) + 1;
    return counts;
  }, {});
}

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

test("adapter exposes the universal schema and exact 510-source WWAM union", () => {
  const { window, result } = buildFixture();

  assert.equal(window.WWAMSourceDossierAdapter.VERSION, "1.1.0");
  assert.deepEqual(Object.keys(result), [
    "schema",
    "channel",
    "snapshotDate",
    "sources",
  ]);
  assert.equal(result.schema, "shokker-source-dossier-input/v1");
  assert.deepEqual(plain(result.channel), {
    id: "wwam",
    label: "We Watched A Movie",
    product: "WWAM After Midnight",
    packFingerprint: "fnv1a32:test-fixture",
  });
  assert.equal(result.snapshotDate, "2026-07-23");
  assert.equal(result.sources.length, 510);
  assert.equal(new Set(result.sources.map((source) => source.id)).size, 510);

  assert.equal(
    result.sources.filter((source) => source.lanes.includes("streams-feed")).length,
    472,
  );
  assert.equal(
    result.sources.filter((source) => source.lanes.includes("commentary-catalog")).length,
    39,
  );
  assert.deepEqual(
    plain(byId(result, "3wK00_-K-Y0").lanes),
    ["commentary-catalog", "streams-feed"],
  );
  assert.deepEqual(countBy(result.sources, "coverage"), {
    "caption-backed": 111,
    "caption-limited": 9,
    "metadata-only": 390,
  });
  assert.deepEqual(countBy(result.sources, "authority"), {
    "promoted-lane": 74,
    "source-only": 396,
    "quarantined-lane": 40,
  });
});

test("Ask This Tape stays on the exact canonical WWAM upload across title collisions and evidence gaps", () => {
  const { window, result } = buildFixture();
  const dossierEngine = window.ShokkerSourceDossier.create(result);
  const queryEngine = window.ShokkerSourceQuery.create({ dossierEngine });
  const request = (sourceId, query) => ({
    schema: "shokker-source-query/v1",
    sourceId,
    query,
    limit: 8,
  });

  const loomis = queryEngine.answer(
    request("LV2rmwEA0w4", "Show me the Dr. Loomis moments in this tape."),
  );
  assert.equal(loomis.status, "supported");
  assert.ok(loomis.results.every((item) => item.sourceId === "LV2rmwEA0w4"));
  assert.deepEqual(
    plain(
      loomis.results
        .filter((item) => item.type === "receipt")
        .map((item) => [item.key, item.at, item.end]),
    ),
    [
      ["character-receipt:loomis-funding", 9042.64, 9056.64],
      ["character-receipt:loomis-pepto", 10734.88, 10748.88],
    ],
  );

  const challis = queryEngine.answer(
    request("ag3axSC9BpU", "Show me the Dr. Challis moments in this tape."),
  );
  assert.equal(challis.status, "supported");
  assert.ok(challis.results.every((item) => item.sourceId === "ag3axSC9BpU"));
  assert.deepEqual(
    plain(
      challis.results
        .filter((item) => item.type === "receipt")
        .map((item) => [item.key, item.at]),
    ),
    [
      ["character-receipt:challis-miguel", 3860.72],
      ["character-receipt:challis-doctor", 9851.76],
    ],
  );

  const metadataOnly = queryEngine.answer(
    request("FVuwRHM0kcc", "Who won the Marvel versus DC bracket?"),
  );
  assert.equal(metadataOnly.status, "metadata-only");
  assert.equal(metadataOnly.resultCount, 0);

  const captionLimited = queryEngine.answer(
    request("x6tvsGRHgU0", "What topics are indexed in this tape?"),
  );
  assert.equal(captionLimited.status, "caption-limited");
  assert.equal(captionLimited.resultCount, 0);

  const wrongSource = queryEngine.answer(
    request("uA5lTCjk7sQ", "Show me Superman receipts."),
  );
  assert.equal(wrongSource.status, "metadata-only");
  assert.equal(wrongSource.resultCount, 0);
  assert.equal(wrongSource.boundary.crossSourceSubstitution, false);
});

test("all dossiers retain canonical metadata and fail honest outside caption evidence", () => {
  const { result, window } = buildFixture();
  const receiptKeys = new Set();
  const evidenceTypes = new Set([
    "caption-excerpt",
    "caption-topic-receipt",
    "caption-topic-navigation",
    "caption-character-signal",
    "caption-character-context",
    "curated-character-performance",
  ]);
  const entityBases = new Set(window.ShokkerSourceDossier.ENTITY_BASIS);

  result.sources.forEach((source) => {
    assert.ok(source.id);
    assert.ok(source.title);
    assert.ok(source.displayTitle);
    assert.match(source.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(source.duration) && source.duration >= 0);
    assert.ok(Number.isFinite(source.views) && source.views >= 0);
    assert.ok(source.thumbnail.includes(source.id));
    assert.equal(source.url, `https://www.youtube.com/watch?v=${source.id}`);
    assert.ok(Array.isArray(source.lanes) && source.lanes.length > 0);
    assert.ok(Array.isArray(source.artifacts));
    assert.equal(source.rightsPolicy.promotionAllowed, false);
    assert.equal(source.rightsPolicy.speakerClaimsAllowed, false);
    assert.equal(source.rightsPolicy.originClaimsAllowed, false);
    assert.equal(source.rightsPolicy.visualClaimsAllowed, false);

    if (source.coverage === "metadata-only" ||
        source.coverage === "caption-limited") {
      assert.equal(source.summary, null, source.id);
      assert.equal(source.receipts.length, 0, source.id);
      assert.equal(source.metrics.receiptCount, 0, source.id);
      assert.equal(source.metrics.heatSegments, 0, source.id);
    }

    source.receipts.forEach((receipt) => {
      assert.ok(receipt.key, source.id);
      assert.ok(!receiptKeys.has(receipt.key), receipt.key);
      receiptKeys.add(receipt.key);
      assert.ok(receipt.at >= 0 && receipt.at <= source.duration, receipt.key);
      assert.ok(
        receipt.end === null ||
        (receipt.end >= receipt.at && receipt.end <= source.duration),
        receipt.key,
      );
      assert.ok(wordCount(receipt.excerpt) <= 16, receipt.key);
      assert.equal(receipt.speaker, null);
      assert.equal(receipt.speakerStatus, "not-diarized");
      assert.equal(receipt.promotionAllowed, false);
      assert.ok(receipt.evidenceBasis);
      assert.ok(Array.isArray(receipt.entityIds));
      assert.ok(evidenceTypes.has(receipt.evidenceType), receipt.evidenceType);
      assert.ok(receipt.entityIds.every(
        (entityId) => /^[a-z0-9][a-z0-9:_-]{1,159}$/.test(entityId),
      ));
    });
    source.entities.forEach((entity) => {
      assert.ok(entityBases.has(entity.basis), entity.basis);
    });
  });
  assert.equal(receiptKeys.size, 1490);
});

test("the 1,490 receipts retain the exact evidence taxonomy", () => {
  const { result } = buildFixture();
  const receipts = result.sources.flatMap((source) => source.receipts);

  assert.equal(receipts.length, 1490);
  assert.deepEqual(countBy(receipts, "evidenceType"), {
    "caption-excerpt": 701,
    "caption-topic-receipt": 592,
    "curated-character-performance": 25,
    "caption-character-context": 28,
    "caption-character-signal": 24,
    "caption-topic-navigation": 120,
  });
});

test("all 25 human-curated character clips retain their exact 14-second bounds", () => {
  const { result, window } = buildFixture();
  const soundbytes = window.WWAM_CHARACTER_LORE.characters.flatMap(
    (character) => character.soundbytes,
  );

  assert.equal(soundbytes.length, 25);
  soundbytes.forEach((soundbyte) => {
    const receipt = byId(result, soundbyte.sourceId).receipts.find(
      (candidate) => candidate.key === `character-receipt:${soundbyte.id}`,
    );

    assert.ok(receipt, soundbyte.id);
    assert.equal(receipt.at, soundbyte.t, soundbyte.id);
    assert.equal(receipt.at, soundbyte.playback.start, soundbyte.id);
    assert.equal(receipt.end, soundbyte.playback.end, soundbyte.id);
    assert.equal(receipt.end - receipt.at, 14, soundbyte.id);
    assert.equal(
      receipt.evidenceType,
      "curated-character-performance",
      soundbyte.id,
    );
    assert.equal(receipt.evidenceBasis, "exact-showcase-receipt", soundbyte.id);
  });

  const funding = byId(result, "LV2rmwEA0w4").receipts.find(
    (receipt) => receipt.key === "character-receipt:loomis-funding",
  );
  assert.equal(funding.at, 9042.64);
  assert.equal(funding.end, 9056.64);
});

test("promoted sources use exact Showcase receipts and exact creator memberships", () => {
  const { result, showcase } = buildFixture();
  const live = byId(result, "LV2rmwEA0w4");
  const exactReceiptKeys = showcase.receipts
    .filter((receipt) => receipt.sourceId === live.id)
    .map((receipt) => receipt.id)
    .sort();

  assert.equal(live.coverage, "caption-backed");
  assert.equal(live.authority, "promoted-lane");
  assert.equal(live.sourceType, "livestream");
  assert.equal(live.receipts.length, 21);
  assert.deepEqual(
    live.receipts.map((receipt) => receipt.key).sort(),
    exactReceiptKeys,
  );
  assert.ok(live.receipts.every(
    (receipt) => receipt.evidenceBasis === "exact-showcase-receipt",
  ));
  assert.equal(live.metrics.momentReceipts, 7);
  assert.equal(live.metrics.topicReceipts, 8);
  assert.equal(live.metrics.characterReceipts, 6);
  assert.equal(live.metrics.heatSegments, 30);

  assert.equal(live.artifacts.length, 27);
  assert.deepEqual(
    countBy(live.artifacts, "kind"),
    {
      "bit-lineage": 4,
      "creator-resurfacing": 4,
      "creator-short": 13,
      "creator-supercut": 6,
    },
  );
  assert.deepEqual(
    {
      shorts: live.metrics.shorts,
      supercuts: live.metrics.supercuts,
      resurfacing: live.metrics.resurfacing,
      bitLineages: live.metrics.bitLineages,
    },
    { shorts: 13, supercuts: 6, resurfacing: 4, bitLineages: 4 },
  );
  live.artifacts.forEach((artifact) => {
    assert.equal(artifact.promotionAllowed, false);
    assert.match(artifact.reviewState, /review-only$/);
    assert.ok(["creator-draft", "editor-review"].includes(artifact.authority));
  });
  assert.ok(live.artifacts
    .filter((artifact) => artifact.kind.startsWith("creator-"))
    .every((artifact) => artifact.creatorDraft));
  assert.ok(live.entities.some(
    (entity) =>
      entity.id === "character:loomis" &&
      entity.basis === "timestamped-receipt" &&
      entity.receiptKeys.length > 0,
  ));

  const commentary = byId(result, "6VXSBDZ-3WE");
  assert.equal(commentary.sourceType, "commentary");
  assert.equal(commentary.displayTitle, "Halloween (1978)");
  assert.equal(commentary.receipts.length, 8);
  assert.equal(commentary.metrics.captionMinutes, 93);
  assert.equal(commentary.metrics.unhinged, 70);
  assert.ok(commentary.entities.some(
    (entity) =>
      entity.id === "film:halloween-1978" &&
      entity.basis === "timestamped-receipt",
  ));

  const popular = byId(result, "jG93HvyP420");
  assert.equal(popular.authority, "promoted-lane");
  assert.ok(popular.receipts.length > 10);
  assert.ok(popular.receipts.every(
    (receipt) => receipt.evidenceBasis === "exact-showcase-receipt",
  ));
});

test("sealed and metadata-only fixtures never inherit unsafe semantic copy", () => {
  const { result } = buildFixture();

  for (const id of ["AzrcgoyE7C4", "x6tvsGRHgU0", "cQAVmNFQmoI"]) {
    const source = byId(result, id);
    assert.equal(source.coverage, "caption-limited");
    assert.equal(source.summary, null);
    assert.equal(source.receipts.length, 0);
    assert.equal(source.metrics.receiptCount, 0);
  }

  const sealed = byId(result, "AzrcgoyE7C4");
  assert.equal(sealed.availability, "needs_auth");
  assert.equal(sealed.displayTitle, "Rob Zombie's Halloween II");
  assert.ok(sealed.entities.some(
    (entity) =>
      entity.id === "franchise:halloween" &&
      entity.basis === "cached-title-alias" &&
      entity.receiptKeys.length === 0,
  ));

  const metadata = byId(result, "__bkfXziVXA");
  assert.equal(metadata.coverage, "metadata-only");
  assert.equal(metadata.authority, "source-only");
  assert.equal(metadata.summary, null);
  assert.deepEqual(plain(metadata.receipts), []);
  assert.equal(metadata.metrics.captionCoveragePercent, null);
  assert.equal(metadata.metrics.unhinged, null);
  assert.deepEqual(
    plain(metadata.entities.map(
      (entity) => [entity.id, entity.basis, entity.receiptKeys],
    )),
    [["franchise:scream", "cached-title-alias", []]],
  );
  assert.ok(metadata.warnings.some((warning) => /METADATA ONLY/.test(warning)));
});

test("Archive Deep remains quarantined and all 12 source-audio firewalls are topic-only", () => {
  const { result } = buildFixture();
  const archive = result.sources.filter(
    (source) => source.authority === "quarantined-lane",
  );
  const archiveReceipts = archive.flatMap((source) => source.receipts);
  const characterEvidence = archiveReceipts.filter(
    (receipt) => receipt.evidenceType.startsWith("caption-character-"),
  );
  const restricted = archive.filter(
    (source) => source.rightsPolicy.restrictedToTopicNavigation,
  );

  assert.equal(archive.length, 40);
  assert.equal(restricted.length, 12);
  assert.equal(
    archiveReceipts.filter(
      (receipt) => receipt.evidenceType === "curated-character-performance",
    ).length,
    0,
  );
  assert.equal(characterEvidence.length, 52);
  assert.deepEqual(countBy(characterEvidence, "evidenceType"), {
    "caption-character-context": 28,
    "caption-character-signal": 24,
  });
  assert.ok(characterEvidence.every(
    (receipt) =>
      receipt.evidenceLevel === "machine" &&
      receipt.reviewState === "quarantined-machine-candidate" &&
      receipt.evidenceBasis === "archive-deep-quarantined-candidate",
  ));
  assert.ok(archive.every(
    (source) =>
      source.coverage === "caption-backed" &&
      source.rightsPolicy.promotionAllowed === false,
  ));
  restricted.forEach((source) => {
    assert.equal(source.receipts.length, 10, source.id);
    assert.ok(source.receipts.every(
      (receipt) =>
        receipt.kind === "topic-navigation" &&
        receipt.evidenceType === "caption-topic-navigation" &&
        receipt.excerpt === "" &&
        receipt.publicExcerptAllowed === false &&
        receipt.reviewState === "quarantined-topic-navigation",
    ));
    assert.equal(source.metrics.topicReceipts, 10);
    assert.equal(source.metrics.momentReceipts, 0);
    assert.equal(source.metrics.characterReceipts, 0);
    assert.equal(source.metrics.heatSegments, 0);
    assert.equal(source.metrics.publicExcerptReceipts, 0);
  });

  const firewall = byId(result, "fpNtQMexZiw");
  assert.equal(firewall.receipts.length, 10);
  assert.ok(firewall.warnings.some((warning) => /TOPIC NAVIGATION ONLY/.test(warning)));

  const candidate = byId(result, "CFUHyfcJDTg");
  assert.equal(candidate.rightsPolicy.restrictedToTopicNavigation, false);
  assert.equal(candidate.metrics.topicReceipts, 10);
  assert.equal(candidate.metrics.momentReceipts, 7);
  assert.equal(candidate.metrics.characterReceipts, 1);
  assert.equal(candidate.metrics.heatSegments, 30);
  assert.ok(candidate.receipts.every((receipt) => receipt.promotionAllowed === false));
});

test("normalization is deterministic across reversed source and artifact input order", () => {
  const fixture = buildFixture();
  const { window, input, showcase, clipLab, archiveDeep, result } = fixture;
  const reversedShowcase = {
    sources: showcase.sources.slice().reverse(),
    receipts: showcase.receipts.slice().reverse(),
    memoryGraph: {
      nodes: showcase.memoryGraph.nodes.slice().reverse(),
      edges: showcase.memoryGraph.edges.slice().reverse(),
      stats: showcase.memoryGraph.stats,
    },
    takeTimeMachines: showcase.takeTimeMachines.slice().reverse(),
    bitAncestry: showcase.bitAncestry.slice().reverse(),
  };
  const reversedClipLab = {
    shorts: clipLab.shorts.slice().reverse(),
    supercuts: clipLab.supercuts.slice().reverse(),
    resurfacing: clipLab.resurfacing.slice().reverse(),
  };
  const archivePayload = archiveDeep.getSearchPayload();
  const reversed = window.WWAMSourceDossierAdapter.build({
    ...input,
    atlas: {
      ...plain(input.atlas),
      records: plain(input.atlas.records).reverse(),
    },
    catalog: plain(input.catalog).reverse(),
    deep: {
      ...plain(input.deep),
      tapes: plain(input.deep.tapes).reverse(),
    },
    live: {
      ...plain(input.live),
      streams: plain(input.live.streams).reverse(),
    },
    popular: {
      ...plain(input.popular),
      streams: plain(input.popular.streams).reverse(),
    },
    archiveDeepPortfolio: null,
    archiveDeep: {
      ...archivePayload,
      streams: plain(archivePayload.streams).reverse(),
    },
    showcase: reversedShowcase,
    clipLab: reversedClipLab,
  });

  assert.deepEqual(plain(reversed), plain(result));
});

test("the exact 510-source adapter payload compiles through the generic engine", () => {
  const { window, result } = buildFixture();
  const engine = window.ShokkerSourceDossier.create(result);
  const stats = plain(engine.getStats());

  assert.equal(stats.sources, 510);
  assert.deepEqual(stats.coverage, {
    "caption-backed": 111,
    "caption-limited": 9,
    "metadata-only": 390,
  });
  assert.deepEqual(stats.authority, {
    "promoted-lane": 74,
    "source-only": 396,
    "quarantined-lane": 40,
  });
  assert.equal(stats.receipts, 1490);
  assert.equal(stats.artifacts, 928);

  const live = engine.build("LV2rmwEA0w4");
  assert.equal(live.source.receipts.length, 21);
  assert.equal(live.source.artifacts.length, 27);
  assert.equal(live.wake.total, 138);
  assert.equal(live.wake.matchingTotal, 138);
  assert.equal(live.wake.displayed, 16);
  assert.equal(live.wake.truncated, true);
  assert.equal(live.wake.later.length, 0);
  assert.equal(live.wake.earlier.length, 16);
  assert.ok(live.wake.earlier.every(
    (connection) => connection.basis === "receipt-backed-entity",
  ));
  assert.equal(live.wake.earlier[0].sourceId, "ag3axSC9BpU");
  assert.ok(live.wake.earlier[0].sharedEntities.some(
    (entity) => entity.id === "character:loomis",
  ));
  assert.ok(live.wake.earlier[0].artifactIds.includes(
    "ancestry:bit-loomis-alert",
  ));

  result.sources.forEach((source) => {
    const dossier = engine.build(source.id);
    assert.equal(dossier.wake.total, dossier.wake.matchingTotal, source.id);
    assert.equal(
      dossier.wake.displayed,
      dossier.wake.later.length + dossier.wake.earlier.length,
      source.id,
    );
    assert.ok(dossier.wake.displayed <= 16, source.id);
    assert.equal(
      dossier.wake.truncated,
      dossier.wake.matchingTotal > dossier.wake.displayed,
      source.id,
    );
  });
});

test("adapter fails closed if the feed/catalog reconciliation drifts", () => {
  const fixture = buildFixture();
  const brokenAtlas = plain(fixture.input.atlas);
  brokenAtlas.records = brokenAtlas.records.slice(1);

  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      atlas: brokenAtlas,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "SOURCE_COUNT_INVALID",
  );
});

test("adapter fails closed when canonical Archive Deep or Showcase proof is missing", () => {
  const fixture = buildFixture();

  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      archiveDeepPortfolio: null,
      archiveDeep: null,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "ARCHIVE_DEEP_COUNT_INVALID",
  );
  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      showcase: null,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "SHOWCASE_REQUIRED",
  );
  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      clipLab: null,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "SHOWCASE_ARTIFACT_PROOF_INCOMPLETE",
  );
  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      characters: null,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "CURATED_RECEIPT_BOUND_MISSING",
  );
});
