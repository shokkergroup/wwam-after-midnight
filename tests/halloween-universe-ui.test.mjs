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
  assert.match(markup, /THE HADDONFIELD MEMORY WORLD/);
  assert.match(markup, /13 SHOW WIKIS/);
  assert.match(markup, /PLAYABLE PATHS/);
  assert.match(markup, /LOOMIS \+ CHALLIS/);
  assert.match(markup, /UP IN YA/);
  assert.match(markup, /STEVE REVIEW/);
  assert.match(markup, /79-SOURCE CANON/);
  assert.match(markup, /EVIDENCE/);
  assert.match(markup, /13 TAPES\. 12 CAPTION MAPS\. ZERO INVENTED RECEIPTS\./);
  assert.equal((markup.match(/data-hu-film=/g) || []).length, 13);
  assert.doesNotMatch(markup, /<iframe\b/i);
  assert.doesNotMatch(markup, /\b(?:price|pricing|buy|purchase|revenue|sales)\b/i);
});

test("each film expands into a show wiki with playable evidence lanes", () => {
  const markup = ui.renderMarkup(model({ filmId: "6VXSBDZ-3WE" }));
  assert.match(markup, /SHOW WIKI \/\/ TAPE 01/);
  assert.match(markup, /BEST MOMENTS/);
  assert.match(markup, /SCENE & TOPIC DOORS/);
  assert.match(markup, /CHARACTER REFERENCES/);
  assert.match(markup, /REFERENCE FIREWALL ON/);
  assert.match(markup, /CHARACTER REFERENCE ONLY \/\/ A PERFORMANCE IS NOT ESTABLISHED/);
  assert.match(markup, /data-hu-play/);
  assert.match(markup, /data-source-id="6VXSBDZ-3WE"/);
  assert.match(markup, /OPEN FULL OFFICIAL TAPE/);
});

test("held tapes render the original source but no fake highlight card", () => {
  const markup = ui.renderMarkup(model({ filmId: "AzrcgoyE7C4" }));
  assert.match(markup, /SOURCE VISIBLE \/\/ MOMENTS HELD/);
  assert.match(markup, /no defensible caption map/i);
  assert.match(markup, /https:\/\/www\.youtube\.com\/watch\?v=AzrcgoyE7C4/);
  assert.doesNotMatch(markup, /data-source-id="AzrcgoyE7C4"/);
});

test("doctor and Steve lanes state their evidence boundaries visibly", () => {
  const doctors = ui.renderMarkup(model({ activeTab: "doctors" }));
  assert.match(doctors, /30 EXACT 14-SECOND RECEIPTS/);
  assert.match(doctors, /DR\. LOOMIS \/\/ 15/);
  assert.match(doctors, /DR\. CHALLIS \/\/ 15/);
  assert.match(doctors, /clip audio is not speaker-diarized/i);
  const steve = ui.renderMarkup(model({ activeTab: "steve" }));
  assert.match(steve, /NO VERDICTS PROMOTED/);
  assert.match(steve, /CONTEXT REVIEW STILL REQUIRED/);
  assert.match(steve, /REVIEW QUEUE/);
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
