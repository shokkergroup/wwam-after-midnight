(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var DOSSIER_SCHEMA = "shokker-source-dossier/v1";

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
      ask: typeof input.onAskSource === "function" ? input.onAskSource : function () {},
      open: typeof input.onOpenSource === "function" ? input.onOpenSource : function () {},
      companion: typeof input.onOpenCompanion === "function" ?
        input.onOpenCompanion : function () {},
      bag: typeof input.onBagReceipt === "function" ? input.onBagReceipt : function () {}
    };
    var state = {
      dossier: null,
      sourceId: "",
      at: 0,
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

    function proofMarkup(dossier) {
      var source = dossier.source;
      var proof = dossier.proof;
      var lanes = array(source.lanes);
      return '<section class="source-dossier-proof" aria-labelledby="sourceDossierProofTitle">' +
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
      return '<section class="source-dossier-player-section" aria-labelledby="sourceDossierPlayerTitle">' +
        '<header><div><span>OFFICIAL SOURCE PLAYBACK</span><h3 id="sourceDossierPlayerTitle">PLAY IT HERE. KEEP THE RECEIPTS ATTACHED.</h3></div>' +
        '<a href="' + esc(source.url) + '" target="_blank" rel="noopener">OPEN OFFICIAL SOURCE &#8599;</a></header>' +
        '<div class="modal-player source-dossier-player" id="modalPlayer" data-source-dossier-player aria-live="polite">' +
        '<div><span>THE PLAYER STAYS DORMANT UNTIL YOU ASK FOR IT.</span>' +
        '<button type="button" data-source-dossier-action="play-source" aria-label="Play ' +
        esc(source.displayTitle || source.title) + ' inside this page">&#9654; PLAY SOURCE</button>' +
        '<small>OFFICIAL YOUTUBE UPLOAD // NO COPIED MEDIA // RECOVERY CONTROL APPEARS WITH THE PLAYER</small></div></div></section>';
    }

    function receiptMarkup(receipt) {
      var excerpt = receipt.publicExcerptAllowed && receipt.excerpt ?
        '&ldquo;' + esc(receipt.excerpt) + '&rdquo;' :
        '<span class="source-dossier-withheld">EXCERPT WITHHELD // SOURCE COORDINATE REMAINS</span>';
      var label = clean(receipt.label) || "INDEXED RECEIPT";
      var time = formatTime(receipt.at);
      return '<article class="source-dossier-receipt" data-receipt-key="' +
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

    function insideMarkup(dossier) {
      var source = dossier.source;
      var receipts = array(source.receipts);
      var summary = source.summary;
      return '<section class="source-dossier-inside" aria-labelledby="sourceDossierInsideTitle">' +
        '<header><div><span>INSIDE THIS TAPE</span><h3 id="sourceDossierInsideTitle">' +
        (receipts.length ? esc(formatNumber(receipts.length)) + ' PLAYABLE SOURCE RECEIPTS.' :
          'THE CONTENT CLAIM STAYS SEALED.') +
        '</h3></div><p>Every visible fragment remains source-bounded. Category labels and review states are archive metadata, not host-authored claims.</p></header>' +
        (summary ? '<blockquote><span>SOURCE-BOUNDED SUMMARY // ' +
          esc(clean(summary.basis).toUpperCase()) + '</span><p>' +
          esc(summary.text) + '</p></blockquote>' : '') +
        (receipts.length ? '<div class="source-dossier-receipts">' +
          receipts.map(function (receipt) { return receiptMarkup(receipt); }).join("") +
          '</div>' : refusalMarkup(dossier)) + '</section>';
    }

    function entityMarkup(entity) {
      return '<article><span>' + esc(clean(entity.type).toUpperCase()) + '</span><b>' +
        esc(entity.label) + '</b><small>' + esc(entityBasisLabel(entity.basis)) +
        (array(entity.receiptKeys).length ? ' // ' +
          esc(array(entity.receiptKeys).length) + ' LOCAL RECEIPT' +
          (array(entity.receiptKeys).length === 1 ? '' : 'S') : '') +
        '</small></article>';
    }

    function footprintMarkup(dossier) {
      var source = dossier.source;
      var entities = array(source.entities);
      var receipts = dossier.receiptSummary || { total: 0, byKind: {}, byEvidenceType: {} };
      var artifacts = dossier.artifactSummary || { total: 0, byKind: {}, byAuthority: {} };
      return '<section class="source-dossier-footprint" aria-labelledby="sourceDossierFootprintTitle">' +
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
        (entities.length ? entities.map(entityMarkup).join("") :
          '<p>NO CONTENT ENTITY WAS REGISTERED FOR THIS SOURCE.</p>') +
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
      return '<section class="source-dossier-wake" aria-labelledby="sourceDossierWakeTitle">' +
        '<header><div><span>THE TAPE&rsquo;S WAKE</span><h3 id="sourceDossierWakeTitle">WHAT THE ARCHIVE CONNECTS AFTERWARD.</h3></div>' +
        '<p>A shared entity or artifact proves an indexed relationship. It does not prove influence, causality, a callback, or the true origin of a bit.</p></header>' +
        '<section class="source-dossier-later" aria-labelledby="sourceDossierLaterTitle"><header><span>LATER // DUAL-ENDED EVIDENCE</span>' +
        '<h4 id="sourceDossierLaterTitle">' + esc(formatNumber(laterEvidence.length)) +
        ' LATER CONNECTION' + (laterEvidence.length === 1 ? '' : 'S') + ' WITH EVIDENCE ON BOTH SIDES.</h4></header>' +
        (laterEvidence.length ? '<div>' + laterEvidence.map(function (connection) {
          return connectionMarkup(connection, false);
        }).join("") + '</div>' :
          '<p class="source-dossier-empty">NO LATER DUAL-ENDED EVIDENCE SURVIVES THE CURRENT SNAPSHOT.</p>') +
        '</section><section class="source-dossier-neighborhood" aria-labelledby="sourceDossierNeighborhoodTitle">' +
        '<header><span>TITLE / EARLIER NEIGHBORHOOD</span><h4 id="sourceDossierNeighborhoodTitle">' +
        esc(formatNumber(titleNeighbors.length)) + ' RELATED RECORD' +
        (titleNeighbors.length === 1 ? '' : 'S') + ' KEPT OUTSIDE THE CALLBACK CLAIM.</h4></header>' +
        '<p>Earlier records and title-only aliases establish archive proximity—not content, continuity, influence, or causality.</p>' +
        (titleNeighbors.length ? '<div>' + titleNeighbors.map(function (connection) {
          return connectionMarkup(connection, true);
        }).join("") + '</div>' :
          '<p class="source-dossier-empty">NO TITLE-ONLY OR EARLIER NEIGHBOR SURVIVES THE CURRENT SNAPSHOT.</p>') +
        '</section></section>';
    }

    function artifactMarkup(artifact) {
      return '<article><header><span>' + esc(artifactAuthorityLabel(artifact.authority)) +
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
      return '<section class="source-dossier-work" aria-labelledby="sourceDossierWorkTitle">' +
        '<header><div><span>PUT THE ARCHIVE TO WORK</span><h3 id="sourceDossierWorkTitle">FROM SOURCE PROOF TO A REVIEWABLE NEXT MOVE.</h3></div>' +
        '<p>These controls navigate, draft, or export. Nothing here publishes, promotes, rights-clears, authenticates, or identifies a speaker.</p></header>' +
        (artifacts.length ? '<div class="source-dossier-artifacts">' +
          artifacts.map(artifactMarkup).join("") + '</div>' :
          '<p class="source-dossier-empty">NO DRAFT OR REVIEW ARTIFACT IS REGISTERED FOR THIS SOURCE.</p>') +
        '<div class="source-dossier-work-actions"><button type="button" data-source-dossier-action="ask-source">' +
        'ASK THIS SOURCE</button><button type="button" data-source-dossier-action="open-companion">' +
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
        '</div></div></header>' + proofMarkup(dossier) + playerMarkup(dossier) +
        insideMarkup(dossier) + footprintMarkup(dossier) + wakeMarkup(dossier) +
        '<nav class="source-dossier-chronology" aria-label="Source chronology">' +
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

    function handleClick(event) {
      var button = event.target && event.target.closest ?
        event.target.closest("[data-source-dossier-action]") : null;
      if (!button || !state.dossier || state.destroyed) return;
      if (typeof event.preventDefault === "function") event.preventDefault();
      var action = button.getAttribute("data-source-dossier-action");
      var source = state.dossier.source;
      var payload = { sourceId: source.id, dossier: state.dossier };
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
        callbacks.ask(Object.assign(payload, { title: source.displayTitle || source.title }));
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

    function render(sourceId, renderOptions) {
      if (state.destroyed) throw new Error("Source Dossier UI has been destroyed.");
      setAttribute("aria-busy", "true");
      setAttribute("data-source-dossier-state", "loading");
      state.sourceId = clean(sourceId);
      state.at = Math.max(0, Number(renderOptions && renderOptions.at) || 0);
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
      mount.removeEventListener("click", handleClick);
      mount.innerHTML = "";
      if (typeof mount.removeAttribute === "function") {
        mount.removeAttribute("data-source-dossier-id");
        mount.removeAttribute("data-source-dossier-state");
        mount.removeAttribute("aria-busy");
      }
    }

    mount.addEventListener("click", handleClick);

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
