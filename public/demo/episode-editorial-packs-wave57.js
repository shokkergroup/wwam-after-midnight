(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* December 8, 2025: full-tape read of the Welcome to Derry episode-seven recap. */
  sources["qocixR2FEA0"] = Object.freeze({
    sourceId: "qocixR2FEA0",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 2023,
      captionWords: 2168,
      captionEvents: 252,
      captionSpanSeconds: 1922.76,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:c792501502a9a85098aeefb2ffe58c5ec8d1e4f9973427c7f79f1b7f1fe9428c",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "e1d702ce8ae8012b539e294167f29bab4f0b448d0728b9f05e3351ab37b9f98a",
      asrWindowCount: 20,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "IT: WELCOME TO DERRY EPISODE 7 RECAP // DICK HALLORAN SAVES THE SHOW, PENNYWISE GOES BLACK-AND-WHITE, AND THE FAM GETS WEIRD",
    badge: "FULL SHOW WIKI // 33:43 OF DICK HALLORAN PRAISE, PENNYWISE LORE, POWER RANGERS, SUPERCHATS, AND ONE VERY BAD CHRISTMAS IDEA",
    headline: "EPISODE 7 FINALLY LETS DICK HALLORAN FLEX, THEN THE ROOM STOPS THE RECAP TO RANK PENNYWISE, POWER RANGERS, AND MEAT LIQUID.",
    deck:
      "A sharp, vulgar recap of the penultimate Derry episode: Dick Halloran is still the savior, Pennywise's refrigerator moment earns a genuine 8.5-to-9, a Black Spot battle gets unpacked, the FAM asks Loomis and Challis about meat liquid, and the room ends by debating whether Santa killing Nazis is the right kind of Christmas news.",
    overview:
      "This episode gets a much warmer read than the earlier middle chapters because the room can finally point to scenes that work. Dick Halloran dominates the praise, James Remar gets remembered as a badass, and the battle at the Black Spot gives the recap an actual pulse. Pennywise's refrigerator moment, the black-and-white design, and the demonic-Freddy comparison all earn genuine enthusiasm. The room still has time for the old complaints: Mrs. Hanlon remains a target, the military's pillar plan becomes an obscene object joke, and a Native American meeting produces a line that gets preserved because it is so rude and unexpected. The second half is pure WWAM ecology. A CollegeHumor Power Rangers clip, a Michael Shannon cheerleader-letter memory, Call of Duty and Monopoly detours, Spawn in 4K, a Loomis-and-Challis meat-liquid prompt, and a Silent Night, Deadly Night headline about Santa versus Nazis fill out the FAM lane. The episode works because the recap is not trying to be polite about its affection. It can call Dick the savior, call an image stupid, give the episode an 8.5, and still spend five minutes wondering if Pennywise has started eating everybody instead of just kids.",
    story: Object.freeze([
      { at: 0, end: 350, label: "THE BLACK SPOT BATTLE AND DICK'S VICTORY LAP", body: "The recap opens by admitting the episode has a lot going on, then gives Dick Halloran the clear win. The Black Spot battle is intense, the show finally feels directed, and the room wants more of the character who keeps rescuing the series." },
      { at: 351, end: 700, label: "INGRID, THE PILLAR, AND THE MILITARY'S BAD PLAN", body: "Ingrid finally recognizes what is happening while the military tracks a spiritual clue to a grave and a pillar. The room understands the plan, then makes it filthy because that is how the show survives a long explanation." },
      { at: 701, end: 1050, label: "THE HANLON HOUSE, PARAMOUNT, AND THE ARTIST WITH RED LIGHTS", body: "A Native American meeting supplies the season's bluntest throwaway line, Mrs. Hanlon reopens the grudge, and an artist who paints to Megadeth gets an entirely invented backstory. Paramount's hostile bid adds a real-world news lane beneath the jokes." },
      { at: 1051, end: 1400, label: "PENNYWISE ON THE REFRIGERATOR", body: "The room pauses for a copyright-safe clip and finds the episode's cleanest horror receipt: Pennywise on top of the refrigerator, a black-and-white look, and an 8.5-to-9 rating that feels earned." },
      { at: 1401, end: 1750, label: "POWER RANGERS, FREDDY, AND THE LORE QUESTION", body: "A CollegeHumor Power Rangers clip becomes a debate about which jokes are funny, which characters are offensive, and whether Pennywise's eating habits are changing. Demonic Freddy and super-zombie Jason become the visual comparison board." },
      { at: 1751, end: 2023, label: "MEAT LIQUID, SPAWN, AND CHRISTMAS NAZIS", body: "Superchats bring Spawn in 4K and a Loomis-and-Challis meat-liquid prompt. The final movie-news lane hears that Santa kills Nazis in Silent Night, Deadly Night, then the room signs off with exactly the wrong amount of holiday cheer." },
    ]),
    highlights: Object.freeze([
      { at: 75, end: 124, category: "WWAM UP IN YA", label: "THE MUSCHIETTI TOPPINGS THEORY", excerpt: "The room imagines Andy Muschietti saving the best toppings for his favorite episodes while everybody else gets the leftover pizza." },
      { at: 175, end: 224, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE FACE-SLICING VISION", excerpt: "A sudden Pennywise image is treated like a director's last-second idea, complete with a face-slicing command nobody in the room requested." },
      { at: 306, end: 356, category: "BEST MOMENT", label: "DICK HALLORAN SAVES THE SHOW", excerpt: "The room gives Dick Halloran the episode and season MVP title after the Black Spot fight finally delivers the intensity they wanted." },
      { at: 329, end: 378, category: "WWAM UP IN YA", label: "THE BLACK SPOT NAME CHECK", excerpt: "The room notices the battle location's name, decides it sounds strange, and then refuses to stop saying it." },
      { at: 449, end: 498, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "CRY OFF CAMERA", excerpt: "A grieving character is told to save the tears for private because being on camera means it is time to perform." },
      { at: 466, end: 516, category: "FAN SIGNAL", label: "STOP SAYING GIGGLES", excerpt: "The chat repeats a clown nickname until the room threatens to lose its mind, turning one word into a live audience stinger." },
      { at: 511, end: 560, category: "DEEP DIVE", label: "AUSTIN BUTLER AND BILL SKARSGÅRD LOOK-ALIKE LORE", excerpt: "Hairlines and family resemblance become a casting mystery when Austin Butler and Bill Skarsgård are compared side by side." },
      { at: 603, end: 652, category: "TAKE GETS NUCLEAR", label: "THE PILLAR AS A WEAPON", excerpt: "The military wants the pillar for its own plan, and the room turns the intended object into an obscene joke before explaining the actual stakes." },
      { at: 631, end: 680, category: "FAN SIGNAL", label: "JAMES REMAR IS BACK", excerpt: "James Remar's return earns a sincere badass receipt in the middle of the pillar and Pennywise discussion." },
      { at: 725, end: 774, category: "WWAM UP IN YA", label: "THE CHUCK NORRIS HANGOVER", excerpt: "A morning-after image compares waking up after drinking with discovering you are somehow in the wrong home and the room has to explain itself." },
      { at: 738, end: 788, category: "THE ROOM BREAKS", label: "THE SHIT-ASS MEETING", excerpt: "A serious Native American meeting gets interrupted by one blunt insult, and the room preserves the line because it changes the temperature instantly." },
      { at: 786, end: 836, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "MRS. HANLON'S BORDER PLAN", excerpt: "Mrs. Hanlon's attempt to move a man across the border reopens the room's long-running cheating and manipulation complaint." },
      { at: 801, end: 850, category: "WWAM UP IN YA", label: "THE ICE-COLD MISSION IMPOSSIBLE LINE", excerpt: "A border-crossing plan is matched with a 1990s dance-movie reference, which is exactly the wrong soundtrack for the scene." },
      { at: 992, end: 1042, category: "THE ROOM BREAKS", label: "THE MEGADETH ARTIST BACKSTORY", excerpt: "A painter gets an invented room, red lights, and a Megadeth playlist, proving the hosts can build an entire character from one visual." },
      { at: 1008, end: 1058, category: "WWAM UP IN YA", label: "THE BRAIN MELT", excerpt: "The room's own tangent becomes too much even for the people making it, and the recap preserves the moment the brain officially melts." },
      { at: 1020, end: 1070, category: "DEEP DIVE", label: "PARAMOUNT'S HOSTILE BID", excerpt: "Paramount's hostile takeover attempt lands as real industry news under the Derry jokes, giving the stream an actual movie-business lane." },
      { at: 1076, end: 1126, category: "FAN SIGNAL", label: "THE CLIP THAT NEEDS A PAUSE", excerpt: "The hosts stop the video to protect the copyright window, then restart the exact Pennywise moment the audience came to see." },
      { at: 1142, end: 1192, category: "BEST MOMENT", label: "PENNYWISE ON THE REFRIGERATOR", excerpt: "Pennywise on top of the refrigerator gets the strongest visual praise of the episode and an immediate 8.5-to-9 rating." },
      { at: 1204, end: 1254, category: "DEEP DIVE", label: "BLACK-AND-WHITE PENNYWISE", excerpt: "The black-and-white look earns a rare unanimous compliment before the room moves to the next piece of weirdness." },
      { at: 1220, end: 1270, category: "WWAM UP IN YA", label: "IF THE INTERNET DIES, QUIT", excerpt: "A failed playback attempt gets a new WWAM policy: if the internet takes a dump, stop trying instead of torturing everybody." },
      { at: 1232, end: 1282, category: "FAN SIGNAL", label: "COLLEGEHUMOR RANGERS", excerpt: "A CollegeHumor Power Rangers sketch opens the next lane, and the room recognizes the clip before the politics of the joke arrive." },
      { at: 1309, end: 1359, category: "TAKE GETS NUCLEAR", label: "THE PIG RANGER ARGUMENT", excerpt: "The parody's ranger assignments become an intentionally uncomfortable leadership argument, preserved as a comedy receipt rather than a serious position." },
      { at: 1382, end: 1432, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE PURGE CONNECTION", excerpt: "A Power Rangers exit gets tied to a movie-night purge joke, then the room admits the clip is funny because it is so wildly wrong." },
      { at: 1405, end: 1455, category: "FAN SIGNAL", label: "MICHAEL SHANNON'S CHEERLEADER LETTER", excerpt: "The hosts name a favorite CollegeHumor bit involving Michael Shannon reading a cheerleader letter, another archive door for fans to chase." },
      { at: 1557, end: 1607, category: "BEST MOMENT", label: "DEMONIC FREDDY RISES", excerpt: "Pennywise's movement is compared to Freddy rising from the lake in Freddy versus Jason, with the room calling that version the visual winner." },
      { at: 1578, end: 1628, category: "DEEP DIVE", label: "SUPER-ZOMBIE JASON", excerpt: "The character-look debate adds super-zombie Jason to the board, turning the episode into an accidental history of monster upgrades." },
      { at: 1624, end: 1674, category: "TAKE GETS NUCLEAR", label: "PENNYWISE EATS EVERYBODY", excerpt: "The room asks whether the show is changing Pennywise's rules by having him eat anyone at any time, then tries to rebuild the fear logic." },
      { at: 1682, end: 1732, category: "WWAM UP IN YA", label: "THE MONOPOLY CHRISTMAS MIRACLE", excerpt: "A back injury cancels Monopoly night, which the room treats as a genuine Christmas miracle rather than a medical event." },
      { at: 1754, end: 1804, category: "FAN SIGNAL", label: "SPAWN IN 4K", excerpt: "A fan's Spawn-in-4K message opens an honest discussion: the movie has parts the room likes, and the animated show still wins." },
      { at: 1792, end: 1842, category: "CHARACTER PERFORMANCE", label: "LOOMIS AND CHALLIS TRY MEAT LIQUID", excerpt: "Dr. Loomis and Dr. Challis answer a fan's meat-liquid question, then the room discovers the prompt has a much dirtier second meaning.", characters: ["Dr. Loomis", "Dr. Challis"] },
      { at: 1801, end: 1851, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "SHUCK IT FOR THE JUICE", excerpt: "The meat-liquid bit turns into a crab-leg metaphor that is far too committed to explaining how the juice gets out." },
      { at: 1891, end: 1941, category: "FAN SIGNAL", label: "SILENT NIGHT, DEADLY NIGHT NEWS", excerpt: "A new Silent Night, Deadly Night headline says Santa kills Nazis, and the room agrees the Christmas movie has at least chosen a side." },
      { at: 1910, end: 1960, category: "WWAM UP IN YA", label: "THE CHRISTMAS FEED", excerpt: "The holiday mood is ruined by a violent headline, then the room admits the sudden turn is exactly why the news feed is impossible to leave." },
      { at: 2000, end: 2022, category: "BEST MOMENT", label: "END ON THE WORST POSSIBLE NOTE", excerpt: "The recap closes with the room deliberately choosing the darkest, weirdest Christmas-news note before the next episode." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1142, end: 1192, label: "PENNYWISE ON THE REFRIGERATOR", topic: "the episode's cleanest horror image", body: "Play from 19:02. The refrigerator shot and black-and-white Pennywise look finally make the room stop nitpicking and enjoy the monster.", playAt: 1142, playEnd: 1192 }),
      hated: Object.freeze({ at: 349, end: 398, label: "EVERY FRAME IS UGLY", topic: "the production complaint underneath the recap", body: "Play from 5:49. The room praises Dick Halloran while making clear the surrounding effects are not earning the same mercy.", playAt: 349, playEnd: 398 }),
      wildestDetour: Object.freeze({ at: 1792, end: 1842, label: "LOOMIS AND CHALLIS TRY MEAT LIQUID", topic: "the superchat that derails the movie recap", body: "Play from 29:52. A simple character prompt becomes a crab-leg metaphor and one of the episode's filthiest audience receipts.", playAt: 1792, playEnd: 1842 }),
      lastWord: Object.freeze({ at: 2000, end: 2022, label: "END ON THE WORST POSSIBLE NOTE", topic: "the final Christmas-news stinger", body: "Play from 33:20. The room signs off after Santa-versus-Nazis news, proving the holiday lane has no safe landing.", playAt: 2000, playEnd: 2022 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
