(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "Tb-MdHt_NA4";
  var duration = 10796;
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

  /* July 28, 2024: the Comic-Con Special is a live newsroom with a filthy
     waiting room. It begins as a non-spoiler Deadpool and Wolverine victory
     lap, turns into a real-time Hall H watch party, and ends by arguing about
     whether Robert Downey Jr. returning as Doctor Doom is a bold new chapter
     or Marvel panic-buying its own past. */
  var highlights = [
    H(0, 180, "ROOM BREAK", "THE CRACK IN THE WALL GETS A LIGHT", "The broadcast opens while the camera is still being negotiated. A wall crack becomes a design problem, a prop, and the first joke before Hall H or Marvel can enter the room."),
    H(180, 360, "FILM READ", "DEADPOOL AND WOLVERINE GETS A NON-SPOILER 10", "The hosts refuse to spoil Tuesday's dedicated review but still make the verdict obvious: the cameos surprise them, the action feels like a 1990s comic, and the movie is already their favorite of the year."),
    H(360, 540, "TAKE GETS NUCLEAR", "THE ALPHA COP FAKE-MOVIE DREAM", "A Ryan Reynolds interview supplies an alternate history in which Marvel secretly markets a terrible buddy-cop movie, then reveals Deadpool and Wolverine ten minutes in. The room mourns the stunt it never got to see."),
    H(540, 720, "FILM READ", "THE CAMEOS ARE NOT THE WHOLE POINT", "The spoiler-safe read keeps landing on the same distinction: the cameos make this movie warmer and funnier, but the movie is not merely an advertisement for the next Marvel phase. It is allowed to exist for itself."),
    H(720, 900, "FAN SIGNAL", "HALL H IS FORTY-FIVE MINUTES AWAY", "The chat becomes a waiting room. One host predicts Galactus, X-Men, and a more adult Marvel; the other warns that Disney can still turn goodwill into a family dinner nobody wants to attend."),
    H(900, 1080, "CHARACTER PERFORMANCE", "LOOMIS, CHALLIS, AND THE FAM SING ON COMMAND", "Superchats ask Dr. Loomis and Dr. Challis to sing, and the room obliges with a deliberately broken birthday-song bit. It is a clean example of the community steering the cast of recurring voices.", ["Dr. Loomis", "Dr. Challis"]),
    H(1080, 1260, "NEWS REACTION", "JOKER 2 AND THE CROW GET THE SIDE-EYE", "The new Joker trailer is treated like a musical hiding behind a straight-faced campaign. The Crow clip gets a different suspicion: the lead barely speaks, so the audience cannot hear the performance they are being asked to trust."),
    H(1260, 1440, "WWAM UP IN YA", "CASSANDRA NOVA OPENS THE UNCOMFORTABLE DOOR", "A chat question about Cassandra Nova turns into a gross, overcommitted detour about attraction, powers, and the things a live room should probably not say at full volume. The public receipt keeps the shape, not the explicit anatomy."),
    H(1440, 1620, "NEWS REACTION", "THE THEATER PRE-ROLL PANIC", "A loud Deadpool and Wolverine social-media bumper makes one host fear the theater has lost the actual movie. The story becomes a perfect WWAM false alarm: the lights go down, the movie is there, and the panic was free."),
    H(1620, 1800, "STRAIGHT TO STEVE'S ASSHOLE", "PIRACY GETS CALLED 'LIBERATION'", "A confession about recording a movie is immediately dressed up as liberation from the man. The archive keeps the joke and the ethical mess separate: this is a bit in the room, not a recommendation."),
    H(1800, 1980, "CHARACTER PERFORMANCE", "A NINETEENTH-BIRTHDAY TRIFECTA", "A nineteen-year-old asks for Slenderman, Loomis, and Challis birthday wishes. The answer becomes a wildly inappropriate fake coming-of-age lecture before the characters remember they are supposed to say happy birthday.", ["Slenderman", "Dr. Loomis", "Dr. Challis"]),
    H(1980, 2160, "FAN SIGNAL", "THE BIRTHDAY MESSAGE TAKES A CHUCK E. CHEESE TURN", "The birthday door closes with a debate about spaghetti pizza, a bad food-review memory, and the kind of fan interaction that is affectionate precisely because it refuses to be normal."),
    H(2160, 2340, "FILM READ", "THE X-MEN TOP FIVE BECOMES A THERAPY SESSION", "Days of Future Past, Logan, X2, Deadpool and Wolverine, and First Class are ranked while divorce memories and Brian Singer caveats leak into the discussion. The list is really a map of what the hosts needed from the franchise."),
    H(2340, 2520, "FILM READ", "THE R-RATED COMEDY DEFENSE", "The hosts push back on complaints about CGI and plot. Their argument is specific: this is a violent, filthy buddy comedy that lets beloved characters be ridiculous, and it succeeds at that job before it serves any cinematic universe."),
    H(2520, 2700, "FAN SIGNAL", "THE MOVIE-THEATER ETIQUETTE COURT", "A respectful audience becomes part of the review. Matinees, phones, loud strangers, and the rare joy of leaving a screening desperate to go back all get folded into the Deadpool afterglow."),
    H(2700, 2880, "WWAM UP IN YA", "THE BRIGHTBURN BATHROOM WARP DRIVE", "A supposed Brightburn sequel detour turns out to be a bathroom story: a fart arrives with the timing of a spaceship launch. The crude story stays inside the moment as room chemistry, not medical advice."),
    H(2880, 3060, "STRAIGHT TO STEVE'S ASSHOLE", "THE SPOILER GUARDIAN GETS PARANOID", "A fan reveals a cameo in the chat and the hosts try to decide whether it is real, fake, or simply too late to matter. The larger target is the theatergoer who talks through the exit doors."),
    H(3060, 3240, "FAN SIGNAL", "THE HALLOWEEN 6 BLOCKBUSTER MEMORY", "A question about a Blockbuster display for Halloween 6 opens a nostalgia door to Hollywood Video, cover art, and the physical movie-store era. The hosts want the cardboard relic even though the internet refuses to produce a clean picture."),
    H(3240, 3420, "COMMUNITY DOOR", "THE TICKET PROMISE", "A fan says rent has to wait before seeing the movie. The room answers with a direct ticket offer and an email address, a small but memorable moment where the FAM becomes a person to help rather than an audience number."),
    H(3420, 3600, "GAMING DETOUR", "DEAD BY DAYLIGHT GOES TWO VERSUS EIGHT", "The stream detours into Dead by Daylight's temporary two-killers-versus-eight-survivors mode, then NCAA 25 frustration. The useful archive signal is how quickly a movie night can become a game-night argument without losing its pulse."),
    H(3600, 3780, "FILM READ", "TERMINATOR NEEDS TO BE SCARY AGAIN", "A fan prediction about John Cena as the next Terminator turns into a more serious diagnosis: the franchise should return to stalker horror, stop treating Judgment Day as an endless content mine, and leave Terminator 2's ending alone."),
    H(3780, 3960, "SOUNDBYTE / REPLAY", "THE PENGUIN TRAILER WALKS INTO THE ROOM", "The new Penguin trailer is played live. The first reaction is immediate: Colin Farrell is almost unrecognizable, the city feels seedy, and the series looks like a gangster drama wearing a comic-book coat."),
    H(3960, 4140, "FILM READ", "PENGUIN AS TONY SOPRANO'S DARK COUSIN", "The hosts compare the trailer's crime-world intimacy to The Sopranos while keeping the distinction clear. The appeal is not that Penguin is secretly good; it is that the audience may learn to care about a terrible man."),
    H(4140, 4320, "NEWS REACTION", "CAMERON, SPAWN, AND THE FRANCHISE RESCUE PLAN", "Terminator reboot talk leads to James Cameron, Fede Alvarez, Spawn, Ghost Rider, and the possibility of slasher video games. The room keeps asking which old property needs a horror-minded caretaker instead of another sequel factory."),
    H(4320, 4500, "GAMING DETOUR", "THE SLASHER-GAME WISH LIST", "Supermassive's Until Dawn becomes the model for a Scream, Halloween, Texas Chainsaw, Elm Street, or Hellraiser game. The hosts want replayable choices, not just another licensed skin in somebody else's online match."),
    H(4500, 4680, "FILM READ", "HOWARD STERN, PIRANHA, AND THE JAMES CAMERON ORIGIN STORY", "A chat question about Cameron's first film opens a compact origin story: a truck driver teaches himself from library books, lies his way onto Piranha II, gets fired, and keeps going until the industry has to take him seriously."),
    H(4680, 4860, "TAKE GETS NUCLEAR", "WHO COULD REPLACE RYAN REYNOLDS?", "Justin Long, Adam Brody, Jason Sudeikis, Sean William Scott, and Tom Hardy are offered as impossible Deadpool replacements. The conclusion is less a casting answer than a character fact: Ryan Reynolds and Deadpool are now welded together."),
    H(4860, 5040, "FILM READ", "SPIDER-MAN CAN BE RECAST; DEADPOOL CANNOT", "Tobey Maguire, Andrew Garfield, and Tom Holland become a rare recasting success story. The hosts argue that Spider-Man has a flexible center, while Deadpool's voice has become one actor's entire public silhouette."),
    H(5040, 5220, "NEWS REACTION", "CAPTAIN AMERICA, SIDEWINDER, AND THE 'DIET COKE' AVENGERS", "The Captain America: Brave New World trailer gets a cautious spirit-of-Winter-Soldier nod, followed by a long argument that Civil War was really an Avengers movie in Captain America packaging."),
    H(5220, 5400, "STRAIGHT TO STEVE'S ASSHOLE", "RED HULK ARRIVES WITH A HARRISON FORD IMPRESSION", "Harrison Ford's Red Hulk announcement gets the full WWAM treatment: old-dog jokes, General Ross context, and a blunt question about why Marvel has not given Hulk a proper solo movie since 2008."),
    H(5400, 5580, "TAKE GETS NUCLEAR", "THUNDERBOLTS ARE THE WRONG HAYMAKER", "The panel shifts to Thunderbolts and the hosts are not impressed by the timing. Their complaint is not that the characters cannot work; it is that Marvel needs a knockout punch after Deadpool and Wolverine, not another mid-tier holding pattern."),
    H(5580, 5760, "NEWS REACTION", "GUARDIANS WAS THE EXCEPTION, NOT THE FORMULA", "Guardians of the Galaxy becomes the cautionary tale: James Gunn and John Favreau made supposedly smaller characters feel enormous, but Marvel treated that miracle like a repeatable recipe for any underwritten team."),
    H(5760, 5940, "STRAIGHT TO STEVE'S ASSHOLE", "NINE HOURS IN HALL H FOR A NOTHING BURGER", "As the panel drags, the chat's excitement turns into a live roast. Six thousand people may be waiting in Hall H, but online the first wave is Thunderbolts, and the room wants Marvel to prove it still knows what a bomb sounds like."),
    H(5940, 6120, "FILM READ", "FANTASTIC FOUR FIRST STEPS ENTERS THE FEED", "The Fantastic Four cast and title finally arrive. The hosts admit the family-centered 1950s look has a pulse, even while the words First Steps initially sound like a baby movie instead of the first family entering the MCU."),
    H(6120, 6300, "NEWS REACTION", "PEDRO PASCAL IS IN EVERYTHING", "Pedro Pascal as Reed Richards gets a mixed but fair read. The concern is not his talent; it is the feeling that the same handful of recognizable actors are being asked to carry every new franchise at once."),
    H(6300, 6480, "FILM READ", "THE FANTASTIC CAR AND THE WANDA-VISION DNA", "The Fantastic car, Matt Shakman, and the bright family aesthetic get a closer look. The hosts can see the appeal of a cheerful, period-styled Fantastic Four while still worrying about whether Marvel can balance sweetness with Victor Von Doom."),
    H(6480, 6660, "TAKE GETS NUCLEAR", "FIRST STEPS MEANS FIRST STEPS INTO THE MCU", "The title gets a second chance: maybe it is not about babies at all, but the family's first step into this universe. Franklin Richards and Jack Kirby lore briefly widen the door before the panel moves on."),
    H(6660, 6840, "FAN SIGNAL", "HALL H STILL HAS NO X-MEN", "The chat wants X-Men, Ghost Rider, Blade, Doctor Strange 3, and a real signal that Marvel remembers its heavy hitters. Fantastic Four is welcomed, but the missing mutant announcement hangs over every reaction."),
    H(6840, 7020, "NEWS REACTION", "SECRET WARS GETS A DATE", "The next Avengers movie is identified as Secret Wars, and the room immediately jumps to the Beyonder, the black suit, the TVA, and the possibility that the multiverse is finally being aimed at one large collision."),
    H(7020, 7200, "SOUNDBYTE / REPLAY", "THE PANEL'S LAST CALM BEFORE THE DOOM BOMB", "Before the biggest announcement, the stream sits in a strange lull: Russo Brothers, Secret Wars, Fantastic Four, and a lot of scrolling news feeds. The archive treats this as the inhale before the room explodes."),
    H(7200, 7380, "NEWS REACTION", "ROBERT DOWNEY JR. IS DOCTOR DOOM", "The reveal lands in real time. Robert Downey Jr. returns not as Tony Stark but as Doctor Doom, and the room's first response is a mix of shock, disbelief, and the immediate need to explain which universe could make it work."),
    H(7380, 7560, "TAKE GETS NUCLEAR", "THE EVIL TONY STARK THEORY BOARD", "The hosts sketch alternate realities: a Tony Stark who chose control instead of sacrifice, a Doom-world with its own Iron Man, and a variant that can be both familiar and fundamentally wrong."),
    H(7560, 7740, "FILM READ", "BOLD STORY OR DESPERATE RELEVANCE?", "A live poll frames the central argument. One side sees a gutsy actor-and-villain collision; the other sees Marvel running back to the same old faces because its new phase lost the map."),
    H(7740, 7920, "FAN SIGNAL", "THE FAM DECIDES IT IS ALMOST A TIE", "The poll hovers near 50/50 while the chat supplies theories about Victor Von Doom, Earth-616, and the next Avengers films. This is not a verdict; it is a community thinking out loud before the marketing has given them a plot."),
    H(7920, 8100, "TAKE GETS NUCLEAR", "THE WWE LEGENDS-RETURN ANALOGY", "Marvel's comeback is compared to a wrestling show bringing back Edge, Undertaker, Stone Cold, and The Rock. The analogy is crude but precise: nostalgia can restore oxygen, or it can announce that the company has run out of new stars."),
    H(8100, 8280, "FILM READ", "CREATIVE CONTROL IS THE DIFFERENCE", "Deadpool and Wolverine had Ryan Reynolds and Hugh Jackman driving the car. The room wonders whether Downey Jr. has the same control, or whether Marvel is simply paying a beloved former hero to carry a frightened studio forward."),
    H(8280, 8460, "FAN SIGNAL", "THE FAM DEMANDS THE X-MEN ACE", "The hosts keep returning to the same missing move: announce the X-Men. They want Marvel to stop hiding its best hand and build toward Avengers versus X-Men instead of asking Robert Downey Jr. to do every bit of heavy lifting."),
    H(8460, 8640, "NEWS REACTION", "THE POLL CALLS IT DESPERATE BY A HAIR", "The final poll lands almost perfectly split, with a narrow edge toward desperate relevance. The room is still excited to watch Doom; it simply refuses to pretend excitement and confidence are the same thing."),
    H(8640, 8820, "FILM READ", "DOES THE MULTIVERSE ERASE CONSEQUENCES?", "Logan and Endgame are used as emotional tests. If a character's death can be reversed by a variant, the hosts ask whether the original sacrifice still belongs to the audience or becomes a temporary marketing condition."),
    H(8820, 9000, "STRAIGHT TO STEVE'S ASSHOLE", "THE FLASH IS THE RECEIPT", "The Flash becomes the cautionary example: multiverse cameos can be exciting in a room and still feel like lazy writing when the story has no reason to exist beyond showing an old face."),
    H(9000, 9180, "TAKE GETS NUCLEAR", "KILL THE MULTIVERSE BABYSITTER", "The proposed cure is extreme but clear: let the multiverse have its party, then make one enormous story end it. The hosts want a single timeline again, with consequences that cannot be patched by another variant."),
    H(9180, 9360, "FILM READ", "SECRET WARS AS THE RESET BUTTON", "A fan theory about Secret Wars collapsing multiple worlds into one gives the conversation a possible shape. The hosts like the idea only if it is an ending with discipline, not an excuse to keep every door open forever."),
    H(9360, 9540, "FAN SIGNAL", "THE FAM ARGUES KANG INTO THE EXIT", "Kang defenders, recasting questions, and the Jonathan Majors fallout make the chat part of the news desk. The hosts separate the character's potential from the version Marvel actually put on screen."),
    H(9540, 9720, "COMMUNITY DOOR", "DEADPOOL LEAVES THE THEATER GLOWING", "A fan returns from the movie still physically excited, and the room treats that feeling as the cleanest review metric available: most releases do not make you want to buy another ticket immediately."),
    H(9720, 9900, "FILM READ", "TRUE ROMANCE, COBRA KAI, AND THE BATMAN 2 BET", "The closing movie talk wanders through True Romance, a rough Cobra Kai reaction, and cautious Batman 2 optimism. The Penguin trailer is the bridge between all three: character-first storytelling still works."),
    H(9900, 10080, "STRAIGHT TO STEVE'S ASSHOLE", "MARVEL'S WRITERS GET THE BLAME", "The strongest criticism is aimed at the writing room, not the existence of Doctor Doom. The hosts think Marvel kept mistaking recognizable IP for a story, and the audience finally stopped rewarding the shortcut."),
    H(10080, 10260, "FAN SIGNAL", "THE SUBWAY SLENDERMAN CALLBACK", "Trish remembers a favorite Slenderman Subway sketch. The callback proves the character lane has its own memory: a one-off joke can become a comfort watch for someone who has been around since before Halloween 2018."),
    H(10260, 10440, "FILM READ", "DO WE GET DEADPOOL FOUR?", "Ryan Reynolds's reluctance becomes a discussion about creative control, family time, and the difference between a cameo at the end of a great Avengers movie and another full production that drains the character's goodwill."),
    H(10440, 10620, "SOUNDBYTE / REPLAY", "EDGAR WRIGHT'S RUNNING MAN SIDE DOOR", "The Running Man remake, Edgar Wright, and the Stephen King novel create one final pop-culture side door. It is exactly the kind of late-show tangent that makes a live Comic-Con feed feel less like a press release."),
    H(10620, 10796, "CLOSING READ", "SID'S TOYS, THE MULTIVERSE, AND GOODNIGHT", "The sign-off compares Deadpool and Wolverine to the MCU's toys after they have been stolen by Sid, taken to Goodwill, and introduced to the liquor cabinet. The hosts promise Tuesday's spoiler room, then leave the FAM with one last filthy laugh."),
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the July 28, 2024 Comic-Con Special",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 5264,
      captionEvents: 10528,
      captionSpanSeconds: 10794.159,
      captionDurationCoveragePercent: 99.98,
      captionSha256: "5986236b7d76f6181b6a63589d0c086c9bf1ebf0b7355d3591b8dfad2b5fba25",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio playback spot-check; playback remains the authority",
      audioSha256: "5b1c35cc784770d0972599ca1cdb4735675ba92d38a11cd2c8061251c425751e",
      asrWindowCount: 60,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "WEDNESDAY LIVE // JULY 28, 2024",
    badge: "FULL SHOW WIKI // COMIC-CON, DEADPOOL, HALL H, DOOM, AND THE MULTIVERSE",
    headline: "HALL H, DOOM, AND THE MARVEL COMEBACK ARGUMENT",
    deck: "A three-hour Comic-Con waiting room that starts with a spoiler-safe Deadpool victory lap, becomes a live newsroom for Hall H, and ends with the FAM debating whether Robert Downey Jr.'s Doctor Doom is a bold reset or a panic button.",
    overview: "The Comic-Con Special is what happens when a movie-loving livestream has to wait for the news to catch up. It begins with a camera, a wall crack, a day-trader joke, and a promise not to spoil Tuesday's Deadpool and Wolverine autopsy. That promise still leaves room for a real read: the movie's cameos surprise the hosts, its action feels like the 1990s comic they grew up on, and its R-rated comedy is allowed to exist without apologizing to the next phase. The room keeps the FAM busy with birthday requests, Loomis and Challis songs, a Halloween 6 Blockbuster memory, and a ticket offer to a fan who cannot afford the theater yet. Between those doors, the broadcast turns into a news desk: Joker 2, The Crow, Terminator, The Penguin, slasher games, Captain America, Thunderbolts, and Fantastic Four all pass through. Then Hall H announces Avengers: Secret Wars and Robert Downey Jr. as Doctor Doom. The final hour is not a simple cheer. It is a genuinely useful argument about actor nostalgia, creative control, multiverse fatigue, and whether Marvel is making a daring villain choice or bringing back a legend because the newer phase stalled. The FAM poll lands almost perfectly down the middle. The last word belongs to the community and the recurring characters: a Slenderman Subway callback, a promise of Tuesday's spoiler show, and a Toy Story metaphor for an MCU that may need to clean out its own liquor cabinet.",
    topics: Object.freeze(["Deadpool & Wolverine", "Marvel", "Comic-Con", "The Penguin", "Terminator", "Fantastic Four", "Doctor Doom", "Secret Wars", "Multiverse", "Video Games", "Halloween", "FAM"]),
    story: Object.freeze([
      { at: 0, end: 1800, label: "THE SPOILER-SAFE ROOM OPENS", body: "A cracked wall, a Deadpool and Wolverine victory lap, fan song requests, trailer gossip, and a theater panic set the live room before Hall H becomes the night's real guest." },
      { at: 1800, end: 3600, label: "THE FAM, THE X-MEN, AND THE SIDE ROADS", body: "Birthday characters, X-Men rankings, movie-theater etiquette, a bathroom detour, Halloween 6 nostalgia, ticket help, and Dead by Daylight give the waiting room its community shape." },
      { at: 3600, end: 5400, label: "PENGUIN, TERMINATOR, AND THE HORROR BRAIN", body: "The stream asks for a scary Terminator again, falls into The Penguin's gangster gravity, and imagines Scream, Halloween, and Ghost Rider games with actual choices." },
      { at: 5400, end: 7200, label: "THE HALL H WAITING ROOM", body: "Thunderbolts receives a live roast while Fantastic Four arrives in a 1950s family package. The hosts want X-Men, Galactus, and a reason to believe Marvel still has a heavy hitter in reserve." },
      { at: 7200, end: 9000, label: "THE DOOM BOMB AND THE WRESTLING COMEBACK", body: "Robert Downey Jr. is announced as Doctor Doom. Shock becomes theory, theory becomes a WWE legends-return analogy, and the chat tries to decide whether the move is brilliant or desperate." },
      { at: 9000, end: 10260, label: "THE MULTIVERSE GETS PUT ON TRIAL", body: "The room debates whether variants erase consequence, whether Secret Wars can consolidate the timelines, and whether Kang's exit is a writing failure or the only honest repair left." },
      { at: 10260, end: 10620, label: "THE NEXT SHOW IS ALREADY PROMISED", body: "Deadpool 4, Ryan Reynolds's creative-control problem, and Edgar Wright's Running Man side door keep the news alive after Hall H has gone quiet." },
      { at: 10620, end: 10796, label: "SID'S TOYS GO HOME", body: "A Toy Story metaphor, a Slenderman callback, a final FAM goodbye, and Tuesday's spoiler promise close a broadcast that was never just a panel recap." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 7200, end: 7380, label: "ROBERT DOWNEY JR. AS DOCTOR DOOM", topic: "the Hall H reveal that turns the waiting room into a newsroom", body: "Play from 2:00:00. The announcement is the night's cleanest audio spike: shock, immediate alternate-universe theories, and the first honest question about whether Marvel earned the move.", playAt: 7200, playEnd: 7380 }),
      hated: Object.freeze({ at: 5760, end: 5940, label: "THE THUNDERBOLTS WAIT", topic: "Marvel needs a haymaker and keeps serving a holding pattern", body: "Play from 1:36:00. The hosts are not rejecting the characters; they are rejecting the timing and the feeling that Hall H is asking fans to celebrate a mid-card announcement.", playAt: 5760, playEnd: 5940 }),
      wildestDetour: Object.freeze({ at: 2700, end: 2880, label: "THE BRIGHTBURN BATHROOM WARP DRIVE", topic: "a live bathroom story becomes a sci-fi launch sequence", body: "Play from 45:00. The most unhinged side road is not a movie take at all; it is a bodily sound effect described with Enterprise-level seriousness.", playAt: 2700, playEnd: 2880 }),
      lastWord: Object.freeze({ at: 10620, end: 10796, label: "SID'S TOYS AND TUESDAY'S SPOILERS", topic: "the MCU gets a filthy Toy Story sign-off", body: "Play from 2:57:00. The stream ends by turning its own archive into a metaphor: familiar toys, a little booze, and a promise that Tuesday gets the real spoiler knife.", playAt: 10620, playEnd: 10796 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
