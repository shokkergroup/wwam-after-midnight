import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const scriptPath = path.join(projectRoot, "public", "demo", "wwam-night-guide.js");
const cssPath = path.join(projectRoot, "public", "demo", "wwam-night-guide.css");
const indexPath = path.join(projectRoot, "public", "demo", "index.html");
const demoStylesPath = path.join(projectRoot, "public", "demo", "styles.css");
const dossierPath = path.join(projectRoot, "public", "demo", "source-dossier-ui.js");

const source = fs.readFileSync(scriptPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const index = fs.readFileSync(indexPath, "utf8");
const demoStyles = fs.readFileSync(demoStylesPath, "utf8");
const dossierSource = fs.readFileSync(dossierPath, "utf8");
const context = { console };
context.globalThis = context;
vm.runInNewContext(source, context, { filename: scriptPath });
const guide = context.WWAMNightGuide;

assert.ok(guide, "Mobile navigation should publish a browser API.");
assert.equal(guide.VERSION, "3.0.2");
assert.match(source, /data-wwam-night-guide-runtime/, "Browser runtime should leave a DOM-ready marker for release QA.");
assert.equal(guide.MEDIA_QUERY, "(max-width: 760px)");
assert.deepEqual(
  Array.from(guide.ROUTES, (route) => ({ label: route.label, href: route.href })),
  [
    { label: "Shows", href: "#shows-hub" },
    { label: "Watchalongs", href: "#watchalongs-hub" },
    { label: "Best Bits", href: "#best-bits" },
    { label: "Characters", href: "#characters-hub" },
    { label: "Search", href: "#ask" }
  ]
);

for (const route of guide.ROUTES) {
  assert.ok(index.includes(route.href), route.href + " should be part of the shared site contract.");
}

const markup = guide.renderMarkup();
assert.equal((markup.match(/<a /g) || []).length, 5, "Dock should mirror the five public destinations.");
assert.equal((markup.match(/<button /g) || []).length, 0, "The mobile navigation must not add a competing menu.");
assert.match(markup, /WWAM mobile navigation/);
assert.match(markup, /href="#shows-hub"/);
assert.match(markup, /href="#watchalongs-hub"/);
assert.match(markup, /href="#best-bits"/);
assert.match(markup, /href="#characters-hub"/);
assert.match(markup, /href="#ask"/);
assert.doesNotMatch(markup, /All Rooms|role="dialog"|directory-layer/i);

assert.match(source, /HASH_GROUPS/, "Detail hashes should keep the correct destination active.");
assert.match(source, /updateActive\(state\.activeHash, documentRef\.body\.dataset\.guidedJourney \|\| ""\)/, "Direct commentary links should inherit the desktop route classification on mount.");
assert.match(index, /wwam-night-guide\.js\?v=3\.0\.2/, "The corrected mobile route state should not be served from an older cache key.");
assert.match(source, /"#tape-keeps-score": "characters"/, "Memory deep links should stay inside Characters.");
assert.match(source, /addEventListener\("wwam:journey-change", handleJourneyChange\)/, "Push-state routes should synchronize the dock.");
assert.doesNotMatch(source, /delegateRoomsControl|syncRoomsState/, "Removed room compatibility should not linger.");
assert.match(source, /matchMedia/, "Mounting should respond to the mobile breakpoint.");
assert.match(source, /aria-current/, "Direct links should expose current state.");
assert.doesNotMatch(source, /guidedMoreButton|guidedMorePanel|renderDirectory|role=.?dialog/i, "The mobile asset must not recreate the old rooms menu.");

assert.match(
  index,
  /id="tapeModal"[\s\S]{0,180}<div class="modal-shell">[\s\S]{0,120}class="modal-close" id="modalClose"/,
  "The close control must remain inside the scrolling modal shell.",
);
assert.match(demoStyles, /\.tape-modal\s*\{[\s\S]{0,220}overflow-y:\s*auto;/);
assert.match(
  dossierSource,
  /sectionTarget\.scrollIntoView\(\{\s*behavior:\s*"auto",\s*block:\s*"start"\s*\}\)/,
  "The deep-link path should still land inside a Show Wiki.",
);

const modalCloseRules = [...demoStyles.matchAll(/(?:^|\n)\s*\.modal-close\s*\{([^}]*)\}/g)]
  .map((match) => match[1]);
assert.ok(modalCloseRules.length >= 2, "Base and phone close-control rules should exist.");
assert.match(modalCloseRules[0], /position:\s*sticky;/);
assert.match(modalCloseRules[0], /top:\s*25px;/);
assert.match(modalCloseRules[0], /float:\s*right;/);
assert.doesNotMatch(modalCloseRules.join("\n"), /position:\s*fixed;/);
assert.match(modalCloseRules.at(-1), /top:\s*10px;/);
assert.match(modalCloseRules.at(-1), /margin-right:\s*10px;/);

assert.match(css, /^\.wwam-night-guide-mobile\s*\{\s*display:\s*none;/s, "Dock should have no desktop presentation.");
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /\.wwam-night-guide-mobile\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?bottom:\s*0;[\s\S]*?display:\s*grid;/);
assert.match(css, /min-height:\s*48px;/, "Every dock action should exceed the 44px touch minimum.");
assert.match(css, /safe-area-inset-bottom/, "Dock should respect phone safe areas.");
assert.match(css, /\[aria-current="page"\]/, "Current state should be visually explicit.");
assert.match(css, /focus-visible/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(source + css, /[^\x00-\x7F]/, "Dock assets should use ASCII text and CSS shapes only.");
assert.doesNotMatch(source + css + markup, /\$\s*\d|pricing|price list/i, "Public dock copy must not expose pricing.");

console.log("WWAM coherent mobile navigation contract verified.");