(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "jJz8zJp4JHM";
  var duration = 13049;
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

  /* June 25, 2024: a 3h37m room that begins with platform ethics, wanders
     through birthdays, fasting, movie lists, and Scarefest, then closes with
     a full 1988 Watchers review and a sincere FAM/community landing. */
  var highlights = [
    H(0,220,"NEWS REACTION","THE PLATFORM-ETHICS OPEN","Mike and Jay open on the Dr. Disrespect allegations, separating legal status, reported messages, platform responsibility, and the danger of turning incomplete public records into certainty."),
    H(220,440,"NEWS REACTION","WHEN A PAYOUT IS NOT A CLEAN ENDING","The room asks why a platform would settle while also discussing the limits of what viewers can know. Public copy keeps the allegation lane neutral and evidence-aware."),
    H(440,660,"FAM SIGNAL","THE FAM ARRIVES WITH THE RECEIPTS","Superchats, members, and overseas names keep the serious opening from becoming a news panel. A dirty joke is still a release valve, not the subject."),
    H(660,880,"ROOM BREAK","SIX O'CLOCK, HOT WEATHER, AND A ROOT BEER","The early start, the heat, the haircut, and the A&W root beer establish a room that is already sweating before the first movie question lands."),
    H(880,1100,"FAM SIGNAL","THE QUIT-SMOKING CHECK-IN","A fan asks for advice. Mike answers with the real reason he quit, admits he is cutting down on drinking, and refuses to pretend a personal decision is a universal program."),
    H(1100,1320,"LORE DOOR","MICHAEL AND LOOMIS PLAY GOLF","An Airbnb beside a golf course becomes a recurring-character fantasy: Michael cannot spell golf, Loomis cannot stop diagnosing him, and the room immediately wants the episode."),
    H(1320,1540,"FAM SIGNAL","THE SEAT-BELT COURT","A ticket for not wearing a seat belt gets a Kentucky “click it or ticket” prosecution. The joke is crude; the actual advice is unusually sensible."),
    H(1540,1760,"NEWS REACTION","MONOLITHS, INTERNET MYSTERY, AND THEATRE LIGHTS","The room moves from mysterious public art to why six-o'clock streams work for overseas fans. The archive files both under community context, not conspiracy."),
    H(1760,1980,"STRAIGHT TO STEVE'S ASSHOLE","THE WORST MOVIE-THEATER BATHROOM BREAK","Jay tells the story of a bathroom emergency that turned a normal screening into a full public-survival mission. Public copy keeps the panic and removes the explicit bodily inventory."),
    H(1980,2200,"STRAIGHT TO STEVE'S ASSHOLE","THE CRIME-SCENE UNDERWEAR RECEIPT","The story escalates into a pair of ruined clothes, a grateful drive home, and the kind of humiliation that deserves a replay button but not a medical textbook."),
    H(2200,2420,"COMMUNITY DOOR","THE POLICE OFFICER WHO GOT THE STORY","A roadside encounter, an embarrassed explanation, and the relief of being home turn an off-camera disaster into an oddly complete narrative arc."),
    H(2420,2640,"FAM SIGNAL","THE FASTING AND LEG-CRAMP DETOUR","The room discusses hunger, cramps, and not pretending to be a doctor. The usable takeaway is self-awareness, not a challenge to copy the hosts."),
    H(2640,2860,"CHARACTER PERFORMANCE","BEETLEJUICE MEETS A POLITICAL QUESTION","A Beetlejuice-style character response derails a debate discussion. The archive labels it parody, keeps the cadence, and drops the direct political attack.",["Beetlejuice"]),
    H(2860,3080,"NEWS REACTION","THE DEBATE BECOMES PAY-PER-VIEW","Mike and Jay treat the Biden/Trump debate as spectacle, popcorn, and exhaustion. The moment is about the broadcast format, not a campaign endorsement."),
    H(3080,3300,"FILM READ","THE DEADPOOL TRAILER IS A COMEDY CONTRACT","The room wants jokes, a good theater night, and the Saber-tooth surprise. They reject the idea that every frame needs to answer a ten-year lore exam."),
    H(3300,3520,"CHARACTER PERFORMANCE","LOOMIS YELLS AT KYLE","A fan asks Dr. Loomis for a final-girl answer and a yell. The doctor sounds more irritated by the question than by Michael, which is exactly why the receipt works.",["Dr. Loomis"]),
    H(3520,3740,"MUSIC DOOR","THE SEA-SHELL NECKLACE ERA","90s accessories, old fashion mistakes, and a fan's earbuds become a small culture-history lane. The details are funny because everyone remembers owning the wrong version."),
    H(3740,3960,"FILM READ","X, PEARL, AND MAXXXINE SET THE NEXT MOVIE RUN","Jay prefers X, Mike defends Pearl's performance, and both agree Maxxxine can work as its own thing while still rewarding trilogy viewers."),
    H(3960,4180,"FILM READ","THE 1980S COMEDY MOUNT RUSHMORE STARTS","Ghostbusters, Beverly Hills Cop, The Breakfast Club, Back to the Future, Lethal Weapon, The Naked Gun, and Summer School fight for three spots."),
    H(4180,4400,"FAM SIGNAL","RYAN REYNOLDS, FINAL GIRLS, AND HAIRCUT ROASTS","A fan asks for favorite final girls; another gets roasted for a haircut and an accidental 1990s necklace. The community layer keeps the movie lane loose."),
    H(4400,4620,"ROOM BREAK","RON THE LEPRECHAUN'S WIRED CHAIR","Mike's chair squeaks through a recording, so the room invents a Ron-the-Leprechaun explanation and vows to find WD-40 before the next upload."),
    H(4620,4840,"FAM SIGNAL","CANDY CIGARETTES AND GROWING UP ONLINE","The hosts remember cheap candy cigarettes, expensive snacks, and a childhood where nostalgia was physical instead of an old post in a feed."),
    H(4840,5060,"NEWS REACTION","HOLLYWOOD'S CREATIVE PROBLEM","A long argument about modern releases turns into a thesis: not every movie is bad, but too many feel like a copy of a copy with a three-hour runtime."),
    H(5060,5280,"FILM READ","THE FORCE, THE MARKETING, AND WHAT STILL FEELS NEW","The room allows that a familiar franchise can still work if the filmmakers bring a real idea instead of just repainting the last hit."),
    H(5280,5500,"FAM SIGNAL","THE SECRET-MOVIE CLUB","Mike claims there are films he keeps hidden from the wider channel, then immediately gives the FAM enough clues to make the next recommendation hunt possible."),
    H(5500,5720,"STRAIGHT TO STEVE'S ASSHOLE","THE BURIED PANTS STORY","A ruined pair of clothes gets a fake funeral and a pet-cemetery sendoff. The archive keeps it as family folklore, not a literal claim about where anything was buried."),
    H(5720,5940,"COMMUNITY DOOR","THE ROOM FEELS LIKE A BAR","Fans describe the chat as a place where they feel backed up. The hosts answer with gratitude and a little filth because sincerity without a joke makes them itchy."),
    H(5940,6160,"CHARACTER PERFORMANCE","MARK WAHLBERG GIVES A HOSPITAL MESSAGE","A worried fan asks for comfort before a child's procedure. Mark Wahlberg and Dr. Loomis are used as gentle fictional voices, while the hosts give the actual good wishes.",["Mark Wahlberg","Dr. Loomis"]),
    H(6160,6380,"COMMUNITY DOOR","THE HOSPITAL CHECK-IN GETS RESPECT","The room drops its volume, wishes the family well, and remembers that FAM history is not only jokes and movie rankings."),
    H(6380,6600,"FILM READ","FRIDAY THE 13TH 2009 GETS ITS DEFENSE","The hosts return to the modern Friday remake, its opening, its kills, and the argument that it belongs in a serious franchise conversation."),
    H(6600,6820,"LORE DOOR","THE FINAL-GIRL THEORY","A genre question about why so many horror survivors are women becomes a discussion of audience identification, character sympathy, and the machinery of the final girl."),
    H(6820,7040,"FILM READ","THE MODERN HORROR EXCEPTION LIST","The room separates memorable movies from filler, praising work that earns its tone and mocking projects that confuse an expensive look with a story."),
    H(7040,7260,"FAM SIGNAL","MOVIE-THEATER OR SPORTS-BAR MAN CAVE","The fan poll gets a real answer: movies at home, sports-bar energy for the man cave, and a warning that bartending as a hobby would only make the drinking problem more efficient."),
    H(7260,7480,"CHARACTER PERFORMANCE","LOOMIS GETS A FAMILY-SAFE ADVICE LANE","A fan asks for Dr. Loomis to discuss rules, society, and control. The answer is framed as character comedy, not life coaching.",["Dr. Loomis"]),
    H(7480,7700,"STRAIGHT TO STEVE'S ASSHOLE","THE VERSAILLES STALL DOES NOT CLOSE","The old bathroom story returns: a broken stall door, a quiet exit plan, and a man discovering that privacy is a luxury feature. Public copy stays non-graphic."),
    H(7700,7920,"FILM READ","THE REMAKE LADDER: TCM 2003","Texas Chainsaw Massacre 2003 is placed in the same emotional bracket as Rob Zombie's Halloween: forceful, divisive, and more effective than the people who dislike it want to admit."),
    H(7920,8140,"FAM SIGNAL","THE APPLESAUCE INTERMISSION","An applesauce snack, a food question, and a live room that refuses to end become a tiny domestic intermission in the middle of a very long stream."),
    H(8140,8360,"FILM READ","SCARY MOVIE NOSTALGIA AND THE KICK-OUT","A fan asks about a movie night that ended early. The room treats the memory as a reminder that comedy works best when everyone agrees to be there."),
    H(8360,8580,"NEWS REACTION","SEVEN BOILERMAKERS AND THE ANESTHESIA STORY","A drinking-memory roast turns into a real conversation about surgery anxiety and losing control. The copy keeps the fear and removes the medical exaggeration."),
    H(8580,8800,"GAMING DOOR","ELDEN RING IS NOT A RECOVERY PLAN","The hosts admit that Soulslike games are designed to punish frustration, then decide that a doctor's appointment is the wrong time to volunteer for digital punishment."),
    H(8800,9020,"FILM READ","INDEPENDENCE DAY AND OVER-ACTING","A fan's 1996 rewatch sparks a debate about Will Smith's performance, blockbuster sincerity, and the difference between a big performance and a bad one."),
    H(9020,9240,"FAM SIGNAL","THE DEVIL IN ME / WHITE CITY QUESTION","A book, a game, and a missed chat comment become a reminder that every WWAM stream has multiple conversations running at once."),
    H(9240,9460,"MUSIC DOOR","SONIA BLADE, VERONICA, AND THE 80S FUN-GIRL MEMORY","A character and actress discussion turns into a nostalgia lane about video-game icons, 80s movies, and performers who could have carried a bigger career."),
    H(9460,9680,"FILM READ","TALES FROM THE CRYPT FAVORITES","The room trades favorite episodes and remembers why anthology horror works: a short setup, a clean hook, and no forty-five-minute promise that the payoff is coming later."),
    H(9680,9900,"NEWS REACTION","THE HBO ERA WAS SMALLER AND LOUDER","The hosts remember when a premium channel meant one cultural room instead of a dozen competing apps, then argue that prestige needs a home people can actually find."),
    H(9900,10120,"FAM SIGNAL","THE LONGEST STREAM RECORD","The room realizes it may be breaking its own runtime record. The viewers are still there, which makes the length feel earned instead of accidental."),
    H(10120,10340,"COMMUNITY DOOR","THE STORE-CHAIR STORY","A fan shares a difficult workplace incident. The hosts respond with empathy and a clear line: bodily messes are funny in stories, but real people deserve dignity."),
    H(10340,10560,"FILM READ","WATCHERS GET ITS PATREON SLOT","The membership request finally becomes the night's feature. The hosts explain why a viewer-funded movie tier is useful: it turns fan requests into actual programming."),
    H(10560,10780,"FILM READ","WATCHERS: THE 1988 CORE","A lab accident releases an enhanced dog and a second creature. Corey Haim, Michael Ironside, a military program, and a woods chase make the premise sound like three movies in one."),
    H(10780,11000,"FILM READ","THE DOG IS THE MOVIE'S HERO","The golden retriever's intelligence, the bond with the boy, and the simple pursuit story make Watchers a gateway horror recommendation for younger viewers."),
    H(11000,11220,"FILM READ","THE MONSTER HIDES TOO MUCH","The practical creature is mostly glimpsed, which helps tension but also hides effects that may not survive a full reveal. The room compares the strategy with Cloverfield and other partial-monster films."),
    H(11220,11440,"VERDICT","MICHAEL IRONSIDE WINS THE RECEIPT","The movie's best asset is Ironside: a controlled, intimidating antagonist who can sell military menace without needing the script to explain every motive."),
    H(11440,11660,"FILM READ","WATCHERS IS GOOSEBUMPS WITH A BODY COUNT","The story is simple enough for a young horror viewer, strange enough for adults, and just gory enough to make the room call it a pre-Goosebumps episode."),
    H(11660,11880,"FILM READ","CORY HAIM, SILVER BULLET, AND THE CAREER QUESTION","The hosts praise Haim in Silver Bullet while resisting the easy “everything from the 80s was a classic” argument."),
    H(11880,12000,"COMMUNITY DOOR","A DOG-CLEANUP RECEIPT GETS RESPECT","A worker who supports adults with disabilities shares a hard cleanup story. The hosts stop joking and thank them for doing work that is difficult, necessary, and rarely celebrated."),
    H(12000,12220,"FILM READ","THE TWO CORYS AND THE COST OF PUBLIC MEMORY","The room discusses Cory Haim and Corey Feldman with care, separating alleged abuse, public storytelling, and the uneasy feeling of watching someone else's trauma become a product."),
    H(12220,12440,"WRESTLING DOOR","STUNNING STEVE AUSTIN COULD HAVE SAVED WCW","A superchat reveals a WCW what-if: Steve Austin's old identity, Sting, Hollywood Hogan, and the alternate timeline where the company keeps its future megastar."),
    H(12440,12660,"NEWS REACTION","CARPENTER AND ENGLUND GET THEIR STARS","The room calls John Carpenter and Robert Englund's Hollywood recognition overdue and argues that horror deserves the same cultural respect as comic-book movies."),
    H(12660,12880,"TRAILER ROOM","HERETIC GETS A CREEPY A24 DOOR","Hugh Grant's new horror trailer becomes a possible future Patreon/member watchalong. The room is excited by the idea before it has enough information to overpromise."),
    H(12880,13049,"CLOSING READ","BATMAN BEGINS, WHITE WATER SUMMER, AND A FAM GOODNIGHT","Batman Begins beats Iron Man 1 for one host, White Water Summer gets a future-watch promise, and the 3h37m room closes by thanking the FAM for making an unplanned night an all-timer.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the June 25, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 50602,
      captionEvents: 14380,
      captionSpanSeconds: 13050.4,
      captionDurationCoveragePercent: 100.01,
      captionSha256: "4f9b9218e473531c274ef82cb411efc34dd74ea07268812273956bc9e8749d96",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "eee81dfc9ba6f4adac115b31a031271f66ca78a71f15e0dd9918960631b8bd39",
      asrWindowCount: 79,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "TUESDAY LIVE // JUNE 25, 2024",
    badge: "FULL SHOW WIKI // THE FAM, WATCHERS, HORROR HISTORY, AND HERETIC",
    headline: "A PLATFORM ETHICS OPEN, A THEATER-BATHROOM SURVIVAL STORY, WATCHERS, AND THE FAM THAT REFUSED TO LEAVE",
    deck: "A three-hour-thirty-seven-minute room that turns an unplanned live show into a full WWAM universe: serious platform questions, foul family lore, movie rankings, a 1988 creature feature, and real community care.",
    overview: "The June 25 room opens with a difficult subject: allegations involving a major streamer, a platform settlement, and the difference between legal outcomes, reported messages, and what a viewer can responsibly claim. Mike and Jay do not have a clean answer, but the archive keeps the useful part—the need for evidence, consent, accountability, and restraint when the internet wants a verdict in ten seconds. Then the room becomes unmistakably WWAM. They talk about quitting smoking, fasting, Michael and Dr. Loomis playing golf, seat-belt tickets, a six-o'clock start, a movie-theater bathroom disaster, a roadside aftermath, and the kind of ruined clothes that deserve a fake funeral. Deadpool & Wolverine gets a defense against color-grade outrage and lore homework. Maxxxine, X, and Pearl are ranked as a trilogy with different rewatch strengths. An 80s comedy Mount Rushmore expands into Ghostbusters, Beverly Hills Cop, The Breakfast Club, Back to the Future, and every other movie that makes a room start shouting over itself. The FAM supplies the emotional spine: hospital nerves, overseas viewers, the quitting-smoking milestone, hard-care work, and a member request that turns into the feature presentation. At the 3-hour mark, they finally review *Watchers* (1988): an enhanced dog, a second lab creature, Corey Haim, Michael Ironside, a military program, a woods chase, and an effects strategy that hides the monster almost too well. The verdict is affectionate but not soft. The story is a great gateway-horror premise; Ironside is the best part; the creature reveal is a problem; and the movie could have been an 80s classic with stronger filmmaking. The final run gets personal again—Cory Haim, Corey Feldman, public memory, alleged abuse, WCW's Stunning Steve Austin what-if, Carpenter and Englund's overdue recognition, Heretic, and Batman Begins versus Iron Man. The show ends without a planned topic because the FAM itself became the topic.",
    topics: Object.freeze(["Watchers (1988)", "Dr. Disrespect allegations", "Deadpool & Wolverine", "Maxxxine", "X", "Pearl", "The Exorcist", "Dr. Loomis", "Dr. Challis", "Cory Haim", "Corey Feldman", "Stunning Steve Austin", "John Carpenter", "Robert Englund", "Heretic", "The FAM"]),
    story: Object.freeze([
      { at: 0, end: 1320, label: "THE HARD OPEN AND THE EARLY ROOM", body: "Platform ethics, the six-o'clock start, heat, quitting smoking, Michael and Loomis golf, and the FAM roll call create a serious-to-filthy opening swing." },
      { at: 1320, end: 2640, label: "THE BATHROOM SURVIVAL STORY", body: "Seat belts, fasting, a theater emergency, a roadside aftermath, and a full embarrassment arc turn bodily panic into one of the show's biggest receipts." },
      { at: 2640, end: 3960, label: "DEADPOOL, MAXXXINE, AND THE 80S", body: "Beetlejuice parody, Deadpool's comedy contract, Maxxxine anticipation, sea-shell necklaces, and the 1980s comedy Mount Rushmore build the movie lane." },
      { at: 3960, end: 5280, label: "THE ROOM BECOMES A RECOMMENDATION ENGINE", body: "Final girls, Ron's squeaky chair, candy cigarettes, Hollywood's copy-of-a-copy problem, and secret-movie lore make the live archive feel searchable." },
      { at: 5280, end: 6600, label: "FAM CARE, LOOMIS, AND THE MODERN HORROR DEBATE", body: "A hospital request, Friday the 13th 2009, final-girl theory, and a movie theater/man-cave poll move between practical kindness and genre argument." },
      { at: 6600, end: 7920, label: "THE REMAKE LADDER AND THE LONG NIGHT", body: "TCM 2003, applesauce, Scarefest memories, an anesthesia story, Elden Ring, and a growing runtime make the middle stretch its own episode." },
      { at: 7920, end: 9240, label: "THE FAM KEEPS THE SHOW ALIVE", body: "Independence Day, the Devil in Me question, Sonia Blade, Tales from the Crypt, and the platform debate prove the chat is writing the running order." },
      { at: 9240, end: 10560, label: "THE PATREON MOVIE FINALLY ARRIVES", body: "A difficult workplace story clears the room for the membership feature: the 1988 Watchers review is not filler, it is the payoff of a fan request." },
      { at: 10560, end: 11880, label: "WATCHERS: DOG, MONSTER, IRONSIDE", body: "The enhanced dog, the military creature, the gateway-horror case, the hidden monster, and Michael Ironside's villainy get a full, specific verdict." },
      { at: 11880, end: 13049, label: "PUBLIC MEMORY, HERETIC, AND GOODNIGHT", body: "Cory Haim/Feldman, Carpenter and Englund, Heretic, WCW's Stunning Steve Austin, Batman Begins, and a grateful close give the marathon a human landing." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 10560, end: 11380, label: "WATCHERS: THE DOG AND THE MONSTER", topic: "a fan-requested 1988 creature feature gets its full due", body: "Play from 2:56:00. The enhanced dog, Michael Ironside, the military program, the gateway-horror argument, and the hidden creature all get specific receipts.", playAt: 10560, playEnd: 11380 }),
      hated: Object.freeze({ at: 0, end: 880, label: "THE PLATFORM PAYOUT QUESTION", topic: "a settlement leaves the public with more questions than answers", body: "Play from the opening. The hosts keep the claims, legal limits, and platform responsibility distinct instead of turning an unresolved news story into fake certainty.", playAt: 0, playEnd: 880 }),
      wildestDetour: Object.freeze({ at: 1760, end: 2640, label: "THE THEATER-BATHROOM SURVIVAL STORY", topic: "a normal screening turns into a private emergency", body: "Play from 29:20. A bathroom break, ruined clothes, a drive home, and the relief of not being behind the wheel make this the night's most replayable detour.", playAt: 1760, playEnd: 2640 }),
      lastWord: Object.freeze({ at: 12220, end: 12880, label: "STUNNING STEVE, CARPENTER, ENGLUND", topic: "wrestling history and horror recognition share the final hour", body: "Play from 3:23:40. WCW's missed future, overdue stars, Heretic, and the FAM's last superchats send the long room out on culture rather than a generic goodbye.", playAt: 12220, playEnd: 12880 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
