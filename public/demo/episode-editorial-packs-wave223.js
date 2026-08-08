(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "s45QFC7m3WU";
  var duration = 10737;
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

  /* May 20, 2024: a Monday room that announces the Interstellar review,
     wanders through Costner, Fallout, wrestling and horror-franchise rights,
     then delivers a full, emotionally bruising Interstellar discussion. */
  var highlights = [
    H(0,180,"GAMING SIGNAL","THE NCR HOODIE AND THE FALLOUT REBOUND","A cheap New California Republic hoodie becomes the entry point to Fallout lore, the Amazon series, Fallout 4, Fallout 76, and the rare moment when a trend actually leads Jay back to a game he loves.") ,
    H(180,360,"FILM READ","KEVIN COSTNER'S TEN-HOUR WESTERN BET","Horizon is described as a four-part Western with a total runtime that could approach ten hours. The room respects the ambition, doubts the theater plan, and remembers that Costner can make a dirty three-and-a-half-hour turd feel strangely watchable.") ,
    H(360,540,"FILM READ","COSTNER'S KANSAS TEARS","The Cannes standing ovation, Costner's single tear, The Bodyguard, A Perfect World, and Field of Dreams form a Kevin Costner defense that is affectionate even when the men cannot stop laughing at the same tough-guy scene.") ,
    H(540,720,"WRESTLING READ","DIAMOND CUTTER, STUNNER, OR RKO?","The hosts rank wrestling finishers, give the RKO the visual crown, and still let Stone Cold's nut shot plus stomps win on showmanship. Lee the Machine's Super Chat supplies the launch pad.") ,
    H(720,900,"FILM READ","EDWARD SCISSORHANDS SHOULD STAY ONE-AND-DONE","Beetlejuice can support a sequel because its afterlife world is open. Edward Scissorhands cannot, unless the movie turns into an unexpectedly dark horror story about a grown Edward plucking villagers from a mountain house.") ,
    H(900,1080,"SOURCE CALLBACK","THE JASON RINGTONE IS THE LION KING","The hosts replay a piece of the old Loomis Tapes video where Michael calls Jason and Jason's ringtone is The Lion King. The clip is a direct bridge from the live room to the channel's own comedy history.") ,
    H(1080,1260,"COMEDY READ","R.I.P.D. HAS ONE PERFECT SCENE","A fan prompt brings up R.I.P.D. and the room remembers one tiny scene that made them cry laughing in the theater while everyone else wondered what the hell was funny.") ,
    H(1260,1440,"TRAILER WATCH","LONG LEGS IS THE BLIND WATCH NEXT","Multiple FAM members request Longlegs. The hosts deliberately avoid the latest trailer so the eventual watch can land cold, and call it one of the horror movies most likely to own the year.") ,
    H(1440,1620,"HEALTH CHECK-IN","THE DENTIST GOT TO THE WISDOM TOOTH","A cancelled Friday stream becomes a dentist story: the hygienist was gentle, the actual dentist was not, and Jay's jaw paid the price. The whole room turns routine medical care into a hostile worksite.") ,
    H(1620,1800,"FAM SIGNAL","THE USED, SLEEPERS, AND A SHANE DAWSON CALLBACK","Music requests, Sleepless questions, and a fan message about Shane Dawson's unusual social-media history demonstrate how quickly a Super Chat can split the room into three unrelated doors.") ,
    H(1800,1980,"FILM READ","SLEEPERS AND THE FONDA FAMILY ARGUMENT","The hosts discuss Sleepers, Matthew McConaughey, and the difference between a promising cast and an actual film they want to revisit. A FAM joke about a necklace and a black turtleneck turns it sideways.") ,
    H(1980,2160,"FAM SIGNAL","THE ROCK POSE AND THE FANNY PACK","A Dwayne Johnson image, a necklace, and a fanny pack become a tiny costume-design bit. It is not a movie review; it is a receipt of the room's willingness to chase a visual joke until it breaks.") ,
    H(2160,2340,"MUSIC READ","BLOODSPORT, KICKBOXER, AND THE SOUNDTRACK FIGHT","A fan's 4K Bloodsport question becomes a comparison with Kickboxer and a debate over which soundtrack actually survives the rewatch. Jay also begins shopping for a new co-host mid-sentence.") ,
    H(2340,2520,"HALLOWEEN LORE","HALLOWEEN ENDS NEEDED TO BE SCRAPPED","The room argues that reducing Cory's story and adding more Michael would not have saved Halloween Ends. The cleaner answer is harsher: scrap it and make the movie again.") ,
    H(2520,2700,"NEWS REACTION","MIKE FLANAGAN GETS THE EXORCIST QUESTION","A fan asks whether the Exorcist franchise can turn around. The hosts use Mike Flanagan as the possible adult in the room, then drift into a full argument about studios and what a sequel owes the original.") ,
    H(2700,2880,"FILM READ","THE NEW STRANGERS MOVIE GETS A FAIR TRIAL","The room learns a new Strangers movie exists, then gives it a more generous first read than the chat's hate campaign. The defense lasts until the mask is compared to Wreck-It Ralph.") ,
    H(2880,3060,"FILM READ","JASON'S MASK IS NOW A FORTNITE SKU","A new Jason reveal is treated as a rights-and-merchandise problem, not a slasher comeback. The hosts correctly predict that the first public content will be an NFT, a Fortnite skin, or a child's product before a real movie arrives.") ,
    H(3060,3240,"FAM SIGNAL","DEADPOOL AND WOLVERINE TICKETS ARE A 6 A.M. PROBLEM","The chat announces that tickets are already on sale. The room remembers Avengers: 2012's sold-out houses and wonders whether this is the next movie that makes people reserve seats before breakfast.") ,
    H(3240,3420,"GAMING SIGNAL","FALLOUT 4, MODS, AND THE LOAD-ORDER CURSE","Mike admits the Fallout show rekindled the fire, pushed him back to Fallout 4, and will almost certainly make him crash the game with mods before he reaches Fallout 76. It is a perfect gamer self-own.") ,
    H(3420,3600,"FILM READ","BAD BOYS 4 DOES NOT HAVE THE OLD CONNECTION","Bad Boys and Bad Boys II are defended as real favorites while Bad Boys 3 and the upcoming fourth film are treated as diminishing returns. The room is not anti-sequel; it is anti-franchise autopilot.") ,
    H(3600,3780,"ROOM BREAK","MILWAUKEE'S BEST, BUD LIGHT, AND THE BEER RESET","A visit home with no beer becomes an impromptu grocery run, a defense of cheap beer, and the sound of a room reloading after a technical hiccup.") ,
    H(3780,3960,"FILM READ","BAD BOYS, WILD BILL, AND THINGS TO DO IN DENVER","The Bad Boys debate reopens, then a fan's Wild Bill reference lands on Deadwood. The room recommends Things to Do in Denver When You're Dead while turning West Virginia into a chorus.") ,
    H(3960,4140,"MUSIC READ","COUNTRY ROADS BECOMES A LIVE JAM","The hosts stumble into Country Roads, Sloan, Papa Hades, and the realization that a remembered song can become a better stream segment than the question that prompted it.") ,
    H(4140,4320,"WRESTLING READ","NITRO MEMORIES AND THE LAST MATCH","A question about WCW's final Nitro brings back the feeling of watching the company collapse in real time, with the hosts separating nostalgia for the performers from disgust at the ending.") ,
    H(4320,4500,"FILM READ","THE STRANGERS TRILOGY HAS A CONTINUITY PROBLEM","The new Strangers films are judged on the promise of a larger story, the need for character work, and the suspicion that a trilogy can turn a simple home-invasion idea into an agency-approved content package.") ,
    H(4500,4680,"COMMUNITY DOOR","BULLYING, AGENCY WORK, AND LONG-TERM DEBATES","A fan asks about bullying and the hosts answer with their own school memories, then talk about how long their arguments actually last. Most fights burn out in minutes; the tape keeps the honest admission.") ,
    H(4680,4860,"HEALTH CHECK-IN","THIRTY-EIGHT DAYS WITHOUT A CIGARETTE","Jay describes the brain bargaining for one cigarette after more than a month without smoking. The language is blunt, the decision is clear, and the archive keeps it as a personal recovery check-in rather than a prescription.") ,
    H(4860,5040,"HORROR LORE","THE FRANCHISE THAT DOES NOT NEED A SEQUEL","A game of choosing one horror film whose sequels should not exist leads into Nightmare on Elm Street, Jeepers Creepers, Pumpkinhead, The Ring, and the difference between a self-contained ending and a franchise machine.") ,
    H(5040,5220,"HALLOWEEN LORE","HALLOWEEN WOULD BE SCARIER IF IT ENDED","The hosts make the strongest Halloween argument on the tape: if the original ended with Michael breathing and nobody touched the property again, the Shape would remain an unknowable neighborhood threat rather than a mythology product.") ,
    H(5220,5400,"CHARACTER PERFORMANCE","DR. CHALLIS' TEXAS ROADHOUSE ORIGIN","A nineteen-year-old FAM request asks about Dr. Challis and Dr. Loomis. The answer invents a filthy Texas Roadhouse past, boiler makers, an anatomy education, Linda, the kids, and the doctor’s suspiciously confident bedside manner.", ["Dr. Challis","Dr. Loomis"]),
    H(5400,5580,"PARANORMAL READ","WAVERLY HILLS IS NOT GETTING THE KEYS","The hosts are asked about Waverly Hills. They do not believe in ghosts, do not want to bring a “booger monster” home, and would rather watch paranormal footage online than volunteer their buttholes for a haunting.") ,
    H(5580,5760,"COMMUNITY DOOR","COVID, COMEDY, AND THE FAM THAT STAYED","A fan says WWAM got them through COVID and a family death. The hosts answer sincerely, remembering the daily streams, the parties, and the strange community that formed while the world was shut down.") ,
    H(5760,5940,"HALLOWEEN LORE","FREDDY IS NASTIER, JASON IS MORE BROKEN","The answer to “who is more messed up?” splits the villains by type: Freddy is personally nastier; Jason is a village idiot; the Friday franchise is the one with no one in the kitchen who knows where the lights are.") ,
    H(5940,6120,"HORROR LORE","JASON'S RIGHTS ARE THE GREASE FIRE","Dead by Daylight, Jason requests, and the legal fight around Friday the 13th explain why Jason is absent from games and screens. The room's anger is not at the developers; it is at the rights mess strangling the character.") ,
    H(6120,6300,"WRESTLING READ","STING LEARNED THE BUSINESS","A fan asks about Sting and the nWo. Sting is defended as the wrestler who learned the craft, while Ultimate Warrior gets reduced to muscles, catchphrases, and a refusal to do the homework.") ,
    H(6300,6480,"FAM SIGNAL","DEAD BY DAYLIGHT AND THE JASON WAIT","The FAM follows the game, Jason's likely future skin, and the legal reality that keeps the obvious killer off the roster. It is a good example of the archive connecting fan play to franchise history.") ,
    H(6480,6660,"HORROR READ","IN A VIOLENT NATURE GETS A CAUTIOUS MAYBE","The new Canadian slasher is discussed without a fake verdict. Jay has not seen it, the trailer suggests a strange shape, and the room asks whether it could become the next Friday rather than pretending that answer is known.") ,
    H(6660,6840,"STRAIGHT TO STEVE'S ASSHOLE","THE MORNING-AFTER-PILL QUEST","A bathroom/health-store story turns into a timed obstacle course where the medicine is always hidden in Narnia. It is a tiny, beautifully stupid Steve's Asshole segment.") ,
    H(6840,7020,"FILM READ","TANGO & CASH IS A FAM ASSIGNMENT","A fan is about to watch Tango & Cash for the first time. The room treats that as a cultural emergency and a guaranteed future Patreon door.") ,
    H(7020,7200,"FAM SIGNAL","THE STREAM CATCHES A LIE IN REAL TIME","Jay admits he lied about seeing something, then confesses because the video is sitting there as evidence. The moment is funny, but it also explains why the archive should preserve receipts instead of trusting memory.") ,
    H(7200,7380,"HALLOWEEN LORE","JASON X IS A GOOD BAD POPCORN MOVIE","Uber Jason gets a fair defense: it looks cool, the movie is silly, and that version should never become the franchise's permanent direction. WWAM can love a trashy side road without calling it the main highway.") ,
    H(7380,7560,"WRESTLING READ","THE WOLFPACK SPLIT WAS POINTLESS","The nWo's red-and-black phase, its music, and the split from the original group are treated as a cool entrance stapled to a needless story. The answer is affectionate but not forgiving.") ,
    H(7560,7740,"CHARACTER PERFORMANCE","THE CHALLIS/LUMIS CAR RIDE","A fan request puts Dr. Challis and Dr. Loomis in a limousine with cheap vodka, club plans, sexy underwear, a “date-rape” warning, and a sudden return to zero when the night gets too dangerous.", ["Dr. Challis","Dr. Loomis"]),
    H(7740,7920,"FAM SIGNAL","MOVIES WITH PEOPLE WHO HAVE NOT SEEN THEM","The hosts talk about introducing spouses and family members to Star Wars, Batman Begins, American Psycho, Fight Club, Seven, and other canon films. Sharing a first watch becomes one of the show's most genuine forms of intimacy.") ,
    H(7920,8100,"FILM READ","LONG LEGS, CUCKOO, AND THE NEON QUESTION","Long Legs gets the strongest confidence, while Cuckoo is told to stop borrowing the Jack Nicholson original's oxygen. Neon, festival buzz, and Nicolas Winding Refn comparisons make the release conversation specific.") ,
    H(8100,8280,"FILM READ","X-MEN IS TOO BIG TO HALF-ASS","The room warns that a new X-Men project will be difficult because studios may not understand how big the property is. “Easy peasy” is the joke; getting the mutant universe right is the hard part.") ,
    H(8280,8460,"FILM READ","INTERSTELLAR OPENS WITH A PERFECT MACHINE","The Patreon review begins: the blight, the failing crops, the scale of the mission, and the argument that Nolan's technical control makes the movie look like a physical object instead of a pile of effects.") ,
    H(8460,8640,"FILM READ","THE BLACK HOLE IS SCIENCE WITH A HUMAN FACE","The room praises the physicist-informed black hole, the planet with the giant waves, and Matthew McConaughey's performance while still admitting that some Earth-side material feels like a delay before the movie gets back to space.") ,
    H(8640,8820,"FILM READ","INTERSTELLAR IS A SPACE MOVIE FOR PEOPLE WHO HATE SPACE MOVIES","Jay admits most space movies bore him. Interstellar wins him back through new worlds, physical scale, and a grounded human story rather than asking the audience to admire abstract math for its own sake.") ,
    H(8820,9000,"FILM READ","LEAVING THE KIDS IS THE REAL HORROR","The movie's central pain lands: Cooper is a deeply attentive father who drives away from his children knowing he may never return. The hosts describe the film as emotionally horrific, not merely sad.") ,
    H(9000,9180,"FILM READ","THE SEVEN-YEAR WAVE","The time-dilation planet becomes the room's emotional pressure cooker. Ten minutes away costs decades at home, and every cut back to Earth makes the audience feel the bill arriving.") ,
    H(9180,9360,"FILM READ","THE WATCH, THE BOOKSHELF, AND THE STRETCHY PANTS","The bookshelf, the multi-dimensional space, and the Morse-code watch get both praise and suspicion. The room loves the emotional payoff while calling the plot armor exactly what it is.") ,
    H(9360,9540,"FILM READ","MURPH'S RETURN IS THE KNIFE TWIST","The old Murph recognizes her father, tells him to leave, and sends him after Amelia. The hosts admit the ending made them cry, then immediately ask how anyone could explain an ageless father to a room full of grandchildren.") ,
    H(9540,9720,"FILM READ","THE AMELIA BRANDO SUBPLOT","The room dislikes Amelia's romantic mission and some of the Earth-side exposition, but still credits Interstellar for making the black hole, the wave planet, and the final sacrifice feel enormous.") ,
    H(9720,9900,"FILM READ","SCORSESE, KILLERS OF THE FLOWER MOON, AND THE PULL TEST","The hosts call Killers of the Flower Moon excellent and beautifully made, then admit it never pulled them back the way Goodfellas does. A film can be a masterpiece and still lose the couch test.") ,
    H(9900,10080,"FILM READ","THE EVIL DEAD FIRST-WATCH BETRAYAL","A fan asks about a movie that landed badly. The original Evil Dead scared Jay; the person he showed it to laughed at the effects. Fight Club gets the same treatment in a second story about loving a movie alone.") ,
    H(10080,10260,"FAM SIGNAL","STEPHEN KING'S YOU LIKE IT DARKER","A new King collection and a Cujo follow-up called Rattlesnakes open a book door, followed by a dark confession about a stolen King collection and Dean Koontz's “weird uncle at the cookout” energy.") ,
    H(10260,10440,"FAM SIGNAL","LEE THE MACHINE AND STEVE BUSCEMI","Lee's concern about Steve Buscemi being punched becomes a sincere community reaction, then Sarah's birthday and a Halloween Stalks 2 request keep the FAM wall alive late in the tape.") ,
    H(10440,10620,"CHARACTER PERFORMANCE","DR. CHALLIS GOES CLUBBING","Lee the Machine's limousine request brings Dr. Challis back for a final bit: sexy underwear, I-75, vodka, a fisherman, a creeping hand, and the hard reset of waking up as if the night never happened.", ["Dr. Challis"]),
    H(10620,10737,"CLOSING READ","NO TOPIC, FOUR HUNDRED PEOPLE, AND THE 8MM DETECTIVE","The hosts admit there was no topic, thank nearly 400 people for staying anyway, imagine an underwater detective scene, and close with Black fingernails, dirty evidence, and a final “good night” that refuses to behave.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the May 20, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 40390,
      captionEvents: 10524,
      captionSpanSeconds: 10738.2,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "fe1d5594cc167189be267324ae45dc290187fe70aca8cf9fa79f283150493635",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "f0ec470d0ba57d8587d2bd087ff09f603ab244ea9894398e663ada22c7cb7980",
      asrWindowCount: 46,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "MONDAY NIGHT LIVE // MAY 20, 2024",
    badge: "FULL SHOW WIKI // INTERSTELLAR, HALLOWEEN SEQUELS, JASON RIGHTS, AND THE CHALLIS/LUMIS FILE",
    headline: "THE INTERSTELLAR EMOTIONAL DAMAGE REVIEW, HALLOWEEN'S LOST MYSTIQUE, AND DR. CHALLIS ON I-75",
    deck: "A no-topic Monday room that starts with Fallout and Kevin Costner, detours through horror franchise rights, then turns Interstellar into a three-quarter-hour argument about time, fatherhood, and the couch test.",
    overview: "The May 20 stream is a perfect example of why a WWAM Show Wiki cannot be a list of topics. It opens with an NCR hoodie, Fallout 4, Fallout 76, and the news that the room will finally review Interstellar for Tim C. The first hour wanders through Kevin Costner's gigantic Horizon gamble, Yellowstone, The Postman, The Bodyguard, A Perfect World, wrestling finishers, Edward Scissorhands, and a replay of the old Loomis Tapes video where Jason gets a Lion King ringtone. Long Legs is deliberately saved for a blind future watch. A dentist visit, The Used, Sleepers, Bloodsport, R.I.P.D., Bad Boys 4, The Crow, and a new Strangers movie fill the room with the kind of fan questions that would disappear inside a normal recap. The strongest franchise section arrives when the hosts ask which horror films were damaged by sequels. Nightmare on Elm Street, Jeepers Creepers, Pumpkinhead, The Ring, Texas Chainsaw, Halloween, and The Exorcist are compared by how much their follow-ups punctured the original mystery. Halloween gets the sharpest thesis: Carpenter's Shape was terrifying because it could be anybody, anywhere, and every sequel made that unknowable threat more legible. Jason's legal mess gets its own anger lane, with Dead by Daylight, missing killers, and rights holders who seem more interested in a check than a movie. Dr. Challis and Dr. Loomis answer a birthday question with a filthy invented origin, then return in a limousine story that sounds like a lost WWAM short. The second half is the Interstellar review. The hosts praise the black hole, practical scale, cinematography, physics, and Matthew McConaughey's performance while admitting Earth-side exposition drags. What truly wrecks them is not the science; it is Cooper leaving his children, losing decades to a wave, seeing Murph age through messages, and arriving too late to have a normal reunion. The movie becomes a horror story about time. They love the bookshelf and the watch, call some of the plot mechanics stretchy, reject part of the Amelia subplot, and still land on a film that is technically extraordinary and emotionally punishing. The room closes on Killers of the Flower Moon, Evil Dead and Fight Club first-watch betrayals, Stephen King, Lee the Machine, Sarah's birthday, a Speak No Evil remake question, and the final Challis/Loomis clubbing bit. The archive should let a fan enter through Interstellar, Halloween lore, the Loomis Tapes callback, or the FAM wall and still understand the whole night.",
    topics: Object.freeze(["Interstellar", "Fallout 76", "Kevin Costner", "Horizon", "Halloween", "Nightmare on Elm Street", "Jason Voorhees", "Long Legs", "Dr. Loomis", "Dr. Challis", "The Crow", "Dead by Daylight", "The Iron Claw", "The Mist", "The FAM"]),
    story: Object.freeze([
      { at: 0, end: 1080, label: "FALLOUT, COSTNER, WRESTLING, AND EDWARD SCISSORHANDS", body: "An NCR hoodie, Horizon's ten-hour commitment, Costner's best film, wrestling finishers, Beetlejuice, Edward Scissorhands, and the Lion King Jason ringtone make the opening a full memory lane." },
      { at: 1080, end: 2160, label: "R.I.P.D., LONG LEGS, DENTISTRY, AND SLEEPERS", body: "A perfect R.I.P.D. scene, a blind Long Legs plan, a painful dentist visit, The Used, Sleepers, and FAM wardrobe jokes keep the room loose." },
      { at: 2160, end: 3240, label: "BLOODSPORT, HALLOWEEN ENDS, AND STRANGERS", body: "Bloodsport, Kickboxer, the new Strangers movie, Jason merchandise, Deadpool ticket demand, and a hard Halloween Ends argument fill the first movie-news spine." },
      { at: 3240, end: 4320, label: "FALLOUT, BAD BOYS, BEER, AND THE WEST VIRGINIA SONG", body: "Fallout mods, The Crow, Bad Boys 4, cheap beer, Things to Do in Denver When You're Dead, Country Roads, and WCW memories make the mid-room feel like a bar conversation." },
      { at: 4320, end: 5400, label: "STRANGERS, BULLYING, SMOKING, AND THE SEQUEL TEST", body: "The Strangers trilogy, school memories, quitting smoking, Nightmare, Jeepers Creepers, Pumpkinhead, The Ring, Halloween, and the Dr. Challis birthday origin shift the tone." },
      { at: 5400, end: 6480, label: "WAVERLY HILLS, COVID, FREDDY, JASON, AND STING", body: "Ghost skepticism, the FAM's COVID story, Freddy versus Jason, the Friday rights mess, Dead by Daylight, Sting, and Ultimate Warrior create the lore-heavy middle." },
      { at: 6480, end: 7560, label: "IN A VIOLENT NATURE, TANGO & CASH, AND JASON X", body: "A cautious new-slasher read, a morning-after-pill detour, Tango & Cash, quitting-smoking support, a caught lie, Jason X, and the Wolfpack split keep the tape in motion." },
      { at: 7560, end: 8640, label: "MOVIE FIRST WATCHES, LONG LEGS, X-MEN, AND INTERSTELLAR", body: "Sharing Star Wars and Batman with family leads to Long Legs, Cuckoo, the size of X-Men, and the opening technical pass on Interstellar." },
      { at: 8640, end: 9720, label: "INTERSTELLAR'S BLACK HOLE AND THE FATHERHOOD HORROR", body: "Physics, new worlds, time dilation, Cooper's children, Murph, the bookshelf, the watch, and the painful ending become the complete emotional review." },
      { at: 9720, end: 10737, label: "SCORSESE, EVIL DEAD, KING, THE FAM, AND DR. CHALLIS", body: "Killers of the Flower Moon, Evil Dead and Fight Club first-watch betrayals, Stephen King, Lee the Machine, Sarah's birthday, Speak No Evil, and the clubbing goodbye close the night." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 8460, end: 9300, label: "INTERSTELLAR'S TIME-DILATION KNIFE", topic: "the movie turns space travel into lost childhood", body: "Play from 2:21:00. The hosts praise the black hole and wave planet, then admit the real horror is losing decades with your children.", playAt: 8460, playEnd: 9300 }),
      hated: Object.freeze({ at: 5000, end: 5240, label: "HALLOWEEN'S SEQUEL DAMAGE", topic: "the Shape was scarier before the mythology got named", body: "Play from 1:23:20. Halloween, Nightmare, The Ring, and Texas Chainsaw get compared by how much each sequel dissolved the original mystery.", playAt: 5000, playEnd: 5240 }),
      wildestDetour: Object.freeze({ at: 5260, end: 5400, label: "DR. CHALLIS AT TEXAS ROADHOUSE", topic: "a birthday question becomes a filthy origin myth", body: "Play from 1:27:40. Dr. Challis and Dr. Loomis answer a nineteen-year-old's question with boiler makers, anatomy, and a past their children should never hear.", playAt: 5260, playEnd: 5400 }),
      lastWord: Object.freeze({ at: 10460, end: 10620, label: "CHALLIS AND LOOMIS IN THE LIMO", topic: "Lee the Machine books the worst date in Kentucky", body: "Play from 2:54:20. Vodka, I-75, a fisherman, sexy underwear, and a hand creeping toward the wrong place give the room its final character receipt.", playAt: 10460, playEnd: 10620 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
