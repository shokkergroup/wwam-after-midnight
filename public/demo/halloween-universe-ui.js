(function (root) {
  "use strict";

  var VERSION = "1.1.4-editorial-read";

  function array(value) { return Array.isArray(value) ? value : []; }
  function clean(value) { return String(value == null ? "" : value).trim(); }
  function esc(value) {
    return clean(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function attr(value) { return esc(value); }
  function fmt(value) { return Number(value || 0).toLocaleString("en-US"); }
  function youtubeUrl(sourceId, start) {
    var id = clean(sourceId);
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return "";
    var url = "https://www.youtube.com/watch?v=" + id;
    return Number(start || 0) > 0 ? url + "&t=" + Math.floor(Number(start)) + "s" : url;
  }
  function publicProofLabel(item) {
    var state = clean(item && item.evidenceState);
    if (/held/.test(state)) return "WATCH ONLY";
    if (/curated/.test(state)) return "EDITOR'S PICK";
    if (/quarantined/.test(state)) return "PLAY BEFORE CANON";
    if (/navigation/.test(state)) return "QUICK JUMP";
    return "PLAYABLE WIKI";
  }
  function naturalList(values) {
    var items = array(values).map(clean).filter(Boolean);
    if (items.length < 2) return items[0] || "";
    if (items.length === 2) return items[0] + " or " + items[1];
    return items.slice(0, -1).join(", ") + ", or " + items[items.length - 1];
  }
  function filmBlurb(film) {
    if (!film || film.access === "held") {
      return "The official upload is here, but this tape still needs a trustworthy timestamp pass.";
    }
    var topics = array(film.topicDoors).slice(0, 4).map(function (item) { return clean(item.label); }).filter(Boolean);
    var sentence = topics.length ? "Jump by " + naturalList(topics) + ", then hit " : "Hit ";
    sentence += film.moments.length + " marked moment" + (film.moments.length === 1 ? "" : "s") + " without scrubbing.";
    var names = Array.from(new Set(array(film.characterReferences).map(function (item) { return clean(item.character); }).filter(Boolean)));
    if (names.length) sentence += " " + naturalList(names) + " get" + (names.length === 1 ? "s" : "") + " a separate callout lane.";
    if (array(film.variants).length) sentence += " Another WWAM cut is linked inside.";
    return sentence;
  }
  function sourceBlurb(item) {
    var topics = array(item && item.topics).slice(0, 5).map(function (topic) { return clean(topic.name || topic.label); }).filter(function (name) { return name && name.toLowerCase() !== "halloween"; }).slice(0, 4);
    var opening = topics.length ? "This one moves through " + naturalList(topics) + "." : "This tape stays in WWAM's Halloween aisle.";
    var moments = array(item && item.moments).length;
    return opening + (moments ? " " + moments + " replay-ready jump point" + (moments === 1 ? " is" : "s are") + " mapped." : " Open the full upload to take the rest of the ride.");
  }
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
      esc(publicProofLabel(item)) + '</span>';
  }
  function playButton(item, label) {
    if (!item || item.playable === false || !item.sourceId || item.start == null) return "";
    return '<button type="button" class="hu-play" data-hu-play data-source-id="' + attr(item.sourceId) +
      '" data-start="' + attr(item.start) + '" data-end="' + attr(item.end) +
      '" data-label="' + attr(item.label || item.title || label || "SOURCE MOMENT") +
      '" data-url="' + attr(item.url) + '" data-evidence-state="' + attr(item.evidenceState) +
      '"><span aria-hidden="true">&#9654;</span> ' + esc(label || "PLAY THIS PART") + '</button>';
  }
  function sourceLink(item, label) {
    var href = clean(item && item.url);
    if (!href) return "";
    var original = /official|youtube/i.test(clean(label));
    var sourceId = clean(item && (item.sourceId || item.id));
    if (!original && /^[A-Za-z0-9_-]{11}$/.test(sourceId)) {
      var at = item && item.start != null ? "&at=" + Math.max(0, Math.round(Number(item.start) || 0)) : "";
      href = "?source=" + encodeURIComponent(sourceId) + at + "&section=wiki#archive";
      return '<a class="hu-source" href="' + attr(href) + '">' + esc(label || "OPEN THE LOCAL SHOW WIKI") + ' -&gt;</a>';
    }
    return '<a class="hu-source" href="' + attr(href) + '" target="_blank" rel="noopener noreferrer">' +
      esc(label || "OPEN ON YOUTUBE") + ' -&gt;</a>';
  }
  function receiptCard(item, extra) {
    return '<article class="hu-receipt ' + esc(extra || "") + '">' +
      '<div class="hu-receipt-top">' + evidence(item) +
      (item.start != null ? '<time>' + esc(time(item.start)) + (item.end != null ? ' - ' + esc(time(item.end)) : "") + '</time>' : "") +
      '</div><h4>' + esc(item.label || item.title || "SOURCE RECEIPT") + '</h4>' +
      (item.film ? '<p class="hu-receipt-film">' + esc(item.film) + '</p>' : "") +
      (item.excerpt ? '<blockquote>&ldquo;' + esc(item.excerpt) + '&rdquo;</blockquote>' : "") +
      (item.performanceStatus === "not-established" ? '<p class="hu-warning">A NAME MENTION - NOT A CONFIRMED CHARACTER BIT</p>' : "") +
      (item.reviewRequired ? '<p class="hu-warning">POSSIBLE HATE MOMENT - PLAY THE SURROUNDING MINUTE FIRST</p>' : "") +
      '<div class="hu-receipt-actions">' + playButton(item) + sourceLink(item) + '</div></article>';
  }
  function filmCard(film) {
    return '<article class="hu-film-card ' + (film.access === "held" ? "is-held" : "") + '">' +
      '<button type="button" class="hu-film-open" data-hu-film="' + attr(film.id) + '" aria-label="Open ' + attr(film.film) + ' dossier">' +
      '<div class="hu-film-art"><img src="' + attr(film.thumbnail) + '" alt="' + attr(film.film + " WWAM commentary thumbnail") + '" loading="lazy">' +
      '<span>CASE ' + String(film.order).padStart(2, "0") + '</span><b>' + esc(time(film.duration)) + '</b></div>' +
      '<div class="hu-film-copy">' + evidence(film) + '<h3>' + esc(film.film) + '</h3>' +
      '<p>' + esc(filmBlurb(film)) + '</p><dl><div><dt>MOMENTS TO REPLAY</dt><dd>' + film.moments.length + '</dd></div>' +
      '<div><dt>QUICK JUMPS</dt><dd>' + film.topicDoors.length + '</dd></div><div><dt>OTHER CUTS</dt><dd>' + film.variants.length + '</dd></div></dl>' +
      '<span class="hu-open-label">OPEN THE SHOW WIKI -&gt;</span></div></button></article>';
  }
  function lineageCard(item) {
    return '<article class="hu-lineage"><div class="hu-lineage-art"><img src="' + attr(item.thumbnail) + '" alt="' + attr(item.title + " thumbnail") + '" loading="lazy"></div>' +
      '<div>' + evidence(item) + '<p class="hu-eyebrow">ANOTHER WWAM CUT</p><h3>' + esc(item.version) + '</h3>' +
      '<p>' + esc(item.summary || item.title) + '</p><p class="hu-lineage-base">PAIRS WITH // ' + esc(item.baseFilm || item.film) + '</p>' +
      '<div class="hu-receipt-actions">' + sourceLink(item, "OPEN THIS VERSION") + '</div></div></article>';
  }
  function editorialLaneCard(film, key, fallbackLabel) {
    var read = film && film.editorialDossier || {};
    var fan = read.fanRead || {};
    var item = fan[key];
    if (!item || !clean(item.body)) return '';
    var label = clean(item.label) || fallbackLabel;
    var laneClass = key === 'hated' ? ' is-hated' : key === 'loved' ? ' is-loved' : key === 'wildestDetour' ? ' is-wild' : ' is-last-word';
    var playable = item.at != null ? playButton({
      sourceId: film.id,
      start: item.at,
      end: item.end,
      label: label,
      url: youtubeUrl(film.id, item.at),
      playable: true,
      evidenceState: "machine-surfaced"
    }, 'PLAY THIS LANE') : '';
    return '<article class="hu-editorial-lane' + laneClass + '"><div class="hu-editorial-lane-top"><span>' + esc(label) + '</span>' +
      (item.topic ? '<b>' + esc(item.topic) + '</b>' : '') + '</div><p>' + esc(item.body) + '</p>' +
      (item.at != null ? '<small>BOUND TO THE TAPE // ' + esc(time(item.at)) + '</small>' : '') +
      '<div class="hu-receipt-actions">' + playable + '</div></article>';
  }
  function editorialReadMarkup(film) {
    var read = film && film.editorialDossier;
    if (!read) return '';
    var cards = [
      editorialLaneCard(film, 'loved', 'WHAT THE TAPE DEFENDED'),
      editorialLaneCard(film, 'hated', "STRAIGHT TO STEVE'S ASSHOLE"),
      editorialLaneCard(film, 'wildestDetour', 'WILDEST DETOUR'),
      editorialLaneCard(film, 'lastWord', 'THE LAST WORD')
    ].filter(Boolean);
    var lanes = Object.keys(read.laneCounts || {}).map(function (label) {
      return { label: label, count: Number(read.laneCounts[label] || 0) };
    }).filter(function (item) { return item.count > 0; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 7);
    var laneMarkup = lanes.length ? '<div class="hu-editorial-lanes" aria-label="Episode lane mix">' + lanes.map(function (lane) {
      return '<span><b>' + esc(lane.count) + '</b> ' + esc(lane.label) + '</span>';
    }).join('') + '</div>' : '';
    return '<section class="hu-editorial-read" id="huEditorialRead"><header><div><p class="hu-eyebrow">THE SHOW, IN HUMAN TERMS</p><h3>THE NIGHT IN ONE LINE</h3></div>' +
      '<span class="hu-editorial-proof">' + (read.audioPass ? 'AUDIO FEATURE PASS ATTACHED' : 'SOURCE-BOUNDED READ') + '</span></header>' +
      (read.summary ? '<p class="hu-editorial-summary">' + esc(read.summary) + '</p>' : '') +
      (read.evidenceSummary ? '<p class="hu-editorial-evidence">' + esc(read.evidenceSummary) + '</p>' : '') + laneMarkup +
      (cards.length ? '<div class="hu-editorial-grid">' + cards.join('') + '</div>' : '') + '</section>';
  }
  function selectedFilm(film) {
    if (!film) return "";
    var variantHtml = film.variants.length ? film.variants.map(lineageCard).join("") : '<p class="hu-empty">No other WWAM cut is linked to this tape yet.</p>';
    var moments = film.moments.length ? film.moments.map(function (item) { return receiptCard(item); }).join("") : '<article class="hu-held-card"><b>WATCH IT NOW // TIMESTAMPS COMING LATER</b><p>The official upload is ready. This one still needs a careful timestamp pass before we call out best moments.</p>' + sourceLink(film) + '</article>';
    var topics = film.topicDoors.slice(0, 10).map(function (item) { return receiptCard(item); }).join("") || '<p class="hu-empty">No quick jumps are mapped for this tape yet.</p>';
    var references = film.characterReferences.map(function (item) { return receiptCard(item); }).join("") || '<p class="hu-empty">No Loomis or Challis callout lane is mapped here yet.</p>';
    return '<section class="hu-dossier" aria-labelledby="huDossierTitle"><div class="hu-dossier-hero"><div class="hu-dossier-image"><img src="' + attr(film.thumbnail) + '" alt="' + attr(film.film + " commentary") + '"></div>' +
      '<div class="hu-dossier-copy"><button type="button" class="hu-back" data-hu-close-film>&lt;- ALL 13 TAPES</button><p class="hu-eyebrow">COMMENTARY WIKI // TAPE ' + String(film.order).padStart(2, "0") + '</p>' +
      '<h2 id="huDossierTitle">' + esc(film.film) + '</h2>' + evidence(film) + '<p class="hu-dossier-summary">' + esc(filmBlurb(film)) + '</p>' +
      '<div class="hu-dossier-stats"><span><b>' + fmt(film.wordsAudited) + '</b>WORDS OF COMMENTARY</span><span><b>' + fmt(film.captionEvents) + '</b>CAPTION LINES</span><span><b>' + film.topicDoors.length + '</b>QUICK JUMPS</span></div>' +
      '<div class="hu-receipt-actions">' + sourceLink(film, "OPEN FULL OFFICIAL TAPE") + '</div></div></div>' +
      '<div class="hu-dossier-nav"><a href="#huEditorialRead">THE READ</a><a href="#huBestMoments">BEST MOMENTS</a><a href="#huSceneDoors">QUICK JUMPS</a><a href="#huCharacterRefs">CHARACTER MENTIONS</a><a href="#huVersions">VERSIONS</a></div>' +
      editorialReadMarkup(film) +
      '<section class="hu-dossier-lane" id="huBestMoments"><header><p class="hu-eyebrow">START WITH THE GOOD STUFF</p><h3>BEST MOMENTS</h3><p>These are quick ways into the tape. Auto-captions can be messy, so the play button is the final word.</p></header><div class="hu-receipt-grid">' + moments + '</div></section>' +
      '<section class="hu-dossier-lane" id="huSceneDoors"><header><p class="hu-eyebrow">JUMP BY SUBJECT</p><h3>QUICK JUMPS BY SUBJECT</h3><p>Pick a subject and land where that conversation starts.</p></header><div class="hu-receipt-grid">' + topics + '</div></section>' +
      '<section class="hu-dossier-lane" id="huCharacterRefs"><header><p class="hu-eyebrow">LOOMIS, CHALLIS & FRIENDS</p><h3>CHARACTER MENTIONS</h3><p>A name mention is not automatically a character bit. Confirmed performances live in Ask a Character.</p></header><div class="hu-receipt-grid">' + references + '</div></section>' +
      '<section class="hu-dossier-lane" id="huVersions"><header><p class="hu-eyebrow">MORE WAYS TO WATCH</p><h3>OTHER CUTS & REPEATS</h3></header><div class="hu-lineage-grid">' + variantHtml + '</div></section></section>';
  }
  function pathCard(path) {
    var image = path.items.find(function (item) { return item.thumbnail; });
    return '<article class="hu-path-card"><div class="hu-path-number">' + String(path.items.length).padStart(2, "0") + '</div>' +
      (image ? '<img src="' + attr(image.thumbnail) + '" alt="" loading="lazy">' : "") +
      '<div><p class="hu-eyebrow">BINGE PATH</p><h3>' + esc(path.label) + '</h3><p>' + esc(path.description) + '</p>' +
      '<button type="button" class="hu-path-open" data-hu-path="' + attr(path.id) + '">ENTER PATH -&gt;</button></div></article>';
  }
  function activePath(path) {
    if (!path) return "";
    var cards = path.items.map(function (item) {
      if (item.film && item.moments) return filmCard(item);
      if (item.version) return lineageCard(item);
      if (item.kind === "halloween-source") {
        return '<article class="hu-source-card"><img src="' + attr(item.thumbnail) + '" alt="' + attr(item.title + " thumbnail") + '" loading="lazy"><div>' + evidence(item) + '<h3>' + esc(item.title) + '</h3><p>' + esc(sourceBlurb(item)) + '</p><p class="hu-topic-list">' + esc(item.topics.slice(0, 5).map(function (topic) { return topic.name; }).join(" // ")) + '</p>' + sourceLink(item) + '</div></article>';
      }
      return receiptCard(item);
    }).join("");
    return '<section class="hu-path-detail"><button type="button" class="hu-back" data-hu-close-path>&lt;- ALL PATHS</button><p class="hu-eyebrow">NOW PLAYING // ' + path.items.length + ' ENTRIES</p><h2>' + esc(path.label) + '</h2><p class="hu-path-intro">' + esc(path.description) + '</p><div class="hu-path-results">' + cards + '</div></section>';
  }
  function searchResults(results, query) {
    if (!query) return "";
    if (!results.length) return '<section class="hu-search-results"><h2>NO DOOR OPENED</h2><p>Try a film, character, topic, or phrase such as &quot;Loomis,&quot; &quot;Halloween 6,&quot; or &quot;love letter.&quot;</p></section>';
    return '<section class="hu-search-results"><p class="hu-eyebrow">UNIVERSE SEARCH // ' + results.length + ' MATCHES</p><h2>RESULTS FOR &quot;' + esc(query) + '&quot;</h2><div class="hu-receipt-grid">' + results.map(function (result) {
      var item = result.item;
      if (result.kind === "film") return filmCard(item);
      if (result.kind === "halloween-source") return '<article class="hu-source-card"><div>' + evidence(item) + '<h3>' + esc(item.title) + '</h3><p>' + esc(sourceBlurb(item)) + '</p>' + sourceLink(item) + '</div></article>';
      return receiptCard(item);
    }).join("") + '</div></section>';
  }
  function mainView(model) {
    if (model.query) return searchResults(model.searchResults, model.query);
    if (model.selectedFilm) return selectedFilm(model.selectedFilm);
    if (model.activePath) return activePath(model.activePath);
    if (model.activeTab === "paths") return '<section class="hu-paths"><header class="hu-lane-heading"><p class="hu-eyebrow">CHOOSE YOUR ROUTE</p><h2>SIX WAYS THROUGH HADDONFIELD</h2><p>Pick a route and let the archive line up the tapes.</p></header><div class="hu-path-grid">' + model.paths.map(pathCard).join("") + '</div></section>';
    if (model.activeTab === "doctors") return '<section><header class="hu-lane-heading"><p class="hu-eyebrow">THE DOCTORS ARE IN</p><h2>LOOMIS & CHALLIS ON CALL</h2><p>' + fmt(model.loomis.length + model.challis.length) + ' playable Loomis and Challis bits, each clipped to the exact moment.</p></header><div class="hu-character-columns"><div><h3>DR. LOOMIS // ' + model.loomis.length + '</h3>' + model.loomis.map(function (item) { return receiptCard(item); }).join("") + '</div><div><h3>DR. CHALLIS // ' + model.challis.length + '</h3>' + model.challis.map(function (item) { return receiptCard(item); }).join("") + '</div></div></section>';
    if (model.activeTab === "up") return '<section><header class="hu-lane-heading"><p class="hu-eyebrow">THE LINES THAT BROKE CONTAINMENT</p><h2>HALLOWEEN UP IN YA</h2><p>Seven Halloween-commentary soundbytes that belong in WWAM Up In Ya.</p></header><div class="hu-receipt-grid">' + model.upInYa.map(function (item) { return receiptCard(item); }).join("") + '</div></section>';
    if (model.activeTab === "steve") return '<section><header class="hu-lane-heading"><p class="hu-eyebrow">THE MAYBE-PILE</p><h2>DID THIS GO TO STEVE&#39;S ASSHOLE?</h2><p>The tape sounds furious here. Play the surrounding minute before sending anything down the chute.</p></header><div class="hu-review-banner"><b>' + model.summary.strictSteveCandidates + ' CORE TAPES TO CHECK</b><span>' + model.summary.steveReviewQueue + ' TOTAL MOMENTS TO CHECK</span></div><div class="hu-receipt-grid">' + model.steve.map(function (item) { return receiptCard(item); }).join("") + '</div></section>';
    if (model.activeTab === "canon") return '<section><header class="hu-lane-heading"><p class="hu-eyebrow">EVERY HALLOWEEN TAPE IN THE BUILD</p><h2>THE ALL-HALLOWEEN SHELF</h2><p>Watchalongs, reviews, guests, rankings, trailers, news, theories, and lore - all in one aisle.</p></header><div class="hu-canon-grid">' + model.canon.map(function (item) { return '<article class="hu-source-card"><img src="' + attr(item.thumbnail) + '" alt="' + attr(item.title + " thumbnail") + '" loading="lazy"><div>' + evidence(item) + '<p class="hu-eyebrow">' + esc(item.sourceKind || "HALLOWEEN SOURCE") + '</p><h3>' + esc(item.title) + '</h3><p>' + esc(sourceBlurb(item)) + '</p><p class="hu-topic-list">' + esc(item.roles.join(" // ")) + '</p><div class="hu-canon-counts"><span>' + fmt(item.wordsAudited) + ' WORDS</span><span>' + item.moments.length + ' MOMENTS</span><span>' + item.upInYaCandidateCount + ' UP IN YA TO CHECK</span><span>' + item.strictSteveCandidateCount + ' STEVE TO CHECK</span></div>' + sourceLink(item) + '</div></article>'; }).join("") + '</div></section>';
    if (model.activeTab === "evidence") return '<section class="hu-evidence-room"><header class="hu-lane-heading"><p class="hu-eyebrow">WHY SOME BUTTONS LOOK DIFFERENT</p><h2>HOW WE KNOW</h2><p>A short guide to what is hand-picked, what is a quick jump, and what still needs another listen.</p></header><div class="hu-evidence-grid">' + model.evidenceLegend.map(function (item) { return '<article>' + evidence(item) + '<h3>' + esc(item.title) + '</h3><p>' + esc(item.description) + '</p></article>'; }).join("") + '</div></section>';
    return '<section class="hu-films"><header class="hu-lane-heading"><p class="hu-eyebrow">THE COMPLETE HALLOWEEN COMMENTARY RUN</p><h2>13 MOVIES. 13 SHOW WIKIS. START ANYWHERE.</h2><p>Open any cover for the full commentary, moments worth replaying, quick topic jumps, character callouts, and alternate cuts.</p></header><div class="hu-film-grid">' + model.films.map(filmCard).join("") + '</div></section>';
  }

  function renderMarkup(model) {
    var s = model.summary;
    var tabs = [
      ["films", "13 SHOW WIKIS"], ["paths", "BINGE PATHS"], ["doctors", "LOOMIS + CHALLIS"],
      ["up", "UP IN YA"], ["steve", "STEVE'S INBOX"], ["canon", "ALL HALLOWEEN"], ["evidence", "HOW IT WORKS"]
    ];
    return '<div class="halloween-universe-shell" data-hu-root><header class="hu-hero"><div class="hu-hero-copy"><p class="hu-eyebrow">WELCOME TO THE HALLOWEEN AISLE</p>' +
      '<h2>EVERY TAPE IS<br><em>A DOOR.</em></h2><p>Thirteen core commentaries, alternate cuts, midnight repeats, and recurring-character bits - all tied together without mixing up which tape a moment came from.</p></div>' +
      '<div class="hu-hero-art"><div class="hu-tape hu-tape-one">LOOMIS</div><div class="hu-tape hu-tape-two">CHALLIS</div><div class="hu-tape hu-tape-three">THE SHAPE</div><span>VIDEO STORE // AISLE 10.31</span></div></header>' +
      '<section class="hu-proof-strip"><div><b>' + s.films + '</b><span>CORE TAPES</span></div><div><b>' + fmt(s.auditedWords) + '</b><span>WORDS OF COMMENTARY</span></div><div><b>' + s.topicDoors + '</b><span>QUICK JUMPS</span></div><div><b>' + s.characterCallbacks + '</b><span>CHARACTER CLIPS</span></div><div><b>' + s.alternateTreatments + '</b><span>OTHER CUTS</span></div><div><b>' + s.canonSources + '</b><span>HALLOWEEN SHOWS</span></div></section>' +
      '<div class="hu-command"><label for="huUniverseSearch"><span>SEARCH THE UNIVERSE</span><input id="huUniverseSearch" data-hu-search type="search" value="' + attr(model.query) + '" placeholder="Loomis, Halloween 6, Michael, love letter..." autocomplete="off"></label>' +
      '<nav aria-label="Halloween Universe views">' + tabs.map(function (tab) { return '<button type="button" data-hu-tab="' + tab[0] + '" class="' + (model.activeTab === tab[0] && !model.query ? "is-active" : "") + '">' + tab[1] + '</button>'; }).join("") + '</nav></div>' +
      '<div class="hu-stage" aria-live="polite">' + mainView(model) + '</div>' +
      '<footer class="hu-footer"><b>EVERY BUTTON LEADS BACK TO THE ORIGINAL WWAM TAPE.</b><span>' + s.captionBackedFilms + ' mapped core tapes // ' + s.heldFilms + ' watch-only tape // ' + s.acquiredSources + ' surrounding Halloween shows</span></footer></div>';
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
    function focusStage(selector) {
      setTimeout(function () {
        var target = mountNode && mountNode.querySelector(selector);
        if (target && typeof target.scrollIntoView === "function") {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 0);
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
      if (film) { state.filmId = film.getAttribute("data-hu-film"); state.pathId = ""; state.query = ""; render(); focusStage(".hu-dossier"); return; }
      var path = event.target.closest && event.target.closest("[data-hu-path]");
      if (path) { state.pathId = path.getAttribute("data-hu-path"); state.filmId = ""; render(); focusStage(".hu-path-stage"); return; }
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
