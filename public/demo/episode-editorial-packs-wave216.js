(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "vsTaZbWHdSU";
  var duration = 11079;
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

  /* June 29, 2024: an early-start Saturday room with Jay's haircut, a Twitch
     news ethics discussion, movie and wrestling arguments, pop-punk rankings,
     and a serious Halloween-series pitch in the final hour. */
  var highlights = [
    H(0,180,"ROOM BREAK","THE SIX-O'CLOCK EXPERIMENT","Mike cannot tell whether the microphone works, Jay is late from a haircut, and the room debates whether a six-o'clock start is a brilliant idea or a scheduling crime."),
    H(180,360,"FAM SIGNAL","BLINK-182 TOUR MATH","Cheap restricted-view seats, rotating stages, and a fan's concert plan turn the opening into a mini travel desk for people who would follow Blink around the country."),
    H(360,540,"FAM SIGNAL","THE FASTING CHECK-IN","Mike and Jay compare a 15-hour fast with a previous accidental 27-hour stretch. The bit is funny because neither man sounds qualified to be anyone's wellness guru."),
    H(540,720,"NEWS REACTION","THE CREATOR-PLATFORM ALLEGATIONS","The room discusses allegations involving a major streamer and a platform payout without repeating private sexual claims. The usable read is about consent, platform responsibility, evidence, and why online certainty outruns the record."),
    H(720,900,"NEWS REACTION","WHEN A CAREER BECOMES A PLATFORM LIABILITY","Mike argues that a creator's size should not make them untouchable, while also separating reported facts from screenshots and rumors. It is a rare serious lane in the middle of a filthy live room."),
    H(900,1080,"FAM SIGNAL","THE BONFIRE INVITATION","A fan's bonfire plan, a late-night watch party, and Maxine anticipation become the first community detour. The show is already being written by the chat."),
    H(1080,1260,"ROOM BREAK","THE KENTUCKY HEAT WANTS A VILLAIN","Mike and Jay compare sweat, haircuts, and the kind of summer heat that makes a calm bonfire sound like a horror set."),
    H(1260,1440,"COMMUNITY DOOR","DELIVERY DRIVERS DESERVE THE TIP","A pizza worker's superchat becomes a practical defense of delivery drivers, gas costs, long routes, and the difference between a service fee and an actual tip."),
    H(1440,1620,"LORE DOOR","THE COLORADO MONOLITH COURT","The mysterious desert monoliths get treated as either an art prank or the world's least subtle bedroom decoration. The joke lands because the hosts never pretend the answer is confirmed."),
    H(1620,1800,"NEWS REACTION","THE DEBATE GETS THE FAM VERSION","Biden and Trump debate reactions are summarized as viewer fatigue and media spectacle, not a political endorsement. The room's funniest point is that nobody can quote the exchange without laughing at the format."),
    H(1800,1980,"CHARACTER PERFORMANCE","LOOMIS AND CHALLIS WISH ROMAN A HAPPY BIRTHDAY","A birthday superchat summons both doctors. They offer a deliberately irresponsible horror-doctor greeting, then the room returns to movie talk before the bit becomes the whole clip.",["Dr. Loomis","Dr. Challis"]),
    H(1980,2160,"FILM READ","FIVE NIGHTS AT FREDDY'S GETS A HARD SIX","Mike admits the game adaptation is a glossy disappointment while respecting how much fans wanted it to work. Josh Hutcherson and Matthew Lillard get the small amount of credit the script allows."),
    H(2160,2340,"TRAILER ROOM","DEADPOOL & WOLVERINE DOES NOT OWE THE INTERNET A COLOR-GRADING TRIAL","The new footage is judged on its jokes, Saber-tooth surprise, and theatrical fun. The room rejects the idea that every frame needs a lore dissertation before anyone can laugh."),
    H(2340,2520,"FAM SIGNAL","BRADLEY'S BIRTHDAY GOES TO THE MOON","A birthday shout-out becomes a Mark Wahlberg parody and a new-member welcome. The character bit stays in the safe lane: fake celebrity bravado, not real-world claims."),
    H(2520,2700,"TECHNICAL CHAOS","THE WEBCAM UPGRADE SURVIVES","Jay's new camera no longer looks like a calculator, Mike's computer threatens to become a reactor, and the show proves that better gear still cannot fix a bad angle."),
    H(2700,2880,"FILM READ","THE BEST HORROR MOVIE OF 2024 IS STILL UP FOR GRABS","Abigail, Maxxxine, and the upcoming horror slate become a shared queue rather than a fake definitive ranking."),
    H(2880,3060,"FILM READ","THE SABER-TOOTH / HOBO-MYERS LOOK","The chat notices a bearded Saber-tooth resemblance to the scruffier Michael Myers look. The comparison becomes a useful visual door for the X-Men and Halloween overlap."),
    H(3060,3240,"FAM SIGNAL","THE DISASTER ARTIST REQUEST","A fan asks for The Disaster Artist and gets a practical route: member movie requests can become future commentary assignments rather than disappearing into chat history."),
    H(3240,3420,"LORE DOOR","THE GUITAR SOLO NOBODY ORDERED","Mike plays guitar loudly in the empty house, imagines recreating Back to the Future, and then notices the dog is the only audience member asking for a quieter mix."),
    H(3420,3600,"SOUNDBYTE / REPLAY","THE LOST MASK CASE","A convention mask, a broken Jason mask, a Jeep trunk, and a disputed handoff become the kind of prop-lore mystery that deserves its own WWAM evidence card."),
    H(3600,3780,"FILM READ","X, PEARL, AND MAXXXINE GET THE ORDER WRONG ON PURPOSE","Jay prefers X, Mike gives Pearl credit for performance, and both agree Maxxxine can stand on its own while still rewarding people who know the earlier films."),
    H(3780,3960,"FILM READ","THE 1980S COMEDY MOUNT RUSHMORE","Better Off Dead, Weird Science, Just One of the Guys, Ghostbusters, Beverly Hills Cop, The Breakfast Club, Back to the Future, Lethal Weapon, and The Naked Gun fight for three chairs."),
    H(3960,4140,"STRAIGHT TO STEVE'S ASSHOLE","THE SUPPORT-ROOM DETOUR","A long-running bodily-comedy aside gets interrupted by a fan's UK superchat. Steve's Asshole is the correct lane because the joke is the interruption and the hosts' inability to behave."),
    H(4140,4320,"FILM READ","FRIDAY THE 13TH 2009 GETS ITS FLOWERS","Lee's superchat starts a defense of the 2009 Friday remake, its kills, and the case for treating it as one of the franchise's strongest modern entries."),
    H(4320,4500,"NEWS REACTION","WWE ON NETFLIX NEEDS A NEW STORY ENGINE","The wrestling conversation asks whether a Netflix move should reboot the universe, change the rating, or simply give the writers a reason for viewers to care again."),
    H(4500,4680,"LORE DOOR","THE PAUL HEYMAN / TRIBAL-CHIEF PITCH","The hosts imagine a more serialized WWE with Heyman-level manipulation, a cleaner central story, and fewer random detours. The joke is that even their fake booking has more structure."),
    H(4680,4860,"FILM READ","WCW MOUNT RUSHMORE IS A LANGUAGE TEST","A fan asks for a WCW Mount Rushmore and the hosts struggle to say the acronym without turning it into a Tony Schiavone impression."),
    H(4860,5040,"LORE DOOR","THE SANDLER/CARREY TIER-LIST DOOR OPENS","The room promises a future Jim Carrey and Adam Sandler ranking, adding a comedy-series route to the archive beyond the horror shelves."),
    H(5040,5220,"TRAILER ROOM","GHOSTBUSTERS AND THE 1980S COMEDY ERA","A 4K rewatch and a new Ghostbusters question become a reminder that the best comedy nostalgia is specific: a poster, a line, a room, and a movie people can quote without trying."),
    H(5220,5400,"ROOM BREAK","THE PEE BREAK THAT NEVER HAPPENS","Mike needs the bathroom, Jay needs the bathroom, and neither wants to leave the other alone with the live room. The stand-off is the clip."),
    H(5400,5580,"FAM SIGNAL","THE UK ROOM FINALLY GETS A SIX-O'CLOCK SHOW","Overseas fans explain why the earlier start works. The archive should remember that scheduling is part of the community, not a production footnote."),
    H(5580,5760,"FAM SIGNAL","THE NEW MEMBER EMOTE REQUEST","A fan asks for a Dr. Loomis emote. Mike admits he is still learning what membership emotes are and promises the character layer is coming."),
    H(5760,5940,"GAMING DOOR","ELDEN RING IS A BLOOD-PRESSURE TEST","The hosts explain why Soulslike difficulty is not the right medicine after a doctor's appointment, even if fans swear the games are life-changing."),
    H(5940,6120,"LORE DOOR","POP-PUNK'S BIG TWO AND A HALF","Blink-182 and Green Day are obvious. The room then discovers that naming a fourth major pop-punk act is harder than the question suggests."),
    H(6120,6300,"CHARACTER PERFORMANCE","LOOMIS, TRUMP, AND THE WRONG PRESIDENTIAL JOB","A fan asks for Dr. Loomis to answer a political question. The character lane keeps the joke fictional and makes Loomis sound more exhausted than partisan.",["Dr. Loomis"]),
    H(6300,6480,"LORE DOOR","BATMAN VS DRACULA OR BATMAN VS A WEREWOLF","A comic-book question opens the Elseworlds door. Batman versus Dracula wins the debate because gothic horror gives the hero a real visual problem to solve."),
    H(6480,6660,"TAKE GETS NUCLEAR","HOLLYWOOD IS IN THE COPY-OF-A-COPY ERA","Mike says modern movies still produce great work, but too many releases feel like a reference to a reference instead of a fresh idea."),
    H(6660,6840,"TAKE GETS NUCLEAR","SIX IS NOT AN INSULT","A rating argument turns into a defense of honest middle scores. The hosts would rather call a movie a six than pretend every release is either a masterpiece or a hate crime against cinema."),
    H(6840,7020,"FILM READ","THE FILLER PROBLEM","The room attacks long movies that spend an hour teasing a payoff, burn the setup, and then demand applause for finally arriving at the point."),
    H(7020,7200,"GAMING DOOR","ELDEN RING, DOCTOR'S ORDERS, AND SELF-KNOWLEDGE","Jay has played Souls games; Mike has not. Their shared conclusion is that knowing which game will ruin your evening is a form of wisdom."),
    H(7200,7380,"FILM READ","SLOW BURN ONLY WORKS WHEN IT HAS A REASON","Memento gets held up as a successful slow-burn structure, while generic three-hour art-house filler gets sent straight to Steve's Asshole."),
    H(7380,7560,"MUSIC DOOR","DAVID BOWIE, THE STAR RIDERS, AND THE BIG SOUNDTRACK ARGUMENT","The chat asks for the most important music act in a film, and the room jumps from pop-punk to Bowie and soundtrack memories."),
    H(7560,7740,"FAM SIGNAL","THE ROOM SINGS BARBIE GIRL","A fan requests Dr. Loomis sing a pop song, and the answer becomes a character-receipt idea: the voice is funny because the doctor takes the nonsense seriously."),
    H(7740,7920,"TRAILER ROOM","DEADPOOL & WOLVERINE NEEDS TO BE FUN","The room returns to the upcoming movie's promise: jokes, energy, Saber-tooth, and a night out. The audience is not asking for a ten-year cinematic-universe exam."),
    H(7920,8100,"NEWS REACTION","R-RATED SUCCESS CAN CHANGE THE STUDIO MATH","Joker and other adult comic-book hits become evidence that a mature rating can sell if the movie knows why it is using it."),
    H(8100,8280,"COMMUNITY DOOR","SCAREOKEEE, SCAREFEST, AND THE NEXT MEETUP","The chat plans a Scarefest karaoke event and starts turning online regulars into real-world friends. The community map is part of the show canon."),
    H(8280,8460,"FILM READ","THE EXORCIST TEST","A fan talks about sharing The Exorcist with someone new. Mike says a person who is not rattled by it may be too calm for his social circle."),
    H(8460,8640,"FAM SIGNAL","THE KINDNESS RECEIPT","A member talks about helping his mother and stepfather. The hosts drop the roast and recognize the care as the kind of real-life update a live room should protect."),
    H(8640,8820,"CHARACTER PERFORMANCE","LOOMIS MEETS PAMELA VOORHEES","A fan imagines Dr. Loomis debating Pamela Voorhees. The archive files it as a future crossover prompt, not as a claim that the characters share a canon.",["Dr. Loomis","Pamela Voorhees"]),
    H(8820,9000,"FAM SIGNAL","THE FAM'S COMPLIMENT ENGINE","Lee, Michael Parton, Robin Barker, and the long-time room keep the compliments coming. The hosts admit that online friends sometimes say the nice things their spouses forget."),
    H(9000,9180,"SOUNDBYTE / REPLAY","THE TROUGHS STORY","A childhood fight with Cody, a school trough, and a memory nobody needed becomes a pure WWAM family anecdote. Public copy keeps it as slapstick nostalgia."),
    H(9180,9360,"COMMUNITY DOOR","THE FAST BREAKS ON CAMERA","The fasting discussion returns through a fan food question. The hosts admit the plan is personal, not medical advice, and celebrate getting through the day without pretending to be experts."),
    H(9360,9540,"NEWS REACTION","HALLOWEEN'S STREAMING HOME","The room debates where a future Halloween television project belongs. Netflix and HBO Max are preferred because the show needs a real cultural launch, not a quiet menu tile."),
    H(9540,9720,"NEWS REACTION","PRESUMED INNOCENT DESERVES A BIGGER ROOM","Jake Gyllenhaal's Apple TV series becomes evidence that a strong show can disappear when its platform does not have enough cultural gravity."),
    H(9720,9900,"LORE DOOR","THE HALLOWEEN SERIES CANNOT START WITH ANOTHER BABYSITTER NIGHT","The hosts worry that beginning a television project with the 1978 murders repeats the same setup yet again. A new continuity needs a new doorway."),
    H(9900,10080,"NEWS REACTION","PEACOCK, PARAMOUNT, AND THE RIGHTS MAZE","Streaming rights become a practical problem: the studio can own a movie, a service can hold the old rights, and fans still need one obvious place to watch."),
    H(10080,10260,"LORE DOOR","START WITH A GROWN STEVEN","A fan's proposal—to follow Steven from childhood instead of retelling the babysitter murders—gets serious consideration as a way to open the franchise without erasing its history."),
    H(10260,10440,"TAKE GETS NUCLEAR","CURSE OF MICHAEL MYERS IS THE HARD SELL","The room loves parts of the mythology but admits that a series built around that continuity would ask general viewers to do homework before episode one."),
    H(10440,10620,"LORE DOOR","THE NEW HALLOWEEN FORMULA","Mike's preferred formula is clear: keep Michael, maybe keep Dr. Loomis with the perfect performer, borrow the best ideas from every sequel, and leave the retreads behind."),
    H(10620,10800,"FAM SIGNAL","THE FAM MAKES THE PITCH PERSONAL","Members thank the hosts, ask for the future show to land somewhere meaningful, and remind the room that Halloween fans will follow a good story almost anywhere."),
    H(10800,10980,"COMMUNITY DOOR","TWO WEEKS WITHOUT A CIGARETTE","Mike and Kate's milestone gets celebrated in the final stretch. The room treats it as a real win, not a punchline."),
    H(10980,11079,"CLOSING READ","NO MORE RETREADS, ONE MORE GOODNIGHT","The show closes on a fresh-Halloween argument, gratitude for Lee and Michael Parton, a request to like the video, and one last filthy sign-off that belongs in the archive but not in a corporate brochure.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the June 29, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 43217,
      captionEvents: 10952,
      captionSpanSeconds: 11079.32,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "a716456ebb7259796472a1f8a82b6f3d45dd3ec534bed3595753ad3cefa483c7",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "dbd90a0a6d8ff01c5f17b33a2ebdaa5f036ebbe3ce02b3deb2c463c174dc41c8",
      asrWindowCount: 67,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "SATURDAY LIVE // JUNE 29, 2024",
    badge: "FULL SHOW WIKI // THE FAM, MOVIE ARGUMENTS, WWE, AND THE NEXT HALLOWEEN",
    headline: "A SIX-O'CLOCK START, DEADPOOL'S COLOR-GRADING TRIAL, A LOST MASK, AND THE HALLOWEEN SERIES PITCH",
    deck: "A three-hour Saturday room where creator-platform ethics, FAM birthdays, movie and wrestling debates, pop-punk, and a fresh Halloween continuity plan all share the same microphone.",
    overview: "The June 29 room starts early, hot, and slightly unsure whether the microphone is working. Jay arrives from a haircut, Mike is in the middle of a fast, the FAM compares six o'clock with the usual eight, and Blink-182 concert logistics immediately become part of the canon. The first serious stretch concerns allegations around a giant creator and a platform payout. The hosts keep the public record centered on reported claims, uncertainty, consent, and platform accountability instead of repeating private sexual material. From there, the show becomes the kind of broad WWAM room that cannot be summarized as a list of topics. Delivery-driver tips, mysterious Colorado monoliths, a debate reaction, Dr. Loomis and Dr. Challis birthday performances, Five Nights at Freddy's, Deadpool & Wolverine, Abigail, the X/Pearl/Maxxxine order, and an old convention mask case all get their own turns. The comedy lane is rich: a Back to the Future guitar fantasy, a 1980s comedy Mount Rushmore, a bathroom standoff, a lost prop, and an accidental school-age story that should be filed as family lore rather than a quote card. The second half shifts into the WWAM thesis about modern media. WWE on Netflix needs a story engine. Six is a legitimate movie rating. Slow burn only works when the structure earns it. Pop-punk has two obvious giants and a missing third. The Exorcist remains a friendship test. Then the final hour gets important: the room debates where a new Halloween series should live, whether it should begin with another 1978 retread, whether a grown Steven could open the door, and whether Dr. Loomis belongs in the new continuity. The answer is a clean one—keep the mythology, stop photocopying the first movie, and build forward season by season. The final thank-yous make clear that the FAM is not background noise; it is the reason the room can hold all of this at once.",
    topics: Object.freeze(["Halloween", "Deadpool & Wolverine", "Five Nights at Freddy's", "Maxxxine", "X and Pearl", "WWE on Netflix", "Dr. Loomis", "Dr. Challis", "Pamela Voorhees", "The Exorcist", "Pop-punk", "Blink-182", "The FAM", "Streaming rights", "Creator ethics"]),
    story: Object.freeze([
      { at: 0, end: 1080, label: "THE EARLY ROOM AND THE SERIOUS NEWS", body: "A six-o'clock experiment, Blink tour math, fasting, a haircut, and a careful creator-platform discussion establish the night's unusual mix of silliness and boundaries." },
      { at: 1080, end: 2160, label: "TIPS, MONOLITHS, AND BIRTHDAY DOCTORS", body: "Delivery work, Colorado monoliths, a debate reaction, Dr. Loomis and Dr. Challis, and a hard Five Nights at Freddy's score move the show from news to fandom." },
      { at: 2160, end: 3240, label: "DEADPOOL, SABER-TOOTH, AND THE CHAT", body: "Deadpool & Wolverine gets a color-grading trial, a birthday Mark Wahlberg bit, webcam trouble, The Disaster Artist, and the X-Men/Halloween visual comparison." },
      { at: 3240, end: 4320, label: "MASK LORE AND 1980S COMEDY", body: "A lost convention mask, X/Pearl/Maxxxine, Ghostbusters, Back to the Future, and the comedy Mount Rushmore make nostalgia a usable archive lane." },
      { at: 4320, end: 5400, label: "WWE, WCW, AND THE FAM CLOCK", body: "Friday the 13th 2009, WWE's Netflix move, a Paul Heyman story pitch, WCW language, and the promise of a Sandler/Carrey tier list keep the room moving." },
      { at: 5400, end: 6480, label: "POP-PUNK AND A CHARACTER EMOTE", body: "The bathroom standoff, overseas scheduling, the Loomis emote request, Elden Ring, and a pop-punk big-four argument give the middle stretch a community spine." },
      { at: 6480, end: 7560, label: "THE COPY-OF-A-COPY PROBLEM", body: "Hollywood's filler, six-point reviews, Elden Ring blood pressure, Memento, Bowie, and an original-ideas complaint become the show's craft thesis." },
      { at: 7560, end: 8640, label: "BARBIE GIRL, R-RATED SUCCESS, AND THE EXORCIST", body: "A Loomis singalong, Deadpool's theatrical mission, Joker's rating math, Scarefest karaoke, and The Exorcist as a friendship test bring humor and horror together." },
      { at: 8640, end: 9720, label: "THE FAM BUILDS THE HALLOWEEN PITCH", body: "Kindness receipts, a Loomis/Pamela Voorhees crossover prompt, compliments, and streaming-home arguments turn a franchise question into a community workshop." },
      { at: 9720, end: 11079, label: "START FRESH, KEEP LOOMIS, STOP RETREADING", body: "Netflix versus HBO Max, a grown-Steven proposal, Curse of Michael Myers homework, two weeks without a cigarette, and the season-by-season Halloween formula close the tape." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1800, end: 2340, label: "DEADPOOL'S COLOR-GRADING TRIAL", topic: "the room wants a funny movie, not a lore exam", body: "Play from 30:00. Saber-tooth, a birthday Mark Wahlberg bit, and the demand for theatrical laughs make this the night's most rewatchable fan lane.", playAt: 1800, playEnd: 2340 }),
      hated: Object.freeze({ at: 540, end: 900, label: "THE PLATFORM LIABILITY ARGUMENT", topic: "a giant creator and a payout do not erase the unanswered questions", body: "Play from 9:00. The hosts keep claims, screenshots, platform responsibility, and uncertainty separate instead of turning allegations into a clip-farm verdict.", playAt: 540, playEnd: 900 }),
      wildestDetour: Object.freeze({ at: 3420, end: 3780, label: "THE LOST CONVENTION MASK", topic: "a prop, a Jeep trunk, and a broken Jason mask become lore", body: "Play from 57:00. The old mask case is exactly the kind of tiny, unverifiable memory that deserves a receipt without pretending to be a fact-checkable news story.", playAt: 3420, playEnd: 3780 }),
      lastWord: Object.freeze({ at: 9720, end: 10440, label: "THE GROWN-STEVEN HALLOWEEN PITCH", topic: "start the series with a new doorway", body: "Play from 2:42:00. The room rejects another babysitter-night retread and sketches a forward-moving continuity with Michael and, maybe, Dr. Loomis.", playAt: 9720, playEnd: 10440 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
