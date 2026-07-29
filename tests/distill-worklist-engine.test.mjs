import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "catalog.js",
    "archive-atlas-data.js",
    "archive-atlas-engine.js",
    "distill-worklist-engine.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const atlasEngine = context.window.WWAMArchiveAtlasEngine.create(
    context.window.WWAM_ARCHIVE_ATLAS,
  );
  const worklist = context.window.ShokkerDistillWorklist.create({
    atlas: context.window.WWAM_ARCHIVE_ATLAS,
    atlasEngine,
    catalog: context.window.WWAM_CATALOG,
    channel: { id: "wwam", label: "We Watched A Movie" },
  });
  return { window: context.window, atlasEngine, worklist };
}

test("builds the exact 301-Source-Brief worklist across Atlas and catalog gaps", () => {
  const { window, worklist } = load();
  const manifest = plain(worklist.exportManifest());
  const ids = manifest.records.map((record) => record.id);

  assert.equal(window.ShokkerDistillWorklist.VERSION, "1.0.0");
  assert.equal(manifest.schema, "shokker-distill-worklist-manifest/v1");
  assert.deepEqual(manifest.stats, {
    workItems: 301,
    acquireCaptions: 292,
    recoverCaptions: 9,
    sourceBriefs: 301,
    metadataOnly: 292,
    captionLimited: 9,
    contentClaims: 0,
    autoPromotions: 0,
  });
  assert.equal(ids.length, 301);
  assert.equal(new Set(ids).size, 301);
  assert.equal(ids.includes("AzrcgoyE7C4"), true);
  assert.equal(manifest.records.filter(
    (record) => record.workType === "recover-caption",
  ).length, 9);
  assert.equal(manifest.records.filter(
    (record) => record.workType === "acquire-caption",
  ).length, 292);
});

test("keeps every undistilled record claim-free and operationally explicit", () => {
  const { worklist } = load();
  const records = plain(worklist.getWorklist().records);

  for (const record of records) {
    assert.equal(record.showWikiState, "source-brief", record.id);
    assert.equal(record.evidenceBoundary.transcriptRegistered, false, record.id);
    assert.equal(record.evidenceBoundary.contentClaimsAllowed, false, record.id);
    assert.equal(record.evidenceBoundary.speakerDiarized, false, record.id);
    assert.equal(record.evidenceBoundary.visualContextVerified, false, record.id);
    assert.equal(record.evidenceBoundary.promotionAllowed, false, record.id);
    assert.match(record.expectedCacheBinding, new RegExp(
      `^source-cache/captions/${record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.json$`,
    ));
    for (const forbidden of [
      "summary",
      "transcript",
      "receipts",
      "moments",
      "topics",
      "quotes",
      "speaker",
    ]) {
      assert.equal(Object.hasOwn(record, forbidden), false, `${record.id}:${forbidden}`);
    }
  }
});

test("preserves Atlas priority for acquisition while isolating recovery work", () => {
  const { worklist } = load();
  const acquire = plain(worklist.getWorklist({
    workType: "acquire-caption",
  }).records);
  const recover = plain(worklist.getWorklist({
    workType: "recover-caption",
  }).records);

  assert.equal(acquire.length, 292);
  assert.ok(acquire.every((record, index) => (
    record.coverage === "metadata-only" &&
    record.atlasPriority.rank === index + 1 &&
    record.laneRank === index + 1
  )));
  assert.equal(recover.length, 9);
  assert.ok(recover.every((record, index) => (
    record.coverage === "caption-limited" &&
    record.atlasPriority === null &&
    record.laneRank === index + 1
  )));
});

test("stage packets bind metadata and fingerprints but never carry a transcript", () => {
  const { worklist } = load();
  const item = worklist.getRecord("RzSxi8rVQGI");
  const packet = plain(worklist.getStagePacket(item.id));

  assert.equal(packet.schema, "shokker-distill-stage-packet/v1");
  assert.equal(packet.workItemFingerprint, item.fingerprint);
  assert.equal(packet.source.id, item.id);
  assert.equal(packet.source.title, item.displayTitle);
  assert.deepEqual(packet.transcript, {
    required: true,
    supplied: false,
    expectedFormat: "youtube-json3",
    expectedCacheBinding: `source-cache/captions/${item.id}.json`,
  });
  assert.equal(packet.policy.contentClaimsAllowed, false);
  assert.equal(packet.policy.promotionAllowed, false);
  assert.equal(Object.hasOwn(packet, "content"), false);
});

test("fingerprints and ten-source operational cohorts are deterministic", () => {
  const { window, atlasEngine, worklist } = load();
  const reversed = window.ShokkerDistillWorklist.create({
    atlas: window.WWAM_ARCHIVE_ATLAS,
    atlasEngine,
    catalog: plain(window.WWAM_CATALOG).reverse(),
    channel: { id: "wwam", label: "We Watched A Movie" },
  });
  const first = plain(worklist.exportManifest());
  const second = plain(reversed.exportManifest());
  const batches = plain(worklist.getBatches(10));

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.records, second.records);
  assert.deepEqual(plain(worklist.verifyFingerprint()), {
    ok: true,
    expected: first.fingerprint,
    actual: first.fingerprint,
    scope: "deterministic-structural-change-detection",
    authenticityVerified: false,
  });
  assert.equal(batches.length, 31);
  assert.equal(batches[0].sourceIds.length, 10);
  assert.equal(batches.at(-1).sourceIds.length, 1);
  assert.equal(new Set(batches.flatMap((batch) => batch.sourceIds)).size, 301);
});

test("refuses a truncated Atlas queue instead of dropping work silently", () => {
  const { window, atlasEngine } = load();
  const truncated = {
    getDistillQueue(options) {
      const queue = atlasEngine.getDistillQueue(options);
      queue.records = queue.records.slice(0, 100);
      return queue;
    },
  };

  assert.throws(
    () => window.ShokkerDistillWorklist.create({
      atlas: window.WWAM_ARCHIVE_ATLAS,
      atlasEngine: truncated,
      catalog: window.WWAM_CATALOG,
    }),
    /truncated Atlas acquisition queue/i,
  );
});
