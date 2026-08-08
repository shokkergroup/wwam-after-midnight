(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "v20-Wq6wVcs";
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: Math.max(0, Math.round(at)), end: Math.min(9684, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* August 7, 2024: a full 1996 movie-year countdown surrounded by concert
     wreckage, FAM receipts, character requests, and the promise of a school-
     movie list next week. The list is the spine; the room is the story. */
  var highlights = [
    H(0, 180, "ROOM BREAK", "THE CAMERA ALMOST TAKES OFF FOR MARS", "A new camera, a hidden shutter, and a computer that sounds like Red Alert 3 give the show its first tiny production disaster. The fix is embarrassingly simple and immediately becomes the joke."),
    H(180, 360, "STRAIGHT TO STEVE'S ASSHOLE", "THE CREED CONCERT THAT BECAME A SURVIVAL STORY", "Jay's Creed night starts with bad seats, a casino detour, and pretzel bites that reportedly ended the evening's dignity. The story is too long, too specific, and therefore perfect WWAM material."),
    H(360, 540, "WWAM UP IN YA", "FINGER ELEVEN, THREE DOORS DOWN, AND THE SEA OF HUMANITY", "Finding the seats requires a Crocodile Dundee fantasy, a suspicious usher, and a walk through a crowd that feels like Dante's Inferno. The concert is already a complete short film before Creed appears."),
    H(540, 720, "SOUNDBYTE / REPLAY", "THE ROCK-AND-ROLL YOUTH PASTOR", "Scott Stapp's leather pants, giant cross, and candlelight-dinner energy inspire a clean visual roast. The hosts are not denying the songs; they are questioning the outfit's pastoral mission."),
    H(720, 900, "STRAIGHT TO STEVE'S ASSHOLE", "THE WALL-TO-WALL URINAL CONFESSION", "A packed concert bathroom, an expensive Apple Juice line, and a broken zipper turn ordinary bladder logistics into the night's most replayable personal-disaster story."),
    H(900, 1080, "FAN SIGNAL", "ELLIE'S FIRST CONCERT SURVIVES PIERCE THE VEIL", "The room shifts from crude concert chaos to a sweet family receipt: loud music scares Ellie at first, headphones fix the problem, and Blink becomes a night she loves."),
    H(1080, 1260, "WWAM UP IN YA", "THE FLY THAT REFUSED TO CLOSE", "The zipper fails again, the metal catches the light, and Jay realizes the audience may be looking at the wrong stage. Public humiliation becomes a full callback to Detroit Rock City."),
    H(1260, 1440, "FAN SIGNAL", "THE CONCERT PAL TEXT", "A drunk post-show text calling Mike ‘pal’ becomes a whole fake friendship from 1982. It is the exact kind of tiny phrase the archive should preserve as a soundbite."),
    H(1440, 1620, "ROOM BREAK", "THE CASINO RECOVERY BILL", "The concert ends with a casino loss, an angry slot-machine energy, and the realization that nobody got the night they bought. The hosts turn the whole trip into a tied-up bowl of disaster with a bow on it."),
    H(1620, 1800, "CHARACTER PERFORMANCE", "LOOMIS FILES AN UNEXCUSED ABSENCE", "A missing fan is written up by Dr. Loomis as if the livestream were a workplace with attendance rules. The character lane turns a normal ‘sorry I missed the show’ into office discipline.", ["Dr. Loomis"]),
    H(1800, 1980, "FAN SIGNAL", "RIP CHARLES CYPHERS", "The room pauses for Charles Cyphers, remembers meeting him briefly at Scarefest, and talks about how Halloween Kills gave him a small but meaningful return. The jokes stop long enough for the respect to land."),
    H(1980, 2160, "FILM READ", "TRAP GETS A NO-SPOILER NOD", "A fan compares Trap to a less polished family version of American Psycho. The hosts praise Josh Hartnett's commitment and save the ending discussion for anyone who has not seen it."),
    H(2160, 2340, "FAN SIGNAL", "ROMULUS IS NEXT WEEK'S APPOINTMENT", "The hosts promise a non-spoiler Alien: Romulus check-in and a joint spoiler show. The queue is not abstract: fans are already planning theaters, IMAX, and the next WWAM room."),
    H(2340, 2520, "FAN SIGNAL", "THE FAM ARGUES ABOUT 4K: CROW OR SCREAM", "A viewer asks which disc to buy next. The room picks The Crow, then briefly treats it as the greatest superhero movie ever made before admitting the answer is emotional, not scientific."),
    H(2520, 2700, "SOUNDBYTE / REPLAY", "THE BEER-CHUG TRAINING PLAN", "A fan prepares for Saturday's Patreon beer chug with a high-ABV six-pack. The hosts explain that practice is less about technique than surviving the jump from a warm-up round to the final boss."),
    H(2700, 2880, "HALLOWEEN LORE", "THE HEAT DOME AND THE FALL FESTIVAL", "Kentucky's heat dome collides with the first signs of autumn: scarecrow contests, pumpkin season, and a fantasy of a completely inappropriate horror-themed scarecrow. Fall becomes a WWAM calendar event."),
    H(2880, 3060, "FILM READ", "JOSH HARTNETT'S HORROR COMEBACK", "The room digs into Hartnett's return, his work in 30 Days of Night and H20, and the way a bad Hollywood experience pushed him away before Trap brought him back into the conversation."),
    H(3060, 3240, "STRAIGHT TO STEVE'S ASSHOLE", "THE HULK HOGAN BIOPIC CASTING BOARD", "Ben Affleck as Hulk Hogan, Jonah Hill as Andre the Giant, Gus Van Sant, and a possible Chris Hemsworth project create a casting board that keeps changing every thirty seconds."),
    H(3240, 3420, "STRAIGHT TO STEVE'S ASSHOLE", "BEN AFFLECK'S LEATHER-JACKET MID-LIFE CRISIS", "The room roasts Affleck's mohawk and leather jacket while making clear that the gossip is being treated as rumor, not fact. The useful take is about celebrity image management, not a claim about a private life."),
    H(3420, 3600, "FAN SIGNAL", "THE WWAM TATTOO AND MAIN-CHARACTER SYNDROME", "A fan sends a Blink tattoo and the room pivots into a rant about people blocking concerts with signs. The phrase ‘main-character syndrome’ becomes the clean takeaway and a future searchable tag."),
    H(3600, 3780, "ROOM BREAK", "PRAYING TO THE SLOT MACHINE", "A quarter-slot superstition turns into a tiny religion: rubbing sevens, pressing buttons, and asking the luck gods for one bonus. The hosts disagree about gambling but understand the ritual."),
    H(3780, 3960, "FILM READ", "FROM DUSK TILL DAWN OPENS THE LIST", "Jay's number ten is From Dusk Till Dawn, and the room immediately separates the crime movie first half from the vampire movie second half. The split-personality structure is the reason it survives the countdown."),
    H(3960, 4140, "STRAIGHT TO STEVE'S ASSHOLE", "TARANTINO'S TOE RECEIPT", "The hosts revisit the famous tequila-and-toe moment and roast the transparent way a writer created a scene that let him put a particular foot in the center of the frame."),
    H(4140, 4320, "FILM READ", "PRIMAL FEAR DROPS A PERFECT TRAPDOOR", "Edward Norton, Richard Gere, Laura Linney, and the film's final reversal make Primal Fear the first serious ‘how did I not see that?’ entry on the list."),
    H(4320, 4500, "FILM READ", "INDEPENDENCE DAY IS A THEATER MEMORY", "The number-nine debate is really about July 4th, a crowd standing up in a Winchester theater, Bill Pullman, Jeff Goldblum, and the feeling that a blockbuster could still become a family Christmas present."),
    H(4500, 4680, "FILM READ", "SPACE JAM AND THE TUNE SQUAD JERSEY", "Michael Jordan, Bill Murray, the Looney Tunes, a cheap Walmart jersey, and a backyard basketball court make Space Jam a memory object more than a critical argument."),
    H(4680, 4860, "SOUNDBYTE / REPLAY", "THE BACKYARD SPACE JAM CRINGE REENACTMENT", "Jay and Cody once pressed play on the soundtrack and tried to look cool on their homemade court. The hosts preserve the cringe because it is the exact pre-YouTube performance every 90s kid recognizes."),
    H(4860, 5040, "FILM READ", "MISSION: IMPOSSIBLE IS A SPY MOVIE FIRST", "Tom Cruise's haircut, the cassette soundtrack, Ving Rhames, John Voight, and the choice to emphasize espionage over nonstop action explain why the first Mission: Impossible still feels special to the room."),
    H(5040, 5220, "FILM READ", "FEAR MAKES THE HOUSE INVASION PERSONAL", "Mark Wahlberg's David is not a masked stranger. He is the nightmare boyfriend who wants to become the father of the house, which makes the home-invasion material feel uncomfortably plausible."),
    H(5220, 5400, "STRAIGHT TO STEVE'S ASSHOLE", "THE DOORBELL FACE", "The room keeps returning to the same Wahlberg expression at the doorbell, turning a genuinely threatening scene into an instantly recognizable school-memory roast."),
    H(5400, 5580, "FILM READ", "THE ROCK IS A PERFECT SUMMER MACHINE", "Nick Cage, Sean Connery, Ed Harris, the score, the prison, the chemistry, and the tiny moments of grief all combine into the kind of huge, sincere action film the hosts say Hollywood no longer makes."),
    H(5580, 5760, "FILM READ", "THE FRIGHTENERS: GHOSTBUSTERS WITH A HEART", "Michael J. Fox, a con-man paranormal investigator, Jeffrey Combs, Jake Busey, and a surprisingly touching ending make The Frighteners Jay's feel-good horror pick."),
    H(5760, 5940, "CHARACTER PERFORMANCE", "LOOMIS CALLS THE STREAM BACK FROM THE VOID", "While Mike's camera restarts, Dr. Loomis keeps the room alive with an improvised professional voice and a threat to send the audience to another Creed concert. It is a character bridge built from a technical failure.", ["Dr. Loomis"]),
    H(5940, 6120, "FILM READ", "SCREAM SAVED HORROR FROM THE DITCH", "Jay places Scream at number five and defends it as a reset button for horror: meta without being empty, funny without losing the murders, and fresh after a run of tired sequels."),
    H(6120, 6300, "FILM READ", "TWISTER EARNS THE THEATER REPEAT", "Both hosts put Twister at number four. They remember seeing it multiple times as kids, drawing tornadoes, watching Nature's Fury, and wanting to be storm chasers before the internet could flatten the fantasy."),
    H(6300, 6480, "FILM READ", "THE ORIGINAL TWISTER THROWS YOU INTO THE STORM", "The hosts prefer the original movie's confidence: no long preface, no hand-holding, just interesting people already in the middle of a complicated life with Dorothy, Bill, Jo, and a storm waiting."),
    H(6480, 6660, "FILM READ", "BROKEN ARROW IS GI JOE WITH A STEALTH BOMBER", "Christian Slater and John Travolta make a clean two-hander out of nuclear weapons, trains, and a final fight. The movie's cool factor is treated as a feature, not a guilty pleasure."),
    H(6660, 6840, "FILM READ", "THE GECKO BROTHERS TAKE NUMBER THREE", "From Dusk Till Dawn returns at number three with George Clooney, Quentin Tarantino, Salma Hayek, Tom Savini, and a double-feature recommendation with Desperado."),
    H(6840, 7020, "STRAIGHT TO STEVE'S ASSHOLE", "THE FIRST HALF OR THE VAMPIRE HALF", "The room cannot agree which half of From Dusk Till Dawn it would rather watch. That argument is the movie's entire magic trick, so the disagreement becomes the feature."),
    H(7020, 7200, "FILM READ", "THE CABLE GUY IS A DARK COMEDY, NOT A HORROR MOVIE", "Mike's number two is The Cable Guy. The room defends its stalker premise, karaoke sequence, medieval-Internet anxiety, and Jim Carrey performance as a comedy with thriller teeth."),
    H(7200, 7380, "SOUNDBYTE / REPLAY", "THE CABLE GUY KNOWS YOUR WHOLE LIFE", "The hosts translate the film's fear into modern terms: an online stranger knows where you live, what you watch, and how to turn your private list into a weapon."),
    H(7380, 7560, "FILM READ", "INDEPENDENCE DAY TAKES NUMBER ONE", "The final reveal is not a surprise: Mike picks Scream and Jay picks Independence Day. Jay's choice is anchored in rentals, Christmas VHS, July 4th crowds, and the feeling of a blockbuster becoming a family ritual."),
    H(7560, 7740, "FAN SIGNAL", "THE HONORABLE-MENTION BLOODBATH", "Ransom, Daylight, Courage Under Fire, The Crow: City of Angels, Thinner, Jerry Maguire, Fargo, and The Glimmer Man prove the year is too crowded for a clean top ten."),
    H(7740, 7920, "WWAM UP IN YA", "BEEVIS AND BUTT-HEAD, BLACK SHEEP, AND WHITE MUD", "The honorable mentions become a quote machine: Beavis and Butt-Head Do America, Black Sheep, Multiplicity, Celtic Pride, The Nutty Professor, and a recurring white-mud misunderstanding."),
    H(7920, 8100, "FAN SIGNAL", "THE FAM PICKS THEIR OWN 1996", "Fans add Swingers, Daylight, The Frighteners, Twister, Happy Gilmore, The Cable Guy, Independence Day, Scream, and From Dusk Till Dawn. The comments become a parallel countdown."),
    H(8100, 8280, "FILM READ", "THE SCHOOL-MOVIE NEXT EPISODE IS BORN", "A late question becomes next week's format: movies where school is central, from H2O and The Principal to Child's Play 3, Summer School, Scream 2, and the underrated 187."),
    H(8280, 8460, "FAN SIGNAL", "THE FAM WANTS MORE THAN A TOP TEN", "The room floats a Beverly Hills 90210 deep-dive podcast, more gaming, and a longer format where every episode gets thirty minutes. The archive catches the idea before it becomes a show."),
    H(8460, 8640, "FILM READ", "JOKER 2 GETS A MUSICAL WARNING", "The hosts are intrigued by the trailer but worry about a jukebox musical, the Rock of Ages comparison, and a marketing campaign that may be hiding the movie's real tone."),
    H(8640, 8820, "FAN SIGNAL", "THE WWAM TATTOO OFFER", "A tattoo artist offers to ink the WWAM logo. The room jokes about a stamp, a skull, and a full Chipotle-bag-of-tattoos plan while still treating the offer as a real fan connection."),
    H(8820, 9000, "CHARACTER PERFORMANCE", "LOOMIS REFUSES A DOCTOR'S APPOINTMENT", "A fan asks about a yearly heart ultrasound and Dr. Loomis answers with an intentionally terrible fictional medical bit. The archive keeps the performance separate from real health advice.", ["Dr. Loomis"]),
    H(9000, 9180, "CLOSING READ", "THE 1996 CANON LEAVES ROOM FOR 1997", "The hosts admit that 1996 may not be the 90s peak once 1997 arrives. They close the ranking with affection for a decade that made nearly every honorable mention feel like a headliner."),
    H(9180, 9360, "FAN SIGNAL", "THE SAME-ROOM ROMULUS PROMISE", "The next stream is a joint Alien: Romulus non-spoiler or spoiler night from the same room. The hosts make a ridiculous physical promise, but the real point is that the format is changing."),
    H(9360, 9520, "WWAM UP IN YA", "THE FINAL CHAT LIST", "Fans submit their own 1996 lists, including Swingers, Daylight, Fargo, Black Sheep, and The Crow. The room grades the audience's taste with surprising warmth."),
    H(9520, 9684, "CLOSING READ", "THE 1996 TAPE CLOSES ON A PERFECTLY MESSY TOP TEN", "A last fan list gets an invitation into the club, the school-movie episode is locked, and the hosts sign off with the exact combination this show does best: strong movie memory, bad jokes, and a real reason to return next week.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio pass across the August 7, 2024 Top 10 Movies of 1996 livestream",
    evidence: Object.freeze({
      duration: 9684,
      captionWords: 4685,
      captionEvents: 9369,
      captionSpanSeconds: 9683.56,
      captionDurationCoveragePercent: 99.99,
      captionSha256: "d444db53c5a7f9bdbcf61808258b44b0c8f935875b3c7cc3ce3b08a04ae71170",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio playback spot-check; playback remains the authority",
      audioSha256: "785a6d24a09aac5af536917b2d6b951c4c9300198c62c59b2d1e253217bcd198",
      asrWindowCount: 52,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "WEDNESDAY LIVE // AUGUST 7, 2024",
    badge: "FULL SHOW WIKI // TOP 10 MOVIES OF 1996, THE FAM, AND THE CONCERT DISASTER",
    headline: "1996 AFTER DARK: SCREAM, THE ROCK, AND A CONCERT THAT LOST ITS SEATS",
    deck: "A two-hour-plus countdown where 1996 supplies the movies, a Creed trip supplies the pre-show disaster, and the FAM keeps turning the list into a live argument about memory, taste, and what deserves a rewatch.",
    overview: "The August 7, 2024 tape is billed as a Top 10 Movies of 1996 show, but it begins as a concert-disaster documentary. Jay cannot find the seats at Creed, April battles the casino, a pretzel bite becomes an antagonist, Apple Juice costs twenty dollars, a packed bathroom turns into a wall-to-wall logistical crisis, and a broken zipper decides to open its own stage. That first half matters because it explains how this WWAM room works: the hosts do not wait for a clean transition. They let a bad night, a FAM message, or a camera shutter become the subject until the audience has a story worth keeping. Once the countdown starts, the list is unusually clear about its rules. These are not objective claims about the ten greatest films ever made. They are movies the hosts watched, rented, carried home on VHS, or attached to a particular childhood summer. Jay's list opens with From Dusk Till Dawn, Primal Fear, Independence Day, Space Jam, Mission: Impossible, Fear, The Rock, Happy Gilmore, The Frighteners, and Scream. Mike's path lands on Fear, Scream, Twister, Broken Arrow, From Dusk Till Dawn, The Cable Guy, The Rock, and Independence Day, with the two lists overlapping in almost every important place. The film conversations are specific: From Dusk Till Dawn is split into crime movie and vampire movie; Primal Fear earns its twist; Independence Day becomes a July 4th theater memory; Space Jam is a backyard jersey and Michael Jordan object; Mission: Impossible is a spy movie before it is an action franchise; Fear is scary because the threat wants to move into the family; The Rock is a perfect summer machine; and The Frighteners is Ghostbusters with a bruised heart. Scream gets defended as a horror reset button, Twister gets remembered as a storm-chaser dream, Broken Arrow gets called GI Joe with a stealth bomber, and The Cable Guy gets its due as a dark comedy about a stranger who knows your entire life. The honorable mentions are a second show: Ransom, Thinner, Fargo, The Craft, Beavis and Butt-Head Do America, Black Sheep, Multiplicity, Celtic Pride, and the fans' own parallel lists. By the final minutes, the next episode is already built: a school-movie countdown, a Beverly Hills 90210 deep dive, more gaming, and the first same-room Alien: Romulus appointment. The tape is a memory machine with a ranking attached, and that is why the 1996 canon feels alive instead of laminated.",
    story: Object.freeze([
      { at: 0, end: 1800, label: "THE CREED TRIP LOSES ITS SEATS", body: "A camera fix, a casino detour, bad concert geography, a bathroom confession, and a failed zipper make the first section a complete live-room story before the countdown begins." },
      { at: 1800, end: 2700, label: "FAM RECEIPTS AND THE 1996 RULES", body: "The hosts honor Charles Cyphers, answer fan questions, and explain that the list is personal memory rather than an objective ranking." },
      { at: 2700, end: 3600, label: "HARTNETT, HOGAN, AND THE CHAT'S SIDE QUESTS", body: "Josh Hartnett's horror comeback, the Hulk Hogan casting board, hot-sauce science, fasting, tattoos, and Game Informer give the live room its unruly middle act." },
      { at: 3600, end: 4500, label: "FROM DUSK TILL DAWN THROUGH SPACE JAM", body: "Jay and Mike start the countdown with From Dusk Till Dawn, Primal Fear, Independence Day, and Space Jam, tying each pick to a specific memory instead of pretending to deliver a critic's ballot." },
      { at: 4500, end: 5400, label: "MISSION IMPOSSIBLE, FEAR, AND THE ROCK", body: "Mission: Impossible, Fear, The Rock, and Happy Gilmore show the room's favorite 1996 lane: a big hook, a memorable villain, and a VHS-era rewatch impulse." },
      { at: 5400, end: 7200, label: "THE HORROR HEART OF THE LIST", body: "The Frighteners, Scream, Twister, and Broken Arrow reveal the room's taste: high-concept horror, big theater memories, and action movies built around one impossible hook." },
      { at: 7200, end: 8460, label: "THE CABLE GUY, INDEPENDENCE DAY, AND THE HONORABLE MENTIONS", body: "The Cable Guy earns number two, Independence Day takes Jay's number one, and the honorable mentions prove that 1996 could have supported a second top ten." },
      { at: 8460, end: 9684, label: "THE FAM BUILDS THE NEXT SHOW", body: "Joker 2, the WWAM tattoo, fan lists, school movies, Beverly Hills 90210, and the same-room Romulus promise turn a ranking into a forward-looking community calendar." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 5400, end: 5580, label: "THE FRIGHTENERS", topic: "Ghostbusters, Beetlejuice, and a surprisingly sincere horror heart", body: "Play from 1:30:00. Jay explains why Michael J. Fox is the only person who could make the film's con-man paranormal investigator work.", playAt: 5400, playEnd: 5580 }),
      hated: Object.freeze({ at: 7200, end: 7380, label: "THE CABLE GUY ARGUMENT", topic: "a comedy that frightened people because the premise was too personal", body: "Play from 2:00:00. The room separates dark comedy from horror while explaining why a stranger knowing your entire life still lands as a modern nightmare.", playAt: 7200, playEnd: 7380 }),
      wildestDetour: Object.freeze({ at: 720, end: 900, label: "THE CONCERT BATHROOM", topic: "Apple Juice, expensive lines, and an uncooperative zipper", body: "Play from 12:00. The pre-show disaster becomes a full WWAM short film before the first movie is ranked.", playAt: 720, playEnd: 900 }),
      lastWord: Object.freeze({ at: 9520, end: 9684, label: "THE SCHOOL-MOVIE HANDOFF", topic: "the next canon is created live", body: "Play from 2:38:40. The hosts lock next week's theme, invite the FAM back, and promise the first same-room Romulus show.", playAt: 9520, playEnd: 9684 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
