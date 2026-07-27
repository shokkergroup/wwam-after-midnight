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

const context = { console };
context.globalThis = context;
vm.runInNewContext(ui, context, { filename: "year-canon-ui.js" });
const languageApi = context.WWAMYearCanonUI;

function sectionText(id) {
  const match = html.match(new RegExp(`<section[^>]+id="${id}"[\\s\\S]*?<\\/section>`));
  assert.ok(match, `${id} is missing`);
  return match[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

test("the 2025 and 2026 shelf opens with fan choices instead of a second analytics hero", () => {
  const shelf = sectionText("yearCanonSpotlight");
  assert.match(shelf, /TWO YEARS\. ONE SHELF\./);
  assert.match(shelf, /SHOW WIKIS 130 \/ 131/);
  assert.match(shelf, /ONE WATCH-ONLY SHOW/);
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
    "WATCH ONLY",
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