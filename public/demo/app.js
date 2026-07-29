(function () {
  "use strict";

  var catalog = window.WWAM_CATALOG || [],
    deep = window.WWAM_DEEP_DISTILL || { meta: {}, franchises: [], tapes: [], hot100: [] },
    live = window.WWAM_LIVESTREAMS || { meta: {}, streams: [], topicIndex: [] },
    popular = window.WWAM_POPULAR_LIVE || { meta: {}, streams: [], topicIndex: [] },
    curated = window.WWAM_CURATED || { upInYa: [], askExamples: [] },
    characterLore = window.WWAM_CHARACTER_LORE || { meta: {}, characters: [] },
    channelDNA = window.WWAM_CHANNEL_DNA || {},
    archiveAtlasPayload = window.WWAM_ARCHIVE_ATLAS || null,
    archiveDeepPayload = window.WWAM_ARCHIVE_DEEP || null;
  var askEngine, characterEngine, showcaseEngine, loreEngine, tapeTriviaEngine,
    triviaSession, nightShiftEngine, nightShiftJourney, nightShiftProgress,
    clipLabEngine, coldOpenFactory, trustEngine, canonIntegrityReport,
    humanReviewSession, pilotBuilderEngine, archiveAtlasEngine, archiveAtlasUi,
    archiveDeepEngine, archiveDeepLoadPromise, redBandRankingEngine,
    redBandQueryEngine, sourceDossierEngine, sourceQueryEngine, sourceDossierUi, aftermathPackEngine,
    sourceDossierLoadPromise, aftermathPilotLoadPromise, archiveAtlasLoadPromise, archiveAtlasObserver,
    redBandLoadPromise, redBandObserver, sourceDossierWarmupScheduled;
  var archiveDeepStreams = [], redBandMoments = deep.hot100 || [],
    showcaseReceiptById = {}, showcaseSourceById = {}, clipItemById = {},
    campaignSnapshots = {}, lastDialogFocus = null, tapeById = {}, itemById = {},
    streamById = {}, storageFallback = {}, runtimeDiagnostics = [];
  window.WWAM_RUNTIME_DIAGNOSTICS = runtimeDiagnostics;

  function storageGet(key) {
    try {
      var value = window.localStorage.getItem(key);
      if (value != null) storageFallback[key] = value;
      return value != null ? value : (storageFallback[key] || null);
    } catch { return storageFallback[key] || null; }
  }

  function storageSet(key, value) {
    storageFallback[key] = String(value);
    try {
      window.localStorage.setItem(key, String(value));
      return true;
    } catch { return false; }
  }
  function optionalElement(id) {
    return document.getElementById(id);
  }

  var state = {
    redBand: storageGet("wwam-band") !== "bleep", hotCategory: "ALL MOMENTS",
    hotLimit: 12, franchise: "ALL", vaultQuery: "", lab: "Halloween",
    soundSource: "commentary", activeSoundbyte: null, liveTopic: "ALL TOPICS",
    popularQuery: "", popularTopic: "ALL TOPICS", character: "",
    characterContext: null, lastCharacterRiff: "", characterReceiptLimit: 3,
    characterReceiptOffset: 0, characterMatchedReceipt: "", evidenceBag: loadEvidenceBag(),
    bagOpen: false, memoryTab: "time", memoryEntity: "Halloween", longitudinalSubject: "",
    battleA: "franchise:Halloween", battleB: "franchise:Friday the 13th",
    loreQuery: "", loreKind: "character", loreSelected: "character:loomis",
    triviaDifficulty: "mixed", triviaLength: 5, triviaFranchise: "", triviaSeed: 0,
    nightMode: storageGet("wwam-night-mode") || "lore", nightDate: "",
    nightVariant: "daily", nightVariantIndex: 0, nightReveal: null, nightNotice: "",
    nightShareHandled: false, clipMode: "shorts", clipQuery: "", clipRisk: "", clipSourceId: "",
    coldOpenDuration: 30, campaignIds: loadCampaignIds(), canonTab: "health",
    canonDraft: null, reviewOrigin: "trust", reviewStatus: "unreviewed",
    reviewQuery: "", reviewSelected: "", reviewNotice: "", reviewRestoreNotice: "",
    reviewQuarantinedLedger: "", pilotGoal: "archive-discovery", pilotAftermathNotice: "", askContext: null,
    lastAskQuery: "", lastAskAnalysis: null, initialRouteHandled: false,
    fanEnginesSettled: false, creatorEnginesSettled: false, descentMinutes: 20,
    descentMode: "CHAOS", tourSlide: 0, tourResumeSlide: null, consoleIndex: 0,
  };

  deep.tapes.forEach(function (tape) { tapeById[tape.id] = tape; });
  catalog.forEach(function (item) { itemById[item.id] = item; });
  live.streams.forEach(function (stream) {
    stream._lane = "fresh";
    streamById[stream.id] = stream;
  });
  popular.streams.forEach(function (stream) {
    stream._lane = "popular";
    streamById[stream.id] = stream;
  });
  askEngine = window.WWAMSearchEngine.create(
    catalog, deep, live, curated, popular, characterLore, archiveDeepPayload, channelDNA
  );
  characterEngine = window.WWAMCharacterEngine && window.WWAMCharacterEngine.create ?
    window.WWAMCharacterEngine.create(characterLore) : null;

  function attempt(work, label) {
    try { return work(); } catch (error) {
      var diagnostic = {
        at: new Date().toISOString(),
        operation: label || work.name || "anonymous operation",
        message: error && error.message ? error.message : String(error),
      };
      runtimeDiagnostics.push(diagnostic);
      if (window.console && typeof window.console.error === "function") {
        window.console.error("[WWAM V5] " + diagnostic.operation + " failed:", error);
      }
      return null;
    }
  }

  function createArchiveAtlas() {
    archiveAtlasPayload = window.WWAM_ARCHIVE_ATLAS || archiveAtlasPayload;
    if (!window.WWAMArchiveAtlasEngine || !window.WWAMArchiveAtlasEngine.create ||
        !archiveAtlasPayload) return null;
    archiveAtlasEngine = attempt(function () {
      return window.WWAMArchiveAtlasEngine.create(archiveAtlasPayload);
    }, "archive atlas initialization");
    if (archiveAtlasEngine && window.WWAMArchiveAtlasUI && window.WWAMArchiveAtlasUI.create) {
      archiveAtlasUi = attempt(function () {
        return window.WWAMArchiveAtlasUI.create({
          engine: archiveAtlasEngine, formatNumber: fmt, formatDuration: duration,
          formatDate: shortDate, escapeHtml: esc,
          openRecord: openArchiveRecord, stageRecord: stageArchiveRecord, downloadJson: downloadJson,
          showToast: showToast, archiveDeepEngine: archiveDeepEngine, document: document,
          getSourceSummary: function (id) {
            var source = streamById[id];
            if (source && source.summary) return source.summary;
            if (source && source.editorial && source.editorial.whyItMatters) {
              return source.editorial.whyItMatters;
            }
            var tape = tapeById[id];
            return tape && tape.verdict ? tape.verdict : "";
          },
        }).mount();
      }, "archive atlas UI initialization");
    }
    return archiveAtlasEngine;
  }

  function createArchiveDeep() {
    if (!window.WWAM_ARCHIVE_DEEP || !window.WWAM_ARCHIVE_DEEP_BATCH2 ||
        !window.WWAM_ARCHIVE_DEEP_BATCH3 || !window.WWAM_ARCHIVE_DEEP_BATCH4 ||
        !window.WWAM_YEAR_CANON_2025_2026 ||
        !window.WWAM_ARCHIVE_RECOVERY_BATCH1 ||
        !window.WWAM_ARCHIVE_RECOVERY_BATCH2 ||
        !window.WWAM_ARCHIVE_COMPLETION ||
        !window.WWAMArchiveDeepEngine || !window.WWAMArchiveDeepPortfolio) return null;
    archiveDeepEngine = attempt(function () {
      return window.WWAMArchiveDeepPortfolio.create(
        [window.WWAM_ARCHIVE_DEEP,window.WWAM_ARCHIVE_DEEP_BATCH2,
          window.WWAM_ARCHIVE_DEEP_BATCH3,window.WWAM_ARCHIVE_DEEP_BATCH4],
        window.WWAMArchiveDeepEngine
      );
    }, "Archive Deep portfolio initialization");
    if (!archiveDeepEngine) return null;
    archiveDeepPayload = archiveDeepEngine.getSearchPayload();
    archiveDeepStreams = archiveDeepEngine.browse({ sort: "priority" }).records;
    var recentCanonStreams = (window.WWAM_YEAR_CANON_2025_2026.streams || []).map(function (stream) {
      return JSON.parse(JSON.stringify(stream));
    });
    var recoveryStreams = (window.WWAM_ARCHIVE_RECOVERY_BATCH1.streams || [])
      .concat(window.WWAM_ARCHIVE_RECOVERY_BATCH2.streams || []).map(function (stream) {
        return JSON.parse(JSON.stringify(stream));
      });
    var completionStreams = (window.WWAM_ARCHIVE_COMPLETION.streams || []).map(function (stream) {
      return JSON.parse(JSON.stringify(stream));
    });
    var archiveDeepIds = new Set(archiveDeepStreams.map(function (stream) { return stream.id; }));
    recentCanonStreams.concat(recoveryStreams, completionStreams).forEach(function (stream) {
      if (!archiveDeepIds.has(stream.id)) {
        archiveDeepIds.add(stream.id);
        archiveDeepStreams.push(stream);
      }
    });
    archiveDeepPayload = Object.assign({}, archiveDeepPayload, {
      streams: archiveDeepStreams,
      topicIndex: (archiveDeepPayload.topicIndex || []).concat(window.WWAM_YEAR_CANON_2025_2026.topicIndex || [])
        .concat(window.WWAM_ARCHIVE_RECOVERY_BATCH1.topicIndex || [])
        .concat(window.WWAM_ARCHIVE_RECOVERY_BATCH2.topicIndex || [])
        .concat(window.WWAM_ARCHIVE_COMPLETION.topicIndex || []),
      characterIndex: (archiveDeepPayload.characterIndex || []).concat(window.WWAM_YEAR_CANON_2025_2026.characterIndex || [])
        .concat(window.WWAM_ARCHIVE_RECOVERY_BATCH1.characterIndex || [])
        .concat(window.WWAM_ARCHIVE_RECOVERY_BATCH2.characterIndex || [])
        .concat(window.WWAM_ARCHIVE_COMPLETION.characterIndex || []),
      yearCanon: {
        schema: window.WWAM_YEAR_CANON_2025_2026.schema,
        meta: window.WWAM_YEAR_CANON_2025_2026.meta,
        fingerprints: window.WWAM_YEAR_CANON_2025_2026.fingerprints,
      },
      recoveryBatch: {
        schema: window.WWAM_ARCHIVE_RECOVERY_BATCH1.schema,
        lane: window.WWAM_ARCHIVE_RECOVERY_BATCH1.lane,
        meta: window.WWAM_ARCHIVE_RECOVERY_BATCH1.meta,
        fingerprints: window.WWAM_ARCHIVE_RECOVERY_BATCH1.fingerprints,
      },
      recoveryBatches: [
        {
          schema: window.WWAM_ARCHIVE_RECOVERY_BATCH1.schema,
          lane: window.WWAM_ARCHIVE_RECOVERY_BATCH1.lane,
          meta: window.WWAM_ARCHIVE_RECOVERY_BATCH1.meta,
          fingerprints: window.WWAM_ARCHIVE_RECOVERY_BATCH1.fingerprints,
        },
        {
          schema: window.WWAM_ARCHIVE_RECOVERY_BATCH2.schema,
          lane: window.WWAM_ARCHIVE_RECOVERY_BATCH2.lane,
          meta: window.WWAM_ARCHIVE_RECOVERY_BATCH2.meta,
          fingerprints: window.WWAM_ARCHIVE_RECOVERY_BATCH2.fingerprints,
        },
      ],
      archiveCompletion: {
        schema: window.WWAM_ARCHIVE_COMPLETION.schema,
        lane: window.WWAM_ARCHIVE_COMPLETION.lane,
        meta: window.WWAM_ARCHIVE_COMPLETION.meta,
        fingerprints: window.WWAM_ARCHIVE_COMPLETION.fingerprints,
      },
    });
    archiveDeepStreams.forEach(function (stream) {
      stream._lane = "archive";
      if (typeof stream.captioned !== "boolean") {
        stream.captioned = !(
          stream.captionEvidence &&
          stream.captionEvidence.type === "exact-source-unavailable"
        );
      }
      stream.moments = (stream.moments || []).map(function (moment) {
        return Object.assign({}, moment, { quote: moment.excerpt || "" });
      });
      streamById[stream.id] = stream;
    });
    askEngine = window.WWAMSearchEngine.create(
      catalog, deep, live, curated, popular, characterLore, archiveDeepPayload, channelDNA
    );
    return archiveDeepEngine;
  }

  function loadArchiveDeep() {
    if (archiveDeepEngine) return Promise.resolve(archiveDeepEngine);
    if (archiveDeepLoadPromise) return archiveDeepLoadPromise;
    archiveDeepLoadPromise = [
      "archive-deep-distill.js","archive-deep-batch2.js","archive-deep-batch3.js","archive-deep-batch4.js",
      "year-canon-2025-2026.js?v=1.0.0","archive-recovery-batch1.js?v=1.0.0",
      "archive-recovery-batch2.js?v=1.0.0",
      "archive-completion.js?v=1.0.1-receipt-bound",
      "year-canon-ui.js?v=1.2.0-recovered",
      "archive-deep-engine.js","archive-deep-portfolio.js",
    ].reduce(function(p,s){return p.then(function(){return loadDemoScript(s);});},
      Promise.resolve()).then(createArchiveDeep)
      .catch(function (error) {
        runtimeDiagnostics.push({ at: new Date().toISOString(),
          operation: "Archive Deep lazy load",
          message: error && error.message ? error.message : String(error) });
        archiveDeepLoadPromise = null;
        return null;
      });
    return archiveDeepLoadPromise;
  }

  function loadDemoScript(source) {
    return new Promise(function (resolve, reject) {
      var script = document.querySelector('script[data-lazy-source="' + source + '"]');
      if (script) {
        if (script.getAttribute("data-loaded") === "true") resolve();
        else {
          script.addEventListener("load", resolve, { once: true });
          script.addEventListener("error", reject, { once: true });
        }
        return;
      }
      script = document.createElement("script");
      script.src = source;
      script.async = true;
      script.setAttribute("data-lazy-source", source);
      script.onload = function () {
        script.setAttribute("data-loaded", "true"); resolve();
      };
      script.onerror = function () {
        script.remove(); reject(new Error("Unable to load " + source));
      };
      document.body.appendChild(script);
    });
  }

  function loadArchiveAtlas() {
    if (archiveAtlasEngine) return Promise.resolve(archiveAtlasEngine);
    if (archiveAtlasLoadPromise) return archiveAtlasLoadPromise;
    document.getElementById("archive").setAttribute("aria-busy", "true");
    document.getElementById("archiveStatus").textContent = "LOADING THE LIVING ARCHIVE LEDGER";
    archiveAtlasLoadPromise = loadDemoScript("archive-atlas-data.js?v=1.4.0-year-canon")
      .then(loadArchiveDeep)
      .then(function () { return loadDemoScript("archive-atlas-engine.js?v=1.4.0-year-canon"); })
      .then(function () { return loadDemoScript("archive-atlas-ui.js?v=1.4.1"); })
      .then(function () {
        createArchiveAtlas();
        if (!archiveAtlasEngine || !archiveAtlasUi) throw new Error("Archive Atlas did not initialize");
        if (archiveAtlasObserver) archiveAtlasObserver.disconnect();
        return archiveAtlasEngine;
      })
      .catch(function (error) {
        runtimeDiagnostics.push({
          at: new Date().toISOString(),
          operation: "archive atlas lazy load",
          message: error && error.message ? error.message : String(error),
        });
        if (archiveAtlasUi) archiveAtlasUi.setError("ARCHIVE LEDGER LOAD FAILED");
        else {
          document.getElementById("archiveStatus").textContent = "ARCHIVE LEDGER LOAD FAILED";
          document.getElementById("archive").setAttribute("aria-busy", "false");
        }
        archiveAtlasLoadPromise = null;
        return null;
      });
    return archiveAtlasLoadPromise;
  }

  function sourceDossierBindings() {
    if(!window.ShokkerChannelPack||!window.WWAM_CHANNEL_PACK_ADAPTER)
      throw new Error("ChannelPack boundary unavailable");
    var pack=window.ShokkerChannelPack.compile(channelDNA,window.WWAM_CHANNEL_PACK_ADAPTER);
    return {id:pack.identity.id,label:pack.identity.channel,packFingerprint:pack.fingerprint};
  }

  function activateReviewedEpisodeGuides() {
    var b=window.WWAM_EPISODE_GUIDES,
      r=window.WWAM_EPISODE_GUIDE_V2_REVIEWED_RELEASE,
      n=window.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_RELEASE,
      m=window.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE;
    if(!b||!r||!n||!m||typeof m.mergeOrdered!=="function")
      throw Error("Guide");
    b=m.mergeOrdered(b,[r,n]);window.WWAM_EPISODE_GUIDES=b;
    if(!b.meta||Number(b.meta.reviewedReleaseGuides)!==r.guides.length||
        Number(b.meta.deterministicReleaseGuides)!==n.guides.length)
      throw Error("Guide");
    return b;
  }

  function aftermathReviewKey(sourceId) {
    return "wwam-aftermath-review-v1:" + String(sourceId || "").trim();
  }

  function loadAftermathReview(pack) {
    if (!aftermathPackEngine || !pack || !pack.source) return null;
    var raw = storageGet(aftermathReviewKey(pack.source.id));
    if (!raw) return null;
    try {
      return aftermathPackEngine.restoreReview(pack.source.id, JSON.parse(raw));
    } catch (error) {
      storageSet("wwam-aftermath-review-quarantine:" + pack.source.id + ":" + Date.now(), raw);
      storageSet(aftermathReviewKey(pack.source.id), "");
      var heldMessage = "A saved Aftermath route was held because its source proof changed. " +
        "The old ledger was quarantined locally and no decision was imported.";
      runtimeDiagnostics.push({
        at: new Date().toISOString(),
        operation: "Aftermath review restore held",
        message: error && error.message ? error.message : String(error),
      });
      showToast("SAVED AFTERMATH ROUTE HELD // SOURCE PROOF CHANGED");
      return { aftermathRestoreHeld: true, notice: heldMessage, review: null };
    }
  }

  function saveAftermathReview(payload) {
    if (!payload || !payload.review || !payload.sourceId) return false;
    var saved = storageSet(
      aftermathReviewKey(payload.sourceId),
      JSON.stringify(payload.review)
    );
    showToast((saved ? "AFTERMATH ROUTE SAVED" : "AFTERMATH ROUTE KEPT IN THIS TAB") +
      " // CREATOR APPROVAL STILL REQUIRED");
    return saved;
  }

  function openAftermathInClipLab(payload) {
    state.clipSourceId = payload && payload.sourceId || "";
    state.clipMode = payload && payload.mode || "shorts";
    state.clipQuery = "";
    state.clipRisk = "";
    var searchField = document.getElementById("clipSearch");
    var riskField = document.getElementById("clipRisk");
    if (searchField) searchField.value = "";
    if (riskField) riskField.value = "";
    closeDossier({ replaceRoute: true, restoreFocus: false });
    renderClipLab();
    setTimeout(function () {
      var section = document.getElementById("clip-lab");
      var field = document.getElementById("clipSearch");
      if (section) section.scrollIntoView({ behavior: "instant", block: "start" });
      if (field && typeof field.focus === "function") {
        try { field.focus({ preventScroll: true }); } catch { field.focus(); }
      }
    }, 0);
  }

  function buildSourceDossierRuntime() {
    if(!window.ShokkerSourceDossier||!window.ShokkerSourceQuery||!window.WWAMSourceDossierAdapter||
        !window.ShokkerAftermathPack||!window.WWAMSourceDossierUI||!archiveAtlasPayload)
      throw new Error("Source Dossier runtime held");
    var episodeGuides = activateReviewedEpisodeGuides();
    var payload = window.WWAMSourceDossierAdapter.build({
      archiveAtlas: archiveAtlasPayload,
      catalog: catalog,
      deep: deep,
      episodeGuides: episodeGuides,
      live: live,
      popular: popular,
      archiveDeep: archiveDeepStreams,
      showcase: showcaseEngine,
      clipLab: clipLabEngine,
      curated: curated,
      characters: characterLore,
      dna: channelDNA,
      channel: sourceDossierBindings(),
      snapshotDate: archiveAtlasPayload.snapshotDate,
    });
    sourceDossierEngine = window.ShokkerSourceDossier.create(payload);
    sourceQueryEngine = window.ShokkerSourceQuery.create({dossierEngine:sourceDossierEngine});
    aftermathPackEngine = window.ShokkerAftermathPack.create({
      dossierEngine: sourceDossierEngine,
      clipLab: clipLabEngine,
      showcase: showcaseEngine,
      coldOpen: coldOpenFactory,
    });
    sourceDossierUi = window.WWAMSourceDossierUI.create({
      aftermathEngine: aftermathPackEngine,
      engine: sourceDossierEngine,
      queryEngine: sourceQueryEngine,
      document: document,
      mount: document.getElementById("modalContent"),
      escapeHtml: esc,
      formatNumber: fmt,
      formatDuration: duration,
      formatDate: shortDate,
      formatTime: timestamp,
      onPlay: function (payload) {
        loadPlayer(payload.sourceId, payload.at, payload.end);
      },
      onCopyLink: function (payload) {
        copy(
          sourceDossierShareUrl(payload.sourceId, payload.at, payload.section),
          "SHOW WIKI LINK COPIED"
        );
      },
      onDownload: function (payload) {
        downloadJson(
          payload.filename || "wwam-source-dossier-" + payload.sourceId + ".json",
          payload.manifest || sourceDossierEngine.exportManifest(payload.sourceId)
        );
        showToast("SOURCE DOSSIER MANIFEST DOWNLOADED");
      },
      onOpenSource: function (payload) {
        var targetAt = payload.targetAt != null && Number.isFinite(Number(payload.targetAt)) ?
          Number(payload.targetAt) : null;
        openSourceDossier(payload.targetSourceId, targetAt, { routeMode: "push", autoplay: false });
      },
      onStageIntake: function (payload) {
        stageArchiveRecord(payload.dossier.source);
      },
      onOpenCompanion: function (payload) {
        var companion = document.getElementById("companion");
        closeDossier({ replaceRoute: true, restoreFocus: false });
        if (!companion) return;
        companion.setAttribute("data-companion-source", payload.sourceId);
        companion.setAttribute("data-companion-time", Math.round(Number(payload.at || 0)));
        companion.scrollIntoView({ behavior: "smooth", block: "start" });
        window.WWAMFeatureLoader.hydrate(companion).then(function (ready) {
          if (!ready) return;
          dispatchEvent(new CustomEvent("wwam:tape-companion-open", {
            detail: { sourceId: payload.sourceId, at: Number(payload.at || 0) },
          }));
        });
      },
      loadAftermathReview: loadAftermathReview,
      onAftermathDecision: saveAftermathReview,
      onAftermathExport: function (payload) {
        downloadJson(
          "wwam-aftermath-pack-" + payload.sourceId + ".json",
          payload.packet
        );
        showToast("AFTERMATH EDITOR PACK DOWNLOADED // HUMAN REVIEW STILL REQUIRED");
      },
      onAftermathCopy: function (payload) {
        copy(payload.markdown, "AFTERMATH EDITOR BRIEF COPIED // STILL A DRAFT");
      },
      onOpenClipLab: openAftermathInClipLab,
      onBagReceipt: function (payload) {
        var source = payload.dossier.source;
        var receipt = payload.receipt;
        addToEvidenceBag({
          source: source.sourceType === "commentary" ? "commentary" : "livestream",
          sourceId: source.id,
          at:receipt.at, end:receipt.end, receiptKey:receipt.key,
          title: source.displayTitle || source.title,
          category: receipt.label,
          excerpt: receipt.excerpt,
          evidenceLevel: receipt.evidenceLevel,
          evidenceType: receipt.evidenceType,
          speaker: null,
          speakerStatus: "not-diarized",
          warnings: source.warnings,
        });
      },
    });
    return sourceDossierUi;
  }

  function loadSourceDossier() {
    if (sourceDossierEngine && sourceDossierUi) return Promise.resolve(sourceDossierUi);
    if (sourceDossierLoadPromise) return sourceDossierLoadPromise;
    var loader = window.WWAMFeatureLoader;
    if (!loader) return Promise.reject(new Error("The feature loader is unavailable."));
    sourceDossierLoadPromise = loadArchiveAtlas()
      .then(function (atlas) {
        if (!atlas) throw new Error("The canonical archive registry could not be loaded.");
        var yearCanonIds = new Set(
          (window.WWAM_YEAR_CANON_2025_2026 &&
            window.WWAM_YEAR_CANON_2025_2026.streams || []).map(function (stream) {
            return stream.id;
          })
        );
        var recoveryIds = new Set(
          (window.WWAM_ARCHIVE_RECOVERY_BATCH1 &&
            window.WWAM_ARCHIVE_RECOVERY_BATCH1.streams || [])
            .concat(window.WWAM_ARCHIVE_RECOVERY_BATCH2 &&
              window.WWAM_ARCHIVE_RECOVERY_BATCH2.streams || [])
            .map(function (stream) {
            return stream.id;
          })
        );
        var completionIds = new Set(
          (window.WWAM_ARCHIVE_COMPLETION &&
            window.WWAM_ARCHIVE_COMPLETION.streams || []).map(function (stream) {
            return stream.id;
          })
        );
        var archiveEvidenceIds = new Set(archiveDeepStreams.map(function (stream) {
          return stream.id;
        }));
        var missingYearCanon = Array.from(yearCanonIds).filter(function (id) {
          return !archiveEvidenceIds.has(id);
        });
        var missingRecovery = Array.from(recoveryIds).filter(function (id) {
          return !archiveEvidenceIds.has(id);
        });
        var missingCompletion = Array.from(completionIds).filter(function (id) {
          return !archiveEvidenceIds.has(id);
        });
        if (!archiveDeepEngine || archiveDeepStreams.length < 430 ||
            missingYearCanon.length || missingRecovery.length ||
            missingCompletion.length) {
          throw new Error("The living archive evidence overlay is incomplete.");
        }
        if (!showcaseEngine) createDeepEngines();
        if (!showcaseEngine) {
          throw new Error("The promoted Showcase evidence registry is unavailable.");
        }
        return clipLabEngine?null:loadDemoScript("creator-studio-engine.js").then(createClipLab);
      })
      .then(function () { return loader.loadStyle("source-dossier.css?v=5.27-highlight-runway"); })
      .then(function () {
        return ["channel-pack-contract.js", "wwam-channel-pack-adapter.js",
          "episode-guides.js?v=2.1.5-referent",
          "episode-guide-v2-reviewed-release.js?v=1.0.1-runtime-eligible",
          "episode-guide-v2-newest-five-release.js?v=f5f3ca58",
          "episode-guide-v2-reviewed-merge.js?v=1.1.0-ordered-release",
          "episode-recap-engine.js?v=1.6.0-highlight-runway",
          "wwam-episode-recap-adapter.js?v=1.6.0-highlight-runway",
          "source-dossier-engine.js?v=1.14.0-highlight-contract",
          "wwam-source-dossier-adapter.js?v=1.14.1-uncapped-show-lanes",
          "source-query-engine.js?v=1.6.1-lanes",
          "aftermath-pack-engine.js?v=1.0.0",
          "source-dossier-ui.js?v=1.18.2-uncapped-lane-copy"].reduce(function (promise, source) {
          return promise.then(function () { return loader.load(source); });
        }, Promise.resolve());
      })
      .then(buildSourceDossierRuntime)
      .catch(function (error) {
        runtimeDiagnostics.push({
          at: new Date().toISOString(),
          operation: "source dossier lazy load",
          message: error && error.message ? error.message : String(error),
        });
        sourceDossierLoadPromise = null;
        throw error;
      });
    return sourceDossierLoadPromise;
  }

  function warmSourceDossierAfterGate() {
    if (sourceDossierWarmupScheduled || sourceDossierEngine ||
        sourceDossierLoadPromise || readSourceRoute()) return;
    sourceDossierWarmupScheduled = true;
    scheduleIdle(function () {
      loadSourceDossier().catch(function () {
        sourceDossierWarmupScheduled = false;
      });
    }, 3200);
  }

  window.WWAMSourceDossierAccess=Object.freeze({cutId:"evidenceBagCut",load:loadSourceDossier,
    get:function(){return sourceDossierEngine;},bag:function(){return state.evidenceBag.slice();},
    play:function(p){return openSourceDossier(p.sourceId,p.at,{routeMode:"push",autoplay:false})
      .then(function(ok){if(ok)loadPlayer(p.sourceId,p.at,p.end);return ok;});},
    navigate:function(p){return openSourceDossier(p.sourceId,p.at,{routeMode:"push",autoplay:false});}});

  var SOURCE_DOSSIER_SECTION_IDS = Object.freeze({proof:"sourceDossierProof",player:"sourceDossierPlayerSection",wiki:"sourceDossierShowWiki",inside:"sourceDossierInside",ask:"sourceDossierAsk",footprint:"sourceDossierFootprint",wake:"sourceDossierWake",chronology:"sourceDossierChronology",work:"sourceDossierWork",aftermath:"sourceDossierAftermath",boundary:"sourceDossierBoundary"});

  function sourceDossierSection(value) {
    var section = String(value == null ? "" : value).trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(SOURCE_DOSSIER_SECTION_IDS, section) ? section : "";
  }

  function sourceDossierShareUrl(sourceId, at, section) {
    var url = new URL(window.location.href); url.search = "";
    url.searchParams.set("source", sourceId);
    if (at != null && at !== "" && Number.isFinite(Number(at))) url.searchParams.set("at", Math.round(Number(at)));
    section = sourceDossierSection(section);
    if (section) url.searchParams.set("section", section);
    url.hash = "archive"; return url.toString();
  }

  function sourceRouteUrl(sourceId, at, section) {
    var url = new URL(window.location.href);
    url.searchParams.delete("tape"); url.searchParams.delete("live");
    url.searchParams.set("source", sourceId);
    if (at != null && at !== "" && Number.isFinite(Number(at))) url.searchParams.set("at", Math.round(Number(at)));
    else url.searchParams.delete("at");
    section = sourceDossierSection(section);
    if (section) url.searchParams.set("section", section);
    else url.searchParams.delete("section");
    url.hash = "archive"; return url;
  }

  function readSourceRoute() {
    var params = new URLSearchParams(location.search);
    var sourceId = params.get("source"), legacy = false;
    if (!sourceId && params.get("tape")) { sourceId = params.get("tape"); legacy = true; }
    else if (!sourceId && params.get("live")) { sourceId = params.get("live"); legacy = true; }
    if (!/^[A-Za-z0-9_-]{11}$/.test(sourceId || "")) return null;
    var at=params.get("at"); return { sourceId:sourceId,
      at: at != null && Number.isFinite(Number(at)) ? Number(at) : null,
      section:sourceDossierSection(params.get("section")), legacy: legacy };
  }

  function syncSourceRoute(sourceId, at, section, mode) {
    if (mode === "none") return;
    var url = sourceRouteUrl(sourceId, at, section);
    var nextState = Object.assign({}, history.state || {}, {
      wwamSourceDossier: true,
      wwamSourceDossierPushed: mode === "push",
      sourceId: sourceId,
    });
    if (mode === "replace") history.replaceState(nextState, "", url);
    else history.pushState(nextState, "", url);
  }

  function showSourceDossierLoading() {
    rememberDialogFocus();
    var modal = document.getElementById("tapeModal");
    modal.setAttribute("aria-busy", "true");
    modal.setAttribute("aria-labelledby", "sourceDossierTitle");
    modal.setAttribute("aria-describedby", "sourceDossierBoundary");
    document.getElementById("modalContent").innerHTML =
      '<div class="source-dossier-loading" role="status" aria-live="polite">' +
      '<span>THE TAPE\'S WAKE // VERIFYING THE LIVING MEMORY FILE</span>' +
      '<h2 id="sourceDossierTitle">OPENING THE SHOW WIKI.</h2>' +
      '<p id="sourceDossierBoundary">The official source registry, evidence boundary, and cross-archive connections are being verified.</p></div>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    syncBackgroundInert();
    focusSoon("#modalClose");
  }

  function openSourceDossier(id, startTime, options) {
    var settings = options || {}, sourceId = String(id == null ? "" : id).trim(),
      section = sourceDossierSection(settings.section);
    if (!/^[A-Za-z0-9_-]{11}$/.test(sourceId)) return Promise.resolve(false);
    showSourceDossierLoading();
    return loadSourceDossier().then(function (ui) {
      if (!sourceDossierEngine.has(sourceId)) {
        throw new Error("This source is outside the current canonical registry.");
      }
      var rendered = ui.render(sourceId, {at:startTime == null ? null : Number(startTime),
        section:section, query:String(settings.query || "").slice(0, 240)});
      if (!rendered) throw new Error("The Source Dossier failed its render boundary.");
      document.getElementById("tapeModal").setAttribute("aria-busy", "false");
      syncSourceRoute(
        sourceId,
        startTime,
        section,
        settings.routeMode || "push"
      );
      syncBagButtons();
      if(startTime!=null&&settings.autoplay!==false)loadPlayer(sourceId,+startTime,settings.end);
      return true;
    }).catch(function (error) {
      var message = error && error.message ? error.message : String(error);
      document.getElementById("tapeModal").setAttribute("aria-busy", "false");
      document.getElementById("modalContent").innerHTML =
        '<div class="source-dossier-loading source-dossier-error" role="alert">' +
        '<span>THE SOURCE FILE WAS HELD</span><h2 id="sourceDossierTitle">SHOW WIKI UNAVAILABLE.</h2>' +
        '<p id="sourceDossierBoundary">' + esc(message) +
        '</p><a href="https://www.youtube.com/watch?v=' + encodeURIComponent(sourceId) +
        '" target="_blank" rel="noopener">OPEN THE OFFICIAL SOURCE ON YOUTUBE &nearr;</a></div>';
      return false;
    });
  }

  function prepareArchiveAtlasLazy() {
    var section = document.getElementById("archive");
    if (!section) return;
    Array.prototype.forEach.call(document.querySelectorAll('a[href="#archive"]'), function (link) {
      link.addEventListener("click", loadArchiveAtlas);
    });
    var recentCanon = document.getElementById("yearCanonSpotlight");
    var settleRecentCanon = function () {
      loadArchiveAtlas().then(function () {
        if (recentCanon) recentCanon.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    Array.prototype.forEach.call(document.querySelectorAll('a[href="#yearCanonSpotlight"]'), function (link) {
      link.addEventListener("click", settleRecentCanon);
    });
    if (window.location.hash === "#yearCanonSpotlight") settleRecentCanon();
    if ("IntersectionObserver" in window) {
      archiveAtlasObserver = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) loadArchiveAtlas();
      }, { rootMargin: "900px 0px" });
      archiveAtlasObserver.observe(section);
    } else {
      var check = function () {
        var rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 900 && rect.bottom >= -900) {
          window.removeEventListener("scroll", check);
          section.removeEventListener("focusin", check);
          loadArchiveAtlas();
        }
      };
      window.addEventListener("scroll", check, { passive: true });
      section.addEventListener("focusin", check);
      check();
    }
  }

  function createRedBandRanking() {
    if (!window.WWAMRedBandRankingV2 || !window.WWAMRedBandRankingV2.create) return null;
    redBandRankingEngine = attempt(function () {
      return window.WWAMRedBandRankingV2.create({
        catalog: catalog,
        deep: deep,
        live: live,
        popular: popular,
        curation: curated,
        characters: characterLore,
      });
    }, "Red Band Memorability Candidate Index V2.1 initialization");
    if (redBandRankingEngine && Array.isArray(redBandRankingEngine.rankings) &&
        redBandRankingEngine.rankings.length === 100) {
      redBandMoments = redBandRankingEngine.rankings;
    }
    if (redBandRankingEngine && window.WWAMRedBandQuery &&
        window.WWAMRedBandQuery.create) {
      redBandQueryEngine = attempt(function () {
        return window.WWAMRedBandQuery.create({
          ranking: redBandRankingEngine,
          boundedExcerpt: boundedExcerpt,
          resolveSource: function (moment) {
            var source = redSource(moment);
            source.sourceType = itemById[source.id] ? "commentary" : "livestream";
            source.laneLabel = moment.lane === "recent-livestream" ? "FRESH 10" :
              moment.lane === "popular-livestream" ? "POPULAR 25" : "COMMENTARY";
            return source;
          },
        });
      }, "Red Band exact-rank query initialization");
    }
    return redBandRankingEngine;
  }

  function loadRedBandRanking() {
    if (redBandRankingEngine) return Promise.resolve(redBandRankingEngine);
    if (redBandLoadPromise) return redBandLoadPromise;
    redBandLoadPromise = loadDemoScript("red-band-ranking-v2.js")
      .then(function () { return loadDemoScript("red-band-query.js"); })
      .then(function () {
        createRedBandRanking();
        if (!redBandRankingEngine || !redBandQueryEngine || redBandMoments.length !== 100) {
          throw new Error("Memorability Candidate Index V2.1 did not produce 100 ranks");
        }
        if (categories().indexOf(state.hotCategory) < 0) state.hotCategory = "ALL MOMENTS";
        window.WWAMRouteRenderGate.invalidate(["home", "highlights"]);
        if (redBandObserver) redBandObserver.disconnect();
        return redBandRankingEngine;
      })
      .catch(function (error) {
        runtimeDiagnostics.push({
          at: new Date().toISOString(),
          operation: "Red Band Memorability Candidate Index V2.1 lazy load",
          message: error && error.message ? error.message : String(error),
        });
        redBandLoadPromise = null;
        window.WWAMRouteRenderGate.invalidate("highlights");
        return null;
      });
    return redBandLoadPromise;
  }

  function prepareRedBandRankingLazy() {
    var section = document.getElementById("red100");
    if (!section) return;
    if ("IntersectionObserver" in window) {
      redBandObserver = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) loadRedBandRanking();
      }, { rootMargin: "800px 0px" });
      redBandObserver.observe(section);
    } else {
      scheduleIdle(loadRedBandRanking, 1200);
    }
  }

  function createDeepEngines() {
    if(showcaseEngine)return showcaseEngine;
    showcaseEngine = window.WWAMShowcaseEngine && window.WWAMShowcaseEngine.create ?
      attempt(function () { return window.WWAMShowcaseEngine.create({
        catalog: catalog,
        deep: deep,
        live: live,
        popular: popular,
        characters: characterLore,
        dna: channelDNA,
      }); }, "showcase engine initialization") : null;
    if (showcaseEngine) {
      (showcaseEngine.receipts || []).forEach(function (receipt) { showcaseReceiptById[receipt.id] = receipt; });
      (showcaseEngine.sources || []).forEach(function (source) { showcaseSourceById[source.id] = source; });
    }
    window.WWAMRouteRenderGate.invalidate(["studio", "characters"]);
    return showcaseEngine;
  }

  function createFanEngines() {
    if(state.fanEnginesSettled)return;
    if (!window.WWAMLoreEngine) return loadDemoScript("lore-engine.js").then(createFanEngines);
    if (!window.WWAMTapeTriviaEngine) return loadDemoScript("tape-trivia-engine.js").then(createFanEngines);
    if (!window.WWAMNightShiftEngine) return loadDemoScript("night-shift-engine.js").then(createFanEngines);
    loreEngine = window.WWAMLoreEngine && window.WWAMLoreEngine.create ?
      attempt(function () { return window.WWAMLoreEngine.create({
        catalog: catalog,
        deep: deep,
        live: live,
        popular: popular,
        characters: characterLore,
      }); }, "lore engine initialization") : null;
    tapeTriviaEngine = window.WWAMTapeTriviaEngine && window.WWAMTapeTriviaEngine.create && showcaseEngine ?
      attempt(function () {
        return window.WWAMTapeTriviaEngine.create({ showcase: showcaseEngine, lore: loreEngine });
      }, "trivia engine initialization") : null;
    if (tapeTriviaEngine) {
      triviaSession = attempt(function () { return tapeTriviaEngine.createSession({
        seed: "wwam-night-shift-" + state.triviaSeed,
        length: state.triviaLength,
        difficulty: state.triviaDifficulty,
      }); });
    }
    nightShiftEngine = window.WWAMNightShiftEngine && window.WWAMNightShiftEngine.create && showcaseEngine ?
      attempt(function () {
        return window.WWAMNightShiftEngine.create({
          showcase: showcaseEngine,
          lore: loreEngine,
          trivia: tapeTriviaEngine,
          today: localDateKey(),
        });
      }, "night shift engine initialization") : null;
    if (nightShiftEngine) attempt(buildNightShift, "daily night shift initialization");
    state.fanEnginesSettled = true;
    window.WWAMRouteRenderGate.invalidate(["characters", "highlights"]);
    if (state.creatorEnginesSettled && !pilotBuilderEngine) attempt(createPilotBuilder);
  }

  function createPilotBuilder() {
    if (pilotBuilderEngine) return pilotBuilderEngine;
    if (!showcaseEngine || !loreEngine || !clipLabEngine || !coldOpenFactory || !trustEngine) {
      return null;
    }
    canonIntegrityReport = window.WWAMCanonIntegrity && window.WWAMCanonIntegrity.audit ?
      window.WWAMCanonIntegrity.audit({
        catalog: catalog,
        deep: deep,
        live: live,
        popular: popular,
        characters: characterLore,
        showcase: showcaseEngine,
        lore: loreEngine,
        clip: clipLabEngine,
      }) : null;
    if (!humanReviewSession && window.WWAMHumanReviewSession && window.WWAMHumanReviewSession.create &&
      canonIntegrityReport) {
      var reviewDate = /^\d{4}-\d{2}-\d{2}$/.test(showcaseEngine.snapshotDate) ?
        showcaseEngine.snapshotDate : "2026-07-23";
      var reviewInput = {
        showcase: showcaseEngine,
        trust: trustEngine,
        canon: canonIntegrityReport,
      };
      var savedReview = storageGet("wwam-human-review-v52");
      if (savedReview && window.WWAMHumanReviewSession.restore) {
        try {
          humanReviewSession = window.WWAMHumanReviewSession.restore(
            JSON.parse(savedReview),
            reviewInput
          );
        } catch (error) {
          state.reviewQuarantinedLedger = savedReview;
          storageSet("wwam-human-review-v52-quarantine:" + Date.now(), savedReview);
          state.reviewRestoreNotice = "SAVED REVIEW HELD // " +
            (error.code || "INCOMPATIBLE_OR_TAMPERED_LEDGER") +
            " // THE ORIGINAL LEDGER WAS QUARANTINED FOR EXPORT; A NEW LOCAL SESSION WAS OPENED.";
        }
      }
      if (!humanReviewSession) {
        humanReviewSession = window.WWAMHumanReviewSession.create(Object.assign({}, reviewInput, {
          session: {
            id: "wwam-v52-accuracy-" + reviewDate,
            name: "WWAM V5.2 Local Accuracy Pass",
            createdAt: reviewDate + "T00:00:00-04:00",
          },
        }));
      }
    }
    pilotBuilderEngine = window.WWAMCreatorPilotBuilder && window.WWAMCreatorPilotBuilder.create ?
      window.WWAMCreatorPilotBuilder.create({
        showcase: showcaseEngine,
        lore: loreEngine,
        clipLab: clipLabEngine,
        coldOpen: coldOpenFactory,
        trust: trustEngine,
        integrityReport: canonIntegrityReport,
      }) : null;
    window.WWAMRouteRenderGate.invalidate("studio");
    return pilotBuilderEngine;
  }

  function localDateKey() {
    var now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function nightProgressKey(journey) {
    return "wwam-night-shift:" + (journey && journey.id || "unknown");
  }

  function saveNightProgress() {
    if (!nightShiftJourney || !nightShiftProgress) return false;
    return storageSet(
      nightProgressKey(nightShiftJourney),
      JSON.stringify(nightShiftProgress.exportState())
    );
  }

  function buildNightShift() {
    if (!nightShiftEngine) return null;
    var journey = null;
    if (!state.nightShareHandled) {
      state.nightShareHandled = true;
      var sharedSeed = new URLSearchParams(location.search).get("nightShift");
      if (sharedSeed) {
        try {
          journey = nightShiftEngine.createFromSeed(sharedSeed);
          state.nightMode = journey.mode.id;
          state.nightDate = journey.date;
          state.nightVariant = journey.variant;
          state.nightNotice = "SHARED SHIFT RECREATED AGAINST ARCHIVE " +
            journey.snapshot.inputFingerprint;
        } catch (error) {
          state.nightNotice = "SHARED SHIFT HELD // " + (error.message || String(error));
        }
      }
    }
    if (!journey) {
      if (!state.nightDate) state.nightDate = localDateKey();
      journey = nightShiftEngine.createDaily({
        date: state.nightDate,
        mode: state.nightMode,
        variant: state.nightVariant,
      });
    }
    nightShiftJourney = journey;
    state.nightDate = journey.date;
    state.nightMode = journey.mode.id;
    var saved = storageGet(nightProgressKey(journey));
    nightShiftProgress = null;
    if (saved) {
      try {
        nightShiftProgress = nightShiftEngine.restoreProgress(journey, JSON.parse(saved));
      } catch {
        storageSet(nightProgressKey(journey), "");
      }
    }
    if (!nightShiftProgress) nightShiftProgress = nightShiftEngine.createProgress(journey);
    state.nightReveal = null;
    storageSet("wwam-night-mode", state.nightMode);
    return journey;
  }

  function createClipLab(){
    if(clipLabEngine)return clipLabEngine;
    clipLabEngine=attempt(function(){return window.WWAMCreatorClipLab.create({showcase:showcaseEngine});},
      "creator clip lab initialization");
    if(clipLabEngine)(clipLabEngine.shorts||[]).concat(clipLabEngine.supercuts||[],clipLabEngine.resurfacing||[])
      .forEach(function(item){clipItemById[item.id]=item;});
    return clipLabEngine;
  }

  function createCreatorEngines() {
    if(state.creatorEnginesSettled)return;
    if (!window.WWAMCreatorClipLab)
      return loadDemoScript("creator-studio-engine.js").then(createCreatorEngines);
    if (!window.WWAMColdOpenFactory)
      return loadDemoScript("cold-open-engine.js").then(createCreatorEngines);
    if (!window.WWAMCanonIntegrity)
      return loadDemoScript("canon-integrity-engine.js").then(createCreatorEngines);
    if (!window.WWAMHumanReviewSession)
      return loadDemoScript("human-review-session-engine.js").then(createCreatorEngines);
    if (!window.WWAMTrustEngine) return loadDemoScript("correction-ripple-engine.js")
      .then(function () { return loadDemoScript("trust-engine.js"); }).then(createCreatorEngines);
    if (!window.WWAMCreatorPilotBuilder)
      return loadDemoScript("pilot-builder-engine.js").then(createCreatorEngines);
    if (!window.WWAMCanonDeskUI)
      return loadDemoScript("canon-desk-ui.js?v=1.0.1").then(createCreatorEngines);
    createClipLab();
    coldOpenFactory = window.WWAMColdOpenFactory && window.WWAMColdOpenFactory.create && clipLabEngine ?
      attempt(function () { return window.WWAMColdOpenFactory.create({ clipLab: clipLabEngine }); },
        "cold open factory initialization") : null;
    trustEngine = window.WWAMTrustEngine && window.WWAMTrustEngine.create ?
      attempt(function () { return window.WWAMTrustEngine.create({
        catalog: catalog,
        deep: deep,
        live: live,
        popular: popular,
        characters: characterLore,
        dna: channelDNA,
        showcase: showcaseEngine,
      }); }, "trust engine initialization") : null;
    state.creatorEnginesSettled = true;
    attempt(createPilotBuilder, "creator workflow builder initialization");
    window.WWAMRouteRenderGate.invalidate("studio");
  }

  function scheduleIdle(work, timeout) {
    if (window.requestIdleCallback) window.requestIdleCallback(work, { timeout: timeout || 900 });
    else setTimeout(work, 0);
  }

  var franchiseOrder = ["Halloween", "Friday the 13th", "Scream", "A Nightmare on Elm Street"];
  var colors = {
    "Halloween": "#ff4a24",
    "Friday the 13th": "#d8ff38",
    "Scream": "#ff397f",
    "A Nightmare on Elm Street": "#55e5ff",
  };
  var categoryCopy = curated.categoryCopy || {};
  var tourSlides = window.WWAM_PITCH_TOUR || [];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function loadEvidenceBag() {
    try {
      var parsed = JSON.parse(storageGet("wwam-evidence-bag") || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item && typeof item.id === "string" && Number.isFinite(Number(item.at));
      }).slice(0, 30).map(normalizeEvidenceItem);
    } catch {
      return [];
    }
  }

  function loadCampaignIds() {
    try {
      var parsed = JSON.parse(storageGet("wwam-campaign-clips") || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.map(function (entry) {
        if (typeof entry === "string") return entry;
        if (!entry || typeof entry.id !== "string") return "";
        campaignSnapshots[entry.id] = entry;
        return entry.id;
      }).filter(function (id, index, ids) {
        return id && ids.indexOf(id) === index;
      }).slice(0, 24);
    } catch {
      return [];
    }
  }

  function saveCampaignIds() {
    return storageSet("wwam-campaign-clips", JSON.stringify(state.campaignIds.map(function (id) {
      return campaignSnapshots[id] || id;
    })));
  }

  function downloadJson(filename, value) {
    var blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }

  function bagKey(item) {
    return [item.source || "livestream", item.id || item.sourceId, Math.round(Number(item.at || item.t || 0))].join("|");
  }

  function inferEvidenceLevel(item) {
    if (item.evidenceLevel) return item.evidenceLevel;
    if (item.evidenceType === "derived-source-summary") return "SOURCE-LEVEL DERIVED SUMMARY";
    if (item.evidenceType === "source-metadata") return "SOURCE METADATA ONLY";
    return item.excerpt || item.quote ? "TIMESTAMPED CAPTION RECEIPT" : "SOURCE METADATA ONLY";
  }

  function normalizeEvidenceItem(item) {
    var evidenceLevel = inferEvidenceLevel(item || {});
    var resolvedId = item.id || item.sourceId || item.videoId;
    return Object.assign({}, item || {}, {
      source: item.source || item.sourceType || (itemById[resolvedId] ? "commentary" : "livestream"),
      id: resolvedId,
      at: Number(item.at != null ? item.at : item.t || item.time || 0),
      title: item.title || item.label || item.sourceTitle || "WWAM SOURCE",
      category: item.category || item.trigger || "SOURCE RECEIPT",
      excerpt: boundedExcerpt(item.excerpt || item.quote || ""),
      evidenceLevel: evidenceLevel,
      evidenceType: item.evidenceType || (
        evidenceLevel === "SOURCE-LEVEL DERIVED SUMMARY" ? "derived-source-summary" :
          evidenceLevel === "SOURCE METADATA ONLY" ? "source-metadata" : "caption-excerpt"
      ),
    });
  }

  function evidenceBoundary(item) {
    return Object.fromEntries("evidenceLevel evidenceType receiptKind type kind speakerStatus authenticatedEditorVerified warnings evidenceWarnings"
      .split(" ").map(function (key) { return [key, item[key]]; }));
  }

  function bagButton(item, label) {
    var bagItem = normalizeEvidenceItem(item);
    if (!bagItem.id) return "";
    var buttonLabel = label || "BAG THIS RECEIPT";
    var data = Object.assign(evidenceBoundary(bagItem), {
      source:bagItem.source,id:bagItem.id,at:bagItem.at,end:bagItem.end,receiptKey:bagItem.receiptKey,
      title: bagItem.title, category: bagItem.category, excerpt: bagItem.excerpt,
    });
    return '<button class="bag-add" data-bag-add data-default-label="' + esc(buttonLabel + " +") +
      '" data-bag-item="' + esc(JSON.stringify(data)) + '">' + esc(buttonLabel) + ' +</button>';
  }

  function readBagButton(button) {
    try {
      var item = JSON.parse(button.getAttribute("data-bag-item") || "{}");
      item.savedAt = new Date().toISOString();
      return normalizeEvidenceItem(item);
    } catch {
      return normalizeEvidenceItem({});
    }
  }

  function saveEvidenceBag() {
    return storageSet("wwam-evidence-bag", JSON.stringify(state.evidenceBag));
  }

  function syncBagButtons() {
    var keys = {};
    state.evidenceBag.forEach(function (item) { keys[bagKey(item)] = true; });
    Array.prototype.forEach.call(document.querySelectorAll("[data-bag-add]"), function (button) {
      var item = readBagButton(button);
      var saved = Boolean(keys[bagKey(item)]);
      button.classList.toggle("saved", saved);
      button.textContent = saved ? "IN THE BAG ✓" : (button.getAttribute("data-default-label") || "BAG THIS +");
    });
  }

  function addToEvidenceBag(item) {
    item = normalizeEvidenceItem(item);
    var key = bagKey(item);
    var existing = state.evidenceBag.some(function (candidate) { return bagKey(candidate) === key; });
    var persisted = true;
    if (!existing) {
      state.evidenceBag.unshift(item);
      state.evidenceBag = state.evidenceBag.slice(0, 30);
      persisted = saveEvidenceBag();
    }
    renderEvidenceBag();
    showToast(existing ? "ALREADY SAVED" :
      persisted ? "SAVED TO YOUR CLIPS" : "SAVED IN THIS TAB");
  }

  function removeFromEvidenceBag(key) {
    state.evidenceBag = state.evidenceBag.filter(function (item) { return bagKey(item) !== key; });
    var persisted = saveEvidenceBag();
    renderEvidenceBag();
    if (!persisted) showToast("REMOVED // THIS TAB ONLY");
  }

  function openBagReceipt(item) {
    state.bagOpen = false;
    renderEvidenceBag();
    if (item.source === "commentary" && itemById[item.id]) openDossier(item.id, item.at);
    else if (streamById[item.id]) openLiveDossier(item.id, item.at);
    else openLooseSource(item.id, item.at, item.title);
  }

  function renderEvidenceBag() {
    var count = state.evidenceBag.length;
    var bag = document.getElementById("evidenceBag");
    document.getElementById("evidenceBagCount").textContent = count;
    var bagOpen = document.getElementById("evidenceBagOpen");
    bagOpen.setAttribute("aria-expanded", state.bagOpen ? "true" : "false");
    bagOpen.setAttribute("aria-label", "Open saved clips; " + count +
      " clip" + (count === 1 ? "" : "s"));
    bag.classList.toggle("show", state.bagOpen);
    bag.setAttribute("aria-hidden", state.bagOpen ? "false" : "true");
    if (state.bagOpen) bag.removeAttribute("inert");
    else bag.setAttribute("inert", "");
    document.getElementById("evidenceBagScrim").classList.toggle("show", state.bagOpen);
    document.body.classList.toggle("bag-open", state.bagOpen);
    document.getElementById("evidenceBagList").innerHTML = count ? state.evidenceBag.map(function (item, index) {
      var isCaptionReceipt = String(item.evidenceType || "").indexOf("caption") >= 0 ||
        item.evidenceLevel === "TIMESTAMPED CAPTION RECEIPT";
      var evidenceCopy = displayQuote(item.excerpt || "Open the original source receipt.");
      return '<article><div><span>' + String(index + 1).padStart(2, "0") + ' // ' +
        esc(displayUiText(item.category)) + '</span><b>' + timestamp(item.at) + '</b></div><h3>' +
        esc(displayUiText(item.title)) + '</h3><p><small>' + esc(displayUiText([
          item.evidenceLevel, item.speakerStatus || "SPEAKER NOT PROVIDED",
          item.authenticatedEditorVerified ? "EDITOR AUTH" : "NO EDITOR AUTH"
        ].join(" // "))) + '</small>' +
        (isCaptionReceipt ? '“' + esc(evidenceCopy) + '”' : esc(evidenceCopy)) +
        '</p><footer><button data-bag-play="' + esc(bagKey(item)) + '">PLAY RECEIPT →</button><button data-bag-remove="' +
        esc(bagKey(item)) + '">REMOVE</button></footer></article>';
    }).join("") : '<div class="evidence-bag-empty"><b>NO SAVED CLIPS YET.</b><span>Tap SAVE on a moment you want to keep.</span></div>';
    Array.prototype.forEach.call(document.querySelectorAll("[data-bag-play]"), function (button) {
      button.innerHTML = "PLAY CLIP &rarr;";
      button.onclick = function () {
        var item = state.evidenceBag.filter(function (candidate) {
          return bagKey(candidate) === button.getAttribute("data-bag-play");
        })[0];
        if (item) openBagReceipt(item);
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-bag-remove]"), function (button) {
      button.onclick = function () { removeFromEvidenceBag(button.getAttribute("data-bag-remove")); };
    });
    syncBagButtons();
    syncBackgroundInert();
  }

  function evidenceManifest() {
    return {
      product: "WWAM After Midnight",
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      excerptWordLimit: 16,
      disclaimer: "Source-linked navigation; verify captions. Summaries are labeled, not quotes.",
      clips: state.evidenceBag.map(function (item, index) {
        return {
          order: index + 1,
          sourceId: item.id,
          sourceType: item.source,
          title: item.title,
          category: item.category,
          evidenceLevel: item.evidenceLevel,
          evidenceType: item.evidenceType,
          receiptKind: item.receiptKind || item.kind || item.type,
          type: item.type || item.receiptKind || item.kind,
          speakerStatus: item.speakerStatus || "not-provided",
          authenticatedEditorVerified: item.authenticatedEditorVerified === true,
          warnings: item.warnings,
          evidenceWarnings: item.evidenceWarnings,
          start: Math.round(item.at),
          url: "https://www.youtube.com/watch?v=" + item.id + "&t=" + Math.round(item.at) + "s",
          excerpt: boundedExcerpt(item.excerpt),
        };
      }),
    };
  }

  function copyEvidenceManifest() {
    var manifest = evidenceManifest();
    var lines = ["WWAM SAVED CLIPS // " + manifest.clips.length + " MOMENTS",
      "DISCLAIMER // " + manifest.disclaimer].concat(manifest.clips.map(function (clip) {
      return String(clip.order).padStart(2, "0") + ". " + clip.title + " // " + clip.category +
        " // " + timestamp(clip.start) + " // TIER: " + clip.evidenceLevel +
        " // SPEAKER: " + clip.speakerStatus + " // EDITOR-AUTH: " +
        (clip.authenticatedEditorVerified ? "YES" : "NO") + " // " + clip.url;
    }));
    copy(lines.join("\n"), "CLIP LIST COPIED");
  }

  function downloadEvidenceManifest() {
    downloadJson("wwam-evidence-bag.json", evidenceManifest());
    showToast("CLIP LIST SAVED");
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

  function archiveFreshness() {
    var generatedDates = [deep.generated, live.generated, popular.generated]
      .filter(Boolean)
      .map(String)
      .sort();
    var sourceDates = catalog.map(function (item) { return item.date; })
      .concat((live.streams || []).map(function (stream) { return stream.date; }))
      .concat((popular.streams || []).map(function (stream) { return stream.date; }))
      .filter(Boolean)
      .map(String)
      .sort();
    var snapshotDate = generatedDates[generatedDates.length - 1] || "";
    var latestSourceDate = sourceDates[sourceDates.length - 1] || snapshotDate;
    var dateParts = snapshotDate.split("-").map(Number);
    var snapshotTime = dateParts.length === 3 && dateParts.every(Number.isFinite) ?
      new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).getTime() : NaN;
    var today = new Date();
    var todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    var ageDays = Number.isFinite(snapshotTime) ?
      Math.max(0, Math.round((todayTime - snapshotTime) / 86400000)) : null;
    var status = ageDays == null ? "UNKNOWN" :
      ageDays <= 7 ? "CURRENT" : ageDays <= 30 ? "AGING" : "REFRESH DUE";
    return {
      snapshotDate: snapshotDate,
      latestSourceDate: latestSourceDate,
      ageDays: ageDays,
      status: status,
    };
  }

  function franchiseSlug(name) {
    var found = deep.franchises.filter(function (item) { return item.name === name; })[0];
    return found ? found.slug : "unknown";
  }

  function applyLanguageMode(value) {
    var text = String(value || "");
    if (state.redBand) return text;
    return text.replace(/\b(fuck\w*|shit\w*|bitch\w*|asshole\w*|ass|dick\w*|motherfucker\w*|goddamn\w*)\b/gi, "••••");
  }

  function boundedExcerpt(value) {
    var words = String(value || "").trim().split(/\s+/).filter(Boolean);
    return words.length > 16 ? words.slice(0, 16).join(" ") + " …" : words.join(" ");
  }

  function displayQuote(value) {
    return applyLanguageMode(boundedExcerpt(value));
  }

  function displayUiText(value) {
    return applyLanguageMode(value)
      .replace(/\bMACHINE[- ]SURFACED\b/gi, "TAPE-INDEXED CANDIDATE")
      .replace(/\bSOURCE-LOCAL\b/gi, "THIS SHOW");
  }

  function displayGeneratedText(value) {
    return displayUiText(value);
  }

  function safeEditorialCopy(value) {
    return String(value || "")
      .replace(/an explicit performance cue near/gi, "a machine-detected persona prompt or discussion near")
      .replace(/explicit performance cues near/gi, "machine-detected persona prompts or discussion near");
  }

  function renderProof() {
    var meta = deep.meta;
    var liveMeta = live.meta || {};
    var popularMeta = popular.meta || {};
    var stable = channelDNA.proofSnapshot || {};
    var sourceCount = meta.tapes + (liveMeta.streams || 0) + (popularMeta.streams || 0);
    var words = meta.wordsAudited + (liveMeta.wordsAudited || 0) + (popularMeta.wordsAudited || 0);
    var moments = meta.hotMoments + (liveMeta.moments || 0) + (popularMeta.moments || 0);
    document.getElementById("proof").innerHTML = [
      ["AUDITED INPUTS", stable.sources || sourceCount, "74 PROMOTED + 10 ARCHIVE DEEP QUARANTINE"],
      ["WORDS AUDITED", fmt(stable.wordsAudited || words), "AVAILABLE CAPTIONS"],
      ["CAPTION HOURS", Number(stable.captionHours || 0).toFixed(1), "AVAILABLE CAPTIONS AUDITED"],
      ["EDITORIAL RECEIPTS", stable.receipts || moments, "872 PROMOTED + 42 QUARANTINED CANDIDATES"],
      ["PROMOTED NODES", stable.nodes || (liveMeta.topics || 0) + (popularMeta.topics || 0), "CONNECTED, NOT JUST TAGGED"],
    ].map(function (stat) {
      return '<article><span>' + stat[0] + '</span><b>' + stat[1] + '</b><small>' + stat[2] + '</small></article>';
    }).join("");
  }

  function showcaseMetric(name, fallback) {
    if (!showcaseEngine) return fallback || 0;
    var aliases = {
      nodes: "graphNodes",
      edges: "graphEdges",
      timelines: "timeMachines",
      bits: "bitLineages",
    };
    var key = aliases[name] || name;
    if (showcaseEngine.metrics && showcaseEngine.metrics[key] != null) return showcaseEngine.metrics[key];
    if (showcaseEngine.getMetrics) {
      var metrics = showcaseEngine.getMetrics();
      if (metrics && metrics[key] != null) return metrics[key];
    }
    return fallback || 0;
  }

  function enrichEvidence(item) {
    item = item || {};
    var receipt = showcaseReceiptById[item.receiptId] || {};
    var sourceId = item.sourceId || receipt.sourceId || item.id;
    var source = showcaseSourceById[sourceId] || streamById[sourceId] || itemById[sourceId] || {};
    return Object.assign({}, receipt, item, {
      sourceId: sourceId,
      id: sourceId,
      source: item.source || receipt.sourceType || (itemById[sourceId] ? "commentary" : "livestream"),
      at: Number(item.at != null ? item.at : item.t != null ? item.t : receipt.t || 0),
      t: Number(item.t != null ? item.t : item.at != null ? item.at : receipt.t || 0),
      title: item.title || receipt.sourceTitle || source.title || source.film || "WWAM SOURCE",
      date: item.date || receipt.date || source.date,
      category: item.category || receipt.category || item.sentiment || "SOURCE RECEIPT",
      excerpt: item.excerpt || item.quote || receipt.excerpt || "",
    });
  }

  function openFranchiseAutopsies(franchise) {
    state.lab = franchise;
    setFranchise(franchise);
    if (location.hash !== "#autopsies") {
      history.pushState(null, "", location.pathname + location.search + "#autopsies");
    }
    window.dispatchEvent(new Event("hashchange"));
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
        openFranchiseAutopsies(button.getAttribute("data-franchise"));
      };
    });
  }

  function renderHeroConsole() {
    var moments = redBandMoments.filter(function (moment) { return moment.rank <= 16; });
    if (!moments.length) return;
    var moment = moments[state.consoleIndex % moments.length];
    var source = redSource(moment);
    document.getElementById("heroConsole").innerHTML =
      '<div class="console-rank">#' + String(moment.rank).padStart(3, "0") + '</div>' +
      '<p>“' + esc(displayQuote(moment.quote)) + '”</p>' +
      '<div><span>' + esc(displayUiText(moment.category)) + '</span><b>' +
      esc(displayUiText(source.title)) + ' @ ' + timestamp(moment.t) + '</b></div>' +
      '<button data-red-open="' + esc(source.id) + '" data-time="' + moment.t +
      '">PLAY THE RECEIPT →</button>';
    document.getElementById("consoleClock").textContent = timestamp(moment.t);
    bindRedButtons(document.getElementById("heroConsole"));
  }

  function redSource(moment) {
    var id = moment.sourceId || moment.tapeId || moment.id;
    var source = itemById[id] || streamById[id] || {};
    return {
      id: id,
      title: moment.sourceTitle || source.film || source.title || "WWAM SOURCE",
      franchise: moment.franchise || source.franchise || "MULTI-FRANCHISE HORROR",
      lane: moment.lane || (itemById[id] ? "commentary" : "livestream"),
    };
  }

  function openRedMoment(id, at) {
    if (itemById[id]) openDossier(id, at);
    else if (streamById[id]) openLiveDossier(id, at);
    else {
      var match = redBandMoments.filter(function (moment) {
        return (moment.sourceId || moment.tapeId) === id && Number(moment.t) === Number(at);
      })[0];
      if (match && match.url) window.open(match.url, "_blank", "noopener");
    }
  }

  function bindRedButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-red-open]"), function (button) {
      button.onclick = function () {
        openRedMoment(button.getAttribute("data-red-open"),
          Number(button.getAttribute("data-time") || 0));
      };
    });
  }

  function categories() {
    var found = [];
    redBandMoments.forEach(function (moment) {
      if (found.indexOf(moment.category) < 0) found.push(moment.category);
    });
    return ["ALL MOMENTS"].concat(found);
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

  function redSignalMarkup(moment) {
    if (!moment.scoreComponents) return "";
    var labels = {
      categoryIntensity: "CATEGORY",
      roomBreak: "ROOM BREAK",
      loreCallback: "CALLBACK",
      humanCuration: "PRESELECTION",
    };
    return '<div class="evidence-signals">' + Object.keys(labels).map(function (key) {
      var value = Math.round(Number((moment.scoreComponents[key] || {}).percentile || 0));
      return '<div class="evidence-signal"><div><span>' + labels[key] + '</span><b>' +
        value + '</b></div><i style="--signal:' + value + '%"></i></div>';
    }).join("") + '</div>';
  }

  function fanRedReason(moment) {
    var reasons = {
      "OUT OF POCKET": "A sentence so wrong it became instantly unforgettable.",
      "FRANCHISE FELONY": "A horror take delivered like charges were being filed.",
      "LOVE LETTER": "Real affection, delivered with WWAM's usual amount of damage.",
      "THEORY BOARD": "The conversation turns into a full corkboard-and-string situation.",
      "KILL ROOM": "The gore, body count, or kill talk takes over the room.",
      "BIT ENERGY": "A running joke finds its way back from the grave.",
      "BREAKDOWN": "The tape leaves the road and never finds it again.",
      "HORROR BRAIN": "Deep horror-nerd wiring takes control.",
      "UP IN YA": "A sentence no responsible podcast would let escape.",
      "THE ROOM BREAKS": "The bit lands hard enough to wreck the room.",
      "CHARACTER CALLBACK": "A recurring WWAM character kicks the door back open.",
      "FULL SEND": "They commit to the bit long after a reasonable person would stop.",
      "TAKE GETS NUCLEAR": "The opinion goes from strong to thermonuclear.",
      "CHAT DID THIS": "The audience throws gasoline on the show."
    };
    return reasons[moment.category] || categoryCopy[moment.category] ||
      "A moment that refused to disappear when the show ended.";
  }

  function renderRedMethod() {
    var root = document.getElementById("redMethod");
    if (!redBandRankingEngine) {
      root.innerHTML = '<article class="red-method-verdict"><span>THE LIST</span><b>100 MOMENTS</b><p>Every spot opens the original WWAM tape.</p></article>' +
        '<article><span>NO DOUBLES</span><b>ONE SPOT EACH</b><p>The same clip cannot sneak onto the list twice.</p></article>' +
        '<article><span>KEEP IT WEIRD</span><b>MIXED DAMAGE</b><p>One show or joke type cannot swallow the Top 25.</p></article>' +
        '<article><span>THE TAPE WINS</span><b>PRESS PLAY</b><p>Auto-captions are never the final word.</p></article>' +
        '<article><span>TIME BIAS</span><b>OFF</b><p>New uploads get no automatic boost.</p></article>';
      return;
    }
    var metrics = redBandRankingEngine.metrics;
    var diagnostics = redBandRankingEngine.diagnostics;
    root.innerHTML = [
      ["100 MOMENTS", "THE LIST", fmt(metrics.playableCandidates) + " playable moments competed; every winner keeps its exact timestamp.", "red-method-verdict"],
      [diagnostics.topSliceDiversity.uniqueCategories + " TYPES / " +
        diagnostics.topSliceDiversity.uniqueSources + " SHOWS", "TOP-25 MIX",
      "Different joke shapes and different tapes get room near the top.", ""],
      ["NO TAKEOVER", "VARIETY RULE", "Repeated categories, sources, and near-identical wording are capped.", ""],
      ["EVERY ENTRY", "SOURCE LOCKED", "Each card goes back to the exact moment in the original WWAM upload.", ""],
      ["OFF", "NEW-SHOW BOOST", "A new upload does not jump an older classic just for being new.", ""],
    ].map(function (entry) {
      return '<article class="' + entry[3] + '"><span>' + entry[1] + '</span><b>' +
        entry[0] + '</b><p>' + entry[2] + '</p></article>';
    }).join("");
  }

  function renderHot100() {
    var filtered = redBandMoments.filter(function (moment) {
      return state.hotCategory === "ALL MOMENTS" || moment.category === state.hotCategory;
    });
    var visible = filtered.slice(0, state.hotLimit);
    document.getElementById("hotGrid").innerHTML = visible.map(function (moment, index) {
      var source = redSource(moment);
      var accent = colors[source.franchise] ||
        (source.lane === "recent-livestream" ? "#55e5ff" :
          source.lane === "popular-livestream" ? "#d8ff38" : "#ff397f");
      var why = fanRedReason(moment);
      return '<article class="evidence-card ' + (index < 2 ? "featured" : "") + '" style="--accent:' +
        accent + '">' +
        '<div class="evidence-top"><b>#' + String(moment.rank).padStart(3, "0") + '</b><span>' +
        esc(displayUiText(moment.category)) + '</span><i>' + timestamp(moment.t) + '</i></div>' +
        '<blockquote>&ldquo;' + esc(displayQuote(moment.quote)) + '&rdquo;</blockquote>' +
        '<div class="evidence-why"><span>WHY IT MADE THE LIST</span><p>' +
        esc(displayUiText(why)) + '</p></div>' +
        '<p>AUTO-CAPTIONS CAN MISHEAR. PLAY THE TAPE BEFORE QUOTING IT.</p>' +
        '<footer><div><span>' + esc(displayUiText(source.franchise)) + '</span><b>' +
        esc(displayUiText(source.title)) + '</b></div>' +
        '<button data-red-open="' + esc(source.id) + '" data-time="' + moment.t +
        '">&#9654; PLAY THE MOMENT</button></footer>' +
        '</article>';
    }).join("");
    document.getElementById("loadMore").hidden = visible.length >= filtered.length;
    bindRedButtons(document.getElementById("hotGrid"));
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
        '<span><i></i>' + String(index + 1).padStart(2, "0") + ' // ' +
        esc(displayUiText(item.category)) + '</span>' +
        '<b>' + esc(displayUiText(item.label)) + '</b><p>“' + esc(displayQuote(item.quote)) + '”</p>' +
        '<em>' + esc(displayUiText(item.title)) + ' @ ' + timestamp(item.t) + '</em></button>';
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
    state.activeSoundbyte = item;
    document.getElementById("soundPlayer").innerHTML =
      '<div class="sound-video">' + window.ShokkerYouTubePlayback.iframe(item.id, {
        autoplay: true,
        start: item.t,
        end: Number(item.t) + 14,
        title: "WWAM source soundbyte"
      }) + '</div>' +
      '<div class="sound-now"><span>NOW VIOLATING THE SILENCE // ' +
      esc(displayUiText(item.category)) + '</span><h3>' +
      esc(displayUiText(item.label)) + '</h3><blockquote>“' + esc(displayQuote(item.quote)) + '”</blockquote><p>' +
      esc(displayUiText(item.title)) + ' // ' + timestamp(item.t) + '</p><button data-open-sound="' + item.source +
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

  function refreshSoundPlayerCopy() {
    var item = state.activeSoundbyte;
    var panel = document.querySelector("#soundPlayer .sound-now");
    if (!item || !panel) return;
    var category = panel.querySelector("span");
    var label = panel.querySelector("h3");
    var quote = panel.querySelector("blockquote");
    var source = panel.querySelector("p");
    if (category) category.textContent =
      "NOW VIOLATING THE SILENCE // " + displayUiText(item.category);
    if (label) label.textContent = displayUiText(item.label);
    if (quote) quote.textContent = "“" + displayQuote(item.quote) + "”";
    if (source) source.textContent = displayUiText(item.title) + " // " + timestamp(item.t);
  }

  function characterProfiles() {
    var profiles = characterLore.characters || characterLore.profiles || [];
    return profiles.map(function (profile, index) {
      var id = profile.id || String(profile.name || "character-" + index).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return Object.assign({
        id: id,
        name: profile.name || "UNKNOWN WITNESS",
        performer: profile.performer || profile.performedBy || "WWAM recurring performance",
        description: profile.description || profile.summary || profile.profile || "A recurring bit reconstructed from source receipts.",
        behaviors: profile.behaviors || profile.patterns || profile.behaviorPatterns || [],
        triggers: profile.triggers || profile.triggerSignals || [],
        soundbytes: profile.soundbytes || profile.receipts || profile.evidence || [],
        responseTemplates: profile.responseTemplates || profile.templates ||
          (profile.responseKit && profile.responseKit.templates) || [],
      }, profile, { id: id });
    });
  }

  function characterFallback(profile, topic) {
    var id = String(profile.id || "").toLowerCase();
    if (id.indexOf("loomis") >= 0) {
      return "I've spent years warning you about " + topic + ". There is no explanation. There is only evil—and nobody locked the door.";
    }
    if (id.indexOf("challis") >= 0) {
      return "Wait a minute. " + topic + "? Get away from the mask. Why does nobody listen until eight seconds before disaster?";
    }
    if (id.indexOf("slender") >= 0) {
      return "You asked about " + topic + ". The trees answered. Stop looking behind you; this is getting awkward.";
    }
    if (id.indexOf("feldman") >= 0) {
      return topic + " needs commitment, choreography, and confidence after everyone realizes this became a different scene.";
    }
    return "The bit reviewed " + topic + " and reached a conclusion no witness will put on the record.";
  }

  function fillCharacterTemplate(template, topic, profile) {
    var replacements = {
      "SUBJECT": topic,
      "QUESTION": topic,
      "PROBLEM": topic,
      "FRANCHISE": topic,
      "ROLE": topic,
      "CHARACTER": topic,
      "CREATURE": topic,
      "ALARMING TRAIT": "the exact kind of confidence that gets people hurt in Haddonfield",
      "RESOURCE": "a state vehicle and a properly funded hospital",
      "ABSURD DIAGNOSIS": "acute Halloween exposure",
      "PRACTICAL OBJECT": "a flashlight",
      "BENIGN ACTION": "drink some water and sit down",
      "FICTIONAL DRINK": "Silver Shamrock boilermaker",
      "BODY PART": profile.id === "slenderman" ? "your nostrils" : "liver",
      "SANDWICH TYPE": "bologna",
      "SONG TYPE": "soft rock",
      "INVENTED RIVAL GROUP": "entirely fictional Wolf Pack",
    };
    var output = String(template)
      .replace(/\{topic\}/gi, topic)
      .replace(/\{question\}/gi, topic)
      .replace(/\{character\}/gi, profile.name)
      .replace(/\{performer\}/gi, profile.performer);
    return output.replace(/\[([A-Z ]+)\]/g, function (match, key) {
      return replacements[key] || topic;
    });
  }

  function generateCharacterRiff(profile, question) {
    var topic = question.trim().replace(/[?!.]+$/g, "") || "whatever is happening here";
    var templates = profile.responseTemplates || [];
    if (templates.length) {
      var hash = topic.split("").reduce(function (total, char) { return total + char.charCodeAt(0); }, 0);
      var template = templates[hash % templates.length];
      if (typeof template === "object") template = template.text || template.template || "";
      if (template) return fillCharacterTemplate(template, topic, profile);
    }
    return characterFallback(profile, topic);
  }

  function normalizeCharacterReceipt(receipt) {
    var playback = receipt.playback || {};
    return Object.assign({}, receipt, {
      source: receipt.source || receipt.sourceType || (itemById[receipt.id || receipt.sourceId] ? "commentary" : "livestream"),
      performanceReceiptId: receipt.performanceReceiptId || receipt.id,
      id: receipt.sourceId || receipt.videoId || receipt.id,
      t: Number(playback.start != null ? playback.start :
        receipt.t != null ? receipt.t : receipt.time || receipt.timestamp || 0),
      end: Number(playback.end != null ? playback.end : 0),
      clipSeconds: Number(playback.clipSeconds != null ? playback.clipSeconds : 0),
      title: receipt.sourceTitle || receipt.title || receipt.label || "CHARACTER CANDIDATE",
      category: receipt.trigger || "PERFORMANCE CANDIDATE",
      quote: receipt.quote || receipt.excerpt || receipt.text || "Open the source context.",
      label: receipt.label || receipt.title || receipt.note || receipt.context || "PERFORMANCE CANDIDATE",
      confidence: receipt.confidence != null ? Math.round(Number(receipt.confidence) * 100) + "% CURATION CONFIDENCE" :
        receipt.attributionConfidence || "SOURCE-LINKED",
      evidenceLevel: receipt.evidenceLevel || "curated-candidate",
      receiptKind: receipt.receiptKind || receipt.kind || "candidate-performance",
      type: receipt.type || "candidate-performance",
      speakerStatus: receipt.speakerStatus || "not-diarized",
      authenticatedEditorVerified: receipt.authenticatedEditorVerified === true,
    });
  }

  function renderCharacterRoster() {
    var profiles = characterProfiles();
    var locked = characterLore.lockedCandidates || [];
    if (!profiles.length) {
      document.getElementById("characterRoster").innerHTML = '<p class="character-empty">CHARACTER ARCHIVE IS LOADING.</p>';
      return;
    }
    if (!state.character || !profiles.some(function (profile) { return profile.id === state.character; })) {
      state.character = profiles[0].id;
    }
    document.getElementById("characterRoster").innerHTML = profiles.map(function (profile, index) {
      return '<button class="' + (profile.id === state.character ? "on" : "") + '" data-character="' + esc(profile.id) +
        '"><span>CHARACTER 0' + (index + 1) + '</span><b>' + esc(profile.name) + '</b><i>' +
        esc(profile.performer) + '</i></button>';
    }).join("") + locked.map(function (candidate) {
      return '<button class="locked" disabled aria-disabled="true" title="' + esc(candidate.whyLocked || "Human verification required") +
        '"><span>WITNESS LOCKED</span><b>' + esc(candidate.name || "UNVERIFIED CHARACTER") +
        '</b><i>PERFORMER IDENTITY NEEDS HUMAN REVIEW</i></button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#characterRoster [data-character]"), function (button) {
      button.onclick = function () {
        state.character = button.getAttribute("data-character");
        state.characterContext = null;
        state.lastCharacterRiff = "";
        state.characterReceiptLimit = 3;
        state.characterReceiptOffset = 0;
        state.characterMatchedReceipt = "";
        document.getElementById("characterAnswer").innerHTML =
          "<p>Ask anything. The answer is a fan-made riff; the real WWAM clips always stay separate underneath.</p>";
        renderCharacterRoster();
        renderCharacter();
      };
    });
  }

  function characterReceiptLibrary(profile) {
    var library = characterEngine && characterEngine.getReceiptLibrary ?
      characterEngine.getReceiptLibrary(profile.id) : null;
    var source = library && library.ok ? library.receipts : (profile.soundbytes || []);
    return source.map(normalizeCharacterReceipt).filter(function (receipt) {
      return receipt.id && receipt.performanceReceiptId;
    });
  }

  function renderCharacterReceiptShelf(profile, matchedId) {
    var allReceipts = characterReceiptLibrary(profile);
    var total = allReceipts.length;
    var matchRelation = state.characterContext && state.characterContext.receiptMatch &&
      state.characterContext.receiptMatch.relationship;
    if (matchedId) {
      state.characterMatchedReceipt = matchedId;
      allReceipts.some(function (receipt, index) {
        if (receipt.performanceReceiptId !== matchedId) return false;
        state.characterReceiptOffset = index;
        return true;
      });
    }
    var offset = total ? ((Number(state.characterReceiptOffset) || 0) % total + total) % total : 0;
    var ordered = allReceipts.slice(offset).concat(allReceipts.slice(0, offset));
    var limit = Math.min(total, Math.max(3, Number(state.characterReceiptLimit) || 3));
    var receipts = ordered.slice(0, limit);
    var label = document.getElementById("characterReceiptLabel");
    label.textContent = total ?
      "SHOWING " + receipts.length + " OF " + total +
        " PLAYABLE CLIPS // CHECK THE ORIGINAL CONTEXT" :
      "NO PLAYABLE CHARACTER CLIPS YET";
    document.getElementById("characterReceipts").innerHTML = receipts.length ? receipts.map(function (receipt) {
      var position = Number(receipt.libraryIndex) || allReceipts.indexOf(receipt) + 1;
      var matched = receipt.performanceReceiptId === state.characterMatchedReceipt;
      return '<article class="' + (matched ? "matched" : "") + '" data-character-receipt="' +
        esc(receipt.performanceReceiptId) + '"><div><span>TAPE ' + String(position).padStart(2, "0") +
        ' OF ' + String(total).padStart(2, "0") + '</span><b>' + timestamp(receipt.t) + '</b></div>' +
        (matched ? '<em>' + (matchRelation === "query" ? "MATCHED TO YOUR QUESTION" : matchRelation === "pattern" ? "CHARACTER PATTERN CLIP" : "REAL CLIP FROM THIS CHARACTER'S SHELF") + '</em>' : '') +
        '<small>' + esc(receipt.date ? shortDate(receipt.date) : "DATE UNLISTED") + ' // ' +
        esc(displayUiText(receipt.title)) + '</small><h3>' + esc(displayUiText(receipt.label)) +
        '</h3><p>“' + esc(displayQuote(receipt.quote)) + '</p><footer><span>' +
        'OFFICIAL WWAM UPLOAD // AUTO-CAPTIONS CAN MISHEAR' +
        '</span><button data-character-source="' + esc(receipt.source) + '" data-id="' + esc(receipt.id) +
        '" data-time="' + receipt.t + '" data-end="' + receipt.end + '" data-label="' +
        esc(displayUiText(receipt.label)) + '">PLAY ' +
        'SOURCE CLIP →</button>' +
        bagButton(receipt, "SAVE CLIP") + '</footer></article>';
    }).join("") : '<p class="character-empty">No playable clip is available for this character yet.</p>';
    var rotate = document.getElementById("characterReceiptRotate");
    var more = document.getElementById("characterReceiptMore");
    rotate.hidden = total <= 1;
    rotate.disabled = total <= 1;
    rotate.onclick = function () {
      if (total <= 1) return;
      state.characterMatchedReceipt = "";
      state.characterReceiptOffset = (offset + 1) % total;
      renderCharacterReceiptShelf(profile);
    };
    more.hidden = total <= 3;
    more.textContent = limit >= total ? "SHOW 3 CLIPS" : "SEE ALL " + total + " CLIPS";
    more.onclick = function () {
      state.characterReceiptLimit = limit >= total ? 3 : total;
      renderCharacterReceiptShelf(profile);
    };
    bindCharacterReceipts();
    syncBagButtons();
  }

  function renderCharacter() {
    var profile = characterProfiles().filter(function (candidate) { return candidate.id === state.character; })[0];
    if (!profile) return;
    var behaviors = (profile.behaviors || []).slice(0, 5);
    var triggers = (profile.triggers || []).slice(0, 4);
    document.getElementById("characterLine").textContent =
      displayUiText(profile.name + " // " + profile.performer + "’S RECURRING CHARACTER");
    document.getElementById("characterPortrait").innerHTML =
      '<div><span>RECURRING BIT PROFILE</span><b>' + esc(displayUiText(profile.name)) + '</b><i>' +
      esc(displayUiText(profile.performer + " // RECURRING WWAM CHARACTER")) +
      '</i></div><p>' + esc(displayUiText(profile.description)) + '</p><ul>' +
      behaviors.map(function (behavior) {
        return '<li>' + esc(displayUiText(typeof behavior === "string" ?
          behavior : behavior.label || behavior.pattern || "")) + '</li>';
      }).join("") +
      '</ul><footer><span>COMMON TRIGGERS</span><b>' +
      (triggers.length ? triggers.map(function (trigger) {
        return esc(displayUiText(typeof trigger === "string" ?
          trigger : trigger.label || trigger.topic || ""));
      }).join(" // ") : "ARCHIVE-DERIVED PROMPTS") +
      '</b></footer>';
    renderCharacterReceiptShelf(profile, state.characterMatchedReceipt);
  }

  function bindCharacterReceipts() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-character-source]"), function (button) {
      button.onclick = function () {
        var id = button.getAttribute("data-id");
        var at = Number(button.getAttribute("data-time") || 0);
        var end = Number(button.getAttribute("data-end") || 0);
        openLooseSource(id, at, button.getAttribute("data-label") || "WWAM CHARACTER PERFORMANCE", end);
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-character-shelf-jump]"), function (button) {
      button.onclick = function () {
        var profile = characterProfiles().filter(function (candidate) {
          return candidate.id === state.character;
        })[0];
        if (!profile) return;
        state.characterReceiptLimit = characterReceiptLibrary(profile).length;
        renderCharacterReceiptShelf(profile, state.characterMatchedReceipt);
        var shelf = document.querySelector(".character-receipts");
        if (shelf) {
          shelf.scrollIntoView({ behavior: "smooth", block: "nearest" });
          shelf.focus({ preventScroll: true });
        }
      };
    });
  }

  function askCharacter(question) {
    var profile = characterProfiles().filter(function (candidate) { return candidate.id === state.character; })[0];
    if (!profile) return;
    var response = characterEngine ? characterEngine.answer(profile.id, question, state.characterContext) : null;
    if (response && !response.ok) {
      document.getElementById("characterAnswer").innerHTML = '<p class="character-engine-error">' +
        esc(displayUiText(response.error || "That character is not ready to answer.")) + '</p>';
      return;
    }
    var behaviors = response && response.ingredients ? response.ingredients : (profile.behaviors || []).slice(0, 3).map(function (behavior) {
      return typeof behavior === "string" ? behavior : behavior.label || behavior.pattern || "";
    }).filter(Boolean);
    var riff = response ? response.text : generateCharacterRiff(profile, question);
    var matchedReceiptId = response && response.receipt ? response.receipt.id : "";
    var receipt = response && response.receipt ? normalizeCharacterReceipt(response.receipt) : null;
    if (response) state.characterContext = response;
    state.lastCharacterRiff = riff;
    state.characterMatchedReceipt = matchedReceiptId;
    if (response) renderCharacterReceiptShelf(profile, matchedReceiptId);
    var riffSubject = response ? (response.continuedFrom ?
      "Same subject as your follow-up" : String(response.subject || "Character pattern")) :
      "Recurring character patterns";
    document.getElementById("characterAnswer").innerHTML =
      '<div><span>FAN-MADE CHARACTER RIFF</span>' +
      '<b>THE REAL WWAM CLIPS STAY SEPARATE BELOW</b></div>' +
      '<blockquote>&ldquo;' + esc(displayGeneratedText(riff)) + '&rdquo;</blockquote>' +
      '<details class="why-details character-riff-details"><summary>HOW THIS RIFF WAS MATCHED</summary>' +
      '<div><span>CHARACTER TRAITS USED</span><b data-character-riff-traits>' +
      esc(displayUiText(behaviors.length ?
        behaviors.join(" + ").toUpperCase() : "RECURRING CHARACTER PATTERN")) +
      '</b></div>' + (response ? '<div><span>RIFF SUBJECT</span><b data-character-riff-subject>' +
        esc(displayUiText(riffSubject)) + '</b><i>' + response.readiness.confidence +
        '% PATTERN MATCH // ' + response.readiness.timestampValidatedReceipts +
        ' PLAYABLE CLIPS</i></div>' : '') + '</details>' +
      (response ? '<section class="character-grounding"><div><span>REAL WWAM SOURCE CLIP</span><b>' +
        esc(displayUiText(receipt ? receipt.label : "CLIP SHELF READY BELOW")) + '</b></div>' +
        '<div class="character-grounding-actions">' +
        (receipt ? '<button data-character-source="' + esc(receipt.source) +
        '" data-id="' + esc(receipt.id) + '" data-time="' + receipt.t + '" data-end="' + receipt.end +
        '" data-label="' + esc(displayUiText(receipt.label)) +
        '">PLAY THE REAL SOURCE CLIP &rarr;</button>' : '') +
        '<button data-character-shelf-jump>SEE ALL ' +
        response.readiness.timestampValidatedReceipts + ' CLIPS &rarr;</button></div></section>' : '');
    bindCharacterReceipts();
  }

  function refreshCharacterAnswerCopy() {
    if (!state.lastCharacterRiff) return;
    var characterQuote = document.querySelector("#characterAnswer blockquote");
    if (characterQuote) {
      characterQuote.textContent = "“" + displayGeneratedText(state.lastCharacterRiff) + "”";
    }
    if (!state.characterContext) return;
    var ingredients = document.querySelector("#characterAnswer [data-character-riff-traits]");
    if (ingredients) {
      ingredients.textContent = displayUiText(
        (state.characterContext.ingredients || []).join(" + ").toUpperCase() ||
        "RECURRING CHARACTER PATTERN"
      );
    }
    var subject = document.querySelector("#characterAnswer [data-character-riff-subject]");
    if (subject) {
      subject.textContent = displayUiText(state.characterContext.continuedFrom ?
        "Same subject as your follow-up" :
        String(state.characterContext.subject || "Character pattern"));
    }
  }
  function renderLiveProof() {
    var meta = live.meta || {};
    document.getElementById("liveProof").innerHTML = [
      [meta.streams, "NEWEST SHOWS"],
      [meta.captioned, "SHOW WIKIS"],
      [meta.hours, "HOURS"],
      [meta.moments, "PLAYABLE MOMENTS"],
      [meta.topics, "TOPICS"],
    ].map(function (stat) {
      return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
  }
  function renderTopicRadar() {
    var topics = [{ name: "ALL TOPICS", mentions: 0, streams: live.streams }].concat(live.topicIndex.slice(0, 12));
    document.getElementById("topicRadar").innerHTML = topics.map(function (topic) {
      var showCount = (topic.streams || []).length;
      return '<button class="' + (state.liveTopic === topic.name ? "on" : "") + '" data-live-topic="' +
        esc(topic.name) + '"><b>' + esc(topic.name) + '</b><span>' + showCount +
        (showCount === 1 ? " SHOW" : " SHOWS") + '</span></button>';
    }).join("");
    var selected = topics.filter(function (topic) { return topic.name === state.liveTopic; })[0];
    var selectedCount = selected ? (selected.streams || []).length : 0;
    document.getElementById("topicRadarLabel").textContent = state.liveTopic === "ALL TOPICS" ?
      "ALL TEN SHOWS" : state.liveTopic + " // " + selectedCount + (selectedCount === 1 ? " SHOW" : " SHOWS");
    Array.prototype.forEach.call(document.querySelectorAll("#topicRadar [data-live-topic]"), function (button) {
      button.onclick = function () {
        state.liveTopic = button.getAttribute("data-live-topic");
        renderTopicRadar();
        renderStreams();
      };
    });
  }
  function miniHeat(stream) {
    if (!stream.heatmap.length) return '<div class="mini-heat sealed"><span>NO CHAPTERS FOR THIS SHOW YET</span></div>';
    return '<div class="mini-heat" aria-label="A quick visual guide to the liveliest parts of this show">' + stream.heatmap.map(function (bin) {
      return '<i style="--heat:' + bin.heat + '" title="' + esc(bin.topic || "Show moment") + '"></i>';
    }).join("") + '</div>';
  }
  function streamCard(stream, index) {
    var topics = stream.topics.slice(0, 4);
    var peak = (stream.moments || []).slice().sort(function (a, b) { return (b.heat || b.score || 0) - (a.heat || a.score || 0); })[0];
    var topicNames = topics.map(function (topic) { return topic.name; });
    var topicList = topicNames.length > 2 ? topicNames.slice(0, -1).join(", ") + ", and " + topicNames[topicNames.length - 1] :
      topicNames.length === 2 ? topicNames.join(" and ") : (topicNames[0] || "movie news and the live chat");
    var momentNames = {
      "UP IN YA": "an Up In Ya detour",
      "TAKE GETS NUCLEAR": "the take that goes nuclear",
      "THE ROOM BREAKS": "the moment that breaks the room",
      "FULL SEND": "the full-send moment",
    };
    var startName = peak ? (momentNames[peak.category] || "the night's best surfaced moment") : "the full show";
    var summary = stream.captioned ? topicList + " lead this show." +
      (peak ? " Start with " + startName + " at " + timestamp(peak.t) + "." : " The full show is ready to play.") :
      "This show is ready to watch, but it does not have a usable chapter list yet.";
    return '<article class="stream-card ' + (!stream.captioned ? "unmapped" : "") + '" data-live-id="' + stream.id + '">' +
      '<div class="stream-thumb"><img loading="lazy" src="' + esc(stream.thumbnail) + '" alt="' + esc(stream.title + " livestream thumbnail") + '"><span>LIVE ' +
      String(index + 1).padStart(2, "0") + ' // ' + shortDate(stream.date) + '</span><b>' + duration(stream.duration) + '</b></div>' +
      '<div class="stream-body"><div><i class="' + (stream.captioned ? "" : "sealed") + '">' + (stream.captioned ? "SHOW WIKI READY" : "WATCH ONLY") +
      '</i><span>' + (stream.captioned ? topics.length + " QUICK JUMPS" : "FULL SHOW AVAILABLE") + '</span></div>' +
      '<h3>' + esc(stream.title) + '</h3><p>' + esc(summary) + '</p>' +
      '<div class="stream-topics">' + (topics.length ? topics.map(function (topic) {
        return '<button data-stream-topic="' + esc(topic.name) + '" data-live-id="' + stream.id + '" data-time="' + topic.peak + '">' +
          esc(topic.name) + ' <b>' + timestamp(topic.peak) + '</b></button>';
      }).join("") : '<span>NO CHAPTERS YET. THE FULL SHOW STILL PLAYS.</span>') + '</div>' +
      miniHeat(stream) + '<footer><span>' + (peak ? 'START WITH THIS MOMENT // ' + timestamp(peak.t) : 'WATCH THE FULL SHOW') +
      '</span><button aria-label="Open ' + (stream.captioned ? "show wiki" : "show") + ' for ' + esc(stream.title) + '">' +
      (stream.captioned ? 'OPEN SHOW WIKI &rarr;' : 'WATCH ON YOUTUBE &rarr;') + '</button></footer></div></article>';
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

  function popularTopicNames() {
    var names = [];
    (popular.topicIndex || []).forEach(function (topic) {
      if (names.indexOf(topic.name) < 0) names.push(topic.name);
    });
    if (!names.length) {
      (popular.streams || []).forEach(function (stream) {
        (stream.topics || []).forEach(function (topic) {
          if (names.indexOf(topic.name) < 0) names.push(topic.name);
        });
      });
    }
    return names.slice(0, 14);
  }

  function renderPopularProof() {
    var meta = popular.meta || {};
    document.getElementById("popularProof").innerHTML = [
      [meta.streams || popular.streams.length, "SHOWS"],
      [fmt(meta.viewsAtSnapshot || meta.views || popular.streams.reduce(function (total, stream) { return total + Number(stream.views || 0); }, 0)), "COMBINED VIEWS"],
      [meta.captioned || popular.streams.filter(function (stream) { return stream.captioned; }).length, "SHOW WIKIS"],
      [meta.hours || 0, "HOURS"],
      [meta.moments || 0, "PLAYABLE MOMENTS"],
    ].map(function (stat) {
      return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
  }
  function renderPopularTopics() {
    var names = ["ALL TOPICS"].concat(popularTopicNames());
    document.getElementById("popularTopics").innerHTML = names.map(function (name) {
      return '<button class="' + (state.popularTopic === name ? "on" : "") + '" data-popular-topic="' +
        esc(name) + '">' + esc(name) + '</button>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-popular-topic]"), function (button) {
      button.onclick = function () {
        state.popularTopic = button.getAttribute("data-popular-topic");
        renderPopularTopics();
        renderPopular();
      };
    });
  }

  function filteredPopular() {
    var query = state.popularQuery.toLowerCase();
    return (popular.streams || []).filter(function (stream) {
      var topics = (stream.topics || []).map(function (topic) { return topic.name; });
      var characters = (stream.characters || stream.characterSightings || []).map(function (character) {
        return character.name || character.character || character;
      });
      var blob = [stream.title, stream.summary, stream.whyItMatters,
        stream.editorial && stream.editorial.whyItMatters, topics.join(" "), characters.join(" ")].join(" ").toLowerCase();
      var matchesQuery = !query || blob.indexOf(query) >= 0;
      var matchesTopic = state.popularTopic === "ALL TOPICS" || topics.indexOf(state.popularTopic) >= 0;
      return matchesQuery && matchesTopic;
    });
  }

  function characterSignalLabel(sighting) {
    var status = String((sighting && sighting.status) || "").toLowerCase();
    if (status === "persona prompt") return "PERSONA PROMPT";
    if (status === "performance discussion") return "PERFORMANCE DISCUSSION";
    if (status === "character reference") return "ORDINARY REFERENCE";
    return "INDEXED SIGNAL";
  }

  function popularCard(stream) {
    var topics = (stream.topics || []).slice(0, 5);
    var sightings = (stream.characters || stream.characterSightings || []).slice(0, 3);
    var peak = (stream.moments || []).slice().sort(function (a, b) {
      return (b.heat || b.score || 0) - (a.heat || a.score || 0);
    })[0];
    var rank = stream.rank || stream.viewRank || popular.streams.indexOf(stream) + 1;
    var topicNames = topics.slice(0, 3).map(function (topic) { return topic.name; });
    var topicList = topicNames.length > 2 ? topicNames.slice(0, -1).join(", ") + ", and " + topicNames[topicNames.length - 1] :
      topicNames.length === 2 ? topicNames.join(" and ") : (topicNames[0] || "movie news and the live chat");
    var characterNames = sightings.map(function (sighting) {
      return sighting.name || sighting.character || sighting;
    }).filter(Boolean);
    var characterList = characterNames.length > 2 ? characterNames.slice(0, -1).join(", ") + ", and " + characterNames[characterNames.length - 1] :
      characterNames.length === 2 ? characterNames.join(" and ") : (characterNames[0] || "");
    var showShape = String(stream.editorial && stream.editorial.showShape || "").toLowerCase().replace(/-/g, " ");
    var momentNames = {
      "UP IN YA": "an Up In Ya detour",
      "TAKE GETS NUCLEAR": "the take that goes nuclear",
      "THE ROOM BREAKS": "the moment that breaks the room",
      "FULL SEND": "the full-send moment",
    };
    var startName = peak ? (momentNames[peak.category] || "the night's best surfaced moment") : "";
    var reason = "On this shelf, it ranks #" + rank + " with " + fmt(stream.views) + " views. " +
      (showShape ? "This is " + showShape + ", built around " : "The night moves through ") + topicList + "." +
      (characterList ? " " + characterList + (characterNames.length === 1 ? " comes" : " come") + " up along the way." : "") +
      (peak ? " Start with " + startName + " at " + timestamp(peak.t) + "." : "");
    return '<article class="popular-card ' + (!stream.captioned ? "unmapped" : "") + '" data-popular-id="' +
      esc(stream.id) + '"><div class="popular-rank"><b>#' + String(rank).padStart(2, "0") +
      '</b><span>' + fmt(stream.views) + ' VIEWS @ ' + esc((popular.selection && popular.selection.snapshot) || popular.generated || "SNAPSHOT") +
      '</span></div><div class="popular-image"><img loading="lazy" src="' + esc(stream.thumbnail) + '" alt="' +
      esc(stream.title + " livestream thumbnail") + '"><span>' + shortDate(stream.date) + ' // ' + duration(stream.duration) +
      '</span></div><div class="popular-body"><div><i>' + (stream.captioned ? "SHOW WIKI READY" : "WATCH ONLY") +
      '</i><b>' + (stream.captioned ? topics.length + " QUICK JUMPS" : "FULL SHOW AVAILABLE") + '</b></div><h3>' + esc(stream.title) +
      '</h3><p class="popular-why"><span>WHY THIS SHOW</span>' + esc(reason) +
      '</p><div class="popular-topic-row">' + topics.map(function (topic) {
        return '<button data-popular-jump="' + esc(stream.id) + '" data-time="' + Number(topic.peak || topic.t || 0) +
          '">' + esc(topic.name) + ' <b>' + timestamp(topic.peak || topic.t || 0) + '</b></button>';
      }).join("") + '</div>' + (characterList ? '<div class="character-sightings"><span>CHARACTERS THAT COME UP</span><b>' +
        esc(characterList) + '</b></div>' : '') + miniHeat(stream) + '<footer><span>' +
      (peak ? 'START WITH THIS MOMENT // ' + timestamp(peak.t) : 'WATCH THE FULL SHOW') +
      '</span><button aria-label="Open show wiki for ' + esc(stream.title) + '">' +
      (stream.captioned ? 'OPEN SHOW WIKI &rarr;' : 'WATCH ON YOUTUBE &rarr;') + '</button></footer></div></article>';
  }
  function renderPopular() {
    var list = filteredPopular();
    var snapshot = (popular.selection && popular.selection.snapshot) || popular.generated || "RECORDED";
    document.getElementById("popularStatus").textContent = list.length + " OF " + popular.streams.length +
      " SHOWS // VIEW COUNT SNAPSHOT " + snapshot;
    document.getElementById("popularGrid").innerHTML = list.length ? list.map(popularCard).join("") :
      '<p class="popular-empty">NO SHOWS MATCH THAT SEARCH.</p>';
    Array.prototype.forEach.call(document.querySelectorAll("[data-popular-id]"), function (card) {
      card.onclick = function () { openLiveDossier(card.getAttribute("data-popular-id")); };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-popular-jump]"), function (button) {
      button.onclick = function (event) {
        event.stopPropagation();
        openLiveDossier(button.getAttribute("data-popular-jump"), Number(button.getAttribute("data-time") || 0));
      };
    });
  }
  function stageArchiveRecord(recordOrId) {
    var record = typeof recordOrId === "string" ?
      archiveAtlasEngine && archiveAtlasEngine.getRecord(recordOrId) :
      recordOrId;
    if (!record || !record.id) return;
    var staged = {
      id: String(record.id),
      url: record.url || "https://www.youtube.com/watch?v=" + String(record.id),
      title: record.displayTitle || record.title || "WWAM SOURCE",
      date: record.date || "",
      duration: Number(record.durationSeconds != null ? record.durationSeconds : record.duration) || 0,
      views: Number(record.views || 0),
      coverage: record.coverage || "metadata-only",
      priority: record.priority || null,
      stagedFrom: "archive-autopsy-queue",
    };
    window.WWAM_PENDING_INTAKE_SOURCE = staged;
    var section = document.getElementById("fresh-intake");
    if (!section || !window.WWAMFeatureLoader) {
      showToast("DROP ZONE UNAVAILABLE // SOURCE REMAINS IN THE QUEUE");
      return;
    }
    if (document.getElementById("tapeModal").classList.contains("show")) {
      closeDossier({ replaceRoute: true, restoreFocus: false });
    }
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("SOURCE STAGED // TIMED CAPTIONS STILL REQUIRED");
    window.WWAMFeatureLoader.hydrate(section).then(function (ready) {
      if (!ready) {
        showToast("DROP ZONE LOAD HELD // SOURCE REMAINS STAGED");
        return;
      }
      document.dispatchEvent(new CustomEvent("wwam:stage-intake-source", {
        detail: { source: staged },
      }));
    });
  }

  function openArchiveRecord(recordOrId) {
    var record = typeof recordOrId === "string" ?
      archiveAtlasEngine && archiveAtlasEngine.getRecord(recordOrId) :
      recordOrId;
    if (!record) return;
    openSourceDossier(record.id);
  }

  function archiveAskMarkup(query) {
    return archiveAtlasUi ? archiveAtlasUi.askMarkup(query) : "";
  }

  function renderFranchises() {
    document.getElementById("franchiseGrid").innerHTML = deep.franchises.map(function (franchise, index) {
      var items = catalog.filter(function (item) { return item.franchise === franchise.name; });
      var tapes = items.map(function (item) { return tapeById[item.id]; }).filter(Boolean);
      var peak = tapes.slice().sort(function (a, b) { return b.unhinged - a.unhinged; })[0];
      var peakItem = peak ? itemById[peak.id] : items[0];
      var image = peakItem ? peakItem.thumbnail : "";
      if (franchise.name === "A Nightmare on Elm Street") image = "https://i.ytimg.com/vi/rLXnU3Rsj-4/maxresdefault.jpg";
      var momentCount = tapes.reduce(function (sum, tape) { return sum + (Array.isArray(tape.moments) ? tape.moments.length : 0); }, 0);
      return '<article class="franchise-card" style="--accent:' + colors[franchise.name] + '">' +
        '<div class="franchise-image"><img loading="lazy" src="' + esc(image) + '" alt=""><span>CASE FILE 0' + (index + 1) + '</span></div>' +
        '<div class="franchise-body"><p>' + esc(franchise.killer) + ' PATH // ' + franchise.tapes + ' TAPES</p>' +
        '<h3>' + esc(franchise.name) + '</h3><blockquote>“' + esc(franchise.prompt) + '”</blockquote>' +
        '<div class="franchise-stats"><span><b>' + franchise.tapes + '</b>COMMENTARIES</span><span><b>' +
        momentCount + '</b>PLAYABLE MOMENTS</span></div>' +
        '<button data-franchise="' + esc(franchise.name) + '">OPEN ' + esc(franchise.lab) + ' →</button></div></article>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#franchiseGrid [data-franchise]"), function (button) {
      button.onclick = function () {
        openFranchiseAutopsies(button.getAttribute("data-franchise"));
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
    var momentCount = Array.isArray(tape.moments) ? tape.moments.length : 0;
    var blurb = sealed ?
      "The official upload is here. This tape still needs a reliable timestamp pass." :
      "Open the full commentary, then jump straight to " + momentCount +
        " moment" + (momentCount === 1 ? "" : "s") + " worth replaying.";
    return '<article class="tape-card ' + franchiseSlug(item.franchise) + '" style="--accent:' + colors[item.franchise] +
      '" data-tape="' + item.id + '">' +
      '<div class="tape-image"><img loading="lazy" src="' + esc(item.thumbnail) + '" alt="' +
      esc(item.film + " commentary thumbnail") + '"><span>' +
      esc(item.franchise) + '</span><b>' + duration(item.duration) + '</b></div>' +
      '<div class="tape-body"><div><span>TAPE ' + String(item.order).padStart(2, "0") + ' // ' + shortDate(item.date) +
      '</span><i class="' + (sealed ? "sealed" : "") + '">' + (sealed ? "WATCH ONLY" : "SHOW WIKI READY") + '</i></div>' +
      '<h3>' + esc(item.film) + '</h3><p>' + esc(blurb) + '</p>' +
      '<footer><span><b>' + (sealed ? "—" : momentCount) + '</b>MOMENTS</span><span><b>' +
      (sealed ? "SOURCE" : "READY") + '</b>STATUS</span><button aria-label="Open show wiki for ' +
      esc(item.film) + '">OPEN SHOW WIKI &rarr;</button></footer>' +
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

  function openDossier(id,startTime,end){return openSourceDossier(id,startTime,{routeMode:"push",end});}
  function openLiveDossier(id,startTime){return openSourceDossier(id,startTime,{routeMode:"push"});}

  function openLooseSource(id, startTime, label, endTime) {
    if (!id) return;
    rememberDialogFocus();
    var at = Number(startTime || 0);
    var end = Number(endTime || 0);
    var clipSeconds = end > at ? Math.round(end - at) : 0;
    var modal = document.getElementById("tapeModal");
    document.getElementById("modalContent").innerHTML =
      '<div class="modal-hero live-modal-hero" style="--accent:var(--pink)"><img src="https://i.ytimg.com/vi/' +
      encodeURIComponent(id) + '/maxresdefault.jpg" alt=""><div><p>CHARACTER ARCHAEOLOGY // PERFORMANCE CANDIDATE</p><h2>' +
      esc(label || "WWAM SOURCE RECEIPT") + '</h2><span>' +
      (clipSeconds ? "BOUNDED " + clipSeconds + "-SECOND SOURCE CLIP" : "PLAYABLE ORIGINAL") + " // " + timestamp(at) +
      '</span></div></div><section class="receipt-section loose-source"><div><p class="kicker">ORIGINAL SOURCE CONTEXT</p>' +
      '<span>THIS AUDIO IS WWAM’S SOURCE UPLOAD // THE GENERATED RIFF IS NOT' +
      (clipSeconds ? " // CLIP STOPS AFTER " + clipSeconds + " SECONDS" : "") +
      '</span></div><div class="modal-player" id="modalPlayer"></div>' +
      '<div class="loose-source-actions"><a href="https://www.youtube.com/watch?v=' +
      encodeURIComponent(id) + '&t=' + Math.round(at) + 's" target="_blank" rel="noopener">OPEN ORIGINAL ON YOUTUBE ↗</a></div></section>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    syncBackgroundInert();
    focusSoon("#modalClose");
    loadPlayer(id, at, end);
  }

  function loadPlayer(id, at, end) {
    var player = document.getElementById("modalPlayer");
    if (!player) return;
    player.innerHTML = window.ShokkerYouTubePlayback.iframe(id, {
      autoplay: true,
      start: at,
      end: end,
      title: "WWAM commentary source playback"
    });
    player.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function closeDossier(options) {
    var settings = options || {};
    if (!settings.fromHistory && !settings.replaceRoute &&
        history.state && history.state.wwamSourceDossierPushed) {
      history.back();
      return;
    }
    if(window.WWAMMemoryCutLauncher)window.WWAMMemoryCutLauncher.destroy();
    var modal = document.getElementById("tapeModal");
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("aria-busy", "false");
    modal.removeAttribute("aria-labelledby");
    modal.removeAttribute("aria-describedby");
    document.getElementById("modalContent").innerHTML = "";
    document.body.classList.remove("modal-open");
    syncBackgroundInert();
    if (!settings.preserveRoute) {
      var url = new URL(window.location.href);
      ["source", "tape", "live", "at", "section"].forEach(function (key) {
        url.searchParams.delete(key);
      });
      var nextState = Object.assign({}, history.state || {});
      delete nextState.wwamSourceDossier;
      delete nextState.wwamSourceDossierPushed;
      delete nextState.sourceId;
      history.replaceState(nextState, "", url);
      if (typeof window.dispatchEvent === "function") window.dispatchEvent(new Event("hashchange"));
    }
    if (settings.restoreFocus === false) lastDialogFocus = null;
    else restoreDialogFocus();
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

  function copy(value, message) {
    var notice = message || "LINK COPIED";
    var previousFocus = document.activeElement;
    function legacyCopy() {
      var input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      try {
        input.focus();
        input.select();
        if (!document.execCommand("copy")) throw new Error("Legacy copy command was rejected.");
        showToast(notice);
        return true;
      } catch {
        var manualOpened = false;
        try {
          window.prompt("Clipboard access was blocked. Press Ctrl+C or Cmd+C to copy this value:", value);
          manualOpened = true;
        } catch {
        }
        showToast(manualOpened ? "COPY BLOCKED // MANUAL COPY WINDOW OPENED" :
          "COPY BLOCKED // USE THE DOWNLOAD OPTION");
        return false;
      } finally {
        input.remove();
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
      }
    }
    if (navigator.clipboard && window.isSecureContext) {
      try {
        navigator.clipboard.writeText(value).then(function () {
          showToast(notice);
        }).catch(legacyCopy);
      } catch {
        legacyCopy();
      }
    } else {
      legacyCopy();
    }
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    if (typeof message === "string" && message) toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function renderAskExamples() {
    var examples = (askEngine.examples || curated.askExamples || []).slice(0, 3);
    document.getElementById("askExamples").innerHTML = examples.map(function (example) {
      return '<button>' + esc(example) + '</button>';
    }).join("");
  }

  function askExcerpt(result) {
    if (typeof result.excerpt === "string") return result.excerpt;
    if (result.excerpt && result.excerpt.whyItMatters) return safeEditorialCopy(result.excerpt.whyItMatters);
    if (result.stream && result.stream.editorial && result.stream.editorial.whyItMatters) {
      return safeEditorialCopy(result.stream.editorial.whyItMatters);
    }
    return result.subtitle || "Open the indexed source to inspect the evidence behind this result.";
  }

  function askCollectionStatus(analysis) {
    var c = analysis.collection;
    if (!c || c.total == null) return "";
    var rawUnit = String(c.unit || "RESULTS").toUpperCase();
    var unit = /PERFORMANCE/.test(rawUnit) ? "PLAYABLE CLIPS" :
      /MENTION/.test(rawUnit) ? "CAPTION MENTIONS" :
      /(LIVESTREAM|STREAM|UPLOAD|SOURCE RECORD)/.test(rawUnit) ? "SHOWS" : rawUnit;
    var text = c.total + " " + unit;
    if (c.sourceTotal != null && !/SHOWS/.test(unit)) text += " ACROSS " + c.sourceTotal + " SHOWS";
    if (c.displayed < c.total) text += " // TOP " + c.displayed + " BELOW";
    return text;
  }

  function askShareUrl(query) {
    return window.WWAMAskShare.build(location.href, query, state.askContext);
  }

  function isRedBandRankQuery(query) {
    if (redBandQueryEngine) return redBandQueryEngine.matches(query, state.askContext);
    return /\b(?:red\s*band(?:\s*100)?|memorability\s+index|most\s+memorable\s+moments?)\b/i.test(
      String(query || "")
    );
  }

  function ask(query, preservedAnalysis) {
    var statusNode = document.getElementById("askStatus");
    var resultsNode = document.getElementById("askResults");
    resultsNode._trail = null;
    resultsNode.setAttribute("data-ask-query", String(query || "").trim());
    var redBandIntent = isRedBandRankQuery(query);
    if (redBandIntent && !redBandQueryEngine) {
      state.lastAskQuery = query;
      statusNode.textContent = "OPENING MEMORABILITY INDEX V2.1…";
      resultsNode.replaceChildren();
      loadRedBandRanking().then(function (engine) {
        if (engine && state.lastAskQuery === query) ask(query);
      });
      return;
    }
    if (!redBandIntent && !archiveDeepEngine && /\barchive\s+deep\b/i.test(query)) {
      state.lastAskQuery = query;
      statusNode.textContent = "OPENING ARCHIVE DEEP // 40 CAPTION AUDITS";
      resultsNode.innerHTML =
        '<div class="ask-no-match"><b>SEARCHING THE QUARANTINED EVIDENCE LANE…</b>' +
        '<p>Machine candidates will stay visibly outside Canon while the batch loads.</p></div>';
      loadArchiveDeep().then(function (engine) {
        if (engine && state.lastAskQuery === query) ask(query);
        else statusNode.textContent = "ARCHIVE DEEP LOAD FAILED";
      });
      return;
    }
    var rankedAnalysis = redBandIntent && redBandQueryEngine ?
      redBandQueryEngine.analyze(query, state.askContext) : null;
    var analysis = rankedAnalysis || preservedAnalysis || askEngine.ask(query, state.askContext);
    if(!preservedAnalysis&&analysis.status==="insufficient-evidence")loadDemoScript("ask-deep-cut.js?v=1.0.0").then(function(){return window.WWAMAskDeepCut.resolve(query,catalog,loadDemoScript,analysis);}).then(function(deep){if(deep&&state.lastAskQuery===query)ask(query,deep);}).catch(function(){});
    resultsNode._trail = analysis;
    if (!redBandIntent && !archiveDeepEngine && analysis.selectionPlan &&
        analysis.selectionPlan.sourceTitleBoundary) {
      state.lastAskQuery = query;
      statusNode.textContent = "CHECKING ARCHIVE DEEP // EXACT TITLE HELD";
      resultsNode.replaceChildren();
      loadArchiveDeep().then(function (engine) {
        if (engine && state.lastAskQuery === query) ask(query);
      });
      return;
    }
    if (!redBandIntent && !archiveDeepEngine) {
      loadArchiveDeep().then(function (engine) {
        if (engine && state.lastAskQuery === query) ask(query);
      });
    }
    if (!archiveAtlasEngine &&
        /\b(uploads?|uploaded|streams?|streamed|livestreams?|videos?|archive|feed)\b/i.test(query)) {
      loadArchiveAtlas().then(function (engine) {
        if (engine && state.lastAskQuery === query) ask(query, analysis);
      });
    }
    var results = analysis.results || [];
    var timedDeepAnswer = results.some(function (result) {
      return (result.lane === "archive" || result.lane === "episode-guide") && result.kind !== "livestream" &&
        Number.isFinite(Number(result.at)) && Number(result.at) >= 0;
    });
    var archiveFallback = timedDeepAnswer ? "" : archiveAskMarkup(query);
    var roleByKey = {};
    (analysis.evidenceChain || []).forEach(function (entry) {
      if (entry.result && entry.result.key) roleByKey[entry.result.key] = entry.role;
    });
    state.askContext = analysis.context || {
      entity: analysis.entity,
      intent: analysis.intent,
      source: analysis.source,
      query: query,
    };
    state.lastAskQuery = query;
    state.lastAskAnalysis = analysis;
    state.longitudinalSubject = analysis.longitudinalHandoff &&
      analysis.longitudinalHandoff.subjectId || "";
    if (archiveFallback) {
      statusNode.textContent = "SHOWS FOUND // TITLE SEARCH ONLY";
      resultsNode.innerHTML =
        '<section class="answer-brief"><div><span>THE SHORT ANSWER</span>' +
        '<b>SHOW SEARCH</b><i>TITLE + DATE MATCHES</i>' +
        '<button class="ask-share" type="button" data-copy-ask>COPY LINK</button></div>' +
        '<h3>Here are the matching uploads in the order you asked for. Open one to see what happened inside.</h3>' +
        '</section>' + archiveFallback;
      var archiveShare = document.querySelector("#askResults [data-copy-ask]");
      if (archiveShare) {
        archiveShare.onclick = function () {
          copy(askShareUrl(state.lastAskQuery), "ANSWER LINK COPIED");
        };
      }
      return;
    }
    var collectionStatus = askCollectionStatus(analysis);
    var isAnyHandoff = /handoff$/.test(analysis.status);
    statusNode.textContent =
      analysis.status === "adjudication-handoff" ? "THIS ONE NEEDS A HUMAN CALL" :
      analysis.status === "longitudinal-handoff" ? "OPENING THE PREDICTION TRACKER" :
      analysis.status === "surface-handoff" ? "OPENING THE RANKED ARCHIVE" :
      analysis.status === "out-of-range" ? "PICK A NUMBER FROM 1 TO 100" :
      analysis.status === "machine-ranked" && results.length ?
        "MEMORABILITY LIST // TAPE-INDEXED CANDIDATES" :
        collectionStatus ? collectionStatus :
        results.length ?
          results.length + (results.length === 1 ? " RESULT SHOWN" : " RESULTS SHOWN") :
          "NO SOURCE MATCH YET";
    var boundary = '<details' + (isAnyHandoff ? ' open' : '') + ' class="ask-method"><summary>HOW THIS ANSWER WAS CHECKED</summary>' +
      '<section class="ask-boundary ' + esc(analysis.status || "unknown") +
      '"><header><span>ARCHIVE CHECK</span><b>' +
      esc(String(analysis.questionType || analysis.intent || "QUERY").toUpperCase()) +
      ' // ' + esc(String(analysis.metric || "RELEVANCE").toUpperCase()) + '</b></header><div class="ask-basis">' +
      (analysis.confidenceBasis || []).map(function (basis) {
        return '<span>' + esc(displayUiText(basis)) + '</span>';
      }).join("") + '</div>' + ((analysis.limitations || []).length ? '<ul>' +
        analysis.limitations.map(function (limit) {
          return '<li>' + esc(displayUiText(limit)) + '</li>';
        }).join("") +
        '</ul>' : "") + (analysis.recommendedSurface ?
        '<a href="' + esc(analysis.recommendedSurface.href === "#canon-desk" ? "#canon" : analysis.recommendedSurface.href) +
        '"><b>' + esc(displayUiText(analysis.recommendedSurface.label)) + ' →</b><span>' +
        esc(displayUiText(analysis.recommendedSurface.reason)) + '</span></a>' : "") + '</section></details>';
    var noMatchHeadline = isAnyHandoff ? analysis.recommendedSurface.label :
      analysis.status === "out-of-range" ? "THAT RANK DOES NOT EXIST." :
        "THE ARCHIVE REFUSED TO MAKE SOMETHING UP.";
    var noMatchBody = isAnyHandoff ? analysis.answer : analysis.status === "out-of-range" ?
      "Choose #001 through #100; the engine will not swap your request for a different rank." :
      "No confident match in the current source scope.";
    resultsNode.innerHTML =
      '<section class="answer-brief"><div><span>THE SHORT ANSWER</span><b>' +
      (analysis.entity ? esc(displayUiText(analysis.entity.toUpperCase())) : 'WWAM ARCHIVE') + '</b><i>' +
      (collectionStatus || (results.length ? results.length +
        (results.length === 1 ? ' RESULT SHOWN' : ' RESULTS SHOWN') : 'SOURCE-CHECKED ANSWER')) +
      (analysis.continuedFrom ? ' // FOLLOW-UP' : '') +
      '</i><button class="ask-share" type="button" data-copy-ask>COPY LINK</button></div>' +
      '<div class="derived-answer-copy">' + esc(displayUiText(analysis.answer)) +
      '</div></section>' + boundary +
      (results.length ? results.map(function (result, index) {
        var role = result.curatedRank == null ?
          (index === 0 ? "BEST MATCH" : "MORE FROM THE ARCHIVE") :
          "WWAM UP IN YA // #" + String(result.curatedRank).padStart(2, "0") + " // " +
            (result.curatedLabel || "SOUNDBYTE");
        var excerpt = askExcerpt(result);
        var isCaptionReceipt = String(result.evidenceType || "").indexOf("caption") >= 0 ||
          result.evidenceLevel === "TIMESTAMPED CAPTION RECEIPT" ||
          result.kind === "character-performance";
        var excerptMarkup = isCaptionReceipt ?
          "“" + esc(displayQuote(excerpt)) + "”" :
          '<b class="derived-answer-copy">' + esc(displayQuote(excerpt)) + '</b>';
        var momentLabel = result.kind === "character-performance" ? "PLAYABLE CHARACTER CLIP" :
          result.kind === "livestream" ? "PLAYABLE SHOW MOMENT" : "PLAYABLE MOMENT";
        return '<article class="' + (index === 0 ? "best" : "") + '"><div><span>' +
          esc(displayUiText(role)) + '</span><b>' + esc(displayUiText(momentLabel)) +
          '</b></div><h3>' + esc(displayUiText(result.title)) +
          '</h3><div class="ask-result-source">SOURCE // ' +
          esc(displayUiText(result.sourceTitle || result.title)) + ' // ' +
          esc(result.date || 'DATE NOT MAPPED') + '</div><p><span>' +
          timestamp(result.at || 0) + '</span>' +
          excerptMarkup + '</p><details class="why-details"><summary>WHY THIS MATCH?</summary>' +
          '<div class="why-row"><span>MATCH SIGNALS</span><b>' +
          esc(displayUiText(result.reasons.length ?
            result.reasons.join(" + ").toUpperCase() : "TEXTUAL EVIDENCE")) +
          '</b></div>' + ((result.evidenceWarnings || []).length ? '<ul class="result-warnings">' +
            result.evidenceWarnings.slice(0, 3).map(function (warning) {
              return '<li>' + esc(displayUiText(warning)) + '</li>';
            }).join("") + '</ul>' : "") + '</details>' + (result.trajectoryEvidence ?
            '<div class="trajectory-signal"><span>CAPTION-BASED TAKE SIGNAL</span><b>' +
            esc(displayUiText((result.trajectoryEvidence.evaluativeTerms || []).join(" + ").toUpperCase())) +
            ' // TARGET: ' +
            esc(displayUiText((result.trajectoryEvidence.targetTerms || []).join(" + ").toUpperCase())) +
          '</b><i>NOT A HOST-LEVEL OPINION CLAIM</i></div>' : "") +
          '<footer><span>' + timestamp(result.at || 0) + ' // ' +
          (index === 0 ? 'START HERE' : 'MORE FROM THIS ANSWER') +
          '</span><button data-ask-source="' + esc(result.source) + '" data-id="' + esc(result.sourceId) +
          '" data-time="' + Number(result.at || 0) + '" data-end="' + Number(result.end || 0) + '">PLAY THIS PART &rarr;</button>' +
          bagButton(Object.assign({}, result, { excerpt: excerpt }), "SAVE CLIP") +
          '</footer></article>';
      }).join("") : '<div class="ask-no-match"><b>' + noMatchHeadline + '</b><p>' + noMatchBody + '</p>' +
        (isAnyHandoff ? [] : analysis.suggestions || []).map(function (suggestion) {
          return '<button data-ask-suggestion="' + esc(suggestion) + '">' +
            esc(displayUiText(suggestion)) + '</button>';
        }).join("") + '</div>');
    var askCards = Array.prototype.slice.call(document.querySelectorAll("#askResults > article"));
    if (askCards.length > 3) {
      var askMore = document.createElement("details");
      askMore.className = "ask-more-results";
      var askMoreSummary = document.createElement("summary");
      askMoreSummary.textContent = "SEE " + (askCards.length - 3) + " MORE PLAYABLE MATCHES";
      askMore.appendChild(askMoreSummary);
      askCards[3].parentNode.insertBefore(askMore, askCards[3]);
      askCards.slice(3).forEach(function (card) { askMore.appendChild(card); });
    }
    Array.prototype.forEach.call(document.querySelectorAll("#askResults [data-ask-source]"), function (button) {
      button.onclick = function () {
        if (button.getAttribute("data-ask-source") === "livestream") {
          openLiveDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time") || 0));
        } else {
          openDossier(button.dataset.id,+button.dataset.time,+button.dataset.end);
        }
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("#askResults [data-ask-suggestion]"), function (button) {
      button.onclick = function () {
        var suggestion = button.getAttribute("data-ask-suggestion");
        document.getElementById("askInput").value = suggestion;
        ask(suggestion);
      };
    });
    var askShare = document.querySelector("#askResults [data-copy-ask]");
    if (askShare) {
      askShare.onclick = function () {
        copy(askShareUrl(state.lastAskQuery), "ANSWER LINK COPIED");
      };
    }
    var scoreLink = document.querySelector('#askResults a[href="#tape-keeps-score"]');
    if (scoreLink) scoreLink.onclick = function () {
      state.memoryTab = "score";
      renderMemory();
    };
    var verdictLink = document.querySelector('#askResults a[href="#verdict-room"]');
    if (verdictLink) verdictLink.onclick = function () { dispatchEvent(new CustomEvent(
      "wwam:verdict-room-open", { detail: analysis.adjudicationHandoff })); };
    syncBagButtons();
  }

  function showcaseCall(method, fallback, args) {
    if (showcaseEngine && typeof showcaseEngine[method] === "function") {
      try {
        var result = showcaseEngine[method].apply(showcaseEngine, args || []);
        if (result != null) return result;
      } catch {
      }
    }
    return fallback();
  }

  function sourceMoment(source, id, moment, title, date) {
    return {
      source: source,
      sourceId: id,
      id: id,
      at: Number(moment.t || moment.at || 0),
      t: Number(moment.t || moment.at || 0),
      title: title,
      date: date,
      category: moment.category || "SOURCE RECEIPT",
      excerpt: moment.quote || moment.excerpt || "",
      score: moment.score || moment.heat || 0,
    };
  }

  function fallbackTimeMachines() {
    return franchiseOrder.map(function (franchise) {
      var events = catalog.filter(function (item) { return item.franchise === franchise; })
        .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); })
        .map(function (item) {
          var tape = tapeById[item.id];
          var moment = tape && tape.moments.slice().sort(function (a, b) { return b.score - a.score; })[0];
          return moment ? sourceMoment("commentary", item.id, moment, item.film, item.date) : null;
        }).filter(Boolean);
      return { name: franchise, entity: franchise, events: events, receipts: events };
    });
  }

  function fallbackBitLineages() {
    var characterBits = characterProfiles().map(function (profile) {
      var receipts = (profile.soundbytes || []).map(normalizeCharacterReceipt).map(function (receipt) {
        var source = receipt.source === "commentary" ? itemById[receipt.id] : streamById[receipt.id];
        return {
          source: receipt.source,
          sourceId: receipt.id,
          id: receipt.id,
          at: receipt.t,
          t: receipt.t,
          title: receipt.label,
          date: source && source.date,
          category: profile.name,
          excerpt: receipt.quote,
        };
      });
      return { name: profile.name, bit: profile.name, description: profile.description, events: receipts, receipts: receipts };
    }).filter(function (bit) { return bit.events.length; });
    if (characterBits.length) return characterBits;
    var events = [];
    deep.tapes.forEach(function (tape) {
      var item = itemById[tape.id];
      tape.moments.filter(function (moment) { return moment.category === "BIT ENERGY"; }).forEach(function (moment) {
        events.push(sourceMoment("commentary", tape.id, moment, item.film, item.date));
      });
    });
    return [{ name: "Recurring Callback Signals", bit: "Recurring Callback Signals", events: events, receipts: events }];
  }

  function fallbackChemistry() {
    var entries = [];
    live.streams.concat(popular.streams).forEach(function (stream) {
      var moments = stream.moments || [];
      if (!moments.length) return;
      var avg = Math.round(moments.reduce(function (total, moment) { return total + Number(moment.heat || 0); }, 0) / moments.length);
      entries.push({
        title: stream.title,
        source: "livestream",
        sourceId: stream.id,
        score: Math.min(99, Math.round(avg * .7 + moments.length * 4)),
        escalation: Math.min(99, avg + 5),
        callbacks: (stream.characters || stream.characterSightings || []).length * 18,
        roomBreaks: moments.filter(function (moment) { return moment.category === "THE ROOM BREAKS"; }).length,
        peak: moments.slice().sort(function (a, b) { return b.heat - a.heat; })[0],
      });
    });
    return entries.sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
  }

  function fallbackCourtCases() {
    return franchiseOrder.map(function (franchise) {
      var prosecution = [];
      var defense = [];
      catalog.filter(function (item) { return item.franchise === franchise; }).forEach(function (item) {
        var tape = tapeById[item.id];
        (tape ? tape.moments : []).forEach(function (moment) {
          var evidence = sourceMoment("commentary", item.id, moment, item.film, item.date);
          if (moment.category === "FRANCHISE FELONY") prosecution.push(evidence);
          if (moment.category === "LOVE LETTER") defense.push(evidence);
        });
      });
      return {
        title: "THE PEOPLE VS. " + franchise.toUpperCase(),
        entity: franchise,
        prosecution: prosecution.sort(function (a, b) { return b.score - a.score; }).slice(0, 3),
        defense: defense.sort(function (a, b) { return b.score - a.score; }).slice(0, 3),
      };
    });
  }

  function fallbackDescent(options) {
    options = options || {};
    var mode = options.mode || state.descentMode;
    var categories = mode === "GRUDGES" ? ["FRANCHISE FELONY", "TAKE GETS NUCLEAR"] :
      mode === "LOVE" ? ["LOVE LETTER"] :
      mode === "LORE" ? ["HORROR BRAIN", "THEORY BOARD", "BIT ENERGY"] :
      ["OUT OF POCKET", "BREAKDOWN", "THE ROOM BREAKS", "FULL SEND", "UP IN YA"];
    var candidates = [];
    deep.tapes.forEach(function (tape) {
      var item = itemById[tape.id];
      tape.moments.forEach(function (moment) {
        if (categories.indexOf(moment.category) >= 0) candidates.push(sourceMoment("commentary", tape.id, moment, item.film, item.date));
      });
    });
    live.streams.concat(popular.streams).forEach(function (stream) {
      (stream.moments || []).forEach(function (moment) {
        if (categories.indexOf(moment.category) >= 0) candidates.push(sourceMoment("livestream", stream.id, moment, stream.title, stream.date));
      });
    });
    candidates.sort(function (a, b) { return b.score - a.score; });
    var count = Math.max(4, Math.min(12, Math.round((options.minutes || state.descentMinutes) / 3)));
    return { mode: mode, minutes: options.minutes || state.descentMinutes, path: candidates.slice(0, count) };
  }

  function evidenceButton(item, label) {
    var source = item.source || item.sourceType || (itemById[item.sourceId || item.id] ? "commentary" : "livestream");
    var id = item.sourceId || item.id || item.videoId;
    var at = Number(item.at != null ? item.at : item.t || item.time || 0);
    return '<button data-memory-source="' + esc(source) + '" data-id="' + esc(id) + '" data-time="' + at +
      '">' + esc(label || "PLAY RECEIPT") + ' →</button>';
  }

  function memoryReceipt(item, index) {
    return '<article class="memory-receipt"><div><span>' + String(index + 1).padStart(2, "0") + ' // ' +
      esc(displayUiText(item.category || item.role || "SOURCE RECEIPT")) + '</span><b>' +
      (item.date ? shortDate(item.date) : timestamp(item.at || item.t)) +
      '</b></div><h4>' + esc(displayUiText(item.title || item.label || "WWAM SOURCE")) + '</h4><p>“' +
      esc(displayQuote(item.excerpt || item.quote || "Open the source to inspect this evidence.")) +
      '”</p><div class="memory-actions">' + evidenceButton(item, "OPEN " + timestamp(item.at || item.t || 0)) +
      bagButton(item, "BAG IT") + '</div></article>';
  }

  function bindMemoryReceipts() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-source]"), function (button) {
      button.onclick = function () {
        var id = button.getAttribute("data-id");
        var at = Number(button.getAttribute("data-time") || 0);
        if (button.getAttribute("data-memory-source") === "commentary" && itemById[id]) openDossier(id, at);
        else if (streamById[id]) openLiveDossier(id, at);
        else openLooseSource(id, at, "WWAM SOURCE RECEIPT");
      };
    });
  }

  function renderTimeMachine() {
    var machines = showcaseCall("getTimeMachines", fallbackTimeMachines);
    if (!Array.isArray(machines)) machines = machines.items || machines.timelines || [];
    if (!machines.length) return '<p class="memory-empty">THE TIME MACHINE NEEDS MORE TIMESTAMPED EVENTS.</p>';
    var selected = machines.filter(function (machine) {
      return (machine.name || machine.entity || machine.title || machine.subject) === state.memoryEntity;
    })[0] || machines[0];
    state.memoryEntity = selected.name || selected.entity || selected.title || selected.subject;
    var events = (selected.events || selected.milestones || selected.timeline || []).map(enrichEvidence);
    return '<div class="memory-picker">' + machines.slice(0, 10).map(function (machine) {
      var name = machine.name || machine.entity || machine.title || machine.subject;
      return '<button class="' + (name === state.memoryEntity ? "on" : "") + '" data-memory-entity="' + esc(name) +
        '">' + esc(name) + '</button>';
    }).join("") + '</div><div class="time-machine"><div class="time-intro"><span>TAKE TIME MACHINE</span><h3>' +
      esc(state.memoryEntity) + '</h3><p>Follow a chronological receipt trail. It suggests review points, not a host-opinion change.</p><b>' +
      events.length + ' TIMESTAMPED STOPS // TAKE INFERENCE</b></div><div class="time-track">' + events.slice(0, 10).map(function (event) {
        return '<article><i></i><div><span>' + esc(event.date ? shortDate(event.date) : "DATE IN SOURCE") + ' // ' +
          esc(event.category || "RECEIPT") + '</span><h4>' + esc(event.title || state.memoryEntity) + '</h4><p>“' +
          esc(displayQuote(event.excerpt || event.quote || "")) + '”</p>' + evidenceButton(event, "ENTER THIS MOMENT") +
          '</div></article>';
      }).join("") + '</div></div>';
  }

  function renderBitAncestry() {
    var lineages = showcaseCall("getBitLineages", fallbackBitLineages);
    if (!Array.isArray(lineages)) lineages = lineages.items || lineages.bits || [];
    if (!lineages.length) return '<p class="memory-empty">NO RECURRING BIT HAS ENOUGH CURATED INDEXED SIGHTINGS YET.</p>';
    return window.WWAMBitBloodlineHost ?
      window.WWAMBitBloodlineHost.view(lineages) :
      '<p class="memory-empty">OPENING ALL FOUR SOURCE-LOCKED BIT BLOODLINES…</p>';
  }

  function renderChemistry() {
    var entries = showcaseCall("getRiffChemistry", fallbackChemistry);
    if (!Array.isArray(entries)) entries = entries.moments || entries.items || entries.rankings || [];
    entries = entries.map(function (entry) {
      var evidence = enrichEvidence(entry);
      return Object.assign({}, entry, {
        title: evidence.title,
        source: evidence.source,
        sourceId: evidence.sourceId,
        at: evidence.at,
        category: evidence.category,
        peak: evidence,
        escalation: entry.escalation || (entry.dimensions && entry.dimensions.escalation),
        callbacks: entry.callbacks || (entry.dimensions && entry.dimensions.callbackDensity),
        roomBreaks: entry.roomBreaks || (entry.dimensions && entry.dimensions.roomBreak),
      });
    });
    return '<div class="chemistry-head"><span>RIFF VELOCITY IS NOT A PROFANITY COUNTER</span><p>Escalation, room breaks, callbacks, character sightings, and how fast one remark infects the room.</p></div><div class="chemistry-grid">' +
      entries.slice(0, 8).map(function (entry, index) {
        var peak = entry.peak || {};
        return '<article><div><b>#' + String(index + 1).padStart(2, "0") + '</b><i>' +
          Number(entry.score || entry.riffVelocity || 0) + '</i></div><h3>' + esc(entry.title || entry.name) +
          '</h3><ul><li><span>ESCALATION</span><b>' + Number(entry.escalation || entry.score || 0) +
          '</b></li><li><span>CALLBACK PRESSURE</span><b>' + Number(entry.callbacks || entry.callbackDensity || 0) +
          '</b></li><li><span>ROOM BREAKS</span><b>' + Number(entry.roomBreaks || entry.breaks || 0) +
          '</b></li></ul>' + evidenceButton({
            source: entry.source || "livestream",
            sourceId: entry.sourceId || entry.id,
            at: peak.t || entry.at || 0,
          }, "INSPECT THE RIFF") + '</article>';
      }).join("") + '</div>';
  }

  function renderCourt() {
    var cases = showcaseCall("getCourtCases", fallbackCourtCases);
    if (!Array.isArray(cases)) cases = cases.items || cases.cases || [];
    var court = cases[0];
    if (!court) return '<p class="memory-empty">COURT IS ADJOURNED UNTIL BOTH SIDES HAVE RECEIPTS.</p>';
    var prosecution = (court.prosecution || court.negative || []).map(enrichEvidence);
    var defense = (court.defense || court.positive || []).map(enrichEvidence);
    return '<div class="court-title"><span>TAPE-INDEXED ARGUMENT BOARD // VERDICT OPEN</span><h3>' +
      esc(court.title || court.caseName || "THE PEOPLE VS. THE FRANCHISE") + '</h3><p>These signals have not passed whole-work review. Contradictory receipts stay together; no host verdict is declared.</p></div><div class="court-grid"><section><header>PROSECUTION CANDIDATES</header>' +
      prosecution.slice(0, 3).map(memoryReceipt).join("") + '</section><div class="court-vs">VS</div><section><header>THE DEFENSE</header>' +
      defense.slice(0, 3).map(memoryReceipt).join("") + '</section></div>';
  }

  function renderDescent() {
    var descent = showcaseCall("buildDescent", function () {
      return fallbackDescent({ mode: state.descentMode, minutes: state.descentMinutes });
    }, [{ mode: state.descentMode, minutes: state.descentMinutes }]);
    var path = descent.path || descent.stops || descent.items || descent;
    if (!Array.isArray(path)) path = [];
    path = path.map(enrichEvidence);
    return '<div class="descent-builder"><div><span>GENERATE A PLAYABLE RABBIT HOLE</span><h3>' +
      state.descentMinutes + ' MINUTES OF ' + esc(state.descentMode) + '</h3></div><label>RUN TIME<input id="descentMinutes" type="range" min="10" max="45" step="5" value="' +
      state.descentMinutes + '"><b>' + state.descentMinutes + ' MIN</b></label><div class="descent-modes">' +
      ["CHAOS", "GRUDGES", "LOVE", "LORE"].map(function (mode) {
        return '<button class="' + (mode === state.descentMode ? "on" : "") + '" data-descent-mode="' + mode + '">' +
          mode + '</button>';
      }).join("") + '</div></div><div class="descent-path">' + path.slice(0, 12).map(function (item, index) {
        return '<article><b>' + String(index + 1).padStart(2, "0") + '</b><div><span>' +
          esc(item.category || "SOURCE RECEIPT") + '</span><h4>' + esc(item.title || item.label || "WWAM SOURCE") +
          '</h4><p>' + esc(displayQuote(item.excerpt || item.quote || "")) + '</p></div>' +
          evidenceButton(item, "PLAY") + '</article>';
      }).join("") + '</div>';
  }

  function battleEntities() {
    var franchises = franchiseOrder.map(function (name) {
      return { key: "franchise:" + name, label: name, lane: "FRANCHISE" };
    });
    var tapes = catalog.map(function (item) {
      return { key: "tape:" + item.id, label: item.film, lane: item.franchise };
    });
    return franchises.concat(tapes);
  }

  function battleSummary(key) {
    var isFranchise = key.indexOf("franchise:") === 0;
    var value = key.slice(key.indexOf(":") + 1);
    var items = isFranchise ? catalog.filter(function (item) { return item.franchise === value; }) :
      catalog.filter(function (item) { return item.id === value; });
    var tapes = items.map(function (item) { return tapeById[item.id]; }).filter(Boolean);
    var moments = [];
    tapes.forEach(function (tape) {
      var item = itemById[tape.id];
      (tape.moments || []).forEach(function (moment) {
        moments.push({
          source: "commentary",
          sourceId: tape.id,
          id: tape.id,
          at: moment.t,
          t: moment.t,
          title: item ? item.film : value,
          category: moment.category,
          excerpt: moment.quote,
          score: Number(moment.score || 0),
        });
      });
    });
    moments.sort(function (a, b) { return b.score - a.score; });
    var count = function (categories) {
      return moments.filter(function (moment) { return categories.indexOf(moment.category) >= 0; }).length;
    };
    var unhinged = tapes.length ? Math.round(tapes.reduce(function (total, tape) {
      return total + Number(tape.unhinged || 0);
    }, 0) / tapes.length) : 0;
    return {
      key: key,
      label: isFranchise ? value : (items[0] ? items[0].film : value),
      lane: isFranchise ? "FRANCHISE" : (items[0] ? items[0].franchise : "TAPE"),
      sources: tapes.length,
      words: tapes.reduce(function (total, tape) { return total + Number(tape.wordsAudited || 0); }, 0),
      unhinged: unhinged,
      affection: count(["LOVE LETTER"]),
      hostility: count(["FRANCHISE FELONY", "TAKE GETS NUCLEAR"]),
      chaos: count(["OUT OF POCKET", "BREAKDOWN", "THE ROOM BREAKS", "FULL SEND", "UP IN YA", "BIT ENERGY"]),
      theories: count(["THEORY BOARD", "HORROR BRAIN"]),
      roomBreaks: count(["BREAKDOWN", "THE ROOM BREAKS"]),
      receipts: moments.slice(0, 3),
    };
  }

  function battleResult(left, right) {
    var metrics = [
      ["unhinged", "UNHINGED INDEX"],
      ["affection", "LOVE SURVIVED"],
      ["hostility", "VERBAL BODY COUNT"],
      ["chaos", "CHAOS RECEIPTS"],
      ["theories", "HORROR-BRAIN ACTIVITY"],
      ["roomBreaks", "STRUCTURAL FAILURES"],
    ];
    var leftPoints = 0;
    var rightPoints = 0;
    metrics.forEach(function (metric) {
      if (left[metric[0]] > right[metric[0]]) leftPoints += 1;
      else if (right[metric[0]] > left[metric[0]]) rightPoints += 1;
    });
    return {
      metrics: metrics,
      leftPoints: leftPoints,
      rightPoints: rightPoints,
      winner: leftPoints === rightPoints ? "THE TAPE REFUSES TO PICK A BODY" :
        (leftPoints > rightPoints ? left.label : right.label),
    };
  }

  function battleOptions(selected) {
    return battleEntities().map(function (entity) {
      return '<option value="' + esc(entity.key) + '"' + (entity.key === selected ? " selected" : "") +
        '>[' + esc(entity.lane) + '] ' + esc(entity.label) + '</option>';
    }).join("");
  }

  function renderBattle() {
    var left = battleSummary(state.battleA);
    var right = battleSummary(state.battleB);
    var result = battleResult(left, right);
    var contender = function (summary, side) {
      return '<section class="battle-contender ' + side + '"><div><span>' + esc(summary.lane) +
        '</span><b>' + summary.sources + ' SOURCE' + (summary.sources === 1 ? "" : "S") + ' // ' +
        fmt(summary.words) + ' WORDS</b></div><h3>' + esc(summary.label) + '</h3><select data-battle-side="' +
        side + '" aria-label="Choose ' + side + ' contender">' + battleOptions(summary.key) +
        '</select><div class="battle-receipts"><span>STRONGEST SURVIVING RECEIPTS</span>' +
        summary.receipts.slice(0, 2).map(memoryReceipt).join("") + '</div></section>';
    };
    return '<div class="battle-title"><span>TAKE BATTLE // THE INDEXED ARCHIVE ENTERS THE RING</span><h3>' +
      esc(result.winner) + '</h3><p>An archive scoreboard, not a host-opinion claim. It compares surviving 39-tape receipt signals.</p><button data-copy-battle>STEAL THE SCORECARD →</button></div><div class="battle-ring">' +
      contender(left, "left") + '<div class="battle-score"><span>ARCHIVE EDGE</span><b>' +
      result.leftPoints + '<i>—</i>' + result.rightPoints + '</b><ol>' +
      result.metrics.map(function (metric) {
        var leftValue = left[metric[0]];
        var rightValue = right[metric[0]];
        return '<li><b>' + leftValue + '</b><span>' + metric[1] + '</span><b>' + rightValue + '</b></li>';
      }).join("") + '</ol></div>' + contender(right, "right") + '</div>';
  }

  function copyBattle() {
    var left = battleSummary(state.battleA);
    var right = battleSummary(state.battleB);
    var result = battleResult(left, right);
    var lines = [
      "WWAM TAKE BATTLE",
      left.label + " " + result.leftPoints + " — " + result.rightPoints + " " + right.label,
      "Archive edge: " + result.winner,
    ].concat(result.metrics.map(function (metric) {
      return metric[1] + ": " + left[metric[0]] + " / " + right[metric[0]];
    })).concat(["Source-linked scoreboard: " + location.origin + location.pathname + "#memory"]);
    copy(lines.join("\n"));
  }

  function renderMemory() {
    if (window.WWAMLongitudinalDocketDemo) window.WWAMLongitudinalDocketDemo.destroy();
    if (window.WWAMBitBloodlineHost) window.WWAMBitBloodlineHost.destroy();
    var content = state.memoryTab === "time" ? renderTimeMachine() :
      state.memoryTab === "bits" ? renderBitAncestry() :
      state.memoryTab === "chemistry" ? renderChemistry() :
      state.memoryTab === "court" ? renderCourt() :
      state.memoryTab === "battle" ? renderBattle() :
      state.memoryTab === "score" ? "" : renderDescent();
    var memoryStage = document.getElementById("memoryStage");
    memoryStage.innerHTML = content;
    if (state.memoryTab === "score") {
      if (!window.WWAMLongitudinalDocketDemo || !attempt(function () {
        return window.WWAMLongitudinalDocketDemo.mount(
          memoryStage, channelDNA, state.longitudinalSubject
        );
      }, "longitudinal docket initialization")) {
        memoryStage.innerHTML =
          '<p class="memory-empty">OPENING FOUR BEFORE / AFTER TAPE CASES&hellip;</p>';
      }
    }
    document.getElementById("memoryProof").innerHTML = [
      [showcaseMetric("nodes", 0), "PROMOTED NODES"],
      [showcaseMetric("edges", 0), "SOURCE-BACKED EDGES"],
      [showcaseMetric("timelines", fallbackTimeMachines().length), "TAKE TRAILS TO REVIEW"],
      [showcaseMetric("bits", fallbackBitLineages().length), "BIT LINEAGES"],
    ].map(function (stat) { return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>'; }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-tab]"), function (button) {
      button.classList.toggle("on", button.getAttribute("data-memory-tab") === state.memoryTab);
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-entity]"), function (button) {
      button.onclick = function () {
        state.memoryEntity = button.getAttribute("data-memory-entity");
        renderMemory();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-descent-mode]"), function (button) {
      button.onclick = function () {
        state.descentMode = button.getAttribute("data-descent-mode");
        renderMemory();
      };
    });
    var range = document.getElementById("descentMinutes");
    if (range) range.oninput = function () {
      state.descentMinutes = Number(range.value);
      renderMemory();
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-battle-side]"), function (select) {
      select.onchange = function () {
        if (select.getAttribute("data-battle-side") === "left") state.battleA = select.value;
        else state.battleB = select.value;
        renderMemory();
      };
    });
    var copyBattleButton = document.querySelector("[data-copy-battle]");
    if (copyBattleButton) copyBattleButton.onclick = copyBattle;
    bindMemoryReceipts();
    syncBagButtons();
  }

  function loreReceiptItem(receipt) {
    if (!receipt) return null;
    var kind = receipt.receiptKind || receipt.kind || "lore-receipt";
    var contextOnly = kind === "creator-context";
    var performance = /character-performance|candidate-performance/.test(kind);
    return Object.assign({}, receipt, {
      id: receipt.sourceId,
      sourceId: receipt.sourceId,
      source: receipt.lane === "commentary" ? "commentary" : "livestream",
      at: Number(receipt.t || 0),
      t: Number(receipt.t || 0),
      end: Number(receipt.end || 0),
      title: receipt.sourceTitle || receipt.label || "WWAM SOURCE",
      category: contextOnly ? "CREATOR CONTEXT // NOT PERFORMANCE" :
        receipt.label || kind.toUpperCase(),
      excerpt: receipt.quote || "",
      date: receipt.date,
      evidenceLevel: receipt.evidenceLevel || (contextOnly ? "CONTEXT ONLY" :
        performance ? "curated-candidate" : ""),
      receiptKind: kind,
      type: receipt.type || kind,
      speakerStatus: receipt.speakerStatus || "not-diarized",
      authenticatedEditorVerified: receipt.authenticatedEditorVerified === true,
    });
  }

  function loreEntries() {
    if (!loreEngine) return [];
    var filters = { limit: 24 };
    if (state.loreKind !== "ALL") filters.kind = state.loreKind;
    var entries = state.loreQuery.trim() ?
      loreEngine.search(state.loreQuery, filters) :
      loreEngine.getFieldGuide(filters);
    return entries.filter(function (entry) { return entry.kind !== "candidate-character"; });
  }

  function loreKindLabel(kind) {
    return String(kind || "entry").replace(/-/g, " ").toUpperCase();
  }

  function loreShelfLabel(value) {
    return {
      "FRONT-DOOR LORE": "START HERE",
      "FAN TEST": "FAN FAVORITE",
      "DEEP SHELF": "DEEP CUT",
      "BASEMENT TAPE": "BASEMENT TAPE"
    }[String(value || "").toUpperCase()] || "ON THE SHELF";
  }

  function loreStatusLabel(value) {
    return {
      grounded: "CLIPS READY",
      "recurring-grounded": "RECURRING BIT",
      "single-receipt": "ONE CLIP SO FAR",
      "locked-needs-human-verification": "VOICE NOT CONFIRMED"
    }[String(value || "").toLowerCase()] || "ON THE SHELF";
  }
  function loreMetricLabel(value) {
    return {
      receipts: "MOMENTS",
      sources: "SHOWS",
      wordsAudited: "CAPTION WORDS",
      curatedPerformanceCandidates: "CHARACTER CLIPS",
      creatorContext: "OTHER MENTIONS",
      archiveMentions: "NAME-DROPS",
      categories: "MOMENT TYPES",
      topics: "TOPICS",
      views: "VIEWS",
      duration: "RUNTIME"
    }[value] || String(value || "").replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase();
  }

  function fanLoreText(value) {
    return displayUiText(value || "")
      .replace(/A recurring performance candidate with a timestamp trail to inspect\./gi,
        "A recurring character performance with a trail of clips to play.")
      .replace(/Only curated performance soundbytes are treated as performance evidence; ordinary mentions are excluded\./gi,
        "Only clips built around the character appear here; ordinary name-drops stay out.")
      .replace(/playable archive receipts/gi, "playable show moments")
      .replace(/indexed commentaries/gi, "commentaries on this shelf")
      .replace(/Indexed WWAM source\./gi, "A WWAM show on this shelf.")
      .replace(/Indexed ([^.]*) commentary source for /gi, "$1 commentary for ")
      .replace(/Earliest indexed is not proof of first-ever\./gi,
        "Earliest on this shelf is not proof of first-ever.");
  }

  function renderLoreDossier() {
    var entry = loreEngine && loreEngine.getEntry(state.loreSelected);
    if (!entry) {
      var first = loreEntries()[0];
      if (first) {
        state.loreSelected = first.id;
        entry = first;
      }
    }
    if (!entry) {
      document.getElementById("loreDossier").innerHTML =
        '<div class="lore-empty"><b>NO LORE SURVIVED THAT SEARCH.</b><span>Try a character, franchise, recurring topic, or tape title.</span></div>';
      document.getElementById("constellationMap").innerHTML = "";
      return;
    }
    var trace = loreEngine.trace(entry.id);
    var receipts = (entry.receiptIds || []).map(function (id) {
      return loreEngine.getReceipt(id);
    }).filter(Boolean).slice(0, 5);
    var metricEntries = Object.entries(entry.metrics || {}).slice(0, 5);
    var first = entry.archiveFirst;
    var firstItem = first && loreReceiptItem(loreEngine.getReceipt(first.receiptId));
    document.getElementById("loreDossier").innerHTML =
      '<div class="lore-dossier-top"><div><span>' + esc(entry.kicker || loreKindLabel(entry.kind)) +
      '</span><b>' + esc(loreKindLabel(entry.kind)) + ' // ' + esc(loreStatusLabel(entry.status)) +
      '</b></div><h3>' + esc(entry.name) + '</h3><p>' + esc(fanLoreText(entry.summary)) +
      '</p><blockquote>' + esc(fanLoreText(entry.editorialFlavor || entry.deepCutReason)) + '</blockquote></div>' +
      '<div class="lore-score"><b>' + esc(loreShelfLabel(entry.deepCutTier)) + '</b><span>HOW DEEP?</span><i>FOLLOW THE MOMENTS</i></div>' +
      '<div class="lore-metrics">' + metricEntries.map(function (metric) {
        return '<div><b>' + fmt(metric[1]) + '</b><span>' +
          esc(loreMetricLabel(metric[0])) + '</span></div>';
      }).join("") + '</div>' +
      '<div class="lore-basis"><span>WHY IT&rsquo;S HERE</span><p>' +
      esc(fanLoreText(entry.evidenceBasis || "This profile opens the original WWAM moments behind it.")) + '</p></div>' +
      (first ? '<article class="archive-first"><div><span>' +
        esc(entry.kind === "character" ? "EARLIEST PLAYABLE CHARACTER CLIP ON THIS SHELF" :
          "EARLIEST PLAYABLE MOMENT ON THIS SHELF") +
        '</span><b>' + esc(first.date) + ' // EARLIEST ONE ON THIS SHELF</b></div><h4>' + esc(first.sourceTitle) +
        '</h4><p>“' + esc(displayQuote(first.quote)) + '”</p><div>' +
        evidenceButton(firstItem, "PLAY THE EARLIEST MOMENT") +
        bagButton(firstItem, "BAG IT") + '</div><small>' +
        esc(entry.kind === "character" ?
          "This is the earliest character clip on this shelf, not proof of where the bit truly began." :
          fanLoreText((entry.originLanguage && entry.originLanguage.disclaimer) || "Earliest on this shelf is not proof of first-ever.")) +
        '</small></article>' : "") +
      '<div class="lore-receipts"><div><span>PLAYABLE SHOW MOMENTS</span><b>' +
      (entry.receiptIds || []).length + ' READY TO PLAY</b></div>' +
      receipts.map(function (receipt, index) {
        return memoryReceipt(loreReceiptItem(receipt), index);
      }).join("") + '</div>' +
      '<div class="lore-related"><span>FOLLOW THE THREAD</span>' +
      (trace.nodes || []).filter(function (node) { return node.entryId !== entry.id; }).slice(0, 10).map(function (node) {
        return '<button data-lore-entry="' + esc(node.entryId) + '"><i>' + esc(loreKindLabel(node.kind)) +
          '</i><b>' + esc(node.label) + '</b><span>' + node.receiptCount + ' MOMENTS</span></button>';
      }).join("") + '</div>';
    renderConstellation(entry, trace);
  }

  function renderConstellation(entry, trace) {
    var nodes = (trace.nodes || []).slice(0, 17);
    var edges = trace.edges || [];
    document.getElementById("constellationTitle").textContent = entry.name + " // " +
      edges.length + " CONNECTIONS";
    document.getElementById("constellationCopy").textContent =
      "This focused map shows " + Math.max(0, nodes.length - 1) +
      " connected memories. Each line means these things crossed paths somewhere in WWAM; it never claims a true origin.";
    document.getElementById("constellationMap").innerHTML =
      '<div class="constellation-nodes">' + nodes.map(function (node, index) {
        return '<button class="' + (node.entryId === entry.id ? "center" : "") +
          '" style="--node:' + index + ';--weight:' + Math.min(6, Number(node.receiptCount || 1)) +
          '" data-lore-entry="' + esc(node.entryId) + '"><span>' + esc(loreKindLabel(node.kind)) +
          '</span><b>' + esc(node.label) + '</b><i>' + node.receiptCount + ' MOMENTS</i></button>';
      }).join("") + '</div><ol class="constellation-ledger">' +
      edges.slice(0, 12).map(function (edge) {
        var from = loreEngine.getEntry(edge.from);
        var to = loreEngine.getEntry(edge.to);
        return '<li><span>' + esc(from ? from.name : edge.from) + '</span><b>' +
          esc(String(edge.relation || "connected").replace(/-/g, " ").toUpperCase()) +
          '</b><span>' + esc(to ? to.name : edge.to) + '</span><i>' +
          Number(edge.receiptCount || 0) + ' MOMENT' + (Number(edge.receiptCount || 0) === 1 ? "" : "S") +
          '</i></li>';
      }).join("") + '</ol>';
  }

  function bindLore() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-lore-kind]"), function (button) {
      button.onclick = function () {
        state.loreKind = button.getAttribute("data-lore-kind");
        renderLore();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-lore-entry]"), function (button) {
      button.onclick = function () {
        state.loreSelected = button.getAttribute("data-lore-entry");
        renderLore();
        document.getElementById("loreDossier").scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    bindMemoryReceipts();
    syncBagButtons();
  }

  function renderLore() {
    if (!loreEngine) {
      document.getElementById("loreDossier").innerHTML = '<p class="memory-empty">' +
        (state.fanEnginesSettled ? "THE FIELD GUIDE COULD NOT INITIALIZE." : "CONNECTING THE FIELD GUIDE…") +
        '</p>';
      return;
    }
    var metrics = loreEngine.metrics || {};
    document.getElementById("loreProof").innerHTML = [
      [metrics.fieldGuideEntries, "FIELD GUIDE ENTRIES"],
      [metrics.playableReceipts, "PLAYABLE MOMENT LINKS"],
      [metrics.edges, "CONNECTED THREADS"],
      [metrics.lineages, "RUNNING-BIT TRAILS"],
      [metrics.constellations, "CONSTELLATIONS"],
    ].map(function (stat) {
      return '<div><b>' + fmt(stat[0]) + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
    var kinds = ["ALL", "character", "bit", "motif", "franchise", "topic", "era", "source"];
    document.getElementById("loreKinds").innerHTML = kinds.map(function (kind) {
      var count = kind === "ALL" ? metrics.fieldGuideEntries : ((metrics.kinds || {})[kind] || 0);
      return '<button class="' + (state.loreKind === kind ? "on" : "") + '" data-lore-kind="' +
        esc(kind) + '">' + esc(loreKindLabel(kind)) + '<b>' + count + '</b></button>';
    }).join("");
    var entries = loreEntries();
    document.getElementById("loreResults").innerHTML = entries.length ? entries.map(function (entry) {
      return '<button class="' + (entry.id === state.loreSelected ? "on" : "") + '" data-lore-entry="' +
        esc(entry.id) + '"><div><span>' + esc(loreKindLabel(entry.kind)) + '</span><b>' +
        'OPEN</b></div><h4>' + esc(displayUiText(entry.name)) + '</h4><p>' +
        esc(fanLoreText(entry.editorialFlavor || entry.summary)) + '</p><small>' +
        Number((entry.metrics && entry.metrics.receipts) || (entry.receiptIds || []).length) +
        ' MOMENTS // ' + esc(loreShelfLabel(entry.deepCutTier)) + '</small></button>';
    }).join("") : '<div class="lore-empty"><b>NO MATCHES.</b><span>Nothing on this shelf matches that search.</span></div>';
    renderLoreDossier();
    bindLore();
  }

  function startTrivia(incrementSeed) {
    if (!tapeTriviaEngine) return;
    if (incrementSeed) state.triviaSeed += 1;
    try {
      triviaSession = tapeTriviaEngine.createSession({
        seed: "wwam-night-shift-" + state.triviaSeed,
        length: state.triviaLength,
        difficulty: state.triviaDifficulty,
        franchise: state.triviaFranchise || undefined,
      });
      renderTrivia();
    } catch (error) {
      document.getElementById("triviaStage").innerHTML =
        '<div class="trivia-error"><b>THE TAPE JAMMED.</b><span>' + esc(error.message) + '</span></div>';
    }
  }

  function addTriviaRevealToBag(items) {
    var added = 0;
    (items || []).map(normalizeEvidenceItem).forEach(function (item) {
      if (!state.evidenceBag.some(function (candidate) { return bagKey(candidate) === bagKey(item); })) {
        state.evidenceBag.unshift(item);
        added += 1;
      }
    });
    state.evidenceBag = state.evidenceBag.slice(0, 30);
    var persisted = saveEvidenceBag();
    renderEvidenceBag();
    showToast(added ? added + " TRIVIA RECEIPT" + (added === 1 ? "" : "S") +
      (persisted ? " BAGGED" : " BAGGED // THIS TAB ONLY") :
      "THOSE RECEIPTS ARE ALREADY BAGGED");
  }

  function triviaReveal(result) {
    if (!result || !result.reveal) return "";
    var reveal = result.reveal;
    return '<div class="trivia-reveal ' + (result.correct ? "correct" : "wrong") + '"><div class="reveal-verdict"><span>' +
      (result.correct ? "THE ARCHIVE ACCEPTS YOUR SACRIFICE" : "THE TAPE HAS REJECTED YOU") +
      '</span><h3>' + (result.correct ? "+" + result.points + " POINTS" :
        "CORRECT ANSWER // " + esc(displayUiText(reveal.answer.label))) +
      '</h3><p>' + esc(displayUiText(reveal.explanation)) + '</p></div><div class="reveal-receipts">' +
      reveal.receipts.map(function (receipt, index) { return memoryReceipt(receipt, index); }).join("") +
      '</div><footer><button data-trivia-bag-all>SAVE REVEAL +</button><button data-trivia-next>' +
      (result.roundNumber >= (triviaSession && triviaSession.getState().length || 5) ? "SEE AUTOPSY →" : "NEXT RECEIPT →") +
      '</button></footer><small>' + esc(displayUiText(reveal.accuracy.notice)) +
      ' // NO SPEAKER CLAIM MADE</small></div>';
  }

  function renderTriviaRound(sessionState) {
    var round = sessionState.currentRound;
    var result = sessionState.lastResult;
    var clue = round.clue.cards ?
      '<div class="trivia-clue-pair">' + round.clue.cards.map(function (card) {
        return '<article><span>' + esc(displayUiText(card.label)) + '</span><blockquote>“' +
          esc(displayQuote(card.excerpt)) + '”</blockquote></article>';
      }).join("") + '</div>' :
      '<blockquote class="trivia-clue"><span>' + esc(displayUiText(round.clue.label)) +
      '</span>“' + esc(displayQuote(round.clue.excerpt)) + '”</blockquote>';
    return '<div class="trivia-scorebar"><div><span>ROUND</span><b>' + round.number + '/' +
      round.total + '</b></div><div><span>SCORE</span><b>' + sessionState.score +
      '</b></div><div><span>STREAK</span><b>' + sessionState.streak +
      '</b></div><div><span>DIFFICULTY</span><b>' + esc(round.difficulty.toUpperCase()) +
      '</b></div></div><div class="trivia-question"><span>' + esc(displayUiText(round.typeLabel)) +
      '</span><h3>' + esc(displayUiText(round.prompt)) + '</h3>' + clue + '<div class="trivia-choices">' +
      round.choices.map(function (choice, index) {
        var answerClass = result && result.reveal.answer.id === choice.id ? " answer" : "";
        var selectedClass = result && result.reveal.selected && result.reveal.selected.id === choice.id ? " selected" : "";
        return '<button' + (result ? " disabled" : "") + ' class="' + answerClass + selectedClass +
          '" data-trivia-choice="' + esc(choice.id) + '"><b>' + String.fromCharCode(65 + index) +
          '</b><span>' + esc(displayUiText(choice.label)) + '<i>' +
          esc(displayUiText(choice.detail || "")) + '</i></span></button>';
      }).join("") + '</div><small>' + esc(displayUiText(round.speakerNotice)) + '</small></div>' +
      triviaReveal(result);
  }

  function renderTriviaSummary(summary) {
    return '<div class="trivia-summary"><span>SESSION AUTOPSY</span><h3>' + esc(summary.grade) +
      '</h3><div><article><b>' + summary.score + '</b><span>POINTS</span></article><article><b>' +
      summary.accuracy + '%</b><span>ACCURACY</span></article><article><b>' + summary.correct +
      '/' + summary.total + '</b><span>SURVIVED</span></article><article><b>' + summary.bestStreak +
      '</b><span>BEST STREAK</span></article></div><p>Indexed metadata and bounded captions only—no guessed speakers or quotes.</p><footer><button data-trivia-export>DOWNLOAD SESSION RECEIPTS</button><button data-trivia-restart>PLAY ANOTHER TRIVIA RUN →</button></footer></div>';
  }

  function bindTrivia() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-trivia-choice]"), function (button) {
      button.onclick = function () {
        triviaSession.submit(button.getAttribute("data-trivia-choice"));
        renderTrivia();
      };
    });
    var next = document.querySelector("[data-trivia-next]");
    if (next) next.onclick = function () {
      triviaSession.next();
      renderTrivia();
    };
    var bagAll = document.querySelector("[data-trivia-bag-all]");
    if (bagAll) bagAll.onclick = function () {
      var result = triviaSession.getState().lastResult;
      if (result) addTriviaRevealToBag(result.reveal.evidenceBag);
    };
    var restart = document.querySelector("[data-trivia-restart]");
    if (restart) restart.onclick = function () { startTrivia(true); };
    var exportButton = document.querySelector("[data-trivia-export]");
    if (exportButton) exportButton.onclick = function () {
      downloadJson("wwam-tape-trivia-session.json", triviaSession.exportSession());
      showToast("TRIVIA SESSION RECEIPTS DOWNLOADED");
    };
    bindMemoryReceipts();
    syncBagButtons();
  }

  function renderTrivia() {
    if (!tapeTriviaEngine || !triviaSession) {
      document.getElementById("triviaStage").innerHTML =
        '<div class="trivia-loading"><i></i><b>' +
        (state.fanEnginesSettled ? "THE PLAYABLE ARCHIVE COULD NOT INITIALIZE." : "SHUFFLING THE PLAYABLE ARCHIVE…") +
        '</b></div>';
      return;
    }
    var metrics = tapeTriviaEngine.metrics;
    document.getElementById("triviaProof").innerHTML = [
      [metrics.playableReceipts, "PLAYABLE QUESTIONS"],
      [metrics.eligibleSources, "SOURCES IN THE DECK"],
      [metrics.categories, "ARCHIVE CHARGES"],
      [metrics.exactTimestampReceipts, "EXACT TIMESTAMPS"],
      [metrics.speakerQuestions, "SPEAKER GUESSES"],
    ].map(function (stat) {
      return '<div><b>' + fmt(stat[0]) + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
    var sessionState = triviaSession.getState();
    document.getElementById("triviaStage").innerHTML = sessionState.complete ?
      renderTriviaSummary(sessionState.summary) : renderTriviaRound(sessionState);
    bindTrivia();
  }

  function nightEvidenceCard(receipt, index) {
    return '<article class="night-evidence-card"><header><span>RECEIPT ' +
      String(index + 1).padStart(2, "0") + ' // ' +
      esc(displayUiText(receipt.category || "INDEXED RECEIPT")) +
      '</span><b>' + esc(receipt.timecode) + '</b></header><h4>' +
      esc(displayUiText(receipt.sourceTitle)) + '</h4><blockquote>"' +
      esc(displayQuote(receipt.excerpt)) + '"</blockquote><footer>' +
      evidenceButton(receipt, "OPEN SOURCE CONTEXT") +
      bagButton(receipt, "BAG IT") + '</footer><small>' +
      esc(receipt.evidenceLevel) + ' // SPEAKER NOT DIARIZED // ' +
      receipt.excerptWordCount + '/' + receipt.excerptWordLimit +
      ' PUBLIC WORDS</small></article>';
  }

  function nightInteraction(beat) {
    var interaction = beat.interaction;
    if (!interaction) return "";
    var round = interaction.round || {};
    var choices = interaction.type === "trivia" ? round.choices : interaction.choices;
    var prompt = interaction.type === "trivia" ? round.prompt : interaction.prompt;
    var clue = round.clue || {};
    var clueCopy = clue.excerpt || (clue.cards && clue.cards.map(function (card) {
      return card.excerpt;
    }).join(" // ")) || "";
    return '<div class="night-choice"><div><span>' +
      esc(interaction.type === "trivia" ? "TAPE TRIVIA HANDOFF" : "NO-CORRECT-ANSWER FAN CHOICE") +
      '</span><h4>' + esc(displayUiText(prompt)) + '</h4>' +
      (clueCopy ? '<blockquote>"' + esc(displayQuote(clueCopy)) + '"</blockquote>' : "") +
      '</div><div class="night-choice-grid">' + (choices || []).map(function (choice, index) {
        return '<button data-night-choice="' + esc(choice.id) + '"><b>' +
          String.fromCharCode(65 + index) + '</b><span>' +
          esc(displayUiText(choice.label)) + '<small>' +
          esc(displayUiText(choice.detail || "")) + '</small></span></button>';
      }).join("") + '</div><small>' +
      (interaction.playableReceiptMayRevealAnswer ?
        "HONOR SYSTEM // THE PLAYABLE RECEIPT MAY REVEAL THE ANSWER" :
        "YOUR CHOICE RECORDS A PREFERENCE, NOT AN OBJECTIVE WINNER") +
      ' // NO SPEAKER CLAIM</small></div>';
  }

  function nightRevealCard() {
    var response = state.nightReveal;
    if (!response || response.type === "acknowledged") return "";
    var answer = response.answer && (response.answer.label || response.answer.detail);
    return '<div class="night-reveal ' + (response.correct === false ? "wrong" : "") +
      '"><span>' + (response.type === "trivia" ?
        (response.correct ? "THE TAPE ACCEPTED YOUR ANSWER" : "THE ARCHIVE CAUGHT YOU") :
        "PREFERENCE PINNED FOR THIS SHIFT") + '</span><h4>' +
      esc(answer || response.selected && response.selected.label || "CHOICE RECORDED") +
      '</h4><p>' + esc(response.explanation || "The next beat is unlocked.") +
      '</p><small>REVEAL REMAINS SOURCE-GROUNDED // SPEAKER, ORIGIN, AND SYNTHETIC-QUOTE CLAIMS: 0</small></div>';
  }

  function renderNightShift(focusTarget) {
    var stage = document.getElementById("nightShiftStage");
    if (!stage) return;
    if (!nightShiftEngine || !nightShiftJourney || !nightShiftProgress) {
      stage.innerHTML = '<div class="night-shift-loading"><i></i><b>' +
        (state.fanEnginesSettled ? "THE NIGHT SHIFT COULD NOT INITIALIZE." :
          "BUILDING TONIGHT'S SOURCE-GROUNDED DESCENT...") + '</b></div>';
      return;
    }
    var journey = nightShiftJourney;
    var progress = nightShiftProgress.getState();
    var active = nightShiftProgress.getCurrentBeat();
    var metrics = nightShiftEngine.metrics;
    var completed = new Set(progress.completedBeatIds);
    var route = journey.beats.map(function (beat) {
      var status = completed.has(beat.id) ? "done" :
        active && active.id === beat.id ? "active" : "locked";
      return '<li class="' + status + '"><i>' + String(beat.order).padStart(2, "0") +
        '</i><div><span>' + esc(beat.kicker) + '</span><b>' +
        esc(beat.title) + '</b><small>' +
        esc(beat.roles.join(" + ").replace(/-/g, " ").toUpperCase()) +
        '</small></div><em>' + (status === "done" ? "CLEARED" :
          status === "active" ? "LIVE" : "LOCKED") + '</em></li>';
    }).join("");
    var activeCard = active ?
      '<article class="night-active"><header><div><span>BEAT ' +
      active.order + ' OF ' + journey.beats.length + ' // ' +
      esc(active.kicker) + '</span><h3>' + esc(active.title) +
      '</h3></div><b>' + esc(active.requiredAction.toUpperCase()) +
      '</b></header><p>' + esc(displayUiText(active.copy)) +
      '</p><div class="night-source-line"><span>' +
      esc(active.source.type.toUpperCase() + " // " + active.source.date) +
      '</span><b>' + esc(displayUiText(active.source.title)) +
      '</b></div><div class="night-evidence-grid">' +
      active.evidence.map(nightEvidenceCard).join("") + '</div>' +
      nightInteraction(active) +
      (!active.interaction ? '<button class="night-continue" id="nightContinue">CLEAR THIS BEAT -></button>' : "") +
      '<footer>DERIVED NAVIGATION COPY // EVERY ARCHIVAL EXCERPT IS BOUNDED // ' +
      'NO SPEAKER, TRUE-ORIGIN, OR GENERATED-DIALOGUE CLAIM</footer></article>' :
      '<article class="night-complete"><span>SHIFT COMPLETE // ALL REQUIRED ROLES CLEARED</span>' +
      '<h3>THE ARCHIVE LET YOU OUT.<br>FOR NOW.</h3><p>You crossed ' +
      journey.metrics.uniqueReceipts + ' exact receipts from ' +
      journey.metrics.uniqueSources + ' sources. The same seed will recreate this route against archive ' +
      esc(journey.snapshot.inputFingerprint) + '.</p><div><button id="nightAnother">BUILD ANOTHER CUT</button>' +
      '<a href="#trivia">KEEP GOING WITH TAPE TRIVIA -></a></div></article>';
    stage.innerHTML =
      '<div class="night-shift-top"><div><span>WWAM NIGHT SHIFT // ' +
      esc(journey.status.toUpperCase()) + '</span><h3>' +
      esc(journey.mode.label) + '</h3><p>' + esc(journey.mode.description) +
      '</p></div><div class="night-shift-stats"><div><b>' +
      metrics.indexedSources + '</b><span>INDEXED SOURCES</span></div><div><b>' +
      metrics.playableReceipts + '</b><span>PLAYABLE RECEIPTS</span></div><div><b>' +
      journey.metrics.beats + '</b><span>TONIGHT\'S BEATS</span></div><div><b>0</b><span>SPEAKER GUESSES</span></div></div></div>' +
      '<div class="night-shift-controls"><div class="night-modes">' +
      nightShiftEngine.modes.map(function (mode) {
        return '<button class="' + (mode.id === state.nightMode ? "on" : "") +
          '" data-night-mode="' + esc(mode.id) + '" aria-pressed="' +
          (mode.id === state.nightMode ? "true" : "false") + '"><span>' +
          esc(mode.label) + '</span><b>' + esc(mode.description) + '</b></button>';
      }).join("") + '</div><label><span>SHIFT DATE</span><input id="nightDate" type="date" value="' +
      esc(state.nightDate) + '"></label><div><button id="nightShare">SHARE TONIGHT\'S SEED</button>' +
      '<button id="nightNewCut">NEW DETERMINISTIC CUT</button></div></div>' +
      '<div class="night-snapshot ' + esc(journey.snapshot.status) +
      '"><span>INDEXED THROUGH ' + esc(journey.snapshot.indexedThrough) +
      ' // ' + esc(journey.snapshot.status.toUpperCase()) +
      ' // ARCHIVE ' + esc(journey.snapshot.inputFingerprint) + '</span><b>' +
      esc(journey.snapshot.notice) + '</b></div>' +
      (state.nightNotice ? '<p class="night-notice">' + esc(state.nightNotice) + '</p>' : "") +
      nightRevealCard() +
      '<div class="night-shift-grid"><aside><div><span>ORDERED PROGRESS</span><b>' +
      progress.progress.percent + '%</b></div><div class="night-progress"><i style="width:' +
      progress.progress.percent + '%"></i></div><ol>' + route +
      '</ol></aside><section>' + activeCard + '</section></div>';
    bindNightShift();
    if (focusTarget === "mode") {
      var selectedMode = document.querySelector('[data-night-mode="' + state.nightMode + '"]');
      if (selectedMode) selectedMode.focus();
    } else if (focusTarget === "date") {
      var renderedDate = document.getElementById("nightDate");
      if (renderedDate) renderedDate.focus();
    } else if (focusTarget === "active") {
      var activeHeading = stage.querySelector(".night-active h3, .night-complete h3");
      if (activeHeading) {
        activeHeading.setAttribute("tabindex", "-1");
        activeHeading.focus();
      }
    }
  }

  function bindNightShift() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-night-mode]"), function (button) {
      button.onclick = function () {
        state.nightMode = button.getAttribute("data-night-mode");
        state.nightVariant = "daily";
        state.nightVariantIndex = 0;
        state.nightNotice = "";
        buildNightShift();
        renderNightShift("mode");
      };
    });
    var dateInput = document.getElementById("nightDate");
    if (dateInput) dateInput.onchange = function () {
      state.nightDate = dateInput.value;
      state.nightVariant = "daily";
      state.nightVariantIndex = 0;
      state.nightNotice = "";
      try {
        buildNightShift();
      } catch (error) {
        state.nightNotice = "SHIFT HELD // " + (error.message || String(error));
      }
      renderNightShift("date");
    };
    var share = document.getElementById("nightShare");
    if (share) share.onclick = function () {
      var url = new URL(location.href);
      url.search = "";
      url.searchParams.set("nightShift", nightShiftJourney.seed);
      url.hash = "night-shift";
      copy(url.toString(), "TONIGHT'S DETERMINISTIC SHIFT LINK COPIED");
    };
    function newCut() {
      state.nightVariantIndex += 1;
      state.nightVariant = "daily-cut-" + state.nightVariantIndex;
      state.nightNotice = "NEW CUT // SAME DATE AND MODE, DIFFERENT REPRODUCIBLE VARIANT";
      buildNightShift();
      renderNightShift("active");
    }
    var newCutButton = document.getElementById("nightNewCut");
    if (newCutButton) newCutButton.onclick = newCut;
    var another = document.getElementById("nightAnother");
    if (another) another.onclick = newCut;
    var next = document.getElementById("nightContinue");
    if (next) next.onclick = function () {
      var result = nightShiftProgress.completeCurrent();
      if (result.accepted) {
        state.nightReveal = result.response;
        saveNightProgress();
      } else {
        state.nightNotice = "BEAT HELD // " + result.reason;
      }
      renderNightShift("active");
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-night-choice]"), function (button) {
      button.onclick = function () {
        var result = nightShiftProgress.completeCurrent({
          choiceId: button.getAttribute("data-night-choice"),
        });
        if (result.accepted) {
          state.nightReveal = result.response;
          state.nightNotice = "";
          saveNightProgress();
        } else {
          state.nightNotice = "CHOICE HELD // " + result.reason;
        }
        renderNightShift("active");
      };
    });
    bindMemoryReceipts();
    syncBagButtons();
  }

  function fallbackAftermath() {
    var stream = live.streams[0] || {};
    return {
      title: "THE AFTERMATH // " + (stream.date ? shortDate(stream.date) : "LATEST STREAM"),
      sourceId: stream.id,
      summary: stream.summary || "The newest livestream is waiting for its source-backed aftermath report.",
      topics: (stream.topics || []).slice(0, 5),
      moments: (stream.moments || []).slice(0, 4),
      changes: (stream.topics || []).slice(0, 3).map(function (topic) { return topic.name + " re-entered the live memory graph"; }),
    };
  }

  function fallbackControlRoom() {
    var stream = live.streams[0] || {};
    return {
      approvals: (stream.moments || []).slice(0, 4).map(function (moment) {
        return { label: moment.category + " at " + timestamp(moment.t), confidence: moment.heat, sourceId: stream.id, at: moment.t };
      }),
      opportunities: (stream.topics || []).slice(0, 4).map(function (topic) {
        return { label: topic.name + " current-topic supercut", reason: topic.mentions + " mentions in the latest stream", sourceId: stream.id, at: topic.peak };
      }),
      resurfaced: (stream.topics || []).slice(0, 3).map(function (topic) {
        return { label: topic.name, reason: "Current live discussion can route viewers into the older archive", sourceId: stream.id, at: topic.peak };
      }),
    };
  }

  function renderControlRoom() {
    var aftermath = showcaseCall("getAftermath", fallbackAftermath);
    if (Array.isArray(aftermath)) aftermath = aftermath[0] || fallbackAftermath();
    var sourceId = aftermath.sourceId || aftermath.id || (live.streams[0] && live.streams[0].id);
    var aftermathTopics = aftermath.topics || aftermath.dominantTopics || [];
    var aftermathChanges = aftermath.changes || aftermath.deltas || aftermath.newSincePreviousIndexedStream || [];
    document.getElementById("aftermath").innerHTML =
      '<div class="aftermath-title"><span>THE LIVE AFTERMATH REPORT</span><h3>' +
      esc(aftermath.title || "WHAT THE NEWEST SHOW ADDED TO INDEXED MEMORY") + '</h3><p>' +
      esc(aftermath.summary || "") + '</p>' + (sourceId ? evidenceButton({
        source: "livestream", sourceId: sourceId, at: aftermath.at || 0,
      }, "OPEN THE LATEST LIVE MAP") : "") + '</div><div class="aftermath-columns"><section><span>TOPICS THAT ENTERED THE ROOM</span>' +
      aftermathTopics.slice(0, 5).map(function (topic) {
        return '<b>' + esc(topic.name || topic.label || topic) + '</b>';
      }).join("") + '</section><section><span>WHAT CHANGED IN MEMORY</span>' +
      aftermathChanges.slice(0, 5).map(function (change) {
        return '<b>' + esc(change.label || change) + '</b>';
      }).join("") + '</section></div>';
    var control = showcaseCall("getControlRoom", fallbackControlRoom);
    var groups;
    if (control.queue && Array.isArray(control.queue)) {
      var sourceHealth = control.queue.filter(function (item) { return item.lane === "SOURCE HEALTH"; });
      var editorial = control.queue.filter(function (item) { return item.lane !== "SOURCE HEALTH" && item.lane !== "CONTENT STUDIO"; });
      var opportunities = control.queue.filter(function (item) { return item.lane === "CONTENT STUDIO"; });
      groups = [
        ["SOURCE HEALTH", sourceHealth],
        ["EDITORIAL APPROVAL QUEUE", editorial],
        ["CONTENT OPPORTUNITIES", opportunities],
      ];
    } else {
      groups = [
        ["EDITORIAL APPROVAL QUEUE", control.approvals || control.reviewQueue || []],
        ["CONTENT OPPORTUNITIES", control.opportunities || control.contentOpportunities || []],
        ["ARCHIVE RESURFACED", control.resurfaced || control.archiveResurfaced || []],
      ];
    }
    document.getElementById("controlGrid").innerHTML = groups.map(function (group) {
      return '<section><header><i></i><span>' + group[0] + '</span><b>' + group[1].length + ' OPEN</b></header>' +
        group[1].slice(0, 5).map(function (item) {
          return '<article><div><h4>' + esc(item.label || item.title || item.action || "SOURCE CANDIDATE") + '</h4><p>' +
            esc(item.reason || item.description || (item.confidence ? item.confidence + "% MACHINE CONFIDENCE" : "HUMAN REVIEW REQUIRED")) +
            '</p></div>' + ((item.sourceId || item.id) ? evidenceButton({
              source: item.source || "livestream", sourceId: item.sourceId || item.id, at: item.at || item.t || 0,
            }, "REVIEW") : '<button>REVIEW →</button>') + '</article>';
        }).join("") + '</section>';
    }).join("");
    bindMemoryReceipts();
  }

  function clipCandidates() {
    if (!clipLabEngine) return [];
    var sourceLocked = Boolean(state.clipSourceId);
    var filters = { limit: sourceLocked ? 2000 : 12 };
    if (state.clipQuery.trim()) filters.query = state.clipQuery.trim();
    if (state.clipRisk) filters.maxRisk = state.clipRisk;
    if (state.clipMode === "cold-open") {
      filters.duration = state.coldOpenDuration;
      filters.limit = sourceLocked ? 2000 : 24;
      var boards = coldOpenFactory ? coldOpenFactory.getStoryboards(filters) : [];
      if (sourceLocked) {
        boards = boards.filter(function (board) {
          return (board.sourceIds || []).indexOf(state.clipSourceId) >= 0;
        });
      }
      var query = state.clipQuery.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (query) {
        boards = boards.slice().sort(function (a, b) {
          var score = function (board) {
            var anchor = String(board.anchor && board.anchor.label || "")
              .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
            var title = String(board.title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
            return anchor === query ? 4 :
              anchor && (anchor.indexOf(query) >= 0 || query.indexOf(anchor) >= 0) ? 3 :
                title.indexOf(query) >= 0 ? 2 : 1;
          };
          return score(b) - score(a) || Number(b.editorialPriority || 0) -
            Number(a.editorialPriority || 0);
        });
      }
      return boards.slice(0, sourceLocked ? 60 : 8);
    }
    var values = state.clipMode === "supercuts" ? clipLabEngine.getSupercuts(filters) :
      state.clipMode === "resurfacing" ? clipLabEngine.getResurfacing(filters) :
        clipLabEngine.getShorts(filters);
    if (sourceLocked) {
      values = values.filter(function (item) {
        if (item.kind === "short-candidate") return item.sourceId === state.clipSourceId;
        if (item.kind === "supercut-bundle") {
          return (item.segments || []).some(function (segment) {
            return segment.sourceId === state.clipSourceId;
          });
        }
        return item.archive && item.archive.sourceId === state.clipSourceId ||
          item.current && item.current.sourceId === state.clipSourceId;
      });
    }
    return values.slice(0, sourceLocked ? 60 : 12);
  }

  function clipSourceLockMarkup() {
    if (!state.clipSourceId) return "";
    var source = showcaseSourceById[state.clipSourceId] || streamById[state.clipSourceId] || {};
    return '<aside class="clip-source-lock"><div><span>EXACT-SOURCE LOCK // AFTERMATH HANDOFF</span><b>' +
      esc(source.title || state.clipSourceId) + '</b><small>' + esc(state.clipSourceId) +
      ' // RESULTS BELOW MUST INCLUDE THIS UPLOAD</small></div><button type="button" data-clip-source-clear>RETURN TO ARCHIVE-WIDE CLIP LAB</button></aside>';
  }

  function clipReceiptItem(candidate) {
    return {
      source: candidate.sourceType === "commentary" ? "commentary" : "livestream",
      sourceId: candidate.sourceId,
      id: candidate.sourceId,
      at: Number(candidate.receiptAt || 0),
      t: Number(candidate.receiptAt || 0),
      title: candidate.sourceTitle,
      category: candidate.category || "CLIP LAB",
      excerpt: candidate.archivalExcerpt || "",
      date: candidate.sourceDate,
    };
  }

  function clipBadges(item) {
    return '<div class="clip-badges"><span class="risk-' + esc(String(item.risk && item.risk.label || "REVIEW").toLowerCase()) +
      '">' + esc((item.risk && item.risk.label) || "REVIEW") + ' RISK</span><span>' +
      esc((item.evidence && item.evidence.label) || "MACHINE") + ' EVIDENCE</span></div>';
  }

  function shortCard(candidate) {
    var title = candidate.editorial && candidate.editorial.titleOptions && candidate.editorial.titleOptions[0] ||
      candidate.sourceTitle;
    var hook = candidate.editorial && candidate.editorial.hookOptions && candidate.editorial.hookOptions[0] || "";
    var selected = state.campaignIds.indexOf(candidate.id) >= 0;
    return '<article class="clip-card short-card"><header><div><span>SHORTS CANDIDATE // PRIORITY ' +
      Number(candidate.editPriority || 0) + '</span><b>' + esc(candidate.timecode || timestamp(candidate.receiptAt)) +
      '</b></div><p class="clip-provenance">' + esc(candidate.sourceTitle) + ' // ' +
      shortDate(candidate.sourceDate) + '</p>' + clipBadges(candidate) +
      '</header><div class="suggested-copy"><span>SUGGESTED COPY — NOT ARCHIVAL</span><h3>' +
      esc(title) + '</h3><p>' + esc(hook) + '</p></div><blockquote><span>ARCHIVAL CAPTION EXCERPT</span>“' +
      esc(displayQuote(candidate.archivalExcerpt)) + '”</blockquote><div class="edit-window"><span>PROPOSED EDIT WINDOW</span><b>' +
      esc(candidate.editWindow.inTimecode) + ' → ' + esc(candidate.editWindow.outTimecode) + '</b><i>' +
      Number(candidate.editWindow.seconds || 0) + ' SEC // CONTEXT REVIEW REQUIRED</i></div><footer>' +
      '<button data-clip-play="' + esc(candidate.id) + '">PLAY SOURCE →</button>' +
      '<button class="' + (selected ? "selected" : "") + '" data-campaign-toggle="' + esc(candidate.id) + '">' +
      (selected ? "IN CAMPAIGN ✓" : "ADD TO CAMPAIGN +") + '</button>' +
      bagButton(clipReceiptItem(candidate), "BAG RECEIPT") + '</footer><small>' +
      esc(candidate.approval && candidate.approval.status || "HUMAN EDIT REVIEW REQUIRED") +
      ' // SPEAKER: ' + esc(candidate.speaker && candidate.speaker.status || "NOT DIARIZED") + '</small></article>';
  }

  function supercutCard(bundle) {
    var selected = state.campaignIds.indexOf(bundle.id) >= 0;
    return '<article class="clip-card package-card"><header><div><span>SUPERCUT SPINE // PRIORITY ' +
      Number(bundle.editPriority || 0) + '</span><b>' + Number(bundle.segmentCount || 0) + ' SEGMENTS</b></div>' +
      clipBadges(bundle) + '</header><div class="suggested-copy"><span>' +
      esc(bundle.editorialLabel || "SUGGESTED COPY — NOT ARCHIVAL") + '</span><h3>' +
      esc(bundle.title) + '</h3><p>' + esc(bundle.hook || "") + '</p></div><div class="package-stats"><div><b>' +
      Number(bundle.sourceCount || 0) + '</b><span>ORIGINAL SOURCES</span></div><div><b>' +
      duration(bundle.suggestedSeconds || 0) + '</b><span>SUGGESTED RUNTIME</span></div><div><b>' +
      Number(bundle.segmentCount || 0) + '</b><span>PLAYABLE RECEIPTS</span></div></div><ol>' +
      (bundle.segments || []).slice(0, 5).map(function (segment, index) {
        return '<li><b>' + String(index + 1).padStart(2, "0") + '</b><span>' +
          esc(segment.sourceTitle) + '<i>' + esc(segment.timecode) + ' // ' +
          esc(segment.category) + '</i></span><button data-clip-play="' + esc(segment.id) + '">PLAY</button></li>';
      }).join("") + '</ol><footer><button class="' + (selected ? "selected" : "") +
      '" data-campaign-toggle="' + esc(bundle.id) + '">' +
      (selected ? "IN CAMPAIGN ✓" : "ADD SUPERCUT +") + '</button></footer><small>' +
      esc(bundle.editNote || "Every transition remains a human edit decision.") + '</small></article>';
  }

  function resurfacingCard(pair) {
    var selected = state.campaignIds.indexOf(pair.id) >= 0;
    var side = function (candidate, label) {
      return '<section><span>' + label + ' // ' + shortDate(candidate.sourceDate) + '</span><h4>' +
        esc(candidate.sourceTitle) + '</h4><blockquote>“' + esc(displayQuote(candidate.archivalExcerpt)) +
        '”</blockquote><button data-clip-play="' + esc(candidate.id) + '">PLAY ' +
        esc(candidate.timecode) + ' →</button></section>';
    };
    return '<article class="clip-card resurface-card"><header><div><span>ARCHIVE RESURFACING // SCORE ' +
      Number(pair.resurfaceScore || 0) + '</span><b>' + fmt(pair.spanDays || 0) + ' DAYS APART</b></div>' +
      clipBadges(pair) + '</header><div class="suggested-copy"><span>' +
      esc(pair.editorialLabel || "SUGGESTED COPY — NOT ARCHIVAL") + '</span><h3>' + esc(pair.title) +
      '</h3><p>' + esc(pair.hook || "") + '</p></div><div class="then-now">' +
      side(pair.archive, "THEN") + '<i>↔</i>' + side(pair.current, "NOW") +
      '</div><footer><button class="' + (selected ? "selected" : "") +
      '" data-campaign-toggle="' + esc(pair.id) + '">' +
      (selected ? "IN CAMPAIGN ✓" : "ADD THEN / NOW +") + '</button></footer><small>' +
      esc(pair.claimBoundary || "") + '</small></article>';
  }

  function coldOpenFormatBar() {
    return '<div class="cold-open-format-bar"><div><span>EXACT RUNTIME</span><b>CHOOSE THE SHAPE BEFORE THE TAPE</b></div>' +
      '<nav aria-label="Cold open runtime">' + [15, 30, 60, 90].map(function (seconds) {
        return '<button class="' + (state.coldOpenDuration === seconds ? "on" : "") +
          '" data-cold-duration="' + seconds + '">' + seconds + ' SEC</button>';
      }).join("") + '</nav><p>Every board is a deterministic edit plan with a gapless timeline, exact receipt ledger, no guessed speaker, and no copied media.</p></div>';
  }

  function coldOpenCard(board) {
    return '<article class="clip-card cold-open-card"><header><div><span>COLD OPEN FACTORY // PRIORITY ' +
      Number(board.editorialPriority || 0) + '</span><b>' + Number(board.formatSeconds || 0) +
      ' SEC EXACT</b></div><p class="clip-provenance">' + esc(displayUiText(board.mode)) + ' // ' +
      esc(displayUiText(board.anchor && board.anchor.label || "ARCHIVE ANCHOR")) + '</p>' +
      clipBadges(board) + '</header><div class="suggested-copy"><span>' +
      esc(displayUiText(board.copyLabel || "SUGGESTED EDITORIAL COPY — NOT ARCHIVAL")) +
      '</span><h3>' + esc(displayUiText(board.title)) + '</h3><p>' +
      esc(displayUiText(board.premise)) + '</p></div><div class="package-stats"><div><b>' +
      Number(board.sourceCount || 0) + '</b><span>OFFICIAL SOURCES</span></div><div><b>' +
      Number(board.sourceClipCount || 0) + '</b><span>TIMESTAMPED CUTS</span></div><div><b>' +
      Number(board.formatSeconds || 0) + 's</b><span>GAPLESS RUNTIME</span></div></div>' +
      '<ol class="cold-open-timeline">' + (board.slots || []).map(function (slot, index) {
        var timeline = timestamp(slot.timelineIn || 0) + '–' + timestamp(slot.timelineOut || 0);
        if (slot.kind === "editorial-card") {
          return '<li class="editorial"><b>' + esc(timeline) + '</b><div><span>' +
            esc(displayUiText(slot.role)) + ' // EDITORIAL CARD</span><h4>' +
            esc(displayUiText(slot.copy)) + '</h4><small>' +
            esc(displayUiText(slot.copyLabel || "NOT AN ARCHIVAL QUOTE")) +
            ' // GENERATED VOICEOVER BLOCKED</small></div></li>';
        }
        return '<li><b>' + esc(timeline) + '</b><div><span>' +
          esc(displayUiText(slot.role)) + ' // SOURCE CLIP // ' +
          esc(displayUiText(slot.receiptTimecode)) + '</span><h4>' +
          esc(displayUiText(slot.sourceTitle)) + '</h4><p>“' +
          esc(displayQuote(slot.archivalExcerpt)) + '”</p><small>' +
          esc(displayUiText(slot.excerptLabel || "ARCHIVAL CAPTION EXCERPT")) +
          ' // SPEAKER NOT ASSIGNED</small></div><button data-cold-play="' +
          esc(board.id) + '" data-cold-slot="' + index + '">PLAY RECEIPT →</button></li>';
      }).join("") + '</ol><footer><button data-cold-copy="' + esc(board.id) +
      '">COPY EDIT DECISION LIST</button><button data-cold-download="' + esc(board.id) +
      '">DOWNLOAD STORYBOARD JSON</button></footer><small>' +
      esc(displayUiText(board.pacing && board.pacing.note || "Pacing is an edit proposal, not a performance prediction.")) +
      ' // CONTEXT REVIEW AND CREATOR APPROVAL REQUIRED</small></article>';
  }

  function coldOpenPacket(board) {
    if (!coldOpenFactory || !board) return null;
    return coldOpenFactory.createCampaignMetadata([board], {
      name: "WWAM After Midnight — " + board.formatSeconds + "-second cold open",
    });
  }

  function campaignSelection() {
    if (!clipLabEngine) return [];
    var lookup = function (id) {
      var snapshot = campaignSnapshots[id];
      if (snapshot && clipLabEngine.restoreSelection) {
        var restored = attempt(function () { return clipLabEngine.restoreSelection(snapshot); });
        if (!restored) return null;
        clipItemById[id] = restored;
        return restored;
      }
      var exact = clipItemById[id] || clipLabEngine.get(id);
      if (exact && clipLabEngine.snapshotSelection) {
        var upgraded = attempt(function () { return clipLabEngine.snapshotSelection(exact); });
        if (upgraded) campaignSnapshots[id] = upgraded;
      }
      return exact;
    };
    var retained = {};
    state.campaignIds = state.campaignIds.filter(function (id) {
      var keep = Boolean(lookup(id));
      if (keep) retained[id] = true;
      return keep;
    });
    Object.keys(campaignSnapshots).forEach(function (id) {
      if (!retained[id]) delete campaignSnapshots[id];
    });
    return state.campaignIds.map(function (id) {
      var item = lookup(id);
      return item ? Object.assign({}, item, { _campaignId: id }) : null;
    }).filter(Boolean);
  }

  function campaignManifest() {
    var selection = campaignSelection();
    return clipLabEngine.createClipManifest(selection, {
      campaignId: "wwam-user-packet",
      name: "WWAM After Midnight — user-built evidence drop",
    });
  }

  function renderCampaign() {
    var beforeNormalization = state.campaignIds.join("|") + "//" +
      Object.keys(campaignSnapshots).sort().join("|");
    var selection = campaignSelection();
    var afterNormalization = state.campaignIds.join("|") + "//" +
      Object.keys(campaignSnapshots).sort().join("|");
    document.getElementById("campaignCount").textContent = selection.length + " ASSET" +
      (selection.length === 1 ? "" : "S");
    document.getElementById("campaignList").innerHTML = selection.length ? selection.map(function (item, index) {
      var title = item.kind === "short-candidate" ?
        (item.editorial.titleOptions[0] || item.sourceTitle) : item.title;
      var receipts = item.receiptIds ? item.receiptIds.length : 1;
      return '<article><b>' + String(index + 1).padStart(2, "0") + '</b><div><span>' +
        esc(String(item.kind).replace(/-/g, " ").toUpperCase()) + '</span><h4>' + esc(title) +
        '</h4><small>' + receipts + ' RECEIPT' + (receipts === 1 ? "" : "S") +
        '</small></div><button data-campaign-remove="' + esc(item._campaignId || item.id) + '" aria-label="Remove from campaign">×</button></article>';
    }).join("") : '<div class="campaign-empty">ADD CLIPS OR PACKAGES FROM THE EDIT QUEUE. THE MANIFEST WILL KEEP EVERY SOURCE BOUNDARY.</div>';
    if (beforeNormalization !== afterNormalization && !saveCampaignIds()) {
      showToast("CAMPAIGN CLEANUP KEPT FOR THIS TAB ONLY");
    }
  }

  function toggleCampaign(id) {
    var index = state.campaignIds.indexOf(id);
    if (index >= 0) {
      state.campaignIds.splice(index, 1);
      delete campaignSnapshots[id];
    } else if (state.campaignIds.length >= 24) {
      showToast("CAMPAIGN FULL // 24 ASSET LIMIT");
      return;
    } else {
      var item = clipItemById[id] || clipLabEngine.get(id);
      var snapshot = item && clipLabEngine.snapshotSelection ?
        attempt(function () { return clipLabEngine.snapshotSelection(item); }) : null;
      if (!snapshot) {
        showToast("CAMPAIGN RECEIPT LEDGER COULD NOT BE SAVED");
        return;
      }
      campaignSnapshots[id] = snapshot;
      state.campaignIds.push(id);
    }
    var persisted = saveCampaignIds();
    renderClipLab();
    showToast((index >= 0 ? "REMOVED FROM THE CAMPAIGN" : "ADDED TO THE CAMPAIGN") +
      (persisted ? "" : " // THIS TAB ONLY"));
  }

  function bindClipLab() {
    var clearSourceLock = document.querySelector("[data-clip-source-clear]");
    if (clearSourceLock) clearSourceLock.onclick = function () {
      state.clipSourceId = "";
      renderClipLab();
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-clip-mode]"), function (button) {
      button.onclick = function () {
        state.clipMode = button.getAttribute("data-clip-mode");
        renderClipLab();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-clip-play]"), function (button) {
      button.onclick = function () {
        var candidate = clipItemById[button.getAttribute("data-clip-play")] ||
          clipLabEngine.get(button.getAttribute("data-clip-play"));
        if (!candidate) return;
        if (candidate.kind === "short-candidate") {
          openLooseSource(candidate.sourceId, candidate.editWindow.in, candidate.sourceTitle, candidate.editWindow.out);
        }
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-campaign-toggle]"), function (button) {
      button.onclick = function () { toggleCampaign(button.getAttribute("data-campaign-toggle")); };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-campaign-remove]"), function (button) {
      button.onclick = function () { toggleCampaign(button.getAttribute("data-campaign-remove")); };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cold-duration]"), function (button) {
      button.onclick = function () {
        state.coldOpenDuration = Number(button.getAttribute("data-cold-duration") || 30);
        renderClipLab();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cold-play]"), function (button) {
      button.onclick = function () {
        var board = coldOpenFactory && coldOpenFactory.get(button.getAttribute("data-cold-play"));
        var slot = board && board.slots[Number(button.getAttribute("data-cold-slot"))];
        if (!slot || slot.kind !== "source-clip") return;
        openLooseSource(
          slot.sourceId,
          slot.proposedSourceWindow.in,
          slot.sourceTitle,
          slot.proposedSourceWindow.out
        );
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cold-copy]"), function (button) {
      button.onclick = function () {
        var board = coldOpenFactory && coldOpenFactory.get(button.getAttribute("data-cold-copy"));
        var packet = coldOpenPacket(board);
        if (!packet) return;
        copy(coldOpenFactory.exportCampaignMetadata(packet, 2), "COLD OPEN EDL COPIED");
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-cold-download]"), function (button) {
      button.onclick = function () {
        var board = coldOpenFactory && coldOpenFactory.get(button.getAttribute("data-cold-download"));
        var packet = coldOpenPacket(board);
        if (!packet) return;
        downloadJson(
          "wwam-cold-open-" + board.formatSeconds + "s-" + board.id.split(":").pop() + ".json",
          packet
        );
        showToast("COLD OPEN STORYBOARD DOWNLOADED");
      };
    });
    syncBagButtons();
  }

  function renderClipLab() {
    if (!clipLabEngine) {
      document.getElementById("clipResults").innerHTML = '<p class="memory-empty">' +
        (state.creatorEnginesSettled ? "THE EDIT QUEUE COULD NOT INITIALIZE." : "INDEXING THE EDIT QUEUE…") +
        '</p>';
      return;
    }
    var metrics = clipLabEngine.metrics || {};
    var coldMetrics = coldOpenFactory && coldOpenFactory.metrics || {};
    var exactSourceId = state.clipSourceId;
    var exactShorts = exactSourceId ? (clipLabEngine.shorts || []).filter(function (item) {
      return item.sourceId === exactSourceId;
    }).length : metrics.shortCandidates;
    var exactSupercuts = exactSourceId ? (clipLabEngine.supercuts || []).filter(function (item) {
      return (item.sourceIds || []).indexOf(exactSourceId) >= 0 || (item.segments || []).some(function (segment) {
        return segment.sourceId === exactSourceId;
      });
    }).length : metrics.supercutBundles;
    var exactResurfacing = exactSourceId ? (clipLabEngine.resurfacing || []).filter(function (item) {
      return (item.sourceIds || []).indexOf(exactSourceId) >= 0 ||
        item.archive && item.archive.sourceId === exactSourceId ||
        item.current && item.current.sourceId === exactSourceId;
    }).length : metrics.resurfacingOpportunities;
    var exactBoards = exactSourceId ? (coldOpenFactory && coldOpenFactory.storyboards || []).filter(function (item) {
      return (item.sourceIds || []).indexOf(exactSourceId) >= 0;
    }).length : coldMetrics.storyboards || 0;
    var sourceProofLabel = exactSourceId ? "SOURCE-LOCKED " : "";
    var representedSources = exactSourceId ?
      (exactShorts + exactSupercuts + exactResurfacing + exactBoards > 0 ? 1 : 0) :
      metrics.sourcesRepresented;
    document.getElementById("clipProof").innerHTML = [
      [exactShorts, sourceProofLabel + "SHORTS"],
      [exactSupercuts, sourceProofLabel + "SUPERCUT SPINES"],
      [exactResurfacing, sourceProofLabel + "THEN / NOW PAIRS"],
      [exactBoards, sourceProofLabel + "COLD OPEN BOARDS"],
      [representedSources, sourceProofLabel + "SOURCES REPRESENTED"],
    ].map(function (stat) {
      return '<div><b>' + fmt(stat[0]) + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-clip-mode]"), function (button) {
      var buttonMode = button.getAttribute("data-clip-mode");
      if (buttonMode === "shorts") {
        button.textContent = exactSourceId ? "THIS SHOW'S " + exactShorts : "TONIGHT'S 12";
      }
      var on = buttonMode === state.clipMode;
      button.classList.toggle("on", on);
      button.setAttribute("aria-pressed", on);
    });
    var values = clipCandidates();
    var shortsShelfLabel = state.clipSourceId ?
      "THIS SHOW'S " + values.length + " // SOURCE-LOCKED SHORTS" :
      "TONIGHT'S 12 // MACHINE SHORTLIST";
    var shortsShelfDescription = state.clipSourceId ?
      "Every receipt-backed Short candidate currently tied to this exact upload and the active risk gate. " :
      "The twelve highest-priority receipt-backed candidates under the current search and risk gate. ";
    var lockedModeLabel = {
      shorts: "SHORT",
      supercuts: "SUPERCUT",
      resurfacing: "THEN / NOW",
      "cold-open": "COLD-OPEN"
    }[state.clipMode] || "CLIP";
    var clipEmptyHeading = state.clipMode === "cold-open" && !coldOpenFactory ?
      "THE COLD OPEN FACTORY COULD NOT INITIALIZE." : state.clipSourceId ?
        "NO " + lockedModeLabel + " OPPORTUNITIES ARE REGISTERED FOR THIS SOURCE." :
        "THE RISK GATE ATE THAT SEARCH.";
    var clipEmptyDetail = state.clipSourceId ?
      "This is a real zero. Switch modes or return to the archive-wide Clip Lab." :
      "Widen the filter or search a broader topic.";
    values.forEach(function (item) {
      clipItemById[item.id] = item;
      (item.segments || []).forEach(function (segment) { clipItemById[segment.id] = segment; });
      if (item.archive) clipItemById[item.archive.id] = item.archive;
      if (item.current) clipItemById[item.current.id] = item.current;
    });
    document.getElementById("clipResults").innerHTML =
      clipSourceLockMarkup() +
      (state.clipMode === "cold-open" ? coldOpenFormatBar() : "") +
      (state.clipMode === "shorts"
        ? '<div class="clip-shortlist-bar"><div><span>' + esc(shortsShelfLabel) + '</span>' +
          '<b>THE FIRST EDITORIAL PASS, NOT A PUBLISH QUEUE.</b></div><p>' +
          esc(shortsShelfDescription) + 'Every hook is proposed copy; context, speaker, rights, and ' +
          'the final cut still require a human.</p></div>'
        : "") +
      (values.length ? values.map(function (item) {
        if (item.kind === "cold-open-storyboard") return coldOpenCard(item);
        if (item.kind === "supercut-bundle") return supercutCard(item);
        if (item.kind === "episode-resurfacing") return resurfacingCard(item);
        return shortCard(item);
      }).join("") : '<div class="clip-empty"><b>' + esc(clipEmptyHeading) +
        '</b><span>' + esc(clipEmptyDetail) + '</span></div>');
    renderCampaign();
    bindClipLab();
  }

  function canonEvidenceButton(receipt, label) {
    if (!receipt || !receipt.sourceId) return "";
    return evidenceButton({
      source: itemById[receipt.sourceId] ? "commentary" : "livestream",
      sourceId: receipt.sourceId,
      at: receipt.t || 0,
    }, label || "OPEN EVIDENCE");
  }

  function renderSourceHealth() {
    var sources = trustEngine.sourceHealth.slice().sort(function (a, b) {
      return (a.status === "LIMITED" ? -1 : 1) - (b.status === "LIMITED" ? -1 : 1) ||
        b.score - a.score;
    });
    var freshness = archiveFreshness();
    var limited = sources.filter(function (source) { return source.status !== "HEALTHY"; });
    var healthy = sources.filter(function (source) { return source.status === "HEALTHY"; }).slice(0, 9);
    var card = function (source) {
      return '<article class="source-health-card ' + String(source.status).toLowerCase() +
        '"><header><span>' + esc(source.lane.toUpperCase()) + '</span><b>' + esc(source.status) +
        ' // ' + source.score + '</b></header><h3>' + esc(source.title) + '</h3><div class="health-meter"><i style="width:' +
        Math.max(2, Number(source.score || 0)) + '%"></i></div><ul><li><span>CAPTIONS</span><b>' +
        (source.captioned ? "AVAILABLE" : "UNAVAILABLE") + '</b></li><li><span>RECEIPTS</span><b>' +
        fmt(source.receiptCoverage.total) + '</b></li><li><span>TIMESTAMPS</span><b>' +
        (source.receiptCoverage.invalidTimestamps ? "REVIEW" : "VALID") + '</b></li></ul>' +
        (source.issues.length ? '<p>' + esc(source.issues.join(" // ")) + '</p>' :
          '<p>Source-linked and searchable. Auto-captions still do not prove speaker, target, or intent.</p>') +
        '<footer><button data-canon-source="' + esc(source.id) + '" data-canon-lane="' +
        esc(source.lane) + '">OPEN SOURCE →</button></footer></article>';
    };
    return '<div class="canon-lane-head"><div><span>STRUCTURAL SOURCE AUDIT</span><h3>' +
      trustEngine.metrics.healthySources + ' OF ' + trustEngine.metrics.sources +
      ' SOURCES ARE ARCHIVE-READY.</h3></div><div class="freshness-summary"><p>Bad or source-mismatched URLs: 0. Invalid times: 0. Limited sources stay visible, never counterfeit.</p>' +
      '<dl class="freshness-ledger ' + esc(freshness.status.toLowerCase().replace(/\s+/g, "-")) +
      '"><div><dt>INDEX SNAPSHOT</dt><dd>' + esc(shortDate(freshness.snapshotDate)) +
      '</dd></div><div><dt>NEWEST SOURCE</dt><dd>' + esc(shortDate(freshness.latestSourceDate)) +
      '</dd></div><div><dt>FRESHNESS</dt><dd>' + esc(freshness.status) +
      (freshness.ageDays == null ? "" : freshness.ageDays === 0 ? " // TODAY" :
        " // " + freshness.ageDays + " DAY" + (freshness.ageDays === 1 ? "" : "S")) +
      '</dd></div></dl></div></div>' +
      '<section class="health-group"><header><span>LIMITED SOURCES // HONEST GAPS</span><b>' +
      limited.length + '</b></header><div>' + limited.map(card).join("") + '</div></section>' +
      '<section class="health-group"><header><span>HEALTHY SOURCE SAMPLE</span><b>' +
      trustEngine.metrics.healthySources + ' TOTAL</b></header><div>' + healthy.map(card).join("") + '</div></section>';
  }

  function renderReviewQueue() {
    var queue = trustEngine.getReviewQueue({ limit: 16 });
    return '<div class="canon-lane-head"><div><span>THE MACHINE MAY SURFACE // ONLY A HUMAN MAY CERTIFY</span><h3>' +
      queue.length + ' OF ' + trustEngine.metrics.reviewCandidates + ' PRIORITY REVIEWS.</h3></div><p>Each packet carries evidence, its review gate, and a dry-run ripple.</p></div>' +
      '<div class="review-queue">' + queue.map(function (item, index) {
        var evidence = item.evidence && item.evidence[0];
        return '<article><header><b>#' + String(index + 1).padStart(2, "0") + ' // ' +
          esc(item.severity) + '</b><span>' + esc(loreKindLabel(item.kind)) + '</span></header><h3>' +
          esc(item.title) + '</h3><p>' + esc(item.summary) + '</p><blockquote>' +
          esc(item.recommendation) + '</blockquote><footer>' +
          (evidence ? canonEvidenceButton(evidence, "INSPECT RECEIPT") : "") +
          '<button data-correction-packet="' + esc(item.id) + '">COPY PACKET + RIPPLE</button></footer></article>';
      }).join("") + '</div>';
  }

  function renderCharacterFirewall() {
    var grounded = trustEngine.characterAudits.grounded || [];
    var locked = trustEngine.characterAudits.locked || [];
    return '<div class="canon-lane-head"><div><span>PERSONA MENTION ≠ CHARACTER PERFORMANCE</span><h3>' +
      trustEngine.metrics.timestampValidatedCuratedPerformances + ' CURATED CANDIDATES. ' +
      trustEngine.metrics.ordinaryCharacterMentionsQuarantined + ' ORDINARY MENTIONS QUARANTINED.</h3></div><p>Labeled character-text parody is allowed; audio is not. Clip speakers remain undiarized.</p></div>' +
      '<div class="firewall-grid">' + grounded.map(function (character) {
        var first = character.soundbytes && character.soundbytes[0];
        return '<article><header><span>GROUNDED CHARACTER</span><b>' +
          Math.round(Number(character.confidence && character.confidence.score || 0)) + ' CONFIDENCE</b></header><h3>' +
          esc(character.name) + '</h3><p>Owner-mapped performer: <b>' + esc(character.performedBy || "UNSET") +
          '</b>. Exact clips are not speaker-diarized.</p><ul><li class="yes">LABELED TEXT PARODY ALLOWED</li>' +
          '<li class="no">GENERATED CHARACTER AUDIO BLOCKED</li><li class="no">UNVERIFIED SPEAKER CREDIT BLOCKED</li></ul>' +
          '<div><b>' + character.timestampValidatedPerformanceIds.length + '</b><span>TIMESTAMP-VALIDATED CURATED PERFORMANCE CANDIDATES</span><b>' +
          character.ordinaryMentionReceiptIds.length + '</b><span>MENTIONS KEPT OUT</span></div>' +
          (first ? canonEvidenceButton(first, "PLAY A CURATED RECEIPT") : "") + '</article>';
      }).join("") + locked.map(function (character) {
        var first = character.candidateSoundbytes && character.candidateSoundbytes[0];
        return '<article class="locked"><header><span>ATTRIBUTION LOCK</span><b>ASK DISABLED</b></header><h3>' +
          esc(character.name) + '</h3><p>' + esc(character.whyLocked) + '</p><ul><li class="no">NO PERFORMER GUESSED</li>' +
          '<li class="no">NO GENERATED VOICE</li><li class="yes">CANDIDATE RECEIPTS PRESERVED</li></ul>' +
          (first ? canonEvidenceButton(first, "INSPECT CANDIDATE") : "") + '</article>';
      }).join("") + '</div>';
  }

  function renderClaimAudit() {
    if (!window.WWAMCanonDeskUI) {
      return '<p class="memory-empty">THE CLAIM AUDIT UI IS STILL LOADING.</p>';
    }
    return window.WWAMCanonDeskUI.renderClaimAudit({ trustEngine: trustEngine, esc: esc });
  }
  function contributionPreview(packet) {
    if (!packet) return '<div class="contribution-empty"><b>NO PACKET YET.</b><span>Submit a source and time; the desk proposes, never rewrites canon.</span></div>';
    return '<article class="contribution-preview"><header><span>' + esc(packet.schema) +
      '</span><b>' + esc(packet.status) + '</b></header><h3>' + esc(packet.kind.replace(/-/g, " ").toUpperCase()) +
      '</h3><dl><div><dt>TARGET</dt><dd>' + esc(packet.target.type + " // " + packet.target.id) +
      '</dd></div><div><dt>SOURCE</dt><dd>' + esc(packet.proposedEvidence.sourceId) + ' @ ' +
      timestamp(packet.proposedEvidence.t || 0) + '</dd></div><div><dt>VERIFICATION</dt><dd>' +
      esc(packet.verificationState) + '</dd></div></dl><p>' + esc(packet.safety) +
      '</p><footer><button id="copyContribution">COPY PROPOSAL JSON</button><button id="downloadContribution">DOWNLOAD PACKET</button></footer></article>';
  }

  function renderCommunityMemory() {
    var missing = trustEngine.contributionPackets.filter(function (packet) {
      return packet.kind === "transcript-or-human-notes";
    });
    return '<div class="canon-lane-head"><div><span>COMMUNITY MEMORY // PROPOSE, NEVER SELF-CERTIFY</span><h3>HELP THE ARCHIVE REMEMBER WHAT THE MACHINE CANNOT.</h3></div><p>Viewers propose a source, time, and context. It stays unreviewed until a human decides.</p></div>' +
      '<div class="contribution-grid"><form id="contributionForm"><label><span>WHAT ARE YOU ADDING?</span><select id="contributionKind"><option value="new-receipt">NEW RECEIPT</option><option value="context-correction">CONTEXT CORRECTION</option><option value="transcript-or-human-notes">TRANSCRIPT / HUMAN NOTES</option><option value="performer-verification">PERFORMER VERIFICATION</option></select></label>' +
      '<label><span>TARGET ID OR NAME</span><input id="contributionTarget" required placeholder="character:marky-mark or Halloween"></label>' +
      '<label><span>YOUTUBE VIDEO ID</span><input id="contributionSource" required maxlength="20" placeholder="5HfhwoDSQ0E"></label>' +
      '<label><span>TIMESTAMP (SECONDS OR M:SS)</span><input id="contributionTime" required placeholder="1:50:40"></label>' +
      '<label><span>SHORT CONTEXT NOTE</span><textarea id="contributionExcerpt" maxlength="240" placeholder="What should an editor verify here?"></textarea></label>' +
      '<button>BUILD UNREVIEWED PROPOSAL →</button><small>Nothing uploads from this page. Export the packet and send it to the archive owner.</small></form>' +
      '<aside><div class="missing-memory"><span>KNOWN MEMORY GAPS</span>' +
      missing.map(function (packet) {
        return '<button data-fill-contribution="' + esc(packet.proposedEvidence.sourceId) + '"><b>' +
          esc((showcaseSourceById[packet.proposedEvidence.sourceId] || {}).title || packet.proposedEvidence.sourceId) +
          '</b><small>CAPTIONS UNAVAILABLE // OFFER HUMAN NOTES</small></button>';
      }).join("") + '</div>' + contributionPreview(state.canonDraft) + '</aside></div>';
  }

  function parseContributionTime(value) {
    var cleanValue = String(value || "").trim();
    if (/^\d+(\.\d+)?$/.test(cleanValue)) {
      var seconds = Number(cleanValue);
      return Number.isFinite(seconds) ? seconds : NaN;
    }
    if (!/^\d+:\d{1,2}(?::\d{1,2})?$/.test(cleanValue)) return NaN;
    var parts = cleanValue.split(":").map(Number);
    if (parts.slice(1).some(function (part) { return part >= 60; })) return NaN;
    return parts.reduce(function (total, part) { return total * 60 + part; }, 0);
  }

  function saveHumanReviewSession() {
    if (!humanReviewSession) return false;
    return storageSet("wwam-human-review-v52", humanReviewSession.exportJSON());
  }

  function renderHumanReviewSession() {
    if (!window.WWAMCanonDeskUI) {
      return '<p class="memory-empty">THE LOCAL REVIEW DESK IS STILL LOADING.</p>';
    }
    return window.WWAMCanonDeskUI.renderHumanReviewSession({
      session: humanReviewSession,
      state: state,
      esc: esc,
      timestamp: timestamp,
      evidenceButton: canonEvidenceButton,
      transitions: window.WWAMHumanReviewSession && window.WWAMHumanReviewSession.TRANSITIONS,
    });
  }
  function bindCanon() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-canon-tab]"), function (button) {
      button.onclick = function () {
        state.canonTab = button.getAttribute("data-canon-tab");
        renderCanon();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-canon-source]"), function (button) {
      button.onclick = function () {
        var id = button.getAttribute("data-canon-source");
        if (itemById[id]) openDossier(id);
        else if (streamById[id]) openLiveDossier(id);
        else openLooseSource(id, 0, "WWAM SOURCE");
      };
    });
    bindMemoryReceipts();
    Array.prototype.forEach.call(document.querySelectorAll("[data-correction-packet]"), function (button) {
      button.onclick = function () {
        var packet = trustEngine.buildCorrectionPacket(button.getAttribute("data-correction-packet"));
        if (packet) copy(JSON.stringify(packet, null, 2), packet.dryRunRipple.analysisComplete ?
          "RIPPLE COPIED // " + packet.dryRunRipple.totals.affectedSurfaces + " SURFACES // " +
          packet.dryRunRipple.totals.exactReceiptRecords + " EXACT" : "RIPPLE BLOCKED // UNRESOLVED EVIDENCE");
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-fill-contribution]"), function (button) {
      button.onclick = function () {
        document.getElementById("contributionKind").value = "transcript-or-human-notes";
        document.getElementById("contributionSource").value = button.getAttribute("data-fill-contribution");
        document.getElementById("contributionTarget").value = button.getAttribute("data-fill-contribution");
        document.getElementById("contributionTime").value = "0";
        ["contributionTarget", "contributionSource", "contributionTime"].forEach(function (id) {
          document.getElementById(id).setCustomValidity("");
        });
      };
    });
    ["contributionTarget", "contributionSource", "contributionTime"].forEach(function (id) {
      var control = document.getElementById(id);
      if (control) control.oninput = function () { control.setCustomValidity(""); };
    });
    var form = document.getElementById("contributionForm");
    if (form) form.onsubmit = function (event) {
      event.preventDefault();
      var sourceId = document.getElementById("contributionSource").value.trim();
      var sourceInput = document.getElementById("contributionSource");
      var targetInput = document.getElementById("contributionTarget");
      var targetId = targetInput.value.trim();
      var timeInput = document.getElementById("contributionTime");
      var at = parseContributionTime(timeInput.value);
      sourceInput.setCustomValidity(/^[A-Za-z0-9_-]{11}$/.test(sourceId) ? "" : "Enter the 11-character YouTube video ID.");
      targetInput.setCustomValidity(targetId ? "" : "Enter the archive entry, source, or character this proposal concerns.");
      timeInput.setCustomValidity(Number.isFinite(at) && at >= 0 ? "" : "Enter seconds or a valid M:SS / H:MM:SS timestamp.");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var kind = document.getElementById("contributionKind").value;
      var targetType = kind === "performer-verification" ? "character" :
        kind === "transcript-or-human-notes" ? "source" : "archive-entry";
      state.canonDraft = trustEngine.buildContributionPacket({
        kind: kind,
        targetType: targetType,
        targetId: targetId,
        sourceId: sourceId,
        t: at,
        url: "https://www.youtube.com/watch?v=" + sourceId + "&t=" + Math.round(at) + "s",
        excerpt: document.getElementById("contributionExcerpt").value.trim(),
      });
      renderCanon();
      showToast("UNREVIEWED CONTRIBUTION PACKET BUILT");
    };
    var copyContribution = document.getElementById("copyContribution");
    if (copyContribution) copyContribution.onclick = function () {
      copy(JSON.stringify(state.canonDraft, null, 2), "CONTRIBUTION PACKET COPIED");
    };
    var downloadContribution = document.getElementById("downloadContribution");
    if (downloadContribution) downloadContribution.onclick = function () {
      downloadJson("wwam-community-memory-proposal.json", state.canonDraft);
      showToast("CONTRIBUTION PACKET DOWNLOADED");
    };
    var reviewOrigin = document.getElementById("reviewOrigin");
    if (reviewOrigin) reviewOrigin.onchange = function () {
      state.reviewOrigin = reviewOrigin.value;
      state.reviewSelected = "";
      state.reviewNotice = "";
      renderCanon();
    };
    var reviewStatus = document.getElementById("reviewStatus");
    if (reviewStatus) reviewStatus.onchange = function () {
      state.reviewStatus = reviewStatus.value;
      state.reviewSelected = "";
      state.reviewNotice = "";
      renderCanon();
    };
    var reviewQuery = document.getElementById("reviewQuery");
    if (reviewQuery) reviewQuery.onchange = function () {
      state.reviewQuery = reviewQuery.value.trim();
      state.reviewSelected = "";
      state.reviewNotice = "";
      renderCanon();
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-review-select]"), function (button) {
      button.onclick = function () {
        state.reviewSelected = button.getAttribute("data-review-select");
        state.reviewNotice = "";
        renderCanon();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-review-decision]"), function (button) {
      button.onclick = function () {
        var reviewForm = document.getElementById("humanReviewForm");
        var reviewNotice = document.getElementById("reviewNotice");
        if (!reviewForm || !reviewForm.checkValidity()) {
          state.reviewNotice = "HELD FORM_INCOMPLETE // COMPLETE THE REQUIRED HUMAN-ENTERED FIELDS AND ATTESTATION.";
          if (reviewNotice) {
            reviewNotice.hidden = false;
            reviewNotice.textContent = state.reviewNotice;
          }
          if (reviewForm) reviewForm.reportValidity();
          return;
        }
        var targetStatus = button.getAttribute("data-review-decision");
        var action = {
          status: targetStatus,
          at: document.getElementById("reviewAt").value.trim(),
          reviewer: {
            role: document.getElementById("reviewRole").value.trim(),
            name: document.getElementById("reviewName").value.trim(),
            humanAttested: document.getElementById("reviewAttestation").checked,
            attestation: "caller-attested-human",
          },
          notes: document.getElementById("reviewNotes").value.trim(),
          evidenceReceiptIds: Array.prototype.map.call(
            document.querySelectorAll("[data-review-evidence]:checked"),
            function (input) { return input.value; }
          ),
        };
        if (targetStatus === "wording-checked") {
          action.proposedWording = document.getElementById("reviewWording").value.trim();
        }
        try {
          var decision = humanReviewSession.recordDecision(state.reviewSelected, action);
          var persisted = saveHumanReviewSession();
          state.reviewNotice = (persisted ? "RECORDED " : "RECORDED IN THIS TAB ONLY // LOCAL PERSISTENCE FAILED // DOWNLOAD THE SESSION // ") +
            decision.after.status.toUpperCase() +
            " // PROOF " + decision.proofFingerprint +
            " // CANON, SPEAKER, AND CREATOR CERTIFICATION REMAIN FALSE";
          renderCanon();
        } catch (error) {
          state.reviewNotice = "HELD " + (error.code || "REVIEW_ERROR") + " // " +
            (error.message || String(error));
          if (reviewNotice) {
            reviewNotice.hidden = false;
            reviewNotice.textContent = state.reviewNotice;
          }
        }
      };
    });
    var reviewCopySession = document.getElementById("reviewCopySession");
    if (reviewCopySession) reviewCopySession.onclick = function () {
      copy(humanReviewSession.exportMarkdown(), "LOCAL REVIEW SESSION COPIED");
    };
    var reviewDownloadSession = document.getElementById("reviewDownloadSession");
    if (reviewDownloadSession) reviewDownloadSession.onclick = function () {
      downloadJson("wwam-local-human-review-session.json", humanReviewSession.snapshot());
      showToast("LOCAL REVIEW SESSION DOWNLOADED");
    };
    var reviewDownloadQuarantine = document.getElementById("reviewDownloadQuarantine");
    if (reviewDownloadQuarantine) reviewDownloadQuarantine.onclick = function () {
      var heldLedger;
      try {
        heldLedger = JSON.parse(state.reviewQuarantinedLedger);
      } catch {
        heldLedger = { raw: state.reviewQuarantinedLedger };
      }
      downloadJson("wwam-held-review-ledger.json", heldLedger);
      showToast("HELD REVIEW LEDGER EXPORTED // NO DECISIONS IMPORTED");
    };
  }

  function renderCanon() {
    if (!trustEngine) {
      document.getElementById("canonStage").innerHTML = '<p class="memory-empty">' +
        (state.creatorEnginesSettled ? "THE TRUST DESK COULD NOT INITIALIZE." : "RUNNING THE TRUST AUDIT…") +
        '</p>';
      return;
    }
    var metrics = trustEngine.metrics;
    document.getElementById("canonProof").innerHTML = [
      [metrics.healthySources + "/" + metrics.sources, "HEALTHY · PROMOTED CORPUS"],
      [metrics.invalidTimestamps, "OUT-OF-RANGE TIMES"],
      [metrics.ordinaryCharacterMentionsQuarantined, "MENTIONS QUARANTINED"],
      [metrics.reviewCandidates, "OPEN HUMAN REVIEWS"],
      [metrics.publicExcerptViolations, "RAW EXCERPTS UI-CAPPED"],
    ].map(function (stat) {
      return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-canon-tab]"), function (button) {
      var selected = button.getAttribute("data-canon-tab") === state.canonTab;
      button.classList.toggle("on", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
    });
    var content = state.canonTab === "review" ? renderReviewQueue() :
      state.canonTab === "characters" ? renderCharacterFirewall() :
      state.canonTab === "claims" ? renderClaimAudit() :
      state.canonTab === "contribute" ? renderCommunityMemory() :
        state.canonTab === "session" ? renderHumanReviewSession() : renderSourceHealth();
    document.getElementById("canonStage").innerHTML = content;
    bindCanon();
  }

  function ensureAftermathPilot() {
    if (aftermathPackEngine || aftermathPilotLoadPromise) return aftermathPilotLoadPromise;
    state.pilotAftermathNotice = "VERIFYING THE THREE SOURCE-LOCKED PACKS...";
    aftermathPilotLoadPromise = loadSourceDossier().then(function () {
      state.pilotAftermathNotice = aftermathPackEngine ? "" :
        "AFTERMATH SHOWCASE HELD // SOURCE-BOUND PACKS DID NOT INITIALIZE";
      renderPilotBuilder();
      return aftermathPackEngine;
    }).catch(function (error) {
      state.pilotAftermathNotice = "AFTERMATH SHOWCASE HELD // " +
        (error && error.message ? error.message : "SOURCE-BOUND PACKS DID NOT INITIALIZE");
      renderPilotBuilder();
      return null;
    });
    return aftermathPilotLoadPromise;
  }

  function bindPilotBuilder(brief, aftermathPilot) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-pilot-goal]"), function (button) {
      button.onclick = function () {
        state.pilotGoal = button.getAttribute("data-pilot-goal");
        renderPilotBuilder(true);
      };
    });
    var copyButton = document.getElementById("pilotCopy");
    if (copyButton) copyButton.onclick = function () {
      var markdown = pilotBuilderEngine.exportMarkdown(brief);
      if (aftermathPilot) {
        markdown += "\n\n# CREATOR WORKFLOW SHOWCASE\n\n" +
          aftermathPilot.scope.label + "\n\n" + aftermathPilot.summary +
          "\n\nEditorial workbench. Human review required.\n";
      }
      copy(markdown, "CREATOR WORKFLOW BRIEF COPIED // STILL A DRAFT");
    };
    var downloadButton = document.getElementById("pilotDownload");
    if (downloadButton) downloadButton.onclick = function () {
      downloadJson("wwam-" + state.pilotGoal + "-workflow-draft.json",
        aftermathPilot ? {
          schema: "wwam.creator-workflow-handoff/v1",
          brief: brief,
          aftermathShowcase: aftermathPilot
        } : brief);
      showToast("WORKFLOW DRAFT DOWNLOADED // HUMAN APPROVAL STILL REQUIRED");
    };
  }

  function renderPilotBuilder(focusGoal) {
    var stage = document.getElementById("pilotBuilder");
    if (!stage) return;
    if (!pilotBuilderEngine) {
      stage.innerHTML = '<div class="pilot-loading"><i></i><b>' +
        (state.creatorEnginesSettled && state.fanEnginesSettled ?
          "WORKFLOW BUILDER HELD // ONE OR MORE EVIDENCE ENGINES DID NOT INITIALIZE" :
          "ASSEMBLING AN EVIDENCE-BACKED CREATOR WORKFLOW...") +
        '</b></div>';
      return;
    }
    var brief = attempt(function () {
      return pilotBuilderEngine.build(state.pilotGoal);
    }, "creator workflow brief rendering");
    if (!brief) {
      stage.innerHTML = '<div class="pilot-loading"><b>WORKFLOW BRIEF FAILED CLOSED // CHECK THE TRUST DESK</b></div>';
      return;
    }
    var verification = pilotBuilderEngine.verify(brief);
    var integrity = pilotBuilderEngine.integrity;
    var wantsAftermathPilot = state.pilotGoal === "compilation-workflow";
    if (wantsAftermathPilot && !aftermathPackEngine) ensureAftermathPilot();
    var aftermathPilot = wantsAftermathPilot && aftermathPackEngine ?
      attempt(function () {
        return aftermathPackEngine.buildShowcase({ sourceIds: ["LV2rmwEA0w4"] });
      }, "Aftermath workflow showcase rendering") : null;
    var aftermathPilotMarkup = aftermathPilot ?
      '<section class="workflow-showcase"><div><span>THREE-SHOW WORKFLOW SHOWCASE</span><h4>' +
      esc(aftermathPilot.scope.label) + '</h4><p>' + esc(aftermathPilot.summary) +
      '</p></div><div class="pilot-fixed-sources">' + aftermathPilot.sources.map(function (source) {
        return '<article><span>' + esc(source.date) + '</span><b>' + esc(source.title) +
          '</b><small>' + esc(source.opportunities) + ' REGISTERED REVIEW CANDIDATES // PACK ' +
          esc(source.packFingerprint) + '</small></article>';
      }).join("") + '</div><footer><b>' + esc(aftermathPilot.status) +
      '</b><p>' + esc(aftermathPilot.prototypeBoundary) + '</p></footer></section>' :
      wantsAftermathPilot ? '<section class="workflow-showcase"><div><span>THREE-SHOW WORKFLOW SHOWCASE</span><h4>' +
        (state.pilotAftermathNotice.indexOf("HELD") >= 0 ? 'PROOF HELD.' : 'VERIFYING THREE SOURCE-LOCKED SHOWS...') +
        '</h4><p>' + esc(state.pilotAftermathNotice || "VERIFYING THE THREE SOURCE-LOCKED PACKS...") +
        '</p></div></section>' : "";
    stage.innerHTML =
      '<header class="pilot-head"><div><span>CREATOR WORKFLOW BUILDER // PICK ONE JOB, THEN TRACE IT</span>' +
      '<h3>OPEN THE WORKFLOW.<br>FOLLOW THE RECEIPTS.</h3></div><div class="pilot-status"><b>' +
      esc(brief.status) + '</b><span>BRIEF ' + esc(brief.fingerprint) + '</span><span>INTEGRITY ' +
      esc(integrity.status) + ' // ' + esc(integrity.fingerprint) + '</span></div></header>' +
      '<nav class="pilot-goals" aria-label="Choose a creator workflow goal">' +
      pilotBuilderEngine.goals.map(function (goal) {
        return '<button class="' + (goal.id === state.pilotGoal ? "on" : "") +
          '" data-pilot-goal="' + esc(goal.id) + '" aria-pressed="' +
          (goal.id === state.pilotGoal ? "true" : "false") + '"><span>' + esc(goal.label) +
          '</span><b>' + esc(goal.question) + '</b></button>';
      }).join("") + '</nav>' + aftermathPilotMarkup +
      '<div class="pilot-brief">' +
      '<section class="pilot-promise"><span>THE NARROW PROMISE</span><h4>' +
      esc(brief.goal.label) + '</h4><p>' + esc(brief.summary) +
      '</p><div class="pilot-snapshot">' +
      brief.currentProof.summary.map(function (item) {
        var match = String(item).match(/^([\d,]+)\s+(.*)$/);
        return '<div><b>' + esc(match ? match[1] : "PROOF") + '</b><span>' +
          esc(match ? match[2] : item) + '</span></div>';
      }).join("") + '</div></section>' +
      '<aside class="pilot-proof-ledger"><div><span>SIX RECEIPTS, NOT SIX PROMISES</span><b>' +
      (verification.ok ? "CONSISTENCY CHECK PASSED" : "CONSISTENCY CHECK FAILED") + '</b></div><ol>' +
      brief.currentProof.sampleReceipts.map(function (receipt) {
        return '<li><a href="' + esc(receipt.url) +
          '" target="_blank" rel="noopener"><b>' + esc(receipt.sourceTitle) +
          '</b><span>' + esc(receipt.sourceDate || "UNDATED") + ' // ' +
          timestamp(receipt.at) + ' // ' + esc(receipt.evidenceLevel.toUpperCase()) +
          '</span></a></li>';
      }).join("") + '</ol><p>' + esc(brief.currentProof.label) +
      '. Source coverage does not certify context.</p></aside></div>' +
      '<div class="pilot-deliverables">' +
      brief.deliverables.map(function (item, index) {
        return '<article><span>DELIVERABLE 0' + (index + 1) + ' // ' +
          esc(item.approvalState) + '</span><h4>' + esc(item.label) +
          '</h4><p>' + esc(item.description) + '</p><footer><b>PASS WHEN</b><span>' +
          esc(item.acceptanceCheck) + '</span></footer></article>';
      }).join("") + '</div>' +
      '<div class="pilot-bottom"><section><span>MEASUREMENT CONTRACT // ' +
      esc(brief.measurementPlan.status) + '</span><h4>NO FAKE BEFORE-AND-AFTER.</h4><p>' +
      esc(brief.measurementPlan.claimsBoundary) + '</p><ul>' +
      brief.measurementPlan.instruments.map(function (item) {
        return '<li>' + esc(item) + '</li>';
      }).join("") + '</ul></section><aside><span>THE CREATOR STILL DECIDES</span><ol>' +
      brief.humanDecisionsRequired.map(function (item) {
        return '<li>' + esc(item) + '</li>';
      }).join("") + '</ol></aside></div>' +
      '<footer class="pilot-actions"><p>' + esc(brief.prototypeBoundary) +
      '</p><div><button id="pilotCopy">COPY WORKFLOW BRIEF</button>' +
      '<button id="pilotDownload">DOWNLOAD PROOF LEDGER</button></div></footer>';
    bindPilotBuilder(brief, aftermathPilot);
    if (focusGoal) {
      var selectedGoal = stage.querySelector('[data-pilot-goal="' + state.pilotGoal + '"]');
      if (selectedGoal) selectedGoal.focus();
    }
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
      franchise.tapes + '</b>COMMENTARIES IN EVIDENCE</div></div>' +
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
    var preferencePersisted = !persist ||
      storageSet("wwam-band", state.redBand ? "red" : "bleep");
    document.body.classList.toggle("office-bleep", !state.redBand);
    document.getElementById("bandToggle").textContent = "REDUCED PROFANITY: " + (state.redBand ? "OFF" : "ON");
    window.WWAMRouteRenderGate.refresh();
    refreshSoundPlayerCopy();
    refreshCharacterAnswerCopy();
    var openModal = document.getElementById("tapeModal").classList.contains("show");
    if (openModal) {
      var route = readSourceRoute();
      if (route) {
        openSourceDossier(route.sourceId, route.at, {
          section: route.section,
          routeMode: route.legacy ? "replace" : "none",
          autoplay: false,
        });
      }
    }
    if (!preferencePersisted) showToast("LANGUAGE PREFERENCE KEPT FOR THIS TAB ONLY");
  }

  function renderTour() {
    var slide = tourSlides[state.tourSlide];
    document.getElementById("tourBody").innerHTML =
      '<div class="tour-number">' + slide.number + '</div><div><p>' + slide.eyebrow + '</p><h2>' + slide.title +
      '</h2><span>' + slide.body + '</span><blockquote>' + slide.proof +
      '</blockquote><button class="tour-proof-button" data-tour-proof>' + esc(slide.action.label) +
      ' →</button></div>';
    document.getElementById("tourProgress").style.width = ((state.tourSlide + 1) / tourSlides.length * 100) + "%";
    document.getElementById("tourCounter").textContent = (state.tourSlide + 1) + " / " + tourSlides.length;
    document.getElementById("tourBack").disabled = state.tourSlide === 0;
    document.getElementById("tourNext").textContent = state.tourSlide === tourSlides.length - 1 ? "COPY DEMO LINK" : "NEXT →";
    document.querySelector("[data-tour-proof]").onclick = runTourProof;
  }
  function updateTourLaunchers() {
    var total = tourSlides.length || 6;
    var canResume = Number.isInteger(state.tourResumeSlide) &&
      state.tourResumeSlide >= 0 && state.tourResumeSlide < total;
    var step = canResume ? (state.tourResumeSlide + 1) + "/" + total : "";
    var mikeButton = optionalElement("mikeButton");
    var pitchButton = document.getElementById("pitchTourButton");
    var footerButton = document.getElementById("footerPitch");
    if (mikeButton) {
      mikeButton.innerHTML = '<span></span> ' + (canResume ? "RESUME " + step : "SHOWCASE MODE");
      mikeButton.setAttribute("aria-label", canResume ?
        "Resume Showcase Mode at slide " + (state.tourResumeSlide + 1) + " of " + total :
        "Open Showcase Mode");
      mikeButton.classList.toggle("tour-resume-ready", canResume);
    }
    if (pitchButton) {
      pitchButton.textContent = canResume ?
        "RESUME SHOWCASE · " + step : "START THE 60-SECOND SHOWCASE";
      pitchButton.classList.toggle("tour-resume-ready", canResume);
    }
    if (footerButton) {
      footerButton.textContent = canResume ? "RESUME SHOWCASE · " + step : "SHOWCASE MODE";
      footerButton.classList.toggle("tour-resume-ready", canResume);
    }
  }


  function runTourProof() {
    var action = tourSlides[state.tourSlide].action;
    closeTour({
      resumeSlide: Math.min(state.tourSlide + 1, tourSlides.length - 1),
    });
    var targetId = action.kind === "ask" ? "ask" :
      (action.kind === "source" || action.kind === "aftermath") ? "archive" :
      action.kind === "lore" ? "lore" :
        action.kind === "clip" ? "clip-lab" :
          action.kind === "pilot" ? "pitch" :
          action.kind === "canon" ? "canon" :
            action.kind === "night" ? "night-shift" :
              action.kind === "archive" ? "archive" : "trivia";
    history.replaceState(null, "", location.pathname + location.search + "#" + targetId);
    window.dispatchEvent(new Event("hashchange"));
    if (action.kind === "ask") {
      document.getElementById("askInput").value = action.query;
      ask(action.query);
      document.getElementById("ask").scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "source" || action.kind === "aftermath") {
      openSourceDossier(action.sourceId, action.at == null ? null : action.at,
        {section:action.section || (action.kind === "aftermath" ? "aftermath" : "ask"),
          query:action.query || "", routeMode:"push", autoplay:false});
    } else if (action.kind === "lore") {
      state.loreKind = "character";
      state.loreSelected = action.entry;
      state.loreQuery = "";
      document.getElementById("loreSearch").value = "";
      renderLore();
      document.getElementById("lore").scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "clip") {
      state.clipSourceId = action.sourceId || "";
      state.clipMode = action.mode || "shorts";
      if (action.duration) state.coldOpenDuration = action.duration;
      state.clipQuery = action.query;
      document.getElementById("clipSearch").value = action.query;
      renderClipLab();
      document.getElementById("clip-lab").scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "pilot") {
      state.pilotGoal = action.goal || "archive-discovery";
      renderPilotBuilder();
      document.getElementById("pilotBuilder").scrollIntoView({ behavior: "smooth", block: "start" });
      focusSoon('[data-pilot-goal="' + state.pilotGoal + '"]');
    } else if (action.kind === "canon") {
      state.canonTab = action.tab;
      renderCanon();
      document.getElementById("canon").scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "night") {
      document.getElementById("night-shift").scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "archive") {
      document.getElementById("archive").scrollIntoView({ behavior: "smooth" });
      loadArchiveAtlas().then(function (engine) {
        if (engine) focusSoon("#archiveSearch");
      });
    } else {
      document.getElementById("trivia").scrollIntoView({ behavior: "smooth" });
      focusSoon("#triviaStart");
    }
  }

  function openTour() {
    if (!tourSlides.length) {
      loadDemoScript("pitch-tour-data.js").then(function () {
        tourSlides = window.WWAM_PITCH_TOUR || [];
        openTour();
      }).catch(function () { showToast("SHOWCASE MODE COULD NOT LOAD"); });
      return;
    }
    rememberDialogFocus();
    state.tourSlide = Number.isInteger(state.tourResumeSlide) &&
      state.tourResumeSlide >= 0 && state.tourResumeSlide < tourSlides.length ?
      state.tourResumeSlide : 0;
    state.tourResumeSlide = null;
    updateTourLaunchers();
    renderTour();
    document.getElementById("pitchTour").classList.add("show");
    document.getElementById("pitchTour").setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    history.replaceState(null, "", "#pitch");
    syncBackgroundInert();
    focusSoon("#tourClose");
  }

  function closeTour(options) {
    var requestedResume = options && Number.isInteger(options.resumeSlide) ?
      options.resumeSlide : state.tourSlide;
    state.tourResumeSlide = Math.max(0, Math.min(requestedResume, tourSlides.length - 1));
    updateTourLaunchers();
    document.getElementById("pitchTour").classList.remove("show");
    document.getElementById("pitchTour").setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (location.hash === "#pitch") {
      history.replaceState(null, "", location.pathname + location.search);
    }
    syncBackgroundInert();
    restoreDialogFocus();
  }

  function rememberDialogFocus() {
    if (document.activeElement && document.activeElement !== document.body &&
        !(document.activeElement.closest && document.activeElement.closest("[inert]"))) {
      lastDialogFocus = document.activeElement;
    }
  }

  function focusSoon(target) {
    setTimeout(function () {
      var element = typeof target === "string" ? document.querySelector(target) : target;
      if (element && typeof element.focus === "function") element.focus();
    }, 0);
  }

  function restoreDialogFocus() {
    if (lastDialogFocus && lastDialogFocus.isConnected && typeof lastDialogFocus.focus === "function") {
      focusSoon(lastDialogFocus);
    }
    lastDialogFocus = null;
  }

  function activeDialog() {
    var gate = document.getElementById("contentGate");
    if (gate && !gate.classList.contains("gone")) return gate;
    if (state.bagOpen) return document.getElementById("evidenceBag");
    if (document.getElementById("pitchTour").classList.contains("show")) return document.getElementById("pitchTour");
    if (document.getElementById("tapeModal").classList.contains("show")) return document.getElementById("tapeModal");
    return null;
  }

  function syncBackgroundInert() {
    var blocked = Boolean(activeDialog());
    Array.prototype.forEach.call(document.querySelectorAll(
      "body > nav, body > header, body > main, body > footer, #evidenceBagOpen"
    ), function (element) {
      if (blocked) element.setAttribute("inert", "");
      else element.removeAttribute("inert");
    });
  }

  function trapDialogFocus(event) {
    if (event.key !== "Tab") return;
    var dialog = activeDialog();
    if (!dialog) return;
    var focusable = Array.prototype.filter.call(dialog.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    ), function (element) {
      return !element.closest('[hidden],[aria-hidden="true"],[inert]') &&
        (!element.getClientRects || element.getClientRects().length > 0);
    });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function bindPage() {
    document.getElementById("triviaDifficulty").onchange = function (event) { state.triviaDifficulty = event.target.value; };
    document.getElementById("triviaLength").onchange = function (event) {
      state.triviaLength = Number(event.target.value);
      document.getElementById("triviaStart").textContent = "DEAL ME " + state.triviaLength + " →";
    };
    document.getElementById("triviaFranchise").onchange = function (event) { state.triviaFranchise = event.target.value; };
    document.getElementById("triviaStart").onclick = function () {
      if (!tapeTriviaEngine) return showToast("THE TRIVIA DECK IS STILL SHUFFLING"); startTrivia(true);
    };
    document.getElementById("loreSearch").oninput = function (event) { state.loreQuery = event.target.value; renderLore(); };
    document.getElementById("clipSearch").oninput = function (event) { state.clipQuery = event.target.value; renderClipLab(); };
    document.getElementById("clipRisk").onchange = function (event) { state.clipRisk = event.target.value; renderClipLab(); };
    document.getElementById("campaignCopy").onclick = function () {
      if (!clipLabEngine) return showToast("THE CLIP LAB IS STILL INDEXING"); copy(clipLabEngine.exportManifest(campaignManifest(), 2), "EDITORIAL CAMPAIGN COPIED");
    };
    document.getElementById("campaignDownload").onclick = function () {
      if (!clipLabEngine) return showToast("THE CLIP LAB IS STILL INDEXING"); downloadJson("wwam-editorial-campaign.json", campaignManifest()); showToast("EDITORIAL CAMPAIGN DOWNLOADED");
    };
    document.getElementById("campaignClear").onclick = function () {
      state.campaignIds = [];
      campaignSnapshots = {};
      var persisted = saveCampaignIds();
      renderClipLab();
      showToast(persisted ? "THE CAMPAIGN TRAY IS CLEAR" :
        "CAMPAIGN CLEARED // THIS TAB ONLY");
    };
    document.getElementById("evidenceBagOpen").onclick = function () { rememberDialogFocus(); state.bagOpen = true; renderEvidenceBag(); focusSoon("#evidenceBagClose"); };
    document.getElementById("evidenceBagClose").onclick = function () { state.bagOpen = false; renderEvidenceBag(); restoreDialogFocus(); };
    document.getElementById("evidenceBagScrim").onclick = function () { state.bagOpen = false; renderEvidenceBag(); restoreDialogFocus(); };
    document.getElementById("evidenceBagCopy").onclick = copyEvidenceManifest;
    document.getElementById("evidenceBagDownload").onclick = downloadEvidenceManifest;
    document.getElementById("evidenceBagClear").onclick = function () {
      state.evidenceBag = [];
      var persisted = saveEvidenceBag();
      renderEvidenceBag();
      showToast(persisted ? "SAVED CLIPS CLEARED" :
        "SAVED CLIPS CLEARED IN THIS TAB");
    };
    document.addEventListener("click", function (event) {
      var button = event.target.closest && event.target.closest("[data-bag-add]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      addToEvidenceBag(readBagButton(button));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-band]"), function (button) {
      button.onclick = function () {
        setBand(button.getAttribute("data-band"), true);
        var gate = document.getElementById("contentGate");
        gate.classList.add("gone");
        gate.setAttribute("aria-hidden", "true");
        syncBackgroundInert();
        openInitialRoute();
        warmSourceDossierAfterGate();
      };
    });
    document.getElementById("bandToggle").onclick = function () { setBand(state.redBand ? "bleep" : "red", true); };
    document.getElementById("redExport").onclick = function () {
      loadRedBandRanking().then(function (engine) {
        if (!engine) return showToast("THE MEMORABILITY INDEX COULD NOT LOAD");
        downloadJson("wwam-red-band-100-v2.json", engine.exportSnapshot());
        showToast("RED BAND 100 INDEX + METHODOLOGY DOWNLOADED");
      });
    };
    document.getElementById("loadMore").onclick = function () { state.hotLimit += 12; renderHot100(); };
    var rouletteButton = optionalElement("rouletteButton");
    if (rouletteButton) rouletteButton.onclick = function () {
      var moment = redBandMoments[Math.floor(Math.random() * redBandMoments.length)];
      if (moment) openRedMoment(moment.sourceId || moment.tapeId, moment.t);
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-sound-source]"), function (button) {
      button.onclick = function () {
        state.soundSource = button.getAttribute("data-sound-source");
        renderSoundFilters();
        renderSoundbytes();
      };
    });
    document.getElementById("soundRoulette").onclick = function () {
      var candidates = soundbytes(), item = candidates[Math.floor(Math.random() * candidates.length)];
      if (item) cueSoundbyte(item);
    };
    document.getElementById("characterForm").onsubmit = function (event) {
      event.preventDefault();
      var question = document.getElementById("characterInput").value.trim();
      if (question.length > 1) askCharacter(question);
    };
    document.getElementById("popularSearch").oninput = function (event) { state.popularQuery = event.target.value; renderPopular(); };
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-tab]"), function (button) {
      button.onclick = function () {
        state.memoryTab = button.getAttribute("data-memory-tab");
        if (state.memoryTab === "score")
          history.replaceState(null, "", location.pathname + location.search + "#tape-keeps-score");
        else if (location.hash === "#tape-keeps-score")
          history.replaceState(null, "", location.pathname + location.search + "#memory");
        renderMemory();
      };
    });
    document.getElementById("memory").addEventListener("wwam:feature-ready", function () {
      if (state.memoryTab === "score" || state.memoryTab === "bits") renderMemory();
    });
    addEventListener("hashchange", function () {
      if (location.hash !== "#tape-keeps-score") return;
      document.getElementById("tape-keeps-score").click();
    });
    addEventListener("popstate", function () {
      var route = readSourceRoute();
      if (route) {
        openSourceDossier(route.sourceId, route.at, {
          section: route.section,
          routeMode: route.legacy ? "replace" : "none",
          autoplay: false,
        });
      } else if (document.getElementById("tapeModal").classList.contains("show")) {
        closeDossier({ fromHistory: true, preserveRoute: true });
      }
    });
    addEventListener("wwam:verdict-room-open", function (event) {
      var room = document.getElementById("verdict-room");
      room.setAttribute("data-verdict-subject",
        event.detail && typeof event.detail.subjectId === "string" ? event.detail.subjectId : "");
      location.hash = "verdict-room";
      window.WWAMFeatureLoader.hydrate(room).then(function (ready) {
        if (ready && window.WWAMVerdictRoomSurface)
          window.WWAMVerdictRoomSurface.open(room.getAttribute("data-verdict-subject"));
      });
    });
    document.addEventListener("wwam:halloween-play", function (event) {
      var detail = event && event.detail || {};
      var sourceId = String(detail.sourceId == null ? "" : detail.sourceId).trim();
      if (!/^[A-Za-z0-9_-]{11}$/.test(sourceId)) return;
      var hasStart = detail.start != null && Number.isFinite(Number(detail.start));
      var start = hasStart ? Math.max(0, Number(detail.start)) : null;
      var end = detail.end != null && Number.isFinite(Number(detail.end)) ?
        Math.max(Number(detail.end), Number(start || 0)) : null;
      var label = String(detail.label || "HALLOWEEN UNIVERSE SOURCE").slice(0, 180);
      openSourceDossier(sourceId, start, {
        routeMode: "push",
        autoplay: false,
      }).then(function (opened) {
        if (opened) {
          if (hasStart) loadPlayer(sourceId, start, end);
          return;
        }
        openLooseSource(sourceId, start || 0, label, end);
        showToast("PLAYING THE VERIFIED SOURCE COORDINATE");
      });
    });
    document.getElementById("vaultSearch").oninput = function (event) { state.vaultQuery = event.target.value; renderVault(); };
    document.getElementById("askForm").onsubmit = function (event) {
      event.preventDefault();
      var query = document.getElementById("askInput").value.trim();
      if (query.length > 1) ask(query);
    };
    document.querySelector(".prompt-chips").onclick = function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      document.getElementById("askInput").value = button.textContent;
      ask(button.textContent);
    };
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
    document.getElementById("tapeModal").onclick = function (event) { if (event.target.id === "tapeModal") closeDossier(); };
    document.addEventListener("keydown", function (event) {
      trapDialogFocus(event);
      if (event.key === "Escape") {
        if (state.bagOpen) {
          state.bagOpen = false;
          renderEvidenceBag();
          restoreDialogFocus();
        } else if (document.getElementById("pitchTour").classList.contains("show")) closeTour();
        else if (document.getElementById("tapeModal").classList.contains("show")) closeDossier();
      }
    });
    [optionalElement("mikeButton"), document.getElementById("pitchTourButton"), document.getElementById("footerPitch")].filter(Boolean).forEach(function (button) {
      button.onclick = openTour;
    });
    document.getElementById("latestDossierButton").onclick = function () {
      openSourceDossier((live.streams[0] || {id:"LV2rmwEA0w4"}).id, null, {section:"wiki",
        routeMode:"push", autoplay:false});
    };
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

  function openInitialRoute() {
    if (state.initialRouteHandled) return;
    var gate = document.getElementById("contentGate");
    if (gate && !gate.classList.contains("gone")) return;
    state.initialRouteHandled = true;
    var params = new URLSearchParams(location.search);
    var sourceRoute = readSourceRoute();
    if (sourceRoute) {
      setTimeout(function () {
        openSourceDossier(sourceRoute.sourceId, sourceRoute.at, {
          section: sourceRoute.section,
          routeMode: sourceRoute.legacy ? "replace" : "none",
          autoplay: false,
        });
      }, 50);
    } else if (window.WWAMAskShare.read(location.search)) {
      setTimeout(function () {
        var shared = window.WWAMAskShare.read(location.search);
        var replay = function () {
          state.askContext = shared.context;
          document.getElementById("askInput").value = shared.query;
          ask(shared.query);
          document.getElementById("ask").scrollIntoView();
        };
        if (shared.needsArchive) loadArchiveDeep().then(replay);
        else if (shared.needsRedBand) loadRedBandRanking().then(replay);
        else replay();
      }, 50);
    } else if (params.get("nightShift")) {
      setTimeout(function () {
        document.getElementById("night-shift").scrollIntoView();
      }, 50);
    } else if (location.hash === "#tape-keeps-score") {
      setTimeout(function () { document.getElementById("tape-keeps-score").click(); }, 50);
    } else if (location.hash === "#pitch") {
      setTimeout(openTour, 50);
    } else {
      var encodedTarget = String(location.hash || "").replace(/^#/, "");
      var targetId = encodedTarget;
      try { targetId = decodeURIComponent(encodedTarget); } catch (error) {}
      var routeTarget = targetId ? document.getElementById(targetId) : null;
      if (routeTarget) {
        setTimeout(function () { routeTarget.scrollIntoView(); }, 50);
      } else {
        focusSoon("#top");
      }
    }
  }

  function init() {
    document.body.classList.toggle("office-bleep", !state.redBand);
    document.getElementById("bandToggle").textContent =
      "REDUCED PROFANITY: " + (state.redBand ? "OFF" : "ON");
    var consoleStatus = document.getElementById("consoleStatus");
    var declaredAuditedWords = Number(consoleStatus && consoleStatus.getAttribute("data-words-audited"));
    consoleStatus.textContent = "SCANNING " +
      fmt(declaredAuditedWords ||
        (channelDNA.proofSnapshot && channelDNA.proofSnapshot.wordsAudited) ||
        deep.meta.wordsAudited + live.meta.wordsAudited + (popular.meta.wordsAudited || 0)) + " WORDS";
    window.WWAMRouteRenderGate.start({
      global:[renderEvidenceBag],
      dossier:[],
      home:[renderHeroConsole],
      shows:[renderLiveProof,renderTopicRadar,renderStreams,renderPopularProof,renderPopularTopics,renderPopular],
      watchalongs:[renderFranchises,renderFranchiseFilters,renderVault],
      characters:[createDeepEngines,createFanEngines,
        renderCharacterRoster,renderCharacter,renderMemory,renderLore],
      ask:[renderAskExamples,function(){
        if(state.lastAskQuery&&askEngine)ask(state.lastAskQuery,state.lastAskAnalysis);
      }],
      highlights:[createDeepEngines,createFanEngines,renderRedMethod,renderCategoryFilters,
        renderHot100,renderSoundFilters,renderSoundbytes,renderNightShift,renderTrivia],
      studio:[createDeepEngines,createFanEngines,createCreatorEngines,renderProof,
        renderMarquee,renderControlRoom,renderClipLab,renderCanon,renderPilotBuilder,renderLabs],
    });
    bindPage();
    prepareArchiveAtlasLazy();
    prepareRedBandRankingLazy();

    if (storageGet("wwam-band")) {
      document.getElementById("contentGate").classList.add("gone");
      document.getElementById("contentGate").setAttribute("aria-hidden", "true");
    } else {
      focusSoon('[data-band="red"]');
    }
    syncBackgroundInert();
    openInitialRoute();
    if (storageGet("wwam-band")) warmSourceDossierAfterGate();
    scheduleIdle(createDeepEngines, 700);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(function () {
        var consoleNode = document.getElementById("heroConsole");
        if (document.hidden || !consoleNode ||
            consoleNode.matches(":hover") || consoleNode.contains(document.activeElement) ||
            activeDialog()) return;
        state.consoleIndex += 1;
        renderHeroConsole();
      }, 5200);
    }
  }

  init();
})();
