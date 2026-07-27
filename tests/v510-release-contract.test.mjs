import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const demo = path.join(root, "public", "demo");

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function runtime() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "riff-black-box-engine.js",
    "riff-black-box-ui.js",
  ].forEach((file) => {
    vm.runInContext(read(`public/demo/${file}`), context, { filename: file });
  });
  const window = context.window;
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const engine = window.ShokkerRiffBlackBoxEngine.create({
    showcase,
    labels: window.WWAMRiffBlackBoxUI.LABELS,
    contextSeconds: 15,
    neighborhoodSeconds: 900,
    packFingerprint: showcase.inputFingerprint,
  });
  return { showcase, engine };
}

test("V5.10 enhances the existing Riff Chemistry surface without growing app.js", () => {
  const html = read("public/demo/index.html");
  const requiredAssets = [
    "public/demo/riff-black-box-engine.js",
    "public/demo/riff-black-box-ui.js",
    "public/demo/riff-black-box.css",
    "docs/RIFF_BLACK_BOX.md",
  ];

  requiredAssets.forEach((relative) => {
    assert.ok(fs.statSync(path.join(root, relative)).size > 0, `${relative} is empty`);
  });
  assert.match(
    html,
    /<section class="memory-os" id="memory"[\s\S]{0,300}data-feature-styles="[^"]*riff-black-box\.css[^"]*"[\s\S]{0,500}data-feature-scripts="[^"]*riff-black-box-engine\.js,riff-black-box-ui\.js[^"]*">/,
  );
  assert.match(html, /data-memory-tab="chemistry">RIFF CHEMISTRY<\/button>/);
  assert.match(html, /id="riffBlackBox" hidden inert aria-hidden="true"/);
  assert.doesNotMatch(html, /href="#riff-black-box"/);
  assert.doesNotMatch(html, /<script[^>]+src="riff-black-box-(?:engine|ui)\.js"/);
  assert.doesNotMatch(html, /<link[^>]+href="riff-black-box\.css"/);

  assert.ok(fs.statSync(path.join(demo, "app.js")).size < 270_000);
  assert.ok(fs.statSync(path.join(demo, "riff-black-box-engine.js")).size < 55_000);
  assert.ok(fs.statSync(path.join(demo, "riff-black-box-ui.js")).size < 35_000);
  assert.ok(fs.statSync(path.join(demo, "riff-black-box.css")).size < 20_000);
});

test("V5.10 pins the runtime evidence ledger, neighborhood, and compact autopsy", () => {
  const { showcase, engine } = runtime();

  assert.equal(showcase.inputFingerprint, "68c87daa");
  assert.deepEqual(JSON.parse(JSON.stringify(engine.metrics)), {
    anchorCount: 301,
    sourceCount: 69,
    promotedSourceCount: 74,
    promotedReceiptCount: 872,
    dimensionCount: 6,
    weightTotal: 1,
    scoreDriftCount: 0,
    maximumScoreDrift: 0,
    literalReactionCueCount: 13,
    unknownReactionCount: 288,
    evidenceTierCounts: {
      machine: 276,
      "curated-candidate": 25,
    },
    machineEvidenceCount: 276,
    curatedCandidateEvidenceCount: 25,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(engine.binding)), {
    packFingerprint: "68c87daa",
    showcaseFingerprint: "68c87daa",
    ledgerFingerprint: "fnv1a32:0235b8e0",
    chemistryFingerprint: "fnv1a32:fe44c66e",
    contextSeconds: 15,
    contextAfterSeconds: 20,
    neighborhoodSeconds: 900,
    evidenceFingerprint: "fnv1a32:08ee9370",
  });
  assert.equal(engine.snapshot().fingerprint, "fnv1a32:ad09f43d");

  const neighborhood = { both: 0, one: 0, none: 0 };
  engine.list().forEach((anchor) => {
    const neighbors = engine.inspect(anchor.receiptId).neighbors;
    const count = Number(Boolean(neighbors.before)) + Number(Boolean(neighbors.after));
    neighborhood[count === 2 ? "both" : count === 1 ? "one" : "none"] += 1;
  });
  assert.deepEqual(neighborhood, { both: 147, one: 126, none: 28 });
  assert.equal(
    engine.list().filter((anchor) => anchor.sourceAt !== anchor.at).length,
    24,
  );

  const packet = engine.inspectionPacket(
    "R_bXrnNOcwg:moment:3810:the-room-breaks:2",
  );
  assert.equal(packet.fingerprint, "fnv1a32:2b111efc");
  assert.equal(engine.verifyInspection(packet).ok, true);
  assert.ok(Buffer.byteLength(engine.serializeInspection(packet), "utf8") < 10_000);
  assert.ok(Buffer.byteLength(engine.serialize(), "utf8") > 400_000);
});

test("V5.10 documentation pins the score, evidence, and authority boundaries", () => {
  const manifest = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const readme = read("README.md");
  const overview = read("docs/V5_OVERVIEW.md");
  const contract = read("docs/RIFF_BLACK_BOX.md");
  const changelog = read("docs/CHANGELOG.md");
  const runbook = read("docs/CREATOR_DEMO_RUNBOOK.md");

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");
  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(changelog, /^## 0\.5\.10 .*V5\.10 Comedy Black Box/m);
  assert.match(runbook, /current V5\.21 build/);

  [readme, overview, contract, changelog].forEach((source) => {
    assert.match(source, /301/);
    assert.match(source, /69 sources/i);
    assert.match(source, /276 machine/i);
    assert.match(source, /25\s+timestamp-validated human-curated/i);
    assert.match(source, /13/);
    assert.match(source, /288/);
    assert.match(source, /zero (?:permitted )?(?:score )?drift/i);
    assert.match(source, /sixteen-word|sixteen\s+words/i);
  });
  assert.match(contract, /fnv1a32:08ee9370/);
  assert.match(contract, /fnv1a32:ad09f43d/);
  assert.match(contract, /one-riff autopsy/i);
  assert.match(contract, /speaker: null|speaker remains null/i);
  assert.match(contract, /not causal|not a causal|causal findings/i);
  assert.match(contract, /Archive Deep, quarantined, or promotion-denied/i);
});
