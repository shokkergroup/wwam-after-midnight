(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "Bndzpde-ZZQ", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* January 31, 2025: full second read of the 1:35:44 emergency Stu Lives room. */
  sources["Bndzpde-ZZQ"] = Object.freeze({
    sourceId: "Bndzpde-ZZQ",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; caption-ledger pass across the full January 31 Stu Lives room with audio-backed doors",
    evidence: Object.freeze({
      duration: 5744,
      captionWords: 18248,
      captionEvents: 2451,
      captionSpanSeconds: 5745.44,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:130ed6c89b2d0c817ef0c15eb1898e55d0601eaa0c4f997d378079bf1d79162b",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:201a6db76e0ccb6212da22fec70a6fb6098cf7f5365b049867a72d0c5eae264b",
      asrWindowCount: 205,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // JANUARY 31, 2025",
    badge: "FULL SHOW WIKI // 1:35:44 OF STU LIVES, NEW NIGHTMARE SCREAM, CULT THEORIES, FAN POLLS, AND THE COMEBACK KINGS",
    headline: "STU LIVES TURNS ONE CASTING ANNOUNCEMENT INTO A 96-MINUTE CONSPIRACY BOARD",
    deck: "An emergency stream, a broken microphone, a cult theory, Roman's fake-death lesson, and a FAM poll that crowns canon Stu Lives.",
    overview: "January 31 is the purest example of a WWAM emergency room becoming a full piece of lore. The stream is assembled on the fly after the hosts finish an Alien: Romulus commentary, the microphone refuses to cooperate, and the channel has already used its daily notification allowance. Once the Scream 7 news is on screen, the room never really leaves it. The central theory is that Stu Macher's death was faked with help from his wealthy parents and a sheriff who owed the family a favor; the dream version is a cult, the best version is a New Nightmare-style Scream where the actors play themselves, and the most dangerous version is both at once. The room keeps testing the theory against continuity: Dewey's death, Mindy and Chad's casting, Roman's established ability to fake his own death, Kevin Williamson directing instead of writing, and the possibility that the first eighty percent of the movie confirms Stu is dead before the last ten minutes flips the board. Fan traffic is not decoration here. Polls decide which route feels most likely, Lee \"The Machine\" Bowers gets called a prince, and the FAM keeps adding opening-kill ideas, new Ghostface candidates, and the ultimate question: who would be the killer in a New Nightmare Scream? The last stretch becomes a celebration rather than a recap. The room realizes the franchise might be entering a comeback era, announces that Scary Movie is also returning in 2026, and closes with the poll result: canon Stu Lives at 61%, New Nightmare second, flashbacks third, and the hosts yelling that they were right.",
    story: Object.freeze([
      { at: 0, end: 600, label: "THE EMERGENCY STREAM WITH A DEAD MIC", body: "The room has no clean launch: the microphone breaks, subscribers were not notified, and the hosts have to discover the Scream news with the audience in real time." },
      { at: 600, end: 1500, label: "THE CULT THEORY AND THE SHERIFF FAVOR", body: "The Stu theory begins with rich parents, a sheriff favor, and a death that was always more convenient to fake than to explain." },
      { at: 1500, end: 2400, label: "NEW NIGHTMARE SCREAM VS FLASHBACK", body: "The room compares a simple flashback to a New Nightmare-style Scream where the actors play themselves, then lets the FAM choose which route deserves the movie." },
      { at: 2400, end: 3300, label: "ROMAN, STU, AND THE TWO-LIVES SOLUTION", body: "Roman's own fake death creates a way to connect the old mythology to Stu, while the room insists the writers must make the explanation plausible instead of Scooby-Doo silly." },
      { at: 3300, end: 4200, label: "FAN SERVICE, DOGS, AND THE SUPER BOWL FEELING", body: "Fan-service arguments, a dog in the camera, and an NFL-style confidence spike make the room feel less like news coverage and more like a fan base watching its team wake up." },
      { at: 4200, end: 5000, label: "THE NEW NIGHTMARE KILLER BOARD", body: "Randy, Tatum, Drew Barrymore, Steve, and other returning faces become possible Ghostface candidates while the room keeps asking who can return without turning the franchise into a dream." },
      { at: 5000, end: 5500, label: "LEE THE MACHINE AND THE PHONE CALLBACK", body: "Lee's generosity gets a sincere thank-you, then his phone joke becomes a callback to the phone that hit Stu in the original Scream." },
      { at: 5500, end: 5744, label: "THE COMEBACK KINGS WIN THE POLL", body: "The hosts celebrate Stu's return, Scary Movie's comeback, and a poll that gives the canon cult route 61 percent before the final get-it-up button." },
    ]),
    highlights: Object.freeze([
      H(52, 60, "ROOM BREAK", "THE EMERGENCY STREAM HAS NO MICROPHONE", "The room cannot even hear itself cleanly after the Alien: Romulus commentary, so the first Scream 7 emergency begins as a technical failure."),
      H(330, 338, "WWAM UP IN YA", "THE PHONE GETS THROWN ACROSS THE ROOM", "A phone full of notifications gets thrown to prevent interruption, then becomes part of the story about why this emergency room exists at all."),
      H(482, 490, "FAN SIGNAL", "STU'S CULT THEORY GETS THE FLOOR", "The room asks the FAM to consider the central theory: Stu's death was faked, his rich parents paid for the silence, and a sheriff helped keep the secret."),
      H(680, 688, "MAJOR TOPIC TURN", "THE SHERIFF OWED THE MACHERS A FAVOR", "The fake-death theory gets its first piece of connective tissue when the sheriff who looked like a red herring becomes the person who could have made Stu disappear."),
      H(935, 943, "MAJOR TOPIC TURN", "NEW NIGHTMARE SCREAM", "The room pitches a Scream sequel where the actors play themselves, treating Wes Craven's New Nightmare as the cleanest way to make Stu's return feel like an event."),
      H(1260, 1268, "STRAIGHT TO STEVE'S ASSHOLE", "THE SCREAM THREE REMAKE THAT NEVER WAS", "An old Kevin Williamson idea involving Stu in jail gets compared with Scream 3 and the room admits the franchise history is already full of alternate universes."),
      H(1596, 1604, "TAKE GETS NUCLEAR", "A FLASHBACK WOULD FEEL LIKE A BUMMER", "A simple flashback is not rejected outright, but the room admits it would feel disappointing unless it gets the full Halloween Kills-style care and screen time."),
      H(1888, 1896, "FAN SIGNAL", "THE POLL: CULT, NEW NIGHTMARE, OR FLASHBACK", "The audience gets a real choice about how Stu returns, turning the emergency stream into a living writers' room."),
      H(2165, 2173, "STRAIGHT TO STEVE'S ASSHOLE", "DEWEY'S DEATH CREATED A CROSSROADS", "The room argues that Dewey was the franchise glue and wonders whether a Stu reveal could give that loss more meaning without erasing it."),
      H(2480, 2488, "MAJOR TOPIC TURN", "ROMAN TEACHES STU TO FAKE HIS DEATH", "The two-lives solution appears: Roman knows how to fake a death, so a flashback could show him teaching Stu how to disappear while keeping the old canon intact."),
      H(2760, 2768, "TAKE GETS NUCLEAR", "THE DEMPSY CASTING CHEEK", "The room reads the Patrick Dempsey news as a cheeky move that may be hiding more than it reveals, then refuses to believe the casting cannot be a misdirection."),
      H(3015, 3023, "SOUNDBYTE / REPLAY", "666 PEOPLE ARE GOING TO HELL", "The live count hits 666 and the room decides the whole audience is doomed, an accidental horror stinger in the middle of the Scream theory."),
      H(3280, 3288, "CHARACTER APPEARANCE", "ROMAN, STU, AND THE VISIONS OF SIDNEY", "Fan theories add Roman and Stu visions, Kirby's possible series, and the question of how much of the new movie should be real versus nightmare."),
      H(3640, 3648, "ROOM BREAK", "THE DOG TAKES OVER THE CAMERA", "A dog walks into the frame while the room is arguing about fan service, forcing the emergency theory board to pause for a completely domestic interruption."),
      H(3940, 3948, "MAJOR TOPIC TURN", "SCREAM 7 HAS THE SUPER BOWL FEELING", "The hosts compare the franchise's sudden momentum to a bad NFL team finally finding its stride, immediately followed by fear that the season will still end in heartbreak."),
      H(4325, 4333, "TAKE GETS NUCLEAR", "ROMAN CAN BE THE BRIDGE", "Roman's fake death is elevated from trivia to the bridge that could connect Stu's survival, the cult theory, and the new film's larger mythology."),
      H(4535, 4543, "CHARACTER APPEARANCE", "WHO IS THE NEW NIGHTMARE KILLER?", "Randy, Tatum, Drew Barrymore, Steve, and other old faces become possible Ghostface candidates in the room's most entertaining casting board."),
      H(4818, 4826, "STRAIGHT TO STEVE'S ASSHOLE", "STEVE'S DEATH WAS A TERRIBLE DATE", "Steve's death is revisited as one of the worst possible situations: tied up, watching his girlfriend flirt with the people about to kill him."),
      H(5090, 5098, "FAN SIGNAL", "LEE THE MACHINE IS A PRINCE", "Lee gets a sincere thank-you for showing up and supporting the channel, with the room calling him a prince before the phone callback lands."),
      H(5150, 5158, "WWAM UP IN YA", "THE PHONE THAT HIT STU", "Lee's message brings back the phone that Billy used to hit Stu, turning a Super Chat into a piece of Scream prop lore."),
      H(5438, 5446, "SOUNDBYTE / REPLAY", "CHERISH IT: STU IS BACK", "The room stops theorizing long enough to celebrate the announcement itself, yelling that the moment is real and the FAM is watching it happen together."),
      H(5530, 5538, "FAN SIGNAL", "SCARY MOVIE IS COMING BACK TOO", "The comeback feeling widens when the room remembers Scary Movie is also returning in 2026, turning the franchise news into a cultural pendulum swing."),
      H(5684, 5692, "SOUNDBYTE / REPLAY", "CANON CULT STU WINS 61 PERCENT", "The final poll gives the canon cult route 61 percent, with New Nightmare second, flashbacks third, and prequel moments last."),
      H(5728, 5736, "WWAM UP IN YA", "STU LIVES, SUCK MY DICK", "The show closes with the hosts celebrating the prediction, the audience, and the most aggressively unpolished victory lap imaginable."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 482, end: 1888, label: "THE CULT THEORY WRITERS' ROOM", topic: "FAM turns an announcement into canon", body: "Play from 8:02. Rich parents, a sheriff favor, New Nightmare Scream, flashback rules, and the first poll build the show's main theory with the audience in the room.", playAt: 482, playEnd: 1888 }),
      hated: Object.freeze({ at: 1596, end: 2173, label: "THE FLASHBACK BUMMER", topic: "a return needs more than a cameo", body: "Play from 26:36. The room explains why a tiny flashback would feel like a letdown and why Dewey's death still changes the emotional math.", playAt: 1596, playEnd: 2173 }),
      wildestDetour: Object.freeze({ at: 2480, end: 4826, label: "ROMAN, 666, AND THE NEW NIGHTMARE KILLER BOARD", topic: "Scream lore becomes a conspiracy sport", body: "Play from 41:20. Roman teaches Stu to fake his death, the audience hits 666, a dog interrupts, the Packers analogy arrives, and dead characters audition to be Ghostface.", playAt: 2480, playEnd: 4826 }),
      lastWord: Object.freeze({ at: 5090, end: 5736, label: "LEE, STU, AND THE 61-PERCENT VICTORY", topic: "the FAM gets the final word", body: "Play from 1:24:50. Lee gets thanked, the original phone returns, Scary Movie joins the comeback, and canon cult Stu wins the poll.", playAt: 5090, playEnd: 5736 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
