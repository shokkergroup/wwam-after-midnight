(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var EXPORT_SCHEMA = "shokker-receipt-matrix-export/v1";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function finite(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed)
      ? parsed
      : (fallback == null ? 0 : fallback);
  }

  function count(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0
      ? Math.floor(parsed)
      : Math.max(0, Math.floor(finite(fallback)));
  }

  function indexValue(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : -1;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatNumber(value) {
    return count(value).toLocaleString("en-US");
  }

  function formatTime(value) {
    var input = Math.max(0, finite(value));
    var rounded = Math.round(input * 100) / 100;
    var whole = Math.floor(rounded);
    var hours = Math.floor(whole / 3600);
    var minutes = Math.floor((whole % 3600) / 60);
    var seconds = whole % 60;
    var fraction = Math.round((rounded - whole) * 100);
    var suffix = fraction
      ? "." + String(fraction).padStart(2, "0").replace(/0$/, "")
      : "";
    return (hours ? String(hours).padStart(2, "0") + ":" : "") +
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0") + suffix;
  }

  function closestAction(node, boundary) {
    var current = node;
    while (current && current !== boundary) {
      if (typeof current.getAttribute === "function" &&
          current.getAttribute("data-receipt-matrix-action")) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function firstText(source, keys) {
    var input = record(source);
    for (var index = 0; index < keys.length; index += 1) {
      var value = clean(input[keys[index]]);
      if (value) return value;
    }
    return "";
  }

  function vocabulary(copyInput, route) {
    var supplied = Object.assign(
      {},
      record(copyInput),
      record(record(route).vocabulary)
    );
    return {
      eyebrow: firstText(supplied, ["eyebrow", "matrixEyebrow"]) ||
        "RECEIPT MATRIX // SOURCE-BY-SOURCE PROOF",
      title: firstText(supplied, ["title", "matrixTitle"]) ||
        "THE ANSWER, SPLIT BY SOURCE.",
      query: firstText(supplied, ["query", "queryLabel"]) || "QUESTION",
      uniqueSources: firstText(
        supplied,
        ["uniqueSources", "uniqueSourceLabel", "sourceCountLabel"]
      ) || "UNIQUE SOURCES",
      eligibleReceipts: firstText(
        supplied,
        ["eligibleReceipts", "eligibleReceiptLabel", "receiptCountLabel"]
      ) || "ELIGIBLE RECEIPTS",
      entityCoverage: firstText(
        supplied,
        ["entityCoverage", "entityCoverageLabel"]
      ) || "PER-ENTITY COVERAGE",
      sourceGroup: clean(record(route).groupLabel) ||
        firstText(supplied, ["sourceGroup", "groupLabel"]) ||
        "SOURCE GROUP",
      sourceProof: firstText(supplied, ["sourceProof", "sourceProofLabel"]) ||
        "EXPAND SOURCE PROOF",
      receiptProof: firstText(
        supplied,
        ["receiptProof", "receiptProofLabel"]
      ) || "EXPAND RECEIPT PROOF",
      play: firstText(supplied, ["play", "playLabel"]) ||
        "PLAY EXACT RECEIPT",
      openSource: firstText(supplied, ["openSource", "openSourceLabel"]) ||
        "OPEN SOURCE",
      openLineage: firstText(supplied, ["openLineage", "lineageLabel"]) ||
        "OPEN LINEAGE",
      export: firstText(supplied, ["export", "exportLabel"]) ||
        "EXPORT MATRIX",
      boundary: firstText(supplied, ["boundary", "boundaryLabel"]) ||
        "NON-IMPLICATION BOUNDARY",
      limitations: firstText(supplied, ["limitations", "limitationsLabel"]) ||
        "CURRENT LIMITATIONS",
      held: firstText(supplied, ["held", "heldTitle"]) ||
        "MATRIX HELD CLOSED.",
      insufficient: firstText(
        supplied,
        ["insufficient", "insufficientTitle"]
      ) || "NO ELIGIBLE RECEIPTS IN THIS SCOPE.",
      unknown: firstText(supplied, ["unknown", "unknownTitle"]) ||
        "THE REQUEST COULD NOT BE RESOLVED."
    };
  }

  function labelLookup(route) {
    var input = record(route);
    var ids = array(input.entityIds || record(input.matrix).entityIds).map(clean);
    var labels = input.entityLabels;
    var output = {};
    if (Array.isArray(labels)) {
      labels.forEach(function (entry, index) {
        if (entry && typeof entry === "object") {
          var id = clean(entry.entityId || entry.id);
          var label = clean(entry.label || entry.name);
          if (id && label) output[id] = label;
        } else if (ids[index] && clean(entry)) {
          output[ids[index]] = clean(entry);
        }
      });
    } else {
      Object.keys(record(labels)).forEach(function (key) {
        var label = clean(labels[key]);
        if (label) output[clean(key)] = label;
      });
    }
    return output;
  }

  function normalizeCoverage(entries, route, receipts) {
    var labels = labelLookup(route);
    var receiptList = array(receipts);
    return array(entries).map(function (entry) {
      var item = record(entry);
      var entityId = clean(item.entityId || item.id);
      if (!entityId) return null;
      var matchingReceipts = receiptList.filter(function (receipt) {
        var entities = array(
          receipt.matchedEntityIds || receipt.entityIds || receipt.entities
        ).map(clean);
        return entities.indexOf(entityId) >= 0;
      });
      return {
        entityId: entityId,
        label: clean(item.label || item.name) || labels[entityId] || entityId,
        type: clean(item.type),
        sourceCount: count(
          item.sourceCount != null
            ? item.sourceCount
            : item.uniqueSourceCount,
          matchingReceipts.length ? 1 : 0
        ),
        receiptCount: count(
          item.receiptCount != null
            ? item.receiptCount
            : item.eligibleReceiptCount,
          matchingReceipts.length
        ),
        receiptKeys: array(item.receiptKeys).map(clean).filter(Boolean)
      };
    }).filter(Boolean);
  }

  function exactReceipt(receipt, group) {
    var item = record(receipt);
    var parent = record(group);
    var sourceId = clean(item.sourceId || parent.sourceId);
    var groupSourceId = clean(parent.sourceId);
    var receiptKey = clean(item.receiptKey || item.key || item.receiptId);
    var at = finite(
      item.at != null
        ? item.at
        : (item.start != null ? item.start : item.t),
      -1
    );
    var end = finite(item.end, -1);
    if (!receiptKey || !sourceId || !groupSourceId ||
        sourceId !== groupSourceId || at < 0 || end <= at) {
      return null;
    }
    return {
      receiptKey: receiptKey,
      sourceId: sourceId,
      sourceTitle: clean(parent.sourceTitle || parent.title) || sourceId,
      officialUrl: clean(item.url || parent.officialUrl || parent.url),
      sourceFingerprint: clean(
        item.sourceFingerprint || parent.sourceFingerprint
      ),
      dossierFingerprint: clean(
        item.dossierFingerprint || parent.dossierFingerprint
      ),
      at: at,
      end: end,
      date: clean(item.date || parent.date),
      excerpt: clean(item.excerpt || item.context || item.description),
      label: clean(item.label || item.title) || receiptKey,
      kind: clean(item.kind),
      evidenceType: clean(item.evidenceType),
      evidenceLevel: clean(item.evidenceLevel),
      evidenceBasis: Array.isArray(item.evidenceBasis)
        ? item.evidenceBasis.map(clean).filter(Boolean)
        : clean(item.evidenceBasis),
      reviewState: clean(item.reviewState),
      speaker: item.speaker == null ? null : clean(item.speaker),
      speakerStatus: clean(item.speakerStatus) || "not-diarized",
      entityIds: array(item.entityIds).map(clean).filter(Boolean),
      matchedEntityIds: array(item.matchedEntityIds).map(clean).filter(Boolean),
      creatorApproved: item.creatorApproved === true,
      rightsCleared: item.rightsCleared === true,
      canonMutated: item.canonMutated === true,
      mediaCopied: item.mediaCopied === true
    };
  }

  function normalizeGroups(analysis, route) {
    return array(analysis.groups || analysis.sourceGroups)
      .map(function (entry, groupIndex) {
        var group = record(entry);
        var rawReceipts = array(group.receipts || group.items);
        var receipts = rawReceipts.map(function (receipt) {
          return exactReceipt(receipt, group);
        }).filter(Boolean);
        var rawCoverage = Array.isArray(group.entityCoverage)
          ? group.entityCoverage
          : array(group.perEntity || group.entities);
        if (!rawCoverage.length && record(group.entityCoverage).entityIds) {
          rawCoverage = array(group.entityCoverage.entityIds).map(function (id) {
            return { entityId: id };
          });
        }
        return {
          rank: count(group.rank, groupIndex + 1),
          sourceId: clean(group.sourceId || group.id),
          sourceTitle: clean(group.sourceTitle || group.title) ||
            clean(group.sourceId || group.id),
          date: clean(group.date || group.sourceDate),
          officialUrl: clean(group.officialUrl || group.url),
          sourceFingerprint: clean(group.sourceFingerprint),
          dossierFingerprint: clean(group.dossierFingerprint),
          receiptCount: count(group.receiptCount, receipts.length),
          coverage: normalizeCoverage(rawCoverage, route, rawReceipts),
          receipts: receipts,
          heldReceiptCount: Math.max(0, rawReceipts.length - receipts.length),
          raw: group
        };
      })
      .filter(function (group) {
        return group.sourceId;
      });
  }

  function analysisKind(analysis, groups, route) {
    var routeStatus = clean(record(route).status).toLowerCase();
    if (/(?:unknown|unresolved|unsupported)/.test(routeStatus)) {
      return "unknown";
    }
    if (!analysis || typeof analysis !== "object" ||
        Array.isArray(analysis)) return "held";
    var status = clean(analysis.status).toLowerCase();
    if (/(?:held|stale|invalid|error|unavailable|quarantined)/.test(status)) {
      return "held";
    }
    if (/(?:insufficient|empty|no[-_ ]?match|no[-_ ]?evidence)/.test(status)) {
      return "insufficient";
    }
    if (/(?:unknown|unresolved|unsupported)/.test(status)) return "unknown";
    var exactCount = groups.reduce(function (total, group) {
      return total + group.receipts.length;
    }, 0);
    var heldCount = groups.reduce(function (total, group) {
      return total + group.heldReceiptCount;
    }, 0);
    if (!exactCount && heldCount) return "held";
    if (!exactCount) return "insufficient";
    return "ready";
  }

  function stateCopy(kind, copy) {
    if (kind === "held") {
      return {
        title: copy.held,
        body:
          "The supplied analysis could not be rendered as exact source proof. No receipt action was enabled."
      };
    }
    if (kind === "unknown") {
      return {
        title: copy.unknown,
        body:
          "The current route does not identify a defensible source-and-entity matrix."
      };
    }
    return {
      title: copy.insufficient,
      body:
        "The current indexed scope returned no exact bounded receipts. That is not proof the subject never appeared."
    };
  }

  function boundaryMarkup(route, analysis, copy) {
    var warning = clean(record(route).chronologyWarning);
    var limitations = array(record(analysis).limitations)
      .map(clean)
      .filter(Boolean);
    return '<aside class="receipt-matrix__boundary" ' +
      'aria-label="Evidence non-implication boundary"><div><span>' +
      escapeHtml(copy.boundary) + '</span><p>Receipt membership in the same ' +
      'upload does not prove the same speaker, interaction, simultaneity, ' +
      'continuity, causality, or origin.</p></div>' +
      (warning ? '<p class="receipt-matrix__chronology">' +
        escapeHtml(warning) + '</p>' : "") +
      (limitations.length
        ? '<details><summary>' + escapeHtml(copy.limitations) + ' // ' +
          formatNumber(limitations.length) + '</summary><ul>' +
          limitations.map(function (limitation) {
            return '<li>' + escapeHtml(limitation) + '</li>';
          }).join("") + '</ul></details>'
        : "") +
      '</aside>';
  }

  function coverageMarkup(coverage, className, callbacks, copy) {
    if (!coverage.length) return "";
    return '<div class="' + className + '">' +
      coverage.map(function (entity, index) {
        var content = '<span>' + escapeHtml(entity.label) + '</span><b>' +
          formatNumber(entity.sourceCount) + ' ' +
          (entity.sourceCount === 1 ? "SOURCE" : "SOURCES") + ' // ' +
          formatNumber(entity.receiptCount) + ' ' +
          (entity.receiptCount === 1 ? "RECEIPT" : "RECEIPTS") + '</b>';
        if (!callbacks.lineage || !entity.entityId) {
          return '<div data-entity-id="' + escapeHtml(entity.entityId) +
            '">' + content + '</div>';
        }
        return '<button type="button" data-receipt-matrix-action="lineage" ' +
          'data-entity-index="' + index + '" data-entity-id="' +
          escapeHtml(entity.entityId) + '">' + content + '<i>' +
          escapeHtml(copy.openLineage) + '</i></button>';
      }).join("") + '</div>';
  }

  function proofValue(value, fallback) {
    return escapeHtml(clean(value) || fallback);
  }

  function receiptMarkup(receipt, groupIndex, receiptIndex, callbacks, copy) {
    var evidence = clean(receipt.evidenceLevel || receipt.evidenceType) ||
      "EVIDENCE LABEL NOT SUPPLIED";
    var review = clean(receipt.reviewState) || "REVIEW STATE NOT SUPPLIED";
    var basis = Array.isArray(receipt.evidenceBasis)
      ? receipt.evidenceBasis.join(" // ")
      : clean(receipt.evidenceBasis);
    return '<article class="receipt-matrix__receipt" data-receipt-key="' +
      escapeHtml(receipt.receiptKey) + '"><header><div><span>' +
      escapeHtml(receipt.label) + '</span><b>' +
      escapeHtml(receipt.date || "DATE NOT SUPPLIED") +
      '</b></div><h4>' + escapeHtml(receipt.sourceTitle) + '</h4></header>' +
      (receipt.excerpt
        ? '<p class="receipt-matrix__excerpt">' +
          escapeHtml(receipt.excerpt) + '</p>'
        : "") +
      '<dl class="receipt-matrix__receipt-facts"><div><dt>EXACT BOUND</dt><dd>' +
      escapeHtml(formatTime(receipt.at)) + ' &rarr; ' +
      escapeHtml(formatTime(receipt.end)) +
      '</dd></div><div><dt>EVIDENCE</dt><dd>' + escapeHtml(evidence) +
      '</dd></div><div><dt>SPEAKER</dt><dd>' +
      escapeHtml(receipt.speakerStatus.toUpperCase()) +
      '</dd></div></dl><div class="receipt-matrix__receipt-actions">' +
      (callbacks.play
        ? '<button type="button" data-receipt-matrix-action="play" ' +
          'data-group-index="' + groupIndex + '" data-receipt-index="' +
          receiptIndex + '">' + escapeHtml(copy.play) + '</button>'
        : "") +
      (callbacks.openSource
        ? '<button type="button" data-receipt-matrix-action="source" ' +
          'data-group-index="' + groupIndex + '" data-receipt-index="' +
          receiptIndex + '">' + escapeHtml(copy.openSource) + '</button>'
        : "") +
      '</div><details class="receipt-matrix__receipt-proof"><summary>' +
      escapeHtml(copy.receiptProof) +
      '</summary><dl><div><dt>RECEIPT KEY</dt><dd><code>' +
      escapeHtml(receipt.receiptKey) +
      '</code></dd></div><div><dt>SOURCE ID</dt><dd><code>' +
      escapeHtml(receipt.sourceId) +
      '</code></dd></div><div><dt>SOURCE FINGERPRINT</dt><dd><code>' +
      proofValue(receipt.sourceFingerprint, "NOT SUPPLIED") +
      '</code></dd></div><div><dt>DOSSIER FINGERPRINT</dt><dd><code>' +
      proofValue(receipt.dossierFingerprint, "NOT SUPPLIED") +
      '</code></dd></div><div><dt>REVIEW</dt><dd>' +
      escapeHtml(review) + '</dd></div>' +
      (basis
        ? '<div><dt>EVIDENCE BASIS</dt><dd>' + escapeHtml(basis) + '</dd></div>'
        : "") +
      '</dl></details></article>';
  }

  function groupMarkup(group, index, callbacks, copy) {
    var rank = group.rank || index + 1;
    return '<article class="receipt-matrix__group" data-source-id="' +
      escapeHtml(group.sourceId) + '"><header class="receipt-matrix__group-head">' +
      '<div><span>' + escapeHtml(copy.sourceGroup) + ' ' +
      String(rank).padStart(2, "0") + '</span><h3>' +
      escapeHtml(group.sourceTitle || group.sourceId) +
      '</h3><p>' + escapeHtml(group.date || "DATE NOT SUPPLIED") +
      '</p></div><div><b>' + formatNumber(group.receiptCount) +
      '</b><span>ELIGIBLE ' +
      (group.receiptCount === 1 ? "RECEIPT" : "RECEIPTS") +
      '</span></div></header>' +
      coverageMarkup(
        group.coverage,
        "receipt-matrix__group-coverage",
        { lineage: null },
        copy
      ) +
      '<details class="receipt-matrix__source-proof"><summary>' +
      escapeHtml(copy.sourceProof) +
      '</summary><dl><div><dt>SOURCE ID</dt><dd><code>' +
      escapeHtml(group.sourceId) +
      '</code></dd></div><div><dt>SOURCE FINGERPRINT</dt><dd><code>' +
      proofValue(group.sourceFingerprint, "NOT SUPPLIED") +
      '</code></dd></div><div><dt>DOSSIER FINGERPRINT</dt><dd><code>' +
      proofValue(group.dossierFingerprint, "NOT SUPPLIED") +
      '</code></dd></div></dl></details>' +
      (group.heldReceiptCount
        ? '<p class="receipt-matrix__held-row" role="note">' +
          formatNumber(group.heldReceiptCount) +
          ' RECEIPT ROW' + (group.heldReceiptCount === 1 ? "" : "S") +
          ' HELD // EXACT SOURCE ID, START, AND END ARE REQUIRED.</p>'
        : "") +
      '<div class="receipt-matrix__receipts">' +
      (group.receipts.length
        ? group.receipts.map(function (receipt, receiptIndex) {
          return receiptMarkup(receipt, index, receiptIndex, callbacks, copy);
        }).join("")
        : '<p class="receipt-matrix__empty-group">NO EXACT BOUNDED RECEIPT ' +
          'ROWS ARE ELIGIBLE IN THIS SOURCE GROUP.</p>') +
      '</div></article>';
  }

  function create(options) {
    var input = options || {};
    var mount = input.mount;
    var callbacks = {
      play: typeof input.onPlay === "function" ? input.onPlay : null,
      openSource: typeof input.onOpenSource === "function"
        ? input.onOpenSource
        : null,
      lineage: typeof input.onOpenLineage === "function"
        ? input.onOpenLineage
        : null,
      exportMatrix: typeof input.onExport === "function"
        ? input.onExport
        : null
    };
    var copyInput = record(input.copy);
    var state = {
      open: false,
      destroyed: false,
      query: "",
      route: {},
      analysis: {},
      groups: [],
      coverage: [],
      uniqueSourceCount: 0,
      eligibleReceiptCount: 0,
      kind: "idle",
      launcher: null,
      status: "",
      error: ""
    };

    if (!mount || typeof mount.addEventListener !== "function") {
      throw new Error("Receipt Matrix UI requires a mount element.");
    }

    function setMountState(value) {
      if (typeof mount.setAttribute === "function") {
        mount.setAttribute("data-receipt-matrix-state", value);
      }
    }

    function clearMountState() {
      if (typeof mount.removeAttribute === "function") {
        mount.removeAttribute("data-receipt-matrix-state");
      }
    }

    function currentCopy() {
      return vocabulary(copyInput, state.route);
    }

    function summaryMarkup(copy) {
      return '<dl class="receipt-matrix__totals" aria-label="Receipt matrix totals">' +
        '<div><dt>' + escapeHtml(copy.uniqueSources) + '</dt><dd>' +
        formatNumber(state.uniqueSourceCount) +
        '</dd></div><div><dt>' + escapeHtml(copy.eligibleReceipts) +
        '</dt><dd>' + formatNumber(state.eligibleReceiptCount) +
        '</dd></div></dl><p class="receipt-matrix__verdict"><strong>' +
        formatNumber(state.uniqueSourceCount) + ' ' +
        escapeHtml(copy.uniqueSources.toLowerCase()) + '.</strong> <b>' +
        formatNumber(state.eligibleReceiptCount) + ' ' +
        escapeHtml(copy.eligibleReceipts.toLowerCase()) +
        '.</b> Receipts remain grouped by source so repeated evidence inside ' +
        'one upload cannot inflate source coverage.</p>';
    }

    function routeMetadata() {
      var mode = clean(state.route.mode);
      var shape = clean(state.route.answerShape);
      if (!mode && !shape) return "";
      return '<p class="receipt-matrix__route">' +
        (mode ? '<span>MODE // ' + escapeHtml(mode.toUpperCase()) + '</span>' : "") +
        (shape ? '<span>ANSWER SHAPE // ' +
          escapeHtml(shape.toUpperCase()) + '</span>' : "") +
        '</p>';
    }

    function renderEmpty(copy) {
      var message = stateCopy(state.kind, copy);
      return '<div class="receipt-matrix__empty" role="' +
        (state.kind === "held" ? "alert" : "status") + '"><h3>' +
        escapeHtml(message.title) + '</h3><p>' +
        escapeHtml(message.body) + '</p></div>';
    }

    function render() {
      if (state.destroyed) return;
      if (!state.open) {
        mount.innerHTML = "";
        clearMountState();
        return;
      }
      var copy = currentCopy();
      setMountState(state.error ? "error" : state.kind);
      mount.innerHTML = '<section class="receipt-matrix" ' +
        'aria-labelledby="receiptMatrixHeading"><header ' +
        'class="receipt-matrix__hero"><span>' +
        escapeHtml(copy.eyebrow) + '</span><h2 id="receiptMatrixHeading" ' +
        'tabindex="-1">' + escapeHtml(copy.title) +
        '</h2><p class="receipt-matrix__query"><b>' +
        escapeHtml(copy.query) + '</b><q>' +
        escapeHtml(state.query || "QUERY NOT SUPPLIED") +
        '</q></p>' + routeMetadata() + summaryMarkup(copy) + '</header>' +
        boundaryMarkup(state.route, state.analysis, copy) +
        (state.kind === "ready"
          ? '<section class="receipt-matrix__entity-summary" ' +
            'aria-labelledby="receiptMatrixEntityHeading"><h3 ' +
            'id="receiptMatrixEntityHeading">' +
            escapeHtml(copy.entityCoverage) + '</h3>' +
            coverageMarkup(
              state.coverage,
              "receipt-matrix__entities",
              callbacks,
              copy
            ) + '</section><div class="receipt-matrix__groups" ' +
            'aria-label="Source groups in answer order">' +
            state.groups.map(function (group, index) {
              return groupMarkup(group, index, callbacks, copy);
            }).join("") + '</div>'
          : renderEmpty(copy)) +
        (callbacks.exportMatrix && state.kind === "ready"
          ? '<footer class="receipt-matrix__footer"><button type="button" ' +
            'data-receipt-matrix-action="export">' +
            escapeHtml(copy.export) + '</button></footer>'
          : "") +
        '<p id="receiptMatrixStatus" class="receipt-matrix__status' +
        (state.error ? " is-error" : "") +
        '" role="status" aria-live="polite" aria-atomic="true">' +
        escapeHtml(state.error || state.status) + '</p></section>';
    }

    function focusHeading() {
      var heading = typeof mount.querySelector === "function"
        ? mount.querySelector("#receiptMatrixHeading")
        : null;
      if (heading && typeof heading.focus === "function") heading.focus();
    }

    function updateStatus(message, isError) {
      state.status = isError ? "" : clean(message);
      state.error = isError ? clean(message) : "";
      setMountState(isError ? "error" : state.kind);
      var status = typeof mount.querySelector === "function"
        ? mount.querySelector("#receiptMatrixStatus")
        : null;
      if (status) {
        status.textContent = state.error || state.status;
        if (typeof status.setAttribute === "function") {
          status.setAttribute("class", "receipt-matrix__status" +
            (state.error ? " is-error" : ""));
        }
      }
    }

    function invoke(callback, args, success, failure) {
      if (!callback) return;
      try {
        var result = callback.apply(null, args);
        if (result && typeof result.then === "function") {
          Promise.resolve(result).then(function () {
            updateStatus(success, false);
          }, function () {
            updateStatus(failure, true);
          });
        } else {
          updateStatus(success, false);
        }
      } catch {
        updateStatus(failure, true);
      }
    }

    function selectedReceipt(node) {
      var groupIndex = indexValue(node.getAttribute("data-group-index"));
      var receiptIndex = indexValue(node.getAttribute("data-receipt-index"));
      var group = state.groups[groupIndex];
      var receipt = group && group.receipts[receiptIndex];
      return receipt ? { group: group, receipt: receipt } : null;
    }

    function play(node) {
      var selected = selectedReceipt(node);
      if (!selected) {
        updateStatus(
          "RECEIPT HELD // EXACT SOURCE ID, START, AND END ARE REQUIRED.",
          true
        );
        return;
      }
      invoke(
        callbacks.play,
        [selected.receipt, selected.group.raw, state.analysis],
        "EXACT RECEIPT HANDED TO THE HOST PLAYER.",
        "THE HOST PLAYER DID NOT ACCEPT THIS EXACT RECEIPT."
      );
    }

    function openSource(node) {
      var selected = selectedReceipt(node);
      if (!selected) {
        updateStatus("SOURCE HANDOFF HELD // RECEIPT COULD NOT BE RESOLVED.", true);
        return;
      }
      invoke(
        callbacks.openSource,
        [{
          sourceId: selected.receipt.sourceId,
          at: selected.receipt.at,
          end: selected.receipt.end,
          receiptKey: selected.receipt.receiptKey,
          sourceFingerprint: selected.receipt.sourceFingerprint,
          dossierFingerprint: selected.receipt.dossierFingerprint,
          officialUrl: selected.receipt.officialUrl
        }, selected.group.raw, selected.receipt],
        "EXACT SOURCE POSITION HANDED TO THE HOST.",
        "THE SOURCE HOST DID NOT ACCEPT THIS RECEIPT."
      );
    }

    function openLineage(node) {
      var index = indexValue(node.getAttribute("data-entity-index"));
      var entity = state.coverage[index];
      if (!entity) {
        updateStatus("LINEAGE HANDOFF HELD // ENTITY COULD NOT BE RESOLVED.", true);
        return;
      }
      invoke(
        callbacks.lineage,
        [{
          entityId: entity.entityId,
          label: entity.label,
          sourceCount: entity.sourceCount,
          receiptCount: entity.receiptCount,
          query: state.query
        }, state.route, state.analysis],
        "ENTITY COVERAGE HANDED TO THE LINEAGE HOST.",
        "THE LINEAGE HOST DID NOT ACCEPT THIS ENTITY."
      );
    }

    function exportPayload() {
      return {
        schema: EXPORT_SCHEMA,
        query: state.query,
        route: state.route,
        analysis: state.analysis,
        rendered: {
          uniqueSourceCount: state.uniqueSourceCount,
          eligibleReceiptCount: state.eligibleReceiptCount,
          groupSourceIds: state.groups.map(function (group) {
            return group.sourceId;
          }),
          entityIds: state.coverage.map(function (entity) {
            return entity.entityId;
          }),
          state: state.kind
        },
        boundary:
          "Receipt membership in the same upload does not prove the same speaker, interaction, simultaneity, continuity, causality, or origin."
      };
    }

    function exportMatrix() {
      invoke(
        callbacks.exportMatrix,
        [exportPayload()],
        "RECEIPT MATRIX HANDED TO THE EXPORT HOST.",
        "THE EXPORT HOST DID NOT ACCEPT THIS MATRIX."
      );
    }

    function clickHandler(event) {
      if (!state.open || state.destroyed) return;
      var actionNode = closestAction(event && event.target, mount);
      if (!actionNode) return;
      var action = actionNode.getAttribute("data-receipt-matrix-action");
      if (action === "play") play(actionNode);
      else if (action === "source") openSource(actionNode);
      else if (action === "lineage") openLineage(actionNode);
      else if (action === "export") exportMatrix();
    }

    function launcherCanFocus() {
      return Boolean(
        state.launcher &&
        typeof state.launcher.focus === "function" &&
        state.launcher.disabled !== true &&
        state.launcher.isConnected !== false
      );
    }

    function keydownHandler(event) {
      if (!event || !state.open || event.key !== "Escape" ||
          event.defaultPrevented || event.altKey || event.ctrlKey ||
          event.metaKey || event.shiftKey || !launcherCanFocus()) return;
      if (typeof event.preventDefault === "function") event.preventDefault();
      if (typeof event.stopPropagation === "function") event.stopPropagation();
      state.launcher.focus();
      updateStatus("FOCUS RETURNED TO THE ASK LAUNCHER.", false);
    }

    function open(config) {
      if (state.destroyed) {
        throw new Error("Receipt Matrix UI has been destroyed.");
      }
      var request = record(config);
      state.query = clean(request.query);
      state.route = record(request.route);
      state.analysis = record(request.analysis);
      state.groups = normalizeGroups(state.analysis, state.route);
      var rawCoverage = array(
        state.analysis.entityCoverage ||
        state.analysis.entityTotals ||
        state.analysis.perEntity
      );
      var allRawReceipts = state.groups.reduce(function (receipts, group) {
        return receipts.concat(array(group.raw.receipts || group.raw.items));
      }, []);
      state.coverage = normalizeCoverage(
        rawCoverage,
        state.route,
        allRawReceipts
      );
      state.uniqueSourceCount = count(
        state.analysis.uniqueSourceCount,
        state.groups.length
      );
      state.eligibleReceiptCount = count(
        state.analysis.eligibleReceiptCount,
        state.groups.reduce(function (total, group) {
          return total + group.receipts.length;
        }, 0)
      );
      state.kind = analysisKind(request.analysis, state.groups, state.route);
      state.launcher = request.launcher || null;
      state.status = "";
      state.error = "";
      state.open = true;
      render();
      focusHeading();
      return getState();
    }

    function getState() {
      return {
        open: state.open,
        destroyed: state.destroyed,
        query: state.query,
        kind: state.kind,
        uniqueSourceCount: state.uniqueSourceCount,
        eligibleReceiptCount: state.eligibleReceiptCount,
        groupCount: state.groups.length,
        entityCount: state.coverage.length,
        status: state.status,
        error: state.error
      };
    }

    function destroy() {
      if (state.destroyed) return;
      mount.removeEventListener("click", clickHandler);
      mount.removeEventListener("keydown", keydownHandler);
      state.destroyed = true;
      state.open = false;
      mount.innerHTML = "";
      clearMountState();
    }

    mount.addEventListener("click", clickHandler);
    mount.addEventListener("keydown", keydownHandler);

    return Object.freeze({
      VERSION: VERSION,
      open: open,
      destroy: destroy,
      getState: getState
    });
  }

  root.ShokkerReceiptMatrixUI = Object.freeze({
    VERSION: VERSION,
    EXPORT_SCHEMA: EXPORT_SCHEMA,
    create: create
  });
})(typeof window !== "undefined" ? window : globalThis);
