(function (root) {
  "use strict";

  var VERSION = "1.0.0";

  function array(value) { return Array.isArray(value) ? value : []; }
  function clean(value) { return String(value == null ? "" : value).trim(); }
  function esc(value) {
    return clean(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function attr(value) { return esc(value); }
  function fmt(value) { return Number(value || 0).toLocaleString("en-US"); }
  function time(seconds) {
    var total = Math.max(0, Math.floor(Number(seconds) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = total % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : minutes) + ":" + String(secs).padStart(2, "0");
  }
  function evidenceClass(state) {
    if (/curated/.test(state)) return "hu-proof-curated";
    if (/quarantined/.test(state)) return "hu-proof-review";
    if (/navigation/.test(state)) return "hu-proof-nav";
    if (/held/.test(state)) return "hu-proof-held";
    return "hu-proof-machine";
  }
  function evidence(item) {
    return '<span class="hu-proof ' + evidenceClass(clean(item.evidenceState)) + '">' +
      esc(item.evidenceLabel || item.evidenceState || "EVIDENCE STATE UNKNOWN") + '</span>';
  }
  function playButton(item, label) {
    if (!item || item.playable === false || !item.sourceId || item.start == null) return "";
    return '<button type="button" class="hu-play" data-hu-play data-source-id="' + attr(item.sourceId) +
      '" data-start="' + attr(item.start) + '" data-end="' + attr(item.end) +
      '" data-label="' + attr(item.label || item.title || label || "SOURCE MOMENT") +
      '" data-url="' + attr(item.url) + '" data-evidence-state="' + attr(item.evidenceState) +
      '"><span aria-hidden="true">&#9654;</span> ' + esc(label || "PLAY EXACT MOMENT") + '</button>';
  }
  function sourceLink(item, label) {
    var href = clean(item && item.url);
    if (!href) return "";
    return '<a class="hu-source" href="' + attr(href) + '" target="_blank" rel="noopener noreferrer">' +
      esc(label || "OPEN OFFICIAL SOURCE") + ' -&gt;</a>';
  }
  function receiptCard(item, extra) {
    return '<article class="hu-receipt ' + esc(extra || "") + '">' +
      '<div class="hu-receipt-top">' + evidence(item) +
      (item.start != null ? '<time>' + esc(time(item.start)) + (item.end != null ? ' - ' + esc(time(item.end)) : "") + '</time>' : "") +
      '</div><h4>' + esc(item.label || item.title || "SOURCE RECEIPT") + '</h4>' +
      (item.film ? '<p class="hu-receipt-film">' + esc(item.film) + '</p>' : "") +
      (item.excerpt ? '<blockquote>&ldquo;' + esc(item.excerpt) + '&rdquo;</blockquote>' : "") +
      (item.performanceStatus === "not-established" ? '<p class="hu-warning">CHARACTER REFERENCE ONLY // A PERFORMANCE IS NOT ESTABLISHED</p>' : "") +
      (item.reviewRequired ? '<p class="hu-warning">NEGATIVE-LANGUAGE SIGNAL // LOCAL CONTEXT REVIEW STILL REQUIRED</p>' : "") +
      '<div class="hu-receipt-actions">' + playButton(item) + sourceLink(item) + '</div></article>';
  }
  function filmCard(film) {
    return '<article class="hu-film-card ' + (film.access === "held" ? "is-held" : "") + '">' +
      '<button type="button" class="hu-film-open" data-hu-film="' + attr(film.id) + '" aria-label="Open ' + attr(film.film) + ' dossier">' +
      '<div class="hu-film-art"><img src="' + attr(film.thumbnail) + '" alt="' + attr(film.film + " WWAM commentary thumbnail") + '" loading="lazy">' +
      '<span>CASE ' + String(film.order).padStart(2, "0") + '</span><b>' + esc(time(film.duration)) + '</b></div>' +
      '<div class="hu-film-copy">' + evidence(film) + '<h3>' + esc(film.film) + '</h3>' +
      '<p>' + esc(film.summary) + '</p><dl><div><dt>BEST MOMENTS</dt><dd>' + film.moments.length + '</dd></div>' +
      '<div><dt>SCENE DOORS</dt><dd>' + film.topicDoors.length + '</dd></div><div><dt>ALT. PATHS</dt><dd>' + film.variants.length + '</dd></div></dl>' +
      '<span class="hu-open-label">OPEN THIS SHOW WIKI -&gt;</span></div></button></article>';
  }
  function lineageCard(item) {
    return '<article class="hu-lineage"><div class="hu-lineage-art"><img src="' + attr(item.thumbnail) + '" alt="' + attr(item.title + " thumbnail") + '" loading="lazy"></div>' +
      '<div>' + evidence(item) + '<p class="hu-eyebrow">VERSION-AWARE SOURCE</p><h3>' + esc(item.version) + '</h3>' +
      '<p>' + esc(item.summary || item.title) + '</p><p class="hu-lineage-base">CONNECTED TO // ' + esc(item.baseFilm || item.film) + '</p>' +
      '<div class="hu-receipt-actions">' + sourceLink(item, "OPEN THIS VERSION") + '</div></div></article>';
  }
  function selectedFilm(film) {
    if (!film) return "";
    var variantHtml = film.variants.length ? film.variants.map(lineageCard).join("") : '<p class="hu-empty">No alternate treatment is currently mapped to this source.</p>';
    var moments = film.moments.length ? film.moments.map(function (item) { return receiptCard(item); }).join("") : '<article class="hu-held-card"><b>SOURCE VISIBLE // MOMENTS HELD</b><p>No caption-backed receipt map is available. The official upload remains linked without invented quotes or timestamps.</p>' + sourceLink(film) + '</article>';
    var topics = film.topicDoors.slice(0, 10).map(function (item) { return receiptCard(item); }).join("") || '<p class="hu-empty">No scene/topic doors are available for this source.</p>';
    var references = film.characterReferences.map(function (item) { return receiptCard(item); }).join("") || '<p class="hu-empty">No character-reference navigation lane is available.</p>';
    return '<section class="hu-dossier" aria-labelledby="huDossierTitle"><div class="hu-dossier-hero"><div class="hu-dossier-image"><img src="' + attr(film.thumbnail) + '" alt="' + attr(film.film + " commentary") + '"></div>' +
      '<div class="hu-dossier-copy"><button type="button" class="hu-back" data-hu-close-film>&lt;- ALL 13 TAPES</button><p class="hu-eyebrow">SHOW WIKI // TAPE ' + String(film.order).padStart(2, "0") + '</p>' +
      '<h2 id="huDossierTitle">' + esc(film.film) + '</h2>' + evidence(film) + '<p class="hu-dossier-summary">' + esc(film.summary) + '</p>' +
      '<div class="hu-dossier-stats"><span><b>' + fmt(film.wordsAudited) + '</b>AUDITED WORDS</span><span><b>' + fmt(film.captionEvents) + '</b>CAPTION EVENTS</span><span><b>' + film.unhinged + '</b>UNHINGED INDEX</span></div>' +
      '<div class="hu-receipt-actions">' + sourceLink(film, "OPEN FULL OFFICIAL TAPE") + '</div></div></div>' +
      '<div class="hu-dossier-nav"><a href="#huBestMoments">BEST MOMENTS</a><a href="#huSceneDoors">SCENE DOORS</a><a href="#huCharacterRefs">CHARACTER REFERENCES</a><a href="#huVersions">VERSIONS</a></div>' +
      '<section class="hu-dossier-lane" id="huBestMoments"><header><p class="hu-eyebrow">SOURCE-LOCAL CAPTION MAP</p><h3>BEST MOMENTS</h3><p>Machine-surfaced navigation candidates; speaker identity is not inferred.</p></header><div class="hu-receipt-grid">' + moments + '</div></section>' +
      '<section class="hu-dossier-lane" id="huSceneDoors"><header><p class="hu-eyebrow">JUMP BY SUBJECT</p><h3>SCENE & TOPIC DOORS</h3><p>Exact caption events that help you move through the show. These do not certify an opinion.</p></header><div class="hu-receipt-grid">' + topics + '</div></section>' +
      '<section class="hu-dossier-lane" id="huCharacterRefs"><header><p class="hu-eyebrow">REFERENCE FIREWALL ON</p><h3>CHARACTER REFERENCES</h3><p>References to Loomis or Challis stay separate from the recurring performance library.</p></header><div class="hu-receipt-grid">' + references + '</div></section>' +
      '<section class="hu-dossier-lane" id="huVersions"><header><p class="hu-eyebrow">LINEAGE, NOT DUPLICATION</p><h3>OTHER CUTS & REPEATS</h3></header><div class="hu-lineage-grid">' + variantHtml + '</div></section></section>';
  }
  function pathCard(path) {
    var image = path.items.find(function (item) { return item.thumbnail; });
    return '<article class="hu-path-card"><div class="hu-path-number">' + String(path.items.length).padStart(2, "0") + '</div>' +
      (image ? '<img src="' + attr(image.thumbnail) + '" alt="" loading="lazy">' : "") +
      '<div><p class="hu-eyebrow">PLAYABLE PATH</p><h3>' + esc(path.label) + '</h3><p>' + esc(path.description) + '</p>' +
      '<button type="button" class="hu-path-open" data-hu-path="' + attr(path.id) + '">ENTER PATH -&gt;</button></div></article>';
  }
  function activePath(path) {
    if (!path) return "";
    var cards = path.items.map(function (item) {
      if (item.film && item.moments) return filmCard(item);
      if (item.version) return lineageCard(item);
      if (item.kind === "halloween-source") {
        return '<article class="hu-source-card"><img src="' + attr(item.thumbnail) + '" alt="' + attr(item.title + " thumbnail") + '" loading="lazy"><div>' + evidence(item) + '<h3>' + esc(item.title) + '</h3><p>' + esc(item.summary) + '</p><p class="hu-topic-list">' + esc(item.topics.slice(0, 5).map(function (topic) { return topic.name; }).join(" // ")) + '</p>' + sourceLink(item) + '</div></article>';
      }
      return receiptCard(item);
    }).join("");
    return '<section class="hu-path-detail"><button type="button" class="hu-back" data-hu-close-path>&lt;- ALL PATHS</button><p class="hu-eyebrow">ACTIVE PATH // ' + path.items.length + ' ENTRIES</p><h2>' + esc(path.label) + '</h2><p class="hu-path-intro">' + esc(path.description) + '</p><div class="hu-path-results">' + cards + '</div></section>';
  }
  function searchResults(results, query) {
    if (!query) return "";
    if (!results.length) return '<section class="hu-search-results"><h2>NO DOOR OPENED</h2><p>Try a film, character, topic, or phrase such as &quot;Loomis,&quot; &quot;Halloween 6,&quot; or &quot;love letter.&quot;</p></section>';
    return '<section class="hu-search-results"><p class="hu-eyebrow">UNIVERSE SEARCH // ' + results.length + ' MATCHES</p><h2>RESULTS FOR &quot;' + esc(query) + '&quot;</h2><div class="hu-receipt-grid">' + results.map(function (result) {
      var item = result.item;
      if (result.kind === "film") return filmCard(item);
      if (result.kind === "halloween-source") return '<article class="hu-source-card"><div>' + evidence(item) + '<h3>' + esc(item.title) + '</h3><p>' + esc(item.summary) + '</p>' + sourceLink(item) + '</div></article>';
      return receiptCard(item);
    }).join("") + '</div></section>';
  }
  function mainView(model) {
    if (model.query) return searchResults(model.searchResults, model.query);
    if (model.selectedFilm) return selectedFilm(model.selectedFilm);
    if (model.activePath) return activePath(model.activePath);
    if (model.activeTab === "paths") return '<section class="hu-paths"><header class="hu-lane-heading"><p class="hu-eyebrow">CHOOSE YOUR ROUTE</p><h2>SIX WAYS THROUGH HADDONFIELD</h2><p>Paths organize evidence; they do not rewrite or merge source history.</p></header><div class="hu-path-grid">' + model.paths.map(pathCard).join("") + '</div></section>';
    if (model.activeTab === "doctors") return '<section><header class="hu-lane-heading"><p class="hu-eyebrow">30 EXACT 14-SECOND RECEIPTS</p><h2>LOOMIS & CHALLIS ON CALL</h2><p>Owner-mapped recurring-character performance candidates. Clip audio is not speaker-diarized.</p></header><div class="hu-character-columns"><div><h3>DR. LOOMIS // ' + model.loomis.length + '</h3>' + model.loomis.map(function (item) { return receiptCard(item); }).join("") + '</div><div><h3>DR. CHALLIS // ' + model.challis.length + '</h3>' + model.challis.map(function (item) { return receiptCard(item); }).join("") + '</div></div></section>';
    if (model.activeTab === "up") return '<section><header class="hu-lane-heading"><p class="hu-eyebrow">HUMAN-SELECTED // SOURCE-BOUNDED</p><h2>HALLOWEEN UP IN YA</h2><p>Seven editorial selections from the core commentary run.</p></header><div class="hu-receipt-grid">' + model.upInYa.map(function (item) { return receiptCard(item); }).join("") + '</div></section>';
    if (model.activeTab === "steve") return '<section><header class="hu-lane-heading"><p class="hu-eyebrow">NO VERDICTS PROMOTED</p><h2>STEVE&#39;S CONTEXT-REVIEW QUEUE</h2><p>These are negative-language signals, not certified &quot;Straight to Steve&#39;s Asshole&quot; decisions. Play the source and review local context first.</p></header><div class="hu-review-banner"><b>' + model.summary.strictSteveCandidates + ' CORE COMMENTARY SIGNALS</b><span>' + model.summary.steveReviewQueue + ' TOTAL REVIEW CANDIDATES</span></div><div class="hu-receipt-grid">' + model.steve.map(function (item) { return receiptCard(item); }).join("") + '</div></section>';
    if (model.activeTab === "canon") return '<section><header class="hu-lane-heading"><p class="hu-eyebrow">DIRECT OFFICIAL SOURCES // CURRENT LEDGER</p><h2>THE 79-SOURCE HALLOWEEN CANON</h2><p>Watchalongs, reviews, guests, rankings, script readings, trailers, news, theories, and lore. Coverage labels tell you whether a source has captions, topic navigation, or a metadata brief.</p></header><div class="hu-canon-grid">' + model.canon.map(function (item) { return '<article class="hu-source-card"><img src="' + attr(item.thumbnail) + '" alt="' + attr(item.title + " thumbnail") + '" loading="lazy"><div>' + evidence(item) + '<p class="hu-eyebrow">' + esc(item.sourceKind || "HALLOWEEN SOURCE") + '</p><h3>' + esc(item.title) + '</h3><p>' + esc(item.summary) + '</p><p class="hu-topic-list">' + esc(item.roles.join(" // ")) + '</p><div class="hu-canon-counts"><span>' + fmt(item.wordsAudited) + ' WORDS</span><span>' + item.moments.length + ' MOMENTS</span><span>' + item.upInYaCandidateCount + ' MACHINE UP IN YA</span><span>' + item.strictSteveCandidateCount + ' STRICT STEVE</span></div>' + sourceLink(item) + '</div></article>'; }).join("") + '</div></section>';
    if (model.activeTab === "evidence") return '<section class="hu-evidence-room"><header class="hu-lane-heading"><p class="hu-eyebrow">HOW TO READ THE WORLD</p><h2>THE EVIDENCE FIREWALL</h2><p>The archive shows what each receipt can support - and what it cannot.</p></header><div class="hu-evidence-grid">' + model.evidenceLegend.map(function (item) { return '<article>' + evidence(item) + '<h3>' + esc(item.title) + '</h3><p>' + esc(item.description) + '</p></article>'; }).join("") + '</div></section>';
    return '<section class="hu-films"><header class="hu-lane-heading"><p class="hu-eyebrow">THE COMPLETE CORE COMMENTARY RUN</p><h2>13 TAPES. 12 CAPTION MAPS. ZERO INVENTED RECEIPTS.</h2><p>Open any cover for its own show wiki, best moments, topic doors, character-reference lanes, and version history.</p></header><div class="hu-film-grid">' + model.films.map(filmCard).join("") + '</div></section>';
  }

  function renderMarkup(model) {
    var s = model.summary;
    var tabs = [
      ["films", "13 SHOW WIKIS"], ["paths", "PLAYABLE PATHS"], ["doctors", "LOOMIS + CHALLIS"],
      ["up", "UP IN YA"], ["steve", "STEVE REVIEW"], ["canon", "79-SOURCE CANON"], ["evidence", "EVIDENCE"]
    ];
    return '<div class="halloween-universe-shell" data-hu-root><header class="hu-hero"><div class="hu-hero-copy"><p class="hu-eyebrow">THE HADDONFIELD MEMORY WORLD // V1</p>' +
      '<h2>EVERY TAPE IS<br><em>A DOOR.</em></h2><p>Thirteen core commentaries, alternate cuts, midnight repeats, recurring-character callbacks, and exact source moments - connected without collapsing their evidence boundaries.</p></div>' +
      '<div class="hu-hero-art"><div class="hu-tape hu-tape-one">LOOMIS</div><div class="hu-tape hu-tape-two">CHALLIS</div><div class="hu-tape hu-tape-three">THE SHAPE</div><span>VIDEO STORE // AISLE 10.31</span></div></header>' +
      '<section class="hu-proof-strip"><div><b>' + s.films + '</b><span>CORE TAPES</span></div><div><b>' + fmt(s.auditedWords) + '</b><span>AUDITED WORDS</span></div><div><b>' + s.topicDoors + '</b><span>SCENE DOORS</span></div><div><b>' + s.characterCallbacks + '</b><span>DOCTOR CALLBACKS</span></div><div><b>' + s.alternateTreatments + '</b><span>VERSION PATHS</span></div><div><b>' + s.canonSources + '</b><span>DIRECT SOURCES</span></div></section>' +
      '<div class="hu-command"><label for="huUniverseSearch"><span>SEARCH THE UNIVERSE</span><input id="huUniverseSearch" data-hu-search type="search" value="' + attr(model.query) + '" placeholder="Loomis, Halloween 6, Michael, love letter..." autocomplete="off"></label>' +
      '<nav aria-label="Halloween Universe views">' + tabs.map(function (tab) { return '<button type="button" data-hu-tab="' + tab[0] + '" class="' + (model.activeTab === tab[0] && !model.query ? "is-active" : "") + '">' + tab[1] + '</button>'; }).join("") + '</nav></div>' +
      '<div class="hu-stage" aria-live="polite">' + mainView(model) + '</div>' +
      '<footer class="hu-footer"><b>SOURCE FIRST. CONTEXT VISIBLE. CREATOR CERTIFICATION NEVER IMPLIED.</b><span>' + s.captionBackedFilms + ' caption-backed core tapes // ' + s.heldFilms + ' held source // ' + s.acquiredSources + ' acquired surrounding shows</span></footer></div>';
  }

  function buildModel(engine, state) {
    var callbacks = engine.listCallbacks();
    var paths = engine.listPaths();
    return {
      summary: engine.summary(),
      films: engine.listFilms(),
      paths: paths,
      loomis: callbacks.filter(function (item) { return item.characterId === "loomis"; }),
      challis: callbacks.filter(function (item) { return item.characterId === "challis"; }),
      upInYa: engine.listUpInYa(),
      steve: engine.listSteveQueue(),
      canon: engine.listCanonSources(),
      activeTab: state.activeTab,
      activePath: state.pathId ? paths.find(function (path) { return path.id === state.pathId; }) || null : null,
      selectedFilm: state.filmId ? engine.getFilm(state.filmId) : null,
      query: state.query,
      searchResults: state.query ? engine.search(state.query, 30) : [],
      evidenceLegend: [
        { evidenceState: engine.evidence.curated, evidenceLabel: engine.evidenceLabel(engine.evidence.curated), title: "Exact and editorially selected", description: "A human selected a bounded source timestamp. Speaker identity still follows the stated mapping boundary." },
        { evidenceState: engine.evidence.machine, evidenceLabel: engine.evidenceLabel(engine.evidence.machine), title: "Caption-derived navigation", description: "Useful for finding the moment; not proof of speaker identity, intent, or final opinion." },
        { evidenceState: engine.evidence.quarantined, evidenceLabel: engine.evidenceLabel(engine.evidence.quarantined), title: "Context review required", description: "The signal is playable but cannot be promoted as a definitive bit or verdict yet." },
        { evidenceState: engine.evidence.navigation, evidenceLabel: engine.evidenceLabel(engine.evidence.navigation), title: "Door, not a claim", description: "The timestamp helps navigation only. Character references do not become character performances." },
        { evidenceState: engine.evidence.held, evidenceLabel: engine.evidenceLabel(engine.evidence.held), title: "Source remains visible", description: "When captions are unavailable, the archive links the tape and refuses to invent a summary or clip." }
      ]
    };
  }

  function create(options) {
    options = options || {};
    var engine = options.engine;
    if (!engine) throw new Error("Halloween Universe UI requires an engine.");
    var documentRef = options.document || root.document;
    var mountNode = null;
    var state = { activeTab: "films", filmId: "", pathId: "", query: "" };
    var inputTimer = 0;

    function render() {
      if (!mountNode) return;
      mountNode.innerHTML = renderMarkup(buildModel(engine, state));
      var section = mountNode.closest ? mountNode.closest("#halloween-universe") : null;
      if (section) {
        section.setAttribute("aria-busy", "false");
        section.setAttribute("data-halloween-universe-ready", "true");
      }
    }
    function play(detail) {
      if (typeof options.onPlay === "function") options.onPlay(detail);
      if (documentRef && typeof root.CustomEvent === "function") {
        documentRef.dispatchEvent(new root.CustomEvent("wwam:halloween-play", { detail: detail }));
      }
    }
    function handleClick(event) {
      var tab = event.target.closest && event.target.closest("[data-hu-tab]");
      if (tab) { state.activeTab = tab.getAttribute("data-hu-tab"); state.filmId = ""; state.pathId = ""; state.query = ""; render(); return; }
      var film = event.target.closest && event.target.closest("[data-hu-film]");
      if (film) { state.filmId = film.getAttribute("data-hu-film"); state.pathId = ""; state.query = ""; render(); return; }
      var path = event.target.closest && event.target.closest("[data-hu-path]");
      if (path) { state.pathId = path.getAttribute("data-hu-path"); state.filmId = ""; render(); return; }
      if (event.target.closest && event.target.closest("[data-hu-close-film]")) { state.filmId = ""; render(); return; }
      if (event.target.closest && event.target.closest("[data-hu-close-path]")) { state.pathId = ""; render(); return; }
      var button = event.target.closest && event.target.closest("[data-hu-play]");
      if (button) {
        play({
          sourceId: button.getAttribute("data-source-id"),
          start: Number(button.getAttribute("data-start")),
          end: Number(button.getAttribute("data-end")),
          label: button.getAttribute("data-label"),
          url: button.getAttribute("data-url"),
          evidenceState: button.getAttribute("data-evidence-state")
        });
      }
    }
    function handleInput(event) {
      if (!event.target.matches || !event.target.matches("[data-hu-search]")) return;
      var value = event.target.value;
      clearTimeout(inputTimer);
      inputTimer = setTimeout(function () { state.query = clean(value); state.filmId = ""; state.pathId = ""; render(); var input = mountNode.querySelector("[data-hu-search]"); if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); } }, 80);
    }
    function mount(target) {
      mountNode = typeof target === "string" ? documentRef.querySelector(target) : target;
      if (!mountNode) throw new Error("Halloween Universe mount was not found.");
      mountNode.addEventListener("click", handleClick);
      mountNode.addEventListener("input", handleInput);
      render();
      return api;
    }
    function destroy() {
      clearTimeout(inputTimer);
      if (mountNode) { mountNode.removeEventListener("click", handleClick); mountNode.removeEventListener("input", handleInput); }
      mountNode = null;
    }
    var api = Object.freeze({ mount: mount, destroy: destroy, render: render, getState: function () { return Object.assign({}, state); } });
    return api;
  }

  function autoMount() {
    if (!root.document || !root.WWAMHalloweenUniverseEngine) return;
    var target = root.document.getElementById("halloweenUniverseMount");
    if (!target || target.getAttribute("data-hu-mounted") === "true") return;
    try {
      var engine = root.WWAMHalloweenUniverseEngine.create({
        catalog: root.WWAM_CATALOG,
        deep: root.WWAM_DEEP_DISTILL,
        curated: root.WWAM_CURATED,
        characters: root.WWAM_CHARACTER_LORE,
        acquired: root.WWAM_HALLOWEEN_ACQUIRED,
        canon: root.WWAM_HALLOWEEN_CANON,
        enrichment: root.WWAM_HALLOWEEN_COMMENTARY_ENRICHMENT,
        sourceDossierData: root.WWAM_SOURCE_DOSSIER
      });
      var verification = engine.verify();
      if (!verification.ok) throw new Error(verification.errors.join(" "));
      var ui = create({ engine: engine });
      ui.mount(target);
      target.setAttribute("data-hu-mounted", "true");
      root.WWAMHalloweenUniverse = Object.freeze({ engine: engine, ui: ui });
    } catch (error) {
      target.innerHTML = '<div class="hu-load-failure" role="alert"><b>HALLOWEEN UNIVERSE HELD</b><p>' + esc(error && error.message ? error.message : error) + '</p></div>';
      var section = target.closest("#halloween-universe");
      if (section) section.setAttribute("aria-busy", "false");
    }
  }

  root.WWAMHalloweenUniverseUI = Object.freeze({ VERSION: VERSION, create: create, buildModel: buildModel, renderMarkup: renderMarkup, autoMount: autoMount });
  autoMount();
})(typeof window !== "undefined" ? window : globalThis);
