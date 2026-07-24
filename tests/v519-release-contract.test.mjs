import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const readRoot = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readDemo = (file) => fs.readFileSync(path.join(demo, file), "utf8");

const CUT_ASSETS = [
  "memory-cut-engine.js",
  "memory-cut-ui.js",
  "memory-cut.css",
];

const CHARACTER_WARD = [
  ["character-receipt:slender-stomach", "Mf-0Tv_KHCE", "541.04", "555.04"],
  ["character-receipt:challis-boilermaker", "lCH31VtaSeI", "6511.44", "6525.44"],
  ["character-receipt:loomis-biscuit-job", "Qc2vVFMO4ts", "7693.02", "7707.02"],
  ["character-receipt:feldman-atmosphere", "shoWljlgSUU", "8097.2", "8111.2"],
  ["character-receipt:loomis-funding", "LV2rmwEA0w4", "9042.64", "9056.64"],
];

test("V5.19 package, cache keys, and public documentation move together", () => {
  const manifest = JSON.parse(readRoot("package.json"));
  const lock = JSON.parse(readRoot("package-lock.json"));
  const html = readDemo("index.html");
  const readme = readRoot("README.md");
  const overview = readRoot("docs/V5_OVERVIEW.md");
  const changelog = readRoot("docs/CHANGELOG.md");
  const guide = readRoot("docs/THE_MIDNIGHT_CUT.md");
  const memoryOs = readRoot("docs/YOUTUBE_WIKI_MEMORY_OS.md");

  assert.equal(manifest.version, "0.5.20");
  assert.equal(lock.version, "0.5.20");
  assert.equal(lock.packages[""].version, "0.5.20");

  const cacheVersions = Array.from(
    html.matchAll(/\?v=(\d+\.\d+\.\d+)/g),
    (match) => match[1],
  );
  assert.ok(cacheVersions.length >= 2, "expected versioned runtime cache keys");
  assert.deepEqual(new Set(cacheVersions), new Set(["0.5.20"]));

  assert.match(readme, /Current documented release: \*\*V5\.20 \/ 0\.5\.20\*\*/);
  assert.match(readme, /docs\/THE_MIDNIGHT_CUT\.md/);
  assert.match(overview, /^# WWAM After Midnight V5\.20/m);
  assert.match(changelog, /^## 0\.5\.19 — V5\.19 The Midnight Cut/m);
  assert.match(changelog, /^## 0\.5\.18 .*V5\.18 Ask This Tape/m);
  assert.match(guide, /Release contract for \*\*V5\.19 \/ 0\.5\.19\*\*/);
  assert.match(memoryOs, /Current WWAM demonstration release: \*\*V5\.20 \/ 0\.5\.20\*\*/);
});

test("The Midnight Cut is a lazy Evidence Bag action, not another front door", () => {
  const html = readDemo("index.html");
  const app = readDemo("app.js");
  const bagStart = html.indexOf('id="evidenceBag"');
  const cutButton = html.indexOf('id="evidenceBagCut"');
  const modalStart = html.indexOf('id="tapeModal"');

  assert.ok(bagStart >= 0, "Evidence Bag is missing");
  assert.ok(cutButton > bagStart && cutButton < modalStart, "cut action must live in the Evidence Bag");
  assert.match(
    html,
    /data-feature-scripts=["'][^"']*memory-cut-engine\.js[^"']*memory-cut-ui\.js[^"']*["']/,
  );
  assert.match(html, /data-feature-styles=["']memory-cut\.css["']/);
  assert.doesNotMatch(html, /<script[^>]+src=["']memory-cut-(?:engine|ui)\.js/i);
  assert.doesNotMatch(html, /<link[^>]+href=["']memory-cut\.css/i);
  assert.doesNotMatch(html, /<section[^>]+(?:midnight-cut|memory-cut)/i);
  assert.doesNotMatch(
    html,
    /href=["']#(?:memoryCut|midnightCut|memory-cut|midnight-cut)["']/i,
  );
  assert.match(app, /evidenceBagCut/);

  for (const asset of CUT_ASSETS) {
    assert.equal(fs.existsSync(path.join(demo, asset)), true, `${asset} is missing`);
  }
});

test("the launch cut pins five exact canonical 14-second windows in order", () => {
  const implementation = readDemo("memory-cut-engine.js");
  let previous = -1;

  for (const [key, sourceId, start, end] of CHARACTER_WARD) {
    const position = implementation.indexOf(key);
    assert.ok(position > previous, `${key} is missing or out of order`);
    const sourcePosition = implementation.lastIndexOf(sourceId, position);
    assert.ok(
      sourcePosition > previous && sourcePosition < position,
      `${key} is missing its ordered ${sourceId} binding`,
    );
    previous = position;
    for (const value of [start, end]) {
      assert.ok(
        implementation.indexOf(value, position) >= position,
        `${key} is missing ${value}`,
      );
    }
    assert.equal(Number(end) - Number(start), 14, `${key} must remain exactly 14 seconds`);
  }
});

test("the shipped contract keeps viewer authorship, sharing, and authority bounded", () => {
  const engine = readDemo("memory-cut-engine.js");
  const ui = readDemo("memory-cut-ui.js");
  const guide = readRoot("docs/THE_MIDNIGHT_CUT.md");
  const contract = [engine, ui, guide].join("\n");

  assert.match(contract, /three to eight|3(?:\s|–|-)8/i);
  assert.match(contract, /VIEWER-WRITTEN \/\/ NOT ARCHIVE EVIDENCE/);
  assert.match(contract, /fail[- ]closed/i);
  assert.match(contract, /canonical (?:re-)?resolution|re-resolv/i);
  assert.match(contract, /JSON/i);
  assert.match(contract, /Markdown/i);
  assert.match(contract, /manual/i);
  assert.match(contract, /official YouTube|official-source/i);
  assert.match(contract, /AI-generated claim|does not generate|generated dialogue/i);
  assert.match(ui, /playerLoaded:\s*false/);
  assert.match(ui, /state\.playerLoaded\s*=\s*false/);
  assert.match(ui, /action === ["']play-current["'][\s\S]{0,180}invokePlayer/);
  assert.match(ui, /action === ["']next["'][\s\S]{0,180}selectAndPlay/);
  assert.match(guide, /Playback starts only after a visitor presses a control/i);
  assert.match(guide, /never autoplays the next stop/i);

  for (const denied of [
    "speakerContinuity",
    "causality",
    "opinionChange",
    "trueOrigin",
    "creatorApproval",
    "rightsCleared",
    "canonMutated",
    "mediaCopied",
  ]) {
    assert.match(contract, new RegExp(denied, "i"), `${denied} ceiling is missing`);
  }

  assert.match(guide, /must not contain transcript excerpts, captions, summaries/i);
  assert.match(guide, /No source audio or video is copied/i);
  assert.match(guide, /human must review context, speaker, rights/i);
});
