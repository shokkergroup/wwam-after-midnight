import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const demo = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "demo");

function load() {
  const window = {
    WWAM_CHANNEL_DNA: {
      id: "wwam",
      proofSnapshot: { asOf: "2026-07-23", sources: 84, receipts: 872 },
    },
  };
  const sandbox = { window, globalThis: window, URL, URLSearchParams };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(demo, "ask-share.js"), "utf8"), sandbox);
  return window;
}

function loadSearchAndShare() {
  const window = {};
  const sandbox = { window, globalThis: window, URL, URLSearchParams, setTimeout };
  vm.createContext(sandbox);
  [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "archive-deep-distill.js",
    "wwam-channel-dna.js",
    "search-engine.js",
    "ask-share.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  function engine() {
    return window.WWAMSearchEngine.create(
      window.WWAM_CATALOG,
      window.WWAM_DEEP_DISTILL,
      window.WWAM_LIVESTREAMS,
      window.WWAM_CURATED,
      window.WWAM_POPULAR_LIVE,
      window.WWAM_CHARACTER_LORE,
      window.WWAM_ARCHIVE_DEEP,
    );
  }
  return { window, engine };
}

const context = {
  query: "Where is The Burp Defense?",
  intent: "discovery",
  source: "commentary",
  entity: "THE BURP DEFENSE",
  entityType: "bit",
  resultAnchor: {
    key: "moment-burp",
    source: "commentary",
    sourceId: "BIbyzMlstmM",
    at: 1528,
    kind: "moment",
    lane: "",
  },
};

test("contextual Ask links round-trip the exact bounded result anchor", () => {
  const share = load().WWAMAskShare;
  const url = share.build(
    "https://example.test/demo/index.html?live=old&at=9#popular25",
    "Who said that?",
    context,
  );
  const parsed = share.read(new URL(url).search);

  assert.equal(share.VERSION, "1.0.0");
  assert.equal(parsed.query, "Who said that?");
  assert.deepEqual(JSON.parse(JSON.stringify(parsed.context)), context);
  assert.equal(parsed.needsArchive, false);
  assert.equal(parsed.needsRedBand, false);
  assert.equal(new URL(url).searchParams.has("live"), false);
  assert.equal(new URL(url).hash, "#ask");
});

test("a copied contextual answer replays the same receipt through a fresh engine", () => {
  const fixture = loadSearchAndShare();
  const firstEngine = fixture.engine();
  const burp = firstEngine.ask("Where is The Burp Defense?");
  const speaker = firstEngine.ask("Who said that?", burp.context);
  const url = fixture.window.WWAMAskShare.build(
    "https://example.test/demo/index.html",
    "Who said that?",
    speaker.context,
  );
  const shared = fixture.window.WWAMAskShare.read(new URL(url).search);
  const replayed = fixture.engine().ask(shared.query, shared.context);

  assert.equal(replayed.status, "speaker-unknown");
  assert.equal(replayed.results.length, 1);
  assert.equal(replayed.results[0].sourceId, speaker.results[0].sourceId);
  assert.equal(replayed.results[0].at, speaker.results[0].at);
  assert.equal(replayed.results[0].key, speaker.results[0].key);
});

test("Red Band rank follow-up links retain their deferred query context", () => {
  const share = load().WWAMAskShare;
  const redContext = {
    query: "What is Red Band #25?",
    intent: "red-band-ranking",
    source: "all",
    entity: "Red Band 100",
    entityType: null,
    resultAnchor: null,
  };
  const parsed = share.read(new URL(share.build(
    "https://example.test/demo/index.html",
    "What about #26?",
    redContext,
  )).search);

  assert.equal(parsed.needsRedBand, true);
  assert.equal(parsed.context.intent, "red-band-ranking");
  assert.equal(parsed.context.resultAnchor, null);
});

test("Archive Deep anchors request the deferred evidence lane before replay", () => {
  const share = load().WWAMAskShare;
  const deepContext = structuredClone(context);
  deepContext.resultAnchor.source = "livestream";
  deepContext.resultAnchor.sourceId = "1j3F9vAWBo4";
  deepContext.resultAnchor.lane = "archive";
  const parsed = share.read(new URL(share.build(
    "https://example.test/demo/index.html",
    "What happened next?",
    deepContext,
  )).search);

  assert.equal(parsed.needsArchive, true);
  assert.equal(parsed.context.resultAnchor.sourceId, "1j3F9vAWBo4");
});

test("foreign snapshots and malformed anchors cannot steer a shared answer", () => {
  const window = load();
  const share = window.WWAMAskShare;
  const url = new URL(share.build(
    "https://example.test/demo/index.html",
    "Who said that?",
    context,
  ));

  window.WWAM_CHANNEL_DNA.proofSnapshot.receipts = 999;
  const stale = share.read(url.search);
  assert.equal(stale.context, null);
  assert.equal(stale.stale, true);

  url.searchParams.set("askContext", JSON.stringify({
    snapshot: "wwam:2026-07-23:84:999",
    context: { resultAnchor: { sourceId: "<script>", at: -4, kind: "moment" } },
  }));
  const invalid = share.read(url.search);
  assert.equal(invalid.context, null);
  assert.equal(invalid.needsArchive, false);
});
