(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "Ssp_-13AeKA";
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: Math.max(0, Math.round(at)), end: Math.min(4141, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* August 23, 2024: an in-person Crow review with three people in the theater,
     a 2.5/3-out-of-10 verdict, an opera-house action jolt, a FAM character
     request, and a closing room that keeps getting stranger after the review ends. */
  var highlights = [
    H(0, 150, "ROOM BREAK", "THE CROW REVIEW STARTS IN A HOUSE WITH BAD ECHO", "The review opens from Jay's house with echo, VLC, memory-card, and room problems. The technical mess becomes the first joke and tells us this is an honest room review, not a polished press junket."),
    H(150, 300, "FILM READ", "THREE PEOPLE, ONE CROW, ZERO PRESSURE", "The hosts explain that only about three people were in the theater, with one older man leaving and a younger viewer looking at his phone. The tiny audience becomes part of the film's atmosphere."),
    H(300, 450, "STRAIGHT TO STEVE'S ASSHOLE", "A DEBEERS COMMERCIAL WEARING A CROW COSTUME", "The first hard verdict is that the remake feels like a string of glossy jewelry commercials, with sex flashbacks doing the emotional heavy lifting. The complaint is specific: polish has replaced personality."),
    H(450, 600, "FILM READ", "HOT TOPIC MODEL, WHITE MAKEUP, AND THE WRONG KIND OF EDGE", "The hosts roast the white makeup, hair, and fashion-editorial presentation, comparing the new Eric to a Hot Topic model or a goth tenth-grader from 1999. The joke lands because it is attached to a design argument."),
    H(600, 750, "SOUNDBYTE / REPLAY", "THE TRAILER GAVE AWAY THE WHOLE MOVIE", "They say the trailer already contains the story's major beats, leaving the feature to repeat its own advertisement. It is a clean, memorable summary of the pacing problem."),
    H(750, 900, "FILM READ", "THE ORIGIN STORY OF SKRILLEX", "A philosophical prison conversation and the remake's music-video mood produce the night's first fully unhinged comparison: this is less a resurrection story than the origin of a moody electronic act."),
    H(900, 1050, "STRAIGHT TO STEVE'S ASSHOLE", "THE MOVIE THAT NOBODY APPROVED", "The hosts describe the script as if it escaped from a classroom and went straight to production. Characters announce their pain, nobody talks naturally, and the story never earns its own mythology."),
    H(1050, 1200, "FILM READ", "ORIGINAL CROW: FEWER FLASHBACKS, MORE FEELING", "The original film's emotional power is contrasted with the remake's constant memory interruptions. The hosts argue that the older movie trusts silence, faces, and consequence instead of explaining every feeling twice."),
    H(1200, 1350, "ROOM BREAK", "A WHISPERED COMMENTARY FOR AN EMPTY THEATER", "Because the room is so empty, the hosts quietly talk to each other during the screening. The result is a spontaneous mini-commentary that becomes part of the review itself."),
    H(1350, 1500, "FILM READ", "REHAB, HORSES, AND THE EXPENSIVE LOVE STORY", "The new backstory—rehab, horses, and a relationship built out of trauma—is treated as a costly detour. The hosts cannot find the lived-in history that made Eric and Shelly matter before the revenge begins."),
    H(1500, 1650, "FILM READ", "CINEMATOGRAPHY AND MUSIC GET THE ONLY GOLD STARS", "The room gives the remake two real positives: some compositions and portions of the score. Even the negative review makes room for what works, which keeps the verdict from becoming a generic hate-watch."),
    H(1650, 1800, "SOUNDBYTE / REPLAY", "THE OPERA HOUSE IS THE ONE TIME THE MOVIE WAKES UP", "The opera-house sequence is called the only sustained action run. It gets a John Wick comparison because, for a few minutes, the movie finally moves with purpose instead of posing."),
    H(1800, 1950, "STRAIGHT TO STEVE'S ASSHOLE", "CGI BLOOD CANNOT SUPPLY A SOUL", "The hosts say the remake reaches for gore while missing the original's physical ugliness and emotional weight. Digital blood becomes a substitute for consequence, and the substitution is not accepted."),
    H(1950, 2100, "FILM READ", "THE BETWEEN-WORLD LOOKS LIKE A LINKIN PARK VIDEO", "The afterlife imagery is compared to a glossy music video, with Bruce Almighty and Creed-style visual references. The issue is not that the movie is supernatural; it is that its supernatural space has no texture of its own."),
    H(2100, 2250, "FILM READ", "THE VERDICT: TWO-AND-A-HALF TO THREE", "The hosts land around 2.5 or 3 out of 10, with the score and cinematography doing nearly all the rescue work. Their practical advice is simple: spend the ticket on Romulus instead."),
    H(2250, 2400, "STRAIGHT TO STEVE'S ASSHOLE", "EDGE TWILIGHT WITHOUT THE CATHARSIS", "The remake is described as an edge-Twilight object: fashion, suffering, and a doomed couple without the release of an actual revenge story. The hosts keep returning to the missing catharsis."),
    H(2400, 2550, "FILM READ", "LUST VERSUS LOVE IS THE CHAT'S BEST NOTE", "A fan argues that the remake sells lust where the original sold true love. The hosts adopt the distinction because it explains why the resurrection feels like expensive adolescence instead of a mythic bond."),
    H(2550, 2700, "FILM READ", "BILL SKARSGÅRD HAD THE BUILD; THE MOVIE LOST THE CHARACTER", "The room says the lead performer could have carried a darker, rougher Crow. They blame the makeup, hair, dialogue, and direction for sanding away the rage that should make the character frightening."),
    H(2700, 2850, "CHARACTER PERFORMANCE", "THE FAM OPENS THE LOOMIS / CHALLIS / SLENDERMAN DOOR", "A fan pivots from the Crow to a character request. The hosts answer in the channel's familiar performance lane, showing how a serious film review can suddenly become a live character receipt.", ["Dr. Loomis", "Dr. Challis", "Slenderman"]),
    H(2850, 3000, "FAN SIGNAL", "THE WEAKEST CROW IN THE ROOM", "A viewer says the new Crow and villain are the least intimidating versions. The hosts do not flatten the disagreement; they use the question to name what the remake removes: danger, rage, and a reason to fear the return."),
    H(3000, 3150, "STRAIGHT TO STEVE'S ASSHOLE", "NO RAGE, NO VENGEANCE, NO FINISH LINE", "The ending is called nihilistic and unfinished. The hosts can accept a bleak Crow, but not one that refuses to deliver a final emotional turn after spending two hours asking for one."),
    H(3150, 3300, "FAN SIGNAL", "THE FAM SAYS SAVE YOUR MONEY", "The live chat's practical verdict arrives before the show is over: do not see the remake unless you are already committed to the experiment. The hosts agree that curiosity is not the same as a recommendation."),
    H(3300, 3450, "CHARACTER PERFORMANCE", "LOOMIS AND CHALLIS SEND MEGAN A SHOUTOUT", "A fan asks for a birthday message to Megan, and the hosts turn the request into a Dr. Loomis/Dr. Challis-style greeting. It is a small, generous performance beat that explains why the FAM keeps asking for the characters.", ["Dr. Loomis", "Dr. Challis"]),
    H(3450, 3600, "FAN SIGNAL", "THE ONE-HOUR SHOW THAT ACCIDENTALLY KEEPS GOING", "The hosts realize the promised short review has drifted into another hour. They thank the FAM, mention the small live audience, and let the extra time become part of the episode's loose-room charm."),
    H(3600, 3750, "WWAM UP IN YA", "THE JAMAICAN-NEIGHBOR SMELL REPORT", "A story about a neighbor, smoke, and an unmistakable smell takes over the closing stretch. It is not a review tangent so much as a reminder that WWAM's funniest material often arrives from somebody's actual evening."),
    H(3750, 3900, "SOUNDBYTE / REPLAY", "APPLE JUICE, HOUSE LIGHTS, AND THE POST-REVIEW DRIFT", "The room keeps floating through apple juice, technical cleanup, and the afterglow of the screening. The review has ended, but the broadcast still has enough loose material to make the goodbye feel earned."),
    H(3900, 4050, "STRAIGHT TO STEVE'S ASSHOLE", "A FAN SAYS THE REMAKE BEATS THE ORIGINAL", "One fan claims the new Crow is better than Brandon Lee's film, and the hosts respond with disbelief, jokes, and a clean restatement of their actual complaint. The disagreement becomes a memorable audience receipt."),
    H(4050, 4141, "CLOSING READ", "THE CROW LEAVES THE ROOM WITH A FART", "The show signs off after the argument, the character requests, and one final bodily-function button. It is an appropriately filthy end to a review that never pretended the night was tidy."),
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio pass across the August 23, 2024 Crow review livestream",
    evidence: Object.freeze({
      duration: 4141,
      captionWords: 14499,
      captionEvents: 4260,
      captionSpanSeconds: 3826.44,
      captionDurationCoveragePercent: 92.4,
      captionSha256: "c9b9827a224a16dec5a8fdb8fa32c26ab0284f01156f09a0685a85f54e31e443",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio playback spot-check; playback remains the authority",
      audioSha256: "23e55206293e41b0c00ddb78d1ac12f2b73aed1d84a1f9d4099644a7cbea3edb",
      asrWindowCount: 20,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "FRIDAY LIVE // AUGUST 23, 2024",
    badge: "FULL SHOW WIKI // THE CROW REVIEW, FAM CHARACTERS, AND THE ROOM AFTER THE MOVIE",
    headline: "THE CROW REVIEW: EDGE-TWILIGHT, OPERA BLOOD, AND NO CATHARSIS",
    deck: "A surprise in-person review lands around 2.5–3/10: the opera-house fight is the one sustained jolt, City of Angels gets a late defense, and a single fan question unleashes Loomis, Challis, Slenderman, and the FAM.",
    overview: "The August 23 Crow review begins with echo, VLC trouble, a memory-card problem, and the revelation that the hosts are talking from Jay's house after seeing the movie in a theater with only a few people inside. That accidental intimacy gives the whole tape its shape. The remake is called glossy, over-explained, and emotionally underfed: a string of jewelry commercials, a Hot Topic fashion shoot, an edge-Twilight romance, and a trailer that already contains the movie. The hosts are not empty-handed with the criticism. They praise portions of the cinematography and score, identify the opera-house sequence as the one sustained action jolt, and explain why the original Crow's quieter emotional economy made Brandon Lee's Eric Draven feel like a person before he became a myth. The new film, by contrast, turns love into expensive trauma, rage into styling, and resurrection into a music-video afterlife with no satisfying catharsis. The room lands around 2.5 or 3 out of 10 and recommends Romulus instead. Then the review becomes WWAM: the FAM asks about Loomis, Challis, and Slenderman; a birthday request produces a character shoutout to Megan; a Jamaican-neighbor smell story takes over the close; and one viewer's claim that the remake beats the original receives the full disbelief treatment. This is a short, vicious, unusually honest WWAM archive entry that lets the room stay messy after the verdict lands.",
    story: Object.freeze([
      { at: 0, end: 1050, label: "THE GLOSSY CROW ARRIVES", body: "A broken room setup, a tiny theater audience, Hot Topic makeup, DeBeers-commercial polish, and a trailer that gives away the story establish the remake's first strike." },
      { at: 1050, end: 2100, label: "THE ORIGINAL STILL HAS A PULSE", body: "The hosts compare the films' emotional architecture, give credit to music and cinematography, and find one genuine action surge in the opera house." },
      { at: 2100, end: 2700, label: "EDGE-TWILIGHT WITHOUT RELEASE", body: "The verdict settles around 2.5–3/10. Lust versus love, a weak villain, expensive rehab backstory, and missing rage explain why the remake feels unfinished." },
      { at: 2700, end: 3300, label: "THE FAM KICKS OPEN THE CHARACTER DOOR", body: "A question about Loomis, Challis, and Slenderman turns a film review into a live performance receipt, while the chat names the remake's least intimidating Crow." },
      { at: 3300, end: 3600, label: "MEGAN GETS THE DOCTOR'S NOTE", body: "A birthday Super Chat produces a warm, deranged character shoutout and shows how fan requests become part of WWAM's actual show language." },
      { at: 3600, end: 3900, label: "THE ROOM AFTER THE MOVIE", body: "The promised short review overruns, a Jamaican-neighbor smell story takes over, and apple juice and cleanup become their own small post-screening comedy." },
      { at: 3900, end: 4141, label: "THE HOT TAKE THAT ENDS THE NIGHT", body: "A viewer says the remake beats the original. The hosts roast the opinion, restate the case, and leave the archive with a final fart instead of a tidy sign-off." },
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1650, end: 1800, label: "THE OPERA HOUSE FINALLY WAKES UP", topic: "the one action sequence with a pulse", body: "Play from 27:30. The hosts explain why the opera fight is the only stretch where the remake stops posing and starts moving.", playAt: 1650, playEnd: 1800 }),
      hated: Object.freeze({ at: 3000, end: 3150, label: "NO CATHARSIS, NO MERCY", topic: "a revenge story that will not deliver revenge", body: "Play from 50:00. The ending's nihilism and lack of emotional release become the clearest reason the remake is sent to Steve's asshole.", playAt: 3000, playEnd: 3150 }),
      wildestDetour: Object.freeze({ at: 3600, end: 3750, label: "THE NEIGHBOR SMELL REPORT", topic: "a Jamaican-neighbor story hijacks the post-review room", body: "Play from 1:00:00. The movie is over, but the real-life story is too strange to leave out.", playAt: 3600, playEnd: 3750 }),
      lastWord: Object.freeze({ at: 3300, end: 3450, label: "LOOMIS AND CHALLIS FOR MEGAN", topic: "the FAM gets a birthday performance receipt", body: "Play from 55:00. A fan request turns into a warm character shoutout before the room drifts toward goodbye.", playAt: 3300, playEnd: 3450 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
