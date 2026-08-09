(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "tGsSV60FmX0";
  var duration = 1357;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-audio-asr-editorial-read", evidenceState: "source-local Whisper/audio second read; playback remains the authority" };
  };
  var highlights = [
    H(0, 260, "OPENING VERDICT", "THE CULT OF CHUCKY COMMENTARY OPENS WITH A BODY-TICKLE PLAN AND A VERY FRANK 'THIS FRANCHISE SUCKS'", "The commentary begins after the movie has already exhausted the hosts. They say they are done with Chucky, then immediately start inventing ways to restrain and tickle the doll. The disgust is part of the review, not a missing summary."),
    H(260, 520, "UP IN YA", "NETFLIX PASSWORDS, WHITE WINE, JENNIFER TILLY, AND THE QUESTION OF WHETHER A DOLL HAS A GENDER", "The room drifts through the Netflix setup, Jennifer Tilly's appearance, tattoo and body jokes, and a deliberately stupid argument about Chucky's identity. The hosts' interest is less in continuity than in how much bizarre material the film throws at them."),
    H(520, 760, "DEATH RECEIPT", "THE DECAPITATION KILL WORKS UNTIL THE CGI HEAD REMINDS EVERYONE IT IS CGI", "A kill gets a rare positive reaction because the setup and impact are strong. Then the digital head undercuts it. The dossier preserves both halves: the hosts like the beat and hate the visible effect."),
    H(760, 1030, "HALLOWEEN LORE", "DONALD PLEASENCE, JOHN CARPENTER, AND THE ORIGINAL HALLOWEEN 'WOULD YOU BELIEVE A SEQUEL?' RECEIPT", "The commentary leaves Chucky to revisit a story about Carpenter telling Donald Pleasence to look over the fence because Michael would be gone—and because they were already thinking sequel. The hosts use it to debate whether Carpenter truly hated sequels or simply hated bad ones."),
    H(1030, 1210, "DIRECTOR DEBATE", "JOHN CARPENTER OR DAVID GORDON GREEN: THE ARGUMENT ONLY WORKS IF CARPENTER ACTUALLY WANTS THE JOB", "The hosts argue in circles until the condition is finally stated correctly: if Carpenter genuinely wants to direct another Halloween and has a strong idea, he gets the opportunity; if not, David Gordon Green remains the better practical choice."),
    H(1210, 1357, "CLOSING VERDICT", "THE CHUCKY PENINSULA ENDS WHERE IT SHOULD: TALKING ABOUT MICHAEL MYERS", "The hosts close the Cult of Chucky run by declaring Halloween stronger than Child's Play, thanking the audience, and admitting that even a Chucky commentary eventually finds its way back to Michael Myers."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 520, label: "THE MOVIE HAS ALREADY LOST THE ROOM BEFORE THE COMMENTARY FINISHES", body: "The hosts are openly exhausted by Cult of Chucky, but the exhaustion produces the show's funniest language: a feather-tickle threat, Netflix-password panic, Jennifer Tilly detours, and a gender argument about the doll. This is a verdict-driven commentary, not a scene-by-scene recap.", evidenceBasis: "full-tape-audio-asr-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 520, end: 760, label: "ONE KILL EARNS A CHEER UNTIL THE DIGITAL HEAD ARRIVES", body: "The decapitation setup and impact work for the hosts, then the visible CGI head breaks the spell. The archive records the split reaction instead of calling the whole sequence good or bad.", evidenceBasis: "full-tape-audio-asr-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 760, end: 1030, label: "CHUCKY BECOMES A SIDE DOOR INTO HALLOWEEN HISTORY", body: "A Donald Pleasence and John Carpenter story redirects the commentary to the original Halloween's open ending and the idea of a sequel. The hosts' hatred of Chucky does not stop the archive from finding the Carpenter lore hiding inside the room.", evidenceBasis: "full-tape-audio-asr-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1030, end: 1210, label: "THE CARPENTER/GREEN ARGUMENT NEEDS A PASSION TEST", body: "The booth keeps disagreeing until the question is made fair: not who has the bigger name, but whether Carpenter is actually passionate about the next Halloween and has a good idea. That condition resolves the circular debate.", evidenceBasis: "full-tape-audio-asr-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1210, end: 1357, label: "THE CHUCKY RUN ENDS WITH THE CHANNEL'S REAL CALLING CARD", body: "The closing verdict is blunt: Halloween wins the franchise comparison, and even this Chucky commentary ends up talking about Michael Myers. The archive keeps that handoff because it is the show's actual shape.", evidenceBasis: "full-tape-audio-asr-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-audio-asr-editorial-read",
    editorialPass: "2026-08-09 fine-toothed audio/Whisper read; no public caption ledger was available, so every timed receipt is bounded to the local ASR and canonical audio across the Cult of Chucky verdict, kill reaction, Carpenter/Pleasence story, Carpenter versus Green debate, and Halloween handoff",
    evidence: Object.freeze({ duration: duration, captionWords: 0, captionEvents: 0, captionSpanSeconds: 0, captionDurationCoveragePercent: 0, captionSha256: "not-available-no-public-caption-ledger", captionSourceKind: "no public caption ledger; source-local Whisper ASR", audioPass: "canonical local source audio + source-local Whisper alignment; playback remains the authority", audioSha256: "41BDD750D0600D2A9857C8529D165760206C052845CE31529425754225B6EEAC", asrWindowCount: 1, asrSegmentCount: 572, asrSha256: "97131BED7FDC82F32B0FACC4F370F8CA80514D8BC6ABF4FBFE5E4C95E78D9F7F", speakerAttribution: false, visualOutcomeInferred: false }),
    label: "WATCHALONG // CULT OF CHUCKY",
    badge: "FULL SHOW WIKI // CHUCKY VERDICT, KILL RECEIPTS, CARPENTER LORE, AND THE HALLOWEEN HANDOFF",
    headline: "CULT OF CHUCKY ENDS WHERE WWAM WANTS IT: BACK AT HALLOWEEN",
    deck: "A 22-minute audio-grounded commentary dossier with no invented caption or FAM claims, focused on the Chucky verdict, Carpenter lore, and the final franchise comparison.",
    overview: "The Cult of Chucky commentary is short, audio-only, and unusually honest about its own limits. The hosts begin exhausted and openly hostile to the franchise, then turn that exhaustion into a run of bizarre bits about restraining Chucky, Netflix passwords, Jennifer Tilly, tattoos, and whether a killer doll has a gender. One death earns a genuine positive reaction before the CGI head breaks the spell. The most valuable turn comes when the commentary leaves Chucky and revisits a Donald Pleasence story about John Carpenter telling him to look over the fence because Michael would be gone and a sequel was already being considered. That becomes a debate about whether Carpenter hates sequels or simply hates bad ones. The hosts finally resolve the Carpenter-versus-David-Gordon-Green argument with a passion test: if Carpenter genuinely wants the job and has a strong idea, let him direct; otherwise Green is the practical choice. The closing verdict is the real WWAM artifact—Halloween is stronger than Child's Play, and even a Cult of Chucky commentary eventually finds Michael Myers.",
    topics: Object.freeze(["Cult of Chucky", "Chucky", "Child's Play", "Jennifer Tilly", "Donald Pleasence", "John Carpenter", "David Gordon Green", "Halloween", "Michael Myers", "Cenobites"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 760, end: 1030, label: "THE CHUCKY COMMENTARY FINDS A HALLOWEEN STORY", topic: "Carpenter lore", body: "Play from 12:40. The Donald Pleasence story becomes the most useful archive door in the tape.", playAt: 760, playEnd: 1030 }),
      hated: Object.freeze({ at: 0, end: 260, label: "THE ROOM IS DONE WITH CHUCKY BEFORE THE CREDITS ARE", topic: "Franchise verdict", body: "Play from 0:00. The hosts' blunt dislike is the review's opening thesis.", playAt: 0, playEnd: 260 }),
      wildestDetour: Object.freeze({ at: 260, end: 520, label: "NETFLIX PASSWORDS AND A GENDER ARGUMENT ABOUT A KILLER DOLL", topic: "Up in Ya", body: "Play from 4:20. The commentary turns a Chucky setup into a deliberately stupid side room.", playAt: 260, playEnd: 520 }),
      lastWord: Object.freeze({ at: 1210, end: 1357, label: "THE CHUCKY PENINSULA ENDS WITH MICHAEL MYERS", topic: "Closing verdict", body: "Play from 20:10. Halloween wins the comparison and the commentary hands off to Michael.", playAt: 1210, playEnd: 1357 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([]),
      note: "No live-chat or Super Chat ledger is present for this source. No FAM names, donation claims, or audience interactions are invented; the dossier is bounded to local audio and Whisper timing."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
