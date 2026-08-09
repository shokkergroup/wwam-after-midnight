(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "0H8tsOxMw64";
  var duration = 6115;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 360, "TECHNICAL CHAOS", "OBS TAKES A DUMP, THE INTERNET GETS INDICTED, AND THE FAM COMES BACK ANYWAY", "The show restarts after OBS crashes. The hosts blame the ticker, the computer, the power company, and eventually themselves, then send the link back out and thank the smaller room that returned."),
    H(360, 760, "JIM CARREY VS ADAM SANDLER", "HAPPY GILMORE VERSUS DUMB AND DUMBER HAS TO BE RECOUNTED FROM ZERO", "The first vote was interrupted mid-count, so the booth starts over: Happy Gilmore is option one, Dumb and Dumber option two, and the hosts immediately turn a technical reset into a Star Wars trivia humiliation."),
    H(760, 1080, "DUMB AND DUMBER", "RED RIGHT HAND, SAMSONITE, BIG GULPS, AND A PETEY HEAD THAT FALLS OFF", "The Dumb and Dumber round is a quote avalanche: the Ciderita hat, the sweet old lady on a shopping cart, the tarmac, the limo-driver lie, Samsonite, IOUs, and the diner music that sounds like Jupiter's butt crack."),
    H(1050, 1320, "WWAM UP IN YA", "AOL 8.0, AVENGERS ROLEPLAY, AND THE CYBERSEX STORY THAT SHOULD HAVE STAYED IN THE DRAFTS", "A nostalgia detour about AOL roleplay turns into an explicit, absurd confession about cybersex, an Avengers character, and a stranger named Bubba. The hosts frame it as writing a romance novel, then make the whole thing even worse."),
    H(1320, 1760, "JIM CARREY VS ADAM SANDLER", "THE MASK VERSUS THE WEDDING SINGER: GRAPHIC-NOVEL DARKNESS AGAINST SNL ENERGY", "The Mask gets the stronger movie argument: Jim Carrey's cartoon-body performance, the dark graphic novel underneath it, Cameron Diaz, and a real villain. The Wedding Singer gets love, but the booth calls it an extended SNL sketch."),
    H(1760, 2200, "FAM RECEIPT", "PRIME CAMERON DIAZ, THE MASK HATE, AND THE CHAT THROWING TOMATOES", "The chat pushes back on the Mask criticism while the booth admits the childhood expectation-versus-reality problem. The argument stays funny because the hosts keep separating dislike from disrespect."),
    H(2200, 2800, "ADAM SANDLER ROUNDS", "BIG DADDY, THE RAT IN THE GOLF HOLE, AND JOHN STEWART'S PERFECTLY CALM REACTION", "Big Daddy gets a full quote-and-memory treatment, including the golf-course rat, the pile of briefcases, the breakfast-at-11 gag, and the line that makes the booth remember why Sandler films survive a bad reputation."),
    H(2800, 3430, "FAM MEMORY", "JAKE HOLLAND IS JASON BOURNE, THEN THE ROOM RECALLS APOCALYPTO", "Jake Holland's entrance becomes a repeated 'fucking Benz' chant before the hosts remember Apocalypto as one of their first experiments. The archive catches the community turning a greeting into a recurring bit."),
    H(3430, 4050, "JIM CARREY VS ADAM SANDLER", "BILLY MADISON, ACE VENTURA, AND THE WORST HEMORRHOIDS IN SCHOOL", "The booth cross-cuts Billy Madison brain busters, Ace Ventura's Captain Winky panic, Norm Macdonald's Frank, Chris Farley turning the bus around, and the grossest classroom lines in the Carrey/Sandler canon."),
    H(4050, 4650, "ADAM SANDLER ROUNDS", "ME MYSELF & IRENE, THE CABLE GUY, AND THE WATER BOY BRACKET", "The next bracket keeps the comedy fight moving through Me, Myself & Irene, The Cable Guy, and The Waterboy while the booth admits they cannot keep their own programs running well enough to rig an election."),
    H(4650, 5050, "JIM CARREY VS ADAM SANDLER", "HAPPY GILMORE, SHOOTER MCGAVIN, AND PIECES OF SHIT FOR BREAKFAST", "The Happy Gilmore lane gets its Shooter McGavin invitation, the green-jacket quote, the Dave Hasselhoff sand joke, and the breakfast exchange that the hosts can recite without needing the movie in front of them."),
    H(5050, 5480, "DRAMATIC ACTOR LAB", "THE TRUMAN SHOW, ETERNAL SUNSHINE, AND THE ARGUMENT THAT CARREY IS MORE THAN A CARTOON", "The dramatic case for Jim Carrey lands on The Truman Show and Eternal Sunshine. The hosts contrast that emotional range with Sandler's comedy catalog, then let an Intel Wild Super Chat tempt them to keep drinking."),
    H(5450, 5740, "JIM CARREY VS ADAM SANDLER", "BATMAN FOREVER VERSUS GROWN-UPS, WITH RIDDLER NOSTALGIA ON TRIAL", "The final vote pits Batman Forever against Grown-Ups. One side gets childhood cups, Kiss from a Rose, and Jim Carrey's Riddler; the other gets the unexpectedly comforting stupidity of a reunion comedy watched during a miserable year."),
    H(5700, 5950, "INTERVIEW LORE", "A BIRTHDAY BALLOON, A MYSTERY GUEST, AND THE PHANTASM FALLBACK", "The post-vote room teases a possible larger guest, jokes about Gene Simmons and Jamie Lee Curtis, confirms an upcoming interview lane, and suggests interviewing a WWAM character if the mystery guest does not land."),
    H(5920, 6115, "WWAM FAM MEMORY", "JIM CARREY TAKES THE NIGHT, ADAM SANDLER GETS HIS FLOWERS, AND THE FAM GETS THE LAST WORD", "The tally gives Carrey six of seven rounds. The hosts still call Sandler underrated, thank everyone who returned after the crash, wish Jay a happy birthday, and leave the room with a future Batman bracket on the table."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 1320, label: "THE CRASHED FEED BECOMES THE FIRST COMEDY ROUND", body: "The upload opens after OBS has crashed and the audience has vanished. The hosts send the link back out, blame the ticker, the power company, and themselves, and greet the people who return as if the room has survived a small war. Happy Gilmore versus Dumb and Dumber has to be recounted from zero, then Dumb and Dumber gets a quote avalanche: Red Right Hand, the Ciderita hat, the sweet old lady on a shopping cart, the tarmac, Samsonite, IOUs, Big Gulps, and the Petey head gag. The technical failure is not hidden; it becomes the first bit.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1320, end: 2800, label: "THE MASK ROUND IS A TASTE ARGUMENT, NOT A VERDICT ON JIM CARREY", body: "The Mask versus The Wedding Singer gives the tape its best movie disagreement. One host dislikes The Mask because childhood hype turned into expectation-versus-reality, while the other sees Jim Carrey's physical performance, the dark comic-book source, Cameron Diaz, and the villain as a complete movie. The Wedding Singer is not dismissed; it is loved as a funny, warm, very long SNL sketch. The chat pushes back, the hosts absorb it, and the bracket stays friendly even when the language absolutely does not.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 2200, end: 5050, label: "SANDLER'S CATALOG IS A QUOTE MACHINE WITH A COMMUNITY ATTACHED", body: "Big Daddy, Billy Madison, Ace Ventura, Me, Myself & Irene, The Cable Guy, The Waterboy, and Happy Gilmore are not treated as titles on a list. They are memory triggers. A rat crawls out of a golf hole, John Stewart says that cannot be good, Chris Farley threatens to turn the bus around, Shooter McGavin gets invited on the show, and Jake Holland's arrival becomes a repeated 'fucking Benz' chant. Gypsy Warrior asks about the next commentary after The Crow, turning the bracket into an actual channel calendar.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5050, end: 5920, label: "CARREY WINS THE BRACKET, THEN THE DRAMATIC CASE MAKES IT A REAL DEBATE", body: "The late rounds put The Truman Show and Eternal Sunshine beside Batman Forever and Grown-Ups. The hosts let nostalgia argue with present-day appreciation: Batman Forever is a childhood event, while Grown-Ups can become a surprisingly comforting watch when the real world is miserable. The final tally gives Carrey six of seven rounds, but the booth deliberately gives Sandler his flowers and says the catalog is more underrated than the usual punchline suggests. An Intel Wild offer to buy another hour is declined with a drunk, filthy counteroffer.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5920, end: 6115, label: "THE NEXT WIKI IS ALREADY HIDING IN THE GOODBYE", body: "The sign-off is a roadmap: a birthday weekend, a possible larger interview, a Phantasm fallback, new character material, and a future Batman-versus-Batman bracket. The hosts thank the people who came back after the crash and call the FAM the channel's lifeblood. The episode ends with a useful archive truth: the winner is Jim Carrey, but the reason to keep the tape is the room built around the vote.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 1h41m55s Jim Carrey versus Adam Sandler livestream; local audio, canonical captions, and Whisper ledger checked across the OBS restart, Happy Gilmore versus Dumb and Dumber recount, Mask versus Wedding Singer, Big Daddy, Billy Madison, Ace Ventura, Me Myself & Irene, The Cable Guy, The Waterboy, Happy Gilmore, Truman Show, Eternal Sunshine, Batman Forever versus Grown-Ups, FAM receipts, birthday balloon, mystery-guest tease, and Carrey six-of-seven close",
    evidence: Object.freeze({
      duration: 6115,
      captionWords: 20948,
      captionEvents: 6421,
      captionSpanSeconds: 6116.96,
      captionDurationCoveragePercent: 100,
      captionSha256: "C7DD39143D7D652CA1A0E343F27BDFB60E05E6B7250D3C90BA2056A39A35AAF6",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "05B34C83F503B4FC8D65DC3E3BF1F23AF23A52B99BC31DABDD66424022D57BF9",
      asrSegmentCount: 360,
      asrSha256: "sha256:a1dbd5171b7188561156cfd54a9bc8d7855c2e83690f8998e71bf602ef2d2f88",
      asrCoverageStartSeconds: 262,
      asrCoverageEndSeconds: 6059.86,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "JIM CARREY VS ADAM SANDLER // BIRTHDAY WEEKEND LIVE",
    badge: "FULL SHOW WIKI // COMEDY BRACKET, OBS DISASTER, FAM QUOTES, AND A CARREY SWEEP",
    headline: "THE COMPUTER CRASHES, THE COMEDY BRACKET SURVIVES, AND CARREY TAKES SIX OF SEVEN",
    deck: "A full-audio WWAM comedy-night read: Happy Gilmore gets recounted from zero, The Mask and The Wedding Singer split the room, the Sandler catalog becomes a quote engine, and Jim Carrey wins the final tally with Batman Forever still glowing in the nostalgia lane.",
    overview: "The title promises Jim Carrey versus Adam Sandler, but the real opening fight is WWAM versus OBS. The program crashes, the hosts send the link back out, blame the ticker and the power company, and greet the people who return as if the room has survived a small war. Happy Gilmore versus Dumb and Dumber has to be recounted from zero, then Dumb and Dumber gets a full quote avalanche: Red Right Hand, the Ciderita hat, the sweet old lady on a shopping cart, the tarmac, Samsonite, IOUs, Big Gulps, and the Petey head gag. The Mask versus The Wedding Singer becomes a real taste argument: Jim Carrey's physical cartoon performance and the dark graphic novel underneath The Mask against a warm Adam Sandler romance that feels like an SNL sketch stretched to feature length. Big Daddy, Billy Madison, Ace Ventura, Me, Myself & Irene, The Cable Guy, The Waterboy, and Happy Gilmore are treated as community memory, not a catalog. Jake Holland becomes 'fucking Benz,' Gypsy Warrior asks about the next commentary, and the FAM keeps steering the bracket. The dramatic lane lands on The Truman Show and Eternal Sunshine; the nostalgia lane puts Batman Forever against Grown-Ups; the tally gives Carrey six of seven rounds while still calling Sandler underrated. A birthday balloon, a possible major guest, a Phantasm fallback, a character-interview idea, and a future Batman bracket make the last ten minutes a roadmap. Local audio and ASR establish every route; playback remains the authority.",
    topics: Object.freeze(["Jim Carrey", "Adam Sandler", "Happy Gilmore", "Dumb and Dumber", "The Mask", "The Wedding Singer", "Big Daddy", "Billy Madison", "Ace Ventura", "Me Myself & Irene", "The Cable Guy", "The Waterboy", "The Truman Show", "Eternal Sunshine", "Batman Forever", "Grown-Ups", "FAM culture", "OBS crash"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 760, end: 1080, label: "DUMB AND DUMBER QUOTE NIGHT", topic: "Comedy canon", body: "Play the Dumb and Dumber run for the densest concentration of remembered lines and tiny scene details in the show.", playAt: 760, playEnd: 1080 }),
      hated: Object.freeze({ at: 0, end: 360, label: "OBS GETS THE FIRST ROAST", topic: "Technical chaos", body: "Play the restart for the night's most concentrated failure receipt: the program crashes, the link gets re-sent, and the room laughs its way back into existence.", playAt: 0, playEnd: 360 }),
      wildestDetour: Object.freeze({ at: 1050, end: 1320, label: "AOL 8.0 AND THE BUBBA REVELATION", topic: "WWAM Up in Ya", body: "Play the cybersex/AOL detour for the episode's most unhinged confession and the hosts' attempt to turn it into character writing advice.", playAt: 1050, playEnd: 1320 }),
      lastWord: Object.freeze({ at: 5920, end: 6115, label: "THE NEXT BATMAN BRACKET", topic: "Future canon", body: "Play the final roadmap: Carrey's win, Sandler's flowers, the mystery guest, the character interview fallback, and a future Batman-versus-Batman fight.", playAt: 5920, playEnd: 6115 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 90, end: 125, name: "Vinnie C", kind: "chat receipt", note: "Suggests a RAM issue while the hosts diagnose the OBS crash." },
        { at: 220, end: 245, name: "Stephen", kind: "chat receipt", note: "Is read during the return-to-air troubleshooting and smaller-room welcome." },
        { at: 270, end: 300, name: "Chad Wilson", kind: "chat receipt", note: "Offers to help with the stream and describes himself as cheap and nasty; no donation amount is inferred." },
        { at: 560, end: 590, name: "Vanessa", kind: "chat receipt", note: "Confirms the earlier count was interrupted and helps restart the Happy Gilmore/Dumb and Dumber vote." },
        { at: 865, end: 900, name: "Sean Davis", kind: "Super Chat", note: "Sends the pantsless packing update and asks what color the hosts are wearing; the booth answers with the pink joke." },
        { at: 1770, end: 1810, name: "Sanjan Music", kind: "chat receipt", note: "Adds the prime-Cameron-Diaz observation to the Mask versus Wedding Singer round." },
        { at: 2860, end: 2910, name: "Jake Holland", kind: "chat receipt", note: "Says hello and receives the repeated Jason Bourne/'fucking Benz' welcome." },
        { at: 3080, end: 3130, name: "Vinny C", kind: "chat receipt", note: "Supplies the Big Daddy rat-in-the-golf-hole memory." },
        { at: 3320, end: 3370, name: "Gypsy Warrior", kind: "chat receipt", note: "Asks what commentary is next after The Crow and says a laugh was needed after personal stuff." },
        { at: 5260, end: 5310, name: "Intel Wild", kind: "Super Chat", note: "Offers $100 to keep the hosts talking for another hour; the booth acknowledges the explicit offer and declines because they are drunk." },
        { at: 5570, end: 5605, name: "Robbie Rewind", kind: "chat receipt", note: "Poses the Val Kilmer versus Jim Carrey baseball-bat fight question." },
        { at: 5960, end: 6000, name: "Paige Almer", kind: "chat receipt", note: "Adds a Flaming Lips/YouTube music tangent during the birthday and guest-planning close." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. Explicit offers are reported as spoken; no payment or identity beyond the tape is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
