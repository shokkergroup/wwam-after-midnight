import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function engine() {
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
    "search-engine.js",
  ].forEach((file) => {
    vm.runInContext(read(`public/demo/${file}`), context, { filename: file });
  });
  const w = context.window;
  return w.WWAMSearchEngine.create(
    w.WWAM_CATALOG,
    w.WWAM_DEEP_DISTILL,
    w.WWAM_LIVESTREAMS,
    w.WWAM_CURATED,
    w.WWAM_POPULAR_LIVE,
    w.WWAM_CHARACTER_LORE,
    w.WWAM_ARCHIVE_DEEP,
  );
}

test("V5.11 gates a requested secondary target before heat can rank", () => {
  const ask = engine();
  const mask = plain(ask.ask(
    "What did they say about the mask in Halloween 5?",
  ));
  const absent = plain(ask.ask(
    "What did they say about the ending in Scream 3?",
  ));

  assert.deepEqual(mask.queryPlan.concepts.secondaryTargets, ["mask"]);
  assert.equal(mask.results[0].sourceId, "AtcRT3Xkk6E");
  assert.equal(mask.results[0].at, 1327);
  assert.ok(mask.results.every((result) => /\bmask\b/i.test(result.excerpt)));
  assert.equal(absent.status, "insufficient-evidence");
  assert.equal(absent.confidence, 0);
  assert.deepEqual(absent.results, []);
});

test("V5.11 selects a temporal source before describing its indexed content", () => {
  const answer = plain(engine().ask(
    "What happens in the newest commentary?",
  ));

  assert.equal(answer.selectionPlan.source.sourceId, "ISDlaQ9DWSM");
  assert.equal(
    answer.selectionPlan.source.matchMode,
    "latest-indexed-source-content",
  );
  assert.ok(answer.results.length > 0);
  assert.ok(answer.results.every((result) => (
    result.sourceId === "ISDlaQ9DWSM" && result.kind === "moment"
  )));
  assert.match(answer.answer, /not an invented plot summary/i);
});

test("V5.11 keeps character evidence classes and global rankings separate", () => {
  const ask = engine();
  const profile = plain(ask.ask("Who is Slenderman?"));
  const mentions = plain(ask.ask(
    "What did they say about Corey Feldman?",
  ));
  const funniest = plain(ask.ask("What made them laugh hardest?"));

  assert.equal(profile.queryPlan.outputShape, "character-profile");
  assert.equal(profile.status, "supported");
  assert.ok(mentions.results.length > 0);
  assert.ok(mentions.results.every((result) => (
    result.kind === "character"
    && result.evidenceType === "caption-character-signal"
  )));
  assert.equal(funniest.status, "surface-handoff");
  assert.equal(funniest.recommendedSurface.href, "#memory");
  assert.deepEqual(funniest.results, []);
});

test("V5.11 follow-ups retain the exact result anchor", () => {
  const ask = engine();
  const first = plain(ask.ask("Where is The Burp Defense?"));
  const next = plain(ask.ask("next one", first.context));

  assert.equal(next.selectionPlan.mode, "next");
  assert.equal(next.selectionPlan.resolvedFrom, "conversation-context");
  assert.equal(next.selectionPlan.anchor.sourceId, "BIbyzMlstmM");
  assert.equal(next.selectionPlan.anchor.at, 1528);
  assert.equal(next.results[0].sourceId, "BIbyzMlstmM");
  assert.equal(next.results[0].at, 2373);
});

test("V5.11 release identity, UI status, and documentation stay synchronized", () => {
  const manifest = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  const readme = read("README.md");
  const overview = read("docs/V5_OVERVIEW.md");
  const changelog = read("docs/CHANGELOG.md");
  const runbook = read("docs/CREATOR_DEMO_RUNBOOK.md");
  const contract = read("docs/ASK_ANSWER_FRAME_V2.md");
  const app = read("public/demo/app.js");

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");
  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(changelog, /^## 0\.5\.11 .*Answer Frame V2/m);
  assert.match(runbook, /current V5\.21 build/i);
  assert.match(app, /GLOBAL RANKING HANDOFF \/\/ SOURCE RANKING/);
  assert.doesNotMatch(
    app,
    /isSurfaceHandoff \? "GLOBAL RANKING HANDOFF \/\/ OPEN THE RED BAND 100"/,
  );
  assert.ok(fs.statSync(path.join(demo, "app.js")).size < 270_000);

  for (const phrase of [
    /secondary targets/i,
    /semantic target coverage/i,
    /direct answer/i,
    /honest refusal/i,
    /follow-up memory/i,
    /speaker diarization/i,
    /122\/122/i,
    /157-query/i,
  ]) {
    assert.match([readme, overview, changelog, contract].join("\n"), phrase);
  }
});
