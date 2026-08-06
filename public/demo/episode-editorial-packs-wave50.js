(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* January 13, 2026: full-tape read of the Scream 7 teaser breakdown. */
  sources["M3P4mMDpXUc"] = Object.freeze({
    sourceId: "M3P4mMDpXUc",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 3338,
      captionWords: 2066,
      captionEvents: 145,
      captionSpanSeconds: 3206.02,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:dbda2b97a1c4a51aa1935ce5716e2b8ab2579b836ca927386e835db398fc365c",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "1f6dc9ee267079d5ded4d17b713f8b81505d13acd97ca199f1818a0e6c196cb9",
      asrWindowCount: 21,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "SCREAM 7 TEASER BREAKDOWN // THE PSYCHIATRIC-WARD MYSTERY AND THE CHAIR RECEIPT",
    badge: "FULL SHOW WIKI // 55:38 OF TRAILER FORENSICS, GHOSTFACE THEORY, AND FAM-POWERED ZOOMING",
    headline: "THE SCREAM 7 ROOM ZOOMS INTO A CHAIR, ARGUES ABOUT STU, AND STILL FINDS TIME FOR A STEVEN SEAGAL REGGAE JOKE.",
    deck:
      "A compact but unusually dense Scream 7 teaser autopsy: a psychiatric ward, a suspicious chair, a changed line, possible Stu mythology, Ghostface rumors, fan red herrings, and the exact point where microscopic trailer reading becomes more fun than certainty.",
    overview:
      "This tape is the WWAM trailer-breakdown format at its best. The hosts arrive with a teaser, pause on practically every frame, and invite the FAM to become a second set of eyes. The room asks who is in the wheelchair, whether the psychiatric ward is connected to Stu, why a line changed from an earlier trailer, and whether the studio is deliberately playing with the audience's expectations. The theories stay marked as theories. Ethan Embry, Jill, Billy, Stu, Ghostface, and even Roger Jackson are discussed as possible doors, not confirmed plot facts. The comedy keeps the forensic work from turning into homework: a Steven Seagal reggae clip, a shirt designed at home, a Paul Rudd setup, and a high-kick injury all puncture the seriousness. By the end, the hosts admit they may have squeezed every possible clue out of a short teaser, but the audience count proves the exercise worked. This is a small show with a very clear WWAM contract: speculate loudly, label the speculation, and let the FAM argue back.",
    story: Object.freeze([
      { at: 0, end: 500, label: "THE SHIRT, PAUL RUDD, AND A TRAILER WITH A PURPOSE", body: "The stream opens with a homemade shirt, a Paul Rudd setup, and the promise that the teaser will be watched together. The tone is intentionally loose: the hosts want the FAM to know this is a live autopsy, not a polished studio breakdown." },
      { at: 501, end: 900, label: "DC ANIMATED MOVIES AND THE CORY FELDMAN COMEBACK JOKE", body: "A quick detour celebrates the DC animated movies before the room asks who actually owns the comeback crown. Cory Feldman gets the joke, TikTok monetization gets the business pitch, and the show remembers that even a teaser breakdown needs a little self-promotion." },
      { at: 901, end: 1400, label: "THE PSYCHIATRIC WARD DOOR", body: "The teaser's most important image is a psychiatric ward. A fan theory suggests Stu has been hospitalized and could become a Hannibal Lecter-style source of information. The hosts dislike the clean version of the theory, but they cannot deny that the setting was placed there to make everybody ask the same question." },
      { at: 1401, end: 1900, label: "THE MAGNIFYING-GLASS FRAME BY FRAME", body: "The breakdown gets microscopic. A wheelchair, a face, and a changed line are enlarged until the room can almost convince itself a random background figure is a major character. The hosts repeatedly pull back from certainty, which keeps the fun intact when the pixels refuse to cooperate." },
      { at: 1901, end: 2400, label: "MARK, JILL, BILLY, AND THE RED-HERRING MACHINE", body: "The teaser appears to keep killing Mark, so the room wonders whether the franchise is training viewers not to trust any death image. Jill, Billy, Ethan Embry, and a possible family connection are all raised as possibilities. The important observation is not who is right; it is that the trailer is visibly manipulating the audience." },
      { at: 2401, end: 2800, label: "ROGER JACKSON, WILL SMITH, AND THE META GHOSTFACE DOOR", body: "The FAM builds increasingly meta ideas: Roger Jackson explaining the Ghostface voice, a celebrity Ghostface revenge joke, and an old-school character returning as the new Dewey-like anchor. The room laughs at the bad pitches while recognizing why Scream can keep generating them." },
      { at: 2801, end: 3200, label: "THE ROOM ADMITS IT MAY BE OVERTHINKING", body: "After one last zoom, the hosts admit the chair could simply belong to a random person and the asylum could be pure atmosphere. That is not a failure; it is the correct ending for a teaser breakdown. The fun was in the argument, the FAM supplied the eyes, and the uncertainty stays visible." },
      { at: 3201, end: 3338, label: "THE AFTERNOON CLUB GOES UP ON A TUESDAY", body: "The goodbye thanks more than 400 people for showing up on a Tuesday afternoon, previews the next poster stream, and admits the audience made a short afternoon tape feel like an event." },
    ]),
    highlights: Object.freeze([
      { at: 90, end: 124, category: "WWAM UP IN YA", label: "PAUL RUDD'S TRAILER SETUP", excerpt: "The show promises to put its metaphorical dick into the teaser before the first frame has even been examined." },
      { at: 102, end: 138, category: "THE ROOM BREAKS", label: "THE HOMEMADE SHIRT RECEIPT", excerpt: "A shirt made during the WWAM merch era becomes a tiny piece of creator lore before the Scream autopsy starts." },
      { at: 362, end: 394, category: "DEEP DIVE", label: "THE DC ANIMATED MOVIE FLOWER", excerpt: "The room briefly gets sincere about how hard the DC animated movies go, a useful reminder that the hosts can praise as aggressively as they mock." },
      { at: 376, end: 410, category: "WWAM UP IN YA", label: "STEVEN SEAGAL SINGS REGGAE", excerpt: "A Steven Seagal reggae clip cuts across the superhero conversation and immediately explains why three people leave the stream." },
      { at: 440, end: 478, category: "CHARACTER PERFORMANCE", label: "CORY FELDMAN OWNS THE COMEBACK", excerpt: "Cory Feldman is declared the uncontested comeback king in a bit that is clearly built for the channel's recurring character-and-celebrity lane.", characters: ["Corey Feldman"] },
      { at: 461, end: 496, category: "FAN SIGNAL", label: "THE TIKTOK 10K PUSH", excerpt: "The room asks the FAM to help reach 10,000 TikTok subscribers so the channel can monetize, turning the breakdown into a tiny community campaign." },
      { at: 1004, end: 1040, category: "DEEP DIVE", label: "STU IN A PSYCHIATRIC HOSPITAL", excerpt: "A fan theory sends Stu to a psychiatric hospital and recasts him as a possible Hannibal Lecter-style information source. The page preserves this as a theory, not a reveal." },
      { at: 1010, end: 1048, category: "TAKE GETS NUCLEAR", label: "THE HANNIBAL LECTER ROUTE", excerpt: "The room hates the neatness of a Scream villain becoming a consultant, but admits the franchise could absolutely try it." },
      { at: 1084, end: 1120, category: "DEEP DIVE", label: "WHO IS IN THE CHAIR?", excerpt: "The camera zooms toward a wheelchair figure and the FAM begins doing forensic work on a frame that may be deliberately meaningless." },
      { at: 1111, end: 1148, category: "FAN SIGNAL", label: "THE RANDOM-PERSON THEORY", excerpt: "A viewer argues the chair could belong to a random person, giving the room its first useful antidote to its own overthinking." },
      { at: 1236, end: 1272, category: "DEEP DIVE", label: "ETHAN EMBRY OR A RED HERRING", excerpt: "The face in the chair is compared to Ethan Embry, while the hosts admit the resemblance could be exactly the trap the teaser wants them to fall into." },
      { at: 1253, end: 1288, category: "TAKE GETS NUCLEAR", label: "STU HAS TO BE DEAD, PROBABLY", excerpt: "The room insists Stu is dead, then immediately constructs the fake-death-and-psychiatric-ward loophole that keeps the theory alive." },
      { at: 1285, end: 1322, category: "THE ROOM BREAKS", label: "JULIE JAMES GETS PUT IN TIMEOUT", excerpt: "A fan demands a response and gets put in timeout, proving the live chat is not an audience so much as a second cast." },
      { at: 1441, end: 1484, category: "WWAM UP IN YA", label: "THE MAGNIFYING GLASS JOKE", excerpt: "A promise to use a magnifying glass for the trailer becomes a crude body joke before the room remembers it is supposed to be looking at pixels." },
      { at: 1624, end: 1660, category: "DEEP DIVE", label: "JILL, BILLY, OR NOTHING", excerpt: "A face in the center of the frame resembles Jill, Billy, or absolutely nobody important, which is the perfect Scream 7 receipt." },
      { at: 1672, end: 1710, category: "DEEP DIVE", label: "THE LINE CHANGED", excerpt: "The hosts notice a line has changed from the earlier trailer and argue that the studio may be deliberately rewriting the audience's expectations." },
      { at: 1684, end: 1722, category: "TAKE GETS NUCLEAR", label: "THEY ARE PLAYING WITH OUR MINDS", excerpt: "A changed line becomes the strongest evidence that the trailer team is baiting Scream fans rather than simply showing the movie." },
      { at: 1795, end: 1832, category: "DEEP DIVE", label: "SYDNEY IS BEING LURED", excerpt: "A house shot suggests somebody is being used to pull Sydney into a trap, but the hosts keep the language at the level of a read, not a spoiler claim." },
      { at: 1946, end: 1982, category: "TAKE GETS NUCLEAR", label: "THE FAKE-DEATH LOOPHOLE", excerpt: "The room flips its entire Stu perspective after realizing a different-name hospitalization could be the franchise's favorite kind of nonsense." },
      { at: 2097, end: 2134, category: "THE ROOM BREAKS", label: "THE TRAILER HATES MARK", excerpt: "The teaser appears to kill Mark for the seventeenth time, and the room admits it has stopped trusting any image that looks like a death." },
      { at: 2113, end: 2148, category: "WWAM UP IN YA", label: "ROSS AL GHUL'S STEEL-TOED BOOTS", excerpt: "A Scream theory is interrupted by a steel-toed-boot joke that sounds like it escaped from a different franchise entirely." },
      { at: 2194, end: 2235, category: "TAKE GETS NUCLEAR", label: "JAY UNDER THE MASK", excerpt: "The room suggests putting Jay under the Ghostface mask solely to prove Stu is dead, a casting idea that is both stupid and weirdly persuasive." },
      { at: 2210, end: 2248, category: "FAN SIGNAL", label: "THE 12-YEAR-OLD SPOILER SOURCE", excerpt: "A rumor about a new Ghostface is dismissed because its source is a child who claims to know the ending, which the room treats as the least trustworthy leak imaginable." },
      { at: 2240, end: 2278, category: "THE ROOM BREAKS", label: "THE HIGH-KICK INJURY", excerpt: "A failed high kick with a daughter becomes a live physical-comedy receipt, and the only person not laughing is the person who fell." },
      { at: 2264, end: 2304, category: "DEEP DIVE", label: "PARKOUR IN THE OPENING", excerpt: "The opening appears to show girls doing parkour off lights, giving the room one of the few clean action reads in a teaser built on mystery." },
      { at: 2391, end: 2432, category: "DEEP DIVE", label: "THE FRANCHISE MEMORY MAP", excerpt: "The hosts connect the opening to earlier Scream movies, Cotton, Dewey, and a possible family line without pretending the connection is confirmed." },
      { at: 2420, end: 2458, category: "BEST MOMENT", label: "WHO THE FUCK IS IN THAT HOSPITAL?", excerpt: "The chair mystery reaches its most honest form: not a theory, not a spoiler, just the question that keeps the whole tape moving." },
      { at: 2453, end: 2494, category: "FAN SIGNAL", label: "ROGER JACKSON EXPLAINS THE VOICE", excerpt: "A fan imagines Roger Jackson appearing as himself to explain where the Ghostface voice came from, turning franchise meta into a full scene pitch." },
      { at: 2474, end: 2510, category: "WWAM UP IN YA", label: "GHOSTFACE WILL SMITH", excerpt: "A fan pitches Ghostface Will Smith and a Keep-her-name-out-of-your-mouth knife joke, immediately earning a poor-idea-but-good-bit verdict." },
      { at: 2511, end: 2548, category: "DEEP DIVE", label: "THE NEW DEWEY SLOT", excerpt: "The room asks whether the franchise is looking for a new Dewey-like anchor and what that would mean if the series reaches the eighth movie it keeps teasing." },
      { at: 2536, end: 2576, category: "BEST MOMENT", label: "A GOOD TEASER ACTUALLY SHOWS SOMETHING", excerpt: "The hosts admit the teaser works because it reveals more than a normal TV spot while still leaving the central chair mystery intact." },
      { at: 2776, end: 2816, category: "FAN SIGNAL", label: "THE RANDOM ASYLUM PERSON", excerpt: "The FAM pulls the hosts back from their own theory: the asylum figure may be pure background, and the red herring may be the entire point." },
      { at: 3058, end: 3098, category: "THE ROOM BREAKS", label: "WE HAD A GOOD TIME ZOOMING", excerpt: "The room admits it may have found nothing and still had a great time, which is the honest mission statement of a teaser breakdown." },
      { at: 3174, end: 3216, category: "FAN SIGNAL", label: "THE AFTERNOON CLUB GOES UP", excerpt: "More than 400 viewers show up on a Tuesday afternoon, turning a short Scream teaser stream into a genuine community event." },
      { at: 3192, end: 3228, category: "BEST MOMENT", label: "MADE FUN ON A TUESDAY", excerpt: "The goodbye thanks the audience for making an afternoon tape fun, a small but important receipt of why these pages should preserve the room rather than only the trailer." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 3058, end: 3098, label: "THE FAM'S MAGNIFYING GLASS", topic: "a teaser that rewards looking too closely", body: "Play from 50:58. The hosts may not solve the chair, but the audience turns every pixel into a reason to keep talking.", playAt: 3058, playEnd: 3098 }),
      hated: Object.freeze({ at: 1010, end: 1048, label: "THE HANNIBAL LECTER ROUTE", topic: "a theory that makes the room nervous because it could actually happen", body: "Play from 16:50. The idea of Stu as a consultant is rejected, mocked, and never fully killed.", playAt: 1010, playEnd: 1048 }),
      wildestDetour: Object.freeze({ at: 376, end: 410, label: "STEVEN SEAGAL REGGAE", topic: "a music video nobody requested in the middle of Scream 7", body: "Play from 6:16. The teaser autopsy briefly becomes a Steven Seagal concert, which is exactly the kind of wrong turn the FAM expects.", playAt: 376, playEnd: 410 }),
      lastWord: Object.freeze({ at: 3192, end: 3228, label: "THE TUESDAY CLUB", topic: "400 viewers making a short stream feel like a premiere", body: "Play from 53:12. The final receipt is community scale: the audience showed up, argued, and made the afternoon matter.", playAt: 3192, playEnd: 3228 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
