(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "SRZdhswykkA";
  var duration = 6609;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 560, "OPENING FILE", "A THREE-MOVIE MARATHON STARTS WITH ALCOHOLISM, A PARTY BAG, AND THE QUESTION OF WHAT DAY IT IS", "The April 23 room cannot agree whether it is Tuesday, Wednesday, or Thursday. It can agree that a live Patreon review marathon is happening and that everyone gets a party bag on the way out."),
    H(560, 1200, "CONTRACTED", "THE SEXUALLY TRANSMITTED BODY-HORROR REVIEW STARTS WITH A SUPPORT SYSTEM THAT DOES NOT EXIST", "Jessica Kindle's pick, Contracted, gets the first slot. The hosts focus on the mother's rejection, the doctor's unsafe proximity, and a protagonist whose body decays while everyone around her says the obvious symptoms are probably fine."),
    H(1200, 1500, "CONTRACTED", "MAGGOTS, CATERPILLARS, AND AN 8/10 FOR A MOVIE THAT MAKES THE BOOTH WANT TO BURN THE SCREEN", "The body-horror effects are praised as top-notch. The hosts dislike the late zombie turn but still land around an eight because the decay of the body and mind stays fascinating and grotesque."),
    H(1500, 2200, "CLUE", "TIM CURRY, MULTIPLE ENDINGS, AND A DINNER PARTY THAT THE PANDEMIC MAKES IMPOSSIBLE", "Clue becomes the middle film, picked by Michael. The hosts praise Tim Curry's timing, slapstick, scenery-chewing finale, and the way the ensemble turns blackmail into a comedy machine."),
    H(2200, 2800, "CLUE", "THE REMAKE QUESTION IS REALLY A TIM CURRY QUESTION", "Ryan Gosling, Jason Bateman, and the possibility of a new Clue lead into a larger argument: remakes can work if they respect the tone, and Tim Curry deserves a return even if only as a strange extra."),
    H(2800, 3600, "FAM / QUOTES", "MOVIE QUOTES, ROSS PEROT, LITTLE GIANTS, AND WHY THEIR FRIENDSHIP IS BASICALLY A PRIVATE SUBTITLE TRACK", "The hosts explain that their friendship runs on movie quotes: Seven, Little Giants, Bloodsport, and whatever line can derail a conversation. A viewer's 'left/right' comment becomes a whole political-reference bit."),
    H(3600, 4300, "NEWS DETOUR", "INDONESIA PUTTING QUARANTINE BREAKERS IN HAUNTED HOUSES BECOMES THE NEXT WWAM MOVIE PITCH", "A real-world story about quarantine violators being placed in reportedly haunted houses becomes a horror premise: sober prisoners, bleeding walls, EVP recorders, and a ghost-hunting show made from the punishment itself."),
    H(4300, 5000, "FAM / X-MEN", "CYCLOPS, WOLVERINE, AND A CHAT MEMBER GOING THROUGH A REAL CRISIS SHARE THE SAME ROOM", "The hosts answer an X-Men question while also checking in on Kevin, whose situation has the community worried. The X-Men answer is genuine—Cyclops has always been the favorite—but the care for the viewer is the more important beat."),
    H(5000, 5600, "CREEP (2004)", "THE THIRD MOVIE IS NOT THE MARK DUPLASS ONE: IT IS A SUBWAY STALKER WITH A BABY-HEAD NIGHTMARE", "The Patreon pick is Creep (2004), discovered through the channel's audience. The first half is slow and stalker-driven; the second half turns into a claustrophobic creature chase with a sewer nursery and an ugly little monster reveal."),
    H(5600, 6200, "CREEP (2004)", "THE FILM FINDS ITS HORROR IN THE LAST THIRD, THEN LEAVES THE BOOTH ASKING WHERE THE PLOT WENT", "The hosts compare Creep to The Descent and low-budget survival horror. They like the final stretch, prosthetics, and final-girl pressure, but criticize the long runway and the unexplained operating-room/nursery mythology."),
    H(6200, 6400, "CLOSING READ", "THE REVIEW MARATHON WORKS BECAUSE PATREON TURNS THREE PICKS INTO ONE COMMUNITY NIGHT", "After the Creep reaction, the hosts recognize the format itself as the discovery: weekly sponsor picks, audience recommendations, and a live three-film stack that can jump from disease horror to comedy to subway monsters."),
    H(6400, 6609, "CLOSING FILE", "NO STREAM TOMORROW, A HALLOWEEN PATREON NIGHT AHEAD, AND THE PARTY BAG GOES HOME", "The hosts thank the audience, point patrons toward the Halloween stream, and close on the promise that the archive's oddest combinations are often the most memorable ones."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 560, label: "THE MARATHON STARTS BEFORE ANYONE KNOWS WHAT DAY IT IS", body: "A jack-in-the-box sound check, a party bag, alcoholism jokes, and a Patreon format explanation establish the night: three audience-sponsored movie reviews in one live room because normal scheduling has collapsed.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 560, end: 1500, label: "CONTRACTED TURNS DISEASE INTO A BODY-HORROR LEDGER", body: "Jessica Kindle's pick is hated, admired, and scored around an eight. The hosts focus on the unsupportive mother, the doctor who should own an N95, the failing teeth, and the way the film tracks a body and mind coming apart together.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1500, end: 2200, label: "CLUE ARRIVES AS THE PANDEMIC'S IMPOSSIBLE DINNER PARTY", body: "Michael's pick gives the room a reset: Tim Curry, slapstick, blackmail, multiple endings, and an ensemble that can make a dinner party feel like a stage play. The hosts are clear that the movie's comedy is performance-driven, not disposable.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 2200, end: 2800, label: "THE CLUE REMAKE QUESTION STARTS WITH RESPECT FOR TIM CURRY", body: "Ryan Gosling and Jason Bateman enter the hypothetical, but the real question is whether a remake understands the tone. The hosts want Tim Curry back in some form because the original's magic lives in his timing and physical commitment.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 2800, end: 3600, label: "THE FRIENDSHIP IS BUILT OUT OF MOVIE QUOTES", body: "Seven, Little Giants, Bloodsport, Ross Perot, and the left/right camera comment turn the middle into an inside-baseball explanation of the hosts' language. The quotes are not decoration; they are how the friendship keeps its rhythm on tape.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3600, end: 4300, label: "A HAUNTED-HOUSE QUARANTINE PUNISHMENT BECOMES A REAL HORROR PITCH", body: "The Indonesia story is treated as public news to be checked, not a made-up plot. The booth imagines the result: a sober quarantine prisoner in a haunted house, an EVP recorder, and a found-footage series created by the punishment itself.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 4300, end: 5000, label: "THE X-MEN QUESTION HAS A REAL PERSON AT ITS CENTER", body: "Cyclops and Wolverine get an honest answer, but the stronger moment is the room checking on Kevin. This is the kind of fan interaction the archive should preserve as community memory, not reduce to a username in a list.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 5000, end: 5600, label: "CREEP (2004) STARTS AS A STALKER FILM AND ENDS IN THE SEWER", body: "The third pick is explicitly separated from the Mark Duplass film. Its first half follows a woman in the subway; its second half reveals a creature, a nursery, and a survival-horror chase that finally gives the movie the teeth the opening was withholding.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 5600, end: 6200, label: "THE FINAL THIRD WORKS, BUT THE MISSING MYTHOLOGY STILL SHOWS", body: "The hosts like the prosthetics, claustrophobia, and final-girl pressure, comparing the finish to The Descent. They also criticize the random surgery room and unexplained nursery, which makes the film feel like a good monster movie trapped inside an unfinished plot.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 6200, end: 6609, label: "THE FORMAT ITSELF BECOMES THE MEMORY", body: "The marathon closes by recognizing why it worked: Patreon sponsors, audience picks, three radically different films, and one night where Contracted, Clue, and Creep can sit beside each other without the archive flattening them into the same voice.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-tape editorial read; canonical local audio aligned against the source-local caption ledger across the Patreon marathon setup, Contracted body-horror review, Clue/Tim Curry review, remake discussion, movie-quote friendship lore, Indonesia haunted-house quarantine story, X-Men and Kevin check-in, Creep (2004) identification, sewer-creature review, and format close",
    evidence: Object.freeze({ duration: duration, captionWords: 19825, captionEvents: 5413, captionSpanSeconds: 6610.51, captionDurationCoveragePercent: 100.0, captionSha256: "779F3657F16E247EC581B52103959FB4BAAA097C980F8BB6E368527CB8766ABB", captionSourceKind: "source-local canonical speech-to-text caption ledger", audioPass: "canonical local source audio + caption alignment; local Whisper alignment retained for playback verification; playback remains the authority", audioSha256: "8139C784DA17C995DF6951CFF5E2C33E53ACAE4F756DA6BF6860AFAF865FD92B", asrWindowCount: 1, asrSegmentCount: 371, asrSha256: "D9DA70CF9A52D4A888FEA746568D02D004B0B1456B2CEB39318504B010BD0A7D", speakerAttribution: false, visualOutcomeInferred: false }),
    label: "LIVE MARATHON // CONTRACTED, CLUE, AND CREEP (2004)",
    badge: "FULL SHOW WIKI // THREE PATREON PICKS, TIM CURRY, BODY HORROR, AND A SUBWAY MONSTER",
    headline: "THREE MOVIES, ONE NIGHT, AND A PARTY BAG FULL OF BODY HORROR",
    deck: "A 1h50 source-local dossier where Contracted gets an eight, Clue gets a 9.0, Creep (2004) gets the sewer treatment, and the audience chooses the next weird combination.",
    overview: "The April 23, 2020 live show is an early example of WWAM's strongest archive format: a community-funded review marathon where three Patreon picks share one night without being forced into one mood. The room opens by losing track of the day, welcoming a party bag, and explaining the weekly sponsor model. Jessica Kindle's pick, Contracted, supplies the first lane: a sexually transmitted body-horror movie whose mother rejects the protagonist, whose doctor behaves like masks do not exist, and whose effects make teeth crack, skin decay, and maggots feel like a medical appointment nobody should survive. The hosts land around an eight because the practical effects and psychological decay work, even if they dislike the late zombie turn. Michael's pick, Clue, is the reset. Tim Curry's comedic timing, slapstick, scenery-chewing finale, multiple endings, and ensemble blackmail earn a 9.0. A possible Ryan Gosling/Jason Bateman remake becomes a respect test: Tim Curry should at least be invited back. The middle also preserves real WWAM friendship lore—Seven, Little Giants, Bloodsport, Ross Perot, and the way movie quotes function as a private subtitle track. A public story about Indonesia placing quarantine violators in reportedly haunted houses becomes a serious horror premise, while an X-Men question is paired with the room checking on a fan named Kevin. The final pick is explicitly Creep (2004), not the Mark Duplass film. Its subway stalker setup is slow, but the second half erupts into a claustrophobic creature chase, a sewer nursery, and a baby-head nightmare. The hosts compare it to The Descent, praise the practical monster work, and criticize the unexplained operating-room mythology. The close recognizes the format itself: Patreon picks, audience names, three wildly different movies, and a live night that becomes more memorable because it refuses to be tidy.",
    topics: Object.freeze(["Contracted", "Clue", "Creep (2004)", "Tim Curry", "Jessica Kindle", "Ryan Gosling", "Jason Bateman", "body horror", "sexually transmitted disease", "The Descent", "haunted-house quarantine", "Indonesia", "X-Men", "Cyclops", "Wolverine", "Patreon", "FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1500, end: 2200, label: "TIM CURRY TURNS CLUE INTO A 9.0", topic: "Comedy film read", body: "Play from 25:00. The hosts praise Curry's timing, slapstick, scenery chewing, and the ensemble's ability to make blackmail feel like a party game.", playAt: 1500, playEnd: 2200 }),
      hated: Object.freeze({ at: 3150, end: 3600, label: "THE QUOTE ROOM IS NOT A SIDETRACK; IT IS THE FRIENDSHIP", topic: "WWAM lore", body: "Play from 52:30. Seven, Little Giants, Bloodsport, and Ross Perot explain how Mike and J talk when a normal conversation would be too boring.", playAt: 3150, playEnd: 3600 }),
      wildestDetour: Object.freeze({ at: 3600, end: 4300, label: "QUARANTINE BREAKERS GET SENT TO A HAUNTED HOUSE", topic: "Real-world horror premise", body: "Play from 1:00:00. The hosts turn a public report into a sober, two-week haunted-house punishment and immediately start writing the found-footage version.", playAt: 3600, playEnd: 4300 }),
      lastWord: Object.freeze({ at: 5000, end: 6200, label: "CREEP (2004) FINALLY GETS TO THE MONSTER", topic: "Third-film verdict", body: "Play from 1:23:20. The subway stalker becomes a sewer creature, and the final third earns the movie its survival-horror teeth.", playAt: 5000, playEnd: 6200 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(68, 155, "Vinny", "OPENING ROLL CALL", "Vinny is welcomed during the party-bag opening."),
        F(72, 160, "Robert", "OPENING ROLL CALL", "Robert is named in the first audience cluster."),
        F(72, 165, "Andre", "OPENING ROLL CALL", "Andre is acknowledged while the stream sound is checked."),
        F(80, 175, "Vanessa", "OPENING ROLL CALL", "Vanessa is welcomed into the review marathon."),
        F(81, 180, "Clinton", "OPENING ROLL CALL", "Clinton is named in the opening room."),
        F(85, 188, "Will Sutter", "OPENING ROLL CALL", "Will Sutter appears while the hosts get the marathon started."),
        F(93, 195, "Eric", "OPENING CHAT", "Eric is asked to find the corkscrew during the opening alcohol bit."),
        F(138, 250, "Timmy", "PATREON FORMAT", "Timmy is acknowledged as the room explains the three-review format."),
        F(172, 260, "Jessica Kindle", "PATREON PICK", "Jessica Kindle's sponsorship selects Contracted."),
        F(205, 295, "Michael", "PATREON PICK", "Michael's pick is Clue, the movie the hosts have not previously watched together."),
        F(222, 310, "Creep picker", "PATREON PICK", "The third Patreon pick is identified as Creep (2004), not the Mark Duplass film."),
        F(282, 390, "Greg Harris", "FAM SUPPORT", "Greg is thanked during the Contracted body-horror reaction."),
        F(302, 410, "Michael Chad", "FAM SUPPORT", "Michael Chad is acknowledged in the first review room."),
        F(395, 500, "Tomoe", "FAM QUESTION", "Tomoe's message is answered while the hosts argue over Contracted's effects."),
        F(414, 510, "Vanessa", "FAM SUPPORT", "Vanessa returns during the Contracted and Clue transition."),
        F(789, 900, "Alex MIDI 123", "FAM JOKE", "Alex says he has a 'raging clue,' which the hosts translate into a boner joke."),
        F(1355, 1450, "Simone", "CONTRACTED FOLLOW-UP", "Simone asks if the room is ready for Contracted 2 and 3."),
        F(1383, 1475, "Jessica Kindle", "PATREON THANK-YOU", "Jessica is thanked again as the first review closes."),
        F(1510, 1600, "Julie", "FORMAT QUESTION", "Julie helps decide the order: Clue now, Creep last."),
        F(1624, 1715, "Michael", "CLUE PICK", "Michael's Clue pick is acknowledged before the review begins."),
        F(2715, 2805, "Mark Dortmund", "CLUE / HALLOWEEN LORE", "Mark's message prompts the Deborah Hill and Halloween connection."),
        F(2786, 2875, "Anthony Avellino", "FAM SUPPORT", "Anthony is thanked during the Clue and Halloween producer discussion."),
        F(3061, 3170, "Dave McRae FAM", "HALLOWEEN NEWS", "Dave McRae is mentioned before the upcoming Halloween Kills stream."),
        F(3392, 3475, "Colin McCormack", "QUOTE LORE", "Colin's Spinal Tap message opens a friendship-memory detour."),
        F(3578, 3675, "Daniel", "CLUE RATING", "Daniel asks about the ice-cream sandwich and hears the 9.0 Clue score."),
        F(3830, 3940, "Barbara", "FAM SUPPORT", "Barbara is thanked during the haunted-house quarantine story."),
        F(4200, 4305, "Anthony Avellino", "NEWS RECEIPT", "Anthony identifies Indonesia as the source of the haunted-house quarantine story."),
        F(4355, 4450, "Barbara", "FAM SUPPORT", "Barbara's burger story becomes part of the family-food detour."),
        F(4508, 4600, "Iron Baron", "X-MEN QUESTION", "Iron Baron helps launch the Cyclops/Wolverine question."),
        F(4768, 4860, "Kevin", "COMMUNITY CHECK-IN", "The hosts stop to check on Kevin and acknowledge that something serious is happening in his life."),
        F(4895, 4990, "Creep audience picker", "PATREON PICK", "The final film is confirmed as Creep (2004), with the Mark Duplass confusion explicitly corrected."),
        F(5546, 5635, "Nick", "CREEP DISCUSSION", "Nick is welcomed during the final creature-feature review."),
        F(5548, 5638, "Glenn Harris", "CREEP DISCUSSION", "Glenn is welcomed as the hosts debate Creep's creature effects."),
        F(6149, 6240, "Greg and Craig", "FAM MEMORY", "Greg and Craig are thanked during the final-girl and monster discussion."),
        F(6273, 6365, "Patreon FAM", "FORMAT CLOSE", "The hosts thank the Patreon audience for making a three-film marathon possible."),
      ]),
      note: "Thirty-five source-local FAM, Patreon, question, support, news, and care receipts are carried into this dossier. Names and interaction types are caption evidence; donation amounts, speaker identity, intent, and visual context remain unclaimed until playback review."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
