(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "bBp6tSU8kAM";
  var duration = 11473;
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

  /* May 15, 2024: a live 1994 ranking room that keeps proving the list is
     only the skeleton. The actual show is the Super Chat detours, the FAM
     arguments, the Street Fighter disappointment, and the way a movie year
     becomes a map of the hosts' whole taste. */
  var highlights = [
    H(0,180,"OPENING READ","THE ROOM LOADS THE 1994 MACHINE","The stream opens with the promise of a Top 10 Movies of 1994 list, but the first minutes make the real format clear: this is a live argument with a ranking board attached.") ,
    H(180,360,"FAM SIGNAL","SOCIAL CHAMELEON AND SHOWER CONFESSIONS","A fan prompt turns into a social-chameleon riff, then Michael Parton's message about thinking of the hosts in the shower gives the room its first hard left turn.") ,
    H(360,540,"COMEDY READ","THE ROOM IS ALREADY MONETIZED","Diet Coke, bad voices, and the realization that the stream has become unprintable before the list even starts establish the WWAM house rule: the joke is allowed to outrun the topic.") ,
    H(540,720,"FAM SIGNAL","JADA, JIM CARREY, AND THE BODY-SWAP DETOUR","A question about favorite actors drifts through Jada Pinkett Smith, Jim Carrey, and an invented social life. It is not filler; it is the room warming up in public.") ,
    H(720,900,"ROOM BREAK","THE DIET-COKE AND LATE-NIGHT RESET","The hosts talk through drinks, plans, and the oddness of being live late at night. The archive keeps the loose reset because it explains the rhythm of the rest of the show.") ,
    H(900,1080,"FAM SIGNAL","THE FIRST SUPER CHAT PARADE","The questions start arriving faster than the hosts can finish a thought: movies, wrestling, horror, and the kind of one-line prompts that make a supposedly focused list mutate into a channel memory bank.") ,
    H(1080,1260,"FORMAT SIGNAL","THE 1994 RULE IS PERSONAL, NOT OBJECTIVE","The room states the important boundary: these are personal favorites, not a claim that ten films are the ten greatest films ever made. That distinction makes the arguments more honest and more fun.") ,
    H(1260,1440,"CHARACTER PERFORMANCE","MONEY, XBOX, AND THE LOOMIS HOTLINE","A fan question about spending money on games opens a short gaming lane, then Dr. Loomis is summoned to answer a completely unrelated question as if the doctor is on call.", ["Dr. Loomis"]),
    H(1440,1620,"HEALTH CHECK-IN","THE ROOM DISCOVERS ITS OWN MEDICAL HISTORY","Smoking, not seeing a doctor, and the hosts' habit of treating basic health maintenance like an optional side quest turn a throwaway chat into a recognizable WWAM self-report.") ,
    H(1620,1800,"FAM SIGNAL","THE SHOWER QUESTION GETS WORSE","The fan wall keeps feeding the room material. What begins as a normal question becomes a bit about bodies pressed against walls, bathtubs, and Ace Ventura's deeply unhelpful confidence.") ,
    H(1800,1980,"COMEDY READ","NAPOLEON DYNAMITE MEETS THE LOAD ORDER","A gaming reference and a Napoleon Dynamite comparison collide, proving that the hosts can turn a single adjective into a complete fake character and then forget the original prompt.") ,
    H(1980,2160,"FAM SIGNAL","JADA ON SPEED AND THE DOLL QUESTION","A question about Jada Pinkett Smith and Speed becomes a miniature casting debate, a reminder that 1994 lives in the room as a network of actors rather than a clean list.") ,
    H(2160,2340,"FILM READ","THE PROFESSIONAL, SPEED, SERIAL MOM, AND THE YEAR'S GRAVITY","The chat starts stacking 1994 titles: Leon: The Professional, Speed, Serial Mom, and the movies that make the year feel impossibly dense.") ,
    H(2340,2520,"WRESTLING READ","HALLOWEEN HAVOC 96 WINS THE SIDE QUEST","A favorite WCW pay-per-view question pulls the room away from movies. Halloween Havoc 96, Bash at the Beach 96, Hogan's heel turn, and the old trampoline memory get treated like a parallel ranking canon.") ,
    H(2520,2700,"WRESTLING READ","BASH AT THE BEACH IS THE SHOCKWAVE","The hosts defend Bash at the Beach when Hogan joined the nWo as the kind of wrestling moment that changed the entire environment, then make fun of modern event names that sound like a suitcase chase.") ,
    H(2700,2880,"FAM SIGNAL","THE X-MEN 97 AND ABIGAIL CHECK-IN","A fan asks about X-Men 97 and Abigail. The answer is half genuine enthusiasm, half a deliberately fake plot summary that lands because everyone knows the room is lying badly.") ,
    H(2880,3060,"MODERATION LORE","THE CHOCOLATE-BAR GUY RECEIPT","A fan says they were banned for discussing the Friday the 13th Part 5 abuse allegations. The hosts acknowledge the subject, separate what they know from rumor, and preserve the moderation story without pretending to be investigators.") ,
    H(3060,3240,"FAM SIGNAL","THE JETS GET SENT TO THE BARBECUE","Monday Night Football and the New York Jets prompt one of the most vivid insults on the tape: green and white like vomit on a fancy person's carpet, with the shared-stadium joke close behind.") ,
    H(3240,3420,"HORROR READ","FIONA DOURIF IN A NIGHTMARE MOVIE","The hosts like Fiona Dourif but worry that her family connection to Chucky would bring too much baggage to a new Nightmare movie. The useful thesis is fresh unknown survivors, not stunt casting.") ,
    H(3420,3600,"FAM SIGNAL","THE 69 JOKE THAT NEVER GETS A LAUGH","A fan's number 69 joke gets the audience reaction it always gets: silence. Jay keeps doing it anyway, which is exactly why it belongs in the show wiki.") ,
    H(3600,3780,"FILM READ","LITTLE GIANTS IS THE LOST 1994 FAMILY MOVIE","Little Giants gets a real defense: Ed O'Neill and Rick Moranis, a small-town brother rivalry, funny children, adult jokes, and the rare family movie that is not condescending to either half of the room.") ,
    H(3780,3960,"NOSTALGIA READ","THE LION KING SOUNDTRACK AND THE RECORD-STORE ERA","The Lion King enters at number 10 through a memory of Tracks record stores, expensive CDs, and a childhood soundtrack that was played until the plastic nearly gave up.") ,
    H(3960,4140,"MUSIC READ","CIRCLE OF LIFE BECOMES A SEDUCTION JOKE","A genuine Lion King memory mutates into a story about using the soundtrack to attract girls. The hosts sing, regret it, and then do it again.") ,
    H(4140,4320,"FILM READ","INTERVIEW WITH THE VAMPIRE GETS THE DARK READ","The room revisits Interview with the Vampire, its long sadness, and the disturbing realization that a movie remembered as glamorous is also a story about grief, predation, and people making awful choices forever.") ,
    H(4320,4500,"FILM READ","THE 1994 LIST HAS A TONAL PROBLEM","The ranking collides with the fact that the year contains goofy comedies, family animation, grim crime movies, and vampire tragedy. The hosts argue about whether tone should matter when the couch test says yes.") ,
    H(4500,4680,"FILM READ","PULP FICTION RESTARTED TRAVOLTA","The Pulp Fiction discussion is not just praise. The room remembers Travolta's comeback, Samuel L. Jackson's controlled menace, and the question of whether the film's cultural impact is part of its rank.") ,
    H(4680,4860,"FILM READ","SPEED IS CRUISE CONTROL WITH A BOMB","Speed gets its case made through pace, Keanu Reeves, Sandra Bullock, Dennis Hopper, and the fact that the movie barely lets the audience breathe. Speed 2 is used as the cautionary sequel.") ,
    H(4860,5040,"FILM READ","THE PROFESSIONAL IS NOT A CLEAN COMFORT WATCH","Leon: The Professional gets respect for its performances and construction, but the hosts stop to acknowledge the film's uncomfortable adult/child dynamic rather than sanding it down into a simple favorite.") ,
    H(5040,5220,"FILM READ","THE SHAWSHANK DEFENSE","The Shawshank Redemption is praised as a drama with a horror-shaped institutional cruelty: Andy is trapped, the system is brutal, and the emotional payoff works because the film lets hope take time.") ,
    H(5220,5400,"FILM READ","THE CROW IS GRIEF IN A BLACK COAT","The Crow is treated as a personal favorite and a cultural object at once. Brandon Lee's death, the film's gothic look, and the sense that the movie became more haunted after production all sit in the same conversation.") ,
    H(5400,5580,"COMEDY READ","DUMB AND DUMBER GETS ITS NUMBER FIVE CASE","Dumb and Dumber gets defended as a Jim Carrey/Jeff Daniels machine whose grossest jokes are also the reason the movie remains rewatchable. Harry's worms line still detonates.") ,
    H(5580,5760,"COMEDY READ","THE RUSHMORE OF JIM CARREY","The room compares Dumb and Dumber with Ace Ventura and the rest of Carrey's run. The useful verdict is not that every film is perfect; it is that this stretch of Carrey made absurdity feel like a leading-man skill.") ,
    H(5760,5940,"FILM READ","TRUE LIES IS THE JAMES CAMERON FORMULA WORKING","True Lies gets a defense built on Arnold's action-comedy timing, Jamie Lee Curtis, Bill Paxton, and the feeling that the movie can be enormous without losing the joke in the middle of the set piece.") ,
    H(5940,6120,"CHARACTER PERFORMANCE","LOOMIS CATCHES MICHAEL IN THE WRONG TAB","A fan asks Dr. Loomis to explain Michael Myers watching gay pornography. Loomis answers with clinical certainty, a theory of Michael's rage, and the kind of explicit character improvisation that makes the character library worth having.", ["Dr. Loomis"]),
    H(6120,6300,"HORROR LORE","SCAREFEST GETS THE REAL EXPLANATION","Scarefest is explained as a smaller horror convention with autograph tables, photo opportunities, vendors, and actors. The fan-facing detail matters because the stream is not only jokes; it is also a community calendar.") ,
    H(6300,6480,"CHARACTER PERFORMANCE","THE HALLOWEEN KILLS MASK GETS ROASTED","A fan asks Loomis for encouragement while making a Halloween Kills flashback mask. Loomis tells him to do something else with his talent, then grudgingly gives permission to make the thing anyway.", ["Dr. Loomis"]),
    H(6480,6660,"FAM SIGNAL","LEE THE MACHINE DROPS A 1994 LIST","Lee's personal list begins with Airheads, Street Fighter, The Crow, Angels in the Outfield, Beverly Hills Cop III, D2, True Lies, Ace Ventura, and Speed. The room immediately argues over the order, which is the point.") ,
    H(6660,6840,"FILM READ","STREET FIGHTER IS A CHILDHOOD BETRAYAL","Street Fighter gets credit as a fun 1994 memory and a brutal critique as an adaptation. The hosts remember being young enough to want it to be great and old enough to know something was wrong.") ,
    H(6840,7020,"FILM READ","AIRHEADS IS THE UNDERRATED BAND MOVIE","Airheads gets the full defense: Brendan Fraser, Adam Sandler, Steve Buscemi, Chris Farley, an absurdly good cast, a soundtrack, and a music-industry joke engine that never stops spinning.") ,
    H(7020,7200,"STRAIGHT TO STEVE'S ASSHOLE","THE AIRHEADS BUTT-CRACK TAXONOMY","The hosts describe the band as if the entire cast smells like attic butt crack, then realize they have made a stronger case for the movie by accident. That is a pure Steve's Asshole receipt.") ,
    H(7200,7380,"FILM READ","EL MARIACHI IS A 90S TIME CAPSULE","El Mariachi earns its place through black-and-white texture, low-budget confidence, clothes, music, and the feeling that Robert Rodriguez captured the 1990s in a bottle instead of polishing it into a museum piece.") ,
    H(7380,7560,"FAM SIGNAL","THE HOSTS WANT TO WATCH AIRHEADS WITH THE FAM","A sincere bit about wanting someone else to love a movie becomes a miniature WWAM mission statement: the best watchalong is not the film alone, it is watching a friend discover why the film matters.") ,
    H(7560,7740,"FILM READ","DUMB AND DUMBER EARNS A TOP-THREE ARGUMENT","The room places Dumb and Dumber near the top because the pacing, jokes, and character chemistry survive repeated watches. The movie is not elevated by prestige; it is elevated by the couch refusing to let it go.") ,
    H(7740,7920,"FILM READ","TRUE LIES TAKES THE THIRD SLOT","True Lies is framed as a movie that knows exactly how to mix spectacle and stupidity. Arnold's inability to be subtle becomes the engine rather than a problem.") ,
    H(7920,8100,"FILM READ","ACE VENTURA IS THE NUMBER-ONE JOY MACHINE","Ace Ventura becomes the number-one pick for pure pleasure: Carrey's physical performance, the catchphrases, the animal detective premise, and the way the whole film commits to being a cartoon with a budget.") ,
    H(8100,8280,"COMEDY READ","ACE VENTURA IS SACRED GROUND","The room rejects the idea that the number-one pick must be respectable. Ace is defended because it delivers an exact kind of joy and because the audience can quote it before the scene finishes.") ,
    H(8280,8460,"FILM READ","THE CROW IS UNIVERSAL, NOT JUST GOTH","The Crow is defended against the idea that it belongs only to goth culture. Its grief, revenge, poster image, and simple emotional engine are presented as universal movie language.") ,
    H(8460,8640,"FILM READ","1994 WAS BEFORE THE COOKIE-CUTTER ERA","The hosts step back from the list and notice how many original projects fit in one year. The comparison to modern franchise assembly-line filmmaking is blunt: 1994 had room for weird movies to become themselves.") ,
    H(8640,8820,"FAM SIGNAL","THE LIST IS A SNAPSHOT OF 90S LIFE","The ranking is treated as a cultural snapshot, not merely a list of titles. The movies hold music, clothing, VHS habits, theaters, and the specific feeling of being young in the 1990s.") ,
    H(8820,9000,"HORROR READ","NEW NIGHTMARE MAKES THE HONORABLE-MENTION CUT","New Nightmare is praised for being smart enough to make the Freddy problem meta after Freddy's Dead had burned through the character. Wes Craven is credited with using reality as the repair tool.") ,
    H(9000,9180,"FAM SIGNAL","THE FAM KEEPS THE LIST MOVING","Questions about first watches, school memories, and movies seen with parents keep interrupting the ranking. The interruptions are the archive's point of entry into real fan memory.") ,
    H(9180,9360,"FILM READ","THE PHANTOM MENACE MEMORY ARRIVES EARLY","A later Star Wars memory opens a conversation about seeing The Phantom Menace twice and how living through a new release is different from discovering the older films after the fact.") ,
    H(9360,9540,"HOME MEDIA READ","4K IS WORTH THE MONEY","A 4K question gets a straightforward answer: the difference can be real, and the hosts remember the few discs they actually own. The practical recommendation is stronger because it is not pretending every upgrade matters equally.") ,
    H(9540,9720,"COMEDY READ","DUMB AND DUMBER'S PREQUEL BEATS ITS SEQUEL","The prequel gets a surprisingly fair hearing because it tries to carry the original spirit, while the sequel is accused of being afraid to pull the trigger on jokes. The icy brain-freeze scene is the evidence.") ,
    H(9720,9900,"FILM READ","JENNIFER'S BODY FINALLY GETS ITS FLOWERS","A fan's Megan Fox message turns into a real defense of Jennifer's Body as a funny, well-cast, well-paced dark comedy that succeeded where Species only gestured at the same idea.") ,
    H(9900,10080,"FAM SIGNAL","THE LIVER CHECK THAT WAS JUST THE LIGHTING","A viewer says Jay looks jaundiced. The room checks the lighting, jokes about a doctor's appointment, and then admits that public concern can still land even when the diagnosis is nonsense.") ,
    H(10080,10260,"FAM SIGNAL","THE SUPERMAN/DEADPOOL/BULLSEYE MARRY-KILL","A first-time Super Chat asks for a marry/kill list. Ryan Reynolds gets the marriage, Henry Cavill gets the dreamboat slot, and Bullseye is sent far away from the hosts' buttholes.") ,
    H(10260,10440,"LIST READ","THE HONORABLE-MENTION GRAVEYARD","The films that barely miss include On Deadly Ground, The Chase, Blue Chips, The Ref, Interview with the Vampire, The Client, The Getaway, and Reality Bites. The near-misses show how absurdly deep 1994 was.") ,
    H(10440,10620,"HORROR READ","NEW NIGHTMARE AND MAJOR LEAGUE 2 SHARE THE MARBLES","New Nightmare gets a second defense, then Major League 2 becomes the personal favorite that no longer holds up quite as well. The hosts preserve both the love and the rewatch correction.") ,
    H(10620,10800,"CHARACTER PERFORMANCE","LEE BOOKS LOOMIS AND CHALLIS A SHOPPING TRIP","Lee the Machine asks Loomis and Challis to take Michael underwear shopping. Loomis refuses to release him from the padded room; Challis is accused of loving thongs. The room turns a Super Chat into a full character scene.", ["Dr. Loomis","Dr. Challis"]),
    H(10800,10980,"CHARACTER PERFORMANCE","THE NATIONAL SEX ASSOCIATION","The shopping bit escalates into the fake NSA, boiler makers, and a plan to let the doctors investigate underwear drawers. It is the kind of character callback that should be playable from the character page, not buried in a recap.", ["Dr. Loomis","Dr. Challis"]),
    H(10980,11160,"FAM SIGNAL","SURF NINJAS GETS A BLUEBERRY RECEIPT","Lee asks about Surf Ninjas, its free YouTube availability, the absurd 1990s premise, Rob Schneider, Leslie Nielsen, and the kind of cult movie that can become a future watchalong instantly.") ,
    H(11160,11340,"RAP READ","KILLSHOT VERSUS RAP DEVIL","A fan asks for a diss-track verdict. One host picks Killshot, another fires back for Rap Devil, and the disagreement is quick, specific, and funny because neither side pretends the room has a referee.") ,
    H(11340,11473,"CLOSING READ","THE WENDY'S EXIT POLL","The stream ends by comparing fast-food loyalty, with Wendy's edging Popeyes in the room's final improvised poll. A 1994 movie ranking closes on burgers, which feels exactly right.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the May 15, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 41922,
      captionEvents: 10576,
      captionSpanSeconds: 11474.281,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "6d2485d7aaa13303d9ff944f5126216221e0ddf31972ec8f7639003e0d261b8a",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "b6bd26de096f00379dbf55cb6ac250f0c6607688debb6fc19199aedc759bc8ba",
      asrWindowCount: 67,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "MONDAY NIGHT LIVE // MAY 15, 2024",
    badge: "FULL SHOW WIKI // TOP 10 MOVIES OF 1994, AIRHEADS, ACE VENTURA, AND THE LOOMIS/CHALLIS FILE",
    headline: "1994 WAS A MOVIE YEAR WITH NO BRAKES, AND THE LIVE ROOM HAD OPINIONS",
    deck: "A four-hour ranking stream where Little Giants, The Lion King, Speed, The Crow, Airheads, True Lies, Dumb and Dumber, Ace Ventura, and the FAM all fight for the same couch.",
    overview: "The May 15 stream is not a clean countdown. It is a live argument about why 1994 still feels like a bottomless movie year. Before the ranking begins, Super Chats take the hosts through WCW pay-per-views, X-Men 97, Abigail, Scarefest, Fiona Dourif in a Nightmare movie, Michael Myers' browser history, and the Jets being compared to vomit on a fancy person's carpet. When the list finally arrives, the room separates personal favorites from objective greatness. Little Giants and The Lion King make the number-ten case from opposite ends of the family-movie spectrum. Interview with the Vampire, Pulp Fiction, Speed, The Professional, The Shawshank Redemption, The Crow, Dumb and Dumber, True Lies, Airheads, El Mariachi, Street Fighter, and Ace Ventura are not ranked with one shared philosophy; they are ranked by memory, rewatchability, cultural impact, and the feeling each movie leaves in the body. Lee the Machine's list is especially useful because it puts Airheads, Street Fighter, The Crow, Angels in the Outfield, Beverly Hills Cop III, D2, True Lies, Ace Ventura, and Speed in the same room and dares everyone to complain. Street Fighter becomes the childhood-betrayal chapter. Airheads gets a passionate defense as an underrated band movie with Brendan Fraser, Adam Sandler, Steve Buscemi, Chris Farley, and a soundtrack that should be easier to find. El Mariachi is praised as a black-and-white 90s time capsule. Dumb and Dumber, True Lies, and Ace Ventura make the top end because the hosts value joy and repeatability as much as craft. The second half becomes the honorable-mention graveyard: New Nightmare, Major League 2, Reality Bites, The Client, The Ref, Blue Chips, The Chase, Interview with the Vampire, and more. The show closes with Jennifer's Body, a fake liver diagnosis, a marry/kill prompt, Surf Ninjas, Killshot versus Rap Devil, and Lee booking Dr. Loomis and Dr. Challis for an underwear-shopping mission. The useful archive entry is not simply the list. It is the argument map: which movies are loved, which are defended, which have aged badly, which are remembered because of a parent or a VHS, and which become character bits before the title can even finish being said.",
    topics: Object.freeze(["Top 10 Movies of 1994", "Airheads", "Ace Ventura", "Dumb and Dumber", "True Lies", "The Crow", "Speed", "Little Giants", "The Lion King", "Street Fighter", "El Mariachi", "New Nightmare", "Scarefest", "Dr. Loomis", "Dr. Challis", "The FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze([
      { at: 0, end: 2160, label: "THE ROOM LOADS 1994 THROUGH SUPER CHATS", body: "The show opens with movie-year rules, shower confessions, wrestling, gaming, health detours, and the first signs that the ranking will never stay in one lane." },
      { at: 2160, end: 3420, label: "WCW, X-MEN, ABIGAIL, AND THE FIONA DOURIF QUESTION", body: "Wrestling memories, X-Men 97, Abigail, the Friday Part 5 moderation story, the Jets, and Fiona Dourif give the live room its horror-and-chaos spine." },
      { at: 3420, end: 4680, label: "LITTLE GIANTS, THE LION KING, AND INTERVIEW WITH THE VAMPIRE", body: "The first personal lists arrive: Little Giants, The Lion King, the CD-store memory, a filthy Circle of Life detour, and a dark read on Interview with the Vampire." },
      { at: 4680, end: 5940, label: "PULP FICTION, SPEED, THE PROFESSIONAL, AND SHAWSHANK", body: "The year gets serious without losing the jokes. Travolta's return, Speed's pacing, The Professional's discomfort, and Shawshank's patient hope all get their cases made." },
      { at: 5940, end: 7200, label: "LOOMIS, SCAREFEST, HALLOWEEN KILLS, AND LEE'S LIST", body: "Character improvisation and convention advice run directly into Lee the Machine's personal 1994 list and the Street Fighter disappointment chapter." },
      { at: 7200, end: 8460, label: "AIRHEADS, EL MARIACHI, DUMB AND DUMBER, AND ACE", body: "Airheads becomes the underrated band-movie champion, El Mariachi the 90s time capsule, Dumb and Dumber the repeat-watch engine, and Ace Ventura the joy machine." },
      { at: 8460, end: 9720, label: "THE ORIGINAL-MOVIE YEAR AND NEW NIGHTMARE", body: "The hosts step back from the list, notice how many original projects fit in one year, and defend New Nightmare as a smart repair after Freddy's Dead." },
      { at: 9720, end: 10440, label: "JENNIFER'S BODY AND THE LIVER CHECK", body: "Jennifer's Body gets its flowers, then a fake liver diagnosis and a real lighting check turn a movie conversation into a quick FAM wellness receipt." },
      { at: 10440, end: 10800, label: "THE HONORABLE-MENTION GRAVEYARD AND THE RANKING CORRECTION", body: "New Nightmare, Major League 2, Reality Bites, The Client, The Ref, and other near-misses prove that a list can be personal, revisable, and still emotionally true." },
      { at: 10800, end: 11473, label: "LOOMIS AND CHALLIS GO SHOPPING, THEN WENDY'S WINS", body: "The character universe returns for Lee's underwear fantasy, Surf Ninjas gets a cult-movie receipt, rap arguments happen, and the night exits through a fast-food poll." }
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 6780, end: 7060, label: "AIRHEADS GETS ITS FLOWERS", topic: "the band movie that nobody remembers to mention", body: "Play from 1:53:00. Brendan Fraser, Adam Sandler, Steve Buscemi, Chris Farley, the soundtrack, and the room's desire to watch the FAM discover it make this the warmest film defense on the tape.", playAt: 6780, playEnd: 7060 }),
      hated: Object.freeze({ at: 6650, end: 6720, label: "STREET FIGHTER'S CHILDHOOD BETRAYAL", topic: "the movie that looked wrong even before the hosts knew why", body: "Play from 1:50:50. The room separates a fun 1994 memory from an adaptation that never delivered the movie the audience thought it was getting.", playAt: 6650, playEnd: 6720 }),
      wildestDetour: Object.freeze({ at: 10620, end: 10800, label: "THE UNDERWEAR SHOPPING MISSION", topic: "Lee sends Loomis, Challis, and Michael to Victoria's Secret", body: "Play from 2:57:00. The padded-room argument, boiler makers, fake NSA, and the doctor/thong exchange are the full character bit, not a throwaway line.", playAt: 10620, playEnd: 10800 }),
      lastWord: Object.freeze({ at: 11340, end: 11473, label: "WENDY'S BEATS POPEYES", topic: "a four-hour movie ranking ends at the drive-thru", body: "Play from 3:09:00. The final fast-food percentages are a perfect WWAM exit: the serious list is over, but the argument is still alive.", playAt: 11340, playEnd: 11473 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
