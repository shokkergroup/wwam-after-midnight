import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function loadRuntime() {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  [
    "catalog.js",
    "deep-distill.js",
    "episode-guides.js",
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
    "year-canon-2025-2026.js",
    "archive-recovery-batch1.js",
    "episode-recap-engine.js",
    "wwam-episode-recap-adapter.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
  ].forEach((filename) => {
    vm.runInContext(
      fs.readFileSync(path.join(demo, filename), "utf8"),
      sandbox,
      { filename },
    );
  });
  return sandbox.window;
}

function countBy(values, field) {
  return Object.fromEntries(
    values.reduce((counts, value) => {
      counts.set(value[field], (counts.get(value[field]) || 0) + 1);
      return counts;
    }, new Map()),
  );
}

function fixture() {
  const window = loadRuntime();
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const portfolio = window.WWAMArchiveDeepPortfolio.create(
    [
      window.WWAM_ARCHIVE_DEEP,
      window.WWAM_ARCHIVE_DEEP_BATCH2,
      window.WWAM_ARCHIVE_DEEP_BATCH3,
      window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    window.WWAMArchiveDeepEngine,
  );
  const archiveStreams = portfolio.getSearchPayload().streams.concat(
    window.WWAM_YEAR_CANON_2025_2026.streams,
    window.WWAM_ARCHIVE_RECOVERY_BATCH1.streams,
  );
  const result = window.WWAMSourceDossierAdapter.build({
    archiveAtlas: window.WWAM_ARCHIVE_ATLAS,
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    episodeGuides: window.WWAM_EPISODE_GUIDES,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    archiveDeep: archiveStreams,
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:recovery-integration",
    },
  });
  return { window, result };
}

test("promotes all 25 recovered tapes into playable quarantined show wikis", () => {
  const { window, result } = fixture();
  const recoveryIds = new Set(
    window.WWAM_ARCHIVE_RECOVERY_BATCH1.streams.map((stream) => stream.id),
  );
  const recovered = result.sources.filter((source) => recoveryIds.has(source.id));

  assert.equal(result.sources.length, 510);
  assert.deepEqual(countBy(result.sources, "coverage"), {
    "caption-backed": 234,
    "caption-limited": 9,
    "metadata-only": 267,
  });
  assert.deepEqual(countBy(result.sources, "authority"), {
    "promoted-lane": 74,
    "quarantined-lane": 163,
    "source-only": 273,
  });

  assert.equal(recovered.length, 25);
  assert.ok(recovered.every((source) => source.coverage === "caption-backed"));
  assert.ok(recovered.every((source) => source.authority === "quarantined-lane"));
  assert.ok(recovered.every((source) => source.receipts.length > 0));
  assert.ok(recovered.every((source) => source.episodeRecap.state === "ready"));
  assert.equal(
    recovered.reduce((total, source) => total + source.receipts.length, 0),
    440,
  );
  for (const source of recovered) {
    assert.ok(source.receipts.every((receipt) => (
      receipt.at >= 0
      && receipt.end <= source.duration
      && receipt.at < receipt.end
      && receipt.speaker == null
      && receipt.promotionAllowed === false
    )), source.id);
  }

  assert.doesNotThrow(() => window.ShokkerSourceDossier.create(result));
});
