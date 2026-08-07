(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "ZL9ObHdW_rU", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* February 5, 2025: full second read of the 1:39:35 movie-news / Power Rangers room. */
  sources["ZL9ObHdW_rU"] = Object.freeze({
    sourceId: "ZL9ObHdW_rU",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; caption-ledger pass across the full February 5 room with audio-backed doors",
    evidence: Object.freeze({
      duration: 5975,
      captionWords: 20695,
      captionEvents: 2696,
      captionSpanSeconds: 5972.28,
      captionDurationCoveragePercent: 99.95,
      captionSha256: "sha256:6f6f47292c321f298da5a75a15f2c4260ef8991185423dcd2f8adb8ddf8cc236",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:88f33efbf2eb2705e2b48a3e1d8f5851e342fd177aa7e6745c78f0f01f69f402",
      asrWindowCount: 269,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // FEBRUARY 5, 2025",
    badge: "FULL SHOW WIKI // 1:39:35 OF JURASSIC WORLD, POWER RANGERS, HALLOWEEN DIRECTORS, CHUCKY, AND NIGHTMARE",
    headline: "THE FEBRUARY 5 ROOM GIVES POWER RANGERS A UFC COMMENTARY TRACK",
    deck: "A Jurassic World trailer argument turns into a full fight call, then the room drafts directors for every horror franchise it can reach.",
    overview: "February 5 has a split personality and both halves are worth keeping. The opening is a Jurassic World Rebirth trailer argument: one side sees a promising dinosaur movie, the other sees an Xbox 360 DLC pack and a franchise that should stop if it cannot beat the original Jurassic Park. The desk then takes a gross dog-poop detour, answers a Tim 27 McChicken question about Loomis and Slenderman, and lets the FAM lane steer the Scream 7 conversation toward Billy, Stu, and Roman. After Taco Bell, hangover rules, and a no-carb promise, the show abruptly plays a Power Rangers fight like a UFC broadcast. Goldar hits aerial kicks, breaks the Megazord's logic, and becomes the greatest hater in the room; the commentary keeps going through the Dragonzord, a Green Ranger/Red Ranger fade, and a whole lot of invented move names. The back half is a director draft: Tarantino, Flanagan, Robert Rodriguez, David Gordon Green, Zack Snyder, Rob Zombie, Fede Alvarez, Ari Aster, and John Carpenter get assigned to Halloween, Chucky, Texas Chainsaw, Hellraiser, Nightmare, and more. Fan polls, Michael Parton, Lee \"The Machine\" Bowers, and the looming question of whether anything should ever be PG-13 keep the room connected to its actual audience. It ends with the exact opposite of a polished sign-off: a dog-duty complaint, a fake serious director debate, and Lee's Volvo callback.",
    story: Object.freeze([
      { at: 0, end: 900, label: "JURASSIC WORLD AND THE DOG-POOP TEST", body: "The new dinosaur trailer is either a reason to hope or an Xbox 360 DLC hallucination, and a dog-poop cleanup story makes the disagreement physical almost immediately." },
      { at: 900, end: 1500, label: "TACO BELL, LOOMIS, AND THE FAM LANE", body: "Garlic steak nacho fries, hangover rules, Tim 27 McChicken, Loomis and Slenderman, and a Scream 7 theory make the audience part of the episode's opening architecture." },
      { at: 1500, end: 2700, label: "GOLDAR ENTERS THE OCTAGON", body: "Power Rangers gets narrated as a fight night: theatrical kicks, Megazord physics, a missing main character, a Dragonzord entrance, and a Green Ranger who treats every frame as a grudge match." },
      { at: 2700, end: 3300, label: "THE HALLOWEEN DIRECTOR DRAFT", body: "Tarantino and Mike Flanagan lead a Halloween poll while the room imagines Michael's dirty toes, Celtic dialogue, and the exact amount of gratuitous violence a new version would need." },
      { at: 3300, end: 3900, label: "NIGHTMARE, SHUDDER, AND THE FART VIRUS", body: "Nightmare on Elm Street, the Scream TV show, streaming bundles, and a fart that hangs in the air like the T-virus turn the director conversation into a lived-in room." },
      { at: 3900, end: 4500, label: "TOMMY BOY WINGS AND THE TEXAS CHAINSAW ARGUMENT", body: "A fan message becomes a Tommy Boy chicken-wing bit, then Zack Snyder, Rob Zombie, and Robert Rodriguez fight over who should touch Texas Chainsaw." },
      { at: 4500, end: 5200, label: "HELLRAISER NEEDS A SPECIFIC KIND OF WRONG", body: "Hellraiser gets treated as a mood problem, not just a gore problem, with Rob Zombie, M. Night Shyamalan, and Ari Aster all proposed and immediately stress-tested." },
      { at: 5200, end: 5750, label: "FEDE ALVAREZ DRAWS NIGHTMARE", body: "Fede Alvarez is drafted for Nightmare, John Carpenter is rejected as a strange matchup, and the room keeps adding directors to franchises until the list becomes its own game." },
      { at: 5750, end: 5975, label: "PG-13 DOG DUTY AND LEE'S VOLVO", body: "The final button rejects a safe Nightmare, revives the dog-duty language, and lets Lee the Machine Bowers close the room through a Loomis/Volvo callback." },
    ]),
    highlights: Object.freeze([
      H(74, 82, "ROOM BREAK", "THE DINOSAUR WITH MEDICAL TERMINOLOGY", "A dinosaur introduction instantly becomes a medical-term joke about a ball sack, establishing that the trailer discussion will not stay respectable."),
      H(255, 263, "STRAIGHT TO STEVE'S ASSHOLE", "JURASSIC WORLD AS XBOX 360 DLC", "The trailer is dismissed as something that feels like downloadable content from an old Xbox 360 game, a clean Steve's Asshole entry for franchise fatigue."),
      H(390, 398, "MAJOR TOPIC TURN", "THE ORIGINAL JURASSIC PARK TEST", "The room sets one blunt standard: if the dinosaurs cannot look as good as the original Jurassic Park, stop making the movies."),
      H(515, 523, "WWAM UP IN YA", "THE FINGER THROUGH THE DOG POOP", "A morning cleanup story turns the trailer review into a sensory experience nobody asked to share, but everybody in the room remembers."),
      H(608, 616, "CHARACTER APPEARANCE", "LOOMIS AND SLENDERMAN SHARE A SUBWAY", "Tim 27 McChicken asks why Loomis hates the horror icons but likes Slenderman, and the answer creates a clean character-lore door."),
      H(682, 690, "FAN SIGNAL", "THE STU LIVES SUGGESTION", "The FAM pushes a Scream 7 flashback theory involving Billy, Stu, Roman, and Maureen, and the room immediately wants the resurrection-shaped version of it."),
      H(768, 776, "ROOM BREAK", "POOPY IN THE EYEBROW", "A fan callout about poop in an eyebrow collides with a COVID worry, giving the opening room a gross little personal subplot."),
      H(955, 963, "WWAM UP IN YA", "GARLIC STEAK NACHO FRIES ARE A REVELATION", "Taco Bell's garlic steak nacho fries get praised with the intensity of a franchise discovery, followed by the admission that a whole Mexican pizza disappeared."),
      H(1220, 1228, "SOUNDBYTE / REPLAY", "GOLDAR HITS THE MEGAZORD", "Power Rangers suddenly becomes a play-by-play desk: Goldar lands a two-legged kick and celebrates with aerial spins before the Megazord can process what happened."),
      H(1328, 1336, "STRAIGHT TO STEVE'S ASSHOLE", "THE MEGAZORD DOOR IS TOO EASY", "The commentary asks how Goldar enters the machine so easily, then compares it to a door nobody should be able to walk through."),
      H(1408, 1416, "SOUNDBYTE / REPLAY", "DOES YOUR PUNCH HAVE THERMAL POWER?", "The Power Rangers fight gets sent into physics court when a single punch destroys the machine and the room asks whether the fist has thermal power."),
      H(1548, 1556, "STRAIGHT TO STEVE'S ASSHOLE", "THE ROBERT EGGERS HALLOWEEN", "A Robert Eggers Halloween is imagined in ancient Celtic dialect, with the pitch ending in a naked fire ritual and a Steven Seagal joke."),
      H(1644, 1652, "ROOM BREAK", "THE PC THAT LOST THE WIRELESS FIGHT", "The microphone antenna barely touches the PC, the internet falls apart, and the computer's recommendation survey receives an answer that should not be printed."),
      H(1865, 1873, "MAJOR TOPIC TURN", "TARANTINO OR FLANAGAN FOR HALLOWEEN", "The Halloween director draft begins for real, with Tarantino, Robert Rodriguez, Mike Flanagan, and a chat poll reshaping the choices in the moment."),
      H(2128, 2136, "SOUNDBYTE / REPLAY", "THE POWER RANGERS GET WHOOPED", "The fight commentary reaches its loudest stretch: the Rangers skip the main-character advantage, get outclassed, and look like a team that lost before leaving the house."),
      H(2450, 2458, "WWAM UP IN YA", "GOLDAR IS THE GREATEST HATER", "After the Dragonzord arrives, Goldar attacks both sides and the room decides he did not want victory so much as he wanted everybody else to suffer."),
      H(2752, 2760, "TAKE GETS NUCLEAR", "MICHAEL MYERS' DIRTY TOES", "The Halloween draft goes somewhere no franchise pitch document would dare: Michael's feet, caked in dirt, become a recurring visual nightmare."),
      H(3050, 3058, "MAJOR TOPIC TURN", "NIGHTMARE GETS THE LONGER WAIT", "The room compares the last Jason and Freddy films, then decides Nightmare needs the more urgent return because the last bad one still hangs over the character."),
      H(3352, 3360, "FAN SIGNAL", "DAMIAN LEONE FOR NIGHTMARE", "A fan suggests Damian Leone for Nightmare on Elm Street, and the room sees the appeal of letting the Terrifier director go completely R-rated."),
      H(3650, 3658, "ROOM BREAK", "THE FART THAT BECAME THE T-VIRUS", "A bad fart is described as infecting the air like Resident Evil's T-virus, a full-room callback hiding inside a streaming-service discussion."),
      H(3956, 3964, "FAN SIGNAL", "TOMMY BOY WINGS", "A Super Chat about first dates turns into Tommy Boy, a potential girlfriend roll, and the promise to turn on the fryer and throw out chicken wings."),
      H(4240, 4248, "STRAIGHT TO STEVE'S ASSHOLE", "ROB ZOMBIE WOULD CAST HIS BARBECUE", "The Texas Chainsaw debate sends Rob Zombie to Steve's Asshole for casting the people from his backyard cookout, even while admitting the fit makes sense."),
      H(4552, 4560, "STRAIGHT TO STEVE'S ASSHOLE", "HELLRAISER'S WORST POSSIBLE PITCH", "Hellraiser's gore gets pushed into an intentionally over-the-top gang-rape joke, and the room immediately realizes why a specific mood matters more than just making it nastier."),
      H(4878, 4886, "TAKE GETS NUCLEAR", "ARI ASTER AT THE COFFEE SHOP", "Ari Aster's hypothetical style becomes a coffee-shop nightmare with Indiana Jones hats, the kind of visual that makes the director draft feel like its own comedy bit."),
      H(5162, 5170, "MAJOR TOPIC TURN", "FEDE ALVAREZ DRAWS NIGHTMARE", "Fede Alvarez is chosen for Nightmare because the room wants a genuinely hard-R return after too long away from the screen."),
      H(5425, 5433, "STRAIGHT TO STEVE'S ASSHOLE", "THE JOHN CARPENTER MISMATCH", "John Carpenter gets rejected for Nightmare as a weird matchup, even though the room still wants him somewhere in the franchise draft."),
      H(5690, 5698, "SOUNDBYTE / REPLAY", "PG-13 NIGHTMARE WOULD SUCK ASS", "The room draws a hard line under a safe Nightmare reboot: if the first move is PG-13, the whole thing is dog duty before it starts."),
      H(5850, 5858, "FAN SIGNAL", "LEE THE MACHINE BOWERS CLOSES THE DOOR", "Lee's message about his truck motor and Loomis's Volvo provides a real FAM callback instead of a generic sign-off."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 608, end: 963, label: "LOOMIS, STU, AND TACO BELL", topic: "the FAM changes the opening room", body: "Play from 10:08. Tim 27 McChicken, the Scream 7 theory, eyebrow poop, COVID worry, and garlic steak nacho fries show the audience steering the night's tone.", playAt: 608, playEnd: 963 }),
      hated: Object.freeze({ at: 255, end: 398, label: "JURASSIC WORLD AS DLC", topic: "franchise fatigue", body: "Play from 4:15. One side wants dinosaurs; the other wants the franchise to stop if it cannot beat the original Jurassic Park or escape the Xbox 360 feeling.", playAt: 255, playEnd: 398 }),
      wildestDetour: Object.freeze({ at: 1200, end: 2458, label: "THE GOLDAR FIGHT CALL", topic: "Power Rangers becomes combat sports", body: "Play from 20:00. Goldar, Megazord physics, the Dragonzord, and the greatest-hater ruling turn an old clip into a full WWAM play-by-play event.", playAt: 1200, playEnd: 2458 }),
      lastWord: Object.freeze({ at: 5162, end: 5858, label: "FEDE, PG-13, AND LEE'S VOLVO", topic: "the horror draft exits through the FAM", body: "Play from 1:26:02. Fede Alvarez gets Nightmare, PG-13 gets rejected, and Lee the Machine Bowers leaves the room with a Loomis/Volvo callback.", playAt: 5162, playEnd: 5858 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
