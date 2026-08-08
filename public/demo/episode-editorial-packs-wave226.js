(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "Q_CprCuIXLk";
  var duration = 2208;
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* April 22, 2024: a short morning trailer room that is already hungover,
     six days smoke-free, and very ready to see Ryan Reynolds and Hugh Jackman
     turn an R-rated Deadpool/Wolverine movie into a jukebox. */
  var highlights = [
    H(0,180,"OPENING READ","THE HUNGOVER 9:46 A.M. TRAILER ROOM","The hosts arrive after a night out, promise a short stream, and admit the only reason to be awake is seeing Ryan Reynolds in stretchy pants."),
    H(180,360,"HEALTH CHECK-IN","DAY SIX WITHOUT A CIGARETTE","Jay talks through the sixth day of quitting, the cough, the returning lung hairs, and the very WWAM temptation to relapse for one hit."),
    H(360,540,"CHARACTER PERFORMANCE","SLAM DUNK ERNEST AND A BIRTHDAY HELLO","A Super Chat about watching Slam Dunk Ernest while making love gets a Loomis answer, then a birthday shoutout turns the morning into a fan-service desk with no desk.",["Dr. Loomis"]),
    H(540,720,"FAM SIGNAL","THE 10:30 A.M. STRIP-CLUB RECEIPT","The hosts confess to a depressing early-morning strip-club visit, joke about the dancers and the lighting, and admit it was really an excuse to escape the house after a bad night."),
    H(720,840,"CHARACTER PERFORMANCE","SLENDERMAN SINGS HAPPY BIRTHDAY","Rhino asks Slenderman to greet a nine-year-old. The birthday song is sweet for three seconds, then the character voice drifts into the room's usual unhinged territory.",["Slenderman"]),
    H(840,960,"ROOM BREAK","THE FART, THE FROG, AND THE DOG ALIBI","A desk creak becomes a fart sound, a wife gets blamed on the dogs, and the hosts draw the line between passing gas and committing a full Dutch-oven crime."),
    H(960,1080,"TRAILER READ","THE FIRST DEADPOOL/WOLVERINE HIT","The trailer finally rolls. Logan's tree image, Wolverine's return, and a sudden house noise make the reaction feel like a live jump scare rather than a polished review."),
    H(1080,1200,"TRAILER READ","MADONNA, HALO, AND THE FIGHT MUSIC","The hosts love the classic song choice and explain why 80s music over superhero violence works: it is the same emotional trick as playing Electric Blue during a Halo session."),
    H(1200,1320,"TRAILER READ","MULTIPLE LOGANS AND THE YELLOW SUIT","The room parses Old Man Logan, the yellow-and-blue suit, Weapon X, and the possibility that the trailer is showing more than one Logan instead of simply curing the old one."),
    H(1320,1440,"COMEDY READ","THE TURLET AND THE BONER MULTIVERSE","A fan watches from a work toilet. The hosts invent a physiology problem involving a boner, a poop factory beside a playground, and a belly-button switchblade that should never be medically attempted."),
    H(1440,1560,"TRAILER READ","STOP SHOWING US TRAILERS","Both hosts agree the trailer looks fantastic but beg the studio to stop releasing footage. They want to be surprised in the theater instead of arriving with the whole movie already living in their heads."),
    H(1560,1680,"TRAILER READ","THE R-RATED PROMISE","The room worries briefly about Disney sanding down the movie, then relaxes when the trailer brings up pegging, whiskey dick, and the kind of language that signals the adult version survived the corporate handoff."),
    H(1680,1800,"META READ","THE PROFESSIONALS ARE BROKE AND AWAKE","They call themselves professionals for appearing at 10 a.m. after drinking, admit they need money, and credit Eric for buying drinks before the conversation becomes a P. Diddy comparison."),
    H(1800,1920,"COMIC-BOOK READ","X-MEN 97 IS THE BLUEPRINT","A fan argues that the movie proves X-Men still works when the characters are good. The hosts want a live-action X-Men with the animated theme, Cyclops' colors, and less Wolverine tunnel vision."),
    H(1920,2040,"FILM READ","THE CROW IS LIGHTNING IN A BOTTLE","A fan discovers Ernie Hudson and Tony Todd in The Crow. The hosts defend the original casting, music, and mood while calling a remake an impossible attempt to recreate lightning."),
    H(2040,2120,"MUSIC READ","CULTURE CLUB, CHER, AND DMX FOR LOGAN","The soundtrack fantasy moves from Sinead O'Connor and Culture Club to Cher and DMX. The common thread is an 80s jukebox that makes the fight feel bigger than another superhero trailer."),
    H(2120,2180,"COMEDY READ","THE TAYLOR SWIFT REVIEW NOBODY REQUESTED","A prompt about music turns into a fake review of Taylor Swift, a complaint that every song sounds the same, and a quick detour through Count Chocula and Sega."),
    H(2180,2208,"CLOSING READ","THE DINGIES SIGN-OFF","The short stream ends with the hosts promising Patreon, another live later in the week, and one last private joke about playing with their dingies before the camera cuts."),
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the April 22, 2024 trailer reaction",
    evidence: Object.freeze({ duration: duration, captionWords: 7879, captionEvents: 2066, captionSpanSeconds: 2204.681, captionDurationCoveragePercent: 99.85, captionSha256: "66d92e59dc3401b5f255b35870a43f93d4b7b44cf2e2e4970f32b920bb5c5814", captionSourceKind: "source-local official YouTube caption ledger acquired as JSON", audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority", audioSha256: "351ec5dc19884a73679b5beb7ff013fb5544f848b05eac6f86b3a54e1b987773", asrWindowCount: 22, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "MONDAY MORNING LIVE // APRIL 22, 2024",
    badge: "FULL SHOW WIKI // DEADPOOL & WOLVERINE TRAILER REACTION, LOGAN, X-MEN, AND THE DINGIES EXIT",
    headline: "THE TRAILER LOOKS GREAT; THE ROOM SHOULD NEVER HAVE BEEN AWAKE",
    deck: "A compact, hungover reaction to the first Deadpool & Wolverine trailer, with a six-day smoking update, Loomis and Slenderman fan calls, yellow-suit archaeology, and a soundtrack argument that becomes its own movie.",
    overview: "This is a short stream, but it is not a thin one. Mike and Jay arrive at 9:46 in the morning after drinking the night before, promise they will not stay for three hours, and immediately establish the tape's two engines: the Deadpool & Wolverine trailer and whatever personal disaster the chat brings into the room. Jay is six days without a cigarette and keeps trying to bargain with the idea of one hit. A fan asks Dr. Loomis to explain a Slam Dunk Ernest morning, Rhino asks Slenderman to sing happy birthday to a nine-year-old, and the hosts confess to a 10:30 a.m. strip-club visit that was really a depression escape. When the trailer rolls, the reaction is specific: Logan's tree image, Hugh Jackman's return, Wolverine's yellow-and-blue suit, possible multiple Logans, the Weapon X silhouette, portals, the villain's magnetic-looking attack, and the promise of an R-rated movie that Disney has not sterilized. Madonna's 'Like a Prayer' and the 80s music palette get a full defense because the hosts know a fight can become mythic when the soundtrack is doing half the emotional lifting. They want the trailer to stop spoiling the movie, but they also predict it will be the year's biggest event. The second half widens into an X-Men 97 blueprint, a Cyclops casting complaint, a defense of The Crow's Ernie Hudson/Tony Todd ensemble, a debate over Culture Club, Cher, DMX, and Sinead O'Connor, then an unsolicited Taylor Swift review and a Count Chocula/Sega exit. The correct way to use this page is as a morning-room sampler: play the trailer reaction, then jump to the exact fan or character receipt that made the promise of a 'short stream' impossible to keep clean.",
    topics: Object.freeze(["Deadpool & Wolverine", "Trailer Reaction", "Hugh Jackman", "Ryan Reynolds", "X-Men 97", "The Crow", "Dr. Loomis", "Slenderman", "FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze([
      { at: 0, end: 720, label: "HUNGOVER, SMOKE-FREE, AND ALREADY OFF THE RAILS", body: "The room opens with a bar-night hangover, day-six nicotine withdrawal, a Slam Dunk Ernest Super Chat, a birthday request, and a strip-club story that makes the morning feel illegal." },
      { at: 720, end: 1080, label: "SLENDERMAN SINGS, THEN THE TRAILER STARTS", body: "Slenderman gives a birthday greeting, a fart gets blamed on the dogs, and the Deadpool/Wolverine trailer finally arrives through a cloud of house noises." },
      { at: 1080, end: 1320, label: "MADONNA, MULTIPLE LOGANS, AND THE YELLOW SUIT", body: "The hosts connect the trailer's 80s soundtrack to Halo, then parse Old Man Logan, Weapon X, portals, and the return of yellow spandex." },
      { at: 1320, end: 1680, label: "THE TURLET, NO MORE TRAILERS, AND THE R-RATING", body: "A work-toilet viewer inspires a physiology bit, then both hosts ask the studio to stop releasing footage and celebrate the trailer's adult language." },
      { at: 1680, end: 2040, label: "X-MEN 97 AND THE CROW SET THE STANDARD", body: "The hosts call X-Men 97 the live-action blueprint and defend The Crow as an unrepeatable casting/music lightning strike." },
      { at: 2040, end: 2208, label: "THE SOUNDTRACK AND DINGIES EXIT", body: "Culture Club, Cher, DMX, Taylor Swift, Count Chocula, and Sega carry the room to a Patreon plug and one final private joke." }
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1800, end: 1920, label: "X-MEN 97 IS THE BLUEPRINT", topic: "good characters beat franchise exhaustion", body: "Play from 30:00. A fan's point becomes the cleanest thesis on the tape: focus on the characters people actually love and stop treating the universe like a content vending machine.", playAt: 1800, playEnd: 1920 }),
      hated: Object.freeze({ at: 1560, end: 1680, label: "THE R-RATED WORRY GETS PUT TO BED", topic: "Disney sanding down Deadpool", body: "Play from 26:00. The hosts remember the fear that the Fox handoff would sterilize the movie, then use the trailer's language to argue that the adults are still in the room.", playAt: 1560, playEnd: 1680 }),
      wildestDetour: Object.freeze({ at: 1320, end: 1440, label: "THE TURLET BONER MULTIVERSE", topic: "a fan watches from work and the room invents anatomy", body: "Play from 22:00. A perfectly normal work-toilet message mutates into a belly-button switchblade and a Hershey-factory engineering question.", playAt: 1320, playEnd: 1440 }),
      lastWord: Object.freeze({ at: 2180, end: 2208, label: "THE DINGIES SIGN-OFF", topic: "a short morning stream refuses to end normally", body: "Play from 36:20. Patreon, another live show, and the final private joke close the tape before the room can accidentally run another three hours.", playAt: 2180, playEnd: 2208 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
