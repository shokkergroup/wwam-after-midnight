import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const main = fs.readFileSync(path.join(demo, "styles.css"), "utf8");
const companion = fs.readFileSync(path.join(demo, "tape-companion.css"), "utf8");
const creator = fs.readFileSync(path.join(demo, "creator-taste.css"), "utf8");

function matchingBrace(source, open) {
  let depth = 0;
  let quote = "";
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return index;
  }
  throw new Error("Unclosed CSS rule");
}

function selectorList(prelude) {
  const selectors = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let index = 0; index < prelude.length; index += 1) {
    const character = prelude[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "(" || character === "[") depth += 1;
    else if (character === ")" || character === "]") depth -= 1;
    else if (character === "," && depth === 0) {
      selectors.push(prelude.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(prelude.slice(start).trim());
  return selectors.filter(Boolean);
}

function rules(source, media = []) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const output = [];
  let cursor = 0;
  while (cursor < css.length) {
    while (/\s/.test(css[cursor] || "")) cursor += 1;
    if (cursor >= css.length) break;
    const open = css.indexOf("{", cursor);
    if (open < 0) break;
    const close = matchingBrace(css, open);
    const prelude = css.slice(cursor, open).trim();
    const body = css.slice(open + 1, close);
    if (prelude.startsWith("@media")) {
      output.push(...rules(body, [...media, prelude.replace(/\s+/g, " ")]));
    } else {
      selectorList(prelude).forEach((selector) => {
        output.push({
          media: media.join(" > "),
          selector: selector.replace(/\s+/g, " "),
          body: body.trim().replace(/\s+/g, " "),
        });
      });
    }
    cursor = close + 1;
  }
  return output;
}

function fingerprint(entries) {
  return crypto.createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}

test("the two V5.5 sections own lazy standalone stylesheets", () => {
  assert.match(
    html,
    /id="companion"[\s\S]{0,180}data-feature-styles="tape-companion\.css"[\s\S]{0,180}data-feature-scripts="archive-atlas-data\.js,red-band-ranking-v2\.js,tape-companion-engine\.js,tape-companion-ui\.js"/,
  );
  assert.match(
    html,
    /id="cut-test"[\s\S]{0,180}data-feature-styles="creator-taste\.css"[\s\S]{0,180}data-feature-scripts="channel-pack-contract\.js,wwam-channel-pack-adapter\.js,creator-taste-engine\.js,creator-taste-ui\.js"/,
  );
  assert.doesNotMatch(html, /<link[^>]+(?:tape-companion|creator-taste)\.css/i);
  assert.doesNotMatch(companion, /@import/i);
  assert.doesNotMatch(creator, /@import/i);
});

test("the eager stylesheet no longer duplicates either feature selector family", () => {
  assert.doesNotMatch(main, /\.tape-companion\b|\.companion-[\w-]+/);
  assert.doesNotMatch(main, /\.cut-test\b|\.cut-(?:round|matchup|candidate|decisions|result|ranking|rank|export|progress|versus|notice)[\w-]*/);
  assert.match(main, /\.feature-retry\s*\{/);
});

test("the split preserves the complete ordered feature rule contracts", () => {
  const companionRules = rules(companion);
  const creatorRules = rules(creator);

  assert.equal(companionRules.length, 99);
  assert.equal(creatorRules.length, 107);
  assert.equal(
    fingerprint(companionRules),
    "4270088e3976e0d92544f731a451232b6c7913ce2c23c75e92182b3e687a0b4b",
  );
  assert.equal(
    fingerprint(creatorRules),
    "b411dbc8a3e45ac33937f4e03ea2d208ac9b6906571a5dc6e60f091467723699",
  );
  assert.equal(companionRules.every(({ selector }) => /companion/i.test(selector)), true);
  assert.equal(creatorRules.every(({ selector }) => /\.cut-(?:test\b|[a-z])/i.test(selector)), true);
  assert.equal(companionRules.some(({ media }) => media.includes("1180px")), true);
  assert.equal(companionRules.some(({ media }) => media.includes("600px")), true);
  assert.equal(creatorRules.some(({ media }) => media.includes("1180px")), true);
  assert.equal(creatorRules.some(({ media }) => media.includes("600px")), true);
});

test("neither extracted stylesheet is part of the first-load transfer", () => {
  const scripts = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)]
    .map((match) => match[1]);
  const stylesheets = [...html.matchAll(/<link[^>]*\bhref="([^"]+\.css(?:\?[^"]*)?)"/g)]
    .map((match) => match[1])
    .filter((file) => !/^https?:/i.test(file));
  const criticalFiles = [...scripts, ...stylesheets];
  const total = criticalFiles.reduce((sum, file) => {
    return sum + fs.statSync(path.join(demo, file.split("?")[0])).size;
  }, 0);

  assert.equal(criticalFiles.includes("tape-companion.css"), false);
  assert.equal(criticalFiles.includes("creator-taste.css"), false);
  // The 60-tape character shelf is deliberately eager because Ask the Character
  // and its playable evidence roster are first-class landing-page experiences.
  // Preserve the lazy feature split while keeping a tight post-expansion ceiling.
  assert.ok(total < 1_710_000, `first-load source payload grew to ${total} bytes`);
});

test("the current four-batch portfolio proof keeps dense metadata readable", () => {
  assert.match(main, /\.archive-batch-fingerprints\s*\{[\s\S]{0,360}overflow-wrap:\s*anywhere;/);
  assert.match(main, /\.archive-batch-strip button small\s*\{[\s\S]{0,240}overflow-wrap:\s*anywhere;/);
  assert.match(main, /--atlas-micro:\s*11px;/);
  assert.match(main, /\.archive-batch-strip button small\s*\{[\s\S]{0,260}font:\s*700 var\(--atlas-micro\)\/1\.5 var\(--mono\);/);
  assert.match(main, /\.archive-batch-strip button small\s*\{[\s\S]{0,300}font-size:\s*var\(--atlas-micro\) !important;/);
  assert.doesNotMatch(main, /\.archive-batch-strip button small\s*\{[\s\S]{0,260}font:\s*700 8px/);
  assert.match(main, /\.archive-batch-door\s*\{[\s\S]{0,260}OPEN SOURCE DOSSIER|\.archive-batch-door\s*\{/);
});
