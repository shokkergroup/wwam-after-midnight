(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "MbbQPoGezy0";
  var duration = 6656;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 900, "OPENING FILE", "THE PLAY BUTTON UNBOXING STARTS WITH PACKERS TRASH TALK, A PIRATE ROLL CALL, AND A MICHAEL MYERS VIRAL-VIDEO FANTASY", "The room opens in chat chaos: Luke, Billy, Jarvis, Mike Vick, Joe McKinsey, and others are read while the hosts threaten to turn a Michael Myers bit into a viral subscriber trap."),
    H(900, 1800, "TAKE GETS NUCLEAR", "JAIL IS DECLARED THE SCARIEST THING IN THE WORLD, THEN THE HOSTS EXPLAIN HOW NONE OF THEIR ARRESTS WERE THEIR FAULT", "A question about fear becomes a real reflection on lost freedom, followed by a jail story involving a mat, crackheads, a toilet, and a father pickup. The honesty and the profanity share the same sentence."),
    H(1800, 2700, "WWAM UP IN YA", "THE COP, THE COMMISSARY, AND A HALLOWEEN JAIL-BREAK QUESTION TURN THE SCARY-MOVIE CHAT INTO A CRIMINAL DEFENSE", "Valentino asks about a Halloween movie where Michael breaks into a jail, and the room drags the question through cop harassment, commissary jokes, and a Jason “play doctor” accusation."),
    H(2700, 3600, "FAM FILE", "BUTTON-UP SHIRTS, TURTLENECKS, PACKERS, AND THE MOST AGGRESSIVE CHAT ROLL CALL BEFORE THE PLAQUE ARRIVES", "The hosts compare wardrobes, sports loyalties, and the names flooding the room. The jokes are crude, but the underlying event is clear: a community is showing up for the unboxing together."),
    H(3600, 4500, "MILESTONE FILE", "THE 100,000-SUBSCRIBER PLAY BUTTON IS READ AS A RECEIPT FOR EIGHT YEARS OF DICK AND FART JOKES", "The YouTube letter is opened and paraphrased with the channel's own language. The hosts connect the silver button to Halo 3's level-50 grind and admit they always hoped this day would happen, even when they could not imagine it would."),
    H(4500, 5400, "LOVE LETTER", "THE SILVER BUTTON IS CALLED THE FAM'S, NOT THE HOSTS', AND THE ROOM REMEMBERS WHY THE CHANNEL KEPT GOING", "The milestone turns into a direct thank-you. The hosts refuse the business-guru story: they are two people who kept making videos, and the audience made the object possible."),
    H(5400, 6300, "FAM HALL OF FAME", "VANESSA, JASON GOUDREAU, AND THE PEOPLE WHO NEVER STOP SHOWING UP GET THEIR NAMES READ INTO THE OBJECT", "Vanessa is singled out as someone always there; Jason Goudreau raises a toast; the play button is passed symbolically to the people who kept the channel alive."),
    H(6300, 6656, "CLOSING FILE", "THE MILESTONE ENDS AS A SURVIVAL MANUAL: ONE BAD MOMENT IS NOT YOUR WHOLE LIFE", "The last words widen beyond YouTube. The hosts tell anyone watching that a bad stretch is one bubble in a life, not the whole story, and send the room out stronger than it entered."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 900, label: "THE UNBOXING OPENS AS A CHAT-POWERED VIRAL-MYERS BIT", body: "The first minutes are a roll call and a dare. Sports trash talk, pirate greetings, and a Michael Myers subscriber fantasy establish that the object will be unboxed inside a community, not in a quiet studio.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 900, end: 2700, label: "JAIL IS THE SCARIEST THING, AND THE STORY GETS GROSS BEFORE IT GETS HONEST", body: "A fear question leads to lost freedom, arrest stories, a mat beside a toilet, and the claim that none of it was anyone's fault. Valentino's Halloween jail question keeps the horror lane alive while the hosts expose their own history.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 2700, end: 3600, label: "CLOTHES, PACKERS, AND THE FAM ROLL CALL BUILD THE ROOM AROUND THE BOX", body: "Button-ups, turtlenecks, Packers loyalty, and a flood of names make the audience visible before the plaque is opened. The unboxing is already happening socially, not just physically.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3600, end: 4500, label: "THE SILVER BUTTON IS A RECEIPT FOR EIGHT YEARS OF DICK AND FART JOKES", body: "YouTube's letter is read through WWAM's own vocabulary, but the milestone is treated seriously. The hosts connect it to Halo 3's level-50 grind and the strange gap between hoping for success and actually holding proof of it.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 4500, end: 5400, label: "THE OBJECT BELONGS TO THE FAM", body: "The hosts reject the lone-genius narrative. They are not business moguls; they are two people who kept making videos, while the audience supplied the reason the play button could exist at all.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 5400, end: 6656, label: "VANESSA, JASON GOUDREAU, AND THE LAST WORD ABOUT SURVIVING A BAD MOMENT", body: "The FAM Hall of Fame lane names the people who stayed, then the close becomes a small survival manual: one awful moment is one bubble in a life, not the entire life. The plaque is an object; the community is the story.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the 1h51 Play Button Unboxing stream; local caption/audio evidence was checked across the Packers and pirate opening, Michael Myers viral-video fantasy, jail fear and arrest story, Valentino's Halloween jail question, wardrobe and sports roll call, YouTube 100K letter, Halo 3 level-50 comparison, Vanessa and Jason Goudreau gratitude, and the closing survival message",
    evidence: Object.freeze({ duration: 6656.139, captionWords: 24083, captionEvents: 6267, captionSpanSeconds: 6655.4, captionDurationCoveragePercent: 99.99, captionSha256: "241fe9db8b9d623f5ec7258b39bb61fbd7e6e6b9c7cd0208bb79032ade906b6f", captionSourceKind: "source-local canonical speech-to-text caption ledger", audioPass: "canonical local source audio + source-local Whisper alignment; playback remains the authority", audioSha256: "619fe6dfcc858577c7ede97c85add1baeb18c7c6ce426a27a380b120d4475a36", asrWindowCount: 1, asrSegmentCount: 428, asrSha256: "bc717eef77fdcd5c82311acebf25b753a517b408d491da45912d29d9a127b2e8", asrCoverageStartSeconds: 78, asrCoverageEndSeconds: 6326, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "LIVE MILESTONE FILE // THE PLAY BUTTON",
    badge: "FULL SHOW WIKI // 100K, FAM HALL OF FAME, JAIL FEAR, AND THE OBJECT THAT BELONGS TO EVERYONE",
    headline: "THE SILVER BUTTON BELONGS TO THE PEOPLE WHO STAYED",
    deck: "A 111-minute milestone stream where the YouTube play button is unboxed through jail stories, Halloween questions, sports trash talk, and a direct thank-you to the FAM who made it possible.",
    overview: "The Play Button Unboxing stream is not really an unboxing. The silver object is the physical center, but the show is about who is allowed to claim it. It opens with Packers trash talk, pirate greetings, a Michael Myers viral-video fantasy, and a long roll call that makes the audience visible before the box is even opened. A question about the scariest thing in the world turns serious: jail, lost freedom, and the inability to eat, sleep, or move when you want. The story then gets filthy and specific—an arrest, a mat beside a toilet, crackheads throwing up, and the insistence that none of it was the speaker's fault. Valentino's question about a Halloween jail-break movie folds the horror archive back into the personal story. Wardrobe arguments, turtlenecks, Packers loyalties, and dozens of chat names build the social space around the plaque. When YouTube's letter arrives, the hosts read it through their own vocabulary—100,000 subscribers despite dick and fart jokes—then connect the silver button to the old Halo 3 level-50 grind. The emotion is not hidden behind the jokes. They admit they always hoped this could happen, but holding the object is different from imagining it. Vanessa is singled out as someone who is always there. Jason Goudreau raises a toast. The plaque is symbolically handed to the FAM. The final movement widens beyond the channel: a terrible moment is one bubble in a life, not the whole life. This is the natural first entry in a WWAM FAM Hall of Fame because the stream itself says the milestone belongs to the people who stayed.",
    topics: Object.freeze(["100K", "YouTube Play Button", "FAM", "Halloween", "Michael Myers", "Loomis", "Jason", "Jail Stories", "Halo 3", "Packers", "Community Memory"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 3600, end: 5400, label: "THE SILVER BUTTON THANK-YOU", topic: "Milestone memory", body: "Play from 1:00:00. The YouTube letter, Halo 3 comparison, and the refusal of the lone-genius story make the milestone feel earned rather than branded.", playAt: 3600, playEnd: 5400 }),
      hated: Object.freeze({ at: 900, end: 1800, label: "THE JAIL STORY", topic: "Fear and honesty", body: "Play from 15:00. The room starts with a fear question and lands beside a toilet, a mat, and a very specific arrest memory.", playAt: 900, playEnd: 1800 }),
      wildestDetour: Object.freeze({ at: 0, end: 900, label: "MICHAEL MYERS VIRAL SUBSCRIBER TRAP", topic: "Opening bit", body: "Play from 0:00. The room threatens to turn a Myers stunt into a subscriber machine before the box is touched.", playAt: 0, playEnd: 900 }),
      lastWord: Object.freeze({ at: 6300, end: 6656, label: "ONE BAD MOMENT IS NOT YOUR WHOLE LIFE", topic: "Community care", body: "Play from 1:45:00. The close turns the milestone into a message for anyone watching from a bad place.", playAt: 6300, playEnd: 6656 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(70, 150, "Luke", "OPENING ROLL CALL", "Luke is welcomed in the opening chat run."),
        F(70, 150, "Billy", "OPENING ROLL CALL", "Billy is welcomed during the pirate and Packers roll call."),
        F(150, 230, "Mike Vick", "SPORTS CHAT", "Mike Vick is addressed in the Packers discussion."),
        F(250, 340, "Joe McKinsey", "CHAT ROLL CALL", "Joe McKinsey is read during the opening chaos."),
        F(390, 500, "Jarvis", "FAN SUPPORT", "Jarvis is thanked and praised for singing."),
        F(2000, 2100, "Valentino", "HALLOWEEN QUESTION", "Valentino asks about a Halloween movie where Michael breaks into a jail."),
        F(3700, 3900, "FAM", "MILESTONE RECEIPT", "The silver play button is framed as belonging to the audience."),
        F(5450, 5700, "Vanessa", "FAM HALL OF FAME", "Vanessa is singled out as someone who is always there and always has their backs."),
        F(5850, 6000, "Jason Goudreau", "TOAST / SUPER CHAT", "Jason Goudreau raises a drink to the hosts' dreams."),
      ]),
      note: "Nine source-local FAM, sports, question, support, and milestone receipts are carried into this dossier. Names and interaction types are caption evidence; donation totals and speaker attribution beyond the visible context remain unclaimed."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
