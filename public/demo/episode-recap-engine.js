(function (root) {
  "use strict";

  var SCHEMA = "shokker-episode-recap/v1";
  var VERSION = "1.4.0";

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
    if (duration < 7200) return 7;
    return 8;
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

  function storyArc(receipts, duration) {
    if (!receipts.length) return [];
    var segmentCount = receipts.length >= 16 ? 4 :
      receipts.length >= 8 ? 3 :
        receipts.length >= 4 ? 2 : 1;
    var segments = [];

    for (var segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
      var startIndex = Math.floor(segmentIndex * receipts.length / segmentCount);
      var endIndex = Math.floor((segmentIndex + 1) * receipts.length / segmentCount);
      var chunk = receipts.slice(startIndex, Math.max(startIndex + 1, endIndex));
      if (!chunk.length) continue;
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
      var anchor = excerptReceipt || topReceipts(chunk, 1)[0] || chunk[0];
      var first = chunk[0];
      var last = chunk[chunk.length - 1];
      segments.push({
        id: "reel-" + String(segmentIndex + 1).padStart(2, "0"),
        ordinal: segmentIndex + 1,
        at: receiptTime(first),
        end: receiptEnd(last, duration),
        anchorReceiptKey: clean(anchor.key),
        anchorAt: receiptTime(anchor),
        anchor: receiptDisplayLabel(anchor),
        excerpt: safeExcerpt(anchor, 18),
        topicLabels: orderedStrings(topics.map(receiptDisplayLabel)),
        momentLabels: orderedStrings(moments.map(receiptDisplayLabel)),
        characterLabels: orderedStrings(characters.reduce(function (values, receipt) {
          return values.concat(characterLabels(receipt));
        }, [])),
        receiptKeys: chunk.map(function (receipt) {
          return clean(receipt.key);
        }),
        evidenceBasis: "all-source-local-receipts-grouped-chronologically",
      });
    }
    return segments;
  }

  function feature(receipt, duration) {
    if (!receipt) return null;
    return {
      receiptKey: clean(receipt.key),
      at: receiptTime(receipt),
      end: receiptEnd(receipt, duration),
      label: receiptDisplayLabel(receipt),
      excerpt: safeExcerpt(receipt, 20),
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

  function caseFile(receipts, sections, story, duration, context, guide) {
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
    return {
      receiptCount: receipts.length,
      topicCount: topics.length,
      momentCount: moments.length,
      characterCount: characters.length,
      actCount: sections.length,
      guideCutCount: array(record(guide).cuts).length,
      threadCount: array(record(guide).threads).length,
      storySegmentCount: array(story).length,
      storyReceiptCount: storyReceiptKeys.length,
      storyCoveragePercent: storyCoveragePercent,
      tapeSpanPercent: span,
      firstAt: first,
      lastAt: last,
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
      sections: [],
      story: [],
      bestMoments: [],
      fanRead: {},
      guideRecap: null,
      caseFile: {
        receiptCount: 0,
        topicCount: 0,
        momentCount: 0,
        characterCount: 0,
        actCount: 0,
        guideCutCount: 0,
        threadCount: 0,
        storySegmentCount: 0,
        storyReceiptCount: 0,
        storyCoveragePercent: 0,
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
    var story = storyArc(receipts, source.duration);
    var moments = topReceipts(receipts.filter(function (receipt) {
      return receiptKind(receipt) === "moment";
    }), 8);
    var topics = topicLabels(receipts, guide, source, context);
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
        ];
      }),
      guideCuts: guideReady ? array(guide.cuts).map(function (cut) {
        return [
          clean(cut.id),
          number(cut.at),
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
          segment.receiptKeys
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
        guide
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
