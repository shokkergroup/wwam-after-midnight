(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "Var4sSlt-dk";
  var duration = 10725;
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

  /* May 25, 2024: a nearly three-hour Saturday room that starts with a
     runtime fight, detonates on Beetlejuice and Longlegs trailers, detours
     through a real dog emergency, then closes on Wolverine, Batman, and FAM
     character work. */
  var highlights = [
    H(0,180,"FILM READ","FURIOSA LOSES THE RUNTIME BATTLE","The room likes the craft but cannot justify a two-and-a-half-hour pre-show commitment for a Mad Max side story. The first rule of this tape is simple: do not ask the audience to donate an entire afternoon to a movie they only kind of want.") ,
    H(180,360,"FILM READ","THE 1994 FANTASTIC FOUR DEFENSE","Jay has started the unreleased Roger Corman Fantastic Four and argues that its tiny budget, practical Thing work, and comic-book faithfulness make it more watchable than its reputation.") ,
    H(360,540,"FILM READ","THE FALL GUY RUNS OUT OF GAS","The Fall Guy is praised as a fun 1990s-style action movie, then the room reaches the third act and discovers there are still forty minutes left. The joke is really a pacing diagnosis.") ,
    H(540,720,"FILM READ","NOT EVERY MOVIE IS FORREST GUMP","Batman, Furiosa, Planet of the Apes, and the dreaded preview block become a defense of shorter movies. Even a good movie can lose a ticket buyer when the whole outing becomes three and a half hours.") ,
    H(720,900,"FILM READ","X-MEN 97 MAKES MAGNETO A CLUB 54 REJECT","The new X-Men cartoon gets a real recommendation, followed by a vicious Magneto costume read and an argument about how comic accuracy can still look like a man who lost a bet at McDonald's.") ,
    H(900,1080,"CHARACTER PERFORMANCE","DUKE NUKEM GETS A SOUTHERN VOICE","A voice impression turns into Duke Nukem, a filthy catchphrase, and the first small proof that a FAM prompt can become a playable character doorway without pretending it is a straight interview.", ["Duke Nukem"]) ,
    H(1080,1260,"GAMING SIGNAL","FALLOUT 76 AFTER THE FALLOUT SHOW","Jay explains that the Amazon Fallout series pushed him into Fallout 76. The game is treated as an unexpectedly good MMO, not as a sacred object: the fun is in the addiction and the antisocial play style.") ,
    H(1260,1440,"PHYSICAL MEDIA","THE 4K CONVERSION","Jay admits he was spectacularly wrong about 4K, then describes Top Gun as a religious experience and wonders whether Bloodsport can get the same treatment. This is the archive's cleanest physical-media confession.") ,
    H(1440,1620,"GAMING SIGNAL","LEGENDS OF WRESTLEMANIA SHOULD BE BACKWARD COMPATIBLE","WrestleMania III, Hogan versus Warrior, the old Legends of WrestleMania game, and the dead-end of modern console compatibility turn a technical complaint into a full nostalgia bracket.") ,
    H(1620,1800,"STRAIGHT TO STEVE'S ASSHOLE","THE $1,100 DOG-FIGHT EMERGENCY","A real dog fight left one pet with a hole in its head and a massive emergency-vet bill. The hosts use dark humor to process the panic, but the receipt stays grounded: the dog survives and the room is shaken.") ,
    H(1800,1980,"STRAIGHT TO STEVE'S ASSHOLE","THE VETERINARY BILL HAS A MORTGAGE PLAN","The emergency clinic's cheerful financial language becomes a WWAM nightmare: initial visit, treatment, and a payment plan that sounds like the hospital is about to take the house and a child.") ,
    H(1980,2160,"FAM SIGNAL","LIAR LIAR IS A REWATCHABLE MACHINE","A fan asks for a movie that never gets old. Liar Liar and Ace Ventura win because the hosts can quote the shape of the joke, watch the credits, and still laugh instead of pretending nostalgia is analysis.") ,
    H(2160,2340,"COMEDY READ","SHAWSHANK, ALIENS, AND THE FAM'S IMPOSSIBLE QUESTIONS","The room jumps from a prison movie to alien encounters, bad karaoke, and an escalating question about what kind of creature could ruin a night out. This is the unstructured middle that a normal episode list would erase.") ,
    H(2340,2520,"WWAM UP IN YA","THE SOCKS, THE SUPER CHAT, AND THE STUPIDEST CONFIDENCE","A fan interaction, a wardrobe confession, and an offer that absolutely should not be made on a public livestream form a compact example of the show's adult-only side lane.") ,
    H(2520,2700,"TRAILER REACTION","BEETLEJUICE BEETLEJUICE FINALLY ROLLS THE TAPE","Mike returns and the room stops treating the Beetlejuice trailer as a promise. The clip includes the setup, the new family crisis, and the first genuine audience reaction before anyone starts grading it.") ,
    H(2700,2880,"TRAILER REACTION","THE BEETLEJUICE TRAILER'S SUCCESSFUL ASS","A teenage demon, a forced marriage, the attic discovery, a three-name resurrection, and the immediate question about a musical number turn the trailer into a full WWAM reaction rather than a thumbnail verdict.") ,
    H(2880,3060,"FILM READ","BEETLEJUICE IS NOW JACK SPARROW?","The room likes the trailer but worries that Beetlejuice has shifted from antagonist to wisecracking mascot. The Corpse Bride comparison is blunt, specific, and exactly the kind of continuity concern a fan can debate.") ,
    H(3060,3240,"SPORTS READ","THE CHAT AND THE COURTROOM DETOUR","Basketball, a fan's rapid-fire questions, and a medical appointment story make the room feel like a real hangout. It is less a segment than the connective tissue between the big trailer doors.") ,
    H(3240,3420,"STRAIGHT TO STEVE'S ASSHOLE","THE COLONOSCOPY STETHOSCOPE","A doctor visit becomes an anatomy panic: no, the stethoscope is not going where the chat wants it to go. The joke works because the fear is ordinary and the imagination is not.") ,
    H(3420,3600,"HEALTH CHECK-IN","QUITTING SMOKING, DADDY'S LUNG STORY, AND NOT JINXING IT","Jay talks about cutting back and the family history that makes the decision real. The page keeps this as personal context, not medical advice, and lets the humor sit beside the seriousness.") ,
    H(3600,3780,"FILM READ","LONG LEGS IS THE NEXT WATCHALONG DOOR","The room confirms a future Longlegs trailer watch, praises the Fantastic Four discussion, and lets Michael Parton's chat correction become the bridge into the next major section.") ,
    H(3780,3960,"FAM SIGNAL","WHERE HAS JAY BEEN? HE'S BEEN HERE","The schedule confusion gets a direct answer: Jay has been present; the notification bell and the audience's attention have not. It is a funny, slightly hostile community service announcement.") ,
    H(3960,4140,"TECHNICAL ROOM","THE CAMERA, THE CHAT, AND THE STREAM THAT WILL NOT BEHAVE","A technical explanation about unstable capture and the dream of getting a proper game room becomes a meta moment: even this archive's most chaotic rooms have production scars.") ,
    H(4140,4320,"GAMING SIGNAL","GHOSTBUSTERS, DENNY'S, AND THE DEVIL'S ADVOCATE SUBWAY","A fan imagines Wahlberg and Pacino in a backed-up subway line while Jay wears a fanny pack. The hosts derail the prompt into a full character scene and then remember they still have a game to discuss.") ,
    H(4320,4500,"FILM READ","PLANET OF THE APES GETS A MARK WAHLBERG SPEED BUMP","Jay has only seen the original and the Mark Wahlberg remake, which produces an accidental anti-Caesar argument. The room separates respect for the idea from a refusal to sit through another CG-heavy runtime.") ,
    H(4500,4680,"FILM READ","PRACTICAL EFFECTS ARE LOVE ON CAMERA","The original Planet of the Apes, Jim Henson's Turtles, and the modern appetite for digital spectacle become a manifesto: practical work forces imagination, texture, and actual attention.") ,
    H(4680,4860,"FILM READ","TWISTERS MUST KEEP THE DUSTY-BUTT HUMANITY","The sequel is judged on its trailer, its country soundtrack, and whether the characters feel like normal people rather than a theme-park version of the South. The room is exactly fifty-fifty and knows it.") ,
    H(4860,5040,"COMEDY READ","EASTERN KENTUCKY, CHILD OF THE CORN, AND THE DIP TEST","A Kentucky travel answer becomes a horror landscape, a Child of the Corn compliment, and a brutal confession that chewing tobacco is not a personality anyone should copy.") ,
    H(5040,5220,"FAM SIGNAL","WHO REPLACES HUGH JACKMAN?","Charlie Hunnam, Tom Hardy, and a wildly rejected Daniel Radcliffe rumor get tested as Wolverine replacements. The archive keeps the uncertainty because the point is the conversation, not a fake casting announcement.") ,
    H(5220,5400,"HALLOWEEN LORE","TARANTINO'S HALLOWEEN 6 BEATS FREDDY/JASON/ASH","The hypothetical matchup is clear: a Tarantino Halloween 6 wins because it could keep Halloween's grit while giving the dialogue an actual spine, unlike a crossover that would need three franchises to surrender their icon.") ,
    H(5400,5580,"FAM SIGNAL","THE FAM WANTS KENTUCKY, CAPE FEAR, AND BEETLEJUICE","Requests arrive faster than the room can answer: Cape Fear, Scarefest, Kentucky travel, Beetlejuice cartoons, and a drink offer that becomes a small community portrait.") ,
    H(5580,5760,"HALLOWEEN LORE","JASON'S MILITARY SCRIPT THAT NEVER HAPPENED","The hosts remember one of the many unmade Friday scripts: cops and military forces meet Jason and get cut down. The larger point is franchise frustration—Jason keeps getting overcomplicated instead of simply deployed.") ,
    H(5760,5940,"CHARACTER PERFORMANCE","LOOMIS ANSWERS ERIC HESS","A FAM member asks Dr. Loomis to tell his wife to stop talking during the stream. Loomis responds with fake clinical urgency, a donut-shop escape plan, and one of the cleanest playable character moments in the tape.", ["Dr. Loomis"]),
    H(5940,6120,"FILM READ","THE MIST WINS THE DEPRESSING-ENDINGS BRACKET","Masters of the Universe, Critters, Stay Tuned, Lethal Weapon, The Others, The Iron Claw, and Hugh Jackman's The Son form a grief shelf. The room keeps returning to The Mist as the horror ending that actually hurts.") ,
    H(6120,6300,"NEWS REACTION","ROSS PEROT, ARNOLD, AND THE RAINBOW PARTY","A political aside becomes a two-party-system roast and the fantasy of Arnold Schwarzenegger running. The segment is preserved as a room tangent, not a claim about policy or current events.") ,
    H(6300,6480,"COMEDY READ","THE FAST-FOOD BREAKFAST/LUNCH/DINNER DRAFT","McDonald's, Hardee's, Arby's, and the problem of choosing one menu forever become a full draft. The joke is that the practical answer is also the one everybody hates.") ,
    H(6480,6660,"FAM SIGNAL","THE ROOM TALKS ABOUT RECOVERY WITHOUT A SPEECH","A fan's sobriety, anxiety, and combat-veteran context are answered with care before the hosts return to their normal tone. It is an important community receipt because the show can be crude without being careless.") ,
    H(6660,6840,"FILM READ","THE IRON CLAW REQUIRES WHISKEY AND A RECOVERY PLAN","The hosts recommend The Iron Claw with a warning: do not put it on if tomorrow needs to be productive. The movie's grief is treated as physical, not as a disposable sad-film label.") ,
    H(6840,7020,"FILM READ","TERMINATOR IS A TURD THAT NEEDS TO BECOME A SLASHER","The franchise's later entries are called out for losing the engine. The proposed rescue is wonderfully simple: make Terminator frightening again and stop burying the monster under lore.") ,
    H(7020,7200,"STRAIGHT TO STEVE'S ASSHOLE","THE TERMINATOR'S DICK-SIZE PROBLEM","The room tries to solve a practical Terminator design question and immediately turns it into anatomy. This is the exact kind of adult derailment that belongs in the unhinged lane.") ,
    H(7200,7380,"STRAIGHT TO STEVE'S ASSHOLE","THE DOG FIGHT AFTERMATH","The surviving dog is sedated and alive, while the hosts reconstruct the fight, the failed rescue attempts, and the grim logic of throwing baloney at dogs when the world is already on fire.") ,
    H(7380,7560,"FAM SIGNAL","THE BOYS, CARL URBAN, AND THE SHOW'S NEGATIVE OUTLOOK","A question about The Boys turns into a Carl Urban appreciation and a debate over whether the series has maintained its bite. The answer is enthusiastic, profane, and not remotely a neutral review.") ,
    H(7560,7740,"FILM READ","WHICH FRANCHISE WOULD YOU FIX WITH ONE MOVIE?","A fan asks where the hosts would intervene. The room weighs Child's Play, Halloween, and other battered properties before settling into a rule: repair the spine, do not add another pile of mythology.") ,
    H(7740,7920,"HALLOWEEN LORE","HALLOWEEN 6 GETS RETCONNED BACK TO HALLOWEEN 4","The doctor-death scene, psychic-link material, and Gambit-haired Michael are rejected. The proposed fix is a remake with Alan McElroy back in the room and Halloween 4 as the continuity anchor.") ,
    H(7920,8100,"GAMING SIGNAL","BATMAN: THE TELLTALE GAME STILL WORKS","Unboxings and VHS roulette lead to Batman: Shadows of the Bat and the memory of a Telltale game that actually understood its character. It is a small but useful gaming door for the archive.") ,
    H(8100,8280,"HALLOWEEN LORE","THE HALLOWEEN 5 ANSWER","Asked which sequel went wrong, the room circles back to Halloween 5. The answer is not just dislike; it is a preference for the sequel's abandoned possibilities and a willingness to let the franchise stop digging.") ,
    H(8280,8460,"HEALTH CHECK-IN","BLOOD PRESSURE AND THE STREAM'S MID-ROOM RESET","Jay explains why he has been starting earlier and trying to control his blood pressure. The page keeps this as a truthful personal note, then lets the FAM pull the conversation back to movies.") ,
    H(8460,8640,"HORROR TV READ","HANNIBAL, BATES MOTEL, CHUCKY, AND ASH","The best horror-TV answer arrives by comparison: Hannibal and Bates Motel are the gold standard, Ash vs. Evil Dead is great but subscription-bound, Chucky has a strong first season, and The Exorcist show deserves a reluctant apology.") ,
    H(8640,8820,"TRAILER REACTION","LONG LEGS LOOKS LIKE SEVEN IN A SINISTER MASHUP","Jay sees the trailer for the first time. Bodies, a one-word sign, a faceless Nicolas Cage, and a serial-killer mystery produce a real fear spike and a clean comparison to Seven and Sinister.") ,
    H(8820,9000,"TRAILER REACTION","THE TRAILER MAKES JAY SAY NO","The reaction is physical: shock, applause, refusal to watch alone, and a sudden debate over whether the killer is supernatural. This is a high-value playable moment because the intensity is audible in the room.") ,
    H(9000,9180,"FILM READ","LONG LEGS COULD RESTART THE BOX OFFICE","The room hopes Longlegs becomes a word-of-mouth horror event instead of another festival favorite that gets inflated into a masterpiece. Nicolas Cage hiding his face is treated as the right kind of marketing restraint.") ,
    H(9180,9360,"FAM SIGNAL","THE VIOLATOR ORIGINS DOOR","A fan introduces a possible Spawn/Violator origin series. The hosts defend John Leguizamo's original Clown, Michael Jai White's Al Simmons, and the untapped potential of a superhero literally fighting the devil.") ,
    H(9360,9540,"STRAIGHT TO STEVE'S ASSHOLE","THE DOG'S FACE, THE SEDATIVES, AND THE HEARTBREAK","The camera shows the dog's shaved, stitched head. The hosts joke about the medication while admitting the image breaks their hearts; the moment stays compassionate underneath the profanity.") ,
    H(9540,9720,"FILM READ","SEAN WILLIAM SCOTT DESERVES A BETTER SECOND ACT","The room asks what happened to Sean William Scott, defends Goon, compares him to Paul Rudd, then stumbles through Jason Biggs, Loser, and the curse of being permanently recognized as one breakout role.") ,
    H(9720,9900,"TRAILER REACTION","THE DEADPOOL PHONE PSA IS A MINIATURE R-RATED MIRACLE","A theater phone PSA becomes a Deadpool and Wolverine character showcase: fourth-wall abuse, a filthy Wolverine joke, and the first proof that the movie can be funny without apologizing for the rating.") ,
    H(9900,10080,"FILM READ","DEADPOOL AND WOLVERINE AS MARVEL'S ONE-UP","Ryan Reynolds and Hugh Jackman are credited with protecting the movie from safer studio instincts. The room predicts an R-rated comedy/superhero reset, while warning that Disney could still wreck the follow-up.") ,
    H(10080,10260,"CHARACTER PERFORMANCE","LOOMIS AT THE FORENSICS TOURNAMENT","A FAM member asks for words while waiting on forensic results. Loomis answers with reassurance, insurance anxiety, and the doctor's blunt reminder that everyone dies eventually.", ["Dr. Loomis"]),
    H(10260,10440,"FILM READ","MR. FREEZE DESERVES THE BATMAN MOVIE","The Batman conversation finally moves past Joker. Mr. Freeze, Victor Fries, the Penguin, Scarecrow, and Clayface are treated as tragic characters with stories the films keep flattening.") ,
    H(10440,10620,"FILM READ","JOKER NEEDS TO WAIT","The room wants the Batman sequel to use its wider rogues gallery before handing the whole franchise back to Joker. The complaint is structural: give the other villains room to breathe.") ,
    H(10620,10725,"CLOSING READ","THE NIPPLES ARE STILL SHOWING","The stream closes in pure WWAM mode: continuity questions, a production joke, a final body gag, and the sense that a three-hour room can end without resolving anything except the FAM's desire for another one.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the May 25, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 40448,
      captionEvents: 10668,
      captionSpanSeconds: 10725.68,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "b7efa34600928aedcd180ca7dc6b2dad9fd3837e8a796f7519c25199d0855a0c",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "ae9ca4edb7e5bf864d4ce8899a74fb9c44655ef777dde7bf55f6d31ff57f59fe",
      asrWindowCount: 46,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "SATURDAY NIGHT LIVE // MAY 25, 2024",
    badge: "FULL SHOW WIKI // BEETLEJUICE, LONG LEGS, HALLOWEEN 6, AND DEADPOOL/WOLVERINE",
    headline: "THE BEETLEJUICE TRAILER, LONG LEGS' REAL FEAR SPIKE, AND A DEADPOOL ONE-UP",
    deck: "A near-three-hour FAM room that argues about movie runtimes, survives a real dog emergency, watches Beetlejuice and Longlegs, rewrites Halloween 6, and lets Dr. Loomis handle the final questions.",
    overview: "The May 25 room is a Saturday hangout with a surprisingly strong two-trailer spine. It opens by arguing that Furiosa, The Fall Guy, and modern blockbusters are too long, then detours into Jay's defense of the unreleased 1994 Fantastic Four and a vicious X-Men 97 Magneto costume read. Fallout 76, 4K discs, WWE Legends of WrestleMania, and the dead end of console backward compatibility keep the first act loose. Then a real dog emergency changes the temperature: one dog is injured, an emergency vet bill arrives, and the hosts use dark humor to process fear without pretending the story is a bit. The Beetlejuice Beetlejuice trailer gets a full watch, including the attic resurrection, the forced-marriage setup, the new creature design, and the room's worry that Beetlejuice has become a Jack Sparrow-style mascot. Long Legs is the sharper trailer event. Jay sees it cold, reacts to the Seven/Sinister atmosphere, refuses to watch alone, and then hopes the film becomes the kind of word-of-mouth horror hit that makes people return to theaters. Between those two trailer doors, the FAM supplies Tarantino's Halloween 6, Freddy/Jason/Ash, Wolverine casting, Mr. Freeze, Spawn's Violator, The Mist's devastating ending, The Iron Claw, and a full practical-effects manifesto. Dr. Loomis appears twice: once to tell a fan's wife to stop talking during the stream and once to answer a forensic-tournament question with the least comforting medical reassurance imaginable. The late Deadpool phone PSA reaction gives the room one more burst of energy before Batman, Joker, and a final body gag close the tape. This is a source-led Show Wiki because the best parts are not the title nouns; they are the reactions, the callbacks, and the exact moments where the room changes temperature.",
    topics: Object.freeze(["Beetlejuice Beetlejuice", "Longlegs", "Halloween 6", "Deadpool & Wolverine", "Dr. Loomis", "Fantastic Four", "Fallout 76", "Planet of the Apes", "Twisters", "The Mist", "The Iron Claw", "Batman", "Mr. Freeze", "Spawn", "The FAM"]),
    story: Object.freeze([
      { at: 0, end: 1080, label: "RUNTIMES, FANTASTIC FOUR, X-MEN, AND FALLOUT", body: "The room starts with Furiosa and The Fall Guy, defends the 1994 Fantastic Four, attacks Magneto's costume, then lets Fallout 76 and 4K physical media take over." },
      { at: 1080, end: 2160, label: "GAMING NOSTALGIA AND THE DOG EMERGENCY", body: "Fallout 76, WWE Legends, backward compatibility, a veterinary bill, and a dark family dog story turn the loose opening into a real emotional hinge." },
      { at: 2160, end: 3240, label: "REWATCHABLE MOVIES AND BEETLEJUICE", body: "Liar Liar, Ace Ventura, alien detours, and the Beetlejuice trailer give the first half its most replayable door." },
      { at: 3240, end: 4320, label: "HEALTH CHECK-IN, FANTASTIC FOUR, AND STREAM SCARS", body: "Medical jokes, smoking context, the Longlegs setup, scheduling abuse, and the dream of a stable game room keep the tape personal." },
      { at: 4320, end: 5400, label: "PLANET OF THE APES, PRACTICAL EFFECTS, AND TWISTERS", body: "CG skepticism, Jim Henson's Turtles, Twisters' dusty-butt humanity, Kentucky, dip, Wolverine casting, and Return of the Jedi form the film-nerd center." },
      { at: 5400, end: 6480, label: "HALLOWEEN 6, FAM REQUESTS, AND THE MIST", body: "Scarefest, a lost Jason military script, Loomis, overlooked 80s movies, The Others, The Iron Claw, The Son, and The Mist's ending create a horror-heavy run." },
      { at: 6480, end: 7560, label: "RECOVERY, FAST FOOD, TERMINATOR, AND THE BOYS", body: "The FAM talks recovery, Iron Claw grief, fast-food drafts, a Terminator slasher rescue, the dog aftermath, and The Boys' Carl Urban problem." },
      { at: 7560, end: 8640, label: "HALLOWEEN 5, BATMAN TELLTALE, AND HORROR TV", body: "Franchise repair, Halloween 6 retconning, Batman's Telltale game, blood-pressure context, Hannibal, Bates Motel, Chucky, and Ash set up Longlegs." },
      { at: 8640, end: 9720, label: "LONG LEGS, VIOLATOR, AND SEAN WILLIAM SCOTT", body: "The cold trailer reaction, box-office hopes, Spawn's Violator, the dog's recovery, Fright Night, and typecasting give the final act its emotional and comic swing." },
      { at: 9720, end: 10725, label: "DEADPOOL, LOOMIS, MR. FREEZE, AND THE GOODBYE", body: "The phone PSA, Wolverine's R-rated return, Loomis at the forensic tournament, Batman's rogues gallery, Joker restraint, and the nipples-still-showing close finish the room." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 8620, end: 8840, label: "LONG LEGS MAKES JAY SAY NO", topic: "a trailer reaction with an actual fear spike", body: "Play from 2:23:40. Jay sees the trailer cold, compares it to Seven and Sinister, and immediately refuses to watch alone.", playAt: 8620, playEnd: 8840 }),
      hated: Object.freeze({ at: 7740, end: 7860, label: "HALLOWEEN 6 GETS RETCONNED", topic: "psychic links and Gambit hair are not a mythology", body: "Play from 2:09:00. The room makes Halloween 4 the continuity anchor and asks Alan McElroy to take the wheel again.", playAt: 7740, playEnd: 7860 }),
      wildestDetour: Object.freeze({ at: 1620, end: 1860, label: "THE DOG-FIGHT EMERGENCY", topic: "a real injury, a vet bill, and dark humor doing triage", body: "Play from 27:00. The tape changes temperature here; the dog survives, but the panic and cost are real.", playAt: 1620, playEnd: 1860 }),
      lastWord: Object.freeze({ at: 9720, end: 10080, label: "DEADPOOL'S PHONE PSA ONE-UP", topic: "R-rated comedy as a studio stress test", body: "Play from 2:42:00. The room sees the PSA and starts talking about a Marvel reset, Wolverine's freedom, and Disney losing control of the joke.", playAt: 9720, playEnd: 10080 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
