(function (root) {
  "use strict";

  var VERSION = "1.1.0";

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
    return number ? "$" + number.toLocaleString("en-US") : "NOT LISTED";
  }

  function dateLabel(value) {
    if (!value) return "DATE UNAVAILABLE";
    var parts = value.split("-");
    return parts.length === 3 ? parts[1] + "/" + parts[2] + "/" + parts[0] : value;
  }

  function accessLabel(entry) {
    return entry.access === "membership-unavailable" ? "MEMBERS-ONLY VIDEO" : "MEMBERS-ONLY PAGE";
  }

  function listingLabel(entry) {
    if (entry.provider === "YouTube") return "YOUTUBE MEMBER VIDEO";
    return "PATREON COMMENTARY PAGE";
  }

  function filmCard(film, entries) {
    return '<article class="cv-film-card" data-cv-film="' + esc(film.id) + '">' +
      '<div class="cv-film-art"><img src="' + esc(film.image) + '" alt="' + esc(film.title) +
      ' movie poster"><span>' + esc(film.contextLabel) + '</span></div>' +
      '<div class="cv-film-copy"><header><p>MOVIE NIGHT // ' + esc(film.year) +
      '</p><h3>' + esc(film.title) + '</h3></header><p>' + esc(film.fact) + '</p>' +
      '<div class="cv-film-facts"><span><b>' + esc(film.runtimeMinutes) + '</b>MINUTES</span>' +
      '<span><b>' + esc(money(film.budget)) + '</b>BUDGET</span><span><b>' +
      esc(money(film.worldwideBoxOffice)) + '</b>WORLDWIDE</span></div>' +
      '<footer><span><b>' + entries.length + '</b> WWAM VERSION' +
      (entries.length === 1 ? '' : 'S') + '</span><button type="button" data-cv-open="' +
      esc(film.id) + '">OPEN MOVIE + SHOW GUIDE <span>&rarr;</span></button></footer></div></article>';
  }

  function sourceRecord(entry) {
    return '<article class="cv-source-record" data-source-id="' + esc(entry.sourceId) +
      '"><header><div><p>' + esc(listingLabel(entry)) + '</p><h4>' +
      esc(entry.title) + '</h4></div><span>' +
      esc(accessLabel(entry)) + '</span></header><div class="cv-source-meta"><b>' +
      esc(dateLabel(entry.date)) + '</b><span>' + esc(entry.version) + '</span></div><p>' +
      esc(entry.sourceSummary) + '</p><a href="' + esc(entry.officialUrl) +
      '" target="_blank" rel="noopener noreferrer">OPEN OFFICIAL PAGE <span>&nearr;</span></a>' +
      '<details class="cv-source-proof"><summary>ABOUT THIS LISTING</summary><div><p>PAGE ID <code>' +
      esc(entry.sourceId) + '</code></p><ul>' + entry.sourceProof.map(function (proof) {
        return '<li>' + esc(proof) + '</li>';
      }).join('') + '</ul><p class="cv-relation">' + esc(entry.relationshipStatus) +
      '</p></div></details></article>';
  }

  function comingStrip(lanes) {
    return '<section class="cv-coming-strip"><div><p>WHEN A COMMENTARY TRACK BECOMES PLAYABLE</p>' +
      '<h3>THE FUN PART OPENS UP.</h3><span>With an accessible recording, this guide can add exact jumps to:</span></div>' +
      '<ul>' + lanes.map(function (lane) {
        return '<li>' + esc(lane.label) + '</li>';
      }).join('') + '</ul><small>Until then, the movie title alone is not enough to guess what Mike or J said.</small></section>';
  }

  function versionNote(film, payload) {
    var family = payload.sourceFamilies.filter(function (item) {
      return item.filmId === film.id;
    })[0];
    if (!family) return "";
    return '<details class="cv-version-file" data-source-family="' + esc(family.id) +
      '"><summary>WHY ' + esc(film.title.toUpperCase()) + ' HAS ' +
      esc(family.entryIds.length) + ' LISTINGS</summary><div><p>' +
      esc(family.rule) + '</p><p class="cv-family-ids">PAGE IDS: ' +
      family.entryIds.map(esc).join(" // ") + '</p></div></details>';
  }

  function dossier(film, entries, payload) {
    var first = entries[0];
    var lanes = first ? first.queuedLanes : [];
    return '<section class="cv-dossier" aria-labelledby="cvDossierTitle"><button class="cv-back" ' +
      'type="button" data-cv-close>&larr; BACK TO COMEDY SHELF</button><header class="cv-dossier-hero">' +
      '<div class="cv-dossier-art"><img src="' + esc(film.image) + '" alt="' +
      esc(film.title) + ' movie poster"></div><div><p>MOVIE + WWAM SHOW GUIDE // ' +
      esc(entries.length) + ' KNOWN VERSION' + (entries.length === 1 ? '' : 'S') +
      '</p><h2 id="cvDossierTitle">' + esc(film.title) + '</h2><span>COMMENTARY AUDIO IS NOT PUBLICLY PLAYABLE HERE YET</span>' +
      '<p>Start with the movie facts, then choose a WWAM commentary page below. The official pages are real; this demo simply cannot hear those members-only recordings, so it does not guess at quotes, jokes, or timestamps.</p></div></header>' +
      '<div class="cv-context-grid"><article><span>DIRECTOR</span><b>' + esc(film.director) +
      '</b></article><article><span>RUNTIME / RATING</span><b>' + esc(film.runtimeMinutes) +
      ' MIN / ' + esc(film.rating) + '</b></article><article><span>REPORTED BUDGET</span><b>' +
      esc(money(film.budget)) + '</b></article><article><span>WORLDWIDE BOX OFFICE</span><b>' +
      esc(money(film.worldwideBoxOffice)) + '</b></article></div><aside class="cv-context-note"><div class="cv-context-copy"><b>ABOUT THE MOVIE</b><p>' +
      esc(film.fact) + '</p></div><div class="cv-context-links"><a href="' + esc(film.contextUrl) +
      '" target="_blank" rel="noopener noreferrer">OPEN MOVIE PAGE &nearr;</a><a href="' +
      esc(film.numbersUrl) + '" target="_blank" rel="noopener noreferrer">BOX OFFICE + CREDITS &nearr;</a></div></aside>' +
      versionNote(film, payload) +
      '<section class="cv-source-ledger"><header><p>WWAM COMMENTARY PAGES</p><h3>PICK YOUR VERSION.</h3>' +
      '<span>These links lead to WWAM&rsquo;s official member pages. Playback depends on your access there.</span></header><div>' +
      entries.map(sourceRecord).join('') + '</div></section>' + comingStrip(lanes) +
      '<footer class="cv-dossier-boundary"><div><b>WHY THE GUIDE STOPS HERE</b><p>' +
      esc(payload.evidenceBoundary) + '</p></div></footer></section>';
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
    return '<div class="comedy-vault-shell" data-cv-root><header class="cv-hero"><div><p>WWAM COMEDY COMMENTARIES</p>' +
      '<h2>MOVIE NIGHT<br><em>GETS STUPID.</em></h2><span>SCARY MOVIE // HAROLD &amp; KUMAR // WAITING...</span></div>' +
      '<aside><span>ON THIS SHELF</span><b>' + esc(payload.meta.films) + ' MOVIES.<br>' +
      esc(payload.meta.officialSourceRecords) + ' WWAM VERSIONS.</b><p>The official pages are linked. The members-only commentary audio is not public in this demo yet.</p></aside></header>' +
      '<div class="cv-command"><label><span>FIND A MOVIE</span><input type="search" data-cv-search value="' +
      esc(state.query) + '" placeholder="Scary Movie, Waiting, Harold..."></label><div role="group" aria-label="Comedy vault filters">' +
      '<button type="button" data-cv-filter="all" class="' + (state.filter === "all" ? "is-active" : "") +
      '">ALL FOUR MOVIES</button>' + films.map(function (film) {
        return '<button type="button" data-cv-filter="' + esc(film.id) + '" class="' +
          (state.filter === film.id ? "is-active" : "") + '">' + esc(film.title) + '</button>';
      }).join('') + '</div></div><aside class="cv-boundary"><b>WHERE ARE THE PLAY BUTTONS?</b><p>' +
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
      var art = event.target.closest(".cv-film-art, .cv-dossier-art");
      if (art) art.classList.add("is-image-held");
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
      target.innerHTML = '<div class="cv-load-failure" role="alert"><b>COMEDY SHELF COULD NOT OPEN</b><p>' +
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