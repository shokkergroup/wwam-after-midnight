(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "xWkQKdVHQKU";
  var duration = 1312;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-audio-human-editorial-read", evidenceState: "source-local Whisper audio; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local Whisper community receipt" };
  };
  var highlights = [
    H(0, 180, "OPENING FILE", "CURSE OF CHUCKY STARTS WITH A DISCLAIMER, A WHITE-BEARD PANIC, AND A MONDAY AFTERNOON DEATH WISH", "This short edited commentary begins with the hosts admitting they are not Chucky people, then immediately turns the FBI warning into a pirate joke and the white substance on Mike's beard into a defensive court case."),
    H(180, 430, "UP IN YA", "THE FILM GETS THE SONG-MASHUP TREATMENT WHILE THE BOOTH RECALLS GREEN BEER AND COMIC CON", "The opening movie beats are interrupted by improvised singing, toilet percussion, and the story of getting separated in a St. Patrick's Day crowd after too many green beers."),
    H(430, 690, "FILM READ", "CLOSE-UP EATING SHOTS ARE DECLARED A CRIME AGAINST HUMANITY", "The booth reacts to a food close-up with genuine disgust, then pivots into a side argument about whether the camera is trying to make the audience participate in chewing."),
    H(690, 900, "CHARACTER / FAMILY", "CHUCKY'S DAUGHTER GETS CREDIT FOR BEING THE ONE PERSON WHO CAN REALLY RUIN HIM", "The hosts enjoy the idea that Chucky's own daughter is the person who can finally wreck him, then tell a childhood story about friends, Star Wars toys, boogers, and attacking Cody from under a bed."),
    H(900, 1080, "LORE ROOM", "A BATHTUB, A DOLL, AND A FAILED COLOR-RESTORATION EXPERIMENT BECOME THE REAL CHUCKY STORY", "A memory about trying to restore a doll's color in the bathtub turns into a story about three friends inventing a ridiculous home repair and accidentally creating a horror prop."),
    H(1080, 1195, "WWAM LORE", "HALO REACH RECONNECTS THE FRIENDSHIP, THEN A HALLOWEEN PORN PARODY SUPER CHAT DETONATES THE ROOM", "The hosts trace their adult reconnection to talking trash online over Halo Reach. A viewer then asks about an X-Videos Halloween parody where Loomis gets laid, and the booth debates whether Patreon would survive the idea."),
    H(1195, 1312, "CLOSING FILE", "CURSE OF CHUCKY GETS A GOODBYE, THE CHAT GETS A POOP-PLATTER CODEWORD, AND PATREON IS LEFT BLUSHING", "The commentary closes with the film's blame game, a subscription joke, and a final promise to keep the sexual side-door as a chat bit rather than pretending it is a normal programming decision."),
  ];
  var story = [
    { at: 0, end: 430, label: "THE DISCLAIMER TURNS INTO A MONDAY AFTERNOON COMEDY ROOM", body: "The hosts are honest that Chucky is not a favorite, then use the warning card as a license to be pirates, singers, and enemies of white residue on a beard. The movie starts under a cloud of deliberate disrespect.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 430, end: 690, label: "THE CAMERA'S CLOSE-UP EATING SHOT BECOMES THE FIRST REAL VILLAIN", body: "The commentary pauses its plot reading to reject the close-up food photography. For this booth, the grossest thing in the scene is not the doll—it is being forced to watch somebody chew at cinema scale.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 690, end: 900, label: "CHUCKY'S DAUGHTER AND THE FRIENDSHIP ORIGIN STORY SHARE A LANE", body: "The hosts like the family betrayal angle, then drift into a real memory of Star Wars toys, under-bed attacks, and the kind of childhood friendship that survives because everyone is equally bad at behaving.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 900, end: 1080, label: "THE BATHTUB DOLL EXPERIMENT IS A HOME-MADE CHUCKY PREQUEL", body: "A failed attempt to restore a doll's color becomes an accidental origin story for the booth's own horror props. The archive keeps it as memory, not proof that the film contains the bit.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1080, end: 1312, label: "HALO RECONNECTS THE FRIENDS AND THE HALLOWEEN PORN PARODY BREAKS THE CLOSE", body: "The hosts credit Halo Reach with bringing them back together as adults. The viewer's Halloween-parody question then becomes a boundary joke about Loomis, Patreon, and a codeword the audience can use to demand chaos without turning it into a promise.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-audio-human-editorial-read",
    editorialPass: "2026-08-09 full local audio read; source-local Whisper aligned to the edited Curse of Chucky commentary across the pirate-warning opening, beard joke, improvised songs, close-up eating complaint, Chucky's daughter, childhood friendship memory, bathtub doll experiment, Halo Reach reconnection, and Halloween parody Patreon detour",
    evidence: Object.freeze({ duration: duration, captionWords: 0, captionEvents: 0, captionSpanSeconds: 0, captionDurationCoveragePercent: 0, captionSha256: "not-available-no-public-caption-ledger", captionSourceKind: "no public caption ledger; source-local Whisper ASR", audioPass: "canonical local source audio + local Whisper alignment; edited watchalong timestamps remain the playback authority", audioSha256: "78081937332048CB19EA74686C73B1FA4D13776DE45B2A31AE7F770DC1229139", asrWindowCount: 1, asrSegmentCount: 211, asrSha256: "30E6AF9C54FB4DF89EA844EECCA7D7CD748F422138662AC11403437E8148FC93", speakerAttribution: false, visualOutcomeInferred: false }),
    label: "WATCHALONG CUT // CURSE OF CHUCKY",
    badge: "AUDIO-ONLY FULL SHOW WIKI // CHUCKY, HALO, FRIENDSHIP LORE, AND THE PATREON RED LINE",
    headline: "CURSE OF CHUCKY GETS THE WHITE-BEARD, BATHTUB, AND LOOMIS-PORN TREATMENT",
    deck: "A 21-minute edited audio watchalong with a blunt Chucky verdict, a childhood-friendship origin story, and a Halloween parody question that nearly becomes a programming meeting.",
    overview: "This short Curse of Chucky cut is not a generic plot summary and it is not pretending to have a public caption ledger. It is an audio-only, source-local Whisper dossier with playback as the authority. The hosts open by admitting they are not Chucky fans, turn the FBI warning into a pirate joke, and start singing before the commentary has found its rhythm. A close-up eating shot earns one of the cleanest disgust reactions in the tape. Chucky's daughter is praised as the person most likely to ruin him, which opens into a real Mike-and-J friendship memory: Star Wars toys, Comic Con, green beer, Halo Reach, under-bed attacks, and a bathtub experiment intended to restore a doll's color. The final stretch is pure WWAM boundary-testing. Halo Reach is credited with reconnecting the friends as adults, then a viewer asks about a Halloween porn parody in which Dr. Loomis gets a sex scene. The hosts debate the fictional Patreon episode, invent a poop-platter codeword, and leave the idea where it belongs: as a fan-room grenade, not a promise. Because there is no public caption ledger for this edited watchalong, no invented FAM names, exact quotes, or visual claims are promoted as fact.",
    topics: Object.freeze(["Curse of Chucky", "Chucky", "Tiffany", "Chucky's daughter", "Halo Reach", "Comic Con", "St. Patrick's Day", "Star Wars", "Dr. Loomis", "Halloween parody", "Patreon", "FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 690, end: 900, label: "CHUCKY'S DAUGHTER GETS TO BE THE FAMILY'S WRECKING BALL", topic: "Character read", body: "Play from 11:30. The hosts like the idea that Chucky's own daughter can hurt him more than another hero with a knife.", playAt: 690, playEnd: 900 }),
      hated: Object.freeze({ at: 430, end: 690, label: "THE CLOSE-UP EATING SHOT GETS SENT DIRECTLY TO STEVE'S ASSHOLE", topic: "Camera complaint", body: "Play from 7:10. The booth cannot tolerate a food close-up and spends the scene trying to escape the chewing.", playAt: 430, playEnd: 690 }),
      wildestDetour: Object.freeze({ at: 1080, end: 1195, label: "THE HALLOWEEN PORN PARODY QUESTION HITS THE PATREON WALL", topic: "Boundary joke", body: "Play from 18:00. A viewer asks about a Loomis sex scene; the room immediately wonders whether Patreon would ban the experiment.", playAt: 1080, playEnd: 1195 }),
      lastWord: Object.freeze({ at: 1195, end: 1312, label: "POOP PLATTER IS THE CODEWORD FOR FUTURE CHAOS", topic: "Community bit", body: "Play from 19:55. The audience gets a codeword, the show gets a boundary, and the commentary ends before the joke becomes a contract.", playAt: 1195, playEnd: 1312 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(300, 390, "Dan", "FAM QUESTION", "Dan is addressed during the Comic Con and green-beer memory."),
        F(500, 600, "Laura", "FAM QUESTION", "Laura is acknowledged during the close-up eating reaction."),
        F(900, 1020, "Anthony", "FAM QUESTION", "Anthony's message changes the subject into the Halloween parody question."),
        F(1080, 1195, "Chat", "PATREON QUESTION", "The chat asks about an X-Videos Halloween parody where Loomis gets a sex scene; the dossier keeps it as a fan question, not a cataloged episode."),
        F(1195, 1312, "Patreon FAM", "BOUNDARY BIT", "The hosts invent the poop-platter codeword as a playful boundary for future audience requests.")
      ]),
      note: "Five audio-grounded community receipts are carried into this dossier. There is no public caption ledger; names are only promoted where the local Whisper transcript makes the address legible, and no donation amount, speaker identity, or visual context is claimed."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
