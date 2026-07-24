(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var CONTEXT_PARAM = "askContext";
  var SOURCES = ["all", "commentary", "livestream"];
  var LANES = ["", "fresh", "popular", "archive"];
  var KINDS = ["tape", "moment", "livestream", "topic", "character", "character-performance"];

  function text(value, limit) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function oneOf(value, choices) {
    value = text(value, 40);
    return choices.indexOf(value) >= 0 ? value : "";
  }

  function snapshot() {
    var dna = root.WWAM_CHANNEL_DNA || {};
    var proof = dna.proofSnapshot || {};
    return [dna.id || "wwam", proof.asOf || "", proof.sources || 0, proof.receipts || 0].join(":");
  }

  function safeAnchor(value) {
    value = value || {};
    var sourceId = text(value.sourceId, 32);
    var at = Number(value.at || 0);
    var kind = oneOf(value.kind, KINDS);
    if (!/^[A-Za-z0-9_-]{6,32}$/.test(sourceId) || !Number.isFinite(at) ||
        at < 0 || at > 200000 || !kind) return null;
    return {
      key: text(value.key, 120),
      source: oneOf(value.source, SOURCES) || "all",
      sourceId: sourceId,
      at: Math.round(at * 100) / 100,
      kind: kind,
      lane: oneOf(value.lane, LANES),
    };
  }

  function safeContext(value) {
    value = value || {};
    var anchor = safeAnchor(value.resultAnchor);
    var redBand = value.intent === "red-band-ranking" &&
      String(value.entity || "").toLowerCase() === "red band 100";
    if (!anchor && !redBand) return null;
    return {
      query: text(value.query, 240),
      intent: text(value.intent, 40),
      source: oneOf(value.source, SOURCES) || (anchor ? anchor.source : "all"),
      entity: text(value.entity, 100),
      entityType: text(value.entityType, 32),
      resultAnchor: anchor,
    };
  }

  function build(href, query, context) {
    var url = new URL(href);
    ["tape", "live", "at", "nightShift", CONTEXT_PARAM].forEach(function (name) {
      url.searchParams.delete(name);
    });
    url.searchParams.set("ask", text(query, 240));
    var safe = safeContext(context);
    if (safe) {
      url.searchParams.set(CONTEXT_PARAM, JSON.stringify({
        snapshot: snapshot(),
        context: safe,
      }));
    }
    url.hash = "ask";
    return url.toString();
  }

  function read(search) {
    var params = new URLSearchParams(search || "");
    var query = text(params.get("ask"), 240);
    if (!query) return null;
    var context = null;
    var stale = false;
    try {
      var packet = JSON.parse(params.get(CONTEXT_PARAM) || "null");
      if (packet && packet.snapshot === snapshot()) context = safeContext(packet.context);
      else if (packet) stale = true;
    } catch {
      context = null;
    }
    return {
      query: query,
      context: context,
      needsArchive: Boolean(context && context.resultAnchor &&
        context.resultAnchor.lane === "archive"),
      needsRedBand: Boolean(context && context.intent === "red-band-ranking"),
      stale: stale,
    };
  }

  root.WWAMAskShare = Object.freeze({
    VERSION: VERSION,
    build: build,
    read: read,
  });
})(typeof window !== "undefined" ? window : globalThis);
