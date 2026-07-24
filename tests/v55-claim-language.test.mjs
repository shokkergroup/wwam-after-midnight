import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("V5.5 static copy preserves the evidence and promotion boundaries", () => {
  const readme = read("README.md");
  const nightShift = read("docs/NIGHT_SHIFT_ENGINE.md");
  const memoryOs = read("docs/YOUTUBE_WIKI_MEMORY_OS.md");
  const overview = read("docs/V5_OVERVIEW.md");
  const redBand = read("docs/RED_BAND_RANKING_V2.md");
  const archiveDeep = read("docs/ARCHIVE_DEEP_DISTILL.md");
  const creatorRunbook = read("docs/CREATOR_DEMO_RUNBOOK.md");
  const archiveAtlasUi = read("public/demo/archive-atlas-ui.js");
  const html = read("public/demo/index.html");

  assert.match(nightShift, /eligible, source-backed Lore[\s\n]+Field Guide/i);
  assert.doesNotMatch(nightShift, /verified Lore Field Guide/i);

  assert.match(memoryOs, /years of source-linked, indexed lore and corrections/i);
  assert.doesNotMatch(memoryOs, /years of verified lore/i);

  assert.match(
    overview,
    /Machine and timestamp-validated human-curated candidate labels/,
  );
  assert.doesNotMatch(overview, /Machine\/editor evidence labels/);

  assert.match(
    redBand,
    /Timestamp-validated human-curated character candidates/,
  );
  assert.doesNotMatch(redBand, /Grounded character soundbytes/);

  assert.match(
    readme,
    /Playback review can establish context, but[\s\n]+does not promote one candidate across those separate lanes/i,
  );
  assert.match(
    html,
    /authenticated, authorized editor or creator decision for public canon/i,
  );
  assert.doesNotMatch(html, /Let a human certify public canon/i);

  const archivePromotionCopy = [
    archiveDeep,
    creatorRunbook,
    archiveAtlasUi,
    memoryOs,
  ].join("\n");
  assert.match(
    archivePromotionCopy,
    /Playback review may establish context/,
  );
  assert.match(
    archivePromotionCopy,
    /each (?:destination )?(?:product )?lane requires[\s\S]*?policy-compliant decision[\s\S]*?authenticated, authorized reviewer/i,
  );
  assert.doesNotMatch(
    archivePromotionCopy,
    /until playback review|playback reviewer promotes|playback review before promotion|Promote machine findings to editor verified/i,
  );
});

test("V5.5 static release claims pin the current pack and Lore graph", () => {
  const readme = read("README.md");
  const overview = read("docs/V5_OVERVIEW.md");
  const changelog = read("docs/CHANGELOG.md");
  const v55 = changelog.split(/^## 0\.5\.4\b/m)[0];

  assert.match(changelog, /V5\.5 pack fingerprint is `cp1-59e4817559149f96`/);
  assert.match(readme, /177 Lore Galaxy entries, 822 graph edges/);
  assert.match(overview, /177 field-guide entries into 822 receipt-backed edges/);
  assert.match(v55, /177 field-guide entries, 822 receipt-backed graph[\s\n]+edges/);
});
