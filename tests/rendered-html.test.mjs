import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("root enters the standalone WWAM demo", async () => {
  const response = await render();
  assert.ok([307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location")).pathname, "/demo/index.html");
});

test("ships the complete independent WWAM surface", async () => {
  const root = new URL("../dist/client/demo/", import.meta.url);
  const [index, app, styles, deepDistill, liveDistill, curation, searchEngine] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("app.js", root), "utf8"),
    readFile(new URL("styles.css", root), "utf8"),
    readFile(new URL("deep-distill.js", root), "utf8"),
    readFile(new URL("livestream-distill.js", root), "utf8"),
    readFile(new URL("curation.js", root), "utf8"),
    readFile(new URL("search-engine.js", root), "utf8"),
  ]);

  assert.match(index, /WWAM After Midnight/);
  assert.match(index, /THE RED BAND/);
  assert.match(index, /THE TAPE AUTOPSIES/);
  assert.match(index, /ASK THE COMMENTARY/);
  assert.match(index, /THE LORE LABS/);
  assert.match(index, /MIKE MODE/);
  assert.match(index, /WWAM UP IN YA/);
  assert.match(index, /THE LIVE/);
  assert.match(index, /THE DISTILL<br>HAS RECEIPTS/);
  assert.match(app, /WWAM_CATALOG/);
  assert.match(app, /WWAM_DEEP_DISTILL/);
  assert.match(app, /WWAM_LIVESTREAMS/);
  assert.match(app, /WWAMSearchEngine/);
  assert.match(app, /OPEN ORIGINAL ON YOUTUBE/);
  assert.match(deepDistill, /wordsAudited/);
  assert.match(deepDistill, /hot100/);
  assert.match(liveDistill, /topicIndex/);
  assert.match(liveDistill, /heatmap/);
  assert.match(curation, /upInYa/);
  assert.match(searchEngine, /human-curated soundbyte/);
  assert.match(styles, /--acid:\s*#d8ff38/);

  const combined = `${index}\n${app}\n${styles}\n${deepDistill}\n${liveDistill}\n${curation}\n${searchEngine}`;
  assert.doesNotMatch(combined, /Vigilante|VRL|racing site|SHOKKER LORE/i);
  assert.doesNotMatch(index, /\.\.\/\.\.\//);

  await Promise.all([
    access(new URL("catalog.js", root)),
    access(new URL("deep-distill.js", root)),
    access(new URL("livestream-distill.js", root)),
    access(new URL("curation.js", root)),
    access(new URL("search-engine.js", root)),
    access(new URL("app.js", root)),
    access(new URL("styles.css", root)),
    access(new URL("../og.png", root)),
  ]);
});

test("newest livestreams are mapped, current, and copyright-bounded", async () => {
  const source = await readFile(
    new URL("../dist/client/demo/livestream-distill.js", import.meta.url),
    "utf8",
  );
  const sandbox = { window: {} };
  runInNewContext(source, sandbox);
  const live = JSON.parse(JSON.stringify(sandbox.window.WWAM_LIVESTREAMS));

  assert.equal(live.streams.length, 10);
  assert.equal(live.streams[0].id, "LV2rmwEA0w4");
  assert.equal(live.streams[0].date, "2026-07-23");
  assert.equal(live.meta.captioned, 9);
  assert.ok(live.meta.wordsAudited > 350_000);
  assert.ok(live.meta.hours >= 34);
  assert.ok(live.meta.moments >= 60);
  assert.ok(live.meta.topics >= 20);
  assert.equal(live.streams.filter((stream) => stream.captioned).length, 9);
  assert.ok(
    live.streams.filter((stream) => stream.captioned)
      .every((stream) => stream.heatmap.length === 30 && stream.topics.length > 0),
  );
  assert.ok(
    live.streams.flatMap((stream) => stream.moments).every(
      (moment) => moment.quote.replace(/^\u2026\s*|\s*\u2026$/g, "").split(/\s+/).length <= 16,
    ),
  );
  assert.ok(
    live.streams.flatMap((stream) => stream.topics).every(
      (topic) => topic.receipt.replace(/^\u2026\s*|\s*\u2026$/g, "").split(/\s+/).length <= 11,
    ),
  );
});

test("Ask understands films, live topics, recency, intent, and uncertainty", async () => {
  const root = new URL("../dist/client/demo/", import.meta.url);
  const sandbox = { window: {} };
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "curation.js",
    "search-engine.js",
  ]) {
    runInNewContext(await readFile(new URL(file, root), "utf8"), sandbox);
  }
  const engine = sandbox.window.WWAMSearchEngine.create(
    sandbox.window.WWAM_CATALOG,
    sandbox.window.WWAM_DEEP_DISTILL,
    sandbox.window.WWAM_LIVESTREAMS,
    sandbox.window.WWAM_CURATED,
  );

  const remake = engine.ask("What do they hate about the Elm Street remake?");
  assert.equal(remake.results[0].sourceId, "qTQdWKcwn4A");
  assert.equal(remake.results[0].category, "FRANCHISE FELONY");

  const latestHalloween = engine.ask("What did they say about Halloween on the latest livestream?");
  assert.equal(latestHalloween.entity, "Halloween");
  assert.equal(latestHalloween.source, "livestream");
  assert.equal(latestHalloween.results[0].sourceId, "LV2rmwEA0w4");
  assert.equal(latestHalloween.results[0].kind, "topic");

  const batman = engine.ask("Where did they talk about Batman recently?");
  assert.equal(batman.entity, "Batman");
  assert.equal(batman.results[0].source, "livestream");

  const newestFunny = engine.ask("What is funniest in the newest stream?");
  assert.equal(newestFunny.results[0].sourceId, "LV2rmwEA0w4");
  assert.match(newestFunny.results[0].reasons.join(" "), /newest stream/);

  const speaker = engine.ask("Who hated Scream 3?");
  assert.match(speaker.answer, /won't invent a name/);

  const deranged = engine.ask("Show me the most deranged thing they said");
  assert.match(deranged.results[0].reasons.join(" "), /human-curated soundbyte/);
});

test("catalog preserves all four bounded franchise paths", async () => {
  const catalogSource = await readFile(
    new URL("../dist/client/demo/catalog.js", import.meta.url),
    "utf8",
  );
  const sandbox = { window: {} };
  runInNewContext(catalogSource, sandbox);
  const catalog = JSON.parse(JSON.stringify(sandbox.window.WWAM_CATALOG));

  assert.equal(catalog.length, 39);
  assert.equal(catalog.filter((item) => item.franchise === "Halloween").length, 13);
  assert.equal(catalog.filter((item) => item.franchise === "Friday the 13th").length, 12);
  assert.equal(catalog.filter((item) => item.franchise === "Scream").length, 6);
  assert.equal(catalog.filter((item) => item.franchise === "A Nightmare on Elm Street").length, 8);
  assert.equal(catalog.filter((item) => item.transcript).length, 38);
  assert.ok(catalog.every((item) => /^https:\/\/www\.youtube\.com\/watch\?v=/.test(item.url)));
});

test("deep distill is evidence-rich and copyright-bounded", async () => {
  const source = await readFile(
    new URL("../dist/client/demo/deep-distill.js", import.meta.url),
    "utf8",
  );
  const sandbox = { window: {} };
  runInNewContext(source, sandbox);
  const deep = JSON.parse(JSON.stringify(sandbox.window.WWAM_DEEP_DISTILL));

  assert.equal(deep.meta.tapes, 39);
  assert.equal(deep.meta.captioned, 38);
  assert.equal(deep.meta.franchises, 4);
  assert.equal(deep.hot100.length, 100);
  assert.ok(deep.meta.wordsAudited > 500_000);
  assert.ok(deep.meta.captionHours >= 60);
  assert.equal(deep.tapes.length, 39);
  assert.ok(deep.tapes.every((tape) => tape.moments.length <= 8));
  assert.ok(
    deep.tapes.flatMap((tape) => tape.moments).every(
      (moment) => moment.quote.replace(/^…\s*|\s*…$/g, "").split(/\s+/).length <= 22,
    ),
  );
  assert.ok(deep.hot100.every((moment, index) => moment.rank === index + 1));
});

test("contains no starter-preview residue", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.equal(JSON.parse(packageJson).name, "wwam-after-midnight-demo");
});
