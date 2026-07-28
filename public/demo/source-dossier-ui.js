(function (root) {
  "use strict";

  var VERSION = "1.8.1";
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
    "receipt", "metadata", "entity", "artifact", "connection"
  ]);
  var DEFAULT_SOURCE_QUERY = "What is actually indexed in this tape?";

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function cleanCaptionExcerpt(value) {
    return clean(value).replace(/^(?:>>\s*)+/, "").trim();
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

  function coverageLabel(value) {
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
      "registered-source-entity": "DUAL-ENDED REGISTERED ENTITY",
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
      expanded: {},
      query: DEFAULT_SOURCE_QUERY,
      queryAnswer: null,
      queryBusy: false,
      queryError: "",
      queryEpoch: 0,
      activeReceiptKey: "",
      activeReceiptOrigin: "",
      aftermathPack: null,
      aftermathReview: null,
      aftermathSelected: "",
      aftermathFilter: "all",
      aftermathError: "",
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
          return {
            type: "receipt",
            key: canonical.key,
            receipt: canonical,
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
        '<article><span>CAPTION COVERAGE</span><b>' + esc(coverageLabel(source.coverage)) + '</b></article>' +
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
      if (!receipt) return "";
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
      var returnId = lane ? showWikiLaneId(lane, laneIndex) :
        "sourceDossierShowWikiExperience";
      var excerptText = cleanCaptionExcerpt(receipt.excerpt);
      var excerpt = receipt.publicExcerptAllowed && excerptText
        ? '<p>&ldquo;' + esc(excerptText) + '&rdquo;</p>'
        : '<p class="is-withheld">The timestamp is saved, but this excerpt is not shown publicly.</p>';
      return '<aside class="source-dossier-now-playing" id="sourceDossierNowPlaying" ' +
        'data-now-playing-receipt="' + esc(receipt.key) + '"><header><div><span>NOW PLAYING</span><b>' +
        esc(receipt.label) + '</b></div><time>' + esc(formatTime(receipt.at)) +
        (receipt.end > receipt.at ? '—' + esc(formatTime(receipt.end)) : '') +
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
      return '<section class="source-dossier-player-section"' + sectionAttributes("player") +
        ' aria-labelledby="sourceDossierPlayerTitle">' +
        '<header><div><span>WATCH THE SHOW</span><h3 id="sourceDossierPlayerTitle">THE WHOLE UPLOAD, RIGHT HERE.</h3></div>' +
        '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">WATCH ON YOUTUBE &#8599;</a></header>' +
        '<div class="modal-player source-dossier-player" id="modalPlayer" data-source-dossier-player aria-live="polite">' +
        '<div><span>THE PLAYER LOADS WHEN YOU PRESS PLAY.</span>' +
        '<button type="button" data-source-dossier-action="play-source" aria-label="Play ' +
        esc(source.displayTitle || source.title) + ' inside this page">&#9654; WATCH THIS SHOW</button>' +
        '<small>Official YouTube player. If embedding is blocked, the YouTube link stays available.</small></div></div>' +
        nowPlayingReceiptMarkup(dossier) + '</section>';
    }

    function publicReceiptEvidenceLabel(receipt) {
      var evidence = token(clean(receipt.evidenceType) + " " + clean(receipt.evidenceLevel));
      return evidence.indexOf("caption") >= 0 ?
        "CAPTION-BACKED TIMESTAMP" : "REGISTERED TIMESTAMP";
    }

    function publicReceiptReviewLabel(receipt) {
      var review = token(receipt.reviewState);
      return review.indexOf("human") >= 0 || review.indexOf("editor") >= 0 ?
        "EDITOR REVIEWED" : "TIMESTAMP REGISTERED";
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
        return "A short set of standout jumps from this show.";
      }
      if (id === "up-in-ya") {
        return "The out-of-pocket turns saved from this show, ready to play.";
      }
      if (id === "straight-to-steves-asshole" ||
          (id.indexOf("steve") >= 0 && id.indexOf("asshole") >= 0)) {
        return "The strongest negative takes saved from this show.";
      }
      if (id === "topics") {
        return "Jump straight to the subjects covered in this upload.";
      }
      if (id === "funny-moments") {
        return "Comedy turns saved from this upload, with the original timestamps.";
      }
      if (id === "character-bits") {
        return "Recurring characters and bits saved from this upload.";
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

    function showWikiLocalNavMarkup(dossier) {
      var wiki = record(dossier.source.showWiki);
      var lanes = array(wiki.lanes).map(record);
      var experience = record(wiki.experience);
      var links = [];
      var sourceBrief = isSourceBrief(dossier);
      if (sourceBrief || clean(record(wiki.recap).overview) || dossier.source.summary) {
        links.push({
          id: "sourceDossierShowWikiSummary",
          label: sourceBrief ? "SOURCE BRIEF" : "RECAP"
        });
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
          if (!showWikiLaneReceipts(dossier, lane).length) return;
          links.push({ id: showWikiLaneId(lane, index), label: clean(lane.label) });
        });
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
      var links = [
        { id: SECTION_IDS.player, label: "WATCH THE SHOW" }
      ];
      if (!sourceBrief && clean(record(wiki.episodeGuide).schema)) {
        links.push({ id: "sourceDossierEpisodeGuide", label: "DEEP DIVE" });
      }
      links.push({
        id: "sourceDossierShowWikiSummary",
        label: sourceBrief ? "SOURCE BRIEF" : "SHOW SUMMARY"
      });
      if (!compact && !sourceBrief &&
          showWikiExperienceReceipts(dossier, experience.routeReceiptKeys).length) {
        links.push({ id: "sourceDossierShowWikiExperience", label: clean(experience.title) });
      }
      links = links.concat((sourceBrief ? [] : lanes).filter(function (lane) {
        return !compact || isShowWikiHighlightLane(lane);
      }).map(function (lane) {
        return {
          id: showWikiLaneId(lane, lanes.indexOf(lane)),
          label: clean(lane.label),
          populated: showWikiLaneReceipts(dossier, lane).length > 0
        };
      }).filter(function (link) {
        return link.label && link.populated;
      }));
      if (!compact) links = links.concat([
        {
          id: SECTION_IDS.ask,
          label: sourceBrief ? "ASK SOURCE FACTS" : "ASK THIS TAPE"
        },
        { id: SECTION_IDS.aftermath, label: "AFTERMATH PACK" },
        { id: SECTION_IDS.inside, label: "ALL TIMESTAMPS" }
      ]);
      return '<nav class="source-dossier-explore" aria-label="Explore this show">' +
        '<span>' + (compact ? "SHOW HIGHLIGHTS" : "GO STRAIGHT TO") +
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

    function showWikiExperienceMarkup(dossier) {
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
      var routeMarkup = route.map(function (receipt, index) {
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
        '</h4></div><b>' + esc(route.length) + ' MOMENTS. NO HUNTING.</b></header><p>' +
        'A playable route through saved moments from this exact upload, spaced across the runtime.</p><div class="source-dossier-wiki-pulse" ' +
        'aria-label="Where the saved moments land in this show"><div class="source-dossier-wiki-pulse-track" style="--pulse-extra-height:' +
        esc(maximumPulseRow * 48) + 'px">' +
        pulseMarkup + '</div><footer><span>00:00</span><b>THE NIGHT’S PULSE</b><span>' +
        esc(formatTime(source.duration)) + '</span></footer></div><div class="source-dossier-wiki-route">' +
        routeMarkup + '</div><footer class="source-dossier-wiki-route-actions"><button type="button" ' +
        'data-source-dossier-action="play-receipt" data-receipt-key="' +
        esc(route[0].key) + '">&#9654; START THE WATCH PATH</button><button type="button" ' +
        'data-source-dossier-action="bag-experience">SAVE ALL ' + esc(route.length) +
        ' MOMENTS</button><details class="source-dossier-wiki-method"><summary>HOW THIS WATCH PATH WAS PICKED</summary><small>' +
        'Built only from saved timestamps on this exact upload. Speaker identity, intent, and creator approval are not inferred.' +
        '</small></details></footer></section>';
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
        ["CAPTION COVERAGE", coverageLabel(source.coverage)],
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
            esc(fact[1] || "NOT REGISTERED") + '</b></span>';
        }).join("") + '</div><footer><small>WHY THIS PAGE IS LIMITED // VERIFIED UPLOAD DETAILS ONLY</small><button type="button" ' +
        'data-source-dossier-action="stage-intake">QUEUE THE DEEP DIVE &#8594;</button><a href="' +
        esc(source.url) + '" target="_blank" rel="noopener">WATCH ON YOUTUBE &#8599;</a>' +
        '</footer></article>';
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
          'Based on the registered source type and timestamped material from this upload.</small></details>') +
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
          'aria-label="' + esc(label + " at " + formatTime(at)) + '">&#9654; ' +
          esc(formatTime(at)) + '</button>';
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
        '<b>SIX STOPS ACROSS THE FULL RUNTIME</b></header><div>' + chapterMarkup + '</div></section>' +
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
      return '<section class="source-dossier-wiki-empty-lanes" aria-label="Show Wiki categories without registered moments">' +
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
      var status = clean(wiki.status) ||
        (receiptCount ? "SOURCE DISTILLED" : "QUEUED // NOT DISTILLED");
      var label = clean(wiki.label) || "SHOW WIKI";
      var description = clean(wiki.description);
      var queued = token(status).indexOf("queued") === 0;
      var experience = record(wiki.experience);
      var hasMappedContent = Boolean(record(wiki.recap).overview || source.summary ||
        array(experience.routeReceiptKeys).length || lanes.some(function (lane) {
          return showWikiLaneReceipts(dossier, lane).length;
        }));
      var populated = [];
      var empty = [];
      lanes.forEach(function (lane, index) {
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
      var visibleEntries = compact ? highlightEntries : populated;
      var visibleMomentCount = visibleEntries.reduce(function (total, entry) {
        return total + Math.min(
          showWikiLaneReceipts(dossier, entry.lane).length,
          compact ? COMPACT_SHOW_WIKI_RECEIPTS : Number.MAX_SAFE_INTEGER
        );
      }, 0);
      var headerTitle = sourceBrief ? "THE SHOW IS HERE. THE DEEP DIVE IS NOT READY YET." :
        status === "topic-nav-only" ? "WHAT THEY COVERED, WITH A WAY BACK TO EACH PART." :
          hasMappedContent ? "THE WHOLE NIGHT, CUT TO THE PARTS WORTH REVISITING." :
            "THE SHOW IS HERE. THE MOMENT MAP IS COMING.";
      var headerDescription = sourceBrief ?
        "The official upload is linked and verified. A recap will appear only after this exact show has usable captions." :
        queued ? "The upload is ready to watch. Its recap and moments wait for captions from this exact show." :
          "A recap, watch path, and timestamped moments from this exact upload.";
      var statusLabel = sourceBrief ?
        "DEEP DIVE NOT READY" : queued ? "WAITING FOR CAPTIONS" :
          status === "topic-nav-only" ? "TOPICS READY" :
            receiptCount ? (compact ? "SHOW HIGHLIGHTS" : "FULL SHOW FILE") :
              "SHOW PAGE STARTED";
      var body = showWikiLocalNavMarkup(dossier);
      if (sourceBrief) {
        body += showWikiBriefMarkup(dossier) +
          '<aside class="source-dossier-wiki-brief-seal" role="note"><b>' +
          'NO FAKE RECAP.</b><span>This page will not turn a title and thumbnail into made-up topics, ' +
          'quotes, character bits, or comedy verdicts.</span></aside>';
      } else {
        body += showWikiRecapMarkup(dossier, compact) +
          showWikiEpisodeGuideMarkup(dossier, compact) +
          showWikiExperienceMarkup(dossier) +
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
      return '<section class="source-dossier-show-wiki"' + sectionAttributes("wiki") +
        ' aria-labelledby="sourceDossierShowWikiTitle" data-source-show-wiki-status="' +
        esc(token(status)) + '"><header><div><span>' + esc(label) +
        '</span><h3 id="sourceDossierShowWikiTitle">' + esc(headerTitle) +
        '</h3></div>' + (headerDescription ? '<p>' + esc(headerDescription) + '</p>' : '') +
        '</header><div class="source-dossier-wiki-status" role="status"><span>' +
        'ON THIS PAGE</span><b>' + esc(statusLabel) +
        '</b><small>' + (compact && !sourceBrief ?
          esc(visibleMomentCount) + ' HIGHLIGHT' +
          (visibleMomentCount === 1 ? '' : 'S') + ' SHOWN // ' : '') +
        esc(receiptCount) + ' PLAYABLE MOMENT' +
        (receiptCount === 1 ? '' : 'S') + '</small></div>' + body + '</section>';
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
          queryFact("CAPTION COVERAGE", coverageLabel(source.coverage)) +
          '<p>The upload details are ready. A recap and moment claims wait for usable captions from this exact show.</p>';
      } else if (result.field === "source-inventory") {
        details = queryFact("SHOW DETAILS", value.sourceBriefAvailable ? "AVAILABLE" :
          (value.summaryAvailable ? "NOT NEEDED" : "NOT REGISTERED")) +
          queryFact("TIMESTAMPS", formatNumber(record(value.receipts).total)) +
          queryFact("ENTITIES", formatNumber(value.entities)) +
          queryFact("ARTIFACTS", formatNumber(record(value.artifacts).total)) +
          queryFact("CONNECTIONS", formatNumber(record(value.connections).total));
      } else if (result.field === "source-proof") {
        details = queryFact("UPLOAD", formatDate(value.date)) +
          queryFact("RUNTIME", formatDuration(value.duration)) +
          queryFact("VIEWS WHEN INDEXED", formatNumber(value.views)) +
          queryFact("CAPTION COVERAGE", coverageLabel(value.coverage));
      } else if (result.field === "registered-summary") {
        heading = "EPISODE RECAP";
        details = '<p>' + esc(clean(value.text) || "No registered summary text survived.") +
          '</p>';
      } else {
        details = '<p>' + esc(
          clean(result.value) || "This metadata field is registered without a public value."
        ) + '</p>';
      }
      return '<article class="source-dossier-query-result is-metadata" ' +
        'data-source-query-result-type="metadata"><span>' +
        esc(clean(result.field).toUpperCase() || "SOURCE METADATA") +
        '</span><h5>' + esc(heading) +
        '</h5><div class="source-dossier-query-facts">' +
        details + '</div><small>FOUND FROM // ' +
        esc(clean(result.basis).toUpperCase() || "REGISTERED DOSSIER") +
        '</small></article>';
    }
    function queryEntityMarkup(result) {
      return '<article class="source-dossier-query-result is-entity" ' +
        'data-source-query-result-type="entity"><span>' +
        esc(clean(result.entityType).toUpperCase() || "REGISTERED ENTITY") +
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
        '</h5><p>' + esc(titleCase(result.kind).toUpperCase() || "REGISTERED ARTIFACT") +
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

    function queryResultMarkup(result, dossier) {
      if (result.type === "receipt") {
        return receiptMarkup(result.receipt, "source-dossier-query-receipt");
      }
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
      return '<aside class="source-dossier-query-episode-guide" data-source-query-episode-kind="' +
        esc(episode.kind) + '"><div><span>SHOW WIKI ANSWER</span><b>' +
        esc(episode.label) + '</b><small>' + esc(episode.totalReceipts) +
        ' REGISTERED // ' + esc(episode.matchedReceipts) + ' MATCHED // ' +
        esc(episode.shownReceipts) + ' SHOWN</small></div><a href="#' +
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
        "Show me the registered source brief.",
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
        "Show the registered moments in this tape.",
        "Which recurring characters are indexed here?",
        "What Short or supercut drafts are registered here?"
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
        '<p>Counts describe registered archive inventory. They are not popularity, quality, creator approval, or objective importance.</p></header>' +
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
        '<div class="source-dossier-entities"><header><span>REGISTERED ENTITIES</span><b>' +
        esc(formatNumber(entities.length)) + ' TOTAL</b></header>' +
        (entities.length ? '<div id="' + esc(SECTION_IDS.footprint) + 'Items">' +
          visibleEntities.map(entityMarkup).join("") + '</div>' +
          disclosureMarkup(
            "footprint", entities.length, visibleEntities.length, "entities"
          ) : '<p>NO CONTENT ENTITY WAS REGISTERED FOR THIS SOURCE.</p>') +
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
          '<p class="source-dossier-empty">NO DRAFT OR REVIEW ARTIFACT IS REGISTERED FOR THIS SOURCE.</p>') +
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
      if (!receipt) return '<span>NO PLAYABLE RECEIPT REGISTERED</span>';
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
        esc(strongestReceipt ? strongestReceipt.label : "NOT REGISTERED") + '</b>' +
        aftermathProofButton(dossier, delta.strongestTopic, "PLAY") + '</article><article><span>HIGHEST COMEDY / CHEMISTRY COORDINATE</span><b>' +
        esc(funniestReceipt ? funniestReceipt.label : "NOT REGISTERED") + '</b>' +
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
            (item.multiSource ? ' // MULTI-SOURCE' : ' // SOURCE-LOCAL') + '</small><i class="decision-' +
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
        (item.multiSource ? 'MULTI-SOURCE' : 'SOURCE-LOCAL') + '</b></div></header>' +
        aftermathCoordinatesMarkup(item) +
        '<div class="source-aftermath-copy"><span>' + esc(item.editorial.label) +
        '</span><div><article><small>TITLE OPTIONS</small>' +
        (titles.length ? '<ol>' + titles.map(function (value) { return '<li>' + esc(value) + '</li>'; }).join("") + '</ol>' :
          '<p>NO TITLE COPY REGISTERED.</p>') + '</article><article><small>HOOK OPTIONS</small>' +
        (hooks.length ? '<ol>' + hooks.map(function (value) { return '<li>' + esc(value) + '</li>'; }).join("") + '</ol>' :
          '<p>NO HOOK COPY REGISTERED.</p>') + '</article></div></div>' +
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
        }).join("") : '<p>NO SOURCE-LOCAL RESEARCH THREADS REGISTERED.</p>') +
        '</section><section><header><span>COLD-OPEN STORYBOARDS</span><b>' + esc(boards.length) +
        ' GENERATED / SEPARATE COUNT</b></header>' +
        (boards.length ? boards.map(function (board) {
          var slot = board.localSlots[0];
          return '<article><div><b>' + esc(board.title) + '</b><small>' +
            esc(board.formatSeconds) + ' SEC // ' + esc(board.mode) + ' // ' +
            esc(board.registrationBoundary) + '</small></div>' + (slot ?
              '<button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
              esc(slot.receiptKey) + '">&#9654; LOCAL SLOT ' + esc(slot.timecode) + '</button>' : '') + '</article>';
        }).join("") : '<p>NO SOURCE-LINKED STORYBOARDS REGISTERED.</p>') + '</section></div>';
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
      }).join(" + ") || "NONE REGISTERED FOR THIS SOURCE";
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
        '</b><span>REGISTERED REVIEW CANDIDATES</span><small>' + esc(inventoryComposition) + '</small></article><article><b>' +
        esc(metrics.clipReady + metrics.fastReview) + '</b><span>CURATED CUTS IN THE FAST LANE</span><small>STILL REQUIRE CONTEXT, SPEAKER, RIGHTS, AND FINAL-EDIT REVIEW</small></article><article><b>' +
        esc(metrics.referenceThreads) + '</b><span>REFERENCE-ONLY LORE THREADS</span><small>NOT COUNTED AS CLIP-READY INVENTORY</small></article><article><b>' +
        esc(metrics.coldOpenStoryboards) + '</b><span>SOURCE-LINKED COLD OPENS</span><small>GENERATED STORYBOARDS // SEPARATE FROM REGISTERED ARTIFACTS</small></article></div>' +
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
          ' SOURCE</span><b>EDGE OF THE REGISTERED TIMELINE.</b></article>';
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
        '<li><b>MOMENTS:</b> only timestamps registered to this exact show.</li>' +
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
      var deepResearch = askMarkup(dossier) + proofMarkup(dossier) +
        insideMarkup(dossier) + footprintMarkup(dossier) + wakeMarkup(dossier) +
        '<nav class="source-dossier-chronology"' + sectionAttributes("chronology") +
        ' aria-label="Source chronology">' +
        chronologyButton(dossier.chronology.previous, "previous") +
        chronologyButton(dossier.chronology.next, "next") + '</nav>' +
        aftermathMarkup(dossier) + workMarkup(dossier) + boundaryMarkup(dossier);
      return '<article class="source-dossier is-' + esc(token(source.coverage)) +
        ' is-' + esc(token(source.authority)) + '" data-source-dossier-view="' +
        (state.fullFile ? "full" : "compact") + '" aria-labelledby="sourceDossierTitle" ' +
        (state.fullFile ? 'aria-describedby="sourceDossierBoundary"' : '') +
        '><header class="source-dossier-hero">' +
        '<img src="' + esc(source.thumbnail) + '" alt="' +
        esc((source.displayTitle || source.title) + ' source thumbnail') + '"><div class="source-dossier-hero-shade"></div>' +
        '<div class="source-dossier-hero-copy"><span>WWAM AFTER MIDNIGHT // SHOW WIKI // ' +
        esc(coverageLabel(source.coverage)) + '</span><h2 id="sourceDossierTitle" tabindex="-1">' +
        esc(source.displayTitle || source.title) + '</h2><p>' + esc(formatDate(source.date)) +
        ' // ' + esc(formatDuration(source.duration)) + ' // ' +
        esc(formatNumber(source.views)) + ' VIEWS WHEN INDEXED</p><div>' +
        '<button type="button" data-source-dossier-action="play-source">&#9654; WATCH THIS SHOW</button>' +
        (hasEpisodeGuide ?
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
          "data-source-id"
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

    function jumpWithinDossier(event) {
      var link = event.target && event.target.closest ?
        event.target.closest('a[href^="#sourceDossier"]') : null;
      if (!link || typeof mount.querySelector !== "function") return false;
      var href = clean(link.getAttribute("href"));
      var targetId = href.slice(1);
      if (!/^sourceDossier[A-Za-z0-9_-]+$/.test(targetId)) return false;
      var target = mount.querySelector("#" + targetId);
      if (!target) return false;
      if (typeof event.preventDefault === "function") event.preventDefault();
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      var focusTarget = typeof target.querySelector === "function" ?
        target.querySelector("h2,h3,h4,h5") : null;
      if (!focusTarget) focusTarget = target;
      if (focusTarget && typeof focusTarget.setAttribute === "function" &&
          typeof focusTarget.hasAttribute === "function" &&
          !focusTarget.hasAttribute("tabindex")) {
        focusTarget.setAttribute("tabindex", "-1");
      }
      if (focusTarget && typeof focusTarget.focus === "function") {
        try { focusTarget.focus({ preventScroll: true }); } catch { focusTarget.focus(); }
      }
      return true;
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
      if (action === "play-source") {
        state.activeReceiptKey = "";
        state.activeReceiptOrigin = "";
        renderCurrent();
        callbacks.play(Object.assign(payload, {
          mode: "source",
          at: state.at,
          end: null,
          receipt: null
        }));
      } else if (action === "play-guide-cut") {
        var guideAt = Number(button.getAttribute("data-guide-at"));
        var guideEnd = Number(button.getAttribute("data-guide-end"));
        if (Number.isFinite(guideAt) && guideAt >= 0 && guideAt <= number(source.duration)) {
          state.activeReceiptKey = "";
          state.activeReceiptOrigin = ownerSection || "wiki";
          state.at = guideAt;
          state.hasAnchor = true;
          renderCurrent();
          callbacks.play(Object.assign(payload, {
            mode: "episode-guide",
            at: guideAt,
            end: Number.isFinite(guideEnd) && guideEnd > guideAt ? guideEnd : null,
            receipt: null
          }));
        }
      } else if (action === "play-receipt") {
        var playReceipt = receiptByKey(button.getAttribute("data-receipt-key"));
        if (playReceipt) {
          state.activeReceiptKey = playReceipt.key;
          if (ownerSection && ownerSection !== "player") {
            state.activeReceiptOrigin = ownerSection;
          }
          state.at = playReceipt.at;
          state.hasAnchor = true;
          renderCurrent();
          callbacks.play(Object.assign(payload, {
            mode: "receipt",
            at: playReceipt.at,
            end: playReceipt.end,
            receipt: playReceipt
          }));
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
      state.expanded = {};
      var deepSection = safeSection(settings.deepSection || settings.section);
      if (EXPANDABLE_SECTIONS.indexOf(deepSection) >= 0) {
        state.expanded[deepSection] = true;
      }
      state.query = clean(settings.query).slice(0, 240) || DEFAULT_SOURCE_QUERY;
      state.activeReceiptKey = "";
      state.activeReceiptOrigin = "";
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
