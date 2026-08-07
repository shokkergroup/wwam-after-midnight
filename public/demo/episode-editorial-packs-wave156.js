(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "zwhIoucUkyM", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
  };

  /* January 15, 2025: Daredevil Born Again, Gremlins/Goonies news, Michael Myers fan film, and Xbox Prime rumors. */
  sources["zwhIoucUkyM"] = Object.freeze({
    sourceId: "zwhIoucUkyM",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; complete caption ledger and local audio windows across the January 15, 2025 horror/action movie-news room",
    evidence: Object.freeze({
      duration: 7199,
      captionWords: 25952,
      captionEvents: 3463,
      captionSpanSeconds: 7200.48,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:669a41edfe752f81980034b4616f208f39ec28e7de7d91022da461e3f66fbb26",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:576e202c9a35845414df23cf29ea373aeeb68214c54514ed590581c0c5b546df",
      asrWindowCount: 34,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE POOP VOLCANO, THE MICHAEL MYERS DRUG-DEALER FAN FILM, AND XBOX PRIME // JANUARY 15, 2025",
    badge: "FULL SHOW WIKI // 1:59:59 OF DAREDEVIL SOFT-REBOOT TALK, GREMLINS NEWS, WOLF MAN REVIEW BULLSHIT, AND CONSOLE DOOM",
    headline: "MICHAEL MYERS GETS A DRUG-DEALER JUMPSUIT; WOLF MAN REVIEWS WRITE POETRY; XBOX PRIME MAY EAT THE CONSOLE",
    deck: "The room fixes a router with violence, reviews Daredevil's Born Again strategy, watches a homemade Myers trailer, calls out Rotten Tomatoes poetry, and ends by asking whether Xbox is becoming Netflix with a controller.",
    overview: "The January 15 WWAM Video starts with the most WWAM repair manual imaginable: beat the router, beg it for forgiveness, and hope the internet stops acting like a personal enemy. The opening bathroom story is volcanic enough to become the stream's first recurring image. Daredevil: Born Again then gets a surprisingly coherent breakdown. The hosts read it as a soft reboot after season two, with the violence preserved and the Defender-era baggage quietly moved out of frame. Charlie Cox's reputation as a genuinely kind convention guest gets defended, while Echo is remembered as a show almost nobody wanted to revisit. The news desk widens into social-media rot: the hosts admit to watching hours of arrest and crash videos, joke about Elon Musk and MrBeast buying platforms, and turn a fan's truck-repair problem into an improvised donation desk. The real movie news arrives when Warner Bros. quietly buries new Gremlins, Goonies, Matrix, Clayface, and Practical Magic developments in a corporate article. A fan-made Michael Myers film then hijacks the show. The location, the Dallas Cowboys/section-eight jumpsuit, the Tony Soprano energy, and the promise of a full 30-minute cut are all treated as a stronger invitation than many studio trailers. The Wolf Man review follow-up is more pointed. Rotten Tomatoes' poetic blurbs are translated into normal English: the movie tried to explore humanity, lost its teeth, and apparently wants to be Rob Zombie's alcoholic marriage drama. Resident Evil Zero gets a full game-story explainer around Rebecca Chambers, Bravo Team, the mansion, and the T-virus. A Star Wars Old Republic rumor is immediately assigned to the dogshit pile. The FAM keeps the show from becoming a news digest: Retro Rick gets a channel shout-out and an adult-toy misunderstanding, a fan mentions Romero's Zombie Autopsies book, and the chat keeps the room's crude language moving. The final act turns to Xbox Prime, Game Pass, streaming hardware, and the loss of physical media. The source never settles the rumor as fact; it captures a room watching the future of consoles become a subscription with a name that sounds like Amazon. The sign-off promises three live days, better internet, and another chance to make the archive stranger.",
    story: Object.freeze([
      { at: 0, end: 600, label: "BEAT THE ROUTER, BEG THE ROUTER", body: "A shaky internet connection is repaired through physical intimidation and apology. The room then celebrates a bathroom catastrophe that arrives with the force of a volcano." },
      { at: 600, end: 1200, label: "DAREDEVIL BORN AGAIN WANTS A CLEAN SLATE", body: "Born Again is read as a soft reboot: preserve season-three violence, step away from the Defender baggage, and let Charlie Cox's Daredevil move forward without pretending every old plot is sacred." },
      { at: 1200, end: 1800, label: "ECHO, CHARLIE COX, AND THE BLIND-COMMUNITY PANDERING JOKE", body: "The room remembers Echo's weak cultural footprint, praises Cox's fan interactions, and turns that praise into a deliberately terrible accusation of pandering." },
      { at: 1800, end: 2400, label: "THREE LIVE DAYS AND TWITTER'S GORE BASEMENT", body: "WWAM announces its Tuesday-Wednesday-Thursday schedule, then admits the hosts use violent arrest and crash videos as an emotional pressure release." },
      { at: 2400, end: 3000, label: "THE TRUCK FUND, THE COMMANDERS, AND THE NUDES", body: "A fan's dead motor becomes a practical advice lane, Washington football gets renamed back and forth, and the chat asks for pictures nobody wants to see." },
      { at: 3000, end: 3600, label: "MRBEAST, ELON, HASBRO, AND THE BURIED GREMLINS STORY", body: "The room speculates about platform ownership, Elon buying Hasbro, and Warner Bros. hiding new Gremlins, Goonies, Matrix, Clayface, and Practical Magic projects inside corporate copy." },
      { at: 3600, end: 4200, label: "THE GREMLINS / GOONIES / MATRIX NEWS DESK", body: "Gremlins gets the cleanest excitement, Goonies gets a cautious maybe, and Drew Goddard's Matrix possibility earns a genuine vote of confidence." },
      { at: 4200, end: 4800, label: "THE MICHAEL MYERS DRUG-DEALER FAN FILM", body: "A homemade Myers trailer, a Dallas Cowboys jumpsuit, Tony Soprano comparisons, and a promise to watch a full fan cut become the episode's most joyful discovery." },
      { at: 4800, end: 5400, label: "ROTTEN TOMATOES POETRY GETS TRANSLATED", body: "The room rewrites vague Wolf Man blurbs into plain language: the movie tried, lost its teeth, and may be a Rob Zombie marriage drama with a werewolf attached." },
      { at: 5400, end: 6000, label: "RESIDENT EVIL ZERO AND THE T-VIRUS DOOR", body: "A fan asks about Resident Evil Zero and receives a real story map: Bravo Team, Rebecca Chambers, the train yard, the mansion, and the T-virus origin." },
      { at: 6000, end: 6600, label: "RETRO RICK, ZOMBIE AUTOPSIES, AND OLD-REPUBLIC DOOM", body: "A creator shout-out gets derailed by an adult-toy misunderstanding, Romero's Zombie Autopsies earns a reading-list receipt, and an Old Republic rumor is rejected on sight." },
      { at: 6600, end: 7199, label: "XBOX PRIME AND THE STREAMING FUTURE", body: "The rumored Xbox Prime becomes a proxy war over Game Pass, streaming, handheld hardware, and the death of physical copies. The room is curious, skeptical, and still willing to play." },
    ]),
    highlights: Object.freeze([
      H(28, 44, "WWAM UP IN YA", "SHAKE THE ROUTER UNTIL IT BEHAVES", "The internet is repaired by lifting the router, shaking it, and asking the machine to stop ruining everyone's day."),
      H(154, 170, "SOUNDBYTE / REPLAY", "MOUNT VULCANO IN THE POWER BOWL", "A healthy meal becomes an explosive gastrointestinal event with enough magma imagery for a disaster movie."),
      H(382, 398, "STRAIGHT TO STEVE'S ASSHOLE", "THE COURTESY FLUSH OF DOOM", "The opening bathroom story is edited into a tiny disaster-film receipt: protein, fiber, and a toilet that has seen too much."),
      H(648, 664, "DEEP DIVE", "DAREDEVIL BORN AGAIN IS A SOFT REBOOT", "The series is framed as a clean continuation after season two, with the Defender detour treated as optional history."),
      H(842, 858, "FAN SIGNAL", "CHARLIE COX IS TOO NICE FOR THIS ROOM", "A fan-facing actor gets a sincere defense before the hosts turn that kindness into a terrible pandering joke."),
      H(1010, 1026, "TAKE GETS NUCLEAR", "ECHO WAS NEVER THE FUTURE", "The room says the quiet part out loud: the show existed to move pieces around and almost nobody wanted the destination."),
      H(1186, 1202, "CHARACTER SIGNAL", "THE DAREDEVIL FACE UNDER THE MASK", "A fantasy of playing the hero becomes a little character bit about smiling because you cannot believe you got the job."),
      H(1392, 1408, "COMMUNITY MEMORY", "WWAM IS LIVE TUESDAY, WEDNESDAY, THURSDAY", "The audience gets the new schedule and the hosts immediately regret how many reminder posts it will require."),
      H(1618, 1634, "WWAM UP IN YA", "TWITTER'S ARREST-VIDEO BASEMENT", "The hosts admit that hours of crashes and arrests function like a pressure valve, then realize that is not a normal hobby."),
      H(1816, 1832, "TAKE GETS NUCLEAR", "THE INTERNET GORE RELEASE VALVE", "Violent clips are described as a mental reset, not entertainment, but the room knows exactly how bad that explanation sounds."),
      H(2078, 2094, "FAN SIGNAL", "LEE'S DEAD MOTOR GETS A REPAIR DESK", "A fan's truck trouble turns the show into a crude but affectionate advice lane about engines, blocks, rotors, and whether a new truck is cheaper."),
      H(2276, 2292, "STRAIGHT TO STEVE'S ASSHOLE", "COMMANDERS OR THE REDSKINS AGAIN", "Football team names become a time machine, with the room unable to hear Washington Commanders without asking when the created Madden team arrived."),
      H(2474, 2490, "FAN SIGNAL", "THE CHAT DOES NOT NEED THE NUDES", "A fan joke about old white dudes' nudes gets answered with the least flattering possible audience analysis."),
      H(2708, 2724, "TAKE GETS NUCLEAR", "MRBEAST WANTS TIKTOK, PROBABLY", "The room wonders whether platform money has become so absurd that buying an entire app is just another afternoon project."),
      H(2936, 2952, "DEEP DIVE", "ELON WANTS HASBRO FOR THE TOYS", "The rumor is treated as a billionaire asking how much the toy company costs because he ran out of normal hobbies."),
      H(3124, 3140, "FAN SIGNAL", "GREMLINS IS BURIED IN THE ARTICLE", "Warner Bros. apparently slips a new Gremlins movie into a feature-business story, and the room calls out the buried lead."),
      H(3298, 3314, "DEEP DIVE", "GOONIES GETS A CAREFUL MAYBE", "The hosts respect the original without worshipping it, leaving a sequel treatment in the dangerous zone between nostalgia and a terrible idea."),
      H(3474, 3490, "TAKE GETS NUCLEAR", "DREW GODDARD AND THE MATRIX", "Cabin in the Woods buys Drew Goddard a real chance to do something strange with a new Matrix movie."),
      H(3688, 3704, "SOUNDBYTE / REPLAY", "THE NEW GREMLINS MOVIE GETS A YES", "Christopher Columbus returning to the property creates the rare clean excitement in a corporate-news segment."),
      H(4248, 4264, "FAN SIGNAL", "THE MICHAEL MYERS FAN TRAILER", "A fan-made Myers clip arrives and immediately gets a bigger reaction than several studio trailers discussed this week."),
      H(4362, 4378, "WWAM UP IN YA", "MICHAEL IN A SECTION-EIGHT JUMPSUIT", "The killer's costume gets read as Dallas Cowboys gear, Tony Soprano's castoffs, and a drug dealer's uniform all at once."),
      H(4498, 4514, "DEEP DIVE", "MAKE THE THIRTY-MINUTE FAN FILM", "The room asks the creator for a full half-hour version and promises to watch it live if the story gets finished."),
      H(4668, 4684, "STRAIGHT TO STEVE'S ASSHOLE", "THE LAST STEP TO KUBRICK", "The fan-film location gets compared to Bloodsport, secret entrances, and a cinematic journey that ends in a suspiciously awkward room."),
      H(4894, 4910, "TAKE GETS NUCLEAR", "ROTTEN TOMATOES TRANSLATED TO ENGLISH", "Poetic review language gets stripped down to the real verdict: it tried to explore humanity and the wolf still lost its teeth."),
      H(5082, 5098, "STRAIGHT TO STEVE'S ASSHOLE", "WOLF MAN IS ROB ZOMBIE'S MARRIAGE DRAMA", "The room imagines a werewolf movie where the monster is secondary to alcoholism, marital collapse, and a miserable house."),
      H(5264, 5280, "FAN SIGNAL", "RESIDENT EVIL ZERO EXPLAINER", "A fan gets a real primer on Rebecca Chambers, Bravo Team, the mansion, and the T-virus instead of a shrug."),
      H(5452, 5468, "DEEP DIVE", "THE TRAIN YARD TO THE MANSION", "The Resident Evil Zero story door is mapped through the train, the partnership, the zombies, and the escape route into the mansion."),
      H(5682, 5698, "TAKE GETS NUCLEAR", "OLD REPUBLIC RUMOR, NEW DOGSHIT", "The Star Wars rumor gets rejected before it can become a full article, because the room already knows what Disney would do to it."),
      H(5888, 5904, "COMMUNITY MEMORY", "RETRO RICK GETS A CHANNEL DOOR", "A viewer recommends a retro-game channel and the room grudgingly allows one outside link before demanding privacy around the store's toys."),
      H(6064, 6080, "SOUNDBYTE / REPLAY", "ZOMBIE AUTOPSIES IS THE READING LIST", "The Romero-associated book becomes a real archive lead for viewers who want the science-fiction side of the creator's old ideas."),
      H(6242, 6258, "WWAM UP IN YA", "THE PRIVATE ADULT-TOY STORE", "A vintage toy-store recommendation becomes an adult-toy misunderstanding and a hygiene lecture that nobody requested."),
      H(6438, 6454, "DEEP DIVE", "XBOX PRIME SOUNDS LIKE AMAZON", "The rumored console name is judged as exactly the kind of branding Microsoft would choose for a Game Pass-first future."),
      H(6608, 6624, "TAKE GETS NUCLEAR", "THE CONSOLE BECOMES A STREAMING SUBSCRIPTION", "The room imagines Xbox abandoning hardware for a Netflix-like service while still admitting a handheld streaming device could be useful."),
      H(6798, 6814, "FAN SIGNAL", "PHYSICAL COPIES GO THE WAY OF THE DINOSAUR", "The chat's fear is clear: even a good streaming future feels worse when a purchase can become a revoked license."),
      H(6998, 7014, "SOUNDBYTE / REPLAY", "STEAM DECK IS NOT A STEAM DECK", "A handheld PC explanation is derailed by the phrase 'take a big shit on a deck,' proving the product name was doomed in this room."),
      H(7138, 7154, "COMMUNITY MEMORY", "THREE LIVE DAYS, MORE TECHNICAL PAIN", "The promise to keep improving Tuesday, Wednesday, and Thursday streams turns the glitches into part of the show's ongoing lore."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 4248, end: 4684, label: "THE MICHAEL MYERS FAN-FILM DOOR", topic: "the homemade trailer and the promise of a full cut", body: "Play from 1:10:48. The jumpsuit, the location, and the request for a 30-minute version create the episode's cleanest burst of fan-powered excitement.", playAt: 4248, playEnd: 4684 }),
      hated: Object.freeze({ at: 4894, end: 5120, label: "WOLF MAN REVIEW POETRY", topic: "pretty words hiding a bluntly negative review", body: "Play from 1:21:34. The room translates the review copy into plain language and asks why critics cannot just say the movie did not work.", playAt: 4894, playEnd: 5120 }),
      wildestDetour: Object.freeze({ at: 1560, end: 1840, label: "TWITTER'S GORE BASEMENT", topic: "violent clips as a mental pressure valve", body: "Play from 26:00. The room admits to watching crash and arrest videos for hours, then tries to explain why that supposedly helps.", playAt: 1560, playEnd: 1840 }),
      lastWord: Object.freeze({ at: 6438, end: 7154, label: "XBOX PRIME AND THE LICENSE FUTURE", topic: "streaming hardware, Game Pass, and physical-media anxiety", body: "Play from 1:47:18. The final news lane turns a rumor into a real question about ownership, hardware, and the console industry's next shape.", playAt: 6438, playEnd: 7154 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-07",
    sources: Object.freeze(sources),
  });
})(window);
