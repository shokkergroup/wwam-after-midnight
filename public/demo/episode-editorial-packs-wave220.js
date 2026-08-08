(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "TfITyYggBU4";
  var duration = 11648;
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

  /* June 4, 2024: a three-hour room that begins with Fallout 76 and comedy,
     crosses Caitlin Clark, Scarefest, and Batman, then spends its back half on
     Alien: Romulus, Predator, Venom 3, Tom Hardy, and a filthy farewell. */
  var highlights = [
    H(0,180,"GAMING SIGNAL","FALLOUT 76 TEABAGGING BACKFIRES","Mike opens with a game story in which a taunt, a revenge plan, and a higher-level player turn into an immediate digital execution."),
    H(180,360,"GAMING SIGNAL","THE LEVEL-100 EXCUSE","The room argues whether the other players were better or merely more experienced, then lands on the oldest gamer defense: go outside and see the sun."),
    H(360,540,"ROOM BREAK","THE NUKE TAKES FORTY-FIVE MINUTES","A long Fallout activation plan becomes a miniature production disaster. The apology is sincere, the revenge is petty, and the lobby has already moved on."),
    H(540,720,"COMEDY READ","JOE ROGAN'S COMEDY ECOSYSTEM","Rogan's crew, Brendan Schaub, Tom Segura, and the difference between a funny joke and a terrifyingly red face become the first comedy-history lane."),
    H(720,900,"COMEDY READ","WHEN A COMIC TAKES IT ONE STEP TOO FAR","The hosts defend the job of provoking people while admitting that likable comedians can become unbearable when the bit becomes their entire personality."),
    H(900,1080,"COMEDY READ","WEED IS NOT A PERSONALITY","A debate about weed comics, Chris Rock, Eddie Murphy, and delivery turns into a useful distinction between a comic's subject matter and the comic's whole identity."),
    H(1080,1260,"SPORTS READ","CAITLIN CLARK CHANGED THE FLIGHT PLAN","The WNBA argument is framed around attendance, charter flights, and coverage rather than denying that other players exist. The room's tone is blunt, not subtle."),
    H(1260,1440,"SPORTS READ","STOP TARGETING THE GOLDEN GOOSE","A hard foul on Clark becomes a sports-media argument about attention, protection, and why a league should not punish the player who makes more people watch."),
    H(1440,1620,"WRESTLING READ","THE HELMET IS NOT A PUNCHLINE","A football comparison gives way to the line between a normal hard foul and a dangerous hit. The room keeps the focus on consequences, not outrage theater."),
    H(1620,1800,"FAM SIGNAL","THE LAST STREAM BEFORE VACATION","The chat learns the schedule, the hosts promise a short room, and the lie is already obvious: the community keeps adding doors faster than they can close them."),
    H(1800,1980,"FILM READ","ALIEN DNA TESTS ARE NOT A PLAN","A fan asks about the next Alien story. The hosts reject a facehugger family-tree explanation and keep the franchise's biological horror grounded."),
    H(1980,2160,"FAM SIGNAL","SCAREFEST BATHROOM SURVIVAL","A Scarefest meetup story turns into a dark-bathroom misunderstanding, a stranger's threat, and the exact kind of fan-convention folklore that deserves a timestamp."),
    H(2160,2340,"WRESTLING READ","WCW BACKSTABBER LORE","Ric Flair, Vince Russo, and a damaged WCW legacy become the bridge from a convention story into a discussion of sabotage and bad leadership."),
    H(2340,2520,"GAMING SIGNAL","FALLOUT 76 ACTUALLY GOT FIXED","The hosts answer a late fan: the game was rough, updates helped, and a formerly broken online world can become playable if the developers stay with it."),
    H(2520,2700,"WWAM UP IN YA","THE 2K WRESTLING GAME'S CHAT WAR","A fan-created WWE 2K scenario, a mystery movie title, and a question about the biggest host disagreements turn the room into a fan-controlled menu."),
    H(2700,2880,"FILM READ","SCREAM IS THE FRANCHISE ARGUMENT","Mike and Jay disagree about the Scream series rather than the first movie. A new trailer gets judged on the oldest WWAM scale: could it actually be good, or is it just loud?"),
    H(2880,3060,"STRAIGHT TO STEVE'S ASSHOLE","THE SHAWN MICHAELS WIFE-PASS","A marriage joke becomes a repeated dance bit. It is funny because the hosts know exactly how childish it is and keep doing it anyway."),
    H(3060,3240,"FILM READ","TANGO & CASH IS MACHISMO MEDICINE","The room recommends Tango & Cash as a dose of sweat, fighting, belts, and impossible action logic for anyone who needs a movie to kick open the door."),
    H(3240,3420,"NEWS REACTION","STAR WARS AS A COMMODITY","George Lucas, Disney, messaging, and the feeling that Star Wars has been turned into a product shelf become a broader argument about how franchises lose oxygen."),
    H(3420,3600,"FILM READ","TERRIFIER 3 NEEDS A NEW TRICK","The hosts want the gore to stay excellent but hope the next film moves beyond angel-versus-demon machinery. The anticipation is real; the skepticism is part of the fun."),
    H(3600,3780,"FILM READ","SILENT HILL 2 LOOKS LIKE THE GAME","The remake gets a visual comparison to Resident Evil, while the new film trailer earns credit for returning to the director of the first Silent Hill movie."),
    H(3780,3960,"FILM READ","CHILD'S PLAY 2019 STILL HAS A DOOR","A fan asks for a sequel. The room does not call the first film good, but it admits the premise has somewhere to go if the follow-up stops apologizing for the wrong movie."),
    H(3960,4140,"GAMING SIGNAL","COLLEGE FOOTBALL 25 WILL BREAK THE CONTROLLER","The return of the football game gets genuine excitement plus anxiety about injuries, roster management, and the exact moment fun becomes a second job."),
    H(4140,4320,"FILM READ","BATMAN BEGINS VERSUS THE DARK KNIGHT","The favorite Batman movie argument becomes a Godfather comparison: one may be the better film, the other may be the better Batman story."),
    H(4320,4500,"FILM READ","THE WORST ENDING OF THE VACATION","A fan brings up a disappointing movie ending. The hosts turn it into a direct quote from real life, then decide that the worst betrayal is a story dropping the ball in its last minutes."),
    H(4500,4680,"FAM SIGNAL","ALONSO'S BURRITO AS A PERSONALITY TEST","A Kentucky food memory becomes a ranking of angry burritos, Waffle House energy, and the kind of meal that makes a person feel like Bobby from a country song."),
    H(4680,4860,"FILM READ","MAGGIE GYLLENHAAL IS THE WRONG KIND OF BATMAN","A fan's Batman casting debate turns into a chaotic comparison of Maggie Gyllenhaal, Katie Holmes, Scientology jokes, and the hosts' wildly different attraction logic."),
    H(4860,5040,"FILM READ","TWO-FACE NEEDED A REAL THIRD ACT","Billy Dee Williams, Harvey Dent, Joel Schumacher, and the Batman movies' tonal whiplash become the argument behind the ranking request."),
    H(5040,5220,"FILM READ","ALIEN IS A HORROR MOVIE IN SPACE","The room remembers why Alien works: distance, no rescue, and a place where walking out the door is not an option. The franchise's later genre shifts stay in the conversation."),
    H(5220,5400,"COMMUNITY DOOR","SMOKEY MOUNTAIN TERROR AND QUITTING SMOKING","A fan asks about a horror event. Mike declines because quitting has changed his relationship to cigarette-heavy spaces, turning a joke question into a real boundary."),
    H(5400,5580,"FILM READ","THE FIRST OMEN DESERVES A FOLLOW-UP","A fan asks about a sequel. The hosts admit the ending is still fresh, but the prequel leaves a few doors open if the next film resists over-explaining the mythology."),
    H(5580,5760,"FAM SIGNAL","THE DOG FIGHT AND THE MEL GIBSON PIT BULL","A wounded dog becomes a Mel Gibson character comparison, then a real reminder that pet emergencies are expensive, exhausting, and not a place for macho heroics."),
    H(5760,5940,"STRAIGHT TO STEVE'S ASSHOLE","THE BATHROOM FART THAT BECAME A MEDICAL EVENT","A bodily interruption turns into a long physics lesson about relief, humiliation, and the strange way the human body makes a person feel like a defeated action hero."),
    H(5940,6120,"FILM READ","ALIEN: ROMULUS TRAILER STARTS THE SECOND HALF","The trailer watch brings a derelict station, a new crew, and a visual promise that the film understands the difference between Alien dread and Aliens momentum."),
    H(6120,6300,"FILM READ","FETTY ALVAREZ EARNS THE TRUST","Evil Dead 2013, practical creature work, and the decision to hold a mystery back become the reasons the hosts trust Alvarez with Alien: Romulus."),
    H(6300,6480,"FILM READ","ALIEN VERSUS ALIENS IS THE POINT","The room likes that Romulus aims between the first two movies, mixing horror and action rather than forcing the audience to choose which decade's version is correct."),
    H(6480,6660,"FILM READ","EXPECTATIONS CAN RUIN THE FIRST SHOWING","The hosts talk about going into Romulus with a real ticket, an established franchise, and the unsettling feeling that a good trailer can make the theater more dangerous."),
    H(6660,6840,"FILM READ","PREDATOR SHOULD STAY PREDATOR","Prometheus, Covenant, and Predator news all get separated. The room wants the monster to remain a hunter, not a soft reboot that forgets why the original works."),
    H(6840,7020,"FILM READ","PREDATOR VERSUS EDDIE MURPHY","A Predator/comedy crossover is pitched, rejected as gimmicky, then rescued by the simple rule that a great script can make almost any strange pairing work."),
    H(7020,7200,"CHARACTER PERFORMANCE","LOOMIS HAS A TYPE","The room's casting conversation turns into Dr. Loomis cheerleading, a family argument about Maggie Gyllenhaal and Katie Holmes, and a joke about a doctor who cannot stop discussing anatomy.",["Dr. Loomis"]),
    H(7200,7380,"MUSIC READ","BLINK-182 AND THE HALL OF FAME SEX LESSON","Tour set lists, collaborative bedroom advice, and a R-rated sex-education tangent demonstrate how the show can move from music fandom to an unasked-for relationship seminar."),
    H(7380,7560,"WWAM UP IN YA","POPCORN IS OLDER THAN JESUS","A random fact question becomes a popcorn-history argument, dental technology jokes, and a request for photos of an expensive fan purchase."),
    H(7560,7740,"FILM READ","PREDATOR, ALIEN, AND THE FINAL HUNTER","The room compares Sigourney Weaver, Arnold Schwarzenegger, Dutch, and the difference between plot armor and a character who actually knows how to survive."),
    H(7740,7920,"FAM SIGNAL","THE CHAT'S MOST ACCURATE OBSERVATION","Michael Parton lands a pee-after-sex observation that the hosts cannot deny. The recurring FAM lane gets a clean, timestamped receipt."),
    H(7920,8100,"WRESTLING READ","THE WCW HIGH-FLYERS WERE BETTER THAN THE MAIN EVENT","Chris Jericho, Psicosis, Ultimo Dragon, Rey Mysterio, Raven, and the underused cruiserweight division become a concise case for what WCW left on the table."),
    H(8100,8280,"WRESTLING READ","JERICO, RAVEN, AND THE DEEP-CUT LIMIT","A fan asks for wrestling knowledge the hosts do not have. The honest answer is part of the charm: identify the gap, then keep the conversation moving."),
    H(8280,8460,"SPORTS READ","JAKE PAUL VERSUS TYSON IS A CONTRACT, NOT A FIGHT","The postponed fight gets a skeptical read: glove size, round count, age, and the difference between marketing an old legend and staging a real sporting test."),
    H(8460,8640,"NEWS REACTION","CANCEL-CULTURE JOKES MEET REAL CONSEQUENCES","A viral cancellation example becomes a discussion of comedy, public memory, and why the internet can make every joke feel like a permanent legal brief."),
    H(8640,8820,"FILM READ","SPIDER-MAN ORIGINS CAN STAY SHORT","A superhero origin argument asks why audiences need another full explanation of powers they already know. The room favors a story that gets to the good part."),
    H(8820,9000,"MUSIC READ","POP-PUNK NEEDS NICKELBACK TO FINISH THE BRACKET","Day to Remember, Spencer Charnas, Blink, Creed, and Nickelback become a deliberately unscientific music ranking with one rule: the collaboration has to be entertaining."),
    H(9000,9180,"HALLOWEEN LORE","THE HALLOWEEN 4 WRITER GETS A CALLBACK","A remembered Spawn line and a Halloween 4 writer's appearance pull the conversation back into the WWAM universe, where even a throwaway quote can become canon."),
    H(9180,9360,"CHARACTER PERFORMANCE","WHO SHOULD PLAY DR. LOOMIS NOW?","Ben Kingsley, James McAvoy, Anthony Hopkins, and Gary Oldman are tested against the Loomis role. The hosts prefer gravitas over a famous face that misses the character.",["Dr. Loomis"]),
    H(9360,9540,"FILM READ","VENOM 3 FINALLY WATCHES THE TRAILER","The Last Dance trailer brings Eddie, a symbiote road trip, a creature chase, and a motorcycle jump. The room likes the energy while asking whether Sony can finally pick a tone."),
    H(9540,9720,"FILM READ","VENOM IS A GREAT CHARACTER IN THE WRONG MOVIES","Tom Hardy's Eddie Brock gets defended while the films are criticized for never choosing between comedy, horror, and superhero spectacle."),
    H(9720,9900,"FILM READ","CARNAGE WAS A FUMBLE","Woody Harrelson, the lost potential of Carnage, and Sony's habit of sanding down its villains become the clearest version of the Venom critique."),
    H(9900,10080,"NEWS REACTION","TOM HARDY IS OVERRATED—OR IS HE?","A long, funny prosecution argues that Hardy is excellent but has not yet carried a true solo hit as the singular movie star. The defense names Warrior, Lawless, Bronson, and The Dark Knight Rises."),
    H(10080,10260,"FILM READ","THE BATMAN ROLE HARDY NEVER GOT","James Bond, Bane, Eddie Brock, and the question of what Hardy's voice is doing become an actor-profile lane rather than a simple insult."),
    H(10260,10440,"CHARACTER PERFORMANCE","LOOMIS CHEERS FOR THE ONLINE-DATING FAM","A fan asks Dr. Loomis for encouragement while the chat roasts Mike's Tom Hardy argument. The doctor becomes the only adult in the room for roughly twelve seconds.",["Dr. Loomis"]),
    H(10440,10620,"WWAM UP IN YA","THE TOM HARDY PROSECUTOR LOSES THE JURY","The chat supplies counterexamples, Mike admits the defense has a point, and the room ends the actor debate exactly where it began: loud, specific, and not legally binding."),
    H(10620,10800,"CLOSING READ","THE CAMERA GIVES UP","A dead camera, a fan's Pet Sematary memory, and the hosts trying to keep a three-hour room alive make the final stretch feel like a broadcast surviving on spite."),
    H(10800,10980,"STRAIGHT TO STEVE'S ASSHOLE","RIC FLAIR'S PIZZA-JOINT EXIT","A Ric Flair bar story becomes the closing wrestling/booze lane, with a pizza restaurant, a thrown-out legend, and a reminder that alcohol never improves the third act."),
    H(10980,11160,"STRAIGHT TO STEVE'S ASSHOLE","LAWLESS, MUD, AND THE WRONG QUESTION","A fan remembers Tom Hardy and Shia LaBeouf in Lawless. The hosts answer the scene, the brother question, and the exact point where the room should have stopped talking."),
    H(11160,11340,"FAM SIGNAL","THE GHOST OF THE GRAVE RECEIPT","A late Super Chat, a Pet Sematary seasonal memory, and the chat laughing at the wrong moment become the final community anchors."),
    H(11340,11520,"ROOM BREAK","THE CAMERA HOLE AND THE BUNK-BED STORY","A camera failure triggers financing advice, a roommate story, and the kind of escalating dorm-lore that sounds fake until everyone in the room recognizes it."),
    H(11520,11648,"CLOSING READ","END THE SEASON OF THE TERRIBLE SHOW","The room signs off with garlic, technology trouble, one final character voice, and an intentionally filthy goodbye that belongs on the tape but not in the press kit.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the June 4, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 44048,
      captionEvents: 11328,
      captionSpanSeconds: 11644.579,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "e3d0999910f27b03805475292d5f998ae06e44a15ddc65a07178de7cc60aeab0",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "46e311b47b9be051095750368f1c22fa5df03480c1c6c9fa78c4ed1df2d8b8c6",
      asrWindowCount: 48,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "TUESDAY NIGHT LIVE // JUNE 4, 2024",
    badge: "FULL SHOW WIKI // FALLOUT, ALIEN: ROMULUS, VENOM 3, AND TOM HARDY ON TRIAL",
    headline: "FALLOUT TEABAGGING, THE ALIEN: ROMULUS TRUST FALL, AND A THREE-HOUR TOM HARDY PROSECUTION",
    deck: "A long WWAM room that starts with gaming humiliation and Caitlin Clark, detours through Scarefest and Batman, then ends with Venom 3, Predator, Halloween casting, and a dead camera.",
    overview: "The June 4 stream is a proper WWAM marathon. It begins with Fallout 76 taunts, a failed nuke plan, and the argument that a higher-level player is not necessarily a better player. The room then opens its comedy file: Joe Rogan's orbit, Brendan Schaub, Tom Segura, joke theft, weed-as-personality, Eddie Murphy, Chris Rock, and the rule that a comedian can be likable right up until the bit starts eating the person. Caitlin Clark and WNBA coverage get a full sports lane about attendance, targeting, and the strange impulse to resent the player bringing eyes to the league. The FAM learns that this is the last stream before vacation, then contributes Scarefest bathroom folklore, Fallout 76 questions, Scream disagreements, a Walmart humanity review, *Tango & Cash*, George Lucas, *Terrifier 3*, Burton Batman, and *Silent Hill 2*. The middle of the tape becomes a franchise workshop: *Alien* as horror in space, *Alien: Romulus* as a potential bridge between *Alien* and *Aliens*, Predator as a hunter that should remain a hunter, and a comedy crossover that only works with a serious script. The chat drives the character lane too: Dr. Loomis casting, Creed and Blink-182, popcorn history, the WCW high-flyers, Jake Paul versus Mike Tyson, and the long debate over whether Tom Hardy has ever been the sole gravitational center of a hit. The final minutes are pure late-room entropy: Venom 3, Carnage's wasted potential, a dead camera, Ric Flair's pizza-joint exit, Pet Sematary weather, and a filthy sign-off. The page keeps those shifts visible instead of pretending this was one subject; every lane stays tied to the tape and every clip remains a bounded invitation to play.",
    topics: Object.freeze(["Fallout 76", "Caitlin Clark", "The Watchers", "Tango & Cash", "Silent Hill 2", "Batman", "Alien: Romulus", "Alien", "Predator", "Venom 3", "Tom Hardy", "Dr. Loomis", "Terrifier 3", "Halloween 4", "WWE", "The FAM"]),
    story: Object.freeze([
      { at: 0, end: 1200, label: "FALLOUT, COMEDY, AND THE CLARK EFFECT", body: "Gaming humiliation, comedian ethics, weed-as-personality, and Caitlin Clark's arrival create a first act that is social commentary and shit-talk in equal measure." },
      { at: 1200, end: 2400, label: "THE LAST STREAM, SCAREFEST, AND FALLout 76", body: "Vacation scheduling, a Scarefest bathroom story, WCW talk, Fallout 76's recovery, and the FAM's weirdest questions keep the room community-first." },
      { at: 2400, end: 3600, label: "SCREAM, TANGO & CASH, STAR WARS, AND TERRIFIER", body: "Franchise disagreements, machismo comfort food, Star Wars commodification, Terrifier 3, Burton Batman, and a wedding bit make nostalgia feel dangerous." },
      { at: 3600, end: 4800, label: "SILENT HILL, CHILD'S PLAY, AND BATMAN BEGINS", body: "The new Silent Hill game and film, a Child's Play sequel pitch, College Football 25, Batman rankings, and an impossible burrito give the middle a broad pop-culture spine." },
      { at: 4800, end: 6000, label: "ALIEN IN SPACE, DOG FIGHTS, AND THE ROMULUS TRAILER", body: "Alien's isolation, a quitting-smoking boundary, The First Omen, a wounded dog, and the Alien: Romulus trailer bring the tape back to horror." },
      { at: 6000, end: 7200, label: "ALIEN VERSUS ALIENS, PREDATOR, AND LOOMIS", body: "The room trusts Fede Álvarez, debates Alien and Aliens, keeps Predator dangerous, and lets Dr. Loomis own a messy casting conversation." },
      { at: 7200, end: 8400, label: "BLINK, POPCORN, WCW, AND TYSON", body: "Music, an unplanned sex seminar, popcorn history, the Predator/Rambo test, WCW high-flyers, and Jake Paul versus Tyson keep the long room moving." },
      { at: 8400, end: 9600, label: "SUPERHERO ORIGINS, POP-PUNK, AND VENOM", body: "Cancel-culture jokes, compressed superhero origins, Nickelback demands, Dr. Loomis casting, and the Venom 3 trailer set up the final prosecution." },
      { at: 9600, end: 10800, label: "VENOM'S TONE PROBLEM AND TOM HARDY ON TRIAL", body: "Carnage, Sony, Tom Hardy's leading-man record, Warrior, Lawless, Bane, Eddie Brock, and a FAM roast turn the last hour into a courtroom." },
      { at: 10800, end: 11648, label: "THE CAMERA DIES, RIC FLAIR LEAVES, AND THE TAPE ENDS", body: "A dead camera, Ric Flair's pizza exit, Pet Sematary memories, roommate lore, and one final filthy goodbye close the three-hour room." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 5940, end: 6660, label: "ALIEN: ROMULUS EARNS THE TRUST", topic: "a bridge between Alien dread and Aliens momentum", body: "Play from 1:39:00. The trailer, Fede Álvarez's Evil Dead work, and the decision to protect the mystery make this the room's strongest film lane.", playAt: 5940, playEnd: 6660 }),
      hated: Object.freeze({ at: 9900, end: 10620, label: "TOM HARDY ON TRIAL", topic: "great actor, missing singular blockbuster", body: "Play from 2:45:00. Mike prosecutes; the chat supplies Warrior, Lawless, Bane, and Dark Knight Rises as the defense.", playAt: 9900, playEnd: 10620 }),
      wildestDetour: Object.freeze({ at: 2040, end: 2220, label: "THE SCAREFEST BATHROOM STORY", topic: "a fan meetup enters horror-movie territory", body: "Play from 34:00. A bathroom, a stranger, and a threat become the strangest convention receipt in the archive.", playAt: 2040, playEnd: 2220 }),
      lastWord: Object.freeze({ at: 9720, end: 10080, label: "CARNAGE WAS THE FUMBLE", topic: "Sony keeps sanding down the villains", body: "Play from 2:42:00. The Venom discussion finds its cleanest thesis in Carnage's wasted potential.", playAt: 9720, playEnd: 10080 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
