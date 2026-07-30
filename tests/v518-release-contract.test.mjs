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

const SECTION_IDS = {
  proof: "sourceDossierProof",
  player: "sourceDossierPlayerSection",
  wiki: "sourceDossierShowWiki",
  inside: "sourceDossierInside",
  ask: "sourceDossierAsk",
  footprint: "sourceDossierFootprint",
  wake: "sourceDossierWake",
  chronology: "sourceDossierChronology",
  work: "sourceDossierWork",
  aftermath: "sourceDossierAftermath",
  boundary: "sourceDossierBoundary",
};

function frozenObject(source, name) {
  const match = source.match(new RegExp(
    `var\\s+${name}\\s*=\\s*Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\);`,
  ));
  assert.ok(match, `${name} is missing`);
  return Object.fromEntries(Array.from(
    match[1].matchAll(/\b([a-z]+)\s*:\s*["']([^"']+)["']/g),
    (entry) => [entry[1], entry[2]],
  ));
}

function sourceDossierLoaderAssets(app) {
  const manifestLoad = app.search(
    /loader\.load\(["']source-dossier-assets\.js\?v=[^"']+["']\)/,
  );
  const manifestRead = app.indexOf("window.WWAM_SOURCE_DOSSIER_ASSETS");
  assert.match(
    app,
    /loader\.load\(["']source-dossier-assets\.js\?v=[^"']+["']\)/,
    "Source Dossier manifest loader is missing",
  );
  assert.match(
    app,
    /window\.WWAM_SOURCE_DOSSIER_ASSETS\s*\|\|\s*\[\]/,
    "Source Dossier manifest binding is missing",
  );
  assert.ok(manifestLoad >= 0);
  assert.ok(
    manifestRead > manifestLoad,
    "Source Dossier manifest must load before its global is read",
  );
  assert.match(
    app,
    /return\s+assets\.reduce\(function\s*\(promise,\s*source\)\s*\{[\s\S]{0,180}loader\.load\(source\)[\s\S]{0,120}Promise\.resolve\(\)/,
    "Source Dossier manifest entries are not consumed by the ordered loader",
  );
  const manifest = readDemo("source-dossier-assets.js");
  const match = manifest.match(
    /WWAM_SOURCE_DOSSIER_ASSETS\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/,
  );
  assert.ok(match, "Source Dossier asset manifest is missing");
  return Array.from(
    match[1].matchAll(/["']([^"']+\.js(?:\?[^"']+)?)["']/g),
    (entry) => entry[1].split("?")[0],
  );
}

function loadCompanionRuntime() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "archive-atlas-data.js",
    "showcase-engine.js",
    "lore-engine.js",
    "red-band-ranking-v2.js",
    "tape-companion-engine.js",
  ]) {
    vm.runInContext(readDemo(file), context, { filename: file });
  }

  const { window } = context;
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const lore = window.WWAMLoreEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
  });
  const rankedCandidates = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE,
  });
  const atlasSources = window.WWAM_ARCHIVE_ATLAS.records.map((record) => {
    const lanes = Array.isArray(record.lanes) ? [...record.lanes] : [];
    return {
      id: record.id,
      title: record.title,
      date: record.date,
      durationSeconds: record.duration,
      type: lanes.includes("commentary-catalog") ? "commentary" : "livestream",
      lane: lanes[0] || "archive-metadata",
      lanes,
      url: record.url,
      captioned: record.coverage === "deeply-indexed",
    };
  });
  const registeredSources = showcase.sources.concat(atlasSources);
  const companion = window.WWAMTapeCompanionEngine.create({
    showcase,
    sources: registeredSources,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE,
    lore,
    rankedCandidates,
  });

  return {
    window,
    showcase,
    atlasSources,
    registeredSources,
    companion,
  };
}

function metadataMap(html) {
  const output = new Map();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = Object.fromEntries(Array.from(
      match[0].matchAll(/\b(name|property|content)=["']([^"']*)["']/gi),
      (entry) => [entry[1].toLowerCase(), entry[2]],
    ));
    const key = attributes.name || attributes.property;
    if (key && Object.hasOwn(attributes, "content")) {
      output.set(key, attributes.content);
    }
  }
  return output;
}

test("V5.18 package, lane-specific cache keys, and Ask This Tape docs move together", () => {
  const manifest = JSON.parse(readRoot("package.json"));
  const lock = JSON.parse(readRoot("package-lock.json"));
  const html = readDemo("index.html");

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");

  const cacheVersions = Array.from(
    html.matchAll(/\?v=(\d+\.\d+\.\d+)/g),
    (match) => match[1],
  );
  assert.ok(cacheVersions.length >= 2, "expected versioned runtime cache keys");
  assert.ok(
    new Set(cacheVersions).size >= 5,
    "independently versioned runtime lanes unexpectedly collapsed",
  );
  assert.match(html, /styles\.css\?v=0\.5\.34-livewire-mobile/);
  assert.match(html, /search-engine\.js\?v=0\.5\.41-expanded-character-canon/);
  assert.match(html, /youtube-playback\.js\?v=2\.4\.3-hosted-force/);
  assert.match(html, /app\.js\?v=0\.5\.\d+-[a-z0-9-]+/);
  assert.match(html, /guided-shell\.js\?v=1\.2\.3-recovered/);

  const guidePath = path.join(root, "docs", "ASK_THIS_TAPE.md");
  assert.equal(fs.existsSync(guidePath), true, "Ask This Tape guide is missing");
  const guide = fs.readFileSync(guidePath, "utf8");
  assert.match(guide, /V5\.18|0\.5\.18/i);
  assert.match(guide, /shokker-source-query\/v1/);
  assert.match(guide, /shokker-source-query-result\/v1/);
  assert.match(guide, /exact[- ]source|source[- ]locked/i);

  const references = [
    readRoot("README.md"),
    readRoot("docs/V5_OVERVIEW.md"),
    readRoot("docs/CHANGELOG.md"),
    readRoot("docs/SOURCE_DOSSIER.md"),
  ].join("\n");
  assert.match(
    references,
    /(?:docs\/)?ASK_THIS_TAPE\.md/,
    "the public documentation index must reference the Ask This Tape guide",
  );
});

test("the exact-source engine loads in order and replaces title-to-global Ask", () => {
  const app = readDemo("app.js");
  const ui = readDemo("source-dossier-ui.js");
  const assets = sourceDossierLoaderAssets(app);
  const recapEngineIndex = assets.indexOf("episode-recap-engine.js");
  const recapAdapterIndex = assets.indexOf("wwam-episode-recap-adapter.js");
  const engineIndex = assets.indexOf("source-dossier-engine.js");
  const adapterIndex = assets.indexOf("wwam-source-dossier-adapter.js");
  const queryIndex = assets.indexOf("source-query-engine.js");
  const uiIndex = assets.indexOf("source-dossier-ui.js");

  for (const [asset, index] of [
    ["episode-recap-engine.js", recapEngineIndex],
    ["wwam-episode-recap-adapter.js", recapAdapterIndex],
    ["source-dossier-engine.js", engineIndex],
    ["wwam-source-dossier-adapter.js", adapterIndex],
    ["source-query-engine.js", queryIndex],
    ["source-dossier-ui.js", uiIndex],
  ]) {
    assert.ok(index >= 0, `${asset} is missing from the lazy-loader`);
    assert.equal(fs.existsSync(path.join(demo, asset)), true, `${asset} is missing`);
  }
  assert.ok(recapEngineIndex < recapAdapterIndex, "recap adapter must follow its engine");
  assert.ok(recapAdapterIndex < engineIndex, "dossier engine must follow the recap lane");
  assert.ok(engineIndex < adapterIndex, "adapter must follow the dossier engine");
  assert.ok(adapterIndex < queryIndex, "query engine must follow the exact-source adapter");
  assert.ok(queryIndex < uiIndex, "UI must load after the query engine");

  assert.match(
    app,
    /sourceQueryEngine\s*=\s*window\.ShokkerSourceQuery\.create\s*\(\s*\{\s*dossierEngine\s*:\s*sourceDossierEngine/,
  );
  assert.match(
    app,
    /window\.WWAMSourceDossierUI\.create\s*\(\s*\{[\s\S]{0,180}queryEngine\s*:\s*sourceQueryEngine/,
  );
  assert.doesNotMatch(app, /\bonAsk(?:Source)?\s*:/);
  assert.doesNotMatch(
    app,
    /payload\.title[\s\S]{0,160}(?:askInput|askEngine|ask\s*\()/i,
  );
  assert.doesNotMatch(ui, /\bcallbacks\.ask\s*\(/);
  assert.match(ui, /queryEngine\.answer\s*\(\s*request\s*\)/);
  assert.match(ui, /Archive-wide Ask was not used/i);
});

test("source sections, query options, and the newest-show hero action stay exact", () => {
  const app = readDemo("app.js");
  const ui = readDemo("source-dossier-ui.js");
  const html = readDemo("index.html");

  assert.deepEqual(
    frozenObject(app, "SOURCE_DOSSIER_SECTION_IDS"),
    SECTION_IDS,
  );
  assert.deepEqual(frozenObject(ui, "SECTION_IDS"), SECTION_IDS);
  assert.match(
    app,
    /hasOwnProperty\.call\(SOURCE_DOSSIER_SECTION_IDS,\s*section\)/,
  );
  assert.match(
    app,
    /ui\.render\(sourceId,\s*\{[\s\S]{0,180}section:\s*section,[\s\S]{0,120}query:\s*String\(settings\.query\s*\|\|\s*""\)\.slice\(0,\s*240\)/,
  );
  assert.match(ui, /state\.section\s*=\s*safeSection\(settings\.section\)/);
  assert.match(
    ui,
    /state\.query\s*=\s*clean\(settings\.query\)\.slice\(0,\s*240\)\s*\|\|\s*DEFAULT_SOURCE_QUERY/,
  );
  assert.match(
    ui,
    /if\s*\(clean\(settings\.query\)\)\s*runSourceQuery\(state\.query,\s*false\)/,
  );

  assert.match(
    html,
    /id="latestDossierButton"[^>]*>OPEN THE NEWEST SHOW WIKI/i,
  );
  const heroHandler = app.match(
    /document\.getElementById\(["']latestDossierButton["']\)\.onclick\s*=\s*function\s*\(\)\s*\{([\s\S]*?)\n\s*\};/,
  );
  assert.ok(heroHandler, "the July 23 hero control has no action");
  assert.match(heroHandler[1], /\(live\.streams\[0\]\s*\|\|\s*\{id:"LV2rmwEA0w4"\}\)\.id/);
  assert.match(heroHandler[1], /openSourceDossier\s*\(/);
  assert.match(heroHandler[1], /section:\s*["']wiki["']/);
  assert.match(heroHandler[1], /routeMode:\s*["']push["']/);
  assert.match(heroHandler[1], /autoplay:\s*false/);
});

test("Showcase Mode keeps the current exact-source registry proof explicit", () => {
  const window = {};
  vm.runInNewContext(readDemo("pitch-tour-data.js"), {
    window,
    globalThis: window,
  }, { filename: "pitch-tour-data.js" });

  const sourceSlide = window.WWAM_PITCH_TOUR.find(
    (slide) => slide.action && slide.action.kind === "source",
  );
  assert.ok(sourceSlide, "Showcase Mode is missing its source-session slide");
  const proof = sourceSlide.proof;
  for (const value of ["510", "194", "16", "300", "3,310"]) {
    assert.match(proof, new RegExp(`\\b${value.replace(",", ",?")}\\b`));
  }
  assert.match(proof, /SOURCE FILES/i);
  assert.match(proof, /FULL SHOW WIKIS/i);
  assert.match(proof, /TOPIC-NAVIGATION ONLY/i);
  assert.match(proof, /HONEST SOURCE BRIEFS/i);
  assert.match(proof, /SOURCE RECEIPTS/i);
  assert.doesNotMatch(proof, /FROZEN|PROMOTED PROOF SET|\b872\b/i);
});

test("Tape Companion uses the Atlas union and preserves 510 / 71 / 439", () => {
  const ui = readDemo("tape-companion-ui.js");
  assert.match(
    ui,
    /registeredSources\s*=\s*\(showcase\.sources\s*\|\|\s*\[\]\)\.concat\s*\(/,
  );
  assert.match(ui, /\(atlas\.records\s*\|\|\s*\[\]\)\.map\s*\(/);
  assert.match(ui, /captioned:\s*record\.coverage\s*===\s*["']deeply-indexed["']/);
  assert.match(ui, /sources:\s*registeredSources/);

  const {
    showcase,
    atlasSources,
    registeredSources,
    companion,
  } = loadCompanionRuntime();
  const expectedIds = new Set([
    ...showcase.sources.map((source) => source.id),
    ...atlasSources.map((source) => source.id),
  ]);
  const sources = companion.listSources();
  const actualIds = new Set(sources.map((source) => source.id));
  const ready = sources.filter(
    (source) => source.readiness.status === "companion-ready",
  );
  const sourceOnly = sources.filter(
    (source) => source.readiness.mode === "source-only",
  );

  assert.ok(
    registeredSources.length > expectedIds.size,
    "the release fixture must exercise source-ID de-duplication",
  );
  assert.equal(expectedIds.size, 510);
  assert.equal(actualIds.size, 510);
  assert.deepEqual([...actualIds].sort(), [...expectedIds].sort());
  assert.equal(companion.metrics.sources, 510);
  assert.equal(companion.metrics.companionReady, 71);
  assert.equal(companion.metrics.limited, 439);
  assert.equal(ready.length, 71);
  assert.equal(sourceOnly.length, 439);
  assert.ok(sourceOnly.every(
    (source) => source.readiness.allowsTimedClaims === false,
  ));
  assert.equal(companion.evidencePolicy.sourcePlaybackOnly, true);
});

test("/og.png and both metadata surfaces advertise the living show-wiki experience", () => {
  const html = readDemo("index.html");
  const layout = readRoot("app/layout.tsx");
  const metadata = metadataMap(html);
  const imagePath = path.join(root, "public", "og.png");
  const image = fs.readFileSync(imagePath);

  assert.deepEqual(
    [...image.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
  assert.ok(image.length > 100_000, "og.png looks like a placeholder");

  assert.match(metadata.get("description") || "", /playable show wikis/i);
  assert.match(metadata.get("description") || "", /2025.2026 canon/i);
  assert.match(metadata.get("og:title") || "", /Living Archive/i);
  assert.match(metadata.get("og:description") || "", /Every show becomes a playable wiki/i);
  assert.match(metadata.get("og:description") || "", /source-linked WWAM lore/i);
  assert.equal(metadata.get("og:image"), "/og.png");
  assert.match(metadata.get("og:image:alt") || "", /Living Archive/i);
  assert.equal(metadata.get("twitter:card"), "summary_large_image");
  assert.equal(metadata.get("twitter:image"), "/og.png");

  assert.match(layout, /new URL\(["']\/og\.png["'],\s*base\)/);
  assert.match(layout, /title:\s*["'][^"']*Living Archive[^"']*["']/);
  assert.match(layout, /Every show becomes a playable wiki/);
  assert.match(
    layout,
    /images:\s*\[\{\s*url:\s*image,\s*width:\s*1200,\s*height:\s*630,[\s\S]{0,100}Living Archive/,
  );
});
