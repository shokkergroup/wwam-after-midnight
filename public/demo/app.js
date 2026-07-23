(function () {
  "use strict";

  var catalog = window.WWAM_CATALOG || [];
  var deep = window.WWAM_DEEP_DISTILL || { meta: {}, franchises: [], tapes: [], hot100: [] };
  var live = window.WWAM_LIVESTREAMS || { meta: {}, streams: [], topicIndex: [] };
  var curated = window.WWAM_CURATED || { upInYa: [], askExamples: [] };
  var askEngine = window.WWAMSearchEngine.create(catalog, deep, live, curated);
  var tapeById = {};
  var itemById = {};
  var streamById = {};
  var state = {
    redBand: localStorage.getItem("wwam-band") !== "bleep",
    hotCategory: "ALL EVIDENCE",
    hotLimit: 12,
    franchise: "ALL",
    vaultQuery: "",
    lab: "Halloween",
    soundSource: "commentary",
    liveTopic: "ALL TOPICS",
    tourSlide: 0,
    consoleIndex: 0,
  };

  deep.tapes.forEach(function (tape) { tapeById[tape.id] = tape; });
  catalog.forEach(function (item) { itemById[item.id] = item; });
  live.streams.forEach(function (stream) { streamById[stream.id] = stream; });

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
      title: "953,253 WORDS<br>WENT UNDER THE KNIFE.",
      body: "This demo audits 38 available commentary tracks plus nine captioned streams from the ten newest live uploads, then turns short evidence fragments into searchable, playable paths back to the original source.",
      proof: "NO FAKE QUOTES. NO GUESSED SPEAKERS. NO DEAD-END SEARCH RESULTS.",
    },
    {
      number: "03",
      eyebrow: "THE MOAT",
      title: "THE ENGINE UPDATES.<br>THE WEIRDNESS LEADS.",
      body: "The newest stream becomes topics, funny-moment heat, and exact jumps while the archive keeps Loomis Logic, the Suspect Board, Dream Logic Court, the Unhinged Index, and a human-curated WWAM UP IN YA wall.",
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
    var liveMeta = live.meta || {};
    document.getElementById("proof").innerHTML = [
      ["SOURCES", meta.tapes + (liveMeta.streams || 0), "39 COMMENTARIES + 10 LIVES"],
      ["WORDS AUDITED", fmt(meta.wordsAudited + (liveMeta.wordsAudited || 0)), "AVAILABLE CAPTIONS"],
      ["HOURS", meta.captionHours + (liveMeta.hours || 0), "UNDER THE KNIFE"],
      ["QUICK HITS", meta.hotMoments + (liveMeta.moments || 0), "PLAYABLE RECEIPTS"],
      ["LIVE TOPICS", liveMeta.topics || 0, "ACROSS THE NEWEST SHOWS"],
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

  function resolveSoundbyte(entry) {
    if (entry.source === "commentary") {
      var tape = tapeById[entry.id];
      var item = itemById[entry.id];
      var moment = tape && tape.moments.filter(function (candidate) { return candidate.t === entry.t; })[0];
      if (!item || !moment) return null;
      return {
        source: "commentary",
        id: entry.id,
        t: entry.t,
        label: entry.label,
        quote: moment.quote,
        category: moment.category,
        title: item.film,
        subtitle: item.franchise,
        thumbnail: item.thumbnail,
      };
    }
    var stream = streamById[entry.id];
    var liveMoment = stream && stream.moments.filter(function (candidate) { return candidate.t === entry.t; })[0];
    if (!stream || !liveMoment) return null;
    return {
      source: "livestream",
      id: entry.id,
      t: entry.t,
      label: entry.label,
      quote: liveMoment.quote,
      category: liveMoment.category,
      title: stream.title,
      subtitle: "FRESH FROM LIVE // " + shortDate(stream.date),
      thumbnail: stream.thumbnail,
    };
  }

  function soundbytes() {
    return curated.upInYa.map(resolveSoundbyte).filter(Boolean).filter(function (item) {
      return state.soundSource === "all" || item.source === state.soundSource;
    });
  }

  function renderSoundbytes() {
    var list = soundbytes();
    document.getElementById("soundbyteGrid").innerHTML = list.map(function (item, index) {
      return '<button class="soundbyte" data-sound-index="' + index + '">' +
        '<span><i></i>' + String(index + 1).padStart(2, "0") + ' // ' + esc(item.category) + '</span>' +
        '<b>' + esc(item.label) + '</b><p>“' + esc(displayQuote(item.quote)) + '”</p>' +
        '<em>' + esc(item.title) + ' @ ' + timestamp(item.t) + '</em></button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#soundbyteGrid [data-sound-index]"), function (button) {
      button.onclick = function () {
        var item = list[Number(button.getAttribute("data-sound-index"))];
        if (item) cueSoundbyte(item);
      };
    });
  }

  function renderSoundFilters() {
    Array.prototype.forEach.call(document.querySelectorAll("#soundFilters [data-sound-source]"), function (button) {
      button.classList.toggle("on", button.getAttribute("data-sound-source") === state.soundSource);
    });
  }

  function cueSoundbyte(item) {
    document.getElementById("soundPlayer").innerHTML =
      '<div class="sound-video"><iframe src="https://www.youtube.com/embed/' + encodeURIComponent(item.id) +
      '?autoplay=1&rel=0&start=' + Math.max(0, Math.round(item.t)) +
      '" title="WWAM source soundbyte" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<div class="sound-now"><span>NOW VIOLATING THE SILENCE // ' + esc(item.category) + '</span><h3>' +
      esc(item.label) + '</h3><blockquote>“' + esc(displayQuote(item.quote)) + '”</blockquote><p>' +
      esc(item.title) + ' // ' + timestamp(item.t) + '</p><button data-open-sound="' + item.source +
      '" data-id="' + item.id + '" data-time="' + item.t + '">OPEN THE FULL RECEIPT →</button></div>';
    var button = document.querySelector("#soundPlayer [data-open-sound]");
    if (button) {
      button.onclick = function () {
        if (button.getAttribute("data-open-sound") === "livestream") {
          openLiveDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time")));
        } else {
          openDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time")));
        }
      };
    }
  }

  function renderLiveProof() {
    var meta = live.meta || {};
    document.getElementById("liveProof").innerHTML = [
      [meta.streams, "NEWEST STREAMS"],
      [meta.captioned, "FULL LIVE MAPS"],
      [fmt(meta.wordsAudited), "WORDS AUDITED"],
      [meta.hours, "HOURS ON AIR"],
      [meta.moments, "COMEDY SPIKES"],
      [meta.topics, "TRACKED TOPICS"],
    ].map(function (stat) {
      return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
  }

  function renderTopicRadar() {
    var topics = [{ name: "ALL TOPICS", mentions: 0, streams: live.streams }].concat(live.topicIndex.slice(0, 12));
    document.getElementById("topicRadar").innerHTML = topics.map(function (topic) {
      return '<button class="' + (state.liveTopic === topic.name ? "on" : "") + '" data-live-topic="' +
        esc(topic.name) + '"><b>' + esc(topic.name) + '</b><span>' +
        (topic.name === "ALL TOPICS" ? live.streams.length + " SHOWS" : topic.mentions + " MENTIONS // " + topic.streams.length + " SHOWS") +
        '</span></button>';
    }).join("");
    document.getElementById("topicRadarLabel").textContent = state.liveTopic === "ALL TOPICS" ?
      "EVERYTHING THEY WON'T STOP TALKING ABOUT" : state.liveTopic + " // SOURCE-DENSE STREAMS FIRST";
    Array.prototype.forEach.call(document.querySelectorAll("#topicRadar [data-live-topic]"), function (button) {
      button.onclick = function () {
        state.liveTopic = button.getAttribute("data-live-topic");
        renderTopicRadar();
        renderStreams();
      };
    });
  }

  function miniHeat(stream) {
    if (!stream.heatmap.length) return '<div class="mini-heat sealed"><span>NO CAPTION TRACK // MAP UNAVAILABLE</span></div>';
    return '<div class="mini-heat">' + stream.heatmap.map(function (bin) {
      return '<i style="--heat:' + bin.heat + '" title="' + esc(bin.signal + (bin.topic ? " // " + bin.topic : "")) + '"></i>';
    }).join("") + '</div>';
  }

  function streamCard(stream, index) {
    var topics = stream.topics.slice(0, 4);
    var peak = stream.moments.slice().sort(function (a, b) { return b.heat - a.heat; })[0];
    return '<article class="stream-card ' + (!stream.captioned ? "unmapped" : "") + '" data-live-id="' + stream.id + '">' +
      '<div class="stream-thumb"><img loading="lazy" src="' + esc(stream.thumbnail) + '" alt=""><span>LIVE 0' +
      (index + 1) + ' // ' + shortDate(stream.date) + '</span><b>' + duration(stream.duration) + '</b></div>' +
      '<div class="stream-body"><div><i class="' + (stream.captioned ? "" : "sealed") + '">' +
      (stream.captioned ? "FULL LIVE MAP" : "MAPPING UNAVAILABLE") + '</i><span>' + fmt(stream.wordsAudited) + ' WORDS</span></div>' +
      '<h3>' + esc(stream.title) + '</h3><p>' + esc(stream.summary) + '</p>' +
      '<div class="stream-topics">' + (topics.length ? topics.map(function (topic) {
        return '<button data-stream-topic="' + esc(topic.name) + '" data-live-id="' + stream.id + '" data-time="' +
          topic.peak + '">' + esc(topic.name) + ' <b>' + timestamp(topic.peak) + '</b></button>';
      }).join("") : '<span>THE SOURCE IS LIVE. THE CAPTION MAP IS NOT.</span>') + '</div>' +
      miniHeat(stream) + '<footer><span>' + (peak ? 'PEAK COMEDY // ' + timestamp(peak.t) + ' // ' + esc(peak.category) : 'ORIGINAL STREAM AVAILABLE') +
      '</span><button>OPEN LIVE MAP →</button></footer></div></article>';
  }

  function renderStreams() {
    var list = live.streams.slice();
    if (state.liveTopic !== "ALL TOPICS") {
      list = list.filter(function (stream) {
        return stream.topics.some(function (topic) { return topic.name === state.liveTopic; });
      }).sort(function (a, b) {
        var aTopic = a.topics.filter(function (topic) { return topic.name === state.liveTopic; })[0];
        var bTopic = b.topics.filter(function (topic) { return topic.name === state.liveTopic; })[0];
        return (bTopic ? bTopic.mentions : 0) - (aTopic ? aTopic.mentions : 0);
      });
    }
    document.getElementById("streamGrid").innerHTML = list.map(streamCard).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".stream-card"), function (card) {
      card.onclick = function () { openLiveDossier(card.getAttribute("data-live-id")); };
    });
    Array.prototype.forEach.call(document.querySelectorAll(".stream-card [data-stream-topic]"), function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        openLiveDossier(button.getAttribute("data-live-id"), Number(button.getAttribute("data-time")));
      };
    });
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

  function liveHeatMarkup(stream) {
    if (!stream.heatmap.length) {
      return '<p class="sealed-copy">YouTube supplies no caption track for this stream, so comedy scoring and topic chapters are deliberately unavailable. The original upload remains playable.</p>';
    }
    return stream.heatmap.map(function (bin, index) {
      return '<button style="--heat:' + bin.heat + '" data-live-play="' + stream.id + '" data-time="' + bin.from +
        '" title="' + esc(bin.signal + (bin.topic ? " // " + bin.topic : "")) + '"><i></i><span>' +
        (index % 5 === 0 ? timestamp(bin.from) : "") + '</span></button>';
    }).join("");
  }

  function liveTopicsMarkup(stream) {
    if (!stream.topics.length) return '<li class="topic-empty">NO DEFENSIBLE TOPIC CHAPTERS WITHOUT CAPTIONS.</li>';
    return stream.topics.map(function (topic, index) {
      return '<li><button data-live-play="' + stream.id + '" data-time="' + topic.peak + '"><span>0' + (index + 1) +
        '</span><div><b>' + esc(topic.name) + '</b><small>' + topic.mentions + ' MENTIONS // PEAK CLUSTER ' +
        timestamp(topic.peak) + '</small></div><i>JUMP →</i></button></li>';
    }).join("");
  }

  function liveMomentsMarkup(stream) {
    if (!stream.moments.length) {
      return '<p class="sealed-copy">No caption-derived comedy receipts are published for this stream. Open the original source to watch it in full.</p>';
    }
    return stream.moments.map(function (moment) {
      return '<article><div><span>' + esc(moment.category) + ' // HEAT ' + moment.heat + '</span><b>' +
        timestamp(moment.t) + '</b></div><p>“' + esc(displayQuote(moment.quote)) +
        '”</p><footer><button data-live-play="' + stream.id + '" data-time="' + moment.t +
        '">▶ PLAY</button><button data-share-live="' + stream.id + '" data-time="' + moment.t +
        '">SHARE RECEIPT</button></footer></article>';
    }).join("");
  }

  function openLiveDossier(id, startTime) {
    var stream = streamById[id];
    if (!stream) return;
    var peak = stream.moments.slice().sort(function (a, b) { return b.heat - a.heat; })[0];
    var modal = document.getElementById("tapeModal");
    document.getElementById("modalContent").innerHTML =
      '<div class="modal-hero live-modal-hero" style="--accent:var(--cyan)"><img src="' + esc(stream.thumbnail) +
      '" alt=""><div><p>LIVE WIRE // NEWEST STREAM ' + String(live.streams.indexOf(stream) + 1).padStart(2, "0") +
      '</p><h2>' + esc(stream.title) + '</h2><span>' + shortDate(stream.date) + ' // ' +
      duration(stream.duration) + ' // ' + fmt(stream.views) + ' VIEWS</span></div></div>' +
      '<div class="modal-grid live-modal-grid"><section class="modal-verdict"><p class="kicker">THE LIVE-ROOM AUTOPSY</p><blockquote>' +
      esc(stream.summary) + '</blockquote><div class="live-peak"><b>' + (peak ? peak.heat : "—") +
      '</b><span>PEAK<br>COMEDY HEAT</span></div><div class="source-actions"><a href="' + esc(stream.url) +
      '" target="_blank" rel="noopener">OPEN ORIGINAL ON YOUTUBE ↗</a><button data-share-live="' + stream.id +
      '">COPY LIVE MAP</button></div></section><section class="live-topic-index"><p class="kicker">JUMP TO A TOPIC // ' +
      fmt(stream.wordsAudited) + ' WORDS AUDITED</p><ol>' + liveTopicsMarkup(stream) + '</ol></section></div>' +
      '<section class="heat-section live-heat-section"><div><p class="kicker">THE 30-CHAPTER FUNNY-MOMENT HEAT MAP</p>' +
      '<span>CLICK ANY BAR TO JUMP THERE // HEIGHT = COMEDY-SIGNAL DENSITY</span></div><div class="live-heatmap">' +
      liveHeatMarkup(stream) + '</div></section>' +
      '<section class="receipt-section"><div><p class="kicker">FRESHLY UNWELL // SOURCE RECEIPTS</p>' +
      '<span>SHORT AUTO-CAPTION FRAGMENTS // VERIFY AGAINST ORIGINAL</span></div><div class="modal-player" id="modalPlayer">' +
      '<div><span>SELECT A TOPIC, HEAT BAR, OR COMEDY HIT TO CUE THE STREAM.</span></div></div><div class="receipt-list">' +
      liveMomentsMarkup(stream) + '</div></section>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    bindLivePlayButtons(document.getElementById("modalContent"));
    bindLiveShareButtons(document.getElementById("modalContent"));
    if (startTime != null) loadPlayer(stream.id, Number(startTime));
    history.replaceState(null, "", "?live=" + encodeURIComponent(stream.id) +
      (startTime != null ? "&at=" + Math.round(startTime) : "") + "#livewire");
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
    url.searchParams.delete("live");
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

  function bindLivePlayButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-live-play]"), function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        loadPlayer(button.getAttribute("data-live-play"), Number(button.getAttribute("data-time") || 0));
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

  function shareLiveUrl(id, at) {
    var url = new URL(window.location.href);
    url.search = "";
    url.hash = "livewire";
    url.searchParams.set("live", id);
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

  function bindLiveShareButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-share-live]"), function (button) {
      button.onclick = function () {
        copy(shareLiveUrl(button.getAttribute("data-share-live"),
          button.hasAttribute("data-time") ? Number(button.getAttribute("data-time")) : null));
      };
    });
  }

  function showToast() {
    var toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function renderAskExamples() {
    document.getElementById("askExamples").innerHTML = curated.askExamples.map(function (example) {
      return '<button>' + esc(example) + '</button>';
    }).join("");
  }

  function ask(query) {
    var analysis = askEngine.ask(query);
    var results = analysis.results;
    document.getElementById("askStatus").textContent = results.length ?
      results.length + " RANKED PATHS // " + analysis.confidence + "% CONFIDENCE" : "NO DEFENSIBLE RECEIPT";
    document.getElementById("askResults").innerHTML =
      '<section class="answer-brief"><div><span>INTENT // ' + esc(analysis.intent.toUpperCase()) + '</span><b>' +
      (analysis.entity ? 'ENTITY // ' + esc(analysis.entity.toUpperCase()) : 'ENTITY // OPEN') + '</b><i>' +
      esc((analysis.source === "all" ? "ALL SOURCES" : analysis.source).toUpperCase()) + '</i></div><h3>' +
      esc(analysis.answer) + '</h3><div class="confidence-track"><i style="width:' + analysis.confidence +
      '%"></i></div></section>' +
      (results.length ? results.map(function (result, index) {
        return '<article class="' + (index === 0 ? "best" : "") + '"><div><span>' +
          (index === 0 ? "DIRECT HIT" : result.label) + '</span><b>' + esc(result.source.toUpperCase()) +
          '</b></div><h3>' + esc(result.title) + '</h3><p>“' + esc(displayQuote(result.excerpt)) +
          '”</p><div class="why-row"><span>WHY THIS RANKED</span><b>' +
          esc(result.reasons.length ? result.reasons.join(" + ").toUpperCase() : "TEXTUAL EVIDENCE") +
          '</b></div><footer><span>' + esc(result.category) + (result.at ? ' // ' + timestamp(result.at) : '') +
          '</span><button data-ask-source="' + result.source + '" data-id="' + result.sourceId +
          '" data-time="' + result.at + '">SHOW ME →</button></footer></article>';
      }).join("") : '<p class="empty-state">No confident match in the current source scope. Try a specific film, a franchise alias, a live topic, “latest,” or a clear opinion.</p>');
    Array.prototype.forEach.call(document.querySelectorAll("#askResults [data-ask-source]"), function (button) {
      button.onclick = function () {
        if (button.getAttribute("data-ask-source") === "livestream") {
          openLiveDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time") || 0));
        } else {
          openDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time") || 0));
        }
      };
    });
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
    renderSoundbytes();
    renderLabs();
    var openModal = document.getElementById("tapeModal").classList.contains("show");
    if (openModal) {
      var params = new URLSearchParams(location.search);
      if (params.get("tape")) openDossier(params.get("tape"), params.get("at"));
      else if (params.get("live")) openLiveDossier(params.get("live"), params.get("at"));
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
    Array.prototype.forEach.call(document.querySelectorAll("[data-sound-source]"), function (button) {
      button.onclick = function () {
        state.soundSource = button.getAttribute("data-sound-source");
        renderSoundFilters();
        renderSoundbytes();
      };
    });
    document.getElementById("soundRoulette").onclick = function () {
      var candidates = soundbytes();
      var item = candidates[Math.floor(Math.random() * candidates.length)];
      if (item) cueSoundbyte(item);
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
    document.getElementById("consoleStatus").textContent = "SCANNING " +
      fmt(deep.meta.wordsAudited + live.meta.wordsAudited) + " WORDS";
    renderProof();
    renderMarquee();
    renderHeroConsole();
    renderCategoryFilters();
    renderHot100();
    renderSoundFilters();
    renderSoundbytes();
    renderLiveProof();
    renderTopicRadar();
    renderStreams();
    renderAskExamples();
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
    else if (params.get("live")) setTimeout(function () { openLiveDossier(params.get("live"), params.get("at")); }, 50);
    else if (location.hash === "#pitch") setTimeout(openTour, 50);
  }

  init();
})();
