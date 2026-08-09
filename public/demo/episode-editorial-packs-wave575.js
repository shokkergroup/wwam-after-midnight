(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "mmUOFsbGtfg";
  var duration = 9326;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(100, 420, "OPENING CHAOS", "THE FACE IS HIDDEN, THE HALLOWEEN NEWS IS LOADED, AND THE INTERNET IS ALREADY A SHITTY PLACE", "The stream starts with a blocked camera, an April Fools-adjacent mood, and three stacked lanes: Halloween Kills, the Spiral trailer, and Godzilla versus Kong."),
    H(420, 760, "FAM RECEIPT", "IRON WOLF, KOOL-AID UNLEASHED, AND A LOOMIS DREAM THAT ENDS WITH PIANO WIRE", "The FAM arrives with a greeting, a dream about Michael strangling Dr. Loomis, and the request that J perform the dream as Dr. Loomis. The character lane is active before the news starts."),
    H(760, 1120, "CHARACTER CANON", "LOOMIS AGGRESSIVELY COUNSELS MILES AND THE CHAT STARTS CALLING HIM GRANDBOY", "Austin requests Loomis, and the booth turns the character into an aggressively unhelpful counselor. Miles gets a grandfather joke and the episode's first playable character receipt."),
    H(1120, 1800, "SPIRAL", "THE SPIRAL TRAILER IS SAW WITHOUT THE TITLE POLES", "The hosts react to Spiral as a Saw-adjacent horror movie, debate whether the trailer reveals too much, and explain why the title's missing 'Saw' is part of the hook."),
    H(1800, 2350, "SCREAM / HORROR NEWS", "SCREAM 5, BAIT-AND-SWITCH KILLS, AND THE CHAT THAT CLAIMS IT SAW AN EARLY CUT", "Scream news brings rumors of an early cut, multiple kills, the directors' confidence, and a discussion of how the franchise uses bait-and-switch scenes without losing its identity."),
    H(2350, 3200, "HALLOWEEN KILLS", "THE HALLOWEEN KILLS STORY IS A RUMOR, A REDDIT POST, AND A FAM MEMBER WHO SWEARS IT'S REAL", "Tornado Taco 43 and the chat discuss a supposed Halloween Kills plot. The hosts are interested but careful: the rumor is preserved as a rumor, not treated as verified story canon."),
    H(3200, 3900, "WWAM UP IN YA", "THE MOTHMAN PROPHECIES, THE TOILET, AND THE HORROR TINDER DATE", "A pee break, Mothman discussion, and a viewer pitch for a horror Tinder-date movie turn the news show into a small anthology of things the booth wants to watch immediately."),
    H(3900, 4550, "GODZILLA VS KONG", "FREDDY VS JASON VS ASH, GHOSTBUSTERS 2, AND THE FAM BUILDS A DOUBLE FEATURE", "Gypsy Warrior proposes Freddy versus Jason versus Ash, then the room detours through Ghostbusters 1 and 2, Godzilla/Kong anticipation, and the question of which monster deserves the cover."),
    H(4550, 5600, "WWAM UP IN YA", "SATAN'S BIG GAY CHICKEN BECOMES A FOOD TRUCK, A BRAND, AND A FAM ARGUMENT", "A riff on a fast-food story becomes Satan's Big Gay Chicken. The booth and FAM separate the joke from the LGBT community, then keep escalating the fictional restaurant until it needs a truck and a logo."),
    H(5600, 6200, "HALLOWEEN KILLS", "THE KILLS TRAILER DATE, THE LOOMIS FLASHBACK WISH, AND THE WRONG KIND OF PRANK", "The hosts discuss when the Halloween Kills trailer might land, whether a Loomis flashback belongs in it, and why turning the release into a prank would be the wrong kind of fan manipulation."),
    H(6200, 7000, "HORROR LORE", "MOTHMAN IS SCARIER THAN A LOT OF MOVIES AND THE CHAT WANTS A LOOMIS FLASHBACK", "Mothman Prophecies gets a defense as genuine slow-burn dread. The FAM keeps the Halloween Kills wish alive: a Loomis appearance should serve the story, not just the poster."),
    H(7000, 7720, "GODZILLA VS KONG", "THE REVIEW OPENS WITH 'IT SUCKED' AND THEN ADMITS THE FIGHTS ARE AMAZING", "The spoiler-free Godzilla versus Kong review starts with a deliberately brutal verdict, then separates the human story from the monster fights and admits the battles work even when the people do not."),
    H(7720, 8380, "GODZILLA VS KONG", "KYLE CHANDLER IS LEFT ON THE SIDELINES WHILE THE MONSTERS DO THE JOB", "The booth argues that the human characters are too thin, especially when Kyle Chandler is available, while the Godzilla/Kong fights deliver the reason people bought the ticket."),
    H(8380, 8900, "GODZILLA VS KONG", "KING OF THE MONSTERS, KONG SKULL ISLAND, AND THE MONSTER-VERSE BUILD THAT GOT LOST", "The hosts compare the modern MonsterVerse entries and explain why King of the Monsters' setup feels more useful than a film that makes its humans stand around while Godzilla works."),
    H(8900, 9230, "FAM / CHARACTER CANON", "GARY CATLOW ASKS WHO WINS, AND THE LOOMIS IMPRESSIONS GET ONE LAST SPIN", "Gary Catlow asks for the favorite between Kong and Godzilla. The chat returns with Michael and Loomis impersonations before the final answer gives Godzilla the nod."),
    H(9230, 9326, "LAST CALL", "GODZILLA WINS THE VOTE AND THE CAMERA STILL DOESN'T WANT TO BE HERE", "The stream closes with Godzilla over Kong, a final FAM question, and the same technical instability that made the opening feel like an April Fools prank."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 100, end: 1800, label: "HALLOWEEN KILLS, SPIRAL, AND LOOMIS WALK INTO A CAMERA PROBLEM", body: "The camera hides the face while the hosts queue Halloween Kills, Spiral, and Godzilla versus Kong. Iron Wolf, Kool-Aid Unleashed, Austin, and the FAM bring Loomis requests, piano-wire dreams, and aggressive counseling before Spiral becomes a Saw-adjacent trailer debate.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1800, end: 3900, label: "SCREAM RUMORS, HALLOWEEN KILLS RUMORS, AND A HORROR TINDER DATE", body: "Scream 5 rumors, bait-and-switch kills, a supposed Halloween Kills plot, a pee break, Mothman Prophecies, and a horror Tinder-date pitch make the first half a live rumor desk. The dossier labels rumors as rumors and lets the audience press play on the uncertainty.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 3900, end: 6200, label: "GHOSTBUSTERS, SATAN'S BIG GAY CHICKEN, AND THE HALLOWEEN KILLS TRAILER WISH", body: "The FAM makes a monster double feature, Ghostbusters 2 gets defended, and a fast-food riff becomes Satan's Big Gay Chicken. The booth makes the joke's boundaries explicit, then returns to the Halloween Kills trailer date and a Loomis flashback that would need to earn its place.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 6200, end: 9326, label: "GODZILLA WINS, KYLE CHANDLER LOSES, AND THE MONSTER FIGHTS SAVE THE MOVIE", body: "Mothman gets a slow-burn defense before Godzilla versus Kong receives a spoiler-free review. The booth complains about the thin humans and Kyle Chandler's sidelining, praises the monster fights, compares King of the Monsters and Kong: Skull Island, and lets Gary Catlow's final question decide the winner: Godzilla.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h35m26s Halloween Kills, Godzilla VS Kong + Spiral Reaction LIVE stream; local audio, canonical captions, and Whisper ledger checked across blocked-camera opening, Loomis dream and Austin request, Spiral/Saw trailer lane, Scream 5 rumors, Halloween Kills Reddit plot rumor, Mothman and horror Tinder detour, Freddy/Jason/Ash, Ghostbusters 1/2, Satan's Big Gay Chicken riff and boundaries, Halloween Kills trailer timing and Loomis flashback wish, Mothman defense, Godzilla/Kong verdict, Kyle Chandler and human-story criticism, MonsterVerse comparison, Gary Catlow final vote, and technical close",
    evidence: Object.freeze({
      duration: 9326,
      captionWords: 33813,
      captionEvents: 5147,
      captionSpanSeconds: 9327.359,
      captionDurationCoveragePercent: 100,
      captionSha256: "A0248055F33875BA0A65D22CDA2FB4E944FFEE7F6CCB579717F861A4DF5CEEDD",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "82EFAAA4356CAF450B2374D136E2372426BA50E06571AAB94D2C2FB545782439",
      asrSegmentCount: 555,
      asrSha256: "sha256:A69FB7E616F1455943E31EB1F1C31DB5B669F9B385F6A38F99E8A67B786B17E5",
      asrCoverageStartSeconds: 109,
      asrCoverageEndSeconds: 9289.98,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "HALLOWEEN KILLS // GODZILLA VS KONG + SPIRAL REACTION LIVE",
    badge: "FULL SHOW WIKI // HALLOWEEN RUMORS, SPIRAL, MOTHMAN, AND MONSTER-VERSE",
    headline: "LOOMIS GETS A PIANO-WIRE DREAM, SATAN'S BIG GAY CHICKEN OPENS, GODZILLA WINS",
    deck: "A full-audio WWAM read of the 2h35m26s reaction night: Spiral and Scream rumors, a Halloween Kills plot lead, Loomis character canon, Mothman dread, Satan's Big Gay Chicken, and a Godzilla versus Kong verdict.",
    overview: "The stream starts with a blocked camera and a three-way horror-news queue: Halloween Kills, Spiral, and Godzilla versus Kong. Iron Wolf, Kool-Aid Unleashed, Austin, and the FAM immediately make the episode interactive with Loomis requests, a piano-wire dream, and aggressive counseling for Miles. Spiral gets a Saw-adjacent trailer read; Scream 5 gets early-cut and kill rumors; Halloween Kills gets a Reddit-sourced plot claim that the hosts label as rumor instead of canon. Mothman Prophecies becomes a slow-burn defense, Freddy versus Jason versus Ash gets proposed, Ghostbusters 2 gets defended, and a food joke expands into Satan's Big Gay Chicken while the booth makes clear it is a fictional riff, not a statement about the LGBT community. The Halloween Kills lane returns with trailer timing, a possible Loomis flashback, and a warning against prank marketing. Finally Godzilla versus Kong gets the actual review: the fights are excellent, the humans are thin, Kyle Chandler is underused, and Godzilla wins the final FAM vote. Local audio and aligned ASR establish every route; playback remains the authority.",
    topics: Object.freeze(["Halloween Kills", "Spiral", "Scream 5", "Godzilla vs Kong", "Mothman Prophecies", "Dr. Loomis", "Dr. Challis", "Ghostbusters", "Freddy vs Jason vs Ash", "MonsterVerse", "Kyle Chandler", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 7000, end: 7720, label: "THE GODZILLA REVIEW'S BRUTAL OPENING VERDICT", topic: "Godzilla vs Kong", body: "Play the review opening for the clearest split between monster-fight satisfaction and human-story frustration.", playAt: 7000, playEnd: 7720 }),
      hated: Object.freeze({ at: 2350, end: 3200, label: "THE HALLOWEEN KILLS RUMOR THAT REFUSES TO BECOME FACT", topic: "Halloween Kills", body: "Play the rumor lane for the best example of how this wiki can preserve excitement without laundering a chat post into canon.", playAt: 2350, playEnd: 3200 }),
      wildestDetour: Object.freeze({ at: 4550, end: 5600, label: "SATAN'S BIG GAY CHICKEN", topic: "WWAM Up in Ya", body: "Play the fictional food-truck escalation for the episode's most unhinged comedy lane and its explicit boundary-setting.", playAt: 4550, playEnd: 5600 }),
      lastWord: Object.freeze({ at: 8900, end: 9230, label: "GARY CATLOW'S GODZILLA VOTE", topic: "MonsterVerse", body: "Play the final Kong/Godzilla question for the cleanest close to the monster review.", playAt: 8900, playEnd: 9230 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 270, end: 315, name: "I Am The Commander", kind: "chat receipt", note: "Opens the FAM lane during the blocked-camera introduction." },
        { at: 580, end: 625, name: "Kool-Aid Unleashed", kind: "Super Chat", note: "Shares the piano-wire Loomis dream and asks for the character performance." },
        { at: 620, end: 670, name: "Courtney", kind: "Super Chat", note: "Adds a theme-based question during the opening horror news." },
        { at: 730, end: 770, name: "Dustin Adams", kind: "Super Chat", note: "Checks in during the first movie-news lane." },
        { at: 760, end: 805, name: "Marco of Evil Toro", kind: "chat receipt", note: "Adds a Michael/Jay message before the Loomis request." },
        { at: 885, end: 930, name: "Austin", kind: "chat receipt", note: "Requests an aggressive Loomis counseling session." },
        { at: 970, end: 1015, name: "The Rusty Line", kind: "Super Chat", note: "Adds a greeting during the character lane." },
        { at: 1960, end: 2015, name: "Intel Wild", kind: "Super Chat", note: "Asks about the Spiral and Halloween Kills rumor lanes." },
        { at: 2235, end: 2285, name: "Robbie", kind: "chat receipt", note: "Adds a reaction to the horror-news queue." },
        { at: 2280, end: 2335, name: "Cody Buchanan", kind: "chat receipt", note: "Adds a horror-movie reaction before the Scream news." },
        { at: 2525, end: 2575, name: "Simone Morris", kind: "Super Chat", note: "Checks in during the Scream and Godzilla setup." },
        { at: 3180, end: 3225, name: "Tornado Taco 43", kind: "chat receipt", note: "Is named as the source of the Halloween Kills rumor." },
        { at: 3320, end: 3370, name: "Vinnie C", kind: "chat receipt", note: "Offers the dad-joke lane during the rumor discussion." },
        { at: 3440, end: 3495, name: "Wham Fam", kind: "chat receipt", note: "Sends a Friday-style greeting before Godzilla/Kong." },
        { at: 3910, end: 3965, name: "Gypsy Warrior", kind: "chat receipt", note: "Pitches Freddy versus Jason versus Ash." },
        { at: 4140, end: 4190, name: "Star Starbear", kind: "chat receipt", note: "Adds a Godzilla/Kong reaction." },
        { at: 4215, end: 4265, name: "Troy Grub", kind: "chat receipt", note: "Greets Jay during the monster-news lane." },
        { at: 4270, end: 4335, name: "Joshua Ayers", kind: "Super Chat", note: "Says he loves the Ghostbusters/Godzilla conversation." },
        { at: 4315, end: 4370, name: "25 Savage 2005", kind: "chat receipt", note: "Asks Jay to choose between Ghostbusters films." },
        { at: 4540, end: 4600, name: "Courtney Reed", kind: "Super Chat", note: "Adds a Loomis and Challis cover idea." },
        { at: 4600, end: 4650, name: "Mary Cerviche", kind: "chat receipt", note: "Greets the room during the Ghostbusters lane." },
        { at: 4710, end: 4760, name: "Gypsy Warrior", kind: "chat receipt", note: "Adds a DiCaprio/monster tangent." },
        { at: 5310, end: 5370, name: "The Shape of the Shadow", kind: "chat receipt", note: "Sends a FAM message during the fictional food-truck escalation." },
        { at: 5335, end: 5395, name: "Jeff Harris", kind: "Super Chat", note: "Says Michael Keaton would have been great in Ghostbusters." },
        { at: 5385, end: 5445, name: "Galford's Dog", kind: "chat receipt", note: "Raises the LGBT-community reaction to the food joke." },
        { at: 6450, end: 6510, name: "C Kruger", kind: "chat receipt", note: "Asks for the horror movie of all horror movies." },
        { at: 6500, end: 6555, name: "Kool-Aid Unleashed", kind: "chat receipt", note: "Brings Macho Man into the horror discussion." },
        { at: 6675, end: 6725, name: "Mothman Prophecies lane", kind: "chat receipt", note: "The FAM agrees with the Mothman scariness verdict." },
        { at: 6740, end: 6795, name: "Jurassic Production", kind: "chat receipt", note: "Adds a Ben-horror reaction." },
        { at: 6790, end: 6845, name: "Marcus Hicks", kind: "Super Chat", note: "Asks for a Halloween Kills trailer video." },
        { at: 6850, end: 6910, name: "Justin Martin", kind: "Super Chat", note: "Asks what a Halloween Kills flashback should be." },
        { at: 6920, end: 6965, name: "Vinnie", kind: "chat receipt", note: "Adds a Mothman comment before the Godzilla/Kong review." },
        { at: 7150, end: 7205, name: "Galford's Dog", kind: "chat receipt", note: "Adds a 2002 horror comparison." },
        { at: 7190, end: 7245, name: "Glenn Harris", kind: "chat receipt", note: "Pitches a horror Tinder-date movie." },
        { at: 7210, end: 7265, name: "JT Custom", kind: "chat receipt", note: "Asks about the Godzilla/Kong release." },
        { at: 7245, end: 7295, name: "Silent Bill", kind: "chat receipt", note: "Puts The Exorcist into the all-time horror lane." },
        { at: 7550, end: 7605, name: "Gary Catlow", kind: "Super Chat", note: "Says he expected Kong to be safe after Godzilla's foot moment." },
        { at: 7670, end: 7720, name: "Jeremy", kind: "chat receipt", note: "Adds a final monster reaction before the review closes." },
        { at: 8970, end: 9030, name: "Gary Catlow", kind: "chat receipt", note: "Asks about character relationships in Godzilla versus Kong." },
        { at: 9060, end: 9115, name: "JS7", kind: "chat receipt", note: "Adds a final reaction while the hosts do Michael and Loomis impressions." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
