(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SESSION_LENGTHS = [5, 10];
  var DIFFICULTIES = ["easy", "medium", "hard", "mixed"];
  var QUESTION_TYPES = ["source", "movie", "franchise", "category", "earlier-later"];
  var ELIGIBLE_LORE_KINDS = new Set([
    "comedy-moment",
    "topic-receipt",
    "character-performance"
  ]);
  var TYPE_LABELS = {
    source: "WHAT TAPE DID THIS ESCAPE FROM?",
    movie: "WHICH MOVIE WAS ON THE SLAB?",
    franchise: "WHICH FRANCHISE CRIME SCENE?",
    category: "WHAT DID THE ARCHIVE CHARGE THIS WITH?",
    "earlier-later": "WHICH RECEIPT ESCAPED FIRST?"
  };
  var DIFFICULTY_POINTS = {
    easy: 100,
    medium: 175,
    hard: 250
  };
  var CLUE_WORD_LIMITS = {
    easy: 22,
    medium: 16,
    hard: 11
  };
  var EVIDENCE_NOTICE =
    "Every answer comes from an indexed timestamp. Auto-caption wording should be checked against the original upload before publication.";
  var SPEAKER_NOTICE =
    "The game never asks who said a line because the indexed captions are not speaker-diarized.";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback || 0;
  }

  function clean(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalized(value) {
    return clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function slug(value) {
    return normalized(value).replace(/\s+/g, "-") || "unknown";
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, number(value, min)));
  }

  function fingerprint(value) {
    var source = String(value == null ? "" : value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function seededRandom(seed) {
    var state = parseInt(fingerprint(seed), 16) >>> 0;
    return function () {
      state += 0x6d2b79f5;
      var next = state;
      next = Math.imul(next ^ (next >>> 15), next | 1);
      next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
      return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(values, random) {
    var copy = array(values).slice();
    for (var index = copy.length - 1; index > 0; index -= 1) {
      var swap = Math.floor(random() * (index + 1));
      var held = copy[index];
      copy[index] = copy[swap];
      copy[swap] = held;
    }
    return copy;
  }

  function boundedExcerpt(value, limit) {
    var words = clean(value).split(/\s+/).filter(Boolean);
    if (words.length <= limit) {
      return {
        text: words.join(" "),
        words: words.length,
        truncated: false
      };
    }
    return {
      text: words.slice(0, limit).join(" ") + "…",
      words: limit,
      truncated: true
    };
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.round(number(seconds, 0)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = total % 60;
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0")
      : minutes + ":" + String(secs).padStart(2, "0");
  }

  function youtubeUrl(sourceId, seconds) {
    return (
      "https://www.youtube.com/watch?v=" +
      encodeURIComponent(sourceId) +
      "&t=" +
      Math.max(0, Math.round(number(seconds, 0))) +
      "s"
    );
  }

  function dayNumber(value) {
    var matched = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!matched) return null;
    return Math.floor(
      Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3])) / 86400000
    );
  }

  function serialCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function parseInput(input) {
    var options = input || {};
    if (options.metrics && options.receipts && !options.showcase && !options.lore) {
      return { showcase: options, lore: null };
    }
    return {
      showcase: options.showcase || null,
      lore: options.lore || null
    };
  }

  function sourceFromLoreEntry(entry) {
    var details = entry.details || {};
    var lanes = array(details.lanes);
    var commentary = lanes.indexOf("commentary") >= 0 || Boolean(details.film);
    return {
      id: details.sourceId || String(entry.id || "").replace(/^source:/, ""),
      type: commentary ? "commentary" : "livestream",
      lane: lanes[0] || (commentary ? "commentary" : "livestream"),
      title: entry.name,
      date: details.date || (entry.archiveFirst && entry.archiveFirst.date) || "",
      url: details.url || "",
      film: details.film || "",
      franchise: details.franchise || "",
      order: number(details.order, 0),
      captioned: details.transcript !== false
    };
  }

  function normalizeSource(source) {
    var raw = source || {};
    var commentary =
      raw.type === "commentary" ||
      raw.lane === "commentary" ||
      array(raw.lanes).indexOf("commentary") >= 0 ||
      Boolean(raw.film);
    return {
      id: clean(raw.id || raw.sourceId),
      type: commentary ? "commentary" : "livestream",
      lane: clean(raw.lane || (commentary ? "commentary" : "livestream")),
      title: clean(raw.title || raw.name || raw.film || raw.id),
      date: clean(raw.date),
      url: clean(raw.url),
      film: clean(raw.film),
      franchise: clean(raw.franchise),
      order: number(raw.order, 0),
      captioned: raw.captioned !== false
    };
  }

  function receiptKind(raw) {
    if (raw.kind) return raw.kind;
    if (raw.type === "moment") return "comedy-moment";
    if (raw.type === "topic-chapter") return "topic-receipt";
    if (raw.type === "character-performance") return "character-performance";
    return raw.type || "unknown";
  }

  function categoryForReceipt(raw, kind) {
    if (kind === "comedy-moment") return clean(raw.category || raw.label);
    if (kind === "topic-receipt") return "TOPIC RECEIPT";
    if (kind === "character-performance") return "CHARACTER PERFORMANCE";
    return clean(raw.category || raw.label || "SOURCE RECEIPT");
  }

  function normalizeReceipt(raw, source) {
    var kind = receiptKind(raw);
    var at = number(raw.t != null ? raw.t : raw.at, 0);
    var excerpt = clean(raw.quote || raw.excerpt);
    var sourceId = clean(raw.sourceId || raw.id);
    return {
      receiptId: clean(raw.receiptId || raw.id || sourceId + "-" + Math.round(at * 100)),
      kind: kind,
      sourceId: sourceId,
      sourceType: source ? source.type : clean(raw.sourceType || raw.source || "livestream"),
      sourceTitle: clean(raw.sourceTitle || (source && source.title) || sourceId),
      date: clean(raw.date || (source && source.date)),
      t: at,
      url: clean(raw.url) || youtubeUrl(sourceId, at),
      category: categoryForReceipt(raw, kind),
      excerpt: excerpt,
      confidence: clamp(raw.confidence == null ? 1 : raw.confidence, 0, 1),
      provenance: raw.provenance || {
        basis: "Derived from the indexed WWAM archive data.",
        timestampStatus: "indexed-timestamp"
      }
    };
  }

  function hasUsefulExcerpt(receipt) {
    var tokens = clean(receipt.excerpt).match(/[A-Za-z0-9]+/g) || [];
    return tokens.length >= 4 && Boolean(receipt.sourceId) && receipt.t >= 0;
  }

  function sameFilter(value, requested) {
    if (!requested || normalized(requested) === "any") return true;
    return normalized(value) === normalized(requested) || slug(value) === slug(requested);
  }

  function choice(id, label, detail) {
    return {
      id: id,
      label: clean(label),
      detail: clean(detail)
    };
  }

  function uniqueChoices(values) {
    var labels = new Set();
    return array(values).filter(function (item) {
      var key = normalized(item.label);
      if (!key || labels.has(key)) return false;
      labels.add(key);
      return true;
    });
  }

  function pickCandidate(values, random, usedReceiptIds) {
    var available = array(values).filter(function (receipt) {
      return !usedReceiptIds.has(receipt.receiptId);
    });
    var pool = available.length ? available : array(values);
    if (!pool.length) return null;
    return pool[Math.floor(random() * pool.length)];
  }

  function sourceChoiceLabel(source, mode) {
    if (mode === "movie") return source.film || source.title;
    return source.title;
  }

  function rankDistractorSources(answer, sources, mode, difficulty) {
    return array(sources)
      .filter(function (source) {
        return source.id !== answer.id && Boolean(sourceChoiceLabel(source, mode));
      })
      .map(function (source) {
        var closeness = 0;
        if (source.type === answer.type) closeness += 5;
        if (answer.franchise && source.franchise === answer.franchise) closeness += 12;
        if (answer.date && source.date && answer.date.slice(0, 4) === source.date.slice(0, 4)) {
          closeness += 3;
        }
        if (mode === "movie" && source.film) closeness += 2;
        if (difficulty === "easy") closeness *= -1;
        if (difficulty === "medium") closeness = Math.abs(closeness - 5) * -1;
        return { source: source, score: closeness };
      })
      .sort(function (a, b) {
        return b.score - a.score || a.source.id.localeCompare(b.source.id);
      })
      .map(function (entry) {
        return entry.source;
      });
  }

  function revealReceipt(receipt, source) {
    var words = String(receipt.excerpt || "").trim().split(/\s+/).filter(Boolean);
    var excerpt = words.length > 16 ? words.slice(0, 16).join(" ") + " …" : words.join(" ");
    var bag = {
      receiptId: receipt.receiptId,
      source: source.type,
      id: source.id,
      sourceId: source.id,
      at: receipt.t,
      t: receipt.t,
      title: source.title,
      category: receipt.category,
      excerpt: excerpt,
      excerptWordLimit: 16,
      evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
      evidenceType: "caption-excerpt",
      date: receipt.date || source.date,
      url: receipt.url || youtubeUrl(source.id, receipt.t),
      timecode: formatTime(receipt.t)
    };
    return bag;
  }

  function answerGrade(correct, total) {
    var rate = total ? correct / total : 0;
    if (rate === 1) return "FINAL TAPE SURVIVOR";
    if (rate >= 0.8) return "VIDEO STORE ORACLE";
    if (rate >= 0.6) return "BACK-ROOM REGULAR";
    if (rate >= 0.4) return "RENTAL CARD SUSPENDED";
    return "THE TAPE ATE YOU";
  }

  function create(input) {
    var parsed = parseInput(input);
    var showcase = parsed.showcase || {};
    var lore = parsed.lore || {};
    var sourceMap = new Map();

    array(showcase.sources).forEach(function (raw) {
      var source = normalizeSource(raw);
      if (source.id) sourceMap.set(source.id, source);
    });
    array(lore.fieldGuide)
      .filter(function (entry) {
        return entry && entry.kind === "source";
      })
      .forEach(function (entry) {
        var source = normalizeSource(sourceFromLoreEntry(entry));
        if (source.id && !sourceMap.has(source.id)) sourceMap.set(source.id, source);
      });

    var rawReceipts = array(lore.receipts).length ? lore.receipts : array(showcase.receipts);
    var receipts = rawReceipts
      .filter(function (raw) {
        return ELIGIBLE_LORE_KINDS.has(receiptKind(raw));
      })
      .map(function (raw) {
        var sourceId = clean(raw.sourceId || raw.id);
        return normalizeReceipt(raw, sourceMap.get(sourceId));
      })
      .filter(function (receipt) {
        return sourceMap.has(receipt.sourceId) && hasUsefulExcerpt(receipt);
      });

    var receiptIds = new Set();
    receipts = receipts.filter(function (receipt) {
      if (receiptIds.has(receipt.receiptId)) return false;
      receiptIds.add(receipt.receiptId);
      return true;
    });

    var sources = Array.from(sourceMap.values()).filter(function (source) {
      return receipts.some(function (receipt) {
        return receipt.sourceId === source.id;
      });
    });
    var eligibleSourceIds = new Set(
      sources.map(function (source) {
        return source.id;
      })
    );
    var categories = unique(
      receipts
        .filter(function (receipt) {
          return receipt.kind === "comedy-moment";
        })
        .map(function (receipt) {
          return receipt.category;
        })
    ).sort();
    var franchises = unique(
      sources.map(function (source) {
        return source.franchise;
      })
    ).sort();
    var sourceReceiptMap = new Map();
    receipts.forEach(function (receipt) {
      if (!sourceReceiptMap.has(receipt.sourceId)) sourceReceiptMap.set(receipt.sourceId, []);
      sourceReceiptMap.get(receipt.sourceId).push(receipt);
    });
    sourceReceiptMap.forEach(function (items) {
      items.sort(function (a, b) {
        return a.t - b.t || a.receiptId.localeCompare(b.receiptId);
      });
    });

    function scopedReceipts(options) {
      var request = options || {};
      return receipts.filter(function (receipt) {
        var source = sourceMap.get(receipt.sourceId);
        if (!source) return false;
        if (!sameFilter(source.franchise, request.franchise)) return false;
        if (
          request.category &&
          normalized(request.category) !== "any" &&
          !sameFilter(receipt.category, request.category)
        ) {
          return false;
        }
        return true;
      });
    }

    function availableTypes(options) {
      var scoped = scopedReceipts(options);
      var scopedSourceIds = new Set(
        scoped.map(function (receipt) {
          return receipt.sourceId;
        })
      );
      var scopedSources = sources.filter(function (source) {
        return scopedSourceIds.has(source.id);
      });
      var possible = [];
      if (scoped.length && sources.length >= 3) possible.push("source");
      if (
        scoped.some(function (receipt) {
          var source = sourceMap.get(receipt.sourceId);
          return source && source.type === "commentary" && source.film;
        }) &&
        sources.filter(function (source) {
          return source.type === "commentary" && source.film;
        }).length >= 3
      ) {
        possible.push("movie");
      }
      if (
        scoped.some(function (receipt) {
          var source = sourceMap.get(receipt.sourceId);
          return source && source.franchise;
        }) &&
        franchises.length >= 3
      ) {
        possible.push("franchise");
      }
      if (
        scoped.some(function (receipt) {
          return receipt.kind === "comedy-moment" && receipt.category;
        }) &&
        categories.length >= 3
      ) {
        possible.push("category");
      }
      var hasTapePair = scopedSources.some(function (source) {
        return (
          array(sourceReceiptMap.get(source.id)).filter(function (receipt) {
            return scoped.indexOf(receipt) >= 0;
          }).length >= 2
        );
      });
      var datedSources = scopedSources.filter(function (source) {
        return dayNumber(source.date) != null;
      });
      if (hasTapePair || datedSources.length >= 2) possible.push("earlier-later");
      return possible;
    }

    function buildStandardRound(type, difficulty, scoped, random, usedReceiptIds, roundIndex) {
      var candidates = scoped.filter(function (receipt) {
        var source = sourceMap.get(receipt.sourceId);
        if (!source) return false;
        if (type === "movie") return source.type === "commentary" && Boolean(source.film);
        if (type === "franchise") return Boolean(source.franchise);
        if (type === "category") return receipt.kind === "comedy-moment" && Boolean(receipt.category);
        return true;
      });
      var receipt = pickCandidate(candidates, random, usedReceiptIds);
      if (!receipt) return null;
      var source = sourceMap.get(receipt.sourceId);
      var answer;
      var choices;
      var choiceCount = difficulty === "easy" ? 3 : 4;

      if (type === "source" || type === "movie") {
        var mode = type === "movie" ? "movie" : "source";
        answer = choice(
          (type === "movie" ? "movie:" : "source:") + source.id,
          sourceChoiceLabel(source, mode),
          type === "movie" ? source.franchise : source.type.toUpperCase()
        );
        var eligibleDistractors = sources.filter(function (candidate) {
          return type === "source" || (candidate.type === "commentary" && Boolean(candidate.film));
        });
        var ranked = rankDistractorSources(source, eligibleDistractors, mode, difficulty);
        var distractors = uniqueChoices(
          ranked.map(function (candidate) {
            return choice(
              (type === "movie" ? "movie:" : "source:") + candidate.id,
              sourceChoiceLabel(candidate, mode),
              type === "movie" ? candidate.franchise : candidate.type.toUpperCase()
            );
          })
        ).slice(0, choiceCount - 1);
        choices = [answer].concat(distractors);
      } else if (type === "franchise") {
        answer = choice("franchise:" + slug(source.franchise), source.franchise, "FRANCHISE");
        choices = [answer].concat(
          shuffle(
            franchises
              .filter(function (name) {
                return normalized(name) !== normalized(source.franchise);
              })
              .map(function (name) {
                return choice("franchise:" + slug(name), name, "FRANCHISE");
              }),
            random
          ).slice(0, choiceCount - 1)
        );
      } else {
        answer = choice("category:" + slug(receipt.category), receipt.category, "ARCHIVE CLASSIFICATION");
        choices = [answer].concat(
          shuffle(
            categories
              .filter(function (name) {
                return normalized(name) !== normalized(receipt.category);
              })
              .map(function (name) {
                return choice("category:" + slug(name), name, "ARCHIVE CLASSIFICATION");
              }),
            random
          ).slice(0, choiceCount - 1)
        );
      }
      choices = shuffle(uniqueChoices(choices), random);
      if (choices.length < Math.min(3, choiceCount)) return null;

      var bounded = boundedExcerpt(receipt.excerpt, CLUE_WORD_LIMITS[difficulty]);
      var prompt =
        type === "source"
          ? "Name the exact indexed upload that contains this caption receipt."
          : type === "movie"
            ? "Name the cataloged movie attached to this commentary receipt."
            : type === "franchise"
              ? "Which cataloged franchise owns the commentary containing this receipt?"
              : "Which editorial archive classification was assigned to this receipt?";
      return {
        privateId:
          type +
          ":" +
          receipt.receiptId +
          ":" +
          roundIndex +
          ":" +
          fingerprint(answer.id + difficulty),
        type: type,
        difficulty: difficulty,
        prompt: prompt,
        clue: {
          label: "BOUNDED INDEXED CAPTION RECEIPT",
          excerpt: bounded.text,
          wordCount: bounded.words,
          truncated: bounded.truncated,
          receiptCount: 1
        },
        choices: choices,
        answerId: answer.id,
        answerLabel: answer.label,
        receipts: [receipt],
        explanation:
          type === "source"
            ? "The receipt is indexed to “" + source.title + "” at " + formatTime(receipt.t) + "."
            : type === "movie"
              ? "The receipt's source is cataloged as “" + source.film + "” at " + formatTime(receipt.t) + "."
              : type === "franchise"
                ? "The source is cataloged under " + source.franchise + "; the receipt begins at " + formatTime(receipt.t) + "."
                : "The indexed editorial classification at " + formatTime(receipt.t) + " is " + receipt.category + "."
      };
    }

    function chooseArchivePair(scoped, random, usedReceiptIds) {
      var onePerSource = [];
      var grouped = new Map();
      scoped.forEach(function (receipt) {
        if (!grouped.has(receipt.sourceId)) grouped.set(receipt.sourceId, []);
        grouped.get(receipt.sourceId).push(receipt);
      });
      grouped.forEach(function (items, sourceId) {
        var source = sourceMap.get(sourceId);
        if (source && dayNumber(source.date) != null) {
          var unused = items.filter(function (receipt) {
            return !usedReceiptIds.has(receipt.receiptId);
          });
          var pool = unused.length ? unused : items;
          onePerSource.push(pool[Math.floor(random() * pool.length)]);
        }
      });
      var shuffled = shuffle(onePerSource, random);
      for (var index = 0; index < shuffled.length; index += 1) {
        var first = shuffled[index];
        var firstDate = dayNumber(sourceMap.get(first.sourceId).date);
        var peers = shuffled.filter(function (receipt) {
          var source = sourceMap.get(receipt.sourceId);
          var receiptDate = dayNumber(source.date);
          return (
            receipt.sourceId !== first.sourceId &&
            receiptDate != null &&
            firstDate !== receiptDate &&
            Math.abs(firstDate - receiptDate) >= 730
          );
        });
        if (!peers.length) {
          peers = shuffled.filter(function (receipt) {
            var source = sourceMap.get(receipt.sourceId);
            var receiptDate = dayNumber(source.date);
            return receipt.sourceId !== first.sourceId && receiptDate != null && firstDate !== receiptDate;
          });
        }
        if (peers.length) return [first, peers[Math.floor(random() * peers.length)]];
      }
      return null;
    }

    function chooseTapePair(scoped, random, usedReceiptIds, difficulty) {
      var scopedIds = new Set(
        scoped.map(function (receipt) {
          return receipt.receiptId;
        })
      );
      var groups = [];
      sourceReceiptMap.forEach(function (items) {
        var eligible = items.filter(function (receipt) {
          return scopedIds.has(receipt.receiptId);
        });
        if (eligible.length >= 2) groups.push(eligible);
      });
      groups = shuffle(groups, random);
      for (var groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
        var group = groups[groupIndex];
        var unused = group.filter(function (receipt) {
          return !usedReceiptIds.has(receipt.receiptId);
        });
        var anchors = unused.length ? unused : group;
        var anchor = anchors[Math.floor(random() * anchors.length)];
        var peers = group.filter(function (receipt) {
          var distance = Math.abs(receipt.t - anchor.t);
          if (receipt.receiptId === anchor.receiptId || distance < 45) return false;
          return difficulty !== "hard" || distance <= 1800;
        });
        if (!peers.length) {
          peers = group.filter(function (receipt) {
            return receipt.receiptId !== anchor.receiptId && Math.abs(receipt.t - anchor.t) >= 45;
          });
        }
        if (peers.length) return [anchor, peers[Math.floor(random() * peers.length)]];
      }
      return null;
    }

    function buildEarlierLaterRound(difficulty, scoped, random, usedReceiptIds, roundIndex) {
      var comparison = difficulty === "easy" ? "archive-order" : "tape-order";
      var pair =
        comparison === "archive-order"
          ? chooseArchivePair(scoped, random, usedReceiptIds)
          : chooseTapePair(scoped, random, usedReceiptIds, difficulty);
      if (!pair && comparison === "archive-order") {
        comparison = "tape-order";
        pair = chooseTapePair(scoped, random, usedReceiptIds, difficulty);
      }
      if (!pair) return null;

      pair = shuffle(pair, random);
      var firstReceipt = pair[0];
      var secondReceipt = pair[1];
      var firstSource = sourceMap.get(firstReceipt.sourceId);
      var secondSource = sourceMap.get(secondReceipt.sourceId);
      var answerIndex;
      if (comparison === "archive-order") {
        answerIndex = dayNumber(firstSource.date) < dayNumber(secondSource.date) ? 0 : 1;
      } else {
        answerIndex = firstReceipt.t < secondReceipt.t ? 0 : 1;
      }
      var limit = CLUE_WORD_LIMITS[difficulty];
      var firstClue = boundedExcerpt(firstReceipt.excerpt, limit);
      var secondClue = boundedExcerpt(secondReceipt.excerpt, limit);
      var labels = ["A", "B"];
      var answerId = "receipt-" + labels[answerIndex].toLowerCase();
      var context =
        comparison === "archive-order"
          ? "TWO INDEXED UPLOADS"
          : "SAME TAPE: " + firstSource.title;
      return {
        privateId:
          "earlier-later:" +
          firstReceipt.receiptId +
          ":" +
          secondReceipt.receiptId +
          ":" +
          roundIndex,
        type: "earlier-later",
        difficulty: difficulty,
        comparison: comparison,
        prompt:
          comparison === "archive-order"
            ? "Which receipt belongs to the source with the earlier indexed archive date?"
            : "Which receipt happens earlier inside this exact upload?",
        clue: {
          label: context,
          excerpt: "",
          wordCount: firstClue.words + secondClue.words,
          truncated: firstClue.truncated || secondClue.truncated,
          receiptCount: 2,
          cards: [
            {
              id: "receipt-a",
              label:
                comparison === "archive-order"
                  ? "A · " + (firstSource.film || firstSource.title)
                  : "RECEIPT A",
              excerpt: firstClue.text,
              wordCount: firstClue.words
            },
            {
              id: "receipt-b",
              label:
                comparison === "archive-order"
                  ? "B · " + (secondSource.film || secondSource.title)
                  : "RECEIPT B",
              excerpt: secondClue.text,
              wordCount: secondClue.words
            }
          ]
        },
        choices: [
          choice("receipt-a", "RECEIPT A", "EARLIER"),
          choice("receipt-b", "RECEIPT B", "EARLIER")
        ],
        answerId: answerId,
        answerLabel: answerIndex === 0 ? "RECEIPT A" : "RECEIPT B",
        receipts: [firstReceipt, secondReceipt],
        explanation:
          comparison === "archive-order"
            ? (answerIndex === 0 ? firstSource.title : secondSource.title) +
              " carries the earlier indexed archive date (" +
              (answerIndex === 0 ? firstSource.date : secondSource.date) +
              ")."
            : (answerIndex === 0 ? "Receipt A" : "Receipt B") +
              " appears first at " +
              formatTime(answerIndex === 0 ? firstReceipt.t : secondReceipt.t) +
              "; the other appears at " +
              formatTime(answerIndex === 0 ? secondReceipt.t : firstReceipt.t) +
              "."
      };
    }

    function publicRound(round, index, total) {
      return {
        id: "tape-round:" + fingerprint(round.privateId),
        number: index + 1,
        total: total,
        type: round.type,
        typeLabel: TYPE_LABELS[round.type],
        difficulty: round.difficulty,
        prompt: round.prompt,
        clue: serialCopy(round.clue),
        choices: serialCopy(round.choices),
        evidenceNotice: EVIDENCE_NOTICE,
        speakerNotice: SPEAKER_NOTICE
      };
    }

    function buildReveal(round, selectedId) {
      var selected = round.choices.find(function (item) {
        return item.id === selectedId;
      });
      var evidence = round.receipts.map(function (receipt) {
        return revealReceipt(receipt, sourceMap.get(receipt.sourceId));
      });
      return {
        correct: selectedId === round.answerId,
        selected: selected ? serialCopy(selected) : null,
        answer: serialCopy(
          round.choices.find(function (item) {
            return item.id === round.answerId;
          })
        ),
        explanation: round.explanation,
        receipts: evidence,
        receipt: evidence[0] || null,
        evidenceBag: evidence,
        accuracy: {
          basis: "Indexed archive metadata plus exact timestamped caption receipts.",
          speakerClaimMade: false,
          syntheticQuoteMade: false,
          timestampStatus: "indexed-timestamp",
          notice: EVIDENCE_NOTICE
        }
      };
    }

    function createSession(sessionOptions) {
      var request = sessionOptions || {};
      var length = Number(request.length || 5);
      if (SESSION_LENGTHS.indexOf(length) < 0) {
        throw new Error("Tape Trivia sessions must contain 5 or 10 rounds.");
      }
      var requestedDifficulty = normalized(request.difficulty || "mixed");
      if (DIFFICULTIES.indexOf(requestedDifficulty) < 0) {
        throw new Error("Unknown Tape Trivia difficulty: " + request.difficulty);
      }
      var seed = clean(request.seed || "wwam-after-midnight");
      var random = seededRandom(seed + "|" + length + "|" + requestedDifficulty);
      var scoped = scopedReceipts(request);
      if (!scoped.length) {
        throw new Error("No indexed caption receipts match those Tape Trivia filters.");
      }
      var possibleTypes = availableTypes(request);
      var requestedTypes = array(request.questionTypes).length
        ? request.questionTypes
        : request.questionType
          ? [request.questionType]
          : QUESTION_TYPES;
      requestedTypes = unique(
        requestedTypes.map(function (type) {
          return normalized(type).replace(/\s+/g, "-");
        })
      ).filter(function (type) {
        return QUESTION_TYPES.indexOf(type) >= 0 && possibleTypes.indexOf(type) >= 0;
      });
      if (!requestedTypes.length) {
        throw new Error("None of the requested Tape Trivia round types are available for those filters.");
      }

      var usedReceiptIds = new Set();
      var rounds = [];
      var typeDeck = [];
      var difficultyDeck = shuffle(["easy", "medium", "hard"], random);
      for (var index = 0; index < length; index += 1) {
        if (!typeDeck.length) typeDeck = shuffle(requestedTypes, random);
        var type = typeDeck.shift();
        var difficulty =
          requestedDifficulty === "mixed"
            ? difficultyDeck[index % difficultyDeck.length]
            : requestedDifficulty;
        var round =
          type === "earlier-later"
            ? buildEarlierLaterRound(difficulty, scoped, random, usedReceiptIds, index)
            : buildStandardRound(type, difficulty, scoped, random, usedReceiptIds, index);
        if (!round) {
          var fallbacks = shuffle(requestedTypes, random);
          for (var fallbackIndex = 0; fallbackIndex < fallbacks.length && !round; fallbackIndex += 1) {
            round =
              fallbacks[fallbackIndex] === "earlier-later"
                ? buildEarlierLaterRound(
                    difficulty,
                    scoped,
                    random,
                    usedReceiptIds,
                    index
                  )
                : buildStandardRound(
                    fallbacks[fallbackIndex],
                    difficulty,
                    scoped,
                    random,
                    usedReceiptIds,
                    index
                  );
          }
        }
        if (!round) {
          throw new Error("The indexed archive could not build a complete Tape Trivia session.");
        }
        round.receipts.forEach(function (receipt) {
          usedReceiptIds.add(receipt.receiptId);
        });
        rounds.push(round);
      }

      var cursor = 0;
      var score = 0;
      var streak = 0;
      var bestStreak = 0;
      var correctAnswers = 0;
      var answers = [];
      var currentResult = null;
      var complete = false;
      var possibleScore = 0;
      var possibleStreak = 0;
      rounds.forEach(function (round) {
        possibleScore += Math.round(
          DIFFICULTY_POINTS[round.difficulty] * (1 + Math.min(possibleStreak, 4) * 0.15)
        );
        possibleStreak += 1;
      });

      function summary() {
        return {
          score: score,
          possibleScore: possibleScore,
          correct: correctAnswers,
          total: rounds.length,
          accuracy: rounds.length ? Math.round((correctAnswers / rounds.length) * 100) : 0,
          bestStreak: bestStreak,
          grade: answerGrade(correctAnswers, rounds.length)
        };
      }

      function getState() {
        return {
          sessionId: "tape-session:" + fingerprint(seed + "|" + rounds.map(function (round) {
            return round.privateId;
          }).join("|")),
          seed: seed,
          length: rounds.length,
          difficulty: requestedDifficulty,
          filters: {
            franchise: clean(request.franchise || "ANY"),
            category: clean(request.category || "ANY"),
            questionTypes: requestedTypes.slice()
          },
          index: cursor,
          answered: Boolean(currentResult),
          complete: complete,
          score: score,
          possibleScore: possibleScore,
          streak: streak,
          bestStreak: bestStreak,
          correct: correctAnswers,
          currentRound: complete ? null : publicRound(rounds[cursor], cursor, rounds.length),
          lastResult: currentResult ? serialCopy(currentResult) : null,
          summary: complete ? summary() : null
        };
      }

      function submit(choiceId) {
        if (complete) {
          return {
            accepted: false,
            reason: "session-complete",
            state: getState()
          };
        }
        if (currentResult) {
          return {
            accepted: false,
            reason: "round-already-answered",
            result: serialCopy(currentResult),
            state: getState()
          };
        }
        var round = rounds[cursor];
        var selected = round.choices.find(function (item) {
          return item.id === choiceId;
        });
        if (!selected) {
          return {
            accepted: false,
            reason: "unknown-choice",
            state: getState()
          };
        }
        var reveal = buildReveal(round, choiceId);
        var streakBefore = streak;
        var points = reveal.correct
          ? Math.round(
              DIFFICULTY_POINTS[round.difficulty] *
                (1 + Math.min(streakBefore, 4) * 0.15)
            )
          : 0;
        if (reveal.correct) {
          streak += 1;
          correctAnswers += 1;
          bestStreak = Math.max(bestStreak, streak);
        } else {
          streak = 0;
        }
        score += points;
        currentResult = {
          accepted: true,
          roundId: publicRound(round, cursor, rounds.length).id,
          roundNumber: cursor + 1,
          correct: reveal.correct,
          points: points,
          score: score,
          streak: streak,
          bestStreak: bestStreak,
          reveal: reveal
        };
        answers.push(currentResult);
        return serialCopy(currentResult);
      }

      function next() {
        if (complete) {
          return {
            advanced: false,
            reason: "session-complete",
            state: getState()
          };
        }
        if (!currentResult) {
          return {
            advanced: false,
            reason: "answer-current-round-first",
            state: getState()
          };
        }
        if (cursor >= rounds.length - 1) {
          complete = true;
          return {
            advanced: true,
            complete: true,
            state: getState()
          };
        }
        cursor += 1;
        currentResult = null;
        return {
          advanced: true,
          complete: false,
          state: getState()
        };
      }

      function exportSession() {
        return {
          product: "WWAM After Midnight · Tape Trivia",
          version: VERSION,
          session: getState(),
          answers: serialCopy(answers),
          evidencePolicy: {
            speakerQuestions: false,
            inventedFacts: false,
            excerptWordLimit: 16,
            receiptEvidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
            notice: EVIDENCE_NOTICE
          }
        };
      }

      return Object.freeze({
        getState: getState,
        getCurrentRound: function () {
          return complete ? null : publicRound(rounds[cursor], cursor, rounds.length);
        },
        submit: submit,
        answer: submit,
        next: next,
        advance: next,
        getSummary: summary,
        exportSession: exportSession
      });
    }

    var kinds = receipts.reduce(function (counts, receipt) {
      counts[receipt.kind] = (counts[receipt.kind] || 0) + 1;
      return counts;
    }, {});
    var sourceTypes = sources.reduce(function (counts, source) {
      counts[source.type] = (counts[source.type] || 0) + 1;
      return counts;
    }, {});
    var questionCapacity = {
      source: receipts.length,
      movie: receipts.filter(function (receipt) {
        var source = sourceMap.get(receipt.sourceId);
        return source && source.type === "commentary" && source.film;
      }).length,
      franchise: receipts.filter(function (receipt) {
        var source = sourceMap.get(receipt.sourceId);
        return source && source.franchise;
      }).length,
      category: receipts.filter(function (receipt) {
        return receipt.kind === "comedy-moment" && receipt.category;
      }).length,
      "earlier-later": Array.from(sourceReceiptMap.values()).filter(function (items) {
        return items.length >= 2;
      }).length
    };

    return Object.freeze({
      engine: "WWAM Tape Trivia",
      version: VERSION,
      metrics: {
        indexedSources: sourceMap.size,
        playableReceipts: receipts.length,
        eligibleSources: eligibleSourceIds.size,
        sourceTypes: sourceTypes,
        franchises: franchises.length,
        categories: categories.length,
        receiptKinds: kinds,
        questionCapacity: questionCapacity,
        exactTimestampReceipts: receipts.filter(function (receipt) {
          return receipt.t >= 0 && /^https:\/\/www\.youtube\.com\/watch\?v=/.test(receipt.url);
        }).length,
        speakerQuestions: 0,
        syntheticQuotes: 0,
        maxClueWords: Math.max.apply(null, Object.values(CLUE_WORD_LIMITS))
      },
      filters: {
        difficulties: DIFFICULTIES.slice(),
        sessionLengths: SESSION_LENGTHS.slice(),
        questionTypes: QUESTION_TYPES.map(function (id) {
          return { id: id, label: TYPE_LABELS[id] };
        }),
        franchises: franchises.map(function (name) {
          return { id: slug(name), name: name };
        }),
        categories: categories.map(function (name) {
          return { id: slug(name), name: name };
        })
      },
      evidencePolicy: {
        allowedReceiptKinds: Array.from(ELIGIBLE_LORE_KINDS),
        excludedReceiptKinds: ["archive-source", "creator-context", "candidate-performance"],
        speakerQuestions: false,
        inventedFacts: false,
        answerBasis: "Catalog metadata and timestamped caption receipts only.",
        evidenceBagReady: true,
        notice: EVIDENCE_NOTICE,
        speakerNotice: SPEAKER_NOTICE
      },
      getAvailableQuestionTypes: availableTypes,
      getPoolMetrics: function (options) {
        var scoped = scopedReceipts(options);
        return {
          receipts: scoped.length,
          sources: new Set(
            scoped.map(function (receipt) {
              return receipt.sourceId;
            })
          ).size,
          questionTypes: availableTypes(options)
        };
      },
      createSession: createSession
    });
  }

  root.WWAMTapeTriviaEngine = Object.freeze({
    VERSION: VERSION,
    SESSION_LENGTHS: SESSION_LENGTHS.slice(),
    DIFFICULTIES: DIFFICULTIES.slice(),
    QUESTION_TYPES: QUESTION_TYPES.slice(),
    create: create,
    boundedExcerpt: boundedExcerpt,
    formatTime: formatTime
  });
})(typeof window !== "undefined" ? window : globalThis);
