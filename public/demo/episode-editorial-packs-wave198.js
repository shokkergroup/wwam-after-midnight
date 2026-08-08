(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "GGwH66duPjE";
  var H = function (at, end, category, label, excerpt, characters) {
    var item = { at: Math.max(0, Math.round(at)), end: Math.min(5798, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
    if (characters) item.characters = characters;
    return item;
  };

  /* October 15, 2024: a Terrifier 3 spoiler room where the hosts argue about Art's rules, Sienna's destiny, and how to end a franchise without turning it into a Bible pamphlet. */
  var highlights = [
    H(0, 170, "ROOM BREAK", "TERRIFIER 3 OPENS WITH A BOX-OFFICE SHOCK", "The room starts with the strange fact that a nasty little indie clown movie is suddenly a serious theatrical event. The surprise is not just the money; it is that the audience wants to talk about the movie's mythology instead of treating it like disposable gore."),
    H(170, 340, "FILM READ", "THE JOKER 2 COMPARISON GETS MEAN", "Terrifier 3's no-studio-marketing success is held against Joker 2's expensive misery. The hosts are not pretending the films are the same kind of movie; they are asking why one felt alive while the other felt assembled in a boardroom."),
    H(340, 510, "STRAIGHT TO STEVE'S ASSHOLE", "THE AUTOGRAPH TABLE HAS A COVER CHARGE IN SPIRIT", "Patreon autographs, convention logistics, and the idea of making people pay for a scare-floor handshake get dragged into the light. The WWAM rule is simple: if the fans already built the room, do not charge them for entering it."),
    H(510, 690, "FAN SIGNAL", "SCAREFEST GETS THE FREE-AUTOGRAPH EXCEPTION", "The hosts explain why their own autograph policy is meant to stay generous, then turn the convention economy into a joke about crates, baby oil, chairs, and the strange things a horror weekend can demand."),
    H(690, 870, "CHARACTER PERFORMANCE", "LOOMIS SAYS ART WOULD MAKE MICHAEL SCREAM", "A Dr. Loomis detour asks what would happen if Michael Myers met Art the Clown. Loomis treats Art as a problem no respectable psychiatrist would accept, then quietly admits the silent man might finally meet something he cannot intimidate.", ["Dr. Loomis"]),
    H(870, 1040, "FILM READ", "DAVID HOWARD THORNTON MAKES SANTA A THREAT", "Art's Santa routine works because David Howard Thornton can make a prop, a pause, or one rotten look do the work of a speech. The hosts praise the performance before asking whether the character has any ceiling at all."),
    H(1040, 1210, "FILM READ", "THE THEATER CROWD WAS NOT READY FOR THE GORE", "Viewers describe the physical reaction of seeing Terrifier 3 in a theater: laughter, groans, people looking away, and the unmistakable feeling that the movie is daring the room to keep eating popcorn."),
    H(1210, 1390, "MAJOR TOPIC TURN", "TERRIFIER 2 HAD A STORY UNDER THE BLOOD", "The hosts push back on the lazy gore-porn label. T2 had Sienna, the sword, the resurrection, and a real supernatural engine, so the nastiness landed as part of a story instead of a random punishment machine."),
    H(1390, 1560, "FILM READ", "VICKI'S VOICE SOUNDS LIKE ART'S ECHO", "Vicki's speech and physical transformation become the night's first serious theory. The hosts wonder whether Art's influence is contagious, whether the Little Pale Girl is steering it, and whether the movie is deliberately keeping the rules just out of reach."),
    H(1560, 1730, "FAN SIGNAL", "THE CHAT WANTS SIENNA TO WALK INTO HELL", "A viewer's question turns Terrifier 4 into a possible descent story: Sienna, a missing child, a portal, and Art waiting somewhere that is worse than a bedroom or a carnival. The hosts like the idea because the franchise has already made normal geography useless."),
    H(1730, 1910, "STRAIGHT TO STEVE'S ASSHOLE", "THE KIDS-GORE ARGUMENT GETS NO EASY ANSWER", "The hosts admit that the movie crosses a line by putting children near the violence, then refuse the easy internet argument that a line automatically makes the film bad. The discomfort is part of the conversation, not something to hide behind a rating label."),
    H(1910, 2080, "FILM READ", "THE FIVE-YEAR GAP IS A LOADED GUN", "The jump forward in time creates more questions than answers. Sienna is older, the family has changed, and the movie treats the missing years like a locked room that Damian Leone may open only when the next sequel is ready."),
    H(2080, 2250, "FAN SIGNAL", "THE RANKING LANDS: T2, THEN T3, THEN T1", "Mike and the room place Terrifier 2 first because it built the mythology, Terrifier 3 second because it expands the playground, and Terrifier 1 third because it is still a rougher, smaller experiment."),
    H(2250, 2420, "SOUNDBYTE / REPLAY", "ART IS HORROR'S JIM CARREY WITH A KNIFE", "The hosts find the cleanest description of Art's appeal: physical comedy, elastic timing, and a face that can turn a silent pause into a threat. The Jim Carrey comparison is ridiculous until it suddenly feels exactly right."),
    H(2420, 2590, "FILM READ", "THE POPCORN BUCKET BECOMES A CHARACTER", "Merchandise talk turns the Art head popcorn bucket into a miniature piece of movie mythology. It is a silly object, but the hosts understand why fans want a physical souvenir of something this aggressively mean."),
    H(2590, 2760, "WWAM UP IN YA", "ART SITS LIKE MICHAEL MYERS AND THEN DESTROYS THE ROOM", "A quiet Art pose is compared to Michael's eleven-year stare, before the conversation swerves into bodily-function comedy, filthy fingernails, and the idea that Art can turn stillness into a gross-out weapon."),
    H(2760, 2930, "FILM READ", "JONATHAN PROBABLY IS NOT DEAD BECAUSE THE MOVIE HIDES IT", "The hosts argue that a death this important would have been shown if the story wanted certainty. The absence of a body becomes its own clue, even while everyone admits Terrifier is perfectly willing to be cruel later."),
    H(2930, 3100, "ROOM BREAK", "COURTNEY'S UBER SKIT ARRIVES LIKE A SIDE QUEST", "A viewer's question launches a Courtney Uber bit that has almost nothing to do with the plot and everything to do with the room's ability to turn one name into a whole little crime story."),
    H(3100, 3270, "FILM READ", "THE SHOWER KILL VERSUS THE DEMOLITION FACE RIP", "The hosts debate which Terrifier 3 death is nastier: the shower attack or the face-removal scene. The answer keeps changing because one is more intimate while the other is more technically disgusting."),
    H(3270, 3440, "STRAIGHT TO STEVE'S ASSHOLE", "THE RAT IN THE VASE GETS REJECTED", "The rat gag is the rare kill the room actively dislikes. It is not too violent; it is too smelly in the imagination. The hosts can practically smell the vase, which is not the kind of immersive detail anyone requested."),
    H(3440, 3610, "FAN SIGNAL", "ROMULUS LEADS THE 2024 HORROR BOARD", "A quick ranking puts Alien: Romulus at the top, with Terrifier 3, Terrifier 1, Longlegs, The First Omen, Maxxxine, and Strange Darling fighting for the next chairs. The list is a snapshot, not a permanent decree."),
    H(3610, 3780, "FILM READ", "SIENNA'S HANDS HEAL BECAUSE THE SWORD HAS RULES", "The hosts correct an early assumption: Sienna's damaged hands recover because the sword is tied to her resurrection and immortality. The uncertainty is the point; the movie has given the blade a mythology without publishing a user's manual."),
    H(3780, 3950, "SOUNDBYTE / REPLAY", "ART AS A NUTCRACKER AND A CHRISTMAS MENACE", "Santa imagery, the Nutcracker comparison, and the promise of holiday nastiness show why the Christmas setting works. Art does not need a new personality; he only needs a new prop and a room full of people who trusted the decorations."),
    H(3950, 4120, "FILM READ", "THE SWORD, THE THROAT, AND THE MICHAEL MYERS TEST", "A viewer asks what horror icon could actually kill Art. The hosts argue that Michael or Jason could hurt him physically, but Art's real weapon is his ability to torture the people his opponent loves."),
    H(4120, 4290, "FAN SIGNAL", "SIENNA BEATS THAT ASS", "A viewer insists that nobody fights back against the supernatural. The hosts immediately point to Sienna, the sword, and the fact that the final girl has already put Art through a much worse evening than he expected."),
    H(4290, 4460, "WWAM UP IN YA", "ADRIAN'S SUPERCHAT BECOMES A THREE-TIME HUNT", "A missing question sends Mike scrolling through the chat, accusing Adrian of tormenting him, threatening a home visit, and escalating until the search itself becomes funnier than the answer."),
    H(4460, 4630, "FAN SIGNAL", "THE NEW VIEWER GETS A WELCOME AND A THREAT", "A first-time viewer is welcomed into the room while the hosts explain that this channel is old, loud, and unusually happy when somebody new wanders into the mess."),
    H(4630, 4800, "FILM READ", "SIENNA NEEDS A MEAN ENDING, NOT A CLEAN ONE", "The hosts want Sienna to survive, but not through a tidy heroic wrap-up. Their ideal ending gives Art the most painful death in the franchise while letting the final girl live with the scars instead of receiving a victory-lap parade."),
    H(4800, 4970, "STRAIGHT TO STEVE'S ASSHOLE", "THE OMEN ENDING IS THROWN INTO MORTAL KOMBAT", "A happy ending is defended until somebody imagines the worst possible religious finale: Bible quotes, angels, and God saving the day. The proposed punishment for that ending is a roof, spikes, pickle juice, and a Justin Bieber concert."),
    H(4970, 5140, "FAN SIGNAL", "EASTER ART GETS A YES, MUSICAL ART GETS A NO", "The room can imagine Art turning Easter into another holiday battlefield, but a musical is where the audience draws its line. Even this franchise has one thing it should not sing about."),
    H(5140, 5310, "FILM READ", "THE FRANCHISE SHOULD NOT COPY ITS OWN GRIEF", "The hosts worry that another long grief jump could repeat Jamie Lee Curtis's later Halloween problem: the character is sad again, the movie announces that she is sad, and the audience is asked to applaud the sadness."),
    H(5310, 5480, "SOUNDBYTE / REPLAY", "THE ZOMBIFIED VICTIMS FINALE", "A viewer pitches every victim rising for a thirty-minute murder recap, with Sienna delivering the last kill. The hosts call it an Avengers-sized finale and immediately demand something even more perverse for Art's end."),
    H(5480, 5650, "CHARACTER PERFORMANCE", "DR. CHALLIS WRITES SIENNA'S INVESTIGATION PLAN", "Dr. Challis hijacks the finale with a fake case file: investigate Sienna's father's death, sleep in the wrong bed, drink with a homeless man, and somehow become the only doctor in town who can survive a television massacre.", ["Dr. Challis"]),
    H(5650, 5798, "CLOSING READ", "TERRIFIER 4 GETS ANNOUNCED BY A DYING BATTERY", "The stream closes with a dead laptop battery, a camera that keeps twitching back to life, and the next-night promise: Michael Myers versus Jason, kill by kill. Even the technical collapse becomes a trailer for the next WWAM event."),
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio pass across the October 15, 2024 Terrifier 3 spoiler livestream",
    evidence: Object.freeze({
      duration: 5798,
      captionWords: 18257,
      captionEvents: 2453,
      captionSpanSeconds: 5794.92,
      captionDurationCoveragePercent: 99.95,
      captionSha256: "0e9d0359cff6ca3dcc2fcfd9d06357b5b270a788899da36ca67446953d2d9f70",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio playback spot-check; playback remains the authority",
      audioSha256: "152c43b15336276299455a62fad8e23187cf9154f338d10781c14d2909805475",
      asrWindowCount: 24,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "TUESDAY LIVE // OCTOBER 15, 2024",
    badge: "FULL SHOW WIKI // TERRIFIER 3 SPOILERS, ART THEORY, SIENNA, FAN QUESTIONS, AND THE NEXT HORROR WAR",
    headline: "ART THE CLOWN DOES NOT FOLLOW RULES, SO WWAM TRIES TO WRITE THE ENDING",
    deck: "A 1h36m spoiler room about Terrifier 3's breakout, Vicki's nightmare voice, Sienna's sword, the nastiest possible Art death, and a battery-powered tease for the next Michael-versus-Jason night.",
    overview: "The October 15 Terrifier 3 spoiler stream is less a review than a late-night autopsy with the lights left on. Mike spends the opening trying to explain how an indie clown movie became a real theatrical event, then uses Joker 2 as the expensive counterexample: one film feels like a living fan object, the other feels like a boardroom trying to impersonate a cultural moment. From there the conversation gets properly unhinged. David Howard Thornton's Art is praised as a silent physical performer with Jim Carrey timing, Vicki's voice is treated as a possible echo of Art, and Sienna's sword becomes the hinge between injury, resurrection, immortality, and whatever the franchise is calling hell this week. The room does not dodge the hard material. They argue about children near the violence, the smell of the rat-in-a-vase gag, whether Jonathan is really dead, and why the shower kill may be the most nauseating thing in a series that already includes a bedroom massacre. The strongest stretch is the ending debate. Mike wants Sienna alive, but he wants Art to receive the most painful, disgusting, emotionally meaningful death in the entire franchise; the hosts reject a clean Bible-and-angels finale and even let the chat pitch Easter Art, a thirty-minute zombie recap, and a Terminator movie with Terrifier's R-rated nerve. The fan room keeps the show moving: Adrian's missing Super Chat becomes a scrolling meltdown, a new viewer gets welcomed, and Wobbly Carriage Man floats the theory that Sienna's father is Art. Dr. Challis then arrives to turn Sienna's investigation into a filthy Halloween 3 detour. The battery dies while Mike previews the next night's Michael Myers versus Jason kill desk, which makes the technical failure feel less like an ending than a deranged little trailer.",
    story: Object.freeze([
      { at: 0, end: 900, label: "THE INDIE CLOWN BREAKS THE BOX OFFICE", body: "Terrifier 3's theatrical success, Joker 2's backlash, and convention economics establish the night as both a movie conversation and a fan-community argument." },
      { at: 900, end: 1800, label: "ART, SANTA, AND THE ROOM THAT LOOKED AWAY", body: "David Howard Thornton's performance, theater reactions, T2's mythology, Vicki's voice, and the Little Pale Girl turn gore into a supernatural question." },
      { at: 1800, end: 2700, label: "THE FIVE-YEAR GAP AND THE POPCORN BUCKET", body: "The hosts rank the trilogy, wonder about Jonathan, celebrate Art's Jim Carrey timing, and let a piece of merch become part of the lore." },
      { at: 2700, end: 3600, label: "RATS, SHOWER KILLS, AND SIENNA'S HEALING HANDS", body: "A Courtney Uber detour, the shower-versus-face-rip debate, the rejected rat gag, a 2024 horror ranking, and the sword's healing rules make the middle of the show tactile and nasty." },
      { at: 3600, end: 4500, label: "WHO COULD ACTUALLY KILL ART?", body: "Michael and Jason are tested against Art's physical resilience and emotional cruelty, while Sienna and the chat insist that final girls are allowed to hit back." },
      { at: 4500, end: 5350, label: "NO BIBLE PAMPHLET ENDING", body: "The hosts want a brutal but meaningful finale, reject a clean religious wrap-up, approve Easter Art, reject a musical, and worry about repeating the franchise's grief beats." },
      { at: 5350, end: 5798, label: "CHALLIS AND THE BATTERY-POWERED SEQUEL TEASE", body: "Dr. Challis invents a terrible investigation plan, the camera dies and revives, and the next night's Michael-versus-Jason kill desk becomes the final joke." },
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2250, end: 2420, label: "ART AS HORROR'S JIM CARREY", topic: "physical comedy inside a slasher", body: "Play from 37:30. The hosts explain why Art can be funny, silent, and genuinely frightening in the same pause.", playAt: 2250, playEnd: 2420 }),
      hated: Object.freeze({ at: 3270, end: 3440, label: "THE RAT IN THE VASE", topic: "the one kill that smells wrong", body: "Play from 54:30. The room can handle the blood, but the imagined smell of the rat gag sends the whole thing straight into the trash.", playAt: 3270, playEnd: 3440 }),
      wildestDetour: Object.freeze({ at: 4800, end: 4970, label: "PICKLE JUICE AT THE APOCALYPSE", topic: "the worst possible Omen ending", body: "Play from 1:20:00. A Bible-and-angels finale is punished with spikes, pickle juice, and a concert nobody should survive.", playAt: 4800, playEnd: 4970 }),
      lastWord: Object.freeze({ at: 5480, end: 5650, label: "CHALLIS INVESTIGATES SIENNA'S DAD", topic: "the character mailbox closes the case", body: "Play from 1:31:20. Dr. Challis turns a missing-person mystery into an illegal medical vacation with a terrible outfit.", playAt: 5480, playEnd: 5650 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
