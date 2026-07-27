import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(projectRoot, ...relativePath.split("/")), "utf8");

const app = read("public/demo/app.js");
const guidedShell = read("public/demo/guided-shell.js");
const styles = read("public/demo/styles.css");
const editorial = read("public/demo/wwam-editorial-v2.css");
const nightGuide = read("public/demo/wwam-night-guide.js");
const nightGuideCss = read("public/demo/wwam-night-guide.css");

assert.match(
  guidedShell,
  /dispatchEvent\(new CustomEvent\("wwam:journey-change"/,
  "Every route change should publish one shared journey state.",
);
assert.doesNotMatch(
  guidedShell,
  /guidedMoreButton|guidedMorePanel|closeMore/,
  "The removed rooms overlay must not leave dead shell wiring behind.",
);
assert.match(
  nightGuide,
  /addEventListener\("wwam:journey-change", handleJourneyChange\)/,
  "The mobile dock should follow route changes made with history.pushState.",
);

assert.match(
  app,
  /!element\.closest\('\[hidden\],\[aria-hidden="true"\],\[inert\]'\)/,
  "The dialog focus loop must ignore controls inside hidden or inert ancestors.",
);
assert.match(
  app,
  /element\.getClientRects\(\)\.length > 0/,
  "The dialog focus loop must ignore controls with no rendered box.",
);

assert.match(
  styles,
  /\.modal-close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/,
  "The persistent Show Wiki close control must meet the 44px mobile target.",
);
assert.match(
  styles,
  /\.evidence-bag > header button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/,
  "The Saved Clips close control must meet the 44px mobile target.",
);
assert.match(
  styles,
  /\.evidence-bag-list article button,\s*\.evidence-bag > footer button\s*\{\s*min-height:\s*44px;/,
  "Saved Clips actions must remain thumb-sized.",
);

assert.match(
  nightGuide,
  /label: "Shows"[\s\S]*label: "Watchalongs"[\s\S]*label: "Best Bits"[\s\S]*label: "Characters"[\s\S]*label: "Search"/,
  "The phone dock must mirror the five public destinations.",
);
assert.doesNotMatch(
  nightGuide,
  /All Rooms|guidedMoreButton|guidedMorePanel/,
  "Phones must not reintroduce the removed rooms menu.",
);
assert.match(
  nightGuideCss,
  /\.wwam-night-guide-mobile__item\s*\{[\s\S]*?min-height:\s*48px;/,
  "Every phone destination must own a full-size touch target.",
);
assert.match(
  editorial,
  /\.wwam-route-local-nav a\s*\{[\s\S]*?min-height:\s*84px;/,
  "Contextual destination links must remain comfortably tappable.",
);
assert.match(
  editorial,
  /@media \(max-width: 680px\)[\s\S]*?\.wwam-site-header \.brand\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/,
  "The compact home control must remain a 44px target on phones.",
);
assert.match(
  editorial,
  /@media \(max-width: 680px\)[\s\S]*?\.wwam-editorial-hero\s*\{[^}]*overflow-x:\s*clip;/,
  "The decorative mobile hero watermark must not widen the page.",
);
assert.match(
  editorial,
  /@media \(max-width: 760px\)[\s\S]*?\.wwam-home-search > div\s*\{\s*grid-template-columns:\s*1fr;/,
  "The homepage search must stack cleanly on phones.",
);

console.log("WWAM coherent mobile accessibility contract verified.");