(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var prior = sources["shoWljlgSUU"];
  if (!prior) return;

  /* June 16, 2026: preserve the already-rich full-tape dossier, correct its
     caption ledger word count, and add a second editorial pass through the
     game-session gaps instead of replacing stronger source-bound work. */
  var additions = Object.freeze([
    { at: 188, end: 225, category: "THE ROOM BREAKS", label: "THE HONORABLE LIE CONFESSION", excerpt: "A courtroom story gets confessed as a lie before the room can finish enjoying it." },
    { at: 860, end: 944, category: "TAKE GETS NUCLEAR", label: "THE POLICE TANGENT ESCAPES", excerpt: "A forgiving traffic stop opens a side argument about bad officers, hiring, training, and the internet's favorite blanket slogans." },
    { at: 955, end: 1040, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "NOT A LAWYER, JUST LOUD", excerpt: "The disclaimer is accurate; the confidence level is not." },
    { at: 2749, end: 2788, category: "DEEP DIVE", label: "THE STORE HAS A FLOOR PLAN", excerpt: "The hosts explain the rental loop while already treating the game like a workplace that needs zoning laws." },
    { at: 2800, end: 2888, category: "FAN SIGNAL", label: "NAME THAT CUSTOMER", excerpt: "A haircut and a shirt become enough evidence to invent an entire customer's biography." },
    { at: 3494, end: 3576, category: "THE ROOM BREAKS", label: "THE CAPTURE BAR FIGHT", excerpt: "A missing window, a delayed game feed, and two people clicking at once turn the setup into a second workplace argument." },
    { at: 3680, end: 3768, category: "DEEP DIVE", label: "HORROR NEEDS THE BIG SHELF", excerpt: "The store's identity gets negotiated through horror, action, science fiction, and the shelves the audience actually wants to see." },
    { at: 4060, end: 4150, category: "WWAM UP IN YA", label: "THE PHONE IS A JUMP SCARE", excerpt: "The shop phone rings while nobody is ready, which makes customer service feel briefly like a slasher sequence." },
    { at: 4360, end: 4450, category: "FAN SIGNAL", label: "CHAT BECOMES MANAGEMENT", excerpt: "Viewer advice arrives as emergency operations guidance because the in-game employees are not moving fast enough." },
    { at: 5110, end: 5194, category: "TAKE GETS NUCLEAR", label: "THE STORE NEEDS A UNION", excerpt: "The hosts debate staffing while the only reliable policy remains threatening to fire somebody during the transaction." },
    { at: 5364, end: 5438, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE PORN DEPARTMENT WINS", excerpt: "The department nobody planned to manage is somehow the one with the cleanest inventory plan." },
    { at: 5685, end: 5770, category: "THE ROOM BREAKS", label: "THE FIRST SHIFT ENDS", excerpt: "The store survives its opening day, but the hosts sound less like owners than two people escaping a building alarm." },
    { at: 6505, end: 6590, category: "DEEP DIVE", label: "DATE THE VIDEO STORE", excerpt: "Canon Films, shelf design, and the customers' clothes become evidence in the argument over which decade the shop inhabits." },
    { at: 6842, end: 6920, category: "WWAM UP IN YA", label: "BUY A COFFIN, FIND THE FLOOR", excerpt: "A full coffin is purchased before anyone checks whether the tiny store has enough floor for a full coffin." },
    { at: 7460, end: 7544, category: "FAN SIGNAL", label: "THE CHAT ORDERS MORE HORROR", excerpt: "The audience starts programming the inventory: add the new movie, fill a shelf, and stop pretending the store can survive on random stock." },
    { at: 7720, end: 7798, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE EMPLOYEE APPLICATION REVIEW", excerpt: "Applicants are scored on loyalty, speed, and immune system as if the shop is hiring for a horror sequel." },
    { at: 8000, end: 8078, category: "CHARACTER SIGNAL", label: "THE WOLFPACK AIR QUALITY REPORT", excerpt: "Corey Feldman language and a real health update share the same strange WWAM lane without pretending the character bit is medical reporting." },
    { at: 8520, end: 8604, category: "FAN SIGNAL", label: "THE GYM WALL GETS A WWAM LOGO", excerpt: "A fan's home-gym update turns the stream's movie recommendations into a physical piece of community memory." },
    { at: 9000, end: 9084, category: "TAKE GETS NUCLEAR", label: "HAWKEYE DESERVED THE HURT LOCKER", excerpt: "Jeremy Renner's range becomes the evidence in a short but forceful case against what Marvel gave Hawkeye." },
    { at: 9740, end: 9818, category: "FAN SIGNAL", label: "THE NEXT SUPERCHAT OPENS THE MAILBAG", excerpt: "A late message keeps the room moving from movie rankings into character bits and the night's final round of questions." },
    { at: 10005, end: 10094, category: "CHARACTER SIGNAL", label: "LOOMIS HAS A ROYALTY PROBLEM", excerpt: "The question of whether Loomis gets paid for the game turns a normal superchat into recurring-character business." },
    { at: 10202, end: 10290, category: "THE ROOM BREAKS", label: "THE GOODBYE HAS A SECOND GOODBYE", excerpt: "The closing tries to end, finds one more medical joke, and keeps the fan room alive until the final thank-you." },
  ]);

  sources["shoWljlgSUU"] = Object.freeze(Object.assign({}, prior, {
    sourceId: "shoWljlgSUU",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze(Object.assign({}, prior.evidence, {
      captionWords: 37008,
      captionEvents: 11054,
      captionSpanSeconds: 10350.56,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:56770e0205c813cccbd52f8762d685a6fd894619a274c190ccc9e59d6b7f8d45",
      audioPass: "canonical YouTube audio + source-local Whisper ranked-window alignment",
      audioSha256: "sha256:ec35d6e747d5b0a8392b463fc73e622f7078e343d785d667edda677414b2498d",
      asrCoverageMode: "ranked-audio-windows",
      asrWindowCount: 65,
    })),
    label: "THE VIDEO STORE HAS PORN, JASON, AND ONE EMPLOYEE WHO SHOULD BE FIRED IMMEDIATELY",
    badge: "FULL SHOW WIKI // 2:52:30 OF MOVIE NEWS, RETRO REWIND CHAOS, FAN MAIL, AND A STORE THAT SHOULD BE SHUT DOWN",
    headline: "A MOVIE-NEWS STREAM TURNS INTO A TWO-HOUR RETRO VIDEO-STORE SHIFT WHERE EVERY CUSTOMER IS A CHARACTER AND EVERY EMPLOYEE IS A LIABILITY.",
    deck: "June 16's WWAM hangout starts with court stories, a Terrifier rights scare, Cloverfield sequel talk, and popcorn-bucket disgust before opening Retro Rewind. The store grows shelf by shelf through porn rentals, Friday-the-13th decorations, imaginary customers, abusive management, chat advice, and a late-night Loomis/Challis and Corey Feldman detour.",
    overview: "This is the episode where the planned movie-news show gets swallowed by the game. The opening is loose even by WWAM standards: a court story, a suspiciously confident lie, a Terrifier lawsuit headline, and a Cloverfield sequel question all arrive before the room decides to build a retro video store live. Once Retro Rewind opens, the broadcast finds its real engine. Shelves are placed, tapes are returned, customers are named on sight, a porn section appears, and the hosts discover that running a store requires more patience than either of them brought to the desk. Friday the 13th turns the shop into a Jason attraction; employees are hired, threatened, fired, and sent back to the register; Karen throws tapes and gets chased into the parking lot; and the chat becomes the only management team with a functioning brain. The final third returns to superchats, health complaints, Corey Feldman, Loomis and Challis requests, a Slenderman song, and the realization that the movie-news portion was merely the cold open for a full shift at the worst video store in Tennessee. The page treats the game section as an actual WWAM story, not filler: a live improvisational sitcom with a rental counter, a recurring cast, fan direction, and a steadily worsening labor dispute.",
    highlights: Object.freeze((prior.highlights || []).concat(additions).sort(function (left, right) { return left.at - right.at; })),
  }));

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-06", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
