(function (root) {
  "use strict";

  /*
   * EXACT-SHOW DEEP-CUT BRIDGE
   *
   * Global Ask owns title resolution. This bridge only runs after that engine
   * has selected one commentary with no alternatives, then searches the
   * caption-grounded Episode Guide for the unresolved subject. It never tries
   * to resolve a title itself and never substitutes a cut from another upload.
   */

  var VERSION = "1.0.0";
  var GUIDE_URL = "episode-guides.js?v=2.1.2-final";
  var GUIDE_SCHEMA = "wwam-episode-guides/v2";
  var EPISODE_SCHEMA = "wwam-episode-guide/v2";
  var SOURCE_ID = /^[A-Za-z0-9_-]{11}$/;
  var MAX_TERMS = 8;
  var MAX_RESULTS = 7;

  function normalize(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function finite(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function time(value) {
    var seconds = Math.max(0, Math.floor(Number(value) || 0));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainder = seconds % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") :
      minutes) + ":" + String(remainder).padStart(2, "0");
  }

  function uniqueTerms(values) {
    var seen = {};
    return (Array.isArray(values) ? values : []).map(normalize)
      .filter(function (term) {
        if (!term || term.length < 2 || term.length > 80 || seen[term]) return false;
        seen[term] = true;
        return true;
      }).slice(0, MAX_TERMS);
  }

  function sameTitle(source, selectedTitle) {
    var selected = normalize(selectedTitle);
    return Boolean(selected && [source.film, source.title].some(function (title) {
      return normalize(title) === selected;
    }));
  }

  function plan(query, catalog, analysis) {
    if (!analysis || analysis.status !== "insufficient-evidence" ||
        analysis.source !== "commentary" ||
        !Array.isArray(analysis.results) || analysis.results.length ||
        String(query || "").trim() !== String(analysis.query || "").trim()) return null;

    var selected = analysis.selectionPlan && analysis.selectionPlan.source;
    var terms = uniqueTerms(analysis.queryPlan && analysis.queryPlan.subjectTerms);
    if (!selected || !SOURCE_ID.test(String(selected.sourceId || "")) ||
        ["exact", "near-exact"].indexOf(selected.matchMode) < 0 ||
        Number(selected.alternativeCount || 0) !== 0 || !terms.length) return null;

    var matches = (Array.isArray(catalog) ? catalog : []).filter(function (source) {
      return source && source.id === selected.sourceId;
    });
    if (matches.length !== 1) return null;
    var source = matches[0];
    if (source.transcript !== true || !sameTitle(source, selected.sourceTitle) ||
        String(source.date || "") !== String(selected.date || "")) return null;

    return Object.freeze({
      source: source,
      selected: selected,
      terms: Object.freeze(terms),
    });
  }

  function guideFor(payload, sourceId) {
    if (!payload || payload.schema !== GUIDE_SCHEMA || !Array.isArray(payload.guides)) return null;
    var matches = payload.guides.filter(function (guide) {
      return guide && guide.id === sourceId &&
        guide.episodeGuide && guide.episodeGuide.schema === EPISODE_SCHEMA;
    });
    return matches.length === 1 ? matches[0].episodeGuide : null;
  }

  function searchableCut(cut) {
    return normalize([
      cut && cut.excerpt,
      cut && cut.topic,
      cut && cut.label,
      cut && cut.category,
    ].join(" "));
  }

  function validCut(cut, source) {
    var at = finite(cut && cut.t);
    var end = finite(cut && cut.end);
    var duration = finite(source && source.duration);
    return Boolean(cut && cut.id && cut.excerpt && at !== null && end !== null &&
      duration !== null && at >= 0 && end > at && end <= duration);
  }

  function cutResult(cut, source, terms, index) {
    var at = Number(cut.t);
    var end = Number(cut.end);
    var topic = String(cut.topic || "Deep-dive cut");
    var category = String(cut.category || "EPISODE GUIDE");
    var key = "episode-guide:" + source.id + ":" + cut.id;
    var warnings = [
      "Analysis-weighted Episode Guide cut; not a canonical Ask moment or a host-level verdict.",
      "Speaker identity is not diarized; the source, date, and playback bounds are exact.",
    ];
    return {
      key: key,
      id: String(cut.id),
      kind: "guide-cut",
      type: "guide-cut",
      source: "commentary",
      sourceId: source.id,
      sourceTitle: source.film || source.title,
      sourceUploadTitle: source.title,
      title: topic + " // " + category,
      date: source.date,
      at: at,
      end: end,
      excerpt: String(cut.excerpt),
      category: category,
      topic: topic,
      score: finite(cut.score) || 0,
      reasons: ["exact show", "caption guide", terms.join(" + ")],
      rank: index + 1,
      lane: "episode-guide",
      laneLabel: "EPISODE GUIDE V2 // ANALYSIS-WEIGHTED CUT",
      guideCutId: String(cut.id),
      guideSchema: EPISODE_SCHEMA,
      evidenceType: "caption-guide-cut",
      evidenceLevel: "EPISODE GUIDE V2 DEEP-DIVE CUT",
      evidenceBasis: cut.evidenceBasis || "bounded-caption-guide-cut",
      evidenceWarnings: warnings.slice(),
      warnings: warnings.slice(),
      speaker: null,
      speakerStatus: "not-diarized",
      authenticatedEditorVerified: false,
      playback: { start: at, end: end, clipSeconds: end - at },
      url: (source.url || "https://www.youtube.com/watch?v=" + source.id) +
        ((source.url || "").indexOf("?") >= 0 ? "&" : "?") + "t=" + at + "s",
    };
  }

  function answer(query, catalog, analysis, payload) {
    var bridgePlan = plan(query, catalog, analysis);
    if (!bridgePlan) return null;
    var episodeGuide = guideFor(payload, bridgePlan.source.id);
    if (!episodeGuide || !Array.isArray(episodeGuide.cuts)) return null;

    var matches = episodeGuide.cuts.filter(function (cut) {
      if (!validCut(cut, bridgePlan.source)) return false;
      var haystack = searchableCut(cut);
      return bridgePlan.terms.every(function (term) {
        return haystack.indexOf(term) >= 0;
      });
    }).sort(function (left, right) {
      return (Number(right.score) || 0) - (Number(left.score) || 0) ||
        Number(left.t) - Number(right.t);
    }).slice(0, MAX_RESULTS);
    if (!matches.length) return null;

    var results = matches.map(function (cut, index) {
      return cutResult(cut, bridgePlan.source, bridgePlan.terms, index);
    });
    var primary = results[0];
    var sourceLabel = bridgePlan.source.film || bridgePlan.source.title;
    var limitations = [
      "These are analysis-weighted Episode Guide cuts grounded in bounded captions, not canonical Ask moments.",
      "No speaker identity, intent, or host-level opinion is inferred from the caption text.",
      "Results are locked to " + sourceLabel + " (" + bridgePlan.source.id + "); no other upload was searched.",
    ];
    var nextQueryPlan = Object.assign({}, analysis.queryPlan, {
      outputShape: results.length > 1 ? "list" : "single",
      deepCutBridge: {
        version: VERSION,
        guideSchema: EPISODE_SCHEMA,
        exactSourceOnly: true,
      },
    });
    var nextSelection = Object.assign({}, analysis.selectionPlan, {
      source: Object.assign({}, analysis.selectionPlan.source, {
        guideSchema: EPISODE_SCHEMA,
        guideCutCount: results.length,
      }),
      withinSource: {
        intent: "episode-guide",
        metric: "caption-term-match",
        terms: bridgePlan.terms.slice(),
        exactSourceOnly: true,
      },
    });
    var evidenceChain = results.map(function (result, index) {
      return {
        role: index ? "supporting exact-show deep cut" : "best exact-show deep cut",
        result: result,
      };
    });

    return Object.assign({}, analysis, {
      status: "supported",
      intent: "topic",
      questionType: "where",
      metric: "caption-term-match",
      source: "commentary",
      answer: "Inside " + sourceLabel + ", the Episode Guide finds " +
        (results.length === 1 ? "one bounded caption cut" :
          results.length + " bounded caption cuts") + " for \"" +
        bridgePlan.terms.join(" + ") + "\". Start at " + time(primary.at) +
        ". This clip stays inside that exact upload; auto-captions can be imperfect.",
      confidence: 94,
      confidenceBasis: [
        "one exact commentary source selected with zero alternatives",
        "subject terms appear inside each displayed Episode Guide cut",
        "source ID, date, start, and end are preserved",
      ],
      limitations: limitations,
      suggestions: [],
      queryPlan: nextQueryPlan,
      selectionPlan: nextSelection,
      results: results,
      resultCount: results.length,
      collection: {
        total: results.length,
        shown: results.length,
        unit: results.length === 1 ? "PLAYABLE MATCH" : "PLAYABLE MATCHES",
        sourceIds: [bridgePlan.source.id],
        countBasis: "One exact show only; duplicate or cross-source records never count.",
      },
      evidenceChain: evidenceChain,
      context: Object.assign({}, analysis.context, {
        query: query,
        intent: "topic",
        source: "commentary",
        metric: "caption-term-match",
        entity: sourceLabel,
        entityType: "film",
        sourceId: bridgePlan.source.id,
        resultAnchor: {
          key: primary.key,
          sourceId: primary.sourceId,
          at: primary.at,
          end: primary.end,
        },
      }),
      deepCutBridge: {
        version: VERSION,
        guideSchema: EPISODE_SCHEMA,
        sourceId: bridgePlan.source.id,
        sourceTitle: sourceLabel,
        date: bridgePlan.source.date,
        terms: bridgePlan.terms.slice(),
        exactSourceOnly: true,
        crossSourceSubstitution: false,
      },
    });
  }

  function resolve(query, catalog, loadScript, analysis) {
    if (!plan(query, catalog, analysis)) return Promise.resolve(null);
    var loaded = root.WWAM_EPISODE_GUIDES ?
      Promise.resolve() :
      typeof loadScript === "function" ?
        Promise.resolve(loadScript(GUIDE_URL)) :
        Promise.resolve();
    return loaded.then(function () {
      return answer(query, catalog, analysis, root.WWAM_EPISODE_GUIDES);
    }).catch(function () {
      return null;
    });
  }

  root.WWAMAskDeepCut = Object.freeze({
    version: VERSION,
    guideUrl: GUIDE_URL,
    plan: plan,
    answer: answer,
    resolve: resolve,
  });
})(typeof window !== "undefined" ? window : globalThis);