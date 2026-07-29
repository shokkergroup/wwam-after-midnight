import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const app = fs.readFileSync(
  path.join(root, "public", "demo", "app.js"),
  "utf8",
);

test("the Show Wiki runtime warms only after the content gate is cleared", () => {
  assert.match(
    app,
    /function warmSourceDossierAfterGate\(\)[\s\S]*?readSourceRoute\(\)\) return;/,
  );
  assert.match(
    app,
    /openInitialRoute\(\);\s*warmSourceDossierAfterGate\(\);/,
    "a first-time visitor should begin the warmup after choosing a language mode",
  );
  assert.match(
    app,
    /if \(storageGet\("wwam-band"\)\) warmSourceDossierAfterGate\(\);/,
    "returning visitors should receive the same idle warmup",
  );
});

test("idle warmup reuses the normal fail-closed dossier loader", () => {
  assert.match(
    app,
    /scheduleIdle\(function \(\) \{\s*loadSourceDossier\(\)\.catch\(function \(\) \{\s*sourceDossierWarmupScheduled = false;/,
  );
  assert.doesNotMatch(
    app,
    /warmSourceDossierAfterGate[\s\S]{0,500}(?:buildSourceDossierRuntime|WWAMSourceDossierAdapter\.build)/,
    "warmup must not create a second dossier implementation",
  );
});
