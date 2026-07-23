(function () {
  "use strict";

  var catalog = window.WWAM_CATALOG || [];
  var deep = window.WWAM_DEEP_DISTILL || { meta: {}, franchises: [], tapes: [], hot100: [] };
  var tapeById = {};
  var itemById = {};
  var state = {
    redBand: localStorage.getItem("wwam-band") !== "bleep",
    hotCategory: "ALL EVIDENCE",
    hotLimit: 12,
    franchise: "ALL",
    vaultQuery: "",
    lab: "Halloween",
    tourSlide: 0,
    consoleIndex: 0,
  };

  deep.tapes.forEach(function (tape) { tapeById[tape.id] = tape; });
  catalog.forEach(function (item) { itemById[item.id] = item; });

  var franchiseOrder = ["Halloween", "Friday the 13th", "Scream", "A Nightmare on Elm Street"];
  var colors = {
    "Halloween": "#ff4a24",
    "Friday the 13th": "#d8ff38",
    "Scream": "#ff397f",
    "A Nightmare on Elm Street": "#55e5ff",
  };
  var categoryCopy = {
    "OUT OF POCKET": "The sentence that gets the group chat subpoenaed.",
    "FRANCHISE FELONY": "Aggravated assault on a movie's reputation.",
    "LOVE LETTER": "Genuine affection, still holding a knife.",
    "THEORY BOARD": "Confidence enters. Future context waits outside.",
    "KILL ROOM": "The body-count vocabulary spikes.",
    "BIT ENERGY": "A callback signal escaped the grave.",
    "BREAKDOWN": "On-mic structural integrity approaches zero.",
    "HORROR BRAIN": "The horror-nerd cortex has the wheel.",
  };
  var tourSlides = [
    {
      number: "01",
      eyebrow: "THE PROBLEM",
      title: "THOUSANDS OF HOURS.<br>NO MEMORY LAYER.",
      body: "YouTube knows what a video is called. It does not know where a bit was born, when a take reversed, which commentary became a fan favorite, or what exact second deserves to live again.",
      proof: "THE BACK CATALOG IS VALUABLE—BUT MOST OF ITS VALUE IS BURIED.",
    },
    {
      number: "02",
      eyebrow: "THE RECEIPT",
      title: "573,383 WORDS<br>WENT UNDER THE KNIFE.",
      body: "This bounded demo audits 38 available caption tracks across 39 commentaries, then turns short evidence fragments into searchable, playable paths back to the original upload.",
      proof: "NO FAKE QUOTES. NO GUESSED SPEAKERS. NO DEAD-END SEARCH RESULTS.",
    },
    {
      number: "03",
      eyebrow: "THE MOAT",
      title: "THE ENGINE REPEATS.<br>THE WEIRDNESS DOESN'T.",
      body: "Every creator gets the same durable evidence machinery. WWAM gets Loomis Logic, the Suspect Board, Dream Logic Court, the Unhinged Index, and a Red Band 100 because those belong to this show.",
      proof: "THE PRODUCT SCALES WITHOUT MAKING THE CREATOR FEEL GENERIC.",
    },
    {
      number: "04",
      eyebrow: "THE MONEY",
      title: "MEMORY CREATES<br>NEW INVENTORY.",
      body: "Premium franchise vaults. Member-only extended receipts. Sponsored lore labs. Annual supercuts. Merch tied to recurring bits. Share cards that drive old-video traffic. The archive creates surfaces without interrupting the show.",
      proof: "DISCOVERY → RETENTION → MEMBERSHIP → MERCH → MORE BACK-CATALOG VIEWS.",
    },
    {
      number: "05",
      eyebrow: "THE ASK",
      title: "LET'S TURN THE<br>WHOLE CHANNEL ON.",
      body: "This is the proof-of-concept slice: four horror franchises, isolated and source-linked. The full product learns the rest of the channel, adds human editorial approval, and becomes the permanent front door to WWAM lore.",
      proof: "THE OPENING KILL IS WORKING. NOW BUILD THE MOVIE.",
    },
  ];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function duration(seconds) {
    if (!seconds) return "TAPE SEALED";
    var total = Math.round(seconds);
    var hours = Math.floor(total / 3600);
    var minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    var secs = String(total % 60).padStart(2, "0");
    return hours + ":" + minutes + ":" + secs;
  }

  function timestamp(seconds) {
    var total = Math.max(0, Math.round(seconds || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = String(total % 60).padStart(2, "0");
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : minutes) + ":" + secs;
  }

  function shortDate(value) {
    if (!value) return "DATE BURIED";
    return new Date(value + "T12:00:00").toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    }).toUpperCase();
  }

  function franchiseSlug(name) {
    var found = deep.franchises.filter(function (item) { return item.name === name; })[0];
    return found ? found.slug : "unknown";
  }

  function displayQuote(value) {
    if (state.redBand) return value;
    return value.replace(/\b(fuck\w*|shit\w*|bitch\w*|asshole\w*|dick\w*|motherfucker\w*|goddamn\w*)\b/gi, "••••");
  }

  function renderProof() {
    var meta = deep.meta;
    document.getElementById("proof").innerHTML = [
      ["TAPES", meta.tapes, "THE BOUNDED CANON"],
      ["WORDS AUDITED", fmt(meta.wordsAudited), "AVAILABLE CAPTIONS"],
      ["HOURS", meta.captionHours, "UNDER THE KNIFE"],
      ["RED BAND", meta.hotMoments, "PLAYABLE RECEIPTS"],
      ["FRANCHISES", meta.franchises, "COMPLETE PATHS"],
    ].map(function (stat) {
      return '<article><span>' + stat[0] + '</span><b>' + stat[1] + '</b><small>' + stat[2] + '</small></article>';
    }).join("");
  }

  function renderMarquee() {
    var items = deep.franchises.map(function (franchise) {
      return '<button data-franchise="' + esc(franchise.name) + '"><b>' + esc(franchise.killer) + '</b><span>' +
        franchise.tapes + ' TAPES // ' + fmt(franchise.wordsAudited) + ' WORDS // ' + franchise.avgUnhinged +
        ' UNHINGED</span></button>';
    });
    document.getElementById("franchiseMarquee").innerHTML = items.concat(items).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#franchiseMarquee button"), function (button) {
      button.onclick = function () {
        setFranchise(button.getAttribute("data-franchise"));
        document.getElementById("autopsies").scrollIntoView({ behavior: "smooth" });
      };
    });
  }

  function renderHeroConsole() {
    var moments = deep.hot100.filter(function (moment) { return moment.rank <= 16; });
    if (!moments.length) return;
    var moment = moments[state.consoleIndex % moments.length];
    var item = itemById[moment.tapeId];
    document.getElementById("heroConsole").innerHTML =
      '<div class="console-rank">#' + String(moment.rank).padStart(3, "0") + '</div>' +
      '<p>“' + esc(displayQuote(moment.quote)) + '”</p>' +
      '<div><span>' + esc(moment.category) + '</span><b>' + esc(item.film) + ' @ ' + timestamp(moment.t) + '</b></div>' +
      '<button data-play="' + item.id + '" data-time="' + moment.t + '">PLAY THE RECEIPT →</button>';
    document.getElementById("consoleClock").textContent = timestamp(moment.t);
    var button = document.querySelector("#heroConsole [data-play]");
    if (button) button.onclick = function () { openDossier(button.getAttribute("data-play"), Number(button.getAttribute("data-time"))); };
  }

  function categories() {
    var found = [];
    deep.hot100.forEach(function (moment) {
      if (found.indexOf(moment.category) < 0) found.push(moment.category);
    });
    return ["ALL EVIDENCE"].concat(found);
  }

  function renderCategoryFilters() {
    document.getElementById("categoryFilters").innerHTML = categories().map(function (category) {
      return '<button class="' + (state.hotCategory === category ? "on" : "") + '" data-category="' +
        esc(category) + '">' + esc(category) + '</button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#categoryFilters button"), function (button) {
      button.onclick = function () {
        state.hotCategory = button.getAttribute("data-category");
        state.hotLimit = 12;
        renderCategoryFilters();
        renderHot100();
      };
    });
  }

  function renderHot100() {
    var filtered = deep.hot100.filter(function (moment) {
      return state.hotCategory === "ALL EVIDENCE" || moment.category === state.hotCategory;
    });
    var visible = filtered.slice(0, state.hotLimit);
    document.getElementById("hotGrid").innerHTML = visible.map(function (moment, index) {
      var item = itemById[moment.tapeId];
      return '<article class="evidence-card ' + (index < 2 ? "featured" : "") + '" style="--accent:' +
        colors[item.franchise] + '">' +
        '<div class="evidence-top"><b>#' + String(moment.rank).padStart(3, "0") + '</b><span>' +
        esc(moment.category) + '</span><i>' + timestamp(moment.t) + '</i></div>' +
        '<blockquote>“' + esc(displayQuote(moment.quote)) + '”</blockquote>' +
        '<p>' + esc(categoryCopy[moment.category] || "A source-linked evidence fragment.") + '</p>' +
        '<footer><div><span>' + esc(item.franchise) + '</span><b>' + esc(item.film) + '</b></div>' +
        '<button data-play="' + item.id + '" data-time="' + moment.t + '">▶ PLAY RECEIPT</button></footer>' +
        '</article>';
    }).join("");
    document.getElementById("loadMore").hidden = visible.length >= filtered.length;
    bindPlayButtons(document.getElementById("hotGrid"));
  }

  function renderFranchises() {
    document.getElementById("franchiseGrid").innerHTML = deep.franchises.map(function (franchise, index) {
      var items = catalog.filter(function (item) { return item.franchise === franchise.name; });
      var tapes = items.map(function (item) { return tapeById[item.id]; }).filter(Boolean);
      var peak = tapes.slice().sort(function (a, b) { return b.unhinged - a.unhinged; })[0];
      var peakItem = peak ? itemById[peak.id] : items[0];
      var image = peakItem ? peakItem.thumbnail : "";
      return '<article class="franchise-card" style="--accent:' + colors[franchise.name] + '">' +
        '<div class="franchise-image"><img loading="lazy" src="' + esc(image) + '" alt=""><span>CASE FILE 0' + (index + 1) + '</span></div>' +
        '<div class="franchise-body"><p>' + esc(franchise.killer) + ' PATH // ' + franchise.tapes + ' TAPES</p>' +
        '<h3>' + esc(franchise.name) + '</h3><blockquote>“' + esc(franchise.prompt) + '”</blockquote>' +
        '<div class="franchise-stats"><span><b>' + fmt(franchise.wordsAudited) + '</b>WORDS</span><span><b>' +
        franchise.avgUnhinged + '</b>AVG. UNHINGED</span></div>' +
        '<button data-franchise="' + esc(franchise.name) + '">OPEN ' + esc(franchise.lab) + ' →</button></div></article>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#franchiseGrid [data-franchise]"), function (button) {
      button.onclick = function () {
        state.lab = button.getAttribute("data-franchise");
        renderLabs();
        document.getElementById("labs").scrollIntoView({ behavior: "smooth" });
      };
    });
  }

  function renderFranchiseFilters() {
    var names = ["ALL"].concat(franchiseOrder);
    document.getElementById("franchiseFilters").innerHTML = names.map(function (name) {
      return '<button class="' + (state.franchise === name ? "on" : "") + '" data-franchise="' + esc(name) + '">' +
        (name === "A Nightmare on Elm Street" ? "ELM STREET" : esc(name).toUpperCase()) + '</button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#franchiseFilters button"), function (button) {
      button.onclick = function () { setFranchise(button.getAttribute("data-franchise")); };
    });
  }

  function setFranchise(name) {
    state.franchise = name;
    renderFranchiseFilters();
    renderVault();
  }

  function tapeCard(item) {
    var tape = tapeById[item.id] || { unhinged: 0, wordsAudited: 0, moments: [] };
    var sealed = !item.transcript;
    return '<article class="tape-card ' + franchiseSlug(item.franchise) + '" style="--accent:' + colors[item.franchise] +
      '" data-tape="' + item.id + '">' +
      '<div class="tape-image"><img loading="lazy" src="' + esc(item.thumbnail) + '" alt=""><span>' +
      esc(item.franchise) + '</span><b>' + duration(item.duration) + '</b></div>' +
      '<div class="tape-body"><div><span>TAPE ' + String(item.order).padStart(2, "0") + ' // ' + shortDate(item.date) +
      '</span><i class="' + (sealed ? "sealed" : "") + '">' + (sealed ? "TAPE SEALED" : "FULL DISTILL") + '</i></div>' +
      '<h3>' + esc(item.film) + '</h3><p>' + esc(tape.verdict || "Age gate prevents a defensible caption distill. The original tape remains linked.") + '</p>' +
      '<footer><span><b>' + (sealed ? "—" : tape.unhinged) + '</b>UNHINGED</span><span><b>' +
      (sealed ? "—" : fmt(tape.wordsAudited)) + '</b>WORDS</span><button>OPEN AUTOPSY →</button></footer>' +
      '</div></article>';
  }

  function renderVault() {
    var query = state.vaultQuery.trim().toLowerCase();
    var words = query.split(/\s+/).filter(Boolean);
    var list = catalog.filter(function (item) {
      if (state.franchise !== "ALL" && item.franchise !== state.franchise) return false;
      if (!words.length) return true;
      var tape = tapeById[item.id] || {};
      var hay = [item.film, item.title, item.franchise, tape.verdict].join(" ").toLowerCase();
      return words.every(function (word) { return hay.indexOf(word) >= 0; });
    });
    document.getElementById("vaultCount").textContent = list.length + " TAPE" + (list.length === 1 ? "" : "S") + " EXHUMED";
    document.getElementById("tapeGrid").innerHTML = list.length ? list.map(tapeCard).join("") :
      '<p class="no-tapes">NOTHING IN THIS DRAWER. TRY FEWER WORDS OR A DIFFERENT KILLER.</p>';
    Array.prototype.forEach.call(document.querySelectorAll(".tape-card"), function (card) {
      card.onclick = function () { openDossier(card.getAttribute("data-tape")); };
    });
  }

  function metricRows(tape) {
    var metrics = Object.keys(categoryCopy).map(function (category) {
      return [category, tape.metrics[category] || 0];
    }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var max = metrics.length ? metrics[0][1] || 1 : 1;
    return metrics.map(function (metric) {
      return '<li><div><span>' + esc(metric[0]) + '</span><b>' + metric[1] + ' SIGNALS</b></div>' +
        '<i><em style="width:' + Math.max(3, Math.round(metric[1] / max * 100)) + '%"></em></i></li>';
    }).join("");
  }

  function arcMarkup(tape) {
    return tape.arc.map(function (chapter) {
      return '<div title="Chapter ' + chapter.chapter + ': ' + esc(chapter.dominant) + '"><i style="height:' +
        chapter.heat + '%"></i><span>' + chapter.chapter + '</span><b>' + esc(chapter.dominant) + '</b></div>';
    }).join("");
  }

  function momentsMarkup(tape, item) {
    if (!tape.moments.length) {
      return '<p class="sealed-copy">YouTube requires an age-confirmed session for this upload. The prototype refuses to invent a transcript or a score. Open the original tape to continue.</p>';
    }
    return tape.moments.map(function (moment) {
      return '<article><div><span>' + esc(moment.category) + '</span><b>' + timestamp(moment.t) + '</b></div>' +
        '<p>“' + esc(displayQuote(moment.quote)) + '”</p><footer><button data-play="' + item.id + '" data-time="' +
        moment.t + '">▶ PLAY</button><button data-share="' + item.id + '" data-time="' + moment.t + '">SHARE RECEIPT</button></footer></article>';
    }).join("");
  }

  function openDossier(id, startTime) {
    var item = itemById[id];
    var tape = tapeById[id] || {
      unhinged: 0, wordsAudited: 0, captionMinutes: 0, verdict: "Tape sealed by YouTube's age gate.",
      metrics: {}, arc: [], moments: [],
    };
    if (!item) return;
    var modal = document.getElementById("tapeModal");
    document.getElementById("modalContent").innerHTML =
      '<div class="modal-hero" style="--accent:' + colors[item.franchise] + '">' +
      '<img src="' + esc(item.thumbnail) + '" alt=""><div><p>' + esc(item.franchise) + ' // TAPE ' +
      String(item.order).padStart(2, "0") + '</p><h2>' + esc(item.film) + '</h2><span>' + shortDate(item.date) +
      ' // ' + duration(item.duration) + '</span></div></div>' +
      '<div class="modal-grid"><section class="modal-verdict"><p class="kicker">THE MACHINE-AUDITED VERDICT</p><blockquote>' +
      esc(tape.verdict) + '</blockquote><div class="index-dial"><i style="--score:' + tape.unhinged +
      '"></i><b>' + (item.transcript ? tape.unhinged : "—") + '</b><span>UNHINGED<br>INDEX</span></div>' +
      '<div class="source-actions"><a href="' + esc(item.url) + '" target="_blank" rel="noopener">OPEN ORIGINAL ON YOUTUBE ↗</a>' +
      '<button data-share="' + item.id + '">COPY DOSSIER LINK</button></div></section>' +
      '<section class="signal-profile"><p class="kicker">SIGNAL PROFILE // ' + fmt(tape.wordsAudited) + ' WORDS AUDITED</p>' +
      '<ul>' + metricRows(tape) + '</ul></section></div>' +
      (tape.arc.length ? '<section class="heat-section"><div><p class="kicker">THE EIGHT-CHAPTER HEAT ARC</p><span>DOMINANT SIGNAL BY RUNTIME OCTANT</span></div><div class="heat-arc">' +
      arcMarkup(tape) + '</div></section>' : '') +
      '<section class="receipt-section"><div><p class="kicker">PLAYABLE EVIDENCE LOCKER</p><span>SHORT AUTO-CAPTION FRAGMENTS // VERIFY AGAINST ORIGINAL</span></div>' +
      '<div class="modal-player" id="modalPlayer"><div><span>SELECT A RECEIPT TO CUE THE ORIGINAL TAPE.</span></div></div>' +
      '<div class="receipt-list">' + momentsMarkup(tape, item) + '</div></section>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    bindPlayButtons(document.getElementById("modalContent"), true);
    bindShareButtons(document.getElementById("modalContent"));
    if (startTime != null) loadPlayer(item.id, Number(startTime));
    history.replaceState(null, "", "?tape=" + encodeURIComponent(item.id) + (startTime != null ? "&at=" + Math.round(startTime) : "") + "#autopsies");
  }

  function loadPlayer(id, at) {
    var player = document.getElementById("modalPlayer");
    if (!player) return;
    player.innerHTML = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&start=' +
      Math.max(0, Math.round(at || 0)) + '" title="WWAM commentary source playback" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    player.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function closeDossier() {
    var modal = document.getElementById("tapeModal");
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    var url = new URL(window.location.href);
    url.searchParams.delete("tape");
    url.searchParams.delete("at");
    history.replaceState(null, "", url.pathname + url.hash);
  }

  function bindPlayButtons(root, inModal) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-play]"), function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        var id = button.getAttribute("data-play");
        var at = Number(button.getAttribute("data-time") || 0);
        if (inModal) loadPlayer(id, at);
        else openDossier(id, at);
      };
    });
  }

  function shareUrl(id, at) {
    var url = new URL(window.location.href);
    url.search = "";
    url.hash = "autopsies";
    url.searchParams.set("tape", id);
    if (at != null) url.searchParams.set("at", Math.round(at));
    return url.toString();
  }

  function copy(value) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(showToast);
    } else {
      var input = document.createElement("textarea");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      showToast();
    }
  }

  function bindShareButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-share]"), function (button) {
      button.onclick = function () {
        copy(shareUrl(button.getAttribute("data-share"), button.hasAttribute("data-time") ? Number(button.getAttribute("data-time")) : null));
      };
    });
  }

  function showToast() {
    var toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function searchResults(query) {
    var q = query.toLowerCase().trim();
    var terms = q.split(/[^a-z0-9']+/).filter(function (word) {
      return word.length > 2 && ["what", "they", "show", "about", "which", "with", "have", "find", "movie", "moment"].indexOf(word) < 0;
    });
    var pool = catalog.map(function (item) {
      var tape = tapeById[item.id] || { verdict: "", moments: [], unhinged: 0 };
      var preferredCategory = q.indexOf("hate") >= 0 || q.indexOf("worst") >= 0 ? "FRANCHISE FELONY" :
        q.indexOf("love") >= 0 || q.indexOf("best") >= 0 ? "LOVE LETTER" :
        q.indexOf("theory") >= 0 || q.indexOf("predict") >= 0 ? "THEORY BOARD" :
        q.indexOf("kill") >= 0 || q.indexOf("death") >= 0 ? "KILL ROOM" :
        q.indexOf("wild") >= 0 || q.indexOf("crazy") >= 0 ? "OUT OF POCKET" : null;
      var preferredMoments = preferredCategory ?
        tape.moments.filter(function (candidate) { return candidate.category === preferredCategory; }) : [];
      var candidateMoments = preferredMoments.length ? preferredMoments : tape.moments;
      var moment = candidateMoments[0] || null;
      var score = 0;
      var base = [item.film, item.title, item.franchise, tape.verdict].join(" ").toLowerCase();
      candidateMoments.forEach(function (candidate) {
        var hay = (candidate.quote + " " + candidate.category).toLowerCase();
        var local = terms.reduce(function (total, term) { return total + (hay.indexOf(term) >= 0 ? 5 : 0); }, 0);
        if (!moment || local > terms.reduce(function (total, term) {
          return total + ((moment.quote + " " + moment.category).toLowerCase().indexOf(term) >= 0 ? 5 : 0);
        }, 0)) moment = candidate;
      });
      terms.forEach(function (term) {
        if (item.film.toLowerCase().indexOf(term) >= 0) score += 12;
        else if (item.franchise.toLowerCase().indexOf(term) >= 0) score += 8;
        else if (base.indexOf(term) >= 0) score += 4;
        if (moment && (moment.quote + " " + moment.category).toLowerCase().indexOf(term) >= 0) score += 5;
      });
      if (q.indexOf("highest") >= 0 && q.indexOf("unhinged") >= 0) score += tape.unhinged;
      if (q.indexOf("wildest") >= 0 || q.indexOf("craziest") >= 0) score += tape.unhinged * 0.45;
      if (q.indexOf("hate") >= 0 && moment && moment.category === "FRANCHISE FELONY") score += 20;
      if (q.indexOf("love") >= 0 && moment && moment.category === "LOVE LETTER") score += 20;
      if (q.indexOf("space") >= 0 && /Jason X/i.test(item.film)) score += 80;
      if (q.indexOf("remake") >= 0 && /2010/.test(item.film)) score += 70;
      return { item: item, tape: tape, moment: moment, score: score };
    });
    return pool.filter(function (result) { return result.score > 0; }).sort(function (a, b) {
      return b.score - a.score || b.tape.unhinged - a.tape.unhinged;
    }).slice(0, 6);
  }

  function ask(query) {
    var results = searchResults(query);
    document.getElementById("askStatus").textContent = results.length ? results.length + " EVIDENCE PATHS FOUND" : "NO CONFIDENT RECEIPT";
    document.getElementById("askResults").innerHTML = results.length ? results.map(function (result, index) {
      var moment = result.moment;
      return '<article class="' + (index === 0 ? "best" : "") + '"><div><span>' + (index === 0 ? "DIRECT HIT" : "RELATED DAMAGE") +
        '</span><b>' + esc(result.item.franchise) + '</b></div><h3>' + esc(result.item.film) + '</h3><p>' +
        (moment ? '“' + esc(displayQuote(moment.quote)) + '”' : esc(result.tape.verdict)) + '</p><footer><span>' +
        (moment ? esc(moment.category) + ' // ' + timestamp(moment.t) : "SOURCE TAPE") +
        '</span><button data-play="' + result.item.id + '" data-time="' + (moment ? moment.t : 0) + '">SHOW ME →</button></footer></article>';
    }).join("") : '<p class="empty-state">No confident match in this bounded four-franchise archive. Try a film title, killer, “hate,” “love,” “space,” or “unhinged.”</p>';
    bindPlayButtons(document.getElementById("askResults"));
  }

  function renderLabs() {
    document.getElementById("labTabs").innerHTML = deep.franchises.map(function (franchise) {
      return '<button class="' + (state.lab === franchise.name ? "on" : "") + '" data-lab="' + esc(franchise.name) +
        '"><span>' + esc(franchise.killer) + '</span><b>' + esc(franchise.lab) + '</b></button>';
    }).join("");
    var franchise = deep.franchises.filter(function (item) { return item.name === state.lab; })[0];
    var items = catalog.filter(function (item) { return item.franchise === state.lab; });
    var candidates = [];
    items.forEach(function (item) {
      var tape = tapeById[item.id];
      if (tape) tape.moments.forEach(function (moment) { candidates.push({ item: item, tape: tape, moment: moment }); });
    });
    var category = state.lab === "Scream" ? "THEORY BOARD" :
      state.lab === "Friday the 13th" ? "KILL ROOM" :
      state.lab === "Halloween" ? "HORROR BRAIN" : "FRANCHISE FELONY";
    candidates.sort(function (a, b) {
      return (b.moment.category === category) - (a.moment.category === category) || b.moment.score - a.moment.score;
    });
    var featured = candidates.slice(0, 4);
    document.getElementById("labPanel").style.setProperty("--accent", colors[state.lab]);
    document.getElementById("labPanel").innerHTML =
      '<div class="lab-intro"><span>LIVE CHAMBER // ' + esc(franchise.killer) + '</span><h3>' + esc(franchise.lab) +
      '</h3><p>' + esc(franchise.prompt) + '</p><div><b>' + franchise.tapes + '</b>TAPES UNDER OATH <b>' +
      fmt(franchise.wordsAudited) + '</b>WORDS IN EVIDENCE</div></div>' +
      '<div class="lab-receipts">' + featured.map(function (entry, index) {
        return '<article><span>EXHIBIT ' + String.fromCharCode(65 + index) + ' // ' + esc(entry.moment.category) +
          '</span><blockquote>“' + esc(displayQuote(entry.moment.quote)) + '”</blockquote><div><b>' +
          esc(entry.item.film) + '</b><button data-play="' + entry.item.id + '" data-time="' + entry.moment.t +
          '">CUE ' + timestamp(entry.moment.t) + ' →</button></div></article>';
      }).join("") + '</div>';
    Array.prototype.forEach.call(document.querySelectorAll("#labTabs button"), function (button) {
      button.onclick = function () { state.lab = button.getAttribute("data-lab"); renderLabs(); };
    });
    bindPlayButtons(document.getElementById("labPanel"));
  }

  function setBand(value, persist) {
    state.redBand = value === "red";
    if (persist) localStorage.setItem("wwam-band", state.redBand ? "red" : "bleep");
    document.body.classList.toggle("office-bleep", !state.redBand);
    document.getElementById("bandToggle").textContent = "OFFICE BLEEP: " + (state.redBand ? "OFF" : "ON");
    renderHeroConsole();
    renderHot100();
    renderLabs();
    var openModal = document.getElementById("tapeModal").classList.contains("show");
    if (openModal) {
      var params = new URLSearchParams(location.search);
      if (params.get("tape")) openDossier(params.get("tape"), params.get("at"));
    }
  }

  function renderTour() {
    var slide = tourSlides[state.tourSlide];
    document.getElementById("tourBody").innerHTML =
      '<div class="tour-number">' + slide.number + '</div><div><p>' + slide.eyebrow + '</p><h2>' + slide.title +
      '</h2><span>' + slide.body + '</span><blockquote>' + slide.proof + '</blockquote></div>';
    document.getElementById("tourProgress").style.width = ((state.tourSlide + 1) / tourSlides.length * 100) + "%";
    document.getElementById("tourCounter").textContent = (state.tourSlide + 1) + " / " + tourSlides.length;
    document.getElementById("tourBack").disabled = state.tourSlide === 0;
    document.getElementById("tourNext").textContent = state.tourSlide === tourSlides.length - 1 ? "COPY DEMO LINK" : "NEXT →";
  }

  function openTour() {
    state.tourSlide = 0;
    renderTour();
    document.getElementById("pitchTour").classList.add("show");
    document.getElementById("pitchTour").setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    history.replaceState(null, "", "#pitch");
  }

  function closeTour() {
    document.getElementById("pitchTour").classList.remove("show");
    document.getElementById("pitchTour").setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function bindPage() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-band]"), function (button) {
      button.onclick = function () {
        setBand(button.getAttribute("data-band"), true);
        document.getElementById("contentGate").classList.add("gone");
      };
    });
    document.getElementById("bandToggle").onclick = function () { setBand(state.redBand ? "bleep" : "red", true); };
    document.getElementById("loadMore").onclick = function () { state.hotLimit += 12; renderHot100(); };
    document.getElementById("rouletteButton").onclick = function () {
      var moment = deep.hot100[Math.floor(Math.random() * deep.hot100.length)];
      if (moment) openDossier(moment.tapeId, moment.t);
    };
    document.getElementById("vaultSearch").oninput = function (event) {
      state.vaultQuery = event.target.value;
      renderVault();
    };
    document.getElementById("askForm").onsubmit = function (event) {
      event.preventDefault();
      var query = document.getElementById("askInput").value.trim();
      if (query.length > 1) ask(query);
    };
    Array.prototype.forEach.call(document.querySelectorAll(".prompt-chips button"), function (button) {
      button.onclick = function () {
        document.getElementById("askInput").value = button.textContent;
        ask(button.textContent);
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-category-jump]"), function (button) {
      button.onclick = function () {
        state.hotCategory = button.getAttribute("data-category-jump");
        state.hotLimit = 12;
        renderCategoryFilters();
        renderHot100();
        document.getElementById("red100").scrollIntoView({ behavior: "smooth" });
      };
    });
    document.getElementById("modalClose").onclick = closeDossier;
    document.getElementById("tapeModal").onclick = function (event) {
      if (event.target.id === "tapeModal") closeDossier();
    };
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (document.getElementById("pitchTour").classList.contains("show")) closeTour();
        else if (document.getElementById("tapeModal").classList.contains("show")) closeDossier();
      }
    });
    [document.getElementById("mikeButton"), document.getElementById("pitchTourButton"), document.getElementById("footerPitch")].forEach(function (button) {
      button.onclick = openTour;
    });
    document.getElementById("copyDemoButton").onclick = function () { copy(location.origin + location.pathname + "#pitch"); };
    document.getElementById("tourClose").onclick = closeTour;
    document.getElementById("tourBack").onclick = function () {
      if (state.tourSlide > 0) { state.tourSlide -= 1; renderTour(); }
    };
    document.getElementById("tourNext").onclick = function () {
      if (state.tourSlide < tourSlides.length - 1) { state.tourSlide += 1; renderTour(); }
      else copy(location.origin + location.pathname + "#pitch");
    };
  }

  function init() {
    document.getElementById("consoleStatus").textContent = "SCANNING " + fmt(deep.meta.wordsAudited) + " WORDS";
    renderProof();
    renderMarquee();
    renderHeroConsole();
    renderCategoryFilters();
    renderHot100();
    renderFranchises();
    renderFranchiseFilters();
    renderVault();
    renderLabs();
    bindPage();
    setBand(state.redBand ? "red" : "bleep", false);

    if (localStorage.getItem("wwam-band")) document.getElementById("contentGate").classList.add("gone");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(function () {
        state.consoleIndex += 1;
        renderHeroConsole();
      }, 5200);
    }
    var params = new URLSearchParams(location.search);
    if (params.get("tape")) setTimeout(function () { openDossier(params.get("tape"), params.get("at")); }, 50);
    else if (location.hash === "#pitch") setTimeout(openTour, 50);
  }

  init();
})();
