import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const publicRoot = path.join(root, "public");
const demoRoot = path.join(publicRoot, "demo");
const html = fs.readFileSync(path.join(demoRoot, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demoRoot, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(demoRoot, "styles.css"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const changelog = fs.readFileSync(path.join(root, "docs", "CHANGELOG.md"), "utf8");

function matches(source, pattern, group = 1) {
  return [...source.matchAll(pattern)].map((match) => match[group]);
}

const idList = matches(html, /\bid="([^"]+)"/g);
const ids = new Set(idList);

test("the release document has one stable target for every hash route", () => {
  assert.equal(idList.length, ids.size, "duplicate HTML IDs make deep links ambiguous");

  const hashTargets = new Set(matches(html, /\bhref="#([^"]+)"/g));
  hashTargets.forEach((target) => {
    assert.equal(ids.has(target), true, `#${target} does not resolve to an element`);
  });
});

test("static accessibility relationships resolve to real controls", () => {
  [
    ...matches(html, /\baria-labelledby="([^"]+)"/g),
    ...matches(html, /\baria-describedby="([^"]+)"/g),
    ...matches(html, /\baria-controls="([^"]+)"/g),
    ...matches(html, /<label[^>]*\bfor="([^"]+)"/g),
  ].forEach((relationship) => {
    relationship.split(/\s+/).filter(Boolean).forEach((target) => {
      assert.equal(ids.has(target), true, `${target} is referenced but does not exist`);
    });
  });

  assert.match(html, /<html lang="en">/);
  assert.match(html, /<main id="top" tabindex="-1">/);
  assert.match(styles, /:focus-visible/);
});

test("every local asset in the release document exists", () => {
  const references = [
    ...matches(html, /<script[^>]*\bsrc="([^"]+)"/g),
    ...matches(html, /<link[^>]*\bhref="([^"]+)"/g),
    ...matches(html, /<meta[^>]*\bcontent="([^"]+)"/g),
  ].filter((reference) => {
    return !/^(?:https?:|data:|#)/i.test(reference) &&
      /\.(?:js|css|png|jpe?g|webp|svg)(?:\?|$)/i.test(reference);
  });

  references.forEach((reference) => {
    const clean = reference.split("?")[0];
    const resolved = clean.startsWith("/") ?
      path.join(publicRoot, clean.slice(1)) :
      path.join(demoRoot, clean);
    assert.equal(fs.existsSync(resolved), true, `${reference} is missing from public output`);
  });

  assert.doesNotMatch(html, /\b(?:file:\/\/|localhost|127\.0\.0\.1)\b/i);
});

test("application element lookups are either static or explicitly dialog-generated", () => {
  const dynamicIds = new Set([
    "contributionExcerpt",
    "contributionForm",
    "contributionKind",
    "contributionSource",
    "contributionTarget",
    "contributionTime",
    "copyContribution",
    "descentMinutes",
    "downloadContribution",
    "humanReviewForm",
    "modalPlayer",
    "nightAnother",
    "nightContinue",
    "nightDate",
    "nightNewCut",
    "nightShare",
    "pilotCopy",
    "pilotDownload",
    "reviewAt",
    "reviewAttestation",
    "reviewCopySession",
    "reviewDownloadQuarantine",
    "reviewDownloadSession",
    "reviewName",
    "reviewNotes",
    "reviewNotice",
    "reviewOrigin",
    "reviewQuery",
    "reviewRole",
    "reviewStatus",
    "reviewWording",
  ]);
  const lookups = new Set(matches(app, /getElementById\("([^"]+)"\)/g));
  const unexplained = [...lookups].filter((id) => !ids.has(id) && !dynamicIds.has(id));
  assert.deepEqual(unexplained, []);

  dynamicIds.forEach((id) => {
    assert.match(app, new RegExp(`id=["']${id}["']`), `${id} is never generated`);
  });
});

test("the first-load static payload stays inside the showcase performance budget", () => {
  const scripts = matches(html, /<script[^>]*\bsrc="([^"]+)"/g);
  const criticalFiles = [...scripts, "styles.css"];
  const sizes = criticalFiles.map((file) => ({
    file,
    bytes: fs.statSync(path.join(demoRoot, file)).size,
  }));
  const totalBytes = sizes.reduce((sum, item) => sum + item.bytes, 0);

  assert.ok(totalBytes < 1_500_000, `first-load source payload grew to ${totalBytes} bytes`);
  sizes.filter((item) => item.file.endsWith(".js")).forEach((item) => {
    assert.ok(item.bytes < 250_000, `${item.file} grew to ${item.bytes} bytes`);
  });
});

test("source byte budgets and generated fingerprints survive Windows checkouts", () => {
  const attributes = fs.readFileSync(path.join(root, ".gitattributes"), "utf8");
  for (const extension of ["css", "html", "js", "json", "md", "mjs", "py"]) {
    assert.match(attributes, new RegExp(`\\*\\.${extension} text eol=lf`));
  }
});

test("release identity, social proof, and documentation stay synchronized", () => {
  assert.match(html, /<title>[^<]*WWAM After Midnight[^<]*<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{80,}">/);
  assert.match(html, /<meta property="og:image" content="\/og-memory-os\.png">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(changelog, new RegExp(`## ${packageJson.version.replace(/\./g, "\\.")}\\b`));
  assert.match(changelog, /74 unique sources/);
  assert.match(changelog, /872 bounded editorial receipts/);
  assert.match(changelog, /0 creator-certified receipts/);
  assert.doesNotMatch(html, /Any question becomes a timestamp/i);
  assert.doesNotMatch(html, /the show they aired today/i);
});
