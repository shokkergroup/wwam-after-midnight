(function (root) {
  "use strict";

  var VERSION = "1.34.1";
  var DOSSIER_SCHEMA = "shokker-source-dossier/v1";
  var QUERY_SCHEMA = "shokker-source-query/v1";
  var QUERY_RESULT_SCHEMA = "shokker-source-query-result/v1";
  var QUERY_LIMIT = 3;
  var COMPACT_LIMITS = Object.freeze({
    receipts: 3,
    entities: 8,
    wake: 4,
    neighborhood: 3,
    artifacts: 6
  });
  var COMPACT_SHOW_WIKI_RECEIPTS = 3;
  var SECTION_IDS = Object.freeze({
    proof: "sourceDossierProof",
    player: "sourceDossierPlayerSection",
    wiki: "sourceDossierShowWiki",
    inside: "sourceDossierInside",
    ask: "sourceDossierAsk",
    footprint: "sourceDossierFootprint",
    wake: "sourceDossierWake",
    chronology: "sourceDossierChronology",
    work: "sourceDossierWork",
    aftermath: "sourceDossierAftermath",
    boundary: "sourceDossierBoundary"
  });
  var SECTION_FOCUS_IDS = Object.freeze({
    proof: "sourceDossierProofTitle",
    player: "sourceDossierPlayerTitle",
    wiki: "sourceDossierShowWikiTitle",
    inside: "sourceDossierInsideTitle",
    ask: "sourceDossierAskTitle",
    footprint: "sourceDossierFootprintTitle",
    wake: "sourceDossierWakeTitle",
    work: "sourceDossierWorkTitle",
    aftermath: "sourceDossierAftermathTitle",
    boundary: "sourceDossierBoundaryTitle"
  });
  var EXPANDABLE_SECTIONS = Object.freeze([
    "inside", "footprint", "wake", "work"
  ]);
  var QUERY_STATUSES = Object.freeze([
    "supported", "inventory", "proof", "metadata-only", "caption-limited",
    "unavailable", "insufficient-evidence", "speaker-refused",
    "ranking-refused", "stale-source"
  ]);
  var QUERY_RESULT_TYPES = Object.freeze([
    "receipt", "guide-cut", "metadata", "entity", "artifact", "connection"
  ]);
  var DEFAULT_SOURCE_QUERY = "What is actually indexed in this tape?";

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function cleanCaptionExcerpt(value) {
    /*
     * A caption window is allowed to be a map to the tape, not a counterfeit
     * quote.  Preserve the coordinate when a source caption still carries
     * cue markers or a looped decoding artifact; stripping those markers and
     * printing the remainder made fragments such as “Penis penis penis” look
     * like finished WWAM copy.  Human/editorial excerpts do not contain these
     * transport markers, so this is a narrow quarantine rather than a blanket
     * caption ban.
     */
    var raw = clean(value);
    var cueMarkers = raw.match(/>>+/g) || [];
    var leadingMarkerRemainder = raw.replace(/^(?:\s*>>\s*)+/, "");
    if (cueMarkers.length > 2 || />>+/.test(leadingMarkerRemainder) ||
        /(?:^|\s)(?:-->|<\/?(?:c|v|lang)\b)/i.test(raw) ||
        /\[(?:bleep|laughter|music|applause|cheering)\]/i.test(raw) ||
        /\b([A-Za-z][A-Za-z'-]*)\s+\1(?:\s+\1)+\b/i.test(raw)) {
      return "";
    }
    var decoderJoin = [
      /\b(?:is|are|was|were)\s+(?:is|are|was|were|has|have)\b/i,
      /\b(?:is|are|was|were)\s+(?:a|an|the)\s+(?:is|are|was|were|it|that|this)\b/i,
      /\b([a-z]{2,})\s+(?:is|are|was|were)\s+(?:a|an|the)\s+\1\b/i,
      /\b(?:like|just)\s+(?:like|just)\b/i,
      /\b(?:it|this|that)\s+(?:is|was|are|were|like)\s+(?:it|this|that)\b/i,
      /\b(?:oh|hey|shh)\s+(?:oh|hey|shh)\b/i,
      /\b(?:before|after|then)\s+[^.!?]{0,36}\b(?:before|after|then)\b/i
    ];
    if (decoderJoin.some(function (pattern) { return pattern.test(raw); })) return "";
    var text = raw
      .replace(/^(?:\s*>>\s*)+/, "")
      .replace(/>>/g, " ")
      .replace(/\[(?:laughter|music|applause|cheering)\]/gi, " ")
      .replace(/\[\s*__\s*\]/g, "[BLEEP]")
      .replace(/\b([A-Za-z][A-Za-z'-]*)\s+\1\b/gi, "$1")
      .replace(/\s+([,.;!?])/g, "$1")
      .replace(/\s+/g, " ")
      .replace(/^[\s\u2026]+|[\s\u2026]+$/g, "")
      .trim();
    if (!text) return "";
    var words = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
    var hasPunctuation = /[,;:!?]|\.(?:\s|$)/.test(text);
    var startsMidBreath = /^(?:uh+|um+|and|but|so|about|because|like|well)\b/i
      .test(text);
    var dangles = /\b(?:and|or|but|because|with|to|from|of|the|a|an|which|who|while|when|where|as|at|in|on|for|by|we're|i'm|it's)\s*$/i
      .test(text);
    /*
     * Automatic captions are evidence, not finished copy. Short, obviously
     * severed fragments disappear from the fan-facing cards; the timestamp
     * and player remain available. A compact punchline with real punctuation
     * ("Nice job, asshole") still survives.
     */
    if (dangles || !hasPunctuation && words.length < 8 ||
        startsMidBreath && !hasPunctuation && words.length < 12) {
      return "";
    }
    return text;
  }

  function listeningCaptionExcerpt(value) {
    var text = cleanCaptionExcerpt(value);
    if (!text) return "";
    var words = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
    var finished = /[.!?][\"']?$/.test(text);
    var breathStart = /^(?:yeah|uh+|um+|and|but|so|well|like)\b/i.test(text);
    /*
     * The listening pass is a navigation aid, not a quote generator. A
     * caption window that starts mid-breath and trails off is useful to the
     * player but looks like broken prose on a fan-facing page. Keep complete
     * fragments; otherwise let the timestamp do the talking.
     */
    if (!finished && (breathStart || words.length < 16)) return "";
    return text;
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function fallbackEscape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fallbackNumber(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function fallbackDuration(value) {
    var total = Math.max(0, Math.round(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    return hours ? hours + "H " + String(minutes).padStart(2, "0") + "M" :
      minutes + "M";
  }

  function fallbackDate(value) {
    var text = clean(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    var parts = text.split("-");
    return parts[1] + "." + parts[2] + "." + parts[0];
  }

  function fallbackTime(value) {
    var total = Math.max(0, Math.round(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    return (hours ? String(hours).padStart(2, "0") + ":" : "") +
      String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function token(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown";
  }

  function titleCase(value) {
    return clean(value).replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ").replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function coverageLabel(value, exactSourceHold) {
    if (clean(record(exactSourceHold).state) === "held-age-gated") {
      return "EXACT CUT UNAVAILABLE";
    }
    return {
      "caption-backed": "FULL SHOW WIKI",
      "caption-limited": "PARTIAL CAPTIONS",
      "metadata-only": "UPLOAD DETAILS ONLY",
      unavailable: "UPLOAD RECORD INCOMPLETE"
    }[value] || titleCase(value).toUpperCase();
  }

  function authorityLabel(value) {
    return {
      "promoted-lane": "READY FOR THE SHOW WIKI",
      "quarantined-lane": "HELD FOR REVIEW",
      "source-only": "UPLOAD DETAILS ONLY"
    }[value] || titleCase(value).toUpperCase();
  }

  function entityBasisLabel(value) {
    return {
      "timestamped-receipt": "TIMESTAMPED SOURCE RECEIPT",
      "catalog-declared-entity": "CATALOG-DECLARED ENTITY",
      "cached-title-alias": "CACHED TITLE ALIAS // NOT CONTENT EVIDENCE"
    }[value] || titleCase(value).toUpperCase();
  }

  function relationshipLabel(value) {
    return {
      "receipt-backed-entity": "DUAL-ENDED RECEIPT CONNECTION",
      "exact-artifact-membership": "SHARED DRAFT / REVIEW ARTIFACT",
      "registered-source-entity": "DUAL-ENDED SOURCE ENTITY",
      "source-metadata-neighbor": "TITLE-METADATA NEIGHBOR // NOT CONTENT EVIDENCE"
    }[value] || titleCase(value).toUpperCase();
  }

  function artifactAuthorityLabel(value) {
    return {
      "fan-navigation": "FAN NAVIGATION",
      "creator-draft": "CREATOR DRAFT",
      "editor-review": "EDITOR REVIEW"
    }[value] || titleCase(value).toUpperCase();
  }

  function summaryRows(summary, labeler, esc) {
    var entries = Object.keys(record(summary)).sort(function (left, right) {
      return Number(summary[right] || 0) - Number(summary[left] || 0) ||
        left.localeCompare(right);
    });
    if (!entries.length) return '<span class="source-dossier-zero">0 INDEXED</span>';
    return entries.map(function (key) {
      return '<span><b>' + esc(summary[key]) + '</b>' +
        esc(labeler ? labeler(key) : titleCase(key).toUpperCase()) + '</span>';
    }).join("");
  }

  function create(options) {
    var input = options || {};
    var engine = input.engine;
    var queryEngine = input.queryEngine;
    var aftermathEngine = input.aftermathEngine;
    var mount = input.mount;
    if (!engine || typeof engine.build !== "function") {
      throw new Error("Source Dossier UI requires an engine with build(sourceId).");
    }
    if (!mount || typeof mount.addEventListener !== "function") {
      throw new Error("Source Dossier UI requires a mount element.");
    }

    var esc = typeof input.escapeHtml === "function" ? input.escapeHtml : fallbackEscape;
    var formatNumber = typeof input.formatNumber === "function" ?
      input.formatNumber : fallbackNumber;
    var formatDuration = typeof input.formatDuration === "function" ?
      input.formatDuration : fallbackDuration;
    var formatDate = typeof input.formatDate === "function" ?
      input.formatDate : fallbackDate;
    var formatTime = typeof input.formatTime === "function" ?
      input.formatTime : fallbackTime;
    var scheduleFrame = typeof input.requestAnimationFrame === "function" ?
      input.requestAnimationFrame :
      (root && typeof root.requestAnimationFrame === "function" ?
        root.requestAnimationFrame.bind(root) : function (callback) { callback(); });
    var callbacks = {
      play: typeof input.onPlay === "function" ? input.onPlay : function () {},
      copy: typeof input.onCopyLink === "function" ? input.onCopyLink : function () {},
      download: typeof input.onDownload === "function" ? input.onDownload : function () {},
      open: typeof input.onOpenSource === "function" ? input.onOpenSource : function () {},
      stageIntake: typeof input.onStageIntake === "function" ?
        input.onStageIntake : function () {},
      companion: typeof input.onOpenCompanion === "function" ?
        input.onOpenCompanion : function () {},
      bag: typeof input.onBagReceipt === "function" ? input.onBagReceipt : function () {},
      loadAftermath: typeof input.loadAftermathReview === "function" ?
        input.loadAftermathReview : function () { return null; },
      aftermathDecision: typeof input.onAftermathDecision === "function" ?
        input.onAftermathDecision : function () {},
      aftermathExport: typeof input.onAftermathExport === "function" ?
        input.onAftermathExport : function () {},
      aftermathCopy: typeof input.onAftermathCopy === "function" ?
        input.onAftermathCopy : function () {},
      openClipLab: typeof input.onOpenClipLab === "function" ?
        input.onOpenClipLab : function () {}
    };
    var state = {
      dossier: null,
      sourceId: "",
      at: 0,
      hasAnchor: false,
      section: "",
      fullFile: false,
      recapExpanded: false,
      expanded: {},
      query: DEFAULT_SOURCE_QUERY,
      queryAnswer: null,
      queryBusy: false,
      queryError: "",
      queryEpoch: 0,
      activeReceiptKey: "",
      activeReceiptOrigin: "",
      activePlayback: null,
      aftermathPack: null,
      aftermathReview: null,
      aftermathSelected: "",
      aftermathFilter: "all",
      aftermathError: "",
      jumpEpoch: 0,
      destroyed: false
    };

    function setAttribute(name, value) {
      if (typeof mount.setAttribute === "function") mount.setAttribute(name, String(value));
    }

    function validateDossier(dossier) {
      return Boolean(
        dossier && dossier.schema === DOSSIER_SCHEMA &&
        dossier.source && clean(dossier.source.id) &&
        dossier.proof && dossier.wake && dossier.chronology
      );
    }

    function sectionAttributes(section) {
      return ' id="' + esc(SECTION_IDS[section]) + '" data-source-dossier-section="' +
        esc(section) + '"';
    }

    function sectionExpanded(section) {
      return state.fullFile || state.expanded[section] === true;
    }

    function visibleItems(items, section, limit) {
      var values = array(items);
      return sectionExpanded(section) ? values : values.slice(0, limit);
    }

    function disclosureMarkup(section, total, visible, noun) {
      var expanded = sectionExpanded(section);
      if (state.fullFile || (!expanded && total <= visible)) return "";
      return '<div class="source-dossier-disclosure"><span>' +
        esc(visible) + ' OF ' + esc(total) + ' ' + esc(noun.toUpperCase()) +
        ' VISIBLE</span><button type="button" data-source-dossier-action="toggle-section" ' +
        'data-section="' + esc(section) + '" aria-controls="' +
        esc(SECTION_IDS[section]) + 'Items" aria-expanded="' +
        (expanded ? "true" : "false") + '">' +
        (expanded ? 'RETURN TO COMPACT ' + esc(noun.toUpperCase()) :
          'SHOW ALL ' + esc(total) + ' ' + esc(noun.toUpperCase())) +
        '</button></div>';
    }

    function densityMarkup() {
      return '<aside class="source-dossier-density" data-source-dossier-density="' +
        (state.fullFile ? "full" : "compact") + '" aria-label="Source dossier display depth">' +
        '<div><span>' + (state.fullFile ? "THE FULL SHOW FILE" : "SHOW HIGHLIGHTS") +
        '</span><p>' + (state.fullFile ?
          "Every saved timestamp, related show, and research note is visible." :
          "Start with the recap and signature moments. The full research file is one click away.") +
        '</p></div><button type="button" data-source-dossier-action="' +
        (state.fullFile ? "close-full-file" : "open-full-file") + '" aria-expanded="' +
        (state.fullFile ? "true" : "false") + '"' +
        (state.fullFile ? "" : ' aria-controls="sourceDossierDeepResearch"') + '>' +
        (state.fullFile ? "BACK TO SHOW HIGHLIGHTS" : "EXPLORE ALL") +
        '</button></aside>';
    }

    function sourceReceiptByKey(dossier, key) {
      return array(dossier && dossier.source && dossier.source.receipts)
        .filter(function (receipt) { return receipt.key === key; })[0] || null;
    }

    function sourceGuideCutById(dossier, id) {
      var guide = record(record(dossier && dossier.source && dossier.source.showWiki).episodeGuide);
      if (clean(guide.schema) !== "wwam-episode-guide/v2") return null;
      return array(guide.cuts).map(record).filter(function (cut) {
        return clean(cut.id) === clean(id);
      })[0] || null;
    }

    function validateEpisodeContext(answer, dossier, normalizedResults) {
      var intent = clean(answer && answer.intent);
      var raw = answer && answer.episode;
      if (!raw) {
        if (intent.indexOf("episode-") === 0) {
          throw new Error("An episode query result omitted its Show Wiki context.");
        }
        return null;
      }
      var episode = record(raw);
      var kind = clean(episode.kind);
      var id = clean(episode.id);
      var wiki = record(dossier.source.showWiki);
      var target = null;
      var expectedKeys = [];
      if (kind === "guide") {
        target = record(wiki.episodeGuide);
        var cuts = array(target.cuts).map(record);
        var seenCuts = {};
        var guideResults = normalizedResults.filter(function (result) {
          var cut = result.type === "guide-cut" ? result.cut : result.guideCut;
          if (!cut || seenCuts[cut.id]) return false;
          seenCuts[cut.id] = true;
          return result.type === "guide-cut" || result.type === "receipt";
        });
        var totalCuts = Number(episode.totalCuts);
        var matchedCuts = Number(episode.matchedCuts);
        var shownCuts = Number(episode.shownCuts);
        if (clean(target.schema) !== "wwam-episode-guide/v2" || id !== "episode-guide" ||
            intent !== "episode-guide" || !clean(episode.label) ||
            !clean(episode.matchedAlias) || totalCuts !== cuts.length ||
            !Number.isInteger(matchedCuts) || matchedCuts < 0 || matchedCuts > cuts.length ||
            shownCuts !== guideResults.length || normalizedResults.length !== guideResults.length ||
            guideResults.length > matchedCuts) {
          throw new Error("The source query result did not preserve its validated Episode Guide cuts.");
        }
        return {
          kind: kind,
          id: id,
          label: clean(episode.label),
          matchedAlias: clean(episode.matchedAlias),
          totalCuts: cuts.length,
          matchedCuts: matchedCuts,
          shownCuts: guideResults.length
        };
      }
      if (kind === "recap") {
        target = record(wiki.recap);
        if (!clean(target.overview) || id !== "episode-recap") target = null;
        array(record(wiki.recap).blocks).forEach(function (block) {
          expectedKeys = expectedKeys.concat(array(record(block).receiptKeys));
        });
      } else if (kind === "brief") {
        target = record(wiki.brief);
        if (!isSourceBrief(dossier) || id !== "source-brief") target = null;
      } else if (kind === "experience") {
        target = record(wiki.experience);
        if (!clean(target.id) || clean(target.id) !== id) target = null;
        expectedKeys = array(record(wiki.experience).routeReceiptKeys);
      } else if (kind === "lane") {
        target = array(wiki.lanes).map(record).filter(function (lane) {
          return clean(lane.id) === id;
        })[0] || null;
        expectedKeys = target ? array(target.receiptKeys) : [];
      }
      var seen = {};
      expectedKeys = expectedKeys.map(function (key) { return clean(key); }).filter(function (key) {
        if (!key || seen[key] || !sourceReceiptByKey(dossier, key)) return false;
        seen[key] = true;
        return true;
      });
      var expectedKeySet = {};
      expectedKeys.forEach(function (key) { expectedKeySet[key] = true; });
      var receiptResults = normalizedResults.filter(function (result) {
        return result.type === "receipt";
      });
      var shownReceipts = receiptResults.length;
      var preservesExpectedSet = kind === "brief" ?
        normalizedResults.length === 1 &&
          normalizedResults[0].type === "metadata" &&
          normalizedResults[0].field === "registered-source-brief" :
        normalizedResults.length === shownReceipts &&
          receiptResults.every(function (result) { return expectedKeySet[result.key] === true; });
      if (!target || !preservesExpectedSet || intent !== "episode-" + kind || !clean(episode.label) ||
          !clean(episode.matchedAlias) ||
          Number(episode.totalReceipts) !== expectedKeys.length ||
          !Number.isInteger(Number(episode.matchedReceipts)) ||
          Number(episode.matchedReceipts) < 0 ||
          Number(episode.matchedReceipts) > expectedKeys.length ||
          Number(episode.shownReceipts) !== shownReceipts ||
          shownReceipts > Number(episode.matchedReceipts)) {
        throw new Error("The source query result did not preserve its registered Show Wiki lane.");
      }
      return {
        kind: kind,
        id: id,
        label: clean(episode.label),
        matchedAlias: clean(episode.matchedAlias),
        totalReceipts: expectedKeys.length,
        matchedReceipts: Number(episode.matchedReceipts),
        shownReceipts: shownReceipts
      };
    }

    function validateQueryAnswer(answer, dossier) {
      var source = dossier.source;
      var scope = record(answer && answer.scope);
      var boundary = record(answer && answer.boundary);
      var sourceProof = record(answer && answer.sourceProof);
      var status = clean(answer && answer.status);
      var substitutionBlocked =
        boundary.crossSourceSubstitutionAllowed === false ||
        boundary.crossSourceSubstitution === false;
      if (!answer || answer.schema !== QUERY_RESULT_SCHEMA ||
          QUERY_STATUSES.indexOf(status) < 0 ||
          scope.exactSource !== true ||
          clean(scope.sourceId) !== source.id ||
          clean(scope.sourceFingerprint) !== clean(source.sourceFingerprint) ||
          clean(scope.dossierFingerprint) !== clean(dossier.fingerprint) ||
          clean(scope.query) !== state.query ||
          Number(scope.limit) !== QUERY_LIMIT ||
          clean(sourceProof.sourceId) !== source.id ||
          clean(sourceProof.sourceFingerprint) !== clean(source.sourceFingerprint) ||
          !substitutionBlocked) {
        throw new Error("The source query result did not preserve the exact-source lock.");
      }
      var rawResults = array(answer.results);
      var normalizedResults = rawResults.map(function (rawResult) {
        var result = record(rawResult);
        var type = clean(result.type);
        if (clean(result.sourceId) !== source.id ||
            QUERY_RESULT_TYPES.indexOf(type) < 0) {
          throw new Error("A source query result attempted to cross the source lock.");
        }
        if (type === "receipt") {
          var canonical = sourceReceiptByKey(dossier, clean(result.key));
          if (!canonical) {
            throw new Error("A source query result referenced an unregistered receipt.");
          }
          var receiptGuideCut = clean(result.guideCutId) ?
            sourceGuideCutById(dossier, clean(result.guideCutId)) : null;
          if (clean(result.guideCutId) && (!receiptGuideCut ||
              Math.abs(number(receiptGuideCut.at) - number(canonical.at)) > 0.001)) {
            throw new Error("A canonical receipt claimed an unrelated Episode Guide cut.");
          }
          return {
            type: "receipt",
            key: canonical.key,
            receipt: canonical,
            guideCut: receiptGuideCut,
            matchedBy: clean(result.matchedBy)
          };
        }
        if (type === "guide-cut") {
          var canonicalCut = sourceGuideCutById(dossier, clean(result.id));
          if (!canonicalCut ||
              Math.abs(number(result.at) - number(canonicalCut.at)) > 0.001 ||
              Math.abs(number(result.end) - number(canonicalCut.end)) > 0.001) {
            throw new Error("A source query result referenced an unregistered Episode Guide cut.");
          }
          return {
            type: "guide-cut",
            id: canonicalCut.id,
            cut: canonicalCut,
            matchedBy: clean(result.matchedBy)
          };
        }
        if (type === "metadata") {
          var metadataField = clean(result.field);
          if (metadataField === "registered-source-brief") {
            if (!isSourceBrief(dossier)) {
              throw new Error("A source query attempted to invent a Source Brief.");
            }
            var canonicalBrief = record(record(source.showWiki).brief);
            return {
              type: type,
              field: metadataField,
              basis: clean(canonicalBrief.formatBasis),
              value: {
                kind: clean(canonicalBrief.kind),
                scope: clean(canonicalBrief.scope),
                format: clean(canonicalBrief.format),
                formatBasis: clean(canonicalBrief.formatBasis)
              }
            };
          }
          if (metadataField === "official-alternate") {
            var requestedAlternate = record(result.value);
            var canonicalAlternate = record(source.officialAlternate);
            var alternateAvailable = Boolean(
              clean(canonicalAlternate.episodeUrl) &&
              clean(canonicalAlternate.enclosureUrl) &&
              canonicalAlternate.timestampIsomorphic === false &&
              canonicalAlternate.publicPlaybackAllowed === true
            );
            if ((requestedAlternate.available === true) !== alternateAvailable) {
              throw new Error(
                "The source query result did not preserve the official alternate route."
              );
            }
            return {
              type: type,
              field: metadataField,
              basis: "canonical-source-access-proof",
              value: {
                available: alternateAvailable,
                canonicalOfficialUrl: source.url,
                exactSourceHold: source.exactSourceHold || null,
                officialAlternate: alternateAvailable ? {
                  kind: clean(canonicalAlternate.kind),
                  title: clean(canonicalAlternate.title),
                  episodeUrl: clean(canonicalAlternate.episodeUrl),
                  enclosureUrl: clean(canonicalAlternate.enclosureUrl),
                  duration: number(canonicalAlternate.duration),
                  canonicalDuration: number(canonicalAlternate.canonicalDuration),
                  durationDelta: number(canonicalAlternate.durationDelta),
                  timestampIsomorphic: false,
                  publicPlaybackAllowed: true,
                  evidenceBoundary: clean(canonicalAlternate.evidenceBoundary)
                } : null
              }
            };
          }
          return {
            type: type,
            field: metadataField,
            basis: clean(result.basis),
            value: result.value
          };
        }
        if (type === "entity") {
          return {
            type: type,
            id: clean(result.id),
            label: clean(result.label),
            entityType: clean(result.entityType),
            basis: clean(result.basis),
            receiptKeys: array(result.receiptKeys).map(clean).filter(Boolean)
          };
        }
        if (type === "artifact") {
          return {
            type: type,
            id: clean(result.id),
            label: clean(result.label),
            kind: clean(result.kind),
            authority: clean(result.authority),
            reviewState: clean(result.reviewState),
            risk: clean(result.risk),
            targetSection: clean(result.targetSection),
            receiptKeys: array(result.receiptKeys).map(clean).filter(Boolean)
          };
        }
        return {
          type: type,
          targetSourceId: clean(result.targetSourceId),
          targetTitle: clean(result.targetTitle),
          targetDate: clean(result.targetDate),
          direction: clean(result.direction),
          basis: clean(result.basis),
          sharedEntities: array(result.sharedEntities).map(function (entity) {
            return clean(record(entity).label);
          }).filter(Boolean)
        };
      }).slice(0, QUERY_LIMIT);
      var episode = validateEpisodeContext(answer, dossier, normalizedResults);
      return {
        schema: answer.schema,
        scope: scope,
        status: status,
        intent: clean(answer.intent),
        episode: episode,
        sourceProof: sourceProof,
        boundary: boundary,
        message: clean(answer.message),
        results: normalizedResults,
        total: Math.max(
          normalizedResults.length,
          Number(answer.resultCount) || rawResults.length
        ),
        limitations: array(answer.limitations).map(clean).filter(Boolean)
      };
    }

    function queryStatusLabel(status) {
      return {
        supported: "ANSWER FROM THIS SHOW",
        inventory: "WHAT IS INDEXED HERE",
        proof: "ABOUT THIS UPLOAD",
        "metadata-only": "THIS SHOW NEEDS CAPTIONS",
        "caption-limited": "ANSWER FROM PARTIAL CAPTIONS",
        unavailable: "THIS UPLOAD IS UNAVAILABLE",
        "insufficient-evidence": "NOT ENOUGH IN THIS SHOW",
        "speaker-refused": "SPEAKER NOT CONFIRMED",
        "ranking-refused": "THIS SHOW CANNOT PROVE THAT RANKING",
        "stale-source": "THIS SHOW PAGE NEEDS A REFRESH"
      }[status] || "ANSWER HELD";
    }

    function proofMarkup(dossier) {
      var source = dossier.source;
      var proof = dossier.proof;
      var lanes = array(source.lanes);
      return '<section class="source-dossier-proof"' + sectionAttributes("proof") +
        ' aria-labelledby="sourceDossierProofTitle">' +
        '<header><div><span>ABOUT THIS UPLOAD</span><h3 id="sourceDossierProofTitle">THE FACTS, BEFORE THE TAKES.</h3></div>' +
        '<p>These are the upload and caption facts behind this page. They show what the wiki can use without guessing who said what or what anyone meant.</p></header>' +
        '<div class="source-dossier-proof-grid">' +
        '<article><span>CAPTION COVERAGE</span><b>' +
        esc(coverageLabel(source.coverage, source.exactSourceHold)) +
        '</b></article>' +
        '<article><span>SHOW WIKI STATUS</span><b>' + esc(authorityLabel(source.authority)) + '</b></article>' +
        '<article><span>PUBLISHED</span><b>' + esc(formatDate(source.date)) + '</b></article>' +
        '<article><span>LENGTH</span><b>' + esc(formatDuration(source.duration)) + '</b></article>' +
        '<article><span>VIEWS WHEN INDEXED</span><b>' + esc(formatNumber(source.views)) + '</b></article>' +
        '<article><span>CAPTION WORDS</span><b>' + esc(formatNumber(source.wordsAudited)) + '</b></article>' +
        '<article><span>FORMAT</span><b>' + esc(titleCase(source.sourceType).toUpperCase()) + '</b></article>' +
        '<article><span>ARCHIVE COLLECTIONS</span><b>' +
        esc(lanes.length ? lanes.join(" + ").toUpperCase() : "NOT YET SORTED") +
        '</b></article></div>' +
        '<p class="source-dossier-proof-status" role="status"><b>' +
        esc(proof.quarantined ? "WAITING FOR REVIEW" :
          proof.sourceOnly ? "UPLOAD DETAILS ONLY" :
            proof.captionLimited ? "PARTIAL CAPTIONS" : "CAPTIONS AND TIMESTAMPS READY") +
        '</b><span>' + esc(proof.evidenceBoundary) + '</span></p></section>';
    }

    function nowPlayingReceiptMarkup(dossier) {
      var receipt = state.activeReceiptKey ?
        sourceReceiptByKey(dossier, state.activeReceiptKey) : null;
      var guidePlayback = record(state.activePlayback);
      if (!receipt && clean(guidePlayback.mode) !== "episode-guide") return "";
      if (!receipt) {
        var guideAt = number(guidePlayback.at);
        var guideEnd = number(guidePlayback.end);
        var guideReturnId = clean(guidePlayback.returnId) ||
          "sourceDossierShowWikiSummary";
        var guideReturnLabel = clean(guidePlayback.returnLabel) ||
          "EPISODE RECAP";
        return '<aside class="source-dossier-now-playing" id="sourceDossierNowPlaying" ' +
          'role="status" aria-live="polite" aria-atomic="true" ' +
          'data-now-playing-guide="' + esc(guideAt + ":" + guideEnd) +
          '"><header><div><span>NOW PLAYING</span><b>' +
          esc(clean(guidePlayback.label) || "EPISODE GUIDE CUT") +
          '</b></div><time>' + esc(formatTime(guideAt)) +
          (guideEnd > guideAt ? '&mdash;' + esc(formatTime(guideEnd)) : '') +
          '</time></header><p>Playing this exact-show window from the episode guide.</p>' +
          '<div class="source-dossier-now-playing-proof"><span>EPISODE GUIDE CUT</span>' +
          '<span>FROM THIS SHOW // ' + esc(dossier.source.id) +
          '</span><span>SPEAKER NOT CONFIRMED</span></div><footer>' +
          '<a href="#' + esc(guideReturnId) + '">RETURN TO ' +
          esc(guideReturnLabel) + ' &#8595;</a>' +
          '<button type="button" data-source-dossier-action="copy-link">' +
          'COPY THIS MOMENT</button></footer></aside>';
      }
      var wiki = record(dossier.source.showWiki);
      var lanes = array(wiki.lanes).map(record);
      var experience = record(wiki.experience);
      var laneIndex = -1;
      var lane = null;
      lanes.some(function (candidate, index) {
        if (array(candidate.receiptKeys).indexOf(receipt.key) < 0) return false;
        lane = candidate;
        laneIndex = index;
        return true;
      });
      var sequence = array(experience.routeReceiptKeys);
      var sequenceLabel = clean(experience.title) || "WATCH PATH";
      if (sequence.indexOf(receipt.key) < 0 && lane) {
        sequence = array(lane.receiptKeys);
        sequenceLabel = clean(lane.label) || "SHOW WIKI LANE";
      }
      var position = sequence.indexOf(receipt.key);
      var previousKey = position > 0 ? sequence[position - 1] : "";
      var nextKey = position >= 0 && position < sequence.length - 1 ?
        sequence[position + 1] : "";
      var returnId = lane && isShowWikiFamLane(lane) ?
        "sourceDossierWwamFam" : lane ? showWikiLaneId(lane, laneIndex) :
        "sourceDossierShowWikiExperience";
      var excerptText = cleanCaptionExcerpt(receipt.excerpt);
      var excerpt = receipt.publicExcerptAllowed && excerptText
        ? '<p>&ldquo;' + esc(excerptText) + '&rdquo;</p>'
        : '<p class="is-withheld">The timestamp is saved, but this excerpt is not shown publicly.</p>';
      return '<aside class="source-dossier-now-playing" id="sourceDossierNowPlaying" ' +
        'role="status" aria-live="polite" aria-atomic="true" ' +
        'data-now-playing-receipt="' + esc(receipt.key) + '"><header><div><span>NOW PLAYING</span><b>' +
        esc(receipt.label) + '</b></div><time>' + esc(formatTime(receipt.at)) +
        (receipt.end > receipt.at ? '&mdash;' + esc(formatTime(receipt.end)) : '') +
        '</time></header>' + excerpt + '<div class="source-dossier-now-playing-proof"><span>' +
        esc(sequenceLabel) + '</span><span>FROM THIS SHOW // ' + esc(dossier.source.id) +
        '</span><span>SPEAKER NOT CONFIRMED</span></div><footer>' +
        (previousKey ? '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
          esc(previousKey) + '">&#8592; PREVIOUS</button>' : '') +
        '<a href="#' + esc(returnId) + '">RETURN TO ' +
        esc(lane ? clean(lane.label) : "WATCH PATH") + ' &#8595;</a>' +
        '<button type="button" data-source-dossier-action="copy-link">COPY THIS MOMENT</button>' +
        (nextKey ? '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
          esc(nextKey) + '">NEXT &#8594;</button>' : '') +
        '</footer></aside>';
    }

    function playerMarkup(dossier) {
      var source = dossier.source;
      var alternate = record(source.officialAlternate);
      if (clean(alternate.enclosureUrl) &&
          alternate.timestampIsomorphic === true) {
        return '<section class="source-dossier-player-section is-timeline-alternate"' +
          sectionAttributes("player") +
          ' aria-labelledby="sourceDossierPlayerTitle"><header><div><span>' +
          'AGE-GATED YOUTUBE // OFFICIAL WWAM AUDIO</span><h3 id="sourceDossierPlayerTitle">' +
          'THE SAME SHOW PLAYS RIGHT HERE.</h3></div><a href="' +
          esc(source.url) + '" target="_blank" rel="noopener">' +
          'OPEN AGE-RESTRICTED VIDEO &#8599;</a></header>' +
          '<div class="source-dossier-alternate-player is-timeline-matched" ' +
          'id="modalPlayer" data-source-dossier-player><span>' +
          'OFFICIAL WWAM PODCAST EDITION // VERIFIED TIMELINE MATCH</span><h4>' +
          esc(clean(alternate.title) || "Official WWAM audio edition") +
          '</h4><p>YouTube requires an age-authenticated account for the video. ' +
          'This official WWAM podcast edition is within one second of the canonical ' +
          'runtime, so the saved topic and moment jumps work here.</p><audio controls ' +
          'preload="metadata" src="' + esc(alternate.enclosureUrl) +
          '" data-source-dossier-timeline-audio ' +
          'aria-label="Play the official WWAM audio edition"></audio><footer><small>' +
          esc(clean(alternate.evidenceBoundary).toUpperCase()) +
          '</small><a href="' + esc(alternate.episodeUrl) +
          '" target="_blank" rel="noopener">OPEN OFFICIAL EPISODE &#8599;</a></footer></div>' +
          nowPlayingReceiptMarkup(dossier) + '</section>';
      }
      if (clean(alternate.enclosureUrl) &&
          alternate.timestampIsomorphic === false) {
        var alternateRoutes = array(alternate.routes).slice().sort(function (left, right) {
          return number(left.at) - number(right.at) || number(left.rank) - number(right.rank);
        });
        var alternateRouteMarkup = alternateRoutes.length ?
          '<div class="source-dossier-alternate-routes" aria-label="Podcast clock routes"><header><div><span>PODCAST CLOCK</span><b>' +
          esc(formatNumber(alternateRoutes.length)) + ' AUDIO-BOUND ROUTES</b></div><small>These seconds belong to the official podcast player, not the YouTube cut.</small></header><div>' +
          alternateRoutes.map(function (route, index) {
            var at = number(route.at);
            var end = number(route.end) > at ? number(route.end) : at + 12;
            var excerpt = clean(route.excerpt);
            return '<button type="button" data-source-dossier-action="play-alternate-route" data-alternate-at="' +
              esc(at) + '" data-alternate-end="' + esc(end) + '" aria-label="Play podcast route ' +
              esc(String(index + 1)) + ' at ' + esc(formatTime(at)) + '"><b>' +
              esc(String(index + 1).padStart(2, "0")) + '</b><span><strong>' +
              esc(clean(route.label) || clean(route.category) || "PODCAST ROUTE") +
              '</strong><time>' + esc(formatTime(at)) + '</time>' +
              (excerpt ? '<em>' + esc(excerpt) + '</em>' : '') +
              '</span></button>';
          }).join("") + '</div></div>' : '';
        return '<section class="source-dossier-player-section is-official-alternate"' +
          sectionAttributes("player") +
          ' aria-labelledby="sourceDossierPlayerTitle"><header><div><span>' +
          'OFFICIAL ALTERNATE AUDIO</span><h3 id="sourceDossierPlayerTitle">' +
          'THE PLAYABLE EDIT, CLEARLY LABELED.</h3></div><a href="' +
          esc(source.url) + '" target="_blank" rel="noopener">' +
          'OPEN CANONICAL YOUTUBE CUT &#8599;</a></header>' +
          '<div class="source-dossier-alternate-player" ' +
          'id="sourceDossierAlternatePlayer"><span>OFFICIAL WWAM PODCAST EDITION</span><h4>' +
          esc(clean(alternate.title) || "Official alternate edition") +
          '</h4><p>This audio is the official public alternate, not the ' +
          'canonical YouTube timeline. It can play here, but it supplies no ' +
          'YouTube chapters or recap claims.</p><audio controls preload="none" src="' +
          esc(alternate.enclosureUrl) +
          '" data-source-dossier-alternate-audio ' +
          'aria-label="Play the official alternate WWAM podcast edition"></audio>' +
          alternateRouteMarkup +
          '<footer><small>' +
          esc(clean(alternate.evidenceBoundary).toUpperCase()) +
          '</small><a href="' + esc(alternate.episodeUrl) +
          '" target="_blank" rel="noopener">OPEN OFFICIAL EPISODE &#8599;</a></footer></div>' +
          '</section>';
      }
      return '<section class="source-dossier-player-section"' + sectionAttributes("player") +
        ' aria-labelledby="sourceDossierPlayerTitle">' +
        '<header><div><span>WATCH THE SHOW</span><h3 id="sourceDossierPlayerTitle">THE WHOLE UPLOAD, RIGHT HERE.</h3></div>' +
        '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">WATCH ON YOUTUBE &#8599;</a></header>' +
        '<div class="modal-player source-dossier-player" id="modalPlayer" data-source-dossier-player aria-live="polite">' +
        '<img class="source-dossier-player-poster" src="' + esc(source.thumbnail) +
        '" alt="" aria-hidden="true" loading="lazy">' +
        '<div><span>THE PLAYER LOADS WHEN YOU PRESS PLAY.</span>' +
        '<button type="button" data-source-dossier-action="play-source" aria-label="Play ' +
        esc(source.displayTitle || source.title) + ' inside this page">&#9654; WATCH THIS SHOW</button>' +
        '<small>Official YouTube player. If embedding is blocked, the YouTube link stays available.</small></div></div>' +
        nowPlayingReceiptMarkup(dossier) + '</section>';
    }

    function publicReceiptEvidenceLabel(receipt) {
      var evidence = token(clean(receipt.evidenceType) + " " + clean(receipt.evidenceLevel));
      if (evidence.indexOf("audio-feature-candidate") >= 0) {
        if (token(clean(receipt.reviewState) + " " + clean(receipt.evidenceBasis)).indexOf("transcript-cue") >= 0) {
          return "WHISPER TEXT CUE";
        }
        return "AUDIO-RANKED WINDOW";
      }
      return evidence.indexOf("caption") >= 0 ?
        "SOURCE TIMESTAMP" : "TIMESTAMP ON FILE";
    }

    function publicReceiptReviewLabel(receipt) {
      var review = token(receipt.reviewState);
      if (review.indexOf("transcript-cue") >= 0) {
        return "SECONDARY DISCOVERY DOOR";
      }
      return review.indexOf("human") >= 0 || review.indexOf("editor") >= 0 ?
        "EDITOR REVIEWED" : "TIMESTAMP ON FILE";
    }

    function receiptMarkup(receipt, extraClass) {
      var excerptText = cleanCaptionExcerpt(receipt.excerpt);
      var excerpt = receipt.publicExcerptAllowed && excerptText ?
        '&ldquo;' + esc(excerptText) + '&rdquo;' :
        '<span class="source-dossier-withheld">The timestamp is saved; the excerpt is not public.</span>';
      var label = clean(receipt.label) || "SAVED MOMENT";
      var time = formatTime(receipt.at);
      var signal = Number.isFinite(Number(receipt.signalScore)) ?
        '<span class="source-dossier-receipt-signal"><b>FEATURED HERE</b></span>' : '';
      return '<article class="source-dossier-receipt' +
        (extraClass ? ' ' + esc(extraClass) : '') + '" data-receipt-key="' +
        esc(receipt.key) + '"><header><span>' + esc(label) + '</span><time>' +
        esc(time) + '</time>' + signal + '</header><p>' + excerpt +
        '</p><details class="source-dossier-receipt-proof"><summary>ABOUT THIS TIMESTAMP</summary><div>' +
        '<span>' + esc(publicReceiptEvidenceLabel(receipt)) + '</span><span>' +
        esc(publicReceiptReviewLabel(receipt)) + '</span><span>SPEAKER NOT CONFIRMED</span></div></details>' +
        '<footer><button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
        esc(receipt.key) + '" aria-label="Play ' + esc(label) + ' at ' + esc(time) +
        '">&#9654; JUMP TO ' + esc(time) + '</button><button type="button" data-source-dossier-action="bag-receipt" ' +
        'data-receipt-key="' + esc(receipt.key) + '" aria-label="Save ' + esc(label) +
        ' to saved clips">SAVE MOMENT</button></footer></article>';
    }

    function showWikiLaneId(lane, index) {
      return "sourceDossierShowWikiLane-" +
        token(clean(lane.id) || clean(lane.label) || "lane") + "-" + index;
    }

    function isShowWikiFamLane(lane) {
      var identity = token(clean(lane && lane.id) + " " + clean(lane && lane.label));
      return identity.indexOf("wwam-fam") >= 0 ||
        identity.indexOf("fam-roll-call") >= 0;
    }

    function showWikiLaneReceipts(dossier, lane) {
      var seen = {};
      return array(lane.receiptKeys).map(function (key) {
        return sourceReceiptByKey(dossier, clean(key));
      }).filter(function (receipt) {
        if (!receipt || seen[receipt.key]) return false;
        seen[receipt.key] = true;
        return true;
      });
    }

    function isShowWikiHighlightLane(lane) {
      var id = token(clean(lane.id) || clean(lane.label));
      return id === "best-moments" || id === "up-in-ya" ||
        id === "straight-to-steves-asshole" ||
        (id.indexOf("steve") >= 0 && id.indexOf("asshole") >= 0);
    }

    function showWikiLaneDescription(lane) {
      var id = token(clean(lane.id) || clean(lane.label));
      if (id === "best-moments") {
        return "Every standout jump found in this show; the lane grows with the tape.";
      }
      if (id === "up-in-ya") {
        return "Every out-of-pocket turn found in this show, ready to play.";
      }
      if (id === "straight-to-steves-asshole" ||
          (id.indexOf("steve") >= 0 && id.indexOf("asshole") >= 0)) {
        return "Every strong negative take from this show that cleared the evidence gate.";
      }
      if (id === "topics") {
        return "Jump straight to the subjects covered in this upload.";
      }
      if (id === "funny-moments") {
        return "Every comedy turn found in this upload, with the original timestamp.";
      }
      if (id === "character-bits") {
        return "Editor-confirmed recurring-character performances from this upload.";
      }
      if (id === "character-references") {
        return "Named callbacks from this upload. A reference is not presented as a performance.";
      }
      var description = clean(lane.description);
      return /(machine|operator|showcase[- ]receipt[- ]score|signal score)/i.test(description) ?
        "Playable moments saved from this exact upload." : description;
    }

    function isSourceBrief(dossier) {
      var wiki = record(dossier && dossier.source && dossier.source.showWiki);
      var brief = record(wiki.brief);
      return clean(wiki.status) === "source-brief" &&
        clean(brief.kind) === "source-metadata-brief" &&
        clean(brief.scope) === "canonical-source-metadata-only";
    }

    function showWikiHasFanRead(dossier) {
      var guide = record(record(dossier && dossier.source && dossier.source.showWiki).episodeGuide);
      var fanRead = record(guide.fanRead);
      var why = record(fanRead.whyThisNightMatters);
      return Boolean(clean(why.body) || ["loved", "hated", "wildestDetour", "lastWord"].some(function (key) {
        var item = record(fanRead[key]);
        return clean(item.body) && clean(item.cutId) && sourceGuideCutById(dossier, item.cutId);
      }));
    }

    function episodeRecapFor(dossier) {
      return record(record(dossier && dossier.source && dossier.source.showWiki).episodeRecap);
    }

    function topicNavigationOnly(dossier) {
      return record(record(dossier && dossier.source).rightsPolicy)
        .restrictedToTopicNavigation === true;
    }

    function hasEpisodeRecap(dossier) {
      return clean(episodeRecapFor(dossier).schema) === "wwam-feldman-recap/v1";
    }

    function hasReadyEpisodeRecap(dossier) {
      var recap = episodeRecapFor(dossier);
      return clean(recap.schema) === "wwam-feldman-recap/v1" &&
        clean(recap.state) === "ready";
    }

    function episodeRecapStory(dossier) {
      if (!hasReadyEpisodeRecap(dossier)) return [];
      return array(episodeRecapFor(dossier).story).map(record).filter(function (reel) {
        return clean(reel.label) &&
          Number.isFinite(Number(reel.playAt != null ? reel.playAt : reel.at));
      });
    }

    function humanEditorialEpisodeRecap(recap) {
      recap = record(recap);
      return /human-editorial/i.test(clean(recap.editorialState)) ||
        record(recap.editorialEvidence).humanEditorialRead === true ||
        record(recap.caseFile).humanEditorialRead === true;
    }

    function structuredSummaryEpisodeRecap(recap) {
      recap = record(recap);
      return !humanEditorialEpisodeRecap(recap) &&
        clean(recap.editorialState) === "structured-source-summary";
    }

    function canonicalEditorialEpisodeRecap(recap) {
      recap = record(recap);
      return humanEditorialEpisodeRecap(recap) ||
        structuredSummaryEpisodeRecap(recap);
    }

    function episodeRecapReplayMoments(dossier) {
      if (!hasReadyEpisodeRecap(dossier)) return [];
      var recap = episodeRecapFor(dossier);
      /*
       * A source-summary pack may retain candidate moments internally for
       * search and later editorial work. They are not a public best-of shelf:
       * automatic captions and generic labels do not become finished comedy.
       */
      if (structuredSummaryEpisodeRecap(recap)) return [];
      var humanEditorial = humanEditorialEpisodeRecap(recap);
      var bestMoments = array(recap.bestMoments).map(record).filter(function (moment) {
        return (
          clean(moment.receiptKey) &&
          sourceReceiptByKey(dossier, moment.receiptKey)
        ) || humanEditorial && Number.isFinite(Number(moment.playAt));
      });
      var highlightRunway = array(recap.highlightRunway).map(record).filter(function (moment) {
        return (
          clean(moment.receiptKey) &&
          sourceReceiptByKey(dossier, moment.receiptKey)
        ) || (
          clean(moment.guideCutId) &&
          sourceGuideCutById(dossier, moment.guideCutId)
        ) || humanEditorial && Number.isFinite(Number(moment.playAt));
      });
      return highlightRunway.length ? highlightRunway : bestMoments;
    }

    function formatStoryFrame(source, tier) {
      var formatId = clean(record(source && source.runtimeFormat).id);
      var topicOnly = clean(tier) === "topic-recap";
      var frames = {
        "ranking": [
          "THE BOARD FILE // SOURCE-LINKED EPISODE MAP",
          topicOnly ? "THE RANKING SUBJECTS, IN TAPE ORDER." :
            "THE PICKS, ARGUMENTS, AND DETOURS, IN TAPE ORDER.",
        ],
        "audience-q-and-a": [
          "THE OPEN LINE // SOURCE-LINKED QUESTION MAP",
          topicOnly ? "THE QUESTION SUBJECTS, IN TAPE ORDER." :
            "THE QUESTIONS, ANSWERS, AND DETOURS, IN TAPE ORDER.",
        ],
        "movie-news": [
          "THE NIGHT WIRE // SOURCE-LINKED STORY MAP",
          topicOnly ? "THE NEWS SUBJECTS, IN TAPE ORDER." :
            "THE STORIES, REACTIONS, AND DETOURS, IN TAPE ORDER.",
        ],
        "trailer-coverage": [
          "THE TRAILER DESK // SOURCE-LINKED BREAKDOWN MAP",
          topicOnly ? "THE TRAILER SUBJECTS, IN TAPE ORDER." :
            "THE SETUP, BREAKDOWN, AND AFTERTALK, IN TAPE ORDER.",
        ],
        "movie-review": [
          "THE VERDICT FILE // SOURCE-LINKED REVIEW MAP",
          topicOnly ? "THE REVIEW SUBJECTS, IN TAPE ORDER." :
            "THE REVIEW, ARGUMENTS, AND DETOURS, IN TAPE ORDER.",
        ],
        "movie-companion": [
          "THE COMPANION TRACK // SOURCE-LINKED WATCH MAP",
          topicOnly ? "THE WATCHALONG SUBJECTS, IN TAPE ORDER." :
            "THE WATCHALONG, REACTIONS, AND DETOURS, IN TAPE ORDER.",
        ],
        "scary-video-watch-party": [
          "THE WATCH PARTY // SOURCE-LINKED REACTION MAP",
          topicOnly ? "THE VIDEO SUBJECTS, IN TAPE ORDER." :
            "THE SUBMISSIONS, REACTIONS, AND DETOURS, IN TAPE ORDER.",
        ],
        "script-reading": [
          "THE SCRIPT DESK // SOURCE-LINKED READING MAP",
          topicOnly ? "THE SCRIPT SUBJECTS, IN TAPE ORDER." :
            "THE READING, IMPROVISATIONS, AND AFTERTALK, IN TAPE ORDER.",
        ],
      };
      return frames[formatId] || [
        topicOnly ?
          "THE FELDMAN CUT // SOURCE SUBJECT MAP" :
          clean(tier) === "full-chronicle" ?
            "THE FELDMAN CUT // FULL EPISODE RECAP" :
            "THE FELDMAN CUT // PLAYABLE EPISODE RECAP",
        topicOnly ?
          "THE INDEXED SUBJECT STOPS, IN TAPE ORDER." :
          clean(tier) === "full-chronicle" ?
            "THE WHOLE SHOW, WITHOUT HUNTING THE TIMELINE." :
            "THE NIGHT'S SAVED STORY, WITHOUT HUNTING THE TIMELINE.",
      ];
    }

    function episodeRecapTopicEntries(dossier, maximum) {
      if (!hasReadyEpisodeRecap(dossier)) return [];
      var source = record(dossier.source);
      var recap = episodeRecapFor(dossier);
      var pool = array(source.receipts).map(record).filter(function (receipt) {
        return /topic/i.test(clean(receipt.kind) + " " + clean(receipt.evidenceType));
      });
      var used = {};
      return array(recap.topics).slice(0, maximum || 8).map(function (topic) {
        var normalizedTopic = clean(topic).replace(
          /^(?:TOPIC|CHARACTER PERFORMANCE|CHARACTER|MOMENT)\s*:\s*/i,
          ""
        ).toLowerCase();
        var receipt = pool.find(function (candidate) {
          var normalizedLabel = clean(candidate.label).replace(
            /^(?:TOPIC|CHARACTER PERFORMANCE|CHARACTER|MOMENT)\s*:\s*/i,
            ""
          ).toLowerCase();
          return normalizedLabel === normalizedTopic && !used[clean(candidate.key)];
        });
        if (!receipt) return null;
        used[clean(receipt.key)] = true;
        return { topic: clean(topic), receipt: receipt };
      }).filter(Boolean);
    }

    function feldmanDamageCardId(key) {
      return "sourceDossierFeldmanDamage-" + token(titleCase(key));
    }

    function feldmanDamageShortcutSpecs(dossier) {
      if (!hasReadyEpisodeRecap(dossier)) return [];
      var recap = episodeRecapFor(dossier);
      if (structuredSummaryEpisodeRecap(recap)) return [];
      var fanRead = record(recap.fanRead);
      var lanes = array(record(dossier.source.showWiki).lanes).map(record);
      var specs = [
        {
          key: "hated",
          label: "STRAIGHT TO STEVE'S ASSHOLE",
          matchesLane: function (identity) {
            return identity.indexOf("steve") >= 0 && identity.indexOf("asshole") >= 0;
          }
        },
        {
          key: "wildestDetour",
          label: "WWAM UP IN YA",
          matchesLane: function (identity) {
            return identity.indexOf("up-in-ya") >= 0;
          }
        }
      ];
      return specs.filter(function (spec) {
        if (!clean(record(fanRead[spec.key]).body)) return false;
        return !lanes.some(function (lane) {
          var identity = token(clean(lane.id) + " " + clean(lane.label));
          return spec.matchesLane(identity) &&
            showWikiLaneReceipts(dossier, lane).length > 0;
        });
      }).map(function (spec) {
        return {
          id: feldmanDamageCardId(spec.key),
          label: spec.label
        };
      });
    }

    function showWikiLocalNavMarkup(dossier) {
      var wiki = record(dossier.source.showWiki);
      var lanes = array(wiki.lanes).map(record);
      var experience = record(wiki.experience);
      var links = [];
      var sourceBrief = isSourceBrief(dossier);
      if (hasEpisodeRecap(dossier) || sourceBrief ||
          clean(record(wiki.recap).overview) || dossier.source.summary) {
        links.push({
          id: "sourceDossierShowWikiSummary",
          label: hasReadyEpisodeRecap(dossier) ? "FELDMAN RECAP" :
            hasEpisodeRecap(dossier) ? "RECAP STATUS" :
              sourceBrief ? "SOURCE BRIEF" : "RECAP"
        });
      }
      var audioListeningCount = array(dossier.source.receipts).filter(function (receipt) {
        return clean(receipt && receipt.evidenceType).toLowerCase() ===
          "audio-feature-candidate";
      }).length;
      if (!sourceBrief && audioListeningCount) {
        links.push({ id: "sourceDossierListeningPass", label: "LISTENING PASS" });
      }
      links.push({ id: "sourceDossierWwamFam", label: "FAM ROLL CALL" });
      if (!sourceBrief && showWikiHasFanRead(dossier)) {
        links.push({ id: "sourceDossierFanRead", label: "FAN READ" });
      }
      if (!sourceBrief && clean(record(wiki.episodeGuide).schema)) {
        links.push({ id: "sourceDossierEpisodeGuide", label: "DEEP DIVE" });
      }
      if (!sourceBrief &&
          showWikiExperienceReceipts(dossier, experience.routeReceiptKeys).length) {
        links.push({ id: "sourceDossierShowWikiExperience", label: clean(experience.title) || "WATCH PATH" });
      }
      if (!sourceBrief) {
        lanes.forEach(function (lane, index) {
          if (isShowWikiFamLane(lane)) return;
          if (!showWikiLaneReceipts(dossier, lane).length) return;
          links.push({ id: showWikiLaneId(lane, index), label: clean(lane.label) });
        });
        links = links.concat(feldmanDamageShortcutSpecs(dossier));
      }
      links.push({ id: SECTION_IDS.aftermath, label: "AFTERMATH PACK" });
      links.push({
        id: SECTION_IDS.ask,
        label: sourceBrief ? "ASK SOURCE FACTS" : "ASK THIS SHOW"
      });
      return '<nav class="source-dossier-wiki-local-nav" aria-label="Jump within this Show Wiki"><span>IN THIS SHOW</span><div>' +
        links.map(function (link) {
          return '<a href="#' + esc(link.id) + '">' + esc(link.label) + '</a>';
        }).join("") + '</div></nav>';
    }

    function exploreMarkup(dossier) {
      var wiki = record(dossier.source.showWiki);
      var lanes = array(wiki.lanes).map(record);
      var experience = record(wiki.experience);
      var sourceBrief = isSourceBrief(dossier);
      var compact = !state.fullFile;
      var canonicalRecap = hasReadyEpisodeRecap(dossier) &&
        canonicalEditorialEpisodeRecap(episodeRecapFor(dossier));
      var recap = episodeRecapFor(dossier);
      var humanEditorialStory = hasReadyEpisodeRecap(dossier) &&
        (humanEditorialEpisodeRecap(recap) ||
          !clean(recap.editorialState)) &&
        episodeRecapStory(dossier).length > 0;
      var recapHasHighlights = hasReadyEpisodeRecap(dossier) &&
        episodeRecapReplayMoments(dossier).length > 0;
      var hasTopicRail = !sourceBrief &&
        episodeRecapTopicEntries(dossier, 1).length > 0;
      var links = [];
      var seen = {};
      function add(id, label) {
        id = clean(id);
        label = clean(label);
        if (!id || !label || seen[id]) return;
        seen[id] = true;
        links.push({ id: id, label: label });
      }
      function signatureDestination(identity, fallbackLabel) {
        var damage = feldmanDamageShortcutSpecs(dossier).find(function (candidate) {
          return identity(token(candidate.label));
        }) || null;
        if (canonicalRecap) return damage;
        var lane = lanes.find(function (candidate) {
          var haystack = token(clean(candidate.id) + " " + clean(candidate.label));
          return identity(haystack) &&
            showWikiLaneReceipts(dossier, candidate).length > 0;
        });
        if (lane) {
          return {
            id: showWikiLaneId(lane, lanes.indexOf(lane)),
            label: fallbackLabel
          };
        }
        return damage;
      }

      add(SECTION_IDS.player, "WATCH");
      add(
        "sourceDossierShowWikiSummary",
        hasReadyEpisodeRecap(dossier) ? "RECAP" :
          hasEpisodeRecap(dossier) ? "RECAP STATUS" :
            sourceBrief ? "SOURCE BRIEF" : "SUMMARY"
      );
      var audioListeningCount = array(dossier.source.receipts).filter(function (receipt) {
        return clean(receipt && receipt.evidenceType).toLowerCase() ===
          "audio-feature-candidate";
      }).length;
      if (!sourceBrief && audioListeningCount) {
        add("sourceDossierListeningPass", "LISTENING PASS");
      }
      add("sourceDossierWwamFam", "FAM ROLL CALL");
      if (!sourceBrief && recapHasHighlights) {
        add("sourceDossierFeldmanBest", "HIGHLIGHTS");
      }
      if (humanEditorialStory) {
        add("sourceDossierFeldmanStory", "EPISODE STORY");
      }
      if (!sourceBrief) {
        var upInYa = signatureDestination(function (identity) {
          return identity.indexOf("up-in-ya") >= 0;
        }, "UP IN YA");
        var steve = signatureDestination(function (identity) {
          return identity.indexOf("steve") >= 0 &&
            identity.indexOf("asshole") >= 0;
        }, "STEVE'S ASSHOLE");
        if (upInYa) add(upInYa.id, upInYa.label);
        if (steve) add(steve.id, steve.label);
      }
      if (hasTopicRail) add("sourceDossierFeldmanTopics", "TOPICS");
      if (!canonicalRecap && !sourceBrief &&
          clean(record(wiki.episodeGuide).schema)) {
        add("sourceDossierEpisodeGuide", "DEEP DIVE");
      }
      add(
        SECTION_IDS.ask,
        sourceBrief ? "ASK SOURCE FACTS" : "ASK THIS SHOW"
      );
      if (!canonicalRecap && !compact && !sourceBrief &&
          showWikiExperienceReceipts(dossier, experience.routeReceiptKeys).length) {
        add("sourceDossierShowWikiExperience", clean(experience.title));
      }
      if (!canonicalRecap && !compact && !sourceBrief) {
        lanes.forEach(function (lane, index) {
          if (isShowWikiFamLane(lane)) return;
          if (!showWikiLaneReceipts(dossier, lane).length) return;
          if (hasTopicRail &&
              (clean(lane.id).toLowerCase() === "topics" ||
               clean(lane.label).toUpperCase() === "TOPICS")) return;
          add(showWikiLaneId(lane, index), clean(lane.label));
        });
        add(SECTION_IDS.aftermath, "AFTERMATH PACK");
        add(SECTION_IDS.inside, "ALL TIMESTAMPS");
      } else if (!sourceBrief && !canonicalRecap) {
        add(SECTION_IDS.inside, "MORE");
      }
      return '<nav class="source-dossier-explore" aria-label="Explore this show">' +
        '<span>' + (compact ? "SHOW MENU" : "GO STRAIGHT TO") +
        '</span><div>' + links.map(function (link) {
          return '<a href="#' + esc(link.id) + '">' + esc(link.label) + '</a>';
        }).join("") + '</div></nav>';
    }

    function showWikiExperienceReceipts(dossier, keys) {
      var seen = {};
      return array(keys).map(function (key) {
        return sourceReceiptByKey(dossier, clean(key));
      }).filter(function (receipt) {
        if (!receipt || seen[receipt.key]) return false;
        seen[receipt.key] = true;
        return true;
      });
    }

    function showWikiExperienceMarkup(dossier, compact) {
      var source = dossier.source;
      var experience = record(record(source.showWiki).experience);
      if (!clean(experience.title)) return "";
      var route = showWikiExperienceReceipts(dossier, experience.routeReceiptKeys);
      var pulse = showWikiExperienceReceipts(dossier, experience.pulseReceiptKeys);
      var experienceId = "sourceDossierShowWikiExperience";
      if (!route.length) {
        return '<section class="source-dossier-wiki-experience is-queued" id="' +
          experienceId + '" data-show-wiki-experience="' + esc(clean(experience.id)) +
          '"><header><span>' + esc(experience.label) + '</span><h4>' +
          esc(experience.title) + '</h4></header><p>' + esc(experience.emptyState) +
          '</p><small>No moments are added until this exact upload has usable captions. The full player still works.</small></section>';
      }
      var visibleRoute = compact ? route.slice(0, 3) : route;
      if (compact) pulse = visibleRoute.slice();
      pulse = pulse.slice().sort(function (left, right) {
        return Number(left.at) - Number(right.at) || left.key.localeCompare(right.key);
      });
      var pulseRowLast = [];
      var maximumPulseRow = 0;
      var pulseMarkup = pulse.map(function (receipt, index) {
        var position = Math.max(1, Math.min(99,
          Number(receipt.at || 0) / Math.max(1, Number(source.duration || 1)) * 100));
        var row = pulseRowLast.findIndex(function (lastPosition) {
          return position - lastPosition >= 12;
        });
        if (row < 0) {
          row = pulseRowLast.length;
          pulseRowLast.push(position);
        } else {
          pulseRowLast[row] = position;
        }
        maximumPulseRow = Math.max(maximumPulseRow, row);
        var heat = Number.isFinite(Number(receipt.signalScore))
          ? Math.max(18, Math.min(100, Number(receipt.signalScore))) : 34;
        var heatPixels = Math.round(18 + heat * .72);
        var label = clean(receipt.label) || "SAVED MOMENT";
        var time = formatTime(receipt.at);
        return '<button type="button" class="source-dossier-wiki-pulse-node" ' +
          'style="--pulse-at:' + position.toFixed(2) + '%;--pulse-row:' + row +
          ';--pulse-heat:' + heatPixels + 'px" data-source-dossier-action="play-receipt" data-receipt-key="' +
          esc(receipt.key) + '" aria-label="Play ' + esc(label) + ' at ' + esc(time) +
          '" title="' + esc(label + " // " + time) + '"><span>' +
          esc(index + 1) + '</span></button>';
      }).join("");
      var routeMarkup = visibleRoute.map(function (receipt, index) {
        var time = formatTime(receipt.at);
        var excerptText = cleanCaptionExcerpt(receipt.excerpt);
        var excerpt = receipt.publicExcerptAllowed && excerptText
          ? '<p>“' + esc(excerptText) + '”</p>' :
            '<p class="is-withheld">The timestamp is ready; the excerpt is not public.</p>';
        return '<article class="source-dossier-wiki-route-stop"><header><span>STOP ' +
          esc(String(index + 1).padStart(2, "0")) + '</span><time>' + esc(time) +
          '</time></header><h5>' + esc(receipt.label) + '</h5>' + excerpt +
          '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
          esc(receipt.key) + '" aria-label="Play cut ' + esc(index + 1) + ' at ' +
          esc(time) + '">&#9654; JUMP TO ' + esc(time) + '</button></article>';
      }).join("");
      return '<section class="source-dossier-wiki-experience" id="' + experienceId +
        '" data-show-wiki-experience="' + esc(clean(experience.id)) +
        '" data-show-wiki-route-count="' + esc(route.length) + '"><header><div><span>' +
        esc(experience.label) + '</span><h4>' + esc(experience.title) +
        '</h4></div><b>' + esc(visibleRoute.length) + (compact ? ' STARTER' : '') +
        ' MOMENTS. NO HUNTING.</b></header><p>' +
        (compact ? 'Three strong entry points from this exact upload. Open the full file for the complete watch path.' :
          'A playable route through saved moments from this exact upload, spaced across the runtime.') +
        '</p><div class="source-dossier-wiki-pulse" ' +
        'aria-label="Where the saved moments land in this show"><div class="source-dossier-wiki-pulse-track" style="--pulse-extra-height:' +
        esc(maximumPulseRow * 48) + 'px">' +
        pulseMarkup + '</div><footer><span>00:00</span><b>THE NIGHT’S PULSE</b><span>' +
        esc(formatTime(source.duration)) + '</span></footer></div><div class="source-dossier-wiki-route">' +
        routeMarkup + '</div><footer class="source-dossier-wiki-route-actions"><button type="button" ' +
        'data-source-dossier-action="play-receipt" data-receipt-key="' +
        esc(visibleRoute[0].key) + '">&#9654; START THE WATCH PATH</button>' +
        (compact ? '<button type="button" data-source-dossier-action="open-full-file">OPEN THE COMPLETE WATCH PATH &#8594;</button>' :
          '<button type="button" data-source-dossier-action="bag-experience">SAVE ALL ' + esc(route.length) +
          ' MOMENTS</button><details class="source-dossier-wiki-method"><summary>HOW THIS WATCH PATH WAS PICKED</summary><small>' +
          'Built only from saved timestamps on this exact upload. Speaker identity, intent, and creator approval are not inferred.' +
          '</small></details>') + '</footer></section>';
    }

    function showWikiBriefMarkup(dossier) {
      var source = dossier.source;
      var brief = record(record(source.showWiki).brief);
      if (!isSourceBrief(dossier)) return "";
      var facts = [
        ["UPLOAD DATE", formatDate(source.date)],
        ["RUNTIME", formatDuration(source.duration)],
        ["VIEWS WHEN INDEXED", formatNumber(source.views)],
        ["FORMAT", titleCase(source.sourceType).toUpperCase()],
        ["CAPTION COVERAGE", coverageLabel(
          source.coverage,
          source.exactSourceHold
        )],
        ["SOURCE STATUS", titleCase(source.availability).toUpperCase()],
        ["LIVE STATUS", titleCase(source.liveStatus).toUpperCase()],
        ["SOURCE ID", source.id]
      ];
      return '<article class="source-dossier-wiki-brief" id="sourceDossierShowWikiSummary" ' +
        'data-show-wiki-brief="' + esc(clean(brief.kind)) + '"><header><div>' +
        '<span>SHOW PAGE STARTED // DEEP DIVE NOT READY</span><h4>' +
        esc(clean(source.displayTitle) || clean(source.title)) +
        '</h4></div><b>' + esc(clean(brief.format)) + '</b></header>' +
        '<p>The upload is in the archive, but this show does not have enough usable captions for an honest recap or moment map yet.</p>' +
        '<div class="source-dossier-wiki-brief-facts">' + facts.map(function (fact) {
          return '<span><small>' + esc(fact[0]) + '</small><b>' +
            esc(fact[1] || "NOT AVAILABLE") + '</b></span>';
        }).join("") + '</div><footer><small>WHY THIS PAGE IS LIMITED // VERIFIED UPLOAD DETAILS ONLY</small><button type="button" ' +
        'data-source-dossier-action="stage-intake">QUEUE THE DEEP DIVE &#8594;</button><a href="' +
        esc(source.url) + '" target="_blank" rel="noopener">WATCH ON YOUTUBE &#8599;</a>' +
        '</footer></article>';
    }

    function episodeFormatExperienceFor(dossier) {
      var presenter = root.WWAMEpisodeFormatExperience;
      var factPacks = [
        root.WWAM_EPISODE_FACTS_PILOT,
        root.WWAM_EPISODE_FACTS_BATCH2,
        root.WWAM_EPISODE_FACTS_BATCH3,
      ].filter(Boolean);
      if (!topicNavigationOnly(dossier) &&
          presenter && typeof presenter.build === "function") {
        for (var packIndex = 0; packIndex < factPacks.length; packIndex += 1) {
          try {
            var typed = presenter.build(
              factPacks[packIndex],
              clean(dossier && dossier.source && dossier.source.id)
            );
            if (typed) return typed;
          } catch (error) {
            // Try the next reviewed fact pack before using the archive baseline.
          }
        }
      }
      var fallback = root.WWAMEpisodeFormatFallbackExperience ||
        root.WWAM_EPISODE_FORMAT_FALLBACK_EXPERIENCE;
      if (!fallback || typeof fallback.build !== "function") return null;
      try {
        return fallback.build(record(dossier && dossier.source));
      } catch (error) {
        return null;
      }
    }

    function showWikiFormatExperienceMarkup(dossier, compact) {
      var experience = episodeFormatExperienceFor(dossier);
      var items = episodeFormatDisplayItems(experience);
      if (!experience || !items.length) return "";
      var expanded = !compact || state.recapExpanded;
      var visible = expanded ? items : items.slice(0, 6);
      var phases = array(experience.phaseRail).map(record);

      function playButton(item, label, className) {
        var at = number(item.at);
        var end = number(item.end) > at ? number(item.end) :
          Math.min(number(dossier.source.duration), at + 24);
        return '<button type="button"' +
          (className ? ' class="' + esc(className) + '"' : '') +
          ' data-source-dossier-action="play-guide-cut" data-guide-at="' +
          esc(at) + '" data-guide-end="' + esc(end) +
          '" data-guide-label="' + esc(label) +
          '" data-guide-return="sourceDossierFormatExperience" ' +
          'data-guide-return-label="' + esc(experience.navLabel || "FORMAT DESK") +
          '" aria-label="' + esc(label + " at " + formatTime(at)) +
          '"><span aria-hidden="true">&#9654;</span> ' +
          esc(formatTime(at)) + '</button>';
      }

      function itemMarkup(item, index) {
        var excerpt = cleanCaptionExcerpt(item.excerpt);
        var question = record(item.question);
        var response = record(item.response);
        var qa = clean(experience.kind) === "qa-desk" &&
          Number.isFinite(Number(question.at)) &&
          Number.isFinite(Number(response.at));
        var evidence = "";
        var actions = "";
        if (qa) {
          var questionExcerpt = cleanCaptionExcerpt(question.excerpt);
          var responseExcerpt = cleanCaptionExcerpt(response.excerpt);
          evidence =
            '<div class="source-dossier-format-qa"><div><span>QUESTION CUE</span>' +
            (questionExcerpt ? '<blockquote>&ldquo;' + esc(questionExcerpt) +
              '&rdquo;</blockquote>' : '') + '</div><div><span>RESPONSE WINDOW</span>' +
            (responseExcerpt ? '<blockquote>&ldquo;' + esc(responseExcerpt) +
              '&rdquo;</blockquote>' : '') + '</div></div>';
          actions =
            playButton(question, "Play question cue: " + item.title, "is-question") +
            playButton(response, "Play response window: " + item.title, "is-response");
        } else {
          evidence = excerpt ? '<blockquote>&ldquo;' + esc(excerpt) +
            '&rdquo;</blockquote>' : '';
          actions = playButton(item, "Play " + item.title);
        }
        return '<article class="source-dossier-format-card"><header><span>#' +
          esc(String(index + 1).padStart(2, "0")) + ' // ' +
          esc(clean(item.label) || "SOURCE STOP") + '</span><time>' +
          esc(formatTime(item.at)) + '</time></header><h6>' +
          esc(clean(item.title) || clean(item.topic) || "SOURCE STOP") +
          '</h6><p>' + esc(item.summary) + '</p>' + evidence +
          '<footer>' + actions + '</footer></article>';
      }

      var phaseRail = phases.length ?
        '<nav class="source-dossier-format-phases" aria-label="Whole-show route">' +
        phases.map(function (phase) {
          return playButton(
            phase,
            "Play " + (clean(phase.label) || "timeline marker"),
            "is-phase"
          ).replace(
            "</button>",
            "<small>" + esc(clean(phase.label) || "TAPE STOP") + "</small></button>"
          );
        }).join("") + '</nav>' : "";

      return '<section class="source-dossier-format-experience" ' +
        'id="sourceDossierFormatExperience" data-format-experience="' +
        esc(experience.kind) + '"><header><div><span>' +
        esc(experience.eyebrow) + '</span><h5>' + esc(experience.title) +
        '</h5><p>' + esc(experience.description) + '</p></div><b>' +
        esc(items.length) + ' TAPE-LOCKED ' +
        (items.length === 1 ? 'STOP' : 'STOPS') + '</b></header>' +
        phaseRail + '<div class="source-dossier-format-cards">' +
        visible.map(itemMarkup).join("") + '</div>' +
        (!expanded && items.length > visible.length ?
          '<button type="button" class="source-dossier-format-expand" ' +
          'data-source-dossier-action="toggle-episode-recap" aria-expanded="false">' +
          'OPEN ALL ' + esc(items.length) + ' ' +
          esc(experience.navLabel || "FORMAT") + ' STOPS &#8595;</button>' : '') +
        '<footer><b>' +
        esc(clean(experience.evidenceNotice) || "WHAT THIS PROVES.") +
        '</b><span>' +
        esc(experience.boundary) + '</span></footer></section>';
    }

    function episodeFormatDisplayItems(experience) {
      var items = array(record(experience).items).map(record);
      if (!record(experience).fallback) return items;
      var seen = new Set();
      return items.filter(function keepDistinctVisitorStop(item) {
        var subject = token(clean(item.subject) || clean(item.title));
        var key = String(Math.floor(number(item.at))) + "|" + subject;
        if (!subject || !seen.has(key)) {
          seen.add(key);
          return true;
        }
        return false;
      });
    }

    function episodeTopicRebuildExperienceFor(dossier) {
      if (topicNavigationOnly(dossier)) return null;
      var presenter = root.WWAM_EPISODE_TOPIC_REBUILD_EXPERIENCE ||
        root.WWAMEpisodeTopicRebuildExperience;
      if (!presenter || typeof presenter.build !== "function") return null;
      var batches = [
        root.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH1,
        root.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH2,
        root.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH3,
        root.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH4,
        root.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH5,
      ].filter(Boolean);
      if (!batches.length) return null;
      try {
        return presenter.build(
          batches,
          clean(dossier && dossier.source && dossier.source.id)
        );
      } catch (error) {
        return null;
      }
    }

    function showWikiTopicRebuildExperienceMarkup(dossier, compact) {
      var experience = episodeTopicRebuildExperienceFor(dossier);
      var stops = array(record(experience).stops).map(record);
      if (!experience || !stops.length) return "";
      var expanded = !compact || state.recapExpanded;
      var visible = expanded ? stops : stops.slice(0, 6);
      var lanes = array(experience.lanes).map(record).filter(function (lane) {
        return number(lane.count) > 0;
      });

      function stopMarkup(stop, index) {
        var at = number(stop.at);
        var end = number(stop.end) > at ? number(stop.end) :
          Math.min(number(dossier.source.duration), at + 24);
        var excerpt = cleanCaptionExcerpt(stop.excerpt);
        var title = clean(stop.label) || clean(stop.topic) || "SOURCE STOP";
        return '<article class="source-dossier-format-card ' +
          'source-dossier-topic-stop"><header><span>#' +
          esc(String(index + 1).padStart(2, "0")) + ' // ' +
          esc(clean(stop.visitorLabel) || "SOURCE STOP") +
          '</span><time>' + esc(formatTime(at)) + '</time></header><h6>' +
          esc(title) + '</h6>' +
          (clean(stop.topic) && clean(stop.topic) !== title ?
            '<small class="source-dossier-topic-stop-subject">' +
            esc(stop.topic) + '</small>' : '') +
          '<p>' + esc(stop.summary) + '</p>' +
          (excerpt ? '<blockquote>&ldquo;' + esc(excerpt) +
            '&rdquo;</blockquote>' : '') +
          '<footer><button type="button" ' +
          'data-source-dossier-action="play-guide-cut" data-guide-at="' +
          esc(at) + '" data-guide-end="' + esc(end) +
          '" data-guide-label="' + esc(title) +
          '" data-guide-return="sourceDossierDeepStops" ' +
          'data-guide-return-label="EXACT-SOURCE STOPS" aria-label="' +
          esc("Play " + title + " at " + formatTime(at)) +
          '"><span aria-hidden="true">&#9654;</span> ' +
          esc(formatTime(at)) + '</button></footer></article>';
      }

      return '<section class="source-dossier-format-experience ' +
        'source-dossier-topic-rebuild" id="sourceDossierDeepStops" ' +
        'data-topic-rebuild-experience="ready"><header><div><span>' +
        esc(experience.eyebrow) + '</span><h5>' + esc(experience.title) +
        '</h5><p>' + esc(experience.description) + '</p></div><b>' +
        esc(stops.length) + ' TAPE-LOCKED STOPS</b></header>' +
        (lanes.length ? '<div class="source-dossier-topic-stop-lanes">' +
          lanes.map(function (lane) {
            return '<span><b>' + esc(number(lane.count)) + '</b> ' +
              esc(lane.label) + '</span>';
          }).join("") + '</div>' : '') +
        '<div class="source-dossier-format-cards">' +
        visible.map(stopMarkup).join("") + '</div>' +
        (!expanded && stops.length > visible.length ?
          '<button type="button" class="source-dossier-format-expand" ' +
          'data-source-dossier-action="toggle-episode-recap" aria-expanded="false">' +
          'OPEN ALL ' + esc(stops.length) + ' EXACT-SOURCE STOPS &#8595;</button>' :
          '') +
        '<footer><b>PLAYBACK FIRST.</b><span>' +
        esc(experience.boundary) + '</span></footer></section>';
    }

    function showWikiEpisodeRecapMarkup(dossier, compact) {
      var source = dossier.source;
      var recap = episodeRecapFor(dossier);
      if (clean(recap.schema) !== "wwam-feldman-recap/v1") return "";
      var ready = clean(recap.state) === "ready";
      var topicMapOnly = clean(recap.tier) === "topic-recap";
      var humanEditorial = humanEditorialEpisodeRecap(recap);
      var structuredSummary = structuredSummaryEpisodeRecap(recap);
      var legacyAssembly = ready && !canonicalEditorialEpisodeRecap(recap);
      var sections = array(recap.sections).map(record);
      var story = humanEditorial || legacyAssembly ?
        episodeRecapStory(dossier) : [];
      var replayMoments = episodeRecapReplayMoments(dossier);
      var recapExpanded = !compact || state.recapExpanded;
      var previewSections = compact ? sections.slice(0, 3) : sections;
      var omittedSections = compact ? sections.slice(3) : [];
      var previewStory = compact ? story.slice(0, 2) : story;
      var omittedStory = compact ? story.slice(2) : [];
      var fanRead = structuredSummary ? {} : record(recap.fanRead);
      var recapCase = record(recap.caseFile);
      var topicMap = array(recap.topicMap).map(record).filter(function (topic) {
        return clean(topic.label) &&
          (clean(topic.receiptKey) || clean(topic.guideCutId));
      });
      var officialAlternate = record(source.officialAlternate);
      var formatExperienceMarkup = showWikiFormatExperienceMarkup(
        dossier,
        compact
      );
      var topicRebuildExperienceMarkup =
        showWikiTopicRebuildExperienceMarkup(dossier, compact);

      function recapPlayAttributes(item, label) {
        var publicPlayAt = Number(item.playAt);
        if (Number.isFinite(publicPlayAt) &&
            publicPlayAt >= 0 &&
            publicPlayAt <= number(source.duration)) {
          var publicPlayEnd = Number(item.playEnd);
          if (!Number.isFinite(publicPlayEnd) || publicPlayEnd <= publicPlayAt) {
            publicPlayEnd = Math.min(number(source.duration), publicPlayAt + 30);
          }
          return 'data-source-dossier-action="play-guide-cut" ' +
            'data-guide-at="' + esc(publicPlayAt) + '" data-guide-end="' +
            esc(publicPlayEnd) + '" data-guide-label="' + esc(label) +
            '" data-guide-return="sourceDossierFeldmanStory" ' +
            'data-guide-return-label="EPISODE RECAP" aria-label="' +
            esc(label + " at " + formatTime(publicPlayAt)) + '"';
        }
        var guideAnchor = record(item.guideAnchor);
        var guideAnchorId = clean(guideAnchor.id);
        var guideAt = number(guideAnchor.at);
        if (guideAnchorId && guideAt <= number(source.duration)) {
          var guideEnd = number(guideAnchor.end) > guideAt ?
            number(guideAnchor.end) :
            Math.min(number(source.duration), guideAt + 30);
          return 'data-source-dossier-action="play-guide-cut" ' +
            'data-guide-at="' + esc(guideAt) + '" data-guide-end="' +
            esc(guideEnd) + '" data-guide-label="' + esc(label) +
            '" data-guide-return="sourceDossierFeldmanStory" ' +
            'data-guide-return-label="FELDMAN RECAP" aria-label="' +
            esc(label + " at " + formatTime(guideAt)) + '"';
        }
        var anchorReceiptKey = clean(item.anchorReceiptKey);
        var receiptKey = clean(
          anchorReceiptKey || array(item.receiptKeys)[0] || item.receiptKey
        );
        var at = anchorReceiptKey ? number(item.anchorAt) : number(item.at);
        var end = number(item.end) > at ? number(item.end) :
          Math.min(number(source.duration), at + 30);
        if (receiptKey && sourceReceiptByKey(dossier, receiptKey)) {
          return 'data-source-dossier-action="play-receipt" ' +
            'data-receipt-key="' + esc(receiptKey) + '" aria-label="' +
            esc(label + " at " + formatTime(at)) + '"';
        }
        if (clean(item.guideCutId)) {
          return 'data-source-dossier-action="play-guide-cut" ' +
            'data-guide-at="' + esc(at) + '" data-guide-end="' + esc(end) +
            '" data-guide-label="' + esc(label) +
            '" data-guide-return="sourceDossierFeldmanActs" ' +
            'aria-label="' + esc(label + " at " + formatTime(at)) +
            '"';
        }
        return "";
      }

      function recapPlayButton(item, label) {
        var attributes = recapPlayAttributes(item, label);
        if (!attributes) return "";
        var guideAnchor = record(item.guideAnchor);
        var playAt = Number.isFinite(Number(item.playAt)) ?
          number(item.playAt) : clean(guideAnchor.id) ?
          number(guideAnchor.at) :
          clean(item.anchorReceiptKey) ? number(item.anchorAt) : number(item.at);
        return '<button type="button" ' + attributes +
          '><span aria-hidden="true">&#9654;</span> PLAY ' +
          esc(formatTime(playAt)) + '</button>';
      }

      function recapCaseFileMarkup() {
        var caseFile = record(recap.caseFile);
        var evidenceProfile = record(recap.evidenceProfile);
        var profile = Object.keys(caseFile).length ? caseFile : evidenceProfile;
        if (!Object.keys(profile).length) return "";
        var counts = record(profile.counts);

        function metric(keys) {
          var value = null;
          keys.some(function (key) {
            if (Object.prototype.hasOwnProperty.call(profile, key)) {
              value = profile[key];
              return true;
            }
            if (Object.prototype.hasOwnProperty.call(counts, key)) {
              value = counts[key];
              return true;
            }
            return false;
          });
          if (value == null || value === "" || !Number.isFinite(Number(value))) return null;
          return Math.max(0, Number(value));
        }

        var stats;
        if (clean(recap.tier) === "full-chronicle") {
          stats = [
            ["receipts", "PLAYABLE TIMESTAMPS",
              metric(["receiptCount", "receipts", "registeredReceipts"])],
            ["cuts", "FULL-CAPTION CUTS", metric(["guideCutCount", "cuts"])],
            ["threads", "STORY THREADS", metric(["threadCount", "threads"])],
            ["acts", "RECAP ACTS", metric(["actCount", "acts"])],
            ["coverage", "INDEXED RECEIPTS ACCOUNTED FOR",
              metric(["storyCoveragePercent", "recapCoveragePercent"])],
            ["span", "EVIDENCE SPAN",
              metric(["tapeSpanPercent", "spanPercent", "tapeSpan"])],
            ["closing", "LAST PLAYABLE ANCHOR",
              metric(["lastPlayableAnchorPercent"])]
          ];
        } else if (clean(recap.tier) === "topic-recap") {
          stats = [
            ["receipts", "PLAYABLE TIMESTAMPS",
              metric(["receiptCount", "receipts", "registeredReceipts"])],
            ["topics", "TOPIC DOORS", metric(["topicCount", "topics", "topicDoors"])],
            ["mentions", "TOPIC MENTIONS", metric(["topicMentionTotal"])],
            ["acts", "PLAYABLE ACTS", metric(["actCount", "acts"])],
            ["coverage", "INDEXED RECEIPTS ACCOUNTED FOR",
              metric(["storyCoveragePercent", "recapCoveragePercent"])],
            ["span", "EVIDENCE SPAN",
              metric(["tapeSpanPercent", "spanPercent", "tapeSpan"])],
            ["closing", "LAST PLAYABLE ANCHOR",
              metric(["lastPlayableAnchorPercent"])]
          ];
        } else {
          stats = [
            ["receipts", "RECEIPTS", metric(["receiptCount", "receipts", "registeredReceipts"])],
            ["topics", "TOPIC DOORS", metric(["topicCount", "topics", "topicDoors"])],
            ["moments", "SAVED SPIKES", metric(["momentCount", "moments", "savedSpikes"])],
            ["characters", "CHARACTER LEADS",
              metric(["characterCount", "characters", "characterLeads"])],
            ["coverage", "INDEXED RECEIPTS ACCOUNTED FOR",
              metric(["storyCoveragePercent", "recapCoveragePercent"])],
            ["span", "EVIDENCE SPAN",
              metric(["tapeSpanPercent", "spanPercent", "tapeSpan"])],
            ["closing", "LAST PLAYABLE ANCHOR",
              metric(["lastPlayableAnchorPercent"])]
          ];
        }
        stats = stats.filter(function (stat) { return stat[2] != null; });
        if (!stats.length) return "";
        return '<aside class="source-dossier-feldman-case-file" ' +
          'aria-label="Exact-show recap evidence profile"><header><span>' +
          'EXACT-SHOW CASE FILE</span><small>' + esc(stats.length) +
          ' SOURCE MEASUREMENTS</small></header><div>' +
          stats.map(function (stat) {
            var value = stat[0] === "span" || stat[0] === "coverage" ||
                stat[0] === "closing" ?
              Math.round(stat[2]) + "%" : formatNumber(Math.round(stat[2]));
            return '<span data-feldman-stat="' + esc(stat[0]) + '"><b>' +
              esc(value) + '</b><small>' + esc(stat[1]) + '</small></span>';
          }).join("") + '</div></aside>';
      }

      if (!ready) {
        var facts = [
          ["UPLOAD", formatDate(source.date)],
          ["RUNTIME", formatDuration(source.duration)],
          ["VIEWS WHEN INDEXED", formatNumber(source.views)],
          ["FORMAT", clean(record(recap.format).label) || titleCase(source.sourceType)],
          ["CAPTION STATE", coverageLabel(
            source.coverage,
            source.exactSourceHold
          )],
          ["SOURCE STATUS", titleCase(source.availability).toUpperCase()],
        ];
        var alternateMarkup = "";
        if (clean(officialAlternate.episodeUrl) &&
            clean(officialAlternate.enclosureUrl) &&
            officialAlternate.timestampIsomorphic === false) {
          var delta = Math.round(Math.abs(number(officialAlternate.durationDelta)));
          var deltaMinutes = Math.floor(delta / 60);
          var deltaSeconds = delta % 60;
          var deltaLabel = (deltaMinutes ?
            deltaMinutes + " minute" + (deltaMinutes === 1 ? "" : "s") + " " :
            "") + deltaSeconds + " second" + (deltaSeconds === 1 ? "" : "s");
          alternateMarkup =
            '<aside class="source-dossier-official-alternate" role="note">' +
            '<header><span>OFFICIAL WWAM ALTERNATE EDITION</span><b>' +
            'PLAYABLE HERE // TIMELINE KEPT SEPARATE</b></header><h5>' +
            esc(clean(officialAlternate.title) || "Official podcast edition") +
            '</h5><p>This official WWAM podcast edition plays in the source ' +
            'player above, ' +
            'but it runs ' + esc(deltaLabel) +
            ' longer than the canonical YouTube cut. Its audio is never used ' +
            'to invent YouTube chapters or timestamps.</p>' +
            '<footer><small>' +
            esc(clean(officialAlternate.evidenceBoundary).toUpperCase()) +
            '</small><a href="#sourceDossierAlternatePlayer">' +
            'OPEN OFFICIAL AUDIO &#8593;</a><a href="' +
            esc(officialAlternate.episodeUrl) +
            '" target="_blank" rel="noopener">OPEN OFFICIAL EPISODE &#8599;</a></footer>' +
            '</aside>';
        }
        return '<section class="source-dossier-feldman-recap is-held" ' +
          'id="sourceDossierShowWikiSummary" data-feldman-recap="held">' +
          '<header><div class="source-dossier-feldman-heading"><span>' +
          esc(recap.label) + '</span><h4>' + esc(recap.headline) +
          '</h4></div><b>' + esc(recap.badge) +
          '</b></header><p class="source-dossier-feldman-deck">' +
          esc(recap.deck) + '</p><p class="source-dossier-feldman-overview">' +
          esc(recap.overview) + '</p>' + alternateMarkup +
          '<div class="source-dossier-feldman-held-action">' +
          '<button type="button" data-source-dossier-action="stage-intake">' +
          '<span>START THIS SHOW\'S DEEP DIVE</span><b>QUEUE THE TAPE &#8594;</b>' +
          '</button><small>No episode claims are created until this exact upload has usable evidence.</small>' +
          '</div><div class="source-dossier-feldman-facts">' +
          facts.map(function (fact) {
            return '<span><small>' + esc(fact[0]) + '</small><b>' +
              esc(fact[1] || "NOT AVAILABLE") + '</b></span>';
          }).join("") + '</div><footer><small>NO MADE-UP EPISODE EVENTS // SOURCE DETAILS ONLY</small>' +
          '<a href="' + esc(source.url) +
          '" target="_blank" rel="noopener">WATCH ON YOUTUBE &#8599;</a></footer></section>';
      }

      function recapSectionMarkup(section, index) {
        var displayAt = Number.isFinite(Number(section.displayAt)) ?
          number(section.displayAt) : number(section.at);
        return '<article class="source-dossier-feldman-act" data-feldman-act="' +
          esc(section.id) + '"><header><span>ACT ' +
          esc(String(index + 1).padStart(2, "0")) + '</span><time>' +
          esc(formatTime(displayAt)) + '</time></header><h5>' +
          esc(section.label) + '</h5><p>' + esc(section.displayBody || section.body) + '</p>' +
          '<footer>' + recapPlayButton(section, "Play recap act " + (index + 1)) +
          '<small>EXACT-SHOW EVIDENCE</small></footer></article>';
      }

      function recapStoryReelMarkup(reel, index) {
        var at = Number.isFinite(Number(reel.displayAt)) ?
          number(reel.displayAt) : number(reel.at);
        var end = Number.isFinite(Number(reel.displayEnd)) ?
          number(reel.displayEnd) : number(reel.end);
        var nextAt = index + 1 < story.length ? number(story[index + 1].at) : 0;
        var displayEnd = nextAt > at ? Math.min(end, nextAt) : end;
        var range = formatTime(at);
        if (topicMapOnly) {
          range += " // TOPIC DOOR";
        } else if (displayEnd >= at + 60) {
          range += " \u2014 " + formatTime(displayEnd);
        }
        var label = clean(reel.label) ||
          "REEL " + String(index + 1).padStart(2, "0");
        return '<article class="source-dossier-feldman-story-reel" ' +
          'data-feldman-story="' + esc(clean(reel.id) || "reel-" + (index + 1)) +
          '"><header><span>' +
          esc(String(index + 1).padStart(2, "0")) +
          '</span><time>' + esc(range) + '</time></header><div><h5>' +
          esc(label) + '</h5>' +
          (clean(reel.body) ? '<p>' + esc(reel.body) + '</p>' : '') +
          '</div><footer>' +
          recapPlayButton(reel, "Play episode story reel " + (index + 1)) +
          '</footer></article>';
      }

      var storyMarkup = "";
      if (story.length) {
        var storyTier = clean(recap.tier);
        var storyFrame = formatStoryFrame(source, storyTier);
        var storyEyebrow = storyFrame[0];
        var storyTitle = storyFrame[1];
        var previewStoryMarkup = previewStory.map(function (reel, index) {
          return recapStoryReelMarkup(reel, index);
        }).join("");
        var omittedStoryMarkup = omittedStory.map(function (reel, index) {
          return recapStoryReelMarkup(reel, previewStory.length + index);
        }).join("");
        var storyControls = "sourceDossierFeldmanStoryRemainder";
        var storyToggle = compact && omittedStory.length ?
          '<button type="button" class="source-dossier-feldman-story-toggle" ' +
          'data-source-dossier-action="toggle-episode-recap" aria-controls="' +
          esc(storyControls) + '" aria-expanded="' +
          (recapExpanded ? 'true' : 'false') + '">' +
          (recapExpanded ? 'BACK TO THE TWO-REEL CUT &#8593;' :
            'KEEP READING // OPEN ALL ' + esc(story.length) + ' REELS &#8595;') +
          '</button>' : '';
        storyMarkup =
          '<section class="source-dossier-feldman-story" ' +
          'id="sourceDossierFeldmanStory" aria-labelledby="' +
          'sourceDossierFeldmanStoryTitle" data-feldman-story-count="' +
          esc(story.length) + '" data-feldman-story-expanded="' +
          (recapExpanded ? 'true' : 'false') + '"><header><div><span>' +
          esc(storyEyebrow) + '</span><h5 ' +
          'id="sourceDossierFeldmanStoryTitle">' + esc(storyTitle) +
          '</h5></div><b>' + esc(story.length) + ' ' +
          (story.length === 1 ? 'REEL' : 'REELS') + ' // ' +
          esc(formatDuration(source.duration)) + ' ON THE CLOCK</b></header>' +
          '<div class="source-dossier-feldman-story-reels">' +
          previewStoryMarkup + '</div>' +
          (compact && omittedStory.length ?
            '<div class="source-dossier-feldman-story-remainder" id="' +
            storyControls + '"' + (recapExpanded ? '' : ' hidden') + '>' +
            (recapExpanded ? omittedStoryMarkup : '') + '</div>' : '') +
          storyToggle +
          '<footer><b>READ IT STRAIGHT THROUGH.</b><span>Every reel has a ' +
          'play door back to the exact show.</span></footer></section>';
      }
      var visibleBestMoments = recapExpanded ? replayMoments : replayMoments.slice(0, 6);
      var runwayEyebrow = topicMapOnly ?
        "WHERE THEY TALK ABOUT IT" :
        humanEditorial ? "PLAY THE GOOD SHIT" : "PLAYABLE CLIPS TO CHECK OUT";
      var runwayTitle = topicMapOnly ?
        "THE USEFUL SUBJECT JUMPS." :
        humanEditorial ? "THE MOMENTS WORTH YOUR TIME." :
          "THE CLEANEST DOORS INTO THE SHOW.";
      var runwayFooterTitle = topicMapOnly ?
        "A MAP, NOT A MIND READER." :
        humanEditorial ? "A LONG SHOW CAN HAVE A LONG HIGHLIGHT REEL." :
          "PLAYBACK MAKES THE FINAL CALL.";
      var runwayFooterBody = topicMapOnly ?
        "These jumps show where the subjects come up. Press play for the opinion, joke, and full context." :
        humanEditorial ?
          "Some nights earn six great clips. Some earn twenty-five. This shelf follows the show instead of forcing every episode into the same little box." :
          "These are useful source-linked candidates, not fake editorial awards. Play the moment, hear the delivery, and decide whether it belongs in the permanent best-of shelf.";
      var bestMomentMarkup = replayMoments.length ?
        '<section class="source-dossier-feldman-best" ' +
        'id="sourceDossierFeldmanBest" aria-labelledby="sourceDossierFeldmanBestTitle">' +
        '<header><div><span>' + esc(runwayEyebrow) + '</span><h5 ' +
        'id="sourceDossierFeldmanBestTitle">' + esc(runwayTitle) +
        '</h5></div><b>' + esc(replayMoments.length) +
        ' SOURCE-BOUND ' + (replayMoments.length === 1 ? 'STOP' : 'STOPS') +
        '</b></header><div>' +
        visibleBestMoments.map(function (moment, index) {
          var excerpt = cleanCaptionExcerpt(moment.excerpt);
          var category = clean(moment.category) ||
            (topicMapOnly ? "TOPIC DOOR" : "SOUNDBYTE / REPLAY");
          var ordinal = number(moment.ordinal) || index + 1;
          return '<article><header><span>#' +
            esc(String(ordinal).padStart(2, "0")) + '</span><time>' +
            esc(formatTime(moment.at)) + '</time></header><div><h6>' +
            '<small>' + esc(category) + '</small>' +
            esc(clean(moment.label) || "SAVED MOMENT") + '</h6>' +
            (excerpt ? '<blockquote>&ldquo;' + esc(excerpt) +
              '&rdquo;</blockquote>' :
              '<p>Playback carries the complete exchange and delivery.</p>') +
            '</div><footer>' + recapPlayButton(
              moment,
              (topicMapOnly ? "Play topic " : "Play highlight ") + ordinal +
                ": " + (clean(moment.label) || category)
            ) +
            '</footer></article>';
        }).join("") + '</div>' +
        (!recapExpanded && replayMoments.length > visibleBestMoments.length ?
          '<button type="button" class="source-dossier-feldman-recap-toggle" ' +
          'data-source-dossier-action="toggle-episode-recap" aria-expanded="false">' +
          'OPEN THE FULL ' + esc(replayMoments.length) +
          '-STOP RUNWAY &#8595;</button>' : '') +
        '<footer><b>' + esc(runwayFooterTitle) + '</b><span>' +
        esc(runwayFooterBody) + '</span></footer></section>' : '';

      var sectionMarkup = previewSections.map(function (section, index) {
        return recapSectionMarkup(section, index);
      }).join("");
      var omittedSectionMarkup = omittedSections.map(function (section, index) {
        return recapSectionMarkup(section, previewSections.length + index);
      }).join("");
      var openingSection = record(sections[0]);
      var openingAttributes = recapPlayAttributes(
        openingSection, "Play the first saved turn"
      );
      var openingJump = compact && clean(openingSection.id) && openingAttributes ?
        '<button type="button" class="source-dossier-feldman-start" ' +
        openingAttributes + '><span>START WITH THE TAPE</span><b>' +
        esc(openingSection.label) + '</b><time><i aria-hidden="true">&#9654;</i> PLAY ' +
        esc(formatTime(openingSection.at)) + '</time></button>' : '';
      var topicRailItems = episodeRecapTopicEntries(
        dossier,
        recapExpanded ? 8 : 5
      ).map(function (entry, index) {
        var topic = entry.topic;
        var receipt = entry.receipt;
        var attributes = recapPlayAttributes({
          receiptKey: receipt.key,
          at: receipt.at,
          end: receipt.end
        }, "Play " + topic + " from this show");
        if (!attributes) return "";
        return '<button type="button" ' + attributes + '><span>TOPIC ' +
          esc(String(index + 1).padStart(2, "0")) +
          '</span><b>' + esc(topic) + '</b><time><i aria-hidden="true">&#9654;</i> ' +
          esc(formatTime(receipt.at)) + '</time></button>';
      }).filter(Boolean);
      var topicRailMarkup = topicRailItems.length ?
        '<nav class="source-dossier-feldman-topic-rail" id="sourceDossierFeldmanTopics" ' +
        'aria-label="Jump to an episode topic">' +
        '<header><span>JUMP THE TOPIC BOARD</span><b>' +
        esc(topicRailItems.length) + ' EXACT ' +
        (topicRailItems.length === 1 ? 'DOOR' : 'DOORS') +
        '</b></header><div>' + topicRailItems.join("") + '</div></nav>' : '';
      var topicOrbitMarkup = "";
      var showThreadOrbit = clean(recap.tier) === "full-chronicle" &&
        topicMap.length >= 4;
      if ((topicMapOnly || showThreadOrbit) && topicMap.length) {
        var rankedTopics = topicMap.slice().sort(function (left, right) {
          return number(left.rank) - number(right.rank) ||
            number(right.mentions) - number(left.mentions) ||
            number(left.firstAt) - number(right.firstAt);
        });
        var chronologicalTopics = topicMap.slice().sort(function (left, right) {
          return number(left.firstAt) - number(right.firstAt) ||
            number(left.rank) - number(right.rank);
        });
        var shownTopics = (recapExpanded ? rankedTopics : rankedTopics.slice(0, 5));
        var leadTopic = record(rankedTopics[0]);
        var firstTopic = record(chronologicalTopics[0]);
        var lateTopic = record(chronologicalTopics[chronologicalTopics.length - 1]);
        var mentionTotal = rankedTopics.reduce(function (total, topic) {
          return total + number(topic.mentions);
        }, 0);
        var mapStart = chronologicalTopics.reduce(function (earliest, topic) {
          return Math.min(earliest, number(topic.firstAt));
        }, Number.POSITIVE_INFINITY);
        var mapEnd = rankedTopics.reduce(function (latest, topic) {
          return Math.max(latest, number(topic.peakAt));
        }, 0);
        var mapReach = number(source.duration) && Number.isFinite(mapStart) ?
          Math.max(1, Math.min(100, Math.round(
            Math.max(0, mapEnd - mapStart) / number(source.duration) * 100
          ))) : 0;
        var orbitRows = shownTopics.map(function (topic, index) {
          var attributes = recapPlayAttributes({
            receiptKey: topic.receiptKey,
            guideCutId: topic.guideCutId,
            at: topic.peakAt,
            end: topic.end
          }, "Play the " + topic.label + " peak");
          if (!attributes) return "";
          var intensity = Math.max(4, Math.min(100, number(topic.intensity)));
          return '<button type="button" class="source-dossier-feldman-orbit-row" ' +
            attributes + ' style="--topic-intensity:' + esc(intensity) +
            '%"><span class="source-dossier-feldman-orbit-rank">#' +
            esc(String(number(topic.rank) || index + 1).padStart(2, "0")) +
            '</span><span class="source-dossier-feldman-orbit-copy"><b>' +
            esc(topic.label) + '</b><small>FIRST ' +
            esc(formatTime(topic.firstAt)) + ' // PEAK ' +
            esc(formatTime(topic.peakAt)) +
            '</small><i aria-hidden="true"><em></em></i></span><strong>' +
            esc(formatNumber(number(topic.mentions))) +
            '<small>MENTIONS</small></strong><time><i aria-hidden="true">&#9654;</i> ' +
            'PLAY PEAK</time></button>';
        }).filter(Boolean).join("");
        topicOrbitMarkup =
          '<section class="source-dossier-feldman-orbit" ' +
          'id="sourceDossierFeldmanTopics" aria-labelledby="' +
          'sourceDossierFeldmanOrbitTitle"><header><div><span>' +
          'THE TAPE TOPOGRAPHY // ' +
          (showThreadOrbit ? 'REVIEWED THREAD MAP' : 'CAPTION MAP') +
          '</span><h5 ' +
          'id="sourceDossierFeldmanOrbitTitle">WHAT THE NIGHT KEPT CIRCLING.' +
          '</h5></div><b>' + esc(formatNumber(mentionTotal)) +
          ' MENTIONS ON THIS TAPE // ' + esc(rankedTopics.length) +
          ' SUBJECTS</b></header><div class="source-dossier-feldman-orbit-stats">' +
          '<article><span>MOST REVISITED</span><b>' + esc(leadTopic.label) +
          '</b><small>' + esc(formatNumber(number(leadTopic.mentions))) +
          ' MENTIONS // PEAK ' + esc(formatTime(leadTopic.peakAt)) +
          '</small></article><article><span>FIRST DOOR</span><b>' +
          esc(firstTopic.label) + '</b><small>FIRST SURFACES ' +
          esc(formatTime(firstTopic.firstAt)) +
          '</small></article><article><span>LATE ARRIVAL</span><b>' +
          esc(lateTopic.label) + '</b><small>FIRST SURFACES ' +
          esc(formatTime(lateTopic.firstAt)) +
          '</small></article><article><span>MAP REACH</span><b>' +
          esc(mapReach) + '%</b><small>FIRST ARRIVAL TO LATEST PEAK</small>' +
          '</article></div><div class="source-dossier-feldman-orbit-rows">' +
          orbitRows + '</div>' +
          (compact && rankedTopics.length > shownTopics.length ?
            '<button type="button" class="source-dossier-feldman-recap-toggle" ' +
            'data-source-dossier-action="toggle-episode-recap" ' +
            'aria-expanded="false">OPEN ALL ' + esc(rankedTopics.length) +
            ' TOPIC READINGS &#8595;</button>' : '') +
          '<footer><b>RECURRENCE, NOT A VERDICT.</b><span>Counts, first arrivals, ' +
          'and peaks come from this upload&#39;s ' +
          (showThreadOrbit ? 'reviewed episode-thread map. ' :
            'automatic-caption topic map. ') +
          'They do not identify the speaker, tone, opinion, or reaction.</span>' +
          '</footer></section>';
      }

      var damageSpecs = [
        ["loved", "WHAT THE TAPE DEFENDED"],
        ["hated", "STRAIGHT TO STEVE'S ASSHOLE"],
        ["wildestDetour", "WWAM UP IN YA"],
        ["lastWord", "THE LAST WORD"],
      ];
      var damageMarkup = damageSpecs.map(function (spec) {
        var item = record(fanRead[spec[0]]);
        if (!clean(item.body)) return "";
        var excerpt = cleanCaptionExcerpt(item.excerpt);
        return '<article id="' + esc(feldmanDamageCardId(spec[0])) +
          '" data-feldman-damage="' + esc(spec[0]) + '"><span>' +
          esc(clean(item.label) || spec[1]) + '</span><h5>' +
          esc(clean(item.topic) || spec[1]) + '</h5><p>' + esc(item.body) +
          '</p>' + (excerpt ? '<blockquote>&ldquo;' + esc(excerpt) +
            '&rdquo;</blockquote>' : '') + recapPlayButton(item, "Play " + spec[1]) +
          '</article>';
      }).filter(Boolean).join("");
      var caseFileMarkup = recapCaseFileMarkup();
      var recapControls = "sourceDossierFeldmanOmittedActs";
      var recapToggle = compact && omittedSections.length ?
        '<button type="button" class="source-dossier-feldman-recap-toggle" ' +
        'data-source-dossier-action="toggle-episode-recap" aria-controls="' +
        esc(recapControls) + '" ' +
        'aria-expanded="' + (recapExpanded ? 'true' : 'false') + '">' +
        (recapExpanded ? 'SHOW FEWER ACTS &#8593;' :
          'SHOW ALL ' + esc(sections.length) + ' ACTS &#8595;') +
        '</button>' : '';
      var lastPlayablePercent = number(recapCase.lastPlayableAnchorPercent);
      var lastPlayableAt = number(recapCase.lastPlayableAnchorAt);
      var partialTopicMap = topicMapOnly && lastPlayablePercent > 0 &&
        lastPlayablePercent < 85;
      var chronologyLabel = topicMapOnly ?
        (partialTopicMap ? "PARTIAL SUBJECT MAP" : "SOURCE SUBJECT MAP") :
        "PLAYABLE EPISODE INDEX";
      var chronologyNote = topicMapOnly ?
        "TOPIC NAVIGATION ONLY // NO OPINIONS, REACTIONS, OR VERDICTS INVENTED" :
        "EVERY ACT OPENS THIS EXACT SHOW";
      var trustMarkup =
        '<details class="source-dossier-feldman-receipts"><summary>' +
        'DEEP DIVE + SOURCE TRUST</summary><div class="source-dossier-feldman-trust-copy"><p>' +
        esc(clean(record(recap.approval).disclosure)) +
        ' Every paragraph above resolves to a timestamp from this exact upload. ' +
        'Automatic captions do not establish the speaker, delivery, or audio origin.</p><small>' +
        esc(clean(recap.semanticFingerprint).toUpperCase()) +
        (story.length ? ' // ' + esc(story.length) + ' WRITTEN ' +
          (story.length === 1 ? 'REEL' : 'REELS') : '') +
        ' // ' + esc(array(recap.sections).length) +
        ' PLAYABLE ACTS</small></div>' + caseFileMarkup + '</details>';
      var indexBoundaryMarkup = lastPlayablePercent > 0 && lastPlayablePercent < 85 ?
        '<aside class="source-dossier-feldman-index-boundary" role="note" ' +
        'data-feldman-index-boundary="partial"><span>SAVED INDEX BOUNDARY</span>' +
        '<div><b>THE MAP ENDS AT ' + esc(lastPlayablePercent) +
        '%. THE SHOW DOESN&#39;T.</b><p>The last playable recap anchor lands at ' +
        esc(formatTime(lastPlayableAt)) + '. The full upload remains above; this page ' +
        'does not invent an ending for the unindexed tail.</p></div></aside>' : '';
      var editorialPanelsMarkup = array(recap.editorialPanels).map(function (
        panel,
        panelIndex
      ) {
        panel = record(panel);
        var panelType = clean(panel.type);
        if (!/^(?:ranking|verdict|character)-ledger$/.test(panelType)) return "";
        var panelKey = clean(panel.id) || panelType;
        var panelDomId = "sourceDossierEditorialPanel-" +
          token(panelKey) + "-" + panelIndex;
        var groups = array(panel.groups).map(record).filter(function (group) {
          return clean(group.label) && array(group.items).length;
        });
        var groupsMarkup = groups.map(function (group) {
          return '<article><h6>' + esc(group.label) + '</h6><ul>' +
            array(group.items).map(function (item) {
              return '<li>' + esc(item) + '</li>';
            }).join("") + '</ul></article>';
        }).join("");
        var items = array(panel.items).map(record);
        var itemsMarkup = "";

        if (panelType === "verdict-ledger") {
          itemsMarkup = items.filter(function (item) {
            return clean(item.subject) && clean(item.verdict);
          }).map(function (item) {
            return '<article class="source-dossier-editorial-ledger-card ' +
              'is-verdict" data-editorial-subject="' + esc(item.subject) +
              '"><h6>' + esc(item.subject) + '</h6><p>' +
              esc(item.verdict) + '</p></article>';
          }).join("");
        } else if (panelType === "character-ledger") {
          itemsMarkup = items.filter(function (item) {
            return clean(item.character) && clean(item.label);
          }).map(function (item) {
            var atPresent = item.at != null && clean(item.at) !== "";
            var endPresent = item.end != null && clean(item.end) !== "";
            var at = Number(item.at);
            var end = Number(item.end);
            var playable = atPresent && endPresent &&
              Number.isFinite(at) && Number.isFinite(end) &&
              at >= 0 && at < number(source.duration) &&
              end > at && end <= number(source.duration);
            var playMarkup = playable ?
              '<footer><time>' + esc(formatTime(at)) + '&mdash;' +
                esc(formatTime(end)) + '</time><button type="button" ' +
                'data-source-dossier-action="play-guide-cut" data-guide-at="' +
                esc(at) + '" data-guide-end="' + esc(end) +
                '" data-guide-label="' + esc(
                  clean(item.character) + " // " + clean(item.label)
                ) + '" data-guide-return="' + esc(panelDomId) +
                '" data-guide-return-label="' +
                esc(clean(panel.title) || "CHARACTER LEDGER") +
                '" aria-label="' + esc(
                  "Play " + clean(item.character) + ": " + clean(item.label) +
                  " at " + formatTime(at)
                ) + '"><span aria-hidden="true">&#9654;</span> PLAY ' +
                esc(formatTime(at)) + '</button></footer>' : "";
            return '<article class="source-dossier-editorial-ledger-card ' +
              'is-character" data-editorial-character="' +
              esc(item.character) + '"><h6>' + esc(item.character) +
              '</h6><p>' + esc(item.label) + '</p>' + playMarkup +
              '</article>';
          }).join("");
        }

        if (!groupsMarkup && !itemsMarkup) return "";
        var defaultEyebrow = panelType === "character-ledger" ?
          "THE CHARACTER ROLL CALL" : panelType === "verdict-ledger" ?
            "THE VERDICTS" : "THE RANKING";
        var defaultTitle = panelType === "character-ledger" ?
          "WHO SHOWED UP" : panelType === "verdict-ledger" ?
            "WHAT THE TAPE SAID" : "THE BOARD";
        return '<section class="source-dossier-editorial-ledger is-' +
          esc(panelType) + '" id="' + esc(panelDomId) +
          '" data-editorial-panel="' + esc(panelKey) +
          '" data-editorial-panel-type="' + esc(panelType) +
          '"><header><span>' + esc(clean(panel.eyebrow) || defaultEyebrow) +
          '</span><h5>' + esc(clean(panel.title) || defaultTitle) +
          '</h5><p>' + esc(panel.intro) + '</p></header><div>' +
          groupsMarkup + itemsMarkup + '</div>' +
          (clean(panel.note) ? '<footer><b>WHAT WE DID NOT GUESS</b><p>' +
            esc(panel.note) + '</p></footer>' : '') + '</section>';
      }).filter(Boolean).join("");
      var legacyChronicleMarkup = legacyAssembly ?
        '<section class="source-dossier-feldman-chronicle" ' +
          'id="sourceDossierFeldmanActs"><header><span>' +
          esc(chronologyLabel) + '</span><b>' + esc(sections.length) + ' ' +
          (sections.length === 1 ? 'ACT' : 'ACTS') + ' // ' +
          esc(chronologyNote) + '</b></header><div class="source-dossier-feldman-acts" ' +
          'id="sourceDossierFeldmanActList">' +
          sectionMarkup + '</div>' +
          (compact && omittedSections.length ?
            '<div class="source-dossier-feldman-omitted-acts" ' +
            'id="sourceDossierFeldmanOmittedActs"' +
            (recapExpanded ? '' : ' hidden') + '>' +
            (recapExpanded ? omittedSectionMarkup : '') + '</div>' : '') +
          recapToggle + '</section>' : "";

      return '<section class="source-dossier-feldman-recap is-ready" ' +
        'id="sourceDossierShowWikiSummary" data-feldman-recap="ready" ' +
        'data-feldman-tier="' + esc(recap.tier) + '" data-feldman-view="' +
        (compact ? (recapExpanded ? 'recap' : 'highlights') : 'full') +
        '" data-feldman-recap-expanded="' + (recapExpanded ? 'true' : 'false') +
        '"><header><div class="source-dossier-feldman-heading"><span>' +
        esc(recap.label) + '</span><h4>' + esc(recap.headline) +
        '</h4></div><b>' + esc(recap.badge) + '</b></header>' +
        (clean(recap.deck) ? '<p class="source-dossier-feldman-deck">' +
          esc(recap.deck) + '</p>' : '') +
        '<section class="source-dossier-feldman-quick-take" ' +
         'id="sourceDossierFeldmanOverview"><span>THE 30-SECOND VERSION</span><p>' +
        esc(recap.overview) + '</p></section>' + indexBoundaryMarkup +
        (legacyAssembly ?
          formatExperienceMarkup + topicRebuildExperienceMarkup + openingJump :
          '') +
        storyMarkup + bestMomentMarkup +
        (legacyAssembly ? '' : editorialPanelsMarkup) +
        (topicOrbitMarkup || topicRailMarkup) +
        (damageMarkup ? '<section class="source-dossier-feldman-damage" ' +
          'id="sourceDossierFeldmanDamage"><header><span>' +
          'FEATURED SIGNATURE MOMENTS // DAMAGE REPORT</span><b>' +
          'PLAY THE NIGHT&#39;S BIGGEST TURNS</b></header><div>' +
          damageMarkup + '</div></section>' : '') +
        legacyChronicleMarkup +
        trustMarkup +
         '</section>';
    }

    function showWikiRecapMarkup(dossier, compact) {
      var source = dossier.source;
      var recap = record(record(source.showWiki).recap);
      var blocks = array(recap.blocks).map(record);
      if (!clean(recap.overview)) {
        return '<article class="source-dossier-wiki-summary" id="sourceDossierShowWikiSummary">' +
          '<span>THE SHOW IN PLAIN ENGLISH</span>' + (source.summary
            ? '<p>' + esc(source.summary.text) + '</p><small>BUILT FROM // ' +
              esc(clean(source.summary.basis).toUpperCase()) + '</small>'
            : '<b>No caption-backed summary is ready yet.</b>') + '</article>';
      }
      return '<section class="source-dossier-wiki-recap" id="sourceDossierShowWikiSummary" ' +
        'data-show-wiki-format="' + esc(token(recap.format)) + '"><header><div><span>THE SHOW IN PLAIN ENGLISH</span>' +
        '<h4>' + esc(recap.format) + '</h4></div><small>FROM THE OFFICIAL WWAM UPLOAD</small>' +
        (compact ? '' : '<details class="source-dossier-wiki-method"><summary>HOW THIS FORMAT WAS IDENTIFIED</summary><small>' +
          'Based on the show type and timestamped material from this upload.</small></details>') +
        '</header>' +
        '<p class="source-dossier-wiki-overview">' +
        esc(recap.overview) + '</p><div class="source-dossier-wiki-recap-blocks">' +
        (compact ? blocks.slice(0, 3) : blocks).map(function (block, index) {
          var receipts = showWikiExperienceReceipts(dossier, block.receiptKeys);
          return '<article><span>CHAPTER ' + esc(String(index + 1).padStart(2, "0")) +
            '</span><h5>' + esc(block.label) + '</h5><p>' + esc(block.body) +
            '</p><div>' + receipts.map(function (receipt) {
              var time = formatTime(receipt.at);
              return '<button type="button" data-source-dossier-action="play-receipt" ' +
                'data-receipt-key="' + esc(receipt.key) + '" aria-label="Play recap evidence at ' +
                esc(time) + '">&#9654; ' + esc(time) + '</button>';
            }).join("") + '</div><details class="source-dossier-wiki-method">' +
            '<summary>WHY THESE MOMENTS?</summary><small>' +
            'Linked to the saved timestamps shown in this chapter.</small></details></article>';
        }).join("") + '</div></section>';
    }

    function showWikiFanReadMarkup(dossier, compact) {
      if (compact || !showWikiHasFanRead(dossier)) return "";
      var guide = record(record(dossier.source.showWiki).episodeGuide);
      var fanRead = record(guide.fanRead);
      var why = record(fanRead.whyThisNightMatters);

      function fanCut(item) {
        return sourceGuideCutById(dossier, clean(record(item).cutId));
      }

      function fanPlayButton(cut, label) {
        if (!cut) return "";
        return '<button type="button" data-source-dossier-action="play-guide-cut" ' +
          'data-guide-at="' + esc(number(cut.at)) + '" data-guide-end="' +
          esc(number(cut.end)) + '" data-guide-label="' +
          esc(clean(cut.topic) || label) +
          '" data-guide-return="sourceDossierFanRead" ' +
          'data-guide-return-label="FAN READ" aria-label="' +
          esc(label + " at " + formatTime(cut.at)) +
          '">&#9654; ' + esc(label) + ' // ' + esc(formatTime(cut.at)) + '</button>';
      }

      var specs = [
        { key: "loved", fallback: "WHAT THE TAPE DEFENDED" },
        { key: "hated", fallback: "STRAIGHT TO STEVE'S ASSHOLE" },
        { key: "wildestDetour", fallback: "THE WILDEST DETOUR" },
        { key: "lastWord", fallback: "THE LAST WORD" }
      ];
      var cards = specs.map(function (spec) {
        var item = record(fanRead[spec.key]);
        var cut = fanCut(item);
        if (!cut || !clean(item.body)) return "";
        var label = spec.key === "hated" ? spec.fallback : (clean(item.label) || spec.fallback);
        return '<article data-fan-read-key="' + esc(spec.key) + '"><span>' +
          esc(label) + '</span><h5>' + esc(clean(item.topic) || clean(cut.topic)) +
          '</h5><p>' + esc(item.body) + '</p><blockquote>&ldquo;' +
          esc(cleanCaptionExcerpt(clean(item.excerpt) || clean(cut.excerpt))) +
          '&rdquo;</blockquote><footer>' + fanPlayButton(cut, "PLAY THIS CUT") +
          '<small>' + esc(clean(item.category) || clean(cut.category)) +
          ' // BOUNDED SOURCE WINDOW</small></footer></article>';
      }).filter(Boolean).join("");
      var strongest = sourceGuideCutById(dossier, clean(why.strongestCutId));
      var threadMarkup = [clean(why.primaryThread), clean(why.secondaryThread)]
        .filter(Boolean).filter(function (thread, index, threads) {
          return threads.indexOf(thread) === index;
        }).map(function (thread) {
          return '<span>' + esc(thread) + '</span>';
        }).join("");

      return '<section class="source-dossier-fan-read" id="sourceDossierFanRead" ' +
        'data-fan-read="episode-guide-v2"><header><div><span>THE FAN READ // QUICK ENTRY</span>' +
        '<h4>' + esc(clean(why.label) || "WHY THIS NIGHT MATTERS") +
        '.</h4></div><p>Start with the story of the night, then use the tape to go deeper.</p></header>' +
        '<div class="source-dossier-fan-read-lead"><div><span>WHY THIS NIGHT MATTERS</span><p>' +
        esc(why.body) + '</p>' + (threadMarkup ? '<div>' + threadMarkup + '</div>' : '') +
        '</div>' + fanPlayButton(strongest, "PLAY THE MUST-HEAR CUT") + '</div>' +
        (cards ? '<div class="source-dossier-fan-read-grid">' + cards + '</div>' : '') +
        '<footer><b>READ IT. HEAR IT. KEEP THE SOURCE ATTACHED.</b><span>Every timestamp returns to this exact upload. ' +
        'Captions can miss a name or mangle a word, so the playable clip always gets the last word.</span></footer></section>';
    }

    function showWikiEpisodeGuideMarkup(dossier, compact) {
      var source = dossier.source;
      var guide = record(record(source.showWiki).episodeGuide);
      if (clean(guide.schema) !== "wwam-episode-guide/v2") return "";
      var chapters = array(guide.chapters).map(record);
      var takeArc = array(guide.takeArc).map(record);
      var threads = array(guide.threads).map(record);
      var cuts = array(guide.cuts).map(record).slice().sort(function (left, right) {
        return number(right.score) - number(left.score) || number(left.at) - number(right.at);
      });
      var visibleCuts = cuts.slice(0, compact ? 6 : cuts.length);
      var metrics = record(guide.metrics);

      function playButton(item, label) {
        var at = number(item.at != null ? item.at : item.peak);
        var end = number(item.end) > at ? number(item.end) : Math.min(number(source.duration), at + 30);
        return '<button type="button" data-source-dossier-action="play-guide-cut" ' +
          'data-guide-at="' + esc(at) + '" data-guide-end="' + esc(end) + '" ' +
          'data-guide-label="' + esc(clean(item.topic) || clean(item.label) || label) +
          '" data-guide-return="sourceDossierEpisodeGuide" ' +
          'data-guide-return-label="EPISODE DEEP DIVE" aria-label="' +
          esc(label + " at " + formatTime(at)) + '">&#9654; ' +
          esc(formatTime(at)) + '</button>';
      }

      if (compact) {
        var chronologicalCuts = cuts.slice().sort(function (left, right) {
          return number(left.at) - number(right.at);
        });
        var startHereCuts = [];
        [0, 0.25, 0.5, 0.75].forEach(function (startRatio, bandIndex) {
          var bandStart = number(source.duration) * startRatio;
          var bandEnd = bandIndex === 3 ? Number.POSITIVE_INFINITY :
            number(source.duration) * (startRatio + 0.25);
          var candidate = chronologicalCuts.filter(function (cut) {
            return number(cut.at) >= bandStart && number(cut.at) < bandEnd;
          }).sort(function (left, right) {
            return number(right.score) - number(left.score) || number(left.at) - number(right.at);
          })[0];
          if (candidate && startHereCuts.indexOf(candidate) < 0) startHereCuts.push(candidate);
        });
        cuts.forEach(function (cut) {
          if (startHereCuts.length < 4 && startHereCuts.indexOf(cut) < 0) startHereCuts.push(cut);
        });
        startHereCuts = startHereCuts.slice(0, 4).sort(function (left, right) {
          return number(left.at) - number(right.at);
        });
        var startHereMarkup = startHereCuts.map(function (cut, index) {
          return '<article><header><span>MOVE ' + esc(String(index + 1).padStart(2, "0")) +
            ' // ' + esc(cut.category) + '</span><time>' + esc(formatTime(cut.at)) +
            '</time></header><h5>' + esc(cut.topic) + '</h5><p>&ldquo;' +
            esc(cleanCaptionExcerpt(cut.excerpt)) + '&rdquo;</p>' +
            playButton(cut, "Play " + cut.topic) + '</article>';
        }).join("");
        return '<section class="source-dossier-episode-guide is-compact" id="sourceDossierEpisodeGuide" ' +
          'data-episode-guide="v2" data-episode-guide-view="start-here"><header><div><span>' +
          'START HERE // FOUR MOVES</span><h4>THE FASTEST WAY INTO THIS EPISODE.</h4></div>' +
          '<p>Four playable stops, spread across the full runtime. Start anywhere; every button returns to this exact upload.</p>' +
          '</header><div class="source-dossier-episode-start-here">' + startHereMarkup +
          '</div><footer class="source-dossier-episode-start-actions"><span><b>' +
          esc(number(metrics.chapters)) + '</b> ACTS MAPPED &nbsp; // &nbsp; <b>' +
          esc(number(metrics.cuts)) + '</b> CUTS IN THE FULL GUIDE</span><button type="button" ' +
          'data-source-dossier-action="open-full-file">OPEN THE FULL DEEP DIVE &#8594;</button></footer></section>';
      }

      var threadMarkup = threads.map(function (thread) {
        return '<article><div><span>' + esc(titleCase(thread.kind).toUpperCase()) +
          '</span><b>' + esc(thread.name) + '</b></div><small>' +
          esc(number(thread.mentions)) + ' MENTIONS // PEAK ' + esc(formatTime(thread.peak)) +
          '</small>' + playButton(thread, "Play " + thread.name) + '</article>';
      }).join("");

      var chapterMarkup = chapters.map(function (chapter, index) {
        return '<article class="source-dossier-episode-chapter"><header><span>ACT ' +
          esc(String(index + 1).padStart(2, "0")) + '</span><time>' +
          esc(formatTime(chapter.at)) + '</time></header><h5>' + esc(chapter.label) +
          '</h5><p>' + esc(chapter.body) + '</p><blockquote>&ldquo;' +
          esc(cleanCaptionExcerpt(chapter.excerpt)) + '&rdquo;</blockquote>' +
          playButton(chapter, "Play act " + (index + 1)) + '</article>';
      }).join("");

      var arcMarkup = takeArc.map(function (take) {
        return '<article><span>' + esc(take.phase) + '</span><h5>' + esc(take.label) +
          '</h5><p>' + esc(take.body) + '</p><blockquote>&ldquo;' +
          esc(cleanCaptionExcerpt(take.excerpt)) + '&rdquo;</blockquote>' +
          playButton(take, "Play " + take.phase) + '</article>';
      }).join("");

      var cutMarkup = visibleCuts.map(function (cut, index) {
        return '<article><header><span>#' + esc(String(index + 1).padStart(2, "0")) +
          ' // ' + esc(cut.category) + '</span><time>' + esc(formatTime(cut.at)) +
          '</time></header><div><b>' + esc(cut.topic) + '</b><p>&ldquo;' +
          esc(cleanCaptionExcerpt(cut.excerpt)) + '&rdquo;</p></div>' +
          playButton(cut, "Play " + cut.topic) + '</article>';
      }).join("");

      return '<section class="source-dossier-episode-guide" id="sourceDossierEpisodeGuide" ' +
        'data-episode-guide="v2"><header><div><span>DEEP DIVE // EPISODE GUIDE V2</span>' +
        '<h4>THE EPISODE ACTUALLY HAS A SHAPE.</h4></div><p>Not eight random loud lines. ' +
        'This map follows recurring subjects, how the commentary changes across the runtime, ' +
        'and the cuts most worth revisiting.</p></header><div class="source-dossier-episode-guide-metrics">' +
        '<span><b>' + esc(number(metrics.chapters)) + '</b> ACTS</span><span><b>' +
        esc(number(metrics.threads)) + '</b> RECURRING THREADS</span><span><b>' +
        esc(number(metrics.cuts)) + '</b> PLAYABLE CUTS</span><span><b>' +
        esc(number(metrics.substantive != null ? metrics.substantive : metrics.comedy)) + '</b> EXPLICIT TAKES / READS</span></div>' +
        '<section class="source-dossier-episode-threads"><header><span>WHAT KEEPS COMING BACK</span>' +
        '<b>RANKED BY CAPTION CONCENTRATION</b></header><div>' + threadMarkup + '</div></section>' +
        '<section class="source-dossier-episode-chapters"><header><span>THE NIGHT, ACT BY ACT</span>' +
        '<b>' + esc(chapters.length) + ' STOPS ACROSS THE FULL RUNTIME</b></header><div>' +
        chapterMarkup + '</div></section>' +
        '<section class="source-dossier-episode-arc"><header><span>THE TAKE ARC</span>' +
        '<b>OPENING READ &#8594; MIDPOINT TURN &#8594; LATE VERDICT</b></header><div>' +
        arcMarkup + '</div></section><section class="source-dossier-episode-cuts"><header><span>' +
        'CUTS WORTH YOUR TIME</span><b>' + esc(visibleCuts.length) + ' OF ' + esc(cuts.length) +
        ' SHOWN</b></header><div>' + cutMarkup + '</div>' +
        (compact && cuts.length > visibleCuts.length ? '<button type="button" ' +
          'data-source-dossier-action="open-full-file">SHOW ALL ' + esc(cuts.length) +
          ' PLAYABLE CUTS &#8594;</button>' : '') + '</section><details class="source-dossier-episode-method">' +
        '<summary>WHAT THIS DEEP DIVE CAN AND CANNOT CLAIM</summary><p>' +
        esc(guide.basis) + '. Every jump stays bound to this upload. Automatic captions do not ' +
        'establish which host spoke or whether a line came from the movie audio.</p></details></section>';
    }

    function showWikiAudioListeningMarkup(dossier, compact) {
      var source = dossier.source;
      var receipts = array(source.receipts).filter(function (receipt) {
        return clean(receipt && receipt.evidenceType).toLowerCase() ===
          "audio-feature-candidate";
      }).slice().sort(function (left, right) {
        return number(right.signalScore) - number(left.signalScore) ||
          number(left.at) - number(right.at);
      });
      if (!receipts.length) return "";

      var categoryCounts = {};
      var asrReceiptCount = receipts.filter(function (receipt) {
        return /faster-whisper transcript excerpt/i.test(clean(receipt.evidenceBasis));
      }).length;
      var boundedWhisperPass = receipts.some(function (receipt) {
        return /bounded local faster-whisper transcript window/i.test(clean(receipt.evidenceBasis));
      });
      var whisperBackedSource = clean(source.captionSourceKind).toLowerCase() ===
        "local-whisper-transcript";
      var whisperPassVisible = asrReceiptCount > 0 || whisperBackedSource;
      receipts.forEach(function (receipt) {
        var category = clean(receipt.label) || "LISTENING SPIKE";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      var categoryMarkup = Object.keys(categoryCounts).sort(function (left, right) {
        return categoryCounts[right] - categoryCounts[left] || left.localeCompare(right);
      }).map(function (category) {
        return '<span><b>' + esc(categoryCounts[category]) + '</b>' +
          esc(category) + '</span>';
      }).join("");
      var visible = compact ? receipts.slice(0, 6) : receipts;
      var cardMarkup = visible.map(function (receipt, index) {
        var time = formatTime(receipt.at);
        var score = number(receipt.signalScore);
        var heat = Number.isFinite(score) ?
          Math.max(12, Math.min(100, Math.round(score))) : 12;
        var heatBand = heat >= 90 ? "RED BAND" :
          heat >= 80 ? "HOT" : heat >= 70 ? "WARM" : "LISTENING LEAD";
        var excerpt = listeningCaptionExcerpt(receipt.excerpt);
        var transcriptCue = token(clean(receipt.reviewState) + " " + clean(receipt.evidenceBasis)).indexOf("transcript-cue") >= 0;
        var scoreLabel = Number.isFinite(score) && score > 0 ?
          ' // AUDIO RANK ' + esc(Math.round(score)) : '';
        return '<article><header><span>#' + esc(String(index + 1).padStart(2, "0")) +
          ' // ' + esc(clean(receipt.label) || "LISTENING SPIKE") +
          '</span><time>' + esc(time) + '</time></header><p class="' +
          (excerpt ? 'source-dossier-listening-excerpt' : 'source-dossier-listening-excerpt is-audio-only') +
          '">' + (excerpt ? '&ldquo;' + esc(excerpt) + '&rdquo;' :
            'AUTO-RANKED AUDIO WINDOW. PRESS PLAY AND DECIDE FOR YOURSELF.') +
          '</p><div class="source-dossier-listening-meter" aria-label="Listening heat ' +
          esc(heat) + ' out of 100; ranking aid only"><span>LISTENING HEAT // RANKING AID</span><meter min="0" max="100" value="' +
          esc(heat) + '">' + esc(heat) + '</meter><b>' + esc(heatBand) +
          '</b></div><button type="button" data-source-dossier-action="play-receipt" ' +
          'data-receipt-key="' + esc(receipt.key) + '" aria-label="Play audio listening window at ' +
          esc(time) + '">&#9654; PLAY THIS WINDOW</button><small>' +
          (transcriptCue ? 'SOURCE-LOCAL WHISPER TEXT CUE' : 'SOURCE-LOCAL AUDIO PASS') + scoreLabel +
          '</small></article>';
      }).join("");
      var omitted = receipts.length - visible.length;
      return '<section class="source-dossier-listening-pass" id="sourceDossierListeningPass" ' +
        'data-source-listening-count="' + esc(receipts.length) + '" data-source-listening-asr-count="' +
        esc(asrReceiptCount) + '"><header><div><span>' +
         (whisperPassVisible ? 'THE TAPE // WHISPER-ALIGNED LISTENING PASS' :
           'THE TAPE // LISTENING PASS') + '</span><h4>' +
         (whisperPassVisible ? 'HEAR THE WINDOWS, THEN FOLLOW THE CLEANER TRANSCRIPT.' :
           'HEAR THE WINDOWS THE AUDIO PASS FOUND.') + '</h4></div>' +
        '<b>' + esc(receipts.length) + ' RANKED WINDOWS</b></header><p class="source-dossier-listening-intro">' +
         (whisperPassVisible ?
           (boundedWhisperPass ?
             'This source has a local Whisper transcript sampled around ranked audio windows. ' :
             'This source has a bounded local Whisper transcript aligned to its audio-ranked windows. ') :
          'This is the source-local audio re-rank: loudness, caption alignment, and recurring WWAM signals decide where to start. ') +
        'It does not pretend to know who spoke, what was on camera, or whether a line is objectively funny. Press play and let the tape decide.</p>' +
        '<div class="source-dossier-listening-counts">' + categoryMarkup + '</div><div class="source-dossier-listening-grid">' +
        cardMarkup + '</div>' + (omitted > 0 ? '<footer><b>' + esc(omitted) +
          ' MORE WINDOWS IN THE FULL FILE.</b> ' + (compact ?
          'Open the full deep dive to hear every ranked stop.' :
          'Every ranked window remains attached to this exact upload.') +
          '</footer>' : '') + '</section>';
    }
    function showWikiLaneMarkup(dossier, lane, index, seenReceipts, compact) {
      var receipts = showWikiLaneReceipts(dossier, lane);
      var displayedReceipts = compact ?
        receipts.slice(0, COMPACT_SHOW_WIKI_RECEIPTS) : receipts;
      var primary = [];
      var crossLinks = [];
      displayedReceipts.forEach(function (receipt) {
        if (seenReceipts[receipt.key]) crossLinks.push(receipt);
        else {
          seenReceipts[receipt.key] = true;
          primary.push(receipt);
        }
      });
      var label = clean(lane.label);
      var description = showWikiLaneDescription(lane);
      var emptyState = clean(lane.emptyState);
      var laneId = showWikiLaneId(lane, index);
      return '<article class="source-dossier-wiki-lane has-receipts' +
        (isShowWikiHighlightLane(lane) ? ' is-show-wiki-highlight' : ' is-show-wiki-research') +
        '" id="' +
        esc(laneId) + '" data-show-wiki-lane="' +
        esc(clean(lane.id) || token(label)) + '" data-show-wiki-receipt-count="' +
        esc(receipts.length) + '"><header><div><span>PART ' +
        esc(index + 1) + '</span><h4>' + esc(label) + '</h4></div><b>' +
        esc(receipts.length) + ' MOMENT' + (receipts.length === 1 ? '' : 'S') +
        '</b></header>' + (description ? '<p class="source-dossier-wiki-lane-description">' +
          esc(description) + '</p>' : '') +
        (primary.length ? '<div class="source-dossier-wiki-receipts">' +
          primary.map(function (receipt) {
            return receiptMarkup(receipt, "source-dossier-wiki-receipt");
          }).join("") + '</div>' : '') +
        (crossLinks.length ? '<div class="source-dossier-wiki-crosslinks"><span>ALSO FEATURED ABOVE</span>' +
          crossLinks.map(function (receipt) {
            var time = formatTime(receipt.at);
            return '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
              esc(receipt.key) + '"><b>' + esc(receipt.label) + '</b><small>&#9654; ' +
              esc(time) + '</small></button>';
          }).join("") + '</div>' : '') +
        (compact && receipts.length > displayedReceipts.length ?
          '<p class="source-dossier-wiki-more"><b>' +
          esc(receipts.length - displayedReceipts.length) + ' MORE SAVED MOMENT' +
          (receipts.length - displayedReceipts.length === 1 ? '' : 'S') +
          '.</b> Choose Explore All for the complete lane.</p>' : '') +
        '<details class="source-dossier-wiki-evidence"><summary>HOW THESE TIMESTAMPS WORK</summary><p>' +
        'Every jump opens this exact upload at a saved time. These page labels are not speaker attribution, creator approval, or a verdict from Mike or J.</p></details>' +
        (emptyState && !receipts.length ? '<p class="source-dossier-wiki-empty">' + esc(emptyState) + '</p>' : '') +
        '</article>';
    }

    function showWikiEmptyLanesMarkup(lanes) {
      if (!lanes.length) return "";
      return '<section class="source-dossier-wiki-empty-lanes" aria-label="Show Wiki categories without timestamped moments">' +
        '<header><span>LOOKED FOR, NOT FOUND IN THIS SHOW</span><b>' + esc(lanes.length) +
        ' CATEGOR' + (lanes.length === 1 ? 'Y' : 'IES') + ' SKIPPED</b></header><div>' +
        lanes.map(function (entry) {
          var lane = entry.lane;
          return '<article id="' + esc(showWikiLaneId(lane, entry.index)) + '" data-show-wiki-lane="' +
            esc(clean(lane.id) || token(lane.label)) + '" data-show-wiki-receipt-count="0"><b>' +
            esc(lane.label) + '</b><small>' + esc(lane.emptyState) + '</small></article>';
        }).join("") + '</div></section>';
    }

    function showWikiMarkup(dossier) {
      var source = dossier.source;
      var wiki = record(source.showWiki);
      var lanes = array(wiki.lanes).map(record);
      var receiptCount = array(source.receipts).length;
      var sourceBrief = isSourceBrief(dossier);
      var episodeRecap = episodeRecapFor(dossier);
      var readyEpisodeRecap = clean(episodeRecap.state) === "ready";
      var structuredSummaryRecap = readyEpisodeRecap &&
        structuredSummaryEpisodeRecap(episodeRecap);
      var canonicalEpisodeRecap = readyEpisodeRecap &&
        canonicalEditorialEpisodeRecap(episodeRecap);
      var topicOnlyRecap = readyEpisodeRecap &&
        clean(episodeRecap.tier) === "topic-recap";
      var status = clean(wiki.status) ||
        (receiptCount ? "SOURCE DISTILLED" : "QUEUED // NOT DISTILLED");
      var label = clean(wiki.label) || "SHOW WIKI";
      var description = clean(wiki.description);
      var queued = token(status).indexOf("queued") === 0;
      var experience = record(wiki.experience);
      var guide = record(wiki.episodeGuide);
      var hasEpisodeGuide = clean(guide.schema) === "wwam-episode-guide/v2";
      var hasMappedContent = Boolean(readyEpisodeRecap ||
        record(wiki.recap).overview || source.summary ||
        array(experience.routeReceiptKeys).length || lanes.some(function (lane) {
          return showWikiLaneReceipts(dossier, lane).length;
        }));
      var populated = [];
      var empty = [];
      lanes.forEach(function (lane, index) {
        if (isShowWikiFamLane(lane)) return;
        var entry = { lane: lane, index: index };
        if (showWikiLaneReceipts(dossier, lane).length) populated.push(entry);
        else empty.push(entry);
      });
      var seenReceipts = {};
      var compact = !state.fullFile;
      var highlightEntries = populated.filter(function (entry) {
        return isShowWikiHighlightLane(entry.lane);
      });
      if (!highlightEntries.length) highlightEntries = populated.slice(0, 2);
      var visibleEntries = compact ? [] : populated;
      var recapMomentCount = structuredSummaryRecap ? 0 :
        array(episodeRecap.highlightRunway).length;
      var recapTopicDoorCount = structuredSummaryRecap ?
        episodeRecapTopicEntries(dossier, 8).length : 0;
      var audioListeningCount = array(source.receipts).filter(function (receipt) {
        return clean(receipt && receipt.evidenceType).toLowerCase() ===
          "audio-feature-candidate";
      }).length;
      var hasAudioListeningPass = audioListeningCount > 0;
      var recapHasHumanStory =
        /human-editorial/i.test(clean(episodeRecap.editorialState)) ||
        record(episodeRecap.caseFile).humanEditorialRead === true;
      var recapStoryCount = recapHasHumanStory ?
        array(episodeRecap.story).length : 0;
      var visibleMomentCount = structuredSummaryRecap ? recapTopicDoorCount :
        readyEpisodeRecap ? recapMomentCount : compact ?
        (hasEpisodeGuide ? Math.min(4, array(guide.cuts).length) :
          Math.min(3, array(experience.routeReceiptKeys).length)) :
        visibleEntries.reduce(function (total, entry) {
          return total + showWikiLaneReceipts(dossier, entry.lane).length;
        }, 0);
      var headerTitle = sourceBrief && hasEpisodeRecap(dossier) ?
        "THE SHOW IS HERE. THE RECAP IS WAITING ON THE TAPE." :
        sourceBrief ? "THE SHOW IS HERE. THE DEEP DIVE IS NOT READY YET." :
        structuredSummaryRecap && !recapTopicDoorCount && hasAudioListeningPass ?
          "THE TAPE HAS A LISTENING PASS. THE WRITTEN STORY IS NEXT." :
        structuredSummaryRecap ? "WHAT CAME UP, WITHOUT A FAKE BEST-OF LIST." :
        status === "topic-nav-only" ? "WHAT THEY COVERED, WITH A WAY BACK TO EACH PART." :
          hasMappedContent ? "THE WHOLE NIGHT, CUT TO THE PARTS WORTH REVISITING." :
            "THE SHOW IS HERE. THE MOMENT MAP IS COMING.";
      var headerDescription = sourceBrief && hasEpisodeRecap(dossier) ?
        "The official upload is verified. No episode events are invented while its caption map is missing." :
        sourceBrief ?
        "The official upload is linked and verified. A recap will appear only after this exact show has usable captions." :
        structuredSummaryRecap && !recapTopicDoorCount && hasAudioListeningPass ?
          "Audio-ranked windows are attached to this exact upload. Listen first; the machine pass does not claim a speaker, joke, or finished best-of moment." :
        structuredSummaryRecap ?
          "The subjects and timestamps are mapped. The written story and best-of shelf stay hidden until somebody has actually read the whole tape." :
        queued ? "The upload is ready to watch. Its recap and moments wait for captions from this exact show." :
          "A recap, watch path, and timestamped moments from this exact upload.";
      var statusLabel = sourceBrief && hasEpisodeRecap(dossier) ?
        "RECAP WAITING ON THE TAPE" :
        structuredSummaryRecap && !recapTopicDoorCount && hasAudioListeningPass ?
          "LISTENING PASS" :
        structuredSummaryRecap ? "SOURCE SUBJECT MAP" :
        readyEpisodeRecap && clean(episodeRecap.tier) === "topic-recap" ?
          (number(record(episodeRecap.caseFile).lastPlayableAnchorPercent) > 0 &&
            number(record(episodeRecap.caseFile).lastPlayableAnchorPercent) < 85 ?
            "PARTIAL SUBJECT MAP" : "SOURCE SUBJECT MAP") :
          readyEpisodeRecap ? "EPISODE WIKI" :
            sourceBrief ? "DEEP DIVE NOT READY" : queued ? "WAITING FOR CAPTIONS" :
          status === "topic-nav-only" ? "TOPICS READY" :
            receiptCount ? (compact ? "SHOW HIGHLIGHTS" : "FULL SHOW FILE") :
              "SHOW PAGE STARTED";
      var body = "";
      if (sourceBrief) {
        body += (hasEpisodeRecap(dossier) ?
          showWikiEpisodeRecapMarkup(dossier, compact) :
          showWikiBriefMarkup(dossier)) +
          '<aside class="source-dossier-wiki-brief-seal" role="note"><b>' +
          'NO FAKE RECAP.</b><span>This page will not turn a title and thumbnail into made-up topics, ' +
          'quotes, character bits, or comedy verdicts.</span></aside>' +
          showWikiFamMarkup(dossier);
      } else {
        if (canonicalEpisodeRecap) {
          /*
           * One episode, one story, one moment index. The old assembly stacked
           * the same timestamps as a watch path, format desk, fan read,
           * episode guide, category lanes, and act chronicle.
           */
          body += showWikiEpisodeRecapMarkup(dossier, compact) +
            showWikiAudioListeningMarkup(dossier, compact) +
            showWikiFamMarkup(dossier);
        } else {
          body += (hasEpisodeRecap(dossier) ?
            showWikiEpisodeRecapMarkup(dossier, compact) :
            showWikiRecapMarkup(dossier, compact)) +
            showWikiAudioListeningMarkup(dossier, compact) +
            showWikiFamMarkup(dossier) +
            showWikiFanReadMarkup(dossier, compact) +
            ((!compact || !hasEpisodeRecap(dossier)) ?
              showWikiEpisodeGuideMarkup(dossier, compact) : "") +
            ((!compact || !hasEpisodeRecap(dossier) && !hasEpisodeGuide) ?
              showWikiExperienceMarkup(dossier, compact) : "") +
            (visibleEntries.length ? '<div class="source-dossier-wiki-lanes">' +
              visibleEntries.map(function (entry) {
                return showWikiLaneMarkup(
                  dossier, entry.lane, entry.index, seenReceipts, compact
                );
              }).join("") + '</div>' : '') +
            (queued
              ? '<p class="source-dossier-wiki-queued-note"><b>THE CATEGORIES ARE READY.</b> They stay empty until this exact upload has captions strong enough to support them.</p>'
              : compact ? '' : showWikiEmptyLanesMarkup(empty));
        }
      }
      return '<section class="source-dossier-show-wiki"' + sectionAttributes("wiki") +
        ' aria-labelledby="sourceDossierShowWikiTitle" data-source-show-wiki-status="' +
        esc(token(status)) + '"><header><div><span>' + esc(label) +
        '</span><h3 id="sourceDossierShowWikiTitle">' + esc(headerTitle) +
        '</h3></div>' + (headerDescription ? '<p>' + esc(headerDescription) + '</p>' : '') +
        '</header><div class="source-dossier-wiki-status" role="status"><span>' +
        'ON THIS PAGE</span><b>' + esc(statusLabel) +
        '</b><small>' + (structuredSummaryRecap ?
          recapTopicDoorCount ?
            esc(recapTopicDoorCount) + ' PLAYABLE TOPIC ' +
              (recapTopicDoorCount === 1 ? 'DOOR' : 'DOORS') +
              ' // FULL STORY PENDING' :
          hasAudioListeningPass ?
            esc(audioListeningCount) + ' AUDIO-RANKED LISTENING WINDOW' +
              (audioListeningCount === 1 ? '' : 'S') +
              ' // FULL STORY PENDING' :
            '0 PLAYABLE TOPIC DOORS // FULL STORY PENDING' :
          readyEpisodeRecap ?
          esc(recapMomentCount) + ' PLAYABLE MOMENT' +
            (recapMomentCount === 1 ? '' : 'S') +
            (recapStoryCount ? ' // ' + esc(recapStoryCount) +
              '-CHAPTER FULL SHOW STORY' : ' // SUBJECT MAP INCLUDED') :
          (compact && !sourceBrief ?
            esc(visibleMomentCount) + ' STARTER MOMENT' +
              (visibleMomentCount === 1 ? '' : 'S') + ' // ' : '') +
            esc(receiptCount) + ' TIMESTAMP' +
            (receiptCount === 1 ? '' : 'S')) +
        '</small></div>' + body + '</section>';
    }
    function refusalMarkup(dossier) {
      var proof = dossier.proof;
      var sourceOnly = proof.sourceOnly;
      return '<div class="source-dossier-refusal" role="status" aria-live="polite">' +
        '<span>' + esc(sourceOnly ? "UPLOAD DETAILS ONLY" : "CAPTIONS NOT STRONG ENOUGH") + '</span>' +
        '<h4>THE UPLOAD IS HERE. THE CONVERSATION IS NOT READY.</h4><p>' +
        esc(proof.evidenceBoundary) + '</p><ul><li>No caption-backed moments</li>' +
        '<li>No caption-backed recap</li><li>No guessed speakers</li><li>No made-up categories</li></ul></div>';
    }

    function queryFact(label, value) {
      return '<span><b>' + esc(value == null || value === "" ? "0" : value) +
        '</b>' + esc(label) + '</span>';
    }

    function queryMetadataMarkup(result, dossier) {
      var value = record(result.value);
      var details = "";
      var heading = "ABOUT THIS UPLOAD";
      if (result.field === "registered-source-brief") {
        var source = dossier.source;
        var brief = record(record(source.showWiki).brief);
        heading = "SHOW DETAILS // DEEP DIVE NOT READY";
        details = queryFact("FORMAT", clean(brief.format)) +
          queryFact("UPLOAD", formatDate(source.date)) +
          queryFact("RUNTIME", formatDuration(source.duration)) +
          queryFact("VIEWS WHEN INDEXED", formatNumber(source.views)) +
          queryFact(
            "CAPTION COVERAGE",
            coverageLabel(source.coverage, source.exactSourceHold)
          ) +
          '<p>The upload details are ready. A recap and moment claims wait for usable captions from this exact show.</p>';
      } else if (result.field === "source-inventory") {
        details = queryFact("SHOW DETAILS", value.sourceBriefAvailable ? "AVAILABLE" :
          (value.summaryAvailable ? "NOT NEEDED" : "NOT AVAILABLE")) +
          queryFact("TIMESTAMPS", formatNumber(record(value.receipts).total)) +
          queryFact("ENTITIES", formatNumber(value.entities)) +
          queryFact("ARTIFACTS", formatNumber(record(value.artifacts).total)) +
          queryFact("CONNECTIONS", formatNumber(record(value.connections).total));
      } else if (result.field === "source-proof") {
        details = queryFact("UPLOAD", formatDate(value.date)) +
          queryFact("RUNTIME", formatDuration(value.duration)) +
          queryFact("VIEWS WHEN INDEXED", formatNumber(value.views)) +
          queryFact(
            "CAPTION COVERAGE",
            coverageLabel(value.coverage, value.exactSourceHold)
          );
      } else if (result.field === "official-alternate") {
        var alternate = record(value.officialAlternate);
        var alternateAvailable = value.available === true &&
          clean(alternate.episodeUrl) &&
          clean(alternate.enclosureUrl) &&
          alternate.timestampIsomorphic === false;
        heading = alternateAvailable ?
          "OFFICIAL ALTERNATE // PLAYABLE HERE" :
          "NO SEPARATE OFFICIAL EDITION FOUND";
        details = alternateAvailable ?
          queryFact("PLAYBACK", "AVAILABLE HERE") +
            queryFact("TIMELINE", "SEPARATE EDIT") +
            '<p><b>' + esc(clean(alternate.title) || "Official alternate edition") +
            '</b><br>This official public edition can play on this page, but its ' +
            'timestamps never replace the canonical YouTube timeline.</p>' +
            '<p><a href="#sourceDossierAlternatePlayer">OPEN OFFICIAL AUDIO &#8593;</a> ' +
            '<a href="' + esc(alternate.episodeUrl) +
            '" target="_blank" rel="noopener">OPEN OFFICIAL EPISODE &#8599;</a></p>' :
          queryFact("ALTERNATE PLAYBACK", "NOT AVAILABLE") +
            '<p>The source proof does not contain a separate official edition ' +
            'that this page can play.</p>';
      } else if (result.field === "registered-summary") {
        heading = "EPISODE RECAP";
        details = '<p>' + esc(clean(value.text) || "No recap text is available for this show yet.") +
          '</p>';
      } else {
        details = '<p>' + esc(
          clean(result.value) || "This show detail is not available for public display."
        ) + '</p>';
      }
      return '<article class="source-dossier-query-result is-metadata" ' +
        'data-source-query-result-type="metadata"><span>' +
        esc(clean(result.field).toUpperCase() || "SOURCE METADATA") +
        '</span><h5>' + esc(heading) +
        '</h5><div class="source-dossier-query-facts">' +
        details + '</div><small>FOUND FROM // ' +
        esc(clean(result.basis).toUpperCase() || "SHOW DOSSIER") +
        '</small></article>';
    }
    function queryEntityMarkup(result) {
      return '<article class="source-dossier-query-result is-entity" ' +
        'data-source-query-result-type="entity"><span>' +
        esc(clean(result.entityType).toUpperCase() || "SOURCE ENTITY") +
        '</span><h5>' + esc(result.label || result.id || "UNNAMED ENTITY") +
        '</h5><p>' + esc(entityBasisLabel(result.basis)) +
        '</p><small>' + esc(array(result.receiptKeys).length) +
        ' TIMESTAMP LINK IN THIS SHOW' +
        (array(result.receiptKeys).length === 1 ? "" : "S") + '</small></article>';
    }

    function queryArtifactMarkup(result) {
      return '<article class="source-dossier-query-result is-artifact" ' +
        'data-source-query-result-type="artifact"><span>' +
        esc(artifactAuthorityLabel(result.authority)) + '</span><h5>' +
        esc(result.label || result.id || "UNNAMED REVIEW ARTIFACT") +
        '</h5><p>' + esc(titleCase(result.kind).toUpperCase() || "REVIEW ARTIFACT") +
        (result.targetSection ? ' // TARGET: ' +
          esc(clean(result.targetSection).toUpperCase()) : '') +
        '</p><small>' + esc(clean(result.reviewState).toUpperCase() || "REVIEW STATE UNKNOWN") +
        ' // ' + (result.risk ? 'RISK ' + esc(clean(result.risk).toUpperCase()) :
          "RISK NOT ASSIGNED") + '</small></article>';
    }

    function queryConnectionMarkup(result) {
      return '<article class="source-dossier-query-result is-connection" ' +
        'data-source-query-result-type="connection"><span>' +
        esc(clean(result.direction).toUpperCase() || "ARCHIVE") +
        ' RELATIONSHIP // NAVIGATION ONLY</span><h5>' +
        esc(result.targetTitle || result.targetSourceId || "RELATED SOURCE") +
        '</h5><p>' + esc(relationshipLabel(result.basis)) +
        (array(result.sharedEntities).length ? ' // ' +
          esc(array(result.sharedEntities).join(", ")) : '') +
        '</p>' + (result.targetSourceId ?
          '<button type="button" data-source-dossier-action="open-source" data-source-id="' +
          esc(result.targetSourceId) + '">OPEN RELATED SOURCE &#8594;</button>' : '') +
        '</article>';
    }

    function queryGuideCutMarkup(result) {
      var cut = record(result.cut || result.guideCut);
      var receipt = record(result.receipt);
      var canonicalMatch = result.type === "receipt" && clean(receipt.key);
      var time = formatTime(cut.at);
      var excerptSource = canonicalMatch && receipt.publicExcerptAllowed ?
        receipt.excerpt : cut.excerpt;
      var excerptText = cleanCaptionExcerpt(excerptSource);
      var excerpt = excerptText ? '&ldquo;' + esc(excerptText) + '&rdquo;' :
        '<span class="source-dossier-withheld">The timestamp is saved; the excerpt is not public.</span>';
      var action = canonicalMatch ?
        'data-source-dossier-action="play-receipt" data-receipt-key="' + esc(receipt.key) + '"' :
        'data-source-dossier-action="play-guide-cut" data-guide-at="' + esc(cut.at) +
          '" data-guide-end="' + esc(cut.end) + '" data-guide-label="' +
          esc(clean(cut.topic) || clean(cut.label) || "DEEP-DIVE CUT") +
          '" data-guide-return="sourceDossierAsk" data-guide-return-label="ASK THIS SHOW"';
      return '<article class="source-dossier-query-result is-guide-cut" ' +
        'data-source-query-result-type="guide-cut" data-guide-cut-id="' + esc(cut.id) +
        '" data-guide-cut-basis="' + (canonicalMatch ? 'canonical-overlap' : 'episode-guide') +
        '"><span>DEEP-DIVE CUT' + (canonicalMatch ? ' // SOURCE MOMENT MATCH' : '') +
        '</span><h5>' + esc(clean(cut.category) || 'EPISODE GUIDE') + ' // ' +
        esc(clean(cut.topic) || clean(cut.label) || 'SAVED CUT') + '</h5><p>' + excerpt +
        '</p><small>EXACT-SHOW CAPTION NAVIGATION // SPEAKER NOT CONFIRMED</small>' +
        '<button type="button" ' + action + ' aria-label="Play deep-dive cut at ' +
        esc(time) + '">&#9654; JUMP TO ' + esc(time) + '</button></article>';
    }

    function queryResultMarkup(result, dossier) {
      if (result.type === "receipt") {
        return result.guideCut ? queryGuideCutMarkup(result) :
          receiptMarkup(result.receipt, "source-dossier-query-receipt");
      }
      if (result.type === "guide-cut") return queryGuideCutMarkup(result);
      if (result.type === "metadata") return queryMetadataMarkup(result, dossier);
      if (result.type === "entity") return queryEntityMarkup(result);
      if (result.type === "artifact") return queryArtifactMarkup(result);
      return queryConnectionMarkup(result);
    }

    function queryEpisodeGuideMarkup(dossier, episode) {
      if (!episode) return "";
      var wiki = record(dossier.source.showWiki);
      var targetId = "sourceDossierShowWikiSummary";
      var action = "OPEN THE FULL RECAP";
      if (episode.kind === "brief") {
        action = "OPEN SHOW DETAILS";
      } else if (episode.kind === "guide") {
        targetId = "sourceDossierEpisodeGuide";
        action = "OPEN THE FULL DEEP DIVE";
      } else if (episode.kind === "experience") {
        targetId = "sourceDossierShowWikiExperience";
        action = "OPEN THE FULL WATCH PATH";
      } else if (episode.kind === "lane") {
        var lanes = array(wiki.lanes).map(record);
        var laneIndex = -1;
        lanes.some(function (lane, index) {
          if (clean(lane.id) !== episode.id) return false;
          laneIndex = index;
          return true;
        });
        if (laneIndex >= 0) targetId = showWikiLaneId(lanes[laneIndex], laneIndex);
        action = "OPEN FULL " + episode.label;
      }
      var countLine = episode.kind === "guide" ?
        esc(episode.totalCuts) + ' CUTS // ' + esc(episode.matchedCuts) +
          ' MATCHED // ' + esc(episode.shownCuts) + ' SHOWN' :
        esc(episode.totalReceipts) + ' ON FILE // ' +
          esc(episode.matchedReceipts) + ' MATCHED // ' +
          esc(episode.shownReceipts) + ' SHOWN';
      return '<aside class="source-dossier-query-episode-guide" data-source-query-episode-kind="' +
        esc(episode.kind) + '"><div><span>SHOW WIKI ANSWER</span><b>' +
        esc(episode.label) + '</b><small>' + countLine + '</small></div><a href="#' +
        esc(targetId) + '">' + esc(action) + ' &#8595;</a></aside>';
    }

    function queryAnswerMarkup(dossier) {
      if (state.queryBusy) {
        return '<div class="source-dossier-query-state is-loading" id="sourceDossierAskAnswer" ' +
          'role="status" aria-live="polite"><span>SEARCHING THIS SHOW</span>' +
          '<h4>CHECKING THE TIMESTAMPS.</h4><p>The answer will use this show and nothing else.</p></div>';
      }
      if (state.queryError) {
        return '<div class="source-dossier-query-state is-held" id="sourceDossierAskAnswer" ' +
          'role="alert"><span>ANSWER HELD</span><h4>THIS RESULT DID NOT PASS THE SOURCE CHECK.</h4><p>' +
          esc(state.queryError) + '</p></div>';
      }
      if (!state.queryAnswer) {
        return '<div class="source-dossier-query-state" id="sourceDossierAskAnswer" ' +
          'role="status" aria-live="polite"><span>ONE SHOW AT A TIME</span>' +
          '<h4>WHAT DO YOU WANT TO FIND HERE?</h4><p>' +
          (queryEngine && typeof queryEngine.answer === "function" ?
            "Ask in plain language. Every answer stays inside this upload." :
            "Search for this show is not connected yet; the wider archive will not be used as a substitute.") +
          '</p></div>';
      }
      var answer = state.queryAnswer;
      var status = answer.status;
      var results = array(answer.results);
      var refusal = [
        "metadata-only", "caption-limited", "unavailable",
        "insufficient-evidence", "speaker-refused", "ranking-refused",
        "stale-source"
      ].indexOf(status) >= 0;
      var conclusion = answer.message || (refusal ?
        "This show does not have enough evidence to answer that." :
        results.length + " moment" +
          (results.length === 1 ? "" : "s") + " from this show matched your question.");
      return '<div class="source-dossier-query-answer is-' + esc(token(status)) +
        '" id="sourceDossierAskAnswer" role="region" aria-live="polite" ' +
        'aria-labelledby="sourceDossierAskAnswerTitle" data-source-query-status="' +
        esc(status) + '" data-source-query-result-count="' + esc(results.length) + '">' +
        '<header><div><span>' + esc(queryStatusLabel(status)) +
        '</span><h4 id="sourceDossierAskAnswerTitle">' + esc(conclusion) +
        '</h4></div><b>ONLY THIS SHOW // ' + esc(dossier.source.id) + '</b></header>' +
        '<p class="source-dossier-query-question">&ldquo;' + esc(state.query) +
        '&rdquo;</p>' +
        queryEpisodeGuideMarkup(dossier, answer.episode) +
        (results.length ? '<div class="source-dossier-query-results">' +
          results.map(function (result) { return queryResultMarkup(result, dossier); }).join("") + '</div>' :
          '<div class="source-dossier-query-refusal"><b>NO MATCH IN THIS SHOW</b><span>' +
          esc(dossier.proof.evidenceBoundary) + '</span></div>') +
        (answer.limitations.length ? '<ul class="source-dossier-query-limitations">' +
          answer.limitations.slice(0, 3).map(function (limitation) {
            return '<li>' + esc(limitation) + '</li>';
          }).join("") + '</ul>' : '') +
        '<footer><span>' + esc(results.length) + ' OF ' +
        esc(answer.total) + ' MATCHES SHOWN</span><span>' +
        'OTHER SHOWS NOT INCLUDED</span></footer></div>';
    }

    function askMarkup(dossier) {
      var source = dossier.source;
      var sourceBrief = isSourceBrief(dossier);
      var distilled = clean(record(source.showWiki).status) === "distilled";
      var prompts = sourceBrief ? [
        "Show me the source brief.",
        "When was this uploaded?",
        "How long is this tape?",
        "How many views?",
        "What is actually indexed in this tape?"
      ] : distilled ? [
        "Summarize this show.",
        "What did they talk about?",
        "What were the funniest moments?",
        "What did they hate?",
        "Show me WWAM Up In Ya.",
        "Give me the five-stop watch path."
      ] : [
        "What is actually indexed in this tape?",
        "Show the timestamped moments in this tape.",
        "Which recurring characters are indexed here?",
        "What Short or supercut drafts are on file here?"
      ];
      return '<section class="source-dossier-ask"' + sectionAttributes("ask") +
        ' aria-labelledby="sourceDossierAskTitle"><header><div>' +
        '<span>ASK ABOUT THIS SHOW</span><h3 id="sourceDossierAskTitle">FIND IT WITHOUT SCRUBBING FOR HOURS.</h3>' +
        '</div><p>Ask what they covered, what hit, what they hated, or where a running bit happened. Every answer stays inside this upload.</p></header>' +
        '<div class="source-dossier-source-lock" role="status" data-source-fingerprint="' + esc(clean(source.sourceFingerprint)) + '"><span>SEARCHING ONLY</span><b>' +
        esc(source.id) + '</b><small>THIS SHOW. NO OTHER UPLOADS.</small>' +
        '</div><div class="source-dossier-query-prompts" aria-label="Useful questions about this show">' +
        prompts.map(function (prompt) {
          return '<button type="button" data-source-dossier-action="query-prompt" data-query="' +
            esc(prompt) + '">' + esc(prompt) + '</button>';
        }).join("") + '</div><form class="source-dossier-query-form" data-source-dossier-query-form ' +
        'aria-describedby="sourceDossierQueryBoundary"><label for="sourceDossierQuery">YOUR QUESTION</label>' +
        '<div><input id="sourceDossierQuery" name="query" type="search" maxlength="240" required ' +
        'autocomplete="off" value="' + esc(state.query) +
        '" placeholder="What happened in this show?"><button type="submit"' +
        (state.queryBusy ? " disabled" : "") + '>ASK THIS SHOW</button></div>' +
        '<small id="sourceDossierQueryBoundary">Answers use only saved timestamps from ' +
        esc(source.id) + '. Unconfirmed speakers, intent, and origin stay unclaimed.</small></form>' +
        queryAnswerMarkup(dossier) + '</section>';
    }

    function insideMarkup(dossier) {
      var source = dossier.source;
      var receipts = array(source.receipts);
      var visibleReceipts = sectionExpanded("inside") ? receipts : [];
      var summary = source.summary;
      return '<section class="source-dossier-inside"' + sectionAttributes("inside") +
        ' aria-labelledby="sourceDossierInsideTitle">' +
        '<header><div><span>ALL SAVED MOMENTS</span><h3 id="sourceDossierInsideTitle">' +
        (receipts.length ? esc(formatNumber(receipts.length)) + ' EXACT TIMESTAMPS FROM THIS SHOW.' :
          'NO CAPTION-BACKED MOMENTS YET.') +
        '</h3></div><p>This is the full timestamp index behind the recap above. Category and review labels are archive notes, not quotes from Mike or J.</p></header>' +
        (summary ? '<blockquote><span>SHOW SUMMARY // BUILT FROM ' +
          esc(clean(summary.basis).toUpperCase()) + '</span><p>' +
          esc(summary.text) + '</p></blockquote>' : '') +
        (receipts.length ? '<div class="source-dossier-receipts" id="' +
          esc(SECTION_IDS.inside) + 'Items">' +
          visibleReceipts.map(function (receipt) { return receiptMarkup(receipt); }).join("") +
          '</div>' + disclosureMarkup(
            "inside", receipts.length, visibleReceipts.length, "timestamps"
          ) : refusalMarkup(dossier)) + '</section>';
    }

    function entityMarkup(entity) {
      return '<article class="source-dossier-entity"><span>' +
        esc(clean(entity.type).toUpperCase()) + '</span><b>' +
        esc(entity.label) + '</b><small>' + esc(entityBasisLabel(entity.basis)) +
        (array(entity.receiptKeys).length ? ' // ' +
          esc(array(entity.receiptKeys).length) + ' LOCAL RECEIPT' +
          (array(entity.receiptKeys).length === 1 ? '' : 'S') : '') +
        '</small></article>';
    }

    function footprintMarkup(dossier) {
      var source = dossier.source;
      var entities = array(source.entities);
      var visibleEntities = visibleItems(
        entities, "footprint", COMPACT_LIMITS.entities
      );
      var receipts = dossier.receiptSummary || { total: 0, byKind: {}, byEvidenceType: {} };
      var artifacts = dossier.artifactSummary || { total: 0, byKind: {}, byAuthority: {} };
      return '<section class="source-dossier-footprint"' + sectionAttributes("footprint") +
        ' aria-labelledby="sourceDossierFootprintTitle">' +
        '<header><div><span>MEMORY OS FOOTPRINT</span><h3 id="sourceDossierFootprintTitle">WHAT THIS SOURCE POWERS.</h3></div>' +
        '<p>Counts describe the current archive inventory. They are not popularity, quality, creator approval, or objective importance.</p></header>' +
        '<div class="source-dossier-footprint-totals"><article><b>' +
        esc(formatNumber(receipts.total)) + '</b><span>RECEIPTS</span></article><article><b>' +
        esc(formatNumber(entities.length)) + '</b><span>ENTITIES</span></article><article><b>' +
        esc(formatNumber(artifacts.total)) + '</b><span>DRAFT / REVIEW ARTIFACTS</span></article><article><b>' +
        esc(formatNumber(dossier.wake.total || 0)) + '</b><span>RELATED SOURCES</span></article></div>' +
        '<div class="source-dossier-footprint-grid"><article><span>RECEIPT KINDS</span><div>' +
        summaryRows(receipts.byKind, null, esc) + '</div></article><article><span>EVIDENCE TYPES</span><div>' +
        summaryRows(receipts.byEvidenceType, null, esc) + '</div></article><article><span>ARTIFACT KINDS</span><div>' +
        summaryRows(artifacts.byKind, null, esc) + '</div></article><article><span>ACTION AUTHORITY</span><div>' +
        summaryRows(artifacts.byAuthority, artifactAuthorityLabel, esc) + '</div></article></div>' +
        '<div class="source-dossier-entities"><header><span>SOURCE ENTITIES</span><b>' +
        esc(formatNumber(entities.length)) + ' TOTAL</b></header>' +
        (entities.length ? '<div id="' + esc(SECTION_IDS.footprint) + 'Items">' +
          visibleEntities.map(entityMarkup).join("") + '</div>' +
          disclosureMarkup(
            "footprint", entities.length, visibleEntities.length, "entities"
          ) : '<p>NO CONTENT ENTITY WAS FOUND FOR THIS SOURCE.</p>') +
        '</div></section>';
    }

    function connectionEntities(connection) {
      var entities = array(connection.sharedEntities);
      if (!entities.length) {
        return connection.artifactIds && connection.artifactIds.length ?
          '<span>SHARED ARTIFACT // ' + esc(connection.artifactIds.join(" + ")) + '</span>' :
          '<span>NO CONTENT ENTITY CLAIM</span>';
      }
      return entities.map(function (entity) {
        var localCount = array(entity.localReceiptKeys).length;
        var relatedCount = array(entity.relatedReceiptKeys).length;
        return '<span><b>' + esc(entity.label) + '</b>' + esc(relationshipLabel(entity.basis)) +
          ' // LOCAL ' + esc(localCount) + ' / RELATED ' + esc(relatedCount) + '</span>';
      }).join("");
    }

    function connectionMarkup(connection, neighborhood) {
      return '<article class="source-dossier-connection ' +
        (neighborhood ? "is-neighbor" : "is-evidence") + '"><div class="source-dossier-connection-image">' +
        '<img loading="lazy" src="' + esc(connection.thumbnail) + '" alt="' +
        esc(connection.displayTitle || connection.title) + ' source thumbnail"></div><div>' +
        '<span>' + esc(formatDate(connection.date)) + ' // ' +
        esc(neighborhood ? "ARCHIVE NEIGHBORHOOD // " +
          relationshipLabel(connection.basis) : relationshipLabel(connection.basis)) +
        '</span><h4>' + esc(connection.displayTitle || connection.title) + '</h4><div class="source-dossier-connection-basis">' +
        connectionEntities(connection) + '</div><button type="button" data-source-dossier-action="open-source" ' +
        'data-source-id="' + esc(connection.sourceId) + '" aria-label="Open related source ' +
        esc(connection.displayTitle || connection.title) + '">OPEN RELATED SOURCE &#8594;</button></div></article>';
    }

    function wakeMarkup(dossier) {
      var later = array(dossier.wake.later);
      var earlier = array(dossier.wake.earlier);
      var laterEvidence = later.filter(function (connection) {
        return connection.basis !== "source-metadata-neighbor";
      });
      var titleNeighbors = later.filter(function (connection) {
        return connection.basis === "source-metadata-neighbor";
      }).concat(earlier);
      var visibleLater = visibleItems(
        laterEvidence, "wake", COMPACT_LIMITS.wake
      );
      var visibleNeighbors = visibleItems(
        titleNeighbors, "wake", COMPACT_LIMITS.neighborhood
      );
      var totalConnections = laterEvidence.length + titleNeighbors.length;
      var visibleConnections = visibleLater.length + visibleNeighbors.length;
      return '<section class="source-dossier-wake"' + sectionAttributes("wake") +
        ' aria-labelledby="sourceDossierWakeTitle">' +
        '<header><div><span>THE TAPE&rsquo;S WAKE</span><h3 id="sourceDossierWakeTitle">WHAT THE ARCHIVE CONNECTS AFTERWARD.</h3></div>' +
        '<p>A shared entity or artifact proves an indexed relationship. It does not prove influence, causality, a callback, or the true origin of a bit.</p></header>' +
        '<div class="source-dossier-wake-items" id="' + esc(SECTION_IDS.wake) +
        'Items"><section class="source-dossier-later" aria-labelledby="sourceDossierLaterTitle"><header><span>LATER // DUAL-ENDED EVIDENCE</span>' +
        '<h4 id="sourceDossierLaterTitle">' + esc(formatNumber(laterEvidence.length)) +
        ' LATER CONNECTION' + (laterEvidence.length === 1 ? '' : 'S') + ' WITH EVIDENCE ON BOTH SIDES.</h4></header>' +
        (laterEvidence.length ? '<div>' + visibleLater.map(function (connection) {
          return connectionMarkup(connection, false);
        }).join("") + '</div>' :
          '<p class="source-dossier-empty">NO LATER DUAL-ENDED EVIDENCE SURVIVES THE CURRENT SNAPSHOT.</p>') +
        '</section><section class="source-dossier-neighborhood" aria-labelledby="sourceDossierNeighborhoodTitle">' +
        '<header><span>TITLE / EARLIER NEIGHBORHOOD</span><h4 id="sourceDossierNeighborhoodTitle">' +
        esc(formatNumber(titleNeighbors.length)) + ' RELATED RECORD' +
        (titleNeighbors.length === 1 ? '' : 'S') + ' KEPT OUTSIDE THE CALLBACK CLAIM.</h4></header>' +
        '<p>Earlier records and title-only aliases establish archive proximity—not content, continuity, influence, or causality.</p>' +
        (titleNeighbors.length ? '<div>' + visibleNeighbors.map(function (connection) {
          return connectionMarkup(connection, true);
        }).join("") + '</div>' :
          '<p class="source-dossier-empty">NO TITLE-ONLY OR EARLIER NEIGHBOR SURVIVES THE CURRENT SNAPSHOT.</p>') +
        '</section></div>' + disclosureMarkup(
          "wake", totalConnections, visibleConnections, "connections"
        ) + '</section>';
    }

    function artifactMarkup(artifact) {
      return '<article class="source-dossier-artifact"><header><span>' +
        esc(artifactAuthorityLabel(artifact.authority)) +
        '</span><b>' + esc(clean(artifact.reviewState).toUpperCase()) + '</b></header><h4>' +
        esc(artifact.label) + '</h4><p>' + esc(titleCase(artifact.kind).toUpperCase()) +
        (artifact.targetSection ? ' // TARGET: ' + esc(clean(artifact.targetSection).toUpperCase()) : '') +
        '</p><footer><span>' + (artifact.risk ? 'RISK ' +
          esc(clean(artifact.risk).toUpperCase()) : 'RISK NOT ASSIGNED') + '</span><span>' +
        esc(array(artifact.receiptKeys).length) + ' RECEIPT LINK' +
        (array(artifact.receiptKeys).length === 1 ? '' : 'S') + '</span></footer></article>';
    }

    function workMarkup(dossier) {
      var source = dossier.source;
      var artifacts = array(source.artifacts);
      var visibleArtifacts = visibleItems(
        artifacts, "work", COMPACT_LIMITS.artifacts
      );
      return '<section class="source-dossier-work"' + sectionAttributes("work") +
        ' aria-labelledby="sourceDossierWorkTitle">' +
        '<header><div><span>PUT THE ARCHIVE TO WORK</span><h3 id="sourceDossierWorkTitle">FROM SOURCE PROOF TO A REVIEWABLE NEXT MOVE.</h3></div>' +
        '<p>These controls navigate, draft, or export. Nothing here publishes, promotes, rights-clears, authenticates, or identifies a speaker.</p></header>' +
        (artifacts.length ? '<div class="source-dossier-artifacts" id="' +
          esc(SECTION_IDS.work) + 'Items">' +
          visibleArtifacts.map(artifactMarkup).join("") + '</div>' +
          disclosureMarkup(
            "work", artifacts.length, visibleArtifacts.length, "artifacts"
          ) :
          '<p class="source-dossier-empty">NO DRAFT OR REVIEW ARTIFACT IS AVAILABLE FOR THIS SOURCE.</p>') +
        '<div class="source-dossier-work-actions"><button type="button" data-source-dossier-action="ask-source">' +
        'ASK THIS TAPE</button><button type="button" data-source-dossier-action="open-companion">' +
        'WATCH WITH MEMORY</button><button type="button" data-source-dossier-action="copy-link">' +
        'COPY SOURCE LINK</button><button type="button" data-source-dossier-action="download">' +
        'EXPORT BOUNDED DOSSIER</button></div></section>';
    }

    function aftermathDecisionFor(opportunityId) {
      return state.aftermathReview ? array(state.aftermathReview.decisions).filter(function (decision) {
        return decision.opportunityId === opportunityId;
      })[0] || null : null;
    }

    function aftermathReadinessLabel(value) {
      return {
        "clip-ready": "CLIP READY / CREATOR REVIEW NEXT",
        "fast-review": "FAST REVIEW",
        "archive-expansion": "ARCHIVE-CONNECTED",
        research: "RESEARCH QUEUE",
        quarantine: "RISK QUARANTINE"
      }[value] || titleCase(value).toUpperCase();
    }

    function aftermathFiltered(pack) {
      return array(pack.opportunities).filter(function (item) {
        if (state.aftermathFilter === "cuts") {
          return item.readiness === "clip-ready" || item.readiness === "fast-review";
        }
        if (state.aftermathFilter === "connected") return item.readiness === "archive-expansion";
        if (state.aftermathFilter === "research") return item.readiness === "research";
        if (state.aftermathFilter === "quarantine") return item.readiness === "quarantine";
        return true;
      });
    }

    function aftermathProofButton(dossier, point, fallbackLabel) {
      var receipt = point && sourceReceiptByKey(dossier, point.receiptId);
      if (!receipt) return '<span>NO PLAYABLE TIMESTAMP AVAILABLE</span>';
      return '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
        esc(receipt.key) + '">&#9654; ' + esc(fallbackLabel) + ' ' + esc(formatTime(receipt.at)) + '</button>';
    }

    function aftermathDeltaMarkup(dossier, pack) {
      var delta = record(pack.showDelta);
      if (!clean(delta.summary)) return "";
      var graph = record(delta.graphDelta);
      var funniestReceipt = delta.funniest && sourceReceiptByKey(dossier, delta.funniest.receiptId);
      var strongestReceipt = delta.strongestTopic && sourceReceiptByKey(dossier, delta.strongestTopic.receiptId);
      return '<section class="source-aftermath-delta"><header><span>WHAT THIS SHOW ADDED TO MEMORY</span><p>' +
        esc(delta.inference) + '</p></header><p class="source-aftermath-summary">' +
        esc(delta.summary) + '</p><div class="source-aftermath-delta-grid"><article><b>' +
        esc(number(graph.timestampedReceiptsAdded == null ?
          pack.metrics.sourceReceipts : graph.timestampedReceiptsAdded)) +
        '</b><span>TIMESTAMPED RECEIPTS ADDED</span></article><article><b>' +
        esc(number(graph.topicNodesAdded)) + '</b><span>TOPICS NEW VS PREVIOUS INDEXED LIVE</span></article>' +
        '<article><b>' + esc(number(delta.peakChemistry)) + '</b><span>CAPTION-DERIVED CHEMISTRY PEAK</span></article></div>' +
        (array(delta.newSincePreviousIndexedStream).length ?
          '<div class="source-aftermath-topic-chips"><span>NEW VS PREVIOUS INDEXED LIVE</span>' +
          array(delta.newSincePreviousIndexedStream).map(function (topic) {
            return '<b>' + esc(topic) + '</b>';
          }).join("") + '</div>' : '') +
        '<div class="source-aftermath-proof-jumps"><article><span>STRONGEST TOPIC COORDINATE</span><b>' +
        esc(strongestReceipt ? strongestReceipt.label : "NOT AVAILABLE") + '</b>' +
        aftermathProofButton(dossier, delta.strongestTopic, "PLAY") + '</article><article><span>HIGHEST COMEDY / CHEMISTRY COORDINATE</span><b>' +
        esc(funniestReceipt ? funniestReceipt.label : "NOT AVAILABLE") + '</b>' +
        aftermathProofButton(dossier, delta.funniest, "PLAY") + '</article></div></section>';
    }

    function aftermathQueueMarkup(pack, visible) {
      return '<div class="source-aftermath-queue" aria-label="Source-locked creator opportunities">' +
        visible.map(function (item) {
          var decision = aftermathDecisionFor(item.id);
          var selected = item.id === state.aftermathSelected;
          return '<button type="button" class="' + (selected ? 'is-selected' : '') +
            '" data-source-dossier-action="aftermath-select" data-opportunity-id="' + esc(item.id) +
            '" aria-pressed="' + (selected ? 'true' : 'false') + '"><span>' +
            esc(aftermathReadinessLabel(item.readiness)) + '</span><b>' + esc(item.title) +
            '</b><small>' + esc(item.kind.toUpperCase().replace(/-/g, " ")) + ' // ' +
            esc(item.coordinates[0] ? item.coordinates[0].timecode : "NO LOCAL TIME") +
            (item.multiSource ? ' // MULTI-SHOW' : ' // THIS SHOW') + '</small><i class="decision-' +
            esc(decision ? decision.status : "unreviewed") + '">' +
            esc(decision ? decision.decisionMeaning : "UNREVIEWED") + '</i></button>';
        }).join("") + '</div>';
    }

    function aftermathCoordinatesMarkup(item) {
      return '<div class="source-aftermath-coordinates"><span>EXACT LOCAL RECEIPT' +
        (item.coordinates.length === 1 ? '' : 'S') + ' // PROPOSED WINDOW' +
        (item.coordinates.length === 1 ? '' : 'S') + '</span>' +
        item.coordinates.map(function (coordinate) {
          return '<article><div><b>' + esc(coordinate.timecode) + '</b><span>' +
            esc(coordinate.proposedWindow.inTimecode) + ' &#8594; ' +
            esc(coordinate.proposedWindow.outTimecode) + ' // ' +
            esc(coordinate.proposedWindow.seconds) + ' SEC</span></div><blockquote>&ldquo;' +
            esc(coordinate.publicExcerpt) + '&rdquo;<small>' + esc(coordinate.excerptLabel) +
            ' // SPEAKER ' + esc(coordinate.speakerStatus.toUpperCase()) + '</small></blockquote>' +
            '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
            esc(coordinate.receiptKey) + '">&#9654; PLAY CONTEXT</button></article>';
        }).join("") + '</div>';
    }

    function aftermathDetailMarkup(pack, item) {
      if (!item) {
        return '<section class="source-aftermath-detail is-empty"><span>NO OPPORTUNITY IN THIS FILTER</span>' +
          '<h4>THE SOURCE STAYS EMPTY INSTEAD OF MAKING ONE UP.</h4></section>';
      }
      var decision = aftermathDecisionFor(item.id);
      var scoreComponents = array(record(item.score).components).slice(0, 6);
      var note = decision ? clean(decision.note) : "";
      var titles = array(record(item.editorial).titleOptions);
      var hooks = array(record(item.editorial).hookOptions);
      return '<section class="source-aftermath-detail" aria-live="polite"><header><div><span>' +
        esc(aftermathReadinessLabel(item.readiness)) + ' // PRIORITY ' +
        esc(number(record(item.score).overall)) + '</span><h4>' + esc(item.title) +
        '</h4></div><div class="source-aftermath-badges"><b class="risk-' +
        esc(clean(record(item.risk).label).toLowerCase()) + '">' +
        esc(clean(record(item.risk).label).toUpperCase()) + ' RISK</b><b>' +
        esc(clean(record(item.evidence).label).toUpperCase()) + ' EVIDENCE</b><b>' +
        (item.multiSource ? 'MULTI-SHOW' : 'THIS SHOW') + '</b></div></header>' +
        aftermathCoordinatesMarkup(item) +
        '<div class="source-aftermath-copy"><span>' + esc(item.editorial.label) +
        '</span><div><article><small>TITLE OPTIONS</small>' +
        (titles.length ? '<ol>' + titles.map(function (value) { return '<li>' + esc(value) + '</li>'; }).join("") + '</ol>' :
          '<p>NO TITLE COPY AVAILABLE.</p>') + '</article><article><small>HOOK OPTIONS</small>' +
        (hooks.length ? '<ol>' + hooks.map(function (value) { return '<li>' + esc(value) + '</li>'; }).join("") + '</ol>' :
          '<p>NO HOOK COPY AVAILABLE.</p>') + '</article></div></div>' +
        '<div class="source-aftermath-why"><article><span>WHY IT SURFACED</span><p>' +
        esc(item.rationale || record(item.score).basis) + '</p><small>' +
        esc(record(item.score).basis) + '</small></article><article><span>COMPONENT SCORE</span>' +
        (scoreComponents.length ? '<dl>' + scoreComponents.map(function (component) {
          return '<div><dt>' + esc(titleCase(component.id).toUpperCase()) + '</dt><dd>' +
            esc(component.value) + '</dd></div>';
        }).join("") + '</dl>' : '<p>PACKAGE SCORE ONLY.</p>') + '</article></div>' +
        (item.relatedSources.length ? '<div class="source-aftermath-related"><span>RELATED SOURCES // NOT LOCAL PROOF</span>' +
          item.relatedSources.slice(0, 4).map(function (related) {
            return '<button type="button" data-source-dossier-action="open-source" data-source-id="' +
              esc(related.sourceId) + '" data-source-at="' + esc(related.at) + '">' + esc(related.sourceId) + ' @ ' +
              esc(related.timecode) + ' &#8599;</button>';
          }).join("") + '</div>' : '') +
        '<fieldset class="source-aftermath-decision"><legend>LOCAL EDITORIAL ROUTE // NOT CREATOR APPROVAL</legend>' +
        '<label for="sourceDossierAftermathNote">ROUTING NOTE <span>OPTIONAL // 240 CHARACTERS</span></label>' +
        '<textarea id="sourceDossierAftermathNote" maxlength="240" rows="3" ' +
        'aria-describedby="sourceDossierAftermathDecisionBoundary">' + esc(note) + '</textarea>' +
        '<div>' + [
          ["keep", "KEEP FOR CREATOR REVIEW"],
          ["hold", "HOLD FOR MORE CONTEXT"],
          ["reject", "REJECT FROM THIS PACK"]
        ].map(function (choice) {
          var on = decision && decision.status === choice[0];
          return '<button type="button" class="decision-' + choice[0] + (on ? ' is-on' : '') +
            '" data-source-dossier-action="aftermath-decision" data-opportunity-id="' +
            esc(item.id) + '" data-decision="' + choice[0] + '" aria-pressed="' +
            (on ? 'true' : 'false') + '">' + choice[1] + '</button>';
        }).join("") + '</div><p id="sourceDossierAftermathDecisionBoundary">Keep means route to a human creator or editor. It does not publish, rights-clear, verify a speaker, or approve the clip.</p></fieldset></section>';
    }

    function aftermathSidecarsMarkup(pack) {
      var research = array(pack.research);
      var boards = array(pack.storyboards);
      return '<div class="source-aftermath-sidecars"><section><header><span>ARCHIVE RESEARCH THREADS</span><b>' +
        esc(research.length) + ' REFERENCE-ONLY</b></header>' +
        (research.length ? research.map(function (item) {
          var receipt = item.receipts[0];
          return '<article><div><b>' + esc(item.title) + '</b><small>' +
            esc(item.boundary) + '</small></div>' + (receipt ?
              '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
              esc(receipt.receiptKey) + '">&#9654; ' + esc(receipt.timecode) + '</button>' : '') + '</article>';
        }).join("") : '<p>NO EXACT-SHOW RESEARCH THREADS YET.</p>') +
        '</section><section><header><span>COLD-OPEN STORYBOARDS</span><b>' + esc(boards.length) +
        ' GENERATED / SEPARATE COUNT</b></header>' +
        (boards.length ? boards.map(function (board) {
          var slot = board.localSlots[0];
          return '<article><div><b>' + esc(board.title) + '</b><small>' +
            esc(board.formatSeconds) + ' SEC // ' + esc(board.mode) + ' // ' +
            esc(board.registrationBoundary) + '</small></div>' + (slot ?
              '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
              esc(slot.receiptKey) + '">&#9654; LOCAL SLOT ' + esc(slot.timecode) + '</button>' : '') + '</article>';
        }).join("") : '<p>NO SOURCE-LINKED STORYBOARDS AVAILABLE.</p>') + '</section></div>';
    }

    function aftermathMarkup(dossier) {
      var pack = state.aftermathPack;
      if (!pack) {
        return '<section class="source-dossier-aftermath is-held"' + sectionAttributes("aftermath") +
          ' aria-labelledby="sourceDossierAftermathTitle"><header><span>THE AFTERMATH PACK</span>' +
          '<h3 id="sourceDossierAftermathTitle">THE CREATOR HANDOFF IS HELD.</h3></header><p>' +
          esc(state.aftermathError || "The exact-source creator inventory is unavailable for this page.") +
          '</p><small>THE SHOW WIKI REMAINS USABLE. NO OPPORTUNITY WAS INVENTED.</small></section>';
      }
      var metrics = pack.metrics;
      var visible = aftermathFiltered(pack);
      if (!visible.some(function (item) { return item.id === state.aftermathSelected; })) {
        state.aftermathSelected = visible.length ? visible[0].id : "";
      }
      var selected = array(pack.opportunities).filter(function (item) {
        return item.id === state.aftermathSelected;
      })[0] || null;
      var counts = state.aftermathReview ? state.aftermathReview.counts : {
        keep: 0, hold: 0, reject: 0, unreviewed: metrics.opportunities
      };
      var handoffReady = number(metrics.opportunities) > 0 && number(counts.unreviewed) === 0;
      var inventoryComposition = [
        [metrics.shorts, "SHORTS"],
        [metrics.supercutMemberships, "SUPERCUT MEMBERSHIPS"],
        [metrics.resurfacingPairs, "THEN/NOW PAIRS"]
      ].filter(function (item) { return number(item[0]) > 0; }).map(function (item) {
        return number(item[0]) + " " + item[1];
      }).join(" + ") || "NONE FOUND FOR THIS SOURCE";
      var routingHeadline = !number(metrics.opportunities) ? "NO RECEIPT-BACKED HANDOFF YET" :
        handoffReady ? "CREATOR HANDOFF READY FOR HUMAN REVIEW" :
          "DRAFT EXPORT WILL DISCLOSE UNREVIEWED WORK";
      var workflowShowcase = number(metrics.opportunities) > 0 ?
        '<div class="source-aftermath-workflow"><div><span>SOURCE-LOCKED CREATOR WORKFLOW</span><b>THIS SHOW, READY FOR REVIEW</b><p>Playable candidates, a local review ledger, and a bounded editor handoff keep every proposed use attached to this tape. No media edit, rights clearance, publishing authority, or performance claim is included.</p></div><button type="button" data-source-dossier-action="open-clip-lab" data-clip-mode="shorts">OPEN THIS SOURCE IN CLIP LAB &#8594;</button></div>' : "";
      var aftermathAlert = state.aftermathError ?
        '<p class="source-aftermath-error" role="alert"><b>AFTERMATH ACTION HELD.</b> ' +
          esc(state.aftermathError) + '</p>' : "";
      var actionFooter = number(metrics.opportunities) > 0 ?
        '<footer class="source-aftermath-actions"><p>Exports contain coordinates, bounded excerpts, proposed copy, risks, review state, and proof fingerprints. They contain no media or creator approval.</p><div><button type="button" data-source-dossier-action="aftermath-copy">COPY EDITOR BRIEF</button><button type="button" data-source-dossier-action="aftermath-export">DOWNLOAD AFTERMATH PACK</button></div></footer>' :
        '<footer class="source-aftermath-actions"><p>This eligibility receipt contains the exact source binding, zero-opportunity status, proof fingerprints, and explicit omissions. It invents no edit coordinates.</p><div><button type="button" data-source-dossier-action="aftermath-copy">COPY ELIGIBILITY RECEIPT</button><button type="button" data-source-dossier-action="aftermath-export">DOWNLOAD ELIGIBILITY RECEIPT</button></div></footer>';
      return '<section class="source-dossier-aftermath"' + sectionAttributes("aftermath") +
        ' aria-labelledby="sourceDossierAftermathTitle"><header class="source-aftermath-head"><div><span>THE AFTERMATH PACK // THIS UPLOAD CLOCKED IN FOR WORK</span>' +
        '<h3 id="sourceDossierAftermathTitle">WHAT THIS SHOW ADDED.<br>WHAT IT CAN BECOME NEXT.</h3><p>' +
        'One exact tape becomes a source-locked review desk. Every proposed cut stays attached to its receipt, window, risk, evidence, and unfinished human checks.</p></div>' +
        '<aside><b>' + esc(pack.eligibility.status) + '</b><span>PACK ' + esc(pack.fingerprint) +
        '</span><span>' + (!number(metrics.opportunities) ? '0 RECEIPT-BACKED OPPORTUNITIES' :
          handoffReady ? 'LOCAL ROUTING COMPLETE' : esc(counts.unreviewed) + ' UNREVIEWED') +
        '</span></aside></header>' + aftermathAlert + aftermathDeltaMarkup(dossier, pack) +
        '<div class="source-aftermath-inventory"><article><b>' + esc(metrics.opportunities) +
        '</b><span>REVIEW CANDIDATES</span><small>' + esc(inventoryComposition) + '</small></article><article><b>' +
        esc(metrics.clipReady + metrics.fastReview) + '</b><span>CURATED CUTS IN THE FAST LANE</span><small>STILL REQUIRE CONTEXT, SPEAKER, RIGHTS, AND FINAL-EDIT REVIEW</small></article><article><b>' +
        esc(metrics.referenceThreads) + '</b><span>REFERENCE-ONLY LORE THREADS</span><small>NOT COUNTED AS CLIP-READY INVENTORY</small></article><article><b>' +
        esc(metrics.coldOpenStoryboards) + '</b><span>SOURCE-LINKED COLD OPENS</span><small>GENERATED STORYBOARDS // SEPARATE FROM REVIEW ARTIFACTS</small></article></div>' +
        workflowShowcase +
        '<div class="source-aftermath-progress" role="status" aria-live="polite">' + [
          [counts.keep, "KEEP"], [counts.hold, "HOLD"], [counts.reject, "REJECT"],
          [counts.unreviewed, "UNREVIEWED"]
        ].map(function (value) {
          return '<span><b>' + esc(value[0]) + '</b>' + value[1] + '</span>';
        }).join("") + '<strong>' + esc(routingHeadline) + '</strong></div>' +
        (metrics.opportunities ? '<nav class="source-aftermath-filters" aria-label="Filter source opportunities">' + [
          ["all", "ALL " + metrics.opportunities],
          ["cuts", "CUTS " + (metrics.clipReady + metrics.fastReview)],
          ["connected", "CONNECTED " + metrics.archiveExpansion],
          ["research", "RESEARCH " + metrics.researchQueue],
          ["quarantine", "QUARANTINE " + metrics.quarantined]
        ].map(function (filter) {
          var on = state.aftermathFilter === filter[0];
          return '<button type="button" class="' + (on ? 'is-on' : '') +
            '" data-source-dossier-action="aftermath-filter" data-filter="' + filter[0] +
            '" aria-pressed="' + (on ? 'true' : 'false') + '">' + filter[1] + '</button>';
        }).join("") + '</nav><div class="source-aftermath-workbench">' +
          aftermathQueueMarkup(pack, visible) + aftermathDetailMarkup(pack, selected) + '</div>' :
          '<div class="source-aftermath-zero"><b>NO RECEIPT-BACKED CREATOR OPPORTUNITIES YET.</b><p>Metadata and title text are not being converted into fake clips.</p></div>') +
        aftermathSidecarsMarkup(pack) + actionFooter + '</section>';
    }

    function chronologyButton(item, direction) {
      if (!item) {
        return '<article class="is-empty"><span>' + esc(direction.toUpperCase()) +
          ' SOURCE</span><b>EDGE OF THE INDEXED TIMELINE.</b></article>';
      }
      return '<article><span>' + esc(direction.toUpperCase()) + ' SOURCE // ' +
        esc(formatDate(item.date)) + '</span><b>' + esc(item.title) +
        '</b><button type="button" data-source-dossier-action="open-source" data-source-id="' +
        esc(item.sourceId) + '" aria-label="Open ' + esc(direction) + ' source ' +
        esc(item.title) + '">OPEN ' + esc(direction.toUpperCase()) + ' &#8594;</button></article>';
    }

    function warningMarkup(source) {
      var warnings = array(source.warnings);
      if (!warnings.length) return "";
      return '<aside class="source-dossier-warnings" aria-label="Source evidence warnings">' +
        '<span>SOURCE-SPECIFIC EVIDENCE WARNINGS</span><ul>' +
        warnings.map(function (warning) {
          return '<li>' + esc(warning) + '</li>';
        }).join("") + '</ul></aside>';
    }

    function boundaryMarkup(dossier) {
      var proof = dossier.proof;
      return '<section class="source-dossier-boundary" id="sourceDossierBoundary" ' +
        'data-source-dossier-section="boundary" ' +
        'aria-labelledby="sourceDossierBoundaryTitle"><header><span>HOW THIS PAGE STAYS HONEST</span>' +
        '<h3 id="sourceDossierBoundaryTitle">TIMESTAMPS IN. GUESSWORK OUT.</h3></header>' +
        '<p>' + esc(proof.evidenceBoundary) + '</p><ul><li><b>UPLOAD:</b> title, date, runtime, views when indexed, collections, and official URL.</li>' +
        '<li><b>MOMENTS:</b> only timestamps attached to this exact show.</li>' +
        '<li><b>RELATED SHOWS:</b> shared archive evidence never becomes automatic cause or origin.</li>' +
        '<li><b>NOT GUESSED:</b> speaker identity, intent, rights clearance, creator approval, or automatic canon status.</li></ul>' +
        warningMarkup(dossier.source) +
        '<footer><span>SNAPSHOT ' + esc(dossier.bindings.snapshotDate) + '</span><span>DOSSIER ' +
        esc(dossier.fingerprint) + '</span><span>ARCHIVE ' +
        esc(dossier.bindings.archiveFingerprint) + '</span></footer></section>';
    }

    function renderMarkup(dossier) {
      var source = dossier.source;
      var hasEpisodeGuide = !isSourceBrief(dossier) &&
        clean(record(record(source.showWiki).episodeGuide).schema) ===
          "wwam-episode-guide/v2";
      var heroRecap = episodeRecapFor(dossier);
      var heroCanonicalRecap = canonicalEditorialEpisodeRecap(heroRecap);
      var hasWrittenEpisodeStory =
        (humanEditorialEpisodeRecap(heroRecap) ||
          !clean(heroRecap.editorialState)) &&
        episodeRecapStory(dossier).length > 0;
      var deepResearch = askMarkup(dossier) + proofMarkup(dossier) +
        insideMarkup(dossier) + footprintMarkup(dossier) + wakeMarkup(dossier) +
        '<nav class="source-dossier-chronology"' + sectionAttributes("chronology") +
        ' aria-label="Source chronology">' +
        chronologyButton(dossier.chronology.previous, "previous") +
        chronologyButton(dossier.chronology.next, "next") + '</nav>' +
        aftermathMarkup(dossier) + workMarkup(dossier) + boundaryMarkup(dossier);
      var officialAlternate = record(source.officialAlternate);
      var primaryPlay = clean(officialAlternate.enclosureUrl) &&
        officialAlternate.timestampIsomorphic === false ?
        '<a class="source-dossier-alternate-cta" href="#sourceDossierAlternatePlayer">' +
          'OPEN OFFICIAL AUDIO</a>' :
        clean(officialAlternate.enclosureUrl) &&
        officialAlternate.timestampIsomorphic === true ?
        '<button type="button" data-source-dossier-action="play-source">' +
          '&#9654; PLAY OFFICIAL AUDIO HERE</button>' :
        '<button type="button" data-source-dossier-action="play-source">' +
          '&#9654; WATCH THIS SHOW</button>';
      return '<article class="source-dossier is-' + esc(token(source.coverage)) +
        ' is-' + esc(token(source.authority)) + '" data-source-dossier-view="' +
        (state.fullFile ? "full" : "compact") + '" aria-labelledby="sourceDossierTitle" ' +
        (state.fullFile ? 'aria-describedby="sourceDossierBoundary"' : '') +
        '><header class="source-dossier-hero">' +
        '<img src="' + esc(source.thumbnail) + '" alt="' +
        esc((source.displayTitle || source.title) + ' source thumbnail') + '"><div class="source-dossier-hero-shade"></div>' +
        '<div class="source-dossier-hero-copy"><span>WWAM AFTER MIDNIGHT // SHOW WIKI // ' +
        esc(coverageLabel(source.coverage, source.exactSourceHold)) +
        '</span><h2 id="sourceDossierTitle" tabindex="-1">' +
        esc(source.displayTitle || source.title) + '</h2><p>' + esc(formatDate(source.date)) +
        ' // ' + esc(formatDuration(source.duration)) + ' // ' +
        esc(formatNumber(source.views)) + ' VIEWS WHEN INDEXED</p><div>' +
        primaryPlay +
        (hasWrittenEpisodeStory ?
          '<a class="source-dossier-recap-cta" href="#sourceDossierFeldmanStory">' +
          'READ THE EPISODE WIKI &#8595;</a>' : '') +
        (hasEpisodeGuide &&
          (!hasWrittenEpisodeStory || !heroCanonicalRecap) ?
          '<a class="source-dossier-deep-dive-cta" href="#sourceDossierEpisodeGuide">' +
          'OPEN THE DEEP DIVE &#8595;</a>' : '') +
        '<button type="button" data-source-dossier-action="copy-link">COPY PAGE LINK</button>' +
        '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">WATCH ON YOUTUBE &#8599;</a>' +
        '</div></div></header>' + densityMarkup() + exploreMarkup(dossier) +
        playerMarkup(dossier) + showWikiMarkup(dossier) +
        (state.fullFile ? deepResearch :
          '<div class="source-dossier-deep-research" id="sourceDossierDeepResearch" hidden>' +
          deepResearch + '</div>') + '</article>';
    }

    function errorMarkup(error) {
      var message = clean(error && error.message) || "The source dossier could not be verified.";
      return '<section class="source-dossier-error" role="alert"><span>SOURCE DOSSIER HELD</span>' +
        '<h2>THIS SHOW WIKI COULD NOT OPEN.</h2><p>' + esc(message) +
        '</p><small>No metadata, content, relationship, or authority claim was rendered.</small></section>';
    }

    function relatedConnection(sourceId) {
      if (!state.dossier) return null;
      return array(state.dossier.wake.later).concat(array(state.dossier.wake.earlier))
        .filter(function (connection) { return connection.sourceId === sourceId; })[0] || null;
    }

    function chronologyRole(sourceId) {
      if (!state.dossier) return "";
      if (state.dossier.chronology.previous &&
          state.dossier.chronology.previous.sourceId === sourceId) return "previous";
      if (state.dossier.chronology.next &&
          state.dossier.chronology.next.sourceId === sourceId) return "next";
      return "";
    }

    function receiptByKey(key) {
      return state.dossier ? array(state.dossier.source.receipts).filter(function (receipt) {
        return receipt.key === key;
      })[0] || null : null;
    }

    function safeSection(value) {
      var section = clean(value).toLowerCase();
      return Object.prototype.hasOwnProperty.call(SECTION_IDS, section) ? section : "";
    }

    function resetModalScroll() {
      var modal = null;
      if (input.document && typeof input.document.getElementById === "function") {
        modal = input.document.getElementById("tapeModal");
      }
      if (!modal && typeof mount.closest === "function") {
        modal = mount.closest("#tapeModal");
      }
      if (!modal) return;
      modal.scrollTop = 0;
      modal.scrollLeft = 0;
    }

    function renderCurrent() {
      if (state.destroyed || !state.dossier) return;
      var queue = typeof mount.querySelector === "function" ?
        mount.querySelector(".source-aftermath-queue") : null;
      var queueScroll = queue ? { left: number(queue.scrollLeft), top: number(queue.scrollTop) } : null;
      var active = input.document && input.document.activeElement;
      var focusIdentity = null;
      if (active && typeof active.getAttribute === "function" &&
          typeof mount.contains === "function" && mount.contains(active)) {
        focusIdentity = [
          "data-source-dossier-action",
          "data-opportunity-id",
          "data-decision",
          "data-filter",
          "data-receipt-key",
          "data-source-id",
          "data-guide-at",
          "data-guide-end",
          "data-guide-label",
          "data-guide-return"
        ].reduce(function (identity, name) {
          var value = active.getAttribute(name);
          if (value != null) identity[name] = value;
          return identity;
        }, {});
        if (!Object.keys(focusIdentity).length) focusIdentity = null;
      }
      mount.innerHTML = renderMarkup(state.dossier);
      var nextQueue = typeof mount.querySelector === "function" ?
        mount.querySelector(".source-aftermath-queue") : null;
      if (nextQueue && queueScroll) {
        nextQueue.scrollLeft = queueScroll.left;
        nextQueue.scrollTop = queueScroll.top;
      }
      if (focusIdentity && typeof mount.querySelectorAll === "function") {
        var focusAction = focusIdentity["data-source-dossier-action"];
        if (focusAction === "open-full-file" && state.fullFile) {
          focusIdentity["data-source-dossier-action"] = "close-full-file";
        } else if (focusAction === "close-full-file" && !state.fullFile) {
          focusIdentity["data-source-dossier-action"] = "open-full-file";
        }
        var candidates = Array.prototype.slice.call(
          mount.querySelectorAll("[data-source-dossier-action]")
        );
        var focusTarget = candidates.filter(function (candidate) {
          return Object.keys(focusIdentity).every(function (name) {
            return candidate.getAttribute(name) === focusIdentity[name];
          });
        })[0];
        if (focusTarget && typeof focusTarget.focus === "function") {
          try { focusTarget.focus({ preventScroll: true }); } catch { focusTarget.focus(); }
        }
      }
    }

    function focusAsk() {
      var target = typeof mount.querySelector === "function" ?
        mount.querySelector("#sourceDossierQuery") : null;
      if (!target && input.document && typeof input.document.getElementById === "function") {
        target = input.document.getElementById("sourceDossierQuery");
      }
      if (!target) return;
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (typeof target.focus === "function") target.focus();
    }

    function focusSection() {
      if (!state.section || !input.document ||
          typeof input.document.getElementById !== "function") return;
      var sectionTarget = input.document.getElementById(SECTION_IDS[state.section]);
      if (!sectionTarget) return;
      if (state.section === "wiki") {
        state.jumpEpoch += 1;
        var wikiFocusEpoch = state.jumpEpoch;
        // The compact dossier receives its editorial and companion layers
        // immediately after render. Wait for both paint boundaries, then
        // resolve the live Wiki node so that those layers cannot leave the
        // deep link stranded at the tail of the player section.
        scheduleFrame(function () {
          scheduleFrame(function () {
            if (state.destroyed || wikiFocusEpoch !== state.jumpEpoch) return;
            var hydratedTarget = input.document.getElementById(SECTION_IDS.wiki);
            if (!hydratedTarget) return;
            scrollJumpTarget(hydratedTarget, {
              behavior: "auto",
              clearance: 72
            });
          });
        });
        return;
      }
      var focusId = SECTION_FOCUS_IDS[state.section];
      var focusTarget = focusId ? input.document.getElementById(focusId) : null;
      if (!focusTarget && typeof sectionTarget.querySelector === "function") {
        focusTarget = sectionTarget.querySelector("h2,h3,h4");
      }
      if (!focusTarget) focusTarget = sectionTarget;
      if (!focusTarget.hasAttribute("tabindex")) {
        focusTarget.setAttribute("tabindex", "-1");
      }
      if (typeof sectionTarget.scrollIntoView === "function") {
        sectionTarget.scrollIntoView({ behavior: "auto", block: "start" });
      }
      if (typeof focusTarget.focus === "function") {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (error) {
          focusTarget.focus();
        }
      }
    }

    function finishSourceQuery(epoch, rawAnswer, shouldFocus) {
      if (state.destroyed || epoch !== state.queryEpoch || !state.dossier) return null;
      try {
        state.queryAnswer = validateQueryAnswer(rawAnswer, state.dossier);
        state.queryError = "";
        setAttribute("data-source-query-state", state.queryAnswer.status);
      } catch (error) {
        state.queryAnswer = null;
        state.queryError = clean(error && error.message) ||
          "The exact-source answer failed validation.";
        setAttribute("data-source-query-state", "held");
      }
      state.queryBusy = false;
      renderCurrent();
      if (shouldFocus) focusAsk();
      return state.queryAnswer;
    }

    function failSourceQuery(epoch, error, shouldFocus) {
      if (state.destroyed || epoch !== state.queryEpoch) return null;
      state.queryBusy = false;
      state.queryAnswer = null;
      state.queryError = clean(error && error.message) ||
        "The exact-source query engine could not answer.";
      setAttribute("data-source-query-state", "held");
      renderCurrent();
      if (shouldFocus) focusAsk();
      return null;
    }

    function runSourceQuery(query, shouldFocus) {
      var boundedQuery = clean(query).slice(0, 240);
      state.section = "ask";
      state.query = boundedQuery || DEFAULT_SOURCE_QUERY;
      state.queryAnswer = null;
      state.queryError = "";
      state.queryBusy = true;
      state.queryEpoch += 1;
      var epoch = state.queryEpoch;
      renderCurrent();
      setAttribute("data-source-query-state", "loading");
      if (!queryEngine || typeof queryEngine.answer !== "function") {
        return failSourceQuery(
          epoch,
          new Error("The exact-source query engine is unavailable. Archive-wide Ask was not used."),
          shouldFocus
        );
      }
      var request = {
        schema: QUERY_SCHEMA,
        sourceId: state.dossier.source.id,
        sourceFingerprint: state.dossier.source.sourceFingerprint,
        query: state.query,
        limit: QUERY_LIMIT
      };
      if (state.hasAnchor) request.at = state.at;
      try {
        var answer = queryEngine.answer(request);
        if (answer && typeof answer.then === "function") {
          return Promise.resolve(answer).then(function (resolved) {
            return finishSourceQuery(epoch, resolved, shouldFocus);
          }, function (error) {
            return failSourceQuery(epoch, error, shouldFocus);
          });
        }
        return finishSourceQuery(epoch, answer, shouldFocus);
      } catch (error) {
        return failSourceQuery(epoch, error, shouldFocus);
      }
    }

    function dossierModal() {
      var modal = null;
      if (input.document && typeof input.document.getElementById === "function") {
        modal = input.document.getElementById("tapeModal");
      }
      if (!modal && typeof mount.closest === "function") {
        modal = mount.closest("#tapeModal");
      }
      return modal;
    }

    function focusJumpTarget(target) {
      var audioTarget = typeof target.querySelector === "function" ?
        target.querySelector("audio[controls]") : null;
      var focusTarget = audioTarget || (typeof target.querySelector === "function" ?
        target.querySelector("h2,h3,h4,h5") : null);
      if (!focusTarget) focusTarget = target;
      if (!audioTarget && focusTarget && typeof focusTarget.setAttribute === "function" &&
          typeof focusTarget.hasAttribute === "function" &&
          !focusTarget.hasAttribute("tabindex")) {
        focusTarget.setAttribute("tabindex", "-1");
      }
      if (focusTarget && typeof focusTarget.focus === "function") {
        try { focusTarget.focus({ preventScroll: true }); } catch { focusTarget.focus(); }
      }
    }

    function scrollJumpTarget(target, scrollOptions) {
      var settings = scrollOptions || {};
      var behavior = settings.behavior === "auto" ? "auto" : "smooth";
      var requestedClearance = Number(settings.clearance);
      var stickyClearance = Number.isFinite(requestedClearance) ?
        Math.max(0, requestedClearance) : 88;
      var modal = dossierModal();
      var localNav = null;
      if (typeof mount.querySelector === "function") {
        // The compact editorial shortcut bar is the visible sticky header.
        // The full-file research nav remains the fallback for older routes.
        localNav = mount.querySelector(".source-dossier-explore") ||
          mount.querySelector(".source-dossier-wiki-local-nav");
      }
      if (localNav && typeof localNav.getBoundingClientRect === "function") {
        var localNavRect = localNav.getBoundingClientRect();
        var modalTop = modal && typeof modal.getBoundingClientRect === "function" ?
          number(modal.getBoundingClientRect().top) : number(localNavRect.top);
        var localNavClearance = number(localNavRect.bottom) - modalTop;
        if (localNavClearance <= 0) {
          localNavClearance = number(localNavRect.height);
        }
        if (localNavClearance) {
          stickyClearance = Math.max(
            stickyClearance,
            Math.ceil(localNavClearance) + 24
          );
        }
      }
      if (modal && typeof modal.scrollTo === "function" &&
          typeof modal.getBoundingClientRect === "function" &&
          typeof target.getBoundingClientRect === "function") {
        var modalRect = modal.getBoundingClientRect();
        var targetRect = target.getBoundingClientRect();
        var desiredTop = number(modal.scrollTop) + number(targetRect.top) -
          number(modalRect.top) - stickyClearance;
        modal.scrollTo({
          top: Math.max(0, desiredTop),
          left: 0,
          behavior: behavior
        });
      } else if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: behavior, block: "start" });
      }
      focusJumpTarget(target);
    }

    function queueJumpAfterReflow(targetId) {
      state.jumpEpoch += 1;
      var epoch = state.jumpEpoch;
      // Full-file expansion and the companion mount both change everything
      // above the target. Resolve the node again after two paint boundaries so
      // a stale compact node can never receive the scroll.
      scheduleFrame(function () {
        scheduleFrame(function () {
          if (state.destroyed || epoch !== state.jumpEpoch) return;
          var target = typeof mount.querySelector === "function" ?
            mount.querySelector("#" + targetId) : null;
          if (!target) return;
          scrollJumpTarget(target, { behavior: "auto", clearance: 88 });
        });
      });
    }

    function jumpWithinDossier(event) {
      var link = event.target && event.target.closest ?
        event.target.closest('a[href^="#sourceDossier"]') : null;
      if (!link || typeof mount.querySelector !== "function") return false;
      var href = clean(link.getAttribute("href"));
      var targetId = href.slice(1);
      if (!/^sourceDossier[A-Za-z0-9_-]+$/.test(targetId)) return false;
      var recapDamageDestination = /^sourceDossierFeldmanDamage-[A-Za-z0-9_-]+$/
        .test(targetId);
      if (recapDamageDestination && !state.fullFile && !state.recapExpanded) {
        state.recapExpanded = true;
        renderCurrent();
      }
      var target = mount.querySelector("#" + targetId);
      var hiddenResearch = target && typeof target.closest === "function" ?
        target.closest("#sourceDossierDeepResearch[hidden]") : null;
      var fullFileDestination =
        [SECTION_IDS.ask, SECTION_IDS.aftermath, SECTION_IDS.inside].indexOf(targetId) >= 0 ||
        targetId === "sourceDossierEpisodeGuide" ||
        targetId === "sourceDossierShowWikiExperience" ||
        targetId === "sourceDossierFanRead" ||
        /^sourceDossierShowWikiLane-/.test(targetId);
      if (fullFileDestination && !state.fullFile && (!target || hiddenResearch)) {
        state.fullFile = true;
        renderCurrent();
      }
      if (typeof event.preventDefault === "function") event.preventDefault();
      queueJumpAfterReflow(targetId);
      return true;
    }

    function showWikiFamLane(dossier) {
      return array(record(dossier && dossier.source &&
        dossier.source.showWiki).lanes).map(record).find(function (lane) {
        return isShowWikiFamLane(lane);
      }) || null;
    }

    function showWikiFamCalloutMeta(dossier, receipt) {
      var index = root.WWAM_FAM_INDEX;
      var sourceId = clean(dossier && dossier.source && dossier.source.id);
      var show = index && index.shows && index.shows[sourceId];
      return array(show && show.callouts).map(record).find(function (callout) {
        return clean(callout.id) === clean(receipt && receipt.key);
      }) || {};
    }

    function showWikiFamMarkup(dossier) {
      var lane = showWikiFamLane(dossier);
      var receipts = lane ? showWikiLaneReceipts(dossier, lane) : [];
      var sourceBrief = isSourceBrief(dossier);
      var index = root.WWAM_FAM_INDEX;
      var policy = record(index && index.evidencePolicy);
      var count = receipts.length;
      var cards = receipts.map(function (receipt) {
        var meta = showWikiFamCalloutMeta(dossier, receipt);
        var excerptText = cleanCaptionExcerpt(receipt.excerpt);
        var type = clean(meta.interactionType) || "CHAT READOUT";
        return '<article class="source-dossier-fam-card" data-fam-id="' +
          esc(clean(meta.fanId) || token(receipt.label)) + '"><header><div><span>' +
          esc(type) + '</span><h5>' + esc(receipt.label) +
          '</h5></div><time>' + esc(formatTime(receipt.at)) + '</time></header>' +
          (excerptText ? '<p>&ldquo;' + esc(excerptText) + '&rdquo;</p>' :
            '<p class="is-withheld">The name readout is indexed at this timestamp; the caption fragment is not clean enough to print.</p>') +
          '<div class="source-dossier-fam-proof"><span>AUTO-CAPTION NAME READOUT</span>' +
          '<span>PUBLIC NAME / HANDLE</span><span>SPEAKER NOT CONFIRMED</span></div>' +
          '<button type="button" data-source-dossier-action="play-receipt" ' +
          'data-receipt-key="' + esc(receipt.key) + '" aria-label="Play the ' +
          esc(receipt.label) + ' fan callout at ' + esc(formatTime(receipt.at)) +
          '">&#9654; PLAY THE ROOM READ AT ' + esc(formatTime(receipt.at)) +
          '</button></article>';
      }).join("");
      var emptyCopy = sourceBrief ?
        "This upload does not have a usable source-caption map, so no fan name is being guessed from its title or thumbnail." :
        "No conservative public-name interaction readout is published for this tape yet. That means the FAM pass is empty—not that the room was.";
      return '<section class="source-dossier-fam" id="sourceDossierWwamFam" ' +
        'data-source-dossier-fam-state="' + (count ? "ready" : "empty") +
        '"><header><div><span>THE FAM WAS IN THE BUILDING</span><h4>' +
        (count ? "THE LIVE ROOM LEFT FINGERPRINTS." :
          "THE ROOM LEDGER IS HONESTLY EMPTY.") +
        '</h4></div><p>' + (count ?
          esc(count) + ' source-linked ' + (count === 1 ? "readout" : "readouts") +
            ' from this show. Play the moment; do not confuse an observed caption name with an authenticated private identity.' :
          esc(emptyCopy)) + '</p></header>' +
        (cards ? '<div class="source-dossier-fam-grid">' + cards + '</div>' :
          '<div class="source-dossier-fam-empty"><b>NO INVENTED FANS.</b><span>' +
          esc(emptyCopy) + '</span></div>') +
        '<footer><span>' + esc(clean(policy.rankingUnit) ||
          "Distinct shows with a conservative exact-name interaction readout") +
          '</span><a href="./#fam-hall">OPEN THE WWAM FAM HALL OF FAME &#8599;</a></footer>' +
        '</section>';
    }


    function handleClick(event) {
      if (jumpWithinDossier(event)) return;
      var button = event.target && event.target.closest ?
        event.target.closest("[data-source-dossier-action]") : null;
      if (!button || !state.dossier || state.destroyed) return;
      if (typeof event.preventDefault === "function") event.preventDefault();
      var action = button.getAttribute("data-source-dossier-action");
      var source = state.dossier.source;
      var sectionOwner = typeof button.closest === "function" ?
        button.closest("[data-source-dossier-section]") : null;
      var ownerSection = safeSection(
        sectionOwner && sectionOwner.getAttribute("data-source-dossier-section")
      );
      if (ownerSection) state.section = ownerSection;
      var payload = {
        sourceId: source.id,
        dossier: state.dossier,
        section: state.section,
        query: state.query
      };
      function playTimelineAudio(at, end) {
        var audio = typeof mount.querySelector === "function" ?
          mount.querySelector("[data-source-dossier-timeline-audio]") : null;
        if (!audio) return false;
        var start = Math.max(0, number(at));
        var stop = number(end) > start ? number(end) : 0;
        var begin = function () {
          try { audio.currentTime = start; } catch {}
          var attempt = typeof audio.play === "function" ? audio.play() : null;
          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(function () {});
          }
        };
        if (stop && typeof audio.addEventListener === "function") {
          audio.addEventListener("timeupdate", function haltAtBound() {
            if (number(audio.currentTime) < stop) return;
            if (typeof audio.pause === "function") audio.pause();
            audio.removeEventListener("timeupdate", haltAtBound);
          });
        }
        if (number(audio.readyState) >= 1) {
          begin();
        } else if (typeof audio.addEventListener === "function") {
          audio.addEventListener("loadedmetadata", begin, { once: true });
        }
        if (typeof audio.scrollIntoView === "function") {
          audio.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return true;
      }
      function playAlternateAudio(at, end) {
        var audio = typeof mount.querySelector === "function" ?
          mount.querySelector("[data-source-dossier-alternate-audio]") : null;
        if (!audio) return false;
        var start = Math.max(0, number(at));
        var stop = number(end) > start ? number(end) : 0;
        var begin = function () {
          try { audio.currentTime = start; } catch {}
          var attempt = typeof audio.play === "function" ? audio.play() : null;
          if (attempt && typeof attempt.catch === "function") attempt.catch(function () {});
        };
        if (stop && typeof audio.addEventListener === "function") {
          audio.addEventListener("timeupdate", function haltAtBound() {
            if (number(audio.currentTime) < stop) return;
            if (typeof audio.pause === "function") audio.pause();
            audio.removeEventListener("timeupdate", haltAtBound);
          });
        }
        if (number(audio.readyState) >= 1) begin();
        else if (typeof audio.addEventListener === "function") {
          audio.addEventListener("loadedmetadata", begin, { once: true });
        }
        if (typeof audio.scrollIntoView === "function") {
          audio.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return true;
      }
      function markLocalPlayback(meta) {
        // Local source audio still needs a URL receipt. Without this signal
        // the modal has no child-state marker, so closing after a clip can
        // mistake the episode for a top-level Show Wiki and back out to the
        // shelf. The app bridge records the route only; it does not replace
        // the verified local player with YouTube.
        callbacks.play(Object.assign(payload, meta, { localOnly: true }));
      }
      if (action === "play-source") {
        state.activeReceiptKey = "";
        state.activeReceiptOrigin = "";
        state.activePlayback = null;
        renderCurrent();
        if (!playTimelineAudio(state.at, null)) callbacks.play(Object.assign(payload, {
          mode: "source",
          at: state.at,
          end: null,
          receipt: null
        }));
        else markLocalPlayback({ mode: "source-local", at: state.at, end: null, receipt: null });
      } else if (action === "play-alternate-route") {
        playAlternateAudio(
          Number(button.getAttribute("data-alternate-at")),
          Number(button.getAttribute("data-alternate-end"))
        );
      } else if (action === "play-guide-cut") {
        var guideAt = Number(button.getAttribute("data-guide-at"));
        var guideEnd = Number(button.getAttribute("data-guide-end"));
        if (Number.isFinite(guideAt) && guideAt >= 0 && guideAt <= number(source.duration)) {
          state.activeReceiptKey = "";
          state.activeReceiptOrigin = ownerSection || "wiki";
          state.activePlayback = {
            mode: "episode-guide",
            at: guideAt,
            end: Number.isFinite(guideEnd) && guideEnd > guideAt ? guideEnd : 0,
            label: clean(button.getAttribute("data-guide-label")) ||
              "EPISODE GUIDE CUT",
            returnId: clean(button.getAttribute("data-guide-return")) ||
              SECTION_IDS[ownerSection || "wiki"] || "sourceDossierShowWikiSummary",
            returnLabel: clean(button.getAttribute("data-guide-return-label")) ||
              (ownerSection === "ask" ? "ASK THIS SHOW" : "EPISODE RECAP")
          };
          state.at = guideAt;
          state.hasAnchor = true;
          renderCurrent();
          if (!playTimelineAudio(guideAt, guideEnd)) callbacks.play(Object.assign(payload, {
            mode: "episode-guide",
            at: guideAt,
            end: Number.isFinite(guideEnd) && guideEnd > guideAt ? guideEnd : null,
            receipt: null
          }));
          else markLocalPlayback({
            mode: "episode-guide-local",
            at: guideAt,
            end: Number.isFinite(guideEnd) && guideEnd > guideAt ? guideEnd : null,
            receipt: null
          });
        }
      } else if (action === "play-receipt") {
        var playReceipt = receiptByKey(button.getAttribute("data-receipt-key"));
        if (playReceipt) {
          state.activeReceiptKey = playReceipt.key;
          state.activePlayback = null;
          if (ownerSection && ownerSection !== "player") {
            state.activeReceiptOrigin = ownerSection;
          }
          state.at = playReceipt.at;
          state.hasAnchor = true;
          renderCurrent();
          if (!playTimelineAudio(playReceipt.at, playReceipt.end)) callbacks.play(Object.assign(payload, {
            mode: "receipt",
            at: playReceipt.at,
            end: playReceipt.end,
            receipt: playReceipt
          }));
          else markLocalPlayback({
            mode: "receipt-local",
            at: playReceipt.at,
            end: playReceipt.end,
            receipt: playReceipt
          });
        }
      } else if (action === "bag-receipt") {
        var bagReceipt = receiptByKey(button.getAttribute("data-receipt-key"));
        if (bagReceipt) callbacks.bag(Object.assign(payload, { receipt: bagReceipt }));
      } else if (action === "bag-experience") {
        var experience = record(record(source.showWiki).experience);
        showWikiExperienceReceipts(state.dossier, experience.routeReceiptKeys)
          .forEach(function (receipt) {
            callbacks.bag(Object.assign({}, payload, { receipt: receipt }));
          });
      } else if (action === "copy-link") {
        callbacks.copy(Object.assign(payload, { at: state.at }));
      } else if (action === "download") {
        var manifest = typeof engine.exportManifest === "function" ?
          engine.exportManifest(source.id) : null;
        callbacks.download(Object.assign(payload, {
          manifest: manifest,
          filename: "source-dossier-" + source.id + ".json"
        }));
      } else if (action === "stage-intake") {
        callbacks.stageIntake(payload);
      } else if (action === "aftermath-select") {
        var selectedOpportunityId = clean(button.getAttribute("data-opportunity-id"));
        if (state.aftermathPack && array(state.aftermathPack.opportunities).some(function (item) {
          return item.id === selectedOpportunityId;
        })) {
          state.aftermathSelected = selectedOpportunityId;
          renderCurrent();
        }
      } else if (action === "aftermath-filter") {
        var aftermathFilter = clean(button.getAttribute("data-filter"));
        if (["all", "cuts", "connected", "research", "quarantine"].indexOf(aftermathFilter) >= 0) {
          state.aftermathFilter = aftermathFilter;
          renderCurrent();
        }
      } else if (action === "aftermath-decision") {
        var decisionOpportunityId = clean(button.getAttribute("data-opportunity-id"));
        var decisionStatus = clean(button.getAttribute("data-decision"));
        var noteField = typeof mount.querySelector === "function" ?
          mount.querySelector("#sourceDossierAftermathNote") : null;
        var decisions = state.aftermathReview ? array(state.aftermathReview.decisions).filter(function (decision) {
          return decision.opportunityId !== decisionOpportunityId;
        }).map(function (decision) {
          return { opportunityId: decision.opportunityId, status: decision.status, note: decision.note };
        }) : [];
        decisions.push({
          opportunityId: decisionOpportunityId,
          status: decisionStatus,
          note: clean(noteField && noteField.value).slice(0, 240)
        });
        try {
          state.aftermathReview = aftermathEngine.createReview(source.id, decisions);
          state.aftermathError = "";
          callbacks.aftermathDecision(Object.assign(payload, {
            pack: state.aftermathPack,
            review: state.aftermathReview,
            opportunityId: decisionOpportunityId,
            decision: decisionStatus
          }));
          renderCurrent();
          var decisionButton = typeof mount.querySelector === "function" ?
            mount.querySelector('[data-source-dossier-action="aftermath-decision"][data-decision="' +
              decisionStatus + '"]') : null;
          if (decisionButton && typeof decisionButton.focus === "function") decisionButton.focus();
        } catch (decisionError) {
          state.aftermathError = clean(decisionError && decisionError.message) ||
            "The local routing decision failed its proof check.";
          renderCurrent();
        }
      } else if (action === "aftermath-export" || action === "aftermath-copy") {
        try {
          var packet = aftermathEngine.exportPacket(source.id, state.aftermathReview);
          if (action === "aftermath-export") {
            callbacks.aftermathExport(Object.assign(payload, {
              pack: state.aftermathPack, review: state.aftermathReview, packet: packet
            }));
          } else {
            callbacks.aftermathCopy(Object.assign(payload, {
              pack: state.aftermathPack, review: state.aftermathReview, packet: packet,
              markdown: aftermathEngine.exportMarkdown(packet)
            }));
          }
        } catch (packetError) {
          state.aftermathError = clean(packetError && packetError.message) ||
            "The editor packet failed its proof check.";
          renderCurrent();
        }
      } else if (action === "open-clip-lab") {
        callbacks.openClipLab(Object.assign(payload, {
          pack: state.aftermathPack,
          mode: clean(button.getAttribute("data-clip-mode")) || "shorts"
        }));
      } else if (action === "ask-source") {
        runSourceQuery(state.query || DEFAULT_SOURCE_QUERY, true);
      } else if (action === "query-prompt") {
        runSourceQuery(button.getAttribute("data-query"), false);
      } else if (action === "toggle-section") {
        var section = safeSection(button.getAttribute("data-section"));
        if (EXPANDABLE_SECTIONS.indexOf(section) >= 0) {
          state.section = section;
          state.expanded[section] = !sectionExpanded(section);
          renderCurrent();
        }
      } else if (action === "open-full-file") {
        state.fullFile = true;
        renderCurrent();
      } else if (action === "toggle-episode-recap") {
        state.recapExpanded = !state.recapExpanded;
        renderCurrent();
        if (!state.recapExpanded) queueJumpAfterReflow("sourceDossierShowWikiSummary");
      } else if (action === "close-full-file") {
        state.fullFile = false;
        state.expanded = {};
        renderCurrent();
      } else if (action === "open-companion") {
        callbacks.companion(Object.assign(payload, { at: state.at }));
      } else if (action === "open-source") {
        var relatedId = clean(button.getAttribute("data-source-id"));
        var relatedAt = button.getAttribute("data-source-at");
        if (relatedId) callbacks.open(Object.assign(payload, {
          targetSourceId: relatedId,
          targetAt: relatedAt != null && Number.isFinite(Number(relatedAt)) ? Number(relatedAt) : null,
          connection: relatedConnection(relatedId),
          chronology: chronologyRole(relatedId)
        }));
      }
    }

    function handleSubmit(event) {
      var form = event.target;
      if (!form || typeof form.matches !== "function" ||
          !form.matches("[data-source-dossier-query-form]") ||
          !state.dossier || state.destroyed) return;
      if (typeof event.preventDefault === "function") event.preventDefault();
      var field = form.elements && form.elements.query;
      runSourceQuery(field ? field.value : state.query, false);
    }

    function render(sourceId, renderOptions) {
      if (state.destroyed) throw new Error("Source Dossier UI has been destroyed.");
      var settings = renderOptions || {};
      setAttribute("aria-busy", "true");
      setAttribute("data-source-dossier-state", "loading");
      state.sourceId = clean(sourceId);
      state.hasAnchor = settings.at != null && settings.at !== "" &&
        Number.isFinite(Number(settings.at));
      state.at = state.hasAnchor ? Math.max(0, Number(settings.at)) : 0;
      state.section = safeSection(settings.section);
      state.fullFile = settings.fullFile === true || settings.full === true ||
        Boolean(state.section && ["player", "wiki"].indexOf(state.section) < 0) ||
        Boolean(clean(settings.query));
      state.recapExpanded = false;
      state.expanded = {};
      var deepSection = safeSection(settings.deepSection || settings.section);
      if (EXPANDABLE_SECTIONS.indexOf(deepSection) >= 0) {
        state.expanded[deepSection] = true;
      }
      state.query = clean(settings.query).slice(0, 240) || DEFAULT_SOURCE_QUERY;
      state.activeReceiptKey = "";
      state.activeReceiptOrigin = "";
      state.activePlayback = null;
      state.queryAnswer = null;
      state.queryBusy = false;
      state.queryError = "";
      state.queryEpoch += 1;
      state.aftermathPack = null;
      state.aftermathReview = null;
      state.aftermathSelected = "";
      state.aftermathFilter = "all";
      state.aftermathError = "";
      try {
        var dossier = engine.build(state.sourceId);
        if (!validateDossier(dossier)) {
          throw new Error("Source Dossier engine returned an incompatible dossier.");
        }
        state.dossier = dossier;
        if (aftermathEngine && typeof aftermathEngine.build === "function") {
          try {
            var aftermathPack = aftermathEngine.build(state.sourceId);
            if (!aftermathPack || aftermathPack.schema !== "shokker.aftermath-pack/v1" ||
                aftermathPack.source.id !== dossier.source.id ||
                aftermathPack.bindings.dossierFingerprint !== dossier.fingerprint ||
                aftermathPack.bindings.sourceFingerprint !== dossier.source.sourceFingerprint) {
              throw new Error("Aftermath Pack failed its exact-source binding check.");
            }
            state.aftermathPack = aftermathPack;
            var restoredReview = callbacks.loadAftermath(aftermathPack);
            if (restoredReview && restoredReview.aftermathRestoreHeld) {
              state.aftermathError = clean(restoredReview.notice) ||
                "A saved local review was held because its source proof changed.";
              restoredReview = restoredReview.review || null;
            }
            state.aftermathReview = restoredReview ?
              aftermathEngine.restoreReview(state.sourceId, restoredReview) :
              aftermathEngine.createReview(state.sourceId, []);
            state.aftermathSelected = aftermathPack.opportunities.length ?
              aftermathPack.opportunities[0].id : "";
          } catch (aftermathError) {
            state.aftermathPack = null;
            state.aftermathReview = null;
            state.aftermathError = clean(aftermathError && aftermathError.message) ||
              "The exact-source creator inventory failed closed.";
          }
        } else {
          state.aftermathError = "The Aftermath Pack engine is unavailable.";
        }
        if (state.hasAnchor) {
          var anchoredReceipt = array(dossier.source.receipts).filter(function (receipt) {
            return Math.abs(Number(receipt.at) - state.at) < 0.5;
          })[0] || null;
          state.activeReceiptKey = anchoredReceipt ? anchoredReceipt.key : "";
        }
        mount.innerHTML = renderMarkup(dossier);
        resetModalScroll();
        setAttribute("aria-busy", "false");
        setAttribute("data-source-dossier-state", "ready");
        setAttribute("data-source-dossier-id", dossier.source.id);
        if (clean(settings.query)) runSourceQuery(state.query, false);
        focusSection();
        return dossier;
      } catch (error) {
        state.dossier = null;
        mount.innerHTML = errorMarkup(error);
        setAttribute("aria-busy", "false");
        setAttribute("data-source-dossier-state", "failed");
        return null;
      }
    }

    function destroy() {
      if (state.destroyed) return;
      state.destroyed = true;
      state.jumpEpoch += 1;
      state.dossier = null;
      state.aftermathPack = null;
      state.aftermathReview = null;
      state.queryEpoch += 1;
      mount.removeEventListener("click", handleClick);
      mount.removeEventListener("submit", handleSubmit);
      mount.innerHTML = "";
      if (typeof mount.removeAttribute === "function") {
        mount.removeAttribute("data-source-dossier-id");
        mount.removeAttribute("data-source-dossier-state");
        mount.removeAttribute("data-source-query-state");
        mount.removeAttribute("aria-busy");
      }
    }

    mount.addEventListener("click", handleClick);
    mount.addEventListener("submit", handleSubmit);

    return Object.freeze({
      version: VERSION,
      render: render,
      destroy: destroy
    });
  }

  root.WWAMSourceDossierUI = Object.freeze({
    VERSION: VERSION,
    create: create
  });
})(typeof window !== "undefined" ? window : globalThis);
