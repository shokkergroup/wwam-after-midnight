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

test("V5.7 release identity stays synchronized", () => {
  const packageJson = JSON.parse(read("package.json"));
  const packageLock = JSON.parse(read("package-lock.json"));
  const changelog = read("docs/CHANGELOG.md");

  assert.equal(packageJson.version, "0.5.7");
  assert.equal(packageLock.version, "0.5.7");
  assert.equal(packageLock.packages[""].version, "0.5.7");
  assert.match(changelog, /^## 0\.5\.7\b/m);
  assert.match(changelog, /V5\.7 Archive Deep Portfolio/i);
});

test("the current Archive Deep overlay publishes one exact measured vocabulary", () => {
  const required = [
    /\| Caption-audited sources \| 20 \|/i,
    /\| Audited runtime \| 46\.8 hours \|/i,
    /\| Audited caption words \| 579,003 \|/i,
    /\| Parsed caption events \| 82,551 \|/i,
    /\| Topic lanes \| 200 \|/i,
    /\| Distinct normalized topics \| 42 \|/i,
    /\| Quarantined public moment candidates \| 91 \|/i,
    /\| Source-level character-signal records \| 23 \|/i,
    /\| Topic-only source-audio firewalls \| 7 \|/i,
    /\| Visual-context-unverified sources \| 6 \|/i,
    /\| Cached snapshot views \| 214,278 \|/i,
  ];

  for (const pattern of required) {
    assert.match(portfolioDoc, pattern);
  }
  assert.match(releaseDocs, /94 source\s+inputs/i);
  assert.match(releaseDocs, /91 caption-audited and\s+3 sealed or limited/i);
  assert.match(releaseDocs, /2,459,876 audited\s+words/i);
  assert.match(releaseDocs, /217\.99 hours \(about 218\.0\)/i);
  assert.match(releaseDocs, /872 promoted-receipt count remains\s+unchanged/i);
});

test("current Atlas coverage is never substituted with the superseded overlay", () => {
  const atlas = read("docs/ARCHIVE_ATLAS.md");
  const overview = read("docs/V5_OVERVIEW.md");

  for (const document of [atlas, overview]) {
    assert.match(document, /54[\s\S]{0,24}deeply indexed|deeply-indexed` \| 54/i);
    assert.match(document, /410[\s\S]{0,24}metadata-only|metadata-only` \| 410/i);
    assert.match(document, /8[\s\S]{0,24}caption-limited|caption-limited` \| 8/i);
    assert.match(document, /11\.4%/i);
  }
  assert.match(atlas, /`archive-deep-10`/);
  assert.match(atlas, /`archive-deep-batch-02`/);
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
      /(?:current|twenty-source)[\s\S]{0,80}overlay[\s\S]{0,300}(?:does not|must not|not)[\s\S]{0,160}(?:rewrite|retroactively change|added|enter|promoted)/i,
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
    /23 (?:verified |confirmed )?(?:character )?performances/i,
  );
  assert.match(coreDocs, /23 source-level character-signal records[\s\S]{0,160}not[\s\S]{0,80}performances/i);
  assert.match(coreDocs, /all 91[^.\n]*speaker-undiarized/i);
  assert.match(coreDocs, /all 91[^.\n]*(?:remain|outside)[^.\n]*(?:quarantined|promoted 872)/i);
  assert.match(coreDocs, /visual ranking context remains unverified/i);
  assert.match(coreDocs, /six visual-context-unverified[\s\S]{0,80}three in each batch/i);
  assert.match(coreDocs, /seven[\s\S]{0,100}(?:source-audio|trailer|script-reading|watch-party)[\s\S]{0,100}(?:topic-navigation-only|firewalls)/i);
  assert.match(
    coreDocs,
    /FNV[\s\S]{0,180}(?:structural change detector|structural-change-detection)[\s\S]{0,120}(?:not a signature|not signatures)/i,
  );
});

test("the portfolio documents two independent proof chains and twelve fail-honest audits", () => {
  assert.match(portfolioDoc, /two independently[\s\S]{0,100}ten-source/i);
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

  assert.match(runbook, /Claims to avoid[\s\S]*Batch 02 is ranked by views/i);
  assert.match(runbook, /23 character signals are verified performances/i);
});
