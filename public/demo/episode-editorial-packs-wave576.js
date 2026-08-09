(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "-4VdRLU4l_U";
  var duration = 8842;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(120, 420, "OPENING CHAOS", "1999 ARRIVES WITH A SHADOW, A FLEA-MARKET DETOUR, AND A BIRTH-YEAR FLEX", "The show opens in Friday Night Fights mode: a camera shadow, Peddler's Mall talk, and Gypsy Warrior pointing out that 1999 is the year they were born. It is a movie bracket wrapped in a hangout with no interest in entering quietly."),
    H(420, 720, "FAM RECEIPT", "BIG BOPPER SEES THE SKY, THE CHAT SEES AN ACID STORY, AND EVERYONE GETS A STIMULUS-CHECK BIT", "Big Bopper's line about seeing the sky becomes a quick mushrooms-and-acid detour, followed by stimulus money and OnlyFans talk. The tone is loose, audible, and unmistakably live before the first film is even voted on."),
    H(720, 1120, "LIVE-WIRE DEBATE", "THE YOUTUBE DISLIKE BUTTON ARGUMENT GETS WEIRDLY EMPATHETIC", "The hosts argue about hidden dislikes, creator anxiety, and whether a five-star style rating would be better. Under the jokes is a real point: a small channel can feel every anonymous drive-by hit, so the room tries to imagine what the platform looks like from the other side."),
    H(1120, 1500, "FAM / MUSIC LORE", "NICKELBACK, AVRIL, SUM 41, AND A SWEATY SEAN MORGAN BROTHERHOOD RECEIPT", "A Nickelback and Avril Lavigne tangent turns into a concert story: Sean Morgan shoves J's head into a sweaty armpit and tells him the lyrics meant a lot to him too. It is exactly the kind of affectionate, disgusting side-road that makes this feel like a real archive rather than a bracket spreadsheet."),
    H(1500, 1800, "CHARACTER CANON", "THE SHAPE OF THE SHADOWS ASKS LOOMIS TO SELL NICKY ON MICHAEL MYERS CURTAINS", "The Shape of the Shadows asks Dr. Loomis to convince Nicky that serial-killer curtains are a good purchase. J's Loomis voice turns a chat prompt into a tiny piece of household horror merchandising canon."),
    H(1800, 2110, "MOVIE NEWS", "UNCHARTED CASTING: TOM HOLLAND, MARK WAHLBERG, AND THE MOUTH-BREATHER SULLY JOKE", "The room reacts to Tom Holland as Nathan Drake and Mark Wahlberg as Sully, then immediately starts doing Wahlberg as a mouth-breathing action hero. The casting news works as both actual context and a clean comedy receipt."),
    H(2110, 2750, "1999 BRACKET", "HOUSE ON HAUNTED HILL GETS PUT ON TRIAL BY DEEP BLUE SEA", "The first bracket lane pits the gothic remake against shark spectacle. The hosts make the case for atmosphere, cheese, effects, and rewatch value while the live poll decides which 1999 flavor survives."),
    H(2750, 3380, "1999 BRACKET", "LAKE PLACID AND END OF DAYS TURN THE POLL INTO A MONSTER-VERSUS-ARNOLD BRAWL", "Lake Placid's creature comedy meets End of Days' apocalyptic Schwarzenegger energy. The vote leans End of Days, and the booth treats the result as a referendum on how much late-'90s ridiculousness a horror list is allowed to carry."),
    H(3380, 4070, "1999 BRACKET", "AUDITION VS. BLAIR WITCH: SLOW-BURN DREAD BEATS THE JAPANESE NIGHTMARE ARGUMENT", "The Audition/Blair Witch pairing gives the show its most serious horror conversation. Blair Witch takes the lane in the live vote, but the talk preserves why Audition is the more upsetting film rather than reducing the matchup to a score."),
    H(4320, 5070, "1999 BRACKET", "STIR OF ECHOES, IDLE HANDS, AND A POLL THAT REFUSES TO PICK A NORMAL MOOD", "Kevin Bacon dread and stoner-demon comedy share one voting lane. The audience bounces between craft, quotability, and pure sleepover energy; the point is not that one movie is objectively correct, but that 1999 could hold both in the same tournament."),
    H(5070, 5740, "SEMIFINAL", "THE SIXTH SENSE SENDS DEEP BLUE SEA BACK TO THE TANK", "The Sixth Sense is treated as the complete package—performances, reveal architecture, melancholy, and rewatchable details—while Deep Blue Sea gets credit for making the sharks the event. The poll breaks for the prestige ghost story."),
    H(5740, 6280, "SEMIFINAL", "SLEEPY HOLLOW BEATS END OF DAYS WITH ATMOSPHERE, HEADLESS HORSEMAN ENERGY, AND BETTER HAIR", "Sleepy Hollow takes the other semifinal. The argument is a Tim Burton mood victory: fog, production design, and gothic romance against End of Days' loud apocalypse machinery."),
    H(6280, 6960, "FINAL FOUR", "THE BLAIR WITCH IS DEFEATED BY THE SIXTH SENSE", "The Blair Witch Project's influence and raw panic get their due, but the live poll sends The Sixth Sense forward. The booth keeps the distinction clear: cultural impact is not the same as the movie the room wants to revisit tonight."),
    H(6960, 7550, "FINAL FOUR", "IDLE HANDS GETS THE MIDDLE FINGER AS SLEEPY HOLLOW SURVIVES 51–50", "Sleepy Hollow barely survives Idle Hands. The close vote is the most useful proof that this list is measuring attachment, not consensus: Burton's fog edges out a movie whose entire argument is a possessed hand trying to ruin your night."),
    H(7550, 8240, "CHAMPIONSHIP", "THE SIXTH SENSE IS THE TOP HORROR MOVIE OF 1999, AND SLEEPY HOLLOW MAKES IT SWEAT", "The final is Sixth Sense versus Sleepy Hollow. The votes and closing narration crown The Sixth Sense, with Sleepy Hollow as the stylish runner-up. The win lands because the episode has argued the bracket round by round instead of dropping a prewritten answer."),
    H(8040, 8330, "CHARACTER / FAMILY LORE", "BIG DAD, DR. LOOMIS, UNDERWEAR, FAZOLI'S, AND THE MOST PERSONAL AWARD SPEECH POSSIBLE", "The final choice opens the door to Big Dad stories: J maps his Loomis performance onto his father's voice, then wanders through underwear, popcorn, and spaghetti at Fazoli's. It is character DNA disguised as a victory lap."),
    H(8330, 8842, "LAST CALL", "THE 1999 FREESTYLE ENDS WITH PANTS, CONSTIPATION, AND A CAMERA DEATH", "Austin's Super Chat sets up a 1999 nostalgia roll call—The Slim Shady LP, WWF Attitude Era, and vacation memories—before the hosts freestyle about shitting their pants in sixth grade and constipation. The camera dies on cue and the Easter-weekend goodbye becomes the perfect ugly little epilogue."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 120, end: 1800, label: "THE BRACKET STARTS AS A HANGOUT, NOT A BROADCAST", body: "A shadowy camera, Peddler's Mall, birth-year pride, mushrooms, stimulus money, and a long YouTube dislike-button argument establish the episode's real texture. The Sean Morgan armpit story and Loomis curtains request show the two lanes that will keep colliding all night: honest memory and gloriously stupid performance.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1800, end: 5070, label: "1999'S FIRST ROUND IS A FIGHT BETWEEN ATMOSPHERE AND ABSURDITY", body: "Uncharted casting news opens the tournament, then House on Haunted Hill, Deep Blue Sea, Lake Placid, End of Days, Audition, Blair Witch, Stir of Echoes, and Idle Hands are argued in real time. The bracket is useful because the hosts explain what each film does to a room: mood, effects, monsters, shock, or pure sleepover chaos.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5070, end: 7550, label: "THE SEMIS MAKE THE LIST'S VALUES VISIBLE", body: "The Sixth Sense beats Deep Blue Sea on completeness; Sleepy Hollow beats End of Days on atmosphere; The Sixth Sense then defeats Blair Witch; and Sleepy Hollow barely gets past Idle Hands. These are not empty poll results—the commentary spells out why influence, craft, quotability, and rewatch value pull in different directions.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 7550, end: 8330, label: "THE SIXTH SENSE WINS, THEN BIG DAD STEALS THE TROPHY", body: "The championship finally crowns The Sixth Sense over Sleepy Hollow. Instead of stopping at the result, the show folds the win into the Loomis/Big Dad character lane: J's father becomes the source code for the voice, posture, and family stories that make the impersonation feel lived-in.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 8330, end: 8842, label: "THE UGLIEST POSSIBLE 1999 NOSTALGIA CREDITS ROLL", body: "Austin's 1999 memories lead into a freestyle about the Slim Shady LP, the WWF Attitude Era, pants-shitting in sixth grade, and constipation. The camera dies, the show says goodbye for Easter weekend, and the broken technical close somehow feels like the correct final punchline.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h27m22s Best Horror Movies of 1999 Friday Night Fight; local audio, canonical captions, and Whisper ledger checked across the blocked-camera opening, dislike-button debate, Sean Morgan concert story, Loomis curtains request, Uncharted casting, every bracket matchup, semifinal and championship votes, Big Dad/Loomis family lore, Austin's 1999 nostalgia, and the pants/constipation freestyle close",
    evidence: Object.freeze({
      duration: 8842,
      captionWords: 32419,
      captionEvents: 4849,
      captionSpanSeconds: 8843.84,
      captionDurationCoveragePercent: 100,
      captionSha256: "446474F9199EB87E154BC7700D0FB00C9083E61014C1DBC9734965B7C7447C5E",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "7020E51AA998094BB24E54D3BAFACF2107C164E329E751081C08FF50F1E74192",
      asrSegmentCount: 521,
      asrSha256: "sha256:6237629F982B8AFB5F072783FF2DFD060FEBFA1083D56441ABC1995EECDFE16C",
      asrCoverageStartSeconds: 12,
      asrCoverageEndSeconds: 8837,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "BEST HORROR MOVIES OF 1999 // FRIDAY NIGHT FIGHT",
    badge: "FULL SHOW WIKI // THE SIXTH SENSE, SLEEPY HOLLOW, AND THE 1999 BRACKET",
    headline: "THE SIXTH SENSE WINS 1999, LOOMIS SELLS SERIAL-KILLER CURTAINS, AND THE CAMERA DIES",
    deck: "A full-audio WWAM bracket night: YouTube dislike-button nerves, Sean Morgan armpit lore, Uncharted casting, eight 1999 horror contenders, a photo-finish semifinal, Big Dad character DNA, and a freestyle about shitting your pants.",
    overview: "The 1999 bracket is only the spine. Around it, the room talks about a hidden YouTube dislike button, why small creators feel every anonymous hit, Nickelback and Avril Lavigne, and a Sean Morgan concert hug that becomes an armpit assault. The Shape of the Shadows asks Dr. Loomis to sell Nicky on Michael Myers curtains; Uncharted casting gets the Wahlberg mouth-breather treatment; then the films enter the ring. House on Haunted Hill, Deep Blue Sea, Lake Placid, End of Days, Audition, Blair Witch, Stir of Echoes, Idle Hands, The Sixth Sense, and Sleepy Hollow are not flattened into stars: the hosts argue atmosphere, monster spectacle, shock, craft, influence, and rewatch value round by round. The Sixth Sense eventually wins over Sleepy Hollow. Big Dad stories explain where J's Loomis voice lives, and Austin's 1999 nostalgia ends in a pants-shitting freestyle just as the camera gives up. Local audio and aligned ASR support every route; playback remains the authority.",
    topics: Object.freeze(["Best Horror Movies of 1999", "The Sixth Sense", "Sleepy Hollow", "Blair Witch Project", "Deep Blue Sea", "End of Days", "Idle Hands", "Audition", "Dr. Loomis", "Big Dad", "Uncharted", "YouTube dislikes", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 7550, end: 8240, label: "THE SIXTH SENSE TAKES THE 1999 CROWN", topic: "1999 bracket", body: "Play the final vote for the cleanest payoff: the room has to explain why The Sixth Sense beats Sleepy Hollow instead of simply declaring a winner.", playAt: 7550, playEnd: 8240 }),
      hated: Object.freeze({ at: 720, end: 1120, label: "THE DISLIKE BUTTON ARGUMENT", topic: "YouTube culture", body: "Play the platform debate for the episode's most sincerely irritated lane—the jokes are covering a real creator fear.", playAt: 720, playEnd: 1120 }),
      wildestDetour: Object.freeze({ at: 8330, end: 8842, label: "THE 1999 PANTS-AND-CONSTIPATION FREESTYLE", topic: "WWAM Up in Ya", body: "Play the final song for the most deranged exit imaginable: Slim Shady, WWF, a sixth-grade accident, and a camera that dies before anyone can clean up.", playAt: 8330, playEnd: 8842 }),
      lastWord: Object.freeze({ at: 1500, end: 1800, label: "LOOMIS SELLS THE CURTAINS", topic: "Character canon", body: "Play the Shape of the Shadows request for a compact Dr. Loomis receipt that can travel into the character archive.", playAt: 1500, playEnd: 1800 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 180, end: 235, name: "Gypsy Warrior", kind: "chat receipt", note: "Points out that 1999 is the year they were born during the opening hangout." },
        { at: 410, end: 465, name: "Big Bopper", kind: "chat receipt", note: "Supplies the 'saw the sky' line that triggers the mushrooms-and-acid detour." },
        { at: 635, end: 690, name: "Robbie Gozell", kind: "chat receipt", note: "Asks why the show is running late during the opening lane." },
        { at: 780, end: 835, name: "Joshua Ayers", kind: "Super Chat", note: "Says to spend stimulus money on alcohol and tobacco." },
        { at: 840, end: 895, name: "Christy Awesome", kind: "chat receipt", note: "Adds a stimulus and 'Just Got Paid' prompt." },
        { at: 1510, end: 1570, name: "The Shape of the Shadows", kind: "chat receipt", note: "Requests Dr. Loomis convince Nicky to buy Michael Myers curtains." },
        { at: 1580, end: 1635, name: "Kool-Aid Unleashed", kind: "chat receipt", note: "Adds a Loomis/character response during the curtains bit." },
        { at: 1840, end: 1895, name: "The Disheveled Man", kind: "chat receipt", note: "Checks in as the Uncharted casting lane starts." },
        { at: 2030, end: 2085, name: "Dr Strange", kind: "chat receipt", note: "Adds a movie-news reaction before the first bracket vote." },
        { at: 2780, end: 2835, name: "Lex Greet", kind: "chat receipt", note: "Reacts during Lake Placid versus End of Days." },
        { at: 3270, end: 3325, name: "Culture with Pat", kind: "chat receipt", note: "Adds a 1999 bracket response before the Audition matchup." },
        { at: 3490, end: 3550, name: "Stephanie Johnson", kind: "chat receipt", note: "Checks in during the Audition/Blair Witch debate." },
        { at: 3700, end: 3760, name: "Troy Grubb", kind: "chat receipt", note: "Receives a birthday/popcorn shout-out during the first round." },
        { at: 4300, end: 4355, name: "William McSwain", kind: "chat receipt", note: "Adds a reaction as Stir of Echoes meets Idle Hands." },
        { at: 4420, end: 4475, name: "Samantha S", kind: "chat receipt", note: "Asks what the hosts think about Dogma." },
        { at: 5260, end: 5320, name: "Mark Dorman", kind: "chat receipt", note: "Adds to the Sixth Sense/Deep Blue Sea semifinal." },
        { at: 5380, end: 5440, name: "Mud Nelson", kind: "chat receipt", note: "Checks in as the Sixth Sense argument turns to rewatch value." },
        { at: 5900, end: 5960, name: "Melissa Petrina", kind: "chat receipt", note: "Adds a reaction during Sleepy Hollow versus End of Days." },
        { at: 6490, end: 6550, name: "Vinnie", kind: "chat receipt", note: "Returns during the Blair Witch/Sixth Sense final-four poll." },
        { at: 7090, end: 7150, name: "Nick and Tully", kind: "chat receipt", note: "Add a reaction as Idle Hands and Sleepy Hollow go down to the wire." },
        { at: 7320, end: 7380, name: "Tito Sanchito", kind: "chat receipt", note: "Adds a late bracket vote before the championship." },
        { at: 7630, end: 7690, name: "Gabriel Johnson the Third", kind: "chat receipt", note: "Checks in during the Sixth Sense/Sleepy Hollow final." },
        { at: 7810, end: 7870, name: "Juan Herrera", kind: "chat receipt", note: "Adds a championship reaction." },
        { at: 8390, end: 8450, name: "Austin", kind: "Super Chat", note: "Sets up the 1999 nostalgia roll call with Slim Shady LP and the WWF Attitude Era." },
        { at: 8500, end: 8555, name: "The Blackest Eye", kind: "chat receipt", note: "Adds a reaction as the freestyle starts." },
        { at: 8640, end: 8695, name: "Bernardo Guzman", kind: "chat receipt", note: "Checks in during the closing pants/constipation song." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
