(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "C3_6Gk-cHtU";
  var duration = 378;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 75, "TRUE-STORY SETUP", "THE LOGGERS, THE ABDUCTION, AND ROBERT PATRICK'S POST-T2 SMALL-TOWN NIGHTMARE", "The hosts establish Travis Walton's true-story claim, the Arizona logging crew, and Robert Patrick's strange rebound from the T-1000 into a frightened redneck town."),
    H(75, 150, "NAPOLEON DYNAMITE WITH ALIENS", "SLOW, DEPRESSED, AND PERFECTLY SMALL-TOWN—UNTIL THE NIGHTMARE SEQUENCE OPENS THE AIRLOCK", "The film's strongest atmosphere is its quiet disbelief. The hosts compare it to Napoleon Dynamite with aliens, then admit the mood can drag before the abduction footage changes the temperature."),
    H(150, 225, "THE LUCKY CHARMS INCIDENT", "NAKED MUD CREATURES AND OPERATING-TABLE HORROR RUIN MIKE'S CEREAL", "The alien designs and medical imagery are the part that stayed with Mike as a kid. He hid under windows, speed-walked to the door at night, and could not finish a bowl of Lucky Charms after the movie's nightmare image."),
    H(225, 265, "THE LIE-DETECTOR PROBLEM", "FIVE WITNESSES PASS, ONE MAN RETURNS FIVE DAYS LATER, AND THE ROOM HAS TO PICK A THEORY", "The hosts focus on the story's unsettling factual hook: five friends see Walton disappear, no one believes them, he returns days later, and every witness passes a lie detector. Mike believes in aliens; J asks whether the group simply beat the test."),
    H(265, 325, "HORROR OR SCI-FI?", "FIRE IN THE SKY NEEDS A SCI-FI-HORROR AISLE, A CLASSIFICATION THE VIDEO STORE DOESN'T HAVE", "The room argues over horror, psychological thriller, drama, and sci-fi action. Their shared answer is that the nightmare footage makes the film sci-fi horror even if the rest of its pacing is a slow-burn small-town drama."),
    H(325, 378, "6.5 VS. 7", "A RAINY-DAY NETFLIX CHECKOUT WITH MIDDLE-OF-THE-RUN ACTORS WHO ADD UP TO SOMETHING BETTER", "Mike gives 6.5 and J gives 7. They agree the film drags and looks made for television in places, but the ensemble's mediocrity somehow combines into a decent alien-abduction movie worth a rainy-day revisit."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 75, label: "THE TRUE STORY IS THE FIRST HOOK", body: "Mike and J open by setting up Travis Walton's account: a 1970s Arizona logging crew, a missing friend, and Robert Patrick carrying the disbelief of a small town. The review also places the film in its odd career context—Patrick is fresh off the T-1000, but here he is one of the men trying to explain an impossible night to people who assume murder.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 75, end: 150, label: "THE TOWN IS QUIET ENOUGH TO FEEL WRONG", body: "The hosts like the movie's small-town atmosphere and its refusal to rush toward the ship. They compare the mood to Napoleon Dynamite with aliens: funny in its awkwardness, depressing in its quiet, and never quite sure whether anyone will believe the people at the center. That patience is also the film's danger; both hosts think it drags before the abduction material arrives.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 150, end: 225, label: "THE NIGHTMARE SEQUENCE IS WHY THE MOVIE STICKS", body: "The abduction imagery is ugly, naked, and medical rather than sleek. Mike remembers being frightened for days, hiding below windows and speed-walking back to the house after taking out the trash. The operating-table imagery ruins his Lucky Charms. The hosts' crude jokes do not erase the point: the movie's horror comes from helplessness and the body being treated like a specimen.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 225, end: 265, label: "THE LIE-DETECTOR FACTS MAKE THE STORY HARDER TO DISMISS", body: "Walton disappears in front of five coworkers, nobody believes the men who saw it, and Walton returns five days later. The witnesses pass lie-detector tests. Mike takes that as a reason to believe in aliens; J offers the less exciting possibility that the group knew how to cheat. The disagreement is playful, but it preserves the real source of the film's unease: a story that refuses to settle into a single explanation.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 265, end: 325, label: "THE GENRE BOX IS TOO SMALL", body: "The hosts argue over where a rental store would file the film. Drama captures the witness disbelief, psychological thriller captures the social pressure, and science fiction captures the ship, but the nightmare footage makes horror the most honest label. Their proposed fix is a sci-fi-horror shelf, because combining two good things should be allowed even if the imaginary video store does not have the aisle.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 325, end: 378, label: "THE ENSEMBLE IS GREATER THAN ITS PARTS", body: "Mike gives Fire in the Sky a 6.5 and J a 7. Their criticism is specific—cheesy costumes, made-for-TV texture, and stretches that drag—but the recommendation is real. The middle-of-the-run cast works together, the abduction sequence lands, and the film becomes a rainy-day Netflix checkout for anyone who likes alien stories. The closing prompt asks the FAM for its favorite abduction movie.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the full 6m18s Fire in the Sky review; local audio and caption evidence was checked across Travis Walton's true-story setup, the Arizona logging crew, Robert Patrick's post-T2 context, the Napoleon-Dynamite-with-aliens comparison, small-town disbelief, the nightmare abduction sequence, Lucky Charms, the lie-detector problem, sci-fi-horror classification, the 6.5-versus-7 split, rainy-day recommendation, and the favorite-abduction-movie prompt",
    evidence: Object.freeze({ duration: 378, captionWords: 1463, captionEvents: 394, captionSpanSeconds: 379.95, captionDurationCoveragePercent: 100.52, captionSha256: "A0D3E3DBD8CB518266E7BD85E70C1549178A969BA868F970696B741AD0680D4D", captionSourceKind: "source-local canonical YouTube automatic-caption ledger acquired as edge json3", audioPass: "canonical local source audio + source-local caption alignment; playback remains the authority", audioSha256: "944BD66CAFA2884AE287961E71BD70C5F8D6520EE136C8CFF99BDCF3D4E2E571", asrSegmentCount: 0, asrSha256: null, asrCoverageStartSeconds: null, asrCoverageEndSeconds: null, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "REVIEW FILE // FIRE IN THE SKY",
    badge: "FULL SHOW WIKI // TRAVIS WALTON, LUCKY CHARMS, AND THE SCI-FI-HORROR AISLE",
    headline: "FIRE IN THE SKY: THE ALIEN MOVIE THAT RUINED MIKE'S CEREAL",
    deck: "A source-grounded alien-abduction dossier: a true-story setup, a quiet Arizona town, a nightmare medical sequence, five witnesses who pass a lie detector, a sci-fi-horror classification fight, and a rainy-day 6.5/7 recommendation.",
    overview: "Mike and J review Fire in the Sky as a true-story alien movie that works best when it stays small, quiet, and uncomfortable. The film follows a 1970s Arizona logging crew after Travis Walton disappears in front of his coworkers. Robert Patrick plays one of the men left behind, a strange post-T2 career turn that the hosts cannot resist pointing out. The movie's first half is about disbelief. Nobody trusts the loggers, the town assumes murder, and the atmosphere is so subdued that the hosts compare it to Napoleon Dynamite with aliens: awkward, funny in its depression, and slow enough to test the viewer's patience. The abduction sequence changes the temperature. The creatures are naked, muddy, and medical rather than sleek, and the operating-table imagery is the reason Mike remembers the film from childhood. He hid under windows, speed-walked back to the house after taking out the trash, and could not finish his Lucky Charms after the scene. The crude booth jokes sit beside a real editorial point: the horror comes from helplessness and the body being treated like a specimen. The factual hook keeps the story from becoming a simple monster movie. Five coworkers see Walton vanish, everyone assumes the men are lying, Walton returns five days later, and the witnesses pass lie-detector tests. Mike treats that as evidence for aliens; J asks whether the group knew how to beat the test. They then argue over the genre shelf. Drama fits the social fallout, thriller fits the pressure, science fiction fits the ship, and horror fits the nightmare footage. Their proposed answer is a sci-fi-horror aisle. The final score splits 6.5 and 7. The hosts criticize the cheap costumes, made-for-TV texture, and stretches that drag, but still recommend it as a rainy-day Netflix watch for anyone interested in abduction stories. The page should preserve that balance. Fire in the Sky is not a effects showcase; it is a memory trap, a story about not being believed that becomes frightening precisely because the film waits before showing what happened.",
    topics: Object.freeze(["Fire in the Sky", "Travis Walton", "Robert Patrick", "alien abduction", "true story", "sci-fi horror", "Arizona", "lie detector", "Netflix checkout", "WWAM FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 150, end: 225, label: "LUCKY CHARMS NIGHTMARE", topic: "Abduction sequence", body: "Play from 2:30. The medical imagery explains why Mike still speed-walks to the door after taking out the trash.", playAt: 150, playEnd: 225 }),
      hated: Object.freeze({ at: 75, end: 150, label: "NAPOLEON DYNAMITE WITH ALIENS", topic: "Pacing", body: "Play from 1:15. The small-town mood is perfect and depressing, but the room admits the movie drags before the ship arrives.", playAt: 75, playEnd: 150 }),
      wildestDetour: Object.freeze({ at: 225, end: 265, label: "LIE-DETECTOR THEORY", topic: "True story", body: "Play from 3:45. Five witnesses pass, one man returns, and the booth has to choose between aliens and a very good con.", playAt: 225, playEnd: 265 }),
      lastWord: Object.freeze({ at: 325, end: 378, label: "6.5 VS. 7", topic: "Final verdict", body: "Play the close for the rainy-day recommendation and favorite-abduction-movie prompt.", playAt: 325, playEnd: 378 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(5, 45, "THE FAM", "ALIENS IN THE BUTT", "The review begins with an immediate abduction threat."),
        F(20, 70, "THE FAM", "TRAVIS WALTON", "The true-story source gets a quick setup."),
        F(45, 95, "THE FAM", "ROBERT PATRICK", "The T-1000 lands in a 1970s Arizona logging town."),
        F(75, 140, "THE FAM", "NAPOLEON DYNAMITE WITH ALIENS", "The town is awkward, funny, and quietly depressing."),
        F(145, 195, "THE FAM", "CHILDHOOD FEAR", "The movie makes Mike hide under windows for two days."),
        F(165, 220, "THE FAM", "LUCKY CHARMS", "The operating-table scene destroys the cereal break."),
        F(205, 245, "THE FAM", "FIVE WITNESSES", "The story's lie-detector problem arrives."),
        F(225, 265, "THE FAM", "ALIENS OR A CON", "Mike believes; J asks who beat the test."),
        F(265, 315, "THE FAM", "SCI-FI-HORROR AISLE", "The imaginary rental store needs a better genre shelf."),
        F(275, 325, "THE FAM", "CHEESY COSTUMES", "The low budget leaks through the logger wardrobe."),
        F(315, 355, "THE FAM", "MIDDLE-OF-THE-RUN AVENGERS", "Five average actors combine into a decent ensemble."),
        F(325, 370, "THE FAM", "6.5 VS. 7", "The score split keeps the affection and the caveats."),
        F(335, 378, "THE FAM", "RAINY-DAY NETFLIX", "A slow-burn alien checkout for the right viewer."),
        F(345, 378, "THE FAM", "FAVORITE ABDUCTION MOVIE", "The close asks fans for their own nightmare."),
        F(360, 378, "THE FAM", "CLASSROOM SIGN-OFF", "The review ends like a strange alien lecture.")
      ]),
      note: "Fifteen source-local audience receipts are retained. No supporter identity or donation claim is present; the community lane is the sci-fi-horror classification debate and the closing abduction-movie prompt."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
