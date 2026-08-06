(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /*
   * Christmas 2025 is promoted from the structured layer after a complete
   * local caption/audio read. The prose stays bounded to the canonical
   * upload, its caption ledger, and the local Whisper alignment; no speaker
   * or visual reaction is invented where the source does not establish it.
   */
  sources["QMYgsEfPMg0"] = Object.freeze({
    sourceId: "QMYgsEfPMg0",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 12255,
      captionWords: 45854,
      captionEvents: 13068,
      captionSpanSeconds: 12257.04,
      captionDurationCoveragePercent: 100,
      captionSha256:
        "sha256:66809b2efe4b920d91a006d82aeb1de7d4ce630f261ca17c89293e5d81cf0429",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256:
        "deae6ce013727e65a7909cf39d87f238572ae94a1460ebcf9e6687ff3208a80e",
      asrWindowCount: 48,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "CHRISTMAS GETS RANKED, LOOMIS GETS A TOILET WARNING",
    badge: "FULL SHOW WIKI // 3:24:15 OF HOLIDAY CHAOS",
    headline:
      "CHRISTMAS MOVIES GET A HOLIDAY COURT DATE, CORY FELDMAN CALLS IN, AND LOOMIS IS TOLD NOT TO EAT THE YELLOW STONE.",
    deck:
      "The December 22 Christmas tier-list stream is a proper WWAM holiday party: movie arguments, Christmas shopping resentment, a Hans Gruber detour, a Cory Feldman legal update, a surprise pregnancy reveal, fan check-ins, and enough Loomis/Challis filth to make the tree file a complaint.",
    overview:
      "This is the Christmas show that refuses to behave like a Christmas show. It opens with the hosts attacking fake holiday sales and financing everything on the next generation's credit, then immediately pivots to a serious-looking Odyssey trailer before the room remembers it is here to rank movies and say terrible things. Die Hard, Home Alone, Elf, Bad Santa, Reindeer Games, The Santa Clause, The Grinch, Christmas Chronicles, and a pile of questionable seasonal titles move through a loose tier list while the chat keeps adding ammunition. Along the way, Alan Rickman's Hans Gruber gets the worship he deserves, a Cory Feldman message becomes a miniature courtroom, a fan's horror-character entrance-music idea gets stolen on the spot, and the late show turns unexpectedly warm when the guys talk about pregnancy, family, malls disappearing, and viewers who carried them through the year. The finish is pure WWAM: a surprise $100 fan message, a Dirk Diggler bit, one more Christmas promise, and a threat to come down your chimney and finger your butt if you fail to enjoy yourself.",
    story: Object.freeze([
      {
        at: 0,
        end: 1199,
        label: "THE SALE SIGN IS A FINANCING SCAM",
        body:
          "The cold open is a holiday anti-commercial. The guys argue that stores call something a sale when it is really old inventory with a new sticker, then confess that most of one host's Christmas is sitting on next-generation credit. A serious Odyssey trailer briefly appears before the room remembers it has no obligation to stay respectable.",
      },
      {
        at: 1200,
        end: 2399,
        label: "DIE HARD ARRIVES WITH HANS GRUBER",
        body:
          "Die Hard gets its all-timer hearing, with Alan Rickman treated as Hans Gruber first and every other performance second. The hosts revisit the commentary, the party, the elevator, and the strange cultural habit of using a Christmas movie as a yearly courtroom exhibit.",
      },
      {
        at: 2400,
        end: 3199,
        label: "HOME ALONE 2 WANTS THE GOLD",
        body:
          "Home Alone and Home Alone 2 enter the tier list as legitimate all-timers. The sequel gets the edge because Marv and Harry get more room to be destroyed, Tim Curry is present, and the traps are still allowed to turn a hotel hallway into an attempted homicide investigation.",
      },
      {
        at: 3200,
        end: 4199,
        label: "REINDEER GAMES, BAD SANTA & THE BLACK CHRISTMAS DETOUR",
        body:
          "Reindeer Games gets a passionate defense, Bad Santa gets the almost-all-timer treatment, and the room argues about whether Christmas can go one year without a culture-war side quest. Black Christmas enters the conversation and immediately proves that even the holiday tier list can become a mask-and-politics argument.",
      },
      {
        at: 4200,
        end: 5199,
        label: "MICHAEL MYERS NEEDS ENTRANCE MUSIC",
        body:
          "A fan suggests ranking horror characters by entrance music. Michael gets 'Rock You Like a Hurricane' in the conversation, the idea is openly stolen as a future video, and the stream demonstrates why WWAM's best ideas often arrive as somebody else's superchat.",
      },
      {
        at: 5200,
        end: 6199,
        label: "HOME ALONE 2 GETS THE TIM CURRY DEFENSE",
        body:
          "The sequel's expanded cast becomes the case for its placement: Marv and Harry get more screen time, Tim Curry is allowed to be Tim Curry, and the holiday tier list turns into a defense of comic actors who understood exactly how hard to push a face.",
      },
      {
        at: 6200,
        end: 7199,
        label: "SANTA'S GLOVES LOOK LIKE A CRIME SCENE",
        body:
          "Christmas Chronicles gets credit for Kurt Russell's Santa while also being accused of looking like a man who is about to dispose of evidence in those gloves. Silent Night, Deadly Night and other seasonal oddities keep the list from becoming a corporate greeting card.",
      },
      {
        at: 7200,
        end: 8199,
        label: "LOOMIS AND CHALLIS AUDIT THE TOILET",
        body:
          "A fan asks for a Loomis/Challis bit and receives the most practical medical advice in the archive: do not eat the yellow stone, do not trust brown toilet paper, and do not let either recurring character near a holiday buffet without supervision.",
      },
      {
        at: 8200,
        end: 9199,
        label: "THE MALL IS DISAPPEARING",
        body:
          "The stream widens into memory. A viewer brings up a childhood mall video, the guys talk about brick-and-mortar stores dying, and the Christmas list becomes a record of places and rituals the internet cannot quite replace.",
      },
      {
        at: 9200,
        end: 10199,
        label: "THE SURPRISE REVEAL CHANGES THE ROOM",
        body:
          "A pregnancy reveal pulls the show out of the tier-list lane. The hosts react with genuine warmth, talk about staying healthy long enough to see a child graduate, and let the holiday stream become a little more honest than planned.",
      },
      {
        at: 10200,
        end: 11199,
        label: "LEATHERFACE, STEP BROTHERS & THE LONG GOODBYE",
        body:
          "The audience asks for Leatherface, Step Brothers bits appear, and the room keeps accepting messages long after a normal broadcast would have ended. The hosts talk about future character requests, new projects, and how quickly a warm holiday show can turn filthy again.",
      },
      {
        at: 11200,
        end: 12255,
        label: "THE TREE GETS A DIRTY SIGN-OFF",
        body:
          "The final stretch is a thank-you letter with a WWAM mouth. A fan calls the channel two unscripted friends having fun, the hosts answer with real gratitude, then close by promising to come down the chimney and finger everybody's butt if Christmas goes badly. It is affectionate, obscene, and exactly the point.",
      },
    ]),
    highlights: Object.freeze([
      { at: 18, end: 45, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE SALE SIGN IS A LIE", excerpt: "Holiday pricing gets treated like old inventory wearing a fake mustache and calling itself a bargain." },
      { at: 103, end: 130, category: "WWAM UP IN YA", label: "CHRISTMAS ON NEXT YEAR'S CREDIT", excerpt: "The holiday budget is revealed to be a future problem with wrapping paper on it." },
      { at: 265, end: 290, category: "TAKE GETS NUCLEAR", label: "ODYSSEY GETS THE EARLY HYPE", excerpt: "A serious trailer prediction arrives before the room can stop making holiday jokes." },
      { at: 540, end: 566, category: "WWAM UP IN YA", label: "THE WHITE CHRISTMAS DISCLAIMER", excerpt: "A perfectly ordinary holiday phrase gets dragged through the internet's worst possible interpretation." },
      { at: 770, end: 800, category: "BEST MOMENT", label: "HANS GRUBER GETS HIS CROWN", excerpt: "Alan Rickman's villain walks into the seasonal conversation and immediately owns the building." },
      { at: 1025, end: 1052, category: "CHARACTER SIGNAL", label: "FELDMAN CALLS THE COURT", excerpt: "A Cory Feldman update is delivered with the cadence of a man preparing to sue the moon." },
      { at: 1390, end: 1418, category: "TAKE GETS NUCLEAR", label: "DON'T FEED HIM AFTER MIDNIGHT", excerpt: "Gremlins advice becomes a personal drinking and sugar warning in the same breath." },
      { at: 1650, end: 1680, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "HOLLYWOOD WARNED US ABOUT HOLLYWOOD", excerpt: "Die Hard's party scene becomes an excuse to indict the entire entertainment industry." },
      { at: 1884, end: 1910, category: "BEST MOMENT", label: "HANS GRUBER ONE THOUSAND PERCENT", excerpt: "The room refuses to let anyone pretend Alan Rickman is not the reason the movie works." },
      { at: 2230, end: 2258, category: "FAN SIGNAL", label: "CORY FELDMAN'S HASHTAG TRUTH", excerpt: "A fan message turns into a courtroom-ready Feldman performance before the tier list can continue." },
      { at: 2505, end: 2536, category: "BEST MOMENT", label: "HOME ALONE 2 GETS THE EDGE", excerpt: "The sequel wins the all-timer argument by giving Marv and Harry more room to suffer." },
      { at: 2755, end: 2785, category: "WWAM UP IN YA", label: "THE SUN DOESN'T SHINE THERE", excerpt: "A holiday tier placement gets rejected with a line no family card should ever contain." },
      { at: 3020, end: 3054, category: "TAKE GETS NUCLEAR", label: "REINDEER GAMES GETS ITS LAWYER", excerpt: "Ben Affleck's maligned Christmas thriller gets an unexpectedly passionate defense." },
      { at: 3280, end: 3310, category: "BEST MOMENT", label: "BAD SANTA IS ALMOST HOLY", excerpt: "Bad Santa is placed near the top because its Christmas spirit comes with a felony record." },
      { at: 3502, end: 3532, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE POLE IS NOT A POLE", excerpt: "A poll becomes a pole, and the room refuses to let the accidental double meaning die." },
      { at: 3690, end: 3720, category: "TAKE GETS NUCLEAR", label: "BLACK CHRISTMAS GETS PUT ON TRIAL", excerpt: "The holiday horror debate finds a mask and immediately starts cross-examining the season." },
      { at: 4230, end: 4260, category: "FAN SIGNAL", label: "MICHAEL'S ENTRANCE MUSIC", excerpt: "A fan suggests ideal entrance music for horror characters and accidentally pitches a future WWAM video." },
      { at: 4310, end: 4340, category: "CHARACTER SIGNAL", label: "MICHAEL GETS ROCK YOU LIKE A HURRICANE", excerpt: "The Shape's walkout music is imagined with the confidence of a wrestling booking meeting." },
      { at: 4490, end: 4522, category: "CREATOR MEMORY", label: "THE IDEA GETS STOLEN IMMEDIATELY", excerpt: "The hosts admit the fan's idea is better than their own and claim it anyway." },
      { at: 5430, end: 5464, category: "BEST MOMENT", label: "MARV AND HARRY GET MORE SCREEN TIME", excerpt: "Home Alone 2 wins another argument by giving its human cartoon villains more chances to break bones." },
      { at: 5570, end: 5600, category: "WWAM UP IN YA", label: "TRUMP, TIM CURRY, AND THE LOBBY", excerpt: "A hotel cast list becomes a holiday detour nobody could have outlined sober." },
      { at: 6025, end: 6060, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "SANTA LOOKS LIKE HE HID A BODY", excerpt: "Kurt Russell's gloves are treated as evidence in a Christmas crime scene." },
      { at: 6435, end: 6465, category: "TAKE GETS NUCLEAR", label: "THE JOLLY MOTHERFUCKERS PLAN", excerpt: "A Santa movie is defended as a machine for turning the room into aggressively cheerful drunks." },
      { at: 6710, end: 6750, category: "TAKE GETS NUCLEAR", label: "SILENT NIGHT, DEADLY NIGHT GETS EXECUTED", excerpt: "The room calls the plastic holiday slasher a bad movie and dares it to argue back." },
      { at: 7030, end: 7060, category: "FAN SIGNAL", label: "LOOMIS CHALLIS TOILET RULES", excerpt: "A Dr. Loomis/Dr. Challis request produces the archive's worst seasonal dietary advice." },
      { at: 7170, end: 7200, category: "CHARACTER SIGNAL", label: "DON'T EAT THE YELLOW STONE", excerpt: "Loomis and Challis are deployed as a holiday public-health department nobody asked for." },
      { at: 7310, end: 7345, category: "WWAM UP IN YA", label: "BING CROSBY GETS CALLED DEPRESSING", excerpt: "The Christmas music debate chooses blunt honesty over seasonal diplomacy." },
      { at: 7515, end: 7550, category: "SERIOUS ROOM", label: "THE LONG GAME OF STAYING ALIVE", excerpt: "A health conversation turns unexpectedly sincere as the hosts imagine being present for a child's future." },
      { at: 7860, end: 7895, category: "FAN SIGNAL", label: "THE SURPRISE PREGNANCY REVEAL", excerpt: "A message changes the room from movie rankings to genuine congratulations." },
      { at: 8375, end: 8412, category: "COMMUNITY MEMORY", label: "THE MALL IS A GHOST", excerpt: "A viewer's childhood-mall story opens a conversation about the places the internet replaced." },
      { at: 8550, end: 8585, category: "FAN SIGNAL", label: "THE CHAT CARRIES THE YEAR", excerpt: "The hosts name the regulars who kept showing up and kept the room moving." },
      { at: 9020, end: 9055, category: "WWAM UP IN YA", label: "BILLY BOB GETS A DIRTY PFP READ", excerpt: "A fan image is described with enough violence to qualify as its own character bit." },
      { at: 9250, end: 9285, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "SOBER WWAM IS MORE OFFENSIVE", excerpt: "The guys realize alcohol is not responsible for the worst things they say." },
      { at: 9650, end: 9690, category: "CREATOR MEMORY", label: "BROCCOLI UNTIL GRADUATION", excerpt: "A future-parent promise turns the holiday stream into a health intervention." },
      { at: 10225, end: 10262, category: "CHARACTER SIGNAL", label: "LEATHERFACE GETS REQUESTED", excerpt: "The audience asks for another character performance and the room tries to remember how the voice works." },
      { at: 10440, end: 10478, category: "WWAM UP IN YA", label: "THE METHADONE CLINIC COMPARISON", excerpt: "A character voice falls apart and gets compared to a customer who should not be operating machinery." },
      { at: 10850, end: 10892, category: "CREATOR MEMORY", label: "THE PLANTERS PEANUTS AMBUSH", excerpt: "A childhood gift story escalates from peanuts to a five-dollar bill and a triple-layered embarrassment." },
      { at: 11120, end: 11158, category: "FAN SIGNAL", label: "NO SCRIPTS, JUST TWO FRIENDS", excerpt: "A $100 message describes the channel's appeal better than any mission statement could." },
      { at: 11378, end: 11418, category: "WWAM UP IN YA", label: "DIRK DIGGLER EXPLAINS THE TECHNIQUE", excerpt: "The sign-off takes a sudden adult-film detour and then pretends that was normal." },
      { at: 11760, end: 11805, category: "CHARACTER SIGNAL", label: "THE TREE GETS A FINGERING THREAT", excerpt: "Christmas ends with a chimney promise that is loving, disgusting, and impossible to misread." },
      { at: 12008, end: 12052, category: "LAST CALL", label: "MERRY CHRISTMAS, YOU FILTHY ANIMALS", excerpt: "The final thank-you keeps the affection and the threat in the same sentence." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({
        at: 2505,
        end: 3054,
        label: "THE HOME ALONE / REINDEER GAMES RUN",
        topic: "holiday all-timers and the movies people defend after midnight",
        body: "This is the cleanest Christmas-movie lane: a real tier-list argument, a sequel defense, and a sudden Ben Affleck rescue mission.",
        playAt: 2505,
        playEnd: 3054,
      }),
      hated: Object.freeze({
        at: 3690,
        end: 3720,
        label: "THE BLACK CHRISTMAS FIGHT",
        topic: "a seasonal horror title the room refuses to place gently",
        body: "The show can disagree without sanding the edges off. Black Christmas gets the full WWAM cross-examination.",
        playAt: 3690,
        playEnd: 3720,
      }),
      wildestDetour: Object.freeze({
        at: 7030,
        end: 7345,
        label: "LOOMIS, CHALLIS & BROWN TOILET PAPER",
        topic: "recurring characters doing holiday public health",
        body: "A fan request produces yellow-stone warnings, brown-paper panic, and the exact kind of character callback that should be one click away on every episode.",
        playAt: 7030,
        playEnd: 7345,
      }),
      lastWord: Object.freeze({
        at: 11120,
        end: 12052,
        label: "THE UNSCRIPTED HOLIDAY AFTERSHOW",
        topic: "fan gratitude, Dirk Diggler, and the chimney threat",
        body: "The list is over, but the community keeps the tape alive until the goodbye becomes its own dirty little Christmas special.",
        playAt: 11120,
        playEnd: 12052,
      }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
