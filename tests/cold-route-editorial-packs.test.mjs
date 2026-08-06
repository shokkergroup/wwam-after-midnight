import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd());
const html = fs.readFileSync(path.join(root, "public/demo/index.html"), "utf8");
const assets = fs.readFileSync(path.join(root, "public/demo/source-dossier-assets.js"), "utf8");

test("cold Show Wiki routes preload the latest human editorial packs", () => {
  for (const wave of [22, 23, 24, 25, 26, 27, 28, 29, 30, 31]) {
    assert.match(html, new RegExp(`episode-editorial-packs-wave${wave}\\.js`));
    assert.match(assets, new RegExp(`episode-editorial-packs-wave${wave}\\.js`));
  }
});

test("latest 2026 human packs retain their exact source bindings", () => {
  const expected = {
    22: "tUJviU09fWM",
    23: "LV2rmwEA0w4",
    24: "iz0WFhe6LYM",
    25: "ag3axSC9BpU",
    26: "x6tvsGRHgU0",
    27: "7PzSj-oIRjA",
    28: "shoWljlgSUU",
    29: "QMYgsEfPMg0",
    30: "WKs1uPGMQvw",
    31: "yL8sO_EjWOI",
  };
  for (const [wave, sourceId] of Object.entries(expected)) {
    const file = fs.readFileSync(
      path.join(root, `public/demo/episode-editorial-packs-wave${wave}.js`),
      "utf8",
    );
    assert.match(file, new RegExp(`sourceId:\\s*["']${sourceId}["']`));
    assert.match(file, /reviewState:\s*["']full-tape-human-editorial-read["']/);
    assert.match(file, /captionSha256:\s*["']sha256:/);
  }
});
