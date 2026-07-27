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

assert.match(
  guidedShell,
  /addEventListener\("hashchange", function \(\) \{\s*closeMore\(\);/,
  "Route changes must close the All Rooms drawer instead of leaving it over the destination.",
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
  editorial,
  /\.wwam-signature-rail\s*\{[^}]*min-height:\s*44px;/,
  "The horizontally scrolling signature shortcuts must remain tappable.",
);
assert.match(
  editorial,
  /\.wwam-signature-label,\s*\.wwam-signature-rail a\s*\{[^}]*min-height:\s*44px;/,
  "Every signature shortcut must own a full-height tap target.",
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

console.log("WWAM mobile accessibility contract verified.");