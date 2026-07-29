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

const MATRIX_STYLE_LIST =
  "ask-review.css,play-answer.css,receipt-matrix.css";
const MATRIX_SCRIPT_LIST = [
  "ask-review-engine.js",
  "ask-review-ui.js",
  "channel-pack-contract.js",
  "wwam-channel-pack-adapter.js",
  "play-answer-engine.js",
  "play-answer-ui.js?v=human4-sourcecut",
  "receipt-matrix-query.js?v=0.5.21-1",
  "receipt-matrix-engine.js",
  "receipt-matrix-ui.js",
  "wwam-receipt-matrix-host.js",
].join(",");
const MATRIX_ASSETS = [
  "receipt-matrix.css",
  "receipt-matrix-query.js",
  "receipt-matrix-engine.js",
  "receipt-matrix-ui.js",
  "wwam-receipt-matrix-host.js",
];

const WWAM_POLICY = {
  id: "wwam-promoted-curated-character-performance/v1",
  source: {
    authority: "promoted-lane",
    coverage: "caption-backed",
  },
  receiptContracts: [
    {
      kind: "character-performance",
      evidenceType: "curated-character-performance",
      evidenceBasis: "exact-showcase-receipt",
      reviewState: "timestamp-validated-human-curated-candidate",
      publicExcerptAllowed: true,
      promotionAllowed: false,
    },
  ],
  requireSpeakerUndiarized: true,
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

function sectionById(html, id) {
  const pattern = new RegExp(
    `<section\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/section>`,
    "i",
  );
  const match = html.match(pattern);
  assert.ok(match, `#${id} section is missing`);
  return match[0];
}

let realFixture;

function buildRealFixture() {
  if (realFixture) return realFixture;
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
    "episode-guides.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "receipt-matrix-engine.js",
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
    episodeGuides: window.WWAM_EPISODE_GUIDES,
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:v521-release",
    },
  });
  const dossierEngine = window.ShokkerSourceDossier.create(adapted);
  const engine = window.ShokkerReceiptMatrix.create({
    dossierEngine,
    policy: WWAM_POLICY,
  });
  realFixture = { window, dossierEngine, engine };
  return realFixture;
}

function racingReceipt(key, sourceId, entityIds, at) {
  return {
    key,
    at,
    end: at + 18,
    kind: "race-moment",
    label: "EXACT RACE RECEIPT",
    excerpt: "Car thirty three reaches the stripe in a photo finish.",
    evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
    evidenceType: "caption-excerpt",
    evidenceBasis: "official-broadcast-caption",
    reviewState: "timestamp-validated-human-reviewed",
    speaker: null,
    speakerStatus: "not-diarized",
    promotionAllowed: false,
    publicExcerptAllowed: true,
    entityIds,
    url: `https://www.youtube.com/watch?v=${sourceId}&t=${at}s`,
  };
}

function racingEntity(id, label, keys) {
  return {
    id,
    label,
    type: id.startsWith("driver:") ? "driver" : "event",
    basis: "timestamped-receipt",
    receiptKeys: keys,
  };
}

function racingSource(id, title, date, receipts, entities) {
  return {
    id,
    title,
    displayTitle: title,
    date,
    duration: 4200,
    views: 500,
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`,
    availability: "public-at-snapshot",
    liveStatus: "was-live",
    coverage: "caption-backed",
    authority: "promoted-lane",
    lanes: ["wednesday-race"],
    sourceType: "race-broadcast",
    wordsAudited: 9000,
    summary: {
      text: "A registered Wednesday race broadcast.",
      basis: "caption-derived source summary",
    },
    receipts,
    entities,
    artifacts: [],
    rightsPolicy: {
      speakerClaimsAllowed: false,
      rightsCleared: false,
    },
    warnings: ["Booth speakers are not diarized."],
    metrics: {},
  };
}

function buildRacingFixture() {
  const window = load([
    "source-dossier-engine.js",
    "receipt-matrix-engine.js",
  ]);
  const shared = racingReceipt(
    "RACEFILE01A:shared",
    "RACEFILE01A",
    ["driver:car-33", "event:photo-finish"],
    4000,
  );
  const driver = racingReceipt(
    "RACEFILE02B:driver",
    "RACEFILE02B",
    ["driver:car-33"],
    120,
  );
  const dossierEngine = window.ShokkerSourceDossier.create({
    schema: "shokker-source-dossier-input/v1",
    channel: {
      id: "neutral-racing",
      label: "Neutral Racing Archive",
      packFingerprint: "cp1-0000000000000521",
    },
    snapshotDate: "2026-07-24",
    sources: [
      racingSource(
        "RACEFILE01A",
        "Wednesday Round One",
        "2026-07-01",
        [shared],
        [
          racingEntity("driver:car-33", "Car 33", [shared.key]),
          racingEntity("event:photo-finish", "Photo Finish", [shared.key]),
        ],
      ),
      racingSource(
        "RACEFILE02B",
        "Wednesday Round Two",
        "2026-07-08",
        [driver],
        [racingEntity("driver:car-33", "Car 33", [driver.key])],
      ),
    ],
  });
  const engine = window.ShokkerReceiptMatrix.create({
    dossierEngine,
    policy: {
      id: "league-reviewed-race-moments/v1",
      source: {
        authority: "promoted-lane",
        coverage: "caption-backed",
      },
      receiptContracts: [
        {
          kind: "race-moment",
          evidenceType: "caption-excerpt",
          evidenceBasis: "official-broadcast-caption",
          reviewState: "timestamp-validated-human-reviewed",
          publicExcerptAllowed: true,
          promotionAllowed: false,
        },
      ],
      requireSpeakerUndiarized: true,
    },
  });
  return { window, engine };
}

test("V5.21 package and public documentation remain pinned while asset cache keys evolve independently", () => {
  const manifest = JSON.parse(readRoot("package.json"));
  const lock = JSON.parse(readRoot("package-lock.json"));
  const html = readDemo("index.html");
  const readme = readRoot("README.md");
  const overview = readRoot("docs/V5_OVERVIEW.md");
  const changelog = readRoot("docs/CHANGELOG.md");
  const runbook = readRoot("docs/CREATOR_DEMO_RUNBOOK.md");
  const memoryOs = readRoot("docs/YOUTUBE_WIKI_MEMORY_OS.md");
  const guide = readRoot("docs/RECEIPT_MATRIX.md");
  const bloodlines = readRoot("docs/BIT_BLOODLINES.md");

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");

  const cacheVersions = Array.from(
    html.matchAll(/\?v=(\d+\.\d+\.\d+)/g),
    (match) => match[1],
  );
  assert.ok(cacheVersions.length >= 2, "expected versioned runtime cache keys");
  assert.ok(
    cacheVersions.includes(manifest.version),
    "at least one runtime cache key must retain the documented package version",
  );
  assert.ok(
    cacheVersions.every((version) => /^\d+\.\d+\.\d+$/.test(version)),
    "runtime cache-key prefixes must remain semantic versions",
  );

  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(readme, /docs\/RECEIPT_MATRIX\.md/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(changelog, /^## 0\.5\.21 .*V5\.21 Receipt Matrix/m);
  assert.match(runbook, /current V5\.21 build/i);
  assert.match(
    memoryOs,
    /Current WWAM demonstration release: \*\*V5\.21 \/ 0\.5\.21\*\*/,
  );
  assert.match(guide, /Release contract for \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(changelog, /^## 0\.5\.20 .*V5\.20 Bit Bloodlines/m);
  assert.match(bloodlines, /Release contract for \*\*V5\.20 \/ 0\.5\.20\*\*/);
});

test("Receipt Matrix demand-loads only inside the existing Ask surface in exact order", () => {
  const html = readDemo("index.html");
  const ask = sectionById(html, "ask");
  const curation = readDemo("curation.js");
  const styles = ask.match(/data-feature-styles=["']([^"']+)["']/)?.[1];
  const scripts = ask.match(/data-feature-scripts=["']([^"']+)["']/)?.[1];

  assert.equal(styles, MATRIX_STYLE_LIST);
  assert.equal(scripts, MATRIX_SCRIPT_LIST);
  assert.match(
    ask,
    /Ask about a movie, bit, character, or show\. Get the answer first, then jump straight to the playable moments behind it\./,
  );
  assert.match(
    ask,
    /The archive compares source-linked moments, keeps follow-up context, and shows uncertainty when the tape cannot prove something\./,
  );
  assert.match(
    curation,
    /Which uploads contain both Dr\. Loomis and Dr\. Challis performances\?/,
  );

  for (const asset of MATRIX_ASSETS) {
    assert.equal(fs.existsSync(path.join(demo, asset)), true, `${asset} is missing`);
  }

  assert.doesNotMatch(
    html,
    /<script[^>]+src=["'][^"']*(?:receipt-matrix|wwam-receipt-matrix)/i,
  );
  assert.doesNotMatch(
    html,
    /<link[^>]+href=["'][^"']*receipt-matrix/i,
  );
  assert.doesNotMatch(
    html,
    /<section\b[^>]*(?:id|class)=["'][^"']*receipt-matrix/i,
  );
  assert.doesNotMatch(
    html,
    /<a\b[^>]+href=["']#(?:receipt-matrix|matrix)["']/i,
  );
  assert.equal((html.match(/\bid=["']ask["']/g) || []).length, 1);
});

test("the real 510-source build pins Loomis 9/7 and Loomis plus Challis 15/6", () => {
  const { engine } = buildRealFixture();
  const loomis = plain(engine.query({
    entityIds: ["character:loomis"],
    quantifier: "any",
    order: "source-date-asc",
  }));
  const intersection = plain(engine.query({
    entityIds: ["character:loomis", "character:challis"],
    quantifier: "all",
    order: "source-date-asc",
  }));

  assert.equal(engine.getStats().registrySources, 510);
  assert.equal(engine.getStats().registryReceipts, 1495);
  assert.equal(loomis.uniqueSourceCount, 7);
  assert.equal(loomis.eligibleReceiptCount, 9);
  assert.deepEqual(
    loomis.groups.map((group) => [group.sourceId, group.receiptCount]),
    [
      ["WyT--HIrL8U", 1],
      ["Qc2vVFMO4ts", 1],
      ["N-UahfG8-gM", 2],
      ["tL9zmuyrtl4", 1],
      ["7PzSj-oIRjA", 1],
      ["ag3axSC9BpU", 1],
      ["LV2rmwEA0w4", 2],
    ],
  );
  assert.equal(intersection.uniqueSourceCount, 6);
  assert.equal(intersection.eligibleReceiptCount, 15);
  assert.deepEqual(
    intersection.groups.map((group) => [group.sourceId, group.receiptCount]),
    [
      ["WyT--HIrL8U", 2],
      ["N-UahfG8-gM", 3],
      ["tL9zmuyrtl4", 2],
      ["7PzSj-oIRjA", 2],
      ["ag3axSC9BpU", 3],
      ["LV2rmwEA0w4", 3],
    ],
  );
});

test("the four-character group ranks the true 6/5/3 source leaders across 30 receipts", () => {
  const { engine } = buildRealFixture();
  const result = plain(engine.query({
    entityIds: [
      "character:loomis",
      "character:challis",
      "character:slenderman",
      "character:corey-feldman",
    ],
    quantifier: "any",
    order: "receipt-count-desc",
  }));

  assert.equal(result.uniqueSourceCount, 14);
  assert.equal(result.eligibleReceiptCount, 30);
  assert.deepEqual(
    result.groups.slice(0, 3).map((group) => [
      group.sourceId,
      group.receiptCount,
    ]),
    [
      ["LV2rmwEA0w4", 6],
      ["ag3axSC9BpU", 5],
      ["N-UahfG8-gM", 3],
    ],
  );
  assert.equal(
    new Set(
      result.groups.flatMap((group) => (
        group.receipts.map((receipt) => receipt.receiptKey)
      )),
    ).size,
    30,
  );
});

test("the query router produces the five exact source-matrix route families", () => {
  const window = load(["receipt-matrix-query.js"]);
  const router = window.ShokkerReceiptMatrixQuery.create({
    entities: [
      {
        id: "character:loomis",
        label: "Dr. Loomis",
        aliases: ["Loomis", "Dr Loomis"],
      },
      {
        id: "character:challis",
        label: "Dr. Challis",
        aliases: ["Challis", "Dr Challis"],
      },
      {
        id: "character:slenderman",
        label: "Slenderman",
        aliases: ["Slendy"],
      },
      {
        id: "character:corey-feldman",
        label: "Corey Feldman",
        aliases: ["Feldman"],
      },
    ],
    groups: [
      {
        id: "recurring-characters",
        label: "Recurring Characters",
        entityIds: [
          "character:loomis",
          "character:challis",
          "character:slenderman",
          "character:corey-feldman",
        ],
        aliases: ["characters", "character performances"],
      },
    ],
  });
  const cases = [
    [
      "How many uploads feature Dr Loomis?",
      "entity-source-count",
      "source-count",
      ["character:loomis"],
      "any",
      "source-date-asc",
    ],
    [
      "Which sources contain both Loomis and Challis?",
      "source-entity-intersection",
      "source-list",
      ["character:challis", "character:loomis"],
      "all",
      "receipt-count-desc",
    ],
    [
      "Which stream has most character performances?",
      "group-source-ranking",
      "source-ranking",
      [
        "character:challis",
        "character:corey-feldman",
        "character:loomis",
        "character:slenderman",
      ],
      "any",
      "receipt-count-desc",
    ],
    [
      "Show every Loomis performance chronologically",
      "entity-performance-chronology",
      "performance-list",
      ["character:loomis"],
      "any",
      "source-date-asc",
    ],
    [
      "Build a Loomis supercut across years",
      "entity-lineage",
      "lineage",
      ["character:loomis"],
      "any",
      "source-date-asc",
    ],
  ];

  for (const [
    query,
    mode,
    answerShape,
    entityIds,
    quantifier,
    order,
  ] of cases) {
    const route = plain(router.route(query));
    assert.equal(route.schema, "shokker-receipt-matrix-route/v1");
    assert.equal(route.matched, true, query);
    assert.equal(route.status, "supported", query);
    assert.equal(route.mode, mode, query);
    assert.equal(route.answerShape, answerShape, query);
    assert.deepEqual(route.matrix, {
      schema: "shokker-receipt-matrix-request/v1",
      entityIds,
      quantifier,
      order,
    });
    if (mode === "entity-performance-chronology" || mode === "entity-lineage") {
      assert.equal(typeof route.chronologyWarning, "string");
    } else {
      assert.equal(route.chronologyWarning, null);
    }
  }
});

test("WWAM host binds the router, canonical core, embedded UI, and Source Dossier API", () => {
  const host = readDemo("wwam-receipt-matrix-host.js");
  const query = readDemo("receipt-matrix-query.js");
  const engine = readDemo("receipt-matrix-engine.js");
  const ui = readDemo("receipt-matrix-ui.js");
  const feature = [query, engine, ui, host].join("\n");

  assert.match(host, /var api\s*=\s*Object\.freeze/);
  assert.match(host, /root\.WWAMReceiptMatrixHost\s*=\s*api/);
  for (const method of ["bind", "match", "handle", "destroy", "getState"]) {
    assert.match(
      host,
      new RegExp(`${method}:\\s*${method}\\b`),
      `${method} is missing from the public host`,
    );
  }
  assert.match(host, /root\.ShokkerReceiptMatrixQuery/);
  assert.match(host, /root\.ShokkerReceiptMatrix\b/);
  assert.match(host, /root\.ShokkerReceiptMatrixUI/);
  assert.match(host, /WWAMSourceDossierAccess/);
  assert.match(host, /access\.load\(\)/);
  assert.match(host, /access\.get\(\)/);
  assert.match(host, /access\.play\(/);
  assert.match(host, /route\.matrix/);
  assert.match(host, /askForm/);
  assert.match(host, /askInput/);
  assert.match(host, /askResults/);
  assert.match(host, /askStatus/);

  assert.doesNotMatch(feature, /<iframe|<video|<audio/i);
  assert.doesNotMatch(
    feature,
    /createElement\s*\(\s*["'](?:iframe|video|audio)["']\s*\)/i,
  );
  assert.doesNotMatch(host, /\bloadPlayer\b|ShokkerYouTubePlayback|youtube\.com\/embed/i);
  assert.doesNotMatch(host, /\bfetch\s*\(|XMLHttpRequest|WebSocket/i);
});

test("all public matrix authority remains false and exports stay evidence-only", () => {
  const { engine } = buildRealFixture();
  const result = plain(engine.query({
    entityIds: ["character:loomis", "character:challis"],
    quantifier: "all",
    order: "receipt-count-desc",
  }));
  const ui = readDemo("receipt-matrix-ui.js");
  const guide = readRoot("docs/RECEIPT_MATRIX.md");

  assert.ok(Object.values(result.authority).every((value) => value === false));
  assert.ok(
    result.groups.every(
      (group) => Object.values(group.authority).every(
        (value) => value === false,
      ),
    ),
  );
  assert.ok(
    result.groups.flatMap((group) => group.receipts).every(
      (receipt) => (
        receipt.speaker === null
        && receipt.speakerStatus === "not-diarized"
        && receipt.creatorApproved === false
        && receipt.rightsCleared === false
        && receipt.canonMutated === false
        && receipt.mediaCopied === false
      ),
    ),
  );
  assert.match(ui, /shokker-receipt-matrix-export\/v1/);
  assert.match(guide, /An export is an evidence\/navigation packet/);
  assert.match(guide, /must not:[\s\S]*copy audio or video/i);
  assert.match(guide, /Source Dossiers load only after a supported matrix route/);
  assert.match(guide, /playback begins only when a visitor selects/i);
});

test("the same core counts one shared racing receipt once across two entities", () => {
  const { engine } = buildRacingFixture();
  const result = plain(engine.query({
    entityIds: ["event:photo-finish", "driver:car-33"],
    quantifier: "all",
    order: "source-date-asc",
  }));
  const implementation = readDemo("receipt-matrix-engine.js");

  assert.equal(result.status, "supported");
  assert.equal(result.uniqueSourceCount, 1);
  assert.equal(result.eligibleReceiptCount, 1);
  assert.equal(result.groups[0].sourceId, "RACEFILE01A");
  assert.equal(result.groups[0].receiptCount, 1);
  assert.equal(result.groups[0].perEntity[0].receiptCount, 1);
  assert.equal(result.groups[0].perEntity[1].receiptCount, 1);
  assert.deepEqual(
    result.groups[0].receipts[0].matchedEntityIds,
    ["driver:car-33", "event:photo-finish"],
  );
  assert.doesNotMatch(
    implementation,
    /\b(?:WWAM|Halloween|Loomis|Challis|Slenderman|Feldman|horror|movie|race|driver)\b/i,
  );
});
