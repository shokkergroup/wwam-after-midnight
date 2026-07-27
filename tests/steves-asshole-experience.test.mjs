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
  assert.ok(html.includes('data-feature-styles="steves-asshole.css?v=1.0.4"'));
  assert.ok(html.includes('data-feature-scripts="steves-asshole.js?v=1.2.1"'));
  assert.ok((html.match(/href="#steves-asshole"/g) || []).length >= 1);
  assert.match(html, /href="#best-bits"[^>]*data-journey-link="highlights">BEST BITS<\/a>/);
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
  assert.match(markup, /WHY IT GOT FLUSHED/);
  assert.match(markup, /turns one specific complaint into a full rejection\./);
  assert.match(markup, /ROUGH TRANSCRIPT/);
  assert.match(markup, /TRANSCRIPT MAY MISS A WORD/);
  assert.match(markup, /BIGGEST REJECTIONS FIRST/);
  assert.match(markup, /PLAY THE CLIP/);
  assert.match(markup, /OPEN SHOW WIKI/);
  assert.doesNotMatch(markup, /HEAT \d|CHECK THE TAPE|ARCHIVE FIND/);
  assert.doesNotMatch(markup, /SOURCE-LOCAL|AUTO-CAPTION|MACHINE|CANDIDATE|DASHBOARD|SPEAKER NOT DIARIZED/);
  assert.doesNotMatch(markup, /pricing|price list/i);
});

test("Steve writes a source-grounded note for franchise felonies", () => {
  const commentary = sourceRecord({
    id: "28PfRNKoSCA",
    date: "2021-10-01",
    displayTitle: "Halloween 4 Commentary",
    lanes: ["commentary-catalog"],
    showWiki: {
      format: { id: "movie-commentary" },
      lanes: [{ id: "straight-to-steves-asshole", receiptKeys: ["felony-1"] }],
    },
    receipts: [{
      key: "felony-1",
      at: 980,
      label: "FRANCHISE FELONY",
      excerpt: "That mask is terrible.",
      publicExcerptAllowed: true,
      reviewState: "machine-surfaced",
      signalScore: 99,
    }],
  });
  const markup = api.render(api.inventory({ sources: [commentary] }), {
    query: "",
    type: "all",
    sort: "hottest",
  });
  assert.match(markup, /A bus-scene complaint is what gets singled out in this Halloween 4 clip\./);
  assert.doesNotMatch(markup, />HEAT 99<|MOST HEATED FIRST/);
});

test("the fourteen known clips each receive a distinct editor note", () => {
  const known = [
    ["rLXnU3Rsj-4", 1145, "The Dream Master", "FRANCHISE FELONY", "junkyard where the dumbest franchise happened"],
    ["c15otfZ8HkU", 3918, "Dream Warriors", "FRANCHISE FELONY", "neil i hate this scene john saxon"],
    ["jG93HvyP420", 12774, "HALLOWEEN ENDS Spoiler Party Live!", "TAKE GETS NUCLEAR", "show Michael with his mask off"],
    ["AtcRT3Xkk6E", 1327, "Halloween 5: The Revenge of Michael Myers", "FRANCHISE FELONY", "terrible that mask is"],
    ["YaE7bkZ2JAM", 8475, "HORROR Remakes Tier List Live!", "TAKE GETS NUCLEAR", "writing was terrible the pacing was awful"],
    ["jLIfEdg8Oc0", 374, "Scream 3", "FRANCHISE FELONY", "terrible of a sound effect"],
    ["Q6SN-Om1gIo", 4387, "Halloween H20", "FRANCHISE FELONY", "alien mask it is terrible"],
    ["kX3wb5pBRDo", 5635, "Ranking HALLOWEEN + SCREAM + ANOES + FRIDAY THE 13th Live!", "TAKE GETS NUCLEAR", "terrible movie"],
    ["hQu1Y1GZozI", 5660, "Scream (2022)", "FRANCHISE FELONY", "hate the twist jack quade is a good actor"],
    ["2en5C2sNAN8", 5251, "Ranking HALLOWEEN + SCREAM + ANOES + FRIDAY THE 13th Tier List!", "TAKE GETS NUCLEAR", "this movie sucks"],
    ["G2m0effDrwI", 470, "Jason Takes Manhattan", "FRANCHISE FELONY", "the worst thing about this entire movie"],
    ["28PfRNKoSCA", 980, "Halloween 4: The Return of Michael Myers", "FRANCHISE FELONY", "on the bus that sucks"],
    ["M2iupVAFWt8", 3664, "Rob Zombie's Halloween", "FRANCHISE FELONY", "glad that she got a role in this movie but it sucks"],
    ["N-UahfG8-gM", 5227, "We Watched A Movie LIVE! Movie News and More", "TAKE GETS NUCLEAR", "the reveal sucks"],
  ];
  const sources = known.map(([id, at, displayTitle, label, excerpt], index) => sourceRecord({
    id,
    date: `2025-01-${String(index + 1).padStart(2, "0")}`,
    displayTitle,
    showWiki: {
      format: { id: "livestream" },
      lanes: [{ id: "straight-to-steves-asshole", receiptKeys: [`known-${index}`] }],
    },
    receipts: [{
      key: `known-${index}`,
      at,
      label,
      excerpt,
      publicExcerptAllowed: true,
      reviewState: "machine-surfaced",
    }],
  }));
  const data = api.inventory({ sources });
  const notes = data.items.map((item) => item.editorNote);

  assert.equal(notes.length, 14);
  assert.equal(new Set(notes).size, 14);
  assert.ok(notes.every((note) => note.length >= 55));
  assert.ok(notes.some((note) => /John Saxon/.test(note)));
  assert.ok(notes.some((note) => /Jack Quaid/.test(note)));
  assert.ok(notes.some((note) => /sound effect/.test(note)));
  assert.ok(notes.some((note) => /writing and the pacing/.test(note)));
  assert.doesNotMatch(notes.join("\n"), /one-way ticket|goes full-volume|machine|candidate/i);
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

test("reduced-language mode bleeps public Steve labels and excerpts without touching playback", () => {
  const reducedDocument = {
    body: { classList: { contains: (name) => name === "office-bleep" } },
  };
  const profane = sourceRecord({
    displayTitle: "Assignment Night",
    receipts: [{
      key: "take-1",
      at: 325,
      end: 346,
      label: "TAKE GETS NUCLEAR",
      excerpt: "Fuck this shit, but assignment stays intact.",
      publicExcerptAllowed: true,
      reviewState: "machine-surfaced",
      signalScore: 84,
    }],
  });
  const data = api.inventory({ sources: [profane] });
  const markup = api.render(data, { query: "", type: "all", sort: "newest" }, reducedDocument);
  const playback = api.playDetail(data.items[0]);

  assert.doesNotMatch(markup, /fuck|shit|asshole/i);
  assert.match(markup, /••••/);
  assert.match(markup, /assignment stays intact/i);
  assert.equal(playback.sourceId, "LV2rmwEA0w4");
  assert.equal(playback.start, 325);
  assert.equal(playback.end, 346);
  assert.equal(data.items[0].excerpt, "Fuck this shit, but assignment stays intact.");
});

test("Steve observes body class changes and repaints only when language mode changes", () => {
  let reduced = false;
  let callback;
  let observed;
  let changes = 0;
  class FakeObserver {
    constructor(fn) { callback = fn; }
    observe(target, options) { observed = { target, options }; }
    disconnect() {}
  }
  const body = {
    classList: { contains: (name) => name === "office-bleep" && reduced },
  };
  const documentRef = { body };
  api.observeLanguage(documentRef, () => { changes += 1; }, FakeObserver);

  assert.equal(observed.target, body);
  assert.deepEqual(Array.from(observed.options.attributeFilter), ["class"]);
  callback();
  assert.equal(changes, 0);
  reduced = true;
  callback();
  assert.equal(changes, 1);
  callback();
  assert.equal(changes, 1);
});