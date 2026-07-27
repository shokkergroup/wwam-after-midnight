(function (root) {
  "use strict";

  var VERSION = "1.0.0";

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function esc(value) {
    return clean(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function money(value) {
    var number = Number(value || 0);
    return number ? "$" + number.toLocaleString("en-US") : "NOT CAPTURED";
  }

  function dateLabel(value) {
    if (!value) return "DATE NOT CAPTURED";
    var parts = value.split("-");
    return parts.length === 3 ? parts[1] + "/" + parts[2] + "/" + parts[0] : value;
  }

  function accessLabel(entry) {
    return entry.access === "membership-unavailable" ? "MEMBER UPLOAD UNAVAILABLE" : "MEMBER SOURCE REQUIRED";
  }

  function filmCard(film, entries) {
    return '<article class="cv-film-card" data-cv-film="' + esc(film.id) + '">' +
      '<div class="cv-film-art"><img src="' + esc(film.image) + '" alt="' + esc(film.title) +
      ' poster context"><span>' + esc(film.contextLabel) + '</span></div>' +
      '<div class="cv-film-copy"><header><p>COMEDY WATCHALONG FILE // ' + esc(film.year) +
      '</p><h3>' + esc(film.title) + '</h3></header><p>' + esc(film.fact) + '</p>' +
      '<div class="cv-film-facts"><span><b>' + esc(film.runtimeMinutes) + '</b>MINUTES</span>' +
      '<span><b>' + esc(money(film.budget)) + '</b>BUDGET</span><span><b>' +
      esc(money(film.worldwideBoxOffice)) + '</b>WORLDWIDE</span></div>' +
      '<footer><span><b>' + entries.length + '</b> OFFICIAL WWAM SOURCE RECORD' +
      (entries.length === 1 ? '' : 'S') + '</span><button type="button" data-cv-open="' +
      esc(film.id) + '">OPEN SEALED SHOW WIKI <span>&rarr;</span></button></footer></div></article>';
  }

  function sourceRecord(entry) {
    return '<article class="cv-source-record"><header><div><p>' + esc(entry.provider) + ' // ' +
      esc(entry.mediaKind) + '</p><h4>' + esc(entry.title) + '</h4></div><span>' +
      esc(accessLabel(entry)) + '</span></header><div class="cv-source-meta"><b>' +
      esc(dateLabel(entry.date)) + '</b><span>' + esc(entry.version) + '</span></div><p>' +
      esc(entry.sourceSummary) + '</p><ul>' + entry.sourceProof.map(function (proof) {
        return '<li>' + esc(proof) + '</li>';
      }).join('') + '</ul><p class="cv-relation">' + esc(entry.relationshipStatus) +
      '</p><a href="' + esc(entry.officialUrl) +
      '" target="_blank" rel="noopener noreferrer">OPEN THE EXACT OFFICIAL RECORD <span>&nearr;</span></a></article>';
  }

  function queuedLane(lane) {
    return '<article class="cv-queued-lane"><span>0 VERIFIED RECEIPTS</span><h4>' +
      esc(lane.label) + '</h4><p>' + esc(lane.reason) +
      '</p><b>SOURCE-LOCKED // NOTHING INVENTED</b></article>';
  }

  function dossier(film, entries, payload) {
    var first = entries[0];
    var lanes = first ? first.queuedLanes : [];
    return '<section class="cv-dossier" aria-labelledby="cvDossierTitle"><button class="cv-back" ' +
      'type="button" data-cv-close>&larr; BACK TO COMEDY VAULT</button><header class="cv-dossier-hero">' +
      '<div class="cv-dossier-art"><img src="' + esc(film.image) + '" alt="' +
      esc(film.title) + ' poster context"></div><div><p>SEALED SHOW WIKI // ' +
      esc(entries.length) + ' OFFICIAL SOURCE RECORD' + (entries.length === 1 ? '' : 'S') +
      '</p><h2 id="cvDossierTitle">' + esc(film.title) + '</h2><span>WWAM-SPECIFIC RECEIPTS HELD UNTIL SOURCE ACCESS</span>' +
      '<p>We know exactly which official commentary records exist. We do not know what was said inside the locked media, so this wiki separates verified source identity, outside film context, and the work still waiting for evidence.</p></div></header>' +
      '<div class="cv-context-grid"><article><span>DIRECTOR</span><b>' + esc(film.director) +
      '</b></article><article><span>RUNTIME / RATING</span><b>' + esc(film.runtimeMinutes) +
      ' MIN / ' + esc(film.rating) + '</b></article><article><span>REPORTED BUDGET</span><b>' +
      esc(money(film.budget)) + '</b></article><article><span>WORLDWIDE BOX OFFICE</span><b>' +
      esc(money(film.worldwideBoxOffice)) + '</b></article></div><aside class="cv-context-note"><b>FILM CONTEXT IS NOT A WWAM TAKE.</b><p>' +
      esc(film.status) + '</p><div><a href="' + esc(film.contextUrl) +
      '" target="_blank" rel="noopener noreferrer">OPEN FILM CONTEXT &nearr;</a><a href="' +
      esc(film.numbersUrl) + '" target="_blank" rel="noopener noreferrer">VERIFY THE NUMBERS &nearr;</a></div></aside>' +
      (entries.length > 1 ? '<section class="cv-version-file"><header><p>VERSION CONTROL</p><h3>KEEP EVERY RECORD SEPARATE.</h3></header><p>' +
      esc(payload.sourceFamilies.filter(function (family) { return family.filmId === film.id; })[0]?.rule ||
        'Each official source record remains separate until media comparison proves a relationship.') +
      '</p></section>' : '') +
      '<section class="cv-source-ledger"><header><p>OFFICIAL WWAM RECORDS</p><h3>WHAT EXISTS.</h3></header><div>' +
      entries.map(sourceRecord).join('') + '</div></section><section class="cv-lane-queue"><header><p>THE EMPTY LANES ARE A FEATURE</p>' +
      '<h3>WHAT UNSEALS NEXT.</h3><span>These categories populate only from source-local evidence.</span></header><div>' +
      lanes.map(queuedLane).join('') + '</div></section><footer class="cv-dossier-boundary"><div><b>0 INVENTED RECEIPTS.</b><p>' +
      esc(payload.evidenceBoundary) + '</p></div><a href="#fresh-intake">STAGE A SOURCE DROP <span>&rarr;</span></a></footer></section>';
  }

  function shell(payload, state) {
    var films = Object.keys(payload.filmContext).map(function (id) { return payload.filmContext[id]; });
    var query = state.query.toLowerCase();
    var visible = films.filter(function (film) {
      if (state.filter !== "all" && film.id !== state.filter) return false;
      if (!query) return true;
      var entries = payload.entries.filter(function (entry) { return entry.filmId === film.id; });
      return [film.title, film.contextLabel].concat(entries.map(function (entry) { return entry.title; }))
        .join(" ").toLowerCase().indexOf(query) >= 0;
    });
    if (state.openFilm) {
      var open = payload.filmContext[state.openFilm];
      return open ? dossier(open, payload.entries.filter(function (entry) {
        return entry.filmId === open.id;
      }), payload) : "";
    }
    return '<div class="comedy-vault-shell" data-cv-root><header class="cv-hero"><div><p>THE COMEDY WING // VERIFIED MEMBER CANON</p>' +
      '<h2>THE JOKES ARE<br><em>STILL UNDER SEAL.</em></h2><span>SCARY MOVIE // HAROLD &amp; KUMAR // WAITING...</span></div>' +
      '<aside><b>' + esc(payload.meta.officialSourceRecords) + '</b><span>OFFICIAL SOURCE RECORDS</span><b>' +
      esc(payload.meta.inventedReceipts) + '</b><span>INVENTED RECEIPTS</span></aside></header>' +
      '<div class="cv-command"><label><span>SEARCH THE COMEDY VAULT</span><input type="search" data-cv-search value="' +
      esc(state.query) + '" placeholder="Scary Movie, Waiting, Harold..."></label><div role="group" aria-label="Comedy vault filters">' +
      '<button type="button" data-cv-filter="all" class="' + (state.filter === "all" ? "is-active" : "") +
      '">ALL FOUR MOVIES</button>' + films.map(function (film) {
        return '<button type="button" data-cv-filter="' + esc(film.id) + '" class="' +
          (state.filter === film.id ? "is-active" : "") + '">' + esc(film.title) + '</button>';
      }).join('') + '</div></div><aside class="cv-boundary"><b>SEALED DOES NOT MEAN EMPTY.</b><p>' +
      esc(payload.evidenceBoundary) + '</p></aside><div class="cv-film-grid">' +
      visible.map(function (film) {
        return filmCard(film, payload.entries.filter(function (entry) { return entry.filmId === film.id; }));
      }).join('') + '</div></div>';
  }

  function create(options) {
    options = options || {};
    var payload = options.payload || root.WWAM_COMEDY_VAULT;
    var documentRef = options.document || root.document;
    var mountNode = null;
    var state = { filter: "all", query: "", openFilm: "" };

    function render() {
      if (!mountNode) return;
      mountNode.innerHTML = shell(payload, state);
      var section = mountNode.closest("#comedy-vault");
      if (section) {
        section.setAttribute("aria-busy", "false");
        section.setAttribute("data-ready", "true");
      }
    }

    function handleClick(event) {
      var open = event.target.closest("[data-cv-open]");
      var close = event.target.closest("[data-cv-close]");
      var filter = event.target.closest("[data-cv-filter]");
      if (open) {
        state.openFilm = open.getAttribute("data-cv-open");
        render();
        mountNode.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (close) {
        state.openFilm = "";
        render();
      } else if (filter) {
        state.filter = filter.getAttribute("data-cv-filter") || "all";
        state.openFilm = "";
        render();
      }
    }

    function handleInput(event) {
      if (!event.target.matches("[data-cv-search]")) return;
      state.query = clean(event.target.value);
      render();
      var input = mountNode.querySelector("[data-cv-search]");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }

    function handleImageError(event) {
      if (!event.target.matches(".comedy-vault-shell img, .cv-dossier img")) return;
      event.target.closest(".cv-film-art, .cv-dossier-art")?.classList.add("is-image-held");
      event.target.remove();
    }

    function mount(target) {
      mountNode = typeof target === "string" ? documentRef.querySelector(target) : target;
      if (!mountNode) throw new Error("Comedy vault mount was not found.");
      mountNode.addEventListener("click", handleClick);
      mountNode.addEventListener("input", handleInput);
      mountNode.addEventListener("error", handleImageError, true);
      render();
      return api;
    }

    function destroy() {
      if (!mountNode) return;
      mountNode.removeEventListener("click", handleClick);
      mountNode.removeEventListener("input", handleInput);
      mountNode.removeEventListener("error", handleImageError, true);
      mountNode = null;
    }

    var api = Object.freeze({
      mount: mount,
      destroy: destroy,
      render: render,
      getState: function () { return Object.assign({}, state); }
    });
    return api;
  }

  function autoMount() {
    if (!root.document || !root.WWAM_COMEDY_VAULT) return;
    var target = root.document.getElementById("comedyVaultMount");
    if (!target || target.getAttribute("data-cv-mounted") === "true") return;
    try {
      var ui = create({ payload: root.WWAM_COMEDY_VAULT });
      ui.mount(target);
      target.setAttribute("data-cv-mounted", "true");
      root.WWAMComedyVault = Object.freeze({ payload: root.WWAM_COMEDY_VAULT, ui: ui });
    } catch (error) {
      target.innerHTML = '<div class="cv-load-failure" role="alert"><b>COMEDY VAULT HELD</b><p>' +
        esc(error && error.message ? error.message : error) + '</p></div>';
    }
  }

  root.WWAMComedyVaultUI = Object.freeze({
    VERSION: VERSION,
    create: create,
    renderMarkup: shell,
    autoMount: autoMount
  });
  autoMount();
})(typeof window !== "undefined" ? window : globalThis);

