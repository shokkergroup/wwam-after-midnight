(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "yVEaNc3cVgg";
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: Math.max(0, Math.round(at)), end: Math.min(7134, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* August 14, 2024: the first genuinely in-person WWAM room after Jay's move.
     The tape is a live fan salon as much as a movie show: Halloween game design,
     Alien 3 arguments, Crow anxiety, FAM lore, character requests, and a new
     house that keeps becoming the evening's co-star. */
  var highlights = [
    H(0, 180, "ROOM BREAK", "THE NEW HOUSE OPENING CREDITS", "The first in-person setup after Jay's move begins with a shock joke, hidden hands, a desk fan, and the hosts figuring out how to share a room again. The production problem is the cold open."),
    H(180, 360, "FAN SIGNAL", "KYLIE OPENS THE LOOMIS HOTLINE", "Kylie asks for a Dr. Loomis message about helping Michael escape. The answer is a deliberately boundary-pushing character bit, and it tells the archive exactly how the FAM likes to play."),
    H(360, 540, "FILM READ", "KRAVEN'S RHINO LOOKS LIKE BODY PAINT", "The Kraven trailer gets a fast, specific roast: the Rhino design looks less like a creature and more like somebody applied special-effects makeup in a hurry. The room still hopes the movie goes hard and bloody."),
    H(540, 720, "WWAM UP IN YA", "THE FAKE IN A VIOLENT NATURE SEQUEL", "Asked about a sequel, the hosts invent an absurd plot, commit to it for a beat, then admit they are making it up. The bit works because the fake confidence collapses in public."),
    H(720, 900, "CHARACTER PERFORMANCE", "LOOMIS SINGS THE NEW-HOUSE WELCOME", "Dr. Loomis turns a fan request into a song, roasts Kylie, and insists that a person asking for this much character content needs a job. The room has not even reached the movie queue yet.", ["Dr. Loomis"]),
    H(900, 1080, "FAN SIGNAL", "BLINK-182 FROM THE BAD SEATS", "A fan asks about Blink in Detroit. Mike gives a detailed seat report: blocked sightlines, the strange economics of arena seating, and why being in the building can still win the night."),
    H(1080, 1260, "WWAM UP IN YA", "MOTA, GAME GENIES, AND THE MOLDY MUFFIN", "A Dark Place Falls and The Ring game conversation slides into Apple Juice Anonymous and an ill-advised Urban Dictionary search. It is gross, self-aware, and exactly the kind of detour the live room rewards."),
    H(1260, 1440, "FAN SIGNAL", "THE WWAM TATTOO RECEIPT", "A fan announces a WWAM tattoo. Loomis treats permanent fandom like a suspicious medical procedure, and the room turns one supportive message into a recurring logo-and-body-art joke."),
    H(1440, 1620, "FILM READ", "ALIEN 3, RESURRECTION, AND THE RIPLEY PROBLEM", "The hosts argue that Alien 3 has a stronger central story than Resurrection but loses some of the spark, while also rejecting the idea that any replacement could simply be another Ripley."),
    H(1620, 1800, "HALLOWEEN LORE", "THE POSTER WALL BECOMES A PERSONALITY TEST", "Jurassic Park, Ghostbusters, Armageddon, Almost Famous, Halloween 4, Scream, and Speed become a rapid-fire debate about what a room should say about the person who lives in it."),
    H(1800, 1980, "CHARACTER PERFORMANCE", "LOOMIS SINGS KISS FROM A ROSE", "A Batman Forever fan edit prompts another Loomis musical receipt. The performance is half sincere, half sabotage, and entirely a fan-requested character door.", ["Dr. Loomis"]),
    H(1980, 2160, "ROOM BREAK", "NCAA 25 EATS THE HOUSEHOLD", "Mike confesses that NCAA 25 can swallow an entire evening. The hosts compare gaming obsession, family interruptions, and Jay's Assassin's Creed rage like they are documenting a domestic hazard."),
    H(2160, 2340, "HALLOWEEN LORE", "THE $25 HALLOWEEN ARCADE QUESTION", "The new Halloween game trailer looks like Contra or TMNT with Michael Myers. The hosts are cautiously optimistic, but the price and the promise of two games trigger a full design autopsy."),
    H(2340, 2520, "HALLOWEEN LORE", "BUILD THE LOOMIS CAMPAIGN FIRST", "Their ideal Halloween game is not just Michael in a maze: start as a sheriff or Loomis detective, track the murders, then unlock a second side where the player becomes Michael. It is the clearest design brief in the tape."),
    H(2520, 2700, "FILM READ", "BLOMKAMP GETS A FAIRER HEARING", "The Alien 5 discussion separates District 9 from Chappie and asks whether Neil Blomkamp was a visionary, a bad fit, or simply attached to a project that never got a chance."),
    H(2700, 2880, "FAN SIGNAL", "THE BATMAN FOREVER EDIT ARRIVES", "A fan's Batman Forever edit and the request for Loomis to sing turn a private piece of fan craft into a live-show artifact. The archive treats it as community texture, not a throwaway shoutout."),
    H(2880, 3060, "STRAIGHT TO STEVE'S ASSHOLE", "THE CROW AS A SOUNDCLOUD RAPPER", "Before the new Crow is even seen, the hosts imagine a mumble-rapper version with Taco Bell energy and a tragic SoundCloud bio. It is a pre-release roast that remains explicitly a prediction, not a verdict."),
    H(3060, 3240, "FAN SIGNAL", "LEE THE MACHINE DROPS INTO THE ROOM", "Lee Bowers sends a large, warm Super Chat and instantly becomes part of the show's physical lore. The response includes thanks, a championship-belt memory, and the feeling that the FAM is helping build the room."),
    H(3240, 3420, "CHARACTER PERFORMANCE", "DR. CHALLIS AND THE TRENCH-COAT RECEIPT", "Lee's Halloween trench-coat message prompts a full Dr. Challis workplace fantasy. The character voice is the joke, while the underlying fan story is genuine appreciation for a gift that became part of WWAM history.", ["Dr. Challis"]),
    H(3420, 3600, "HALLOWEEN LORE", "SIDE A: SURVIVOR; SIDE B: MICHAEL", "The hosts keep refining the game pitch: a tense Alien Isolation-style survivor campaign, followed by a Michael mode that changes the rules. They want a real Halloween story before a power fantasy."),
    H(3600, 3780, "FAN SIGNAL", "OCTOBER IN THE NEW HOUSE", "The move becomes a schedule promise: more in-person streams, Halloween Horror Month, Scarefest, and the possibility that the new room will host the FAM instead of merely broadcasting to it."),
    H(3780, 3960, "SOUNDBYTE / REPLAY", "ALIEN ROMULUS WATCH ORDER", "The room gives practical pre-Romulus advice: at minimum, know Alien, then let the new movie stand on its own. The joint spoiler stream is already becoming the next appointment."),
    H(3960, 4140, "FAN SIGNAL", "THE FAM WANTS A GAMING STREAM", "Madden, NCAA, RoboCop, and Assassin's Creed are proposed as future live lanes. The hosts talk through what would be fun, what would be monetizable, and what would instantly become a technical disaster."),
    H(4140, 4320, "CHARACTER PERFORMANCE", "LOOMIS MEETS OBI-WAN", "A fan asks Donald Pleasence's Loomis to talk with Alec Guinness's Obi-Wan. The crossover is knowingly silly, but the attempt shows how the FAM can request a scene instead of merely requesting a quote.", ["Dr. Loomis", "Obi-Wan Kenobi"]),
    H(4320, 4500, "FILM READ", "FEDE ALVAREZ IS THE ROOM'S CURRENT ANSWER", "When the conversation turns to modern horror directors, Fede Alvarez gets the strongest support, with James Wan and Lights Out folded into a useful debate about atmosphere, set pieces, and restraint."),
    H(4500, 4680, "CHARACTER PERFORMANCE", "SLENDERMAN SINGS Nookie", "A fan asks Slenderman for a song. The result is a deliberately inappropriate character performance that belongs in the playable character lane, not in the film verdict.", ["Slenderman"]),
    H(4680, 4860, "FAN SIGNAL", "ROMULUS IN IMAX AND THE APPLE-JUICE FAST", "One fan is heading to Romulus in IMAX while another turns the night into an Apple Juice Anonymous confession. The chat is not background; it determines which story the hosts tell next."),
    H(4860, 5040, "WWAM UP IN YA", "LEATHERFACE OR WHEN EVIL LURKS AS A ROOMMATE", "A FAM would-you-rather question forces a choice between living with Leatherface and living with the When Evil Lurks household. The answer is less about safety than about which kind of nightmare has rules."),
    H(5040, 5220, "FAN SIGNAL", "FLORIDA SPOOKY EMPIRE CHECK-IN", "Spooky Empire, Spookula, Kentucky, and Scarefest expand the map. The hosts make the convention circuit feel like a real-world branch of the archive, not a list of appearances."),
    H(5220, 5400, "ROOM BREAK", "SEAT SELECTION: THE SIBERIA SCHOOL DESK", "Online seat maps lead to a rant about bad sightlines, late ticket buying, and seats that feel like a school desk in Siberia. The show turns ordinary moviegoing into its own survival story."),
    H(5400, 5580, "STRAIGHT TO STEVE'S ASSHOLE", "THE CROW TICKETS GO ON SALE", "The Crow queue returns and the hosts sharpen the prediction: they expect trouble, but leave room to be surprised. That distinction keeps the roast honest and makes a later rewatch more useful."),
    H(5580, 5760, "WWAM UP IN YA", "THE SPECIES/MAMA JUNE CHOICE", "A fan's impossible choice lands in the room as a crude, surreal thought experiment. The hosts answer quickly, then spend longer explaining why the question itself is broken."),
    H(5760, 5940, "CHARACTER PERFORMANCE", "CHALLIS REOPENS THE TRENCH-COAT OFFICE", "Lee's follow-up message brings the championship belt and Halloween trench-coat lore back around. Dr. Challis turns a fan gift into an entire fictional office protocol.", ["Dr. Challis"]),
    H(5940, 6120, "FAN SIGNAL", "THE NEW-HOUSE GAMING PITCH", "The room returns to a practical idea: Mike and Jay could stream different games from the new setup. It is a genuine future-format discussion disguised as a bit about toilets, boxes, and moving stress."),
    H(6120, 6300, "FILM READ", "ENTRY-LEVEL HORROR IS A CURATED DOOR", "A confusingly worded fan question finally resolves into a useful recommendation lane: Poltergeist, Jaws, Alien, Pumpkinhead, and softer gateways like Goosebumps. The hosts disagree, but explain the intensity ladder."),
    H(6300, 6480, "FILM READ", "THE MIGHTY DUCKS DETOUR", "A ranking request pulls the show out of horror and into The Mighty Ducks. The first film wins, the sequels get a quick order, and the room proves its canon is allowed to wander."),
    H(6480, 6660, "HALLOWEEN LORE", "SINGLE-PLAYER OR BUST", "Back 4 Blood, Evil Dead, Friday the 13th, and Texas Chainsaw Massacre become cautionary examples. The hosts want the Halloween game to work offline, with a proper campaign rather than a multiplayer obligation."),
    H(6660, 6840, "FAN SIGNAL", "ARNOLD, SLY, AND THE FAN DOCUMENTARY RECEIPT", "Two Netflix documentaries about Arnold Schwarzenegger and Sylvester Stallone make both hosts unexpectedly emotional. A joking fan thread becomes a real conversation about bad fathers, resilience, and why a Van Damme film deserves the same treatment."),
    H(6840, 7020, "WWAM UP IN YA", "THE TERRIFIER BUCKET AND PUBLIC FAN STORIES", "Terrifier collectibles lead into stories about being recognized in public, including a Blink concert and a very unfortunate clothing malfunction. The public-life lane is funny because the hosts are laughing at themselves."),
    H(7020, 7134, "CLOSING READ", "ALIEN ROMULUS, TWISTERS, AND THE BIGGEST FAM IN THE ROOM", "The hosts send fans toward the Friday matinee, answer a tornado question, invite the FAM to meet them in person, and sign off on the promise that this new room will keep growing. The final joke is a fake campaign speech for the internet's biggest crowd.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio pass across the August 14, 2024 in-person WWAM livestream",
    evidence: Object.freeze({
      duration: 7134,
      captionWords: 3920,
      captionEvents: 7839,
      captionSpanSeconds: 7134.56,
      captionDurationCoveragePercent: 99.99,
      captionSha256: "01cbf116ea93b2e810a950e27b439703db64de0426b3b6d63cbaaae2c6b93afe1",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio playback spot-check; playback remains the authority",
      audioSha256: "aa43631cf1d9d66db8c32b401ccdbfd9772d700b5a9efaa38e817701b4868a03",
      asrWindowCount: 40,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "WEDNESDAY LIVE // AUGUST 14, 2024",
    badge: "FULL SHOW WIKI // THE FIRST IN-PERSON ROOM, HALLOWEEN GAME DESIGN, AND THE FAM",
    headline: "THE IN-PERSON WWAM RESET: LOOMIS, HALLOWEEN GAMES, AND THE FAM IN THE ROOM",
    deck: "A new-house livestream where a fan salon, Halloween game design meeting, Alien 3 argument, Crow autopsy, and an unexpectedly emotional documentary detour all happen in the same two-hour room.",
    overview: "The August 14 livestream is the moment WWAM stops treating the room as a rectangle on a screen. Jay has moved, the hosts are finally together in person, and every production problem becomes part of the show: hidden hands, a desk fan, moving boxes, a toilet joke, and the question of whether the new house can survive a full Halloween Horror Month. The FAM drives the tape from the opening minutes. Kylie opens a Loomis request, Dean and Mota keep the membership lane moving, a viewer announces a WWAM tattoo, Lee The Machine brings championship-belt lore back into the room, and fans keep pitching the next format: gaming streams, in-person nights, Scarefest, Spooky Empire, and a joint Alien Romulus spoiler show. The film talk is more disciplined than the chaos around it. Alien 3 and Resurrection are separated instead of flattened into a single bad-sequel take; Ripley is treated as a character, not a template; Neil Blomkamp gets a fair hearing; and Fede Alvarez becomes the room's current answer for a director who can make callbacks feel physical. The Halloween game discussion is the tape's hidden mission statement. WWAM wants a detective campaign as a sheriff or Loomis, a survivor mode with Alien Isolation tension, and a second side where Michael becomes playable. That is a better idea than another mascot skin, and the hosts keep returning to it because they mean it. Around that spine are the Crow prediction, a confusing-but-useful entry-level horror ladder, a Mighty Ducks detour, a single-player plea, Arnold and Sly documentaries that unexpectedly make the room emotional, and a public-fan story involving a Blink concert and an uncooperative zipper. The result is not a tidy broadcast. It is a live salon with a movie queue attached, and that is precisely why it belongs in the canon.",
    story: Object.freeze([
      { at: 0, end: 1260, label: "THE NEW HOUSE AND THE FAM ARRIVE TOGETHER", body: "The first in-person setup is immediately physical: a fan request, a desk fan, a new room, a concert story, game talk, and the Apple Juice Anonymous detour establish a room that is still becoming itself." },
      { at: 1260, end: 2700, label: "ALIEN 3, RIPLEY, AND THE HALLOWEEN GAME BRIEF", body: "The hosts argue Alien 3 and Resurrection, then build a Halloween game around a sheriff/Loomis campaign, survivor tension, and a Michael side instead of a shallow skin-swap." },
      { at: 2700, end: 3780, label: "THE CROW QUEUE AND THE IN-PERSON PROMISE", body: "The Crow gets an honest pre-release roast, Lee The Machine brings fan lore into the room, and Halloween Horror Month becomes a promise about future in-person work." },
      { at: 3780, end: 5040, label: "CHARACTER DOORS, IMAX, AND THE FAM'S NIGHTMARE MENU", body: "Loomis, Challis, Slenderman, Alien Romulus, and a Leatherface/When Evil Lurks choice show how the FAM turns a live review into an interactive character salon." },
      { at: 5040, end: 6120, label: "MOVIEGOING, CROW TICKETS, AND A HORROR ON-RAMP", body: "Seats, matinees, Crow expectations, a bizarre would-you-rather, and an entry-level horror question turn ordinary fan logistics into useful archive doors." },
      { at: 6120, end: 6840, label: "FROM MIGHTY DUCKS TO SINGLE-PLAYER HORROR", body: "A sports-movie detour and a documentary conversation sit beside the clearest game-design demand of the night: WWAM wants a campaign that works without a multiplayer lobby." },
      { at: 6840, end: 7134, label: "THE FAM LEAVES THE CHAT AND ENTERS THE WORLD", body: "Terrifier collectibles, public recognition stories, Friday matinee advice, tornado jokes, and the invitation to meet in person close the first new-house chapter." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2160, end: 2520, label: "THE LOOMIS CAMPAIGN", topic: "a Halloween game with a story before the power fantasy", body: "Play from 36:00. The hosts design a sheriff/Loomis investigation and then a Michael mode instead of settling for another mascot skin.", playAt: 2160, playEnd: 2520 }),
      hated: Object.freeze({ at: 2880, end: 3060, label: "THE CROW AS A SOUNDCLOUD RAPPER", topic: "a prediction that is funny because it admits it is only a prediction", body: "Play from 48:00. The hosts roast the unreleased movie's imagined direction while leaving room for the actual film to prove them wrong.", playAt: 2880, playEnd: 3060 }),
      wildestDetour: Object.freeze({ at: 1080, end: 1260, label: "THE MOLDY MUFFIN SEARCH", topic: "a live chat detour that should never have been looked up", body: "Play from 18:00. Game talk, Apple Juice Anonymous, and one gross search turn the room into a tiny unhinged variety show.", playAt: 1080, playEnd: 1260 }),
      lastWord: Object.freeze({ at: 7020, end: 7134, label: "THE NEW HOUSE INVITES THE FAM", topic: "the online room becomes a real-world calendar", body: "Play from 1:57:00. Friday matinees, conventions, in-person nights, and the promise of a bigger Halloween season send the tape out on a genuine invitation.", playAt: 7020, playEnd: 7134 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
