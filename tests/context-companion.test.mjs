import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

const demo = new URL("../public/demo/", import.meta.url);

async function loadWindow(files) {
  const sandbox = { window: {} };
  for (const file of files) {
    runInNewContext(await readFile(new URL(file, demo), "utf8"), sandbox, { filename: file });
  }
  return sandbox.window;
}

test("every watchalong receives a sourced external movie ledger", async () => {
  const root = await loadWindow(["catalog.js", "context-atlas.js"]);
  const catalog = root.WWAM_CATALOG;
  const atlas = root.WWAM_CONTEXT_ATLAS;
  assert.equal(catalog.length, 39);
  assert.equal(Object.keys(atlas.movies).length, 39);
  assert.deepEqual(
    JSON.parse(JSON.stringify(Object.keys(atlas.movies).sort())),
    JSON.parse(JSON.stringify(catalog.map((item) => item.id).sort())),
  );
  for (const item of Object.values(atlas.movies)) {
    assert.match(item.financialSource, /^https:\/\//);
    assert.ok(item.film && item.year && item.runtime && item.director);
    assert.match(item.budget, /\$/);
    assert.match(item.worldwide, /\$/);
    assert.ok(Array.isArray(item.facts) && item.facts.length >= 2);
  }
});

test("Halloween 4 carries public-domain art, financial context, and a trailer door", async () => {
  const { WWAM_CONTEXT_ATLAS: atlas } = await loadWindow(["context-atlas.js"]);
  const page = atlas.movies["28PfRNKoSCA"];
  assert.equal(page.film, "Halloween 4: The Return of Michael Myers");
  assert.equal(page.budget, "$5 million");
  assert.equal(page.worldwide, "$17.8 million");
  assert.match(page.image, /wikimedia\.org\/wikipedia\/commons/);
  assert.match(page.imageSource, /commons\.wikimedia\.org/);
  assert.match(page.imageLabel, /public domain/i);
  assert.match(page.trailerId, /^[A-Za-z0-9_-]{11}$/);
});

test("the latest five shows expose 23 timed context doors after exact-source recovery", async () => {
  const { WWAM_CONTEXT_ATLAS: atlas } = await loadWindow(["context-atlas.js"]);
  const expected = ["LV2rmwEA0w4", "iz0WFhe6LYM", "ag3axSC9BpU", "x6tvsGRHgU0", "7PzSj-oIRjA"];
  assert.deepEqual(Object.keys(atlas.recentShows), expected);
  const cards = Object.values(atlas.recentShows).flatMap((show) => show.cards);
  assert.equal(cards.length, 23);
  assert.ok(cards.every((card) => Number.isFinite(card.at) && card.at >= 0));
  assert.ok(cards.every((card) => card.claimState && card.sourceLabel));
  assert.equal(atlas.recentShows.x6tvsGRHgU0.coverage, "caption-backed");
  assert.equal(atlas.recentShows.x6tvsGRHgU0.gap, undefined);
  assert.equal(atlas.recentShows.x6tvsGRHgU0.cards.length, 4);
  assert.deepEqual(
    Array.from(atlas.recentShows.x6tvsGRHgU0.cards, (card) => card.at),
    [1972, 2331, 3166, 6773],
  );
});

test("the companion preserves source separation, retry mounting, and in-modal navigation", async () => {
  const script = await readFile(new URL("context-companion.js", demo), "utf8");
  const shell = await readFile(new URL("guided-shell.js", demo), "utf8");
  const css = await readFile(new URL("guided-shell.css", demo), "utf8");
  assert.match(script, /ABOUT THE MOVIE \/\/ EXTERNAL CONTEXT/);
  assert.match(script, /MOVIE SYNC NOT SET YET/);
  assert.match(script, /MutationObserver/);
  assert.match(script, /setInterval/);
  assert.match(script, /modal\.scrollTo/);
  assert.match(script, /querySelector\("#sourceDossierEpisodeGuide"\)/);
  assert.match(script, /if \(guide\) guide\.insertAdjacentElement\("afterend", section\)/);
  assert.match(shell, /groupSelectors/);
  assert.match(shell, /function setJourney/);
  assert.doesNotMatch(shell, /openGuidedMike/);
  assert.match(css, /source-dossier-player>\.shokker-youtube-player/);
  assert.match(css, /context-popup-timeline/);
});


test("referenced YouTube players stay dormant until their details panel opens", async () => {
  const script = await readFile(new URL("context-companion.js", demo), "utf8");
  const listeners = new Map();
  const inserted = [];
  const playbackCalls = [];
  const guide = {
    insertAdjacentElement(position, section) {
      inserted.push({ position, html: section.html });
    },
  };
  const nav = {
    firstChild: null,
    querySelector() { return null; },
    insertBefore() {},
  };
  const wiki = {
    dataset: {},
    querySelector(selector) {
      if (selector === "#sourceDossierContext") return null;
      if (selector === "#sourceDossierEpisodeGuide") return guide;
      if (selector === ".source-dossier-wiki-recap") return null;
      return null;
    },
    appendChild() {},
  };
  const modal = {
    classList: { contains(value) { return value === "show"; } },
    querySelector(selector) {
      if (selector === ".source-dossier-show-wiki") return wiki;
      if (selector === ".source-dossier-explore div") return nav;
      return null;
    },
    querySelectorAll() { return []; },
  };
  const document = {
    readyState: "complete",
    addEventListener(type, listener) { listeners.set(type, listener); },
    getElementById(id) { return id === "tapeModal" ? modal : null; },
    createElement(tag) {
      if (tag === "a") return {};
      const holder = { firstElementChild: null };
      Object.defineProperty(holder, "innerHTML", {
        set(value) {
          this.firstElementChild = { html: value };
        },
      });
      return holder;
    },
  };
  const window = {
    WWAM_CONTEXT_ATLAS: {
      movies: {},
      recentShows: {
        NEWS0000001: {
          date: "2026-07-28",
          title: "Newest show",
          summary: "A timed source test.",
          coverage: "caption-backed",
          cards: [{
            at: 120,
            title: "Referenced trailer",
            summary: "A bounded external reference.",
            youtubeId: "VIDEO000001",
            claimState: "CONTEXT",
            sourceLabel: "Official trailer",
          }],
        },
      },
    },
    ShokkerYouTubePlayback: {
      iframe(id, options) {
        playbackCalls.push({ id, options });
        return '<div class="shokker-youtube-player"><iframe src="/demo/media-bridge.html?id=' +
          id + '"></iframe></div>';
      },
    },
    setInterval() { return 1; },
    clearInterval() {},
  };
  window.window = window;
  const requestAnimationFrame = (callback) => callback();
  class MutationObserver {
    observe() {}
  }
  runInNewContext(script, {
    window,
    document,
    location: { search: "?source=NEWS0000001", pathname: "/demo/" },
    URL,
    URLSearchParams,
    MutationObserver,
    requestAnimationFrame,
  }, { filename: "context-companion.js" });

  const click = listeners.get("click");
  let duplicateClosestCalls = 0;
  assert.equal(typeof click, "function");
  click({
    defaultPrevented: true,
    target: {
      closest() {
        duplicateClosestCalls += 1;
        return null;
      },
    },
  });
  assert.equal(
    duplicateClosestCalls,
    0,
    "the companion must not run a second scroll path after the dossier handles a jump",
  );

  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].position, "afterend");
  assert.match(inserted[0].html, /data-context-media-provider="youtube"/);
  assert.match(inserted[0].html, /data-context-media-mount="dormant"/);
  assert.match(
    inserted[0].html,
    /href="https:\/\/www\.youtube\.com\/watch\?v=VIDEO000001"/,
  );
  assert.doesNotMatch(inserted[0].html, /<iframe\b/i);
  assert.equal(playbackCalls.length, 0, "closed details never construct a player");

  const attributes = new Map([
    ["data-context-media-provider", "youtube"],
    ["data-context-media-id", "VIDEO000001"],
    ["data-context-media-title", "Referenced trailer"],
  ]);
  const mediaMount = {
    innerHTML: "",
    setAttribute(name, value) { attributes.set(`mount:${name}`, String(value)); },
  };
  const details = {
    open: false,
    matches(selector) { return selector === "details[data-context-media-provider]"; },
    getAttribute(name) { return attributes.get(name) ?? null; },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    querySelector(selector) {
      return selector === "[data-context-media-mount]" ? mediaMount : null;
    },
  };
  const toggle = listeners.get("toggle");
  assert.equal(typeof toggle, "function");
  toggle({ target: details });
  assert.equal(playbackCalls.length, 0, "a closed toggle remains dormant");

  details.open = true;
  toggle({ target: details });
  assert.equal(playbackCalls.length, 1);
  assert.equal(playbackCalls[0].id, "VIDEO000001");
  assert.equal(playbackCalls[0].options.autoplay, false);
  assert.equal(playbackCalls[0].options.title, "Referenced trailer");
  assert.match(mediaMount.innerHTML, /media-bridge\.html\?id=VIDEO000001/);
  assert.equal(attributes.get("data-context-media-mounted"), "true");
  assert.equal(attributes.get("mount:data-context-media-mount"), "mounted");

  toggle({ target: details });
  assert.equal(playbackCalls.length, 1, "reopening reuses the mounted bridge");

  const retryAttributes = new Map([
    ["data-context-media-provider", "youtube"],
    ["data-context-media-id", "RETRY000001"],
    ["data-context-media-title", "Retry trailer"],
  ]);
  const retryMount = {
    innerHTML: "",
    setAttribute(name, value) { retryAttributes.set(`mount:${name}`, String(value)); },
  };
  const retryDetails = {
    open: true,
    matches(selector) { return selector === "details[data-context-media-provider]"; },
    getAttribute(name) { return retryAttributes.get(name) ?? null; },
    setAttribute(name, value) { retryAttributes.set(name, String(value)); },
    querySelector(selector) {
      return selector === "[data-context-media-mount]" ? retryMount : null;
    },
  };
  const workingIframe = window.ShokkerYouTubePlayback.iframe;
  window.ShokkerYouTubePlayback.iframe = () => { throw new Error("bridge loading"); };
  toggle({ target: retryDetails });
  assert.equal(retryAttributes.get("mount:data-context-media-mount"), "held");
  assert.equal(retryAttributes.has("data-context-media-mounted"), false);
  assert.match(retryMount.innerHTML, /EXACT SOURCE LINK BELOW/);

  retryDetails.open = false;
  toggle({ target: retryDetails });
  window.ShokkerYouTubePlayback.iframe = workingIframe;
  retryDetails.open = true;
  toggle({ target: retryDetails });
  assert.equal(retryAttributes.get("data-context-media-mounted"), "true");
  assert.equal(retryAttributes.get("mount:data-context-media-mount"), "mounted");
  assert.match(retryMount.innerHTML, /media-bridge\.html\?id=RETRY000001/);
});
