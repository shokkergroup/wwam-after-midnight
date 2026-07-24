(function (root) {
  "use strict";

  var VERSION = "1.1.0";
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
  var SECTION_IDS = Object.freeze({
    proof: "sourceDossierProof",
    player: "sourceDossierPlayerSection",
    inside: "sourceDossierInside",
    ask: "sourceDossierAsk",
    footprint: "sourceDossierFootprint",
    wake: "sourceDossierWake",
    chronology: "sourceDossierChronology",
    work: "sourceDossierWork",
    boundary: "sourceDossierBoundary"
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

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
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
    return clean(value).replace(/[-_]+/g, " ").replace(/\b\w/g, function (letter) {
      return letter.toUpperCase();
    });
  }

  function coverageLabel(value) {
    return {
      "caption-backed": "CAPTION-BACKED SOURCE",
      "caption-limited": "CAPTION PATH LIMITED",
      "metadata-only": "SOURCE METADATA ONLY",
      unavailable: "SOURCE RECORD INCOMPLETE"
    }[value] || titleCase(value).toUpperCase();
  }

  function authorityLabel(value) {
    return {
      "promoted-lane": "PROMOTED EVIDENCE LANE",
      "quarantined-lane": "QUARANTINED REVIEW LANE",
      "source-only": "SOURCE NAVIGATION ONLY"
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
      companion: typeof input.onOpenCompanion === "function" ?
        input.onOpenCompanion : function () {},
      bag: typeof input.onBagReceipt === "function" ? input.onBagReceipt : function () {}
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
        '<div><span>' + (state.fullFile ? "FULL SOURCE FILE" : "DIRECTOR'S CUT") +
        '</span><p>' + (state.fullFile ?
          "Every registered receipt, entity, connection, and draft is visible." :
          "The strongest source-local proof stays up front. Expand only the evidence lane you need.") +
        '</p></div><button type="button" data-source-dossier-action="' +
        (state.fullFile ? "close-full-file" : "open-full-file") + '" aria-expanded="' +
        (state.fullFile ? "true" : "false") + '">' +
        (state.fullFile ? "RETURN TO COMPACT FILE" : "OPEN FULL FILE") +
        '</button></aside>';
    }

    function sourceReceiptByKey(dossier, key) {
      return array(dossier && dossier.source && dossier.source.receipts)
        .filter(function (receipt) { return receipt.key === key; })[0] || null;
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
          return {
            type: type,
            field: clean(result.field),
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
      return {
        schema: answer.schema,
        scope: scope,
        status: status,
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
        supported: "SOURCE-LOCKED ANSWER",
        inventory: "REGISTERED SOURCE INVENTORY",
        proof: "CANONICAL SOURCE PROOF",
        "metadata-only": "METADATA-ONLY REFUSAL",
        "caption-limited": "CAPTION-LIMITED ANSWER",
        unavailable: "SOURCE UNAVAILABLE",
        "insufficient-evidence": "INSUFFICIENT SOURCE EVIDENCE",
        "speaker-refused": "SPEAKER CLAIM REFUSED",
        "ranking-refused": "UNSUPPORTED RANKING REFUSED",
        "stale-source": "STALE SOURCE LOCK"
      }[status] || "SOURCE QUERY HELD";
    }

    function proofMarkup(dossier) {
      var source = dossier.source;
      var proof = dossier.proof;
      var lanes = array(source.lanes);
      return '<section class="source-dossier-proof"' + sectionAttributes("proof") +
        ' aria-labelledby="sourceDossierProofTitle">' +
        '<header><div><span>SOURCE PROOF</span><h3 id="sourceDossierProofTitle">THE UPLOAD, BEFORE THE INTERPRETATION.</h3></div>' +
        '<p>Cached measurements identify this source. They do not establish a speaker, intent, rights status, or creator verdict.</p></header>' +
        '<div class="source-dossier-proof-grid">' +
        '<article><span>EVIDENCE DEPTH</span><b>' + esc(coverageLabel(source.coverage)) + '</b></article>' +
        '<article><span>ARCHIVE AUTHORITY</span><b>' + esc(authorityLabel(source.authority)) + '</b></article>' +
        '<article><span>UPLOAD DATE</span><b>' + esc(formatDate(source.date)) + '</b></article>' +
        '<article><span>RUNTIME</span><b>' + esc(formatDuration(source.duration)) + '</b></article>' +
        '<article><span>CACHED VIEWS</span><b>' + esc(formatNumber(source.views)) + '</b></article>' +
        '<article><span>WORDS AUDITED</span><b>' + esc(formatNumber(source.wordsAudited)) + '</b></article>' +
        '<article><span>SOURCE TYPE</span><b>' + esc(titleCase(source.sourceType).toUpperCase()) + '</b></article>' +
        '<article><span>REGISTERED LANES</span><b>' +
        esc(lanes.length ? lanes.join(" + ").toUpperCase() : "NO LANE CAPTURED") +
        '</b></article></div>' +
        '<p class="source-dossier-proof-status" role="status"><b>' +
        esc(proof.quarantined ? "QUARANTINE ACTIVE" :
          proof.sourceOnly ? "SOURCE-ONLY BOUNDARY ACTIVE" :
            proof.captionLimited ? "CAPTION LIMIT ACTIVE" : "SOURCE-BOUNDED EVIDENCE") +
        '</b><span>' + esc(proof.evidenceBoundary) + '</span></p></section>';
    }

    function playerMarkup(dossier) {
      var source = dossier.source;
      return '<section class="source-dossier-player-section"' + sectionAttributes("player") +
        ' aria-labelledby="sourceDossierPlayerTitle">' +
        '<header><div><span>OFFICIAL SOURCE PLAYBACK</span><h3 id="sourceDossierPlayerTitle">PLAY IT HERE. KEEP THE RECEIPTS ATTACHED.</h3></div>' +
        '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">OPEN OFFICIAL SOURCE &#8599;</a></header>' +
        '<div class="modal-player source-dossier-player" id="modalPlayer" data-source-dossier-player aria-live="polite">' +
        '<div><span>THE PLAYER STAYS DORMANT UNTIL YOU ASK FOR IT.</span>' +
        '<button type="button" data-source-dossier-action="play-source" aria-label="Play ' +
        esc(source.displayTitle || source.title) + ' inside this page">&#9654; PLAY SOURCE</button>' +
        '<small>OFFICIAL YOUTUBE UPLOAD // NO COPIED MEDIA // RECOVERY CONTROL APPEARS WITH THE PLAYER</small></div></div></section>';
    }

    function receiptMarkup(receipt, extraClass) {
      var excerpt = receipt.publicExcerptAllowed && receipt.excerpt ?
        '&ldquo;' + esc(receipt.excerpt) + '&rdquo;' :
        '<span class="source-dossier-withheld">EXCERPT WITHHELD // SOURCE COORDINATE REMAINS</span>';
      var label = clean(receipt.label) || "INDEXED RECEIPT";
      var time = formatTime(receipt.at);
      return '<article class="source-dossier-receipt' +
        (extraClass ? ' ' + esc(extraClass) : '') + '" data-receipt-key="' +
        esc(receipt.key) + '"><header><span>' + esc(label) + '</span><time>' +
        esc(time) + '</time></header><p>' + excerpt + '</p><div class="source-dossier-receipt-proof">' +
        '<span>' + esc(clean(receipt.evidenceLevel).toUpperCase()) + '</span><span>' +
        esc(clean(receipt.reviewState).toUpperCase()) + '</span><span>SPEAKER NOT DIARIZED</span></div>' +
        '<footer><button type="button" data-source-dossier-action="play-receipt" data-receipt-key="' +
        esc(receipt.key) + '" aria-label="Play ' + esc(label) + ' at ' + esc(time) +
        '">&#9654; PLAY ' + esc(time) + '</button><button type="button" data-source-dossier-action="bag-receipt" ' +
        'data-receipt-key="' + esc(receipt.key) + '" aria-label="Save ' + esc(label) +
        ' to the evidence bag">BAG RECEIPT</button></footer></article>';
    }

    function refusalMarkup(dossier) {
      var proof = dossier.proof;
      var sourceOnly = proof.sourceOnly;
      return '<div class="source-dossier-refusal" role="status" aria-live="polite">' +
        '<span>' + esc(sourceOnly ? "METADATA-ONLY REFUSAL" : "CAPTION-EVIDENCE REFUSAL") + '</span>' +
        '<h4>THE ARCHIVE REFUSES TO INVENT THE MISSING TAPE.</h4><p>' +
        esc(proof.evidenceBoundary) + '</p><ul><li>0 transcript-derived receipts</li>' +
        '<li>0 content summaries</li><li>0 speaker claims</li><li>0 automatic promotions</li></ul></div>';
    }

    function queryFact(label, value) {
      return '<span><b>' + esc(value == null || value === "" ? "0" : value) +
        '</b>' + esc(label) + '</span>';
    }

    function queryMetadataMarkup(result) {
      var value = record(result.value);
      var details = "";
      if (result.field === "source-inventory") {
        details = queryFact("RECEIPTS", formatNumber(record(value.receipts).total)) +
          queryFact("ENTITIES", formatNumber(value.entities)) +
          queryFact("ARTIFACTS", formatNumber(record(value.artifacts).total)) +
          queryFact("CONNECTIONS", formatNumber(record(value.connections).total));
      } else if (result.field === "source-proof") {
        details = queryFact("UPLOAD", formatDate(value.date)) +
          queryFact("RUNTIME", formatDuration(value.duration)) +
          queryFact("CACHED VIEWS", formatNumber(value.views)) +
          queryFact("EVIDENCE", coverageLabel(value.coverage));
      } else if (result.field === "registered-summary") {
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
        '</span><h5>REGISTERED SOURCE FACTS</h5><div class="source-dossier-query-facts">' +
        details + '</div><small>BASIS // ' +
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
        ' SOURCE-LOCAL RECEIPT LINK' +
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

    function queryResultMarkup(result) {
      if (result.type === "receipt") {
        return receiptMarkup(result.receipt, "source-dossier-query-receipt");
      }
      if (result.type === "metadata") return queryMetadataMarkup(result);
      if (result.type === "entity") return queryEntityMarkup(result);
      if (result.type === "artifact") return queryArtifactMarkup(result);
      return queryConnectionMarkup(result);
    }

    function queryAnswerMarkup(dossier) {
      if (state.queryBusy) {
        return '<div class="source-dossier-query-state is-loading" id="sourceDossierAskAnswer" ' +
          'role="status" aria-live="polite"><span>SOURCE LOCK HELD</span>' +
          '<h4>INTERROGATING THIS TAPE ONLY.</h4><p>No other upload may substitute while the answer is assembled.</p></div>';
      }
      if (state.queryError) {
        return '<div class="source-dossier-query-state is-held" id="sourceDossierAskAnswer" ' +
          'role="alert"><span>SOURCE QUERY HELD</span><h4>THE LOCK REFUSED THE RESULT.</h4><p>' +
          esc(state.queryError) + '</p></div>';
      }
      if (!state.queryAnswer) {
        return '<div class="source-dossier-query-state" id="sourceDossierAskAnswer" ' +
          'role="status" aria-live="polite"><span>SOURCE-LOCAL MODE</span>' +
          '<h4>ASK ONE TAPE. GET ONE TAPE.</h4><p>' +
          (queryEngine && typeof queryEngine.answer === "function" ?
            "Every answer must resolve to this source fingerprint or fail closed." :
            "The source-query engine is not connected. Archive-wide search will not be used as a substitute.") +
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
        "This exact source cannot support that claim." :
        results.length + " source-locked result" +
          (results.length === 1 ? "" : "s") + " survived this question.");
      return '<div class="source-dossier-query-answer is-' + esc(token(status)) +
        '" id="sourceDossierAskAnswer" role="region" aria-live="polite" ' +
        'aria-labelledby="sourceDossierAskAnswerTitle" data-source-query-status="' +
        esc(status) + '" data-source-query-result-count="' + esc(results.length) + '">' +
        '<header><div><span>' + esc(queryStatusLabel(status)) +
        '</span><h4 id="sourceDossierAskAnswerTitle">' + esc(conclusion) +
        '</h4></div><b>LOCKED TO ' + esc(dossier.source.id) + '</b></header>' +
        '<p class="source-dossier-query-question">&ldquo;' + esc(state.query) +
        '&rdquo;</p>' +
        (results.length ? '<div class="source-dossier-query-results">' +
          results.map(queryResultMarkup).join("") + '</div>' :
          '<div class="source-dossier-query-refusal"><b>0 SUPPORTED SOURCE RESULTS</b><span>' +
          esc(dossier.proof.evidenceBoundary) + '</span></div>') +
        (answer.limitations.length ? '<ul class="source-dossier-query-limitations">' +
          answer.limitations.slice(0, 3).map(function (limitation) {
            return '<li>' + esc(limitation) + '</li>';
          }).join("") + '</ul>' : '') +
        '<footer><span>' + esc(results.length) + ' OF ' +
        esc(answer.total) + ' QUALIFYING RESULTS SHOWN</span><span>' +
        'CROSS-SOURCE SUBSTITUTION: BLOCKED</span></footer></div>';
    }

    function askMarkup(dossier) {
      var source = dossier.source;
      var prompts = [
        "What is actually indexed in this tape?",
        "Show the registered moments in this tape.",
        "Which recurring characters are indexed here?",
        "What Short or supercut drafts are registered here?"
      ];
      return '<section class="source-dossier-ask"' + sectionAttributes("ask") +
        ' aria-labelledby="sourceDossierAskTitle"><header><div>' +
        '<span>SOURCE-LOCKED INTERROGATION</span><h3 id="sourceDossierAskTitle">ASK THIS TAPE.</h3>' +
        '</div><p>Questions stay bound to this source ID and fingerprint. A duplicate title, hotter upload, or archive-wide match cannot replace it.</p></header>' +
        '<div class="source-dossier-source-lock" role="status"><span>SOURCE LOCK</span><b>' +
        esc(source.id) + '</b><small>' + esc(clean(source.sourceFingerprint)) +
        '</small></div><div class="source-dossier-query-prompts" aria-label="Useful source questions">' +
        prompts.map(function (prompt) {
          return '<button type="button" data-source-dossier-action="query-prompt" data-query="' +
            esc(prompt) + '">' + esc(prompt) + '</button>';
        }).join("") + '</div><form class="source-dossier-query-form" data-source-dossier-query-form ' +
        'aria-describedby="sourceDossierQueryBoundary"><label for="sourceDossierQuery">QUERY THIS SOURCE</label>' +
        '<div><input id="sourceDossierQuery" name="query" type="search" maxlength="240" required ' +
        'autocomplete="off" value="' + esc(state.query) +
        '" placeholder="Ask about this upload only..."><button type="submit"' +
        (state.queryBusy ? " disabled" : "") + '>EXHUME THIS TAPE</button></div>' +
        '<small id="sourceDossierQueryBoundary">Results may use only registered receipts from ' +
        esc(source.id) + '. Speaker identity, intent, and true origin remain outside the answer.</small></form>' +
        queryAnswerMarkup(dossier) + '</section>';
    }

    function insideMarkup(dossier) {
      var source = dossier.source;
      var receipts = array(source.receipts);
      var visibleReceipts = visibleItems(
        receipts, "inside", COMPACT_LIMITS.receipts
      );
      var summary = source.summary;
      return '<section class="source-dossier-inside"' + sectionAttributes("inside") +
        ' aria-labelledby="sourceDossierInsideTitle">' +
        '<header><div><span>INSIDE THIS TAPE</span><h3 id="sourceDossierInsideTitle">' +
        (receipts.length ? esc(formatNumber(receipts.length)) + ' PLAYABLE SOURCE RECEIPTS.' :
          'THE CONTENT CLAIM STAYS SEALED.') +
        '</h3></div><p>Every visible fragment remains source-bounded. Category labels and review states are archive metadata, not host-authored claims.</p></header>' +
        (summary ? '<blockquote><span>SOURCE-BOUNDED SUMMARY // ' +
          esc(clean(summary.basis).toUpperCase()) + '</span><p>' +
          esc(summary.text) + '</p></blockquote>' : '') +
        (receipts.length ? '<div class="source-dossier-receipts" id="' +
          esc(SECTION_IDS.inside) + 'Items">' +
          visibleReceipts.map(function (receipt) { return receiptMarkup(receipt); }).join("") +
          '</div>' + disclosureMarkup(
            "inside", receipts.length, visibleReceipts.length, "receipts"
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
        'aria-labelledby="sourceDossierBoundaryTitle"><header><span>WHAT THIS PAGE CAN PROVE</span>' +
        '<h3 id="sourceDossierBoundaryTitle">THE RECEIPT IS REAL. THE REST STAYS UNDER OATH.</h3></header>' +
        '<p>' + esc(proof.evidenceBoundary) + '</p><ul><li><b>SOURCE:</b> title, date, runtime, cached measurements, lanes, and official URL.</li>' +
        '<li><b>RECEIPTS:</b> only bounded coordinates registered to this exact source.</li>' +
        '<li><b>CONNECTIONS:</b> typed shared evidence, never automatic causality or origin.</li>' +
        '<li><b>WITHHELD:</b> speaker identity, intent, rights clearance, creator approval, and automatic Canon promotion.</li></ul>' +
        warningMarkup(dossier.source) +
        '<footer><span>SNAPSHOT ' + esc(dossier.bindings.snapshotDate) + '</span><span>DOSSIER ' +
        esc(dossier.fingerprint) + '</span><span>ARCHIVE ' +
        esc(dossier.bindings.archiveFingerprint) + '</span></footer></section>';
    }

    function renderMarkup(dossier) {
      var source = dossier.source;
      return '<article class="source-dossier is-' + esc(token(source.coverage)) +
        ' is-' + esc(token(source.authority)) + '" aria-labelledby="sourceDossierTitle" ' +
        'aria-describedby="sourceDossierBoundary"><header class="source-dossier-hero">' +
        '<img src="' + esc(source.thumbnail) + '" alt="' +
        esc((source.displayTitle || source.title) + ' source thumbnail') + '"><div class="source-dossier-hero-shade"></div>' +
        '<div class="source-dossier-hero-copy"><span>CANONICAL SOURCE DOSSIER // ' +
        esc(coverageLabel(source.coverage)) + '</span><h2 id="sourceDossierTitle" tabindex="-1">' +
        esc(source.displayTitle || source.title) + '</h2><p>' + esc(formatDate(source.date)) +
        ' // ' + esc(formatDuration(source.duration)) + ' // ' +
        esc(formatNumber(source.views)) + ' CACHED VIEWS</p><div>' +
        '<button type="button" data-source-dossier-action="play-source">&#9654; PLAY SOURCE</button>' +
        '<button type="button" data-source-dossier-action="copy-link">COPY DOSSIER LINK</button>' +
        '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">OFFICIAL YOUTUBE &#8599;</a>' +
        '</div></div></header>' + densityMarkup() + proofMarkup(dossier) +
        askMarkup(dossier) + playerMarkup(dossier) + insideMarkup(dossier) +
        footprintMarkup(dossier) + wakeMarkup(dossier) +
        '<nav class="source-dossier-chronology"' + sectionAttributes("chronology") +
        ' aria-label="Source chronology">' +
        chronologyButton(dossier.chronology.previous, "previous") +
        chronologyButton(dossier.chronology.next, "next") + '</nav>' +
        workMarkup(dossier) + boundaryMarkup(dossier) + '</article>';
    }

    function errorMarkup(error) {
      var message = clean(error && error.message) || "The source dossier could not be verified.";
      return '<section class="source-dossier-error" role="alert"><span>SOURCE DOSSIER HELD</span>' +
        '<h2>THE PAGE FAILED CLOSED.</h2><p>' + esc(message) +
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

    function renderCurrent() {
      if (!state.destroyed && state.dossier) {
        mount.innerHTML = renderMarkup(state.dossier);
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
      var target = input.document.getElementById(SECTION_IDS[state.section]);
      if (!target) return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (typeof target.focus === "function") target.focus();
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

    function handleClick(event) {
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
        callbacks.play(Object.assign(payload, {
          mode: "source",
          at: state.at,
          end: null,
          receipt: null
        }));
      } else if (action === "play-receipt") {
        var playReceipt = receiptByKey(button.getAttribute("data-receipt-key"));
        if (playReceipt) callbacks.play(Object.assign(payload, {
          mode: "receipt",
          at: playReceipt.at,
          end: playReceipt.end,
          receipt: playReceipt
        }));
      } else if (action === "bag-receipt") {
        var bagReceipt = receiptByKey(button.getAttribute("data-receipt-key"));
        if (bagReceipt) callbacks.bag(Object.assign(payload, { receipt: bagReceipt }));
      } else if (action === "copy-link") {
        callbacks.copy(Object.assign(payload, { at: state.at }));
      } else if (action === "download") {
        var manifest = typeof engine.exportManifest === "function" ?
          engine.exportManifest(source.id) : null;
        callbacks.download(Object.assign(payload, {
          manifest: manifest,
          filename: "source-dossier-" + source.id + ".json"
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
        if (relatedId) callbacks.open(Object.assign(payload, {
          targetSourceId: relatedId,
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
      state.fullFile = settings.fullFile === true || settings.full === true;
      state.expanded = {};
      var deepSection = safeSection(settings.deepSection || settings.section);
      if (EXPANDABLE_SECTIONS.indexOf(deepSection) >= 0) {
        state.expanded[deepSection] = true;
      }
      state.query = clean(settings.query).slice(0, 240) || DEFAULT_SOURCE_QUERY;
      state.queryAnswer = null;
      state.queryBusy = false;
      state.queryError = "";
      state.queryEpoch += 1;
      try {
        var dossier = engine.build(state.sourceId);
        if (!validateDossier(dossier)) {
          throw new Error("Source Dossier engine returned an incompatible dossier.");
        }
        state.dossier = dossier;
        mount.innerHTML = renderMarkup(dossier);
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
