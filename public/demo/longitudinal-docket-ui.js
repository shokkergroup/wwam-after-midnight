(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var EDIT_DURATIONS = Object.freeze([30, 60, 90]);
  var PAIR_SIGNALS = Object.freeze([
    "MAY_SUPPORT",
    "MAY_BE_MIXED",
    "OPEN",
  ]);
  var instanceCount = 0;

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

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

  function plain(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function integer(value) {
    var output = Number(value);
    return Number.isFinite(output) ? Math.max(0, Math.floor(output)) : 0;
  }

  function timecode(value) {
    var total = integer(value);
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return (hours ? String(hours).padStart(2, "0") + ":" : "") +
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");
  }

  function label(value) {
    return clean(value || "held").replace(/[-_]+/g, " ").toUpperCase();
  }

  function safeSlug(value) {
    return clean(value || "packet")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "packet";
  }

  function pairCount(value) {
    var count = integer(value);
    return count + (count === 1 ? " PAIR" : " PAIRS");
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

  function safeFocus(node) {
    if (!node || typeof node.focus !== "function") return;
    try {
      node.focus({ preventScroll: true });
    } catch {
      node.focus();
    }
  }

  function selectorValue(value) {
    return clean(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function closest(node, attribute, boundary) {
    var current = node;
    while (current && current !== boundary) {
      if (
        typeof current.getAttribute === "function" &&
        current.getAttribute(attribute) != null
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function validInstance(engine) {
    return Boolean(
      engine &&
      typeof engine.getSubjects === "function" &&
      typeof engine.list === "function" &&
      typeof engine.inspect === "function" &&
      typeof engine.buildEditBrief === "function" &&
      typeof engine.verify === "function" &&
      typeof engine.serialize === "function"
    );
  }

  function resolveEngine(config) {
    if (validInstance(config.engine)) return config.engine;
    var factory = config.engine || root.ShokkerLongitudinalDocket;
    if (
      factory &&
      typeof factory.create === "function" &&
      config.data &&
      config.channelPack
    ) {
      return factory.create({
        channelPack: config.channelPack,
        data: config.data,
      });
    }
    throw new Error(
      "The Tape Keeps Score UI requires a compatible longitudinal docket engine."
    );
  }

  function resolveMount(config, documentRef) {
    var target = config.mount || config.root || config.stage;
    if (typeof target === "string" && documentRef) {
      target = documentRef.getElementById(target);
    }
    if (!target && documentRef) {
      target = documentRef.getElementById("memoryStage");
    }
    if (
      !target ||
      typeof target.addEventListener !== "function" ||
      typeof target.removeEventListener !== "function"
    ) {
      throw new Error(
        "The Tape Keeps Score UI requires a mount inside the Memory OS stage."
      );
    }
    return target;
  }

  function officialLink(candidate) {
    var sourceId = clean(candidate && candidate.sourceId);
    var at = integer(candidate && (
      candidate.t != null ? candidate.t : candidate.anchorT
    ));
    var expected = /^[A-Za-z0-9_-]{11}$/.test(sourceId)
      ? "https://www.youtube.com/watch?v=" + sourceId + "&t=" + at + "s"
      : "";
    var supplied = clean(candidate && (
      candidate.url ||
      candidate.receiptUrl ||
      (candidate.suggestedWindow && candidate.suggestedWindow.url)
    ));
    return supplied === expected ? supplied : expected;
  }

  function statusCopy(signal) {
    var value = clean(signal).toUpperCase();
    if (!PAIR_SIGNALS.includes(value)) {
      throw new Error("Unknown longitudinal pair signal; the docket was held.");
    }
    if (value === "MAY_SUPPORT") {
      return {
        formal: "MAY SUPPORT",
        comedy: "THE TAPE RAISED ONE EYEBROW.",
      };
    }
    if (value === "MAY_BE_MIXED") {
      return {
        formal: "MAY BE MIXED",
        comedy: "THE TAPE BROUGHT A SECOND LAWYER.",
      };
    }
    return {
      formal: "OPEN",
      comedy: "THE JURY IS STILL BUYING POPCORN.",
    };
  }

  function create(options) {
    var config = options || {};
    var documentRef = config.document || root.document;
    var BlobClass = config.Blob || root.Blob;
    var URLClass = config.URL || root.URL;
    var engine = resolveEngine(config);
    var mountNode = resolveMount(config, documentRef);
    var uid = "longitudinalDocket" + (++instanceCount);
    var listeners = [];
    var subjects = [];
    var allDockets = [];
    var originalMarkup = "";
    var returnFocus = config.returnFocus || null;
    var state = {
      mounted: false,
      bound: false,
      subjectId: "",
      dockets: [],
      selectedId: "",
      inspection: null,
      editBrief: null,
      status: "",
      error: "",
    };

    function listen(node, eventName, handler) {
      node.addEventListener(eventName, handler);
      listeners.push(function () {
        node.removeEventListener(eventName, handler);
      });
    }

    function subjectMap() {
      return new Map(subjects.map(function (subject) {
        return [subject.id, subject];
      }));
    }

    function subjectNames(ids) {
      var map = subjectMap();
      return array(ids).map(function (id) {
        var subject = map.get(id);
        return subject ? subject.label : id;
      });
    }

    function assertSubjectId(subjectId) {
      var value = clean(subjectId);
      if (value && !subjectMap().has(value)) {
        throw new Error(
          "Unknown longitudinal subject ID; the scoped docket was held."
        );
      }
      return value;
    }

    function verifyPacket(packet, kind) {
      if (!packet || typeof packet !== "object") {
        throw new Error(kind + " was not available from the bounded engine.");
      }
      var report = engine.verify(packet);
      if (!report || report.ok !== true) {
        throw new Error(kind + " failed deterministic verification.");
      }
      return packet;
    }

    function assertInspection(packet) {
      var docket = packet && packet.docket;
      if (
        !docket ||
        docket.relationship !== "MAY_RESOLVE" ||
        docket.verdict !== null ||
        docket.resolutionStatus !== "unresolved" ||
        docket.reviewStatus !== "machine-paired-unreviewed" ||
        docket.promotionAllowed !== false
      ) {
        throw new Error(
          "The longitudinal review packet crossed its unresolved-verdict firewall."
        );
      }
      statusCopy(docket.pairSignal);
      return packet;
    }

    function inspect(docketId) {
      var packet = engine.inspect(docketId);
      verifyPacket(packet, "The longitudinal review packet");
      return assertInspection(packet);
    }

    function assertSummary(docket) {
      if (
        !docket ||
        docket.relationship !== "MAY_RESOLVE" ||
        docket.verdict !== null ||
        docket.resolutionStatus !== "unresolved" ||
        docket.reviewStatus !== "machine-paired-unreviewed" ||
        docket.promotionAllowed !== false
      ) {
        throw new Error(
          "A longitudinal docket summary crossed its unresolved-verdict firewall."
        );
      }
      statusCopy(docket.pairSignal);
      return docket;
    }

    function filteredDockets(subjectId) {
      var filters = { limit: 100 };
      if (subjectId) filters.subjectId = subjectId;
      return plain(engine.list(filters)).map(assertSummary);
    }

    function loadSelection(docketId) {
      var selected = clean(docketId);
      var available = state.dockets.some(function (docket) {
        return docket.id === selected;
      });
      if (!available) selected = state.dockets[0] ? state.dockets[0].id : "";
      state.selectedId = selected;
      state.inspection = selected ? inspect(selected) : null;
      state.editBrief = null;
    }

    function refresh(subjectId, selectedId) {
      state.subjectId = clean(subjectId);
      state.dockets = filteredDockets(state.subjectId);
      loadSelection(selectedId || state.selectedId);
      state.error = "";
    }

    function announce(message) {
      state.status = clean(message);
      if (typeof mountNode.querySelector !== "function") return;
      var node = mountNode.querySelector("[data-longitudinal-status]");
      if (node) node.textContent = state.status;
    }

    function proofMarkup() {
      var shownReceipts = state.inspection
        ? 2 + array(
          state.inspection.response &&
          state.inspection.response.candidate &&
          state.inspection.response.candidate.additionalReceipts
        ).length
        : 0;
      var uniqueTapes = new Set();
      state.dockets.forEach(function (docket) {
        if (docket.forecast) uniqueTapes.add(docket.forecast.sourceId);
        if (docket.response) uniqueTapes.add(docket.response.sourceId);
      });
      var cards = [
        [allDockets.length, "BOUNDED PAIRS ON THE DOCKET"],
        [state.dockets.length, state.subjectId ? "PAIRS SHOWN FOR SUBJECT" : "PAIRS SHOWN"],
        [shownReceipts, "TIMESTAMPED RECEIPTS IN OPEN DOCKET"],
        [uniqueTapes.size, "DISTINCT OFFICIAL TAPES IN FILTER"],
        [0, "PUBLIC VERDICTS"],
      ];
      return '<div class="ld-proof" aria-label="Current bounded docket counts">' +
        cards.map(function (card) {
          return "<article><b>" + esc(card[0]) + "</b><span>" +
            esc(card[1]) + "</span></article>";
        }).join("") + "</div>";
    }

    function filterMarkup() {
      var options = ['<option value="">ALL INDEXED SUBJECTS // ' +
        pairCount(allDockets.length) + "</option>"].concat(subjects.map(function (subject) {
        return '<option value="' + esc(subject.id) + '"' +
          (state.subjectId === subject.id ? " selected" : "") + ">" +
          esc(subject.label.toUpperCase()) + " // " +
          esc(pairCount(subject.docketCount)) + "</option>";
      }));
      return '<div class="ld-filter"><label for="' + uid + 'Subject">' +
        '<span>SUBJECT FILTER</span><b>WHOSE OLD TAPE IS CALLING?</b></label>' +
        '<select id="' + uid + 'Subject" data-longitudinal-subject ' +
        'data-longitudinal-focus="subject-filter" aria-describedby="' +
        uid + 'FilterHelp">' + options.join("") + "</select>" +
        '<small id="' + uid + 'FilterHelp">FILTERING CHANGES THE BOUNDED ' +
        "PAIR LIST. IT DOES NOT CHANGE REVIEW STATUS OR CREATE A VERDICT.</small></div>";
    }

    function docketListMarkup() {
      if (!state.dockets.length) {
        return '<div class="ld-empty"><span>NO PAIR SURVIVED THIS FILTER</span>' +
          "<b>THE TAPE DECLINED TO MAKE SOMETHING UP.</b></div>";
      }
      return '<nav class="ld-list" aria-label="Longitudinal review dockets">' +
        state.dockets.map(function (docket, index) {
          var selected = docket.id === state.selectedId;
          var copy = statusCopy(docket.pairSignal);
          var subjectsCopy = subjectNames(docket.subjects).join(" / ");
          return '<button type="button" data-longitudinal-select="' +
            esc(docket.id) + '" data-longitudinal-focus="docket:' +
            esc(docket.id) + '" aria-pressed="' + (selected ? "true" : "false") +
            '" class="' + (selected ? "is-selected" : "") + '">' +
            "<span>CASE " + String(index + 1).padStart(2, "0") +
            " // MACHINE SIGNAL: " + esc(copy.formal) +
            " // NOT A VERDICT</span><b>" +
            esc(displayText(docket.title, documentRef)) + "</b><small>" +
            esc(subjectsCopy || "SUBJECT HELD") + " // " +
            esc(docket.forecast.date) + " → " +
            esc(docket.response.date) + "</small></button>";
        }).join("") + "</nav>";
    }

    function rightsLedger(source) {
      return '<dl class="ld-rights"><div><dt>SOURCE DATE</dt><dd>' +
        esc(clean(source.date) || "HELD") +
        "</dd></div><div><dt>SOURCE LANE</dt><dd>" +
        esc(label(source.lane)) + "</dd></div><div><dt>RIGHTS MODE</dt><dd>" +
        esc(label(source.rightsMode)) +
        "</dd></div><div><dt>EVIDENCE ACCESS</dt><dd>" +
        esc(label(source.evidenceAccess)) +
        "</dd></div><div><dt>VISUAL CONTEXT</dt><dd>" +
        (source.visualContextVerified === true ? "VERIFIED" : "UNVERIFIED") +
        "</dd></div></dl>";
    }

    function timestampLink(candidate, linkLabel) {
      var href = officialLink(candidate);
      if (!href) {
        return '<span class="ld-link-held">OFFICIAL TIMESTAMP HELD</span>';
      }
      var stamp = clean(candidate.timecode || candidate.anchorTimecode) ||
        timecode(candidate.t != null ? candidate.t : candidate.anchorT);
      return '<a class="ld-tape-link" href="' + esc(href) +
        '" target="_blank" rel="noopener" data-longitudinal-timestamp="' +
        esc(integer(candidate.t != null ? candidate.t : candidate.anchorT)) +
        '">' + esc(linkLabel) + " @ " + esc(stamp) +
        ' <span aria-hidden="true">↗</span></a>';
    }

    function additionalReceiptMarkup(entry, index, fallbackSource) {
      var candidate = entry && entry.candidate ? entry.candidate : entry;
      var source = entry && entry.source ? entry.source : fallbackSource || {};
      return '<article class="ld-additional-receipt"><header><span>LATER ' +
        "COUNTERWEIGHT " + String(index + 1).padStart(2, "0") +
        "</span><b>STILL NOT A VERDICT.</b></header><p>" +
        esc(displayText(candidate.excerpt || "Bounded additional receipt", documentRef)) +
        "</p><small>" + esc(label(source.rightsMode || "rights detail held")) +
        " // SPEAKER WITHHELD // SOURCE-LINK ONLY</small>" +
        timestampLink(candidate, "OPEN ADDITIONAL OFFICIAL TAPE") +
        "</article>";
    }

    function tapeMarkup(kind, bundle) {
      var candidate = bundle.candidate || {};
      var source = bundle.source || {};
      var isBefore = kind === "forecast";
      var additional = isBefore ? [] : array(candidate.additionalReceipts);
      return '<section class="ld-tape ld-tape-' + esc(kind) +
        '" aria-labelledby="' + uid + kind + 'Title"><header><span>' +
        (isBefore ? "BEFORE TAPE // FORECAST CANDIDATE" :
          "AFTER TAPE // RESPONSE CANDIDATE") +
        '</span><b id="' + uid + kind + 'Title">' +
        esc(displayText(source.title || "SOURCE TITLE HELD", documentRef)) +
        "</b></header><blockquote>" +
        esc(displayText(candidate.excerpt || "Bounded excerpt held.", documentRef)) +
        "</blockquote><div class=\"ld-cues\"><span>" +
        esc(label(candidate.cueType || "machine cue")) + "</span><span>" +
        esc(array(candidate.cueTerms).join(" / ") || "CUE TERMS HELD") +
        "</span></div>" + rightsLedger(source) +
        timestampLink(candidate, isBefore ?
          "OPEN BEFORE TAPE" : "OPEN AFTER TAPE") +
        '<small class="ld-no-autoplay">OFFICIAL YOUTUBE SOURCE // EXACT ' +
        "INDEXED SECOND // NO AUTOPLAY // SPEAKER WITHHELD</small>" +
        (additional.length ? '<div class="ld-additional"><h5>ADDITIONAL ' +
          "RESPONSE RECEIPTS // CONTRADICTIONS STAY IN THE ROOM</h5>" +
          additional.map(function (entry, index) {
            return additionalReceiptMarkup(entry, index, source);
          }).join("") + "</div>" : "") + "</section>";
    }

    function statusMarkup(inspection) {
      var docket = inspection.docket;
      var copy = statusCopy(docket.pairSignal);
      return '<aside class="ld-pair-status" aria-label="Pair status">' +
        '<span>MACHINE PAIR SIGNAL // NOT A VERDICT</span><b>' +
        esc(copy.formal) + "</b><h4>THE TAPE PLEADS THE FIFTH.</h4>" +
        '<p class="ld-status-flavor">' + esc(copy.comedy) + "</p>" +
        '<p><strong>RELATIONSHIP: MAY_RESOLVE.</strong> The before and after ' +
        "receipts share indexed subjects and chronology. They do not yet prove " +
        "support, contradiction, correctness, speaker identity, or outcome.</p>" +
        '<div><span>UNREVIEWED</span><b>NO GAVEL. NO VICTORY LAP.</b></div>' +
        '<small>AUTHENTICATED HUMAN REVIEW REQUIRED // PUBLIC VERDICT WITHHELD</small>' +
        "</aside>";
    }

    function whyPairedMarkup(inspection) {
      var docket = inspection.docket;
      var chronology = docket.chronology || {};
      var basis = array(docket.pairBasis);
      var blocks = array(docket.resolutionBlockedBy);
      return '<section class="ld-why" aria-labelledby="' + uid +
        'WhyTitle"><header><div><span>PAIRING RECEIPT</span><h4 id="' + uid +
        'WhyTitle">WHY THESE TAPES SHARE A DOCKET.</h4></div><p>Machine pairing ' +
        "basis is shown in full. It is retrieval evidence, not a public finding." +
        "</p></header><div class=\"ld-why-grid\"><ol>" +
        basis.map(function (entry) {
          return "<li><i aria-hidden=\"true\"></i><span>" +
            esc(label(entry)) + "</span></li>";
        }).join("") + "</ol><dl><div><dt>FORECAST DATE</dt><dd>" +
        esc(chronology.forecastDate || "HELD") +
        "</dd></div><div><dt>RESPONSE DATE</dt><dd>" +
        esc(chronology.responseDate || "HELD") +
        "</dd></div><div><dt>DAYS BETWEEN</dt><dd>" +
        esc(chronology.daysBetween == null ? "HELD" : chronology.daysBetween) +
        "</dd></div><div><dt>RELATIONSHIP</dt><dd>MAY_RESOLVE ONLY</dd></div></dl>" +
        '<div class="ld-blockers"><span>WHY THE CASE STAYS OPEN</span><ul>' +
        blocks.map(function (entry) {
          return "<li>" + esc(label(entry)) + "</li>";
        }).join("") + "</ul><small>" +
        esc(label(inspection.guardrail && inspection.guardrail.verdictAuthority ||
          "authenticated human review")) +
        "</small></div></div></section>";
    }

    function briefSequenceMarkup(item, index) {
      var role = item.role === "forecast" ? "BEFORE" : "AFTER";
      var windowValue = item.suggestedWindow || {};
      var linkCandidate = {
        sourceId: item.sourceId,
        t: windowValue.from,
        timecode: timecode(windowValue.from),
        url: windowValue.url,
      };
      return '<article><header><span>EDIT ' + String(index + 1).padStart(2, "0") +
        " // " + role + "</span><b>" +
        esc(displayText(item.sourceTitle || "SOURCE HELD", documentRef)) +
        "</b></header><p>" +
        esc(displayText(item.excerpt || "Bounded excerpt held.", documentRef)) +
        "</p><dl><div><dt>ANCHOR</dt><dd>" +
        esc(item.anchorTimecode || timecode(item.anchorT)) +
        "</dd></div><div><dt>SOURCE DATE</dt><dd>" +
        esc(clean(item.sourceDate) || "HELD") +
        "</dd></div><div><dt>SUGGESTED WINDOW</dt><dd>" +
        esc(timecode(windowValue.from)) + "–" +
        esc(timecode(windowValue.to)) + "</dd></div><div><dt>WINDOW LENGTH</dt><dd>" +
        esc(windowValue.durationSeconds) + " SEC</dd></div><div><dt>RIGHTS</dt><dd>" +
        esc(label(item.rightsMode)) + "</dd></div></dl>" +
        timestampLink(linkCandidate, "OPEN SUGGESTED SOURCE WINDOW") +
        "<small>SOURCE-LINK ONLY // NO MEDIA // NO RIGHTS CLEARANCE CLAIM</small></article>";
    }

    function editBriefMarkup() {
      var brief = state.editBrief;
      return '<section class="ld-edit" aria-labelledby="' + uid +
        'EditTitle"><header><div><span>BEFORE / AFTER EDIT BRIEF</span><h4 id="' +
        uid + 'EditTitle">CUT THE RECEIPTS. KEEP THE CAVEATS.</h4></div><p>' +
        "Choose an exact total length. The engine divides that budget across " +
        "every before/after receipt and returns source windows—not copied media." +
        '</p></header><div class="ld-duration" role="group" ' +
        'aria-label="Edit brief duration">' + EDIT_DURATIONS.map(function (duration) {
          var selected = brief && brief.targetDurationSeconds === duration;
          return '<button type="button" data-longitudinal-duration="' + duration +
            '" data-longitudinal-focus="duration:' + duration +
            '" aria-pressed="' + (selected ? "true" : "false") + '">' +
            duration + " SEC</button>";
        }).join("") + "</div>" +
        (brief ? '<div class="ld-edit-result" tabindex="-1" ' +
          'data-longitudinal-edit-result><div class="ld-edit-sequence">' +
          array(brief.sequence).map(briefSequenceMarkup).join("") +
          "</div><footer><span>TARGET TOTAL // " +
          esc(brief.targetDurationSeconds) +
          " SECONDS</span><b>VERDICT NULL // AUTOPLAY FALSE // HUMAN REVIEW REQUIRED</b>" +
          "</footer></div>" :
          '<div class="ld-edit-empty">NO EDIT BRIEF BUILT YET. THE SOURCE ' +
          "WINDOWS STAY SEALED UNTIL YOU PICK 30, 60, OR 90.</div>") +
        "</section>";
    }

    function detailMarkup() {
      var inspection = state.inspection;
      if (!inspection) {
        return '<div class="ld-empty ld-empty-detail"><span>NO OPEN DOCKET</span>' +
          "<b>THE TAPE HAS NOTHING HONEST TO PAIR HERE.</b></div>";
      }
      var docket = inspection.docket;
      var names = subjectNames(docket.subjects);
      return '<article class="ld-dossier" aria-labelledby="' + uid +
        'DossierTitle"><header class="ld-dossier-head"><div><span>THE TAPE ' +
        "KEEPS SCORE // REVIEW-REQUIRED DOCKET</span><h3 id=\"" + uid +
        'DossierTitle" tabindex="-1" data-longitudinal-focus="dossier:' +
        esc(docket.id) + '">' +
        esc(displayText(docket.title, documentRef)) +
        '</h3><div class="ld-subjects">' + names.map(function (name) {
          return "<span>" + esc(name) + "</span>";
        }).join("") + "</div></div><button type=\"button\" " +
        'data-longitudinal-download data-longitudinal-focus="download:' +
        esc(docket.id) + '">DOWNLOAD REVIEW PACKET</button></header>' +
        '<div class="ld-triptych">' +
        tapeMarkup("forecast", inspection.forecast || {}) +
        statusMarkup(inspection) +
        tapeMarkup("response", inspection.response || {}) +
        "</div>" + whyPairedMarkup(inspection) + editBriefMarkup() +
        "</article>";
    }

    function heldMarkup(error) {
      return '<section class="longitudinal-docket ld-held" aria-labelledby="' +
        uid + 'Title"><span>DOCKET HELD // FAILED CLOSED</span><h3 id="' +
        uid + 'Title">THE TAPE REFUSED A PLAUSIBLE LIE.</h3><p>' +
        esc(clean(error && error.message ? error.message : error)) +
        "</p><small>NO PAIR, VERDICT, SPEAKER, OR EDIT CLAIM WAS RENDERED.</small>" +
        '<div role="status" aria-live="polite" data-longitudinal-status>' +
        "LONGITUDINAL DOCKET INITIALIZATION HELD</div></section>";
    }

    function focusKey() {
      var active = documentRef && documentRef.activeElement;
      return active && typeof active.getAttribute === "function"
        ? clean(active.getAttribute("data-longitudinal-focus"))
        : "";
    }

    function restoreKey(key) {
      if (!key || typeof mountNode.querySelector !== "function") return;
      var target = mountNode.querySelector(
        '[data-longitudinal-focus="' + selectorValue(key) + '"]'
      );
      safeFocus(target);
    }

    function render(requestedFocus) {
      if (!state.mounted) return api;
      var preserved = clean(requestedFocus || focusKey());
      if (state.error) {
        mountNode.innerHTML = heldMarkup(state.error);
      } else {
        mountNode.innerHTML = '<section class="longitudinal-docket" ' +
          'aria-labelledby="' + uid + 'Title" data-longitudinal-mounted>' +
          '<header class="ld-head"><div><span>V5.13 // THE TAPE KEEPS SCORE</span>' +
          '<h2 id="' + uid + 'Title">BEFORE. AFTER.<br><em>STILL NOT A ' +
          "VERDICT.</em></h2></div><p>Forecast-shaped receipts meet later " +
          "response-shaped receipts across official tapes. The machine can open " +
          "a docket. Only an authorized human can close one.</p></header>" +
          proofMarkup() + filterMarkup() +
          '<div class="ld-workbench"><aside class="ld-index"><header><span>' +
          "OPEN CASES</span><b>" + state.dockets.length +
          " MACHINE-PAIRED // ALL UNREVIEWED</b></header>" +
          docketListMarkup() + "</aside>" + detailMarkup() + "</div>" +
          '<div class="ld-status" role="status" aria-live="polite" ' +
          'aria-atomic="true" data-longitudinal-status>' +
          esc(state.status || "DOCKET READY // NO PUBLIC VERDICTS") +
          "</div></section>";
      }
      restoreKey(preserved);
      return api;
    }

    function chooseSubject(subjectId) {
      try {
        refresh(assertSubjectId(subjectId), "");
        state.status = state.dockets.length
          ? pairCount(state.dockets.length) +
            " SHOWN // EVERY CASE REMAINS OPEN"
          : "NO PAIRS SHOWN // NO SUBSTITUTE CLAIM CREATED";
      } catch (error) {
        state.subjectId = "";
        state.dockets = [];
        state.selectedId = "";
        state.inspection = null;
        state.editBrief = null;
        state.error = clean(error && error.message ? error.message : error);
      }
      return render("subject-filter");
    }

    function chooseDocket(docketId) {
      try {
        loadSelection(docketId);
        state.error = "";
        state.status = state.inspection
          ? "DOCKET OPEN // MAY_RESOLVE // PUBLIC VERDICT WITHHELD"
          : "DOCKET HELD // NO MATCHING PAIR";
      } catch (error) {
        state.error = clean(error && error.message ? error.message : error);
      }
      return render("docket:" + clean(docketId));
    }

    function buildEditBrief(duration) {
      var seconds = Number(duration);
      if (!EDIT_DURATIONS.includes(seconds) || !state.selectedId) return null;
      try {
        var brief = engine.buildEditBrief(state.selectedId, {
          durationSeconds: seconds,
        });
        verifyPacket(brief, "The before/after edit brief");
        if (
          brief.targetDurationSeconds !== seconds ||
          brief.autoplay !== false ||
          brief.verdict !== null ||
          brief.relationship !== "MAY_RESOLVE" ||
          !array(brief.sequence).length
        ) {
          throw new Error("The edit brief crossed its bounded review firewall.");
        }
        state.editBrief = brief;
        state.error = "";
        state.status = seconds + "-SECOND BRIEF BUILT // SOURCE WINDOWS ONLY";
      } catch (error) {
        state.error = clean(error && error.message ? error.message : error);
      }
      render("duration:" + seconds);
      return state.editBrief;
    }

    function save(name, contents) {
      if (typeof config.download === "function") {
        config.download(name, contents);
        return;
      }
      if (
        !documentRef ||
        !BlobClass ||
        !URLClass ||
        typeof URLClass.createObjectURL !== "function"
      ) {
        throw new Error("This browser cannot create the bounded review download.");
      }
      var blob = new BlobClass([contents], { type: "application/json" });
      var href = URLClass.createObjectURL(blob);
      var anchor = documentRef.createElement("a");
      anchor.href = href;
      anchor.download = name;
      anchor.hidden = true;
      documentRef.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URLClass.revokeObjectURL(href);
    }

    function downloadReviewPacket() {
      if (!state.selectedId) return null;
      try {
        var packet = assertInspection(verifyPacket(
          engine.inspect(state.selectedId),
          "The longitudinal review packet"
        ));
        var serialized = engine.serialize(packet);
        var fingerprint = safeSlug(packet.fingerprint || "verified");
        var name = "wwam-longitudinal-review-" +
          safeSlug(state.selectedId) + "-" + fingerprint + ".json";
        save(name, serialized);
        announce(
          "REVIEW PACKET DOWNLOADED // SOURCE LINKS ONLY // NO MEDIA OR VERDICT"
        );
        return packet;
      } catch (error) {
        announce("DOWNLOAD HELD // " + clean(error && error.message ?
          error.message : error));
        return null;
      }
    }

    function onChange(event) {
      var target = closest(
        event && event.target,
        "data-longitudinal-subject",
        mountNode
      );
      if (target) chooseSubject(target.value);
    }

    function onClick(event) {
      var target = event && event.target;
      var docketButton = closest(
        target,
        "data-longitudinal-select",
        mountNode
      );
      if (docketButton) {
        chooseDocket(docketButton.getAttribute("data-longitudinal-select"));
        return;
      }
      var durationButton = closest(
        target,
        "data-longitudinal-duration",
        mountNode
      );
      if (durationButton) {
        buildEditBrief(
          durationButton.getAttribute("data-longitudinal-duration")
        );
        return;
      }
      if (closest(target, "data-longitudinal-download", mountNode)) {
        downloadReviewPacket();
      }
    }

    function onKeydown(event) {
      var button = closest(
        event && event.target,
        "data-longitudinal-select",
        mountNode
      );
      if (!button || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }
      var buttons = typeof mountNode.querySelectorAll === "function"
        ? Array.from(mountNode.querySelectorAll("[data-longitudinal-select]"))
        : [];
      if (!buttons.length) return;
      var current = Math.max(0, buttons.indexOf(button));
      var next = event.key === "Home" ? 0 :
        event.key === "End" ? buttons.length - 1 :
          event.key === "ArrowDown" ? (current + 1) % buttons.length :
            (current - 1 + buttons.length) % buttons.length;
      if (typeof event.preventDefault === "function") event.preventDefault();
      safeFocus(buttons[next]);
    }

    function bind() {
      if (state.bound) return api;
      listen(mountNode, "change", onChange);
      listen(mountNode, "click", onClick);
      listen(mountNode, "keydown", onKeydown);
      state.bound = true;
      return api;
    }

    function mount() {
      if (state.mounted) return api;
      originalMarkup = mountNode.innerHTML;
      if (!returnFocus && documentRef) returnFocus = documentRef.activeElement;
      state.mounted = true;
      mountNode.setAttribute("aria-busy", "true");
      mountNode.setAttribute("data-longitudinal-host", "");
      try {
        var dataReport = engine.verify();
        if (!dataReport || dataReport.ok !== true) {
          throw new Error("The longitudinal data artifact failed verification.");
        }
        subjects = plain(engine.getSubjects());
        allDockets = plain(engine.list({ limit: 100 }));
        var initialSubjectId = assertSubjectId(config.initialSubjectId);
        refresh(initialSubjectId, allDockets[0] ? allDockets[0].id : "");
        state.status = state.dockets.length + " BOUNDED " +
          (state.dockets.length === 1 ? "PAIR" : "PAIRS") + " READY" +
          (initialSubjectId ? " FOR REQUESTED SUBJECT" : "") +
          " // ZERO PUBLIC VERDICTS";
      } catch (error) {
        state.error = clean(error && error.message ? error.message : error);
      }
      bind();
      render();
      mountNode.setAttribute("aria-busy", "false");
      return api;
    }

    function destroy() {
      listeners.splice(0).forEach(function (remove) {
        remove();
      });
      state.bound = false;
      if (state.mounted && config.restoreOnDestroy !== false) {
        mountNode.innerHTML = originalMarkup;
      } else if (state.mounted) {
        mountNode.innerHTML = "";
      }
      if (typeof mountNode.removeAttribute === "function") {
        mountNode.removeAttribute("data-longitudinal-host");
        mountNode.removeAttribute("aria-busy");
      }
      state.mounted = false;
      state.inspection = null;
      state.editBrief = null;
      if (config.restoreFocusOnDestroy !== false) {
        safeFocus(returnFocus);
      }
      return api;
    }

    var api = Object.freeze({
      version: VERSION,
      mount: mount,
      render: render,
      setSubject: chooseSubject,
      getState: function () {
        return plain({
          mounted: state.mounted,
          bound: state.bound,
          subjectId: state.subjectId,
          docketCount: state.dockets.length,
          selectedId: state.selectedId,
          editDuration: state.editBrief
            ? state.editBrief.targetDurationSeconds
            : 0,
          status: state.status,
          error: state.error,
        });
      },
      destroy: destroy,
    });
    return api;
  }

  root.WWAMLongitudinalDocketUI = Object.freeze({
    VERSION: VERSION,
    EDIT_DURATIONS: EDIT_DURATIONS,
    PAIR_SIGNALS: PAIR_SIGNALS,
    create: create,
    timecode: timecode,
    officialLink: officialLink,
    statusCopy: statusCopy,
  });
})(typeof window !== "undefined" ? window : globalThis);
