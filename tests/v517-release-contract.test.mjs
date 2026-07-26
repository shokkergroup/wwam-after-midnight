import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const readRoot = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readDemo = (file) => fs.readFileSync(path.join(demo, file), "utf8");

test("V5.17 package, cache keys, and Source Dossier documentation move together", () => {
  const manifest = JSON.parse(readRoot("package.json"));
  const lock = JSON.parse(readRoot("package-lock.json"));
  const html = readDemo("index.html");
  const readme = readRoot("README.md");
  const overview = readRoot("docs/V5_OVERVIEW.md");
  const dossier = readRoot("docs/SOURCE_DOSSIER.md");
  const changelog = readRoot("docs/CHANGELOG.md");
  const runbook = readRoot("docs/CREATOR_DEMO_RUNBOOK.md");
  const memoryOs = readRoot("docs/YOUTUBE_WIKI_MEMORY_OS.md");
  const combined = [readme, overview, dossier, changelog, runbook, memoryOs]
    .join("\n");

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");
  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(dossier, /Release contract for \*\*V5\.18 \/ 0\.5\.18\*\*/);
  assert.match(changelog, /^## 0\.5\.17 .*The Source Dossier/m);
  assert.match(runbook, /current V5\.21 build/i);
  assert.match(html, /youtube-playback\.js\?v=0\.5\.21/);
  assert.match(html, /app\.js\?v=0\.5\.21/);

  for (const proof of [
    /510 unique canonical uploads/i,
    /472 cached official Streams-feed records/i,
    /111 caption-backed/i,
    /390 metadata-only/i,
    /nine caption-limited/i,
    /21 registered receipts/i,
    /13 Short candidates/i,
    /six supercut memberships/i,
    /four resurfacing\s+opportunities/i,
    /source-metadata-neighbor/,
    /creator-draft/,
    /editor-review/,
    /\?source=LV2rmwEA0w4&at=6455#archive/,
  ]) {
    assert.match(combined, proof);
  }
});

test("all Source Dossier assets ship locally but remain outside the eager document", () => {
  const html = readDemo("index.html");
  const scripts = [
    "source-dossier-engine.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-ui.js",
  ];
  const styles = ["source-dossier.css"];

  for (const asset of [...scripts, ...styles]) {
    assert.equal(fs.existsSync(path.join(demo, asset)), true, `${asset} is missing`);
  }
  const eagerScripts = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );
  const eagerStyles = Array.from(
    html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );
  for (const asset of scripts) assert.equal(eagerScripts.includes(asset), false);
  for (const asset of styles) assert.equal(eagerStyles.includes(asset), false);
});

test("the release keeps Source Dossier media dormant and YouTube identity explicit", () => {
  const ui = readDemo("source-dossier-ui.js");
  const playback = readDemo("youtube-playback.js");
  const bridge = readDemo("media-bridge.html");
  const index = readDemo("index.html");

  assert.doesNotMatch(ui, /<iframe|<video|<audio|autoplay\s*=/i);
  assert.match(ui, /id="modalPlayer"/);
  assert.match(ui, /data-source-dossier-action="play-source"/);
  assert.match(index, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
  assert.match(playback, /referrerpolicy="' \+ POLICY/);
  assert.match(playback, /query\.set\("origin", identity\.origin\)/);
  assert.match(bridge, /parameters\.set\("origin", location\.origin\)/);
  assert.match(bridge, /parameters\.set\("widget_referrer", widgetReferrer\)/);
  assert.doesNotMatch(
    index + playback + bridge,
    /referrerpolicy=["']no-referrer|referrerPolicy\s*=\s*["']no-referrer/i,
  );
});
