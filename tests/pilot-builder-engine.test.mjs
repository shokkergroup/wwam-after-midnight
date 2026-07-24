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
    "lore-engine.js",
    "creator-studio-engine.js",
    "cold-open-engine.js",
    "trust-engine.js",
    "canon-integrity-engine.js",
    "pilot-builder-engine.js"
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file
    });
  });
  return sandbox.window;
}

function build(window, options = {}) {
  const sourceInput = {
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  };
  const showcase = window.WWAMShowcaseEngine.create(sourceInput);
  const lore = window.WWAMLoreEngine.create(sourceInput);
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const coldOpen = window.WWAMColdOpenFactory.create({ clipLab });
  const trust = window.WWAMTrustEngine.create({ ...sourceInput, showcase });
  const integrityReport = window.WWAMCanonIntegrity.audit({
    ...sourceInput,
    showcase,
    lore,
    clip: clipLab,
    characters: window.WWAMCharacterEngine?.create
      ? window.WWAMCharacterEngine.create(sourceInput)
      : { characters: [] }
  });
  assert.equal(integrityReport.ok, true);
  const builder = window.WWAMCreatorPilotBuilder.create({
    showcase,
    lore,
    clipLab,
    coldOpen,
    trust,
    integrityReport,
    ...options
  });
  return {
    sourceInput,
    showcase,
    lore,
    clipLab,
    coldOpen,
    trust,
    integrityReport,
    builder
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Pilot Builder mirrors the current engine snapshot without invented metrics", () => {
  const window = load();
  const current = build(window);
  const { builder, showcase, lore, clipLab, coldOpen, trust } = current;

  assert.equal(window.WWAMCreatorPilotBuilder.VERSION, "1.0.0");
  assert.equal(Object.isFrozen(window.WWAMCreatorPilotBuilder), true);
  assert.equal(builder.metrics.archive.sources, showcase.metrics.sources);
  assert.equal(builder.metrics.archive.receipts, showcase.metrics.receipts);
  assert.equal(builder.metrics.memory.graphEdges, showcase.metrics.graphEdges);
  assert.equal(builder.metrics.lore.fieldGuideEntries, lore.metrics.fieldGuideEntries);
  assert.equal(builder.metrics.lore.playableReceipts, lore.metrics.playableReceipts);
  assert.equal(builder.metrics.creator.shortCandidates, clipLab.metrics.shortCandidates);
  assert.equal(builder.metrics.creator.supercutBundles, clipLab.metrics.supercutBundles);
  assert.equal(builder.metrics.creator.coldOpenStoryboards, coldOpen.metrics.storyboards);
  assert.equal(builder.metrics.trust.reviewCandidates, trust.metrics.reviewCandidates);
  assert.equal(
    builder.metrics.trust.creatorCertifiedReceipts,
    trust.metrics.creatorReceipts
  );
});

test("all four goal briefs are deterministic, source-ledgered drafts", () => {
  const window = load();
  const first = build(window).builder;
  const second = build(window).builder;
  const expected = [
    "archive-discovery",
    "compilation-workflow",
    "fan-member-experience",
    "recurring-lore-system"
  ];

  assert.deepEqual(
    plain(first.goals.map((goal) => goal.id)),
    expected
  );
  expected.forEach((goalId) => {
    const a = first.build(goalId);
    const b = second.build(goalId);
    assert.deepEqual(plain(a), plain(b));
    assert.equal(a.status, "DRAFT / HUMAN APPROVAL REQUIRED");
    assert.equal(a.creatorDecisionState, "NOT REVIEWED");
    assert.equal(a.measurementPlan.status, "MEASURE DURING PILOT");
    assert.equal(a.measurementPlan.observedResults.length, 0);
    assert.ok(a.deliverables.length >= 3);
    assert.ok(a.workflow.length >= 5);
    assert.ok(a.currentProof.sampleReceipts.length > 0);
    assert.ok(a.currentProof.sampleReceipts.length <= 6);
    a.currentProof.sampleReceipts.forEach((receipt) => {
      assert.ok(receipt.receiptId);
      assert.ok(receipt.sourceId);
      assert.match(receipt.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
      assert.match(receipt.boundary, /coverage only/i);
    });
    assert.equal(first.verify(a).ok, true);
  });
});

test("goal and snapshot changes produce different verified fingerprints", () => {
  const window = load();
  const current = build(window);
  const archive = current.builder.build("archive-discovery");
  const fan = current.builder.build("fan-member-experience");
  const dated = build(window, { asOf: "2026-08-01" }).builder.build(
    "archive-discovery"
  );

  assert.notEqual(archive.fingerprint, fan.fingerprint);
  assert.notEqual(archive.fingerprint, dated.fingerprint);
  assert.notEqual(current.builder.inputFingerprint, build(window, { asOf: "2026-08-01" }).builder.inputFingerprint);
});

test("invalid goals, missing engines, corrupt metrics, and failing integrity stop closed", () => {
  const window = load();
  const current = build(window);
  assert.throws(
    () => current.builder.build("money-machine"),
    (error) => error.name === "RangeError"
  );
  assert.throws(
    () =>
      window.WWAMCreatorPilotBuilder.create({
        showcase: current.showcase,
        lore: current.lore
      }),
    /requires clipLab/
  );

  const corruptClip = {
    ...plain(current.clipLab),
    metrics: { ...plain(current.clipLab.metrics), shortCandidates: "many" }
  };
  assert.throws(
    () =>
      window.WWAMCreatorPilotBuilder.create({
        showcase: current.showcase,
        lore: current.lore,
        clipLab: corruptClip,
        coldOpen: current.coldOpen,
        trust: current.trust
      }),
    /shortCandidates/
  );

  assert.throws(
    () =>
      window.WWAMCreatorPilotBuilder.create({
        showcase: current.showcase,
        lore: current.lore,
        clipLab: current.clipLab,
        coldOpen: current.coldOpen,
        trust: current.trust,
        integrityReport: { ok: false, status: "FAIL", fingerprint: "bad" }
      }),
    (error) => error.name === "PilotIntegrityError"
  );
});

test("briefs make no unsupported business, creator, rights, or canon claim", () => {
  const window = load();
  const { builder } = build(window);
  builder.buildAll().forEach((brief) => {
    const serialized = JSON.stringify(brief);
    assert.doesNotMatch(serialized, /\b\d+%\s+(conversion|retention|growth)/i);
    assert.doesNotMatch(serialized, /\b(saved|saves)\s+\d+\s+hours/i);
    assert.doesNotMatch(serialized, /\$\d+|\brevenue generated\b|\bROI achieved\b/i);
    assert.doesNotMatch(serialized, /\bcreator[- ]approved\b/i);
    assert.doesNotMatch(serialized, /\bright[s]? cleared\b|\blicensed media\b/i);
    assert.doesNotMatch(serialized, /\btrue origin\b|\bfirst ever\b/i);
    assert.match(serialized, /HUMAN APPROVAL REQUIRED/);
    assert.match(serialized, /No rights clearance/i);
    assert.match(serialized, /No creator endorsement/i);
  });
});

test("JSON and Markdown exports carry acceptance boundaries and the proof ledger", () => {
  const window = load();
  const { builder } = build(window);
  const brief = builder.build("compilation-workflow", {
    title: "WWAM Compilation Workflow Pilot",
    sourceLane: "TEN CREATOR-SELECTED LIVESTREAMS",
    sourceLimit: 10
  });
  const json = builder.exportJSON(brief);
  const markdown = builder.exportMarkdown(brief);

  assert.deepEqual(JSON.parse(json), plain(brief));
  assert.match(markdown, /^# WWAM Compilation Workflow Pilot/m);
  assert.match(markdown, /DRAFT \/ HUMAN APPROVAL REQUIRED/);
  assert.match(markdown, /MEASURE DURING PILOT/);
  assert.match(markdown, /These are snapshot counts, not performance or business results/);
  assert.match(markdown, /Proof ledger/);
  assert.match(markdown, new RegExp(brief.fingerprint));
  assert.match(markdown, new RegExp(brief.proofLedger.inputFingerprint));
  assert.match(markdown, /youtube\.com\/watch\?v=/);
  assert.match(markdown, /No rights clearance/);
});

function reproof(window, brief) {
  const copy = plain(brief);
  delete copy.fingerprint;
  copy.fingerprint = window.WWAMCreatorPilotBuilder.fingerprint(copy);
  return copy;
}

test("verification rejects tampered content, metrics, and imported input ledgers", () => {
  const window = load();
  const { builder } = build(window);
  const brief = plain(builder.build("recurring-lore-system"));

  brief.deliverables[0].acceptanceCheck = "Looks good to the machine.";
  const contentResult = builder.verify(brief);
  assert.ok(contentResult.problems.includes("BRIEF_TAMPERED"));
  assert.ok(contentResult.problems.includes("SEMANTIC_CONTRACT_MISMATCH"));
  assert.throws(() => builder.exportJSON(brief), /failed verification/);

  const metricTamper = plain(builder.build("archive-discovery"));
  metricTamper.proofLedger.metricSnapshot.archive.sources += 1;
  const metricResult = builder.verify(metricTamper);
  assert.equal(metricResult.ok, false);
  assert.ok(metricResult.problems.includes("METRIC_SNAPSHOT_MISMATCH"));
  assert.ok(metricResult.problems.includes("BRIEF_TAMPERED"));

  const inputTamper = plain(builder.build("fan-member-experience"));
  inputTamper.proofLedger.inputFingerprint = "00000000";
  const inputResult = builder.verify(inputTamper);
  assert.ok(inputResult.problems.includes("INPUT_FINGERPRINT_MISMATCH"));
  assert.ok(inputResult.problems.includes("BRIEF_TAMPERED"));
});

test("recomputable checksums cannot forge creator approval or invented results", () => {
  const window = load();
  const { builder } = build(window);

  const approval = plain(builder.build("archive-discovery"));
  approval.status = "CREATOR APPROVED";
  approval.creatorDecisionState = "APPROVED";
  const reproofedApproval = reproof(window, approval);
  const approvalResult = builder.verify(reproofedApproval);
  assert.equal(approvalResult.ok, false);
  assert.ok(approvalResult.problems.includes("DRAFT_STATUS_REQUIRED"));
  assert.ok(
    approvalResult.problems.includes(
      "CREATOR_DECISION_UNREVIEWED_REQUIRED"
    )
  );
  assert.ok(approvalResult.problems.includes("SEMANTIC_CONTRACT_MISMATCH"));
  assert.equal(approvalResult.problems.includes("BRIEF_TAMPERED"), false);

  const invented = plain(builder.build("fan-member-experience"));
  invented.measurementPlan.observedResults = [
    "$1,000,000 revenue generated",
    "42% retention"
  ];
  invented.measurementPlan.baseline = "CLAIMED";
  const reproofedInvented = reproof(window, invented);
  const inventedResult = builder.verify(reproofedInvented);
  assert.equal(inventedResult.ok, false);
  assert.ok(inventedResult.problems.includes("OBSERVED_RESULTS_NOT_ALLOWED"));
  assert.ok(
    inventedResult.problems.includes("MEASUREMENT_CONTRACT_MISMATCH")
  );
  assert.ok(inventedResult.problems.includes("SEMANTIC_CONTRACT_MISMATCH"));
  assert.equal(inventedResult.problems.includes("BRIEF_TAMPERED"), false);
});

test("verification independently binds engine, integrity, and receipt ledgers", () => {
  const window = load();
  const { builder } = build(window);
  const forged = plain(builder.build("compilation-workflow"));
  forged.proofLedger.engineFingerprints.showcase = "replaced";
  forged.proofLedger.integrityFingerprint = "fake-pass";
  forged.proofLedger.receiptIds = ["receipt:invented"];
  const result = builder.verify(reproof(window, forged));

  assert.equal(result.ok, false);
  assert.ok(result.problems.includes("ENGINE_FINGERPRINT_MISMATCH"));
  assert.ok(result.problems.includes("INTEGRITY_BINDING_MISMATCH"));
  assert.ok(result.problems.includes("PROOF_RECEIPT_LEDGER_MISMATCH"));
  assert.ok(result.problems.includes("SEMANTIC_CONTRACT_MISMATCH"));
  assert.match(result.verificationKind, /NOT AN OWNER SIGNATURE/);
});
