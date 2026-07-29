import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const styles = fs.readFileSync(path.join(demo, "styles.css"), "utf8");
const ui = fs.readFileSync(path.join(demo, "archive-atlas-ui.js"), "utf8");

test("Archive Atlas cards privilege readable summaries, artwork, and source doors", () => {
  assert.match(styles, /--atlas-micro:\s*11px;/);
  assert.match(styles, /--atlas-copy:\s*14px;/);
  assert.match(styles, /--atlas-hit:\s*44px;/);
  assert.match(
    styles,
    /\.archive-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(styles, /\.archive-card-media\s*\{[^}]*aspect-ratio:\s*16\/9/);
  assert.match(
    styles,
    /\.archive-card-media img\s*\{[^}]*opacity:\s*\.9;[^}]*saturate\(\.9\)/,
  );
  assert.match(
    styles,
    /\.archive-card-summary\s*\{[^}]*font-size:\s*var\(--atlas-copy\);[^}]*-webkit-line-clamp:\s*4/,
  );
  assert.match(
    styles,
    /\.archive-card footer button,[\s\S]{0,460}width:\s*100%;[\s\S]{0,460}font-size:\s*12px !important;/,
  );
  assert.doesNotMatch(styles, /\.archive-atlas\s+:where\(span, small, i\)/);
});

test("registered Archive Deep summaries are gated without title inference", () => {
  const summaryFunction = ui.match(
    /function sourceSummary\(item\)\s*\{[\s\S]*?\n    \}/,
  )?.[0] || "";

  assert.match(summaryFunction, /item\.coverage !== "deeply-indexed"/);
  assert.match(summaryFunction, /archiveDeepEngine\.getStream\(item\.id\)/);
  assert.match(summaryFunction, /input\.getSourceSummary\(item\.id\)/);
  assert.doesNotMatch(summaryFunction, /record\.title|whyItMatters/);
  assert.match(summaryFunction, /hit\.editorial && hit\.editorial\.showShape/);
  assert.match(ui, /class="archive-card-summary"/);
  assert.match(ui, /class="archive-batch-door">OPEN SHOW WIKI &rarr;/);
});

test("the app wires each registered distill lane into the Archive summary resolver", () => {
  const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
  const createArchive = app.slice(
    app.indexOf("function createArchiveAtlas"),
    app.indexOf("function createArchiveDeep"),
  );

  assert.match(createArchive, /getSourceSummary:\s*function \(id\)/);
  assert.match(createArchive, /streamById\[id\]/);
  assert.match(createArchive, /source\.summary/);
  assert.match(createArchive, /source\.editorial\.whyItMatters/);
  assert.match(createArchive, /tapeById\[id\]/);
  assert.match(createArchive, /tape\.verdict/);
});

test("Archive portfolio and queue downshift before their content becomes miniature", () => {
  assert.match(
    styles,
    /\.archive-batch-strip\s*\{[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    styles,
    /#archiveQueue\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 1180px\)[\s\S]{0,1100}\.archive-batch-strip\s*\{[^}]*repeat\(3,[^}]*\}[\s\S]{0,160}#archiveQueue\s*\{[^}]*repeat\(2,/,
  );
  assert.match(
    styles,
    /@media \(max-width: 1020px\)[\s\S]{0,500}\.archive-workbench\s*\{\s*grid-template-columns:\s*1fr;[^}]*\}[\s\S]{0,180}\.archive-controls\s*\{\s*position:\s*static;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 820px\)[\s\S]{0,1200}\.archive-batch-strip\s*\{[^}]*repeat\(2,/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]{0,1500}\.archive-grid, #archiveQueue\s*\{\s*grid-template-columns:\s*1fr;[^}]*\}[\s\S]{0,180}\.archive-batch-strip\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.match(
    styles,
    /@media \(max-width: 600px\)[\s\S]{0,900}\.archive-proof b\s*\{[^}]*overflow-wrap:\s*normal;[^}]*font-size:\s*clamp\(30px, 9vw, 34px\)/,
  );
});
