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

const source = fs.readFileSync(scriptPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const index = fs.readFileSync(indexPath, "utf8");
const context = { console };
context.globalThis = context;
vm.runInNewContext(source, context, { filename: scriptPath });
const guide = context.WWAMNightGuide;

assert.ok(guide, "Mobile dock should publish a browser API.");
assert.equal(guide.VERSION, "2.0.0");
assert.match(source, /data-wwam-night-guide-runtime/, "Browser runtime should leave a DOM-ready marker for release QA.");
assert.equal(guide.MEDIA_QUERY, "(max-width: 760px)");
assert.deepEqual(
  Array.from(guide.ROUTES, (route) => ({ label: route.label, href: route.href })),
  [
    { label: "Shows", href: "#livewire" },
    { label: "Ask", href: "#ask" },
    { label: "Up In Ya", href: "#upinya" },
    { label: "Steve", href: "#steves-asshole" }
  ]
);

for (const route of guide.ROUTES) {
  assert.ok(index.includes(route.href), `${route.href} should already be part of the shared site contract.`);
}

const markup = guide.renderMarkup();
assert.equal((markup.match(/<a /g) || []).length, 4, "Dock should contain four direct links.");
assert.equal((markup.match(/<button /g) || []).length, 1, "Dock should contain one All Rooms button.");
assert.match(markup, /WWAM mobile shortcuts/);
assert.match(markup, /href="#livewire"/);
assert.match(markup, /href="#ask"/);
assert.match(markup, /href="#upinya"/);
assert.match(markup, /href="#steves-asshole"/);
assert.match(markup, />All Rooms</);
assert.match(markup, /aria-expanded="false"/);
assert.doesNotMatch(markup, /role="dialog"|directory-layer|wwam-night-guide__primary/i, "Dock must not duplicate the existing header or rooms dialog.");

assert.match(source, /getElementById\("guidedMoreButton"\)/, "All Rooms must target the existing All Rooms control.");
assert.match(source, /control\.click\(\)/, "The dock should delegate opening to the existing control.");
assert.match(source, /matchMedia/, "Mounting should respond to the mobile breakpoint.");
assert.match(source, /aria-current/, "Direct links should expose current state.");
assert.doesNotMatch(source, /guided-topbar|guidedMorePanel|renderDirectory|role=.?dialog/i, "The mobile asset must not replace or duplicate desktop navigation.");

assert.match(css, /^\.wwam-night-guide-mobile\s*\{\s*display:\s*none;/s, "Dock should have no desktop presentation.");
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /\.wwam-night-guide-mobile\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?bottom:\s*0;[\s\S]*?display:\s*grid;/);
assert.match(css, /min-height:\s*48px;/, "Every dock action should exceed the 44px touch minimum.");
assert.match(css, /safe-area-inset-bottom/, "Dock should respect phone safe areas.");
assert.match(css, /\[aria-current="page"\]/, "Current state should be visually explicit.");
assert.match(css, /focus-visible/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(css, /guided-topbar|guided-more-panel|wwam-site-header/, "Dock CSS must not restyle shared desktop navigation.");
assert.doesNotMatch(source + css, /[^\x00-\x7F]/, "Dock assets should use ASCII text and CSS shapes only.");
assert.doesNotMatch(source + css + markup, /\$\s*\d|pricing|price list/i, "Public dock copy must not expose pricing.");

console.log("WWAM mobile Night Guide dock contract verified.");