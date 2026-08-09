(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "v4TuS9kqPnM";
  var duration = 1290;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 260, "WWAM UP IN YA", "CHILD'S PLAY 2, CHRIS BUCCI, AND THE VOLUME WAR", "The booth starts the sequel with Chris Bucci in the room, a failed volume setup, the classic cue, and a confession that the later Child's Play movies are a long road to get through."),
    H(260, 520, "STRAIGHT TO STEVE'S ASSHOLE", "CHUCKY'S PINK LIPS AND THE CHINA-DOLL PARENT", "Chucky's lips, a sweater pin, and an adult repairing a china doll become a full argument about terrible parenting and the worst possible toy in an adopted child's house."),
    H(520, 760, "BEST MOMENT", "THE DOLL KILLS THE FAMILY AND THE VANDER HOLYFIELD PUNCH", "The hosts point out that the kid has already lost two families to the same doll, then treat Chucky getting smacked as a boxing upset."),
    H(760, 940, "TAKE GETS NUCLEAR", "THE REMAKE SHOULD UNLEASH EVERY GOOD GUY DOLL", "A pile of dolls becomes the remake pitch: every packaged Good Guy breaks out at once and turns Black Friday into a murder spree."),
    H(940, 1120, "WWAM UP IN YA", "STRETCH ARMSTRONG, CHUCK E. M. BANES, AND TWO DICKS IN THE EYE", "The transformation disgusts the room, the human Chucky question gets a body-horror answer, and an eye gag becomes a full coffee-and-orgasm detour."),
    H(1120, 1290, "LAST CALL", "THE MOVIE ENDS, THE FLUTE STARTS, AND THE DARK NIGHT PREP", "The short feature ends abruptly, a flute appears, and the hosts warn that the next full commentary will require two weeks of preparation and probably illegal mail."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 520, label: "THE SEQUEL STARTS WITH A VOLUME BUTTON", body: "Child's Play 2 begins as a compact watchalong follow-up. Chris Bucci gets acknowledged, the volume setup refuses to behave, the headphones change hands, and the sucking, fucking, touching cue has to be rebuilt in public. The booth admits the franchise is a long road: the first movie works, the second is not bad, the third can bore you, and the later entries require preparation. Chucky's pink lips and the image of a parent repairing a china doll become the opening argument about whether this family has learned anything at all.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 520, end: 940, label: "THE TWO-FAMILY PROBLEM AND THE GOOD GUY ARMORY", body: "The central logic complaint is brutally simple: this child has already lived through two families where the same small doll murdered people, and the adults still pass him to a different house with more dolls. The hosts describe Chucky getting punched like a Vander Holyfield upset, then ask what a remake could do with the premise. The answer is not a smarter doll. It is every Good Guy doll escaping its package at once and turning a shopping day into an armory.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 940, end: 1120, label: "THE TRANSFORMATION AND THE EYE-GAG DETOUR", body: "The human Chucky transformation is treated as a body-horror event the booth wishes it could pause and unsee. Stretch Armstrong, Chuck E. M. Banes, ripping sounds, two dicks in the eye, coffee, and an imaginary orgasm all arrive before the movie has time to recover. The sequence is less a verdict than a WWAM reflex: if the effect is gross, make the grossness social, then make it sexual, then accuse the other host of over-caffeination.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1120, end: 1290, label: "THE SHORT FILM ENDS BEFORE THE ROOM IS READY", body: "The feature appears to end, the hosts argue about whether the movie is actually starting again, a flute comes out, and the next full commentary is declared a dark night requiring two weeks of preparation. The sign-off asks for cocaine in the mail, immediately admits that would be illegal, and leaves the audience with the sense that the next tape will be less a movie night than an endurance event.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 21m30s Child's Play 2 follow-up; local audio, canonical captions, and Whisper ledger checked across Chris Bucci opening, later-franchise reluctance, failed volume setup, sucking/fucking/touching cue, Walden Chris, Chucky pink lips, sweater pin, china-doll parent argument, Brad Dourif performance, family-loss logic, Vander Holyfield punch, child file complaint, Michael comparison, Good Guy doll remake swarm, Black Friday murder pitch, human Chucky transformation, Stretch Armstrong, Chuck E. M. Banes, Criss Angel-style body horror, eye gag, coffee detour, Mason greeting, Michelle hair-flip receipt, abrupt movie ending, flute, two-week preparation, and dark-night sign-off",
    evidence: Object.freeze({ duration: 1290, captionWords: 1644, captionEvents: 661, captionSpanSeconds: 1236.92, captionDurationCoveragePercent: 96, captionSha256: "E9666DB6279ACC4831A5CA47EDBCEC9E0CE89A2F6389EB3F9757F5FE0E12D82E", captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger", audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority", audioSha256: "861E8239101F757CF6CABD8611A3AF226399AF1633172E01CEBA7C1E9F95678D", asrSegmentCount: 304, asrSha256: "1F2D5BC9EB8FD369CFD2DF4F642CAEF10D0F2E3883718F173AFD92C16FBB6B89", asrCoverageStartSeconds: 40, asrCoverageEndSeconds: 1229.8, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "CHILD'S PLAY 2 // HERE'S WHAT HAPPENED NEXT",
    badge: "SHORT FOLLOW-UP WIKI // CHRIS BUCCI, CHINA-DOLL PARENTING, GOOD GUY ARMORY, AND THE TWO-WEEK DARK NIGHT",
    headline: "CHUCKY'S SECOND MOVIE GETS A GOOD GUY ARMORY PITCH",
    deck: "A full-audio WWAM short on Child's Play 2: a volume war, the two-family problem, a remake full of escaped dolls, and a transformation nobody wants to pause.",
    overview: "This 21-minute Child's Play 2 follow-up starts with Chris Bucci in the room, a volume setup that refuses to behave, and the sucking, fucking, touching cue being rebuilt in public. The hosts admit the franchise is a long road: the first movie works, the second is not bad, the third can bore you, and the later entries need preparation. Chucky's pink lips, a sweater pin, and an adult repairing a china doll turn into an argument about parenting an adopted child after a doll has already murdered two families. The booth treats Chucky getting punched like a Vander Holyfield upset, then pitches a remake where every Good Guy doll breaks out of its package and turns Black Friday into a murder spree. A human Chucky transformation becomes Stretch Armstrong, Chuck E. M. Banes, ripping sounds, two dicks in the eye, and a coffee detour. The movie ends abruptly, a flute appears, and the next full commentary is declared a dark night requiring two weeks of preparation. No speaker is assigned to any line; local audio and ASR establish bounded routes, with playback remaining the authority.",
    topics: Object.freeze(["Child's Play 2", "Chucky", "Good Guy dolls", "Brad Dourif", "Andy Barclay", "Black Friday", "Vander Holyfield", "Chris Bucci"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 520, end: 760, label: "THE TWO-FAMILY PROBLEM", topic: "Child safety logic", body: "Play the family-loss and Vander Holyfield stretch for the sharpest argument in the short: the adults keep handing the child back to the same killer doll.", playAt: 520, playEnd: 760 }),
      hated: Object.freeze({ at: 940, end: 1120, label: "THE HUMAN CHUCKY TRANSFORMATION", topic: "Body horror", body: "Play the transformation and eye-gag stretch for the moment the room stops wanting a pause button and starts blaming the other host's coffee intake.", playAt: 940, playEnd: 1120 }),
      wildestDetour: Object.freeze({ at: 760, end: 940, label: "THE GOOD GUY DOLL ARMORY", topic: "Remake pitch", body: "Play the escaped-doll and Black Friday pitch for the cleanest what-if in the follow-up.", playAt: 760, playEnd: 940 }),
      lastWord: Object.freeze({ at: 1120, end: 1290, label: "THE TWO-WEEK DARK NIGHT", topic: "Next tape", body: "Play the close for the flute, the illegal-mail joke, and the warning that the next commentary needs serious preparation.", playAt: 1120, playEnd: 1290 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        Object.freeze({ at: 69, end: 75, displayName: "Chris Bucci", interactionType: "WATCHALONG GREETING", excerpt: "The hosts acknowledge Chris Bucci as part of the room watching Child's Play 2.", evidenceState: "source-local audio + caption-confirmed name readout" }),
        Object.freeze({ at: 272, end: 277, displayName: "Walden Chris", interactionType: "CHAT READOUT", excerpt: "Walden Chris is acknowledged during the volume and Chucky setup.", evidenceState: "source-local audio + caption-confirmed name readout" }),
        Object.freeze({ at: 2865, end: 2870, displayName: "Mason", interactionType: "CHAT READOUT", excerpt: "Mason is greeted when the beer and Jason Bateman hair tangent begins.", evidenceState: "source-local audio + caption-confirmed name readout" }),
        Object.freeze({ at: 2917, end: 2920, displayName: "Michelle", interactionType: "SUPER CHAT", excerpt: "Michelle sends five dollars for the hair-flip request during the drink tangent.", evidenceState: "source-local audio + caption-confirmed donation readout" })
      ]),
      note: "Four named community receipts are promoted because the names and interactions are audible. No broader donor status is inferred from this short follow-up."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
