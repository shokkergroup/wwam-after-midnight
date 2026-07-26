import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ["character-lore.js", "character-engine.js"]) {
  vm.runInContext(fs.readFileSync(new URL(`../public/demo/${file}`, import.meta.url), "utf8"), sandbox, { filename: file });
}

const engine = sandbox.window.WWAMCharacterEngine.create(sandbox.window.WWAM_CHARACTER_LORE);

test("routes questions through character-specific grounded behavior", () => {
  const cases = [
    ["loomis", "What should I do if my smart doorbell sees Michael?", "danger"],
    ["challis", "What do you think about dating after midnight?", "opinion"],
    ["slenderman", "Is artificial intelligence dangerous?", "danger"],
    ["corey-feldman", "Would you take the casting role in a Batman sequel?", "career"],
  ];
  for (const [id, question, expectedIntent] of cases) {
    const result = engine.answer(id, question);
    assert.equal(result.ok, true);
    assert.equal(result.intent, expectedIntent);
    assert.match(result.disclaimer, /NOT AN ARCHIVAL QUOTE/);
    assert.ok(result.ingredients.length >= 2);
    assert.ok(result.receipt?.sourceId);
    assert.equal(result.receipt.playback.clipSeconds, 14);
    assert.ok(result.readiness.timestampValidatedReceipts >= 5);
    assert.equal(result.readiness.authenticatedEditorVerifiedDecisions, 0);
    assert.equal("verifiedSoundbytes" in result.readiness, false);
    assert.equal(result.readiness.clipSpeakersDiarized, false);
    assert.match(result.readiness.basis, /clip speakers are not diarized/i);
  }
});

test("keeps short follow-ups on the previous subject", () => {
  const first = engine.answer("loomis", "What do you think about artificial intelligence?");
  const follow = engine.answer("loomis", "Why is that?", first);
  assert.equal(follow.continuedFrom, true);
  assert.equal(follow.subject, first.subject);
  const tomorrow = engine.answer("loomis", "And tomorrow?", first);
  assert.equal(tomorrow.continuedFrom, true);
  assert.equal(tomorrow.subject, first.subject);
});

test("Corey output keeps rival claims visibly fictional", () => {
  for (const question of ["Why did Tom Cruise get that role?", "Could you replace Batman?", "What about the internet?"]) {
    const result = engine.answer("corey-feldman", question);
    assert.equal(result.ok, true);
    if (/wolf pack/i.test(result.text)) assert.match(result.text, /fictional/i);
    assert.doesNotMatch(result.text, /\bTom Cruise (blocked|stole|sabotaged|interfered)\b/i);
  }
});

test("does not enable unverifiable locked candidates", () => {
  const result = engine.answer("marky-mark", "What is your workout?");
  assert.equal(result.ok, false);
  assert.match(result.error, /locked/i);
});

test("grounding rejects truthy-but-inexact provenance and enforces the candidate minimum", () => {
  const original = sandbox.window.WWAM_CHARACTER_LORE.characters.find(
    (profile) => profile.id === "loomis"
  );
  const invalidProvenance = [
    { timestampStatus: "estimated" },
    {
      timestampStatus: "exact-caption-event",
      selection: "machine-curated candidate"
    },
    { timestampStatus: "reviewed" }
  ];
  const unsafeLore = {
    guardrails: sandbox.window.WWAM_CHARACTER_LORE.guardrails,
    characters: [
      {
        ...original,
        soundbytes: invalidProvenance.map((override, index) => ({
          ...original.soundbytes[index],
          provenance: {
            ...original.soundbytes[index].provenance,
            ...override
          }
        }))
      }
    ]
  };
  const unsafe = sandbox.window.WWAMCharacterEngine.create(unsafeLore);
  const rejected = unsafe.answer("loomis", "What about the front door?");
  assert.equal(rejected.ok, false);
  assert.equal(rejected.status, "insufficient-grounding");

  const tooSmallLore = {
    guardrails: sandbox.window.WWAM_CHARACTER_LORE.guardrails,
    characters: [
      {
        ...original,
        soundbytes: original.soundbytes.slice(0, 2)
      }
    ]
  };
  const tooSmall = sandbox.window.WWAMCharacterEngine.create(tooSmallLore);
  const held = tooSmall.answer("loomis", "What about the front door?");
  assert.equal(held.ok, false);
  assert.match(held.error, /at least 3/i);
});

test("public shelf rejects non-performance and ineligible playback receipts", () => {
  const original = sandbox.window.WWAM_CHARACTER_LORE.characters.find(
    (profile) => profile.id === "loomis"
  );
  const poisoned = original.soundbytes.slice(0, 3).map((receipt, index) => {
    if (index === 0) return { ...receipt, classification: "mere-mention" };
    if (index === 1) return { ...receipt, playability: { ...receipt.playability, status: "unavailable" } };
    return { ...receipt, playability: { ...receipt.playability, provider: "other" } };
  });
  const unsafe = sandbox.window.WWAMCharacterEngine.create({
    guardrails: sandbox.window.WWAM_CHARACTER_LORE.guardrails,
    characters: [{ ...original, soundbytes: poisoned }],
  });
  const result = unsafe.answer("loomis", "What about the front door?");
  assert.equal(result.ok, false);
  assert.equal(result.status, "insufficient-grounding");
});

test("intent and subject parsing are deterministic", () => {
  const api = sandbox.window.WWAMCharacterEngine;
  assert.equal(api.detectIntent("How do I fix this?"), "advice");
  assert.equal(api.detectIntent("Who would you cast in the movie?"), "career");
  assert.equal(api.extractSubject("What do you think about Halloween Ends?"), "Halloween Ends");
  assert.equal(api.extractSubject("What should we do about AI?"), "AI");
  assert.equal(api.extractSubject("How should I deal with haunted Wi-Fi?"), "haunted Wi-Fi");
  assert.equal(api.extractSubject("What should I watch tonight?"), "tonight's watchlist");
  assert.equal(api.extractSubject("What movie should we watch?"), "the watchlist");
  assert.equal(api.extractSubject("What do you think?"), "this entire situation");
  assert.equal(api.extractSubject("How do you feel?"), "this entire situation");
  assert.equal(
    JSON.stringify(engine.answer("slenderman", "What about phones?")),
    JSON.stringify(engine.answer("slenderman", "What about phones?")),
  );
});

test("ordinary watch recommendations stay grammatical in every enabled voice", () => {
  for (const id of ["loomis", "challis", "slenderman", "corey-feldman"]) {
    const result = engine.answer(id, "What should I watch tonight?");
    assert.equal(result.ok, true, id);
    assert.equal(result.intent, "advice", id);
    assert.equal(result.subject, "tonight's watchlist", id);
    assert.match(result.text, /tonight's watchlist/i, id);
    assert.doesNotMatch(result.text, /\bI watch tonight\b/i, id);
    assert.doesNotMatch(result.text, /\breviewed I\b|\bme I\b/i, id);
  }
});


test("exposes the complete timestamp-validated tape shelf for every enabled character", () => {
  const expected = {
    loomis: 15,
    challis: 15,
    slenderman: 15,
    "corey-feldman": 15,
  };
  for (const [id, count] of Object.entries(expected)) {
    const library = engine.getReceiptLibrary(id);
    assert.equal(library.ok, true, id);
    assert.equal(library.total, count, id);
    assert.equal(library.receipts.length, count, id);
    assert.equal(library.speakerStatus, "not-diarized", id);
    assert.ok(library.receipts.every((receipt, index) =>
      receipt.libraryIndex === index + 1 &&
      receipt.libraryTotal === count &&
      receipt.evidenceState === "timestamp-validated-human-curated-candidate" &&
      receipt.speakerStatus === "not-diarized"
    ), id);
  }
  const unknown = engine.getReceiptLibrary("not-a-character");
  assert.equal(unknown.ok, false);
  assert.equal(unknown.receipts.length, 0);
});

test("repeated broad questions rotate tied source clips without weakening exact matches", () => {
  let previous = null;
  const seen = [];
  for (let index = 0; index < 6; index += 1) {
    const answer = engine.answer("loomis", "Tell me about the situation.", previous);
    assert.equal(answer.ok, true);
    if (previous) assert.notEqual(answer.receipt.id, previous.receipt.id);
    assert.ok(answer.receiptHistory.length <= 3);
    seen.push(answer.receipt.id);
    previous = answer;
  }
  assert.ok(new Set(seen).size > 1);

  const exact = engine.answer("loomis", "Why does the government refuse Loomis funding?");
  const exactAgain = engine.answer(
    "loomis",
    "Why does the government refuse Loomis funding?",
    exact,
  );
  assert.equal(exact.receipt.id, "loomis-funding");
  assert.equal(exactAgain.receipt.id, "loomis-funding");
});
