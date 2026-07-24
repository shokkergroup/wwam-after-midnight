(function (root) {
  "use strict";

  /*
   * MEMORY CUT
   *
   * A channel-neutral compiler for small, ordered editorial routes through
   * canonical Source Dossier receipts. It copies no media, invents no
   * transitions, promotes no evidence, identifies no speaker, and publishes
   * nothing. A successful cut is reproducible source navigation, not a recap.
   */

  var VERSION = "1.0.0";
  var REQUEST_SCHEMA = "shokker-memory-cut-request/v1";
  var CUT_SCHEMA = "shokker-memory-cut/v1";
  var SHARE_SCHEMA = "shokker-memory-cut-share/v1";
  var EDIT_BRIEF_SCHEMA = "shokker-memory-cut-edit-brief/v1";
  var DOSSIER_SCHEMA = "shokker-source-dossier/v1";
  var MIN_STOPS = 3;
  var MAX_STOPS = 8;
  var RESOLVE_TOLERANCE_SECONDS = 0.55;
  var VIEWER_TEXT_LABEL = "VIEWER-WRITTEN // NOT ARCHIVE EVIDENCE";
  var PRESETS = {
    characterWard: {
      id: "character-ward",
      title: "THE CHARACTER WARD // 2021–2026",
      introduction:
        "Five source-locked character-performance windows. No performer attribution, continuity, or generated dialogue.",
      selections: [
        {
          sourceId: "Mf-0Tv_KHCE",
          receiptKey: "character-receipt:slender-stomach",
          at: 541.04,
          end: 555.04
        },
        {
          sourceId: "lCH31VtaSeI",
          receiptKey: "character-receipt:challis-boilermaker",
          at: 6511.44,
          end: 6525.44
        },
        {
          sourceId: "Qc2vVFMO4ts",
          receiptKey: "character-receipt:loomis-biscuit-job",
          at: 7693.02,
          end: 7707.02
        },
        {
          sourceId: "shoWljlgSUU",
          receiptKey: "character-receipt:feldman-atmosphere",
          at: 8097.2,
          end: 8111.2
        },
        {
          sourceId: "LV2rmwEA0w4",
          receiptKey: "character-receipt:loomis-funding",
          at: 9042.64,
          end: 9056.64
        }
      ]
    }
  };
  var PROHIBITED_AUTHORITY =
    /\b(?:creator[- ]approved|rights?[- ]cleared|speaker[- ]verified|canon[- ]promoted|published|official final cut)\b/i;

  function MemoryCutError(code, message, path) {
    this.name = "MemoryCutError";
    this.code = code;
    this.message = message;
    this.path = path || "";
    if (Error.captureStackTrace) Error.captureStackTrace(this, MemoryCutError);
  }
  MemoryCutError.prototype = Object.create(Error.prototype);
  MemoryCutError.prototype.constructor = MemoryCutError;

  function fail(code, message, path) {
    throw new MemoryCutError(code, message, path);
  }

  function own(record, key) {
    return Object.prototype.hasOwnProperty.call(record, key);
  }

  function record(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function clean(value, maximum) {
    var output = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    if (maximum && output.length > maximum) output = output.slice(0, maximum).trim();
    return output;
  }

  function requiredText(value, path, maximum) {
    var output = clean(value, maximum);
    if (!output) fail("REQUIRED_TEXT", path + " must be non-empty.", path);
    if (PROHIBITED_AUTHORITY.test(output)) {
      fail("AUTHORITY_INFLATION", path + " claims authority this compiler cannot grant.", path);
    }
    return output;
  }

  function finite(value, path) {
    var output = Number(value);
    if (!Number.isFinite(output)) fail("INVALID_NUMBER", path + " must be finite.", path);
    return output;
  }

  function exactKeys(value, keys, path) {
    if (!record(value)) fail("INVALID_OBJECT", path + " must be an object.", path);
    var allowed = new Set(keys);
    Object.keys(value).forEach(function (key) {
      if (!allowed.has(key)) {
        fail("UNEXPECTED_FIELD", path + "." + key + " is not part of this schema.", path + "." + key);
      }
    });
    keys.forEach(function (key) {
      if (!own(value, key)) {
        fail("MISSING_FIELD", path + "." + key + " is required.", path + "." + key);
      }
    });
  }

  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (!value || typeof value !== "object") return value;
    return Object.keys(value).sort().reduce(function (output, key) {
      output[key] = canonical(value[key]);
      return output;
    }, {});
  }

  function stableJson(value) {
    try {
      return JSON.stringify(canonical(value));
    } catch {
      fail("NON_JSON_INPUT", "The value must be finite, acyclic JSON data.");
    }
  }

  function serial(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      fail("NON_JSON_INPUT", "The value must be finite, acyclic JSON data.");
    }
  }

  function fnv1a(value) {
    var text = String(value);
    var hash = 0x811c9dc5;
    for (var index = 0; index < text.length; index += 1) {
      var code = text.charCodeAt(index);
      hash ^= code & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= code >>> 8;
      hash = Math.imul(hash, 0x01000193);
    }
    return "fnv1a32:" + (hash >>> 0).toString(16).padStart(8, "0");
  }

  function freezeDeep(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function (key) { freezeDeep(value[key]); });
    return value;
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function sameNumber(left, right) {
    return Math.abs(Number(left) - Number(right)) <= 0.000001;
  }

  function publicSourceSnapshot(value) {
    var state = clean(value).toLowerCase();
    return Boolean(state) &&
      !/(?:unavailable|private|deleted|removed|blocked|members[- ]only)/.test(state);
  }

  function selectionCoordinate(raw, path) {
    var supplied = [];
    ["at", "start", "t"].forEach(function (key) {
      if (own(raw, key) && raw[key] != null && raw[key] !== "") {
        supplied.push([key, finite(raw[key], path + "." + key)]);
      }
    });
    if (supplied.length > 1 && supplied.some(function (entry) {
      return !sameNumber(entry[1], supplied[0][1]);
    })) {
      fail("CONFLICTING_COORDINATE", path + " supplies conflicting start coordinates.", path);
    }
    return supplied.length ? supplied[0][1] : null;
  }

  function sourceIdFor(raw, path) {
    var sourceId = clean(raw.sourceId || raw.id, 64);
    if (raw.sourceId && raw.id && clean(raw.sourceId) !== clean(raw.id)) {
      fail("FOREIGN_SELECTION", path + " supplies two different source IDs.", path);
    }
    if (!sourceId) fail("SOURCE_ID_REQUIRED", path + " requires sourceId or id.", path);
    return sourceId;
  }

  function markdownText(value) {
    return clean(value).replace(/([\\`*_[\]<>])/g, "\\$1");
  }

  function markdownCell(value) {
    return markdownText(value).replace(/\|/g, "\\|");
  }

  function create(options) {
    if (!record(options) || !options.dossierEngine) {
      fail("INVALID_DOSSIER_ENGINE", "create requires options.dossierEngine.", "options");
    }
    var dossierEngine = options.dossierEngine;
    if (typeof dossierEngine.build !== "function" ||
        typeof dossierEngine.list !== "function" ||
        typeof dossierEngine.getStats !== "function") {
      fail(
        "INVALID_DOSSIER_ENGINE",
        "The canonical Source Dossier engine must provide build, list, and getStats.",
        "options.dossierEngine"
      );
    }

    var listed;
    try {
      listed = dossierEngine.list();
    } catch {
      fail("REGISTRY_READ_FAILED", "The canonical source registry could not be read.");
    }
    if (!Array.isArray(listed) || !listed.length) {
      fail("EMPTY_REGISTRY", "The canonical source registry is empty.");
    }

    var sources = new Map();
    var receipts = new Map();
    var bindings = null;
    var quarantinedSources = 0;
    var withheldReceipts = 0;
    var eligibleSources = 0;
    var eligibleReceipts = 0;

    listed.forEach(function (listedSource, listedIndex) {
      if (!record(listedSource)) {
        fail("FOREIGN_REGISTRY", "Registry source " + listedIndex + " is malformed.");
      }
      var sourceId = requiredText(listedSource.id, "registry[" + listedIndex + "].id", 64);
      if (sources.has(sourceId)) {
        fail("DUPLICATE_SOURCE", "The canonical registry repeats source " + sourceId + ".");
      }
      var dossier;
      try {
        dossier = dossierEngine.build(sourceId);
      } catch {
        fail("SOURCE_BUILD_FAILED", "Canonical source " + sourceId + " could not be built.");
      }
      if (!record(dossier) || dossier.schema !== DOSSIER_SCHEMA ||
          !record(dossier.bindings) || !record(dossier.source) || !record(dossier.proof)) {
        fail("FOREIGN_DOSSIER", "Source " + sourceId + " is not a canonical Source Dossier.");
      }
      if (dossier.source.id !== sourceId ||
          dossier.source.sourceFingerprint !== listedSource.sourceFingerprint) {
        fail("STALE_REGISTRY", "Source " + sourceId + " disagrees with its registry fingerprint.");
      }
      if (!bindings) {
        bindings = {
          channelId: requiredText(dossier.bindings.channelId, "bindings.channelId", 120),
          channelLabel: requiredText(dossier.bindings.channelLabel, "bindings.channelLabel", 240),
          channelPackFingerprint: requiredText(
            dossier.bindings.channelPackFingerprint,
            "bindings.channelPackFingerprint",
            160
          ),
          snapshotDate: requiredText(dossier.bindings.snapshotDate, "bindings.snapshotDate", 20),
          archiveFingerprint: requiredText(
            dossier.bindings.archiveFingerprint,
            "bindings.archiveFingerprint",
            160
          )
        };
      } else if (
        dossier.bindings.channelId !== bindings.channelId ||
        dossier.bindings.channelPackFingerprint !== bindings.channelPackFingerprint ||
        dossier.bindings.snapshotDate !== bindings.snapshotDate ||
        dossier.bindings.archiveFingerprint !== bindings.archiveFingerprint
      ) {
        fail("FOREIGN_REGISTRY", "The registry mixes incompatible source bindings.");
      }
      if (dossier.proof.creatorApproved !== false ||
          dossier.proof.rightsCleared !== false ||
          dossier.proof.speakerDiarized !== false ||
          dossier.proof.canonPromotedByDossier !== false) {
        fail("AUTHORITY_INFLATION", "Source " + sourceId + " overstates dossier authority.");
      }
      if (!Array.isArray(dossier.source.receipts)) {
        fail("FOREIGN_DOSSIER", "Source " + sourceId + " has no canonical receipt list.");
      }
      var duration = finite(dossier.source.duration, "source.duration");
      dossier.source.receipts.forEach(function (receipt, receiptIndex) {
        if (!record(receipt)) {
          fail("FOREIGN_RECEIPT", "Source " + sourceId + " has a malformed receipt.");
        }
        var key = requiredText(
          receipt.key,
          "source[" + sourceId + "].receipts[" + receiptIndex + "].key",
          240
        );
        if (receipts.has(key)) {
          fail("DUPLICATE_GLOBAL_RECEIPT", "Canonical receipt " + key + " is not unique.");
        }
        var at = finite(receipt.at, "receipt.at");
        var end = finite(receipt.end, "receipt.end");
        if (at < 0 || end <= at || end > duration + 1) {
          fail("RECEIPT_OUT_OF_RANGE", "Canonical receipt " + key + " has invalid bounds.");
        }
        var entry = {
          key: key,
          sourceId: sourceId,
          sourceFingerprint: dossier.source.sourceFingerprint,
          dossierFingerprint: requiredText(dossier.fingerprint, "dossier.fingerprint", 160),
          source: dossier.source,
          proof: dossier.proof,
          receipt: receipt
        };
        receipts.set(key, entry);
        if (receipt.publicExcerptAllowed !== true) withheldReceipts += 1;
      });
      var quarantined = dossier.source.authority === "quarantined-lane" ||
        dossier.proof.quarantined === true;
      if (quarantined) quarantinedSources += 1;
      var promoted = dossier.source.authority === "promoted-lane" &&
        dossier.source.coverage === "caption-backed" &&
        !quarantined && publicSourceSnapshot(dossier.source.availability);
      if (promoted) {
        eligibleSources += 1;
        dossier.source.receipts.forEach(function (receipt) {
          if (receipt.publicExcerptAllowed === true &&
              !/quarantin|withheld|reject/i.test(clean(receipt.reviewState))) {
            eligibleReceipts += 1;
          }
        });
      }
      sources.set(sourceId, {
        listed: listedSource,
        dossier: dossier
      });
    });

    var registryFingerprint = fnv1a(stableJson({
      bindings: bindings,
      sources: Array.from(sources.keys()).sort().map(function (sourceId) {
        var source = sources.get(sourceId).dossier.source;
        return [source.id, source.sourceFingerprint];
      }),
      receipts: Array.from(receipts.values()).map(function (entry) {
        return [
          entry.key,
          entry.sourceId,
          entry.receipt.at,
          entry.receipt.end,
          entry.receipt.publicExcerptAllowed
        ];
      }).sort(function (left, right) {
        return left[0].localeCompare(right[0]);
      })
    }));
    bindings.registryFingerprint = registryFingerprint;
    freezeDeep(bindings);

    function requireBindings(candidate, path) {
      if (!record(candidate)) fail("INVALID_BINDINGS", path + " must be an object.", path);
      [
        "channelId",
        "channelLabel",
        "channelPackFingerprint",
        "snapshotDate",
        "archiveFingerprint",
        "registryFingerprint"
      ].forEach(function (key) {
        if (candidate[key] !== bindings[key]) {
          var code = key === "channelId" || key === "channelLabel" ||
            key === "channelPackFingerprint" ?
            "FOREIGN_BINDINGS" : "STALE_REGISTRY";
          fail(code, path + "." + key + " does not match the canonical registry.", path + "." + key);
        }
      });
    }

    function requireEligible(entry) {
      var source = entry.source;
      var proof = entry.proof;
      var receipt = entry.receipt;
      if (source.authority === "quarantined-lane" || proof.quarantined === true ||
          /quarantin/i.test(clean(receipt.reviewState))) {
        fail("QUARANTINED_RECEIPT", "Receipt " + entry.key + " remains quarantined.");
      }
      if (source.authority !== "promoted-lane") {
        fail("UNPROMOTED_SOURCE", "Receipt " + entry.key + " is not in a promoted source lane.");
      }
      if (source.coverage !== "caption-backed") {
        fail("INSUFFICIENT_COVERAGE", "Receipt " + entry.key + " lacks caption-backed coverage.");
      }
      if (!publicSourceSnapshot(source.availability)) {
        fail("UNAVAILABLE_SOURCE", "Receipt " + entry.key + " is not in a public source snapshot.");
      }
      if (receipt.publicExcerptAllowed !== true ||
          /withheld|reject/i.test(clean(receipt.reviewState))) {
        fail("WITHHELD_RECEIPT", "Receipt " + entry.key + " is withheld from public cut use.");
      }
      if (receipt.speaker !== null || receipt.speakerStatus !== "not-diarized") {
        fail("SPEAKER_BOUNDARY", "Receipt " + entry.key + " overstates speaker identity.");
      }
      return entry;
    }

    function selectionEntry(selection, path) {
      if (!record(selection)) fail("INVALID_SELECTION", path + " must be an object.", path);
      var sourceId = sourceIdFor(selection, path);
      var sourceEntry = sources.get(sourceId);
      if (!sourceEntry) fail("UNKNOWN_SOURCE", "Source " + sourceId + " is not registered.", path);
      var sourceFingerprint = clean(selection.sourceFingerprint);
      if (sourceFingerprint &&
          sourceFingerprint !== sourceEntry.dossier.source.sourceFingerprint) {
        fail("STALE_SOURCE", "Source " + sourceId + " has changed since selection.", path);
      }
      var key = clean(selection.receiptKey || selection.key, 240);
      var at = selectionCoordinate(selection, path);
      var end = own(selection, "end") && selection.end != null ?
        finite(selection.end, path + ".end") : null;
      var entry;
      if (key) {
        entry = receipts.get(key);
        if (!entry) fail("UNKNOWN_RECEIPT", "Receipt " + key + " is not registered.", path);
        if (entry.sourceId !== sourceId) {
          fail("FOREIGN_RECEIPT", "Receipt " + key + " does not belong to source " + sourceId + ".", path);
        }
        if (at != null &&
            Math.abs(Number(entry.receipt.at) - at) >
              RESOLVE_TOLERANCE_SECONDS + 0.000001) {
          fail("COORDINATE_MISMATCH", "Receipt " + key + " does not match the selected second.", path);
        }
      } else {
        if (at == null) {
          fail("RECEIPT_KEY_OR_AT_REQUIRED", path + " requires receiptKey or a source coordinate.", path);
        }
        var candidates = sourceEntry.dossier.source.receipts.filter(function (receipt) {
          return Math.abs(Number(receipt.at) - at) <=
            RESOLVE_TOLERANCE_SECONDS + 0.000001;
        });
        if (!candidates.length) {
          fail("UNKNOWN_RECEIPT", "No canonical receipt resolves at this source coordinate.", path);
        }
        if (candidates.length > 1) {
          fail("AMBIGUOUS_RECEIPT", "More than one canonical receipt resolves at this coordinate.", path);
        }
        entry = receipts.get(candidates[0].key);
      }
      if (end != null && !sameNumber(end, entry.receipt.end)) {
        fail("END_MISMATCH", "The supplied end does not match the canonical receipt.", path + ".end");
      }
      return requireEligible(entry);
    }

    function resolveSelection(selection) {
      return selectionEntry(selection, "selection").key;
    }

    function cutBody(title, introduction, selected) {
      var stops = selected.map(function (entry, inputIndex) {
        var source = entry.source;
        var receipt = entry.receipt;
        return {
          inputIndex: inputIndex,
          order: inputIndex + 1,
          key: entry.key,
          sourceId: entry.sourceId,
          sourceFingerprint: entry.sourceFingerprint,
          dossierFingerprint: entry.dossierFingerprint,
          title: source.displayTitle || source.title,
          sourceTitle: source.title,
          date: source.date,
          at: receipt.at,
          start: receipt.at,
          end: receipt.end,
          duration: receipt.end - receipt.at,
          url: receipt.url,
          officialUrl: source.url,
          label: receipt.label,
          kind: receipt.kind,
          excerpt: receipt.excerpt,
          evidenceType: receipt.evidenceType,
          evidenceLevel: receipt.evidenceLevel,
          evidenceBasis: receipt.evidenceBasis,
          reviewState: receipt.reviewState,
          entityIds: receipt.entityIds.slice(),
          entities: receipt.entityIds.slice(),
          authority: source.authority,
          coverage: source.coverage,
          publicExcerptAllowed: true,
          sourcePromoted: true,
          quarantined: false,
          speaker: null,
          speakerStatus: "not-diarized",
          creatorApproved: false,
          rightsCleared: false,
          copiedMediaIncluded: false
        };
      });
      var dates = stops.map(function (stop) { return stop.date; }).sort();
      var evidenceTypes = unique(stops.map(function (stop) {
        return stop.evidenceType;
      })).sort();
      return {
        schema: CUT_SCHEMA,
        version: VERSION,
        status: "ready",
        eligible: true,
        title: title,
        introduction: introduction,
        viewerTextLabel: VIEWER_TEXT_LABEL,
        bindings: serial(bindings),
        stops: stops,
        held: [],
        stats: {
          stopCount: stops.length,
          sourceCount: unique(stops.map(function (stop) { return stop.sourceId; })).length,
          receiptCount: stops.length,
          runTimeSeconds: stops.reduce(function (total, stop) {
            return total + stop.duration;
          }, 0),
          firstSourceDate: dates[0],
          lastSourceDate: dates[dates.length - 1],
          evidenceTypes: evidenceTypes
        },
        boundary: {
          exactSourceNavigation: true,
          explicitEditorialOrder: true,
          canonicalReceiptsOnly: true,
          transcriptIncluded: false,
          copiedMediaIncluded: false,
          mediaDownloaded: false,
          generatedNarrationIncluded: false,
          speakerVerified: false,
          speakerContinuity: false,
          performerVerified: false,
          creatorApproved: false,
          creatorApproval: false,
          rightsCleared: false,
          canonPromoted: false,
          canonMutated: false,
          published: false,
          mediaCopied: false,
          trueOrigin: false,
          causality: false,
          opinionChange: false,
          continuityEstablished: false,
          causalityEstablished: false,
          opinionChangeEstablished: false,
          statement: "An ordered official-source navigation draft; not a recap, final edit, or authority claim."
        }
      };
    }

    function compile(request) {
      if (!record(request)) fail("INVALID_REQUEST", "compile requires a request object.", "request");
      if (request.schema && request.schema !== REQUEST_SCHEMA) {
        fail("FOREIGN_SCHEMA", "The memory-cut request schema is unsupported.", "request.schema");
      }
      if (request.bindings) requireBindings(request.bindings, "request.bindings");
      if (!Array.isArray(request.selections)) {
        fail("SELECTIONS_REQUIRED", "request.selections must be an ordered array.", "request.selections");
      }
      if (request.selections.length < MIN_STOPS || request.selections.length > MAX_STOPS) {
        fail(
          "INVALID_STOP_COUNT",
          "A memory cut requires " + MIN_STOPS + " to " + MAX_STOPS + " receipts.",
          "request.selections"
        );
      }
      var title = requiredText(request.title, "request.title", 180);
      var introduction = clean(request.introduction, 600);
      if (PROHIBITED_AUTHORITY.test(introduction)) {
        fail(
          "AUTHORITY_INFLATION",
          "request.introduction claims authority this compiler cannot grant.",
          "request.introduction"
        );
      }
      var selected = request.selections.map(function (selection, index) {
        return selectionEntry(selection, "request.selections[" + index + "]");
      });
      var keys = selected.map(function (entry) { return entry.key; });
      if (new Set(keys).size !== keys.length) {
        fail("DUPLICATE_RECEIPT", "A memory cut cannot repeat a receipt.", "request.selections");
      }
      var output = cutBody(title, introduction, selected);
      output.fingerprint = fnv1a(stableJson(output));
      return freezeDeep(output);
    }

    function canonicalCut(cut, path) {
      if (!record(cut) || cut.schema !== CUT_SCHEMA || cut.version !== VERSION ||
          cut.status !== "ready" || cut.eligible !== true || !Array.isArray(cut.stops)) {
        fail("FOREIGN_CUT", path + " is not a compatible ready memory cut.", path);
      }
      requireBindings(cut.bindings, path + ".bindings");
      var suppliedFingerprint = clean(cut.fingerprint);
      if (!suppliedFingerprint) fail("INVALID_FINGERPRINT", path + " has no fingerprint.", path);
      var candidate = serial(cut);
      delete candidate.fingerprint;
      if (fnv1a(stableJson(candidate)) !== suppliedFingerprint) {
        fail("TAMPERED_CUT", path + " fingerprint does not match its payload.", path);
      }
      var fresh = compile({
        title: cut.title,
        introduction: cut.introduction,
        selections: cut.stops
      });
      if (fresh.fingerprint !== suppliedFingerprint ||
          stableJson(fresh) !== stableJson(cut)) {
        fail("STALE_CUT", path + " no longer matches the canonical receipt registry.", path);
      }
      return fresh;
    }

    function share(cut) {
      var fresh = canonicalCut(cut, "cut");
      var packet = {
        schema: SHARE_SCHEMA,
        version: VERSION,
        title: fresh.title,
        introduction: fresh.introduction,
        viewerTextLabel: VIEWER_TEXT_LABEL,
        bindings: serial(bindings),
        receiptKeys: fresh.stops.map(function (stop) { return stop.key; }),
        cutFingerprint: fresh.fingerprint
      };
      packet.fingerprint = fnv1a(stableJson(packet));
      return freezeDeep(packet);
    }

    function restore(packet) {
      exactKeys(packet, [
        "schema",
        "version",
        "title",
        "introduction",
        "viewerTextLabel",
        "bindings",
        "receiptKeys",
        "cutFingerprint",
        "fingerprint"
      ], "packet");
      if (packet.schema !== SHARE_SCHEMA || packet.version !== VERSION) {
        fail("FOREIGN_SHARE", "The memory-cut share schema is unsupported.", "packet.schema");
      }
      if (packet.viewerTextLabel !== VIEWER_TEXT_LABEL) {
        fail(
          "FOREIGN_SHARE",
          "The share packet does not preserve the viewer-text evidence boundary.",
          "packet.viewerTextLabel"
        );
      }
      exactKeys(packet.bindings, [
        "channelId",
        "channelLabel",
        "channelPackFingerprint",
        "snapshotDate",
        "archiveFingerprint",
        "registryFingerprint"
      ], "packet.bindings");
      var candidate = serial(packet);
      var suppliedFingerprint = clean(candidate.fingerprint);
      delete candidate.fingerprint;
      if (!suppliedFingerprint ||
          fnv1a(stableJson(candidate)) !== suppliedFingerprint) {
        fail("TAMPERED_SHARE", "The share packet fingerprint does not match its payload.", "packet");
      }
      requireBindings(packet.bindings, "packet.bindings");
      if (!Array.isArray(packet.receiptKeys) ||
          packet.receiptKeys.length < MIN_STOPS ||
          packet.receiptKeys.length > MAX_STOPS) {
        fail("INVALID_STOP_COUNT", "The share packet has an invalid receipt count.", "packet.receiptKeys");
      }
      var keys = packet.receiptKeys.map(function (key, index) {
        return requiredText(key, "packet.receiptKeys[" + index + "]", 240);
      });
      if (new Set(keys).size !== keys.length) {
        fail("DUPLICATE_RECEIPT", "The share packet repeats a receipt.", "packet.receiptKeys");
      }
      var selections = keys.map(function (key) {
        var entry = receipts.get(key);
        if (!entry) {
          fail("STALE_REGISTRY", "The share packet references a missing canonical receipt.");
        }
        return { sourceId: entry.sourceId, receiptKey: key };
      });
      var fresh = compile({
        title: packet.title,
        introduction: packet.introduction,
        selections: selections
      });
      if (fresh.fingerprint !== packet.cutFingerprint) {
        fail("STALE_CUT", "The shared cut no longer rebuilds exactly from canonical receipts.");
      }
      return fresh;
    }

    function editBrief(cut) {
      var fresh = canonicalCut(cut, "cut");
      var brief = {
        schema: EDIT_BRIEF_SCHEMA,
        version: VERSION,
        title: fresh.title,
        introduction: fresh.introduction,
        viewerTextLabel: VIEWER_TEXT_LABEL,
        cutFingerprint: fresh.fingerprint,
        bindings: serial(bindings),
        stats: serial(fresh.stats),
        timeline: fresh.stops.map(function (stop) {
          return {
            order: stop.order,
            receiptKey: stop.key,
            sourceId: stop.sourceId,
            sourceFingerprint: stop.sourceFingerprint,
            sourceTitle: stop.title,
            sourceDate: stop.date,
            start: stop.start,
            end: stop.end,
            duration: stop.duration,
            label: stop.label,
            evidenceType: stop.evidenceType,
            evidenceBasis: stop.evidenceBasis,
            reviewState: stop.reviewState,
            officialUrl: stop.officialUrl
          };
        }),
        authority: {
          creatorApproved: false,
          rightsCleared: false,
          copiedMediaIncluded: false,
          mediaDownloaded: false,
          speakerVerified: false,
          speakerContinuity: false,
          performerVerified: false,
          canonPromoted: false,
          canonMutated: false,
          published: false,
          finalEdit: false,
          creatorApproval: false,
          mediaCopied: false,
          trueOrigin: false,
          causality: false,
          opinionChange: false,
          continuityEstablished: false,
          causalityEstablished: false
        },
        instructions: [
          "Open each registered official-source window in the exact listed order.",
          "Verify every source, start, end, and editorial transition before editing.",
          "Obtain any required creator approval and rights clearance outside this system.",
          "Do not treat adjacent receipts as proof of speaker continuity, causality, or opinion change."
        ]
      };
      brief.fingerprint = fnv1a(stableJson(brief));
      return freezeDeep(brief);
    }

    function briefMarkdown(brief) {
      var lines = [
        "> **" + VIEWER_TEXT_LABEL + "**",
        "",
        "# " + markdownText(brief.title),
        "",
        brief.introduction ? markdownText(brief.introduction) : "No editorial introduction supplied.",
        "",
        "## CUT LEDGER",
        "",
        "| # | Source | Window | Receipt | Evidence |",
        "|---:|---|---|---|---|"
      ];
      brief.timeline.forEach(function (stop) {
        lines.push(
          "| " + stop.order +
          " | [" + markdownCell(stop.sourceTitle) + "](" + stop.officialUrl + ")" +
          " | " + stop.start + "–" + stop.end + "s" +
          " | `" + stop.receiptKey.replace(/`/g, "") + "`" +
          " | " + markdownCell(stop.evidenceType + " // " + stop.reviewState) + " |"
        );
      });
      lines.push(
        "",
        "## AUTHORITY / MEDIA BOUNDARY",
        "",
        "- Creator approved: **NO**",
        "- Rights cleared: **NO**",
        "- Copied media included: **NO**",
        "- Media downloaded: **NO**",
        "- Speaker verified: **NO**",
        "- Performer verified: **NO**",
        "- Canon promoted: **NO**",
        "- Published or final edit: **NO**",
        "- Continuity or causality established: **NO**",
        "",
        "## CREATOR CHECKLIST",
        ""
      );
      brief.instructions.forEach(function (instruction) {
        lines.push("- [ ] " + markdownText(instruction));
      });
      lines.push(
        "",
        "Cut fingerprint: `" + brief.cutFingerprint + "`",
        "",
        "Brief fingerprint: `" + brief.fingerprint + "`"
      );
      return lines.join("\n");
    }

    function exportEditBrief(cut, format) {
      var mode = record(format) ? clean(format.format).toLowerCase() :
        clean(format || "json").toLowerCase();
      var brief = editBrief(cut);
      if (mode === "json") return brief;
      if (mode === "markdown" || mode === "md") return briefMarkdown(brief);
      fail("UNKNOWN_EXPORT_FORMAT", "Edit brief format must be json or markdown.", "format");
    }

    var stats = {
      sources: sources.size,
      receipts: receipts.size,
      eligibleSources: eligibleSources,
      eligibleReceipts: eligibleReceipts,
      quarantinedSources: quarantinedSources,
      withheldReceipts: withheldReceipts,
      minimumStops: MIN_STOPS,
      maximumStops: MAX_STOPS,
      resolveToleranceSeconds: RESOLVE_TOLERANCE_SECONDS,
      registryFingerprint: registryFingerprint
    };

    return freezeDeep({
      engine: "SHOKKER MEMORY CUT",
      version: VERSION,
      registryFingerprint: registryFingerprint,
      bindings: serial(bindings),
      resolveSelection: resolveSelection,
      compile: compile,
      share: share,
      restore: restore,
      exportEditBrief: exportEditBrief,
      getPreset: function (presetId) {
        var id = clean(presetId);
        var key = Object.keys(PRESETS).filter(function (candidate) {
          return candidate === id || PRESETS[candidate].id === id;
        })[0];
        if (!key) fail("UNKNOWN_PRESET", "Memory-cut preset " + id + " is not registered.");
        return freezeDeep(serial(PRESETS[key]));
      },
      getStats: function () {
        return freezeDeep(serial(stats));
      }
    });
  }

  Object.defineProperty(root, "ShokkerMemoryCut", {
    value: freezeDeep({
      VERSION: VERSION,
      REQUEST_SCHEMA: REQUEST_SCHEMA,
      CUT_SCHEMA: CUT_SCHEMA,
      SHARE_SCHEMA: SHARE_SCHEMA,
      EDIT_BRIEF_SCHEMA: EDIT_BRIEF_SCHEMA,
      MIN_STOPS: MIN_STOPS,
      MAX_STOPS: MAX_STOPS,
      RESOLVE_TOLERANCE_SECONDS: RESOLVE_TOLERANCE_SECONDS,
      VIEWER_TEXT_LABEL: VIEWER_TEXT_LABEL,
      PRESETS: freezeDeep(serial(PRESETS)),
      getPreset: function (presetId) {
        var id = clean(presetId);
        var key = Object.keys(PRESETS).filter(function (candidate) {
          return candidate === id || PRESETS[candidate].id === id;
        })[0];
        if (!key) fail("UNKNOWN_PRESET", "Memory-cut preset " + id + " is not registered.");
        return freezeDeep(serial(PRESETS[key]));
      },
      create: create
    }),
    enumerable: true,
    writable: false,
    configurable: false
  });
})(typeof window !== "undefined" ? window : globalThis);
