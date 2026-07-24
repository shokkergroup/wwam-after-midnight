import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const source = fs.readFileSync(path.join(demo, "youtube-playback.js"), "utf8");
const index = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const companion = fs.readFileSync(path.join(demo, "tape-companion-ui.js"), "utf8");
const hostedPlayer = fs.readFileSync(
  path.join(demo, "youtube-player.html"),
  "utf8"
);

function load(location = {
  protocol: "https:",
  origin: "https://wiki.example",
  pathname: "/demo/"
}) {
  const window = { location, URLSearchParams };
  window.window = window;
  vm.createContext(window);
  vm.runInContext(source, window, { filename: "youtube-playback.js" });
  return window.ShokkerYouTubePlayback;
}

test("every player receives explicit page identity and referrer policy", () => {
  const playback = load();
  const markup = playback.iframe("5et_A1tYnio", {
    autoplay: true,
    start: 5406,
    end: 5432,
    title: "Bounded source clip"
  });

  assert.match(markup, /referrerpolicy="strict-origin-when-cross-origin"/);
  assert.match(markup, /origin=https%3A%2F%2Fwiki\.example/);
  assert.doesNotMatch(markup, /widget_referrer/);
  assert.match(markup, /enablejsapi=1/);
  assert.match(markup, /start=5406/);
  assert.match(markup, /end=5432/);
  assert.match(markup, /allow="autoplay; encrypted-media; picture-in-picture; fullscreen"/);
  assert.match(markup, /data-shokker-youtube-player/);
  assert.match(markup, /data-shokker-youtube-recover/);
  assert.match(markup, /PLAYER ERROR\? RECOVER HERE/);
});

test("the IFrame API uses the same client-identity contract", () => {
  const vars = load().playerVars({ start: 42 });
  assert.deepEqual(JSON.parse(JSON.stringify(vars)), {
    autoplay: 0,
    controls: 1,
    rel: 0,
    playsinline: 1,
    start: 42,
    origin: "https://wiki.example"
  });
  assert.match(companion, /ShokkerYouTubePlayback\.playerVars/);
  assert.match(companion, /script\.referrerPolicy = root\.ShokkerYouTubePlayback\.referrerPolicy/);
});

test("file launches keep playback on-page through the hosted player bridge", () => {
  const playback = load({
    protocol: "file:",
    origin: "null",
    pathname: "/C:/WWAM/index.html"
  });
  const markup = playback.iframe("5et_A1tYnio", {
    start: 5406,
    end: 5432
  });
  assert.equal(playback.hosted(), false);
  assert.match(
    markup,
    /wwam-after-midnight\.downndirtytn\.chatgpt\.site\/demo\/youtube-player\.html/
  );
  assert.match(markup, /video=5et_A1tYnio/);
  assert.match(markup, /referrerpolicy="strict-origin-when-cross-origin"/);
  assert.match(companion, /!root\.ShokkerYouTubePlayback\.hosted\(\)/);
  assert.match(companion, /HOSTED PLAYER READY \/\/ MANUAL MEMORY SYNC/);
});

test("HTTP pages can force the hosted bridge after YouTube identity error 153", () => {
  const playback = load();
  const markup = playback.iframe("5et_A1tYnio", {
    start: 5406,
    end: 5432,
    forceHostedBridge: true
  });

  assert.match(
    markup,
    /https:\/\/wiki\.example\/demo\/youtube-player\.html/
  );
  assert.match(markup, /video=5et_A1tYnio/);
  assert.match(
    markup,
    /widget_referrer=https%3A%2F%2Fwiki\.example%2Fdemo%2F/
  );
  assert.match(markup, /start=5406/);
  assert.match(markup, /end=5432/);
  assert.doesNotMatch(markup, /origin=https%3A%2F%2Fwiki\.example/);
  assert.match(
    companion,
    /PLAYER IDENTITY ERROR 153 RECOVERED \/\/ HOSTED PLAYER \+ MANUAL MEMORY SYNC/
  );
  assert.match(companion, /forceHostedBridge:\s*forceHostedBridge === true/);
});

test("the universal recovery control keeps the same source and coordinates", () => {
  const playback = load();
  const attributes = new Map([
    ["data-video-id", "5et_A1tYnio"],
    ["data-start", "5406"],
    ["data-end", "5432"],
    ["data-autoplay", "1"],
  ]);
  const frame = {
    src: "",
    setAttribute(name, value) {
      if (name === "src") this.src = value;
    },
  };
  const player = {
    getAttribute(name) {
      return attributes.get(name) ?? "";
    },
    querySelector(selector) {
      return selector === "iframe" ? frame : null;
    },
  };
  const button = {
    textContent: "",
    disabled: false,
    closest(selector) {
      return selector === "[data-shokker-youtube-player]" ? player : null;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
  };

  playback.recoverPlayer(button);

  assert.match(frame.src, /https:\/\/wiki\.example\/demo\/youtube-player\.html/);
  assert.match(frame.src, /video=5et_A1tYnio/);
  assert.match(frame.src, /start=5406/);
  assert.match(frame.src, /end=5432/);
  assert.match(frame.src, /autoplay=1/);
  assert.equal(button.textContent, "RECOVERY PLAYER LOADED");
  assert.equal(button.disabled, true);
});

test("the hosted bridge validates coordinates and supplies YouTube a real referrer", () => {
  assert.match(
    hostedPlayer,
    /<meta name="referrer" content="strict-origin-when-cross-origin">/
  );
  assert.match(hostedPlayer, /\^\[A-Za-z0-9_-\]\{11\}\$/);
  assert.match(hostedPlayer, /parameters\.set\("origin", location\.origin\)/);
  assert.match(hostedPlayer, /parameters\.set\("widget_referrer", widgetReferrer\)/);
  assert.match(hostedPlayer, /query\.get\("widget_referrer"\) \|\| document\.referrer/);
  assert.match(hostedPlayer, /parameters\.set\("enablejsapi", "1"\)/);
  assert.match(hostedPlayer, /end > safeStart/);
  assert.match(hostedPlayer, /frame\.referrerPolicy = "strict-origin-when-cross-origin"/);
  assert.match(hostedPlayer, /host\.replaceChildren\(frame\)/);
  assert.doesNotMatch(hostedPlayer, /innerHTML|document\.write/);
});

test("the document and both direct player paths cannot suppress YouTube's referrer", () => {
  assert.match(
    index,
    /<meta name="referrer" content="strict-origin-when-cross-origin">/
  );
  assert.ok(
    index.indexOf('<script src="youtube-playback.js?v=0.5.16"></script>') <
      index.indexOf('<script src="app.js?v=0.5.16"></script>')
  );
  assert.equal((app.match(/ShokkerYouTubePlayback\.iframe/g) || []).length, 2);
  assert.match(companion, /PLAYER IDENTITY ERROR 153/);
  assert.doesNotMatch(
    index + app + companion + source,
    /referrerpolicy=["']no-referrer|referrerPolicy\s*=\s*["']no-referrer/i
  );
});

test("invalid video IDs fail closed instead of producing an arbitrary iframe", () => {
  const playback = load();
  assert.equal(playback.embedUrl("too-short"), "");
  assert.equal(playback.iframe("\" onload=\"alert(1)", {}), "");
});
