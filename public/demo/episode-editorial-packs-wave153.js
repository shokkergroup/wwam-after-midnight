(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "NU-qb0l8pf0", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (Array.isArray(characters) && characters.length) item.characters = characters;
    return item;
  };

  /* January 22, 2025: movie-news room re-read from the full caption ledger and local audio. */
  sources["NU-qb0l8pf0"] = Object.freeze({
    sourceId: "NU-qb0l8pf0",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; complete caption ledger and local audio windows across the January 22, 2025 horror/action movie-news room",
    evidence: Object.freeze({
      duration: 5447,
      captionWords: 19328,
      captionEvents: 5096,
      captionSpanSeconds: 5446.4,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:f05b191d035aeeac125ddc259fd545b9e42df2ebdf0a46f5f9e150d8aa0d3715",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:976024743c12c6565d0075ff63416f5474cdca459a4aa4df0ac4a5352b710dca",
      asrWindowCount: 19,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE AI ARGUMENT, THE WOOF MOVIE, AND THE HALLOWEEN STANK REPORT // JANUARY 22, 2025",
    badge: "FULL SHOW WIKI // 1:30:47 OF SEQUEL DISAPPOINTMENTS, SAM RAIMI NEWS, MICHAEL MYERS VERSUS ARTHUR MORGAN, AND OLD ENGLISH WEREWOLF PORN",
    headline: "CHATGPT FINALLY PICKS MICHAEL MYERS; ROBERT EGGERS INVENTS WOOF; HALLOWEEN ENDS GETS A STANK SENTENCE",
    deck: "A compact news room that starts with Happy Gilmore 2 nerves, defends Ghostbusters 2, turns an AI answer into a character of its own, and ends by translating medieval werewolf dialogue until the hosts sound possessed.",
    overview: "The January 22, 2025 WWAM Video is a tight movie-news room with a surprisingly complete arc. It opens in the neighbors' apartment-cleanout aftermath, where the hosts joke about Breaking Bad juice and then ask the dangerous question: have comedy sequels ever actually worked? Happy Gilmore 2 is treated as a 50/50 proposition, while Ghostbusters 2 gets a full defense against the fans who act like Vigo personally ruined their childhood. The FAM keeps the room moving: Byron Hansen reports the Pokemon card craze and calls Predator 2 underrated, Willie asks for a Mark Wahlberg birthday message, Michael Parton celebrates Sonic 4, Lemon Press brings up The Gorge, and Child of the Corn sends comic-book and werewolf recommendations. The news board then widens. Sam Raimi's Send Help gets a survival-island pitch with Freddy vs. Jason writers, Ryan Gosling and Shawn Levy's possible Star Wars project gets a tone debate, and a trailer is criticized for showing its entire setup while Blumhouse gets accused of polishing the same ball-sucking machine. The Toxic Avenger earns a more serious lane: Peter Dinklage, Kevin Bacon, Elijah Wood, the original transformation, the movie's festival reception, and the anxiety around reshoots and an enormous rumored budget. Marvel is next. Benedict Cumberbatch's Doctor Strange absence from Doomsday becomes a discussion of what the character still could be, while Robert Downey Jr.'s return and Daredevil are the few projects that still get genuine anticipation. Robert Eggers' new 13th-century werewolf film becomes the room's signature bit when the hosts realize the title and dialect may force everybody to say “woof” for two years. ChatGPT is invited into the show for a challenge: Michael Myers versus Arthur Morgan. The first answer hedges, the hosts demand a straight pick, and the bot finally says Michael wins nine times out of ten, then answers with a suspiciously affectionate “sugar plum.” The Halloween lane closes the loop. Halloween Ends is compared with Halloween 3, the room argues about honesty in franchise promises, a Reddit meme treats Michael Myers as an unstoppable mascot, and the stain of Resurrection is compared to a prison sentence. The final news door is Return of the Living Dead: Trash's Revenge, including the uncomfortable idea of using CGI to resurrect late cast members. The sign-off glitches into one last “woof,” which is exactly where this show wanted to land.",
    story: Object.freeze([
      { at: 0, end: 600, label: "THE APARTMENT CLEANOUT AND THE COMEDY-SEQUEL COURT", body: "A neighbor's apartment becomes a Breaking Bad joke, then the room asks whether Happy Gilmore 2 can avoid the sequel curse. Ghostbusters 2, Bill and Ted's Bogus Journey, Rush Hour 2, Wayne's World 2, and other follow-ups are placed on trial by memory." },
      { at: 600, end: 1200, label: "POKEMON, PREDATOR 2, AND SEND HELP", body: "The Pokemon resale craze arrives through Byron's message, Predator 2 gets an underrated defense, and Sam Raimi's Send Help receives a proper premise-and-cast breakdown instead of just a title mention." },
      { at: 1200, end: 1800, label: "RYAN GOSLING'S STAR WARS AND THE FAM'S COLD-WEATHER ROOM", body: "Ryan Gosling and Shawn Levy's Star Wars possibility becomes a tone argument. The chat supplies birthdays, comic recommendations, and a winter story that turns the room's crude hospitality into a recurring bit." },
      { at: 1800, end: 2400, label: "THE JACK-THE-RIPPER SIDE QUEST AND GHOSTBUSTERS VERSUS BACK TO THE FUTURE", body: "A strange neighbor story becomes a loud-TV theory, then a fan asks which two-film set survives: Ghostbusters or Back to the Future. The answer is a brand decision disguised as a movie argument." },
      { at: 2400, end: 3000, label: "CHATGPT ENTERS THE WWAM CAST", body: "The hosts ask ChatGPT who would win between Michael Myers and Arthur Morgan. After the model hedges, they demand a clean answer, and the bot finally gives Michael the nine-out-of-ten victory." },
      { at: 3000, end: 3600, label: "THE TOXIC AVENGER RESCUE MISSION", body: "Peter Dinklage's Toxic Avenger, Kevin Bacon, Elijah Wood, festival reactions, reshoots, and a rumored mega-budget create the show's most grounded piece of movie reporting." },
      { at: 3600, end: 4200, label: "DOCTOR STRANGE, DOOMSDAY, AND ROBERT EGGER'S WOOF", body: "Doctor Strange's future in Marvel gets debated, then Robert Eggers announces a 13th-century werewolf film whose title and dialect sound like a kennel command." },
      { at: 4200, end: 4800, label: "HALLOWEEN 3, HALLOWEEN ENDS, AND THE MEDIEVAL AI ORACLE", body: "The room asks whether Halloween Ends could age into a Halloween 3-style reappraisal, then uses ChatGPT to generate faux-medieval werewolf prose that turns into a filthy fantasy monologue." },
      { at: 4800, end: 5200, label: "THE RESURRECTION STANK REPORT", body: "A fan compares the time needed to wash off Halloween Resurrection with the time needed to wash off Halloween Ends. The hosts separate disappointment, dishonesty about the premise, and outright franchise rot." },
      { at: 5200, end: 5447, label: "TRASH'S REVENGE AND THE LAST WOOF", body: "Return of the Living Dead's new project gets its cast and CGI-resurrection news, then the room freezes at the end and signs off with the werewolf word it accidentally invented." },
    ]),
    highlights: Object.freeze([
      H(34, 50, "WWAM UP IN YA", "BREAKING BAD JUICE IN THE APARTMENT", "A neighbor's cleanout becomes a joke about finding the wrong kind of chemistry set behind the door."),
      H(98, 114, "TAKE GETS NUCLEAR", "HAPPY GILMORE 2 IS A FIFTY-FIFTY", "The sequel gets cautious hope and a warning not to give the lead a stupid voice for the entire movie."),
      H(332, 348, "TAKE GETS NUCLEAR", "GHOSTBUSTERS 2 DOES NOT DESERVE THE HATE", "The room wants a four-hour defense of Ghostbusters 2 against fans who act like Vigo personally cursed the franchise."),
      H(396, 412, "DEEP DIVE", "THE COMEDY-SEQUEL WINDOW", "Rush Hour 2, Wayne's World 2, Hot Shots Part Deux, and 22 Jump Street get used to explain why timing matters more than nostalgia."),
      H(468, 484, "SOUNDBYTE / REPLAY", "BIG JOE GRIZZLY'S JAIL SANDWICH", "A fan's phrase gets turned into an absurd prison-food image that neither host can stop repeating."),
      H(612, 628, "FAN SIGNAL", "POKEMON CARDS START A RESALE WAR", "Byron Hansen reports people fighting over product and asks whether Logan Paul deserves the blame."),
      H(682, 698, "TAKE GETS NUCLEAR", "PREDATOR 2 IS THE CITY UNDERRATED CLASSIC", "The sequel is defended for trading jungle Arnold for a grimy urban hunt and a different kind of Predator movie."),
      H(926, 942, "DEEP DIVE", "SEND HELP HAS THE FREDDY VS. JASON WRITERS", "Sam Raimi's survival-island film gets a proper door: Rachel McAdams, Dylan O'Brien, and writers with a horror-action résumé."),
      H(1018, 1034, "FAN SIGNAL", "THE GORGE TRAILER QUESTION", "Lemon Press drops a trailer prompt into the news desk and the room uses it to open the next horror lane."),
      H(1228, 1244, "TAKE GETS NUCLEAR", "RYAN GOSLING COULD BE A STAR WARS HAN", "The room cannot decide whether Gosling belongs in a jokey Guardians-style space crew or a lonely Jedi story."),
      H(1344, 1360, "FAN SIGNAL", "MARK WAHLBERG BIRTHDAY DUTY", "Willie asks for a birthday message for Miriam, turning a movie-news room into a small community celebration."),
      H(1510, 1526, "FAN SIGNAL", "MICHAEL PARTON CELEBRATES SONIC 4", "Sonic gets a 2027 release mention and Michael Parton's loyalty is described with the exact crude affection the room expects."),
      H(1632, 1648, "COMMUNITY MEMORY", "THE COMIC HUNTING WOLF LANE", "Child of the Corn recommends Batman, Lord of the Dark, and a new werewolf series, giving the archive a fan-led reading list."),
      H(1820, 1836, "WWAM UP IN YA", "THE LOUD-TV JACK-THE-RIPPER THEORY", "A strange apartment story becomes a theory that the television was turned up to hide a murder, or simply because someone was annoying."),
      H(1916, 1932, "FAN SIGNAL", "THE PACKERS GET BLAMED BY NAME", "A sports superchat turns movie night into a quick rivalry, then the room remembers who actually lost the game."),
      H(2138, 2154, "FAN SIGNAL", "THE PO BOX HAS A DANGEROUS MAIL POLICY", "A fan asks where to send something, and the answer escalates into an envelope that should probably never be opened on camera."),
      H(2200, 2216, "TAKE GETS NUCLEAR", "GHOSTBUSTERS OR BACK TO THE FUTURE", "The room chooses a two-film set to keep forever, with loyalty and chemistry beating a more perfect time-travel machine."),
      H(2276, 2292, "DEEP DIVE", "DAN AYKROYD, BILL MURRAY, AND PERFECT CHEMISTRY", "Ghostbusters survives the comparison because its SNL cast, Ernie Hudson, and shared screen rhythm feel irreplaceable."),
      H(2412, 2428, "DEEP DIVE", "MICHAEL MYERS VERSUS ARTHUR MORGAN", "The challenge is framed as inhuman persistence against human skill before the room demands a real winner."),
      H(2526, 2542, "WWAM UP IN YA", "STOP PUSSYFOOTING AROUND, CHATGPT", "The hosts scold the model for giving a conditional answer and treat the prompt like a courtroom cross-examination."),
      H(2600, 2616, "SOUNDBYTE / REPLAY", "CHATGPT PICKS MICHAEL NINE OUT OF TEN", "After the push, the model finally says Michael Myers wins and explains why Arthur's tactics only delay the inevitable."),
      H(2642, 2658, "SOUNDBYTE / REPLAY", "SUGAR PLUM AI", "The bot's unexpectedly affectionate sign-off turns a horror matchup into a tiny new WWAM character bit."),
      H(2742, 2758, "TAKE GETS NUCLEAR", "THE TRAILER SHOWS THE WHOLE MOVIE", "A horror trailer is accused of revealing the date, the drink, the child, and the entire moral problem before the ticket is bought."),
      H(2862, 2878, "STRAIGHT TO STEVE'S ASSHOLE", "BLUMHOUSE KEEPS POLISHING THE SAME BALLS", "The room's crude production complaint is that the studio keeps sanding the same formula instead of making the weird movie promised."),
      H(3004, 3020, "DEEP DIVE", "PETER DINKLAGE IS THE TOXIC AVENGER", "The remake's central question is whether Dinklage remains the transformed monster or supplies only the voice after the toxic pool."),
      H(3068, 3084, "FAN SIGNAL", "KEVIN BACON AND ELIJAH WOOD JOIN THE CAST", "The supporting cast gives the movie a real reason to exist beyond the remake label."),
      H(3168, 3184, "TAKE GETS NUCLEAR", "THE FESTIVAL REVIEWS ARE LOUD", "The room is interested because festival audiences reportedly loved it, even while the poster and studio strategy still look suspect."),
      H(3284, 3300, "WWAM UP IN YA", "THE TOXIC AVENGER POSTER LOOKS LIKE SUICIDE SQUAD", "The marketing art gets accused of borrowing a familiar superhero silhouette before the room returns to the cast."),
      H(3388, 3404, "STRAIGHT TO STEVE'S ASSHOLE", "THE BILLION-DOLLAR RUMOR", "A rumored budget becomes a warning that no cult remake can survive if it needs a billion dollars just to break even."),
      H(3518, 3534, "DEEP DIVE", "DOCTOR STRANGE STILL HAS HORROR IN HIM", "The room wants Marvel to let Doctor Strange become a genuine horror movie instead of keeping the character on a leash."),
      H(3646, 3662, "TAKE GETS NUCLEAR", "DOOMSDAY IS THE ONE MARVEL PROJECT THEY WANT", "Robert Downey Jr.'s return is treated as a risky ship-repair job, but Doomsday still gets the rare honest anticipation."),
      H(3738, 3754, "DEEP DIVE", "ROBERT EGGERS ANNOUNCES THE WERWULF", "A new 13th-century werewolf film gets a title that sounds like a command to a dog and a production lane that might be genuinely strange."),
      H(3860, 3876, "WWAM UP IN YA", "WOOF IS A RIGHTS THING", "The room wonders if the bizarre title exists because somebody else owns the normal word werewolf."),
      H(3984, 4000, "SOUNDBYTE / REPLAY", "THE WOOF PRONUNCIATION COURT", "The hosts imagine correcting every person who says the title normally and immediately regret inventing the joke."),
      H(4214, 4230, "TAKE GETS NUCLEAR", "HALLOWEEN 3 GOT HONESTY; ENDS DID NOT", "The franchise comparison turns on promises: Halloween 3 had no Michael, while Ends was accused of hiding what kind of movie it was."),
      H(4290, 4306, "STRAIGHT TO STEVE'S ASSHOLE", "COREY PUT MICHAEL IN THE SEWER", "Corey Cunningham's attack is recalled as the image that made the room feel the franchise had put Michael Myers in a sewer pipe."),
      H(4352, 4368, "FAN SIGNAL", "THE REDDIT MICHAEL MEME", "A Halloween meme about Michael being invincible gets treated as both unfair and exactly right."),
      H(4444, 4460, "SOUNDBYTE / REPLAY", "THE MEDIEVAL WOLF ORACLE", "A faux-medieval wolf passage is read aloud until the host voice becomes a possessed storyteller."),
      H(4510, 4526, "WWAM UP IN YA", "THE WEREWULF SCRIPT TURNS PORNOGRAPHIC", "The generated curse, treasure, and beast language picks up enough sexual energy that the room has to stop pretending it is discussing dialect."),
      H(4662, 4678, "SOUNDBYTE / REPLAY", "AI IS BEYOND OUR MEANS", "The room admits it probably should not have access to a tool that can write an entire cursed werewolf story on demand."),
      H(4826, 4842, "FAN SIGNAL", "HOW LONG DOES HALLOWEEN ENDS STINK?", "John Bruce asks for a smell comparison, and the answer becomes a prison sentence versus a rotten state-prison franchise memory."),
      H(4920, 4936, "DEEP DIVE", "RESURRECTION WAS STATE PRISON", "Halloween Ends gets a measured dislike while Resurrection is reserved for the metaphorical facility nobody wants to revisit."),
      H(5098, 5114, "DEEP DIVE", "TRASH'S REVENGE REOPENS THE RETURN UNIVERSE", "The new Return of the Living Dead project gets its title, company, returning cast, and sequel-world premise explained."),
      H(5164, 5180, "ACCURACY / CONTEXT", "CGI RESURRECTION NEEDS A WARNING LABEL", "The room flags the uncomfortable plan to recreate late performers digitally as a news detail, not an endorsement or a settled production fact."),
      H(5288, 5304, "FAN SIGNAL", "THE FAM KEEPS THE NEWS DESK ALIVE", "The late superchat run proves the short room still has a community rhythm: questions, corrections, and one more franchise story."),
      H(5418, 5436, "SOUNDBYTE / REPLAY", "THE LAST WOOF", "The stream freezes at the perfect moment and exits with the accidental werewolf catchphrase that now owns the episode."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2400, end: 2660, label: "CHATGPT FINALLY PICKS MICHAEL", topic: "Michael Myers versus Arthur Morgan and the sassy answer", body: "Play from 40:00. The room turns a simple versus question into an AI pressure test, and the straight answer becomes the show's most memorable new bit.", playAt: 2400, playEnd: 2660 }),
      hated: Object.freeze({ at: 4200, end: 4380, label: "HALLOWEEN PROMISES AND HALLOWEEN ENDS", topic: "why Ends feels less honest than Halloween 3", body: "Play from 1:10:00. The anger is not only that the movie is different; it is that the marketing made the audience expect a different movie.", playAt: 4200, playEnd: 4380 }),
      wildestDetour: Object.freeze({ at: 3738, end: 4678, label: "WOOF THROUGH THE MEDIEVAL WOODS", topic: "Robert Eggers, dialect coaching, AI prose, and a wolf that sounds horny", body: "Play from 1:02:18. The title joke becomes a dialect lesson, a generated folktale, and a dirty little story nobody planned to tell.", playAt: 3738, playEnd: 4678 }),
      lastWord: Object.freeze({ at: 5098, end: 5436, label: "TRASH'S REVENGE AND THE LAST WOOF", topic: "Return of the Living Dead news, CGI questions, and the frozen sign-off", body: "Play from 1:25:00. The room closes the final news item, flags the uncomfortable CGI detail, thanks the FAM, and leaves on the sound of its accidental werewolf mascot.", playAt: 5098, playEnd: 5436 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-07",
    sources: Object.freeze(sources),
  });
})(window);
