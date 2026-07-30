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
    "tape-trivia-engine.js"
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
  return {
    window,
    showcase,
    lore,
    trivia: window.WWAMTapeTriviaEngine.create({ showcase, lore })
  };
}

function serial(value) {
  return JSON.parse(JSON.stringify(value));
}

test("indexes the expanded playable Lore corpus without synthetic source summaries", () => {
  const { trivia, showcase } = createEngines();

  assert.equal(trivia.version, "1.0.0");
  assert.ok(trivia.metrics.playableReceipts > showcase.metrics.receipts);
  assert.equal(trivia.metrics.playableReceipts, 955);
  assert.equal(trivia.metrics.indexedSources, 129);
  assert.equal(trivia.metrics.eligibleSources, 126);
  assert.equal(trivia.metrics.exactTimestampReceipts, 955);
  assert.equal(trivia.metrics.speakerQuestions, 0);
  assert.equal(trivia.metrics.syntheticQuotes, 0);
  assert.deepEqual(
    serial(trivia.evidencePolicy.excludedReceiptKinds),
    ["archive-source", "creator-context", "candidate-performance"]
  );
  assert.equal(trivia.evidencePolicy.evidenceBagReady, true);
  assert.equal(trivia.metrics.maxClueWords, 22);
});

test("seeded five- and ten-round sessions are deterministic and hide answers before submit", () => {
  const { trivia } = createEngines();
  for (const length of [5, 10]) {
    const options = { seed: "be-kind-rewind", length, difficulty: "mixed" };
    const first = trivia.createSession(options);
    const second = trivia.createSession(options);
    assert.deepEqual(serial(first.getState()), serial(second.getState()));

    const firstRounds = [];
    const secondRounds = [];
    for (let index = 0; index < length; index += 1) {
      firstRounds.push(first.getCurrentRound());
      secondRounds.push(second.getCurrentRound());
      const firstChoice = first.getCurrentRound().choices[0].id;
      const secondChoice = second.getCurrentRound().choices[0].id;
      first.submit(firstChoice);
      second.submit(secondChoice);
      first.next();
      second.next();
    }
    assert.deepEqual(serial(firstRounds), serial(secondRounds));
    assert.ok(firstRounds.every((round) => !("answerId" in round)));
    assert.equal(new Set(firstRounds.map((round) => round.id)).size, length);
  }
});

test("a five-round mixed session covers all five source-grounded game modes", () => {
  const { trivia } = createEngines();
  const session = trivia.createSession({
    seed: "five-finger-death-punch",
    length: 5,
    difficulty: "mixed"
  });
  const types = [];

  for (let index = 0; index < 5; index += 1) {
    const round = session.getCurrentRound();
    types.push(round.type);
    assert.match(round.typeLabel, /\?/);
    assert.match(round.speakerNotice, /never asks who said/i);
    assert.ok(round.clue.wordCount <= (round.type === "earlier-later" ? 44 : 22));
    session.submit(round.choices[0].id);
    session.next();
  }

  assert.deepEqual(types.slice().sort(), [
    "category",
    "earlier-later",
    "franchise",
    "movie",
    "source"
  ]);
});

test("every reveal resolves to exact playable Evidence Bag-compatible receipts", () => {
  const { trivia } = createEngines();
  const session = trivia.createSession({
    seed: "receipt-or-it-did-not-happen",
    length: 10,
    difficulty: "hard"
  });

  for (let index = 0; index < 10; index += 1) {
    const round = session.getCurrentRound();
    const result = session.submit(round.choices[0].id);
    assert.equal(result.accepted, true);
    assert.equal(result.reveal.accuracy.speakerClaimMade, false);
    assert.equal(result.reveal.accuracy.syntheticQuoteMade, false);
    assert.ok(result.reveal.receipts.length >= 1);
    assert.deepEqual(result.reveal.receipts, result.reveal.evidenceBag);
    for (const receipt of result.reveal.receipts) {
      assert.ok(receipt.receiptId);
      assert.ok(["commentary", "livestream"].includes(receipt.source));
      assert.equal(receipt.id, receipt.sourceId);
      assert.ok(Number.isFinite(receipt.at));
      assert.equal(receipt.at, receipt.t);
      assert.ok(receipt.title);
      assert.ok(receipt.category);
      assert.ok(receipt.excerpt);
      assert.equal(receipt.excerptWordLimit, 16);
      assert.equal(receipt.evidenceLevel, "TIMESTAMPED CAPTION RECEIPT");
      assert.equal(receipt.evidenceType, "caption-excerpt");
      assert.ok(
        receipt.excerpt.split(/\s+/).filter((word) => word !== "…").length <= 16,
        `receipt exceeded 16 words: ${receipt.excerpt}`,
      );
      assert.match(receipt.url, /^https:\/\/www\.youtube\.com\/watch\?v=.+&t=\d+s$/);
      assert.match(receipt.timecode, /^\d+:\d{2}(?::\d{2})?$/);
    }
    session.next();
  }

  const exported = session.exportSession();
  assert.equal(exported.evidencePolicy.excerptWordLimit, 16);
  assert.equal(
    exported.evidencePolicy.receiptEvidenceLevel,
    "TIMESTAMPED CAPTION RECEIPT",
  );
  for (const answer of exported.answers) {
    for (const receipt of answer.reveal.receipts) {
      assert.ok(
        receipt.excerpt.split(/\s+/).filter((word) => word !== "…").length <= 16,
      );
      assert.equal(receipt.evidenceType, "caption-excerpt");
    }
  }
});

test("franchise, category, difficulty, and round-type filters constrain the evidence", () => {
  const { trivia } = createEngines();
  const metrics = trivia.getPoolMetrics({
    franchise: "Halloween",
    category: "OUT OF POCKET"
  });
  assert.ok(metrics.receipts > 5);
  assert.ok(metrics.sources > 3);

  const session = trivia.createSession({
    seed: "haddonfield-after-hours",
    length: 10,
    difficulty: "hard",
    franchise: "Halloween",
    category: "OUT OF POCKET",
    questionTypes: ["source", "movie", "franchise", "category"]
  });
  for (let index = 0; index < 10; index += 1) {
    const round = session.getCurrentRound();
    assert.equal(round.difficulty, "hard");
    assert.ok(["source", "movie", "franchise", "category"].includes(round.type));
    const result = session.submit(round.choices[0].id);
    for (const receipt of result.reveal.receipts) {
      assert.equal(receipt.category, "OUT OF POCKET");
      assert.equal(receipt.source, "commentary");
    }
    if (round.type === "franchise") assert.equal(result.reveal.answer.label, "Halloween");
    if (round.type === "category") assert.equal(result.reveal.answer.label, "OUT OF POCKET");
    session.next();
  }
});

test("streak scoring is deterministic, rewards consecutive answers, and resets on a miss", () => {
  const { trivia } = createEngines();
  const session = trivia.createSession({
    seed: "score-the-gore",
    length: 5,
    difficulty: "easy",
    questionTypes: ["franchise"]
  });

  const firstRound = session.getCurrentRound();
  let firstCorrect = null;
  for (const option of firstRound.choices) {
    const trial = trivia.createSession({
      seed: "score-the-gore",
      length: 5,
      difficulty: "easy",
      questionTypes: ["franchise"]
    });
    const result = trial.submit(option.id);
    if (result.correct) firstCorrect = option.id;
  }
  const first = session.submit(firstCorrect);
  assert.equal(first.points, 100);
  assert.equal(first.streak, 1);
  session.next();

  const secondRound = session.getCurrentRound();
  const replay = trivia.createSession({
    seed: "score-the-gore",
    length: 5,
    difficulty: "easy",
    questionTypes: ["franchise"]
  });
  replay.submit(firstCorrect);
  replay.next();
  let secondCorrect = null;
  for (const option of secondRound.choices) {
    const cloned = trivia.createSession({
      seed: "score-the-gore",
      length: 5,
      difficulty: "easy",
      questionTypes: ["franchise"]
    });
    cloned.submit(firstCorrect);
    cloned.next();
    const result = cloned.submit(option.id);
    if (result.correct) secondCorrect = option.id;
  }
  const second = session.submit(secondCorrect);
  assert.equal(second.points, 115);
  assert.equal(second.streak, 2);
  session.next();

  const thirdRound = session.getCurrentRound();
  const wrongChoice = thirdRound.choices.find((option) => {
    const probe = trivia.createSession({
      seed: "score-the-gore",
      length: 5,
      difficulty: "easy",
      questionTypes: ["franchise"]
    });
    probe.submit(firstCorrect);
    probe.next();
    probe.submit(secondCorrect);
    probe.next();
    return !probe.submit(option.id).correct;
  });
  const third = session.submit(wrongChoice.id);
  assert.equal(third.points, 0);
  assert.equal(third.streak, 0);
  assert.equal(third.bestStreak, 2);
});

test("earlier-vs-later reveals both sides and explains archive order or tape order", () => {
  const { trivia } = createEngines();
  for (const difficulty of ["easy", "hard"]) {
    const session = trivia.createSession({
      seed: "before-or-after-" + difficulty,
      length: 5,
      difficulty,
      questionTypes: ["earlier-later"]
    });
    const round = session.getCurrentRound();
    assert.equal(round.type, "earlier-later");
    assert.equal(round.clue.cards.length, 2);
    assert.equal(round.choices.length, 2);
    const result = session.submit(round.choices[0].id);
    assert.equal(result.reveal.receipts.length, 2);
    assert.match(
      result.reveal.explanation,
      difficulty === "easy" ? /indexed archive date|appears first/i : /appears first/i
    );
  }
});

test("invalid sessions fail clearly and a showcase-only fallback remains playable", () => {
  const { window, showcase } = createEngines();
  const trivia = window.WWAMTapeTriviaEngine.create({ showcase });
  assert.equal(trivia.metrics.playableReceipts, showcase.receipts.length);
  assert.throws(() => trivia.createSession({ length: 7 }), /5 or 10/);
  assert.throws(
    () => trivia.createSession({ length: 5, difficulty: "nightmare-plus" }),
    /Unknown Tape Trivia difficulty/
  );
  assert.throws(
    () =>
      trivia.createSession({
        length: 5,
        franchise: "The Franchise That Does Not Exist"
      }),
    /No indexed caption receipts/
  );
});
