(function (root) {
  "use strict";

  var payload = root.WWAM_WATCHALONG_CANON;
  var mount = root.document && root.document.getElementById("watchalongCanonMount");
  if (!payload || !mount) return;

  var state = { query: "", franchise: "all", type: "all", selected: "", selectedPodcast: "", showRepeats: true };
  var episodes = Array.isArray(payload.episodes) ? payload.episodes : [];
  var franchises = Array.isArray(payload.franchises) ? payload.franchises : [];
  var groups = Array.isArray(payload.groups) ? payload.groups : [];
  var podcastAudio = root.WWAM_PODCAST_COMMENTARY_AUDIO || { records: {} };

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
    var sourceId = encodeURIComponent(episode && episode.id || "");
    var seconds = Math.max(0, Math.round(Number(at) || 0));
    return "?source=" + sourceId + "&at=" + seconds + "&section=wiki#archive";
  }
  function receiptUrl(episode, item) {
    if (item && item.sourceKind === "podcast-variant") {
      return (episode && episode.alternateAudio && (episode.alternateAudio.episodeUrl || episode.alternateAudio.sourceUrl)) || item.sourceUrl || "#";
    }
    return sourceUrl(episode, item && item.t);
  }
  function receiptTarget(item) {
    return item && item.sourceKind === "podcast-variant" ? ' target="_blank" rel="noopener"' : '';
  }
  function receiptClock(item) {
    return item && item.sourceKind === "podcast-variant" ? "PODCAST CLOCK // " : "";
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
  function podcastByKey(key) {
    return (Array.isArray(payload.podcastCommentaries) ? payload.podcastCommentaries : []).filter(function (item) { return item.key === key; })[0] || null;
  }

  function proofMarkup() {
    var stats = payload.stats || {};
    var pass = payload.watchPassCoverage || {};
    var halloweenCount = episodes.filter(function (episode) { return episode.franchiseKey === 'halloween'; }).length;
    var halloweenAudio = episodes.filter(function (episode) { return episode.franchiseKey === 'halloween' && episode.watchPass && episode.watchPass.status === 'audio-feature-pilot'; }).length;
    return '<div class="wac-proof" aria-label="Watchalong canon proof">' +
      '<article><b>' + number(stats.episodes) + '</b><span>CANON WATCHALONG SOURCES</span></article>' +
      '<article><b>' + number(stats.movieGroups) + '</b><span>MOVIE FILES</span></article>' +
      '<article><b>' + number(stats.franchises) + '</b><span>FRANCHISE WORLDS</span></article>' +
      '<article><b>' + number(stats.deepDossiers) + '</b><span>FULL EDITORIAL DOSSIERS</span></article>' +
      '<article><b>' + number(stats.nonFullAdditions || stats.captionLedgers) + '</b><span>SOURCE-BRIEF / LEDGER ADDITIONS</span></article>' +
      '<article><b>' + number(pass.audioAnalyzed) + '</b><span>AUDIO-BACKED PASSES</span></article>' +
      '<article><b>' + number(halloweenCount) + '</b><span>HALLOWEEN TAPES VERIFIED</span><small>' + number(halloweenAudio) + ' AUDIO-BACKED</small></article>' +
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
    var sourceCounts = stats.sourceCounts || {};
    return baseProofMarkup() + '<p class="wac-proof-note"><strong>AUDIO PASS</strong> ' + number((payload.watchPassCoverage || {}).audioAnalyzed) + ' canonical watchalong sources decoded and ranked // ' + number((payload.watchPassCoverage || {}).held) + ' source held. </p><p class="wac-proof-note"><strong>CHANNEL AUDIT</strong> ' + number(scope.channelSnapshotSources) + ' uploads observed in the live channel snapshot // ' + number(stats.sourceCounts && stats.sourceCounts.heldMembersOnly) + ' title-explicit members-only leads held outside public canon. The public list is source-bounded, not a guess at a lifetime total.</p><p class="wac-proof-note"><strong>STRICT LIVE AUDIT</strong> ' + number(discovery.liveStrictCandidateCount || sourceCounts.liveStrictCandidates) + ' strict film-watchalong leads found in the live feed // ' + number(discovery.liveStrictPublicCandidateCount || sourceCounts.liveStrictPublicCandidates) + ' public live leads plus ' + number(sourceCounts.legacyCatalogRetained) + ' legacy catalog sources retained.</p><p class="wac-proof-note"><strong>EDGE AUDIT</strong> ' + number(discovery.broadCandidateCount) + ' broad watch-like titles checked beyond the strict canon signal // ' + number(edgeHeld) + ' members-only leads held and ' + number(edgeAdjacency) + ' review/reaction or short-form leads kept out until a full watchalong source is established.</p>';
  };

  // Put the useful front doors before the audit paperwork. The old render
  // order made visitors walk through several proof ledgers before they could
  // reach a movie world. This compact index keeps the evidence visible, but
  // lets a fan start with a title, a world, or the complete tape list.
  function quickStartMarkup() {
    var stats = payload.stats || {};
    var ledger = payload.coverageLedger || {};
    var sourceCount = Number(stats.episodes || ledger.publicYoutubeCanon || 0);
    var movieCount = Number(stats.movieGroups || 0);
    var worldCount = Number(stats.franchises || franchises.length || 0);
    var podcastCount = Number(ledger.podcastRecoveries || 0);
    return '<section class="wac-quickstart" aria-labelledby="wacQuickstartTitle"><div class="wac-quickstart-copy"><span class="wac-section-label">START HERE // THE SHORT WAY IN</span><h3 id="wacQuickstartTitle">PICK A WORLD. FIND THE TAPE.</h3><p>Movie worlds and repeats are grouped first. Choose a lane below, or search the whole canon when you already know the title. The audit ledgers are still here—just after the doors people actually came to use.</p></div><div class="wac-quickstart-stats"><span><b>' + number(worldCount) + '</b><small>WORLDS</small></span><span><b>' + number(movieCount) + '</b><small>MOVIE FILES</small></span><span><b>' + number(sourceCount) + '</b><small>YOUTUBE SOURCES</small></span><span><b>' + number(podcastCount) + '</b><small>PODCAST RECOVERIES</small></span></div><nav class="wac-quickstart-actions" aria-label="Watchalong quick starts"><button type="button" data-wac-quick="all">BROWSE ALL MOVIE FILES</button><button type="button" data-wac-quick="halloween">OPEN HALLOWEEN UNIVERSE</button><button type="button" data-wac-quick="comedy">OPEN COMEDY VAULT</button><button type="button" data-wac-quick="search">SEARCH EVERY TAPE</button></nav></section>';
  }

  function coverageLedgerMarkup() {
    var ledger = payload.coverageLedger || {};
    var sourceCounts = (payload.stats || {}).sourceCounts || {};
    var examples = Array.isArray(ledger.crossGenreExamples) ? ledger.crossGenreExamples : [];
    var cards = [
      [ledger.publicYoutubeCanon, "YOUTUBE WATCHALONG CANON", number(sourceCounts.liveStrictPublicCandidates) + " current public leads // " + number(sourceCounts.legacyCatalogRetained) + " legacy records"],
      [ledger.podcastFeedRecords, "RSS COMMENTARY RECEIPTS", number(ledger.podcastFeedOverlaps) + " overlap checks // " + number(ledger.podcastRecoveries) + " net-new"],
      [ledger.podcastRecoveries, "OFFICIAL PODCAST RECOVERIES", "full-film audio sources kept separate"],
      [ledger.heldStrictMembersOnly, "STRICT HOLDS", "title-explicit, access-limited leads"],
      [ledger.adjacentPublicLeads, "ADJACENT PUBLIC LEADS", "reactions, reviews, or short-form edges"],
      [ledger.unresolvedEdgeLeads, "UNRESOLVED EDGE", "older titles needing a fresh source receipt"]
    ];
    var cardMarkup = cards.map(function (card) {
      return '<article><b>' + number(card[0]) + '</b><strong>' + esc(card[1]) + '</strong><span>' + esc(card[2]) + '</span></article>';
    }).join('');
    var exampleMarkup = examples.map(function (item) {
      var href = item.source === 'youtube' ? '?source=' + encodeURIComponent(item.id) + '&section=wiki#archive' : item.url;
      var target = item.source === 'youtube' ? '' : ' target="_blank" rel="noopener"';
      return '<a href="' + esc(href) + '"' + target + '><b>' + esc(item.title) + '</b><small>' + esc(item.lane) + ' // ' + esc(item.source) + ' ↗</small></a>';
    }).join('');
    return '<section class="wac-coverage-ledger" aria-labelledby="wacCoverageTitle"><header><div><span class="wac-section-label">COVERAGE LEDGER // THE RECEIPT COUNT</span><h3 id="wacCoverageTitle">MORE THAN 50. THE AUDIT SAYS HOW MANY.</h3><p>' + number(ledger.channelUploads) + ' live channel uploads were checked against strict full-film signals and a wider edge search. The result is deliberately split by access and evidence status, so a review never gets quietly sold as a commentary.</p></div><div class="wac-coverage-proof"><b>' + number((ledger.publicYoutubeCanon || 0) + (ledger.podcastRecoveries || 0)) + '</b><span>INDEXED FULL-FILM SOURCES</span><small>' + number(ledger.strictCandidates) + ' STRICT LIVE LEADS // ' + number(ledger.broadCandidates) + ' BROAD TITLES CHECKED</small></div></header><div class="wac-coverage-cards">' + cardMarkup + '</div><div class="wac-cross-genre"><div><span class="wac-section-label">CROSS-GENRE PROOF</span><p>Action, comedy, superhero, sci-fi, television, and cult titles are already in the tape—not just slashers.</p></div><div class="wac-cross-genre-list">' + exampleMarkup + '</div></div></section>';
  }

  function companionShelfMarkup() {
    var watchalongs = Array.isArray(payload.companionWatchalongs) ? payload.companionWatchalongs : [];
    var reviews = Array.isArray(payload.companionReviews) ? payload.companionReviews : [];
    if (!watchalongs.length && !reviews.length) return '';
    function card(item, label) {
      var state = item.status === 'public-companion' || item.status === 'public-adjacent' ? 'PUBLIC SOURCE' : item.status === 'members-only-hold' ? 'MEMBERS-ONLY HOLD' : 'PLAYABILITY UNRESOLVED';
      var local = state === 'PUBLIC SOURCE';
      var source = local ? ('?source=' + encodeURIComponent(item.id) + '&section=wiki#archive') : (item.url || ('https://www.youtube.com/watch?v=' + encodeURIComponent(item.id)));
      var linkAttrs = local ? '' : ' target="_blank" rel="noopener"';
      var linkLabel = local ? 'OPEN LOCAL SHOW WIKI →' : 'OPEN SOURCE ↗';
      var routeCount = Number(item.dossier && item.dossier.cuts && item.dossier.cuts.length || item.captionEvents || 0);
      var routeNote = routeCount ? routeCount + ' SOURCE-LOCAL ROUTE' + (routeCount === 1 ? '' : 'S') + ' READY' : 'NO LOCAL TIMESTAMP RECEIPT YET';
      var boundary = item.formatBoundary || 'COMPANION SOURCE // FORMAT KEPT SEPARATE';
      var copy = routeCount
        ? state + '. ' + routeNote + ' are attached to this upload only. The page keeps it outside the full-film count without throwing away the good stuff.'
        : state + '. The title stays outside the full-film count until a source-local receipt is available; the public source remains playable and honestly labeled.';
      return '<article class="wac-companion-card"><header><span>' + esc(label) + '</span><small>' + esc(dateLabel(item.date)) + ' // ' + esc(durationLabel(item.duration)) + '</small></header><h4>' + esc(item.title) + '</h4><p class="wac-companion-boundary">' + esc(boundary) + '</p><p>' + esc(copy) + '</p><a' + linkAttrs + ' href="' + esc(source) + '">' + linkLabel + '</a></article>';
    }
    var watchMarkup = watchalongs.map(function (item) { return card(item, 'EARLY WATCHED CUT'); }).join('');
    var reviewMarkup = reviews.map(function (item) { return card(item, item.signal === 'short-form-watch-lead' ? 'SHORT WATCH LEAD' : 'REACTION / REVIEW'); }).join('');
    return '<section class="wac-companion-shelf" aria-labelledby="wacCompanionTitle"><header><div><span class="wac-section-label">THE OTHER MOVIE ROOMS // EARLY WWAM CUTS</span><h3 id="wacCompanionTitle">THE FULL-FILM CANON ISN’T THE WHOLE HISTORY.</h3><p>These older “We Watched…” edits and movie-room cuts were found in the same channel inventory. They are surfaced as companion sources so comedy, action, sci-fi, and one-off movie work does not vanish just because the upload is shorter than a full commentary.</p></div><div class="wac-companion-proof"><b>' + number(watchalongs.length) + '</b><span>WATCHALONG COMPANIONS</span><small>' + number(reviews.length) + ' REVIEWS / REACTIONS KEPT SEPARATE</small></div></header><div class="wac-companion-grid">' + watchMarkup + '</div>' + (reviews.length ? '<details class="wac-companion-reviews"><summary><span>SHOW THE ADJACENT REVIEW / REACTION SHELF</span><b>' + number(reviews.length) + ' LEADS</b></summary><div class="wac-companion-grid">' + reviewMarkup + '</div></details>' : '') + '<footer><strong>FORMAT RULE</strong> A companion source can be playable and worth revisiting without being misrepresented as a full-film commentary. The source link is real; the full dossier and timestamp map stay gated on a source-specific receipt.</footer></section>';
  }

  function edgeAuditMarkup() {
    var discovery = payload.discovery || {};
    var omissions = Array.isArray(discovery.broadDiscoveryOmissions) ? discovery.broadDiscoveryOmissions : [];
    var edgeReview = discovery.edgeReview || {};
    var edgeById = {};
    (Array.isArray(edgeReview.records) ? edgeReview.records : []).forEach(function (record) { edgeById[record.id] = record; });
    if (!omissions.length) return '';
    var buckets = [
      { key: 'subscriber_only', label: 'MEMBERS-ONLY HOLDS', note: 'Full-length commentary signals found in the live channel snapshot, but YouTube currently keeps the source behind membership.' },
      { key: 'public', label: 'ADJACENT PUBLIC LEADS', note: 'Public reaction, review, or short-form watch signals kept outside the full-commentary canon until the format earns its own lane. ' + number(edgeReview.captionConfirmed) + ' now have local caption receipts confirming the upload is real without pretending it is a full commentary.' },
      { key: 'unknown', label: 'PLAYABILITY UNRESOLVED', note: 'The title signal is real, but the current public watch page did not yield enough metadata to promote it.' }
    ];
    var bucketMarkup = buckets.map(function (bucket) {
      var items = omissions.filter(function (item) { return (item.availability || 'unknown') === bucket.key; });
      if (!items.length) return '';
      return '<section class="wac-edge-bucket"><header><div><b>' + esc(bucket.label) + '</b><span>' + number(items.length) + ' LEADS</span></div><p>' + esc(bucket.note) + '</p></header><ul>' + items.map(function (item) {
        var source = bucket.key === 'public' ? ('?source=' + encodeURIComponent(item.id) + '&section=wiki#archive') : 'https://www.youtube.com/watch?v=' + encodeURIComponent(item.id);
        var receipt = edgeById[item.id];
        var reason = item.reason || item.signal || 'edge audit lead';
        if (receipt && receipt.captionEvents) reason += ' // ' + number(receipt.captionEvents) + ' CAPTION EVENTS // LOCAL ROUTE MAP';
        var linkAttrs = bucket.key === 'public' ? '' : ' target="_blank" rel="noopener"';
        var linkLabel = bucket.key === 'public' ? 'OPEN LOCAL WIKI →' : 'OPEN SOURCE ↗';
        return '<li><a' + linkAttrs + ' href="' + esc(source) + '">' + esc(item.title) + ' ' + linkLabel + '</a><small>' + esc(item.date || 'DATE UNKNOWN') + ' // ' + esc(reason) + '</small></li>';
      }).join('') + '</ul></section>';
    }).join('');
    return '<details class="wac-edge-shelf"><summary><span>THE OVERLOOKED EDGE // EVERY TITLE CHECKED</span><b>' + number(omissions.length) + ' LEADS OUTSIDE CANON +</b></summary><p class="wac-edge-intro">This is the audit shelf that keeps “more than 50” honest. These are not silently discarded: each lead is named, dated, and linked. Members-only uploads stay held; adjacent public reactions stay adjacent; unresolved pages stay unresolved.</p><div class="wac-edge-grid">' + bucketMarkup + '</div></details>';
  }

  function podcastRecoveryMarkup() {
    var recovered = Array.isArray(payload.podcastCommentaries) ? payload.podcastCommentaries : [];
    if (!recovered.length) return '';
    var sourceCounts = (payload.stats || {}).sourceCounts || {};
    return '<section class="wac-podcast-recovery" aria-labelledby="wacPodcastRecoveryTitle"><header><div><span class="wac-section-label">OFFICIAL FEED RECOVERY // NON-HORROR LANES INCLUDED</span><h3 id="wacPodcastRecoveryTitle">THE COMMENTARIES THE LIVE YOUTUBE AUDIT COULD NOT SEE.</h3><p>We checked the official WWAM RSS archive alongside the live channel. These full-film commentaries are real, playable WWAM releases that are absent from the current public YouTube snapshot. They stay separate from the 102-source YouTube canon so the archive never invents a video ID or pretends podcast time equals YouTube time.</p></div><div class="wac-podcast-proof"><b>' + number(recovered.length) + '</b><span>RECOVERED PODCAST SOURCES</span><small>' + number(sourceCounts.podcastOnlyCommentaries || recovered.length) + ' AUDIO-ONLY // 0 FAKE TIMESTAMPS</small></div></header><div class="wac-podcast-grid">' + recovered.map(function (item) {
      var pass = (podcastAudio.records || {})[item.key] || null;
      var candidates = pass && Array.isArray(pass.candidates) ? pass.candidates : [];
      var featured = candidates.slice(0, 6);
      var remaining = candidates.slice(6);
      function candidateButtons(list) {
        return list.map(function (candidate) {
          return '<button type="button" class="wac-podcast-moment" data-wac-podcast-seek="' + esc(item.key) + '" data-wac-podcast-time="' + esc(candidate.t) + '"><span><b>' + esc(candidate.category || 'SOURCE RECEIPT') + '</b><small>' + esc(timestamp(candidate.t)) + ' // HEAT ' + esc(candidate.score) + '</small></span><em>' + esc(excerpt(candidate.captionExcerpt || candidate.excerpt || 'Podcast-bound receipt.', 150)) + '</em></button>';
        }).join('');
      }
      var shape = pass && pass.dossier ? pass.dossier : null;
      var shapeMarkup = shape ? '<div class="wac-podcast-shape"><small>TAPE SHAPE // SOURCE-LOCAL READ</small><p>' + esc(shape.summary || 'The source-local audio pass produced bounded navigation cards.') + '</p><div class="wac-podcast-chapters">' + (shape.chapters || []).map(function (chapter) {
        return '<button type="button" data-wac-podcast-seek="' + esc(item.key) + '" data-wac-podcast-time="' + esc(chapter.at) + '"><b>ACT ' + esc(chapter.chapter) + ' // ' + esc(chapter.label) + '</b><span>' + esc(timestamp(chapter.at)) + '</span><em>' + esc(excerpt(chapter.excerpt, 130)) + '</em></button>';
      }).join('') + '</div>' + ((shape.topics || []).length ? '<div class="wac-podcast-topics">' + shape.topics.slice(0, 6).map(function (topic) { return '<button type="button" data-wac-podcast-seek="' + esc(item.key) + '" data-wac-podcast-time="' + esc(topic.peak) + '"><b>' + esc(topic.name) + '</b><small>' + esc(topic.mentions) + ' MENTIONS // ' + esc(timestamp(topic.peak)) + '</small></button>'; }).join('') + '</div>' : '') + '</div>' : '';
      var passMarkup = pass ? '<div class="wac-podcast-listening-read"><small>LISTENING READ // ' + esc(pass.audit.candidateCount) + ' BOUNDED ROUTES // ' + esc(pass.audit.transcriptSegments) + ' WHISPER SEGMENTS</small><p>' + esc(pass.listeningDigest.headline) + '</p>' + shapeMarkup + '<div class="wac-podcast-hot-list">' + candidateButtons(featured) + '</div>' + (remaining.length ? '<details><summary>SHOW ALL ' + esc(remaining.length) + ' ADDITIONAL ROUTES</summary><div class="wac-podcast-hot-list">' + candidateButtons(remaining) + '</div></details>' : '') + '</div>' : '<div class="wac-podcast-listening-read"><small>LISTENING PASS QUEUED</small><p>Official audio is playable now; bounded audio-ranked receipts will appear after the local listening pass.</p></div>';
      return '<article class="wac-podcast-card"><div class="wac-podcast-card-head"><span>OFFICIAL WWAM PODCAST</span><b>' + esc(item.movieTitle) + '</b><small>' + esc(dateLabel(item.date)) + ' // ' + esc(durationLabel(item.duration)) + '</small></div><p>' + esc(item.note) + '</p><audio id="wacPodcastAudio-' + esc(item.key) + '" controls preload="none" src="' + esc(item.sourceUrl || item.url) + '"></audio>' + passMarkup + '<div class="wac-podcast-card-foot"><button type="button" class="wac-podcast-open" data-wac-podcast-open="' + esc(item.key) + '">OPEN LOCAL PODCAST WIKI →</button><a target="_blank" rel="noopener" href="' + esc(item.sourceUrl || item.url) + '">OPEN AUDIO SOURCE â†—</a><span>RSS TITLE + RUNTIME VERIFIED</span></div></article>';
    }).join('') + '</div><footer><strong>LISTENING RULE</strong> Start with the audio player above. When this lane receives a future audio pass, its receipts will remain bound to the podcast file; the archive will never paste a podcast timestamp onto a YouTube player.</footer></section>';
  }

  function podcastDossierMarkup(item) {
    if (!item) return '';
    var pass = (podcastAudio.records || {})[item.key] || null;
    var candidates = pass && Array.isArray(pass.candidates) ? pass.candidates : [];
    var shape = pass && pass.dossier ? pass.dossier : {};
    var audioId = 'wacPodcastDossierAudio-' + item.key;
    var routeMarkup = candidates.map(function (candidate) {
      return '<button type="button" class="wac-podcast-dossier-route" data-wac-podcast-dossier-seek="' + esc(item.key) + '" data-wac-podcast-dossier-time="' + esc(candidate.t) + '"><header><b>#' + esc(candidate.rank || '') + ' // ' + esc(candidate.category || 'SOURCE RECEIPT') + '</b><time>' + esc(timestamp(candidate.t)) + '</time></header><p>' + esc(excerpt(candidate.captionExcerpt || candidate.excerpt || 'Podcast-bound receipt.', 360)) + '</p><small>SCORE ' + esc(candidate.score || '—') + ' // PODCAST CLOCK ONLY // ' + esc(candidate.evidenceBasis || 'official WWAM audio + local transcript') + '</small></button>';
    }).join('');
    var chapterMarkup = (shape.chapters || []).map(function (chapter) {
      return '<button type="button" data-wac-podcast-dossier-seek="' + esc(item.key) + '" data-wac-podcast-dossier-time="' + esc(chapter.at) + '"><b>ACT ' + esc(chapter.chapter || '') + ' // ' + esc(chapter.label || 'LISTENING LANE') + '</b><span>' + esc(timestamp(chapter.at)) + '</span><em>' + esc(excerpt(chapter.excerpt, 220)) + '</em></button>';
    }).join('');
    var topicMarkup = (shape.topics || []).slice(0, 12).map(function (topic) {
      return '<button type="button" data-wac-podcast-dossier-seek="' + esc(item.key) + '" data-wac-podcast-dossier-time="' + esc(topic.peak || topic.first) + '"><b>' + esc(topic.name || 'TOPIC') + '</b><small>' + number(topic.mentions || 1) + ' MENTIONS // ' + esc(timestamp(topic.peak || topic.first)) + '</small></button>';
    }).join('');
    return '<section class="wac-dossier wac-podcast-dossier" id="wacPodcastDossier" aria-labelledby="wacPodcastDossierTitle"><header class="wac-dossier-head"><div><span class="wac-dossier-kicker">OFFICIAL WWAM PODCAST // AUDIO-ONLY CANON</span><h3 id="wacPodcastDossierTitle">' + esc(item.movieTitle) + '</h3><p>' + esc(item.note || 'A recovered WWAM commentary with a local listening map.') + ' Every route below is bound to this podcast file; no YouTube timestamp is implied.</p></div><div class="wac-dossier-facts"><span><small>DATE</small><b>' + esc(dateLabel(item.date)) + '</b></span><span><small>RUNTIME</small><b>' + esc(durationLabel((pass && pass.media || {}).durationSeconds || item.duration)) + '</b></span><span><small>BOUNDED ROUTES</small><b>' + number(candidates.length) + '</b></span><span><small>TOPIC DOORS</small><b>' + number((shape.topics || []).length) + '</b></span></div></header><div class="wac-dossier-note"><strong>SEPARATE PODCAST CLOCK // </strong>' + esc((pass && pass.listeningDigest && pass.listeningDigest.evidence) || 'Official podcast audio was decoded and locally transcribed. Playback remains the authority; speaker identity and exact joke intent are not inferred.') + '</div><div class="wac-podcast-dossier-player"><audio id="' + esc(audioId) + '" controls preload="metadata" src="' + esc(item.sourceUrl || item.url) + '"></audio><a target="_blank" rel="noopener" href="' + esc(item.sourceUrl || item.url) + '">OPEN OFFICIAL AUDIO SOURCE ↗</a></div>' + (shape.summary ? '<div class="wac-podcast-dossier-shape"><span class="wac-section-label">TAPE SHAPE // SOURCE-LOCAL READ</span><p>' + esc(shape.summary) + '</p><div class="wac-podcast-dossier-chapters">' + chapterMarkup + '</div>' + (topicMarkup ? '<div class="wac-podcast-dossier-topics">' + topicMarkup + '</div>' : '') + '</div>' : '') + '<div class="wac-section-label" style="padding:1rem 1.5rem 0">EVERY BOUNDED PODCAST RECEIPT // CLICK TO PLAY HERE</div><div class="wac-podcast-dossier-routes">' + (routeMarkup || '<p class="wac-empty">The audio is catalogued, but its bounded listening pass has not landed yet.</p>') + '</div><footer class="wac-dossier-footer"><button class="wac-button" type="button" data-wac-podcast-close>CLOSE PODCAST WIKI</button><span class="wac-podcast-clock-note">PODCAST TIME IS NOT YOUTUBE TIME.</span></footer></section>';
  }

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
    return '<div class="wac-section-label" id="wacMovieWorlds">MOVIE WORLDS // CLICK A WORLD TO FILTER THE TAPE</div><div class="wac-franchise-grid">' + franchises.map(function (franchise) {
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
    var cuts = episode.dossier && Array.isArray(episode.dossier.cuts) ? episode.dossier.cuts : [];
    var counts = {};
    cuts.forEach(function (cut) {
      var label = clean(cut.category || cut.label);
      if (label) counts[label] = (counts[label] || 0) + 1;
    });
    if (episode.dossier && Array.isArray(episode.dossier.fanSignals) && episode.dossier.fanSignals.length) counts["FAN SIGNAL"] = episode.dossier.fanSignals.length;
    var preferred = ["STRAIGHT TO STEVE'S ASSHOLE", "WWAM UP IN YA", "CHARACTER SIGNAL", "FAN SIGNAL"];
    var lanes = preferred.filter(function (label) { return counts[label]; });
    cuts.slice().sort(function (left, right) { return Number(right.score || 0) - Number(left.score || 0); }).forEach(function (cut) {
      var label = clean(cut.category || cut.label);
      if (label && lanes.indexOf(label) < 0 && lanes.length < 4) lanes.push(label);
    });
    return lanes.length ? '<div class="wac-lane-row">' + lanes.map(function (lane) { return '<span>' + esc(lane) + ' <b>' + counts[lane] + '</b></span>'; }).join("") + '</div>' : '';
  }

  function episodeProofMarkup(episode) {
    var pass = episode.watchPass || {};
    var audit = pass.audit || {};
    var candidates = Array.isArray(pass.candidates) ? pass.candidates : [];
    var peak = candidates.reduce(function (value, candidate) { return Math.max(value, Number(candidate.score || 0)); }, 0);
    if (pass.status === 'audio-feature-pilot') return '<div class="wac-episode-proof"><span>AUDIO PASS // ' + number(audit.candidateCount || candidates.length) + ' WINDOWS</span><b>PEAK SIGNAL ' + (peak ? Math.round(peak) : '—') + '</b></div>';
    if (pass.status === 'caption-ledger-pilot') return '<div class="wac-episode-proof is-caption"><span>CAPTION PATH // ' + number(audit.candidateCount || candidates.length) + ' ROUTES</span><b>PLAYBACK IS THE AUTHORITY</b></div>';
    if (/^held-/.test(pass.status || '')) return '<div class="wac-episode-proof is-held"><span>SOURCE HELD // NO TIMESTAMP CLAIM</span><b>OFFICIAL UPLOAD STILL LINKED</b></div>';
    return '';
  }

  function episodeCard(episode) {
    var repeat = episode.catalogMember ? "CURATED CORE" : "ADDITIONAL PUBLIC CUT";
    return '<article class="wac-episode-card" data-wac-episode="' + esc(episode.id) + '">' +
      '<div class="wac-episode-art"><img loading="lazy" src="' + esc(episode.thumbnail) + '" alt="' + esc(episode.movieTitle) + ' watchalong thumbnail"><span>' + esc(stateLabel(episode)) + '</span></div>' +
      '<div class="wac-episode-copy"><header><p>' + esc(dateLabel(episode.date)) + ' // ' + esc(typeLabel(episode.type)) + '</p><b>' + esc(durationLabel(episode.duration)) + '</b></header>' +
      '<h4>' + esc(episode.movieTitle) + '</h4><p>' + esc(excerpt(episode.dossier && episode.dossier.summary, 210)) + '</p>' + laneMarkup(episode) + episodeProofMarkup(episode) +
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

  // Variant-clock chapters are rendered by this final declaration so a held
  // YouTube source never receives a fake local timestamp route.
  function chapterMarkup(episode, chapters) {
    if (!Array.isArray(chapters) || !chapters.length) return '';
    return '<div class="wac-section-label" style="padding:0 1.5rem">SHOW ARC // CHAPTERS ARE ROUTES, NOT AI FILLER</div><div class="wac-chapter-grid">' + chapters.map(function (chapter) {
      var at = Number(chapter.at || chapter.t || 0);
      var podcast = chapter.sourceKind === "podcast-variant";
      var label = podcast ? "OPEN PODCAST VARIANT AT " : "OPEN SOURCE AT ";
      return '<article class="wac-chapter"><header><span>ACT ' + esc(chapter.act || chapter.chapter || '') + '</span><span>' + esc(receiptClock(chapter) + timestamp(at)) + '</span></header><b>' + esc(chapter.label || chapter.category || 'WATCH ROUTE') + '</b><p>' + esc(excerpt(chapter.body || chapter.excerpt || 'Open the timestamp and hear this stretch of the tape.', 220)) + '</p><a' + receiptTarget(chapter) + ' href="' + esc(receiptUrl(episode, chapter)) + '">' + label + esc(timestamp(at)) + ' -></a></article>';
    }).join('') + '</div>';
  }

  // Keep podcast-clock chapters in the same local player as their receipt
  // cards. A chapter is navigation, not a reason to bounce the visitor to a
  // separate podcast tab.
  function chapterMarkup(episode, chapters) {
    if (!Array.isArray(chapters) || !chapters.length) return '';
    return '<div class="wac-section-label" style="padding:0 1.5rem">SHOW ARC // CHAPTERS ARE ROUTES, NOT AI FILLER</div><div class="wac-chapter-grid">' + chapters.map(function (chapter) {
      var at = Number(chapter.at || chapter.t || 0);
      var podcast = chapter.sourceKind === 'podcast-variant';
      var open = podcast
        ? '<button type="button" class="wac-variant-route" data-wac-variant-seek="' + esc(at) + '" data-wac-variant-audio="wacVariantAudio-source">OPEN PODCAST VARIANT AT ' + esc(timestamp(at)) + ' -></button>'
        : '<a' + receiptTarget(chapter) + ' href="' + esc(receiptUrl(episode, chapter)) + '">' + (podcast ? 'OPEN PODCAST VARIANT AT ' : 'OPEN SOURCE AT ') + esc(timestamp(at)) + ' -></a>';
      return '<article class="wac-chapter"><header><span>ACT ' + esc(chapter.act || chapter.chapter || '') + '</span><span>' + esc(receiptClock(chapter) + timestamp(at)) + '</span></header><b>' + esc(chapter.label || chapter.category || 'WATCH ROUTE') + '</b><p>' + esc(excerpt(chapter.body || chapter.excerpt || 'Open the timestamp and hear this stretch of the tape.', 220)) + '</p>' + open + '</article>';
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

  function watchCandidateLabel(episode, candidate) {
    var category = clean(candidate && (candidate.category || candidate.label || 'SOURCE RECEIPT'));
    var topics = Array.isArray(episode && episode.topics) ? episode.topics : [];
    var at = Number(candidate && candidate.t || 0);
    var nearest = topics.slice().sort(function (left, right) {
      var leftAt = Number(left && (left.peak || left.first || 0));
      var rightAt = Number(right && (right.peak || right.first || 0));
      return Math.abs(leftAt - at) - Math.abs(rightAt - at) ||
        Number(right && right.mentions || 0) - Number(left && left.mentions || 0);
    })[0];
    var topic = clean(nearest && nearest.name);
    if (!topic || /^SOURCE RECEIPT$/i.test(category)) return category || 'SOURCE RECEIPT';
    return category + ' // ' + topic;
  }

  function alternateAudioMarkup(pass) {
    var alternate = pass && pass.alternateAudio;
    if (!alternate) {
      return '<div class="wac-watch-pass-alternate"><b>' + esc((pass.alternateSource || {}).label || 'ALTERNATE SOURCE') + '</b><a target="_blank" rel="noopener" href="' + esc((pass.alternateSource || {}).url || '#') + '">OPEN OFFICIAL WWAM PODCAST VARIANT â†—</a></div>';
    }
    var audit = alternate.audit || {};
    var stats = audit.audioStats || {};
    var candidates = Array.isArray(alternate.candidates) ? alternate.candidates : [];
    var source = (alternate.media || {}).sourceUrl || (pass.alternateSource || {}).url || '#';
    return '<div class="wac-watch-pass-alternate"><b>' + esc(alternate.label || 'OFFICIAL WWAM PODCAST VARIANT') + '</b><a target="_blank" rel="noopener" href="' + esc(source) + '">OPEN PLAYABLE VARIANT â†—</a><small>' + number(audit.candidateCount) + ' VARIANT ROUTES // ' + esc(durationLabel((alternate.media || {}).durationSeconds)) + ' AUDIO</small></div>' +
      '<div class="wac-watch-pass-metrics"><span><b>' + number(audit.captionEvents) + '</b>TRANSCRIPT EVENTS</span><span><b>' + number(audit.laughterOrOverlapMarkers) + '</b>LAUGHTER / OVERLAP MARKERS</span><span><b>' + number(audit.candidateCount) + '</b>RANKED VARIANT ROUTES</span><span><b>' + number(stats.energyP90Seconds) + '</b>HIGH-ENERGY SECONDS</span></div>' +
      '<div class="wac-watch-pass-candidates">' + candidates.map(function (candidate) {
        var audio = candidate.audio || {};
        var candidateExcerpt = excerpt(candidate.captionExcerpt, 230) || 'NO TRANSCRIPT FRAGMENT ALIGNED // OPEN THE PODCAST VARIANT AND LISTEN.';
        return '<a target="_blank" rel="noopener" href="' + esc(source) + '"><header><b>#' + esc(candidate.rank) + ' // ' + esc(candidate.category || candidate.label || 'VARIANT RECEIPT') + '</b><span>' + esc(timestamp(candidate.t)) + ' // SCORE ' + esc(candidate.score) + '</span></header><p>' + esc(candidateExcerpt) + '</p><small>VARIANT AUDIO // ENERGY ' + esc(audio.meanEnergyPercentile) + 'TH PCTL // PEAK ' + esc(audio.peakPercentile) + 'TH PCTL</small></a>';
      }).join('') + '</div>';
  }

  // Final alternate-audio declaration: held sources get an in-page player and
  // source-local seek buttons. The explicit ad/intro marker survives here so
  // a loud sponsor read cannot masquerade as a WWAM bit.
  function alternateAudioMarkup(pass, episode) {
    var alternate = pass && pass.alternateAudio;
    if (!alternate) {
      return '<div class="wac-watch-pass-alternate"><b>' + esc((pass.alternateSource || {}).label || 'ALTERNATE SOURCE') + '</b><a target="_blank" rel="noopener" href="' + esc((pass.alternateSource || {}).url || '#') + '">OPEN OFFICIAL WWAM PODCAST VARIANT</a></div>';
    }
    var audit = alternate.audit || {};
    var stats = audit.audioStats || {};
    var candidates = Array.isArray(alternate.candidates) ? alternate.candidates : [];
    var source = (alternate.media || {}).sourceUrl || (pass.alternateSource || {}).url || '#';
    var audioId = 'wacVariantAudio-source';
    var playable = /^https?:\/\//i.test(String(source || ''));
    var player = playable ? '<audio id="' + audioId + '" controls preload="metadata" src="' + esc(source) + '"></audio>' : '';
    var cards = candidates.map(function (candidate) {
      var audio = candidate.audio || {};
      var boundary = candidate.segmentKind === 'podcast-ad-or-intro';
      var body = '<header><b>#' + esc(candidate.rank) + ' // ' + esc(candidate.category || candidate.label || 'VARIANT RECEIPT') + '</b><span>' + esc(timestamp(candidate.t)) + ' // SCORE ' + esc(candidate.score) + '</span></header><p>' + esc(excerpt(candidate.captionExcerpt || candidate.excerpt, 230) || 'NO TRANSCRIPT FRAGMENT ALIGNED // OPEN THE PODCAST VARIANT AND LISTEN.') + '</p><small>' + (boundary ? 'AD / INTRO BOUNDARY // NOT A WWAM BIT // ' : '') + 'VARIANT AUDIO // ENERGY ' + esc(audio.meanEnergyPercentile) + 'TH PCTL // PEAK ' + esc(audio.peakPercentile) + 'TH PCTL</small>';
      return playable
        ? '<button type="button" class="wac-variant-route' + (boundary ? ' wac-variant-boundary' : '') + '" data-wac-variant-seek="' + esc(candidate.t || 0) + '" data-wac-variant-audio="' + audioId + '">' + body + '</button>'
        : '<a target="_blank" rel="noopener" href="' + esc(source) + '">' + body + '</a>';
    }).join('');
    return '<div class="wac-watch-pass-alternate"><b>' + esc(alternate.label || 'OFFICIAL WWAM PODCAST VARIANT') + '</b>' + player + '<a target="_blank" rel="noopener" href="' + esc(source) + '">OPEN PLAYABLE VARIANT</a><small>' + number(audit.candidateCount) + ' VARIANT ROUTES // ' + esc(durationLabel((alternate.media || {}).durationSeconds)) + ' AUDIO // PODCAST CLOCK ONLY</small></div>' +
      '<div class="wac-watch-pass-metrics"><span><b>' + number(audit.captionEvents) + '</b>TRANSCRIPT EVENTS</span><span><b>' + number(audit.laughterOrOverlapMarkers) + '</b>LAUGHTER / OVERLAP MARKERS</span><span><b>' + number(audit.candidateCount) + '</b>RANKED VARIANT ROUTES</span><span><b>' + number(stats.energyP90Seconds) + '</b>HIGH-ENERGY SECONDS</span></div>' +
      '<div class="wac-watch-pass-candidates">' + cards + '</div>';
  }

  function watchPassMarkup(episode) {
    var pass = episode.watchPass;
    if (!pass) return '';
    var audit = pass.audit || {};
    var stats = audit.audioStats || {};
    var candidates = Array.isArray(pass.candidates) ? pass.candidates : [];
    if (pass.status === 'held-age-restricted') {
      return '<section class="wac-watch-pass wac-watch-pass-held"><header><div><span class="wac-section-label">' + esc(pass.label || 'HALLOWEEN WATCH PASS // HELD SOURCE') + '</span><h4>THE CANONICAL TAPE IS HELD.</h4><p>' + esc(pass.note || 'The canonical source could not be acquired without authentication.') + '</p></div><a target="_blank" rel="noopener" href="' + esc(episode.url) + '">OPEN YOUTUBE SOURCE ↗</a></header>' + alternateAudioMarkup(pass) + '<p class="wac-watch-pass-foot">NO YOUTUBE TIMESTAMP RECEIPTS MANUFACTURED // VARIANT ROUTES ARE BOUND TO THE OFFICIAL PODCAST AUDIO ONLY.</p></section>';
    }
    return '<section class="wac-watch-pass"><header><div><span class="wac-section-label">' + esc(pass.label || 'HALLOWEEN WATCH PASS // AUDIO PILOT') + '</span><h4>LISTEN FOR THE ROOM TO CHANGE.</h4><p>' + esc(pass.note || 'Canonical audio was sampled and aligned to the caption map.') + '</p></div><a target="_blank" rel="noopener" href="' + esc(episode.url) + '">PLAY OFFICIAL SOURCE ↗</a></header><div class="wac-watch-pass-metrics"><span><b>' + number(audit.captionEvents) + '</b>CAPTION EVENTS</span><span><b>' + number(audit.laughterOrOverlapMarkers) + '</b>LAUGHTER / OVERLAP MARKERS</span><span><b>' + number(audit.candidateCount) + '</b>RANKED AUDIO CANDIDATES</span><span><b>' + number(stats.energyP90Seconds) + '</b>HIGH-ENERGY SECONDS</span></div><div class="wac-watch-pass-candidates">' + candidates.map(function (candidate) {
      var audio = candidate.audio || {};
      var candidateExcerpt = excerpt(candidate.captionExcerpt, 230) || 'NO CAPTION FRAGMENT ALIGNED // OPEN SOURCE AND LISTEN.';
      var alignment = candidate.captionExcerpt ? '' : ' // ACOUSTIC ONLY';
      return '<a target="_blank" rel="noopener" href="' + esc(sourceUrl(episode, candidate.t)) + '"><header><b>#' + esc(candidate.rank) + ' // ' + esc(watchCandidateLabel(episode, candidate)) + alignment + '</b><span>' + esc(timestamp(candidate.t)) + ' // SCORE ' + esc(candidate.score) + '</span></header><p>' + esc(candidateExcerpt) + '</p><small>ENERGY ' + esc(audio.meanEnergyPercentile) + 'TH PCTL // PEAK ' + esc(audio.peakPercentile) + 'TH PCTL // ' + (audio.markerObserved ? 'MARKER OBSERVED' : 'NO MARKER') + '</small></a>';
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
    var moments = Array.isArray(dossier.cuts) ? dossier.cuts.map(function (moment) {
      var rendered = Object.assign({}, moment || {});
      if (rendered.label) rendered.category = rendered.label;
      if (rendered.audio) {
        var peak = rendered.audio.peakPercentile == null ? '—' : rendered.audio.peakPercentile;
        rendered.excerpt = '[AUDIO FEATURE RANK #' + (rendered.audioRank || '—') + ' // PEAK ' + peak + 'TH PCTL] ' + (rendered.excerpt || '');
      }
      return rendered;
    }) : [];
    return '<section class="wac-dossier" id="wacDossier" aria-labelledby="wacDossierTitle"><header class="wac-dossier-head"><div><span class="wac-dossier-kicker">' + esc(episode.franchiseTitle) + ' // ' + esc(stateLabel(episode)) + '</span><h3 id="wacDossierTitle">' + esc(episode.movieTitle) + '</h3><p>' + esc(dossier.summary) + '</p></div><div class="wac-dossier-facts"><span><small>DATE</small><b>' + esc(dateLabel(episode.date)) + '</b></span><span><small>RUNTIME</small><b>' + esc(durationLabel(episode.duration)) + '</b></span><span><small>CAPTION WORDS</small><b>' + number(dossier.caption && dossier.caption.words) + '</b></span><span><small>JUMP RECEIPTS</small><b>' + number(moments.length) + '</b></span></div></header>' +
      '<div class="wac-dossier-note"><strong>EVIDENCE STATUS // </strong>' + esc(dossier.evidenceSummary || 'The source is linked to the official tape. Speaker identity, intent, and current playback availability remain outside this fan archive unless a reviewed guide says otherwise.') + '</div>' +
      '<div class="wac-route-grid">' + routeCard('OPENING READ', route.opening) + routeCard('STRONGEST RECEIPT', route.strongest) + routeCard('CLOSING READ', route.closing) + '</div>' + watchPassMarkup(episode) + chapterMarkup(episode, dossier.chapters) + topicMarkup(episode, episode.topics) + fanReadMarkup(dossier.fanRead) + fanSignalsMarkup(episode, dossier.fanSignals) +
      '<div class="wac-section-label" style="padding:0 1.5rem">EVERY INDEXED RECEIPT // PRESS PLAY AT THE TAPE</div><div class="wac-moment-grid">' + moments.map(function (moment) {
        return '<article class="wac-moment"><header><span>' + esc(moment.category || moment.label || 'SOURCE RECEIPT') + '</span><span>' + esc(timestamp(moment.t)) + '</span></header><p>' + esc(moment.excerpt || moment.quote || 'Caption receipt available at this timestamp.') + '</p><a target="_blank" rel="noopener" href="' + esc(sourceUrl(episode, moment.t)) + '">OPEN SOURCE AT ' + esc(timestamp(moment.t)) + ' ↗</a></article>';
      }).join('') + '</div><footer class="wac-dossier-footer"><a href="' + esc(wikiUrl(episode)) + '">OPEN THIS SHOW&rsquo;S WIKI →</a><a target="_blank" rel="noopener" href="' + esc(episode.url) + '">OPEN OFFICIAL UPLOAD ↗</a><button class="wac-button" type="button" data-wac-close>CLOSE DOSSIER</button></footer></section>';
  }

  // The final dossier renderer keeps podcast-variant receipts on their own
  // source-local clock and never turns them into YouTube timestamps.
  function dossierMarkup(episode) {
    if (!episode) return '';
    var dossier = episode.dossier || {};
    var route = dossier.route || {};
    var moments = Array.isArray(dossier.cuts) ? dossier.cuts.map(function (moment) {
      var rendered = Object.assign({}, moment || {});
      if (rendered.label) rendered.category = rendered.label;
      if (rendered.audio) {
        var peak = rendered.audio.peakPercentile == null ? '-' : rendered.audio.peakPercentile;
        rendered.excerpt = '[AUDIO FEATURE RANK #' + (rendered.audioRank || '-') + ' // PEAK ' + peak + 'TH PCTL] ' + (rendered.excerpt || '');
      }
      return rendered;
    }) : [];
    return '<section class="wac-dossier" id="wacDossier" aria-labelledby="wacDossierTitle"><header class="wac-dossier-head"><div><span class="wac-dossier-kicker">' + esc(episode.franchiseTitle) + ' // ' + esc(stateLabel(episode)) + '</span><h3 id="wacDossierTitle">' + esc(episode.movieTitle) + '</h3><p>' + esc(dossier.summary) + '</p></div><div class="wac-dossier-facts"><span><small>DATE</small><b>' + esc(dateLabel(episode.date)) + '</b></span><span><small>RUNTIME</small><b>' + esc(durationLabel(episode.duration)) + '</b></span><span><small>CAPTION WORDS</small><b>' + number(dossier.caption && dossier.caption.words) + '</b></span><span><small>JUMP RECEIPTS</small><b>' + number(moments.length) + '</b></span></div></header>' +
      '<div class="wac-dossier-note"><strong>EVIDENCE STATUS // </strong>' + esc(dossier.evidenceSummary || 'The source is linked to the official tape. Speaker identity, intent, and current playback availability remain outside this fan archive unless a reviewed guide says otherwise.') + '</div>' +
      '<div class="wac-route-grid">' + routeCard('OPENING READ', route.opening) + routeCard('STRONGEST RECEIPT', route.strongest) + routeCard('CLOSING READ', route.closing) + '</div>' + watchPassMarkup(episode) + chapterMarkup(episode, dossier.chapters) + topicMarkup(episode, episode.topics) + fanReadMarkup(dossier.fanRead) + fanSignalsMarkup(episode, dossier.fanSignals) +
      '<div class="wac-section-label" style="padding:0 1.5rem">EVERY INDEXED RECEIPT // PRESS PLAY AT THE TAPE</div><div class="wac-moment-grid">' + moments.map(function (moment) {
        var podcast = moment.sourceKind === "podcast-variant";
        var label = podcast ? "OPEN PODCAST VARIANT AT " : "OPEN SOURCE AT ";
            var action = podcast
              ? '<button type="button" class="wac-variant-route" data-wac-variant-seek="' + esc(moment.t || 0) + '" data-wac-variant-audio="wacVariantAudio-source">OPEN PODCAST VARIANT AT ' + esc(timestamp(moment.t)) + ' -></button>'
              : '<a' + receiptTarget(moment) + ' href="' + esc(receiptUrl(episode, moment)) + '">' + label + esc(timestamp(moment.t)) + ' -></a>';
            return '<article class="wac-moment"><header><span>' + esc(moment.category || moment.label || 'SOURCE RECEIPT') + '</span><span>' + esc(receiptClock(moment) + timestamp(moment.t)) + '</span></header><p>' + esc(moment.excerpt || moment.quote || 'Caption receipt available at this timestamp.') + '</p>' + action + '</article>';
      }).join('') + '</div><footer class="wac-dossier-footer"><a href="' + esc(wikiUrl(episode)) + '">OPEN THIS SHOW&rsquo;S WIKI -></a><a target="_blank" rel="noopener" href="' + esc(episode.url) + '">OPEN OFFICIAL UPLOAD -></a><button class="wac-button" type="button" data-wac-close>CLOSE DOSSIER</button></footer></section>';
  }

  function keepPublicEdgeLinksLocal() {
    Array.prototype.forEach.call(root.document.querySelectorAll(".wac-edge-shelf a[href^=\"?source=\"]"), function (link) {
      // Adjacent public leads already have a local receipt route. Do not pop
      // a second tab or send the visitor back to YouTube for the local wiki.
      link.removeAttribute("target");
      link.removeAttribute("rel");
    });
    keepLocalReceiptLinks();
  }

  function keepLocalReceiptLinks() {
    Array.prototype.forEach.call(root.document.querySelectorAll("a[href^=\"?source=\"]"), function (link) {
      // Topic, chapter, fan, audio-ranked, and moment receipts all resolve to
      // the same local Show Wiki route. Keep the visitor inside the dossier;
      // the explicit official-upload buttons remain the only external exits.
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.textContent = link.textContent.replace(/OPEN SOURCE AT/gi, "OPEN LOCAL SOURCE AT");
    });
  }

  function render() {
    var visible = visibleEpisodes();
    var selected = episodeById(state.selected);
    var selectedPodcast = podcastByKey(state.selectedPodcast);
    mount.innerHTML = '<div class="wac-shell">' + quickStartMarkup() + franchiseMarkup() + toolsMarkup() + movieFileMarkup() +
      '<div class="wac-results-head"><h3>' + (state.franchise === "all" ? "THE FULL TAPE LIST" : esc((franchises.filter(function (item) { return item.key === state.franchise; })[0] || {}).title || "FILTERED TAPE LIST")) + '</h3><span>' + number(visible.length) + ' EPISODES // EVERY MOVIE VERSION STAYS VISIBLE</span></div>' +
      '<div class="wac-episode-grid">' + (visible.length ? visible.map(episodeCard).join('') : '<div class="wac-empty">No public watchalong matches that filter. Try another movie, franchise, or format.</div>') + '</div>' + (selected ? dossierMarkup(selected) : '') + (selectedPodcast ? podcastDossierMarkup(selectedPodcast) : '') +
      '<div class="wac-audit-lanes">' + proofMarkup() + coverageLedgerMarkup() + companionShelfMarkup() + edgeAuditMarkup() + podcastRecoveryMarkup() + '</div></div>';
    keepPublicEdgeLinksLocal();
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
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-quick]"), function (button) {
      button.addEventListener("click", function () {
        var quick = button.getAttribute("data-wac-quick");
        state.selected = "";
        state.selectedPodcast = "";
        if (quick === "halloween") state.franchise = franchises.filter(function (item) { return item.key === "halloween"; })[0] ? "halloween" : state.franchise;
        else if (quick === "comedy") {
          state.franchise = "all";
          state.query = "Scary Movie";
        } else if (quick === "search") {
          state.franchise = "all";
          state.query = "";
        } else {
          state.franchise = "all";
          state.query = "";
        }
        render();
        var target = quick === "all" || quick === "halloween" || quick === "comedy" ? root.document.getElementById("wacMovieWorlds") : root.document.getElementById("wacSearch");
        if (target && typeof target.scrollIntoView === "function") target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (target && quick === "search") target.focus();
      });
    });
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
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-podcast-open]"), function (button) {
      button.addEventListener("click", function () {
        state.selectedPodcast = button.getAttribute("data-wac-podcast-open") || "";
        state.selected = "";
        render();
        var dossier = root.document.getElementById("wacPodcastDossier");
        if (dossier) dossier.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-podcast-close]"), function (button) {
      button.addEventListener("click", function () { state.selectedPodcast = ""; render(); });
    });
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-podcast-seek]"), function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-wac-podcast-seek");
        var audio = root.document.getElementById("wacPodcastAudio-" + key);
        if (!audio) return;
        audio.currentTime = Math.max(0, Number(button.getAttribute("data-wac-podcast-time")) || 0);
        var play = audio.play();
        if (play && typeof play.catch === "function") play.catch(function () {});
      });
    });
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-podcast-dossier-seek]"), function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-wac-podcast-dossier-seek");
        var audio = root.document.getElementById("wacPodcastDossierAudio-" + key);
        if (!audio) return;
        audio.currentTime = Math.max(0, Number(button.getAttribute("data-wac-podcast-dossier-time")) || 0);
        var play = audio.play();
        if (play && typeof play.catch === "function") play.catch(function () {});
        var dossier = root.document.getElementById("wacPodcastDossier");
        if (dossier) dossier.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-wac-variant-seek]"), function (button) {
      button.addEventListener("click", function () {
        var audio = root.document.getElementById(button.getAttribute("data-wac-variant-audio") || "wacVariantAudio-source");
        if (!audio) return;
        audio.currentTime = Math.max(0, Number(button.getAttribute("data-wac-variant-seek")) || 0);
        var play = audio.play();
        if (play && typeof play.catch === "function") play.catch(function () {});
        var dossier = root.document.getElementById("wacDossier");
        if (dossier) dossier.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  render();
  root.WWAMWatchalongCanonUI = Object.freeze({ version: "1.2.0", render: render, payload: payload });
})(typeof window !== "undefined" ? window : globalThis);
