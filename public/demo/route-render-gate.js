(function (root) {
  "use strict";

  var groups = {};
  var rendered = {};
  var counts = {};
  var active = "";
  var started = false;
  var targetGroup = {
    top: "home",
    "shows-hub": "shows", livewire: "shows", companion: "shows", popular25: "shows",
    archive: "shows", "livestream-canon": "shows", yearCanonSpotlight: "shows", "archive-browser": "shows", "time-capsules": "shows",
    "watchalongs-hub": "watchalongs", "watchalong-canon": "watchalongs", franchises: "watchalongs", autopsies: "watchalongs",
    "halloween-universe": "watchalongs", "comedy-vault": "watchalongs",
    "characters-hub": "characters", characters: "characters", lore: "characters",
    loreDossier: "characters", memory: "characters", "tape-keeps-score": "characters",
    ask: "ask",
    "best-bits": "highlights", red100: "highlights", upinya: "highlights",
    "steves-asshole": "highlights", "night-shift": "highlights", trivia: "highlights",
    "verdict-room": "studio", "fresh-intake": "studio", labs: "studio", control: "studio",
    "clip-lab": "studio", "cut-test": "studio", canon: "studio", pitch: "studio", proof: "studio"
  };

  function initialGroup() {
    var Params = root.URLSearchParams;
    var sourceId = Params ? new Params(root.location.search).get("source") : "";
    if (sourceId) return "dossier";
    var target = String(root.location.hash || "#top").replace(/^#/, "");
    try { target = decodeURIComponent(target); } catch (error) {}
    return targetGroup[target] || "home";
  }

  function render(name, force) {
    var work = groups[name];
    if (!Array.isArray(work) || rendered[name] && !force) return false;
    work.forEach(function (renderer) {
      if (typeof renderer === "function") renderer();
    });
    rendered[name] = true;
    counts[name] = (counts[name] || 0) + 1;
    return true;
  }

  function activate(name) {
    if (name === "all") {
      active = "all";
      render("global");
      Object.keys(groups).forEach(function (group) {
        if (group !== "global") render(group);
      });
      return active;
    }
    active = Array.isArray(groups[name]) ? name : "home";
    render("global");
    render(active);
    return active;
  }

  function handleJourney(event) {
    activate(event && event.detail && event.detail.group);
  }

  function start(nextGroups) {
    if (started) return api;
    groups = nextGroups || {};
    started = true;
    root.document.addEventListener("wwam:journey-change", handleJourney);
    activate(initialGroup());
    return api;
  }

  function invalidate(names) {
    var list = Array.isArray(names) ? names : [names];
    list.forEach(function (name) { rendered[name] = false; });
    if (list.indexOf("global") >= 0) render("global");
    if (active === "all") {
      list.forEach(function (name) { if (name !== "global") render(name); });
    } else if (list.indexOf(active) >= 0) render(active);
  }

  function refresh() {
    Object.keys(groups).forEach(function (name) { rendered[name] = false; });
    activate(active || initialGroup());
  }

  function snapshot() {
    return {
      active: active,
      rendered: Object.assign({}, rendered),
      counts: Object.assign({}, counts)
    };
  }

  var api = Object.freeze({
    version: "1.0.1",
    start: start,
    activate: activate,
    invalidate: invalidate,
    refresh: refresh,
    snapshot: snapshot
  });
  root.WWAMRouteRenderGate = api;
})(typeof window !== "undefined" ? window : globalThis);
