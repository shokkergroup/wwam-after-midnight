import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const atlasUi = fs.readFileSync(path.join(demo, "archive-atlas-ui.js"), "utf8");
const sourceDossierAdapter = fs.readFileSync(
  path.join(demo, "wwam-source-dossier-adapter.js"),
  "utf8",
);
const sourceDossierUi = fs.readFileSync(
  path.join(demo, "source-dossier-ui.js"),
  "utf8",
);
const dnaSource = fs.readFileSync(path.join(demo, "wwam-channel-dna.js"), "utf8");
const pitchTour = fs.readFileSync(path.join(demo, "pitch-tour-data.js"), "utf8");

function loadChannelDna() {
  const context = { window: {} };
  context.window.window = context.window;
  vm.runInNewContext(dnaSource, context, { filename: "wwam-channel-dna.js" });
  return context.window.WWAM_CHANNEL_DNA;
}

test("headline proof has one immutable, dated evidence snapshot", () => {
  const snapshot = loadChannelDna().proofSnapshot;

  assert.deepEqual(
    JSON.parse(JSON.stringify(snapshot)),
    {
      asOf: "2026-07-23",
      sources: 84,
      wordsAudited: 2175344,
      captionHours: 194.89,
      knownRuntimeHours: 201.15,
      receipts: 872,
      nodes: 168,
      basis:
        "Audited output over the preserved commentary, Fresh 10, Popular 25, and Archive Deep Batch 01 inputs. The 42 new archive candidates remain outside the 872 promoted editorial receipts. The 168 nodes remain scoped to the 74-source promoted Showcase corpus.",
    },
  );
  assert.ok(Object.isFrozen(snapshot));
});

test("the proof wall does not silently morph when deferred engines finish", () => {
  assert.match(app, /var stable = channelDNA\.proofSnapshot \|\| \{\}/);
  assert.match(
    app,
    /\["CAPTION HOURS", Number\(stable\.captionHours \|\| 0\)\.toFixed\(1\), "AVAILABLE CAPTIONS AUDITED"\]/,
  );
  assert.match(
    app,
    /\["EDITORIAL RECEIPTS", stable\.receipts \|\| moments, "872 PROMOTED \+ 42 QUARANTINED CANDIDATES"\]/,
  );
  assert.match(app, /"74 PROMOTED \+ 10 ARCHIVE DEEP QUARANTINE"/);
  assert.match(pitchTour, /510 SOURCE FILES \/\/ 194 FULL SHOW WIKIS \/\/ 16 TOPIC-NAVIGATION ONLY \/\/ 300 HONEST SOURCE BRIEFS \/\/ 3,310 SOURCE RECEIPTS/);
  assert.match(app, /HEALTHY · PROMOTED CORPUS/);
  assert.match(html, /This desk audits the 74-source promoted corpus/);
  assert.match(
    app,
    /\["PROMOTED NODES", stable\.nodes \|\| \(liveMeta\.topics \|\| 0\) \+ \(popularMeta\.topics \|\| 0\), "CONNECTED, NOT JUST TAGGED"\]/,
  );
  assert.doesNotMatch(app, /\["HOURS",\s*hours,\s*"UNDER THE KNIFE"\]/);
});

test("the sales tour ends in a measurable pilot instead of another feature tour", () => {
  assert.match(
    pitchTour,
    /eyebrow: "THE SHOWCASE"/,
  );
  assert.match(
    pitchTour,
    /kind: "pilot"[\s\S]{0,180}label: "OPEN THE THREE-SHOW WORKFLOW"[\s\S]{0,180}goal: "compilation-workflow"/,
  );
  assert.match(app, /action\.kind === "pilot" \? "pitch"/);
  assert.match(app, /document\.getElementById\("pilotBuilder"\)\.scrollIntoView/);
  assert.match(html, /class="pilot-builder" id="pilotBuilder"/);
});

test("a cold exact-rank question waits for the deferred Red Band query engine", () => {
  assert.match(
    app,
    /if \(redBandIntent && !redBandQueryEngine\)[\s\S]{0,420}loadRedBandRanking\(\)[\s\S]{0,180}return;/,
  );
  assert.match(app, /OPENING MEMORABILITY INDEX V2\.1/);
});

test("a cold exact-title miss is held until Archive Deep can answer", () => {
  assert.match(
    app,
    /analysis\.selectionPlan\.sourceTitleBoundary[\s\S]{0,320}loadArchiveDeep\(\)[\s\S]{0,160}return;/,
  );
  assert.match(app, /CHECKING ARCHIVE DEEP \/\/ EXACT TITLE HELD/);
});

test("Clip Lab opens on a bounded, truth-labeled Tonight's 12", () => {
  assert.match(html, /data-clip-mode="shorts"[^>]*>TONIGHT'S 12/);
  assert.match(app, /"TONIGHT'S 12 \/\/ MACHINE SHORTLIST"/);
  assert.match(app, /"THIS SHOW'S " \+ values\.length \+ " \/\/ SOURCE-LOCKED SHORTS"/);
  assert.match(app, /button\.textContent = exactSourceId \? "THIS SHOW'S " \+ exactShorts/);
  assert.match(app, /THE FIRST EDITORIAL PASS, NOT A PUBLISH QUEUE/);
  assert.match(app, /sourceProofLabel \+ "SHORTS"/);
});

test("the frozen V5.4 proof stays dated while the current four-batch overlay stays truthful", () => {
  assert.doesNotMatch(html, /<script[^>]+archive-deep-(?:distill|engine)/i);
  assert.match(app, /"archive-deep-distill\.js"/);
  assert.match(app, /"archive-deep-batch2\.js"/);
  assert.match(app, /"archive-deep-batch3\.js"/);
  assert.match(app, /"archive-deep-batch4\.js"/);
  assert.match(app, /"archive-deep-engine\.js"/);
  assert.match(app, /"archive-deep-portfolio\.js"/);
  assert.match(app, /stream\._lane = "archive"/);
  assert.match(atlasUi, /"archive-deep-10": "DEEP-DIVE SHELF"/);
  assert.match(atlasUi, /"archive-deep-batch-04": "DEEP-DIVE SHELF"/);
  assert.match(sourceDossierUi, /"quarantined-lane": "HELD FOR REVIEW"/);
  assert.match(sourceDossierAdapter, /restrictedToTopicNavigation/);
  assert.match(html, /id="archiveBatch" hidden/);
  assert.match(atlasUi, /\[meta\.streams, "SHOW WIKIS"\]/);
  assert.match(atlasUi, /40 OLDER SHOWS WITH EXTRA CHAPTERS/);
  assert.doesNotMatch(atlasUi, /CURRENT 20-SOURCE OVERLAY/);
  assert.doesNotMatch(atlasUi, /TWO INDEPENDENTLY FINGERPRINTED BATCHES/);
  assert.match(atlasUi, /\[meta\.topicLanes, "TOPIC JUMPS"\]/);
  assert.match(atlasUi, /DEEP DIVE #/);
  assert.match(atlasUi, /OPEN SHOW WIKI/);
  assert.match(atlasUi, /CACHED VIEWS/);
  assert.match(atlasUi, /\[meta\.visualRankingQuarantines, "ARTWORK CHECKS LEFT"\]/);
  assert.doesNotMatch(atlasUi, /VIEW RANK/);
});

test("the buyer room proves universal infrastructure without erasing WWAM's channel DNA", () => {
  assert.match(html, /REPEATABLE CORE × IRREPLACEABLE CHANNEL DNA/);
  assert.match(html, /UNIVERSAL CORE/);
  assert.match(html, /WWAM CHANNEL DNA/);
  assert.match(html, /LIVING UPDATE CONTRACT/);
  assert.match(html, /No unattended scheduler is claimed/);
  assert.match(html, /candidate quarantine/);
  assert.match(html, /href="ask-truth-set\.json" download/);
});
