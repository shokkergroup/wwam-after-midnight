import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "correction-ripple-engine.js",
    "trust-engine.js"
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file
    });
  });
  return sandbox.window;
}

function createCurrent(window) {
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  });
  const trust = window.WWAMTrustEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
    showcase
  });
  return { showcase, trust };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Trust Desk is deterministic and reports the complete v4 evidence surface", () => {
  const window = load();
  const first = createCurrent(window).trust;
  const second = createCurrent(window).trust;

  assert.equal(window.WWAMTrustEngine.VERSION, "1.2.0");
  assert.equal(first.engine, "WWAM TRUST / CANON DESK");
  assert.equal(first.snapshotDate, "2026-07-23");
  assert.deepEqual(plain(first.metrics), plain(second.metrics));
  assert.deepEqual(
    plain(first.reviewCandidates),
    plain(second.reviewCandidates)
  );
  assert.deepEqual(
    plain(first.correctionPackets),
    plain(second.correctionPackets)
  );

  assert.equal(first.metrics.sources, 74);
  assert.equal(first.metrics.receipts, 877);
  assert.equal(first.metrics.healthySources, 71);
  assert.equal(first.metrics.limitedSources, 3);
  assert.equal(first.metrics.blockedSources, 0);
  assert.equal(first.metrics.brokenSourceLinks, 0);
  assert.equal(first.metrics.invalidTimestamps, 0);
  assert.equal(first.metrics.machineReceipts, 847);
  assert.equal(first.metrics.curatedCandidateReceipts, 30);
  assert.equal(first.metrics.editorReceipts, 0);
  assert.equal(first.metrics.creatorReceipts, 0);
  assert.equal(first.metrics.publicExcerptViolations, 362);
  assert.equal(first.metrics.reviewCandidates, 95);
  assert.equal(first.metrics.correctionPackets, 95);
  assert.equal(first.metrics.rippleReadyPackets, 90);
  assert.equal(first.metrics.rippleBlockedPackets, 5);
  assert.equal(first.metrics.rippleExactReceiptRecords, 921);
  assert.equal(first.metrics.rippleSourceOnlyRecords, 2508);
  assert.equal(first.metrics.contributionPackets, 4);
  assert.equal(first.policy.noSpeakerGuessing, true);
  assert.equal(first.policy.generatedCharacterAudioAllowed, false);
  assert.equal(first.correctionRipple.registeredRecords, 1396);
  assert.equal(first.correctionRipple.registeredSurfaces.length, 9);
  assert.deepEqual(
    plain(first.correctionRipple.registryHealth),
    {
      sources: 74,
      receipts: 877,
      duplicateSourceIds: [],
      duplicateReceiptIds: [],
    },
  );
  first.correctionPackets.forEach((packet) => {
    assert.equal(packet.schema, "wwam.correction.v2");
    assert.equal(packet.dryRunRipple.mode, "DRY_RUN");
    assert.equal(packet.dryRunRipple.mutationPolicy.canonMutation, "NONE");
  });
  first.correctionPackets
    .filter((packet) => !packet.dryRunRipple.analysisComplete)
    .forEach((packet) => {
      assert.equal(
        packet.dryRunRipple.status,
        "BLOCKED_UNRESOLVED_EVIDENCE",
      );
      assert.deepEqual(plain(packet.dryRunRipple.dependencies), {
        exactReceipt: [],
        sourceOnly: [],
      });
    });
});

test("source health separates valid archives from transcript-limited sources", () => {
  const window = load();
  const { trust } = createCurrent(window);
  const limited = trust.sourceHealth
    .filter((source) => source.status === "LIMITED")
    .map((source) => source.id)
    .sort();

  assert.deepEqual(plain(limited), [
    "AzrcgoyE7C4",
    "cQAVmNFQmoI",
    "x6tvsGRHgU0"
  ]);
  trust.sourceHealth.forEach((source) => {
    assert.match(source.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.equal(source.receiptCoverage.invalidTimestamps, 0);
    assert.equal(source.receiptCoverage.emptyExcerpts, 0);
    assert.equal(source.canonClaimReady, false);
  });

  const missingCommentary = trust.getSourceHealth("AzrcgoyE7C4");
  assert.equal(missingCommentary.captioned, false);
  assert.equal(missingCommentary.date, "2018-03-22");
  assert.equal(missingCommentary.duration, 7247);
  assert.ok(missingCommentary.issues.includes("CAPTIONS_UNAVAILABLE"));
  assert.ok(!missingCommentary.issues.includes("DATE_MISSING_OR_INVALID"));
  assert.ok(!missingCommentary.issues.includes("DURATION_MISSING"));
  assert.equal(missingCommentary.archiveReady, false);

  const healthy = trust.getSourceHealth("6VXSBDZ-3WE");
  assert.equal(healthy.status, "HEALTHY");
  assert.ok(healthy.receiptCoverage.total > 0);
  assert.match(
    healthy.provenance.caution,
    /do not by themselves prove speaker, target, or intent/
  );
});

test("the character firewall counts only curated performances and never guesses a clip speaker", () => {
  const window = load();
  const { showcase, trust } = createCurrent(window);
  const characters = trust.characterAudits.grounded;

  assert.equal(characters.length, 4);
  assert.equal(trust.metrics.timestampValidatedCuratedPerformances, 30);
  assert.equal(trust.metrics.authenticatedEditorVerifiedPerformances, 0);
  assert.equal(trust.metrics.ordinaryCharacterMentionsQuarantined, 12);
  assert.equal(trust.metrics.aliasCollisions, 2);

  const allValidated = new Set(
    characters.flatMap((character) => character.timestampValidatedPerformanceIds)
  );
  const allOrdinary = new Set(
    characters.flatMap((character) => character.ordinaryMentionReceiptIds)
  );
  assert.equal(
    [...allValidated].some((receiptId) => allOrdinary.has(receiptId)),
    false
  );

  characters.forEach((character) => {
    const validatedPerformanceIds = new Set(
      character.timestampValidatedPerformanceIds
    );
    assert.equal(character.canGenerateLabeledTextParody, true);
    assert.equal(character.canGenerateCharacterAudio, false);
    assert.equal(character.canClaimSpecificHostSpokeInEachClip, false);
    assert.ok(character.timestampValidatedPerformanceIds.length >= 3);
    assert.deepEqual(plain(character.authenticatedEditorVerifiedPerformanceIds), []);
    character.soundbytes.forEach((soundbyte) => {
      const isValidatedPerformance = validatedPerformanceIds.has(
        soundbyte.receiptId
      );
      assert.equal(
        soundbyte.timestampValidatedCuratedCandidate,
        isValidatedPerformance
      );
      assert.equal(soundbyte.sourceResolved, isValidatedPerformance);
      assert.equal(soundbyte.timestampValid, isValidatedPerformance);
      assert.equal(soundbyte.authenticatedEditorVerified, false);
      assert.equal(soundbyte.specificSpeakerVerified, false);
      assert.match(
        soundbyte.attributionMode,
        /owner-mapped-character \/ clip-not-diarized/
      );
    });
  });

  const loomis = characters.find(
    (character) => character.id === "character:loomis"
  );
  assert.equal(loomis.ordinaryMentionReceiptIds.length, 12);
  assert.equal(loomis.aliasCollisionReceiptIds.length, 2);
  loomis.aliasCollisionReceiptIds.forEach((receiptId) => {
    const receipt = showcase.receipts.find((item) => item.id === receiptId);
    assert.match(receipt.excerpt, /Billy Loomis/i);
    assert.notEqual(receipt.type, "character-performance");
  });

  const locked = trust.characterAudits.locked[0];
  assert.equal(locked.id, "character:marky-mark");
  assert.equal(locked.performedBy, null);
  assert.equal(locked.askEnabled, false);
  const performerPacket = trust.contributionPackets.find(
    (packet) => packet.kind === "performer-verification"
  );
  assert.ok(performerPacket);
  assert.equal(performerPacket.proposedEvidence.performer, null);
  assert.match(performerPacket.safety, /cannot assign a speaker/);
});

test("opinion timelines and courts remain inference until target and human review are proven", () => {
  const window = load();
  const { showcase, trust } = createCurrent(window);

  assert.equal(trust.metrics.timelines, 49);
  assert.equal(trust.metrics.canonEligibleTimelines, 0);
  assert.equal(trust.metrics.canonEligibleMovements, 0);
  assert.equal(trust.metrics.courts, 14);
  assert.equal(trust.metrics.canonEligibleCourts, 0);

  trust.timelineAudits.forEach((timeline) => {
    assert.equal(timeline.canonEligible, false);
    assert.match(timeline.safePublicLabel, /INFERENCE/);
    assert.match(timeline.prohibition, /Do not say a host changed their opinion/);
    timeline.movementAudits.forEach((movement) => {
      assert.equal(movement.canonEligible, false);
    });
  });
  trust.courtAudits.forEach((court) => {
    assert.equal(court.canonEligible, false);
    assert.equal(court.verdict, "OPEN");
    assert.equal(court.safePublicLabel, "MACHINE-SURFACED ARGUMENT BOARD");
  });

  const friday = trust.timelineAudits.find(
    (timeline) => timeline.subject === "Friday the 13th"
  );
  const projected = new Set(friday.projectedOrAmbiguousReceiptIds);
  const snakeReceipt = showcase.receipts.find((receipt) =>
    /I HATE SNAKES/i.test(receipt.excerpt)
  );
  assert.ok(snakeReceipt);
  assert.equal(projected.has(snakeReceipt.id), true);

  const projectionIssue = trust.reviewCandidates.find(
    (candidate) => candidate.id === "opinion-target-projection"
  );
  assert.ok(projectionIssue);
  assert.equal(projectionIssue.severity, "HIGH");
  assert.match(
    projectionIssue.recommendation,
    /Require explicit whole-work language/
  );

  const negationIssue = trust.reviewCandidates.find(
    (candidate) => candidate.id === "negated-sentiment"
  );
  assert.ok(negationIssue);
  assert.ok(
    negationIssue.evidence.some(
      (receipt) =>
        receipt.sourceId === "jG93HvyP420" &&
        /wasn't that bad/i.test(receipt.excerpt)
    )
  );
});

test("bare editor or creator labels cannot authenticate Time Machine or Court canon", () => {
  const window = load();
  const source = {
    id: "authproof01",
    type: "commentary",
    lane: "commentary",
    lanes: ["commentary"],
    title: "Authentication proof fixture",
    date: "2026-01-01",
    duration: 600,
    url: "https://www.youtube.com/watch?v=authproof01",
    captioned: true,
    wordsAudited: 1000
  };
  const makeReceipt = (id, t, excerpt, sentiment, evidenceLevel) => ({
    id,
    sourceId: source.id,
    sourceType: "commentary",
    sourceLane: "commentary",
    sourceLanes: ["commentary"],
    sourceTitle: source.title,
    date: source.date,
    t,
    url: `${source.url}&t=${t}s`,
    type: "moment",
    category: "TAKE GETS NUCLEAR",
    excerpt,
    score: 90,
    sentiment,
    sentimentConfidence: 0.99,
    evidenceLevel,
    entityIds: ["film:synthetic-movie"]
  });
  const receipts = [
    makeReceipt(
      "positive-editor",
      10,
      "Synthetic Movie is an amazing film.",
      "positive",
      "editor"
    ),
    makeReceipt(
      "positive-creator",
      20,
      "I love Synthetic Movie.",
      "positive",
      "creator"
    ),
    makeReceipt(
      "negative-editor",
      30,
      "Synthetic Movie is a terrible film.",
      "negative",
      "editor"
    ),
    makeReceipt(
      "negative-creator",
      40,
      "I hate Synthetic Movie.",
      "negative",
      "creator"
    )
  ];
  const makeShowcase = (values) => ({
    snapshotDate: "2026-01-01",
    inputFingerprint: "authproof",
    sources: [source],
    receipts: values,
    memoryGraph: {
      nodes: [{ id: "film:synthetic-movie", type: "film", label: "Synthetic Movie" }],
      edges: []
    },
    takeTimeMachines: [
      {
        id: "timeline:authentication-proof",
        subjectId: "film:synthetic-movie",
        subject: "Synthetic Movie",
        subjectType: "film",
        receipts: values.map((receipt) => receipt.id),
        movements: [
          {
            from: "negative",
            to: "positive",
            beforeReceiptId: "negative-editor",
            afterReceiptId: "positive-editor"
          }
        ]
      }
    ],
    courtCandidates: [
      {
        id: "court:authentication-proof",
        title: "Synthetic Movie Court",
        subjectId: "film:synthetic-movie",
        subject: "Synthetic Movie",
        prosecution: [
          { receiptId: "negative-editor" },
          { receiptId: "negative-creator" }
        ],
        defense: [
          { receiptId: "positive-editor" },
          { receiptId: "positive-creator" }
        ]
      }
    ]
  });
  const createTrust = (values) =>
    window.WWAMTrustEngine.create({
      catalog: [source],
      deep: { generated: "2026-01-01", method: "Synthetic authentication fixture." },
      live: {},
      popular: {},
      characters: { characters: [], lockedCandidates: [] },
      dna: { qualityGates: { publicExcerptWords: 16 } },
      showcase: makeShowcase(values)
    });

  const bareLabels = createTrust(receipts);
  const timeline = bareLabels.timelineAudits[0];
  const court = bareLabels.courtAudits[0];
  assert.equal(timeline.directOpinionReceiptIds.length, 4);
  assert.equal(timeline.movementAudits[0].semanticSupport, true);
  assert.equal(timeline.movementAudits[0].humanVerified, false);
  assert.equal(timeline.movementAudits[0].canonEligible, false);
  assert.equal(timeline.canonEligible, false);
  assert.equal(court.argumentBoardEligible, true);
  assert.equal(court.canonEligible, false);
  assert.ok(
    court.prosecution
      .concat(court.defense)
      .every((item) => item.authenticatedEditorialDecision === false)
  );

  const highScoringCreator = bareLabels.explainConfidence({
    kind: "receipt",
    id: "positive-creator"
  });
  assert.equal(highScoringCreator.band, "HIGH");
  assert.equal(highScoringCreator.capabilities.canonEligible, false);

  const authenticated = receipts.map((receipt) => ({
    ...receipt,
    ...(receipt.evidenceLevel === "editor"
      ? { authenticatedEditorVerified: true }
      : { authenticatedCreatorCertified: true })
  }));
  const authenticatedTrust = createTrust(authenticated);
  assert.equal(
    authenticatedTrust.timelineAudits[0].movementAudits[0].humanVerified,
    true
  );
  assert.equal(authenticatedTrust.timelineAudits[0].canonEligible, true);
  assert.equal(authenticatedTrust.courtAudits[0].canonEligible, true);
});

test("Popular 25 ranking is healthy while performance wording is quarantined", () => {
  const window = load();
  const { trust } = createCurrent(window);
  const ranking = trust.popularRankingAudit;

  assert.equal(ranking.valid, true);
  assert.equal(ranking.sourceCount, 25);
  assert.equal(ranking.uniqueSourceIds, true);
  assert.equal(ranking.ranksSequential, true);
  assert.equal(ranking.viewsDescending, true);
  assert.deepEqual(plain(ranking.excludedSourceOverlap), []);
  assert.match(ranking.caution, /view count at the recorded snapshot/);

  assert.equal(trust.popularEditorialAudits.length, 20);
  trust.popularEditorialAudits.forEach((audit) => {
    assert.equal(audit.canonEligible, false);
    assert.match(
      audit.currentWordingRisk,
      /lexical persona cue or prompt is not proof/
    );
    assert.match(audit.recommendedWording, /machine-detected/i);
  });
});

test("confidence explanations and correction packets expose safe UI-ready contracts", () => {
  const window = load();
  const { trust } = createCurrent(window);

  const source = trust.explainConfidence({
    kind: "source",
    id: "6VXSBDZ-3WE"
  });
  assert.equal(source.kind, "source");
  assert.ok(source.score >= 90);
  assert.equal(source.capabilities.canonEligible, false);

  const performance = trust.explainConfidence({
    kind: "receipt",
    id: "character-receipt:loomis-wolverine"
  });
  assert.equal(performance.capabilities.timestampValidatedCuratedCandidate, true);
  assert.equal(performance.capabilities.authenticatedEditorVerified, false);
  assert.equal(performance.capabilities.specificSpeakerVerified, false);
  assert.ok(performance.limits.some((limit) => /does not identify which host/.test(limit)));

  const machine = trust.explainConfidence({
    kind: "receipt",
    id: "6VXSBDZ-3WE-4185"
  });
  assert.equal(machine.capabilities.canonEligible, false);
  assert.ok(machine.limits.some((limit) => /not been certified by a human/.test(limit)));

  const unknown = trust.explainConfidence({ kind: "receipt", id: "missing" });
  assert.equal(unknown.score, 0);
  assert.equal(unknown.band, "BLOCKED");

  const issue = trust.reviewCandidates[0];
  const packet = trust.buildCorrectionPacket(issue.id);
  assert.deepEqual(
    plain(packet),
    plain(
      trust.correctionPackets.find(
        (candidate) => candidate.packetId === `correction:${issue.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`
      )
    )
  );
  assert.equal(packet.status, "DRAFT");
  assert.equal(packet.schema, "wwam.correction.v2");
  assert.equal(packet.reviewer.decision, null);
  assert.equal("generatedAt" in packet, false);
  assert.match(packet.canonEffect, /No correction becomes canon/);
  assert.equal(packet.dryRunRipple.mode, "DRY_RUN");
  assert.equal(packet.dryRunRipple.mutationPolicy.canonMutation, "NONE");
  assert.equal(packet.dryRunRipple.mutationPolicy.askEffectClaim, "NONE");
  assert.equal(packet.dryRunRipple.mutationPolicy.clipLabEffectClaim, "NONE");

  assert.equal(trust.uiContract.deskLanes.length, 5);
  assert.match(trust.uiContract.confidenceLookup, /explainConfidence/);
});

test("strict synthetic cases reject ordinary mentions, guessed speakers, and scene-level opinion flips", () => {
  const window = load();
  const source = {
    id: "synthetic-proof",
    type: "commentary",
    lane: "commentary",
    lanes: ["commentary"],
    title: "Synthetic proof",
    date: "2026-01-01",
    duration: 600,
    url: "https://www.youtube.com/watch?v=synthetic-proof",
    captioned: true,
    wordsAudited: 1000
  };
  const ordinary = {
    id: "ordinary-loomis",
    sourceId: source.id,
    sourceType: "commentary",
    sourceLane: "commentary",
    sourceLanes: ["commentary"],
    sourceTitle: source.title,
    date: source.date,
    t: 100,
    url: `${source.url}&t=100s`,
    type: "moment",
    category: "HORROR BRAIN",
    excerpt: "Billy Loomis is the killer.",
    score: 70,
    sentiment: "neutral",
    sentimentConfidence: 0,
    evidenceLevel: "machine",
    entityIds: ["character:loomis", "film:synthetic"],
    wordCount: 5
  };
  const negative = {
    ...ordinary,
    id: "snake-complaint",
    t: 200,
    url: `${source.url}&t=200s`,
    excerpt: "I hate snakes, dude.",
    sentiment: "negative",
    sentimentConfidence: 0.96,
    entityIds: ["film:synthetic"]
  };
  const positive = {
    ...ordinary,
    id: "snake-praise",
    t: 300,
    url: `${source.url}&t=300s`,
    excerpt: "That snake death was amazing.",
    sentiment: "positive",
    sentimentConfidence: 0.96,
    entityIds: ["film:synthetic"]
  };
  const performance = {
    ...ordinary,
    id: "character-receipt:loomis-test",
    t: 400,
    url: `${source.url}&t=400s`,
    type: "character-performance",
    category: "CHARACTER PERFORMANCE",
    excerpt: "Michael has escaped again.",
    sentiment: "neutral",
    sentimentConfidence: 0,
    evidenceLevel: "curated-candidate",
    characterId: "character:loomis",
    bitId: "bit:loomis-alert",
    performer: "J",
    entityIds: ["character:loomis", "bit:loomis-alert"]
  };
  const showcase = {
    snapshotDate: "2026-01-01",
    inputFingerprint: "synthetic01",
    sources: [source],
    receipts: [ordinary, negative, positive, performance],
    memoryGraph: {
      nodes: [
        { id: "film:synthetic", type: "film", label: "Synthetic Movie" },
        { id: "character:loomis", type: "character", label: "Dr. Loomis" }
      ],
      edges: []
    },
    takeTimeMachines: [
      {
        id: "timeline:synthetic",
        subjectId: "film:synthetic",
        subject: "Synthetic Movie",
        subjectType: "film",
        receipts: [negative.id, positive.id],
        movements: [
          {
            from: "negative",
            to: "positive",
            beforeReceiptId: negative.id,
            afterReceiptId: positive.id
          }
        ]
      }
    ],
    courtCandidates: []
  };
  const characters = {
    characters: [
      {
        id: "loomis",
        name: "Dr. Loomis",
        performedBy: "J",
        status: "grounded",
        askEnabled: true,
        confidence: 0.9,
        hostAttribution: {
          status: "user-supplied",
          confidence: 1,
          basis: "Owner supplied."
        },
        soundbytes: [
          {
            id: "loomis-test",
            sourceId: source.id,
            t: 400,
            url: `${source.url}&t=400s`,
            excerpt: performance.excerpt,
            confidence: 0.95,
            provenance: {
              timestampStatus: "exact-caption-event",
              selection: "human-curated seed",
              speakerBasis: "Character addressed in surrounding auto-captions."
            }
          }
        ]
      }
    ],
    lockedCandidates: []
  };
  const dna = {
    characters: [
      {
        id: "character:loomis",
        label: "Dr. Loomis",
        performer: "J",
        minimumCuratedCandidatesForAsk: 1
      }
    ],
    askCharacterPolicy: { evidenceMinimum: 1 },
    qualityGates: { publicExcerptWords: 16 }
  };
  const trust = window.WWAMTrustEngine.create({
    catalog: [source],
    deep: {
      generated: "2026-01-01",
      method: "Synthetic deterministic fixture."
    },
    live: {},
    popular: {},
    characters,
    dna,
    showcase
  });

  const loomis = trust.characterAudits.grounded[0];
  assert.deepEqual(plain(loomis.timestampValidatedPerformanceIds), [
    "character-receipt:loomis-test"
  ]);
  assert.deepEqual(plain(loomis.authenticatedEditorVerifiedPerformanceIds), []);
  assert.deepEqual(plain(loomis.ordinaryMentionReceiptIds), ["ordinary-loomis"]);
  assert.deepEqual(plain(loomis.aliasCollisionReceiptIds), ["ordinary-loomis"]);
  assert.equal(loomis.soundbytes[0].timestampValidatedCuratedCandidate, true);
  assert.equal(loomis.soundbytes[0].authenticatedEditorVerified, false);
  assert.equal(loomis.soundbytes[0].specificSpeakerVerified, false);
  assert.equal(loomis.canClaimSpecificHostSpokeInEachClip, false);

  const timeline = trust.timelineAudits[0];
  assert.equal(timeline.directOpinionReceiptIds.length, 0);
  assert.equal(timeline.movementAudits[0].semanticSupport, false);
  assert.equal(timeline.movementAudits[0].canonEligible, false);
  assert.equal(timeline.canonEligible, false);
});
