(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var DEFAULT_LABELS = Object.freeze({
    product: "THE YEARS HAVE TEETH",
    marquee: "THE MARQUEE",
    memory: "WHAT THE TAPES REMEMBER",
    quarantine: "THE QUARANTINE DRAWER",
    route: "PLAY THE YEAR"
  });

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

  function integer(value) {
    var number = Number(value);
    return Number.isInteger(number) ? number : 0;
  }

  function formatNumber(value) {
    return Math.max(0, Number(value) || 0).toLocaleString("en-US");
  }

  function formatHours(seconds, supplied) {
    var hours = Number(supplied);
    if (!Number.isFinite(hours)) hours = (Number(seconds) || 0) / 3600;
    return (Math.round(hours * 10) / 10).toFixed(1) + "H";
  }

  function timecode(value) {
    var total = Math.max(0, Math.floor(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor(total % 3600 / 60);
    var seconds = total % 60;
    return [hours, minutes, seconds].map(function (part) {
      return String(part).padStart(2, "0");
    }).join(":");
  }

  function normalizeYears(value) {
    return Array.from(new Set(array(value).map(integer).filter(function (year) {
      return year >= 1900 && year <= 2200;
    }))).sort(function (a, b) { return b - a; });
  }

  function capsuleLink(href, year, URLConstructor) {
    var URLClass = URLConstructor || root.URL;
    if (!URLClass) return "";
    var url = new URLClass(clean(href) || "https://example.invalid/");
    url.searchParams.set("capsuleYear", String(integer(year)));
    url.hash = "time-capsules";
    return url.toString();
  }

  function displayText(value, documentRef) {
    var output = clean(value);
    if (!documentRef || !documentRef.body ||
        !documentRef.body.classList.contains("office-bleep")) return output;
    return output.replace(
      /\b(fuck(?:ing|ed|er|ers)?|shit(?:ty|ting)?|dick|cock|pussy|cunt|asshole|bitch(?:es)?|goddamn)\b/gi,
      "[BLEEP]"
    );
  }

  function coverageLabel(value) {
    return clean(value || "metadata-only").replace(/-/g, " ").toUpperCase();
  }

  function validEngine(engine) {
    return Boolean(engine &&
      typeof engine.getYears === "function" &&
      typeof engine.build === "function" &&
      typeof engine.verify === "function" &&
      typeof engine.serialize === "function");
  }

  function create(options) {
    var config = options || {};
    var engine = config.engine;
    var documentRef = config.document || root.document;
    var locationRef = config.location || root.location || { href: "" };
    var navigatorRef = config.navigator || root.navigator || {};
    var URLClass = config.URL || root.URL;
    var BlobClass = config.Blob || root.Blob;
    var years = [];
    var listeners = [];
    var bleepObserver = null;
    var elements = {};
    var state = {
      mounted: false,
      busy: false,
      year: 0,
      capsule: null,
      error: "",
      lastAction: ""
    };

    if (!validEngine(engine)) {
      throw new Error("Time Capsule UI requires a compatible ShokkerEraCapsuleEngine.");
    }

    function byId(id) {
      return documentRef && documentRef.getElementById(id);
    }

    function listen(node, event, handler) {
      if (!node || typeof node.addEventListener !== "function") return;
      node.addEventListener(event, handler);
      listeners.push(function () { node.removeEventListener(event, handler); });
    }

    function announce(message) {
      state.lastAction = clean(message);
      if (elements.status) elements.status.textContent = state.lastAction;
    }

    function setBusy(busy) {
      state.busy = Boolean(busy);
      if (elements.section) {
        elements.section.setAttribute("aria-busy", busy ? "true" : "false");
      }
      if (elements.year) elements.year.disabled = busy || !years.length;
      if (elements.build) elements.build.disabled = busy || !years.length;
    }

    function focusResult() {
      var target = elements.stage &&
        elements.stage.querySelector("[data-era-result-focus]");
      if (!target || typeof target.focus !== "function") return;
      var focus = function () {
        try {
          target.focus({ preventScroll: true });
        } catch {
          target.focus();
        }
      };
      if (root.requestAnimationFrame) root.requestAnimationFrame(focus);
      else focus();
    }

    function proofMarkup(capsule) {
      var feed = capsule.feed || {};
      var coverage = feed.coverage || {};
      var quarantine = capsule.quarantine || {};
      var cards = [
        [formatNumber(feed.uploads), "CACHED FEED UPLOADS"],
        [formatHours(feed.totalDurationSeconds, feed.hours), "CACHED FEED RUNTIME"],
        [formatNumber(feed.cachedViews), "CACHED VIEWS // NOT CURRENT"],
        [formatNumber(coverage.deeplyIndexed), "DEEP IN THE FEED LEDGER"],
        [formatNumber(quarantine.candidateCount), "QUARANTINED CANDIDATES"]
      ];
      return '<div class="era-capsule-proof">' + cards.map(function (card) {
        return "<article><b>" + esc(card[0]) + "</b><span>" +
          esc(card[1]) + "</span></article>";
      }).join("") + "</div>";
    }

    function topUploadsMarkup(capsule) {
      var feed = capsule.feed || {};
      var uploads = array(feed.topUploads);
      var coverage = feed.coverage || {};
      var summary = formatNumber(coverage.deeplyIndexed) + " DEEP // " +
        formatNumber(coverage.metadataOnly) + " METADATA-ONLY // " +
        formatNumber(coverage.captionLimited) + " LIMITED // " +
        formatNumber(coverage.unavailable) + " UNAVAILABLE";
      return '<section class="era-capsule-marquee" aria-labelledby="eraMarqueeTitle">' +
        '<header class="era-panel-head"><div><span>CACHED STREAMS-FEED SNAPSHOT</span>' +
        '<h4 id="eraMarqueeTitle">THE MARQUEE.</h4></div><p>' + esc(summary) +
        ". Titles, dates, runtimes, thumbnails, and cached views are metadata. " +
        "They do not prove what happened inside an undistilled upload.</p></header>" +
        (uploads.length ? '<ol class="era-upload-list">' + uploads.map(function (upload) {
          var title = displayText(upload.title, documentRef);
          var image = clean(upload.thumbnail);
          var url = clean(upload.url);
          return "<li>" + (image ? '<img loading="lazy" src="' + esc(image) +
            '" alt="">' : "") + "<div><span>" +
            esc(clean(upload.date) + " // " + coverageLabel(upload.coverage)) +
            "</span><b>" + esc(title) + "</b><small>" +
            formatNumber(upload.cachedViews) + " CACHED VIEWS // " +
            esc(formatHours(upload.durationSeconds)) + "</small>" +
            (url ? '<a href="' + esc(url) +
              '" target="_blank" rel="noopener">OPEN UPLOAD &nearr;</a>' : "") +
            "</div></li>";
        }).join("") + "</ol>" :
          '<div class="era-empty-ledger">NO TOP-UPLOAD METADATA IS AVAILABLE FOR THIS YEAR.</div>') +
        "</section>";
    }

    function receiptMarkup(receipt) {
      var at = Number(receipt.t != null ? receipt.t : receipt.at) || 0;
      var timestamp = clean(receipt.timecode) || timecode(at);
      var title = displayText(
        receipt.sourceTitle || receipt.title || "INDEXED SOURCE",
        documentRef
      );
      var excerpt = displayText(
        receipt.excerpt || receipt.label || "Playable indexed receipt",
        documentRef
      );
      var url = clean(receipt.url);
      return "<li><span>PLAYABLE INDEXED RECEIPT // " +
        esc(clean(receipt.date) || "DATE HELD") + "</span><b>" + esc(excerpt) +
        "</b><small>" + esc(title) + " // " +
        esc(clean(receipt.evidenceLevel) || "TIMESTAMP-BOUND") +
        " // SPEAKER WITHHELD</small>" + (url ?
          '<a href="' + esc(url) + '" target="_blank" rel="noopener">' +
          esc(timestamp) + " OPEN OFFICIAL TAPE &nearr;</a>" : "") + "</li>";
    }

    function loreMarkup(entry) {
      var label = displayText(
        entry.label || entry.title || entry.name || entry.id || "INDEXED LORE ARRIVAL",
        documentRef
      );
      var detail = clean(
        entry.kind || entry.type || entry.evidenceLevel || "source-linked index entry"
      ).toUpperCase();
      var url = clean(entry.url);
      var at = Number(entry.t != null ? entry.t : entry.at) || 0;
      return "<li><span>LORE ARRIVAL // INDEXED, NOT DEFINITIVE ORIGIN</span><b>" +
        esc(label) + "</b><small>" + esc(detail) +
        " // CONNECTION MEANS PRESENT IN THIS BOUNDED ARCHIVE</small>" +
        (url ? '<a href="' + esc(url) +
          '" target="_blank" rel="noopener">' + esc(timecode(at)) +
          " OPEN RECEIPT &nearr;</a>" : "") + "</li>";
    }

    function memoryMarkup(capsule) {
      var memory = capsule.memory || {};
      var receipts = array(memory.receiptPreview);
      var lore = array(memory.loreArrivals);
      var items = receipts.slice(0, 6).map(receiptMarkup)
        .concat(lore.slice(0, 3).map(loreMarkup));
      var metrics = formatNumber(memory.sourceCount) + " INDEXED SOURCES // " +
        formatNumber(memory.receiptCount) + " PLAYABLE RECEIPTS // " +
        formatNumber(memory.loreArrivalCount) + " LORE ARRIVALS";
      return '<section class="era-memory" aria-labelledby="eraMemoryTitle">' +
        '<header class="era-panel-head"><div><span>PROMOTED-CORPUS MEMORY // SOURCE-BOUND</span>' +
        '<h4 id="eraMemoryTitle">WHAT THE TAPES REMEMBER.</h4></div><p>' +
        esc(metrics) + ". This ledger can include indexed sources outside the cached " +
        "Streams-feed snapshot; the two ledgers are intentionally not collapsed.</p></header>" +
        (memory.available && items.length ? '<ol class="era-memory-list">' +
          items.join("") + "</ol>" :
          '<div class="era-empty-ledger">THIS YEAR EXISTS IN THE FEED LEDGER, BUT NO ' +
          "PLAYABLE PROMOTED-CORPUS MEMORY IS AVAILABLE HERE. NO TOPICS, TAKES, OR " +
          "QUOTES WERE INFERRED FROM METADATA.</div>") + "</section>";
    }

    function quarantineCandidateMarkup(candidate) {
      var title = displayText(
        candidate.sourceTitle || candidate.title || "ARCHIVE DEEP SOURCE",
        documentRef
      );
      var excerpt = displayText(
        candidate.excerpt || candidate.label || "Machine-surfaced candidate",
        documentRef
      );
      var rawBatch = candidate.archiveBatch || candidate.batch;
      var batch = clean(
        rawBatch && typeof rawBatch === "object" ? rawBatch.id : rawBatch
      ) || "BATCH RECEIPT HELD";
      return "<li><span>MACHINE-SURFACED // PROMOTION FORBIDDEN</span><b>" +
        esc(excerpt) + "</b><small>" + esc(title) + " // " + esc(batch.toUpperCase()) +
        " // SPEAKER UNKNOWN / NOT DIARIZED</small></li>";
    }

    function quarantineMarkup(capsule) {
      var quarantine = capsule.quarantine || {};
      var candidates = array(quarantine.candidates);
      var topics = array(quarantine.topics);
      return '<aside class="era-capsule-drawer" aria-labelledby="eraDrawerTitle">' +
        '<header class="era-panel-head"><div><span>SEPARATE MACHINE-CANDIDATE LEDGER</span>' +
        '<h4 id="eraDrawerTitle">THE QUARANTINE DRAWER.</h4></div><p>' +
        esc(formatNumber(quarantine.sourceCount) + " SOURCES // " +
          formatNumber(quarantine.candidateCount) + " CANDIDATES // " +
          formatNumber(quarantine.topicLaneCount) + " TOPIC LANES") +
        ". These items cannot rank, quote, attribute, or promote themselves.</p></header>" +
        (quarantine.available && candidates.length ?
          '<ol class="era-quarantine-list">' +
          candidates.slice(0, 5).map(quarantineCandidateMarkup).join("") + "</ol>" :
          '<div class="era-empty-ledger">NO ARCHIVE DEEP CANDIDATES ARE ATTACHED TO ' +
          "THIS YEAR. ABSENCE HERE IS NOT A CLAIM THAT NOTHING MEMORABLE HAPPENED.</div>") +
        (topics.length ? '<div class="era-topic-chips" aria-label="Sampled quarantine topic lanes">' +
          topics.slice(0, 8).map(function (topic) {
            return "<span>" + esc(displayText(
              topic.label || topic.topic || topic.name || topic.id,
              documentRef
            )) + " // QUARANTINE</span>";
          }).join("") + "</div>" : "") + "</aside>";
    }

    function routeMarkup(capsule) {
      var route = capsule.route || {};
      var stops = array(route.stops).slice(0, 5);
      return '<section class="era-route" aria-labelledby="eraRouteTitle">' +
        '<header class="era-panel-head"><div><span>DETERMINISTIC FIVE-STOP OFFICIAL-YOUTUBE ROUTE</span>' +
        '<h4 id="eraRouteTitle">PLAY THE YEAR.</h4></div><p>' +
        esc(formatNumber(route.count) + " STOPS // AUTOPLAY " +
          (route.autoplay === false ? "OFF" : "FORBIDDEN") + " // BASIS " +
          (clean(route.basis) || "HELD")) +
        ". Each door opens the original upload at the exact indexed second. " +
        "The order is reproducible; it is not a definitive best-of list.</p></header>" +
        (route.available && stops.length ?
          '<ol class="era-route-list">' + stops.map(function (stop) {
            var at = Number(stop.t) || 0;
            var routeEvidence = clean(stop.evidenceLevel);
            var quarantined = /quarant|archive[\s-]*deep/i.test(
              clean(stop.label) + " " + routeEvidence
            );
            var routeState = quarantined
              ? "QUARANTINED STOP // PROMOTION FORBIDDEN"
              : "PLAYABLE INDEXED RECEIPT";
            return "<li><span>" + esc(routeState) +
              " // " + esc(clean(stop.date) || "DATE HELD") + "</span><b>" +
              esc(displayText(stop.excerpt || stop.sourceTitle, documentRef)) +
              "</b><p>" + esc(displayText(stop.sourceTitle, documentRef)) +
              " // " + esc(clean(stop.label) || "DETERMINISTIC STOP") +
              " // " + esc(routeEvidence || "TIMESTAMP-BOUND") +
              (quarantined
                ? " // MACHINE CANDIDATE // SPEAKER UNKNOWN"
                : " // SPEAKER WITHHELD") + "</p>" +
              (clean(stop.url) ? '<a href="' + esc(stop.url) +
                '" target="_blank" rel="noopener">' +
                esc(clean(stop.timecode) || timecode(at)) +
                " PLAY ON YOUTUBE &nearr;</a>" : "") + "</li>";
          }).join("") + "</ol>" :
          '<div class="era-empty-ledger">A FIVE-STOP ROUTE CANNOT BE BUILT FROM THIS ' +
          "YEAR'S CURRENT PLAYABLE RECEIPTS. THE CAPSULE REMAINS A FACTUAL METADATA VIEW.</div>") +
        "</section>";
    }

    function fingerprintMarkup(capsule) {
      var provenance = capsule.provenance || {};
      return '<footer class="era-capsule-footnote"><span>BOUNDED CAPSULE // NO RAW ' +
        "CAPTIONS // NO MEDIA // CACHED VIEWS ARE NOT CURRENT</span><code>" +
        esc(clean(capsule.fingerprint) || "FINGERPRINT HELD") + " // ATLAS " +
        esc(clean(provenance.atlasFingerprint) || "N/A") + " // INDEX " +
        esc(clean(provenance.showcaseFingerprint) || "N/A") + " // ARCHIVE DEEP " +
        esc(clean(provenance.archiveDeepFingerprint) || "N/A") + "</code></footer>";
    }

    function render(capsule, shouldFocus) {
      var feed = capsule.feed || {};
      var year = integer(capsule.year);
      elements.stage.innerHTML =
        '<article class="era-capsule-result"><header data-year="' + esc(year) +
        '"><div><span>YEAR ' + esc(year) + " // SOURCE-GROUNDED TIME CAPSULE</span>" +
        '<h3 tabindex="-1" data-era-result-focus>' + esc(year) +
        "<em>THE YEAR BIT BACK.</em></h3></div>" +
        '<div class="era-capsule-actions"><button type="button" data-era-copy>' +
        "COPY YEAR LINK</button><button type=\"button\" data-era-download>" +
        "DOWNLOAD BOUNDED MANIFEST</button><small>Manifest contains source coordinates, " +
        "counts, evidence labels, and fingerprints&mdash;never raw captions or media.</small>" +
        "</div></header>" + proofMarkup(capsule) +
        '<div class="era-capsule-split">' + topUploadsMarkup(capsule) +
        quarantineMarkup(capsule) + "</div>" + memoryMarkup(capsule) +
        routeMarkup(capsule) + fingerprintMarkup(capsule) + "</article>";
      bindResultActions();
      announce(year + " CAPSULE OPEN // " + formatNumber(feed.uploads) +
        " FEED RECORDS // " + formatNumber((capsule.memory || {}).receiptCount) +
        " INDEXED RECEIPTS // ALL BLIND SPOTS LEFT VISIBLE");
      if (shouldFocus) focusResult();
    }

    function renderHeld(message, shouldFocus) {
      elements.stage.innerHTML = '<div class="era-capsule-held"><span>CAPSULE HELD // ' +
        'FAILED CLOSED</span><h3 tabindex="-1" data-era-result-focus>THE YEAR WOULD NOT ' +
        "OPEN.</h3><p>" + esc(clean(message) ||
          "The source ledgers did not reconcile, so no plausible-looking capsule was rendered.") +
        "</p></div>";
      announce("TIME CAPSULE HELD // NO CLAIMS RENDERED");
      if (shouldFocus) focusResult();
    }

    function currentVerification() {
      if (!state.capsule) throw new Error("Build a capsule before exporting it.");
      var result = engine.verify(state.capsule);
      if (!result || result.ok !== true) {
        throw new Error("Capsule verification failed. Rebuild before exporting.");
      }
      return result;
    }

    function copyText(value) {
      if (config.copyText) return Promise.resolve(config.copyText(value));
      if (navigatorRef.clipboard &&
          typeof navigatorRef.clipboard.writeText === "function") {
        return navigatorRef.clipboard.writeText(value);
      }
      return new Promise(function (resolve, reject) {
        try {
          var node = documentRef.createElement("textarea");
          node.value = value;
          node.setAttribute("readonly", "");
          node.style.position = "fixed";
          node.style.opacity = "0";
          documentRef.body.appendChild(node);
          node.select();
          if (!documentRef.execCommand || !documentRef.execCommand("copy")) {
            throw new Error("Clipboard permission unavailable.");
          }
          node.remove();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }

    function download(name, contents) {
      if (config.download) return config.download(name, contents);
      if (!BlobClass || !URLClass || typeof URLClass.createObjectURL !== "function") {
        throw new Error("Download support is unavailable in this browser.");
      }
      var blob = new BlobClass([contents], { type: "application/json" });
      var url = URLClass.createObjectURL(blob);
      var anchor = documentRef.createElement("a");
      anchor.href = url;
      anchor.download = name;
      documentRef.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URLClass.revokeObjectURL(url);
    }

    function bindResultActions() {
      var copy = elements.stage.querySelector("[data-era-copy]");
      var exportButton = elements.stage.querySelector("[data-era-download]");
      if (copy) copy.onclick = function () {
        try {
          currentVerification();
          var link = capsuleLink(locationRef.href, state.year, URLClass);
          if (!link) throw new Error("A reproducible URL could not be built.");
          copyText(link).then(function () {
            announce(state.year + " CAPSULE LINK COPIED // SAME YEAR, SAME ROUTE");
            copy.focus();
          }).catch(function () {
            announce("COPY BLOCKED // THE BOUNDED MANIFEST CAN STILL BE DOWNLOADED");
            copy.focus();
          });
        } catch (error) {
          announce("COPY HELD // " + clean(error.message || error));
        }
      };
      if (exportButton) exportButton.onclick = function () {
        try {
          currentVerification();
          var serialized = engine.serialize(state.capsule);
          download("wwam-time-capsule-" + state.year + "-" +
            clean(state.capsule.fingerprint).replace(/[^a-z0-9_-]+/gi, "-") +
            ".json", serialized);
          announce(state.year +
            " BOUNDED EVIDENCE MANIFEST DOWNLOADED // NO RAW CAPTIONS OR MEDIA");
          exportButton.focus();
        } catch (error) {
          announce("EXPORT HELD // " + clean(error.message || error));
        }
      };
    }

    function build(year, shouldFocus) {
      if (state.busy) return null;
      var selected = integer(year);
      if (!years.includes(selected)) {
        state.capsule = null;
        state.error = "That year is outside the bounded capsule ledger.";
        renderHeld(state.error, shouldFocus);
        return null;
      }
      setBusy(true);
      announce("OPENING " + selected + " // RECONCILING FEED, MEMORY, AND QUARANTINE");
      try {
        var capsule = engine.build(selected);
        var verification = engine.verify(capsule);
        if (!verification || verification.ok !== true) {
          throw new Error("The capsule failed its deterministic verification.");
        }
        state.year = selected;
        state.capsule = capsule;
        state.error = "";
        if (elements.year) elements.year.value = String(selected);
        render(capsule, shouldFocus);
        return capsule;
      } catch (error) {
        state.capsule = null;
        state.error = clean(error && error.message ? error.message : error);
        renderHeld(state.error, shouldFocus);
        return null;
      } finally {
        setBusy(false);
      }
    }

    function requestedYear() {
      try {
        var parsed = new URLClass(clean(locationRef.href) || "https://example.invalid/");
        return integer(parsed.searchParams.get("capsuleYear"));
      } catch {
        return 0;
      }
    }

    function restoreDirectRoutePosition() {
      try {
        var parsed = new URLClass(clean(locationRef.href) || "https://example.invalid/");
        if (parsed.hash !== "#time-capsules" || !elements.section ||
            typeof elements.section.scrollIntoView !== "function") return;
        var restore = function () {
          elements.section.scrollIntoView({ block: "start" });
        };
        if (root.requestAnimationFrame) root.requestAnimationFrame(restore);
        else restore();
      } catch {
        // Route positioning is progressive enhancement; the capsule remains usable.
      }
    }

    function mount() {
      if (state.mounted) return api;
      elements = {
        section: byId("time-capsules"),
        form: byId("eraCapsuleForm"),
        year: byId("eraCapsuleYear"),
        build: byId("eraCapsuleBuild"),
        status: byId("eraCapsuleStatus"),
        stage: byId("eraCapsuleStage")
      };
      if (!elements.section || !elements.form || !elements.year ||
          !elements.build || !elements.status || !elements.stage) {
        throw new Error("Time Capsule UI could not find its complete section.");
      }
      state.mounted = true;
      years = normalizeYears(engine.getYears());
      if (!years.length) {
        state.error = "No capsule years are available in the bounded atlas.";
        renderHeld(state.error, false);
        setBusy(false);
        return api;
      }
      elements.year.innerHTML = years.map(function (year) {
        return '<option value="' + year + '">' + year + " ARCHIVE CAPSULE</option>";
      }).join("");
      listen(elements.form, "submit", function (event) {
        event.preventDefault();
        build(elements.year.value, true);
      });
      listen(elements.year, "change", function () {
        announce(elements.year.value +
          " SELECTED // BREAK THE SEAL TO BUILD ITS VERIFIED CAPSULE");
      });
      if (root.MutationObserver && documentRef.body) {
        bleepObserver = new root.MutationObserver(function (mutations) {
          var changed = mutations.some(function (mutation) {
            return mutation.attributeName === "class";
          });
          if (changed && state.capsule) render(state.capsule, false);
        });
        bleepObserver.observe(documentRef.body, {
          attributes: true,
          attributeFilter: ["class"]
        });
      }
      var initial = requestedYear();
      if (!years.includes(initial)) initial = years[0];
      elements.year.value = String(initial);
      setBusy(false);
      build(initial, false);
      restoreDirectRoutePosition();
      return api;
    }

    function destroy() {
      listeners.splice(0).forEach(function (remove) { remove(); });
      if (bleepObserver) bleepObserver.disconnect();
      bleepObserver = null;
      state.mounted = false;
      state.capsule = null;
      return api;
    }

    var api = Object.freeze({
      version: VERSION,
      mount: mount,
      build: build,
      getState: function () {
        return {
          mounted: state.mounted,
          busy: state.busy,
          year: state.year,
          capsule: state.capsule,
          error: state.error,
          lastAction: state.lastAction
        };
      },
      destroy: destroy
    });
    return api;
  }

  function optional(work) {
    try {
      return work();
    } catch {
      return null;
    }
  }

  function runtimeEngine() {
    if (!root.ShokkerEraCapsuleEngine ||
        typeof root.ShokkerEraCapsuleEngine.create !== "function") {
      throw new Error("The Time Capsule engine did not load.");
    }
    var atlas = optional(function () {
      return root.WWAMArchiveAtlasEngine.create(root.WWAM_ARCHIVE_ATLAS);
    });
    if (!atlas) throw new Error("The cached archive ledger did not initialize.");

    var showcase = optional(function () {
      return root.WWAMShowcaseEngine.create({
        catalog: root.WWAM_CATALOG || [],
        deep: root.WWAM_DEEP_DISTILL || {},
        live: root.WWAM_LIVESTREAMS || {},
        popular: root.WWAM_POPULAR_LIVE || {},
        characters: root.WWAM_CHARACTER_LORE || {},
        dna: root.WWAM_CHANNEL_DNA || {}
      });
    });
    var lore = optional(function () {
      return root.WWAMLoreEngine.create({
        catalog: root.WWAM_CATALOG || [],
        deep: root.WWAM_DEEP_DISTILL || {},
        live: root.WWAM_LIVESTREAMS || {},
        popular: root.WWAM_POPULAR_LIVE || {},
        characters: root.WWAM_CHARACTER_LORE || {}
      });
    });
    var archiveDeep = optional(function () {
      return root.WWAMArchiveDeepPortfolio.create([
        root.WWAM_ARCHIVE_DEEP,
        root.WWAM_ARCHIVE_DEEP_BATCH2,
        root.WWAM_ARCHIVE_DEEP_BATCH3,
        root.WWAM_ARCHIVE_DEEP_BATCH4
      ], root.WWAMArchiveDeepEngine);
    });
    return root.ShokkerEraCapsuleEngine.create({
      atlas: atlas,
      showcase: showcase,
      lore: lore,
      archiveDeep: archiveDeep,
      labels: DEFAULT_LABELS
    });
  }

  function autoMount() {
    if (!root.document || root.WWAMEraCapsuleUIInstance) return;
    var section = root.document.getElementById("time-capsules");
    if (!section) return;
    try {
      var instance = create({
        engine: runtimeEngine(),
        document: root.document,
        location: root.location,
        navigator: root.navigator,
        URL: root.URL,
        Blob: root.Blob
      });
      instance.mount();
      root.WWAMEraCapsuleUIInstance = instance;
    } catch (error) {
      section.setAttribute("aria-busy", "false");
      section.setAttribute("data-feature-state", "failed");
      var stage = root.document.getElementById("eraCapsuleStage");
      var status = root.document.getElementById("eraCapsuleStatus");
      if (stage) {
        stage.innerHTML = '<div class="era-capsule-held"><span>CAPSULE HELD // ' +
          'FAILED CLOSED</span><h3>THE YEARS STAY SEALED.</h3><p>' +
          esc(clean(error && error.message ? error.message : error)) +
          " No metadata or content claim was rendered.</p></div>";
      }
      if (status) status.textContent =
        "TIME CAPSULE INITIALIZATION HELD // NO PLAUSIBLE EMPTY STATE";
    }
  }

  root.WWAMEraCapsuleUI = Object.freeze({
    VERSION: VERSION,
    create: create,
    normalizeYears: normalizeYears,
    capsuleLink: capsuleLink,
    formatHours: formatHours,
    timecode: timecode
  });

  if (root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", autoMount, { once: true });
    } else {
      autoMount();
    }
  }
}(typeof window !== "undefined" ? window : globalThis));
