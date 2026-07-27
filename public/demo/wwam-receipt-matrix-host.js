(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var UNKNOWN_SCHEMA = "shokker-receipt-matrix-unknown/v1";
  var GROUP_ID = "group:grounded-recurring-characters";
  var CAPTURE = true;
  var epoch = 0;
  var bound = false;
  var destroyed = false;
  var replayScheduled = false;
  var domReadyListening = false;
  var activeRouter = null;
  var activeMatrix = null;
  var activeDossierEngine = null;
  var activeUi = null;
  var activeMount = null;
  var formNode = null;
  var examplesNode = null;
  var lastQuery = "";
  var lastRoute = null;
  var lastAnalysis = null;
  var lastError = "";
  var loading = false;

  var MATRIX_POLICY = Object.freeze({
    id: "wwam-promoted-curated-character-performance/v1",
    source: Object.freeze({
      authority: "promoted-lane",
      coverage: "caption-backed"
    }),
    receiptContracts: Object.freeze([
      Object.freeze({
        kind: "character-performance",
        evidenceType: "curated-character-performance",
        evidenceBasis: "exact-showcase-receipt",
        reviewState: "timestamp-validated-human-curated-candidate",
        publicExcerptAllowed: true,
        promotionAllowed: false
      })
    ]),
    requireSpeakerUndiarized: true
  });

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function documentRef() {
    return root.document || (
      typeof document !== "undefined" ? document : null
    );
  }

  function schedule(callback) {
    if (typeof root.setTimeout === "function") {
      return root.setTimeout(callback, 0);
    }
    return setTimeout(callback, 0);
  }

  function statusNode() {
    var doc = documentRef();
    return doc && doc.getElementById
      ? doc.getElementById("askStatus")
      : null;
  }

  function resultsNode() {
    var doc = documentRef();
    return doc && doc.getElementById
      ? doc.getElementById("askResults")
      : null;
  }

  function inputNode() {
    var doc = documentRef();
    return doc && doc.getElementById
      ? doc.getElementById("askInput")
      : null;
  }

  function setStatus(message) {
    var node = statusNode();
    if (node) node.textContent = clean(message);
  }

  function groundedDirectory() {
    var lore = record(root.WWAM_CHARACTER_LORE);
    var grounded = array(lore.characters).filter(function (profile) {
      return clean(profile && profile.status).toLowerCase() === "grounded";
    });
    if (grounded.length !== 4) {
      throw new Error(
        "Receipt Matrix requires exactly four grounded recurring-character profiles."
      );
    }
    var entities = grounded.map(function (profile) {
      var profileId = clean(profile.id);
      var label = clean(profile.name || profile.displayName);
      if (!profileId || !label) {
        throw new Error(
          "Every grounded recurring-character profile needs an explicit ID and label."
        );
      }
      return {
        id: "character:" + profileId,
        label: label,
        aliases: array(profile.aliases).map(clean).filter(Boolean)
      };
    }).sort(function (left, right) {
      return left.id.localeCompare(right.id);
    });
    if (new Set(entities.map(function (entity) {
      return entity.id;
    })).size !== entities.length) {
      throw new Error("Grounded recurring-character entity IDs must be unique.");
    }
    return {
      entities: entities,
      groups: [{
        id: GROUP_ID,
        label: "ALL FOUR GROUNDED RECURRING CHARACTERS",
        entityIds: entities.map(function (entity) {
          return entity.id;
        }),
        aliases: [
          "all four grounded recurring characters",
          "all grounded recurring characters",
          "all four recurring characters",
          "all recurring characters",
          "every recurring character"
        ]
      }]
    };
  }

  function ensureRouter() {
    if (activeRouter) return activeRouter;
    var api = root.ShokkerReceiptMatrixQuery;
    if (!api || typeof api.create !== "function") {
      throw new Error("The Receipt Matrix query router is unavailable.");
    }
    activeRouter = api.create(groundedDirectory());
    if (!activeRouter || typeof activeRouter.route !== "function") {
      activeRouter = null;
      throw new Error("The Receipt Matrix query router is incompatible.");
    }
    return activeRouter;
  }

  function match(query, context) {
    var text = clean(query);
    if (text.length < 2) return null;
    try {
      var route = ensureRouter().route(text, context);
      return route && route.matched === true ? route : null;
    } catch (error) {
      lastError = clean(error && error.message) ||
        "The Receipt Matrix query router failed.";
      return null;
    }
  }

  function loadingMarkup(query) {
    return '<section class="receipt-matrix-host-load" role="status" ' +
      'aria-live="polite" aria-busy="true"><span>RECEIPT MATRIX // ' +
      'CANONICAL SOURCE CHECK</span><h3>RESOLVING UNIQUE SOURCES.</h3><p>' +
      'Verifying exact bounded receipts for &ldquo;' +
      escapeHtml(query) +
      '&rdquo; before source groups are shown.</p></section>';
  }

  function heldMarkup(message) {
    return '<section class="receipt-matrix-host-load ' +
      'receipt-matrix-host-load--held" role="alert" aria-busy="false">' +
      '<span>RECEIPT MATRIX // HELD CLOSED</span><h3>CANONICAL PROOF ' +
      'UNAVAILABLE.</h3><p>' + escapeHtml(message) +
      '</p><small>Ordinary search was not substituted after this explicit ' +
      'matrix route matched.</small></section>';
  }

  function renderLoading(query) {
    var mount = resultsNode();
    if (!mount) throw new Error("The Ask results mount is unavailable.");
    if (typeof mount.setAttribute === "function") {
      mount.setAttribute("data-ask-query", query);
      mount.setAttribute("aria-busy", "true");
    }
    mount.innerHTML = loadingMarkup(query);
    setStatus("RECEIPT MATRIX // VERIFYING CANONICAL RECEIPTS");
  }

  function renderHeld(error) {
    var mount = resultsNode();
    var message = clean(error && error.message ? error.message : error) ||
      "The Receipt Matrix could not resolve its canonical source inputs.";
    lastError = message;
    loading = false;
    if (activeUi && typeof activeUi.destroy === "function") {
      activeUi.destroy();
      activeUi = null;
      activeMount = null;
    }
    if (mount) {
      if (typeof mount.setAttribute === "function") {
        mount.setAttribute("aria-busy", "false");
      }
      mount.innerHTML = heldMarkup(message);
    }
    setStatus("RECEIPT MATRIX HELD // NO GENERIC FALLBACK");
    return false;
  }

  function currentAccess() {
    var access = root.WWAMSourceDossierAccess;
    if (!access || typeof access.load !== "function" ||
        typeof access.get !== "function") {
      throw new Error("The canonical Source Dossier access layer is unavailable.");
    }
    return access;
  }

  function ensureMatrix(token) {
    var access = currentAccess();
    return Promise.resolve(access.load()).then(function () {
      if (token !== epoch || destroyed) return null;
      var dossierEngine = access.get();
      if (!dossierEngine) {
        throw new Error("The canonical Source Dossier engine did not load.");
      }
      if (activeMatrix && activeDossierEngine === dossierEngine) {
        return activeMatrix;
      }
      var api = root.ShokkerReceiptMatrix;
      if (!api || typeof api.create !== "function") {
        throw new Error("The channel-neutral Receipt Matrix engine is unavailable.");
      }
      activeMatrix = api.create({
        dossierEngine: dossierEngine,
        policy: MATRIX_POLICY
      });
      activeDossierEngine = dossierEngine;
      return activeMatrix;
    });
  }

  function playReceipt(payload) {
    var access = currentAccess();
    if (typeof access.play !== "function") {
      throw new Error("Exact source playback is unavailable.");
    }
    return access.play({
      sourceId: payload.sourceId,
      at: payload.at,
      end: payload.end,
      receiptKey: payload.receiptKey,
      sourceFingerprint: payload.sourceFingerprint,
      dossierFingerprint: payload.dossierFingerprint
    });
  }

  function navigateReceipt(payload) {
    var access = currentAccess();
    if (typeof access.navigate !== "function") {
      throw new Error("Exact source navigation is unavailable.");
    }
    return access.navigate({
      sourceId: payload.sourceId,
      at: payload.at,
      end: payload.end,
      receiptKey: payload.receiptKey,
      sourceFingerprint: payload.sourceFingerprint,
      dossierFingerprint: payload.dossierFingerprint
    });
  }

  function openBloodlines() {
    var doc = documentRef();
    var tab = doc && doc.querySelector
      ? doc.querySelector('[data-memory-tab="bits"]')
      : null;
    var memory = doc && doc.getElementById
      ? doc.getElementById("memory")
      : null;
    if (!tab) throw new Error("The existing Bit Bloodlines tab is unavailable.");
    if (typeof tab.click === "function") tab.click();
    else if (typeof tab.onclick === "function") tab.onclick();
    if (memory && typeof memory.scrollIntoView === "function") {
      memory.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  }

  function filename(query) {
    var slug = clean(query).toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 56);
    return "wwam-receipt-matrix-" + (slug || "answer") + ".json";
  }

  function exportMatrix(payload) {
    var doc = documentRef();
    var BlobCtor = root.Blob || (
      typeof Blob !== "undefined" ? Blob : null
    );
    var urlApi = root.URL || (
      typeof URL !== "undefined" ? URL : null
    );
    if (!doc || !doc.createElement || !doc.body || !BlobCtor || !urlApi ||
        typeof urlApi.createObjectURL !== "function") {
      throw new Error("Bounded JSON export is unavailable in this browser.");
    }
    var bounded = {
      schema: "shokker-wwam-receipt-matrix-export/v1",
      query: clean(payload && payload.query),
      route: record(payload && payload.route),
      result: record(payload && payload.analysis),
      rendered: record(payload && payload.rendered),
      boundary: clean(payload && payload.boundary)
    };
    var blob = new BlobCtor(
      [JSON.stringify(bounded, null, 2)],
      { type: "application/json" }
    );
    var href = urlApi.createObjectURL(blob);
    var link = doc.createElement("a");
    link.href = href;
    link.download = filename(bounded.query);
    doc.body.appendChild(link);
    if (typeof link.click === "function") link.click();
    if (typeof link.remove === "function") link.remove();
    else if (link.parentNode && typeof link.parentNode.removeChild === "function") {
      link.parentNode.removeChild(link);
    }
    schedule(function () {
      if (typeof urlApi.revokeObjectURL === "function") {
        urlApi.revokeObjectURL(href);
      }
    });
    return true;
  }

  function ensureUi(mount) {
    if (activeUi && activeMount === mount) return activeUi;
    if (activeUi && typeof activeUi.destroy === "function") activeUi.destroy();
    var api = root.ShokkerReceiptMatrixUI;
    if (!api || typeof api.create !== "function") {
      throw new Error("The Receipt Matrix UI is unavailable.");
    }
    activeUi = api.create({
      document: documentRef(),
      mount: mount,
      onPlay: playReceipt,
      onOpenSource: navigateReceipt,
      onOpenLineage: openBloodlines,
      onExport: exportMatrix
    });
    activeMount = mount;
    return activeUi;
  }

  function unknownAnalysis(route) {
    var unknown = array(route && route.unknownTerms).map(clean).filter(Boolean);
    return {
      schema: UNKNOWN_SCHEMA,
      status: "unknown-entity",
      bindings: {},
      uniqueSourceCount: 0,
      eligibleReceiptCount: 0,
      entityCoverage: [],
      groups: [],
      authority: {
        speakerContinuityEstablished: false,
        interactionEstablished: false,
        causalityEstablished: false,
        trueOriginEstablished: false
      },
      limitations: [
        unknown.length
          ? "Unknown explicit matrix entity: " + unknown.join(", ") + "."
          : "The explicit matrix entity is outside the grounded directory.",
        "No ordinary Ask result was substituted for the unmatched entity."
      ]
    };
  }

  function restoreReplayFocus(node) {
    if (node && node.isConnected !== false &&
        typeof node.focus === "function") node.focus();
  }

  function renderUnknown(query, route, launcher, replayFocus) {
    try {
      var mount = resultsNode();
      if (!mount) throw new Error("The Ask results mount is unavailable.");
      if (typeof mount.setAttribute === "function") {
        mount.setAttribute("data-ask-query", query);
        mount.setAttribute("aria-busy", "false");
      }
      lastAnalysis = unknownAnalysis(route);
      ensureUi(mount).open({
        query: query,
        route: route,
        analysis: lastAnalysis,
        launcher: launcher || null
      });
      restoreReplayFocus(replayFocus);
      loading = false;
      lastError = "";
      setStatus("RECEIPT MATRIX // UNKNOWN ENTITY // NO GENERIC FALLBACK");
      return Promise.resolve(true);
    } catch (error) {
      return Promise.resolve(renderHeld(error));
    }
  }

  function handle(query, suppliedRoute, options) {
    var text = clean(query);
    var route = suppliedRoute || match(text);
    if (!route || route.matched !== true) return Promise.resolve(false);
    var settings = record(options);
    var doc = documentRef();
    var replayFocus = settings.replay && doc ? doc.activeElement : null;
    var launcher = settings.launcher || null;
    epoch += 1;
    var token = epoch;
    destroyed = false;
    lastQuery = text;
    lastRoute = route;
    lastAnalysis = null;
    lastError = "";
    loading = true;

    if (clean(route.status).toLowerCase() === "unknown-entity") {
      return renderUnknown(text, route, launcher, replayFocus);
    }

    try {
      renderLoading(text);
    } catch (error) {
      return Promise.resolve(renderHeld(error));
    }

    return ensureMatrix(token).then(function (matrix) {
      if (!matrix || token !== epoch || destroyed) return false;
      if (!route.matrix || typeof route.matrix !== "object") {
        throw new Error("The matched Receipt Matrix route has no engine request.");
      }
      var analysis = matrix.query(route.matrix);
      if (token !== epoch || destroyed) return false;
      var mount = resultsNode();
      if (!mount) throw new Error("The Ask results mount is unavailable.");
      if (typeof mount.setAttribute === "function") {
        mount.setAttribute("aria-busy", "false");
      }
      lastAnalysis = analysis;
      ensureUi(mount).open({
        query: text,
        route: route,
        analysis: analysis,
        launcher: launcher
      });
      restoreReplayFocus(replayFocus);
      loading = false;
      lastError = "";
      setStatus(
        "RECEIPT MATRIX // " +
        Number(analysis.uniqueSourceCount || 0).toLocaleString("en-US") +
        " UNIQUE SOURCES // " +
        Number(analysis.eligibleReceiptCount || 0).toLocaleString("en-US") +
        " ELIGIBLE RECEIPTS"
      );
      return true;
    }).catch(function (error) {
      return token === epoch && !destroyed ? renderHeld(error) : false;
    });
  }

  function closestButton(node, boundary) {
    var current = node;
    while (current && current !== boundary) {
      if (clean(current.tagName).toLowerCase() === "button") return current;
      current = current.parentElement;
    }
    return null;
  }

  function claimEvent(event) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (event && typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    } else if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
  }

  function submitCapture(event) {
    var input = inputNode();
    var query = clean(input && input.value);
    var route = match(query);
    if (!route) return;
    claimEvent(event);
    handle(query, route, { launcher: input });
  }

  function exampleCapture(event) {
    var button = closestButton(event && event.target, examplesNode);
    if (!button) return;
    var query = clean(button.textContent);
    var route = match(query);
    if (!route) return;
    claimEvent(event);
    var input = inputNode();
    if (input) input.value = query;
    handle(query, route, { launcher: button });
  }

  function replayCurrentQuery() {
    replayScheduled = false;
    if (!bound || destroyed) return;
    var mount = resultsNode();
    var query = mount && typeof mount.getAttribute === "function"
      ? clean(mount.getAttribute("data-ask-query"))
      : "";
    if (!query) return;
    var route = match(query);
    if (route) handle(query, route, { replay: true });
  }

  function scheduleReplay() {
    if (replayScheduled) return;
    replayScheduled = true;
    schedule(replayCurrentQuery);
  }

  function bind() {
    if (bound) return getState();
    var doc = documentRef();
    var form = doc && doc.getElementById
      ? doc.getElementById("askForm")
      : null;
    var examples = doc && doc.getElementById
      ? doc.getElementById("askExamples")
      : null;
    var mount = resultsNode();
    if (!form || !examples || !mount ||
        typeof form.addEventListener !== "function" ||
        typeof examples.addEventListener !== "function") {
      lastError = "The existing Ask form, examples, or results mount is unavailable.";
      return getState();
    }
    destroyed = false;
    bound = true;
    formNode = form;
    examplesNode = examples;
    formNode.addEventListener("submit", submitCapture, CAPTURE);
    examplesNode.addEventListener("click", exampleCapture, CAPTURE);
    scheduleReplay();
    return getState();
  }

  function destroy() {
    if (bound) {
      if (formNode && typeof formNode.removeEventListener === "function") {
        formNode.removeEventListener("submit", submitCapture, CAPTURE);
      }
      if (examplesNode &&
          typeof examplesNode.removeEventListener === "function") {
        examplesNode.removeEventListener("click", exampleCapture, CAPTURE);
      }
    }
    var doc = documentRef();
    if (domReadyListening && doc &&
        typeof doc.removeEventListener === "function") {
      doc.removeEventListener("DOMContentLoaded", bind);
    }
    epoch += 1;
    if (activeUi && typeof activeUi.destroy === "function") activeUi.destroy();
    bound = false;
    destroyed = true;
    replayScheduled = false;
    domReadyListening = false;
    loading = false;
    formNode = null;
    examplesNode = null;
    activeUi = null;
    activeMount = null;
    activeMatrix = null;
    activeDossierEngine = null;
    activeRouter = null;
  }

  function getState() {
    return {
      bound: bound,
      destroyed: destroyed,
      loading: loading,
      query: lastQuery,
      routeStatus: clean(lastRoute && lastRoute.status),
      analysisStatus: clean(lastAnalysis && lastAnalysis.status),
      matrixFingerprint: clean(activeMatrix && activeMatrix.fingerprint),
      routerReady: Boolean(activeRouter),
      ui: activeUi && typeof activeUi.getState === "function"
        ? activeUi.getState()
        : null,
      error: lastError
    };
  }

  var api = Object.freeze({
    VERSION: VERSION,
    POLICY: MATRIX_POLICY,
    GROUP_ID: GROUP_ID,
    bind: bind,
    match: match,
    handle: handle,
    destroy: destroy,
    getState: getState
  });
  root.WWAMReceiptMatrixHost = api;

  var doc = documentRef();
  if (doc && doc.readyState === "loading" &&
      typeof doc.addEventListener === "function") {
    domReadyListening = true;
    doc.addEventListener("DOMContentLoaded", bind);
  } else if (doc) {
    bind();
  }
})(typeof window !== "undefined" ? window : globalThis);
