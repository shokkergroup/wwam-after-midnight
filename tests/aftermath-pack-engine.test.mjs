import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const SOURCE_ID = "LV2rmwEA0w4";
const SOURCE_BRIEF_ID = "PiE4V15_j6I";
const aftermathSource = fs.readFileSync(path.join(demo, "aftermath-pack-engine.js"), "utf8");

function internalFunction(name, nextName) {
  const start = aftermathSource.indexOf(`  function ${name}(`);
  const end = aftermathSource.indexOf(`\n\n  function ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `${name} internal function boundary is missing`);
  return aftermathSource.slice(start, end);
}

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
    "cold-open-engine.js",
    "archive-atlas-data.js",
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "episode-guides.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "aftermath-pack-engine.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

function fixture() {
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
  const coldOpen = window.WWAMColdOpenFactory.create({ clipLab });
  const archiveDeep = window.WWAMArchiveDeepPortfolio.create(
    [
      window.WWAM_ARCHIVE_DEEP,
      window.WWAM_ARCHIVE_DEEP_BATCH2,
      window.WWAM_ARCHIVE_DEEP_BATCH3,
      window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    window.WWAMArchiveDeepEngine,
  );
  const payload = window.WWAMSourceDossierAdapter.build({
    atlas: window.WWAM_ARCHIVE_ATLAS,
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: archiveDeep,
    episodeGuides: window.WWAM_EPISODE_GUIDES,
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:aftermath-test",
    },
  });
  const dossierEngine = window.ShokkerSourceDossier.create(payload);
  const engine = window.ShokkerAftermathPack.create({
    dossierEngine,
    clipLab,
    showcase,
    coldOpen,
  });
  return { window, showcase, clipLab, coldOpen, dossierEngine, engine };
}

const built = fixture();

function createEngine(overrides = {}) {
  return built.window.ShokkerAftermathPack.create({
    dossierEngine: overrides.dossierEngine || built.dossierEngine,
    clipLab: overrides.clipLab || built.clipLab,
    showcase: overrides.showcase || built.showcase,
    coldOpen: overrides.coldOpen || built.coldOpen,
  });
}

function mutatedColdOpen(mutate) {
  const coldOpen = plain(built.coldOpen);
  const board = coldOpen.storyboards.find((item) => item.sourceIds.includes(SOURCE_ID));
  const slot = board.slots.find(
    (item) => item.kind === "source-clip" && item.sourceId === SOURCE_ID,
  );
  assert.ok(slot);
  mutate(slot);
  return coldOpen;
}

test("universal timestamp links recompute their separator after replacing an old time", () => {
  const timestampUrl = vm.runInNewContext(
    `(() => {
      function clean(value) { return String(value == null ? "" : value).trim(); }
      function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
      ${internalFunction("timestampUrl", "sameStrings")}
      return timestampUrl;
    })()`,
  );
  assert.equal(
    timestampUrl("https://youtu.be/ABCDEFGHIJK?t=12", 90),
    "https://youtu.be/ABCDEFGHIJK?t=90s",
  );
  assert.equal(
    timestampUrl("https://www.youtube.com/watch?v=ABCDEFGHIJK&t=12", 90),
    "https://www.youtube.com/watch?v=ABCDEFGHIJK&t=90s",
  );
});

test("July 23 Aftermath Pack joins the exact 23 production opportunities without inflating research or storyboards", () => {
  const first = built.engine.build(SOURCE_ID);
  const second = built.engine.build(SOURCE_ID);

  assert.equal(first.schema, "shokker.aftermath-pack/v1");
  assert.equal(first.version, "1.0.0");
  assert.equal(first.source.id, SOURCE_ID);
  assert.equal(first.source.date, "2026-07-23");
  assert.equal(first.source.duration, 12785);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(plain(first.metrics), {
    opportunities: 23,
    shorts: 13,
    supercutMemberships: 6,
    resurfacingPairs: 4,
    clipReady: 3,
    fastReview: 3,
    archiveExpansion: 9,
    researchQueue: 1,
    quarantined: 7,
    referenceThreads: 4,
    coldOpenStoryboards: 9,
    sourceReceipts: 21,
    registeredArtifactMemberships: 27,
  });
  assert.equal(first.opportunities.length, 23);
  assert.equal(first.research.length, 4);
  assert.equal(first.storyboards.length, 9);
  assert.match(first.storyboards[0].registrationBoundary, /SEPARATE FROM REGISTERED/);
});

test("show delta makes the newest stream's contribution visible without widening its inference", () => {
  const pack = built.engine.build(SOURCE_ID);
  assert.equal(pack.showDelta.sourceId, SOURCE_ID);
  assert.equal(pack.showDelta.status, "DISTILLED — REVIEW AVAILABLE");
  assert.deepEqual(plain(pack.showDelta.newSincePreviousIndexedStream), [
    "Marvel",
    "Hellraiser",
    "Terrifier",
    "Trailers",
  ]);
  assert.deepEqual(plain(pack.showDelta.graphDelta), {
    topicNodesAdded: 4,
    timestampedReceiptsAdded: 21,
  });
  assert.match(pack.showDelta.inference, /immediately previous indexed livestream/i);
});

test("every opportunity is exact-source, bounded, excerpt-capped, non-diarized, and authority-withheld", () => {
  const pack = built.engine.build(SOURCE_ID);
  const receipts = built.dossierEngine.build(SOURCE_ID).source.receipts;
  const receiptKeys = new Set(receipts.map((receipt) => receipt.key));
  const receiptByKey = new Map(receipts.map((receipt) => [receipt.key, receipt]));

  pack.opportunities.forEach((item) => {
    assert.equal(item.sourceId, SOURCE_ID);
    assert.equal(item.creatorApproved, false);
    assert.equal(item.rightsCleared, false);
    assert.equal(item.promotionAllowed, false);
    assert.equal(item.speaker, null);
    assert.equal(item.speakerStatus, "not-diarized");
    assert.match(item.editorial.label, /SUGGESTED EDITORIAL COPY/);
    assert.ok(item.score.basis);
    if (item.kind === "short") {
      assert.match(item.rationale, /exact-source registered receipt/i);
      assert.match(item.rationale, /Evidence:/);
      assert.notEqual(item.rationale, item.editorial.claimsPolicy);
    }
    assert.ok(item.evidence.label);
    assert.ok(item.risk.label);
    assert.equal(item.approval.humanReviewRequired, true);
    item.coordinates.forEach((coordinate) => {
      assert.equal(coordinate.sourceId, SOURCE_ID);
      assert.ok(receiptKeys.has(coordinate.receiptKey));
      assert.equal(coordinate.officialUrl, receiptByKey.get(coordinate.receiptKey).url);
      assert.ok(coordinate.proposedWindow.in <= coordinate.at);
      assert.ok(coordinate.proposedWindow.out > coordinate.at);
      assert.ok(coordinate.proposedWindow.out <= pack.source.duration);
      assert.equal(
        coordinate.proposedWindow.seconds,
        coordinate.proposedWindow.out - coordinate.proposedWindow.in,
      );
      assert.ok(coordinate.publicExcerptWordCount <= 16);
      assert.equal(coordinate.speaker, null);
      assert.equal(coordinate.speakerStatus, "not-diarized");
    });
    item.relatedSources.forEach((related) => {
      assert.notEqual(related.sourceId, SOURCE_ID);
      assert.match(related.relationship, /NOT LOCAL SOURCE PROOF/);
    });
  });
});

test("storyboard slots are re-bound to canonical dossier receipts and bounded windows", () => {
  const pack = built.engine.build(SOURCE_ID);
  const receiptByKey = new Map(
    built.dossierEngine.build(SOURCE_ID).source.receipts.map((receipt) => [receipt.key, receipt]),
  );
  const slots = pack.storyboards.flatMap((board) => board.localSlots);
  assert.ok(slots.length > 0);
  slots.forEach((slot) => {
    const receipt = receiptByKey.get(slot.receiptKey);
    assert.ok(receipt);
    assert.equal(slot.at, receipt.at);
    assert.equal(slot.officialUrl, receipt.url);
    assert.equal(slot.publicExcerpt, receipt.excerpt);
    assert.ok(slot.publicExcerptWordCount <= 16);
    assert.ok(slot.proposedWindow.in <= receipt.at);
    assert.ok(slot.proposedWindow.out > receipt.at);
    assert.equal(
      slot.proposedWindow.seconds,
      slot.proposedWindow.out - slot.proposedWindow.in,
    );
    assert.equal(slot.proposedWindow.receiptAt, receipt.at);
  });
});

test("stale storyboard receipt time, excerpt, URL, and window payloads fail closed", () => {
  const mutations = [
    {
      code: "STORYBOARD_RECEIPT_COORDINATE_DRIFT",
      mutate: (slot) => { slot.receiptAt += 5; },
    },
    {
      code: "STORYBOARD_EXCERPT_DRIFT",
      mutate: (slot) => { slot.archivalExcerpt += " stale"; },
    },
    {
      code: "STORYBOARD_URL_DRIFT",
      mutate: (slot) => { slot.sourceAtReceipt = slot.sourceUrl + "&t=1s"; },
    },
    {
      code: "STORYBOARD_WINDOW_INVALID",
      mutate: (slot) => { slot.proposedSourceWindow.out = slot.receiptAt; },
    },
  ];
  mutations.forEach(({ code, mutate }) => {
    const coldOpen = mutatedColdOpen(mutate);
    assert.throws(
      () => createEngine({ coldOpen }).build(SOURCE_ID),
      (error) => error.code === code,
      code,
    );
  });
});

test("a storyboard cannot claim source membership without a local source-clip slot", () => {
  const coldOpen = plain(built.coldOpen);
  const board = coldOpen.storyboards.find((item) => item.sourceIds.includes(SOURCE_ID));
  board.slots = board.slots.filter(
    (slot) => !(slot.kind === "source-clip" && slot.sourceId === SOURCE_ID),
  );
  assert.throws(
    () => createEngine({ coldOpen }).build(SOURCE_ID),
    (error) => error.code === "STORYBOARD_SOURCE_MEMBERSHIP_MISSING",
  );
});

test("opportunity joins reject production-kind drift and ignore untrusted segment URLs", () => {
  const clipLab = plain(built.clipLab);
  const candidate = clipLab.shorts.find((item) => item.sourceId === SOURCE_ID);
  const canonicalReceipt = built.dossierEngine.build(SOURCE_ID).source.receipts.find(
    (receipt) => receipt.key === candidate.receiptId,
  );
  candidate.receiptUrl = "https://example.invalid/not-canonical?t=1s";
  const canonicalPack = createEngine({ clipLab }).build(SOURCE_ID);
  const joined = canonicalPack.opportunities.find((item) => item.id === candidate.id);
  assert.equal(joined.coordinates[0].officialUrl, canonicalReceipt.url);

  const dossier = plain(built.dossierEngine.build(SOURCE_ID));
  const artifact = dossier.source.artifacts.find((item) => item.id === candidate.id);
  artifact.kind = "creator-supercut";
  const driftedDossierEngine = {
    list: () => built.dossierEngine.list(),
    build: (sourceId) => sourceId === SOURCE_ID ? dossier : built.dossierEngine.build(sourceId),
  };
  assert.throws(
    () => createEngine({ dossierEngine: driftedDossierEngine }).build(SOURCE_ID),
    (error) => error.code === "ARTIFACT_KIND_DRIFT",
  );
});

test("metadata-only pages refuse creator opportunity invention", () => {
  const pack = built.engine.build(SOURCE_BRIEF_ID);
  assert.equal(pack.source.coverage, "metadata-only");
  assert.equal(pack.metrics.opportunities, 0);
  assert.equal(pack.opportunities.length, 0);
  assert.equal(pack.research.length, 0);
  assert.equal(pack.storyboards.length, 0);
  assert.equal(
    pack.eligibility.status,
    "NO RECEIPT-BACKED CREATOR OPPORTUNITIES YET",
  );

  const review = built.engine.createReview(SOURCE_BRIEF_ID, []);
  const packet = built.engine.exportPacket(SOURCE_BRIEF_ID, review);
  assert.equal(review.status, "NO ELIGIBLE OPPORTUNITIES / NOTHING TO ROUTE");
  assert.equal(packet.status, "NO ELIGIBLE OPPORTUNITIES / NOTHING TO ROUTE");
  assert.deepEqual(plain(packet.bucketSummary), {
    keptForCreatorReview: 0,
    heldForContext: 0,
    quarantinedByRiskGate: 0,
    rejected: 0,
    unreviewed: 0,
  });
  assert.equal(packet.rejectedOpportunities.length, 0);
  assert.equal(packet.unreviewedOpportunities.length, 0);
  assert.ok(
    built.engine.exportMarkdown(packet).includes(
      "NO ELIGIBLE OPPORTUNITIES / NOTHING TO ROUTE",
    ),
  );
});

test("local Keep Hold Reject decisions are mutually exclusive and remain non-authoritative", () => {
  const pack = built.engine.build(SOURCE_ID);
  const review = built.engine.createReview(SOURCE_ID, [
    { opportunityId: pack.opportunities[0].id, status: "keep", note: "Watch the full setup." },
    { opportunityId: pack.opportunities[1].id, status: "hold", note: "Needs context." },
    { opportunityId: pack.opportunities[2].id, status: "reject", note: "Wrong tone for this pack." },
  ]);

  assert.deepEqual(plain(review.counts), {
    keep: 1,
    hold: 1,
    reject: 1,
    unreviewed: 20,
  });
  assert.equal(review.creatorApproved, false);
  assert.equal(review.rightsCleared, false);
  assert.equal(review.promotionAllowed, false);
  assert.match(review.status, /UNREVIEWED OPPORTUNITIES REMAIN/);
  assert.equal(built.engine.restoreReview(SOURCE_ID, review).fingerprint, review.fingerprint);

  assert.throws(
    () => built.engine.createReview(SOURCE_ID, [
      { opportunityId: pack.opportunities[0].id, status: "keep" },
      { opportunityId: pack.opportunities[0].id, status: "hold" },
    ]),
    (error) => error.code === "DUPLICATE_DECISION",
  );
  assert.throws(
    () => built.engine.createReview(SOURCE_ID, [
      { opportunityId: pack.opportunities[0].id, status: "approve" },
    ]),
    (error) => error.code === "REVIEW_STATE_INVALID",
  );
});

test("saved reviews fail closed on tampering and source drift", () => {
  const pack = built.engine.build(SOURCE_ID);
  const review = built.engine.createReview(SOURCE_ID, {
    [pack.opportunities[0].id]: { status: "keep", note: "Candidate." },
  });
  const tampered = plain(review);
  tampered.decisions[0].status = "reject";
  assert.throws(
    () => built.engine.restoreReview(SOURCE_ID, tampered),
    (error) => error.code === "REVIEW_TAMPERED",
  );
  assert.throws(
    () => built.engine.restoreReview("iz0WFhe6LYM", review),
    (error) => error.code === "REVIEW_FINGERPRINT_DRIFT",
  );
});

test("an untouched pack exports every opportunity as structured unreviewed work", () => {
  const pack = built.engine.build(SOURCE_ID);
  const packet = built.engine.exportPacket(SOURCE_ID);
  assert.equal(packet.keptForCreatorReview.length, 0);
  assert.equal(packet.heldForContext.length, 0);
  assert.equal(packet.quarantinedByRiskGate.length, 0);
  assert.equal(packet.rejectedOpportunities.length, 0);
  assert.equal(packet.unreviewedOpportunities.length, pack.opportunities.length);
  assert.deepEqual(
    plain(packet.unreviewedOpportunityIds),
    plain(pack.opportunities.map((item) => item.id)),
  );
  packet.unreviewedOpportunities.forEach((item) => {
    assert.equal(item.decision, "unreviewed");
    item.coordinates.forEach((coordinate) => {
      assert.ok(coordinate.proposedWindow.in <= coordinate.at);
      assert.ok(coordinate.proposedWindow.out > coordinate.at);
    });
  });
});

test("editor packet structures every route and preserves bounded evidence for editor handoff", () => {
  const pack = built.engine.build(SOURCE_ID);
  const safe = pack.opportunities.find((item) => item.readiness === "clip-ready");
  const risky = pack.opportunities.find((item) => item.readiness === "quarantine");
  const held = pack.opportunities.find(
    (item) => item.id !== safe.id && item.readiness !== "quarantine",
  );
  const rejected = pack.opportunities.find(
    (item) => ![safe.id, risky.id, held.id].includes(item.id),
  );
  assert.ok(safe);
  assert.ok(risky);
  assert.ok(held);
  assert.ok(rejected);
  const review = built.engine.createReview(SOURCE_ID, [
    { opportunityId: safe.id, status: "keep", note: "Candidate for creator review." },
    { opportunityId: risky.id, status: "keep", note: "Do not advance without context." },
    { opportunityId: held.id, status: "hold", note: "Watch a wider setup." },
    { opportunityId: rejected.id, status: "reject", note: "Wrong tone for this handoff." },
  ]);
  const packet = built.engine.exportPacket(SOURCE_ID, review);

  assert.equal(packet.schema, "shokker.aftermath-editor-packet/v1");
  assert.match(packet.status, /DRAFT/);
  assert.equal(packet.keptForCreatorReview.length, 1);
  assert.equal(packet.heldForContext.length, 1);
  assert.equal(packet.quarantinedByRiskGate.length, 1);
  assert.equal(packet.rejectedOpportunities.length, 1);
  assert.deepEqual(plain(packet.rejectedOpportunityIds), [rejected.id]);
  assert.equal(packet.rejectedOpportunities[0].note, "Wrong tone for this handoff.");
  assert.equal(packet.unreviewedOpportunities.length, 19);
  assert.equal(packet.summary.unreviewed, 19);
  assert.ok(
    packet.unreviewedOpportunities.every((item) => item.decision === "unreviewed"),
  );
  const routed = [
    ...packet.keptForCreatorReview,
    ...packet.heldForContext,
    ...packet.quarantinedByRiskGate,
    ...packet.rejectedOpportunities,
    ...packet.unreviewedOpportunities,
  ];
  assert.equal(routed.length, pack.opportunities.length);
  routed.forEach((item) => {
    assert.ok(item.coordinates.length > 0);
    item.coordinates.forEach((coordinate) => {
      assert.ok(coordinate.proposedWindow.in <= coordinate.at);
      assert.ok(coordinate.proposedWindow.out > coordinate.at);
      assert.ok(coordinate.publicExcerptWordCount <= 16);
    });
  });
  assert.ok(packet.omissions.includes("media files"));
  assert.ok(packet.omissions.includes("creator approval"));
  assert.ok(packet.omissions.includes("performance or virality guarantees"));

  const markdown = built.engine.exportMarkdown(packet);
  [
    "## Kept opportunities",
    "## Held opportunities",
    "## Risk quarantine",
    "## Rejected opportunities",
    "## Unreviewed opportunities",
  ].forEach((heading) => assert.ok(markdown.includes(heading)));
  routed.flatMap((item) => item.coordinates).forEach((coordinate) => {
    assert.ok(markdown.includes(coordinate.officialUrl));
  });
  assert.match(markdown, /No media, rights clearance/);
});

test("the three-show showcase is a reviewable workflow with no product offer", () => {
  const showcase = built.engine.buildShowcase({ sourceIds: [SOURCE_ID] });
  assert.equal(showcase.schema, "shokker.creator-workflow-showcase/v1");
  assert.deepEqual(plain(showcase.scope), {
    shows: 3,
    label: "THREE-SHOW SOURCE REVIEW",
  });
  assert.equal(showcase.sources.length, 3);
  assert.equal(showcase.sources[0].id, SOURCE_ID);
  assert.ok(showcase.sources.every((source) => source.packFingerprint.startsWith("ap1-")));
  assert.ok(showcase.excluded.includes("performance or audience-impact claims"));
  assert.match(showcase.prototypeBoundary, /reviewable prototype/i);
  assert.doesNotMatch(JSON.stringify(showcase), /\$|price|purchase|revenue|invoice/i);
});
