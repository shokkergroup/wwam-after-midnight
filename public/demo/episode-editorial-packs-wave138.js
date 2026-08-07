(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "-h9tw8NjDGE", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* February 11, 2025: full second read of the 1:04:36 movie-news room. */
  sources["-h9tw8NjDGE"] = Object.freeze({
    sourceId: "-h9tw8NjDGE",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; 23 audio-ranked windows reconciled across the full February 11 room",
    evidence: Object.freeze({
      duration: 3876,
      captionWords: 14942,
      captionEvents: 3826,
      captionSpanSeconds: 3877.16,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:ea1de33b6ede71f00ea3eb30d2e5786ede42b4344e612f7828f8c92254b7437a",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:b5b243cc6b8ae8d98fbddc8b0e1cc3dee328ce874663209e4bef30d2149737a",
      asrWindowCount: 23,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // FEBRUARY 11, 2025",
    badge: "FULL SHOW WIKI // 1:04:36 OF 28 DAYS LATER, KENDRICK, SUPERMAN, HORROR ROYAL RUMBLE, AND CHUCKY",
    headline: "THE FEBRUARY 11 ROOM TURNS MOVIE NEWS INTO A HORROR ROYAL RUMBLE",
    deck: "A compact news room with a hard left turn into Kendrick, a Super Chat pile-up, Chucky rules, and one last pickle-chip button.",
    overview: "February 11 is a short show with a surprisingly busy nervous system. It opens by roasting expensive game releases and a box of poop, then drifts into physical-media frustration, the Super Bowl, Kendrick Lamar, and a microphone nobody can understand. The desk keeps finding new doors: Green Day and Blink-182 as superhero music, a Candyman mirror trick, aliens sabotaging the microphone, a hard-eyed movie that refuses to land its ending, and a drive-in sequence that gets compared to Freddy vs. Jason. The middle is fan-facing and messy in the best way: a horror Royal Rumble, a Dead Meat Super Chat, Superman casting speculation, and a Chucky/True Romance recommendation. The room also takes a long detour through an internet connection that keeps dying, a fake trailer, a movie that becomes physically tiring after forty-five minutes, and the strange problem of Super Chats disappearing from the interface. The last stretch is pure WWAM: a New Nightmare route, apple juice, a question about bringing an actor back for a flashback, and dill-pickle chips as the closing argument. These 23 doors are not filler; they mark the exact moments where the show changes subject, temperature, or character.",
    story: Object.freeze([
      { at: 0, end: 600, label: "THE BOX OF POOP AND PHYSICAL MEDIA", body: "The room starts with lazy game releases and an imaginary $70 box of poop, then turns its attention to the pain of finding older movies on physical media." },
      { at: 600, end: 1200, label: "KENDRICK, THE SUPER BOWL, AND THE MIC", body: "The Super Bowl becomes a Kendrick Lamar argument, a stadium-speech complaint, and a reminder that even a giant live event can sound like somebody yelling through a sock." },
      { at: 1200, end: 1800, label: "SUPERHERO MUSIC AND HORROR MIRRORS", body: "Green Day and Blink-182 get matched to superhero demographics while a Candyman mirror trick, alien interference, and a Freddy vs. Jason drive-in comparison keep the desk in genre mode." },
      { at: 1800, end: 2400, label: "KANYE, SUPERMAN, AND THE CASTING SPIRAL", body: "A boring sport, Lethal Weapon 2, a Yeezy shirt, Kanye's awards history, and a cropped Superman casting image send the room into an unusually wide pop-culture orbit." },
      { at: 2400, end: 3000, label: "ROYAL RUMBLE, ROOMS, AND THE FAKE TRAILER", body: "A horror Royal Rumble idea meets a failing internet connection, a locked door, a fake trailer, and the moment a movie starts feeling like work instead of entertainment." },
      { at: 3000, end: 3500, label: "CHUCKY, SUPERMAN, AND THE FAN LANE", body: "Chucky rules, True Romance, Texas Hollywood, a Super Chat about a horror Royal Rumble, and apple juice make the fan lane feel like a second host in the room." },
      { at: 3500, end: 3786, label: "FLASHBACKS, NEW NIGHTMARE, AND PICKLE CHIPS", body: "The ending asks why a movie needs a returning-actor flashback, imagines a New Nightmare route, then refuses to leave without one last argument about dill-pickle chips." },
      { at: 3786, end: 3876, label: "THE LAST BUTTON", body: "The final seconds are not a grand conclusion; they are a small, vulgar button that keeps the room's personality intact after the headlines run out." },
    ]),
    highlights: Object.freeze([
      H(446, 454, "WWAM UP IN YA", "THE $70 BOX OF POOP", "A lazy game-release rant escalates into the idea of selling a literal box of poop for seventy dollars, a perfect opening taste of the room's fake-product economy."),
      H(528, 536, "STRAIGHT TO STEVE'S ASSHOLE", "28 DAYS LATER IS HIDING ON THE SHELF", "The search for 28 Days Later becomes a physical-media complaint about movies disappearing from the places people expect to find them."),
      H(716, 724, "STRAIGHT TO STEVE'S ASSHOLE", "KENDRICK TURNED THE SUPER BOWL OFF", "The Super Bowl is treated as a personal test of patience, with Kendrick Lamar and the Drake conversation dragged into the same exhausted chair."),
      H(768, 776, "STRAIGHT TO STEVE'S ASSHOLE", "THE STADIUM MIC NEEDS SUBTITLES", "A giant event gets sent to Steve's Asshole because the speech sounds incomprehensible even before the room starts imitating it."),
      H(1238, 1246, "MAJOR TOPIC TURN", "GREEN DAY IS A SUPERHERO DEMOGRAPHIC", "Green Day and Blink-182 get sorted by which superhero audience would claim them, then the desk pivots to the Candyman mirror trick."),
      H(1289, 1297, "ROOM BREAK", "ALIENS ARE MESSING WITH THE MICROPHONE", "The failing microphone is blamed on aliens and T-Mobile power, turning a technical problem into a tiny science-fiction plot."),
      H(1362, 1370, "STRAIGHT TO STEVE'S ASSHOLE", "THE HARD-EYED MOVIE", "A movie gets insulted for its hard eyes and then defended just enough to make the contradiction funnier than the review."),
      H(1431, 1439, "STRAIGHT TO STEVE'S ASSHOLE", "THE FRANCHISE STARTER THAT AIN'T IT", "The movie is expected to launch a franchise, but the ending gets judged as the exact place where the plan falls apart."),
      H(1609, 1617, "CHARACTER APPEARANCE", "THE DRIVE-IN WANTS FREDDY VS. JASON", "A drive-in sequence is compared to Freddy vs. Jason, giving the character and crossover archive a clean horror doorway."),
      H(1762, 1770, "MAJOR TOPIC TURN", "THE RUGBY TEAM THAT ALWAYS WINS", "A sport becomes boring when one side cannot lose, a small argument that quietly explains the room's preference for danger and reversals."),
      H(1836, 1844, "MAJOR TOPIC TURN", "LETHAL WEAPON 2 BEFORE FRIDAY 4", "A theatrical suggestion jumps from Lethal Weapon 2 to Friday the 13th Part 4, showing how quickly the room makes a double feature out of nothing."),
      H(1912, 1920, "STRAIGHT TO STEVE'S ASSHOLE", "THE YEEZY SHIRT THAT NORDVPN CANNOT SAVE", "A Kanye shirt and an advertisement for NordVPN get fused into one joke about the internet being unable to hide a terrible wardrobe decision."),
      H(1990, 1998, "MAJOR TOPIC TURN", "KANYE'S AWARDS-SHOW GRAVITY", "The desk stays with Kanye's bipolar public spiral and awards history long enough to make the news item feel like a human story instead of a headline."),
      H(2080, 2088, "MAJOR TOPIC TURN", "THE CROPPED SUPERMAN CASTING IMAGE", "A Superman casting image is cropped just enough to invite speculation about Dean Cain and the political story people want the picture to tell."),
      H(2244, 2252, "FAN SIGNAL", "DEAD MEAT'S HORROR ROYAL RUMBLE", "A Super Chat brings in the idea of a horror Royal Rumble, a fan prompt that instantly becomes a usable WWAM crossover concept."),
      H(2504, 2512, "ROOM BREAK", "THE INTERNET LOCK-IN", "The internet turns on and off, the door gets locked, and the room keeps trying to finish the thought without pretending the technical problem is not happening."),
      H(2562, 2570, "STRAIGHT TO STEVE'S ASSHOLE", "THE FAKE TRAILER ACTRESS", "A fake trailer and a terrible performance are dismissed together, with the desk treating the whole thing like an audition nobody asked for."),
      H(2681, 2689, "STRAIGHT TO STEVE'S ASSHOLE", "THE MOVIE THAT MAKES YOUR BODY TIRED", "After forty-five minutes the movie is described as physically tiring, a review metric more honest than another star rating."),
      H(2843, 2851, "FAN SIGNAL", "THE SUPER CHATS IN THE CHUTE", "The interface skips Super Chats and the room notices, making the missing fan messages part of the show's actual story instead of invisible metadata."),
      H(2986, 2994, "CHARACTER APPEARANCE", "CHUCKY MAKES THE RULES", "Chucky gets a rules-of-the-room moment while True Romance and Texas Hollywood are pulled into the same recommendation pile."),
      H(3288, 3296, "ROOM BREAK", "APPLE JUICE KICKS THE DOOR IN", "Apple juice becomes a full-force personality, then the room slides back into a Superman list as if the beverage had settled the argument."),
      H(3690, 3698, "MAJOR TOPIC TURN", "THE FLASHBACK THAT NEEDED A REASON", "The question is not whether an actor can return for a flashback; it is why the story needs the return at all, with New Nightmare offered as the better route."),
      H(3789, 3797, "SOUNDBYTE / REPLAY", "THE DILL-PICKLE CHIP EPILOGUE", "The episode refuses a polished sign-off and exits on dill-pickle chips, a tiny final button that deserves replay status."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2244, end: 2994, label: "THE HORROR ROYAL RUMBLE FAN LANE", topic: "Super Chats become show architecture", body: "Play from 37:24. A Dead Meat prompt, the missing Super Chats, and Chucky's rules turn fan traffic into the episode's most useful creative lane.", playAt: 2244, playEnd: 2994 }),
      hated: Object.freeze({ at: 528, end: 1439, label: "THE MEDIA SHELF AND THE HARD-EYED MOVIE", topic: "frustration with access and weak franchise promises", body: "Play from 8:48. Physical-media scarcity, a stadium microphone, and a franchise starter that does not stick give the episode its clearest complaint run.", playAt: 528, playEnd: 1439 }),
      wildestDetour: Object.freeze({ at: 1912, end: 3296, label: "YEEZY, SUPERMAN, AND APPLE JUICE", topic: "pop culture refuses to stay in one lane", body: "Play from 31:52. Kanye, a cropped Superman image, a horror Royal Rumble, internet failures, Chucky, and apple juice form one long WWAM detour.", playAt: 1912, playEnd: 3296 }),
      lastWord: Object.freeze({ at: 3690, end: 3797, label: "NEW NIGHTMARE AND PICKLE CHIPS", topic: "the room exits sideways", body: "Play from 1:01:30. A flashback question, a New Nightmare idea, and dill-pickle chips close the archive door without sanding off the personality.", playAt: 3690, playEnd: 3797 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
