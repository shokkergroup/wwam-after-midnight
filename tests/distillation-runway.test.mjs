import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");

function read(file) {
  return fs.readFileSync(path.join(demo, file), "utf8");
}

function atlas() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of ["archive-atlas-data.js", "archive-atlas-engine.js"]) {
    vm.runInContext(read(file), context, { filename: file });
  }
  return context.window.WWAMArchiveAtlasEngine.create(
    context.window.WWAM_ARCHIVE_ATLAS,
  );
}

test("the complete Atlas acquisition runway exports every eligible source", () => {
  const queue = atlas().getDistillQueue({ limit: 500 });
  const ids = queue.records.map((record) => record.id);

  assert.equal(queue.eligible, 390);
  assert.equal(queue.matched, 390);
  assert.equal(queue.records.length, 390);
  assert.equal(new Set(ids).size, 390);
  assert.ok(queue.records.every((record, index) => (
    record.coverage === "metadata-only" &&
    record.priority.rank === index + 1 &&
    record.priority.basis === "cached title/date/views only"
  )));
});

test("Autopsy cards connect Source Briefs and the Drop Zone without content inference", () => {
  const ui = read("archive-atlas-ui.js");
  const app = read("app.js");

  assert.match(ui, /data-archive-open=/);
  assert.match(ui, /OPEN SOURCE BRIEF/);
  assert.match(ui, /data-archive-stage=/);
  assert.match(ui, /STAGE FOR DISTILL/);
  assert.match(ui, /stageRecord\(serialCopy\(staged\)\)/);
  assert.match(ui, /getDistillQueue\(\{ limit: 500 \}\)/);
  assert.match(ui, /wwam-archive-autopsy-queue\/v2/);
  assert.match(ui, /contentClaimsFromMetadata:\s*false/);
  assert.match(ui, /promotionAllowed:\s*false/);
  assert.match(app, /stageRecord:\s*stageArchiveRecord/);
  assert.match(app, /WWAM_PENDING_INTAKE_SOURCE\s*=\s*staged/);
  assert.match(app, /wwam:stage-intake-source/);
  assert.match(app, /TIMED CAPTIONS STILL REQUIRED/);
});

test("staging binds canonical metadata, clears old tape, and never auto-runs", () => {
  const intake = read("fresh-tape-intake-ui.js");
  const stagingBlock = intake.match(
    /function stageSource\(source\)[\s\S]*?\n  function loadSample/,
  )?.[0] ?? "";

  assert.match(stagingBlock, /elements\.id\.value = stagedSource\.id/);
  assert.match(stagingBlock, /elements\.url\.value = stagedSource\.url/);
  assert.match(stagingBlock, /elements\.title\.value = stagedSource\.title/);
  assert.match(stagingBlock, /elements\.date\.value = stagedSource\.date/);
  assert.match(
    stagingBlock,
    /elements\.duration\.value = String\(stagedSource\.duration\)/,
  );
  assert.match(stagingBlock, /elements\.transcript\.value = ""/);
  assert.match(stagingBlock, /artifact = null/);
  assert.doesNotMatch(stagingBlock, /runIntake\(/);
  assert.match(
    intake,
    /TRANSCRIPT FIELD INTENTIONALLY EMPTY \/\/ NOTHING AUTO-RUNS/,
  );
  assert.match(intake, /ADD TIMED CAPTIONS \/\/ NOTHING AUTO-RUNS/);
});

test("every metadata-only Show Wiki exposes the same evidence-safe runway", () => {
  const ui = read("source-dossier-ui.js");

  assert.match(ui, /onStageIntake/);
  assert.match(ui, /data-source-dossier-action="stage-intake"/);
  assert.match(ui, /QUEUE THE DEEP DIVE/);
  assert.match(ui, /callbacks\.stageIntake\(payload\)/);
  assert.match(ui, /not enough usable captions for an honest recap/i);
});
