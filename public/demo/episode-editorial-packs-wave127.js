(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var prior = sources["_8rkO1gLQds"] || {};
  var E = function (at, end, category, label, excerpt, characters) {
    return {
      at: at,
      end: end,
      category: category,
      label: label,
      excerpt: excerpt,
      sourceId: "_8rkO1gLQds",
      evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority",
      ...(characters ? { characters: characters } : {}),
    };
  };

  /* March 5, 2026: second editorial read of the 3:09:19 livestream.
     The first pack had the spine right but left a lot of the actual room on the
     floor. This pass adds the missing audience, character, trailer, and filthy
     side-road receipts without pretending captions identify a speaker. */
  var additions = [
    E(250, 330, "ROOM BREAK", "THE WEDDING HE FORGOT", "A missed wedding invitation becomes a tiny WWAM thesis: if the review is already online, one host apparently considers the social obligation complete."),
    E(620, 710, "WWAM UP IN YA", "THE RESIDENT EVIL RÉSUMÉ", "Resident Evil turns into a fake career comparison: one person fought through Raccoon City while the other is accused of having a much less heroic high-school schedule."),
    E(735, 835, "CHARACTER PERFORMANCE", "SLING BLADE AT THE GAS PUMP", "A gas-station sighting is followed by a Sling Blade impression that the room treats like a legitimate acting audition.", ["Sling Blade"]),
    E(930, 1010, "ROOM BREAK", "DIP OUR DICKS IN THE NEWS", "Before the news desk can begin, the hosts describe the night's agenda in the most aggressively WWAM way possible."),
    E(1420, 1490, "TAKE GETS NUCLEAR", "HAL JORDAN HAS GREAT HAIR", "Green Lantern casting gets a real look, then immediately becomes an appreciation society for Kyle Chandler's hair and a warning about future hair loss."),
    E(1480, 1570, "WWAM UP IN YA", "JESUS IS COMING BACK, PARAMOUNT IS MAD", "A fake good-news announcement lands before the actual movie-theater news, letting the room enjoy the bait-and-switch before the industry argument starts."),
    E(1715, 1795, "STRAIGHT TO STEVE'S ASSHOLE", "JOHN WICK WANTS HIS AD", "A John Wick-style voice is assigned to an ad blocker: puppies, betrayal, and a hero who just wants the damn advertisement to play."),
    E(1945, 2045, "FAN SIGNAL", "THE MONSTER-TRUCK WELCOME", "A big supporter gets welcomed with a deliberately ridiculous title, then the hosts promise to return to every Super Chat instead of letting the first donation vanish in the scroll."),
    E(2050, 2145, "TAKE GETS NUCLEAR", "THE MATRIX SISTERS JOKE", "Matrix fatigue is expressed through a deliberately terrible time-jump joke: the franchise has been away so long that even the Wachowski name becomes part of the punchline."),
    E(2220, 2300, "BEST MOMENT", "SCARY MOVIE IS ACTUALLY SCARY MOVIE", "The Scary Movie announcement gets a fake horror recut, complete with the familiar bargain-bin Jason mask the room already knows by heart."),
    E(2310, 2395, "WWAM UP IN YA", "THE HALLOWEEN PARTY DOOR", "A Halloween-party invitation turns into a character bit about showing up for drinks, bad decisions, and no respectable explanation for being there."),
    E(2480, 2575, "TAKE GETS NUCLEAR", "HALF-GAY DOES NOT COUNT", "A chat phrase is prosecuted for refusing to commit to its own joke. The verdict is simple: pick a lane and stop hiding behind the first half of the sentence."),
    E(2785, 2865, "STRAIGHT TO STEVE'S ASSHOLE", "THE TWITTER BLOCK AUTOPSY", "A blocked account and a misunderstood insult become a forensic reconstruction of how online movie arguments turn into two people yelling at profile pictures."),
    E(2975, 3065, "WWAM UP IN YA", "THE VAN DAMME ROLE FILE", "A normal casting-history segment arrives through a joke about the chat seeing something it absolutely did not need to see, then pivots into Jean-Claude Van Damme's lost roles."),
    E(3090, 3180, "WWAM UP IN YA", "PREDATOR WAS TOO HOT", "The Predator costume story is retold as a heat complaint, followed by the chat's inevitable demand to talk about a certain anatomy measurement."),
    E(3160, 3270, "TAKE GETS NUCLEAR", "THE JOHNNY CAGE WHAT-IF", "Van Damme as Johnny Cage is treated as the casting what-if that could have changed an entire Mortal Kombat timeline."),
    E(3240, 3320, "FAN SIGNAL", "THE VAN DAMME GUEST DREAM", "The hosts admit a Jean-Claude Van Damme appearance is unlikely but still leave the door open, because a dream guest is more fun than a fake promise."),
    E(3450, 3535, "STRAIGHT TO STEVE'S ASSHOLE", "THE TOBEY RUMOR CHUTE", "Unverified Scream chatter gets kept in rumor territory while the room vents about the reaction it would cause if the rumor were true."),
    E(3500, 3585, "FAN SIGNAL", "415 PEOPLE AND A BREAKY-POO", "The viewer count surprises the hosts, then a bathroom break arrives with no dignity and no attempt to hide that the live room is part of the joke."),
    E(3905, 3995, "DEEP DIVE", "STU'S SECRET EPILOGUE", "The reported Scream 7 epilogue with Stu alive becomes a clean discussion of alternate endings, audience testing, and whether a deleted idea can haunt the finished film."),
    E(3985, 4085, "ROOM BREAK", "THE TACO-SEASONING THIEF", "A prison-story tangent meets collectible-card economics: the room can understand stealing, but not a thief who uses dollar-store taco seasoning as camouflage."),
    E(4260, 4370, "TAKE GETS NUCLEAR", "28 YEARS LATER IS STILL IN PLANNING", "The Cillian Murphy update gets the face-reaction treatment: the project is alive, but the planning-stage news is not exactly a victory lap."),
    E(4690, 4785, "FAN SIGNAL", "WOLF CREEK LEGACY CHECK-IN", "A question about Wolf Creek Legacy opens a genuine franchise door before the room remembers that even good news can be interrupted by a breath joke."),
    E(4750, 4840, "WWAM UP IN YA", "BAGEL BITES AS NIPPLES", "Bagel Bites become a full-body costume choice in the most committed snack metaphor of the night."),
    E(4815, 4930, "BEST MOMENT", "FACES OF DEATH TRAILER COURT", "The new Faces of Death trailer gets a wary but excited reaction, with the room trying to decide whether the footage is disturbing, fake, or both."),
    E(5005, 5095, "STRAIGHT TO STEVE'S ASSHOLE", "THE CLUE-BOARD PERSONALITY", "A social-media personality is compared to somebody trapped inside the board game Clue, which is somehow the kindest available explanation."),
    E(5100, 5185, "WWAM UP IN YA", "NECROPHILIA IS NOT A TECHNICALITY", "A threat escalates into a dead-body word game and then gets shut down by the room's own realization that the punchline has crossed into a worse genre."),
    E(5400, 5480, "STRAIGHT TO STEVE'S ASSHOLE", "PRIZZY PISSY PITCHY", "A username becomes evidence in a mock trial about how many times somebody has been called an asshole online."),
    E(6300, 6405, "STRAIGHT TO STEVE'S ASSHOLE", "THE MOVIE HE TRIES TO PROTECT", "One host begs the other not to review a movie because the flaws are too easy to weaponize. Loving a movie, in this room, may require hiding it from the critic."),
    E(6575, 6675, "TAKE GETS NUCLEAR", "NO PRESS SCREENING FOR WWAM", "The hosts notice that studios rarely send them screeners despite years of coverage, then admit that repeatedly dragging a movie probably has something to do with it."),
    E(6835, 6940, "WWAM UP IN YA", "POOP ON YOU, SCREAM ORACLE", "A Scream question gets answered through a bathroom threat and a nickname for J as the franchise's so-called oracle."),
    E(7090, 7230, "CHARACTER PERFORMANCE", "THE MCCRAY ANATOMY CROSS-EXAM", "A fan asks for an admission about Dave McCreary's anatomy and the room turns the request into a miniature Loomis-and-Challis-style interrogation.", ["Dr. Loomis", "Dr. Challis"]),
    E(7250, 7375, "STRAIGHT TO STEVE'S ASSHOLE", "PRAISE-THE-SHADOWS RAGE", "A hostile online exchange leaves the hosts trying to separate a real criticism from the kind of rage that makes the whole room apologize to the audience."),
    E(7580, 7670, "WWAM UP IN YA", "J WATCHED SOMEONE ELSE'S SCREAM STREAM", "The chat catches J missing another Scream stream, and the defense is so weak that it becomes evidence against him."),
    E(7640, 7735, "FAN SIGNAL", "KB TOYS IN THE 1990s", "A mall-memory question sends the room straight to KB Toys, a clean piece of community nostalgia amid the adult chaos."),
    E(7920, 8045, "BEST MOMENT", "HAWK HANDS MAKE A FAIR FIGHT IMPOSSIBLE", "The basement boxing story becomes a perfect physical-comedy receipt: gloves for one person, Hulk-style hawk hands for the other, and no legal athletic commission present."),
    E(8030, 8135, "COMMUNITY MEMORY", "THE FIRST TEENAGE STORY", "The hosts trade a teenage memory and openly warn that it may be too embarrassing for a clean recap. The embarrassment is precisely why it belongs in the archive."),
    E(8120, 8215, "WWAM UP IN YA", "THE IRONED SHIRT SCAM", "A homemade clothing fix turns into a story about trusting bad advice, discovering the advice was bullshit, and wearing the result anyway."),
    E(8200, 8310, "STRAIGHT TO STEVE'S ASSHOLE", "THE RADIO-STATION TOUR", "A childhood radio-station story is retold with the kind of adult hindsight that makes the original invitation sound like a crime documentary."),
    E(8280, 8385, "COMMUNITY MEMORY", "THE FIRST SUNRISE AND THE FIRST MISTY", "A late-night childhood memory moves from watching a sunrise to getting drunk on Misty, showing how the hosts' shared history keeps resurfacing in the live room."),
    E(8360, 8460, "TAKE GETS NUCLEAR", "THE MOM-LEFT-ME CHRISTMAS STORY", "A childhood separation memory lands harder than the surrounding jokes, then gets folded back into the room's argument about how personal stories survive inside comedy."),
    E(8685, 8775, "TAKE GETS NUCLEAR", "JILL VERSUS STU", "A fan declares Jill the better Ghostface than Stu and gets a full-room rejection, with one host secretly admitting the take has a pulse."),
    E(8960, 9075, "FAN SIGNAL", "LEE THE MACHINE AND STU ALIVE", "Lee's Super Chat is thanked as a real contribution, then his belief that Stu is alive reopens the Scream lore door for another round."),
    E(9120, 9210, "CHARACTER PERFORMANCE", "THE I LOVE DICK BUTTON", "A fan question invokes a character whose entire comic identity is one blunt sentence, and the room treats the button like a sound effect.", ["character bit"]),
    E(9310, 9395, "FAN SIGNAL", "LARRY THE CABLE GUY AT APPLEBEE'S", "A claimed celebrity sighting is met with the only reasonable evidence request: take a picture or accept that the chat will call bullshit."),
    E(9445, 9535, "FAN SIGNAL", "MICHAEL PARTON'S FACES OF DEATH LINE", "Michael Parton gives a clear boundary on extreme horror: Faces of Death feels like snuff to him, and he refuses the August Underground lane."),
    E(10075, 10170, "ROOM BREAK", "THE WICKED WITCH ARGUMENT", "A Wizard of Oz reference becomes a miniature model of arguing on Twitter: one side is sure it has the answer, and the room keeps changing the subject."),
    E(10190, 10285, "CHARACTER PERFORMANCE", "RIC FLAIR IS STILL THE GOAT", "Ric Flair gets defended with no nuance and complete commitment, which is exactly how a late-night character impression should enter the canon.", ["Ric Flair"]),
    E(10235, 10305, "ROOM BREAK", "CALL FOR HELP, GET NOTHING", "A repeated request for help receives no response, and the room turns the everyday failure into an absurd little chorus."),
    E(10330, 10420, "BEST MOMENT", "WHAT HAPPENS WHEN HE ARRIVES?", "A clip reaction builds through repetition and a scream, turning the source video itself into the punchline rather than pretending the recap can replace it."),
    E(10430, 10515, "ROOM BREAK", "THE 1980s CLIP SCARED HIM", "A scary old clip is remembered with surprising honesty: the host was frightened, held his own, and still wants the audience to know the fear was real."),
    E(10510, 10610, "CHARACTER PERFORMANCE", "CRUELLA WALKING INTO THE ROOM", "A visual comparison turns one of the hosts into Cruella for a few seconds, then immediately collapses under its own laughter.", ["Cruella"]),
    E(10625, 10725, "COMMUNITY MEMORY", "THE HOUSE PARTY WITH COPS OUT FRONT", "A teenage story about being sent to a friend's house and landing at the biggest party in the county arrives just before the police do."),
    E(10770, 10865, "CHARACTER PERFORMANCE", "STONE COLD BRENNAN RETURNS", "Stone Cold Brennan gets called back into the room with a deliberately filthy wellness check and no attempt to hide the character's ridiculousness.", ["Stone Cold Brennan"]),
    E(10870, 10945, "CHARACTER PERFORMANCE", "THE WOLF-PACK BUTTON", "The Corey Feldman/Wolf Pack riff is kept as a source-bound character joke, not a factual claim about the person being impersonated.", ["Corey Feldman", "The Wolf Pack"]),
    E(11065, 11165, "STRAIGHT TO STEVE'S ASSHOLE", "THE VANILLA-ICE MIRROR", "An online rival is told to look in the mirror and decide whether the real problem is the person posting or the Vanilla Ice fantasy in his head."),
    E(11150, 11240, "FAN SIGNAL", "THE CHAT RUMOR GETS MUTED", "A persistent rumor is described, then the hosts explain that muting the account is the only responsible moderation move available in the moment."),
    E(11250, 11325, "WWAM UP IN YA", "DRUNK POETRY IN FIVE SECONDS", "The show tries to close with a thank-you and instead promises an intoxicated poetry reading before remembering it has to end."),
    E(11315, 11358, "LAST WORD", "CALL ME ON THE TELEPHONE", "The final goodbye becomes a repeated telephone invitation and lands the episode exactly where it belongs: affectionate, exhausted, and still refusing a clean button."),
  ];

  sources["_8rkO1gLQds"] = Object.freeze(Object.assign({}, prior, {
    sourceId: "_8rkO1gLQds",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; audio candidates reconciled to visitor-facing lanes",
    evidence: Object.freeze(Object.assign({}, prior.evidence || {}, {
      duration: 11359,
      captionSha256: "sha256:05577a9249d7d8b23824fbd5b70a81bd609a3a99412f05c3b11b0d235b902318",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:b1fd4e788cd7cde2e79895b8f883e9d8e6b2bb857e72759130883151d1a33145",
      asrSha256: "sha256:3f85286372db5e3f91fc7d26e071ec81438f6e4100298a9c7d25890cf1a7a1dc",
      asrSegmentCount: 780,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    })),
    highlights: Object.freeze((prior.highlights || []).concat(additions).sort(function (a, b) { return Number(a.at || 0) - Number(b.at || 0); })),
    badge: "FULL SHOW WIKI // 3:09:19 OF MOVIE NEWS, TRAILER COURT, FAM DAMAGE, AND A 60-RECEIPT SECOND READ",
  }));

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
