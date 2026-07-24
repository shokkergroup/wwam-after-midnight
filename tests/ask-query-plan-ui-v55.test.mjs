import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(root, "public", "demo", "app.js");
const appBytes = fs.readFileSync(appPath);
const app = appBytes.toString("utf8");
const search = fs.readFileSync(
  path.join(root, "public", "demo", "search-engine.js"),
  "utf8",
);
const askStart = app.indexOf("  function ask(query, preservedAnalysis)");
const askEnd = app.indexOf("  function showcaseCall(", askStart);
const askUi = app.slice(askStart, askEnd);

function functionSource(name) {
  const start = app.indexOf(`  function ${name}(`);
  assert.notEqual(start, -1, `${name} is missing`);
  const body = app.indexOf("{", start);
  let depth = 0;
  for (let index = body; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") depth -= 1;
    if (depth === 0) return app.slice(start, index + 1).trim();
  }
  throw new Error(`${name} is unterminated`);
}

test("Ask collection readouts use the Query Plan total and unit, not card count", () => {
  const status = vm.runInNewContext(`(${functionSource("askCollectionStatus")})`);

  assert.equal(
    status({
      collection: { total: 13, unit: "commentaries", displayed: 7 },
      confidence: 96,
    }),
    "13 COMMENTARIES // 7 SHOWN // 96% CONFIDENCE",
  );
  assert.equal(
    status({
      collection: {
        total: 696,
        unit: "caption mention matches",
        displayed: 7,
        sourceTotal: 59,
      },
      confidence: 91,
    }),
    "696 CAPTION MENTION MATCHES // 59 SOURCES // 7 SHOWN // 91% CONFIDENCE",
  );
  assert.equal(status({ collection: null, confidence: 0 }), "");
  assert.match(askUi, /collectionStatus \? collectionStatus :\s*results\.length \?/);
});

test("surface handoffs keep their ranking status and use the recommended route label", () => {
  const statusBlock = askUi.slice(
    askUi.indexOf("statusNode.textContent"),
    askUi.indexOf("var boundary"),
  );

  assert.match(
    statusBlock,
    /analysis\.status === "surface-handoff" \? "GLOBAL RANKING HANDOFF \/\/ SOURCE RANKING"/,
  );
  assert.ok(
    statusBlock.indexOf("GLOBAL RANKING HANDOFF") <
      statusBlock.indexOf("NO DEFENSIBLE RECEIPT"),
  );
  assert.match(
    askUi,
    /var isAnyHandoff = \/handoff\$\/\.test\(analysis\.status\)/,
  );
  assert.match(
    askUi,
    /var noMatchHeadline = isAnyHandoff \? analysis\.recommendedSurface\.label/,
  );
  assert.match(askUi, /analysis\.recommendedSurface[\s\S]*?<a href=/);
  assert.match(askUi, /analysis\.recommendedSurface\.href/);
  assert.match(search, /surfaceHandoff:[\s\S]*?href: "#red100"/);
});

test("UP IN YA order and labels are visible on Ask result cards", () => {
  assert.match(askUi, /result\.curatedRank == null/);
  assert.match(askUi, /WWAM UP IN YA \/\/ #/);
  assert.match(askUi, /result\.curatedRank\)\.padStart\(2, "0"\)/);
  assert.match(askUi, /result\.curatedLabel \|\| "CURATED SOUNDBYTE"/);
});

test("character roster cards keep performer mapping out of clip attribution", () => {
  assert.doesNotMatch(askUi, /rosterProfile\.performedBy|result\.performedBy/);
  assert.match(
    askUi,
    /result\.kind === "character-performance" \?[\s\S]{0,160}"TIMESTAMP-VALIDATED CURATED PERFORMANCE CANDIDATE \/\/ SPEAKER NOT DIARIZED"/,
  );
  assert.doesNotMatch(
    app,
    /EARLIEST VERIFIED CURRENT-SET RECEIPT|>VERIFIED PERFORMANCE RECEIPTS</,
  );
  assert.match(app, /EARLIEST TIMESTAMP-VALIDATED CURATED PERFORMANCE RECEIPT/);
});

test("Ask speaker labels fail closed without explicit certification", () => {
  assert.match(
    askUi,
    /result\.speakerCertification === true && result\.speaker \?[\s\S]{0,80}"SPEAKER VERIFIED" : "SPEAKER NOT DIARIZED"/,
  );
  assert.doesNotMatch(
    askUi,
    /"SPEAKER " \+ \(result\.speaker \? "VERIFIED" : "NOT DIARIZED"\)/,
  );
});

test("Ask answer prose uses a readable body treatment and app.js stays below cap", () => {
  assert.match(
    askUi,
    /<div class="derived-answer-copy">' \+ esc\(displayUiText\(analysis\.answer\)\)/,
  );
  assert.ok(
    appBytes.length < 250_000,
    `app.js is ${appBytes.length} bytes; expected fewer than 250000`,
  );
});

test("ordinary result status reports rendered receipts, not a shorter evidence chain", () => {
  assert.match(
    askUi,
    /results\.length \+ \(results\.length === 1 \? " RECEIPT" : " RECEIPTS"\)/,
  );
  assert.doesNotMatch(
    askUi,
    /\(analysis\.evidenceChain \|\| \[\]\)\.length \+ " RECEIPT CHAIN/,
  );
});
