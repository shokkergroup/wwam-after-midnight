(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "p7pL7mWBI58", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* January 23, 2025: full second read of the 1:17:48 daytime movie-news room. */
  sources["p7pL7mWBI58"] = Object.freeze({
    sourceId: "p7pL7mWBI58",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; full caption-ledger pass across the January 23 daytime room with audio-backed doors",
    evidence: Object.freeze({
      duration: 4668,
      captionWords: 17179,
      captionEvents: 5187,
      captionSpanSeconds: 4668.92,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:f68705cc7557fcfb7ad13a376315b624e43b609a713ced0ade589ae846ddd3bf",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:e4ba7377117c2be824f2bd19e05882b8a477acab7b07ca74d66db22eadc86a7d",
      asrWindowCount: 25,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // JANUARY 23, 2025",
    badge: "FULL SHOW WIKI // 1:17:48 OF GTA 6 PRICES, OSCAR BEEF, ALIEN RUMORS, BATMAN, TRAILERS, AND FAM CHAOS",
    headline: "THE JANUARY 23 DAY SHIFT STARTS WITH DOG DIARRHEA AND ENDS IN KAPPA TURTLE LAW",
    deck: "A daytime news room where the $100 game question gets genuinely heated, the Oscars get dragged, and every trailer eventually has to survive the WWAM butt-hole court.",
    overview: "January 23 opens before the coffee has done its job: Mike has been awake since five because his dog is producing what the room lovingly calls a Hershey factory. That becomes the launchpad for a real argument about the rumored $100 standard price for GTA 6. The hosts understand why a huge game might cost more, but they are not interested in paying premium money for a half-finished product padded with patches, DLC, account restrictions, and corporate hands reaching into the customer's wallet. The show then swerves through Mortal Kombat nostalgia—Sub-Zero over Scorpion, Smoke getting turned into a robot, and Kung Lao's wood-chipper fatality—before the Oscar nominations trigger a full anti-awards-show sermon. Dune: Part Two, The Substance, Nosferatu, Wicked, Emilia Pérez, and the mysterious Nickel Boys become evidence in the case that the Academy is a tiny social club that watches seven movies and pretends it watched everything. The Alien lane is sharper: an unconfirmed rumor about de-aging Sigourney Weaver as Ripley in a future Alien movie is treated as timeline vandalism, especially after the hosts decide Fede Álvarez should build his own corner instead of stapling more nostalgia onto Romulus. The middle is community television: super chats, American Psycho book excerpts, Disney accusations, DC Elseworlds, Batman top-five lists, and a long digression about why Tim Burton's Batman Returns feels like a beautiful movie made inside a Spencer's Gifts. The final third is pure WWAM: Underworld, a fan-supplied Kurt Angle/Rikishi no-wipe story, the Hell of a Summer trailer, the desktop-horror trailer Bloat, Japanese kappa mythology, Spider-Man Noir, and a sports-dead-zone conversation that ends with Kentucky begging for a professional team. It is a news episode, but its actual subject is how quickly two movie fans can turn one headline into a whole filthy little universe.",
    story: Object.freeze([
      { at: 0, end: 600, label: "THE HERSHEY FACTORY AND THE $100 GAME", body: "A sleepless dog story becomes the opening argument: GTA 6 might test a $100 standard price, and the room asks whether players should pay premium money for unfinished games, DLC, and account nonsense." },
      { at: 600, end: 1200, label: "MORTAL KOMBAT, STRANGE DARLING, AND THE OSCAR TRIGGER", body: "Sub-Zero, robot Smoke, Johnny Cage, and a Kung Lao fatality give way to Strange Darling praise and the annual Oscars nomination-day meltdown." },
      { at: 1200, end: 1800, label: "THE OSCARS GET PUT ON TRIAL", body: "Dune, The Substance, Nosferatu, Wicked, Emilia Pérez, Nickel Boys, Demi Moore, Ariana Grande, and the Academy's tiny voting circle become one long case for fan-voted awards." },
      { at: 1800, end: 2400, label: "RIPLEY SHOULD STAY IN STASIS", body: "A rumor about de-aging Sigourney Weaver as Ripley in a future Alien movie meets the room's strongest instinct: stop bending the timeline and let Fede Álvarez make his own Alien film." },
      { at: 2400, end: 3000, label: "AMERICAN PSYCHO, ELSEWORLDS, AND BATMAN", body: "The American Psycho novel becomes a bathroom recommendation, DC Elseworlds become the movies the studio should actually be making, and the hosts build competing Batman top fives." },
      { at: 3000, end: 3600, label: "BATMAN RETURNS, UNDERWORLD, AND THE DUTY-HOLE COURT", body: "Tim Burton's beautiful weirdness is dissected, Underworld gets a Kate Beckinsale rewatch, and a wrestling story turns into a deeply serious WWAM ruling on unwashed butt cheeks." },
      { at: 3600, end: 4200, label: "HELL OF A SUMMER, BLOAT, AND THE KAPPA RIVER CHILD", body: "Two horror trailers get live reactions: a slasher camp comedy and a desktop-horror story about a Japanese kappa, whose water dish and cucumber weakness become instant character lore." },
      { at: 4200, end: 4668, label: "THE SPORTS GRAVEYARD AND THE LAST BUTT BUTTON", body: "Football, the lack of a Kentucky pro team, F1, Talladega Nights, fan goodbyes, and a final accidental button click close the daytime room." },
    ]),
    highlights: Object.freeze([
      H(7, 17, "WWAM UP IN YA", "THE DOG HAS OPENED THE HERSHEY FACTORY", "A pre-show dog emergency produces repeated piles, no sleep, and an opening image nobody could have put on a respectable movie-news network."),
      H(50, 64, "MAJOR TOPIC TURN", "GTA 6 WANTS A HUNDRED DOLLARS", "The $100 standard-edition rumor becomes a real consumer-price argument: if GTA gets away with it, every publisher may try to follow."),
      H(176, 188, "STRAIGHT TO STEVE'S ASSHOLE", "THE $100 GAME HAS TO ARRIVE FINISHED", "The room sends broken launches, day-one patches, DLC bait, and account restrictions straight to Steve's asshole."),
      H(300, 313, "WWAM UP IN YA", "THE DEVELOPERS' BIG JUICY WIENER", "A poll about game prices turns into a filthy image of the customer being told to pay more and enjoy the corporate treatment."),
      H(378, 388, "SOUNDBYTE / REPLAY", "NETFLIX IS BECOMING CABLE IN SLOW MOTION", "A small subscription increase becomes a warning about the day streaming quietly costs as much as the cable bundle everyone fled."),
      H(610, 623, "SOUNDBYTE / REPLAY", "SMOKE GOT TURNED INTO A ROBOT AND GOT RUINED", "Sub-Zero wins the OG debate, but Smoke's robot conversion is remembered as the moment the favorite ninja got screwed up."),
      H(666, 677, "SOUNDBYTE / REPLAY", "KUNG LAO'S HAT IS A WOOD CHIPPER", "The hosts try to identify a favorite fatality and land on Kung Lao slowly feeding somebody through the spinning hat."),
      H(730, 742, "FAN SIGNAL", "STRANGE DARLING GETS A FAM CO-SIGN", "A returning viewer calls Strange Darling one of the year's best and uses the super chat to pull Tarantino, feet, and new-classic talk into the room."),
      H(800, 814, "TAKE GETS NUCLEAR", "THE OSCARS ARE THE EYES WIDE SHUT CULT", "Oscar nominations day triggers the annual argument that a small circle of friends cannot decide what everyone else should call the best movie."),
      H(930, 944, "STRAIGHT TO STEVE'S ASSHOLE", "NICKEL BOYS? WHAT THE HELL IS NICKEL BOYS?", "A movie nominated over and over is treated like a mysterious band nobody in the room has ever heard of."),
      H(1010, 1022, "SOUNDBYTE / REPLAY", "ARiANA GRANDE LICKED THE DONUT AND GOT AN OSCAR NOMINATION", "The room connects old celebrity nonsense to the Oscar list and decides donut-licking was always a path to Hollywood's highest honor."),
      H(1216, 1230, "MAJOR TOPIC TURN", "RIPLEY DOES NOT NEED TO COME OUT OF STASIS", "An unconfirmed report about de-aging Sigourney Weaver becomes a warning not to bend the Alien timeline just to put a familiar face on a poster."),
      H(1286, 1300, "STRAIGHT TO STEVE'S ASSHOLE", "THE Rook MILK-HEAD PROBLEM", "The hosts point to Romulus's de-aged Rook head as proof that digital resurrection can look like a moral and technical disaster at the same time."),
      H(1450, 1462, "CHARACTER / LORE", "SUPERMAN FROM THE CIVIL WAR", "A Superman Elseworlds collection sparks the better idea: make the strange alternate-history comics instead of endlessly rebooting the same movie universe."),
      H(1645, 1658, "WWAM UP IN YA", "AMERICAN PSYCHO IS A BATHROOM BOOK", "Mike recommends Bret Easton Ellis's novel for the toilet because Patrick Bateman's inner voice is even more deranged on the page."),
      H(1938, 1952, "FAN SIGNAL", "THE DISNEY-MAN ACCUSATION", "A bizarre Twitter reply calls Mike a Disney man, and the room tries to work out what X-Men '97 and a few old favorites have to do with the insult."),
      H(2210, 2223, "MAJOR TOPIC TURN", "BATMAN TOP FIVE, NO JOKER ALLOWED", "The hosts build competing top-five Batman lists around Begins, The Dark Knight, 1989, BvS, Returns, and The Batman."),
      H(2520, 2535, "STRAIGHT TO STEVE'S ASSHOLE", "BATMAN RETURNS IS A SPENCER'S GIFTS NIGHTMARE", "Michelle Pfeiffer and Christopher Walken get their flowers, but Tim Burton's penguin-and-bums weirdness is declared beautiful and deeply uncomfortable."),
      H(2810, 2824, "SOUNDBYTE / REPLAY", "UNDERWORLD HAS TOO MANY MOVIES", "The hosts rediscover the first Underworld, remember the soundtrack, then realize the franchise has multiplied beyond anyone's need for more Kate Beckinsale."),
      H(3030, 3045, "STRAIGHT TO STEVE'S ASSHOLE", "Rikishi forgot the most important step", "A fan-submitted Kurt Angle story says Rikishi went into a match without wiping, and the room has to decide whether the prank is funny, criminal, or both."),
      H(3190, 3204, "WWAM UP IN YA", "THE STINK PALM OF PROFESSIONAL WRESTLING", "The follow-up imagery gets so filthy that the hosts compare the smell to Mallrats and an unwanted face full of somebody else's poop juice."),
      H(3320, 3334, "MAJOR TOPIC TURN", "HELL OF A SUMMER BEATS THE FIRST IMPRESSION", "The trailer's slasher-camp premise looks like a Gen-Z rave that might become annoying, but enough jokes land for the room to keep it on the watch list."),
      H(3618, 3632, "MAJOR TOPIC TURN", "BLOAT IS A DESKTOP-HORROR KAPPA MOVIE", "A family in Japan, a strange son, a remote camera, and a river-child demon turn a sight-unseen trailer into a surprisingly enthusiastic recommendation."),
      H(3730, 3745, "CHARACTER APPEARANCE", "THE KAPPA NEEDS WATER AND CUCUMBERS", "Japanese folklore becomes WWAM survival advice: protect the water dish, carry a cucumber, and do not let the river demon near your dick."),
      H(3945, 3960, "FAN SIGNAL", "SPIDER-MAN NOIR IS A SHOW, NOT A MOVIE", "A super chat corrects the room: Nick Cage's Spider-Man Noir is a series, which briefly drains the excitement before the hosts decide they still want it."),
      H(4210, 4224, "SOUNDBYTE / REPLAY", "THE SPORTS GRAVEYARD IS COMING", "With only three football games left, the room mourns the dead zone between football, March Madness, baseball, and whatever sport they can find."),
      H(4528, 4542, "FAN SIGNAL", "KENTUCKY NEEDS A TEAM CALLED THE HORSE CRACKERS", "A hypothetical Kentucky NFL team becomes the Kentucky Thoroughbreds, the Kentucky Cracker Jacks, or something involving horses and terrible branding."),
      H(4610, 4622, "SOUNDBYTE / REPLAY", "TALLADEGA NIGHTS SAVES THE SIGN-OFF", "A fan identifies the Molly Shannon racing quote, then the room signs off by wishing everyone healthy dog butts and immediately clicking the wrong button."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1216, end: 1462, label: "RIPLEY AND ELSEWORLDS", topic: "franchise memory versus new ideas", body: "Play from 20:16. The Alien rumor gets the episode's clearest argument, then Elseworlds offers the better path: strange stories instead of nostalgia surgery.", playAt: 1216, playEnd: 1462 }),
      hated: Object.freeze({ at: 800, end: 1022, label: "THE OSCAR NOMINATION MACHINE", topic: "the awards room feels closed to everybody else", body: "Play from 13:20. The Substance, Dune, Nickel Boys, Emilia Pérez, Ariana Grande, and a fictional Academy conspiracy get the full WWAM treatment.", playAt: 800, playEnd: 1022 }),
      wildestDetour: Object.freeze({ at: 3030, end: 3745, label: "Rikishi, HELL OF A SUMMER, AND THE KAPPA", topic: "a daytime news show becomes an unholy variety hour", body: "Play from 50:30. A no-wipe wrestling prank, two trailers, Japanese folklore, cucumbers, and a river demon are the episode's most unmistakable WWAM stretch.", playAt: 3030, playEnd: 3745 }),
      lastWord: Object.freeze({ at: 4210, end: 4622, label: "THE SPORTS GRAVEYARD", topic: "the FAM gets the room home", body: "Play from 1:10:10. Football, Kentucky sports fantasies, Talladega Nights, and a final dog-health blessing close the show.", playAt: 4210, playEnd: 4622 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
