import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of [
  "catalog.js",
  "deep-distill.js",
  "curation.js",
  "character-lore.js",
  "halloween-acquired-distill.js",
  "halloween-commentary-enrichment.js",
  "halloween-canon-index.js",
  "halloween-universe-engine.js",
  "halloween-universe-ui.js",
]) {
  vm.runInContext(
    fs.readFileSync(new URL(`../public/demo/${file}`, import.meta.url), "utf8"),
    sandbox,
    { filename: file },
  );
}

const engine = sandbox.window.WWAMHalloweenUniverseEngine.create();
const ui = sandbox.window.WWAMHalloweenUniverseUI;
const model = (overrides = {}) => ui.buildModel(engine, {
  activeTab: "films",
  filmId: "",
  pathId: "",
  query: "",
  ...overrides,
});

test("renders a readable world shell with six clear entry modes", () => {
  const markup = ui.renderMarkup(model());
  assert.match(markup, /WELCOME TO THE HALLOWEEN AISLE/);
  assert.match(markup, /13 SHOW WIKIS/);
  assert.match(markup, /BINGE PATHS/);
  assert.match(markup, /LOOMIS \+ CHALLIS/);
  assert.match(markup, /UP IN YA/);
  assert.match(markup, /STEVE'S INBOX/);
  assert.match(markup, /ALL HALLOWEEN/);
  assert.match(markup, /HOW IT WORKS/);
  assert.match(markup, /13 MOVIES\. 13 SHOW WIKIS\. START ANYWHERE\./);
  assert.equal((markup.match(/data-hu-film=/g) || []).length, 13);
  assert.doesNotMatch(markup, /<iframe\b/i);
  assert.doesNotMatch(markup, /MACHINE-SURFACED|SOURCE-LOCAL|speaker-diarized|navigation candidates/i);
  assert.doesNotMatch(markup, /\b(?:price|pricing|buy|purchase|revenue|sales)\b/i);
});

test("each film expands into a show wiki with playable evidence lanes", () => {
  const markup = ui.renderMarkup(model({ filmId: "6VXSBDZ-3WE" }));
  assert.match(markup, /COMMENTARY WIKI \/\/ TAPE 01/);
  assert.match(markup, /BEST MOMENTS/);
  assert.match(markup, /THE NIGHT IN ONE LINE/);
  assert.match(markup, /THE SHOW, IN HUMAN TERMS/);
  assert.match(markup, /STRAIGHT TO STEVE(?:'|&#39;)S ASSHOLE/);
  assert.match(markup, /WHAT THE TAPE DEFENDED/);
  assert.match(markup, /WILDEST DETOUR/);
    assert.match(markup, /SOURCE-BOUNDED READ/);
  assert.match(markup, /QUICK JUMPS BY SUBJECT/);
  assert.match(markup, /CHARACTER MENTIONS/);
  assert.match(markup, /LOOMIS, CHALLIS & FRIENDS/);
  assert.match(markup, /A NAME MENTION - NOT A CONFIRMED CHARACTER BIT/);
  assert.match(markup, /data-hu-play/);
  assert.match(markup, /data-source-id="6VXSBDZ-3WE"/);
  assert.match(markup, /OPEN FULL OFFICIAL TAPE/);
});

test("held tapes render the original source but no fake highlight card", () => {
  const markup = ui.renderMarkup(model({ filmId: "AzrcgoyE7C4" }));
  assert.match(markup, /WATCH IT NOW \/\/ TIMESTAMPS COMING LATER/);
  assert.match(markup, /needs a careful timestamp pass/i);
  assert.match(markup, /https:\/\/www\.youtube\.com\/watch\?v=AzrcgoyE7C4/);
  assert.doesNotMatch(markup, /data-source-id="AzrcgoyE7C4"/);
});

test("doctor and Steve lanes state their evidence boundaries visibly", () => {
  const doctors = ui.renderMarkup(model({ activeTab: "doctors" }));
  assert.match(doctors, /THE DOCTORS ARE IN/);
  assert.match(doctors, /DR\. LOOMIS \/\/ 27/);
  assert.match(doctors, /DR\. CHALLIS \/\/ 27/);
  assert.match(doctors, /54 playable Loomis and Challis bits/i);
  const steve = ui.renderMarkup(model({ activeTab: "steve" }));
  assert.match(steve, /THE MAYBE-PILE/);
  assert.match(steve, /PLAY THE SURROUNDING MINUTE FIRST/);
  assert.match(steve, /PLAY BEFORE CANON/);
});

test("search markup escapes source text and preserves exact playback data", () => {
  const search = ui.renderMarkup(model({ query: "Loomis" }));
  assert.match(search, /RESULTS FOR &quot;Loomis&quot;/);
  assert.match(search, /data-hu-play/);
  const injected = model();
  injected.films[0].film = '<script data-bad="1">alert(1)</script>';
  const escaped = ui.renderMarkup(injected);
  assert.doesNotMatch(escaped, /<script data-bad/);
  assert.match(escaped, /&lt;script data-bad=&quot;1&quot;&gt;/);
});

test("scoped CSS supplies large desktop cards and a single-column mobile mode", () => {
  const css = fs.readFileSync(new URL("../public/demo/halloween-universe.css", import.meta.url), "utf8");
  assert.match(css, /^\.halloween-universe/m);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /font: 900 clamp\(3\.6rem, 7\.2vw, 8\.7rem\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /\.hu-receipt-actions > \* \{ width: 100%; \}/);
});
