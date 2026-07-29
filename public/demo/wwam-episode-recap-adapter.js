(function (root) {
  "use strict";

  var SCHEMA = "wwam-feldman-recap/v1";
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

  function hash(value) {
    var text = clean(value);
    var output = 2166136261;
    for (var index = 0; index < text.length; index += 1) {
      output ^= text.charCodeAt(index);
      output = Math.imul(output, 16777619);
    }
    return output >>> 0;
  }

  function choice(seed, values) {
    return values[hash(seed) % values.length];
  }

  function clock(seconds) {
    var total = Math.max(0, Math.round(number(seconds)));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var remainder = total % 60;
    return (hours ? hours + ":" + String(minutes).padStart(2, "0") : String(minutes)) +
      ":" + String(remainder).padStart(2, "0");
  }

  function runtime(seconds) {
    var minutes = Math.max(1, Math.round(number(seconds) / 60));
    var hours = Math.floor(minutes / 60);
    var remainder = minutes % 60;
    return hours ? hours + " hr" + (remainder ? " " + remainder + " min" : "") :
      minutes + " min";
  }

  function list(values, fallback) {
    var unique = [];
    array(values).map(clean).filter(Boolean).forEach(function (value) {
      if (unique.indexOf(value) < 0) unique.push(value);
    });
    if (!unique.length) return fallback !== undefined ? clean(fallback) : "the registered tape";
    if (unique.length === 1) return unique[0];
    if (unique.length === 2) return unique[0] + " and " + unique[1];
    return unique.slice(0, -1).join(", ") + ", and " + unique[unique.length - 1];
  }

  function titleCase(value) {
    return clean(value).toLowerCase().replace(/\b[a-z]/g, function (letter) {
      return letter.toUpperCase();
    });
  }

  function displayLabel(value) {
    return clean(value)
      .replace(/^(?:TOPIC|CHARACTER PERFORMANCE|CHARACTER|MOMENT)\s*:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function displayLabels(values) {
    return array(values).map(displayLabel).filter(Boolean);
  }

  function formatNoun(format) {
    var id = clean(format.id);
    if (id === "movie-commentary") return "watchalong";
    if (id === "ranking-show") return "ranking night";
    if (id === "versus-show") return "fight card";
    if (id === "spoiler-party") return "spoiler court";
    if (id === "trailer-reaction") return "reaction stream";
    if (id === "script-reading") return "script room";
    if (id === "watch-party") return "watch party";
    if (id === "q-and-a") return "open-line Q + A";
    if (id === "interview") return "guest show";
    return "livestream";
  }

  function headline(map) {
    var topics = displayLabels(map.topics);
    if (topics.length >= 2) {
      return choice(map.sourceId + "|headline|two", [
        topics[0] + " WALKS IN. " + topics[1] + " LEAVES WITH THE KEYS.",
        topics[0] + " STARTS THE FIRE. " + topics[1] + " HIDES THE EXTINGUISHER.",
        topics[0] + " GETS THE MIC. " + topics[1] + " GETS NO ADULT SUPERVISION.",
        topics[0] + " OPENS THE TAPE. " + topics[1] + " KICKS IN THE WALL.",
      ]).toUpperCase();
    }
    if (topics.length === 1) return (topics[0] + " GETS THE WHOLE NIGHT.").toUpperCase();
    return "THE TAPE HAS ENTERED THE FELDMAN ZONE.";
  }

  function deck(map) {
    var topics = displayLabels(map.topics);
    var lead = list(topics.slice(0, 3), "the night's movie talk");
    return choice(map.sourceId + "|deck", [
      lead + " form the spine. The timestamps show where the wheels come off.",
      lead + " keep pulling the wheel while the tape collects evidence.",
      lead + " are on the slab. The rest is what happens after midnight.",
      lead + " provide the alibi. The source-linked cuts provide the damage.",
    ]);
  }

  function sectionLabel(section, index, total, sourceId) {
    var anchor = clean(section.anchor) || "THE TAPE";
    if (index === 0) return "COLD OPEN // " + anchor;
    if (index === total - 1) return "LAST CALL // " + anchor;
    var labels = [
      "THE TAPE PUTS ON LEATHER PANTS",
      "NO ADULT SUPERVISION",
      "THE NIGHT SHIFT GETS WEIRD",
      "THE VIDEO STORE LOSES POWER",
      "THE BIT ESCAPES CONTAINMENT",
    ];
    return choice(sourceId + "|section|" + section.id, labels) + " // " + anchor;
  }

  function sectionBody(section, sourceId) {
    if (clean(section.sourceBody)) return clean(section.sourceBody);
    var time = clock(section.at);
    var anchor = titleCase(displayLabel(section.anchor)) || "Saved Checkpoint";
    var topics = list(displayLabels(section.topicLabels), "");
    var characters = list(displayLabels(section.characterLabels), "");
    var detail = topics ? " Nearby, the map also catches " + topics + "." : "";
    if (characters) {
      detail += " A " + characters +
        " character signal appears in the same stretch; playback holds the performance credit.";
    }
    if (clean(section.category) === "topic") {
      return choice(sourceId + "|topic-body|" + section.id, [
        "At " + time + ", the conversation turns to " + anchor +
          ". The timestamp confirms the subject; playback carries the actual opinion.",
        anchor + " takes over at " + time +
          ". The archive marks the doorway and lets the tape do the talking.",
        "The next clean turn arrives at " + time + " with " + anchor +
          ". Jump there for the discussion instead of hunting through the full runtime.",
      ]) + detail;
    }
    return choice(sourceId + "|moment-body|" + section.id, [
      "At " + time + ", the saved energy spike is " + anchor +
        ". Hit play there for the delivery and the room around it.",
      "The tape spikes at " + time + " with " + anchor +
        ". The jump lands directly on the preserved moment.",
      anchor + " takes the wheel at " + time +
        ". One click puts the original delivery back in charge.",
      "By " + time + ", the tape has registered " + anchor +
        ". It is one of the episode's clearest saved turns.",
    ]) + detail;
  }

  function readyOverview(map) {
    var metadata = record(map.metadata);
    var noun = formatNoun(record(map.format));
    var topics = displayLabels(map.topics);
    var topicPhrase = list(topics.slice(0, 4), "the night's movie talk");
    var strongest = record(array(map.bestMoments)[0]);
    var sections = array(map.sections);
    var opening = metadata.title + " is a " + runtime(metadata.duration) + " " + noun +
      " whose source-local caption map keeps returning to " + topicPhrase + ".";
    var heat = clean(strongest.label) ?
      " The strongest saved temperature jump is " + titleCase(strongest.label) +
        " at " + clock(strongest.at) + "." : "";
    var route = sections.length ?
      " The episode now has a real route across " + sections.length +
        " chronological checkpoints, from " + titleCase(sections[0].anchor) +
        " to " + titleCase(sections[sections.length - 1].anchor) + "." : "";
    var firewall = " Every claim below stays tied to this upload; automatic captions do not name the speaker or invent a final verdict.";
    if (clean(map.guideOverview)) {
      return clean(map.guideOverview) + " " +
        choice(map.sourceId + "|guide-close", [
          "That is the Feldman file: a full-runtime read with every major turn wired back to the tape.",
          "In Feldman terms, the purple jacket is zipped and every chapter still has a receipt.",
          "The result is an episode story, not a random bucket of loud caption lines.",
        ]) + firewall;
    }
    return opening + heat + route +
      choice(map.sourceId + "|overview-color", [
        " In plain English, the show has a spine, a few hard left turns, and enough source-linked damage to justify the late fee.",
        " This is the one where the topic board keeps changing while the comedy alarm refuses to stay unplugged.",
        " The tape moves like a three-hour video-store conversation after somebody locked the front door.",
        " It starts as a show and gradually becomes evidence.",
      ]) + firewall;
  }

  function heldRecap(map) {
    var metadata = record(map.metadata);
    return {
      schema: SCHEMA,
      generatorVersion: VERSION,
      coreSchema: clean(map.schema),
      sourceId: map.sourceId,
      sourceFingerprint: map.sourceFingerprint,
      semanticFingerprint: map.semanticFingerprint,
      state: "held",
      tier: "source-safe-held",
      label: "EPISODE RECAP",
      badge: "RECAP WAITING ON THE TAPE",
      headline: "THE UPLOAD IS REAL. THE RECAP ISN'T READY TO LIE FOR IT.",
      deck: metadata.title + " is registered, playable, and waiting for source-local captions.",
      overview: "The official source record confirms a " + runtime(metadata.duration) +
        " upload dated " + clean(metadata.date) + ". The archive does not have a usable local caption map, so this file describes no scenes, jokes, reactions, speakers, topics, or verdicts. The paperwork is filed; the tape is still outside arguing with security.",
      sections: [],
      bestMoments: [],
      fanRead: {},
      coverage: map.coverage,
      format: map.format,
      limitations: map.limitations,
      approval: {
        meaning: "wwam-editorial-parody-label",
        actualApproval: false,
        disclosure: "A recurring-bit-inspired archive label, not an endorsement by Corey Feldman, Mike, J, or WWAM.",
      },
    };
  }

  function fanRead(map) {
    var specs = [
      ["loved", "WHAT THE TAPE DEFENDED"],
      ["hated", "STRAIGHT TO STEVE'S ASSHOLE"],
      ["wildestDetour", "WWAM UP IN YA"],
      ["lastWord", "THE LAST WORD"],
    ];
    return specs.reduce(function (output, spec) {
      var item = record(record(map.fanRead)[spec[0]]);
      if (!clean(item.receiptKey) && !clean(item.guideCutId)) return output;
      output[spec[0]] = {
        label: clean(item.label) || spec[1],
        topic: clean(item.topic) || clean(item.label) || spec[1],
        body: clean(item.body) || (
          spec[0] === "hated" ?
            "Steve gets the paperwork at " + clock(item.at) + "; the tape keeps the complaint attached." :
            spec[0] === "wildestDetour" ?
              "The episode leaves adult supervision at " + clock(item.at) + "." :
              spec[0] === "lastWord" ?
                "The final saved turn lands at " + clock(item.at) + "." :
                "The warmest preserved checkpoint lands at " + clock(item.at) + "."
        ),
        at: number(item.at),
        end: number(item.end),
        receiptKey: clean(item.receiptKey),
        guideCutId: clean(item.guideCutId),
        excerpt: clean(item.excerpt),
        evidenceBasis: clean(item.evidenceBasis),
      };
      return output;
    }, {});
  }

  function build(input) {
    input = record(input);
    var map = record(input.map || input.episodeRecap);
    if (clean(map.schema) !== "shokker-episode-recap/v1") {
      throw new Error("WWAM Episode Recap Adapter requires shokker-episode-recap/v1.");
    }
    if (clean(map.evidenceState) !== "ready") return heldRecap(map);
    var sections = array(map.sections).map(function (section, index, values) {
      return {
        id: clean(section.id),
        ordinal: index + 1,
        label: sectionLabel(section, index, values.length, map.sourceId),
        body: sectionBody(section, map.sourceId),
        at: number(section.at),
        end: number(section.end),
        anchor: clean(section.anchor),
        category: clean(section.category),
        excerpt: clean(section.excerpt),
        receiptKeys: array(section.receiptKeys).map(clean).filter(Boolean),
        guideCutId: clean(section.guideCutId),
        evidenceBasis: clean(section.evidenceBasis),
      };
    });
    var tierLabels = {
      "full-chronicle": "FULL CHRONICLE",
      "receipt-recap": "RECEIPT RECAP",
      "topic-recap": "TOPIC-TAPE RECAP",
    };
    return {
      schema: SCHEMA,
      generatorVersion: VERSION,
      coreSchema: clean(map.schema),
      sourceId: map.sourceId,
      sourceFingerprint: map.sourceFingerprint,
      semanticFingerprint: map.semanticFingerprint,
      state: "ready",
      tier: clean(map.mode),
      label: "WWAM FELDMAN APPROVED RECAP",
      badge: tierLabels[map.mode] || "SOURCE-LINKED RECAP",
      headline: headline(map),
      deck: deck(map),
      overview: readyOverview(map),
      sections: sections,
      bestMoments: array(map.bestMoments),
      fanRead: fanRead(map),
      coverage: map.coverage,
      format: map.format,
      limitations: map.limitations,
      approval: {
        meaning: "wwam-editorial-parody-label",
        actualApproval: false,
        disclosure: "A recurring-bit-inspired archive label, not an endorsement by Corey Feldman, Mike, J, or WWAM.",
      },
    };
  }

  root.WWAMEpisodeRecapAdapter = Object.freeze({
    SCHEMA: SCHEMA,
    VERSION: VERSION,
    build: build,
  });
}("undefined" !== typeof window ? window : globalThis));
