(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "_PiftDXSf8k";
  var duration = 4701;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 620, "OPENING FILE", "THE MAFIA MOUNT RUSHMORE STREAM OPENS WITH AUDIO PROBLEMS, CHEESE JOKES, AND A HITMAN WHO MAY OR MAY NOT BELONG", "The April 10 room fights a mute TV, an unplugged headphone, and a burst of dad jokes before Courtney asks whether Anton Chigurh counts as Mafia. The production mess sets up a debate that will be surprisingly disciplined about complete stories versus iconic characters."),
    H(620, 1250, "GOODFELLAS VS GODFATHER II", "GOODFELLAS WINS THE FIRST BALLOT BECAUSE IT IS A COMPLETE STORY THAT DOES NOT REQUIRE A TRILOGY", "The hosts land on Goodfellas over The Godfather Part II by a narrow logic: Godfather II may be the greater film, but Goodfellas contains its whole arc in one electric package while the Corleone story asks you to bring the first and third movies along."),
    H(1250, 1850, "GODFATHER II", "VITO'S RISE, MICHAEL'S FALL, AND ROBERT DE NIRO SHARING A MOVIE WITH AL PACINO MAKE THE SECOND GODFATHER IMMUNE TO A CASUAL CUT", "The room defends Godfather II's dual timeline, Fredo betrayal, old Italy, and the impossible power of De Niro and Pacino occupying the same film without sharing a scene."),
    H(1850, 2450, "CASINO", "CASINO EARNS A MOUNTAINTOP SLOT BECAUSE NICKY IS TERRIFYING AND THREE HOURS DISAPPEAR BEFORE THE AUDIENCE NOTICES", "Casino becomes the third pick for its brutal character work, Sharon Stone, Joe Pesci, Robert De Niro, and a length that feels short because the movie keeps building its backstories instead of coasting on gangster poses."),
    H(2450, 3050, "SCARFACE", "TONY MONTANA'S RISE, CHAINSAW SCENE, AND SHARON STONE ALMOST KNOCK THE FOURTH PICK OUT OF THE MOUNTAIN", "Scarface is the emotional lock: a one-man ascent from the bottom, the cocaine-fueled chainsaw scene, Sosa, the bathtub, and a performance the hosts can rewind six times. American Gangster gets respect but not the slot."),
    H(3050, 3600, "THE DEPARTED", "THE DEPARTED COMES WITHIN INCHES OF THE RUSHMORE, THEN HENRY HILL'S GUN WALK SETTLES THE ROOM", "The hosts revisit The Departed's pistol-beating scene and the moment Henry turns toward the tennis player. It is almost a pick, but the final shared list stays with the more mythic four."),
    H(3600, 4150, "FINAL BALLOT", "THE GODFATHER IS REMOVED FROM THE LIST, THEN THE ROOM REBUILDS THE SAME FOUR WITH GOODFELLAS, GODFATHER II, SCARFACE, AND CASINO", "A messy ranking argument becomes a clear canon artifact. The hosts end on a shared quartet, disagreeing about order but agreeing that each film supplies a different kind of mafia memory."),
    H(4150, 4450, "DEEP CUTS", "THIEF, ROBERT DUVALL, AND ONCE UPON A TIME IN AMERICA ARE THE FILMS THAT MAKE THE LIST FEEL LESS OBVIOUS", "James Caan's Thief gets a late push, Robert Duvall gets his due, and Once Upon a Time in America remains the chat's favorite rejected heavyweight. The archive keeps the near-misses so the Mount Rushmore does not look inevitable."),
    H(4450, 4701, "CLOSING FILE", "THE TIGER KING BIT, MERCH STORE CHAOS, AND A DEPARTED NEAR-MISS CLOSE THE MAFIA DEBATE", "The stream exits through Carole Baskin jokes, merchandise confusion, and one last defense of The Departed. The point of the episode is not a universal answer; it is the logic behind four very personal monuments."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 620, label: "THE MOUNTAIN OPENS WITH A MUTE TV AND A HITMAN QUESTION", body: "Before the films arrive, the room has to solve its audio setup and explain what kind of Mount Rushmore this is. Anton Chigurh becomes the first test: iconic killer is not automatically Mafia, and the answer needs a story, not just a cool coat.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 620, end: 1250, label: "GOODFELLAS BEATS GODFATHER II BY BEING SELF-CONTAINED", body: "The hosts call Godfather II arguably the greater movie, then choose Goodfellas because its rise, fall, and complete setting do not require the rest of a trilogy to finish the emotional arc. This is the episode's most useful decision rule.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1250, end: 1850, label: "GODFATHER II STAYS BECAUSE THE CORLEONE STORY IS TOO POWERFUL TO CUT", body: "Vito's rise, Michael's betrayal, Fredo, old Italy, and the De Niro/Pacino parallel make the second Godfather a permanent contender. The room can joke about the third film without pretending the middle chapter loses its force.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1850, end: 2450, label: "CASINO TURNS THREE HOURS INTO A BACKGROUND CHARACTER", body: "Casino earns a slot through performance, brutality, and lived-in backstory. Nicky is frightening, Sharon Stone is unforgettable, and the film's length disappears because the room is still watching the characters change while the violence escalates.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 2450, end: 3050, label: "SCARFACE IS THE EMOTIONAL LOCK AND THE CHAT'S FAVORITE REWIND", body: "Tony Montana's ascent, the chainsaw scene, Sosa, the bathtub, and the hosts' repeated favorite moments make Scarface more than a default answer. American Gangster is praised, but not allowed to replace the film that shaped the room's vocabulary.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3050, end: 3600, label: "THE DEPARTED NEARLY MAKES IT ON SCENES ALONE", body: "The pistol-beating sequence and Henry Hill's walk toward the tennis player give The Departed a late charge. It misses the shared quartet, but the dossier keeps the near-miss because it explains how a Rushmore can change in the final five minutes.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3600, end: 4150, label: "THE FINAL FOUR ARE A CONSENSUS, NOT A RANKING ALGORITHM", body: "The Godfather is briefly removed, then the room rebuilds the same four: Goodfellas, Godfather II, Scarface, and Casino. The order is personal; the reasoning is the actual canon record.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 4150, end: 4450, label: "THIEF AND ROBERT DUVALL KEEP THE ARCHIVE HONEST", body: "James Caan's Thief, Robert Duvall, and Once Upon a Time in America prevent the final list from looking obvious in retrospect. The show preserves respected near-misses instead of flattening the debate into a top-four graphic.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 4450, end: 4701, label: "THE MOUNTAIN CLOSES WITH MERCH, TIGER KING, AND A LAST DEPARTED DEFENSE", body: "The final minutes are mostly callback comedy and merchandise confusion, but the archive's answer remains firm: four monuments, several painful omissions, and a community debate that is more useful than pretending one list is objective.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-tape editorial read; canonical local audio aligned against the source-local caption ledger across the production opening, Anton Chigurh eligibility, Goodfellas versus Godfather II, Vito/Michael parallel, Casino, Scarface, American Gangster, The Departed near-miss, final shared four, Thief/Robert Duvall/Once Upon a Time in America deep cuts, and merch/Tiger King close",
    evidence: Object.freeze({ duration: duration, captionWords: 15215, captionEvents: 3909, captionSpanSeconds: 4702.51, captionDurationCoveragePercent: 100.0, captionSha256: "0B901626DC58C8772BF2BC713368258BD055B85059C2CAA187FC7105DAA3554C", captionSourceKind: "source-local canonical speech-to-text caption ledger", audioPass: "canonical local source audio + caption alignment; local Whisper alignment retained for playback verification; playback remains the authority", audioSha256: "EB9B17BB20DAB8B41895F65E595A6A054708E057035EAB1FF1AD65B337606403", asrWindowCount: 1, asrSegmentCount: 362, asrSha256: "3AAD842B04D07A74109A23EA965EE22FAB144FFE792C0499FC01F1211056EB81", speakerAttribution: false, visualOutcomeInferred: false }),
    label: "LIVE DEBATE // MAFIA FILM MOUNT RUSHMORE",
    badge: "FULL SHOW WIKI // GOODFELLAS, GODFATHER II, SCARFACE, CASINO, AND THE NEAR-MISSES",
    headline: "FOUR MOVIES ON THE MOUNTAIN, THREE HOURS OF ARGUMENT, ZERO OBJECTIVE ANSWERS",
    deck: "A 78-minute canon debate that turns a personal Mount Rushmore into a usable record of why Goodfellas, Godfather II, Scarface, and Casino survived the room's final ballot.",
    overview: "The April 10, 2020 Mafia Film Mount Rushmore stream is the WWAM archive's cleanest example of a community debate becoming a canon artifact. It starts with audio problems, a wall of dad jokes, and Courtney asking whether Anton Chigurh counts as Mafia. That first question establishes the rules: iconic hitman is not automatically a mafia movie, and the list needs complete stories, memorable characters, and the kind of emotional residue that survives a rewatch. Goodfellas beats The Godfather Part II by a narrow but useful logic. Godfather II may be the greater film, but Goodfellas contains its whole rise-and-fall story in one complete setting; the Corleone arc asks you to bring the first and third films along. The hosts then defend Godfather II's dual timeline, Vito's rise, Michael's betrayal, Fredo, old Italy, and the strange power of Robert De Niro and Al Pacino occupying the same movie without sharing a scene. Casino earns the third slot through Nicky's brutality, Sharon Stone, De Niro, Joe Pesci, and a three-hour runtime that disappears because the backstory keeps moving. Scarface is the emotional lock: Tony Montana's ascent, the chainsaw scene, Sosa, the bathtub, and the hosts' ability to rewind favorite moments until the tape itself becomes part of the memory. American Gangster gets respect but not a place. The Departed nearly makes it on the strength of the pistol-beating scene and Henry Hill's walk toward the tennis player. James Caan's Thief, Robert Duvall, and Once Upon a Time in America keep the near-miss shelf honest. The final shared four are Goodfellas, Godfather II, Scarface, and Casino, though the hosts disagree about order. That disagreement is not a flaw; it is the point. The archive keeps the decision rule, the emotional reasons, and the rejected heavyweights so future fans can argue with the actual tape instead of a generic top-four graphic.",
    topics: Object.freeze(["Goodfellas", "The Godfather Part II", "The Godfather", "Casino", "Scarface", "The Departed", "American Gangster", "Thief", "Once Upon a Time in America", "Anton Chigurh", "Mafia films", "FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 620, end: 1250, label: "GOODFELLAS WINS BY BEING COMPLETE", topic: "Mount Rushmore rule", body: "Play from 10:20. The room chooses the complete story over the film that needs a trilogy to finish its emotional arc.", playAt: 620, playEnd: 1250 }),
      hated: Object.freeze({ at: 3050, end: 3600, label: "THE DEPARTED NEAR-MISS", topic: "Rejected heavyweight", body: "Play from 50:50. A pistol beating and a Henry Hill walk nearly change the final four, but not quite.", playAt: 3050, playEnd: 3600 }),
      wildestDetour: Object.freeze({ at: 2450, end: 3050, label: "SCARFACE, SHARON STONE, AND THE BATHTUB REWIND", topic: "Scarface memory", body: "Play from 40:50. Tony Montana's rise and the scenes the hosts rewind until the joke becomes a ritual make Scarface the emotional lock.", playAt: 2450, playEnd: 3050 }),
      lastWord: Object.freeze({ at: 3600, end: 4150, label: "THE FINAL FOUR ARE A CONSENSUS, NOT A LAW", topic: "Canon result", body: "Play from 1:00:00. Goodfellas, Godfather II, Scarface, and Casino survive the same ballot even while the order stays personal.", playAt: 3600, playEnd: 4150 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(60, 140, "Isabel", "OPENING ROLL CALL", "Isabel is welcomed as the stream comes online."),
        F(80, 160, "Jessica", "OPENING ROLL CALL", "Jessica is named in the first audience cluster."),
        F(100, 180, "Sean Tobey", "OPENING ROLL CALL", "Sean is welcomed before the Mafia debate starts."),
        F(125, 205, "Orlando", "OPENING ROLL CALL", "Orlando is included in the opening room."),
        F(145, 225, "Nicole the Bat Queen", "OPENING ROLL CALL", "Nicole is welcomed by her Bat Queen name."),
        F(175, 255, "Jonathan", "OPENING ROLL CALL", "Jonathan is named in the stream roll call."),
        F(205, 285, "Drew", "OPENING ROLL CALL", "Drew is welcomed as the setup settles."),
        F(260, 370, "Courtney Reed", "ELIGIBILITY QUESTION", "Courtney asks whether Get Carter and Anton Chigurh count as Mafia."),
        F(700, 820, "Isabel", "FAM SUPPORT", "Isabel is thanked for showing up despite an early morning."),
        F(930, 1050, "StreamCast viewers", "DONATION NOTE", "The hosts explain that Super Chat is optional and point to a second support route without pressure."),
        F(1250, 1370, "Tony", "SOPRANOS QUESTION", "Tony's message opens the discussion of The Sopranos as a TV Mount Rushmore problem."),
        F(2380, 2500, "Britney Bush", "FAM SUPPORT", "Britney asks the room to greet Rovenary Reed."),
        F(2440, 2560, "Rovenary Reed", "FAM GREETING", "Rovenary is welcomed as a horror and Michael Myers fan."),
        F(2520, 2650, "The Merkins", "PINHEAD CALLBACK", "The Merkins tease J about his Pinhead crush."),
        F(3020, 3160, "Nadia", "FAN ART", "Nadia's fan-art message is acknowledged during the late unboxing lane."),
        F(3330, 3450, "Tomo", "FAM SUPPORT", "Tomo is thanked during the package and poster discussion."),
        F(3650, 3770, "Jack Harris", "DEPARTED DEEP CUT", "Jack's The Departed suggestion is named as a serious near-miss."),
        F(4100, 4220, "James Caan fans", "THIEF DEEP CUT", "The chat's James Caan push gives Thief a late place in the archive."),
        F(4300, 4420, "Robert Duvall fans", "DEEP CUT", "Robert Duvall's Godfather work is praised by the room."),
        F(4520, 4701, "Brent", "MOUNT RUSHMORE DISAGREEMENT", "Brent rejects the list, then gets invited to the birthday party anyway."),
      ]),
      note: "Twenty source-local FAM, eligibility, support, deep-cut, and merchandise receipts are carried into this dossier. Names and interaction types are caption evidence; donation amounts, speaker attribution beyond the visible chat context, and visual outcomes remain unclaimed. The four-film result is recorded as the hosts' shared ballot, not an objective ranking."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
