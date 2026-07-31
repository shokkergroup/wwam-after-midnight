(function (root, factory) {
  "use strict";

  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WWAMNightGuide = api;
  if (root.document && root.document.documentElement) {
    root.document.documentElement.setAttribute("data-wwam-night-guide-runtime", api.VERSION);
  }
  if (root.document) api.autoMount();
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var VERSION = "3.1.0";
  var DOCK_ID = "wwamNightGuideMobile";
  var MEDIA_QUERY = "(max-width: 760px)";
  var ROUTES = Object.freeze([
    Object.freeze({ id: "shows", label: "Shows", href: "#shows-hub" }),
    Object.freeze({ id: "watchalongs", label: "Watch", href: "#watchalongs-hub" }),
    Object.freeze({ id: "highlights", label: "Best Bits", href: "#best-bits" }),
    Object.freeze({ id: "characters", label: "Characters", href: "#characters-hub" }),
    Object.freeze({ id: "fam", label: "The Fam", href: "#fam-hall" }),
    Object.freeze({ id: "ask", label: "Search", href: "#ask" })
  ]);
  var HASH_GROUPS = Object.freeze({
    "#shows-hub": "shows", "#livewire": "shows", "#archive": "shows", "#popular25": "shows",
    "#time-capsules": "shows", "#companion": "shows", "#yearCanonSpotlight": "shows",
    "#watchalongs-hub": "watchalongs", "#franchises": "watchalongs", "#autopsies": "watchalongs",
    "#halloween-universe": "watchalongs", "#comedy-vault": "watchalongs",
    "#best-bits": "highlights", "#upinya": "highlights", "#steves-asshole": "highlights",
    "#red100": "highlights", "#night-shift": "highlights", "#trivia": "highlights",
    "#characters-hub": "characters", "#characters": "characters", "#lore": "characters",
    "#loreDossier": "characters", "#memory": "characters", "#tape-keeps-score": "characters",
    "#fam-hall": "fam",
    "#ask": "ask"
  });

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderMarkup() {
    return '<nav class="wwam-night-guide-mobile" id="' + DOCK_ID + '" aria-label="WWAM mobile navigation">' +
      ROUTES.map(function (route) {
        return '<a class="wwam-night-guide-mobile__item" href="' + escapeHtml(route.href) +
          '" data-journey-link="' + escapeHtml(route.id) +
          '" data-night-guide-route="' + escapeHtml(route.id) + '"><span>' +
          escapeHtml(route.label) + '</span></a>';
      }).join("") +
      '</nav>';
  }


  function create(options) {
    options = options || {};
    var documentRef = options.document || root.document;
    var windowRef = options.window || root;
    if (!documentRef || !documentRef.body) throw new Error("WWAM mobile navigation requires a document body.");

    var existing = documentRef.getElementById(DOCK_ID);
    if (existing && existing.__wwamNightGuideApi) return existing.__wwamNightGuideApi;

    var holder = documentRef.createElement("div");
    holder.innerHTML = renderMarkup();
    var dock = holder.firstElementChild;
    documentRef.body.appendChild(dock);
    documentRef.body.classList.add("wwam-night-guide-mobile-active");

    var state = { activeHash: windowRef.location ? windowRef.location.hash : "" };

    function updateActive(hash, groupOverride) {
      state.activeHash = hash || "";
      var activeGroup = groupOverride || HASH_GROUPS[state.activeHash] || "";
      Array.prototype.forEach.call(dock.querySelectorAll("a[data-night-guide-route]"), function (link) {
        if (link.getAttribute("data-night-guide-route") === activeGroup) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }

    function handleClick(event) {
      var link = event.target.closest && event.target.closest("a[data-night-guide-route]");
      if (link && dock.contains(link)) updateActive(link.getAttribute("href"));
    }

    function handleHashChange() {
      updateActive(windowRef.location ? windowRef.location.hash : "");
    }

    function handleJourneyChange(event) {
      var detail = event && event.detail ? event.detail : {};
      var targetHash = detail.targetId ? "#" + detail.targetId :
        (windowRef.location ? windowRef.location.hash : "");
      updateActive(targetHash, detail.group || "");
    }

    function destroy() {
      dock.removeEventListener("click", handleClick);
      if (windowRef.removeEventListener) windowRef.removeEventListener("hashchange", handleHashChange);
      documentRef.removeEventListener("wwam:journey-change", handleJourneyChange);
      documentRef.body.classList.remove("wwam-night-guide-mobile-active");
      dock.remove();
    }

    var api = Object.freeze({
      VERSION: VERSION,
      destroy: destroy,
      getState: function () { return Object.assign({}, state); }
    });

    dock.addEventListener("click", handleClick);
    if (windowRef.addEventListener) windowRef.addEventListener("hashchange", handleHashChange);
    documentRef.addEventListener("wwam:journey-change", handleJourneyChange);
    updateActive(state.activeHash, documentRef.body.dataset.guidedJourney || "");
    dock.__wwamNightGuideApi = api;
    return api;
  }

  function autoMount() {
    var documentRef = root.document;
    if (!documentRef) return;

    function start() {
      var media = typeof root.matchMedia === "function" ? root.matchMedia(MEDIA_QUERY) : null;

      function reconcile() {
        var shouldMount = !media || media.matches;
        var instance = root.WWAMNightGuideInstance;
        if (shouldMount && !documentRef.getElementById(DOCK_ID)) {
          root.WWAMNightGuideInstance = create({ document: documentRef, window: root });
        } else if (!shouldMount && instance && typeof instance.destroy === "function") {
          instance.destroy();
          root.WWAMNightGuideInstance = null;
        }
      }

      if (media) {
        if (typeof media.addEventListener === "function") media.addEventListener("change", reconcile);
        else if (typeof media.addListener === "function") media.addListener(reconcile);
      }
      reconcile();
    }

    if (documentRef.readyState === "loading") documentRef.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }

  return Object.freeze({
    VERSION: VERSION,
    MEDIA_QUERY: MEDIA_QUERY,
    ROUTES: ROUTES,
    HASH_GROUPS: HASH_GROUPS,
    renderMarkup: renderMarkup,
    create: create,
    autoMount: autoMount
  });
});
