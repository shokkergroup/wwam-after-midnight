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
  const [index, app, styles] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("app.js", root), "utf8"),
    readFile(new URL("styles.css", root), "utf8"),
  ]);

  assert.match(index, /WWAM After Midnight/);
  assert.match(index, /THE WATCHALONG VAULT/);
  assert.match(index, /THE UNHINGED INDEX/);
  assert.match(index, /THE QUOTE CRYPT/);
  assert.match(index, /THE BIT GRAVEYARD/);
  assert.match(app, /WWAM_CATALOG/);
  assert.match(styles, /--acid:#d8ff38/);

  const combined = `${index}\n${app}\n${styles}`;
  assert.doesNotMatch(combined, /Vigilante|VRL|racing site|SHOKKER LORE/i);
  assert.doesNotMatch(index, /\.\.\/\.\.\//);

  await Promise.all([
    access(new URL("catalog.js", root)),
    access(new URL("app.js", root)),
    access(new URL("styles.css", root)),
    access(new URL("../og.png", root)),
  ]);
});

test("catalog preserves both verified franchise paths", async () => {
  const catalogSource = await readFile(
    new URL("../dist/client/demo/catalog.js", import.meta.url),
    "utf8",
  );
  const sandbox = { window: {} };
  runInNewContext(catalogSource, sandbox);
  const catalog = JSON.parse(JSON.stringify(sandbox.window.WWAM_CATALOG));

  assert.equal(catalog.length, 25);
  assert.equal(catalog.filter((item) => item.franchise === "Halloween").length, 13);
  assert.equal(catalog.filter((item) => item.franchise === "Friday the 13th").length, 12);
  assert.ok(catalog.every((item) => /^https:\/\/www\.youtube\.com\/watch\?v=/.test(item.url)));
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
