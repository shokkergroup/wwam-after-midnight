import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const read = (name) => fs.readFileSync(path.join(demo, name), "utf8");

test("Home gives Night Shift one compact nightly return invitation", () => {
  const html = read("index.html");
  const shell = read("guided-shell.js");
  const css = read("wwam-editorial-v2.css");

  assert.match(html, /guided-shell\.js\?v=1\.2\.0-tonights-cut/);
  assert.match(html, /wwam-editorial-v2\.css\?v=1\.2\.0-tonights-cut/);  assert.match(html, /BATMAN\. HELLRAISER\.[\s\S]*LOOMIS NEEDS FUNDING\./);
  assert.match(html, /<li>Batman<\/li><li>Marvel<\/li><li>Hellraiser<\/li><li>Halloween<\/li>/);
  assert.match(html, /OPEN THE JULY 23 SHOW WIKI/);
  assert.match(shell, /function tonightStamp/);
  assert.match(shell, /class="wwam-tonights-cut" href="#night-shift"/);
  assert.match(shell, /FIVE PLAYABLE STOPS\. ONE WEIRD WAY THROUGH WWAM\./);
  assert.match(shell, /tonight&RSQUO;s route stays put until midnight/i);
  assert.match(shell, /START THE NIGHT SHIFT/);
  assert.doesNotMatch(shell, /TONIGHT&RSQUO;S CUT[\s\S]{0,520}(?:evidence|receipt|deterministic|machine)/i);
  assert.match(css, /\.wwam-tonights-cut \{/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.wwam-tonights-cut/);
  assert.match(css, /\.wwam-tonights-cut-action \{ width: 100%; justify-content: space-between; \}/);
});