import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadPack() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  [
    "wwam-channel-dna.js",
    "wwam-channel-pack-adapter.js",
    "channel-pack-contract.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window.ShokkerChannelPack.compile(
    sandbox.window.WWAM_CHANNEL_DNA,
    sandbox.window.WWAM_CHANNEL_PACK_ADAPTER,
  );
}

test("V5.6 release identity and ChannelPack capability stay synchronized", () => {
  const packageJson = JSON.parse(read("package.json"));
  const changelog = read("docs/CHANGELOG.md");
  const pack = loadPack();

  assert.equal(packageJson.version, "0.5.13");
  assert.match(changelog, /^## 0\.5\.6\b/m);
  assert.equal(pack.fingerprint, "cp1-f9ad38be22481b5d");
  assert.equal(pack.capabilities.includes("fresh-tape-intake"), true);
  assert.equal(
    pack.capabilities.filter((capability) => capability === "fresh-tape-intake").length,
    1,
  );
  assert.match(
    changelog,
    /V5\.6 pack fingerprint is\s+`cp1-8ac1488f4f78448c`/i,
  );
});

test("the downloadable ChannelPack policy describes the intake firewall", () => {
  const spec = JSON.parse(read("public/demo/channel-pack-spec.json"));
  const boundary = spec["x-shokker-conformance"].freshTapeIntakeRule;
  const example = spec.properties.capabilities.examples[0];

  assert.equal(example.includes("fresh-tape-intake"), true);
  assert.match(boundary, /device-local parsing only/i);
  assert.match(boundary, /no network fetch/i);
  assert.match(boundary, /does not verify channel ownership or reviewer identity/i);
  assert.match(boundary, /timed transcript evidence/i);
  assert.match(boundary, /quarantined and undiarized/i);
  assert.match(boundary, /untimed text with zero candidates/i);
  assert.match(boundary, /FNV-bound structural verification/i);
  assert.match(
    boundary,
    /do not prove source content, authenticity, ownership, speaker identity, or authority/i,
  );
});

test("release documentation keeps consistency proof separate from authority", () => {
  const corpus = [
    read("README.md"),
    read("docs/CHANNEL_PACK_CONTRACT.md"),
    read("docs/FRESH_TAPE_INTAKE.md"),
    read("docs/V5_OVERVIEW.md"),
  ].join("\n");

  assert.match(corpus, /performs no network fetch/i);
  assert.match(
    corpus,
    /(?:does not|cannot) verify channel ownership|channel-ownership-unverified/i,
  );
  assert.match(corpus, /plain text[^.\n]*held[^.\n]*zero candidates/i);
  assert.match(corpus, /assigns no speaker/i);
  assert.match(corpus, /cannot promote/i);
  assert.match(corpus, /raw transcript[^.\n]*(?:omitted|stay out)/i);
  assert.match(
    corpus,
    /does not prove identity,[\s\S]{0,160}creator approval/i,
  );
  assert.match(corpus, /FNV-based deterministic structural change detectors only/i);
  assert.match(corpus, /sourceContentVerified:\s*false/);
  assert.match(corpus, /authorityVerified:\s*false/);
});

test("the intake engine has no browser-network primitive and stays separately bounded", () => {
  const engine = read("public/demo/fresh-tape-intake-engine.js");

  assert.doesNotMatch(
    engine,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/,
  );
  assert.match(engine, /CAPABILITY_NOT_DECLARED/);
  assert.match(engine, /channel-ownership-unverified/);
  assert.match(engine, /Plain text has no timestamp evidence/);
  assert.match(engine, /rawTranscriptExported:\s*false/);
  assert.match(engine, /speakerInference:\s*false/);
  assert.match(engine, /promotionAllowed:\s*false/);
  assert.match(engine, /structuralValidationOnly:\s*true/);
  assert.match(engine, /sourceAuthenticityVerified:\s*false/);
  assert.match(engine, /maxCharactersPerWord:\s*256/);
  assert.match(engine, /maxCharactersPerEvent:\s*12000/);
  assert.match(engine, /maxExcerptCharacters:\s*1200/);
  assert.match(engine, /function verifyExport\(/);
});
