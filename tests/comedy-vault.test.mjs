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

test("comedy shelf keeps all six official member listings separate", () => {
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

test("requested Scary Movie, Harold and Kumar, and Waiting pages stay exact", () => {
  const ids = new Set(payload.entries.map((entry) => entry.sourceId));
  for (const id of ["160733511", "63242334", "43329578", "34416138", "77725076", "iMA-ZL5mi3I"]) {
    assert.ok(ids.has(id), id);
  }
  assert.equal(payload.filmContext["scary-movie"].worldwideBoxOffice, 277200000);
  assert.equal(payload.filmContext["scary-movie-2"].worldwideBoxOffice, 141189101);
  assert.equal(payload.filmContext["harold-kumar"].worldwideBoxOffice, 19474552);
  assert.equal(payload.filmContext.waiting.worldwideBoxOffice, 18673274);
});

test("default shelf reads like a movie-night guide instead of an audit dashboard", () => {
  const markup = ui.renderMarkup(payload, { filter: "all", query: "", openFilm: "" });
  assert.match(markup, /class="cv-shelf-summary"/);
  assert.match(markup, /MOVIE NIGHT/);
  assert.match(markup, /4 MOVIES/);
  assert.match(markup, /6 WWAM VERSIONS/);
  assert.match(markup, /WHERE ARE THE PLAY BUTTONS/);
  assert.match(markup, /OPEN MOVIE \+ SHOW GUIDE/g);
  assert.match(markup, /Harold &amp; Kumar/);
  assert.equal((markup.match(/data-cv-film=/g) || []).length, 4);
  assert.doesNotMatch(markup, /\b(?:VERIFIED|CANON|RECEIPTS?|SOURCE-LOCKED|UNDER SEAL|VERSION CONTROL|QUEUED LANES?)\b/i);
  assert.doesNotMatch(markup, /<iframe\b/i);
  assert.doesNotMatch(markup, /\b(?:price|pricing|buy now|sales package)\b/i);
});

test("movie guide keeps proof folded away and uses one concise future strip", () => {
  const scary = ui.renderMarkup(payload, { filter: "all", query: "", openFilm: "scary-movie" });
  assert.match(scary, /MOVIE \+ WWAM SHOW GUIDE/);
  assert.match(scary, /COMMENTARY AUDIO IS NOT PUBLICLY PLAYABLE HERE YET/);
  assert.match(scary, /PICK YOUR VERSION/);
  assert.equal((scary.match(/class="cv-coming-strip"/g) || []).length, 1);
  assert.doesNotMatch(scary, /class="cv-queued-lane"/);
  for (const label of ["BEST MOMENTS", "WWAM UP IN YA", "STRAIGHT TO STEVE&#39;S ASSHOLE", "CHARACTER CALLBACKS", "SCENE DOORS"]) {
    assert.match(scary, new RegExp(label));
  }
  assert.match(scary, /OPEN OFFICIAL PAGE/);
  assert.match(scary, /<details class="cv-version-file"[^>]+data-source-family="scary-movie-version-family"/);
  assert.equal((scary.match(/<details class="cv-source-proof">/g) || []).length, 3);
  assert.match(scary, /<summary>ABOUT THIS LISTING<\/summary>/);
  assert.match(scary, /PAGE ID <code>43329578<\/code>/);
  assert.match(scary, /PAGE ID <code>iMA-ZL5mi3I<\/code>/);
  assert.doesNotMatch(scary, /0 INVENTED RECEIPTS|EMPTY LANES|WHAT UNSEALS NEXT/);
  assert.doesNotMatch(scary, /data-(?:play|time|timestamp)/i);
});

test("host and journey wiring lazy-load the fan-facing comedy shelf", () => {
  const html = read("index.html");
  const guided = read("guided-shell.js");
  const css = read("comedy-vault.css");
  assert.match(html, /id="comedy-vault"/);
  assert.match(html, /id="comedyVaultMount"/);
  assert.match(html, /comedy-vault\.css\?v=1\.2\.2/);
  assert.match(html, /comedy-vault-data\.js\?v=1\.1\.0,comedy-vault-ui\.js\?v=1\.2\.0/);
  assert.match(guided, /\["#comedy-vault", "watchalongs", "COMEDY SHELF"/);
  assert.match(guided, /"comedy-vault": "watchalongs"/);
  assert.match(css, /\.cv-coming-strip/);
  assert.match(css, /\.cv-source-proof summary/);
  assert.match(css, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /min-height: 46px/);
  assert.doesNotMatch(css, /calc\(\(100vw - 1400px\)\/2\)/);
  assert.match(css, /grid-template-columns: minmax\(210px,42%\) minmax\(0,1fr\)/);
});