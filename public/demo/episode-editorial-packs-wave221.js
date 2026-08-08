(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "XGsR_X8INFs";
  var duration = 10782;
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

  /* May 29, 2024: a long room with Fallout 76, comedy and WNBA arguments,
     the Blumhouse Exorcist announcement, a Walmart bathroom legend, Killing
     Them Softly, Venom 3, Dr. Loomis casting, and an all-purpose sad-movie
     conversation. */
  var highlights = [
    H(0,180,"GAMING SIGNAL","THE FALLOUT 76 SOCIAL ECONOMY","Mike's in-game shopping trip becomes a lesson in emotes, camp vendors, and the strange intimacy of two strangers exchanging heart icons like it is currency."),
    H(180,360,"GAMING SIGNAL","THE DONKEY, THE SHOPPING CART, AND THE WIFE POV","A game-store detour turns into a gender-role bit: one host shops, the other stands around like a dad at Thanksgiving waiting for the mission to end."),
    H(360,540,"COMEDY READ","DAN SODER GETS DRAFTED AS DAVE CHAPPELLE","A story about a mistaken identity and a fake phone call becomes a clean example of WWAM's comedy rule: the setup is normal, the commitment is criminal."),
    H(540,720,"COMEDY READ","THE COMEDIAN'S ONE-STEP-TOO-FAR PROBLEM","Rogan's circle, joke theft, Ben Mendelsohn, and a sudden question about waking up with a boner establish the first comedy lane's mix of criticism and complete derailment."),
    H(720,900,"FILM READ","BEN MENDELSOHN AND THE VILLAIN FACE","The room recognizes Mendelsohn's range, then uses his Star Wars and James Bond work to talk about why certain actors arrive pre-loaded with villain energy."),
    H(900,1080,"WWAM UP IN YA","THE DOG-FIGHT FINISHING MOVE","A disagreement about a fight becomes a fictional wrestling finisher nobody should attempt. The clip is pure escalation, not advice."),
    H(1080,1260,"CHARACTER PERFORMANCE","SLENDERMAN, LOOMIS, AND THE MAY PROPHYLAXIS CHECK","A recurring character request, a FAM message, and a joke about staying ready bring the character universe into the first act.",["Slender Man","Dr. Loomis"]),
    H(1260,1440,"MUSIC READ","WHITNEY HOUSTON WINS THE VOCAL BRACKET","Mariah Carey, Whitney Houston, Eminem, and a dog smell become one strange music debate. The core verdict is not subtle: Whitney is the ceiling."),
    H(1440,1620,"FILM READ","NICHOLAS CAGE'S SUPERMAN BODY PROBLEM","A delayed superhero film and a potential actor get judged on body type, language, and the question of whether a comic-book part needs a perfect physical silhouette."),
    H(1620,1800,"MUSIC READ","THE SONG THAT MAKES MEN DIVORCE","A repetitive country song becomes an imaginary household weapon. The hosts explain exactly how a chorus can make a person hate an otherwise peaceful home."),
    H(1800,1980,"GAMING SIGNAL","COLLEGE FOOTBALL COMES BACK WITH A TROPHY CASE","The return of NCAA football gets a full nostalgia lane: player compensation, dynasty mode, Heisman awards, and the fear that everyone will choose the same powerhouse."),
    H(1980,2160,"NEWS REACTION","THE EXORCIST NEEDS A NEW TAKE","The Blumhouse announcement is treated as a surprise opportunity. The room hates the idea of a sequel-by-default but likes the possibility of a radical new approach."),
    H(2160,2340,"FILM READ","LEAVE THE PERFECT MOVIE ALONE","The hosts defend the original Exorcist, compare it with Doctor Sleep, and set a simple rule: if a new film exists, it needs its own identity rather than another copy of 1973."),
    H(2340,2520,"HALLOWEEN LORE","MIKE FLANAGAN GETS THE SHOT","Mike Flanagan's ability to go dark without Rob Zombie-style excess becomes the reason the room gives an Exorcist project a chance."),
    H(2520,2700,"FILM READ","TEXAS CHAINSAW TALES","A fan pitch grows into an anthology idea: different decades, different families, one Texas Chainsaw world, and the freedom to tell stories that do not require a single hero."),
    H(2700,2880,"FILM READ","CHILD'S PLAY HAS BECOME A CLOWN CAR","The hosts can still respect Brad Dourif while admitting that the Child's Play franchise became a different creature after the first movie."),
    H(2880,3060,"FILM READ","HORROR, STAR TREK, AND THE STRANGE STREAMING SHELF","A fan asks about supernatural content. The answer crosses Star Trek, horror series, and the broad question of why a good concept can still become a bad season."),
    H(3060,3240,"FILM READ","ARI ASTER DOUBLE FEATURE","A fan's first-time Ari Aster experience becomes a recommendation lane about tone, pacing, and the difference between a film people remember and a film they want to revisit."),
    H(3240,3420,"FILM READ","BEETLEJUICE 2 LOOKS PLASTIC","A back-pain check-in gives way to the new Beetlejuice trailer, the charm of the original, and the fear that practical effects can still feel like a product if the image is too clean."),
    H(3420,3600,"FILM READ","THE FRESH-FILM RATING PROBLEM","The hosts compare modern gore, *In a Violent Nature*, and *Terrifier 2*, asking when an excess of effects stops shocking and starts feeling like a comedy routine."),
    H(3600,3780,"STRAIGHT TO STEVE'S ASSHOLE","THE KROGER BATHROOM BATTLE","A no-carb plan, Memorial Day food, and an emergency trip through a grocery store become a full bodily survival story with a cart, cramps, and a neighboring stall."),
    H(3780,3960,"STRAIGHT TO STEVE'S ASSHOLE","THE GLAD HANDLE AND THE CONVENIENCE FLUSH","The story escalates through a deodorizer bottle, a flush with no handle, and the horrifying realization that the next guy may have skipped the part everyone assumes happened."),
    H(3960,4140,"STRAIGHT TO STEVE'S ASSHOLE","THE WALMART TOILET DEATH RUMOR","The hosts imagine the obituary: how did Jay die? A heart attack on a Walmart toilet becomes the episode's most complete Steve's Asshole lane."),
    H(4140,4320,"HALLOWEEN LORE","DAVID GORDON GREEN SHOULD HAVE STOPPED","The room separates respect for Halloween 2018 from frustration with a director who kept rethinking a simple fan-facing task until the mythology became noise."),
    H(4320,4500,"HALLOWEEN LORE","BLUMHOUSE IS NOT A FRIDAY SAFE HOUSE","Blumhouse's successes do not erase the feeling that a Friday the 13th property would be mishandled. The rights problem becomes part of the franchise story."),
    H(4500,4680,"HALLOWEEN LORE","THE HORROR UMBRELLA IS A TERRIBLE IDEA","A shared umbrella for Jason, Freddy, Ghostface, and the other icons sounds efficient until the hosts explain how quickly a quick-look universe would flatten each property."),
    H(4680,4860,"CHARACTER PERFORMANCE","LOOMIS ANSWERS A STU QUESTION","A fan asks whether Stu could return in Scream 7. The room lets Dr. Loomis answer first, then moves into the practical problem of bringing back a character the franchise already closed.",["Dr. Loomis"]),
    H(4860,5040,"WWAM UP IN YA","KROGER VERSUS WALMART BATHROOMS","The earlier emergency gets a callback. The hosts rank public restrooms like horror locations and refuse to let the story stay in the past."),
    H(5040,5220,"FILM READ","THE GOONIES IS A GREAT LOGO AND A GOOD MOVIE","A fan's Goonies question gets a nuanced answer: iconic, comforting, and not necessarily a yearly sacred text for everybody."),
    H(5220,5400,"FILM READ","FRIDAY NEEDS THE CASTING LIGHTNING AGAIN","The room argues that a new Jason movie cannot manufacture the original's magic by committee. The goal should be simple: find a cast that clicks, then get out of their way."),
    H(5400,5580,"FILM READ","BRIGHTBURN DESERVES A SECOND SHOT","A rumored sequel to the evil-Superman story gets a hopeful read. The premise is still simple, the hook still works, and the room wants the next film to grow rather than explain."),
    H(5580,5760,"HALLOWEEN LORE","HALLOWEEN ENDS NEEDED A BETTER ARC","The hosts return to the idea that Halloween Ends could have worked with more time, better character buildup, and a continuity that did not ask the audience to forget what 2018 established."),
    H(5760,5940,"FILM READ","KEEP THE SCREAM MASK A STAPLE","The room rejects a radical mask redesign. A side scene can get strange, but the main Ghostface mask is the franchise's visual handshake."),
    H(5940,6120,"FILM READ","DISASTER MOVIES IN 4K","Independence Day, Armageddon, Deep Impact, and expensive disc formats become a physical-media lane about buying the movie you already own again."),
    H(6120,6300,"ROOM BREAK","THE VAN, THE FRIENDS, AND THE WORST FUTURE","A fantasy about avoiding marriage and living in a van becomes a friendship bit before the room remembers Twisters and the danger of making promises about a movie nobody has seen."),
    H(6300,6480,"FILM READ","KILLING THEM SOFTLY GETS ITS DUE","The Patreon pick begins a full review of Brad Pitt, Ray Liotta, James Gandolfini, and a mob economy that is really an American economy story."),
    H(6480,6660,"FILM READ","THE MOB MOVIE AS THE BIG SHORT","The room sees Killing Them Softly as a criminal version of The Big Short: everyone is being squeezed, the system is rigged, and the dialogue is angry because the thesis is not wrong."),
    H(6660,6840,"FILM READ","BRAD PITT'S BEDROOM EYES CANNOT BE AN ENFORCER","Brad Pitt's casting gets debated against Ray Liotta, Gandolfini, and Scoot McNairy. The joke is physical; the observation about movie-star weight is real."),
    H(6840,7020,"FILM READ","THE MOVIE NEEDED MORE GANDOLFINI","The room likes the wounded performances and wishes the film spent more time with its flawed men rather than always admiring the structure around them."),
    H(7020,7200,"FILM READ","KILLING THEM SOFTLY IS AN EIGHT THAT COULD BE TEN","The final verdict is generous: grim, watchable, politically legible, and one extra scene away from being the masterpiece the hosts can see hiding inside it."),
    H(7200,7380,"FILM READ","DEADPOOL, MAGNETO, AND LOBO","The superhero chat compares Deadpool, Magneto, Lobo, Batman, and Superman. The useful point is that character popularity is not the same as screen time."),
    H(7380,7560,"FAM SIGNAL","PATRON REQUESTS GET A DOOR","The archive points fans toward the review-request tier, where a movie can become a full conversation rather than a passing mention."),
    H(7560,7740,"FILM READ","PREDATOR, RAMBO, AND THE SURVIVOR BRACKET","A hypothetical hunt ranks Predator against Rambo. The room keeps it grounded in tracking, terrain, and whether the human can become the monster without supernatural help."),
    H(7740,7920,"FAM SIGNAL","THE FAM'S STEPHEN KING SHELF","A fan asks for more King. The room names favorites, admits the list would change with more time, and lets the archive hold the uncertainty instead of pretending the ranking is final."),
    H(7920,8100,"FILM READ","SAD MOVIES ARE A DIFFERENT CATEGORY","A pile of depressing films, *The Whale*, *Manchester by the Sea*, *Leaving Las Vegas*, *Elephant Man*, *Forrest Gump*, and *Southpaw* become a community grief bracket."),
    H(8100,8280,"FILM READ","SCREAM'S MULTI-DAY PROBLEM","A new Scream structure is tested against the franchise's timeline. The hosts ask whether Ghostface can work over several days without losing the pressure of one night."),
    H(8280,8460,"FILM READ","STU'S RETURN IS A WHOLE SERIES","An old Stu script becomes a larger pitch: return the character, then use spin-offs or a limited series to fill the years the movies skipped."),
    H(8460,8640,"FILM READ","THE SADDEST MOVIE CONVERSATION","*Leaving Las Vegas*, *Elephant Man*, *Forrest Gump*, and *Southpaw* get ranked by what kind of sadness they leave behind: grief, loneliness, betrayal, or a life that cannot be repaired."),
    H(8640,8820,"FILM READ","TRUE ROMANCE AND THE BEST TALKING SCENES","The chat asks for favorite conversation scenes. The answer includes True Romance, Lethal Weapon, and the idea that a great scene can carry a film without a fight or a twist."),
    H(8820,9000,"FILM READ","MANCHESTER BY THE SEA IS A FULL-BODY HIT","The room agrees that some films are not sad because of one ending; the entire construction is designed to leave the viewer carrying the weight home."),
    H(9000,9180,"FILM READ","FINDERS FEE IS THE HIDDEN RECOMMENDATION","A forgotten title becomes a new recommendation: an underseen thriller, a short runtime, and a good first-watch door for fans who have burned through the obvious canon."),
    H(9180,9360,"CHARACTER PERFORMANCE","LOOMIS AT THE FRONT DOOR","A fan asks for an impossible Dr. Loomis fantasy. The reply stays in the character lane, treats the request as a bit, and keeps the doctor safely fictional.",["Dr. Loomis"]),
    H(9360,9540,"CHARACTER PERFORMANCE","WALLBERG AND LOOMIS WISH JENNIFER A BIRTHDAY","A 40th-birthday shout-out becomes a Mark Wahlberg/Dr. Loomis double feature, complete with a roller-coaster apology and an immediate attempt to behave.",["Mark Wahlberg","Dr. Loomis"]),
    H(9540,9720,"MUSIC READ","SIMPLE PLAN CONFUSES THE SCHOOL PICTURE","A concert memory turns into a story about being mistaken for Pierre from Simple Plan, fake cool jeans, and the social violence of being a kid who thinks his outfit is working."),
    H(9720,9900,"FILM READ","FEAR IS A REWATCHABLE MONSTER","The hosts defend Fear as a film they can watch repeatedly, then let the conversation slide into a recognizable fan-facing character bit.") ,
    H(9900,10080,"FILM READ","THE FIFTH ELEMENT VERSUS LOOPER","A Bruce Willis ranking becomes a clean genre argument: Looper, The Fifth Element, and the problem with picking a favorite outside Die Hard."),
    H(10080,10260,"FAM SIGNAL","THE TEACHER WHO MOVED HIS THIRD GRADERS UP","A teacher finishes the school year and gets a genuine thank-you. The hosts keep the praise real, then immediately threaten the children with future WWAM knowledge."),
    H(10260,10440,"GAMING SIGNAL","ROBOCOP'S ONE-LEVEL COMMITMENT","A fan asks about the RoboCop game. Mike admits he bought it, played one level, and moved on; Jay's gaming standards are even less defensible."),
    H(10440,10620,"FAM SIGNAL","THE GODZILLA SCHOOL PICTURE","A childhood show-and-tell prop, giant Nike shoes, and a sports dream become a full origin story for the wardrobe the chat is now allowed to mock."),
    H(10620,10782,"CLOSING READ","THE CAMERA, THE TOUR, AND THE FINAL SHORTS","Simple Plan, Saturday Night Live, Patreon's next room, and a final Mark Wahlberg voice close the stream with the FAM thanked and the camera barely surviving.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the May 29, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 41457,
      captionEvents: 10498,
      captionSpanSeconds: 10782.119,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "c4aac88d489c60964ca0d0ec668a1fb6514224835e7cd15235a31f014c7d82ca",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "ae4c8eb86ae9de73a8fc9c7fa9971832476b6eb34e43e53e5abd642cc3ad6684",
      asrWindowCount: 46,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "WEDNESDAY NIGHT LIVE // MAY 29, 2024",
    badge: "FULL SHOW WIKI // EXORCIST, TEXAS CHAINSAW, KILLING THEM SOFTLY, AND VENOM 3",
    headline: "THE KROGER TOILET SURVIVAL STORY, THE EXORCIST REBOOT ARGUMENT, AND KILLING THEM SOFTLY AS THE BIG SHORT",
    deck: "A long Wednesday room that starts with Fallout 76 and comedy, survives a public-bathroom apocalypse, then settles into horror franchise policy, mob economics, sad movies, and a Tom Hardy-free fan farewell.",
    overview: "The May 29 room has the loose, generous shape of a real WWAM night. It opens with Fallout 76 shopping, emotes, and a donkey joke before moving into comedy: Dan Soder as fake Dave Chappelle, Ben Mendelsohn's villain face, Joe Rogan's orbit, weed-as-personality, and the problem of a comedian taking one step too far. Caitlin Clark and the WNBA get a full sports lane about attendance, targeting, and the league's strange relationship with its breakout star. The Exorcist announcement then becomes the serious anchor. The hosts defend the original as nearly perfect, admit Mike Flanagan deserves a chance, and imagine a radical take that would rather be its own film than a retread. Texas Chainsaw gets an anthology pitch, Child's Play gets a blunt post-original diagnosis, Ari Aster gets a gateway recommendation, and Beetlejuice 2 gets judged for its practical-effects promise versus its plastic finish. The funniest section is also the most specific: a Kroger bathroom emergency involving cramps, a cart, a convenience flush, a Glade handle, and a neighboring stall that may not have wiped. The back half is an excellent *Killing Them Softly* dossier disguised as a livestream: Brad Pitt, Ray Liotta, James Gandolfini, mob economics, the Big Short comparison, and the feeling that an eight could have been a ten with one more scene. From there the FAM asks about Deadpool, Predator, Scream, Stu, sad movies, True Romance, *Finders Fee*, Dr. Loomis casting, birthday shout-outs, Bruce Willis, Stephen King, RoboCop, and a childhood Godzilla photo. This is exactly the kind of tape where “topic count” misses the point; the page needs the detours, the callbacks, and the community doors because those are the show.",
    topics: Object.freeze(["The Exorcist", "Texas Chainsaw Massacre", "Killing Them Softly", "Venom", "Dr. Loomis", "Mark Wahlberg", "Fallout 76", "Caitlin Clark", "Scream", "Stu Macher", "Alien", "Predator", "The Goonies", "Bruce Willis", "Stephen King", "The FAM"]),
    story: Object.freeze([
      { at: 0, end: 1080, label: "FALLOUT, COMEDIANS, AND THE DOG-FIGHT BIT", body: "Game shopping, fake celebrity calls, Joe Rogan's orbit, Ben Mendelsohn, and a finishing move nobody should attempt make the opening feel like a full room before the news begins." },
      { at: 1080, end: 2160, label: "MUSIC, COLLEGE FOOTBALL, AND THE EXORCIST ANNOUNCEMENT", body: "Whitney wins the vocal bracket, NCAA football returns, and Blumhouse's new Exorcist plan gets the first serious reading." },
      { at: 2160, end: 3240, label: "FLANAGAN, TEXAS CHAINSAW, AND CHILD'S PLAY", body: "The hosts defend the original Exorcist, give Flanagan a chance, sketch Texas Chainsaw Tales, and admit Child's Play became a different franchise." },
      { at: 3240, end: 4320, label: "ARI ASTER, BEETLEJUICE, AND THE KROGER TOILET", body: "Ari Aster, Slasher, Beetlejuice 2, Terrifier gore, and the Kroger bathroom survival story create the show's most replayable hour." },
      { at: 4320, end: 5400, label: "HALLOWEEN ENDS, BLUMHOUSE, AND THE GOONIES", body: "David Gordon Green, Blumhouse's Friday problem, a shared horror umbrella, Scream's Stu question, and The Goonies keep the franchise lane fan-facing." },
      { at: 5400, end: 6480, label: "BRIGHTBURN, HALLOWEEN'S STAPLES, AND KILLING THEM SOFTLY", body: "Brightburn, Halloween's mask, disaster movies, Twisters, and the first pass at the Patreon mob-movie review bridge horror and crime." },
      { at: 6480, end: 7560, label: "THE MOB MOVIE AS AN AMERICAN ECONOMY STORY", body: "Killing Them Softly gets its full thesis: flawed men, a collapsing economy, Brad Pitt's cool, Gandolfini's weakness, and the extra scene that might have made it a ten." },
      { at: 7560, end: 8640, label: "DEADPOOL, PREDATOR, SCREAM, AND THE SAD BRACKET", body: "Superhero popularity, the survivor bracket, Stephen King, Scream's multi-day problem, Stu's series potential, and sad films become one big fan question." },
      { at: 8640, end: 9720, label: "TRUE ROMANCE, LOOMIS, AND BIRTHDAY VOICES", body: "Favorite conversation scenes, Manchester by the Sea, Finders Fee, Dr. Loomis, and a Mark Wahlberg birthday shout-out turn the final act into a community scrapbook." },
      { at: 9720, end: 10782, label: "BRUCE WILLIS, ROBOCOP, GODZILLA, AND THE FAM GOODNIGHT", body: "Fear, The Fifth Element, Stephen King books, RoboCop, a school picture, Simple Plan, and the next Patreon room close a very full Wednesday tape." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 6300, end: 7200, label: "KILLING THEM SOFTLY AS THE BIG SHORT", topic: "a mob movie that is secretly an economy movie", body: "Play from 1:45:00. The Patreon pick gets a full, serious treatment and the clearest thesis in the episode.", playAt: 6300, playEnd: 7200 }),
      hated: Object.freeze({ at: 1980, end: 2700, label: "THE EXORCIST RETREAD PROBLEM", topic: "do not remake a perfect movie by committee", body: "Play from 33:00. The room gives Flanagan a chance while still demanding a new identity instead of another 1973 photocopy.", playAt: 1980, playEnd: 2700 }),
      wildestDetour: Object.freeze({ at: 3600, end: 4320, label: "THE KROGER TOILET SURVIVAL STORY", topic: "a cart, a Glade bottle, and the worst flush in Kentucky", body: "Play from 1:00:00. The complete public-bathroom arc is exactly why a topic list is not a Show Wiki.", playAt: 3600, playEnd: 4320 }),
      lastWord: Object.freeze({ at: 9180, end: 9720, label: "LOOMIS AND WALLBERG WISH JENNIFER A BIRTHDAY", topic: "the character universe is a fan-controlled stage", body: "Play from 2:33:00. A birthday request gets two character voices and the kind of immediate improvisation the archive is built to preserve.", playAt: 9180, playEnd: 9720 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
