(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "OjQ2YzIldLA";
  var duration = 11182;
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

  /* July 23, 2024: a Tuesday live room that begins with a house sale and a
     hot-sauce stomach, then turns into a serious 1995 movie argument. The
     list is the spine; the fan room, car hostage crisis, politics-free vow,
     character interruptions, and cocaine-shark detour are the connective
     tissue that makes this a WWAM show rather than a spreadsheet. */
  var highlights = [
    H(0, 180, "ROOM BREAK", "THE 1995 LIST OPENS BEFORE JAY DOES", "The show starts with the promised Top Ten Movies of 1995, but Jay is still trapped in house-selling chaos. The first joke is already structural: one host is ready to rank cinema while the other is fighting real estate and a basement.") ,
    H(180, 360, "FAM SIGNAL", "TWELVE YEARS, ONE PORCH, AND A DOG WITH TERRIBLE TIMING", "The anniversary story arrives before the rankings: a back-porch wedding, a dog pooping during the ceremony, and a merged bachelor party that ends with tequila, dancing, and a childhood blanket paying the price.") ,
    H(360, 540, "STRAIGHT TO STEVE'S ASSHOLE", "B-DUBS BRINGS THE HOT-BUTT ECONOMY", "Grilled tenders, mango habanero, and Nashville hot become a running body-horror forecast. The food order is not background texture; it keeps returning as the night's second countdown.") ,
    H(540, 720, "FILM READ", "THE CHAT LOADS THE 1995 CANNON", "Billy Madison, Casino, Jumanji, Halloween 6, Toy Story, GoldenEye, Tommy Boy, Major Payne, and Slam Dunk Ernest arrive from the FAM before either list is revealed. The year is already too crowded for ten slots.") ,
    H(720, 900, "ROOM BREAK", "THE OLD COVID LIST COMES BACK TO HAUNT THE NEW ONE", "The hosts remember making a short 1995 list during COVID and discover that tonight's full show is not the first time they have wandered this minefield. The distinction becomes part of the argument: a forgotten bit is not the same as the official series.") ,
    H(900, 1080, "FAM SIGNAL", "JAY ENTERS FROM THE BASEMENT WAR", "Jay finally appears after house visitors, untrained dogs, and a day that sounds like a sitcom cold open. The list can begin, but the room still has to hear the realtor damage report.") ,
    H(1080, 1260, "STRAIGHT TO STEVE'S ASSHOLE", "THE REVERSE-CAR SQUEAL BECOMES A DIAGNOSIS", "A steering-column problem turns into a sound-effect reconstruction: the car squeals in reverse, the repair estimate mutates, and the chat gets a front-row seat to a man trying not to become his own mechanic.") ,
    H(1260, 1440, "FAM SIGNAL", "FOUR HUNDRED DOLLARS OR A TWENTY-TWO-HUNDRED-DOLLAR AMBUSH", "The repair-shop story keeps escalating from a manageable bill to the possibility of a full steering-column replacement. The joke is the uncertainty: every answer sounds like another invoice waiting in the bushes.") ,
    H(1440, 1620, "STRAIGHT TO STEVE'S ASSHOLE", "TRIPLE-L LIARS, LIARS, AND THE CAR HOSTAGE CRISIS", "A mechanic nickname is invented on the spot, then the shop is accused of holding the car hostage until the money arrives. The room's revenge fantasy is a Yelp review delivered with the force of a hostage negotiator.") ,
    H(1620, 1800, "COMMUNITY DOOR", "THE FAM GETS A FANTASY-FOOTBALL LEAGUE", "The show pauses the movie list to recruit the community into another WWAM fantasy-football season. Multiple leagues, auto-drafted teams, and a brother accused of trade crimes turn sports administration into a character bit.") ,
    H(1800, 1980, "WWAM UP IN YA", "COCAINE SHARKS ENTER THE MOVIE PITCH ROOM", "A report about sharks testing positive for cocaine becomes a full WWAM creature-feature pitch: gold chains, sunglasses, underwater gangs, and Freddy-level explanations for how the ocean got high.") ,
    H(1980, 2160, "FAN SIGNAL", "THE SLIDERS WARNING FROM MICHAEL PARTON", "Michael Parton warns the room that White Castle sliders will leave the body at speed. The chat is not merely asking questions; it is supplying field-tested survival notes and getting them read back as canon.") ,
    H(2160, 2340, "STRAIGHT TO STEVE'S ASSHOLE", "THE WHITE CASTLE NIGHT THAT BECAME NATURAL BORN KILLERS", "A remembered White Castle run with Jay turns into a psychedelic bar-night confession, a bathroom hiding place, and a story the room wisely refuses to make more explicit than it needs to be.") ,
    H(2340, 2520, "CHARACTER PERFORMANCE", "LOOMIS, CHALLIS, AND SLENDERMAN TAKE THE SUPERCHAT", "A fan asks for recurring voices, and the room lets Dr. Loomis, Dr. Challis, and Slenderman answer in the familiar WWAM register: fake authority, fake access, and a shamelessly invented subscription service.", ["Dr. Loomis", "Dr. Challis", "Slenderman"]) ,
    H(2520, 2700, "CHARACTER PERFORMANCE", "SLENDERMAN IS TOLD TO STAY OUT OF POLITICS", "When a fan asks Slenderman about politics, the character is redirected into a calm-down speech and a Subway recommendation. The bit lands because the hosts make the channel's politics-free promise part of the monster's etiquette.", ["Slenderman"]) ,
    H(2700, 2880, "FAN SIGNAL", "THE NO-POLITICS PLEDGE BECOMES A HOUSE RULE", "The hosts explain that the channel is taking a break from political fighting through November. The reason is practical and fan-facing: people are here for movies, games, and a place to breathe.") ,
    H(2880, 3060, "NEWS REACTION", "DEADPOOL AND WOLVERINE GETS THE PRE-SPOILER WARMUP", "The room talks around early reviews and Rotten Tomatoes without opening the spoiler door. What they want is simple: an R-rated, filthy, funny superhero movie with an emotional pulse, not a lecture about continuity.") ,
    H(3060, 3240, "STRAIGHT TO STEVE'S ASSHOLE", "THE CLICKBAIT THUMBNAIL COURT", "The hosts roast review channels that manufacture a war with their thumbnails, then admit WWAM sometimes lives in that neighborhood too. The useful distinction is between a real criticism and a title designed to bait hate-watchers.") ,
    H(3240, 3420, "NEWS REACTION", "TRAP, ALIEN: ROMULUS, AND THE HORROR CALENDAR", "A fan asks which upcoming horror film has the room most excited. Trap and Alien: Romulus get the early attention, with the hosts trying to balance a real horror appetite against the year's superhero noise.") ,
    H(3420, 3600, "STRAIGHT TO STEVE'S ASSHOLE", "THE FIRST WE TAKE FEAST DETOUR", "A bad interview becomes a live lesson in conversational dead air. The hosts compare the awkward show to two strangers waiting for a mutual friend, then let the tangent itself prove the point.") ,
    H(3600, 3780, "TAKE GETS NUCLEAR", "THE POWER COMPANY SAYS 'WE PICKED YOU'", "A neighborhood power outage story turns into an imaginary customer-service showdown. The representative's technical correction wins the call, while the host admits the best comeback happened only inside his head.") ,
    H(3780, 3960, "FAM SIGNAL", "THE ANGRY PHONE CALL THAT ENDS WITH 'THANK YOU'", "The room identifies the universal move: build an entire Action Jackson speech in your imagination, then say 'thank you' because the person on the phone is still doing a job. It is an everyday defeat everybody recognizes.") ,
    H(3960, 4140, "FILM READ", "THE 1990s WERE THE 1980s WITH A BETTER SOUNDTRACK", "The hosts argue that the 1990s were a second 1980s: big practical effects, recognizable music, and stories that still had room to breathe before franchise machinery swallowed every frame.") ,
    H(4140, 4320, "FAN SIGNAL", "MICHAEL VERSUS JASON, WITH NINJA MATH", "A chat question asks who wins between Michael Myers and Jason. The answer changes with the version, the weather, and whether the room values supernatural smoothness or an outdoorsman with tools.") ,
    H(4320, 4500, "LIST ROOM", "THE 1995 LIST FINALLY GETS A COUNTDOWN", "After a long pre-show of house trouble, fan messages, and movie news, the hosts finally put the paper lists on the table. The delay is part of the episode's charm: the countdown has to earn its entrance.") ,
    H(4500, 4680, "LIST ROOM", "MALRATS IS THE FIRST SACRIFICE", "One list opens with Mallrats at number ten, defended as a necessary Kevin Smith bridge between Clerks and the Jay-and-Silent-Bob mythology. The other opens with Ace Ventura: When Nature Calls, a comedy nobody in the room can quote cleanly without laughing.") ,
    H(4680, 4860, "SOUNDBYTE / REPLAY", "THE RHINO, THE PROJECTION ROOM, AND THE BONE", "Ace Ventura memories become a rapid-fire quote reel: the projection-room nonsense, the rhino escape, the tour stop, and the line that still makes the hosts lose control decades later.") ,
    H(4860, 5040, "LIST ROOM", "MAJOR PAYNE GETS ITS DUE", "Major Payne lands as a family comedy with enough bite for adults, Damon Wayans doing full drill-sergeant theater, and Bam Bam Bigelow making the wrestling connection impossible to miss.") ,
    H(5040, 5220, "LIST ROOM", "CASINO IS THE SIMP ORIGIN STORY", "Casino arrives with Joe Pesci's unpredictable violence, Robert De Niro's one blind spot, and a debate over whether a brilliant man can still be completely owned by the wrong relationship.") ,
    H(5220, 5400, "STRAIGHT TO STEVE'S ASSHOLE", "THE LIST HAS ITS FIRST YEAR-VERIFYING MELTDOWN", "A 1995 title is challenged, the Google-versus-IMDb method is argued, and the room refuses to edit the paper once the mistake is in ink. The comedy is the confidence arriving before the evidence.") ,
    H(5400, 5580, "LIST ROOM", "BRAVEHEART BRINGS THE DOUBLE-VHS STANDARD", "Braveheart is defended through music, blue face paint, kilts, battlefield scale, and one sacred rental-store rule: a double VHS case means the movie is serious business.") ,
    H(5580, 5760, "LIST ROOM", "TOY STORY WINS THE CHILDHOOD MEMORY ARGUMENT", "Toy Story is not defended as a Disney brand. It is defended as the feeling of getting one new toy, bringing it upstairs, and making the rest of the room join the story.") ,
    H(5760, 5940, "STRAIGHT TO STEVE'S ASSHOLE", "THE TOY STORY PURIST DECLARES WAR ON THE SEQUELS", "A lifelong Toy Story purist refuses to move past the first movie. The room's real target is the adult who treats a childhood comfort watch like a franchise obligation.") ,
    H(5940, 6120, "LIST ROOM", "SEVEN TAKES THE DARK-THRILLER LANE", "Se7en is praised as crime thriller, horror-adjacent nightmare, and a movie whose ending still detonates in the viewer's lap. The hosts focus on the atmosphere and the feeling of being trapped inside the investigation.") ,
    H(6120, 6300, "LIST ROOM", "DIE HARD WITH A VENGEANCE IS A BUDDY-COP UPGRADE", "The third Die Hard is defended as a surprise franchise miracle: a hungover John McClane, Samuel L. Jackson, a city-sized scavenger hunt, and the opening billboard that announces a very bad day.") ,
    H(6300, 6480, "FILM READ", "DESPERADO GETS A PERSONAL GUARANTEE", "Desperado is treated like a lost 1990s action classic: Antonio Banderas, Robert Rodriguez, guitar-case violence, and a promise that anyone who has missed it should stop scrolling and watch it.") ,
    H(6480, 6660, "LIST ROOM", "WONG FOO TURNS THE ROOM SOFT", "Wong Foo, Thanks for Everything! Julie Newmar is defended as a warm, genuinely funny road movie with Patrick Swayze, Wesley Snipes, and John Leguizamo making the whole town better by refusing to be reduced to a joke.") ,
    H(6660, 6840, "LIST ROOM", "GOLDENEYE IS A VHS AND A VIDEO-GAME TIME CAPSULE", "GoldenEye gets the Pierce Brosnan defense, Tina Turner soundtrack memory, Hollywood Video nostalgia, and the Nintendo 64 menu music that can still transport the room to middle school.") ,
    H(6840, 7020, "STRAIGHT TO STEVE'S ASSHOLE", "POWDER STARTS THE MOST UNCOMFORTABLE NOSTALGIA ARGUMENT", "Powder is remembered as a movie that moved the room and also creeped it out. The hosts try to separate the emotional response to the story from the uncomfortable history surrounding the filmmaker.") ,
    H(7020, 7200, "LIST ROOM", "EMPIRE RECORDS IS A PERSONAL BIBLE", "Empire Records gets the full devotion speech: cast, soundtrack, Rex Manning Day, the record-store dream, and the feeling that the movie was a blueprint for the kind of young adulthood the hosts wanted.") ,
    H(7200, 7380, "SOUNDBYTE / REPLAY", "REX MANNING DAY GETS THE SUGAR HIGH", "The soundtrack memory takes over the room. 'Sugar High,' the A.C./D.C. blast, and the record-store mood become a compact audio postcard from the film that refuses to stay in the past.") ,
    H(7380, 7560, "LIST ROOM", "FIRST KNIGHT MAKES KING ARTHUR PERSONAL", "First Knight is defended as a Lancelot story with Sean Connery's King Arthur, Richard Gere's charm, and a betrayal that still makes the room unexpectedly emotional.") ,
    H(7560, 7740, "LIST ROOM", "HEAT PUTS PACINO IN THE HOT SEAT", "Heat gets the rewatchable-movie argument: the diner scene, Pacino's exhausted detective, Val Kilmer's robbery crew, and the feeling that the film is about obsession before it is about cops and criminals.") ,
    H(7740, 7920, "STRAIGHT TO STEVE'S ASSHOLE", "THE TOWN HAS TO ANSWER FOR COMPARING ITSELF TO HEAT", "A Heat comparison is permitted only if the room admits what the newer movie is missing. The joke is not that The Town is worthless; it is that standing next to Heat is a dangerous place to pose.") ,
    H(7920, 8100, "LIST ROOM", "CRIMSON TIDE WINS THE SUBMARINE POWER STRUGGLE", "Crimson Tide takes number one on one list through Gene Hackman, Denzel Washington, Tony Scott's compressed spaces, and the terrifying question of whose order a crew should follow when nuclear war is possible.") ,
    H(8100, 8280, "LIST ROOM", "SEVEN IS THE MOVIE THAT CREATED A MOVIE HUNTER", "The other list closes with Se7en: a sick-day pay-per-view, double ramen, a phone bill waiting to ambush the parents, and the 'what's in the box' ending that turned one viewer into a lifelong movie obsessive.") ,
    H(8280, 8460, "FILM READ", "HONORABLE MENTIONS BECOME A SECOND SHOW", "Bad Boys, Clueless, Friday, Leaving Las Vegas, Tommy Boy, Mortal Kombat, Citizen X, First Knight, and Under Siege 2 are not afterthoughts. The rejected list proves how ridiculous the 1995 field really was.") ,
    H(8460, 8640, "STRAIGHT TO STEVE'S ASSHOLE", "HALLOWEEN 6 IS THE NUMBER-ELEVEN HOSTAGE", "Halloween 6 is admitted as a favorite that still misses the top ten. The hosts joke about putting it on the list to provoke the FAM, then reveal that the real pain is leaving it out at all.") ,
    H(8640, 8820, "FAM SIGNAL", "THE CHAT BUILDS ITS OWN 1995 ARCHIVE", "Fan lists add Tales from the Hood, Heavyweights, Three Ninjas, Casper, Dolores Claiborne, Tank Girl, and more. The room realizes the community is making a second, larger canon in real time.") ,
    H(8820, 9000, "NEWS REACTION", "THE SPAWN AND THE THING GAME SIDE DOORS", "The chat jumps from the failed Spawn movie to a new Thing game set after the original film. The hosts agree that a game may be the right way to revisit The Thing, provided it understands the paranoia instead of just the monster.") ,
    H(9000, 9180, "STRAIGHT TO STEVE'S ASSHOLE", "THE DEADPOOL POPCORN BUCKET HAS A PROBLEM", "The Wolverine popcorn bucket becomes a dirty prop, then a parental-guidance conversation. The hosts worry that younger kids will mistake a famously adult franchise for another Saturday-morning Marvel outing.") ,
    H(9180, 9360, "FAM SIGNAL", "A DOG'S GOODBYE GETS THE COLD SHOULDER", "A fan shares that their dog has died. The room lets the familiar bit answer with deliberately awful indifference before the hosts drop the joke and talk honestly about losing an animal you have loved for years.") ,
    H(9360, 9540, "FAM SIGNAL", "THE FAM'S MOVIE NIGHT IS ALSO A GRIEF ROOM", "The dog conversation widens into stories about old pets, family rules, and the strange way a single patch of fur can keep a person present in a house for years. The humor is the door; the empathy is the room.") ,
    H(9540, 9720, "FILM READ", "HORROR'S ON-RAMP: HALLOWEEN, PUMPKINHEAD, OR I KNOW WHAT YOU DID LAST SUMMER", "A fan asks how to ease into horror. The hosts offer three different ramps: classic suspense, creature atmosphere, or a glossy slasher that gets the heart moving without throwing the viewer straight into torture cinema.") ,
    H(9720, 9900, "STRAIGHT TO STEVE'S ASSHOLE", "THE ARMPIT HUG THAT NO AUTOGRAPH DESERVED", "A story about meeting Seether's singer turns into the worst possible autograph memory: a post-show hug, a sweaty armpit, and a sentence whispered into an ear that should have been left out of the meet-and-greet.") ,
    H(9900, 10080, "NEWS REACTION", "KING SPAWN NEEDS THE R-RATED PROMISE", "The Spawn conversation returns to the upcoming King Spawn adaptation. The hosts are willing to be surprised, but the bar is clear: stop polishing the character into a toy and let the movie be as dark as the comic deserves.") ,
    H(10080, 10260, "GAMING DETOUR", "THE THING GAME GETS THE RIGHT KIND OF REMAKE", "A fan's news drop about a new Thing game becomes a concise design brief: paranoia, isolation, distrust, and a story that remembers the original film rather than repainting its poster.") ,
    H(10260, 10440, "FAN SIGNAL", "THE 1995 SOUNDTRACKS KEEP WINNING", "Dangerous Minds, Batman Forever, Mortal Kombat, and U2 are used to explain why 1995 still feels bigger than a release calendar. The music was not decoration; it was how the movies escaped the theater and followed kids home.") ,
    H(10440, 10620, "STRAIGHT TO STEVE'S ASSHOLE", "THE FACE-OFF: JASON'S BOO OR LEATHERFACE'S HOUSE", "A horror question asks which smell is worse. The answer is less about gore than proximity: a monster's personal mess is worse when you can see the pile and know someone lived beside it.") ,
    H(10620, 10800, "FAM SIGNAL", "THE SOLO MOVIE-THEATER TEST", "A fan chooses between Longlegs and MaXXXine, and the hosts turn the decision into a case for seeing a movie alone. The theater becomes a private reset button, not a sad punishment.") ,
    H(10800, 10980, "COMMUNITY DOOR", "THE FAM REMEMBERS 1995 TOGETHER", "Michael Parton shares a 1997 list early, DJ adds Tales from the Hood, and Katie gets a deserved thank-you. The community is not a comment stream here; it is the living footnote to the countdown.") ,
    H(10980, 11160, "TAKE GETS NUCLEAR", "THE SOCIAL-MEDIA PUNCH-IN-THE-MOUTH THEORY", "The closing debate argues that face-to-face consequences once kept people from saying every cruel thought out loud. The hosts are not asking for a return to violence; they are explaining why online certainty feels so cheap.") ,
    H(11160, 11182, "CLOSING READ", "MORTAL KOMBAT, KATIE, AND GO FUCK YOURSELF SAN DIEGO", "The sign-off squeezes in one last Mortal Kombat soundtrack idea, thanks Katie and the FAM, and ends with the familiar affectionate insult before the room slips into a final filthy character goodbye.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the July 23, 2024 1995-list livestream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 5620,
      captionEvents: 11240,
      captionSpanSeconds: 11181.08,
      captionDurationCoveragePercent: 99.99,
      captionSha256: "2dae7c11e02846b4541b42bf2e62e9cf864eba8b8611a6e2b9d5acaa9e98c976",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio playback spot-check; playback remains the authority",
      audioSha256: "580a8dd34abd26cdb260ed645ed7e715f587b8d7a480b2e02b9f8a1eb13390b5",
      asrWindowCount: 63,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "TUESDAY LIVE // JULY 23, 2024",
    badge: "FULL SHOW WIKI // 1995 MOVIE LIST, HOUSE DRAMA, COCAINE SHARKS, AND THE FAM",
    headline: "THE 1995 MOVIE LIST GETS HIJACKED BY A HOUSE, A CAR, AND COCAINE SHARKS",
    deck: "A three-hour WWAM room where a delayed Top Ten countdown has to survive a twelve-year anniversary story, a mechanic holding a car hostage, recurring character requests, a politics-free pledge, and a community-built 1995 canon.",
    overview: "This is not a clean countdown show. It opens with Jay late because he is selling a house, detours through a twelve-year anniversary story involving a back-porch wedding and a dog with terrible timing, then gets trapped inside a steering-column repair estimate that keeps growing teeth. The FAM supplies fantasy-football questions, White Castle warnings, movie lists, birthday wishes, and a cocaine-shark premise so vivid it deserves its own midnight movie. Dr. Loomis, Dr. Challis, and Slenderman appear because the community knows exactly which door to knock on, while the hosts promise to leave politics outside through November so the room can stay a room. When the actual 1995 lists arrive, the show catches fire: Mallrats, Ace Ventura: When Nature Calls, Major Payne, Casino, Braveheart, Toy Story, Se7en, Die Hard with a Vengeance, Desperado, Wong Foo, GoldenEye, Powder, Empire Records, First Knight, Heat, and Crimson Tide all fight for oxygen. The honorable mentions are nearly a second episode—Bad Boys, Friday, Clueless, Tommy Boy, Mortal Kombat, Citizen X, Halloween 6, and more. The last hour turns the archive outward again: dog grief, horror entry points, a filthy meet-and-greet memory, a new Thing game, and the social-media argument that closes the night. The list is the spine, but the living room around it is the actual show.",
    topics: Object.freeze(["Top 10 Movies of 1995", "Mallrats", "Ace Ventura", "Major Payne", "Casino", "GoldenEye", "Empire Records", "Halloween 6", "The FAM", "Dr. Loomis", "Cocaine Sharks", "Horror Entry Points", "The Thing Game"]),
    story: Object.freeze([
      { at: 0, end: 900, label: "THE COUNTDOWN IS LATE TO THE PARTY", body: "The 1995 list is announced while Jay is still trapped in house-selling chaos. An anniversary memory and a B-Dubs order make the opening feel like a living room before it feels like a show." },
      { at: 900, end: 1800, label: "THE CAR REPAIR BECOMES THE FIRST VILLAIN", body: "A reverse squeal, a steering-column estimate, and a mechanic who may be holding the car hostage occupy the room before the movie list can find the table." },
      { at: 1800, end: 3600, label: "THE FAM BRINGS THE MONSTERS AND THE RULES", body: "Cocaine sharks, White Castle warnings, recurring characters, a politics-free pledge, Deadpool anticipation, and the first horror questions turn the chat into a writers' room." },
      { at: 3600, end: 5400, label: "THE LIST FINALLY STARTS BLEEDING", body: "A power-company argument and a 1990s movie-year thesis lead into Mallrats, Ace Ventura, Major Payne, Casino, and the first fight over what deserves to stay." },
      { at: 5400, end: 6480, label: "THE 1995 MIDDLE CARD IS ABSURDLY STACKED", body: "Braveheart, Toy Story, Se7en, and Die Hard with a Vengeance turn the countdown into a nostalgia pressure cooker before the action movies take over." },
      { at: 6480, end: 7200, label: "DESPERADO, WONG FOO, GOLDENEYE, POWDER", body: "The room jumps from Rodriguez shootouts to a gentle road movie, a Nintendo 64 time capsule, and an uncomfortable Powder memory without losing the decade's pulse." },
      { at: 7200, end: 9000, label: "EMPIRE RECORDS, FIRST KNIGHT, HEAT, CRIMSON TIDE", body: "The room moves from Rex Manning Day to King Arthur, Pacino's detective, and a submarine power struggle, proving the year can change genre without losing its voice." },
      { at: 9000, end: 10260, label: "THE HONORABLE MENTIONS HAVE THEIR OWN WIKI", body: "Deadpool popcorn buckets, grief, horror entry points, Spawn, The Thing, and the FAM's giant list of left-off favorites keep the show from pretending ten slots were enough." },
      { at: 10260, end: 10980, label: "THE FAM TURNS A LIST INTO A MEMORY", body: "Soundtracks, solo theater trips, movie-store rituals, and fan shout-outs make the 1995 canon communal instead of fixed." },
      { at: 10980, end: 11182, label: "THE ROOM LEAVES WITH A PUNCHLINE", body: "The social-media argument, Mortal Kombat soundtrack idea, Katie's thank-you, and the final affectionate insult close a stream that kept finding the people inside the movies." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 7020, end: 7200, label: "EMPIRE RECORDS AS A PERSONAL BIBLE", topic: "the movie that makes a record store feel like a future", body: "Play from 1:57:00. The room stops ranking and starts confessing: this soundtrack, cast, and record-store dream shaped what adulthood was supposed to feel like.", playAt: 7020, playEnd: 7200 }),
      hated: Object.freeze({ at: 5220, end: 5400, label: "THE PAPER LIST REFUSES TO BE CORRECTED", topic: "confidence arrives before the year check", body: "Play from 1:27:00. A disputed 1995 title creates the night's purest frustration-comedy: the list is in ink, the correction is obvious, and nobody is allowed to save face.", playAt: 5220, playEnd: 5400 }),
      wildestDetour: Object.freeze({ at: 1800, end: 1980, label: "COCAINE SHARKS", topic: "a news item becomes an underwater gang movie", body: "Play from 30:00. Gold chains, sunglasses, and a shark drug economy appear out of nowhere and somehow become the most producible pitch in the first hour.", playAt: 1800, playEnd: 1980 }),
      lastWord: Object.freeze({ at: 11160, end: 11182, label: "MORTAL KOMBAT AND THE FINAL GOODNIGHT", topic: "the community gets one last soundtrack idea and one last filthy sign-off", body: "Play from 3:06:00. The final seconds hold the room's whole personality: music nostalgia, gratitude, a familiar insult, and a last character-shaped goodbye.", playAt: 11160, playEnd: 11182 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
