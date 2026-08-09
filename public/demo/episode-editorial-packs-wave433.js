(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "G2OGPR70z_Y";
  var duration = 4150;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 600, "OPENING FILE", "THE DEMOLITION MAN STREAM HAS A SLASHING CAST BACKDROP, A BAD FEED, AND WESLEY SNIPES' LORDS HAIRCUT", "The April 9 room opens by fighting the live interface, thanking Slashing Cast for the backdrop, and immediately recognizing John Spartan and Simon Phoenix as a better action pairing than the movie's reputation suggests."),
    H(600, 1200, "90S ACTION", "BLOCKBUSTER SLEEPOVERS, JUDGMENT NIGHT, AND THE FANTASY OF OWNING A WWAM VIDEO STORE", "A Demolition Man review turns into a 1990s movie-night memory. The hosts pitch a future WWAM video store where the audience can sleep over, then add Judgment Night and a confession that the collector shelf is swallowing the budget."),
    H(1200, 1800, "FUTURE SOCIETY", "THE THREE-SEASHELLS PROBLEM IS REALLY A 36-YEAR MEMORY PROBLEM", "The hosts question why a society only 36 years removed from John Spartan's era acts like toilet paper and murder are ancient history. The plot hole becomes a debate about whether the future is satire, amnesia, or a world built by people who never used a bathroom."),
    H(1800, 2400, "ACTION FILE", "THE MUSEUM SHOOTOUT AND HIGHWAY CHASE ARE THE MOVIE'S TWO REAL MOUNT RUSHMORE MOMENTS", "The museum relics, future guns, floor fight, and highway chase are singled out as the scenes that make the movie feel enormous. The hosts can see the holes, but the set pieces keep earning the rewatch."),
    H(2400, 3000, "STALLONE / SNIPES", "SIMON PHOENIX STEALS THE MOVIE, WHILE STALLONE'S RANKING GETS THROWN INTO THE ROCKY/RAMBO/Cobra MEAT GRINDER", "Wesley Snipes gets the most memorable performance, but the room debates where Demolition Man sits among Rocky, Rambo, Cobra, Tango & Cash, The Specialist, and Stop! Or My Mom Will Shoot. The final answer is personal, not a film-history law."),
    H(3000, 3550, "FAM / TECH", "THE COMPUTER DIES, THE DEMERIT SYSTEM RETURNS, AND THE CHAT STARTS BLAMING CAROLE BASKIN FOR THE FEED", "A dead battery, invisible Jay, a cursed computer, and the channel's one-dollar-per-curse demerit idea turn a late review into a live-production memory. The hosts land around 8.5 and 9.0 despite the plot holes."),
    H(3550, 3900, "CLOSING FILE", "THE MAFIA MOVIE PREVIEW, HOT NOODLES, AND A $300 FAM JOKE TURN TOMORROW INTO AN EVENT", "The stream closes by previewing the Mafia Mount Rushmore debate and the hotter-noodle challenge. Evil Little Bunny's support becomes a gratitude moment, not a sales pitch."),
    H(3900, 4150, "WWAM LORE", "DEMOLITION MAN IS THE MOVIE THAT MAKES YOU WANT TO BUY A PLAID SHIRT AND BUILD A GARAGE", "The final read is simple: it is not airtight, but it is intense, funny, and built to make the audience feel awesome. That is why the hosts rate it high and keep returning to the action scenes."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 600, label: "THE BACKDROP WORKS BEFORE THE STREAM DOES", body: "The Slashing Cast set gives the room a real show identity while the feed fights back. Once the signal settles, the hosts immediately identify the movie's engine: John Spartan, Simon Phoenix, and an action premise that deserves more conversation than it usually gets.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 600, end: 1200, label: "DEMOLITION MAN BECOMES A 90S MOVIE-NIGHT MEMORY", body: "Blockbuster sleepovers, Judgment Night, a growing collection, and the dream of a WWAM video store turn the review into a story about how people used to find movies together before the catalog became infinite.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1200, end: 1800, label: "THE THREE SEASHELLS ARE A WORLD-BUILDING RECEIPT", body: "The hosts' most useful criticism is the 36-year question: why does everyone behave as if John Spartan's world is ancient history? The joke exposes the film's satire and its missing connective tissue at the same time.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1800, end: 2400, label: "THE MUSEUM AND HIGHWAY KEEP THE MOVIE ALIVE", body: "The museum shootout and highway chase supply the physical proof behind the praise. The film can be a mess in its future logic and still deliver set pieces that make a three-decade-old action movie feel loud and immediate.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 2400, end: 3000, label: "WESLEY SNIPES GETS THE PERFORMANCE CROWN", body: "Simon Phoenix's haircut, psychopathy, and energy make Snipes the room's most memorable weapon. Stallone's catalog debate then refuses a single answer: Rocky and Rambo are bigger monuments, but Demolition Man is the one this room wants to keep on the shelf.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3000, end: 3550, label: "THE LATE TECHNICAL WRECK BECOMES PART OF THE REVIEW", body: "A dead battery, a dead computer, and a demerit system for cursing make the last third feel like another piece of live theater. The final scores land around 8.5 and 9.0 because feeling good is part of the movie's value here.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3550, end: 3900, label: "TOMORROW'S MAFIA DEBATE IS THE NEXT COMMUNITY EVENT", body: "The show does not just sign off; it assigns the next room: Mafia Movie Mount Rushmore and the internet's hottest noodles. A large FAM contribution is thanked as support for the community, not treated as an obligation.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3900, end: 4150, label: "THE FINAL VERDICT IS A FEELING WITH RECEIPTS", body: "Demolition Man is not airtight, but it is memorable, quotable, and physically exciting. The dossier preserves that balance so a future fan can see both the holes and the reasons the hosts keep pressing play.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-tape editorial read; canonical local audio aligned against the source-local caption ledger across the Slashing Cast backdrop, John Spartan/Simon Phoenix read, 90s Blockbuster memory, Judgment Night, three-seashells and 36-year plot-hole argument, museum/highway action, Stallone catalog ranking, late computer/de-merit chaos, final scores, Mafia/noodle preview, and FAM support close",
    evidence: Object.freeze({ duration: duration, captionWords: 13542, captionEvents: 3497, captionSpanSeconds: 4150.21, captionDurationCoveragePercent: 100.0, captionSha256: "8315274445613E48B5220E47EFDCA36125F710F0D4A456576F34DCC526D810D7", captionSourceKind: "source-local canonical speech-to-text caption ledger", audioPass: "canonical local source audio + caption alignment; local Whisper alignment retained for playback verification; playback remains the authority", audioSha256: "C96FBDF96BFC83A17245110A96274B7ADF5B85EC83FAC01C85B169548120F956", asrWindowCount: 1, asrSegmentCount: 289, asrSha256: "4D90D0439FA5FA749EEE67F25D3CDC5AF1410C70E1CC692C37F407CB0700D0B9", speakerAttribution: false, visualOutcomeInferred: false }),
    label: "LIVE REVIEW // DEMOLITION MAN",
    badge: "FULL SHOW WIKI // JOHN SPARTAN, SIMON PHOENIX, THREE SEASHELLS, AND 90S ACTION MEMORY",
    headline: "DEMOLITION MAN IS NOT A PERFECT FUTURE—IT IS A PERFECT WWAM REWATCH",
    deck: "A 69-minute review that separates the movie's plot holes from its museum shootout, highway chase, Wesley Snipes performance, and the feeling of wanting to build a garage afterward.",
    overview: "The April 9, 2020 Demolition Man review is a case study in why a real fan wiki needs more than a rating. It opens with a Slashing Cast backdrop, a half-broken live feed, and the immediate recognition that John Spartan and Simon Phoenix deserve more than the usual “90s action movie” label. Wesley Snipes' Phoenix gets the first crown: the hair, the psychopathy, and the performance's ability to feel like a Batman villain dropped into a future police satire. The room then moves through its 1990s memory lane—Blockbuster sleepovers, Judgment Night, the dream of a WWAM video store—and the collector reality that buying every movie for the show is eating the budget. The best criticism is the three-seashells problem. A society only 36 years removed from Spartan's era behaves like toilet paper, murder, and ordinary bathrooms are ancient history. The hosts call it a plot hole but also recognize the movie's satirical intent. The museum shootout and highway chase provide the counterweight: future guns, relics, floor fights, and a chase that still feels physical. Stallone's catalog ranking becomes its own debate—Rocky, Rambo, Cobra, Tango & Cash, The Specialist, Stop! Or My Mom Will Shoot—and the answer stays personal. Demolition Man is not necessarily the greatest Stallone film; it is the one this room wants to keep alive. The late stream gets technically ragged again, with a dead computer, a missing battery, an invisible Jay, and a one-dollar-per-curse demerit fantasy. Final scores land around 8.5 and 9.0 despite the holes because the movie makes the audience feel awesome. The close assigns the next community events: Mafia Movie Mount Rushmore and a hotter noodle challenge. Evil Little Bunny's large support is thanked as a sign of community, not a requirement. The final dossier keeps both truths: Demolition Man's future logic is wobbly, and its action, humor, and rewatch energy are exactly why it deserves a stronger archive page.",
    topics: Object.freeze(["Demolition Man", "John Spartan", "Simon Phoenix", "Wesley Snipes", "Sylvester Stallone", "three seashells", "Judgment Night", "Rocky", "Rambo", "Cobra", "Tango & Cash", "FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1800, end: 2400, label: "THE MUSEUM AND HIGHWAY SET PIECES", topic: "Action read", body: "Play from 30:00. The relics, future guns, and chase scenes supply the physical proof behind the high score.", playAt: 1800, playEnd: 2400 }),
      hated: Object.freeze({ at: 1200, end: 1800, label: "THREE SEASHELLS AND A 36-YEAR MEMORY HOLE", topic: "World-building complaint", body: "Play from 20:00. The hosts ask why the future acts like toilet paper and murder disappeared a century ago.", playAt: 1200, playEnd: 1800 }),
      wildestDetour: Object.freeze({ at: 600, end: 1200, label: "THE WWAM VIDEO STORE SLEEPOVER", topic: "90s movie culture", body: "Play from 10:00. Blockbuster, Judgment Night, and a fantasy video store turn the review into a memory of finding movies together.", playAt: 600, playEnd: 1200 }),
      lastWord: Object.freeze({ at: 3900, end: 4150, label: "8.5/9.0: THE FEELING COUNTS", topic: "Final verdict", body: "Play from 1:05:00. The plot holes stay visible, but the action and rewatch energy win the room.", playAt: 3900, playEnd: 4150 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(80, 170, "Isabel", "OPENING ROLL CALL", "Isabel is welcomed while the Slashing Cast backdrop comes online."),
        F(100, 190, "Jessica", "OPENING ROLL CALL", "Jessica is named in the first audience cluster."),
        F(120, 210, "Sean Tobey", "OPENING ROLL CALL", "Sean is welcomed before John Spartan enters the debate."),
        F(145, 235, "Orlando", "OPENING ROLL CALL", "Orlando is included in the room."),
        F(170, 260, "Nicole the Bat Queen", "OPENING ROLL CALL", "Nicole is called out as the chat fills."),
        F(290, 410, "Courtney Reed", "FILM QUESTION", "Courtney asks whether Anton Chigurh qualifies as Mafia."),
        F(740, 860, "Podcast 1919", "90S ACTION", "Podcast 1919 reminds the room about Judgment Night."),
        F(860, 980, "Greg Harris", "FAM SUPPORT", "Greg is thanked for the entertainment message."),
        F(1300, 1420, "Murder/Death/Kill chat", "PLOT QUESTION", "The chat helps the hosts unpack the film's 36-year history problem."),
        F(1940, 2050, "Evil Little Bunny", "FAM SUPPORT", "Evil Little Bunny is thanked for a message about the movie making people smile."),
        F(2480, 2600, "Diane", "STALLONE DEEP CUT", "Diane asks about Nighthawks."),
        F(2560, 2680, "Vanessa", "FAM SUPPORT", "Vanessa is greeted during the Stallone catalog debate."),
        F(2800, 2920, "Triple Eleven", "STALLONE DEEP CUT", "Triple Eleven asks about Driven and Get Carter."),
        F(3070, 3200, "Podcast 1919", "DAYLIGHT QUESTION", "Podcast 1919 reminds the room about Daylight."),
        F(3330, 3450, "Iron Baron", "TECH / CAROL BASKIN BIT", "Iron Baron is named while the feed and Carole Baskin joke derail the computer repair."),
        F(3670, 3790, "Evil Little Bunny", "CLOSING SUPPORT", "Evil Little Bunny's support is acknowledged as the next event is previewed."),
        F(3790, 3920, "Jack Bristow", "CLOSING SUPPORT", "Jack is thanked during the sign-off."),
        F(3950, 4150, "Mafia movie viewers", "NEXT EVENT", "The audience is invited back for the Mafia Mount Rushmore debate and hot-noodle challenge."),
      ]),
      note: "Eighteen source-local FAM, film-question, deep-cut, technical, and next-event receipts are carried into this dossier. Names and interaction types are caption evidence; donation amounts, speaker attribution beyond the visible chat context, and visual outcomes remain unclaimed. The 8.5/9.0 scores are preserved as host estimates rather than a machine-generated rating."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
