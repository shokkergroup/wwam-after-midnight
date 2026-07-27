import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const readRoot = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readDemo = (file) => fs.readFileSync(path.join(demo, file), "utf8");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load(files) {
  const sandbox = { window: {} };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  for (const file of files) {
    vm.runInContext(readDemo(file), sandbox, { filename: file });
  }
  return sandbox.window;
}

test("the current package identity and browser cache keys move together", () => {
  const manifest = JSON.parse(readRoot("package.json"));
  const lock = JSON.parse(readRoot("package-lock.json"));
  const html = readDemo("index.html");
  const playback =
    '<script src="youtube-playback.js?v=0.5.21-p1"></script>';
  const app = '<script src="app.js?v=0.5.21-ui15"></script>';

  assert.equal(manifest.version, "0.5.21");
  assert.equal(lock.version, "0.5.21");
  assert.equal(lock.packages[""].version, "0.5.21");
  assert.ok(html.indexOf(playback) >= 0, "Playback cache key is stale.");
  assert.ok(html.indexOf(app) > html.indexOf(playback), "App cache/order drift.");
});

test("V5.14 binds adjudication voice and the current longitudinal input", () => {
  const window = load([
    "wwam-channel-dna.js",
    "channel-pack-contract.js",
    "wwam-channel-pack-adapter.js",
    "longitudinal-docket-data.js",
  ]);
  const pack = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER,
  );
  const data = window.WWAM_LONGITUDINAL_DOCKETS;

  assert.equal(pack.fingerprint, "cp1-dd23bc386008689b");
  assert.equal(data.channel.packFingerprint, pack.fingerprint);
  assert.equal(data.fingerprints.publicFnv1a, "fnv1a32:59b085f6");
  assert.equal(
    data.fingerprints.captionSetSha256,
    "sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc",
  );
  assert.equal(
    pack.capabilities.filter(
      (capability) => capability === "human-adjudication-ledger",
    ).length,
    1,
  );
  assert.deepEqual(plain(pack.adjudicationVocabulary), {
    CONTRADICTED: {
      bleep: "AGED LIKE ROADKILL.",
      comedy: "AGED LIKE ROADKILL.",
      formal: "CONTRADICTED WITHIN REVIEWED SCOPE",
    },
    MIXED: {
      bleep: "HALF PROPHET. HALF [BLEEP].",
      comedy: "HALF PROPHET. HALF JACKASS.",
      formal: "MIXED WITHIN REVIEWED SCOPE",
    },
    SUPPORTED: {
      bleep: "CALLED THAT [BLEEP].",
      comedy: "CALLED THAT SHIT.",
      formal: "SUPPORTED WITHIN REVIEWED SCOPE",
    },
  });
});

test("V5.14 documentation ships the local-authority contract and keeps V5.13 history", () => {
  const readme = readRoot("README.md");
  const overview = readRoot("docs/V5_OVERVIEW.md");
  const channelPack = readRoot("docs/CHANNEL_PACK_CONTRACT.md");
  const docket = readRoot("docs/LONGITUDINAL_DOCKET.md");
  const verdict = readRoot("docs/VERDICT_ROOM_DESIGN.md");
  const runbook = readRoot("docs/CREATOR_DEMO_RUNBOOK.md");
  const changelog = readRoot("docs/CHANGELOG.md");
  const oldRelease = changelog.slice(
    changelog.indexOf("## 0.5.13"),
    changelog.indexOf("## 0.5.12"),
  );

  assert.match(readme, /Current documented release: \*\*V5\.21 \/ 0\.5\.21\*\*/);
  assert.match(overview, /^# WWAM After Midnight V5\.21/m);
  assert.match(channelPack, /## The eleven conformance domains/);
  assert.match(channelPack, /human-adjudication-ledger/);
  assert.match(docket, /fnv1a32:59b085f6/);
  assert.match(verdict, /Status: implemented in release `0\.5\.14`/);
  assert.match(verdict, /twelve caller-attested human checks/i);
  assert.match(runbook, /## V5\.14 The Verdict Room proof/);
  assert.ok(
    changelog.indexOf("## 0.5.15") < changelog.indexOf("## 0.5.14"),
    "The current release must precede V5.14.",
  );
  assert.match(oldRelease, /cp1-f9ad38be22481b5d/);
  assert.match(oldRelease, /fnv1a32:d4ca362e/);
});

test("all released Verdict Room assets exist and remain outside the eager script path", () => {
  const html = readDemo("index.html");
  const assets = [
    "verdict-room-engine.js",
    "wwam-verdict-room-adapter.js",
    "verdict-room-ui.js",
    "verdict-room-surface.js",
    "verdict-room.css",
  ];
  const eagerScripts = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
    (match) => match[1].split("?")[0],
  );

  for (const asset of assets) {
    assert.ok(fs.statSync(path.join(demo, asset)).size > 0, `${asset} is empty.`);
    if (asset.endsWith(".js")) {
      assert.equal(eagerScripts.includes(asset), false, `${asset} is eager.`);
    }
  }
  assert.doesNotMatch(html, /<link\b[^>]*href="verdict-room\.css"/);
  assert.ok(
    fs.statSync(path.join(demo, "app.js")).size < 270_000,
    "app.js exceeded its V5.21 255 KB source ceiling.",
  );
});
