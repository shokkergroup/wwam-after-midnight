(function () {
  "use strict";

  var catalog = window.WWAM_CATALOG || [];
  var deep = window.WWAM_DEEP_DISTILL || { meta: {}, franchises: [], tapes: [], hot100: [] };
  var live = window.WWAM_LIVESTREAMS || { meta: {}, streams: [], topicIndex: [] };
  var popular = window.WWAM_POPULAR_LIVE || { meta: {}, streams: [], topicIndex: [] };
  var curated = window.WWAM_CURATED || { upInYa: [], askExamples: [] };
  var characterLore = window.WWAM_CHARACTER_LORE || { meta: {}, characters: [] };
  var channelDNA = window.WWAM_CHANNEL_DNA || {};
  var askEngine;
  var characterEngine;
  var showcaseEngine;
  var loreEngine;
  var tapeTriviaEngine;
  var triviaSession;
  var clipLabEngine;
  var coldOpenFactory;
  var trustEngine;
  var showcaseReceiptById = {};
  var showcaseSourceById = {};
  var clipItemById = {};
  var campaignSnapshots = {};
  var lastDialogFocus = null;
  var tapeById = {};
  var itemById = {};
  var streamById = {};
  var storageFallback = {};
  var runtimeDiagnostics = [];
  window.WWAM_RUNTIME_DIAGNOSTICS = runtimeDiagnostics;

  function storageGet(key) {
    try {
      var value = window.localStorage.getItem(key);
      if (value != null) storageFallback[key] = value;
      return value != null ? value : (storageFallback[key] || null);
    } catch {
      return storageFallback[key] || null;
    }
  }

  function storageSet(key, value) {
    storageFallback[key] = String(value);
    try {
      window.localStorage.setItem(key, String(value));
      return true;
    } catch {
      return false;
    }
  }

  var state = {
    redBand: storageGet("wwam-band") !== "bleep",
    hotCategory: "ALL EVIDENCE",
    hotLimit: 12,
    franchise: "ALL",
    vaultQuery: "",
    lab: "Halloween",
    soundSource: "commentary",
    activeSoundbyte: null,
    liveTopic: "ALL TOPICS",
    popularQuery: "",
    popularTopic: "ALL TOPICS",
    character: "",
    characterContext: null,
    lastCharacterRiff: "",
    evidenceBag: loadEvidenceBag(),
    bagOpen: false,
    memoryTab: "time",
    memoryEntity: "Halloween",
    battleA: "franchise:Halloween",
    battleB: "franchise:Friday the 13th",
    loreQuery: "",
    loreKind: "character",
    loreSelected: "character:loomis",
    triviaDifficulty: "mixed",
    triviaLength: 5,
    triviaFranchise: "",
    triviaSeed: 0,
    clipMode: "shorts",
    clipQuery: "",
    clipRisk: "",
    coldOpenDuration: 30,
    campaignIds: loadCampaignIds(),
    canonTab: "health",
    canonDraft: null,
    askContext: null,
    lastAskQuery: "",
    lastAskAnalysis: null,
    initialRouteHandled: false,
    fanEnginesSettled: false,
    creatorEnginesSettled: false,
    descentMinutes: 20,
    descentMode: "CHAOS",
    tourSlide: 0,
    consoleIndex: 0,
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
  askEngine = window.WWAMSearchEngine.create(catalog, deep, live, curated, popular);
  characterEngine = window.WWAMCharacterEngine && window.WWAMCharacterEngine.create ?
    window.WWAMCharacterEngine.create(characterLore) : null;

  function attempt(work, label) {
    try {
      return work();
    } catch (error) {
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

  function createDeepEngines() {
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
    attempt(renderProof);
    attempt(renderMemory);
    attempt(renderControlRoom);
    scheduleIdle(createFanEngines, 900);
    scheduleIdle(createCreatorEngines, 1400);
  }

  function createFanEngines() {
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
    state.fanEnginesSettled = true;
    attempt(renderLore);
    attempt(renderTrivia);
  }

  function createCreatorEngines() {
    clipLabEngine = window.WWAMCreatorClipLab && window.WWAMCreatorClipLab.create && showcaseEngine ?
      attempt(function () { return window.WWAMCreatorClipLab.create({ showcase: showcaseEngine }); },
        "creator clip lab initialization") : null;
    coldOpenFactory = window.WWAMColdOpenFactory && window.WWAMColdOpenFactory.create && clipLabEngine ?
      attempt(function () { return window.WWAMColdOpenFactory.create({ clipLab: clipLabEngine }); },
        "cold open factory initialization") : null;
    if (clipLabEngine) {
      (clipLabEngine.shorts || []).concat(clipLabEngine.supercuts || [], clipLabEngine.resurfacing || [])
        .forEach(function (item) { clipItemById[item.id] = item; });
    }
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
    attempt(renderClipLab);
    attempt(renderCanon);
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
      body: "YouTube knows what a video is called. It does not know where a bit first surfaced in the indexed archive, where take signals diverged, which commentary drew the largest captured audience, or what exact second deserves to live again.",
      proof: "THE BACK CATALOG IS VALUABLE—BUT MOST OF ITS VALUE IS BURIED.",
      action: { kind: "trivia", label: "PLAY A SOURCE-GROUNDED ROUND" },
    },
    {
      number: "02",
      eyebrow: "THE RECEIPT",
      title: "1,880,873 WORDS.<br>74 SOURCES. PROVE IT.",
      body: "The expanded demo audits every available caption across 39 franchise commentaries, the rolling Fresh 10, and 25 new foundational livestreams—then turns 872 bounded evidence receipts into paths back to the exact source second.",
      proof: "71 CAPTIONED SOURCES. THREE HONESTLY DISCLOSED GAPS. ZERO COUNTERFEIT ANALYSIS.",
      action: { kind: "ask", label: "ASK FOR THE MOST-VIEWED LIVE", query: "What is the most-viewed foundational livestream?" },
    },
    {
      number: "03",
      eyebrow: "THE MOAT",
      title: "THE CHANNEL<br>REMEMBERS ITSELF.",
      body: "Take Time Machines surface chronological opinion signals for human review. Bit Ancestry tracks recurring characters. Ask the Character pairs a clearly labeled fan-made riff with a bounded real performance clip. WWAM Court remains an open argument board until both sides pass the canon gate.",
      proof: "CONNECTED MEMORY WITH A VISIBLE TRUST FIREWALL — DISCOVERY IS NOT QUIETLY UPGRADED INTO CANON.",
      action: { kind: "lore", label: "OPEN THE LOOMIS CONSTELLATION", entry: "character:loomis" },
    },
    {
      number: "04",
      eyebrow: "THE MONEY",
      title: "MEMORY CREATES<br>NEW INVENTORY.",
      body: "The same receipt inventory now produces Shorts candidates, supercut spines, then/now callbacks, and 117 exact-runtime cold-open storyboards. Each one keeps a source ledger, proposed cut boundaries, risk, evidence, and the human approval gate.",
      proof: "ARCHIVE MEMORY → REVIEWABLE EDIT PLAN → EXACT SOURCE LEDGER → CREATOR DECISION.",
      action: {
        kind: "clip",
        mode: "cold-open",
        duration: 30,
        label: "BUILD A 30-SECOND LOOMIS COLD OPEN",
        query: "Dr. Loomis",
      },
    },
    {
      number: "05",
      eyebrow: "THE ASK",
      title: "THIS IS THE DEMO.<br>THE SYSTEM IS THE PRODUCT.",
      body: "The creator-facing Control Room shows what the latest stream added to indexed memory, what an editor should verify, which older uploads just became relevant, and which moments can become tomorrow's compilation, Short, membership perk, or merch callback.",
      proof: "THE CHANNEL'S HISTORY STOPS BEING STORAGE AND STARTS COMPOUNDING.",
      action: { kind: "canon", label: "WATCH THE MACHINE REJECT A CLAIM", tab: "claims" },
    },
  ];

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

  function bagButton(item, label) {
    var normalizedItem = normalizeEvidenceItem(item);
    var source = normalizedItem.source || (itemById[normalizedItem.id] ? "commentary" : "livestream");
    var id = normalizedItem.id;
    if (!id) return "";
    var at = normalizedItem.at;
    var title = normalizedItem.title;
    var category = normalizedItem.category;
    var excerpt = normalizedItem.excerpt;
    var buttonLabel = label || "BAG THIS RECEIPT";
    return '<button class="bag-add" data-bag-add data-default-label="' + esc(buttonLabel + " +") +
      '" data-source="' + esc(source) + '" data-id="' + esc(id) +
      '" data-time="' + at + '" data-title="' + esc(title) + '" data-category="' + esc(category) +
      '" data-excerpt="' + esc(excerpt) + '" data-evidence-level="' + esc(normalizedItem.evidenceLevel) +
      '" data-evidence-type="' + esc(normalizedItem.evidenceType) + '">' + esc(buttonLabel) + ' +</button>';
  }

  function readBagButton(button) {
    return normalizeEvidenceItem({
      source: button.getAttribute("data-source") || "livestream",
      id: button.getAttribute("data-id"),
      at: Number(button.getAttribute("data-time") || 0),
      title: button.getAttribute("data-title") || "WWAM SOURCE",
      category: button.getAttribute("data-category") || "SOURCE RECEIPT",
      excerpt: button.getAttribute("data-excerpt") || "",
      evidenceLevel: button.getAttribute("data-evidence-level") || "",
      evidenceType: button.getAttribute("data-evidence-type") || "",
      savedAt: new Date().toISOString(),
    });
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
    showToast(existing ? "ALREADY IN THE EVIDENCE BAG" :
      persisted ? "RECEIPT BAGGED" : "RECEIPT BAGGED // THIS TAB ONLY");
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
    document.getElementById("evidenceBagOpen").setAttribute("aria-expanded", state.bagOpen ? "true" : "false");
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
        esc(displayUiText(item.title)) + '</h3><p><small>' + esc(displayUiText(item.evidenceLevel)) + '</small>' +
        (isCaptionReceipt ? '“' + esc(evidenceCopy) + '”' : esc(evidenceCopy)) +
        '</p><footer><button data-bag-play="' + esc(bagKey(item)) + '">PLAY RECEIPT →</button><button data-bag-remove="' +
        esc(bagKey(item)) + '">REMOVE</button></footer></article>';
    }).join("") : '<div class="evidence-bag-empty"><b>THE BAG IS EMPTY.</b><span>Add receipts from Ask WWAM, the Memory OS, character archaeology, and the creator tools.</span></div>';
    Array.prototype.forEach.call(document.querySelectorAll("[data-bag-play]"), function (button) {
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
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      excerptWordLimit: 16,
      disclaimer: "Bounded source-linked navigation receipts. Caption text requires source verification; derived summaries are labeled and are not quotations.",
      clips: state.evidenceBag.map(function (item, index) {
        return {
          order: index + 1,
          sourceId: item.id,
          sourceType: item.source,
          title: item.title,
          category: item.category,
          evidenceLevel: item.evidenceLevel,
          evidenceType: item.evidenceType,
          start: Math.round(item.at),
          url: "https://www.youtube.com/watch?v=" + item.id + "&t=" + Math.round(item.at) + "s",
          excerpt: boundedExcerpt(item.excerpt),
        };
      }),
    };
  }

  function copyEvidenceManifest() {
    var manifest = evidenceManifest();
    var lines = ["WWAM EVIDENCE BAG // " + manifest.clips.length + " RECEIPTS"].concat(manifest.clips.map(function (clip) {
      return String(clip.order).padStart(2, "0") + ". " + clip.title + " // " + clip.category +
        " // " + timestamp(clip.start) + " // " + clip.url;
    }));
    copy(lines.join("\n"));
  }

  function downloadEvidenceManifest() {
    var blob = new Blob([JSON.stringify(evidenceManifest(), null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "wwam-evidence-bag.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
    return applyLanguageMode(value);
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
    var sourceCount = meta.tapes + (liveMeta.streams || 0) + (popularMeta.streams || 0);
    var words = meta.wordsAudited + (liveMeta.wordsAudited || 0) + (popularMeta.wordsAudited || 0);
    var hours = meta.captionHours + (liveMeta.hours || 0) + (popularMeta.hours || 0);
    var moments = meta.hotMoments + (liveMeta.moments || 0) + (popularMeta.moments || 0);
    document.getElementById("proof").innerHTML = [
      ["SOURCES", showcaseMetric("sources", sourceCount), "COMMENTARIES + FRESH 10 + POPULAR 25"],
      ["WORDS AUDITED", fmt(showcaseMetric("wordsAudited", words)), "AVAILABLE CAPTIONS"],
      ["HOURS", hours, "UNDER THE KNIFE"],
      ["EDITORIAL RECEIPTS", showcaseMetric("receipts", moments), "PLAYABLE SOURCE MOMENTS"],
      ["MEMORY NODES", showcaseMetric("nodes", (liveMeta.topics || 0) + (popularMeta.topics || 0)), "CONNECTED, NOT JUST TAGGED"],
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
      '<div><span>' + esc(displayUiText(moment.category)) + '</span><b>' +
      esc(displayUiText(item.film)) + ' @ ' + timestamp(moment.t) + '</b></div>' +
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
        esc(displayUiText(moment.category)) + '</span><i>' + timestamp(moment.t) + '</i></div>' +
        '<blockquote>“' + esc(displayQuote(moment.quote)) + '”</blockquote>' +
        '<p>' + esc(displayUiText(categoryCopy[moment.category] || "A source-linked evidence fragment.")) + '</p>' +
        '<footer><div><span>' + esc(displayUiText(item.franchise)) + '</span><b>' +
        esc(displayUiText(item.film)) + '</b></div>' +
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
      '<div class="sound-video"><iframe src="https://www.youtube.com/embed/' + encodeURIComponent(item.id) +
      '?autoplay=1&rel=0&start=' + Math.max(0, Math.round(item.t)) +
      '&end=' + Math.max(1, Math.round(item.t) + 14) +
      '" title="WWAM source soundbyte" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
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
        description: profile.description || profile.summary || profile.profile || "A recurring WWAM character bit reconstructed from source performances.",
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
      return "I've spent years trying to warn you about " + topic + ". You want an explanation. I am telling you there is no explanation. There is only evil—and apparently nobody thought to lock the door.";
    }
    if (id.indexOf("challis") >= 0) {
      return "Wait a minute. " + topic + "? Turn off the television, get away from the mask, and somebody please tell me why no one is listening until eight seconds before disaster.";
    }
    if (id.indexOf("slender") >= 0) {
      return "You asked about " + topic + ". The trees have already answered. Please stop looking behind you. It is making this unnecessarily awkward.";
    }
    if (id.indexOf("feldman") >= 0) {
      return topic + " needs commitment, choreography, and the absolute confidence to keep performing after everyone else has realized this became a completely different scene.";
    }
    return "The recurring bit has reviewed " + topic + " and reached a conclusion no responsible witness is prepared to place on the record.";
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
    return {
      source: receipt.source || receipt.sourceType || (itemById[receipt.id || receipt.sourceId] ? "commentary" : "livestream"),
      id: receipt.sourceId || receipt.videoId || receipt.id,
      t: Number(playback.start != null ? playback.start :
        receipt.t != null ? receipt.t : receipt.time || receipt.timestamp || 0),
      end: Number(playback.end != null ? playback.end : 0),
      clipSeconds: Number(playback.clipSeconds != null ? playback.clipSeconds : 0),
      title: receipt.sourceTitle || receipt.title || receipt.label || "WWAM CHARACTER PERFORMANCE",
      category: receipt.trigger || "CHARACTER PERFORMANCE",
      quote: receipt.quote || receipt.excerpt || receipt.text || "Open the source performance.",
      label: receipt.label || receipt.title || receipt.note || receipt.context || "SOURCE PERFORMANCE",
      confidence: receipt.confidence != null ? Math.round(Number(receipt.confidence) * 100) + "% CURATION CONFIDENCE" :
        receipt.attributionConfidence || "SOURCE-LINKED",
    };
  }

  function renderCharacterRoster() {
    var profiles = characterProfiles();
    var locked = characterLore.lockedCandidates || [];
    if (!profiles.length) {
      document.getElementById("characterRoster").innerHTML = '<p class="character-empty">CHARACTER ARCHAEOLOGY IS STILL PROCESSING.</p>';
      return;
    }
    if (!state.character || !profiles.some(function (profile) { return profile.id === state.character; })) {
      state.character = profiles[0].id;
    }
    document.getElementById("characterRoster").innerHTML = profiles.map(function (profile, index) {
      return '<button class="' + (profile.id === state.character ? "on" : "") + '" data-character="' + esc(profile.id) +
        '"><span>WITNESS 0' + (index + 1) + '</span><b>' + esc(profile.name) + '</b><i>' +
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
        document.getElementById("characterAnswer").innerHTML =
          "<p>Ask this recurring character a question. The generated riff will expose its behavioral ingredients and matched source receipt.</p>";
        renderCharacterRoster();
        renderCharacter();
      };
    });
  }

  function renderCharacter() {
    var profile = characterProfiles().filter(function (candidate) { return candidate.id === state.character; })[0];
    if (!profile) return;
    var behaviors = (profile.behaviors || []).slice(0, 5);
    var triggers = (profile.triggers || []).slice(0, 4);
    var allReceipts = (profile.soundbytes || []).map(normalizeCharacterReceipt).filter(function (receipt) { return receipt.id; });
    var receipts = allReceipts.slice(0, 6);
    document.getElementById("characterLine").textContent =
      displayUiText(profile.name + " // " + profile.performer);
    document.getElementById("characterPortrait").innerHTML =
      '<div><span>RECURRING BIT PROFILE</span><b>' + esc(displayUiText(profile.name)) + '</b><i>' +
      esc(displayUiText(profile.performer)) +
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
    document.getElementById("characterReceiptLabel").textContent = "SHOWING " + receipts.length + " OF " +
      allReceipts.length + " TIMESTAMP-VALIDATED CHARACTER RECEIPTS";
    document.getElementById("characterReceipts").innerHTML = receipts.length ? receipts.map(function (receipt, index) {
      return '<article><div><span>VOICEPRINT 0' + (index + 1) + '</span><b>' + timestamp(receipt.t) +
        '</b></div><h3>' + esc(displayUiText(receipt.label)) + '</h3><p>“' + esc(displayQuote(receipt.quote)) +
        '”</p><footer><span>' + esc(String(receipt.confidence).toUpperCase()) +
        ' // CLIP SPEAKER NOT DIARIZED' +
        '</span><button data-character-source="' + esc(receipt.source) + '" data-id="' + esc(receipt.id) +
        '" data-time="' + receipt.t + '" data-end="' + receipt.end + '" data-label="' +
        esc(displayUiText(receipt.label)) + '">HEAR ' +
        (receipt.clipSeconds ? receipt.clipSeconds + ' SEC' : 'THE') + ' REAL BIT →</button>' +
        bagButton(receipt, "BAG THE BIT") + '</footer></article>';
    }).join("") : '<p class="character-empty">No defensible public soundbyte has cleared attribution yet. The profile remains visible; the archive does not counterfeit proof.</p>';
    bindCharacterReceipts();
    syncBagButtons();
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
    var receipt = response && response.receipt ? normalizeCharacterReceipt(response.receipt) : null;
    if (response) state.characterContext = response;
    state.lastCharacterRiff = riff;
    document.getElementById("characterAnswer").innerHTML =
      '<div><span>FAN-MADE GENERATED RIFF' +
      (response ? ' // ' + esc(response.intent.toUpperCase()) : '') +
      '</span><b>NOT AN ARCHIVAL QUOTE // NOT THE HOST SPEAKING</b></div>' +
      '<blockquote>“' + esc(displayGeneratedText(riff)) + '”</blockquote><footer><span>BEHAVIORAL INGREDIENTS</span><b>' +
      esc(displayUiText(behaviors.length ?
        behaviors.join(" + ").toUpperCase() : "RECURRING CHARACTER PATTERN")) +
      '</b></footer>' + (response ? '<section class="character-grounding"><div><span>ENGINE READ</span><b>' +
        esc(displayUiText(response.continuedFrom ? "FOLLOW-UP MEMORY KEPT THE SAME SUBJECT" :
          "SUBJECT // " + response.subject.toUpperCase())) + '</b><i>' +
        response.readiness.confidence + '% CHARACTER-READINESS // ' +
        (response.readiness.timestampValidatedReceipts || response.readiness.verifiedSoundbytes) +
        ' TIMESTAMP-VALIDATED CHARACTER RECEIPTS // CLIP SPEAKERS NOT DIARIZED</i></div>' +
        (receipt ? '<button data-character-source="' + esc(receipt.source) +
        '" data-id="' + esc(receipt.id) + '" data-time="' + receipt.t + '" data-end="' + receipt.end +
        '" data-label="' + esc(displayUiText(receipt.label)) +
        '">HEAR THE MATCHED REAL BIT →</button>' : '') +
        '</section>' : '');
    bindCharacterReceipts();
  }

  function refreshCharacterAnswerCopy() {
    if (!state.lastCharacterRiff) return;
    var characterQuote = document.querySelector("#characterAnswer blockquote");
    if (characterQuote) {
      characterQuote.textContent = "“" + displayGeneratedText(state.lastCharacterRiff) + "”";
    }
    if (!state.characterContext) return;
    var ingredients = document.querySelector("#characterAnswer > footer b");
    if (ingredients) {
      ingredients.textContent = displayUiText(
        (state.characterContext.ingredients || []).join(" + ").toUpperCase() ||
        "RECURRING CHARACTER PATTERN"
      );
    }
    var grounding = document.querySelector("#characterAnswer .character-grounding div b");
    if (grounding) {
      grounding.textContent = displayUiText(state.characterContext.continuedFrom ?
        "FOLLOW-UP MEMORY KEPT THE SAME SUBJECT" :
        "SUBJECT // " + String(state.characterContext.subject || "").toUpperCase());
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
    var peak = (stream.moments || []).slice().sort(function (a, b) { return (b.heat || b.score || 0) - (a.heat || a.score || 0); })[0];
    return '<article class="stream-card ' + (!stream.captioned ? "unmapped" : "") + '" data-live-id="' + stream.id + '">' +
      '<div class="stream-thumb"><img loading="lazy" src="' + esc(stream.thumbnail) + '" alt="' +
      esc(stream.title + " livestream thumbnail") + '"><span>LIVE 0' +
      (index + 1) + ' // ' + shortDate(stream.date) + '</span><b>' + duration(stream.duration) + '</b></div>' +
      '<div class="stream-body"><div><i class="' + (stream.captioned ? "" : "sealed") + '">' +
      (stream.captioned ? "FULL LIVE MAP" : "MAPPING UNAVAILABLE") + '</i><span>' + fmt(stream.wordsAudited) + ' WORDS</span></div>' +
      '<h3>' + esc(stream.title) + '</h3><p>' + esc(stream.summary) + '</p>' +
      '<div class="stream-topics">' + (topics.length ? topics.map(function (topic) {
        return '<button data-stream-topic="' + esc(topic.name) + '" data-live-id="' + stream.id + '" data-time="' +
          topic.peak + '">' + esc(topic.name) + ' <b>' + timestamp(topic.peak) + '</b></button>';
      }).join("") : '<span>THE SOURCE IS LIVE. THE CAPTION MAP IS NOT.</span>') + '</div>' +
      miniHeat(stream) + '<footer><span>' + (peak ? 'PEAK COMEDY // ' + timestamp(peak.t) + ' // ' + esc(peak.category) : 'ORIGINAL STREAM AVAILABLE') +
      '</span><button aria-label="Open live map for ' + esc(stream.title) + '">OPEN LIVE MAP →</button></footer></div></article>';
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
      [meta.streams || popular.streams.length, "FOUNDATIONAL STREAMS"],
      [fmt(meta.viewsAtSnapshot || meta.views || popular.streams.reduce(function (total, stream) { return total + Number(stream.views || 0); }, 0)), "COMBINED VIEWS"],
      [meta.captioned || popular.streams.filter(function (stream) { return stream.captioned; }).length, "FULL LIVE MAPS"],
      [fmt(meta.wordsAudited || 0), "WORDS AUDITED"],
      [meta.hours || 0, "HOURS ON AIR"],
      [meta.moments || 0, "COMEDY RECEIPTS"],
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
    return '<article class="popular-card ' + (!stream.captioned ? "unmapped" : "") + '" data-popular-id="' +
      esc(stream.id) + '"><div class="popular-rank"><b>#' + String(rank).padStart(2, "0") +
      '</b><span>' + fmt(stream.views) + ' VIEWS @ ' +
      esc((popular.selection && popular.selection.snapshot) || popular.generated || "SNAPSHOT") +
      '</span></div><div class="popular-image"><img loading="lazy" src="' +
      esc(stream.thumbnail) + '" alt="' + esc(stream.title + " livestream thumbnail") + '"><span>' +
      shortDate(stream.date) + ' // ' + duration(stream.duration) +
      '</span></div><div class="popular-body"><div><i>' + (stream.captioned ? "FOUNDATIONAL LIVE MAP" : "SOURCE VISIBLE // MAP SEALED") +
      '</i><b>' + fmt(stream.wordsAudited) + ' WORDS</b></div><h3>' + esc(stream.title) +
      '</h3><p class="popular-why"><span>WHY IT MATTERS' +
      (stream.editorial && stream.editorial.showShape ? ' // ' + esc(stream.editorial.showShape) : '') + '</span>' +
      esc(safeEditorialCopy(stream.whyItMatters || stream.why_it_matters ||
        (stream.editorial && stream.editorial.whyItMatters) ||
        stream.summary || "A high-gravity WWAM livestream in the foundational live canon.")) +
      '</p><div class="popular-topic-row">' + topics.map(function (topic) {
        return '<button data-popular-jump="' + esc(stream.id) + '" data-time="' + Number(topic.peak || topic.t || 0) +
          '">' + esc(topic.name) + ' <b>' + timestamp(topic.peak || topic.t || 0) + '</b></button>';
      }).join("") + '</div>' + (sightings.length ? '<div class="character-sightings"><span>CHARACTER INDEX SIGNALS // NOT ATTRIBUTION</span><b>' +
        sightings.map(function (sighting) {
          return esc((sighting.name || sighting.character || sighting) + " — " + characterSignalLabel(sighting));
        }).join(" // ") +
        '</b></div>' : '') + miniHeat(stream) + '<footer><span>' +
      (peak ? 'PEAK COMEDY // ' + timestamp(peak.t) + ' // ' + esc(peak.category) : 'ORIGINAL SOURCE READY') +
      '</span><button aria-label="Open foundational autopsy for ' + esc(stream.title) +
      '">OPEN FOUNDATIONAL AUTOPSY →</button></footer></div></article>';
  }

  function renderPopular() {
    var list = filteredPopular();
    document.getElementById("popularStatus").textContent = list.length + " OF " + popular.streams.length +
      " FOUNDATIONAL STREAMS // VIEW SNAPSHOT " +
      ((popular.selection && popular.selection.snapshot) || popular.generated || "RECORDED");
    document.getElementById("popularGrid").innerHTML = list.length ? list.map(popularCard).join("") :
      '<p class="popular-empty">NO FOUNDATIONAL STREAM MATCHES THAT SEARCH.</p>';
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
      '<div class="tape-image"><img loading="lazy" src="' + esc(item.thumbnail) + '" alt="' +
      esc(item.film + " commentary thumbnail") + '"><span>' +
      esc(item.franchise) + '</span><b>' + duration(item.duration) + '</b></div>' +
      '<div class="tape-body"><div><span>TAPE ' + String(item.order).padStart(2, "0") + ' // ' + shortDate(item.date) +
      '</span><i class="' + (sealed ? "sealed" : "") + '">' + (sealed ? "TAPE SEALED" : "FULL DISTILL") + '</i></div>' +
      '<h3>' + esc(item.film) + '</h3><p>' + esc(tape.verdict || "Age gate prevents a defensible caption distill. The original tape remains linked.") + '</p>' +
      '<footer><span><b>' + (sealed ? "—" : tape.unhinged) + '</b>UNHINGED</span><span><b>' +
      (sealed ? "—" : fmt(tape.wordsAudited)) + '</b>WORDS</span><button aria-label="Open tape autopsy for ' +
      esc(item.film) + '">OPEN AUTOPSY →</button></footer>' +
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
    rememberDialogFocus();
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
    syncBackgroundInert();
    focusSoon("#modalClose");
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
    rememberDialogFocus();
    var lane = stream._lane === "popular" ? "FOUNDATIONAL 25" : "FRESH 10";
    var laneList = stream._lane === "popular" ? popular.streams : live.streams;
    var laneRank = laneList.indexOf(stream) + 1;
    var peak = stream.moments.slice().sort(function (a, b) { return b.heat - a.heat; })[0];
    var streamSummary = safeEditorialCopy(stream.summary || stream.whyItMatters ||
      (stream.editorial && stream.editorial.whyItMatters) ||
      "This source remains in the archive with an honest, playable path back to the original upload.");
    var modal = document.getElementById("tapeModal");
    document.getElementById("modalContent").innerHTML =
      '<div class="modal-hero live-modal-hero" style="--accent:var(--cyan)"><img src="' + esc(stream.thumbnail) +
      '" alt=""><div><p>' + lane + ' // LIVE MAP ' + String(laneRank).padStart(2, "0") +
      '</p><h2>' + esc(stream.title) + '</h2><span>' + shortDate(stream.date) + ' // ' +
      duration(stream.duration) + ' // ' + fmt(stream.views) + ' VIEWS</span></div></div>' +
      '<div class="modal-grid live-modal-grid"><section class="modal-verdict"><p class="kicker">THE LIVE-ROOM AUTOPSY</p><blockquote>' +
      esc(streamSummary) + '</blockquote><div class="live-peak"><b>' + (peak ? peak.heat : "—") +
      '</b><span>PEAK<br>COMEDY HEAT</span></div><div class="source-actions"><a href="' + esc(stream.url) +
      '" target="_blank" rel="noopener">OPEN ORIGINAL ON YOUTUBE ↗</a><button data-share-live="' + stream.id +
      '">COPY LIVE MAP</button></div></section><section class="live-topic-index"><p class="kicker">JUMP TO A TOPIC // ' +
      fmt(stream.wordsAudited) + ' WORDS AUDITED</p><ol>' + liveTopicsMarkup(stream) + '</ol></section></div>' +
      '<section class="heat-section live-heat-section"><div><p class="kicker">THE 30-CHAPTER FUNNY-MOMENT HEAT MAP</p>' +
      '<span>CLICK ANY BAR TO JUMP THERE // HEIGHT = COMEDY-SIGNAL DENSITY</span></div><div class="live-heatmap">' +
      liveHeatMarkup(stream) + '</div></section>' +
      '<section class="receipt-section"><div><p class="kicker">' +
      (stream._lane === "popular" ? "FOUNDATIONAL CHAOS" : "FRESHLY UNWELL") + ' // SOURCE RECEIPTS</p>' +
      '<span>SHORT AUTO-CAPTION FRAGMENTS // VERIFY AGAINST ORIGINAL</span></div><div class="modal-player" id="modalPlayer">' +
      '<div><span>SELECT A TOPIC, HEAT BAR, OR COMEDY HIT TO CUE THE STREAM.</span></div></div><div class="receipt-list">' +
      liveMomentsMarkup(stream) + '</div></section>';
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    syncBackgroundInert();
    focusSoon("#modalClose");
    bindLivePlayButtons(document.getElementById("modalContent"));
    bindLiveShareButtons(document.getElementById("modalContent"));
    if (startTime != null) loadPlayer(stream.id, Number(startTime));
    history.replaceState(null, "", "?live=" + encodeURIComponent(stream.id) +
      (startTime != null ? "&at=" + Math.round(startTime) : "") +
      (stream._lane === "popular" ? "#popular25" : "#livewire"));
  }

  function openLooseSource(id, startTime, label, endTime) {
    if (!id) return;
    rememberDialogFocus();
    var at = Number(startTime || 0);
    var end = Number(endTime || 0);
    var clipSeconds = end > at ? Math.round(end - at) : 0;
    var modal = document.getElementById("tapeModal");
    document.getElementById("modalContent").innerHTML =
      '<div class="modal-hero live-modal-hero" style="--accent:var(--pink)"><img src="https://i.ytimg.com/vi/' +
      encodeURIComponent(id) + '/maxresdefault.jpg" alt=""><div><p>CHARACTER ARCHAEOLOGY // SOURCE PERFORMANCE</p><h2>' +
      esc(label || "WWAM SOURCE RECEIPT") + '</h2><span>' +
      (clipSeconds ? "BOUNDED " + clipSeconds + "-SECOND SOURCE CLIP" : "PLAYABLE ORIGINAL") + " // " + timestamp(at) +
      '</span></div></div><section class="receipt-section loose-source"><div><p class="kicker">THE ORIGINAL PERFORMANCE</p>' +
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
    player.innerHTML = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&start=' +
      Math.max(0, Math.round(at || 0)) + (Number(end || 0) > Number(at || 0) ? '&end=' + Math.round(end) : '') +
      '" title="WWAM commentary source playback" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    player.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function closeDossier() {
    var modal = document.getElementById("tapeModal");
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    syncBackgroundInert();
    var url = new URL(window.location.href);
    url.searchParams.delete("tape");
    url.searchParams.delete("live");
    url.searchParams.delete("at");
    history.replaceState(null, "", url.pathname + url.hash);
    restoreDialogFocus();
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
    url.hash = streamById[id] && streamById[id]._lane === "popular" ? "popular25" : "livewire";
    url.searchParams.set("live", id);
    if (at != null) url.searchParams.set("at", Math.round(at));
    return url.toString();
  }

  function copy(value, message) {
    var notice = message || "LINK COPIED TO THE EVIDENCE BAG";
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
          // Some embedded browsers block prompts as well as clipboard writes.
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

  function showToast(message) {
    var toast = document.getElementById("toast");
    if (typeof message === "string" && message) toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }

  function renderAskExamples() {
    var examples = (askEngine.examples || curated.askExamples || []).concat([
      "What is the most-viewed foundational livestream?",
      "Did their opinion on Halloween change?",
    ]).slice(0, 8);
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

  function applyOwnerMappedCharacterKnowledge(analysis, query) {
    var asksPerformer = /\bwho\s+(did|does|plays?|played|portrays?|portrayed|performs?|performed)\b|\b(character\s+performer|played\s+by|performed\s+by|portrayed\s+by)\b/i.test(query);
    if (!asksPerformer || analysis.entityType !== "character" || !analysis.entity) return;
    var entity = String(analysis.entity).toLowerCase();
    var profile = characterProfiles().filter(function (candidate) {
      var names = [candidate.name, candidate.id].concat(candidate.aliases || []);
      return names.some(function (name) {
        var normalized = String(name || "").toLowerCase();
        return normalized && (normalized.indexOf(entity) >= 0 || entity.indexOf(normalized) >= 0);
      });
    })[0];
    var performer = profile && (profile.performedBy || profile.performer);
    if (!performer || /unknown|recurring performance/i.test(performer)) return;
    analysis.answer = "Project owner mapping identifies " + performer + " as the recurring performer behind " +
      profile.name + ". That owner-supplied identity applies to the recurring character; the linked auto-caption receipt is not speaker-diarized and cannot prove who speaks in any individual clip.";
    analysis.confidenceBasis = ["owner-supplied recurring-character mapping"].concat(analysis.confidenceBasis || []);
    analysis.limitations = [
      "Owner mapping and clip-level speaker diarization are separate evidence layers.",
    ].concat(analysis.limitations || []);
    analysis.recommendedSurface = {
      id: "lore",
      href: "#lore",
      label: "Lore / Character Lab",
      reason: "Open the curated performance lineage and its attribution basis.",
    };
  }

  function askShareUrl(query) {
    var url = new URL(location.href);
    url.searchParams.delete("tape");
    url.searchParams.delete("live");
    url.searchParams.delete("at");
    url.searchParams.set("ask", String(query || "").slice(0, 240));
    url.hash = "ask";
    return url.toString();
  }

  function ask(query, preservedAnalysis) {
    var analysis = preservedAnalysis || askEngine.ask(query, state.askContext);
    if (!preservedAnalysis) applyOwnerMappedCharacterKnowledge(analysis, query);
    var results = analysis.results || [];
    var roleByKey = {};
    (analysis.evidenceChain || []).forEach(function (entry) {
      if (entry.result && entry.result.key) roleByKey[entry.result.key] = entry.role;
    });
    state.askContext = {
      entity: analysis.entity,
      intent: analysis.intent,
      source: analysis.source,
      query: query,
    };
    state.lastAskQuery = query;
    state.lastAskAnalysis = analysis;
    document.getElementById("askStatus").textContent = results.length ?
      (analysis.evidenceChain || []).length + " RECEIPT CHAIN // " + analysis.confidence +
      (analysis.status === "archive-boundary" ? "% RETRIEVAL // CLAIM NOT ESTABLISHED" : "% CONFIDENCE") :
      "NO DEFENSIBLE RECEIPT";
    var boundary = '<section class="ask-boundary ' + esc(analysis.status || "unknown") +
      '"><header><span>ANSWER STATUS // ' + esc(String(analysis.status || "UNKNOWN").toUpperCase()) +
      '</span><b>' + esc(String(analysis.questionType || analysis.intent || "QUERY").toUpperCase()) +
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
        esc(displayUiText(analysis.recommendedSurface.reason)) + '</span></a>' : "") + '</section>';
    document.getElementById("askResults").innerHTML =
      '<section class="answer-brief"><div><span>INTENT // ' + esc(analysis.intent.toUpperCase()) + '</span><b>' +
      (analysis.entity ? 'ENTITY // ' + esc(displayUiText(analysis.entity.toUpperCase())) : 'ENTITY // OPEN') + '</b><i>' +
      esc((analysis.source === "all" ? "ALL SOURCES" : analysis.source).toUpperCase()) +
      (analysis.continuedFrom ? ' // FOLLOW-UP MEMORY' : '') +
      '</i><button class="ask-share" type="button" data-copy-ask>COPY ANSWER LINK</button></div><h3>' +
      esc(displayUiText(analysis.answer)) + '</h3><div class="confidence-track"><i style="width:' + analysis.confidence +
      '%"></i></div></section>' + boundary +
      (results.length ? results.map(function (result, index) {
        var role = roleByKey[result.key] || (index === 0 ? "DIRECT HIT" : result.label);
        var excerpt = askExcerpt(result);
        var isCaptionReceipt = String(result.evidenceType || "").indexOf("caption") >= 0 ||
          result.evidenceLevel === "TIMESTAMPED CAPTION RECEIPT";
        var excerptMarkup = isCaptionReceipt ?
          "“" + esc(displayQuote(excerpt)) + "”" :
          '<b class="derived-answer-copy">' + esc(displayQuote(excerpt)) + '</b>';
        return '<article class="' + (index === 0 ? "best" : "") + '"><div><span>' +
          esc(displayUiText(role)) + '</span><b>' +
          esc(displayUiText((result.lane === "popular" ? "POPULAR 25" : result.source).toUpperCase())) +
          '</b></div><h3>' + esc(displayUiText(result.title)) + '</h3><p><span>' +
          esc(displayUiText(result.evidenceLevel || "TIMESTAMPED SOURCE RECEIPT")) + '</span>' +
          excerptMarkup + '</p><div class="why-row"><span>WHY THIS RANKED</span><b>' +
          esc(displayUiText(result.reasons.length ?
            result.reasons.join(" + ").toUpperCase() : "TEXTUAL EVIDENCE")) +
          '</b></div>' + ((result.evidenceWarnings || []).length ? '<ul class="result-warnings">' +
            result.evidenceWarnings.slice(0, 3).map(function (warning) {
              return '<li>' + esc(displayUiText(warning)) + '</li>';
            }).join("") + '</ul>' : "") + (result.trajectoryEvidence ?
            '<div class="trajectory-signal"><span>MACHINE-SURFACED TAKE SIGNAL</span><b>' +
            esc(displayUiText((result.trajectoryEvidence.evaluativeTerms || []).join(" + ").toUpperCase())) +
            ' // TARGET: ' +
            esc(displayUiText((result.trajectoryEvidence.targetTerms || []).join(" + ").toUpperCase())) +
            '</b><i>NOT A HOST-LEVEL OPINION CLAIM</i></div>' : "") +
          '<footer><span>' + esc(displayUiText(result.category)) + ' // ' +
          timestamp(result.at || 0) + ' // SPEAKER ' + (result.speaker ? "VERIFIED" : "NOT DIARIZED") +
          '</span><button data-ask-source="' + esc(result.source) + '" data-id="' + esc(result.sourceId) +
          '" data-time="' + Number(result.at || 0) + '">SHOW ME →</button>' +
          bagButton(Object.assign({}, result, { excerpt: excerpt }), "BAG IT") +
          '</footer></article>';
      }).join("") : '<div class="ask-no-match"><b>THE ARCHIVE REFUSED TO MAKE SOMETHING UP.</b><p>No confident match in the current source scope.</p>' +
        (analysis.suggestions || []).map(function (suggestion) {
          return '<button data-ask-suggestion="' + esc(suggestion) + '">' +
            esc(displayUiText(suggestion)) + '</button>';
        }).join("") + '</div>');
    Array.prototype.forEach.call(document.querySelectorAll("#askResults [data-ask-source]"), function (button) {
      button.onclick = function () {
        if (button.getAttribute("data-ask-source") === "livestream") {
          openLiveDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time") || 0));
        } else {
          openDossier(button.getAttribute("data-id"), Number(button.getAttribute("data-time") || 0));
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
    syncBagButtons();
  }

  function showcaseCall(method, fallback, args) {
    if (showcaseEngine && typeof showcaseEngine[method] === "function") {
      try {
        var result = showcaseEngine[method].apply(showcaseEngine, args || []);
        if (result != null) return result;
      } catch {
        // The public showcase remains usable if an optional derived surface fails.
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
    if (!machines.length) return '<p class="memory-empty">THE TIME MACHINE NEEDS MORE VERIFIED EVENTS.</p>';
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
      esc(state.memoryEntity) + '</h3><p>Follow a machine-surfaced chronological receipt trail. These stops suggest where a take may deserve review; they do not prove a host changed their final opinion.</p><b>' +
      events.length + ' TIMESTAMP-VERIFIED STOPS // TAKE INFERENCE</b></div><div class="time-track">' + events.slice(0, 10).map(function (event) {
        return '<article><i></i><div><span>' + esc(event.date ? shortDate(event.date) : "DATE IN SOURCE") + ' // ' +
          esc(event.category || "RECEIPT") + '</span><h4>' + esc(event.title || state.memoryEntity) + '</h4><p>“' +
          esc(displayQuote(event.excerpt || event.quote || "")) + '”</p>' + evidenceButton(event, "ENTER THIS MOMENT") +
          '</div></article>';
      }).join("") + '</div></div>';
  }

  function renderBitAncestry() {
    var lineages = showcaseCall("getBitLineages", fallbackBitLineages);
    if (!Array.isArray(lineages)) lineages = lineages.items || lineages.bits || [];
    if (!lineages.length) return '<p class="memory-empty">NO RECURRING BIT HAS ENOUGH VERIFIED SIGHTINGS YET.</p>';
    var selected = lineages[0];
    var events = (selected.events || selected.performances || selected.receipts || selected.sightings || []).map(enrichEvidence);
    return '<div class="bit-intro"><span>BIT ANCESTRY // EARLIEST INDEXED TO LATEST SIGHTING</span><h3>' +
      esc(selected.name || selected.label || selected.bit || "RECURRING BIT") + '</h3><p>' +
      esc(selected.description || "A recurring performance or callback connected across its source appearances.") +
      '</p></div><div class="bit-chain">' + events.slice(0, 12).map(function (event, index) {
        var stage = index === 0 ? "EARLIEST INDEXED SIGHTING" : index === events.length - 1 ? "LATEST SIGHTING" : "MUTATION 0" + index;
          return '<article><span>' + stage + '</span><b>' + esc(event.title || selected.name || selected.label || selected.bit) +
          '</b><p>“' + esc(displayQuote(event.excerpt || event.quote || "")) + '”</p>' +
          evidenceButton(event, "PLAY THE LINEAGE") + '</article>';
      }).join("") + '</div>';
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
    return '<div class="chemistry-head"><span>RIFF VELOCITY IS NOT A PROFANITY COUNTER</span><p>Escalation, room-break signals, callbacks, character sightings, and the speed at which one remark infects the whole conversation.</p></div><div class="chemistry-grid">' +
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
    return '<div class="court-title"><span>MACHINE-SURFACED ARGUMENT BOARD // VERDICT OPEN</span><h3>' +
      esc(court.title || court.caseName || "THE PEOPLE VS. THE FRANCHISE") + '</h3><p>These category signals have not passed strict whole-work opinion review. The board keeps contradictory candidates together so an editor or creator can inspect both sides; it does not declare a host verdict.</p></div><div class="court-grid"><section><header>PROSECUTION CANDIDATES</header>' +
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
      esc(result.winner) + '</h3><p>This is an archive scoreboard, not a claim about the hosts’ final opinion. It compares the categories and intensity of the receipts that survived the current 39-tape distill.</p><button data-copy-battle>STEAL THE SCORECARD →</button></div><div class="battle-ring">' +
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
    var content = state.memoryTab === "time" ? renderTimeMachine() :
      state.memoryTab === "bits" ? renderBitAncestry() :
      state.memoryTab === "chemistry" ? renderChemistry() :
      state.memoryTab === "court" ? renderCourt() :
      state.memoryTab === "battle" ? renderBattle() : renderDescent();
    document.getElementById("memoryStage").innerHTML = content;
    document.getElementById("memoryProof").innerHTML = [
      [showcaseMetric("nodes", 0), "MEMORY NODES"],
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
    return {
      id: receipt.sourceId,
      sourceId: receipt.sourceId,
      source: receipt.lane === "commentary" ? "commentary" : "livestream",
      at: Number(receipt.t || 0),
      t: Number(receipt.t || 0),
      end: Number(receipt.end || 0),
      title: receipt.sourceTitle || receipt.label || "WWAM SOURCE",
      category: receipt.label || receipt.kind || "LORE RECEIPT",
      excerpt: receipt.quote || "",
      date: receipt.date,
    };
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
    document.getElementById("loreDossier").innerHTML =
      '<div class="lore-dossier-top"><div><span>' + esc(entry.kicker || loreKindLabel(entry.kind)) +
      '</span><b>' + esc(loreKindLabel(entry.kind)) + ' // ' + esc(entry.status || "INDEXED") +
      '</b></div><h3>' + esc(entry.name) + '</h3><p>' + esc(entry.summary || "") +
      '</p><blockquote>' + esc(entry.editorialFlavor || entry.deepCutReason || "") + '</blockquote></div>' +
      '<div class="lore-score"><b>' + Number(entry.deepCutScore || 0) + '</b><span>ARCHIVE RARITY</span><i>NOT QUALITY // ' +
      esc(entry.deepCutTier || "ARCHIVE ENTRY") + '</i></div>' +
      '<div class="lore-metrics">' + metricEntries.map(function (metric) {
        return '<div><b>' + fmt(metric[1]) + '</b><span>' +
          esc(String(metric[0]).replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase()) + '</span></div>';
      }).join("") + '</div>' +
      '<div class="lore-basis"><span>WHY THIS IS ALLOWED IN THE GUIDE</span><p>' +
      esc(entry.evidenceBasis || "This entry resolves to indexed source evidence.") + '</p></div>' +
      (first ? '<article class="archive-first"><div><span>' +
        esc(entry.kind === "character" ? "EARLIEST VERIFIED CURRENT-SET RECEIPT" :
          ((entry.originLanguage && entry.originLanguage.label) || "EARLIEST IN INDEXED ARCHIVE")) +
        '</span><b>NOT A TRUE-ORIGIN CLAIM</b></div><h4>' + esc(first.sourceTitle) +
        '</h4><p>“' + esc(displayQuote(first.quote)) + '”</p><div>' +
        evidenceButton(loreReceiptItem({
          sourceId: first.sourceId,
          lane: itemById[first.sourceId] ? "commentary" : "livestream",
          t: first.t,
          sourceTitle: first.sourceTitle,
          label: "EARLIEST INDEXED RECEIPT",
          quote: first.quote,
        }), "OPEN ARCHIVE-FIRST RECEIPT") +
        bagButton(loreReceiptItem({
          sourceId: first.sourceId,
          lane: itemById[first.sourceId] ? "commentary" : "livestream",
          t: first.t,
          sourceTitle: first.sourceTitle,
          label: "EARLIEST INDEXED RECEIPT",
          quote: first.quote,
        }), "BAG IT") + '</div><small>' +
        esc(entry.kind === "character" ?
          "This curated performance and creator-context set is narrower than Ask WWAM's machine-indexed character signals. Neither is proof of the bit's true origin." :
          ((entry.originLanguage && entry.originLanguage.disclaimer) || "Earliest indexed is not proof of first-ever.")) +
        '</small></article>' : "") +
      '<div class="lore-receipts"><div><span>PLAYABLE LORE RECEIPTS</span><b>' +
      (entry.receiptIds || []).length + ' INDEXED</b></div>' +
      receipts.map(function (receipt, index) {
        return memoryReceipt(loreReceiptItem(receipt), index);
      }).join("") + '</div>' +
      '<div class="lore-related"><span>FOLLOW THE THREAD</span>' +
      (trace.nodes || []).filter(function (node) { return node.entryId !== entry.id; }).slice(0, 10).map(function (node) {
        return '<button data-lore-entry="' + esc(node.entryId) + '"><i>' + esc(loreKindLabel(node.kind)) +
          '</i><b>' + esc(node.label) + '</b><span>' + node.receiptCount + ' RECEIPTS</span></button>';
      }).join("") + '</div>';
    renderConstellation(entry, trace);
  }

  function renderConstellation(entry, trace) {
    var nodes = (trace.nodes || []).slice(0, 17);
    var edges = trace.edges || [];
    document.getElementById("constellationTitle").textContent = entry.name + " // " +
      edges.length + " EVIDENCE CONNECTIONS";
    document.getElementById("constellationCopy").textContent =
      "This focused map shows " + Math.max(0, nodes.length - 1) +
      " connected memories. Every relationship keeps receipt IDs; no line claims true origin.";
    document.getElementById("constellationMap").innerHTML =
      '<div class="constellation-nodes">' + nodes.map(function (node, index) {
        return '<button class="' + (node.entryId === entry.id ? "center" : "") +
          '" style="--node:' + index + ';--weight:' + Math.min(6, Number(node.receiptCount || 1)) +
          '" data-lore-entry="' + esc(node.entryId) + '"><span>' + esc(loreKindLabel(node.kind)) +
          '</span><b>' + esc(node.label) + '</b><i>' + node.receiptCount + ' RECEIPTS</i></button>';
      }).join("") + '</div><ol class="constellation-ledger">' +
      edges.slice(0, 12).map(function (edge) {
        var from = loreEngine.getEntry(edge.from);
        var to = loreEngine.getEntry(edge.to);
        return '<li><span>' + esc(from ? from.name : edge.from) + '</span><b>' +
          esc(String(edge.relation || "connected").replace(/-/g, " ").toUpperCase()) +
          '</b><span>' + esc(to ? to.name : edge.to) + '</span><i>' +
          Number(edge.receiptCount || 0) + ' RECEIPT' + (Number(edge.receiptCount || 0) === 1 ? "" : "S") +
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
      [metrics.playableReceipts, "GRAPH RECEIPT LINKS"],
      [metrics.edges, "EVIDENCE CONNECTIONS"],
      [metrics.lineages, "TRACEABLE LINEAGES"],
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
        Number(entry.deepCutScore || 0) + '</b></div><h4>' + esc(displayUiText(entry.name)) + '</h4><p>' +
        esc(displayUiText(entry.editorialFlavor || entry.summary || "")) + '</p><small>' +
        Number((entry.metrics && entry.metrics.receipts) || (entry.receiptIds || []).length) +
        ' RECEIPTS // ' + esc(entry.deepCutTier || "INDEXED") + '</small></button>';
    }).join("") : '<div class="lore-empty"><b>NO MATCHES.</b><span>The machine will not hallucinate a field-guide entry.</span></div>';
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
      '</div><footer><button data-trivia-bag-all>ADD REVEAL TO EVIDENCE BAG +</button><button data-trivia-next>' +
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
      '</b><span>BEST STREAK</span></article></div><p>You were tested on indexed source metadata and bounded caption receipts. No round guessed a speaker or invented a quote.</p><footer><button data-trivia-export>DOWNLOAD SESSION RECEIPTS</button><button data-trivia-restart>PLAY ANOTHER NIGHT SHIFT →</button></footer></div>';
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
    var filters = { limit: 12 };
    if (state.clipQuery.trim()) filters.query = state.clipQuery.trim();
    if (state.clipRisk) filters.maxRisk = state.clipRisk;
    if (state.clipMode === "cold-open") {
      filters.duration = state.coldOpenDuration;
      filters.limit = 24;
      var boards = coldOpenFactory ? coldOpenFactory.getStoryboards(filters) : [];
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
      return boards.slice(0, 8);
    }
    if (state.clipMode === "supercuts") return clipLabEngine.getSupercuts(filters);
    if (state.clipMode === "resurfacing") return clipLabEngine.getResurfacing(filters);
    return clipLabEngine.getShorts(filters);
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
    document.getElementById("clipProof").innerHTML = [
      [metrics.shortCandidates, "SHORTS CANDIDATES"],
      [metrics.supercutBundles, "SUPERCUT SPINES"],
      [metrics.resurfacingOpportunities, "THEN / NOW PAIRS"],
      [coldMetrics.storyboards || 0, "COLD OPEN BOARDS"],
      [metrics.sourcesRepresented, "SOURCES REPRESENTED"],
    ].map(function (stat) {
      return '<div><b>' + fmt(stat[0]) + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-clip-mode]"), function (button) {
      button.classList.toggle("on", button.getAttribute("data-clip-mode") === state.clipMode);
    });
    var values = clipCandidates();
    values.forEach(function (item) {
      clipItemById[item.id] = item;
      (item.segments || []).forEach(function (segment) { clipItemById[segment.id] = segment; });
      if (item.archive) clipItemById[item.archive.id] = item.archive;
      if (item.current) clipItemById[item.current.id] = item.current;
    });
    document.getElementById("clipResults").innerHTML =
      (state.clipMode === "cold-open" ? coldOpenFormatBar() : "") +
      (values.length ? values.map(function (item) {
        if (item.kind === "cold-open-storyboard") return coldOpenCard(item);
        if (item.kind === "supercut-bundle") return supercutCard(item);
        if (item.kind === "episode-resurfacing") return resurfacingCard(item);
        return shortCard(item);
      }).join("") : '<div class="clip-empty"><b>' +
        (state.clipMode === "cold-open" && !coldOpenFactory ?
          "THE COLD OPEN FACTORY COULD NOT INITIALIZE." : "THE RISK GATE ATE THAT SEARCH.") +
        '</b><span>Widen the filter or search a broader topic.</span></div>');
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
      ' SOURCES ARE ARCHIVE-READY.</h3></div><div class="freshness-summary"><p>Structurally invalid or source-ID-mismatched URLs: 0. Invalid indexed timestamps: 0. Limited sources stay visible instead of receiving counterfeit analysis.</p>' +
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
      queue.length + ' OF ' + trustEngine.metrics.reviewCandidates + ' PRIORITY REVIEWS.</h3></div><p>Every row exports a deterministic correction packet containing the current claim, evidence, recommended action, and required reviewer role.</p></div>' +
      '<div class="review-queue">' + queue.map(function (item, index) {
        var evidence = item.evidence && item.evidence[0];
        return '<article><header><b>#' + String(index + 1).padStart(2, "0") + ' // ' +
          esc(item.severity) + '</b><span>' + esc(loreKindLabel(item.kind)) + '</span></header><h3>' +
          esc(item.title) + '</h3><p>' + esc(item.summary) + '</p><blockquote>' +
          esc(item.recommendation) + '</blockquote><footer>' +
          (evidence ? canonEvidenceButton(evidence, "INSPECT RECEIPT") : "") +
          '<button data-correction-packet="' + esc(item.id) + '">COPY CORRECTION PACKET</button></footer></article>';
      }).join("") + '</div>';
  }

  function renderCharacterFirewall() {
    var grounded = trustEngine.characterAudits.grounded || [];
    var locked = trustEngine.characterAudits.locked || [];
    return '<div class="canon-lane-head"><div><span>PERSONA MENTION ≠ CHARACTER PERFORMANCE</span><h3>' +
      trustEngine.metrics.verifiedCuratedPerformances + ' CURATED PERFORMANCES. ' +
      trustEngine.metrics.ordinaryCharacterMentionsQuarantined + ' ORDINARY MENTIONS QUARANTINED.</h3></div><p>Character text parody may be generated with a label. Character audio may not. Individual clip speakers remain unverified unless a human diarizes them.</p></div>' +
      '<div class="firewall-grid">' + grounded.map(function (character) {
        var first = character.soundbytes && character.soundbytes[0];
        return '<article><header><span>GROUNDED CHARACTER</span><b>' +
          Math.round(Number(character.confidence && character.confidence.score || 0)) + ' CONFIDENCE</b></header><h3>' +
          esc(character.name) + '</h3><p>Owner-mapped performer: <b>' + esc(character.performedBy || "UNSET") +
          '</b>. Exact clips are not speaker-diarized.</p><ul><li class="yes">LABELED TEXT PARODY ALLOWED</li>' +
          '<li class="no">GENERATED CHARACTER AUDIO BLOCKED</li><li class="no">UNVERIFIED SPEAKER CREDIT BLOCKED</li></ul>' +
          '<div><b>' + character.verifiedPerformanceIds.length + '</b><span>VERIFIED PERFORMANCE RECEIPTS</span><b>' +
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
    var timelines = trustEngine.timelineAudits.slice().sort(function (a, b) {
      return b.projectedOrAmbiguousReceiptIds.length - a.projectedOrAmbiguousReceiptIds.length;
    }).slice(0, 8);
    var courts = trustEngine.courtAudits.slice(0, 6);
    return '<div class="canon-lane-head warning"><div><span>DISCOVERY CANDIDATES // NOT CREATOR-CERTIFIED CANON</span><h3>0 TAKE TIMELINES AND 0 COURTS CURRENTLY PASS THE STRICT CANON GATE.</h3></div><p>The public Memory OS now describes these as chronological receipt trails and machine-surfaced argument boards. It does not claim a host changed their mind or issue a verdict.</p></div>' +
      '<div class="claim-audit"><section><header><span>TAKE TIMELINE AUDIT</span><b>' +
      trustEngine.metrics.timelines + ' REVIEWED</b></header>' + timelines.map(function (timeline) {
        return '<article><div><h4>' + esc(timeline.subject) + '</h4><b>' +
          timeline.directOpinionReceiptIds.length + '/' + timeline.receipts.length + ' DIRECT</b></div><p>' +
          esc(timeline.safePublicLabel) + '</p><small>' +
          timeline.projectedOrAmbiguousReceiptIds.length + ' AMBIGUOUS OR PROJECTED RECEIPTS // CANON BLOCKED</small></article>';
      }).join("") + '</section><section><header><span>COURT AUDIT</span><b>' +
      trustEngine.metrics.courts + ' REVIEWED</b></header>' + courts.map(function (court) {
        return '<article><div><h4>' + esc(court.title) + '</h4><b>' + esc(court.verdict) +
          '</b></div><p>' + esc(court.safePublicLabel) + '</p><small>' +
          court.directProsecutionReceipts.length + ' DIRECT PROSECUTION // ' +
          court.directDefenseReceipts.length + ' DIRECT DEFENSE</small></article>';
      }).join("") + '</section></div>';
  }

  function contributionPreview(packet) {
    if (!packet) return '<div class="contribution-empty"><b>NO PACKET YET.</b><span>Submit a source and timestamp. The desk will package a proposal, not silently rewrite canon.</span></div>';
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
    return '<div class="canon-lane-head"><div><span>COMMUNITY MEMORY // PROPOSE, NEVER SELF-CERTIFY</span><h3>HELP THE ARCHIVE REMEMBER WHAT THE MACHINE CANNOT.</h3></div><p>A viewer can point to a source, timestamp, and context. The packet remains unreviewed until an editor, owner, or creator makes the required decision.</p></div>' +
      '<div class="contribution-grid"><form id="contributionForm"><label><span>WHAT ARE YOU ADDING?</span><select id="contributionKind"><option value="new-receipt">NEW RECEIPT</option><option value="context-correction">CONTEXT CORRECTION</option><option value="transcript-or-human-notes">TRANSCRIPT / HUMAN NOTES</option><option value="performer-verification">PERFORMER VERIFICATION</option></select></label>' +
      '<label><span>TARGET ID OR NAME</span><input id="contributionTarget" required placeholder="character:marky-mark or Halloween"></label>' +
      '<label><span>YOUTUBE VIDEO ID</span><input id="contributionSource" required maxlength="20" placeholder="5HfhwoDSQ0E"></label>' +
      '<label><span>TIMESTAMP (SECONDS OR M:SS)</span><input id="contributionTime" required placeholder="1:50:40"></label>' +
      '<label><span>SHORT CONTEXT NOTE</span><textarea id="contributionExcerpt" maxlength="240" placeholder="What should an editor verify here?"></textarea></label>' +
      '<button>BUILD UNREVIEWED PROPOSAL →</button><small>No upload occurs in this prototype. Export the packet and send it to the archive owner.</small></form>' +
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
        if (packet) copy(JSON.stringify(packet, null, 2), "CORRECTION PACKET COPIED");
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
      [metrics.healthySources + "/" + metrics.sources, "HEALTHY SOURCES"],
      [metrics.invalidTimestamps, "OUT-OF-RANGE TIMES"],
      [metrics.ordinaryCharacterMentionsQuarantined, "MENTIONS QUARANTINED"],
      [metrics.reviewCandidates, "OPEN HUMAN REVIEWS"],
      [metrics.publicExcerptViolations, "RAW EXCERPTS UI-CAPPED"],
    ].map(function (stat) {
      return '<div><b>' + stat[0] + '</b><span>' + stat[1] + '</span></div>';
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-canon-tab]"), function (button) {
      button.classList.toggle("on", button.getAttribute("data-canon-tab") === state.canonTab);
    });
    var content = state.canonTab === "review" ? renderReviewQueue() :
      state.canonTab === "characters" ? renderCharacterFirewall() :
      state.canonTab === "claims" ? renderClaimAudit() :
      state.canonTab === "contribute" ? renderCommunityMemory() : renderSourceHealth();
    document.getElementById("canonStage").innerHTML = content;
    bindCanon();
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
    var preferencePersisted = !persist ||
      storageSet("wwam-band", state.redBand ? "red" : "bleep");
    document.body.classList.toggle("office-bleep", !state.redBand);
    document.getElementById("bandToggle").textContent = "REDUCED PROFANITY: " + (state.redBand ? "OFF" : "ON");
    renderHeroConsole();
    renderHot100();
    renderSoundbytes();
    refreshSoundPlayerCopy();
    renderCharacter();
    refreshCharacterAnswerCopy();
    renderMemory();
    renderLore();
    renderTrivia();
    renderControlRoom();
    renderClipLab();
    renderLabs();
    renderEvidenceBag();
    if (state.lastAskQuery && askEngine) {
      ask(state.lastAskQuery, state.lastAskAnalysis);
    }
    var openModal = document.getElementById("tapeModal").classList.contains("show");
    if (openModal) {
      var params = new URLSearchParams(location.search);
      if (params.get("tape")) openDossier(params.get("tape"), params.get("at"));
      else if (params.get("live")) openLiveDossier(params.get("live"), params.get("at"));
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

  function runTourProof() {
    var action = tourSlides[state.tourSlide].action;
    closeTour();
    var targetId = action.kind === "ask" ? "ask" :
      action.kind === "lore" ? "lore" :
        action.kind === "clip" ? "clip-lab" :
          action.kind === "canon" ? "canon" : "trivia";
    history.replaceState(null, "", location.pathname + location.search + "#" + targetId);
    if (action.kind === "ask") {
      document.getElementById("askInput").value = action.query;
      ask(action.query);
      document.getElementById("ask").scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "lore") {
      state.loreKind = "character";
      state.loreSelected = action.entry;
      state.loreQuery = "";
      document.getElementById("loreSearch").value = "";
      renderLore();
      document.getElementById("lore").scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "clip") {
      state.clipMode = action.mode || "shorts";
      if (action.duration) state.coldOpenDuration = action.duration;
      state.clipQuery = action.query;
      document.getElementById("clipSearch").value = action.query;
      renderClipLab();
      document.getElementById("clip-lab").scrollIntoView({ behavior: "smooth" });
    } else if (action.kind === "canon") {
      state.canonTab = action.tab;
      renderCanon();
      document.getElementById("canon").scrollIntoView({ behavior: "smooth" });
    } else {
      document.getElementById("trivia").scrollIntoView({ behavior: "smooth" });
      focusSoon("#triviaStart");
    }
  }

  function openTour() {
    rememberDialogFocus();
    state.tourSlide = 0;
    renderTour();
    document.getElementById("pitchTour").classList.add("show");
    document.getElementById("pitchTour").setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    history.replaceState(null, "", "#pitch");
    syncBackgroundInert();
    focusSoon("#tourClose");
  }

  function closeTour() {
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
      "body > nav, body > main, body > footer, #evidenceBagOpen"
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
      return !element.hasAttribute("inert") && element.getAttribute("aria-hidden") !== "true";
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
    document.getElementById("triviaDifficulty").onchange = function (event) {
      state.triviaDifficulty = event.target.value;
    };
    document.getElementById("triviaLength").onchange = function (event) {
      state.triviaLength = Number(event.target.value);
      document.getElementById("triviaStart").textContent =
        "DEAL ME " + state.triviaLength + " →";
    };
    document.getElementById("triviaFranchise").onchange = function (event) {
      state.triviaFranchise = event.target.value;
    };
    document.getElementById("triviaStart").onclick = function () {
      if (!tapeTriviaEngine) return showToast("THE TRIVIA DECK IS STILL SHUFFLING");
      startTrivia(true);
    };
    document.getElementById("loreSearch").oninput = function (event) {
      state.loreQuery = event.target.value;
      renderLore();
    };
    document.getElementById("clipSearch").oninput = function (event) {
      state.clipQuery = event.target.value;
      renderClipLab();
    };
    document.getElementById("clipRisk").onchange = function (event) {
      state.clipRisk = event.target.value;
      renderClipLab();
    };
    document.getElementById("campaignCopy").onclick = function () {
      if (!clipLabEngine) return showToast("THE CLIP LAB IS STILL INDEXING");
      copy(clipLabEngine.exportManifest(campaignManifest(), 2), "EDITORIAL CAMPAIGN COPIED");
    };
    document.getElementById("campaignDownload").onclick = function () {
      if (!clipLabEngine) return showToast("THE CLIP LAB IS STILL INDEXING");
      downloadJson("wwam-editorial-campaign.json", campaignManifest());
      showToast("EDITORIAL CAMPAIGN DOWNLOADED");
    };
    document.getElementById("campaignClear").onclick = function () {
      state.campaignIds = [];
      campaignSnapshots = {};
      var persisted = saveCampaignIds();
      renderClipLab();
      showToast(persisted ? "THE CAMPAIGN TRAY IS CLEAR" :
        "CAMPAIGN CLEARED // THIS TAB ONLY");
    };
    document.getElementById("evidenceBagOpen").onclick = function () {
      rememberDialogFocus();
      state.bagOpen = true;
      renderEvidenceBag();
      focusSoon("#evidenceBagClose");
    };
    document.getElementById("evidenceBagClose").onclick = function () {
      state.bagOpen = false;
      renderEvidenceBag();
      restoreDialogFocus();
    };
    document.getElementById("evidenceBagScrim").onclick = function () {
      state.bagOpen = false;
      renderEvidenceBag();
      restoreDialogFocus();
    };
    document.getElementById("evidenceBagCopy").onclick = copyEvidenceManifest;
    document.getElementById("evidenceBagDownload").onclick = downloadEvidenceManifest;
    document.getElementById("evidenceBagClear").onclick = function () {
      state.evidenceBag = [];
      var persisted = saveEvidenceBag();
      renderEvidenceBag();
      showToast(persisted ? "THE EVIDENCE BAG HAS BEEN BURNED" :
        "EVIDENCE BAG CLEARED // THIS TAB ONLY");
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
        focusSoon("#top");
        openInitialRoute();
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
    document.getElementById("characterForm").onsubmit = function (event) {
      event.preventDefault();
      var question = document.getElementById("characterInput").value.trim();
      if (question.length > 1) askCharacter(question);
    };
    document.getElementById("popularSearch").oninput = function (event) {
      state.popularQuery = event.target.value;
      renderPopular();
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-memory-tab]"), function (button) {
      button.onclick = function () {
        state.memoryTab = button.getAttribute("data-memory-tab");
        renderMemory();
      };
    });
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

  function openInitialRoute() {
    if (state.initialRouteHandled) return;
    var gate = document.getElementById("contentGate");
    if (gate && !gate.classList.contains("gone")) return;
    state.initialRouteHandled = true;
    var params = new URLSearchParams(location.search);
    if (params.get("tape")) {
      setTimeout(function () { openDossier(params.get("tape"), params.get("at")); }, 50);
    } else if (params.get("live")) {
      setTimeout(function () { openLiveDossier(params.get("live"), params.get("at")); }, 50);
    } else if (params.get("ask")) {
      setTimeout(function () {
        var sharedQuestion = params.get("ask").slice(0, 240);
        document.getElementById("askInput").value = sharedQuestion;
        ask(sharedQuestion);
        document.getElementById("ask").scrollIntoView();
      }, 50);
    } else if (location.hash === "#pitch") {
      setTimeout(openTour, 50);
    }
  }

  function init() {
    document.body.classList.toggle("office-bleep", !state.redBand);
    document.getElementById("bandToggle").textContent =
      "REDUCED PROFANITY: " + (state.redBand ? "OFF" : "ON");
    document.getElementById("consoleStatus").textContent = "SCANNING " +
      fmt(deep.meta.wordsAudited + live.meta.wordsAudited + (popular.meta.wordsAudited || 0)) + " WORDS";
    renderProof();
    renderMarquee();
    renderHeroConsole();
    renderCategoryFilters();
    renderHot100();
    renderSoundFilters();
    renderSoundbytes();
    renderCharacterRoster();
    renderCharacter();
    renderLiveProof();
    renderTopicRadar();
    renderStreams();
    renderPopularProof();
    renderPopularTopics();
    renderPopular();
    renderMemory();
    renderLore();
    renderTrivia();
    renderControlRoom();
    renderClipLab();
    renderCanon();
    renderAskExamples();
    renderFranchises();
    renderFranchiseFilters();
    renderVault();
    renderLabs();
    renderEvidenceBag();
    bindPage();

    if (storageGet("wwam-band")) {
      document.getElementById("contentGate").classList.add("gone");
      document.getElementById("contentGate").setAttribute("aria-hidden", "true");
    } else {
      focusSoon('[data-band="red"]');
    }
    syncBackgroundInert();
    openInitialRoute();
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
