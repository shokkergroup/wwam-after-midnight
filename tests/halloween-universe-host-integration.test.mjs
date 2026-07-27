import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const read = (name) => fs.readFileSync(path.join(demo, name), "utf8");

test("Halloween Universe has a prominent, lazy, journey-aware host", () => {
  const html = read("index.html");
  const guided = read("guided-shell.js");
  const guidedCss = read("guided-shell.css");
  const sectionStart = html.indexOf('<section class="section halloween-universe"');
  const sectionEnd = html.indexOf("</section>", sectionStart);
  const section = html.slice(sectionStart, sectionEnd);
  const nav = html.slice(html.indexOf('<nav class="topbar'), html.indexOf("</nav>"));

  assert.ok(sectionStart >= 0);
  assert.match(nav, /class="nav-halloween-universe"[^>]+href="#halloween-universe"/);
  assert.ok(nav.indexOf("HALLOWEEN UNIVERSE") < nav.indexOf("NEWEST"));
  assert.match(html, /class="hero-halloween-universe"[^>]+href="#halloween-universe"/);
  assert.match(section, /aria-labelledby="halloweenUniverseTitle"/);
  assert.match(section, /id="halloweenUniverseMount"/);
  assert.match(section, /data-feature-styles="halloween-universe\.css\?v=1\.0\.0"/);

  const dataAt = section.indexOf("halloween-acquired-distill.js");
  const enrichmentAt = section.indexOf("halloween-commentary-enrichment.js");
  const engineAt = section.indexOf("halloween-universe-engine.js");
  const uiAt = section.indexOf("halloween-universe-ui.js");
  assert.ok(dataAt >= 0 && dataAt < enrichmentAt && enrichmentAt < engineAt && engineAt < uiAt);
  assert.match(guided, /"halloween-universe": "watchalongs"/);
  assert.match(guided, /watchalongs: \["#halloween-universe", "#comedy-vault", "#franchises", "#autopsies"\]/);
  assert.match(guidedCss, /nav-halloween-universe/);
  assert.match(guidedCss, /min-height:42px/);
  assert.doesNotMatch(section, /\b(?:price|pricing|buy|purchase|revenue|sales)\b/i);
});

test("the acquired and enriched Halloween lanes load before the Universe engine", () => {
  const acquired = read("halloween-acquired-distill.js");
  const enrichment = read("halloween-commentary-enrichment.js");
  assert.match(acquired, /WWAM_HALLOWEEN_ACQUIRED/);
  assert.match(acquired, /caption/i);
  assert.match(enrichment, /WWAM_HALLOWEEN_COMMENTARY_ENRICHMENT/);
});
