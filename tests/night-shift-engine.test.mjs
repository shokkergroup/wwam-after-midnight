import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "lore-engine.js",
    "tape-trivia-engine.js",
    "night-shift-engine.js"
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file
    });
  }
  return context.window;
}

function createEngines() {
  const window = load();
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  });
  const lore = window.WWAMLoreEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE
  });
  const trivia = window.WWAMTapeTriviaEngine.create({ showcase, lore });
  const night = window.WWAMNightShiftEngine.create({
    showcase,
    lore,
    trivia,
    today: "2026-07-23"
  });
  return { window, showcase, lore, trivia, night };
}

function serial(value) {
  return JSON.parse(JSON.stringify(value));
}

function receiptKey(receipt) {
  return `${receipt.sourceId}|${Math.round(receipt.t ?? receipt.at)}`;
}

function choiceId(beat) {
  const interaction = beat.interaction;
  return interaction.type === "trivia"
    ? interaction.round.choices[0].id
    : interaction.choices[0].id;
}

function reducedShowcase(sourceLimit = 2) {
  const sources = [
    {
      id: "reduced-new",
      type: "livestream",
      title: "Reduced New Tape",
      date: "2026-07-20",
      franchise: "Scream"
    },
    {
      id: "reduced-old",
      type: "commentary",
      title: "Reduced Old Tape",
      date: "2026-07-01",
      franchise: "Halloween"
    }
  ].slice(0, sourceLimit);
  const allowed = new Set(sources.map((source) => source.id));
  const receipts = [
    {
      id: "reduced-new:10",
      sourceId: "reduced-new",
      sourceType: "livestream",
      sourceTitle: "Reduced New Tape",
      date: "2026-07-20",
      t: 10,
      url: "https://www.youtube.com/watch?v=reduced-new&t=10s",
      category: "TOPIC",
      excerpt: "A bounded newest-source caption receipt for the reduced archive."
    },
    {
      id: "reduced-new:30",
      sourceId: "reduced-new",
      sourceType: "livestream",
      sourceTitle: "Reduced New Tape",
      date: "2026-07-20",
      t: 30,
      url: "https://www.youtube.com/watch?v=reduced-new&t=30s",
      category: "COMEDY MOMENT",
      excerpt: "A second playable caption receipt gives the compact shift room to rotate."
    },
    {
      id: "reduced-old:20",
      sourceId: "reduced-old",
      sourceType: "commentary",
      sourceTitle: "Reduced Old Tape",
      date: "2026-07-01",
      t: 20,
      url: "https://www.youtube.com/watch?v=reduced-old&t=20s",
      category: "ARCHIVE CALLBACK",
      excerpt: "An older bounded caption receipt supports an honest archive callback."
    }
  ].filter((receipt) => allowed.has(receipt.sourceId));
  return {
    snapshotDate: "2026-07-20",
    inputFingerprint: `reduced-${sourceLimit}`,
    sources,
    receipts,
    getRiffChemistry() {
      return { moments: [] };
    }
  };
}

test("publishes a small stable API over the full source-grounded inventory", () => {
  const { window, night } = createEngines();

  assert.equal(window.WWAMNightShiftEngine.VERSION, "1.0.0");
  assert.equal(window.WWAMNightShiftEngine.PROGRESS_SCHEMA, "wwam-night-shift-progress/v1");
  assert.deepEqual(
    serial(window.WWAMNightShiftEngine.REQUIRED_ROLES),
    [
      "latest-indexed-source",
      "archive-callback",
      "playable-receipt",
      "trivia-or-choice",
      "closing-payoff"
    ]
  );
  assert.deepEqual(
    serial(night.modes.map((mode) => mode.id)),
    ["lore", "chaos", "franchise"]
  );
  assert.equal(night.metrics.indexedSources, 74);
  assert.equal(night.metrics.playableReceipts, 872);
  assert.equal(night.metrics.datedPlayableSources, 71);
  assert.equal(night.metrics.loreEntries, 177);
  assert.equal(night.metrics.triviaAvailable, true);
  assert.match(night.metrics.archiveFingerprint, /^[0-9a-f]{8}$/);
  assert.equal(night.metrics.snapshotDate, "2026-07-23");
  assert.deepEqual(
    Object.keys(night).sort(),
    [
      "createDaily",
      "createFromSeed",
      "createProgress",
      "engine",
      "evidencePolicy",
      "getSnapshotState",
      "metrics",
      "modes",
      "parseSeed",
      "product",
      "resolveChoice",
      "restoreProgress",
      "version"
    ]
  );
});

test("same date, mode, archive, and variant produce the exact same shareable journey", () => {
  const { night } = createEngines();
  const options = {
    date: "2026-07-23",
    mode: "lore",
    variant: "midnight-club"
  };
  const first = night.createDaily(options);
  const second = night.createDaily(options);

  assert.deepEqual(serial(first), serial(second));
  assert.equal(first.beats.length, 5);
  assert.equal(first.scope.latestSourceId, "LV2rmwEA0w4");
  assert.equal(first.scope.indexedThrough, "2026-07-23");
  assert.equal(
    first.seed,
    `night-shift-v1|2026-07-23|lore|ANY|midnight-club|${night.metrics.archiveFingerprint}`
  );
  assert.equal(first.share.recreationMethod, "createFromSeed(seed)");
  assert.deepEqual(
    serial(first.rolesCovered),
    [
      "latest-indexed-source",
      "archive-callback",
      "playable-receipt",
      "trivia-or-choice",
      "closing-payoff"
    ]
  );
  assert.deepEqual(serial(night.createFromSeed(first.seed)), serial(first));

  const interaction = first.beats.find((beat) => beat.interaction).interaction;
  assert.equal(interaction.answerFieldsHidden, true);
  assert.equal(interaction.correctAnswerIncluded, false);
  assert.equal(interaction.playableReceiptMayRevealAnswer, true);
  assert.equal(interaction.honorSystem, true);
  assert.equal("answer" in interaction.round, false);
  assert.equal("answerId" in interaction.round, false);
});

test("date changes alter the deterministic rotation and preserve recreation", () => {
  const { night } = createEngines();
  const first = night.createDaily({ date: "2026-07-23", mode: "lore" });
  const next = night.createDaily({ date: "2026-07-24", mode: "lore" });

  assert.notEqual(first.seed, next.seed);
  assert.notEqual(first.id, next.id);
  assert.notDeepEqual(
    first.beats.flatMap((beat) => beat.receiptIds),
    next.beats.flatMap((beat) => beat.receiptIds)
  );
  assert.deepEqual(serial(night.createFromSeed(next.seed)), serial(next));
});

test("lore, chaos, and franchise modes make materially different grounded journeys", () => {
  const { night, showcase } = createEngines();
  const loreJourney = night.createDaily({
    date: "2026-07-23",
    mode: "lore"
  });
  const chaosJourney = night.createDaily({
    date: "2026-07-23",
    mode: "chaos"
  });
  const franchiseJourney = night.createDaily({
    date: "2026-07-23",
    mode: "franchise",
    franchise: "Halloween"
  });

  const loreCallback = loreJourney.beats.find((beat) =>
    beat.roles.includes("archive-callback")
  );
  assert.ok(loreCallback.integrations.includes("WWAM Lore Engine"));
  assert.ok(loreCallback.loreEntryId);

  assert.ok(chaosJourney.beats.some((beat) =>
    beat.integrations.some((integration) => /Riff Chemistry/.test(integration))
  ));
  assert.equal(franchiseJourney.franchise, "Halloween");
  assert.notEqual(loreJourney.seed, chaosJourney.seed);
  assert.notEqual(chaosJourney.seed, franchiseJourney.seed);

  const sourceById = new Map(showcase.sources.map((source) => [source.id, source]));
  for (const receipt of franchiseJourney.beats.flatMap((beat) => beat.evidence)) {
    assert.equal(sourceById.get(receipt.sourceId).franchise, "Halloween");
  }

  for (const beatCount of [3, 4, 5]) {
    const journey = night.createDaily({
      date: "2026-07-23",
      mode: "chaos",
      beatCount
    });
    assert.equal(journey.beats.length, beatCount);
    assert.deepEqual(
      new Set(journey.rolesCovered),
      new Set([
        "latest-indexed-source",
        "archive-callback",
        "playable-receipt",
        "trivia-or-choice",
        "closing-payoff"
      ])
    );
  }
});

test("every beat has playable bounded evidence that resolves to an indexed receipt", () => {
  const { night, showcase, lore } = createEngines();
  const journey = night.createDaily({ date: "2026-07-23", mode: "lore" });
  const indexed = new Set(
    showcase.receipts.concat(lore.receipts).map(receiptKey)
  );

  for (const beat of journey.beats) {
    assert.equal(beat.playable, true);
    assert.ok(beat.evidence.length >= 1);
    assert.equal(beat.evidenceCount, beat.evidence.length);
    assert.equal(beat.claimBoundary.speakerClaimMade, false);
    assert.equal(beat.claimBoundary.trueOriginClaim, false);
    assert.equal(beat.claimBoundary.syntheticQuoteMade, false);
    for (const receipt of beat.evidence) {
      assert.ok(indexed.has(receiptKey(receipt)), `unindexed receipt ${receipt.receiptId}`);
      assert.match(receipt.url, /^https:\/\/www\.youtube\.com\/watch\?v=.+&t=\d+s$/);
      assert.ok(receipt.excerptWordCount <= 16);
      assert.equal(receipt.excerptWordLimit, 16);
      assert.equal(receipt.evidenceLevel, "TIMESTAMPED CAPTION RECEIPT");
      assert.equal(receipt.evidenceType, "caption-excerpt");
      assert.equal(receipt.speaker, null);
      assert.equal(receipt.speakerStatus, "not-diarized");
      assert.equal(receipt.trueOriginClaim, false);
      assert.equal(receipt.syntheticQuote, false);
    }
  }
  assert.equal(journey.metrics.speakerClaims, 0);
  assert.equal(journey.metrics.trueOriginClaims, 0);
  assert.equal(journey.metrics.syntheticQuotes, 0);
});

test("snapshot copy names the exact indexed-through date and goes stale explicitly", () => {
  const { night } = createEngines();
  const current = night.getSnapshotState("2026-07-23");
  const recent = night.getSnapshotState("2026-07-30");
  const stale = night.getSnapshotState("2026-08-23");

  assert.equal(current.status, "current");
  assert.equal(current.ageDays, 0);
  assert.equal(current.isStale, false);
  assert.equal(recent.status, "recent");
  assert.equal(recent.ageDays, 7);
  assert.equal(recent.isStale, false);
  assert.equal(stale.status, "stale");
  assert.equal(stale.ageDays, 31);
  assert.equal(stale.isStale, true);
  assert.match(stale.notice, /indexed through 2026-07-23/);
  assert.match(stale.notice, /Newer uploads may be missing/);

  const staleJourney = night.createDaily({
    date: "2026-08-23",
    mode: "chaos"
  });
  assert.equal(staleJourney.snapshot.isStale, true);
  assert.ok(staleJourney.limitations.includes(staleJourney.snapshot.notice));
  assert.equal(staleJourney.status, "ready-with-boundaries");
});

test("ordered progress requires a grounded choice and restores only untampered state", () => {
  const { night } = createEngines();
  const journey = night.createDaily({ date: "2026-07-23", mode: "lore" });
  const progress = night.createProgress(journey);

  assert.equal(progress.getState().progress.percent, 0);
  while (!progress.getCurrentBeat().interaction) {
    assert.equal(progress.completeCurrent().accepted, true);
  }

  const interactionBeat = progress.getCurrentBeat();
  const beforeChoice = progress.exportState();
  const restored = night.restoreProgress(journey, beforeChoice);
  assert.deepEqual(restored.getState(), beforeChoice);
  assert.deepEqual(restored.getCurrentBeat(), interactionBeat);

  const missing = progress.completeCurrent();
  assert.equal(missing.accepted, false);
  assert.equal(missing.reason, "choice-required");
  assert.equal(progress.getState().currentBeatId, interactionBeat.id);

  const selected = progress.completeCurrent({
    choiceId: choiceId(interactionBeat)
  });
  assert.equal(selected.accepted, true);
  assert.equal(selected.response.choiceId, choiceId(interactionBeat));
  assert.ok(selected.response.evidence.length >= 1);
  while (!progress.getState().complete) {
    assert.equal(progress.completeCurrent().accepted, true);
  }
  assert.equal(progress.getState().progress.percent, 100);
  assert.equal(progress.getState().progress.completed, journey.beats.length);

  const tamperedOrder = serial(beforeChoice);
  tamperedOrder.completedBeatIds[0] = journey.beats[1].id;
  assert.throws(
    () => night.restoreProgress(journey, tamperedOrder),
    /untampered ordered beat prefix/
  );
  const missingResponse = serial(beforeChoice);
  delete missingResponse.responses[missingResponse.completedBeatIds[0]];
  assert.throws(
    () => night.restoreProgress(journey, missingResponse),
    /missing an accepted response/
  );
});

test("restore recomputes trivia responses and rejects forged results, explanations, or choice IDs", () => {
  const { night } = createEngines();
  const journey = night.createDaily({
    date: "2026-07-23",
    mode: "franchise",
    franchise: "Scream"
  });
  const progress = night.createProgress(journey);
  while (!progress.getCurrentBeat().interaction) {
    progress.completeCurrent();
  }
  const beat = progress.getCurrentBeat();
  assert.equal(beat.interaction.type, "trivia");
  const chosen = choiceId(beat);
  const completed = progress.completeCurrent({ choiceId: chosen });
  assert.equal(completed.accepted, true);
  assert.equal(completed.response.choiceId, chosen);
  const saved = progress.exportState();

  const forgedResult = serial(saved);
  forgedResult.responses[beat.id].correct =
    !forgedResult.responses[beat.id].correct;
  assert.throws(
    () => night.restoreProgress(journey, forgedResult),
    /does not match the canonical beat result/
  );

  const forgedExplanation = serial(saved);
  forgedExplanation.responses[beat.id].explanation =
    "A fabricated result that never came from Tape Trivia.";
  assert.throws(
    () => night.restoreProgress(journey, forgedExplanation),
    /does not match the canonical beat result/
  );

  const alternate = beat.interaction.round.choices.find(
    (choice) => choice.id !== chosen
  );
  assert.ok(alternate);
  const forgedChoice = serial(saved);
  forgedChoice.responses[beat.id].choiceId = alternate.id;
  assert.throws(
    () => night.restoreProgress(journey, forgedChoice),
    /does not match the canonical beat result/
  );
});

test("restore rejects forged acknowledgment payloads", () => {
  const { night } = createEngines();
  const journey = night.createDaily({ date: "2026-07-23", mode: "chaos" });
  const progress = night.createProgress(journey);
  const beat = progress.getCurrentBeat();
  assert.equal(Boolean(beat.interaction), false);
  progress.completeCurrent();
  const saved = progress.exportState();
  saved.responses[beat.id].explanation = "Injected after completion.";
  assert.throws(
    () => night.restoreProgress(journey, saved),
    /does not match the canonical beat result/
  );
});

test("choice resolution returns receipts and never adds speaker, origin, or synthetic-quote claims", () => {
  const { night } = createEngines();
  const journey = night.createDaily({
    date: "2026-07-23",
    mode: "franchise",
    franchise: "Scream"
  });
  const beat = journey.beats.find((candidate) => candidate.interaction);
  const result = night.resolveChoice(journey, beat.id, choiceId(beat));

  assert.equal(result.accepted, true);
  assert.equal(result.provider, "WWAM Tape Trivia");
  assert.ok(result.evidence.length >= 1);
  assert.equal(result.accuracy.speakerClaimMade, false);
  assert.equal(result.accuracy.trueOriginClaim, false);
  assert.equal(result.accuracy.syntheticQuoteMade, false);
  for (const receipt of result.evidence) {
    assert.match(receipt.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.equal(receipt.speaker, null);
  }

  const safeCopy = journey.beats.map((candidate) => [
    candidate.title,
    candidate.kicker,
    candidate.copy
  ].join(" ")).join(" ");
  assert.doesNotMatch(safeCopy, /\b(?:Mike|J)\s+(?:said|says|told|claimed)\b/i);
  assert.doesNotMatch(safeCopy, /\b(?:coined|started|originated)\s+here\b/i);
  assert.doesNotMatch(safeCopy, /\bdefinitive\s+origin\b/i);
});

test("reduced source availability becomes a compact preference journey and fails closed below two sources", () => {
  const window = load();
  const night = window.WWAMNightShiftEngine.create({
    showcase: reducedShowcase(),
    today: "2026-07-20"
  });
  const journey = night.createDaily({
    date: "2026-07-20",
    mode: "lore"
  });

  assert.equal(journey.beats.length, 3);
  assert.equal(journey.status, "ready-with-boundaries");
  assert.deepEqual(
    new Set(journey.rolesCovered),
    new Set([
      "latest-indexed-source",
      "archive-callback",
      "playable-receipt",
      "trivia-or-choice",
      "closing-payoff"
    ])
  );
  const interactionBeat = journey.beats.find((beat) => beat.interaction);
  assert.equal(interactionBeat.interaction.type, "preference");
  assert.equal(interactionBeat.interaction.noCorrectAnswer, true);
  assert.ok(interactionBeat.interaction.choices.length >= 2);
  assert.ok(journey.limitations.some((message) => /Lore Engine unavailable/.test(message)));
  assert.ok(journey.limitations.some((message) => /Tape Trivia unavailable/.test(message)));
  assert.ok(journey.beats.every((beat) => beat.playable));

  const selected = night.resolveChoice(
    journey,
    interactionBeat.id,
    interactionBeat.interaction.choices[0].id
  );
  assert.equal(selected.accepted, true);
  assert.equal(selected.correct, null);
  assert.equal(selected.answer, null);

  const tooSmall = window.WWAMNightShiftEngine.create({
    showcase: reducedShowcase(1),
    today: "2026-07-20"
  });
  assert.throws(
    () => tooSmall.createDaily({ date: "2026-07-20", mode: "lore" }),
    /at least two dated playable sources/
  );
});

test("invalid dates, modes, beat counts, franchises, and foreign snapshots are rejected", () => {
  const { night } = createEngines();
  assert.throws(
    () => night.createDaily({ date: "2026-02-30", mode: "lore" }),
    /real YYYY-MM-DD/
  );
  assert.throws(
    () => night.createDaily({ date: "2026-07-23", mode: "random" }),
    /Unknown Night Shift mode/
  );
  assert.throws(
    () => night.createDaily({ date: "2026-07-23", mode: "lore", beatCount: 2 }),
    /integer from 3 through 5/
  );
  assert.throws(
    () => night.createDaily({
      date: "2026-07-23",
      mode: "franchise",
      franchise: "Made Up Franchise"
    }),
    /Unknown Night Shift franchise/
  );
  assert.throws(
    () => night.createFromSeed(
      "night-shift-v1|2026-07-23|lore|ANY|daily|different"
    ),
    /different archive snapshot/
  );
  assert.throws(
    () => night.createFromSeed("not-a-night-shift"),
    /Invalid Night Shift share seed/
  );
});
