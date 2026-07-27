import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const ROOT = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(
  path.join(ROOT, "public", "demo", "halloween-acquired-distill.js"),
  "utf8",
);
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);
const payload = context.window.WWAM_HALLOWEEN_ACQUIRED;

const expectedIds = [
  "-k3YduzBoGs",
  "pVEeei_H4g4",
  "GlkmFBIw2Ic",
  "JRSVp0Ss2Eg",
  "Ig1JOfIgyc8",
  "QwJb31dSo9Y",
  "mLjRZFV93xc",
  "gRdXvl5s_ys",
  "oKVZG4z5wuU",
  "WE3_YeRy7Xk",
  "eE7I5NjXiqs",
  "NjH2tcGvmAY",
];

function words(value) {
  return String(value || "")
    .replace(/^\u2026\s*/, "")
    .replace(/\s*\u2026$/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

test("Halloween acquisition overlay is a bounded caption-backed source set", () => {
  assert.equal(payload.schema, "wwam-halloween-acquired-overlay/v1");
  assert.equal(payload.generated, "2026-07-26");
  assert.equal(payload.meta.sources, 12);
  assert.equal(payload.meta.captioned, 12);
  assert.equal(payload.meta.topicNavigationOnly, 2);
  assert.equal(payload.meta.wordsAudited, 288580);
  assert.equal(payload.meta.moments, 70);
  assert.equal(payload.meta.anchorReceipts, 11);
  assert.equal(
    payload.streams.map((stream) => stream.id).sort().join("|"),
    expectedIds.slice().sort().join("|"),
  );
  assert.equal(new Set(payload.streams.map((stream) => stream.id)).size, 12);
});

test("every acquired show exposes a usable evidence-bounded wiki contract", () => {
  for (const stream of payload.streams) {
    assert.match(stream.id, /^[A-Za-z0-9_-]{11}$/);
    assert.equal(stream.captioned, true);
    assert.ok(stream.wordsAudited > 10000, stream.id);
    assert.ok(stream.topics.length >= 5, stream.id);
    assert.match(stream.summary, /automatic-caption map/i);
    assert.equal(stream.acquisition.speakerStatus, "not-diarized");
    assert.ok(["full-caption-backed-wiki", "topic-navigation-only"].includes(stream.wikiStatus));
    assert.ok(Array.isArray(stream.upInYa));
    assert.ok(Array.isArray(stream.stevesAsshole));
    for (const topic of stream.topics) {
      assert.ok(Number.isFinite(topic.peak));
      if (topic.receipt) assert.ok(words(topic.receipt) <= 16, `${stream.id}:${topic.name}`);
    }
    for (const moment of stream.moments) {
      assert.ok(words(moment.excerpt) <= 16, `${stream.id}:${moment.t}`);
      assert.equal(moment.evidence.speakerStatus, "not-diarized");
    }
  }
});

test("trailer-boundary sources remain topic navigation only", () => {
  for (const id of ["oKVZG4z5wuU", "WE3_YeRy7Xk"]) {
    const stream = payload.streams.find((candidate) => candidate.id === id);
    assert.equal(stream.rightsPolicy.restrictedToTopicNavigation, true);
    assert.equal(stream.wikiStatus, "topic-navigation-only");
    assert.equal(stream.moments.length, 0);
    assert.equal(stream.characters.length, 0);
    assert.equal(stream.upInYa.length, 0);
    assert.equal(stream.stevesAsshole.length, 0);
  }
});

test("repeat-commentary lineages are established by exact caption receipts", () => {
  const theatrical = payload.streams.find((stream) => stream.id === "eE7I5NjXiqs");
  const midnight = payload.streams.find((stream) => stream.id === "NjH2tcGvmAY");
  assert.equal(theatrical.lineage.compareTo, "ZWF8TPnHr4Y");
  assert.match(theatrical.lineage.version, /theatrical/i);
  assert.equal(theatrical.lineage.evidence.t, 83);
  assert.equal(midnight.lineage.compareTo, "6VXSBDZ-3WE");
  assert.equal(midnight.lineage.film, "Halloween (1978)");
  assert.equal(midnight.lineage.evidence.t, 136);
  assert.ok(
    midnight.anchorReceipts.some((receipt) => receipt.label === "THE LOOMIS COUNTER"),
  );
  assert.ok(
    theatrical.anchorReceipts.some((receipt) => receipt.label === "PLEASENCE FAREWELL"),
  );
});

test("public overlay contains no transcript dump, pricing, or speaker claim", () => {
  assert.doesNotMatch(source, /"transcript"\s*:/i);
  assert.doesNotMatch(
    source,
    /\bpricing\b|\bprice list\b|\bpledge level\b/i,
  );
  assert.doesNotMatch(source, /"speaker"\s*:/i);
});
