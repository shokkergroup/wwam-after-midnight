(function (root) {
  "use strict";

  /*
   * V5.16 // PLAY THE ANSWER V2
   *
   * This surface is deliberately downstream of ShokkerPlayAnswer. The engine
   * decides whether a trail is defensible; this file only renders a valid,
   * source-bounded trail with an exact claim relation and refuses to infer
   * identity, continuity, causality, or a verdict from its ordering.
   */

  var SHARE_PARAM = "playAnswer";
  var CANONICAL_SHARE_BASE =
    "https://wwam-after-midnight.downndirtytn.chatgpt.site/demo/";
  var VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
  var MAX_STOPS = 6;
  var SAFE_STATUSES = Object.freeze({
    supported: true,
    "archive-boundary": true
  });
  var SAFE_ROLES = Object.freeze({
    "PRIMARY RECEIPT": true,
    "EARLIEST INDEXED RECEIPT": true,
    "LATEST INDEXED RECEIPT": true,
    "LATER INDEXED RECEIPT": true,
    "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET": true,
    "LATER CURATED PERFORMANCE RECEIPT IN CURRENT SET": true,
    "EARLIEST MACHINE-INDEXED CHARACTER SIGNAL": true,
    "LATER MACHINE-INDEXED CHARACTER SIGNAL": true,
    "POSITIVE-LANGUAGE RECEIPT": true,
    "CRITICAL-LANGUAGE RECEIPT": true,
    "RUNNER-UP": true,
    "SUPPORTING RECEIPT": true,
    "COUNTERPOINT": true
  });
  var SAFE_EVIDENCE_LEVELS = Object.freeze({
    "TIMESTAMPED CAPTION RECEIPT": true,
    "TIMESTAMPED CURATED PERFORMANCE RECEIPT": true
  });
  var SAFE_EVIDENCE_TYPES = Object.freeze({
    "caption-excerpt": true,
    "caption-topic-receipt": true,
    "caption-character-signal": true,
    "curated-character-performance": true
  });
  var SAFE_CLAIM_RELATIONS = Object.freeze({
    "explicit-caption-target": "EXPLICIT CAPTION TARGET",
    "exact-topic-receipt": "EXACT TOPIC RECEIPT",
    "screen-referent-in-exact-commentary":
      "SCREEN REFERENT IN EXACT COMMENTARY"
  });
  var SOURCE_GLOBALS = Object.freeze([
    Object.freeze({ name: "WWAM_CATALOG", path: "", lane: "commentary", score: 50 }),
    Object.freeze({ name: "WWAM_LIVESTREAMS", path: "streams", lane: "fresh-live", score: 60 }),
    Object.freeze({ name: "WWAM_POPULAR_LIVE", path: "streams", lane: "popular-live", score: 70 }),
    Object.freeze({ name: "WWAM_ARCHIVE_DEEP", path: "streams", lane: "archive-deep-01", score: 80 }),
    Object.freeze({ name: "WWAM_ARCHIVE_DEEP_BATCH2", path: "streams", lane: "archive-deep-02", score: 80 }),
    Object.freeze({ name: "WWAM_ARCHIVE_DEEP_BATCH3", path: "streams", lane: "archive-deep-03", score: 80 }),
    Object.freeze({ name: "WWAM_ARCHIVE_DEEP_BATCH4", path: "streams", lane: "archive-deep-04", score: 80 }),
    Object.freeze({ name: "WWAM_ARCHIVE_ATLAS", path: "records", lane: "archive-atlas", score: 10 })
  ]);
  var HARD_LINE =
    "ORDER IS EDITORIAL NAVIGATION, NOT SPEAKER IDENTITY, SAME-PERSON CONTINUITY, CAUSALITY, OR A VERDICT.";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function text(value, limit) {
    if (typeof value !== "string" && typeof value !== "number") return "";
    var clean = String(value).replace(/\s+/g, " ").trim();
    return clean.slice(0, limit || 1000);
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function second(value) {
    var parsed = number(value);
    return parsed == null ? null : Math.max(0, Math.round(parsed));
  }

  function uniqueStrings(values) {
    var seen = Object.create(null);
    return array(values).reduce(function (output, value) {
      var clean = text(record(value) ? value.message || value.label : value, 700);
      var key = clean.toLowerCase();
      if (clean && !seen[key]) {
        seen[key] = true;
        output.push(clean);
      }
      return output;
    }, []);
  }

  function firstNumber(values) {
    for (var index = 0; index < values.length; index += 1) {
      var value = number(values[index]);
      if (value != null) return value;
    }
    return null;
  }

  function firstText(values, limit) {
    for (var index = 0; index < values.length; index += 1) {
      var value = text(values[index], limit);
      if (value) return value;
    }
    return "";
  }

  function sourceList(scope, descriptor) {
    var value = scope && scope[descriptor.name];
    if (!descriptor.path) return array(value);
    return record(value) ? array(value[descriptor.path]) : [];
  }

  function sourceScore(item, descriptor) {
    var coverage = text(item && item.coverage, 80).toLowerCase();
    var bonus =
      coverage === "deeply-indexed" ? 25 :
      coverage === "caption-limited" ? 8 :
      coverage === "metadata-only" ? -5 : 0;
    if (item && item.captioned === true) bonus += 15;
    if (item && item.transcript === true) bonus += 15;
    return descriptor.score + bonus;
  }

  function canonicalSource(item, descriptor) {
    var id = text(item && (item.id || item.sourceId || item.videoId), 24);
    if (!VIDEO_ID.test(id)) return null;
    var duration = second(item.duration);
    var lanes = array(item.lanes).map(function (lane) {
      return text(lane, 80);
    }).filter(Boolean);
    if (lanes.indexOf(descriptor.lane) < 0) lanes.push(descriptor.lane);
    return {
      id: id,
      sourceId: id,
      title: firstText([item.title, item.film, "Official WWAM source"], 300),
      date: text(item.date, 40),
      duration: duration,
      durationSeconds: duration,
      thumbnail: text(item.thumbnail, 1000),
      url: "https://www.youtube.com/watch?v=" + encodeURIComponent(id),
      lane: descriptor.lane,
      lanes: lanes,
      coverage: text(item.coverage, 80) ||
        (item.captioned === true || item.transcript === true ? "caption-indexed" : "cataloged"),
      captioned: item.captioned === true || item.transcript === true,
      _score: sourceScore(item, descriptor)
    };
  }

  function buildSourceRegistry(scope) {
    var runtime = scope || root;
    var byId = Object.create(null);
    SOURCE_GLOBALS.forEach(function (descriptor) {
      sourceList(runtime, descriptor).forEach(function (item) {
        var next = canonicalSource(item, descriptor);
        if (!next) return;
        var previous = byId[next.id];
        if (!previous) {
          byId[next.id] = next;
          return;
        }
        var mergedLanes = previous.lanes.concat(next.lanes).filter(function (lane, index, lanes) {
          return lane && lanes.indexOf(lane) === index;
        });
        if (next._score > previous._score) {
          next.lanes = mergedLanes;
          byId[next.id] = next;
        } else {
          previous.lanes = mergedLanes;
          if (!previous.duration && next.duration) {
            previous.duration = next.duration;
            previous.durationSeconds = next.durationSeconds;
          }
          if (!previous.date && next.date) previous.date = next.date;
          if (!previous.thumbnail && next.thumbnail) previous.thumbnail = next.thumbnail;
        }
      });
    });
    var list = Object.keys(byId).sort().map(function (id) {
      var source = byId[id];
      delete source._score;
      return Object.freeze(source);
    });
    var engineSources = list.filter(function (source) {
      return Number.isInteger(source.durationSeconds) && source.durationSeconds > 0;
    }).map(function (source) {
      return Object.freeze({
        sourceId: source.sourceId,
        durationSeconds: source.durationSeconds,
        playable: true
      });
    });
    return Object.freeze({
      byId: byId,
      list: Object.freeze(list),
      engineSources: Object.freeze(engineSources),
      size: list.length
    });
  }

  function compileBindings(scope) {
    var runtime = scope || root;
    if (!runtime.ShokkerChannelPack ||
        typeof runtime.ShokkerChannelPack.compile !== "function" ||
        !runtime.WWAM_CHANNEL_DNA ||
        !runtime.WWAM_CHANNEL_PACK_ADAPTER) return null;
    var channelPack = runtime.ShokkerChannelPack.compile(
      runtime.WWAM_CHANNEL_DNA,
      runtime.WWAM_CHANNEL_PACK_ADAPTER
    );
    if (typeof runtime.ShokkerChannelPack.validate === "function") {
      var report = runtime.ShokkerChannelPack.validate(channelPack);
      if (!report || report.valid !== true || report.fingerprintVerified === false) return null;
    }
    var archiveAsOf = firstText([
      runtime.WWAM_ARCHIVE_ATLAS && runtime.WWAM_ARCHIVE_ATLAS.snapshotDate,
      runtime.WWAM_CHANNEL_DNA.proofSnapshot &&
        runtime.WWAM_CHANNEL_DNA.proofSnapshot.asOf
    ], 10);
    return Object.freeze({
      channelId: text(channelPack.identity && channelPack.identity.id, 64),
      channelPackFingerprint: text(channelPack.fingerprint, 20),
      archiveAsOf: archiveAsOf,
      answerEngineVersion: "ask-v2.1.0"
    });
  }

  function unsafeAnalysis(message) {
    var error = new Error(message);
    error.code = "UNSAFE_ASK_TRAIL";
    throw error;
  }

  function safeAskAnalysis(analysis, query, registry) {
    if (!record(analysis) || analysis.query !== query) {
      unsafeAnalysis("The structured Ask analysis does not match this exact query.");
    }
    if (!Object.prototype.hasOwnProperty.call(SAFE_STATUSES, analysis.status)) {
      unsafeAnalysis("Only supported or archive-boundary answers can be played.");
    }
    if (analysis.continuedFrom !== false) {
      unsafeAnalysis("Context-dependent follow-ups cannot become portable playback trails.");
    }
    var contextUsed = array(analysis.contextUsed);
    if (contextUsed.some(function (entry) { return entry !== "named-result"; })) {
      unsafeAnalysis("Prior conversational context cannot enter a playback trail.");
    }
    var chain = array(analysis.evidenceChain);
    if (chain.length < 2 || chain.length > MAX_STOPS) {
      unsafeAnalysis("A playback trail requires two to six receipts.");
    }
    var keys = Object.create(null);
    var coordinates = Object.create(null);
    chain.forEach(function (entry) {
      if (!record(entry) ||
          !Object.prototype.hasOwnProperty.call(SAFE_ROLES, entry.role) ||
          !record(entry.result)) {
        unsafeAnalysis("The answer contains a non-canonical structural role.");
      }
      var result = entry.result;
      var source = registry.byId[result.sourceId];
      if (!source || !source.captioned || result.captioned !== true) {
        unsafeAnalysis("Every stop must resolve to a caption-indexed canonical source.");
      }
      if (!Object.prototype.hasOwnProperty.call(SAFE_EVIDENCE_LEVELS, result.evidenceLevel) ||
          !Object.prototype.hasOwnProperty.call(SAFE_EVIDENCE_TYPES, result.evidenceType)) {
        unsafeAnalysis("Every stop must be a timed caption or curated-performance receipt.");
      }
      if (typeof result.claimRelation !== "string" ||
          !Object.prototype.hasOwnProperty.call(
            SAFE_CLAIM_RELATIONS,
            result.claimRelation
          )) {
        unsafeAnalysis(
          "Every stop must prove an exact claim relation; source context alone cannot play."
        );
      }
      if (!Object.prototype.hasOwnProperty.call(result, "speaker") ||
          result.speaker !== null || result.speakerStatus !== "not-diarized") {
        unsafeAnalysis("Every stop must remain explicitly non-diarized.");
      }
      if (result.restrictedToTopicNavigation === true ||
          result.reviewStatus === "machine-candidate" ||
          result.rightsMode === "visual-context-unverified" ||
          result.promotionAllowed === true) {
        unsafeAnalysis("Restricted, machine-candidate, or visually unverified evidence cannot play.");
      }
      if (!Number.isInteger(result.at) || result.at < 0 ||
          !Number.isInteger(source.durationSeconds) ||
          result.at >= source.durationSeconds) {
        unsafeAnalysis("Every stop needs a whole-second coordinate inside its source.");
      }
      if (typeof result.key !== "string" || !result.key ||
          keys[result.key] || coordinates[result.sourceId + "@" + result.at]) {
        unsafeAnalysis("Duplicate or unkeyed receipts cannot enter a playback trail.");
      }
      keys[result.key] = true;
      coordinates[result.sourceId + "@" + result.at] = true;
      if (!array(result.evidenceWarnings).every(function (warning) {
        return typeof warning === "string";
      })) {
        unsafeAnalysis("Receipt warnings must remain bounded text.");
      }
    });
    return analysis;
  }

  function nested(source, key, child) {
    return record(source && source[key]) ? source[key][child] : undefined;
  }

  function stopBounds(candidate) {
    var start = firstNumber([
      candidate.start,
      candidate.at,
      candidate.time,
      candidate.in,
      nested(candidate, "bounds", "start"),
      nested(candidate, "range", "start"),
      nested(candidate, "window", "start"),
      nested(candidate, "editWindow", "in")
    ]);
    var end = firstNumber([
      candidate.end,
      candidate.out,
      candidate.clipEnd,
      nested(candidate, "bounds", "end"),
      nested(candidate, "range", "end"),
      nested(candidate, "window", "end"),
      nested(candidate, "editWindow", "out")
    ]);
    var explicitDuration = firstNumber([
      candidate.clipDuration,
      candidate.windowSeconds,
      nested(candidate, "bounds", "duration")
    ]);
    if (end == null && start != null && explicitDuration != null && explicitDuration > 0) {
      end = start + explicitDuration;
    }
    return {
      start: start == null ? null : second(start),
      end: end == null ? null : second(end)
    };
  }

  function stopCandidates(value) {
    if (Array.isArray(value)) return value;
    if (!record(value)) return [];
    if (Array.isArray(value.stops)) return value.stops;
    if (Array.isArray(value.sequence)) return value.sequence;
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.receipts)) return value.receipts;
    if (record(value.trail)) return stopCandidates(value.trail);
    if (Array.isArray(value.trail)) return value.trail;
    return [];
  }

  function rawWarnings(value, analysis) {
    return uniqueStrings(
      array(value && value.warnings)
        .concat(array(value && value.limitations))
        .concat(array(value && value.evidenceWarnings))
        .concat(array(analysis && analysis.limitations))
        .concat(array(analysis && analysis.warnings))
    );
  }

  function analysisReceipt(analysis, index, candidate) {
    var entry = analysis && array(analysis.evidenceChain)[index];
    var result = entry && entry.result;
    if (!record(result) ||
        result.key !== candidate.key ||
        result.sourceId !== candidate.sourceId ||
        result.at !== candidate.at ||
        result.claimRelation !== candidate.claimRelation) return null;
    return result;
  }

  function normalizeStop(candidate, index, registry, analysis) {
    if (!record(candidate)) return null;
    var sourceObject = record(candidate.source) ? candidate.source : {};
    var id = firstText([
      candidate.sourceId,
      candidate.videoId,
      sourceObject.id,
      sourceObject.sourceId,
      candidate.id
    ], 24);
    var source = VIDEO_ID.test(id) ? registry.byId[id] : null;
    if (!source) return null;
    var bounds = stopBounds(candidate);
    if (bounds.start == null || bounds.end == null || bounds.end <= bounds.start) return null;
    if (source.duration != null && bounds.end > source.duration + 1) return null;
    var receipt = analysisReceipt(analysis, index, candidate);
    if (!receipt) return null;
    if (typeof candidate.claimRelation !== "string" ||
        !Object.prototype.hasOwnProperty.call(
          SAFE_CLAIM_RELATIONS,
          candidate.claimRelation
        )) return null;
    var warnings = uniqueStrings(
      array(candidate.warnings)
        .concat(array(candidate.limitations))
        .concat(array(candidate.evidenceWarnings))
    );
    var role = firstText([
      candidate.role,
      candidate.trailRole,
      candidate.label,
      "SOURCE RECEIPT " + String(index + 1).padStart(2, "0")
    ], 120);
    return Object.freeze({
      index: index,
      sourceId: id,
      videoId: id,
      source: source,
      role: role,
      title: source.title,
      start: bounds.start,
      end: bounds.end,
      claimRelation: candidate.claimRelation,
      excerpt: firstText([
        receipt.excerpt,
        receipt.quote,
        receipt.receipt,
        receipt.subtitle
      ], 1000),
      evidenceLevel: firstText([
        candidate.evidenceLevel,
        candidate.evidenceType,
        "SOURCE-BOUNDED RECEIPT"
      ], 180),
      warnings: Object.freeze(warnings)
    });
  }

  function trailSignature(trail) {
    if (!trail || !Array.isArray(trail.stops)) return "";
    return JSON.stringify({
      query: text(trail.query, 500),
      stops: trail.stops.map(function (stop) {
        return [
          stop.sourceId,
          Number(stop.start),
          Number(stop.end),
          text(stop.role, 120),
          text(stop.claimRelation, 80)
        ];
      })
    });
  }

  function normalizeTrail(value, input, registry) {
    var raw = record(value) && record(value.trail) && !Array.isArray(value.trail) ?
      value.trail : value;
    var analysis = input && input.analysis;
    var candidates = stopCandidates(value);
    if (!candidates.length && raw !== value) candidates = stopCandidates(raw);
    var stops = [];
    var seen = Object.create(null);
    var rejected = candidates.length < 2 || candidates.length > MAX_STOPS;
    candidates.slice(0, MAX_STOPS).forEach(function (candidate, index) {
      var normalized = normalizeStop(candidate, index, registry, analysis);
      if (!normalized) {
        rejected = true;
        return;
      }
      var key = normalized.sourceId + ":" + normalized.start + ":" + normalized.end;
      if (seen[key]) {
        rejected = true;
        return;
      }
      seen[key] = true;
      stops.push(normalized);
    });
    var explicitInvalid =
      (record(value) && value.valid === false) ||
      (record(value) && /(?:invalid|held|rejected|tampered|stale)/i.test(text(value.status, 80)));
    var query = firstText([
      record(value) && value.query,
      record(raw) && raw.query,
      input && input.query
    ], 500);
    var session = {
      valid: !explicitInvalid && !rejected && Boolean(query) &&
        stops.length === candidates.length && stops.length >= 2,
      query: query,
      answer: firstText([
        record(value) && value.answer,
        record(raw) && raw.answer,
        analysis && analysis.answer
      ], 1200),
      stops: Object.freeze(stops),
      warnings: Object.freeze(rawWarnings(value, analysis)),
      engineFingerprint: firstText([
        record(value) && value.fingerprint,
        record(value) && value.trailFingerprint,
        record(raw) && raw.fingerprint
      ], 300),
      raw: value
    };
    session.signature = trailSignature(session);
    return Object.freeze(session);
  }

  function createFromCore(engine, input, registry) {
    if (!engine || typeof engine.build !== "function") {
      throw new Error("PLAY THE ANSWER core instance is unavailable.");
    }
    var produced = engine.build(input.query);
    if (produced && typeof produced.then === "function") {
      throw new Error("PLAY THE ANSWER requires a synchronous, frozen trail.");
    }
    return normalizeTrail(produced, input, registry);
  }

  function timecode(total) {
    var safe = Math.max(0, Math.round(Number(total) || 0));
    var hours = Math.floor(safe / 3600);
    var minutes = Math.floor((safe % 3600) / 60);
    var seconds = safe % 60;
    return (hours ? String(hours).padStart(2, "0") + ":" : "") +
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");
  }

  function officialUrl(stop) {
    return "https://www.youtube.com/watch?v=" +
      encodeURIComponent(stop.sourceId) + "&t=" + Number(stop.start) + "s";
  }

  function packetToken(packet) {
    var json = JSON.stringify(packet);
    if (json.length > 20000) throw new Error("The share packet is too large.");
    if (typeof root.btoa === "function") {
      var binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, function (_, pair) {
        return String.fromCharCode(parseInt(pair, 16));
      });
      return "b1." + root.btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
    }
    return "j1." + encodeURIComponent(json);
  }

  function packetFromToken(token) {
    if (typeof token !== "string" || token.length < 4 || token.length > 30000) {
      throw new Error("The playback trail token is malformed.");
    }
    var json;
    if (token.indexOf("b1.") === 0 && typeof root.atob === "function") {
      var body = token.slice(3).replace(/-/g, "+").replace(/_/g, "/");
      while (body.length % 4) body += "=";
      var binary = root.atob(body);
      var escaped = "";
      for (var index = 0; index < binary.length; index += 1) {
        escaped += "%" + binary.charCodeAt(index).toString(16).padStart(2, "0");
      }
      json = decodeURIComponent(escaped);
    } else if (token.indexOf("j1.") === 0) {
      json = decodeURIComponent(token.slice(3));
    } else {
      throw new Error("The playback trail token version is unsupported.");
    }
    var packet = JSON.parse(json);
    if (!record(packet) || typeof packet.query !== "string" ||
        packet.query.trim() !== packet.query ||
        packet.query.length < 2 || packet.query.length > 240 ||
        /[\u0000-\u001f\u007f]/.test(packet.query) ||
        !Array.isArray(packet.stops) ||
        packet.stops.length < 2 || packet.stops.length > MAX_STOPS) {
      throw new Error("The playback trail packet is malformed.");
    }
    return packet;
  }

  function shareUrl(token) {
    if (typeof token !== "string" || token.length < 4 || token.length > 30000) {
      throw new Error("The playback trail token is malformed.");
    }
    var location = root.location || {};
    var hosted = /^https?:$/.test(location.protocol || "") &&
      location.origin && location.origin !== "null";
    var base = hosted ?
      location.origin + (location.pathname || "/") :
      CANONICAL_SHARE_BASE;
    var current = new URL(base);
    current.searchParams.set(SHARE_PARAM, token);
    current.hash = "ask";
    return current.toString();
  }

  function writeClipboard(value, documentRef) {
    if (root.navigator && root.navigator.clipboard &&
        typeof root.navigator.clipboard.writeText === "function") {
      return root.navigator.clipboard.writeText(value);
    }
    return new Promise(function (resolve, reject) {
      try {
        var field = documentRef.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.className = "play-answer-clipboard";
        documentRef.body.appendChild(field);
        field.select();
        var copied = documentRef.execCommand && documentRef.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Copy was blocked.");
        resolve();
      } catch {
        reject(error);
      }
    });
  }

  function create(options) {
    var config = options || {};
    var documentRef = config.document || root.document;
    var core = config.core || root.ShokkerPlayAnswer || null;
    var coreInstance = config.engine || null;
    var playback = config.playback || root.ShokkerYouTubePlayback || null;
    var registry = config.sources || buildSourceRegistry(root);
    var bindings = config.bindings === undefined ? compileBindings(root) : config.bindings;
    var resultsNode = null;
    var inputNode = null;
    var formNode = null;
    var theater = null;
    var observer = null;
    var mounted = false;
    var refreshing = false;
    var refreshQueued = false;
    var currentTrail = null;
    var currentIndex = 0;
    var previousFocus = null;
    var launchNode = null;
    var restore = null;
    var closing = false;

    function trailInput() {
      var analysis = resultsNode && resultsNode._trail;
      var query = resultsNode ?
        text(resultsNode.getAttribute("data-ask-query"), 500) : "";
      if (!query && inputNode) query = text(inputNode.value, 500);
      return {
        query: query,
        analysis: analysis,
        sources: registry.list,
        bindings: bindings
      };
    }

    function compileCurrent() {
      var input = trailInput();
      if (!input.query || !input.analysis) return null;
      try {
        safeAskAnalysis(input.analysis, input.query, registry);
        if (!coreInstance) {
          if (!core || typeof core.create !== "function" || !bindings ||
              !registry.engineSources.length) {
            throw new Error("PLAY THE ANSWER dependencies are unavailable.");
          }
          coreInstance = core.create({
            analyze: function (query) {
              var current = trailInput();
              if (current.query !== query) {
                unsafeAnalysis("The Ask result changed before the trail could be rebuilt.");
              }
              return safeAskAnalysis(current.analysis, query, registry);
            },
            bindings: bindings,
            sources: registry.engineSources
          });
        }
        return createFromCore(coreInstance, input, registry);
      } catch {
        return null;
      }
    }

    function removeLaunch() {
      var found = resultsNode &&
        resultsNode.querySelector("[data-play-answer-slot]");
      if (found) found.remove();
      launchNode = null;
    }

    function notice(message, tone) {
      if (!resultsNode) return;
      var node = resultsNode.querySelector("[data-play-answer-restore-status]");
      if (!node) {
        node = documentRef.createElement("p");
        node.className = "play-answer-restore-status";
        node.setAttribute("data-play-answer-restore-status", "");
        node.setAttribute("role", "status");
        node.setAttribute("aria-live", "polite");
        resultsNode.prepend(node);
      }
      node.textContent = message;
      node.setAttribute("data-tone", tone || "neutral");
    }

    function clearNotice() {
      var node = resultsNode &&
        resultsNode.querySelector("[data-play-answer-restore-status]");
      if (node && !restore) node.remove();
    }

    function compareRestored(trail) {
      if (!restore || restore.status !== "rerunning") return;
      var activeQuery = text(resultsNode.getAttribute("data-ask-query"), 500);
      if (activeQuery !== restore.query || !resultsNode._trail) return;
      if (!trail || !coreInstance || typeof coreInstance.restoreShare !== "function") {
        restore.status = "failed";
        restore.message =
          "PLAYBACK TRAIL HELD // THE CURRENT ASK ANSWER IS NOT SAFE TO PLAY.";
        removeLaunch();
        notice(restore.message, "error");
        return;
      }
      try {
        var checked = coreInstance.restoreShare(restore.packet);
        var expected = normalizeTrail(checked, trailInput(), registry);
        if (!expected.valid || expected.signature !== trail.signature ||
            expected.engineFingerprint !== trail.engineFingerprint) {
          throw new Error("The current trail does not match the shared trail.");
        }
        restore.status = "verified";
        restore.message =
          "PLAYBACK TRAIL VERIFIED // CURRENT ASK RECEIPTS MATCH THE SHARED SEQUENCE.";
        notice(restore.message, "success");
      } catch {
        restore.status = "failed";
        restore.message =
          "PLAYBACK TRAIL HELD // TAMPERED, STALE, OR NO LONGER MATCHING THIS ARCHIVE.";
        removeLaunch();
        notice(restore.message, "error");
      }
    }

    function injectLaunch(trail) {
      var answer = resultsNode && resultsNode.querySelector(".answer-brief");
      if (!answer || !trail || !trail.valid || trail.stops.length < 2) {
        removeLaunch();
        return;
      }
      var existing = resultsNode.querySelector("[data-play-answer-slot]");
      if (existing && existing.getAttribute("data-trail-signature") === trail.signature) {
        launchNode = existing.querySelector("[data-play-answer-launch]");
        return;
      }
      removeLaunch();
      var slot = documentRef.createElement("div");
      slot.className = "play-answer-launch-slot";
      slot.setAttribute("data-play-answer-slot", "");
      slot.setAttribute("data-trail-signature", trail.signature);
      var button = documentRef.createElement("button");
      button.type = "button";
      button.className = "play-answer-launch";
      button.setAttribute("data-play-answer-launch", "");
      button.innerHTML =
        "<span>PLAY THIS ANSWER</span><b>" +
        trail.stops.length + " SOURCE-BOUNDED STOPS</b><i aria-hidden=\"true\">&#9654;</i>";
      button.addEventListener("click", function () {
        var latest = compileCurrent();
        if (!latest || !latest.valid || latest.signature !== trail.signature) {
          refresh();
          notice("PLAYBACK TRAIL HELD // ASK CHANGED. RUN THE QUERY AGAIN.", "error");
          return;
        }
        open(latest);
      });
      slot.appendChild(button);
      answer.appendChild(slot);
      launchNode = button;
    }

    function refresh() {
      if (!mounted || refreshing) return null;
      refreshing = true;
      var trail = compileCurrent();
      currentTrail = trail && trail.valid ? trail : null;
      compareRestored(currentTrail);
      if (restore && restore.status === "failed") {
        removeLaunch();
        notice(restore.message, "error");
      } else {
        injectLaunch(currentTrail);
        if (restore && restore.message) {
          notice(restore.message, restore.status === "verified" ? "success" : "neutral");
        } else {
          clearNotice();
        }
      }
      refreshing = false;
      return currentTrail;
    }

    function queueRefresh() {
      if (refreshQueued) return;
      refreshQueued = true;
      var later = root.requestAnimationFrame || function (callback) {
        return root.setTimeout(callback, 0);
      };
      later(function () {
        refreshQueued = false;
        refresh();
      });
    }

    function playerMarkup(stop, forceHostedBridge) {
      if (!playback || typeof playback.iframe !== "function") return "";
      return playback.iframe(stop.sourceId, {
        autoplay: true,
        start: stop.start,
        end: stop.end,
        title: "PLAY THE ANSWER // " + stop.role + " // " + stop.title,
        forceHostedBridge: forceHostedBridge === true
      });
    }

    function renderRail() {
      var rail = theater.querySelector("[data-play-answer-rail]");
      rail.replaceChildren();
      currentTrail.stops.forEach(function (stop, index) {
        var item = documentRef.createElement("li");
        var button = documentRef.createElement("button");
        var count = documentRef.createElement("span");
        var role = documentRef.createElement("b");
        var source = documentRef.createElement("small");
        button.type = "button";
        button.setAttribute("data-play-answer-stop", String(index));
        button.setAttribute("aria-label",
          "Play stop " + (index + 1) + ": " + stop.role + ", " + stop.title);
        if (index === currentIndex) button.setAttribute("aria-current", "step");
        count.textContent = String(index + 1).padStart(2, "0");
        role.textContent = stop.role;
        source.textContent =
          stop.title + " // " + timecode(stop.start) + "\u2013" + timecode(stop.end);
        button.appendChild(count);
        button.appendChild(role);
        button.appendChild(source);
        button.addEventListener("click", function () {
          renderStop(index, false);
        });
        item.appendChild(button);
        rail.appendChild(item);
      });
    }

    function renderWarnings(stop) {
      var list = theater.querySelector("[data-play-answer-warnings]");
      var warnings = uniqueStrings(currentTrail.warnings.concat(stop.warnings));
      list.replaceChildren();
      if (!warnings.length) {
        var none = documentRef.createElement("li");
        none.textContent =
          "No additional source warning was supplied. The hard-line limits still apply.";
        list.appendChild(none);
        return;
      }
      warnings.forEach(function (warning) {
        var item = documentRef.createElement("li");
        item.textContent = warning;
        list.appendChild(item);
      });
    }

    function renderStop(index, forceHostedBridge) {
      if (!currentTrail || !theater) return;
      currentIndex = Math.max(0, Math.min(currentTrail.stops.length - 1, Number(index) || 0));
      var stop = currentTrail.stops[currentIndex];
      var host = theater.querySelector("[data-play-answer-player]");
      var markup = playerMarkup(stop, forceHostedBridge);
      if (markup) {
        host.innerHTML = markup;
      } else {
        host.innerHTML =
          '<div class="play-answer-player-held"><b>ON-PAGE PLAYER HELD.</b>' +
          "<span>Use RECOVER PLAYER, or inspect the official source.</span></div>";
      }
      theater.querySelector("[data-play-answer-step]").textContent =
        "STOP " + String(currentIndex + 1).padStart(2, "0") +
        " / " + String(currentTrail.stops.length).padStart(2, "0");
      theater.querySelector("[data-play-answer-role]").textContent = stop.role;
      theater.querySelector("[data-play-answer-source-title]").textContent = stop.title;
      theater.querySelector("[data-play-answer-time]").textContent =
        timecode(stop.start) + " \u2192 " + timecode(stop.end) +
        " // " + (stop.end - stop.start) + " SEC";
      var excerpt = theater.querySelector("[data-play-answer-excerpt]");
      excerpt.textContent = stop.excerpt || "No excerpt copy supplied; use the bounded source.";
      excerpt.setAttribute("data-empty", stop.excerpt ? "false" : "true");
      theater.querySelector("[data-play-answer-level]").textContent =
        stop.evidenceLevel + " // " +
        SAFE_CLAIM_RELATIONS[stop.claimRelation];
      var official = theater.querySelector("[data-play-answer-official]");
      official.href = officialUrl(stop);
      renderWarnings(stop);
      theater.querySelector("[data-play-answer-prev]").disabled = currentIndex === 0;
      theater.querySelector("[data-play-answer-next]").disabled =
        currentIndex === currentTrail.stops.length - 1;
      renderRail();
      announce(forceHostedBridge ?
        "PLAYER RECOVERY ATTEMPTED // HOSTED BRIDGE // SAME EXACT SOURCE BOUNDS" :
        "STOP " + (currentIndex + 1) +
        " LOADED // PLAYBACK REQUESTED // MANUAL ADVANCEMENT // SOURCE BOUNDS HELD");
    }

    function announce(message) {
      if (!theater) return;
      theater.querySelector("[data-play-answer-status]").textContent = message;
    }

    function focusable() {
      if (!theater) return [];
      return Array.prototype.filter.call(theater.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ), function (node) {
        return !node.hidden && node.getAttribute("aria-hidden") !== "true";
      });
    }

    function trapFocus(event) {
      if (!theater || !theater.hasAttribute("open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      var nodes = focusable();
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (event.shiftKey && documentRef.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function finishClose() {
      if (!theater || closing) return;
      closing = true;
      theater.querySelector("[data-play-answer-player]").replaceChildren();
      theater.removeAttribute("open");
      documentRef.body.classList.remove("play-answer-open");
      currentIndex = 0;
      var target = previousFocus;
      previousFocus = null;
      if (target && documentRef.contains(target) && typeof target.focus === "function") {
        target.focus();
      } else if (inputNode && typeof inputNode.focus === "function") {
        inputNode.focus();
      }
      closing = false;
    }

    function close() {
      if (!theater || !theater.hasAttribute("open")) return;
      if (typeof theater.close === "function") {
        theater.close();
      } else {
        finishClose();
      }
    }

    function shareCurrent() {
      if (!currentTrail || !coreInstance ||
          typeof coreInstance.createShare !== "function") {
        announce("SHARE HELD // VERIFIED SHARE CORE UNAVAILABLE");
        return;
      }
      try {
        var output = coreInstance.createShare(currentTrail.query);
        var token = packetToken(output);
        var url = shareUrl(token);
        writeClipboard(url, documentRef).then(function () {
          announce("VERIFIED PLAYBACK TRAIL LINK COPIED // RESTORE WILL RERUN ASK");
        }).catch(function () {
          announce("LINK BUILT // COPY BLOCKED // USE THE OFFICIAL SOURCE CONTROLS");
        });
      } catch (error) {
        announce("SHARE HELD // " + text(error.code || error.message, 300));
      }
    }

    function makeTheater() {
      if (theater) return theater;
      theater = documentRef.createElement("dialog");
      theater.className = "play-answer-theater";
      theater.id = "playAnswerTheater";
      theater.setAttribute("aria-labelledby", "playAnswerTitle");
      theater.setAttribute("aria-describedby", "playAnswerHardLine");
      theater.innerHTML =
        '<div class="play-answer-shell">' +
          '<header class="play-answer-header">' +
            '<div><span>ASK WWAM // SOURCE-BOUNDED THEATER</span>' +
              '<h2 id="playAnswerTitle" tabindex="-1">PLAY THE ANSWER.</h2>' +
              '<p data-play-answer-query></p></div>' +
            '<button type="button" class="play-answer-close" data-play-answer-close ' +
              'aria-label="Close Play the Answer">&times;</button>' +
          '</header>' +
          '<p class="play-answer-hard-line" id="playAnswerHardLine">' +
            '<b>THE HARD LINE</b><span>' + HARD_LINE + '</span></p>' +
          '<div class="play-answer-workbench">' +
            '<nav class="play-answer-roles" aria-label="Ordered answer stops">' +
              '<header><span>ROLE RAIL</span><b>MANUAL ORDER</b></header>' +
              '<ol data-play-answer-rail></ol></nav>' +
            '<main class="play-answer-main">' +
              '<section class="play-answer-stage" aria-label="Current official source">' +
                '<div><div class="play-answer-player" data-play-answer-player></div>' +
                  '<div class="play-answer-transport" role="group" aria-label="Playback controls">' +
                    '<button type="button" data-play-answer-prev>&larr; PREVIOUS</button>' +
                    '<button type="button" data-play-answer-replay>REPLAY STOP</button>' +
                    '<button type="button" class="recover" data-play-answer-recover>RECOVER PLAYER</button>' +
                    '<button type="button" data-play-answer-next>NEXT &rarr;</button>' +
                  '</div></div>' +
                '<aside class="play-answer-receipt">' +
                  '<div><span data-play-answer-step>STOP 00 / 00</span>' +
                    '<b data-play-answer-level>SOURCE-BOUNDED RECEIPT</b></div>' +
                  '<h3 data-play-answer-role></h3>' +
                  '<h4 data-play-answer-source-title></h4>' +
                  '<time data-play-answer-time></time>' +
                  '<blockquote data-play-answer-excerpt></blockquote>' +
                  '<section><b>WARNINGS PRESERVED</b><ul data-play-answer-warnings></ul></section>' +
                  '<a data-play-answer-official target="_blank" rel="noopener noreferrer">' +
                    'OFFICIAL SOURCE ON YOUTUBE &nearr;</a>' +
                '</aside>' +
              '</section>' +
            '</main>' +
          '</div>' +
          '<footer class="play-answer-footer">' +
            '<p><b>NO AUTO-ADVANCE.</b> Every source change requires your click.</p>' +
            '<div><button type="button" data-play-answer-share>SHARE TRAIL</button>' +
              '<button type="button" data-play-answer-footer-close>CLOSE THEATER</button></div>' +
            '<span data-play-answer-status role="status" aria-live="polite" aria-atomic="true"></span>' +
          '</footer>' +
        '</div>';
      documentRef.body.appendChild(theater);
      theater.querySelector("[data-play-answer-close]").addEventListener("click", close);
      theater.querySelector("[data-play-answer-footer-close]").addEventListener("click", close);
      theater.querySelector("[data-play-answer-prev]").addEventListener("click", function () {
        renderStop(currentIndex - 1, false);
      });
      theater.querySelector("[data-play-answer-replay]").addEventListener("click", function () {
        renderStop(currentIndex, false);
      });
      theater.querySelector("[data-play-answer-next]").addEventListener("click", function () {
        renderStop(currentIndex + 1, false);
      });
      theater.querySelector("[data-play-answer-recover]").addEventListener("click", function () {
        renderStop(currentIndex, true);
      });
      theater.querySelector("[data-play-answer-share]").addEventListener("click", shareCurrent);
      theater.addEventListener("keydown", trapFocus);
      theater.addEventListener("cancel", function (event) {
        event.preventDefault();
        close();
      });
      theater.addEventListener("close", finishClose);
      theater.addEventListener("click", function (event) {
        if (event.target === theater) close();
      });
      return theater;
    }

    function open(trail) {
      if (!trail || !trail.valid || trail.stops.length < 2) return false;
      currentTrail = trail;
      currentIndex = 0;
      previousFocus = documentRef.activeElement || launchNode;
      makeTheater();
      theater.querySelector("[data-play-answer-query]").textContent =
        "\u201c" + trail.query + "\u201d";
      if (typeof theater.showModal === "function") {
        if (!theater.open) theater.showModal();
      } else {
        theater.setAttribute("open", "");
      }
      documentRef.body.classList.add("play-answer-open");
      renderStop(0, false);
      theater.querySelector("#playAnswerTitle").focus();
      return true;
    }

    function restoreSharedTrail() {
      if (!root.location || !root.location.search) return;
      var token = new URLSearchParams(root.location.search).get(SHARE_PARAM);
      if (!token) return;
      if (!core || typeof core.create !== "function") {
        restore = {
          status: "failed",
          message: "PLAYBACK TRAIL HELD // SHARE VERIFICATION CORE UNAVAILABLE."
        };
        notice(restore.message, "error");
        return;
      }
      try {
        var packet = packetFromToken(token);
        restore = {
          status: "rerunning",
          packet: packet,
          query: packet.query,
          message: "SHARED TRAIL RECEIVED // RERUNNING ASK BEFORE VERIFICATION."
        };
        notice(restore.message, "neutral");
        inputNode.value = packet.query;
        if (typeof formNode.requestSubmit === "function") {
          formNode.requestSubmit();
        } else {
          var SubmitEvent = root.Event;
          formNode.dispatchEvent(new SubmitEvent("submit", {
            bubbles: true,
            cancelable: true
          }));
        }
        queueRefresh();
      } catch {
        restore = {
          status: "failed",
          message: "PLAYBACK TRAIL HELD // TAMPERED, STALE, OR INVALID SHARE."
        };
        removeLaunch();
        notice(restore.message, "error");
      }
    }

    function mount() {
      if (mounted) return resultsNode;
      if (!documentRef) return null;
      resultsNode = documentRef.getElementById("askResults");
      inputNode = documentRef.getElementById("askInput");
      formNode = documentRef.getElementById("askForm");
      if (!resultsNode || !inputNode || !formNode) return null;
      mounted = true;
      observer = new root.MutationObserver(queueRefresh);
      observer.observe(resultsNode, { childList: true, subtree: true });
      inputNode.addEventListener("input", function () {
        if (text(inputNode.value, 500) !==
            text(resultsNode.getAttribute("data-ask-query"), 500)) {
          removeLaunch();
        }
      });
      refresh();
      restoreSharedTrail();
      return resultsNode;
    }

    function destroy() {
      if (observer) observer.disconnect();
      if (theater && theater.hasAttribute("open")) close();
      if (theater) theater.remove();
      removeLaunch();
      mounted = false;
      observer = null;
      theater = null;
      resultsNode = null;
      inputNode = null;
      formNode = null;
    }

    return Object.freeze({
      mount: mount,
      refresh: refresh,
      open: open,
      close: close,
      destroy: destroy,
      getTrail: function () { return currentTrail; }
    });
  }

  function autoMount() {
    if (!root.document || root.WWAMPlayAnswerUIInstance) return;
    try {
      var instance = create({ document: root.document });
      if (instance.mount()) root.WWAMPlayAnswerUIInstance = instance;
    } catch (error) {
      var results = root.document.getElementById("askResults");
      if (results) {
        var held = root.document.createElement("p");
        held.className = "play-answer-restore-status";
        held.setAttribute("data-tone", "error");
        held.setAttribute("role", "status");
        held.textContent = "PLAY THE ANSWER HELD // " +
          text(error.code || error.message || String(error), 300);
        results.prepend(held);
      }
    }
  }

  root.WWAMPlayAnswerUI = Object.freeze({
    create: create,
    buildSourceRegistry: buildSourceRegistry,
    compileBindings: compileBindings,
    safeAskAnalysis: safeAskAnalysis,
    normalizeTrail: normalizeTrail,
    trailSignature: trailSignature,
    packetToken: packetToken,
    packetFromToken: packetFromToken,
    shareUrl: shareUrl,
    shareParam: SHARE_PARAM,
    hardLine: HARD_LINE
  });

  if (root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", autoMount, { once: true });
    } else {
      autoMount();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
