import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const engineSource = fs.readFileSync(
  path.join(here, "..", "public", "demo", "creator-taste-engine.js"),
  "utf8",
);

function loadApi() {
  const context = { window: {} };
  context.window.window = context.window;
  vm.runInNewContext(engineSource, context, {
    filename: "creator-taste-engine.js",
  });
  return context.window.ShokkerCreatorTasteCalibration;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

const RISK_ORDER = { LOW: 1, MEDIUM: 2, HIGH: 3, HOLD: 4 };

function makeCandidate(index, overrides = {}) {
  const sourceNumber = index % 15;
  const sourceId = `source-${String(sourceNumber).padStart(2, "0")}`;
  const receiptAt = 90 + index * 37.25;
  const categories = ["CHAOS", "DRY", "CALLBACK", "STORY"];
  const topics = ["archive", "movies", "characters", "news", "community"];
  const entities = ["oracle", "captain", "neighbor", "detective"];
  return {
    id: `short-${String(index).padStart(2, "0")}`,
    kind: "short-candidate",
    receiptId: `receipt-${String(index).padStart(2, "0")}`,
    sourceId,
    receiptAt,
    timecode: `00:${String(Math.floor(receiptAt / 60)).padStart(2, "0")}:00`,
    receiptUrl: `https://video.example/watch?v=${sourceId}&t=${Math.floor(receiptAt)}s`,
    sourceTitle: `Source ${sourceNumber}`,
    sourceType: index % 2 ? "livestream" : "commentary",
    sourceDate: `2026-07-${String((index % 20) + 1).padStart(2, "0")}`,
    category: categories[index % categories.length],
    topics: [
      {
        id: topics[index % topics.length],
        label: topics[index % topics.length].toUpperCase(),
      },
    ],
    characters: [
      {
        id: entities[index % entities.length],
        label: entities[index % entities.length].toUpperCase(),
      },
    ],
    editWindow: {
      in: Math.floor(receiptAt) - 4,
      out: Math.floor(receiptAt) + 20 + (index % 3) * 11,
      seconds: 24 + (index % 3) * 11,
    },
    editPriority: 84 - index * 0.2,
    archivalExcerpt:
      "This deliberately long source caption fragment contains more than sixteen words so the portable decision card proves its public excerpt boundary.",
    evidence: {
      label: index % 3 ? "HIGH" : "MEDIUM",
      evidenceLevel: index % 3 ? "curated" : "machine",
      score: 78 + (index % 20),
    },
    risk: {
      label: index % 5 ? "LOW" : "MEDIUM",
      score: index % 5 ? 12 : 30,
    },
    approval: {
      status: "NOT REVIEWED",
      creatorApproved: false,
    },
    canon: {
      status: "CANDIDATE",
      certified: false,
    },
    speaker: {
      display: null,
      status: "NOT DIARIZED",
    },
    rights: {
      status: "NOT CLEARED",
    },
    creatorApproval: {
      status: "NOT AUTHENTICATED",
      approved: false,
    },
    ...overrides,
  };
}

function makeClipLab(options = {}) {
  const candidates =
    options.candidates ??
    Array.from({ length: 30 }, (_, index) => makeCandidate(index)).concat([
      makeCandidate(90, {
        id: "hold-candidate",
        receiptId: "hold-receipt",
        sourceId: "source-hold",
        editPriority: 100,
        risk: { label: "HOLD", score: 100 },
      }),
      makeCandidate(91, {
        id: "high-candidate",
        receiptId: "high-receipt",
        sourceId: "source-high",
        editPriority: 99,
        risk: { label: "HIGH", score: 70 },
      }),
    ]);
  return {
    inputFingerprint: options.inputFingerprint ?? "clip-fixture-2026-07-24",
    shorts: candidates,
    getShorts(filters = {}) {
      const maximum = String(filters.maxRisk ?? "HOLD").toUpperCase();
      return candidates.filter((candidate) => {
        const label = String(candidate.risk?.label ?? "HOLD").toUpperCase();
        return label !== "HOLD" && RISK_ORDER[label] <= RISK_ORDER[maximum];
      });
    },
  };
}

function makePack(channelId = "fixture-channel", fingerprint = "cp1-fixture") {
  return {
    fingerprint,
    identity: { id: channelId },
  };
}

function makeEngine(overrides = {}) {
  const api = overrides.api ?? loadApi();
  const clipLab = overrides.clipLab ?? makeClipLab();
  const channelPack = overrides.channelPack ?? makePack();
  const adapter = overrides.adapter ?? {
    labels: {
      product: "THE CUT TEST",
      operator: "LOCAL CUT OPERATOR",
      round: "CUT ROUND",
      optionA: "KEEP A",
      optionB: "KEEP B",
      neither: "KILL BOTH",
      needsContext: "CHECK THE SOURCE",
      baseline: "MACHINE TWELVE",
      calibrated: "LOCAL CUT TWELVE",
      categoryFacet: "COMEDY LANE",
      topicFacet: "SUBJECT",
      entityFacet: "RECURRING ENTITY",
      runtimeFacet: "CLIP LENGTH",
      sourceTypeFacet: "SOURCE LANE",
    },
  };
  return {
    api,
    clipLab,
    channelPack,
    adapter,
    engine: api.create({
      clipLab,
      channelPack,
      adapter,
      maxRisk: overrides.maxRisk,
      goal: overrides.goal,
    }),
  };
}

function semanticChoice(round, wantedCategory = "CHAOS") {
  if (round.optionA.category === wantedCategory) return "A";
  if (round.optionB.category === wantedCategory) return "B";
  return round.optionA.baselineRank <= round.optionB.baselineRank ? "A" : "B";
}

function completeSession(engine, options = {}) {
  const session = engine.start();
  const rounds = session.getRounds();
  const chosenByRound = new Map();
  const contextRoundId = options.contextRoundId ?? null;
  rounds.forEach((round) => {
    let choice;
    if (round.repeatOf) {
      const originalOutcome = chosenByRound.get(round.repeatOf);
      if (originalOutcome === "NEITHER") {
        choice = "NEITHER";
      } else if (originalOutcome === "NEEDS_CONTEXT") {
        choice = "NEEDS_CONTEXT";
      } else {
        choice =
          round.optionA.candidateId === originalOutcome
            ? "A"
            : round.optionB.candidateId === originalOutcome
              ? "B"
              : "NEITHER";
      }
    } else if (round.id === contextRoundId) {
      choice = "NEEDS_CONTEXT";
    } else if (options.allNeither) {
      choice = "NEITHER";
    } else {
      choice = semanticChoice(round, options.wantedCategory);
    }
    session.decide(round.id, choice);
    if (!round.repeatOf) {
      chosenByRound.set(
        round.id,
        choice === "A"
          ? round.optionA.candidateId
          : choice === "B"
            ? round.optionB.candidateId
            : choice,
      );
    }
  });
  return session;
}

test("exports a frozen universal API with an explicit four-choice contract", () => {
  const api = loadApi();
  assert.equal(api.VERSION, "1.0.0");
  assert.equal(api.SCHEMA, "shokker.creator-taste/v1");
  assert.deepEqual(Array.from(api.CHOICES), [
    "A",
    "B",
    "NEITHER",
    "NEEDS_CONTEXT",
  ]);
  assert.equal(Object.isFrozen(api), true);
  assert.equal(typeof api.create, "function");
  assert.equal(api.CreatorTasteCalibrationError.name, "CreatorTasteCalibrationError");
});

test("builds twelve deterministic source-diverse rounds with exactly two reversed repeat checks", () => {
  const firstFixture = makeEngine();
  const reversedClipLab = makeClipLab({
    candidates: firstFixture.clipLab.shorts.slice().reverse(),
  });
  const secondFixture = makeEngine({
    api: firstFixture.api,
    clipLab: reversedClipLab,
  });
  const first = firstFixture.engine.start().getRounds();
  const second = secondFixture.engine.start().getRounds();

  assert.deepEqual(first, second);
  assert.equal(first.length, 12);
  assert.equal(first.filter((round) => round.repeatCheck).length, 2);
  assert.equal(first.filter((round) => !round.repeatCheck).length, 10);

  const baseRounds = first.filter((round) => !round.repeatCheck);
  const pairKeys = new Set();
  const sampledSources = new Set();
  baseRounds.forEach((round) => {
    assert.notEqual(round.optionA.sourceId, round.optionB.sourceId);
    const key = [round.optionA.candidateId, round.optionB.candidateId]
      .sort()
      .join("|");
    assert.equal(pairKeys.has(key), false);
    pairKeys.add(key);
    sampledSources.add(round.optionA.sourceId);
    sampledSources.add(round.optionB.sourceId);
  });
  assert.ok(sampledSources.size >= 8);

  first
    .filter((round) => round.repeatCheck)
    .forEach((repeat) => {
      const original = first.find((round) => round.id === repeat.repeatOf);
      assert.ok(original);
      assert.equal(repeat.optionA.candidateId, original.optionB.candidateId);
      assert.equal(repeat.optionB.candidateId, original.optionA.candidateId);
      assert.equal(repeat.optionA.sourceId, original.optionB.sourceId);
      assert.equal(repeat.optionB.sourceId, original.optionA.sourceId);
    });
});

test("fails closed when the inventory cannot support the Top 12 or source diversity contract", () => {
  const api = loadApi();
  assert.throws(
    () =>
      api.create({
        clipLab: makeClipLab({
          candidates: Array.from({ length: 11 }, (_, index) =>
            makeCandidate(index),
          ),
        }),
        channelPack: makePack(),
      }),
    (error) => error.code === "INSUFFICIENT_ELIGIBLE_CANDIDATES",
  );

  const lowDiversity = Array.from({ length: 20 }, (_, index) =>
    makeCandidate(index, { sourceId: `narrow-${index % 4}` }),
  );
  assert.throws(
    () =>
      api.create({
        clipLab: makeClipLab({ candidates: lowDiversity }),
        channelPack: makePack(),
      }),
    (error) => error.code === "INSUFFICIENT_SOURCE_DIVERSITY",
  );
});

test("requires strict round order and one of the four explicit decisions", () => {
  const { engine } = makeEngine();
  const session = engine.start();
  const rounds = session.getRounds();
  assert.throws(
    () => session.decide(rounds[1].id, "A"),
    (error) => error.code === "ROUND_ORDER_MISMATCH",
  );
  assert.throws(
    () => session.decide(rounds[0].id, "MAYBE"),
    (error) => error.code === "INVALID_DECISION",
  );
  const progress = session.decide(rounds[0].id, "needs context");
  assert.equal(progress.completed, 1);
  assert.equal(progress.learningDecisions, 0);
  assert.equal(
    session.getDecisionLedger()[0].excludedFromLearning,
    "CONTEXT REVIEW REQUIRED",
  );
});

test("incomplete sessions and sessions without six base A/B preferences cannot finalize or export", () => {
  const { engine } = makeEngine();
  const incomplete = engine.start();
  const first = incomplete.getCurrentRound();
  incomplete.decide(first.id, "A");
  assert.throws(
    () => incomplete.finalize(),
    (error) => error.code === "INCOMPLETE_SESSION",
  );
  assert.throws(
    () => incomplete.exportJSON(),
    (error) => error.code === "INCOMPLETE_SESSION",
  );

  const noSignal = completeSession(engine, { allNeither: true });
  assert.equal(noSignal.getProgress().completed, 12);
  assert.equal(noSignal.getProgress().minimumReached, false);
  assert.throws(
    () => noSignal.finalize(),
    (error) => error.code === "INSUFFICIENT_PREFERENCE_DATA",
  );
});

test("excludes NEEDS_CONTEXT from learning while retaining its exact review ledger", () => {
  const { engine } = makeEngine();
  const roundDefinitions = engine.start().getRounds();
  const repeatedBaseIds = new Set(
    roundDefinitions
      .filter((round) => round.repeatOf)
      .map((round) => round.repeatOf),
  );
  const contextRound = roundDefinitions.find(
    (round) => !round.repeatOf && !repeatedBaseIds.has(round.id),
  );
  const session = completeSession(engine, {
    contextRoundId: contextRound.id,
    wantedCategory: "CHAOS",
  });
  const artifact = session.finalize();
  const contextDecision = artifact.decisionLedger.find(
    (decision) => decision.roundId === contextRound.id,
  );

  assert.equal(contextDecision.choice, "NEEDS_CONTEXT");
  assert.equal(contextDecision.learningEligible, false);
  assert.equal(contextDecision.selectedReceiptId, null);
  assert.equal(contextDecision.exactLedger.optionA.receiptId, contextRound.optionA.receiptId);
  assert.equal(contextDecision.exactLedger.optionB.receiptId, contextRound.optionB.receiptId);
  assert.equal(artifact.metrics.needsContextExcluded, 1);
  assert.equal(artifact.preferenceModel.learningDecisionCount, 9);
  assert.equal(artifact.metrics.learningDecisions, 9);
});

test("produces exact-ledger proof metrics and two semantic repeat checks", () => {
  const { engine } = makeEngine();
  const artifact = completeSession(engine).finalize();
  const metrics = artifact.metrics;

  assert.equal(metrics.decisionsCompleted, 12);
  assert.equal(metrics.decisionsRequired, 12);
  assert.equal(
    Object.values(metrics.choiceBreakdown).reduce((sum, count) => sum + count, 0),
    12,
  );
  assert.ok(metrics.sampleCoverage.uniqueSources >= 8);
  assert.ok(metrics.sampleCoverage.uniqueCategories >= 4);
  assert.ok(metrics.sampleCoverage.runtimeBands >= 3);
  assert.equal(metrics.exactLedger.decisionOptions, 24);
  assert.equal(metrics.exactLedger.completeOptions, 24);
  assert.equal(metrics.exactLedger.coveragePercent, 100);
  assert.equal(metrics.repeatChecks.required, 2);
  assert.equal(metrics.repeatChecks.present, 2);
  assert.equal(metrics.repeatChecks.scored, 2);
  assert.equal(metrics.repeatChecks.consistent, 2);
  assert.equal(metrics.repeatChecks.consistencyPercent, 100);
  metrics.repeatChecks.checks.forEach((check) => {
    assert.equal(check.sideOrderReversed, true);
    assert.equal(check.consistent, true);
  });
});

test("keeps the machine baseline beside a bounded calibrated Top 12 without mutating protected fields", () => {
  const fixture = makeEngine();
  const before = plain(fixture.clipLab.shorts);
  const artifact = completeSession(fixture.engine, {
    wantedCategory: "CHAOS",
  }).finalize();
  const after = plain(fixture.clipLab.shorts);

  assert.deepEqual(after, before);
  assert.equal(artifact.shortlists.baseline.length, 12);
  assert.equal(artifact.shortlists.calibrated.length, 12);
  artifact.shortlists.baseline.forEach((item, index) => {
    assert.equal(item.baselineRank, index + 1);
    assert.equal(item.calibratedRank, item.baselineRank);
    assert.equal(item.preferenceModifier, 0);
    assert.equal(item.editPriority, item.baselineEditPriority);
    assert.equal(item.calibratedScore, item.editPriority);
  });
  artifact.shortlists.calibrated.forEach((item) => {
    const original = fixture.clipLab.shorts.find(
      (candidate) => candidate.id === item.candidateId,
    );
    assert.ok(original);
    assert.ok(item.preferenceModifier >= -6);
    assert.ok(item.preferenceModifier <= 6);
    assert.equal(item.editPriority, original.editPriority);
    assert.deepEqual(plain(item.risk), plain(original.risk));
    assert.deepEqual(plain(item.evidence), plain(original.evidence));
    assert.deepEqual(plain(item.approval), plain(original.approval));
    assert.deepEqual(plain(item.canon), plain(original.canon));
    assert.deepEqual(plain(item.speaker), plain(original.speaker));
    assert.deepEqual(plain(item.rights), plain(original.rights));
    assert.deepEqual(
      plain(item.creatorApproval),
      plain(original.creatorApproval),
    );
    assert.notEqual(item.risk.label, "HOLD");
    assert.equal(item.excerpt.publicWordLimit, 16);
    assert.ok(item.excerpt.text.replace(/…$/, "").split(/\s+/).length <= 16);
  });
  const safety = artifact.metrics.safety;
  assert.match(safety.auditMethod, /compared with a fresh protected projection/i);
  assert.equal(safety.comparedCards, 24);
  assert.equal(safety.failClosed, true);
  for (const field of [
    "unknownCandidates",
    "holdOverrides",
    "baselineMutations",
    "sourceReceiptMutations",
    "contentMutations",
    "evidenceMutations",
    "riskMutations",
    "approvalMutations",
    "canonMutations",
    "speakerMutations",
    "rightsMutations",
    "creatorApprovalMutations",
    "protectedMutationTotal",
    "creatorApprovalClaims",
    "speakerClaims",
  ]) {
    assert.equal(safety[field], 0, field);
  }
  assert.equal(typeof artifact.metrics.shortlistDelta.positionChanges, "number");
  assert.equal(
    typeof artifact.metrics.shortlistDelta.medianAbsoluteRankMovement,
    "number",
  );
});

test("labels every profile as an unauthenticated local preference rather than creator approval", () => {
  const { engine } = makeEngine();
  const artifact = completeSession(engine).finalize();
  assert.equal(artifact.productLabel, "THE CUT TEST");
  assert.equal(artifact.operator.label, "LOCAL CUT OPERATOR");
  assert.equal(artifact.operator.authentication, "UNAUTHENTICATED LOCAL OPERATOR");
  assert.equal(artifact.operator.creatorApproval, false);
  assert.equal(artifact.operator.identityVerified, false);
  assert.equal(artifact.binding.goal, "shorts-calibration");
  assert.equal(artifact.binding.maxRisk, "MEDIUM");
  assert.match(artifact.binding.eligibleInventoryFingerprint, /^cti1-[0-9a-f]{8}$/);
  assert.equal(artifact.policy.goal, "shorts-calibration");
  assert.match(artifact.policy.goalBoundary, /does not silently filter/i);
  assert.match(artifact.status, /HUMAN APPROVAL NOT IMPLIED/);
  assert.match(artifact.preferenceModel.authorityBoundary, /not creator approval/i);
  assert.match(artifact.policy.checksumBoundary, /not a signature/i);
});

test("exports deterministically, restores byte-for-byte, and rejects ordinary tampering", () => {
  const { engine } = makeEngine();
  const firstSession = completeSession(engine, { wantedCategory: "CHAOS" });
  const secondSession = completeSession(engine, { wantedCategory: "CHAOS" });
  const first = firstSession.exportJSON();
  const second = secondSession.exportJSON();

  assert.equal(first, second);
  const parsed = JSON.parse(first);
  assert.match(parsed.fingerprint, /^ctp1-[0-9a-f]{8}$/);
  assert.match(parsed.checksum, /^ct1-[0-9a-f]{8}$/);
  assert.equal(engine.verify(first).ok, true);
  const restored = engine.restore(first);
  assert.equal(restored.exportJSON(), first);

  parsed.operator.label = "FORGED OPERATOR";
  assert.throws(
    () => engine.restore(parsed),
    (error) => error.code === "CHECKSUM_MISMATCH",
  );
  const report = engine.verify(parsed);
  assert.equal(report.ok, false);
  assert.equal(report.issues[0].code, "CHECKSUM_MISMATCH");
});

test("restore rejects foreign channel, ChannelPack, Clip Lab, risk gate, and inventory bindings", () => {
  const fixture = makeEngine();
  const exported = completeSession(fixture.engine).exportJSON();

  const foreignChannel = makeEngine({
    api: fixture.api,
    clipLab: fixture.clipLab,
    channelPack: makePack("another-channel", fixture.channelPack.fingerprint),
    adapter: fixture.adapter,
  }).engine;
  assert.equal(foreignChannel.verify(exported).issues[0].code, "FOREIGN_CHANNEL");

  const foreignPack = makeEngine({
    api: fixture.api,
    clipLab: fixture.clipLab,
    channelPack: makePack("fixture-channel", "cp1-another-pack"),
    adapter: fixture.adapter,
  }).engine;
  assert.equal(
    foreignPack.verify(exported).issues[0].code,
    "FOREIGN_CHANNEL_PACK",
  );

  const foreignClip = makeEngine({
    api: fixture.api,
    clipLab: makeClipLab({
      candidates: fixture.clipLab.shorts,
      inputFingerprint: "clip-another-snapshot",
    }),
    channelPack: fixture.channelPack,
    adapter: fixture.adapter,
  }).engine;
  assert.equal(foreignClip.verify(exported).issues[0].code, "FOREIGN_CLIP_LAB");

  const foreignGoal = makeEngine({
    api: fixture.api,
    clipLab: fixture.clipLab,
    channelPack: fixture.channelPack,
    adapter: fixture.adapter,
    goal: "long-form-compilation",
  }).engine;
  assert.equal(foreignGoal.verify(exported).issues[0].code, "FOREIGN_GOAL");

  const foreignRisk = makeEngine({
    api: fixture.api,
    clipLab: fixture.clipLab,
    channelPack: fixture.channelPack,
    adapter: fixture.adapter,
    maxRisk: "HIGH",
  }).engine;
  assert.equal(
    foreignRisk.verify(exported).issues[0].code,
    "FOREIGN_RISK_GATE",
  );

  const changedCandidates = plain(fixture.clipLab.shorts);
  changedCandidates[0].editPriority += 0.5;
  const changedInventory = makeEngine({
    api: fixture.api,
    clipLab: makeClipLab({
      candidates: changedCandidates,
      inputFingerprint: fixture.clipLab.inputFingerprint,
    }),
    channelPack: fixture.channelPack,
    adapter: fixture.adapter,
  }).engine;
  assert.equal(
    changedInventory.verify(exported).issues[0].code,
    "INVENTORY_CHANGED",
  );

  const changedEligibility = makeEngine({
    api: fixture.api,
    clipLab: {
      ...fixture.clipLab,
      getShorts(filters = {}) {
        return fixture.clipLab.getShorts(filters).slice(1);
      },
    },
    channelPack: fixture.channelPack,
    adapter: fixture.adapter,
  }).engine;
  assert.equal(
    changedEligibility.verify(exported).issues[0].code,
    "ELIGIBLE_INVENTORY_CHANGED",
  );
});

test("the descriptive goal is fingerprint-bound and goal tampering fails closed", () => {
  const fixture = makeEngine({ goal: "creator-shorts-sprint" });
  const exported = completeSession(fixture.engine).exportJSON();
  const artifact = JSON.parse(exported);

  assert.equal(artifact.binding.goal, "creator-shorts-sprint");
  assert.equal(artifact.policy.goal, "creator-shorts-sprint");
  assert.equal(fixture.engine.policy.goal, "creator-shorts-sprint");

  artifact.binding.goal = "forged-goal";
  assert.equal(fixture.engine.verify(artifact).ok, false);
  assert.equal(fixture.engine.verify(artifact).issues[0].code, "CHECKSUM_MISMATCH");
});

test("adapter-driven racing calibration uses the same engine with zero channel-specific leakage", () => {
  const api = loadApi();
  const racingCandidates = Array.from({ length: 28 }, (_, index) => {
    const sourceId = `race-${String(index % 14).padStart(2, "0")}`;
    return {
      id: `radio-cut-${index}`,
      kind: "broadcast-candidate",
      receiptId: `radio-receipt-${index}`,
      sourceId,
      receiptAt: 120 + index * 43,
      timecode: `LAP ${index + 1}`,
      receiptUrl: `https://racing.example/event/${sourceId}?t=${120 + index * 43}`,
      sourceTitle: `Championship Event ${index % 14}`,
      sourceType: "event-broadcast",
      sourceDate: `2026-06-${String((index % 20) + 1).padStart(2, "0")}`,
      category: index % 2 ? "OVERTAKE" : "PIT STRATEGY",
      topics: [
        {
          id: index % 2 ? "racecraft" : "strategy",
          label: index % 2 ? "RACECRAFT" : "STRATEGY",
        },
      ],
      drivers: [
        {
          id: `driver-${index % 6}`,
          label: `DRIVER ${index % 6}`,
        },
      ],
      durationSeconds: 20 + (index % 4) * 8,
      editPriority: 80 - index * 0.15,
      excerpt:
        "The lead battle changes at the braking marker while the booth tracks the developing strategy.",
      evidence: { label: "HIGH", evidenceLevel: "verified-event", score: 92 },
      risk: { label: index % 4 ? "LOW" : "MEDIUM", score: index % 4 ? 8 : 28 },
      approval: { status: "REVIEW REQUIRED" },
      canon: { status: "EVENT RECORD", certified: false },
    };
  });
  const clipLab = makeClipLab({
    candidates: racingCandidates,
    inputFingerprint: "racing-clip-snapshot",
  });
  const engine = api.create({
    clipLab,
    channelPack: makePack("neutral-racing", "cp1-neutral-racing"),
    adapter: {
      labels: {
        product: "RACE CONTROL CUT CALIBRATION",
        operator: "LOCAL LEAGUE EDITOR",
        round: "RADIO CHECK",
        optionA: "TAKE LEFT",
        optionB: "TAKE RIGHT",
        neither: "PASS BOTH",
        needsContext: "CHECK FULL LAP",
        baseline: "CONTROL TOWER TWELVE",
        calibrated: "EDITOR TWELVE",
        categoryFacet: "RACE MOMENT",
        topicFacet: "RACE TOPIC",
        entityFacet: "PARTICIPANT",
        runtimeFacet: "CUT LENGTH",
        sourceTypeFacet: "EVENT SOURCE",
      },
    },
  });
  const artifact = completeSession(engine, {
    wantedCategory: "OVERTAKE",
  }).finalize();
  const serialized = JSON.stringify(artifact);

  assert.equal(artifact.productLabel, "RACE CONTROL CUT CALIBRATION");
  assert.equal(artifact.operator.label, "LOCAL LEAGUE EDITOR");
  assert.ok(artifact.metrics.sampleCoverage.uniqueSources >= 8);
  assert.doesNotMatch(
    serialized,
    /wwam|loomis|horror|halloween|scream|up in ya|chall[iy]s/i,
  );
});
