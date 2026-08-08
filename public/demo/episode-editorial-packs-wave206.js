(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "nMqej_KyTJA";
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: Math.max(0, Math.round(at)), end: Math.min(9586, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* August 21, 2024: a spoiler-room review of Alien: Romulus that starts with
     the new house, dog poop, and a suspicious neighbor, then finds its center
     in Rook, face huggers, the hybrid, fan-service ethics, and the FAM. */
  var highlights = [
    H(0, 180, "ROOM BREAK", "THE WEIGHT ROOM THAT IS ACTUALLY JAY'S NEW HOUSE", "The show opens with a fake search for the weight room, a late-arrival lecture, and Jay's new apartment. The room is still being assembled, so the first scene is already a WWAM cold open."),
    H(180, 360, "WWAM UP IN YA", "CLUCKERS: THE RESTAURANT THAT SMELLS LIKE A DOCTOR'S OFFICE", "Chicken wings, no windows, chloroform jokes, apple juice, and a tiny Snoop Dogg statue turn a local restaurant into the first full comedy detour."),
    H(360, 540, "STRAIGHT TO STEVE'S ASSHOLE", "SNOOP DOGG, PROFESSIONAL CELEBRITY", "The hosts ask whether Snoop is still a rapper or has become a full-time celebrity-for-hire. It is a ridiculous rant with a clear target: the idea that every brand appearance is automatically cool."),
    H(540, 720, "ROOM BREAK", "THE BLACK CADILLAC NEXT DOOR", "A smoked-out car near the new home becomes a neighborhood mystery, a soundproofing problem, and an excuse to talk about how carefully the new apartment has to be used for a live show."),
    H(720, 900, "FILM READ", "ROMULUS GETS A NINE BEFORE THE SPOILERS START", "The hosts land immediately around a 9/10. They praise the way the movie blends Ridley Scott atmosphere, James Cameron momentum, and Fede Álvarez's own nasty streak."),
    H(900, 1080, "STRAIGHT TO STEVE'S ASSHOLE", "ALIEN FANS WHO WANT EVERYTHING AT ONCE", "The room pushes back on fans who complain that Romulus is too familiar after demanding that the prequels return to the original canon. Their point is simple: disagreement is fine; pretending the audience has one opinion is not."),
    H(1080, 1260, "FAN SIGNAL", "THE FAM'S 86-PERCENT ARGUMENT", "Audience-score talk becomes a defense of subjective taste. The hosts separate a real negative review from the much stranger behavior of calling everyone who enjoyed the film a paid liar."),
    H(1260, 1440, "ROOM BREAK", "THE NEW HOUSE HAS A GHOST—NO, IT HAS A SLEEPWALKER", "A noise in the kitchen turns out to be a sleepwalking trip to the refrigerator. Moving stress, a half-open door, and the fear of a neighbor hearing the show keep the domestic room alive."),
    H(1440, 1620, "ROOM BREAK", "BUSTER, THE SEPARATION-ANXIETY XENOMORPH", "Jay's dog is adjusting to the move, leash training, neighbors, and the new apartment. The hosts turn the dog's anxiety into an Alien metaphor without losing the real concern underneath the joke."),
    H(1620, 1800, "WWAM UP IN YA", "THE GREAT DOG-POOP DEBATE", "For nearly half an hour, the hosts discuss bags, grass, scoops, wind, and the indignity of carrying a tied bag home. It is the kind of deeply gross domestic comedy only this channel would put before a major spoiler review."),
    H(1800, 1980, "FAN SIGNAL", "MEMBERSHIP EMOJIS FAIL IN REAL TIME", "New member emojis—haha, shock, SMH, and bust—do not appear to work the way the hosts expect. Their failed tutorial becomes a live product demonstration with no product competence."),
    H(1980, 2160, "FAN SIGNAL", "SEVENTEEN LONG BOXES OF COMICS", "The room pitches a future FAM episode around Jay's comic collection: seventeen long boxes, value checks, old Avengers material, Ghostbusters toys, and the problem of figuring out what any of it is worth."),
    H(2160, 2340, "CHARACTER PERFORMANCE", "DR. LOOMIS GETS A LOVE SONG REQUEST", "A fan asks Dr. Loomis to sing ‘Right Here Waiting’ to calm Michael. The answer becomes an original fake song and a perfect example of the audience knowing exactly which character door to open.", ["Dr. Loomis"]),
    H(2340, 2520, "ROOM BREAK", "THE THUMB TACK WALL AND THE MOVING-DAY WAR", "Marvel Select figures, thumbtacks, boxes, and a room that looked like Ready Player One's stacks give the new house a physical geography. The set is not backdrop; it is part of the episode's story."),
    H(2520, 2700, "FAN SIGNAL", "THE CROW IS THE NEXT FAM APPOINTMENT", "The hosts promise to see The Crow together and compare notes, while fans ask about Stream, Scarefest, and future in-person work. The next review is born inside this one."),
    H(2700, 2880, "FAN SIGNAL", "SHOOT IT: THE KENTUCKY BASKETBALL RECEIPT", "A fan requests a loud shoutout. The hosts resurrect a famously exasperated basketball-coach clip and turn a tiny Super Chat into a repeatable soundbite lane."),
    H(2880, 3060, "FILM READ", "RIPLEY IS NOT THE ASSIGNMENT", "The hosts like Rain because she is allowed to become a survivor without being rewritten as Ripley. The ensemble gets room to matter, and the film avoids making its lead a copy of Sigourney Weaver."),
    H(3060, 3240, "FILM READ", "ANDY'S STORY IS THE ONE DETOUR TOO MANY", "Andy is praised as an actor and character, but the room thinks the film over-focuses on his chase and AI identity. The criticism is not that he is bad; it is that the movie keeps leaving its strongest horror lane to explain him."),
    H(3240, 3420, "FILM READ", "ROOK IS ASH 2.0 WITH A CGI PROBLEM", "The Rook discussion separates performance from digital likeness. They like the voice, the role in the story, and the Ian Holm connection, while calling the close-up face effect a major visual miss."),
    H(3420, 3600, "STRAIGHT TO STEVE'S ASSHOLE", "THE CLOWN-FACE CLOSEUP", "The hosts compare Rook's distant, shadowed shots to a convincing flea-market toy and the closeups to a bad deepfake. Their ‘Mona Lisa from far away’ idea is the cleanest technical roast in the review."),
    H(3600, 3780, "FILM READ", "ETHICAL CGI NEEDS A FAMILY SIGN-OFF", "The room asks what changes when a dead actor's likeness is used. Their answer stays conditional: permission, family involvement, compensation, and a role that matters are the difference between a respectful nod and a cheap trick."),
    H(3780, 3960, "FILM READ", "THE ROMULUS COLOR PALETTE FEELS LIKE A WARM BLANKET", "Retro computers, practical sets, and the Scott-era corridors are praised as a cozy return to Alien's world. The hosts say the film's best nostalgia is physical, not just a quote or a name."),
    H(3960, 4140, "FILM READ", "HALLOWEEN KILLS WALKED SO ROMULUS COULD RUN", "The hosts compare Romulus's carefully recreated visual language with Halloween Kills's flashback work. The distinction is important: one makes the callback part of the story, the other feels like a forced cameo."),
    H(4140, 4320, "FILM READ", "THE HYBRID IS NIGHTMARE FUEL", "The final creature is described as an Engineer/Xenomorph blend with an uncanny, almost supernatural face. The hosts call it ugly in the exact way a horror movie needs its final monster to be ugly."),
    H(4320, 4500, "SOUNDBYTE / REPLAY", "THE SMILE THAT SHOULD NOT EXIST", "The hybrid's smile gets the room's biggest visceral reaction. It is not just a design complaint; the hosts remember being genuinely unsettled by the way the creature keeps growing into the frame."),
    H(4500, 4680, "FILM READ", "THE ZERO-G ACID-BLOOD FIGHT", "The zero-gravity sequence earns an immediate ‘that was sick.’ Acid blood, movement, and Alien Isolation influence give the action a new physical rule instead of another hallway chase."),
    H(4680, 4860, "FILM READ", "THE JUMP SCARE THEY ACTUALLY EARNED", "A dangling rescue turns into a sudden return attack. The hosts admit they normally dislike jump scares, then credit this one because the film lets the quiet sit long enough for the surprise to work."),
    H(4860, 5040, "STRAIGHT TO STEVE'S ASSHOLE", "WHY ARE THE XENOMORPHS SAVING HER?", "An elevator-shaft moment produces a filthy but useful question about Xenomorph behavior. The room briefly treats the creature like it is negotiating a truce before returning to the movie's actual menace."),
    H(5040, 5220, "FILM READ", "THE FACE-HUGGER CREVICE IS A SPIDER ROOM", "A mass of face huggers moves through a cramped space like a nest of spiders. The hosts call this one of the movie's smartest uses of the creatures because it makes the familiar threat feel newly physical."),
    H(5220, 5400, "FAN SIGNAL", "THE FAM WANTS MORE ANDY", "A question about the future turns Andy into a possible continuing thread. The hosts argue that the film leaves enough room for him to matter without pretending the answer is already written."),
    H(5400, 5580, "FILM READ", "PROMETHEUS AND COVENANT GET A SECOND LIFE", "The hosts say Romulus makes the prequels more interesting by giving their ideas a bridge back to the original films. They do not call the prequels perfect; they call them newly useful pieces of a larger sequence."),
    H(5580, 5760, "STRAIGHT TO STEVE'S ASSHOLE", "THE ALIEN FANBASE WANTS A MENU THAT DOES NOT EXIST", "Romulus is accused of being too much like Alien and Aliens, while Covenant is still rejected for being too different. The hosts turn that contradiction into the night's central fandom joke."),
    H(5760, 5940, "CHARACTER PERFORMANCE", "LOOMIS AND CHALLIS GET A PUBERTY REQUEST", "A fan asks for a birthday shoutout for Jared. The character lane goes wildly off the rails, but the archive keeps it as a fan-request performance rather than pretending it was part of the film review.", ["Dr. Loomis", "Dr. Challis"]),
    H(5940, 6120, "FAN SIGNAL", "MARK HAMILL'S $800 AUTOGRAPH TIER", "A conversation about convention pricing becomes a broader argument about fandom, scarcity, and whether a signature should cost more than the movie collection it is meant to complete."),
    H(6120, 6300, "FILM READ", "WOULD ALIEN VS. PREDATOR EVER BE GREAT?", "A fan proposes a Fede Álvarez and Prey collaboration. The room imagines a James Cameron/Ridley Scott dream project, then admits that crossover movies usually deliver fun before greatness."),
    H(6300, 6480, "FILM READ", "THE QUESTION OF THE NEXT ALVAREZ MOVIE", "The hosts debate whether Álvarez should finish the Prometheus/Covenant thread or continue with Rain and Andy. Their preference is for the director's new characters, not another repair job."),
    H(6480, 6660, "FAN SIGNAL", "BAD MONKEY, BORDERLANDS, AND STUDIO IP FEVER", "Vince Vaughn's Bad Monkey and the Borderlands failure open a studio-industry detour: the hosts argue that executives keep forcing existing brands onto ideas that should have been allowed to stand alone."),
    H(6660, 6840, "WWAM UP IN YA", "THE MEME REEL BEGINS WITH A MOSH PIT", "The promised internet-meme segment starts with aging rockers debating whether they can still mosh. The hosts recognize themselves in the joke: two guys who want the old chaos but now prefer a chair."),
    H(6840, 7020, "SOUNDBYTE / REPLAY", "THE FATHER IS HOME", "A family meme about a dad handling a room full of children becomes an old-school fear receipt about hearing ‘I called your father.’ The hosts turn it into wrestling entrance music and childhood panic."),
    H(7020, 7200, "WWAM UP IN YA", "BUTT OR BOOTS: THE T-REX DECISION", "A meme asks the hosts to choose between an attractive stranger and a dinosaur. The answer is immediate, weirdly sincere, and becomes a perfect low-stakes WWAM soundbite."),
    H(7200, 7380, "ROOM BREAK", "JAY ARRIVES DRUNK FOR CIVIL WAR", "A meme about a partner dragging a day-drinker to an event leads to the real story of Jay sleeping in a car in the driveway before a Civil War screening. The hosts preserve the friendship disaster as a full mini-story."),
    H(7380, 7560, "SOUNDBYTE / REPLAY", "JACK NICHOLSON AFTER THE STREAM", "A meme of Jack Nicholson becomes the visual shorthand for Jay's post-stream regret. Ten beers, a fast, and an in-person broadcast turn into a next-day face that the hosts cannot stop replaying."),
    H(7560, 7740, "FAN SIGNAL", "THE FAM SENDS THE SCARAOKE INVITATION", "The show announces a free-to-attend karaoke night at Pivot Brewing with Scarefest. The FAM is invited out of the chat and into the physical world, which is one of the night's most important connective moments."),
    H(7740, 7920, "WWAM UP IN YA", "THE MAN WHO KNOWS EVERYTHING ABOUT COMICS", "A meme about a Viking-looking comic-shop owner becomes a miniature character study. The hosts love the idea of the guy who can explain every book, every symbol, and every obscure piece of lore."),
    H(7920, 8100, "STRAIGHT TO STEVE'S ASSHOLE", "THE $800 SIGNATURE RECEIPT RETURNS", "The meme reel loops back to Mark Hamill's convention pricing, and the hosts compare it with Michael J. Fox's lower tiers. The take is not anti-fan; it is anti-gouge."),
    H(8100, 8280, "ROOM BREAK", "THE SUPER CHAT WINDOW GOES QUIET", "A sudden lull in Super Chats is mistaken for a cancellation. The hosts sit in awkward silence, then turn the missing messages into another piece of live production comedy."),
    H(8280, 8460, "CHARACTER PERFORMANCE", "LOOMIS GETS THE PROFESSIONAL RESIGNATION", "A fan asks for the most professional way to tell a boss to go away. Dr. Loomis answers with a single devastating sentence, proving the character can work in a modern workplace lane too.", ["Dr. Loomis"]),
    H(8460, 8640, "FAN SIGNAL", "FALL WEATHER, HALLOWEEN, CANDY, AND FOOTBALL", "The FAM starts building the autumn calendar: Halloween marathons, horror candy, football, and the promise of a busy season. The episode closes its movie talk by widening the canon into the community's year."),
    H(8640, 8820, "CLOSING READ", "ROMULUS, RAIN, AND THE NEXT HOUSE STREAM", "The hosts settle on 9/10, praise the hybrid and face-hugger work, and promise that Jay's new house will produce more in-person material. The review becomes a bridge to the next WWAM chapter."),
    H(8820, 9000, "WWAM UP IN YA", "THE LAST MEMES ARE A ROAST OF THE ROOM", "The final reels return to drinking, regrettable public behavior, and the gap between being a person who wants chaos and a person who now needs to be home by dinner."),
    H(9000, 9180, "FAN SIGNAL", "THE FAM WANTS THE CROW NEXT", "Super Chats keep the next review queue alive: The Crow, a possible Saturday stream, and more in-person work all come directly from the audience's questions."),
    H(9180, 9380, "ROOM BREAK", "PIZZA, A BAD JOB, AND THE LAST STUDIO RANT", "A pizza delivery story, a fan asking how to resign professionally, Borderlands, and the industry's obsession with IP make one final lap before the goodbye."),
    H(9380, 9586, "CLOSING READ", "THE SHOW LEAVES WITH SCARAOKE AND A FAM GOODNIGHT", "The hosts thank the FAM, promote the karaoke night, tease The Crow, and sign off with a final music-line joke. The tape ends as a gathering, not a press review."),
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio pass across the August 21, 2024 Alien: Romulus spoiler livestream",
    evidence: Object.freeze({
      duration: 9586,
      captionWords: 4512,
      captionEvents: 9023,
      captionSpanSeconds: 9585.201,
      captionDurationCoveragePercent: 99.99,
      captionSha256: "3b04f2d1fb640b650165f2f583285230fae74d8d94bf2438810fcace3587d46",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio playback spot-check; playback remains the authority",
      audioSha256: "079159615b6d3f20b0d0321a1753fba0f4a8ce72e556f38191b0a761868eca5a",
      asrWindowCount: 48,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WEDNESDAY LIVE // AUGUST 21, 2024",
    badge: "FULL SHOW WIKI // ALIEN: ROMULUS SPOILERS, ROOK, THE FAM, AND THE MEME REEL",
    headline: "ALIEN: ROMULUS: ROOK, ZERO-G ACID, AND THE FAM AFTER DARK",
    deck: "A 9/10 Romulus room that spends its first 25 minutes on dog poop and a new apartment, then gets serious about Rook, face huggers, the hybrid, fandom, and whether Fede Álvarez should keep the keys.",
    overview: "The August 21 Alien: Romulus livestream begins in a fake weight room and ends at Scarefest, with a new house, a dog named Buster, a suspicious black Cadillac, and enough dog-poop logistics to qualify as its own short film. That messy opening is not disposable filler. It establishes the new room, the sound problem, the move, the FAM's membership emojis, and the reason this channel can spend half an hour on a bag of grass-covered disaster before discussing a major spoiler review. When Romulus finally arrives, the hosts are unusually specific. They score it around 9/10, praise the way Fede Álvarez combines Ridley Scott atmosphere with James Cameron momentum, and argue that the movie's best nostalgia is built into the sets, lighting, computers, costumes, and practical creature work. The Rook/Ian Holm conversation separates a useful story role from a bad digital close-up, while the Rain and Andy discussion asks how a new film can honor Ripley without copying her. The hybrid, zero-gravity acid-blood fight, face-hugger crevice, and earned jump scare get their own horror lanes. The room also argues with Alien fans who want both total familiarity and total novelty, then chooses a future: let Álvarez continue with Rain and Andy instead of repairing the unfinished Prometheus/Covenant plan. A Loomis request, a Loomis/Challis puberty shoutout, a convention-price rant, an Alien vs. Predator pitch, a Borderlands studio autopsy, and a meme reel about drinking and Civil War make the second half feel like a complete WWAM night rather than a review add-on. The tape's final promise is the real thesis: Romulus works because its callbacks are part of its world, and WWAM works because its fans are part of the show.",
    story: Object.freeze([
      { at: 0, end: 2160, label: "THE NEW HOUSE HAS A DOG-POOP COLD OPEN", body: "A fake weight-room entrance, Snoop Dogg, a black Cadillac, moving boxes, Buster's separation anxiety, and a long fight with a dog bag establish the new physical room before the movie talk begins." },
      { at: 2160, end: 3240, label: "ROMULUS GETS THE 9/10 ROOM", body: "The hosts defend the movie's atmosphere, ensemble, and fan-service strategy while explaining why Rain is not meant to be Ripley and why the young cast fits the slasher lineage." },
      { at: 3240, end: 4140, label: "ROOK IS ASH 2.0 FROM FAR AWAY", body: "The Rook/Ian Holm discussion praises the performance and story function while sending the close-up CGI to Steve's Asshole. Permission, likeness, and ethical family sign-off become part of the read." },
      { at: 4140, end: 5760, label: "THE HYBRID, ZERO-G, AND THE FACE-HUGGER ROOM", body: "The final creature, its smile, the acid-blood sequence, the jump scare, the face-hugger crevice, and the Andy debate form the review's strongest horror spine." },
      { at: 5760, end: 6660, label: "THE FAM ARGUES ABOUT CANON", body: "Loomis and Challis requests sit beside debates about Prometheus, Covenant, Alien vs. Predator, true fandom, and the impossible menu the fanbase keeps demanding." },
      { at: 6660, end: 7560, label: "THE MEME REEL LEAVES THE THEATER", body: "Mosh pits, fathers coming home, T-Rex choices, a drunk Civil War driveway, and Jack Nicholson after the stream turn internet clips into a friendship dossier." },
      { at: 7560, end: 8640, label: "THE FAM BUILDS AUTUMN", body: "Scaraoke, Mark Hamill's autograph tiers, a comic-shop Viking, a quiet Super Chat window, and a Loomis workplace answer make the community visible after the review." },
      { at: 8640, end: 9586, label: "ROMULUS LEAVES THE KEYS WITH ALVAREZ", body: "The final score, Borderlands studio rant, pizza, the Crow queue, and the Scarefest goodbye turn the spoiler room into a next-season handoff." },
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 4500, end: 4680, label: "ZERO-G ACID BLOOD", topic: "the action sequence with a new physical rule", body: "Play from 1:15:00. The hosts explain why the zero-gravity fight feels like a genuine Romulus invention instead of a callback.", playAt: 4500, playEnd: 4680 }),
      hated: Object.freeze({ at: 3240, end: 3420, label: "ROUK'S CLOSE-UP CGI", topic: "a useful character trapped inside a bad digital face", body: "Play from 54:00. The hosts separate Ian Holm's performance and the character's story role from the visual effect that breaks the spell.", playAt: 3240, playEnd: 3420 }),
      wildestDetour: Object.freeze({ at: 1620, end: 1800, label: "THE DOG-POOP EPIC", topic: "twenty-five minutes of bags, wind, and grass", body: "Play from 27:00. Before the spoilers, the room turns leash training into a full domestic comedy special.", playAt: 1620, playEnd: 1800 }),
      lastWord: Object.freeze({ at: 7560, end: 7740, label: "SCARAOKE LEAVES THE SCREEN", topic: "the FAM gets a real-world invitation", body: "Play from 2:06:00. The hosts invite viewers to Pivot Brewing and make the community part of the next chapter.", playAt: 7560, playEnd: 7740 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
