(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var INSPECT_SELECTOR =
    'button[data-memory-source][data-id][data-time]';
  var DIMENSION_ORDER = [
    "heat",
    "escalation",
    "callbackDensity",
    "derailment",
    "roomBreak",
    "topicCollision",
  ];
  var LABELS = Object.freeze({
    productName: "COMEDY BLACK BOX",
    anchorName: "RIFF IMPACT",
    contextName: "OFFICIAL CONTEXT WINDOW",
    literalReaction: "LITERAL REACTION CUE",
    unknownReaction: "UNKNOWN",
    dimensions: Object.freeze({
      heat: "SOURCE HEAT",
      escalation: "ESCALATION",
      callbackDensity: "CALLBACK DENSITY",
      derailment: "DERAILMENT",
      roomBreak: "ROOM BREAK",
      topicCollision: "TOPIC COLLISION",
    }),
  });

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function number(value, fallback) {
    var output = Number(value);
    return Number.isFinite(output) ? output : fallback == null ? 0 : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, number(value, minimum)));
  }

  function displayText(value, documentRef) {
    var output = clean(value);
    if (
      !documentRef ||
      !documentRef.body ||
      !documentRef.body.classList ||
      !documentRef.body.classList.contains("office-bleep")
    ) {
      return output;
    }
    return output.replace(
      /\b(fuck(?:ing|ed|er|ers)?|shit(?:ty|ting)?|dick|cock|pussy|cunt|asshole|bitch(?:es)?|goddamn)\b/gi,
      "[BLEEP]"
    );
  }

  function closest(node, selector, boundary) {
    var current = node;
    while (current && current !== boundary) {
      if (typeof current.matches === "function" && current.matches(selector)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function hasClassAncestor(node, className, boundary) {
    var current = node;
    while (current && current !== boundary) {
      if (
        current.classList &&
        typeof current.classList.contains === "function" &&
        current.classList.contains(className)
      ) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function safeFocus(node) {
    if (!node || typeof node.focus !== "function") return;
    try {
      node.focus({ preventScroll: true });
    } catch {
      node.focus();
    }
  }

  function stop(event) {
    if (!event) return;
    if (typeof event.preventDefault === "function") event.preventDefault();
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
  }

  function validEngine(engine) {
    return Boolean(
      engine &&
        typeof engine.list === "function" &&
        typeof engine.inspect === "function" &&
        typeof engine.snapshot === "function" &&
        typeof engine.verify === "function" &&
        typeof engine.serialize === "function"
    );
  }

  function create(options) {
    var config = options || {};
    var engine = config.engine;
    var documentRef = config.document || root.document;
    var navigatorRef = config.navigator || root.navigator || {};
    var BlobClass = config.Blob || root.Blob;
    var URLClass = config.URL || root.URL;
    var listeners = [];
    var bleepObserver = null;
    var previousFocus = null;
    var inspection = null;
    var state = {
      mounted: false,
      open: false,
      receiptId: "",
      error: "",
      lastAction: "",
    };
    var elements = {};

    if (!validEngine(engine)) {
      throw new Error(
        "Comedy Black Box UI requires a compatible ShokkerRiffBlackBoxEngine."
      );
    }

    function byId(id) {
      return documentRef && documentRef.getElementById
        ? documentRef.getElementById(id)
        : null;
    }

    function listen(node, eventName, handler, optionsValue) {
      if (!node || typeof node.addEventListener !== "function") return;
      node.addEventListener(eventName, handler, optionsValue);
      listeners.push(function () {
        node.removeEventListener(eventName, handler, optionsValue);
      });
    }

    function announce(message) {
      state.lastAction = clean(message);
      if (elements.status) elements.status.textContent = state.lastAction;
    }

    function setDrawer(open) {
      state.open = Boolean(open);
      if (!elements.drawer) return;
      if (state.open) {
        elements.drawer.hidden = false;
        elements.drawer.setAttribute("aria-hidden", "false");
        elements.drawer.removeAttribute("inert");
        try {
          elements.drawer.inert = false;
        } catch {}
        if (documentRef.body && documentRef.body.classList) {
          documentRef.body.classList.add("riff-black-box-open");
        }
      } else {
        elements.drawer.setAttribute("aria-hidden", "true");
        elements.drawer.setAttribute("inert", "");
        try {
          elements.drawer.inert = true;
        } catch {}
        elements.drawer.hidden = true;
        if (documentRef.body && documentRef.body.classList) {
          documentRef.body.classList.remove("riff-black-box-open");
        }
      }
    }

    function dimensionDefinition(id) {
      var definitions = Array.isArray(engine.dimensions)
        ? engine.dimensions
        : [];
      return (
        definitions.find(function (definition) {
          return definition.id === id;
        }) || {
          id: id,
          label: LABELS.dimensions[id] || id,
          weight: engine.weights ? engine.weights[id] : 0,
        }
      );
    }

    function dimensionMarkup(item, id) {
      var definition = dimensionDefinition(id);
      var value = clamp(item.dimensions[id], 0, 100);
      var weight = clamp(
        item.weights && item.weights[id] != null
          ? item.weights[id]
          : definition.weight,
        0,
        1
      );
      var contribution = Math.max(
        0,
        number(item.weightedContributions[id], value * weight)
      );
      var label = clean(
        (engine.labels &&
          engine.labels.dimensions &&
          engine.labels.dimensions[id]) ||
          definition.label ||
          LABELS.dimensions[id] ||
          id
      ).toUpperCase();
      return (
        '<div class="riff-dimension">' +
        "<div><b>" +
        esc(label) +
        "</b><span>" +
        Math.round(weight * 100) +
        "% WEIGHT // " +
        contribution.toFixed(2) +
        " PTS</span></div>" +
        '<div class="riff-dimension-track" role="progressbar" aria-label="' +
        esc(label + " " + value + " out of 100") +
        '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
        esc(value) +
        '"><i style="--riff-value:' +
        esc(value) +
        '%"></i></div><strong>' +
        esc(value) +
        "</strong></div>"
      );
    }

    function neighborMarkup(label, item, anchor) {
      if (anchor) {
        return (
          '<article class="riff-neighbor is-impact">' +
          "<span>" +
          esc(label) +
          " // PROMOTED ANCHOR</span><b>" +
          esc(displayText(item.category, documentRef)) +
          " @ " +
          esc(item.timecode) +
          "</b><p>“" +
          esc(displayText(item.literalBasis.excerpt, documentRef)) +
          '”</p><a href="' +
          esc(item.url) +
          '" target="_blank" rel="noopener">PLAY IMPACT ON THE OFFICIAL TAPE ↗</a></article>'
        );
      }
      if (!item) {
        return (
          '<article class="riff-neighbor is-empty"><span>' +
          esc(label) +
          '</span><b>NO INDEXED NEIGHBOR INSIDE ±15:00</b>' +
          "<p>The drawer refuses to invent surrounding beats.</p></article>"
        );
      }
      return (
        '<article class="riff-neighbor"><span>' +
        esc(label) +
        " // NAVIGATION ONLY</span><b>" +
        esc(displayText(item.category, documentRef)) +
        " @ " +
        esc(item.timecode) +
        "</b><p>“" +
        esc(displayText(item.excerpt, documentRef)) +
        '”</p><a href="' +
        esc(item.url) +
        '" target="_blank" rel="noopener">OPEN NEAREST INDEXED RECEIPT ↗</a><small>' +
        esc(Math.abs(number(item.deltaSeconds))) +
        " SECONDS FROM IMPACT // SPEAKER: NULL</small></article>"
      );
    }

    function reactionMarkup(item) {
      var cue = item.reactionCue || {};
      var literal = cue.status === "literal-excerpt-cue" && cue.literal;
      return (
        '<section class="riff-reaction" aria-labelledby="riffReactionTitle"><div><span>REACTION CHANNEL</span>' +
        '<h4 id="riffReactionTitle">' +
        esc(literal ? cue.label : "UNKNOWN") +
        "</h4></div><p>" +
        (literal
          ? 'Literal promoted-excerpt cue: <b>“' +
            esc(displayText(literal, documentRef)) +
            "”</b>. No audience or speaker is inferred."
          : "No allowed literal reaction phrase appears in the promoted excerpt. Silence is not being turned into a reaction claim.") +
        "</p><small>" +
        esc(cue.basis || "REACTION STATUS WAS NOT AVAILABLE") +
        "</small></section>"
      );
    }

    function contextMarkup(item) {
      var context = item.contextWindow;
      var sourceCoordinate =
        item.anchor && item.anchor.sourceAt != null
          ? number(item.anchor.sourceAt, context.anchor)
          : context.anchor;
      var coordinateNote =
        sourceCoordinate === context.anchor
          ? "WHOLE-SECOND SOURCE COORDINATE"
          : "SOURCE INDEX " +
            sourceCoordinate +
            "S NORMALIZED DOWN TO PUBLIC SECOND " +
            context.anchor;
      return (
        '<section class="riff-context" aria-labelledby="riffContextTitle"><header><div><span>OFFICIAL PLAYBACK COORDINATES</span>' +
        '<h4 id="riffContextTitle">OPEN THE TAPE. JUDGE THE ROOM.</h4></div><b>NO AUTOPLAY // NO RECONSTRUCTED DIALOGUE</b></header>' +
        '<div class="riff-context-window"><span>' +
        esc(context.startTimecode) +
        "</span><i></i><strong>" +
        esc(context.anchorTimecode) +
        "</strong><i></i><span>" +
        esc(context.endTimecode) +
        '</span></div><div class="riff-context-actions"><a href="' +
        esc(context.anchorUrl) +
        '" target="_blank" rel="noopener">PLAY THE ANCHOR ↗</a><a href="' +
        esc(context.startUrl) +
        '" target="_blank" rel="noopener">OPEN THE ' +
        esc(context.requestedBeforeSeconds) +
        "S RUNWAY ↗</a></div><p>The window is a coordinate range on the official upload, not a supplied transcript or an explanation of intent.</p><small>" +
        esc(coordinateNote) +
        "</small></section>"
      );
    }

    function basisMarkup(item) {
      var basis = item.literalBasis;
      return (
        '<section class="riff-basis" aria-labelledby="riffBasisTitle"><header><span>PROMOTED LITERAL BASIS</span>' +
        '<h4 id="riffBasisTitle">WHAT THE SCORE WAS ALLOWED TO SEE.</h4></header><blockquote>“' +
        esc(displayText(basis.excerpt, documentRef)) +
        '”</blockquote><dl><div><dt>SOURCE HEAT</dt><dd>' +
        esc(basis.sourceHeat) +
        "</dd></div><div><dt>MATCHED BITS</dt><dd>" +
        esc(basis.matchedBits) +
        "</dd></div><div><dt>INDEXED SUBJECTS</dt><dd>" +
        esc(basis.indexedSubjects) +
        "</dd></div><div><dt>CATEGORY</dt><dd>" +
        esc(displayText(basis.category, documentRef)) +
        "</dd></div><div><dt>EVIDENCE TIER</dt><dd>" +
        esc(displayText(item.evidenceTier || basis.evidenceTier || "UNKNOWN", documentRef)) +
        "</dd></div></dl><p>" +
        esc(basis.basisStatus) +
        "</p><small>" +
        esc(
          String(
            item.evidenceStatus ||
              basis.evidenceStatus ||
              "not-editor-or-creator-certified"
          ).toUpperCase()
        ) +
        " // BOUNDED TO " +
        esc(basis.excerptWordLimit) +
        " WORDS // SPEAKER: NULL // NOT DIARIZED</small></section>"
      );
    }

    function render(item) {
      inspection = item;
      state.receiptId = item.anchor.receiptId;
      state.error = "";
      var anchor = item.anchor;
      var portableFingerprint = clean(engine.binding.chemistryFingerprint);
      if (typeof engine.inspectionPacket === "function") {
        try {
          var portablePacket = engine.inspectionPacket(anchor.receiptId);
          if (portablePacket && portablePacket.fingerprint) {
            portableFingerprint = clean(portablePacket.fingerprint);
          }
        } catch {}
      }
      elements.stage.innerHTML =
        '<div class="riff-autopsy-head"><div><span>' +
        esc(anchor.category) +
        " // " +
        esc(anchor.date || "DATE IN SOURCE") +
        '</span><h3 tabindex="-1" data-riff-autopsy-focus>' +
        esc(displayText(anchor.sourceTitle, documentRef)) +
        "</h3><p>One promoted anchor. Six disclosed inputs. Zero score drift. This explains the machine score—not why the joke worked.</p></div>" +
        '<div class="riff-score" aria-label="Riff chemistry score ' +
        esc(anchor.score) +
        ' out of 100"><span>SCORE</span><b>' +
        esc(anchor.score) +
        "</b><small>" +
        esc(anchor.scoreLabel) +
        "</small></div></div>" +
        '<section class="riff-formula" aria-labelledby="riffFormulaTitle"><header><div><span>DETERMINISTIC SCORE AUTOPSY</span>' +
        '<h4 id="riffFormulaTitle">SIX CHANNELS ENTER. ONE NUMBER LEAVES.</h4></div><b>' +
        esc(anchor.recomputedScore) +
        " RECOMPUTED // " +
        esc(anchor.scoreDrift) +
        " DRIFT</b></header><p>" +
        esc(engine.formula) +
        '</p><div class="riff-dimensions">' +
        DIMENSION_ORDER.map(function (id) {
          return dimensionMarkup(item, id);
        }).join("") +
        "</div></section>" +
        reactionMarkup(item) +
        basisMarkup(item) +
        contextMarkup(item) +
        '<section class="riff-neighborhood" aria-labelledby="riffNeighborhoodTitle"><header><span>INDEXED NEIGHBORHOOD</span>' +
        '<h4 id="riffNeighborhoodTitle">RUNWAY / IMPACT / AFTERSHOCK</h4><p>Nearest indexed navigation coordinates only—not a causal setup or payoff.</p></header><div>' +
        neighborMarkup("RUNWAY", item.neighbors.before, false) +
        neighborMarkup("IMPACT", anchor, true) +
        neighborMarkup("AFTERSHOCK", item.neighbors.after, false) +
        "</div></section>" +
        '<footer class="riff-packet"><div><span>REPRODUCIBLE ONE-RIFF AUTOPSY</span><b>' +
        esc(portableFingerprint) +
        "</b><p>This selected inspection only: bounded public excerpts and source coordinates, with no captions, transcript, media, speaker guess, or causal claim.</p></div>" +
        '<div><button type="button" data-riff-copy>COPY THIS VERIFIED AUTOPSY</button><button type="button" data-riff-download>DOWNLOAD THIS AUTOPSY</button></div></footer>';
      bindPacketActions();
      announce(
        "COMEDY BLACK BOX OPEN // SCORE " +
          anchor.score +
          " // ZERO SCORE DRIFT"
      );
    }

    function renderHeld(sourceId, at, reason) {
      inspection = null;
      state.receiptId = "";
      state.error = clean(reason || "No promoted chemistry anchor matched.");
      elements.stage.innerHTML =
        '<div class="riff-held"><span>BLACK BOX HELD</span>' +
        '<h3 tabindex="-1" data-riff-autopsy-focus>NO CLAIM LEFT THE MACHINE.</h3><p>' +
        esc(state.error) +
        "</p><dl><div><dt>SOURCE</dt><dd>" +
        esc(sourceId || "UNKNOWN") +
        "</dd></div><div><dt>SECOND</dt><dd>" +
        esc(at) +
        "</dd></div></dl><small>The ordinary source tape remains available elsewhere; this autopsy appears only for an exact promoted source-plus-second match.</small></div>";
      announce("COMEDY BLACK BOX HELD // " + state.error);
    }

    function verifiedPacket() {
      var selectedPacketSupported =
        inspection &&
        state.receiptId &&
        typeof engine.inspectionPacket === "function" &&
        typeof engine.verifyInspection === "function" &&
        typeof engine.serializeInspection === "function";
      var packet = selectedPacketSupported
        ? engine.inspectionPacket(state.receiptId)
        : engine.snapshot();
      var report = selectedPacketSupported
        ? engine.verifyInspection(packet)
        : engine.verify(packet);
      if (!report || report.ok !== true) {
        throw new Error(
          "The deterministic packet failed verification and was not released."
        );
      }
      return {
        packet: packet,
        text: selectedPacketSupported
          ? engine.serializeInspection(packet)
          : engine.serialize(packet),
        scope: selectedPacketSupported ? "selected-autopsy" : "full-ledger",
      };
    }

    function fallbackCopy(text) {
      if (
        !documentRef ||
        typeof documentRef.createElement !== "function" ||
        !documentRef.body
      ) {
        throw new Error("Clipboard access is unavailable.");
      }
      var field = documentRef.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      documentRef.body.appendChild(field);
      field.select();
      var copied = documentRef.execCommand && documentRef.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("Clipboard access was blocked.");
    }

    function copyPacket() {
      var verified;
      try {
        verified = verifiedPacket();
      } catch (error) {
        announce("PACKET HELD // " + clean(error.message || error));
        return;
      }
      var operation;
      if (typeof config.copyText === "function") {
        operation = config.copyText(verified.text);
      } else if (
        navigatorRef.clipboard &&
        typeof navigatorRef.clipboard.writeText === "function"
      ) {
        operation = navigatorRef.clipboard.writeText(verified.text);
      } else {
        try {
          fallbackCopy(verified.text);
          announce(
            "VERIFIED ONE-RIFF AUTOPSY COPIED // BOUNDED EXCERPTS ONLY"
          );
        } catch {
          announce("COPY BLOCKED // DOWNLOAD THE VERIFIED PACKET INSTEAD");
        }
        return;
      }
      Promise.resolve(operation)
        .then(function () {
          announce(
            "VERIFIED ONE-RIFF AUTOPSY COPIED // BOUNDED EXCERPTS ONLY"
          );
        })
        .catch(function () {
          announce("COPY BLOCKED // DOWNLOAD THE VERIFIED PACKET INSTEAD");
        });
    }

    function defaultDownload(name, contents) {
      if (!BlobClass || !URLClass || !documentRef) {
        throw new Error("Download APIs are unavailable.");
      }
      var blob = new BlobClass([contents], {
        type: "application/json;charset=utf-8",
      });
      var url = URLClass.createObjectURL(blob);
      var link = documentRef.createElement("a");
      link.href = url;
      link.download = name;
      documentRef.body.appendChild(link);
      link.click();
      link.remove();
      root.setTimeout(function () {
        URLClass.revokeObjectURL(url);
      }, 0);
    }

    function downloadPacket() {
      try {
        var verified = verifiedPacket();
        var fingerprint = clean(verified.packet.fingerprint).replace(
          /[^a-z0-9-]+/gi,
          "-"
        );
        var receiptSlug = clean(state.receiptId || "full-ledger").replace(
          /[^a-z0-9-]+/gi,
          "-"
        );
        var name =
          "wwam-comedy-black-box-" +
          receiptSlug.slice(0, 80) +
          "-" +
          fingerprint +
          ".json";
        if (typeof config.download === "function") {
          config.download(name, verified.text);
        } else {
          defaultDownload(name, verified.text);
        }
        announce(
          "VERIFIED ONE-RIFF AUTOPSY DOWNLOADED // NO MEDIA OR RAW CAPTIONS"
        );
      } catch (error) {
        announce("DOWNLOAD HELD // " + clean(error.message || error));
      }
    }

    function bindPacketActions() {
      var copyButton = elements.stage.querySelector("[data-riff-copy]");
      var downloadButton = elements.stage.querySelector("[data-riff-download]");
      if (copyButton) copyButton.onclick = copyPacket;
      if (downloadButton) downloadButton.onclick = downloadPacket;
    }

    function openFor(button, sourceId, at) {
      previousFocus = button || null;
      setDrawer(true);
      var candidates = engine.list({ sourceId: sourceId }).filter(function (candidate) {
        return candidate.sourceId === sourceId;
      });
      var anchor = candidates.find(function (candidate) {
        return (
          candidate.sourceAt != null &&
          number(candidate.sourceAt, -1) === at
        );
      });
      if (!anchor) {
        var wholeSecondMatches = candidates.filter(function (candidate) {
          return number(candidate.t, -1) === Math.floor(at);
        });
        if (wholeSecondMatches.length === 1) anchor = wholeSecondMatches[0];
      }
      if (!anchor) {
        renderHeld(
          sourceId,
          at,
          "No exact promoted source-plus-second chemistry anchor matched."
        );
      } else {
        var item = engine.inspect(anchor.receiptId);
        if (!item) {
          renderHeld(
            sourceId,
            at,
            "The promoted anchor could not produce a verified inspection."
          );
        } else {
          render(item);
        }
      }
      safeFocus(elements.title);
    }

    function closeDrawer() {
      if (!state.open) return;
      setDrawer(false);
      inspection = null;
      state.receiptId = "";
      announce("COMEDY BLACK BOX CLOSED");
      var target = previousFocus;
      previousFocus = null;
      safeFocus(target);
    }

    function intercept(event) {
      var button = closest(event.target, INSPECT_SELECTOR, elements.section);
      if (!button || !hasClassAncestor(button, "chemistry-grid", elements.section)) {
        return;
      }
      stop(event);
      var sourceId = clean(button.getAttribute("data-id"));
      var rawAt = Number(button.getAttribute("data-time"));
      if (!/^[A-Za-z0-9_-]{11}$/.test(sourceId) || !Number.isFinite(rawAt)) {
        previousFocus = button;
        setDrawer(true);
        renderHeld(
          sourceId,
          Number.isFinite(rawAt) ? rawAt : "INVALID",
          "The chemistry card did not expose a valid official source coordinate."
        );
        safeFocus(elements.title);
        return;
      }
      openFor(button, sourceId, rawAt);
    }

    function focusables() {
      if (!elements.drawer || typeof elements.drawer.querySelectorAll !== "function") {
        return [];
      }
      return Array.prototype.filter.call(
        elements.drawer.querySelectorAll(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
        ),
        function (node) {
          return !node.hidden && node.getAttribute("aria-hidden") !== "true";
        }
      );
    }

    function keydown(event) {
      if (!state.open) return;
      if (event.key === "Escape") {
        stop(event);
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      var nodes = focusables();
      if (!nodes.length) {
        stop(event);
        safeFocus(elements.close);
        return;
      }
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (event.shiftKey && documentRef.activeElement === first) {
        stop(event);
        safeFocus(last);
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        stop(event);
        safeFocus(first);
      }
    }

    function keepFocus(event) {
      if (
        !state.open ||
        !elements.drawer ||
        event.target === elements.drawer ||
        (typeof elements.drawer.contains === "function" &&
          elements.drawer.contains(event.target))
      ) {
        return;
      }
      safeFocus(elements.close);
    }

    function mount() {
      if (state.mounted) return api;
      elements.section = byId("memory");
      elements.drawer = byId("riffBlackBox");
      elements.close = byId("riffBlackBoxClose");
      elements.title = byId("riffBlackBoxTitle");
      elements.stage = byId("riffBlackBoxStage");
      elements.status = byId("riffBlackBoxStatus");
      if (
        !elements.section ||
        !elements.drawer ||
        !elements.close ||
        !elements.title ||
        !elements.stage ||
        !elements.status
      ) {
        throw new Error(
          "Comedy Black Box UI could not find its complete lazy drawer surface."
        );
      }
      state.mounted = true;
      setDrawer(false);
      listen(elements.section, "click", intercept, true);
      listen(elements.close, "click", closeDrawer);
      listen(elements.drawer, "click", function (event) {
        if (event.target === elements.drawer) closeDrawer();
      });
      listen(documentRef, "keydown", keydown, true);
      listen(documentRef, "focusin", keepFocus, true);
      if (root.MutationObserver && documentRef.body) {
        bleepObserver = new root.MutationObserver(function (mutations) {
          var changed = mutations.some(function (mutation) {
            return mutation.attributeName === "class";
          });
          if (changed && state.open && inspection) render(inspection);
        });
        bleepObserver.observe(documentRef.body, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }
      elements.section.setAttribute("data-riff-black-box-ready", "true");
      announce(
        engine.metrics.anchorCount +
          " PROMOTED RIFF ANCHORS READY FOR EXACT AUTOPSY"
      );
      return api;
    }

    function destroy() {
      closeDrawer();
      listeners.splice(0).forEach(function (remove) {
        remove();
      });
      if (bleepObserver) bleepObserver.disconnect();
      bleepObserver = null;
      state.mounted = false;
      if (elements.section) {
        elements.section.removeAttribute("data-riff-black-box-ready");
      }
      return api;
    }

    var api = Object.freeze({
      version: VERSION,
      mount: mount,
      close: closeDrawer,
      openAt: function (sourceId, at) {
        openFor(null, clean(sourceId), number(at, -1));
        return api;
      },
      getState: function () {
        return {
          mounted: state.mounted,
          open: state.open,
          receiptId: state.receiptId,
          error: state.error,
          lastAction: state.lastAction,
        };
      },
      destroy: destroy,
    });
    return api;
  }

  function runtimeEngine() {
    if (
      !root.WWAMShowcaseEngine ||
      typeof root.WWAMShowcaseEngine.create !== "function"
    ) {
      throw new Error("The eager Showcase engine is unavailable.");
    }
    if (
      !root.ShokkerRiffBlackBoxEngine ||
      typeof root.ShokkerRiffBlackBoxEngine.create !== "function"
    ) {
      throw new Error("The Riff Black Box engine did not load.");
    }
    var showcase = root.WWAMShowcaseEngine.create({
      catalog: root.WWAM_CATALOG || {},
      deep: root.WWAM_DEEP_DISTILL || {},
      live: root.WWAM_LIVESTREAMS || {},
      popular: root.WWAM_POPULAR_LIVE || {},
      characters: root.WWAM_CHARACTER_LORE || {},
      dna: root.WWAM_CHANNEL_DNA || {},
    });
    return root.ShokkerRiffBlackBoxEngine.create({
      showcase: showcase,
      labels: LABELS,
      contextSeconds: 15,
      neighborhoodSeconds: 900,
      packFingerprint: showcase.inputFingerprint,
    });
  }

  function autoMount() {
    if (!root.document || root.WWAMRiffBlackBoxUIInstance) return;
    var section = root.document.getElementById("memory");
    if (!section) return;
    try {
      var instance = create({
        engine: runtimeEngine(),
        document: root.document,
        navigator: root.navigator,
        Blob: root.Blob,
        URL: root.URL,
      });
      instance.mount();
      root.WWAMRiffBlackBoxUIInstance = instance;
    } catch (error) {
      section.setAttribute("data-riff-black-box-ready", "false");
      section.setAttribute(
        "data-riff-black-box-error",
        clean(error && (error.code || error.message || error))
      );
    }
  }

  root.WWAMRiffBlackBoxUI = Object.freeze({
    VERSION: VERSION,
    LABELS: LABELS,
    displayText: displayText,
    create: create,
    runtimeEngine: runtimeEngine,
  });

  autoMount();
})(typeof window !== "undefined" ? window : globalThis);
