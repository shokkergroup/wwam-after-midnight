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
const guidedShellPath = path.join(projectRoot, "public", "demo", "guided-shell.js");
const demoStylesPath = path.join(projectRoot, "public", "demo", "styles.css");
const dossierPath = path.join(projectRoot, "public", "demo", "source-dossier-ui.js");

const source = fs.readFileSync(scriptPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const index = fs.readFileSync(indexPath, "utf8");
const guidedShellSource = fs.readFileSync(guidedShellPath, "utf8");
const demoStyles = fs.readFileSync(demoStylesPath, "utf8");
const dossierSource = fs.readFileSync(dossierPath, "utf8");
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

assert.equal(typeof guide.delegateRoomsControl, "function", "All Rooms delegation should be independently testable.");
assert.match(
  guidedShellSource,
  /panel\.classList\.contains\("is-open"\)[\s\S]{0,180}!event\.target\.closest\("#guidedMorePanel"\)[\s\S]{0,120}!event\.target\.closest\("#guidedMoreButton"\)[\s\S]{0,40}closeMore\(\)/,
  "The regression must stay coupled to the shared shell outside-click behavior.",
);

let roomsPanelOpen = false;
let documentCloseCount = 0;
const roomsEvent = {
  defaultPrevented: false,
  propagationStopped: false,
  preventDefault() {
    this.defaultPrevented = true;
  },
  stopPropagation() {
    this.propagationStopped = true;
  },
};
const sharedHeaderControl = {
  click() {
    roomsPanelOpen = true;
  },
};

assert.equal(guide.delegateRoomsControl(roomsEvent, sharedHeaderControl), true);
// This models guided-shell.js's document listener: the dock trigger is outside
// the header button and panel, so the delegated event must never reach it.
if (!roomsEvent.propagationStopped && roomsPanelOpen) {
  documentCloseCount += 1;
  roomsPanelOpen = false;
}
assert.equal(roomsEvent.defaultPrevented, true);
assert.equal(roomsEvent.propagationStopped, true);
assert.equal(documentCloseCount, 0);
assert.equal(roomsPanelOpen, true, "All Rooms must stay open after the dock handoff.");

assert.match(
  index,
  /id="tapeModal"[\s\S]{0,180}<div class="modal-shell">[\s\S]{0,120}class="modal-close" id="modalClose"/,
  "The close control must remain inside the scrolling modal shell.",
);
assert.match(demoStyles, /\.tape-modal\s*\{[\s\S]{0,220}overflow-y:\s*auto;/);
assert.match(
  dossierSource,
  /sectionTarget\.scrollIntoView\(\{\s*behavior:\s*"auto",\s*block:\s*"start"\s*\}\)/,
  "The modal regression must cover the deep-link path that scrolls to a Show Wiki section.",
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
assert.doesNotMatch(css, /guided-topbar|guided-more-panel|wwam-site-header/, "Dock CSS must not restyle shared desktop navigation.");
assert.doesNotMatch(source + css, /[^\x00-\x7F]/, "Dock assets should use ASCII text and CSS shapes only.");
assert.doesNotMatch(source + css + markup, /\$\s*\d|pricing|price list/i, "Public dock copy must not expose pricing.");

console.log("WWAM mobile Night Guide dock contract verified.");