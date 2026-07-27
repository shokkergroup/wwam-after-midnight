import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const source = fs.readFileSync(path.join(demo, "steves-asshole.js"), "utf8");
const css = fs.readFileSync(path.join(demo, "steves-asshole.css"), "utf8");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const context = { console, Promise };
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "steves-asshole.js" });
const api = context.WWAMStraightToSteve;

function sourceRecord(overrides = {}) {
  return {
    id: "LV2rmwEA0w4",
    date: "2026-07-23",
    displayTitle: "We Watched A Movie Live! Movie News and More",
    thumbnail: "https://i.ytimg.com/vi/LV2rmwEA0w4/maxresdefault.jpg",
    lanes: ["livestream"],
    showWiki: {
      format: { id: "livestream" },
      lanes: [{ id: "straight-to-steves-asshole", receiptKeys: ["take-1", "wrong-1", "private-1", "held-1"] }],
    },
    receipts: [
      { key: "take-1", at: 325, end: 346, label: "TAKE GETS NUCLEAR", excerpt: "That goes straight to Steve.", publicExcerptAllowed: true, reviewState: "machine-surfaced", signalScore: 84 },
      { key: "wrong-1", at: 400, label: "FULL SEND", excerpt: "Wrong lane.", publicExcerptAllowed: true },
      { key: "private-1", at: 500, label: "FRANCHISE FELONY", excerpt: "Private.", publicExcerptAllowed: false },
      { key: "held-1", at: 600, label: "FRANCHISE FELONY", excerpt: "Unreviewed garbage.", publicExcerptAllowed: true, reviewState: "quarantined-machine-candidate" },
    ],
    ...overrides,
  };
}

test("Steve is a visible first-class room with lazy, local assets", () => {
  assert.match(html, /id="steves-asshole"/);
  assert.ok(html.includes('data-feature-styles="steves-asshole.css?v=1.0.3"'));
  assert.ok(html.includes('data-feature-scripts="steves-asshole.js?v=1.0.3"'));
  assert.ok((html.match(/href="#steves-asshole"/g) || []).length >= 3);
  assert.match(source, /WWAMSourceDossierAccess/);
  assert.match(source, /mountWhenReady/);
});

test("the rejection chute only admits playable, public, lane-bound clips", () => {
  const data = api.inventory({ sources: [sourceRecord()] });
  assert.equal(data.items.length, 1);
  assert.equal(data.metrics.candidates, 1);
  assert.equal(data.metrics.sources, 1);
  assert.equal(data.items[0].originalLabel, "TAKE GETS NUCLEAR");
  assert.equal(data.items[0].route, "?source=LV2rmwEA0w4&at=325&section=wiki#archive");
  assert.match(data.items[0].sourceUrl, /LV2rmwEA0w4&t=325s$/);
});

test("Steve sounds like WWAM while provenance stays under the hood", () => {
  const data = api.inventory({ sources: [sourceRecord()] });
  const markup = api.render(data, { query: "", type: "all", sort: "newest" });
  assert.match(markup, /THE STUFF THEY HATED/);
  assert.match(markup, /PLAY IT BEFORE YOU QUOTE IT/);
  assert.match(markup, /PLAY THE CLIP/);
  assert.match(markup, /OPEN SHOW WIKI/);
  assert.doesNotMatch(markup, /SOURCE-LOCAL|MACHINE SURFACED|SPEAKER NOT DIARIZED|STRICT CANDIDATES/);
  assert.doesNotMatch(markup, /pricing|price list/i);
});

test("Steve filters and touch layout remain usable", () => {
  const commentary = sourceRecord({
    id: "28PfRNKoSCA",
    date: "2021-10-01",
    displayTitle: "Halloween 4 Commentary",
    lanes: ["commentary-catalog"],
    showWiki: { format: { id: "movie-commentary" }, lanes: [{ id: "straight-to-steves-asshole", receiptKeys: ["take-1"] }] },
  });
  const data = api.inventory({ sources: [sourceRecord(), commentary] });
  assert.equal(api.filterItems(data, { query: "movie news", type: "all", sort: "newest" }).length, 1);
  assert.equal(api.filterItems(data, { query: "", type: "commentary", sort: "oldest" }).length, 1);
  assert.ok(css.includes("min-height: 44px"));
  assert.ok(css.includes("@media (max-width: 720px)"));
  assert.match(css, /prefers-reduced-motion/);
});
