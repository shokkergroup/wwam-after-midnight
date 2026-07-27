import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const read = (name) => fs.readFileSync(path.join(demo, name), "utf8");

test("the fan-facing shell exposes signature WWAM destinations without a mystery More menu", () => {
  const html = read("index.html");
  const shell = read("guided-shell.js");

  assert.match(html, /wwam-editorial-v2\.css\?v=1\.0\.0-editorial6/);
  assert.match(html, />\s*ALL ROOMS\s*<span/);
  assert.doesNotMatch(html, />MORE\s*<span>\+<\/span>/);
  assert.match(html, /class="wwam-signature-rail"/);
  assert.match(html, /href="#upinya"[^>]*>.*WWAM UP IN YA/s);
  assert.match(html, /href="#steves-asshole"[^>]*>.*STEVE'S ASSHOLE/s);
  assert.match(shell, /"steves-asshole": "highlights"/);
  assert.match(shell, /Escape/);
  assert.match(shell, /wwam-directory-open/);
});

test("the homepage leads with one real tape and moves duplicate onboarding out of view", () => {
  const html = read("index.html");
  const css = read("wwam-editorial-v2.css");

  assert.match(html, /id="wwamHeroTitle">THE WHOLE SHOW\.<br><em>CUT TO THE GOOD PART\.<\/em>/);
  assert.match(html, /id="wwamTonight"/);
  assert.match(html, /\?source=LV2rmwEA0w4&amp;section=wiki#archive/);
  assert.match(html, /class="wwam-pick-your-poison"/);
  assert.match(html, /STRAIGHT TO<br>STEVE'S ASSHOLE/);
  assert.match(html, /class="hero legacy-machine-hero" hidden aria-hidden="true"/);
  assert.match(css, /\.guided-home-head,\s*\n\.guided-door-grid \{ display: none !important; \}/);
});

test("Ask and Character put the action first and avoid nested result scrollers", () => {
  const html = read("index.html");
  const app = read("app.js");
  const shell = read("guided-shell.js");
  const css = read("wwam-editorial-v2.css");
  const search = read("search-engine.js");

  assert.match(html, /SEARCH THE WWAM ARCHIVE/);
  assert.match(html, /ASK IT LIKE<br>A FAN WOULD/);
  assert.match(app, /\.slice\(0, 3\)/);
  assert.match(shell, /askCopy\.insertBefore\(askForm, examples\)/);
  assert.match(shell, /terminal\.insertBefore\(characterForm, portrait\)/);
  assert.match(css, /\.ask-results \{ min-height: 360px; max-height: none; overflow: visible;/);
  assert.match(css, /\.character-receipts \{ max-height: none; overflow: visible; \}/);
  assert.match(app, /<details class="why-details"><summary>WHY THIS MATCH\?<\/summary>/);
  assert.match(app, /<details class="ask-method"><summary>HOW THIS ANSWER WAS CHECKED<\/summary>/);
  assert.match(app, /askMore\.className = "ask-more-results"/);
  assert.match(app, /PLAY THIS PART/);
  assert.match(shell, /HELP IMPROVE THIS ANSWER/);
  assert.match(css, /\.ask-review-disclosure/);
  assert.match(search, /Each upload is counted once\./);
  assert.match(search, /exact subject match/);
});

test("Show Wikis keep three primary actions and disclose the deep lanes", () => {
  const html = read("index.html");
  const dossier = read("wwam-dossier-editorial.js");
  const css = read("wwam-editorial-v2.css");

  assert.match(html, /wwam-dossier-editorial\.js\?v=1\.0\.1/);
  assert.match(dossier, /PLAY THE SHOW/);
  assert.match(dossier, /ASK THIS SHOW/);
  assert.match(dossier, /EXPLORE ALL/);
  assert.match(dossier, /sourceDossierShowWikiLane-best-moments/);
  assert.match(css, /\.source-dossier-explore \{ top: 0 !important;/);
});

test("public fan copy contains no pricing or private Mike-ready language", () => {
  const visible = ["index.html", "guided-shell.js", "wwam-editorial-v2.css", "wwam-night-guide.js", "wwam-night-guide.css"]
    .map(read)
    .join("\n");

  assert.doesNotMatch(visible, /\$\s*\d|pricing|price list|buy now|paid pilot|Mike-ready/i);
});
