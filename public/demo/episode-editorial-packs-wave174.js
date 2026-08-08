(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "9Kql8Y14bAw", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* October 3, 2024: We Watched SINISTER Together. */
  sources["9Kql8Y14bAw"] = Object.freeze({
    sourceId: "9Kql8Y14bAw",
    reviewState: "full-tape-human-editorial-read-edge",
    editorialPass: "2026-08-07 fine-toothed full-tape editorial read; official caption ledger plus canonical local audio pass across the October 3, 2024 Sinister watchalong",
    evidence: Object.freeze({
      duration: 525,
      captionWords: 1586,
      captionEvents: 227,
      captionSpanSeconds: 527.55,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:dd8c99f0bd6ee b283d5e6164d881b3cb9f62ed7bcd8c77acb3f559f21446678f".replace(/\s/g, ""),
      captionSourceKind: "official YouTube automatic caption ledger acquired as JSON3",
      audioPass: "canonical YouTube audio + official-caption second read; local audio playback spot-check; playback remains the authority",
      audioSha256: "sha256:7c2c0f62ea5f3d93a36bde5cb492341afbf b948fc1281cfa3cb309f31bb29240".replace(/\s/g, ""),
      asrWindowCount: 0,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED SINISTER TOGETHER // OCTOBER 3, 2024",
    badge: "FULL SHOW WIKI // HALLOWEEN HORROR MONTH, MURDER BOXES, SCORPIONS, PROJECTOR NIGHTMARES, AND THE HALLOWEEN NEVER ENDS SONG",
    headline: "THE MURDER BOX MOVES IN: SINISTER TURNS PROJECTOR NIGHT INTO A WWAM CRIME SCENE",
    deck: "A Sinister watchalong starts with balloon animals and a scorpion in the attic, then spirals into murder reels, bad parenting, Ethan Hawke-as-Loomis theories, and a song that refuses to let Halloween die.",
    overview: "Halloween Horror Month 2024 starts with the hosts pretending this is a Midnight Society tale sponsored by two losers with small wieners. The joke is barely finished before the movie's attic starts producing magic, fire, a scorpion, and a box of murder films that should have triggered a police report before the projector was even plugged in. The room is fascinated by the film's openly hostile investigator, but not enough to forgive him for moving into a house, finding a literal archive of killings, and responding with another glass of whiskey. A projector, a dark room, and scotch become a lifestyle experiment the hosts almost want to try, right up until the screen starts showing family murders and something crawls out of a cardboard box like a cat that learned the wrong lesson in a previous life. The second half turns the children into a problem nobody wants to babysit. Cereal, military school, a Chihuahua, a coral snake, moccasins, and a Home Depot song all become weapons in the commentary's attempt to survive the domestic scenes. The film's dread gets compared with a pop-up porn ad, Batman Forever's camera angles, and the Snyder Cut; Ethan Hawke gets promoted to Dr. Loomis, and a possible young Michael becomes the night's favorite terrible theory. The closing minutes abandon restraint. A white-faced Halloween insult becomes a chant, Loomis cannot recover, Dr. Challis is drunk again, and “Halloween never ends” turns into a filthy sing-along about Blumhouse, pumpkin-head VHS, drinking, and the channel's own mythology. It is a short watchalong with unusually high replay value because every scare is immediately translated into a household object, a bad dad, or a character bit.",
    story: Object.freeze([
      { at: 0, end: 72, label: "HALLOWEEN HORROR MONTH OPENS", body: "The Midnight Society framing, balloon animals, Biden/Roomba jokes, and a scorpion in the attic establish the WWAM rule that nothing gets to remain sincerely scary for long." },
      { at: 72, end: 140, label: "THE ATTIC HAS A MURDER BOX", body: "A dirty-70s-porn look, a Megadeth-album comparison, and a box of murder films make the new house feel like an evidence locker with a projector." },
      { at: 140, end: 210, label: "CALL THE COPS, NOT THE WHISKEY", body: "The hosts cannot understand why the investigator watches the films, drinks more, and keeps looking for answers instead of reporting the murders." },
      { at: 210, end: 280, label: "THE BOX CRAWLS BACK", body: "A cardboard-box nightmare, backward spider-walk, and an ugly death turn the projector room from a lifestyle fantasy into a place nobody should enter alone." },
      { at: 280, end: 355, label: "BAD PARENTS, WORSE SHOES", body: "Cereal, kids, a Chihuahua, a coral snake, Rob Zombie's Halloween 2, and Robert Pattinson's Bruce Wayne all crowd into the domestic nightmare." },
      { at: 355, end: 420, label: "THE SNYDER CUT OF SINISTER", body: "The hosts compare the horror imagery with pop-up ads and the Snyder Cut, then land on Ethan Hawke as Dr. Loomis and a possible young Michael." },
      { at: 420, end: 490, label: "THE WHITE-FACED SONG", body: "A Halloween insult becomes a chant about Loomis, Challis, darkness, Blumhouse, Pumpkinhead on VHS, drinking, and the refusal to let the holiday end." },
      { at: 490, end: 525, label: "PUMPKINHEAD ON VHS", body: "The final repeated lines turn the watchalong into a miniature WWAM theme song, complete with a car ride, trick-or-treating, and one last filthy promise." },
    ]),
    highlights: Object.freeze([
      H(8, 19, "WWAM UP IN YA", "MIDNIGHT SOCIETY SPONSORS", "Halloween Horror Month is introduced as if it were sponsored by two losers with small wieners."),
      H(20, 31, "SOUNDBYTE / REPLAY", "BALLOON ANIMAL MAGIC", "The first supernatural effect is treated like a party trick that should have stayed at a child's birthday."),
      H(32, 43, "STRAIGHT TO STEVE'S ASSHOLE", "JOE BIDEN'S ROomba", "A body or machine in the room becomes a Biden/Roomba comparison before the movie can explain its own magic."),
      H(44, 55, "DEEP DIVE", "THE ATTIC SCORPION", "The hosts ask why anyone has a scorpion in an attic, then immediately start treating the sting like a sexual opportunity."),
      H(56, 67, "WWAM UP IN YA", "DIRTY-ASS SEVENTIES PORN", "A visual style gets compared with 1970s porn and a Megadeth album in the same breath."),
      H(68, 79, "SOUNDBYTE / REPLAY", "HANG IT IN THE KID'S ROOM", "A grotesque image is enthusiastically nominated as bedroom décor, because parental judgment has left the building."),
      H(80, 91, "STRAIGHT TO STEVE'S ASSHOLE", "THE WALLET AFTER CHRISTMAS", "A wallet after Christmas becomes the most relatable way to describe the family's financial misery."),
      H(92, 103, "DEEP DIVE", "THE MURDER BOX", "A box of films appears in the attic, and the hosts agree the correct first move is a police call, not a screening."),
      H(104, 115, "WWAM UP IN YA", "PROJECTOR AND SCOTCH CLUB", "The hosts admit that sitting in the dark with a projector and a little brandy sounds strange enough to become tempting."),
      H(116, 127, "STRAIGHT TO STEVE'S ASSHOLE", "FIVE-SECOND CRIME SCENE", "Finding a full box of murders five seconds after moving in is declared an immediate exit condition."),
      H(128, 139, "SOUNDBYTE / REPLAY", "FIONA APPLE IS GUILTY", "A guilty-looking movie moment gets pinned on the last Fiona Apple video the hosts ever want to watch."),
      H(140, 151, "DEEP DIVE", "REPORT A MURDER, REPORT A SQUIRTER", "The police call turns into a filthy mishearing that no dispatcher should ever have to process."),
      H(152, 163, "WWAM UP IN YA", "UNDER-SIEGE CAKE GIRL", "A woman emerging from a cake is invoked before the scene can decide what kind of nightmare it wants to be."),
      H(164, 175, "SOUNDBYTE / REPLAY", "THE CARDBOARD BOX NIGHTMARE", "The hosts cannot imagine crawling into a cardboard box during a nightmare and then spider-walking backward at the victim."),
      H(176, 187, "STRAIGHT TO STEVE'S ASSHOLE", "WORST WAY TO DIE", "The death is so unpleasant that the room begins negotiating with a hypothetical future killer about acceptable murder etiquette."),
      H(188, 199, "FAN SIGNAL", "IS THAT JAY LENO?", "A face in the darkness gets mistaken for Jay Leno, giving the scare a late-night-TV detour."),
      H(200, 211, "WWAM UP IN YA", "SOGGY CORN CHIP", "A prop is reduced to the texture of a soggy corn chip, with white-cheddar jalapeño Doritos waiting in the wings."),
      H(212, 223, "DEEP DIVE", "TOO MUCH SCOTCH", "A character's behavior is explained as the direct result of drinking too much scotch before trying to parent."),
      H(224, 235, "STRAIGHT TO STEVE'S ASSHOLE", "MOTHER'S MILITARY SCHOOL", "The children are threatened with military school while the hosts debate whether cereal could have prevented the entire plot."),
      H(236, 247, "WWAM UP IN YA", "MARTHA STEWART COOKS THE KIDS", "Domestic stress is reimagined as a drunk Martha Stewart recipe that ends with children in the oven."),
      H(248, 259, "SOUNDBYTE / REPLAY", "THE CHIHUAHUA DID IT", "The dog becomes the prime suspect, with the room refusing to let anyone accuse the obvious supernatural suspect first."),
      H(260, 271, "DEEP DIVE", "CORAL SNAKE LESSON", "The snake is identified by its stripes and immediately connected with the next possible Halloween movie prop."),
      H(272, 283, "WWAM UP IN YA", "ROB ZOMBIE H2 IN THE BOX", "The next thing in the attic is predicted as a copy of Rob Zombie's Halloween 2, an extremely specific archive nightmare."),
      H(284, 295, "FAN SIGNAL", "ROBERT PATTINSON'S BRUCE WAYNE", "Ethan Hawke's investigator gets compared with Robert Pattinson's Bruce Wayne, giving Sinister an unexpected Batman casting lane."),
      H(296, 307, "SOUNDBYTE / REPLAY", "COFFEE OR WE LEAVE", "A fake domestic scene demands coffee and threatens to abandon the writer if his book is not a hit."),
      H(308, 319, "STRAIGHT TO STEVE'S ASSHOLE", "POP-UP PORN AD", "A figure appearing on screen is compared with a pop-up ad arriving at the worst possible moment on a porn site."),
      H(320, 331, "DEEP DIVE", "THE PROJECTOR IS THE MONSTER", "A family murder reel projected into a hallway becomes the exact image the hosts never want to encounter at home."),
      H(332, 343, "WWAM UP IN YA", "TREVOR GET IN THE HOUSE", "Trevor is treated like a pervert who should be dropped at a fire station instead of left outside with the supernatural."),
      H(344, 355, "SOUNDBYTE / REPLAY", "POCAHONTAS BOOTS", "The child's moccasins are described as if he traded with Pocahontas and then bought the hipster version at a craft fair."),
      H(356, 367, "STRAIGHT TO STEVE'S ASSHOLE", "HOME DEPOT SONG", "A Home Depot jingle is proposed as the perfect soundtrack for the grass-cutting emergency."),
      H(368, 379, "FAN SIGNAL", "SWING AWAY", "A family scene gets baseball coaching from the room: turn around, swing away, and stop letting the horror dictate the schedule."),
      H(380, 391, "WWAM UP IN YA", "BOURBON, NO SEX, BAD KIDS", "A fake confession about drinking bourbon, hating the kids, and getting no sex turns the domestic nightmare into a sitcom monologue."),
      H(392, 403, "DEEP DIVE", "LEAVE THE FAMILY", "The clearest survival advice of the night is to leave the family and start over, but absolutely do not eat them."),
      H(404, 415, "SOUNDBYTE / REPLAY", "CHRISTIAN CHURCH MEETING", "The scene is compared with a Christian church meeting and a landlord throwing somebody's belongings into the street."),
      H(416, 427, "STRAIGHT TO STEVE'S ASSHOLE", "BURN THE TAX RETURN", "Eviction imagery becomes burning a tax return to avoid an audit, a wildly specific financial panic."),
      H(428, 439, "DEEP DIVE", "THE SNYDER CUT THEORY", "The hosts decide the film is secretly the Snyder Cut, then immediately promote Ethan Hawke to Dr. Loomis."),
      H(440, 451, "CHARACTER PERFORMANCE", "ETHAN HAWKE AS DR. LOOMIS", "The investigator is recast as a tired Dr. Loomis figure, turning Sinister's detective into Halloween lore.", ["Dr. Loomis"]),
      H(452, 463, "CHARACTER PERFORMANCE", "YOUNG MICHAEL?", "A child in the scene becomes a possible young Michael, a theory the room is far too excited to reject.", ["Michael Myers"]),
      H(464, 475, "CHARACTER PERFORMANCE", "THE WHITE-FACED FUCKER", "The Halloween Horror Month sign-off turns the killer into an insult with a recurring cadence and a sister-stabbing rhyme.", ["Michael Myers"]),
      H(476, 487, "CHARACTER PERFORMANCE", "LOOMIS CANNOT RECOVER", "Loomis fails while Dr. Challis is drunk again and sleeping with the wrong people, preserving the channel's character canon.", ["Dr. Loomis", "Dr. Challis"]),
      H(488, 499, "WWAM UP IN YA", "HALLOWEEN NEVER ENDS", "The refrain insists Halloween never ends, even while the hosts are openly trying to end the song."),
      H(500, 510, "SOUNDBYTE / REPLAY", "BLUMHOUSE GETS A VERSE", "Blumhouse, dead killers, and the refusal to believe the monster is gone all receive their own dirty rhyme."),
      H(511, 520, "STRAIGHT TO STEVE'S ASSHOLE", "PUMPKINHEAD ON VHS", "The final destination is a car, a drink, and Pumpkinhead on VHS, an ideal WWAM Halloween road trip."),
      H(521, 525, "SOUNDBYTE / REPLAY", "LET'S GO TRICK-OR-TREATING", "The show leaves on a repeated invitation to drink, trick-or-treat, and keep the tape rolling."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 428, end: 463, label: "THE SNYDER-CUT LOOMIS THEORY", topic: "Ethan Hawke and Halloween lore", body: "Play from 7:08. The room turns Sinister's investigator into Ethan Hawke as Dr. Loomis, then wonders whether a child could be young Michael.", playAt: 428, playEnd: 463 }),
      hated: Object.freeze({ at: 224, end: 259, label: "MOTHER'S MILITARY SCHOOL", topic: "the family scenes", body: "Play from 3:44. Cereal, screaming children, a Chihuahua, and a Martha-Stewart-cooks-the-kids joke explain exactly why the hosts want the family out of the house.", playAt: 224, playEnd: 259 }),
      wildestDetour: Object.freeze({ at: 140, end: 175, label: "REPORT A SQUIRTER", topic: "the police-call detour", body: "Play from 2:20. A murder report turns into a filthy dispatcher misunderstanding, followed by a cardboard-box nightmare and a backward spider walk.", playAt: 140, playEnd: 175 }),
      lastWord: Object.freeze({ at: 464, end: 525, label: "HALLOWEEN NEVER ENDS", topic: "the closing song", body: "Play from 7:44. White-faced Michael, broken Loomis, drunk Challis, Blumhouse, Pumpkinhead on VHS, and trick-or-treating close the Halloween Horror Month receipt.", playAt: 464, playEnd: 525 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-07",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
