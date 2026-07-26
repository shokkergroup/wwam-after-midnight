#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_BASE =
  "https://wwam-after-midnight.downndirtytn.chatgpt.site/demo/";
const VIDEO_ID = "5et_A1tYnio";
const START = 5406;
const END = 5432;
const DEMO_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/demo",
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function pageUrl(value) {
  const url = new URL(value || DEFAULT_BASE);
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("Base URL must use HTTP or HTTPS.");
  }
  if (!url.pathname.endsWith("/") && !/\.html?$/i.test(url.pathname)) {
    url.pathname += "/";
  }
  return url;
}

async function fetchText(url, label, fetchImpl) {
  const response = await fetchImpl(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "WWAM-playback-deploy-check/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(
      `${label} returned HTTP ${response.status}: ${response.url || url}`,
    );
  }
  return {
    text: await response.text(),
    url: new URL(response.url || url),
  };
}

function scriptEntries(html) {
  return Array.from(
    html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
    (match) => ({
      src: match[1],
      index: match.index,
    }),
  );
}

function assetEntry(entries, filename) {
  return entries.find((entry) => {
    try {
      return new URL(entry.src, "https://asset.invalid/").pathname
        .endsWith(`/${filename}`);
    } catch {
      return false;
    }
  });
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function verifyCurrentAsset(source, filename, label) {
  const expected = fs.readFileSync(path.join(DEMO_DIR, filename), "utf8");
  invariant(
    source === expected,
    `${label} does not match this release ` +
      `(deployed ${digest(source)}, expected ${digest(expected)}).`,
  );
}

function verifyHelperSource(source) {
  invariant(
    /var POLICY = ["']strict-origin-when-cross-origin["']/.test(source),
    "Playback helper is missing strict-origin-when-cross-origin.",
  );
  invariant(
    source.includes('"https://www.youtube.com/embed/" + encodeURIComponent(id)'),
    "Playback helper is missing the reviewed direct YouTube source builder.",
  );
  invariant(
    source.includes('query.set("origin", identity.origin)'),
    "Playback helper is missing deployed-page origin identity.",
  );
  invariant(
    source.includes('query.set("widget_referrer", identity.referrer)'),
    "Playback helper is missing widget_referrer recovery identity.",
  );
  invariant(
    source.includes('query.set("start",') &&
      source.includes('query.set("end",'),
    "Playback helper is missing bounded start/end propagation.",
  );
  invariant(
    source.includes("data-shokker-youtube-recover") &&
      source.includes("forceHostedBridge: true"),
    "Playback helper is missing its reviewed in-page recovery path.",
  );
  invariant(
    source.includes('query.set("enablejsapi", "1")'),
    "Playback helper is missing enablejsapi identity support.",
  );
}

function verifyBridgeSource(html) {
  invariant(
    /<meta\b(?=[^>]*\bname=["']referrer["'])(?=[^>]*\bcontent=["']strict-origin-when-cross-origin["'])[^>]*>/i
      .test(html),
    "Hosted bridge is missing its strict referrer meta policy.",
  );
  invariant(
    html.includes('frame.referrerPolicy = "strict-origin-when-cross-origin"'),
    "Bridge iframe suppresses or omits its HTTP referrer.",
  );
  invariant(
    html.includes(
      'frame.src = "https://www.youtube.com/embed/" + encodeURIComponent(id)',
    ),
    "Bridge is missing the reviewed YouTube source builder.",
  );
  invariant(
    html.includes('parameters.set("enablejsapi", "1")') &&
      html.includes('parameters.set("origin", location.origin)'),
    "Hosted bridge is missing enablejsapi or HTTPS origin identity.",
  );
  invariant(
    html.includes('parameters.set("widget_referrer", widgetReferrer)'),
    "Hosted bridge is missing widget_referrer identity.",
  );
  invariant(
    html.includes('parameters.set("start", String(safeStart))') &&
      html.includes('parameters.set("end", String(Math.round(end)))'),
    "Hosted bridge is missing bounded start/end propagation.",
  );
}

export async function runCheck(baseUrl = DEFAULT_BASE, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const requested = pageUrl(baseUrl);
  const indexResponse = await fetchText(requested, "WWAM index", fetchImpl);
  const indexUrl = indexResponse.url;
  const index = indexResponse.text;

  invariant(
    /<meta\b(?=[^>]*\bname=["']referrer["'])(?=[^>]*\bcontent=["']strict-origin-when-cross-origin["'])[^>]*>/i
      .test(index),
    "Production index is missing strict-origin-when-cross-origin referrer identity.",
  );

  const scripts = scriptEntries(index);
  const helperEntry = assetEntry(scripts, "youtube-playback.js");
  const appEntry = assetEntry(scripts, "app.js");
  invariant(helperEntry, "Production index does not load youtube-playback.js.");
  invariant(appEntry, "Production index does not load app.js.");
  invariant(
    helperEntry.index < appEntry.index,
    "Production loads app.js before the playback identity helper.",
  );

  const helperUrl = new URL(helperEntry.src, indexUrl);
  const appUrl = new URL(appEntry.src, indexUrl);
  const bridgeUrl = new URL("media-bridge.html", helperUrl);
  const [helperResponse, bridgeResponse, appResponse] = await Promise.all([
    fetchText(helperUrl, "YouTube playback helper", fetchImpl),
    fetchText(bridgeUrl, "Hosted YouTube bridge", fetchImpl),
    fetchText(appUrl, "WWAM app runtime", fetchImpl),
  ]);

  invariant(
    !/https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\//i
      .test(appResponse.text),
    "Production app.js contains a literal direct YouTube embed URL.",
  );
  invariant(
    !/<iframe\b/i.test(appResponse.text) &&
      !/\bcreateElement\s*\(\s*["']iframe["']\s*\)/i.test(appResponse.text),
    "Production app.js contains a literal iframe builder.",
  );

  verifyHelperSource(helperResponse.text);
  verifyBridgeSource(bridgeResponse.text);
  verifyCurrentAsset(
    helperResponse.text,
    "youtube-playback.js",
    "Deployed playback helper",
  );
  verifyCurrentAsset(
    bridgeResponse.text,
    "media-bridge.html",
    "Deployed hosted bridge",
  );

  const result = {
    indexUrl: indexUrl.toString(),
    helperUrl: helperResponse.url.toString(),
    bridgeUrl: bridgeResponse.url.toString(),
    sourceId: VIDEO_ID,
    start: START,
    end: END,
    identity:
      "strict referrer + origin + widget_referrer recovery",
  };
  if (!options.silent) {
    console.log("WWAM PLAYBACK DEPLOY CHECK PASSED");
    console.log(`INDEX   ${result.indexUrl}`);
    console.log(`HELPER  ${result.helperUrl}`);
    console.log(`BRIDGE  ${result.bridgeUrl}`);
    console.log(`SOURCE  ${result.sourceId} @ ${result.start}-${result.end}`);
    console.log(`IDENTITY ${result.identity}`);
  }
  return result;
}

const invokedDirectly = typeof process !== "undefined" && process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  runCheck(process.argv[2]).catch((error) => {
    console.error("WWAM PLAYBACK DEPLOY CHECK FAILED");
    console.error(error && error.message ? error.message : String(error));
    process.exitCode = 1;
  });
}
