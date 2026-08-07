import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd());
const html = fs.readFileSync(path.join(root, "public/demo/index.html"), "utf8");
const assets = fs.readFileSync(path.join(root, "public/demo/source-dossier-assets.js"), "utf8");
const app = fs.readFileSync(path.join(root, "public/demo/app.js"), "utf8");

test("cold Show Wiki routes preload the latest human editorial packs", () => {
  for (const wave of Array.from({ length: 131 }, (_, index) => index + 2)) {
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
    32: "_hcLHO3Y0jA",
    33: "_8rkO1gLQds",
    34: "waD77pum1eQ",
    35: "-31V7Dbyyqs",
    36: "aHB28aYdYto",
    37: "2en5C2sNAN8",
    38: "XJDACajq_M0",
    39: "rLdk9JKeN68",
    40: "yL8sO_EjWOI",
    41: "_hcLHO3Y0jA",
    42: "_8rkO1gLQds",
    43: "WKs1uPGMQvw",
    44: "Aw2ICPP6rAQ",
    45: "ezGMIrvxwFY",
    46: "ceD5ulYUy5M",
    47: "qSfmUifL_hg",
    48: "8pOjQGezFSw",
    49: "J5uGidPT9Jc",
    50: "M3P4mMDpXUc",
    51: "cEbTH6X0G6Y",
    52: "Q_tyYaa_R-4",
    53: "3UCnMrLMXbI",
    54: "u9aRsfemqxg",
    55: "qXM8FSp7ywM",
    56: "1ctyVf_d5w4",
    57: "qocixR2FEA0",
    58: "ZrXVjTAmLos",
    59: "w8309SyyriA",
    60: "FTRWH0lgxa4",
    61: "95z8MWBwrR0",
    62: "34BwSiucNEI",
    63: "hagePawEnC4",
    64: "tvcueJl5vME",
    65: "0GhyPapAgCY",
    66: "saGLWUIxmZQ",
    67: "qfJFZaC9pTE",
    68: "ZipaD1w4oVg",
    69: "3iMZcaVcvTU",
    70: "fpNtQMexZiw",
    71: "vq6mrfqOgZw",
    72: "M3P4mMDpXUc",
    73: "1j3F9vAWBo4",
    74: "5T1wWUjCGWk",
    75: "rtWl8c57SYk",
    76: "bH9k0XPYkEs",
    77: "bJH5SbqGnr4",
    78: "8nBNn8NY59k",
    79: "OrPOS679cGQ",
    80: "EhWiOIxlfak",
    81: "4X8EFw7MCmw",
    82: "JBnfH9kNiIY",
    83: "RldFMV-gTh8",
    84: "SFU12QtMMwE",
    85: "qgUX3ySexeI",
    86: "BOdxEeN8pGc",
    87: "MRLPoTP8cBo",
    88: "o4EMYqQ5DDU",
    89: "Z7ArdfA054w",
    90: "VTy8U9-9qw8",
    91: "hCCQpZcW-sY",
    92: "0_K7wUhtMLk",
    93: "5k6I18ZekPQ",
    94: "iWEJqd1Vqxo",
    95: "gR_64RyPhEM",
    96: "JoM0Y3HTWNI",
    97: "fZCTQaqFibk",
    98: "RR02tuVPH8M",
    99: "Xv-cIvroUmA",
    100: "KpqbfsBGfAk",
    101: "HLDAxs4_3U4",
    102: "fGJyLjp-JP8",
    103: "LV2rmwEA0w4",
  104: "v9F04LFBSdU",
  105: "-31V7Dbyyqs",
  106: "iz0WFhe6LYM",
  107: "-PoawT_AuRE",
  108: "k698GIJe8EA",
    109: "R8ODT-dbcxU",
    110: "LV2rmwEA0w4",
  114: "BikumH8JKmw",
  115: "QJGSOrFBdS8",
  116: "60zSG002oN4",
    117: "uA5lTCjk7sQ",
    118: "_83AxEzsR84",
    111: "wk1j2rL49kA",
    112: "SL2HtTbAF9I",
    113: "wdLggqRcisQ",
    119: "gRS6216vIEc",
  120: "AGL5yUH5Xy4",
  121: "Ld5o2uamVJw",
  122: "Q-ia3Nb9KvM",
  123: "e7Guc5jtHQg",
    124: "Qb2rDe-kJkI",
    125: "Y8vdkgcXhc0",
    126: "KRhfWuzcxX4",
    127: "_8rkO1gLQds",
    128: "_hcLHO3Y0jA",
    129: "21hL29hicoU",
    130: "mI7QlWrVyRw",
    131: "73shrgDx9Dc",
    132: "ZYnh0C9uUzk",
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

test("cold routes preserve long full-tape overviews instead of generic fallback copy", () => {
  assert.match(app, /fullTapeEditorialRead/);
  assert.match(app, /raw\.length\s*<=\s*3200/);
  assert.match(html, /app\.js\?v=0\.5\.130-source-route-memory-v2/);
});

test("local Show Wiki links stay child routes and restore their source shelf", () => {
  assert.match(app, /interceptLocalSourceLinks/);
  assert.match(app, /window\.addEventListener\("click", interceptLocalSourceLinks, true\)/);
  assert.match(app, /sourceReturnContext/);
  assert.match(app, /SOURCE_RETURN_STORAGE_KEY/);
  assert.match(app, /sourceReturnStorageWrite/);
  assert.match(app, /A shelf can reflow several times/);
  assert.match(app, /pendingReturn = sourceReturnRestorePending/);
  assert.match(app, /sourceReturnStorageClear/);
  assert.match(app, /wwamSourceReturn/);
  assert.match(app, /restoreSourceReturnContext/);
  assert.match(app, /Close clip and keep Show Wiki/);
  assert.match(app, /A playable moment is a child state of the open Show Wiki/);
  assert.match(app, /sourceReturnRestorePending = parentReturnContext/);
  assert.match(app, /__wwamSourceReturnRestore/);
  assert.match(app, /expiresAt: Date\.now\(\) \+ 6500/);
  assert.match(app, /captureSourceReturnContext\(\);/);
  assert.match(app, /parentReturnContext/);
});
