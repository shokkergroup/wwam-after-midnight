(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "cAso0PcYGbQ", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
  };

  /* January 16, 2025: Monkey trailer, Until Dawn, Scream 7 casting, and John Carpenter tier list. */
  sources["cAso0PcYGbQ"] = Object.freeze({
    sourceId: "cAso0PcYGbQ",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; complete caption ledger and local audio windows across the January 16, 2025 horror/action movie-news room",
    evidence: Object.freeze({
      duration: 7267,
      captionWords: 24720,
      captionEvents: 3328,
      captionSpanSeconds: 7268.84,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:6dd2f9252a61fa93d9a9fae2572f9e6a42c6ec729ecef2bddf9e09fb3f920be0",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:6f206a12b833b83b5461a86769962f770909c049e8a1648c73b2a010fcb969f1",
      asrWindowCount: 33,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE MONKEY IS OUT, JOHN CARPENTER GETS A SHIT-TIER FOG, AND THE WOLF MAN STILL HAS NO NARDS // JANUARY 16, 2025",
    badge: "FULL SHOW WIKI // 2:01:07 OF SWAT-TEAM BANTER, SCREAM 7 CASTING, UNTIL DAWN MONSTERS, CARPENTER RANKINGS, AND SUPER BOWL BEEF",
    headline: "THE MONKEY TRAILER LANDS; THE FOG GETS SENT TO HELL; JOHN CARPENTER STILL WINS THE TIER LIST",
    deck: "A chaotic noon show where a jail story becomes a recording glitch, Scream 7 gets Joel McHale, Until Dawn turns choice-based horror into a time-loop movie, and Carpenter's classics are ranked with zero respect for sacred cows.",
    overview: "The January 16 WWAM Video opens with an alleged jail bailout, a recording interface that makes everybody look like Voodoo diapers, and a promise that the stream is top-notch while the internet actively disagrees. The first real headline is the Monkey trailer. Oz Perkins adapting a Stephen King short story gets the room's attention, especially once the wind-up toy starts turning family history into a murder machine. The Scream 7 lane arrives with the strangest casting news of the day: Joel McHale as Sidney's husband, while the room wonders why Patrick Dempsey's rumored return still has not been announced. Until Dawn gets a more generous breakdown. The hosts like the idea of a choice-based game becoming a time-loop horror movie where different deaths and subgenres can play out across repeated nights, and they are excited by David Sandberg's creature work, the giant Sasquatch-like monster, and the possibility that the effects are practical rather than trailer-dark CGI. The chat adds Alien: Earth, John Carpenter's birthday, and a brutally honest rewatch debate. Carpenter's tier list is the episode's core: In the Mouth of Madness gets defended as a weird Stephen King-adjacent nightmare, Prince of Darkness lands in the upper tier, The Fog gets called boring and overrated, Christine smells like Cheetos through the screen, and Escape from L.A. survives on attitude, dated effects, and Snake Plissken's refusal to die politely. The room is not hating Carpenter; it is explaining why even a favorite director can make movies with one perfect scene and three broken pieces. The final hour moves to a Super Bowl poll, Aaron Rodgers joining Tennessee, a question about prosthetics versus motion capture, and a roast of Deion Sanders' coaching style. Internet and sound issues remain part of the show, but the sign-off promises another Wolf Man conversation and an Instagram simulcast experiment. It is a perfect WWAM noon stream: current trailer news, a full director canon argument, audience voting, crude detours, and enough technical failure to become part of the joke.",
    story: Object.freeze([
      { at: 0, end: 600, label: "THE JAILHOUSE STORY AND THE VOODOO-DIAPER STREAM", body: "The opening claims a jail bailout, then immediately collapses into recording errors, internet blame, and an audience-facing promise that everything is top quality while the camera disagrees." },
      { at: 600, end: 1200, label: "THE MONKEY TRAILER AND SCREAM 7'S JOEL MCHALE CURVE BALL", body: "The Monkey trailer arrives from Oz Perkins and Stephen King, while Scream 7 apparently casts Joel McHale as Sidney's husband and leaves Patrick Dempsey's rumored return in limbo." },
      { at: 1200, end: 1800, label: "A WIND-UP TOY, A CORONER, AND A VERY BAD CHILDHOOD MEMORY", body: "The trailer's monkey, fire, and family history get a proper reaction. The room likes the premise because the toy is not just a jump-scare prop; it is a mechanism for escalating old damage." },
      { at: 1800, end: 2400, label: "WOLF MAN DOUBTS AND THE UNTIL DAWN MONSTER DOOR", body: "Wolf Man remains a maybe, while Until Dawn opens a more hopeful lane: a choice-based game transformed into a movie where the cast can die, reset, and face a different horror grammar each time." },
      { at: 2400, end: 3000, label: "THE BIG ROCK MONSTER AND THE DAVID SANDBERG BET", body: "The hosts praise the giant creature glimpsed in the trailer, argue that its makeup looks physical, and explain why Pony Smasher's involvement makes the movie's darkness feel less suspicious." },
      { at: 3000, end: 3600, label: "WINDIGO JOKES, ALIEN: EARTH, AND JOHN CARPENTER'S BIRTHDAY", body: "A filthy tongue joke interrupts a real Alien: Earth update, then the room remembers that John Carpenter's birthday is the excuse to rank his entire horror moodboard." },
      { at: 3600, end: 4200, label: "IN THE MOUTH OF MADNESS GOES TO THE WEIRD PLACE", body: "The Carpenter board starts with In the Mouth of Madness and Prince of Darkness. Both films get credit for enormous ideas, broken edges, and the strange character those flaws give them." },
      { at: 4200, end: 4800, label: "THE THING, THE FOG, AND A VERY UNHOLY REWATCH", body: "The Thing's remake conversation turns into a defense of updated action, while The Fog gets sent to the bottom because the setup is great and the movie never pays the room back." },
      { at: 4800, end: 5400, label: "CHRISTINE, ESCAPE FROM L.A., AND THE CAR THAT WANTS TO BE LOVED", body: "Christine is judged as a cool mood with a possessed-car premise that never quite scares them. Escape from L.A. survives on Snake's attitude, dated weirdness, and a fan poll that agrees." },
      { at: 5400, end: 6000, label: "SNAKE, EAGLES, CHIEFS, AND THE CARPENTER BALLOT", body: "The tier list closes with a balanced Carpenter canon, then the chat jumps to the Super Bowl and a vote where nobody wants the Eagles or Chiefs for the same reasons." },
      { at: 6000, end: 6600, label: "RODGERS, PROSTHETICS, AND THE DEION SANDERS COURT", body: "Aaron Rodgers' Tennessee move, practical-effects work, motion-capture insecurity, and a harsh Deion Sanders coaching critique fill the final news pocket." },
      { at: 6600, end: 7200, label: "THE FAT-ROLL BOSS FIGHT AND THE INTERNET SIGN-OFF", body: "The hosts choose prosthetics over motion capture, joke about playing with balls, promise to fix the stream, and close with a Wolf Man return and a possible YouTube/Instagram simulcast." },
      { at: 7200, end: 7267, label: "ONE LAST WORKDAY INSULT", body: "The show remembers it is Thursday, not Friday, and sends the audience back to work with the exact affectionate abuse the room has earned." },
    ]),
    highlights: Object.freeze([
      H(28, 44, "WWAM UP IN YA", "JAIL BAILOUT, NO QUESTIONS ASKED", "The opening story claims somebody had to be collected from jail before the stream, then refuses to provide a version fit for court."),
      H(164, 180, "ROOM BREAK", "VOODOO DIAPERS ON CAMERA", "The recording glitch makes the hosts look like haunted laundry while they insist the internet is not the problem."),
      H(392, 408, "STRAIGHT TO STEVE'S ASSHOLE", "SELLING THE HIGH SEAS", "A vague admission about the previous night's activities becomes a perfect example of WWAM's inability to leave a technical problem alone."),
      H(702, 718, "FAN SIGNAL", "THE MONKEY TRAILER IS FINALLY OUT", "The room stops the intro to watch the Stephen King/Oz Perkins trailer the audience has been waiting for."),
      H(824, 840, "TAKE GETS NUCLEAR", "JOEL MCHALE AS SIDNEY'S HUSBAND", "Scream 7 casting news turns into a serious question: why him, and why is Patrick Dempsey still only a rumor?"),
      H(992, 1008, "DEEP DIVE", "THE MONKEY IS A MURDER MACHINE", "The wind-up toy is treated as a story engine, not a cheap prop, and the room likes that the family history is part of the horror."),
      H(1168, 1184, "WWAM UP IN YA", "THE MONKEY TRAILER KILLS THE CHILDHOOD", "A cherished toy is reclassified as a portable curse, which is exactly the kind of childhood memory this show wants to ruin."),
      H(1298, 1314, "FAN SIGNAL", "WOLF MAN CINEMA DECISION", "The chat asks whether the Wolf Man is worth a theater trip, forcing the room to separate the trailer from the reviews already leaking out."),
      H(1518, 1534, "TAKE GETS NUCLEAR", "JAY'S WOLF MAN MAYBE", "The movie remains in the dangerous zone between a theatrical watch and a night spent hearing the full review from the couch."),
      H(1804, 1820, "DEEP DIVE", "UNTIL DAWN HAS A SMART RESET BUTTON", "The choice-based game's live-or-die structure is converted into a time-loop movie where every run can change the horror language."),
      H(2048, 2064, "FAN SIGNAL", "THE GIANT SASQUATCH CLOUD", "A chat description of the huge creature becomes the visual door that makes the Until Dawn trailer feel like a real movie rather than game footage."),
      H(2248, 2264, "TAKE GETS NUCLEAR", "THE MONSTER LOOKS PRACTICAL", "The creature work gets a rare compliment: the darkness may be hiding the design because the studio wants the reveal, not because the effects are embarrassing."),
      H(2466, 2482, "DEEP DIVE", "DAVID SANDBERG GETS THE BET", "The room trusts Sandberg to stage monster variety and repeated deaths, especially with the director's earlier horror instincts in the background."),
      H(2678, 2694, "STRAIGHT TO STEVE'S ASSHOLE", "THE WINDIGO TONGUE TORANDO", "A real Native-monster discussion is hijacked by a bedroom tongue joke that should never be used in a mythology lecture."),
      H(2872, 2888, "FAN SIGNAL", "ALIEN: EARTH HAS A WET XENOMORPH", "The chat brings up Disney's Alien: Earth and the room latches onto the wet creature design and Timothy Olyphant's synth."),
      H(3088, 3104, "COMMUNITY MEMORY", "JOHN CARPENTER'S BIRTHDAY DESK", "The stream turns a birthday shout-out into a full Carpenter rewatch board, with the audience deciding where the classics really belong."),
      H(3298, 3314, "RANKING / LIST", "IN THE MOUTH OF MADNESS IS WEIRDLY KING", "The movie gets credit for feeling like a Stephen King story even though it is not one, because the pages, the author, and the reality collapse are exactly the right kind of nasty."),
      H(3510, 3526, "TAKE GETS NUCLEAR", "PRINCE OF DARKNESS IS AN ALL-TIMER", "The chat and the hosts both keep the Carpenter film high because its strange little broken pieces are part of its character."),
      H(3718, 3734, "DEEP DIVE", "THE THING STILL OWNS THE ROOM", "The remake comparison gives the newer version a fair defense for practical violence, faster action, and the ability to exist beside the original."),
      H(3918, 3934, "STRAIGHT TO STEVE'S ASSHOLE", "THE FOG IS BORING AS FUCK", "A favorite director's sacred cow gets dragged: great setup, lovely mood, and not enough movie to justify the worship."),
      H(4128, 4144, "FAN SIGNAL", "THE CHAT VOTES ON THE FOG", "The audience gets a chance to rescue or condemn The Fog, and the room is ready for the poll to prove it wrong."),
      H(4318, 4334, "RANKING / LIST", "CHRISTINE SMELLS LIKE CHEETOS", "The possessed-car film is judged through the imaginary smell of its lead character, which is somehow a coherent criticism of the movie's mood."),
      H(4528, 4544, "DEEP DIVE", "ESCAPE FROM L.A. HAS ATTITUDE", "Snake Plissken's film is defended as dated, ridiculous, and still too cool to throw away, especially once the audience poll arrives."),
      H(4744, 4760, "FAN SIGNAL", "PRETTY RAD SNAKE WINS THE POLL", "The chat puts Escape from L.A. in the upper-middle tier, proving the room is not the only one willing to forgive the movie's weirdness."),
      H(4948, 4964, "TAKE GETS NUCLEAR", "JOHN CARPENTER IS NOT A HATER'S DIRECTOR", "The hosts clarify that a few lower placements do not erase Carpenter's status; the fun is seeing where the perfect scenes and broken scenes coexist."),
      H(5188, 5204, "SOUNDBYTE / REPLAY", "THE CAR WANTS TO FUCK ITS OWNER", "Christine's premise gets reduced to its most deranged emotional truth: the car is not just possessed, it is in a toxic relationship."),
      H(5428, 5444, "FAN SIGNAL", "CHIEFS OR EAGLES, PLEASE NO", "The Super Bowl poll starts with the room trying to choose the least annoying champion rather than the best team."),
      H(5614, 5630, "TAKE GETS NUCLEAR", "RODGERS TO TENNESSEE", "Aaron Rodgers' next-team rumor becomes an excuse to predict a veteran mentor season and a draft pick waiting in the wings."),
      H(5844, 5860, "FAN SIGNAL", "PROSTHETICS OR MOTION CAPTURE", "The audience asks which movie job sounds more fun, and the hosts pick practical effects before the question becomes a fat-roll nightmare."),
      H(6024, 6040, "DEEP DIVE", "PRACTICAL EFFECTS WITH TOM SAVINI", "The best answer is not abstract: work beside a practical-effects legend, learn the craft, and watch the monster arrive in the room."),
      H(6188, 6204, "STRAIGHT TO STEVE'S ASSHOLE", "DEION SANDERS COACHING COURT", "The room accuses Deion of putting players on camera just to tell them they are not good enough, then insists the critique is personal opinion."),
      H(6388, 6404, "WWAM UP IN YA", "PLAYING WITH BALLS IS NOT MOTION CAPTURE", "The final sports tangent gets dirty before the room remembers it was supposed to answer a question about movie work."),
      H(6554, 6570, "SOUNDBYTE / REPLAY", "THE FAT-ROLL BOSS FIGHT", "Motion capture is rejected because nobody wants their body recorded in spandex and preserved forever inside a video game."),
      H(6758, 6774, "FAN SIGNAL", "WE'LL FIX THE INTERNET", "The sign-off turns technical problems into a promise: better audio, possible Instagram simulcasting, and another Wolf Man conversation."),
      H(7136, 7152, "COMMUNITY MEMORY", "THE ROOM KEEPS SHOWING UP", "The final thank-you is less polished than sincere: the show works because the audience returns even when the internet behaves like garbage."),
      H(7240, 7258, "SOUNDBYTE / REPLAY", "THURSDAY IS NOT FRIDAY", "The last joke sends everybody back to work one day early, which is the only possible ending for a noon stream."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1804, end: 2710, label: "UNTIL DAWN'S MONSTER LOOP", topic: "choice-based horror turned into a time-loop movie", body: "Play from 30:04. The hosts find the smartest movie idea in the episode: let repeated runs change who dies and which horror subgenre takes over.", playAt: 1804, playEnd: 2710 }),
      hated: Object.freeze({ at: 3918, end: 4550, label: "THE FOG GETS SENT TO THE SHIT TIER", topic: "a great setup that never pays the room back", body: "Play from 1:05:18. The criticism is blunt but specific: atmosphere without enough momentum, and a classic that feels boring on rewatch.", playAt: 3918, playEnd: 4550 }),
      wildestDetour: Object.freeze({ at: 2600, end: 2810, label: "THE WINDIGO TONGUE TORANDO", topic: "a real monster mythology question destroyed by a bedroom joke", body: "Play from 43:20. The chat raises a creature legend and the room invents a sexual definition that should never escape this tape.", playAt: 2600, playEnd: 2810 }),
      lastWord: Object.freeze({ at: 5844, end: 7258, label: "PROSTHETICS, DEION, AND THE THURSDAY INSULT", topic: "fan questions, practical effects, and the stream's technical sign-off", body: "Play from 1:37:24. The room answers the effects question, roasts a football coach, promises better streaming, and remembers that tomorrow is still a workday.", playAt: 5844, playEnd: 7258 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-07",
    sources: Object.freeze(sources),
  });
})(window);
