(function () {
  "use strict";

  var atlas = window.WWAM_CONTEXT_ATLAS || {movies:{}, recentShows:{}};
  var scheduled = false;

  function esc(value) {
    return String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  function formatTime(seconds) {
    var value = Math.max(0, Math.round(Number(seconds) || 0));
    var h = Math.floor(value / 3600);
    var m = Math.floor((value % 3600) / 60);
    var s = value % 60;
    return h ? h + ":" + String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0") : m + ":" + String(s).padStart(2,"0");
  }

  function sourceIdFromModal(modal) {
    var queryId = new URLSearchParams(location.search).get("source");
    if (queryId && (atlas.movies[queryId] || atlas.recentShows[queryId])) return queryId;
    var links = Array.prototype.slice.call(modal.querySelectorAll('a[href*="youtube.com/watch"],a[href*="youtu.be/"]'));
    for (var i = 0; i < links.length; i += 1) {
      try {
        var parsed = new URL(links[i].href);
        var id = parsed.hostname.indexOf("youtu.be") >= 0 ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
        if (id && (atlas.movies[id] || atlas.recentShows[id])) return id;
      } catch (error) {}
    }
    return "";
  }

  function trailerMarkup(item) {
    if (!item.trailerId) return "";
    var title = item.trailerLabel || (item.film + " trailer");
    var fallback = "https://www.youtube.com/watch?v=" + encodeURIComponent(item.trailerId);
    var frame = window.ShokkerYouTubePlayback && typeof window.ShokkerYouTubePlayback.iframe === "function"
      ? window.ShokkerYouTubePlayback.iframe(item.trailerId, {autoplay:false,title:title})
      : '<iframe src="https://www.youtube.com/embed/' + esc(item.trailerId) + '?rel=0&playsinline=1" title="' + esc(title) + '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
    return '<details class="context-trailer"><summary><span>OFFICIAL TRAILER</span><b>WATCH WITHOUT LEAVING THE WIKI +</b></summary><div class="context-embed">' + frame + '</div><a href="' + fallback + '" target="_blank" rel="noopener">OPEN TRAILER ON YOUTUBE ↗</a></details>';
  }

  function movieMarkup(sourceId, item) {
    var image = item.image || ("https://i.ytimg.com/vi/" + sourceId + "/maxresdefault.jpg");
    var imageLabel = item.imageLabel || "WWAM commentary thumbnail — source artwork";
    var imageLink = item.imageSource || ("https://www.youtube.com/watch?v=" + sourceId);
    var facts = (item.facts || []).map(function (fact) { return '<li>' + esc(fact) + '</li>'; }).join("");
    var disputes = (item.disputes || []).map(function (fact) { return '<li><b>CONTEXT FLAG</b>' + esc(fact) + '</li>'; }).join("");
    var sourceLinks = '<a href="' + esc(item.financialSource) + '" target="_blank" rel="noopener">BOX OFFICE SOURCE ↗</a>' +
      (item.officialUrl ? '<a href="' + esc(item.officialUrl) + '" target="_blank" rel="noopener">' + esc(item.officialLabel || "OFFICIAL / PRIMARY SOURCE") + ' ↗</a>' : "") +
      '<a href="' + esc(imageLink) + '" target="_blank" rel="noopener">IMAGE PROVENANCE ↗</a>';
    return '<section class="source-context-companion source-context-movie" id="sourceDossierContext" aria-labelledby="sourceContextTitle">' +
      '<header class="context-head"><div><span>ABOUT THE MOVIE // EXTERNAL CONTEXT</span><h4 id="sourceContextTitle">THE FILM AROUND THE COMMENTARY.</h4></div><p>Film facts live in this green lane. WWAM quotes, jokes and opinions stay in the source-evidence lanes below.</p></header>' +
      '<div class="context-movie-hero"><figure><img src="' + esc(image) + '" alt="Context artwork for ' + esc(item.film) + '" loading="lazy" referrerpolicy="no-referrer"><figcaption><a href="' + esc(imageLink) + '" target="_blank" rel="noopener">' + esc(imageLabel) + ' ↗</a></figcaption></figure>' +
      '<div class="context-movie-copy"><p>' + esc(item.franchise) + ' // ' + esc(item.year) + '</p><h5>' + esc(item.film) + '</h5><div class="context-stat-grid"><div><span>RUNTIME</span><b>' + esc(item.runtime) + '</b></div><div><span>DIRECTOR</span><b>' + esc(item.director) + '</b></div><div><span>REPORTED BUDGET</span><b>' + esc(item.budget) + '</b></div><div><span>WORLDWIDE GROSS</span><b>' + esc(item.worldwide) + '</b></div></div><ul class="context-facts">' + facts + '</ul><div class="context-source-links">' + sourceLinks + '</div></div></div>' +
      (disputes ? '<ul class="context-disputes">' + disputes + '</ul>' : "") +
      trailerMarkup(item) +
      '<aside class="context-sync-lock"><span>POP-UP WATCHALONG COMPANION</span><b>SYNC CALIBRATION REQUIRED</b><p>The commentary upload and movie cut need one human-verified offset before film-timed cards can fire honestly. The feature is designed, but it will not pretend those clocks are synchronized.</p></aside>' +
    '</section>';
  }

  function videoMarkup(card) {
    if (card.youtubeId) {
      var frame = window.ShokkerYouTubePlayback && typeof window.ShokkerYouTubePlayback.iframe === "function"
        ? window.ShokkerYouTubePlayback.iframe(card.youtubeId, {autoplay:false,title:card.title})
        : '<iframe src="https://www.youtube.com/embed/' + esc(card.youtubeId) + '?rel=0&playsinline=1" title="' + esc(card.title) + '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
      return '<details class="context-card-media"><summary>PLAY REFERENCED VIDEO +</summary><div class="context-embed">' + frame + '</div><a href="https://www.youtube.com/watch?v=' + esc(card.youtubeId) + '" target="_blank" rel="noopener">OPEN ON YOUTUBE ↗</a></details>';
    }
    if (card.vimeoId) {
      return '<details class="context-card-media"><summary>PLAY REFERENCED VIDEO +</summary><div class="context-embed"><iframe src="https://player.vimeo.com/video/' + esc(card.vimeoId) + '" title="' + esc(card.title) + '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div></details>';
    }
    return "";
  }

  function cardMarkup(sourceId, card, index) {
    var image = card.image || (card.youtubeId ? "https://i.ytimg.com/vi/" + card.youtubeId + "/maxresdefault.jpg" : "https://i.ytimg.com/vi/" + sourceId + "/maxresdefault.jpg");
    var localUrl = location.pathname + "?source=" + encodeURIComponent(sourceId) + "&at=" + encodeURIComponent(card.at) + "&section=player#archive";
    return '<article class="context-popup-card" data-context-time="' + esc(card.at) + '">' +
      '<div class="context-popup-time"><span>POP-UP ' + String(index + 1).padStart(2,"0") + '</span><b>' + esc(formatTime(card.at)) + '</b></div>' +
      '<div class="context-popup-image"><img src="' + esc(image) + '" alt="" loading="lazy" referrerpolicy="no-referrer"><span>' + esc(card.kind || "context") + '</span></div>' +
      '<div class="context-popup-copy"><p><span>' + esc(card.claimState || "CONTEXT") + '</span>' + esc(card.sourceLabel || "External source") + '</p><h5>' + esc(card.title) + '</h5><div>' + esc(card.summary) + '</div><nav>' +
        '<a class="context-play-wwam" href="' + esc(localUrl) + '">PLAY WWAM AT ' + esc(formatTime(card.at)) + ' →</a>' +
        (card.href ? '<a href="' + esc(card.href) + '" target="_blank" rel="noopener">OPEN CONTEXT SOURCE ↗</a>' : "") +
      '</nav>' + videoMarkup(card) + '</div></article>';
  }

  function recentMarkup(sourceId, show) {
    var cards = (show.cards || []).map(function (card,index) { return cardMarkup(sourceId,card,index); }).join("");
    return '<section class="source-context-companion source-context-live" id="sourceDossierContext" aria-labelledby="sourceContextTitle">' +
      '<header class="context-head"><div><span>POP-UP COMPANION // TOPIC CONTEXT</span><h4 id="sourceContextTitle">WHEN THEY SAY IT, THE WORLD AROUND IT OPENS.</h4></div><p>Every card is locked to a WWAM caption timestamp. Trailers, games, articles and rumors are separately labeled so a host opinion never turns into a fake fact.</p></header>' +
      '<div class="context-live-intro"><div><span>' + esc(show.date) + '</span><h5>' + esc(show.title) + '</h5><p>' + esc(show.summary) + '</p></div><aside><span>COVERAGE</span><b>' + esc(show.coverage === "caption-backed" ? "TIMED + SOURCE-LINKED" : "SOURCE ONLY") + '</b><small>' + (show.cards || []).length + ' CONTEXT DOORS</small></aside></div>' +
      (show.gap ? '<div class="context-trust-gap"><span>VISIBLE TRUST GAP</span><h5>NO CAPTIONS. NO INVENTED WIKI.</h5><p>' + esc(show.gap) + '</p><a href="https://www.youtube.com/watch?v=' + esc(sourceId) + '" target="_blank" rel="noopener">PLAY THE OFFICIAL UPLOAD ↗</a></div>' : '<div class="context-popup-timeline">' + cards + '</div>') +
    '</section>';
  }

  function addExploreLink(modal) {
    var nav = modal.querySelector(".source-dossier-explore div");
    if (!nav || nav.querySelector('a[href="#sourceDossierContext"]')) return;
    var link = document.createElement("a");
    link.href = "#sourceDossierContext";
    link.textContent = "MOVIE + TOPIC CONTEXT";
    nav.insertBefore(link, nav.firstChild);
  }

  function mountContext() {
    scheduled = false;
    var modal = document.getElementById("tapeModal");
    if (!modal || !modal.classList.contains("show")) return;
    var wiki = modal.querySelector(".source-dossier-show-wiki");
    if (!wiki || wiki.querySelector("#sourceDossierContext")) return;
    var sourceId = sourceIdFromModal(modal);
    var item = atlas.movies[sourceId];
    var show = atlas.recentShows[sourceId];
    if (!item && !show) return;
    var holder = document.createElement("div");
    holder.innerHTML = item ? movieMarkup(sourceId,item) : recentMarkup(sourceId,show);
    var section = holder.firstElementChild;
    var recap = wiki.querySelector(".source-dossier-wiki-recap");
    if (recap) recap.insertAdjacentElement("afterend",section);
    else wiki.appendChild(section);
    wiki.dataset.contextMounted = sourceId;
    addExploreLink(modal);
  }

  function scheduleMount() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(mountContext);
  }

  document.addEventListener("click", function (event) {
    var anchor = event.target.closest('#tapeModal .source-dossier-explore a[href^="#"], #tapeModal .source-dossier-wiki-local-nav a[href^="#"]');
    if (!anchor) return;
    var modal = document.getElementById("tapeModal");
    var target = modal && modal.querySelector(anchor.getAttribute("href"));
    if (!modal || !target) return;
    event.preventDefault();
    var modalRect = modal.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    modal.scrollTo({top:Math.max(0,modal.scrollTop + targetRect.top - modalRect.top - 82),behavior:"smooth"});
  });

  var observer = new MutationObserver(scheduleMount);
  function boot() {
    var modal = document.getElementById("tapeModal");
    if (!modal) return;
    observer.observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
    scheduleMount();
    var attempts = 0;
    var retry = window.setInterval(function () {
      attempts += 1;
      scheduleMount();
      if (document.getElementById("sourceDossierContext") || attempts >= 24) window.clearInterval(retry);
    }, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
