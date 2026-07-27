import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");

function lazyChains() {
  return [...html.matchAll(/\bdata-feature-scripts="([^"]+)"/g)].map((match) =>
    match[1].split(",").map((value) => value.trim()).filter(Boolean),
  );
}

test("every V5.5 lazy feature asset exists and stays below the per-script cap", () => {
  const chains = lazyChains();
  const requiredV55Chains = [
    [
      "archive-atlas-data.js",
      "red-band-ranking-v2.js",
      "tape-companion-engine.js",
      "tape-companion-ui.js?v=1.1.0-human",
    ],
    [
      "channel-pack-contract.js",
      "wwam-channel-pack-adapter.js",
      "creator-taste-engine.js",
      "creator-taste-ui.js",
    ],
  ];
  for (const expected of requiredV55Chains) {
    assert.equal(
      chains.some((chain) => JSON.stringify(chain) === JSON.stringify(expected)),
      true,
      `missing V5.5 lazy chain: ${expected.join(",")}`,
    );
  }

  for (const file of new Set(chains.flat())) {
    const diskFile = file.split("?")[0];
    const resolved = path.join(demo, diskFile);
    assert.equal(fs.existsSync(resolved), true, `${diskFile} is missing`);
    assert.ok(fs.statSync(resolved).size < 250_000, `${diskFile} exceeds the script cap`);
  }
});

test("the tiny feature loader is available before the main application", () => {
  const appAt = html.search(/<script src="app\.js\?v=0\.5\.28-year-canon-ux25"><\/script>/);
  const loaderAt = html.indexOf('<script src="feature-loader.js"></script>');
  assert.ok(appAt > 0);
  assert.ok(loaderAt > 0 && loaderAt < appAt);
  assert.ok(fs.statSync(path.join(demo, "feature-loader.js")).size < 6_000);
});

test("V5.5 adds source synchronization and taste calibration without growing app.js", () => {
  assert.ok(fs.statSync(path.join(demo, "app.js")).size < 270_000);
  assert.match(html, /WATCH WITH A SECOND SCREEN/);
  assert.match(html, /CREATOR TASTE CALIBRATION/);
  assert.match(html, /PREFERENCE NEVER OVERRIDES PROOF/);
  assert.match(html, /pick any WWAM upload/i);
  assert.match(html, /nearest whole YouTube second/i);
  assert.match(html, /Ten source-backed, priority-blind learning matchups/i);
  assert.match(html, /two side-reversed, non-learning repeats/i);
  assert.match(
    html,
    /timestamp-validated and human-curated(?:—|&mdash;|-)+not editor verified/i,
  );
});

test("showcase memory labels distinguish timestamps and curation from verification", () => {
  assert.match(app, /THE TIME MACHINE NEEDS MORE TIMESTAMPED EVENTS/);
  assert.match(app, /TIMESTAMPED STOPS \/\/ TAKE INFERENCE/);
  assert.match(app, /CURATED INDEXED SIGHTINGS/);
  assert.doesNotMatch(
    app,
    /VERIFIED EVENTS|TIMESTAMP-VERIFIED STOPS|VERIFIED SIGHTINGS/,
  );
});
