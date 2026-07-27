import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const appPath = path.join(demo, "app.js");
const app = fs.readFileSync(appPath, "utf8");

function sliceBetween(start, end) {
  const from = app.indexOf(`  function ${start}`);
  const to = app.indexOf(`  function ${end}`, from);
  assert.ok(from >= 0 && to > from, `could not isolate ${start}…${end}`);
  return app.slice(from, to);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("character UI calls receipts candidates and source context, never voiceproof", () => {
  const surface = `${html}\n${app}`;
  assert.match(html, /THE PATTERN DOSSIER/);
  assert.match(app, /PATTERN RECEIPT 0/);
  assert.match(app, /PLAY MATCHED SOURCE CANDIDATE/);
  assert.match(app, /CHARACTER ARCHAEOLOGY \/\/ PERFORMANCE CANDIDATE/);
  assert.match(app, /ORIGINAL SOURCE CONTEXT/);
  assert.doesNotMatch(
    surface,
    /THE VOICEPRINT|SOURCE PERFORMANCES WILL APPEAR HERE|HEAR (?:THE MATCHED )?REAL BIT|SOURCE PERFORMANCE|THE ORIGINAL PERFORMANCE/,
  );
});

test("Evidence Bag click transport and both exports retain the trust boundary", () => {
  assert.match(app, /item\.speakerStatus \|\| "SPEAKER NOT PROVIDED"/);
  assert.match(app, /item\.authenticatedEditorVerified \? "EDITOR AUTH" : "NO EDITOR AUTH"/);
  assert.match(app, /EVIDENCE MANIFEST COPIED/);
  assert.match(app, /EVIDENCE MANIFEST DOWNLOADED/);
  const bagContext = {
    itemById: {},
    boundedExcerpt: (value) => String(value || ""),
    esc: (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]),
  };
  vm.createContext(bagContext);
  vm.runInContext(
    `${sliceBetween("inferEvidenceLevel", "saveEvidenceBag")}
     this.api = { bagButton, readBagButton };`,
    bagContext,
  );

  const expected = {
    source: "livestream",
    id: "abcdefghijk",
    at: 42,
    title: 'A "candidate" source',
    category: "CHARACTER PERFORMANCE CANDIDATE",
    excerpt: "Timestamped candidate context.",
    evidenceLevel: "curated-candidate",
    evidenceType: "caption-character-performance",
    receiptKind: "candidate-performance",
    type: "character-performance",
    kind: "character-performance",
    speakerStatus: "not-diarized",
    authenticatedEditorVerified: false,
    warnings: ["Context is required."],
    evidenceWarnings: ["Not an authenticated editor decision."],
  };
  const markup = bagContext.api.bagButton(expected, "BAG CANDIDATE");
  const encoded = markup.match(/data-bag-item="([^"]+)"/)?.[1];
  assert.ok(encoded);
  const payload = encoded
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
  const restored = plain(bagContext.api.readBagButton({
    getAttribute(name) {
      return name === "data-bag-item" ? payload : null;
    },
  }));

  for (const field of [
    "evidenceLevel",
    "evidenceType",
    "receiptKind",
    "type",
    "kind",
    "speakerStatus",
    "authenticatedEditorVerified",
    "warnings",
    "evidenceWarnings",
  ]) {
    assert.deepEqual(restored[field], expected[field], field);
  }

  let copied = "";
  const exportContext = {
    state: { evidenceBag: [restored] },
    boundedExcerpt: (value) => value,
    timestamp: () => "0:42",
    copy: (value) => { copied = value; },
  };
  vm.createContext(exportContext);
  vm.runInContext(
    `${sliceBetween("evidenceManifest", "downloadEvidenceManifest")}
     this.api = { evidenceManifest, copyEvidenceManifest };`,
    exportContext,
  );
  const manifest = plain(exportContext.api.evidenceManifest());
  const clip = manifest.clips[0];

  assert.equal(manifest.schemaVersion, 3);
  assert.match(manifest.disclaimer, /verify captions/i);
  for (const field of [
    "evidenceLevel",
    "evidenceType",
    "receiptKind",
    "type",
    "speakerStatus",
    "authenticatedEditorVerified",
    "warnings",
    "evidenceWarnings",
  ]) {
    assert.deepEqual(clip[field], expected[field], field);
  }

  exportContext.api.copyEvidenceManifest();
  assert.match(copied, /DISCLAIMER \/\/ .*verify captions/i);
  assert.match(copied, /TIER: curated-candidate/);
  assert.match(copied, /SPEAKER: not-diarized/);
  assert.match(copied, /EDITOR-AUTH: NO/);
});

test("Lore keeps creator context outside the performance claim", () => {
  assert.match(app, /CREATOR CONTEXT \/\/ NOT PERFORMANCE/);
  assert.match(app, /firstItem = first && loreReceiptItem\(loreEngine\.getReceipt\(first\.receiptId\)\)/);
  assert.match(app, /Archive-first uses curated performance candidates only/);
  assert.match(app, /esc\(first\.date\) \+ ' \/\/ NOT TRUE ORIGIN/);
  assert.doesNotMatch(app, /curated performance and creator-context set/i);
  assert.ok(fs.statSync(appPath).size < 270_000);
});
