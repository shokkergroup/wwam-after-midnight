(function (root) {
  "use strict";

  /*
   * WWAM owns this boundary. The reusable Verdict Room never receives a
   * caller-authored packet, vocabulary, ChannelPack, or docket artifact here.
   * Script order is security-relevant: the canonical longitudinal factory must
   * exist before verdict-room-engine.js captures it, and this adapter snapshots
   * the same factory and the frozen V5.13 docket artifact before any review.
   */
  var VERSION = "1.0.0";
  var STYLE_NAME = "verdict-room.css";
  var SESSION_ID = "wwam-verdict-room-local";
  var SESSION_NAME = "WWAM Verdict Room // Device-local review";
  var STORAGE_SUFFIX = "verdict-room:v1:active";
  var HELD_SUFFIX = "held-invalid";
  var PERSISTENCE = Object.freeze({
    ACTIVE: "active",
    RESTORED: "restored",
    MEMORY_ONLY: "memory-only",
    BLOCKED: "blocked-invalid-saved-ledger",
  });
  var MUTATIONS = Object.freeze([
    "recordCheck",
    "markNeedsContext",
    "reject",
    "lockWording",
    "adjudicate",
    "undo",
    "revoke",
  ]);
  var READS = Object.freeze([
    "getQueue",
    "getDocket",
    "getLedger",
    "getPublicProjection",
    "getMetrics",
    "snapshot",
    "exportJSON",
    "exportMarkdown",
  ]);
  var CANONICAL_DOCKET_FACTORY = root.ShokkerLongitudinalDocket || null;
  var CANONICAL_PACK_COMPILER = root.ShokkerChannelPack || null;
  var CANONICAL_VERDICT_FACTORY = root.ShokkerVerdictRoom || null;

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
    return value;
  }

  var CANONICAL_DNA = freezeDeep(clone(root.WWAM_CHANNEL_DNA || null));
  var CANONICAL_PACK_ADAPTER = freezeDeep(
    clone(root.WWAM_CHANNEL_PACK_ADAPTER || null)
  );
  var CANONICAL_DOCKET_DATA = freezeDeep(
    clone(root.WWAM_LONGITUDINAL_DOCKETS || null)
  );
  var roomState = null;
  var mounted = null;
  var pendingSubjectId = "";

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function adapterError(code, message) {
    var error = new Error(message);
    error.name = "WWAMVerdictRoomAdapterError";
    error.code = code;
    return error;
  }

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function rejectOptions(value, allowed, path) {
    if (value == null) return {};
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw adapterError("OPTIONS_INVALID", path + " must be an object.");
    }
    for (var inheritedKey in value) {
      if (!own(value, inheritedKey)) {
        throw adapterError(
          "OPTION_REJECTED",
          path + " must not inherit caller-authored options."
        );
      }
    }
    var output = {};
    Object.keys(value).forEach(function (key) {
      if (allowed.indexOf(key) < 0) {
        throw adapterError(
          "OPTION_REJECTED",
          path + "." + key + " is not an adapter-owned option."
        );
      }
      output[key] = value[key];
    });
    return output;
  }

  function assertCanonicalRuntime() {
    function secureBinding(name, expected) {
      var descriptor = Object.getOwnPropertyDescriptor(root, name);
      return Boolean(
        descriptor &&
        descriptor.value === expected &&
        descriptor.writable === false &&
        descriptor.configurable === false
      );
    }
    if (
      !CANONICAL_DOCKET_FACTORY ||
      !Object.isFrozen(CANONICAL_DOCKET_FACTORY) ||
      typeof CANONICAL_DOCKET_FACTORY.create !== "function" ||
      !secureBinding(
        "ShokkerLongitudinalDocket",
        CANONICAL_DOCKET_FACTORY
      )
    ) {
      throw adapterError(
        "DOCKET_FACTORY_ORDER_INVALID",
        "Load the frozen longitudinal docket factory before Verdict Room and do not replace it."
      );
    }
    if (
      !CANONICAL_PACK_COMPILER ||
      !Object.isFrozen(CANONICAL_PACK_COMPILER) ||
      typeof CANONICAL_PACK_COMPILER.compile !== "function" ||
      typeof CANONICAL_PACK_COMPILER.validate !== "function" ||
      !secureBinding("ShokkerChannelPack", CANONICAL_PACK_COMPILER)
    ) {
      throw adapterError(
        "CHANNEL_PACK_RUNTIME_INVALID",
        "The canonical frozen ChannelPack compiler is required."
      );
    }
    if (
      !CANONICAL_VERDICT_FACTORY ||
      !Object.isFrozen(CANONICAL_VERDICT_FACTORY) ||
      typeof CANONICAL_VERDICT_FACTORY.create !== "function" ||
      typeof CANONICAL_VERDICT_FACTORY.importJSON !== "function" ||
      !secureBinding("ShokkerVerdictRoom", CANONICAL_VERDICT_FACTORY)
    ) {
      throw adapterError(
        "VERDICT_FACTORY_INVALID",
        "The canonical frozen Verdict Room engine is required."
      );
    }
    if (
      !CANONICAL_DNA ||
      !CANONICAL_PACK_ADAPTER ||
      !CANONICAL_DOCKET_DATA
    ) {
      throw adapterError(
        "WWAM_INPUTS_REQUIRED",
        "WWAM Channel DNA, adapter policy, and V5.13 docket data must load before this adapter."
      );
    }
  }

  function compilePack() {
    assertCanonicalRuntime();
    var pack = CANONICAL_PACK_COMPILER.compile(
      CANONICAL_DNA,
      CANONICAL_PACK_ADAPTER
    );
    var report = CANONICAL_PACK_COMPILER.validate(pack);
    if (
      !report ||
      report.valid !== true ||
      report.fingerprintVerified !== true
    ) {
      throw adapterError(
        "CHANNEL_PACK_REJECTED",
        "The exact WWAM ChannelPack did not pass fingerprint validation."
      );
    }
    if (
      !pack.adjudicationVocabulary ||
      !Array.isArray(pack.capabilities) ||
      pack.capabilities.filter(function (capability) {
        return capability === "human-adjudication-ledger";
      }).length !== 1
    ) {
      throw adapterError(
        "ADJUDICATION_CONTRACT_REQUIRED",
        "The WWAM ChannelPack must own one adjudication capability and its fixed verdict vocabulary."
      );
    }
    if (
      !CANONICAL_DOCKET_DATA.channel ||
      CANONICAL_DOCKET_DATA.channel.id !== pack.identity.id ||
      CANONICAL_DOCKET_DATA.channel.packFingerprint !== pack.fingerprint
    ) {
      throw adapterError(
        "DOCKET_DATA_STALE",
        "The immutable V5.13 docket artifact is not bound to this exact WWAM ChannelPack."
      );
    }
    return pack;
  }

  function storageKey(pack) {
    return [
      pack.storage.namespace,
      pack.fingerprint,
      STORAGE_SUFFIX,
    ].join(":");
  }

  function safeStorage() {
    try {
      var storage = root.localStorage;
      if (
        storage &&
        typeof storage.getItem === "function" &&
        typeof storage.setItem === "function"
      ) {
        return storage;
      }
    } catch {
      return null;
    }
    return null;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function inputsFor(pack, session) {
    var inputs = {
      channelPack: pack,
      docketData: CANONICAL_DOCKET_DATA,
    };
    if (session) inputs.session = session;
    return inputs;
  }

  function statusSnapshot() {
    var persistence = roomState
      ? roomState.persistence
      : (safeStorage() ? PERSISTENCE.ACTIVE : PERSISTENCE.MEMORY_ONLY);
    return Object.freeze({
      mounted: Boolean(mounted),
      persistence: persistence,
      restoreWarning: roomState ? roomState.restoreWarning : "",
      storageKey: roomState ? roomState.key : "",
      heldStorageKey: roomState ? roomState.heldKey : "",
      pendingSubjectId: pendingSubjectId,
    });
  }

  function dispatchStatus() {
    if (!mounted || !mounted.stage) return;
    var EventConstructor = root.CustomEvent;
    if (
      typeof EventConstructor !== "function" &&
      mounted.stage.ownerDocument &&
      mounted.stage.ownerDocument.defaultView
    ) {
      EventConstructor = mounted.stage.ownerDocument.defaultView.CustomEvent;
    }
    if (typeof EventConstructor !== "function") return;
    mounted.stage.dispatchEvent(new EventConstructor(
      "wwam:verdict-room-storage",
      {
        bubbles: true,
        detail: statusSnapshot(),
      }
    ));
  }

  function renderWarning() {
    if (!mounted || !mounted.notice) return;
    var warning = roomState ? roomState.restoreWarning : "";
    mounted.notice.textContent = warning;
    mounted.notice.hidden = !warning;
    dispatchStatus();
  }

  function setPersistence(value, warning) {
    if (!roomState) return;
    roomState.persistence = value;
    roomState.restoreWarning = clean(warning);
    renderWarning();
  }

  function storeExact(storage, key, value) {
    storage.setItem(key, value);
    if (storage.getItem(key) !== value) {
      throw adapterError(
        "STORAGE_WRITE_UNVERIFIED",
        "Local storage did not return the exact canonical ledger text after write."
      );
    }
  }

  function persistRaw(raw) {
    if (!roomState || roomState.persistence === PERSISTENCE.BLOCKED) return;
    if (!roomState.storage) {
      setPersistence(
        PERSISTENCE.MEMORY_ONLY,
        "LOCAL LEDGER STORAGE UNAVAILABLE // Review and official exports still work, but reload recovery is not available."
      );
      return;
    }
    try {
      storeExact(
        roomState.storage,
        roomState.key,
        raw.exportJSON(0)
      );
      setPersistence(PERSISTENCE.ACTIVE, "");
    } catch {
      setPersistence(
        PERSISTENCE.MEMORY_ONLY,
        "LOCAL LEDGER WRITE FAILED // The in-memory review remains available. Export JSON before leaving this page."
      );
    }
  }

  function wrappedEngine(raw) {
    var wrapper = {
      policy: raw.policy,
      session: raw.session,
      context: raw.context,
    };
    READS.forEach(function (method) {
      if (typeof raw[method] === "function") {
        wrapper[method] = function () {
          return raw[method].apply(raw, arguments);
        };
      }
    });
    MUTATIONS.forEach(function (method) {
      wrapper[method] = function () {
        var result = raw[method].apply(raw, arguments);
        persistRaw(raw);
        return result;
      };
    });
    Object.defineProperty(wrapper, "metrics", {
      enumerable: true,
      get: function () {
        return typeof raw.getMetrics === "function"
          ? raw.getMetrics()
          : raw.metrics;
      },
    });
    return Object.freeze(wrapper);
  }

  function nextHeldKey(storage, key) {
    var base = key + ":" + HELD_SUFFIX;
    var candidate = base;
    var index = 1;
    while (storage.getItem(candidate) != null && index < 1_000) {
      index += 1;
      candidate = base + ":" + index;
    }
    if (storage.getItem(candidate) != null) {
      throw adapterError(
        "STORAGE_QUARANTINE_FULL",
        "No bounded local quarantine slot is available for the rejected ledger."
      );
    }
    return candidate;
  }

  function preserveRejectedBeforeReplacement() {
    if (
      !roomState ||
      roomState.persistence !== PERSISTENCE.BLOCKED ||
      !roomState.storage
    ) {
      return;
    }
    var rejected = roomState.storage.getItem(roomState.key);
    if (rejected == null) return;
    var heldKey = nextHeldKey(roomState.storage, roomState.key);
    storeExact(roomState.storage, heldKey, rejected);
    roomState.heldKey = heldKey;
  }

  function importExact(contents) {
    if (!roomState) {
      throw adapterError(
        "ROOM_REQUIRED",
        "Create the WWAM Verdict Room before restoring a session."
      );
    }
    var restored = CANONICAL_VERDICT_FACTORY.importJSON(
      contents,
      inputsFor(roomState.pack)
    );
    preserveRejectedBeforeReplacement();
    var wrapped = wrappedEngine(restored);
    if (roomState.storage) {
      try {
        storeExact(
          roomState.storage,
          roomState.key,
          restored.exportJSON(0)
        );
        roomState.persistence = PERSISTENCE.RESTORED;
        roomState.restoreWarning = "";
      } catch {
        roomState.persistence = PERSISTENCE.MEMORY_ONLY;
        roomState.restoreWarning =
          "RESTORE VERIFIED BUT STORAGE FAILED // The exact replay is open in memory. Export JSON before leaving.";
      }
    } else {
      roomState.persistence = PERSISTENCE.MEMORY_ONLY;
      roomState.restoreWarning =
        "RESTORE VERIFIED IN MEMORY // Local storage is unavailable. Export JSON before leaving.";
    }
    roomState.engine = wrapped;
    roomState.raw = restored;
    renderWarning();
    return wrapped;
  }

  function create() {
    if (arguments.length) {
      throw adapterError(
        "OPTION_REJECTED",
        "WWAM Verdict Room creation accepts no caller packet, vocabulary, pack, or docket input."
      );
    }
    if (roomState) return roomState.engine;
    var pack = compilePack();
    var key = storageKey(pack);
    var storage = safeStorage();
    var raw;
    var persistence = storage ? PERSISTENCE.ACTIVE : PERSISTENCE.MEMORY_ONLY;
    var warning = storage
      ? ""
      : "LOCAL LEDGER STORAGE UNAVAILABLE // Review and official exports still work, but reload recovery is not available.";
    var saved = null;
    if (storage) {
      try {
        saved = storage.getItem(key);
      } catch {
        storage = null;
        persistence = PERSISTENCE.MEMORY_ONLY;
        warning =
          "LOCAL LEDGER STORAGE UNAVAILABLE // Review and official exports still work, but reload recovery is not available.";
      }
    }
    if (saved != null) {
      try {
        raw = CANONICAL_VERDICT_FACTORY.importJSON(
          saved,
          inputsFor(pack)
        );
        persistence = PERSISTENCE.RESTORED;
      } catch (error) {
        persistence = PERSISTENCE.BLOCKED;
        warning =
          "SAVED LEDGER HELD // " +
          clean(error && error.code || "RESTORE_REJECTED") +
          ": Exact import/replay failed. The saved text remains untouched and this fresh in-memory room will not overwrite it.";
      }
    }
    if (!raw) {
      raw = CANONICAL_VERDICT_FACTORY.create(inputsFor(pack, {
        id: SESSION_ID,
        name: SESSION_NAME,
        createdAt: nowIso(),
      }));
    }
    roomState = {
      pack: pack,
      data: CANONICAL_DOCKET_DATA,
      raw: raw,
      engine: null,
      storage: storage,
      key: key,
      heldKey: "",
      persistence: persistence,
      restoreWarning: warning,
    };
    roomState.engine = wrappedEngine(raw);
    if (persistence === PERSISTENCE.ACTIVE) {
      persistRaw(raw);
    }
    return roomState.engine;
  }

  function subjectDocket(subjectId) {
    var id = clean(subjectId);
    if (!id) return "";
    if (
      !CANONICAL_DOCKET_DATA ||
      !Array.isArray(CANONICAL_DOCKET_DATA.subjects) ||
      !CANONICAL_DOCKET_DATA.subjects.some(function (subject) {
        return subject && subject.id === id;
      })
    ) {
      return "";
    }
    var matches = CANONICAL_DOCKET_DATA.dockets
      .filter(function (docket) {
        return docket &&
          Array.isArray(docket.subjects) &&
          docket.subjects.includes(id);
      })
      .map(function (docket) {
        return clean(docket.id);
      })
      .filter(Boolean)
      .sort();
    return matches[0] || "";
  }

  function download(filename, contents, mime) {
    var documentRef = root.document;
    if (
      !documentRef ||
      typeof documentRef.createElement !== "function" ||
      typeof root.Blob !== "function" ||
      !root.URL ||
      typeof root.URL.createObjectURL !== "function"
    ) {
      throw adapterError(
        "DOWNLOAD_UNAVAILABLE",
        "This browser cannot prepare the bounded local export."
      );
    }
    var blob = new root.Blob([contents], { type: mime });
    var url = root.URL.createObjectURL(blob);
    var anchor = documentRef.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.hidden = true;
    documentRef.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    root.setTimeout(function () {
      root.URL.revokeObjectURL(url);
    }, 0);
  }

  function buildMountedController(docketId, reducedProfanity) {
    var ui = root.ShokkerVerdictRoomUI;
    if (
      !ui ||
      !Object.isFrozen(ui) ||
      typeof ui.create !== "function"
    ) {
      throw adapterError(
        "VERDICT_UI_REQUIRED",
        "Load the frozen Verdict Room UI before mounting the WWAM adapter."
      );
    }
    if (mounted.controller) mounted.controller.destroy();
    var controller = ui.create({
      engine: roomState.engine,
      document: mounted.document,
      mount: mounted.host,
      initialDocketId: docketId,
      reducedProfanity: reducedProfanity === true,
      download: download,
      restoreSession: importExact,
    });
    mounted.controller = controller;
    controller.mount();
    renderWarning();
    return controller;
  }

  function mount(stage, optionsValue) {
    var options = rejectOptions(
      optionsValue,
      ["initialSubjectId", "reducedProfanity"],
      "mount options"
    );
    if (
      !stage ||
      typeof stage.replaceChildren !== "function" ||
      !stage.ownerDocument ||
      typeof stage.ownerDocument.createElement !== "function"
    ) {
      throw adapterError(
        "MOUNT_REQUIRED",
        "WWAM Verdict Room requires a dedicated DOM mount."
      );
    }
    var requestedSubject = clean(options.initialSubjectId);
    if (requestedSubject) {
      if (!subjectDocket(requestedSubject)) {
        throw adapterError(
          "SUBJECT_NOT_FOUND",
          "Verdict Room accepts only an exact registered V5.13 subject ID."
        );
      }
      pendingSubjectId = requestedSubject;
    }
    destroy();
    create();
    var documentRef = stage.ownerDocument;
    var originalNodes = Array.from(stage.childNodes || []);
    var notice = documentRef.createElement("p");
    notice.setAttribute("role", "alert");
    notice.setAttribute("aria-live", "assertive");
    notice.setAttribute("data-verdict-room-storage-warning", "");
    notice.hidden = true;
    var host = documentRef.createElement("div");
    host.setAttribute("data-verdict-room-host", "");
    stage.replaceChildren(notice, host);
    mounted = {
      stage: stage,
      document: documentRef,
      originalNodes: originalNodes,
      notice: notice,
      host: host,
      controller: null,
      reducedProfanity: options.reducedProfanity === true,
    };
    var docketId = pendingSubjectId
      ? subjectDocket(pendingSubjectId)
      : "";
    pendingSubjectId = "";
    return buildMountedController(docketId, mounted.reducedProfanity);
  }

  function open(subjectId) {
    var id = clean(subjectId);
    if (!id) {
      pendingSubjectId = "";
      return true;
    }
    var docketId = subjectDocket(id);
    if (!docketId) return false;
    pendingSubjectId = id;
    if (!mounted) return true;
    pendingSubjectId = "";
    buildMountedController(docketId, mounted.reducedProfanity);
    return true;
  }

  function destroy() {
    if (!mounted) return;
    var current = mounted;
    mounted = null;
    if (current.controller) current.controller.destroy();
    current.stage.replaceChildren.apply(
      current.stage,
      current.originalNodes
    );
  }

  var api = Object.freeze({
    VERSION: VERSION,
    STYLE_NAME: STYLE_NAME,
    PERSISTENCE: PERSISTENCE,
    create: create,
    mount: mount,
    open: open,
    destroy: destroy,
    getStatus: statusSnapshot,
  });
  root.WWAMVerdictRoomAdapter = api;
  root.WWAMVerdictRoomDemo = api;
})(typeof window !== "undefined" ? window : globalThis);
