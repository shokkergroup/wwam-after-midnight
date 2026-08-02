(function (root) {
  "use strict";

  var payload = root.WWAM_WATCHALONG_CANON;
  var mount = root.document && root.document.getElementById("watchalongCanonMount");
  if (!payload || !mount) return;

  var state = { query: "", franchise: "all", type: "all", selected: "", showRepeats: true };
  var episodes = Array.isArray(payload.episodes) ? payload.episodes : [];
  var franchises = Array.isArray(payload.franchises) ? payload.franchises : [];
  var groups = Array.isArray(payload.groups) ? payload.groups : [];

  function clean(value) { return String(value == null ? "" : value).replace(/\s+/g, " ").trim(); }
  function esc(value) {
    return clean(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function dateLabel(value) {
    var parts = clean(value).split("-");
    return parts.length === 3 ? parts[1] + "/" + parts[2] + "/" + parts[0] : clean(value) || "DATE UNKNOWN";
  }
  function durationLabel(seconds) {
    var value = Math.max(0, Math.round(Number(seconds) || 0));
    var hours = Math.floor(value / 3600);
    var minutes = Math.floor((value % 3600) / 60);
    var secs = value % 60;
    return hours ? hours + ":" + String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0") : minutes + ":" + String(secs).padStart(2, "0");
  }
  function number(value) { return Number(value || 0).toLocaleString("en-US"); }
  function timestamp(value) { return durationLabel(value); }
  function excerpt(value, limit) {
    var text = clean(value);
    var max = Number(limit || 240);
    return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
  }
  function sourceUrl(episode, at) {
    return episode.url + (String(episode.url).indexOf("?") >= 0 ? "&" : "?") + "t=" + Math.max(0, Math.round(Number(at) || 0)) + "s";
  }
  function wikiUrl(episode) { return "?source=" + encodeURIComponent(episode.id) + "&section=wiki#archive"; }
  function stateLabel(episode) {
    if (episode.dossier && episode.dossier.state === "full-editorial-dossier") return "FULL DOSSIER";
    if (episode.dossier && episode.dossier.state === "source-brief-dossier") return "SOURCE BRIEF";
    return "CAPTION LEDGER";
  }
  function typeLabel(type) {
    return clean(type).replace(/-/g, " ").toUpperCase() || "WATCHALONG";
  }
  function visibleEpisodes() {
    var query = state.query.toLowerCase();
    return episodes.filter(function (episode) {
      if (state.franchise !== "all" && episode.franchiseKey !== state.franchise) return false;
      if (state.type !== "all" && episode.type !== state.type) return false;
      if (!state.showRepeats && !episode.catalogMember) return false;
      if (!query) return true;
      var haystack = [episode.title, episode.movieTitle, episode.franchiseTitle, episode.note]
        .concat((episode.topics || []).map(function (topic) { return topic.name; }))
        .join(" ").toLowerCase();
      return haystack.indexOf(query) >= 0;
    }).sort(function (left, right) {
      return left.date.localeCompare(right.date) || left.movieTitle.localeCompare(right.movieTitle);
    });
  }
  function episodeById(id) { return episodes.filter(function (episode) { return episode.id === id; })[0] || null; }

  function proofMarkup() {
    var stats = payload.stats || {};
    var pass = payload.watchPassCoverage || {};
    return '<div class="wac-proof" aria-label="Watchalong canon proof">' +
      '<article><b>' + number(stats.episodes) + '</b><span>CANON WATCHALONG SOURCES</span></article>' +
      '<article><b>' + number(stats.movieGroups) + '</b><span>MOVIE FILES</span></article>' +
      '<article><b>' + number(stats.franchises) + '</b><span>FRANCHISE WORLDS</span></article>' +
      '<article><b>' + number(stats.deepDossiers) + '</b><span>FULL EDITORIAL DOSSIERS</span></article>' +
      '<article><b>' + number(stats.nonFullAdditions || stats.captionLedgers) + '</b><span>SOURCE-BRIEF / LEDGER ADDITIONS</span></article>' +
      '<article><b>' + number(pass.audioAnalyzed) + '</b><span>AUDIO-BACKED PASSES</span></article>' +
      '<article><b>' + number(stats.repeatedMovies) + '</b><span>REPEAT / ALT EDITIONS</span></article>' +
      '</div><p class="wac-proof-note"><strong>EVIDENCE SPLIT</strong> ' + number(stats.deepDossiers) + ' full editorial dossiers // ' + number(stats.captionLedgers) + ' caption-ledger additions // ' + number(stats.sourceBriefs || 0) + ' held source brief. <strong>FAN SIGNAL LEDGER</strong> ' + number(stats.fanSignalReceipts) + ' source-local fan callout receipts across ' + number(stats.episodesWithFanSignals) + ' episodes — Super Chats, memberships, Lee “The Machine,” Michael Parton/Partin, and chat questions stay attached to the tape.</p>';
  }

  var baseProofMarkup = proofMarkup;
  proofMarkup = function () {
    var scope = payload.scope || {};
    var stats = payload.stats || {};
    var discovery = payload.discovery || {};
    var edgeOmissions = discovery.broadDiscoveryOmissions || [];
    var edgeHeld = edgeOmissions.filter(function (item) { return item.availability === 'subscriber_only'; }).length;
    var edgeAdjacency = Math.max(0, edgeOmissions.length - edgeHeld);
    return baseProofMarkup() + '<p class="wac-proof-note"><strong>AUDIO PASS</strong> ' + number((payload.watchPassCoverage || {}).audioAnalyzed) + ' canonical watchalong sources decoded and ranked // ' + number((payload.watchPassCoverage || {}).held) + ' source held. </p><p class="wac-proof-note"><strong>CHANNEL AUDIT</strong> ' + number(scope.channelSnapshotSources) + ' uploads observed in the live channel snapshot // ' + number(stats.sourceCounts && stats.sourceCounts.heldMembersOnly) + ' title-explicit members-only leads held outside public canon. The public list is source-bounded, not a guess at a lifetime total.</p><p class="wac-proof-note"><strong>EDGE AUDIT</strong> ' + number(discovery.broadCandidateCount) + ' broad watch-like titles checked beyond the strict canon signal // ' + number(edgeHeld) + ' members-only leads held and ' + number(edgeAdjacency) + ' review/reaction or short-form leads kept out until a full watchalong source is established.</p>';
  };

  function toolsMarkup() {
    var typeOptions = ["all", "commentary", "watch-party", "watch-along"].map(function (type) {
      return '<option value="' + esc(type) + '"' + (state.type === type ? " selected" : "") + '>' + (type === "all" ? "ALL WATCHALONG TYPES" : typeLabel(type)) + '</option>';
    }).join("");
    return '<div class="wac-tools" aria-label="Watchalong canon filters">' +
      '<label><span>SEARCH THE CANON</span><input id="wacSearch" type="search" value="' + esc(state.query) + '" placeholder="Halloween 4, Chucky, watch party…"></label>' +
      '<label><span>FRANCHISE</span><select id="wacFranchise"><option value="all">ALL FRANCHISE WORLDS</option>' + franchises.map(function (franchise) {
        return '<option value="' + esc(franchise.key) + '"' + (state.franchise === franchise.key ? " selected" : "") + '>' + esc(franchise.title) + '</option>';
      }).join("") + '</select></label>' +
      '<label><span>FORMAT</span><select id="wacType">' + typeOptions + '</select></label>' +
      '<button type="button" id="wacRepeatToggle" aria-pressed="' + (state.showRepeats ? "true" : "false") + '">' + (state.showRepeats ? "HIDE REPEATS" : "SHOW REPEATS") + '</button>' +
      '</div>';
  }

  function franchiseMarkup() {
    return '<div class="wac-section-label">MOVIE WORLDS // CLICK A WORLD TO FILTER THE TAPE</div><div class="wac-franchise-grid">' + franchises.map(function (franchise) {
      var active = state.franchise === franchise.key;
      return '<button type="button" class="wac-franchise-card' + (active ? ' is-active' : '') + '" data-wac-franchise="' + esc(franchise.key) + '">' +
        '<b>' + esc(franchise.title) + '</b><span>' + number(franchise.episodeCount) + ' EPISODES // ' + number(franchise.groupCount) + ' MOVIE FILES</span><i></i></button>';
    }).join("") + '</div>';
  }

  function visibleGroups() {
    var query = state.query.toLowerCase();
    return groups.filter(function (group) {
      if (state.franchise !== "all" && group.franchiseKey !== state.franchise) return false;
      if (!query) return true;
      return [group.title, group.franchiseTitle].join(" ").toLowerCase().indexOf(query) >= 0;
    }).sort(function (left, right) {
      return left.franchiseTitle.localeCompare(right.franchiseTitle) || left.title.localeCompare(right.title);
    });
  }

  function movieFileMarkup() {
    var visible = visibleGroups();
    if (!visible.length) return '';
    return '<div class="wac-section-label">MOVIE FILES // REPEATS STAY ATTACHED TO THE SAME FILM</div><div class="wac-group-grid">' + visible.map(function (group) {
      var repeatLabel = Number(group.repeatCount || 0) ? ' // ' + number(group.repeatCount) + ' REPEAT' + (Number(group.repeatCount) === 1 ? '' : 'S') : '';
      return '<button type="button" class="wac-group-card" data-wac-group="' + esc(group.key) + '"><img loading="lazy" src="' + esc(group.cover) + '" alt="' + esc(group.title) + ' movie file cover"><span><b>' + esc(group.title) + '</b><small>' + esc(group.franchiseTitle) + ' // ' + number(group.count) + ' EPISODE' + (Number(group.count) === 1 ? '' : 'S') + esc(repeatLabel) + '</small></span><i>OPEN FILE</i></button>';
    }).join('') + '</div>';
  }

  function laneMarkup(episode) {
    var lanes = [];
    (episode.dossier && episode.dossier.cuts || []).slice().sort(function (left, right) { return Number(right.score || 0) - Number(left.score || 0); }).forEach(function (cut) {
      var label = clean(cut.category || cut.label);
      if (label && lanes.indexOf(label) < 0 && lanes.length < 4) lanes.push(label);
    });
    if (episode.dossier && Array.isArray(episode.dossier.fanSignals) && episode.dossier.fanSignals.length && lanes.indexOf("FAN SIGNAL") < 0 && lanes.length < 4) lanes.push("FAN SIGNAL");
    return lanes.length ? '<div class="wac-lane-row">' + lanes.map(function (lane) { return '<span>' + esc(lane) + '</span>'; }).join("") + '</div>' : '';
  }

  function episodeCard(episode) {
    var repeat = episode.catalogMember ? "CURATED CORE" : "ADDITIONAL PUBLIC CUT";
    return '<article class="wac-episode-card" data-wac-episode="' + esc(episode.id) + '">' +
      '<div class="wac-episode-art"><img loading="lazy" src="' + esc(episode.thumbnail) + '" alt="' + esc(episode.movieTitle) + ' watchalong thumbnail"><span>' + esc(stateLabel(episode)) + '</span></div>' +
      '<div class="wac-episode-copy"><header><p>' + esc(dateLabel(episode.date)) + ' // ' + esc(typeLabel(episode.type)) + '</p><b>' + esc(durationLabel(episode.duration)) + '</b></header>' +
      '<h4>' + esc(episode.movieTitle) + '</h4><p>' + esc(excerpt(episode.dossier && episode.dossier.summary, 210)) + '</p>' + laneMarkup(episode) +
      '<div class="wac-episode-footer"><button type="button" data-wac-open="' + esc(episode.id) + '">OPEN FULL DOSSIER →</button><a href="' + esc(wikiUrl(episode)) + '">SHOW WIKI</a><span style="color:#a9a1a0;font:700 .55rem/1 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase">' + esc(repeat) + '</span></div></div></article>';
  }

  function routeCard(label, item) {
    if (!item) return '<article class="wac-route-card"><small>' + esc(label) + '</small><b>NO RECEIPT IN THIS DOSSIER</b><p>The source remains linked, but this route cannot be guessed without a bounded caption or reviewed guide cut.</p></article>';
    return '<article class="wac-route-card"><small>' + esc(label) + ' // ' + esc(timestamp(item.t)) + '</small><b>' + esc(item.category || item.label || "SOURCE RECEIPT") + '</b><p>' + esc(excerpt(item.excerpt || item.quote, 190)) + '</p></article>';
  }

  function fanReadMarkup(fanRead) {
    if (!fanRead) return '';
    var cards = [fanRead.loved, fanRead.hated, fanRead.wildestDetour, fanRead.lastWord].filter(Boolean);
    if (!cards.length) return '';
    return '<div class="wac-section-label" style="padding:0 1.5rem">EDITORIAL LANES // THE TAPE&rsquo;S OWN ARGUMENT</div><div class="wac-route-grid">' + cards.map(function (item) {
      return '<article class="wac-route-card"><small>' + esc(item.label || item.key) + ' // ' + esc(timestamp(item.at)) + '</small><b>' + esc(item.topic || item.category || "SOURCE LANE") + '</b><p>' + esc(excerpt(item.body || item.excerpt, 210)) + '</p></article>';
    }).join('') + '</div>';
  }

  function fanSignalsMarkup(episode, signals) {
    if (!Array.isArray(signals) || !signals.length) return '';
    return '<div class="wac-section-label" style="padding:0 1.5rem">FAN SIGNAL // SUPERCHATS, MEMBERS, AND THE PEOPLE WHO KEEP WALKING BACK IN</div><div class="wac-moment-grid">' + signals.map(function (signal) {
      return '<article class="wac-moment wac-fan-moment"><header><span>FAN SIGNAL</span><span>' + esc(timestamp(signal.t)) + '</span></header><p>' + esc(signal.excerpt || 'Fan callout receipt available at this timestamp.') + '</p><a target="_blank" rel="noopener" href="' + esc(sourceUrl(episode, signal.t)) + '">OPEN SOURCE AT ' + esc(timestamp(signal.t)) + ' ↗</a></article>';
    }).join('') + '</div>';
  }

  function chapterMarkup(episode, chapters) {
    if (!Array.isArray(chapters) || !chapters.length) return '';
    return '<div class="wac-section-label" style="padding:0 1.5rem">SHOW ARC // CHAPTERS ARE ROUTES, NOT AI FILLER</div><div class="wac-chapter-grid">' + chapters.map(function (chapter) {
      var at = Number(chapter.at || chapter.t || 0);
      return '<article class="wac-chapter"><header><span>ACT ' + esc(chapter.act || chapter.chapter || '') + '</span><span>' + esc(timestamp(at)) + '</span></header><b>' + esc(chapter.label || chapter.category || 'WATCH ROUTE') + '</b><p>' + esc(excerpt(chapter.body || chapter.excerpt || 'Open the timestamp and hear this stretch of the tape.', 220)) + '</p><a target="_blank" rel="noopener" href="' + esc(sourceUrl(episode, at)) + '">OPEN SOURCE AT ' + esc(timestamp(at)) + ' ↗</a></article>';
    }).join('') + '</div>';
  }

  function topicMarkup(episode, topics) {
    if (!Array.isArray(topics) || !topics.length) return '';
    return '<div class="wac-section-label" style="padding:0 1.5rem">TOPIC DOORS // FIRST MENTION + PEAK RECEIPT</div><div class="wac-topic-row">' + topics.slice(0, 10).map(function (topic) {
      var at = Number(topic.peak || topic.first || 0);
      return '<a class="wac-topic" target="_blank" rel="noopener" href="' + esc(sourceUrl(episode, at)) + '"><b>' + esc(topic.name || 'TOPIC') + '</b><span>' + esc(timestamp(at)) + ' // ' + number(topic.mentions || 1) + ' MENTIONS</span></a>';
    }).join('') + '</div>';
  }

  function listeningReadMarkup(pass) {
    var digest = pass && pass.listeningDigest;
    if (!digest) return '';
    var mix = Array.isArray(digest.signalMix) ? digest.signalMix : [];
    return '<div class="wac-watch-pass-read"><span class="wac-section-label">LISTENING READ // EVIDENCE MIX</span><strong>' + esc(digest.headline || 'The pass retained bounded source routes.') + '</strong>' + (mix.length ? '<small>' + esc(mix.join(' // ')) + '</small>' : '') + '<p>' + esc(digest.evidence || 'Playback remains the authority.') + '</p></div>';
  }

  function watchPassMarkup(episode) {
    var pass = episode.watchPass;
    if (!pass) return '';
    var audit = pass.audit || {};
    var stats = audit.audioStats || {};
    var candidates = Array.isArray(pass.candidates) ? pass.candidates : [];
    if (pass.status === 'held-age-restricted') {
      return '<section class="wac-watch-pass wac-watch-pass-held"><header><div><span class="wac-section-label">' + esc(pass.label || 'HALLOWEEN WATCH PASS // HELD SOURCE') + '</span><h4>THE CANONICAL TAPE IS HELD.</h4><p>' + esc(pass.note || 'The canonical source could not be acquired without authentication.') + '</p></div><a target="_blank" rel="noopener" href="' + esc(episode.url) + '">OPEN YOUTUBE SOURCE ↗</a></header><div class="wac-watch-pass-alternate"><b>' + esc((pass.alternateSource || {}).label || 'ALTERNATE SOURCE') + '</b><a target="_blank" rel="noopener" href="' + esc((pass.alternateSource || {}).url || '#') + '">OPEN OFFICIAL WWAM PODCAST VARIANT ↗</a></div><p class="wac-watch-pass-foot">NO YOUTUBE TIMESTAMP RECEIPTS MANUFACTURED // THE PODCAST VARIANT HAS A NON-ISOMORPHIC TIMELINE.</p></section>';
    }
    return '<section class="wac-watch-pass"><header><div><span class="wac-section-label">' + esc(pass.label || 'HALLOWEEN WATCH PASS // AUDIO PILOT') + '</span><h4>LISTEN FOR THE ROOM TO CHANGE.</h4><p>' + esc(pass.note || 'Canonical audio was sampled and aligned to the caption map.') + '</p></div><a target="_blank" rel="noopener" href="' + esc(episode.url) + '">PLAY OFFICIAL SOURCE ↗</a></header><div class="wac-watch-pass-metrics"><span><b>' + number(audit.captionEvents) + '</b>CAPTION EVENTS</span><span><b>' + number(audit.laughterOrOverlapMarkers) + '</b>LAUGHTER / OVERLAP MARKERS</span><span><b>' + number(audit.candidateCount) + '</b>RANKED AUDIO CANDIDATES</span><span><b>' + number(stats.energyP90Seconds) + '</b>HIGH-ENERGY SECONDS</span></div><div class="wac-watch-pass-candidates">' + candidates.map(function (candidate) {
      var audio = candidate.audio || {};
      return '<a target="_blank" rel="noopener" href="' + esc(sourceUrl(episode, candidate.t)) + '"><header><b>#' + esc(candidate.rank) + ' // ' + esc(candidate.category) + '</b><span>' + esc(timestamp(candidate.t)) + ' // SCORE ' + esc(candidate.score) + '</span></header><p>' + esc(excerpt(candidate.captionExcerpt, 230)) + '</p><small>ENERGY ' + esc(audio.meanEnergyPercentile) + 'TH PCTL // PEAK ' + esc(audio.peakPercentile) + 'TH PCTL // ' + (audio.markerObserved ? 'MARKER OBSERVED' : 'NO MARKER') + '</small></a>';
    }).join('') + '</div><p class="wac-watch-pass-foot">AUDIO-ONLY PILOT // ACOUSTIC INTENSITY RE-RANKS THE CAPTION CANDIDATES; IT DOES NOT IDENTIFY A SPEAKER OR PROVE A JOKE. PLAYBACK REMAINS THE AUTHORITY.</p></section>';
  }

  // Keep caption-only and held-source states legible without pretending the
  // acoustic pass ran. The archive still links every receipt to YouTube.
  var baseWatchPassMarkup = watchPassMarkup;
  watchPassMarkup = function (episode) {
    var pass = episode && episode.watchPass;
    if (pass && /^held-/.test(pass.status || '') && pass.status !== 'held-age-restricted') {
      return '<section class="wac-watch-pass wac-watch-pass-held"><header><div><span class="wac-section-label">' + esc(pass.label || 'WATCHALONG WATCH PASS // HELD SOURCE') + '</span><h4>THE SOURCE RECEIPT IS HELD.</h4><p>' + esc(pass.note || 'The source could not be acquired in this run. No timestamps were manufactured.') + '</p></div><a target="_blank" rel="noopener" href="' + esc(episode.url) + '">OPEN YOUTUBE SOURCE â†—</a></header><p class="wac-watch-pass-foot">NO TIMESTAMP RECEIPTS MANUFACTURED // PLAYBACK REMAINS THE AUTHORITY.</p></section>';
    }
    var rendered = baseWatchPassMarkup(episode);
    if (pass && pass.listeningDigest) {
      rendered = rendered.replace('</header>', '</header>' + listeningReadMarkup(pass));
    }
    if (pass && pass.status === 'caption-ledger-pilot') {
      rendered = rendered.replace('LISTEN FOR THE ROOM TO CHANGE.', 'FOLLOW THE CAPTION RECEIPTS.')
        .replace('<b>0</b>HIGH-ENERGY SECONDS', '<b>—</b>ACOUSTIC PASS HELD')
        .replace(/ENERGY undefinedTH PCTL \/\/ PEAK undefinedTH PCTL \/\/ NO MARKER/g, 'CAPTION LEDGER // AUDIO NOT AVAILABLE IN THIS PASS')
        .replace('AUDIO-ONLY PILOT // ACOUSTIC INTENSITY RE-RANKS THE CAPTION CANDIDATES; IT DOES NOT IDENTIFY A SPEAKER OR PROVE A JOKE. PLAYBACK REMAINS THE AUTHORITY.', 'CAPTION-ONLY PILOT // BOUNDED SOURCE RECEIPTS ARE JUMPABLE, BUT NO ACOUSTIC INTENSITY OR SPEAKER IDENTITY IS CLAIMED. PLAYBACK REMAINS THE AUTHORITY.');
    }
    return rendered;
  };

  function dossierMarkup(episode) {
    if (!episode) return '';
    var dossier = episode.dossier || {};
    var route = dossier.route || {};
    var moments = Array.isArray(dossier.cuts) ? dossier.cuts : [];
    return '<section class="wac-dossier" id="wacDossier" aria-labelledby="wacDossierTitle"><header class="wac-dossier-head"><div><span class="wac-dossier-kicker">' + esc(episode.franchiseTitle) + ' // ' + esc(stateLabel(episode)) + '</span><h3 id="wacDossierTitle">' + esc(episode.movieTitle) + '</h3><p>' + esc(dossier.summary) + '</p></div><div class="wac-dossier-facts"><span><small>DATE</small><b>' + esc(dateLabel(episode.date)) + '</b></span><span><small>RUNTIME</small><b>' + esc(durationLabel(episode.duration)) + '</b></span><span><small>CAPTION WORDS</small><b>' + number(dossier.caption && dossier.caption.words) + '</b></span><span><small>JUMP RECEIPTS</small><b>' + number(moments.length) + '</b></span></div></header>' +
      '<div class="wac-dossier-note"><strong>EVIDENCE STATUS // </strong>' + esc(dossier.evidenceSummary || 'The source is linked to the official tape. Speaker identity, intent, and current playback availability remain outside this fan archive unless a reviewed guide says otherwise.') + '</div>' +
      '<div class="wac-route-grid">' + routeCard('OPENING READ', route.opening) + routeCard('STRONGEST RECEIPT', route.strongest) + routeCard('CLOSING READ', route.closing) + '</div>' + watchPassMarkup(episode) + chapterMarkup(episode, dossier.chapters) + topicMarkup(episode, episode.topics) + fanReadMarkup(dossier.fanRead) + fanSignalsMarkup(episode, dossier.fanSignals) +
      '<div class="wac-section-label" style="padding:0 1.5rem">EVERY INDEXED RECEIPT // PRESS PLAY AT THE TAPE</div><div class="wac-moment-grid">' + moments.map(function (moment) {
        return '<article class="wac-moment"><header><span>' + esc(moment.category || moment.label || 'SOURCE RECEIPT') + '</span><span>' + esc(timestamp(moment.t)) + '</span></header><p>' + esc(moment.excerpt || moment.quote || 'Caption receipt available at this timestamp.') + '</p><a target="_blank" rel="noopener" href="' + esc(sourceUrl(episode, moment.t)) + '">OPEN SOURCE AT ' + esc(timestamp(moment.t)) + ' ↗</a></article>';
      }).join('') + '</div><footer class="wac-dossier-footer"><a href="' + esc(wikiUrl(episode)) + '">OPEN THIS SHOW&rsquo;S WIKI →</a><a target="_blank" rel="noopener" href="' + esc(episode.url) + '">OPEN OFFICIAL UPLOAD ↗</a><button class="wac-button" type="button" data-wac-close>CLOSE DOSSIER</button></footer></section>';
  }

  function render() {
    var visible = visibleEpisodes();
    var selected = episodeById(state.selected);
    mount.innerHTML = '<div class="wac-shell">' + proofMarkup() + toolsMarkup() + franchiseMarkup() + movieFileMarkup() +
      '<div class="wac-results-head"><h3>' + (state.franchise === "all" ? "THE FULL TAPE LIST" : esc((franchises.filter(function (item) { return item.key === state.franchise; })[0] || {}).title || "FILTERED TAPE LIST")) + '</h3><span>' + number(visible.length) + ' EPISODES // EVERY MOVIE VERSION STAYS VISIBLE</span></div>' +
      '<div class="wac-episode-grid">' + (visible.length ? visible.map(episodeCard).join('') : '<div class="wac-empty">No public watchalong matches that filter. Try another movie, franchise, or format.</div>') + '</div>' + (selected ? dossierMarkup(selected) : '') + '</div>';
    bind();
  }

  function bind() {
    var search = root.document.getElementById("wacSearch");
    var franchise = root.document.getElementById("wacFranchise");
    var type = root.document.getElementById("wacType");
    var repeat = root.document.getElementById("wacRepeatToggle");
    if (search) search.addEventListener("input", function (event) { state.query = event.target.value; render(); });
    if (franchise) franchise.addEventListener("change", function (event) { state.franchise = event.target.value; render(); });
    if (type) type.addEventListener("change", function (event) { state.type = event.target.value; render(); });
    if (repeat) repeat.addEventListener("click", function () { state.showRepeats = !state.showRepeats; render(); });
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-franchise]"), function (button) {
      button.addEventListener("click", function () { state.franchise = button.getAttribute("data-wac-franchise"); render(); });
    });
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-group]"), function (button) {
      button.addEventListener("click", function () {
        var group = groups.filter(function (item) { return item.key === button.getAttribute("data-wac-group"); })[0];
        if (!group) return;
        state.franchise = group.franchiseKey;
        state.query = group.title;
        state.selected = "";
        render();
      });
    });
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-open]"), function (button) {
      button.addEventListener("click", function () {
        state.selected = button.getAttribute("data-wac-open");
        render();
        var dossier = root.document.getElementById("wacDossier");
        if (dossier) dossier.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-close]"), function (button) {
      button.addEventListener("click", function () { state.selected = ""; render(); });
    });
  }

  render();
  root.WWAMWatchalongCanonUI = Object.freeze({ version: "1.0.0", render: render, payload: payload });
})(typeof window !== "undefined" ? window : globalThis);
