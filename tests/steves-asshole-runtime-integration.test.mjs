import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");

function loadRuntime() {
  const sandbox = { window: {}, console, Promise };
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
    "wwam-source-dossier-adapter.js",
    "steves-asshole.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

test("the production Steve route builds from the complete canonical runtime", () => {
  const window = loadRuntime();
  const api = window.WWAMStraightToSteve;
  api.resetCache();

  const payload = api.buildPayloadFromGlobals(window);
  const data = api.inventory(payload);

  assert.ok(payload.sources.length >= 510);
  assert.ok(data.items.length >= 14);
  assert.ok(data.metrics.sources >= 10);
  assert.ok(data.items.every((item) => /^[A-Za-z0-9_-]{11}$/.test(item.sourceId)));
  assert.ok(data.items.every((item) => Number.isFinite(item.at) && item.at >= 0));
  assert.ok(data.items.every((item) => item.sourceUrl.endsWith(`&t=${item.at}s`)));
  assert.equal(data.inventoryStatus.state, "complete");
});

test("a lagging guide overlay preserves the same production rejection receipts", () => {
  const window = loadRuntime();
  const api = window.WWAMStraightToSteve;
  const completeGuides = window.WWAM_EPISODE_GUIDES.guides.slice();
  assert.ok(completeGuides.length > 1);

  api.resetCache();
  const complete = api.inventory(api.buildPayloadFromGlobals(window));
  const completeIds = complete.items.map((item) => item.id).sort();

  window.WWAM_EPISODE_GUIDES = {
    ...window.WWAM_EPISODE_GUIDES,
    guides: completeGuides.slice(0, completeGuides.length - 1),
  };
  api.resetCache();
  const lagPayload = api.buildPayloadFromGlobals(window);
  const lag = api.inventory(lagPayload);
  const lagIds = lag.items.map((item) => item.id).sort();

  assert.equal(lagPayload.steveInventoryStatus.state, "guide-overlay-lag");
  assert.equal(lagPayload.steveInventoryStatus.expectedGuides, completeGuides.length);
  assert.equal(lagPayload.steveInventoryStatus.availableGuides, completeGuides.length - 1);
  assert.deepEqual(lagIds, completeIds);
});