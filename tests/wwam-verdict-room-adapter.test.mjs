import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  NEUTRAL_RACING_ADAPTER,
  NEUTRAL_RACING_DNA,
} from "./fixtures/channel-pack-neutral-racing.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const runtimeFiles = [
  "wwam-channel-dna.js",
  "wwam-channel-pack-adapter.js",
  "channel-pack-contract.js",
  "longitudinal-docket-data.js",
  "longitudinal-docket-engine.js",
  "verdict-room-engine.js",
  "wwam-verdict-room-adapter.js",
];
const fingerprint = "cp1-dd23bc386008689b";
const key = [
  "shokker.youtube-wiki.wwam.v1",
  fingerprint,
  "verdict-room:v1:active",
].join(":");

function storageFixture(initial = {}) {
  const values = new Map(Object.entries(initial));
  const calls = [];
  return {
    calls,
    values,
    api: {
      getItem(name) {
        calls.push(["get", name]);
        return values.has(name) ? values.get(name) : null;
      },
      setItem(name, value) {
        calls.push(["set", name, String(value)]);
        values.set(name, String(value));
      },
      removeItem(name) {
        calls.push(["remove", name]);
        values.delete(name);
      },
    },
  };
}

function load(storage, files = runtimeFiles) {
  const sandbox = {
    window: {
      localStorage: storage.api,
      setTimeout,
    },
  };
  vm.createContext(sandbox);
  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextTime(iso, milliseconds = 1_000) {
  return new Date(Date.parse(iso) + milliseconds).toISOString();
}

function contextAction(engine) {
  return {
    at: nextTime(engine.session.createdAt),
    reviewer: {
      role: "Editorial reviewer",
      name: "Local human",
      id: "local-reviewer",
      humanAttested: true,
    },
    notes: "This docket needs more whole-work context before a scoped decision.",
  };
}

function fakeStage() {
  const events = [];
  const document = {
    defaultView: {},
    createElement(tag) {
      return {
        tag,
        ownerDocument: document,
        childNodes: [],
        attributes: new Map(),
        hidden: false,
        textContent: "",
        setAttribute(name, value) {
          this.attributes.set(name, String(value));
        },
        replaceChildren(...nodes) {
          this.childNodes = nodes;
        },
      };
    },
  };
  const original = document.createElement("p");
  original.textContent = "VERDICT ROOM FALLBACK";
  const stage = document.createElement("section");
  stage.childNodes = [original];
  stage.dispatchEvent = (event) => {
    events.push(event);
    return true;
  };
  return { document, events, original, stage };
}

test("the WWAM adapter owns canonical inputs, vocabulary, and load order", () => {
  const storage = storageFixture();
  const window = load(storage);
  const adapter = window.WWAMVerdictRoomAdapter;
  window.WWAM_CHANNEL_DNA.entities[0].label = "CALLER MUTATED LABEL";
  window.WWAM_LONGITUDINAL_DOCKETS.channel.packFingerprint =
    "cp1-caller-mutated";
  const engine = adapter.create();
  const status = plain(adapter.getStatus());
  const pack = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER,
  );

  assert.equal(Object.isFrozen(adapter), true);
  assert.equal(window.WWAMVerdictRoomDemo, adapter);
  assert.equal(engine.context.channelPackFingerprint, fingerprint);
  assert.notEqual(pack.fingerprint, fingerprint);
  assert.deepEqual(plain(pack.adjudicationVocabulary), {
    CONTRADICTED: {
      bleep: "AGED LIKE ROADKILL.",
      comedy: "AGED LIKE ROADKILL.",
      formal: "CONTRADICTED WITHIN REVIEWED SCOPE",
    },
    MIXED: {
      bleep: "HALF PROPHET. HALF [BLEEP].",
      comedy: "HALF PROPHET. HALF JACKASS.",
      formal: "MIXED WITHIN REVIEWED SCOPE",
    },
    SUPPORTED: {
      bleep: "CALLED THAT [BLEEP].",
      comedy: "CALLED THAT SHIT.",
      formal: "SUPPORTED WITHIN REVIEWED SCOPE",
    },
  });
  assert.equal(status.storageKey, key);
  assert.equal(status.persistence, "active");
  assert.equal(status.restoreWarning, "");
  assert.throws(
    () => adapter.create({ packet: {}, vocabulary: {} }),
    (error) => error.code === "OPTION_REJECTED",
  );

  const replaced = load(storageFixture());
  assert.throws(
    () => {
      replaced.ShokkerLongitudinalDocket = Object.freeze({
        create: replaced.ShokkerLongitudinalDocket.create,
      });
    },
    TypeError,
  );
  const binding = Object.getOwnPropertyDescriptor(
    replaced,
    "ShokkerLongitudinalDocket",
  );
  assert.equal(binding.writable, false);
  assert.equal(binding.configurable, false);
  assert.doesNotThrow(() => replaced.WWAMVerdictRoomAdapter.create());
});

test("the exact local ledger persists under one deterministic pack key and restores by replay", () => {
  const storage = storageFixture();
  const firstWindow = load(storage);
  const first = firstWindow.WWAMVerdictRoomAdapter.create();
  const docketId = first.getQueue({})[0].id;
  const emptySaved = storage.values.get(key);

  first.markNeedsContext(docketId, contextAction(first));
  const reviewedSaved = storage.values.get(key);

  assert.notEqual(reviewedSaved, emptySaved);
  assert.equal(first.getLedger(docketId).length, 1);
  assert.doesNotMatch(
    reviewedSaved,
    /rawCaption|captionPayload|mediaBlob|cookie|authorization/i,
  );
  assert.equal(
    storage.calls.some(([method]) => method === "remove"),
    false,
  );

  const secondWindow = load(storage);
  const restored = secondWindow.WWAMVerdictRoomAdapter.create();
  const status = plain(secondWindow.WWAMVerdictRoomAdapter.getStatus());

  assert.equal(status.persistence, "restored");
  assert.equal(status.storageKey, key);
  assert.equal(restored.getLedger(docketId).length, 1);
  assert.equal(restored.exportJSON(0), reviewedSaved);
});

test("invalid saved text is visibly held, never removed, accepted, or overwritten", () => {
  for (const rejected of ["{not-json", ""]) {
    const storage = storageFixture({ [key]: rejected });
    const window = load(storage);
    const adapter = window.WWAMVerdictRoomAdapter;
    const engine = adapter.create();
    const status = plain(adapter.getStatus());
    const docketId = engine.getQueue({})[0].id;

    assert.equal(status.persistence, "blocked-invalid-saved-ledger");
    assert.match(status.restoreWarning, /SAVED LEDGER HELD/);
    assert.match(status.restoreWarning, /failed|rejected|invalid/i);
    assert.equal(storage.values.get(key), rejected);

    engine.markNeedsContext(docketId, contextAction(engine));
    assert.equal(storage.values.get(key), rejected);
    assert.equal(
      storage.calls.some(([method]) => method === "remove"),
      false,
    );
    assert.match(engine.exportJSON(0), /verdict-room-export\/v1/);
  }
});

test("a confirmed valid restore preserves the rejected text under a deterministic held key", () => {
  const validStorage = storageFixture();
  const validWindow = load(validStorage);
  const canonical = validWindow.WWAMVerdictRoomAdapter.create().exportJSON(0);
  const rejected = "{definitely-not-a-ledger";
  const storage = storageFixture({ [key]: rejected });
  const window = load(storage);
  const creates = [];
  window.ShokkerVerdictRoomUI = Object.freeze({
    create(options) {
      creates.push(options);
      return {
        mount() {
          return this;
        },
        destroy() {},
      };
    },
  });
  const dom = fakeStage();
  const adapter = window.WWAMVerdictRoomAdapter;

  adapter.mount(dom.stage);
  assert.equal(adapter.getStatus().persistence, "blocked-invalid-saved-ledger");
  const restored = creates[0].restoreSession(canonical);
  const status = plain(adapter.getStatus());

  assert.equal(status.persistence, "restored");
  assert.equal(status.heldStorageKey, `${key}:held-invalid`);
  assert.equal(storage.values.get(status.heldStorageKey), rejected);
  assert.equal(storage.values.get(key), restored.exportJSON(0));
  assert.equal(
    storage.calls.some(([method]) => method === "remove"),
    false,
  );
});

test("storage failure degrades visibly to memory-only review and keeps export available", () => {
  const storage = {
    api: {
      getItem() {
        throw new Error("storage denied");
      },
      setItem() {
        throw new Error("storage denied");
      },
    },
  };
  const window = load(storage);
  const adapter = window.WWAMVerdictRoomAdapter;
  const engine = adapter.create();
  const status = plain(adapter.getStatus());

  assert.equal(status.persistence, "memory-only");
  assert.match(status.restoreWarning, /STORAGE UNAVAILABLE/);
  assert.match(engine.exportJSON(0), /verdict-room-export\/v1/);
});

test("exact subjects queue before mount, remount safely, and never fuzzy-match", () => {
  const storage = storageFixture();
  const window = load(storage);
  const creates = [];
  const controllers = [];
  window.ShokkerVerdictRoomUI = Object.freeze({
    create(options) {
      creates.push(options);
      const controller = {
        destroyCount: 0,
        mountCount: 0,
        destroy() {
          this.destroyCount += 1;
        },
        mount() {
          this.mountCount += 1;
          return this;
        },
      };
      controllers.push(controller);
      return controller;
    },
  });
  const adapter = window.WWAMVerdictRoomAdapter;
  const dom = fakeStage();

  assert.equal(adapter.open("Scream 7"), false);
  assert.equal(adapter.open("film:scream-7"), true);
  const first = adapter.mount(dom.stage);
  assert.equal(first, controllers[0]);
  assert.equal(
    creates[0].initialDocketId,
    "docket:scream-7-commentary-plan-open",
  );
  assert.equal(creates[0].engine, adapter.create());
  assert.equal(typeof creates[0].restoreSession, "function");
  assert.equal(typeof creates[0].download, "function");
  assert.equal(dom.stage.childNodes.length, 2);

  assert.equal(adapter.open("film:halloween-ends"), true);
  assert.equal(controllers[0].destroyCount, 1);
  assert.equal(
    creates[1].initialDocketId,
    "docket:halloween-ends-excitement-to-mixed-reaction",
  );
  assert.equal(adapter.open("film:halloween"), false);
  assert.throws(
    () => adapter.mount(dom.stage, { channelPack: {} }),
    (error) => error.code === "OPTION_REJECTED",
  );

  adapter.destroy();
  adapter.destroy();
  assert.equal(controllers[1].destroyCount, 1);
  assert.deepEqual(dom.stage.childNodes, [dom.original]);
});

test("the universal ChannelPack carries a neutral racing verdict map with no WWAM leakage", () => {
  const storage = storageFixture();
  const window = load(storage, ["channel-pack-contract.js"]);
  const racing = window.ShokkerChannelPack.compile(
    NEUTRAL_RACING_DNA,
    NEUTRAL_RACING_ADAPTER,
  );
  const serialized = window.ShokkerChannelPack.serialize(racing);

  assert.equal(racing.identity.id, "sample-racing");
  assert.deepEqual(plain(racing.adjudicationVocabulary), {
    CONTRADICTED: {
      bleep: "THE REPLAY OVERTURNED THE CALL.",
      comedy: "THE REPLAY OVERTURNED THE CALL.",
      formal: "CONTRADICTED // CALL OVERTURNED",
    },
    MIXED: {
      bleep: "THE REPLAY SPLIT THE CALL.",
      comedy: "THE REPLAY SPLIT THE CALL.",
      formal: "MIXED // SPLIT DECISION",
    },
    SUPPORTED: {
      bleep: "THE REPLAY BACKS THE CALL.",
      comedy: "THE REPLAY BACKS THE CALL.",
      formal: "SUPPORTED // CALL UPHELD",
    },
  });
  assert.equal(
    racing.capabilities.includes("human-adjudication-ledger"),
    true,
  );
  assert.doesNotMatch(
    serialized,
    /WWAM|Scream|Halloween|Loomis|horror|roadkill|jackass|shit|UP IN YA/i,
  );
});
