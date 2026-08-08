(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "x7ugsiecMio";
  var duration = 5856;
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

  /* July 16, 2024: Mike alone in the room for a Longlegs spoiler talk. The
     solo format is the point: a horror movie becomes a poll, a Cage argument,
     a Richard Simmons memorial, a dating pep talk, and one catastrophic trip
     into a Lowe's flat cart. */
  var highlights = [
    H(0,180,"ROOM BREAK","STREAMYARD ALMOST KILLS THE SOLO SHOW","The feed stutters before it starts, Mike gets briefly convinced the platform is personally afraid of him, and the opening turns the technical wobble into a welcome."),
    H(180,360,"FAM SIGNAL","THE SOLO FAM ROLL CALL","Gary, Joe, Michael, Iron Wolf, Stacy, Clinton, JT Customs, Robin Barker, and the familiar room get called out before the Longlegs spoiler door opens."),
    H(360,540,"STRAIGHT TO STEVE'S ASSHOLE","THE SOLO STREAM NEEDS A LITTLE CHEMISTRY","Mike jokes about doing a solo show in the dark and relying on a questionable spray to extend the night. The public receipt keeps the filthy implication playful, not anatomical."),
    H(540,720,"FILM READ","LONGLEGS VERSUS MAXXXINE AS A DOUBLE FEATURE","A fan asks which movie to see first. Mike sends them to Longlegs before Maxxxine, then admits the mood of the walk out matters as much as the ranking."),
    H(720,900,"FILM READ","THE KENTUCKY THEATER MAKES THE HORROR LOUDER","Mike describes taking his thirteen-year-old to the Kentucky Theater, where vaulted ceilings and a frightening sound mix turn a movie outing into part of the review."),
    H(900,1080,"FILM READ","THE HYPE IS NOT THE SCARIEST MOVIE OF THE DECADE","The solo verdict arrives early: Longlegs is creepy and memorable, but calling it the scariest movie of the decade is an expectation trap that sets the audience up to resent it."),
    H(1080,1260,"TAKE GETS NUCLEAR","BLACKCOAT'S DAUGHTER AND THE MARKETING PROBLEM","Mike compares Longlegs with Oz Perkins's slow-burn The Blackcoat's Daughter and explains how a niche movie can be marketed as a mainstream event without the film itself changing."),
    H(1260,1440,"FAM SIGNAL","THE FIRST LONGLEGS POLL: COULD CAGE DO THAT TO HIMSELF?","The chat votes on the film's most grisly question. Mike admits he does not know whether the self-inflicted death is physically plausible and lets the room argue it out."),
    H(1440,1620,"SOUNDBYTE / REPLAY","THE BIRTHDAY SONG THAT GOES ON TOO LONG","Mike's favorite laugh comes from Cage singing the birthday song, the television being cut off, and a detective answering with an absurdly precise duration. The scene is catalogued as comic tension, not a quote dump."),
    H(1620,1800,"SOUNDBYTE / REPLAY","NOT ONCE, NOT TWICE, BUT CONSTANTLY","The room replays the cadence of Longlegs's threat and Mike loses the plot laughing. The joke is the rhythm and the escalating repetition, not a reproduced screenplay passage."),
    H(1800,1980,"CHARACTER READ","CAGE'S SCREAM HAS A SIGNATURE","Mike traces the strange upward turn at the end of Cage's scream through Longlegs, The Unbearable Weight of Massive Talent, and the actor's karaoke-adjacent energy."),
    H(1980,2160,"FAM SIGNAL","THE MYSTERY-NIGHT MOVIE ERA","A 1990s cable-memory detour explains why Longlegs might have landed harder without trailers, social media, or a week of people promising a masterpiece."),
    H(2160,2340,"FILM READ","THE FBI PROCEDURAL DOESN'T HAVE ENOUGH LIBRARY SCENES","Mike says the investigation lacks the satisfying procedural texture of Se7en, Silence of the Lambs, or Zodiac. The criticism is precise: the puzzles arrive, but the work of solving them rarely becomes a set piece."),
    H(2340,2520,"STRAIGHT TO STEVE'S ASSHOLE","THE MOM, THE DOLLS, AND THE AGENT WHO JUST SITS THERE","The ending's family-house reveal makes Mike furious because Agent Harker recognizes the danger and still waits for the murder to happen. His verdict: the clairvoyant FBI agent commits the worst possible spectator move."),
    H(2520,2700,"FAN SIGNAL","THE CHAT DISAGREES ABOUT THE LAST ACT","Fans cite predictability, a missing cult feeling, and a final act that is too satanic for them. Mike acknowledges every complaint before explaining why the bleakness fits the movie."),
    H(2700,2880,"NEWS REACTION","WHY THE CINEMA SCORE WAS A C+","Mike explains the unusually low CinemaScore as a collision between horror expectations, religious discomfort, and viewers who interpreted the final wink as agreement with the villain."),
    H(2880,3060,"TAKE GETS NUCLEAR","THE OSCARS ARE A ROOM FULL OF FART HEADS","The Cage Oscar question turns into a broader argument about horror being ignored by awards bodies. Toni Collette, Mia Goth, and Oz Perkins get named as people the system keeps leaving outside the party."),
    H(3060,3240,"FILM READ","THE LONGLEGS PREQUEL POLL","Mike asks whether fans want a prequel. The vote favors more Longlegs mythology, provided Perkins and Cage return and the new film has a reason to exist beyond franchise hunger."),
    H(3240,3420,"VERDICT","MAIKA MONROE'S PERFORMANCE GETS A CHECK, NOT A CROWN","Mike says Monroe is fine and fits the role, but thinks the internet is overselling the performance. His issue is not the acting; it is the claim that the part demanded more than the film actually gives her."),
    H(3420,3600,"FILM READ","THE SHOTGUN, THE DOLL, AND THE SILENCE OF THE LAMBS ECHO","The family-house sequence gets a second pass: a weapon, a child-sized doll, and Harker's realization that she has to confront her mother. The scene works because the movie makes the rescue morally late."),
    H(3600,3780,"FILM READ","PINHEAD, MICHAEL, AND THE HORROR CROSSOVER MIKE WOULD ACTUALLY WATCH","Asked to build an all-star horror movie, Mike rejects a convention-poster pileup and instead pitches Pinhead as a guide through a Dante's Inferno-style hell where the loose monsters have to be collected."),
    H(3780,3960,"NEWS REACTION","ALIEN: ROMULUS HYPE BREAKS THROUGH","The Evil Dead 2013 director, Ridley Scott's enthusiasm, and a promise of hard-edged creature work make Alien: Romulus the night's most anticipated upcoming film."),
    H(3960,4140,"STRAIGHT TO STEVE'S ASSHOLE","MARK WAHLBERG'S 2:30 A.M. SCHEDULE GETS PUT ON TRIAL","A viral celebrity routine becomes a parenting indictment: prayer, golf, snacks, cryo, and an early bedtime sound less like discipline than a plan to avoid seeing your own children."),
    H(4140,4320,"FILM READ","NEON VERSUS A24: CROISSANT CINEMA COURT","Mike compares Neon titles like Parasite, Possessor, Infinity Pool, and Longlegs with A24's Blackcoat's Daughter, Pearl, X, Talk to Me, Green Room, and Uncut Gems. His ruling: Neon is more complex; A24 has more bangers."),
    H(4320,4500,"FAM SIGNAL","RICHARD SIMMONS AND SHANNON DOHERTY GET A REAL GOODBYE","A difficult news week gives way to genuine grief. Mike asks the room to remember Simmons for joy and Doherty for the connection people felt before the internet swallowed the moment."),
    H(4500,4680,"SOUNDBYTE / REPLAY","THE RED-DRESS PARKING-LOT MYSTERY","At a roller derby event, Mike sees a parking lot full of people in red dresses, hears someone yell that a picture lasts longer, and cannot understand why a public costume event is offended by being seen."),
    H(4680,4860,"STRAIGHT TO STEVE'S ASSHOLE","LOWE'S FLAT CART: THE DENT, THE FLIP-FLOP, THE SILENCE","Mike walks into an ankle-high flat cart while texting his wife, hits it hard enough to dent the metal, and lies on the floor waiting for the store to pretend it heard nothing."),
    H(4860,5040,"ROOM BREAK","THE KNEE WELT GETS ITS OWN MEDICAL HORROR MOVIE","The injury report includes bruised shins, a flying flip-flop, a bleeding ankle, and a knee welt that Mike describes as an alarmingly pointed little landmark. Public copy keeps the physical-comedy shape without the explicit anatomy."),
    H(5040,5220,"NEWS REACTION","TWISTERS REVIEWS START THE PREVIEW FIGHT","Mike reads positive reviews praising the storm visuals and a 35mm texture, then realizes even the negative blurbs mostly sound like compliments."),
    H(5220,5400,"STRAIGHT TO STEVE'S ASSHOLE","THE NEGATIVE REVIEW THAT SOUNDS LIKE A SEX DUNGEON","A critic's phrase about a film's 'unbridled gusto' becomes an improvised bedroom line. The joke is built from the review's pompous language, not from the movie itself."),
    H(5400,5580,"FILM READ","TWISTERS MUST EARN ITS 1996 WEATHER","Mike worries that modern digital effects will make the new film look worse than the original. A soundtrack, practical texture, and characters people care about are the three tests he keeps returning to."),
    H(5580,5760,"COMMUNITY DOOR","THE SPOILER WINDOW IS SMALL, THE FAM MAKES IT COUNT","Mike explains why these early spoiler streams matter: fans want to talk before the internet moves on, while the archive remains available for anyone who needs to catch up later."),
    H(5760,5856,"CLOSING READ","LONGLEGS LEAVES THE ROOM WITH A THANK-YOU","The solo close thanks the FAM, promises a Friday/Saturday room with Jay, and ends with the rare WWAM combination of filthy sign-off and sincere gratitude.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the July 16, 2024 Longlegs spoiler livestream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 19435,
      captionEvents: 5172,
      captionSpanSeconds: 5856.44,
      captionDurationCoveragePercent: 100.01,
      captionSha256: "65517f032eedefeaf32bc4b383c7e6c1721d6f381d58a92a28e4a7f3d33aa35a",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "4f2bf3224cae612fa72889b6dcea0e3317b87f34a553ee10919f6f996b19e4d2",
      asrWindowCount: 35,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "MONDAY LIVE // JULY 16, 2024",
    badge: "FULL SHOW WIKI // LONGLEGS SPOILER TALK, CAGE, THE FAM, AND LOWE'S",
    headline: "LONGLEGS, THE BIRTHDAY SONG THAT WOULD NOT DIE, AND A LOWE'S CART WITH A BODY COUNT",
    deck: "A solo WWAM spoiler room where Longlegs becomes a poll, an Oscar argument, a Richard Simmons memorial, a dating pep talk, and one spectacularly painful trip into home improvement.",
    overview: "Mike hosts this one alone, which means every silence, poll, music change, and bad transition is part of the record. He opens by comparing Longlegs and Maxxxine, then explains why the Kentucky Theater's vaulted ceiling made the new horror movie feel louder and stranger. The review is balanced: the film is creepy and often funny, but the hype promised a once-in-a-decade nightmare and the FBI investigation does not always provide the satisfying puzzle-work of Se7en, Silence of the Lambs, or Zodiac. The ending becomes the main event. Mike is furious that Agent Harker sees a family about to be murdered and waits anyway, while the chat argues about predictability, Satanic imagery, the low CinemaScore, and whether the final wink is a joke or a line in the sand. Cage gets the room's best receipts: the overlong birthday song, the repeated threat, the karaoke scream, and the question of whether an unknown actor would have been scarier. The conversation widens into a Pinhead/Michael Myers crossover pitch, Alien: Romulus anticipation, a Mark Wahlberg schedule roast, Neon versus A24, and genuine grief for Richard Simmons, Shannon Doherty, and Shelley Duvall. Then a red-dress parking-lot mystery and a Lowe's flat-cart face-plant turn the solo show into physical comedy. The close is affectionate and practical: get the spoiler thoughts out while the movie is new, then leave the tape open for the people who arrive late.",
    topics: Object.freeze(["Longlegs", "Nicolas Cage", "Oz Perkins", "Maika Monroe", "The FAM", "The Blackcoat's Daughter", "Alien: Romulus", "Neon vs A24", "Richard Simmons", "Twisters", "Lowe's cart story", "Horror crossover"]),
    story: Object.freeze([
      { at: 0, end: 720, label: "THE SOLO ROOM GETS ITS LIGHTS ON", body: "A StreamYard wobble, a FAM roll call, a filthy solo-show opener, and a Longlegs-versus-Maxxxine recommendation establish the room before spoilers start." },
      { at: 720, end: 1440, label: "LONGLEGS FIGHTS ITS OWN HYPE", body: "The Kentucky Theater, Blackcoat's Daughter, a too-big marketing promise, and the first Cage plausibility poll put the movie on trial." },
      { at: 1440, end: 2160, label: "CAGE MAKES THE HORROR FUNNY", body: "The birthday song, the repeated threat, the scream signature, and a mystery-night cable memory explain why the movie can scare Mike and make him laugh in the same breath." },
      { at: 2160, end: 2880, label: "THE LAST ACT GOES TO COURT", body: "The FBI procedural, the mother reveal, the dolls, the C+ CinemaScore, and religious discomfort turn the ending into the episode's central argument." },
      { at: 2880, end: 3600, label: "THE OSCAR AND PREQUEL DOCKET", body: "Cage, Toni Collette, Mia Goth, a possible prequel, Monroe's restrained role, and the shotgun/doll climax keep the film conversation moving instead of repeating its twist." },
      { at: 3600, end: 4320, label: "HORROR GETS BIGGER THAN LONGLEGS", body: "Pinhead and Michael Myers, Alien: Romulus, Mark Wahlberg's child-avoidance schedule, and a Neon/A24 comparison turn one movie into a channel map." },
      { at: 4320, end: 5040, label: "GRIEF, RED DRESSES, AND A FLAT CART", body: "Richard Simmons and Shannon Doherty receive a sincere goodbye before the roller-derby parking-lot mystery and Mike's Lowe's injury story take over." },
      { at: 5040, end: 5856, label: "TWISTERS REVIEWS AND THE LAST GOODNIGHT", body: "A Rotten Tomatoes reading, a pompous-review riff, a 1996-effects standard, and an explanation of the spoiler window send the solo room out with gratitude." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1440, end: 1800, label: "THE BIRTHDAY SONG POLL", topic: "Cage turns a threat into the room's biggest laugh", body: "Play from 24:00. The song keeps restarting, the detective gives an exact duration, and Mike explains why the scene's comedy makes the horror sharper.", playAt: 1440, playEnd: 1800 }),
      hated: Object.freeze({ at: 2340, end: 2700, label: "THE AGENT WHO WAITS FOR THE MURDER", topic: "Harker sees the trap and still sits down", body: "Play from 39:00. Mike's most forceful Longlegs complaint is not the twist; it is the protagonist refusing to act when the danger is obvious.", playAt: 2340, playEnd: 2700 }),
      wildestDetour: Object.freeze({ at: 4500, end: 4860, label: "THE RED-DRESS PARKING LOT", topic: "a roller-derby outing turns into an unexplained street ritual", body: "Play from 1:15:00. Red dresses, truck beds, beads, a shouted invitation, and the question of whether a public costume event can be mad about being seen.", playAt: 4500, playEnd: 4860 }),
      lastWord: Object.freeze({ at: 4680, end: 5040, label: "THE LOWE'S CART STORY", topic: "the show exits on a dented cart and a flying flip-flop", body: "Play from 1:18:00. Mike's flat-cart collision is physical comedy, embarrassment therapy, and the perfect solo-show closer before the Twisters preview.", playAt: 4680, playEnd: 5040 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
