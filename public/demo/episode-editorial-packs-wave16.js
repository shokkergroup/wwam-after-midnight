(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* July 9, 2026: bounded to the local Whisper ledger and canonical audio pass. */
  sources["ag3axSC9BpU"] = Object.freeze({
    sourceId: "ag3axSC9BpU",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 12360,
      captionWords: 3053,
      captionEvents: 3053,
      captionSpanSeconds: 12359.88,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:cedb2ab6ba5794561af1736734014851aee378b119457779e54856837057d699",
      captionSourceKind: "local-whisper-transcript",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE DIGITAL LEASH, THE MICHAEL MYERS GAME, AND THE WOLF PACK",
    badge: "FULL SHOW WIKI // 3:26 OF OWNERSHIP PANIC",
    headline:
      "SONY TAKES THE DISC AWAY, MARVEL GETS FIRED, AND LOOMIS OPENS A BATMAN AUDITION.",
    deck:
      "A live movie-news room starts by tanning its buttholes for porn-star preparation, then spends the night asking who owns a game after Sony stops making discs. The detours hit the Steam Machine price tag, Citizen Vigilante, the Halloween game, Evil Dead Burn, Marvel's universe fatigue, a horror-origin story, and one of the filthiest Loomis/Challis fan prompts in the archive.",
    overview:
      "The July 9 tape has a deceptively clean spine: ownership, franchise fatigue, and the question of whether a cool idea can survive a studio's need to turn it into a universe. The opening is pure WWAM nonsense—rabies bills, Freedom Fuel, a World Cup grudge, and an essential butthole-tanning regimen—before the room gets serious about the DCU and James Gunn's need to make everything except a Batman movie. Sony's plan to stop manufacturing new PlayStation discs after 2028 turns the middle into a genuine consumer-rights rant: a digital license is not the same thing as owning the game, and the audience knows exactly who can pull the plug. A Steam Machine price check and the Patreon video-store build keep that argument connected to how people actually play and collect things. The trailer/news run then swings from Citizen Vigilante's ugly premise to the surprisingly gorgeous Halloween game, with Michael Myers clown skins immediately sentenced to the garbage. Avengers: Doomsday, Dune, Evil Dead Burn, Scream 7 and The Last Jedi all become evidence in the same case: make one good movie, stop forcing every story into a corporate reunion tour, and let horror be strange again. The back end is the real WWAM payoff—how the hosts became horror fans, whether they could remake Halloween in a cabin, a dog playlist, and a fan-written Loomis/Challis/Diddy exchange that turns the sign-off into an adults-only radio play.",
    story: Object.freeze([
      { at: 0, end: 899, label: "FREEDOM FUEL AND THE BUTTHOLE-TANNING ECONOMY", body: "The show begins with rabies bills, Freedom Fuel, a World Cup complaint and a plan to tan the hosts' buttholes into porn-star readiness. The chaos is not filler; it establishes that every serious franchise argument will be interrupted by a body part, a gas station or Jean-Claude Van Damme." },
      { at: 900, end: 1799, label: "THE DCU WILL DO ANYTHING BUT BATMAN", body: "Mr. Terrific, Jimmy Olsen and the promise of more side projects put James Gunn on trial. The hosts argue that Man of Tomorrow's box office is the real test of whether Warner Bros. keeps the current plan, while the room keeps asking why Batman and Wonder Woman are always waiting in the hallway." },
      { at: 1800, end: 2699, label: "SONY REMOVES THE DISC FROM THE ROOM", body: "Sony's planned post-2028 move away from new PlayStation discs becomes the night's clearest anger. The complaint is simple: a digital storefront can revoke access, change terms or disappear, so calling a rental license ownership is corporate gaslighting with an $80 price tag." },
      { at: 2700, end: 3599, label: "THE STEAM MACHINE COSTS A SMALL CAR", body: "The Steam Machine price, a Trumpbox joke and the Patreon video-store build turn the ownership argument into a shopping nightmare. The hosts still want a physical library, but the future keeps presenting itself as a $1,049 appliance with a subscription attached." },
      { at: 3600, end: 4499, label: "SEVEN DAYS SOBER AND CITIZEN VIGILANTE ARRIVES", body: "A trailer break becomes an honest account of panic after a hangover, then Citizen Vigilante arrives with Army Hammer, a racist premise and a director whose politics are impossible to ignore. The room can enjoy a provocative movie while still interrogating what it is actually selling." },
      { at: 4500, end: 5699, label: "THE DOG, THE GAME, AND MICHAEL MYERS' NEW COMMUTE", body: "The new dog gets its own sex-crime report before the Halloween game trailer takes over. The footage looks expensive, the Haddonfield map looks alive, and the hosts immediately reject the clown Michael skin because one dumb cosmetic can ruin an otherwise perfect horror atmosphere." },
      { at: 5700, end: 6899, label: "DOOMSDAY, DUNE, AND THE RETURN OF THE REUNION TOUR", body: "Avengers: Doomsday versus Dune becomes a test for superhero fatigue. The hosts want the old favorites to matter, but they also want Marvel to stop making every film a post-credit obligation and start making one-off stories people can actually want." },
      { at: 6900, end: 8099, label: "MARVEL NEEDS TO STOP BUILDING THE SAME HOUSE", body: "The argument gets sharper: Blade, Ghost Rider and Kingpin could work if they were allowed to be rated-R, self-contained and character-first. The Evil Dead Burn discussion then asks whether gore without a clear vision is enough to carry a franchise." },
      { at: 8100, end: 9299, label: "EVIL DEAD BURN MEETS THE HORROR ORIGIN STORY", body: "The room tries to separate bad lighting from a bad movie, weighs Burn against Inferno, and then answers the fan question about the film that made them horror people. Nightmare on Elm Street and Scream become personal history, not just content categories." },
      { at: 9300, end: 10499, label: "SNYDER, CAPE FEAR, AND THE MOVIES YOU SHOULD HAVE SEEN", body: "Fan questions turn into a Cape Fear verdict, a Die Hard-versus-A Few Good Men comparison and a confession that somebody has not seen a movie the room considers mandatory. The comedy spike comes from the certainty of the accusation, not from a manufactured punchline." },
      { at: 10500, end: 11499, label: "THE WOLF PACK CASTS BATMAN", body: "A Mark Wahlberg question opens the door to Corey Feldman, Charlie Sheen, The Wolf Pack and a full imaginary Batman audition. The hosts use the bit to pitch what their own channel-native superhero movie would sound like if Prince had to score it." },
      { at: 11500, end: 12360, label: "THE CABIN, THE PORGS, AND LOOMIS DIDDY'S LAST CALL", body: "The hosts discover they might actually enjoy producing a Halloween remake if they only had to build the story. Then Star Wars Porgs, a same-time drink betrayal and a fan's Loomis/Challis/Cult 45 prompt turn the goodbye into a filthy sketch that refuses to end politely." },
    ]),
    highlights: Object.freeze([
      { at: 34, end: 47, category: "WWAM UP IN YA", label: "THE SHOW WHERE WE TAN OUR BUTTHOLES", excerpt: "The opening thesis is not a movie opinion. It is a porn-star preparation plan involving aggressive sun exposure and no adult supervision." },
      { at: 226, end: 230, category: "THE ROOM BREAKS", label: "BELGIUM'S NATIONAL HERO IS THE SIDELINE MASCOT", excerpt: "Jean-Claude Van Damme becomes the only Belgian export the hosts believe could rescue a soccer match." },
      { at: 335, end: 339, category: "WWAM UP IN YA", label: "WHY DIDN'T ANYONE TELL HIM EARLIER", excerpt: "A plot-hole complaint is delivered with the fury of someone discovering the movie hid the obvious answer on purpose." },
      { at: 533, end: 538, category: "THE ROOM BREAKS", label: "THE CRAZY PERSON WAS REAL", excerpt: "A strange anecdote gets tested against reality and fails the moment the room remembers how people actually behave." },
      { at: 715, end: 723, category: "TAKE GETS NUCLEAR", label: "THE HALLOWEEN GAME FINALLY ENTERS THE ROOM", excerpt: "The game reveal gets treated like a real franchise event before the hosts have even seen the full single-player plan." },
      { at: 861, end: 869, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "JAMES GUNN RUMOR COURT", excerpt: "A casting rumor becomes evidence in the larger argument that DC keeps avoiding the characters people actually came to see." },
      { at: 1050, end: 1060, category: "TAKE GETS NUCLEAR", label: "A BILLION DOLLARS OR THE JOB IS GONE", excerpt: "Man of Tomorrow's box office is framed as the hard number that decides whether the current DC plan survives." },
      { at: 1275, end: 1283, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE GOOD NEWS HAS BEEN MISSING FOR A MONTH", excerpt: "The room cannot remember the last DC update that felt like a genuinely good idea." },
      { at: 1706, end: 1714, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "EA GETS COMPARED TO A HOOKER", excerpt: "A complaint about consumer choice turns into a comparison EA would never put in an investor presentation." },
      { at: 2005, end: 2014, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "DIGITAL OWNERSHIP IS A LEASH", excerpt: "Sony's plan is described as taking away the thing customers paid for while keeping the storefront in charge forever." },
      { at: 2343, end: 2351, category: "WWAM UP IN YA", label: "THE GRAPHICAL UPDATE IS TINY ON PURPOSE", excerpt: "A tiny update becomes the perfect symbol for how a corporation can call a small concession progress." },
      { at: 2692, end: 2700, category: "THE ROOM BREAKS", label: "TEN BILLION PROBIOTICS ENTER THE GULLET", excerpt: "A suspicious beer-health pitch arrives while the room is already arguing about hardware prices." },
      { at: 2863, end: 2871, category: "THE ROOM BREAKS", label: "THE GARAGE BEER LABEL GETS ITS CLOSE-UP", excerpt: "A sponsor-looking can becomes the night's accidental product placement and the target of a garage-slut accusation." },
      { at: 3498, end: 3513, category: "THE ROOM BREAKS", label: "THE WEDDING TRUST AUDIT", excerpt: "A wedding anecdote gets judged by whether the bride trusts the groom, and the answer arrives like a courtroom verdict." },
      { at: 3749, end: 3757, category: "WWAM UP IN YA", label: "THE SEVEN-DAY HANGOVER BUFFER", excerpt: "The hosts treat a panic attack after a modest drinking night like a medical disaster documentary with no doctor present." },
      { at: 4173, end: 4181, category: "TAKE GETS NUCLEAR", label: "CITIZEN VIGILANTE'S PREMISE GETS PUT ON TRIAL", excerpt: "Army Hammer's comeback movie is discussed as a provocation that may be more politically ugly than its marketing admits." },
      { at: 4580, end: 4590, category: "WWAM UP IN YA", label: "THE PUPPY WANTS THE ARM", excerpt: "A puppy-training story is reclassified as a full-time sexual assault on an adult's forearm." },
      { at: 5053, end: 5061, category: "TAKE GETS NUCLEAR", label: "THE HALLOWEEN GAME BUDGET QUESTION", excerpt: "The trailer looks good enough to force the question nobody wants to answer: how much did this thing cost?" },
      { at: 5378, end: 5386, category: "CHARACTER SIGNAL", label: "MICHAEL MYERS GETS A CLOWN SKIN", excerpt: "The hosts reject the cosmetic immediately because a stupid outfit can break the Haddonfield spell." },
      { at: 5600, end: 5610, category: "THE ROOM BREAKS", label: "MICHAEL MYERS PLAYS BASKETBALL", excerpt: "A callback to an older Michael Myers video turns the game discussion into a fantasy of murder-ball and a perfect hoop." },
      { at: 6382, end: 6390, category: "TAKE GETS NUCLEAR", label: "DOOMSDAY, DUNE, AND DOOM ON ONE CALENDAR", excerpt: "Three enormous releases on neighboring dates become the year's clearest superhero-fatigue measurement." },
      { at: 6710, end: 6718, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE REUNION TOUR HAS RUN OUT OF SONGS", excerpt: "The room argues that Marvel keeps selling nostalgia where a new movie should be." },
      { at: 6804, end: 6812, category: "TAKE GETS NUCLEAR", label: "SPIDER-MAN'S PLANET BLOWS UP", excerpt: "A Marvel tangent gets so inflated that even the sentence structure starts exploding like a multiverse event." },
      { at: 7200, end: 7220, category: "TAKE GETS NUCLEAR", label: "STOP MAKING EVERYTHING CONNECT", excerpt: "The hosts pitch one-off Blade, Ghost Rider and Kingpin stories instead of another universe-wide homework assignment." },
      { at: 7999, end: 8007, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "EVIL DEAD BURN GETS THE TASTE TEST", excerpt: "Burn, Rise and the rest of the franchise are ranked with the bluntness of people who have no reason to protect the brand." },
      { at: 8440, end: 8448, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "DIGITAL RELEASE OR DIGITAL LEASH", excerpt: "The release-date question drags the Sony ownership argument back into the room just when the horror debate gets interesting." },
      { at: 8671, end: 8680, category: "FAN SIGNAL", label: "THE CHAT WANTS A SCREAM 7 COMMENTARY", excerpt: "A fan request opens a future doorway and proves the audience is already planning the next archive entry." },
      { at: 8842, end: 8850, category: "TAKE GETS NUCLEAR", label: "WONDER WOMAN VERSUS BATMAN WITH LIGHTSABERS", excerpt: "A fan battle combines DC icons and Star Wars weapons before either host can ask for sensible rules." },
      { at: 9010, end: 9018, category: "FAN SIGNAL", label: "NIGHTMARE 4 IS A HORROR ORIGIN STORY", excerpt: "The hosts answer the question personally: Nightmare on Elm Street started the obsession, while Scream later made it a lifestyle." },
      { at: 9701, end: 9709, category: "THE ROOM BREAKS", label: "DIE HARD AND A FEW GOOD MEN GET COMPARED", excerpt: "A fan forces an impossible movie choice and gets a courtroom answer instead of a safe one." },
      { at: 9764, end: 9772, category: "THE ROOM BREAKS", label: "YOU HAVE NEVER SEEN THAT MOVIE", excerpt: "The accusation lands with the full authority of a friend who cannot believe the other friend survived this long without seeing it." },
      { at: 10140, end: 10148, category: "FAN SIGNAL", label: "SCREAM 7 GETS A FUTURE DOOR", excerpt: "The audience asks for a commentary before the movie has even settled into the culture, and the hosts leave the door open." },
      { at: 10800, end: 10820, category: "FAN SIGNAL", label: "THE GHASTLY GHOUL GIFTS THE ROOM", excerpt: "A gifted membership becomes a community receipt, with the hosts stopping the movie talk to thank the person who keeps showing up." },
      { at: 11090, end: 11098, category: "WWAM UP IN YA", label: "THE CHAT MAKES A FREAK CONFESSION", excerpt: "A fan's message gets read back as a self-own and the room immediately decides it needs a worse punchline." },
      { at: 11275, end: 11283, category: "THE ROOM BREAKS", label: "THE DOG HAS A PLAYLIST", excerpt: "A fan claims to have made a playlist for the puppy, turning dog chaos into a recurring character with its own soundtrack." },
      { at: 11600, end: 11612, category: "FAN SIGNAL", label: "STEAM BATH WITH THE BOYS", excerpt: "Michael Parton's Steam Machine message becomes a pun that the room is too tired to resist." },
      { at: 11700, end: 11724, category: "TAKE GETS NUCLEAR", label: "A CABIN WEEK TO REMAKE HALLOWEEN", excerpt: "The hosts discover that producing a Halloween story together sounds fun as long as somebody else handles the actual movie set." },
      { at: 12090, end: 12110, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE PORGS ARE THE LAST JEDI'S BEST DEFENSE", excerpt: "A Star Wars fan tries to rescue The Last Jedi with Porgs and gets a response that is almost less charitable than the film." },
      { at: 12180, end: 12224, category: "CHARACTER SIGNAL", label: "LOOMIS DIDDY AND CHALLIS TAKE THE CULT 45", excerpt: "A fan prompt turns Loomis and Challis into an adults-only radio play about a drink, a hookup and absolutely no medical ethics." },
      { at: 12248, end: 12256, category: "THE ROOM BREAKS", label: "THE GREATEST SONG IN AMERICAN HISTORY", excerpt: "The sign-off finds one last musical hill to die on before the show finally admits it has to end." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 5378, end: 5660, label: "THE HALLOWEEN GAME REVEAL", topic: "Michael Myers, Haddonfield and the map", body: "This is the cleanest excitement spike in the whole tape: the game finally looks like a real Haddonfield, the wind and houses feel alive, and the hosts immediately start policing the details that could break the spell.", playAt: 5378, playEnd: 5660 }),
      hated: Object.freeze({ at: 2005, end: 2075, label: "SONY'S DIGITAL LEASH", topic: "losing the right to own new PlayStation games", body: "The anger is specific and earned. A disc is a thing you can keep; a digital license is a corporation promising not to change its mind. The room refuses to call that the same product.", playAt: 2005, playEnd: 2075 }),
      wildestDetour: Object.freeze({ at: 12180, end: 12224, label: "LOOMIS DIDDY AND CHALLIS", topic: "a fan-written adults-only character prompt", body: "The final fan prompt is the perfect WWAM detour: recurring characters, a cheap drink, a fake confession and enough sexual chaos to make the rest of the show feel like a responsible documentary.", playAt: 12180, playEnd: 12224 }),
      lastWord: Object.freeze({ at: 12248, end: 12320, label: "THE SONG AND THE GOODBYE", topic: "music, community and finally ending the stream", body: "The room refuses a clean exit, thanks the fans, argues about a song and leaves the audience with the same promise as always: next week will be worse.", playAt: 12248, playEnd: 12320 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
