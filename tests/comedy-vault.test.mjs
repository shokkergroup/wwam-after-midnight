import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, "public", "demo", file), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(read("comedy-vault-data.js"), sandbox, { filename: "comedy-vault-data.js" });
vm.runInContext(read("comedy-vault-ui.js"), sandbox, { filename: "comedy-vault-ui.js" });

const payload = sandbox.window.WWAM_COMEDY_VAULT;
const ui = sandbox.window.WWAMComedyVaultUI;

test("verified comedy canon keeps all official member records separate", () => {
  assert.equal(payload.schema, "wwam-comedy-watchalong-vault/v1");
  assert.equal(payload.meta.films, 4);
  assert.equal(payload.meta.officialSourceRecords, 6);
  assert.equal(payload.meta.publicPlayableSources, 0);
  assert.equal(payload.meta.inventedReceipts, 0);
  assert.equal(new Set(payload.entries.map((entry) => entry.id)).size, 6);
  assert.equal(payload.sourceFamilies[0].entryIds.length, 3);
  assert.ok(payload.entries.every((entry) =>
    entry.wikiStatus === "sealed-source-brief" &&
    entry.receipts.length === 0 &&
    entry.recap === null &&
    /^https:\/\/(?:www\.)?(?:patreon\.com|youtube\.com)\//.test(entry.officialUrl)
  ));
});

test("requested Scary Movie, Harold and Kumar, and Waiting sources are exact", () => {
  const ids = new Set(payload.entries.map((entry) => entry.sourceId));
  for (const id of ["160733511", "63242334", "43329578", "34416138", "77725076", "iMA-ZL5mi3I"]) {
    assert.ok(ids.has(id), id);
  }
  assert.equal(payload.filmContext["scary-movie"].worldwideBoxOffice, 277200000);
  assert.equal(payload.filmContext["scary-movie-2"].worldwideBoxOffice, 141189101);
  assert.equal(payload.filmContext["harold-kumar"].worldwideBoxOffice, 19474552);
  assert.equal(payload.filmContext.waiting.worldwideBoxOffice, 18673274);
});

test("comedy vault shell is visual, searchable, and evidence honest", () => {
  const markup = ui.renderMarkup(payload, { filter: "all", query: "", openFilm: "" });
  assert.match(markup, /THE JOKES ARE/);
  assert.match(markup, /SCARY MOVIE/);
  assert.match(markup, /Harold &amp; Kumar/);
  assert.match(markup, /Waiting/);
  assert.equal((markup.match(/data-cv-film=/g) || []).length, 4);
  assert.doesNotMatch(markup, /<iframe\b/i);
  assert.doesNotMatch(markup, /\b(?:price|pricing|buy now|sales package)\b/i);
});

test("each sealed Show Wiki exposes context, versions, and all queued signature lanes", () => {
  const scary = ui.renderMarkup(payload, { filter: "all", query: "", openFilm: "scary-movie" });
  assert.match(scary, /SEALED SHOW WIKI/);
  assert.match(scary, /KEEP EVERY RECORD SEPARATE/);
  assert.match(scary, /BEST MOMENTS/);
  assert.match(scary, /WWAM UP IN YA/);
  assert.match(scary, /STRAIGHT TO STEVE&#39;S ASSHOLE/);
  assert.match(scary, /CHARACTER CALLBACKS/);
  assert.match(scary, /SCENE DOORS/);
  assert.match(scary, /0 INVENTED RECEIPTS/);
  assert.match(scary, /patreon-only-43329578/);
  assert.match(scary, /iMA-ZL5mi3I/);
  assert.doesNotMatch(scary, /data-(?:play|time|timestamp)/i);
});

test("host and journey wiring lazy-load the sealed comedy wing", () => {
  const html = read("index.html");
  const guided = read("guided-shell.js");
  const css = read("comedy-vault.css");
  assert.match(html, /id="comedy-vault"/);
  assert.match(html, /id="comedyVaultMount"/);
  assert.match(html, /comedy-vault-data\.js\?v=1\.0\.0,comedy-vault-ui\.js\?v=1\.0\.0/);
  assert.match(html, /href="#comedy-vault"[^>]+data-journey-link="watchalongs"/);
  assert.match(guided, /"comedy-vault": "watchalongs"/);
  assert.match(css, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /min-height: 46px/);
});

