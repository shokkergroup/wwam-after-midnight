import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const shell = fs.readFileSync(path.join(demo, "guided-shell.js"), "utf8");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");

test("hash routes use one measured sticky-header offset instead of stacked CSS offsets", () => {
  const start = shell.indexOf("function routeScrollTop");
  const end = shell.indexOf("function focusRouteTarget", start);
  const landing = shell.slice(start, end);

  assert.match(landing, /querySelector\("\.wwam-site-header"\)/);
  assert.match(landing, /getBoundingClientRect\(\)\.bottom/);
  assert.match(landing, /target\.getBoundingClientRect\(\)\.top - headerBottom - 16/);
  assert.match(landing, /window\.scrollTo\(\{/);
  assert.doesNotMatch(landing, /scrollIntoView/);
  assert.match(landing, /target\.id === "top"\) return 0/);
});

test("route landing survives lazy section growth but yields immediately to the visitor", () => {
  const start = shell.indexOf("function setJourney");
  const end = shell.indexOf("function closeMore", start);
  const journey = shell.slice(start, end);

  assert.match(journey, /new ResizeObserver/);
  assert.match(journey, /routeObserver\.observe\(section\)/);
  assert.match(journey, /WWAMFeatureLoader\.hydrate\(section\)/);
  assert.match(journey, /addEventListener\("wheel", releaseRoutePin/);
  assert.match(journey, /addEventListener\("touchstart", releaseRoutePin/);
  assert.match(journey, /addEventListener\("pointerdown", releaseRoutePin/);
  assert.match(journey, /5000/);
  assert.doesNotMatch(journey, /12000/);
});

test("primary route clicks avoid the browser's competing native anchor jump and focus the destination", () => {
  assert.match(shell, /event\.preventDefault\(\);\s*if \(location\.hash !== href \|\| location\.search\) history\.pushState/);
  assert.match(shell, /setJourney\(link\.dataset\.journeyLink, targetId, \{ behavior: "smooth", focus: true \}\)/);
  assert.match(shell, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(shell, /setJourney\(journeyFromLocation\(\), initialTarget, \{ behavior: "auto" \}\)/);
  assert.match(html, /guided-shell\.css\?v=1\.0\.2-coherent/);
  assert.match(html, /guided-shell\.js\?v=1\.2\.3-recovered/);
});
