(function (root) {
  "use strict";

  var activeUi = null;
  var activeEngine = null;

  function toast(message) {
    var node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    setTimeout(function () { node.classList.remove("show"); }, 2200);
  }

  function copyText(value) {
    var text = String(value || "");
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () {
        toast("MIDNIGHT CUT LINK COPIED");
      });
    }
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
    toast("MIDNIGHT CUT LINK COPIED");
    return Promise.resolve();
  }

  function download(filename, value) {
    var markdown = typeof value === "string";
    var body = markdown ? value : JSON.stringify(value, null, 2);
    var blob = new Blob([body], {
      type: markdown ? "text/markdown;charset=utf-8" : "application/json"
    });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    toast("CREATOR EDIT BRIEF DOWNLOADED");
  }

  function renderPlayer(payload) {
    var player = document.getElementById(payload.mountId || "memoryCutPlayer");
    if (!player || !root.ShokkerYouTubePlayback) return;
    player.innerHTML = root.ShokkerYouTubePlayback.iframe(payload.sourceId, {
      autoplay: payload.autoplay !== false,
      start: payload.at == null ? payload.start : payload.at,
      end: payload.end,
      title: "WWAM Midnight Cut source receipt"
    });
    player.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center"
    });
  }

  function destroy() {
    if (activeUi && typeof activeUi.destroy === "function") activeUi.destroy();
    activeUi = null;
    activeEngine = null;
  }

  function setBackground(blocked) {
    Array.prototype.forEach.call(document.querySelectorAll(
      "body > nav, body > main, body > footer, #evidenceBagOpen"
    ), function (node) {
      if (blocked) node.setAttribute("inert", "");
      else node.removeAttribute("inert");
    });
  }

  function showLoading() {
    var modal = document.getElementById("tapeModal");
    var mount = document.getElementById("modalContent");
    mount.innerHTML =
      '<div class="source-dossier-loading" role="status" aria-live="polite">' +
      "<span>THE MIDNIGHT CUT // SOURCE LOCK IN PROGRESS</span>" +
      '<h2 id="memoryCutTitle" tabindex="-1">OPENING THE CUT ROOM.</h2>' +
      '<p id="memoryCutBoundary">Canonical receipts are being re-resolved before anything enters the cut.</p></div>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    modal.setAttribute("aria-busy", "true");
    modal.setAttribute("aria-labelledby", "memoryCutTitle");
    modal.setAttribute("aria-describedby", "memoryCutBoundary");
    document.body.classList.add("modal-open");
    setBackground(true);
    setTimeout(function () {
      var close = document.getElementById("modalClose");
      if (close) close.focus();
    }, 0);
  }

  function showError(error) {
    var message = error && error.message ? error.message : String(error);
    var mount = document.getElementById("modalContent");
    document.getElementById("tapeModal").setAttribute("aria-busy", "false");
    mount.textContent = "";
    var panel = document.createElement("div");
    panel.className = "source-dossier-loading source-dossier-error";
    panel.setAttribute("role", "alert");
    panel.innerHTML = '<span>THE CUT WAS HELD</span><h2 id="memoryCutTitle">CUT ROOM UNAVAILABLE.</h2>';
    var copy = document.createElement("p");
    copy.id = "memoryCutBoundary";
    copy.textContent = message;
    panel.appendChild(copy);
    mount.appendChild(panel);
    toast("THE MIDNIGHT CUT WAS HELD");
    return false;
  }

  function request() {
    var access = root.WWAMSourceDossierAccess;
    if (!access || typeof access.load !== "function") {
      return Promise.resolve(showError(new Error("The canonical source registry is unavailable.")));
    }
    var closeBag = document.getElementById("evidenceBagClose");
    if (closeBag) closeBag.click();
    showLoading();
    return access.load().then(function () {
      return open({
        dossierEngine: access.get(),
        selections: access.bag()
      });
    }).catch(showError);
  }

  function open(options) {
    var settings = options || {};
    if (!root.ShokkerMemoryCut || !root.WWAMMemoryCutUI || !settings.dossierEngine) {
      throw new Error("The Midnight Cut runtime is incomplete.");
    }
    destroy();
    activeEngine = root.ShokkerMemoryCut.create({ dossierEngine: settings.dossierEngine });
    var selections = (settings.selections || []).slice();
    var usingPreset = selections.length === 0;
    var preset = usingPreset ? activeEngine.getPreset("character-ward") : null;
    if (usingPreset) selections = preset.selections;
    activeUi = root.WWAMMemoryCutUI.create({
      document: document,
      mount: document.getElementById("modalContent"),
      engine: activeEngine,
      onRenderPlayer: renderPlayer,
      onCopy: function (payload) { return copyText(payload.text); },
      onDownload: function (payload) { download(payload.filename, payload.brief); },
      onClose: function () {
        var close = document.getElementById("modalClose");
        if (close) close.click();
      }
    });
    activeUi.open({
      selections: selections,
      title: usingPreset ? preset.title : "MY MIDNIGHT CUT",
      introduction: usingPreset
        ? preset.introduction
        : "Viewer-arranged source receipts. This sequence and its title are not archive evidence."
    });
    var modal = document.getElementById("tapeModal");
    if (modal) {
      modal.setAttribute("aria-busy", "false");
      modal.setAttribute("aria-labelledby", "memoryCutTitleHeading");
      modal.setAttribute("aria-describedby", "memoryCutAuthority");
    }
    return activeUi;
  }

  root.WWAMMemoryCutLauncher = Object.freeze({
    VERSION: "1.0.0",
    request: request,
    open: open,
    destroy: destroy,
    getActive: function () {
      return activeUi && activeUi.getState ? activeUi.getState() : null;
    }
  });
  var access = root.WWAMSourceDossierAccess;
  var trigger = document.getElementById(access && access.cutId || "evidenceBagCut");
  if (trigger) trigger.addEventListener("wwam:feature-activate", request);
})(typeof window !== "undefined" ? window : globalThis);
