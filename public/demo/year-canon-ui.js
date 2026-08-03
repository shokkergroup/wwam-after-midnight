(function (root) {
  "use strict";

  var payload = root.WWAM_YEAR_CANON_2025_2026;
  var doc = root.document;
  root.WWAMYearCanonUI = Object.freeze({
    applyRecoveryOverlay: applyRecoveryOverlay,
    displayText: displayText,
    momentExcerpt: momentExcerpt,
    observeLanguage: observeLanguage
  });
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

  function listNames(values) {
    var names = values.filter(Boolean);
    if (names.length < 2) return names[0] || "";
    if (names.length === 2) return names[0] + " and " + names[1];
    return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
  }

  function momentExcerpt(moment) {
    var raw = clean(moment && moment.excerpt);
    var transport = /(?:^|\s)(?:>>+|-->|<\/?(?:c|v|lang)\b)|\[(?:BLEEP|laughter|music|applause|cheering)\]/i.test(raw);
    var repeated = /\b([A-Za-z][A-Za-z'-]*)\s+\1(?:\s+\1)+\b/i.test(raw);
    var machineRoom = /automatic[- ]caption|machine[- ]surfaced|source[- ]local|caption[- ](?:backed|derived|ledger)|speaker(?:s)?\s+(?:unverified|not confirmed)|evidence|receipt/i.test(raw);
    if (raw && raw.length >= 28 && !transport && !repeated && !machineRoom) return raw;
    var label = clean(moment && (moment.label || moment.category)) || "This saved moment";
    var at = time(moment && moment.at);
    return label + " is indexed at " + at + ". Press play for the actual exchange.";
  }

  function cloneMeta(value) {
    var source = value || {};
    var counts = source.yearCounts || {};
    return Object.assign({}, source, {
      yearCounts: Object.keys(counts).reduce(function (output, year) {
        output[year] = Object.assign({}, counts[year]);
        return output;
      }, {})
    });
  }

  function applyRecoveryOverlay(canonPayload, completionPayload) {
    var shows = canonPayload && Array.isArray(canonPayload.showIndex)
      ? canonPayload.showIndex.slice() : [];
    var meta = cloneMeta(canonPayload && canonPayload.meta);
    var completionStreams = completionPayload && Array.isArray(completionPayload.streams)
      ? completionPayload.streams : [];
    var recovered = [];

    completionStreams.forEach(function (stream) {
      var showIndex = shows.findIndex(function (show) {
        return show.id === stream.id && show.wikiState === "source-brief";
      });
      if (showIndex < 0 || stream.captioned !== true ||
          !(stream.topics || []).length || !(Number(stream.wordsAudited) > 0)) return;

      var base = shows[showIndex];
      var topics = (stream.topics || []).map(function (topic) {
        var at = Number.isFinite(Number(topic.at)) ? Number(topic.at) : Number(topic.peak);
        return {
          name: clean(topic.name),
          at: Math.max(0, Math.round(Number(at) || 0)),
          mentions: Math.max(0, Math.round(Number(topic.mentions) || 0)),
          receipt: clean(topic.receipt)
        };
      }).filter(function (topic) { return topic.name; });
      var moments = (stream.moments || []).filter(function (moment) {
        return Number.isFinite(Number(moment.at != null ? moment.at : moment.t));
      }).map(function (moment) {
        return {
          at: Math.max(0, Math.round(Number(moment.at != null ? moment.at : moment.t))),
          label: clean(moment.category || "PLAYABLE MOMENT"),
          excerpt: clean(moment.excerpt),
          heat: Math.max(0, Math.round(Number(moment.heat) || 0))
        };
      });
      var bestMoment = moments.slice().sort(function (left, right) {
        return right.heat - left.heat || left.at - right.at;
      })[0] || null;
      var upInYa = moments.filter(function (moment) {
        return moment.label.toUpperCase().indexOf("UP IN YA") >= 0;
      }).length;
      var steves = moments.filter(function (moment) {
        return moment.label.toUpperCase().indexOf("STEVE") >= 0;
      }).length;

      shows[showIndex] = Object.assign({}, base, {
        wikiState: "show-wiki",
        coverage: "source-backed-local-asr",
        wordsAudited: Number(stream.wordsAudited) || 0,
        summary: clean(stream.summary || base.summary),
        showShape: clean(stream.editorial && stream.editorial.showShape || base.showShape),
        topics: topics,
        bestMoment: bestMoment,
        upInYa: upInYa,
        steves: steves,
        restricted: Boolean(stream.rightsPolicy &&
          stream.rightsPolicy.restrictedToTopicNavigation),
        contentMode: clean(stream.contentMode || base.contentMode)
      });

      meta.captionBacked = Number(meta.captionBacked || 0) + 1;
      meta.sourceBriefs = Math.max(0, Number(meta.sourceBriefs || 0) - 1);
      meta.wordsAudited = Number(meta.wordsAudited || 0) +
        Number(stream.wordsAudited || 0) - Number(base.wordsAudited || 0);
      meta.topicDoors = Number(meta.topicDoors || 0) +
        topics.length - (base.topics || []).length;
      meta.momentCandidates = Number(meta.momentCandidates || 0) + moments.length;
      meta.upInYa = Number(meta.upInYa || 0) + upInYa - Number(base.upInYa || 0);
      meta.straightToSteves = Number(meta.straightToSteves || 0) +
        steves - Number(base.steves || 0);
      var year = String(base.year || "").trim();
      if (year && meta.yearCounts[year]) {
        meta.yearCounts[year].captionBacked =
          Number(meta.yearCounts[year].captionBacked || 0) + 1;
        meta.yearCounts[year].sourceBriefs = Math.max(
          0, Number(meta.yearCounts[year].sourceBriefs || 0) - 1
        );
      }
      recovered.push(stream.id);
    });

    return { shows: shows, meta: meta, recovered: recovered };
  }

  function fanSummary(show) {
    if (show.wikiState === "source-brief") {
      return "The official upload is here, but its captions aren't usable yet. Watch it from the start while we leave the recap blank.";
    }
    var introductions = {
      "OPEN-LINE MOVIE NEWS": "A loose movie-news night",
      "RANKING NIGHT": "A ranking night",
      "RETRO REWIND": "A Retro Rewind hangout",
      "TOURNAMENT NIGHT": "A head-to-head movie fight",
      "SPOILER COURT": "A spoiler-heavy deep dive",
      "TRAILER EMERGENCY": "A trailer reaction night"
    };
    var intro = introductions[show.showShape] || "A WWAM livestream";
    var names = (show.topics || []).slice(0, 3).map(function (topic) { return clean(topic.name); });
    if (!names.length) return intro + ". Open the Show Wiki and start from the beginning.";
    return intro + " with " + listNames(names) + " on the table. Pick a topic below or jump to the moment we'd play first.";
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
  var languageObserver = null;
  var recovery = applyRecoveryOverlay(payload, root.WWAM_ARCHIVE_COMPLETION);
  var shows = recovery.shows;
  var meta = recovery.meta;

  function proof() {
    var cards = [
      [meta.registered, "SHOWS ON THE SHELF", "Every official livestream from 2025 and 2026."],
      [meta.captionBacked, "SHOW WIKIS", "Recaps, topics, and playable moments from the original show."],
      [meta.topicDoors, "TOPIC JUMPS", "Open the original upload at the exact conversation."],
      [meta.sourceBriefs, "SHOW WIKIS STILL HELD", Number(meta.sourceBriefs)
        ? "A source stays watch-only when exact evidence is unavailable."
        : "Every 2025–2026 show now has a source-backed Show Wiki."]
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
      ["all", "ALL SHOWS"], ["wiki", "SHOW WIKIS"],
      ["up", "WWAM UP IN YA"], ["steves", "STEVE'S ASSHOLE"]
    ];
    if (Number(meta.sourceBriefs) > 0) options.push(["gap", "WATCH ONLY"]);
    elements.modes.innerHTML = options.map(function (option) {
      return '<button type="button" data-mode="' + option[0] + '" aria-pressed="' +
        (state.mode === option[0]) + '">' + esc(displayText(option[1], doc)) + '</button>';
    }).join("");
  }

  function topicControls() {
    var topics = (payload.canonTopicIndex || payload.topicIndex || []).slice(0, 12);
    elements.topics.innerHTML = topics.map(function (topic) {
      return '<button type="button" data-topic="' + esc(topic.name) + '"><b>' +
        esc(displayText(topic.name, doc)) + '</b><span>' + number(topic.shows) + ' SHOWS</span></button>';
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
      return '<a href="' + esc(route(show, topic.at, "wiki")) + '">' +
        esc(displayText(topic.name, doc)) + '<small>' + time(topic.at) + '</small></a>';
    }).join("");
    var proofBadge = show.wikiState === "show-wiki"
      ? '<span class="year-canon-badge is-wiki">SHOW WIKI</span>'
      : '<span class="year-canon-badge is-gap">WATCH ONLY</span>';
    var momentMarkup = best
      ? '<a class="year-canon-moment" href="' + esc(route(show, best.at, "player")) + '">' +
          '<span>START WITH THIS MOMENT</span><b>' + esc(displayText(best.label, doc)) +
          ' // ' + time(best.at) + '</b><p>&ldquo;' +
          esc(displayText(momentExcerpt(best), doc)) +
          '&rdquo;</p><i>PLAY THIS PART &rarr;</i></a>'
      : '<div class="year-canon-moment is-empty"><span>WATCH THIS SHOW</span><b>NO QUICK JUMP YET</b>' +
          '<p>' + (show.wikiState === "source-brief"
            ? 'This upload has no usable captions, so it stays watch-only.'
            : 'Open the full show and use the topic jumps above to find your way around.') +
          '</p></div>';
    return '<article class="year-canon-card" style="--card-order:' + index + '">' +
      '<a class="year-canon-art" href="' + esc(route(show, null, "wiki")) + '">' +
        '<img src="' + esc(show.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
        '<div><span>#' + String(show.rank).padStart(3, "0") + ' // ' + shortDate(show.date) +
        '</span>' + proofBadge + '</div></a>' +
      '<div class="year-canon-card-body"><header><span>' +
        esc(displayText(show.showShape, doc)) + '</span><b>' +
        duration(show.duration) + ' // ' + number(show.views) + ' VIEWS WHEN ADDED</b></header>' +
      '<h4>' + esc(displayText(show.title, doc)) +
      '</h4><p class="year-canon-summary">' + esc(displayText(fanSummary(show), doc)) + '</p>' +
      '<div class="year-canon-topic-row">' + (topicMarkup || '<span>TOPIC JUMPS AREN&#39;T AVAILABLE FOR THIS SHOW</span>') + '</div>' +
      momentMarkup +
      '<footer><div><span><b>' + number((show.topics || []).length) + '</b> TOPIC JUMPS</span>' +
        '<span><b>' + number(show.upInYa) + '</b> UP IN YA</span>' +
        '<span><b>' + number(show.steves) + '</b> ' +
          esc(displayText("STEVE\'S ASSHOLE", doc)) + '</span></div>' +
        '<a href="' + esc(route(show, null, "wiki")) + '">OPEN ' +
          (show.wikiState === "show-wiki" ? 'SHOW WIKI' : 'WATCH-ONLY PAGE') + ' &rarr;</a></footer></div></article>';
  }
  function featured() {
    var latest = shows[0];
    var wildest = shows.filter(function (show) { return show.bestMoment; })
      .slice().sort(function (left, right) {
        return (right.bestMoment.heat || 0) - (left.bestMoment.heat || 0) ||
          (right.upInYa + right.steves) - (left.upInYa + left.steves) ||
          right.date.localeCompare(left.date);
      })[0];
    var picks = [["NEWEST SHOW", latest], ["START HERE", wildest]];
    elements.featured.innerHTML = picks.map(function (pick) {
      var show = pick[1];
      if (!show) return "";
      var at = show.bestMoment && show.bestMoment.at;
      return '<a href="' + esc(route(show, at, at != null ? "player" : "wiki")) + '">' +
        '<img src="' + esc(show.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' +
        '<div><span>' + esc(pick[0]) + '</span><b>' +
        esc(displayText(show.title, doc)) + '</b><p>' +
        esc(displayText(show.bestMoment ? show.bestMoment.label + ' // ' +
          time(show.bestMoment.at) : show.summary, doc)) +
        '</p><i>' + (at != null ? 'PLAY THIS PART' : 'OPEN SHOW WIKI') + ' &rarr;</i></div></a>';
    }).join("");
  }
  function render() {
    var filtered = shows.filter(matches);
    var visible = filtered.slice(0, state.limit);
    elements.grid.innerHTML = visible.map(card).join("") ||
      '<div class="year-canon-empty"><b>NOTHING ON THIS SHELF MATCHES YET.</b>' +
      '<p>Try another year, category, title, or topic.</p></div>';
    elements.status.textContent = number(visible.length) + " SHOWS ON SCREEN // " + number(filtered.length) +
      " MATCH THIS VIEW // " + number(meta.captionBacked) + " SHOW WIKIS";
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
    elements.status.textContent = clean(message || "THE 2025-2026 SHELF COULD NOT OPEN");
  }

  try {
    if (!payload || payload.schema !== "shokker-youtube-wiki/year-canon/v1" ||
        shows.length !== 131 || Number(meta.captionBacked) !== 131 ||
        Number(meta.sourceBriefs) !== 0) {
      throw new Error("THE 2025-2026 SHOW SHELF IS TEMPORARILY UNAVAILABLE");
    }
    proof(); topicControls(); featured(); bind(); render();
    languageObserver = observeLanguage(doc, function () {
      proof();
      topicControls();
      featured();
      render();
    });
    shell.setAttribute("aria-busy", "false");
    shell.setAttribute("data-ready", "true");
  } catch (error) {
    fail(error && error.message);
  }
})(typeof window !== "undefined" ? window : globalThis);
