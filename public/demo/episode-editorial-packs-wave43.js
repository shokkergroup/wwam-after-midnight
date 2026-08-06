(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* March 3, 2026: full-tape read of the Scream 7 spoiler review party. */
  sources["WKs1uPGMQvw"] = Object.freeze({
    sourceId: "WKs1uPGMQvw",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 10891,
      captionWords: 4609,
      captionEvents: 329,
      captionSpanSeconds: 10891.273,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:9a3f689e58e07e20fc8ab086f4d3ed086b7a6e6b6cbde599df4f679afa00d682",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "91122687778d55641a2134ed253d0f4e43b938a16f1b4a44543021b1c25f20e8",
      asrWindowCount: 329,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "SCREAM 7 SPOILER PARTY // STU LIVES, THE ENDING BLEEDS, AND THE CHAT ARGUES BACK",
    badge: "FULL SHOW WIKI // 3:01:31 OF GHOSTFACE, STU, AND FAM VERDICTS",
    headline: "THE STU ENDING ESCAPED INTO THE WILD; THE WWAM COURT IS STILL IN SESSION.",
    deck:
      "A full spoiler-room autopsy of Scream 7: the opening kill, the secret Stu ending, the Ghostface reveal, the trailer problem, the ranking fight, and a fan court that keeps proposing increasingly unhinged Scream 8s.",
    overview:
      "Mike hosts this one as a spoiler-room pressure cooker. The first minutes establish the wound: an ending with Stu alive was filmed, test-audience notes helped kill it, and the people who saw it will carry that knowledge forever. From there the review does not simply say good or bad. It separates the strong opening, the Ghostface photography, the jokes, and the Matthew Lillard affection from the rushed third act, the over-explained reveal, and the sense that the trailer already spent too much of the movie's suspense. The room keeps returning to Stu because he is not just a plot device in this fandom; he is a promise that the series can still be dangerous and funny at the same time. The chat supplies rankings, alternative endings, rainstorm ideas, poop-scene pitches, road trips, and a full cult-of-Ghostface theory. Mike is often defending the movie against people who hate it, but he is not blind to the weak spots. That tension is the page's real value: a fan can disagree with the verdict and still find the exact argument that explains it. By the last hour, the review has become a community screening room, with Super Chats, Stream Elements questions, Nev Campbell fashion talk, and a dozen possible futures for Scream 8. It ends warm, messy, and still arguing—which is exactly the right ending for a Scream 7 spoiler party.",
    story: Object.freeze([
      { at: 0, end: 780, label: "THE SPOILERS OPEN WITH A STU WOUND", body: "The review begins by naming the thing the audience is afraid to hear: Stu may have been filmed alive, and the finished movie may have buried the version fans wanted." },
      { at: 781, end: 1560, label: "TEST AUDIENCES AND THE GHOST OF THE OTHER ENDING", body: "The alternate ending becomes a production story about secrecy, test screenings, and the strange power of a scene that most viewers never saw but everybody now wants to debate." },
      { at: 1561, end: 2340, label: "MINDY, CHAD, AND THE CHARACTERS LEFT OUT", body: "The review argues that time spent on familiar survivors could have been used to deepen Tatum's friends and other characters before the movie asked the audience to care about their deaths." },
      { at: 2341, end: 3120, label: "THE OPENING KILL, THE BAT, AND THE CULT OF GHOSTFACE", body: "The opening earns praise, the knife-and-bat geography gets questioned, and the thought of a Ghostface cult gives the room its first genuinely exciting future door." },
      { at: 3121, end: 3900, label: "A ROAD TRIP, A RANKING, AND THE SCREAM 2 FIGHT", body: "The conversation widens into franchise shape: a road trip idea, rankings, and the argument over whether Scream 2 deserves the top slot." },
      { at: 3901, end: 4680, label: "THE TRAILER SPOILED THE MOVIE IT WAS SELLING", body: "The second trailer becomes a case study in accidental self-sabotage. The review remembers praising the marketing, then realizes the clips gave away the movie's best shocks." },
      { at: 4681, end: 5460, label: "GHOSTFACE LOOKS RIGHT, BUT THE ENDING DOES NOT", body: "Ghostface's physical presentation earns real credit while the ending keeps losing points for feeling too exposed, too familiar, and too eager to explain itself." },
      { at: 5461, end: 6240, label: "STU, THE MOTIVE, AND THE NEW LINES", body: "The discussion returns to Stu's possible survival, the motives behind the reveal, and the rare sequel lines that feel like new material instead of recycled franchise furniture." },
      { at: 6241, end: 7020, label: "THE CHAT BUILDS SCREAM 8 IN REAL TIME", body: "Fans pitch a road trip, a cult, twin Ghostfaces, and a Sidney call from Stu. The ideas are not all sensible, but the room's willingness to play is the point." },
      { at: 7021, end: 7800, label: "THE POOP-SCENE THEORY OF HORROR", body: "A fan notices that nobody in the franchise ever seems to take a bathroom break. The resulting Ghostface-in-the-tub pitch is vulgar, specific, and strangely useful as a genre observation." },
      { at: 7801, end: 8580, label: "THE THIRD ACT GETS PUT ON TRIAL", body: "The review admits that the third act feels underdeveloped and rushed, then asks whether the production shakeups explain the problem without excusing it." },
      { at: 8581, end: 9360, label: "FANS DEFEND THE MOVIE BACK AT THE HOST", body: "The audience pushes back, praises the movie's first half, and gives Mike permission to be the person who liked a movie other people wanted him to hate." },
      { at: 9361, end: 10140, label: "NEV CAMPBELL, STREAM ELEMENTS, AND THE COMMUNITY ROOM", body: "The final hour moves through Nev Campbell's premiere suit, Super Chats, Stream Elements messages, and the small rituals that make a spoiler review feel like a live room instead of a lecture." },
      { at: 10141, end: 10891, label: "Scream 8 GOES FULL FAST AND FURIOUS", body: "The exit is a pile of possible futures: Tara and Sam as Ghostfaces, Stu as the secret engine, and a franchise that can still pull a holy-shit move if it stops apologizing for being ridiculous." },
    ]),
    highlights: Object.freeze([
      { at: 772, end: 790, category: "TAKE GETS NUCLEAR", label: "STU WAS FILMED ALIVE", excerpt: "The review drops the alternate-ending bomb: a version with Stu alive exists somewhere, and that fact changes the whole room." },
      { at: 945, end: 963, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE TEST AUDIENCE SAID NO", excerpt: "A test audience becomes the villain of the night for rejecting the ending the fans actually wanted." },
      { at: 1220, end: 1238, category: "FAN SIGNAL", label: "THE MEMBERSHIP DOOR", excerpt: "A viewer joins the movie membership and the review briefly turns into a thank-you before the spoilers take over again." },
      { at: 1556, end: 1574, category: "TAKE GETS NUCLEAR", label: "MINDY AND CHAD STOLE THE OXYGEN", excerpt: "The review argues that familiar survivors occupied time that should have made the new victims matter." },
      { at: 2120, end: 2138, category: "THE ROOM BREAKS", label: "THE MOTION-DETECTOR GUY", excerpt: "One line reading in the opening becomes an instant character sketch and a perfect example of how the room hears performance." },
      { at: 2498, end: 2516, category: "WWAM UP IN YA", label: "CULT OF GHOSTFACE BABY", excerpt: "A dead Ghostface does not end the theory; it opens the door to a whole cult of copycats and a call to Stu." },
      { at: 3633, end: 3651, category: "TAKE GETS NUCLEAR", label: "THE SCREAM ROAD TRIP", excerpt: "The room still wants a road-trip Scream, even after admitting the franchise would need a miracle to make it work." },
      { at: 3882, end: 3900, category: "TAKE GETS NUCLEAR", label: "SCREAM 2 TAKES THE TOP SLOT", excerpt: "A fan ranking puts Scream 2 first and forces the room into the franchise's oldest argument." },
      { at: 4210, end: 4228, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE TRAILER SHOWED TOO MUCH", excerpt: "The review admits the marketing looked disciplined until the second trailer gave away the movie's suspense." },
      { at: 4820, end: 4838, category: "TAKE GETS NUCLEAR", label: "GHOSTFACE'S FOREHEAD", excerpt: "A tiny mask detail becomes a real cinematography conversation about how Ghostface is framed and shot." },
      { at: 5020, end: 5038, category: "WWAM UP IN YA", label: "GHOSTFACE NEEDS A POOP SCENE", excerpt: "The chat notices the franchise has almost no bathroom interruptions and immediately invents the worst possible one." },
      { at: 5700, end: 5718, category: "TAKE GETS NUCLEAR", label: "THE NEW STU LINES RULE", excerpt: "The review gives the returned character credit for new, quotable lines instead of simple nostalgia recycling." },
      { at: 6020, end: 6038, category: "FAN SIGNAL", label: "THE 666 VIEWER JOKE", excerpt: "A viewer count becomes a satanic bit right in the middle of the Stu argument." },
      { at: 6470, end: 6488, category: "TAKE GETS NUCLEAR", label: "THE ENDING NEEDS A BAND-AID", excerpt: "The room admits that the film's strongest ideas still need an ending capable of carrying them home." },
      { at: 7443, end: 7461, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE POOP-SCENE CASE FILE", excerpt: "A fan's observation about missing bathroom scenes becomes a full lethal-weapon-style pitch." },
      { at: 8070, end: 8088, category: "TAKE GETS NUCLEAR", label: "THE THIRD ACT WAS RUSHED", excerpt: "The review points at production shakeups without using them as an excuse for a third act that feels undercooked." },
      { at: 8403, end: 8421, category: "TAKE GETS NUCLEAR", label: "TINA GRAY ENTERS THE ARGUMENT", excerpt: "A Nightmare on Elm Street reference turns the Scream conversation into a comparison of franchise memory." },
      { at: 8740, end: 8758, category: "FAN SIGNAL", label: "THE CHAT LIKES WHAT MIKE LIKES", excerpt: "A viewer says the movie worked for them, giving the host room to defend a positive read without pretending it is flawless." },
      { at: 9020, end: 9038, category: "WWAM UP IN YA", label: "THE GOOD-GUY TEST", excerpt: "A character's simple good-guy line gets treated as both sincere and suspicious, which is the exact Scream problem." },
      { at: 9340, end: 9358, category: "FAN SIGNAL", label: "STREAM ELEMENTS AFTER DARK", excerpt: "The show pauses for donations, then immediately resumes the spoiler autopsy as if nothing happened." },
      { at: 9634, end: 9652, category: "FAN SIGNAL", label: "NEV CAMPBELL'S VINCE-MCMAHON SUIT", excerpt: "Nev Campbell's premiere outfit gets a full fashion verdict and a surprising wrestling comparison." },
      { at: 9860, end: 9878, category: "TAKE GETS NUCLEAR", label: "WHO THE FUCK IS THAT GUY", excerpt: "A fan's theater story captures the funniest possible reaction to an unfamiliar Ghostface reveal." },
      { at: 10080, end: 10098, category: "THE ROOM BREAKS", label: "ROB ZOMBIE'S BEST FRIEND ENERGY", excerpt: "A tired-looking character description becomes a quick Rob Zombie casting image." },
      { at: 10380, end: 10398, category: "TAKE GETS NUCLEAR", label: "TARA AND SAM AS GHOSTFACES", excerpt: "The chat pitches a future where the franchise's heroes become its killers and Stu remains the hidden engine." },
      { at: 10610, end: 10628, category: "FAN SIGNAL", label: "THE PARASOCIAL GHOSTFACE", excerpt: "A viewer's parasocial reading gives the franchise a new motive that does not require another secret sibling." },
      { at: 10820, end: 10838, category: "THE ROOM BREAKS", label: "FAST AND THE FURIOUS 7", excerpt: "One future-Scream pitch is so oversized that the room compares it to a completely different franchise." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 772, end: 1180, label: "THE STU ENDING THAT ESCAPED", topic: "the filmed alternate ending and the fans who want it back", body: "Play from 12:52. This is the review's emotional center: not blind nostalgia, but a real argument for why Stu's survival would change the franchise's temperature.", playAt: 772, playEnd: 1180 }),
      hated: Object.freeze({ at: 4210, end: 4880, label: "THE TRAILER SPOILER PROBLEM", topic: "marketing that spent the movie's best shocks early", body: "Play from 1:10:10. The anger is specific: the first trailer built trust, then the later clips spent it.", playAt: 4210, playEnd: 4880 }),
      wildestDetour: Object.freeze({ at: 5020, end: 7550, label: "GHOSTFACE NEEDS A BATHROOM BREAK", topic: "poop scenes, lethal-weapon logic, and the chat writing horror's grossest set piece", body: "Play from 1:23:40. The franchise critique becomes a bodily-function bit and somehow still makes a useful point about character vulnerability.", playAt: 5020, playEnd: 7550 }),
      lastWord: Object.freeze({ at: 9634, end: 10891, label: "THE FAM WRITES SCREAM 8", topic: "Nev Campbell, Super Chats, cults, and impossible future sequels", body: "Play from 2:40:34. The ending belongs to the audience, who keep pitching bigger, stranger futures until Scream 8 is basically Fast and Furious with a Ghostface mask.", playAt: 9634, playEnd: 10891 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
