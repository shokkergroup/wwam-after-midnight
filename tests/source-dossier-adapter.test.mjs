import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  [
    "catalog.js",
    "deep-distill.js",
    "episode-guides.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "creator-studio-engine.js",
    "archive-atlas-data.js",
    "archive-deep-distill.js",
    "archive-deep-batch2.js",
    "archive-deep-batch3.js",
    "archive-deep-batch4.js",
    "archive-deep-engine.js",
    "archive-deep-portfolio.js",
    "year-canon-2025-2026.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "source-query-engine.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

function buildFixture() {
  const window = load();
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const clipLab = window.WWAMCreatorClipLab.create({ showcase });
  const archiveDeepBase = window.WWAMArchiveDeepPortfolio.create(
    [
      window.WWAM_ARCHIVE_DEEP,
      window.WWAM_ARCHIVE_DEEP_BATCH2,
      window.WWAM_ARCHIVE_DEEP_BATCH3,
      window.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    window.WWAMArchiveDeepEngine,
  );
  const archiveSearchBase = archiveDeepBase.getSearchPayload();
  const archiveSearch = Object.assign({}, archiveSearchBase, {
    streams: archiveSearchBase.streams.concat(window.WWAM_YEAR_CANON_2025_2026.streams),
    topicIndex: archiveSearchBase.topicIndex.concat(window.WWAM_YEAR_CANON_2025_2026.topicIndex),
    characterIndex: archiveSearchBase.characterIndex.concat(
      window.WWAM_YEAR_CANON_2025_2026.characterIndex,
    ),
  });
  const archiveDeep = {
    getSearchPayload() { return archiveSearch; },
  };
  const input = {
    atlas: window.WWAM_ARCHIVE_ATLAS,
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    episodeGuides: window.WWAM_EPISODE_GUIDES,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: archiveDeep,
    showcase,
    clipLab,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:test-fixture",
    },
  };
  return {
    window,
    showcase,
    clipLab,
    archiveDeep,
    input,
    result: window.WWAMSourceDossierAdapter.build(input),
  };
}

function byId(result, id) {
  const source = result.sources.find((item) => item.id === id);
  assert.ok(source, id);
  return source;
}

function countBy(values, field) {
  return values.reduce((counts, value) => {
    counts[value[field]] = (counts[value[field]] || 0) + 1;
    return counts;
  }, {});
}

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

test("adapter exposes the universal schema and exact 510-source WWAM union", () => {
  const { window, result } = buildFixture();

  assert.equal(window.WWAMSourceDossierAdapter.VERSION, "1.7.0");
  assert.deepEqual(Object.keys(result), [
    "schema",
    "channel",
    "snapshotDate",
    "sources",
  ]);
  assert.equal(result.schema, "shokker-source-dossier-input/v1");
  assert.deepEqual(plain(result.channel), {
    id: "wwam",
    label: "We Watched A Movie",
    product: "WWAM After Midnight",
    packFingerprint: "fnv1a32:test-fixture",
  });
  assert.equal(result.snapshotDate, "2026-07-23");
  assert.equal(result.sources.length, 510);
  assert.equal(new Set(result.sources.map((source) => source.id)).size, 510);

  assert.equal(
    result.sources.filter((source) => source.lanes.includes("streams-feed")).length,
    472,
  );
  assert.equal(
    result.sources.filter((source) => source.lanes.includes("commentary-catalog")).length,
    39,
  );
  assert.deepEqual(
    plain(byId(result, "3wK00_-K-Y0").lanes),
    ["commentary-catalog", "streams-feed"],
  );
  assert.deepEqual(countBy(result.sources, "coverage"), {
    "caption-backed": 209,
    "caption-limited": 9,
    "metadata-only": 292,
  });
  assert.deepEqual(countBy(result.sources, "authority"), {
    "promoted-lane": 74,
    "quarantined-lane": 138,
    "source-only": 298,
  });
});

test("Ask This Tape stays on the exact canonical WWAM upload across title collisions and evidence gaps", () => {
  const { window, result } = buildFixture();
  const dossierEngine = window.ShokkerSourceDossier.create(result);
  const queryEngine = window.ShokkerSourceQuery.create({ dossierEngine });
  const request = (sourceId, query) => ({
    schema: "shokker-source-query/v1",
    sourceId,
    query,
    limit: 8,
  });

  const loomis = queryEngine.answer(
    request("LV2rmwEA0w4", "Show me the Dr. Loomis moments in this tape."),
  );
  assert.equal(loomis.status, "supported");
  assert.ok(loomis.results.every((item) => item.sourceId === "LV2rmwEA0w4"));
  assert.deepEqual(
    plain(
      loomis.results
        .filter((item) => item.type === "receipt")
        .map((item) => [item.key, item.at, item.end]),
    ),
    [
      ["character-receipt:loomis-funding", 9042.64, 9056.64],
      ["character-receipt:loomis-pepto", 10734.88, 10748.88],
    ],
  );

  const challis = queryEngine.answer(
    request("ag3axSC9BpU", "Show me the Dr. Challis moments in this tape."),
  );
  assert.equal(challis.status, "supported");
  assert.ok(challis.results.every((item) => item.sourceId === "ag3axSC9BpU"));
  assert.deepEqual(
    plain(
      challis.results
        .filter((item) => item.type === "receipt")
        .map((item) => [item.key, item.at]),
    ),
    [
      ["character-receipt:challis-miguel", 3860.72],
      ["character-receipt:challis-doctor", 9851.76],
    ],
  );

  const metadataOnly = queryEngine.answer(
    request("RzSxi8rVQGI", "Who won the Marvel versus DC bracket?"),
  );
  assert.equal(metadataOnly.status, "metadata-only");
  assert.equal(metadataOnly.resultCount, 0);

  const captionLimited = queryEngine.answer(
    request("x6tvsGRHgU0", "What topics are indexed in this tape?"),
  );
  assert.equal(captionLimited.status, "caption-limited");
  assert.equal(captionLimited.resultCount, 0);

  const wrongSource = queryEngine.answer(
    request("RzSxi8rVQGI", "Show me Superman receipts."),
  );
  assert.equal(wrongSource.status, "metadata-only");
  assert.equal(wrongSource.resultCount, 0);
  assert.equal(wrongSource.boundary.crossSourceSubstitution, false);

  const brief = queryEngine.answer(
    request("RzSxi8rVQGI", "What can you prove about this show?"),
  );
  assert.equal(brief.status, "supported");
  assert.equal(brief.intent, "episode-brief");
  assert.equal(brief.episode.kind, "brief");
  assert.equal(brief.results[0].field, "registered-source-brief");
  assert.equal(brief.results[0].contentClaim, false);
  assert.equal(brief.results[0].value.scope, "canonical-source-metadata-only");

  const briefInventory = queryEngine.answer(
    request("RzSxi8rVQGI", "What is actually indexed in this tape?"),
  );
  assert.equal(briefInventory.status, "inventory");
  assert.equal(briefInventory.results[0].value.sourceBriefAvailable, true);

  const refusedSummary = queryEngine.answer(
    request("RzSxi8rVQGI", "Summarize this show."),
  );
  assert.equal(refusedSummary.status, "metadata-only");
  assert.equal(refusedSummary.resultCount, 0);

  const receiptTimes = (answer) => answer.results
    .filter((item) => item.type === "receipt")
    .map((item) => Math.round(item.at));
  const laneAnswer = (sourceId, query, laneId, expectedTimes) => {
    const answer = queryEngine.answer(request(sourceId, query));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.intent, "episode-lane", query);
    assert.equal(answer.episode.id, laneId, query);
    assert.deepEqual(plain(receiptTimes(answer)), expectedTimes, query);
    assert.ok(answer.results.every((item) => item.sourceId === sourceId), query);
    return answer;
  };
  const richId = "Z7ArdfA054w";
  laneAnswer(
    richId,
    "Can I see the best moments?",
    "best-moments",
    [3644, 7358, 1730, 2308, 7780, 4894],
  );
  laneAnswer(
    richId,
    "Can I see the funny moments?",
    "funny-moments",
    [3644, 7358, 1730, 2308, 7780],
  );
  laneAnswer(
    richId,
    "Can you show me the WWAM UP IN YA moments?",
    "up-in-ya",
    [2308, 7780],
  );
  laneAnswer(
    richId,
    "What got sent straight to Steve's asshole?",
    "straight-to-steves-asshole",
    [4894],
  );
  const topics = queryEngine.answer(
    request(richId, "Did they talk about any topics?"),
  );
  assert.equal(topics.status, "supported");
  assert.equal(topics.episode.id, "topics");
  assert.equal(topics.episode.totalReceipts, 10);
  assert.equal(topics.episode.shownReceipts, 8);
  laneAnswer(
    richId,
    "Were there any character impressions?",
    "character-bits",
    [836, 6598, 7128],
  );
  laneAnswer(
    richId,
    "What was the craziest thing they said?",
    "up-in-ya",
    [2308, 7780],
  );
  laneAnswer(
    richId,
    "Give me the episode highlights",
    "best-moments",
    [3644, 7358, 1730, 2308, 7780, 4894],
  );
  laneAnswer(
    "ThPjds8iI9U",
    "Can I see the best moments?",
    "best-moments",
    [845, 997, 1419, 3804, 3004, 3740],
  );
  const topicOnly = queryEngine.answer(
    request("M3P4mMDpXUc", "Can you show me the topics?"),
  );
  assert.equal(topicOnly.status, "supported");
  assert.equal(topicOnly.episode.id, "topics");
  assert.equal(topicOnly.episode.totalReceipts, 10);
  assert.equal(topicOnly.episode.shownReceipts, 8);

  const falseBestSubject = queryEngine.answer(
    request(richId, "best moments about Ghostface"),
  );
  assert.equal(falseBestSubject.status, "insufficient-evidence");
  assert.equal(falseBestSubject.resultCount, 0);
  const alienTopics = queryEngine.answer(
    request(richId, "topics about Alien"),
  );
  assert.equal(alienTopics.status, "supported");
  assert.ok(alienTopics.results.every((item) =>
    item.type !== "receipt" || /alien/i.test(item.label + " " + item.excerpt)));
  const wrongCharacter = queryEngine.answer(
    request(richId, "character impressions with Loomis"),
  );
  assert.equal(wrongCharacter.status, "insufficient-evidence");
  assert.equal(wrongCharacter.resultCount, 0);
});

test("all dossiers retain canonical metadata and fail honest outside caption evidence", () => {
  const { result, window } = buildFixture();
  const receiptKeys = new Set();
  const evidenceTypes = new Set([
    "caption-excerpt",
    "caption-topic-receipt",
    "caption-topic-navigation",
    "caption-character-signal",
    "caption-character-context",
    "curated-character-performance",
  ]);
  const entityBases = new Set(window.ShokkerSourceDossier.ENTITY_BASIS);

  result.sources.forEach((source) => {
    assert.ok(source.id);
    assert.ok(source.title);
    assert.ok(source.displayTitle);
    assert.match(source.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(source.duration) && source.duration >= 0);
    assert.ok(Number.isFinite(source.views) && source.views >= 0);
    assert.ok(source.thumbnail.includes(source.id));
    assert.equal(source.url, `https://www.youtube.com/watch?v=${source.id}`);
    assert.ok(Array.isArray(source.lanes) && source.lanes.length > 0);
    assert.ok(Array.isArray(source.artifacts));
    assert.equal(source.rightsPolicy.promotionAllowed, false);
    assert.equal(source.rightsPolicy.speakerClaimsAllowed, false);
    assert.equal(source.rightsPolicy.originClaimsAllowed, false);
    assert.equal(source.rightsPolicy.visualClaimsAllowed, false);

    if (source.coverage === "metadata-only" ||
        source.coverage === "caption-limited") {
      assert.equal(source.summary, null, source.id);
      assert.equal(source.receipts.length, 0, source.id);
      assert.equal(source.metrics.receiptCount, 0, source.id);
      assert.equal(source.metrics.heatSegments, 0, source.id);
    }

    source.receipts.forEach((receipt) => {
      assert.ok(receipt.key, source.id);
      assert.ok(!receiptKeys.has(receipt.key), receipt.key);
      receiptKeys.add(receipt.key);
      assert.ok(receipt.at >= 0 && receipt.at <= source.duration, receipt.key);
      assert.ok(
        receipt.end === null ||
        (receipt.end >= receipt.at && receipt.end <= source.duration),
        receipt.key,
      );
      assert.ok(wordCount(receipt.excerpt) <= 16, receipt.key);
      assert.equal(receipt.speaker, null);
      assert.equal(receipt.speakerStatus, "not-diarized");
      assert.equal(receipt.promotionAllowed, false);
      assert.ok(receipt.evidenceBasis);
      assert.ok(Array.isArray(receipt.entityIds));
      assert.ok(evidenceTypes.has(receipt.evidenceType), receipt.evidenceType);
      assert.ok(
        receipt.signalScore === null ||
        (receipt.signalScore >= 0 && receipt.signalScore <= 100),
        receipt.key,
      );
      assert.equal(
        receipt.signalScore === null,
        receipt.signalBasis === null,
        receipt.key,
      );
      assert.ok(receipt.entityIds.every(
        (entityId) => /^[a-z0-9][a-z0-9:_-]{1,159}$/.test(entityId),
      ));
    });
    source.entities.forEach((entity) => {
      assert.ok(entityBases.has(entity.basis), entity.basis);
    });
  });
  assert.equal(receiptKeys.size, 3315);
});

test("every source gets an honest Show Wiki shell with rigorously gated lanes", () => {
  const { result, archiveDeep, window } = buildFixture();
  const laneIds = [
    "topics",
    "best-moments",
    "funny-moments",
    "up-in-ya",
    "straight-to-steves-asshole",
    "character-bits",
  ];
  const formatFor = (source) => {
    const haystack = `${source.title || ""} ${source.displayTitle || ""}`
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (source.sourceType === "commentary" ||
        /\b(?:commentary|watch\s*along)\b/.test(haystack)) {
      return {
        id: "movie-commentary",
        label: "MOVIE COMMENTARY",
        basis: "registered-source-type-and-title",
      };
    }
    if (/\b(?:script\s*(?:read|reading)|table\s*read|screenplay\s*(?:read|reading))\b/.test(haystack)) {
      return { id: "script-reading", label: "SCRIPT READING", basis: "source-title-metadata" };
    }
    if (/\b(?:watch\s*party|live\s*watch|watching\s+.*\s+live)\b/.test(haystack)) {
      return { id: "watch-party", label: "WATCH PARTY", basis: "source-title-metadata" };
    }
    if (/\b(?:ranking|ranked|tier\s*list|royal\s*rumble|tournament|bracket|countdown|top\s+\d+)\b/.test(haystack)) {
      return {
        id: "ranking-show",
        label: "RANKING / BRACKET SHOW",
        basis: "source-title-metadata",
      };
    }
    if (/\b(?:versus|vs\.?|fight|battle)\b/.test(haystack)) {
      return { id: "versus-show", label: "VERSUS / FIGHT SHOW", basis: "source-title-metadata" };
    }
    if (/\b(?:spoiler|ending\s*explained|after\s*party)\b/.test(haystack)) {
      return { id: "spoiler-party", label: "SPOILER PARTY", basis: "source-title-metadata" };
    }
    if (/\b(?:trailer|teaser|first\s*look)\b/.test(haystack)) {
      return { id: "trailer-reaction", label: "TRAILER REACTION", basis: "source-title-metadata" };
    }
    if (/(?:^|\s)q\s*(?:\+|&|and)\s*a(?:\s|$)/.test(haystack) ||
        /\bquestions?\s+and\s+answers?\b/.test(haystack)) {
      return { id: "q-and-a", label: "Q + A", basis: "source-title-metadata" };
    }
    if (/\b(?:interview|special\s+guest|writer|director)\b/.test(haystack)) {
      return {
        id: "interview",
        label: "INTERVIEW / GUEST SHOW",
        basis: "source-title-metadata",
      };
    }
    if (/\b(?:anniversary|birthday\s+special|retrospective)\b/.test(haystack)) {
      return {
        id: "anniversary",
        label: "ANNIVERSARY SPECIAL",
        basis: "source-title-metadata",
      };
    }
    if (/\b(?:news|updates?|breaking|rumors?)\b/.test(haystack)) {
      return { id: "horror-news", label: "HORROR NEWS SHOW", basis: "source-title-metadata" };
    }
    return { id: "livestream", label: "WWAM LIVESTREAM", basis: "registered-source-type" };
  };
  const laneOrderFor = (source) => {
    const formatId = formatFor(source).id;
    if (formatId === "movie-commentary") {
      return [
        "best-moments", "funny-moments", "up-in-ya",
        "straight-to-steves-asshole", "character-bits", "topics",
      ];
    }
    if (formatId === "ranking-show") {
      return [
        "topics", "straight-to-steves-asshole", "best-moments",
        "funny-moments", "up-in-ya", "character-bits",
      ];
    }
    return laneIds;
  };
  const negativeTerms = [
    "never watch", "couldnt stand", "didnt like", "dont like", "not good",
    "hate", "hated", "worst", "awful", "terrible", "trash", "garbage",
    "sucks", "suck", "bad", "stupid", "dumb", "ruined", "boring", "ugly",
  ];
  const targetTerms = [
    "movie", "film", "franchise", "installment", "sequel", "prequel", "remake",
    "reboot", "scene", "sequence", "ending", "opening", "story", "plot", "script",
    "writing", "direction", "directing", "performance", "acting", "score", "music",
    "soundtrack", "shot", "cinematography", "mask", "effect", "effects",
    "dialogue", "pacing", "tone", "design", "edit", "editing", "character",
    "characters", "actor", "actors", "cast", "costume",
  ];
  const negators = new Set([
    "not", "no", "never", "dont", "doesnt", "didnt", "wasnt", "isnt",
    "arent", "cant", "without",
  ]);
  const tokensFor = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const occurrences = (tokens, phrase) => {
    const phraseTokens = tokensFor(phrase);
    const hits = [];
    for (let start = 0; start <= tokens.length - phraseTokens.length; start += 1) {
      if (phraseTokens.every((token, offset) => tokens[start + offset] === token)) {
        hits.push({ term: phrase, start, end: start + phraseTokens.length - 1 });
      }
    }
    return hits;
  };
  const distance = (left, right) => (
    left.end < right.start
      ? right.start - left.end - 1
      : right.end < left.start
        ? left.start - right.end - 1
        : 0
  );
  const negativeGate = (receipt) => {
    if (!["FRANCHISE FELONY", "TAKE GETS NUCLEAR"].includes(receipt.label)) return false;
    const tokens = tokensFor(receipt.excerpt);
    const deniesHate = tokens.some((token, index) => {
      if (token !== "hate" && token !== "hated") return false;
      const previous = tokens[index - 1] || "";
      const next = tokens[index + 1] || "";
      const afterNext = tokens[index + 2] || "";
      return ["dont", "didnt", "not", "never", "doesnt", "isnt", "wasnt"]
        .includes(previous) ||
        (previous === "to" && tokens[index - 2] === "not") ||
        (previous === "not" && tokens[index - 2] === "do") ||
        (next === "to" && ["see", "say", "tell", "admit"].includes(afterNext));
    });
    if (deniesHate) return false;
    const evaluations = negativeTerms.flatMap((term) => occurrences(tokens, term));
    const targets = targetTerms.flatMap((term) => occurrences(tokens, term));
    return evaluations.some((evaluation) => {
      const normalizedTerm = tokensFor(evaluation.term).join(" ");
      const inherentlyNegative = /^(?:not|dont|didnt|couldnt|never)\b/.test(normalizedTerm);
      const prior = tokens.slice(Math.max(0, evaluation.start - 4), evaluation.start);
      if (!inherentlyNegative && prior.some((token) => negators.has(token))) return false;
      return targets.some((target) => distance(evaluation, target) <= 8);
    });
  };
  const comedyCategories = new Set(
    window.WWAM_CHANNEL_DNA.taxonomy.comedySignals,
  );
  const signalOrder = (left, right) => (
    (right.signalScore ?? -1) - (left.signalScore ?? -1) ||
    left.at - right.at ||
    left.key.localeCompare(right.key)
  );
  const evenSample = (values, limit) => {
    const ordered = values.slice().sort((left, right) => (
      left.at - right.at || left.key.localeCompare(right.key)
    ));
    if (ordered.length <= limit) return ordered;
    const sampled = [];
    for (let index = 0; index < limit; index += 1) {
      const offset = Math.round(
        index * (ordered.length - 1) / Math.max(1, limit - 1),
      );
      if (!sampled.includes(ordered[offset])) sampled.push(ordered[offset]);
    }
    return sampled;
  };
  const experienceRoute = (source, moments, topics) => {
    if (!moments.length) return evenSample(topics, 5);
    const remaining = moments.slice().sort(signalOrder);
    const selected = [];
    const labels = new Set();
    while (remaining.length && selected.length < 5) {
      let bestIndex = 0;
      let bestValue = -Infinity;
      remaining.forEach((receipt, index) => {
        const heat = receipt.signalScore == null ? 45 : receipt.signalScore;
        const novelty = labels.has(receipt.label) ? 0 : 20;
        const separation = selected.length
          ? Math.min(...selected.map((chosen) => (
            Math.abs(chosen.at - receipt.at) / Math.max(1, source.duration)
          ))) * 42
          : 0;
        const value = heat + novelty + separation;
        if (value > bestValue ||
            (value === bestValue &&
             (receipt.at < remaining[bestIndex].at ||
              (receipt.at === remaining[bestIndex].at &&
               receipt.key < remaining[bestIndex].key)))) {
          bestIndex = index;
          bestValue = value;
        }
      });
      const chosen = remaining.splice(bestIndex, 1)[0];
      selected.push(chosen);
      labels.add(chosen.label);
    }
    return selected.sort((left, right) => (
      left.at - right.at || left.key.localeCompare(right.key)
    ));
  };
  let upInYaCount = 0;
  let stevesCount = 0;
  let stevesSourceCount = 0;
  let characterCount = 0;
  let characterSourceCount = 0;
  let rejectedNegativeCandidates = 0;
  let distilledRecapCount = 0;
  let topicNavOnlyRecapCount = 0;
  let sourceBriefShowWikiCount = 0;
  let readyMomentRouteCount = 0;
  let readyTopicRouteCount = 0;
  let emptyRouteCount = 0;

  result.sources.forEach((source) => {
    assert.equal(source.showWiki.label, "SHOW WIKI", source.id);
    const actualLaneIds = plain(source.showWiki.lanes.map((lane) => lane.id));
    assert.deepEqual(actualLaneIds, laneOrderFor(source), source.id);
    assert.deepEqual(
      actualLaneIds.slice().sort(),
      laneIds.slice().sort(),
      source.id + ":complete-lane-set",
    );
    assert.equal(
      source.showWiki.status,
      source.coverage === "caption-backed" &&
        Boolean(source.summary || source.receipts.length)
        ? source.receipts.some((receipt) => receipt.kind.includes("topic")) &&
            !source.receipts.some((receipt) => receipt.kind.includes("moment"))
          ? "topic-nav-only"
          : "distilled"
        : "source-brief",
      source.id,
    );

    const localKeys = new Set(source.receipts.map((receipt) => receipt.key));
    source.showWiki.lanes.forEach((lane) => {
      assert.ok(lane.description, source.id + ":" + lane.id);
      assert.ok(lane.emptyState, source.id + ":" + lane.id);
      assert.equal(new Set(lane.receiptKeys).size, lane.receiptKeys.length);
      assert.ok(
        lane.receiptKeys.every((key) => localKeys.has(key)),
        source.id + ":" + lane.id,
      );
    });

    const moments = source.receipts.filter(
      (receipt) => receipt.kind.toLowerCase().includes("moment"),
    ).sort(signalOrder);
    const topics = source.receipts.filter(
      (receipt) => receipt.kind.toLowerCase().includes("topic"),
    );
    const experience = source.showWiki.experience;
    const expectedExperienceId = moments.length
      ? "midnight-cut"
      : topics.length ? "topic-hop" : "source-brief";
    const expectedRouteKeys = experienceRoute(source, moments, topics)
      .map((receipt) => receipt.key);
    const expectedPulseKeys = evenSample(moments.length ? moments : topics, 24)
      .map((receipt) => receipt.key);

    assert.equal(experience.id, expectedExperienceId, source.id);
    assert.equal(
      experience.title,
      moments.length
        ? "THE MIDNIGHT CUT"
        : topics.length ? "THE TOPIC HOP" : "CONTENT ROUTE NOT DISTILLED",
      source.id,
    );
    assert.ok(experience.description, source.id);
    assert.ok(experience.selectionBasis, source.id);
    assert.ok(experience.emptyState, source.id);
    assert.ok(experience.routeReceiptKeys.length <= 5, source.id);
    assert.ok(experience.pulseReceiptKeys.length <= 24, source.id);
    assert.equal(
      new Set(experience.routeReceiptKeys).size,
      experience.routeReceiptKeys.length,
      source.id + ":route-unique",
    );
    assert.equal(
      new Set(experience.pulseReceiptKeys).size,
      experience.pulseReceiptKeys.length,
      source.id + ":pulse-unique",
    );
    assert.ok(
      experience.routeReceiptKeys.every((key) => localKeys.has(key)),
      source.id + ":route-local",
    );
    assert.ok(
      experience.pulseReceiptKeys.every((key) => localKeys.has(key)),
      source.id + ":pulse-local",
    );
    assert.deepEqual(
      plain(experience.routeReceiptKeys),
      plain(expectedRouteKeys),
      source.id + ":exact-route",
    );
    assert.deepEqual(
      plain(experience.pulseReceiptKeys),
      plain(expectedPulseKeys),
      source.id + ":exact-pulse",
    );

    readyMomentRouteCount += Number(
      experience.id === "midnight-cut" && experience.routeReceiptKeys.length > 0,
    );
    readyTopicRouteCount += Number(
      experience.id === "topic-hop" && experience.routeReceiptKeys.length > 0,
    );
    emptyRouteCount += Number(experience.routeReceiptKeys.length === 0);

    if (
      source.showWiki.status === "distilled" ||
      source.showWiki.status === "topic-nav-only"
    ) {
      if (source.showWiki.status === "distilled") distilledRecapCount += 1;
      else topicNavOnlyRecapCount += 1;
      const recap = source.showWiki.recap;
      const expectedFormat = formatFor(source);
      const exactTitle = source.displayTitle || source.title;
      assert.ok(recap, source.id);
      assert.equal(recap.format, expectedFormat.label, source.id);
      assert.equal(recap.formatBasis, expectedFormat.basis, source.id);
      assert.ok(recap.overview.includes(exactTitle), source.id + ":title-specific");
      assert.ok(recap.blocks.length >= 1 && recap.blocks.length <= 3, source.id);
      assert.equal(
        new Set(recap.blocks.map((block) => block.id)).size,
        recap.blocks.length,
        source.id + ":recap-block-ids",
      );
      recap.blocks.forEach((block) => {
        assert.ok(block.id, source.id + ":recap-block-id");
        assert.ok(block.label, source.id + ":recap-block-label");
        assert.ok(block.body, source.id + ":recap-block-body");
        assert.ok(block.basis, source.id + ":recap-block-basis");
        assert.ok(block.receiptKeys.length > 0, source.id + ":recap-bound");
        assert.equal(
          new Set(block.receiptKeys).size,
          block.receiptKeys.length,
          source.id + ":recap-receipts-unique",
        );
        assert.ok(
          block.receiptKeys.every((key) => localKeys.has(key)),
          source.id + ":recap-receipts-local",
        );
      });
      const recapText = [
        recap.format,
        recap.overview,
        ...recap.blocks.flatMap((block) => [block.label, block.body, block.basis]),
      ].join(" ");
      assert.doesNotMatch(recapText, /explicit performance cue/i, source.id);
      assert.equal(source.summary.text, recap.overview, source.id);
      assert.equal(
        source.summary.basis,
        source.showWiki.episodeGuide ?
          "full-caption-episode-guide/v2" : "source-local-format-aware-recap/v1",
        source.id,
      );
      assert.equal(source.showWiki.brief, null, source.id);
    } else {
      sourceBriefShowWikiCount += 1;
      const brief = source.showWiki.brief;
      const expectedBriefFormat = formatFor(source);
      assert.deepEqual(
        plain(Object.keys(brief).sort()),
        ["format", "formatBasis", "kind", "queryAliases", "scope"],
        source.id + ":brief-fields",
      );
      assert.equal(brief.kind, "source-metadata-brief", source.id);
      assert.equal(brief.scope, "canonical-source-metadata-only", source.id);
      assert.equal(brief.format, expectedBriefFormat.label, source.id);
      assert.equal(brief.formatBasis, expectedBriefFormat.basis, source.id);
      assert.deepEqual(
        plain(brief.queryAliases),
        [
          "what can you prove about this show",
          "show source brief",
          "source brief",
          "what is registered",
          "what do you know for sure",
        ],
        source.id + ":brief-aliases",
      );
      assert.equal(source.showWiki.recap, null, source.id);
      assert.equal(source.summary, null, source.id);
      assert.equal(experience.routeReceiptKeys.length, 0, source.id);
      assert.equal(experience.pulseReceiptKeys.length, 0, source.id);
      assert.ok(
        source.showWiki.lanes.every((item) => item.receiptKeys.length === 0),
        source.id,
      );
    }

    const funny = moments.filter(
      (receipt) => comedyCategories.has(receipt.label),
    ).slice(0, 6);
    const upInYa = moments.filter(
      (receipt) => receipt.label === "UP IN YA" ||
        receipt.label === "OUT OF POCKET",
    ).slice(0, 6);
    const steves = moments.filter(negativeGate).slice(0, 6);
    const characters = source.receipts.filter((receipt) => (
      receipt.evidenceType === "caption-character-signal" ||
      receipt.evidenceType === "caption-character-context" ||
      receipt.evidenceType === "curated-character-performance"
    )).sort(signalOrder).slice(0, 6);

    const lane = (id) => source.showWiki.lanes.find((item) => item.id === id);
    assert.deepEqual(plain(lane("topics").receiptKeys), plain(topics.map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("best-moments").receiptKeys), plain(moments.slice(0, 6).map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("funny-moments").receiptKeys), plain(funny.map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("up-in-ya").receiptKeys), plain(upInYa.map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("straight-to-steves-asshole").receiptKeys), plain(steves.map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("character-bits").receiptKeys), plain(characters.map((item) => item.key)), source.id);

    upInYaCount += upInYa.length;
    stevesCount += steves.length;
    stevesSourceCount += Number(steves.length > 0);
    characterCount += characters.length;
    characterSourceCount += Number(characters.length > 0);
    rejectedNegativeCandidates += moments.filter((receipt) => (
      ["FRANCHISE FELONY", "TAKE GETS NUCLEAR"].includes(receipt.label) &&
      !negativeGate(receipt) &&
      !lane("straight-to-steves-asshole").receiptKeys.includes(receipt.key)
    )).length;

    if (source.coverage !== "caption-backed") {
      assert.equal(source.showWiki.status, "source-brief", source.id);
      assert.equal(source.showWiki.experience.id, "source-brief", source.id);
      assert.ok(source.showWiki.lanes.every(
        (item) => item.receiptKeys.length === 0,
      ), source.id);
    }
  });

  assert.equal(distilledRecapCount, 193);
  assert.equal(topicNavOnlyRecapCount, 16);
  assert.equal(sourceBriefShowWikiCount, 301);
  assert.equal(readyMomentRouteCount, 193);
  assert.equal(readyTopicRouteCount, 16);
  assert.equal(emptyRouteCount, 301);
  assert.ok(upInYaCount > 0, "expected exact UP IN YA receipts");
  assert.equal(stevesSourceCount, 29);
  assert.equal(stevesCount, 30);
  assert.equal(characterSourceCount, 126);
  assert.equal(characterCount, 264);
  assert.ok(rejectedNegativeCandidates > 0, "expected strict gate rejections");

  for (const [sourceId, at] of [
    ["vN0kpXks-Lk", 246],
    ["LiTEaN8mpl8", 4711],
    ["ThPjds8iI9U", 3004],
  ]) {
    const source = byId(result, sourceId);
    const candidate = source.receipts.find((receipt) => (
      receipt.kind === "moment" && Math.floor(receipt.at) === at
    ));
    assert.ok(candidate, sourceId + "@" + at);
    assert.equal(negativeGate(candidate), false, candidate.excerpt);
    assert.ok(!source.showWiki.lanes.find(
      (lane) => lane.id === "straight-to-steves-asshole",
    ).receiptKeys.includes(candidate.key), candidate.key);
  }

  const curatedWiki = byId(result, "LV2rmwEA0w4");
  const curatedCharacterKeys = curatedWiki.receipts.filter(
    (receipt) => receipt.evidenceType === "curated-character-performance",
  ).map((receipt) => receipt.key).sort();
  assert.deepEqual(
    plain(curatedWiki.showWiki.lanes.find(
      (lane) => lane.id === "character-bits",
    ).receiptKeys.slice().sort()),
    plain(curatedCharacterKeys),
  );

  const archivePayload = archiveDeep.getSearchPayload();
  const rawSource = archivePayload.streams.find((stream) => (
    Array.isArray(stream.moments) &&
    stream.moments.some((moment) => Number.isFinite(moment.heat))
  ));
  const rawIndex = rawSource.moments.findIndex(
    (moment) => Number.isFinite(moment.heat),
  );
  const rawMoment = rawSource.moments[rawIndex];
  const expectedKey = rawMoment.id || [
    rawSource.id,
    "moment",
    Math.floor(rawMoment.t),
    rawIndex,
  ].join(":");
  const normalizedMoment = byId(result, rawSource.id).receipts.find(
    (receipt) => receipt.key === expectedKey,
  );
  assert.ok(normalizedMoment, expectedKey);
  assert.equal(normalizedMoment.signalScore, rawMoment.heat);
  assert.equal(normalizedMoment.signalBasis, "caption-derived-heat");
});

test("WWAM UP IN YA includes legacy OUT OF POCKET receipts without relabeling evidence", () => {
  const { result } = buildFixture();
  const source = byId(result, "I6QKteG_hK0");
  const receipt = source.receipts.find(
    (candidate) => candidate.key === "I6QKteG_hK0-2646",
  );
  const lane = source.showWiki.lanes.find(
    (candidate) => candidate.id === "up-in-ya",
  );

  assert.ok(receipt);
  assert.equal(receipt.label, "OUT OF POCKET");
  assert.ok(lane.receiptKeys.includes(receipt.key));
  assert.match(lane.description, /legacy OUT OF POCKET/i);
  assert.match(lane.description, /keeps its original label/i);
});

test("the strict Steve lane rejects pronoun-only dislikes and retains explicit movie targets", () => {
  const { result } = buildFixture();
  const steveLane = (source) => source.showWiki.lanes.find(
    (lane) => lane.id === "straight-to-steves-asshole",
  );

  for (const [sourceId, at, excerptPattern] of [
    ["hagePawEnC4", 12, /hate this shirt/i],
    ["k698GIJe8EA", 1888, /set up a tent/i],
    ["LV2rmwEA0w4", 10923, /sad.*rip/i],
  ]) {
    const source = byId(result, sourceId);
    const candidate = source.receipts.find((receipt) => (
      receipt.kind === "moment" && Math.floor(receipt.at) === at
    ));
    assert.ok(candidate, sourceId + "@" + at);
    assert.match(candidate.excerpt, excerptPattern);
    assert.ok(
      !steveLane(source).receiptKeys.includes(candidate.key),
      candidate.key + ":pronoun-only-negative",
    );
  }

  for (const [sourceId, at, targetPattern] of [
    ["N-UahfG8-gM", 5227, /reveal.*movie/i],
    ["Z7ArdfA054w", 4894, /movie.*trash/i],
  ]) {
    const source = byId(result, sourceId);
    const candidate = source.receipts.find((receipt) => (
      receipt.kind === "moment" && Math.floor(receipt.at) === at
    ));
    assert.ok(candidate, sourceId + "@" + at);
    assert.match(candidate.excerpt, targetPattern);
    assert.ok(
      steveLane(source).receiptKeys.includes(candidate.key),
      candidate.key + ":explicit-movie-target",
    );
  }
});

test("character names and Channel DNA comedy signals survive into their Show Wiki lanes", () => {
  const { result } = buildFixture();

  for (const [sourceId, expectedNames] of [
    ["LV2rmwEA0w4", ["Corey Feldman", "Dr. Challis", "Dr. Loomis", "Slenderman"]],
    ["N-UahfG8-gM", ["Dr. Loomis", "Dr. Challis"]],
  ]) {
    const source = byId(result, sourceId);
    const block = source.showWiki.recap.blocks.find(
      (item) => item.id === "characters-walk-in",
    );
    assert.ok(block, sourceId + ":character-recap");
    assert.doesNotMatch(block.body, /includes Character Performance\b/i);
    expectedNames.forEach((name) => assert.ok(
      block.body.includes(name),
      sourceId + ":" + name,
    ));
  }

  for (const [sourceId, at, label] of [
    ["N-UahfG8-gM", 11859, "CHAT DID THIS"],
    ["qONN2sNoK2k", 484, "CHAT DID THIS"],
    ["I6QKteG_hK0", 3998, "BIT ENERGY"],
  ]) {
    const source = byId(result, sourceId);
    const receipt = source.receipts.find((item) => (
      item.kind === "moment" && Math.floor(item.at) === at && item.label === label
    ));
    const funnyLane = source.showWiki.lanes.find(
      (lane) => lane.id === "funny-moments",
    );
    assert.ok(receipt, sourceId + "@" + at + ":" + label);
    assert.ok(funnyLane.receiptKeys.includes(receipt.key), receipt.key);
  }
});

test("title metadata drives specific formats and title-first recap topics", () => {
  const { result } = buildFixture();

  for (const [sourceId, expectedFormat] of [
    ["fUCQoxTwKqo", "Q + A"],
    ["5T1wWUjCGWk", "SCRIPT READING"],
    ["KrBhfGxsJNM", "WATCH PARTY"],
    ["CFUHyfcJDTg", "VERSUS / FIGHT SHOW"],
    ["ZXLlemHL_EU", "RANKING / BRACKET SHOW"],
  ]) {
    assert.equal(byId(result, sourceId).showWiki.recap.format, expectedFormat, sourceId);
  }

  for (const [sourceId, expectedFirstTopic] of [
    ["WKs1uPGMQvw", "Scream"],
    ["QxJyVaAgZ_Y", "Friday the 13th"],
    ["jG93HvyP420", "TOPIC: HALLOWEEN"],
  ]) {
    const source = byId(result, sourceId);
    const topicBlock = source.showWiki.recap.blocks.find(
      (block) => block.id === "on-the-slab",
    );
    assert.ok(topicBlock, sourceId + ":topic-block");
    assert.ok(topicBlock.receiptKeys.length <= 4, sourceId + ":selected-four");
    const firstTopic = source.receipts.find(
      (receipt) => receipt.key === topicBlock.receiptKeys[0],
    );
    assert.equal(firstTopic.label, expectedFirstTopic, sourceId + ":title-first-topic");
  }
});

test("every Show Wiki query-alias bundle is present, bounded, and normalized-unique", () => {
  const { result } = buildFixture();
  const normalizeAlias = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const assertAliases = (aliases, label) => {
    assert.ok(Array.isArray(aliases), label + ":array");
    assert.ok(aliases.length > 0 && aliases.length <= 16, label + ":count");
    aliases.forEach((alias) => {
      assert.equal(typeof alias, "string", label + ":string");
      assert.equal(alias, alias.replace(/\s+/g, " ").trim(), label + ":clean");
      assert.ok(alias.length > 0 && alias.length <= 160, label + ":length");
    });
    assert.equal(new Set(aliases).size, aliases.length, label + ":exact-unique");
    const normalized = aliases.map(normalizeAlias);
    assert.ok(normalized.every(Boolean), label + ":normalized-nonempty");
    assert.equal(new Set(normalized).size, normalized.length, label + ":normalized-unique");
  };

  result.sources.forEach((source) => {
    assertAliases(source.showWiki.experience.queryAliases, source.id + ":experience");
    source.showWiki.lanes.forEach((lane) => {
      assertAliases(lane.queryAliases, source.id + ":lane:" + lane.id);
    });
    if (source.showWiki.recap) {
      assertAliases(source.showWiki.recap.queryAliases, source.id + ":recap");
    }
    if (source.showWiki.brief) {
      assertAliases(source.showWiki.brief.queryAliases, source.id + ":brief");
    }
  });
});


test("the 3,315 receipts retain the exact evidence taxonomy", () => {
  const { result } = buildFixture();
  const receipts = result.sources.flatMap((source) => source.receipts);

  assert.equal(receipts.length, 3315);
  assert.deepEqual(countBy(receipts, "evidenceType"), {
    "caption-excerpt": 1359,
    "caption-topic-receipt": 1532,
    "curated-character-performance": 30,
    "caption-character-context": 210,
    "caption-character-signal": 24,
    "caption-topic-navigation": 160,
  });
});

test("all 30 promoted human-curated character clips retain exact 14-second bounds", () => {
  const { result, window, showcase } = buildFixture();
  const allSoundbytes = window.WWAM_CHARACTER_LORE.characters.flatMap(
    (character) => character.soundbytes,
  );
  const showcaseSourceIds = new Set(showcase.sources.map((source) => source.id));
  const soundbytes = allSoundbytes.filter(
    (soundbyte) => showcaseSourceIds.has(soundbyte.sourceId),
  );

  assert.equal(allSoundbytes.length, 60);
  assert.equal(soundbytes.length, 30);
  soundbytes.forEach((soundbyte) => {
    const receipt = byId(result, soundbyte.sourceId).receipts.find(
      (candidate) => candidate.key === `character-receipt:${soundbyte.id}`,
    );

    assert.ok(receipt, soundbyte.id);
    assert.equal(receipt.at, soundbyte.t, soundbyte.id);
    assert.equal(receipt.at, soundbyte.playback.start, soundbyte.id);
    assert.equal(receipt.end, soundbyte.playback.end, soundbyte.id);
    assert.equal(receipt.end - receipt.at, 14, soundbyte.id);
    assert.equal(
      receipt.evidenceType,
      "curated-character-performance",
      soundbyte.id,
    );
    assert.equal(receipt.evidenceBasis, "exact-showcase-receipt", soundbyte.id);
  });

  const funding = byId(result, "LV2rmwEA0w4").receipts.find(
    (receipt) => receipt.key === "character-receipt:loomis-funding",
  );
  assert.equal(funding.at, 9042.64);
  assert.equal(funding.end, 9056.64);
});

test("promoted sources use exact Showcase receipts and exact creator memberships", () => {
  const { result, showcase } = buildFixture();
  const live = byId(result, "LV2rmwEA0w4");
  const exactReceiptKeys = showcase.receipts
    .filter((receipt) => receipt.sourceId === live.id)
    .map((receipt) => receipt.id)
    .sort();

  assert.equal(live.coverage, "caption-backed");
  assert.equal(live.authority, "promoted-lane");
  assert.equal(live.sourceType, "livestream");
  assert.equal(live.receipts.length, 21);
  assert.deepEqual(
    live.receipts.map((receipt) => receipt.key).sort(),
    exactReceiptKeys,
  );
  assert.ok(live.receipts.every(
    (receipt) => receipt.evidenceBasis === "exact-showcase-receipt",
  ));
  const scoredLiveMoments = live.receipts.filter((receipt) => receipt.kind === "moment");
  assert.equal(scoredLiveMoments.length, 7);
  assert.ok(scoredLiveMoments.every((receipt) => Number.isFinite(receipt.signalScore)));
  assert.ok(scoredLiveMoments.every((receipt) => receipt.signalBasis === "showcase-receipt-score"));
  assert.equal(live.metrics.momentReceipts, 7);
  assert.equal(live.metrics.topicReceipts, 8);
  assert.equal(live.metrics.characterReceipts, 6);
  assert.equal(live.metrics.heatSegments, 30);

  assert.equal(live.artifacts.length, 27);
  assert.deepEqual(
    countBy(live.artifacts, "kind"),
    {
      "bit-lineage": 4,
      "creator-resurfacing": 4,
      "creator-short": 13,
      "creator-supercut": 6,
    },
  );
  assert.deepEqual(
    {
      shorts: live.metrics.shorts,
      supercuts: live.metrics.supercuts,
      resurfacing: live.metrics.resurfacing,
      bitLineages: live.metrics.bitLineages,
    },
    { shorts: 13, supercuts: 6, resurfacing: 4, bitLineages: 4 },
  );
  live.artifacts.forEach((artifact) => {
    assert.equal(artifact.promotionAllowed, false);
    assert.match(artifact.reviewState, /review-only$/);
    assert.ok(["creator-draft", "editor-review"].includes(artifact.authority));
  });
  assert.ok(live.artifacts
    .filter((artifact) => artifact.kind.startsWith("creator-"))
    .every((artifact) => artifact.creatorDraft));
  assert.ok(live.entities.some(
    (entity) =>
      entity.id === "character:loomis" &&
      entity.basis === "timestamped-receipt" &&
      entity.receiptKeys.length > 0,
  ));

  const commentary = byId(result, "6VXSBDZ-3WE");
  assert.equal(commentary.sourceType, "commentary");
  assert.equal(commentary.displayTitle, "Halloween (1978)");
  assert.equal(commentary.receipts.length, 8);
  assert.equal(commentary.metrics.captionMinutes, 93);
  assert.equal(commentary.metrics.unhinged, 70);
  assert.ok(commentary.entities.some(
    (entity) =>
      entity.id === "film:halloween-1978" &&
      entity.basis === "timestamped-receipt",
  ));

  const popular = byId(result, "jG93HvyP420");
  assert.equal(popular.authority, "promoted-lane");
  assert.ok(popular.receipts.length > 10);
  assert.ok(popular.receipts.every(
    (receipt) => receipt.evidenceBasis === "exact-showcase-receipt",
  ));
});

test("sealed and metadata-only fixtures never inherit unsafe semantic copy", () => {
  const { result } = buildFixture();

  for (const id of ["AzrcgoyE7C4", "x6tvsGRHgU0", "cQAVmNFQmoI"]) {
    const source = byId(result, id);
    assert.equal(source.coverage, "caption-limited");
    assert.equal(source.summary, null);
    assert.equal(source.receipts.length, 0);
    assert.equal(source.metrics.receiptCount, 0);
  }

  const sealed = byId(result, "AzrcgoyE7C4");
  assert.equal(sealed.availability, "needs_auth");
  assert.equal(sealed.displayTitle, "Rob Zombie's Halloween II");
  assert.ok(sealed.entities.some(
    (entity) =>
      entity.id === "franchise:halloween" &&
      entity.basis === "cached-title-alias" &&
      entity.receiptKeys.length === 0,
  ));

  const metadata = byId(result, "__bkfXziVXA");
  assert.equal(metadata.coverage, "metadata-only");
  assert.equal(metadata.authority, "source-only");
  assert.equal(metadata.summary, null);
  assert.deepEqual(plain(metadata.receipts), []);
  assert.equal(metadata.metrics.captionCoveragePercent, null);
  assert.equal(metadata.metrics.unhinged, null);
  assert.deepEqual(
    plain(metadata.entities.map(
      (entity) => [entity.id, entity.basis, entity.receiptKeys],
    )),
    [["franchise:scream", "cached-title-alias", []]],
  );
  assert.ok(metadata.warnings.some((warning) => /METADATA ONLY/.test(warning)));
});

test("Archive Deep remains quarantined and all 16 source-audio firewalls are topic-only", () => {
  const { result } = buildFixture();
  const archive = result.sources.filter(
    (source) => source.authority === "quarantined-lane",
  );
  const archiveReceipts = archive.flatMap((source) => source.receipts);
  const characterEvidence = archiveReceipts.filter(
    (receipt) => receipt.evidenceType.startsWith("caption-character-"),
  );
  const restricted = archive.filter(
    (source) => source.rightsPolicy.restrictedToTopicNavigation,
  );

  assert.equal(archive.length, 138);
  assert.equal(restricted.length, 16);
  assert.equal(
    archiveReceipts.filter(
      (receipt) => receipt.evidenceType === "curated-character-performance",
    ).length,
    0,
  );
  assert.equal(characterEvidence.length, 234);
  assert.deepEqual(countBy(characterEvidence, "evidenceType"), {
    "caption-character-context": 210,
    "caption-character-signal": 24,
  });
  assert.ok(characterEvidence.every(
    (receipt) =>
      receipt.evidenceLevel === "machine" &&
      receipt.reviewState === "quarantined-machine-candidate" &&
      receipt.evidenceBasis === "archive-deep-quarantined-candidate",
  ));
  assert.ok(archive.every(
    (source) =>
      source.coverage === "caption-backed" &&
      source.rightsPolicy.promotionAllowed === false,
  ));
  restricted.forEach((source) => {
    assert.equal(source.receipts.length, 10, source.id);
    assert.ok(source.receipts.every(
      (receipt) =>
        receipt.kind === "topic-navigation" &&
        receipt.evidenceType === "caption-topic-navigation" &&
        receipt.excerpt === "" &&
        receipt.publicExcerptAllowed === false &&
        receipt.reviewState === "quarantined-topic-navigation",
    ));
    assert.equal(source.metrics.topicReceipts, 10);
    assert.equal(source.metrics.momentReceipts, 0);
    assert.equal(source.metrics.characterReceipts, 0);
    assert.equal(source.metrics.heatSegments, 0);
    assert.equal(source.metrics.publicExcerptReceipts, 0);
  });

  const firewall = byId(result, "fpNtQMexZiw");
  assert.equal(firewall.receipts.length, 10);
  assert.ok(firewall.warnings.some((warning) => /TOPIC NAVIGATION ONLY/.test(warning)));

  const candidate = byId(result, "CFUHyfcJDTg");
  assert.equal(candidate.rightsPolicy.restrictedToTopicNavigation, false);
  assert.equal(candidate.metrics.topicReceipts, 10);
  assert.equal(candidate.metrics.momentReceipts, 7);
  assert.equal(candidate.metrics.characterReceipts, 1);
  assert.equal(candidate.metrics.heatSegments, 30);
  assert.ok(candidate.receipts.every((receipt) => receipt.promotionAllowed === false));
});

test("normalization is deterministic across reversed source and artifact input order", () => {
  const fixture = buildFixture();
  const { window, input, showcase, clipLab, archiveDeep, result } = fixture;
  const reversedShowcase = {
    sources: showcase.sources.slice().reverse(),
    receipts: showcase.receipts.slice().reverse(),
    memoryGraph: {
      nodes: showcase.memoryGraph.nodes.slice().reverse(),
      edges: showcase.memoryGraph.edges.slice().reverse(),
      stats: showcase.memoryGraph.stats,
    },
    takeTimeMachines: showcase.takeTimeMachines.slice().reverse(),
    bitAncestry: showcase.bitAncestry.slice().reverse(),
  };
  const reversedClipLab = {
    shorts: clipLab.shorts.slice().reverse(),
    supercuts: clipLab.supercuts.slice().reverse(),
    resurfacing: clipLab.resurfacing.slice().reverse(),
  };
  const archivePayload = archiveDeep.getSearchPayload();
  const reversed = window.WWAMSourceDossierAdapter.build({
    ...input,
    atlas: {
      ...plain(input.atlas),
      records: plain(input.atlas.records).reverse(),
    },
    catalog: plain(input.catalog).reverse(),
    deep: {
      ...plain(input.deep),
      tapes: plain(input.deep.tapes).reverse(),
    },
    live: {
      ...plain(input.live),
      streams: plain(input.live.streams).reverse(),
    },
    popular: {
      ...plain(input.popular),
      streams: plain(input.popular.streams).reverse(),
    },
    archiveDeepPortfolio: null,
    archiveDeep: {
      ...archivePayload,
      streams: plain(archivePayload.streams).reverse(),
    },
    showcase: reversedShowcase,
    clipLab: reversedClipLab,
  });

  assert.deepEqual(plain(reversed), plain(result));
});

test("the exact 510-source adapter payload compiles through the generic engine", () => {
  const { window, result } = buildFixture();
  const engine = window.ShokkerSourceDossier.create(result);
  const stats = plain(engine.getStats());

  assert.equal(stats.sources, 510);
  assert.deepEqual(stats.coverage, {
    "caption-backed": 209,
    "caption-limited": 9,
    "metadata-only": 292,
  });
  assert.deepEqual(stats.authority, {
    "promoted-lane": 74,
    "quarantined-lane": 138,
    "source-only": 298,
  });
  assert.equal(stats.receipts, 3315);
  assert.equal(stats.artifacts, 944);

  const live = engine.build("LV2rmwEA0w4");
  assert.equal(live.source.receipts.length, 21);
  assert.equal(live.source.artifacts.length, 27);
  assert.equal(live.wake.total, 236);
  assert.equal(live.wake.matchingTotal, 236);
  assert.equal(live.wake.displayed, 16);
  assert.equal(live.wake.truncated, true);
  assert.equal(live.wake.later.length, 0);
  assert.equal(live.wake.earlier.length, 16);
  assert.ok(live.wake.earlier.every(
    (connection) => connection.basis === "receipt-backed-entity",
  ));
  assert.equal(live.wake.earlier[0].sourceId, "ag3axSC9BpU");
  assert.ok(live.wake.earlier[0].sharedEntities.some(
    (entity) => entity.id === "character:loomis",
  ));
  assert.ok(live.wake.earlier[0].artifactIds.includes(
    "ancestry:bit-loomis-alert",
  ));

  result.sources.forEach((source) => {
    const dossier = engine.build(source.id);
    assert.equal(dossier.wake.total, dossier.wake.matchingTotal, source.id);
    assert.equal(
      dossier.wake.displayed,
      dossier.wake.later.length + dossier.wake.earlier.length,
      source.id,
    );
    assert.ok(dossier.wake.displayed <= 16, source.id);
    assert.equal(
      dossier.wake.truncated,
      dossier.wake.matchingTotal > dossier.wake.displayed,
      source.id,
    );
  });
});

test("additive character growth is accepted only when Lore and Showcase agree", () => {
  const fixture = buildFixture();
  const characters = plain(fixture.window.WWAM_CHARACTER_LORE);
  const showcase = plain(fixture.showcase);
  const loomis = characters.characters.find((character) => character.id === "loomis");
  const seed = loomis.soundbytes.find((soundbyte) => soundbyte.id === "loomis-funding");
  const start = seed.t + 20;
  const added = {
    ...seed,
    id: "loomis-growth-proof",
    t: start,
    url: `https://www.youtube.com/watch?v=${seed.sourceId}&t=${Math.floor(start)}s`,
    playback: {
      ...seed.playback,
      start,
      end: start + 14,
      clipSeconds: 14,
      embedUrl: `https://www.youtube.com/embed/${seed.sourceId}?start=${Math.floor(start)}&end=${Math.floor(start + 14)}&autoplay=1`,
    },
    excerpt: "The living ledger accepts a new exact performance without freezing the archive.",
  };
  loomis.soundbytes.push(added);

  const showcaseSeed = showcase.receipts.find(
    (receipt) => receipt.id === "character-receipt:loomis-funding",
  );
  showcase.receipts.push({
    ...showcaseSeed,
    id: "character-receipt:loomis-growth-proof",
    t: start,
    timecode: "2:31:23",
    url: added.url,
    excerpt: added.excerpt,
  });

  const result = fixture.window.WWAMSourceDossierAdapter.build({
    ...fixture.input,
    showcase,
    characters,
  });
  const receipts = result.sources.flatMap((source) => source.receipts);
  const growth = byId(result, added.sourceId).receipts.find(
    (receipt) => receipt.key === "character-receipt:loomis-growth-proof",
  );

  assert.equal(
    receipts.filter((receipt) =>
      receipt.evidenceType === "curated-character-performance").length,
    31,
  );
  assert.ok(growth);
  assert.equal(growth.at, start);
  assert.equal(growth.end, start + 14);
});

test("a valid next Atlas upload grows the canonical union instead of holding every Wiki", () => {
  const fixture = buildFixture();
  const atlas = plain(fixture.input.atlas);
  const id = "NEXTSHOW001";
  atlas.records.push({
    id,
    title: "Future WWAM Live Archive Intake",
    date: "2026-07-30",
    duration: 7200,
    views: 0,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`,
    availability: "public",
    liveStatus: "not_live",
    coverage: "metadata-only",
    lanes: ["streams-feed", "year-canon-2025-2026"],
  });

  const result = fixture.window.WWAMSourceDossierAdapter.build({
    ...fixture.input,
    atlas,
  });
  const added = byId(result, id);

  assert.equal(result.sources.length, 511);
  assert.equal(added.coverage, "metadata-only");
  assert.equal(added.showWiki.status, "source-brief");
  assert.equal(added.receipts.length, 0);
});

test("a newly registered commentary can open honestly before Deep Distill catches up", () => {
  const fixture = buildFixture();
  const catalog = plain(fixture.input.catalog);
  const id = "NEWCOMMENT1";
  catalog.push({
    id,
    franchise: "Future Proof",
    film: "Undistilled Commentary",
    order: 1,
    title: "UNDISTILLED COMMENTARY SOURCE",
    date: "2026-07-30",
    duration: 7200,
    views: 0,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    transcript: false,
    availability: "public",
    liveStatus: "not_live",
    url: `https://www.youtube.com/watch?v=${id}`,
  });

  const result = fixture.window.WWAMSourceDossierAdapter.build({
    ...fixture.input,
    catalog,
  });
  const added = byId(result, id);

  assert.equal(result.sources.length, 511);
  assert.equal(added.authority, "promoted-lane");
  assert.equal(added.coverage, "caption-limited");
  assert.equal(added.showWiki.status, "source-brief");
  assert.equal(added.receipts.length, 0);
});
test("adapter fails closed if the feed/catalog reconciliation drifts", () => {
  const fixture = buildFixture();
  const brokenAtlas = plain(fixture.input.atlas);
  brokenAtlas.records = brokenAtlas.records.slice(1);

  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      atlas: brokenAtlas,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "SOURCE_COUNT_INVALID",
  );
});

test("adapter fails closed when canonical Archive Deep or Showcase proof is missing", () => {
  const fixture = buildFixture();

  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      archiveDeepPortfolio: null,
      archiveDeep: null,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "ARCHIVE_DEEP_COUNT_INVALID",
  );
  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      showcase: null,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "SHOWCASE_REQUIRED",
  );
  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      clipLab: null,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "SHOWCASE_ARTIFACT_PROOF_INCOMPLETE",
  );
  assert.throws(
    () => fixture.window.WWAMSourceDossierAdapter.build({
      ...fixture.input,
      characters: null,
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "CURATED_RECEIPT_BOUND_MISSING",
  );
});
