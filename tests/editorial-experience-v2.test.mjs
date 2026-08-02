import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.join(here, "..");
const demo = path.join(here, "..", "public", "demo");
const read = (name) => fs.readFileSync(path.join(demo, name), "utf8");

test("the fan-facing shell exposes five plain destinations and no competing rooms menu", () => {
  const html = read("index.html");
  const shell = read("guided-shell.js");
  const css = read("wwam-editorial-v2.css");

  assert.match(html, /wwam-editorial-v2\.css\?v=1\.2\.7-snap-safe/);
  assert.match(html, /href="#shows-hub"[^>]*>SHOWS<\/a>/);
  assert.match(html, /href="#watchalongs-hub"[^>]*>WATCHALONGS<\/a>/);
  assert.match(html, /href="#best-bits"[^>]*>BEST BITS<\/a>/);
  assert.match(html, /href="#characters-hub"[^>]*>CHARACTERS<\/a>/);
  assert.match(html, /href="#ask"[^>]*>SEARCH<\/a>/);
  assert.doesNotMatch(html, /ALL ROOMS|wwam-signature-rail|guidedMoreButton|guidedMorePanel/);
  assert.match(css, /--wwam-content-max:\s*1440px/);
  assert.match(css, /--wwam-header-max:\s*1540px/);
  assert.match(css, /\/\* WWAM coherent shell v3 \*\//);
  assert.match(css, /\.evidence-bag-toggle\[aria-label\*="0 clips"\]/);
  assert.match(html, />SAVE CLIP LIST<\/button>/);
  assert.match(shell, /"steves-asshole": "highlights"/);
  assert.match(shell, /__wwamRoutePinTimer/);
  assert.match(shell, /__wwamReleaseRoutePin/);
  assert.match(shell, /pointerdown/);
  assert.match(shell, /keydown/);
  assert.match(shell, /5000/);
  assert.doesNotMatch(shell, /12000/);
  assert.match(shell, /window\.scrollTo\(\{/);
  assert.match(shell, /setJourney\(journeyFromLocation\(\), initialTarget, \{ behavior: "auto" \}\)/);
  assert.match(shell, /root\.style\.scrollBehavior = "auto"/);
});

test("destination hubs expose local navigation while detail routes show one focused section", () => {
  const shell = read("guided-shell.js");
  const css = read("wwam-editorial-v2.css");

  assert.match(shell, /id: "shows-hub"/);
  assert.match(shell, /id: "watchalongs-hub"/);
  assert.match(shell, /id: "best-bits"/);
  assert.match(shell, /id: "characters-hub"/);
  assert.match(shell, /var primaryViewSelectors/);
  assert.match(shell, /function sectionsForView/);
  assert.match(shell, /var isMatchingDetail/);
  assert.match(shell, /else allowed\.add\(targetSection\)/);
  assert.match(shell, /document\.body\.dataset\.guidedDetail/);
  assert.match(css, /\.wwam-route-local-nav/);
  assert.match(css, /body\[data-guided-detail="true"\] \.wwam-route-hub/);
  assert.match(css, /repeat\(auto-fit, minmax\(180px, 1fr\)\)/);
  assert.match(shell, /WWAM UP IN YA/);
  assert.match(shell, /STEVE'S ASSHOLE/);
});

test("the homepage leads with one real tape, a working archive search, and four fan jobs", () => {
  const html = read("index.html");
  const shell = read("guided-shell.js");
  const css = read("wwam-editorial-v2.css");

  assert.match(html, /id="wwamHeroTitle">EVERY SHOW\.<br><em>RIGHT TO THE GOOD PART\.<\/em>/);
  assert.match(html, /id="wwamHomeSearch"/);
  assert.match(html, /id="wwamTonight"/);
  assert.match(html, /\?source=LV2rmwEA0w4&amp;section=wiki#archive/);
  assert.match(html, /class="wwam-pick-your-poison"/);
  assert.match(html, /CATCH UP<br>FAST/);
  assert.match(html, /OPEN A<br>WATCHALONG/);
  assert.match(html, /PLAY THE<br>BEST BITS/);
  assert.match(html, /FOLLOW A<br>CHARACTER/);
  assert.match(html, /class="hero legacy-machine-hero" hidden aria-hidden="true"/);
  assert.match(shell, /function wireHomeSearch/);
  assert.match(shell, /askForm\.requestSubmit/);
  assert.match(css, /\.wwam-home-search/);
});

test("franchise doors reveal the focused commentary shelf before opening it", () => {
  const app = read("app.js");
  const helperStart = app.indexOf("function openFranchiseAutopsies(franchise)");
  const helperEnd = app.indexOf("function renderMarquee()", helperStart);
  const helper = app.slice(helperStart, helperEnd);
  const rendererStart = app.indexOf("function renderFranchises()");
  const rendererEnd = app.indexOf("function renderFranchiseFilters()", rendererStart);
  const renderer = app.slice(rendererStart, rendererEnd);

  assert.ok(helperStart >= 0);
  assert.match(helper, /setFranchise\(franchise\)/);
  assert.match(helper, /#autopsies/);
  assert.match(helper, /dispatchEvent\(new Event\("hashchange"\)\)/);
  assert.match(renderer, /openFranchiseAutopsies\(button\.getAttribute\("data-franchise"\)\)/);
  assert.doesNotMatch(renderer, /getElementById\("labs"\)/);
});

test("Showcase Mode has one controller and makes proof destinations visible", () => {
  const app = read("app.js");
  const shell = read("guided-shell.js");

  assert.match(app, /function openTour\(\)/);
  assert.match(app, /function closeTour\(options\)/);
  assert.match(app, /data-tour-proof/);
  assert.match(app, /history\.replaceState[\s\S]{0,180}dispatchEvent\(new Event\("hashchange"\)\)/);
  assert.doesNotMatch(shell, /guidedMike|openGuidedMike|data-guided-tour-proof/);
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
  assert.match(app, /isAnyHandoff \? ' open' : ''/);
  assert.match(app, /class="ask-method"><summary>HOW THIS ANSWER WAS CHECKED<\/summary>/);
  assert.match(app, /askMore\.className = "ask-more-results"/);
  assert.match(app, /PLAY THIS PART/);
  assert.match(shell, /REPORT A WRONG ANSWER/);
  assert.match(shell, /disclosure\.hidden = !hasAnswer/);
  assert.match(css, /\.ask-review-disclosure/);
  assert.match(search, /Each upload is counted once\./);
  assert.match(search, /exact subject match/);
});

test("Show Wikis keep primary fan actions and leave every populated lane visible", () => {
  const html = read("index.html");
  const dossier = read("wwam-dossier-editorial.js");
  const dossierAssets = read("source-dossier-assets.js");
  const css = read("wwam-editorial-v2.css");

  assert.doesNotMatch(html, /wwam-dossier-editorial\.js/);
  assert.match(
    dossierAssets,
    /wwam-dossier-editorial\.js\?v=1\.3\.2-damage-priority/,
  );
  assert.match(dossier, /PLAY THE SHOW/);
  assert.match(dossier, /sourceDossierEpisodeGuide/);
  assert.match(dossier, /DEEP DIVE/);
  assert.match(dossier, /ASK THIS SHOW/);
  assert.match(dossier, /href === "#sourceDossierShowWikiSummary"/);
  assert.doesNotMatch(dossier, /QUICK RECAP/);
  assert.doesNotMatch(dossier, /!hasDeepDive/);
  assert.match(dossier, /wwam-dossier-secondary-link/);
  assert.match(dossier, /function shortcutRank/);
  assert.match(dossier, /host\.appendChild\(entry\.link\)/);
  assert.doesNotMatch(dossier, /createElement\("details"\)/);
  assert.doesNotMatch(dossier, /EXPLORE ALL/);
  assert.match(dossier, /#sourceDossierFanRead/);
  assert.match(dossier, /link.textContent = "FAN READ"/);
  assert.match(dossier, /editorialSignature/);
  assert.match(dossier, /scope\.closest/);
  assert.match(dossier, /sourceDossierShowWikiLane-best-moments/);
  assert.match(css, /\.source-dossier-explore \{ top: 0 !important;/);
});

test("public repository copy contains no pricing, sales, or personalized demo language", () => {
  const visible = ["index.html", "guided-shell.js", "wwam-editorial-v2.css", "wwam-night-guide.js", "wwam-night-guide.css"]
    .map(read)
    .join("\n");
  const publicRepositoryCopy = [
    fs.readFileSync(path.join(project, "PUBLISHING.md"), "utf8"),
    fs.readFileSync(path.join(project, "README.md"), "utf8"),
    ...fs.readdirSync(path.join(project, "docs"))
      .filter((name) => name.endsWith(".md"))
      .map((name) => fs.readFileSync(path.join(project, "docs", name), "utf8")),
  ].join("\n");
  const visiblePrivateLanguage =
    /\$\s*\d|\bpricing\b|\bprice list\b|\bbuy now\b|\bpaid pilot\b|\bbuyers?\b|\bsales(?:\s+proof|\/demo|\s+close)?\b|\bprivate screening room\b|\bMike[- ]facing\b|\bMike(?:'s)? public demo\b|\bMike demonstration path\b|\bV5\.\d+\s+Mike path\b|\bMike's V5\.\d+[^.\n]*proof\b|\bMike-ready\b|\bMike Mode\b/i;
  const repositoryPrivateLanguage =
    /\$\s*\d|\bpricing\b|\bprice list\b|\bbuy now\b|\bpaid pilot\b|\bbuyers?\b|\bsales(?:\s+proof|\/demo|\s+close)?\b|\bpitch(?:es|ed|ing)?\b|\bprivate screening room\b|\bMike[- ]facing\b|\bMike(?:'s)? public demo\b|\bMike demonstration path\b|\bV5\.\d+\s+Mike path\b|\bMike's V5\.\d+[^.\n]*proof\b|\bMike-ready\b|\bMike Mode\b/i;

  assert.doesNotMatch(visible, visiblePrivateLanguage);
  assert.doesNotMatch(publicRepositoryCopy, repositoryPrivateLanguage);
});

test("internal studio surfaces remain available to engines but outside public navigation", () => {
  const html = read("index.html");
  const shell = read("guided-shell.js");

  assert.doesNotMatch(html, /data-journey-link="studio"/);
  assert.doesNotMatch(html, /data-journey-link="all"/);
  assert.match(shell, /studio:\s*\["#fresh-intake"/);
  assert.match(shell, /"#proof", "\.scope-strip", "\.legacy-machine-hero"/);
  assert.doesNotMatch(shell, /machinery is still here|film ledger|evidence-bounded/i);
});
