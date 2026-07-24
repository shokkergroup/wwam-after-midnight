(function (root) {
  "use strict";

  /*
   * Channel DNA is editorial configuration, not evidence. It tells the Memory OS
   * what to look for and how to present it. Every public moment-level claim must
   * resolve to a timestamped receipt. Source-level metadata and derived summaries
   * must resolve to a labeled source record and must not masquerade as utterances.
   */
  root.WWAM_CHANNEL_DNA = Object.freeze({
    id: "wwam",
    version: "1.0.0",
    label: "WWAM After Midnight",
    channel: "We Watched A Movie",
    promise: "The horror-comedy channel memory that can show its work.",
    proofSnapshot: Object.freeze({
      asOf: "2026-07-23",
      sources: 84,
      wordsAudited: 2175344,
      captionHours: 194.89,
      knownRuntimeHours: 201.15,
      receipts: 872,
      nodes: 168,
      basis: "Audited output over the preserved commentary, Fresh 10, Popular 25, and Archive Deep Batch 01 inputs. The 42 new archive candidates remain outside the 872 promoted editorial receipts. The 168 nodes remain scoped to the 74-source promoted Showcase corpus."
    }),

    sourceLanes: Object.freeze({
      commentary: {
        label: "COMMENTARY CATALOG",
        purpose: "Long-form franchise watchalongs and movie-specific riffs"
      },
      "fresh-live": {
        label: "FRESH 10",
        purpose: "A rolling view of what the show is talking about now"
      },
      "popular-live": {
        label: "POPULAR 25",
        purpose: "Foundational livestreams selected by observed YouTube view count at the frozen snapshot"
      },
      "archive-deep-10": {
        label: "ARCHIVE DEEP BATCH 01",
        purpose: "The first frozen Atlas priority batch, caption-audited with machine candidates held outside canon"
      }
    }),

    taxonomy: Object.freeze({
      entityTypes: [
        "source",
        "franchise",
        "film",
        "topic",
        "person",
        "character",
        "bit"
      ],
      receiptTypes: [
        "moment",
        "topic-chapter",
        "character-performance",
        "creator-note"
      ],
      relationships: [
        "CONTAINS",
        "PART_OF",
        "MENTIONS",
        "PERFORMS_AS",
        "CALLS_BACK_TO",
        "SUPPORTS",
        "CONTRADICTS"
      ],
      comedySignals: [
        "OUT OF POCKET",
        "BREAKDOWN",
        "BIT ENERGY",
        "THE ROOM BREAKS",
        "UP IN YA",
        "CHAT DID THIS",
        "FULL SEND"
      ],
      opinionSignals: {
        positive: ["LOVE LETTER"],
        negative: ["FRANCHISE FELONY"],
        contextual: ["TAKE GETS NUCLEAR", "THEORY BOARD", "HORROR BRAIN"]
      }
    }),

    entities: Object.freeze([
      {
        id: "franchise:halloween",
        type: "franchise",
        label: "Halloween",
        aliases: ["halloween", "michael myers", "the shape", "silver shamrock"]
      },
      {
        id: "franchise:friday-the-13th",
        type: "franchise",
        label: "Friday the 13th",
        aliases: ["friday the 13th", "friday the thirteenth", "jason voorhees", "crystal lake"]
      },
      {
        id: "franchise:scream",
        type: "franchise",
        label: "Scream",
        aliases: ["scream", "ghostface", "woodsboro"]
      },
      {
        id: "franchise:elm-street",
        type: "franchise",
        label: "A Nightmare on Elm Street",
        aliases: ["nightmare on elm street", "elm street", "freddy krueger", "springwood"]
      },
      {
        id: "film:halloween-ends",
        type: "film",
        label: "Halloween Ends",
        aliases: ["halloween ends"]
      },
      {
        id: "film:scream-7",
        type: "film",
        label: "Scream 7",
        aliases: ["scream 7", "scream seven"]
      },
      {
        id: "film:scream-vi",
        type: "film",
        label: "Scream VI",
        aliases: ["scream vi", "scream 6", "scream six"]
      },
      {
        id: "topic:anticipation-reception",
        type: "topic",
        label: "Anticipation → reception",
        aliases: ["anticipation reception"]
      },
      {
        id: "topic:commentary-plan",
        type: "topic",
        label: "Commentary plan",
        aliases: ["commentary plan"]
      },
      {
        id: "topic:anger-to-death-talk",
        type: "topic",
        label: "Anger forecast → later death talk",
        aliases: ["anger forecast", "death talk"]
      }
    ]),

    characters: Object.freeze([
      {
        id: "character:loomis",
        label: "Dr. Loomis",
        performer: "J",
        performerStatus: "owner-confirmed",
        canon: "Halloween",
        aliases: ["dr loomis", "doctor loomis", "loomis", "lumis", "lumas", "loumis"],
        signals: [
          "michael",
          "evil",
          "escaped",
          "the night",
          "warned",
          "six times"
        ],
        performanceShape: [
          "urgent public-safety warning",
          "absolute certainty",
          "escalation from concern to apocalyptic alarm"
        ],
        minimumCuratedCandidatesForAsk: 3
      },
      {
        id: "character:challis",
        label: "Dr. Challis",
        performer: "Mike",
        performerStatus: "owner-confirmed",
        canon: "Halloween III: Season of the Witch",
        aliases: ["dr challis", "doctor challis", "challis", "chalice", "chalis"],
        signals: [
          "silver shamrock",
          "cochran",
          "commercial",
          "hospital",
          "stop it",
          "the masks"
        ],
        performanceShape: [
          "exhausted conspiracy detective",
          "commercial-countdown panic",
          "barely controlled incredulity"
        ],
        minimumCuratedCandidatesForAsk: 3
      },
      {
        id: "character:slenderman",
        label: "Slenderman",
        performer: "J",
        performerStatus: "owner-confirmed",
        canon: "WWAM recurring character",
        aliases: ["slenderman", "slender man", "slendy", "slender bad", "slenderban"],
        signals: ["woods", "forest", "tall", "faceless", "slender"],
        performanceShape: [
          "ominous deadpan",
          "mundane concern inside supernatural menace",
          "long-pause escalation"
        ],
        minimumCuratedCandidatesForAsk: 3
      },
      {
        id: "character:corey-feldman",
        label: "Corey Feldman",
        performer: "J",
        performerStatus: "owner-confirmed",
        canon: "WWAM recurring impression",
        aliases: ["corey feldman", "cory feldman", "corey felman", "cory felman", "feldman"],
        signals: ["corey", "feldman"],
        performanceShape: [
          "theatrical celebrity-survivor bravado",
          "grand pronouncement",
          "self-mythologizing escalation"
        ],
        minimumCuratedCandidatesForAsk: 3
      }
    ]),

    bitDefinitions: Object.freeze([
      {
        id: "bit:loomis-alert",
        label: "THE LOOMIS ALERT SYSTEM",
        characterId: "character:loomis",
        aliases: ["loomis", "dr loomis", "doctor loomis"],
        requireAny: ["loomis"],
        boostAny: ["michael", "evil", "escaped", "warned", "night"]
      },
      {
        id: "bit:challis-hotline",
        label: "THE CHALLIS HOTLINE",
        characterId: "character:challis",
        aliases: ["challis", "dr challis", "doctor challis", "silver shamrock"],
        requireAny: ["challis", "shamrock"],
        boostAny: ["commercial", "cochran", "masks", "stop it"]
      },
      {
        id: "bit:slenderman-dispatch",
        label: "SLENDERMAN DISPATCH",
        characterId: "character:slenderman",
        aliases: ["slenderman", "slender man"],
        requireAny: ["slenderman", "slender man"],
        boostAny: ["woods", "forest", "tall", "faceless"]
      },
      {
        id: "bit:feldman-frequency",
        label: "THE FELDMAN FREQUENCY",
        characterId: "character:corey-feldman",
        aliases: ["corey feldman", "feldman"],
        requireAny: ["feldman"],
        boostAny: ["corey"]
      }
    ]),

    riffChemistry: Object.freeze({
      dimensions: [
        "heat",
        "escalation",
        "callbackDensity",
        "derailment",
        "roomBreak",
        "topicCollision"
      ],
      weights: {
        heat: 0.28,
        escalation: 0.2,
        callbackDensity: 0.16,
        derailment: 0.16,
        roomBreak: 0.14,
        topicCollision: 0.06
      },
      labels: [
        { min: 90, label: "ROOM STRUCTURALLY UNSOUND" },
        { min: 78, label: "FULL MIDNIGHT EVENT" },
        { min: 64, label: "BIT HAS ESCAPED CONTAINMENT" },
        { min: 48, label: "RIFF CHAIN ACTIVE" },
        { min: 0, label: "TRACE EVIDENCE" }
      ]
    }),

    askCharacterPolicy: Object.freeze({
      modeLabel: "PARODY RECONSTRUCTION",
      disclosure:
        "An original, clearly labeled parody assembled from timestamp-validated curated performance candidates. It is not a real quote from Mike or J, an authenticated editor decision, or proof of a clip speaker.",
      evidenceMinimum: 3,
      requirePerformerConfirmation: true,
      responseRules: [
        "Never present generated dialogue as archival audio or a real quotation.",
        "Show the source receipts that taught the system the recurring performance pattern.",
        "Keep real soundbyte playback separate from generated text.",
        "Do not clone or synthesize a host's voice; play only the linked original source at its validated timestamp.",
        "If the evidence minimum is not met, return a dossier-in-progress state instead of inventing the character."
      ]
    }),

    voice: Object.freeze({
      principles: [
        "Write like an obsessive fan-editor with receipts, not a generic assistant.",
        "Prefer a sharp specific label over a vague superlative.",
        "Let evidence be deranged; keep navigation and provenance extremely clear.",
        "Distinguish what the show said from what the system inferred.",
        "Never guess which host spoke when the transcript cannot prove it."
      ],
      bannedCopy: [
        "delve",
        "rich tapestry",
        "in today's fast-paced world",
        "comprehensive overview",
        "as an ai",
        "fans will love",
        "content creator"
      ],
      proofLabels: {
        machine: "MACHINE SURFACED",
        curatedCandidate: "TIMESTAMP-VALIDATED HUMAN-CURATED CANDIDATE",
        editor: "EDITOR VERIFIED",
        creator: "CREATOR CERTIFIED",
        inference: "EVIDENCE-BASED INFERENCE"
      }
    }),

    qualityGates: Object.freeze({
      publicExcerptWords: 16,
      noSpeakerGuessing: true,
      timestampRequired: true,
      sourceUrlRequired: true,
      generatedCharacterAudioAllowed: false,
      minimumCourtSides: 2,
      minimumTimelineReceipts: 2
    })
  });
})(typeof window !== "undefined" ? window : globalThis);
