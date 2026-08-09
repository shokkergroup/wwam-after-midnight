(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "vxKUwIxs72A";
  var duration = 2879;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 430, "OPENING FILE", "THE POST-SHOW STARTS WITH TECHNICAL DIFFICULTIES, A NEW ROOM, AND THE HALLOWEEN AT HOME AFTERGLOW", "The short May 16 post-show opens by apologizing for another broken link, then turns the Halloween At Home Twitter event into the real subject: fans watching Halloween together, replying to jokes, and making a finger-based live commentary out of the quarantine."),
    H(430, 900, "TRAILER FORECAST", "THE LATEST TRAILER HOPE IS JULY 17, AND THE THEATER-RELEASE THEORY GETS A 35 PERCENT WEATHER REPORT", "The hosts reason from Tenet's July date and the possibility of theaters reopening. They do not claim a trailer is coming; they explain why a theatrical placement could be the reason Universal and Blumhouse are waiting."),
    H(900, 1370, "MASK / MYERS LORE", "THE POSTER MAY BE HIDING THE BURNT MASK, THE MYERS HOUSE MAY HOST THE BIG FIGHT, AND LAURIE MAY DIE THERE", "The conversation moves from the absence of a poster to the possibility that a poster would reveal the altered mask. The hosts imagine Laurie luring Michael back to the Myers house for a full-circle fight, carefully labeling the death prediction as their own theory."),
    H(1370, 1820, "FAM / HALLOWEEN AT HOME", "JUDY GREER, DANNY MCBRIDE, JOHN CARPENTER, JAMES JUDE COURTNEY, AND RYAN TUREK TURNED THE EVENT INTO A REAL COMMUNITY ROOM", "The hosts thank the people who showed up on Twitter and describe Halloween At Home as a live commentary performed with fingers instead of microphones. Judy Greer, Danny McBride, John Carpenter, James Jude Courtney, and Ryan Turek are preserved as event participants, not as endorsements of every host theory."),
    H(1820, 2250, "DELETED SCENES", "THE HALLOWEEN 2018 ALTERNATE ENDING IS SOMEWHERE ON A HARD DRIVE, AND THE ARCHIVE WANTS THE STUMP SHOT", "The hosts argue that the filmed alternate ending should not have vanished. They speculate that David Gordon Green may be holding a few shots for a future story, including Michael near Laurie's mannequins, but the dossier keeps this as a host theory rather than a production fact."),
    H(2250, 2680, "HALLOWEEN KILLS", "THE NEW DATE IS JULY 17, THE FILM IS EXPECTED TO BE GORIER, AND THE REAL FEAR IS THE MPAA", "The hosts revise their trailer hope to July 17, discuss reports that Halloween Kills is more violent and emotional, and worry that the rating process—not the movie's ambition—could be the obstacle. They also separate brutal Michael from a Jason-style body count."),
    H(2680, 2879, "CLOSING FILE", "THE FAM GETS THE TWITTER RECEIPT, THE NEXT LIVE SHOW GETS A MONDAY SLOT, AND THE JOKE ENDS IN PEANUT BUTTER", "The post-show sends the audience to the Halloween At Home hashtag, announces Monday's next live room, thanks newcomers, and closes with the channel's signature peanut-butter-on-everything escalation."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 900, label: "THE POST-SHOW TURNS A MISSING TRAILER INTO A RELEASE-STRATEGY INVESTIGATION", body: "The hosts are disappointed that Halloween At Home produced no poster or trailer, then reason through Tenet, theaters, Universal, and the July 17 possibility. Every forecast remains marked as forecast; the show never claims a trailer arrived.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 900, end: 1370, label: "THE BURNT MASK AND THE MYERS HOUSE BECOME THE TWO VISUAL SECRETS THEY WANT TO PROTECT", body: "A poster could reveal the mask, and a trailer could reveal the house. The hosts imagine Laurie and Michael returning to the original location for a full-circle fight, but keep Laurie's possible death in the theory lane.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1370, end: 1820, label: "HALLOWEEN AT HOME WAS A COMMUNITY EVENT, NOT JUST A PROMOTION", body: "Judy Greer, Danny McBride, John Carpenter, James Jude Courtney, and Ryan Turek are discussed through the event's Twitter activity. The WWAM audience did the actual work of making the watch party feel live while everyone was stuck at home.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1820, end: 2250, label: "THE MISSING ALTERNATE ENDING BECOMES A LOST-FOOTAGE STORY", body: "The hosts cannot understand why Halloween 2018's filmed alternate material was not released. Their imagined Michael-and-mannequins shot is preserved as a wish and a theory, not a verified scene list.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 2250, end: 2879, label: "THE NEW DATE, THE GORE, AND THE RATING ARE THE LAST THREE QUESTIONS", body: "The late show predicts July 17, expects a more violent and emotional Halloween Kills, and worries the MPAA could trim the thing fans are waiting to see. The close hands the room to Monday and the next round of FAM jokes.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-tape editorial read; canonical local audio aligned against the source-local caption ledger across the Halloween At Home after-show, trailer-release theory, burnt-mask speculation, Myers-house theory, deleted-ending discussion, production voices, and FAM handoff",
    evidence: Object.freeze({ duration: duration, captionWords: 10468, captionEvents: 2750, captionSpanSeconds: 2879.63, captionDurationCoveragePercent: 100.0, captionSha256: "8099ECFB6D30147AC45E6F287BD0744DB11D826F636AD653FB9D17FB56F30222", captionSourceKind: "source-local canonical speech-to-text caption ledger", audioPass: "canonical local source audio + caption alignment; local Whisper alignment retained for playback verification; playback remains the authority", audioSha256: "49E27FFCE59CADA24D45C62DD55A5CD78B806D31A3433150D2AE0A1E6C9BD0EE", asrWindowCount: 1, asrSegmentCount: 264, asrSha256: "903E8CF550B24BCDFB8B08C1B61CD63F843F808D64EC1AF76C8BD31B6475AD8B", speakerAttribution: false, visualOutcomeInferred: false }),
    label: "POST-SHOW // HALLOWEEN AT HOME + HALLOWEEN KILLS",
    badge: "FULL SHOW WIKI // TRAILER WEATHER, BURNT MASK THEORY, LOST ENDING, AND TWITTER FAM",
    headline: "NO TRAILER, BUT THE HALLOWEEN AT HOME RECEIPT IS REAL",
    deck: "A 48-minute source-local post-show dossier about the missing trailer, the theatrical-release theory, the altered mask, deleted Halloween 2018 material, and the FAM that made quarantine feel live.",
    overview: "The May 16, 2020 post-show is a compact companion to the Halloween At Home event. It opens with another broken stream and then preserves what the hosts actually learned from the Twitter watch party: Judy Greer, Danny McBride, John Carpenter, James Jude Courtney, Ryan Turek, and a large FAM audience turned watching Halloween at home into a finger-based live commentary. The missing Halloween Kills trailer becomes a release-strategy question. The hosts reason from Tenet's July 17 date, theaters reopening, Universal's trailer placement, and the danger of releasing footage before the October theatrical plan is certain. They speculate that the first poster or teaser could hide the altered mask, imagine Laurie luring Michael back to the Myers house, and wonder whether Laurie dies in a full-circle fight. A long detour argues that Halloween 2018's alternate ending and deleted shots should not have vanished, while clearly marking the imagined Michael-and-mannequins shot as host theory. The close predicts a more violent and emotional Halloween Kills and worries about MPAA cuts. No trailer is falsely claimed; the archive's real artifact is the community event and the disciplined separation between a plausible forecast and a verified update.",
    topics: Object.freeze(["Halloween At Home", "Halloween Kills", "Halloween 2018", "Michael Myers", "Laurie Strode", "Judy Greer", "Danny McBride", "John Carpenter", "James Jude Courtney", "Ryan Turek", "burnt mask", "Myers house", "deleted scenes", "alternate ending", "Universal", "Tenet", "FAM", "Twitter"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1370, end: 1820, label: "HALLOWEEN AT HOME BECOMES A FINGER-BASED LIVE COMMENTARY", topic: "Community event", body: "Play from 22:50. The hosts describe the audience tweeting through Halloween together and welcome the new people who found them through the event.", playAt: 1370, playEnd: 1820 }),
      hated: Object.freeze({ at: 430, end: 900, label: "THE TRAILER STILL HAS NOT ARRIVED, AND THE WAIT IS STARTING TO FEEL PERSONAL", topic: "Release uncertainty", body: "Play from 7:10. The hosts explain the theater-placement theory without pretending a date is confirmed.", playAt: 430, playEnd: 900 }),
      wildestDetour: Object.freeze({ at: 1820, end: 2250, label: "MICHAEL, MANNEQUINS, AND THE LOST STUMP SHOT", topic: "Deleted-ending theory", body: "Play from 30:20. The hosts imagine what David Gordon Green may still be holding back.", playAt: 1820, playEnd: 2250 }),
      lastWord: Object.freeze({ at: 2250, end: 2879, label: "JULY 17, MORE GORE, AND A PEANUT-BUTTER EXIT", topic: "Closing forecast", body: "Play from 37:30. The final forecast stays labeled as forecast and hands off to Monday's room.", playAt: 2250, playEnd: 2879 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(80, 170, "Judy Greer FAM", "HALLOWEEN AT HOME", "Judy Greer's Twitter participation is remembered as one of the reasons the event felt live."),
        F(180, 270, "Danny McBride FAM", "HALLOWEEN AT HOME", "Danny McBride is part of the event context the hosts are still buzzing about."),
        F(300, 390, "John Carpenter FAM", "HALLOWEEN AT HOME", "John Carpenter's small number of tweets becomes a character bit about being terse and intimidating."),
        F(420, 520, "James Jude Courtney", "PRODUCTION VOICE", "James Jude Courtney's event participation and behind-the-scenes sharing are acknowledged."),
        F(530, 630, "Ryan Turek", "PRODUCTION VOICE", "Ryan Turek's earlier trailer-placement comment feeds the release-date theory."),
        F(650, 750, "Spooky Guy", "TWITTER FAM", "Spooky Guy says he replied to the jokes, giving the hosts a direct receipt from the watch party."),
        F(780, 880, "David", "FAM SUPPORT", "David's messages arrive while the room waits for the trailer news and keeps the after-show moving."),
        F(1120, 1240, "Seth West", "BIRTHDAY REQUEST", "Seth hopes the trailer arrives for his July 21 birthday; the hosts argue that is too late for their prediction."),
        F(1480, 1600, "Derek B", "COMMUNITY SUPPORT", "Derek says hello while the hosts thank the audience for showing up after the event."),
        F(1900, 2020, "Ben / FAM", "DELETED SCENES", "A viewer's point about the Halloween 5 recovery leads into the larger lost-footage argument."),
        F(2290, 2420, "Kevin Bacon FAM", "CROSSOVER JOKE", "The chat turns Kevin Bacon and Ben Tramer into a deliberately absurd casting detour."),
        F(2500, 2620, "Drew Clayton", "HALLOWEEN KILLS", "Drew's message about the film being more violent feeds the MPAA and gore discussion."),
        F(2660, 2780, "Until Wild", "MICHAEL BOUNDARY", "Until Wild says more violence is fine as long as Michael does not become a Jason clone."),
        F(2780, 2879, "FAM", "CLOSING SUPPORT", "The hosts send the audience to the Halloween At Home hashtag and thank the newcomers before Monday's next live room.")
      ]),
      note: "Fourteen source-local FAM, event, production-voice, theory, and closing-support receipts are carried into this dossier. Names and interaction types are caption evidence; donation amounts, speaker identity, intent, and visual context remain unclaimed until playback review."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
