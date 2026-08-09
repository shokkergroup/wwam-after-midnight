(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "NZprZ1gWBIw";
  var duration = 1941;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 450, "WWAM ORIGIN LORE", "HALLOWEEN IS THE ERECTION OF THE SELECTION", "The encore opens with the hosts declaring Halloween the erection of their selection, turning Michael's lone-wolf hunt into a sexualized WWAM welcome back."),
    H(450, 900, "STRAIGHT TO STEVE'S ASSHOLE", "MASK HANDLING, SECURITY, AND PEANUT BUTTER ON MICHAEL'S PENIS", "Sartain's mask handling gets prosecuted, Michael's bag becomes a security checkpoint, and a peanut-butter penis discovery derails the early kill discussion."),
    H(900, 1300, "BEST MOMENT", "THE FIRST COLLARBONE, THE THREE-FINGER GRIP, AND THE POSTER SHOT", "Michael takes a real injury, the three-finger death grip becomes the room's new measurement, and the hosts argue that the trapped, looking-down mask shot should have been the poster."),
    H(1300, 1700, "TAKE GETS NUCLEAR", "KID'S MEAL SAUCE, KID'S THREE KILLERS, AND HEREDITARY", "A food-sauce tangent becomes a kidney-stone panic, a child's meal metaphor, and a comparison between Michael's trapped abyss and Hereditary's dread."),
    H(1700, 1941, "WWAM UP IN YA", "SUBWAY GLOVES, THE DOCUMENTARY, AND A NECK-CRICK SIGN-OFF", "The hosts praise Michael's haunting face, compare a trapped scene to ordering a Subway sandwich without gloves, then end with a neck crick, a subscribe command, and a documentary-celebration tease."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 450, label: "HALLOWEEN 2018 RETURNS AS THE ERECTION OF THE SELECTION", body: "This short encore begins with a deliberately filthy welcome: Halloween is the erection of the selection, Michael is the lone wolf hunting the wolf, and the hosts are already trying to make a horror movie handshake sexual. The tone is not a full franchise review; it is a compressed celebration of the 2018 film's ability to make the room excited before the kill count starts.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 450, end: 900, label: "MASK SECURITY AND THE PEANUT-BUTTER PENIS", body: "Sartain's mask handling becomes a crime against Michael's face, the security around a Hollywood star becomes an investigative-journalism bit, and a peanut-butter penis discovery derails the early scene. The jokes are crude, but the underlying point is precise: Michael's mask is treated as a character object, not a disposable prop.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 900, end: 1300, label: "THE COLLARBONE, THREE FINGERS, AND THE POSTER SHOT", body: "Michael takes a real injury and the hosts react as if a wrestling monster has finally discovered pain. The three-finger grip becomes a new unit of threat, while the trapped mask looking down is identified as the poster image the film should have used. The room keeps laughing, but it is also describing why the scene works visually.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1300, end: 1700, label: "SAUCE, KIDNEY STONES, AND THE HEREDITARY ABYSS", body: "A food-sauce conversation turns into kidney-stone panic, a child's meal metaphor, and a comparison between Michael's trapped abyss and Hereditary's dread. The hosts admire the image of Michael looking down into the trap, then translate the suspense into the feeling of a fast-food order going catastrophically wrong.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1700, end: 1941, label: "SUBWAY GLOVES AND A DOCUMENTARY CELEBRATION", body: "The close praises Michael's haunting face, compares a gloveless Subway sandwich to a horror scene, and ends with a neck crick, a subscribe command, and a documentary-celebration tease. It is a compact archive receipt for the hosts' 2018 Halloween enthusiasm: crude, visual, and genuinely impressed by the shape of the mask in motion.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 32m Halloween 2018 encore; local audio, canonical captions, and Whisper ledger checked across erection-of-selection opening, Michael lone wolf, Sartain mask handling, security checkpoint, peanut-butter penis, true-evil wind joke, first collarbone injury, three-finger grip, trapped poster shot, child meal/sauce, kidney-stone panic, Hereditary comparison, Subway gloves, subscribe, neck crick, documentary celebration tease",
    evidence: Object.freeze({ duration: 1941, captionWords: 1975, captionEvents: 1011, captionSpanSeconds: 1933.28, captionDurationCoveragePercent: 99, captionSha256: "0FCCC05567EED1D727DFB77EBCA34D8F379FDCF64DC7B5DB227CC1DEA880FE64", captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger", audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority", audioSha256: "94D9FEAAB44F438C51E967D6E5A7C1C7A6FDB5698E1B4380DA6C4A020836D567", asrSegmentCount: 258, asrSha256: "24B31FD27EEF607B84A03ED08AACBC636376BCF85A25468896DFD079168D894B", asrCoverageStartSeconds: 0, asrCoverageEndSeconds: 1940.96, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "HALLOWEEN 2018 ENCORE // MASK SECURITY, THE FIRST COLLARBONE, AND THE POSTER SHOT",
    badge: "FULL SHOW WIKI // THREE-FINGER GRIP, HEREDITARY ABYSS, SUBWAY GLOVES, AND DOCUMENTARY LORE",
    headline: "HALLOWEEN 2018 IS STILL THE ERECTION OF THE SELECTION",
    deck: "A compact full-audio WWAM encore of Halloween 2018: Sartain's mask crime, Michael's first collarbone, the three-finger grip, the poster shot, and a documentary-celebration close.",
    overview: "This short Halloween 2018 encore is not a second full review; it is a concentrated archive receipt for the 2018 film's visual power. The hosts open by calling Halloween the erection of their selection, Michael the lone wolf hunting the wolf, and the mask conversation a sexual event. Sartain's handling of the mask becomes a crime against Michael's face, Hollywood security becomes investigative journalism, and a peanut-butter penis discovery derails the early kill discussion. Michael's first real injury gets a wrestling-monster reaction. The three-finger grip becomes a new unit of threat, and the trapped, looking-down mask shot is identified as the poster image the film should have used. A food-sauce tangent becomes kidney-stone panic, a child's meal metaphor, and a comparison between Michael's trapped abyss and Hereditary's dread. The close praises Michael's haunting face, compares a gloveless Subway sandwich to a horror scene, and ends with a neck crick, a subscribe command, and a documentary-celebration tease. This dossier does not assign a named speaker to any line; local audio and ASR establish bounded routes, with playback remaining the authority. The archive value is its compression: in thirty-two minutes the hosts record the exact parts of Halloween 2018 that kept the character alive for them—mask shape, physical pain, trap geometry, and a face that remains more powerful than the plot around it.",
    topics: Object.freeze(["Halloween 2018", "Michael Myers", "Sartain", "Halloween Horror Month", "Hereditary", "Dr. Loomis", "mask", "documentary", "three-finger grip"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 900, end: 1300, label: "THE TRAPPED POSTER SHOT", topic: "Michael's visual power", body: "Play the collarbone, three-finger, and mask-looking-down section for the encore's strongest visual reading.", playAt: 900, playEnd: 1300 }),
      hated: Object.freeze({ at: 450, end: 900, label: "SARTAIN'S MASK CRIME", topic: "Prop handling", body: "Play the mask and security section for the exact point where the hosts treat the mask like a living archive object.", playAt: 450, playEnd: 900 }),
      wildestDetour: Object.freeze({ at: 1300, end: 1700, label: "SAUCE / KIDNEY STONES / HEREDITARY", topic: "Fast-food dread", body: "Play the sauce tangent for the shortest path from a child's meal to an existential horror comparison.", playAt: 1300, playEnd: 1700 }),
      lastWord: Object.freeze({ at: 1700, end: 1941, label: "DOCUMENTARY CELEBRATION", topic: "Encore close", body: "Play the close for the Subway-gloves joke, subscribe command, and documentary tease.", playAt: 1700, playEnd: 1941 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([]),
      note: "No Super Chat, donation, named-fan exchange, or community pick is audible in this encore. The FAM lane stays empty rather than inventing a receipt."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
