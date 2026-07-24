(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "shokker-source-dossier-input/v1";
  var PUBLIC_EXCERPT_WORDS = 16;
  var EXPECTED_ATLAS_SOURCES = 472;
  var EXPECTED_CATALOG_SOURCES = 39;
  var EXPECTED_CANONICAL_SOURCES = 510;
  var EXPECTED_RECEIPTS = 1490;
  var EXPECTED_OVERLAP_ID = "3wK00_-K-Y0";
  var PINNED_SHOWCASE_SOURCE_ID = "LV2rmwEA0w4";

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
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

  function numberOrNull(value) {
    if (value == null || value === "") return null;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function number(value) {
    var parsed = numberOrNull(value);
    return parsed == null ? 0 : parsed;
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(function (value) {
      return value != null && clean(value);
    }).map(function (value) {
      return clean(value);
    })));
  }

  function stableStrings(values) {
    return unique(values).sort(function (left, right) {
      return left.localeCompare(right);
    });
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function words(value) {
    return clean(value).split(/\s+/).filter(Boolean);
  }

  function publicExcerpt(value) {
    var tokens = words(value);
    if (tokens.length <= PUBLIC_EXCERPT_WORDS) return tokens.join(" ");
    return tokens.slice(0, PUBLIC_EXCERPT_WORDS).join(" ") + "…";
  }

  function titleCase(value) {
    return clean(value).split(/[-_\s]+/).filter(Boolean).map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function adapterError(code, message) {
    var error = new Error(message);
    error.name = "WWAMSourceDossierAdapterError";
    error.code = code;
    return error;
  }

  function fail(code, message) {
    throw adapterError(code, message);
  }

  function mapById(values, label) {
    var output = new Map();
    array(values).forEach(function (value) {
      var id = clean(value && (value.id || value.videoId));
      if (!id) fail("SOURCE_ID_REQUIRED", label + " contains a source without an ID.");
      if (output.has(id)) {
        fail("SOURCE_ID_DUPLICATE", label + " contains duplicate source ID " + id + ".");
      }
      output.set(id, value);
    });
    return output;
  }

  function streamsFrom(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value.getSearchPayload === "function") {
      return array(value.getSearchPayload().streams);
    }
    if (typeof value.browse === "function") {
      var result = value.browse({ sort: "priority", limit: 100 });
      return array(result && result.records);
    }
    return array(value.streams || value.items || value.records);
  }

  function atlasRecordsFrom(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.records)) return value.records;
    if (typeof value.browse === "function") {
      return array(value.browse({}).records);
    }
    return [];
  }

  function assertCount(values, expected, label) {
    if (array(values).length !== expected) {
      fail(
        "SOURCE_COUNT_INVALID",
        label + " requires exactly " + expected + " sources; received " +
          array(values).length + "."
      );
    }
  }

  function assertSubset(values, allowed, label) {
    array(values).forEach(function (value) {
      var id = clean(value && (value.id || value.videoId));
      if (!allowed.has(id)) {
        fail("SOURCE_SCOPE_INVALID", label + " contains non-Atlas source " + id + ".");
      }
    });
  }

  function assertMetadataAgreement(left, right, id, label) {
    ["title", "date", "duration", "views", "thumbnail", "url"].forEach(function (field) {
      if (left[field] != null && right[field] != null &&
          String(left[field]) !== String(right[field])) {
        fail(
          "SOURCE_METADATA_CONFLICT",
          label + " conflicts with canonical metadata for " + id + "." + field + "."
        );
      }
    });
  }

  function coverage(value) {
    var status = clean(value);
    if (status === "deeply-indexed" || status === "caption-backed") {
      return "caption-backed";
    }
    if (status === "caption-limited") return "caption-limited";
    if (status === "unavailable") return "unavailable";
    return "metadata-only";
  }

  function sourceEnd(raw, at, duration) {
    var candidate = numberOrNull(
      raw && (
        raw.end != null ? raw.end :
          raw.to != null ? raw.to :
            raw.window && raw.window.to != null ? raw.window.to : null
      )
    );
    if (candidate == null || candidate < at || candidate > duration) return null;
    return candidate;
  }

  function evidenceType(kind, fallback) {
    var value = normalized(kind);
    if (value.indexOf("topic") >= 0) return "caption-topic-receipt";
    if (value.indexOf("character") >= 0) return "curated-character-performance";
    if (value.indexOf("moment") >= 0) return "caption-excerpt";
    return clean(fallback) || "caption-excerpt";
  }

  function reviewState(level, fallback) {
    var value = normalized(level);
    if (value.indexOf("curated") >= 0) {
      return "timestamp-validated-human-curated-candidate";
    }
    return clean(fallback) || "machine-surfaced";
  }

  function normalizedReceipt(raw, source, settings) {
    var at = numberOrNull(
      raw && (
        raw.t != null ? raw.t :
          raw.at != null ? raw.at :
            raw.time != null ? raw.time :
              raw.timestamp != null ? raw.timestamp : null
      )
    );
    if (at == null || at < 0 || at > source.duration) {
      fail(
        "RECEIPT_TIME_INVALID",
        "Receipt " + clean(raw && (raw.id || raw.key)) +
          " is outside source " + source.id + "."
      );
    }
    var kind = clean(settings.kind || raw.type || raw.kind || "receipt");
    var allowExcerpt = settings.publicExcerptAllowed !== false;
    var excerpt = allowExcerpt
      ? publicExcerpt(
          raw.excerpt || raw.quote || raw.receipt || raw.text || ""
        )
      : "";
    var ids = stableStrings(
      settings.entityIds || raw.entityIds || []
    ).filter(function (id) {
      return !/^source:[A-Za-z0-9_-]{11}$/.test(id);
    });
    return {
      key: clean(settings.key || raw.id || raw.key),
      at: at,
      end: sourceEnd(raw, at, source.duration),
      kind: kind,
      label: clean(
        settings.label || raw.category || raw.label || raw.name || kind
      ),
      excerpt: excerpt,
      evidenceLevel: clean(
        settings.evidenceLevel || raw.evidenceLevel || "machine"
      ),
      evidenceType: clean(
        settings.evidenceType || evidenceType(kind)
      ),
      evidenceBasis: clean(settings.evidenceBasis),
      reviewState: clean(
        settings.reviewState ||
          reviewState(raw.evidenceLevel, raw.reviewState)
      ),
      speaker: null,
      speakerStatus: "not-diarized",
      promotionAllowed: false,
      publicExcerptAllowed: Boolean(allowExcerpt && excerpt),
      entityIds: ids,
    };
  }

  function exactShowcaseReceipts(source, receipts) {
    return array(receipts).map(function (receipt) {
      return normalizedReceipt(receipt, source, {
        key: receipt.id,
        kind: receipt.type,
        label: receipt.category,
        evidenceLevel: receipt.evidenceLevel || "machine",
        evidenceType: evidenceType(receipt.type),
        evidenceBasis: "exact-showcase-receipt",
        reviewState: reviewState(receipt.evidenceLevel),
        publicExcerptAllowed: true,
        entityIds: receipt.entityIds,
      });
    });
  }

  function rawTopicReceipt(source, topic, index, basis, restricted, entityIdForLabel) {
    var at = numberOrNull(topic.peak);
    if (at == null) at = numberOrNull(topic.first);
    var label = clean(topic.name || topic.label || "TOPIC");
    return normalizedReceipt(
      {
        id: [
          source.id,
          "topic",
          slug(label),
          at == null ? index : Math.floor(at),
        ].join(":"),
        t: at,
        type: "topic-navigation",
        label: label,
        excerpt: topic.receipt || topic.excerpt || "",
      },
      source,
      {
        kind: "topic-navigation",
        label: label,
        evidenceLevel: "machine",
        evidenceType: restricted
          ? "caption-topic-navigation"
          : "caption-topic-receipt",
        evidenceBasis: basis,
        reviewState: restricted
          ? "quarantined-topic-navigation"
          : "machine-surfaced",
        publicExcerptAllowed: !restricted,
        entityIds: [entityIdForLabel(label, "topic")],
      }
    );
  }

  function rawMomentReceipt(source, moment, index, basis) {
    return normalizedReceipt(
      Object.assign({}, moment, {
        id: clean(moment.id) || [
          source.id,
          "moment",
          Math.floor(number(moment.t)),
          index,
        ].join(":"),
        type: "moment",
      }),
      source,
      {
        kind: "moment",
        label: moment.category || "MOMENT",
        evidenceLevel: "machine",
        evidenceType: "caption-excerpt",
        evidenceBasis: basis,
        reviewState: basis.indexOf("archive-deep") >= 0
          ? "quarantined-machine-candidate"
          : "machine-surfaced",
        publicExcerptAllowed: true,
      }
    );
  }

  function rawCharacterReceipt(
    source,
    character,
    index,
    basis,
    entityIdForLabel
  ) {
    var label = clean(character.character || character.label || "CHARACTER");
    return normalizedReceipt(
      {
        id: [
          source.id,
          "character",
          slug(label),
          Math.floor(number(character.t)),
          index,
        ].join(":"),
        t: character.t,
        type: "character-context",
        label: label,
        excerpt: character.receipt || character.excerpt || "",
      },
      source,
      {
        kind: "character-context",
        label: label,
        evidenceLevel: "machine",
        evidenceType: "curated-character-performance",
        evidenceBasis: basis,
        reviewState: basis.indexOf("archive-deep") >= 0
          ? "quarantined-machine-candidate"
          : "machine-surfaced",
        publicExcerptAllowed: true,
        entityIds: [entityIdForLabel(label, "character")],
      }
    );
  }

  function stableReceipts(receipts) {
    var keys = new Set();
    return array(receipts).slice().sort(function (left, right) {
      return left.at - right.at || left.key.localeCompare(right.key);
    }).filter(function (receipt) {
      if (!receipt.key || keys.has(receipt.key)) {
        if (receipt.key) {
          fail("RECEIPT_ID_DUPLICATE", "Duplicate dossier receipt " + receipt.key + ".");
        }
        fail("RECEIPT_ID_REQUIRED", "A dossier receipt is missing its key.");
      }
      keys.add(receipt.key);
      return true;
    });
  }

  function artifactShell(raw, kind, receiptKeys, sourceIds, creatorDraft) {
    return {
      key: clean(raw.id || raw.key),
      kind: kind,
      label: clean(
        raw.label || raw.title || raw.subject || raw.anchor || raw.id || kind
      ),
      receiptKeys: stableStrings(receiptKeys),
      sourceIds: stableStrings(sourceIds),
      creatorDraft: Boolean(creatorDraft),
      reviewState: creatorDraft
        ? "creator-draft-review-only"
        : "derived-review-only",
      promotionAllowed: false,
    };
  }

  function buildArtifacts(showcase, clipLab) {
    var output = new Map();
    var receiptSource = new Map();

    function bucket(sourceId) {
      if (!output.has(sourceId)) {
        output.set(sourceId, {
          takeTimeMachines: [],
          bitLineages: [],
          shorts: [],
          supercuts: [],
          resurfacing: [],
        });
      }
      return output.get(sourceId);
    }

    function sourceIdsFromReceipts(receiptKeys) {
      return stableStrings(array(receiptKeys).map(function (key) {
        return receiptSource.get(clean(key));
      }).filter(Boolean));
    }

    function add(sourceId, collection, artifact) {
      var values = bucket(sourceId)[collection];
      if (!values.some(function (value) { return value.key === artifact.key; })) {
        values.push(artifact);
      }
    }

    array(showcase && showcase.receipts).forEach(function (receipt) {
      receiptSource.set(clean(receipt.id), clean(receipt.sourceId));
    });

    var timeMachines = array(
      showcase && (
        showcase.takeTimeMachines ||
        (typeof showcase.getTimeMachines === "function"
          ? showcase.getTimeMachines()
          : [])
      )
    );
    timeMachines.forEach(function (machine) {
      var receiptKeys = array(machine.receiptIds || machine.receipts).map(function (item) {
        return clean(typeof item === "string" ? item : item && (item.id || item.receiptId));
      }).filter(Boolean);
      var sourceIds = stableStrings(
        sourceIdsFromReceipts(receiptKeys).concat(
          array(machine.milestones).map(function (item) { return item.sourceId; })
        )
      );
      sourceIds.forEach(function (sourceId) {
        add(
          sourceId,
          "takeTimeMachines",
          artifactShell(
            machine,
            "take-time-machine",
            receiptKeys.filter(function (key) {
              return receiptSource.get(key) === sourceId;
            }),
            sourceIds,
            false
          )
        );
      });
    });

    var bitLineages = array(
      showcase && (
        showcase.bitAncestry ||
        (typeof showcase.getBitLineages === "function"
          ? showcase.getBitLineages()
          : [])
      )
    );
    bitLineages.forEach(function (lineage) {
      var performances = array(lineage.performances || lineage.events || lineage.receipts);
      var receiptKeys = performances.map(function (item) {
        return clean(
          typeof item === "string" ? item :
            item && (item.receiptId || item.id)
        );
      }).filter(Boolean);
      var sourceIds = stableStrings(
        performances.map(function (item) {
          return item && item.sourceId;
        }).concat(sourceIdsFromReceipts(receiptKeys))
      );
      sourceIds.forEach(function (sourceId) {
        add(
          sourceId,
          "bitLineages",
          artifactShell(
            lineage,
            "bit-lineage",
            receiptKeys.filter(function (key) {
              return receiptSource.get(key) === sourceId;
            }),
            sourceIds,
            false
          )
        );
      });
    });

    [
      { name: "shorts", kind: "creator-short" },
      { name: "supercuts", kind: "creator-supercut" },
      { name: "resurfacing", kind: "creator-resurfacing" },
    ].forEach(function (group) {
      array(
        clipLab && clipLab[group.name] ||
        showcase && showcase[group.name]
      ).forEach(function (artifact) {
        var receiptKeys = stableStrings(
          [artifact.receiptId].concat(artifact.receiptIds || [])
        );
        var sourceIds = stableStrings(
          [artifact.sourceId]
            .concat(artifact.sourceIds || [])
            .concat(sourceIdsFromReceipts(receiptKeys))
        );
        sourceIds.forEach(function (sourceId) {
          add(
            sourceId,
            group.name,
            artifactShell(
              artifact,
              group.kind,
              receiptKeys.filter(function (key) {
                return receiptSource.get(key) === sourceId;
              }),
              sourceIds,
              true
            )
          );
        });
      });
    });

    output.forEach(function (collections) {
      Object.keys(collections).forEach(function (key) {
        collections[key].sort(function (left, right) {
          return left.key.localeCompare(right.key);
        });
      });
    });
    return output;
  }

  function emptyArtifacts() {
    return {
      takeTimeMachines: [],
      bitLineages: [],
      shorts: [],
      supercuts: [],
      resurfacing: [],
    };
  }

  function flattenArtifacts(collections) {
    return Object.keys(emptyArtifacts()).reduce(function (output, key) {
      return output.concat(array(collections && collections[key]));
    }, []).map(function (artifact) {
      return {
        id: artifact.key,
        kind: artifact.kind,
        label: artifact.label,
        authority: artifact.creatorDraft ? "creator-draft" : "editor-review",
        reviewState: artifact.reviewState,
        sourceIds: stableStrings(artifact.sourceIds),
        receiptKeys: stableStrings(artifact.receiptKeys),
        at: null,
        targetSection: "",
        risk: "",
        creatorDraft: artifact.creatorDraft,
        promotionAllowed: false,
      };
    }).sort(function (left, right) {
      return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id);
    });
  }

  function buildEntityDefinitions(dna, showcase) {
    var definitions = [];
    var byId = new Map();
    var titleEligible = new Set();

    function add(raw, fallbackType, allowTitleAlias) {
      if (!raw) return;
      var id = clean(raw.id);
      var label = clean(raw.label || raw.name);
      if (!id || !label) return;
      var definition = {
        id: id,
        type: clean(raw.type || fallbackType || id.split(":")[0]),
        label: label,
        aliases: stableStrings([label].concat(raw.aliases || [])),
      };
      definitions.push(definition);
      byId.set(id, definition);
      if (allowTitleAlias) titleEligible.add(id);
    }

    array(dna && dna.entities).forEach(function (item) { add(item, "", true); });
    array(dna && dna.characters).forEach(function (item) {
      add(item, "character", true);
    });
    array(dna && dna.bitDefinitions).forEach(function (item) {
      add(item, "bit", true);
    });
    array(
      showcase && showcase.memoryGraph && showcase.memoryGraph.nodes
    ).forEach(function (item) { add(item, "", false); });

    definitions = Array.from(new Map(definitions.map(function (item) {
      return [item.id, item];
    })).values()).sort(function (left, right) {
      return left.id.localeCompare(right.id);
    });

    function forLabel(label, type) {
      var target = normalized(label);
      var match = definitions.find(function (definition) {
        if (type && definition.type !== type) return false;
        return definition.aliases.some(function (alias) {
          return normalized(alias) === target;
        });
      });
      return match ? match.id : (type || "topic") + ":" + slug(label);
    }

    return {
      definitions: definitions,
      titleDefinitions: definitions.filter(function (definition) {
        return titleEligible.has(definition.id);
      }),
      byId: byId,
      forLabel: forLabel,
    };
  }

  function buildEntities(source, receipts, catalogItem, entityRegistry) {
    var values = new Map();
    var basisRank = {
      "cached-title-alias": 1,
      "catalog-declared-entity": 2,
      "timestamped-receipt": 3,
    };

    function add(id, basis, receiptKey, matchedAlias, labelHint) {
      id = clean(id);
      if (!id) return;
      var definition = entityRegistry.byId.get(id);
      var type = clean(definition && definition.type || id.split(":")[0] || "entity");
      var label = clean(
        definition && definition.label ||
        labelHint ||
        titleCase(id.split(":").slice(1).join(" "))
      );
      var existing = values.get(id);
      if (!existing) {
        existing = {
          id: id,
          type: type,
          label: label,
          basis: basis,
          matchedAlias: clean(matchedAlias) || null,
          receiptKeys: [],
        };
        values.set(id, existing);
      } else if (basisRank[basis] > basisRank[existing.basis]) {
        existing.basis = basis;
        existing.matchedAlias = clean(matchedAlias) || null;
      }
      if (receiptKey && existing.receiptKeys.indexOf(receiptKey) < 0) {
        existing.receiptKeys.push(receiptKey);
      }
    }

    receipts.forEach(function (receipt) {
      receipt.entityIds.forEach(function (id) {
        add(id, "timestamped-receipt", receipt.key, "", receipt.label);
      });
    });

    if (catalogItem && source.coverage === "caption-backed") {
      if (catalogItem.franchise) {
        add(
          entityRegistry.forLabel(catalogItem.franchise, "franchise"),
          "catalog-declared-entity",
          "",
          "",
          catalogItem.franchise
        );
      }
      if (catalogItem.film) {
        add(
          entityRegistry.forLabel(catalogItem.film, "film"),
          "catalog-declared-entity",
          "",
          "",
          catalogItem.film
        );
      }
    }

    var normalizedTitle = " " + normalized(source.title) + " ";
    entityRegistry.titleDefinitions.forEach(function (definition) {
      var alias = definition.aliases
        .slice()
        .sort(function (left, right) { return right.length - left.length; })
        .find(function (candidate) {
          var value = normalized(candidate);
          return value.length >= 3 &&
            normalizedTitle.indexOf(" " + value + " ") >= 0;
        });
      if (alias) {
        add(
          definition.id,
          "cached-title-alias",
          "",
          alias,
          definition.label
        );
      }
    });

    return Array.from(values.values()).map(function (entity) {
      entity.receiptKeys.sort(function (left, right) {
        return left.localeCompare(right);
      });
      return entity;
    }).sort(function (left, right) {
      return left.id.localeCompare(right.id);
    });
  }

  function rightsPolicy(source, archiveStream) {
    var raw = archiveStream && archiveStream.rightsPolicy || {};
    var restricted = Boolean(raw.restrictedToTopicNavigation);
    var mode = clean(raw.mode);
    if (!mode) {
      if (source.coverage === "metadata-only") mode = "source-metadata-only";
      else if (source.coverage === "caption-limited") mode = "caption-limited";
      else if (source.authority === "promoted-lane") mode = "promoted-caption-receipts";
      else mode = "source-only";
    }
    return {
      mode: mode,
      candidateState: source.authority,
      publicExcerptWordLimit: PUBLIC_EXCERPT_WORDS,
      restrictedToTopicNavigation: restricted,
      speakerClaimsAllowed: false,
      performerClaimsAllowed: false,
      originClaimsAllowed: false,
      visualClaimsAllowed: false,
      promotionAllowed: false,
    };
  }

  function warningsFor(source, archiveStream, receipts) {
    var warnings = [
      "VIEWS ARE A CACHED SNAPSHOT, NOT A LIVE POPULARITY COUNT.",
    ];
    if (source.availability === "not-captured" ||
        source.liveStatus === "not-captured") {
      warnings.push("CURRENT YOUTUBE AVAILABILITY WAS NOT CAPTURED.");
    }
    if (source.coverage === "metadata-only") {
      warnings.push("SOURCE METADATA ONLY // NO CONTENT CLAIMS OR RECEIPTS.");
    }
    if (source.coverage === "caption-limited") {
      warnings.push("CAPTION-LIMITED // NO SEMANTIC SUMMARY OR CONTENT RECEIPTS.");
    }
    if (receipts.length) {
      warnings.push("AUTOMATIC-CAPTION RECEIPTS DO NOT IDENTIFY A SPEAKER.");
    }
    if (source.authority === "quarantined-lane") {
      warnings.push("ARCHIVE DEEP EVIDENCE IS QUARANTINED AND NON-PROMOTABLE.");
    }
    if (archiveStream && archiveStream.rightsPolicy &&
        archiveStream.rightsPolicy.restrictedToTopicNavigation) {
      warnings.push("SOURCE-AUDIO FIREWALL // TOPIC NAVIGATION ONLY.");
      warnings.push("NO PUBLIC JOKE OR CHARACTER RECEIPTS ARE EXPOSED FROM THIS SOURCE.");
    }
    var span = numberOrNull(
      archiveStream && archiveStream.captionEvidence &&
      archiveStream.captionEvidence.durationCoveragePercent
    );
    if (span != null && span < 100) {
      warnings.push("AVAILABLE CAPTION SPAN: " + span + "% OF SOURCE DURATION.");
    }
    return stableStrings(warnings);
  }

  function metricsFor(source, overlay, receipts, entities, artifacts) {
    var counts = {
      topics: 0,
      moments: 0,
      characters: 0,
    };
    receipts.forEach(function (receipt) {
      var kind = normalized(receipt.kind);
      if (kind.indexOf("topic") >= 0) counts.topics += 1;
      else if (kind.indexOf("character") >= 0) counts.characters += 1;
      else if (kind.indexOf("moment") >= 0) counts.moments += 1;
    });
    var heat = array(overlay && (overlay.heatmap || overlay.arc)).length;
    return {
      receiptCount: receipts.length,
      publicExcerptReceipts: receipts.filter(function (receipt) {
        return receipt.publicExcerptAllowed;
      }).length,
      topicReceipts: counts.topics,
      momentReceipts: counts.moments,
      characterReceipts: counts.characters,
      entityCount: entities.length,
      heatSegments: heat,
      captionMinutes: number(overlay && overlay.captionMinutes),
      captionCoveragePercent: numberOrNull(
        overlay && overlay.captionEvidence &&
        overlay.captionEvidence.durationCoveragePercent
      ),
      unhinged: numberOrNull(overlay && overlay.unhinged),
      takeTimeMachines: artifacts.takeTimeMachines.length,
      bitLineages: artifacts.bitLineages.length,
      shorts: artifacts.shorts.length,
      supercuts: artifacts.supercuts.length,
      resurfacing: artifacts.resurfacing.length,
    };
  }

  function channelFrom(input, dna) {
    if (input.channel && typeof input.channel === "object") return clone(input.channel);
    if (typeof input.channel === "string") {
      return { id: clean(dna && dna.id || "wwam"), label: clean(input.channel) };
    }
    return {
      id: clean(dna && dna.id || "wwam"),
      label: clean(dna && dna.channel || "We Watched A Movie"),
      product: clean(dna && dna.label || "WWAM After Midnight"),
    };
  }

  function assertPinnedShowcaseProof(
    showcaseSources,
    showcaseReceipts,
    artifactBySource
  ) {
    if (!showcaseSources.has(PINNED_SHOWCASE_SOURCE_ID)) {
      fail(
        "SHOWCASE_PROOF_INCOMPLETE",
        "The pinned Showcase source " + PINNED_SHOWCASE_SOURCE_ID + " is missing."
      );
    }
    var receipts = showcaseReceipts.get(PINNED_SHOWCASE_SOURCE_ID) || [];
    var receiptCounts = receipts.reduce(function (counts, receipt) {
      var type = evidenceType(receipt.type);
      counts[type] = number(counts[type]) + 1;
      return counts;
    }, {});
    if (receipts.length !== 21 ||
        number(receiptCounts["caption-excerpt"]) !== 7 ||
        number(receiptCounts["caption-topic-receipt"]) !== 8 ||
        number(receiptCounts["curated-character-performance"]) !== 6) {
      fail(
        "SHOWCASE_PROOF_INCOMPLETE",
        "The pinned Showcase source must retain its exact 21-receipt proof."
      );
    }
    var artifacts = artifactBySource.get(PINNED_SHOWCASE_SOURCE_ID) ||
      emptyArtifacts();
    if (array(artifacts.takeTimeMachines).length !== 0 ||
        array(artifacts.bitLineages).length !== 4 ||
        array(artifacts.shorts).length !== 13 ||
        array(artifacts.supercuts).length !== 6 ||
        array(artifacts.resurfacing).length !== 4) {
      fail(
        "SHOWCASE_ARTIFACT_PROOF_INCOMPLETE",
        "The pinned Showcase source must retain its exact 27 artifact memberships."
      );
    }
  }

  function build(input) {
    input = input || {};
    var atlasPayload = input.atlas || input.archiveAtlas;
    var atlasRecords = atlasRecordsFrom(atlasPayload);
    var catalog = array(input.catalog);
    var deep = input.deep || {};
    var live = input.live || {};
    var popular = input.popular || {};
    var archiveStreams = streamsFrom(
      input.archiveDeepPortfolio || input.archiveDeep
    );
    var showcase = input.showcase || null;
    var clipLab = input.clipLab || null;
    var dna = input.dna || input.channelDNA || {};

    assertCount(atlasRecords, EXPECTED_ATLAS_SOURCES, "WWAM Archive Atlas");
    assertCount(catalog, EXPECTED_CATALOG_SOURCES, "WWAM commentary catalog");
    if (archiveStreams.length !== 40) {
      fail(
        "ARCHIVE_DEEP_COUNT_INVALID",
        "The normalized Archive Deep portfolio must contain all 40 sources."
      );
    }
    if (!showcase || !Array.isArray(showcase.sources) ||
        !Array.isArray(showcase.receipts)) {
      fail(
        "SHOWCASE_REQUIRED",
        "The normalized WWAM dossier requires the complete Showcase proof."
      );
    }

    var atlasById = mapById(atlasRecords, "WWAM Archive Atlas");
    var catalogById = mapById(catalog, "WWAM commentary catalog");
    var deepById = mapById(array(deep.tapes), "WWAM commentary distill");
    var liveStreams = streamsFrom(live);
    var popularStreams = streamsFrom(popular);
    var liveById = mapById(liveStreams, "WWAM Fresh 10");
    var popularById = mapById(popularStreams, "WWAM Popular 25");
    var archiveById = mapById(archiveStreams, "WWAM Archive Deep");
    var atlasIds = new Set(atlasById.keys());

    if (deepById.size && deepById.size !== EXPECTED_CATALOG_SOURCES) {
      fail("DEEP_DISTILL_COUNT_INVALID", "Commentary Deep Distill must contain 39 tapes.");
    }
    if (liveById.size && liveById.size !== 10) {
      fail("FRESH_COUNT_INVALID", "Fresh must contain exactly ten sources.");
    }
    if (popularById.size && popularById.size !== 25) {
      fail("POPULAR_COUNT_INVALID", "Popular must contain exactly 25 sources.");
    }
    assertSubset(liveStreams, atlasIds, "WWAM Fresh 10");
    assertSubset(popularStreams, atlasIds, "WWAM Popular 25");
    assertSubset(archiveStreams, atlasIds, "WWAM Archive Deep");

    if (deepById.size) {
      var deepIds = stableStrings(Array.from(deepById.keys()));
      var catalogIds = stableStrings(Array.from(catalogById.keys()));
      if (JSON.stringify(deepIds) !== JSON.stringify(catalogIds)) {
        fail("DEEP_CATALOG_MISMATCH", "Commentary distill IDs must equal catalog IDs.");
      }
    }

    var overlap = Array.from(catalogById.keys()).filter(function (id) {
      return atlasById.has(id);
    });
    if (overlap.length !== 1 || overlap[0] !== EXPECTED_OVERLAP_ID) {
      fail(
        "FEED_CATALOG_OVERLAP_INVALID",
        "WWAM feed/catalog overlap must be exactly " + EXPECTED_OVERLAP_ID + "."
      );
    }

    var promotedIds = new Set(
      Array.from(catalogById.keys())
        .concat(Array.from(liveById.keys()))
        .concat(Array.from(popularById.keys()))
    );
    var archiveIds = new Set(archiveById.keys());
    var showcaseSources = new Map(array(showcase && showcase.sources).map(function (source) {
      return [clean(source.id), source];
    }));
    var showcaseReceipts = new Map();
    array(showcase && showcase.receipts).forEach(function (receipt) {
      var id = clean(receipt.sourceId);
      if (!showcaseReceipts.has(id)) showcaseReceipts.set(id, []);
      showcaseReceipts.get(id).push(receipt);
    });
    var artifactBySource = buildArtifacts(showcase, clipLab);
    assertPinnedShowcaseProof(
      showcaseSources,
      showcaseReceipts,
      artifactBySource
    );
    var entityRegistry = buildEntityDefinitions(dna, showcase);
    var canonical = new Map();

    atlasRecords.forEach(function (record) {
      canonical.set(record.id, {
        id: record.id,
        title: clean(record.title),
        date: clean(record.date),
        duration: number(record.duration),
        views: number(record.views),
        thumbnail: clean(record.thumbnail),
        url: clean(record.url),
        availability: clean(record.availability) || "not-captured",
        liveStatus: clean(record.liveStatus) || "not-captured",
        coverage: coverage(record.coverage),
        lanes: stableStrings(["streams-feed"].concat(record.lanes || [])),
        atlasRecord: record,
        catalogItem: null,
      });
    });

    catalog.forEach(function (item) {
      var existing = canonical.get(item.id);
      if (existing) {
        assertMetadataAgreement(existing, item, item.id, "Commentary catalog");
        existing.catalogItem = item;
        existing.lanes = stableStrings(existing.lanes.concat(["commentary-catalog"]));
        return;
      }
      canonical.set(item.id, {
        id: item.id,
        title: clean(item.title),
        date: clean(item.date),
        duration: number(item.duration),
        views: number(item.views),
        thumbnail: clean(item.thumbnail),
        url: clean(item.url),
        availability: clean(item.availability) || "not-captured",
        liveStatus: clean(item.liveStatus) || "not-captured",
        coverage: item.transcript === false ? "caption-limited" : "caption-backed",
        lanes: ["commentary-catalog"],
        atlasRecord: null,
        catalogItem: item,
      });
    });

    if (canonical.size !== EXPECTED_CANONICAL_SOURCES) {
      fail(
        "CANONICAL_SOURCE_COUNT_INVALID",
        "WWAM canonical dossier union must contain exactly 510 source IDs."
      );
    }

    var sources = Array.from(canonical.values()).map(function (base) {
      var id = base.id;
      var catalogItem = base.catalogItem || catalogById.get(id) || null;
      var commentaryTape = deepById.get(id) || null;
      var liveStream = liveById.get(id) || null;
      var popularStream = popularById.get(id) || null;
      var archiveStream = archiveById.get(id) || null;
      var showcaseSource = showcaseSources.get(id) || null;
      var overlay = archiveStream || commentaryTape || liveStream || popularStream ||
        showcaseSource || null;
      var authority = archiveIds.has(id)
        ? "quarantined-lane"
        : promotedIds.has(id)
          ? "promoted-lane"
          : "source-only";
      var source = {
        id: id,
        title: base.title,
        displayTitle: clean(catalogItem && catalogItem.film || base.title),
        date: base.date,
        duration: base.duration,
        views: base.views,
        thumbnail: base.thumbnail,
        url: base.url,
        availability: archiveStream
          ? clean(archiveStream.availability) || base.availability
          : base.availability,
        liveStatus: archiveStream
          ? clean(archiveStream.liveStatus) || base.liveStatus
          : base.liveStatus,
        coverage: base.coverage,
        authority: authority,
        lanes: base.lanes,
        sourceType: catalogItem ? "commentary" : "livestream",
        wordsAudited: number(
          archiveStream && archiveStream.wordsAudited ||
          commentaryTape && commentaryTape.wordsAudited ||
          liveStream && liveStream.wordsAudited ||
          popularStream && popularStream.wordsAudited ||
          showcaseSource && showcaseSource.wordsAudited
        ),
      };

      var summaryText = "";
      var summaryBasis = "";
      if (source.coverage === "caption-backed") {
        if (archiveStream && archiveStream.summary) {
          summaryText = archiveStream.summary;
          summaryBasis = "archive-deep-derived-summary";
        } else if (showcaseSource && showcaseSource.summary) {
          summaryText = showcaseSource.summary;
          summaryBasis = "derived-caption-source-summary";
        } else if (commentaryTape && commentaryTape.verdict) {
          summaryText = commentaryTape.verdict;
          summaryBasis = "derived-caption-source-summary";
        } else if (liveStream && liveStream.summary) {
          summaryText = liveStream.summary;
          summaryBasis = "derived-caption-source-summary";
        } else if (popularStream && popularStream.editorial &&
                   popularStream.editorial.whyItMatters) {
          summaryText = popularStream.editorial.whyItMatters;
          summaryBasis = "derived-caption-editorial-summary";
        }
      }
      source.summary = summaryText
        ? { text: clean(summaryText), basis: summaryBasis }
        : null;

      var receipts = [];
      if (archiveStream && source.coverage === "caption-backed") {
        var restricted = Boolean(
          archiveStream.rightsPolicy &&
          archiveStream.rightsPolicy.restrictedToTopicNavigation
        );
        array(archiveStream.topics).forEach(function (topic, index) {
          receipts.push(rawTopicReceipt(
            source,
            topic,
            index,
            "archive-deep-topic-navigation",
            restricted,
            entityRegistry.forLabel
          ));
        });
        if (!restricted) {
          array(archiveStream.moments).forEach(function (moment, index) {
            receipts.push(rawMomentReceipt(
              source,
              moment,
              index,
              "archive-deep-quarantined-candidate"
            ));
          });
          array(archiveStream.characters).forEach(function (character, index) {
            receipts.push(rawCharacterReceipt(
              source,
              character,
              index,
              "archive-deep-quarantined-candidate",
              entityRegistry.forLabel
            ));
          });
        }
      } else if (authority === "promoted-lane" &&
                 source.coverage === "caption-backed") {
        if (showcase) {
          receipts = exactShowcaseReceipts(
            source,
            showcaseReceipts.get(id) || []
          );
        } else {
          var rawSource = commentaryTape || liveStream || popularStream || {};
          array(rawSource.moments).forEach(function (moment, index) {
            receipts.push(rawMomentReceipt(
              source,
              moment,
              index,
              "legacy-promoted-lane-caption"
            ));
          });
          array(rawSource.topics).forEach(function (topic, index) {
            receipts.push(rawTopicReceipt(
              source,
              topic,
              index,
              "legacy-promoted-lane-caption",
              false,
              entityRegistry.forLabel
            ));
          });
          array(rawSource.characters).forEach(function (character, index) {
            receipts.push(rawCharacterReceipt(
              source,
              character,
              index,
              "legacy-promoted-lane-caption",
              entityRegistry.forLabel
            ));
          });
        }
      }
      receipts = stableReceipts(receipts);

      var entities = buildEntities(
        source,
        receipts,
        catalogItem,
        entityRegistry
      );
      var artifactCollections = clone(
        artifactBySource.get(id) || emptyArtifacts()
      );
      var artifacts = flattenArtifacts(artifactCollections);
      var policy = rightsPolicy(source, archiveStream);
      var warnings = warningsFor(source, archiveStream, receipts);
      var metrics = metricsFor(
        source,
        overlay,
        receipts,
        entities,
        artifactCollections
      );

      source.receipts = receipts;
      source.entities = entities;
      source.artifacts = artifacts;
      source.rightsPolicy = policy;
      source.warnings = warnings;
      source.metrics = metrics;
      return source;
    }).sort(function (left, right) {
      return right.date.localeCompare(left.date) || left.id.localeCompare(right.id);
    });

    var receiptTotal = sources.reduce(function (total, source) {
      return total + source.receipts.length;
    }, 0);
    if (receiptTotal !== EXPECTED_RECEIPTS) {
      fail(
        "NORMALIZED_RECEIPT_COUNT_INVALID",
        "The normalized WWAM dossier must retain exactly " +
          EXPECTED_RECEIPTS + " source receipts."
      );
    }

    var result = {
      schema: SCHEMA,
      channel: channelFrom(input, dna),
      snapshotDate: clean(
        input.snapshotDate ||
        atlasPayload && atlasPayload.snapshotDate ||
        deep.generated ||
        live.generated ||
        popular.generated
      ),
      sources: sources,
    };
    return clone(result);
  }

  root.WWAMSourceDossierAdapter = Object.freeze({
    VERSION: VERSION,
    build: build,
  });
})(typeof window !== "undefined" ? window : globalThis);
