(function (root) {
  "use strict";

  var section = root.document && root.document.getElementById("verdict-room");
  var stage = root.document && root.document.getElementById("verdictRoomStage");
  var status = root.document && root.document.getElementById("verdictRoomStatus");
  var mountPromise = null;
  var pendingSubject = "";

  function exactSubject(value) {
    var subject = typeof value === "string" ? value.trim() : "";
    return subject.length <= 160 && /^[A-Za-z0-9:_-]*$/.test(subject)
      ? subject
      : "";
  }

  function setStatus(copy, state) {
    if (status) status.textContent = copy;
    if (section) {
      section.setAttribute("aria-busy", state === "loading" ? "true" : "false");
      section.setAttribute("data-verdict-room-state", state);
    }
  }

  function failure(error) {
    mountPromise = null;
    setStatus("VERDICT ROOM HELD // REVIEW ENGINE UNAVAILABLE.", "failed");
    if (!stage) return null;
    stage.replaceChildren();
    var heading = root.document.createElement("h3");
    var copy = root.document.createElement("p");
    var retry = root.document.createElement("button");
    heading.textContent = "THE GAVEL STAYS LOCKED.";
    copy.textContent = "The human-review chain did not initialize. No decision was created or restored.";
    retry.type = "button";
    retry.textContent = "RETRY THE REVIEW CHAIN";
    retry.onclick = mount;
    var shell = root.document.createElement("div");
    shell.className = "verdict-room-loading verdict-room-failed";
    shell.append(heading, copy, retry);
    stage.appendChild(shell);
    if (root.console && typeof root.console.error === "function") {
      root.console.error("[WWAM V5] Verdict Room surface failed:", error);
    }
    return null;
  }

  function open(subjectId) {
    var supplied = typeof subjectId === "string" ? subjectId.trim() : "";
    var resolved = exactSubject(subjectId);
    if (
      subjectId != null &&
      (typeof subjectId !== "string" || (supplied && !resolved))
    ) {
      return false;
    }
    pendingSubject = resolved;
    if (
      root.WWAMVerdictRoomAdapter &&
      typeof root.WWAMVerdictRoomAdapter.open === "function"
    ) {
      return root.WWAMVerdictRoomAdapter.open(pendingSubject);
    }
    return false;
  }

  function readyStatus() {
    var adapter = root.WWAMVerdictRoomAdapter;
    var snapshot = adapter && typeof adapter.getStatus === "function"
      ? adapter.getStatus()
      : {};
    var copy = snapshot.persistence === "blocked-invalid-saved-ledger"
      ? "HUMAN REVIEW READY // INVALID SAVED LEDGER HELD UNTOUCHED // MEMORY-ONLY."
      : snapshot.persistence === "memory-only"
        ? "HUMAN REVIEW READY // STORAGE UNAVAILABLE // THIS SESSION IS MEMORY-ONLY."
        : snapshot.persistence === "restored"
          ? "HUMAN REVIEW READY // EXACT SAVED AUDIT TRAIL RESTORED."
          : "HUMAN REVIEW READY // MACHINE DOCKETS REMAIN UNRESOLVED.";
    setStatus(copy, "ready");
  }

  function mount() {
    if (mountPromise) return mountPromise;
    if (!section || !stage || !status || !root.WWAMFeatureLoader) {
      return Promise.resolve(failure(new Error("Verdict Room host is unavailable.")));
    }
    setStatus("THE GAVEL IS LOCKED // VERIFYING THE HUMAN REVIEW CHAIN.", "loading");
    mountPromise = root.WWAMFeatureLoader.loadStyle("verdict-room.css")
      .then(function () {
        var adapter = root.WWAMVerdictRoomAdapter;
        if (!adapter || typeof adapter.mount !== "function" ||
            typeof adapter.open !== "function" ||
            typeof adapter.destroy !== "function") {
          throw new Error("The bounded WWAM Verdict Room adapter is unavailable.");
        }
        return adapter.mount(stage);
      })
      .then(function (controller) {
        if (!controller) throw new Error("Verdict Room refused to mount.");
        readyStatus();
        if (pendingSubject) open(pendingSubject);
        return controller;
      })
      .catch(failure);
    return mountPromise;
  }

  function destroy() {
    mountPromise = null;
    if (
      root.WWAMVerdictRoomAdapter &&
      typeof root.WWAMVerdictRoomAdapter.destroy === "function"
    ) {
      root.WWAMVerdictRoomAdapter.destroy();
    }
  }

  if (section) {
    pendingSubject = exactSubject(section.getAttribute("data-verdict-subject"));
    section.addEventListener("wwam:feature-ready", mount);
    section.addEventListener("wwam:feature-error", function () {
      setStatus("VERDICT ROOM HELD // A REVIEW ASSET COULD NOT LOAD.", "failed");
    });
  }
  if (stage) stage.addEventListener("wwam:verdict-room-storage", readyStatus);

  root.WWAMVerdictRoomSurface = Object.freeze({
    mount: mount,
    open: open,
    destroy: destroy,
  });
})(typeof window !== "undefined" ? window : globalThis);
