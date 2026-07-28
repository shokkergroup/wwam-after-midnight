import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const css = fs.readFileSync(path.join(demo, "styles.css"), "utf8");

test("Ask the Character exposes a complete, controllable tape shelf", () => {
  assert.match(html, /id="characterReceiptRotate"/);
  assert.match(html, /id="characterReceiptMore"/);
  assert.match(html, /aria-controls="characterReceipts"/);
  assert.match(html, /THE REAL CLIPS/);
  assert.ok(app.includes("characterEngine.getReceiptLibrary(profile.id)"));
  assert.ok(app.includes("state.characterReceiptLimit = characterReceiptLibrary(profile).length"));
  assert.ok(app.includes("state.characterReceiptOffset = (offset + 1) % total"));
  assert.ok(app.includes('"SEE ALL " + total + " CLIPS"'));
});

test("selected receipts surface first without overstating their relationship to a riff", () => {
  assert.ok(app.includes("state.characterMatchedReceipt = matchedReceiptId"));
  assert.ok(app.includes("renderCharacterReceiptShelf(profile, matchedReceiptId)"));
  assert.ok(app.includes("state.characterContext.receiptMatch.relationship"));
  assert.ok(app.includes("MATCHED TO YOUR QUESTION"));
  assert.ok(app.includes("CHARACTER PATTERN CLIP"));
  assert.ok(app.includes("REAL CLIP FROM THIS CHARACTER'S SHELF"));
  assert.ok(app.includes("PLAY THE REAL SOURCE CLIP"));
  assert.ok(app.includes("OFFICIAL WWAM UPLOAD // AUTO-CAPTIONS CAN MISHEAR"));
  assert.ok(html.includes("FAN-MADE RIFF // REAL CLIPS BELOW"));
  assert.doesNotMatch(app, /MATCHED TO YOUR RIFF|PLAY THE MATCHED CLIP/);
  assert.doesNotMatch(
    `${html}
${app}`,
    /(?:^|[^A-Z])VERIFIED (?:VOICE|SPEAKER)|THE HOST IS SPEAKING IN THIS CLIP/i,
  );
});

test("tape shelf has visible matched, focus, and control states", () => {
  assert.ok(css.includes(".character-receipts article.matched"));
  assert.ok(css.includes(".character-shelf-head button:focus-visible"));
  assert.ok(css.includes(".character-receipts:focus-visible"));
  assert.ok(css.includes(".character-grounding-actions"));
});
test("optional legacy controls cannot abort character interaction binding", () => {
  assert.doesNotMatch(
    app,
    /document\.getElementById\("rouletteButton"\)\.onclick/,
  );
  assert.match(app, /var rouletteButton = optionalElement\("rouletteButton"\)/);
  assert.match(app, /if \(rouletteButton\) rouletteButton\.onclick/);
  assert.match(app, /document\.getElementById\("characterForm"\)\.onsubmit/);
});
