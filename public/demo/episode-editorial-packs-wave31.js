(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* March 21, 2026: a complete local audio/caption read of the movie-news
   * room. This pack deliberately separates reported news, fan theories,
   * recurring bits, and the show's long late-night community tail. */
  sources["yL8sO_EjWOI"] = Object.freeze({
    sourceId: "yL8sO_EjWOI",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 12120,
      captionWords: 44884,
      captionEvents: 13924,
      captionSpanSeconds: 12119.004,
      captionDurationCoveragePercent: 99.99,
      captionSha256:
        "sha256:8a79eaa1bbc5809849946f9a6f868d59f1c090481701ca4cfe16b8c4394336e7",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256:
        "9f8230c55a7493a59fe3baa07e4506d884876ef76a649ee6b2f1774c52a9e4ee",
      asrWindowCount: 79,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "MOVIE NEWS, BAD AI, LOOMIS AT THE WIENER DOCTOR",
    badge: "FULL SHOW WIKI // 3:22:00 OF MOVIE-NEWS WHIPLASH",
    headline:
      "SPIDER-MAN GETS A TRILOGY PITCH, JAMIE LEE CURTIS PUTS HALLOWEEN ON TRIAL, AND THE CHAT SENDS LOOMIS TO THE WIENER DOCTOR.",
    deck:
      "A sprawling March 21 room that moves from Chuck Norris memes and Spider-Man 4 to AI resurrecting Val Kilmer, Bloodsport remakes, Scream 8, Jason, Hellraiser, Best of the Best, fan grief, and a late-night video-store game discovery.",
    overview:
      "This is the WWAM movie-news format at full stretch: the show starts with Chuck Norris death jokes and March Madness, then spends the first act arguing over Spider-Man 4, Venom, Sam Raimi, the Punisher, and whether a trailer can be exciting while still looking like a bad video game. The middle gets more serious without losing the filth. Jamie Lee Curtis's comments about the Halloween trilogy become a referendum on Laurie Strode, Val Kilmer's AI recreation becomes a family-consent and labor conversation, and a Bloodsport remake is welcomed until the studio name appears. The late tape is a community memory machine: Lee 'The Machine' Bowers sends a Loomis/Challis medical appointment, a viewer shares the loss of a dog, fans pitch Tales from the Box and an elderly action-movie marathon, and the room debates Jason, Pinhead, Best of the Best, John Wick, Michael Myers, Superman, and Scream. By the end, the guys are talking about Mayday Parker, a video-store simulator, Burton versus Muschietti, The Cure, and an intricate battle-ready fan display. It is long, messy, unexpectedly tender, and very much alive.",
    story: Object.freeze([
      { at: 0, end: 599, label: "CHUCK NORRIS DEFEATS LIFE", body: "The cold open turns Chuck Norris's death into a pile of increasingly absurd internet eulogies before the room settles into dinner, dogs, Miller Lite, and the fact that a movie-news show can begin anywhere." },
      { at: 600, end: 1199, label: "MARCH MADNESS AND THE STREAM RULES", body: "Bracket talk, a close basketball game, and a promise to read every Super Chat establish the room's operating rules. They also warn that watching trailers has already gotten a stream shut down by Marvel, so the audience is invited to stick around if the internet catches fire." },
      { at: 1200, end: 1799, label: "SPIDER-MAN 4 OPENS THE PORTAL", body: "A Spider-Man trailer becomes the first major argument: Peter Parker's memory, Venom, mutation, and a strange new body-horror lane are weighed against the hope of a real Sam Raimi sequel." },
      { at: 1800, end: 2399, label: "RAIMI GETS THE COMPETENCY VOTE", body: "The hosts argue that Sam Raimi understands Spider-Man's crevices better than the current director, then sketch a focused Spider-Man/Venom trilogy without the chair-guy noise that swallowed earlier movies." },
      { at: 2400, end: 2999, label: "THE PUNISHER WANTS TO SWEAR", body: "The Punisher discussion becomes a ratings and character-fidelity argument. The room does not need constant profanity, but it does need Frank Castle to feel like Frank Castle, not a sanitized man in a costume." },
      { at: 3000, end: 3599, label: "THE GAME, THE TRAILER, AND THE STALL", body: "A horror-game detour and a Warner-related trailer keep the room bouncing between movie news and audience requests. The guys refuse to spoil a game for each other, which turns silence and microphone discipline into comedy." },
      { at: 3600, end: 4199, label: "ROBERT PATTINSON WALKS THROUGH THE SMOKE", body: "A first-look image and a Robert Pattinson comparison produce a Batman detour, a joke about the actor being left alone with his own devices, and a reminder that even a two-second shot can send the chat into production design." },
      { at: 4200, end: 4799, label: "LOOMIS GETS A WIENER DOCTOR APPOINTMENT", body: "Lee 'The Machine' Bowers arrives with a huge Super Chat, a Loomis/Challis medical appointment, and a request for an intro song about farting. Jamie Lee Curtis's Halloween comments then become the next major headline." },
      { at: 4800, end: 5399, label: "LAURIE STRODE CANNOT BE THE WHOLE UNIVERSE", body: "Jamie Lee Curtis saying she did not know Halloween 2018 was the start of a trilogy is treated as an indictment of the plan. The room asks whether Michael Myers can exist without the Strode family and then turns the convention fantasy into a job interview." },
      { at: 5400, end: 5999, label: "VAL KILMER AND THE AI LINE", body: "Sports celebration gives way to a Val Kilmer first look and a difficult question: if the estate agrees to an AI performance for a film he was already cast in, where should the audience draw its ethical line?" },
      { at: 6000, end: 6599, label: "BLOODSPORT GETS A STUDIO WARNING", body: "The guys support a family-consented AI completion in principle while still saying they do not want AI to replace human work. A Bloodsport remake with Jean-Claude Van Damme recreated by AI sounds exciting until the studio attached to it appears." },
      { at: 6600, end: 7199, label: "SCREAM, FEEL-GOOD MOVIES, AND THE CAMERA DISASTER", body: "Scream 8, a wholesome Apple TV-style project, and a camera change collide. Kevin Williamson's possible return as a writer or director gets support while the room tries to recover from a technical wreck." },
      { at: 7200, end: 7799, label: "JASON IS STILL IN THE LAKE", body: "Friday the 13th and Jason talk turns into a rights-and-revival reality check. Hellraiser then arrives with the more practical problem: Doug Bradley may want Pinhead back, but the makeup chair is a brutal opponent." },
      { at: 7800, end: 8399, label: "TALES FROM THE BOX GETS A DIRTY PITCH", body: "The hosts imagine a Tales from the Box anthology in a Tales from the Crypt shape, then immediately admit the title could also describe pornography. A fan's dog-loss message changes the temperature and the room makes space for grief." },
      { at: 8400, end: 8999, label: "BEST OF THE BEST MOPS THE FLOOR", body: "A martial-arts argument turns into a full recommendation for Best of the Best, followed by the kind of adolescent body joke that makes a movie-history conversation impossible to summarize politely." },
      { at: 9000, end: 9599, label: "ACTION MOVIES, MYERS, AND PRIVATE JUDGMENT", body: "Death Wish, Bronson, John Wick versus 2007 Michael Myers, and memories of Eminem become a single argument for choosing things because you actually like them rather than because a crowd tells you what to think." },
      { at: 9600, end: 10199, label: "SUPERMAN GETS THE HEART", body: "The room criticizes people who outsource every opinion, then turns sincere about Superman, Pa Kent, and the scenes that still make grown adults cry. The emotional lane is not separate from the comedy; it is what gives it weight." },
      { at: 10200, end: 10799, label: "MAYDAY PARKER AND THE VIDEO STORE GAME", body: "A fan pitches a Spider-Man 4 built around Mayday Parker and Miles Morales. Another viewer asks about a video-store simulator, and the hosts immediately begin planning the next Patreon game night." },
      { at: 10800, end: 11399, label: "GANGNAM STYLE, COLLATERAL, AND WAR GEAR", body: "The late room bounces through Gangnam Style, a theory about Jason Statham in Collateral, a battle-ready fan display, and the deeply WWAM practice of making a sincere question sound like a sex move." },
      { at: 11400, end: 12120, label: "BURTON, THE CURE, AND THE LONG GOODNIGHT", body: "Tim Burton is chosen over Andy Muschietti for a future project, the room revisits The Cure's 'Burn,' reads more fan messages, and closes with a promise that the audience's weirdness is part of what makes the nights special." },
    ]),
    highlights: Object.freeze([
      { at: 18, end: 48, category: "WWAM UP IN YA", label: "CHUCK NORRIS DEFEATED LIFE", excerpt: "The internet's tribute language gets immediately promoted to absurdist action-movie canon." },
      { at: 95, end: 125, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE JOURNALISTS ARE WORKING OVERTIME", excerpt: "A Chuck Norris legacy take is sent straight to the editorial furnace." },
      { at: 260, end: 300, category: "CREATOR MEMORY", label: "THE BLACKSTONE MILLER LITE DINNER", excerpt: "The pre-show routine becomes a tiny portrait of how a three-hour WWAM night actually begins." },
      { at: 680, end: 720, category: "FAN SIGNAL", label: "READ EVERY SUPER CHAT", excerpt: "The hosts make the community promise explicit: the late receipts will not be ignored." },
      { at: 1035, end: 1075, category: "TAKE GETS NUCLEAR", label: "MARVEL HAS ALREADY SHUT DOWN A STREAM", excerpt: "Trailer reactions become a technical-risk confession." },
      { at: 1280, end: 1320, category: "BEST MOMENT", label: "PETER PARKER FORGETS HIMSELF AGAIN", excerpt: "Spider-Man 4 opens with a memory premise that sends the room straight into emotional and body-horror speculation." },
      { at: 1510, end: 1550, category: "WWAM UP IN YA", label: "THE SPIDER DICK PHEROMONES", excerpt: "A mutation discussion takes a turn nobody would put in a studio synopsis." },
      { at: 1920, end: 1965, category: "TAKE GETS NUCLEAR", label: "SAM RAIMI DESERVES THE COMPETENCY VOTE", excerpt: "Raimi's understanding of the character is treated as the difference between a movie and a product meeting." },
      { at: 2290, end: 2335, category: "DEEP DIVE", label: "THE SPIDER-MAN / VENOM TRILOGY", excerpt: "The room strips away noise and pitches a focused trilogy instead." },
      { at: 2650, end: 2695, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE PUNISHER IS NOT A NANCY PANTS", excerpt: "Character fidelity gets explained in the least corporate language possible." },
      { at: 3085, end: 3130, category: "WWAM UP IN YA", label: "THE SCARY GAME SPOILER FIREWALL", excerpt: "One host refuses to spoil a horror game and turns secrecy into a full performance." },
      { at: 3660, end: 3700, category: "BEST MOMENT", label: "BATMAN LEFT ALONE WITH HIS DEVICES", excerpt: "Robert Pattinson's first look becomes a completely unscientific Batman diagnosis." },
      { at: 4250, end: 4300, category: "FAN SIGNAL", label: "LEE THE MACHINE BOOKS THE WIENER DOCTOR", excerpt: "Lee Bowers sends Loomis and Challis to a medical appointment, then asks for a fart intro song." },
      { at: 4350, end: 4395, category: "CHARACTER SIGNAL", label: "LOOMIS NEEDS CHALLIS AT THE DOCTOR", excerpt: "A recurring-character bit gets a precise new setting instead of a generic name-drop." },
      { at: 4520, end: 4560, category: "THE ROOM BREAKS", label: "THE MOVIE NEWS JINGLE", excerpt: "The fart request becomes a broadcast jingle before the actual Jamie Lee Curtis story." },
      { at: 4750, end: 4795, category: "TAKE GETS NUCLEAR", label: "JAMIE LEE CURTIS DID NOT KNOW IT WAS A TRILOGY", excerpt: "The Halloween trilogy begins its trial with one brutally useful quote." },
      { at: 4930, end: 4975, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "LAURIE STRODE IS NOT THE WHOLE FRANCHISE", excerpt: "The room asks whether Michael Myers can exist without the Strode family." },
      { at: 5145, end: 5190, category: "WWAM UP IN YA", label: "THE CONVENTION SIGNING JOB INTERVIEW", excerpt: "Meeting Jamie Lee Curtis is imagined as a job interview nobody can pass." },
      { at: 5580, end: 5625, category: "INDUSTRY READ", label: "VAL KILMER'S AI FIRST LOOK", excerpt: "A real ethical question arrives inside a movie-news headline." },
      { at: 5735, end: 5785, category: "SERIOUS ROOM", label: "THE ESTATE HAS TO SAY YES", excerpt: "The hosts draw a consent line around AI resurrection and refuse to attack a family that agreed." },
      { at: 6070, end: 6115, category: "TAKE GETS NUCLEAR", label: "BLOODSPORT GETS THE WRONG STUDIO", excerpt: "A remake sounds exciting until the attached studio makes everyone pump the brakes." },
      { at: 6665, end: 6710, category: "THE ROOM BREAKS", label: "SHAKING THAT ASS, CAMERA DISASTER", excerpt: "A camera change and a Scream discussion collide into the show's least graceful transition." },
      { at: 6785, end: 6830, category: "TAKE GETS NUCLEAR", label: "KEVIN WILLIAMSON SHOULD WRITE AGAIN", excerpt: "The room wants the franchise's original voice back in the room." },
      { at: 7280, end: 7325, category: "CHARACTER SIGNAL", label: "JASON IS STILL DROWNING", excerpt: "Friday the 13th rights talk gets translated into one depressing lake report." },
      { at: 7485, end: 7535, category: "DEEP DIVE", label: "DOUG BRADLEY VS THE MAKEUP CHAIR", excerpt: "Pinhead's return is treated as a practical labor problem, not a lack of affection." },
      { at: 7860, end: 7905, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "TALES FROM THE BOX COULD BE PORN", excerpt: "A Hellraiser anthology pitch is ruined and improved by the same title." },
      { at: 8040, end: 8090, category: "SERIOUS ROOM", label: "THE DOG LOSS MESSAGE", excerpt: "A viewer's grief changes the energy, and the hosts make room for it without rushing past." },
      { at: 8170, end: 8215, category: "FAN SIGNAL", label: "CHALLIS FILMS THE NEXT BEER CHUG", excerpt: "A fan suggests letting Challis document the next terrible drinking decision." },
      { at: 8490, end: 8535, category: "BEST MOMENT", label: "BEST OF THE BEST MOPS THE FLOOR", excerpt: "An under-discussed action classic gets a full-throated recommendation." },
      { at: 8730, end: 8775, category: "WWAM UP IN YA", label: "THE DICK-STRETCHING DETOUR", excerpt: "A martial-arts discussion goes somewhere no training manual has ever gone." },
      { at: 9030, end: 9075, category: "CREATOR MEMORY", label: "THE BRONSON MARATHON DOOR", excerpt: "A fan request becomes a plan to revisit an entire old action franchise." },
      { at: 9280, end: 9325, category: "CHARACTER SIGNAL", label: "JOHN WICK VS 2007 MICHAEL MYERS", excerpt: "The matchup is judged with a suburban-house rule set and no weapons." },
      { at: 9550, end: 9595, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THINK FOR YOURSELF, DAMMIT", excerpt: "The room attacks opinion-by-party-line while admitting movies still make everyone emotional." },
      { at: 9790, end: 9835, category: "BEST MOMENT", label: "PA KENT STILL GETS THE ROOM", excerpt: "Superman turns the late debate sincere and gives the audience a clean emotional door." },
      { at: 10235, end: 10285, category: "FAN SIGNAL", label: "MAYDAY PARKER ENTERS SPIDER-MAN 4", excerpt: "A fan pitches Mayday Parker, Miles Morales, and a Spider-Man future that actually grows." },
      { at: 10330, end: 10375, category: "DEEP DIVE", label: "THE VIDEO-STORE SIMULATOR", excerpt: "A viewer discovers the game that turns WWAM Video into a possible next Patreon night." },
      { at: 10840, end: 10885, category: "WWAM UP IN YA", label: "GANGNAM STYLE WILL NOT DIE", excerpt: "The song gets stuck in the room and threatens the sleeping schedule." },
      { at: 10945, end: 10990, category: "FAN SIGNAL", label: "COLLATERAL'S STATHAM THEORY", excerpt: "A fan's theory about Jason Statham's suit gets the full late-night audit." },
      { at: 11080, end: 11125, category: "COMMUNITY MEMORY", label: "THE BATTLE-READY FAN DISPLAY", excerpt: "A detailed fan setup is admired as if it is prepared to fight the entire solar system." },
      { at: 11440, end: 11485, category: "TAKE GETS NUCLEAR", label: "BURTON OVER MUSCHIETTI", excerpt: "The room chooses Tim Burton for a future project and refuses to apologize for it." },
      { at: 11570, end: 11615, category: "CREATOR MEMORY", label: "THE CURE'S BURN", excerpt: "A song recommendation becomes a tiny piece of personal music history." },
      { at: 11740, end: 11790, category: "FAN SIGNAL", label: "CHAT WANTS AN OLD-FRANCHISE NIGHT", excerpt: "The audience keeps turning memories into future episodes." },
      { at: 11930, end: 11980, category: "THE ROOM BREAKS", label: "THE PLAY-OUT GETS REQUESTED", excerpt: "A fan asks for music, and the sign-off turns into one last production problem." },
      { at: 12020, end: 12090, category: "LAST CALL", label: "THE WEIRDNESS IS THE POINT", excerpt: "The night closes on gratitude for a room where movie talk, grief, filth, and fan memory can coexist." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1200, end: 2999, label: "THE SPIDER-MAN / VENOM RUN", topic: "Spider-Man 4, Raimi, Venom, and the Punisher", body: "Play from 20:00. The first act is the cleanest movie-news lane: hope, skepticism, trailer analysis, and a real desire for the character to get a focused trilogy.", playAt: 1200, playEnd: 2999 }),
      hated: Object.freeze({ at: 4750, end: 5190, label: "THE HALLOWEEN TRILOGY TRIAL", topic: "Laurie Strode, Michael Myers, and Jamie Lee Curtis's comments", body: "Play from 1:19:10. The criticism is specific and funny: the franchise planned a trilogy before everyone agreed what the trilogy was.", playAt: 4750, playEnd: 5190 }),
      wildestDetour: Object.freeze({ at: 7800, end: 8780, label: "TALES FROM THE BOX TO DICK STRETCHES", topic: "Hellraiser, dog grief, Best of the Best, and a body-joke detour", body: "Play from 2:10:00. The archive's most WWAM stretch moves from practical Pinhead production talk to sincere grief and then directly into martial-arts filth.", playAt: 7800, playEnd: 8780 }),
      lastWord: Object.freeze({ at: 10235, end: 12090, label: "THE COMMUNITY AFTERSHOW", topic: "Mayday Parker, the video-store game, music, and fan displays", body: "Play from 2:50:35. The official news is over; the living archive begins, with viewers supplying the next subjects and the next shows.", playAt: 10235, playEnd: 12090 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
