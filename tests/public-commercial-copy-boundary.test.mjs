import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const report = path.join(root, "WWAM_24_HOUR_BUILD_REPORT.html");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const authoredText = [
  ...walk(publicRoot).filter((file) => /\.(?:html?|js|css|json|md|txt|svg)$/i.test(file)),
  report,
];

// These phrases belong to the retired product offer. Ordinary movie-finance facts
// and authentic source language remain allowed because they are archive evidence.
const retiredCommercialCopy = [
  "$500 / 3 SHOWS / 14 DAYS",
  "priceUsd",
  "creator-pilot-offer",
  "THE BUSINESS CASE",
  "MEMORY BUSINESS",
  "START THE 60-SECOND PITCH",
  "MIKE PILOT",
  "PROPOSED FIXED-SCOPE CREATOR PILOT",
  "commercialBoundary",
  "Concrete buyer wedge",
  "Commercial close",
  "buyer journey",
  "MIKE MODE",
];

test("every browser-served authored surface is a creator showcase, not a sales sheet", () => {
  for (const file of authoredText) {
    const source = fs.readFileSync(file, "utf8");
    for (const phrase of retiredCommercialCopy) {
      assert.equal(
        source.toLowerCase().includes(phrase.toLowerCase()),
        false,
        `retired commercial copy "${phrase}" leaked into ${path.relative(root, file)}`,
      );
    }
  }

  assert.equal(
    fs.existsSync(path.join(publicRoot, "wwam-aftermath-v1-pilot.png")),
    false,
    "the obsolete price screenshot must not ship as a public asset",
  );
});

test("the neutral showcase language and workflow boundaries are explicit", () => {
  const html = fs.readFileSync(path.join(publicRoot, "demo", "index.html"), "utf8");
  const tour = fs.readFileSync(path.join(publicRoot, "demo", "pitch-tour-data.js"), "utf8");
  const aftermath = fs.readFileSync(path.join(publicRoot, "demo", "aftermath-pack-engine.js"), "utf8");
  const dossier = fs.readFileSync(path.join(publicRoot, "demo", "source-dossier-ui.js"), "utf8");

  assert.match(html, /SHOWCASE MODE/);
  assert.match(html, /LIVING MEMORY WORLD/);
  assert.match(html, /PARTICIPATION/);
  assert.match(tour, /THREE SHOWS\.<br>ONE REVIEWABLE WORKFLOW/);
  assert.match(aftermath, /shokker\.creator-workflow-showcase\/v1/);
  assert.match(aftermath, /prototypeBoundary/);
  assert.match(dossier, /SOURCE-LOCKED CREATOR WORKFLOW/);
  assert.match(dossier, /THIS SHOW, READY FOR REVIEW/);
});

test("factual movie budgets and box-office context remain intact", () => {
  const atlas = fs.readFileSync(path.join(publicRoot, "demo", "context-atlas.js"), "utf8");
  assert.match(atlas, /"budget": "\$325,000"/);
  assert.match(atlas, /"worldwide": "\$70\.3 million"/);
});
