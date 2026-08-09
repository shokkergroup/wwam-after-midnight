(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "pkiR140lzSY";
  var duration = 13240;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 900, "INTERVIEW DOSSIER", "SUN GETS THE RED-SHIRT REVIEW AND ANDY MATIChAK GETS A FUTURE", "The Son review opens with a red shirt chosen for horror, then explains why Andy Matichak carries the film, moves beyond Halloween's ensemble, and earns an 8/10 from the booth."),
    H(850, 1500, "SUN REVIEW", "THE 350-POUND NAKED INTRUDER, THE SHOCK, AND THE ENDING THAT DOES NOT FUMBLE", "The hosts admit the film's most intense scene blindsided them, then praise Sun for letting the ending land without over-explaining the chaos."),
    H(1500, 2050, "WWAM UP IN YA", "GAY PORN ON THE SCREEN, QUEEN'S GREATEST HITS, AND A COMMENTARY HINT FROM GYPSY WARRIOR", "A screen-share mistake exposes the wrong browser tab, Gypsy Warrior asks for a Queen album and a next-commentary hint, and the booth turns Walmart's late-night movie aisle into a Queen origin story."),
    H(2050, 2700, "FAM RECEIPT", "NICK CAGE IN MANDY, CHEYENNE'S LOOMIS SHOUT-OUT, AND PEYOTE IN THE DESERT", "Joshua Ayers revives Mandy's Nick Cage bathroom scene, Cheyenne Turner requests a Loomis shout-out, and the hosts drift into Young Guns, peyote, and the kind of desert decision only a movie cowboy would make."),
    H(2700, 3600, "TOP TEN LAB", "CHOOSING TEN MOVIES MAKES THE HAIR LOOK LIKE FREDERICK CHOPIN", "The all-time list becomes a self-inflicted crisis. Endgame, Logan, and the impossible question of what deserves the final slot force the booth to admit that loving a movie is not the same as finding room for it."),
    H(3600, 4450, "TOP TEN LAB", "THE DRYER COSTS $516, THE MAP IS AN IDIOT, AND THE LIST KEEPS BREAKING THE HOUSE", "A broken dryer turns into a $516 household receipt while the hosts compare list-making to Dumb and Dumber's blame-the-atlas logic. The domestic repair story becomes part of the canon instead of a cutaway."),
    H(4450, 5300, "CHARACTER CANON", "SLENDERMAN SAYS DANIEL, THE COFFEE QUESTION, AND THE FIRST PEE BREAK", "A viewer gets a Slenderman birthday-style shout-out, the booth debates soda versus coffee, and the first bathroom break arrives just as the tournament is about to start."),
    H(5300, 6400, "FRIDAY NIGHT FIGHTS", "THE TOURNAMENT OPENS WITH A LIST THAT HATES ITS OWN OMISSIONS", "The bracket begins after the top-ten argument. The hosts openly resent the movies they left out, then let the FAM turn omissions into new matchups instead of pretending the list is definitive."),
    H(6400, 7300, "FRIDAY NIGHT FIGHTS", "T2, KINDERGARTEN COP, AND NEO DODGING A CLOSE BULLET", "The action lane argues over Terminator 2 and Kindergarten Cop before Vinny sends a Matrix gif that becomes the perfect visual receipt for a close vote."),
    H(7300, 8050, "FRIDAY NIGHT FIGHTS", "GODFATHER MARATHONS, INDIANA JONES, AND THE FATHER-SON MOMENT THAT WINS THE ROOM", "A Godfather back-to-back memory leads to Indiana Jones and the Last Crusade, with Sean Connery giving the film its emotional weight and the booth admitting the scene still hits hard."),
    H(8050, 9150, "FRIDAY NIGHT FIGHTS", "BLOODSPORT VERSUS TOMBSTONE, HUCKLEBERRY, AND A SCORE THAT TURNS PERSONAL", "The Bloodsport/Tombstone fight gets a face-based voting signal, a Val Kilmer 'I'm your huckleberry' receipt, and a scoreboard that leaves one host four-and-oh and the other threatening the furniture."),
    H(9150, 9800, "WHAM COMBAT", "ROCKY VERSUS BACK TO THE FUTURE, THE 1.21 GIGAWATT CALL SIGN, AND THE EMOTIONAL CASE FOR MARTY", "The tournament's new lane is named Wham Combat. Rocky and Back to the Future are called with a Doc Brown signal, then the hosts unpack George McFly, courage, and the way Marty repairs a family without turning it into a lecture."),
    H(9800, 10600, "MOVIE MEMORY", "GHOSTBUSTERS VERSUS LETHAL WEAPON, THE FRIENDSHIP TEST, AND WHY THE SPECIAL EFFECTS DO NOT MATTER", "The final movie lane pits Lethal Weapon against Ghostbusters. The booth chooses the friendship, the middle, and the feeling of friends walking into a haunted house together over perfect effects."),
    H(10600, 11450, "TOP TEN LAB", "THE MOVIES THAT DID NOT MAKE THE LIST: Rambo, White Men Can't Jump, Broken Arrow, Jarhead, Willow", "The omissions get their own memorial: First Blood, White Men Can't Jump, Broken Arrow, Jarhead, The Return of the King, Willow, and Krull all get the 'I love it, but the list is only ten' treatment."),
    H(11400, 12100, "SPORTS DETOUR", "THE DRUNK ARGUMENT MOVES FROM MOVIES TO BRADY, RODGERS, AND LEBRON", "A ranking stream swerves into a football and basketball argument about talent, leadership, cockiness, and championships. The FAM recognizes the bar fight before the hosts do."),
    H(12100, 12900, "FAM MEMORY", "PUG JAB SAYS THE QUIET PART: DRUNK ARGUMENTS END WITH BOTH PEOPLE AGREEING", "Pug Jab's message becomes the perfect diagnosis of the sports detour. The hosts read David Nangle's Brady case, debate Peyton Manning and Philip Rivers, and try to remember what the argument was about."),
    H(12900, 13240, "LAST CALL", "THE LIST SURVIVES, THE FAM KEEPS THE SCORE, AND THE NEXT FIGHT IS ALREADY WAITING", "The long tape ends with the top-ten list still imperfect, the bracket still alive, and the room still willing to argue about a movie, a quarterback, or a bathroom scene until somebody needs a pee break."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 2050, label: "SUN IS A REVIEW, AN INTERVIEW RECEIPT, AND A SCREEN-SHARE DISASTER", body: "The tape opens with Andy Matichak's performance in Sun and the hosts' cleanest review language of the night: she carries the movie, the ending works, and the booth gives it an eight. Then the show does what WWAM does—gay porn appears in the screen share, Queen's Greatest Hits becomes a Walmart origin story, and Gypsy Warrior asks what the next commentary will be. The review is more useful because the messy room remains visible around it.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 2050, end: 5300, label: "THE TOP-TEN LIST IS A FIGHT AGAINST LOVING TOO MANY MOVIES", body: "Mandy's Nick Cage bathroom scene, Cheyenne's Loomis request, Young Guns peyote jokes, a broken dryer, and the atlas blame game surround the actual problem: choosing ten films from an entire life. Endgame, Logan, and the list's missing titles create a visible crisis. The booth does not pretend the list is objective; it documents the pain of cutting movies that still matter.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5300, end: 9150, label: "FRIDAY NIGHT FIGHTS TURNS THE LIST INTO A LIVING BRACKET", body: "The tournament gives the abandoned movies somewhere to go. T2 and Kindergarten Cop, a Matrix bullet-dodge gif, the Godfather marathon, Indiana Jones and Sean Connery, Bloodsport, Tombstone, Val Kilmer, and a scoreboard that leaves one host four-and-oh turn list-making into a social game. Every matchup is a chance to explain a memory, not just crown a winner.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 9150, end: 11450, label: "WHAM COMBAT IS WHERE THE APP'S BEST FORMAT LIVES", body: "Rocky versus Back to the Future gets a Doc Brown call sign and an emotional reading of George McFly's courage. Ghostbusters versus Lethal Weapon becomes a friendship test rather than an effects contest. The omitted-film memorial names Rambo, White Men Can't Jump, Broken Arrow, Jarhead, Willow, Krull, and The Return of the King. The point is not a perfect top ten; it is a navigable map of why these movies stay alive in the hosts' heads.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 11400, end: 13240, label: "THE BAR FIGHT MOVES TO SPORTS AND THE FAM CALLS IT", body: "Brady, Rodgers, LeBron, Peyton Manning, and Philip Rivers replace the movies for a while. Pug Jab's Super Chat recognizes the pattern: drunk arguments end with both people agreeing and nobody remembering the original point. The episode closes without pretending the list or the bracket is finished, which is exactly why it remains reusable as a living dossier.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 3h40m40s Friday Night Fights Top 10 All Time plus Sun review; local audio, canonical captions, and Whisper ledger checked across Andy Matichak/Sun review, red-shirt and screen-share bits, Queen and Mandy receipts, Cheyenne Loomis shout-out, top-ten list crisis, dryer/atlas detour, Slenderman and coffee questions, action tournament, T2/Kindergarten Cop, Matrix gif, Godfather/Indiana Jones, Bloodsport/Tombstone, Wham Combat, Rocky/Back to the Future, Ghostbusters/Lethal Weapon, omitted-film memorial, sports detour, and FAM close",
    evidence: Object.freeze({
      duration: 13240,
      captionWords: 45564,
      captionEvents: 13859,
      captionSpanSeconds: 13241.84,
      captionDurationCoveragePercent: 100,
      captionSha256: "5E037811B3B68F2FA4987D8334CBEC66DEEC17FF0E7B79661B5018033F52C2BA",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "3438351259A77BB0BD3D595CBB5C7C542EB255770375F860C61BBF2EB6B8A712",
      asrSegmentCount: 574,
      asrSha256: "sha256:b01b1881ddeae4246a55ff26a1866657c99ef7f7023207061ecd96b98515633a",
      asrCoverageStartSeconds: 207,
      asrCoverageEndSeconds: 13152.76,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "FRIDAY NIGHT FIGHTS // TOP 10 ALL TIME + SUN REVIEW",
    badge: "FULL SHOW WIKI // SUN, TOP-TEN CRISIS, WHAM COMBAT, AND THE FAM SCOREBOARD",
    headline: "SUN GETS AN 8/10, THE TOP TEN BREAKS THE ROOM, AND WHAM COMBAT IS BORN",
    deck: "A full-audio WWAM read of the 3h40m list-and-bracket night: Andy Matichak's Sun, a top-ten crisis, Bloodsport versus Tombstone, Rocky versus Back to the Future, Ghostbusters versus Lethal Weapon, and a sports argument that refuses to die.",
    overview: "This is a major format tape. It begins with a red-shirt Sun review and a clear verdict: Andy Matichak carries the film, the ending lands, and the hosts give it an eight. The room immediately exposes its own seams—an accidental screen-share tab, Queen's Greatest Hits bought at Walmart, Mandy's Nick Cage bathroom scene, Cheyenne Turner's Loomis request, and a dryer that costs $516 because it does not include the cord. Then the hosts attempt the impossible: a top ten movies list. Endgame, Logan, The Godfather, Indiana Jones, Ghostbusters, Lethal Weapon, Rocky, Back to the Future, Bloodsport, Tombstone, Scream, The Goonies, The Karate Kid, and a dozen beloved omissions fight for ten chairs. Friday Night Fights turns the list into a living bracket. T2 and Kindergarten Cop, a Matrix bullet-dodge gif, Godfather marathons, Sean Connery's father-son scene, Bloodsport versus Tombstone, and the four-to-zero scoreboard all become playable evidence. The new format is named Wham Combat during Rocky versus Back to the Future, then Ghostbusters versus Lethal Weapon reframes a movie fight as a friendship test. Rambo, White Men Can't Jump, Broken Arrow, Jarhead, Willow, Krull, and The Return of the King receive an omitted-film memorial instead of disappearing. Late in the night, Brady, Rodgers, LeBron, Peyton Manning, and Philip Rivers replace the movies, and Pug Jab correctly diagnoses drunk arguments that end with agreement and no memory of the original point. Local audio and ASR establish every route; playback remains the authority.",
    topics: Object.freeze(["Sun", "Andy Matichak", "Friday Night Fights", "Top 10 movies", "Wham Combat", "Bloodsport", "Tombstone", "Rocky", "Back to the Future", "Ghostbusters", "Lethal Weapon", "The Godfather", "Indiana Jones", "Scream", "Endgame", "Logan", "Dr. Loomis", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 0, end: 1500, label: "SUN GETS THE 8/10 RECEIPT", topic: "Sun review", body: "Play the Andy Matichak/Sun lane for the strongest review segment: performance, shock, ending, and the clean eight-out-of-ten verdict.", playAt: 0, playEnd: 1500 }),
      hated: Object.freeze({ at: 3600, end: 4450, label: "THE $516 DRYER WITH NO CORD", topic: "Domestic chaos", body: "Play the broken-dryer and atlas section for the night's most concentrated household rage before the tournament returns.", playAt: 3600, playEnd: 4450 }),
      wildestDetour: Object.freeze({ at: 12100, end: 12900, label: "BRADY, RODGERS, AND THE BAR-FIGHT EXIT", topic: "Sports detour", body: "Play the late sports argument and Pug Jab diagnosis for a movie stream that wanders into football and somehow becomes more WWAM.", playAt: 12100, playEnd: 12900 }),
      lastWord: Object.freeze({ at: 9150, end: 10600, label: "WHAM COMBAT: ROCKY, BACK TO THE FUTURE, AND GHOSTBUSTERS", topic: "Format canon", body: "Play the Wham Combat birth and friendship bracket for the clearest reusable format in the show.", playAt: 9150, playEnd: 10600 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 360, end: 410, name: "Eggshed", kind: "chat receipt", note: "Comments on the red shirt and becomes part of the Sun opening." },
        { at: 1560, end: 1620, name: "Gypsy Warrior", kind: "Super Chat", note: "Asks for a Queen album favorite and a hint for the next commentary." },
        { at: 2040, end: 2120, name: "Joshua Ayers", kind: "Super Chat", note: "Requests the Nick Cage bathroom scene from Mandy and gets the hosts' immediate regret." },
        { at: 2440, end: 2520, name: "Cheyenne Turner", kind: "Super Chat", note: "Sends encouragement and requests a Loomis shout-out." },
        { at: 3260, end: 3320, name: "Angry Lucifer Morningstar", kind: "chat receipt", note: "Is named during the Young Guns and top-ten list lane." },
        { at: 4240, end: 4320, name: "Daniel", kind: "chat receipt", note: "Receives a Slenderman-style name shout-out." },
        { at: 7000, end: 7140, name: "Vinny", kind: "chat receipt", note: "Sends a Neo bullet-dodge gif during a close action-movie vote." },
        { at: 10660, end: 10730, name: "Pug Jab", kind: "Super Chat", note: "Diagnoses drunk arguments that end with agreement and no memory of the original topic." },
        { at: 11180, end: 11250, name: "David Nangle", kind: "Super Chat", note: "Makes the leadership and clutch case for Tom Brady during the sports detour." },
        { at: 12960, end: 13030, name: "Haddn Phil 88", kind: "chat receipt", note: "Misses a vote while smoking and receives a forgiving FAM response." },
        { at: 13120, end: 13180, name: "Camera Terror", kind: "chat receipt", note: "Requests a Loomis voice during the late bracket chaos." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
