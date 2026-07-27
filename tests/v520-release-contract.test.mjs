import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const readRoot = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readDemo = (file) => fs.readFileSync(path.join(demo, file), "utf8");

const BLOODLINE_ASSETS = [
  "bit-bloodline-engine.js",
  "bit-bloodline-ui.js",
  "bit-bloodline.css",
  "wwam-bit-bloodline-host.js",
];

const PINNED_LINEAGES = {
  "ancestry:bit-challis-hotline": {
    windows: 7,
    sources: 6,
    seconds: 98,
    days: 1464,
    contexts: 9,
    signals: 11,
  },
  "ancestry:bit-slenderman-dispatch": {
    windows: 6,
    sources: 6,
    seconds: 84,
    days: 1916,
    contexts: 7,
    signals: 5,
  },
  "ancestry:bit-loomis-alert": {
    windows: 7,
    sources: 5,
    seconds: 98,
    days: 1433,
    contexts: 6,
    signals: 3,
  },
  "ancestry:bit-feldman-frequency": {
    windows: 5,
    sources: 3,
    seconds: 70,
    days: 37,
    contexts: 6,
    signals: 5,
  },
};

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load(files) {
  const window = {};
  const sandbox = { window, globalThis: window };
  window.window = window;
  vm.createContext(sandbox);
  for (const file of files) {
    vm.runInContext(readDemo(file), sandbox, { filename: file });
  }
  return window;
}

let fixture;

function buildFixture() {
  if (fixture) return fixture;
  const window = load([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "creator-studio-engine.js",
    "archive-atlas-data.js",
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "bit-bloodline-engine.js",
  ]);
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const archiveDeep = window.WWAMArchiveDeepPortfolio.create(
    [
      window.WWAM_ARCHIVE_DEEP,
      window.WWAM_ARCHIVE_DEEP_BATCH2,
      window.WWAM_ARCHIVE_DEEP_BATCH3,
      window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    window.WWAMArchiveDeepEngine,
  );
  const adapted = window.WWAMSourceDossierAdapter.build({
    atlas: window.WWAM_ARCHIVE_ATLAS,
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: archiveDeep,
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:v520-release",
    },
  });
  const dossierEngine = window.ShokkerSourceDossier.create(adapted);
  const engine = window.ShokkerBitBloodline.create({
    dossierEngine,
    lineages: showcase.getBitLineages(),
  });
  fixture = { engine };
  return fixture;
}

test("V5.20 package, cache keys, and public documentation move together", () => {
  const manifest = JSON.parse(readRoot("package.json"));
  const lock = JSON.parse(readRoot("package-lock.json"));
  const html = readDemo("index.html");
  const readme = readRoot("README.md");
  const overview = readRoot("docs/V5_OVERVIEW.md");
  const changelog = readRoot("docs/CHANGELOG.md");
  const runbook = readRoot("docs/CREATOR_DEMO_RUNBOOK.md");
  const memoryOs = readRoot("docs/YOUTUBE_WIKI_MEMORY_OS.md");
  const bloodlines = readRoot("docs/BIT_BLOODLINES.md");
  const midnightCut = readRoot("docs/THE_MIDNIGHT_CUT.md");

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");

  const cacheVersions = Array.from(
    html.matchAll(/\?v=(\d+\.\d+\.\d+)/g),
    (match) => match[1],
  );
  assert.ok(cacheVersions.length >= 2, "expected versioned runtime cache keys");
  assert.deepEqual(new Set(cacheVersions), new Set(["0.5.21"]));

  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(readme, /docs\/BIT_BLOODLINES\.md/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(changelog, /^## 0\.5\.20 .*V5\.20 Bit Bloodlines/m);
  assert.match(runbook, /current V5\.21 build/i);
  assert.match(memoryOs, /Current WWAM demonstration release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(bloodlines, /Release contract for \*\*V5\.20 \/ 0\.5\.20\*\*/);

  assert.match(changelog, /^## 0\.5\.19 .*V5\.19 The Midnight Cut/m);
  assert.match(changelog, /^## 0\.5\.18 .*V5\.18 Ask This Tape/m);
  assert.match(midnightCut, /Release contract for \*\*V5\.19 \/ 0\.5\.19\*\*/);
});

test("Bit Bloodlines demand-loads inside the existing Memory OS tab", () => {
  const html = readDemo("index.html");
  const app = readDemo("app.js");
  const host = readDemo("wwam-bit-bloodline-host.js");
  const memoryStart = html.indexOf('<section class="memory-os" id="memory"');
  const memoryEnd = html.indexOf("<section", memoryStart + 1);
  const memory = html.slice(memoryStart, memoryEnd);

  assert.ok(memoryStart >= 0 && memoryEnd > memoryStart, "Memory OS is missing");
  assert.match(memory, /data-memory-tab="bits">BIT BLOODLINES<\/button>/);
  assert.match(memory, /data-feature-styles="[^"]*bit-bloodline\.css[^"]*"/);
  assert.match(
    memory,
    /data-feature-scripts="[^"]*bit-bloodline-engine\.js[^"]*bit-bloodline-ui\.js[^"]*wwam-bit-bloodline-host\.js[^"]*"/,
  );
  assert.doesNotMatch(html, /<script[^>]+src=["'][^"']*bit-bloodline/i);
  assert.doesNotMatch(html, /<link[^>]+href=["'][^"']*bit-bloodline/i);
  assert.doesNotMatch(
    html,
    /<section\s+(?:[^>]*\s)?(?:id|class)=["'][^"']*(?:bit-bloodline|bitBloodline)[^"']*["']/i,
  );

  for (const asset of BLOODLINE_ASSETS) {
    assert.equal(fs.existsSync(path.join(demo, asset)), true, `${asset} is missing`);
  }

  assert.match(app, /WWAMBitBloodlineHost\.view\(lineages\)/);
  assert.match(app, /WWAMBitBloodlineHost\)\s*window\.WWAMBitBloodlineHost\.destroy\(\)/);
  assert.match(app, /loadPlayer\(p\.sourceId,p\.at,p\.end\)/);
  assert.match(host, /WWAMSourceDossierAccess/);
  assert.match(host, /typeof access\.load !== "function"/);
  assert.match(host, /\/slenderman\/i/);
  assert.match(host, /WWAMMemoryCutLauncher\.request/);
  assert.ok(
    fs.statSync(path.join(demo, "app.js")).size < 255000,
    "app.js must stay below the V5.21 continuity size ceiling",
  );
});

test("the release proof stays pinned to 4 / 25 / 12 / 350", () => {
  const { engine } = buildFixture();
  const lineages = plain(engine.list());
  const stats = plain(engine.getStats());
  const performances = lineages.flatMap((lineage) => lineage.performances);
  const sourceIds = new Set(performances.map((performance) => performance.sourceId));

  assert.equal(stats.lineages, 4);
  assert.equal(stats.performances, 25);
  assert.equal(stats.sources, 12);
  assert.equal(
    performances.reduce((total, performance) => total + performance.duration, 0),
    350,
  );
  assert.equal(performances.length, 25);
  assert.equal(sourceIds.size, 12);
  assert.equal(new Set(performances.map((performance) => performance.receiptKey)).size, 25);
  assert.ok(
    performances.every(
      (performance) => performance.end - performance.at === 14,
    ),
  );

  for (const lineage of lineages) {
    const pinned = PINNED_LINEAGES[lineage.id];
    assert.ok(pinned, `unexpected lineage ${lineage.id}`);
    assert.equal(lineage.appearanceCount, pinned.windows);
    assert.equal(lineage.sourceCount, pinned.sources);
    assert.equal(lineage.elapsedDays, pinned.days);
    assert.equal(lineage.echoStats.context, pinned.contexts);
    assert.equal(lineage.echoStats.signal, pinned.signals);
    assert.equal(
      lineage.performances.reduce(
        (total, performance) => total + performance.duration,
        0,
      ),
      pinned.seconds,
    );
  }

  const slenderman = engine.get("ancestry:bit-slenderman-dispatch");
  assert.equal(slenderman.appearanceCount, 6);
  assert.equal(slenderman.sourceCount, 6);
  assert.equal(slenderman.elapsedDays, 1916);
  assert.equal(
    slenderman.performances.reduce(
      (total, performance) => total + performance.duration,
      0,
    ),
    84,
  );

  assert.deepEqual(
    plain(engine.get("ancestry:bit-feldman-frequency").overlaps),
    [{
      sourceId: "ag3axSC9BpU",
      leftReceiptKey: "character-receipt:feldman-titanic-two",
      rightReceiptKey: "character-receipt:feldman-batman",
      overlapStart: 10925.68,
      overlapEnd: 10928.72,
      overlapSeconds: 3.04,
      preserved: true,
      merged: false,
    }],
  );
});

test("52 unbounded machine echoes stay quarantined outside playback and cuts", () => {
  const { engine } = buildFixture();
  const lineages = plain(engine.list());
  const echoes = lineages.flatMap((lineage) => lineage.echoes);
  const stats = plain(engine.getStats());

  assert.equal(stats.echoes, 52);
  assert.equal(stats.echoContext, 28);
  assert.equal(stats.echoSignals, 24);
  assert.equal(stats.playableEchoes, 0);
  assert.equal(stats.cutEligibleEchoes, 0);
  assert.equal(echoes.length, 52);
  assert.equal(new Set(echoes.map((echo) => echo.receiptKey)).size, 52);
  assert.ok(
    echoes.every(
      (echo) => (
        echo.navigationOnly === true
        && echo.quarantined === true
        && echo.machineCandidate === true
        && echo.boundedEnd === false
        && echo.performanceEvidence === false
        && echo.playable === false
        && echo.cutEligible === false
        && echo.promotionAllowed === false
        && !Object.hasOwn(echo, "end")
        && !Object.hasOwn(echo, "duration")
        && !Object.hasOwn(echo, "excerpt")
      ),
    ),
  );

  for (const lineage of lineages) {
    const packet = plain(engine.compileCutPacket(lineage.id));
    assert.ok(Object.values(packet.authority).every((value) => value === false));
    assert.equal(packet.selections.length, lineage.performances.length);
    assert.deepEqual(
      packet.selections.map((selection) => ({
        receiptKey: selection.receiptKey,
        sourceId: selection.sourceId,
        at: selection.at,
        end: selection.end,
      })),
      lineage.performances.map((performance) => ({
        receiptKey: performance.receiptKey,
        sourceId: performance.sourceId,
        at: performance.at,
        end: performance.end,
      })),
    );
    assert.ok(
      lineage.echoes.every(
        (echo) => !packet.selections.some(
          (selection) => selection.receiptKey === echo.receiptKey,
        ),
      ),
    );
    assert.equal(lineage.boundaries.trueOrigin, false);
    assert.equal(lineage.boundaries.speakerContinuity, false);
    assert.equal(lineage.boundaries.causality, false);
    assert.equal(lineage.boundaries.canonMutated, false);
  }
});

test("public chronology stays neutral and the compiler stays channel-portable", () => {
  const engine = readDemo("bit-bloodline-engine.js");
  const ui = readDemo("bit-bloodline-ui.js");
  const featureTest = readRoot("tests/bit-bloodline-engine.test.mjs");
  const guide = readRoot("docs/BIT_BLOODLINES.md");
  const memoryOs = readRoot("docs/YOUTUBE_WIKI_MEMORY_OS.md");

  assert.match(ui, /EARLIEST CURATED WINDOW IN CURRENT INDEX/);
  assert.match(ui, /INDEXED PERFORMANCE CANDIDATE/);
  assert.match(ui, /LATEST CURATED WINDOW IN CURRENT INDEX/);
  assert.match(ui, /THE TAPE CANNOT ESTABLISH/);
  assert.match(ui, /Speaker continuity, true origin/);
  assert.match(guide, /Chronology labels must not say:/);
  assert.match(guide, /mutation/);
  assert.match(guide, /callback confirmed/);
  assert.match(guide, /first-ever or true origin/);

  assert.doesNotMatch(
    engine,
    /WWAM|Halloween|Loomis|Challis|Slenderman|Feldman|horror|movie/i,
  );
  assert.match(engine, /options\.policy/);
  assert.match(featureTest, /neutral-racing/);
  assert.match(featureTest, /CAR 33 RECURRING CHARGE/);
  assert.match(featureTest, /kind:\s*"race-moment"/);
  assert.match(featureTest, /entityFields:\s*\["patternId", "subjectId"\]/);
  assert.match(guide, /The Announcer's Curse/);
  assert.match(guide, /cannot declare that an announcer caused a wreck/);
  assert.match(memoryOs, /source-locked recurrence trails/i);
});
