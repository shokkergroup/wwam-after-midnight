import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "public", "demo", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "public", "demo", "styles.css"), "utf8");
const app = fs.readFileSync(path.join(root, "public", "demo", "app.js"), "utf8");

function sectionById(id) {
  const match = html.match(
    new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/section>`, "i"),
  );
  assert.ok(match, `#${id} section is missing`);
  return match[0];
}

function cssRule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} CSS rule is missing`);
  return match[1];
}

function mediaBlock(query, needle) {
  let start = -1;
  while ((start = css.indexOf(`@media (${query})`, start + 1)) >= 0) {
    const next = css.indexOf("@media (", start + 8);
    const block = css.slice(start, next < 0 ? css.length : next);
    if (!needle || block.includes(needle)) return block;
  }
  assert.fail(`${query} media query containing ${needle || "the requested rules"} is missing`);
}

test("Popular 25 exposes labeled controls and a polite live status", () => {
  const section = sectionById("popular25");
  for (const id of ["popularProof", "popularSearch", "popularTopics", "popularGrid"]) {
    assert.match(section, new RegExp(`id=["']${id}["']`));
  }
  assert.match(
    section,
    /id="popularStatus"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
  assert.match(section, /<label>[^<]*<span>[^<]+<\/span><input id="popularSearch"/);
  assert.match(section, /id="popularTopics"[^>]*aria-label="Filter popular livestreams by topic"/);
  assert.match(section, /The shows fans watched most/);
  assert.doesNotMatch(section, /comedy topography|indexed livestream|foundational live archive/i);
});

test("Popular 25 pins a readable desktop floor and preserves full thumbnail art", () => {
  const vault = cssRule(".popular-vault");
  assert.match(vault, /--popular-micro:\s*11px/);
  assert.match(vault, /--popular-copy:\s*14px/);
  assert.match(vault, /--popular-hit:\s*38px/);
  const width = vault.match(/width:\s*min\((\d+)px/);
  assert.ok(width && Number(width[1]) >= 1500, "Popular vault should use more of a desktop viewport");

  assert.match(cssRule(".popular-image"), /aspect-ratio:\s*16\/9/);
  const image = cssRule(".popular-image img");
  const opacity = image.match(/opacity:\s*([.\d]+)/);
  assert.ok(opacity && Number(opacity[1]) >= 0.86, "Popular artwork should not be heavily dimmed");
  assert.match(image, /saturate\(\.95\)/);
  assert.doesNotMatch(
    cssRule(".popular-card"),
    /content-visibility|contain-intrinsic-size/,
    "Offscreen sizing hints must not force mobile cards wider than their container",
  );

  assert.match(cssRule(".popular-why"), /font-size:\s*var\(--popular-copy\)/);
  assert.match(cssRule(".popular-proof span"), /var\(--popular-micro\)/);
  assert.match(cssRule(".popular-proof"), /repeat\(5,\s*1fr\)/);
  assert.match(cssRule("#popularTopics button"), /min-height:\s*var\(--popular-hit\)/);
  assert.match(cssRule(".popular-topic-row button"), /min-height:\s*var\(--popular-hit\)/);
  assert.match(css, /\.popular-vault button\s*\{[^}]*font-size:\s*var\(--popular-micro\)\s*!important/);
  assert.match(css, /\.popular-controls input\s*\{[^}]*font-size:\s*15px\s*!important/);
});

test("Popular 25 collapses before enlarged cards become cramped", () => {
  const laptop = mediaBlock("max-width: 1100px", ".popular-grid");
  assert.match(laptop, /\.popular-grid\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(laptop, /#popularTopics\s*\{\s*grid-column:\s*1\/-1/);

  const tablet = mediaBlock("max-width: 820px", ".popular-vault .section-head");
  assert.match(tablet, /\.popular-vault \.section-head\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(tablet, /\.popular-vault \.section-head > p\s*\{\s*justify-self:\s*start/);

  const mobile = mediaBlock("max-width: 600px", ".popular-card");
  assert.match(mobile, /\.popular-card\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(mobile, /\.popular-rank\s*\{[^}]*flex-direction:\s*row/);
  assert.match(mobile, /\.popular-rank b, \.popular-rank span\s*\{[^}]*writing-mode:\s*horizontal-tb/);
});
test("Popular 25 explains each show in fan language", () => {
  const start = app.indexOf("  function renderPopularProof() {");
  const end = app.indexOf("  function stageArchiveRecord(recordOrId) {", start);
  assert.ok(start >= 0 && end > start, "Popular 25 render block is missing");
  const renderBlock = app.slice(start, end);
  for (const phrase of [
    "COMBINED VIEWS",
    "SHOW WIKIS",
    "PLAYABLE MOMENTS",
    "WHY THIS SHOW",
    "CHARACTERS THAT COME UP",
    "START WITH THIS MOMENT",
    "OPEN SHOW WIKI",
  ]) {
    assert.match(renderBlock, new RegExp(phrase));
  }
  assert.doesNotMatch(
    renderBlock,
    /WORDS AUDITED|COMEDY RECEIPTS|FULL LIVE MAP|CHARACTER INDEX SIGNALS|PEAK COMEDY|machine-detected|caption map concentrates/i,
  );
  assert.match(renderBlock, /ranks #.*views/s, "the reason should preserve rank and view context");
  assert.match(renderBlock, /Start with .* at /s, "the reason should recommend a natural first moment");
});
