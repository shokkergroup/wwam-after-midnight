import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const source = fs.readFileSync(
  path.join(demo, "correction-ripple-engine.js"),
  "utf8",
);

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: "correction-ripple-engine.js",
  });
  return sandbox.window.WWAMCorrectionRippleEngine;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixture() {
  const receipts = [
    {
      id: "receipt-1",
      sourceId: "source-1",
      entityIds: ["film:one", "character:one"],
    },
    {
      id: "receipt-2",
      sourceId: "source-1",
      entityIds: ["film:one"],
    },
    {
      id: "receipt-3",
      sourceId: "source-2",
      entityIds: ["film:one"],
    },
  ];
  return {
    snapshotDate: "2026-07-24",
    inputFingerprint: "fixture-proof",
    sources: [
      { id: "source-1", title: "Source One" },
      { id: "source-2", title: "Source Two" },
    ],
    receipts,
    memoryGraph: {
      nodes: [
        { id: "source:source-1" },
        { id: "film:one" },
        { id: "character:one" },
      ],
      edges: [
        {
          id: "edge:one",
          from: "source:source-1",
          to: "film:one",
          receiptIds: ["receipt-1", "receipt-2"],
        },
      ],
    },
    takeTimeMachines: [
      {
        id: "timeline:one",
        receipts: ["receipt-1", "receipt-2"],
        positionBasis: ["receipt-2"],
        milestones: [
          { receiptId: "receipt-1", sourceId: "source-1" },
          { receiptId: "receipt-2", sourceId: "source-1" },
        ],
        movements: [
          {
            beforeReceiptId: "receipt-1",
            afterReceiptId: "receipt-2",
          },
        ],
      },
    ],
    bitAncestry: [
      {
        id: "ancestry:one",
        sourceIds: ["source-1"],
        origin: { receiptId: "receipt-1", sourceId: "source-1" },
        callbacks: ["receipt-2"],
        performances: [
          { receiptId: "receipt-1" },
          { receiptId: "receipt-2" },
        ],
        latestReceiptId: "receipt-2",
      },
    ],
    riffChemistry: {
      moments: [
        { receiptId: "receipt-1", sourceId: "source-1" },
        { receiptId: "receipt-2", sourceId: "source-1" },
      ],
      sourceProfiles: [
        { sourceId: "source-1", topReceiptId: "receipt-2" },
      ],
      rankings: [
        {
          sourceId: "source-1",
          peak: { receiptId: "receipt-1", sourceId: "source-1" },
        },
      ],
    },
    personalizedDescent: {
      routes: [
        {
          id: "route:one",
          route: {
            receiptIds: ["receipt-1"],
            stops: [
              { receiptId: "receipt-1", sourceId: "source-1" },
            ],
          },
        },
      ],
    },
    courtCandidates: [
      {
        id: "court:one",
        prosecutionReceiptIds: ["receipt-1"],
        defenseReceiptIds: ["receipt-3"],
        prosecution: [
          { receiptId: "receipt-1", sourceId: "source-1" },
        ],
        defense: [{ receiptId: "receipt-3", sourceId: "source-2" }],
        chronology: [
          {
            before: { receiptId: "receipt-1" },
            after: { receiptId: "receipt-3" },
          },
        ],
      },
    ],
    liveAftermath: [
      {
        id: "aftermath:source-1",
        sourceId: "source-1",
        funniestReceiptId: "receipt-1",
        strongestTopicReceiptId: "receipt-2",
        clipCandidateReceiptIds: ["receipt-1"],
      },
    ],
    characterReadiness: [
      {
        characterId: "character:one",
        receiptIds: ["receipt-1", "receipt-2"],
        curatedCandidateReceiptIds: ["receipt-1"],
      },
    ],
    creatorControlRoom: {
      queue: [
        {
          id: "verify:one",
          receiptIds: ["receipt-1"],
          sourceId: "source-1",
          evidence: [
            { receiptId: "receipt-1", sourceId: "source-1" },
          ],
        },
      ],
      contentOpportunities: [
        { receiptId: "receipt-2", sourceId: "source-1" },
      ],
      archiveResurfaced: [
        { receiptId: "receipt-3", sourceId: "source-2" },
      ],
    },
  };
}

test("an exact receipt maps every registered Showcase surface without mutation", () => {
  const engineModule = load();
  const showcase = fixture();
  const before = JSON.stringify(showcase);
  const ripple = engineModule.create({ showcase });
  const request = {
    candidateId: "fixture-correction",
    target: { type: "receipt", id: "receipt-1" },
    evidence: [
      { receiptId: "receipt-1", sourceId: "source-1" },
    ],
  };
  const first = ripple.analyze(request);
  const second = ripple.analyze(request);

  assert.equal(engineModule.VERSION, "1.0.0");
  assert.equal(ripple.registeredRecords, 17);
  assert.deepEqual(plain(first), plain(second));
  assert.equal(JSON.stringify(showcase), before);
  assert.equal(first.schema, "wwam.correction-ripple.v1");
  assert.equal(first.mode, "DRY_RUN");
  assert.equal(first.status, "READY");
  assert.equal(first.analysisComplete, true);
  assert.equal(first.scope.resolutionMode, "EXACT_RECEIPT");
  assert.deepEqual(plain(first.scope.resolvedReceipts), [
    { id: "receipt-1", sourceId: "source-1" },
  ]);
  assert.equal(first.totals.affectedSurfaces, 9);
  first.surfaceSummary.forEach((surface) => {
    assert.ok(
      surface.exactReceiptRecords > 0,
      `${surface.label} should expose an exact receipt dependency`,
    );
  });
  assert.ok(first.dependencies.sourceOnly.length > 0);
  assert.ok(
    first.dependencies.sourceOnly.some(
      (hit) =>
        hit.surfaceId === "riff-chemistry" &&
        hit.recordId === "moment:receipt-2",
    ),
  );
  assert.match(first.reportFingerprint, /^[0-9a-f]{8}$/);
  assert.equal(first.mutationPolicy.canonMutation, "NONE");
  assert.equal(first.mutationPolicy.askEffectClaim, "NONE");
  assert.equal(first.mutationPolicy.clipLabEffectClaim, "NONE");
  assert.deepEqual(
    plain(first.excludedSurfaces.map((surface) => surface.id)),
    ["ask-the-tape", "clip-lab"],
  );
});

test("source-only evidence never masquerades as an exact receipt dependency", () => {
  const ripple = load().create({ showcase: fixture() });
  const report = ripple.analyze({
    candidateId: "source-health:source-1",
    target: { type: "source", id: "source-1" },
    evidence: [],
  });

  assert.equal(report.status, "READY");
  assert.equal(report.scope.resolutionMode, "SOURCE_ONLY");
  assert.equal(report.totals.resolvedReceipts, 0);
  assert.equal(report.totals.resolvedSources, 1);
  assert.equal(report.totals.exactReceiptRecords, 0);
  assert.ok(report.totals.sourceOnlyRecords > 0);
  assert.equal(report.dependencies.exactReceipt.length, 0);
  report.dependencies.sourceOnly.forEach((hit) => {
    assert.equal(hit.dependency, "SOURCE_ONLY");
    assert.deepEqual(plain(hit.matchedReceiptIds), []);
  });
});

test("unresolved or mismatched evidence fails closed with zero impact claims", () => {
  const ripple = load().create({ showcase: fixture() });
  const unresolved = ripple.analyze({
    candidateId: "missing",
    target: { type: "receipt", id: "receipt-missing" },
    evidence: [],
  });
  assert.equal(unresolved.status, "BLOCKED_UNRESOLVED_EVIDENCE");
  assert.equal(unresolved.analysisComplete, false);
  assert.deepEqual(plain(unresolved.dependencies), {
    exactReceipt: [],
    sourceOnly: [],
  });
  assert.equal(unresolved.totals.affectedSurfaces, 0);
  assert.ok(
    unresolved.errors.some((error) => error.code === "RECEIPT_UNRESOLVED"),
  );
  unresolved.surfaceSummary.forEach((surface) => {
    assert.equal(surface.status, "NOT_EVALUATED");
  });

  const mismatch = ripple.analyze({
    candidateId: "mismatch",
    evidence: [
      { receiptId: "receipt-1", sourceId: "source-2" },
    ],
  });
  assert.equal(mismatch.status, "BLOCKED_UNRESOLVED_EVIDENCE");
  assert.ok(
    mismatch.errors.some(
      (error) => error.code === "RECEIPT_SOURCE_MISMATCH",
    ),
  );
  assert.equal(mismatch.totals.exactReceiptRecords, 0);
  assert.equal(mismatch.mutationPolicy.askEffectClaim, "NONE");
  assert.equal(mismatch.mutationPolicy.clipLabEffectClaim, "NONE");
});

test("an evidence item without a registered ID is not guessed from prose or URL", () => {
  const ripple = load().create({ showcase: fixture() });
  const report = ripple.analyze({
    candidateId: "no-guessing",
    evidence: [
      {
        url: "https://www.youtube.com/watch?v=source-1&t=30s",
        excerpt: "This text is not an identifier.",
      },
    ],
  });

  assert.equal(report.status, "BLOCKED_UNRESOLVED_EVIDENCE");
  assert.ok(
    report.errors.some(
      (error) => error.code === "EVIDENCE_REFERENCE_MISSING",
    ),
  );
  assert.ok(
    report.errors.some(
      (error) => error.code === "NO_RESOLVABLE_EVIDENCE_SCOPE",
    ),
  );
});
