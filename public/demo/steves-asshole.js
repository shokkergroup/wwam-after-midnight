(function (root) {
  "use strict";

  var VERSION = "1.3.0";
  var PLAY_EVENT = "wwam:halloween-play";
  var LANE_ID = "straight-to-steves-asshole";
  var GUIDE_ERROR_CODE = "EPISODE_GUIDE_COUNT_INVALID";
  var cache = null;
  var EDITOR_NOTES = Object.freeze({
    "rLXnU3Rsj-4@1145":
      "The junkyard talk turns into a blunt rejection of this Dream Master franchise turn.",
    "c15otfZ8HkU@3918":
      "Neil's scene gets rejected hard, with John Saxon invoked in the same breath.",
    "jG93HvyP420@12774":
      "Showing Michael without the mask is the Halloween Ends choice this clip cannot forgive.",
    "AtcRT3Xkk6E@1327":
      "The Halloween 5 mask takes the hit here, dismissed as terrible on the tape.",
    "YaE7bkZ2JAM@8475":
      "The remake-tier takedown singles out both the writing and the pacing.",
    "jLIfEdg8Oc0@374":
      "One Scream 3 sound effect earns an immediate apology and an awful verdict.",
    "Q6SN-Om1gIo@4387":
      "H20's so-called alien mask comparison sends the design down the chute.",
    "kX3wb5pBRDo@5635":
      "The franchise-ranking discussion turns into a blunt rejection of the whole movie.",
    "hQu1Y1GZozI@5660":
      "The Scream twist takes the beating while Jack Quaid's acting is spared.",
    "2en5C2sNAN8@5251":
      "This tier-list verdict skips the fine print and rejects the movie itself.",
    "G2m0effDrwI@470":
      "The Jason Takes Manhattan commentary reaches for its harshest possible verdict.",
    "28PfRNKoSCA@980":
      "A bus-scene complaint is what gets singled out in this Halloween 4 clip.",
    "M2iupVAFWt8@3664":
      "The role gets a quick nod; the movie immediately gets the opposite verdict.",
    "N-UahfG8-gM@5227":
      "The live-show warning is unambiguous: the reveal is what sends this one down the chute.",
  });

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

  function reducedLanguage(documentRef) {
    return Boolean(documentRef && documentRef.body &&
      documentRef.body.classList &&
      documentRef.body.classList.contains("office-bleep"));
  }

  function displayText(value, documentRef) {
    var text = clean(value);
    if (!reducedLanguage(documentRef)) return text;
    return text.replace(
      /\b(fuck\w*|shit\w*|bitch\w*|asshole\w*|ass|dick\w*|motherfucker\w*|goddamn\w*)\b/gi,
      "••••"
    );
  }

  function observeLanguage(documentRef, onChange, ObserverConstructor) {
    var body = documentRef && documentRef.body;
    var Observer = ObserverConstructor ||
      documentRef && documentRef.defaultView &&
        documentRef.defaultView.MutationObserver ||
      root.MutationObserver;
    if (!body || typeof Observer !== "function" ||
        typeof onChange !== "function") return null;
    var previous = reducedLanguage(documentRef);
    var observer = new Observer(function () {
      var current = reducedLanguage(documentRef);
      if (current === previous) return;
      previous = current;
      onChange(current);
    });
    observer.observe(body, { attributes: true, attributeFilter: ["class"] });
    return observer;
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

  function editorNote(item) {
    var noteKey = youtubeId(item && item.sourceId) + "@" +
      Math.max(0, Math.floor(Number(item && item.at) || 0));
    if (EDITOR_NOTES[noteKey]) return EDITOR_NOTES[noteKey];

    var excerpt = normalize(item && item.excerpt);
    var title = clean(item && item.title) || "this show";
    if (excerpt.indexOf("mask") >= 0) {
      return "The mask is the specific " + title + " choice that lands in the chute.";
    }
    if (excerpt.indexOf("reveal") >= 0 || excerpt.indexOf("twist") >= 0) {
      return "The reveal is the " + title + " choice taking the hit in this clip.";
    }
    if (excerpt.indexOf("pacing") >= 0 || excerpt.indexOf("writing") >= 0) {
      return "The complaint in " + title + " lands on the writing and pacing.";
    }
    if (excerpt.indexOf("sound effect") >= 0) {
      return "A sound effect is what sends this " + title + " moment down the chute.";
    }
    if (clean(item && item.originalLabel) === "FRANCHISE FELONY") {
      return "This " + title + " clip puts one franchise choice in the rejection chute.";
    }
    return "This " + title + " clip turns one specific complaint into a full rejection.";
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
      item.editorNote = editorNote(item);
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
      evidenceBoundary: "Every clip comes from an official WWAM upload and keeps its exact timestamp. The rough transcript can mishear words or mix up who is talking.",
      inventoryStatus: payload && payload.steveInventoryStatus || {
        state: "complete",
        message: "",
      },
      items: items,
      metrics: {
        candidates: items.length,
        sources: Object.keys(sourceIds).length,
        commentaryCandidates: commentary,
        livestreamCandidates: livestream,
      },
    };
  }

  function guideRegistryStatus(scope) {
    scope = scope || root;
    var deep = scope.WWAM_DEEP_DISTILL || {};
    var episodeGuides = scope.WWAM_EPISODE_GUIDES || {};
    var expected = Math.max(0, Math.floor(Number(
      deep.meta && deep.meta.episodeGuides
    ) || 0));
    var available = array(episodeGuides.guides).length;
    return {
      expected: expected,
      available: available,
      complete: !expected || available === expected,
    };
  }

  function isGuideRegistryError(error) {
    return clean(error && error.code) === GUIDE_ERROR_CODE ||
      /Episode Guide V2 registry is incomplete/i.test(
        clean(error && error.message)
      );
  }

  function payloadFromDossierEngine(scope) {
    var access = scope && scope.WWAMSourceDossierAccess;
    var engine = access && typeof access.get === "function" && access.get();
    if (!engine || typeof engine.list !== "function" ||
        typeof engine.build !== "function") return null;
    var records = array(engine.list());
    var sources = [];
    var failed = false;
    records.forEach(function (record) {
      try {
        var dossier = engine.build(record && record.id);
        if (!dossier || !dossier.source) failed = true;
        else sources.push(dossier.source);
      } catch (_error) {
        failed = true;
      }
    });
    if (failed || !sources.length || sources.length !== records.length) return null;
    return {
      schema: "shokker-source-dossier-input/v1",
      sources: sources,
      steveInventoryStatus: {
        state: "canonical-engine",
        message: "Using the canonical Show Wiki receipt registry.",
      },
    };
  }

  function guideLagDeep(deep, available) {
    return Object.assign({}, deep || {}, {
      meta: Object.assign({}, deep && deep.meta || {}, {
        episodeGuides: Math.max(0, Math.floor(Number(available) || 0)),
      }),
    });
  }

  function buildPayloadFromGlobals(scope) {
    scope = scope || root;
    var guideState = guideRegistryStatus(scope);
    if (cache) {
      var cachedState = cache.steveInventoryStatus &&
        cache.steveInventoryStatus.state;
      if (cachedState !== "guide-overlay-lag" || !guideState.complete) {
        return cache;
      }
      cache = null;
    }

    var enginePayload = payloadFromDossierEngine(scope);
    if (enginePayload) {
      cache = enginePayload;
      return cache;
    }

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

    var adapterInput = {
      atlas: scope.WWAM_ARCHIVE_ATLAS,
      catalog: scope.WWAM_CATALOG,
      deep: scope.WWAM_DEEP_DISTILL,
      episodeGuides: scope.WWAM_EPISODE_GUIDES || { guides: [] },
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
    };
    try {
      cache = scope.WWAMSourceDossierAdapter.build(adapterInput);
    } catch (error) {
      if (!isGuideRegistryError(error)) throw error;
      cache = Object.assign({}, scope.WWAMSourceDossierAdapter.build(
        Object.assign({}, adapterInput, {
          deep: guideLagDeep(
            scope.WWAM_DEEP_DISTILL,
            guideState.available
          ),
        })
      ), {
        steveInventoryStatus: {
          state: "guide-overlay-lag",
          expectedGuides: guideState.expected,
          availableGuides: guideState.available,
          message: "The episode chapter shelf is still syncing. These clips come from canonical source receipts and keep their exact tape stamps.",
        },
      });
    }
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

  function cardMarkup(item, documentRef) {
    var caption = item.excerpt ?
      '<details class="steve-caption-preview"><summary>ROUGH TRANSCRIPT</summary>' +
      "<blockquote>&ldquo;" + esc(displayText(item.excerpt, documentRef)) +
      "&rdquo;</blockquote>" +
      '<small>TRANSCRIPT MAY MISS A WORD // PLAY THE CLIP FOR FULL CONTEXT</small></details>' :
      '<p class="steve-card-withheld">PLAY THE CLIP TO HEAR THIS ONE IN CONTEXT.</p>';
    return '<article class="steve-card" data-steve-record="' + esc(item.id) + '">' +
      '<a class="steve-card-image" href="' + esc(item.route) +
      '" aria-label="Open the full Show Wiki for ' +
      esc(displayText(item.title, documentRef)) + '">' +
      '<img src="' + esc(item.thumbnail) + '" alt="" loading="lazy" decoding="async">' +
      '<span>' + esc(item.timecode) +
      '</span></a><div class="steve-card-body"><header><span>' +
      esc(item.sourceType.toUpperCase()) + ' // ' + esc(item.date || "DATE UNKNOWN") +
      '</span><h3>' + esc(displayText(item.title, documentRef)) + '</h3></header>' +
      '<div class="steve-receipt-strip"><span>OFFICIAL WWAM TAPE</span><b>EXACT STOP ' +
      esc(item.timecode) + '</b></div>' +
      '<div class="steve-flush-deck"><div><span>WHY IT GOT FLUSHED</span><b>' +
      esc(displayText(item.originalLabel, documentRef)) + '</b></div><p>' +
      esc(displayText(item.editorNote || editorNote(item), documentRef)) +
      '</p></div>' + caption + '<footer>' +
      '<button type="button" data-steve-play="' + esc(item.id) +
      '">&#9654; PLAY THE CLIP</button><a href="' + esc(item.route) +
      '">OPEN SHOW WIKI &#8599;</a></footer></div></article>';
  }

  function resultsMarkup(items, documentRef) {
    if (!items.length) {
      return '<div class="steve-empty"><span>NOTHING IN THIS PART OF THE CHUTE</span>' +
        '<h3>TRY ANOTHER MOVIE, SHOW, OR YEAR.</h3>' +
        '<p>No filler clips. If the tape is not here, try another shelf.</p></div>';
    }
    return items.map(function (item) {
      return cardMarkup(item, documentRef);
    }).join("");
  }

  function shellMarkup(dataset, state, documentRef) {
    var metrics = dataset.metrics;
    var inventoryStatus = dataset.inventoryStatus || {};
    var syncNotice = inventoryStatus.state === "guide-overlay-lag" ?
      '<div class="steve-sync-notice" role="status"><b>THE CHUTE IS OPEN. THE GUIDE SHELF IS CATCHING UP.</b>' +
      '<p>The playable rejections below still come from canonical WWAM show receipts with exact timestamps. ' +
      'Only the episode chapter overlay is temporarily behind.</p></div>' : "";
    return '<section class="steve-experience" aria-labelledby="steveExperienceTitle">' +
      '<header class="steve-hero"><div><p>THE WWAM REJECTION CHUTE // THE STUFF THEY HATED</p>' +
      '<h2 id="steveExperienceTitle">' + esc(displayText("STRAIGHT TO", documentRef)) +
      '<br><em>' + esc(displayText("STEVE\'S ASSHOLE.", documentRef)) + '</em></h2></div>' +
      '<aside><b>WHAT THE HELL IS THIS?</b><p>A bad mask. A rotten twist. A franchise decision nobody can defend. ' +
      'If the take earns a one-way ticket, it lands here.</p></aside></header>' +
      '<div class="steve-boundary"><b>PLAY IT BEFORE YOU QUOTE IT.</b>' +
      '<p>These clips come from official WWAM uploads. The rough transcript can mishear names and cannot identify the speaker, ' +
      'so the original tape always gets the last word.</p></div>' + syncNotice +
      '<div class="steve-metrics"><div><strong>' + esc(metrics.candidates) +
      '</strong><span>CLIPS IN THE CHUTE</span></div><div><strong>' +
      esc(metrics.sources) + '</strong><span>SHOWS</span></div><div><strong>' +
      esc(metrics.commentaryCandidates) + '</strong><span>WATCHALONG CLIPS</span></div><div><strong>' +
      esc(metrics.livestreamCandidates) + '</strong><span>LIVESTREAM CLIPS</span></div></div>' +
      '<div class="steve-controls"><label><span>SEARCH THE REJECTION CHUTE</span>' +
      '<input type="search" data-steve-search value="' + esc(state.query) +
      '" placeholder="Halloween, mask, reveal, movie title..." autocomplete="off"></label>' +
      '<div class="steve-filter-bank" role="group" aria-label="' +
      esc(displayText("Filter clips in Steve\'s Asshole", documentRef)) + '">' +
      [["all", "ALL"], ["commentary", "COMMENTARIES"], ["livestream", "LIVESTREAMS"],
        ["2026", "2026"], ["classic", "CLASSIC"]].map(function (pair) {
        return '<button type="button" data-steve-filter="' + pair[0] +
          '" aria-pressed="' + (state.type === pair[0] ? "true" : "false") +
          '">' + pair[1] + '</button>';
      }).join("") + '</div><label class="steve-sort"><span>SORT</span><select data-steve-sort>' +
      [["newest", "NEWEST FIRST"], ["hottest", "BIGGEST REJECTIONS FIRST"],
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

    var documentRef = node.ownerDocument || root.document;
    node.innerHTML = shellMarkup(dataset, state, documentRef);
    var bleepObserver = null;

    function paint() {
      var shown = filterItems(dataset, state);
      var resultNode = node.querySelector("[data-steve-results]");
      var countNode = node.querySelector("[data-steve-count]");
      if (resultNode) resultNode.innerHTML = resultsMarkup(shown, documentRef);
      if (countNode) {
        countNode.textContent = shown.length + " OF " + dataset.metrics.candidates +
          " CLIPS";
      }
      array(node.querySelectorAll("[data-steve-filter]")).forEach(function (button) {
        button.setAttribute("aria-pressed",
          button.getAttribute("data-steve-filter") === state.type ? "true" : "false");
      });
    }

    function repaintLanguage() {
      node.innerHTML = shellMarkup(dataset, state, documentRef);
      paint();
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
    bleepObserver = observeLanguage(documentRef, repaintLanguage,
      options.MutationObserver);
    node.setAttribute("data-steves-asshole-ready", "true");
    node.setAttribute("data-steves-asshole-inventory-state",
      clean(dataset.inventoryStatus && dataset.inventoryStatus.state) || "complete");
    node.removeAttribute("data-steves-asshole-error");
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
        if (bleepObserver) bleepObserver.disconnect();
        node.removeAttribute("data-steves-asshole-ready");
        node.removeAttribute("data-steves-asshole-inventory-state");
      },
    };
  }

  function heldMarkup(error) {
    if (isGuideRegistryError(error)) {
      return "<div class=\"steve-empty\"><span>THE TAPE ROOM IS STILL SYNCING</span>" +
        '<h3>NO RECEIPT, NO REJECTION.</h3>' +
        '<p>Steve will not invent a hated moment while the canonical show receipts are unavailable. ' +
        'The rest of the archive still works; try this room again when the guide shelf catches up.</p>' +
        '<button type="button" data-steve-retry>TRY AGAIN</button></div>';
    }
    return "<div class=\"steve-empty\"><span>STEVE'S CHUTE IS STUCK</span>" +
      '<h3>THE CLIPS DID NOT LOAD.</h3>' +
      '<p>The rest of the archive still works. Try this room again.</p>' +
      '<button type="button" data-steve-retry>TRY AGAIN</button></div>';
  }

  function renderHeld(node, error) {
    node.innerHTML = heldMarkup(error);
    node.setAttribute("data-steves-asshole-error",
      clean(error && error.message) || "runtime-unavailable");
    var section = node.closest && node.closest("[aria-busy]");
    if (section) section.setAttribute("aria-busy", "false");
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
          cache = null;
          try {
            mount(node);
            return true;
          } catch (fallbackError) {
            renderHeld(node, isGuideRegistryError(loadError) ?
              loadError : fallbackError);
            return false;
          }
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
    guideRegistryStatus: guideRegistryStatus,
    isGuideRegistryError: isGuideRegistryError,
    payloadFromDossierEngine: payloadFromDossierEngine,
    heldMarkup: heldMarkup,
    resetCache: function () {
      cache = null;
    },
    filterItems: filterItems,
    render: function (dataset, state, documentRef) {
      state = Object.assign({ query: "", type: "all", sort: "hottest" }, state || {});
      documentRef = documentRef || root.document;
      return shellMarkup(dataset, state, documentRef).replace(
        '<div class="steve-grid" data-steve-results></div>',
        '<div class="steve-grid" data-steve-results>' +
          resultsMarkup(filterItems(dataset, state), documentRef) + '</div>'
      );
    },
    displayText: displayText,
    observeLanguage: observeLanguage,
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
