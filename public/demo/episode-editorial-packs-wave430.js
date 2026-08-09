(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "Uz04ygWeetA";
  var duration = 1548;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-audio-human-editorial-read", evidenceState: "source-local Whisper audio; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local Whisper community receipt" };
  };
  var highlights = [
    H(0, 230, "OPENING FILE", "BRIDE OF CHUCKY STARTS WITH SECRETS, A PENTAGRAM, A HALLOWEEN 4 MASK, AND A DAD WHO BROUGHT HIS TWELVE-YEAR-OLD", "The edited watchalong opens with a chaotic audience roll call, a sidewalk-chalk pentagram, and a Halloween 4 mask hiding in the movie. The hosts immediately establish that this is a Chucky commentary where family viewing advice is going to be aggressively questionable."),
    H(230, 500, "CHUCKY / TIFFANY", "THE DOLL HAS A WIENER, TIFFANY HAS A WRAITH OF DESIRE, AND THE ROOM IS ALREADY SICK OF THE QUESTION", "A Bride of Chucky sex joke becomes the central character read. The hosts argue about the doll's anatomy, Tiffany's adult form, and why Jennifer Tilly makes J abandon every attempt at a neutral review."),
    H(500, 800, "WWAM UP IN YA", "THE WEDDING-DANCE STORY, WAFFLE HOUSE TIFFANY, AND A SUBSCRIBER COUNT DROP TURN THE MOVIE INTO A BAR MEMORY", "The commentary leaves the film for a strip-club story, a Waffle House comparison, and the hosts' history of being too drunk to afford an Uber. It is a real detour, not a missing plot summary: the movie becomes a prompt for friendship lore."),
    H(800, 1080, "FAM / TILLY VS HEIGL", "THE JENNIFER TILLY VERSUS KATHERINE HEIGL DEBATE BECOMES A THREE-ROUND WWAM FIGHT", "The audience picks sides while Mike and J build an absurd future-versus-good-time argument. The dossier keeps the bit as show performance and character callback, not as a serious claim about either actor."),
    H(1080, 1290, "CHARACTER READ", "BRIDE OF CHUCKY GETS CREDIT FOR ITS JENNIFER TILLY ENERGY, THEN THE ROOM ADMITS IT HAS STOPPED FOLLOWING THE PLOT", "The hosts still enjoy the early Jennifer Tilly angle but admit the review has become a character-performance room. Chucky's murder history, Tiffany's choices, and the movie's rubbery effects all get folded into the same vulgar argument."),
    H(1290, 1450, "STEVE'S ASSHOLE", "THE MOVIE'S DOLL SEXUALITY IS SENT TO STEVE'S ASSHOLE WITH A WAFFLE-HOUSE NAPKIN", "The commentary's strongest hate lane is not a single kill; it is the way the film asks the booth to judge dolls on fuckability. The hosts turn that discomfort into the night's most obvious Steve's Asshole receipt."),
    H(1450, 1548, "CLOSING FILE", "THE WATCHALONG ENDS WITH A CEDAR CHUCKY PROMISE AND A FLOATING-FORESHADOWING BUTTON", "The hosts thank the audience, promise to return for Seed of Chucky, and sign off with a deliberately unhelpful horror catchphrase. It is a short archive entry with a loud recurring-character footprint."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 230, label: "THE MOVIE STARTS UNDER A PENTAGRAM AND A QUESTIONABLE FAMILY-VIEWING POLICY", body: "The opening is an audience roll call, a chalk pentagram, a Halloween 4 mask, and a father claiming Bride of Chucky is bonding time with a twelve-year-old. The tape is audio-only, but its tone is unmistakable: the movie is being used as a launchpad for WWAM chaos.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 230, end: 500, label: "THE DOLL-BODY QUESTION TAKES OVER THE REVIEW", body: "Chucky's anatomy and Tiffany's adult form become the first real argument. The hosts are not pretending to conduct a film-studies seminar; they are documenting the exact moment a sex joke turns into a recurring character bit.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 500, end: 800, label: "A STRIP-CLUB MEMORY REPLACES THE PLOT FOR A WHILE", body: "The commentary wanders through a Waffle House comparison, a bad bachelor-party dance, and the horror of being too drunk to pay for an Uber. The detour is retained because it is the show's friendship memory, not a mistake to hide.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 800, end: 1080, label: "TILLY VERSUS HEIGL BECOMES A THREE-ROUND CHARACTER FIGHT", body: "The audience gets a choice and the hosts build a ridiculous long-term-versus-one-night argument around it. The bit is marked as performance, not fact, while the movie's Jennifer Tilly energy remains the actual reason the scene works for them.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1080, end: 1290, label: "THE ROOM ADMITS IT HAS LOST THE PLOT AND KEPT THE CALLBACKS", body: "Bride of Chucky still gets credit for the early Tilly material, but the commentary has become a series of callbacks: Chucky's murders, Tiffany's choices, and the hosts' own attraction debate all share the same lane.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1290, end: 1450, label: "STEVE'S ASSHOLE GETS THE DOLL-SEXUALITY FILE", body: "The strongest negative reaction is the movie forcing the booth to judge dolls on sexual appeal. It becomes the cleanest Steve's Asshole moment in the short cut and is preserved as a comic verdict, not a moral lecture.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1450, end: 1548, label: "SEED OF CHUCKY IS THE NEXT BAD DECISION", body: "The audience is thanked, Seed of Chucky is promised, and the commentary leaves on a float-too button. The watchalong is short, but its character callback can now be found from the archive instead of buried in an unsearchable upload.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-audio-human-editorial-read",
    editorialPass: "2026-08-09 full local audio read; source-local Whisper aligned to the edited Bride of Chucky commentary across the opening roll call, Halloween 4 mask callback, father/child-viewing bit, Chucky/Tiffany anatomy joke, strip-club and Waffle House detour, Jennifer Tilly/Katherine Heigl fight, Steve's Asshole verdict, and Seed of Chucky close",
    evidence: Object.freeze({ duration: duration, captionWords: 0, captionEvents: 0, captionSpanSeconds: 0, captionDurationCoveragePercent: 0, captionSha256: "not-available-no-public-caption-ledger", captionSourceKind: "no public caption ledger; source-local Whisper ASR", audioPass: "canonical local source audio + local Whisper alignment; edited watchalong timestamps remain the playback authority", audioSha256: "5E584B508DBDA800A3733F09CDC133446938DF4454ACB2C41533EF14A03E63BC", asrWindowCount: 1, asrSegmentCount: 284, asrSha256: "464CA9CC87580097479C4CF9D0AA222C573C571FFF7B1096DA950C075FED448C", asrCoverageEndSeconds: 1525.02, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "WATCHALONG CUT // BRIDE OF CHUCKY",
    badge: "AUDIO-ONLY FULL SHOW WIKI // TIFFANY, TILLY VS HEIGL, STEVE'S ASSHOLE, AND A CEDAR CHUCKY PROMISE",
    headline: "BRIDE OF CHUCKY GETS THE TIFFANY, WAFFLE HOUSE, AND STEVE'S ASSHOLE TREATMENT",
    deck: "A 26-minute edited audio watchalong where Jennifer Tilly turns the review into a three-round fight and the movie's doll-sexuality premise gets a direct route to Steve's Asshole.",
    overview: "This April 12, 2020 Bride of Chucky cut is an audio-only, source-local Whisper dossier because the public upload has no caption ledger. It opens with a chaotic audience roll call, a sidewalk-chalk pentagram, a Halloween 4 mask hiding in the movie, and a father claiming this is appropriate bonding time with a twelve-year-old. The commentary then finds its recurring engine: Chucky's anatomy, Tiffany's adult form, and the hosts' inability to discuss Jennifer Tilly without reopening the same argument. A strip-club memory, a Waffle House comparison, a subscriber-count panic, and a bachelor-party story replace plot summary for a while because the movie is functioning as a prompt for Mike-and-J friendship lore. The Jennifer Tilly versus Katherine Heigl debate becomes a three-round fight about a good time, a future, and the fictional punishments attached to each choice. The dossier marks the bit as performance and keeps the film read separate: the early Jennifer Tilly angle works for the hosts, the dolls' rubbery sexuality makes them uncomfortable, and the commentary eventually admits it has stopped following every plot beat. That discomfort is the cleanest Steve's Asshole lane in the cut. The close thanks the audience, promises Seed of Chucky next week, and signs off with a floating-horror button. There is no public caption ledger, so no exact quote, speaker attribution, or visual claim is presented as caption fact; playback remains the authority.",
    topics: Object.freeze(["Bride of Chucky", "Chucky", "Tiffany", "Jennifer Tilly", "Katherine Heigl", "Halloween 4", "Waffle House", "Steve's Asshole", "Seed of Chucky", "FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 800, end: 1080, label: "THE TILLY VERSUS HEIGL THREE-ROUND FIGHT", topic: "Character callback", body: "Play from 13:20. The room turns a simple question into a full WWAM long-game-versus-good-time argument.", playAt: 800, playEnd: 1080 }),
      hated: Object.freeze({ at: 1290, end: 1450, label: "DOLL SEXUALITY GOES DIRECTLY TO STEVE'S ASSHOLE", topic: "Movie discomfort", body: "Play from 21:30. The hosts cannot stop judging dolls on fuckability and decide the premise belongs in the hate lane.", playAt: 1290, playEnd: 1450 }),
      wildestDetour: Object.freeze({ at: 500, end: 800, label: "A BAD BACHELOR-PARTY DANCE AND NO UBER MONEY", topic: "WWAM friendship lore", body: "Play from 8:20. The Bride of Chucky review turns into a drunk-night memory about a dance, a security guard, and an empty wallet.", playAt: 500, playEnd: 800 }),
      lastWord: Object.freeze({ at: 1450, end: 1548, label: "SEED OF CHUCKY IS NEXT", topic: "Watchalong handoff", body: "Play from 24:10. The audience gets the next assignment and the cut floats out before the jokes can become a contract.", playAt: 1450, playEnd: 1548 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(40, 120, "Gary", "OPENING ROLL CALL", "Gary is welcomed as the watchalong opens."),
        F(55, 140, "Erica", "OPENING ROLL CALL", "Erica is included in the audience roll call."),
        F(70, 150, "Zill", "OPENING ROLL CALL", "Zill is named before the film starts."),
        F(95, 170, "April", "OPENING ROLL CALL", "April is welcomed into the Bride of Chucky room."),
        F(100, 180, "Luna", "OPENING ROLL CALL", "Luna is named in the opening cluster."),
        F(115, 195, "Skyler", "OPENING ROLL CALL", "Skyler is included in the audience roll call."),
        F(145, 225, "Alex", "OPENING ROLL CALL", "Alex is welcomed before playback begins."),
        F(175, 255, "Gonzo", "OPENING ROLL CALL", "Gonzo is named during the pre-film chaos."),
        F(220, 310, "Papa Hades", "FAM SUPPORT", "Papa Hades says the hosts are funny and gets an affectionate reply."),
        F(255, 360, "Barry", "FAM / FAMILY VIEWING", "Barry says he watches with his twelve-year-old, opening the deliberately questionable father-son bit."),
        F(370, 470, "Nick", "FAM QUESTION", "Nick's BDSM confession is folded into the Michael mask callback."),
        F(610, 710, "Katie", "FAM SUPPORT", "Katie is acknowledged while the Jennifer Tilly tangent keeps going."),
        F(760, 860, "Sean", "FAM SUPPORT", "Sean is thanked during the Tilly discussion."),
        F(1000, 1110, "Alexander Mendoza", "FAM QUESTION", "Alexander's good-time/not-long-time message becomes a line in the Tilly versus Heigl fight."),
        F(1110, 1210, "Erica", "FAM CALLBACK", "Erica is told she is entering New Jersey as the argument spirals."),
        F(1450, 1548, "Bride of Chucky viewers", "NEXT WATCHALONG", "The audience is sent toward Seed of Chucky for the next commentary.")
      ]),
      note: "Sixteen audio-grounded community and callback receipts are carried into this dossier. There is no public caption ledger; names are only promoted where the local Whisper transcript makes the address legible, and no donation amount, speaker identity, or visual context is claimed."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
