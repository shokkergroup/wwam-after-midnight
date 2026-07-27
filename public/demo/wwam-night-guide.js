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

  var VERSION = "2.0.0";
  var DOCK_ID = "wwamNightGuideMobile";
  var MEDIA_QUERY = "(max-width: 760px)";
  var ROUTES = Object.freeze([
    Object.freeze({ id: "shows", label: "Shows", href: "#livewire" }),
    Object.freeze({ id: "ask", label: "Ask", href: "#ask" }),
    Object.freeze({ id: "upinya", label: "Up In Ya", href: "#upinya" }),
    Object.freeze({ id: "steve", label: "Steve", href: "#steves-asshole" })
  ]);

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderMarkup() {
    return '<nav class="wwam-night-guide-mobile" id="' + DOCK_ID + '" aria-label="WWAM mobile shortcuts">' +
      ROUTES.map(function (route) {
        return '<a class="wwam-night-guide-mobile__item" href="' + escapeHtml(route.href) +
          '" data-night-guide-route="' + escapeHtml(route.id) + '"><span>' +
          escapeHtml(route.label) + '</span></a>';
      }).join("") +
      '<button class="wwam-night-guide-mobile__item wwam-night-guide-mobile__rooms" type="button" ' +
      'data-night-guide-open-rooms aria-expanded="false"><span>All Rooms</span></button></nav>';
  }

  function create(options) {
    options = options || {};
    var documentRef = options.document || root.document;
    var windowRef = options.window || root;
    if (!documentRef || !documentRef.body) throw new Error("WWAM mobile dock requires a document body.");

    var existing = documentRef.getElementById(DOCK_ID);
    if (existing && existing.__wwamNightGuideApi) return existing.__wwamNightGuideApi;

    var holder = documentRef.createElement("div");
    holder.innerHTML = renderMarkup();
    var dock = holder.firstElementChild;
    documentRef.body.appendChild(dock);
    documentRef.body.classList.add("wwam-night-guide-mobile-active");

    var roomsButton = dock.querySelector("[data-night-guide-open-rooms]");
    var roomsObserver = null;
    var sectionObserver = null;
    var state = { activeHash: windowRef.location ? windowRef.location.hash : "" };

    function currentRoomsControl() {
      return documentRef.getElementById("guidedMoreButton");
    }

    function syncRoomsState() {
      var control = currentRoomsControl();
      if (!control) {
        roomsButton.setAttribute("aria-expanded", "false");
        roomsButton.removeAttribute("aria-controls");
        return;
      }
      roomsButton.setAttribute("aria-expanded", control.getAttribute("aria-expanded") === "true" ? "true" : "false");
      var controls = control.getAttribute("aria-controls");
      if (controls) roomsButton.setAttribute("aria-controls", controls);
      else roomsButton.removeAttribute("aria-controls");
    }

    function watchRoomsControl() {
      var control = currentRoomsControl();
      syncRoomsState();
      if (!control || typeof windowRef.MutationObserver !== "function") return;
      roomsObserver = new windowRef.MutationObserver(syncRoomsState);
      roomsObserver.observe(control, { attributes: true, attributeFilter: ["aria-expanded", "aria-controls"] });
    }

    function updateActive(hash) {
      state.activeHash = hash || "";
      Array.prototype.forEach.call(dock.querySelectorAll("a[data-night-guide-route]"), function (link) {
        if (link.getAttribute("href") === state.activeHash) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }

    function openExistingRooms(event) {
      event.preventDefault();
      var control = currentRoomsControl();
      if (!control) return;
      control.click();
      windowRef.setTimeout(syncRoomsState, 0);
    }

    function handleClick(event) {
      var rooms = event.target.closest && event.target.closest("[data-night-guide-open-rooms]");
      if (rooms && dock.contains(rooms)) {
        openExistingRooms(event);
        return;
      }
      var link = event.target.closest && event.target.closest("a[data-night-guide-route]");
      if (link && dock.contains(link)) updateActive(link.getAttribute("href"));
    }

    function handleHashChange() {
      updateActive(windowRef.location ? windowRef.location.hash : "");
    }

    function watchSections() {
      if (typeof windowRef.IntersectionObserver !== "function") return;
      var targets = ROUTES.map(function (route) {
        return documentRef.getElementById(route.href.slice(1));
      }).filter(Boolean);
      sectionObserver = new windowRef.IntersectionObserver(function (entries) {
        var visible = entries.filter(function (entry) { return entry.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
        if (visible.length) updateActive("#" + visible[0].target.id);
      }, { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.1, 0.25] });
      targets.forEach(function (target) { sectionObserver.observe(target); });
    }

    function destroy() {
      dock.removeEventListener("click", handleClick);
      if (windowRef.removeEventListener) windowRef.removeEventListener("hashchange", handleHashChange);
      if (roomsObserver) roomsObserver.disconnect();
      if (sectionObserver) sectionObserver.disconnect();
      documentRef.body.classList.remove("wwam-night-guide-mobile-active");
      dock.remove();
    }

    var api = Object.freeze({
      VERSION: VERSION,
      destroy: destroy,
      getState: function () { return Object.assign({}, state); },
      syncRoomsState: syncRoomsState
    });

    dock.addEventListener("click", handleClick);
    if (windowRef.addEventListener) windowRef.addEventListener("hashchange", handleHashChange);
    updateActive(state.activeHash);
    watchRoomsControl();
    watchSections();
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
    renderMarkup: renderMarkup,
    create: create,
    autoMount: autoMount
  });
});