import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runCheck } from "../scripts/check-wwam-playback-deploy.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const entries = fs.readdirSync(demo, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(?:js|html)$/.test(entry.name))
  .sort((left, right) => left.name.localeCompare(right.name))
  .map((entry) => ({
    name: entry.name,
    source: fs.readFileSync(path.join(demo, entry.name), "utf8"),
  }));
const byName = new Map(entries.map((entry) => [entry.name, entry.source]));

const constructionPatterns = {
  literalIframe: /<iframe\b/i,
  createdIframe: /\bcreateElement\s*\(\s*["']iframe["']\s*\)/i,
  iframeApiPlayer: /\bnew\s+(?:root\.)?YT\.Player\s*\(/,
};
const directEmbedUrl =
  /https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\//i;

function constructorsFor(source) {
  return Object.entries(constructionPatterns)
    .filter(([, pattern]) => pattern.test(source))
    .map(([name]) => name);
}

test("actual player construction is confined to the three reviewed implementations", () => {
  const actual = entries.flatMap((entry) =>
    constructorsFor(entry.source).map((kind) => ({
      file: entry.name,
      kind,
    })),
  );

  assert.deepEqual(actual, [
    { file: "tape-companion-ui.js", kind: "iframeApiPlayer" },
    { file: "youtube-playback.js", kind: "literalIframe" },
    { file: "youtube-player.html", kind: "createdIframe" },
  ]);

  assert.match(byName.get("youtube-playback.js"), directEmbedUrl);
  assert.match(byName.get("youtube-player.html"), directEmbedUrl);
  assert.match(
    byName.get("tape-companion-ui.js"),
    /ShokkerYouTubePlayback\.playerVars/,
  );
  assert.match(
    byName.get("tape-companion-ui.js"),
    /PLAYER IDENTITY ERROR 153/,
  );
});

test("app and lazy UI hosts cannot introduce literal direct YouTube iframe sinks", () => {
  const uiEntries = entries.filter((entry) =>
    entry.name === "app.js" ||
    /(?:-ui|-host|-launcher)\.js$/.test(entry.name),
  );

  for (const entry of uiEntries) {
    assert.doesNotMatch(
      entry.source,
      directEmbedUrl,
      `${entry.name} contains a direct YouTube embed URL`,
    );
    assert.doesNotMatch(
      entry.source,
      constructionPatterns.literalIframe,
      `${entry.name} contains a literal iframe sink`,
    );
    assert.doesNotMatch(
      entry.source,
      constructionPatterns.createdIframe,
      `${entry.name} creates an iframe outside the playback boundary`,
    );
    if (entry.name !== "tape-companion-ui.js") {
      assert.doesNotMatch(
        entry.source,
        constructionPatterns.iframeApiPlayer,
        `${entry.name} creates an unreviewed YouTube IFrame API player`,
      );
    }
  }

  assert.ok(
    (byName.get("app.js").match(/ShokkerYouTubePlayback\.iframe/g) || [])
      .length >= 2,
    "app.js must keep both direct UI playback paths behind the helper",
  );
  assert.match(
    byName.get("play-answer-ui.js"),
    /playback\.iframe\(stop\.sourceId/,
  );
  assert.match(
    byName.get("wwam-memory-cut-launcher.js"),
    /ShokkerYouTubePlayback\.iframe\(payload\.sourceId/,
  );
});

test("legacy embedUrl producers remain data-only and cannot mount media", () => {
  for (const name of [
    "character-lore.js",
    "lore-engine.js",
    "red-band-ranking-v2.js",
  ]) {
    const source = byName.get(name);
    assert.match(source, directEmbedUrl, `${name} no longer exposes its legacy data field`);
    assert.deepEqual(
      constructorsFor(source),
      [],
      `${name} turned a legacy embedUrl field into a player sink`,
    );
  }
});

test("the boundary test itself is local-only and performs no network work", () => {
  const ownSource = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  const checkerSource = fs.readFileSync(
    path.resolve(here, "../scripts/check-wwam-playback-deploy.mjs"),
    "utf8",
  );
  assert.doesNotMatch(ownSource, /from\s+["']node:(?:http|https|net|tls)["']/);
  assert.equal(ownSource.includes("fe" + "tch("), false);
  assert.equal(ownSource.includes("XMLHttp" + "Request"), false);
  assert.doesNotMatch(checkerSource, /from\s+["']node:vm["']/);
  assert.doesNotMatch(checkerSource, /\brunInContext\b|\beval\s*\(/);
});

test("post-deploy checker validates a local production-shaped fixture without network", async () => {
  const base = "https://fixture.invalid/demo/";
  const files = new Map([
    ["/demo/", fs.readFileSync(path.join(demo, "index.html"), "utf8")],
    [
      "/demo/youtube-playback.js",
      fs.readFileSync(path.join(demo, "youtube-playback.js"), "utf8"),
    ],
    [
      "/demo/youtube-player.html",
      fs.readFileSync(path.join(demo, "youtube-player.html"), "utf8"),
    ],
    ["/demo/app.js", fs.readFileSync(path.join(demo, "app.js"), "utf8")],
  ]);
  const requests = [];
  const fetchImpl = async (input, init) => {
    const url = new URL(input);
    requests.push({
      url: url.toString(),
      method: init?.method,
    });
    const text = files.get(url.pathname);
    return {
      ok: text != null,
      status: text == null ? 404 : 200,
      url: url.toString(),
      async text() {
        return text || "";
      },
    };
  };

  const result = await runCheck(base, { fetchImpl, silent: true });
  assert.equal(result.sourceId, "5et_A1tYnio");
  assert.equal(result.start, 5406);
  assert.equal(result.end, 5432);
  assert.match(result.identity, /strict referrer.*origin.*widget_referrer/);
  assert.equal(requests.length, 4);
  assert.ok(requests.every((request) => request.method === "GET"));
});
