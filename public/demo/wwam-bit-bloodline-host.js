(function (root) {
  "use strict";

  var activeUi = null;
  var activeEngine = null;
  var currentLineages = [];
  var epoch = 0;
  var CUT_ASSETS = [
    "memory-cut-engine.js",
    "memory-cut-ui.js",
    "wwam-memory-cut-launcher.js"
  ];

  function toast(message) {
    var node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    setTimeout(function () { node.classList.remove("show"); }, 2200);
  }

  function destroy() {
    epoch += 1;
    if (activeUi && typeof activeUi.destroy === "function") activeUi.destroy();
    activeUi = null;
    activeEngine = null;
  }

  function errorMarkup(message) {
    var panel = document.createElement("div");
    panel.className = "bit-bloodline-load bit-bloodline-load-error";
    panel.setAttribute("role", "alert");
    var label = document.createElement("span");
    label.textContent = "THE BLOODLINE WAS HELD";
    var title = document.createElement("h3");
    title.textContent = "CANONICAL RECURRENCE UNAVAILABLE.";
    var copy = document.createElement("p");
    copy.textContent = message;
    panel.appendChild(label);
    panel.appendChild(title);
    panel.appendChild(copy);
    return panel;
  }

  function showError(mount, error) {
    if (!mount) return false;
    var message = error && error.message ? error.message : String(error);
    mount.textContent = "";
    mount.appendChild(errorMarkup(message));
    mount.setAttribute("aria-busy", "false");
    toast("BIT BLOODLINES WAS HELD");
    return false;
  }

  function loadCutRuntime() {
    var loader = root.WWAMFeatureLoader;
    if (!loader) return Promise.reject(new Error("The lazy feature loader is unavailable."));
    return loader.loadStyle("memory-cut.css").then(function () {
      return CUT_ASSETS.reduce(function (promise, asset) {
        return promise.then(function () { return loader.load(asset); });
      }, Promise.resolve());
    });
  }

  function cutBloodline(payload) {
    return loadCutRuntime().then(function () {
      if (!root.WWAMMemoryCutLauncher) {
        throw new Error("The Midnight Cut launcher is unavailable.");
      }
      return root.WWAMMemoryCutLauncher.request({
        selections: payload.selections,
        title: payload.title,
        introduction: payload.introduction
      });
    }).catch(function (error) {
      toast(error && error.message ? error.message : "THE BLOODLINE CUT WAS HELD");
      return false;
    });
  }

  function mountLineages(token) {
    var mount = document.getElementById("bitBloodlineMount");
    var access = root.WWAMSourceDossierAccess;
    if (!mount || token !== epoch) return Promise.resolve(false);
    if (!access || typeof access.load !== "function") {
      return Promise.resolve(showError(
        mount,
        new Error("The canonical Source Dossier registry is unavailable.")
      ));
    }
    return access.load().then(function () {
      if (token !== epoch || !document.getElementById("bitBloodlineMount")) return false;
      if (!root.ShokkerBitBloodline || !root.WWAMBitBloodlineUI) {
        throw new Error("The Bit Bloodlines runtime is incomplete.");
      }
      activeEngine = root.ShokkerBitBloodline.create({
        dossierEngine: access.get(),
        lineages: currentLineages
      });
      activeUi = root.WWAMBitBloodlineUI.create({
        document: document,
        mount: mount,
        engine: activeEngine,
        onPlay: function (payload) {
          if (typeof access.play === "function") return access.play(payload);
          throw new Error("Exact source playback is unavailable.");
        },
        onNavigateEcho: function (payload) {
          if (typeof access.navigate === "function") return access.navigate(payload);
          throw new Error("Source-position navigation is unavailable.");
        },
        onCutBloodline: function (payload) {
          return cutBloodline(payload);
        }
      });
      mount.setAttribute("aria-busy", "false");
      var available = activeEngine.list();
      var featured = available.filter(function (lineage) {
        return /slenderman/i.test(lineage.id + " " + lineage.label);
      })[0] || available[0];
      return activeUi.open({
        lineageId: featured.id,
        launcher: document.querySelector('[data-memory-tab="bits"]')
      });
    }).catch(function (error) {
      return token === epoch ? showError(mount, error) : false;
    });
  }

  function view(lineages) {
    destroy();
    currentLineages = Array.isArray(lineages) ? lineages.slice() : [];
    var token = epoch;
    setTimeout(function () { mountLineages(token); }, 0);
    return '<div class="bit-bloodline-load" id="bitBloodlineMount" ' +
      'role="status" aria-live="polite" aria-busy="true">' +
      "<span>BIT BLOODLINES // VERIFYING THE CANONICAL PERFORMANCE LEDGER</span>" +
      "<h3>TRACING ALL FOUR RECURRING SIGNALS.</h3>" +
      "<p>Exact receipts, dates, bounds, and source fingerprints are being re-resolved.</p></div>";
  }

  root.WWAMBitBloodlineHost = Object.freeze({
    VERSION: "1.0.0",
    view: view,
    destroy: destroy,
    cutBloodline: cutBloodline,
    getState: function () {
      return {
        lineages: currentLineages.slice(),
        engineFingerprint: activeEngine && activeEngine.fingerprint || "",
        ui: activeUi && activeUi.getState ? activeUi.getState() : null
      };
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
