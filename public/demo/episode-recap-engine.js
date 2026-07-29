(function (root) {
  "use strict";

  var SCHEMA = "shokker-episode-recap/v1";
  var VERSION = "1.0.0";

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function record(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function orderedStrings(values) {
    var output = [];
    array(values).map(clean).filter(Boolean).forEach(function (value) {
      if (output.indexOf(value) < 0) output.push(value);
    });
    return output;
  }

  function hash(value) {
    var text = clean(value);
    var output = 2166136261;
    for (var index = 0; index < text.length; index += 1) {
      output ^= text.charCodeAt(index);
      output = Math.imul(output, 16777619);
    }
    return ("00000000" + (output >>> 0).toString(16)).slice(-8);
  }

  function receiptKind(receipt) {
    var kind = clean(receipt.kind).toLowerCase();
    var evidenceType = clean(receipt.evidenceType).toLowerCase();
    if (kind.indexOf("topic") >= 0 || evidenceType.indexOf("topic") >= 0) return "topic";
    if (kind.indexOf("character") >= 0 || evidenceType.indexOf("character") >= 0) return "character";
    return "moment";
  }

  function receiptTime(receipt) {
    return Math.max(0, number(receipt.at != null ? receipt.at : receipt.t));
  }

  function receiptEnd(receipt, duration) {
    var at = receiptTime(receipt);
    var end = number(receipt.end);
    if (end <= at) end = at + 24;
    return Math.min(Math.max(at, number(duration)), end);
  }

  function receiptSignal(receipt) {
    var signal = number(receipt.signalScore);
    if (!signal) signal = number(receipt.heat);
    if (!signal && receiptKind(receipt) === "topic") signal = number(receipt.mentions);
    return signal;
  }

  function chronological(receipts, sourceId) {
    var seen = {};
    return array(receipts).filter(function (receipt) {
      var key = clean(receipt && receipt.key);
      var receiptSourceId = clean(receipt && receipt.sourceId);
      if (!key || receiptSourceId && receiptSourceId !== sourceId || seen[key]) return false;
      seen[key] = true;
      return Number.isFinite(Number(receipt.at));
    }).slice().sort(function (left, right) {
      return receiptTime(left) - receiptTime(right) ||
        clean(left.key).localeCompare(clean(right.key));
    });
  }

  function evenSample(values, limit) {
    if (values.length <= limit) return values.slice();
    var output = [];
    for (var index = 0; index < limit; index += 1) {
      var offset = Math.round(index * (values.length - 1) / Math.max(1, limit - 1));
      if (output.indexOf(values[offset]) < 0) output.push(values[offset]);
    }
    return output;
  }

  function targetSectionCount(duration) {
    if (duration < 3600) return 4;
    if (duration < 7200) return 5;
    return 6;
  }

  function topReceipts(values, limit) {
    return values.slice().sort(function (left, right) {
      return receiptSignal(right) - receiptSignal(left) ||
        receiptTime(left) - receiptTime(right) ||
        clean(left.key).localeCompare(clean(right.key));
    }).slice(0, limit);
  }

  function nearestReceiptKeys(receipts, at, limit) {
    return receipts.slice().sort(function (left, right) {
      return Math.abs(receiptTime(left) - at) - Math.abs(receiptTime(right) - at) ||
        receiptSignal(right) - receiptSignal(left) ||
        clean(left.key).localeCompare(clean(right.key));
    }).slice(0, limit).map(function (receipt) { return clean(receipt.key); });
  }

  function topicLabels(receipts, guide) {
    var fromReceipts = topReceipts(receipts.filter(function (receipt) {
      return receiptKind(receipt) === "topic";
    }), 8).map(function (receipt) {
      return clean(receipt.label);
    });
    var fromGuide = array(record(guide).threads).map(function (thread) {
      return clean(thread && thread.name);
    });
    return orderedStrings(fromReceipts.concat(fromGuide)).slice(0, 8);
  }

  function guideSections(source, receipts, guide) {
    return array(guide.chapters).map(function (chapter, index) {
      var at = Math.max(0, number(chapter.at));
      var end = number(chapter.end) > at ? number(chapter.end) :
        Math.min(number(source.duration), at + 36);
      var nearby = nearestReceiptKeys(receipts.filter(function (receipt) {
        return Math.abs(receiptTime(receipt) - at) <= 120;
      }), at, 3);
      return {
        id: clean(chapter.id) || "act-" + String(index + 1).padStart(2, "0"),
        ordinal: index + 1,
        from: at,
        to: end,
        at: at,
        end: end,
        anchor: clean(chapter.topic) || clean(chapter.label) || "Saved chapter",
        category: clean(chapter.category),
        excerpt: clean(chapter.excerpt),
        sourceBody: clean(chapter.body),
        receiptKeys: nearby,
        guideCutId: clean(chapter.cutId),
        evidenceBasis: clean(chapter.evidenceBasis) ||
          "full-caption-episode-guide-chapter",
      };
    }).filter(function (section) {
      return section.guideCutId || section.receiptKeys.length;
    }).sort(function (left, right) {
      return left.at - right.at || left.id.localeCompare(right.id);
    });
  }

  function receiptSections(source, receipts) {
    var duration = Math.max(1, number(source.duration));
    var selected = evenSample(receipts, Math.min(
      targetSectionCount(duration),
      receipts.length
    ));
    return selected.map(function (selectedReceipt, index) {
      var previous = index ? receiptTime(selected[index - 1]) : 0;
      var current = receiptTime(selectedReceipt);
      var next = index + 1 < selected.length ?
        receiptTime(selected[index + 1]) : duration;
      var from = index ? Math.round((previous + current) / 2) : 0;
      var to = index + 1 < selected.length ?
        Math.round((current + next) / 2) : duration;
      var inWindow = receipts.filter(function (receipt) {
        var at = receiptTime(receipt);
        return at >= from && at <= to;
      });
      var moments = topReceipts(inWindow.filter(function (receipt) {
        return receiptKind(receipt) === "moment";
      }), 2);
      var topics = topReceipts(inWindow.filter(function (receipt) {
        return receiptKind(receipt) === "topic";
      }), 3);
      var characters = topReceipts(inWindow.filter(function (receipt) {
        return receiptKind(receipt) === "character";
      }), 2);
      var spotlight = moments[0] || selectedReceipt;
      var keys = orderedStrings(
        [spotlight].concat(topics, characters, moments.slice(1)).map(function (receipt) {
          return clean(receipt.key);
        })
      );
      return {
        id: "runtime-" + String(index + 1).padStart(2, "0"),
        ordinal: index + 1,
        from: from,
        to: to,
        at: receiptTime(spotlight),
        end: receiptEnd(spotlight, duration),
        anchor: clean(spotlight.label) || "Saved checkpoint",
        category: receiptKind(spotlight),
        excerpt: spotlight.publicExcerptAllowed === false ? "" : clean(spotlight.excerpt),
        topicLabels: topics.map(function (receipt) { return clean(receipt.label); }).filter(Boolean),
        characterLabels: characters.map(function (receipt) {
          return clean(receipt.label);
        }).filter(Boolean),
        receiptKeys: keys,
        guideCutId: "",
        evidenceBasis: "source-local-receipts-sampled-across-runtime",
      };
    }).sort(function (left, right) {
      return left.at - right.at || left.id.localeCompare(right.id);
    });
  }

  function feature(receipt, duration) {
    if (!receipt) return null;
    return {
      receiptKey: clean(receipt.key),
      at: receiptTime(receipt),
      end: receiptEnd(receipt, duration),
      label: clean(receipt.label),
      excerpt: receipt.publicExcerptAllowed === false ? "" : clean(receipt.excerpt),
      evidenceBasis: clean(receipt.evidenceBasis) || clean(receipt.evidenceType) ||
        "source-local-receipt",
    };
  }

  function guideFeature(guide, key) {
    var item = record(record(guide).fanRead)[key];
    if (!item || !clean(item.cutId)) return null;
    return {
      guideCutId: clean(item.cutId),
      at: number(item.at),
      end: number(item.end),
      label: clean(item.label),
      topic: clean(item.topic),
      category: clean(item.category),
      body: clean(item.body),
      excerpt: clean(item.excerpt),
      evidenceBasis: clean(item.evidenceBasis) || "episode-guide-fan-read",
    };
  }

  function derivedFanRead(receipts, guide, duration) {
    var moments = topReceipts(receipts.filter(function (receipt) {
      return receiptKind(receipt) === "moment";
    }), receipts.length);
    var loved = moments.find(function (receipt) {
      return /love letter/i.test(clean(receipt.label));
    });
    var hated = moments.find(function (receipt) {
      return /franchise felony|steve/i.test(clean(receipt.label));
    });
    var wildest = moments.find(function (receipt) {
      return /up in ya|out of pocket|full send/i.test(clean(receipt.label));
    });
    var last = moments.slice().sort(function (left, right) {
      return receiptTime(right) - receiptTime(left);
    })[0];
    return {
      loved: guideFeature(guide, "loved") || feature(loved, duration),
      hated: guideFeature(guide, "hated") || feature(hated, duration),
      wildestDetour: guideFeature(guide, "wildestDetour") || feature(wildest, duration),
      lastWord: guideFeature(guide, "lastWord") || feature(last, duration),
    };
  }

  function held(source, format) {
    var fingerprint = hash([
      source.id, source.title, source.date, source.duration, source.views,
      clean(format.id), "held", VERSION
    ].join("|"));
    return {
      schema: SCHEMA,
      generatorVersion: VERSION,
      sourceId: clean(source.id),
      sourceFingerprint: "fnv1a32:" + fingerprint,
      semanticFingerprint: "fnv1a32:" + fingerprint,
      evidenceState: "held",
      mode: "source-safe-held",
      coverage: {
        state: clean(source.coverage) || "unknown",
        wordsAudited: number(source.wordsAudited),
        receipts: 0,
      },
      format: {
        id: clean(format.id),
        label: clean(format.label),
        basis: clean(format.basis),
      },
      metadata: {
        title: clean(source.displayTitle || source.title),
        date: clean(source.date),
        duration: number(source.duration),
        views: number(source.views),
        url: clean(source.url),
      },
      topics: [],
      sections: [],
      bestMoments: [],
      fanRead: {},
      limitations: [
        "No source-local caption receipt is registered.",
        "No episode events, reactions, speakers, jokes, or verdicts are synthesized from metadata.",
      ],
    };
  }

  function build(input) {
    input = record(input);
    var source = record(input.source);
    var sourceId = clean(source.id);
    if (!/^[A-Za-z0-9_-]{11}$/.test(sourceId)) {
      throw new Error("Episode Recap requires one canonical 11-character source ID.");
    }
    var format = record(input.format);
    var receipts = chronological(input.receipts, sourceId);
    var guide = record(input.episodeGuide || source.episodeGuide);
    var guideReady = clean(guide.schema) === "wwam-episode-guide/v2" &&
      array(guide.chapters).length > 0;
    if (clean(source.coverage) !== "caption-backed" || (!receipts.length && !guideReady)) {
      return held(source, format);
    }

    var sections = guideReady ?
      guideSections(source, receipts, guide) :
      receiptSections(source, receipts);
    var moments = topReceipts(receipts.filter(function (receipt) {
      return receiptKind(receipt) === "moment";
    }), 8);
    var topics = topicLabels(receipts, guide);
    var mode = guideReady ? "full-chronicle" :
      moments.length ? "receipt-recap" : "topic-recap";
    var semanticFingerprint = hash(JSON.stringify({
      sourceId: sourceId,
      mode: mode,
      format: clean(format.id),
      topics: topics,
      sections: sections.map(function (section) {
        return [
          section.id, section.at, section.end, section.anchor, section.category,
          section.receiptKeys, section.guideCutId
        ];
      }),
      version: VERSION,
    }));
    return {
      schema: SCHEMA,
      generatorVersion: VERSION,
      sourceId: sourceId,
      sourceFingerprint: "fnv1a32:" + hash([
        sourceId, source.title, source.date, source.duration, source.views,
        source.wordsAudited, receipts.length
      ].join("|")),
      semanticFingerprint: "fnv1a32:" + semanticFingerprint,
      evidenceState: "ready",
      mode: mode,
      coverage: {
        state: "caption-backed",
        wordsAudited: number(source.wordsAudited),
        receipts: receipts.length,
      },
      format: {
        id: clean(format.id),
        label: clean(format.label),
        basis: clean(format.basis),
      },
      metadata: {
        title: clean(source.displayTitle || source.title),
        date: clean(source.date),
        duration: number(source.duration),
        views: number(source.views),
        url: clean(source.url),
      },
      topics: topics,
      sections: sections,
      bestMoments: moments.map(function (receipt) {
        return feature(receipt, source.duration);
      }).filter(Boolean),
      fanRead: derivedFanRead(receipts, guide, source.duration),
      guideOverview: guideReady ? clean(guide.overview) : "",
      guideWhyItMatters: guideReady ?
        clean(record(record(guide.fanRead).whyThisNightMatters).body) : "",
      limitations: [
        "Automatic captions do not establish the speaker.",
        "Playback is the final word on context, delivery, and audio origin.",
        "The recap is fan-archive editorial, not creator approval.",
      ],
    };
  }

  root.ShokkerEpisodeRecap = Object.freeze({
    SCHEMA: SCHEMA,
    VERSION: VERSION,
    build: build,
  });
}("undefined" !== typeof window ? window : globalThis));
