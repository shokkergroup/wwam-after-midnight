/*
 * Synthetic conformance fixture only. It does not describe VRL or any real
 * channel, and it is never loaded by the WWAM public demo.
 */
export const NEUTRAL_RACING_DNA = Object.freeze({
  id: "sample-racing",
  version: "0.1.0",
  label: "Sample Racing Memory",
  channel: "Fictional Test Channel",
  promise: "A synthetic race archive used only to prove ChannelPack portability.",
  sourceLanes: Object.freeze({
    "feature-race": Object.freeze({
      label: "FEATURE RACES",
      purpose: "Official fictional Wednesday feature broadcasts"
    }),
    qualifying: Object.freeze({
      label: "QUALIFYING",
      purpose: "Official fictional qualifying sessions attached to a feature event"
    })
  }),
  taxonomy: Object.freeze({
    entityTypes: Object.freeze([
      "source",
      "event",
      "participant",
      "series",
      "track"
    ]),
    receiptTypes: Object.freeze([
      "moment",
      "result",
      "topic-chapter"
    ]),
    relationships: Object.freeze([
      "CONTAINS",
      "PART_OF",
      "COMPETED_IN",
      "SUPPORTS",
      "CONTRADICTS"
    ])
  }),
  qualityGates: Object.freeze({
    publicExcerptWords: 16,
    noSpeakerGuessing: true,
    timestampRequired: true,
    sourceUrlRequired: true,
    generatedCharacterAudioAllowed: false
  }),
  voice: Object.freeze({
    proofLabels: Object.freeze({
      machine: "REPLAY UNDER REVIEW",
      curatedCandidate: "TIMESTAMP-VALIDATED HUMAN-CURATED RACE CANDIDATE",
      editor: "STEWARD CHECKED",
      creator: "LEAGUE CERTIFIED",
      inference: "TIMING-BASED INFERENCE"
    })
  })
});

export const NEUTRAL_RACING_ADAPTER = Object.freeze({
  laneInclusion: Object.freeze({
    "feature-race": "Official Wednesday feature broadcasts only; practices and mock events are excluded.",
    qualifying: "Official qualifying attached to an included feature broadcast only."
  }),
  evidencePolicy: Object.freeze({
    machineOutputState: "quarantine",
    curatedCandidateState: "timestamp-validated-human-curated-candidate",
    curatedCandidateAuthenticated: false,
    editorVerificationRequiresAuthentication: true,
    promotionRequiresHumanReview: true,
    corrections: "append-only",
    preserveContradictions: true
  }),
  updateContract: Object.freeze({
    stages: Object.freeze(["discover", "quarantine", "review", "promote"]),
    sourceOfTruth: "The fictional channel's official upload feed",
    cadenceClaim: "Manual conformance fixture; no live scheduler is claimed",
    removalPolicy: "tombstone"
  }),
  storage: Object.freeze({
    namespace: "shokker.youtube-wiki.sample-racing.v1",
    partitionKeys: Object.freeze(["channelId", "sourceId"]),
    exportPrefix: "sample-racing-memory"
  }),
  surfaceVocabulary: Object.freeze({
    ask: "ASK RACE CONTROL",
    receipt: "RACE RECEIPT",
    source: "OFFICIAL BROADCAST",
    unknown: "NOT ON THE TIMING SHEET",
    quarantine: "REPLAY UNDER REVIEW",
    curatedCandidate: "TIMESTAMP-VALIDATED HUMAN-CURATED RACE CANDIDATE",
    reviewed: "STEWARD CHECKED",
    certified: "LEAGUE CERTIFIED",
    correction: "SCORING CORRECTION"
  }),
  capabilities: Object.freeze([
    "event-time-machine",
    "participant-dossier",
    "receipt-search"
  ])
});
