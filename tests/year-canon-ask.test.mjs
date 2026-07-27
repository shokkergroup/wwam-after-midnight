import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "year-canon-2025-2026.js",
    "search-engine.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, { filename: file });
  });
  const window = context.window;
  const archiveBase = window.WWAMArchiveDeepPortfolio.create([
    window.WWAM_ARCHIVE_DEEP,
    window.WWAM_ARCHIVE_DEEP_BATCH2,
    window.WWAM_ARCHIVE_DEEP_BATCH3,
    window.WWAM_ARCHIVE_DEEP_BATCH4,
  ], window.WWAMArchiveDeepEngine).getSearchPayload();
  const archive = Object.assign({}, archiveBase, {
    streams: archiveBase.streams.concat(window.WWAM_YEAR_CANON_2025_2026.streams),
    topicIndex: archiveBase.topicIndex.concat(window.WWAM_YEAR_CANON_2025_2026.topicIndex),
    characterIndex: archiveBase.characterIndex.concat(
      window.WWAM_YEAR_CANON_2025_2026.characterIndex,
    ),
  });
  return window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
    window.WWAM_CHARACTER_LORE,
    archive,
  );
}

test("finds year-scoped WWAM UP IN YA moments instead of falling back to the old curated subset", () => {
  const answer = load().ask("Show me Up In Ya moments from 2025");
  assert.equal(answer.status, "supported");
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => result.category === "UP IN YA"));
  assert.ok(answer.results.every((result) => result.date.startsWith("2025")));
});

test("understands natural character-moment wording without pretending machine signals identify a speaker", () => {
  const answer = load().ask("Show me Dr. Loomis moments from 2026");
  assert.equal(answer.status, "supported");
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => result.date.startsWith("2026")));
  assert.ok(answer.results.every((result) => (
    result.kind === "character" || result.kind === "character-performance"
  )));
  assert.match(answer.answer, /speaker-undiarized|does not identify a performer/i);
});

test("reports topic prevalence inside the requested year, not across the unfiltered archive", () => {
  const answer = load().ask("What did they say about Batman in 2025?");
  assert.equal(answer.status, "supported");
  assert.match(answer.answer, /Batman appears across 49 indexed streams/);
  assert.doesNotMatch(answer.answer, /94 indexed streams/);
  assert.ok(answer.results.every((result) => result.date.startsWith("2025")));
});
