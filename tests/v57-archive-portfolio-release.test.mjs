import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const releasePaths = [
  "README.md",
  "docs/CHANGELOG.md",
  "docs/V5_OVERVIEW.md",
  "docs/ARCHIVE_ATLAS.md",
  "docs/ARCHIVE_DEEP_DISTILL.md",
  "docs/ARCHIVE_DEEP_PORTFOLIO.md",
  "docs/CREATOR_DEMO_RUNBOOK.md",
];
const releaseDocs = releasePaths.map(read).join("\n");
const portfolioDoc = read("docs/ARCHIVE_DEEP_PORTFOLIO.md");
const runbook = read("docs/CREATOR_DEMO_RUNBOOK.md");

test("the historical V5.7 entry remains while current identity stays synchronized", () => {
  const packageJson = JSON.parse(read("package.json"));
  const packageLock = JSON.parse(read("package-lock.json"));
  const changelog = read("docs/CHANGELOG.md");

  assert.equal(packageJson.version, "0.5.18");
  assert.equal(packageLock.version, "0.5.18");
  assert.equal(packageLock.packages[""].version, "0.5.18");
  assert.match(changelog, /^## 0\.5\.7\b/m);
  assert.match(changelog, /V5\.7 Archive Deep Portfolio/i);
});

test("the current Archive Deep overlay publishes one exact measured vocabulary", () => {
  const required = [
    /\| Independent batches \| 4 \|/i,
    /\| Caption-audited sources \| 40 \|/i,
    /\| Audited runtime \| 97\.7 hours \|/i,
    /\| Audited caption words \| 1,216,993 \|/i,
    /\| Parsed caption events \| 173,675 \|/i,
    /\| Topic lanes \| 400 \|/i,
    /\| Distinct normalized topics \| 48 \|/i,
    /\| Quarantined public moment candidates \| 166 \|/i,
    /\| Source-level character-signal records \| 52 \|/i,
    /\| Topic-only source-audio firewalls \| 12 \|/i,
    /\| Special visual-ranking quarantines \| 12 \|/i,
    /\| Limited available caption spans \| 1 \|/i,
    /\| Cached snapshot views \| 445,949 \|/i,
  ];

  for (const pattern of required) {
    assert.match(portfolioDoc, pattern);
  }
  assert.match(releaseDocs, /114 source\s+inputs/i);
  assert.match(releaseDocs, /111 caption-audited and\s+3 sealed or limited/i);
  assert.match(releaseDocs, /3,097,866 audited\s+words/i);
  assert.match(releaseDocs, /(?:about\s+)?268\.9 hours/i);
  assert.match(releaseDocs, /872 promoted(?:-receipt)?[\s\S]{0,60}(?:remain|unchanged)/i);
});

test("current Atlas coverage is never substituted with the superseded overlay", () => {
  const atlas = read("docs/ARCHIVE_ATLAS.md");
  const overview = read("docs/V5_OVERVIEW.md");

  for (const document of [atlas, overview]) {
    assert.match(document, /74[\s\S]{0,24}deeply indexed|deeply-indexed` \| 74/i);
    assert.match(document, /390[\s\S]{0,24}metadata-only|metadata-only` \| 390/i);
    assert.match(document, /8[\s\S]{0,24}caption-limited|caption-limited` \| 8/i);
    assert.match(document, /15\.7%/i);
  }
  assert.match(atlas, /`archive-deep-10`/);
  assert.match(atlas, /`archive-deep-batch-02`/);
  assert.match(atlas, /`archive-deep-batch-03`/);
  assert.match(atlas, /`archive-deep-batch-04`/);
  assert.match(atlas, /`integrated-quarantine`/);
});

test("the immutable V5.4 proof remains explicit and separate", () => {
  const frozenProof = [
    /84 (?:source )?inputs/i,
    /2,175,344 audited (?:caption )?words/i,
    /194\.9\s+caption-audited hours/i,
    /872 promoted(?:, bounded(?:, playable)?)?\s+receipts/i,
    /42 then-quarantined Batch 01\s+candidates/i,
    /168 promoted (?:core )?memory\s+nodes/i,
  ];

  for (const file of [
    "README.md",
    "docs/V5_OVERVIEW.md",
    "docs/ARCHIVE_DEEP_PORTFOLIO.md",
  ]) {
    const document = read(file);
    assert.match(document, /immutable V5\.4 proof/i);
    for (const pattern of frozenProof) {
      assert.match(document, pattern, `${file} lost ${pattern}`);
    }
    assert.match(
      document,
    /(?:current|thirty-source)[\s\S]{0,80}overlay[\s\S]{0,300}(?:does not|must not|not)[\s\S]{0,160}(?:rewrite|retroactively change|added|enter|promoted)/i,
    );
  }
});

test("release language prevents raw-view, performance, speaker, and canon inflation", () => {
  const coreDocs = [
    read("README.md"),
    read("docs/CHANGELOG.md"),
    read("docs/V5_OVERVIEW.md"),
    read("docs/ARCHIVE_ATLAS.md"),
    read("docs/ARCHIVE_DEEP_DISTILL.md"),
    portfolioDoc,
  ].join("\n");

  assert.match(
    coreDocs,
    /cached-view gravity[\s\S]{0,100}(?:upload )?recency[\s\S]{0,100}franchise-title/i,
  );
  assert.match(coreDocs, /(?:is|not|never)[^.\n]{0,40}raw view rank/i);
  assert.doesNotMatch(
    coreDocs,
    /Batch 02 (?:is|was|sources? (?:are|were)) ranked by (?:archived )?views/i,
  );
  assert.doesNotMatch(
    coreDocs,
    /52 (?:verified |confirmed )?(?:character )?performances/i,
  );
  assert.match(
    coreDocs,
    /24[\s\S]{0,50}character signals[\s\S]{0,80}28[\s\S]{0,50}character contexts/i,
  );
  assert.match(
    coreDocs,
    /all 52[\s\S]{0,160}none[\s\S]{0,80}curated performance/i,
  );
  assert.match(coreDocs, /all 166[^.\n]*speaker-undiarized/i);
  assert.match(coreDocs, /all 166[^.\n]*(?:remain|outside)[^.\n]*(?:quarantined|promoted 872)/i);
  assert.match(coreDocs, /(?:visual ranking context|visual context)[^.\n]*remains (?:explicitly )?unverified/i);
  assert.match(coreDocs, /all 40[^.\n]*forbid visual claims[\s\S]{0,160}12-count/i);
  assert.match(coreDocs, /twelve[\s\S]{0,100}(?:source-audio|trailer|script-reading|watch-party)[\s\S]{0,100}(?:topic-navigation-only|firewalls)/i);
  assert.match(
    coreDocs,
    /FNV[\s\S]{0,180}(?:structural change detector|structural-change-detection)[\s\S]{0,120}(?:not a signature|not signatures)/i,
  );
});

test("the portfolio documents four independent proof chains and twelve fail-honest audits", () => {
  assert.match(portfolioDoc, /four[\s\S]{0,100}independently[\s\S]{0,100}ten-source/i);
  assert.match(portfolioDoc, /Each batch retains its own/i);
  assert.match(portfolioDoc, /selection SHA-256/i);
  assert.match(portfolioDoc, /private-caption-set SHA-256/i);
  assert.match(portfolioDoc, /public-stream FNV-1a/i);
  assert.match(portfolioDoc, /speaker-undiarized/i);
  assert.match(portfolioDoc, /Who said that line\?/i);
  assert.match(portfolioDoc, /a source-level character signal does not establish a performance/i);
  assert.match(portfolioDoc, /Refuse automatic promotion/i);

  const auditBlock = portfolioDoc
    .split("## Twelve-query audit set")[1]
    .split("## Release checks")[0];
  const auditRows = auditBlock
    .split("\n")
    .filter((line) => /^\| [^:-].+\|$/.test(line))
    .slice(1);
  assert.equal(auditRows.length, 12);

  assert.match(runbook, /Claims to avoid[\s\S]*(?:Archive Deep batch|Batch 02)[^.\n]*ranked by views/i);
  assert.match(
    runbook,
    /24 character signals[\s\S]{0,50}28 character contexts[\s\S]{0,50}verified[\s\S]{0,30}performances/i,
  );
});
