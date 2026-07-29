import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(demo, "year-canon-ui.js"), "utf8");
const css = fs.readFileSync(path.join(demo, "year-canon.css"), "utf8");
const guided = fs.readFileSync(path.join(demo, "guided-shell.js"), "utf8");

const context = { console };
context.globalThis = context;
vm.runInNewContext(ui, context, { filename: "year-canon-ui.js" });
const languageApi = context.WWAMYearCanonUI;

function sectionText(id) {
  const match = html.match(new RegExp(`<section[^>]+id="${id}"[\\s\\S]*?<\\/section>`));
  assert.ok(match, `${id} is missing`);
  return match[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

test("the 2025 and 2026 shelf opens with all 131 recovered Show Wikis", () => {
  const shelf = sectionText("yearCanonSpotlight");
  assert.match(shelf, /TWO YEARS\. ONE SHELF\./);
  assert.match(shelf, /SHOW WIKIS 131 \/ 131/);
  assert.match(shelf, /EVERY SHOW NOW HAS A SOURCE-BACKED WIKI/);
  assert.match(shelf, /PICK A CATEGORY/);
  assert.match(shelf, /OPENING THE 2025 \+ 2026 SHELF/);
  assert.doesNotMatch(shelf, /THE LIVING CANON|MACHINE|OPERATOR|CANDIDATE|EVIDENCE|RECEIPT|DISTILL|WORKFLOW/);
});

test("the shelf keeps four useful numbers and plain-language play routes", () => {
  const proofBlock = ui.match(/var cards = \[([\s\S]*?)\n    \];/);
  assert.ok(proofBlock, "proof cards are missing");
  assert.equal((proofBlock[1].match(/\[meta\./g) || []).length, 4);
  for (const label of [
    "SHOWS ON THE SHELF",
    "SHOW WIKIS",
    "TOPIC JUMPS",
    "SHOW WIKIS STILL HELD",
    "START WITH THIS MOMENT",
    "PLAY THIS PART",
    "STEVE'S ASSHOLE",
  ]) {
    assert.match(ui, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(ui, /function fanSummary\(show\)/);
  assert.doesNotMatch(ui, /esc\(show\.summary\)/);
  assert.doesNotMatch(ui, /BEST MACHINE-SURFACED ROUTE|CACHED VIEWS|NO PUBLIC TOPIC RECEIPTS|OPEN THE RECEIPT|MOMENTS WAITING FOR REVIEW/);
});

test("the completion overlay promotes a recovered source without duplicating the corpus", () => {
  const canonFixture = {
    meta: {
      registered: 2, captionBacked: 1, sourceBriefs: 1,
      wordsAudited: 100, topicDoors: 3, momentCandidates: 2,
      upInYa: 1, straightToSteves: 0,
      yearCounts: { 2026: { registered: 2, captionBacked: 1, sourceBriefs: 1 } },
    },
    showIndex: [
      {
        id: "RECOVERED01", year: "2026", wikiState: "source-brief",
        coverage: "caption-limited", wordsAudited: 0, topics: [],
        upInYa: 0, steves: 0, showShape: "RANKING NIGHT",
      },
      {
        id: "ALREADYWIKI", year: "2026", wikiState: "show-wiki",
        wordsAudited: 100, topics: [{ name: "Halloween", at: 20 }],
        upInYa: 1, steves: 0,
      },
    ],
  };
  const completionFixture = {
    streams: [{
      id: "RECOVERED01", captioned: true, wordsAudited: 500,
      summary: "A source-backed recovered recap.",
      editorial: { showShape: "RANKING NIGHT" },
      topics: [
        { name: "Box Office", at: 120, mentions: 8, receipt: "box office night" },
        { name: "Superman", peak: 240, mentions: 5, receipt: "superman turn" },
      ],
      moments: [
        { at: 300, category: "UP IN YA", excerpt: "bounded source line", heat: 82 },
        { t: 450, category: "FULL SEND", excerpt: "another source line", heat: 99 },
      ],
      rightsPolicy: { restrictedToTopicNavigation: false },
      contentMode: "ranking-show",
    }],
  };

  const overlay = languageApi.applyRecoveryOverlay(canonFixture, completionFixture);
  const recovered = overlay.shows.find((show) => show.id === "RECOVERED01");

  assert.deepEqual(Array.from(overlay.recovered), ["RECOVERED01"]);
  assert.equal(recovered.wikiState, "show-wiki");
  assert.equal(recovered.coverage, "source-backed-local-asr");
  assert.equal(recovered.topics.length, 2);
  assert.equal(recovered.topics[1].at, 240);
  assert.equal(recovered.bestMoment.at, 450);
  assert.equal(recovered.upInYa, 1);
  assert.equal(overlay.meta.captionBacked, 2);
  assert.equal(overlay.meta.sourceBriefs, 0);
  assert.equal(overlay.meta.wordsAudited, 600);
  assert.equal(overlay.meta.topicDoors, 5);
  assert.equal(overlay.meta.momentCandidates, 4);
  assert.deepEqual(
    JSON.parse(JSON.stringify(overlay.meta.yearCounts["2026"])),
    { registered: 2, captionBacked: 2, sourceBriefs: 0 },
  );
  assert.equal(canonFixture.showIndex[0].wikiState, "source-brief");
  assert.equal(canonFixture.meta.captionBacked, 1);
});

test("the latest-five shelf opens the recovered box-office Show Wiki", () => {
  const recoveredCard = guided.match(
    /recentCard\("x6tvsGRHgU0"[\s\S]*?\)\s*\+/,
  );
  assert.ok(recoveredCard, "the June 30 recovered show card is missing");
  assert.match(recoveredCard[0], /RECOVERED WIKI/);
  assert.match(recoveredCard[0], /Horror, Box Office, Superman and The Conjuring/);
  assert.doesNotMatch(recoveredCard[0], /WATCH-ONLY|CAPTION-LIMITED|no usable English captions/i);
});

test("the internal autopsy queue stays in the DOM but is absent from the public shelf", () => {
  assert.match(html, /<div class="archive-queue" hidden aria-hidden="true">/);
  assert.match(css, /\.archive-queue\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
});

test("the compact shelf stylesheet is cache-busted and no longer uses six dashboard columns", () => {
  assert.match(html, /year-canon\.css\?v=1\.1\.0/);
  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /font:\s*400 clamp\(44px, 5\.6vw, 78px\)/);
  assert.doesNotMatch(css, /repeat\(6, minmax\(0, 1fr\)\)/);
});
test("the year shelf reduces raw excerpts and profanity-bearing labels without over-redacting", () => {
  const reducedDocument = {
    body: { classList: { contains: (name) => name === "office-bleep" } },
  };
  const visible = languageApi.displayText(
    "Fuck this shit. Steve's asshole. Assignment Night stays visible.",
    reducedDocument
  );

  assert.doesNotMatch(visible, /fuck|shit|asshole/i);
  assert.match(visible, /••••/);
  assert.match(visible, /Assignment Night stays visible/);
  assert.match(ui, /displayText\(best\.excerpt, doc\)/);
  assert.match(ui, /displayText\("STEVE\\'S ASSHOLE", doc\)/);
});

test("the year shelf repaints when reduced-language mode changes", () => {
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
  languageApi.observeLanguage({ body }, () => { changes += 1; }, FakeObserver);

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
