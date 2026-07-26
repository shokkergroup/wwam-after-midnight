import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "public", "demo", "canon-desk-ui.js"), "utf8");
const window = {};
vm.runInNewContext(source, { window, Object, Number }, { filename: "canon-desk-ui.js" });
const ui = window.WWAMCanonDeskUI;
const esc = (value) => String(value ?? "");

test("Canon desk UI publishes a versioned renderer API", () => {
  assert.equal(ui.VERSION, "1.0.1");
  assert.equal(typeof ui.renderClaimAudit, "function");
  assert.equal(typeof ui.renderHumanReviewSession, "function");
});

test("claim audit renders numeric receipt totals without undefined counters", () => {
  const html = ui.renderClaimAudit({
    trustEngine: {
      timelineAudits: [{
        subject: "Halloween",
        directOpinionReceiptIds: ["r1", "r2"],
        projectedOrAmbiguousReceiptIds: ["r3", "r4", "r5"],
        receipts: 5,
        safePublicLabel: "EXCERPT-SENTIMENT TIMELINE — INFERENCE",
      }],
      courtAudits: [],
      metrics: { timelines: 1, courts: 0 },
    },
    esc,
  });
  assert.equal(html.includes("2/5 DIRECT"), true);
  assert.doesNotMatch(html, /undefined/);
});

test("human review UI fails closed when no review session exists", () => {
  const html = ui.renderHumanReviewSession({
    session: null,
    state: {},
    esc,
    timestamp: () => "0:00",
    evidenceButton: () => "",
    transitions: {},
  });
  assert.match(html, /LOCAL REVIEW SESSION COULD NOT INITIALIZE/);
});
