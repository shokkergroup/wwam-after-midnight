import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const ROOT = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(
  path.join(ROOT, "public", "demo", "halloween-commentary-enrichment.js"),
  "utf8",
);
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);
const payload = context.window.WWAM_HALLOWEEN_COMMENTARY_ENRICHMENT;

function words(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

test("every captioned Halloween commentary receives an enrichment record", () => {
  assert.equal(payload.schema, "wwam-halloween-commentary-enrichment/v1");
  assert.equal(payload.generated, "2026-07-26");
  assert.equal(payload.meta.commentaries, 12);
  assert.equal(payload.meta.wordsAudited, 185175);
  assert.equal(payload.meta.captionEvents, 26549);
  assert.equal(payload.meta.topicDoors, 119);
  assert.equal(payload.meta.legacyUpInYa, 15);
  assert.equal(payload.meta.strictSteve, 4);
  assert.equal(payload.records.length, 12);
  assert.equal(new Set(payload.records.map((record) => record.id)).size, 12);
});

test("commentary wikis gain scene doors without fabricating speaker identity", () => {
  for (const record of payload.records) {
    assert.ok(record.topics.length >= 9, record.id);
    assert.ok(record.bestMoments.length > 0, record.id);
    assert.match(record.summary, /scene\/topic doors/i);
    assert.match(record.evidenceBoundary, /do not establish speaker identity/i);
    for (const topic of record.topics) {
      assert.ok(Number.isFinite(topic.peak));
      if (topic.receipt) assert.ok(words(topic.receipt) <= 16, `${record.id}:${topic.name}`);
      assert.equal(topic.evidence.originStatus, "not-established-between-commentary-and-film-audio");
    }
  }
});

test("Loomis and Challis remain reference lanes, never inferred performances", () => {
  const all = payload.records.flatMap((record) => record.characters);
  const loomis = all.filter((item) => item.character === "Dr. Loomis");
  const challis = all.filter((item) => item.character === "Dr. Challis");
  assert.equal(loomis.reduce((sum, item) => sum + item.mentions, 0), 171);
  assert.equal(challis.reduce((sum, item) => sum + item.mentions, 0), 1);
  for (const character of all) {
    assert.equal(character.performanceCues, 0);
    assert.equal(character.performanceStatus, "not-established-from-automatic-captions");
    assert.match(character.status, /reference candidate/i);
  }
});

test("legacy UP IN YA and strict Steve ledgers retain exact source timestamps", () => {
  const up = payload.records.flatMap((record) =>
    record.upInYaLegacy.map((receipt) => `${record.id}@${receipt.t}`),
  );
  assert.equal(up.length, 15);
  assert.ok(up.includes("I6QKteG_hK0@2646"));
  assert.ok(up.includes("4UokRLETypU@6233"));

  const steve = payload.records.flatMap((record) =>
    record.stevesAsshole.map((receipt) => `${record.id}@${receipt.t}`),
  ).sort();
  assert.equal(
    steve.join("|"),
    [
      "28PfRNKoSCA@980",
      "AtcRT3Xkk6E@1327",
      "M2iupVAFWt8@3664",
      "Q6SN-Om1gIo@4387",
    ].sort().join("|"),
  );
});

test("public commentary enrichment contains no transcript dump or pricing", () => {
  assert.doesNotMatch(source, /"transcript"\s*:/i);
  assert.doesNotMatch(source, /\bpricing\b|\bprice list\b|\bpledge level\b/i);
  assert.doesNotMatch(source, /"speaker"\s*:/i);
});
