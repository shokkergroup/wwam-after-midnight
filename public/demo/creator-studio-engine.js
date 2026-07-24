(function (root) {
  "use strict";

  var VERSION = "1.1.0";
  var EDITORIAL_LABEL = "SUGGESTED EDITORIAL COPY — NOT AN ARCHIVAL QUOTE";
  var EXCERPT_LABEL = "ARCHIVAL CAPTION EXCERPT — VERIFY IN SOURCE BEFORE PUBLISHING";
  var BOUNDARY_LABEL = "EDITORIAL WINDOW — IN/OUT POINTS REQUIRE CONTEXT REVIEW";
  var PUBLIC_EXCERPT_WORD_LIMIT = 16;
  var RISK_ORDER = { LOW: 1, MEDIUM: 2, HIGH: 3, HOLD: 4 };
  var CATEGORY_PRESETS = {
    "CHARACTER PERFORMANCE": {
      seconds: 22,
      title: "THE CHARACTER TOOK THE QUESTION. THE QUESTION DID NOT SURVIVE.",
      hook: "A normal answer was never on the table."
    },
    "OUT OF POCKET": {
      seconds: 24,
      title: "THE SENTENCE THAT SHOULD HAVE STAYED IN DRAFTS",
      hook: "There was still time to stop. They did not."
    },
    "UP IN YA": {
      seconds: 22,
      title: "WWAM UP IN YA: NO SAFE EXIT",
      hook: "The transcript has entered a restricted area."
    },
    "THE ROOM BREAKS": {
      seconds: 28,
      title: "THE EXACT SECOND THE ROOM LOST CUSTODY OF ITSELF",
      hook: "The conversation survived. Barely."
    },
    BREAKDOWN: {
      seconds: 34,
      title: "THE BIT THAT ATE THE CONVERSATION",
      hook: "This is where the original topic stopped mattering."
    },
    "BIT ENERGY": {
      seconds: 28,
      title: "NEW LORE JUST DROPPED",
      hook: "Somewhere in here, a recurring bit was born."
    },
    "FULL SEND": {
      seconds: 26,
      title: "ZERO BRAKES. ONE TIMESTAMP.",
      hook: "The responsible exit was several sentences ago."
    },
    "TAKE GETS NUCLEAR": {
      seconds: 36,
      title: "COURT IS NOW IN SESSION",
      hook: "The take crossed the containment line."
    },
    "FRANCHISE FELONY": {
      seconds: 38,
      title: "THE FRANCHISE HAS BEEN CALLED TO THE STAND",
      hook: "The charge is cinematic misconduct."
    },
    "LOVE LETTER": {
      seconds: 36,
      title: "THE RARE WHOLESOME RECEIPT",
      hook: "Yes, they actually loved something. Here is the timestamp."
    }
  };

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback || 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, number(value, min)));
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function clean(value) {
    return text(value).replace(/\s+/g, " ").trim();
  }

  function boundedExcerpt(value, maximumWords) {
    var words = clean(value).split(/\s+/).filter(Boolean);
    var limit = Math.max(1, Math.floor(number(maximumWords, PUBLIC_EXCERPT_WORD_LIMIT)));
    var truncated = words.length > limit;
    return {
      text: truncated ? words.slice(0, limit).join(" ") + "…" : words.join(" "),
      truncated: truncated,
      originalWordCount: words.length,
      publicWordLimit: limit
    };
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

  function stableSort(values, compare) {
    return array(values)
      .map(function (value, index) {
        return { value: value, index: index };
      })
      .sort(function (a, b) {
        return compare(a.value, b.value) || a.index - b.index;
      })
      .map(function (entry) {
        return entry.value;
      });
  }

  function fingerprint(value) {
    var source = text(value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function formatTime(seconds) {
    var total = Math.max(0, Math.floor(number(seconds)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = total % 60;
    return hours
      ? hours + ":" + String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0")
      : minutes + ":" + String(secs).padStart(2, "0");
  }

  function timestampUrl(url, seconds) {
    var base = clean(url).replace(/([?&])t=\d+s?(&|$)/, "$1").replace(/[?&]$/, "");
    var t = Math.max(0, Math.floor(number(seconds)));
    if (!base) return "";
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + "t=" + t + "s";
  }

  function dayNumber(value) {
    var parsed = Date.parse(clean(value) + "T00:00:00Z");
    return Number.isFinite(parsed) ? Math.floor(parsed / 86400000) : 0;
  }

  function titleCase(value) {
    return clean(value)
      .toLowerCase()
      .replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function resolveShowcase(input) {
    var options = input || {};
    if (options.showcase && array(options.showcase.receipts).length) {
      return options.showcase;
    }
    if (array(options.receipts).length && array(options.sources).length) {
      return options;
    }
    if (root.WWAMShowcaseEngine && typeof root.WWAMShowcaseEngine.create === "function") {
      return root.WWAMShowcaseEngine.create(options);
    }
    throw new Error(
      "WWAMCreatorClipLab.create needs a Showcase Engine result or source/receipt arrays."
    );
  }

  function sourceMaps(showcase) {
    var sourceById = new Map();
    array(showcase.sources).forEach(function (source) {
      if (source && clean(source.id)) sourceById.set(clean(source.id), source);
    });
    var nodeById = new Map();
    array(showcase.memoryGraph && showcase.memoryGraph.nodes).forEach(function (node) {
      if (node && clean(node.id)) nodeById.set(clean(node.id), node);
    });
    return { sourceById: sourceById, nodeById: nodeById };
  }

  function receiptEntities(receipt, nodeById) {
    var topics = [];
    var characters = [];
    var bits = [];
    array(receipt.entityIds).forEach(function (id) {
      var node = nodeById.get(id);
      var type = clean(node && node.type).toLowerCase();
      var label = clean(node && (node.label || node.name));
      if (!label) return;
      if (type === "character") characters.push({ id: id, label: label });
      else if (type === "bit") bits.push({ id: id, label: label });
      else if (["topic", "film", "franchise"].indexOf(type) >= 0) {
        topics.push({ id: id, label: label, type: type });
      }
    });
    if (receipt.topic) {
      topics.push({
        id: "topic:" + slug(receipt.topic),
        label: clean(receipt.topic),
        type: "topic"
      });
    }
    if (/^TOPIC:\s*/.test(clean(receipt.category))) {
      var label = clean(receipt.category).replace(/^TOPIC:\s*/i, "");
      topics.push({ id: "topic:" + slug(label), label: titleCase(label), type: "topic" });
    }
    if (receipt.characterId && !characters.some(function (item) {
      return item.id === receipt.characterId;
    })) {
      var characterNode = nodeById.get(receipt.characterId);
      characters.push({
        id: receipt.characterId,
        label: clean(characterNode && characterNode.label) || titleCase(receipt.characterId.replace(/^character:/, ""))
      });
    }
    return {
      topics: uniqueBy(topics, "id"),
      characters: uniqueBy(characters, "id"),
      bits: uniqueBy(bits, "id")
    };
  }

  function uniqueBy(values, field) {
    var seen = new Set();
    return array(values).filter(function (value) {
      var key = clean(value && value[field]);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function categoryPreset(category) {
    var label = clean(category).toUpperCase();
    if (CATEGORY_PRESETS[label]) return CATEGORY_PRESETS[label];
    if (label.indexOf("CHARACTER") >= 0) return CATEGORY_PRESETS["CHARACTER PERFORMANCE"];
    if (label.indexOf("TOPIC:") === 0) {
      return {
        seconds: 42,
        title: "THE TOPIC JUMP POINT",
        hook: "Start here when you want the conversation, not the three-hour runway."
      };
    }
    return {
      seconds: 30,
      title: "WWAM AFTER MIDNIGHT: THE RECEIPT",
      hook: "One timestamp. No archaeology degree required."
    };
  }

  function suggestedDuration(receipt, source) {
    var preset = categoryPreset(receipt.category);
    var words = Math.max(1, number(receipt.wordCount) || clean(receipt.excerpt).split(/\s+/).length);
    var spokenSeconds = words * 0.43 + 8;
    var seconds = clamp(Math.round((preset.seconds * 0.7 + spokenSeconds * 0.3) / 2) * 2, 16, 58);
    if (receipt.type === "character-performance") seconds = clamp(seconds, 16, 30);
    var available = number(source && source.duration) - Math.max(0, number(receipt.t) - 4);
    return available > 0 ? Math.max(4, Math.min(seconds, Math.floor(available))) : seconds;
  }

  function assessEvidence(receipt, source) {
    var level = clean(receipt.evidenceLevel || "machine").toLowerCase();
    var score =
      level === "creator"
        ? 96
        : level === "editor"
          ? 90
          : level === "curated-candidate"
            ? 78
            : 68;
    var reasons = [];
    if (!clean(receipt.sourceId) || !clean(receipt.url)) {
      score -= 50;
      reasons.push("source-link-missing");
    }
    if (!Number.isFinite(Number(receipt.t))) {
      score -= 50;
      reasons.push("timestamp-missing");
    }
    if (!clean(receipt.excerpt)) {
      score -= 45;
      reasons.push("caption-excerpt-missing");
    }
    if (source && source.captioned === false) {
      score -= 35;
      reasons.push("source-captions-unavailable");
    }
    if (number(receipt.wordCount) >= 6) score += 3;
    if (number(receipt.wordCount) <= 4) {
      score -= 12;
      reasons.push("very-short-caption-window");
    }
    if (/(\.{2,}|…)$/.test(clean(receipt.excerpt))) {
      score -= 7;
      reasons.push("caption-window-appears-truncated");
    }
    if (/^[a-z]/.test(clean(receipt.excerpt))) {
      score -= 4;
      reasons.push("caption-window-may-begin-mid-thought");
    }
    if (receipt.type === "character-performance" && !clean(receipt.performer)) {
      score -= 25;
      reasons.push("character-performer-not-supplied");
    }
    return {
      score: clamp(Math.round(score), 0, 100),
      label: score >= 88 ? "HIGH" : score >= 70 ? "MEDIUM" : "LOW",
      evidenceLevel: level || "machine",
      basis:
        level === "creator"
          ? "Creator-certified receipt metadata"
          : level === "editor"
            ? "Editor-verified receipt metadata"
            : level === "curated-candidate"
              ? "Timestamp-validated human-curated candidate; surrounding context, editor identity, and clip speaker remain unverified"
              : "Machine-surfaced transcript receipt; context has not been human-certified",
      caveats: reasons
    };
  }

  function assessRisk(receipt, source, evidence) {
    var score = 8;
    var reasons = [];
    var body = normalized(receipt.excerpt);
    var category = clean(receipt.category).toUpperCase();
    if (evidence.evidenceLevel === "machine") {
      score += 20;
      reasons.push("machine-surfaced-context-review-required");
    }
    if (evidence.evidenceLevel === "curated-candidate") {
      score += 8;
      reasons.push("curated-candidate-context-review-required");
    }
    if (source && source.captioned === false) {
      score += 45;
      reasons.push("caption-source-unavailable");
    }
    if (evidence.caveats.indexOf("caption-window-appears-truncated") >= 0) {
      score += 12;
      reasons.push("caption-window-may-end-mid-thought");
    }
    if (evidence.caveats.indexOf("caption-window-may-begin-mid-thought") >= 0) {
      score += 8;
      reasons.push("caption-window-may-begin-mid-thought");
    }
    if (evidence.caveats.indexOf("very-short-caption-window") >= 0) {
      score += 12;
      reasons.push("short-excerpt-needs-surrounding-context");
    }
    if (receipt.type === "character-performance" && !clean(receipt.performer)) {
      score += 32;
      reasons.push("do-not-credit-performer-until-verified");
    }
    if (
      /\b(fuck|fucking|shit|goddamn|dick|balls|bitch|asshole|cock|cum|splooge)\b/.test(body)
    ) {
      score += 18;
      reasons.push("strong-language-brand-safety-review");
    }
    if (/\[bleep\]/i.test(clean(receipt.excerpt))) {
      score += 10;
      reasons.push("bleeped-language-brand-safety-review");
    }
    if (
      ["TAKE GETS NUCLEAR", "FRANCHISE FELONY", "LOVE LETTER"].indexOf(category) >= 0
    ) {
      score += 8;
      reasons.push("opinion-context-must-not-be-overstated");
    }
    if (!clean(receipt.sourceId) || !clean(receipt.url) || !Number.isFinite(Number(receipt.t))) {
      score = 100;
      reasons.push("hold-missing-provenance");
    }
    score = clamp(Math.round(score), 0, 100);
    return {
      score: score,
      label: score >= 75 ? "HOLD" : score >= 48 ? "HIGH" : score >= 24 ? "MEDIUM" : "LOW",
      reasons: unique(reasons),
      contextReviewRequired: true,
      legalNote:
        "This is an edit-planning signal, not a rights clearance or a factual judgment about the hosts."
    };
  }

  function speakerPolicy(receipt, character) {
    if (receipt.type !== "character-performance") {
      return {
        display: null,
        mappedPerformer: null,
        status: "NOT IDENTIFIED",
        creditAllowed: false,
        clipAttributionCertified: false,
        basis: "YouTube auto-captions are not speaker-diarized. No host is inferred."
      };
    }
    if (!clean(receipt.performer)) {
      return {
        display: null,
        mappedPerformer: null,
        character: clean(character && character.label),
        status: "CHARACTER FOUND / PERFORMER UNVERIFIED",
        creditAllowed: false,
        clipAttributionCertified: false,
        basis: "The performance receipt does not contain an approved performer mapping."
      };
    }
    return {
      display: null,
      mappedPerformer: clean(receipt.performer),
      character: clean(character && character.label),
      status: "OWNER-MAPPED CHARACTER / CLIP SPEAKER NOT DIARIZED",
      creditAllowed: false,
      clipAttributionCertified: false,
      basis:
        "The project-owner mapping identifies the recurring character performer generally. Auto-captions do not establish who speaks in this individual clip."
    };
  }

  function editorialCopy(receipt, source, entities) {
    var preset = categoryPreset(receipt.category);
    var character =
      receipt.type === "character-performance" && clean(receipt.performer)
        ? entities.characters[0] && entities.characters[0].label
        : "";
    var topic = entities.topics[0] && entities.topics[0].label;
    var category = clean(receipt.category).toUpperCase() || "ARCHIVE MOMENT";
    var subject = character || topic;
    var titleA = preset.title;
    var titleB = subject
      ? subject.toUpperCase() + ": RECEIPTS OR IT DIDN'T HAPPEN"
      : "WWAM AFTER MIDNIGHT AT " + formatTime(receipt.t);
    var hook = preset.hook;
    if (character) {
      titleA = character.toUpperCase() + " HAS ENTERED THE CHAT";
      hook = "They asked " + character + " a question. That was the first mistake.";
    } else if (topic && category.indexOf("TOPIC:") === 0) {
      titleA = topic.toUpperCase() + ": SKIP STRAIGHT TO THE DAMAGE";
      hook = "The " + topic + " conversation starts here.";
    } else if (topic && category === "TAKE GETS NUCLEAR") {
      titleA = topic.toUpperCase() + " HAS BEEN CALLED TO THE STAND";
      hook = "The " + topic + " take crossed the containment line.";
    }
    return {
      label: EDITORIAL_LABEL,
      titleOptions: unique([titleA, titleB]),
      hookOptions: unique([
        hook,
        "The archive marked this exact moment at " + formatTime(receipt.t) + "."
      ]),
      suggestedCaption:
        "Source receipt: " +
        clean(source && source.title) +
        " at " +
        formatTime(receipt.t) +
        ". Watch the full context before judging the clip.",
      claimsPolicy:
        "Titles and hooks are promotional suggestions. They are not transcripts and must never be rendered as host quotes."
    };
  }

  function buildCandidate(receipt, maps) {
    if (!receipt || receipt.type === "topic-chapter" || !clean(receipt.excerpt)) return null;
    var source = maps.sourceById.get(clean(receipt.sourceId)) || {};
    var entities = receiptEntities(receipt, maps.nodeById);
    var evidence = assessEvidence(receipt, source);
    var risk = assessRisk(receipt, source, evidence);
    var duration = suggestedDuration(receipt, source);
    var preRoll = receipt.type === "character-performance" ? 3 : 5;
    var start = Math.max(0, Math.floor(number(receipt.t) - preRoll));
    var end = start + duration;
    if (number(source.duration) > 0) end = Math.min(end, Math.floor(number(source.duration)));
    duration = Math.max(1, end - start);
    var character = entities.characters[0] || null;
    var reach = number(source.views) > 0
      ? clamp(Math.log10(1 + number(source.views)) / Math.log10(250001), 0, 1)
      : 0.35;
    var strength = clamp(number(receipt.score, 50), 0, 100);
    var editPriority = Math.round(
      clamp(
        strength * 0.58 +
          evidence.score * 0.24 +
          reach * 100 * 0.12 +
          (receipt.type === "character-performance" ? 6 : 0) -
          risk.score * 0.18,
        0,
        100
      )
    );
    var id = "short:" + fingerprint(
      [receipt.id, start, end, clean(receipt.category)].join("|")
    );
    var approvalStatus =
      risk.label === "HOLD"
        ? "HOLD"
        : evidence.evidenceLevel === "machine" || risk.label === "HIGH"
          ? "CONTEXT REVIEW"
          : risk.label === "MEDIUM"
            ? "FAST REVIEW"
            : "EVIDENCE READY / EDIT REVIEW STILL REQUIRED";
    return {
      id: id,
      kind: "short-candidate",
      receiptId: receipt.id,
      sourceId: receipt.sourceId,
      sourceType: receipt.sourceType || source.type || "",
      sourceLane: receipt.sourceLane || source.lane || "",
      sourceTitle: clean(receipt.sourceTitle || source.title),
      sourceDate: clean(receipt.date || source.date),
      sourceUrl: clean(source.url) || clean(receipt.url).replace(/&?t=\d+s?$/, ""),
      receiptUrl: timestampUrl(clean(source.url) || clean(receipt.url), receipt.t),
      receiptAt: number(receipt.t),
      timecode: clean(receipt.timecode) || formatTime(receipt.t),
      category: clean(receipt.category).toUpperCase(),
      topics: entities.topics,
      characters: entities.characters,
      bits: entities.bits,
      archivalExcerpt: clean(receipt.excerpt),
      excerptLabel: EXCERPT_LABEL,
      excerptWordCount: number(receipt.wordCount) || clean(receipt.excerpt).split(/\s+/).length,
      editWindow: {
        in: start,
        out: end,
        inTimecode: formatTime(start),
        outTimecode: formatTime(end),
        seconds: duration,
        receiptAt: number(receipt.t),
        status: BOUNDARY_LABEL,
        preRollSeconds: Math.max(0, Math.floor(number(receipt.t)) - start)
      },
      editorial: editorialCopy(receipt, source, entities),
      evidence: evidence,
      risk: risk,
      speaker: speakerPolicy(receipt, character),
      editPriority: editPriority,
      scoreBreakdown: {
        receiptStrength: strength,
        evidenceConfidence: evidence.score,
        archiveReachIndex: Math.round(reach * 100),
        contextRiskPenalty: Math.round(risk.score * 0.18),
        curatedCharacterCandidateBonus: receipt.type === "character-performance" ? 6 : 0,
        formula:
          "58% receipt strength + 24% evidence confidence + 12% reach + curated-character-candidate bonus - 18% context-risk penalty"
      },
      approval: {
        status: approvalStatus,
        humanReviewRequired: true,
        checks: unique(
          [
            "Watch at least 15 seconds before and after the proposed window.",
            "Confirm the edit does not reverse the meaning of the full exchange.",
            "Confirm platform language/brand-safety treatment.",
            receipt.type === "character-performance"
              ? "Treat the owner mapping as recurring-character context only; do not use it as clip-level speaker credit."
              : "Do not add a host name unless a human verifies the speaker."
          ].concat(risk.reasons)
        )
      },
      provenance: {
        sourceId: receipt.sourceId,
        receiptId: receipt.id,
        exactTimestamp: number(receipt.t),
        sourceLink: timestampUrl(clean(source.url) || clean(receipt.url), receipt.t),
        evidenceLevel: evidence.evidenceLevel,
        excerptType: "short caption excerpt",
        transcriptPolicy:
          "The excerpt is archival evidence. Proposed copy and edit boundaries are separate editorial suggestions."
      }
    };
  }

  function candidateCompare(a, b) {
    return (
      number(b.editPriority) - number(a.editPriority) ||
      number(b.evidence && b.evidence.score) - number(a.evidence && a.evidence.score) ||
      clean(b.sourceDate).localeCompare(clean(a.sourceDate)) ||
      clean(a.receiptId).localeCompare(clean(b.receiptId))
    );
  }

  function anchorGroups(shorts) {
    var groups = new Map();
    function add(kind, id, label, candidate) {
      var key = kind + ":" + id;
      if (!groups.has(key)) {
        groups.set(key, { kind: kind, anchorId: id, label: label, candidates: [] });
      }
      groups.get(key).candidates.push(candidate);
    }
    shorts.forEach(function (candidate) {
      if (candidate.speaker.mappedPerformer && candidate.characters.length) {
        candidate.characters.forEach(function (character) {
          add("character", character.id, character.label, candidate);
        });
      }
      candidate.topics.forEach(function (topic) {
        add("topic", topic.id, topic.label, candidate);
      });
      if (candidate.category) {
        add("category", slug(candidate.category), candidate.category, candidate);
      }
    });
    return Array.from(groups.values());
  }

  function sourceDiverse(values, limit) {
    var selected = [];
    var deferred = [];
    var seen = new Set();
    stableSort(values, candidateCompare).forEach(function (item) {
      if (!seen.has(item.sourceId) && selected.length < limit) {
        selected.push(item);
        seen.add(item.sourceId);
      } else {
        deferred.push(item);
      }
    });
    deferred.forEach(function (item) {
      if (selected.length < limit) selected.push(item);
    });
    return selected;
  }

  function aggregateRisk(items) {
    var scores = array(items).map(function (item) {
      return number(item.risk && item.risk.score);
    });
    var max = scores.length ? Math.max.apply(null, scores) : 0;
    return {
      score: max,
      label: max >= 75 ? "HOLD" : max >= 48 ? "HIGH" : max >= 24 ? "MEDIUM" : "LOW",
      basis: "Highest segment risk controls the package gate.",
      holdCount: array(items).filter(function (item) {
        return item.risk && item.risk.label === "HOLD";
      }).length
    };
  }

  function aggregateEvidence(items) {
    var scores = array(items).map(function (item) {
      return number(item.evidence && item.evidence.score);
    });
    var minimum = scores.length ? Math.min.apply(null, scores) : 0;
    var average = scores.length
      ? Math.round(scores.reduce(function (sum, value) {
          return sum + value;
        }, 0) / scores.length)
      : 0;
    return {
      minimum: minimum,
      average: average,
      label: minimum >= 88 ? "HIGH" : minimum >= 70 ? "MEDIUM" : "LOW",
      basis: "Package confidence is gated by its least-certain segment."
    };
  }

  function supercutTitle(group) {
    if (group.kind === "character") {
      return group.label.toUpperCase() + ": THE EMERGENCY BROADCAST";
    }
    if (group.kind === "topic") {
      return group.label.toUpperCase() + ": FROM HOT TAKE TO TOTAL DETOUR";
    }
    var label = group.label.toUpperCase();
    return (label.indexOf("THE ") === 0 ? label : "THE " + label) + " EVIDENCE REEL";
  }

  function buildSupercuts(shorts) {
    return stableSort(
      anchorGroups(shorts)
        .map(function (group) {
          var uniqueReceipts = uniqueBy(group.candidates, "receiptId");
          var sourceCount = new Set(uniqueReceipts.map(function (item) {
            return item.sourceId;
          })).size;
          if (uniqueReceipts.length < 3 || sourceCount < 2) return null;
          var selected = sourceDiverse(uniqueReceipts, 8);
          var chronological = stableSort(selected, function (a, b) {
            return (
              clean(a.sourceDate).localeCompare(clean(b.sourceDate)) ||
              number(a.receiptAt) - number(b.receiptAt) ||
              clean(a.receiptId).localeCompare(clean(b.receiptId))
            );
          });
          var total = chronological.reduce(function (sum, item) {
            return sum + number(item.editWindow.seconds);
          }, 0);
          var risk = aggregateRisk(chronological);
          var evidence = aggregateEvidence(chronological);
          var averagePriority = Math.round(
            chronological.reduce(function (sum, item) {
              return sum + item.editPriority;
            }, 0) / chronological.length
          );
          return {
            id: "supercut:" + fingerprint(
              group.kind + "|" + group.anchorId + "|" + chronological.map(function (item) {
                return item.receiptId;
              }).join("|")
            ),
            kind: "supercut-bundle",
            anchorType: group.kind,
            anchorId: group.anchorId,
            anchor: group.label,
            title: supercutTitle(group),
            editorialLabel: EDITORIAL_LABEL,
            hook:
              group.kind === "character"
                ? "One recurring character, several years of avoidable escalation."
                : group.kind === "topic"
                  ? "The same subject keeps returning. The timestamps remember everything."
                  : "The archive's strongest " + group.label + " receipts, cut as a controlled descent.",
            segments: chronological,
            receiptIds: chronological.map(function (item) {
              return item.receiptId;
            }),
            sourceIds: unique(chronological.map(function (item) {
              return item.sourceId;
            })),
            segmentCount: chronological.length,
            sourceCount: new Set(chronological.map(function (item) {
              return item.sourceId;
            })).size,
            suggestedSeconds: total,
            editPriority: averagePriority,
            risk: risk,
            evidence: evidence,
            storyShape: {
              coldOpenReceiptId: stableSort(chronological, candidateCompare)[0].receiptId,
              originReceiptId: chronological[0].receiptId,
              latestReceiptId: chronological[chronological.length - 1].receiptId,
              closerReceiptId: stableSort(chronological, candidateCompare)[0].receiptId,
              originClaim:
                "Earliest in this indexed package only; do not call it the first-ever performance without creator certification."
            },
            editNote:
              "Use source-diverse receipts as an editorial spine. Every transition and context boundary remains a human edit decision."
          };
        })
        .filter(Boolean),
      function (a, b) {
        return (
          number(b.editPriority) - number(a.editPriority) ||
          number(b.sourceCount) - number(a.sourceCount) ||
          clean(a.id).localeCompare(clean(b.id))
        );
      }
    );
  }

  function buildResurfacing(shorts) {
    return stableSort(
      anchorGroups(shorts)
        .filter(function (group) {
          return group.kind === "topic" || group.kind === "character";
        })
        .map(function (group) {
          var ordered = stableSort(uniqueBy(group.candidates, "receiptId"), function (a, b) {
            return (
              clean(a.sourceDate).localeCompare(clean(b.sourceDate)) ||
              number(a.receiptAt) - number(b.receiptAt) ||
              clean(a.receiptId).localeCompare(clean(b.receiptId))
            );
          });
          if (ordered.length < 2) return null;
          var archive = ordered[0];
          var current = null;
          for (var index = ordered.length - 1; index >= 1; index -= 1) {
            if (ordered[index].sourceId !== archive.sourceId) {
              current = ordered[index];
              break;
            }
          }
          if (!current) return null;
          var span = Math.max(0, dayNumber(current.sourceDate) - dayNumber(archive.sourceDate));
          var score = Math.round(
            clamp(
              (archive.editPriority + current.editPriority) / 2 +
                Math.min(12, Math.log2(2 + span)),
              0,
              100
            )
          );
          return {
            id: "resurface:" + fingerprint(
              [group.anchorId, archive.receiptId, current.receiptId].join("|")
            ),
            kind: "episode-resurfacing",
            anchorType: group.kind,
            anchorId: group.anchorId,
            anchor: group.label,
            title: "THEN / NOW: " + group.label.toUpperCase(),
            editorialLabel: EDITORIAL_LABEL,
            hook:
              "The archive and the current conversation share one indexed subject. Here are both receipts.",
            archive: archive,
            current: current,
            receiptIds: [archive.receiptId, current.receiptId],
            sourceIds: [archive.sourceId, current.sourceId],
            spanDays: span,
            resurfaceScore: score,
            risk: aggregateRisk([archive, current]),
            evidence: aggregateEvidence([archive, current]),
            claimBoundary:
              "These receipts share an indexed " +
              group.kind +
              ". This package does not claim an opinion changed, a prediction came true, or the older receipt is the bit's true origin.",
            useCases: [
              "Then-versus-now vertical edit",
              "Archive callback before the next related livestream",
              "Community poll with both full-context links"
            ]
          };
        })
        .filter(Boolean),
      function (a, b) {
        return (
          number(b.resurfaceScore) - number(a.resurfaceScore) ||
          number(b.spanDays) - number(a.spanDays) ||
          clean(a.id).localeCompare(clean(b.id))
        );
      }
    );
  }

  function choiceList(value) {
    return array(value).length ? value : value == null || value === "" ? [] : [value];
  }

  function includesChoice(values, choices) {
    var haystack = array(values).map(normalized);
    var needles = choiceList(choices).map(normalized).filter(Boolean);
    if (!needles.length) return true;
    return needles.some(function (needle) {
      return haystack.some(function (value) {
        return value === needle || value.indexOf(needle) >= 0 || needle.indexOf(value) >= 0;
      });
    });
  }

  function lengthRange(filter) {
    if (filter == null || filter === "") return { min: 0, max: Infinity };
    if (typeof filter === "number") return { min: 0, max: filter };
    if (typeof filter === "object") {
      return {
        min: number(filter.min, 0),
        max: Number.isFinite(Number(filter.max)) ? Number(filter.max) : Infinity
      };
    }
    var value = normalized(filter);
    if (["quick", "under 30", "short"].indexOf(value) >= 0) return { min: 0, max: 30 };
    if (["standard", "30 45", "medium"].indexOf(value) >= 0) return { min: 30, max: 45 };
    if (["extended", "45 60", "long"].indexOf(value) >= 0) return { min: 45, max: 60 };
    return { min: 0, max: number(value, Infinity) };
  }

  function riskAllowed(candidate, filter) {
    if (!filter) return true;
    var maximum = clean(filter).toUpperCase();
    return number(RISK_ORDER[candidate.risk.label], 4) <= number(RISK_ORDER[maximum], 4);
  }

  function requestedRisk(filters) {
    var options = filters || {};
    return options.maxRisk || options.risk || "";
  }

  function matchesCandidate(candidate, filters) {
    var options = filters || {};
    var topics = candidate.topics.map(function (item) {
      return item.id + " " + item.label;
    });
    var characters = candidate.characters.map(function (item) {
      return item.id + " " + item.label;
    });
    var categories = [candidate.category];
    var length = lengthRange(options.length);
    var seconds = number(candidate.editWindow && candidate.editWindow.seconds);
    if (!includesChoice(topics, options.topic)) return false;
    if (!includesChoice(characters, options.character)) return false;
    if (!includesChoice(categories, options.category)) return false;
    if (!includesChoice([candidate.sourceType], options.sourceType)) return false;
    if (!includesChoice([candidate.evidence.evidenceLevel], options.evidence)) return false;
    if (!riskAllowed(candidate, requestedRisk(options))) return false;
    if (seconds < length.min || seconds > length.max) return false;
    if (Number.isFinite(Number(options.minPriority)) && candidate.editPriority < Number(options.minPriority)) {
      return false;
    }
    var query = normalized(options.query);
    if (
      query &&
      normalized(
        [
          candidate.sourceTitle,
          candidate.category,
          candidate.archivalExcerpt,
          topics.join(" "),
          characters.join(" ")
        ].join(" ")
      ).indexOf(query) < 0
    ) {
      return false;
    }
    return true;
  }

  function limitValues(values, filters) {
    var requested = number(filters && filters.limit);
    return requested > 0 ? values.slice(0, requested) : values;
  }

  function matchesPackage(item, filters) {
    var options = filters || {};
    if (
      options.topic &&
      item.anchorType === "topic" &&
      !includesChoice([item.anchorId, item.anchor], options.topic)
    ) {
      return false;
    }
    if (
      options.character &&
      item.anchorType === "character" &&
      !includesChoice([item.anchorId, item.anchor], options.character)
    ) {
      return false;
    }
    if (
      options.category &&
      item.anchorType === "category" &&
      !includesChoice([item.anchorId, item.anchor], options.category)
    ) {
      return false;
    }
    if (options.topic && item.anchorType !== "topic") {
      if (!item.segments && !item.archive) return false;
      var topicMatch = packageCandidates(item).some(function (candidate) {
        return includesChoice(candidate.topics.map(function (topic) {
          return topic.id + " " + topic.label;
        }), options.topic);
      });
      if (!topicMatch) return false;
    }
    if (options.character && item.anchorType !== "character") {
      var characterMatch = packageCandidates(item).some(function (candidate) {
        return includesChoice(candidate.characters.map(function (character) {
          return character.id + " " + character.label;
        }), options.character);
      });
      if (!characterMatch) return false;
    }
    if (options.category && item.anchorType !== "category") {
      var categoryMatch = packageCandidates(item).some(function (candidate) {
        return includesChoice([candidate.category], options.category);
      });
      if (!categoryMatch) return false;
    }
    if (options.length) {
      var candidates = packageCandidates(item);
      if (!candidates.some(function (candidate) {
        return matchesCandidate(candidate, { length: options.length });
      })) {
        return false;
      }
    }
    return true;
  }

  function hasCandidateFilters(filters) {
    var options = filters || {};
    return Boolean(
      options.topic ||
        options.character ||
        options.category ||
        options.length ||
        options.totalLength ||
        options.sourceType ||
        options.evidence ||
        options.maxRisk ||
        options.risk ||
        options.minPriority ||
        options.query
    );
  }

  function rebuildSupercut(item, segments, id, note, preserveOrder) {
    if (segments.length < 3) return null;
    var sourceIds = unique(segments.map(function (segment) {
      return segment.sourceId;
    }));
    if (sourceIds.length < 2) return null;
    var chronological = preserveOrder
      ? segments.slice()
      : stableSort(segments, function (a, b) {
          return (
            clean(a.sourceDate).localeCompare(clean(b.sourceDate)) ||
            number(a.receiptAt) - number(b.receiptAt) ||
            clean(a.receiptId).localeCompare(clean(b.receiptId))
          );
        });
    var priorityOrder = stableSort(chronological, candidateCompare);
    return Object.assign({}, item, {
      id: clean(id) || item.id,
      segments: chronological,
      receiptIds: chronological.map(function (segment) {
        return segment.receiptId;
      }),
      sourceIds: sourceIds,
      segmentCount: chronological.length,
      sourceCount: sourceIds.length,
      suggestedSeconds: chronological.reduce(function (sum, segment) {
        return sum + number(segment.editWindow.seconds);
      }, 0),
      editPriority: Math.round(
        chronological.reduce(function (sum, segment) {
          return sum + segment.editPriority;
        }, 0) / chronological.length
      ),
      risk: aggregateRisk(chronological),
      evidence: aggregateEvidence(chronological),
      storyShape: {
        coldOpenReceiptId: priorityOrder[0].receiptId,
        originReceiptId: chronological[0].receiptId,
        latestReceiptId: chronological[chronological.length - 1].receiptId,
        closerReceiptId: priorityOrder[0].receiptId,
        originClaim:
          "Earliest in this filtered indexed package only; do not call it the first-ever performance without creator certification."
      },
      filterNote:
        clean(note) ||
        "Segments were rebuilt from an exact receipt ledger; no off-theme clips were added."
    });
  }

  function filteredSupercut(item, filters) {
    if (!hasCandidateFilters(filters)) return item;
    var segments = item.segments.filter(function (candidate) {
      return matchesCandidate(candidate, filters);
    });
    var filtered = rebuildSupercut(
      item,
      segments,
      "",
      "Segments were rebuilt from the requested filters; no off-theme clips remain in this bundle."
    );
    if (!filtered) return null;
    filtered.id =
      item.id +
      ":filter:" +
      fingerprint(
        filtered.receiptIds.join("|")
      );
    if (filters && filters.totalLength) {
      var totalRange = lengthRange(filters.totalLength);
      if (
        filtered.suggestedSeconds < totalRange.min ||
        filtered.suggestedSeconds > totalRange.max
      ) {
        return null;
      }
    }
    return filtered;
  }

  function filteredResurfacing(item, filters) {
    if (!hasCandidateFilters(filters)) return item;
    return matchesCandidate(item.archive, filters) && matchesCandidate(item.current, filters)
      ? item
      : null;
  }

  function packageCandidates(item) {
    if (array(item && item.segments).length) return item.segments;
    return [item && item.archive, item && item.current].filter(Boolean);
  }

  function flattenSelections(selection) {
    var values = Array.isArray(selection) ? selection : selection ? [selection] : [];
    var clips = [];
    values.forEach(function (item) {
      if (!item) return;
      if (item.kind === "short-candidate") clips.push(item);
      else if (item.kind === "supercut-bundle") clips = clips.concat(item.segments);
      else if (item.kind === "episode-resurfacing") clips.push(item.archive, item.current);
      else if (array(item.segments).length) clips = clips.concat(item.segments);
    });
    return uniqueBy(clips.filter(Boolean), "receiptId");
  }

  function selectionSnapshotFingerprint(snapshot) {
    return fingerprint(
      [
        clean(snapshot.schema),
        clean(snapshot.id),
        clean(snapshot.baseId),
        clean(snapshot.kind),
        array(snapshot.receiptIds).join("|"),
        array(snapshot.sourceIds).join("|"),
        clean(snapshot.archiveFingerprint)
      ].join("::")
    );
  }

  function createSelectionSnapshot(item, archiveFingerprint) {
    if (
      !item ||
      ["short-candidate", "supercut-bundle", "episode-resurfacing"].indexOf(item.kind) < 0
    ) {
      return null;
    }
    var clips = flattenSelections(item);
    if (!clips.length || clips.length > 24) return null;
    var id = clean(item.id);
    var snapshot = {
      schema: "shokker.creator-selection/v1",
      id: id,
      baseId: id.indexOf(":filter:") >= 0 ? id.split(":filter:")[0] : id,
      kind: item.kind,
      title:
        item.kind === "short-candidate"
          ? clean(item.editorial && item.editorial.titleOptions && item.editorial.titleOptions[0])
          : clean(item.title),
      receiptIds: clips.map(function (clip) {
        return clip.receiptId;
      }),
      sourceIds: unique(clips.map(function (clip) {
        return clip.sourceId;
      })),
      archiveFingerprint: clean(archiveFingerprint)
    };
    snapshot.proofFingerprint = selectionSnapshotFingerprint(snapshot);
    return snapshot;
  }

  function sameValues(left, right) {
    var a = array(left);
    var b = array(right);
    return a.length === b.length && a.every(function (value, index) {
      return value === b[index];
    });
  }

  function manifestClip(candidate, index) {
    var excerpt = boundedExcerpt(
      candidate.archivalExcerpt,
      PUBLIC_EXCERPT_WORD_LIMIT
    );
    return {
      order: index + 1,
      clipId: "clip:" + fingerprint(candidate.receiptId + "|" + candidate.editWindow.in + "|" + candidate.editWindow.out),
      receiptId: candidate.receiptId,
      sourceId: candidate.sourceId,
      sourceType: candidate.sourceType,
      sourceTitle: candidate.sourceTitle,
      sourceDate: candidate.sourceDate,
      sourceUrl: candidate.sourceUrl,
      sourceAtReceipt: candidate.receiptUrl,
      receiptAt: candidate.receiptAt,
      receiptTimecode: candidate.timecode,
      suggestedIn: candidate.editWindow.in,
      suggestedOut: candidate.editWindow.out,
      suggestedDuration: candidate.editWindow.seconds,
      boundaryStatus: candidate.editWindow.status,
      archivalExcerpt: excerpt.text,
      excerptTruncated: excerpt.truncated,
      originalExcerptWordCount: excerpt.originalWordCount,
      publicExcerptWordLimit: excerpt.publicWordLimit,
      excerptLabel: candidate.excerptLabel,
      category: candidate.category,
      topics: candidate.topics,
      characters: candidate.characters,
      speaker: candidate.speaker,
      editorialCopy: candidate.editorial,
      evidence: candidate.evidence,
      risk: candidate.risk,
      approval: candidate.approval,
      mediaIncluded: false,
      mediaInstruction:
        "Open the linked original source. This manifest stores edit decisions and evidence, never copied media."
    };
  }

  function createManifest(selection, options) {
    var settings = options || {};
    var clips = flattenSelections(selection);
    var manifestClips = clips.map(manifestClip);
    var receiptIds = manifestClips.map(function (clip) {
      return clip.receiptId;
    });
    var sourceIds = unique(manifestClips.map(function (clip) {
      return clip.sourceId;
    }));
    var snapshotDate = stableSort(
      manifestClips.map(function (clip) {
        return clip.sourceDate;
      }).filter(Boolean),
      function (a, b) {
        return clean(b).localeCompare(clean(a));
      }
    )[0] || "";
    var holdCount = manifestClips.filter(function (clip) {
      return clip.risk.label === "HOLD";
    }).length;
    var reviewCount = manifestClips.filter(function (clip) {
      return clip.approval.humanReviewRequired;
    }).length;
    var identity = [
      clean(settings.campaignId || settings.name || "creator-clip-lab"),
      receiptIds.join("|")
    ].join("|");
    return {
      schema: "shokker.creator-clip-manifest/v1",
      manifestId: "manifest:" + fingerprint(identity),
      campaignId: clean(settings.campaignId),
      name: clean(settings.name || "WWAM Creator Clip Lab export"),
      sourceSnapshotDate: snapshotDate,
      deterministicFingerprint: fingerprint(identity),
      clipCount: manifestClips.length,
      sourceCount: sourceIds.length,
      suggestedRuntimeSeconds: manifestClips.reduce(function (sum, clip) {
        return sum + number(clip.suggestedDuration);
      }, 0),
      receiptIds: receiptIds,
      sourceIds: sourceIds,
      publicExcerptWordLimit: PUBLIC_EXCERPT_WORD_LIMIT,
      clips: manifestClips,
      approvalGate: {
        status: holdCount ? "HOLD ITEMS PRESENT" : "HUMAN EDIT REVIEW REQUIRED",
        humanReviewCount: reviewCount,
        holdCount: holdCount,
        requiredBeforePublish: [
          "Watch surrounding source context for every clip.",
          "Set final in/out points by ear and picture.",
          "Verify any on-screen speaker credit manually.",
          "Apply platform-specific language and rights review.",
          "Keep suggested copy visually distinct from archival captions."
        ]
      },
      rightsAndAccuracy:
        "This is a provenance-rich editorial plan, not downloaded media, rights clearance, or permission to misrepresent a source."
    };
  }

  function deterministicPick(values, count, sourceDiversity) {
    var limit = Math.max(0, Math.floor(number(count)));
    if (!sourceDiversity) return array(values).slice(0, limit);
    return sourceDiverse(values, limit);
  }

  function configuredCount(value, fallback) {
    if (value == null || value === "") return fallback;
    return Math.max(0, Math.floor(number(value)));
  }

  function approvalBoard(clips) {
    var groups = {
      evidenceReady: [],
      fastReview: [],
      contextReview: [],
      hold: []
    };
    array(clips).forEach(function (clip) {
      if (clip.risk.label === "HOLD") groups.hold.push(clip.id);
      else if (clip.approval.status.indexOf("EVIDENCE READY") === 0) groups.evidenceReady.push(clip.id);
      else if (clip.approval.status === "FAST REVIEW") groups.fastReview.push(clip.id);
      else groups.contextReview.push(clip.id);
    });
    return groups;
  }

  function buildCampaign(lab, options) {
    var settings = options || {};
    var filters = {
      topic: settings.topic,
      character: settings.character,
      category: settings.category,
      length: settings.length,
      sourceType: settings.sourceType,
      evidence: settings.evidence,
      maxRisk: settings.maxRisk || "HIGH",
      minPriority: settings.minPriority,
      query: settings.query
    };
    var shorts = deterministicPick(
      lab.getShorts(filters),
      configuredCount(settings.shortCount, 4),
      true
    );
    var supercuts = lab
      .getSupercuts(filters)
      .slice(0, configuredCount(settings.supercutCount, 1));
    var resurfacing = lab.getResurfacing(filters).slice(
      0,
      configuredCount(settings.resurfaceCount, 2)
    );
    var theme =
      clean(settings.theme) ||
      clean(settings.character) ||
      clean(settings.topic) ||
      clean(settings.category) ||
      "Archive Aftershock";
    var selection = shorts.concat(supercuts, resurfacing);
    var campaignSeed = [
      normalized(theme),
      shorts.map(function (item) {
        return item.id;
      }).join("|"),
      supercuts.map(function (item) {
        return item.id;
      }).join("|"),
      resurfacing.map(function (item) {
        return item.id;
      }).join("|")
    ].join("::");
    var campaignId = "campaign:" + fingerprint(campaignSeed);
    var manifest = createManifest(selection, {
      campaignId: campaignId,
      name: "WWAM After Midnight — " + theme
    });
    var clips = flattenSelections(selection);
    var proofReceipts = unique(clips.map(function (item) {
      return item.receiptId;
    }));
    var proofSources = unique(clips.map(function (item) {
      return item.sourceId;
    }));
    var releasePlan = [];
    shorts.forEach(function (item, index) {
      releasePlan.push({
        order: releasePlan.length + 1,
        lane: index === 0 ? "COLD OPEN SHORT" : "FOLLOW-UP SHORT",
        assetId: item.id,
        suggestedCopy: item.editorial.titleOptions[index % item.editorial.titleOptions.length],
        copyLabel: EDITORIAL_LABEL,
        proofReceiptId: item.receiptId
      });
    });
    supercuts.forEach(function (item) {
      releasePlan.push({
        order: releasePlan.length + 1,
        lane: "ANCHOR SUPERCUT",
        assetId: item.id,
        suggestedCopy: item.title,
        copyLabel: EDITORIAL_LABEL,
        proofReceiptIds: item.receiptIds
      });
    });
    resurfacing.forEach(function (item) {
      releasePlan.push({
        order: releasePlan.length + 1,
        lane: "ARCHIVE RESURFACE",
        assetId: item.id,
        suggestedCopy: item.title,
        copyLabel: EDITORIAL_LABEL,
        proofReceiptIds: item.receiptIds
      });
    });
    return {
      schema: "shokker.creator-campaign-packet/v1",
      id: campaignId,
      deterministicFingerprint: fingerprint(campaignSeed),
      theme: theme,
      title: "WWAM AFTER MIDNIGHT: " + theme.toUpperCase() + " EVIDENCE DROP",
      titleLabel: EDITORIAL_LABEL,
      brief: {
        promise:
          proofReceipts.length +
          " playable receipts across " +
          proofSources.length +
          " original sources — every joke package can show its work.",
        editorialAngle:
          "Lead with the strongest self-contained receipt, deepen with a source-diverse supercut, then reconnect the current audience to an older source.",
        accuracyBoundary:
          "The packet packages indexed evidence. It does not claim virality, identify unknown speakers, certify rights, or convert promotional copy into quotes."
      },
      filters: filters,
      assets: {
        shorts: shorts,
        supercuts: supercuts,
        resurfacing: resurfacing
      },
      releasePlan: releasePlan,
      proofLedger: {
        receiptCount: proofReceipts.length,
        sourceCount: proofSources.length,
        receiptIds: proofReceipts,
        sourceIds: proofSources,
        allClipsTimestamped: clips.every(function (item) {
          return Number.isFinite(Number(item.receiptAt)) && /^https:\/\/www\.youtube\.com\/watch\?v=/.test(item.receiptUrl);
        }),
        unknownSpeakersNamed: clips.filter(function (item) {
          return item.speaker.display && !item.speaker.creditAllowed;
        }).length
      },
      approvalBoard: approvalBoard(clips),
      manifest: manifest,
      exportNote:
        "The embedded manifest is deterministic: the same archive and filters return the same campaign and clip order."
    };
  }

  function facetCounts(shorts, accessor) {
    var counts = new Map();
    shorts.forEach(function (candidate) {
      unique(accessor(candidate)).forEach(function (value) {
        counts.set(value, number(counts.get(value)) + 1);
      });
    });
    return stableSort(
      Array.from(counts.entries()).map(function (entry) {
        return { value: entry[0], count: entry[1] };
      }),
      function (a, b) {
        return b.count - a.count || clean(a.value).localeCompare(clean(b.value));
      }
    );
  }

  function create(input) {
    var showcase = resolveShowcase(input);
    var maps = sourceMaps(showcase);
    var shorts = stableSort(
      array(showcase.receipts).map(function (receipt) {
        return buildCandidate(receipt, maps);
      }).filter(Boolean),
      candidateCompare
    );
    var supercuts = buildSupercuts(shorts);
    var resurfacing = buildResurfacing(shorts);
    var lab = {
      version: VERSION,
      inputFingerprint:
        clean(showcase.inputFingerprint) ||
        fingerprint(
          array(showcase.sources).map(function (source) {
            return source.id;
          }).join("|") +
          "::" +
          array(showcase.receipts).map(function (receipt) {
            return receipt.id;
          }).join("|")
        ),
      policy: {
        editorialCopyLabel: EDITORIAL_LABEL,
        archivalExcerptLabel: EXCERPT_LABEL,
        editBoundaryLabel: BOUNDARY_LABEL,
        speakerPolicy:
          "Never infer a clip speaker from auto-captions. Owner-mapped recurring performers travel as separate context and never authorize on-screen speaker credit.",
        originPolicy:
          "Earliest indexed receipt is not advertised as first-ever without creator certification.",
        rightsPolicy:
          "The lab exports source-linked edit decisions, not media files or rights clearance."
      },
      metrics: {
        sourceReceipts: array(showcase.receipts).length,
        shortCandidates: shorts.length,
        supercutBundles: supercuts.length,
        resurfacingOpportunities: resurfacing.length,
        highConfidenceShorts: shorts.filter(function (item) {
          return item.evidence.label === "HIGH";
        }).length,
        lowRiskShorts: shorts.filter(function (item) {
          return item.risk.label === "LOW";
        }).length,
        holds: shorts.filter(function (item) {
          return item.risk.label === "HOLD";
        }).length,
        sourcesRepresented: new Set(shorts.map(function (item) {
          return item.sourceId;
        })).size,
        timestamped: shorts.filter(function (item) {
          return Number.isFinite(Number(item.receiptAt)) && Boolean(item.receiptUrl);
        }).length
      },
      facets: {
        topics: facetCounts(shorts, function (candidate) {
          return candidate.topics.map(function (item) {
            return item.label;
          });
        }),
        characters: facetCounts(shorts, function (candidate) {
          return candidate.characters.map(function (item) {
            return item.label;
          });
        }),
        categories: facetCounts(shorts, function (candidate) {
          return [candidate.category];
        }),
        risk: facetCounts(shorts, function (candidate) {
          return [candidate.risk.label];
        }),
        evidence: facetCounts(shorts, function (candidate) {
          return [candidate.evidence.evidenceLevel];
        }),
        length: facetCounts(shorts, function (candidate) {
          var seconds = candidate.editWindow.seconds;
          return [seconds <= 30 ? "UNDER 30" : seconds <= 45 ? "30–45" : "45–60"];
        })
      },
      shorts: shorts,
      supercuts: supercuts,
      resurfacing: resurfacing
    };
    var byId = new Map();
    shorts.concat(supercuts, resurfacing).forEach(function (item) {
      byId.set(item.id, item);
    });
    var byReceipt = new Map(shorts.map(function (item) {
      return [item.receiptId, item];
    }));
    lab.getShorts = function (filters) {
      return limitValues(shorts.filter(function (candidate) {
        return matchesCandidate(candidate, filters);
      }), filters);
    };
    lab.getSupercuts = function (filters) {
      return limitValues(
        supercuts
          .filter(function (item) {
            return matchesPackage(item, filters);
          })
          .map(function (item) {
            return filteredSupercut(item, filters);
          })
          .filter(Boolean),
        filters
      );
    };
    lab.getResurfacing = function (filters) {
      return limitValues(
        resurfacing
          .filter(function (item) {
            return matchesPackage(item, filters);
          })
          .map(function (item) {
            return filteredResurfacing(item, filters);
          })
          .filter(Boolean),
        filters
      );
    };
    lab.get = function (id) {
      return byId.get(clean(id)) || null;
    };
    lab.fromReceipt = function (receiptId) {
      return byReceipt.get(clean(receiptId)) || null;
    };
    lab.snapshotSelection = function (item) {
      var selection = typeof item === "string" ? byId.get(clean(item)) : item;
      return createSelectionSnapshot(selection, lab.inputFingerprint);
    };
    lab.restoreSelection = function (snapshot) {
      if (
        !snapshot ||
        snapshot.schema !== "shokker.creator-selection/v1" ||
        !clean(snapshot.id) ||
        !clean(snapshot.baseId) ||
        array(snapshot.receiptIds).length < 1 ||
        array(snapshot.receiptIds).length > 24 ||
        !sameValues(snapshot.receiptIds, unique(snapshot.receiptIds)) ||
        clean(snapshot.proofFingerprint) !== selectionSnapshotFingerprint(snapshot)
      ) {
        return null;
      }
      var candidates = snapshot.receiptIds.map(function (receiptId) {
        return byReceipt.get(clean(receiptId));
      });
      if (candidates.some(function (candidate) {
        return !candidate;
      })) {
        return null;
      }
      var actualSourceIds = unique(candidates.map(function (candidate) {
        return candidate.sourceId;
      }));
      if (!sameValues(snapshot.sourceIds, actualSourceIds)) return null;

      if (snapshot.kind === "short-candidate") {
        if (
          candidates.length !== 1 ||
          candidates[0].id !== snapshot.baseId ||
          snapshot.id !== snapshot.baseId
        ) {
          return null;
        }
        return candidates[0];
      }

      var base = byId.get(clean(snapshot.baseId));
      if (!base || base.kind !== snapshot.kind) return null;
      if (snapshot.kind === "supercut-bundle") {
        var allowedReceipts = new Set(base.receiptIds);
        if (candidates.some(function (candidate) {
          return !allowedReceipts.has(candidate.receiptId);
        })) {
          return null;
        }
        var restored = rebuildSupercut(
          base,
          candidates,
          snapshot.id,
          "Restored from the campaign's exact saved receipt ledger; no base-bundle receipts were added.",
          true
        );
        if (!restored || !sameValues(restored.receiptIds, snapshot.receiptIds)) return null;
        return restored;
      }
      if (snapshot.kind === "episode-resurfacing") {
        if (!sameValues(base.receiptIds, snapshot.receiptIds)) return null;
        return Object.assign({}, base, { id: snapshot.id });
      }
      return null;
    };
    lab.explain = function (id) {
      var item = byId.get(clean(id));
      if (!item) return null;
      if (item.kind === "short-candidate") {
        return {
          id: item.id,
          score: item.editPriority,
          scoreBreakdown: item.scoreBreakdown,
          evidence: item.evidence,
          risk: item.risk,
          approval: item.approval,
          proof: item.provenance
        };
      }
      return {
        id: item.id,
        score: item.editPriority || item.resurfaceScore,
        evidence: item.evidence,
        risk: item.risk,
        receiptIds: item.receiptIds,
        claimBoundary: item.claimBoundary || item.editNote
      };
    };
    lab.createClipManifest = function (selection, options) {
      return createManifest(selection, options);
    };
    lab.exportManifest = function (manifest, indentation) {
      return JSON.stringify(manifest, null, indentation == null ? 2 : indentation);
    };
    lab.buildCampaignPacket = function (options) {
      return buildCampaign(lab, options);
    };
    return lab;
  }

  root.WWAMCreatorClipLab = Object.freeze({
    VERSION: VERSION,
    create: create,
    formatTime: formatTime,
    labels: Object.freeze({
      editorial: EDITORIAL_LABEL,
      archivalExcerpt: EXCERPT_LABEL,
      editBoundary: BOUNDARY_LABEL,
      publicExcerptWordLimit: PUBLIC_EXCERPT_WORD_LIMIT
    })
  });
})(typeof window !== "undefined" ? window : globalThis);
