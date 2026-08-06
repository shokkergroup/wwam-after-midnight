(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /*
   * March 3, 2026: Scream 7 spoiler night. This is a full audio/caption read
   * of the canonical upload. The page distinguishes what the movie actually
   * gives the room from the audience's speculative Scream 8 pitches.
   */
  sources["WKs1uPGMQvw"] = Object.freeze({
    sourceId: "WKs1uPGMQvw",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 10891,
      captionWords: 35066,
      captionEvents: 9636,
      captionSpanSeconds: 10892.8,
      captionDurationCoveragePercent: 100,
      captionSha256:
        "sha256:2c1ea778bd3aa66104f003b54a20cb0ef23e57847c0bec7844c7245455de34b5",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256:
        "91122687778d55641a2134ed253d0f4e43b938a16f1b4a44543021b1c25f20e8",
      asrWindowCount: 46,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE STU LIVES TRIAL, WITH SPOILERS IN THE WITNESS BOX",
    badge: "FULL SHOW WIKI // 3:01:31 OF SCREAM 7 ARGUMENTS",
    headline:
      "SCREAM 7 KILLS THE WRONG PEOPLE, SHOWS THE BETTER ENDING TO TEST AUDIENCES, AND LEAVES STU'S GHOST RUNNING THE CHAT.",
    deck:
      "A full-spoiler Scream 7 postmortem where the room argues for Stu, prosecutes the test audience, rewrites Scream 8 in real time, dissects every kill and reveal, and still finds time for Ghostface bathroom logistics and a fan's elderly-grandparents theory.",
    overview:
      "This is not a tidy review and it should not be. The stream opens with box-office shock, a warning for Stu fans, and a theory that the movie's public-facing AI version of Stu gives the original killer a new motive. From there, the guys walk through the test-screening rumor that a flesh-and-blood Matthew Lillard ending existed, the uneven reveal, the brutal opening, McKenna Grace's torture kill, the motion-detector joke, the bat-versus-knife physics, and the moment Ghostface is dead halfway through the movie. The middle becomes a Scream 8 writers' room: bring Stu back, bring Sidney's road-trip idea back, let the legacy characters matter, and stop treating every reveal like a lecture. The late room is community theater in the best sense—Robin Barker, JT Customs, Michael Parton, Cody Leach, Danielle Harris memories, a possible elderly Ghostface couple, and a parasocial killer theory all get their own doors. The final pitch goes fully unhinged with Tara and Sam as Ghostfaces motivated by Stu, then the hosts sign off grateful that the audience can disagree without turning the franchise into a hostage situation.",
    story: Object.freeze([
      { at: 0, end: 599, label: "THE STU WARNING SIREN", body: "The stream starts with the spoiler siren already screaming. Scream 7 is out, the box office is enormous, and the hosts have bad news for Stu fans before they can even settle into the review. The first theory is deliciously cursed: if the killer used an AI version of Stu's likeness, Stu now has a reason to come out of hiding." },
      { at: 600, end: 1199, label: "THE TEST AUDIENCE SAW THE GOOD ENDING", body: "A rumored ending with Matthew Lillard alive was filmed and shown to test audiences. The room is furious that somebody got to see the version so many viewers wanted, while also reading the rumor as evidence that the filmmakers already know what Scream 8 could be." },
      { at: 1200, end: 1799, label: "THE REVEALS NEED BETTER CARE", body: "The conversation turns from Stu to structure. The hosts argue that the movie spends time on the wrong characters, that Tatum's friends deserved actual identities, and that the recent reveal run has not translated its explanations cleanly enough." },
      { at: 1800, end: 2399, label: "THE OPENING KILL EARNS ITS MONEY", body: "The opening is treated as one of the film's strongest stretches. A motion detector, a creepy eye movement, an Airbnb question, and McKenna Grace's torture-tinged kill give the night a real jolt before the stream starts litigating the rest." },
      { at: 2400, end: 2999, label: "THE BAT, THE SUV & THE CULT OF GHOSTFACE", body: "A bat bending a knife gets called on its physics, an SUV hit lands as a genuine surprise, and the room starts wishing for a cult-of-Ghostface turn. The movie killing Ghostface halfway through becomes a problem the writers have to solve before the third act." },
      { at: 3000, end: 3599, label: "THE ENDING THEY BURIED", body: "The talk returns to a filmed Stu ending, Billy-like visions, and the possibility of Matthew Lillard playing a truly unhinged double role. The room celebrates the idea, then swerves into a Scary Movie trailer and a viewer count that makes everybody dangerously confident." },
      { at: 3600, end: 4199, label: "THE ROAD TRIP AND THE LEGACY PROBLEM", body: "A road-trip continuation remains one of the preferred ways to move Scream forward. The guys compare the new Ghostface to the classics, protect the legacy cast, and admit the movie's best future depends on giving returning characters more than a line and a funeral." },
      { at: 4200, end: 4799, label: "THE TRAILER APOLOGY TOUR", body: "The room admits it praised the first trailer for hiding spoilers, only to discover that the later clips and marketing gave away too much. Ghostface's look is still praised, but the marketing has already stolen suspense from the asylum and wall sequences." },
      { at: 4800, end: 5399, label: "TATUM'S LINE STARTS A WAR", body: "A line about the last friend Sidney trusted being Tatum gets called disrespectful to Dewey and Gail. Fan messages keep the argument alive while the hosts debate whether the movie's nostalgia is affectionate, lazy, or both in the same scene." },
      { at: 5400, end: 5999, label: "STU GETS NEW LINES, NOT JUST OLD ONES", body: "The room isolates the reason Stu's possible return remains exciting: the character would not need to repeat old quotes. New Stu lines, a house fire, and a Matthew Lillard performance with room to go completely insane are treated as the movie's missing voltage." },
      { at: 6000, end: 6599, label: "THE CHAT BECOMES THE SECOND SCREENPLAY", body: "Questions about Scream rankings, the franchise's best Ghostface, and the future of Sidney pull the chat into the review. A viewer's idea can change the direction of the room faster than a studio note, which is why the archive needs fan callouts attached to timestamps." },
      { at: 6600, end: 7199, label: "ANNA CAMP AND THE MOTIVE GAP", body: "The conversation circles Anna Camp's performance and the question of whether the killer's explanation is enough. The room can enjoy the acting while still saying the third act feels underdeveloped and rushed." },
      { at: 7200, end: 7799, label: "GHOSTFACE NEEDS A BATHROOM", body: "A filthy but legitimate franchise question arrives: how has nobody in Scream ever needed to use the bathroom during a murder spree? The room pitches a Lethal Weapon 2-style toilet scene and then imagines Ghostface waiting behind a shower curtain." },
      { at: 7800, end: 8399, label: "THE GRANDPARENTS HAVE A MOTIVE", body: "Fan theory goes fully theatrical. The grandparents of a new character become a possible elderly Ghostface duo trying to protect their family. It is silly, structurally possible, and exactly the kind of wild franchise pitch the room enjoys more than safe studio logic." },
      { at: 8400, end: 8999, label: "DANIELLE HARRIS, DEWEY & THE WRONG KID", body: "Late fan messages bring up Detective Kincaid, Danielle Harris, Dewey, and the joke about telling David Arquette the wrong kid died. The audience's personal memories of the franchise become part of the episode's emotional record." },
      { at: 9000, end: 9599, label: "THE REVIEW ROOM OPENS ITS DOORS", body: "The hosts explain how the live show works, why StreamElements matters, and why disagreement is welcome. They defend liking a movie other people hate while taking aim at people who review a franchise they claim to despise." },
      { at: 9600, end: 10199, label: "THE REVEAL GETS RECONSTRUCTED", body: "Nev Campbell's premiere suit, JT Customs' theater story, and Ethan Embry's reveal are revisited. The 'who the fuck is that guy?' reaction becomes a perfect shorthand for a reveal that arrives before the audience has a reason to care." },
      { at: 10200, end: 10891, label: "THE PARASOCIAL SCREAM 8 PACKAGE", body: "The final hour folds together mixed reviews, parasocial motive, audience fatigue, and one enormous Scream 8 pitch: Tara and Sam as Ghostfaces, motivated by Stu, coming after Sidney. The guys admit it may be Fast and the Furious logic, but the freedom to pitch something insane is why they still love Scream." },
    ]),
    highlights: Object.freeze([
      { at: 25, end: 55, category: "CHARACTER SIGNAL", label: "THE STU HEADS GET BAD NEWS", excerpt: "The spoiler stream opens by warning the people who still believe Stu is the franchise's unfinished business." },
      { at: 110, end: 140, category: "TAKE GETS NUCLEAR", label: "THE BOX OFFICE GOES WOO WEE", excerpt: "Scream 7's opening numbers are treated like a financial jump scare." },
      { at: 230, end: 260, category: "TAKE GETS NUCLEAR", label: "AI STU CREATES A MOTIVE", excerpt: "Using Stu's likeness becomes the kind of insult that could send him back into the darkness." },
      { at: 430, end: 470, category: "FAN SIGNAL", label: "THE CHAT WANTS STU ALIVE", excerpt: "The live room confirms the obvious: a lot of viewers came to this movie hoping Matthew Lillard would return." },
      { at: 685, end: 720, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE TEST AUDIENCE GOT THE GOOD ENDING", excerpt: "The rumored living-Stu ending is treated as evidence that the wrong people got to vote." },
      { at: 920, end: 950, category: "BEST MOMENT", label: "STU WAS FILMED ALIVE", excerpt: "The room processes the fact that a real Matthew Lillard ending reportedly existed." },
      { at: 1260, end: 1295, category: "TAKE GETS NUCLEAR", label: "MINDY AND CHAD GET TOO MUCH REAL ESTATE", excerpt: "The critique is not that the characters exist; it is that other victims never get enough time to matter." },
      { at: 1450, end: 1485, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE LAST THREE REVEALS FAILED", excerpt: "The stream gives the recent reveal streak a blunt performance review." },
      { at: 1825, end: 1860, category: "BEST MOMENT", label: "THE OPENING IS SICK", excerpt: "The opening murder earns an immediate pass before the spoiler autopsy begins." },
      { at: 1905, end: 1942, category: "WWAM UP IN YA", label: "THE MOTION DETECTOR GUY IS A BLINK-182 MEMBER", excerpt: "A single line reading the motion detector becomes an entire fake casting decision." },
      { at: 2020, end: 2058, category: "BEST MOMENT", label: "THE EYEBALL ROLL", excerpt: "The eye movement is called one of the movie's coolest visual shocks." },
      { at: 2120, end: 2160, category: "BEST MOMENT", label: "MCKENNA GRACE GETS THE HOSTILE TAKE", excerpt: "The torture-flavored kill is praised as beautifully shot and brutally effective." },
      { at: 2430, end: 2465, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE BAT DOES NOT BEND THAT KNIFE", excerpt: "A physics complaint survives the spoiler discussion and refuses to leave." },
      { at: 2510, end: 2548, category: "BEST MOMENT", label: "THE SUV HIT STILL WORKS", excerpt: "Even with trailer exposure, the vehicle impact lands as a real shock." },
      { at: 2600, end: 2640, category: "TAKE GETS NUCLEAR", label: "CULT OF GHOSTFACE BABY", excerpt: "Ghostface dying early turns into the fantasy of a larger Stu-driven cult." },
      { at: 3040, end: 3080, category: "CHARACTER SIGNAL", label: "STU COULD BE BATSHIT INSANE", excerpt: "Matthew Lillard gets imagined as a two-track, fully unhinged Stu performance." },
      { at: 3140, end: 3185, category: "THE ROOM BREAKS", label: "666 VIEWERS IN THE ROOM", excerpt: "The viewer count becomes a demonic excuse for somebody to leave or come." },
      { at: 3300, end: 3335, category: "WWAM UP IN YA", label: "SCARY MOVIE WALKS THROUGH THE DOOR", excerpt: "A trailer mention arrives while the room is still arguing about resurrecting Stu." },
      { at: 3720, end: 3760, category: "CREATOR DNA", label: "THE ROAD TRIP IS STILL THE MOVE", excerpt: "A road-trip structure remains the preferred way to make Scream feel like a living franchise again." },
      { at: 3870, end: 3915, category: "TAKE GETS NUCLEAR", label: "RANKING THE GHOSTFACES", excerpt: "The hosts compare the new killer to the franchise's best without pretending nostalgia wins automatically." },
      { at: 4235, end: 4275, category: "CREATOR MEMORY", label: "THE TRAILER PRAISE BACKFIRES", excerpt: "They remember praising the marketing for hiding spoilers, then watch the later clips give away the movie." },
      { at: 4580, end: 4620, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE FOREHEAD IS TOO LOUD", excerpt: "Ghostface's look is mostly praised, but the trailers showed just enough forehead to make it weird." },
      { at: 4920, end: 4960, category: "FAN SIGNAL", label: "ROBIN BARKER CALLS THE MYERS SHOT", excerpt: "A fan message opens a comparison between Scream 7's Ghostface photography and Michael Myers." },
      { at: 5150, end: 5190, category: "TAKE GETS NUCLEAR", label: "TATUM'S LINE DISRESPECTS EVERYONE", excerpt: "Calling Tatum Sidney's last trusted friend sends Dewey and Gail into the courtroom." },
      { at: 5480, end: 5525, category: "BEST MOMENT", label: "NEW STU LINES, NOT REHEATED STU", excerpt: "The room is excited by the possibility of quotable Stu material that is actually new." },
      { at: 5660, end: 5700, category: "CHARACTER SIGNAL", label: "THE HOUSE FIRE IS THE VOLTAGE", excerpt: "A Stu house-fire idea is treated as the kind of reckless set piece Scream 7 needed." },
      { at: 6020, end: 6065, category: "FAN SIGNAL", label: "THE CHAT WRITES SCREAM 8", excerpt: "Viewer prompts move from rankings to future-franchise architecture without waiting for a studio meeting." },
      { at: 6250, end: 6295, category: "WWAM UP IN YA", label: "J AND MIKE GET CALLED WEIRD", excerpt: "A fan question about the hosts' friendship produces a defensive thirty-year friendship hearing." },
      { at: 6660, end: 6705, category: "TAKE GETS NUCLEAR", label: "ANNA CAMP CAN PLAY CRAZY", excerpt: "The room separates a good performance from a motivation they still do not buy." },
      { at: 6950, end: 6990, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE THIRD ACT WAS RUSHED", excerpt: "The late reveal gets blamed on production upheaval and a script that needed another draft." },
      { at: 7225, end: 7265, category: "WWAM UP IN YA", label: "GHOSTFACE HAS TO TAKE A SHIT", excerpt: "The show identifies a franchise-sized bathroom hole and refuses to let it remain unfilled." },
      { at: 7325, end: 7365, category: "BEST MOMENT", label: "THE LETHAL WEAPON 2 TOILET PITCH", excerpt: "A toilet scene is proposed as the most practical way to make a Ghostface attack worse." },
      { at: 7640, end: 7680, category: "FAN SIGNAL", label: "THE ELDERLY GHOSTFACE COUPLE", excerpt: "A viewer pitches grandparents protecting their grandchildren with matching masks." },
      { at: 7835, end: 7875, category: "TAKE GETS NUCLEAR", label: "SILLY BUT THE MOTIVE WORKS", excerpt: "The room admits the wild theory is at least more emotionally legible than some official explanations." },
      { at: 8060, end: 8100, category: "FAN SIGNAL", label: "NICK MATHIS WANTS MORE RAIN", excerpt: "A fan's weather idea becomes a visual recipe for the next Ghostface reveal." },
      { at: 8240, end: 8280, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE FRANCHISE IS TOO AFRAID TO SWING", excerpt: "The movie is accused of protecting its money instead of risking a truly strange third act." },
      { at: 8455, end: 8500, category: "COMMUNITY MEMORY", label: "TELL DEWEY THE WRONG KID DIED", excerpt: "A fan memory about meeting David Arquette turns into an outrageous but affectionate franchise anecdote." },
      { at: 8670, end: 8710, category: "CHARACTER SIGNAL", label: "DANIELLE HARRIS HEARS ABOUT STU", excerpt: "A spouse wearing a Stu Lives shirt creates a tiny piece of convention-lore for the archive." },
      { at: 9050, end: 9095, category: "FAN SIGNAL", label: "THE STREAMELEMENTS EXPLAINER", excerpt: "The hosts explain where fans can support the room and why the live show keeps its doors open." },
      { at: 9280, end: 9325, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "DON'T REVIEW FRANCHISES YOU HATE", excerpt: "The review room draws a line between disagreement and showing up just to despise the subject." },
      { at: 9650, end: 9695, category: "WWAM UP IN YA", label: "NEV CAMPBELL'S VINCE SUIT", excerpt: "Nev's premiere outfit gets compared to a corporate walkout and then praised as clean." },
      { at: 9860, end: 9905, category: "THE ROOM BREAKS", label: "WHO THE FUCK IS THAT GUY", excerpt: "A fan's bathroom break causes a reveal reaction that perfectly captures Ethan Embry's problem." },
      { at: 10020, end: 10065, category: "TAKE GETS NUCLEAR", label: "THE KILLER EXPLANATION WAS THE WEAK LINK", excerpt: "The stream grants the movie its strengths while identifying the motive and reveal as the failure point." },
      { at: 10235, end: 10280, category: "FAN SIGNAL", label: "PARASOCIAL GHOSTFACE", excerpt: "A viewer's theory finds a modern motive in the way online relationships turn poisonous." },
      { at: 10410, end: 10455, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "STOP HATING MOVIES YOU REVIEW", excerpt: "The hosts have no patience for a review that begins by announcing hatred for the entire franchise." },
      { at: 10645, end: 10705, category: "TAKE GETS NUCLEAR", label: "TARA AND SAM AS GHOSTFACES", excerpt: "The final giant pitch makes Tara and Sam the killers, motivated by Stu, and admits it is beautiful Fast-and-the-Furious nonsense." },
      { at: 10755, end: 10820, category: "LAST CALL", label: "FUCK IT, WHY NOT", excerpt: "Scream remains special because the room can still pitch something completely insane and want to see it." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({
        at: 1800,
        end: 2160,
        label: "THE OPENING KILL RUN",
        topic: "the motion detector, eye roll, and McKenna Grace sequence",
        body: "Play from 30:00. This is where the room stops litigating rumors and admits the movie can still stage a nasty, memorable kill.",
        playAt: 1800,
        playEnd: 2160,
      }),
      hated: Object.freeze({
        at: 6950,
        end: 6990,
        label: "THE RUSHED THIRD ACT",
        topic: "reveal logic and production upheaval",
        body: "Play from 1:55:50. The criticism is specific: the third act feels underdeveloped, the motive arrives late, and the movie needed another pass.",
        playAt: 6950,
        playEnd: 6990,
      }),
      wildestDetour: Object.freeze({
        at: 7225,
        end: 7835,
        label: "GHOSTFACE NEEDS A BATHROOM",
        topic: "poop logistics and an elderly Ghostface duo",
        body: "Play from 2:00:25. The room solves the franchise's most embarrassing practical problem and then lets the audience pitch grandparents in matching masks.",
        playAt: 7225,
        playEnd: 7835,
      }),
      lastWord: Object.freeze({
        at: 10235,
        end: 10820,
        label: "THE Scream 8 HOLY-SHIT PACKAGE",
        topic: "parasocial motive, Tara, Sam, and Stu",
        body: "Play from 2:50:35. The audience turns the ending into a room-sized writers' board, and the hosts leave the door open for beautiful nonsense.",
        playAt: 10235,
        playEnd: 10820,
      }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
