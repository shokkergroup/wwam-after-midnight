(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var REQUIRED_ENGINE_METHODS = [
    "getStats",
    "getCoverage",
    "getBuckets",
    "getFilterOptions",
    "getRecord",
    "browse",
    "search",
    "getDistillQueue",
    "getProvenance",
  ];
  var ARCHIVE_QUERY = /\b(uploads?|uploaded|streams?|streamed|livestreams?|videos?|archive|feed)\b/i;
  var STOP_WORDS = new Set([
    "a", "an", "and", "are", "archive", "did", "do", "feed", "find", "for", "from",
    "has", "have", "i", "in", "is", "latest", "list", "live", "livestream",
    "livestreams", "made", "make", "me", "most", "newest", "of", "oldest", "on",
    "popular", "recent", "show", "shows", "stream", "streamed", "streams", "the",
    "their", "them", "they", "to", "upload", "uploaded", "uploads", "video",
    "videos", "viewed", "was", "watched", "we", "were", "what", "when", "where",
    "which", "who", "with", "year",
  ]);
  var COVERAGE_COPY = {
    "deeply-indexed": "CAPTION-BACKED DISTILL AVAILABLE",
    "metadata-only": "TITLE / DATE / DURATION / VIEWS ONLY",
    "caption-limited": "SOURCE KNOWN // NO USABLE CAPTION PATH",
    "unavailable": "SOURCE RECORD INCOMPLETE",
  };
  var LANE_COPY = {
    "fresh-10": "FRESH 10",
    "popular-25": "POPULAR 25",
    "archive-deep-10": "AUTOPSIED BATCH 01",
    "archive-deep-batch-02": "ARCHIVE DEEP BATCH 02",
    "commentary-catalog": "COMMENTARY",
    "archive-metadata": "ARCHIVE RECORD",
  };

  function clean(value) { return String(value == null ? "" : value).replace(/\s+/g, " ").trim(); }
  function serialCopy(value) { return JSON.parse(JSON.stringify(value)); }

  function normalized(value) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

  function fallbackEscape(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fallbackNumber(value) { return Number(value || 0).toLocaleString("en-US"); }

  function fallbackDuration(seconds) {
    var total = Math.max(0, Number(seconds) || 0);
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    return hours ? hours + "H " + String(minutes).padStart(2, "0") + "M" : minutes + "M";
  }

  function fallbackDate(value) { return clean(value); }

  function validEngine(engine) { return Boolean(engine) && REQUIRED_ENGINE_METHODS.every(function (method) {
      return typeof engine[method] === "function";
    }); }

  function metadataCompare(mode) {
    return function (left, right) {
      if (mode === "views") {
        return Number(right.views || 0) - Number(left.views || 0)
          || String(right.date).localeCompare(String(left.date))
          || String(left.id).localeCompare(String(right.id));
      }
      if (mode === "oldest") {
        return String(left.date).localeCompare(String(right.date))
          || String(left.id).localeCompare(String(right.id));
      }
      return String(right.date).localeCompare(String(left.date))
        || Number(right.views || 0) - Number(left.views || 0)
        || String(left.id).localeCompare(String(right.id));
    };
  }

  function create(options) {
    var input = options || {};
    var engine = input.engine || null;
    if (engine && !validEngine(engine)) {
      throw new Error("Archive Atlas UI received an incompatible engine");
    }
    var archiveDeepEngine = input.archiveDeepEngine || null;

    var formatNumber = typeof input.formatNumber === "function" ? input.formatNumber : fallbackNumber,
      formatDuration = typeof input.formatDuration === "function" ? input.formatDuration : fallbackDuration,
      formatDate = typeof input.formatDate === "function" ? input.formatDate : fallbackDate,
      escapeHtml = typeof input.escapeHtml === "function" ? input.escapeHtml : fallbackEscape,
      isInternal = typeof input.isInternal === "function" ? input.isInternal : function () { return false; },
      openRecord = typeof input.openRecord === "function" ? input.openRecord : function () {},
      downloadJson = typeof input.downloadJson === "function" ? input.downloadJson : function () {},
      showToast = typeof input.showToast === "function" ? input.showToast : function () {},
      documentRef = input.document || (typeof document !== "undefined" ? document : null);
    var frame = typeof root.requestAnimationFrame === "function" ?
      root.requestAnimationFrame.bind(root) : function (work) { return setTimeout(work, 0); };

    var state = { query: "", year: "", month: "", coverage: "", limit: 18,
      busy: !engine, error: "", mounted: false, lastTotal: 0, lastShown: 0 };
    var removeListeners = [];
    var api;

    function byId(id) {
      return documentRef && documentRef.getElementById(id);
    }

    function listen(node, event, handler) {
      if (!node || typeof node.addEventListener !== "function") return;
      node.addEventListener(event, handler);
      removeListeners.push(function () {
        node.removeEventListener(event, handler);
      });
    }

    function snapshotDate() {
      if (!engine) return "THE CACHED SNAPSHOT";
      return clean(engine.getProvenance().snapshotDate) || "THE CACHED SNAPSHOT";
    }

    function queueFormulaCopy() {
      var formula = engine && (engine.formula || engine.getDistillQueue({ limit: 0 }).formula);
      if (!formula) {
        return "DISTILL PRIORITY LOADS WITH THE ARCHIVE LEDGER. NO CONTENT SCORE IS INFERRED FROM A TITLE.";
      }
      return clean(formula.version) + ": " + clean(formula.popularity) + "; "
        + clean(formula.recency) + "; " + clean(formula.franchise)
        + ". Missing evidence determines eligibility; it adds no points. "
        + "Metadata-only uploads receive no transcript, speaker, sentiment, humor, or topic score.";
    }

    function getCopy() {
      var date = snapshotDate();
      return {
        snapshot: "Every card below was present in the official Streams-feed snapshot cached through "
          + date + ". Current availability was not rechecked.",
        boundary: "A cached title, thumbnail and upload date establish a snapshot record, not what anyone said inside it.",
        queue: queueFormulaCopy(),
      };
    }

    function applyTruthCopy() {
      if (!documentRef) return;
      var copy = getCopy();
      var kicker = documentRef.querySelector(".archive-atlas .kicker");
      var description = documentRef.querySelector(".archive-atlas > .section-head > p");
      var queueDescription = documentRef.querySelector(".archive-queue > header > p");
      if (kicker) {
        kicker.textContent = "OFFICIAL STREAMS-FEED SNAPSHOT // CACHED THROUGH "
          + snapshotDate().toUpperCase() + " // BLIND SPOTS LEFT VISIBLE";
      }
      if (description) description.textContent = copy.snapshot + " " + copy.boundary;
      if (queueDescription) queueDescription.textContent = copy.queue;
    }

    function staticControls() {
      return [
        byId("archiveSearch"),
        byId("archiveReset"),
        byId("archiveLoadMore"),
        byId("archiveQueueDownload"),
      ].filter(Boolean);
    }

    function setControlsDisabled(disabled) {
      staticControls().forEach(function (control) {
        control.disabled = Boolean(disabled);
        control.setAttribute("aria-disabled", String(Boolean(disabled)));
      });
      if (!documentRef) return;
      Array.prototype.forEach.call(
        documentRef.querySelectorAll(
          "[data-archive-year], [data-archive-month], [data-archive-coverage], [data-archive-open]"
        ),
        function (control) {
          control.disabled = Boolean(disabled);
          control.setAttribute("aria-disabled", String(Boolean(disabled)));
        }
      );
    }

    function announce(message) {
      var status = byId("archiveStatus");
      if (!status) return;
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-atomic", "true");
      status.textContent = clean(message);
    }

    function setBusy(busy, message) {
      state.busy = Boolean(busy);
      var section = byId("archive");
      if (section) section.setAttribute("aria-busy", String(state.busy));
      setControlsDisabled(state.busy || Boolean(state.error));
      if (message) announce(message);
      var more = byId("archiveLoadMore");
      if (more && state.busy) more.hidden = true;
      return api;
    }

    function setError(message) {
      state.error = clean(message) || "ARCHIVE LEDGER LOAD FAILED";
      state.busy = false;
      var section = byId("archive");
      if (section) section.setAttribute("aria-busy", "false");
      setControlsDisabled(true);
      announce(state.error);
      var grid = byId("archiveGrid");
      if (grid) {
        grid.innerHTML = '<p class="archive-empty">THE CACHED ARCHIVE LEDGER COULD NOT BE OPENED. '
          + "THE REST OF THE MEMORY SYSTEM REMAINS AVAILABLE.</p>";
      }
      return api;
    }

    function coverageLabel(record) {
      return COVERAGE_COPY[record.coverage] || "COVERAGE STATUS UNKNOWN";
    }

    function laneLabel(record) {
      return (record.lanes || []).map(function (lane) {
        return LANE_COPY[lane] || clean(lane).toUpperCase();
      }).join(" + ");
    }

    function card(record) {
      var internal = Boolean(isInternal(record));
      var action = internal
        ? '<button type="button" data-archive-open="' + escapeHtml(record.id) + '">'
          + (record.coverage === "deeply-indexed" ? "OPEN DEEP MAP" : "OPEN SOURCE DOSSIER")
          + " &rarr;</button>"
        : '<a href="' + escapeHtml(record.url) + '" target="_blank" rel="noopener">'
          + "OPEN ORIGINAL &#8599;</a>";
      var depthClass = record.coverage === "deeply-indexed"
        ? "deep"
        : record.coverage === "caption-limited" ? "limited" : "metadata";
      return '<article class="archive-card is-' + depthClass + '">'
        + '<div class="archive-card-media"><img loading="lazy" src="'
        + escapeHtml(record.thumbnail) + '" alt="'
        + escapeHtml(record.title + " YouTube thumbnail") + '"><span>'
        + escapeHtml(formatDuration(record.duration)) + "</span></div>"
        + '<div class="archive-card-body"><div class="archive-card-kicker"><span>'
        + escapeHtml(formatDate(record.date)) + "</span><b>"
        + escapeHtml(formatNumber(record.views)) + " CACHED VIEWS</b></div><h4>"
        + escapeHtml(record.title) + '</h4><div class="archive-depth"><i></i><span>'
        + escapeHtml(coverageLabel(record)) + "</span></div><footer><span>"
        + escapeHtml(laneLabel(record)) + "</span>" + action + "</footer></div></article>";
    }

    function renderProof() {
      var node = byId("archiveProof");
      if (!node) return;
      if (!engine) {
        node.innerHTML = "<div><b>STANDBY</b><span>THE 472-RECORD CACHED LEDGER IS STILL LOADING</span></div>";
        return;
      }
      var stats = engine.getStats();
      var coverage = stats.coverage || {};
      var rows = [
        [formatNumber(stats.records), "CACHED FEED RECORDS", ""],
        [formatNumber(stats.viewsAtSnapshot), "CACHED VIEW SNAPSHOT", ""],
        [formatNumber(stats.hours) + "H", "CACHED RUNTIME", ""],
        [coverage["deeply-indexed"] || 0, "CAPTION-BACKED DISTILLS", "archive-proof-cold"],
        [coverage["metadata-only"] || 0, "METADATA-ONLY RECORDS", ""],
        [stats.deepCoveragePercent + "%", "DEEP COVERAGE // GAPS VISIBLE", "archive-proof-cold"],
      ];
      node.innerHTML = rows.map(function (row) {
        return '<div class="' + row[2] + '"><b>' + escapeHtml(row[0])
          + "</b><span>" + escapeHtml(row[1]) + "</span></div>";
      }).join("");
    }

    function monthsForYear(year) {
      if (!engine || !year) return [];
      var match;
      engine.getBuckets().some(function (decade) {
        return decade.years.some(function (row) {
          if (String(row.year) !== String(year)) return false;
          match = row;
          return true;
        });
      });
      return match ? match.months : [];
    }

    function renderFilters() {
      if (!engine) return;
      var options = engine.getFilterOptions();
      var coverage = engine.getCoverage();
      var coverageCounts = coverage.statuses.reduce(function (output, status) {
        output[status.id] = status.count;
        return output;
      }, {});
      var years = byId("archiveYears");
      var months = byId("archiveMonths");
      var depths = byId("archiveCoverage");
      if (years) {
        years.innerHTML = '<button type="button" class="' + (!state.year ? "on" : "")
          + '" data-archive-year="" aria-pressed="' + String(!state.year) + '">ALL <b>'
          + engine.getStats().records + "</b></button>"
          + options.years.map(function (row) {
            var active = String(state.year) === String(row.value);
            return '<button type="button" class="' + (active ? "on" : "")
              + '" data-archive-year="' + escapeHtml(row.value)
              + '" aria-pressed="' + String(active) + '">' + escapeHtml(row.label)
              + " <b>" + row.count + "</b></button>";
          }).join("");
      }
      var monthRows = monthsForYear(state.year);
      if (months) {
        months.innerHTML = state.year
          ? '<button type="button" class="' + (!state.month ? "on" : "")
            + '" data-archive-month="" aria-pressed="' + String(!state.month) + '">ALL</button>'
            + monthRows.map(function (row) {
              var active = state.month === row.month;
              return '<button type="button" class="' + (active ? "on" : "")
                + '" data-archive-month="' + escapeHtml(row.month)
                + '" aria-pressed="' + String(active) + '">'
                + escapeHtml(row.label.replace(" " + state.year, ""))
                + " <b>" + row.count + "</b></button>";
            }).join("")
          : "<span>CHOOSE A YEAR TO OPEN ITS MONTHS.</span>";
      }
      if (depths) {
        depths.innerHTML = '<button type="button" class="' + (!state.coverage ? "on" : "")
          + '" data-archive-coverage="" aria-pressed="' + String(!state.coverage)
          + '">ALL DEPTHS <b>' + engine.getStats().records + "</b></button>"
          + options.coverage.map(function (row) {
            var active = state.coverage === row.value;
            return '<button type="button" class="' + (active ? "on" : "")
              + '" data-archive-coverage="' + escapeHtml(row.value)
              + '" aria-pressed="' + String(active) + '">' + escapeHtml(row.label)
              + " <b>" + Number(coverageCounts[row.value] || 0) + "</b></button>";
          }).join("");
      }
      var scope = byId("archiveScope");
      if (scope) scope.textContent = String(state.month || state.year || "ALL CACHED YEARS").toUpperCase();
      setControlsDisabled(state.busy || Boolean(state.error));
    }

    function archiveFilters(extra) {
      return Object.assign({
        year: state.year || undefined,
        month: state.month || undefined,
        coverage: state.coverage || undefined,
        sort: "newest",
      }, extra || {});
    }

    function archiveResult() {
      var filters = archiveFilters({ limit: Math.min(state.limit, 200) });
      return state.query
        ? engine.search(state.query, filters)
        : engine.browse(Object.assign({}, filters, { limit: state.limit }));
    }

    function renderGrid() {
      if (!engine || state.busy || state.error) return;
      var result = archiveResult();
      var records = result.records || result.results || [];
      var total = Number(result.total || 0);
      state.lastTotal = total;
      state.lastShown = records.length;
      announce(records.length + " SHOWN // " + total + " MATCHED // CACHED SNAPSHOT " + snapshotDate());
      var grid = byId("archiveGrid");
      if (grid) {
        grid.innerHTML = records.length
          ? records.map(card).join("")
          : '<p class="archive-empty">THE TELESCOPE FOUND NO CACHED-TITLE MATCH. '
            + "TRY ANOTHER TITLE TERM, YEAR, MONTH, OR EVIDENCE DEPTH.</p>";
      }
      var more = byId("archiveLoadMore");
      if (more) {
        more.hidden = records.length >= total || (Boolean(state.query) && records.length >= 200);
        more.disabled = false;
        more.setAttribute("aria-disabled", "false");
      }
    }

    function renderQueue() {
      if (!engine || state.busy || state.error) return;
      var queue = engine.getDistillQueue({ limit: 10 });
      var node = byId("archiveQueue");
      if (!node) return;
      node.innerHTML = queue.records.map(function (record) {
        var priority = record.priority || {};
        var breakdown = priority.breakdown || {};
        var signals = (priority.signals || []).map(function (signal) {
          return signal.label;
        }).join(" + ") || "NO CONFIGURED FRANCHISE TITLE MATCH";
        return '<article class="archive-queue-card"><div><span>#'
          + String(priority.rank || 0).padStart(2, "0") + " NEXT</span><b>"
          + Number(priority.score || 0).toFixed(1) + "</b></div><h4>"
          + escapeHtml(record.title) + "</h4><p>" + escapeHtml(signals)
          + " // CACHED TITLE METADATA ONLY</p>"
          + '<div class="archive-queue-signals"><span>VIEW GRAVITY <b>'
          + Number(breakdown.popularity || 0).toFixed(1)
          + " / 50</b></span><span>RECENCY <b>"
          + Number(breakdown.recency || 0).toFixed(1)
          + " / 30</b></span><span>FRANCHISE TITLE <b>"
          + Number(breakdown.franchise || 0).toFixed(1)
          + ' / 20</b></span></div><a href="' + escapeHtml(record.url)
          + '" target="_blank" rel="noopener">INSPECT ORIGINAL &#8599;</a></article>';
      }).join("");
    }

    function renderBatch() {
      var node = byId("archiveBatch");
      if (!node || !archiveDeepEngine) return;
      var meta = archiveDeepEngine.getMetrics();
      var batches = archiveDeepEngine.getSelection();
      var streams = archiveDeepEngine.browse({ sort: "priority" }).records;
      if (!streams.length) return;
      var metrics = [
        [meta.streams, "SOURCES DISTILLED"],
        [formatNumber(meta.snapshotViews), "CACHED SNAPSHOT VIEWS"],
        [meta.topicLanes + " / " + meta.distinctTopics, "TOPIC LANES / DISTINCT TOPICS"],
        [meta.characterSignals, "CHARACTER-SIGNAL RECORDS"],
        [meta.restricted, "TOPIC-ONLY FIREWALLS"],
        [meta.visualContextUnverified, "VISUAL-CONTEXT UNVERIFIED"],
      ].map(function (metric) {
        return "<div><b>" + escapeHtml(metric[0]) + "</b><span>" +
          metric[1] + "</span></div>";
      }).join("");
      node.hidden = false;
      node.innerHTML = '<header><div><span>CURRENT 20-SOURCE OVERLAY // TWO INDEPENDENTLY FINGERPRINTED BATCHES</span>' +
        '<h3>THE ARCHIVE DEEP PORTFOLIO.</h3></div><p>' +
        Number(meta.hours || 0).toFixed(1) + "H // " +
        escapeHtml(formatNumber(meta.wordsAudited || 0)) + " WORDS // " +
        escapeHtml(formatNumber(meta.captionEvents || 0)) + " EVENTS // " +
        escapeHtml(formatNumber(meta.publicMomentCandidates || 0)) +
        " QUARANTINED CANDIDATES.</p></header>" +
        '<div class="archive-batch-metrics">' + metrics + "</div>" +
        '<p class="archive-batch-fingerprints">' + batches.map(function (batch) {
          return "B0" + batch.sequence + " " + batch.publicFnv1a;
        }).join(" // ") + " // CHANGE DETECTION, NOT AUTHENTICATION.</p>" +
        '<div class="archive-batch-strip">' + streams.map(function (stream) {
          var batch = stream.archiveBatch;
          var visual = stream.rightsPolicy.mode === "visual-context-unverified" ?
            " // VISUAL RESULT UNVERIFIED" : "";
          return '<button type="button" data-archive-open="' + escapeHtml(stream.id) +
            '"><img loading="lazy" src="' + escapeHtml(stream.thumbnail) +
            '" alt=""><span>BATCH 0' + batch.sequence +
            " // BATCH-LOCAL PRIORITY #" + String(batch.batchRank).padStart(2, "0") +
            " // PORTFOLIO #" + String(batch.portfolioRank).padStart(2, "0") +
            '</span><b>' + escapeHtml(stream.title) + "</b><small>ATLAS SCORE " +
            Number(stream.archivePriority.score || 0).toFixed(1) +
            " // " + escapeHtml(formatNumber(stream.views || 0)) +
            " CACHED VIEWS" + escapeHtml(visual) + "</small></button>";
        }).join("") + "</div>";
    }

    function renderAll() {
      applyTruthCopy();
      renderProof();
      if (!engine) return;
      renderFilters();
      renderGrid();
      renderBatch();
      renderQueue();
    }

    function focusGenerated(attribute, value) {
      if (!documentRef) return;
      frame(function () {
        var controls = documentRef.querySelectorAll("[" + attribute + "]");
        Array.prototype.some.call(controls, function (control) {
          if (control.getAttribute(attribute) !== value) return false;
          control.focus();
          return true;
        });
      });
    }

    function handleSectionClick(event) {
      var target = event.target && event.target.closest ? event.target.closest("button") : null;
      if (!target || state.busy || state.error) return;
      if (target.hasAttribute("data-archive-year")) {
        state.year = target.getAttribute("data-archive-year");
        state.month = "";
        state.limit = 18;
        renderFilters();
        renderGrid();
        focusGenerated("data-archive-year", state.year);
      } else if (target.hasAttribute("data-archive-month")) {
        state.month = target.getAttribute("data-archive-month");
        state.limit = 18;
        renderFilters();
        renderGrid();
        focusGenerated("data-archive-month", state.month);
      } else if (target.hasAttribute("data-archive-coverage")) {
        state.coverage = target.getAttribute("data-archive-coverage");
        state.limit = 18;
        renderFilters();
        renderGrid();
        focusGenerated("data-archive-coverage", state.coverage);
      } else if (target.hasAttribute("data-archive-open")) {
        var record = engine.getRecord(target.getAttribute("data-archive-open"));
        if (record) openRecord(serialCopy(record));
      }
    }

    function handleDocumentClick(event) {
      var target = event.target && event.target.closest
        ? event.target.closest("[data-ask-archive]")
        : null;
      if (!target || !engine) return;
      var record = engine.getRecord(target.getAttribute("data-ask-archive"));
      if (record) openRecord(serialCopy(record));
    }

    function bind() {
      if (!documentRef) return;
      var search = byId("archiveSearch");
      listen(search, "input", function (event) {
        state.query = clean(event.target.value);
        state.limit = 18;
        renderGrid();
      });
      listen(byId("archiveReset"), "click", function () {
        state.query = "";
        state.year = "";
        state.month = "";
        state.coverage = "";
        state.limit = 18;
        if (search) search.value = "";
        renderFilters();
        renderGrid();
        frame(function () { if (search) search.focus(); });
      });
      listen(byId("archiveLoadMore"), "click", function () {
        if (!engine || state.busy) {
          announce("ARCHIVE LEDGER IS STILL LOADING");
          return;
        }
        state.limit += 18;
        renderGrid();
      });
      listen(byId("archiveQueueDownload"), "click", function () {
        if (!engine || state.busy) {
          showToast("ARCHIVE LEDGER IS STILL LOADING");
          return;
        }
        downloadJson("wwam-archive-autopsy-queue.json", {
          schema: "wwam-archive-autopsy-queue/v1",
          provenance: engine.getProvenance(),
          queue: engine.getDistillQueue({ limit: 100 }),
        });
        showToast("AUTOPSY QUEUE DOWNLOADED");
      });
      listen(byId("archive"), "click", handleSectionClick);
      listen(documentRef, "click", handleDocumentClick);
    }

    function askPlan(query) {
      if (!engine || !ARCHIVE_QUERY.test(query)) return null;
      var lower = normalized(query);
      var yearMatch = lower.match(/\b(20(?:1[8-9]|2[0-6]))\b/);
      var titleTerms = lower.replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(function (term) {
        return term && !STOP_WORDS.has(term) && !/^20\d{2}$/.test(term);
      }).join(" ");
      var sort = /\b(most viewed|popular|biggest)\b/.test(lower)
        ? "views"
        : /\b(oldest|first|earliest)\b/.test(lower) ? "oldest" : "newest";
      var year = yearMatch ? yearMatch[1] : undefined;
      var result;
      var records;
      if (titleTerms) {
        result = engine.search(titleTerms, { year: year, limit: 200 });
        var aliasExpanded = (result.expandedAliases || []).length > 0;
        var requiredTerms = titleTerms.split(/\s+/).filter(Boolean);
        if (aliasExpanded && Array.isArray(engine.aliases)) {
          var expandedIds = new Set(result.expandedAliases.map(function (group) { return group.id; }));
          var aliasTokens = new Set();
          engine.aliases.filter(function (group) {
            return expandedIds.has(group.id);
          }).forEach(function (group) {
            (group.aliases || []).forEach(function (alias) {
              var phrase = normalized(alias);
              if ((" " + titleTerms + " ").includes(" " + phrase + " ")
                  || phrase.includes(titleTerms)) {
                phrase.split(" ").forEach(function (term) { aliasTokens.add(term); });
              }
            });
          });
          requiredTerms = requiredTerms.filter(function (term) { return !aliasTokens.has(term); });
        }
        records = (result.results || []).filter(function (record) {
          var match = record.match || {};
          var matchedTerms = match.matchedTerms || [];
          return (!aliasExpanded || (match.matchedAliases || []).length > 0)
            && requiredTerms.every(function (term) { return matchedTerms.includes(term); });
        }).sort(metadataCompare(sort));
      } else {
        result = engine.browse({ year: year, sort: sort, limit: 6 });
        records = result.records || [];
      }
      return {
        titleTerms: titleTerms,
        year: year || "",
        sort: sort,
        total: titleTerms ? records.length : Number(result.total || 0),
        evaluated: titleTerms ? records.length : Number(result.total || 0),
        capped: titleTerms && Number(result.total || 0) > 200,
        records: records.slice(0, 6),
      };
    }

    function askMarkup(query) {
      var plan = askPlan(query);
      if (!plan || !plan.records.length) return "";
      var sortCopy = {
        views: "CACHED VIEWS, HIGHEST FIRST",
        oldest: "UPLOAD DATE, OLDEST FIRST",
        newest: "UPLOAD DATE, NEWEST FIRST",
      }[plan.sort];
      var capCopy = plan.capped
        ? " SORTED WITHIN THE HIGH-CONFIDENCE MATCHES RETURNED BY THE FIRST 200 INDEX RESULTS."
        : "";
      return '<section class="ask-archive-fallback"><header><div><span>'
        + "SOURCE DISCOVERY // NOT A CONTENT ANSWER</span><h3>THE CACHED "
        + escapeHtml(snapshotDate()) + " SNAPSHOT FOUND " + plan.total
        + " TITLE-METADATA MATCH" + (plan.total === 1 ? "" : "ES")
        + '.</h3></div><a href="#archive">OPEN THE WHOLE ATLAS &rarr;</a></header>'
        + "<p>ORDER: " + escapeHtml(sortCopy) + "." + escapeHtml(capCopy)
        + " These records show an upload was present in the cached feed snapshot. "
        + "They do not establish what anyone said inside it.</p><div>"
        + plan.records.map(function (record) {
          var internal = Boolean(isInternal(record));
          var action = internal
            ? '<button type="button" data-ask-archive="' + escapeHtml(record.id) + '">OPEN '
              + (record.coverage === "deeply-indexed" ? "DEEP MAP" : "DOSSIER")
              + " &rarr;</button>"
            : '<a href="' + escapeHtml(record.url)
              + '" target="_blank" rel="noopener">OPEN ORIGINAL &#8599;</a>';
          return "<article><span>" + escapeHtml(formatDate(record.date)) + " // "
            + escapeHtml(record.coverage.replace(/-/g, " ").toUpperCase())
            + "</span><h4>" + escapeHtml(record.title)
            + "</h4><footer><b>" + escapeHtml(formatNumber(record.views))
            + " CACHED VIEWS</b>" + action + "</footer></article>";
        }).join("") + "</div></section>";
    }

    function mount() {
      if (state.mounted) return api;
      if (!documentRef || !byId("archive")) {
        throw new Error("Archive Atlas UI cannot find #archive");
      }
      state.mounted = true;
      state.error = "";
      bind();
      applyTruthCopy();
      if (!engine) {
        renderProof();
        setBusy(true, "LOADING THE CACHED ARCHIVE LEDGER");
      } else {
        setBusy(false);
        renderAll();
      }
      return api;
    }

    function setEngine(nextEngine) {
      if (!validEngine(nextEngine)) {
        throw new Error("Archive Atlas UI received an incompatible engine");
      }
      engine = nextEngine;
      state.error = "";
      setBusy(false);
      if (state.mounted) renderAll();
      return api;
    }

    function destroy() {
      removeListeners.splice(0).forEach(function (remove) { remove(); });
      state.mounted = false;
      return api;
    }

    api = Object.freeze({
      version: VERSION,
      mount: mount,
      setEngine: setEngine,
      setLoading: setBusy,
      setError: setError,
      askMarkup: askMarkup,
      getCopy: getCopy,
      getState: function () { return serialCopy(state); },
      destroy: destroy,
    });
    return api;
  }

  root.WWAMArchiveAtlasUI = Object.freeze({
    VERSION: VERSION,
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
