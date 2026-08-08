(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "49fgU_fj9_0";
  var duration = 3490;
  var H = function (at, end, category, label, excerpt, characters) {
    var item = {
      at: Math.max(0, Math.round(at)),
      end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))),
      category: category,
      label: label,
      excerpt: excerpt,
      sourceId: sourceId,
      evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority"
    };
    if (characters) item.characters = characters;
    return item;
  };

  /* June 20, 2024: an afternoon pop-up room that starts with The Penguin,
     detours through viral clips and a Kentucky horseback story, then lands on
     WWE's Wyatt Six, Loomis/Challis roleplay, and The Front Room. */
  var highlights = [
    H(0,120,"ROOM BREAK","JESUS IS IN THE ROOM","The unusually bright Thursday opener becomes a fake religious broadcast before the hosts admit the real reason for the stream: a new trailer dropped and they could not wait."),
    H(120,240,"CHARACTER PERFORMANCE","LOOMIS MEETS SLENDERMAN ON COMMAND","A fan requests Dr. Loomis mixed with Slender Man and Mark Wahlberg mixed with Leatherface. The order is absurdly specific, the time is wrong, and the hosts still try to honor it.",["Dr. Loomis","Slender Man","Mark Wahlberg","Leatherface"]),
    H(240,360,"WWAM UP IN YA","THE COFFEE ARGUMENT TURNS INTO A STREET CONFESSION","Coffee is rejected as a traumatic beverage, then the room takes the joke somewhere far more deranged than a latte menu. This is the first warning that a one-hour stream is already lying."),
    H(360,520,"FAM SIGNAL","ALISTAR SEES THE AFTERNOON ROOM FROM THE UK","An overseas fan explains why the odd start matters. The hosts thank the UK audience, then immediately turn London stereotypes and a viral slap into a WWAM welcome ritual."),
    H(520,680,"STRAIGHT TO STEVE'S ASSHOLE","THE HORSEBACK-RIDING SETUP","A drunken South Carolina horseback excursion begins with a Kentucky stereotype, a bad hangover, and a saddle that apparently requires a box and a personal grudge."),
    H(680,820,"STRAIGHT TO STEVE'S ASSHOLE","THE OLD WEST SMELLS LIKE A SEWER","Romantic western imagery gets dragged through horse waste, frothy ground, and the claim that Tombstone probably smelled like an open sewer. The historical texture is filthy and unforgettable."),
    H(820,980,"FILM READ","THE PENGUIN TRAILER ENTERS THE ROOM","The first full trailer watch establishes a flooded Gotham, a Falcone power vacuum, and a Penguin who wants the city rather than a cartoon gimmick."),
    H(980,1140,"FILM READ","PENGUIN AS SOPRANOS-BATMAN","Mike and Jay immediately read the show as a mob drama with Gotham architecture. Colin Farrell's makeup, the HBO lettering, and the Arkham games become the comparison points."),
    H(1140,1280,"LORE DOOR","NO MAN'S LAND WITHOUT A BATMAN CAMEO","The flooded-city premise sends the room into No Man's Land, The Dark Knight Rises, Riddler fallout, and the hope that the show can stand on its own before a crossover arrives."),
    H(1280,1420,"FILM READ","CLANCY BROWN AND THE PET SEMATARY 2 DETOUR","A cast member's name is forgotten, then recovered through Clancy Brown, Pet Sematary Two, Pumpkinhead, Judd Nelson, and the unsettling value of an actor who looks like he belongs in the woods."),
    H(1420,1540,"FAM SIGNAL","BRIDE OF CHUCKY AND ENTOURAGE COLLIDE","Jason's chat message pairs the Bride soundtrack with Entourage. Jay denies watching the show, gets quizzed on Jeremy Piven's character, and turns the entire exchange into a failed pop-culture exam."),
    H(1540,1680,"STRAIGHT TO STEVE'S ASSHOLE","THE COFFEE MUG WAR","A fan asks about coffee and Jay invents a ceramic-mug/stainless-steel-mug origin story for his lifelong refusal. The bit works because every healthy suggestion is treated like an assassination attempt."),
    H(1680,1800,"WWAM UP IN YA","WILLIE SMELLED LIKE THE APOCALYPSE","A GED-school teacher's blunt classroom insult becomes a grotesque smell comparison, then a deep-fake video gives the hosts permission to keep escalating the memory."),
    H(1800,1940,"WWAM UP IN YA","BUTTERED SAUSAGE HAS ENTERED THE CHAT","A clipped Biden-style non-answer becomes the day's master phrase: what it is, what it does, where it comes from, and why nobody wants it in their face."),
    H(1940,2100,"STRAIGHT TO STEVE'S ASSHOLE","THE FUNCTIONING-ALCOHOLIC CLOCK","The room maps the daily promise not to drink, the 4 p.m. devil knocking, and the vacation version where every final drink creates another final drink. It is funny because the self-own is accurate."),
    H(2100,2220,"FAM SIGNAL","GIRTH BROOKS AND THE CHAT'S GAMERTAG ECONOMY","A fan's profile picture, a new volleyball-team name, and a gamertag called Girth Brooks prove that the FAM can turn a two-second donation into a full recurring bit."),
    H(2220,2360,"FILM READ","BLUMHOUSE GETS THE BLAIR WITCH TRASH-FIRE","A fan asks about the Blumhouse Blair Witch project. The hosts call it a bad home for the IP, compare the company to a 1990s shopping spree, and invent the poopy-fingers kid who ruins the toy aisle."),
    H(2360,2480,"LORE DOOR","POOPY FINGERS CREATED JAY'S GHOSTBUSTERS LOVE","A childhood toy-store theft becomes a tiny origin myth: the Turtles disappear into another kid's cart, Ghostbusters becomes the consolation prize, and Jay's favorite movie is born out of retail injustice."),
    H(2480,2600,"MUSIC READ","PEANUT-BUTTER WHISKEY BECOMES A COUNTRY SONG","A fan asks about Screwball. Mike turns peanut-butter whiskey into a Louisiana truck anthem, complete with tight jeans, Walmart, bread, and whiskey on opposite hands."),
    H(2600,2740,"WRESTLING READ","WYATT SIX IS CREEPY, CORNY, AND COMPLICATED","The hosts separate the cool look from the uneasy WWE capitalization of Bray Wyatt's legacy, question the dead-wrestler imagery, and admit the group looks like White Zombie or Slipknot walking into a concert."),
    H(2740,2860,"WRESTLING READ","KAYFABE CANNOT GO BACK IN THE BOX","The Wyatt Six conversation becomes a compact explanation of why modern wrestling cannot pretend the audience does not know the performers are alive, fired, or returning."),
    H(2860,3000,"FILM READ","TWISTERS GETS THE BIG-SCREEN TEST","The room is excited to see a tornado movie theatrically but skeptical about Glen Powell. Kentucky tornado season and a July 19 release turn weather anxiety into release-date math."),
    H(3000,3120,"CHARACTER PERFORMANCE","LOOMIS AND CHALLIS TRADE INSULTS","A fan asks the recurring doctors to impersonate one another. Loomis diagnoses Challis, Challis confesses to a fictional criminal résumé, and the fourth-wall crack is the actual punchline.",["Dr. Loomis","Dr. Challis"]),
    H(3120,3260,"FILM READ","THE FRONT ROOM TRAILER GETS A SECOND LOOK","Brandy's A24 horror trailer starts as a confused watch, then the hosts track the newborn, the religious mother-in-law, the curse-shaped house, and the mystery of whether it is scary or accidentally hilarious."),
    H(3260,3380,"STRAIGHT TO STEVE'S ASSHOLE","A LIFETIME MOVIE WITH HOLY-SPIRIT TEETH","The first impression is made-for-TV, the second is more generous: the hosts see a dark family mirror, a potentially fun black-comedy tone, and enough bizarre religious energy to justify a future commentary."),
    H(3380,3490,"FAM SIGNAL","BRAY WYATT, MEMBERS, AND THE FILTHY GOODNIGHT","A final Bray Wyatt correction, a members-channel announcement, fan thanks, and one last bathroom sign-off close an afternoon stream that promised an hour and left a complete mini-canon behind.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the June 20, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 12751,
      captionEvents: 3356,
      captionSpanSeconds: 3490.481,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "3bc9ae4e559bd788e29f49b59b32130ebe9f60d51b75a835e29e327d394a04e2",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "0aa2c1950c69c84740d1d372d2fe10d68ab88a69b0e6fc2cfa28406112541a06",
      asrWindowCount: 22,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "THURSDAY AFTERNOON LIVE // JUNE 20, 2024",
    badge: "FULL SHOW WIKI // PENGUIN, BUTTERED SAUSAGE, WYATT SIX, AND THE FRONT ROOM",
    headline: "THE PENGUIN TRAILER, A HORSE'S BIGGEST SECRET, AND LOOMIS/CHALLIS AFTER DARK",
    deck: "A supposedly short afternoon room that turns a Penguin trailer, viral clips, Kentucky horseback lore, WWE grief, and fan character requests into one filthy little WWAM time capsule.",
    overview: "The June 20 room is short by WWAM standards and still refuses to behave. It opens with a bright Thursday fake-religious bit, a fasting confession, a request for Loomis mixed with Slender Man, and an overseas FAM check-in. The Penguin trailer then gives the first half a real spine: flooded Gotham, a Falcone power vacuum, Colin Farrell's transformation, The Sopranos, No Man's Land, and the decision to let a Batman-adjacent show breathe before the crossover machinery arrives. The room keeps slipping sideways into the exact material a normal recap would lose. Two viral-video clips become a debate about why people upload their own humiliation. A South Carolina horseback ride becomes a Kentucky stereotype, a torn-up body, and the least romantic western history lesson ever delivered. Bride of Chucky, Entourage, a coffee-mug trauma story, a GED-school smell legend, and the phrase buttered sausage form the comedy spine. The back half moves through a functioning-alcoholic clock, Girth Brooks, a proposed Blumhouse Blair Witch film, the poopy-fingers child who accidentally created Jay's Ghostbusters love, peanut-butter whiskey as country music, and WWE's Wyatt Six. The final run is all character and trailer lore: Twisters gets a theatrical maybe, Loomis and Challis impersonate each other, The Front Room gets a second trailer read, and the hosts discover that a movie can look like a Lifetime original while also carrying real A24 menace. The receipts are timestamped; the punchlines are theirs; playback remains the final authority.",
    topics: Object.freeze(["The Penguin", "The Batman", "Sopranos", "Dr. Loomis", "Slender Man", "Dr. Challis", "The Front Room", "Brandy", "WWE Wyatt Six", "Bray Wyatt", "Twisters", "Bride of Chucky", "Entourage", "Blair Witch", "Ghostbusters", "The FAM"]),
    story: Object.freeze([
      { at: 0, end: 420, label: "THE AFTERNOON ROOM AND THE IMPOSSIBLE CHARACTER ORDER", body: "A bright Thursday, a fasting confession, an overseas hello, and a request for Loomis/Slender Man and Wahlberg/Leatherface establish a room that was never going to stay on schedule." },
      { at: 420, end: 840, label: "THE HORSEBACK STORY THAT KILLS THE OLD WEST", body: "A Kentucky stereotype, a South Carolina ride, torn-up legs, and the smell of horse country turn western romance into public-health comedy." },
      { at: 840, end: 1280, label: "PENGUIN RISES THROUGH FLOODED GOTHAM", body: "The Penguin trailer gets a real read: Falcone's death, a power vacuum, Colin Farrell's makeup, The Sopranos, Arkham, and No Man's Land all point toward a grounded mob story." },
      { at: 1280, end: 1680, label: "BRIDE, ENTOURAGE, AND THE COFFEE-MUG WAR", body: "Clancy Brown and Pet Sematary Two lead into Bride of Chucky, an Entourage quiz, and the invented coffee trauma that makes every healthy beverage sound like a personal attack." },
      { at: 1680, end: 2100, label: "WILLIE, BUTTERED SAUSAGE, AND THE FOUR-P.M. DEVIL", body: "A GED-school smell memory, a deep-fake clip, and a running phrase create the room's central comedy lane before the hosts map the daily promise not to drink." },
      { at: 2100, end: 2480, label: "FAM GAMERTAGS, BLAIR WITCH, AND POOPY FINGERS", body: "Girth Brooks, the FAM's profile pictures, Blumhouse skepticism, and a childhood toy-store injustice explain how Ghostbusters became Jay's favorite movie." },
      { at: 2480, end: 2860, label: "PEANUT-BUTTER WHISKEY AND WYATT SIX", body: "A Screwball country song gives way to a careful Bray Wyatt discussion, WWE capitalization anxiety, White Zombie comparisons, and the death of kayfabe." },
      { at: 2860, end: 3120, label: "TWISTERS AND THE LOOMIS/CHALLIS CROSSOVER", body: "Theatrical tornado hopes, Kentucky weather math, and a fan-requested doctor swap make the final third feel like a trailer desk and a character stage at once." },
      { at: 3120, end: 3490, label: "THE FRONT ROOM: LIFETIME ENERGY, A24 TEETH", body: "Brandy's trailer gets a second look, the religious mother-in-law becomes a dark family mirror, and the room signs off with members news, Bray Wyatt context, and a filthy goodnight." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 840, end: 1280, label: "THE PENGUIN SOPRANOS READ", topic: "a Gotham mob drama that can stand without Batman", body: "Play from 14:00. The hosts land on the flooded-city power vacuum, Colin Farrell's transformation, and the idea that a later crossover should feel earned.", playAt: 840, playEnd: 1280 }),
      hated: Object.freeze({ at: 2560, end: 2740, label: "WYATT SIX'S GRUDGE GIRL", topic: "the look works better than every creative choice", body: "Play from 42:40. The hosts separate respect for Bray Wyatt from WWE's uneasy attempt to turn grief into a supernatural faction.", playAt: 2560, playEnd: 2740 }),
      wildestDetour: Object.freeze({ at: 520, end: 700, label: "THE HORSE'S BIGGEST SECRET", topic: "western romance is mostly piss, smell, and a box", body: "Play from 8:40. The Kentucky horseback story starts as a stereotype and ends as a full attack on the clean Hollywood West.", playAt: 520, playEnd: 700 }),
      lastWord: Object.freeze({ at: 3000, end: 3380, label: "LOOMIS, CHALLIS, AND THE FRONT ROOM", topic: "character comedy meets a potentially nasty A24 family horror", body: "Play from 50:00. The doctors swap voices, then Brandy's trailer gets a surprisingly thoughtful second look.", playAt: 3000, playEnd: 3380 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
