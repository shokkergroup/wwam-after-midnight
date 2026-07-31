(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  function freezeRows(rows) {
    return Object.freeze(rows.map(function (row) {
      var copy = Object.assign({}, row);
      if (Array.isArray(copy.characters)) {
        copy.characters = Object.freeze(copy.characters.slice());
      }
      return Object.freeze(copy);
    }));
  }

  sources["mFVkZGOMryI"] = Object.freeze({
    sourceId: "mFVkZGOMryI",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 13043,
      captionWords: 46631,
      captionEvents: 13260,
      captionSpanSeconds: 13044.399,
      captionDurationCoveragePercent: 100,
      captionSha256:
        "sha256:81ab809751aa3d339317bc47c93f56ec14c7405193f6a08b5f43c1db57647029",
      captionSourceKind: "exact-public-youtube-automatic-captions",
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),

    label: "THE WHOLE SHOW, FROM PUPPY NEGOTIATIONS TO BUSH AFTER DARK",
    badge: "FULL SHOW WIKI // 3:37 WITH THE BRAKES CUT",

    headline:
      "EVIL DEAD BURNS. SCREAM GOES TO COURT. FELDMAN SAVES A $13 MOVIE.",

    deck:
      "Three hours and thirty-seven minutes of demon trapper keepers, Melissa Barrera grievance court, Ted Turner memory, Mortal Kombat hope, a Serial Killing 101 autopsy, nine real character-performance stops and one goodbye that refuses to die until Bush plays six legally nervous seconds.",

    overview:
      "The show opens with fake church discipline, a threatened list of chat perverts and the very real possibility that a seven-week-old black-mouth cur named Indiana is about to take over a Kentucky apartment. Before the movie desk can even open, the room gets DC Universe housing tours, MLB pitching, an old Blink-182 interview full of scrotums and mutual masturbation, a Jimmy Eat World memory and the confession that meeting Ghost Hunters once turned a grown man into a sweating hostage negotiator. Evil Dead Burn finally brings order by setting everything on fire. Both trailers look nasty and energetic, and the family-grief setup gives the hosts plenty to chew on, but the green-band cut appears to hand over most of the plot. They like the action, the possible Evil Dead Rise connection and the chance to link the three books; they do not like digital deadites crawling like World War Z leftovers. Every theory about the grandfather, the Necronomicon, Sam Raimi, Ash and a future Evil Dead Wrath remains exactly that: a fun theory built from what the trailers and discussion put on the table. An alien argument briefly escapes containment before the Hulk Hogan documentary gets a serious, unusually measured review. The hosts call the documentary excellent and say it made Terry Bollea look human without erasing the racist tape, infidelity or other damage. That leads into forgiveness, Mel Gibson, Passion of the Christ and then the episode's longest courtroom: Melissa Barrera's new interview. The hosts begin from a position they repeat several times -- they defended her performances and opposed her Scream firing -- before unloading on her failure to publicly reject harassment done in her name, her claim that Scream 7's numbers were inflated, her description of returning cast members as scabs and her plan to build a production company around politically aligned collaborators. It is a volcanic opinion segment, not an independent investigation into Barrera, Spyglass, fan conduct or box-office accounting. The Odyssey trailer cools the room down by looking enormous. They call it a ten-out-of-ten trailer, love the mythology and battle scale, question whether Tom Holland fits, and refuse to treat an Elliot Page/Achilles claim as confirmed casting. Ted Turner's death then becomes a warm detour through Braves baseball, TBS, MonsterVision and WCW. A live poll says wrestling would have been better if Nitro had won 64 to 36, and current WWE goes directly into the complaint department. Mortal Kombat 2 gets a critic-review scan rather than a finished-film verdict. The hosts want practical-looking fights, gore, memorable characters, Johnny Cage emotion and the damn Immortals theme; their own review is still one night away. The actual movie review is Serial Killing 101, also sold as Serial Killing for Dummies. A cheap camera, Lisa Loeb playing high school at 31, an obvious killer, a detective fart and Thomas Haden Church acting like rent is due produce scores of four and two. Corey Feldman's tiny sporting-goods-clerk performance is sincerely called good, which naturally becomes another trial about Titanic, Gilbert Grape and the moonwalk. The last hour belongs to the room. Housemaid and Hostel commentaries get plugged, Matthew Lillard is drafted as Jim Gordon, Plastic Man and Freddy, Ghostbusters gets a franchise report card, Bloodsport fights Die Hard, and fans ask for life advice, horror psychology, basketball, weed, diarrhea and candle-wax oral sex. Loomis weaponizes Friday the 13th's psychic girl, wishes Percy a disease-free birthday and fights Challis over who could survive a duel. Challis reports excellent blood pressure, invents Buffalo sober and serves Loomis a restraining order while 'What What (In the Butt)' becomes Michael Myers' bedroom anthem. Feldman claims Michael Jackson stole his dance vocabulary, Marky Mark narrates a Renee Zellweger roller-coaster finger-bang, and Slenderman recommends a foot-long chicken teriyaki. The formal goodbye arrives around 3:34. The real ending comes after a six-second Bush listening party, one last anatomy clarification and a final promise that life is going to be awesome.",

    story: freezeRows([
      {
        at: 0,
        end: 599,
        label: "JESUS TAKES NOTES WHILE INDIANA WAITS IN KENTUCKY",
        body:
          "A faux morality lecture threatens chat with divine surveillance, YouTube extinction and a handwritten pervert list. Jay arrives, Serial Killing 101 gets teased, and a seven-week-old black-mouth cur turns dog adoption into guns, bartering, apartment rules and an Indiana Jones naming summit.",
      },
      {
        at: 600,
        end: 1499,
        label: "MORTAL KOMBAT PLANS COLLIDE WITH ALIENS & BLINK-182 SCROTUMS",
        body:
          "Tomorrow's Mortal Kombat trip, spouse questions, a reported hantavirus story, UFO disclosure, DC Universe Online housing and MLB The Show all fight for the wheel. An old Blink-182 interview supplies drugs, sex and rock-and-roll anthropology before Jimmy Eat World and Ghost Hunters reopen the celebrity-cringe file.",
      },
      {
        at: 1500,
        end: 2399,
        label: "EVIL DEAD BURN OPENS THE TRAPPER KEEPER OF THE DEAD",
        body:
          "The red- and green-band trailers deliver grief, family dinner, a suspicious book and plenty of blood. The hosts like the action and possible Rise connection, hate how much plot appears exposed, debate practical versus digital deadites and build a three-book route toward Wrath, Raimi and Old Man Ash.",
      },
      {
        at: 2400,
        end: 2999,
        label: "ALIEN COURT ADJOURNS SO HULK HOGAN CAN TESTIFY",
        body:
          "A bathroom break frees alien disclosure, future humans and Project Blue Beam before skepticism returns with Bob Lazar, Travis Walton, Communion and Ghost Hunters. Then the new Hulk Hogan documentary enters, and the split between the character and Terry Bollea becomes the serious question.",
      },
      {
        at: 3000,
        end: 3599,
        label: "HOGAN GETS HUMANIZED WITHOUT GETTING ACQUITTED",
        body:
          "The documentary's alimony, brother, racist-tape, sex-tape and wrestling material earns an excellent verdict. The hosts argue that accountability can coexist with recognizing Hogan's cultural impact, then use Mel Gibson and Passion of the Christ to ask how long punishment should last.",
      },
      {
        at: 3600,
        end: 4199,
        label: "PASSION ENDS; MELISSA BARRERA COURT OPENS",
        body:
          "Faith, Gibson's direction and the reported two-part Passion sequel set up a politics-and-art discussion. The Scream file begins with the hosts restating that they defended Barrera in Scream 5 and 6 and opposed her firing before examining the fan campaign that followed.",
      },
      {
        at: 4200,
        end: 4799,
        label: "THE BOYCOTT BECOMES A DEATH-THREAT RECEIPT",
        body:
          "The hosts criticize Barrera for never publicly rejecting alleged threats and harassment made in her name. Her comments about private support, Javier Bardem, career damage and Scream 7's box office push the room from disappointed to furious.",
      },
      {
        at: 4800,
        end: 5399,
        label: "SCABS, PRODUCTION COMPANIES & A CAREER FIREBOMB",
        body:
          "Calling returning cast members scabs triggers the night's hardest rant. Nev Campbell's Scream 6 absence, working crews, political hiring lists and Barrera's proposed company become evidence in the hosts' case that she is punishing everyone for a boycott that failed.",
      },
      {
        at: 5400,
        end: 5999,
        label: "THE ODYSSEY TRAILER RESCUES THE ROOM FROM TWITTER",
        body:
          "The Barrera case closes with one more plea to denounce harassment. Christopher Nolan's Odyssey then supplies ships, monsters, vengeance and enormous images. The trailer earns a ten; unconfirmed casting chatter stays labeled, and Tom Holland is asked to stop looking like he wandered in from Spider-Man.",
      },
      {
        at: 6000,
        end: 6599,
        label: "TED TURNER PUTS BASEBALL, MONSTERS & WRESTLING ON THE SAME TV",
        body:
          "Zendaya casting chatter gives way to Ted Turner's death. TBS Braves games, MonsterVision and WCW become a personal media-history lesson about the billionaire who kept writing checks for things the hosts grew up loving.",
      },
      {
        at: 6600,
        end: 7199,
        label: "NITRO WINS THE POLL; MORTAL KOMBAT ENTERS REVIEW COURT",
        body:
          "Competition, the Monday Night Wars and WCW's collapse lead to a 64-to-36 vote that wrestling would be better if Nitro had won. Current WWE gets buried, then the hosts begin reading Mortal Kombat 2 reviews ahead of their own screening.",
      },
      {
        at: 7200,
        end: 7799,
        label: "MORTAL KOMBAT NEEDS BLOOD, HEART & THE DAMN THEME",
        body:
          "Positive and negative critics are weighed against the only standard the room cares about: fun fights, useful characters and effects that do not look like pig slop. Karl Urban may work as a Jack Burton Johnny Cage; the Immortals theme remains non-negotiable.",
      },
      {
        at: 7800,
        end: 8399,
        label: "SERIAL KILLING 101 ARRIVES ON A BAZOOKA-GUM BUDGET",
        body:
          "The Patreon pick's 1999 origin, later retitle, Lisa Loeb casting, Thomas Haden Church and secret-weapon Corey Feldman role get mapped before the trailer explains nearly everything. The premise is better than the movie and the photography looks borrowed from a dying camcorder.",
      },
      {
        at: 8400,
        end: 8999,
        label: "FELDMAN SAVES FIVE MINUTES; THE MOVIE LOSES THE OTHER NINETY",
        body:
          "A sudden good monologue, an obvious killer, a dog the hero cannot murder and a detective fart briefly wake up the review. Scores land at four and two. Feldman's clerk is called genuinely good, which sends the show through Gilbert Grape, Titanic and his imagined victory lap.",
      },
      {
        at: 9000,
        end: 9599,
        label: "THE MAILBAG OPENS WITH MICROPHONES, DIARRHEA & PSYCHIC WARFARE",
        body:
          "Housemaid and Hostel commentary plugs produce a microphone fight, Matthew Lillard gets drafted into DC, and cactus diarrhea joins the medical ledger. Loomis weaponizes Friday the 13th's psychic girl before Evil Dead Burn's reported ten minutes of darkness split the room.",
      },
      {
        at: 9600,
        end: 10199,
        label: "HORROR PSYCHOLOGY MEETS A DISEASE-FREE BIRTHDAY",
        body:
          "Hostel's shared-sex fist bump, recent actor deaths, Michael Myers versus Pinhead and high-school dating stories fill the next run. Percy turns 21, receives a cautionary toast and gets a short Loomis blessing against bar-room STDs.",
      },
      {
        at: 10200,
        end: 10799,
        label: "GHOSTBUSTERS, EARL THE DOG & THE LOOMIS-CHALLIS TITLE FIGHT",
        body:
          "Ghostbusters gets a full franchise report card, Indiana competes with Earl for puppy-name supremacy, Bloodsport fights Die Hard and superhero movies get ranked. A direct duel request makes Loomis and Challis threaten each other before the room gives unusually good advice about weed, work and turning 21.",
      },
      {
        at: 10800,
        end: 11399,
        label: "FREDDY GETS ANTHONY STARR; CHALLIS GETS A BLOOD-PRESSURE CUFF",
        body:
          "Anthony Starr wins the Freddy casting vote before the hosts discover they still owe 44 superchats. Challis reports that alcoholism cannot defeat elite blood pressure, Barrera returns for a brief encore, and candle wax is rejected as foreplay on both medical and Hobby Lobby grounds.",
      },
      {
        at: 11400,
        end: 11999,
        label: "THE ROOM CROSSES 300, HALLOWEEN & A BUTT-SONG WARRANT",
        body:
          "TCM, Hostel, a drunk UK viewer, Odyssey comparisons, Halloween games, Tom Holland and the big-baller song pass through quickly. Then Challis serves Loomis a restraining order while 'What What (In the Butt)' becomes evidence, insult and Michael Myers playlist.",
      },
      {
        at: 12000,
        end: 12599,
        label: "EVIL DEAD TONE, LIFE ADVICE & BUFFALO SOBER",
        body:
          "Male final guys, Karl Urban, Desert Heat and serious-versus-comic Evil Dead get clean answers. A viewer's injuries produce heartfelt advice, Dooku receives the backstory he deserved, Marvel rumors stay rumors, and Challis defines sobriety as twelve beers and only two mothers.",
      },
      {
        at: 12600,
        end: 13043,
        label: "MARKY MARK, SLENDERMAN & THE GOODBYE THAT LEARNED BUSH",
        body:
          "Feldman claims Michael Jackson borrowed his dance ideas. Marky Mark turns Fear into a roller-coaster sex confession, Slenderman orders chicken teriyaki and a Leatherface request dies without the mask. The official signoff fails, Bush plays six seconds, and the final promise reaches the last captioned word.",
      },
    ]),

    highlights: freezeRows([
      {
        at: 2,
        end: 89,
        category: "WWAM UP IN YA",
        label: "JESUS & MIKE ARE BOTH TAKING CHAT NOTES",
        excerpt:
          "A fake sermon warns that marijuana comes from Satan and every perverted comment is entering a private ledger.",
      },
      {
        at: 90,
        end: 179,
        category: "CREATOR DNA",
        label: "EVERY STREAM COULD BE THE LAST ONE",
        excerpt:
          "YouTube's recent deletions turn a routine hello into an affectionate emergency plan involving Patreon and Rumble.",
      },
      {
        at: 180,
        end: 299,
        category: "WWAM UP IN YA",
        label: "PLAYGIRL SUBSCRIBERS ENTER SERIAL-KILLER SCHOOL",
        excerpt:
          "Jay arrives with a Thomas Haden Church line and the future movie review immediately starts leaking bodily fluids.",
      },
      {
        at: 300,
        end: 419,
        category: "WWAM UP IN YA",
        label: "THE PALE-BLUE NINE-MILLIMETER GOES TO THE WIFE",
        excerpt:
          "A suspicious Kentucky puppy pickup gets a defense plan: hand the gun to the competent spouse and run.",
      },
      {
        at: 420,
        end: 539,
        category: "WWAM UP IN YA",
        label: "BLACK-MOUTH CUR BECOMES A DEI HIRE",
        excerpt:
          "A dog breed, EBT barter and eastern-Kentucky commerce become a demographic seminar nobody requested.",
      },
      {
        at: 540,
        end: 659,
        category: "PUPPY FILE",
        label: "INDIANA JONES GETS SEVEN WEEKS OLD",
        excerpt:
          "April wins the naming rights and the future apartment tyrant becomes Indiana, Indie when the carpet is in danger.",
      },
      {
        at: 660,
        end: 779,
        category: "PUPPY FILE",
        label: "THE APARTMENT BANS EVERY FUN DOG",
        excerpt:
          "Rottweilers, Dobermans, pit bulls and German shepherds lose to the lease before the puppy has even arrived.",
      },
      {
        at: 780,
        end: 899,
        category: "CREATOR MEMORY",
        label: "MORTAL KOMBAT DATE NIGHT REQUIRES NO WIFE QUESTIONS",
        excerpt:
          "Theater logistics improve when nobody has to explain the lightning guy or the freezy guy during the movie.",
      },
      {
        at: 900,
        end: 976,
        category: "CREATOR DNA",
        label: "THE GREEN LANTERN APARTMENT IS TOO BEAUTIFUL TO SHARE",
        excerpt:
          "Hours of DC Universe decorating earn genuine praise and an immediate denial that any of it matters.",
      },
      {
        at: 977,
        end: 1012,
        category: "GAME NIGHT",
        label: "GREG MADDUX PAINTS THE CORNERS; JOHN ROCKER GETS CONFUSED",
        excerpt:
          "MLB The Show becomes a pitching clinic before the wrong Braves pitcher inherits a racist-tirade memory.",
      },
      {
        at: 1013,
        end: 1077,
        category: "TIN-FOIL DESK",
        label: "AI BECOMES THE PERFECT ALIEN COVER STORY",
        excerpt:
          "Any real gray alien could buy coffee on camera now and the internet would dismiss the footage as generated.",
      },
      {
        at: 1068,
        end: 1080,
        category: "WWAM UP IN YA",
        label: "PROJECT BLUE BEAM SAVES EARTH FROM PROJECT BLUE BEAM",
        excerpt:
          "Fake aliens, real aliens and artificial invasion plans collapse into one circular conspiracy with excellent parking.",
      },
      {
        at: 1092,
        end: 1259,
        category: "WWAM UP IN YA",
        label: "BLINK-182 BRINGS SCROTUMS TO GERMAN TELEVISION",
        excerpt:
          "An old interview answers a polite party question with alcohol, mutual masturbation and filleting the fellas.",
      },
      {
        at: 1260,
        end: 1316,
        category: "WWAM UP IN YA",
        label: "GRANDPA LOSES THE MUSIC AWARD",
        excerpt:
          "The interview's award question detours into oral sex, West Virginia and a host who understands none of it.",
      },
      {
        at: 1323,
        end: 1412,
        category: "CREATOR MEMORY",
        label: "JIMMY EAT WORLD GETS SOME WWAM UP IN YOU",
        excerpt:
          "A reluctant musician learns that an intro is not a question and fame does not excuse missing the assignment.",
      },
      {
        at: 1414,
        end: 1500,
        category: "WWAM UP IN YA",
        label: "GHOST HUNTERS CAUSES A FULL HAND-WASH CAR WASH",
        excerpt:
          "Beer, hero worship and a drenched handshake make one celebrity encounter haunt harder than the ghosts.",
      },
      {
        at: 1500,
        end: 1619,
        category: "TRAILER DESK",
        label: "EVIL DEAD BURN OPENS THE RED-BAND BOOK",
        excerpt:
          "Punk music, a grieving family and a drinking-wax deadite promise an aggressive new trip through the cabin's theology.",
      },
      {
        at: 1620,
        end: 1739,
        category: "TRAILER DESK",
        label: "THE GREEN BAND FINDS THE WEDDING RING & THE DOG",
        excerpt:
          "More story arrives, one dog appears suspiciously yellow-eyed and the hosts immediately threaten the movie on its behalf.",
      },
      {
        at: 1740,
        end: 1859,
        category: "WWAM UP IN YA",
        label: "THE DEVIL OFFERS A WIENER-TIP RESURRECTION PLAN",
        excerpt:
          "Family grief becomes a complete imagined plot involving the Book of the Dead and a very specific infernal contract.",
      },
      {
        at: 1860,
        end: 1979,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "THE GREEN-BAND TRAILER HANDS OVER THE WHOLE MOVIE",
        excerpt:
          "A familiar Pet Sematary bargain and generous plot disclosure leave the mystery drawer looking empty.",
      },
      {
        at: 1980,
        end: 2099,
        category: "HORROR LORE",
        label: "EVIL DEAD RISE MAY HAVE LEFT A BODY AT THE LAKE",
        excerpt:
          "A familiar-looking lake victim and a returning stunt performer inspire a possible direct connection, not a confirmed one.",
      },
      {
        at: 2100,
        end: 2219,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "DIGITAL DEADITES CRAWL OUT OF WORLD WAR Z",
        excerpt:
          "The ceiling attack moves too quickly and cleanly for hosts who want human stunt work and practical demon meat.",
      },
      {
        at: 2220,
        end: 2339,
        category: "HORROR LORE",
        label: "THREE BOOKS BUILD AN EVIL DEAD ENDGAME",
        excerpt:
          "Rise, 2013, Burn and Wrath become a speculative route toward one connected trilogy and an archaeologist grandfather.",
      },
      {
        at: 2340,
        end: 2459,
        category: "PITCH ROOM",
        label: "OLD MAN ASH WALKS THROUGH THE PORTAL",
        excerpt:
          "The dream ending sends Bruce Campbell through hell with all three books while Sam Raimi gets the impossible directing call.",
      },
      {
        at: 2460,
        end: 2579,
        category: "TIN-FOIL DESK",
        label: "BOB LAZAR ENTERS THE CREDIBILITY OCTAGON",
        excerpt:
          "Consistency, Joe Rogan, fame and decades of repetition fuel a sincere argument over which alien witnesses deserve belief.",
      },
      {
        at: 2580,
        end: 2699,
        category: "MOVIE RECOMMENDATION",
        label: "COMMUNION IS SCARIER THAN ANOTHER DOCUMENTARY",
        excerpt:
          "Christopher Walken and Fire in the Sky beat ghost hunters and light-bill UFO stories in the nightmare draft.",
      },
      {
        at: 2700,
        end: 2819,
        category: "REVIEW DESK",
        label: "THE HULK HOGAN DOCUMENTARY GETS AN EXCELLENT",
        excerpt:
          "A complicated subject receives immediate praise for addressing the tape, marriage, ego and career damage directly.",
      },
      {
        at: 2820,
        end: 2939,
        category: "DEEP DIVE",
        label: "TERRY BOLLEA & HULK HOGAN SHARE ONE BROKEN HOUSE",
        excerpt:
          "The character/person split helps explain the ego without erasing the responsibility of the man who lived inside it.",
      },
      {
        at: 2940,
        end: 3059,
        category: "HEART OF THE SHOW",
        label: "THE BROTHER STORY BREAKS THROUGH THE CHARACTER",
        excerpt:
          "A final request for rent money and an overdose become the documentary's sharpest reminder that the cape never saved everyone.",
      },
      {
        at: 3060,
        end: 3179,
        category: "DEEP DIVE",
        label: "HOW MANY TIMES DOES A PUBLIC FAILURE GET WHIPPED?",
        excerpt:
          "Hogan, Mel Gibson, Chris Brown and Mike Tyson become an uneven argument about punishment, forgiveness and selective outrage.",
      },
      {
        at: 3180,
        end: 3299,
        category: "WRESTLING MEMORY",
        label: "HULK HOGAN STILL OWNS A MOUNT RUSHMORE CORNER",
        excerpt:
          "The man can be condemned while the wrestling character's mainstream impact remains impossible to cut from history.",
      },
      {
        at: 3300,
        end: 3419,
        category: "MOVIE TAKE",
        label: "PASSION OF THE CHRIST 2 GETS A DAY-ONE BELIEVER",
        excerpt:
          "Mel Gibson's direction and the resurrection premise create interest even as the budget, casting and release details stay secondhand.",
      },
      {
        at: 3420,
        end: 3539,
        category: "WWAM UP IN YA",
        label: "PASSION OF THE CHRIST LOSES ITS ENDING TO A FIRST DATE",
        excerpt:
          "A crying companion ends the original screening early before the conversation reaches torture, faith and Quinton Tarantino anatomy.",
      },
      {
        at: 3540,
        end: 3659,
        category: "DEEP DIVE",
        label: "CAN A MEL GIBSON MOVIE ESCAPE THE CULTURE WAR?",
        excerpt:
          "A reported giant budget turns the sequel into a test of faith audiences, movie craft and political sorting.",
      },
      {
        at: 3660,
        end: 3779,
        category: "CREATOR MEMORY",
        label: "THE HOSTS ENTER AS MELISSA BARRERA DEFENDERS",
        excerpt:
          "Before the knives come out, they restate support for her Scream performances and opposition to the firing.",
      },
      {
        at: 3780,
        end: 3899,
        category: "CLAIM CHECK",
        label: "THE BOYCOTT FILE INCLUDES ALLEGED THREATS",
        excerpt:
          "The hosts describe harassment and an FBI-level threat story; this pack records their discussion, not a criminal finding.",
      },
      {
        at: 3900,
        end: 4019,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "SILENCE ABOUT THE THREATS BECOMES THE FIRST CHARGE",
        excerpt:
          "They wanted one public sentence rejecting conduct done in her name and say it never arrived.",
      },
      {
        at: 4020,
        end: 4139,
        category: "DEEP DIVE",
        label: "CELEBRITY POLITICS LOSES THE GOLDEN-VOICE PRIVILEGE",
        excerpt:
          "Actors, voting, foreign aid and Hollywood insulation turn the case into a broader argument about expertise and influence.",
      },
      {
        at: 4140,
        end: 4259,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "PRIVATE SUPPORT IS DECLARED NOT ENOUGH",
        excerpt:
          "Barrera's interview answer about messages without action strikes the room as gratitude being sent straight into a wood chipper.",
      },
      {
        at: 4260,
        end: 4379,
        category: "DEEP DIVE",
        label: "THE GENDER DOUBLE STANDARD GETS A COUNTER-LIST",
        excerpt:
          "Javier Bardem's freedom to speak prompts a rapid list of men the hosts believe also lost work over public positions.",
      },
      {
        at: 4380,
        end: 4499,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "SCREAM 7'S BOX OFFICE IS ACCUSED OF LYING",
        excerpt:
          "Barrera's suspicion about the reported gross produces the segment's first full-volume disbelief.",
      },
      {
        at: 4500,
        end: 4619,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "THE RETURNING CAST GETS CALLED SCABS",
        excerpt:
          "A loaded interview question and a one-hundred-percent answer ignite the show's hardest negative take.",
      },
      {
        at: 4620,
        end: 4739,
        category: "BEST OF THE SHOW",
        label: "FOOD ON THE TABLE BEATS A HOLLYWOOD PICKET LINE",
        excerpt:
          "The response defends actors and crew taking work instead of surrendering a livelihood to someone else's firing.",
      },
      {
        at: 4740,
        end: 4859,
        category: "CREATOR MEMORY",
        label: "NEVE CAMPBELL'S SCREAM 6 ABSENCE RETURNS AS A RECEIPT",
        excerpt:
          "The hosts argue Barrera worked during Campbell's pay dispute, making today's solidarity demand feel one-directional.",
      },
      {
        at: 4860,
        end: 4979,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "THE PRODUCTION COMPANY STARTS WITH A POLITICAL GUEST LIST",
        excerpt:
          "A plan to work with like-minded people is heard as an HR filter built before the company has a movie.",
      },
      {
        at: 4980,
        end: 5099,
        category: "WWAM UP IN YA",
        label: "THE BUSINESS PLAN HAS TWO CENTS & A BUBBLEGUM WRAPPER",
        excerpt:
          "The proposed studio gets a brutally specific capitalization forecast from two men who have not been asked to invest.",
      },
      {
        at: 5100,
        end: 5219,
        category: "DEEP DIVE",
        label: "THE BOOM OPERATOR ENTERS THE SOLIDARITY ARGUMENT",
        excerpt:
          "Movie labor expands beyond stars as the hosts defend every crew member whose paycheck lived inside Scream 7.",
      },
      {
        at: 5220,
        end: 5339,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "THE BOYCOTT FAILS & THE VICTIM STORY SURVIVES",
        excerpt:
          "The hosts hear bitterness that the franchise continued, the movie made money and the online campaign proved small.",
      },
      {
        at: 5340,
        end: 5459,
        category: "CLAIM CHECK",
        label: "ONE DENUNCIATION COULD HAVE CHANGED THE WHOLE INTERVIEW",
        excerpt:
          "The rant closes on a guarded point: condemn threats, keep the political belief and stop turning coworkers into enemies.",
      },
      {
        at: 5460,
        end: 5579,
        category: "TRAILER DESK",
        label: "THE ODYSSEY PUTS GIANTS ON THE LAKERS",
        excerpt:
          "Ships, war, homecoming and huge silhouettes make the culture-war smoke disappear for one gigantic trailer.",
      },
      {
        at: 5580,
        end: 5699,
        category: "MOVIE TAKE",
        label: "THE ODYSSEY TRAILER EARNS A TEN",
        excerpt:
          "A Nolan skeptic calls the trailer epic, mythic and exactly the kind of day-one spectacle a theater should sell.",
      },
      {
        at: 5700,
        end: 5819,
        category: "CLAIM CHECK",
        label: "ELLIOT PAGE AS ACHILLES STAYS A RUMOR",
        excerpt:
          "The hosts discuss an online casting claim, repeatedly admit uncertainty and never see the alleged role in the trailer.",
      },
      {
        at: 5820,
        end: 5939,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "TOM HOLLAND WANDERS IN FROM ANOTHER FRANCHISE",
        excerpt:
          "The battle gear cannot stop Spider-Man energy from making him look soft and badly lost in ancient Greece.",
      },
      {
        at: 5940,
        end: 6059,
        category: "DEEP DIVE",
        label: "MYTHOLOGY MUST BEAT CANDLELIGHT COURT POLITICS",
        excerpt:
          "Sirens, Cyclops and ocean danger are the desired meal; candlelit plotting can stay if it does not eat the monsters.",
      },
      {
        at: 6060,
        end: 6179,
        category: "CREATOR MEMORY",
        label: "TED TURNER MADE THE BRAVES A NATIONAL CHILDHOOD",
        excerpt:
          "Nightly TBS baseball explains why generations far from Atlanta grew up believing the Braves belonged to them.",
      },
      {
        at: 6180,
        end: 6299,
        category: "CREATOR MEMORY",
        label: "MONSTERVISION & WCW SHARE ONE BILLIONAIRE",
        excerpt:
          "Turner's willingness to fund strange, beloved television becomes the connective tissue between horror and wrestling memories.",
      },
      {
        at: 6300,
        end: 6419,
        category: "WRESTLING MEMORY",
        label: "THE MONDAY NIGHT WAR MADE BOTH SHOWS BETTER",
        excerpt:
          "Contracts, counterprogramming and a real alternative gave wrestlers leverage and forced every Monday to matter.",
      },
      {
        at: 6420,
        end: 6539,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "VINCE RUSSO RECEIVES THE COLLAPSE FILE",
        excerpt:
          "AOL, corporate indifference and the worst showrunner in the room all receive blame for WCW's death.",
      },
      {
        at: 6540,
        end: 6659,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "CURRENT WWE CRAWLS AROUND THE RING",
        excerpt:
          "Roman Reigns fatigue, celebrity cutaways and years of failed WrestleMania retries become a funeral for modern wrestling.",
      },
      {
        at: 6660,
        end: 6779,
        category: "POLL RESULT",
        label: "WCW SHOULD HAVE WON, 64 TO 36",
        excerpt:
          "The room votes for the alternate timeline even while admitting Nitro could have found its own spectacular way to fail.",
      },
      {
        at: 6780,
        end: 6899,
        category: "REVIEW DESK",
        label: "MORTAL KOMBAT 2 OPENS AT SEVENTY-FOUR PERCENT",
        excerpt:
          "The critic scan begins with guarded optimism and an explicit warning to decide the movie for yourself.",
      },
      {
        at: 6900,
        end: 7019,
        category: "MOVIE TAKE",
        label: "KARL URBAN MAY BE JACK BURTON WITH FATALITIES",
        excerpt:
          "A review comparing Johnny Cage to Big Trouble in Little China gives the room its most useful reason for hope.",
      },
      {
        at: 7020,
        end: 7139,
        category: "DEEP DIVE",
        label: "MORTAL KOMBAT DOES NOT NEED A DISSERTATION",
        excerpt:
          "Story matters, but the franchise still lives or dies on memorable fighters, blood and a tournament that moves.",
      },
      {
        at: 7140,
        end: 7259,
        category: "MOVIE TAKE",
        label: "THE EXPECTATION LIST HAS THREE FATALITIES",
        excerpt:
          "Well-choreographed action, restrained digital sludge and an emotional Johnny Cage arc would send the hosts home happy.",
      },
      {
        at: 7260,
        end: 7379,
        category: "CREATOR MEMORY",
        label: "THE 1995 THEME REMAINS NON-NEGOTIABLE",
        excerpt:
          "Nostalgia is acknowledged, but the Immortals song still has to enter the arena before the credits.",
      },
      {
        at: 7380,
        end: 7499,
        category: "CREATOR STUDIO",
        label: "THE PATREON TIER PICKS THE NEXT CORPSE",
        excerpt:
          "Derek and his mother receive a warm hello before their requested movie is prepared for public execution.",
      },
      {
        at: 7500,
        end: 7619,
        category: "DEEP DIVE",
        label: "SERIAL KILLING 101 HAS THREE RELEASE YEARS & NO MONEY",
        excerpt:
          "A 1999 festival life, later home-video release and 2004 retitle explain the metadata without improving the camera.",
      },
      {
        at: 7620,
        end: 7739,
        category: "WWAM UP IN YA",
        label: "COREY FELDMAN HIDES INSIDE THE SPORTING-GOODS AISLE",
        excerpt:
          "The supposed secret weapon wears fake teeth and sells murder equipment for five genuinely competent minutes.",
      },
      {
        at: 7740,
        end: 7859,
        category: "REVIEW DESK",
        label: "LISA LOEB GOES BACK TO HIGH SCHOOL AT THIRTY-ONE",
        excerpt:
          "The goth accomplice, Marilyn Manson fixation and serial-killer training plan sound much better than they play.",
      },
      {
        at: 7920,
        end: 8039,
        category: "TRAILER DESK",
        label: "THE TRAILER IDENTIFIES THE KILLER BEFORE THE REVIEW CAN",
        excerpt:
          "A complete plot, Thomas Haden Church and a ten-second Feldman appearance make ninety minutes suddenly unnecessary.",
      },
      {
        at: 8040,
        end: 8159,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "THE SEX SCENE ENDS AT THE BELLY-BUTTON RING",
        excerpt:
          "Two kisses, prolonged jewelry attention and one impossible edit create the least convincing orgasm in the archive.",
      },
      {
        at: 8160,
        end: 8279,
        category: "BEST OF THE SHOW",
        label: "THE MOVIE ACCIDENTALLY FINDS ONE GREAT MONOLOGUE",
        excerpt:
          "A school-counselor eruption jumps from bargain-bin acting to real anger so abruptly the hosts check the dimension.",
      },
      {
        at: 8280,
        end: 8399,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "THE SERIAL KILLER IS OBVIOUS BEFORE HOMEROOM",
        excerpt:
          "A mystery cannot survive when the only adult acting like a murderer is also the only adult with star billing.",
      },
      {
        at: 8400,
        end: 8519,
        category: "WWAM UP IN YA",
        label: "THE DETECTIVE FARTS THE CASE WIDE OPEN",
        excerpt:
          "An old cop breaks a briefing with gas and earns one of the few laughs the screenplay appears to intend.",
      },
      {
        at: 8520,
        end: 8639,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "THE CAMERA HAS A DYING BATTERY & NO UNION CARD",
        excerpt:
          "Faces leave the frame, the school has eight students and every shot looks borrowed until Thursday.",
      },
      {
        at: 8640,
        end: 8759,
        category: "SCOREBOARD",
        label: "SERIAL KILLING 101 GETS A FOUR & A TWO",
        excerpt:
          "One score rewards time-capsule weirdness; the other rewards Feldman for showing up and little else.",
      },
      {
        at: 8760,
        end: 8879,
        category: "WWAM UP IN YA",
        label: "FELDMAN WALKS OFF SET HAVING SAVED CINEMA",
        excerpt:
          "A good tiny role becomes an imagined victory lap over DiCaprio, Depp, Titanic and every glitter jacket in storage.",
      },
      {
        at: 8880,
        end: 8999,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "COUNT DOOKU WASTES CHRISTOPHER LEE",
        excerpt:
          "Attack of the Clones gets some mercy until a cape, weak backstory and premium actor receive a Sith audit.",
      },
      {
        at: 9000,
        end: 9099,
        category: "CREATOR STUDIO",
        label: "HOUSEMAID GETS THE NEW MICROPHONES",
        excerpt:
          "The first upgraded commentary turns a soap-opera thriller into a catty revenge summit with much cleaner audio.",
      },
      {
        at: 9100,
        end: 9180,
        category: "WWAM UP IN YA",
        label: "MEXICAN CACTUS PUTS THE MAILBAG ON FIRE",
        excerpt:
          "Matthew Lillard casting immediately yields to extra-spicy dinner, diarrhea and hemorrhoid diplomacy.",
      },
      {
        at: 9181,
        end: 9228,
        category: "CHARACTER PERFORMANCE",
        characters: ["Dr. Loomis"],
        label: "LOOMIS WEAPONIZES FRIDAY THE 13TH'S PSYCHIC GIRL",
        excerpt:
          "A direct Loomis prompt gets an immediate plan to burst Michael's mask, face and unfortunately small anatomy.",
      },
      {
        at: 9230,
        end: 9359,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "EVIL DEAD BURN TURNS THE CAMERA OFF FOR TEN MINUTES",
        excerpt:
          "A reported darkness sequence sounds bold to one host and like paying for a dead battery to the other.",
      },
      {
        at: 9360,
        end: 9479,
        category: "WWAM UP IN YA",
        label: "HOSTEL'S FIST BUMP CROSSES THE FRIENDSHIP LINE",
        excerpt:
          "Sharing one woman in a foreign country is ruled less spring break and more invitation-only Diddy logistics.",
      },
      {
        at: 9480,
        end: 9599,
        category: "COMMUNITY MEMORY",
        label: "SLEEPAWAY CAMP & HALLOWEEN LOSE FAMILIAR FACES",
        excerpt:
          "The room pauses the filth to remember recent actor deaths discussed in chat and the Sheriff Meeker legacy.",
      },
      {
        at: 9600,
        end: 9719,
        category: "HORROR LORE",
        label: "MICHAEL MYERS & PINHEAD WIN THE INTERESTING FILE",
        excerpt:
          "One unknowable suburban snap competes with a World War I veteran who opened the wrong pleasure box.",
      },
      {
        at: 9720,
        end: 9839,
        category: "HEART OF THE SHOW",
        label: "PERCY TURNS TWENTY-ONE WITHOUT DRIVING THE BUDWEISER",
        excerpt:
          "A sincere birthday toast permits the party, forbids the drive and wishes his anatomy a disease-free future.",
      },
      {
        at: 9854,
        end: 9869,
        category: "CHARACTER PERFORMANCE",
        characters: ["Dr. Loomis"],
        label: "LOOMIS DELIVERS A FIFTEEN-SECOND STD BLESSING",
        excerpt:
          "A direct birthday request receives congratulations, bar advice and no unnecessary Michael Myers detour.",
      },
      {
        at: 9870,
        end: 9999,
        category: "HORROR LORE",
        label: "PROFESSOR KNOWBY GETS AN HBO PREQUEL",
        excerpt:
          "A fan pitch about finding the book and fighting his wife becomes a six-episode Evil Dead idea worth keeping.",
      },
      {
        at: 10000,
        end: 10119,
        category: "WWAM UP IN YA",
        label: "EARL THE DOG EATS CIGARETTES & DOORDASH BEER",
        excerpt:
          "Indiana's alternate name comes with a real canine legend who treated nicotine and delivery alcohol as kibble.",
      },
      {
        at: 10120,
        end: 10239,
        category: "MOVIE TAKE",
        label: "BLOODSPORT FIGHTS DIE HARD THROUGH KICKBOXER",
        excerpt:
          "One host keeps Bloodsport outright; the other saves Die Hard because Van Damme still has a parallel universe.",
      },
      {
        at: 10240,
        end: 10359,
        category: "SCOREBOARD",
        label: "LOGAN LEADS THE SUPERHERO FIVE",
        excerpt:
          "Logan and Endgame top a stack containing Infinity War, No Way Home and Spider-Man 2.",
      },
      {
        at: 10360,
        end: 10479,
        category: "COMMUNITY MEMORY",
        label: "SHERIFF MEEKER MAKES EIGHTY-ONE LOOK LIKE A WIN",
        excerpt:
          "The Halloween 4 actor's reported age turns mourning into a grateful salute to a full run.",
      },
      {
        at: 10480,
        end: 10517,
        category: "CREATOR MEMORY",
        label: "TEN YEARS OF WWAM TURNS KIDS INTO GRADUATES",
        excerpt:
          "A longtime viewer's timeline makes the hosts feel ancient and proud that anybody ignored their early advice.",
      },
      {
        at: 10518,
        end: 10564,
        category: "CHARACTER PERFORMANCE",
        characters: ["Dr. Loomis", "Dr. Challis"],
        label: "LOOMIS & CHALLIS FIGHT FOR THE DOCTOR TITLE",
        excerpt:
          "A direct duel request gets two immediate personas: Michael-focused discipline versus boiler-maker indifference.",
      },
      {
        at: 10565,
        end: 10679,
        category: "HEART OF THE SHOW",
        label: "GIGGLE BUSH OPENS A BEAUTIFUL MIND",
        excerpt:
          "Weed anxiety leads into honest advice: enjoy twenty-one, learn a useful skill and ignore anyone demanding a finished life plan.",
      },
      {
        at: 10680,
        end: 10799,
        category: "FIGHT CARD",
        label: "SHAQ, KOBE, TUPAC & EMINEM ENTER THE BRACKET",
        excerpt:
          "A one-on-one basketball problem becomes a rap argument before reboot Michael gets Carrie White.",
      },
      {
        at: 10800,
        end: 10919,
        category: "DREAM CAST",
        label: "ANTHONY STARR BECOMES FREDDY KRUEGER",
        excerpt:
          "Homelander's smile, cruelty and barely hidden menace make the casting answer immediate and unanimous.",
      },
      {
        at: 10920,
        end: 11019,
        category: "CREATOR DNA",
        label: "FORTY-FOUR SUPERCHATS APPEAR AT HOUR THREE",
        excerpt:
          "The hosts realize the clock is wrecked, blame the Barrera trial and promise every remaining receipt gets read.",
      },
      {
        at: 11022,
        end: 11055,
        category: "CHARACTER PERFORMANCE",
        characters: ["Dr. Challis"],
        label: "CHALLIS DEFEATS ALCOHOLISM WITH BLOOD PRESSURE",
        excerpt:
          "A direct sobriety question gets an in-character medical update, a superior-machine boast and one clinical insult.",
      },
      {
        at: 11056,
        end: 11179,
        category: "STRAIGHT TO STEVE'S ASSHOLE",
        label: "BARRERA'S AGENT ENTERS THE PANIC ROOM",
        excerpt:
          "The mailbag briefly reopens the interview and predicts a public-relations team staring into the middle distance.",
      },
      {
        at: 11180,
        end: 11299,
        category: "WWAM UP IN YA",
        label: "CANDLE WAX TURNS ORAL SEX INTO HOBBY LOBBY",
        excerpt:
          "A marital question receives esophagus warnings, melted craft-store imagery and a firm no from both doctors.",
      },
      {
        at: 11300,
        end: 11419,
        category: "MOVIE TAKE",
        label: "THE NEW TEXAS CHAIN SAW DIRECTOR GETS CAUTIOUS TRUST",
        excerpt:
          "Source-material respect helps, a family focus worries, and reported Obsession buzz earns temporary carte blanche.",
      },
      {
        at: 11420,
        end: 11539,
        category: "COMMUNITY WIRE",
        label: "A DRUNK UK VIEWER ARRIVES AFTER THE PARTY",
        excerpt:
          "The time zone loses, the audience wins and Stu still does not survive the television dropped on his head.",
      },
      {
        at: 11540,
        end: 11659,
        category: "WWAM UP IN YA",
        label: "TOM HOLLAND FAILS THE ARNOLD GIRLY-MAN TEST",
        excerpt:
          "Uncharted, modern action stardom and cross-dressing get processed through a deeply 1980s measuring device.",
      },
      {
        at: 11682,
        end: 11827,
        category: "CHARACTER PERFORMANCE",
        characters: ["Dr. Challis", "Dr. Loomis"],
        label: "CHALLIS SERVES THE WHAT-WHAT-BUTT WARRANT",
        excerpt:
          "A direct dual-character setup becomes a full restraining-order scene, filthy underwear trial and Michael Myers playlist.",
      },
      {
        at: 11828,
        end: 11939,
        category: "DEEP DIVE",
        label: "EVIL DEAD NEEDS A MALE FINAL GUY ONCE",
        excerpt:
          "Three recent women-led films prompt a fair representation counterpoint: horror has historically underserved surviving men.",
      },
      {
        at: 11940,
        end: 12059,
        category: "MOVIE TAKE",
        label: "KARL URBAN CAN STILL GROW INTO JOHNNY CAGE",
        excerpt:
          "Kano may be the obvious fit, but a versatile actor gets the benefit of the trailer until the full movie lands.",
      },
      {
        at: 12060,
        end: 12179,
        category: "MOVIE TAKE",
        label: "SERIOUS EVIL DEAD WINS THE TONE VOTE",
        excerpt:
          "Decades of Ash comedy create room for a meaner franchise lane without pretending the old sauce was wrong.",
      },
      {
        at: 12180,
        end: 12299,
        category: "HEART OF THE SHOW",
        label: "TEND THE GARDEN THE INJURY CANNOT TOUCH",
        excerpt:
          "A viewer in a physical rut gets unusually grounded advice about temporary pain, future perspective and nonphysical growth.",
      },
      {
        at: 12300,
        end: 12419,
        category: "DEEP DIVE",
        label: "DOOKU FINALLY GETS QUI-GON IN HIS BACKSTORY",
        excerpt:
          "Yoda, Qui-Gon and council resentment supply the tragedy Attack of the Clones left outside Christopher Lee's cape.",
      },
      {
        at: 12420,
        end: 12530,
        category: "CLAIM CHECK",
        label: "DOOMSDAY KILLS LEGACY HEROES, MAYBE",
        excerpt:
          "Tobey Maguire, Fox X-Men and Doom enter a clearly labeled rumor about Marvel clearing its old continuity.",
      },
      {
        at: 12531,
        end: 12562,
        category: "CHARACTER PERFORMANCE",
        characters: ["Dr. Challis"],
        label: "CHALLIS INVENTS BUFFALO SOBER",
        excerpt:
          "A direct character jab receives twelve beers, two mothers and a Buffalo Sabres signoff as the new moderation standard.",
      },
      {
        at: 12563,
        end: 12590,
        category: "CHARACTER PERFORMANCE",
        characters: ["Corey Feldman"],
        label: "FELDMAN GIVES MICHAEL JACKSON THE MOONWALK",
        excerpt:
          "A direct Feldman prompt gets the persona's obvious explanation: the biopic could not admit who invented the dancing.",
      },
      {
        at: 12591,
        end: 12699,
        category: "CREATOR DNA",
        label: "THE SUPERCHAT LEDGER FINALLY HITS ZERO",
        excerpt:
          "The room celebrates, checks both payment lanes and discovers that one last pile is still hiding above the scroll.",
      },
      {
        at: 12718,
        end: 12771,
        category: "CHARACTER PERFORMANCE",
        characters: ["Mark Wahlberg / Marky Mark"],
        label: "MARKY MARK BREAKS RENE ZELLWEGER'S CHERRY'S CAR",
        excerpt:
          "A direct Marky Moo prompt becomes a Fear recap involving Bush, sandwiches, a roller coaster and aggressive finger-banging.",
      },
      {
        at: 12774,
        end: 12791,
        category: "CHARACTER PERFORMANCE",
        characters: ["Slenderman"],
        label: "SLENDERMAN ORDERS THE FOOT-LONG TERIYAKI",
        excerpt:
          "A direct Subway request gets turkey, chicken teriyaki and the shortest useful lifestyle improvement of the night.",
      },
      {
        at: 12793,
        end: 12827,
        category: "WWAM UP IN YA",
        label: "LEATHERFACE CANNOT EAT ASS WITHOUT THE MASK",
        excerpt:
          "A filthy prompt produces one duty-brown line before the performer admits the voice cannot survive barefaced.",
      },
      {
        at: 12828,
        end: 12927,
        category: "HEART OF THE SHOW",
        label: "THE THREE-HOUR-THIRTY-FOUR GOODBYE ARRIVES",
        excerpt:
          "Mortal Kombat plans, gratitude, the algorithm and a final anatomy correction finally point toward the door.",
      },
      {
        at: 12928,
        end: 13043,
        category: "LAST WORD",
        label: "BUSH PLAYS SIX SECONDS INTO THE AFTERLIFE",
        excerpt:
          "The signoff reopens for the best Bush song, a copyright-safe pause and one final promise that life will be awesome.",
      },
    ]),

    panels: Object.freeze([
      Object.freeze({
        id: "format-ledger",
        type: "verdict-ledger",
        eyebrow: "HOW THIS 3:37 BEAST ACTUALLY MOVES",
        title: "THE SHOW FORMAT, WITHOUT THE MACHINE CHAPTER GIBBERISH",
        intro:
          "This is an open-line movie-news show that mutates twice: first into a requested-movie review, then into a long community aftershow. These are editorial windows, not rigid YouTube chapters.",
        items: freezeRows([
          {
            at: 0,
            end: 1499,
            subject: "Cold open and creator life",
            verdict:
              "Chat discipline, puppy plans, games, aliens, old interviews and celebrity embarrassment build the room before the first trailer.",
          },
          {
            at: 1500,
            end: 3599,
            subject: "Trailer desk and documentary desk",
            verdict:
              "Evil Dead Burn receives a two-trailer deep dive; alien talk bridges into a substantive Hulk Hogan documentary review and Passion discussion.",
          },
          {
            at: 3600,
            end: 5459,
            subject: "Scream grievance court",
            verdict:
              "The Melissa Barrera interview becomes a forty-minute opinion trial. It is the show's longest single argument and should not be mistaken for neutral reporting.",
          },
          {
            at: 5460,
            end: 7379,
            subject: "Trailer, memory and preview desk",
            verdict:
              "The Odyssey trailer resets the mood, Ted Turner opens a baseball-and-wrestling memorial, and Mortal Kombat 2 gets a critic preview before the hosts see it.",
          },
          {
            at: 7380,
            end: 8999,
            subject: "Patreon review",
            verdict:
              "Serial Killing 101 gets setup, trailer, autopsy, scores and a Corey Feldman lore coda. This is the show's only finished-film review.",
          },
          {
            at: 9000,
            end: 13043,
            subject: "Community aftershow and character room",
            verdict:
              "Superchats, matchups, advice, diarrhea and nine confirmed persona stops run all the way through the false goodbye and Bush post-roll.",
          },
        ]),
      }),
      Object.freeze({
        id: "verdict-ledger",
        type: "verdict-ledger",
        eyebrow: "THE PRAISE, PANIC & SENTENCES",
        title: "WHAT THEY ACTUALLY THOUGHT",
        intro:
          "Trailer excitement is not a finished-film score, a critic scan is not their own review, and an explicit two or four is not a mood. This ledger keeps those differences visible.",
        items: freezeRows([
          {
            at: 1500,
            end: 2399,
            subject: "Evil Dead Burn trailers",
            verdict:
              "Excited overall. The action, gore and possible Rise connection work; the apparent plot dump and digital ceiling deadites worry them.",
          },
          {
            at: 2700,
            end: 3299,
            subject: "The Hulk Hogan documentary",
            verdict:
              "Excellent. It adds human context and accountability without pretending the racist tape, infidelity and other damage did not happen.",
          },
          {
            at: 3300,
            end: 3659,
            subject: "Passion of the Christ and its reported sequel",
            verdict:
              "The original is praised for craft and intensity. The sequel is a day-one curiosity because of Gibson's direction; production details discussed here remain secondhand.",
          },
          {
            at: 3660,
            end: 5459,
            subject: "Melissa Barrera's interview",
            verdict:
              "Straight to Steve. They defend her right to her position and still condemn the interview's scab language, box-office suspicion, silence about alleged threats and political hiring plan.",
          },
          {
            at: 5460,
            end: 6059,
            subject: "The Odyssey trailer",
            verdict:
              "Ten out of ten as a trailer. The scale and mythology crush; Tom Holland looks out of place, and unverified casting talk does not become a production fact.",
          },
          {
            at: 6060,
            end: 6779,
            subject: "Ted Turner and WCW",
            verdict:
              "A warm legacy verdict. Turner helped make Braves fandom national and kept WCW alive; the room votes 64% that wrestling would be better if Nitro had won.",
          },
          {
            at: 6540,
            end: 6659,
            subject: "Current WWE",
            verdict:
              "Buried. Repetitive main-event language, celebrity cutaways and years of failed re-entry attempts leave one host calling it nearly unwatchable.",
          },
          {
            at: 6780,
            end: 7379,
            subject: "Mortal Kombat 2",
            verdict:
              "Hopeful preview only. They have not seen it yet; the desired outcome is practical-looking violence, useful character emotion and the original theme.",
          },
          {
            at: 7380,
            end: 8879,
            subject: "Serial Killing 101 / Serial Killing for Dummies",
            verdict:
              "Four and two. Time-capsule weirdness, Thomas Haden Church and a good Feldman cameo survive; acting, framing, editing and mystery construction do not.",
          },
          {
            at: 8880,
            end: 8999,
            subject: "Attack of the Clones and Count Dooku",
            verdict:
              "The prequel looks better beside newer Star Wars, but Christopher Lee deserved a richer Sith and the Anakin-Padme chemistry still feels forced.",
          },
          {
            at: 9000,
            end: 9099,
            subject: "The Housemaid",
            verdict:
              "A decent movie and an entertaining commentary subject. The hosts get invested enough to become catty about revenge logistics.",
          },
          {
            at: 9230,
            end: 9359,
            subject: "Evil Dead Burn's reported darkness sequence",
            verdict:
              "Split. One host likes the nerve; the other does not want to buy a visual ticket for ten minutes of imagination.",
          },
          {
            at: 9870,
            end: 9999,
            subject: "Ghostbusters franchise",
            verdict:
              "One and two are the pinnacle; 2016 goes straight to Steve; Afterlife's Ramis tribute works; Frozen Empire disappoints.",
          },
          {
            at: 10120,
            end: 10239,
            subject: "Bloodsport versus Die Hard",
            verdict:
              "Split by redundancy. One keeps Bloodsport forever; the other keeps Die Hard because Kickboxer can preserve Van Damme's lane.",
          },
          {
            at: 10800,
            end: 10919,
            subject: "Anthony Starr as Freddy Krueger",
            verdict:
              "The night's cleanest dream casting. Homelander's menace makes the answer immediate.",
          },
          {
            at: 12060,
            end: 12179,
            subject: "Serious versus comedic Evil Dead",
            verdict:
              "Serious horror wins the current vote. Decades of Ash comedy have already earned room for a meaner branch.",
          },
        ]),
      }),
      Object.freeze({
        id: "claim-boundary-ledger",
        type: "verdict-ledger",
        eyebrow: "THE RECEIPTS STAY IN THEIR LANE",
        title: "WHAT THIS TAPE DOES -- AND DOES NOT -- ESTABLISH",
        intro:
          "News links, rumors, health claims and conspiracy theories move fast here. The episode proves that the hosts discussed them; it does not magically authenticate every thing discussed.",
        items: freezeRows([
          {
            at: 720,
            end: 899,
            subject: "The hantavirus cruise-ship story",
            verdict:
              "The health and transmission figures are repeated from the on-air item and joked about. This archive does not provide medical guidance or independent outbreak verification.",
          },
          {
            at: 1140,
            end: 1499,
            subject: "Alien disclosure, AI and Project Blue Beam",
            verdict:
              "Theories, predictions and jokes. No alien body, government collaboration, future human or fake invasion is established by this show.",
          },
          {
            at: 1500,
            end: 2399,
            subject: "Evil Dead Burn connections",
            verdict:
              "The trailers are real viewing material inside the show. The Rise link, grandfather identity, three-book structure, Ash ending and Raimi return are host speculation.",
          },
          {
            at: 2400,
            end: 2699,
            subject: "Bob Lazar, Travis Walton and alien witnesses",
            verdict:
              "The hosts debate credibility and consistency. The tape establishes their opinions, not the truth or falsity of any abduction or government claim.",
          },
          {
            at: 2700,
            end: 3299,
            subject: "Hulk Hogan biography",
            verdict:
              "Family, finances, conduct and wrestling claims are recapped from the documentary and host memory. This pack does not independently audit private records.",
          },
          {
            at: 3300,
            end: 3659,
            subject: "The Passion sequel",
            verdict:
              "Budget, structure, casting and release timing are discussed as reported details. The archive makes no production-status guarantee.",
          },
          {
            at: 3660,
            end: 5459,
            subject: "Melissa Barrera, Spyglass and the Scream campaign",
            verdict:
              "This is an opinion response to an interview. Alleged threats, FBI involvement, box-office accounting, motives and career effects remain attributed claims, not findings by this archive.",
          },
          {
            at: 5700,
            end: 5819,
            subject: "Elliot Page and Achilles",
            verdict:
              "The hosts call the casting talk a rumor and say they do not know the role. The trailer does not verify it for them.",
          },
          {
            at: 6060,
            end: 6779,
            subject: "Ted Turner and WCW history",
            verdict:
              "The media impact is discussed from lived memory and public reputation. Jokes about billionaire skeletons are jokes, not allegations.",
          },
          {
            at: 6780,
            end: 7379,
            subject: "Mortal Kombat 2 critic reactions",
            verdict:
              "The quoted reviews belong to the critics being read. The hosts' own film verdict is explicitly pending tomorrow's screening.",
          },
          {
            at: 7380,
            end: 8879,
            subject: "Serial Killing 101 release history and Feldman lore",
            verdict:
              "The review and scores are direct host opinion. Career stories about Depp, DiCaprio, Titanic and Feldman's self-belief are comedic lore, not adjudicated casting history.",
          },
          {
            at: 9480,
            end: 9599,
            subject: "Deaths discussed in the mailbag",
            verdict:
              "The hosts react to reports about Ted Turner, Beau Starr and another performer. This pack does not replace an obituary or official notice.",
          },
          {
            at: 11828,
            end: 11939,
            subject: "Gender and Evil Dead protagonists",
            verdict:
              "The exchange is a preference discussion about recent franchise leads, not a claim about who is qualified to carry a horror movie.",
          },
          {
            at: 12420,
            end: 12530,
            subject: "Marvel's rumored Doomsday opening",
            verdict:
              "Legacy-character deaths, Fox X-Men and Doom appeasement are clearly framed as online rumor and prediction.",
          },
          {
            at: 11682,
            end: 11827,
            subject: "The restraining-order incident",
            verdict:
              "Loomis, Challis, underwear evidence and the butt song are an improvised fictional character scene. Nobody filed paperwork.",
          },
        ]),
      }),
      Object.freeze({
        id: "character-ledger",
        type: "character-ledger",
        eyebrow: "THE VOICES THAT ACTUALLY ANSWERED",
        title: "NINE PERFORMANCE STOPS, ZERO NAME-DROP INFLATION",
        items: freezeRows([
          {
            at: 9181,
            end: 9228,
            character: "Dr. Loomis",
            label: "THE PSYCHIC-GIRL WEAPON",
          },
          {
            at: 9854,
            end: 9869,
            character: "Dr. Loomis",
            label: "THE DISEASE-FREE BIRTHDAY",
          },
          {
            at: 10518,
            end: 10564,
            character: "Dr. Loomis / Dr. Challis",
            label: "THE DOCTOR DEATH MATCH",
          },
          {
            at: 11022,
            end: 11055,
            character: "Dr. Challis",
            label: "THE BLOOD-PRESSURE DEFENSE",
          },
          {
            at: 11682,
            end: 11827,
            character: "Dr. Challis / Dr. Loomis",
            label: "THE BUTT-SONG RESTRAINING ORDER",
          },
          {
            at: 12531,
            end: 12562,
            character: "Dr. Challis",
            label: "BUFFALO SOBER",
          },
          {
            at: 12563,
            end: 12590,
            character: "Corey Feldman",
            label: "THE MICHAEL JACKSON DANCE RECEIPT",
          },
          {
            at: 12718,
            end: 12771,
            character: "Mark Wahlberg / Marky Mark",
            label: "THE FEAR ROLLER-COASTER CONFESSION",
          },
          {
            at: 12774,
            end: 12791,
            character: "Slenderman",
            label: "THE TERIYAKI LIFE PLAN",
          },
        ]),
        note:
          "Every item begins with a direct persona request or unmistakable character setup and an immediate in-character answer. Ordinary Corey Feldman discussion during the movie review is not counted. The Leatherface request at 3:33:13 is excluded because the attempted voice is immediately abandoned and explicitly described as impossible without the mask. Captions are not speaker-diarized, so this ledger does not assign a performer to Mike or J.",
      }),
    ]),

    fanRead: Object.freeze({
      loved: Object.freeze({
        label: "THE NIGHT'S CLEANEST WIN",
        topic: "The Odyssey trailer",
        body:
          "At 1:33:00, the room leaves grievance court and watches Nolan put ships, gods, giants and homecoming on a giant canvas. Even a Nolan skeptic calls the trailer ten out of ten. Tom Holland and unconfirmed casting chatter get caveats; the scale gets the ticket.",
        at: 5580,
        end: 6059,
        playAt: 5580,
        playEnd: 6059,
      }),
      hated: Object.freeze({
        label: "STRAIGHT TO STEVE'S ASSHOLE",
        topic: "Serial Killing 101",
        body:
          "At 2:15:00, the requested review stops being polite. The acting jumps dimensions, the camera loses faces, the mystery dies in homeroom and the detective farts. Scores: four and two. Feldman's five good minutes cannot save the other ninety.",
        at: 8100,
        end: 8879,
        playAt: 8100,
        playEnd: 8879,
      }),
      wildestDetour: Object.freeze({
        label: "WWAM UP IN YA",
        topic: "The Loomis-Challis restraining-order musical",
        body:
          "At 3:14:42, Challis arrives as an officer of the law, Loomis denies touching Lee's crusty underwear and 'What What (In the Butt)' becomes evidence, Christmas music and Michael Myers' murder soundtrack. The warrant never had a chance.",
        at: 11682,
        end: 11827,
        playAt: 11682,
        playEnd: 11827,
      }),
      lastWord: Object.freeze({
        label: "THE LAST WORD",
        topic: "Bush after dark",
        body:
          "At 3:35:28, a completed signoff reopens so the best Bush song can play for six seconds at a time. The anatomy gets clarified, the band beats the body part and the final caption promises that life is going to be awesome.",
        at: 12928,
        end: 13043,
        playAt: 12928,
        playEnd: 13043,
      }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-07-30",
    sources: Object.freeze(sources),
  });
}("undefined" !== typeof window ? window : globalThis));
