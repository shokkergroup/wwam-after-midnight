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
    "episode-guide-v2-reviewed-release.js",
    "episode-guide-v2-newest-five-release.js",
    "episode-guide-v2-reviewed-merge.js",
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
    "archive-recovery-batch1.js",
    "archive-recovery-batch2.js",
    "title-topic-overrides.js",
    "episode-recap-engine.js",
    "wwam-episode-recap-adapter.js",
    "episode-format-contracts.js",
    "wwam-source-dossier-adapter.js",
    "source-dossier-engine.js",
    "source-query-engine.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  sandbox.window.WWAM_EPISODE_GUIDES =
    sandbox.window.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE.mergeOrdered(
      sandbox.window.WWAM_EPISODE_GUIDES,
      [
        sandbox.window.WWAM_EPISODE_GUIDE_V2_REVIEWED_RELEASE,
        sandbox.window.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_RELEASE,
      ],
    );
  return sandbox.window;
}

function buildFixture(configure) {
  const window = load();
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    titleTopicOverrides: window.WWAM_TITLE_TOPIC_OVERRIDES,
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
    streams: archiveSearchBase.streams.concat(
      window.WWAM_YEAR_CANON_2025_2026.streams,
      window.WWAM_ARCHIVE_RECOVERY_BATCH1.streams,
      window.WWAM_ARCHIVE_RECOVERY_BATCH2.streams,
    ),
    topicIndex: archiveSearchBase.topicIndex.concat(
      window.WWAM_YEAR_CANON_2025_2026.topicIndex,
      window.WWAM_ARCHIVE_RECOVERY_BATCH1.topicIndex,
      window.WWAM_ARCHIVE_RECOVERY_BATCH2.topicIndex,
    ),
    characterIndex: archiveSearchBase.characterIndex.concat(
      window.WWAM_YEAR_CANON_2025_2026.characterIndex,
      window.WWAM_ARCHIVE_RECOVERY_BATCH1.characterIndex,
      window.WWAM_ARCHIVE_RECOVERY_BATCH2.characterIndex,
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
  if (configure) {
    configure({
      window,
      showcase,
      clipLab,
      archiveDeep,
      input,
    });
  }
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

  assert.match(window.WWAMSourceDossierAdapter.VERSION, /^\d+\.\d+\.\d+$/);
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
    "caption-backed": 259,
    "caption-limited": 9,
    "metadata-only": 242,
  });
  assert.deepEqual(countBy(result.sources, "authority"), {
    "promoted-lane": 74,
    "quarantined-lane": 188,
    "source-only": 248,
  });
});

test("canonical format contracts classify all 510 sources without relaxing rights", () => {
  const { window, result } = buildFixture();
  const registry = window.WWAMEpisodeFormatContracts;
  const report = registry.driftReport(result.sources);

  assert.equal(report.total, 510);
  assert.equal(report.classified, 510);
  assert.equal(report.uniqueSourceIds, 510);
  assert.deepEqual(plain(report.duplicateSourceIds), []);
  assert.deepEqual(plain(report.formatConflicts), []);
  assert.deepEqual(plain(report.rightsRegressions), []);
  assert.equal(report.restrictiveRightsPreserved, true);
  assert.ok(result.sources.every((source) =>
    source.runtimeFormat && source.runtimeFormat.id &&
    source.subtype && source.subtype.id &&
    source.formatContract && source.formatContract.id
  ));

  const trailer = byId(result, "fpNtQMexZiw");
  assert.equal(trailer.rawContentMode, "trailer-reaction");
  assert.equal(trailer.runtimeFormat.id, "trailer-coverage");
  assert.equal(trailer.subtype.id, "reaction");
  assert.equal(trailer.formatContract.id, "trailer-reaction");

  const commentary = byId(result, "6VXSBDZ-3WE");
  assert.equal(commentary.rawContentMode, null);
  assert.equal(commentary.runtimeFormat.id, "movie-companion");
  assert.equal(commentary.subtype.id, "commentary");
  assert.equal(commentary.formatContract.id, "movie-commentary");

  const overlayStreams = [
    window.WWAM_ARCHIVE_DEEP,
    window.WWAM_ARCHIVE_DEEP_BATCH2,
    window.WWAM_ARCHIVE_DEEP_BATCH3,
    window.WWAM_ARCHIVE_DEEP_BATCH4,
    window.WWAM_YEAR_CANON_2025_2026,
    window.WWAM_ARCHIVE_RECOVERY_BATCH1,
    window.WWAM_ARCHIVE_RECOVERY_BATCH2,
  ].flatMap((payload) => payload.streams || []);
  const dossierById = new Map(
    result.sources.map((source) => [source.id, source]),
  );
  overlayStreams.forEach((raw) => {
    const source = dossierById.get(raw.id);
    assert.ok(source, raw.id);
    assert.equal(source.rawContentMode, raw.contentMode, raw.id);
    const input = raw.rightsPolicy || {};
    const output = source.rightsPolicy;
    [
      "speakerClaimsAllowed",
      "performerClaimsAllowed",
      "originClaimsAllowed",
      "visualClaimsAllowed",
      "visualResultClaimsAllowed",
      "promotionAllowed",
    ].forEach((field) => {
      if (input[field] === false) assert.equal(output[field], false, `${raw.id}:${field}`);
    });
    if (input.restrictedToTopicNavigation === true) {
      assert.equal(output.restrictedToTopicNavigation, true, raw.id);
    }
    if (Number.isFinite(Number(input.publicExcerptWordLimit))) {
      assert.ok(
        output.publicExcerptWordLimit <= Number(input.publicExcerptWordLimit),
        raw.id,
      );
    }
  });
});

test("title-native subject leads the QMY Christmas Movies dossier", () => {
  const { result } = buildFixture();
  const source = byId(result, "QMYgsEfPMg0");
  const recap = source.showWiki.episodeRecap;

  assert.equal(recap.state, "ready");
  assert.equal(recap.topics[0], "Christmas Movies");
  assert.match(recap.overview, /Christmas Movies/i);
  const titleTopic = recap.topicMap.find(
    (topic) => topic.label === "Christmas Movies",
  );
  assert.ok(titleTopic);
  assert.equal(titleTopic.at, 2093);
});

test("every canonical show receives a Feldman recap or an evidence-safe held state", () => {
  const { result } = buildFixture();
  const recaps = result.sources.map((source) => source.showWiki.episodeRecap);
  const ready = recaps.filter((recap) => recap.state === "ready");
  const held = recaps.filter((recap) => recap.state === "held");

  assert.equal(recaps.length, 510);
  assert.ok(recaps.every((recap) => recap.schema === "wwam-feldman-recap/v1"));
  assert.equal(ready.length, 259);
  assert.equal(held.length, 251);
  assert.deepEqual(countBy(recaps, "tier"), {
    "receipt-recap": 190,
    "source-safe-held": 251,
    "topic-recap": 17,
    "full-chronicle": 52,
  });

  assert.ok(ready.every((recap) =>
    typeof recap.label === "string" &&
    recap.label.trim() &&
    !/\bAPPROVED\b/i.test(recap.label)
  ));
  assert.ok(ready
    .filter((recap) => recap.editorialState === "structured-source-summary")
    .every((recap) => recap.label === "SHOW WIKI // SOURCE-LINKED SUMMARY"));
  assert.ok(ready.every((recap) => Array.isArray(recap.topics) && recap.topics.length >= 1));
  assert.ok(ready.every((recap) => recap.sections.length >= 1));
  assert.ok(ready.every((recap) => recap.sections.every((section) =>
    section.receiptKeys.length > 0 || section.guideCutId
  )));
  assert.ok(ready.every((recap) => recap.story.length >= 1));
  assert.ok(ready.every((recap) =>
    recap.caseFile.storyCoveragePercent === 100 &&
    recap.caseFile.storyReceiptCount === recap.caseFile.receiptCount
  ));
  assert.ok(ready.every((recap) => {
    const keys = new Set(recap.story.flatMap((segment) => segment.receiptKeys));
    return keys.size === recap.caseFile.receiptCount;
  }));
  assert.ok(result.sources
    .filter((source) => source.episodeRecap.state === "ready")
    .every((source) => {
      const receiptByKey = new Map(
        source.receipts.map((receipt) => [receipt.key, receipt]),
      );
      return source.episodeRecap.story.every((segment) => {
        const anchor = receiptByKey.get(segment.anchorReceiptKey);
        return anchor &&
          segment.receiptKeys.includes(segment.anchorReceiptKey) &&
          segment.anchorAt === anchor.at &&
          (!segment.excerpt || anchor.publicExcerptAllowed);
      });
    }));
  assert.ok(ready.every((recap) => recap.approval.actualApproval === false));

  assert.ok(held.every((recap) => recap.label === "EPISODE RECAP"));
  assert.ok(held.every((recap) => recap.badge === "RECAP WAITING ON THE TAPE"));
  assert.ok(held.every((recap) => recap.sections.length === 0));
  assert.ok(held.every((recap) => Array.isArray(recap.topics) && recap.topics.length === 0));
  assert.ok(held.every((recap) => recap.story.length === 0));
  assert.ok(held.every((recap) => recap.bestMoments.length === 0));
  assert.ok(held.every((recap) => recap.approval.actualApproval === false));
  assert.ok(held.every((recap) => !/feldman approved/i.test(recap.label)));
});

test("story anchors stay inside their reel and own the displayed evidence", () => {
  const { window, result } = buildFixture();
  const source = result.sources.find((candidate) =>
    candidate.showWiki.episodeRecap.state === "ready" &&
    candidate.showWiki.episodeRecap.story.some((segment) =>
      segment.excerpt &&
      segment.anchorAt !== segment.at &&
      candidate.receipts.some((receipt) =>
        !segment.receiptKeys.includes(receipt.key)
      )
    )
  );
  assert.ok(source);
  const segment = source.showWiki.episodeRecap.story.find((candidate) =>
    candidate.excerpt &&
    candidate.anchorAt !== candidate.at &&
    source.receipts.some((receipt) =>
      !candidate.receiptKeys.includes(receipt.key)
    )
  );
  assert.ok(segment);
  const anchor = source.receipts.find(
    (receipt) => receipt.key === segment.anchorReceiptKey,
  );
  assert.ok(anchor);
  assert.ok(segment.receiptKeys.includes(anchor.key));
  assert.equal(segment.anchorAt, anchor.at);
  assert.equal(anchor.publicExcerptAllowed, true);
  assert.doesNotThrow(() => window.ShokkerSourceDossier.create(result));

  const expectCode = (code) => (error) =>
    error?.name === "SourceDossierError" && error?.code === code;
  const originalKey = segment.anchorReceiptKey;
  const outside = source.receipts.find(
    (receipt) => !segment.receiptKeys.includes(receipt.key),
  );
  segment.anchorReceiptKey = outside.key;
  assert.throws(
    () => window.ShokkerSourceDossier.create(result),
    expectCode("EPISODE_RECAP_STORY_ANCHOR_SCOPE"),
  );
  segment.anchorReceiptKey = originalKey;

  const originalAt = segment.anchorAt;
  segment.anchorAt += 1;
  assert.throws(
    () => window.ShokkerSourceDossier.create(result),
    expectCode("EPISODE_RECAP_STORY_ANCHOR_TIME"),
  );
  segment.anchorAt = originalAt;

  const originalExcerpt = segment.excerpt;
  segment.excerpt = "This sentence is not present in the registered anchor receipt.";
  assert.throws(
    () => window.ShokkerSourceDossier.create(result),
    expectCode("EPISODE_RECAP_STORY_ANCHOR_EXCERPT"),
  );
  segment.excerpt = originalExcerpt;
});

test("Feldman narrative beats survive the generic dossier contract source-locally", () => {
  const { window, result } = buildFixture();
  const source = result.sources.find((candidate) =>
    candidate.showWiki.episodeGuide &&
    candidate.showWiki.episodeRecap.state === "ready" &&
    candidate.showWiki.episodeRecap.story.length > 1 &&
    candidate.showWiki.episodeRecap.story.some((segment) =>
      segment.guideAnchor?.id
    )
  );
  assert.ok(source);

  function isolatedInput(candidate) {
    const localSource = plain(candidate);
    localSource.artifacts = [];
    return {
      schema: result.schema,
      channel: plain(result.channel),
      snapshotDate: result.snapshotDate,
      sources: [localSource],
    };
  }

  const isolated = isolatedInput(source);
  const normalized = plain(
    window.ShokkerSourceDossier.create(isolated)
      .build(source.id).source.showWiki.episodeRecap,
  );
  const rawRecap = plain(source.showWiki.episodeRecap);
  const anchoredIndex = rawRecap.story.findIndex(
    (segment) => segment.guideAnchor?.id,
  );

  assert.ok(anchoredIndex >= 0);
  assert.deepEqual(
    normalized.story[anchoredIndex].guideAnchor,
    rawRecap.story[anchoredIndex].guideAnchor,
  );
  assert.deepEqual(
    normalized.story[anchoredIndex].guideCutIds,
    rawRecap.story[anchoredIndex].guideCutIds,
  );
  assert.deepEqual(
    normalized.story[anchoredIndex].guideChapterIds,
    rawRecap.story[anchoredIndex].guideChapterIds,
  );
  assert.deepEqual(
    normalized.story[anchoredIndex].threadLabels,
    rawRecap.story[anchoredIndex].threadLabels,
  );
  assert.deepEqual(
    normalized.story[anchoredIndex].narrative,
    rawRecap.story[anchoredIndex].narrative,
  );
  for (const key of [
    "storyNarrativeBeatCount",
    "storyNamedSegmentCount",
    "storyGuidePointCount",
    "storyGuidePointExpected",
    "storyGuidePointCoveragePercent",
    "storyGuideChapterCount",
    "storyGuideThreadCount",
  ]) {
    assert.equal(normalized.caseFile[key], rawRecap.caseFile[key], key);
  }
  assert.deepEqual(normalized.guideRecap, rawRecap.guideRecap);

  function expectMutation(code, mutate) {
    const candidate = plain(isolated);
    mutate(candidate.sources[0].showWiki.episodeRecap);
    assert.throws(
      () => window.ShokkerSourceDossier.create(candidate),
      (error) =>
        error?.name === "SourceDossierError" &&
        error?.code === code,
      code,
    );
  }

  expectMutation("EPISODE_RECAP_STORY_GUIDE_ANCHOR_WINDOW", (recap) => {
    recap.story[anchoredIndex].guideAnchor.at += 1;
  });
  expectMutation("UNKNOWN_EPISODE_RECAP_STORY_GUIDE_CUT", (recap) => {
    recap.story[anchoredIndex].guideCutIds[0] = "not-a-local-guide-cut";
  });
  expectMutation("UNKNOWN_EPISODE_RECAP_STORY_GUIDE_CHAPTER", (recap) => {
    recap.story[anchoredIndex].guideChapterIds.push("not-a-local-chapter");
  });
  expectMutation("UNKNOWN_EPISODE_RECAP_STORY_THREAD", (recap) => {
    recap.story[anchoredIndex].threadLabels.push("Not A Local Thread");
  });
  expectMutation("EPISODE_RECAP_STORY_PRIMARY_GUIDE_SCOPE", (recap) => {
    recap.story[anchoredIndex].narrative.primaryEvidence.key =
      "not-a-local-guide-cut";
  });
  expectMutation("EPISODE_RECAP_STORY_NARRATIVE_TRANSITION", (recap) => {
    recap.story[0].narrative.nextSubject = "A different reel entirely";
  });
  expectMutation("EPISODE_RECAP_STORY_EVIDENCE_SHAPE_MISMATCH", (recap) => {
    recap.story[anchoredIndex].narrative.evidenceShape.guideCuts += 1;
  });
  expectMutation("EPISODE_RECAP_CASE_FILE_MISMATCH", (recap) => {
    recap.caseFile.storyGuidePointCount += 1;
  });

  const heldSource = result.sources.find(
    (candidate) => candidate.showWiki.episodeRecap.state === "held",
  );
  assert.ok(heldSource);
  const held = isolatedInput(heldSource);
  held.sources[0].showWiki.episodeRecap.caseFile.storyNarrativeBeatCount = 1;
  assert.throws(
    () => window.ShokkerSourceDossier.create(held),
    (error) =>
      error?.name === "SourceDossierError" &&
      error?.code === "HELD_EPISODE_RECAP_CASE_FILE_OVERREACH",
  );
});

test("topic receipts preserve bounded source-local strength with explicit provenance", () => {
  let expectedCluster = null;
  let sourceId = "";
  let scoredLabel = "";
  let mentionedLabel = "";
  let clusteredLabel = "";
  let mentionedScore = null;
  const { result } = buildFixture(({ window, input }) => {
    const payload = plain(input.archiveDeepPortfolio.getSearchPayload());
    const yearCanonIds = new Set(
      window.WWAM_YEAR_CANON_2025_2026.streams.map((source) => source.id),
    );
    const raw = payload.streams.find((source) => (
      !yearCanonIds.has(source.id) &&
      Array.isArray(source.topics) &&
      source.topics.length >= 3
    ));
    assert.ok(raw);
    sourceId = raw.id;
    scoredLabel = raw.topics[0].name || raw.topics[0].label;
    mentionedLabel = raw.topics[1].name || raw.topics[1].label;
    clusteredLabel = raw.topics[2].name || raw.topics[2].label;
    mentionedScore = Math.max(0, Math.min(100, raw.topics[1].mentions));

    raw.topics[0].score = 87;
    delete raw.topics[2].score;
    delete raw.topics[2].mentions;
    expectedCluster = raw.topics[2].cluster;
    input.archiveDeepPortfolio = {
      getSearchPayload() {
        return payload;
      },
    };
  });
  const source = byId(result, sourceId);
  const topic = (label) => source.receipts.find(
    (receipt) => receipt.kind === "topic-navigation" && receipt.label === label,
  );

  assert.equal(topic(scoredLabel).signalScore, 87);
  assert.equal(topic(scoredLabel).signalBasis, "caption-derived-topic-score");
  assert.equal(topic(mentionedLabel).signalScore, mentionedScore);
  assert.equal(
    topic(mentionedLabel).signalBasis,
    "caption-derived-topic-mention-count-bounded",
  );
  assert.equal(topic(clusteredLabel).signalScore, expectedCluster);
  assert.equal(topic(clusteredLabel).signalBasis, "caption-derived-topic-cluster");
  assert.ok(new Set(source.receipts.filter(
    (receipt) => receipt.kind === "topic-navigation",
  ).map((receipt) => receipt.signalScore)).size > 1);
});

test("episode recap receives source-local context only after Show Wiki lanes exist", () => {
  let captured = null;
  const { result } = buildFixture(({ window }) => {
    const core = window.ShokkerEpisodeRecap;
    window.ShokkerEpisodeRecap = Object.freeze({
      SCHEMA: core.SCHEMA,
      VERSION: core.VERSION,
      build(input) {
        if (input.source.id === "5k6I18ZekPQ") {
          captured = plain(input.context);
        }
        return core.build(input);
      },
    });
  });
  const source = byId(result, "5k6I18ZekPQ");

  assert.ok(captured);
  assert.equal(captured.title, "ALIEN: EARTH After Party Hangout");
  assert.equal(captured.summary.basis, "archive-deep-derived-summary");
  assert.ok(captured.summary.text);
  assert.equal(captured.editorial.showShape, "OPEN-LINE MOVIE NEWS");
  assert.ok(captured.editorial.signature);
  assert.ok(captured.editorial.bestEntry);
  assert.ok(Number.isFinite(captured.indices.chaosIndex));
  assert.ok(Number.isFinite(captured.peak.heat));
  assert.deepEqual(
    captured.lanes.map((lane) => lane.id),
    plain(source.showWiki.lanes.map((lane) => lane.id)),
  );
  assert.deepEqual(
    captured.lanes.map((lane) => lane.receiptKeys),
    plain(source.showWiki.lanes.map((lane) => lane.receiptKeys)),
  );
  assert.deepEqual(plain(source.showWiki.episodeRecap), plain(source.episodeRecap));
});

test("Ask This Tape stays on the exact canonical WWAM upload across title collisions and evidence gaps", () => {
  const { window, result } = buildFixture();
  const dossierEngine = window.ShokkerSourceDossier.create(result);
  const queryEngine = window.ShokkerSourceQuery.create({ dossierEngine });
  const heldSource = result.sources.find(
    (source) => source.coverage === "metadata-only",
  );
  assert.ok(heldSource);
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

  const visualResultHeld = queryEngine.answer(
    request("RzSxi8rVQGI", "Who won the Marvel versus DC bracket?"),
  );
  assert.equal(visualResultHeld.status, "insufficient-evidence");
  assert.equal(visualResultHeld.resultCount, 0);

  const captionLimited = queryEngine.answer(
    request("x6tvsGRHgU0", "What topics are indexed in this tape?"),
  );
  assert.equal(captionLimited.status, "caption-limited");
  assert.equal(captionLimited.resultCount, 0);

  const wrongSource = queryEngine.answer(
    request("RzSxi8rVQGI", "Show me Superman receipts."),
  );
  assert.equal(wrongSource.status, "insufficient-evidence");
  assert.equal(wrongSource.resultCount, 0);
  assert.equal(wrongSource.boundary.crossSourceSubstitution, false);

  const brief = queryEngine.answer(
    request(heldSource.id, "What can you prove about this show?"),
  );
  assert.equal(brief.status, "supported");
  assert.equal(brief.intent, "episode-brief");
  assert.equal(brief.episode.kind, "brief");
  assert.equal(brief.results[0].field, "registered-source-brief");
  assert.equal(brief.results[0].contentClaim, false);
  assert.equal(brief.results[0].value.scope, "canonical-source-metadata-only");

  const briefInventory = queryEngine.answer(
    request(heldSource.id, "What is actually indexed in this tape?"),
  );
  assert.equal(briefInventory.status, "inventory");
  assert.equal(briefInventory.results[0].value.sourceBriefAvailable, true);

  const refusedSummary = queryEngine.answer(
    request(heldSource.id, "Summarize this show."),
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
    [3644, 7358, 1730, 2308, 7780, 4894, 5039],
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
  assert.equal(topics.episode.totalReceipts, 12);
  assert.equal(topics.episode.shownReceipts, 8);
  const unverifiedImpressions = queryEngine.answer(
    request(richId, "Were there any character impressions?"),
  );
  assert.equal(unverifiedImpressions.status, "insufficient-evidence");
  assert.equal(unverifiedImpressions.resultCount, 0);
  laneAnswer(
    richId,
    "Were there any character references?",
    "character-references",
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
    [3644, 7358, 1730, 2308, 7780, 4894, 5039],
  );
  laneAnswer(
    "ThPjds8iI9U",
    "Can I see the best moments?",
    "best-moments",
    [3733, 845, 997, 1419, 3804, 3004, 3740, 4167],
  );
  const topicOnly = queryEngine.answer(
    request("M3P4mMDpXUc", "Can you show me the topics?"),
  );
  assert.equal(topicOnly.status, "supported");
  assert.equal(topicOnly.episode.id, "topics");
  assert.equal(topicOnly.episode.totalReceipts, 11);
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
    "caption-topic-timeline-navigation",
    "caption-title-topic-receipt",
    "caption-topic-navigation",
    "caption-character-signal",
    "caption-character-context",
    "curated-character-performance",
    "reviewed-guide-negative-take",
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
  assert.equal(receiptKeys.size, 6105);
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
    "character-references",
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
        "straight-to-steves-asshole", "character-bits",
        "character-references", "topics",
      ];
    }
    if (formatId === "ranking-show") {
      return [
        "topics", "straight-to-steves-asshole", "best-moments",
        "funny-moments", "up-in-ya", "character-bits",
        "character-references",
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
  const reviewedRejectedSteveCuts = new Set([
    "5svmLdmNud0@8642",
    "Q-ia3Nb9KvM@9804",
    "w8309SyyriA@7547",
  ]);
  const reviewedAcceptedSteveCuts = new Set([
    "ReVyxwuuoAM@5500",
    "7hPJ_zey7hc@10159",
    "nNglwg-IU5g@3915",
    "2lAONSSscQk@248",
    "r7NqiQ_YLcY@6003",
    "7hPJ_zey7hc@5895",
  ]);
  const negativeGate = (receipt, sourceId = "") => {
    const identity = `${sourceId}@${Math.floor(receipt.at)}`;
    if (reviewedRejectedSteveCuts.has(identity)) return false;
    if (
      reviewedAcceptedSteveCuts.has(identity) ||
      receipt.evidenceType === "reviewed-guide-negative-take"
    ) return true;
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
  let characterPerformanceCount = 0;
  let characterPerformanceSourceCount = 0;
  let characterReferenceCount = 0;
  let characterReferenceSourceCount = 0;
  let rejectedNegativeCandidates = 0;
  let distilledRecapCount = 0;
  let topicNavOnlyRecapCount = 0;
  let sourceBriefShowWikiCount = 0;
  let readyMomentRouteCount = 0;
  let readyTopicRouteCount = 0;
  let emptyRouteCount = 0;
  let maxBestMomentLane = 0;

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
      (receipt) =>
        !receipt.showWikiHidden &&
        receipt.kind.toLowerCase().includes("topic"),
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
      assert.ok(recap, source.id);
      assert.equal(recap.format, expectedFormat.label, source.id);
      assert.equal(recap.formatBasis, expectedFormat.basis, source.id);
      assert.match(
        recap.overview,
        /The playable topic doors below show where those subjects come up;/,
        source.id + ":topic-door-boundary",
      );
      assert.match(
        recap.overview,
        /the written story and best-of shelf appear only after somebody has actually read the whole tape\.$/,
        source.id + ":editorial-boundary",
      );
      assert.deepEqual(
        plain(recap.blocks),
        [],
        source.id + ":no-unreviewed-narrative-blocks",
      );
      const recapText = [
        recap.format,
        recap.overview,
        ...recap.blocks.flatMap((block) => [block.label, block.body, block.basis]),
      ].join(" ");
      assert.doesNotMatch(recapText, /explicit performance cue/i, source.id);
      assert.equal(source.summary.text, recap.overview, source.id);
      assert.equal(
        source.summary.basis,
        "structured-source-summary",
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
    );
    const upInYa = moments.filter(
      (receipt) => receipt.label === "UP IN YA" ||
        receipt.label === "OUT OF POCKET",
    );
    const steves = moments.filter((receipt) => negativeGate(receipt, source.id));
    const characterReferences = source.receipts.filter((receipt) => (
      receipt.evidenceType === "caption-character-signal" ||
      receipt.evidenceType === "caption-character-context"
    )).sort(signalOrder);
    const characters = source.receipts.filter(
      (receipt) =>
        receipt.evidenceType === "curated-character-performance",
    ).sort(signalOrder);
    const playableCharacters = [];
    characters.forEach((receipt) => {
      const identity = receipt.entityIds?.[0] ||
        tokensFor(receipt.label).join("-");
      const duplicateIndex = playableCharacters.findIndex((candidate) => {
        const candidateIdentity = candidate.entityIds?.[0] ||
          tokensFor(candidate.label).join("-");
        return identity === candidateIdentity &&
          Math.abs(candidate.at - receipt.at) <= 12;
      });
      if (duplicateIndex < 0) {
        playableCharacters.push(receipt);
      } else if (
        receipt.evidenceBasis === "full-tape-human-editorial-read" &&
        playableCharacters[duplicateIndex].evidenceBasis !==
          "full-tape-human-editorial-read"
      ) {
        playableCharacters[duplicateIndex] = receipt;
      }
    });
    playableCharacters.sort(signalOrder);

    const lane = (id) => source.showWiki.lanes.find((item) => item.id === id);
    assert.deepEqual(plain(lane("topics").receiptKeys), plain(topics.map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("best-moments").receiptKeys), plain(moments.map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("funny-moments").receiptKeys), plain(funny.map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("up-in-ya").receiptKeys), plain(upInYa.map((item) => item.key)), source.id);
    assert.deepEqual(plain(lane("straight-to-steves-asshole").receiptKeys), plain(steves.map((item) => item.key)), source.id);
    assert.deepEqual(
      plain(lane("character-bits").receiptKeys),
      plain(playableCharacters.map((item) => item.key)),
      source.id,
    );
    assert.deepEqual(
      plain(lane("character-references").receiptKeys),
      plain(characterReferences.map((item) => item.key)),
      source.id,
    );
    maxBestMomentLane = Math.max(
      maxBestMomentLane,
      lane("best-moments").receiptKeys.length,
    );

    upInYaCount += upInYa.length;
    stevesCount += steves.length;
    stevesSourceCount += Number(steves.length > 0);
    characterPerformanceCount += characters.length;
    characterPerformanceSourceCount += Number(characters.length > 0);
    characterReferenceCount += characterReferences.length;
    characterReferenceSourceCount += Number(characterReferences.length > 0);
    rejectedNegativeCandidates += moments.filter((receipt) => (
      ["FRANCHISE FELONY", "TAKE GETS NUCLEAR"].includes(receipt.label) &&
      !negativeGate(receipt, source.id) &&
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

  assert.equal(distilledRecapCount, 242);
  assert.equal(topicNavOnlyRecapCount, 17);
  assert.equal(sourceBriefShowWikiCount, 251);
  assert.equal(readyMomentRouteCount, 242);
  assert.equal(readyTopicRouteCount, 17);
  assert.equal(emptyRouteCount, 251);
  assert.ok(upInYaCount > 0, "expected exact UP IN YA receipts");
  assert.equal(stevesSourceCount, 54);
  assert.equal(stevesCount, 59);
  assert.equal(characterPerformanceSourceCount, 15);
  assert.equal(characterPerformanceCount, 32);
  assert.equal(characterReferenceSourceCount, 156);
  assert.equal(characterReferenceCount, 325);
  assert.equal(
    result.sources.filter((source) =>
      source.showWiki.lanes.some((lane) =>
        /character-(?:bits|references)/.test(lane.id) &&
        lane.receiptKeys.length
      )
    ).length,
    171,
  );
  assert.ok(maxBestMomentLane > 6, "expected at least one uncapped Best Moments lane");
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
    assert.equal(negativeGate(candidate, sourceId), false, candidate.excerpt);
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

test("verified character performances stay separate from references and callbacks", () => {
  const { result } = buildFixture();

  for (const [sourceId, expectedEntityIds] of [
    [
      "LV2rmwEA0w4",
      [
        "character:corey-feldman",
        "character:challis",
        "character:loomis",
        "character:slenderman",
      ],
    ],
    ["N-UahfG8-gM", ["character:loomis", "character:challis"]],
  ]) {
    const source = byId(result, sourceId);
    const performanceLane = source.showWiki.lanes.find(
      (lane) => lane.id === "character-bits",
    );
    const referenceLane = source.showWiki.lanes.find(
      (lane) => lane.id === "character-references",
    );
    const receiptByKey = new Map(
      source.receipts.map((receipt) => [receipt.key, receipt]),
    );
    const performanceReceipts = performanceLane.receiptKeys.map(
      (key) => receiptByKey.get(key),
    );
    assert.ok(performanceReceipts.length > 0, sourceId);
    assert.ok(performanceReceipts.every(
      (receipt) =>
        receipt?.evidenceType === "curated-character-performance",
    ), sourceId);
    assert.deepEqual(
      Array.from(new Set(performanceReceipts.flatMap(
        (receipt) => receipt.entityIds.filter(
          (entityId) => entityId.startsWith("character:"),
        ),
      ))).sort(),
      expectedEntityIds.slice().sort(),
      sourceId,
    );
    assert.deepEqual(plain(referenceLane.receiptKeys), [], sourceId);
  }

  const referenceOnly = byId(result, "Z7ArdfA054w");
  const performanceLane = referenceOnly.showWiki.lanes.find(
    (lane) => lane.id === "character-bits",
  );
  const referenceLane = referenceOnly.showWiki.lanes.find(
    (lane) => lane.id === "character-references",
  );
  const receiptByKey = new Map(
    referenceOnly.receipts.map((receipt) => [receipt.key, receipt]),
  );
  assert.deepEqual(plain(performanceLane.receiptKeys), []);
  assert.deepEqual(
    plain(referenceLane.receiptKeys.map((key) => receiptByKey.get(key).label)),
    ["Dr. Challis", "Corey Feldman", "Slenderman"],
  );
  assert.ok(referenceLane.receiptKeys.every((key) =>
    /^caption-character-(?:signal|context)$/.test(
      receiptByKey.get(key).evidenceType,
    )
  ));

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

  const latest = byId(result, "LV2rmwEA0w4").showWiki.recap.overview;
  assert.equal(
    latest,
    "Over 3 hr 33 min, this movie-news show gets into Batman, Marvel, " +
      "Hellraiser, Halloween, Evil Dead, and A Nightmare on Elm Street. " +
      "The playable topic doors below show where those subjects come up; " +
      "the written story and best-of shelf appear only after somebody has " +
      "actually read the whole tape.",
  );
  assert.match(latest, /playable topic doors/i);
  assert.match(latest, /only after somebody has actually read the whole tape/i);
  assert.doesNotMatch(
    latest,
    /six-chapter|twelve-stop|exact-source map|machine-surfaced|automatic-caption/i,
  );
  for (const [sourceId, expectedFirstTopic] of [
    ["WKs1uPGMQvw", "Scream 7"],
    ["QxJyVaAgZ_Y", "FRIDAY THE 13th Livestream! THE FINAL CHAPTER"],
    ["jG93HvyP420", "Halloween Ends"],
    ["Oi-s0ZuWDbM", "Top 15 90's Horror Movies"],
  ]) {
    const source = byId(result, sourceId);
    const episodeRecap = source.showWiki.episodeRecap;
    assert.ok(episodeRecap, sourceId + ":episode-recap");
    assert.equal(
      episodeRecap.topics[0],
      expectedFirstTopic,
      sourceId + ":title-first-topic",
    );
    assert.equal(
      new Set(episodeRecap.topics).size,
      episodeRecap.topics.length,
      sourceId + ":unique-recap-topics",
    );
    assert.ok(
      episodeRecap.topics.every((topic) => (
        typeof topic === "string" && topic.trim().length > 0
      )),
      sourceId + ":nonempty-recap-topics",
    );
    assert.deepEqual(
      plain(source.showWiki.recap.blocks),
      [],
      sourceId + ":no-unreviewed-narrative-blocks",
    );
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


test("the 6,105 receipts retain the exact evidence taxonomy", () => {
  const { result } = buildFixture();
  const receipts = result.sources.flatMap((source) => source.receipts);

  assert.equal(receipts.length, 6105);
  assert.deepEqual(countBy(receipts, "evidenceType"), {
    "caption-topic-timeline-navigation": 1748,
    "caption-excerpt": 1652,
    "caption-topic-receipt": 2016,
    "curated-character-performance": 32,
    "caption-title-topic-receipt": 141,
    "caption-character-context": 261,
    "caption-character-signal": 64,
    "caption-topic-navigation": 173,
    "reviewed-guide-negative-take": 18,
  });
});

test("all 32 promoted human-curated character clips retain exact 14-second bounds", () => {
  const { result, window, showcase } = buildFixture();
  const allSoundbytes = window.WWAM_CHARACTER_LORE.characters.flatMap(
    (character) => character.soundbytes,
  );
  const showcaseSourceIds = new Set(showcase.sources.map((source) => source.id));
  const soundbytes = allSoundbytes.filter(
    (soundbyte) => showcaseSourceIds.has(soundbyte.sourceId),
  );

  assert.equal(allSoundbytes.length, 108);
  assert.equal(soundbytes.length, 32);
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
  assert.equal(live.receipts.length, 31);
  const exactShowcaseReceipts = live.receipts.filter(
    (receipt) => exactReceiptKeys.includes(receipt.key),
  );
  assert.deepEqual(
    exactShowcaseReceipts.map((receipt) => receipt.key).sort(),
    exactReceiptKeys,
  );
  assert.ok(exactShowcaseReceipts.every(
    (receipt) => receipt.evidenceBasis === "exact-showcase-receipt",
  ));
  const hiddenTimelineReceipts = live.receipts.filter(
    (receipt) =>
      receipt.evidenceType === "caption-topic-timeline-navigation",
  );
  assert.equal(hiddenTimelineReceipts.length, 10);
  assert.ok(hiddenTimelineReceipts.every(
    (receipt) => receipt.showWikiHidden && !receipt.publicExcerptAllowed,
  ));
  const scoredLiveMoments = live.receipts.filter((receipt) => receipt.kind === "moment");
  assert.equal(scoredLiveMoments.length, 7);
  assert.ok(scoredLiveMoments.every((receipt) => Number.isFinite(receipt.signalScore)));
  assert.ok(scoredLiveMoments.every((receipt) => receipt.signalBasis === "showcase-receipt-score"));
  assert.equal(live.metrics.momentReceipts, 7);
  assert.equal(live.metrics.topicReceipts, 18);
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
  assert.equal(commentary.receipts.length, 9);
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
  const popularShowcaseKeys = new Set(showcase.receipts
    .filter((receipt) => receipt.sourceId === popular.id)
    .map((receipt) => receipt.id));
  assert.ok(popular.receipts
    .filter((receipt) => popularShowcaseKeys.has(receipt.key))
    .every(
      (receipt) => receipt.evidenceBasis === "exact-showcase-receipt",
    ));
  assert.ok(popular.receipts
    .filter((receipt) => !popularShowcaseKeys.has(receipt.key))
    .every(
      (receipt) => (
        receipt.evidenceType === "caption-topic-timeline-navigation" &&
        receipt.showWikiHidden &&
        !receipt.publicExcerptAllowed
      ) || (
        receipt.evidenceType === "caption-title-topic-receipt" &&
        receipt.key ===
          "jG93HvyP420:title-topic:halloween-ends:1164:0" &&
        !receipt.showWikiHidden &&
        receipt.publicExcerptAllowed
      ),
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
  const allRestricted = result.sources.filter(
    (source) => source.rightsPolicy.restrictedToTopicNavigation,
  );

  assert.equal(archive.length, 188);
  assert.equal(restricted.length, 16);
  assert.ok(
    allRestricted.some((source) => source.id === "R_bXrnNOcwg"),
    "the promoted script-reading source must enter the final rights firewall",
  );
  assert.equal(
    archiveReceipts.filter(
      (receipt) => receipt.evidenceType === "curated-character-performance",
    ).length,
    0,
  );
  assert.equal(characterEvidence.length, 325);
  assert.deepEqual(countBy(characterEvidence, "evidenceType"), {
    "caption-character-context": 261,
    "caption-character-signal": 64,
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
    assert.ok(source.receipts.length >= 10, source.id);
    assert.ok(source.receipts.every(
      (receipt) =>
        receipt.kind === "topic-navigation" &&
        [
          "caption-topic-navigation",
          "caption-title-topic-receipt",
        ].includes(receipt.evidenceType) &&
        receipt.excerpt === "" &&
        receipt.publicExcerptAllowed === false &&
        receipt.reviewState === "quarantined-topic-navigation",
    ));
    assert.equal(source.metrics.topicReceipts, source.receipts.length);
    assert.equal(source.metrics.momentReceipts, 0);
    assert.equal(source.metrics.characterReceipts, 0);
    assert.equal(source.metrics.heatSegments, 0);
    assert.equal(source.metrics.publicExcerptReceipts, 0);
  });
  allRestricted.forEach((source) => {
    assert.ok(source.receipts.every(
      (receipt) =>
        receipt.kind === "topic-navigation" &&
        [
          "caption-topic-navigation",
          "caption-title-topic-receipt",
        ].includes(receipt.evidenceType) &&
        receipt.excerpt === "" &&
        receipt.publicExcerptAllowed === false &&
        receipt.promotionAllowed === false &&
        receipt.reviewState === "quarantined-topic-navigation",
    ), source.id);
    assert.equal(source.metrics.momentReceipts, 0, source.id);
    assert.equal(source.metrics.characterReceipts, 0, source.id);
    assert.equal(source.metrics.publicExcerptReceipts, 0, source.id);
    assert.equal(source.artifacts.length, 0, source.id);
    assert.ok(
      source.showWiki.lanes
        .filter((lane) => lane.id !== "topics")
        .every((lane) => lane.receiptKeys.length === 0),
      source.id,
    );
  });

  const firewall = byId(result, "fpNtQMexZiw");
  assert.ok(firewall.receipts.length >= 10);
  assert.ok(firewall.warnings.some((warning) => /TOPIC NAVIGATION ONLY/.test(warning)));

  const candidate = byId(result, "CFUHyfcJDTg");
  assert.equal(candidate.rightsPolicy.restrictedToTopicNavigation, false);
  assert.equal(candidate.metrics.topicReceipts, 20);
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
    "caption-backed": 259,
    "caption-limited": 9,
    "metadata-only": 242,
  });
  assert.deepEqual(stats.authority, {
    "promoted-lane": 74,
    "quarantined-lane": 188,
    "source-only": 248,
  });
  assert.equal(stats.receipts, 6105);
  assert.equal(stats.artifacts, 924);

  const classifiedTrailer = engine.build("fpNtQMexZiw").source;
  assert.equal(classifiedTrailer.rawContentMode, "trailer-reaction");
  assert.equal(classifiedTrailer.runtimeFormat.id, "trailer-coverage");
  assert.equal(classifiedTrailer.subtype.id, "reaction");
  assert.equal(classifiedTrailer.formatContract.id, "trailer-reaction");

  const live = engine.build("LV2rmwEA0w4");
  assert.equal(live.source.receipts.length, 31);
  assert.equal(live.source.artifacts.length, 27);
  assert.equal(live.wake.total, 268);
  assert.equal(live.wake.matchingTotal, 268);
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

  const commentary = engine.build("6VXSBDZ-3WE");
  const guide = commentary.source.showWiki.episodeGuide;
  assert.deepEqual(plain(guide.shape), {
    runtimeBand: "FEATURE",
    chapters: 5,
    threads: 6,
    cuts: 13,
  });
  assert.match(guide.overview, /Halloween \(1978\)/);
  assert.match(guide.evidenceSummary, /caption matches/i);
  assert.equal(guide.fanRead.whyThisNightMatters.label, "WHY THIS NIGHT MATTERS");
  assert.equal(guide.fanRead.hated.label, "STRAIGHT TO STEVE'S ASSHOLE");
  ["loved", "hated", "wildestDetour", "lastWord"].forEach((key) => {
    const fanReceipt = guide.fanRead[key];
    const canonicalCut = guide.cuts.find((cut) => cut.id === fanReceipt.cutId);
    assert.ok(canonicalCut, key);
    assert.equal(fanReceipt.at, canonicalCut.at, key);
    assert.equal(fanReceipt.end, canonicalCut.end, key);
    assert.equal(fanReceipt.excerpt, canonicalCut.excerpt, key);
  });

  const reviewed = engine.build("lH0EXRN4xdw");
  const reviewedGuide = reviewed.source.showWiki.episodeGuide;
  const reviewedRecap = reviewed.source.showWiki.episodeRecap;
  const legacyProjection = reviewed.source.showWiki.recap;

  assert.equal(reviewedGuide.variant, "review-batch");
  assert.equal(reviewedGuide.format, "review-reaction");
  assert.deepEqual(plain(reviewedGuide.runtimeFormat), {
    id: "spoiler-party",
    label: "SPOILER PARTY",
    basis: "source-title-metadata",
    declaredGuideFormat: "review-reaction",
  });
  assert.match(reviewedGuide.evidenceSummary, /12 cuts and 6 recurring threads/i);
  assert.equal(reviewedGuide.takeArc.length, 3);
  assert.ok(reviewedGuide.takeArc.every(
    (take) => take.promotionAllowed === false,
  ));
  assert.equal(reviewedGuide.recap.paragraphs.length, 4);
  assert.equal(reviewedGuide.reviewChecklist.length, 5);
  assert.equal(reviewedGuide.lanes.hated, null);
  assert.equal(reviewedGuide.lanes.upInYa.cutId, "review-cut-10-9044");
  reviewedGuide.recap.paragraphs.forEach((paragraph) => {
    const canonicalCut = reviewedGuide.cuts.find(
      (cut) => cut.id === paragraph.cutId,
    );
    assert.ok(canonicalCut, paragraph.cutId);
    assert.equal(paragraph.at, canonicalCut.at);
    assert.equal(paragraph.end, canonicalCut.end);
    assert.equal(paragraph.topic, canonicalCut.topic);
    assert.equal(paragraph.excerpt, canonicalCut.excerpt);
  });

  assert.ok(reviewedRecap.evidenceFingerprint);
  assert.equal(
    reviewedRecap.guideRecap.recap.paragraphs.length,
    reviewedGuide.recap.paragraphs.length,
  );
  assert.deepEqual(
    plain(reviewedRecap.guideRecap.reviewChecklist),
    plain(reviewedGuide.reviewChecklist),
  );
  assert.deepEqual(
    plain(reviewedRecap.guideRecap.takeArc),
    plain(reviewedGuide.takeArc.map((take) => ({
      phase: take.phase,
      label: take.label,
      at: take.at,
      end: take.end,
      body: take.body,
      excerpt: take.excerpt,
      category: take.category,
      cutId: take.cutId,
      evidenceBasis: take.evidenceBasis,
      promotionAllowed: false,
    }))),
  );

  const projectedSections = reviewedRecap.sections
    .filter((section) => section.receiptKeys.length > 0)
    .slice(0, 3);
  assert.ok(reviewedRecap.overview.startsWith(legacyProjection.overview));
  assert.deepEqual(
    plain(legacyProjection.blocks.map((block) => block.id)),
    plain(projectedSections.map((section) => section.id)),
  );
  assert.ok(legacyProjection.blocks.every((block, index) => (
    block.label === projectedSections[index].label &&
    block.body === projectedSections[index].body &&
    block.receiptKeys.every((key) =>
      reviewed.source.receipts.some((receipt) => receipt.key === key))
  )));
  assert.equal(reviewed.source.summary.text, legacyProjection.overview);
  assert.equal(
    reviewed.source.summary.basis,
    "episode-recap-compatibility-projection",
  );

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
    33,
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

test("reviewed guide releases may extend the original Deep Distill guide floor", () => {
  const fixture = buildFixture();
  const reviewedGuide = plain(fixture.input.episodeGuides.guides[0]);
  reviewedGuide.id = "ooLNfFkpH6M";

  const result = fixture.window.WWAMSourceDossierAdapter.build({
    ...fixture.input,
    episodeGuides: {
      ...plain(fixture.input.episodeGuides),
      guides: fixture.input.episodeGuides.guides.concat(reviewedGuide),
    },
  });

  assert.equal(result.sources.length, 510);
  assert.ok(byId(result, "ooLNfFkpH6M").episodeGuide);
});

test("reviewed guide format declarations cannot drift from canonical source format", () => {
  assert.throws(
    () => buildFixture(({ input }) => {
      const reviewed = input.episodeGuides.guides.find(
        (record) => record.id === "lH0EXRN4xdw",
      );
      reviewed.episodeGuide.format = "ranking";
    }),
    (error) =>
      error.name === "WWAMSourceDossierAdapterError" &&
      error.code === "EPISODE_GUIDE_FORMAT_DRIFT",
  );
});

test("reviewed recap and lane prose cannot drift from their owning guide cuts", () => {
  const fixture = buildFixture();
  const recapDrift = plain(fixture.result);
  const recapSource = byId(recapDrift, "lH0EXRN4xdw");
  recapSource.showWiki.episodeGuide.recap.paragraphs[0].at += 1;
  assert.throws(
    () => fixture.window.ShokkerSourceDossier.create(recapDrift),
    (error) =>
      error.name === "SourceDossierError" &&
      error.code === "EPISODE_GUIDE_EDITORIAL_CUT_MISMATCH",
  );

  const laneDrift = plain(fixture.result);
  const laneSource = byId(laneDrift, "lH0EXRN4xdw");
  laneSource.showWiki.episodeGuide.lanes.upInYa.excerpt =
    "A sentence borrowed from somewhere else.";
  assert.throws(
    () => fixture.window.ShokkerSourceDossier.create(laneDrift),
    (error) =>
      error.name === "SourceDossierError" &&
      error.code === "EPISODE_GUIDE_EDITORIAL_CUT_MISMATCH",
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
