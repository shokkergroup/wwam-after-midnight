import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const demoRoot = new URL("../public/demo/", import.meta.url);
const dossierSource = await readFile(
  new URL("source-dossier-engine.js", demoRoot),
  "utf8",
);
const querySource = await readFile(
  new URL("source-query-engine.js", demoRoot),
  "utf8",
);

function load() {
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(dossierSource, sandbox, {
    filename: "source-dossier-engine.js",
  });
  vm.runInContext(querySource, sandbox, {
    filename: "source-query-engine.js",
  });
  return sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function receipt({
  key,
  at,
  end = at + 20,
  kind = "moment",
  label,
  excerpt = "",
  evidenceType = "caption-excerpt",
  entityIds = [],
  publicExcerptAllowed = true,
  promotionAllowed = true,
}) {
  return {
    key,
    at,
    end,
    kind,
    label,
    excerpt,
    evidenceLevel: "timestamped-source-receipt",
    evidenceType,
    evidenceBasis: "exact-caption-coordinate",
    reviewState: "machine-surfaced",
    speaker: null,
    speakerStatus: "not-diarized",
    promotionAllowed,
    publicExcerptAllowed,
    entityIds,
  };
}

function entity({
  id,
  label,
  type,
  receiptKeys = [],
  basis = "timestamped-receipt",
}) {
  return { id, label, type, basis, receiptKeys };
}

function artifact({
  id,
  kind,
  label,
  sourceIds,
  receiptKeys,
  at = null,
  authority = "fan-navigation",
}) {
  return {
    id,
    kind,
    label,
    authority,
    reviewState: "review-required",
    sourceIds,
    receiptKeys,
    at,
    targetSection: "highlights",
    risk: "not-assigned",
  };
}

function episodeGuide() {
  const cuts = [
    {
      id: "guide-cut-overlap",
      at: 1200,
      end: 1236,
      label: "a registered moment that also survives the deep dive",
      category: "LOVE LETTER",
      topic: "Registered overlap",
      excerpt: "The discussion lands its strongest registered beat.",
      score: 100,
    },
    {
      id: "guide-cut-panavision",
      at: 857,
      end: 893,
      label: "a camera-craft breakdown",
      category: "BREAKDOWN",
      topic: "Direction and camera",
      excerpt: "Dude, the Panavision here is amazing and the framing gives the scene room to breathe.",
      score: 99,
    },
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `guide-cut-support-${index + 1}`,
      at: 1500 + index * 300,
      end: 1536 + index * 300,
      label: `supporting exact-show cut ${index + 1}`,
      category: index % 2 === 0 ? "FILM READ" : "BIT ENERGY",
      topic: `Supporting thread ${index + 1}`,
      excerpt: `A bounded supporting deep-dive excerpt number ${index + 1}.`,
      score: 90 - index,
    })),
  ];
  return {
    schema: "wwam-episode-guide/v2",
    basis: "Full-caption local-topic binding; speaker identity and audio origin remain unverified",
    overview: "Eight validated source-local cuts trace this exact archived episode.",
    cuts,
    chapters: cuts.slice(0, 4).map((cut, index) => ({
      id: `act-${index + 1}`,
      act: index + 1,
      label: `Act ${index + 1} // ${cut.topic}`,
      at: cut.at,
      end: cut.end,
      body: `The mapped episode turn is anchored to ${cut.topic}.`,
      excerpt: cut.excerpt,
      category: cut.category,
      topic: cut.topic,
      cutId: cut.id,
    })),
    takeArc: cuts.slice(0, 3).map((cut, index) => ({
      phase: ["OPENING READ", "MIDPOINT TURN", "CLOSING READ"][index],
      label: cut.topic,
      at: cut.at,
      end: cut.end,
      body: `This exact-source take is anchored at ${cut.at}.`,
      excerpt: cut.excerpt,
      category: cut.category,
    })),
    threads: [
      ["Direction and camera", "craft", 7, 4, 857],
      ["Registered overlap", "opinion", 5, 3, 1200],
      ["Supporting thread", "tone", 4, 2, 1500],
    ].map(([name, kind, mentions, cluster, peak]) => ({
      name,
      kind,
      mentions,
      cluster,
      first: peak,
      peak,
      receipt: `A bounded ${name.toLowerCase()} thread receipt.`,
      score: mentions * 10,
    })),
    metrics: {
      chapters: 4,
      threads: 3,
      cuts: 8,
      praise: 1,
      negative: 0,
      comedy: 3,
      substantive: 5,
    },
  };
}

function feldmanEpisodeRecap(sourceId) {
  const allKeys = [
    "episode-opening",
    "episode-topic-batman",
    "episode-topic-masks",
    "episode-funniest",
    "episode-best",
    "episode-up-in-ya",
    "episode-steve",
    "episode-character",
    "episode-decoy",
  ];
  return {
    schema: "wwam-feldman-recap/v1",
    generatorVersion: "1.3.0",
    coreSchema: "shokker-episode-recap/v1",
    sourceId,
    sourceFingerprint: "fnv1a32:11111111",
    semanticFingerprint: "fnv1a32:22222222",
    state: "ready",
    tier: "receipt-recap",
    label: "WWAM FELDMAN APPROVED RECAP",
    badge: "PLAYABLE EPISODE RECAP",
    headline: "HALLOWEEN OPENS THE DOOR. BATMAN ARRIVES AFTER CURFEW.",
    deck: "A one-hour commentary that moves from Halloween to Batman and the night's wildest turns.",
    overview: "Halloween Full Commentary runs 1 hr. The recap opens with the production update, turns toward Batman and masks, then reaches its sharpest replay picks before Captain Void closes the night.",
    topics: ["Halloween", "Batman", "Masks"],
    sections: [
      {
        id: "opening",
        ordinal: 1,
        label: "COLD OPEN // PRODUCTION UPDATE",
        body: "At 1:00, the production update starts the show.",
        at: 60,
        end: 80,
        anchor: "Opening signal",
        category: "moment",
        excerpt: "The archived episode opens with a production update.",
        receiptKeys: ["episode-opening"],
        guideCutId: "",
        evidenceBasis: "exact-caption-coordinate",
      },
      {
        id: "batman",
        ordinal: 2,
        label: "NOW TALKING // BATMAN",
        body: "At 5:00, Batman takes over the conversation.",
        at: 300,
        end: 320,
        anchor: "Batman discussion",
        category: "topic",
        excerpt: "",
        receiptKeys: ["episode-topic-batman"],
        guideCutId: "",
        evidenceBasis: "exact-caption-coordinate",
      },
      {
        id: "best",
        ordinal: 3,
        label: "WORTH A REWIND // BEST BEAT",
        body: "At 20:00, the night's strongest saved turn lands.",
        at: 1200,
        end: 1220,
        anchor: "Best registered beat",
        category: "moment",
        excerpt: "The discussion lands its strongest registered beat.",
        receiptKeys: ["episode-best"],
        guideCutId: "",
        evidenceBasis: "exact-caption-coordinate",
      },
    ],
    story: [
      {
        id: "whole-show",
        ordinal: 1,
        label: "THE FULL NIGHT",
        body: "The episode moves from its opening update through Batman, masks, comedy, criticism, and the closing character turn.",
        at: 60,
        end: 3320,
        anchorReceiptKey: "episode-opening",
        anchorAt: 60,
        anchor: "Opening signal",
        primarySubject: "Halloween",
        excerpt: "The archived episode opens with a production update.",
        topicLabels: ["Halloween", "Batman", "Masks"],
        momentLabels: ["Room breaks", "UP IN YA", "Straight to Steve"],
        characterLabels: ["Captain Void"],
        receiptKeys: allKeys,
        narrative: {
          schema: "shokker-recap-narrative-beat/v1",
          kind: "opening-board",
          primarySubject: "Halloween",
          secondarySubjects: [
            "Batman",
            "Masks",
            "Captain Void",
            "Room breaks",
            "UP IN YA",
          ],
          previousSubject: "",
          nextSubject: "",
          recurringSubjects: [],
          anchorSupportsPrimary: false,
          anchorSubject: "Opening signal",
          anchorRelation: "separate-saved-spike",
          primaryEvidence: {
            kind: "receipt",
            key: "episode-opening",
            at: 60,
            end: 80,
            label: "Opening signal",
          },
          evidenceShape: {
            receipts: 9,
            guideCuts: 0,
            guideChapters: 0,
            topics: 3,
            moments: 3,
            characters: 1,
            namedSubjects: 7,
          },
        },
        evidenceBasis: "exact-show-chronology",
      },
    ],
    highlightRunway: [
      {
        receiptKey: "episode-opening",
        guideCutId: "",
        ordinal: 1,
        kind: "moment",
        category: "SOUNDBYTE / REPLAY",
        at: 60,
        end: 80,
        label: "Opening signal",
        excerpt: "The archived episode opens with a production update.",
        signalScore: 0,
        evidenceBasis: "exact-caption-coordinate",
      },
      {
        receiptKey: "episode-funniest",
        guideCutId: "",
        ordinal: 2,
        kind: "moment",
        category: "SOUNDBYTE / REPLAY",
        at: 720,
        end: 740,
        label: "Room breaks",
        excerpt: "The room breaks into sustained laughter.",
        signalScore: 0,
        evidenceBasis: "exact-caption-coordinate",
      },
      {
        receiptKey: "episode-best",
        guideCutId: "",
        ordinal: 3,
        kind: "moment",
        category: "SOUNDBYTE / REPLAY",
        at: 1200,
        end: 1220,
        label: "Best registered beat",
        excerpt: "The discussion lands its strongest registered beat.",
        signalScore: 0,
        evidenceBasis: "exact-caption-coordinate",
      },
      {
        receiptKey: "episode-up-in-ya",
        guideCutId: "",
        ordinal: 4,
        kind: "moment",
        category: "UP IN YA / STINGER",
        at: 1800,
        end: 1820,
        label: "Up In Ya",
        excerpt: "A registered outrageous soundbyte lands here.",
        signalScore: 0,
        evidenceBasis: "exact-caption-coordinate",
      },
      {
        receiptKey: "episode-steve",
        guideCutId: "",
        ordinal: 5,
        kind: "moment",
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        at: 2400,
        end: 2420,
        label: "Straight to Steve",
        excerpt: "The hosts deliver their strongest negative verdict.",
        signalScore: 0,
        evidenceBasis: "exact-caption-coordinate",
      },
      {
        receiptKey: "episode-character",
        guideCutId: "",
        ordinal: 6,
        kind: "character",
        category: "CHARACTER APPEARANCE",
        at: 3000,
        end: 3020,
        label: "Captain Void",
        excerpt: "Captain Void takes over the conversation.",
        signalScore: 0,
        evidenceBasis: "exact-caption-coordinate",
      },
      {
        receiptKey: "episode-decoy",
        guideCutId: "",
        ordinal: 7,
        kind: "moment",
        category: "SOUNDBYTE / REPLAY",
        at: 3300,
        end: 3320,
        label: "Unregistered keyword decoy",
        excerpt: "Funniest best Batman UP IN YA Steve character moment.",
        signalScore: 0,
        evidenceBasis: "exact-caption-coordinate",
      },
    ],
    bestMoments: [],
    fanRead: {},
    caseFile: null,
    coverage: {},
    format: { id: "movie-commentary" },
    limitations: ["Automatic captions do not establish the speaker."],
    approval: {
      meaning: "wwam-editorial-parody-label",
      actualApproval: false,
      disclosure: "A recurring-bit-inspired archive label, not an endorsement.",
    },
  };
}

function source(overrides) {
  const id = overrides.id;
  return {
    id,
    title: overrides.title,
    displayTitle: overrides.displayTitle || overrides.title,
    date: overrides.date,
    duration: overrides.duration,
    views: overrides.views ?? 100,
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`,
    availability: overrides.availability || "not-captured",
    liveStatus: overrides.liveStatus || "not-captured",
    coverage: overrides.coverage || "caption-backed",
    authority: overrides.authority || "promoted-lane",
    lanes: overrides.lanes || ["primary"],
    sourceType: overrides.sourceType || "broadcast",
    wordsAudited: overrides.wordsAudited || 0,
    exactSourceHold: overrides.exactSourceHold ?? null,
    officialAlternate: overrides.officialAlternate ?? null,
    summary: overrides.summary ?? null,
    showWiki: overrides.showWiki ?? null,
    rightsPolicy: {},
    warnings: overrides.warnings || [
      "Automatic captions do not identify a speaker.",
    ],
    metrics: {},
    receipts: overrides.receipts || [],
    entities: overrides.entities || [],
    artifacts: overrides.artifacts || [],
  };
}

function fixtureInput() {
  const raceOne = "RACE00001A1";
  const raceTwo = "RACE00002B2";
  const showWikiSource = "EPISODE01X1";
  const latest = "LV2rmwEA0w4";
  const duplicateTitle = "ag3axSC9BpU";
  const metadataOnly = "FVuwRHM0kcc";
  const limited = "x6tvsGRHgU0";
  const unavailable = "GONE00001Z9";

  return {
    schema: "shokker-source-dossier-input/v1",
    snapshotDate: "2026-07-24",
    channel: {
      id: "neutral-memory",
      label: "Neutral Memory",
      packFingerprint: "cp1-0000000000000001",
    },
    sources: [
      source({
        id: raceOne,
        title: "Round One Broadcast",
        date: "2026-07-01",
        duration: 4200,
        wordsAudited: 52000,
        summary: {
          text: "A registered whole-source summary of the opening round.",
          basis: "caption-audited-source-summary",
        },
        receipts: [
          receipt({
            key: "race-start",
            at: 118,
            label: "Green flag scramble",
            excerpt: "The leaders run side by side into turn one.",
            entityIds: ["driver:car-33", "event:opening-lap"],
          }),
          receipt({
            key: "race-pit-route",
            at: 900,
            label: "Pit strategy route",
            excerpt: "",
            evidenceType: "caption-topic-navigation",
            kind: "topic-navigation",
            entityIds: ["topic:pit-strategy"],
            publicExcerptAllowed: false,
            promotionAllowed: false,
          }),
          receipt({
            key: "race-photo-finish",
            at: 3598,
            label: "Photo finish",
            excerpt: "They are door to door at the stripe.",
            entityIds: ["driver:car-33", "event:photo-finish"],
          }),
        ],
        entities: [
          entity({
            id: "driver:car-33",
            label: "Car 33",
            type: "driver",
            receiptKeys: ["race-start", "race-photo-finish"],
          }),
          entity({
            id: "event:opening-lap",
            label: "Opening lap",
            type: "event",
            receiptKeys: ["race-start"],
          }),
          entity({
            id: "event:photo-finish",
            label: "Photo finish",
            type: "event",
            receiptKeys: ["race-photo-finish"],
          }),
          entity({
            id: "topic:pit-strategy",
            label: "Pit strategy",
            type: "topic",
            receiptKeys: ["race-pit-route"],
          }),
        ],
        artifacts: [
          artifact({
            id: "race-feature-package",
            kind: "highlight-reel",
            label: "Round One Highlight Reel",
            sourceIds: [raceOne, raceTwo],
            receiptKeys: ["race-photo-finish"],
            at: 3598,
          }),
        ],
      }),
      source({
        id: raceTwo,
        title: "Round Two Broadcast",
        date: "2026-07-08",
        duration: 4600,
        receipts: [
          receipt({
            key: "race-restart",
            at: 3900,
            label: "Late restart",
            excerpt: "Car 33 leads the field back to the restart.",
            entityIds: ["driver:car-33", "event:late-restart"],
          }),
        ],
        entities: [
          entity({
            id: "driver:car-33",
            label: "Car 33",
            type: "driver",
            receiptKeys: ["race-restart"],
          }),
          entity({
            id: "event:late-restart",
            label: "Late restart",
            type: "event",
            receiptKeys: ["race-restart"],
          }),
        ],
        artifacts: [
          artifact({
            id: "race-feature-package",
            kind: "highlight-reel",
            label: "Round One Highlight Reel",
            sourceIds: [raceOne, raceTwo],
            receiptKeys: ["race-restart"],
            at: 3900,
          }),
        ],
      }),
      source({
        id: showWikiSource,
        title: "Halloween Full Commentary",
        date: "2026-07-15",
        duration: 3600,
        sourceType: "livestream",
        wordsAudited: 28000,
        summary: {
          text: "A registered neutral recap of one exact archived episode.",
          basis: "source-local-format-aware-recap/v1",
        },
        receipts: [
          receipt({
            key: "episode-opening",
            at: 60,
            label: "Opening signal",
            excerpt: "The archived episode opens with a production update.",
          }),
          receipt({
            key: "episode-topic-batman",
            at: 300,
            label: "Batman discussion",
            excerpt: "",
            evidenceType: "caption-topic-navigation",
            kind: "topic-navigation",
            entityIds: ["topic:batman"],
            publicExcerptAllowed: false,
            promotionAllowed: false,
          }),
          receipt({
            key: "episode-topic-masks",
            at: 480,
            label: "Masks discussion",
            excerpt: "",
            evidenceType: "caption-topic-navigation",
            kind: "topic-navigation",
            entityIds: ["topic:masks"],
            publicExcerptAllowed: false,
            promotionAllowed: false,
          }),
          receipt({
            key: "episode-funniest",
            at: 720,
            label: "Room breaks",
            excerpt: "The room breaks into sustained laughter.",
          }),
          receipt({
            key: "episode-best",
            at: 1200,
            label: "Best registered beat",
            excerpt: "The discussion lands its strongest registered beat.",
          }),
          receipt({
            key: "episode-up-in-ya",
            at: 1800,
            label: "UP IN YA",
            excerpt: "A registered outrageous soundbyte lands here.",
          }),
          receipt({
            key: "episode-steve",
            at: 2400,
            label: "Straight to Steve",
            excerpt: "The hosts deliver their strongest negative verdict.",
          }),
          receipt({
            key: "episode-character",
            at: 3000,
            label: "Captain Void performance",
            excerpt: "Captain Void takes over the conversation.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:captain-void"],
          }),
          receipt({
            key: "episode-decoy",
            at: 3300,
            label: "Unregistered keyword decoy",
            excerpt: "Funniest best Batman UP IN YA Steve character moment.",
          }),
        ],
        entities: [
          entity({
            id: "topic:batman",
            label: "Batman",
            type: "topic",
            receiptKeys: ["episode-topic-batman"],
          }),
          entity({
            id: "topic:masks",
            label: "Masks",
            type: "topic",
            receiptKeys: ["episode-topic-masks"],
          }),
          entity({
            id: "character:captain-void",
            label: "Captain Void",
            type: "character",
            receiptKeys: ["episode-character"],
          }),
        ],
        showWiki: {
          label: "SHOW WIKI",
          status: "distilled",
          description: "Source-local evidence organized for one neutral show.",
          experience: {
            id: "five-stop-watch-path",
            label: "FIVE-STOP WATCH PATH",
            title: "THE FIVE-STOP WATCH PATH",
            description: "Five exact source-local stops through the episode.",
            selectionBasis: "registered-source-local-route",
            emptyState: "No source-local watch path is registered yet.",
            queryAliases: [
              "five stop watch path",
              "watch path",
              "show in five",
            ],
            routeReceiptKeys: [
              "episode-opening",
              "episode-topic-batman",
              "episode-funniest",
              "episode-steve",
              "episode-character",
            ],
            pulseReceiptKeys: [
              "episode-funniest",
              "episode-best",
              "episode-up-in-ya",
            ],
          },
          episodeGuide: episodeGuide(),
          episodeRecap: feldmanEpisodeRecap(showWikiSource),
          recap: {
            format: "neutral-episode-recap",
            formatBasis: "registered-source-type",
            overview: "A neutral, receipt-backed recap of this exact episode.",
            queryAliases: ["episode recap", "show recap"],
            blocks: [
              {
                id: "what-happened",
                label: "WHAT HAPPENED",
                body: "The episode opens, discusses Batman, and lands a registered best beat.",
                basis: "source-local-receipts",
                receiptKeys: [
                  "episode-opening",
                  "episode-topic-batman",
                  "episode-best",
                ],
              },
            ],
          },
          lanes: [
            {
              id: "topics",
              label: "TOPICS",
              description: "Registered topic receipts for this exact show.",
              emptyState: "No topic receipt is registered yet.",
              queryAliases: ["topics", "where do they talk about"],
              receiptKeys: [
                "episode-topic-batman",
                "episode-topic-masks",
              ],
            },
            {
              id: "best-moments",
              label: "BEST MOMENTS",
              description: "Registered strongest moments for this exact show.",
              emptyState: "No best-moment receipt is registered yet.",
              queryAliases: ["best moments", "best moment", "top moments"],
              receiptKeys: ["episode-best", "episode-funniest"],
            },
            {
              id: "funny-moments",
              label: "FUNNIEST MOMENTS",
              description: "Registered funniest moments for this exact show.",
              emptyState: "No funny-moment receipt is registered yet.",
              queryAliases: ["funniest", "funniest moments", "funny moments"],
              receiptKeys: ["episode-funniest"],
            },
            {
              id: "up-in-ya",
              label: "UP IN YA",
              description: "Registered outrageous soundbytes for this show.",
              emptyState: "No UP IN YA receipt is registered yet.",
              queryAliases: ["up in ya", "up in ya moments"],
              receiptKeys: ["episode-up-in-ya"],
            },
            {
              id: "straight-to-steve",
              label: "STRAIGHT TO STEVE",
              description: "Registered strongest negative verdicts.",
              emptyState: "No Straight to Steve receipt is registered yet.",
              queryAliases: [
                "straight to steves asshole",
                "steves asshole",
                "steve moments",
              ],
              receiptKeys: ["episode-steve"],
            },
            {
              id: "character-bits",
              label: "CHARACTER BITS",
              description: "Registered character performances for this show.",
              emptyState: "No character performance is registered yet.",
              queryAliases: ["character bits", "character moments"],
              receiptKeys: ["episode-character"],
            },
            {
              id: "hidden-gems",
              label: "HIDDEN GEMS",
              description: "A registered lane awaiting source-local evidence.",
              emptyState: "No hidden-gem receipt is registered yet.",
              queryAliases: ["hidden gems"],
              receiptKeys: [],
            },
          ],
        },
      }),
      source({
        id: latest,
        title: "We Watched A Movie Live! Movie News and More",
        date: "2026-07-23",
        duration: 12785,
        views: 5067,
        sourceType: "livestream",
        wordsAudited: 43645,
        summary: {
          text: "A registered source summary covering movie news and recurring bits.",
          basis: "caption-audited-source-summary",
        },
        receipts: [
          receipt({
            key: "loomis-funding",
            at: 9042.64,
            end: 9056.64,
            label: "Bureaucratic combat",
            excerpt: "Vote in politicians that will give me funding.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-loomis"],
          }),
          receipt({
            key: "loomis-pepto",
            at: 10734.88,
            end: 10748.88,
            label: "Medical authority",
            excerpt: "Three Pepto to stop that chocolate spray.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-loomis"],
          }),
          receipt({
            key: "challis-birthday",
            at: 8309.12,
            end: 8323.12,
            label: "Birthday advice",
            excerpt: "This is the doctor if you could not tell.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-challis"],
          }),
        ],
        entities: [
          entity({
            id: "character:dr-loomis",
            label: "Dr. Loomis",
            type: "character",
            receiptKeys: ["loomis-funding", "loomis-pepto"],
          }),
          entity({
            id: "character:dr-challis",
            label: "Dr. Challis",
            type: "character",
            receiptKeys: ["challis-birthday"],
          }),
        ],
        artifacts: [
          artifact({
            id: "loomis-emergency-cut",
            kind: "character-supercut",
            label: "The Emergency Broadcast",
            sourceIds: [latest],
            receiptKeys: ["loomis-funding", "loomis-pepto"],
            authority: "creator-draft",
          }),
        ],
      }),
      source({
        id: duplicateTitle,
        title: "We Watched A Movie LIVE! Movie News and More",
        date: "2026-07-09",
        duration: 12360,
        views: 7567,
        sourceType: "livestream",
        receipts: [
          receipt({
            key: "challis-miguel",
            at: 3860.72,
            end: 3874.72,
            label: "Flirtation",
            excerpt: "My name is the doctor.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-challis"],
          }),
          receipt({
            key: "challis-doctor",
            at: 9851.76,
            end: 9865.76,
            label: "Questionable medicine",
            excerpt: "I am a real doctor.",
            evidenceType: "curated-character-performance",
            kind: "character-performance",
            entityIds: ["character:dr-challis"],
          }),
        ],
        entities: [
          entity({
            id: "character:dr-challis",
            label: "Dr. Challis",
            type: "character",
            receiptKeys: ["challis-miguel", "challis-doctor"],
          }),
        ],
      }),
      source({
        id: metadataOnly,
        title: "Marvel VS DC Movies Bracket Tournament",
        date: "2026-05-26",
        duration: 11427,
        coverage: "metadata-only",
        authority: "source-only",
        lanes: ["archive-metadata"],
        availability: "age-restricted",
        exactSourceHold: {
          state: "held-age-gated",
          reason: "The exact YouTube edit requires age-authenticated access.",
        },
        officialAlternate: {
          kind: "official-podcast-edition",
          title: "Official alternate commentary",
          episodeUrl: "https://podcasters.spotify.com/pod/show/example/episodes/tape",
          enclosureUrl: "https://traffic.megaphone.fm/EXAMPLE.mp3",
          duration: 11532.61,
          canonicalDuration: 11427,
          durationDelta: 105.61,
          timestampIsomorphic: false,
          publicPlaybackAllowed: true,
          evidenceBoundary: "Official alternate edit; not a canonical timestamp source.",
        },
        showWiki: {
          label: "SHOW WIKI",
          status: "source-brief",
          description: "Canonical source metadata only.",
          brief: {
            kind: "source-metadata-brief",
            scope: "canonical-source-metadata-only",
            format: "BRACKET SHOW",
            formatBasis: "source-title-metadata",
            queryAliases: [
              "source brief",
              "what can you prove about this show",
              "what do you know for sure",
            ],
          },
          recap: null,
          experience: {
            id: "source-brief",
            label: "CONTENT ROUTE",
            title: "CONTENT ROUTE NOT DISTILLED",
            description: "No semantic route is inferred from metadata.",
            selectionBasis: "canonical-source-metadata-only",
            emptyState: "Content remains sealed.",
            queryAliases: ["watch path", "show route"],
            routeReceiptKeys: [],
            pulseReceiptKeys: [],
          },
          lanes: [
            {
              id: "topics",
              label: "TOPICS",
              description: "Registered topic receipts.",
              emptyState: "No topic receipt is registered.",
              queryAliases: ["topics", "what did they discuss"],
              receiptKeys: [],
            },
          ],
        },
        entities: [
          entity({
            id: "topic:marvel-vs-dc",
            label: "Marvel vs DC",
            type: "topic",
            basis: "cached-title-alias",
            receiptKeys: [],
          }),
        ],
      }),
      source({
        id: limited,
        title: "Box Office Tier List",
        date: "2026-06-30",
        duration: 11484,
        coverage: "caption-limited",
        authority: "source-only",
        lanes: ["limited"],
        entities: [
          entity({
            id: "topic:box-office",
            label: "Box office",
            type: "topic",
            basis: "cached-title-alias",
            receiptKeys: [],
          }),
        ],
      }),
      source({
        id: unavailable,
        title: "Unavailable Broadcast",
        date: "2025-01-01",
        duration: 3600,
        coverage: "unavailable",
        authority: "source-only",
        availability: "unavailable",
        lanes: ["archive-metadata"],
      }),
    ],
  };
}

function runtime(options = {}) {
  const window = load();
  const dossierEngine = window.ShokkerSourceDossier.create(fixtureInput());
  const queryEngine = window.ShokkerSourceQuery.create({
    dossierEngine,
    vocabulary: options.vocabulary,
  });
  return { window, dossierEngine, queryEngine };
}

function request(sourceId, query, extra = {}) {
  return {
    schema: "shokker-source-query/v1",
    sourceId,
    query,
    ...extra,
  };
}

function errorCode(code) {
  return (error) => {
    assert.equal(error?.name, "SourceQueryError");
    assert.equal(error?.code, code);
    return true;
  };
}

test("publishes one frozen channel-neutral API and closed vocabularies", () => {
  const { window } = runtime();
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "ShokkerSourceQuery",
  );

  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.configurable, false);
  assert.ok(Object.isFrozen(window.ShokkerSourceQuery));
  assert.match(window.ShokkerSourceQuery.VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(
    window.ShokkerSourceQuery.REQUEST_SCHEMA,
    "shokker-source-query/v1",
  );
  assert.equal(
    window.ShokkerSourceQuery.RESULT_SCHEMA,
    "shokker-source-query-result/v1",
  );
  assert.deepEqual(plain(window.ShokkerSourceQuery.RESULT_TYPES), [
    "receipt",
    "guide-cut",
    "entity",
    "artifact",
    "connection",
    "metadata",
  ]);
  assert.deepEqual(plain(window.ShokkerSourceQuery.STATUSES), [
    "supported",
    "inventory",
    "proof",
    "metadata-only",
    "caption-limited",
    "unavailable",
    "insufficient-evidence",
    "speaker-refused",
    "ranking-refused",
    "stale-source",
  ]);
  assert.doesNotMatch(
    querySource,
    /WWAM|Halloween|Loomis|Challis|Ghostface|Scream|Nightmare on Elm Street/i,
  );
});

test("builds the exact source before parsing and returns deterministic inventory proof", () => {
  const { dossierEngine, window } = runtime();
  const calls = [];
  const wrapped = {
    build(sourceId) {
      calls.push(sourceId);
      return dossierEngine.build(sourceId);
    },
  };
  const engine = window.ShokkerSourceQuery.create({
    dossierEngine: wrapped,
  });
  const input = request("RACE00001A1", "What is indexed here?");
  const first = engine.answer(input);
  const second = engine.answer(input);

  assert.deepEqual(calls, ["RACE00001A1", "RACE00001A1"]);
  assert.deepEqual(plain(first), plain(second));
  assert.equal(first.schema, "shokker-source-query-result/v1");
  assert.equal(first.status, "inventory");
  assert.equal(first.intent, "inventory");
  assert.equal(first.scope.sourceId, "RACE00001A1");
  assert.equal(first.sourceProof.sourceId, "RACE00001A1");
  assert.equal(first.sourceProof.receiptCount, 3);
  assert.equal(first.sourceProof.entityCount, 4);
  assert.equal(first.sourceProof.artifactCount, 1);
  assert.equal(first.results.length, 1);
  assert.equal(first.results[0].type, "metadata");
  assert.equal(first.results[0].field, "source-inventory");
  assert.equal(first.results[0].value.receipts.total, 3);
  assert.equal(first.boundary.exactSourceOnly, true);
  assert.equal(first.boundary.crossSourceSubstitution, false);
  assert.match(first.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.results));
  assert.ok(Object.isFrozen(first.results[0]));
});

test("neutral racing search returns only exact-source evidence and honors the anchor", () => {
  const { queryEngine } = runtime();
  const finish = queryEngine.answer(
    request(
      "RACE00001A1",
      "Show the photo finish for car 33",
      { limit: 4 },
    ),
  );

  assert.equal(finish.status, "supported");
  assert.equal(finish.scope.sourceId, "RACE00001A1");
  assert.equal(finish.results[0].type, "receipt");
  assert.equal(finish.results[0].key, "race-photo-finish");
  assert.ok(finish.results.every((result) =>
    result.sourceId === "RACE00001A1"));
  assert.ok(finish.results
    .filter((result) => result.type === "receipt")
    .every((result) => result.speaker === null));

  const nearFinish = queryEngine.answer(
    request("RACE00001A1", "Show receipts", {
      at: 3580,
      limit: 2,
    }),
  );
  assert.equal(nearFinish.results[0].key, "race-photo-finish");
  assert.equal(nearFinish.results[0].matchedBy, "anchor-proximity");

  const withheld = queryEngine.answer(
    request("RACE00001A1", "Show the pit strategy moment"),
  );
  assert.equal(withheld.status, "supported");
  assert.equal(withheld.results[0].key, "race-pit-route");
  assert.equal(withheld.results[0].excerpt, "");
  assert.equal(withheld.results[0].publicExcerptAllowed, false);
});

test("duplicate upload titles cannot redirect a source-bound character query", () => {
  const { queryEngine } = runtime();
  const latest = queryEngine.answer(
    request("LV2rmwEA0w4", "Show me Dr. Loomis moments"),
  );
  assert.equal(latest.status, "supported");
  assert.deepEqual(
    plain(latest.results
      .filter((result) => result.type === "receipt")
      .map((result) => [result.sourceId, result.key, result.at])),
    [
      ["LV2rmwEA0w4", "loomis-funding", 9042.64],
      ["LV2rmwEA0w4", "loomis-pepto", 10734.88],
    ],
  );

  const duplicate = queryEngine.answer(
    request("ag3axSC9BpU", "Show me Dr. Challis moments"),
  );
  assert.equal(duplicate.status, "supported");
  assert.deepEqual(
    plain(duplicate.results
      .filter((result) => result.type === "receipt")
      .map((result) => [result.sourceId, result.key, result.at])),
    [
      ["ag3axSC9BpU", "challis-miguel", 3860.72],
      ["ag3axSC9BpU", "challis-doctor", 9851.76],
    ],
  );
  assert.ok(duplicate.results.every((result) =>
    result.sourceId === "ag3axSC9BpU"));
  assert.ok(!JSON.stringify(duplicate).includes("challis-birthday"));
  assert.equal(duplicate.boundary.titleInferenceUsed, false);
});

test("wrong subjects refuse instead of borrowing evidence from another source", () => {
  const { queryEngine } = runtime();
  const result = queryEngine.answer(
    request("LV2rmwEA0w4", "Show me Ghostface moments"),
  );

  assert.equal(result.status, "insufficient-evidence");
  assert.equal(result.resultCount, 0);
  assert.deepEqual(plain(result.results), []);
  assert.equal(result.scope.sourceId, "LV2rmwEA0w4");
  assert.equal(result.boundary.returnedSourceId, "LV2rmwEA0w4");
  assert.equal(result.boundary.crossSourceSubstitution, false);
});

test("metadata-only, caption-limited, and unavailable sources fail closed", () => {
  const { queryEngine } = runtime();
  const metadata = queryEngine.answer(
    request("FVuwRHM0kcc", "Who won the Marvel vs DC bracket?"),
  );
  assert.equal(metadata.status, "metadata-only");
  assert.equal(metadata.resultCount, 0);
  assert.match(metadata.message, /contents are not indexed/i);
  assert.ok(metadata.limitations.some((item) =>
    /title cannot be used to infer/i.test(item)));
  assert.doesNotMatch(JSON.stringify(metadata), /\bwinner\b/i);

  const metadataProof = queryEngine.answer(
    request("FVuwRHM0kcc", "Show source proof"),
  );
  assert.equal(metadataProof.status, "proof");
  assert.equal(metadataProof.results[0].type, "metadata");
  assert.equal(metadataProof.results[0].field, "source-proof");
  assert.equal(metadataProof.results[0].value.coverage, "metadata-only");

  const limited = queryEngine.answer(
    request("x6tvsGRHgU0", "What topics are in this source?"),
  );
  assert.equal(limited.status, "caption-limited");
  assert.equal(limited.resultCount, 0);
  assert.doesNotMatch(JSON.stringify(limited.results), /box office/i);

  const unavailable = queryEngine.answer(
    request("GONE00001Z9", "What happened in this source?"),
  );
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.resultCount, 0);
});

test("Source Brief and inventory questions cross the coverage gate without becoming content summaries", () => {
  const { queryEngine } = runtime();
  const sourceId = "FVuwRHM0kcc";

  for (const query of ["source brief", "What can you prove about this show?"]) {
    const result = queryEngine.answer(request(sourceId, query));
    assert.equal(result.status, "supported");
    assert.equal(result.intent, "episode-brief");
    assert.deepEqual(plain(result.episode), {
      kind: "brief",
      id: "source-brief",
      label: "SOURCE BRIEF",
      matchedAlias: query === "source brief"
        ? "source brief"
        : "what can you prove about this show",
      totalReceipts: 0,
      matchedReceipts: 0,
      shownReceipts: 0,
    });
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].field, "registered-source-brief");
    assert.equal(result.results[0].contentClaim, false);
    assert.equal(result.results[0].value.title, "Marvel VS DC Movies Bracket Tournament");
    assert.equal(result.results[0].value.format, "BRACKET SHOW");
    assert.equal(result.results[0].value.scope, "canonical-source-metadata-only");
    assert.match(result.message, /not a transcript-derived episode summary/i);
  }

  const inventory = queryEngine.answer(request(sourceId, "What is indexed here?"));
  assert.equal(inventory.status, "inventory");
  assert.equal(inventory.results[0].field, "source-inventory");
  assert.equal(inventory.results[0].value.sourceBriefAvailable, true);
  assert.equal(inventory.sourceProof.sourceBriefAvailable, true);
  assert.match(inventory.message, /canonical Source Brief is registered/i);

  const summary = queryEngine.answer(request(sourceId, "Summarize this show."));
  assert.equal(summary.status, "metadata-only");
  assert.equal(summary.resultCount, 0);
  assert.equal(summary.episode, null);

  const speaker = queryEngine.answer(request(sourceId, "Who said the source brief?"));
  assert.equal(speaker.status, "metadata-only");
  assert.equal(speaker.resultCount, 0);
});

test("conversational source-fact questions return exact proof before the coverage gate", () => {
  const { queryEngine } = runtime();
  const sourceId = "FVuwRHM0kcc";
  const questions = [
    "When was this uploaded?",
    "When did this go up?",
    "How long is this tape?",
    "How long is this show?",
    "How long is this upload?",
    "How many views?",
    "Where is the official upload?",
  ];

  for (const query of questions) {
    const result = queryEngine.answer(request(sourceId, query));
    assert.equal(result.status, "proof", query);
    assert.equal(result.intent, "metadata", query);
    assert.equal(result.episode, null, query);
    assert.equal(result.resultCount, 1, query);
    assert.equal(result.results[0].type, "metadata", query);
    assert.equal(result.results[0].field, "source-proof", query);
    assert.equal(result.results[0].contentClaim, false, query);
    assert.equal(result.results[0].sourceId, sourceId, query);
    assert.equal(result.results[0].value.title, "Marvel VS DC Movies Bracket Tournament", query);
    assert.equal(result.results[0].value.date, "2026-05-26", query);
    assert.equal(result.results[0].value.duration, 11427, query);
    assert.equal(result.results[0].value.views, 100, query);
    assert.equal(result.results[0].value.coverage, "metadata-only", query);
    assert.equal(
      result.results[0].value.officialUrl,
      "https://www.youtube.com/watch?v=FVuwRHM0kcc",
      query,
    );
    assert.equal(result.boundary.exactSourceOnly, true, query);
    assert.equal(result.boundary.titleInferenceUsed, false, query);
    assert.equal(result.boundary.crossSourceSubstitution, false, query);
    assert.match(result.message, /canonical source proof/i, query);
  }

  const summary = queryEngine.answer(request(sourceId, "Summarize this show."));
  assert.equal(summary.status, "metadata-only");
  assert.equal(summary.intent, "summary");
  assert.equal(summary.resultCount, 0);
  assert.equal(summary.episode, null);
  assert.doesNotMatch(JSON.stringify(summary), /registered-summary/);

  const content = queryEngine.answer(
    request(sourceId, "What did they say about how long the killer survived?"),
  );
  assert.equal(content.status, "metadata-only");
  assert.equal(content.intent, "receipt");
  assert.equal(content.resultCount, 0);

  const richInventory = queryEngine.answer(
    request("RACE00001A1", "What is indexed here?"),
  );
  assert.equal(richInventory.status, "inventory");
  assert.equal(richInventory.results[0].value.sourceBriefAvailable, false);
  assert.doesNotMatch(richInventory.message, /Source Brief is registered/i);
});

test("official alternate questions expose one playable route without transferring timestamps", () => {
  const { queryEngine } = runtime();
  const sourceId = "FVuwRHM0kcc";

  for (const query of [
    "Can I play this here?",
    "Is there another official edition?",
  ]) {
    const answer = queryEngine.answer(request(sourceId, query));
    assert.equal(answer.status, "proof", query);
    assert.equal(answer.intent, "alternate", query);
    assert.equal(answer.resultCount, 1, query);
    assert.equal(answer.results[0].type, "metadata", query);
    assert.equal(answer.results[0].field, "official-alternate", query);
    assert.equal(answer.results[0].value.available, true, query);
    assert.equal(
      answer.results[0].value.officialAlternate.episodeUrl,
      "https://podcasters.spotify.com/pod/show/example/episodes/tape",
      query,
    );
    assert.equal(
      answer.results[0].value.officialAlternate.enclosureUrl,
      "https://traffic.megaphone.fm/EXAMPLE.mp3",
      query,
    );
    assert.equal(
      answer.results[0].value.officialAlternate.timestampIsomorphic,
      false,
      query,
    );
    assert.equal(
      answer.results[0].value.officialAlternate.publicPlaybackAllowed,
      true,
      query,
    );
    assert.equal(
      answer.results[0].value.exactSourceHold.state,
      "held-age-gated",
      query,
    );
    assert.equal(answer.sourceProof.officialAlternate.timestampIsomorphic, false, query);
    assert.equal(answer.sourceProof.exactSourceHold.state, "held-age-gated", query);
    assert.match(answer.message, /can play here/i, query);
    assert.match(answer.message, /does not match the canonical YouTube timeline/i, query);
    assert.ok(answer.limitations.some((item) => (
      /never supplies canonical YouTube timestamps/i.test(item)
    )), query);
  }

  const proof = queryEngine.answer(request(sourceId, "Show source proof"));
  assert.equal(proof.results[0].value.officialAlternate.timestampIsomorphic, false);
  assert.equal(proof.results[0].value.exactSourceHold.state, "held-age-gated");

  const inventory = queryEngine.answer(request(sourceId, "What is indexed here?"));
  assert.equal(inventory.results[0].value.officialAlternate.publicPlaybackAllowed, true);
  assert.equal(inventory.results[0].value.exactSourceHold.state, "held-age-gated");

  const brief = queryEngine.answer(request(sourceId, "source brief"));
  assert.equal(brief.results[0].value.officialAlternate.timestampIsomorphic, false);
  assert.equal(brief.results[0].value.exactSourceHold.state, "held-age-gated");

  const absent = queryEngine.answer(
    request("RACE00001A1", "Is there another official edition?"),
  );
  assert.equal(absent.status, "proof");
  assert.equal(absent.intent, "alternate");
  assert.equal(absent.results[0].value.available, false);
  assert.equal(absent.results[0].value.officialAlternate, null);
  assert.match(absent.message, /No separate official alternate edition is registered/i);
});

test("speaker and ranking requests refuse without inflating authority", () => {
  const { queryEngine } = runtime();
  const speaker = queryEngine.answer(
    request("RACE00001A1", "Who said the photo finish line?"),
  );

  assert.equal(speaker.status, "speaker-refused");
  assert.ok(speaker.results.length >= 1);
  assert.ok(speaker.results.every((result) =>
    result.type === "receipt" &&
    result.sourceId === "RACE00001A1" &&
    result.speaker === null &&
    result.speakerStatus === "not-diarized"));
  assert.equal(speaker.boundary.speaker, null);
  assert.equal(speaker.boundary.speakerDiarized, false);
  assert.equal(speaker.boundary.originEstablished, false);
  assert.equal(speaker.boundary.causalityEstablished, false);
  assert.equal(speaker.boundary.rightsCleared, false);
  assert.equal(speaker.boundary.creatorApproved, false);

  const ranking = queryEngine.answer(
    request("RACE00001A1", "What is the most unhinged moment?"),
  );
  assert.equal(ranking.status, "ranking-refused");
  assert.equal(ranking.resultCount, 0);
  assert.ok(ranking.limitations.some((item) =>
    /not a ranking/i.test(item)));
});

test("registered Show Wiki aliases stay inside exact source-local lanes", () => {
  const { queryEngine } = runtime();
  const sourceId = "EPISODE01X1";
  const receiptKeys = (answer) => answer.results
    .filter((result) => result.type === "receipt")
    .map((result) => result.key);
  const assertExactReceipts = (answer, expectedKeys) => {
    assert.deepEqual(plain(receiptKeys(answer)), expectedKeys);
    assert.ok(answer.results.every((result) => result.sourceId === sourceId));
    assert.ok(!receiptKeys(answer).includes("episode-decoy"));
    assert.equal(answer.boundary.exactSourceOnly, true);
    assert.equal(answer.boundary.crossSourceSubstitution, false);
    assert.equal(answer.boundary.speaker, null);
    assert.equal(answer.boundary.speakerDiarized, false);
  };

  const recap = queryEngine.answer(request(sourceId, "episode recap"));
  assert.equal(recap.status, "supported");
  assert.equal(recap.intent, "episode-recap");
  assert.equal(recap.episode.kind, "recap");
  assert.equal(recap.episode.matchedAlias, "episode recap");
  assert.equal(recap.results[0].type, "metadata");
  assert.equal(recap.results[0].field, "registered-summary");
  assert.equal(
    recap.results[0].value.text,
    "Halloween Full Commentary runs 1 hr. The recap opens with the production update, turns toward Batman and masks, then reaches its sharpest replay picks before Captain Void closes the night.",
  );
  assert.equal(recap.results[0].value.basis, "wwam-feldman-recap/v1");
  assert.notEqual(recap.results[0].value.text, fixtureInput().sources[2].summary.text);
  assert.match(recap.message, /same WWAM Feldman Approved Recap shown on this episode page/i);
  assertExactReceipts(recap, [
    "episode-opening",
    "episode-topic-batman",
    "episode-best",
  ]);

  const recapAlias = queryEngine.answer(request(sourceId, "show recap"));
  assert.equal(recapAlias.status, "supported");
  assert.equal(recapAlias.episode.matchedAlias, "show recap");
  assertExactReceipts(recapAlias, [
    "episode-opening",
    "episode-topic-batman",
    "episode-best",
  ]);

  const conversationalRecap = queryEngine.answer(
    request(sourceId, "Summarize this show."),
  );
  assert.equal(conversationalRecap.intent, "episode-recap");
  assert.equal(
    conversationalRecap.results[0].value.text,
    recap.results[0].value.text,
  );

  const fiveStop = queryEngine.answer(
    request(sourceId, "five stop watch path"),
  );
  assert.equal(fiveStop.status, "supported");
  assert.equal(fiveStop.intent, "episode-experience");
  assert.equal(fiveStop.episode.kind, "experience");
  assert.equal(fiveStop.episode.matchedAlias, "five stop watch path");
  assertExactReceipts(fiveStop, [
    "episode-opening",
    "episode-topic-batman",
    "episode-funniest",
    "episode-steve",
    "episode-character",
  ]);

  const watchPath = queryEngine.answer(request(sourceId, "watch path"));
  assert.equal(watchPath.status, "supported");
  assert.equal(watchPath.episode.matchedAlias, "watch path");
  assertExactReceipts(watchPath, [
    "episode-opening",
    "episode-topic-batman",
    "episode-funniest",
    "episode-steve",
    "episode-character",
  ]);

  const funniest = queryEngine.answer(request(sourceId, "funniest"));
  assert.equal(funniest.status, "supported");
  assert.equal(funniest.intent, "episode-lane");
  assert.equal(funniest.episode.id, "funny-moments");
  assertExactReceipts(funniest, ["episode-funniest"]);

  const best = queryEngine.answer(request(sourceId, "best moments"));
  assert.equal(best.status, "supported");
  assert.equal(best.intent, "episode-lane");
  assert.equal(best.episode.id, "best-moments");
  assertExactReceipts(best, ["episode-best", "episode-funniest"]);

  const topics = queryEngine.answer(request(sourceId, "topics"));
  assert.equal(topics.status, "supported");
  assert.equal(topics.episode.id, "topics");
  assertExactReceipts(topics, [
    "episode-topic-batman",
    "episode-topic-masks",
  ]);

  const batman = queryEngine.answer(
    request(sourceId, "where do they talk about Batman"),
  );
  assert.equal(batman.status, "supported");
  assert.equal(batman.intent, "episode-lane");
  assert.equal(batman.episode.id, "topics");
  assert.equal(batman.episode.totalReceipts, 2);
  assert.equal(batman.episode.matchedReceipts, 1);
  assertExactReceipts(batman, ["episode-topic-batman"]);

  const upInYa = queryEngine.answer(request(sourceId, "up in ya"));
  assert.equal(upInYa.status, "supported");
  assert.equal(upInYa.episode.id, "up-in-ya");
  assertExactReceipts(upInYa, ["episode-up-in-ya"]);

  const steve = queryEngine.answer(
    request(sourceId, "straight to steves asshole"),
  );
  assert.equal(steve.status, "supported");
  assert.equal(steve.episode.id, "straight-to-steve");
  assertExactReceipts(steve, ["episode-steve"]);

  const character = queryEngine.answer(request(sourceId, "character bits"));
  assert.equal(character.status, "supported");
  assert.equal(character.episode.id, "character-bits");
  assertExactReceipts(character, ["episode-character"]);

  const emptyLane = queryEngine.answer(request(sourceId, "hidden gems"));
  assert.equal(emptyLane.status, "insufficient-evidence");
  assert.equal(emptyLane.intent, "episode-lane");
  assert.equal(emptyLane.episode.id, "hidden-gems");
  assert.equal(emptyLane.episode.totalReceipts, 0);
  assert.equal(emptyLane.episode.matchedReceipts, 0);
  assert.equal(emptyLane.resultCount, 0);
  assert.match(emptyLane.message, /does not have a playable moment yet/i);
  assertExactReceipts(emptyLane, []);

  for (const query of ["funniest", "best moment"]) {
    const generic = queryEngine.answer(request("RACE00001A1", query));
    assert.equal(generic.status, "ranking-refused");
    assert.equal(generic.resultCount, 0);
    assert.equal(generic.episode, null);
  }

  const speaker = queryEngine.answer(request(sourceId, "Who said Batman?"));
  assert.equal(speaker.status, "speaker-refused");
  const speakerKeys = receiptKeys(speaker);
  assert.ok(speakerKeys.includes("episode-topic-batman"));
  assert.ok(speakerKeys.every((key) => key.startsWith("episode-")));
  assert.ok(!speakerKeys.includes("race-photo-finish"));
  assert.ok(speaker.results.every((result) =>
    result.type === "receipt" &&
    result.sourceId === sourceId &&
    result.speaker === null &&
    result.speakerStatus === "not-diarized"));
  assert.equal(speaker.boundary.speaker, null);
  assert.equal(speaker.boundary.speakerDiarized, false);
  assert.equal(speaker.boundary.crossSourceSubstitution, false);
  assert.ok(!JSON.stringify(speaker).includes("race-photo-finish"));
});

test("conversational Show Wiki wording does not become a false subject filter", () => {
  const { queryEngine } = runtime();
  const sourceId = "EPISODE01X1";
  const receiptKeys = (query) => queryEngine.answer(request(sourceId, query)).results
    .filter((result) => result.type === "receipt")
    .map((result) => result.key);

  assert.deepEqual(plain(receiptKeys("Can I see the best moments?")), [
    "episode-best",
    "episode-funniest",
  ]);
  assert.deepEqual(plain(receiptKeys("Can I see the funny moments?")), [
    "episode-funniest",
  ]);
  assert.deepEqual(plain(receiptKeys("Did they talk about any topics?")), [
    "episode-topic-batman",
    "episode-topic-masks",
  ]);
  assert.deepEqual(plain(receiptKeys("Were there any character bits?")), [
    "episode-character",
  ]);
  assert.deepEqual(plain(receiptKeys("Can I see straight to steves asshole?")), [
    "episode-steve",
  ]);

  const batman = queryEngine.answer(
    request(sourceId, "topics about Batman"),
  );
  assert.equal(batman.status, "supported");
  assert.deepEqual(plain(receiptKeys("topics about Batman")), [
    "episode-topic-batman",
  ]);

  for (const query of [
    "best moments about Ghostface",
    "character bits with Batman",
  ]) {
    const result = queryEngine.answer(request(sourceId, query));
    assert.equal(result.status, "insufficient-evidence");
    assert.equal(result.resultCount, 0);
    assert.equal(result.episode.matchedReceipts, 0);
  }
});
test("natural Show Wiki grammar resolves registered lanes without weakening exact-source scope", () => {
  const { queryEngine } = runtime();
  const sourceId = "EPISODE01X1";
  const receiptKeys = (answer) => answer.results
    .filter((result) => result.type === "receipt")
    .map((result) => result.key);
  const cases = [
    ["What made them laugh?", "funny-moments", ["episode-funniest"]],
    ["What did they hate?", "straight-to-steve", ["episode-steve"]],
    ["What did they talk about?", "topics", [
      "episode-topic-batman",
      "episode-topic-masks",
    ]],
    ["What did they keep talking about?", "topics", [
      "episode-topic-batman",
      "episode-topic-masks",
    ]],
    ["Funniest parts from last night", "funny-moments", ["episode-funniest"]],
    ["Best parts in Halloween Full Commentary", "best-moments", [
      "episode-best",
      "episode-funniest",
    ]],
    ["Show highlights", "best-moments", [
      "episode-best",
      "episode-funniest",
    ]],
    ["Steve's asshole", "straight-to-steve", ["episode-steve"]],
  ];

  for (const [query, laneId, expectedKeys] of cases) {
    const answer = queryEngine.answer(request(sourceId, query));
    assert.equal(answer.status, "supported", query);
    assert.equal(answer.intent, "episode-lane", query);
    assert.equal(answer.episode.id, laneId, query);
    assert.deepEqual(plain(receiptKeys(answer)), expectedKeys, query);
    assert.ok(answer.results.every((result) => result.sourceId === sourceId), query);
    assert.equal(answer.boundary.exactSourceOnly, true, query);
    assert.equal(answer.boundary.crossSourceSubstitution, false, query);
    assert.equal(answer.boundary.titleInferenceUsed, false, query);
    assert.equal(answer.boundary.speaker, null, query);
  }

  const recap = queryEngine.answer(
    request(sourceId, "Catch me up on last night's show"),
  );
  assert.equal(recap.status, "supported");
  assert.equal(recap.intent, "episode-recap");
  assert.equal(recap.episode.id, "episode-recap");
  assert.ok(recap.results.every((result) => result.sourceId === sourceId));
  assert.ok(recap.limitations.some((item) => /did not rebind the request/i.test(item)));
});

test("natural exact-show counts report registered receipts rather than invented utterance totals", () => {
  const { queryEngine } = runtime();
  const sourceId = "EPISODE01X1";
  const answer = queryEngine.answer(
    request(sourceId, "How many times did they mention Batman?"),
  );

  assert.equal(answer.status, "supported");
  assert.equal(answer.intent, "episode-lane");
  assert.equal(answer.episode.id, "topics");
  assert.equal(answer.episode.countRequested, true);
  assert.equal(answer.episode.countBasis, "registered exact-source receipts");
  assert.equal(answer.episode.totalReceipts, 2);
  assert.equal(answer.episode.matchedReceipts, 1);
  assert.equal(answer.episode.shownReceipts, 1);
  assert.deepEqual(
    plain(answer.results.filter((result) => result.type === "receipt").map((result) => result.key)),
    ["episode-topic-batman"],
  );
  assert.match(answer.message, /counts the timestamped highlights in this Wiki, not every utterance/i);
  assert.ok(answer.limitations.some((item) => /do not measure every utterance/i.test(item)));
  assert.equal(answer.boundary.exactSourceOnly, true);
  assert.equal(answer.boundary.crossSourceSubstitution, false);
  assert.equal(answer.boundary.speakerDiarized, false);

  const wrongSubject = queryEngine.answer(
    request(sourceId, "What did they hate about Ghostface?"),
  );
  assert.equal(wrongSubject.status, "insufficient-evidence");
  assert.equal(wrongSubject.episode.id, "straight-to-steve");
  assert.equal(wrongSubject.resultCount, 0);
});
test("Halloween Panavision cuts bridge exact-show Ask without mutating canonical receipts or leaking sources", () => {
  const { queryEngine, dossierEngine } = runtime();
  const sourceId = "EPISODE01X1";

  const panavision = queryEngine.answer(
    request(sourceId, "Where did they talk about Panavision?", { limit: 8 }),
  );
  assert.equal(panavision.status, "supported");
  assert.equal(panavision.intent, "episode-guide");
  assert.equal(panavision.episode.kind, "guide");
  assert.equal(panavision.episode.id, "episode-guide");
  assert.equal(panavision.episode.totalCuts, 8);
  assert.equal(panavision.episode.matchedCuts, 1);
  assert.equal(panavision.episode.shownCuts, 1);
  assert.equal(panavision.results[0].type, "guide-cut");
  assert.equal(panavision.results[0].id, "guide-cut-panavision");
  assert.equal(panavision.results[0].at, 857);
  assert.match(panavision.results[0].excerpt, /Panavision/i);
  assert.ok(panavision.results.every((result) => result.sourceId === sourceId));
  assert.equal(panavision.boundary.exactSourceOnly, true);
  assert.equal(panavision.boundary.crossSourceSubstitution, false);
  assert.equal(panavision.boundary.canonMutated, false);
  assert.equal(dossierEngine.build(sourceId).source.receipts.length, 9);

  const inventory = queryEngine.answer(
    request(sourceId, "Show me the deep dive cuts", { limit: 8 }),
  );
  assert.equal(inventory.status, "supported");
  assert.equal(inventory.intent, "episode-guide");
  assert.equal(inventory.episode.totalCuts, 8);
  assert.equal(inventory.episode.matchedCuts, 8);
  assert.equal(inventory.episode.shownCuts, 8);
  assert.equal(inventory.results[0].type, "receipt");
  assert.equal(inventory.results[0].key, "episode-best");
  assert.equal(inventory.results[0].guideCutId, "guide-cut-overlap");
  assert.equal(
    inventory.results.filter((result) => Number(result.at) === 1200).length,
    1,
    "the canonical receipt wins exact-timestamp dedupe",
  );
  assert.equal(
    inventory.results.filter((result) => result.type === "guide-cut").length,
    4,
    "four exact timestamp overlaps render once through their canonical receipts",
  );
  assert.ok(inventory.limitations.some((item) => /separate from the canonical/i.test(item)));

  const wrongSource = queryEngine.answer(
    request("RACE00001A1", "Where did they talk about Panavision?"),
  );
  assert.equal(wrongSource.status, "insufficient-evidence");
  assert.equal(wrongSource.resultCount, 0);
  assert.equal(wrongSource.scope.sourceId, "RACE00001A1");
  assert.doesNotMatch(
    JSON.stringify({
      episode: wrongSource.episode,
      results: wrongSource.results,
      message: wrongSource.message,
    }),
    /guide-cut-panavision|Panavision/i,
  );
});

test("summary, artifacts, entities, and connections remain typed and bounded", () => {
  const { queryEngine } = runtime();
  const summary = queryEngine.answer(
    request("RACE00001A1", "Summarize this source"),
  );
  assert.equal(summary.status, "supported");
  assert.equal(summary.results[0].type, "metadata");
  assert.equal(summary.results[0].field, "registered-summary");
  assert.equal(
    summary.results[0].value.basis,
    "caption-audited-source-summary",
  );

  const artifacts = queryEngine.answer(
    request("RACE00001A1", "Show highlight artifacts"),
  );
  assert.equal(artifacts.status, "supported");
  assert.equal(artifacts.results[0].type, "artifact");
  assert.equal(artifacts.results[0].id, "race-feature-package");
  assert.equal(artifacts.results[0].creatorApproved, false);
  assert.equal(artifacts.results[0].rightsCleared, false);

  const entities = queryEngine.answer(
    request("RACE00001A1", "Show topics"),
  );
  assert.equal(entities.status, "supported");
  assert.ok(entities.results.length >= 1);
  assert.ok(entities.results.every((result) =>
    result.type === "entity" &&
    result.sourceId === "RACE00001A1"));

  const connections = queryEngine.answer(
    request("RACE00001A1", "Show related sources"),
  );
  assert.equal(connections.status, "supported");
  assert.equal(connections.results[0].type, "connection");
  assert.equal(connections.results[0].sourceId, "RACE00001A1");
  assert.equal(connections.results[0].targetSourceId, "RACE00002B2");
  assert.equal(connections.results[0].relationshipOnly, true);
  assert.equal(connections.results[0].contentClaim, false);
  assert.equal(connections.results[0].originEstablished, false);
  assert.equal(connections.results[0].causalityEstablished, false);
  assert.equal(connections.boundary.crossSourceSubstitution, false);
});

test("stale source fingerprints refuse before query interpretation", () => {
  const { dossierEngine, window } = runtime();
  const calls = [];
  const engine = window.ShokkerSourceQuery.create({
    dossierEngine: {
      build(sourceId) {
        calls.push(sourceId);
        return dossierEngine.build(sourceId);
      },
    },
  });
  const result = engine.answer(
    request("LV2rmwEA0w4", "What is the funniest moment?", {
      sourceFingerprint: "fnv1a32:deadbeef",
    }),
  );

  assert.deepEqual(calls, ["LV2rmwEA0w4"]);
  assert.equal(result.status, "stale-source");
  assert.equal(result.intent, "unparsed");
  assert.equal(result.resultCount, 0);
  assert.ok(result.limitations.some((item) =>
    /no query was parsed/i.test(item)));
});

test("custom vocabulary changes intent only and cannot weaken source scope", () => {
  const { queryEngine } = runtime({
    vocabulary: {
      ranking: ["wildest"],
      stopwords: ["sequence"],
    },
  });
  const result = queryEngine.answer(
    request("RACE00001A1", "What is the wildest sequence?"),
  );

  assert.equal(result.status, "ranking-refused");
  assert.equal(result.resultCount, 0);
  assert.equal(result.scope.sourceId, "RACE00001A1");
  assert.equal(result.boundary.crossSourceSubstitution, false);
  assert.ok(queryEngine.getVocabulary().ranking.includes("wildest"));
  assert.equal(queryEngine.getPolicy().titleInferenceAllowed, false);
});

test("hostile requests and dishonest dossier engines fail closed", () => {
  const { queryEngine, dossierEngine, window } = runtime();

  assert.throws(
    () => queryEngine.answer({
      schema: "foreign/v1",
      sourceId: "RACE00001A1",
      query: "Show receipts",
    }),
    errorCode("FOREIGN_SCHEMA"),
  );
  assert.throws(
    () => queryEngine.answer({
      ...request("RACE00001A1", "Show receipts"),
      title: "A title must never become scope",
    }),
    errorCode("UNEXPECTED_FIELD"),
  );
  assert.throws(
    () => queryEngine.answer(
      request("RACE00001A1", "Show receipts", { limit: 21 }),
    ),
    errorCode("INVALID_LIMIT"),
  );
  assert.throws(
    () => queryEngine.answer(
      request("RACE00001A1", "Show receipts", { at: 9000 }),
    ),
    errorCode("INVALID_AT"),
  );
  assert.throws(
    () => queryEngine.answer(
      request("UNKNOWN0000", "Show receipts"),
    ),
    errorCode("SOURCE_BUILD_FAILED"),
  );

  const mismatched = window.ShokkerSourceQuery.create({
    dossierEngine: {
      build() {
        return dossierEngine.build("RACE00002B2");
      },
    },
  });
  assert.throws(
    () => mismatched.answer(
      request("RACE00001A1", "Show receipts"),
    ),
    errorCode("SOURCE_SCOPE_MISMATCH"),
  );

  const brokenAlternateTiming = plain(dossierEngine.build("FVuwRHM0kcc"));
  brokenAlternateTiming.source.officialAlternate.durationDelta = 12;
  const brokenAlternateEngine = window.ShokkerSourceQuery.create({
    dossierEngine: {
      build() {
        return brokenAlternateTiming;
      },
    },
  });
  assert.throws(
    () => brokenAlternateEngine.answer(
      request("FVuwRHM0kcc", "Can I play this here?"),
    ),
    errorCode("ALTERNATE_SOURCE_BOUNDARY"),
  );

  const unknownHold = plain(dossierEngine.build("FVuwRHM0kcc"));
  unknownHold.source.exactSourceHold.state = "held-for-unspecified-reason";
  const unknownHoldEngine = window.ShokkerSourceQuery.create({
    dossierEngine: {
      build() {
        return unknownHold;
      },
    },
  });
  assert.throws(
    () => unknownHoldEngine.answer(
      request("FVuwRHM0kcc", "Is there another official edition?"),
    ),
    errorCode("INVALID_ACCESS_PROOF"),
  );

  const unsafe = {};
  Object.defineProperty(unsafe, "schema", {
    enumerable: true,
    get() {
      throw new Error("must not run");
    },
  });
  unsafe.sourceId = "RACE00001A1";
  unsafe.query = "Show receipts";
  assert.throws(
    () => queryEngine.answer(unsafe),
    errorCode("UNSAFE_DESCRIPTOR"),
  );
});
