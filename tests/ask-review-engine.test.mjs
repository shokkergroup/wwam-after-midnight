import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const source = fs.readFileSync(path.join(demo, "ask-review-engine.js"), "utf8");

function engine() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "ask-review-engine.js" });
  return sandbox.window.WWAMAskReviewEngine.create();
}

function input(overrides = {}) {
  return {
    query: "Where is The Conjuring in SCREAM 7 UPDATE LIVE!?",
    issueKind: "wrong-timestamp",
    note: "The discussion starts a little earlier.",
    observedAt: "2026-07-24T12:00:00Z",
    answer: {
      readout: "1 RECEIPT // 90% CONFIDENCE",
      summary: "The strongest bounded result is this exact receipt.",
      answerStatus: "SUPPORTED",
      intent: "DISCOVERY",
      entity: "THE CONJURING",
      resultCount: 1,
    },
    receipts: [{
      source: "livestream",
      sourceId: "o4EMYqQ5DDU",
      at: 2645,
      title: "SCREAM 7 UPDATE LIVE!",
      evidenceLevel: "TIMESTAMPED MACHINE-CANDIDATE RECEIPT",
      excerpt: "This private-looking field must never enter the packet.",
    }],
    proposal: {
      sourceId: "o4EMYqQ5DDU",
      at: 2638,
      expectedAnswer: "Route to the earlier Conjuring discussion.",
    },
    ...overrides,
  };
}

test("builds a bounded append-only review proposal from a rendered Ask answer", () => {
  const review = engine();
  const packet = review.createPacket(input());

  assert.equal(packet.schema, "shokker-youtube-wiki/ask-review/v1");
  assert.equal(packet.workflow.state, "proposed");
  assert.equal(packet.workflow.applied, false);
  assert.equal(packet.mutationPolicy.corpusMutation, "NONE");
  assert.equal(packet.mutationPolicy.canonMutation, "NONE");
  assert.equal(packet.mutationPolicy.askMutation, "NONE");
  assert.equal(packet.evidenceBoundary.privateCaptionPayloadIncluded, false);
  assert.equal(
    packet.answer.summary,
    "The strongest bounded result is this exact receipt.",
  );
  assert.equal(packet.receipts.length, 1);
  assert.equal(packet.proposal.sourceId, "o4EMYqQ5DDU");
  assert.equal(packet.proposal.at, 2638);
  assert.equal(packet.proposal.verificationStatus, "unverified user proposal");
  assert.deepEqual(Object.keys(packet.receipts[0]), [
    "source",
    "sourceId",
    "at",
    "title",
    "evidenceLevel",
  ]);
  assert.equal(JSON.stringify(packet).includes("private-looking"), false);
  assert.equal(review.validatePacket(packet).valid, true);
});

test("is deterministic for identical observations and changes when the proposal changes", () => {
  const review = engine();
  const first = review.createPacket(input());
  const second = review.createPacket(input());
  const changed = review.createPacket(input({ issueKind: "wrong-source" }));

  assert.deepEqual(first, second);
  assert.equal(first.packetId, second.packetId);
  assert.notEqual(first.packetId, changed.packetId);
});

test("fails closed on unsupported kinds, missing queries, and invalid observation times", () => {
  const review = engine();
  assert.throws(
    () => review.createPacket(input({ issueKind: "silently-rewrite-search" })),
    /not supported/,
  );
  assert.throws(() => review.createPacket(input({ query: "  " })), /exact submitted query/);
  assert.throws(() => review.createPacket(input({ observedAt: "yesterday-ish" })), /observation time/);
  assert.throws(
    () => review.createPacket(input({ proposal: { sourceId: "../not-a-source" } })),
    /exact source ID/,
  );
  assert.throws(
    () => review.createPacket(input({ proposal: { at: -1 } })),
    /supported source range/,
  );
});

test("bounds, validates, and deduplicates rendered receipt coordinates", () => {
  const review = engine();
  const duplicate = input().receipts[0];
  const many = Array.from({ length: 14 }, (_, index) => ({
    source: "archive",
    sourceId: `source_${String(index).padStart(4, "0")}`,
    at: index + 0.6,
    title: `Source ${index}`,
  }));
  many.unshift(duplicate, duplicate);
  many.push({ sourceId: "../bad", at: 12 });
  many.push({ sourceId: "valid_source", at: -1 });
  const packet = review.createPacket(input({ receipts: many }));

  assert.equal(packet.receipts.length, 10);
  assert.equal(packet.receipts[0].sourceId, "o4EMYqQ5DDU");
  assert.equal(packet.receipts[1].at, 1);
  assert.ok(packet.receipts.every((receipt) => receipt.at >= 0));
});

test("detects tampering even when a packet still looks plausible", () => {
  const review = engine();
  const packet = review.createPacket(input());
  const changedQuery = structuredClone(packet);
  changedQuery.query = "What is funniest?";
  assert.deepEqual(
    Array.from(review.validatePacket(changedQuery).errors),
    ["fingerprint", "packetId"],
  );

  const mutationClaim = structuredClone(packet);
  mutationClaim.mutationPolicy.askMutation = "APPLY";
  assert.deepEqual(Array.from(review.validatePacket(mutationClaim).errors), [
    "mutationPolicy",
    "fingerprint",
    "packetId",
  ]);

  const applied = structuredClone(packet);
  applied.workflow.applied = true;
  assert.deepEqual(Array.from(review.validatePacket(applied).errors), [
    "workflow",
    "fingerprint",
    "packetId",
  ]);

  const verifiedProposal = structuredClone(packet);
  verifiedProposal.proposal.verificationStatus = "verified";
  assert.deepEqual(Array.from(review.validatePacket(verifiedProposal).errors), [
    "proposal",
    "fingerprint",
    "packetId",
  ]);
});

test("rejects noncanonical private-looking fields even after an attacker recomputes FNV", () => {
  const review = engine();
  const reSign = (packet) => {
    const expected = review.validatePacket(packet).fingerprint;
    packet.fingerprint = expected;
    packet.packetId = `ask-review:${expected.slice(-8)}`;
    return packet;
  };

  const receiptPayload = reSign(structuredClone(review.createPacket(input())));
  receiptPayload.receipts[0].privateCaptionPayload = "hidden transcript";
  reSign(receiptPayload);
  assert.deepEqual(
    Array.from(review.validatePacket(receiptPayload).errors),
    ["receipts"],
  );

  const answerPayload = structuredClone(review.createPacket(input()));
  answerPayload.answer.transcript = "private answer transcript";
  reSign(answerPayload);
  assert.deepEqual(
    Array.from(review.validatePacket(answerPayload).errors),
    ["answer"],
  );

  const topLevelPayload = structuredClone(review.createPacket(input()));
  topLevelPayload.rawCaptions = ["private"];
  reSign(topLevelPayload);
  assert.deepEqual(
    Array.from(review.validatePacket(topLevelPayload).errors),
    ["shape"],
  );
});

test("exports a deterministic review queue with useful, non-inflated metrics", () => {
  const review = engine();
  const wrong = review.createPacket(input());
  const helpful = review.createPacket(input({
    issueKind: "helpful",
    note: "",
    observedAt: "2026-07-24T12:01:00Z",
    receipts: [],
  }));
  const queue = JSON.parse(review.exportQueue([wrong, helpful, wrong]));

  assert.equal(queue.schema, "shokker-youtube-wiki/ask-review-queue/v1");
  assert.equal(queue.metrics.total, 2);
  assert.equal(queue.metrics.needsReview, 1);
  assert.equal(queue.metrics.helpful, 1);
  assert.equal(queue.metrics.receiptBound, 1);
  assert.equal(queue.metrics.queryOnly, 1);
  assert.equal(queue.metrics.uniqueQueries, 1);
  assert.equal(queue.packets.length, 2);
  assert.match(queue.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(queue.policy.askMutation, "NONE");
  assert.equal(review.validateQueue(JSON.stringify(queue)).valid, true);
});

test("queue validation rejects duplicate, policy, metric, packet, and fingerprint drift", () => {
  const review = engine();
  const packet = review.createPacket(input());
  const original = JSON.parse(review.exportQueue([packet]));

  const duplicate = structuredClone(original);
  duplicate.packets.push(structuredClone(packet));
  assert.deepEqual(Array.from(review.validateQueue(duplicate).errors), [
    "packets",
    "fingerprint",
  ]);

  const policy = structuredClone(original);
  policy.policy.askMutation = "APPLY";
  assert.deepEqual(Array.from(review.validateQueue(policy).errors), [
    "policy",
    "fingerprint",
  ]);

  const metrics = structuredClone(original);
  metrics.metrics.total = 99;
  assert.deepEqual(Array.from(review.validateQueue(metrics).errors), [
    "metrics",
    "fingerprint",
  ]);

  const nested = structuredClone(original);
  nested.packets[0].query = "tampered";
  assert.deepEqual(Array.from(review.validateQueue(nested).errors), [
    "packets",
    "metrics",
    "fingerprint",
  ]);

  const extra = structuredClone(original);
  extra.rawCaptionCache = "private";
  extra.fingerprint = review.validateQueue(extra).fingerprint;
  assert.deepEqual(Array.from(review.validateQueue(extra).errors), ["shape"]);

  assert.deepEqual(Array.from(review.validateQueue("{nope").errors), ["json"]);
});

test("never accepts transcript text or claims a correction changed Ask or Canon", () => {
  const review = engine();
  const packet = review.createPacket(input({
    transcript: "private full caption payload",
    answer: {
      ...input().answer,
      transcript: "also private",
      excerpt: "not part of the review contract",
    },
  }));
  const exported = review.exportPacket(packet);

  assert.equal(exported.includes("private full caption payload"), false);
  assert.equal(exported.includes("also private"), false);
  assert.equal(exported.includes("not part of the review contract"), false);
  assert.match(exported, /\"askMutation\": \"NONE\"/);
  assert.match(exported, /\"canonMutation\": \"NONE\"/);
  assert.match(exported, /human playback review/);
});
