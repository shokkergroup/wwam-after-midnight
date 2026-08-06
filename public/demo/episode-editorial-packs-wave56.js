(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* November 17, 2025: full-tape read of the Welcome to Derry episode-four recap. */
  sources["1ctyVf_d5w4"] = Object.freeze({
    sourceId: "1ctyVf_d5w4",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 3016,
      captionWords: 2551,
      captionEvents: 245,
      captionSpanSeconds: 3006,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:45d7b86758e2dbb97294b1b079c1a8de5cf3d5666eacd0af5e3e037279770fe8",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "4ee5d10674e259919ae6a84128794e9b22e1314878bcfdfdb032f56ee448d8cb",
      asrWindowCount: 22,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "IT: WELCOME TO DERRY EPISODE 4 RECAP // DICK HALLORAN'S MIND, LEROY HANLON, AND THE SHOW'S UGLY MIDDLE",
    badge: "FULL SHOW WIKI // 50:16 OF DERRY LORE, SPECIAL-EFFECTS HEAT, MICHAEL JACKSON DETOURS, AND END-OF-SHOW FAM CHAOS",
    headline: "EPISODE 4 GIVES DICK HALLORAN A POWER-UP, BUT THE ROOM THINKS THE SHOW IS RUNNING ON LEFTOVER EFFECTS MONEY.",
    deck:
      "A compact recap of Welcome to Derry's fourth episode where the big mythology is Dick Halloran's amplified ability, the emotional anchor is the Halloran-and-son material, and the main complaint is that the season keeps asking for patience while delivering ugly frames, filler, and one more promise that the next episode will finally cook.",
    overview:
      "The room is not pretending this episode landed cleanly. It likes Dick Halloran, Leroy Hanlon, and the possibility that Pennywise amplifies Dick's already-present ability, but it keeps circling the same complaint: the series is spending too much time on exposition and too little on scenes that feel alive. The eye-gouging image gets a hard veto, the supernatural imagery is compared to a bad game cutscene, and the Native American material is accused of arriving with Lord of the Rings language instead of its own texture. Continuity questions still matter. The chat helps untangle Will, Leroy, and Mike Hanlon, while Dick's mind-reading moment earns the rare sincere cheer. The back half wanders through Call of Duty controller problems, a Michael Jackson biopic and Corey Feldman interview claims, a bizarre 3I/Project Bluebeam alien-invasion theory, Packers betting, and the decision to postpone the Friday the 13th poster board. The emotional through-line is simple: the hosts have already invested four hours, so they are going to finish the season and hope the finale hits the one perfect shot that makes the bad holes feel worth it.",
    story: Object.freeze([
      { at: 0, end: 450, label: "THE OLD DICK IS THE BEST PART", body: "The recap opens with a budget joke and an immediate verdict: Dick Halloran is still the strongest thing in the show. The room sees flashes of good material, but most of the episode feels like filler that never lets the audience get lost in the story." },
      { at: 451, end: 900, label: "DICK'S POWER, THE NATIVE-AMERICAN THREAD, AND LORD OF THE RINGS", body: "Dick's ability gets a possible origin story, including a mind-reading flex that works better than the surrounding imagery. The Native American material is treated as a missed opportunity because the room hears a fantasy-quest voice where it wanted something specific to Derry." },
      { at: 901, end: 1350, label: "THE STORY NEEDS TO STOP PROMISING NEXT TIME", body: "The hosts argue that the series keeps moving the real story twenty years backward instead of making the current one entertaining. They are willing to watch an origin story, but the effects and the writing have to do more than ask for patience." },
      { at: 1351, end: 1800, label: "FOUR HOURS INVESTED AND ONE LAST-HOLE GOLF SHOT", body: "The room decides to finish because four hours are already invested. The finale is imagined as the one perfect golf shot on the eighteenth hole that might make everybody claim they always knew the show was great." },
      { at: 1801, end: 2250, label: "CALL OF DUTY, STICK DRIFT, AND A TIKTOK TIP", body: "A Patreon Call of Duty session becomes a controller autopsy. The drifting joystick is blamed for missed turns, rage, and a future TikTok clip about a helpful person who deserves traffic and tips." },
      { at: 2251, end: 2700, label: "MICHAEL JACKSON, COREY FELDMAN, AND THE INTERVIEW RECEIPT", body: "A Michael Jackson biopic and Corey Feldman interview claims open a celebrity-story lane about changing memories. The room mocks the increasingly grand version of an old music anecdote without pretending to know which version is true." },
      { at: 2701, end: 3016, label: "3I ATLAS, THE WORST TIMELINE, AND FRIDAY'S POSTER PROMISE", body: "An alien-invasion theory, Project Bluebeam, political jokes, Packers results, and a postponed Friday the 13th poster ranking create the final pile-up. The stream signs off by telling everybody to save the debauchery for the weekend." },
    ]),
    highlights: Object.freeze([
      { at: 69, end: 118, category: "TAKE GETS NUCLEAR", label: "THE LEFTOVER-EFFECTS BUDGET", excerpt: "The room imagines most of the budget going to the star while the effects team gets whatever money was still on the table." },
      { at: 78, end: 126, category: "BEST MOMENT", label: "DICK HALLORAN WINS AGAIN", excerpt: "Even a rough episode gets one clear receipt: Dick Halloran remains the part of the season the room wants more of." },
      { at: 127, end: 176, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE RAINBOW HOT DOG", excerpt: "A supernatural scare is compared to a rainbow hot dog and a bad Xbox game, a visual roast the effects cannot escape." },
      { at: 182, end: 232, category: "WWAM UP IN YA", label: "THE BUZZSAW EYE SOLUTION", excerpt: "The room cannot understand why the character reaches for a buzzsaw instead of a more direct eye-gouging nightmare." },
      { at: 233, end: 282, category: "FAN SIGNAL", label: "WHAT DID WE LEARN?", excerpt: "The room asks the chat to name the episode's actual progress, then lands on a clubhouse for Jake and his friends." },
      { at: 327, end: 376, category: "DEEP DIVE", label: "DICK'S POWER-UP THEORY", excerpt: "The hosts imagine Pennywise amplifying Dick Halloran's existing ability until the Shining version of the character finally makes sense." },
      { at: 349, end: 398, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "EVERY FRAME IS UGLY", excerpt: "A blunt production verdict arrives before the room can soften it: the episode looks ugly nearly every time the camera settles." },
      { at: 381, end: 430, category: "BEST MOMENT", label: "THE DICK MUSCLE FLEX", excerpt: "Dick Halloran reaches into a kid's mind and the room finally sees the X-Men-style psychic scene it wanted from the show." },
      { at: 401, end: 450, category: "WWAM UP IN YA", label: "BILBO IN THE TREE", excerpt: "The Native American material is compared to Lord of the Rings so aggressively that the room expects Bilbo Baggins to walk out of a tree." },
      { at: 484, end: 533, category: "TAKE GETS NUCLEAR", label: "THE MISSED X-MEN SCENE", excerpt: "The room reconstructs the mind-space scene that could have been great, then grieves the version that got replaced by fantasy exposition." },
      { at: 660, end: 710, category: "FAN SIGNAL", label: "WILL, LEROY, AND MIKE HANLON", excerpt: "A continuity question forces the room to untangle which Hanlon is which and how the future movie characters connect." },
      { at: 684, end: 734, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "LEROY'S ANNOYING WIFE", excerpt: "The continuity lesson ends with the room reopening its case against Leroy Hanlon's wife, who remains the easiest target in Derry." },
      { at: 1095, end: 1144, category: "DEEP DIVE", label: "THE TWENTY-YEARS-BACKWARD PROBLEM", excerpt: "The hosts argue that the show keeps moving backward instead of making the present story entertaining before demanding another time jump." },
      { at: 1118, end: 1168, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "PUT SOME WORK IN THE EFFECTS", excerpt: "The room compares Derry's visuals with other expensive television and asks the production to do more than spend money on a famous name." },
      { at: 1203, end: 1252, category: "WWAM UP IN YA", label: "THE TWO-SENTENCE RECAP", excerpt: "A brutal viewing shortcut is offered: skip the episode, find two sentences online, and move on with your life." },
      { at: 1216, end: 1264, category: "THE ROOM BREAKS", label: "VAPE MY KNOB", excerpt: "A chat aside about vaping becomes a tiny insult stinger in the middle of a serious complaint about the season's momentum." },
      { at: 1521, end: 1570, category: "BEST MOMENT", label: "THE FOUR-HOUR INVESTMENT", excerpt: "The hosts commit to finishing because four hours are already invested, which is both loyalty and the most honest review policy imaginable." },
      { at: 1530, end: 1578, category: "TAKE GETS NUCLEAR", label: "THE EIGHTEENTH-HOLE FINALE", excerpt: "The finale is imagined as one perfect golf shot after seventeen bad holes, a last chance to make everybody say the show was secretly great." },
      { at: 2098, end: 2148, category: "THE ROOM BREAKS", label: "THE DOUBLED FILTER", excerpt: "A duplicated read is blamed on a missing filter, and the fix arrives with a self-inflicted insult before the show can move on." },
      { at: 2115, end: 2164, category: "FAN SIGNAL", label: "THE CALL OF DUTY NIGHT", excerpt: "A Patreon gaming session becomes a small channel-memory receipt, complete with a controller that refuses to turn when the player needs it." },
      { at: 2167, end: 2216, category: "WWAM UP IN YA", label: "THE STICK-DRIFT RAGE", excerpt: "A worn joystick turns every attempted 360 into a delayed disaster, and the room cannot decide whether the controller or the player is guilty." },
      { at: 2226, end: 2276, category: "FAN SIGNAL", label: "THE HOOTIE-WHO EXPLANATION", excerpt: "A strange story about getting a truck's tail end caught becomes a TikTok promise and a shout-out to a helpful stranger." },
      { at: 2308, end: 2358, category: "DEEP DIVE", label: "THE MICHAEL JACKSON NEPHEW CASTING", excerpt: "A biopic gets a family resemblance receipt when the actor playing Michael Jackson is identified as Tito's nephew." },
      { at: 2429, end: 2478, category: "TAKE GETS NUCLEAR", label: "THE FELDMAN STORY CHANGES", excerpt: "A Michael Jackson story is remembered in multiple versions, and the room cannot ignore how much the details seem to grow between interviews." },
      { at: 2557, end: 2606, category: "FAN SIGNAL", label: "SLENDERMAN'S MICHAEL JACKSON ALBUM", excerpt: "A fan pitches a Michael Jackson cover album by Slenderman, and the room immediately worries about copyright before enjoying the image." },
      { at: 2632, end: 2682, category: "WWAM UP IN YA", label: "THE YODELING CHAMPION RUMOR", excerpt: "A rumor about a yodeling champion and a political name gets added to the endless internet file marked nobody should be surprised anymore." },
      { at: 2708, end: 2758, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE WATCH-AND-MOUTH JOKE", excerpt: "A watch-sales voice and an intentionally vulgar political riff turn the news lane into the worst commercial on television." },
      { at: 2724, end: 2774, category: "TAKE GETS NUCLEAR", label: "PROJECT BLUEBEAM", excerpt: "3I Atlas and Project Bluebeam become a theory that the internet might fake an alien invasion just to keep a list off the web." },
      { at: 2733, end: 2782, category: "BEST MOMENT", label: "THE WORST TIMELINE", excerpt: "The room lands on the only responsible conclusion after the alien theory: somehow this is the worst timeline." },
      { at: 2756, end: 2806, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE CHEAP HUSH-MONEY BIT", excerpt: "A political aside becomes a country-sized hush-money joke, and the hosts decide ending on the darkest possible note is probably correct." },
      { at: 2825, end: 2874, category: "FAN SIGNAL", label: "THE PACKERS BEAT THE GIANTS", excerpt: "The room briefly returns to football, celebrates a Packers win, and admits the betting advice would have been a disaster." },
      { at: 2831, end: 2880, category: "WWAM UP IN YA", label: "BET THE GIANTS", excerpt: "A confident football prediction is immediately punished by reality, leaving the bettor with no magic left to spend." },
      { at: 2974, end: 3010, category: "FAN SIGNAL", label: "FRIDAY THE 13TH POSTERS WAIT", excerpt: "The Friday the 13th poster ranking is delayed until Friday, which makes sense and still gets treated like an organizational crisis." },
      { at: 2981, end: 3012, category: "THE ROOM BREAKS", label: "WHAT HAPPENS WEDNESDAY?", excerpt: "When the poster board moves, the room offers an aggressively simple replacement plan for Wednesday's show." },
      { at: 2989, end: 3014, category: "BEST MOMENT", label: "SAVE THE DEBAUCHERY", excerpt: "The sign-off tells the FAM to survive Monday, save the drinking for the weekend, and come back for the next mess." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 381, end: 430, label: "THE DICK MUSCLE FLEX", topic: "the one scene where the mythology feels alive", body: "Play from 6:21. Dick Halloran's mind-power moment finally gives the room the psychic horror it wanted from the series.", playAt: 381, playEnd: 430 }),
      hated: Object.freeze({ at: 349, end: 398, label: "EVERY FRAME IS UGLY", topic: "the production complaint that keeps returning", body: "Play from 5:49. The room stops being polite about the visuals and calls the episode ugly before the next scene can defend itself.", playAt: 349, playEnd: 398 }),
      wildestDetour: Object.freeze({ at: 2724, end: 2774, label: "PROJECT BLUEBEAM", topic: "the alien-invasion theory that ends the news lane", body: "Play from 45:24. 3I Atlas turns into a fake-invasion theory, then the room decides the timeline is irredeemable anyway.", playAt: 2724, playEnd: 2774 }),
      lastWord: Object.freeze({ at: 2989, end: 3014, label: "SAVE THE DEBAUCHERY", topic: "the Monday sign-off", body: "Play from 49:49. The room delays the poster ranking, protects the weekend debauchery, and sends the FAM back into the week.", playAt: 2989, playEnd: 3014 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
