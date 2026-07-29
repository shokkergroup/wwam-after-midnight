import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "red-band-ranking-v2.js"
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file
    });
  }
  return context.window;
}

function createFull(overrides = {}) {
  const window = load();
  const index = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE,
    ...overrides
  });
  return { window, index };
}

function serial(value) {
  return JSON.parse(JSON.stringify(value));
}

function words(value) {
  return String(value).replace(/ …$/, "").trim().split(/\s+/).filter(Boolean);
}

function hasExplicitBodyOrSexualLexical(value) {
  return /\b(?:dick|cock|penis|jizz|splooge|cum|pussy|vagina|balls?|testicles?|tits?|boobs?|butt\s*plug|butthole|asshole)\w*\b/i.test(
    String(value).replace(/\bdick\s+(?:tracy|warlock)\b/gi, "proper name")
  );
}

function syntheticSource(id, title, quote, category = "FULL SEND") {
  return {
    source: {
      id,
      title,
      date: "2025-10-31",
      duration: 1000,
      url: `https://www.youtube.com/watch?v=${id}`,
      captioned: true,
      moments: [{ t: 100, quote, category, heat: 90 }]
    }
  };
}

test("creates exactly 100 unique playable bounded receipts over the current archive", () => {
  const { window, index } = createFull();

  assert.equal(window.WWAMRedBandRankingV2.VERSION, "2.1.0");
  assert.equal(window.WWAMRedBandRankingV2.DEFAULT_LIMIT, 100);
  assert.equal(window.WWAMRedBandRankingV2.EXCERPT_WORD_LIMIT, 16);
  assert.equal(index.rankings.length, 100);
  assert.equal(index.metrics.rankedReceipts, 100);
  assert.equal(index.metrics.uniqueRankKeys, 100);
  assert.equal(index.metrics.exactDefaultSatisfied, true);
  assert.ok(index.metrics.playableCandidates > 100);

  const rankKeys = new Set();
  const receiptKeys = new Set();
  index.rankings.forEach((item, offset) => {
    assert.equal(item.rank, offset + 1);
    assert.ok(!rankKeys.has(item.rankKey), item.rankKey);
    rankKeys.add(item.rankKey);
    assert.ok(!receiptKeys.has(`${item.sourceId}@${Math.round(item.t)}`));
    receiptKeys.add(`${item.sourceId}@${Math.round(item.t)}`);
    assert.match(item.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.ok(Number.isFinite(item.t));
    assert.equal(item.tapeId, item.sourceId);
    assert.equal(item.timestamp, item.t);
    assert.ok(item.category);
    assert.ok(item.quote);
    assert.ok(words(item.quote).length <= 16, item.quote);
    assert.equal(item.excerptWordLimit, 16);
    assert.ok(item.score >= 0 && item.score <= 100);
    assert.ok(item.confidence >= 0 && item.confidence <= 1);
    assert.equal(typeof item.humanCurated, "boolean");
    assert.match(
      item.humanCurationStatus,
      /PRESELECTED CANDIDATE|NO PRESELECTED-CANDIDATE CLAIM/
    );
    assert.doesNotMatch(item.humanCurationStatus, /^HUMAN-CURATED/);
    assert.equal(item.preselectedCandidate, item.humanCurated);
    assert.equal(item.creatorVoteClaim, false);
    assert.equal(item.editorSelectionAuthenticated, false);
    assert.equal(item.selectionProvenance.authenticatedCreatorVote, false);
    assert.equal(item.selectionProvenance.authenticatedEditorDecision, false);
    assert.equal(typeof item.characterLoreReceipt, "boolean");
    assert.equal(item.receiptCoherence.policyVersion, "receipt-coherence/v1");
    assert.ok(item.receiptCoherence.score >= 0 && item.receiptCoherence.score <= 100);
    assert.equal(item.receiptCoherence.languageNeutral, true);
    assert.equal(
      item.diversityControl.receiptCoherenceScore,
      item.receiptCoherence.score
    );
    assert.ok(item.whyMemorable.length >= 1);
    assert.match(item.whyMemorableSummary, /Receipt anchor:/);
    assert.ok(item.basis.length >= 4);
  });
});

test("Top 25 reports strict diversity selection and every bounded fallback", () => {
  const { window, index } = createFull();
  const policy = window.WWAMRedBandRankingV2.TOP_SLICE_POLICY;
  const top = index.rankings.slice(0, policy.window);
  const categoryCounts = top.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
  const lexicalCount = top.filter((item) =>
    hasExplicitBodyOrSexualLexical(item.quote)
  ).length;
  const preselectedCount = top.filter((item) => item.preselectedCandidate).length;
  const diagnostics = index.diagnostics.topSliceDiversity;
  const strictTop = top.filter((item) => item.diversityControl.strictPolicyPass);
  const relaxedTop = top.filter((item) => item.diversityControl.constraintRelaxed);
  const strictCategoryCounts = strictTop.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
  const strictLexicalCount = strictTop.filter((item) =>
    hasExplicitBodyOrSexualLexical(item.quote)
  ).length;
  const strictPreselectedCount = strictTop.filter(
    (item) => item.preselectedCandidate
  ).length;

  assert.equal(top.length, 25);
  assert.ok(
    strictLexicalCount <= policy.maximumExplicitBodyOrSexualLexical,
    `strict explicit lexical count ${strictLexicalCount}`
  );
  assert.ok(
    strictPreselectedCount <= policy.maximumPreselectedCandidates,
    `strict preselected count ${strictPreselectedCount}`
  );
  assert.ok(
    Math.max(...Object.values(strictCategoryCounts)) <= policy.maximumPerCategory
  );
  assert.equal(strictTop.length, 22);
  assert.equal(relaxedTop.length, 3);
  assert.equal(
    strictTop.length,
    diagnostics.selectedUnderStrictPolicy
  );
  assert.equal(
    relaxedTop.length,
    diagnostics.selectedAfterConstraintRelaxation
  );
  assert.equal(
    relaxedTop.every((item) => item.diversityControl.deferralReasons.length >= 1),
    true
  );
  assert.equal(lexicalCount, 7);
  assert.equal(preselectedCount, 11);
  assert.equal(Math.max(...Object.values(categoryCounts)), 7);
  assert.equal(Object.keys(categoryCounts).length, 6);
  assert.ok(new Set(top.map((item) => item.sourceId)).size >= 20);
  assert.equal(
    top.every((item) => item.receiptCoherence.eligibleForTopSlice),
    true
  );
  assert.equal(diagnostics.explicitBodyOrSexualLexicalCount, lexicalCount);
  assert.equal(diagnostics.preselectedCandidateCount, preselectedCount);
  assert.equal(
    new Set(index.rankings.map((item) => item.whyMemorableSummary)).size,
    100
  );
  assert.match(diagnostics.interpretation, /Raw machine scores are computed first/);
  assert.equal(diagnostics.receiptCoherence.beforeGate.failed, 2);
  assert.equal(diagnostics.receiptCoherence.afterGate.failed, 0);
  assert.ok(
    diagnostics.receiptCoherence.afterGate.meanScore >
      diagnostics.receiptCoherence.beforeGate.meanScore
  );
  assert.equal(
    diagnostics.receiptCoherence.afterGate.minimumScore >
      diagnostics.receiptCoherence.beforeGate.minimumScore,
    true
  );
  assert.equal(index.methodology.topSliceDiversity.creatorVoteClaim, false);
  assert.equal(index.methodology.topSliceDiversity.comedyQualityClaim, false);
  assert.equal(
    window.WWAMRedBandRankingV2.RECEIPT_COHERENCE_POLICY.languageNeutral,
    true
  );
});

test("current thin sauce fragment remains in coherence diagnostics and outside the showcase", () => {
  const { index } = createFull();
  const receipt = index.getByReceiptKey("kX3wb5pBRDo@1223");
  const failure =
    index.diagnostics.topSliceDiversity.receiptCoherence.beforeGate.failedReceipts.find(
      (item) => item.receiptKey === "kX3wb5pBRDo@1223"
    );

  assert.equal(receipt, null);
  assert.ok(failure, "known fragment must remain visible in gate diagnostics");
  assert.equal(failure.score, 44.17);
  assert.deepEqual(
    serial(failure.flags),
    ["thin-context", "repetition-loop", "boundary-fragment"]
  );
  assert.equal(
    index.rankings.slice(0, 25).some(
      (item) => `${item.sourceId}@${Math.round(item.t)}` === failure.receiptKey
    ),
    false
  );
  assert.equal(
    index.diagnostics.topSliceDiversity.receiptCoherence.afterGate.failed,
    0
  );
});

test("synthetic coherence gate defers filler loops without sanitizing coherent wild language", () => {
  const window = load();
  const categories = [
    "THE ROOM BREAKS",
    "OUT OF POCKET",
    "UP IN YA",
    "FULL SEND",
    "TAKE GETS NUCLEAR",
    "KILL ROOM",
    "BREAKDOWN",
    "BIT ENERGY"
  ];
  const thin = syntheticSource(
    "synthetic-thin",
    "Synthetic Thin Fragment",
    "sauce yeah yeah yeah i can't i can't go there i can't …",
    "THE ROOM BREAKS"
  ).source;
  thin.moments[0].heat = 100;
  const wild = syntheticSource(
    "synthetic-wild",
    "Synthetic Complete Wild Receipt",
    "fuck this haunted tax audit the killer weaponizes a cursed casserole before midnight",
    "OUT OF POCKET"
  ).source;
  wild.moments[0].heat = 99;
  const coherent = Array.from({ length: 38 }, (_, index) =>
    syntheticSource(
      `coherent-${index}`,
      `Coherent ${index}`,
      `alpha${index} beta${index} gamma${index} delta${index} epsilon${index} zeta${index} eta${index} theta${index}`,
      categories[index % categories.length]
    ).source
  );
  const index = window.WWAMRedBandRankingV2.create({
    catalog: [],
    deep: {},
    live: { streams: [thin, wild, ...coherent] },
    popular: {},
    curation: {},
    characters: {},
    limit: 40
  });
  const thinResult = index.getByReceiptKey("synthetic-thin@100");
  const wildResult = index.getByReceiptKey("synthetic-wild@100");
  const beforeFailed =
    index.diagnostics.topSliceDiversity.receiptCoherence.beforeGate.failedReceipts;

  assert.ok(
    beforeFailed.some((item) => item.receiptKey === "synthetic-thin@100"),
    "counterfactual diversity-only selection should expose the thin fragment"
  );
  assert.ok(thinResult);
  assert.ok(thinResult.rank > 25);
  assert.equal(thinResult.diversityControl.deferredFromTopSlice, true);
  assert.equal(
    thinResult.diversityControl.deferralReasons.some((reason) =>
      reason.startsWith("receipt-coherence:")
    ),
    true
  );
  assert.ok(wildResult);
  assert.equal(wildResult.receiptCoherence.eligibleForTopSlice, true);
  assert.equal(wildResult.receiptCoherence.languageNeutral, true);
  assert.equal(
    wildResult.receiptCoherence.flags.length,
    0,
    "wild vocabulary is not a negative coherence signal"
  );
  assert.equal(index.rankings.length, 40);
  assert.equal(new Set(index.rankings.map((item) => item.rankKey)).size, 40);
});

test("publishes transparent percentile components and never makes speaker or origin claims", () => {
  const { index } = createFull();
  const componentNames = [
    "categoryIntensity",
    "roomBreak",
    "languageVoltage",
    "loreCallback",
    "humanCuration",
    "sourceDiversity"
  ];

  index.rankings.forEach((item) => {
    componentNames.forEach((name) => {
      const component = item.scoreComponents[name];
      assert.ok(component);
      assert.ok(component.raw >= 0);
      assert.ok(component.percentile >= 0 && component.percentile <= 100);
      assert.ok(component.weight > 0);
      assert.ok(component.points >= 0);
    });
    assert.equal(item.scoreComponents.recency.enabled, false);
    assert.equal(item.scoreComponents.recency.adjustment, 0);
    assert.equal(item.scoreComponents.recency.label, "RECENCY EXCLUDED");
    assert.equal(item.speaker, null);
    assert.equal(item.host, null);
    assert.equal(item.trueOriginClaim, false);
    assert.equal(item.syntheticQuote, false);
    assert.equal(item.provenance.speakerStatus, "not-diarized");
    assert.equal(item.provenance.originClaim, false);
    assert.equal(item.provenance.hostAuthorshipClaim, false);
  });
});

test("editorial votes default to literal zero and move scores only when supplied", () => {
  const { index: baseline } = createFull();
  assert.equal(
    baseline.rankings.every((item) => item.editorialVote === 0),
    true
  );
  assert.equal(baseline.diagnostics.editorialVotes.suppliedNonZero, 0);
  assert.equal(
    Object.values(baseline.getEditorialVoteTemplate()).every((vote) => vote === 0),
    true
  );

  const target = baseline.rankings[45];
  const { index: voted } = createFull({
    editorialVotes: { [target.editorialVoteKey]: 5 }
  });
  const changed = voted.getByReceiptKey(target.editorialVoteKey);
  assert.equal(changed.editorialVote, 5);
  assert.equal(changed.scoreComponents.editorialVote.adjustment, 7.5);
  assert.equal(
    changed.scoreComponents.editorialVote.source,
    "SUPPLIED EDITORIAL VOTE"
  );
  assert.ok(changed.score > target.score);
});

test("recency is opt-in, explicitly labeled, and bounded", () => {
  const { index: baseline } = createFull();
  const { index: recency } = createFull({ includeRecency: true });

  assert.equal(baseline.diagnostics.recency.enabled, false);
  assert.equal(recency.diagnostics.recency.enabled, true);
  assert.equal(
    recency.diagnostics.recency.label,
    "RECENCY BOOST (EXPLICITLY ENABLED)"
  );
  recency.rankings.forEach((item) => {
    assert.equal(item.scoreComponents.recency.enabled, true);
    assert.match(item.scoreComponents.recency.label, /EXPLICITLY ENABLED/);
    assert.ok(Math.abs(item.scoreComponents.recency.adjustment) <= 3);
  });
});

test("ranking is deterministic even when all input arrays are reversed", () => {
  const window = load();
  const baseline = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE
  });
  const reversed = window.WWAMRedBandRankingV2.create({
    catalog: [...window.WWAM_CATALOG].reverse(),
    deep: {
      ...window.WWAM_DEEP_DISTILL,
      tapes: [...window.WWAM_DEEP_DISTILL.tapes].reverse().map((tape) => ({
        ...tape,
        moments: [...tape.moments].reverse()
      })),
      hot100: [...window.WWAM_DEEP_DISTILL.hot100].reverse()
    },
    live: {
      ...window.WWAM_LIVESTREAMS,
      streams: [...window.WWAM_LIVESTREAMS.streams].reverse().map((stream) => ({
        ...stream,
        moments: [...stream.moments].reverse()
      }))
    },
    popular: {
      ...window.WWAM_POPULAR_LIVE,
      streams: [...window.WWAM_POPULAR_LIVE.streams].reverse().map((stream) => ({
        ...stream,
        moments: [...stream.moments].reverse()
      }))
    },
    curation: {
      ...window.WWAM_CURATED,
      upInYa: [...window.WWAM_CURATED.upInYa].reverse()
    },
    characters: {
      ...window.WWAM_CHARACTER_LORE,
      characters: [...window.WWAM_CHARACTER_LORE.characters].reverse().map((character) => ({
        ...character,
        soundbytes: [...(character.soundbytes || [])].reverse(),
        creatorContext: [...(character.creatorContext || [])].reverse()
      }))
    }
  });

  assert.deepEqual(
    serial(reversed.rankings),
    serial(baseline.rankings)
  );
  assert.equal(reversed.metrics.archiveFingerprint, baseline.metrics.archiveFingerprint);
});

test("content-derived tie resolution does not follow source-ID lexical order", () => {
  const window = load();
  const first = syntheticSource(
    "aaa-source",
    "Second Content Tape",
    "goddamn killer nightmare garbage breaks the room into helpless laughter"
  );
  const second = syntheticSource(
    "zzz-source",
    "First Content Tape",
    "fucking murder theory turns into a giant callback and everyone loses it"
  );
  const create = (sources) =>
    window.WWAMRedBandRankingV2.create({
      catalog: [],
      deep: {},
      live: { streams: sources.map((item) => item.source) },
      popular: {},
      curation: {},
      characters: {},
      limit: 2
    });

  const original = create([first, second]);
  const renamed = create([
    {
      source: {
        ...first.source,
        id: "zzz-renamed",
        url: "https://www.youtube.com/watch?v=zzz-renamed"
      }
    },
    {
      source: {
        ...second.source,
        id: "aaa-renamed",
        url: "https://www.youtube.com/watch?v=aaa-renamed"
      }
    }
  ]);

  assert.deepEqual(
    original.rankings.map((item) => item.quote),
    renamed.rankings.map((item) => item.quote)
  );
  assert.match(original.diagnostics.collisions.tieBreakPolicy, /Source-ID lexical order is never/);
});

test("near-duplicate transcript variants cannot crowd the Top 25", () => {
  const window = load();
  const categories = [
    "THE ROOM BREAKS",
    "OUT OF POCKET",
    "UP IN YA",
    "FULL SEND",
    "TAKE GETS NUCLEAR",
    "KILL ROOM",
    "BREAKDOWN",
    "BIT ENERGY"
  ];
  const duplicateSources = Array.from({ length: 8 }, (_, index) =>
    syntheticSource(
      `duplicate-${index}`,
      `Duplicate ${index}`,
      `laughing duplicate ritual detonates impossible callback thunder goddamn nightmare token${index}`,
      categories[index % categories.length]
    ).source
  );
  const distinctSources = Array.from({ length: 28 }, (_, index) =>
    syntheticSource(
      `distinct-${index}`,
      `Distinct ${index}`,
      `unique${index} comet${index} lantern${index} orbit${index} mosaic${index} signal${index} chorus${index} erupts tonight`,
      categories[index % categories.length]
    ).source
  );
  const index = window.WWAMRedBandRankingV2.create({
    catalog: [],
    deep: {},
    live: { streams: duplicateSources.concat(distinctSources) },
    popular: {},
    curation: {},
    characters: {},
    limit: 40
  });
  const topDuplicates = index.rankings
    .slice(0, 25)
    .filter((item) => item.quote.includes("duplicate ritual"));
  const deferredDuplicate = index.rankings.find(
    (item) =>
      item.quote.includes("duplicate ritual") &&
      item.diversityControl.deferredFromTopSlice
  );

  assert.equal(topDuplicates.length, 1);
  assert.ok(deferredDuplicate);
  assert.equal(
    deferredDuplicate.diversityControl.deferralReasons.some((reason) =>
      reason.startsWith("near-duplicate:")
    ),
    true
  );
});

test("diagnostics report lane, franchise, category, collision, and tie health", () => {
  const { index } = createFull();
  const diversity = index.diagnostics.diversity;
  const collisions = index.diagnostics.collisions;

  assert.ok(diversity.ranked.lanes.length >= 2);
  assert.ok(diversity.ranked.franchises.length >= 4);
  assert.ok(diversity.ranked.categories.length >= 4);
  assert.ok(diversity.ranked.uniqueSources > 10);
  assert.ok(diversity.ranked.sourceConcentration > 0);
  assert.ok(collisions.ingestedContributions > collisions.uniquePlayableCandidates);
  assert.ok(collisions.mergedReceiptCollisions > 0);
  assert.equal(collisions.rankKeyCollisions, 0);
  assert.match(collisions.tieBreakPolicy, /content-derived fingerprint/);
  assert.equal(index.diagnostics.curation.supplied, 25);
  assert.ok(index.diagnostics.curation.matchedToPlayableReceipt >= 20);
});

test("small archives honestly return every available playable receipt", () => {
  const window = load();
  const source = syntheticSource(
    "small-source",
    "Small Archive",
    "the room breaks when the killer take goes completely nuclear"
  );
  const index = window.WWAMRedBandRankingV2.create({
    catalog: [],
    deep: {},
    live: { streams: [source.source] },
    popular: {},
    curation: {},
    characters: {}
  });

  assert.equal(index.rankings.length, 1);
  assert.equal(index.metrics.playableCandidates, 1);
  assert.equal(index.metrics.exactDefaultSatisfied, true);
});
