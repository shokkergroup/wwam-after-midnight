(function (root) {
  "use strict";

  var SCHEMA = "shokker-episode-recap/v1";
  var VERSION = "1.6.0";

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function optionalNumber(value) {
    var parsed = Number(value);
    return value == null || value === "" || !Number.isFinite(parsed) ? null : parsed;
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

  function displayLabel(value) {
    return clean(value)
      .replace(/^(?:TOPIC|CHARACTER PERFORMANCE|CHARACTER|MOMENT)\s*:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function words(value) {
    var stops = {
      a: true, an: true, and: true, are: true, at: true, for: true, from: true,
      in: true, is: true, live: true, movie: true, of: true, on: true, or: true,
      party: true, show: true, stream: true, the: true, to: true, vs: true,
      watch: true, watchalong: true, watched: true, we: true, with: true,
    };
    return clean(value).toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(function (word) {
        return word.length > 1 && !stops[word];
      });
  }

  function titleRelevance(label, title) {
    var topic = displayLabel(label).toLowerCase();
    var sourceTitle = clean(title).toLowerCase();
    if (!topic || !sourceTitle) return 0;
    var normalizedTopic = topic.replace(/[^a-z0-9]+/g, " ").trim();
    var normalizedTitle = sourceTitle.replace(/[^a-z0-9]+/g, " ").trim();
    if (normalizedTopic.length >= 3 &&
        (" " + normalizedTitle + " ").indexOf(" " + normalizedTopic + " ") >= 0) {
      return 1000 + normalizedTopic.length;
    }
    var topicWords = words(topic);
    var titleWords = words(sourceTitle);
    if (!topicWords.length || !titleWords.length) return 0;
    var overlap = topicWords.filter(function (word) {
      return titleWords.indexOf(word) >= 0;
    });
    if (!overlap.length) return 0;
    var exactness = overlap.length / topicWords.length;
    var coverage = overlap.length / titleWords.length;
    return Math.round(exactness * 520 + coverage * 180 +
      overlap.reduce(function (sum, word) {
        return sum + Math.min(12, word.length) * 8;
      }, 0));
  }

  function humanizeEntityId(value) {
    var id = clean(value);
    if (id.indexOf("character:") !== 0) return "";
    var slug = id.slice("character:".length).toLowerCase();
    var known = {
      "challis": "Dr. Challis",
      "corey-feldman": "Corey Feldman",
      "dr-challis": "Dr. Challis",
      "dr-loomis": "Dr. Loomis",
      "loomis": "Dr. Loomis",
      "slender-man": "Slenderman",
      "slenderman": "Slenderman",
    };
    if (known[slug]) return known[slug];
    return slug.split(/[-_]+/).filter(Boolean).map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function characterLabels(receipt) {
    var entities = array(receipt && receipt.entityIds).map(humanizeEntityId).filter(Boolean);
    var label = displayLabel(receipt && receipt.label);
    if (label && !/^(?:character performance|character signal)$/i.test(label)) {
      entities.unshift(label);
    }
    return orderedStrings(entities);
  }

  function receiptDisplayLabel(receipt) {
    if (receiptKind(receipt) === "character") {
      return characterLabels(receipt)[0] || "Named character receipt";
    }
    return displayLabel(receipt && receipt.label) || "Saved checkpoint";
  }

  function safeExcerpt(receipt, limit) {
    if (!receipt || receipt.publicExcerptAllowed === false) return "";
    var text = clean(receipt.excerpt)
      .replace(/^[\s.…]+|[\s.…]+$/g, "")
      .replace(/\s+/g, " ");
    if (!text) return "";
    var parts = text.split(/\s+/).slice(0, Math.max(1, limit || 16));
    return parts.join(" ") + (text.split(/\s+/).length > parts.length ? "…" : "");
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

  function normalizedEvidenceText(values) {
    return array(values).map(function (value) {
      return displayLabel(value).toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }).filter(Boolean).join(" ");
  }

  function evidenceSubject(evidence) {
    evidence = record(evidence);
    return displayLabel(
      evidence.topic ||
      characterLabels(evidence)[0] ||
      evidence.label ||
      evidence.category ||
      "Saved checkpoint"
    );
  }

  function evidenceSupportsSubject(subject, evidence) {
    evidence = record(evidence);
    var subjectLabel = displayLabel(subject);
    if (!subjectLabel) return false;
    var evidenceLabels = orderedStrings(
      [evidence.topic, evidence.label, evidence.category]
        .concat(characterLabels(evidence))
    );
    var haystack = normalizedEvidenceText(
      evidenceLabels.concat([evidence.excerpt])
    );
    var exact = normalizedEvidenceText([subjectLabel]);
    if (!haystack || !exact) return false;
    if ((" " + haystack + " ").indexOf(" " + exact + " ") >= 0) return true;
    var haystackWords = haystack.split(/\s+/);
    return words(subjectLabel).some(function (word) {
      return word.length >= 3 && haystackWords.indexOf(word) >= 0;
    });
  }

  function preferredSubjectAnchor(receipts, subject) {
    return topReceipts(array(receipts).filter(function (receipt) {
      return evidenceSupportsSubject(subject, receipt);
    }), 1)[0] || null;
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

  function targetSectionCount(duration) {
    if (duration < 1800) return 5;
    if (duration < 3600) return 6;
    if (duration < 5400) return 7;
    if (duration < 7200) return 8;
    if (duration < 10800) return 10;
    return 12;
  }

  function topReceipts(values, limit) {
    return values.slice().sort(function (left, right) {
      return receiptSignal(right) - receiptSignal(left) ||
        receiptTime(left) - receiptTime(right) ||
        clean(left.key).localeCompare(clean(right.key));
    }).slice(0, limit);
  }

  function bestMomentReceipts(values, duration, limit) {
    var remaining = topReceipts(values, values.length);
    var selected = [];
    var labels = {};
    var target = Math.min(Math.max(0, number(limit)), remaining.length);
    while (remaining.length && selected.length < target) {
      var bestIndex = 0;
      var bestValue = -Infinity;
      remaining.forEach(function (receipt, index) {
        var signal = Math.min(140, Math.max(0, receiptSignal(receipt))) * 1.5;
        var label = receiptDisplayLabel(receipt).toLowerCase();
        var novelty = labels[label] ? 0 : 28;
        var separation = selected.length ? Math.min.apply(null, selected.map(function (chosen) {
          return Math.abs(receiptTime(chosen) - receiptTime(receipt)) /
            Math.max(1, number(duration));
        })) * 52 : 0;
        var value = signal + novelty + separation;
        if (value > bestValue || value === bestValue &&
            (receiptTime(receipt) < receiptTime(remaining[bestIndex]) ||
             receiptTime(receipt) === receiptTime(remaining[bestIndex]) &&
               clean(receipt.key) < clean(remaining[bestIndex].key))) {
          bestValue = value;
          bestIndex = index;
        }
      });
      var chosen = remaining.splice(bestIndex, 1)[0];
      selected.push(chosen);
      labels[receiptDisplayLabel(chosen).toLowerCase()] = true;
    }
    return selected;
  }

  function receiptBelongsToLane(receipt, context, identityPattern) {
    var key = clean(receipt && receipt.key);
    if (!key) return false;
    return array(record(context).lanes).some(function (lane) {
      var identity = clean(lane && lane.id) + " " + clean(lane && lane.label);
      return identityPattern.test(identity) &&
        array(lane && lane.receiptKeys).map(clean).indexOf(key) >= 0;
    });
  }

  function highlightCategory(receipt, context) {
    var kind = receiptKind(receipt);
    var label = clean(receiptDisplayLabel(receipt)).toUpperCase();
    if (kind === "character") return "CHARACTER APPEARANCE";
    if (receiptBelongsToLane(
      receipt,
      context,
      /straight[- ]to[- ]steve|steve'?s?\s+asshole/i
    )) {
      return "STRAIGHT TO STEVE'S ASSHOLE";
    }
    if (receiptBelongsToLane(
      receipt,
      context,
      /up[- ]in[- ]ya|out[- ]of[- ]pocket/i
    ) || /UP IN YA|OUT OF POCKET|FULL SEND|STINGER/.test(label)) {
      return "UP IN YA / STINGER";
    }
    if (kind === "moment") return "SOUNDBYTE / REPLAY";
    return "MAJOR TOPIC TURN";
  }

  function minimumHighlightCount(duration) {
    if (duration < 2700) return 5;
    if (duration < 5400) return 8;
    if (duration < 7200) return 10;
    if (duration < 10800) return 12;
    return 15;
  }

  function guideHighlightCategory(cut, guide) {
    var fanRead = record(record(guide).fanRead);
    if (clean(record(fanRead.hated).cutId) === clean(cut && cut.id)) {
      return "STRAIGHT TO STEVE'S ASSHOLE";
    }
    if (clean(record(fanRead.wildestDetour).cutId) === clean(cut && cut.id)) {
      return "UP IN YA / STINGER";
    }
    var topic = clean(cut && cut.topic);
    var characterThread = array(record(guide).threads).some(function (thread) {
      return clean(thread && thread.kind).toLowerCase() === "character" &&
        clean(thread && thread.name).toLowerCase() === topic.toLowerCase();
    });
    return characterThread ? "CHARACTER APPEARANCE" : "SOUNDBYTE / REPLAY";
  }

  function guideCutTime(cut) {
    return Math.max(
      0,
      number(cut && (cut.at != null ? cut.at : cut.t))
    );
  }

  function guideHighlightFeature(cut, guide, duration) {
    var at = guideCutTime(cut);
    var end = number(cut && cut.end) > at ?
      number(cut.end) :
      Math.min(number(duration), at + 30);
    var topic = displayLabel(cut && cut.topic);
    var category = displayLabel(cut && cut.category);
    return {
      receiptKey: "",
      guideCutId: clean(cut && cut.id),
      at: at,
      end: Math.min(Math.max(at, number(duration)), end),
      label: topic || category || "Reviewed show cut",
      excerpt: clean(cut && cut.excerpt),
      signalScore: number(cut && cut.score),
      evidenceBasis: clean(cut && cut.evidenceBasis) ||
        "reviewed-episode-guide-timestamp",
      kind: "guide-cut",
      category: guideHighlightCategory(cut, guide),
    };
  }

  function highlightRunway(receipts, duration, guide, context) {
    var reviewedGuideCuts = array(record(guide).cuts).filter(function (cut) {
      return clean(cut && cut.id) &&
        number(cut && cut.end) > guideCutTime(cut);
    });
    var hasPromotableHighlight = receipts.some(function (receipt) {
      return receiptKind(receipt) !== "topic";
    }) || reviewedGuideCuts.length > 0;
    if (!hasPromotableHighlight) return [];
    var minimum = Math.min(
      minimumHighlightCount(duration),
      receipts.length + reviewedGuideCuts.length
    );
    var remaining = receipts.slice();
    var selected = [];
    var selectedKeys = {};
    var selectedLabels = {};

    function take(receipt) {
      var key = clean(receipt && receipt.key);
      if (!key || selectedKeys[key]) return;
      selected.push(receipt);
      selectedKeys[key] = true;
      selectedLabels[receiptDisplayLabel(receipt).toLowerCase()] = true;
    }

    [
      "STRAIGHT TO STEVE'S ASSHOLE",
      "UP IN YA / STINGER",
      "CHARACTER APPEARANCE",
      "SOUNDBYTE / REPLAY",
      "MAJOR TOPIC TURN",
    ].forEach(function (category) {
      take(topReceipts(remaining.filter(function (receipt) {
        return highlightCategory(receipt, context) === category;
      }), 1)[0]);
    });

    // A runtime target is a floor, never a ceiling. Every registered moment or
    // character receipt remains in the runway; strong recurring topics can
    // join it, and future shows with 25 real moments retain all 25.
    remaining.filter(function (receipt) {
      return receiptKind(receipt) !== "topic";
    }).forEach(take);
    var topicCandidates = remaining.filter(function (receipt) {
      return receiptKind(receipt) === "topic";
    });
    var strongestTopicSignal = topicCandidates.reduce(function (maximum, receipt) {
      return Math.max(maximum, receiptSignal(receipt));
    }, 0);
    var topicThreshold = Math.max(10, strongestTopicSignal * 0.35);
    topicCandidates.filter(function (receipt) {
      return receiptSignal(receipt) >= topicThreshold;
    }).forEach(take);

    remaining = remaining.filter(function (receipt) {
      return !selectedKeys[clean(receipt.key)];
    });
    while (remaining.length && selected.length < minimum) {
      var bestIndex = 0;
      var bestValue = -Infinity;
      remaining.forEach(function (receipt, index) {
        var kind = receiptKind(receipt);
        var category = highlightCategory(receipt, context);
        var label = receiptDisplayLabel(receipt).toLowerCase();
        var signal = Math.min(140, Math.max(0, receiptSignal(receipt))) * 1.25;
        var kindWeight = kind === "moment" ? 34 : kind === "character" ? 29 : 12;
        var categoryNovelty = selected.some(function (chosen) {
          return highlightCategory(chosen, context) === category;
        }) ? 0 : 36;
        var labelNovelty = selectedLabels[label] ? 0 : 20;
        var separation = selected.length ? Math.min.apply(null, selected.map(function (chosen) {
          return Math.abs(receiptTime(chosen) - receiptTime(receipt)) /
            Math.max(1, number(duration));
        })) * 70 : 0;
        var value = signal + kindWeight + categoryNovelty + labelNovelty + separation;
        if (value > bestValue || value === bestValue &&
            (receiptTime(receipt) < receiptTime(remaining[bestIndex]) ||
             receiptTime(receipt) === receiptTime(remaining[bestIndex]) &&
               clean(receipt.key) < clean(remaining[bestIndex].key))) {
          bestValue = value;
          bestIndex = index;
        }
      });
      take(remaining.splice(bestIndex, 1)[0]);
    }

    var selectedFeatures = selected.map(function (receipt) {
      return Object.assign({}, feature(receipt, duration), {
        kind: receiptKind(receipt),
        category: highlightCategory(receipt, context),
      });
    });
    var selectedGuideIds = {};
    while (selectedFeatures.length < minimum) {
      var guideCandidates = reviewedGuideCuts.filter(function (cut) {
        if (selectedGuideIds[clean(cut.id)]) return false;
        return !selectedFeatures.some(function (item) {
          var sameWindow = Math.abs(number(item.at) - guideCutTime(cut)) <= 6;
          var sameLabel = normalizedEvidenceText([item.label]) ===
            normalizedEvidenceText([cut.topic || cut.category]);
          var sameExcerpt = normalizedEvidenceText([item.excerpt]) &&
            normalizedEvidenceText([item.excerpt]) ===
              normalizedEvidenceText([cut.excerpt]);
          return sameWindow && (sameLabel || sameExcerpt);
        });
      });
      if (!guideCandidates.length) break;
      guideCandidates.sort(function (left, right) {
        var leftFeature = guideHighlightFeature(left, guide, duration);
        var rightFeature = guideHighlightFeature(right, guide, duration);
        function guideValue(feature) {
          var categoryNovelty = selectedFeatures.some(function (item) {
            return item.category === feature.category;
          }) ? 0 : 34;
          var separation = selectedFeatures.length ? Math.min.apply(
            null,
            selectedFeatures.map(function (item) {
              return Math.abs(number(item.at) - number(feature.at)) /
                Math.max(1, number(duration));
            })
          ) * 85 : 0;
          return Math.min(160, number(feature.signalScore)) +
            categoryNovelty + separation;
        }
        return guideValue(rightFeature) - guideValue(leftFeature) ||
          guideCutTime(left) - guideCutTime(right) ||
          clean(left.id).localeCompare(clean(right.id));
      });
      var guideCut = guideCandidates[0];
      selectedGuideIds[clean(guideCut.id)] = true;
      selectedFeatures.push(guideHighlightFeature(guideCut, guide, duration));
    }

    return selectedFeatures.sort(function (left, right) {
      return number(left.at) - number(right.at) ||
        clean(left.receiptKey || left.guideCutId)
          .localeCompare(clean(right.receiptKey || right.guideCutId));
    }).map(function (item, index) {
      return Object.assign({}, item, {
        ordinal: index + 1,
      });
    });
  }

  function nearestReceiptKeys(receipts, at, limit) {
    return receipts.slice().sort(function (left, right) {
      return Math.abs(receiptTime(left) - at) - Math.abs(receiptTime(right) - at) ||
        receiptSignal(right) - receiptSignal(left) ||
        clean(left.key).localeCompare(clean(right.key));
    }).slice(0, limit).map(function (receipt) { return clean(receipt.key); });
  }

  function titleNamedTopics(title) {
    var text = clean(title);
    var rules = [
      [/\b28\s+years?\s+later\b/i, "28 Years Later"],
      [/\bpeacemaker\b/i, "Peacemaker"],
      [/\b(?:the\s+)?conjuring\b/i, "The Conjuring"],
      [/\bwelcome\s+to\s+derry\b|\bpennywise\b|\bstephen\s+king'?s\s+it\b|\bit\s+chapters?\s+(?:one|two|1|2)\b/i, "IT / Derry"],
      [/\ba\s+nightmare\s+on\s+elm\s+street\b|\bfreddy\b/i, "A Nightmare on Elm Street"],
      [/\bfriday\s+the\s+13(?:th)?\b|\bjason\b/i, "Friday the 13th"],
      [/\bhalloween\b|\bmichael\s+myers\b/i, "Halloween"],
      [/\bscream\b|\bghostface\b/i, "Scream"],
      [/\btexas\s+chainsaw\b|\bleatherface\b/i, "Texas Chainsaw"],
      [/\bevil\s+dead\b/i, "Evil Dead"],
      [/\bhellraiser\b|\bpinhead\b/i, "Hellraiser"],
      [/\bterrifier\b|\bart\s+the\s+clown\b/i, "Terrifier"],
      [/\bchild'?s\s+play\b|\bchucky\b/i, "Chucky"],
      [/\bsaw(?:\s+[xvi0-9]+)?\b/i, "Saw"],
      [/\bpredator\b/i, "Predator"],
      [/\brobo\s*cop\b/i, "RoboCop"],
      [/\bterminator\b/i, "Terminator"],
      [/\baliens?\b/i, "Alien"],
      [/\bbatman\b/i, "Batman"],
      [/\bsuperman\b/i, "Superman"],
      [/\bmarvel\b|\bavengers\b/i, "Marvel"],
      [/\bjurassic\b/i, "Jurassic"],
      [/\bmortal\s+kombat\b/i, "Mortal Kombat"],
      [/\bfinal\s+destination\b/i, "Final Destination"],
      [/\bghostbusters?\b/i, "Ghostbusters"],
      [/\bstranger\s+things\b/i, "Stranger Things"],
    ];
    return rules.filter(function (rule) {
      return rule[0].test(text);
    }).map(function (rule) {
      return rule[1];
    });
  }

  function topicLabels(receipts, guide, source, context) {
    var title = clean(source.displayTitle || source.title);
    var fanWhy = record(record(guide).fanRead).whyThisNightMatters;
    var guidePriority = [
      clean(fanWhy && fanWhy.primaryThread),
      clean(fanWhy && fanWhy.secondaryThread),
    ];
    var guideThreads = array(record(guide).threads).slice().sort(function (left, right) {
      return number(right && right.score) - number(left && left.score) ||
        number(right && right.mentions) - number(left && left.mentions) ||
        clean(left && left.name).localeCompare(clean(right && right.name));
    }).map(function (thread) {
      return clean(thread && thread.name);
    });
    var topicReceipts = receipts.filter(function (receipt) {
      return receiptKind(receipt) === "topic";
    }).slice().sort(function (left, right) {
      var leftRelevance = titleRelevance(receiptDisplayLabel(left), title);
      var rightRelevance = titleRelevance(receiptDisplayLabel(right), title);
      return rightRelevance - leftRelevance ||
        receiptSignal(right) - receiptSignal(left) ||
        receiptTime(left) - receiptTime(right) ||
        clean(left.key).localeCompare(clean(right.key));
    }).map(receiptDisplayLabel);
    var titleTopics = array(record(context).titleTopics).map(displayLabel).filter(Boolean);
    var namedTitleTopics = titleNamedTopics(title);
    return orderedStrings(
      guidePriority.concat(namedTitleTopics, guideThreads, titleTopics, topicReceipts)
    )
      .map(displayLabel)
      .filter(Boolean)
      .slice(0, 8);
  }

  function topicTopology(receipts, duration, guide) {
    var topics = receipts.filter(function (receipt) {
      return receiptKind(receipt) === "topic";
    }).map(function (receipt) {
      var mentions = optionalNumber(receipt.topicMentions);
      if (mentions == null &&
          /topic-mention-count/i.test(clean(receipt.signalBasis))) {
        mentions = optionalNumber(receipt.signalScore);
      }
      var firstAt = optionalNumber(receipt.topicFirstAt);
      var peakAt = optionalNumber(receipt.topicPeakAt);
      var cluster = optionalNumber(receipt.topicCluster);
      if (firstAt == null) firstAt = receiptTime(receipt);
      if (peakAt == null) peakAt = receiptTime(receipt);
      return {
        receiptKey: clean(receipt.key),
        guideCutId: "",
        label: receiptDisplayLabel(receipt),
        at: receiptTime(receipt),
        end: receiptEnd(receipt, duration),
        mentions: mentions == null ? 0 : Math.max(0, Math.round(mentions)),
        firstAt: Math.max(0, firstAt),
        peakAt: Math.max(0, peakAt),
        cluster: cluster == null ? 0 : Math.max(0, Math.round(cluster)),
        metricBasis: clean(receipt.topicMetricBasis) ||
          (/topic-mention-count/i.test(clean(receipt.signalBasis))
            ? "automatic-caption-topic-frequency-and-timing"
            : ""),
      };
    }).filter(function (topic) {
      return Boolean(topic.label && topic.receiptKey);
    });
    var topicByLabel = {};
    topics.forEach(function (topic) {
      topicByLabel[topic.label.toLowerCase()] = topic;
    });
    guideThreads(guide).forEach(function (thread) {
      var key = thread.name.toLowerCase();
      var existing = topicByLabel[key];
      if (existing) {
        existing.mentions = Math.max(existing.mentions, thread.mentions);
        existing.firstAt = Math.min(existing.firstAt, thread.first);
        if (thread.mentions >= existing.mentions) existing.peakAt = thread.peak;
        existing.metricBasis = existing.metricBasis ||
          "reviewed-episode-guide-thread-frequency-and-timing";
        return;
      }
      var guideTopic = {
        receiptKey: "",
        guideCutId: "thread-" + key.replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        label: thread.name,
        at: thread.peak,
        end: Math.min(number(duration), thread.peak + 30),
        mentions: Math.max(0, Math.round(thread.mentions)),
        firstAt: Math.max(0, thread.first),
        peakAt: Math.max(0, thread.peak),
        cluster: Math.max(0, Math.round(thread.score)),
        metricBasis: "reviewed-episode-guide-thread-frequency-and-timing",
      };
      topics.push(guideTopic);
      topicByLabel[key] = guideTopic;
    });
    topics.sort(function (left, right) {
      return right.mentions - left.mentions ||
        right.cluster - left.cluster ||
        left.firstAt - right.firstAt ||
        left.label.localeCompare(right.label);
    });
    var strongest = topics.reduce(function (maximum, topic) {
      return Math.max(maximum, topic.mentions);
    }, 0);
    return topics.map(function (topic, index) {
      return Object.assign({}, topic, {
        rank: index + 1,
        intensity: strongest
          ? Math.max(4, Math.round(topic.mentions / strongest * 100))
          : 0,
        arrivalPercent: duration
          ? Math.max(0, Math.min(100, Math.round(topic.firstAt / duration * 100)))
          : 0,
        peakPercent: duration
          ? Math.max(0, Math.min(100, Math.round(topic.peakAt / duration * 100)))
          : 0,
      });
    });
  }

  function guideSections(source, receipts, guide) {
    var duration = Math.max(1, number(source.duration));
    var chapters = array(guide.chapters).slice().sort(function (left, right) {
      return number(left && left.at) - number(right && right.at) ||
        clean(left && left.id).localeCompare(clean(right && right.id));
    });
    return chapters.map(function (chapter, index) {
      var at = Math.max(0, number(chapter.at));
      var end = number(chapter.end) > at ? number(chapter.end) :
        Math.min(number(source.duration), at + 36);
      var previousAt = index ? Math.max(0, number(chapters[index - 1].at)) : 0;
      var nextAt = index + 1 < chapters.length ?
        Math.max(at, number(chapters[index + 1].at)) : duration;
      var from = index ? Math.round((previousAt + at) / 2) : 0;
      var to = index + 1 < chapters.length ?
        Math.round((at + nextAt) / 2) : duration;
      var chunk = receipts.filter(function (receipt) {
        var receiptAt = receiptTime(receipt);
        return receiptAt >= from &&
          (index + 1 === chapters.length ? receiptAt <= to : receiptAt < to);
      });
      var topics = chunk.filter(function (receipt) {
        return receiptKind(receipt) === "topic";
      });
      var moments = chunk.filter(function (receipt) {
        return receiptKind(receipt) === "moment";
      });
      var characters = chunk.filter(function (receipt) {
        return receiptKind(receipt) === "character";
      });
      return {
        id: clean(chapter.id) || "act-" + String(index + 1).padStart(2, "0"),
        ordinal: index + 1,
        from: from,
        to: to,
        at: at,
        end: end,
        anchor: clean(chapter.topic) || clean(chapter.label) || "Saved chapter",
        category: clean(chapter.category),
        beat: clean(chapter.category),
        subject: clean(chapter.topic) || clean(chapter.label),
        excerpt: clean(chapter.excerpt),
        sourceBody: clean(chapter.body),
        topicLabels: orderedStrings(topics.map(receiptDisplayLabel)),
        momentLabels: orderedStrings(moments.map(receiptDisplayLabel)),
        characterLabels: orderedStrings(characters.reduce(function (values, receipt) {
          return values.concat(characterLabels(receipt));
        }, [])),
        receiptBreakdown: {
          moments: moments.length,
          topics: topics.length,
          characters: characters.length,
        },
        receiptKeys: chunk.map(function (receipt) {
          return clean(receipt.key);
        }),
        guideCutId: clean(chapter.cutId),
        evidenceBasis: clean(chapter.evidenceBasis) ||
          "full-caption-guide-chapter-with-chronological-receipt-group",
      };
    }).filter(function (section) {
      return section.guideCutId || section.receiptKeys.length;
    }).sort(function (left, right) {
      return left.at - right.at || left.id.localeCompare(right.id);
    });
  }

  function receiptSections(source, receipts) {
    var duration = Math.max(1, number(source.duration));
    var title = clean(source.displayTitle || source.title);
    var count = Math.min(targetSectionCount(duration), receipts.length);
    var selected = [];
    var usedKeys = {};
    var usedLabels = {};
    var reservedTopicCount = Math.min(4, Math.max(1, Math.floor(count / 2)));
    var reservedTopics = receipts.filter(function (receipt) {
      return receiptKind(receipt) === "topic";
    }).sort(function (left, right) {
      var leftLabel = receiptDisplayLabel(left);
      var rightLabel = receiptDisplayLabel(right);
      var leftScore = titleRelevance(leftLabel, title) +
        Math.min(140, Math.max(0, receiptSignal(left))) * 2 +
        Math.max(0, 40 - receiptTime(left) / duration * 40);
      var rightScore = titleRelevance(rightLabel, title) +
        Math.min(140, Math.max(0, receiptSignal(right))) * 2 +
        Math.max(0, 40 - receiptTime(right) / duration * 40);
      return rightScore - leftScore ||
        receiptTime(left) - receiptTime(right) ||
        clean(left.key).localeCompare(clean(right.key));
    }).filter(function (receipt, index, values) {
      var label = receiptDisplayLabel(receipt).toLowerCase();
      return values.findIndex(function (candidate) {
        return receiptDisplayLabel(candidate).toLowerCase() === label;
      }) === index;
    }).slice(0, reservedTopicCount);

    reservedTopics.forEach(function (receipt) {
      selected.push(receipt);
      usedKeys[clean(receipt.key)] = true;
      usedLabels[receiptDisplayLabel(receipt).toLowerCase()] = true;
    });

    function selectionScore(receipt, center, width) {
      var distance = Math.abs(receiptTime(receipt) - center);
      var proximity = Math.max(0, 1 - distance / Math.max(1, width)) * 55;
      var signal = Math.min(140, Math.max(0, receiptSignal(receipt))) * 0.55;
      var kind = receiptKind(receipt);
      var kindBonus = kind === "moment" ? 22 : kind === "character" ? 16 : 7;
      var relevance = kind === "topic" ?
        Math.min(80, titleRelevance(receiptDisplayLabel(receipt), title) / 10) : 0;
      var label = receiptDisplayLabel(receipt).toLowerCase();
      var repetitionPenalty = usedLabels[label] ? 48 : 0;
      return proximity + signal + kindBonus + relevance - repetitionPenalty;
    }

    for (var bucket = 0; bucket < count && selected.length < count; bucket += 1) {
      var start = duration * bucket / count;
      var finish = duration * (bucket + 1) / count;
      var center = (start + finish) / 2;
      var width = Math.max(1, finish - start);
      var candidates = receipts.filter(function (receipt) {
        var at = receiptTime(receipt);
        return !usedKeys[clean(receipt.key)] &&
          at >= start - width * 0.35 &&
          at <= finish + width * 0.35;
      });
      if (!candidates.length) {
        candidates = receipts.filter(function (receipt) {
          return !usedKeys[clean(receipt.key)];
        });
      }
      candidates.sort(function (left, right) {
        return selectionScore(right, center, width) - selectionScore(left, center, width) ||
          Math.abs(receiptTime(left) - center) - Math.abs(receiptTime(right) - center) ||
          clean(left.key).localeCompare(clean(right.key));
      });
      if (!candidates.length) continue;
      var chosen = candidates[0];
      selected.push(chosen);
      usedKeys[clean(chosen.key)] = true;
      usedLabels[receiptDisplayLabel(chosen).toLowerCase()] = true;
    }
    selected.sort(function (left, right) {
      return receiptTime(left) - receiptTime(right) ||
        clean(left.key).localeCompare(clean(right.key));
    });

    var sections = selected.map(function (selectedReceipt, index) {
      var previous = index ? receiptTime(selected[index - 1]) : 0;
      var current = receiptTime(selectedReceipt);
      var next = index + 1 < selected.length ?
        receiptTime(selected[index + 1]) : duration;
      var from = index ? Math.round((previous + current) / 2) : 0;
      var to = index + 1 < selected.length ?
        Math.round((current + next) / 2) : duration;
      var associationRadius = Math.min(
        150,
        Math.max(120, Math.round((to - from) * 0.1))
      );
      var nearby = receipts.filter(function (receipt) {
        return Math.abs(receiptTime(receipt) - current) <= associationRadius;
      });

      function nearestFirst(left, right) {
        return Math.abs(receiptTime(left) - current) -
          Math.abs(receiptTime(right) - current) ||
          receiptSignal(right) - receiptSignal(left) ||
          clean(left.key).localeCompare(clean(right.key));
      }

      function anchoredReceipts(kind, limit) {
        var matching = nearby.filter(function (receipt) {
          return receiptKind(receipt) === kind;
        }).sort(nearestFirst);
        if (receiptKind(selectedReceipt) === kind) {
          matching = [selectedReceipt].concat(matching.filter(function (receipt) {
            return clean(receipt.key) !== clean(selectedReceipt.key);
          }));
        }
        return matching.slice(0, limit);
      }

      var moments = anchoredReceipts("moment", 2);
      var topics = anchoredReceipts("topic", 3);
      var characters = anchoredReceipts("character", 2);
      var spotlight = selectedReceipt;
      var spotlightCharacters = characterLabels(spotlight);
      var nearestTopic = topics[0] || null;
      var subject = receiptKind(spotlight) === "topic" ?
        receiptDisplayLabel(spotlight) :
        receiptKind(spotlight) === "character" ?
          spotlightCharacters[0] || receiptDisplayLabel(spotlight) :
          nearestTopic ? receiptDisplayLabel(nearestTopic) :
            receiptDisplayLabel(spotlight);
      var subjects = orderedStrings(
        [subject].concat(
          topics.map(receiptDisplayLabel),
          characters.reduce(function (values, receipt) {
            return values.concat(characterLabels(receipt));
          }, [])
        )
      );
      var keys = orderedStrings(
        [spotlight].concat(topics, characters, moments).map(function (receipt) {
          return clean(receipt.key);
        })
      ).slice(0, 8);
      return {
        id: "runtime-" + String(index + 1).padStart(2, "0"),
        ordinal: index + 1,
        from: from,
        to: to,
        at: receiptTime(spotlight),
        end: receiptEnd(spotlight, duration),
        anchor: receiptDisplayLabel(spotlight),
        category: receiptKind(spotlight),
        beat: receiptDisplayLabel(spotlight),
        subject: subjects[0] || receiptDisplayLabel(spotlight),
        excerpt: safeExcerpt(spotlight, 18),
        topicLabels: orderedStrings(topics.map(receiptDisplayLabel)),
        momentLabels: orderedStrings(moments.map(receiptDisplayLabel)),
        characterLabels: orderedStrings(characters.reduce(function (values, receipt) {
          return values.concat(characterLabels(receipt));
        }, [])),
        receiptBreakdown: {
          moments: moments.length,
          topics: topics.length,
          characters: characters.length,
        },
        receiptKeys: keys,
        guideCutId: "",
        evidenceBasis: "source-local-receipts-temporally-bound-to-anchor",
      };
    });

    /*
     * Keep the curated act anchors above, then make sure no registered source
     * moment disappears from the playable chronology. Unrepresented receipts
     * join the nearest act with available evidence capacity.
     */
    var represented = {};
    sections.forEach(function (section) {
      section.receiptKeys.forEach(function (key) {
        represented[key] = true;
      });
    });
    receipts.filter(function (receipt) {
      return !represented[clean(receipt.key)];
    }).forEach(function (receipt) {
      var candidates = sections.filter(function (section) {
        return section.receiptKeys.length < 8;
      }).sort(function (left, right) {
        return Math.abs(left.at - receiptTime(receipt)) -
          Math.abs(right.at - receiptTime(receipt)) ||
          left.ordinal - right.ordinal;
      });
      var section = candidates[0];
      if (!section) return;
      var key = clean(receipt.key);
      section.receiptKeys.push(key);
      represented[key] = true;
      var kind = receiptKind(receipt);
      if (kind === "topic") {
        section.topicLabels = orderedStrings(
          section.topicLabels.concat(receiptDisplayLabel(receipt))
        );
        section.receiptBreakdown.topics += 1;
      } else if (kind === "character") {
        section.characterLabels = orderedStrings(
          section.characterLabels.concat(characterLabels(receipt))
        );
        section.receiptBreakdown.characters += 1;
      } else {
        section.momentLabels = orderedStrings(
          section.momentLabels.concat(receiptDisplayLabel(receipt))
        );
        section.receiptBreakdown.moments += 1;
      }
    });

    return sections.sort(function (left, right) {
      return left.at - right.at || left.id.localeCompare(right.id);
    });
  }

  function guideCutTime(item) {
    if (Number.isFinite(Number(item && item.at))) {
      return Math.max(0, number(item.at));
    }
    return Math.max(0, number(item && item.t));
  }

  function guideEvidence(guide, duration) {
    guide = record(guide);
    var chapters = array(guide.chapters);
    var chapterByCutId = {};
    chapters.forEach(function (chapter) {
      var cutId = clean(chapter && chapter.cutId);
      if (cutId) chapterByCutId[cutId] = chapter;
    });
    var seen = {};
    var values = [];

    function add(item, index, fallbackKind) {
      item = record(item);
      var atValue = item.at != null ? item.at : item.t;
      if (!Number.isFinite(Number(atValue))) return;
      var at = guideCutTime(item);
      if (number(duration) && at > number(duration) + 60) return;
      var id = fallbackKind === "chapter" ?
        clean(item.cutId) || clean(item.id) :
        clean(item.id) || clean(item.cutId);
      id = id ||
        "guide-point-" + String(index + 1).padStart(2, "0") + "-" + Math.round(at);
      if (seen[id]) return;
      var chapter = record(chapterByCutId[id]);
      var topic = displayLabel(item.topic || chapter.topic);
      var category = displayLabel(item.category || chapter.category || item.label);
      if (!topic && !category) return;
      seen[id] = true;
      values.push({
        id: id,
        at: at,
        end: Math.min(
          Math.max(at, number(duration)),
          number(item.end) > at ? number(item.end) :
            number(chapter.end) > at ? number(chapter.end) :
              at + 36
        ),
        topic: topic,
        category: category,
        excerpt: safeExcerpt({
          excerpt: clean(item.excerpt || chapter.excerpt),
          publicExcerptAllowed: true,
        }, 18),
        score: number(item.score),
        evidenceBasis: clean(item.evidenceBasis || chapter.evidenceBasis) ||
          "reviewed-episode-guide-timestamp",
        chapterId: clean(chapter.id) ||
          (fallbackKind === "chapter" ? clean(item.id) : ""),
        chapterLabel: clean(chapter.label) ||
          (fallbackKind === "chapter" ? clean(item.label) : ""),
      });
    }

    array(guide.cuts).forEach(function (cut, index) {
      add(cut, index, "cut");
    });
    chapters.forEach(function (chapter, index) {
      add(chapter, array(guide.cuts).length + index, "chapter");
    });
    return values.sort(function (left, right) {
      return left.at - right.at || left.id.localeCompare(right.id);
    });
  }

  function guideThreads(guide) {
    return array(record(guide).threads).map(function (thread) {
      return {
        name: displayLabel(thread && thread.name),
        kind: clean(thread && thread.kind),
        mentions: number(thread && thread.mentions),
        first: number(thread && thread.first),
        peak: number(thread && thread.peak),
        score: number(thread && thread.score),
      };
    }).filter(function (thread) {
      return Boolean(thread.name);
    }).sort(function (left, right) {
      return right.score - left.score ||
        right.mentions - left.mentions ||
        left.name.localeCompare(right.name);
    });
  }

  function narrativeSubject(segment) {
    return displayLabel(
      segment.primarySubject ||
      record(segment.guideAnchor).topic ||
      record(segment.guideAnchor).category ||
      array(segment.topicLabels)[0] ||
      array(segment.characterLabels)[0] ||
      segment.anchor ||
      array(segment.momentLabels)[0] ||
      "Saved checkpoint"
    );
  }

  function attachNarrativeBeats(segments) {
    var subjectPositions = {};
    segments.forEach(function (segment, index) {
      orderedStrings(
        [narrativeSubject(segment)]
          .concat(segment.topicLabels, segment.characterLabels)
      ).forEach(function (subject) {
        var key = subject.toLowerCase();
        if (!subjectPositions[key]) subjectPositions[key] = [];
        subjectPositions[key].push(index);
      });
    });

    return segments.map(function (segment, index) {
      var primarySubject = narrativeSubject(segment);
      var subjects = orderedStrings(
        [primarySubject]
          .concat(segment.topicLabels, segment.characterLabels, segment.momentLabels)
      );
      var recurringSubjects = subjects.filter(function (subject) {
        return array(subjectPositions[subject.toLowerCase()]).length > 1;
      });
      var previousSubject = index ? narrativeSubject(segments[index - 1]) : "";
      var nextSubject = index + 1 < segments.length ?
        narrativeSubject(segments[index + 1]) : "";
      var counts = record(segment.evidenceShape);
      var kind = index === 0 ? "opening-board" :
        index === segments.length - 1 ? "last-reel" :
          recurringSubjects.length ? "returning-thread" :
            number(counts.characters) ? "character-break-in" :
              number(counts.moments) > number(counts.topics) ? "chaos-spike" :
                number(counts.topics) >= 3 ? "topic-sweep" :
                  "hard-left";
      var guideAnchor = record(segment.guideAnchor);
      var anchorSupportsPrimary = segment.anchorSupportsPrimary === true;
      var anchorSubject = displayLabel(segment.anchorSubject) ||
        evidenceSubject(clean(guideAnchor.id) ? guideAnchor : {
          label: segment.anchor,
        });
      segment.narrative = {
        schema: "shokker-recap-narrative-beat/v1",
        kind: kind,
        primarySubject: primarySubject,
        secondarySubjects: subjects.filter(function (subject) {
          return subject.toLowerCase() !== primarySubject.toLowerCase();
        }).slice(0, 5),
        previousSubject: previousSubject,
        nextSubject: nextSubject,
        recurringSubjects: recurringSubjects.slice(0, 4),
        anchorSupportsPrimary: anchorSupportsPrimary,
        anchorSubject: anchorSubject,
        anchorRelation: anchorSupportsPrimary ?
          "direct-subject-anchor" : "separate-saved-spike",
        primaryEvidence: clean(guideAnchor.id) ? {
          kind: "guide-cut",
          key: clean(guideAnchor.id),
          at: number(guideAnchor.at),
          end: number(guideAnchor.end),
          label: anchorSubject,
        } : {
          kind: "receipt",
          key: clean(segment.anchorReceiptKey),
          at: number(segment.anchorAt),
          end: number(segment.anchorEnd),
          label: anchorSubject,
        },
        evidenceShape: {
          receipts: number(counts.receipts),
          guideCuts: number(counts.guideCuts),
          guideChapters: number(counts.guideChapters),
          topics: number(counts.topics),
          moments: number(counts.moments),
          characters: number(counts.characters),
          namedSubjects: subjects.length,
        },
      };
      return segment;
    });
  }

  function storyArc(receipts, duration, guide, source) {
    if (!receipts.length) return [];
    var topicOnly = receipts.every(function (receipt) {
      return receiptKind(receipt) === "topic";
    });
    function storyTime(receipt) {
      var firstAt = topicOnly ? optionalNumber(receipt && receipt.topicFirstAt) : null;
      return firstAt == null ? receiptTime(receipt) : Math.max(0, firstAt);
    }
    if (topicOnly) {
      receipts = receipts.slice().sort(function (left, right) {
        return storyTime(left) - storyTime(right) ||
          receiptTime(left) - receiptTime(right) ||
          clean(left.key).localeCompare(clean(right.key));
      });
    }
    var guidePoints = guideEvidence(guide, duration);
    var guideThreadList = guideThreads(guide);
    var evidenceCount = receipts.length + guidePoints.length;
    var segmentCount = number(duration) >= 10800 && evidenceCount >= 12 ? 6 :
      number(duration) >= 7200 && evidenceCount >= 10 ? 5 :
        evidenceCount >= 16 ? 4 :
      evidenceCount >= 8 ? 3 :
        evidenceCount >= 4 ? 2 : 1;
    var guideChapterCount = array(record(guide).chapters).length;
    if (guideChapterCount) {
      segmentCount = Math.max(segmentCount, Math.min(8, guideChapterCount));
    }
    segmentCount = Math.max(1, Math.min(segmentCount, receipts.length));
    var segments = [];

    for (var segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
      var startIndex = Math.floor(segmentIndex * receipts.length / segmentCount);
      var endIndex = Math.floor((segmentIndex + 1) * receipts.length / segmentCount);
      var chunk = receipts.slice(startIndex, Math.max(startIndex + 1, endIndex));
      if (!chunk.length) continue;
      var previousChunkLast = segmentIndex ?
        receipts[Math.max(0, startIndex - 1)] : null;
      var nextChunkFirst = endIndex < receipts.length ? receipts[endIndex] : null;
      var fromBoundary = previousChunkLast ?
        Math.round((storyTime(previousChunkLast) + storyTime(chunk[0])) / 2) : 0;
      var toBoundary = nextChunkFirst ?
        Math.round((
          storyTime(chunk[chunk.length - 1]) + storyTime(nextChunkFirst)
        ) / 2) : Math.max(1, number(duration));
      var localGuidePoints = guidePoints.filter(function (point) {
        return point.at >= fromBoundary &&
          (segmentIndex + 1 === segmentCount ?
            point.at <= toBoundary :
            point.at < toBoundary);
      });
      var topics = chunk.filter(function (receipt) {
        return receiptKind(receipt) === "topic";
      });
      var moments = chunk.filter(function (receipt) {
        return receiptKind(receipt) === "moment";
      });
      var characters = chunk.filter(function (receipt) {
        return receiptKind(receipt) === "character";
      });
      var excerptReceipt = topReceipts(chunk.filter(function (receipt) {
        return Boolean(safeExcerpt(receipt, 18));
      }), 1)[0] || null;
      var strongestAnchor = excerptReceipt || topReceipts(chunk, 1)[0] || chunk[0];
      var guideAnchor = localGuidePoints.slice().sort(function (left, right) {
        return right.score - left.score ||
          Number(Boolean(right.excerpt)) - Number(Boolean(left.excerpt)) ||
          left.at - right.at ||
          left.id.localeCompare(right.id);
      })[0] || null;
      var topicLabels = orderedStrings(
        localGuidePoints.map(function (point) {
          return point.topic;
        }).concat(topics.map(receiptDisplayLabel))
      );
      var momentLabels = orderedStrings(
        localGuidePoints.map(function (point) {
          return point.category;
        }).concat(moments.map(receiptDisplayLabel))
      );
      var characterLabelList = orderedStrings(
        characters.reduce(function (values, receipt) {
          return values.concat(characterLabels(receipt));
        }, []).concat(localGuidePoints.reduce(function (values, point) {
          var thread = guideThreadList.find(function (candidate) {
            return candidate.name.toLowerCase() === point.topic.toLowerCase() &&
              candidate.kind.toLowerCase() === "character";
          });
          return thread ? values.concat(thread.name) : values;
        }, []))
      );
      var threadLabels = guideThreadList.filter(function (thread) {
        return topicLabels.some(function (topic) {
          return topic.toLowerCase() === thread.name.toLowerCase();
        });
      }).map(function (thread) {
        return thread.name;
      });
      var titlePreferredTopic = topicOnly ? topics.slice().sort(function (left, right) {
        var leftScore = titleRelevance(
          receiptDisplayLabel(left),
          clean(record(source).displayTitle || record(source).title)
        ) + receiptSignal(left);
        var rightScore = titleRelevance(
          receiptDisplayLabel(right),
          clean(record(source).displayTitle || record(source).title)
        ) + receiptSignal(right);
        return rightScore - leftScore ||
          receiptTime(left) - receiptTime(right) ||
          clean(left.key).localeCompare(clean(right.key));
      })[0] : null;
      var primarySubject = displayLabel(
        guideAnchor && (guideAnchor.topic || guideAnchor.category) ||
        titlePreferredTopic && receiptDisplayLabel(titlePreferredTopic) ||
        topicLabels[0] ||
        characterLabelList[0] ||
        receiptDisplayLabel(strongestAnchor) ||
        momentLabels[0] ||
        "Saved checkpoint"
      );
      var directReceiptAnchor = guideAnchor ? null :
        preferredSubjectAnchor(chunk, primarySubject);
      var anchor = directReceiptAnchor || strongestAnchor;
      var primaryEvidence = guideAnchor || anchor;
      var anchorSupportsPrimary = evidenceSupportsSubject(
        primarySubject,
        primaryEvidence
      );
      var anchorSubject = evidenceSubject(primaryEvidence);
      var chunkStart = chunk.reduce(function (earliest, receipt) {
        return Math.min(earliest, storyTime(receipt));
      }, storyTime(chunk[0]));
      var chunkEnd = chunk.reduce(function (latest, receipt) {
        return Math.max(latest, receiptEnd(receipt, duration));
      }, receiptEnd(chunk[0], duration));
      var at = Math.min(
        chunkStart,
        localGuidePoints.length ? localGuidePoints[0].at : chunkStart
      );
      var end = Math.max(
        chunkEnd,
        localGuidePoints.length ?
          localGuidePoints.reduce(function (latest, point) {
            return Math.max(latest, point.end);
          }, 0) :
          chunkEnd
      );
      var evidenceTrail = localGuidePoints.filter(function (point) {
        return Boolean(clean(point.excerpt));
      }).map(function (point) {
        return {
          guideCutId: clean(point.id),
          receiptKey: "",
          at: number(point.at),
          end: number(point.end),
          label: displayLabel(point.topic || point.category),
          excerpt: clean(point.excerpt),
          signalScore: number(point.score),
          evidenceBasis: clean(point.evidenceBasis) ||
            "reviewed-episode-guide-timestamp",
        };
      }).concat(chunk.filter(function (receipt) {
        return Boolean(safeExcerpt(receipt, 18));
      }).map(function (receipt) {
        return feature(receipt, duration);
      }).filter(Boolean)).sort(function (left, right) {
        return number(right.signalScore) - number(left.signalScore) ||
          number(left.at) - number(right.at) ||
          clean(left.receiptKey || left.guideCutId)
            .localeCompare(clean(right.receiptKey || right.guideCutId));
      }).filter(function (item, index, values) {
        var signature = [
          Math.round(number(item.at)),
          normalizedEvidenceText([item.excerpt]),
        ].join("|");
        return values.findIndex(function (candidate) {
          return [
            Math.round(number(candidate.at)),
            normalizedEvidenceText([candidate.excerpt]),
          ].join("|") === signature;
        }) === index;
      }).slice(0, 3).sort(function (left, right) {
        return number(left.at) - number(right.at);
      });
      segments.push({
        id: "reel-" + String(segmentIndex + 1).padStart(2, "0"),
        ordinal: segmentIndex + 1,
        at: at,
        end: Math.min(Math.max(at, number(duration)), end),
        anchorReceiptKey: clean(anchor.key),
        anchorAt: receiptTime(anchor),
        anchorEnd: receiptEnd(anchor, duration),
        anchor: receiptDisplayLabel(anchor),
        excerpt: safeExcerpt(anchor, 18),
        primarySubject: primarySubject,
        anchorSupportsPrimary: anchorSupportsPrimary,
        anchorSubject: anchorSubject,
        topicLabels: topicLabels,
        topicEvidence: topics.map(function (receipt) {
          var mentions = optionalNumber(receipt.topicMentions);
          var firstAt = optionalNumber(receipt.topicFirstAt);
          var peakAt = optionalNumber(receipt.topicPeakAt);
          return {
            receiptKey: clean(receipt.key),
            label: receiptDisplayLabel(receipt),
            at: receiptTime(receipt),
            end: receiptEnd(receipt, duration),
            mentions: mentions == null ? 0 : Math.max(0, Math.round(mentions)),
            firstAt: firstAt == null ? receiptTime(receipt) : Math.max(0, firstAt),
            peakAt: peakAt == null ? receiptTime(receipt) : Math.max(0, peakAt),
            metricBasis: clean(receipt.topicMetricBasis),
          };
        }).sort(function (left, right) {
          return right.mentions - left.mentions ||
            left.firstAt - right.firstAt ||
            left.label.localeCompare(right.label);
        }),
        momentLabels: momentLabels,
        momentEvidence: topReceipts(moments, 2).map(function (receipt) {
          return feature(receipt, duration);
        }).filter(Boolean),
        evidenceTrail: evidenceTrail,
        characterLabels: characterLabelList,
        threadLabels: orderedStrings(threadLabels),
        receiptKeys: chunk.map(function (receipt) {
          return clean(receipt.key);
        }),
        guideCutIds: localGuidePoints.map(function (point) {
          return point.id;
        }),
        guideChapterIds: orderedStrings(localGuidePoints.map(function (point) {
          return point.chapterId;
        })),
        guideAnchor: guideAnchor ? {
          id: guideAnchor.id,
          at: guideAnchor.at,
          end: guideAnchor.end,
          topic: guideAnchor.topic,
          category: guideAnchor.category,
          excerpt: guideAnchor.excerpt,
          chapterId: guideAnchor.chapterId,
          evidenceBasis: guideAnchor.evidenceBasis,
        } : null,
        evidenceShape: {
          receipts: chunk.length,
          guideCuts: localGuidePoints.length,
          guideChapters: orderedStrings(localGuidePoints.map(function (point) {
            return point.chapterId;
          })).length,
          topics: topicLabels.length,
          moments: momentLabels.length,
          characters: characterLabelList.length,
        },
        evidenceBasis: localGuidePoints.length ?
          "source-local-receipts-plus-reviewed-guide-points-grouped-chronologically" :
          "all-source-local-receipts-grouped-chronologically",
      });
    }
    return attachNarrativeBeats(segments);
  }

  function feature(receipt, duration) {
    if (!receipt) return null;
    return {
      receiptKey: clean(receipt.key),
      at: receiptTime(receipt),
      end: receiptEnd(receipt, duration),
      label: receiptDisplayLabel(receipt),
      excerpt: safeExcerpt(receipt, 20),
      signalScore: receiptSignal(receipt),
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

  function laneFeature(receipts, context, laneId, duration) {
    var lane = array(record(context).lanes).find(function (candidate) {
      return clean(candidate && candidate.id) === laneId;
    });
    if (!lane) return null;
    var receiptByKey = {};
    receipts.forEach(function (receipt) {
      receiptByKey[clean(receipt.key)] = receipt;
    });
    var selected = array(lane.receiptKeys).map(function (key) {
      return receiptByKey[clean(key)] || null;
    }).filter(Boolean)[0];
    return feature(selected, duration);
  }

  function derivedFanRead(receipts, guide, duration, context) {
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
      hated: guideFeature(guide, "hated") ||
        laneFeature(receipts, context, "straight-to-steves-asshole", duration) ||
        feature(hated, duration),
      wildestDetour: guideFeature(guide, "wildestDetour") ||
        laneFeature(receipts, context, "up-in-ya", duration) ||
        feature(wildest, duration),
      lastWord: guideFeature(guide, "lastWord") || feature(last, duration),
    };
  }

  function caseFile(
    receipts,
    sections,
    story,
    duration,
    context,
    guide,
    topology,
    runway
  ) {
    var topics = receipts.filter(function (receipt) {
      return receiptKind(receipt) === "topic";
    });
    var characters = receipts.filter(function (receipt) {
      return receiptKind(receipt) === "character";
    });
    var moments = receipts.filter(function (receipt) {
      return receiptKind(receipt) === "moment";
    });
    var first = receipts.length ? receiptTime(receipts[0]) : 0;
    var last = receipts.length ? receipts.reduce(function (latest, receipt) {
      return Math.max(latest, receiptEnd(receipt, duration));
    }, first) : 0;
    var span = duration && receipts.length ?
      Math.max(1, Math.min(100, Math.round((last - first) / duration * 100))) : 0;
    var sectionAnchors = array(sections).map(function (section) {
      return Math.max(0, number(section && section.at));
    }).filter(function (at) {
      return Number.isFinite(at);
    }).sort(function (left, right) {
      return left - right;
    });
    var firstAnchorAt = sectionAnchors.length ? sectionAnchors[0] : first;
    var lastAnchorAt = sectionAnchors.length ?
      sectionAnchors[sectionAnchors.length - 1] : first;
    var firstAnchorPercent = duration ?
      Math.max(0, Math.min(100, Math.round(firstAnchorAt / duration * 100))) : 0;
    var lastAnchorPercent = duration ?
      Math.max(0, Math.min(100, Math.round(lastAnchorAt / duration * 100))) : 0;
    var openingPhaseCovered = sectionAnchors.some(function (at) {
      return duration && at / duration <= 0.15;
    });
    var middlePhaseCovered = sectionAnchors.some(function (at) {
      var progress = duration ? at / duration : 0;
      return progress >= 0.35 && progress <= 0.65;
    });
    var closingPhaseCovered = sectionAnchors.some(function (at) {
      return duration && at / duration >= 0.85;
    });
    var laneCounts = {};
    array(record(context).lanes).forEach(function (lane) {
      var id = clean(lane && lane.id);
      if (id) laneCounts[id] = array(lane && lane.receiptKeys).length;
    });
    var storyReceiptKeys = orderedStrings(array(story).reduce(function (keys, segment) {
      return keys.concat(array(segment && segment.receiptKeys));
    }, []));
    var storyCoveragePercent = receipts.length ?
      Math.round(storyReceiptKeys.length / receipts.length * 100) : 0;
    var expectedGuidePointIds = orderedStrings(
      guideEvidence(guide, duration).map(function (point) {
        return point.id;
      })
    );
    var storyGuidePointIds = orderedStrings(array(story).reduce(function (keys, segment) {
      return keys.concat(array(segment && segment.guideCutIds));
    }, []));
    var storyGuideChapterIds = orderedStrings(array(story).reduce(function (keys, segment) {
      return keys.concat(array(segment && segment.guideChapterIds));
    }, []));
    var storyThreadLabels = orderedStrings(array(story).reduce(function (labels, segment) {
      return labels.concat(array(segment && segment.threadLabels));
    }, []));
    return {
      receiptCount: receipts.length,
      topicCount: topics.length,
      topicMetricCount: array(topology).filter(function (topic) {
        return clean(topic.metricBasis) &&
          (number(topic.mentions) || number(topic.firstAt) || number(topic.peakAt));
      }).length,
      topicMentionTotal: array(topology).reduce(function (total, topic) {
        return total + number(topic.mentions);
      }, 0),
      highlightCount: array(runway).length,
      highlightCategoryCount: orderedStrings(array(runway).map(function (item) {
        return clean(item.category);
      })).length,
      momentCount: moments.length,
      characterCount: characters.length,
      actCount: sections.length,
      guideCutCount: array(record(guide).cuts).length,
      threadCount: array(record(guide).threads).length,
      storySegmentCount: array(story).length,
      storyReceiptCount: storyReceiptKeys.length,
      storyCoveragePercent: storyCoveragePercent,
      storyNarrativeBeatCount: array(story).filter(function (segment) {
        return clean(record(segment).narrative && record(segment).narrative.schema) ===
          "shokker-recap-narrative-beat/v1";
      }).length,
      storyNamedSegmentCount: array(story).filter(function (segment) {
        return Boolean(narrativeSubject(record(segment)));
      }).length,
      storyGuidePointCount: storyGuidePointIds.length,
      storyGuidePointExpected: expectedGuidePointIds.length,
      storyGuidePointCoveragePercent: expectedGuidePointIds.length ?
        Math.round(storyGuidePointIds.length / expectedGuidePointIds.length * 100) :
        100,
      storyGuideChapterCount: storyGuideChapterIds.length,
      storyGuideThreadCount: storyThreadLabels.length,
      tapeSpanPercent: span,
      firstAt: first,
      lastAt: last,
      firstPlayableAnchorAt: firstAnchorAt,
      lastPlayableAnchorAt: lastAnchorAt,
      firstPlayableAnchorPercent: firstAnchorPercent,
      lastPlayableAnchorPercent: lastAnchorPercent,
      runtimePhaseCount: Number(openingPhaseCovered) +
        Number(middlePhaseCovered) + Number(closingPhaseCovered),
      openingPhaseCovered: openingPhaseCovered,
      middlePhaseCovered: middlePhaseCovered,
      closingPhaseCovered: closingPhaseCovered,
      runtimeCoverageLevel: openingPhaseCovered && middlePhaseCovered && closingPhaseCovered
        ? "opening-middle-closing"
        : closingPhaseCovered
          ? "closing-represented"
          : "indexed-highlights",
      laneCounts: laneCounts,
    };
  }

  function held(source, format) {
    var hold = record(source.exactSourceHold);
    var alternate = record(source.officialAlternate);
    var heldEvidence = {
      sourceId: clean(source.id),
      title: clean(source.title),
      date: clean(source.date),
      duration: number(source.duration),
      views: number(source.views),
      formatId: clean(format.id),
      coverage: clean(source.coverage),
      hold: {
        state: clean(hold.state),
        reason: clean(hold.reason),
      },
      alternate: {
        kind: clean(alternate.kind),
        title: clean(alternate.title),
        episodeUrl: clean(alternate.episodeUrl),
        enclosureUrl: clean(alternate.enclosureUrl),
        duration: number(alternate.duration),
        canonicalDuration: number(alternate.canonicalDuration),
        durationDelta: number(alternate.durationDelta),
        timestampIsomorphic: alternate.timestampIsomorphic === false
          ? false
          : null,
        publicPlaybackAllowed: alternate.publicPlaybackAllowed === true,
        evidenceBoundary: clean(alternate.evidenceBoundary),
      },
      evidenceState: "held",
      version: VERSION,
    };
    var fingerprint = hash(JSON.stringify(heldEvidence));
    return {
      schema: SCHEMA,
      generatorVersion: VERSION,
      sourceId: clean(source.id),
      sourceFingerprint: "fnv1a32:" + fingerprint,
      evidenceFingerprint: "fnv1a32:" + fingerprint,
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
      highlightRunway: [],
      sections: [],
      story: [],
      bestMoments: [],
      fanRead: {},
      guideRecap: null,
      caseFile: {
        receiptCount: 0,
        topicCount: 0,
        topicMetricCount: 0,
        topicMentionTotal: 0,
        highlightCount: 0,
        highlightCategoryCount: 0,
        momentCount: 0,
        characterCount: 0,
        actCount: 0,
        guideCutCount: 0,
        threadCount: 0,
        storySegmentCount: 0,
        storyReceiptCount: 0,
        storyCoveragePercent: 0,
        storyNarrativeBeatCount: 0,
        storyNamedSegmentCount: 0,
        storyGuidePointCount: 0,
        storyGuidePointExpected: 0,
        storyGuidePointCoveragePercent: 100,
        storyGuideChapterCount: 0,
        storyGuideThreadCount: 0,
        tapeSpanPercent: 0,
        firstAt: 0,
        lastAt: 0,
        laneCounts: {},
      },
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
    var context = record(input.context);
    var registeredOverview = clean(context.registeredOverview);
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
    var story = storyArc(receipts, source.duration, guide, source);
    var moments = bestMomentReceipts(receipts.filter(function (receipt) {
      return receiptKind(receipt) === "moment";
    }), source.duration, 5);
    var topics = topicLabels(receipts, guide, source, context);
    var topology = topicTopology(receipts, source.duration, guide);
    var runway = highlightRunway(
      receipts,
      source.duration,
      guide,
      context
    );
    var mode = guideReady ? "full-chronicle" :
      moments.length ? "receipt-recap" : "topic-recap";
    var guideRecap = guideReady ? {
      overview: clean(guide.overview),
      evidenceSummary: clean(guide.evidenceSummary),
      recap: record(guide.recap),
      lanes: record(guide.lanes),
      takeArc: array(guide.takeArc),
      reviewChecklist: array(guide.reviewChecklist).map(clean).filter(Boolean),
      variant: clean(guide.variant),
      format: clean(guide.format),
    } : null;
    var evidenceFingerprint = hash(JSON.stringify({
      sourceId: sourceId,
      receipts: receipts.map(function (receipt) {
        return [
          clean(receipt.key),
          receiptKind(receipt),
          receiptTime(receipt),
          receiptEnd(receipt, source.duration),
          clean(receipt.label),
          safeExcerpt(receipt, 18),
          clean(receipt.evidenceType),
          receipt.publicExcerptAllowed !== false,
          optionalNumber(receipt.topicMentions),
          optionalNumber(receipt.topicFirstAt),
          optionalNumber(receipt.topicPeakAt),
          optionalNumber(receipt.topicCluster),
        ];
      }),
      guideCuts: guideReady ? array(guide.cuts).map(function (cut) {
        return [
          clean(cut.id),
          guideCutTime(cut),
          number(cut.end),
          clean(cut.topic),
          clean(cut.category),
          clean(cut.excerpt),
        ];
      }) : [],
      version: VERSION,
    }));
    var semanticFingerprint = hash(JSON.stringify({
      sourceId: sourceId,
      mode: mode,
      format: clean(format.id),
      topics: topics,
      topicTopology: topology,
      highlightRunway: runway,
      sections: sections.map(function (section) {
        return [
          section.id, section.at, section.end, section.anchor, section.category,
          section.receiptKeys, section.guideCutId
        ];
      }),
      story: story.map(function (segment) {
        return [
          segment.id, segment.at, segment.end, segment.anchorReceiptKey,
          segment.anchorAt, segment.anchor,
          segment.receiptKeys, segment.guideCutIds, segment.guideChapterIds,
          segment.threadLabels, segment.topicEvidence, segment.momentEvidence,
          segment.evidenceTrail, segment.narrative
        ];
      }),
      guideRecap: guideRecap,
      registeredOverview: registeredOverview,
      version: VERSION,
    }));
    return {
      schema: SCHEMA,
      generatorVersion: VERSION,
      sourceId: sourceId,
      sourceFingerprint: "fnv1a32:" + hash([
        sourceId, source.title, source.date, source.duration, source.views,
        source.wordsAudited, evidenceFingerprint
      ].join("|")),
      evidenceFingerprint: "fnv1a32:" + evidenceFingerprint,
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
      topicMap: topology,
      highlightRunway: runway,
      sections: sections,
      story: story,
      bestMoments: moments.map(function (receipt) {
        return feature(receipt, source.duration);
      }).filter(Boolean),
      fanRead: derivedFanRead(receipts, guide, source.duration, context),
      caseFile: caseFile(
        receipts,
        sections,
        story,
        source.duration,
        context,
        guide,
        topology,
        runway
      ),
      guideRecap: guideRecap,
      registeredOverview: registeredOverview,
      guideOverview: guideReady ? clean(guide.overview) : "",
      guideWhyItMatters: guideReady ?
        clean(record(record(guide.fanRead).whyThisNightMatters).body) : "",
      limitations: [
        "Transcript timing does not establish the speaker.",
        "Chronological grouping does not establish causality.",
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
