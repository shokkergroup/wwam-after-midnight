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
    assert.ok(result.readiness.verifiedSoundbytes >= 5);
    assert.equal(
      result.readiness.timestampValidatedReceipts,
      result.readiness.verifiedSoundbytes,
    );
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

test("intent and subject parsing are deterministic", () => {
  const api = sandbox.window.WWAMCharacterEngine;
  assert.equal(api.detectIntent("How do I fix this?"), "advice");
  assert.equal(api.detectIntent("Who would you cast in the movie?"), "career");
  assert.equal(api.extractSubject("What do you think about Halloween Ends?"), "Halloween Ends");
  assert.equal(api.extractSubject("What should we do about AI?"), "AI");
  assert.equal(api.extractSubject("How should I deal with haunted Wi-Fi?"), "haunted Wi-Fi");
  assert.equal(api.extractSubject("What should I watch tonight?"), "tonight's watchlist");
  assert.equal(api.extractSubject("What movie should we watch?"), "the watchlist");
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
