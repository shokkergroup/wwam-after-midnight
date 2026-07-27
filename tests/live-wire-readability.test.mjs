import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "public", "demo", "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "public", "demo", "styles.css"), "utf8");

function rule(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `${selector} CSS rule is missing`);
  const end = css.indexOf("}", start);
  return css.slice(start, end + 1);
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

test("Live Wire keeps its rolling source map and topic controls intact", () => {
  const match = html.match(/<section class="section livewire" id="livewire">[\s\S]*?<\/section>/);
  assert.ok(match, "#livewire section is missing");
  const section = match[0];
  for (const id of ["liveProof", "topicRadarLabel", "topicRadar", "streamGrid"]) {
    assert.match(section, new RegExp(`id="${id}"`));
  }
  assert.match(section, /THE TEN NEWEST LIVESTREAMS/);
  assert.match(section, /one honest/);
});

test("Live Wire pins readable artwork, copy, controls, and sealed-state truth", () => {
  const livewire = rule(".livewire");
  assert.match(livewire, /--live-micro:\s*11px/);
  assert.match(livewire, /--live-copy:\s*14px/);
  assert.match(livewire, /--live-hit:\s*38px/);
  const width = livewire.match(/width:\s*min\((\d+)px/);
  assert.ok(width && Number(width[1]) >= 1480, "Live Wire should use the desktop canvas");

  assert.match(rule(".stream-grid"), /repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(rule(".stream-grid"), /gap:\s*18px/);
  assert.match(rule(".stream-thumb"), /aspect-ratio:\s*16\/9/);
  const image = rule(".stream-thumb img");
  assert.match(image, /opacity:\s*\.94/);
  assert.match(image, /saturate\(1\.02\)/);
  assert.match(rule(".stream-body > p"), /font-size:\s*var\(--live-copy\)/);
  assert.match(rule(".stream-topics button"), /min-height:\s*var\(--live-hit\)/);
  assert.match(rule(".live-proof span"), /var\(--live-micro\)/);

  assert.match(rule(".stream-card.unmapped"), /opacity:\s*1/);
  assert.match(rule(".stream-card.unmapped"), /filter:\s*none/);
  assert.match(rule(".stream-card.unmapped .stream-thumb img"), /grayscale\(\.25\)/);

  const globalControlFloor = css.indexOf("button,\ninput,\nselect,\ntextarea");
  const liveOverride = css.indexOf(".livewire button { font-size: var(--live-micro) !important; }");
  assert.ok(globalControlFloor >= 0 && liveOverride > globalControlFloor, "Live Wire must override the late global 10px control rule");
});

test("Live Wire becomes one readable column before cards become cramped", () => {
  const laptop = mediaBlock("max-width: 1100px", ".stream-grid");
  assert.match(laptop, /\.stream-grid\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(laptop, /\.stream-body > p\s*\{\s*min-height:\s*0/);

  const tablet = mediaBlock("max-width: 820px", ".topic-radar");
  assert.match(tablet, /\.topic-radar\s*\{\s*grid-template-columns:\s*1fr/);

  const mobile = mediaBlock("max-width: 600px", ".stream-body");
  assert.match(mobile, /\.stream-body\s*\{\s*padding:\s*18px 16px 20px/);
  assert.match(mobile, /\.stream-body > div:first-child, \.stream-body > footer\s*\{[^}]*flex-direction:\s*column/);
  assert.match(html, /href="styles\.css\?v=0\.5\.21-ui5"/);
});
