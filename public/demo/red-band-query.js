(function (root) {
  "use strict";

  var VERSION = "1.1.0";
  var INTENT = /\b(?:red\s*band(?:\s*100)?|memorability\s+index|most\s+memorable\s+moments?)\b/i;
  var FOLLOW_UP = /^(?:(?:and|then|what about|what is|show me)\s+)*(?:(?:rank|number)\s*)?#?\d{1,3}(?:st|nd|rd|th)?\??$/i;

  function matches(query, previous) {
    var value = String(query || "").trim();
    if (INTENT.test(value)) return true;
    var priorRedBand = previous && (
      previous.intent === "red-band-ranking" ||
      String(previous.entity || "").toLowerCase() === "red band 100"
    );
    return Boolean(priorRedBand && FOLLOW_UP.test(value));
  }

  function validRank(value) {
    return Number.isInteger(value) && value >= 1 && value <= 100;
  }

  function select(query) {
    var value = String(query || "");
    var range = value.match(
      /\b(?:ranks?|numbers?)?\s*#?(\d{1,3})\s*(?:-|–|to|through)\s*#?(\d{1,3})\b/i
    );
    if (range) {
      var first = Number(range[1]);
      var last = Number(range[2]);
      if (!validRank(first) || !validRank(last)) {
        return {
          start: first,
          end: last,
          mode: "range",
          invalid: true,
          requested: first + "–" + last,
        };
      }
      var start = Math.min(first, last);
      var requestedEnd = Math.max(first, last);
      var end = Math.min(requestedEnd, start + 9);
      return {
        start: start,
        end: end,
        requestedEnd: requestedEnd,
        mode: "range",
        truncated: end < requestedEnd,
      };
    }
    var exact = value.match(/(?:\brank(?:ed)?|\bnumber|#)\s*#?\s*(\d{1,3})\b/i);
    if (!exact && INTENT.test(value)) {
      exact = value.match(/\b(\d{1,3})(?:st|nd|rd|th)\b/i);
    }
    if (exact) {
      var rank = Number(exact[1]);
      if (!validRank(rank)) {
        return {
          start: rank,
          end: rank,
          mode: "exact",
          invalid: true,
          requested: String(rank),
        };
      }
      return { start: rank, end: rank, mode: "exact" };
    }
    var top = value.match(/\btop\s+(\d{1,3})\b/i);
    var requestedLimit = top ? Number(top[1]) : 1;
    if (requestedLimit < 1) {
      return {
        start: 0,
        end: 0,
        mode: "top",
        invalid: true,
        requested: String(requestedLimit),
      };
    }
    var limit = Math.min(10, requestedLimit);
    return {
      start: 1,
      end: limit,
      requestedEnd: requestedLimit,
      mode: limit === 1 ? "leader" : "top",
      truncated: requestedLimit > limit,
    };
  }

  function defaultLaneLabel(moment) {
    return moment.lane === "recent-livestream" ? "FRESH 10" :
      moment.lane === "popular-livestream" ? "POPULAR 25" : "COMMENTARY";
  }

  function create(options) {
    options = options || {};
    var ranking = options.ranking;
    var resolveSource = typeof options.resolveSource === "function" ?
      options.resolveSource : function (moment) {
        return {
          id: moment.sourceId || moment.tapeId || moment.id,
          title: moment.sourceTitle || "WWAM SOURCE",
          sourceType: moment.lane === "commentary" ? "commentary" : "livestream",
          laneLabel: defaultLaneLabel(moment),
        };
      };
    var boundedExcerpt = typeof options.boundedExcerpt === "function" ?
      options.boundedExcerpt : function (value) { return String(value || ""); };
    if (!ranking || typeof ranking.getByRank !== "function") {
      throw new Error("Red Band Query requires a compatible ranking index");
    }

    function analyze(query, previous) {
      if (!matches(query, previous)) return null;
      var chosen = select(query);
      if (chosen.invalid) {
        return {
          intent: "red-band-ranking",
          entity: "Red Band 100",
          source: "all",
          results: [],
          evidenceChain: [],
          confidence: 100,
          status: "out-of-range",
          questionType: "rank validation",
          metric: "memorability candidate index v2.1",
          answer: "Red Band ranks run from #001 through #100. #" +
            String(chosen.start).padStart(3, "0") +
            " was not silently changed to a different rank.",
          confidenceBasis: [
            "The published index contains exactly 100 unique ranks",
            "Out-of-range selectors fail closed instead of clamping",
          ],
          limitations: [
            "No receipt was returned because the requested rank is outside #001–#100.",
          ],
          recommendedSurface: {
            href: "#red100",
            label: "Inspect the full Red Band 100",
            reason: "Choose any published rank from #001 through #100.",
          },
          suggestions: [
            "What is Red Band rank #100?",
            "Show me the top 5 most memorable moments",
          ],
        };
      }
      var moments = [];
      for (var rank = chosen.start; rank <= chosen.end; rank += 1) {
        var moment = ranking.getByRank(rank);
        if (moment) moments.push(moment);
      }
      var results = moments.map(function (moment) {
        var source = resolveSource(moment) || {};
        return {
          key: moment.rankKey,
          rank: moment.rank,
          kind: "red-band-rank",
          source: source.sourceType || "livestream",
          sourceId: source.id,
          lane: moment.lane,
          laneLabel: source.laneLabel || defaultLaneLabel(moment),
          at: Number(moment.t || 0),
          title: "#" + String(moment.rank).padStart(3, "0") + " · " +
            (source.title || moment.sourceTitle || "WWAM SOURCE"),
          category: moment.category,
          excerpt: moment.excerpt || moment.quote || "",
          score: moment.score,
          speaker: null,
          evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
          evidenceType: "caption-excerpt",
          reasons: [
            "INDEX " + Number(moment.score).toFixed(2),
            moment.category,
            moment.confidenceLabel,
          ],
          evidenceWarnings: [
            "Machine-ranked by Memorability Candidate Index V2.1; not a creator vote or canon declaration.",
            "Speaker not diarized; the receipt makes no host-authorship or true-origin claim.",
          ].concat((moment.uncertainty && moment.uncertainty.reasons) || []),
          subtitle: (moment.whyMemorable || []).join(" "),
        };
      });
      var rankLabel = chosen.start === chosen.end ?
        "#" + String(chosen.start).padStart(3, "0") :
        "#" + String(chosen.start).padStart(3, "0") + "–#" +
          String(chosen.end).padStart(3, "0");
      var answer = results.length === 1 ?
        rankLabel + " is “" + boundedExcerpt(results[0].excerpt) + "” from " +
          results[0].title.replace(/^#\d+\s*·\s*/, "") + "." :
        "Here are Red Band ranks " + rankLabel + " in exact index order." +
          (chosen.truncated ? " The public answer is capped at 10 ranks; the full index remains available below." : "");
      return {
        intent: "red-band-ranking",
        entity: "Red Band 100",
        source: "all",
        results: results,
        evidenceChain: results.map(function (result, index) {
          return {
            role: index === 0 ? "EXACT INDEX HIT" : "NEXT INDEX RANK",
            result: result,
          };
        }),
        confidence: results.length ? 100 : 0,
        status: "machine-ranked",
        questionType: chosen.mode === "exact" ? "exact rank lookup" : "ranked list",
        metric: "memorability candidate index v2.1",
        answer: answer,
        confidenceBasis: [
          "Exact unique rank key from Memorability Candidate Index V2.1",
          "Playable YouTube timestamp and bounded caption excerpt",
          "Disclosed score components with recency excluded and editorial votes at zero by default",
        ],
        limitations: [
          "Memorability is a transparent machine ranking, not an authenticated Mike/J vote.",
          "The indexed caption receipt is not speaker-diarized.",
          "Rankings compare the current bounded commentary, Fresh 10, and Popular 25 evidence sets.",
        ],
        recommendedSurface: {
          href: "#red100",
          label: "Inspect the full Red Band 100",
          reason: "See every score, signal bar, source, timestamp, and ranking boundary.",
        },
        suggestions: [
          "What is Red Band rank #25?",
          "Show me the top 5 most memorable moments",
        ],
      };
    }

    return {
      matches: matches,
      select: select,
      analyze: analyze,
    };
  }

  root.WWAMRedBandQuery = Object.freeze({
    VERSION: VERSION,
    matches: matches,
    select: select,
    create: create,
  });
})(typeof window !== "undefined" ? window : globalThis);
