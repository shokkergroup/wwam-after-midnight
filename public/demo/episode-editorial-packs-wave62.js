(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* November 22, 2025: full-tape read of the Hellraiser game-trailer stream. */
  sources["34BwSiucNEI"] = Object.freeze({
    sourceId: "34BwSiucNEI",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 10212,
      captionWords: 4872,
      captionEvents: 537,
      captionSpanSeconds: 10012.24,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:2403e05368bdb27e00f08c918b38035ab6bfb4cd75a269f5b3032f86deccdc9e",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "b191af7cfcbecd5d64013845f30612793907feae5ae51e9fa018853ccf502dde",
      asrWindowCount: 44,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE! HELLRAISER GAME TRAILER, MOVIE NEWS, AND MORE // PINHEAD, CHRISTMAS CURSES, AND THE FAM AFTER DARK",
    badge: "FULL SHOW WIKI // 2:50:12 OF HELLRAISER GAME HYPE, SUPERHERO COMICS, AWKWARD DATES, DERRY RAGE, AND WINE-POWERED SIGN-OFFS",
    headline: "PINHEAD GETS A DAY-ONE GAME, THEN THE STREAM DESCENDS INTO AWKWARD DATES, STOLEN DVDS, DERRY FRUSTRATION, AND THE MOST DANGEROUS WINE MONOLOGUE IN THE ARCHIVE.",
    deck:
      "A Friday-night hangout that begins with a cringe-video cold open and a Hellraiser game trailer, then keeps opening trapdoors: Doug Bradley returning as Pinhead, Venom and Wolverine, the Death of Superman, an Art the Clown game, Christmas gifts, a first-date disaster, a herpes reveal, Welcome to Derry fatigue, Wonder Woman casting, Scream 7 anticipation, and the FAM steering every turn.",
    overview:
      "This is the WWAM live room with the safety rails removed. The opening minutes are a deliberately awful viral-video autopsy, complete with a disappearing voice, a cat interruption, and the hosts trying to explain why the clip's romantic gesture feels like a spinal injury. Then the tape finds its spine: a Hellraiser game trailer that earns an immediate day-one purchase, Doug Bradley's return as Pinhead, and a visual gag so filthy that the hosts wonder whether the character is organizing an orgy. The game lane branches into Wolverine, Venom, the Art the Clown side-scroller, and a plan to play it together on Patreon. The middle of the night is pure WWAM autobiography: an Ariana Grande doll as a cursed Christmas present, a date that supposedly cost $8.53, a motel escape after a herpes warning, an awkward Superman Returns date, teenage theft, stolen DVDs, and a wine confession that ends with burps, wieners, and a gastrointestinal threat. Movie news keeps punching through: the Death of Superman comic, practical Teenage Mutant Ninja Turtles, Welcome to Derry frustration, Jake Paul fight skepticism, Patty Jenkins and Wonder Woman, Courtney Love casting, and the hype for Scream 7. Fans are the connective tissue. Cheney, Austin, Dr. Corndog, Lemon Press, Michael Parton, Jeremy Shelley, and others turn the episode into a shared table where every question can become a new bit. The sign-off finally happens only after the room admits the wine has won. The game trailer was the excuse; the actual show is two friends and a FAM turning every detour into usable lore.",
    story: Object.freeze([
      { at: 0, end: 1900, label: "THE CRINGE COLD OPEN AND THE CAT INTERRUPTION", body: "The stream opens by dissecting an excruciating romantic-video clip, loses a voice, pauses for a cat, and lets the audience watch the hosts recover in real time. It is a perfect warning that this will not be a tidy movie-news show." },
      { at: 1901, end: 3200, label: "HELLRAISER'S BOX OPENS AND PINHEAD RETURNS", body: "The Hellraiser game trailer supplies the night's cleanest shared enthusiasm. A day-one purchase is declared, Doug Bradley's return as Pinhead gets celebrated, and the visual design becomes an excuse for increasingly filthy Cenobite jokes." },
      { at: 3201, end: 4100, label: "MOVIE NEWS, PRACTICAL TURTLES, AND THE ART THE CLOWN GAME", body: "The hosts jump from a Friendsgiving invitation to practical-versus-CG Teenage Mutant Ninja Turtles, the Death of Superman comic, and an Art the Clown side-scroller they intend to buy and play together." },
      { at: 4101, end: 4800, label: "THE COMIC-CROSSOVER SIDE DOOR", body: "A Power Rangers and Nightmare on Elm Street comic correction turns a game-trailer night into a quick catalog audit, with the hosts admitting the FAM sometimes remembers their own lore better than they do." },
      { at: 4801, end: 6700, label: "CURSED CHRISTMAS GIFTS, AWKWARD DATES, AND THE HERPES EXIT", body: "Ariana Grande becomes a cursed Christmas gift, then the story turns autobiographical: a cheap date, Superman Returns, a motel with no escape plan, a herpes warning, and a teenage theft story that eventually lands on stolen DVDs and regret." },
      { at: 6701, end: 8100, label: "WINE, BOWEL HORROR, AND WELCOME TO DERRY FATIGUE", body: "At the top of the hour the room combines a wine confession with a graphic bathroom detour. The mood then swings back to Welcome to Derry, where the hosts insist they want to like the show while admitting the latest episodes keep dropping the ball." },
      { at: 8101, end: 9300, label: "SCREAM 7, WONDER WOMAN, AND THE FAM'S MOVIE BOARD", body: "Scream 7 hype, Patty Jenkins and Wonder Woman 84, Courtney Love casting, and fan questions keep the news lane moving. Austin's mystery video is held for vetting while recurring chat names keep the room honest." },
      { at: 9301, end: 10212, label: "THE WINE WINS THE SIGN-OFF", body: "The last stretch is a soft landing disguised as a threat: the hosts toast the FAM, joke about the bathroom, promise Monday, and finally admit the episode is over after the room has already said goodbye several times." },
    ]),
    highlights: Object.freeze([
      { at: 172, end: 222, category: "BEST MOMENT", label: "THE CRINGE FACTOR BREAKS THE SPINE", excerpt: "A romantic viral clip is described as so painfully awkward that the hosts treat the cringe like a physical injury." },
      { at: 239, end: 289, category: "THE ROOM BREAKS", label: "THE CAT OWNS THE OPENING", excerpt: "The conversation stops because a cat is hovering over the setup, turning a movie-news intro into an accidental pet intervention." },
      { at: 309, end: 359, category: "WWAM UP IN YA", label: "BIG ENOUGH TO SHUT UP", excerpt: "A size joke lands with the exact bluntness that tells the audience what kind of Friday night this is going to be." },
      { at: 1900, end: 1950, category: "DEEP DIVE", label: "OPEN THE HELLRAISER BOX", excerpt: "The hosts finally stop circling the trailer and decide to watch the Hellraiser game footage together." },
      { at: 2034, end: 2084, category: "CHARACTER PERFORMANCE", label: "CHUBBY HAWKEYE AND LOOMIS", excerpt: "An archery purchase becomes a Hawkeye bit, then Michael Myers is imagined firing at Loomis, reopening a favorite character lane.", characters: ["Dr. Loomis"] },
      { at: 2231, end: 2281, category: "BEST MOMENT", label: "DAY-ONE PINHEAD", excerpt: "The game earns an immediate day-one purchase, with the room reacting like a long-lost Hellraiser fan club just got its console." },
      { at: 2248, end: 2298, category: "DEEP DIVE", label: "DOUG BRADLEY IS BACK", excerpt: "Doug Bradley's return as Pinhead is treated as the detail that makes the game feel like a real Hellraiser event." },
      { at: 2495, end: 2545, category: "WWAM UP IN YA", label: "PINHEAD RUNS THE ORGY", excerpt: "The trailer's bar image is turned into a filthy theory about Pinhead organizing the room's most cursed party." },
      { at: 2555, end: 2605, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE EYES ARE NOT THE PROBLEM", excerpt: "The Cenobite design gets anatomized as a perversion so committed that the hosts decide the original artist should be investigated." },
      { at: 2630, end: 2680, category: "WWAM UP IN YA", label: "THE HOT RAP ALBUM OF HELL", excerpt: "A Hellraiser figure turns around like it is about to drop the hottest rap album of 2026, a perfect visual read of the trailer's swagger." },
      { at: 2840, end: 2890, category: "DEEP DIVE", label: "WOLVERINE, VENOM, AND THE CARPENTER RECEIPT", excerpt: "Insomniac's Wolverine and a possible Venom game open a Marvel side door, followed by the annual complaint that John Carpenter never gets enough respect." },
      { at: 2942, end: 2992, category: "TAKE GETS NUCLEAR", label: "PINHEAD ON HBO", excerpt: "The possibility of Doug Bradley reprising Pinhead in a larger Hellraiser project gets treated as the obvious next move." },
      { at: 3191, end: 3241, category: "WWAM UP IN YA", label: "FRIENDSGIVING GOES TO THE NAUGHTY JUNGLE", excerpt: "A simple Friendsgiving invitation mutates into Taco Bell, wine, and a fictional trip to the Naughty Jungle." },
      { at: 3548, end: 3598, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "PRACTICAL TURTLES OR NOTHING", excerpt: "The room refuses another fully CG Teenage Mutant Ninja Turtles movie and sends Hollywood's shortcut directly to Steve's asshole." },
      { at: 3761, end: 3811, category: "DEEP DIVE", label: "THE DEATH OF SUPERMAN COMIC", excerpt: "The hosts revisit the Death of Superman as a best-selling comic, then explain how mass printing helped destroy its collector value." },
      { at: 3938, end: 3988, category: "DEEP DIVE", label: "ART THE CLOWN GETS A GAME", excerpt: "An Art the Clown side-scroller enters the news lane and immediately becomes a purchase-and-review promise." },
      { at: 4021, end: 4071, category: "FAN SIGNAL", label: "PLAY IT TOGETHER ON PATREON", excerpt: "The game talk becomes a community plan: buy it now, learn the controls, then play it together with the FAM." },
      { at: 4050, end: 4100, category: "CHARACTER PERFORMANCE", label: "DR. CORNDOG REOPENS THE CASE", excerpt: "A Dr. Corndog readout keeps the recurring character universe alive while the hosts are still arguing about games.", characters: ["Dr. Corndog"] },
      { at: 4951, end: 5001, category: "WWAM UP IN YA", label: "THE CURSED ARIANA GRANDE DOLL", excerpt: "An animated Ariana Grande doll becomes a Christmas gift so cursed that even the recipient suspects it needs its own warning label." },
      { at: 5071, end: 5121, category: "FAN SIGNAL", label: "THE POWER RANGERS COMIC CORRECTION", excerpt: "A fan question about a crossover comic catches the hosts misremembering their own catalog, then turns the correction into a new reading list." },
      { at: 5121, end: 5171, category: "BEST MOMENT", label: "THE EIGHT-DOLLAR-DATE RECEIPT", excerpt: "The most money ever spent trying to get laid is given as $8.53, followed by the astonishing claim that it worked." },
      { at: 5193, end: 5243, category: "FAN SIGNAL", label: "SUPERMAN RETURNS AS A DATE MOVIE", excerpt: "An awkward college-age date is salvaged by dragging someone to Superman Returns, an extremely WWAM solution to social failure." },
      { at: 5577, end: 5627, category: "BEST MOMENT", label: "THE HERPES EXIT", excerpt: "A date story reaches its emergency exit when one brother warns that the woman wants to finish the deal and has herpes." },
      { at: 5900, end: 5950, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "MOTEL 7 OR NOTHING", excerpt: "The story's escape plan collapses into having no money, no ride, and nowhere to go except the Motel 7." },
      { at: 6320, end: 6370, category: "DEEP DIVE", label: "THE STOLEN-DVD CONFESSION", excerpt: "The theft story finally gets a moral boundary: stolen business DVDs were one thing, but stealing from a person felt different." },
      { at: 6462, end: 6512, category: "WWAM UP IN YA", label: "KNOCK, HIDE, AND SCARE THE NEIGHBORS", excerpt: "A teenage prank becomes a confession that the hosts once knocked on doors and hid in bushes to watch strangers panic." },
      { at: 6610, end: 6660, category: "BEST MOMENT", label: "THE WINE MONOLOGUE", excerpt: "The top-of-the-hour wine speech escalates from a drink recommendation into burps, wieners, and a promise that the night is not under control." },
      { at: 6738, end: 6788, category: "FAN SIGNAL", label: "THE FAM KEEPS THE CLIP ALIVE", excerpt: "Lemon Press and Gary's messages turn an earlier viral-video segment into a callback that the room refuses to let die." },
      { at: 7293, end: 7343, category: "TAKE GETS NUCLEAR", label: "WELCOME TO DERRY IS DROPPING THE BALL", excerpt: "The hosts defend their right to criticize Derry while pointing out that wanting to like a show is not the same as pretending every episode works." },
      { at: 7476, end: 7526, category: "WWAM UP IN YA", label: "THE DEMON ROCK", excerpt: "A question about a massive bowel movement becomes a story about a demon rock leaving the body like broken glass." },
      { at: 7898, end: 7948, category: "TAKE GETS NUCLEAR", label: "JAKE PAUL FIGHT SKEPTICISM", excerpt: "The hosts predict the fight may never happen, even if both men are eventually standing in the same ring." },
      { at: 7911, end: 7961, category: "FAN SIGNAL", label: "MICHAEL PARTON ON WONDER WOMAN", excerpt: "Michael Parton's question opens a Wonder Woman lane and gives the room permission to drag Wonder Woman 84 again." },
      { at: 8440, end: 8490, category: "DEEP DIVE", label: "COURTNEY LOVE CASTING", excerpt: "Courtney Love is floated as a casting possibility, then immediately receives the kind of dangerous character note only this show would pitch." },
      { at: 8579, end: 8629, category: "FAN SIGNAL", label: "SCREAM 7 IS READY TO BLOW THE COCK OFF", excerpt: "The Scream 7 hype lane arrives with a fan card, a filthy promise, and the hosts asking whether an incoming video is safe to show." },
      { at: 8630, end: 8680, category: "CHARACTER PERFORMANCE", label: "DR. CORNDOG TAKES THE ALIEN CALL", excerpt: "Dr. Corndog answers an alien message and threatens the room with a banana smoothie, another clean recurring-character receipt.", characters: ["Dr. Corndog"] },
      { at: 8946, end: 8996, category: "FAN SIGNAL", label: "CHENEY'S HALLOWEEN BLU-RAY CONFESSION", excerpt: "Cheney's message about stealing a Halloween Blu-ray collection and asking Jay to game ties the archive's Halloween and gaming lanes together." },
      { at: 8956, end: 9006, category: "DEEP DIVE", label: "THE TWITCH PROBLEM", excerpt: "The hosts consider Twitch as the only serious gaming home, then immediately question whether the platform will still be around." },
      { at: 9946, end: 9996, category: "BEST MOMENT", label: "THE FAM GETS THE LAST TOAST", excerpt: "The hosts finally stop pretending the stream is ending, thank the FAM, and toast the night before the bathroom gag returns." },
      { at: 9981, end: 10031, category: "WWAM UP IN YA", label: "ENJOY YOUR PISS", excerpt: "The goodnight message collapses into a final bathroom image, ensuring the episode leaves the room exactly as unhinged as it entered." },
      { at: 10003, end: 10053, category: "FAN SIGNAL", label: "AUSTIN LAFUCK GETS THE LAST WORD", excerpt: "Austin LaFuck is still present in the final sign-off, a last name-check before the archive door closes." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2231, end: 2281, label: "DAY-ONE PINHEAD", topic: "the cleanest shared enthusiasm", body: "Play from 37:11. The Hellraiser game trailer earns the rare WWAM call of day-one purchase, with Doug Bradley's return sealing it.", playAt: 2231, playEnd: 2281 }),
      hated: Object.freeze({ at: 7293, end: 7343, label: "WELCOME TO DERRY DROPS THE BALL", topic: "the criticism beneath the fandom", body: "Play from 2:01:33. The hosts explain that criticizing Derry is not the same as hating everything; they want the show to get better.", playAt: 7293, playEnd: 7343 }),
      wildestDetour: Object.freeze({ at: 5577, end: 5627, label: "THE HERPES EXIT", topic: "the date story that leaves the rails", body: "Play from 1:32:57. A brother's warning turns a date anecdote into an emergency exit and one of the night's most memorable stories.", playAt: 5577, playEnd: 5627 }),
      lastWord: Object.freeze({ at: 9981, end: 10031, label: "ENJOY YOUR PISS", topic: "the sign-off that refuses dignity", body: "Play from 2:46:21. The hosts thank the FAM, promise Monday, and leave on the only possible final image: a bathroom joke.", playAt: 9981, playEnd: 10031 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
