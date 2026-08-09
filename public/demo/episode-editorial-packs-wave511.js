(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "dghHfWVbtrs";
  var duration = 355;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 85, "SPOILER DODGE", "THE MOST ORIGINAL TITLE EVER: BENEDICT CUMBERBATCH, LENS FLARES, AND A PLOT THEY REFUSE TO EXPLAIN", "The opening is a non-spoiler wrestling match. The hosts introduce the new villain, riff on Cumberbatch's name, and admit that almost every useful sentence about the story would ruin a surprise."),
    H(85, 145, "THE JJ ABRAMS PACKAGE", "3D, LENS FLARES, AND A HUNDRED SIMON PEGG JOKES—ALLEGEDLY COUNTED BY HAND", "The hosts praise the effects, restrained 3D, familiar humor, and constant lens flare. Jay insists there are exactly one hundred funny Simon Pegg moments, a claim Mike threatens to audit in the comments."),
    H(145, 215, "THE CAST IS THE ENGINE", "KIRK, SPOCK, UHURA, SCOTTY, CHEKOV, AND KARL URBAN KEEP THE FUTURE HUMAN", "Their strongest shared point is the ensemble. Every returning character has a defined personality, the chemistry stays warm, and even a brief blonde-crew-member beat becomes part of the room's affectionate chaos."),
    H(215, 270, "KARL URBAN LANE", "I'M A DOCTOR, NOT A POOL MAN, PLUS A JUDGE DREDD DETOUR AND A VERY LOOSE CANNON KIRK", "The hosts cast themselves inside the crew, trade Judge Dredd lines, and use the Kirk/Spock contrast to describe the movie's central buddy dynamic: one plans with logic, the other shoots from the hip."),
    H(270, 315, "THE TWIST / THE TANGLE", "THE VILLAIN REVEAL IS COOL, THE MIDDLE GETS CONVOLUTED, AND ONE SCENE MAKES THE ROOM YELL 'ARE YOU SERIOUS?'", "Once the identity twist lands, the hosts feel the story briefly overstuff itself. The emotional stakes pull them back, but they are honest that the middle becomes a pile of simultaneous plot machinery."),
    H(315, 355, "8.5 VS. 9", "A GREAT SEQUEL WITH A SLIGHTLY MUDDIER MIDDLE, THEN A STAR TREK HISTORY CHECK FOR THE FAM", "Mike lands at 8.5 after giving the first film a 9. The closing prompt asks fans whether they came from the original shows, old movies, or the Abrams reboot, turning the review into a shared entry point."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 85, label: "THE REVIEW HAS TO WALK AROUND ITS OWN SPOILERS", body: "Mike and J begin by refusing to describe the plot. A new terrorist villain is introduced, Benedict Cumberbatch receives several deliberately terrible nickname riffs, and the hosts keep approaching the story before backing away from the spoiler cliff. The restraint is part of the episode's character: they are excited enough to spoil it, so they turn the avoidance itself into the bit.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 85, end: 145, label: "THE ABRAMS SIGNATURES STILL WORK", body: "The hosts like the sequel's 3D, effects, familiar humor, and reduced—though never absent—lens flare. Jay claims the film contains exactly one hundred funny Simon Pegg moments. Mike treats the number as a challenge, which is a very WWAM way to turn a normal craft compliment into a future comment-section trap.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 145, end: 215, label: "THE CREW IS WHY THE REBOOT HAS A HEARTBEAT", body: "The strongest agreement is about character chemistry. Kirk, Spock, Uhura, Scotty, Chekov, and the rest of the fleet still feel distinct, so the movie can move through huge futuristic set pieces without becoming a parade of anonymous uniforms. The hosts even make room for a quick blonde-crew-member joke, because affection and juvenile commentary can occupy the same seat in this booth.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 215, end: 270, label: "KARL URBAN GETS A SIDE QUEST", body: "Karl Urban's Bones becomes a launch point for a Judge Dredd detour, the old 'I'm a doctor, not a...' rhythm, and the hosts' own casting game. Jay claims Kirk because he shoots from the hip; Mike wants the looser-cannon lane. Their riff explains the reboot's appeal more clearly than a plot synopsis: these people are fun to be around.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 270, end: 315, label: "THE REVEAL IS GOOD; THE MIDDLE IS BUSY", body: "The hosts will not name the villain in the non-spoiler review, but they agree the identity reveal is effective and that the character deserves a movie of his own. Their reservation arrives immediately afterward: ten thousand plot pieces start moving at once, the story gets briefly boring, and one emotional scene makes the room shout at the screen. The anchor is what saves it—Abrams knows a future spectacle still needs a human nerve to grab.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 315, end: 355, label: "8.5 IS A COMPLIMENT WITH A QUALIFIER", body: "Mike gives Into Darkness an 8.5 after scoring the first reboot a 9. The downgrade is not a rejection; it is a note about the convoluted middle. The final question asks fans where their Star Trek history begins, from the old shows and films to the Abrams version. That makes the page useful to both longtime Trekkies and people whose only exposure is the reboot crew.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the full 5m55s Star Trek Into Darkness review; local audio and caption evidence was checked across the spoiler dodge, Benedict Cumberbatch name riffs, JJ Abrams lens flare and 3D, Simon Pegg joke count, the returning ensemble, Karl Urban and Judge Dredd, the Kirk/Spock contrast, the villain identity reveal, the convoluted middle, Abrams' emotional anchor, the 8.5 score, and the closing Star Trek history prompt",
    evidence: Object.freeze({ duration: 355, captionWords: 1349, captionEvents: 458, captionSpanSeconds: 356.52, captionDurationCoveragePercent: 100.43, captionSha256: "A80861D979B92B8C168ACA7941A57E5767162DB9A212BEA852B376D9BF1A632C", captionSourceKind: "source-local canonical YouTube automatic-caption ledger acquired as edge json3", audioPass: "canonical local source audio + source-local caption alignment; playback remains the authority", audioSha256: "E82B8D62C4208C641E0DCAB04B44E6BC402E22693BF79583F62B0ADB2A3C3F7E", asrSegmentCount: 0, asrSha256: null, asrCoverageStartSeconds: null, asrCoverageEndSeconds: null, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "REVIEW FILE // STAR TREK INTO DARKNESS",
    badge: "FULL SHOW WIKI // LENS FLARES, CUMBERBATCH, AND THE CREW THAT SAVES THE SEQUEL",
    headline: "INTO DARKNESS: THE 8.5 THAT REFUSES TO SPOIL ITSELF",
    deck: "A source-grounded review dossier for the Abrams sequel: the spoiler dodge, Cumberbatch name games, restrained 3D, alleged Simon Pegg perfection, Karl Urban worship, a cool reveal, a tangled middle, and a Star Trek history roll call for the FAM.",
    overview: "Mike and J review Star Trek Into Darkness while trying not to destroy the movie's surprises. They introduce Benedict Cumberbatch's new villain, turn his name into a string of terrible nicknames, and repeatedly approach the plot before backing away from the spoiler cliff. That avoidance becomes the episode's first running joke: the film contains so many reveals that even a normal summary feels dangerous. The craft discussion is enthusiastic. The hosts like the 3D, the effects, the familiar humor, and the fact that the lens flare is present without swallowing every frame. Jay claims there are exactly one hundred funny Simon Pegg moments and invites the comment section to prove him wrong. The larger shared argument is that the reboot succeeds because of its crew. Kirk, Spock, Uhura, Scotty, Chekov, and the rest of the fleet have distinct personalities and genuine chemistry, so the spectacle never becomes a parade of anonymous uniforms. Karl Urban gets his own detour through Judge Dredd, old doctor catchphrases, and a casting game in which Kirk is the loose cannon and Spock is the logical counterweight. The hosts' affection for the actors is not decorative; it explains why they stay invested when the story gets crowded. Once the villain identity is revealed, the hosts think the twist is cool and the performance strong enough to deserve its own film. The reservation is the middle. Ten thousand plot pieces move at once, the film briefly gets boring, and one scene makes the room yell at the screen. Abrams earns his way back by giving the futuristic spectacle an emotional anchor, a human event that makes the danger matter. Mike lands at 8.5 after giving the first reboot a 9. The score is a compliment with a qualifier: slightly muddier in the center, still entertaining from start to finish, and still powered by a cast the hosts want to revisit. The closing question asks fans where their Star Trek history begins, from the original shows and films to the Abrams version. This is a welcoming page for both longtime Trekkies and viewers who came in through the reboot.",
    topics: Object.freeze(["Star Trek Into Darkness", "J.J. Abrams", "Benedict Cumberbatch", "Chris Pine", "Zachary Quinto", "Karl Urban", "Simon Pegg", "lens flare", "Star Trek history", "WWAM FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 145, end: 215, label: "THE CREW CHEMISTRY", topic: "Ensemble", body: "Play from 2:25. The hosts explain why every member of the fleet still feels like a person instead of a uniform.", playAt: 145, playEnd: 215 }),
      hated: Object.freeze({ at: 270, end: 315, label: "THE CONVOLUTED MIDDLE", topic: "Story shape", body: "Play from 4:30. The reveal works, but the plot briefly becomes ten thousand things happening at once.", playAt: 270, playEnd: 315 }),
      wildestDetour: Object.freeze({ at: 215, end: 270, label: "JUDGE DREDD / LOOSE CANNON", topic: "Karl Urban", body: "Play from 3:35. A Star Trek review turns into a Karl Urban worship session and a Mike-versus-Jay crew casting game.", playAt: 215, playEnd: 270 }),
      lastWord: Object.freeze({ at: 315, end: 355, label: "8.5 AND STAR TREK HISTORY", topic: "Final verdict", body: "Play the close for the score and the invitation to tell the FAM where your Trek story began.", playAt: 315, playEnd: 355 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(5, 55, "THE FAM", "OLD SPICE POWER", "The cold open arrives with a deodorant-sized declaration."),
        F(20, 80, "THE FAM", "CUMBERBATCH NICKNAMES", "Benedict Cumberbitch, Cumberpants, and a doomed attempt at seriousness."),
        F(50, 90, "THE FAM", "SPOILER DODGE", "The hosts try to explain the movie without detonating the plot."),
        F(95, 145, "THE FAM", "ONE HUNDRED SIMON PEGG JOKES", "Jay claims a mathematically perfect comedy count."),
        F(110, 140, "THE FAM", "LENS FLARE", "The Abrams signature gets a friendly body check."),
        F(145, 210, "THE FAM", "THE CREW", "Every returning character gets a reason to stay on the bridge."),
        F(195, 215, "THE FAM", "BLONDE CREW MEMBER", "A quick, affectionate detour into the ship's eye candy."),
        F(215, 265, "THE FAM", "KARL URBAN", "Bones becomes Judge Dredd, doctor, and the best side conversation."),
        F(225, 255, "THE FAM", "LOOSE CANNON KIRK", "Kirk shoots from the hip; Spock does the math."),
        F(270, 315, "THE FAM", "VILLAIN REVEAL", "The twist is protected, but the reaction is preserved."),
        F(280, 320, "THE FAM", "TEN THOUSAND THINGS", "The middle gets crowded enough to lose the room for a minute."),
        F(285, 315, "THE FAM", "EMOTIONAL ANCHOR", "Abrams pulls the spectacle back to a human nerve."),
        F(300, 345, "THE FAM", "8.5 VS. 9", "The sequel earns a high score with one clear qualifier."),
        F(325, 355, "THE FAM", "STAR TREK HISTORY", "Original shows, old movies, or Abrams reboot? Tell the room."),
        F(340, 355, "THE FAM", "STAR WARS SIGN-OFF", "The episode exits through the wrong franchise door on purpose.")
      ]),
      note: "Fifteen source-local audience receipts are retained. No supporter identity or donation claim is present; the community lane is the spoiler-safe score and the closing Star Trek-history invitation."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
