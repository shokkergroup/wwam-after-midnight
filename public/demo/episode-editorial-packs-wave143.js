(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "UR9Nbk5a3vc", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* January 29, 2025: full second read of the 1:56:14 Top 10 Movies of 2000 room. */
  sources["UR9Nbk5a3vc"] = Object.freeze({
    sourceId: "UR9Nbk5a3vc",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; full caption-ledger pass across the 2000 list with audio-backed doors",
    evidence: Object.freeze({
      duration: 6974,
      captionWords: 25839,
      captionEvents: 3323,
      captionSpanSeconds: 6975.84,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:05df59c28ccd659060687e004442e373eecad0b36106e5d0e6ec7d1039bb18d7",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:74a9575aa418009fe64697a494634722ce302a0b391a38485b84bf18fd8c3796",
      asrWindowCount: 299,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // JANUARY 29, 2025",
    badge: "FULL SHOW WIKI // 1:56:14 OF THE TOP 10 MOVIES OF 2000, BEER MATH, SCARY MOVIE, X-MEN, FINAL DESTINATION, AND AMERICAN PSYCHO",
    headline: "THE 2000 LIST GETS INTERRUPTED BY RECTUM DRAMA, BEER ECONOMICS, AND A FINAL DESTINATION DEFENSE",
    deck: "A ranking show with actual arguments: The Cell, Road Trip, The Skulls, Scary Movie, X-Men, Blade, Final Destination, American Psycho, and the audience's own canon.",
    overview: "January 29 is a list show, but it never behaves like a list show. It opens in the middle of a rectum story, then immediately explains why the hosts had to build their Top 10 Movies of 2000 list from a shower, IMDb, and somebody reading titles out loud. The early room wanders through the RFK confirmation hearing as cinematic chaos, Paul Brothers behavior, tequila and beer prices, a Surge sugar warning, and an Australian beer exchange that turns into an accidental Price Is Right for alcoholics. Once the list settles, the episode gets genuinely useful: The Cell becomes a cerebral horror recommendation, Road Trip gets Tom Green and a future documentary door, The Skulls gets treated as a ridiculous secret-society movie that still captures its moment, Scary Movie gets a thoughtful explanation of why parody worked so well, X-Men and Blade get their due as foundational comic-book films, and Final Destination gets defended as a creative, paranoid studio movie even though it misses the final ten. American Psycho becomes the most serious film conversation in the room, with Patrick Bateman's masks, quotability, and Christian Bale's impossible-to-recast performance taking over the closing stretch of the list. Fan messages keep expanding the canon: What Lies Beneath, Scary Movie, Remember the Titans, Me, Myself & Irene, Hellraiser, Hollow Man, Pay It Forward, The 6th Day, What Women Want, and Miss Congeniality all arrive as alternate doors. The show ends with a very good universal idea: turn every year's ranking into trading cards people can compare and mail to each other.",
    story: Object.freeze([
      { at: 0, end: 900, label: "THE LIST BUILT FROM A SHOWER", body: "A rectum joke, a rushed IMDb list, and the promise not to let a bad day ruin the show establish the room before the rankings even begin." },
      { at: 900, end: 1800, label: "BEER, SURGE, AND THE PRICE OF BEING ALIVE", body: "Tequila, Miller Lite, Surge, Australian beer prices, and a Jacksonville coach give the list a long detour through beverage economics and public embarrassment." },
      { at: 1800, end: 3000, label: "THE CELL, ROAD TRIP, AND THE SKULLS", body: "The Cell gets a cerebral-horror defense, Road Trip brings Tom Green and a documentary door, and The Skulls becomes a secret-society movie the room cannot stop insulting." },
      { at: 3000, end: 3900, label: "SCARY MOVIE, X-MEN, AND BLADE", body: "Parody, Wolverine, Sabretooth, Storm, Blade, and comic-book movie history create the most coherent genre run in the episode." },
      { at: 3900, end: 4800, label: "FINAL DESTINATION AND THE HONORABLE MENTION WAR", body: "Final Destination gets a defense, creative deaths get remembered, and the room launches into the most inappropriate honorable mention imaginable." },
      { at: 4800, end: 5600, label: "AMERICAN PSYCHO AND PAUL ALLEN'S CARD", body: "American Psycho becomes the serious center of the list: masks, status, quotability, and the problem of recasting Christian Bale." },
      { at: 5600, end: 6500, label: "FAMILY AWKWARDNESS AND FAN CANON", body: "The room revisits awkward family visits, adds fan recommendations, and lets the FAM widen the 2000 universe beyond the official ten." },
      { at: 6500, end: 6974, label: "TRADING CARDS AND THE LAST CHUNKY NOODLE", body: "The list becomes a collectible idea, a few final recommendations land, and the room exits with a vulgar, affectionate sign-off." },
    ]),
    highlights: Object.freeze([
      H(22, 30, "ROOM BREAK", "THE RECTUM STORY OPENS THE TOP TEN", "The show begins mid-conversation with a bleeding rectum story, then immediately insists the ranking list will still be good."),
      H(145, 153, "WWAM UP IN YA", "THE IMDB SHOWER DRAFT", "The list was assembled while somebody showered and April read IMDb titles out loud, making the ranking process itself part of the comedy."),
      H(390, 398, "MAJOR TOPIC TURN", "THE RFK HEARING AS AN IRON MAN MOVIE", "A confirmation hearing gets compared to a superhero movie full of protesters, yelling senators, and a worm-in-the-brain subplot."),
      H(700, 708, "STRAIGHT TO STEVE'S ASSHOLE", "THE PAUL BROTHERS' RESPONSIBLE DOG OWNERSHIP", "The room revisits a Paul Brothers controversy and turns the attempted explanation into an award ceremony nobody should attend."),
      H(1010, 1018, "WWAM UP IN YA", "SEVEN TEQUILAS BEFORE THE SHOW", "A tequila-and-club-soda routine becomes a morning drinking confession, followed by the admission that Miller Lite is the servant substitute for Michelob Ultra."),
      H(1288, 1296, "STRAIGHT TO STEVE'S ASSHOLE", "SURGE IS DIABETES IN ONE CAN", "Surge gets treated as a sugar-and-caffeine grenade, with the room imagining the can itself applying for a medical license."),
      H(1568, 1576, "FAN SIGNAL", "AUSTRALIAN BEER PRICE IS THE PRICE IS RIGHT", "A Byron Hansen message turns beer prices into an international guessing game and exposes the room's extremely specific alcohol math."),
      H(1864, 1872, "FAN SIGNAL", "JT'S MOM-TO-GRANDMA PREQUEL", "JT Oley's recurring family story gets a new chapter, and the room insists he finish the current installment before moving on to the sequel."),
      H(2162, 2170, "MAJOR TOPIC TURN", "THE CELL IS A CEREBRAL NIGHTMARE", "Jennifer Lopez's The Cell gets defended as a genuinely strange, stylish horror movie before the sequel is sent directly into the void."),
      H(2490, 2498, "WWAM UP IN YA", "ROAD TRIP AND TOM GREEN", "Road Trip brings Tom Green, a possible Amazon documentary, and the memory of a Patreon stream where the room laughed itself sick at old videos."),
      H(2768, 2776, "STRAIGHT TO STEVE'S ASSHOLE", "THE SKULLS IS A SECRET SOCIETY OF CUS", "The Skulls is described as a movie that takes itself like The Social Network while remaining a dumb, fun secret-society time capsule."),
      H(3050, 3058, "ROOM BREAK", "EMINEM'S PHONE SKITS", "A loose microphone and the memory of Eminem's Paul Allen and Ken Kaniff phone skits turn the ranking room into an accidental audio replay."),
      H(3358, 3366, "MAJOR TOPIC TURN", "SCARY MOVIE UNDERSTOOD THE ASSIGNMENT", "The room explains why Scary Movie worked: it understood horror well enough to turn the genre's habits inside out instead of merely making random parody noise."),
      H(3652, 3660, "CHARACTER APPEARANCE", "WOLVERINE AND SABRETOOTH IN THE SNOW", "X-Men gets remembered through Wolverine's rough first appearance, the snow fight, and the complaint that Sabretooth was underused."),
      H(3920, 3928, "MAJOR TOPIC TURN", "BLADE SET THE COMIC-BOOK TONE", "Blade gets its due as one of the early comic-book movies that treated the material like an actual badass film instead of a joke."),
      H(4158, 4166, "SOUNDBYTE / REPLAY", "THE FINAL DESTINATION DEATH DEFENSE", "Final Destination is defended for creative deaths, paranoia, and the feeling that nobody is safe even when the movie refuses to become a classic."),
      H(4410, 4418, "WWAM UP IN YA", "THE HONORABLE MENTION DONG", "An honorable mention becomes an aggressively anatomical song about an American-sized family legacy, then the room remembers Drinking Your Juice in the Hood."),
      H(4692, 4700, "STRAIGHT TO STEVE'S ASSHOLE", "AMERICAN PSYCHO'S PAUL ALLEN CARD", "The room returns to Patrick Bateman's status competition and Paul Allen's business card, calling the movie one of the most quotable ever made."),
      H(4964, 4972, "MAJOR TOPIC TURN", "CHRISTIAN BALE CANNOT BE RECAST", "American Psycho becomes a serious acting conversation: the performance is too specific, too layered, and too tied to Bale to replace cleanly."),
      H(5236, 5244, "ROOM BREAK", "THE AWKWARD FAMILY CLOTHES ERRAND", "A family visit becomes a story about being sent upstairs to borrow clothes from a brother you have never met, one of the room's most recognizable social nightmares."),
      H(5450, 5458, "TAKE GETS NUCLEAR", "THE SEASONING ZOOLOGIST", "A pepper argument invents the job title seasoning zoologist, because even a list about movies needs a completely unnecessary profession."),
      H(5754, 5762, "FAN SIGNAL", "BROKEBACK MOUNTAIN IS ACTUALLY GREAT", "The room gives Brokeback Mountain a sincere defense before turning the discussion into an overextended security-guard joke."),
      H(6030, 6038, "WWAM UP IN YA", "TURD TURLINGTON ENTERS THE CANON", "A fan name becomes a possible Xbox gamertag, complete with a toilet-flush entrance theme and the threat of being killed by a turd."),
      H(6346, 6354, "FAN SIGNAL", "HARD EYES AND HEELS SHOUT-OUT", "A fan checks in after work, plugs Hard Eyes, and asks the audience to keep Heels alive long enough for a third season."),
      H(6702, 6710, "CHARACTER APPEARANCE", "DOOFY IS RETIRED, NOT DEAD", "The Scary Movie character lane returns for a final Doofy joke, then the room turns the line into a fake retirement announcement."),
      H(6912, 6920, "SOUNDBYTE / REPLAY", "CHUNKY NOODLE SOUP IN THE MOUTH", "The show closes with love, licking, beer invitations, and the admission that the mouth is now full of chunky noodle soup."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2162, end: 3928, label: "THE CELL TO BLADE RUN", topic: "the 2000 list finds its genre spine", body: "Play from 36:02. The Cell, Road Trip, The Skulls, Scary Movie, X-Men, and Blade show why this year still has a recognizable cinematic personality.", playAt: 2162, playEnd: 3928 }),
      hated: Object.freeze({ at: 1288, end: 2170, label: "SURGE, BEER, AND THE FAMILY PREQUEL", topic: "the list keeps getting derailed", body: "Play from 21:28. Surge sugar, an international beer price war, and JT's unfinished family saga are the episode's clearest side-road run.", playAt: 1288, playEnd: 2170 }),
      wildestDetour: Object.freeze({ at: 4410, end: 6038, label: "THE DONG, BATEMAN, AND TURD TURLINGTON", topic: "honorable mentions become their own movie", body: "Play from 1:13:30. An anatomical song, American Psycho, awkward family clothes, Brokeback Mountain, and a toilet-flush gamertag take over the ranking room.", playAt: 4410, playEnd: 6038 }),
      lastWord: Object.freeze({ at: 6346, end: 6920, label: "HARD EYES, DOOFY, AND CHUNKY NOODLE SOUP", topic: "the FAM closes the list", body: "Play from 1:45:46. A fan plugs Hard Eyes and Heels, Doofy gets a fake retirement, and the room exits with chunky noodle soup in its mouth.", playAt: 6346, playEnd: 6920 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
