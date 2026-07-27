(function (root) {
  "use strict";

  var payload = root.WWAM_YEAR_CANON_2025_2026;
  var doc = root.document;
  if (!doc) return;
  var shell = doc.getElementById("yearCanonSpotlight");
  if (!shell) return;

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function esc(value) {
    return clean(value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function number(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function duration(value) {
    var total = Math.max(0, Math.round(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor(total % 3600 / 60);
    return hours ? hours + "H " + String(minutes).padStart(2, "0") + "M" : minutes + "M";
  }

  function time(value) {
    var total = Math.max(0, Math.round(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor(total % 3600 / 60);
    var seconds = total % 60;
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
      : minutes + ":" + String(seconds).padStart(2, "0");
  }

  function shortDate(value) {
    var parts = clean(value).split("-");
    return parts.length === 3 ? parts[1] + "." + parts[2] + "." + parts[0] : clean(value);
  }

  function route(show, at, section) {
    var url = new URL(root.location.href);
    ["qa", "tape", "live", "at", "section"].forEach(function (key) {
      url.searchParams.delete(key);
    });
    url.searchParams.set("source", show.id);
    if (at != null && Number.isFinite(Number(at))) {
      url.searchParams.set("at", Math.round(Number(at)));
    }
    if (section) url.searchParams.set("section", section);
    url.hash = "archive";
    return url.toString();
  }

  var elements = {
    proof: doc.getElementById("yearCanonProof"),
    years: doc.getElementById("yearCanonYears"),
    modes: doc.getElementById("yearCanonModes"),
    search: doc.getElementById("yearCanonSearch"),
    topics: doc.getElementById("yearCanonTopics"),
    featured: doc.getElementById("yearCanonFeatured"),
    grid: doc.getElementById("yearCanonGrid"),
    status: doc.getElementById("yearCanonStatus"),
    more: doc.getElementById("yearCanonMore")
  };

  var state = { year: "all", mode: "all", query: "", limit: 12 };
  var shows = payload && Array.isArray(payload.showIndex) ? payload.showIndex.slice() : [];
  var meta = payload && payload.meta || {};

  function proof() {
    var cards = [
      [meta.registered, "OFFICIAL 2025–2026 LIVESTREAMS", "Every source in the frozen Streams-feed window."],
      [meta.captionBacked, "INTERACTIVE SHOW WIKIS", "Timestamped topics and source-locked routes."],
      [meta.sourceBriefs, "HONEST CAPTION GAP", "Playable source preserved without invented contents."],
      [meta.hours, "HOURS IN THE TWO-YEAR VAULT", "Cached runtimes across the complete window."],
      [meta.topicDoors, "TOPIC DOORS", "Caption-derived entry points across exact uploads."],
      [meta.momentCandidates, "MOMENT CANDIDATES", "Quarantined until a human checks the tape."]
    ];
    elements.proof.innerHTML = cards.map(function (card) {
      return '<article><b>' + number(card[0]) + '</b><span>' + esc(card[1]) +
        '</span><p>' + esc(card[2]) + '</p></article>';
    }).join("");
  }

  function yearControls() {
    var counts = meta.yearCounts || {};
    var options = [
      ["all", "ALL " + number(meta.registered)],
      ["2026", "2026 // " + number(counts["2026"] && counts["2026"].registered)],
      ["2025", "2025 // " + number(counts["2025"] && counts["2025"].registered)]
    ];
    elements.years.innerHTML = options.map(function (option) {
      return '<button type="button" data-year="' + option[0] + '" aria-pressed="' +
        (state.year === option[0]) + '">' + esc(option[1]) + '</button>';
    }).join("");
  }

  function modeControls() {
    var options = [
      ["all", "ALL SHOWS"], ["wiki", "FULL WIKI"],
      ["up", "WWAM UP IN YA"], ["steves", "STEVE'S ASSHOLE"],
      ["gap", "CAPTION GAP"]
    ];
    elements.modes.innerHTML = options.map(function (option) {
      return '<button type="button" data-mode="' + option[0] + '" aria-pressed="' +
        (state.mode === option[0]) + '">' + esc(option[1]) + '</button>';
    }).join("");
  }

  function topicControls() {
    var topics = (payload.canonTopicIndex || payload.topicIndex || []).slice(0, 12);
    elements.topics.innerHTML = topics.map(function (topic) {
      return '<button type="button" data-topic="' + esc(topic.name) + '"><b>' +
        esc(topic.name) + '</b><span>' + number(topic.shows) + ' SHOWS</span></button>';
    }).join("");
  }

  function matches(show) {
    if (state.year !== "all" && show.year !== state.year) return false;
    if (state.mode === "wiki" && show.wikiState !== "show-wiki") return false;
    if (state.mode === "up" && !show.upInYa) return false;
    if (state.mode === "steves" && !show.steves) return false;
    if (state.mode === "gap" && show.wikiState !== "source-brief") return false;
    var query = clean(state.query).toLowerCase();
    if (!query) return true;
    var haystack = [show.title, show.summary, show.showShape]
      .concat((show.topics || []).map(function (topic) { return topic.name; }))
      .join(" ").toLowerCase();
    return query.split(/\s+/).every(function (term) { return haystack.indexOf(term) >= 0; });
  }

  function card(show, index) {
    var best = show.bestMoment;
    var topicMarkup = (show.topics || []).slice(0, 4).map(function (topic) {
      return '<a href="' + esc(route(show, topic.at, "wiki")) + '">' + esc(topic.name) +
        '<small>' + time(topic.at) + '</small></a>';
    }).join("");
    var proofBadge = show.wikiState === "show-wiki"
      ? '<span class="year-canon-badge is-wiki">FULL SHOW WIKI</span>'
      : '<span class="year-canon-badge is-gap">SOURCE BRIEF // NO CAPTIONS</span>';
    var momentMarkup = best
      ? '<a class="year-canon-moment" href="' + esc(route(show, best.at, "player")) + '">' +
          '<span>BEST MACHINE-SURFACED ROUTE</span><b>' + esc(best.label) + ' // ' + time(best.at) +
          '</b><p>“' + esc(best.excerpt) + '”</p><i>PLAY ON THE EXACT UPLOAD →</i></a>'
      : '<div class="year-canon-moment is-empty"><span>PUBLIC MOMENT ROUTE</span><b>WITHHELD</b>' +
          '<p>' + (show.wikiState === "source-brief"
            ? 'No usable caption track exists, so the page refuses to fabricate highlights.'
            : 'This source is restricted to topic navigation because the audio boundary is unclear.') +
          '</p></div>';
    return '<article class="year-canon-card" style="--card-order:' + index + '">' +
      '<a class="year-canon-art" href="' + esc(route(show, null, "wiki")) + '">' +
        '<img src="' + esc(show.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
        '<div><span>#' + String(show.rank).padStart(3, "0") + ' // ' + shortDate(show.date) +
        '</span>' + proofBadge + '</div></a>' +
      '<div class="year-canon-card-body"><header><span>' + esc(show.showShape) + '</span><b>' +
        duration(show.duration) + ' // ' + number(show.views) + ' CACHED VIEWS</b></header>' +
      '<h4>' + esc(show.title) + '</h4><p class="year-canon-summary">' + esc(show.summary) + '</p>' +
      '<div class="year-canon-topic-row">' + (topicMarkup || '<span>NO PUBLIC TOPIC RECEIPTS</span>') + '</div>' +
      momentMarkup +
      '<footer><div><span><b>' + number(show.wordsAudited) + '</b> WORDS</span>' +
        '<span><b>' + number(show.upInYa) + '</b> UP IN YA</span>' +
        '<span><b>' + number(show.steves) + '</b> STEVE ROUTES</span></div>' +
        '<a href="' + esc(route(show, null, "wiki")) + '">OPEN ' +
          (show.wikiState === "show-wiki" ? 'SHOW WIKI' : 'SOURCE BRIEF') + ' →</a></footer></div></article>';
  }

  function featured() {
    var latest = shows[0];
    var wildest = shows.filter(function (show) { return show.bestMoment; })
      .slice().sort(function (left, right) {
        return (right.bestMoment.heat || 0) - (left.bestMoment.heat || 0) ||
          (right.upInYa + right.steves) - (left.upInYa + left.steves) ||
          right.date.localeCompare(left.date);
      })[0];
    var picks = [["THE NEWEST TAPE", latest], ["RED-BAND ENTRY POINT", wildest]];
    elements.featured.innerHTML = picks.map(function (pick) {
      var show = pick[1];
      if (!show) return "";
      var at = show.bestMoment && show.bestMoment.at;
      return '<a href="' + esc(route(show, at, at != null ? "player" : "wiki")) + '">' +
        '<img src="' + esc(show.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
        '<div><span>' + esc(pick[0]) + '</span><b>' + esc(show.title) + '</b><p>' +
        esc(show.bestMoment ? show.bestMoment.label + ' // ' + time(show.bestMoment.at) : show.summary) +
        '</p><i>OPEN THE RECEIPT →</i></div></a>';
    }).join("");
  }

  function render() {
    var filtered = shows.filter(matches);
    var visible = filtered.slice(0, state.limit);
    elements.grid.innerHTML = visible.map(card).join("") ||
      '<div class="year-canon-empty"><b>NO TAPE MATCHED THAT COMBINATION.</b>' +
      '<p>Try another year, lane, or title/topic search.</p></div>';
    elements.status.textContent = number(visible.length) + " SHOWN // " + number(filtered.length) +
      " MATCHED // " + number(meta.captionBacked) + " INTERACTIVE WIKIS IN THE COMPLETE WINDOW";
    elements.more.hidden = visible.length >= filtered.length;
    elements.more.textContent = "OPEN " + number(Math.min(12, filtered.length - visible.length)) + " MORE SHOWS";
    yearControls();
    modeControls();
  }

  function bind() {
    shell.addEventListener("click", function (event) {
      var yearButton = event.target.closest("[data-year]");
      if (yearButton) {
        state.year = yearButton.getAttribute("data-year"); state.limit = 12; render(); return;
      }
      var modeButton = event.target.closest("[data-mode]");
      if (modeButton) {
        state.mode = modeButton.getAttribute("data-mode"); state.limit = 12; render(); return;
      }
      var topicButton = event.target.closest("[data-topic]");
      if (topicButton) {
        state.query = topicButton.getAttribute("data-topic"); elements.search.value = state.query;
        state.limit = 12; render();
      }
    });
    elements.search.addEventListener("input", function () {
      state.query = elements.search.value; state.limit = 12; render();
    });
    elements.more.addEventListener("click", function () {
      state.limit += 12; render();
    });
  }

  function fail(message) {
    shell.setAttribute("aria-busy", "false");
    shell.setAttribute("data-ready", "false");
    elements.status.textContent = clean(message || "RECENT CANON COULD NOT INITIALIZE");
  }

  try {
    if (!payload || payload.schema !== "shokker-youtube-wiki/year-canon/v1" ||
        shows.length !== 131 || Number(meta.captionBacked) !== 130) {
      throw new Error("RECENT CANON MANIFEST DID NOT RECONCILE");
    }
    proof(); topicControls(); featured(); bind(); render();
    shell.setAttribute("aria-busy", "false");
    shell.setAttribute("data-ready", "true");
  } catch (error) {
    fail(error && error.message);
  }
})(typeof window !== "undefined" ? window : globalThis);
