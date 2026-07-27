(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var PLAY_EVENT = "wwam:halloween-play";
  var LANE_ID = "straight-to-steves-asshole";
  var cache = null;

  function array(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value.length === "number") {
      return Array.prototype.slice.call(value);
    }
    return [];
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function numberOrNull(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function esc(value) {
    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return clean(value).toLowerCase();
  }

  function timecode(value) {
    var total = Math.max(0, Math.floor(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") :
      String(minutes)) + ":" + String(seconds).padStart(2, "0");
  }

  function youtubeId(value) {
    var id = clean(value);
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  }

  function sourceUrl(sourceId, at) {
    var id = youtubeId(sourceId);
    if (!id) return "";
    var url = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
    if (Number.isFinite(Number(at))) {
      url += "&t=" + Math.max(0, Math.floor(Number(at))) + "s";
    }
    return url;
  }

  function routeFor(item) {
    var id = youtubeId(item && item.sourceId);
    if (!id) return "#archive";
    var at = Math.max(0, Math.floor(Number(item.at) || 0));
    return "?source=" + encodeURIComponent(id) + "&at=" + at +
      "&section=wiki#archive";
  }

  function thumbnailFor(source) {
    var id = youtubeId(source && source.id);
    var supplied = clean(source && source.thumbnail);
    if (/^https:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{11}\//.test(supplied)) {
      return supplied;
    }
    return id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "";
  }

  function sourceType(source) {
    var lanes = array(source && source.lanes);
    if (lanes.indexOf("commentary-catalog") >= 0) return "commentary";
    var format = clean(source && source.showWiki && source.showWiki.format &&
      source.showWiki.format.id);
    if (format === "movie-commentary") return "commentary";
    return "livestream";
  }

  function evidenceLabel(receipt) {
    var state = clean(receipt && receipt.reviewState);
    if (/quarantined/i.test(state)) return "NEEDS A HUMAN LISTEN";
    if (/machine/i.test(state)) return "CHECK THE TAPE";
    return "ARCHIVE FIND";
  }

  function inventory(payload) {
    var sources = array(payload && payload.sources);
    var items = [];
    var seen = Object.create(null);

    sources.forEach(function (source) {
      var sourceId = youtubeId(source && source.id);
      if (!sourceId) return;
      var lanes = array(source.showWiki && source.showWiki.lanes);
      var lane = lanes.find(function (candidate) {
        return clean(candidate && candidate.id) === LANE_ID;
      });
      if (!lane) return;

      var receiptMap = Object.create(null);
      array(source.receipts).forEach(function (receipt) {
        var key = clean(receipt && receipt.key);
        if (key && !receiptMap[key]) receiptMap[key] = receipt;
      });

      array(lane.receiptKeys).forEach(function (key, index) {
        var receipt = receiptMap[clean(key)];
        var at = numberOrNull(receipt && receipt.at);
        if (!receipt || at == null || at < 0) return;
        if (receipt.publicExcerptAllowed === false) return;
        if (/quarantined/i.test(clean(receipt.reviewState))) return;
        var label = clean(receipt.label);
        if (label !== "FRANCHISE FELONY" && label !== "TAKE GETS NUCLEAR") {
          return;
        }
        var identity = sourceId + "@" + at + ":" + clean(receipt.key);
        if (seen[identity]) return;
        seen[identity] = true;

        var end = numberOrNull(receipt.end);
        if (end == null || end <= at) end = null;
        var score = numberOrNull(receipt.signalScore);
        if (score != null) score = Math.max(0, Math.min(100, score));
        var date = clean(source.date);
        var type = sourceType(source);
        var title = clean(source.displayTitle || source.title) ||
          "OFFICIAL WWAM SOURCE";

        items.push({
          id: identity,
          key: clean(receipt.key),
          sourceId: sourceId,
          title: title,
          date: date,
          year: /^\d{4}/.test(date) ? date.slice(0, 4) : "",
          sourceType: type,
          at: at,
          end: end,
          timecode: timecode(at),
          label: "STRAIGHT TO STEVE'S ASSHOLE",
          originalLabel: label,
          excerpt: clean(receipt.excerpt),
          evidenceLevel: clean(receipt.evidenceLevel) || "machine",
          reviewState: clean(receipt.reviewState) || "machine-surfaced",
          evidenceLabel: evidenceLabel(receipt),
          speakerStatus: "not-diarized",
          score: score,
          signalBasis: clean(receipt.signalBasis),
          thumbnail: thumbnailFor(source),
          sourceUrl: sourceUrl(sourceId, at),
          route: "",
          order: index,
        });
      });
    });

    items.forEach(function (item) {
      item.route = routeFor(item);
    });
    items.sort(function (left, right) {
      var date = right.date.localeCompare(left.date);
      if (date) return date;
      if (right.score !== left.score) return Number(right.score || 0) -
        Number(left.score || 0);
      return left.at - right.at;
    });

    var sourceIds = Object.create(null);
    var commentary = 0;
    var livestream = 0;
    items.forEach(function (item) {
      sourceIds[item.sourceId] = true;
      if (item.sourceType === "commentary") commentary += 1;
      else livestream += 1;
    });
    return {
      schema: "wwam-straight-to-steve/v1",
      evidenceBoundary: "Strict source-local negative-language candidates from official WWAM uploads. Automatic captions do not establish speaker identity, intent, or creator certification.",
      items: items,
      metrics: {
        candidates: items.length,
        sources: Object.keys(sourceIds).length,
        commentaryCandidates: commentary,
        livestreamCandidates: livestream,
      },
    };
  }

  function buildPayloadFromGlobals(scope) {
    scope = scope || root;
    if (cache) return cache;
    if (!scope.WWAMSourceDossierAdapter ||
        !scope.WWAMShowcaseEngine ||
        !scope.WWAMCreatorClipLab ||
        !scope.WWAMArchiveDeepPortfolio ||
        !scope.WWAMArchiveDeepEngine) {
      throw new Error("STRAIGHT_TO_STEVE_RUNTIME_UNAVAILABLE");
    }

    var showcase = scope.WWAMShowcaseEngine.create({
      catalog: scope.WWAM_CATALOG,
      deep: scope.WWAM_DEEP_DISTILL,
      live: scope.WWAM_LIVESTREAMS,
      popular: scope.WWAM_POPULAR_LIVE,
      characters: scope.WWAM_CHARACTER_LORE,
      dna: scope.WWAM_CHANNEL_DNA,
    });
    var clipLab = scope.WWAMCreatorClipLab.create({ showcase: showcase });
    var portfolio = scope.WWAMArchiveDeepPortfolio.create([
      scope.WWAM_ARCHIVE_DEEP,
      scope.WWAM_ARCHIVE_DEEP_BATCH2,
      scope.WWAM_ARCHIVE_DEEP_BATCH3,
      scope.WWAM_ARCHIVE_DEEP_BATCH4,
    ].filter(Boolean), scope.WWAMArchiveDeepEngine);
    var base = portfolio.getSearchPayload();
    var year = scope.WWAM_YEAR_CANON_2025_2026 || {};
    var archiveSearch = Object.assign({}, base, {
      streams: array(base.streams).concat(array(year.streams)),
      topicIndex: array(base.topicIndex).concat(array(year.topicIndex)),
      characterIndex: array(base.characterIndex).concat(array(year.characterIndex)),
    });
    var archiveDeepPortfolio = {
      getSearchPayload: function () {
        return archiveSearch;
      },
    };

    cache = scope.WWAMSourceDossierAdapter.build({
      atlas: scope.WWAM_ARCHIVE_ATLAS,
      catalog: scope.WWAM_CATALOG,
      deep: scope.WWAM_DEEP_DISTILL,
      live: scope.WWAM_LIVESTREAMS,
      popular: scope.WWAM_POPULAR_LIVE,
      archiveDeepPortfolio: archiveDeepPortfolio,
      showcase: showcase,
      clipLab: clipLab,
      characters: scope.WWAM_CHARACTER_LORE,
      dna: scope.WWAM_CHANNEL_DNA,
      channel: {
        id: "wwam",
        label: "We Watched A Movie",
        product: "WWAM After Midnight",
        packFingerprint: "straight-to-steve:" + VERSION,
      },
    });
    return cache;
  }

  function filterItems(dataset, state) {
    var query = normalize(state && state.query);
    var type = clean(state && state.type) || "all";
    var sort = clean(state && state.sort) || "newest";
    var output = array(dataset && dataset.items).filter(function (item) {
      if (type === "commentary" && item.sourceType !== "commentary") return false;
      if (type === "livestream" && item.sourceType !== "livestream") return false;
      if (type === "2026" && item.year !== "2026") return false;
      if (type === "classic" && Number(item.year || 9999) > 2022) return false;
      if (!query) return true;
      return normalize([
        item.title,
        item.date,
        item.year,
        item.excerpt,
        item.originalLabel,
        item.sourceId,
      ].join(" ")).indexOf(query) >= 0;
    });

    output.sort(function (left, right) {
      if (sort === "hottest") {
        var heat = Number(right.score || 0) - Number(left.score || 0);
        if (heat) return heat;
      } else if (sort === "oldest") {
        var oldDate = left.date.localeCompare(right.date);
        if (oldDate) return oldDate;
      } else {
        var newDate = right.date.localeCompare(left.date);
        if (newDate) return newDate;
      }
      return left.at - right.at;
    });
    return output;
  }

  function cardMarkup(item) {
    var score = item.score == null ? "CLIP" : "HEAT " + Math.round(item.score);
    var excerpt = item.excerpt ?
      "<blockquote>&ldquo;" + esc(item.excerpt) + "&rdquo;</blockquote>" :
      '<p class="steve-card-withheld">PLAY THE CLIP TO HEAR THIS ONE IN CONTEXT.</p>';
    return '<article class="steve-card" data-steve-record="' + esc(item.id) + '">' +
      '<a class="steve-card-image" href="' + esc(item.route) +
      '" aria-label="Open the full Show Wiki for ' + esc(item.title) + '">' +
      '<img src="' + esc(item.thumbnail) + '" alt="" loading="lazy" decoding="async">' +
      '<span>' + esc(item.timecode) + '</span><b>' + esc(String(score)) +
      '</b></a><div class="steve-card-body"><header><span>' +
      esc(item.sourceType.toUpperCase()) + ' // ' + esc(item.date || "DATE UNKNOWN") +
      '</span><h3>' + esc(item.title) + '</h3></header>' + excerpt +
      '<div class="steve-proof"><span>' + esc(item.originalLabel) +
      '</span><span>' + esc(item.evidenceLabel) +
      '</span></div><footer>' +
      '<button type="button" data-steve-play="' + esc(item.id) +
      '">&#9654; PLAY THE CLIP</button><a href="' + esc(item.route) +
      '">OPEN SHOW WIKI &#8599;</a></footer></div></article>';
  }

  function resultsMarkup(items) {
    if (!items.length) {
      return '<div class="steve-empty"><span>NOTHING IN THIS PART OF THE CHUTE</span>' +
        '<h3>TRY ANOTHER MOVIE, SHOW, OR YEAR.</h3>' +
        '<p>No fake filler. If the tape is not there, it is not there.</p></div>';
    }
    return items.map(cardMarkup).join("");
  }

  function shellMarkup(dataset, state) {
    var metrics = dataset.metrics;
    return '<section class="steve-experience" aria-labelledby="steveExperienceTitle">' +
      '<header class="steve-hero"><div><p>THE WWAM REJECTION CHUTE // THE STUFF THEY HATED</p>' +
      '<h2 id="steveExperienceTitle">STRAIGHT TO<br><em>STEVE&#39;S ASSHOLE.</em></h2></div>' +
      '<aside><b>WHAT THE HELL IS THIS?</b><p>A bad mask. A rotten twist. A franchise decision nobody can defend. ' +
      'If the take earns a one-way ticket, it lands here.</p></aside></header>' +
      '<div class="steve-boundary"><b>PLAY IT BEFORE YOU QUOTE IT.</b>' +
      '<p>These clips come from official WWAM uploads. Auto-captions can mishear names and cannot identify the speaker, ' +
      'so the original tape always gets the last word.</p></div>' +
      '<div class="steve-metrics"><div><strong>' + esc(metrics.candidates) +
      '</strong><span>CLIPS IN THE CHUTE</span></div><div><strong>' +
      esc(metrics.sources) + '</strong><span>SHOWS</span></div><div><strong>' +
      esc(metrics.commentaryCandidates) + '</strong><span>WATCHALONG CLIPS</span></div><div><strong>' +
      esc(metrics.livestreamCandidates) + '</strong><span>LIVESTREAM CLIPS</span></div></div>' +
      '<div class="steve-controls"><label><span>SEARCH THE REJECTION CHUTE</span>' +
      '<input type="search" data-steve-search value="' + esc(state.query) +
      '" placeholder="Halloween, mask, reveal, movie title..." autocomplete="off"></label>' +
      '<div class="steve-filter-bank" role="group" aria-label="Filter rejection candidates">' +
      [["all", "ALL"], ["commentary", "COMMENTARIES"], ["livestream", "LIVESTREAMS"],
        ["2026", "2026"], ["classic", "CLASSIC"]].map(function (pair) {
        return '<button type="button" data-steve-filter="' + pair[0] +
          '" aria-pressed="' + (state.type === pair[0] ? "true" : "false") +
          '">' + pair[1] + '</button>';
      }).join("") + '</div><label class="steve-sort"><span>SORT</span><select data-steve-sort>' +
      [["newest", "NEWEST FIRST"], ["hottest", "MOST HEATED FIRST"],
        ["oldest", "OLDEST FIRST"]].map(function (pair) {
        return '<option value="' + pair[0] + '"' +
          (state.sort === pair[0] ? " selected" : "") + '>' + pair[1] + '</option>';
      }).join("") + '</select></label></div>' +
      '<div class="steve-results-header"><p data-steve-count aria-live="polite"></p>' +
      '<span>PLAY THE CLIP // OPEN THE FULL SHOW</span></div>' +
      '<div class="steve-grid" data-steve-results></div></section>';
  }

  function playDetail(item) {
    return {
      sourceId: item.sourceId,
      start: item.at,
      end: item.end,
      label: item.label + " // " + item.title,
      receiptKey: item.key,
      origin: LANE_ID,
    };
  }

  function dispatchPlayback(documentRef, item, options) {
    var detail = playDetail(item);
    if (options && typeof options.onPlay === "function") {
      options.onPlay(detail);
    }
    var view = documentRef && documentRef.defaultView;
    var EventConstructor = view && view.CustomEvent || root.CustomEvent;
    if (documentRef && typeof documentRef.dispatchEvent === "function" &&
        typeof EventConstructor === "function") {
      documentRef.dispatchEvent(new EventConstructor(PLAY_EVENT, { detail: detail }));
      return true;
    }
    return false;
  }

  function mount(node, options) {
    options = options || {};
    if (!node || typeof node.addEventListener !== "function") {
      throw new Error("STRAIGHT_TO_STEVE_MOUNT_REQUIRED");
    }
    var payload = options.payload || buildPayloadFromGlobals(options.root || root);
    var dataset = inventory(payload);
    var state = {
      query: "",
      type: "all",
      sort: "hottest",
    };
    var byId = Object.create(null);
    dataset.items.forEach(function (item) {
      byId[item.id] = item;
    });

    node.innerHTML = shellMarkup(dataset, state);
    var documentRef = node.ownerDocument || root.document;

    function paint() {
      var shown = filterItems(dataset, state);
      var resultNode = node.querySelector("[data-steve-results]");
      var countNode = node.querySelector("[data-steve-count]");
      if (resultNode) resultNode.innerHTML = resultsMarkup(shown);
      if (countNode) {
        countNode.textContent = shown.length + " OF " + dataset.metrics.candidates +
          " CLIPS";
      }
      array(node.querySelectorAll("[data-steve-filter]")).forEach(function (button) {
        button.setAttribute("aria-pressed",
          button.getAttribute("data-steve-filter") === state.type ? "true" : "false");
      });
    }

    function onInput(event) {
      if (event.target && event.target.hasAttribute("data-steve-search")) {
        state.query = clean(event.target.value);
        paint();
      }
    }

    function onChange(event) {
      if (event.target && event.target.hasAttribute("data-steve-sort")) {
        state.sort = clean(event.target.value) || "newest";
        paint();
      }
    }

    function onClick(event) {
      var filter = event.target && event.target.closest &&
        event.target.closest("[data-steve-filter]");
      if (filter) {
        state.type = clean(filter.getAttribute("data-steve-filter")) || "all";
        paint();
        return;
      }
      var play = event.target && event.target.closest &&
        event.target.closest("[data-steve-play]");
      if (play) {
        var item = byId[clean(play.getAttribute("data-steve-play"))];
        if (item) dispatchPlayback(documentRef, item, options);
      }
    }

    node.addEventListener("input", onInput);
    node.addEventListener("change", onChange);
    node.addEventListener("click", onClick);
    node.setAttribute("data-steves-asshole-ready", "true");
    var section = node.closest && node.closest("[aria-busy]");
    if (section) section.setAttribute("aria-busy", "false");
    paint();

    return {
      dataset: dataset,
      getState: function () {
        return Object.assign({}, state);
      },
      destroy: function () {
        node.removeEventListener("input", onInput);
        node.removeEventListener("change", onChange);
        node.removeEventListener("click", onClick);
        node.removeAttribute("data-steves-asshole-ready");
      },
    };
  }

  function renderHeld(node, error) {
    node.innerHTML = "<div class=\"steve-empty\"><span>STEVE'S CHUTE IS STUCK</span>" +
      '<h3>THE CLIPS DID NOT LOAD.</h3>' +
      '<p>The rest of the archive still works. Try this room again.</p>' +
      '<button type="button" data-steve-retry>TRY AGAIN</button></div>';
    node.setAttribute("data-steves-asshole-error",
      clean(error && error.message) || "runtime-unavailable");
    var retry = node.querySelector("[data-steve-retry]");
    if (retry) retry.onclick = function () {
      node.removeAttribute("data-steves-asshole-error");
      mountWhenReady(node);
    };
  }

  function mountWhenReady(node) {
    if (!node || node.getAttribute("data-steves-asshole-ready") === "true") {
      return Promise.resolve(true);
    }
    try {
      mount(node);
      return Promise.resolve(true);
    } catch (error) {
      var access = root.WWAMSourceDossierAccess;
      if (clean(error && error.message) === "STRAIGHT_TO_STEVE_RUNTIME_UNAVAILABLE" &&
          access && typeof access.load === "function") {
        node.innerHTML = '<div class="steve-empty steve-loading" role="status" aria-live="polite">' +
          '<span>OPENING THE REJECTION CHUTE</span><h3>FINDING THE CLIPS.</h3>' +
          '<p>Loading the WWAM show maps once. The good stuff is next.</p></div>';
        return access.load().then(function () {
          cache = null;
          mount(node);
          return true;
        }).catch(function (loadError) {
          renderHeld(node, loadError);
          return false;
        });
      }
      renderHeld(node, error);
      return Promise.resolve(false);
    }
  }

  function autoMount() {
    if (!root.document || typeof root.document.querySelectorAll !== "function") return;
    array(root.document.querySelectorAll(
      "#stevesAssholeMount, [data-steves-asshole-mount]"
    )).forEach(function (node) {
      mountWhenReady(node);
    });
  }

  root.WWAMStraightToSteve = Object.freeze({
    VERSION: VERSION,
    PLAY_EVENT: PLAY_EVENT,
    LANE_ID: LANE_ID,
    inventory: inventory,
    buildPayloadFromGlobals: buildPayloadFromGlobals,
    filterItems: filterItems,
    render: function (dataset, state) {
      state = Object.assign({ query: "", type: "all", sort: "hottest" }, state || {});
      return shellMarkup(dataset, state).replace(
        '<div class="steve-grid" data-steve-results></div>',
        '<div class="steve-grid" data-steve-results>' +
          resultsMarkup(filterItems(dataset, state)) + '</div>'
      );
    },
    routeFor: routeFor,
    playDetail: playDetail,
    dispatchPlayback: dispatchPlayback,
    mount: mount,
    mountWhenReady: mountWhenReady,
    autoMount: autoMount,
  });

  if (root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", autoMount);
    } else {
      autoMount();
    }
  }
})(typeof window !== "undefined" ? window : this);
