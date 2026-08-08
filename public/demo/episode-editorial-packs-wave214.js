(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "fH3kzyK_PlA";
  var duration = 10280;
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

  /* July 12, 2024: a full FAM room with Eminem, Longlegs, Marvel fatigue,
     horror rankings, recurring character bits, family advice, and a beer
     taste-test that should have been stopped by a responsible adult. */
  var highlights = [
    H(0,180,"ROOM BREAK","THE STREAM OPENS IN THE WRONG TAB","Mike and J get the room moving through a StreamYard wobble, a Captain America trailer they decline to play, and the first reminder that this is a conversation, not a press junket."),
    H(180,360,"FAM SIGNAL","BENJAMIN SHELBY GETS THE FIRST HELLO","A superchat and an editing shout-out set the tone: the room notices the people who keep the channel alive before it starts arguing about movies."),
    H(360,540,"FILM READ","THE DEATH OF SLIM SHADY GETS A TWO-SIDED VERDICT","The first half of Eminem's album gets an old-school thumbs-up; the second half is called feature-heavy. The beats and self-cancellation concept survive the cross-examination."),
    H(540,720,"NEWS REACTION","DOXXING IS NOT A DOCUMENTARY GENRE","A sensitive creator story becomes an ethics lane. The hosts condemn turning private pain into spectacle and keep the focus on empathy, consent, and the limits of audience entitlement."),
    H(720,900,"CHARACTER PERFORMANCE","LOOMIS AND CHALLIS HIT THE BRAKES","A Lee superchat summons the recurring doctors, then the improv gets cut short when the premise wanders somewhere it should not. The playable receipt is the abrupt retreat, not the unsafe material.",["Dr. Loomis","Dr. Challis"]),
    H(900,1080,"LORE DOOR","J HAS NOT SEEN KILL BILL","The room discovers another giant blind spot in the film canon and immediately invents a Halloween Horror Month plan involving unseen movies, a locked room, and a suspiciously enthusiastic Puppet Master."),
    H(1080,1260,"FAM SIGNAL","RHINO'S LOSS CHANGES THE TEMPERATURE","A fan shares that his wife died from cancer. The jokes stop, the hosts answer with real affection, and the archive keeps the moment as a community-care receipt rather than a tragedy soundbite."),
    H(1260,1440,"FILM READ","IN A VIOLENT NATURE GETS A SHUDDER BOOST","The film's audacious point of view and nasty ending win the room. Shudder's price gets debated because a great recommendation still has to survive a monthly bill."),
    H(1440,1620,"TRAILER ROOM","GLADIATOR 2 LOOKS EXPENSIVE AND UNNECESSARY","The trailer is treated as a craft object and a sequel question: sharks in a Coliseum are memorable, but spectacle cannot replace a reason to return."),
    H(1620,1800,"NEWS REACTION","MARVEL FEELS LIKE A DISNEY+ ASSIGNMENT","Deadpool & Wolverine gets huge expectations while the wider Marvel machine is accused of looking plastic. The room's fix is simple: make adult movies for theaters and let the kids' material breathe elsewhere."),
    H(1800,1980,"FILM READ","X-MEN IS AN OUTSIDER STORY, NOT A COSTUME ARGUMENT","The X-Men conversation separates the metaphor from the internet noise. The hosts defend the outsider theme and ask for stories with actual emotional stakes."),
    H(1980,2160,"CHARACTER PERFORMANCE","DR. LOOMIS' HORROR SURVIVAL ADVICE","Asked how to survive a horror movie, Loomis gives the safest possible answer: do not volunteer to be in one. The bit works because the doctor sounds tired of explaining this.",["Dr. Loomis"]),
    H(2160,2340,"NEWS REACTION","SHELLEY DUVALL GETS A RESPECTFUL REMEMBRANCE","The room remembers Duvall's warmth, then talks about how Stanley Kubrick's process and later media exploitation changed the way audiences discuss performance."),
    H(2340,2520,"GAMING DOOR","STARFIELD, D&D, AND NCAA FOOTBALL 25","Jay explains why Starfield's bugs and endless systems pushed him away while the room gets genuinely excited about tabletop play and a new college-football game."),
    H(2520,2700,"FILM READ","THE LIVE TEN-OUT-OF-TEN HORROR LIST","Halloween, Scream, Shaun of the Dead, Dawn of the Dead, The Exorcist, The Lost Boys, Silver Bullet, and An American Werewolf in London become the first draft of a canon the FAM can fight over."),
    H(2700,2880,"ROOM BREAK","VIEWER COUNT ANXIETY HAS A SOUND","The number climbs, the hosts notice it, and suddenly a normal live chat feels like a stadium. StreamYard's interface becomes an accidental third host."),
    H(2880,3060,"TECHNICAL CHAOS","THE TWO-SCREEN MOUSE DISASTER","A bathroom break and a missing mouse turn the control room into a low-budget heist. The room keeps talking while Jay tries to operate the show from the wrong side of the desk."),
    H(3060,3240,"FILM READ","HEAVYWEIGHTS BEATS THE SANDLOT FIGHT","The comedy-movie argument gets personal: nostalgia is not a free pass, and a film's rewatch value matters more than which childhood memory wins the loudest."),
    H(3240,3420,"VERDICT","IN A VIOLENT NATURE EARNS THE ENDING","The hosts return to the Shudder film and agree that its final turn is the kind of choice that makes a horror crowd gasp before it can decide whether to applaud."),
    H(3420,3600,"FILM READ","LONGLEGS WOULD HAVE BEEN BETTER IN 1997","The movie's cable-era mystery, oddball marketing, and Cage performance get a midnight-TV defense. The room keeps the praise specific instead of pretending hype is evidence."),
    H(3600,3780,"FILM READ","CLERKS 3 HURTS ON PURPOSE","Dante and Randal's friendship, the emotional ending, and Kevin Smith's willingness to make the joke stop all get a rare sincere treatment from the room."),
    H(3780,3960,"COMMUNITY DOOR","FASTING ADVICE WITHOUT THE FITNESS CULT","The hosts discuss easing into a shorter eating window, cutting back on daily drinking, and leaving room for a cheat day. It is practical, personal advice rather than a miracle plan."),
    H(3960,4140,"FILM READ","COBRA KAI'S FINAL SEASON HAS A LOT TO PROVE","The screener excitement is real, but the room worries about retcons and emotional credit. The point is not to hate the show; it is to make the final season earn its finale."),
    H(4140,4320,"LORE DOOR","THE EARLY-2000S REMAKE LADDER","The ranking lands: 2003 Texas Chainsaw Massacre above Friday the 13th 2009, above Rob Zombie's Halloween, with Halloween 4 and Friday Part 5 joining the franchise argument."),
    H(4320,4500,"VERDICT","LONGLEGS RATINGS SPLIT THE DIFFERENCE","Cage's wildest choices get the highest marks, while the overall film lands in the 7.5-to-10 conversation. The caveat is the useful part: the room likes it without crowning it by force."),
    H(4500,4680,"TRAILER ROOM","CAPTAIN AMERICA: STEVE, SAM, AND FRANCHISE FATIGUE","The hosts clarify that their objection is to the franchise machine and trailer choices, not the new Captain. The archive keeps the argument about storytelling and audience trust."),
    H(4680,4860,"NEWS REACTION","LONGLEGS' OPENING WEEKEND BECOMES A HYPE TEST","A reported $20 million opening becomes a conversation about marketing, word of mouth, and whether a movie can be both a hit and over-promised."),
    H(4860,5040,"COMMUNITY DOOR","SCAREFEST ADVICE FROM PEOPLE WHO ACTUALLY GO","The room trades practical convention advice: plan the day, protect your energy, and remember that the best fan event is one where you still have a voice by the end."),
    H(5040,5220,"CHARACTER PERFORMANCE","SLENDERMAN RUNS FOR PRESIDENT","A fan-requested debate answer summons Slenderman. The fake candidate is unnervingly calm, which is more reassuring than most real campaign footage.",["Slenderman"]),
    H(5220,5400,"LORE DOOR","HALLOWEEN CANNOT LIVE ON THE FIRST MOVIE FOREVER","The hosts want the franchise to explore its later characters and mythology instead of rebooting the same night again. The complaint is repetition, not a lack of love for Michael Myers."),
    H(5400,5580,"NEWS REACTION","SHELLEY DUVALL AND THE COST OF A GREAT PERFORMANCE","The remembrance returns to exploitation, the difference between difficult filmmaking and cruelty, and why the performer should remain visible in the conversation."),
    H(5580,5760,"FILM READ","CAGE, MANSON COMPARISONS, AND OSCAR ODDNESS","Nicolas Cage's Longlegs performance gets compared to a rock-star persona, then the room asks why horror performances are so often treated as unserious by awards voters."),
    H(5760,5940,"FILM READ","THE HORROR TEN IS STILL OPEN FOR ARGUMENT","The list grows through fan suggestions and disagreement. The archive preserves the debate instead of freezing a fake definitive ranking."),
    H(5940,6120,"CHARACTER PERFORMANCE","CHALLIS' CUSTOMS BIT GETS ABORTED","A fan-requested Dr. Challis scene starts, goes sideways, and is intentionally abandoned. That choice is the memorable beat: the hosts recognize the line and pull the plug.",["Dr. Challis"]),
    H(6120,6300,"LORE DOOR","THE WWAM RULE: EVERYONE GETS ROASTED","The hosts describe the channel's freeform DNA: movie talk, fan interaction, and a willingness to roast everybody in the room, including themselves, without pretending the bit is a news report."),
    H(6300,6480,"NEWS REACTION","WWE ON NETFLIX AND THE R-RATED PITCH","The move to Netflix inspires a fantasy about what wrestling could do with an adult rating, bigger story arcs, and fewer corporate guardrails."),
    H(6480,6660,"STRAIGHT TO STEVE'S ASSHOLE","THE BATHROOM QUESTION DERAILS THE ROOM","A practical fan question turns into an escalating etiquette bit. The archive keeps the derailment and the laughter while leaving the explicit anatomy on the cutting-room floor."),
    H(6660,6840,"FAM SIGNAL","THE ARMY VETERAN WHO WANTS OUT OF THE HOUSE","A 23-year-old veteran asks whether living with his parents is a failure. The hosts answer with actual advice: save money, respect the home, and do not confuse independence with a deadline."),
    H(6840,7020,"FILM READ","FEAR NO EVIL AND THE CAT-DOG DETOUR","An obscure horror title leads to a pet-character improv that gets stranger every thirty seconds. The movie recommendation is real; the animal courtroom is pure WWAM."),
    H(7020,7200,"LORE DOOR","HELLRAISER NEEDS CLIVE BARKER BACK","The room imagines a legacy sequel with Barker's hand on the wheel and argues that mythology works best when it has a human point of view, not just a bigger box of lore."),
    H(7200,7380,"FILM READ","BATMAN & ROBIN'S BANE STILL OWES EVERYONE AN APOLOGY","The Bane impression, the ice-pun memory, and the question of whether a bad comic-book movie can become comfort food turn a failure into a reliable laugh lane."),
    H(7380,7560,"FILM READ","SPIDER-MAN NOIR GETS A CAGE-SHAPED YES","Nicolas Cage's return as Noir is treated as an easy watch. The room wants the show to lean into the smoky detective absurdity rather than sanding it smooth."),
    H(7560,7740,"VERDICT","LONGLEGS: CAGE WINS THE ROOM","The final Cage verdict is affectionate and measured: the performance is the unforgettable ingredient, even if the film's hype and procedural structure keep fighting each other."),
    H(7740,7920,"FAM SIGNAL","THE CHAT BUILDS THE REVIEW IN REAL TIME","Memberships, birthday wishes, horror questions, and movie requests keep reshaping the running order. This is why a live show cannot be reduced to its topic list."),
    H(7920,8100,"SOUNDBYTE / REPLAY","THE RICHMOND MALL ESCAPE STORY","A teenage trip to the mall, a car stereo playing a notorious rock song, and a group deciding to run through the building become a full coming-of-age farce."),
    H(8100,8280,"STRAIGHT TO STEVE'S ASSHOLE","THE LOST FLIP-FLOP OF SHAME","The mall story ends with a missing flip-flop, a walk back into public, and the kind of embarrassment that makes a stupid teenage stunt survive for decades."),
    H(8280,8460,"COMMUNITY DOOR","THE ROOM GIVES PARENTING ADVICE","The hosts return to the veteran question and separate a young adult's need for a plan from the internet's demand for a performance of adulthood."),
    H(8460,8640,"FILM READ","THE CAGE COMPARISON KEEPS GETTING WEIRDER","The performance discussion circles back to rock-star intensity, physical commitment, and the strange pleasure of watching a famous actor make a room uncomfortable on purpose."),
    H(8640,8820,"CHARACTER PERFORMANCE","SLENDERMAN AND CHALLIS EXPLAIN NOTHING","The recurring characters are asked to clarify the show's logic. They respond with competing fake authority, which is the closest this universe gets to a user manual.",["Slenderman","Dr. Challis"]),
    H(8820,9000,"LORE DOOR","BLINK MEMORIES AND THE CHANNEL'S COMEDY DNA","A documentary memory and the hosts' shared history explain why WWAM's humor feels like a private friend-group bit that accidentally acquired a public microphone."),
    H(9000,9180,"CHARACTER PERFORMANCE","LOOMIS ANSWERS A BACK-TO-THE-FUTURE REQUEST","A fan asks for a Dr. Loomis performance in a different movie's shape. The archive marks the playable improvisation without copying the film's speech.",["Dr. Loomis"]),
    H(9180,9360,"FILM READ","FORREST GUMP JOINS THE TEN-OUT-OF-TEN ROOM","The movie gets a full recommendation and a possible future commentary slot. The list now feels like a queue the FAM can actually use."),
    H(9360,9540,"FAM SIGNAL","JIM CARREY GETS A MINI-TIER LIST","The Mask, Cable Guy, Liar Liar, Ace Ventura, and Dumb and Dumber are ranked with just enough confidence to start a second argument."),
    H(9540,9720,"SOUNDBYTE / REPLAY","THE BEER TASTE TEST STARTS WITH FALSE CONFIDENCE","Jay tries a Belgian white beer, calls it acceptable, and immediately gets challenged to find something he will hate. The palate report is less useful than the faces."),
    H(9720,9900,"STRAIGHT TO STEVE'S ASSHOLE","THE SKUNK BEER GOES TO COURT","A second beer tastes sour and old, so the room conducts a mock trial against the fridge. Steve's Asshole gets the verdict: never trust a bottle with a suspicious backstory."),
    H(9900,10080,"FAM SIGNAL","THE NEW MEMBER ROLL CALL","New members arrive, the hosts thank them by name, and a birthday complaint gets turned into an affectionate roast. Fan participation is the last-hour engine."),
    H(10080,10220,"FILM READ","THE FILMMAKER QUESTION GETS A NO","Asked whether they ever wanted to become filmmakers, the hosts explain that keeping movie magic intact is part of why they prefer talking about movies to making them."),
    H(10220,10280,"CLOSING READ","A 1995 LIST TEASE AND A FAM GOODNIGHT","The room teases next week's year-list argument, thanks everyone who stayed late, and closes on the exact WWAM mixture of filthy jokes, movie obsession, and genuine affection.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the July 12, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 35827,
      captionEvents: 9184,
      captionSpanSeconds: 10253.72,
      captionDurationCoveragePercent: 99.74,
      captionSha256: "3457ea2b4230925bcd7a40fa3c76fc6208b4ac7c0fc777c1377b807da169c683",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "7800a8aae2725ac2fba9d4918c7199d5c945fa492b82ac8fffcb16242c949c3c",
      asrWindowCount: 61,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "FRIDAY LIVE // JULY 12, 2024",
    badge: "FULL SHOW WIKI // LONGLEGS, MARVEL FATIGUE, HORROR LISTS, AND THE FAM",
    headline: "LONGLEGS, A CAPTAIN AMERICA ARGUMENT, A LOST FLIP-FLOP, AND THE BEER THAT SHOULD HAVE STAYED IN THE FRIDGE",
    deck: "A two-hour-fifty-minute FAM room where Eminem, Longlegs, horror rankings, recurring character bits, family advice, and live audience chaos keep colliding in the best possible way.",
    overview: "This Friday room is what happens when a movie livestream refuses to stay inside one movie. Mike and J open with a technical wobble and a Captain America trailer they do not want to watch, then move through Eminem's new album, a sensitive creator story handled with unusual care, and a superchat that summons Dr. Loomis and Dr. Challis before the improv is deliberately shut down. The FAM supplies the emotional center: Rhino shares a devastating loss, Lee gets thanked, new members arrive, and a young Army veteran receives practical advice instead of an internet verdict. The film spine is strong anyway. Longlegs gets a midnight-cable defense, In a Violent Nature gets a Shudder boost, Gladiator 2 is judged as an expensive sequel, Deadpool & Wolverine gets blockbuster expectations, and the live ten-out-of-ten horror list starts taking shape. Jay brings Starfield, D&D, NCAA Football 25, Cobra Kai, and the early-2000s remake ladder into the same room. Later, the show becomes a lore map: Halloween needs more than the original, Hellraiser needs a human-scale sequel, Spider-Man Noir should keep Cage's weirdness, and Slenderman remains an unnervingly calm fake politician. The final hour is pure WWAM: a Richmond Mall escape story, a Jim Carrey mini-tier list, a beer taste test, birthday roasts, and a teaser for the next 1995/1996 argument. The crude jokes are loud, but the record is not hollow. It is a live community building its own canon in public.",
    topics: Object.freeze(["Longlegs", "In a Violent Nature", "Eminem", "Captain America", "Deadpool & Wolverine", "Gladiator 2", "Halloween", "Hellraiser", "Dr. Loomis", "Dr. Challis", "Slenderman", "Starfield", "Cobra Kai", "Jim Carrey", "The FAM"]),
    story: Object.freeze([
      { at: 0, end: 1080, label: "THE ROOM FINDS ITS SHAPE", body: "A StreamYard wobble, Eminem review, a sensitive creator story, a Loomis/Challis retreat, and a FAM loss establish the night's mix of chaos and care." },
      { at: 1080, end: 2160, label: "THE MOVIES PUSH BACK", body: "In a Violent Nature, Gladiator 2, Marvel fatigue, X-Men's outsider theme, and a Loomis survival answer give the room its first film-heavy run." },
      { at: 2160, end: 3240, label: "GAMES, LISTS, AND A MOUSE", body: "Shelley Duvall, Starfield, D&D, NCAA Football 25, the ten-out-of-ten horror list, and a two-screen control-room failure turn the live room into a collage." },
      { at: 3240, end: 4320, label: "LONGLEGS AND THE REMAKE LADDER", body: "Longlegs, Clerks 3, fasting advice, Cobra Kai, and the early-2000s remake rankings keep the recommendations specific and argumentative." },
      { at: 4320, end: 5400, label: "TRAILERS, SCAREFEST, AND A FAKE PRESIDENT", body: "Captain America, Longlegs box-office hype, convention advice, Slenderman's campaign, and Halloween sequel fatigue move from current media to channel lore." },
      { at: 5400, end: 6480, label: "THE WWAM RULEBOOK", body: "Shelley Duvall, Cage, the open horror ten, an aborted Challis bit, the channel's roast-everybody DNA, and an R-rated wrestling pitch make the format legible." },
      { at: 6480, end: 7560, label: "FAM ADVICE AND HORROR MYTHOLOGY", body: "A bathroom question, a veteran's housing problem, Fear No Evil, Hellraiser, Batman & Robin, and Spider-Man Noir show the room switching from crude to constructive without warning." },
      { at: 7560, end: 8640, label: "CAGE, THE MALL, AND A SECOND CHARACTER DOOR", body: "Longlegs gets its final Cage verdict, the Richmond Mall story becomes a soundbite, and Slenderman/Challis explain nothing with total confidence." },
      { at: 8640, end: 9720, label: "LOOMIS, FORREST, CARREY, AND THE BEER", body: "A Loomis request, Forrest Gump, a Jim Carrey tier list, and a beer tasting turn the last stretch into a fan-built variety show." },
      { at: 9720, end: 10280, label: "THE FRIDGE IS GUILTY, THE FAM IS NOT", body: "The sour beer is sentenced, new members and birthdays get their due, and a 1995/1996 tease closes the room with gratitude instead of a generic sign-off." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2520, end: 2700, label: "THE LIVE TEN-OUT-OF-TEN HORROR LIST", topic: "the FAM starts building a usable canon", body: "Play from 42:00. The room names the films it would defend at the morgue, then leaves the door open for the chat to add its own perfect scores.", playAt: 2520, playEnd: 2700 }),
      hated: Object.freeze({ at: 5940, end: 6120, label: "THE CHALLIS BIT GETS PULLED", topic: "the hosts refuse to let an unsafe improv become the record", body: "Play from 1:39:00. The funniest decision is the responsible one: the character scene starts, crosses a line, and gets abandoned before it can become the wrong kind of clip.", playAt: 5940, playEnd: 6120 }),
      wildestDetour: Object.freeze({ at: 7920, end: 8280, label: "THE RICHMOND MALL ESCAPE", topic: "a teenage stunt becomes a thirty-year story", body: "Play from 2:12:00. A mall, a car stereo, a group sprint, and a missing flip-flop give the room its most cinematic detour.", playAt: 7920, playEnd: 8280 }),
      lastWord: Object.freeze({ at: 9540, end: 9900, label: "THE BEER TASTE-TEST TRIAL", topic: "Jay meets a suspicious bottle", body: "Play from 2:39:00. The first beer is acceptable, the second tastes haunted, and the fridge becomes the night's least reliable bartender.", playAt: 9540, playEnd: 9900 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
