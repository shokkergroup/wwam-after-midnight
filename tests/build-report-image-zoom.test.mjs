import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const report = readFileSync(resolve(root, "WWAM_24_HOUR_BUILD_REPORT.html"), "utf8");
const styles = readFileSync(resolve(root, "public/wwam-build-report.css"), "utf8");

test("the visual report exposes one native, labelled full-resolution proof dialog", () => {
  assert.match(
    report,
    /<dialog class="report-lightbox" id="reportLightbox" aria-labelledby="reportLightboxTitle" aria-describedby="reportLightboxCaption">/,
  );
  assert.match(report, /id="reportLightboxImage" alt="">/);
  assert.match(report, /id="reportLightboxClose"[^>]+aria-label="Close enlarged proof image"/);
  assert.match(report, /typeof dialog\.showModal!=="function"/);
  assert.match(report, /dialog\.showModal\(\)/);
  assert.match(report, /event\.target===dialog/);
  assert.match(report, /dialog\.addEventListener\("close"/);
});

test("all 23 report graphics become keyboard-operable zoom targets", () => {
  const imageTags = [...report.matchAll(/<img\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => !tag.includes('id="reportLightboxImage"'));

  assert.equal(imageTags.length, 23);
  assert.ok(imageTags.every((tag) => /\balt="[^"]+"/.test(tag)));
  assert.match(report, /querySelectorAll\("img:not\(#reportLightboxImage\)"\)/);
  assert.match(report, /setAttribute\("role","button"\)/);
  assert.match(report, /setAttribute\("tabindex","0"\)/);
  assert.match(report, /setAttribute\("aria-haspopup","dialog"\)/);
  assert.match(report, /event\.key==="Enter"\|\|event\.key===" "/);

  const localSources = imageTags
    .map((tag) => tag.match(/\bsrc="([^"]+)"/)?.[1])
    .filter((source) => source && !/^https?:/.test(source));
  assert.ok(localSources.every((source) => existsSync(resolve(root, source))));
});

test("zoom styling stays large, visible, responsive, and absent from print", () => {
  assert.match(styles, /\.report-zoomable\{cursor:zoom-in/);
  assert.match(styles, /content:"EXPAND PROOF ↗"/);
  assert.match(styles, /\.report-lightbox\{width:min\(96vw,1760px\)/);
  assert.match(styles, /\.report-lightbox::backdrop/);
  assert.match(styles, /@media\(max-width:600px\)[^{]*\{/);
  assert.match(styles, /@media print\{\.report-lightbox\{display:none!important\}/);

  const scripts = [...report.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1]);
  assert.equal(scripts.length, 2);
  for (const script of scripts) {
    assert.doesNotThrow(() => new Function(script));
  }
});
