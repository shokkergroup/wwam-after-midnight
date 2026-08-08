(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "x7x6CLgV7lI", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* November 28, 2024: Thanksgiving First Time Watch Reaction. */
  sources["x7x6CLgV7lI"] = Object.freeze({
    sourceId: "x7x6CLgV7lI",
    reviewState: "full-tape-human-editorial-read-edge",
    editorialPass: "2026-08-07 fine-toothed first editorial read; official caption ledger plus canonical local audio pass across the November 28, 2024 Thanksgiving reaction",
    evidence: Object.freeze({
      duration: 421,
      captionWords: 1020,
      captionEvents: 301,
      captionSpanSeconds: 423.21,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:ccb1103a31b310385f5e19e1e0becf5d5dc57777710f05f1cdf44989456eec65",
      captionSourceKind: "official YouTube automatic caption ledger acquired as JSON3",
      audioPass: "canonical YouTube audio + official-caption second read; local audio playback spot-check; playback remains the authority",
      audioSha256: "sha256:3ca4ae94169d9296db812bda56fba16ef6eefbb9cec7313cbcb086bcab45f3b8",
      asrWindowCount: 0,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THANKSGIVING FIRST-TIME WATCH REACTION // NOVEMBER 28, 2024",
    badge: "ADJACENT SHOW WIKI // 7:01 OF BLACK-FRIDAY PANIC, TURKEY GORE, PATRICK DEMPSEY SUSPICION, AND A DIRTY CHARACTER BUTTON",
    headline: "THE TURKEY IS STUFFED, THE AXE IS OUT, AND STEVE HAS A LOT OF MAIL",
    deck: "A seven-minute Thanksgiving reaction turns a holiday slasher into a speed-run through theft, turkey anatomy, suspiciously good-looking men, and the exact moment a movie gets sent straight to Steve's Asshole.",
    overview: "This is a compact reaction/review, not a full-film commentary, and it wastes almost none of its seven minutes. The room spots the Black Friday panic immediately: people grab whatever is nearby, an axe becomes instant foreshadowing, and a beach ball is treated as the least convincing emergency prop in slasher history. The comedy keeps finding the body. A star-shaped injury becomes a discount butt-plug aisle, a severed head looks like a proud father's approval face, and a turkey kill gets the full WWAM treatment: cook it, eat it, and let the Pilgrim ass know dinner is served. The hosts bounce from Prime-bottle energy and chloroform to a weed-house déjà vu, a mustache ride, cranberry-sauce hatred, and a sudden desire to bang a drum hard enough to become a crime scene. The film's sideways camera angle earns a Batman Forever comparison, while Patrick Dempsey's handsome cop becomes suspicious solely because he looks too trustworthy. By the time the credits and company ownership arrive, the show has already delivered three Steve's Asshole lanes, three Up In Ya spikes, two film-read beats, and a closing Halloween-style character spell. The archive value is density: a short upload with a clear comic rhythm, a memorable Thanksgiving image, and a final Loomis/Challis button that belongs in the recurring WWAM character shelf.",
    story: Object.freeze([
      { at: 0, end: 70, label: "BLACK FRIDAY HAS A KNIFE", body: "The reaction opens on a crowded shopping panic, a beach ball that makes no sense, and an axe waiting on the wall like the movie has already highlighted its own foreshadowing." },
      { at: 70, end: 140, label: "THE BODY BECOMES THE JOKE", body: "A star-shaped injury, a severed head, and a turkey-shaped kill give the room three different ways to turn practical gore into a holiday punchline." },
      { at: 140, end: 220, label: "THE HOUSE OF BAD DECISIONS", body: "Chloroform, Prime, suspicious bedrooms, and a weed-house déjà vu make the characters look less like survivors and more like people who have never locked a door." },
      { at: 220, end: 290, label: "THANKSGIVING DINNER GETS PERSONAL", body: "Cranberry sauce, buttered feet, tuna, and a Pilgrim insult turn the film's dinner imagery into the tape's most openly filthy comic run." },
      { at: 290, end: 350, label: "DREAD WITH A SIDEWAYS CAMERA", body: "The hosts notice the angled camera, compare the look with Batman Forever, and begin suspecting any handsome police officer on principle." },
      { at: 350, end: 405, label: "THE MOVIE'S OWNERSHIP PROBLEM", body: "A quick company/rights detour gives way to the room's verdict that the film works best when it stops explaining and starts serving the next ugly image." },
      { at: 405, end: 421, label: "LOOMIS CANNOT RECOVER", body: "The Thanksgiving review leaves through the recurring white-faced Michael insult, with Loomis failing and Dr. Challis once again too drunk to help." },
    ]),
    highlights: Object.freeze([
      H(8, 19, "DEEP DIVE", "THE SPYGLASS OPEN", "The first image is treated like a spyglass, which makes the room sound as if it is reviewing a nautical slasher."),
      H(20, 31, "WWAM UP IN YA", "SLENDERMAN UNDER THE MASK", "The killer's silhouette gets compared with what Slenderman would look like if he had to shop on Black Friday."),
      H(32, 43, "FAN SIGNAL", "TEN THOUSAND FOR THE RAT FAMILY", "A fake pitch for ten thousand dollars to join a rat family flashes by before the film can establish a normal human tone."),
      H(44, 55, "STRAIGHT TO STEVE'S ASSHOLE", "THE BEACH BALL EMERGENCY", "A woman running with a beach ball is filed as an emergency prop that explains nothing and deserves no rescue effort."),
      H(56, 67, "DEEP DIVE", "THE AXE IS FORESHADOWING", "The axe on the wall is spotted instantly, and the hosts give the movie credit for at least labeling its own future crime."),
      H(68, 79, "WWAM UP IN YA", "ELON IN THE AISLE", "A passing Elon joke collides with Black Friday theft and turns the shopping crowd into a billionaire's worst security camera."),
      H(80, 91, "SOUNDBYTE / REPLAY", "WOMEN'S UNDERWEAR DANCE", "A pair of underwear becomes an excuse for a private dance when nobody appears to be watching."),
      H(92, 103, "STRAIGHT TO STEVE'S ASSHOLE", "THE STAR ON HIS BUTT", "A star-shaped injury is transformed into an imagined half-off butt-plug aisle, a perfect Thanksgiving receipt for Steve."),
      H(104, 115, "DEEP DIVE", "HE TOOK HIS OWN HEAD OFF", "The severed-head image is first read as a father looking proudly at his son before the actual gore catches up."),
      H(116, 127, "WWAM UP IN YA", "P TO JOE", "A character's outfit inspires a fake rapper named P to Joe and an unsolicited request that two people just kiss already."),
      H(128, 139, "SOUNDBYTE / REPLAY", "LICK YOUR BUTT", "The romantic advice escalates from kissing to licking somebody's butt in under one breath."),
      H(140, 151, "STRAIGHT TO STEVE'S ASSHOLE", "THE CHLOROFORM CAN", "A chloroform can earns the immediate suspicion reserved for props that only exist to make a character stop moving."),
      H(152, 163, "WWAM UP IN YA", "LOGAN PAUL PRIME", "A bottle is compared with Logan Paul trying to make everyone drink Prime, even while the movie is trying to kill them."),
      H(164, 175, "FAN SIGNAL", "MISS KITTY IS NOT MARRIED", "A domestic line becomes an excuse for the hosts to remember that somebody in the scene is not actually married."),
      H(176, 187, "SOUNDBYTE / REPLAY", "THE MUSTACHE RIDE POP QUIZ", "A mustache ride and a Hot Shot reference arrive in the same tiny slice of audio."),
      H(188, 199, "DEEP DIVE", "SHOOT THE VICTIM BACK", "The room asks why the victim is not shooting back, as if every Thanksgiving dinner comes with a tactical response plan."),
      H(200, 211, "WWAM UP IN YA", "BANG THE DRUM", "A drum becomes an irresistible object, with the hosts admitting the urge to bang it hard enough to become a problem."),
      H(212, 223, "STRAIGHT TO STEVE'S ASSHOLE", "THE CRANBERRY SAUCE BAN", "Cranberry sauce is rejected so forcefully it becomes a holiday food crime worthy of Steve's list."),
      H(224, 235, "WWAM UP IN YA", "BUTTERED FEET", "The reaction takes a hard turn into buttering somebody's feet and sucking their toes."),
      H(236, 247, "DEEP DIVE", "COOK HER LIKE A TURKEY", "The killer's dinner plan is described with the bluntest possible Thanksgiving metaphor."),
      H(248, 259, "SOUNDBYTE / REPLAY", "DADDY'S HOME, DINNER TIME", "A villainous homecoming line makes the kitchen sound like a family reunion nobody survives."),
      H(260, 271, "STRAIGHT TO STEVE'S ASSHOLE", "TONY ROBBINS MOUTHPIECE", "A swollen lower lip gets compared with a motivational speaker's mouthpiece, which is not a medical diagnosis anybody requested."),
      H(272, 283, "WWAM UP IN YA", "I SMELL TUNA", "A smell joke turns a Pilgrim costume into an insult about tuna and a holiday dinner that should be canceled."),
      H(284, 295, "SOUNDBYTE / REPLAY", "RUN MY THANKSGIVING DINNER", "The hosts yell at the victim to run, then immediately rename the chase as their Thanksgiving dinner."),
      H(296, 307, "DEEP DIVE", "THE GOOD-LOOKING COP", "Patrick Dempsey's handsome cop is treated as suspicious because a man that polished cannot possibly be innocent in a slasher."),
      H(308, 319, "FAN SIGNAL", "I KNEW THE JOKE WAS TRUE", "A prior joke about a couple having sex is confirmed by the scene, giving the reaction one of its cleanest prediction hits."),
      H(320, 331, "STRAIGHT TO STEVE'S ASSHOLE", "NO LEFTOVERS", "The dinner threat ends with the promise that there will be no leftovers, which is both a kill line and a food review."),
      H(332, 343, "SOUNDBYTE / REPLAY", "ACTING IS SCREAMING", "The hosts imagine an acting career where the entire résumé is screaming and attacking clothing with an axe."),
      H(344, 355, "DEEP DIVE", "BATMAN FOREVER ANGLE", "A sideways camera angle makes the whole movie look like a grimier cousin of Batman Forever."),
      H(356, 367, "WWAM UP IN YA", "EVERYTHING IS ASH", "The aftermath is reduced to ash, slow motion, and a tiny admission that the image actually scared them."),
      H(368, 379, "STRAIGHT TO STEVE'S ASSHOLE", "SPYGLASS OWNS THE PARTY", "A quick ownership detour gets sent to Steve when the room decides the company behind the movie is part of the problem."),
      H(380, 391, "FAN SIGNAL", "WHAT ARE YOU DOING OCTOBER 31?", "The recurring October 31 question returns as a bridge from Thanksgiving to the channel's Halloween universe."),
      H(392, 403, "CHARACTER PERFORMANCE", "THE WHITE-FACED ASSHOLE", "The closing Halloween-style line turns the killer into a white-faced insult with the exact cadence of a recurring WWAM character bit.", ["Michael Myers"]),
      H(404, 414, "CHARACTER PERFORMANCE", "LOOMIS CANNOT RECOVER", "Loomis fails, Dr. Challis is drunk, and the sign-off refuses to let either character leave with dignity.", ["Dr. Loomis", "Dr. Challis"]),
      H(415, 421, "SOUNDBYTE / REPLAY", "GODDAMN YOU, MICHAEL", "The final curse is the last word: short, filthy, and perfectly unwilling to end like a normal review."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 296, end: 343, label: "THE HANDSOME COP PROBLEM", topic: "Patrick Dempsey suspicion", body: "Play from 4:56. The room decides a cop who looks that good has to be hiding something, then gets a prediction receipt when the scene catches up.", playAt: 296, playEnd: 343 }),
      hated: Object.freeze({ at: 212, end: 283, label: "CRANBERRY SAUCE AND BUTTERED FEET", topic: "holiday food and sex detours", body: "Play from 3:32. Cranberry sauce is rejected, feet are buttered, and the Thanksgiving dinner conversation leaves the kitchen entirely.", playAt: 212, playEnd: 283 }),
      wildestDetour: Object.freeze({ at: 80, end: 139, label: "THE STAR-SHAPED BUTT-PLUG AISLE", topic: "Black Friday body comedy", body: "Play from 1:20. A star injury, a discount aisle, a fake rapper, and a request to lick somebody's butt turn the opening gore into a full WWAM detour.", playAt: 80, playEnd: 139 }),
      lastWord: Object.freeze({ at: 392, end: 421, label: "LOOMIS IS FIRED", topic: "the recurring character button", body: "Play from 6:32. The white-faced Michael insult rolls straight into Loomis failing, Challis drinking, and a final Goddamn-you-Michael curse.", playAt: 392, playEnd: 421 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-07",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
