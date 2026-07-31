(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  function freezeItems(items) {
    return Object.freeze(
      items.map(function (item) {
        return Object.freeze(item);
      }),
    );
  }

  var story = freezeItems([
    {
      at: 0,
      end: 359,
      label: "GLAMOSAURUS ESCAPES A YARD SALE & JAY CLOCKS IN",
      body:
        "A five-dollar dinosaur enters with suspicious anatomy, neighborhood shame and a warning about one woman's army of St. Patrick's gnomes. Jay arrives late after puppy combat, meets the new mascot and helps establish that prehistoric life was apparently much gayer than museums admit.",
    },
    {
      at: 360,
      end: 599,
      label: "THE EIGHT-WEEK-OLD PUPPY OPENS A BITE CLINIC",
      body:
        "The new dog is adorable, exhausting and made almost entirely of teeth. Training, neutering, coyotes and white people adopting bears turn routine puppy talk into a wildlife hearing nobody requested.",
    },
    {
      at: 600,
      end: 959,
      label: "ACHILLES GETS CASTING COURT; PARIS GETS TROY PROSECUTED",
      body:
        "Reported casting chatter around Helen of Troy and Achilles becomes a physical-fit argument, not a racial one. Brad Pitt's age and alleged chemical assistance lead into a gloriously filthy Troy recap where Paris starts a war and Hector has to save his useless ass.",
    },
    {
      at: 960,
      end: 1199,
      label: "A VIRAL COFFEE DATE MEETS INTERNET COURT",
      body:
        "The hosts react to a woman's public account of a date with a baseball player, criticize his alleged corny sex talk and her decision to identify him online, then watch the comment section attack everybody. The account remains an online story, not a verified case file.",
    },
    {
      at: 1200,
      end: 1379,
      label: "THE SHINING BEATS A GREAT SIXTEEN SEED",
      body:
        "The bracket formally opens with The Shining against Stir of Echoes. Both choose Kubrick while making an unusually strong case for the underdog as grounded, endlessly rewatchable and possibly better than The Sixth Sense. The audience sends The Shining through, 81 to 19.",
    },
    {
      at: 1380,
      end: 1619,
      label: "SILENCE WALKS PAST THE FOG; CHALLIS GETS NAME-CHECKED",
      body:
        "The Silence of the Lambs advances without needing a full poll. The Fog is called good but overrated, Tom Atkins gets his flowers, and Carpenter's tendency to lose steam late becomes the real argument. Challis is discussed here; he is not yet performing.",
    },
    {
      at: 1620,
      end: 1919,
      label: "RE-ANIMATOR SURVIVES EVENT HORIZON",
      body:
        "Space-horror grandeur, Sam Neill and a Dead Space connection face Herbert West, green serum and gruesome comedy. Re-Animator wins 59 to 41. Reports about removed Event Horizon footage are treated as tantalizing production lore, not recovered evidence.",
    },
    {
      at: 1920,
      end: 2399,
      label: "RETURN OF THE LIVING DEAD WINS; THE ROOM ADMITS IT CRIES",
      body:
        "The Sixth Sense's emotional ending faces punk-rock zombie originality. Return of the Living Dead wins 59 to 41, but the memorable part is two friends admitting which movies break them, why shared pain changes the reaction and how garage beers once became promises to reset their lives.",
    },
    {
      at: 2400,
      end: 2999,
      label: "THE LOST BOYS BEATS ARNOLD & THE SAX MAN LOSES A ROAD TRIP",
      body:
        "A donation-link fumble becomes genital typing. The Lost Boys then beats End of Days while a proposed pilgrimage to see the shirtless saxophonist tears the room apart. New Found Glory, Arnold's blender breakfast and a Corey Feldman Wolf Pack performance all squeeze into the ruling.",
    },
    {
      at: 3000,
      end: 3539,
      label: "FROM DUSK TILL DAWN EATS THE BLOB & GETS A FULL COMMENTARY",
      body:
        "From Dusk Till Dawn advances over The Blob after inspiring an accidental full-film review: George Clooney's tattoo, Harvey Keitel's authority, Tarantino's toe clause, a retainer, Richie Gecko's delusions and the Titty Twister all receive more trial time than the actual matchup.",
    },
    {
      at: 3540,
      end: 3899,
      label: "FRIGHT NIGHT BEATS IT, PRACTICAL MAKEUP BEATS CGI",
      body:
        "Tim Curry's television Pennywise is honored, Bill Skarsgård's performance is defended and the newer film's digital embellishment gets blamed for widening the gap. A giant projector scare revives a theater panic attack before Fright Night wins 60 to 40.",
    },
    {
      at: 3900,
      end: 4319,
      label: "PUMPKINHEAD PULLS THE FIRST REAL UPSET",
      body:
        "Arachnophobia's blockbuster craft, Jeff Daniels and cereal-box terror meet Pumpkinhead's gothic curse, Lance Henriksen and Stan Winston creature work. Passion turns one defense into a bus-stop meth sermon. Pumpkinhead wins, then John Candy and John Goodman require emergency separation.",
    },
    {
      at: 4320,
      end: 4739,
      label: "THE THING ENDS MOUTH OF MADNESS; THE PEOPLE TAKE THE STAIRS",
      body:
        "The Thing overwhelms In the Mouth of Madness before a poll is worth posting. Carpenter's paranoia, Antarctic comfort and perfect ending get a serious defense. The People Under the Stairs then advances over The Prowler while the hosts explain why Craven's strangest house still matters.",
    },
    {
      at: 4740,
      end: 5149,
      label: "ROACH ORDERS ARBY'S; BUFFY MAY OR MAY NOT FLIRT",
      body:
        "A convention memory finds Roach discussing roast beef, escaping his own walls and looking uncomfortable at an afterparty. That unlocks the disputed story of a bar conversation with Kristy Swanson, a promised return and the ride home that may have killed history.",
    },
    {
      at: 5150,
      end: 5399,
      label: "THEY LIVE BEATS THE FACULTY & PIPER GETS HIS FLOWERS",
      body:
        "They Live's abandoned-feeling final act faces The Faculty's badly aged effects, but Carpenter still wins 62 to 38. The alley fight, political premise and Roddy Piper's sweet commentary presence build a convincing case that wrestling's action-movie pioneer deserved a larger career.",
    },
    {
      at: 5400,
      end: 5699,
      label: "PET SEMATARY BURIES THE BLAIR WITCH",
      body:
        "Blair Witch wins the marketing argument and the memory of entering a theater genuinely afraid. Pet Sematary wins everything meaner: grief, Gage, Zelda, the Ramones and a father making the worst possible choice for understandable reasons. The vote lands 70 to 30.",
    },
    {
      at: 5700,
      end: 6059,
      label: "POLTERGEIST & THE CROW CRUSH THEIR FIFTEEN SEEDS",
      body:
        "Poltergeist sends Urban Legend home despite affection for its shameless Scream-era fun. The Crow then beats Sleepaway Camp while immediately opening a larger question: supernatural horror, superhero tragedy or a steroid entrant in the wrong tournament?",
    },
    {
      at: 6060,
      end: 6419,
      label: "TREMORS STOPS THE EIGHTIES CLEAN SWEEP",
      body:
        "Killer Klowns brings cotton candy and creature design; Tremors brings Kevin Bacon, Earl, Reba, blue-collar chemistry and a desert that feels lived in. The audience advances Tremors, giving the 1990s its only win on that side and inspiring a better game pitch than the real Klowns release.",
    },
    {
      at: 6420,
      end: 6659,
      label: "CANDYMAN EDGES THE FLY; THE BRACKET GETS A SECOND NIGHT",
      body:
        "Tony Todd, Philip Glass and tragic urban legend face Jeff Goldblum's physical collapse and revolting practical effects. Candyman barely wins a buzzer-beater vote. With the clock bleeding out, the hosts decide to reach the Elite Eight and finish the tournament Wednesday.",
    },
    {
      at: 6660,
      end: 6909,
      label: "THE SHINING & SILENCE HOLD THEIR ONE-SEED GROUND",
      body:
        "The Shining dispatches Re-Animator on framing, Nicholson and discoveries hidden inside repeat watches. The Silence of the Lambs then beats Return of the Living Dead 66 to 34 as Anthony Hopkins's stillness, manipulation and horrifying courtesy take over the room.",
    },
    {
      at: 6910,
      end: 7199,
      label: "THE LOST BOYS & DUSK WIN THE VAMPIRE CIVIL WARS",
      body:
        "The Lost Boys beats Fright Night on mood, soundtrack and generational attachment. From Dusk Till Dawn then defeats Pumpkinhead 63 to 38. One host stays loyal to Lance Henriksen's cursed field; the other chooses the movie he could watch three times a week.",
    },
    {
      at: 7200,
      end: 7499,
      label: "THE THING LIVES; PET SEMATARY BREAKS THE HOUSE",
      body:
        "The Thing beats They Live 77 to 23 because Carpenter sustains it from first frame to last. Pet Sematary then demolishes The People Under the Stairs, horrifying one host enough to wish for a nonexistent panel veto.",
    },
    {
      at: 7500,
      end: 7739,
      label: "POLTERGEIST & TREMORS GO TO OVERTIME",
      body:
        "A claim that Poltergeist II is better wounds the room before Poltergeist and Tremors finish dead even. Horror eligibility gets relitigated, a rapid revote opens and Poltergeist finally advances 60 to 40. Democracy survives, but only after checking under the bed.",
    },
    {
      at: 7740,
      end: 8039,
      label: "CANDYMAN EJECTS THE CROW & THE ELITE EIGHT LOCKS",
      body:
        "The audience removes The Crow from the board, possibly because it was too powerful or possibly because it never belonged. The Elite Eight becomes Shining/Lost Boys, Thing/Poltergeist, Silence/Dusk and Pet Sematary/Candyman. Championship guesses split between The Lost Boys and The Shining.",
    },
    {
      at: 8040,
      end: 8399,
      label: "THE MAILBAG OPENS WITH ALIENS, NEIGHBORS & OBSESSION",
      body:
        "A bathroom break leaves one host with Resident Evil questions, mysterious neighbor noises and a promised future alien show. The full room returns to choose Obsession over Weapons, then discovers Ernest could theoretically defeat Pennywise with a dance and one deeply unfortunate kiss.",
    },
    {
      at: 8400,
      end: 8759,
      label: "PUNISHER KILLS THE LOST BOYS; SPIDER-MAN GETS GOTHAM",
      body:
        "Viewer matchups send Punisher through Santa Carla, John Wick into the T-1000 and Spider-Man into Batman's rogues gallery. Halloween battles Nightmare, Michael meets Joker and a final franchise choice favors a Raimi/Tobey return over another original-cast X-Men film.",
    },
    {
      at: 8760,
      end: 8950,
      label: "LOOMIS & CHALLIS TURN APPLEBEE'S INTO MEDICAL COURT",
      body:
        "Loomis calls disrespectful remakes a shit sandwich, rejects a belt-based bathroom scenario and prosecutes an alleged toilet invasion. Challis denies an affair by claiming he counted a woman's rings, then recommends Loomis's plush toilet seat for the prostate and the germs.",
    },
    {
      at: 8951,
      end: 9239,
      label: "GLAMOSAURUS GETS THE MASCOT JOB; GAGE GETS A BIRTHDAY",
      body:
        "Mortal Kombat puts a viewer to sleep, Glamosaurus auditions as the channel's proudly gay prehistoric mascot and a fan named Gage gets a Pet Sematary birthday roast plus genuine affection. A reported Grave Encounters reboot prompts equal parts skepticism and shameless Justin Long campaigning.",
    },
    {
      at: 9240,
      end: 9699,
      label: "THE RECORD SHELF, TARANTINO'S FEET & THREE ROLE-PLAY ANSWERS",
      body:
        "Nirvana and Eminem top a fan's collection before Tarantino gets assigned Hellraiser. Slenderman provides emergency underwear advice, Loomis describes the world's shortest bedroom performance and Mark Wahlberg recommends a roller coaster. Loomis then rejects tacos because his hemorrhoids already have Halloween II eyes.",
    },
    {
      at: 9700,
      end: 10019,
      label: "THE PUPPY BECOMES A POSSESSED LITTLE CRIMINAL",
      body:
        "Viewer trivia and reboot chatter give way to the night's truest horror: an eight-week-old dog testing every boundary, eating rabbit poop, humping an arm and looking angelic only while unconscious. Returning him is a joke; being completely owned by him is not.",
    },
    {
      at: 10020,
      end: 10299,
      label: "SEAGAL GETS A COMEBACK; LOOMIS GETS A COWORKER",
      body:
        "A live-action Kung Fu Panda pitch revives hopes for a leaner Steven Seagal, Halloween skits receive a real on-air promise and an ugly celebrity hypothetical is handled as opinion rather than fact. Loomis finally roasts a coworker named Alex using only a name and a smell-based diagnosis.",
    },
    {
      at: 10300,
      end: 10486,
      label: "THE AUDIENCE GETS THE LAST WORD; INDY GETS A BEDTIME",
      body:
        "The hosts thank more than three hundred live viewers, explain how support can keep future streams ad-free and call the audience's questions the best part of the show. A puppy schedule, a Michael Jackson joke and one final medical cure close the tape with Wednesday promised.",
    },
  ]);

  var highlights = freezeItems([
    {
      at: 0,
      end: 63,
      category: "WWAM UP IN YA",
      label: "THE FIVE-DOLLAR GLAMOSAURUS",
      excerpt:
        "A yard-sale dinosaur arrives with a bargain price, a glamorous new name and anatomy the manufacturer probably did not submit to a focus group.",
    },
    {
      at: 64,
      end: 149,
      category: "THE ROOM BREAKS",
      label: "DINOSAUR ANATOMY GETS FORENSIC",
      excerpt:
        "The toy's shape creates a prehistoric sex-ed lecture that instantly proves this stream cannot be played in an office.",
    },
    {
      at: 150,
      end: 239,
      category: "CREATOR MEMORY",
      label: "THE YARD-SALE GNOME STANDOFF",
      excerpt:
        "A stranger judges the dinosaur purchase and gets countercharged with possessing thirty-seven St. Patrick's gnomes.",
    },
    {
      at: 240,
      end: 359,
      category: "THE ROOM BREAKS",
      label: "JAY MEETS THE GAY DINOSAUR",
      excerpt:
        "The late arrival receives no orientation, only an aggressively glamorous fossil and several questions paleontology has refused to answer.",
    },
    {
      at: 360,
      end: 469,
      category: "CREATOR MEMORY",
      label: "EIGHT WEEKS OLD, SIX HUNDRED TEETH",
      excerpt:
        "The new puppy is loved without reservation and trusted with absolutely nothing that can fit inside a mouth.",
    },
    {
      at: 470,
      end: 599,
      category: "WWAM UP IN YA",
      label: "WHITE PEOPLE ADOPT A BEAR",
      excerpt:
        "Training talk escalates through coyotes, neutering and the very specific confidence required to bring a bear into a suburban house.",
    },
    {
      at: 600,
      end: 719,
      category: "CLAIM CHECK",
      label: "HELEN & ACHILLES ENTER RUMOR COURT",
      excerpt:
        "Reported casting chatter is debated as rumor. The objection centers on Achilles's physical presence, not a verified contract or production decision.",
    },
    {
      at: 720,
      end: 839,
      category: "MOVIE COURT",
      label: "BRAD PITT'S FORTY-TWO-YEAR-OLD ACHILLES",
      excerpt:
        "Troy's hero becomes an age, muscle and steroid argument in which admiration survives every wildly unlicensed medical conclusion.",
    },
    {
      at: 840,
      end: 959,
      category: "WWAM UP IN YA",
      label: "PARIS STARTS A WAR; HECTOR GETS THE BILL",
      excerpt:
        "Orlando Bloom's Paris is retried for stealing Helen, hiding behind Eric Bana and making an entire city pay for his erection.",
    },
    {
      at: 960,
      end: 1079,
      category: "CLAIM CHECK",
      label: "THE VIRAL COFFEE DATE",
      excerpt:
        "The hosts react to one person's public account of a baseball date. The identities, private conversation and motives are not independently established here.",
    },
    {
      at: 1080,
      end: 1139,
      category: "THE ROOM BREAKS",
      label: "THE ERA BECOMES CHARACTER EVIDENCE",
      excerpt:
        "Internet commenters answer an awkward dating story by reviewing the pitcher's earned-run average, because online court has no jurisdictional limits.",
    },
    {
      at: 1140,
      end: 1199,
      category: "BRACKET DESK",
      label: "THE MEGA-FRANCHISES ARE BENCHED",
      excerpt:
        "Halloween, Scream, Friday the 13th and Nightmare are excluded so four enormous brands do not eat another tournament whole.",
    },
    {
      at: 1200,
      end: 1309,
      category: "MOVIE COURT",
      label: "STIR OF ECHOES GETS THE SIXTEEN-SEED DEFENSE",
      excerpt:
        "Kevin Bacon's grounded ghost story is praised as rewatchable, emotionally direct and at least competitive with The Sixth Sense.",
    },
    {
      at: 1310,
      end: 1379,
      category: "BRACKET RESULT",
      label: "THE SHINING ADVANCES, 81 TO 19",
      excerpt:
        "Kubrick wins comfortably, but the underdog leaves with more dignity than most first-round sacrifices receive.",
    },
    {
      at: 1380,
      end: 1469,
      category: "BRACKET RESULT",
      label: "SILENCE WALKS PAST THE FOG",
      excerpt:
        "The Silence of the Lambs advances without a formal poll while The Fog is called good, attractive and more revered than its full runtime earns.",
    },
    {
      at: 1470,
      end: 1619,
      category: "CREATOR DNA",
      label: "CARPENTER'S THIRD-ACT ROPE DROP",
      excerpt:
        "A loving Carpenter critique argues that several terrific setups lose urgency late, with The Fog serving as the prosecution's current exhibit.",
    },
    {
      at: 1620,
      end: 1749,
      category: "MOVIE COURT",
      label: "EVENT HORIZON IS THE SHINING IN SPACE",
      excerpt:
        "Sam Neill, Laurence Fishburne, Hell beyond the stars and a Dead Space connection make the ten seed a legitimate threat.",
    },
    {
      at: 1750,
      end: 1829,
      category: "MOVIE COURT",
      label: "HERBERT WEST BRINGS THE GREEN SERUM",
      excerpt:
        "Re-Animator counters with Jeffrey Combs, gleeful blasphemy and the rare horror-comedy tone that never apologizes for the corpse pile.",
    },
    {
      at: 1830,
      end: 1919,
      category: "CLAIM CHECK",
      label: "THE LOST EVENT HORIZON CUT",
      excerpt:
        "Removed footage is described as damaged or lost after poor storage. The story is production lore repeated live, not a recovered-cut announcement.",
    },
    {
      at: 1920,
      end: 2039,
      category: "THE ROOM GETS REAL",
      label: "THE SIXTH SENSE ENDING STILL HURTS",
      excerpt:
        "A bracket pick turns into an honest admission that the ending lands as grief, love and delayed understanding rather than a mere twist.",
    },
    {
      at: 2040,
      end: 2159,
      category: "MOVIE COURT",
      label: "RETURN OF THE LIVING DEAD STAYS PUNK ROCK",
      excerpt:
        "The zombie film wins love for being funny, nasty, musically specific and impossible to confuse with the rest of the genre.",
    },
    {
      at: 2160,
      end: 2279,
      category: "THE ROOM GETS REAL",
      label: "SOUTHPAW, CREED & THE MOVIES THAT OPEN THE VALVE",
      excerpt:
        "Both hosts admit which films make them cry and why a shared history can turn an ordinary scene into a body shot.",
    },
    {
      at: 2280,
      end: 2399,
      category: "CREATOR MEMORY",
      label: "GARAGE BEERS & THE GREAT LIFE RESET",
      excerpt:
        "A funny crying confession becomes a memory of drinking in the garage, naming everything wrong and promising that tomorrow would finally be different.",
    },
    {
      at: 2400,
      end: 2489,
      category: "WWAM UP IN YA",
      label: "STREAM ELEMENTS, TYPED WITH BALLS",
      excerpt:
        "A routine donation-link reminder becomes an ASMR keyboard performance allegedly completed with equipment nowhere near the hands.",
    },
    {
      at: 2490,
      end: 2609,
      category: "MOVIE COURT",
      label: "THE LOST BOYS SENDS END OF DAYS HOME",
      excerpt:
        "Arnold fighting Satan earns affection, but Santa Carla, Kiefer Sutherland and the shirtless saxophone are simply too much vampire movie.",
    },
    {
      at: 2610,
      end: 2709,
      category: "CREATOR MEMORY",
      label: "THE SHIRTLESS SAXOPHONE ROAD TRIP THAT DIED",
      excerpt:
        "One host planned a three-hour drive, a yacht club and drinks with the Lost Boys sax man. Three sensible people refused history.",
    },
    {
      at: 2710,
      end: 2799,
      category: "CREATOR MEMORY",
      label: "NEW FOUND GLORY, PARTY OF ONE",
      excerpt:
        "A favorite band played nearby, everybody else found plans and the abandoned concertgoer receives exactly zero sympathy.",
    },
    {
      at: 2800,
      end: 2879,
      category: "WWAM UP IN YA",
      label: "ARNOLD'S PIZZA-PEPTO-WHISKEY BREAKFAST",
      excerpt:
        "End of Days earns points for a suicidal hero beginning the morning with a blender full of leftovers, medicine and alcohol.",
    },
    {
      at: 2880,
      end: 2939,
      category: "CHARACTER PERFORMANCE",
      label: "COREY FELDMAN ENTERS THE WOLF PACK",
      excerpt:
        "A direct Feldman setup receives an immediate Wolf Pack, real-time and comeback-era parody that goes considerably deeper than the matchup required.",
      characters: Object.freeze(["Corey Feldman"]),
    },
    {
      at: 2940,
      end: 2999,
      category: "MOVIE MEMORY",
      label: "THE OTHER COREY WINS THE LOST BOYS ARGUMENT",
      excerpt:
        "Corey Haim, the Frog Brothers and a mangled vampire quote restore the actual movie after the Wolf Pack leaves the room sticky.",
    },
    {
      at: 3000,
      end: 3119,
      category: "MOVIE COURT",
      label: "DUSK TILL DAWN ENTERS THE TITTY TWISTER",
      excerpt:
        "Bank robbers, hot vampires, Robert Rodriguez and George Clooney's tribal tattoo overwhelm The Blob before the poll can develop a personality.",
    },
    {
      at: 3120,
      end: 3239,
      category: "CREATOR MEMORY",
      label: "THE TATTOO THAT ALMOST HAPPENED",
      excerpt:
        "Seth Gecko's neck-and-arm design once looked like a complete life plan until the prospective recipient remembered his own body.",
    },
    {
      at: 3240,
      end: 3359,
      category: "WWAM UP IN YA",
      label: "TARANTINO WRITES HIMSELF THE TOE",
      excerpt:
        "Salma Hayek's foot scene is reconsidered as the most suspiciously specific employee benefit in screenwriting history.",
    },
    {
      at: 3360,
      end: 3479,
      category: "MOVIE MEMORY",
      label: "RICHIE REMOVES THE RETAINER",
      excerpt:
        "The imaginary seduction becomes even filthier when the retainer comes out, the spit follows and everyone remembers why Richie needed punching.",
    },
    {
      at: 3480,
      end: 3539,
      category: "MOVIE MEMORY",
      label: "HARVEY KEITEL WINS WITH ONE DRINK",
      excerpt:
        "The hostage and the outlaw briefly recognize each other's authority, a tiny writing beat that keeps the movie human inside the vampire bar.",
    },
    {
      at: 3540,
      end: 3659,
      category: "MOVIE COURT",
      label: "FRIGHT NIGHT FACES TELEVISION PENNYWISE",
      excerpt:
        "Fright Night's vampire joy and transformation effects meet the childhood power of Tim Curry and Jonathan Brandis.",
    },
    {
      at: 3660,
      end: 3779,
      category: "STRAIGHT TO STEVE'S ASSHOLE",
      label: "PENNYWISE'S CGI EATS THE PERFORMANCE",
      excerpt:
        "Bill Skarsgård is defended as talented enough to work without digital overstatement; the extra face work is blamed for putting distance between actor and audience.",
    },
    {
      at: 3780,
      end: 3839,
      category: "CREATOR MEMORY",
      label: "THE PROJECTOR SCARE CURLS TOES",
      excerpt:
        "The giant Pennywise sequence revives a theater panic attack so intense that leaving the room briefly became the only available review.",
    },
    {
      at: 3840,
      end: 3899,
      category: "BRACKET RESULT",
      label: "FRIGHT NIGHT ADVANCES, 60 TO 40",
      excerpt:
        "The vampire classic wins a closer vote than expected, suggesting 1990s kids still carry that television miniseries in their bones.",
    },
    {
      at: 3900,
      end: 4019,
      category: "MOVIE COURT",
      label: "PUMPKINHEAD GETS A TWELVE-SEED OBJECTION",
      excerpt:
        "The placement itself becomes an insult case before Lance Henriksen, Stan Winston and a gothic revenge curse even reach the stand.",
    },
    {
      at: 4020,
      end: 4139,
      category: "MOVIE COURT",
      label: "ARACHNOPHOBIA PUTS SPIDERS IN THE CEREAL",
      excerpt:
        "Spielbergian polish, Jeff Daniels, John Goodman and domestic terror make the spider movie scary, funny and almost impossible to watch barefoot.",
    },
    {
      at: 4140,
      end: 4209,
      category: "THE ROOM BREAKS",
      label: "THE PUMPKINHEAD METH SERMON",
      excerpt:
        "A passionate curse explanation gets compared with a shirtless man at a bus stop arguing with the wind.",
    },
    {
      at: 4210,
      end: 4319,
      category: "BRACKET RESULT",
      label: "PUMPKINHEAD PULLS THE UPSET",
      excerpt:
        "The first major underdog wins, followed by an emergency correction because John Goodman is not John Candy no matter how excited the bracket gets.",
    },
    {
      at: 4320,
      end: 4439,
      category: "BRACKET RESULT",
      label: "THE THING FORCES A THROW-IN-THE-TOWEL",
      excerpt:
        "In the Mouth of Madness receives respect and no realistic path past Carpenter's Antarctic masterpiece.",
    },
    {
      at: 4440,
      end: 4559,
      category: "MOVIE COURT",
      label: "PARANOIA BECOMES THE THING'S BEST CHARACTER",
      excerpt:
        "The film's real monster is the feeling that nobody trusts anybody, a social condition the hosts say has aged better than civilization.",
    },
    {
      at: 4560,
      end: 4619,
      category: "THE ROOM BREAKS",
      label: "AARON RODGERS INTERRUPTS ANTARCTICA",
      excerpt:
        "A quarterback alert crashes directly into a Kurt Russell discussion and gets confused with an entirely different former Packers scandal.",
    },
    {
      at: 4620,
      end: 4739,
      category: "BRACKET RESULT",
      label: "THE PEOPLE UNDER THE STAIRS BEATS THE PROWLER",
      excerpt:
        "Craven's social nightmare advances while the underrated slasher receives a respectful salute before leaving the house.",
    },
    {
      at: 4740,
      end: 4859,
      category: "CREATOR MEMORY",
      label: "ROACH ORDERS THE NEW ARBY'S SANDWICH",
      excerpt:
        "A People Under the Stairs cast encounter becomes an intensely ordinary roast-beef consultation before recognition is finally acknowledged.",
    },
    {
      at: 4860,
      end: 4979,
      category: "CREATOR MEMORY",
      label: "ROACH ESCAPES THE WALLS AT SCAREFEST",
      excerpt:
        "A drunken afterparty greeting orders the actor back into the walls while he appears to be pursuing a much better conversation.",
    },
    {
      at: 4980,
      end: 5149,
      category: "CREATOR MEMORY",
      label: "THE KRISTY SWANSON BAR CASE",
      excerpt:
        "A friendly bar conversation, a promise to return and an early departure become a contested romantic history with no available replay review.",
    },
    {
      at: 5150,
      end: 5229,
      category: "STRAIGHT TO STEVE'S ASSHOLE",
      label: "THE FACULTY'S EFFECTS FAIL THE DRUG TEST",
      excerpt:
        "The soundtrack and 1990s nostalgia survive; the digital creature work does not, leaving a fun capsule with a badly expired visual prescription.",
    },
    {
      at: 5230,
      end: 5339,
      category: "CREATOR DNA",
      label: "RODDY PIPER, GOLDEN RETRIEVER ACTION HERO",
      excerpt:
        "The They Live commentary reveals a bruised, generous storyteller whose sweetness makes the giant wrestler feel like the nicest dog at the park.",
    },
    {
      at: 5340,
      end: 5399,
      category: "MOVIE COURT",
      label: "PIPER GETS THE DUKE NUKEM MOVIE",
      excerpt:
        "A larger Hollywood career is imagined, then immediately narrowed to the role his voice, body and bubble-gum résumé were born to play.",
    },
    {
      at: 5400,
      end: 5519,
      category: "MOVIE COURT",
      label: "BLAIR WITCH WINS THE MARKETING WAR",
      excerpt:
        "The original web campaign made missing filmmakers feel real and created a level of pre-show fear no normal trailer could manufacture.",
    },
    {
      at: 5520,
      end: 5589,
      category: "WWAM UP IN YA",
      label: "ZELDA GETS THE FAST-FORWARD BUTTON",
      excerpt:
        "Pet Sematary's spinal nightmare was so effective that childhood survival required skipping the scene and rooting for the choking.",
    },
    {
      at: 5590,
      end: 5699,
      category: "BRACKET RESULT",
      label: "PET SEMATARY ADVANCES, 70 TO 30",
      excerpt:
        "Grief and the Micmac burial ground beat the greatest found-footage campaign ever mounted.",
    },
    {
      at: 5700,
      end: 5819,
      category: "BRACKET RESULT",
      label: "POLTERGEIST EVICTS URBAN LEGEND",
      excerpt:
        "The stylish Scream-era copycat gets affection; Spielberg and Hooper's suburban nightmare gets the next round.",
    },
    {
      at: 5820,
      end: 5939,
      category: "BRACKET RESULT",
      label: "THE CROW BEATS SLEEPAWAY CAMP",
      excerpt:
        "Eric Draven advances easily and instantly triggers an argument over whether revenge from beyond the grave counts as horror.",
    },
    {
      at: 5940,
      end: 6059,
      category: "BRACKET DESK",
      label: "THE CROW'S HORROR PASSPORT",
      excerpt:
        "Supernatural tragedy, superhero film and gothic revenge story all apply for the same slot. The bracket reluctantly stamps the passport.",
    },
    {
      at: 6060,
      end: 6179,
      category: "MOVIE COURT",
      label: "TREMORS BRINGS SALT-OF-THE-EARTH MONSTER BALL",
      excerpt:
        "Kevin Bacon and Earl's friendship, Reba's arsenal and a lived-in desert make the graboid movie feel warmer than cotton-candy murder.",
    },
    {
      at: 6180,
      end: 6299,
      category: "FRANCHISE LAB",
      label: "THE TREMORS GAME WE SHOULD HAVE GOTTEN",
      excerpt:
        "The dead Killer Klowns multiplayer hype is repurposed into a graboid game where the floor is lava and Kevin Bacon points like a cobra.",
    },
    {
      at: 6300,
      end: 6419,
      category: "BRACKET RESULT",
      label: "TREMORS BREAKS THE EIGHTIES SWEEP",
      excerpt:
        "The 1990s finally plant a flag on the left side, then alien news and The Boys try unsuccessfully to hijack the tournament.",
    },
    {
      at: 6420,
      end: 6539,
      category: "MOVIE COURT",
      label: "CANDYMAN FACES THE FLY'S FINGERNAILS",
      excerpt:
        "Tony Todd's voice and Philip Glass meet Jeff Goldblum's slow physical collapse in the bracket's nastiest beauty contest.",
    },
    {
      at: 6540,
      end: 6599,
      category: "BRACKET RESULT",
      label: "CANDYMAN WINS AT THE BUZZER",
      excerpt:
        "A razor-close vote sends the hook forward and leaves The Fly dissolved on the telepod floor.",
    },
    {
      at: 6600,
      end: 6659,
      category: "CREATOR DNA",
      label: "THE TOURNAMENT EARNS A PART TWO",
      excerpt:
        "Instead of sprinting through the best matchups, the hosts promise an Elite Eight tonight and a proper finish Wednesday.",
    },
    {
      at: 6660,
      end: 6779,
      category: "BRACKET RESULT",
      label: "THE SHINING SENDS RE-ANIMATOR BACK TO THE MORGUE",
      excerpt:
        "Kubrick's framing, Nicholson's eyes and the movie's bottomless replay value overwhelm Herbert West.",
    },
    {
      at: 6780,
      end: 6909,
      category: "BRACKET RESULT",
      label: "SILENCE BEATS RETURN, 66 TO 34",
      excerpt:
        "Punk-rock zombies lose to Anthony Hopkins making politeness, eye contact and one swallowed tongue feel apocalyptic.",
    },
    {
      at: 6910,
      end: 7019,
      category: "BRACKET RESULT",
      label: "THE LOST BOYS BEATS FRIGHT NIGHT",
      excerpt:
        "Santa Carla advances on soundtrack, atmosphere and the kind of cross-generational loyalty no seed number can explain.",
    },
    {
      at: 7020,
      end: 7139,
      category: "BRACKET RESULT",
      label: "DUSK TILL DAWN BEATS PUMPKINHEAD",
      excerpt:
        "Loyalty to the pumpkin field cannot overcome the Titty Twister's pure rewatchability. The vampire bar wins 63 to 38.",
    },
    {
      at: 7140,
      end: 7269,
      category: "BRACKET RESULT",
      label: "THE THING BEATS THEY LIVE, 77 TO 23",
      excerpt:
        "Carpenter versus Carpenter ends with the film that never drops the rope defeating the cooler, messier cult favorite.",
    },
    {
      at: 7270,
      end: 7449,
      category: "BRACKET RESULT",
      label: "PET SEMATARY BREAKS THE PEOPLE'S HOUSE",
      excerpt:
        "The audience chooses grief, Zelda and Gage so decisively that one host begins designing an emergency veto card.",
    },
    {
      at: 7450,
      end: 7569,
      category: "HOT TAKE",
      label: "POLTERGEIST II IS BETTER",
      excerpt:
        "The sequel gets the upset endorsement because Reverend Kane gives evil a face, a voice and permission to come inside.",
    },
    {
      at: 7570,
      end: 7679,
      category: "THE ROOM BREAKS",
      label: "POLTERGEIST & TREMORS DEADLOCK AT 50/50",
      excerpt:
        "A result nobody expected forces coin-flip talk, panel-vote theory and one rapid runoff.",
    },
    {
      at: 7680,
      end: 7739,
      category: "BRACKET RESULT",
      label: "POLTERGEIST WINS THE REVOTE, 60 TO 40",
      excerpt:
        "The haunted house survives overtime and keeps the Elite Eight from becoming a Kevin Bacon convention.",
    },
    {
      at: 7740,
      end: 7859,
      category: "BRACKET DESK",
      label: "THE CROW GOES BACK ON TRIAL",
      excerpt:
        "The film's greatness is uncontested; its right to flatten a horror bracket like a superhero remains very much contested.",
    },
    {
      at: 7860,
      end: 7919,
      category: "BRACKET RESULT",
      label: "CANDYMAN EJECTS THE CROW",
      excerpt:
        "The audience chooses the pure horror icon, either correcting the field or strategically removing its biggest ringer.",
    },
    {
      at: 7920,
      end: 8039,
      category: "BRACKET DESK",
      label: "THE ELITE EIGHT IS SET",
      excerpt:
        "Shining/Lost Boys, Thing/Poltergeist, Silence/Dusk and Pet Sematary/Candyman survive. The predicted champion splits between The Lost Boys and The Shining.",
    },
    {
      at: 8040,
      end: 8159,
      category: "CREATOR MEMORY",
      label: "THE NEIGHBORS MIGHT BE HAVING SEX OR WORK",
      excerpt:
        "Strange overnight distress noises are investigated and reluctantly downgraded to somebody hitting furniture before an early shift.",
    },
    {
      at: 8160,
      end: 8279,
      category: "VERDICT",
      label: "OBSESSION BEATS WEAPONS IN THE REWATCH TEST",
      excerpt:
        "One host chooses Obsession as the movie to show another person; the other has not seen it and limits the opinion to trailer interest.",
    },
    {
      at: 8280,
      end: 8399,
      category: "WWAM UP IN YA",
      label: "ERNEST CAN KISS PENNYWISE TO DEATH",
      excerpt:
        "Shared fear-based weaknesses mean Ernest P. Worrell may defeat Pennywise with a dance, a smooch and impenetrable plot armor.",
    },
    {
      at: 8400,
      end: 8519,
      category: "FAN COURT",
      label: "PUNISHER HUNTS THE LOST BOYS IN NEW YORK",
      excerpt:
        "Home-field advantage, every weapon and one phone call to Blade turn Santa Carla's vampires into a very short police report.",
    },
    {
      at: 8520,
      end: 8639,
      category: "FAN COURT",
      label: "MICHAEL KILLS JOKER; T-1000 KILLS JOHN WICK",
      excerpt:
        "The viewer gauntlet sends Joker laughing into Michael's knife and leaves Wick without a weapon that can stop liquid metal.",
    },
    {
      at: 8640,
      end: 8759,
      category: "FRANCHISE LAB",
      label: "TOBEY & RAIMI WIN THE COMEBACK VOTE",
      excerpt:
        "A fourth Spider-Man with the original director feels less exhausted than another original-cast X-Men reunion, especially if studio interference stays home.",
    },
    {
      at: 8760,
      end: 8800,
      category: "CHARACTER PERFORMANCE",
      label: "LOOMIS SERVES THE REMAKE SHIT SANDWICH",
      excerpt:
        "Asked about remakes ignoring lore, the doctor says disrespecting the original means serving the public a shit sandwich he is too busy hunting Michael to watch.",
      characters: Object.freeze(["Dr. Loomis"]),
    },
    {
      at: 8801,
      end: 8829,
      category: "CHARACTER PERFORMANCE",
      label: "LOOMIS REJECTS THE APPLEBEE'S BELT SCENARIO",
      excerpt:
        "A threat to remove a belt and demand the position gets answered with mace, a slap and an immediate call to the cops.",
      characters: Object.freeze(["Dr. Loomis"]),
    },
    {
      at: 8830,
      end: 8870,
      category: "CHARACTER PERFORMANCE",
      label: "CHALLIS COUNTS CHARLOTTE'S RINGS",
      excerpt:
        "Asked why a wife came home limping, Challis denies the affair and calls the suspicious examination age verification.",
      characters: Object.freeze(["Dr. Challis"]),
    },
    {
      at: 8871,
      end: 8924,
      category: "CHARACTER PERFORMANCE",
      label: "LOOMIS PROSECUTES THE FIVE-HOUR TOILET",
      excerpt:
        "The doctor rejects an alleged bowel delivery, orders the stranger to find a meaningful hobby and defends his bathroom from future loads.",
      characters: Object.freeze(["Dr. Loomis"]),
    },
    {
      at: 8925,
      end: 8950,
      category: "CHARACTER PERFORMANCE",
      label: "CHALLIS PRESCRIBES THE PLUSH TOILET SEAT",
      excerpt:
        "Loomis's yarn-covered grandmother seat is recommended for prostate comfort and immediately condemned as a germ museum.",
      characters: Object.freeze(["Dr. Challis"]),
    },
    {
      at: 8951,
      end: 9019,
      category: "WWAM UP IN YA",
      label: "MORTAL KOMBAT REQUIRES NICKELBACK RECOVERY",
      excerpt:
        "A viewer drinks through one movie, sleeps through another and leaves the theater with a soundtrack nobody prescribed.",
    },
    {
      at: 9020,
      end: 9070,
      category: "CHARACTER PERFORMANCE",
      label: "GLAMOSAURUS AUDITIONS FOR MASCOT",
      excerpt:
        "The five-dollar dinosaur formally announces that prehistoric heaven remains extremely gay and apparently very well attended.",
      characters: Object.freeze(["Glamosaurus Rex"]),
    },
    {
      at: 9071,
      end: 9149,
      category: "FAN MEMORY",
      label: "HAPPY BIRTHDAY, GAGE—WATCH THE ROAD",
      excerpt:
        "A fan's twenty-sixth birthday gets genuine love, a new-kitten celebration and the unavoidable Pet Sematary truck warning.",
    },
    {
      at: 9150,
      end: 9239,
      category: "CLAIM CHECK",
      label: "GRAVE ENCOUNTERS REBOOT, JUSTIN LONG CAMPAIGN",
      excerpt:
        "A viewer reports Justin Long's attachment. The hosts question the need, prefer a third film and still advertise themselves for the cameo.",
    },
    {
      at: 9240,
      end: 9339,
      category: "CREATOR DNA",
      label: "THE RECORD COLLECTION POWER RANKING",
      excerpt:
        "Nirvana and early Eminem lead, Limp Bizkit and Korn follow, and a Def Leppard-free shelf receives no mercy.",
    },
    {
      at: 9340,
      end: 9399,
      category: "FRANCHISE LAB",
      label: "TARANTINO GETS HELLRAISER & ALL THE FEET",
      excerpt:
        "Halloween and People Under the Stairs are considered before Hellraiser wins the imaginary directing assignment for deeply predictable reasons.",
    },
    {
      at: 9400,
      end: 9420,
      category: "CHARACTER PERFORMANCE",
      label: "SLENDERMAN HANDLES THE UNDERWEAR EMERGENCY",
      excerpt:
        "A three-character role-play prompt begins with practical advice: use the bathroom and remove the evidence before romance reaches the pants.",
      characters: Object.freeze(["Slenderman"]),
    },
    {
      at: 9421,
      end: 9440,
      category: "CHARACTER PERFORMANCE",
      label: "LOOMIS DESCRIBES THREE-PUMP ROMANCE",
      excerpt:
        "The doctor advises against role-playing him because his bedroom procedure is standard, brief and hostile to customer feedback.",
      characters: Object.freeze(["Dr. Loomis"]),
    },
    {
      at: 9441,
      end: 9460,
      category: "CHARACTER PERFORMANCE",
      label: "MARK WAHLBERG PRESCRIBES A ROLLER COASTER",
      excerpt:
        "Mark rejects role-play, demonstrates face-vacuum kissing and recommends the Fear method: roller coaster first, Bush afterward.",
      characters: Object.freeze(["Mark Wahlberg"]),
    },
    {
      at: 9461,
      end: 9511,
      category: "THE ROOM BREAKS",
      label: "MORE MARGARITAS, GREAT ASS",
      excerpt:
        "A large donation earns music, Al Pacino volume and a brief reminder that company in the room had supposedly kept things PG.",
    },
    {
      at: 9512,
      end: 9579,
      category: "CHARACTER PERFORMANCE",
      label: "LOOMIS REJECTS THE TACO TRUCK",
      excerpt:
        "Tacos, burritos and spicy food are refused because the doctor's hemorrhoids already resemble Michael's bleeding Halloween II eyes.",
      characters: Object.freeze(["Dr. Loomis"]),
    },
    {
      at: 9580,
      end: 9639,
      category: "WWAM UP IN YA",
      label: "THE MONSTER-TRUCK TACO DATE",
      excerpt:
        "The rejected invitation becomes a sincere fantasy involving two Coronas, a monster truck and enough tacos to stop all conversation.",
    },
    {
      at: 9640,
      end: 9699,
      category: "BRACKET DESK",
      label: "WHY SCREAM WAS NOT ALLOWED IN",
      excerpt:
        "A viewer notices Scream's absence. The answer is simple: the obvious franchise winner was benched along with the other giants.",
    },
    {
      at: 9700,
      end: 9759,
      category: "CLAIM CHECK",
      label: "EVIL ED & THE VIEWER-TRIVIA TRAP",
      excerpt:
        "A viewer supplies adult-film trivia about the Fright Night actor. The show reacts; the archive does not independently verify the claim.",
    },
    {
      at: 9760,
      end: 9899,
      category: "CREATOR MEMORY",
      label: "THE PUPPY IS A POSSESSED CRITTER",
      excerpt:
        "Indy bites the leash, eats rabbit droppings, barks at boundaries and sits like a drunk sailor the second discipline arrives.",
    },
    {
      at: 9900,
      end: 10019,
      category: "CREATOR MEMORY",
      label: "THE ARM-HUMP DOMINANCE HEARING",
      excerpt:
        "A calming cuddle becomes an attempted takeover; the owner's reported counter-hump establishes exactly nothing except household exhaustion.",
    },
    {
      at: 10020,
      end: 10099,
      category: "FRANCHISE LAB",
      label: "SEAGAL AS LIVE-ACTION KUNG FU PANDA",
      excerpt:
        "A viewer pitch becomes a sincere request for weight loss, Aikido arm breaks and one final big-screen Steven Seagal rampage.",
    },
    {
      at: 10100,
      end: 10179,
      category: "HADDONFIELD WIRE",
      label: "HALLOWEEN SKITS GET AN ON-AIR PROMISE",
      excerpt:
        "A channel friend will help perform Michael so filming can receive full attention, with Loomis therapy named as a possible Halloween payoff.",
    },
    {
      at: 10180,
      end: 10206,
      category: "CLAIM CHECK",
      label: "THE UGLY CELEBRITY HYPOTHETICAL",
      excerpt:
        "A viewer poses a deliberately disturbing pet-sitting choice. The response is personal discomfort and allegation-based opinion, not a factual finding.",
    },
    {
      at: 10207,
      end: 10269,
      category: "CHARACTER PERFORMANCE",
      label: "LOOMIS DIAGNOSES ALEX BY NAME ALONE",
      excerpt:
        "With no case history beyond a first name, the doctor finds cheese, feet, rat droppings, fake martial arts and a suspicious interest in finger smells.",
      characters: Object.freeze(["Dr. Loomis"]),
    },
    {
      at: 10270,
      end: 10299,
      category: "THE ROOM BREAKS",
      label: "MACHINE GUN KELLY'S RESEARCH ADVANTAGE",
      excerpt:
        "The blind Alex roast becomes a rap-battle theory: knowing everything about Eminem helps when nobody knows anything about you.",
    },
    {
      at: 10300,
      end: 10379,
      category: "CREATOR DNA",
      label: "THREE HUNDRED PEOPLE SHOW UP ANYWAY",
      excerpt:
        "An impromptu stream still clears three hundred live viewers, a fact the hosts treat as community support rather than a dashboard number.",
    },
    {
      at: 10380,
      end: 10429,
      category: "CREATOR DNA",
      label: "THE AD-FREE LIVE-STREAM PROMISE",
      excerpt:
        "Direct support may let future live shows run without interruption, while replay ads do the ugly business later.",
    },
    {
      at: 10430,
      end: 10486,
      category: "LAST CALL",
      label: "CUTE, BUT A DICK",
      excerpt:
        "Indy's bedtime structure, a promised on-camera introduction and one cured viewer carry the show into a very affectionate good night.",
    },
  ]);

  var verdictItems = freezeItems([
    {
      at: 600,
      end: 959,
      subject: "Reported Helen of Troy / Achilles casting",
      verdict:
        "Discussed as casting chatter rather than confirmed production fact. The main objection is the rumored Achilles performer's physical fit for the role.",
    },
    {
      at: 960,
      end: 1139,
      subject: "Viral baseball coffee-date story",
      verdict:
        "The hosts criticize both the alleged sexual comments and public name-and-shame response. The private date, identities and motives are not independently established by this tape.",
    },
    {
      at: 1140,
      end: 1199,
      subject: "Franchise exclusions",
      verdict:
        "Halloween, Scream, Friday the 13th and A Nightmare on Elm Street are deliberately excluded because their scale would dominate the 1980s-versus-1990s field.",
    },
    {
      at: 1200,
      end: 1379,
      subject: "The Shining versus Stir of Echoes",
      verdict:
        "The Shining advances, 81% to 19%. Stir of Echoes is praised as a formidable sixteen seed and a deeply rewatchable ghost story.",
    },
    {
      at: 1380,
      end: 1469,
      subject: "The Silence of the Lambs versus The Fog",
      verdict:
        "The Silence of the Lambs advances by consensus without a formal poll. The Fog is respected but called overrated and weaker late.",
    },
    {
      at: 1620,
      end: 1919,
      subject: "Re-Animator versus Event Horizon",
      verdict:
        "Re-Animator advances, 59% to 41%. The alleged lost or damaged Event Horizon footage remains production lore, not a recovered cut.",
    },
    {
      at: 1920,
      end: 2399,
      subject: "The Sixth Sense versus Return of the Living Dead",
      verdict:
        "Return of the Living Dead advances, 59% to 41%. The Sixth Sense wins the emotional confession; the zombie film wins the bracket.",
    },
    {
      at: 2490,
      end: 2999,
      subject: "The Lost Boys versus End of Days",
      verdict:
        "The Lost Boys advances decisively. End of Days receives strong Arnold, Satan and breakfast-smoothie advocacy but never threatens the vampire favorite.",
    },
    {
      at: 3000,
      end: 3539,
      subject: "From Dusk Till Dawn versus The Blob",
      verdict:
        "From Dusk Till Dawn advances comfortably. The discussion favors its cast, soundtrack, outlaw energy and unusually high rewatchability.",
    },
    {
      at: 3540,
      end: 3899,
      subject: "Fright Night versus It",
      verdict:
        "Fright Night advances, 60% to 40%. Tim Curry's Pennywise is revered; the newer performance is viewed as weakened by excess digital effects.",
    },
    {
      at: 3900,
      end: 4319,
      subject: "Pumpkinhead versus Arachnophobia",
      verdict:
        "Pumpkinhead pulls the first major upset. Arachnophobia wins blockbuster polish; Pumpkinhead wins on singular atmosphere, grief and creature design.",
    },
    {
      at: 4320,
      end: 4619,
      subject: "The Thing versus In the Mouth of Madness",
      verdict:
        "The Thing advances by overwhelming consensus. In the Mouth of Madness is respected but treated as badly underseeded into an impossible matchup.",
    },
    {
      at: 4620,
      end: 4739,
      subject: "The People Under the Stairs versus The Prowler",
      verdict:
        "The People Under the Stairs advances by consensus. The Prowler receives an intentional underseen-slasher spotlight before elimination.",
    },
    {
      at: 5150,
      end: 5399,
      subject: "They Live versus The Faculty",
      verdict:
        "They Live advances, 62% to 38%. Its final act is criticized, but the concept, alley fight and Roddy Piper outweigh The Faculty's badly aged effects.",
    },
    {
      at: 5400,
      end: 5699,
      subject: "The Blair Witch Project versus Pet Sematary",
      verdict:
        "Pet Sematary advances, 70% to 30%. Blair Witch wins for groundbreaking marketing; Pet Sematary wins for performance, grief and terror.",
    },
    {
      at: 5700,
      end: 5819,
      subject: "Poltergeist versus Urban Legend",
      verdict:
        "Poltergeist advances by strong consensus. Urban Legend is liked as a fun Scream-era copy but not treated as the same class of film.",
    },
    {
      at: 5820,
      end: 6059,
      subject: "The Crow versus Sleepaway Camp",
      verdict:
        "The Crow advances by strong consensus. Its supernatural-horror eligibility remains contested even though the bracket provisionally accepts it.",
    },
    {
      at: 6060,
      end: 6419,
      subject: "Killer Klowns from Outer Space versus Tremors",
      verdict:
        "Tremors advances and prevents an 1980s sweep of the left bracket. Friendship, setting and blue-collar monster action carry the 1990 film.",
    },
    {
      at: 6420,
      end: 6599,
      subject: "Candyman versus The Fly",
      verdict:
        "Candyman advances by a razor-thin audience vote. The Fly's physical horror and Goldblum performance make it one of the night's closest eliminations.",
    },
    {
      at: 6660,
      end: 6779,
      subject: "The Shining versus Re-Animator",
      verdict:
        "The Shining advances by consensus. Re-Animator's singular fun cannot overcome Kubrick's formal craft and replay depth.",
    },
    {
      at: 6780,
      end: 6909,
      subject: "The Silence of the Lambs versus Return of the Living Dead",
      verdict:
        "The Silence of the Lambs advances, 66% to 34%. The audience chooses Hopkins and Foster over the beloved punk-zombie favorite.",
    },
    {
      at: 6910,
      end: 7019,
      subject: "The Lost Boys versus Fright Night",
      verdict:
        "The Lost Boys advances by a wide margin. Fright Night remains loved; soundtrack, mood and generational attachment decide the vampire matchup.",
    },
    {
      at: 7020,
      end: 7139,
      subject: "From Dusk Till Dawn versus Pumpkinhead",
      verdict:
        "From Dusk Till Dawn advances, 63% to 38% as announced. One host stays with Pumpkinhead; the other and the audience choose rewatchability.",
    },
    {
      at: 7140,
      end: 7269,
      subject: "The Thing versus They Live",
      verdict:
        "The Thing advances, 77% to 23%. Carpenter's more complete film beats his cooler but less consistent cult favorite.",
    },
    {
      at: 7270,
      end: 7449,
      subject: "The People Under the Stairs versus Pet Sematary",
      verdict:
        "Pet Sematary advances decisively. One host strongly objects and would use a hypothetical veto; the audience result stands.",
    },
    {
      at: 7450,
      end: 7739,
      subject: "Poltergeist versus Tremors",
      verdict:
        "The first vote ends 50/50. A rapid runoff sends Poltergeist through, 60% to 40%, after both hosts openly support it.",
    },
    {
      at: 7740,
      end: 7919,
      subject: "The Crow versus Candyman",
      verdict:
        "Candyman advances. The result doubles as an audience ruling that The Crow was either the wrong genre or too powerful for this field.",
    },
    {
      at: 7920,
      end: 8039,
      subject: "Elite Eight / championship prediction",
      verdict:
        "The tournament pauses with eight films remaining. One host predicts The Lost Boys; the other predicts The Shining. No champion is crowned in this source.",
    },
    {
      at: 8160,
      end: 8279,
      subject: "Weapons versus Obsession",
      verdict:
        "One host chooses Obsession on rewatch and reaction value. The other has seen only the trailer and does not offer a completed-film verdict.",
    },
    {
      at: 8640,
      end: 8759,
      subject: "Raimi/Tobey Spider-Man versus original-cast X-Men return",
      verdict:
        "Both favor a fourth Raimi/Tobey film, especially if the director can work without the studio interference they believe damaged Spider-Man 3.",
    },
    {
      at: 9150,
      end: 9239,
      subject: "Reported Grave Encounters reboot",
      verdict:
        "The hosts question the need and prefer Grave Encounters 3, while remaining openly willing to appear. The attachment report originates with a viewer message.",
    },
    {
      at: 9340,
      end: 9399,
      subject: "Tarantino horror assignment",
      verdict:
        "The imaginary choice moves from Halloween to People Under the Stairs and lands on Hellraiser, largely because the material matches his dialogue and foot fixation.",
    },
    {
      at: 10100,
      end: 10179,
      subject: "Halloween character skits",
      verdict:
        "A real future intention is stated: use a channel collaborator as Michael so the host can focus on filming, with Loomis therapy skits among the possibilities.",
    },
    {
      at: 10180,
      end: 10206,
      subject: "Celebrity pet-sitting hypothetical",
      verdict:
        "The answer expresses personal discomfort and references public allegations. It does not establish criminal conduct or resolve disputed claims as fact.",
    },
  ]);

  var characterItems = freezeItems([
    {
      at: 2880,
      end: 2939,
      character: "Corey Feldman",
      label: "THE WOLF PACK GOES DEEP",
    },
    {
      at: 8760,
      end: 8800,
      character: "Dr. Loomis",
      label: "THE REMAKE SHIT SANDWICH",
    },
    {
      at: 8801,
      end: 8829,
      character: "Dr. Loomis",
      label: "THE APPLEBEE'S BELT DEFENSE",
    },
    {
      at: 8830,
      end: 8870,
      character: "Dr. Challis",
      label: "COUNTING CHARLOTTE'S RINGS",
    },
    {
      at: 8871,
      end: 8924,
      character: "Dr. Loomis",
      label: "THE FIVE-HOUR TOILET INVASION",
    },
    {
      at: 8925,
      end: 8950,
      character: "Dr. Challis",
      label: "THE PLUSH PROSTATE SEAT",
    },
    {
      at: 9020,
      end: 9070,
      character: "Glamosaurus Rex",
      label: "THE NEW GAY DINOSAUR MASCOT",
    },
    {
      at: 9400,
      end: 9420,
      character: "Slenderman",
      label: "THE UNDERWEAR EMERGENCY",
    },
    {
      at: 9421,
      end: 9440,
      character: "Dr. Loomis",
      label: "THE THREE-PUMP ROLE PLAY",
    },
    {
      at: 9441,
      end: 9460,
      character: "Mark Wahlberg",
      label: "THE FEAR ROLLER-COASTER METHOD",
    },
    {
      at: 9512,
      end: 9579,
      character: "Dr. Loomis",
      label: "THE HEMORRHOID TACO REFUSAL",
    },
    {
      at: 10207,
      end: 10269,
      character: "Dr. Loomis",
      label: "THE ALEX SMELL DIAGNOSIS",
    },
  ]);

  sources["fNOojlYn2oA"] = Object.freeze({
    sourceId: "fNOojlYn2oA",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 10486,
      captionWords: 38496,
      captionSha256:
        "sha256:d301c55eea9cf44e4939db8c9508fa532c2fc4024268805a9efa47055df6eefc",
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),

    label: "THE NIGHT, IN THE ORDER IT ACTUALLY HAPPENED",
    badge: "FULL SHOW WIKI // EVERY ROUND ACCOUNTED FOR",

    headline:
      "THE EIGHTIES THROW A SHUTOUT. TREMORS FORCES OVERTIME. LOOMIS INSPECTS YOUR TOILET.",

    deck:
      "Two hours, fifty-four minutes and forty-six seconds of horror-bracket bloodshed, a five-dollar gay dinosaur, the Lost Boys saxophone pilgrimage that never happened, movie tears, Corey Feldman going deep, a 50/50 runoff and enough late-night Loomis medicine to make Applebee's revoke everybody's bathroom privileges.",

    overview:
      "The night begins with Glamosaurus, a five-dollar yard-sale dinosaur whose anatomy and proud prehistoric sexuality immediately become more important than the bracket. An eight-week-old puppy explains Jay's late arrival, then reported Achilles casting chatter opens a Troy trial where Paris is convicted of starting a war with his dick and Hector is sentenced to clean it up. A viral baseball-date story receives careful internet-court treatment before the real show takes over: thirty-two horror movies from the 1980s and 1990s, with Halloween, Scream, Friday the 13th and Nightmare deliberately benched so the franchise monsters cannot swallow another bracket. The Shining, Silence of the Lambs, Re-Animator and Return of the Living Dead advance first. The left side then turns almost entirely green: Lost Boys, Fright Night, Pumpkinhead, The Thing, The People Under the Stairs, They Live, Pet Sematary, Poltergeist and The Crow keep hammering the 1990s until Tremors finally stops the sweep. Candyman edges The Fly. Round two becomes the better show: Shining dismisses Re-Animator, Silence beats Return, Lost Boys wins the vampire civil war, From Dusk Till Dawn sends Pumpkinhead home, The Thing beats They Live and Pet Sematary's demolition of People Under the Stairs nearly causes a host veto. Poltergeist and Tremors finish dead even, forcing a live runoff that Poltergeist wins 60 to 40. Candyman removes The Crow after an extended genre-eligibility hearing. No champion is crowned here; the tape ends the bracket with an Elite Eight and a promise to finish Wednesday. The human material around the results is better than the scoreboard. A Sixth Sense pick becomes a candid conversation about crying at movies, old pain and garage-beer promises to change their lives. A Lost Boys tangent resurrects the rejected road trip to see the shirtless saxophonist. From Dusk Till Dawn gets almost a full commentary because nobody can stop discussing the tattoo, the toe, the retainer or Harvey Keitel. Scarefest memories include Roach at Arby's and a disputed Kristy Swanson flirtation. The mailbag then builds its own finale: Punisher kills the Lost Boys, Ernest kisses Pennywise to death, Glamosaurus accepts the mascot job, a fan named Gage gets a birthday roast, and the character bench empties. Corey Feldman joins the Wolf Pack; Loomis serves remake shit sandwiches, rejects belts, guards his toilet, describes three-pump romance, refuses tacos and diagnoses Alex by smell; Challis counts a wife's rings and recommends a plush toilet seat; Slenderman handles an underwear emergency; Mark Wahlberg prescribes a roller coaster. The actual last word belongs to the community: more than three hundred viewers show up for an impromptu stream, their support may keep future live shows free of interruptions, and the hosts say the audience's questions remain their favorite part.",

    story: story,
    highlights: highlights,

    panels: Object.freeze([
      Object.freeze({
        id: "verdict-ledger",
        type: "verdict-ledger",
        eyebrow: "WHAT ADVANCED, WHAT LOST & WHAT STAYED A REPORT",
        title: "THE NIGHT'S ACTUAL SCORECARD",
        intro:
          "Results below come from spoken poll announcements or explicit throw-in-the-towel rulings. Online stories, casting chatter and viewer-supplied trivia stay attributed instead of becoming fake facts.",
        items: verdictItems,
      }),
      Object.freeze({
        id: "character-ledger",
        type: "character-ledger",
        eyebrow: "THE VOICES THAT ACTUALLY ANSWERED",
        title: "CHARACTER PERFORMANCES, NOT NAME-DROPS",
        items: characterItems,
        note:
          "Each receipt begins with a direct character setup and an immediate in-character response. The performer cannot be assigned to a specific host because the canonical captions are not speaker-diarized. Tom Atkins and Challis discussion near 24:00, movie quotations and casual name-drops are not counted as appearances.",
      }),
    ]),

    fanRead: Object.freeze({
      loved: Object.freeze({
        label: "THE NIGHT'S GUT-PUNCH",
        topic: "The movie-crying confession",
        body:
          "At 36:00, a Sixth Sense vote opens something real: Southpaw, Creed, shared pain and garage beers become a conversation about why a movie can hit a place the room usually keeps locked.",
        at: 2160,
        end: 2399,
        playAt: 2160,
        playEnd: 2399,
      }),
      hated: Object.freeze({
        label: "STRAIGHT TO STEVE'S ASSHOLE",
        topic: "Pennywise's digital face work",
        body:
          "At 1:01:00, Bill Skarsgård gets defended and the effects get buried. The complaint is not that the actor failed; it is that the movie kept covering him with digital noise until Tim Curry had an open lane.",
        at: 3660,
        end: 3779,
        playAt: 3660,
        playEnd: 3779,
      }),
      wildestDetour: Object.freeze({
        label: "WWAM UP IN YA",
        topic: "Loomis refuses the taco truck",
        body:
          "At 2:38:32, a friendly monster-truck taco invitation meets bleeding-hemorrhoid testimony, Halloween II eyeballs and a restraining-order tone. Thirty seconds later everybody else wants tacos.",
        at: 9512,
        end: 9639,
        playAt: 9512,
        playEnd: 9639,
      }),
      lastWord: Object.freeze({
        label: "THE LAST WORD",
        topic: "The audience makes the show possible",
        body:
          "At 2:51:40, the tournament gives way to the reason it exists: more than three hundred people showed up, direct support may keep future live shows uninterrupted, and the hosts say fan questions are still the best part.",
        at: 10300,
        end: 10486,
        playAt: 10300,
        playEnd: 10486,
      }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-07-30",
    sources: Object.freeze(sources),
  });
}("undefined" !== typeof window ? window : globalThis));
