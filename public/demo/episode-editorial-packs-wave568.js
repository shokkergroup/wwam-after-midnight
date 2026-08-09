(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "gQNzfiQU1M4";
  var duration = 10825;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 1050, "WWAM FAM MEMORY", "THE SHIRT IS BACKWARDS, CRACKER BARREL IS EVERYWHERE, AND THE FAM RETURNS FROM THE LAST STREAM", "The show opens with a backwards-shirt joke, a cracker-barrel rant, and the hosts checking on absent FAM members before admitting that the previous stream's technical hiccups may never be explained."),
    H(1050, 1800, "CHANNEL LORE", "VOICE-ACTOR TWITCH ROOMS, TOILET WATER, AND A GAS-STATION FORMALDEHYDE STORY", "A detour into long-form Twitch rooms and voice-actor narration gives way to a gas-station drink disaster, a demand for a Waffle House gift card, and the smell of bottled formaldehyde."),
    H(1800, 2300, "WWAM UP IN YA", "THE ANDY MATIChAK HAIR JOKE, A JOKER LAUGH, AND MIKE'S BATMAN TURN", "Mike explains the hairstyle the FAM roasted after the Andy Matichak interview, then a camera angle turns a Joker laugh and a serious Batman stare into an accidental character clip."),
    H(2300, 2980, "SNYDER CUT", "WARNER BROS, CORPORATE BENDING, AND THE VISION THAT GOT REPLACED", "The Snyder Cut conversation becomes a studio-autopsy: Snyder refused to flatter the corporation, the replacement cut ignored his finished vision, and the audience's HBO Max support may decide whether the door opens again."),
    H(2980, 3520, "SUPERHERO CASTING", "HUGH JACKMAN VERSUS ROBERT DOWNEY JR., CYCLOPS RESPECT, AND CAPTAIN BRITAIN", "The hosts pick Hugh Jackman over Robert Downey Jr. for a long-running return, defend James Marsden as Cyclops, and consider Henry Cavill as Captain Britain."),
    H(3520, 4100, "SUPERHERO CASTING", "KEANU REEVES AS GAMBIT, GHOSTBUSTERS STILLS, AND THE PINHEAD BOX", "Keanu Reeves as Gambit becomes a surprisingly strong idea, while Donna's Ghostbusters animation stills and the Lemarchand box in the corner turn the camera setup into a tiny prop museum."),
    H(4100, 4700, "HORROR ICON LAB", "KANE HODDER, THE REMAKE JASON, AND THE VAMPIRE LADY WHO SHOULD NOT BE FLIRTED WITH", "The favorite Jason conversation separates Kane Hodder's legacy from the remake's land-living, non-supernatural killer, then a giant vampire lady turns the horror lane into a chest-first thirst trap."),
    H(4280, 4900, "MOVIE NEWS", "CHRISTOPHER NOLAN'S TEENAGE MUTANT NINJA TURTLES TRILOGY", "A FAM question pitches a Dark Knight-style TMNT trilogy. The booth says it could work if Nolan brings scale and discipline without sanding off the strange comic-book bones."),
    H(4350, 5050, "MORTAL KOMBAT", "THE FAN-CAST IS PERFECT, THE WEBSITE IS NEW, AND THE TRAILER ERA BECOMES A HOME BASE", "The hosts revisit a fan-cast of the Mortal Kombat characters, unveil the faster new WeWatchedAMovie.com, and frame the redesign as a real channel upgrade instead of a cosmetic flex."),
    H(5050, 6200, "HALLOWEEN KILLS", "VOD, COVID PROTOCOLS, AND WHY THE MOVIE'S RELEASE DATE IS A PEOPLE PROBLEM", "The Kills discussion is less about rumor than logistics: theaters, VOD, crew jobs, actors, protocols, and the question of how to release a movie without treating the people who made it as disposable."),
    H(6050, 6300, "CHARACTER CANON", "SLENDERMAN DOES SIR MIX-A-LOT AND GANGSTA'S PARADISE FOR SEVEN DOLLARS", "Gypsy Warrior asks for two songs in character. The booth turns the request into a compressed Slenderman performance and jokes about the impossible workload of seven dollars worth of bits."),
    H(6200, 7320, "MORTAL KOMBAT LORE", "THE HORROR-ICON FIGHTING GAME, LICENSING HELL, AND BLAKE'S SERIOUS SUPER CHAT", "The show weighs a fan-made game with Chucky, Freddy, Pinhead, and Jason against the licensing wall, then pauses for Blake Corley's message about his father's cancer and answers with genuine care."),
    H(7320, 8100, "WWAM UP IN YA", "THE GOLDEN MONKEY, SOUR DRINKS, AND A CRACKER-BARBERSHOP SPORTS ARGUMENT", "A beer-and-sour-drink detour, a Golden Monkey hangover, NASCAR and Jeff Gordon chatter, Tom and Jerry nightmare logic, and a pee break make the mid-show room feel like an unfiltered bar conversation."),
    H(8100, 8750, "BATHROOM MOVIE CANON", "AUSTIN POWERS, CASINO ROYALE, AND THE TOILET SCENE THAT MAKES THE EYES BULGE", "The bathroom-movie bracket moves through Austin Powers, Casino Royale, The Matrix, Reservoir Dogs, and the most upsetting toilet choking scene in the room's memory."),
    H(8750, 9550, "BATHROOM MOVIE CANON", "AMERICAN PSYCHO, FULL METAL JACKET, DUMB AND DUMBER, AND WEIRD SCIENCE", "The hosts build a rapid-fire bathroom canon: Patrick Bateman's tapes, Full Metal Jacket's terror, Jeff Daniels' X-Lax disaster, Sea Bass, and Weird Science's air biscuit."),
    H(9550, 10250, "WWAM UP IN YA", "CRYSTAL, A URINAL TURD, AND THE BATHROOM HEIST THAT BECAME OCEAN'S ELEVEN", "A real road-trip emergency becomes a story about eating lunch in a Crystal bathroom, leaving a turd behind, public-bathroom sex, and a failed solo Ocean's Eleven operation at Walmart."),
    H(10250, 10825, "WWAM FAM MEMORY", "KEANU'S CONSTANTINE CORRECTION, A CANCER RECEIPT, AND THE FINAL THANK-YOU", "The closing FAM receipts correct the Keanu/Constantine claim, support Blake, debate Gambit again, and leave the audience with the channel's familiar promise: more weird movie rooms are coming."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 2300, label: "THE CHANNEL IS A WORKING ROOM, NOT A PRESS RELEASE", body: "A backwards shirt, cracker-barrel fatigue, voice-actor Twitch rooms, a gas-station formaldehyde story, and an Andy Matichak hairstyle joke establish the tape's register. Then a camera angle accidentally creates a Joker/Batman character clip. The archive should preserve this because it explains how WWAM's public persona is built: bad equipment, very good timing, and an audience that knows when a throwaway face turn is actually a bit.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 2300, end: 5050, label: "THE SUPERHERO NEWS LANE KEEPS ASKING WHO GETS TO OWN A CHARACTER", body: "Snyder Cut corporate resentment, Hugh Jackman versus Robert Downey Jr., James Marsden's Cyclops, Henry Cavill's Captain Britain, Keanu's Gambit, a possible Nolan TMNT trilogy, Mortal Kombat fan-casting, and a redesigned website all orbit one question: what happens when a studio or a performer understands the character and when they do not? The answers are rude, specific, and surprisingly consistent. The room wants ambition with a point of view.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5050, end: 7320, label: "HALLOWEEN KILLS IS A RELEASE-ETHICS CONVERSATION, THEN THE FAM TURNS IT INTO A CHARACTER SHOW", body: "The Kills update is grounded in theater versus VOD, COVID protocols, crew jobs, actors, and the responsibility to let a movie reach people without pretending production is frictionless. Gypsy Warrior's Slenderman request then blows the serious tone apart, and the fan-made horror-icon fighting-game conversation runs into licensing reality. Blake Corley's cancer message is the moment the room stops performing and answers a person directly.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 7320, end: 10250, label: "THE BATHROOM MOVIE CANON IS ALSO A SHOW ABOUT FRIENDSHIP AND SURVIVAL", body: "Beer, sour drinks, NASCAR, Tom and Jerry nightmare logic, Crystal road-trip emergencies, public bathroom sex, a urinal turd, and a Walmart Ocean's Eleven attempt become a full secondary canon. The movie lane includes Austin Powers, Casino Royale, The Matrix, Reservoir Dogs, American Psycho, Full Metal Jacket, Dumb and Dumber, and Weird Science. The useful editorial distinction is that these are not random gross-out clips; they are stories the hosts use to explain why a scene sticks in memory.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 10250, end: 10825, label: "THE EXIT IS A RECEIPT, NOT A BUTTON", body: "The tape closes by correcting the Keanu/Constantine point, circling back to Gambit, thanking Blake and the FAM, and promising more movie rooms. The episode is valuable because its structures are visible: channel infrastructure, franchise ethics, character play, fan memory, and the sort of bathroom story that becomes a permanent WWAM quote.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 3h00m25s Halloween Kills and Mortal Kombat updates stream; local audio, canonical captions, and Whisper ledger checked across the technical opening, Twitch/voice-actor detour, gas-station formaldehyde story, Andy Matichak hair/Joker bit, Snyder Cut corporate argument, superhero casting, Keanu Gambit, TMNT pitch, Mortal Kombat fan-cast, new website launch, Halloween Kills release ethics, Slenderman song request, horror-icon fighting-game licensing, Blake Corley support, beer/Golden Monkey, bathroom movie canon, Crystal and urinal stories, and the final FAM close",
    evidence: Object.freeze({
      duration: 10825,
      captionWords: 37928,
      captionEvents: 11395,
      captionSpanSeconds: 10825.84,
      captionDurationCoveragePercent: 100,
      captionSha256: "7C88B27287F16BF20A018D65F019D2ED0E707DD3FFB11D3FC41AC6B16CD019E7",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "BC62F3CFE0DE0222584F5B2CBD4787F005D8F6FB26F8B19EA49EBEFBD4B700E5",
      asrSegmentCount: 562,
      asrSha256: "sha256:ebb68f53f12251200f9c68c82bd76a7647d4fae29ab42f912a7edd6c69eba06f",
      asrCoverageStartSeconds: 747,
      asrCoverageEndSeconds: 10707.42,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "HALLOWEEN KILLS + MORTAL KOMBAT UPDATES // MOVIE NEWS LIVE",
    badge: "FULL SHOW WIKI // SNYDER, GAMBIt, SLENDERMAN, HALLOWEEN KILLS, AND BATHROOM MOVIES",
    headline: "THE FAM GETS A NEW WEBSITE, HALLOWEEN KILLS GETS A RELEASE ETHICS CHECK, AND THE BATHROOM CANON TAKES OVER",
    deck: "A full-audio movie-news read: Snyder, Gambit, Mortal Kombat, Halloween Kills, a Slenderman song request, and an unexpectedly encyclopedic bathroom-movie bracket.",
    overview: "This three-hour WWAM stream is a bridge between channel infrastructure and movie lore. It opens with the FAM checking a backwards shirt, cracker-barrel fatigue, missing members, and another unexplained technical hiccup. A voice-actor Twitch tangent and a gas-station formaldehyde story establish the tone before the Andy Matichak hairstyle becomes a Joker/Batman camera bit. The Snyder Cut section is not just fandom: it is a corporate argument about a director's vision, a studio that replaced it, HBO Max, and whether money can reopen the door. Hugh Jackman versus Robert Downey Jr., James Marsden as Cyclops, Henry Cavill as Captain Britain, Keanu Reeves as Gambit, a Christopher Nolan TMNT trilogy, a Mortal Kombat fan-cast, and the new WeWatchedAMovie.com all ask who gets to own a character and how much ambition a studio will tolerate. Halloween Kills is discussed through release timing, VOD, theaters, COVID protocols, crew jobs, and the responsibility to people making the film. Gypsy Warrior then requests Slenderman doing Sir Mix-a-Lot and Gangsta's Paradise, the horror-icon fighting-game pitch runs into licensing, and Blake Corley receives a sincere response after sharing his father's cancer diagnosis. The final third becomes a bathroom-movie canon: Austin Powers, Casino Royale, The Matrix, Reservoir Dogs, American Psycho, Full Metal Jacket, Dumb and Dumber, Weird Science, a Crystal road-trip emergency, a urinal turd, public bathroom sex, and a failed Walmart Ocean's Eleven. The show closes by correcting the Constantine point and thanking the FAM. Local audio and ASR establish every route; playback remains the authority.",
    topics: Object.freeze(["Halloween Kills", "Mortal Kombat", "Snyder Cut", "Zack Snyder", "Hugh Jackman", "Robert Downey Jr.", "James Marsden", "Keanu Reeves", "Gambit", "Teenage Mutant Ninja Turtles", "Slenderman", "Dr. Loomis", "bathroom movies", "American Psycho", "Dumb and Dumber", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2300, end: 2980, label: "THE SNYDER CUT CORPORATE AUTOPSY", topic: "Director vision", body: "Play the Snyder section for the clearest explanation of why the hosts see the release as a fight over authorship, not only a superhero cut.", playAt: 2300, playEnd: 2980 }),
      hated: Object.freeze({ at: 1050, end: 1800, label: "THE FORMALDEHYDE DRINK", topic: "WWAM Up in Ya", body: "Play the gas-station story for the most concentrated disgust receipt before the movie-news lane takes over.", playAt: 1050, playEnd: 1800 }),
      wildestDetour: Object.freeze({ at: 9550, end: 10250, label: "THE URINAL TURD OCEAN'S ELEVEN", topic: "Bathroom movie canon", body: "Play the Crystal, urinal, public-bathroom, and Walmart-heist run for the episode's most deranged real-life detour.", playAt: 9550, playEnd: 10250 }),
      lastWord: Object.freeze({ at: 10250, end: 10825, label: "THE CONSTANTINE CORRECTION", topic: "FAM continuity", body: "Play the final receipts for the Keanu correction, Blake's support moment, and the promise of more movie rooms.", playAt: 10250, playEnd: 10825 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 820, end: 860, name: "Kayla", kind: "chat receipt", note: "Is greeted as a returning FAM member while the hosts joke about knowing what she is wearing." },
        { at: 1700, end: 1760, name: "Jason Dyer", kind: "chat receipt", note: "Compliments the interviews and the entertainment, then receives a whiskey-and-pizza-bites riff." },
        { at: 2350, end: 2400, name: "Donna M.", kind: "chat receipt", note: "Says she is mad at Jay without a reason and later praises the new camera angle." },
        { at: 2450, end: 2510, name: "Church Jackson", kind: "Super Chat", note: "Asks where the Ghostbusters animation stills are hanging; Jay points to the set wall." },
        { at: 3100, end: 3150, name: "Gary Catlow", kind: "chat receipt", note: "Adds the Captain Britain casting question to the superhero lane." },
        { at: 3460, end: 3520, name: "Casey Martinez", kind: "chat receipt", note: "Suggests Keanu Reeves as Gambit, which the booth calls an unusually sensible idea." },
        { at: 4040, end: 4080, name: "Donna M.", kind: "chat receipt", note: "Approves the new angle and gets a Lemarchand-box comparison." },
        { at: 4140, end: 4200, name: "Gabriel R. Johnson III", kind: "Super Chat", note: "Pitches a Christopher Nolan TMNT trilogy with Dark Knight-scale treatment." },
        { at: 4260, end: 4320, name: "Nicholas Weir", kind: "Super Chat", note: "Drops the Euro Trip quote '15 bucks, little man' into the Mortal Kombat lane." },
        { at: 6100, end: 6150, name: "Gypsy Warrior", kind: "Super Chat", note: "Requests Slenderman doing Sir Mix-a-Lot and Gangsta's Paradise; the booth performs a compressed version." },
        { at: 7130, end: 7210, name: "Blake Corley", kind: "Super Chat", note: "Shares that his father has cancer; the booth pauses the bit and responds with genuine sympathy." },
        { at: 8050, end: 8100, name: "Bruce Smith", kind: "chat receipt", note: "Adds a Packers/Buckeyes sports complaint during the bathroom-movie transition." },
        { at: 9160, end: 9210, name: "Benjamin Loy", kind: "Super Chat", note: "Complains that he paid and his comment was missed; the booth acknowledges the receipt." },
        { at: 10160, end: 10220, name: "Vinny", kind: "chat receipt", note: "Supplies Weird Science bathroom-scene memories including the air biscuit." },
        { at: 10670, end: 10725, name: "Benjamin Loy", kind: "Super Chat", note: "Adds American History X to the bathroom-scene canon; the booth agrees it belongs near the top." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
