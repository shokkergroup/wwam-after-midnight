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
  const [index, app, styles, deepDistill] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("app.js", root), "utf8"),
    readFile(new URL("styles.css", root), "utf8"),
    readFile(new URL("deep-distill.js", root), "utf8"),
  ]);

  assert.match(index, /WWAM After Midnight/);
  assert.match(index, /THE RED BAND/);
  assert.match(index, /THE TAPE AUTOPSIES/);
  assert.match(index, /ASK THE COMMENTARY/);
  assert.match(index, /THE LORE LABS/);
  assert.match(index, /MIKE MODE/);
  assert.match(index, /THE DISTILL<br>HAS RECEIPTS/);
  assert.match(app, /WWAM_CATALOG/);
  assert.match(app, /WWAM_DEEP_DISTILL/);
  assert.match(app, /OPEN ORIGINAL ON YOUTUBE/);
  assert.match(deepDistill, /wordsAudited/);
  assert.match(deepDistill, /hot100/);
  assert.match(styles, /--acid:\s*#d8ff38/);

  const combined = `${index}\n${app}\n${styles}\n${deepDistill}`;
  assert.doesNotMatch(combined, /Vigilante|VRL|racing site|SHOKKER LORE/i);
  assert.doesNotMatch(index, /\.\.\/\.\.\//);

  await Promise.all([
    access(new URL("catalog.js", root)),
    access(new URL("deep-distill.js", root)),
    access(new URL("app.js", root)),
    access(new URL("styles.css", root)),
    access(new URL("../og.png", root)),
  ]);
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
