(function (root) {
  "use strict";

  /*
   * Operational policy required to compile WWAM_CHANNEL_DNA as a ChannelPack.
   * It is separate from the DNA because these are evidence/update guarantees,
   * not claims about the show's identity.
   */
  root.WWAM_CHANNEL_PACK_ADAPTER = Object.freeze({
    laneInclusion: Object.freeze({
      commentary:
        "Full-length franchise commentary sources intentionally selected for the commentary catalog.",
      "fresh-live":
        "The ten newest eligible livestreams in the frozen release snapshot.",
      "popular-live":
        "Twenty-five eligible livestreams selected by public view count in the frozen snapshot.",
      "archive-deep-10":
        "Ten frozen Atlas-priority sources; source-audio-sensitive records remain topic-navigation-only and every machine candidate stays outside the promoted corpus."
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
      sourceOfTruth: "Official We Watched A Movie YouTube uploads",
      cadenceClaim:
        "Manually refreshed through the declared release snapshot; no unattended scheduler is claimed",
      removalPolicy: "tombstone"
    }),
    storage: Object.freeze({
      namespace: "shokker.youtube-wiki.wwam.v1",
      partitionKeys: Object.freeze(["channelId", "sourceId"]),
      exportPrefix: "wwam-after-midnight"
    }),
    surfaceVocabulary: Object.freeze({
      ask: "ASK THE TAPE",
      receipt: "TAPE RECEIPT",
      source: "SOURCE TAPE",
      unknown: "THE TAPE DOESN'T KNOW",
      quarantine: "MACHINE SURFACED",
      curatedCandidate: "TIMESTAMP-VALIDATED HUMAN-CURATED CANDIDATE",
      reviewed: "EDITOR VERIFIED",
      certified: "CREATOR CERTIFIED",
      correction: "CORRECTION RIPPLE"
    }),
    longitudinalVocabulary: Object.freeze({
      product: "THE TAPE KEEPS SCORE",
      forecast: "BEFORE TAPE",
      response: "AFTER TAPE",
      unresolved: "THE TAPE PLEADS THE FIFTH",
      editBrief: "BEFORE / AFTER EDIT BRIEF"
    }),
    adjudicationVocabulary: Object.freeze({
      SUPPORTED: Object.freeze({
        formal: "SUPPORTED WITHIN REVIEWED SCOPE",
        comedy: "CALLED THAT SHIT.",
        bleep: "CALLED THAT [BLEEP]."
      }),
      CONTRADICTED: Object.freeze({
        formal: "CONTRADICTED WITHIN REVIEWED SCOPE",
        comedy: "AGED LIKE ROADKILL.",
        bleep: "AGED LIKE ROADKILL."
      }),
      MIXED: Object.freeze({
        formal: "MIXED WITHIN REVIEWED SCOPE",
        comedy: "HALF PROPHET. HALF JACKASS.",
        bleep: "HALF PROPHET. HALF [BLEEP]."
      })
    }),
    capabilities: Object.freeze([
      "ask-the-tape",
      "character-studio",
      "creator-clip-lab",
      "creator-taste-calibration",
      "fresh-tape-intake",
      "human-adjudication-ledger",
      "longitudinal-claim-ledger",
      "memory-graph",
      "red-band-candidate-index",
      "tape-companion"
    ])
  });
})(typeof window !== "undefined" ? window : globalThis);
