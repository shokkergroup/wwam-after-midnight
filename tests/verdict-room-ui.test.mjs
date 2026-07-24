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
const demo = path.resolve(here, "../public/demo");
const uiSource = fs.readFileSync(
  path.join(demo, "verdict-room-ui.js"),
  "utf8",
);
const cssSource = fs.readFileSync(
  path.join(demo, "verdict-room.css"),
  "utf8",
);
const DOCKET_ID = "docket:two-source-courtroom";
const SESSION = Object.freeze({
  id: "local-verdict-room-ui",
  name: "Two-Tape Verdict Room",
  createdAt: "2026-07-24T00:00:00Z",
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((output, key) => {
      output[key] = stableValue(value[key]);
      return output;
    }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function selectorParts(selector) {
  if (selector.startsWith("#")) {
    return { id: selector.slice(1) };
  }
  const match = selector.match(
    /^(?:([a-z0-9-]+))?(?:\[([a-z0-9-]+)(?:="([^"]*)")?\])?(?::checked)?$/i,
  );
  if (!match) throw new Error(`Unsupported fake selector: ${selector}`);
  return {
    tag: match[1] ? match[1].toUpperCase() : "",
    attribute: match[2] || "",
    value: match[3],
    checked: selector.endsWith(":checked"),
  };
}

function matchesSelector(node, selector) {
  if (!node || node.nodeType !== 1) return false;
  const parts = selectorParts(selector);
  if (parts.id) return node.getAttribute("id") === parts.id;
  if (parts.tag && node.tagName !== parts.tag) return false;
  if (parts.attribute) {
    if (!node.hasAttribute(parts.attribute)) return false;
    if (
      parts.value !== undefined &&
      node.getAttribute(parts.attribute) !== parts.value
    ) {
      return false;
    }
  }
  return !parts.checked || node.checked === true;
}

class FakeNode {
  constructor(documentRef, nodeType, tagName = "") {
    this.ownerDocument = documentRef;
    this.nodeType = nodeType;
    this.tagName = tagName.toUpperCase();
    this.parentNode = null;
    this.childNodes = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this._text = "";
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.required = false;
    this.open = false;
    this.focusCount = 0;
  }

  get textContent() {
    if (this.nodeType === 3) return this._text;
    return this._text + this.childNodes.map((child) => child.textContent).join("");
  }

  set textContent(value) {
    this._text = String(value ?? "");
    this.childNodes.forEach((child) => {
      child.parentNode = null;
    });
    this.childNodes = [];
  }

  appendChild(child) {
    assert.ok(child instanceof FakeNode, "DOM children must be nodes");
    if (child.parentNode) child.remove();
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  replaceChildren(...children) {
    this._text = "";
    this.childNodes.forEach((child) => {
      child.parentNode = null;
    });
    this.childNodes = [];
    children.forEach((child) => this.appendChild(child));
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.childNodes.indexOf(this);
    if (index >= 0) this.parentNode.childNodes.splice(index, 1);
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === "value") this.value = String(value);
    if (name === "checked") this.checked = true;
    if (name === "disabled") this.disabled = true;
    if (name === "hidden") this.hidden = true;
    if (name === "open") this.open = true;
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "checked") this.checked = false;
    if (name === "disabled") this.disabled = false;
    if (name === "hidden") this.hidden = false;
    if (name === "open") this.open = false;
  }

  addEventListener(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(listener);
  }

  removeEventListener(name, listener) {
    if (this.listeners.has(name)) this.listeners.get(name).delete(listener);
  }

  contains(node) {
    let current = node;
    while (current) {
      if (current === this) return true;
      current = current.parentNode;
    }
    return false;
  }

  querySelectorAll(selector) {
    const output = [];
    const visit = (node) => {
      node.childNodes.forEach((child) => {
        if (matchesSelector(child, selector)) output.push(child);
        visit(child);
      });
    };
    visit(this);
    return output;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  focus() {
    this.focusCount += 1;
    this.ownerDocument.activeElement = this;
  }

  showModal() {
    this.open = true;
    this.setAttribute("open", "");
  }

  close() {
    this.open = false;
    this.removeAttribute("open");
  }
}

function makeDom() {
  const documentRef = {
    activeElement: null,
    createElement(tag) {
      return new FakeNode(documentRef, 1, tag);
    },
    createTextNode(value) {
      const node = new FakeNode(documentRef, 3);
      node._text = String(value);
      return node;
    },
  };
  documentRef.body = documentRef.createElement("body");
  const outside = documentRef.createElement("button");
  outside.textContent = "MEMORY OS";
  documentRef.body.appendChild(outside);
  const mount = documentRef.createElement("div");
  documentRef.body.appendChild(mount);
  const original = documentRef.createElement("p");
  original.textContent = "ORIGINAL MEMORY OS PANEL";
  mount.appendChild(original);
  outside.focus();

  function dispatch(type, target) {
    const event = {
      type,
      target,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    const listeners = mount.listeners.get(type) || new Set();
    listeners.forEach((listener) => listener(event));
    return event;
  }

  return { document: documentRef, mount, original, outside, dispatch };
}

function loadRuntime() {
  const sandbox = { window: {} };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  for (const file of [
    "wwam-channel-dna.js",
    "wwam-channel-pack-adapter.js",
    "channel-pack-contract.js",
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  }
  sandbox.window.ShokkerLongitudinalDocket = Object.freeze({
    create(options) {
      if (
        typeof sandbox.window.__VERDICT_UI_ENGINE_PROVIDER !== "function"
      ) {
        throw new Error("Verdict UI test engine provider is not registered.");
      }
      return sandbox.window.__VERDICT_UI_ENGINE_PROVIDER(options);
    },
  });
  for (const file of ["verdict-room-engine.js", "verdict-room-ui.js"]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  }
  return sandbox.window;
}

function compilePack(runtime, mode) {
  const dna = clone(
    mode === "racing" ? NEUTRAL_RACING_DNA : runtime.WWAM_CHANNEL_DNA,
  );
  const adapter = clone(
    mode === "racing"
      ? NEUTRAL_RACING_ADAPTER
      : runtime.WWAM_CHANNEL_PACK_ADAPTER,
  );
  if (!adapter.capabilities.includes("human-adjudication-ledger")) {
    adapter.capabilities.push("human-adjudication-ledger");
  }
  return runtime.ShokkerChannelPack.compile(dna, adapter);
}

function packetFor(pack, mode) {
  const racing = mode === "racing";
  const subject = pack.entityRegistry[0];
  return {
    channel: {
      id: pack.identity.id,
      label: pack.identity.label,
      packFingerprint: pack.fingerprint,
    },
    labels: clone(pack.longitudinalVocabulary),
    docket: {
      id: DOCKET_ID,
      title: `${subject.label} // ${pack.longitudinalVocabulary.forecast} ` +
        `\u2192 ${pack.longitudinalVocabulary.response}`,
      claimId: "claim:before",
      responseId: "response:after",
      subjects: [subject.id],
      relationship: "MAY_RESOLVE",
      pairSignal: "MAY_BE_MIXED",
      pairBasis: [],
      chronology: {
        forecastDate: "2026-07-01",
        responseDate: "2026-07-08",
        daysBetween: 7,
      },
      verdict: null,
      resolutionStatus: "unresolved",
      reviewStatus: "machine-paired-unreviewed",
      resolutionBlockedBy: ["human-review-required"],
      requiresOutcomeVerification: true,
      requiresWholeWorkVisualReview: false,
      speaker: null,
      promotionAllowed: false,
    },
    forecast: {
      candidate: {
        id: "claim:before",
        sourceId: "AAAAAAAAAAA",
        t: 61.25,
        url: "https://www.youtube.com/watch?v=AAAAAAAAAAA&t=61s",
        excerpt: racing
          ? "this fuel call should get the truck to the finish"
          : "the finished work should land this specific idea",
        subjects: [subject.id],
        additionalReceipts: [],
        speaker: null,
        promotionAllowed: false,
      },
      source: {
        id: "AAAAAAAAAAA",
        title: racing ? "Feature Race Preview" : "Preview Tape",
        date: "2026-07-01",
        rightsMode: "standard-caption-candidates",
        contentMode: racing ? "feature-race" : "preview",
      },
    },
    response: {
      candidate: {
        id: "response:after",
        sourceId: "BBBBBBBBBBB",
        t: 125.75,
        url: "https://www.youtube.com/watch?v=BBBBBBBBBBB&t=125s",
        excerpt: racing
          ? "the fuel call worked and the truck made the finish"
          : "the finished work landed that specific idea",
        subjects: [subject.id],
        additionalReceipts: [{
          id: "receipt:counterweight",
          sourceId: "BBBBBBBBBBB",
          t: 300.5,
          url: "https://www.youtube.com/watch?v=BBBBBBBBBBB&t=300s",
          excerpt: racing
            ? "the same strategy also left the truck exposed late"
            : "another section pulled against that response",
        }],
        speaker: null,
        promotionAllowed: false,
      },
      source: {
        id: "BBBBBBBBBBB",
        title: racing ? "Feature Race Broadcast" : "Response Tape",
        date: "2026-07-08",
        rightsMode: "standard-caption-candidates",
        contentMode: racing ? "feature-race" : "feature-response",
      },
    },
    schema: "shokker-youtube-wiki/longitudinal-docket-inspection/v1",
    fingerprint: "fnv1a32:11223344",
  };
}

function fixture(mode = "neutral") {
  const runtime = loadRuntime();
  const pack = compilePack(runtime, mode);
  const packet = packetFor(pack, mode);
  const data = {
    schema: "shokker-youtube-wiki/longitudinal-docket-data/v1",
    channel: {
      id: pack.identity.id,
      packFingerprint: pack.fingerprint,
    },
    fingerprints: {
      publicFnv1a: "fnv1a32:55667788",
      captionSetSha256: `sha256:${"a".repeat(64)}`,
    },
    dockets: [{ id: DOCKET_ID }],
  };
  const docketEngine = Object.freeze({
    inspect(id) {
      return id === DOCKET_ID ? clone(packet) : null;
    },
    verify(value) {
      if (arguments.length === 0) return { ok: true };
      return { ok: stableJson(value) === stableJson(packet) };
    },
    serialize(value) {
      assert.equal(this.verify(value).ok, true);
      return stableJson(value);
    },
  });
  runtime.__VERDICT_UI_ENGINE_PROVIDER = function (request) {
      assert.equal(request.channelPack, pack);
      assert.deepEqual(clone(request.data), clone(data));
      return docketEngine;
  };
  const options = {
    channelPack: pack,
    docketData: data,
    session: {
      ...clone(SESSION),
      name: mode === "racing"
        ? "Replay Review Session"
        : SESSION.name,
    },
  };
  const room = runtime.ShokkerVerdictRoom.create(options);
  return { data, docketEngine, options, pack, packet, room, runtime };
}

function clock() {
  let tick = 0;
  return () => new Date(
    Date.parse(SESSION.createdAt) + (++tick * 60_000),
  ).toISOString();
}

function human(next, notes = "Human reviewed this exact bounded event.") {
  return {
    at: next(),
    reviewer: {
      role: "editor",
      name: "Local Reviewer",
      id: "reviewer-local",
      humanAttested: true,
    },
    notes,
  };
}

function dispositions(room) {
  return room.getDocket(DOCKET_ID).requiredReceipts.map((receipt) => ({
    receiptId: receipt.id,
    disposition: receipt.role === "ADDITIONAL_RESPONSE"
      ? "CONTEXT_ONLY"
      : "RELIED_ON",
    stance: receipt.role === "FORECAST"
      ? "PROPOSITION"
      : receipt.role === "RESPONSE"
        ? "SUPPORTING"
        : "NEUTRAL",
    reason: `Human reviewed ${receipt.role.toLowerCase()} in context.`,
  }));
}

function completeEvidence(room, next) {
  for (const code of room.policy.checkCodes.filter(
    (entry) => entry !== "PUBLIC_WORDING",
  )) {
    const action = {
      ...human(next, `Human passed ${code}.`),
      code,
      status: "PASS",
    };
    if (code === "CONTRADICTION_SWEEP") {
      action.receiptDispositions = dispositions(room);
    }
    if (code === "OUTCOME_REVIEW") {
      action.outcomeReview = {
        method: "WHOLE_WORK_REVIEW",
        sourceReference: "The exact registered whole-work source.",
        notes: "The human checked the bounded outcome in context.",
      };
    }
    room.recordCheck(DOCKET_ID, action);
  }
}

function adjudicationAction(room, next, verdictCode = "SUPPORTED") {
  const review = room.getDocket(DOCKET_ID).review;
  return {
    ...human(next),
    verdictCode,
    expectedRevision: review.revision,
    wording: review.wording,
    wordingEventId: review.wordingEventId,
    checkEventIds: review.checks.map((check) => check.eventId),
  };
}

function setActor(dom, next) {
  const values = {
    role: "editor",
    name: "Local Reviewer",
    id: "reviewer-local",
    at: next(),
    notes: "Human selected this exact scoped local event.",
  };
  for (const [key, value] of Object.entries(values)) {
    dom.mount.querySelector(`[data-vr-model="${key}"]`).value = value;
  }
  dom.mount.querySelector('[data-vr-model="humanAttested"]').checked = true;
  dom.dispatch(
    "input",
    dom.mount.querySelector('[data-vr-model="notes"]'),
  );
}

function mounted(current, options = {}) {
  const dom = makeDom();
  const downloads = [];
  const controller = current.runtime.ShokkerVerdictRoomUI.create({
    engine: current.room,
    document: dom.document,
    mount: dom.mount,
    download(name, contents, mime) {
      downloads.push({ name, contents, mime });
    },
    restoreSession: options.restoreSession,
  });
  controller.mount();
  return { ...current, ...dom, controller, downloads };
}

test("the isolated module is channel-neutral, DOM-safe, and staged 3/8/1", () => {
  const runtime = loadRuntime();
  const copy = runtime.ShokkerVerdictRoomUI.CHECK_COPY;
  const stages = Object.values(copy).reduce((output, entry) => {
    output[entry.stage] = (output[entry.stage] || 0) + 1;
    return output;
  }, {});

  assert.equal(runtime.ShokkerVerdictRoomUI.VERSION, "1.0.0");
  assert.deepEqual(stages, { identity: 3, evidence: 8, wording: 1 });
  assert.doesNotMatch(
    uiSource,
    /\b(?:innerHTML|outerHTML|insertAdjacentHTML)\b/,
  );
  assert.doesNotMatch(uiSource, /\.on[a-z]+\s*=/);
  assert.doesNotMatch(
    uiSource,
    /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/,
  );
  assert.doesNotMatch(
    uiSource,
    /WWAM|CALLED THAT|ROADKILL|JACKASS|Ghostface|Halloween/i,
  );
  for (const code of runtime.ShokkerVerdictRoom.CHECK_CODES) {
    assert.ok(Object.hasOwn(copy, code), code);
  }
});

test("the first screen is a two-source courtroom with exact bindings and zero verdict", () => {
  const harness = mounted(fixture());
  const markup = harness.mount.textContent;
  const docket = harness.room.getDocket(DOCKET_ID);
  const adjudicate = harness.mount.querySelector(
    '[data-vr-action="open-adjudicate"]',
  );

  assert.equal(harness.document.activeElement, harness.outside);
  assert.match(markup, /DEVICE-LOCAL HUMAN OVERLAY/);
  assert.match(markup, /NOT CANON · NOT PUBLISHED · NOT IDENTITY-VERIFIED/);
  assert.match(markup, /AUTOMATION DISCLOSURE/);
  assert.match(
    markup,
    /A caller-attested human alone selects every check, exact wording, and local verdict/,
  );
  assert.match(markup, /No AI or automation decides or publishes a result/);
  assert.match(markup, /THE TWO-SOURCE COURTROOM/);
  assert.match(markup, /BEFORE SOURCE \/\/ BOUNDED PROPOSITION/);
  assert.match(markup, /AFTER SOURCE \/\/ BOUNDED RESPONSE/);
  assert.ok(
    markup.indexOf("BEFORE SOURCE") < markup.indexOf("HUMAN REVIEW"),
    "evidence must visually lead the workflow",
  );
  assert.match(markup, /NO AUTOPLAY/);
  assert.match(markup, new RegExp(docket.binding.bindingHash));
  assert.match(markup, new RegExp(docket.binding.packetHash));
  assert.match(markup, new RegExp(harness.room.context.reviewInputHash));
  assert.match(markup, new RegExp(harness.room.context.vocabularyHash));
  assert.match(markup, new RegExp(harness.room.context.targetSetHash));
  assert.match(markup, /claim:before \/\/ response:after/);
  assert.match(markup, /PUBLIC VERDICT WITHHELD/);
  assert.match(markup, /ZERO ACTIVE VERDICTS FOR THIS DOCKET/);
  assert.match(markup, /0\/12 PASS/);
  assert.equal(adjudicate.disabled, true);
  assert.doesNotMatch(markup, /LOCAL CALL UPHELD/);
  assert.equal(
    harness.mount.querySelectorAll("[data-vr-receipt]").length,
    0,
    "receipt disposition controls stay closed until their exact check opens",
  );
});

test("all 12 checks precede confirmation; cancel restores focus; adjudication and revoke are honest", () => {
  const current = fixture();
  const next = clock();
  completeEvidence(current.room, next);
  const harness = mounted(current);

  assert.match(harness.mount.textContent, /11\/12 PASS/);
  assert.doesNotMatch(harness.mount.textContent, /LOCAL CALL UPHELD/);
  const wording = harness.mount.querySelector("[data-vr-wording]");
  assert.equal(wording.disabled, false);
  setActor(harness, next);
  const wordingCode = harness.mount.querySelector(
    '[data-vr-verdict-code="SUPPORTED"]',
  );
  assert.equal(wordingCode.disabled, false);
  wordingCode.checked = true;
  harness.dispatch("change", wordingCode);
  assert.equal(
    wording.value,
    current.room.policy.wordingByVerdictCode.SUPPORTED,
  );
  harness.dispatch(
    "submit",
    harness.mount.querySelector('[data-vr-form="wording"]'),
  );
  assert.match(harness.mount.textContent, /12\/12 PASS/);
  assert.doesNotMatch(harness.mount.textContent, /LOCAL CALL UPHELD/);

  setActor(harness, next);
  const radio = harness.mount.querySelector(
    '[data-vr-verdict-code="SUPPORTED"]',
  );
  assert.equal(radio.checked, true);
  assert.equal(radio.disabled, true);
  const opener = harness.mount.querySelector(
    '[data-vr-action="open-adjudicate"]',
  );
  assert.equal(opener.disabled, false);
  opener.focus();
  harness.dispatch("click", opener);

  const dialog = harness.mount.querySelector("[data-vr-dialog]");
  const cancel = harness.mount.querySelector(
    '[data-vr-action="cancel-dialog"]',
  );
  assert.equal(dialog.open, true);
  assert.match(dialog.textContent, new RegExp(DOCKET_ID));
  assert.match(dialog.textContent, /device-local overlay only/i);
  assert.match(dialog.textContent, /BOUND REVISION1/);
  assert.match(
    dialog.textContent,
    /EXACT LOCKED WORDING \/ REASONWithin this reviewed docket/,
  );
  const boundReview = current.room.getDocket(DOCKET_ID).review;
  assert.match(dialog.textContent, new RegExp(boundReview.wordingEventId));
  for (const check of boundReview.checks) {
    assert.match(dialog.textContent, new RegExp(check.eventId));
  }
  assert.match(
    dialog.querySelector('[data-vr-action="confirm-dialog"]').textContent,
    /APPEND EXACT LOCAL VERDICT/,
  );
  harness.dispatch("click", cancel);
  assert.equal(dialog.open, false);
  assert.equal(harness.document.activeElement, opener);

  harness.dispatch("click", opener);
  const confirm = harness.mount.querySelector(
    '[data-vr-action="confirm-dialog"]',
  );
  harness.dispatch("click", confirm);
  assert.equal(current.room.getPublicProjection(DOCKET_ID).state, "ADJUDICATED");
  const decision = current.room.getLedger(DOCKET_ID).at(-1);
  assert.equal(decision.type, "ADJUDICATE");
  assert.equal(decision.payload.expectedRevision, boundReview.revision);
  assert.equal(decision.payload.wording, boundReview.wording);
  assert.equal(decision.payload.wordingEventId, boundReview.wordingEventId);
  assert.deepEqual(
    Array.from(decision.payload.checkEventIds),
    Array.from(boundReview.checks, (check) => check.eventId),
  );
  assert.match(
    harness.mount.textContent,
    /SUPPORTED WITHIN REVIEWED SCOPE/,
  );
  assert.match(harness.mount.textContent, /CALLED THAT SHIT\./);
  assert.match(
    harness.mount.textContent,
    /ACTIVE DEVICE-LOCAL HUMAN VERDICT \/\/ NOT CANON/,
  );
  assert.equal(
    harness.mount.querySelector('[data-vr-action="undo-latest"]'),
    null,
  );
  assert.match(
    harness.mount.textContent,
    /Undo, hold, rejection, and editing are unavailable/,
  );
  assert.equal(
    harness.mount.querySelector('[data-vr-model="humanAttested"]').checked,
    false,
    "attestation applies to one exact event and must never carry forward",
  );
  assert.equal(harness.mount.querySelector('[data-vr-model="at"]').value, "");
  assert.equal(
    harness.mount.querySelector('[data-vr-model="notes"]').value,
    "",
  );
  assert.equal(
    harness.mount.querySelector('[data-vr-model="role"]').value,
    "editor",
    "only local reviewer identity labels may persist",
  );

  setActor(harness, next);
  const revoke = harness.mount.querySelector(
    '[data-vr-action="open-revoke"]',
  );
  harness.dispatch("click", revoke);
  assert.match(
    harness.mount.querySelector("[data-vr-dialog]").textContent,
    /disappear immediately.*every prior event remains/i,
  );
  harness.dispatch(
    "click",
    harness.mount.querySelector('[data-vr-action="confirm-dialog"]'),
  );
  assert.equal(current.room.getPublicProjection(DOCKET_ID).state, "REVOKED");
  assert.doesNotMatch(
    harness.mount.textContent,
    /CALLED THAT SHIT\./,
  );
  assert.match(harness.mount.textContent, /PUBLIC VERDICT WITHHELD/);
  assert.match(harness.mount.textContent, /REVOKE/);

  current.room.recordCheck(DOCKET_ID, {
    ...human(next, "Human opened a complete new revision."),
    code: "CANONICAL_PACKET",
    status: "PASS",
  });
  harness.controller.refresh();
  assert.match(harness.mount.textContent, /UNREVIEWED \/\/ REVISION 2/);
  assert.match(harness.mount.textContent, /1\/12 PASS/);
});

test("rejection requires exact confirmation and renders an irreversible terminal state with no undo", () => {
  const current = fixture();
  const next = clock();
  const harness = mounted(current);
  setActor(harness, next);

  const form = harness.mount.querySelector('[data-vr-form="reject"]');
  const reason = harness.mount.querySelector("[data-vr-reject-reason]");
  const submit = form.querySelector('button[type="submit"]');
  reason.value = "OUT_OF_SCOPE";
  const event = harness.dispatch("submit", form);
  const dialog = harness.mount.querySelector("[data-vr-dialog]");

  assert.equal(event.defaultPrevented, true);
  assert.equal(dialog.open, true);
  assert.match(dialog.textContent, /Terminally reject this exact revision/);
  assert.match(dialog.textContent, /cannot be undone or reopened/i);
  assert.match(dialog.textContent, /BOUND REVISION1/);
  assert.match(dialog.textContent, /REJECT \/\/ OUT_OF_SCOPE/);
  assert.match(
    dialog.querySelector('[data-vr-action="confirm-dialog"]').textContent,
    /APPEND TERMINAL REJECTION/,
  );

  harness.dispatch(
    "click",
    dialog.querySelector('[data-vr-action="cancel-dialog"]'),
  );
  assert.equal(harness.document.activeElement, submit);
  harness.dispatch("submit", form);
  harness.dispatch(
    "click",
    harness.mount.querySelector('[data-vr-action="confirm-dialog"]'),
  );

  assert.equal(current.room.getPublicProjection(DOCKET_ID).state, "REJECTED");
  assert.match(harness.mount.textContent, /REVISION REJECTED \/\/ TERMINAL/);
  assert.match(
    harness.mount.textContent,
    /This rejection cannot be undone or reopened/,
  );
  assert.equal(
    harness.mount.querySelector('[data-vr-action="undo-latest"]'),
    null,
  );
  assert.equal(
    harness.document.activeElement,
    harness.mount.querySelector('[data-vr-focus="terminal-state"]'),
  );
  assert.equal(
    harness.mount.querySelector('[data-vr-action="open-check"]'),
    null,
  );
  assert.equal(harness.mount.querySelector("[data-vr-model]"), null);
});

test("failed form submission preserves the form and focuses an atomic error summary", () => {
  const harness = mounted(fixture());
  const open = harness.mount.querySelector(
    '[data-vr-focus="check-CANONICAL_PACKET"]',
  );
  harness.dispatch("click", open);
  const form = harness.mount.querySelector('[data-vr-form="check"]');
  const notes = harness.mount.querySelector('[data-vr-model="notes"]');
  notes.value = "Preserve this unfinished human review note.";
  harness.dispatch("input", notes);
  const event = harness.dispatch("submit", form);
  const summary = harness.mount.querySelector("[data-vr-error]");

  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.document.activeElement, summary);
  assert.equal(summary.hidden, false);
  assert.match(summary.textContent, /REVIEW EVENT NOT SAVED/);
  assert.match(summary.textContent, /Enter the local human review role/);
  assert.ok(
    harness.mount.querySelector('[data-vr-form="check"]'),
    "the correction form must remain mounted after failure",
  );
  assert.match(
    harness.mount.querySelector("[data-vr-live]").textContent,
    /Review event not saved/,
  );
  assert.equal(
    harness.mount.querySelector('[data-vr-model="notes"]').value,
    "Preserve this unfinished human review note.",
  );
  const returnButton = summary.querySelector(
    '[data-vr-action="return-error"]',
  );
  assert.ok(returnButton);
  harness.dispatch("click", returnButton);
  assert.equal(
    harness.document.activeElement,
    harness.mount.querySelector('[data-vr-model="role"]'),
  );
  assert.equal(summary.hidden, true);
  assert.equal(harness.room.getLedger(DOCKET_ID).length, 0);
});

test("a changed review cannot pass an open confirmation; the dialog and human draft remain intact", () => {
  const current = fixture();
  const next = clock();
  completeEvidence(current.room, next);
  current.room.lockWording(DOCKET_ID, {
    ...human(next),
    verdictCode: "SUPPORTED",
    wording: current.room.policy.wordingByVerdictCode.SUPPORTED,
  });
  const harness = mounted(current);
  setActor(harness, next);
  harness.mount.querySelector(
    '[data-vr-verdict-code="SUPPORTED"]',
  ).checked = true;
  const opener = harness.mount.querySelector(
    '[data-vr-action="open-adjudicate"]',
  );
  harness.dispatch("click", opener);

  current.room.markNeedsContext(DOCKET_ID, {
    ...human(next),
    notes: "External local review changed the exact revision.",
  });
  const dialog = harness.mount.querySelector("[data-vr-dialog]");
  harness.dispatch(
    "click",
    dialog.querySelector('[data-vr-action="confirm-dialog"]'),
  );

  const dialogError = dialog.querySelector("[data-vr-dialog-error]");
  assert.equal(dialog.open, true);
  assert.equal(dialogError.hidden, false);
  assert.equal(harness.document.activeElement, dialogError);
  assert.match(dialogError.textContent, /CONFIRMATION_STALE/);
  assert.match(dialogError.textContent, /form values.*remain unchanged/i);
  assert.equal(
    harness.mount.querySelector('[data-vr-model="notes"]').value,
    "Human selected this exact scoped local event.",
  );
  assert.equal(
    current.room.getPublicProjection(DOCKET_ID).state,
    "NEEDS_CONTEXT",
  );
  assert.equal(
    current.room.getLedger(DOCKET_ID).filter(
      (entry) => entry.type === "ADJUDICATE",
    ).length,
    0,
  );

  harness.dispatch(
    "click",
    dialog.querySelector('[data-vr-action="cancel-dialog"]'),
  );
  assert.equal(harness.document.activeElement, opener);
});

test("bounded import is fail-closed and exact restore swaps only after full replay", () => {
  const current = fixture();
  let restoreCalls = 0;
  const harness = mounted(current, {
    restoreSession(contents) {
      restoreCalls += 1;
      return current.runtime.ShokkerVerdictRoom.importJSON(
        contents,
        current.options,
      );
    },
  });
  const originalEngine = harness.controller.getEngine();
  const form = harness.mount.querySelector('[data-vr-form="import"]');
  const input = harness.mount.querySelector("[data-vr-import-json]");
  const confirmation = harness.mount.querySelector(
    "[data-vr-import-confirm]",
  );

  input.value = "x".repeat(2_000_001);
  confirmation.checked = true;
  harness.dispatch("submit", form);
  assert.equal(restoreCalls, 0);
  assert.equal(harness.controller.getEngine(), originalEngine);
  assert.match(
    harness.mount.querySelector("[data-vr-error]").textContent,
    /2 MB transfer boundary/,
  );

  input.value = current.room.exportJSON(2);
  confirmation.checked = true;
  harness.dispatch("submit", form);
  assert.equal(restoreCalls, 1);
  assert.notEqual(harness.controller.getEngine(), originalEngine);
  assert.equal(harness.controller.getState().eventCount, 0);
  assert.match(
    harness.mount.textContent,
    /Nothing was merged or published/i,
  );
});

test("deterministic exports are host-bounded and never claim a remote save", () => {
  const harness = mounted(fixture());
  harness.dispatch(
    "click",
    harness.mount.querySelector('[data-vr-action="export-json"]'),
  );
  harness.dispatch(
    "click",
    harness.mount.querySelector('[data-vr-action="export-markdown"]'),
  );

  assert.equal(harness.downloads.length, 2);
  assert.match(harness.downloads[0].name, /\.verdict-room\.json$/);
  assert.equal(
    harness.downloads[0].mime,
    "application/json;charset=utf-8",
  );
  assert.equal(
    harness.downloads[0].contents,
    harness.room.exportJSON(2),
  );
  assert.match(harness.downloads[1].name, /\.verdict-room\.md$/);
  assert.equal(
    harness.downloads[1].mime,
    "text/markdown;charset=utf-8",
  );
  assert.match(
    harness.mount.textContent,
    /Treat every JSON or Markdown field as untrusted text/,
  );
  assert.doesNotMatch(
    harness.mount.textContent,
    /\b(?:saved to (?:the )?(?:cloud|server)|synced remotely|published successfully)\b/i,
  );
});

test("destroy is idempotent, removes listeners, restores the mount, and restores embedded focus only when needed", () => {
  const harness = mounted(fixture());
  const firstShell = harness.mount.childNodes[0];
  harness.controller.mount();
  assert.equal(harness.mount.childNodes[0], firstShell);

  harness.mount.querySelector('[data-vr-action="export-json"]').focus();
  harness.controller.destroy();
  assert.equal(harness.mount.childNodes.length, 1);
  assert.equal(harness.mount.childNodes[0], harness.original);
  assert.equal(harness.mount.textContent, "ORIGINAL MEMORY OS PANEL");
  assert.equal(harness.document.activeElement, harness.outside);
  assert.equal(harness.mount.hasAttribute("data-verdict-room-mounted"), false);
  for (const listeners of harness.mount.listeners.values()) {
    assert.equal(listeners.size, 0);
  }

  harness.controller.destroy();
  assert.equal(harness.mount.childNodes[0], harness.original);
});

test("the same UI renders a neutral racing vocabulary with no horror leakage", () => {
  const current = fixture("racing");
  const next = clock();
  completeEvidence(current.room, next);
  current.room.lockWording(DOCKET_ID, {
    ...human(next),
    verdictCode: "SUPPORTED",
    wording: current.room.policy.wordingByVerdictCode.SUPPORTED,
  });
  current.room.adjudicate(
    DOCKET_ID,
    adjudicationAction(current.room, next),
  );
  const harness = mounted(current);

  assert.match(harness.mount.textContent, /Feature Race Preview/);
  assert.match(
    harness.mount.textContent,
    /THE REPLAY BACKS THE CALL\./,
  );
  assert.match(
    harness.mount.textContent,
    /CALL UPHELD/,
  );
  assert.doesNotMatch(
    harness.mount.textContent,
    /WWAM|ROADKILL|JACKASS|Ghostface|Halloween|\btapes?\b/i,
  );
});

test("a changed canonical source removes an active result from text and accessibility state", () => {
  const current = fixture();
  const next = clock();
  completeEvidence(current.room, next);
  current.room.lockWording(DOCKET_ID, {
    ...human(next),
    verdictCode: "SUPPORTED",
    wording: current.room.policy.wordingByVerdictCode.SUPPORTED,
  });
  current.room.adjudicate(
    DOCKET_ID,
    adjudicationAction(current.room, next),
  );
  const harness = mounted(current);
  assert.match(harness.mount.textContent, /CALLED THAT SHIT\./);

  current.packet.forecast.candidate.excerpt += " changed canonical context";
  harness.controller.refresh();

  assert.equal(harness.controller.getState().stale, true);
  assert.match(harness.mount.textContent, /STALE INPUT \/\/ FAIL CLOSED/);
  assert.match(
    harness.mount.textContent,
    /ALL LOCAL VERDICT COPY SUPPRESSED/,
  );
  assert.doesNotMatch(
    harness.mount.textContent,
    /CALLED THAT SHIT\./,
  );
  assert.equal(
    harness.mount.querySelector("#vrFormalVerdict"),
    null,
    "stale formal and comedy result nodes must leave the accessibility tree",
  );
  assert.match(
    harness.mount.textContent,
    /REVIEW CONTROLS WITHHELD \/\/ STALE INPUT/,
  );
  assert.equal(
    harness.mount.querySelector('[data-vr-action="open-check"]'),
    null,
    "stale evidence exposes no actionable review control",
  );
});

test("the visual contract supports reflow, reduced motion, focus, and high contrast", () => {
  assert.match(cssSource, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(cssSource, /@container \(max-width:\s*680px\)/);
  assert.match(cssSource, /@media \(max-width:\s*700px\)/);
  assert.match(cssSource, /grid-template-columns:\s*1fr/);
  assert.match(cssSource, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(cssSource, /@media \(forced-colors:\s*active\)/);
  assert.match(cssSource, /:focus-visible/);
  assert.match(cssSource, /overflow-wrap:\s*anywhere/);
  assert.match(cssSource, /\.vr-dialog[\s\S]{0,360}overflow-y:\s*auto/);
  assert.match(cssSource, /\.vr-terminal-state/);
  assert.match(cssSource, /\.vr-dialog-error\[hidden\]/);
  assert.equal(
    (cssSource.match(/white-space:\s*nowrap/g) || []).length,
    1,
  );
  assert.match(cssSource, /\.vr-live\s*\{[\s\S]{0,240}white-space:\s*nowrap/);
});
