import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load(file, globalName) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, { filename: file });
  return JSON.parse(JSON.stringify(context.window[globalName]));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stable(value[key]);
      return out;
    }, {});
  }
  return value;
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex")}`;
}

function words(value) {
  return (String(value || "").match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g) || []).length;
}

const canon = load("year-canon-2025-2026.js", "WWAM_YEAR_CANON_2025_2026");
const atlas = load("archive-atlas-data.js", "WWAM_ARCHIVE_ATLAS");

const allExcerpts = canon.streams.flatMap((stream) => [
  ...(stream.topics || []).map((topic) => topic.receipt).filter(Boolean),
  ...(stream.moments || []).map((moment) => moment.excerpt).filter(Boolean),
  ...(stream.characters || []).map((character) => character.receipt).filter(Boolean),
]);

test("registers every 2025 and 2026 livestream with one honest caption exception", () => {
  assert.equal(canon.schema, "shokker-youtube-wiki/year-canon/v1");
  assert.equal(canon.meta.registered, 131);
  assert.equal(canon.meta.captionBacked, 130);
  assert.equal(canon.meta.sourceBriefs, 1);
  assert.equal(canon.meta.newlyDistilled, 98);
  assert.deepEqual(canon.meta.yearCounts, {
    2025: { registered: 94, captionBacked: 94, sourceBriefs: 0 },
    2026: { registered: 37, captionBacked: 36, sourceBriefs: 1 },
  });
  assert.equal(canon.showIndex.length, 131);
  assert.equal(new Set(canon.showIndex.map((show) => show.id)).size, 131);
  assert.equal(canon.showIndex.filter((show) => show.wikiState === "show-wiki").length, 130);
  const gap = canon.showIndex.find((show) => show.id === "x6tvsGRHgU0");
  assert.equal(gap.wikiState, "source-brief");
  assert.equal(gap.coverage, "caption-limited");
});

test("keeps the 98 recovered sources source-locked, bounded, and timestamp-valid", () => {
  assert.equal(canon.streams.length, 98);
  assert.equal(new Set(canon.streams.map((stream) => stream.id)).size, 98);
  assert.ok(canon.streams.every((stream) => stream.captioned === true));
  assert.ok(allExcerpts.length > 1_000);
  assert.ok(allExcerpts.every((excerpt) => words(excerpt) <= 16));

  for (const stream of canon.streams) {
    assert.ok(stream.duration > 0, stream.id);
    assert.equal(stream.rightsPolicy.promotionAllowed, false, stream.id);
    for (const topic of stream.topics || []) {
      assert.ok(topic.first >= 0 && topic.first <= stream.duration, `${stream.id}:topic:first`);
      assert.ok(topic.peak >= 0 && topic.peak <= stream.duration, `${stream.id}:topic:peak`);
      assert.equal(topic.evidence.speakerStatus, "not-diarized", stream.id);
      assert.equal(topic.evidence.originStatus, "not-inferred", stream.id);
      assert.equal(topic.evidence.visualContextVerified, false, stream.id);
      assert.equal(topic.evidence.promotionStatus, "quarantined", stream.id);
    }
    for (const moment of stream.moments || []) {
      assert.ok(moment.t >= 0 && moment.t <= stream.duration, `${stream.id}:moment`);
      assert.equal(moment.evidence.reviewStatus, "machine-candidate", stream.id);
      assert.equal(moment.evidence.promotionStatus, "quarantined", stream.id);
    }
    for (const character of stream.characters || []) {
      assert.ok(character.t >= 0 && character.t <= stream.duration, `${stream.id}:character`);
      assert.equal(character.performanceStatus, "not-established-from-automatic-captions", stream.id);
    }
  }
});

test("restricts trailer, watch, and script sources to topic navigation", () => {
  const restricted = canon.streams.filter((stream) => stream.rightsPolicy.restrictedToTopicNavigation);
  assert.equal(restricted.length, 4);
  assert.ok(restricted.every((stream) => (
    stream.moments.length === 0
    && stream.characters.length === 0
    && stream.heatmap.length === 0
    && stream.rightsPolicy.mode === "topic-navigation-only"
  )));
  assert.equal(canon.showIndex.filter((show) => show.restricted).length, 11);
});

test("binds the canon to Archive Atlas and a reproducible public fingerprint", () => {
  const publicPayload = JSON.parse(JSON.stringify(canon));
  delete publicPayload.fingerprints;
  assert.equal(canon.fingerprints.publicPayloadSha256, sha256(publicPayload));
  assert.match(canon.fingerprints.captionSetSha256, /^sha256:[a-f0-9]{64}$/);

  const yearLane = atlas.records.filter((record) => record.lanes.includes("year-canon-2025-2026"));
  assert.equal(yearLane.length, 98);
  assert.ok(yearLane.every((record) => record.coverage === "deeply-indexed"));
  assert.equal(atlas.stats.coverage["deeply-indexed"], 172);
  assert.equal(atlas.stats.coverage["metadata-only"], 292);
  assert.equal(atlas.stats.deepCoveragePercent, 36.4);
  assert.equal(
    atlas.provenance.sourceLanes.yearCanon20252026.publicPayloadSha256,
    canon.fingerprints.publicPayloadSha256,
  );
});

test("loads the canon into the product, Ask layer, and Mike-facing proof", () => {
  const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
  const adapter = fs.readFileSync(path.join(demo, "wwam-source-dossier-adapter.js"), "utf8");
  assert.match(app, /year-canon-2025-2026\.js/);
  assert.match(app, /topicIndex:.*WWAM_YEAR_CANON_2025_2026\.topicIndex/);
  assert.match(app, /characterIndex:.*WWAM_YEAR_CANON_2025_2026\.characterIndex/);
  assert.match(html, /TWO YEARS\.\s*<br><em>ONE SHELF\./);
  assert.match(html, /ONE WATCH-ONLY SHOW/);
  assert.match(adapter, /year-canon-2025-2026/);
});
