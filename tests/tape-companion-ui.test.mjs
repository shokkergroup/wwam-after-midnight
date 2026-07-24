import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(demo, "tape-companion-ui.js"), "utf8");
const css = fs.readFileSync(path.join(demo, "tape-companion.css"), "utf8");

test("Tape Companion lazy-loads as one coherent synchronized surface", () => {
  assert.match(
    html,
    /id="companion"[\s\S]{0,180}data-feature-styles="tape-companion\.css"[\s\S]{0,180}data-feature-scripts="red-band-ranking-v2\.js,tape-companion-engine\.js,tape-companion-ui\.js"/,
  );
  for (const id of [
    "companionProof",
    "companionSourceSearch",
    "companionSourceList",
    "companionPlayer",
    "companionManualTime",
    "companionOfficial",
    "companionShare",
    "companionHeat",
    "companionNow",
    "companionNext",
    "companionHistory",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /href="#companion">WATCH WITH MEMORY/);
});

test("the UI binds official playback to snapshot-safe engine calls", () => {
  assert.match(ui, /WWAMTapeCompanionEngine\.create\(buildInputs\(\)/);
  assert.match(ui, /engine\.crossedEvents\(activeSource\.id, previousSecond, nextSecond\)/);
  assert.match(ui, /engine\.snapshotAt\(activeSource\.id, nextSecond\)/);
  assert.match(ui, /future && snapshot\.future\.next/);
  assert.match(ui, /NEXT INDEXED DISTURBANCE \/\/ TEXT SEALED/);
  assert.doesNotMatch(ui, /compileTimeline\(/);
  assert.match(
    ui,
    /ShokkerYouTubePlayback\.playerVars\(\{\s*autoplay:\s*false,\s*start:\s*startAt/
  );
  assert.match(ui, /Math\.abs\(value - currentSecond\) < 0\.2/);
  assert.match(ui, /Math\.abs\(currentSecond - lastPersistSecond\) < 5/);
  assert.match(ui, /root\.addEventListener\("pagehide"/);
  assert.match(ui, /sourceUrl\(snapshot\.source\.id, currentSecond\)/);
  assert.match(ui, /MANUAL SYNC/);
  assert.match(html, /id="companionStatus" role="status" aria-live="polite"/);
  assert.doesNotMatch(html, /id="companionProof" aria-live/);
  assert.doesNotMatch(html, /id="companionHistory" aria-live/);
});

test("share and resume state use the engine's bound restore contract", () => {
  assert.match(ui, /engine\.serializeShareState\(activeSource\.id, currentSecond\)/);
  assert.match(ui, /engine\.restoreShareState\(token\)/);
  assert.match(ui, /url\.searchParams\.set\("companion", token\)/);
  assert.match(ui, /"wwam:tape-companion:" \+ engine\.archiveFingerprint/);
  assert.match(ui, /SHARED TAPE HELD/);
});

test("annotations preserve ranking, curation, character, and Lore semantics", () => {
  assert.match(ui, /RED BAND #/);
  assert.match(ui, /MACHINE CANDIDATE/);
  assert.match(ui, /UP IN YA \/\/ EDITORIAL SELECTION/);
  assert.match(ui, /CLIP SPEAKER NOT DIARIZED/);
  assert.match(ui, /ARCHIVE CONNECTION/);
  assert.match(ui, /DERIVED HEAT WINDOW \/\/ NOT AUDIENCE TRUTH/);
  assert.match(ui, /displayText\(subject\.excerpt\)/);
});

test("fused incidents present the latest revealed member without dropping incident badges", () => {
  assert.match(ui, /function presentationMember\(event\)/);
  assert.match(ui, /event\.latestRevealedMemberId/);
  assert.match(ui, /Number\(member\.at\) <= currentSecond/);
  assert.match(ui, /var subject = presentationMember\(event\)/);
  assert.match(ui, /var badges = annotationBadges\(event\)/);
  assert.match(ui, /subject\.label/);
  assert.match(ui, /subject\.excerpt/);
  assert.match(ui, /subject\.url/);
});

test("the companion layout collapses for tablet and phone widths", () => {
  assert.match(css, /\.companion-shell\s*\{[\s\S]{0,180}grid-template-columns:/);
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*?\.companion-shell\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /@media \(max-width: 600px\)[\s\S]*?\.companion-transport\s*\{\s*grid-template-columns:\s*1fr;/,
  );
});
