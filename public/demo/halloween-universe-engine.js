(function (root) {
  "use strict";

  var VERSION = "1.0.0";
  var SCHEMA = "wwam-halloween-universe/v1";
  var YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
  var EVIDENCE = Object.freeze({
    curated: "timestamp-validated-human-curated-candidate",
    machine: "machine-surfaced",
    quarantined: "quarantined-machine-candidate",
    navigation: "topic-navigation-only",
    held: "source-held-no-caption-map"
  });

  function array(value) { return Array.isArray(value) ? value : []; }
  function clean(value) { return String(value == null ? "" : value).trim(); }
  function naturalList(values) {
    var items = array(values).map(clean).filter(Boolean);
    if (items.length < 2) return items[0] || "";
    if (items.length === 2) return items[0] + " or " + items[1];
    return items.slice(0, -1).join(", ") + ", or " + items[items.length - 1];
  }
  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback == null ? 0 : fallback);
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function youtubeUrl(sourceId, start) {
    if (!YOUTUBE_ID.test(clean(sourceId))) return "";
    var url = "https://www.youtube.com/watch?v=" + sourceId;
    return number(start, 0) > 0 ? url + "&t=" + Math.floor(number(start, 0)) + "s" : url;
  }
  function index(items, key) {
    return array(items).reduce(function (map, item) {
      var id = clean(item && item[key]);
      if (id) map[id] = item;
      return map;
    }, Object.create(null));
  }
  function bounded(sourceId, start, end, duration) {
    var from = Math.max(0, number(start, 0));
    var to = Math.max(from + 1, number(end, from + 14));
    if (number(duration, 0) > 0) to = Math.min(to, number(duration, 0));
    return {
      sourceId: sourceId,
      start: from,
      end: to,
      clipSeconds: Math.max(1, to - from),
      url: youtubeUrl(sourceId, from)
    };
  }
  function evidenceLabel(state) {
    var labels = {};
    labels[EVIDENCE.curated] = "TIMESTAMP-CURATED CANDIDATE";
    labels[EVIDENCE.machine] = "TAPE-INDEXED CANDIDATE";
    labels[EVIDENCE.quarantined] = "REVIEW QUEUE";
    labels[EVIDENCE.navigation] = "NAVIGATION ONLY";
    labels[EVIDENCE.held] = "SOURCE HELD";
    return labels[state] || clean(state).toUpperCase() || "EVIDENCE STATE UNKNOWN";
  }

  function buildEditorialDossier(item, enriched, deepTape, moments, topicDoors, references) {
    var topics = array(enriched.topics);
    var topicNames = topics.map(function (topic) { return clean(topic.name); }).filter(Boolean).slice(0, 4);
    var primaryTopic = topicNames[0] || clean(item.film) || "this tape";
    var momentList = array(moments);
    var best = momentList.slice().sort(function (a, b) { return number(b.score, 0) - number(a.score, 0); });
    var topMoment = best[0] || null;
    var detour = best.find(function (moment) { return /OUT OF POCKET|BREAKDOWN|UNHINGED|KILL ROOM/i.test(clean(moment.label || moment.category)); }) || topMoment;
    var legacy = array(enriched.upInYaLegacy);
    var steve = array(enriched.stevesAsshole);
    var lastTopic = topics[topics.length - 1] || null;
    function momentAt(moment) { return number(moment && moment.t, number(moment && moment.start, 0)); }
    var names = Array.from(new Set(array(references).map(function (reference) { return clean(reference.character); }).filter(Boolean)));
    var duration = number(item.duration, 0);
    var durationText = duration >= 3600 ? Math.round(duration / 60) + " minutes" : Math.round(duration / 60) + " minutes";
    var summary = "Come to " + clean(item.film || item.title) + " for the core conversation; the tape keeps widening into " + naturalList(topicNames.length ? topicNames : ["WWAM's side roads"]) + ". " +
      "The index gives you " + momentList.length + " replay point" + (momentList.length === 1 ? "" : "s") + " and " + topicDoors.length + " subject door" + (topicDoors.length === 1 ? "" : "s") + " across a " + durationText + " upload.";
    var evidenceSummary = "Source-bounded read: " + number(enriched.wordsAudited || deepTape.wordsAudited, 0).toLocaleString("en-US") + " caption-mapped words, " + number(enriched.captionEvents, 0).toLocaleString("en-US") + " caption lines, " +
      "and " + names.length + " named character lane" + (names.length === 1 ? "" : "s") + ". Captions can mishear the room, so every take below stays a jump point until the play button confirms it.";
    var lovedBody = clean(enriched.verdict || deepTape.verdict);
    if (!lovedBody) lovedBody = "The source map keeps the strongest defense points close to the film rather than manufacturing a reviewer voice.";
    var hatedItem = steve[0] || null;
    var detourBody = detour ? "The tape swerves into " + clean(detour.category || detour.label || "a high-heat aside") + ": \"" + clean(detour.quote || detour.excerpt) + "\"" : "No distinct detour survived the source map yet.";
    var lastBody = lastTopic ? "The final indexed door is " + clean(lastTopic.name) + ": \"" + clean(lastTopic.receipt) + "\"" : "The source map ends without a separate closing lane.";
    return {
      summary: summary,
      evidenceSummary: evidenceSummary,
      fanRead: {
        loved: { label: "WHAT THE TAPE DEFENDED", body: lovedBody, topic: primaryTopic, excerpt: topMoment ? clean(topMoment.quote || topMoment.excerpt) : "", at: topMoment ? momentAt(topMoment) : null, end: topMoment ? momentAt(topMoment) + 14 : null },
        hated: hatedItem ? { label: "STRAIGHT TO STEVE'S ASSHOLE", body: clean(hatedItem.excerpt || hatedItem.quote), topic: clean(hatedItem.category || "REVIEW QUEUE"), excerpt: clean(hatedItem.excerpt || hatedItem.quote), at: number(hatedItem.t, 0), end: number(hatedItem.t, 0) + 14 } : { label: "STRAIGHT TO STEVE'S ASSHOLE", body: "No source-backed Steve's Asshole candidate is cleared in this cut. The chute stays empty until a listen earns it." },
        wildestDetour: { label: "WILDEST DETOUR", body: detourBody, topic: detour ? clean(detour.category || detour.label) : "SOURCE MAP", excerpt: detour ? clean(detour.quote || detour.excerpt) : "", at: detour ? momentAt(detour) : null, end: detour ? momentAt(detour) + 14 : null },
        lastWord: { label: "THE LAST WORD", body: lastBody, topic: lastTopic ? clean(lastTopic.name) : "SOURCE MAP", excerpt: lastTopic ? clean(lastTopic.receipt) : "", at: lastTopic ? number(lastTopic.first, 0) : null, end: lastTopic ? number(lastTopic.first, 0) + 14 : null }
      },
      laneCounts: {
        "BEST MOMENTS": momentList.length,
        "QUICK JUMPS": topicDoors.length,
        "CHARACTER REFERENCES": references.length,
        "UP IN YA": legacy.length,
        "STRAIGHT TO STEVE'S ASSHOLE": steve.length
      },
      audioPass: false
    };
  }

  function create(options) {
    options = options || {};
    var catalog = array(options.catalog || root.WWAM_CATALOG);
    var deep = options.deep || root.WWAM_DEEP_DISTILL || {};
    var curated = options.curated || root.WWAM_CURATED || root.WWAM_CURATION || {};
    var lore = options.characters || options.characterLore || root.WWAM_CHARACTER_LORE || {};
    var acquired = options.acquired || root.WWAM_HALLOWEEN_ACQUIRED || {};
    var canon = options.canon || root.WWAM_HALLOWEEN_CANON || {};
    var enrichment = options.enrichment || root.WWAM_HALLOWEEN_COMMENTARY_ENRICHMENT || {};
    var dossierPayload = options.sourceDossierData || options.sourceDossier || root.WWAM_SOURCE_DOSSIER || {};
    var dossierSources = index(dossierPayload.sources, "id");
    var deepById = index(deep.tapes, "id");
    var enrichmentById = index(enrichment.records, "id");
    var acquiredById = index(acquired.streams, "id");

    var coreCatalog = catalog.filter(function (item) {
      return clean(item.franchise).toLowerCase() === "halloween";
    }).sort(function (a, b) { return number(a.order, 99) - number(b.order, 99); });
    var coreIds = new Set(coreCatalog.map(function (item) { return item.id; }));

    var curatedUp = array(curated.upInYa).filter(function (item) {
      return coreIds.has(clean(item.id));
    });

    function coreMoment(sourceId, moment, duration) {
      var play = bounded(sourceId, moment.t, number(moment.t, 0) + 14, duration);
      return Object.assign({
        id: clean(moment.id) || sourceId + "-" + Math.floor(play.start),
        kind: "moment",
        label: clean(moment.category) || "SOURCE MOMENT",
        excerpt: clean(moment.quote || moment.excerpt),
        score: number(moment.score || moment.heat, 0),
        evidenceState: EVIDENCE.machine,
        evidenceLabel: evidenceLabel(EVIDENCE.machine),
        speakerStatus: "not-diarized",
        playable: true
      }, play);
    }

    function variant(stream) {
      var restricted = Boolean(stream.rightsPolicy && stream.rightsPolicy.restrictedToTopicNavigation);
      var anchors = array(stream.anchorReceipts).map(function (anchor, i) {
        return Object.assign({
          id: stream.id + "-anchor-" + i,
          kind: "lineage-anchor",
          label: clean(anchor.label || anchor.category) || "VERSION RECEIPT",
          excerpt: clean(anchor.excerpt),
          evidenceState: EVIDENCE.machine,
          evidenceLabel: evidenceLabel(EVIDENCE.machine),
          speakerStatus: "not-diarized",
          playable: !restricted
        }, bounded(stream.id, anchor.t, number(anchor.t, 0) + 14, stream.duration));
      });
      return {
        id: stream.id,
        sourceId: stream.id,
        title: clean(stream.title),
        film: clean(stream.lineage && stream.lineage.film),
        version: clean(stream.lineage && stream.lineage.version) || "Additional treatment",
        compareTo: clean(stream.lineage && stream.lineage.compareTo),
        date: clean(stream.date),
        duration: number(stream.duration, 0),
        thumbnail: clean(stream.thumbnail),
        url: youtubeUrl(stream.id),
        summary: clean(stream.summary),
        anchors: anchors,
        evidenceState: restricted ? EVIDENCE.navigation : EVIDENCE.machine,
        evidenceLabel: evidenceLabel(restricted ? EVIDENCE.navigation : EVIDENCE.machine),
        playable: !restricted
      };
    }

    var variants = array(acquired.streams).filter(function (stream) {
      return stream.lineage && clean(stream.lineage.compareTo);
    }).map(variant);

    var films = coreCatalog.map(function (item) {
      var deepTape = deepById[item.id] || {};
      var enriched = enrichmentById[item.id] || {};
      var held = !item.transcript || clean(item.availability) === "needs_auth";
      var sourceMoments = array(enriched.bestMoments).length ? enriched.bestMoments : array(deepTape.moments);
      var moments = held ? [] : sourceMoments.map(function (moment) {
        return coreMoment(item.id, moment, item.duration);
      });
      var topicDoors = held ? [] : array(enriched.topics).map(function (topic, i) {
        return Object.assign({
          id: item.id + "-topic-" + i,
          kind: "topic-door",
          label: clean(topic.name) || "TOPIC DOOR",
          excerpt: clean(topic.receipt),
          mentions: number(topic.mentions, 0),
          evidenceState: EVIDENCE.navigation,
          evidenceLabel: evidenceLabel(EVIDENCE.navigation),
          speakerStatus: "not-diarized",
          playable: true
        }, bounded(item.id, topic.first, number(topic.first, 0) + 14, item.duration));
      });
      var references = held ? [] : array(enriched.characters).map(function (character, i) {
        return Object.assign({
          id: item.id + "-reference-" + i,
          kind: "character-reference",
          label: clean(character.character) + " REFERENCE LANE",
          character: clean(character.character),
          excerpt: clean(character.receipt),
          mentions: number(character.mentions, 0),
          evidenceState: EVIDENCE.navigation,
          evidenceLabel: evidenceLabel(EVIDENCE.navigation),
          performanceStatus: "not-established",
          playable: true
        }, bounded(item.id, character.t, number(character.t, 0) + 14, item.duration));
      });
      var filmUp = curatedUp.filter(function (entry) { return entry.id === item.id; });
      return {
        id: item.id,
        sourceId: item.id,
        order: number(item.order, 0),
        film: clean(item.film),
        title: clean(item.title),
        date: clean(item.date),
        duration: number(item.duration, 0),
        views: number(item.views, 0),
        thumbnail: clean(item.thumbnail),
        url: youtubeUrl(item.id),
        transcript: Boolean(item.transcript),
        access: held ? "held" : "caption-backed",
        evidenceState: held ? EVIDENCE.held : EVIDENCE.machine,
        evidenceLabel: evidenceLabel(held ? EVIDENCE.held : EVIDENCE.machine),
        summary: held ? "The official source remains linked, but no defensible caption map is available." : (clean(enriched.summary || deepTape.verdict) || "Caption-backed commentary dossier."),
        verdict: held ? "" : clean(enriched.verdict || deepTape.verdict),
        editorialDossier: held ? null : (enriched.dossier ? {
          summary: clean(enriched.dossier.summary),
          evidenceSummary: clean(enriched.dossier.evidenceSummary),
          fanRead: enriched.dossier.fanRead ? clone(enriched.dossier.fanRead) : {},
          laneCounts: enriched.dossier.laneCounts ? clone(enriched.dossier.laneCounts) : {},
          audioPass: /audio-feature pass/i.test(clean(enriched.dossier.summary || enriched.dossier.evidenceSummary))
        } : buildEditorialDossier(item, enriched, deepTape, moments, topicDoors, references)),
        unhinged: held ? 0 : number(enriched.unhinged || deepTape.unhinged, 0),
        wordsAudited: number(enriched.wordsAudited || deepTape.wordsAudited, 0),
        captionEvents: number(enriched.captionEvents, 0),
        moments: moments,
        topicDoors: topicDoors,
        characterReferences: references,
        upInYaCount: filmUp.length,
        variants: variants.filter(function (entry) { return entry.compareTo === item.id; }),
        sourceDossier: dossierSources[item.id] ? {
          coverage: clean(dossierSources[item.id].coverage),
          warnings: array(dossierSources[item.id].warnings),
          metrics: dossierSources[item.id].metrics || null
        } : null
      };
    });

    var callbacks = array(lore.characters).filter(function (profile) {
      return profile.id === "loomis" || profile.id === "challis";
    }).flatMap(function (profile) {
      return array(profile.soundbytes).map(function (soundbyte) {
        var start = number(soundbyte.playback && soundbyte.playback.start, soundbyte.t);
        var end = number(soundbyte.playback && soundbyte.playback.end, start + 14);
        return Object.assign({
          id: soundbyte.id,
          kind: "character-performance",
          characterId: profile.id,
          character: clean(profile.name),
          performedBy: clean(profile.performedBy),
          label: clean(soundbyte.note || soundbyte.trigger) || clean(profile.name) + " CALLBACK",
          excerpt: clean(soundbyte.excerpt),
          sourceTitle: clean(soundbyte.sourceTitle),
          date: clean(soundbyte.date),
          evidenceState: EVIDENCE.curated,
          evidenceLabel: evidenceLabel(EVIDENCE.curated),
          classification: clean(soundbyte.classification),
          speakerStatus: "owner-mapped; clip audio not diarized",
          playable: true
        }, bounded(soundbyte.sourceId, start, end));
      });
    });

    var upInYa = curatedUp.map(function (entry, i) {
      var tape = deepById[entry.id] || {};
      var sourceMoment = array(tape.moments).find(function (moment) {
        return Math.abs(number(moment.t, -9999) - number(entry.t, 0)) < 1;
      }) || {};
      var film = films.find(function (record) { return record.id === entry.id; });
      return Object.assign({
        id: entry.id + "-up-" + i,
        kind: "up-in-ya",
        film: film ? film.film : "Halloween",
        label: clean(entry.label) || "WWAM UP IN YA",
        excerpt: clean(sourceMoment.quote || sourceMoment.excerpt),
        evidenceState: EVIDENCE.curated,
        evidenceLabel: evidenceLabel(EVIDENCE.curated),
        speakerStatus: "not-diarized",
        playable: true
      }, bounded(entry.id, entry.t, number(entry.t, 0) + 14, film && film.duration));
    });

    var strictSteve = array(enrichment.records).flatMap(function (record) {
      return array(record.stevesAsshole).map(function (moment, i) {
        return Object.assign({
          id: record.id + "-steve-" + i,
          kind: "steve-review-candidate",
          film: clean(record.film),
          label: "STRAIGHT TO STEVE'S ASSHOLE // REVIEW CANDIDATE",
          excerpt: clean(moment.excerpt || moment.quote),
          evidenceState: EVIDENCE.quarantined,
          evidenceLabel: evidenceLabel(EVIDENCE.quarantined),
          speakerStatus: "not-diarized",
          reviewRequired: true,
          playable: true
        }, bounded(record.id, moment.t, number(moment.t, 0) + 14, record.duration));
      });
    });

    var acquiredSteve = array(acquired.streams).flatMap(function (stream) {
      if (stream.lineage) return [];
      return array(stream.stevesAsshole).map(function (moment, i) {
        return Object.assign({
          id: stream.id + "-satellite-steve-" + i,
          kind: "steve-review-candidate",
          film: "Halloween topic stream",
          label: "POSSIBLE NEGATIVE TAKE // CONTEXT REVIEW NEEDED",
          excerpt: clean(moment.excerpt),
          evidenceState: EVIDENCE.quarantined,
          evidenceLabel: evidenceLabel(EVIDENCE.quarantined),
          speakerStatus: "not-diarized",
          reviewRequired: true,
          playable: true
        }, bounded(stream.id, moment.t, number(moment.t, 0) + 14, stream.duration));
      });
    });
    var canonSteve = array(canon.sources).flatMap(function (source) {
      return array(source.stevesAsshole).map(function (moment, i) {
        return Object.assign({ id: source.id + "-canon-steve-" + i, kind: "steve-review-candidate", film: clean(source.displayTitle || source.title), label: "STRAIGHT TO STEVE'S ASSHOLE // STRICT REVIEW CANDIDATE", excerpt: clean(moment.excerpt), evidenceState: EVIDENCE.quarantined, evidenceLabel: evidenceLabel(EVIDENCE.quarantined), speakerStatus: "not-diarized", reviewRequired: true, playable: true }, bounded(source.id, moment.t, number(moment.t, 0) + 14, source.duration));
      });
    });
    var steveSeen = Object.create(null);
    var steveQueue = canonSteve.concat(strictSteve, acquiredSteve).filter(function (item) {
      var key = item.sourceId + "@" + Math.floor(item.start);
      if (steveSeen[key]) return false;
      steveSeen[key] = true;
      return true;
    });

    var satellites = array(acquired.streams).filter(function (stream) { return !stream.lineage; }).map(function (stream) {
      var restricted = Boolean(stream.rightsPolicy && stream.rightsPolicy.restrictedToTopicNavigation);
      return {
        id: stream.id,
        sourceId: stream.id,
        kind: "halloween-source",
        title: clean(stream.title),
        date: clean(stream.date),
        duration: number(stream.duration, 0),
        thumbnail: clean(stream.thumbnail),
        url: youtubeUrl(stream.id),
        summary: clean(stream.summary),
        sourceType: clean(stream.sourceType),
        topics: array(stream.topics).map(function (topic) {
          return { name: clean(topic.name), mentions: number(topic.mentions, 0), start: number(topic.first, 0) };
        }),
        moments: restricted ? [] : array(stream.moments).map(function (moment) {
          var value = coreMoment(stream.id, moment, stream.duration);
          value.evidenceState = EVIDENCE.quarantined;
          value.evidenceLabel = evidenceLabel(EVIDENCE.quarantined);
          return value;
        }),
        evidenceState: restricted ? EVIDENCE.navigation : EVIDENCE.quarantined,
        evidenceLabel: evidenceLabel(restricted ? EVIDENCE.navigation : EVIDENCE.quarantined),
        playable: true
      };
    });

    var satelliteById = index(satellites, "id");
    var canonCards = array(canon.sources).map(function (source) {
      var overlay = satelliteById[source.id] || null;
      var coverage = clean(source.coverage);
      var state = /topic-navigation/i.test(coverage) ? EVIDENCE.navigation : (/caption/i.test(coverage) ? EVIDENCE.machine : EVIDENCE.held);
      var sourceTopics = overlay && overlay.topics.length ? overlay.topics : array(source.topics).map(function (topic) { return { name: clean(topic.name), mentions: number(topic.mentions, 0), start: number(topic.first, 0) }; });
      var sourceMoments = overlay && overlay.moments.length ? overlay.moments : array(source.bestMoments).map(function (moment) { var mapped = coreMoment(source.id, moment, source.duration); mapped.evidenceState = EVIDENCE.quarantined; mapped.evidenceLabel = evidenceLabel(EVIDENCE.quarantined); return mapped; });
      return { id: source.id, sourceId: source.id, kind: "halloween-source", sourceKind: clean(source.kind), roles: array(source.roles), title: clean(source.displayTitle || source.title), date: clean(source.date), duration: number(source.duration, 0), views: number(source.views, 0), thumbnail: clean(source.thumbnail), url: youtubeUrl(source.id), summary: overlay ? overlay.summary : (clean(source.summary) || ("Official WWAM Halloween source indexed as " + clean(source.kind || "archive source") + ". " + clean(source.sourceBasis))), sourceType: overlay ? overlay.sourceType : clean(source.kind), topics: sourceTopics, moments: sourceMoments, upInYaCandidateCount: array(source.upInYa).length, strictSteveCandidateCount: array(source.stevesAsshole).length, wordsAudited: number(source.wordsAudited, 0), coverage: coverage, evidenceState: state, evidenceLabel: clean(source.evidenceLabel) || evidenceLabel(state), playable: true };
    });
    if (!canonCards.length) canonCards = satellites.slice();

    var lineages = variants.map(function (entry) {
      var base = films.find(function (film) { return film.id === entry.compareTo; });
      return Object.assign({}, entry, { baseFilm: base ? base.film : entry.film });
    });

    var paths = [
      { id: "core-commentaries", label: "THE 13-TAPE RUN", description: "Every core Halloween commentary in series order; the age-held source stays visible without invented receipts.", items: films },
      { id: "alternate-cuts", label: "CUTS & MIDNIGHT REPEATS", description: "Version-aware lineages keep the theatrical Halloween 6 tape and 2019 Halloween (1978) repeat distinct.", items: lineages },
      { id: "doctors-on-call", label: "DOCTORS ON CALL", description: "Exact Loomis and Challis performance candidates from the recurring-character library.", items: callbacks },
      { id: "up-in-ya", label: "WWAM UP IN YA", description: "Seven human-selected Halloween commentary soundbytes with bounded source playback.", items: upInYa },
      { id: "steve-review", label: "STEVE'S REVIEW QUEUE", description: "Negative-language candidates only. Every item remains unverified until its local context is reviewed.", items: steveQueue },
      { id: "haddonfield-airwaves", label: "THE COMPLETE HALLOWEEN CANON", description: "Every direct official Halloween source in the current archive ledger: watchalongs, reviews, guests, rankings, scripts, trailers, news, theories, and lore.", items: canonCards }
    ];

    var searchable = [];
    films.forEach(function (film) {
      searchable.push({ kind: "film", id: film.id, title: film.film, text: [film.title, film.summary, film.verdict].join(" "), item: film });
      film.moments.concat(film.topicDoors, film.characterReferences).forEach(function (item) {
        searchable.push({ kind: item.kind, id: item.id, title: item.label, text: [film.film, item.excerpt].join(" "), item: item });
      });
    });
    callbacks.forEach(function (item) { searchable.push({ kind: item.kind, id: item.id, title: item.character + " // " + item.label, text: item.excerpt, item: item }); });
    upInYa.forEach(function (item) { searchable.push({ kind: item.kind, id: item.id, title: item.label, text: item.film + " " + item.excerpt, item: item }); });
    steveQueue.forEach(function (item) { searchable.push({ kind: item.kind, id: item.id, title: item.label, text: item.film + " " + item.excerpt, item: item }); });
    lineages.forEach(function (item) { searchable.push({ kind: "lineage", id: item.id, title: item.baseFilm + " // " + item.version, text: item.title + " " + item.summary + " " + item.anchors.map(function (anchor) { return anchor.label + " " + anchor.excerpt; }).join(" "), item: item }); });
    canonCards.forEach(function (item) { searchable.push({ kind: item.kind, id: item.id, title: item.title, text: item.summary + " " + item.sourceKind + " " + item.roles.join(" ") + " " + item.topics.map(function (topic) { return topic.name; }).join(" "), item: item }); });

    function search(query, limit) {
      var phrase = clean(query).toLowerCase();
      if (!phrase) return [];
      var tokens = phrase.split(/\s+/).filter(Boolean);
      return searchable.map(function (record, order) {
        var title = clean(record.title).toLowerCase();
        var haystack = (title + " " + clean(record.text) + " " + clean(record.id)).toLowerCase();
        var score = title === phrase ? 100 : (title.indexOf(phrase) >= 0 ? 60 : 0);
        tokens.forEach(function (token) { if (haystack.indexOf(token) >= 0) score += 10; });
        return { score: score, order: order, kind: record.kind, id: record.id, title: record.title, item: record.item };
      }).filter(function (record) { return record.score > 0; })
        .sort(function (a, b) { return b.score - a.score || a.order - b.order; })
        .slice(0, Math.max(1, number(limit, 24)))
        .map(function (record) { return clone(record); });
    }

    function summary() {
      return {
        schema: SCHEMA,
        version: VERSION,
        films: films.length,
        captionBackedFilms: films.filter(function (film) { return film.access === "caption-backed"; }).length,
        heldFilms: films.filter(function (film) { return film.access === "held"; }).length,
        auditedWords: films.reduce(function (total, film) { return total + film.wordsAudited; }, 0),
        topicDoors: films.reduce(function (total, film) { return total + film.topicDoors.length; }, 0),
        characterReferenceMentions: films.reduce(function (total, film) {
          return total + film.characterReferences.reduce(function (sum, lane) { return sum + lane.mentions; }, 0);
        }, 0),
        characterCallbacks: callbacks.length,
        loomisCallbacks: callbacks.filter(function (item) { return item.characterId === "loomis"; }).length,
        challisCallbacks: callbacks.filter(function (item) { return item.characterId === "challis"; }).length,
        upInYa: upInYa.length,
        strictSteveCandidates: canonSteve.length || strictSteve.length,
        coreStrictSteveCandidates: strictSteve.length,
        canonStrictSteveCandidates: canonSteve.length,
        steveReviewQueue: steveQueue.length,
        alternateTreatments: lineages.length,
        acquiredSources: satellites.length,
        canonSources: canonCards.length,
        watchalongVersions: number(canon.meta && canon.meta.watchalongVersions, lineages.length + films.length),
        crossoverSources: number(canon.meta && canon.meta.crossoverSources, 0),
        canonWordsAudited: canonCards.reduce(function (total, item) { return total + item.wordsAudited; }, 0),
        canonMomentCandidates: canonCards.reduce(function (total, item) { return total + item.moments.length; }, 0),
        sourceDossierMatches: films.filter(function (film) { return film.sourceDossier; }).length
      };
    }

    function verify() {
      var errors = [];
      var warnings = [];
      if (films.length !== 13) errors.push("Expected 13 core Halloween films; found " + films.length + ".");
      if (callbacks.length < 30) errors.push("Expected at least 30 Loomis/Challis callbacks; found " + callbacks.length + ".");
      if (upInYa.length !== 7) errors.push("Expected 7 curated Halloween Up In Ya clips; found " + upInYa.length + ".");
      if (lineages.length < 2) errors.push("Expected both alternate/repeat lineages.");
      films.concat(callbacks, upInYa, steveQueue, lineages, satellites).forEach(function (item) {
        var sourceId = item.sourceId || item.id;
        if (!YOUTUBE_ID.test(clean(sourceId))) errors.push("Invalid source id: " + clean(sourceId));
        if (item.playable && !clean(item.url).startsWith("https://www.youtube.com/watch?v=")) errors.push("Invalid playable URL for " + clean(item.id));
        if (item.start != null && number(item.end, 0) <= number(item.start, 0)) errors.push("Invalid clip bounds for " + clean(item.id));
      });
      if (canon.sources && canonCards.length < 79) errors.push("Halloween canon ledger fell below 79 direct sources.");
      if (canon.sources && canonSteve.length !== 8) errors.push("Expected 8 strict canon Steve coordinates; found " + canonSteve.length + ".");
      if (!enrichment.records) warnings.push("Commentary enrichment is absent; scene doors are reduced.");
      if (!acquired.streams) warnings.push("Acquired Halloween overlay is absent; alternate paths are reduced.");
      if (!films.some(function (film) { return film.id === "AzrcgoyE7C4" && film.access === "held"; })) errors.push("Age-held Rob Zombie H2 boundary was lost.");
      return { ok: errors.length === 0, errors: errors, warnings: warnings, summary: summary() };
    }

    return Object.freeze({
      version: VERSION,
      schema: SCHEMA,
      evidence: EVIDENCE,
      evidenceLabel: evidenceLabel,
      summary: summary,
      verify: verify,
      listFilms: function () { return clone(films); },
      getFilm: function (id) { var found = films.find(function (film) { return film.id === id; }); return found ? clone(found) : null; },
      listPaths: function () { return clone(paths); },
      getPath: function (id) { var found = paths.find(function (path) { return path.id === id; }); return found ? clone(found) : null; },
      listCallbacks: function (characterId) { return clone(characterId ? callbacks.filter(function (item) { return item.characterId === characterId; }) : callbacks); },
      listUpInYa: function () { return clone(upInYa); },
      listSteveQueue: function () { return clone(steveQueue); },
      listSatellites: function () { return clone(satellites); },
      listCanonSources: function () { return clone(canonCards); },
      listLineages: function () { return clone(lineages); },
      search: search
    });
  }

  root.WWAMHalloweenUniverseEngine = Object.freeze({ VERSION: VERSION, SCHEMA: SCHEMA, create: create });
})(typeof window !== "undefined" ? window : globalThis);
