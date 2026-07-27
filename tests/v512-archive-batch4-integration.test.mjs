import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");

const BATCH_04_IDS = [
  "2FlxuJxv81s",
  "MSVltTVeypc",
  "Qb2rDe-kJkI",
  "3Lu0beSDxcQ",
  "21hL29hicoU",
  "HLDAxs4_3U4",
  "34BwSiucNEI",
  "ETuRUYiQEBM",
  "5k6I18ZekPQ",
  "o0tcJcJk6MY",
];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixture() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "era-capsule-engine.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const { window } = context;
  const batches = [
    window.WWAM_ARCHIVE_DEEP,
    window.WWAM_ARCHIVE_DEEP_BATCH2,
    window.WWAM_ARCHIVE_DEEP_BATCH3,
    window.WWAM_ARCHIVE_DEEP_BATCH4,
  ];
  const portfolio = window.WWAMArchiveDeepPortfolio.create(
    batches,
    window.WWAMArchiveDeepEngine,
  );
  const atlas = window.WWAMArchiveAtlasEngine.create(
    window.WWAM_ARCHIVE_ATLAS,
  );
  const capsules = window.ShokkerEraCapsuleEngine.create({
    atlas,
    archiveDeep: portfolio,
  });
  return {
    window,
    batches: plain(batches),
    batch04: plain(window.WWAM_ARCHIVE_DEEP_BATCH4),
    atlasData: plain(window.WWAM_ARCHIVE_ATLAS),
    portfolio,
    atlas,
    capsules,
  };
}

test("V5.12 release identity and current documentation publish one exact ledger", () => {
  const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
  const manifest = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const readme = read("README.md");
  const overview = read("docs/V5_OVERVIEW.md");
  const changelog = read("docs/CHANGELOG.md");
  const runbook = read("docs/CREATOR_DEMO_RUNBOOK.md");
  const portfolioDoc = read("docs/ARCHIVE_DEEP_PORTFOLIO.md");

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");
  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(changelog, /^## 0\.5\.12 .*V5\.12 Archive Deep Batch 04/m);
  assert.match(runbook, /current V5\.21 build/i);

  const currentDocs = [readme, overview, portfolioDoc, changelog, runbook];
  for (const document of currentDocs) {
    assert.match(
      document,
      /(?:40[\s\S]{0,60}(?:caption-audited )?sources|Caption-audited sources\s*\|\s*40)/i,
    );
    assert.match(document, /97\.7[\s\S]{0,40}hours/i);
    assert.match(
      document,
      /(?:1,216,993[\s\S]{0,40}words|Audited caption words\s*\|\s*1,216,993)/i,
    );
    assert.match(
      document,
      /(?:173,675[\s\S]{0,50}caption events|Parsed caption events\s*\|\s*173,675)/i,
    );
    assert.match(document, /166[\s\S]{0,60}(?:quarantined|machine)/i);
    assert.match(document, /24[\s\S]{0,60}character[\s\S]{0,30}signal/i);
    assert.match(document, /28[\s\S]{0,60}character[\s\S]{0,30}context/i);
    assert.match(
      document,
      /(?:not|none|zero)[\s\S]{0,100}(?:curated )?performances?/i,
    );
    assert.match(document, /fnv1a32:14050c7a/);
    assert.match(document, /fnv1a32:56ca74df/);
  }
});

test("V5.12 composes the exact pinned 40-source quarantine ledger", () => {
  const { batch04, portfolio } = fixture();
  assert.equal(portfolio.version, "1.2.0");
  assert.deepEqual(plain(portfolio.getMetrics()), {
    batches: 4,
    streams: 40,
    captioned: 40,
    restricted: 12,
    limitedCaptionSpans: 1,
    visualRankingQuarantines: 12,
    hours: 97.7,
    wordsAudited: 1216993,
    captionEvents: 173675,
    topicLanes: 400,
    distinctTopics: 48,
    publicMomentCandidates: 166,
    characterSignals: 52,
    snapshotViews: 445949,
  });
  assert.equal(portfolio.verifyFingerprint().actual, "fnv1a32:14050c7a");
  assert.deepEqual(
    plain(portfolio.getSelection().map((batch) => batch.publicFnv1a)),
    [
      "fnv1a32:17045a51",
      "fnv1a32:bcea5692",
      "fnv1a32:f79f2399",
      "fnv1a32:56ca74df",
    ],
  );
  assert.deepEqual(
    batch04.streams.map((stream) => stream.id),
    BATCH_04_IDS,
  );
  assert.deepEqual(batch04.lane, {
    id: "archive-deep-batch-04",
    kind: "caption-audited-quarantine",
    sequence: 4,
    integrationStatus: "integrated-quarantine",
    promotionAllowed: false,
    requiresAuthenticatedReview: true,
  });
  assert.equal(
    batch04.fingerprints.selectionSha256,
    "sha256:cb5c2cd7528c1dcffa6726b8ab17abeda9b808151ecee92566e53bf0068d30af",
  );
  assert.equal(
    batch04.fingerprints.captionSetSha256,
    "sha256:dcfe15a3c00ff419f8afe50585f1b40acac25703e4f2dae5de063927e377b5c6",
  );
  assert.equal(batch04.fingerprints.publicFnv1a, "fnv1a32:56ca74df");
});

test("V5.12 preserves unique identities and every evidence firewall", () => {
  const { portfolio, batch04 } = fixture();
  const streams = portfolio.browse({ sort: "priority" }).records;
  assert.equal(new Set(streams.map((stream) => stream.id)).size, 40);
  assert.deepEqual(
    plain(streams.map((stream) => stream.archivePortfolioRank)),
    Array.from({ length: 40 }, (_, index) => index + 1),
  );
  assert.ok(streams.every((stream) => (
    stream.archiveBatch.candidateState === "quarantined"
    && stream.archiveBatch.promotionAllowed === false
    && stream.archiveBatch.speakerDiarized === false
    && stream.archiveBatch.originAttribution === false
    && stream.rightsPolicy.speakerClaimsAllowed === false
    && stream.rightsPolicy.originClaimsAllowed === false
    && stream.rightsPolicy.visualClaimsAllowed === false
  )));
  assert.ok(portfolio.getMomentCandidates().every((moment) => (
    moment.candidateState === "quarantined"
    && moment.promotionAllowed === false
    && moment.speaker === null
    && moment.evidence.speakerStatus === "not-diarized"
    && moment.evidence.originStatus === "not-inferred"
    && moment.evidence.visualContextVerified === false
  )));

  const restricted = batch04.streams.filter(
    (stream) => stream.rightsPolicy.restrictedToTopicNavigation,
  );
  assert.deepEqual(
    restricted.map((stream) => stream.id),
    ["MSVltTVeypc", "21hL29hicoU", "34BwSiucNEI"],
  );
  assert.ok(restricted.every((stream) => (
    stream.moments.length === 0
    && stream.characters.length === 0
    && stream.heatmap.length === 0
    && stream.peak === null
    && stream.topics.every((topic) => topic.receipt === null)
  )));
  assert.deepEqual(
    batch04.streams.filter(
      (stream) => stream.rightsPolicy.mode === "visual-context-unverified",
    ).map((stream) => stream.id),
    ["3Lu0beSDxcQ", "o0tcJcJk6MY"],
  );
  assert.deepEqual(
    batch04.streams.filter(
      (stream) => (
        stream.captionEvidence.spanStatus === "limited-available-track"
      ),
    ).map((stream) => [
      stream.id,
      stream.captionEvidence.durationCoveragePercent,
    ]),
    [["2FlxuJxv81s", 96.03]],
  );
});

test("V5.12 Atlas reports 74 / 390 / 8 and excludes every batch ID", () => {
  const { batches, atlasData, atlas } = fixture();
  assert.equal(atlas.version, "1.2.0");
  assert.deepEqual(atlasData.stats.coverage, {
    "deeply-indexed": 74,
    "metadata-only": 390,
    "caption-limited": 8,
    unavailable: 0,
  });
  assert.equal(atlasData.stats.deepCoveragePercent, 15.7);
  assert.equal(atlasData.stats.lanes["archive-deep-batch-04"], 10);
  assert.equal(
    atlasData.fingerprints.archiveSha256,
    "sha256:c22572b2795edc2feb562362073eb8967a6f82793131d1e6671f42f9ac7579ac",
  );
  assert.equal(atlasData.fingerprints.runtimeFnv1a, "fnv1a32:0db0b888");
  assert.equal(
    atlasData.provenance.sourceLanes.archiveDeepTotals.sources,
    40,
  );
  assert.equal(
    atlasData.provenance.sourceLanes.archiveDeepTotals.limitedCaptionSpan,
    1,
  );

  const allBatchIds = new Set(
    batches.flatMap((batch) => batch.streams.map((stream) => stream.id)),
  );
  assert.equal(allBatchIds.size, 40);
  assert.ok([...allBatchIds].every((id) => {
    const record = atlas.getRecord(id);
    return (
      record.coverage === "deeply-indexed"
      && !record.lanes.includes("archive-metadata")
    );
  }));
  const queue = atlas.getDistillQueue({ limit: 390 });
  assert.equal(queue.eligible, 390);
  assert.deepEqual(plain(queue.excluded), {
    deeplyIndexed: 74,
    captionLimited: 8,
    unavailable: 0,
  });
  assert.ok(queue.records.every((record) => !allBatchIds.has(record.id)));
  assert.equal(queue.records[0].id, "RzSxi8rVQGI");
  assert.equal(queue.records[0].priority.score, 81.9);
});

test("V5.12 all-lane totals and Ask gates stay synchronized", () => {
  const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
  const readme = read("README.md");
  const overview = read("docs/V5_OVERVIEW.md");
  const runbook = read("docs/CREATOR_DEMO_RUNBOOK.md");
  const changelog = read("docs/CHANGELOG.md");
  const focused = read("tests/search-engine-archive-deep-batch4-v512.test.mjs");

  for (const document of [readme, overview, runbook]) {
    assert.match(document, /114 source\s+inputs/i);
    assert.match(document, /111 caption-audited/i);
    assert.match(document, /(?:3|three) (?:sealed or limited|sealed\/limited)/i);
    assert.match(document, /3,097,866\s+(?:audited\s+)?words/i);
    assert.match(document, /268\.9 hours/i);
  }
  for (const document of [readme, overview, changelog, runbook]) {
    assert.match(document, /128\/128/i);
  }
  assert.match(runbook, /6\/6 focused Batch 04 cases/i);
  assert.equal((focused.match(/\btest\(/g) || []).length, 6);
});

test("V5.12 Time Capsule exposes Batch 04's exact 2022 quarantine slice", () => {
  const { capsules } = fixture();
  const capsule = capsules.build(2022);

  assert.equal(capsule.quarantine.sourceCount, 3);
  assert.equal(capsule.quarantine.candidateCount, 10);
  assert.equal(capsule.quarantine.topicLaneCount, 30);
  assert.ok(capsule.quarantine.candidates.some(
    (candidate) => candidate.archiveBatch.id === "archive-deep-batch-04",
  ));
  assert.ok(capsule.quarantine.candidates.every((candidate) => (
    candidate.promotionAllowed === false && candidate.speaker === null
  )));
});

test("V5.12 browser load order, status, and app cap stay synchronized", () => {
  const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
  const batch3 = app.indexOf('"archive-deep-batch3.js"');
  const batch4 = app.indexOf('"archive-deep-batch4.js"', batch3);
  const engine = app.indexOf('"archive-deep-engine.js"', batch4);
  const portfolio = app.indexOf('"archive-deep-portfolio.js"', engine);
  assert.ok(batch3 >= 0 && batch3 < batch4 && batch4 < engine && engine < portfolio);
  assert.match(
    app,
    /WWAM_ARCHIVE_DEEP_BATCH3,window\.WWAM_ARCHIVE_DEEP_BATCH4/,
  );
  assert.match(app, /OPENING ARCHIVE DEEP \/\/ 40 CAPTION AUDITS/);
  assert.ok(
    fs.statSync(path.join(demo, "app.js")).size < 255_000,
    "app.js exceeded its V5.21 255 KB source cap",
  );
  assert.match(
    html,
    /archive-deep-batch3\.js,archive-deep-batch4\.js,archive-deep-engine\.js,archive-deep-portfolio\.js/,
  );
  assert.doesNotMatch(
    html,
    /<script[^>]+src="archive-deep-(?:distill|batch[234]|engine|portfolio)\.js"/i,
  );
});

test("V5.12 documentation keeps every frozen V5.4 invariant separate", () => {
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const overview = fs.readFileSync(
    path.join(root, "docs", "V5_OVERVIEW.md"),
    "utf8",
  );
  const portfolioDoc = fs.readFileSync(
    path.join(root, "docs", "ARCHIVE_DEEP_PORTFOLIO.md"),
    "utf8",
  );
  const atlasDoc = fs.readFileSync(
    path.join(root, "docs", "ARCHIVE_ATLAS.md"),
    "utf8",
  );
  const distillDoc = fs.readFileSync(
    path.join(root, "docs", "ARCHIVE_DEEP_DISTILL.md"),
    "utf8",
  );
  const frozenProof = [
    /84 (?:source )?inputs/i,
    /2,175,344 audited (?:caption )?words/i,
    /194\.9\s+(?:caption-audited\s+)?hours/i,
    /872 promoted(?:, bounded(?:, playable)?)?\s+(?:editorial |evidence )?receipts/i,
    /42\s+(?:then-)?quarantined\s+Batch 01\s+candidates/i,
    /168 promoted core memory\s+nodes/i,
  ];
  for (const document of [readme, overview, portfolioDoc]) {
    assert.match(document, /(?:immutable|frozen) V5\.4 proof/i);
    for (const pattern of frozenProof) assert.match(document, pattern);
  }
  assert.match(portfolioDoc, /Caption-audited sources \| 40/);
  assert.match(portfolioDoc, /portfolio: `fnv1a32:14050c7a`/);
  assert.match(portfolioDoc, /166 candidates are not promoted receipts/i);
  assert.match(atlasDoc, /`deeply-indexed` \| 74/);
  assert.match(atlasDoc, /`metadata-only` \| 390/);
  assert.match(atlasDoc, /Overall deep coverage\s+is \*\*15\.7%\*\*/);
  assert.match(distillDoc, /Independent batches: \*\*4\*\*/);
  assert.match(distillDoc, /All four batches are integrated/);
  assert.match(distillDoc, /Do not send the 166 machine moments/i);
});
