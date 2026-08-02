import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const read = (name) => fs.readFileSync(path.join(demo, name), "utf8");

test("Halloween Universe is a contextual, lazy Watchalongs destination", () => {
  const html = read("index.html");
  const guided = read("guided-shell.js");
  const editorialCss = read("wwam-editorial-v2.css");
  const sectionStart = html.indexOf('<section class="section halloween-universe"');
  const sectionEnd = html.indexOf("</section>", sectionStart);
  const section = html.slice(sectionStart, sectionEnd);
  const hubStart = html.indexOf('<section class="wwam-route-hub" id="watchalongs-hub"');
  const hubEnd = html.indexOf("</section>", hubStart);
  const watchalongsHub = html.slice(hubStart, hubEnd);
  const primaryNav = html.slice(html.indexOf('<nav class="topbar'), html.indexOf("</nav>"));

  assert.ok(sectionStart >= 0);
  assert.ok(hubStart >= 0);
  assert.match(primaryNav, /href="#watchalongs-hub"[^>]*>WATCHALONGS<\/a>/);
  assert.doesNotMatch(primaryNav, /href="#halloween-universe"/);
  assert.match(watchalongsHub, /href="#halloween-universe"[^>]+data-journey-link="watchalongs"/);
  assert.match(section, /aria-labelledby="halloweenUniverseTitle"/);
  assert.match(section, /id="halloweenUniverseMount"/);
  assert.match(section, /data-feature-styles="halloween-universe\.css\?v=1\.1\.2-editorial-read"/);
  assert.match(section, /halloween-universe-ui\.js\?v=1\.1\.5-editorial-read/);

  const dataAt = section.indexOf("halloween-acquired-distill.js");
  const enrichmentAt = section.indexOf("halloween-commentary-enrichment.js");
  const engineAt = section.indexOf("halloween-universe-engine.js");
  const uiAt = section.indexOf("halloween-universe-ui.js");
  assert.ok(dataAt >= 0 && dataAt < enrichmentAt && enrichmentAt < engineAt && engineAt < uiAt);
  assert.match(guided, /"halloween-universe": "watchalongs"/);
  assert.match(guided, /watchalongs: \["#watchalongs-hub", "#halloween-universe", "#comedy-vault", "#watchalong-canon"\]/);
  assert.match(editorialCss, /\.wwam-route-local-nav a\s*\{[\s\S]*?min-height:\s*84px;/);
  assert.match(read("halloween-universe-ui.js"), /focusStage\("\.hu-dossier"\)/);
  assert.match(read("halloween-universe.css"), /\.hu-dossier\s*\{[^}]*scroll-margin-top:\s*92px/);
  assert.doesNotMatch(section, /\b(?:price|pricing|buy|purchase|revenue|sales)\b/i);
});
test("the acquired and enriched Halloween lanes load before the Universe engine", () => {
  const acquired = read("halloween-acquired-distill.js");
  const enrichment = read("halloween-commentary-enrichment.js");
  assert.match(acquired, /WWAM_HALLOWEEN_ACQUIRED/);
  assert.match(acquired, /caption/i);
  assert.match(enrichment, /WWAM_HALLOWEEN_COMMENTARY_ENRICHMENT/);
});
