(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "N2yPy4crLos";
  var duration = 10767;
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

  /* June 18, 2024: the post-vacation room. The tape moves from a shark scare
     and real health check-ins through The Watchers, Terrifier, Halloween 6,
     Wyatt Six, Deadpool's R-rated thesis, Smile 2, and Friday the 13th news. */
  var highlights = [
    H(0,180,"ROOM BREAK","THE VACATION RETURN IS A GENTLE THREAT","Mike opens by welcoming everyone back while Jay is still at the computer. The room immediately admits that a vacation from WWAM was probably healthy for everybody involved."),
    H(180,360,"SPORTS READ","THE MAVS LOST AND THE CELTICS ARE BORING","The NBA opener is a clean WWAM sports lane: Dallas disappointment, Boston's ancient championship bragging rights, and the complaint that super-teams make loyalty feel rented."),
    H(360,540,"STRAIGHT TO STEVE'S ASSHOLE","THE GULF SHARK SHADOW","A family beach day turns into a real shark sighting. Mike pulls a child toward shore, then admits the dumb white adults got back in the water the next day anyway."),
    H(540,720,"FAM SIGNAL","THE DOCTOR SAYS THE QUIET PART OUT LOUD","Mike and Jay compare intermittent fasting, bloodwork, sleep, alcohol, weight, and a doctor who does not sugarcoat the health conversation. The archive keeps this as personal testimony, not medical instruction."),
    H(720,900,"FAM SIGNAL","NINE WEEKS WITHOUT A CIGARETTE","A quit-smoking milestone is treated as an actual win. The room can joke about the appointment, but it never turns the recovery lane into a fake universal prescription."),
    H(900,1080,"STRAIGHT TO STEVE'S ASSHOLE","THE BLOOD-PRESSURE PANIC LOOP","A home monitor, a scary number, and the doctor's weight-and-drinking advice become a familiar WWAM pattern: sincere concern immediately chased by a filthy self-own."),
    H(1080,1260,"ROOM BREAK","FASTING, KETO, AND THE VACATION FRYER","The hosts compare a short keto run with a vacation full of fried food, smoking, and drinks. The joke is not that health is fake; it is that the body keeps sending receipts."),
    H(1260,1440,"WWAM UP IN YA","SHAQ, A STINGRAY, AND THE NIGHTMARE BODY","A dream about Shaquille O'Neal turns into a ridiculous anatomy conversation before the room pivots into The Acolyte and the year's most exhausted fandom arguments."),
    H(1440,1620,"NEWS REACTION","THE BOYS, STAR WARS, AND HOLLYWOOD'S POLITICS","Mike and Jay separate corporate satire from culture-war scorekeeping, then complain that studios can ruin a good show while insisting the audience is the problem."),
    H(1620,1800,"FILM READ","ROAD HOUSE CLIMBS THE YEAR'S LIST","Mike argues that the new Road House has earned a place above Dune 2 for him. Smile gets a more modest verdict: enjoyable, familiar, and built from older horror machinery."),
    H(1800,1980,"STRAIGHT TO STEVE'S ASSHOLE","WHICH HALLOWEEN SCENE GETS CUT","The room compares Dr. Sartain's Halloween 2018 turn with the Michael/Laurie and Michael/Corey fights. The answer is less a ranking than a demand to remove the weakest physical-combat beat."),
    H(1980,2160,"FILM READ","PEARL HARBOR IS A BEAUTIFUL DISASTER","A fan brings up Pearl Harbor. The hosts remember loving the stars and hating the melodrama, cheating sequence, and giant movie that never decides whether it is war epic or glossy romance."),
    H(2160,2340,"FILM READ","THE WATCHERS IS GATEWAY HORROR","The Shyamalan-produced movie gets a measured read: attractive setup, a young-audience gateway into horror, and not enough teeth to satisfy viewers who wanted the woods to bite back."),
    H(2340,2520,"FILM READ","TERRIFIER TWO SURVIVES THE RUNTIME","Mike admits he expected a two-and-a-half-hour clown movie to collapse and instead loved the excess. The ending is debated, but the practical brutality clears the bar."),
    H(2520,2700,"CHARACTER PERFORMANCE","MARK WAHLBERG SOLVES DOMINO'S","A fan's bad day at Domino's summons a Mark Wahlberg manager fantasy: turkey burgers, a job offer, and an aggressively sincere pep talk that keeps swerving into family embarrassment.",["Mark Wahlberg"]),
    H(2700,2880,"GAMING SIGNAL","FALLOUT 76 AND THE HEARTBURN BOSS FIGHT","The room checks in on Fallout 76, vacation heartburn, and the way a health scare can make an ordinary burp feel like a medical thriller."),
    H(2880,3060,"WRESTLING READ","THE MONTREAL SCREWJOB STILL HAS TEETH","A Title Match Wrestling interview leads to Bret Hart, Eric Bischoff, Nitro, Vince McMahon, and the line between a planned finish and a real betrayal."),
    H(3060,3240,"FILM READ","RECASTING THE OLD ACTION MEN","The chat asks for a Mel Gibson-era recast. Jeremy Renner, Timothy Olyphant, Idris Elba, Keith David, and Samuel L. Jackson get floated while the hosts admit some roles should probably stay retired."),
    H(3240,3420,"WWAM UP IN YA","CLEAN BUTTS, DAD JOKES, AND A SONG THAT WON'T DIE","A Father's Day joke book triggers the clean-butts rule, a terrible earworm, and a reminder that WWAM can turn one forgotten line into a ten-minute crime scene."),
    H(3420,3600,"NEWS REACTION","TARANTINO, WEINSTEIN, AND THE ARTIST/PERSON SPLIT","The room discusses whether enjoying a movie endorses its director, separates serious crimes from political disagreement, and refuses to make a film recommendation into a voting record."),
    H(3600,3780,"ROOM BREAK","MIKE TYSON'S SOCIAL-MEDIA RULE","A Tyson quote about people being too comfortable online becomes a blunt argument for consequences, followed by a genuinely creepy Michael Myers nightmare after the drive home."),
    H(3780,3960,"STRAIGHT TO STEVE'S ASSHOLE","THE DRIVE HOME FIRE AND THE BEDROOM SHARK","Vacation heat, a grass fire beside the interstate, and a nightmare creature standing over the bed make the return trip feel like a Final Destination sequel nobody booked."),
    H(3960,4140,"FILM READ","FREDDY PRINZE JR. COULD TAKE RYAN PHILLIPPE","The hosts defend Freddy Prinze Jr., drag the old pretty-boy rivalry, and use Bad Boys: Ride or Die to explain why nostalgia can be more painful than exciting."),
    H(4140,4320,"FILM READ","SMILE IS GOOD, BUT IT IS STANDING ON SHOULDERS","Smile is credited as a fun, competent horror movie while the room names the older films it borrows from. The distinction is useful: influence is not the same as a verdict of theft."),
    H(4320,4500,"FILM READ","PATRICK STEWART AS MR. FREEZE","A fan's casting idea becomes a Shakespearean Mr. Freeze fantasy. Poison Ivy then gets the exact opposite treatment: no tragic monologue, just a very specific attraction profile."),
    H(4500,4680,"HALLOWEEN LORE","CURSE OF MICHAEL MYERS NEEDS A MAP","The room revisits Halloween 6, the runes, the cult, and Dr. Loomis as a caretaker who should never have been rewritten into a facilitator of Michael's crimes."),
    H(4680,4860,"HALLOWEEN LORE","TOMMY DOYLE IS THE CLEANEST BRIDGE","Josh Hartnett and Paul Rudd become the doorway to a new continuity. The hosts argue that a short visual explainer could make the old mythology legible without forcing newcomers through a full homework packet."),
    H(4860,5040,"FAM SIGNAL","ADAM SANDLER LIVE COSTS MORE THAN THE JOKE","A bad venue experience, parking chaos, and a seventy-five-dollar hoodie make the hosts reconsider live comedy economics before the room pivots to Creed tickets."),
    H(5040,5220,"COMMUNITY DOOR","THE DOG-BOARDING BILL","Vacation logistics, a huge boarding bill, and a low-budget Old Spice fantasy show how the FAM can turn an ordinary expense into a shared bit without losing the real frustration underneath."),
    H(5220,5400,"WRESTLING READ","THE RISE-AND-FALL OF WCW GETS A LONGER CUT","A new wrestling documentary is compared with Dark Side of the Ring and the existing Rise and Fall of WCW. The appeal is simple: more room for context, less two-hour compression."),
    H(5400,5580,"FILM READ","DEADPOOL AND WOLVERINE AS THE R-RATED PIVOT","The room predicts that the Ryan Reynolds/Hugh Jackman movie could reopen the door to adult superhero comedy and force Disney to remember that audiences are not one giant PG focus group."),
    H(5580,5760,"FILM READ","LETHAL WEAPON, SPAWN, AND THE BUDDY-COP WAVE","Deadpool's real lesson is framed as a genre opportunity: R-rated buddy-cop energy, a serious Spawn gamble, and movies willing to be rude without apologizing every thirty seconds."),
    H(5760,5940,"CHARACTER PERFORMANCE","LOOMIS AND CHALLIS ROAST THE BELLY BUTTON","A fan asks why a belly button smells. Dr. Loomis and Dr. Challis answer with a filthy fictional diagnosis, then immediately regret being given the microphone.",["Dr. Loomis","Dr. Challis"]),
    H(5940,6120,"FAM SIGNAL","LONGLEGS, APPLE JUICE, AND THE CHAT'S RETURN","The FAM keeps the late-night room moving with Longlegs hype, strong apple juice, and the relief of having the hosts back after vacation."),
    H(6120,6300,"CHARACTER PERFORMANCE","DR. CHALLIS GIVES BEN THE WORST ADVICE","Benjamin asks for a roast. Challis recommends boiler-makers, an untucked shirt, a Dollar General detour, and an invented life lesson that is clearly not medical advice.",["Dr. Challis"]),
    H(6300,6480,"WRESTLING READ","UNCLE HOWDY'S ENTRANCE IS A HAUNTED-HOUSE TEST","The Bray Wyatt tribute entrance gets real respect for the ambition and real criticism for the blood-splattered tunnel, dead-wrestler imagery, and hammer marked like a middle-school haunted house prop."),
    H(6480,6660,"WRESTLING READ","BRAY WYATT DESERVED A BETTER ENGINE","The hosts remember how over Bray was, how often WWE abandoned his good ideas, and why the Wyatt Six connection is emotionally complicated even when the faction looks cool."),
    H(6660,6840,"WRESTLING READ","KAYFABE, TNA, AND THE UNDERTAKER SHADOW","The discussion widens to AEW, TNA, The Undertaker, and the argument that wrestling lost something when the audience stopped being allowed to believe the magic."),
    H(6840,7020,"WRESTLING READ","ULTIMATE WARRIOR GOES TWENTY-FIVE MINUTES","A WCW memory becomes a production-room nightmare: Warrior's entrance segment runs far past the planned time and leaves the stage manager bargaining with the commercial clock."),
    H(7020,7200,"FILM READ","HOME ALONE HOUSE, POLTERGEIST, AND FIRST WATCHES","A fan's Home Alone house build leads to a plea for a first-time Poltergeist watch. The hosts protect the spoiler-free experience while calling it an all-time horror essential."),
    H(7200,7380,"COMMUNITY DOOR","PATREON AND YOUTUBE MEMBERS GET THE SAME ROOM","The membership plan is explained plainly: same content, different doorway, no forced comment paywall, and a monthly live room for people who want more of the archive."),
    H(7380,7560,"NEWS REACTION","DISNEY'S EXECUTIVE PROBLEM","The Deadpool optimism flips into a corporate argument about executives, shareholders, and the impossible demand that every movie be a four-quadrant cultural event."),
    H(7560,7740,"CHARACTER PERFORMANCE","LOOMIS RUNS FROM MICHAEL IN SPANISH","A requested Spanish bit becomes a deliberately bad language lesson, a burrito weapon, and another example of the hosts turning character play into a fan-controlled stage.",["Dr. Loomis"]),
    H(7740,7920,"COMMUNITY DOOR","SELL THE HAUNTED HOUSE OR BUILD THE ATTRACTION","The hosts compare a one-time sale with a haunted-house Airbnb, books, TV appearances, and a long-term tourist attraction. The business answer is as practical as the ghost story is ridiculous."),
    H(7920,8100,"COMMUNITY DOOR","MEMBERSHIP EMOJIS AND THE NO-BLOCK CHAT RULE","The room promises custom Michael Myers emojis and refuses the common move where only paying members can speak. The archive files it as community design, not a sales pitch."),
    H(8100,8280,"FILM READ","THE FIVE-DOLLAR MYSTERY MOVIE","Tom Hardy and Austin Butler lead into a story about early mystery screenings: pay five dollars, accept any movie, and hope it is not a movie you hate."),
    H(8280,8460,"STRAIGHT TO STEVE'S ASSHOLE","THE FIRE ALARM CUTS OFF THE MYSTERY SCREENING","A theater evacuation interrupts a rare mystery screening. The joke is that Kentucky cannot get a press screening, and when a fan screening finally appears, a fire alarm kills it."),
    H(8460,8640,"COMMUNITY DOOR","KENTUCKY IS OUTSIDE THE SCREENING LOOP","The hosts talk about emails inviting them to Los Angeles, the distance problem, a botched Smile event, and the strange economics of being a film channel in the middle of nowhere."),
    H(8640,8820,"STRAIGHT TO STEVE'S ASSHOLE","THE PAINKILLER BAR NIGHT","A bar-ordering lesson turns into a memory of a drink strong enough to get the hosts cut off. The old Applebee's era is treated like a dangerous historical period."),
    H(8820,9000,"STRAIGHT TO STEVE'S ASSHOLE","APPLEBEE'S MAKES THEM ORDER FOOD","A bartender refuses a third drink without a food order. The hosts remember trying to reach a movie, being called on the policy, and taking the decision personally for years."),
    H(9000,9180,"STRAIGHT TO STEVE'S ASSHOLE","THE VACATION BUSHWHACKER AFTERMATH","The drinking story lands in a synchronized yard-vomit memory. It is gross, mutual, and told as a friendship receipt rather than a lifestyle recommendation."),
    H(9180,9360,"FILM READ","SMILE 2 PUTS LADY GAGA IN THE CROWD","The trailer gets a full watch: pop-star pressure, a face appearing everywhere, a pre-workout reaction, and the question of whether the sequel is bigger without losing the simple hook."),
    H(9360,9540,"FILM READ","SMILE 2 NEEDS MONSTERVISION ENERGY","The hosts like the trailer but want it to feel less watered down, more like a late-night horror presentation than a polished pop-star event."),
    H(9540,9720,"WWAM UP IN YA","FLAMETHROWER SAUCE VERSUS A CHICKEN BASKET","A fast-food debate becomes a miniature moral philosophy: dipping fries, drinking while drunk, and the shame of discovering a flamethrower burger when you are already trying to change."),
    H(9720,9900,"HALLOWEEN LORE","FRIDAY THE 13TH'S SERIES PLAN IS TOO CLEVER","The chat asks about a Friday the 13th show. The hosts explain the rumored deconstruction of the first four movies, then reject the instinct to bury Jason under Pamela/Elias homework."),
    H(9900,10080,"HALLOWEEN LORE","JASON SHOULD LIVE IN THE FAN CANON","The answer is a clean continuity pitch: put Jason's body in the 2009 lane, keep separate timelines, and let fans connect the dots the way Evil Dead fans already do."),
    H(10080,10260,"FAM SIGNAL","THE NEW BAR, THE NEW BEER, THE SAME CHAT","A self-serve beer garden, a complicated tap, and a fan's military-draft anxiety keep the last stretch grounded in the chat rather than the franchise wars."),
    H(10260,10440,"HALLOWEEN LORE","CHARLIZE THERON AS PAMELA IS A TRAP","The proposed Friday series casting sparks a blunt practical read: a star that large would reshape the entire show, and the simpler Jason-forward version is probably stronger."),
    H(10440,10620,"FILM READ","FEDÉ ÁLVAREZ SHOULD KEEP HIS OWN LANE","The room praises Alvarez's horror work but does not automatically hand him Friday the 13th. A sandwich-chain debate and the ESPN finals complaint make the final hour feel gloriously unplanned."),
    H(10620,10767,"CLOSING READ","THE DRUNK GOODNIGHT","A final character bit, a North Korea delivery joke, a great pee, and an *Inception*-style drunk exit send the room back into the world with the FAM thanked and the next stream left intentionally loose.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the June 18, 2024 live stream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 40598,
      captionEvents: 10400,
      captionSpanSeconds: 10767.359,
      captionDurationCoveragePercent: 100.0,
      captionSha256: "a64cdd7d8030cfd56016d04c2dae17459813156cc521fb39aa0945c93198a05a",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "5b63748f1268a907c692c5a23e5d5038d54828bb486706da83d0287a5c2ef2a0",
      asrWindowCount: 46,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "TUESDAY NIGHT LIVE // JUNE 18, 2024",
    badge: "FULL SHOW WIKI // SHARKS, TERRIFIER, HALLOWEEN 6, WYATT SIX, AND SMILE 2",
    headline: "THE SHARK SHADOW, THE HALLOWEEN 6 MAP, AND A SMILE 2 TRAILER AFTER THREE HOURS OF FAM CHAOS",
    deck: "A post-vacation marathon where health check-ins, horror reviews, WWE history, Deadpool optimism, character doctors, and a full Friday the 13th series argument share one unruly room.",
    overview: "The June 18 room is a genuine long-form WWAM night, not a list of disconnected topics. It opens with a vacation return, Dallas and Boston sports, and a shark shadow that puts Mike between his children and the Gulf before the family gets back in the water anyway. Mike and Jay then talk candidly about intermittent fasting, bloodwork, sleep, drinking, weight, and a nine-week no-cigarette milestone; the archive treats those sections as lived context, not health advice. The first movie lane moves through The Acolyte, The Boys, Road House, Smile, Pearl Harbor, and The Watchers, then Terrifier two earns a rare runtime-proof victory. From there the FAM takes over: Mark Wahlberg gets a Domino's rescue call, Fallout 76 and heartburn share a check-in, Bret Hart's Montreal Screwjob gets a real wrestling explanation, and a Mel Gibson recast turns into a clean-butts earworm. The middle of the tape is the richest Halloween material. The hosts revisit Halloween 6, the cult/rune mythology, Dr. Loomis as caretaker, Tommy Doyle, Josh Hartnett, Paul Rudd, and the need for a short explainer that makes continuity legible without demanding a graduate seminar. Deadpool & Wolverine then becomes the industry's R-rated stress test, followed by Loomis/Challis fan roasts, Uncle Howdy and Bray Wyatt criticism, Ultimate Warrior WCW history, a Home Alone house, Poltergeist first-watch envy, and the practical design of Patreon/YouTube memberships. The final hour watches Smile 2, argues flamethrower sauce, tears into an overcomplicated Friday the 13th series plan, and lands on a Jason-forward fan-canon answer. This is a FAM room with real shape: the receipts are bounded, the jokes stay theirs, and playback remains the authority for every final clip decision.",
    topics: Object.freeze(["The Watchers", "Terrifier", "Halloween 6", "Curse of Michael Myers", "Dr. Loomis", "Dr. Challis", "Smile 2", "Deadpool & Wolverine", "The Boys", "The Acolyte", "Road House", "Wyatt Six", "Bray Wyatt", "Bret Hart", "Friday the 13th", "The FAM", "Patreon", "YouTube memberships"]),
    story: Object.freeze([
      { at: 0, end: 1080, label: "VACATION, SHARKS, AND THE DOCTOR'S RECEIPTS", body: "A Gulf shark sighting, a long drive home, intermittent fasting, blood pressure, and nine weeks without a cigarette make the opening unusually personal before the jokes begin to protect the room." },
      { at: 1080, end: 2160, label: "THE ACOLYTE, ROAD HOUSE, AND THE WATCHERS", body: "Fandom politics, Road House enthusiasm, Smile's borrowed machinery, Pearl Harbor's glossy disaster, and The Watchers' gateway-horror verdict give the first movie run a real spine." },
      { at: 2160, end: 3240, label: "TERRIFIER, MARK WAHLBERG, AND THE SCREWJOB", body: "Terrifier's runtime survives, Mark Wahlberg rescues a Domino's worker, Fallout 76 and heartburn get checked, and Bret Hart's Montreal betrayal remains a real wrestling argument." },
      { at: 3240, end: 4320, label: "CLEAN BUTTS, TARANTINO, AND THE NIGHTMARE RETURN", body: "An earworm and a dad-joke book open a lane about art versus artists, then Mike Tyson's social-media quote and a Michael Myers nightmare bring the room back to horror." },
      { at: 4320, end: 5400, label: "MR. FREEZE, HALLOWEEN 6, AND TOMMY DOYLE", body: "Patrick Stewart's Mr. Freeze, Curse of Michael Myers, the runes, Dr. Loomis, Tommy Doyle, and a future continuity explainer become the night's strongest franchise workshop." },
      { at: 5400, end: 6480, label: "DEADPOOL'S R-RATED PIVOT AND THE DOCTORS' ROASTS", body: "Deadpool & Wolverine is framed as a test of what audiences actually want, then the fan room gets Mark Wahlberg, Loomis, Challis, Longlegs, and a belly-button diagnosis." },
      { at: 6480, end: 7560, label: "WYATT SIX, WARRIOR, AND HOME ALONE", body: "Uncle Howdy, Bray Wyatt, kayfabe, Ultimate Warrior's WCW disaster, the Home Alone house, and Poltergeist first-watch envy put wrestling and horror on the same shelf." },
      { at: 7560, end: 8640, label: "HAUNTED-HOUSE BUSINESS AND THE MYSTERY SCREENING", body: "A haunted house becomes an Airbnb business plan, memberships get a no-paywall explanation, and a five-dollar mystery movie is interrupted by a fire alarm." },
      { at: 8640, end: 9720, label: "BAR NIGHT, VACATION VOMIT, AND SMILE 2", body: "The old bar-ordering era, Applebee's food rules, a synchronized yard-vomit memory, and the full Smile 2 trailer watch give the final act its comic momentum." },
      { at: 9720, end: 10767, label: "FRIDAY THE 13TH SHOULD STOP OVERTHINKING IT", body: "A rumored Friday show, Pamela and Elias lore, Jason's fan-canon continuity, Charlie Theron casting, Fede Álvarez, sandwiches, and a drunk goodnight close the marathon." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 4500, end: 4860, label: "THE HALLOWEEN 6 MAP", topic: "make the mythology legible without sanding it flat", body: "Play from 1:15:00. The hosts defend the ambition, reject Loomis as a cult facilitator, and sketch the short visual explainer the franchise needs.", playAt: 4500, playEnd: 4860 }),
      hated: Object.freeze({ at: 6300, end: 6660, label: "UNCLE HOWDY'S HAUNTED-HOUSE HAMMER", topic: "Bray's legacy deserved more than forced imagery", body: "Play from 1:45:00. The room separates respect for Bray Wyatt from criticism of the blood-splattered tunnel and dead-wrestler staging.", playAt: 6300, playEnd: 6660 }),
      wildestDetour: Object.freeze({ at: 1800, end: 2100, label: "THE HALLOWEEN SCENE CUT FIGHT", topic: "Sartain, Laurie, Corey, and one fight too many", body: "Play from 30:00. The chat's scene-removal question turns into a sharp argument about which Halloween sequel beat deserves to be erased.", playAt: 1800, playEnd: 2100 }),
      lastWord: Object.freeze({ at: 9720, end: 10260, label: "JASON SHOULD LIVE IN FAN CANON", topic: "simple continuity beats another mythology maze", body: "Play from 2:42:00. The hosts reject an overstuffed Friday prequel and choose a clean Jason-forward timeline fans can actually follow.", playAt: 9720, playEnd: 10260 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
