import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(demo, "tape-companion-ui.js"), "utf8");
const css = fs.readFileSync(path.join(demo, "tape-companion.css"), "utf8");

function loadCompanionRuntime() {
  const elementIds = [
    "companion",
    "companionProof",
    "companionSourceSearch",
    "companionSourceList",
    "companionLatest",
    "companionResume",
    "companionPlayer",
    "companionClock",
    "companionStatus",
    "companionManualTime",
    "companionOfficial",
    "companionShare",
    "companionFallback",
    "companionMemoryTitle",
    "companionHeat",
    "companionNow",
    "companionNext",
    "companionHistory",
  ];
  const elements = new Map(elementIds.map((id) => {
    const listeners = new Map();
    return [id, {
      id,
      disabled: true,
      href: "",
      innerHTML: "",
      max: "",
      textContent: "",
      value: "",
      attributes: new Map(),
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      getAttribute(name) {
        return this.attributes.get(name) || "";
      },
      querySelectorAll() {
        return [];
      },
      setAttribute(name, value) {
        this.attributes.set(name, String(value));
      },
    }];
  }));
  const source = {
    id: "5et_A1tYnio",
    title: "SCREAM 4 Movie COMMENTARY",
    date: "2019-06-18",
    type: "commentary",
    lane: "commentary",
    lanes: ["commentary"],
    durationSeconds: 6507,
    readiness: {
      status: "companion-ready",
      label: "COMPANION READY",
      limitation: "",
    },
    counts: {
      exactReceiptMembers: 8,
      heatWindows: 4,
    },
  };
  const metadataSource = {
    id: "FVuwRHM0kcc",
    title: "Marvel VS DC Movies Bracket Tournament",
    date: "2026-05-26",
    type: "livestream",
    lane: "archive-metadata",
    lanes: ["archive-metadata"],
    durationSeconds: 11427,
    readiness: {
      status: "limited",
      label: "SOURCE ONLY",
      limitation: "No timed memory is registered for this source.",
    },
    counts: {
      exactReceiptMembers: 0,
      heatWindows: 0,
    },
  };
  const playbackCalls = [];
  const rootListeners = new Map();
  const storage = new Map();
  const engine = {
    archiveFingerprint: "test-fingerprint",
    metrics: {
      sources: 2,
      companionReady: 1,
      limited: 1,
      exactReceiptMembers: 8,
      exactIncidents: 8,
      heatWindows: 4,
    },
    listSources() {
      return [source, metadataSource];
    },
    snapshotAt(sourceId, seconds) {
      const selected = [source, metadataSource].find((item) => item.id === sourceId);
      if (!selected) return null;
      return {
        seconds,
        source: { id: selected.id },
        readiness: selected.readiness,
        currentHeat: null,
        activeEvents: [],
        future: { next: null },
        history: [],
      };
    },
    crossedEvents() {
      return { mode: "crossing", events: [] };
    },
    serializeShareState(sourceId, seconds) {
      return `${sourceId}:${seconds}`;
    },
    restoreShareState() {
      return { ok: false, code: "NOT_USED" };
    },
  };
  const document = {
    body: {
      classList: {
        contains() {
          return false;
        },
      },
    },
    getElementById(id) {
      return elements.get(id) || null;
    },
  };
  const window = {
    WWAMShowcaseEngine: {
      create() {
        return {};
      },
    },
    WWAMTapeCompanionEngine: {
      create() {
        return engine;
      },
    },
    ShokkerYouTubePlayback: {
      hosted() {
        return false;
      },
      iframe(sourceId, options) {
        playbackCalls.push({ sourceId, options });
        return "<iframe></iframe>";
      },
    },
    addEventListener(type, listener) {
      const listeners = rootListeners.get(type) || [];
      listeners.push(listener);
      rootListeners.set(type, listeners);
    },
  };
  const location = {
    href: "https://wiki.example/demo/",
    search: "",
  };
  const sandbox = {
    URL,
    URLSearchParams,
    clearInterval,
    clearTimeout,
    document,
    globalThis: window,
    localStorage: {
      getItem(key) {
        return storage.get(key) || null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
    },
    location,
    navigator: {},
    setInterval,
    setTimeout,
    window,
  };
  vm.createContext(sandbox);
  vm.runInContext(ui, sandbox, { filename: "tape-companion-ui.js" });
  return {
    elements,
    playbackCalls,
    emit(type, detail) {
      (rootListeners.get(type) || []).forEach((listener) => listener({ detail }));
    },
  };
}

test("Tape Companion lazy-loads as one coherent synchronized surface", () => {
  assert.match(
    html,
    /id="companion"[\s\S]{0,180}data-feature-styles="tape-companion\.css"[\s\S]{0,180}data-feature-scripts="archive-atlas-data\.js,red-band-ranking-v2\.js,tape-companion-engine\.js,tape-companion-ui\.js"/,
  );
  for (const id of [
    "companionProof",
    "companionSourceSearch",
    "companionSourceList",
    "companionPlayer",
    "companionManualTime",
    "companionOfficial",
    "companionShare",
    "companionHeat",
    "companionNow",
    "companionNext",
    "companionHistory",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /href="#companion">WATCH WITH MEMORY/);
  assert.match(html, /SEARCH ALL 510 REGISTERED SOURCES/);
});

test("the UI binds official playback to snapshot-safe engine calls", () => {
  assert.match(ui, /WWAMTapeCompanionEngine\.create\(buildInputs\(\)/);
  assert.match(ui, /var atlas = root\.WWAM_ARCHIVE_ATLAS \|\| \{\}/);
  assert.match(ui, /sources: registeredSources/);
  assert.match(ui, /record\.coverage === "deeply-indexed"/);
  assert.match(ui, /engine\.crossedEvents\(activeSource\.id, previousSecond, nextSecond\)/);
  assert.match(ui, /engine\.snapshotAt\(activeSource\.id, nextSecond\)/);
  assert.match(ui, /future && snapshot\.future\.next/);
  assert.match(ui, /NEXT INDEXED DISTURBANCE \/\/ TEXT SEALED/);
  assert.doesNotMatch(ui, /compileTimeline\(/);
  assert.match(
    ui,
    /ShokkerYouTubePlayback\.playerVars\(\{\s*autoplay:\s*false,\s*start:\s*startAt/
  );
  assert.match(ui, /Math\.abs\(value - currentSecond\) < 0\.2/);
  assert.match(ui, /Math\.abs\(currentSecond - lastPersistSecond\) < 5/);
  assert.match(ui, /root\.addEventListener\("pagehide"/);
  assert.match(ui, /sourceUrl\(snapshot\.source\.id, currentSecond\)/);
  assert.match(ui, /MANUAL SYNC/);
  assert.match(ui, /if \(code === 153\)/);
  assert.match(ui, /PLAYER IDENTITY ERROR 153 RECOVERED/);
  assert.match(html, /id="companionStatus" role="status" aria-live="polite"/);
  assert.doesNotMatch(html, /id="companionProof" aria-live/);
  assert.doesNotMatch(html, /id="companionHistory" aria-live/);
});

test("Source Dossier handoffs select only a registered source at the exact second", () => {
  const runtime = loadCompanionRuntime();
  assert.equal(runtime.playbackCalls.length, 0, "hydration must not start playback");

  runtime.emit("wwam:tape-companion-open", {
    sourceId: "5et_A1tYnio",
    at: 5406,
  });

  assert.equal(runtime.playbackCalls.length, 1);
  assert.equal(runtime.playbackCalls[0].sourceId, "5et_A1tYnio");
  assert.equal(runtime.playbackCalls[0].options.start, 5406);
  assert.equal(runtime.playbackCalls[0].options.autoplay, false);
  assert.equal(runtime.elements.get("companionManualTime").value, "5406");
  assert.match(runtime.elements.get("companionOfficial").href, /5et_A1tYnio&t=5406s$/);
  assert.equal(
    runtime.elements.get("companionStatus").textContent,
    "SOURCE DOSSIER HANDOFF // EXACT SECOND LOADED // PRESS PLAY WHEN READY",
  );

  runtime.emit("wwam:tape-companion-open", {
    sourceId: "not-in-the-snapshot",
    at: 12,
  });
  assert.equal(runtime.playbackCalls.length, 1, "unknown sources must fail closed");
  assert.equal(
    runtime.elements.get("companionStatus").textContent,
    "SOURCE NOT PRESENT IN THIS COMPANION SNAPSHOT",
  );

  runtime.emit("wwam:tape-companion-open", {
    sourceId: "FVuwRHM0kcc",
    at: 0,
  });
  assert.equal(runtime.playbackCalls.length, 2);
  assert.equal(runtime.playbackCalls[1].sourceId, "FVuwRHM0kcc");
  assert.equal(runtime.playbackCalls[1].options.start, 0);
  assert.equal(
    runtime.elements.get("companionStatus").textContent,
    "SOURCE-ONLY TAPE LOADED // PLAYBACK READY // TIMED MEMORY HELD",
  );

  runtime.emit("wwam:tape-companion-open", {
    sourceId: "5et_A1tYnio",
    at: Number.POSITIVE_INFINITY,
  });
  assert.equal(runtime.playbackCalls.length, 2, "invalid times must not remount the player");
  assert.equal(
    runtime.elements.get("companionStatus").textContent,
    "SOURCE DOSSIER HANDOFF HELD // INVALID SOURCE OR TIME",
  );
});

test("share and resume state use the engine's bound restore contract", () => {
  assert.match(ui, /engine\.serializeShareState\(activeSource\.id, currentSecond\)/);
  assert.match(ui, /engine\.restoreShareState\(token\)/);
  assert.match(ui, /url\.searchParams\.set\("companion", token\)/);
  assert.match(ui, /"wwam:tape-companion:" \+ engine\.archiveFingerprint/);
  assert.match(ui, /SHARED TAPE HELD/);
});

test("annotations preserve ranking, curation, character, and Lore semantics", () => {
  assert.match(ui, /RED BAND #/);
  assert.match(ui, /MACHINE CANDIDATE/);
  assert.match(ui, /UP IN YA \/\/ EDITORIAL SELECTION/);
  assert.match(ui, /CLIP SPEAKER NOT DIARIZED/);
  assert.match(ui, /ARCHIVE CONNECTION/);
  assert.match(ui, /DERIVED HEAT WINDOW \/\/ NOT AUDIENCE TRUTH/);
  assert.match(ui, /displayText\(subject\.excerpt\)/);
});

test("fused incidents present the latest revealed member without dropping incident badges", () => {
  assert.match(ui, /function presentationMember\(event\)/);
  assert.match(ui, /event\.latestRevealedMemberId/);
  assert.match(ui, /Number\(member\.at\) <= currentSecond/);
  assert.match(ui, /var subject = presentationMember\(event\)/);
  assert.match(ui, /var badges = annotationBadges\(event\)/);
  assert.match(ui, /subject\.label/);
  assert.match(ui, /subject\.excerpt/);
  assert.match(ui, /subject\.url/);
});

test("the companion layout collapses for tablet and phone widths", () => {
  assert.match(css, /\.companion-shell\s*\{[\s\S]{0,180}grid-template-columns:/);
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*?\.companion-shell\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /@media \(max-width: 600px\)[\s\S]*?\.companion-transport\s*\{\s*grid-template-columns:\s*1fr;/,
  );
});
