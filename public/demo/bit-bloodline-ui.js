(function (root) {
  "use strict";

  var VERSION = "1.0.0";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : (fallback == null ? 0 : fallback);
  }

  function fallbackEscape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fallbackTime(value) {
    var total = Math.max(0, Math.round(finite(value)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return (hours ? String(hours).padStart(2, "0") + ":" : "") +
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");
  }

  function fallbackNumber(value) {
    return finite(value).toLocaleString("en-US");
  }

  function closestAction(node, boundary) {
    var current = node;
    while (current && current !== boundary) {
      if (typeof current.getAttribute === "function" &&
          current.getAttribute("data-bit-bloodline-action")) return current;
      current = current.parentElement;
    }
    return null;
  }

  function validEngine(engine) {
    return Boolean(
      engine &&
      typeof engine.list === "function" &&
      typeof engine.get === "function" &&
      typeof engine.compileCutPacket === "function"
    );
  }

  function exactSelection(value) {
    var item = value || {};
    var at = finite(item.at != null ? item.at : item.start, -1);
    var end = finite(item.end, -1);
    if (!clean(item.receiptKey || item.key) || !clean(item.sourceId) ||
        at < 0 || end <= at) return null;
    return {
      receiptKey: clean(item.receiptKey || item.key),
      sourceId: clean(item.sourceId),
      sourceFingerprint: clean(item.sourceFingerprint),
      dossierFingerprint: clean(item.dossierFingerprint),
      at: at,
      end: end
    };
  }

  function create(options) {
    var input = options || {};
    var documentRef = input.document || root.document;
    var mount = input.mount;
    var engine = input.engine;
    var esc = typeof input.escapeHtml === "function" ?
      input.escapeHtml : fallbackEscape;
    var formatTime = typeof input.formatTime === "function" ?
      input.formatTime : fallbackTime;
    var formatNumber = typeof input.formatNumber === "function" ?
      input.formatNumber : fallbackNumber;
    var callbacks = {
      play: typeof input.onPlay === "function" ? input.onPlay : function () {},
      navigateEcho: typeof input.onNavigateEcho === "function" ?
        input.onNavigateEcho : null,
      cut: typeof input.onCutBloodline === "function" ?
        input.onCutBloodline : function () {},
      close: typeof input.onClose === "function" ? input.onClose : null
    };
    var copyInput = input.copy || {};
    var copy = {
      eyebrow: clean(copyInput.eyebrow) ||
        "BIT BLOODLINES // RECURRING CHARACTER MEMORY",
      title: clean(copyInput.title) || "THE BITS REMEMBER",
      deck: clean(copyInput.deck) ||
        "Trace every curated performance window from the earliest indexed candidate through later indexed candidates.",
      first: clean(copyInput.firstWindow) ||
        "EARLIEST CURATED WINDOW IN CURRENT INDEX",
      candidate: clean(copyInput.performanceCandidate) ||
        "INDEXED PERFORMANCE CANDIDATE",
      latest: clean(copyInput.latestWindow) ||
        "LATEST CURATED WINDOW IN CURRENT INDEX",
      cut: clean(copyInput.cutLabel) || "CUT THIS BLOODLINE",
      play: clean(copyInput.playLabel) || "INSPECT EXACT RECEIPT",
      close: clean(copyInput.closeLabel) || "CLOSE BLOODLINES",
      empty: clean(copyInput.empty) ||
        "NO SOURCE-LOCKED BLOODLINES ARE READY FOR PUBLIC DISPLAY."
    };
    var state = {
      open: false,
      destroyed: false,
      lineages: [],
      selectedId: "",
      previousFocus: null,
      status: "",
      error: ""
    };

    if (!validEngine(engine)) {
      throw new Error("Bit Bloodlines UI requires a compatible bloodline engine.");
    }
    if (!mount || typeof mount.addEventListener !== "function") {
      throw new Error("Bit Bloodlines UI requires a mount element.");
    }

    function setMountState(value) {
      if (typeof mount.setAttribute === "function") {
        mount.setAttribute("data-bit-bloodline-state", value);
      }
    }

    function removeMountState() {
      if (typeof mount.removeAttribute === "function") {
        mount.removeAttribute("data-bit-bloodline-state");
      }
    }

    function selectedLineage() {
      var found = null;
      if (state.selectedId) {
        try {
          found = engine.get(state.selectedId);
        } catch {
          found = null;
        }
      }
      return found || state.lineages.filter(function (lineage) {
        return clean(lineage.id) === state.selectedId;
      })[0] || state.lineages[0] || null;
    }

    function dateLabel(value) {
      var text = clean(value);
      if (!text) return "DATE HELD IN SOURCE DOSSIER";
      var parts = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!parts) return text;
      return parts[2] + "." + parts[3] + "." + parts[1];
    }

    function elapsedLabel(lineage) {
      var explicit = clean(lineage && lineage.elapsedLabel);
      if (explicit) return explicit.toUpperCase();
      var days = finite(lineage && lineage.elapsedDays, -1);
      if (days >= 0) return formatNumber(days) + " DAYS ON THE INDEXED TAPE";
      var first = Date.parse(clean(lineage && lineage.firstDate));
      var last = Date.parse(clean(lineage && lineage.lastDate));
      if (Number.isFinite(first) && Number.isFinite(last) && last >= first) {
        return formatNumber(Math.round((last - first) / 86400000)) +
          " DAYS ON THE INDEXED TAPE";
      }
      return "INDEXED SPAN AVAILABLE";
    }

    function performanceRole(performance, index, count) {
      var role = clean(performance && performance.role).toLowerCase();
      if (role === "earliest-curated-window" || index === 0) {
        return copy.first;
      }
      if (role === "latest-curated-window" || index === count - 1) {
        return copy.latest;
      }
      return copy.candidate + " " + String(index).padStart(2, "0");
    }

    function performanceMarkup(performance, index, count, lineage) {
      var item = performance || {};
      var at = finite(item.at != null ? item.at : item.start);
      var end = finite(item.end, at);
      var sourceId = clean(item.sourceId);
      var receiptKey = clean(item.receiptKey || item.key || item.receiptId);
      var title = clean(item.sourceTitle || item.title) ||
        "OFFICIAL SOURCE " + sourceId;
      var excerpt = clean(item.excerpt || item.quote) ||
        "Open the bounded source receipt to inspect its context.";
      var evidence = clean(item.evidenceLabel || item.evidenceLevel ||
        item.evidenceType) || "TIMESTAMPED SOURCE RECEIPT";
      var curation = clean(item.curationStatus) || "CURATED INDEXED WINDOW";
      var exact = exactSelection(item);
      return '<article class="bit-bloodline__receipt' +
        (index === 0 ? " is-first" : "") +
        (index === count - 1 ? " is-latest" : "") +
        '" data-bloodline-receipt="' + esc(receiptKey) + '">' +
        '<div class="bit-bloodline__rail" aria-hidden="true"><i></i></div>' +
        '<div class="bit-bloodline__receipt-body"><div class="bit-bloodline__receipt-top">' +
        '<span>' + esc(performanceRole(item, index, count)) + '</span><b>' +
        esc(dateLabel(item.date)) + '</b></div><h4>' + esc(title) + '</h4>' +
        '<p class="bit-bloodline__quote">&ldquo;' + esc(excerpt) +
        '&rdquo;</p><dl class="bit-bloodline__proof"><div><dt>SOURCE</dt><dd><code>' +
        esc(sourceId) + '</code></dd></div><div><dt>BOUND</dt><dd>' +
        esc(formatTime(at)) + ' &rarr; ' + esc(formatTime(end)) +
        '</dd></div><div><dt>RECEIPT</dt><dd><code>' + esc(receiptKey) +
        '</code></dd></div></dl><div class="bit-bloodline__tags"><span>' +
        esc(evidence) + '</span><span>' + esc(curation) + '</span></div>' +
        '<button class="bit-bloodline__receipt-action" type="button" ' +
        'data-bit-bloodline-action="play" data-lineage-id="' +
        esc(lineage.id) + '" data-performance-index="' + index + '"' +
        (exact ? "" : " disabled") + '>' + esc(copy.play) + '</button></div></article>';
    }

    function tabsMarkup(lineages, selectedId) {
      return '<div class="bit-bloodline__switcher" role="tablist" ' +
        'aria-label="Choose a recurring bit bloodline">' +
        lineages.map(function (lineage) {
          var id = clean(lineage.id);
          var selected = id === selectedId;
          var appearances = finite(
            lineage.appearanceCount != null ?
              lineage.appearanceCount : lineage.appearances,
            array(lineage.performances).length
          );
          return '<button type="button" role="tab" aria-selected="' +
            (selected ? "true" : "false") + '" tabindex="' +
            (selected ? "0" : "-1") + '" class="' +
            (selected ? "is-selected" : "") +
            '" data-bit-bloodline-action="select" data-lineage-id="' +
            esc(id) + '"><span>' + esc(lineage.label || lineage.name || id) +
            '</span><b>' + formatNumber(appearances) + ' WINDOWS</b></button>';
        }).join("") + '</div>';
    }

    function boundaryMarkup(lineage) {
      var rawCaution = clean(lineage && (lineage.caution || lineage.disclaimer));
      var caution = rawCaution && !/earliest[^.]{0,40}spark/i.test(rawCaution) ?
        rawCaution :
        "Earliest curated window means earliest in this indexed archive, not the bit's true origin.";
      return '<aside class="bit-bloodline__boundary" aria-label="Evidence and authority boundary">' +
        '<div><span>THE TAPE CAN ESTABLISH</span><p>Exact source IDs, bounded timestamps, ' +
        'indexed dates, and the order of these curated receipt windows.</p></div>' +
        '<div><span>THE TAPE CANNOT ESTABLISH</span><p>Speaker continuity, true origin, ' +
        'authorship, causality, creator approval, rights clearance, or copied media.</p></div>' +
        '<small>' + esc(caution) + '</small></aside>';
    }

    function echoRadarMarkup(lineage) {
      var echoes = array(lineage && (lineage.echoes || lineage.machineEchoes));
      if (!echoes.length) return "";
      return '<details class="bit-bloodline__echo-radar"><summary><span>' +
        'MACHINE ECHO RADAR // NAVIGATION ONLY</span><b>' +
        formatNumber(echoes.length) + ' UNCURATED SIGNALS</b></summary>' +
        '<div class="bit-bloodline__echo-warning"><strong>NOT A CURATED PERFORMANCE</strong>' +
        '<p>These machine-matched positions can help a human search the source. ' +
        'They do not enter this bloodline, its counts, or its cut.</p></div>' +
        '<div class="bit-bloodline__echo-list">' +
        echoes.map(function (echo, index) {
          var item = echo || {};
          var sourceId = clean(item.sourceId);
          var at = finite(item.at != null ? item.at : item.t, -1);
          var canNavigate = callbacks.navigateEcho && sourceId && at >= 0;
          return '<article><div><span>MACHINE NAVIGATION SIGNAL ' +
            String(index + 1).padStart(2, "0") + '</span><b>' +
            esc(dateLabel(item.date)) + '</b></div><h4>' +
            esc(item.sourceTitle || item.title || "POSSIBLE SOURCE POSITION") +
            '</h4><p>' + esc(item.context || item.excerpt || item.label ||
              "No public context excerpt is attached to this navigation signal.") +
            '</p><code>' + esc(sourceId) + ' // ' +
            esc(formatTime(Math.max(0, at))) + '</code>' +
            (canNavigate ? '<button type="button" data-bit-bloodline-action="' +
              'navigate-echo" data-echo-index="' + index +
              '">OPEN SOURCE POSITION</button>' : "") + '</article>';
        }).join("") + '</div></details>';
    }

    function render() {
      if (state.destroyed) return;
      if (!state.open) {
        mount.innerHTML = "";
        removeMountState();
        return;
      }
      setMountState(state.error ? "error" : "ready");
      if (!state.lineages.length) {
        mount.innerHTML = '<section class="bit-bloodline bit-bloodline--empty" ' +
          'aria-labelledby="bitBloodlineHeading">' +
          (callbacks.close ? '<button type="button" class="bit-bloodline__close" ' +
            'data-bit-bloodline-action="close">' + esc(copy.close) + '</button>' : "") +
          '<h2 id="bitBloodlineHeading" tabindex="-1">' +
          esc(copy.title) + '</h2><p>' + esc(copy.empty) + '</p></section>';
        return;
      }

      var lineage = selectedLineage() || state.lineages[0];
      state.selectedId = clean(lineage.id);
      var performances = array(lineage.performances || lineage.events ||
        lineage.receipts);
      var appearances = finite(
        lineage.appearanceCount != null ?
          lineage.appearanceCount : lineage.appearances,
        performances.length
      );
      var later = finite(
        lineage.laterAppearanceCount,
        Math.max(0, appearances - 1)
      );
      var sources = finite(lineage.sourceCount, array(lineage.sourceIds).length);
      var character = clean(lineage.character);
      var rawDescription = clean(lineage.description);
      var description = rawDescription &&
        !/(?:callback|true origin|first-ever|first time|authorship|causality)/i.test(
          rawDescription
        ) ? rawDescription :
        "A recurring pattern traced from the earliest indexed candidate through later indexed candidates using curated source windows.";

      mount.innerHTML = '<section class="bit-bloodline" ' +
        'aria-labelledby="bitBloodlineHeading"><header class="bit-bloodline__hero">' +
        '<div><span>' + esc(copy.eyebrow) + '</span><h2 id="bitBloodlineHeading" ' +
        'tabindex="-1">' + esc(copy.title) + '</h2><p>' + esc(copy.deck) +
        '</p></div>' +
        (callbacks.close ? '<button type="button" class="bit-bloodline__close" ' +
          'data-bit-bloodline-action="close">' + esc(copy.close) + '</button>' : "") +
        '</header>' + tabsMarkup(state.lineages, state.selectedId) +
        '<div class="bit-bloodline__lineage" role="tabpanel" ' +
        'aria-label="' + esc(lineage.label || lineage.name) + '">' +
        '<div class="bit-bloodline__identity"><div><span>ACTIVE BLOODLINE</span><h3>' +
        esc(lineage.label || lineage.name || "RECURRING BIT") + '</h3>' +
        (character ? '<b>CHARACTER LANE // ' + esc(character) + '</b>' : "") +
        '<p>' + esc(description) + '</p></div><button type="button" ' +
        'class="bit-bloodline__cut" data-bit-bloodline-action="cut">' +
        esc(copy.cut) + '</button></div><div class="bit-bloodline__metrics">' +
        '<div><span>CURATED WINDOWS</span><b>' + formatNumber(appearances) +
        '</b></div><div><span>LATER CANDIDATES</span><b>' + formatNumber(later) +
        '</b></div><div><span>OFFICIAL SOURCES</span><b>' +
        formatNumber(sources) + '</b></div><div><span>INDEXED SPAN</span><b>' +
        esc(elapsedLabel(lineage)) + '</b></div></div>' +
        boundaryMarkup(lineage) +
        echoRadarMarkup(lineage) +
        '<div class="bit-bloodline__timeline" aria-label="Exact source receipt timeline">' +
        performances.map(function (performance, index) {
          return performanceMarkup(
            performance, index, performances.length, lineage
          );
        }).join("") + '</div></div><p id="bitBloodlineStatus" ' +
        'class="bit-bloodline__status' + (state.error ? " is-error" : "") +
        '" role="status" aria-live="polite">' +
        esc(state.error || state.status) + '</p></section>';
    }

    function focusHeading() {
      var heading = typeof mount.querySelector === "function" ?
        mount.querySelector("#bitBloodlineHeading") : null;
      if (heading && typeof heading.focus === "function") heading.focus();
    }

    function focusTab(id) {
      if (typeof mount.querySelectorAll !== "function") return;
      var tabs = arrayFrom(mount.querySelectorAll(
        '[data-bit-bloodline-action="select"]'
      ));
      tabs.forEach(function (tab) {
        if (clean(tab.getAttribute("data-lineage-id")) === id &&
            typeof tab.focus === "function") tab.focus();
      });
    }

    function arrayFrom(value) {
      return Array.prototype.slice.call(value || []);
    }

    function setStatus(message, error) {
      state.status = error ? "" : clean(message);
      state.error = error ? clean(message) : "";
      render();
      var status = typeof mount.querySelector === "function" ?
        mount.querySelector("#bitBloodlineStatus") : null;
      if (status && typeof status.focus === "function" && error) status.focus();
    }

    function select(id, options) {
      if (state.destroyed || !state.open) return false;
      var next = clean(id);
      var exists = state.lineages.some(function (lineage) {
        return clean(lineage.id) === next;
      });
      if (!exists) return false;
      state.selectedId = next;
      state.status = "";
      state.error = "";
      render();
      if (options && options.focusTab) focusTab(next);
      else if (!options || options.focusHeading !== false) focusHeading();
      return true;
    }

    function playPerformance(index) {
      var lineage = selectedLineage();
      var performances = array(lineage && (lineage.performances ||
        lineage.events || lineage.receipts));
      var performance = performances[finite(index, -1)];
      var selection = exactSelection(performance);
      if (!lineage || !performance || !selection) {
        setStatus("EXACT SOURCE BOUNDS ARE MISSING // RECEIPT HELD CLOSED.", true);
        return;
      }
      callbacks.play(selection, lineage, performance);
      setStatus("EXACT RECEIPT HANDED TO THE HOST PLAYER.", false);
    }

    function navigateEcho(index) {
      var lineage = selectedLineage();
      var echoes = array(lineage && (lineage.echoes || lineage.machineEchoes));
      var echo = echoes[finite(index, -1)];
      var sourceId = clean(echo && echo.sourceId);
      var at = finite(echo && (echo.at != null ? echo.at : echo.t), -1);
      if (!callbacks.navigateEcho || !lineage || !echo || !sourceId || at < 0) {
        setStatus(
          "MACHINE ECHO HELD // NO SOURCE NAVIGATION POSITION IS AVAILABLE.",
          true
        );
        return;
      }
      callbacks.navigateEcho({
        sourceId: sourceId,
        at: at,
        receiptKey: clean(echo.receiptKey || echo.key || echo.receiptId)
      }, lineage, echo);
      setStatus(
        "MACHINE ECHO HANDED OFF FOR SOURCE NAVIGATION // NOT ADDED TO THE BLOODLINE.",
        false
      );
    }

    function cutBloodline() {
      var lineage = selectedLineage();
      var packet;
      try {
        packet = engine.compileCutPacket(lineage && lineage.id);
      } catch (error) {
        setStatus(
          error && error.message ? error.message :
            "THE BLOODLINE CUT COULD NOT BE COMPILED.",
          true
        );
        return;
      }
      var raw = array(packet && packet.selections);
      var selections = raw.map(exactSelection).filter(Boolean);
      if (!lineage || !packet || packet.ok !== true || packet.rejected &&
          packet.rejected.length || !raw.length || selections.length !== raw.length) {
        setStatus(
          "CUT HELD CLOSED // EVERY WINDOW MUST RESOLVE TO AN EXACT CANONICAL RECEIPT.",
          true
        );
        return;
      }
      callbacks.cut({
        lineage: lineage,
        selections: selections,
        title: clean(packet.title) ||
          clean(lineage.label || lineage.name) + " // BLOODLINE CUT",
        introduction: clean(packet.introduction) &&
          !/(?:earliest[^.]{0,40}spark|callback|true origin|first-ever)/i.test(
            clean(packet.introduction)
          ) ? clean(packet.introduction) :
          "Earliest indexed candidate through later indexed candidates, assembled from exact curated windows."
      }, packet);
      setStatus(
        formatNumber(selections.length) +
          " EXACT WINDOWS HANDED TO THE CUT ROOM // NO MEDIA COPIED.",
        false
      );
    }

    function close(options) {
      if (state.destroyed || !state.open) return false;
      var restore = !options || options.restoreFocus !== false;
      state.open = false;
      state.status = "";
      state.error = "";
      render();
      if (callbacks.close) callbacks.close();
      if (restore && state.previousFocus &&
          typeof state.previousFocus.focus === "function") {
        state.previousFocus.focus();
      }
      return true;
    }

    function refresh() {
      if (state.destroyed) return [];
      var next;
      try {
        next = array(engine.list());
      } catch {
        next = [];
      }
      state.lineages = next;
      if (!next.some(function (lineage) {
        return clean(lineage.id) === state.selectedId;
      })) {
        state.selectedId = clean(next[0] && next[0].id);
      }
      if (state.open) render();
      return state.lineages.slice();
    }

    function open(config) {
      if (state.destroyed) {
        throw new Error("Bit Bloodlines UI has been destroyed.");
      }
      var options = config || {};
      state.previousFocus = options.launcher ||
        (documentRef && documentRef.activeElement) || null;
      state.open = true;
      state.status = "";
      state.error = "";
      refresh();
      var requested = clean(options.lineageId);
      if (requested) select(requested, { focusHeading: false });
      render();
      focusHeading();
      return getState();
    }

    function getState() {
      return {
        open: state.open,
        destroyed: state.destroyed,
        selectedId: state.selectedId,
        lineageCount: state.lineages.length,
        status: state.status,
        error: state.error
      };
    }

    function clickHandler(event) {
      var actionNode = closestAction(event && event.target, mount);
      if (!actionNode) return;
      var action = actionNode.getAttribute("data-bit-bloodline-action");
      if (action === "select") {
        if (event && typeof event.preventDefault === "function") {
          event.preventDefault();
        }
        select(actionNode.getAttribute("data-lineage-id"), { focusTab: true });
      } else if (action === "play") {
        playPerformance(actionNode.getAttribute("data-performance-index"));
      } else if (action === "navigate-echo") {
        navigateEcho(actionNode.getAttribute("data-echo-index"));
      } else if (action === "cut") {
        cutBloodline();
      } else if (action === "close") {
        close();
      }
    }

    function keydownHandler(event) {
      if (!event || !state.open) return;
      if (event.key === "Escape" && callbacks.close) {
        event.preventDefault();
        if (typeof event.stopPropagation === "function") event.stopPropagation();
        close();
        return;
      }
      var actionNode = closestAction(event.target, mount);
      if (!actionNode ||
          actionNode.getAttribute("data-bit-bloodline-action") !== "select") return;
      var keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (keys.indexOf(event.key) < 0) return;
      var ids = state.lineages.map(function (lineage) {
        return clean(lineage.id);
      });
      var current = ids.indexOf(
        clean(actionNode.getAttribute("data-lineage-id"))
      );
      if (current < 0) return;
      event.preventDefault();
      var index = current;
      if (event.key === "Home") index = 0;
      else if (event.key === "End") index = ids.length - 1;
      else if (event.key === "ArrowRight") index = (current + 1) % ids.length;
      else index = (current - 1 + ids.length) % ids.length;
      select(ids[index], { focusTab: true });
    }

    function destroy() {
      if (state.destroyed) return;
      if (state.open) close({ restoreFocus: false });
      mount.removeEventListener("click", clickHandler);
      mount.removeEventListener("keydown", keydownHandler);
      state.destroyed = true;
      mount.innerHTML = "";
      removeMountState();
    }

    mount.addEventListener("click", clickHandler);
    mount.addEventListener("keydown", keydownHandler);

    return Object.freeze({
      VERSION: VERSION,
      open: open,
      close: close,
      destroy: destroy,
      refresh: refresh,
      select: select,
      getState: getState
    });
  }

  var api = Object.freeze({
    VERSION: VERSION,
    create: create
  });

  root.ShokkerBitBloodlineUI = api;
  root.WWAMBitBloodlineUI = api;
})(typeof window !== "undefined" ? window : globalThis);
