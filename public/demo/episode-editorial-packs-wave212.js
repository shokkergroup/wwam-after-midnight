(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "2sWWa9NDWio";
  var duration = 12281;
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

  /* July 20, 2024: the Saturday room that turns a house move, Twisters, a
     Cobra Kai misfire, three trailers, and a politics-free promise into a
     surprisingly coherent WWAM mixtape. Every beat below is a timed door,
     not a generic summary sentence. */
  var highlights = [
    H(0,180,"ROOM BREAK","MIKE OPENS SOLO WHILE JAY IS STILL MISSING","The stream begins with Mike waiting on Jay, joking through a pregnancy-test misunderstanding and turning the delay into the first bit of the night."),
    H(180,360,"FAM SIGNAL","SATURDAY NIGHT ROLL CALL","Tomo, Tim, Dave, Stone Balone, Adam, Mr 115, JK, Richie Rich, Ryan Underwood, Michael Parton, and the rest of the FAM get their names read into the room before the movie talk starts."),
    H(360,540,"STRAIGHT TO STEVE'S ASSHOLE","THE CHARGER THAT NEEDS A SECOND WIND","A phone charger becomes an endurance joke about being ready to go again before the battery reaches a quarter. The public cut keeps the implication cheeky instead of explicit."),
    H(540,720,"ROOM BREAK","LOWE'S FLAT-CART FACE-PLANT","Mike recounts falling off a flat cart at Lowe's, bruising both legs, losing a shoe, and discovering that the most humiliating injuries are the ones nobody witnesses."),
    H(720,900,"GAMING DETOUR","NCAA FOOTBALL 25 FEELS LIKE A LOST CBS BROADCAST","Stadium detail, fight songs, Dynasty mode, and the friend who rage-mics over an online game make NCAA Football 25 the first genuine obsession of the show."),
    H(900,1080,"ROOM BREAK","JAY ARRIVES FROM THE HOUSE-MOVING WAR","Jay enters late with rooms stripped, boxes everywhere, and a Golden Girls/insurance-office visual that makes the unfinished house sound like a sitcom set."),
    H(1080,1260,"FILM READ","TWISTERS GETS A NON-SPOILER WARMUP","The room has seen Twisters and wants to discuss it without ruining the ride. The early verdict: a reimagining with enough practical spectacle to earn a theater trip."),
    H(1260,1440,"STRAIGHT TO STEVE'S ASSHOLE","THE FASTING MATH GOES OFF THE RAILS","A question about fasting turns into a deliberately overcomplicated bodily-math bit. The archive keeps the timing and the hosts' disbelief without reproducing the explicit anatomy."),
    H(1440,1620,"CHARACTER PERFORMANCE","LOOMIS AND SLENDERMAN GET THE CALL","A superchat requests recurring voices and the room immediately reaches for Dr. Loomis and Slenderman. Their authority is fake, their confidence is not.",["Dr. Loomis","Slenderman"]),
    H(1620,1800,"FILM READ","THE FINAL DESTINATION RESTAURANT DEATH","A fan pitches a restaurant-opening disaster as a Final Destination set piece. The room reverse-engineers every fryer, swinging sign, and badly placed chair that could kill someone."),
    H(1800,1980,"NEWS REACTION","THE KID ROCK DETOUR GETS A POLITICS-FREE WARNING","A current-event performance pulls the room toward politics, then the hosts deliberately label the channel a movie-and-games refuge. The useful receipt is the boundary, not the campaign commentary."),
    H(1980,2160,"COMMUNITY DOOR","LEMON PRESS GETS WRITING ADVICE","A fan asks how to submit movie writing. Mike and Jay give practical advice: find an editor address, send a clean sample, and pitch an angle instead of an autobiography."),
    H(2160,2340,"FILM READ","TURNSTILE, LONGLEGS, AND THE HORROR CALENDAR","Music recommendations and a Longlegs setup move the room from current noise back to horror. Nicholas Cage's performance is already the conversation's gravitational center."),
    H(2340,2520,"FAM SIGNAL","THE MORNING-WOOD BREAKING NEWS DESK","Benjamin Shelby's superchat reports a morning problem and the room treats it like a newsroom bulletin. The bit is crude, fast, and safe to summarize as a bodily-status alert."),
    H(2520,2700,"CHARACTER PERFORMANCE","LEE THE MACHINE ORDERS A LOOMIS PERFORMANCE","Lee Bowers asks for Michael Myers and Dr. Loomis. The answer is a full WWAM character burst about being robbed by a little old lady on a shopping cart, repeated because the room cannot let the image go.",["Dr. Loomis"]),
    H(2700,2880,"FAM SIGNAL","THE HOME DEPOT CHUCKY ANIMATRONIC","A store animatronic becomes a horror-shopping investigation: ugly, expensive, sold out, and somehow still less unsettling than a child-sized doll moving at the end of an aisle."),
    H(2880,3060,"FILM READ","BEETLEJUICE 2 IS PG-13, JUST LIKE THE ORIGINAL","The room checks its own assumption and realizes the original Beetlejuice was PG-13 too. The rating conversation becomes a useful reminder that tone is not the same thing as a letter on a poster."),
    H(3060,3240,"CHARACTER PERFORMANCE","THE DEATH OF MICHAEL MYERS AND DR. LOOMIS","Mobe 87 gets the October tease: an Eminem-album-style fake event called The Death of Michael Myers and Dr. Loomis. It is a recurring-character promise, not a factual production announcement.",["Dr. Loomis"]),
    H(3240,3420,"COMMUNITY DOOR","THE TELEPHONE-BOOTH CHARACTER MACHINE","The room invents a Scarefest booth where a fan can press a button and receive a familiar horror-doctor or fortune-teller response. This is exactly the kind of live gag that wants to become a physical prop."),
    H(3420,3600,"FILM READ","THUNDER IN PARADISE AND THE HULK HOGAN SIDE DOOR","Hulk Hogan nostalgia opens a route to Thunder in Paradise, then to the question of why old television remembered its own ridiculousness better than some modern franchises do."),
    H(3600,3780,"FILM READ","MARS ATTACKS DESERVES A SECOND LOOK","Mars Attacks gets defended as an underrated ensemble comedy that grew out of a Mad TV-sized joke and somehow became a full feature with a real visual identity."),
    H(3780,3960,"FILM READ","TWISTERS: GOOD ACTORS, DUMB PLAN, SOLID TORNADOES","The non-spoiler review lands in the middle: Glen Powell and Daisy Edgar-Jones work, the story is straightforward, the tornado effects are better than expected, and the movie is not the 1996 original."),
    H(3960,4140,"TAKE GETS NUCLEAR","REIMAGINING, NOT A SECRET SEQUEL","The hosts explain why Twisters shares the name and font but not the plot. It is a reboot/reimagining with an old-school blockbuster goal, not a puzzle box pretending to be a direct continuation."),
    H(4140,4320,"STRAIGHT TO STEVE'S ASSHOLE","THE CHEMICAL TORNADO PLAN GETS CROSS-EXAMINED","The storm-stopping chemistry is treated as the movie's silliest idea. The hosts compare it with Dorothy's clean science-fiction hook from the original and let the new film sweat in the witness box."),
    H(4320,4500,"FILM READ","THE YOUTUBE TORNADO CREW ACTUALLY WORKS","Glen Powell's online tornado-chaser angle is praised when it adds texture, not just an excuse for a phone screen. The red and blue crews make the social-media parody visible without becoming a lecture."),
    H(4500,4680,"FILM READ","THE UNIVERSAL STUDIOS EARTHQUAKE TEST","The final set piece is compared to an old theme-park ride: not subtle, but built to make a theater shake. That is why the hosts forgive the plot's cardboard corners."),
    H(4680,4860,"VERDICT","SEVEN OR EIGHT OUT OF TEN, SEE IT BIG","The room gives Twisters a split 7/10 and 8/10. The recommendation is straightforward: a simple popcorn movie with no homework, best experienced with a crowd."),
    H(4860,5040,"FAM SIGNAL","TWISTER AND TWISTERS AS A DOUBLE FEATURE","A chat question turns into a double-feature plan. The original gets the emotional and musical advantage; the new film gets the modern volume and theater-sized weather."),
    H(5040,5220,"NEWS REACTION","THE BOX-OFFICE TALK NEEDS A SOURCE LABEL","The stream cites the opening weekend, budget, and Rotten Tomatoes conversation. The archive marks those figures as claims made in the room rather than silently presenting them as independently verified facts."),
    H(5220,5400,"ROOM BREAK","BILL PAXTON'S SEQUEL THAT NEVER HAPPENED","The hosts remember that Bill Paxton wanted to direct a Twister sequel with Helen Hunt. The joke gives way to genuine regret about an artist who never got to make that return."),
    H(5400,5580,"FILM READ","BACKDRAFT VERSUS TWISTER","Jay picks Backdraft for its human heat and Mike picks Twister for its giant-screen weather. The disagreement is clean, specific, and better than a fake consensus."),
    H(5580,5760,"WRESTLING MEMORY","FALL BRAWL, HALLOWEEN HAVOC, AND NWO STING","WCW nostalgia arrives through Fall Brawl 96, Halloween Havoc, and the NWO-era Sting reveal. The room remembers the feeling of a pay-per-view before the internet could spoil it."),
    H(5760,5940,"WRESTLING MEMORY","THE PAY-PER-VIEW PRICE OF CHILDHOOD","Old PPV prices, Monday recap culture, and the absence of YouTube/Peacock become a history lesson in how wrestling fans used to share a memory one week at a time."),
    H(5940,6120,"STRAIGHT TO STEVE'S ASSHOLE","JAY ACCIDENTALLY WATCHES COBRA KAI SEASON ONE","Jay starts the wrong commentary and sincerely thinks Cobra Kai has retconned itself back to the beginning. It is the night's cleanest unplanned plot twist."),
    H(6120,6300,"FILM READ","COBRA KAI SEASON SIX IS A FORCED WATCH","The first episodes are called a chore, with Johnny Lawrence still carrying the room's interest. A later improvement does not erase the feeling that the story should have ended earlier."),
    H(6300,6480,"STRAIGHT TO STEVE'S ASSHOLE","THE MIYAGI RETCON GETS REJECTED","The hosts dislike the way the season alters Miyagi's legacy and turns old emotional material into franchise fuel. Their complaint is about trust, not nostalgia for its own sake."),
    H(6480,6660,"TAKE GETS NUCLEAR","THE FRAT-HOUSE FIGHT IS POWER RANGERS WITH RENT","A crowded fight scene is criticized as cartoon choreography. The community-college and trade-school argument that follows is more serious: the hosts defend practical paths without pretending every campus joke is harmless."),
    H(6660,6840,"FILM READ","POSSESSION MOVIES FOR THE FAM","The room recommends The Exorcism of Emily Rose, The Blackcoat's Daughter, The Possession, and Exorcist III, sorting them by courtroom tension, slow-burn dread, and how badly they want to ruin your sleep."),
    H(6840,7020,"FILM READ","PRESUMED INNOCENT AND THE APPLE TV RUN","Presumed Innocent gets praised as a prestige legal thriller, with Shrinking and Ted Lasso joining the Apple TV recommendation pile. The room can love a streaming show without turning it into homework."),
    H(7020,7200,"NEWS REACTION","HALO, GHOST RIDER, AND BLADE TAKE THE ADAPTATION HIT","Cancellations and stalled comic-book projects trigger a clear complaint: recognizable properties are not enough if the adaptation does not understand why people cared."),
    H(7200,7380,"FILM READ","BRUCE LEE AND THE DRAGON STORY","Enter the Dragon and Dragon: The Bruce Lee Story get a warm, specific defense. The room talks about performance, discipline, and the difference between an icon and a cardboard legend."),
    H(7380,7560,"NEWS REACTION","THE ACOLYTE AND FRANCHISE FATIGUE","The Acolyte discussion is framed as a symptom of a bigger problem: expensive canon cannot replace a reason to care. The hosts reserve room for the Darth Plagueis surprise while still calling the season undercooked."),
    H(7560,7740,"TRAILER ROOM","ALIEN: ROMULUS STARTS THE LIVE TRAILER BLOCK","Facehuggers, water, chestbursters, and practical creature work get immediate reactions. The room is excited and worried that the trailer has shown too much at once."),
    H(7740,7920,"TRAILER ROOM","ROMULUS BETWEEN ALIEN AND ALIENS","The hosts place the movie in the timeline, debate whether the trailer only spoils its first twenty percent, and rank it above the sequels they would rather forget."),
    H(7920,8100,"TRAILER ROOM","DEADPOOL AND WOLVERINE GOES EMOTIONAL","The final trailer feels more serious than expected. Wolverine, Deadpool, and the possibility of a legacy goodbye move the room from joke mode to genuine investment."),
    H(8100,8280,"NEWS REACTION","CREATIVE CONTROL IS THE REAL SUPERPOWER","Ryan Reynolds and Hugh Jackman are praised for protecting the characters. The room's fear is not another cameo; it is a franchise taking the steering wheel away from the people who know the tone."),
    H(8280,8460,"ROOM BREAK","APPLE JUICE AND THE DAVE MATTHEWS LYRIC COURT","A drink break turns into a music-memory roast, with a lyric everyone knows but nobody can defend once the room starts reading it aloud."),
    H(8460,8640,"NEWS REACTION","TENACIOUS D: JOKE, APOLOGY, CONSEQUENCE","The Kyle Gass controversy is discussed without repeating the violent joke. The hosts condemn wishing harm, debate the scale of the response, and separate apology from permanent erasure."),
    H(8640,8820,"TAKE GETS NUCLEAR","CANCEL CULTURE DOES NOT HAVE ONE COLOR","The room argues about hypocrisy, accountability, and whether a tour cancellation can be both understandable and excessive. It is a disagreement, not a political endorsement."),
    H(8820,9000,"ROOM BREAK","THE STREAM FREEZES WITH A FACE ON SCREEN","The video locks up mid-thought. The frozen expression is funnier than any written gag, and the room turns a technical failure into a fake government/server conspiracy before the feed returns."),
    H(9000,9180,"TECHNICAL CHAOS","THE GOVERNMENT FROZE THE STREAM","The hosts test the mic, wonder whether the internet has betrayed them, and keep the dead air alive long enough for the failure to become a memorable performance receipt."),
    H(9180,9360,"COMMUNITY DOOR","THE ROOM CHOOSES PEOPLE OVER POLITICS","After the freeze and the argument, the hosts say the quiet part plainly: people are exhausted, and the channel should be a place to talk movies without hating the neighbor."),
    H(9360,9540,"TRAILER ROOM","BEETLEJUICE BEETLEJUICE ENTERS THE HOUSE","Lydia, the ghost house, Beetlejuice, and the afterlife appear in the final trailer block. The room likes the practical-effects texture and worries about the sequel becoming too cute."),
    H(9540,9720,"FILM READ","BOBS, PRACTICAL EFFECTS, AND MICHAEL KEATON'S VETO","Keaton's care for the character is treated as the sequel's best defense. The little afterlife workers and handmade look matter more to the hosts than a louder digital spectacle."),
    H(9720,9900,"VERDICT","ALIEN, DEADPOOL, AND BEETLEJUICE PRE-RATINGS","Before the close, the room gives Alien: Romulus the highest horror anticipation, Deadpool & Wolverine a huge score, and Beetlejuice a cautious but hopeful middle grade."),
    H(9900,10080,"FILM READ","THE SIXTH SENSE, THE OTHERS, AND THE TWIST-ENDINGS LIST","A fan asks for the best twist endings. The room cycles through The Sixth Sense, The Others, The Mist, Scream, Primal Fear, Se7en, and Fight Club while arguing whether obvious means overrated."),
    H(10080,10260,"FAM SIGNAL","THE BEETLEJUICE THREE-WAY ARGUMENT","The title may be planting a third movie. The hosts disagree about whether a definitive finale is better than a fast sequel after a hit, which is the exact kind of franchise anxiety that makes the bit funny."),
    H(10260,10440,"FAM SIGNAL","THE LEAST DANGEROUS BUDDY-COP PARTNER","Ezra Miller, Jada Pinkett Smith, Joe Biden, and Joey from Friday are offered as impossible partners. Joey wins because the room believes he is the least likely to make the problem worse."),
    H(10440,10620,"CHARACTER PERFORMANCE","LOOMIS AND CHALLIS RUN FOR OFFICE","Lee requests Loomis for president and Challis as vice president. The hosts turn it into a fictional horror-ticket parody and keep the real-world politics outside the bit.",["Dr. Loomis","Dr. Challis"]),
    H(10620,10800,"FILM READ","LONGLEGS AFTER THE HYPE CLOUD","The room revisits Longlegs criticism: gimmicky ciphers, a restrained lead, and Nicolas Cage doing the heavy lifting. The verdict is not that the movie is empty; it is that internet hype changes the temperature before the audience arrives."),
    H(10800,10980,"CHARACTER PERFORMANCE","SLENDERMAN'S LIFE ADVICE IS WEIRDLY DECENT","A fan asks Slenderman and Challis for advice. Under the costume and menace, the answer is unexpectedly humane: be yourself, do not sell out, work hard, be kind, and do not hurt people.",["Dr. Challis","Slenderman"]),
    H(10980,11160,"NEWS REACTION","ALIEN NEEDS A HORROR MOVIE AND A HEADY TV SHOW","The room separates the future of the franchise: a pure horror film, plus a television series with room for mythology and character. More canon is not automatically more Alien."),
    H(11160,11340,"FILM READ","WHO SHOULD DIRECT FRIDAY THE 13TH","Fede Alvarez, Ti West, and David Sandberg are floated as possible Friday directors. The best answer depends on whether the next film wants slash-and-stalk dread, art-house patience, or clean studio propulsion."),
    H(11340,11520,"CHARACTER PERFORMANCE","LOOMIS DOES THE BREAKFAST CLUB SPEECH","Florida Dan asks for Dr. Loomis to perform the Breakfast Club monologue. The clip is catalogued as a character performance and described rather than transcribed so the playable moment remains the authority.",["Dr. Loomis"]),
    H(11520,11700,"SOUNDBYTE / REPLAY","THE SMOOTH CRIMINAL INTERRUPTION","The monologue performance gets interrupted by a Smooth Criminal aside, turning a sincere character request into the exact kind of derailment only this room would attempt."),
    H(11700,11880,"FAM SIGNAL","DEAN'S 75-POUND WIN","Dean shares a major weight-loss milestone. The room drops the jokes long enough to celebrate the work, the health change, and the fact that the FAM can bring good news into the same chat as horror trailers."),
    H(11880,12060,"COMMUNITY DOOR","THE FAM LEAVES THE LIGHT ON","The closing thanks move across the room: regulars, new names, Lee, Michael, and the people who keep showing up when the show is messy. The archive's fan layer is part of the episode, not a footer."),
    H(12060,12281,"CLOSING READ","ZERO ACCOUNTABILITY AND ONE LAST GOODNIGHT","The stream ends on an affectionate accountability joke, a final round of thanks, and the familiar sense that the room will be back with another movie argument before anyone has recovered from this one.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the July 20, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 44977,
      captionEvents: 11582,
      captionSpanSeconds: 12269.36,
      captionDurationCoveragePercent: 99.9,
      captionSha256: "92d7b74c2d11a6b8c2faa9e13a6b0bcdbc96c1b304e80a14cbbcfcbf28ee635e",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio playback spot-check; playback remains the authority",
      audioSha256: "b158720230f860360e30700a0cbd1955ece7c310976aea2c570c1b51f3c7cf60",
      asrWindowCount: 69,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "SATURDAY LIVE // JULY 20, 2024",
    badge: "FULL SHOW WIKI // TWISTERS, TRAILERS, COBRA KAI, AND THE FAM",
    headline: "TWISTERS, THREE TRAILERS, A COBRA KAI MISFIRE, AND THE STREAM THAT FROZE MID-RANT",
    deck: "A three-hour-plus Saturday room where a Twisters review, three trailer reactions, Cobra Kai frustration, recurring-character performances, and a politics-free promise keep circling back to the FAM.",
    overview: "This Saturday stream is a mixtape with a spine. Mike opens alone, Jay arrives from a house move, and the room spends its first stretch on Lowe's humiliation, NCAA Football 25, a broken-car imagination, horror recommendations, and fan callouts before Twisters finally gets its non-spoiler trial. The verdict is specific: the new film is a sturdy popcorn reimagining with good storm work, a silly chemical plan, and no chance of replacing the 1996 original. From there the room moves through Bill Paxton's unrealized sequel, Backdraft, WCW pay-per-view memories, and a Cobra Kai review that accidentally begins with Season One because Jay clicked the wrong commentary. Alien: Romulus, Deadpool & Wolverine, and Beetlejuice Beetlejuice get live trailer rooms; the archive preserves the gasps, the over-analysis, the worry about trailers showing too much, and the practical-effects hope. A Tenacious D current-event detour becomes a debate about apology and cancellation, then the actual stream freezes with a face on screen and the technical failure becomes a highlight of its own. The final run returns to twist endings, Longlegs, Alien's future, a fictional Loomis/Challis ticket, Slenderman life advice, a Breakfast Club character performance, and Dean's weight-loss celebration. It is vulgar around the edges, generous at the center, and impossible to mistake for a generic livestream recap.",
    topics: Object.freeze(["Twisters", "Cobra Kai Season 6", "Alien: Romulus", "Deadpool & Wolverine", "Beetlejuice Beetlejuice", "Dr. Loomis", "Dr. Challis", "Slenderman", "The FAM", "NCAA Football 25", "WCW nostalgia", "Longlegs", "Tenacious D", "Twist endings"]),
    story: Object.freeze([
      { at: 0, end: 1260, label: "THE ROOM OPENS WITHOUT JAY", body: "Mike turns a delay, a Lowe's face-plant, NCAA Football 25, and a house-moving report into a real opening instead of waiting for the show to begin." },
      { at: 1260, end: 2520, label: "HORROR, FAM, AND THE FIRST BOUNDARY", body: "Longlegs, Final Destination, Loomis, Slenderman, fan names, and a politics-free warning establish the room's rules before the movie review." },
      { at: 2520, end: 3780, label: "THE CHARACTER DOOR STAYS OPEN", body: "Lee's superchat, the shopping-cart Loomis performance, Chucky's animatronic, Mars Attacks, and Hulk Hogan keep the detour genuinely WWAM." },
      { at: 3780, end: 5040, label: "TWISTERS GOES TO COURT", body: "The hosts separate a reimagining from a sequel, question the science, praise the tornado spectacle, and give the film a split but usable verdict." },
      { at: 5040, end: 6300, label: "FROM BILL PAXTON TO COBRA KAI", body: "A lost Twister sequel, Backdraft, WCW memories, PPV prices, and Jay's accidental Season One commentary make nostalgia do actual narrative work." },
      { at: 6300, end: 7560, label: "THE ADAPTATION COMPLAINTS STACK UP", body: "Cobra Kai's Miyagi retcon, trades-school argument, possession recommendations, Halo, Blade, Ghost Rider, Bruce Lee, and The Acolyte share one question: did the adaptation understand the thing?" },
      { at: 7560, end: 8820, label: "THREE TRAILERS, THREE KINDS OF HOPE", body: "Alien: Romulus, Deadpool & Wolverine, and the music break move from creature fear to superhero emotion to a lyric that cannot survive cross-examination." },
      { at: 8820, end: 10080, label: "THE FEED BREAKS, THE ROOM DOESN'T", body: "The Tenacious D debate stays neutral and consequence-focused, then the stream freeze becomes its own improvised bit before Beetlejuice returns the room to movie mode." },
      { at: 10080, end: 11340, label: "THE FAM WRITES THE LAST HOUR", body: "Twist endings, buddy-cop partners, a fictional Loomis/Challis election, Longlegs criticism, Alien's future, and the next Friday director all arrive through fan prompts." },
      { at: 11340, end: 12281, label: "LOOMIS READS, DEAN WINS, THE ROOM CLOSES", body: "A Breakfast Club character performance, a Smooth Criminal derailment, Dean's 75-pound milestone, and the final thank-you give the long show a human landing." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 7560, end: 7920, label: "ALIEN: ROMULUS TRAILER ROOM", topic: "the chat reacts to facehuggers in real time", body: "Play from 2:06:00. The room gasps, ranks the franchise, and tries to guess whether the trailer has already shown the movie's first act.", playAt: 7560, playEnd: 7920 }),
      hated: Object.freeze({ at: 6120, end: 6660, label: "COBRA KAI'S SEASON SIX FRICTION", topic: "retcons and repetitive fights", body: "Play from 1:42:00. The accidental Season One start is funny; the deeper complaint is that the new season keeps asking for emotional credit it has not earned.", playAt: 6120, playEnd: 6660 }),
      wildestDetour: Object.freeze({ at: 8820, end: 9180, label: "THE FROZEN STREAM CONSPIRACY", topic: "a technical failure becomes a live character bit", body: "Play from 2:27:00. A stuck face, a government joke, and a room trying to diagnose its own internet make the failure more memorable than a clean transition would have been.", playAt: 8820, playEnd: 9180 }),
      lastWord: Object.freeze({ at: 11340, end: 11700, label: "LOOMIS, THEN DEAN", topic: "performance and a real FAM win", body: "Play from 3:09:00. Dr. Loomis gets the requested speech while Dean gets the sincere applause; the room can be ridiculous and kind in the same minute.", playAt: 11340, playEnd: 11700 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
