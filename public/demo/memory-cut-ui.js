(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var CUT_SCHEMA = "shokker-memory-cut/v1";
  var REQUEST_SCHEMA = "shokker-memory-cut-request/v1";
  var MIN_STOPS = 3;
  var MAX_STOPS = 8;

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

  function slug(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "").slice(0, 60) || "midnight-cut";
  }

  function titleCase(value) {
    return clean(value).replace(/[-_]+/g, " ").replace(/\b\w/g, function (letter) {
      return letter.toUpperCase();
    });
  }

  function closestAction(node, boundary) {
    var current = node;
    while (current && current !== boundary) {
      if (typeof current.getAttribute === "function" &&
          current.getAttribute("data-memory-cut-action")) return current;
      current = current.parentElement;
    }
    return null;
  }

  function validEngine(engine) {
    return Boolean(
      engine &&
      typeof engine.compile === "function" &&
      typeof engine.resolveSelection === "function" &&
      typeof engine.share === "function" &&
      typeof engine.exportEditBrief === "function"
    );
  }

  function validStop(stop) {
    var start = finite(stop && (stop.start != null ? stop.start : stop.at), -1);
    var end = finite(stop && stop.end, -1);
    return Boolean(
      stop && clean(stop.key) && clean(stop.sourceId) &&
      start >= 0 && end > start
    );
  }

  function validCut(cut) {
    var stops = array(cut && cut.stops);
    return Boolean(
      cut && cut.schema === CUT_SCHEMA && cut.status === "ready" &&
      cut.eligible === true && stops.length >= MIN_STOPS &&
      stops.length <= MAX_STOPS && stops.every(validStop)
    );
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
      player: typeof input.onRenderPlayer === "function" ?
        input.onRenderPlayer : function () {},
      copy: typeof input.onCopy === "function" ? input.onCopy : function () {},
      download: typeof input.onDownload === "function" ?
        input.onDownload : function () {},
      close: typeof input.onClose === "function" ? input.onClose : function () {},
      bag: typeof input.onBagChange === "function" ?
        input.onBagChange : function () {}
    };
    var state = {
      open: false,
      destroyed: false,
      busy: false,
      cut: null,
      selections: [],
      eligibleSelections: [],
      held: [],
      currentIndex: 0,
      playerLoaded: false,
      title: "THE MIDNIGHT CUT",
      introduction: "",
      status: "",
      error: "",
      previousFocus: null,
      epoch: 0
    };

    if (!validEngine(engine)) {
      throw new Error("The Midnight Cut UI requires a compatible memory-cut engine.");
    }
    if (!mount || typeof mount.addEventListener !== "function") {
      throw new Error("The Midnight Cut UI requires a mount element.");
    }

    function setMountState(value) {
      if (typeof mount.setAttribute === "function") {
        mount.setAttribute("data-memory-cut-state", value);
      }
    }

    function removeMountState() {
      if (typeof mount.removeAttribute === "function") {
        mount.removeAttribute("data-memory-cut-state");
        mount.removeAttribute("data-memory-cut-preset");
      }
    }

    function currentStop() {
      return array(state.cut && state.cut.stops)[state.currentIndex] || null;
    }

    function stopDuration(stop) {
      return Math.max(0, finite(stop.end) -
        finite(stop.start != null ? stop.start : stop.at));
    }

    function officialUrl(stop) {
      var sourceId = clean(stop && stop.sourceId);
      var at = Math.max(0, Math.round(finite(
        stop && (stop.start != null ? stop.start : stop.at)
      )));
      return "https://www.youtube.com/watch?v=" +
        encodeURIComponent(sourceId) + "&t=" + at + "s";
    }

    function normalizedHeld(item, index, reason) {
      var source = item || {};
      return {
        inputIndex: index,
        selection: source,
        label: clean(source.label || source.title || source.excerpt ||
          source.receiptKey || source.key || source.id || source.sourceId) ||
          "UNRESOLVED SELECTION " + String(index + 1),
        reason: clean(reason) || "THE CANONICAL RECEIPT COULD NOT BE RESOLVED."
      };
    }

    function resolveSelections(selections) {
      var seen = Object.create(null);
      var eligible = [];
      var held = [];
      array(selections).forEach(function (selection, index) {
        try {
          var key = clean(engine.resolveSelection(selection));
          if (!key) throw new Error("The selection did not resolve to a canonical receipt key.");
          if (seen[key]) {
            held.push(normalizedHeld(
              selection, index, "DUPLICATE CANONICAL RECEIPT // HELD OUTSIDE THE CUT."
            ));
            return;
          }
          if (eligible.length >= MAX_STOPS) {
            held.push(normalizedHeld(
              selection, index, "CUT LIMIT // ONLY 8 CANONICAL STOPS MAY ENTER V1."
            ));
            return;
          }
          seen[key] = true;
          eligible.push({
            key: key,
            selection: selection,
            inputIndex: index
          });
        } catch (error) {
          held.push(normalizedHeld(
            selection,
            index,
            error && error.message ? error.message :
              "THE CANONICAL RECEIPT COULD NOT BE RESOLVED."
          ));
        }
      });
      return { eligible: eligible, held: held };
    }

    function compileRequest() {
      var resolution = resolveSelections(state.selections);
      state.eligibleSelections = resolution.eligible;
      state.held = resolution.held;
      if (resolution.eligible.length < MIN_STOPS) {
        throw new Error(
          "THE MIDNIGHT CUT NEEDS 3–8 UNIQUE CANONICAL RECEIPTS. " +
          resolution.eligible.length + " ELIGIBLE " +
          (resolution.eligible.length === 1 ? "STOP REMAINS." : "STOPS REMAIN.")
        );
      }
      return engine.compile({
        schema: REQUEST_SCHEMA,
        title: state.title,
        introduction: state.introduction,
        selections: resolution.eligible.map(function (entry) {
          return entry.selection;
        })
      });
    }

    function compileNow() {
      var compiled = compileRequest();
      if (compiled && typeof compiled.then === "function") {
        throw new Error("The Midnight Cut V1 requires a synchronous canonical compiler.");
      }
      if (!validCut(compiled)) {
        throw new Error("THE CUT FAILED ITS CANONICAL 3–8 STOP CONTRACT.");
      }
      state.cut = compiled;
      return compiled;
    }

    function authorityMarkup() {
      return '<aside class="memory-cut-authority" id="memoryCutAuthority">' +
        '<div><span>VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE</span>' +
        '<b>THE ARRANGEMENT IS YOURS. THE RECEIPTS ARE THE ARCHIVE’S.</b></div>' +
        '<p>Title, introduction, order, and editorial meaning are viewer choices. ' +
        'Only the exact source IDs, receipt keys, and bounded timestamps come from ' +
        'the canonical index. No speaker identity, continuity, “best” ranking, ' +
        'creator approval, or rights clearance is inferred.</p></aside>';
    }

    function editorMarkup() {
      var viewerTextLabel = clean(
        state.cut && state.cut.viewerTextLabel
      ) || "VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE";
      return '<section class="memory-cut-editor" aria-labelledby="memoryCutEditorTitle">' +
        '<div class="memory-cut-section-head"><span>PERSONAL MARQUEE</span>' +
        '<h3 id="memoryCutEditorTitle">NAME YOUR NIGHTMARE.</h3></div>' +
        '<div class="memory-cut-fields"><label for="memoryCutTitle">' +
        '<span>' + esc(viewerTextLabel) + '</span>CUT TITLE' +
        '<input id="memoryCutTitle" data-memory-cut-field="title" maxlength="80" value="' +
        esc(state.title) + '"></label><label for="memoryCutIntroduction">' +
        '<span>' + esc(viewerTextLabel) + '</span>INTRODUCTION' +
        '<textarea id="memoryCutIntroduction" data-memory-cut-field="introduction" ' +
        'maxlength="280" rows="3" placeholder="Why did you assemble these receipts?">' +
        esc(state.introduction) + '</textarea></label></div></section>';
    }

    function statsMarkup() {
      var cutStats = state.cut && state.cut.stats || {};
      var stops = array(state.cut && state.cut.stops);
      var sourceCount = Number.isFinite(Number(cutStats.sourceCount)) ?
        Number(cutStats.sourceCount) :
        new Set(stops.map(function (stop) { return stop.sourceId; })).size;
      var seconds = Number.isFinite(Number(cutStats.boundedSeconds)) ?
        Number(cutStats.boundedSeconds) :
        stops.reduce(function (total, stop) { return total + stopDuration(stop); }, 0);
      var cards = [
        [formatNumber(stops.length), "CANONICAL STOPS"],
        [formatNumber(sourceCount), sourceCount === 1 ? "OFFICIAL SOURCE" : "OFFICIAL SOURCES"],
        [formatNumber(Math.round(seconds)) + "S", "BOUNDED PLAYBACK"],
        [formatNumber(state.held.length), "HELD OUTSIDE CUT"]
      ];
      return '<div class="memory-cut-stats" aria-label="Cut statistics">' +
        cards.map(function (card) {
          return '<div><b>' + esc(card[0]) + '</b><span>' +
            esc(card[1]) + '</span></div>';
        }).join("") + '</div>';
    }

    function heldMarkup() {
      if (!state.held.length) return "";
      return '<details class="memory-cut-held" open><summary>' +
        esc(state.held.length) + ' HELD / INELIGIBLE ' +
        (state.held.length === 1 ? "ITEM" : "ITEMS") +
        ' // NOT IN THE CUT</summary><ol>' + state.held.map(function (item) {
          return '<li><b>' + esc(item.label) + '</b><span>' +
            esc(item.reason) + '</span></li>';
        }).join("") + '</ol><p>Held items cannot borrow proof from another source. ' +
        'Repair the receipt in the Evidence Bag, then reopen the cut.</p></details>';
    }

    function proofMarkup(stop, index, count) {
      var start = finite(stop.start != null ? stop.start : stop.at);
      var end = finite(stop.end);
      var excerpt = clean(stop.excerpt);
      var warnings = array(stop.evidenceWarnings || stop.warnings).map(clean)
        .filter(Boolean);
      return '<section class="memory-cut-proof" aria-labelledby="memoryCutProofTitle">' +
        '<div class="memory-cut-section-head"><span>CURRENT PROOF // STOP ' +
        esc(index + 1) + ' OF ' + esc(count) + '</span><h3 id="memoryCutProofTitle">' +
        esc(stop.label || stop.title || "CANONICAL RECEIPT") + '</h3></div>' +
        '<dl><div><dt>OFFICIAL SOURCE</dt><dd>' + esc(stop.title || stop.sourceId) +
        '</dd></div><div><dt>SOURCE ID</dt><dd><code>' + esc(stop.sourceId) +
        '</code></dd></div><div><dt>EXACT WINDOW</dt><dd>' + esc(formatTime(start)) +
        '–' + esc(formatTime(end)) + ' // ' +
        esc(Math.round(stopDuration(stop))) + 'S</dd></div><div><dt>EVIDENCE</dt><dd>' +
        esc(titleCase(stop.evidenceLevel || stop.evidenceType ||
          stop.evidenceBasis || "timestamp-bound")) +
        '</dd></div><div><dt>REVIEW STATE</dt><dd>' +
        esc(titleCase(stop.reviewState || "source-linked")) +
        '</dd></div></dl><blockquote><span>BOUNDED CONTEXT // VERIFY AGAINST SOURCE</span>' +
        (excerpt ? '“' + esc(excerpt) + '”' :
          'EXCERPT WITHHELD // THE TIMESTAMP REMAINS PLAYABLE') +
        '</blockquote>' + (warnings.length ?
          '<div class="memory-cut-warnings"><b>SOURCE WARNINGS</b><ul>' +
          warnings.map(function (warning) {
            return '<li>' + esc(warning) + '</li>';
          }).join("") + '</ul></div>' : "") +
        '<footer><a href="' + esc(officialUrl(stop)) +
        '" target="_blank" rel="noopener">OPEN OFFICIAL SOURCE ↗</a>' +
        '<span>SPEAKER: NOT CLAIMED // CONTINUITY: NOT CLAIMED</span></footer></section>';
    }

    function playerMarkup(stop, index, count) {
      var start = finite(stop.start != null ? stop.start : stop.at);
      return '<section class="memory-cut-player-shell" aria-labelledby="memoryCutNowTitle">' +
        '<header><div><span>OFFICIAL UPLOAD // MANUAL ADVANCEMENT</span>' +
        '<h3 id="memoryCutNowTitle">STOP ' + esc(index + 1) + ' // ' +
        esc(stop.label || "SOURCE RECEIPT") + '</h3></div><b>' +
        esc(formatTime(start)) + '</b></header><div class="memory-cut-player" ' +
        'id="memoryCutPlayer" aria-live="off">' +
        (state.playerLoaded ? "" :
          '<div><b>PLAYER DORMANT.</b><span>No video loads until you choose a stop. ' +
          'The cut never autoplays.</span><button type="button" ' +
          'data-memory-cut-action="play-current">PLAY STOP ' +
          esc(index + 1) + ' INSIDE THIS PAGE</button></div>') +
        '</div><nav class="memory-cut-transport" aria-label="Cut playback">' +
        '<button type="button" data-memory-cut-action="previous"' +
        (index === 0 ? " disabled" : "") + '>← PREVIOUS</button>' +
        '<button type="button" data-memory-cut-action="replay">↻ REPLAY STOP</button>' +
        '<button type="button" data-memory-cut-action="next"' +
        (index >= count - 1 ? " disabled" : "") + '>NEXT STOP →</button></nav>' +
        '<p>Stops advance only when you ask. Playback uses the official source ' +
        'at the canonical start and end bounds; no media is copied into this cut.</p></section>';
    }

    function railMarkup(stops) {
      return '<section class="memory-cut-rail-shell" aria-labelledby="memoryCutRailTitle">' +
        '<div class="memory-cut-section-head"><span>THE NUMBERED RAIL</span>' +
        '<h3 id="memoryCutRailTitle">MOVE THE STORY. NEVER MOVE THE PROOF.</h3></div>' +
        '<ol class="memory-cut-rail">' + stops.map(function (stop, index) {
          var current = index === state.currentIndex;
          var start = finite(stop.start != null ? stop.start : stop.at);
          return '<li class="' + (current ? "is-current" : "") +
            '" data-memory-cut-stop="' + esc(stop.key) + '"><button type="button" ' +
            'class="memory-cut-stop-select" data-memory-cut-action="select" ' +
            'data-index="' + esc(index) + '"' +
            (current ? ' aria-current="step"' : "") +
            ' aria-label="Play stop ' + esc(index + 1) + ' of ' +
            esc(stops.length) + ', ' +
            esc(stop.label || stop.title || "canonical receipt") + '">' +
            '<span>' + String(index + 1).padStart(2, "0") + '</span><div><b>' +
            esc(stop.label || stop.title || "CANONICAL RECEIPT") + '</b><small>' +
            esc(stop.title || stop.sourceId) + ' // ' + esc(formatTime(start)) +
            '–' + esc(formatTime(stop.end)) + '</small></div></button>' +
            '<div class="memory-cut-order" aria-label="Edit stop ' + esc(index + 1) +
            '"><button type="button" data-memory-cut-action="move-up" data-index="' +
            esc(index) + '" aria-label="Move stop ' + esc(index + 1) + ' earlier"' +
            (index === 0 ? " disabled" : "") + '>↑</button><button type="button" ' +
            'data-memory-cut-action="move-down" data-index="' + esc(index) +
            '" aria-label="Move stop ' + esc(index + 1) + ' later"' +
            (index === stops.length - 1 ? " disabled" : "") +
            '>↓</button><button type="button" data-memory-cut-action="remove" ' +
            'data-index="' + esc(index) + '" aria-label="Remove stop ' +
            esc(index + 1) + ' from the cut">REMOVE</button></div></li>';
        }).join("") + '</ol></section>';
    }

    function actionMarkup() {
      return '<footer class="memory-cut-actions"><div><button type="button" ' +
        'data-memory-cut-action="copy">COPY SOURCE-LOCKED SHARE PACKET</button>' +
        '<button type="button" data-memory-cut-action="download">' +
        'DOWNLOAD PRODUCTION BRIEF (.JSON)</button><button type="button" ' +
        'data-memory-cut-action="download-markdown">' +
        'DOWNLOAD EDITOR CHECKLIST (.MD)</button></div><button type="button" ' +
        'data-memory-cut-action="close">CLOSE THE CUT</button>' +
        '<p>Share packets contain canonical receipt keys, archive bindings, ' +
        'viewer-written title and introduction, and fingerprints—not excerpts, ' +
        'captions, speaker fields, or media. Production briefs remain ' +
        'planning documents, not published archive evidence.</p></footer>';
    }

    function readyMarkup() {
      var stops = array(state.cut && state.cut.stops);
      var stop = currentStop();
      var preset = state.title.toUpperCase().indexOf("THE CHARACTER WARD") === 0 ?
        " // CHARACTER WARD PRESET" : "";
      return '<article class="memory-cut" aria-labelledby="memoryCutTitleHeading" ' +
        'aria-describedby="memoryCutAuthority"><header class="memory-cut-hero">' +
        '<div><span>WWAM AFTER MIDNIGHT // VIEWER-CUT SOURCE MACHINE' +
        esc(preset) + '</span><h2 id="memoryCutTitleHeading" tabindex="-1">' +
        'THE MIDNIGHT <em>CUT.</em></h2><p>Turn 3–8 canonical receipts into one ' +
        'manual, source-grounded watch path through the official uploads.</p></div>' +
        '<button type="button" data-memory-cut-action="close" ' +
        'aria-label="Close The Midnight Cut">×</button></header>' +
        authorityMarkup() + editorMarkup() + statsMarkup() + heldMarkup() +
        '<div class="memory-cut-stage">' +
        playerMarkup(stop, state.currentIndex, stops.length) +
        proofMarkup(stop, state.currentIndex, stops.length) + '</div>' +
        railMarkup(stops) + actionMarkup() +
        '<p class="memory-cut-status" id="memoryCutStatus" role="status" ' +
        'aria-live="polite" aria-atomic="true">' + esc(state.status) +
        '</p></article>';
    }

    function heldOnlyMarkup() {
      var eligibleCount = state.eligibleSelections.length;
      var presetAction = typeof engine.getPreset === "function" ?
        '<button type="button" class="memory-cut-preset-action" ' +
        'data-memory-cut-action="load-character-ward">' +
        'LOAD THE CHARACTER WARD PRESET</button>' : "";
      return '<article class="memory-cut memory-cut-refusal" ' +
        'aria-labelledby="memoryCutTitleHeading" aria-describedby="memoryCutAuthority">' +
        '<header class="memory-cut-hero"><div><span>WWAM AFTER MIDNIGHT // ' +
        'FAIL-CLOSED ASSEMBLY</span><h2 id="memoryCutTitleHeading" tabindex="-1">' +
        'THE MIDNIGHT <em>CUT.</em></h2><p>The cut did not invent its way around ' +
        'an incomplete Evidence Bag.</p></div><button type="button" ' +
        'data-memory-cut-action="close" aria-label="Close The Midnight Cut">×</button>' +
        '</header>' + authorityMarkup() + editorMarkup() +
        '<section class="memory-cut-stop-hold"><span>ASSEMBLY HELD // ' +
        esc(eligibleCount) + ' ELIGIBLE</span><h3>THREE CANONICAL STOPS OR IT ' +
        'DOESN’T LEAVE THE EDIT BAY.</h3><p>' + esc(state.error ||
          "Add exact timestamped receipts to the Evidence Bag and try again.") +
        '</p>' + presetAction + '</section>' + heldMarkup() + actionMarkup() +
        '<p class="memory-cut-status" id="memoryCutStatus" role="status" ' +
        'aria-live="polite" aria-atomic="true">' + esc(state.status) +
        '</p></article>';
    }

    function render() {
      if (state.destroyed || !state.open) return;
      if (typeof mount.setAttribute === "function") {
        mount.setAttribute(
          "data-memory-cut-preset",
          state.title.toUpperCase().indexOf("THE CHARACTER WARD") === 0 ?
            "character-ward" : "custom"
        );
      }
      setMountState(state.busy ? "busy" : state.cut ? "ready" : "held");
      mount.innerHTML = state.cut ? readyMarkup() : heldOnlyMarkup();
    }

    function focusHeading() {
      var heading = typeof mount.querySelector === "function" ?
        mount.querySelector("#memoryCutTitleHeading") : null;
      if (!heading || typeof heading.focus !== "function") return;
      var focus = function () {
        try {
          heading.focus({ preventScroll: true });
        } catch {
          heading.focus();
        }
      };
      if (root.requestAnimationFrame) root.requestAnimationFrame(focus);
      else focus();
    }

    function announce(message) {
      state.status = clean(message);
      var node = typeof mount.querySelector === "function" ?
        mount.querySelector("#memoryCutStatus") : null;
      if (node) node.textContent = state.status;
    }

    function invokePlayer(stop, reason) {
      if (!validStop(stop)) return;
      state.playerLoaded = true;
      render();
      callbacks.player({
        mode: "stop",
        reason: reason,
        sourceId: stop.sourceId,
        at: finite(stop.start != null ? stop.start : stop.at),
        start: finite(stop.start != null ? stop.start : stop.at),
        end: finite(stop.end),
        title: stop.title || stop.label || "WWAM SOURCE RECEIPT",
        stop: stop,
        cut: state.cut,
        autoplay: true,
        mountId: "memoryCutPlayer"
      });
      announce(
        "Stop " + (state.currentIndex + 1) + " of " +
        state.cut.stops.length + " loaded at " +
        formatTime(stop.start != null ? stop.start : stop.at) +
        ". Playback advances only when you ask."
      );
    }

    function selectAndPlay(index, reason) {
      var stops = array(state.cut && state.cut.stops);
      if (index < 0 || index >= stops.length) return;
      state.currentIndex = index;
      state.playerLoaded = true;
      invokePlayer(stops[index], reason);
    }

    function replaceEligibleOrder(nextEligible, action, currentKey) {
      state.eligibleSelections = nextEligible.slice();
      state.selections = nextEligible.map(function (entry) {
        return entry.selection;
      }).concat(state.held.map(function (item) {
        return item.selection;
      }));
      state.playerLoaded = false;
      state.cut = null;
      state.error = "";
      try {
        compileNow();
        var nextIndex = array(state.cut.stops).findIndex(function (stop) {
          return stop.key === currentKey;
        });
        state.currentIndex = Math.max(0, nextIndex);
        state.status = action === "remove" ?
          "Stop removed. Playback is dormant until you choose another stop." :
          "Cut order changed. Canonical timestamps did not move.";
      } catch (error) {
        state.cut = null;
        state.error = clean(error && error.message);
        state.status = "Assembly held after the edit.";
      }
      render();
      callbacks.bag({
        action: action,
        selections: state.selections.slice(),
        cut: state.cut,
        held: state.held.slice()
      });
    }

    function moveStop(index, delta) {
      if (!state.cut) return;
      var stops = array(state.cut.stops);
      var target = index + delta;
      if (index < 0 || index >= stops.length || target < 0 || target >= stops.length) return;
      var eligible = state.eligibleSelections.slice();
      var currentKey = currentStop() && currentStop().key;
      var swapped = eligible[index];
      eligible[index] = eligible[target];
      eligible[target] = swapped;
      replaceEligibleOrder(eligible, "reorder", currentKey);
    }

    function removeStop(index) {
      if (!state.cut) return;
      var eligible = state.eligibleSelections.slice();
      if (index < 0 || index >= eligible.length) return;
      var currentKey = currentStop() && currentStop().key;
      eligible.splice(index, 1);
      replaceEligibleOrder(eligible, "remove", currentKey);
    }

    function compileWithViewerCopy() {
      if (!state.cut) throw new Error("No eligible cut is open.");
      var currentKey = currentStop() && currentStop().key;
      var compiled = compileNow();
      var index = array(compiled.stops).findIndex(function (stop) {
        return stop.key === currentKey;
      });
      state.currentIndex = index < 0 ? 0 : index;
      return compiled;
    }

    function copyPacket() {
      try {
        var cut = compileWithViewerCopy();
        var packet = engine.share(cut);
        callbacks.copy({
          packet: packet,
          text: typeof packet === "string" ? packet : JSON.stringify(packet, null, 2),
          cut: cut
        });
        announce(
          "Source-locked share packet copied. Viewer text remains labeled " +
          "non-evidence; excerpts were withheld."
        );
      } catch (error) {
        announce("Share packet held: " + clean(error && error.message));
      }
    }

    function downloadBrief(format) {
      try {
        var cut = compileWithViewerCopy();
        var markdown = format === "markdown";
        var brief = engine.exportEditBrief(cut, markdown ? "markdown" : "json");
        callbacks.download({
          filename: "wwam-" + slug(state.title) +
            (markdown ? "-editor-checklist.md" : "-production-brief.json"),
          brief: brief,
          format: markdown ? "markdown" : "json",
          cut: cut
        });
        announce(
          (markdown ? "Markdown editor checklist" : "JSON production brief") +
          " prepared. It remains a viewer planning document."
        );
      } catch (error) {
        announce("Production brief held: " + clean(error && error.message));
      }
    }

    function loadCharacterWard() {
      if (typeof engine.getPreset !== "function") return;
      state.playerLoaded = false;
      state.cut = null;
      state.error = "";
      try {
        var preset = engine.getPreset("character-ward");
        state.title = clean(preset && preset.title) || "THE CHARACTER WARD";
        state.introduction = clean(preset && preset.introduction);
        state.selections = array(preset && preset.selections).slice();
        compileNow();
        state.currentIndex = 0;
        state.status = "The Character Ward is ready. No video loaded.";
      } catch (error) {
        state.cut = null;
        state.error = clean(error && error.message);
        state.status = "The Character Ward preset was held. No video loaded.";
      }
      render();
      focusHeading();
    }

    function restoreFocus() {
      var target = state.previousFocus;
      state.previousFocus = null;
      if (!target || typeof target.focus !== "function") return;
      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus();
      }
    }

    function close(settings) {
      var optionsValue = settings || {};
      if (!state.open) return;
      var payload = {
        cut: state.cut,
        selections: state.selections.slice()
      };
      state.open = false;
      state.playerLoaded = false;
      state.epoch += 1;
      mount.innerHTML = "";
      removeMountState();
      if (!optionsValue.silent) callbacks.close(payload);
      restoreFocus();
    }

    function open(request) {
      if (state.destroyed) {
        throw new Error("The Midnight Cut UI has been destroyed.");
      }
      var config = request || {};
      state.previousFocus = documentRef && documentRef.activeElement ?
        documentRef.activeElement : null;
      state.open = true;
      state.busy = false;
      state.cut = null;
      state.currentIndex = 0;
      state.playerLoaded = false;
      state.title = clean(config.title || config.cut && config.cut.title) ||
        "THE MIDNIGHT CUT";
      state.introduction = clean(
        config.introduction != null ? config.introduction :
          config.cut && config.cut.introduction
      );
      state.selections = array(config.selections).length ?
        array(config.selections).slice() :
        array(config.cut && config.cut.stops).slice();
      state.eligibleSelections = [];
      state.held = [];
      state.status = "Cut opened. No video loaded.";
      state.error = "";
      state.epoch += 1;
      try {
        if (config.cut) {
          if (!validCut(config.cut)) {
            throw new Error("THE SUPPLIED CUT FAILED ITS CANONICAL CONTRACT.");
          }
          engine.share(config.cut);
          state.cut = config.cut;
          state.eligibleSelections = array(config.cut.stops).map(function (stop, index) {
            return { key: stop.key, selection: state.selections[index] || stop, inputIndex: index };
          });
        } else {
          compileNow();
        }
      } catch (error) {
        state.cut = null;
        state.error = clean(error && error.message);
        if (!state.eligibleSelections.length && state.selections.length) {
          var resolution = resolveSelections(state.selections);
          state.eligibleSelections = resolution.eligible;
          state.held = resolution.held;
        }
        state.status = "Assembly held. No video loaded.";
      }
      render();
      focusHeading();
      return state.cut;
    }

    function onClick(event) {
      var button = closestAction(event && event.target, mount);
      if (!button) return;
      var action = button.getAttribute("data-memory-cut-action");
      var index = Math.floor(finite(button.getAttribute("data-index"), -1));
      if (typeof event.preventDefault === "function") event.preventDefault();
      if (action === "close") close();
      else if (action === "play-current" || action === "replay") {
        invokePlayer(currentStop(), action);
      } else if (action === "previous") {
        selectAndPlay(state.currentIndex - 1, "previous");
      } else if (action === "next") {
        selectAndPlay(state.currentIndex + 1, "next");
      } else if (action === "select") {
        selectAndPlay(index, "direct");
      } else if (action === "move-up") {
        moveStop(index, -1);
      } else if (action === "move-down") {
        moveStop(index, 1);
      } else if (action === "remove") {
        removeStop(index);
      } else if (action === "copy") {
        copyPacket();
      } else if (action === "download") {
        downloadBrief("json");
      } else if (action === "download-markdown") {
        downloadBrief("markdown");
      } else if (action === "load-character-ward") {
        loadCharacterWard();
      }
    }

    function onInput(event) {
      var target = event && event.target;
      if (!target || typeof target.getAttribute !== "function") return;
      var field = target.getAttribute("data-memory-cut-field");
      if (field === "title") state.title = clean(target.value).slice(0, 80) ||
        "THE MIDNIGHT CUT";
      if (field === "introduction") {
        state.introduction = clean(target.value).slice(0, 280);
      }
    }

    function onKeydown(event) {
      if (event && event.key === "Escape") {
        if (typeof event.preventDefault === "function") event.preventDefault();
        if (typeof event.stopPropagation === "function") event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation();
        }
        close();
      }
    }

    mount.addEventListener("click", onClick);
    mount.addEventListener("input", onInput);
    mount.addEventListener("keydown", onKeydown);

    return Object.freeze({
      version: VERSION,
      open: open,
      close: close,
      destroy: function () {
        if (state.destroyed) return;
        close({ silent: true });
        mount.removeEventListener("click", onClick);
        mount.removeEventListener("input", onInput);
        mount.removeEventListener("keydown", onKeydown);
        mount.innerHTML = "";
        removeMountState();
        state.destroyed = true;
      },
      getState: function () {
        return {
          open: state.open,
          cut: state.cut,
          selections: state.selections.slice(),
          eligibleCount: state.eligibleSelections.length,
          held: state.held.slice(),
          currentIndex: state.currentIndex,
          playerLoaded: state.playerLoaded,
          title: state.title,
          introduction: state.introduction,
          status: state.status,
          error: state.error
        };
      }
    });
  }

  root.WWAMMemoryCutUI = Object.freeze({
    VERSION: VERSION,
    CUT_SCHEMA: CUT_SCHEMA,
    REQUEST_SCHEMA: REQUEST_SCHEMA,
    MIN_STOPS: MIN_STOPS,
    MAX_STOPS: MAX_STOPS,
    create: create
  });
})(typeof window !== "undefined" ? window : globalThis);
