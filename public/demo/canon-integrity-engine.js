(function (root) {
  "use strict";

  var VERSION = "1.2.1";
  var DEFAULT_PUBLIC_EXCERPT_WORDS = 16;
  var OFFICIAL_WWAM_CHANNEL_ID = "UC6ieEOZW4iXV8TcILJI8k5g";
  var ALLOWED_EVIDENCE_LEVELS = new Set([
    "machine",
    "curated-candidate",
    "editor",
    "creator"
  ]);
  var CHARACTER_PATTERN_LEVELS = new Set([
    "curated-candidate",
    "editor",
    "creator"
  ]);
  var SUPPORTED_CHARACTER_ATTRIBUTIONS = new Set([
    "user-supplied",
    "owner-supplied",
    "creator-certified",
    "editor-verified"
  ]);
  var SEVERITY_ORDER = { error: 0, warning: 1 };

  var CHECK_DEFINITIONS = Object.freeze([
    Object.freeze({
      code: "INPUT_MISSING",
      description: "Required canon inputs must be present and structurally auditable."
    }),
    Object.freeze({
      code: "DUPLICATE_ID",
      description: "IDs must be unique inside every owning collection."
    }),
    Object.freeze({
      code: "INVALID_TIMESTAMP",
      description: "Playable timestamps and edit boundaries must be finite and non-negative."
    }),
    Object.freeze({
      code: "TIMESTAMP_OUT_OF_RANGE",
      description: "Playable timestamps must remain inside a known source duration."
    }),
    Object.freeze({
      code: "SOURCE_ID_MISSING",
      description: "Evidence records that require a source must carry a source ID."
    }),
    Object.freeze({
      code: "SOURCE_REFERENCE_ORPHAN",
      description: "Every source reference must resolve to the showcase registry or a strictly validated character-evidence source."
    }),
    Object.freeze({
      code: "SPEAKER_CLAIM_UNSUPPORTED",
      description: "A named speaker requires an explicit, human-grounded attribution contract."
    }),
    Object.freeze({
      code: "PUBLIC_EXCERPT_TOO_LONG",
      description: "Explicit public evidence excerpts must stay inside the public word limit."
    }),
    Object.freeze({
      code: "PUBLIC_COPY_MISLABELED",
      description: "Public copy must identify whether it is a caption, derived summary, or metadata."
    }),
    Object.freeze({
      code: "INTERNAL_EXCERPT_REQUIRES_BOUNDING",
      description: "Long internal receipt text must be bounded before reaching a public surface."
    }),
    Object.freeze({
      code: "EVIDENCE_LEVEL_CONTRADICTION",
      description: "Evidence labels and levels must agree across receipt, clip, and public-copy layers."
    }),
    Object.freeze({
      code: "GRAPH_NODE_ORPHAN",
      description: "Graph edges and constellations may reference only owned graph nodes or edges."
    }),
    Object.freeze({
      code: "GRAPH_RECEIPT_ORPHAN",
      description: "Graph, field-guide, and lineage receipt references must resolve."
    }),
    Object.freeze({
      code: "CAMPAIGN_ASSET_ORPHAN",
      description: "Campaign plans and approval lanes may reference only packaged assets."
    }),
    Object.freeze({
      code: "CAMPAIGN_RECEIPT_ORPHAN",
      description: "Campaign and manifest receipt references must resolve to showcase receipts."
    }),
    Object.freeze({
      code: "CAMPAIGN_SOURCE_ORPHAN",
      description: "Campaign and manifest source references must resolve to showcase sources."
    })
  ]);

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function clean(value) {
    return value == null ? "" : String(value).replace(/\s+/g, " ").trim();
  }

  function lower(value) {
    return clean(value).toLowerCase();
  }

  function certifiedSpeakerName(receipt) {
    return clean(object(receipt).certifiedSpeaker);
  }

  function speakerClaimsMatchCertification(
    receipt,
    speakerDisplay,
    speakerCredit
  ) {
    var certifiedSpeaker = certifiedSpeakerName(receipt);
    if (!certifiedSpeaker) return false;
    return [speakerDisplay, speakerCredit]
      .map(clean)
      .filter(Boolean)
      .every(function (claim) {
        return lower(claim) === lower(certifiedSpeaker);
      });
  }

  function words(value) {
    var body = clean(value);
    return body ? body.split(/\s+/).length : 0;
  }

  function finite(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback || 0;
  }

  function slug(value) {
    return lower(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function fingerprint(value) {
    var source = clean(value);
    var hash = 2166136261;
    for (var index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function stableValue(value) {
    if (Array.isArray(value)) {
      return value.map(stableValue);
    }
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce(function (result, key) {
          var nested = value[key];
          if (nested !== undefined && typeof nested !== "function") {
            result[key] = stableValue(nested);
          }
          return result;
        }, {});
    }
    return value;
  }

  function stableJson(value) {
    return JSON.stringify(stableValue(value));
  }

  function compareViolations(a, b) {
    return (
      number(SEVERITY_ORDER[a.severity], 9) -
        number(SEVERITY_ORDER[b.severity], 9) ||
      clean(a.code).localeCompare(clean(b.code)) ||
      clean(a.domain).localeCompare(clean(b.domain)) ||
      clean(a.path).localeCompare(clean(b.path)) ||
      clean(a.id).localeCompare(clean(b.id)) ||
      clean(a.message).localeCompare(clean(b.message))
    );
  }

  function normalizeOptions(input) {
    var options = object(input);
    return {
      catalog: options.catalog,
      deep: options.deep,
      live: options.live,
      popular: options.popular,
      dna: options.dna,
      characters: options.characters,
      showcase: options.showcase,
      lore: options.lore,
      clip: options.clip,
      campaigns: array(options.campaigns),
      manifests: array(options.manifests),
      publicCopy: array(options.publicCopy),
      publicExcerptWordLimit: Math.max(
        1,
        Math.floor(
          number(options.publicExcerptWordLimit, DEFAULT_PUBLIC_EXCERPT_WORDS)
        )
      )
    };
  }

  function createCollector() {
    var violations = [];
    var stats = new Map(
      CHECK_DEFINITIONS.map(function (definition) {
        return [
          definition.code,
          {
            code: definition.code,
            description: definition.description,
            scanned: 0,
            violations: 0,
            errors: 0,
            warnings: 0
          }
        ];
      })
    );

    function ensure(code) {
      if (!stats.has(code)) {
        stats.set(code, {
          code: code,
          description: "",
          scanned: 0,
          violations: 0,
          errors: 0,
          warnings: 0
        });
      }
      return stats.get(code);
    }

    function scan(code, count) {
      ensure(code).scanned += Math.max(0, number(count, 1));
    }

    function add(code, severity, domain, path, id, message, details) {
      var level = severity === "warning" ? "warning" : "error";
      var violation = {
        code: code,
        severity: level,
        domain: clean(domain),
        path: clean(path),
        id: clean(id),
        message: clean(message)
      };
      if (details && Object.keys(details).length) {
        violation.details = stableValue(details);
      }
      violations.push(violation);
      var stat = ensure(code);
      stat.violations += 1;
      stat[level === "error" ? "errors" : "warnings"] += 1;
    }

    return {
      violations: violations,
      stats: stats,
      scan: scan,
      error: function (code, domain, path, id, message, details) {
        add(code, "error", domain, path, id, message, details);
      },
      warning: function (code, domain, path, id, message, details) {
        add(code, "warning", domain, path, id, message, details);
      }
    };
  }

  function requireInput(collector, condition, path, expected) {
    collector.scan("INPUT_MISSING");
    if (!condition) {
      collector.error(
        "INPUT_MISSING",
        "input",
        path,
        path,
        "Required canon input is missing or has the wrong shape.",
        { expected: expected }
      );
    }
  }

  function checkInputs(options, collector) {
    requireInput(collector, Array.isArray(options.catalog), "catalog", "array");
    requireInput(
      collector,
      options.deep && typeof options.deep === "object",
      "deep",
      "object"
    );
    requireInput(
      collector,
      options.live && typeof options.live === "object",
      "live",
      "object or array"
    );
    requireInput(
      collector,
      options.popular && typeof options.popular === "object",
      "popular",
      "object or array"
    );
    requireInput(
      collector,
      options.characters &&
        typeof options.characters === "object" &&
        Array.isArray(options.characters.characters),
      "characters.characters",
      "array"
    );
    requireInput(
      collector,
      options.showcase &&
        typeof options.showcase === "object" &&
        Array.isArray(options.showcase.sources),
      "showcase.sources",
      "array"
    );
    requireInput(
      collector,
      options.showcase &&
        typeof options.showcase === "object" &&
        Array.isArray(options.showcase.receipts),
      "showcase.receipts",
      "array"
    );
    requireInput(
      collector,
      options.showcase &&
        options.showcase.memoryGraph &&
        Array.isArray(options.showcase.memoryGraph.nodes) &&
        Array.isArray(options.showcase.memoryGraph.edges),
      "showcase.memoryGraph",
      "{ nodes: [], edges: [] }"
    );
    requireInput(
      collector,
      options.lore &&
        typeof options.lore === "object" &&
        Array.isArray(options.lore.receipts),
      "lore.receipts",
      "array"
    );
    requireInput(
      collector,
      options.lore &&
        options.lore.galaxy &&
        Array.isArray(options.lore.galaxy.nodes) &&
        Array.isArray(options.lore.galaxy.edges),
      "lore.galaxy",
      "{ nodes: [], edges: [] }"
    );
    requireInput(
      collector,
      options.lore && Array.isArray(options.lore.fieldGuide),
      "lore.fieldGuide",
      "array"
    );
    requireInput(
      collector,
      options.clip &&
        typeof options.clip === "object" &&
        Array.isArray(options.clip.shorts),
      "clip.shorts",
      "array"
    );
    requireInput(
      collector,
      options.clip && Array.isArray(options.clip.supercuts),
      "clip.supercuts",
      "array"
    );
    requireInput(
      collector,
      options.clip && Array.isArray(options.clip.resurfacing),
      "clip.resurfacing",
      "array"
    );
  }

  function recordId(item) {
    return clean(item && (item.id || item.manifestId));
  }

  function checkDuplicateCollection(collector, domain, path, records) {
    var seen = new Map();
    array(records).forEach(function (record, index) {
      var id = recordId(record);
      collector.scan("DUPLICATE_ID");
      if (!id) {
        collector.error(
          "DUPLICATE_ID",
          domain,
          path + "[" + index + "].id",
          "",
          "Owned collection record has no ID."
        );
        return;
      }
      if (seen.has(id)) {
        collector.error(
          "DUPLICATE_ID",
          domain,
          path + "[" + index + "].id",
          id,
          "ID is duplicated inside its owning collection.",
          { firstIndex: seen.get(id), duplicateIndex: index }
        );
        return;
      }
      seen.set(id, index);
    });
  }

  function checkDuplicates(options, collector) {
    var showcase = object(options.showcase);
    var memoryGraph = object(showcase.memoryGraph);
    var lore = object(options.lore);
    var galaxy = object(lore.galaxy);
    var clip = object(options.clip);
    var characters = object(options.characters);

    [
      ["raw", "catalog", options.catalog],
      ["showcase", "showcase.sources", showcase.sources],
      ["showcase", "showcase.receipts", showcase.receipts],
      ["showcase", "showcase.memoryGraph.nodes", memoryGraph.nodes],
      ["showcase", "showcase.memoryGraph.edges", memoryGraph.edges],
      ["characters", "characters.characters", characters.characters],
      ["lore", "lore.receipts", lore.receipts],
      ["lore", "lore.fieldGuide", lore.fieldGuide],
      ["lore", "lore.galaxy.nodes", galaxy.nodes],
      ["lore", "lore.galaxy.edges", galaxy.edges],
      ["lore", "lore.galaxy.constellations", galaxy.constellations],
      ["lore", "lore.lineages", lore.lineages],
      ["clip", "clip.shorts", clip.shorts],
      ["clip", "clip.supercuts", clip.supercuts],
      ["clip", "clip.resurfacing", clip.resurfacing],
      ["campaign", "campaigns", options.campaigns],
      ["campaign", "manifests", options.manifests]
    ].forEach(function (entry) {
      checkDuplicateCollection(collector, entry[0], entry[1], entry[2]);
    });

    array(characters.characters).forEach(function (character, characterIndex) {
      checkDuplicateCollection(
        collector,
        "characters",
        "characters.characters[" + characterIndex + "].soundbytes",
        character.soundbytes
      );
    });
  }

  function youtubeIdFromUrl(value) {
    var match = clean(value).match(
      /(?:youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return match ? match[1] : "";
  }

  function validatedCharacterEvidenceSource(soundbyte) {
    var item = object(soundbyte);
    var sourceId = clean(item.sourceId);
    var playback = object(item.playback);
    var playability = object(item.playability);
    var provenance = object(item.provenance);
    var start = playback.start;
    var end = playback.end;
    var exactSourceUrl =
      youtubeIdFromUrl(item.url) === sourceId &&
      youtubeIdFromUrl(playback.embedUrl) === sourceId;
    var selection = lower(provenance.selection)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    var deterministicSelection =
      selection === "human curated seed with deterministic caption validation" ||
      selection === "editorially screened direct address seed";

    if (
      !/^[A-Za-z0-9_-]{11}$/.test(sourceId) ||
      clean(item.classification) !== "actual-character-performance" ||
      lower(playability.status) !== "eligible" ||
      lower(playability.provider) !== "youtube" ||
      lower(playability.metadataStatus) !== "official-public-cached" ||
      clean(provenance.channelId) !== OFFICIAL_WWAM_CHANNEL_ID ||
      lower(provenance.timestampStatus) !== "exact-caption-event" ||
      !deterministicSelection ||
      !exactSourceUrl ||
      lower(playback.provider) !== "youtube" ||
      !finite(item.t) ||
      !finite(start) ||
      Math.abs(start - item.t) > 0.02 ||
      !finite(end) ||
      end <= start ||
      end - start > 30.01 ||
      !clean(item.sourceTitle) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(clean(item.date)) ||
      !clean(item.excerpt) ||
      words(item.excerpt) > DEFAULT_PUBLIC_EXCERPT_WORDS
    ) {
      return null;
    }

    return {
      id: sourceId,
      type: clean(item.sourceType) || "livestream",
      title: clean(item.sourceTitle),
      date: clean(item.date),
      url: clean(item.url),
      duration: end,
      captioned: true,
      evidenceLane: "validated-character-performance"
    };
  }

  function sourceMaps(options) {
    var sources = array(object(options.showcase).sources);
    var byId = new Map();
    sources.forEach(function (source) {
      var id = clean(source && source.id);
      if (id && !byId.has(id)) byId.set(id, source);
    });
    var characterEvidenceSources = [];
    array(object(options.characters).characters).forEach(function (character) {
      array(character && character.soundbytes).forEach(function (soundbyte) {
        var source = validatedCharacterEvidenceSource(soundbyte);
        if (!source) return;
        var existing = byId.get(source.id);
        if (existing) {
          if (
            existing.evidenceLane === "validated-character-performance" &&
            source.duration > existing.duration
          ) {
            existing.duration = source.duration;
          }
          return;
        }
        byId.set(source.id, source);
        characterEvidenceSources.push(source);
      });
    });
    return {
      sources: sources,
      characterEvidenceSources: characterEvidenceSources,
      byId: byId
    };
  }

  function receiptMaps(options) {
    var showcaseReceipts = array(object(options.showcase).receipts);
    var loreReceipts = array(object(options.lore).receipts);
    return {
      showcase: new Map(
        showcaseReceipts
          .map(function (receipt) {
            return [clean(receipt && receipt.id), receipt];
          })
          .filter(function (entry) {
            return Boolean(entry[0]);
          })
      ),
      lore: new Map(
        loreReceipts
          .map(function (receipt) {
            return [clean(receipt && receipt.id), receipt];
          })
          .filter(function (entry) {
            return Boolean(entry[0]);
          })
      )
    };
  }

  function checkSourceReference(
    collector,
    sourceById,
    domain,
    path,
    ownerId,
    sourceId
  ) {
    var id = clean(sourceId);
    collector.scan("SOURCE_ID_MISSING");
    collector.scan("SOURCE_REFERENCE_ORPHAN");
    if (!id) {
      collector.error(
        "SOURCE_ID_MISSING",
        domain,
        path,
        ownerId,
        "Evidence record is missing its required source ID."
      );
      return;
    }
    if (!sourceById.has(id)) {
      collector.error(
        "SOURCE_REFERENCE_ORPHAN",
        domain,
        path,
        ownerId,
        "Source reference does not resolve to showcase.sources or the validated character-evidence lane.",
        { sourceId: id }
      );
    }
  }

  function checkTimestamp(
    collector,
    sourceById,
    domain,
    path,
    ownerId,
    sourceId,
    value,
    options
  ) {
    var settings = options || {};
    collector.scan("INVALID_TIMESTAMP");
    if (!finite(value) || value < 0) {
      collector.error(
        "INVALID_TIMESTAMP",
        domain,
        path,
        ownerId,
        "Timestamp must be a finite, non-negative number.",
        { value: value == null ? null : String(value) }
      );
      return;
    }
    if (settings.skipRange) return;
    var source = sourceById.get(clean(sourceId));
    var duration = source && source.duration;
    collector.scan("TIMESTAMP_OUT_OF_RANGE");
    if (finite(duration) && duration > 0 && value > duration + 1) {
      collector.error(
        "TIMESTAMP_OUT_OF_RANGE",
        domain,
        path,
        ownerId,
        "Timestamp exceeds the known source duration.",
        { timestamp: value, duration: duration, sourceId: clean(sourceId) }
      );
    }
  }

  function checkEvidenceLevel(collector, receipt, domain, path) {
    var id = recordId(receipt);
    var level = lower(receipt && receipt.evidenceLevel);
    collector.scan("EVIDENCE_LEVEL_CONTRADICTION");
    if (!ALLOWED_EVIDENCE_LEVELS.has(level)) {
      collector.error(
        "EVIDENCE_LEVEL_CONTRADICTION",
        domain,
        path + ".evidenceLevel",
        id,
        "Receipt uses an unknown or missing evidence level.",
        { evidenceLevel: level }
      );
      return;
    }
    if (
      receipt.type === "character-performance" &&
      !CHARACTER_PATTERN_LEVELS.has(level)
    ) {
      collector.error(
        "EVIDENCE_LEVEL_CONTRADICTION",
        domain,
        path + ".evidenceLevel",
        id,
        "Character-performance pattern evidence requires a curated-candidate, editor, or creator tier.",
        { evidenceLevel: level }
      );
    }
  }

  function checkShowcaseReceipts(options, collector, maps) {
    var mappedPerformers = new Map();
    function addMappedPerformer(character, performerValue) {
      var rawId = clean(character && character.id);
      var id =
        rawId.indexOf("character:") === 0
          ? "character:" + slug(rawId.slice("character:".length))
          : "character:" + slug(rawId);
      var performer = clean(performerValue);
      if (!id || id === "character:" || !performer) return;
      var existing = mappedPerformers.get(id);
      mappedPerformers.set(
        id,
        existing && lower(existing) !== lower(performer) ? "" : performer
      );
    }
    array(object(options.characters).characters).forEach(function (character) {
      addMappedPerformer(character, character && character.performedBy);
    });
    array(object(options.dna).characters).forEach(function (character) {
      addMappedPerformer(
        character,
        character && (character.performer || character.performedBy)
      );
    });
    array(object(options.showcase).receipts).forEach(function (receipt, index) {
      var id = recordId(receipt);
      var path = "showcase.receipts[" + index + "]";
      checkSourceReference(
        collector,
        maps.byId,
        "showcase",
        path + ".sourceId",
        id,
        receipt.sourceId
      );
      checkTimestamp(
        collector,
        maps.byId,
        "showcase",
        path + ".t",
        id,
        receipt.sourceId,
        receipt.t
      );
      checkEvidenceLevel(collector, receipt, "showcase", path);

      var count = words(receipt.excerpt);
      collector.scan("INTERNAL_EXCERPT_REQUIRES_BOUNDING");
      if (count > options.publicExcerptWordLimit) {
        collector.warning(
          "INTERNAL_EXCERPT_REQUIRES_BOUNDING",
          "showcase",
          path + ".excerpt",
          id,
          "Internal archival excerpt exceeds the public excerpt limit and must be bounded at presentation time.",
          {
            words: count,
            limit: options.publicExcerptWordLimit,
            publicSurface: false
          }
        );
      }

      var performer = clean(receipt.performer || receipt.speaker);
      var mappedPerformer = mappedPerformers.get(clean(receipt.characterId));
      if (performer) {
        collector.scan("SPEAKER_CLAIM_UNSUPPORTED");
        if (
          receipt.type !== "character-performance" ||
          !CHARACTER_PATTERN_LEVELS.has(lower(receipt.evidenceLevel)) ||
          !mappedPerformer ||
          lower(mappedPerformer) !== lower(performer)
        ) {
          collector.error(
            "SPEAKER_CLAIM_UNSUPPORTED",
            "showcase",
            path + ".performer",
            id,
            "Recurring performer mapping is not backed by the matching curated character profile.",
            {
              performer: performer,
              mappedPerformer: mappedPerformer || "",
              receiptType: clean(receipt.type),
              evidenceLevel: clean(receipt.evidenceLevel)
            }
          );
        }
      }

      var certifiedSpeaker = certifiedSpeakerName(receipt);
      if (certifiedSpeaker) {
        collector.scan("SPEAKER_CLAIM_UNSUPPORTED");
        if (
          receipt.type !== "character-performance" ||
          lower(receipt.evidenceLevel) !== "creator" ||
          receipt.authenticatedCreatorCertified !== true ||
          !performer ||
          lower(performer) !== lower(certifiedSpeaker) ||
          !mappedPerformer ||
          lower(mappedPerformer) !== lower(certifiedSpeaker)
        ) {
          collector.error(
            "SPEAKER_CLAIM_UNSUPPORTED",
            "showcase",
            path + ".certifiedSpeaker",
            id,
            "Receipt-level speaker certification is not bound to the authenticated creator decision and matching character performer.",
            {
              certifiedSpeaker: certifiedSpeaker,
              performer: performer,
              mappedPerformer: mappedPerformer || "",
              evidenceLevel: clean(receipt.evidenceLevel),
              authenticatedCreatorCertified:
                receipt.authenticatedCreatorCertified === true
            }
          );
        }
      }
    });
  }

  function expectedCharacterReceiptId(soundbyte) {
    if (clean(soundbyte && soundbyte.receiptId)) return clean(soundbyte.receiptId);
    return "character-receipt:" + slug(soundbyte && soundbyte.id);
  }

  function checkCharacters(options, collector, maps, receipts) {
    array(object(options.characters).characters).forEach(function (
      character,
      characterIndex
    ) {
      var characterId = clean(character.id);
      var characterPath = "characters.characters[" + characterIndex + "]";
      var performer = clean(character.performedBy);
      if (performer) {
        var attribution = object(character.hostAttribution);
        collector.scan("SPEAKER_CLAIM_UNSUPPORTED");
        if (
          !SUPPORTED_CHARACTER_ATTRIBUTIONS.has(lower(attribution.status)) ||
          !clean(attribution.basis)
        ) {
          collector.error(
            "SPEAKER_CLAIM_UNSUPPORTED",
            "characters",
            characterPath + ".performedBy",
            characterId,
            "Character performer mapping lacks an explicit owner, creator, or editor attribution basis.",
            {
              performer: performer,
              attributionStatus: clean(attribution.status)
            }
          );
        }
      }

      array(character.soundbytes).forEach(function (soundbyte, soundbyteIndex) {
        var soundbyteId = clean(soundbyte.id);
        var path =
          characterPath + ".soundbytes[" + soundbyteIndex + "]";
        checkSourceReference(
          collector,
          maps.byId,
          "characters",
          path + ".sourceId",
          soundbyteId,
          soundbyte.sourceId
        );
        checkTimestamp(
          collector,
          maps.byId,
          "characters",
          path + ".t",
          soundbyteId,
          soundbyte.sourceId,
          soundbyte.t
        );
        var receiptId = expectedCharacterReceiptId(soundbyte);
        var ownsValidatedEvidence = Boolean(
          validatedCharacterEvidenceSource(soundbyte)
        );
        collector.scan("GRAPH_RECEIPT_ORPHAN");
        if (!receipts.showcase.has(receiptId) && !ownsValidatedEvidence) {
          collector.error(
            "GRAPH_RECEIPT_ORPHAN",
            "characters",
            path + ".receiptId",
            soundbyteId,
            "Curated character soundbyte has neither a matching showcase receipt nor a strictly validated character-evidence receipt.",
            { receiptId: receiptId }
          );
        }
      });
    });
  }

  function checkLore(options, collector, maps, receipts) {
    var lore = object(options.lore);
    array(lore.receipts).forEach(function (receipt, index) {
      var id = recordId(receipt);
      var path = "lore.receipts[" + index + "]";
      checkSourceReference(
        collector,
        maps.byId,
        "lore",
        path + ".sourceId",
        id,
        receipt.sourceId
      );
      checkTimestamp(
        collector,
        maps.byId,
        "lore",
        path + ".t",
        id,
        receipt.sourceId,
        receipt.t
      );
      if (receipt.end != null) {
        checkTimestamp(
          collector,
          maps.byId,
          "lore",
          path + ".end",
          id,
          receipt.sourceId,
          receipt.end
        );
      }
      if (receipt.kind === "archive-source") {
        collector.scan("EVIDENCE_LEVEL_CONTRADICTION");
        if (!/derived/i.test(clean(receipt.provenance && receipt.provenance.basis))) {
          collector.error(
            "EVIDENCE_LEVEL_CONTRADICTION",
            "lore",
            path + ".provenance.basis",
            id,
            "Archive-source summary must declare that its prose is derived."
          );
        }
      }
    });

    array(lore.fieldGuide).forEach(function (entry, index) {
      var path = "lore.fieldGuide[" + index + "]";
      array(entry.receiptIds).forEach(function (receiptId, receiptIndex) {
        collector.scan("GRAPH_RECEIPT_ORPHAN");
        if (!receipts.lore.has(clean(receiptId))) {
          collector.error(
            "GRAPH_RECEIPT_ORPHAN",
            "lore",
            path + ".receiptIds[" + receiptIndex + "]",
            recordId(entry),
            "Field-guide receipt reference does not resolve.",
            { receiptId: clean(receiptId) }
          );
        }
      });
      if (entry.archiveFirst && entry.archiveFirst.receiptId) {
        collector.scan("GRAPH_RECEIPT_ORPHAN");
        if (!receipts.lore.has(clean(entry.archiveFirst.receiptId))) {
          collector.error(
            "GRAPH_RECEIPT_ORPHAN",
            "lore",
            path + ".archiveFirst.receiptId",
            recordId(entry),
            "Field-guide archive-first receipt does not resolve.",
            { receiptId: clean(entry.archiveFirst.receiptId) }
          );
        }
      }
    });

    array(lore.lineages).forEach(function (lineage, lineageIndex) {
      array(lineage.events).forEach(function (event, eventIndex) {
        var path =
          "lore.lineages[" +
          lineageIndex +
          "].events[" +
          eventIndex +
          "]";
        collector.scan("GRAPH_RECEIPT_ORPHAN");
        if (!receipts.lore.has(clean(event.receiptId))) {
          collector.error(
            "GRAPH_RECEIPT_ORPHAN",
            "lore",
            path + ".receiptId",
            recordId(lineage),
            "Lineage event receipt does not resolve.",
            { receiptId: clean(event.receiptId) }
          );
        }
        checkSourceReference(
          collector,
          maps.byId,
          "lore",
          path + ".sourceId",
          recordId(lineage),
          event.sourceId
        );
        checkTimestamp(
          collector,
          maps.byId,
          "lore",
          path + ".t",
          recordId(lineage),
          event.sourceId,
          event.t
        );
      });
    });
  }

  function checkGraph(
    collector,
    domain,
    path,
    graph,
    receiptIndex
  ) {
    var value = object(graph);
    var nodes = array(value.nodes);
    var edges = array(value.edges);
    var nodeIds = new Set(nodes.map(recordId).filter(Boolean));
    var edgeIds = new Set(edges.map(recordId).filter(Boolean));

    edges.forEach(function (edge, index) {
      var edgePath = path + ".edges[" + index + "]";
      [
        ["from", edge.from],
        ["to", edge.to]
      ].forEach(function (reference) {
        collector.scan("GRAPH_NODE_ORPHAN");
        if (!nodeIds.has(clean(reference[1]))) {
          collector.error(
            "GRAPH_NODE_ORPHAN",
            domain,
            edgePath + "." + reference[0],
            recordId(edge),
            "Graph edge endpoint does not resolve to a node.",
            { nodeId: clean(reference[1]) }
          );
        }
      });
      array(edge.receiptIds).forEach(function (receiptId, receiptIndexValue) {
        collector.scan("GRAPH_RECEIPT_ORPHAN");
        if (!receiptIndex.has(clean(receiptId))) {
          collector.error(
            "GRAPH_RECEIPT_ORPHAN",
            domain,
            edgePath + ".receiptIds[" + receiptIndexValue + "]",
            recordId(edge),
            "Graph edge receipt does not resolve.",
            { receiptId: clean(receiptId) }
          );
        }
      });
      if (edge.previewReceipt) {
        collector.scan("GRAPH_RECEIPT_ORPHAN");
        if (!receiptIndex.has(clean(edge.previewReceipt))) {
          collector.error(
            "GRAPH_RECEIPT_ORPHAN",
            domain,
            edgePath + ".previewReceipt",
            recordId(edge),
            "Graph preview receipt does not resolve.",
            { receiptId: clean(edge.previewReceipt) }
          );
        }
      }
    });

    array(value.constellations).forEach(function (constellation, index) {
      var constellationPath = path + ".constellations[" + index + "]";
      if (constellation.anchorNodeId) {
        collector.scan("GRAPH_NODE_ORPHAN");
        if (!nodeIds.has(clean(constellation.anchorNodeId))) {
          collector.error(
            "GRAPH_NODE_ORPHAN",
            domain,
            constellationPath + ".anchorNodeId",
            recordId(constellation),
            "Constellation anchor does not resolve to a graph node.",
            { nodeId: clean(constellation.anchorNodeId) }
          );
        }
      }
      array(constellation.nodeIds).forEach(function (nodeId, nodeIndex) {
        collector.scan("GRAPH_NODE_ORPHAN");
        if (!nodeIds.has(clean(nodeId))) {
          collector.error(
            "GRAPH_NODE_ORPHAN",
            domain,
            constellationPath + ".nodeIds[" + nodeIndex + "]",
            recordId(constellation),
            "Constellation node reference does not resolve.",
            { nodeId: clean(nodeId) }
          );
        }
      });
      array(constellation.edgeIds).forEach(function (edgeId, edgeIndex) {
        collector.scan("GRAPH_NODE_ORPHAN");
        if (!edgeIds.has(clean(edgeId))) {
          collector.error(
            "GRAPH_NODE_ORPHAN",
            domain,
            constellationPath + ".edgeIds[" + edgeIndex + "]",
            recordId(constellation),
            "Constellation edge reference does not resolve.",
            { edgeId: clean(edgeId) }
          );
        }
      });
      array(constellation.receiptIds).forEach(function (
        receiptId,
        receiptIndexValue
      ) {
        collector.scan("GRAPH_RECEIPT_ORPHAN");
        if (!receiptIndex.has(clean(receiptId))) {
          collector.error(
            "GRAPH_RECEIPT_ORPHAN",
            domain,
            constellationPath + ".receiptIds[" + receiptIndexValue + "]",
            recordId(constellation),
            "Constellation receipt reference does not resolve.",
            { receiptId: clean(receiptId) }
          );
        }
      });
    });
  }

  function checkClipCandidate(
    collector,
    maps,
    receipts,
    candidate,
    path,
    options
  ) {
    var id = recordId(candidate);
    var receiptId = clean(candidate.receiptId);
    var receipt = receipts.showcase.get(receiptId);
    checkSourceReference(
      collector,
      maps.byId,
      "clip",
      path + ".sourceId",
      id,
      candidate.sourceId
    );
    checkTimestamp(
      collector,
      maps.byId,
      "clip",
      path + ".receiptAt",
      id,
      candidate.sourceId,
      candidate.receiptAt
    );
    collector.scan("CAMPAIGN_RECEIPT_ORPHAN");
    if (!receipt) {
      collector.error(
        "CAMPAIGN_RECEIPT_ORPHAN",
        "clip",
        path + ".receiptId",
        id,
        "Clip candidate receipt does not resolve to showcase.receipts.",
        { receiptId: receiptId }
      );
    }

    var window = object(candidate.editWindow);
    ["in", "out"].forEach(function (field) {
      checkTimestamp(
        collector,
        maps.byId,
        "clip",
        path + ".editWindow." + field,
        id,
        candidate.sourceId,
        window[field]
      );
    });
    collector.scan("INVALID_TIMESTAMP");
    if (
      finite(window.in) &&
      finite(window.out) &&
      finite(candidate.receiptAt) &&
      (window.in > candidate.receiptAt ||
        window.out <= candidate.receiptAt ||
        window.out <= window.in)
    ) {
      collector.error(
        "INVALID_TIMESTAMP",
        "clip",
        path + ".editWindow",
        id,
        "Clip edit window does not contain its receipt timestamp.",
        {
          in: window.in,
          receiptAt: candidate.receiptAt,
          out: window.out
        }
      );
    }

    var receiptLevel = lower(receipt && receipt.evidenceLevel);
    var evidenceLevel = lower(candidate.evidence && candidate.evidence.evidenceLevel);
    var provenanceLevel = lower(
      candidate.provenance && candidate.provenance.evidenceLevel
    );
    collector.scan("EVIDENCE_LEVEL_CONTRADICTION", 3);
    if (
      !receipt ||
      !ALLOWED_EVIDENCE_LEVELS.has(evidenceLevel) ||
      !ALLOWED_EVIDENCE_LEVELS.has(provenanceLevel) ||
      receiptLevel !== evidenceLevel ||
      receiptLevel !== provenanceLevel
    ) {
      collector.error(
        "EVIDENCE_LEVEL_CONTRADICTION",
        "clip",
        path + ".evidence",
        id,
        "Clip evidence and provenance levels do not match the owning receipt.",
        {
          receiptLevel: receiptLevel,
          evidenceLevel: evidenceLevel,
          provenanceLevel: provenanceLevel
        }
      );
    }

    var speaker = object(candidate.speaker);
    var speakerDisplay = clean(speaker.display);
    var speakerCredit = clean(candidate.speakerCredit);
    var speakerName = speakerDisplay || speakerCredit;
    var certifiedSpeaker = certifiedSpeakerName(receipt);
    collector.scan("SPEAKER_CLAIM_UNSUPPORTED");
    if (!speakerName && speaker.creditAllowed === true) {
      collector.error(
        "SPEAKER_CLAIM_UNSUPPORTED",
        "clip",
        path + ".speaker",
        id,
        "Clip allows speaker credit without a named, supported speaker."
      );
    }
    if (speakerName) {
      var basis = clean(speaker.basis);
      var supportedBasis =
        /owner|creator|project-owner|user-supplied/i.test(basis) &&
        !/speaker-diarized|specific speaker verified/i.test(basis);
      if (
        speaker.creditAllowed !== true ||
        speaker.clipAttributionCertified !== true ||
        !receipt ||
        receipt.type !== "character-performance" ||
        receiptLevel !== "creator" ||
        receipt.authenticatedCreatorCertified !== true ||
        !speakerClaimsMatchCertification(
          receipt,
          speakerDisplay,
          speakerCredit
        ) ||
        !supportedBasis
      ) {
        collector.error(
          "SPEAKER_CLAIM_UNSUPPORTED",
          "clip",
          path + ".speaker",
          id,
          "Named clip speaker is not backed by the approved character-mapping contract.",
          {
            speaker: speakerName,
            creditAllowed: speaker.creditAllowed === true,
            receiptType: clean(receipt && receipt.type),
            evidenceLevel: receiptLevel,
            certifiedSpeaker: certifiedSpeaker,
            basis: basis
          }
        );
      }
    }

    collector.scan("INTERNAL_EXCERPT_REQUIRES_BOUNDING");
    if (words(candidate.archivalExcerpt) > options.publicExcerptWordLimit) {
      // The owning showcase receipt already carries the actionable warning.
      // This scan count proves that clip planning objects were checked without
      // double-reporting the same internal caption text.
    }
  }

  function checkClipPackages(options, collector, maps, receipts) {
    var clip = object(options.clip);
    var shortIds = new Set(array(clip.shorts).map(recordId).filter(Boolean));
    array(clip.shorts).forEach(function (candidate, index) {
      checkClipCandidate(
        collector,
        maps,
        receipts,
        candidate,
        "clip.shorts[" + index + "]",
        options
      );
    });

    array(clip.supercuts).forEach(function (bundle, bundleIndex) {
      array(bundle.receiptIds).forEach(function (receiptId, receiptIndex) {
        collector.scan("CAMPAIGN_RECEIPT_ORPHAN");
        if (!receipts.showcase.has(clean(receiptId))) {
          collector.error(
            "CAMPAIGN_RECEIPT_ORPHAN",
            "clip",
            "clip.supercuts[" +
              bundleIndex +
              "].receiptIds[" +
              receiptIndex +
              "]",
            recordId(bundle),
            "Supercut receipt does not resolve.",
            { receiptId: clean(receiptId) }
          );
        }
      });
      array(bundle.segments).forEach(function (segment, segmentIndex) {
        collector.scan("CAMPAIGN_ASSET_ORPHAN");
        if (!shortIds.has(recordId(segment))) {
          collector.error(
            "CAMPAIGN_ASSET_ORPHAN",
            "clip",
            "clip.supercuts[" +
              bundleIndex +
              "].segments[" +
              segmentIndex +
              "].id",
            recordId(bundle),
            "Supercut segment does not resolve to clip.shorts.",
            { assetId: recordId(segment) }
          );
        }
      });
    });

    array(clip.resurfacing).forEach(function (item, index) {
      ["archive", "current"].forEach(function (lane) {
        collector.scan("CAMPAIGN_ASSET_ORPHAN");
        if (!shortIds.has(recordId(item[lane]))) {
          collector.error(
            "CAMPAIGN_ASSET_ORPHAN",
            "clip",
            "clip.resurfacing[" + index + "]." + lane + ".id",
            recordId(item),
            "Resurfacing segment does not resolve to clip.shorts.",
            { assetId: recordId(item[lane]) }
          );
        }
      });
    });
  }

  function checkCampaignReceipt(
    collector,
    receipts,
    path,
    ownerId,
    receiptId
  ) {
    collector.scan("CAMPAIGN_RECEIPT_ORPHAN");
    if (!receipts.showcase.has(clean(receiptId))) {
      collector.error(
        "CAMPAIGN_RECEIPT_ORPHAN",
        "campaign",
        path,
        ownerId,
        "Campaign receipt reference does not resolve.",
        { receiptId: clean(receiptId) }
      );
    }
  }

  function checkCampaignSource(collector, maps, path, ownerId, sourceId) {
    collector.scan("CAMPAIGN_SOURCE_ORPHAN");
    if (!maps.byId.has(clean(sourceId))) {
      collector.error(
        "CAMPAIGN_SOURCE_ORPHAN",
        "campaign",
        path,
        ownerId,
        "Campaign source reference does not resolve.",
        { sourceId: clean(sourceId) }
      );
    }
  }

  function checkManifest(
    collector,
    maps,
    receipts,
    manifest,
    path,
    options
  ) {
    var id = recordId(manifest);
    collector.scan("PUBLIC_COPY_MISLABELED");
    if (
      manifest.publicExcerptWordLimit != null &&
      (!finite(manifest.publicExcerptWordLimit) ||
        manifest.publicExcerptWordLimit !== options.publicExcerptWordLimit)
    ) {
      collector.error(
        "PUBLIC_COPY_MISLABELED",
        "campaign",
        path + ".publicExcerptWordLimit",
        id,
        "Manifest public excerpt limit conflicts with canon policy.",
        {
          declaredLimit: manifest.publicExcerptWordLimit,
          policyLimit: options.publicExcerptWordLimit
        }
      );
    }
    array(manifest.receiptIds).forEach(function (receiptId, index) {
      checkCampaignReceipt(
        collector,
        receipts,
        path + ".receiptIds[" + index + "]",
        id,
        receiptId
      );
    });
    array(manifest.sourceIds).forEach(function (sourceId, index) {
      checkCampaignSource(
        collector,
        maps,
        path + ".sourceIds[" + index + "]",
        id,
        sourceId
      );
    });
    array(manifest.clips).forEach(function (clip, index) {
      var clipPath = path + ".clips[" + index + "]";
      var receipt = receipts.showcase.get(clean(clip.receiptId));
      checkCampaignReceipt(
        collector,
        receipts,
        clipPath + ".receiptId",
        clean(clip.clipId) || id,
        clip.receiptId
      );
      checkCampaignSource(
        collector,
        maps,
        clipPath + ".sourceId",
        clean(clip.clipId) || id,
        clip.sourceId
      );
      checkTimestamp(
        collector,
        maps.byId,
        "campaign",
        clipPath + ".receiptAt",
        clean(clip.clipId) || id,
        clip.sourceId,
        clip.receiptAt
      );
      checkExportExcerpt(
        collector,
        clip,
        clipPath + ".archivalExcerpt",
        clean(clip.clipId) || id,
        options
      );

      var speaker = object(clip.speaker);
      var speakerDisplay = clean(speaker.display);
      var speakerCredit = clean(clip.speakerCredit);
      var speakerName = speakerDisplay || speakerCredit;
      var certifiedSpeaker = certifiedSpeakerName(receipt);
      collector.scan("SPEAKER_CLAIM_UNSUPPORTED");
      if (speakerName) {
        var speakerBasis = clean(speaker.basis);
        if (
          speaker.creditAllowed !== true ||
          speaker.clipAttributionCertified !== true ||
          !receipt ||
          receipt.type !== "character-performance" ||
          lower(receipt.evidenceLevel) !== "creator" ||
          receipt.authenticatedCreatorCertified !== true ||
          !speakerClaimsMatchCertification(
            receipt,
            speakerDisplay,
            speakerCredit
          ) ||
          !/owner|creator|project-owner|user-supplied/i.test(speakerBasis) ||
          /speaker-diarized|specific speaker verified/i.test(speakerBasis)
        ) {
          collector.error(
            "SPEAKER_CLAIM_UNSUPPORTED",
            "campaign",
            clipPath + ".speaker",
            clean(clip.clipId) || id,
            "Exported manifest carries an unsupported speaker credit.",
            {
              speaker: speakerName,
              creditAllowed: speaker.creditAllowed === true,
              receiptType: clean(receipt && receipt.type),
              evidenceLevel: clean(receipt && receipt.evidenceLevel),
              certifiedSpeaker: certifiedSpeaker,
              basis: speakerBasis
            }
          );
        }
      }

      var exportEvidenceLevel = lower(
        clip.evidence && clip.evidence.evidenceLevel
      );
      collector.scan("EVIDENCE_LEVEL_CONTRADICTION");
      if (
        exportEvidenceLevel &&
        (!receipt ||
          !ALLOWED_EVIDENCE_LEVELS.has(exportEvidenceLevel) ||
          exportEvidenceLevel !== lower(receipt.evidenceLevel))
      ) {
        collector.error(
          "EVIDENCE_LEVEL_CONTRADICTION",
          "campaign",
          clipPath + ".evidence.evidenceLevel",
          clean(clip.clipId) || id,
          "Manifest evidence level conflicts with the owning receipt.",
          {
            receiptLevel: lower(receipt && receipt.evidenceLevel),
            manifestLevel: exportEvidenceLevel
          }
        );
      }
    });
  }

  function checkExportExcerpt(collector, item, path, ownerId, options) {
    var excerpt = clean(item && item.archivalExcerpt);
    var count = words(excerpt);
    collector.scan("PUBLIC_EXCERPT_TOO_LONG");
    if (count > options.publicExcerptWordLimit) {
      collector.error(
        "PUBLIC_EXCERPT_TOO_LONG",
        "campaign",
        path,
        ownerId,
        "Exported archival excerpt exceeds the public word limit.",
        { words: count, limit: options.publicExcerptWordLimit }
      );
    }

    var declaredLimit = item && item.publicExcerptWordLimit;
    var originalCount = item && item.originalExcerptWordCount;
    var truncated = item && item.excerptTruncated;
    collector.scan("PUBLIC_COPY_MISLABELED");
    if (
      declaredLimit != null &&
      (!finite(declaredLimit) || declaredLimit !== options.publicExcerptWordLimit)
    ) {
      collector.error(
        "PUBLIC_COPY_MISLABELED",
        "campaign",
        path.replace(/\.archivalExcerpt$/, ".publicExcerptWordLimit"),
        ownerId,
        "Exported excerpt declares a word limit that conflicts with canon policy.",
        {
          declaredLimit: declaredLimit,
          policyLimit: options.publicExcerptWordLimit
        }
      );
    }
    if (
      originalCount != null &&
      (!finite(originalCount) || originalCount < count)
    ) {
      collector.error(
        "PUBLIC_COPY_MISLABELED",
        "campaign",
        path.replace(/\.archivalExcerpt$/, ".originalExcerptWordCount"),
        ownerId,
        "Exported excerpt has impossible original-word-count metadata.",
        { originalExcerptWordCount: originalCount, exportedWords: count }
      );
    }
    if (
      truncated === true &&
      (!finite(originalCount) ||
        originalCount <= options.publicExcerptWordLimit ||
        count > options.publicExcerptWordLimit)
    ) {
      collector.error(
        "PUBLIC_COPY_MISLABELED",
        "campaign",
        path.replace(/\.archivalExcerpt$/, ".excerptTruncated"),
        ownerId,
        "Exported excerpt truncation flag is inconsistent with its word counts.",
        {
          excerptTruncated: true,
          originalExcerptWordCount: originalCount,
          exportedWords: count
        }
      );
    }
  }

  function checkColdOpenSlot(
    collector,
    maps,
    receipts,
    slot,
    path,
    ownerId,
    options,
    exported
  ) {
    if (!slot || slot.kind !== "source-clip") return;
    checkCampaignReceipt(
      collector,
      receipts,
      path + ".receiptId",
      ownerId,
      slot.receiptId
    );
    checkCampaignSource(
      collector,
      maps,
      path + ".sourceId",
      ownerId,
      slot.sourceId
    );
    checkTimestamp(
      collector,
      maps.byId,
      "campaign",
      path + ".receiptAt",
      ownerId,
      slot.sourceId,
      slot.receiptAt
    );
    if (slot.proposedSourceWindow) {
      ["in", "out"].forEach(function (field) {
        checkTimestamp(
          collector,
          maps.byId,
          "campaign",
          path + ".proposedSourceWindow." + field,
          ownerId,
          slot.sourceId,
          slot.proposedSourceWindow[field]
        );
      });
    }
    if (slot.proposedSourceIn != null) {
      checkTimestamp(
        collector,
        maps.byId,
        "campaign",
        path + ".proposedSourceIn",
        ownerId,
        slot.sourceId,
        slot.proposedSourceIn
      );
    }
    if (slot.proposedSourceOut != null) {
      checkTimestamp(
        collector,
        maps.byId,
        "campaign",
        path + ".proposedSourceOut",
        ownerId,
        slot.sourceId,
        slot.proposedSourceOut
      );
    }
    if (exported !== false) {
      checkExportExcerpt(
        collector,
        slot,
        path + ".archivalExcerpt",
        ownerId,
        options
      );
    }
    collector.scan("SPEAKER_CLAIM_UNSUPPORTED");
    if (clean(slot.speakerCredit)) {
      collector.error(
        "SPEAKER_CLAIM_UNSUPPORTED",
        "campaign",
        path + ".speakerCredit",
        ownerId,
        "Cold Open exports may not assign a clip-level speaker.",
        { speakerCredit: clean(slot.speakerCredit) }
      );
    }
  }

  function checkColdOpenCampaign(
    collector,
    maps,
    receipts,
    campaign,
    path,
    options
  ) {
    var id = recordId(campaign);
    var storyboards = array(campaign.storyboards);
    checkDuplicateCollection(
      collector,
      "campaign",
      path + ".storyboards",
      storyboards
    );
    var storyboardIds = new Set(storyboards.map(recordId).filter(Boolean));
    array(campaign.storyboardIds).forEach(function (storyboardId, index) {
      collector.scan("CAMPAIGN_ASSET_ORPHAN");
      if (!storyboardIds.has(clean(storyboardId))) {
        collector.error(
          "CAMPAIGN_ASSET_ORPHAN",
          "campaign",
          path + ".storyboardIds[" + index + "]",
          id,
          "Cold Open campaign storyboard ID does not resolve.",
          { assetId: clean(storyboardId) }
        );
      }
    });

    storyboards.forEach(function (storyboard, storyboardIndex) {
      var storyboardPath = path + ".storyboards[" + storyboardIndex + "]";
      var storyboardId = recordId(storyboard);
      array(storyboard.receiptIds).forEach(function (receiptId, index) {
        checkCampaignReceipt(
          collector,
          receipts,
          storyboardPath + ".receiptIds[" + index + "]",
          storyboardId,
          receiptId
        );
      });
      array(storyboard.sourceIds).forEach(function (sourceId, index) {
        checkCampaignSource(
          collector,
          maps,
          storyboardPath + ".sourceIds[" + index + "]",
          storyboardId,
          sourceId
        );
      });
      array(storyboard.slots).forEach(function (slot, slotIndex) {
        checkColdOpenSlot(
          collector,
          maps,
          receipts,
          slot,
          storyboardPath + ".slots[" + slotIndex + "]",
          storyboardId,
          options,
          true
        );
      });
    });

    array(campaign.editDecisionList).forEach(function (slot, index) {
      checkColdOpenSlot(
        collector,
        maps,
        receipts,
        slot,
        path + ".editDecisionList[" + index + "]",
        id,
        options,
        true
      );
    });

    var ledger = object(campaign.proofLedger);
    array(ledger.receiptIds).forEach(function (receiptId, index) {
      checkCampaignReceipt(
        collector,
        receipts,
        path + ".proofLedger.receiptIds[" + index + "]",
        id,
        receiptId
      );
    });
    array(ledger.sourceIds).forEach(function (sourceId, index) {
      checkCampaignSource(
        collector,
        maps,
        path + ".proofLedger.sourceIds[" + index + "]",
        id,
        sourceId
      );
    });
    if (campaign.clipLabManifest) {
      checkManifest(
        collector,
        maps,
        receipts,
        campaign.clipLabManifest,
        path + ".clipLabManifest",
        options
      );
    }
  }

  function checkCampaigns(options, collector, maps, receipts) {
    array(options.campaigns).forEach(function (campaign, campaignIndex) {
      var path = "campaigns[" + campaignIndex + "]";
      var id = recordId(campaign);
      if (campaign.schema === "shokker.cold-open-campaign/v1") {
        checkColdOpenCampaign(
          collector,
          maps,
          receipts,
          campaign,
          path,
          options
        );
        return;
      }
      var assets = object(campaign.assets);
      var packages = array(assets.shorts)
        .concat(array(assets.supercuts))
        .concat(array(assets.resurfacing));
      var packageIds = new Set(packages.map(recordId).filter(Boolean));
      var nestedClipIds = new Set();
      array(assets.shorts).forEach(function (item) {
        nestedClipIds.add(recordId(item));
      });
      array(assets.supercuts).forEach(function (item) {
        array(item.segments).forEach(function (segment) {
          nestedClipIds.add(recordId(segment));
        });
      });
      array(assets.resurfacing).forEach(function (item) {
        nestedClipIds.add(recordId(item.archive));
        nestedClipIds.add(recordId(item.current));
      });

      array(campaign.releasePlan).forEach(function (release, releaseIndex) {
        collector.scan("CAMPAIGN_ASSET_ORPHAN");
        if (!packageIds.has(clean(release.assetId))) {
          collector.error(
            "CAMPAIGN_ASSET_ORPHAN",
            "campaign",
            path + ".releasePlan[" + releaseIndex + "].assetId",
            id,
            "Release-plan asset does not exist in the campaign package.",
            { assetId: clean(release.assetId) }
          );
        }
        if (release.proofReceiptId) {
          checkCampaignReceipt(
            collector,
            receipts,
            path + ".releasePlan[" + releaseIndex + "].proofReceiptId",
            id,
            release.proofReceiptId
          );
        }
        array(release.proofReceiptIds).forEach(function (
          receiptId,
          receiptIndex
        ) {
          checkCampaignReceipt(
            collector,
            receipts,
            path +
              ".releasePlan[" +
              releaseIndex +
              "].proofReceiptIds[" +
              receiptIndex +
              "]",
            id,
            receiptId
          );
        });
      });

      var board = object(campaign.approvalBoard);
      Object.keys(board)
        .sort()
        .forEach(function (lane) {
          array(board[lane]).forEach(function (assetId, assetIndex) {
            collector.scan("CAMPAIGN_ASSET_ORPHAN");
            if (!nestedClipIds.has(clean(assetId))) {
              collector.error(
                "CAMPAIGN_ASSET_ORPHAN",
                "campaign",
                path +
                  ".approvalBoard." +
                  lane +
                  "[" +
                  assetIndex +
                  "]",
                id,
                "Approval-board clip does not exist in the packaged campaign.",
                { assetId: clean(assetId) }
              );
            }
          });
        });

      var ledger = object(campaign.proofLedger);
      array(ledger.receiptIds).forEach(function (receiptId, index) {
        checkCampaignReceipt(
          collector,
          receipts,
          path + ".proofLedger.receiptIds[" + index + "]",
          id,
          receiptId
        );
      });
      array(ledger.sourceIds).forEach(function (sourceId, index) {
        checkCampaignSource(
          collector,
          maps,
          path + ".proofLedger.sourceIds[" + index + "]",
          id,
          sourceId
        );
      });
      if (campaign.manifest) {
        checkManifest(
          collector,
          maps,
          receipts,
          campaign.manifest,
          path + ".manifest",
          options
        );
      }
    });

    array(options.manifests).forEach(function (manifest, index) {
      checkManifest(
        collector,
        maps,
        receipts,
        manifest,
        "manifests[" + index + "]",
        options
      );
    });
  }

  function publicCopyText(item) {
    return clean(
      item &&
        (item.text ||
          item.publicExcerpt ||
          item.displayExcerpt ||
          item.publishedExcerpt ||
          item.publicQuote ||
          item.quoteForDisplay)
    );
  }

  function checkPublicCopy(options, collector, maps) {
    array(options.publicCopy).forEach(function (item, index) {
      var path = "publicCopy[" + index + "]";
      var id = recordId(item) || "public-copy:" + index;
      var text = publicCopyText(item);
      var type = lower(item.evidenceType || item.type);
      var label = clean(item.label);

      collector.scan("PUBLIC_EXCERPT_TOO_LONG");
      if (words(text) > options.publicExcerptWordLimit) {
        collector.error(
          "PUBLIC_EXCERPT_TOO_LONG",
          "public-copy",
          path,
          id,
          "Explicit public evidence excerpt exceeds the public word limit.",
          {
            words: words(text),
            limit: options.publicExcerptWordLimit
          }
        );
      }

      collector.scan("PUBLIC_COPY_MISLABELED");
      var labelValid =
        (type === "caption-excerpt" &&
          /caption|timestamped receipt/i.test(label)) ||
        (type === "derived-source-summary" &&
          /derived|source-level summary/i.test(label)) ||
        (type === "source-metadata" && /source metadata/i.test(label));
      if (!labelValid) {
        collector.error(
          "PUBLIC_COPY_MISLABELED",
          "public-copy",
          path + ".label",
          id,
          "Public evidence label does not match its evidence type.",
          { evidenceType: type, label: label }
        );
      }
      if (
        type === "source-metadata" &&
        (item.isQuote === true || /quote|caption excerpt/i.test(label))
      ) {
        collector.error(
          "PUBLIC_COPY_MISLABELED",
          "public-copy",
          path,
          id,
          "Source metadata is being presented as an archival quote."
        );
      }

      collector.scan("EVIDENCE_LEVEL_CONTRADICTION");
      var level = lower(item.evidenceLevel);
      if (level && !ALLOWED_EVIDENCE_LEVELS.has(level)) {
        collector.error(
          "EVIDENCE_LEVEL_CONTRADICTION",
          "public-copy",
          path + ".evidenceLevel",
          id,
          "Public copy uses an unsupported evidence level.",
          { evidenceLevel: level }
        );
      }
      if (type === "caption-excerpt") {
        checkSourceReference(
          collector,
          maps.byId,
          "public-copy",
          path + ".sourceId",
          id,
          item.sourceId
        );
        checkTimestamp(
          collector,
          maps.byId,
          "public-copy",
          path + ".t",
          id,
          item.sourceId,
          item.t
        );
      }
    });
  }

  function metricsFor(options, collector, maps, receipts) {
    var showcase = object(options.showcase);
    var lore = object(options.lore);
    var galaxy = object(lore.galaxy);
    var clip = object(options.clip);
    var characters = object(options.characters);
    var errors = collector.violations.filter(function (violation) {
      return violation.severity === "error";
    }).length;
    var warnings = collector.violations.length - errors;
    return {
      rawCatalogSources: array(options.catalog).length,
      sources: maps.sources.length,
      characterEvidenceSources: maps.characterEvidenceSources.length,
      ownedEvidenceSources: maps.byId.size,
      showcaseReceipts: receipts.showcase.size,
      characterProfiles: array(characters.characters).length,
      loreReceipts: receipts.lore.size,
      loreFieldGuideEntries: array(lore.fieldGuide).length,
      showcaseGraphNodes: array(object(showcase.memoryGraph).nodes).length,
      showcaseGraphEdges: array(object(showcase.memoryGraph).edges).length,
      loreGraphNodes: array(galaxy.nodes).length,
      loreGraphEdges: array(galaxy.edges).length,
      clipShorts: array(clip.shorts).length,
      clipSupercuts: array(clip.supercuts).length,
      clipResurfacing: array(clip.resurfacing).length,
      campaigns: options.campaigns.length,
      manifests: options.manifests.length,
      publicCopyItems: options.publicCopy.length,
      errors: errors,
      warnings: warnings
    };
  }

  function audit(input) {
    var options = normalizeOptions(input);
    var collector = createCollector();
    checkInputs(options, collector);
    checkDuplicates(options, collector);
    var maps = sourceMaps(options);
    var receipts = receiptMaps(options);
    checkShowcaseReceipts(options, collector, maps);
    checkCharacters(options, collector, maps, receipts);
    checkLore(options, collector, maps, receipts);
    checkGraph(
      collector,
      "showcase",
      "showcase.memoryGraph",
      object(object(options.showcase).memoryGraph),
      receipts.showcase
    );
    checkGraph(
      collector,
      "lore",
      "lore.galaxy",
      object(object(options.lore).galaxy),
      receipts.lore
    );
    checkClipPackages(options, collector, maps, receipts);
    checkCampaigns(options, collector, maps, receipts);
    checkPublicCopy(options, collector, maps);

    var violations = collector.violations.slice().sort(compareViolations);
    var metrics = metricsFor(options, collector, maps, receipts);
    var byCode = violations.reduce(function (counts, violation) {
      counts[violation.code] = number(counts[violation.code]) + 1;
      return counts;
    }, {});
    var checks = Array.from(collector.stats.values())
      .sort(function (a, b) {
        return a.code.localeCompare(b.code);
      })
      .map(function (check) {
        return {
          code: check.code,
          description: check.description,
          status: check.errors ? "FAIL" : check.warnings ? "WARN" : "PASS",
          scanned: check.scanned,
          violations: check.violations,
          errors: check.errors,
          warnings: check.warnings
        };
      });
    var reportCore = {
      engine: "SHOKKER CANON INTEGRITY AUDIT",
      version: VERSION,
      snapshotDate:
        clean(object(options.showcase).snapshotDate) ||
        clean(object(options.deep).generated),
      policy: {
        failClosed: true,
        publicExcerptWordLimit: options.publicExcerptWordLimit,
        rawReceiptExcerptsAreInternal: true,
        speakerRule:
          "No named clip speaker without an authenticated creator decision that certifies that exact speaker on the owning receipt; a character-owner mapping alone does not claim clip diarization.",
        publicCopyRule:
          "Raw showcase receipts and Clip Lab candidates remain internal. Explicit publicCopy plus creator and Cold Open export manifests must stay within the public excerpt ceiling."
      },
      ok: metrics.errors === 0,
      status: metrics.errors === 0 ? "PASS" : "FAIL",
      metrics: metrics,
      summary: {
        errors: metrics.errors,
        warnings: metrics.warnings,
        totalViolations: violations.length,
        byCode: stableValue(byCode)
      },
      checks: checks,
      violations: violations
    };
    reportCore.fingerprint = fingerprint(stableJson(reportCore));
    return reportCore;
  }

  function assertIntegrity(input) {
    var report = audit(input);
    if (!report.ok) {
      var error = new Error(
        "Canon Integrity audit failed with " +
          report.summary.errors +
          " error(s). Fingerprint: " +
          report.fingerprint
      );
      error.name = "CanonIntegrityError";
      error.report = report;
      throw error;
    }
    return report;
  }

  root.WWAMCanonIntegrity = Object.freeze({
    VERSION: VERSION,
    DEFAULT_PUBLIC_EXCERPT_WORDS: DEFAULT_PUBLIC_EXCERPT_WORDS,
    CHECKS: CHECK_DEFINITIONS,
    audit: audit,
    assert: assertIntegrity
  });
})(typeof window !== "undefined" ? window : globalThis);
