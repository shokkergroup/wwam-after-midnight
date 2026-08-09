(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "7mTZZJ28YBU";
  var duration = 9905;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 620, "OPENING CHAOS", "THE COUNTDOWN FORGOT TO SHOW UP AND THE BLUETOOTH HEADPHONES TAKE THE BLAME", "The Friday opening starts late, blames the Bluetooth headphones, and turns a broken countdown into a tiny WWAM production meeting before the movie news can begin."),
    H(280, 520, "FAM RECEIPT", "COURTNEY REED CALLS THE SCREAM VIDEO AMAZING AND THE CHAT STARTS THE NIGHT", "Courtney Reed's first Super Chat praises the Scream video, then the booth shifts into a full Friday welcome with the kind of gratitude that immediately gets dirtier."),
    H(620, 880, "WWAM UP IN YA", "TITTIES, STONE COLD, AND A SUPER CHAT THAT REFUSES TO BE A NORMAL GREETING", "The FAM chat mixes a crude greeting with Stone Cold Steve Austin references, giving the show a quick reminder that its audience is part of the writing room."),
    H(880, 1320, "WANDAVISION", "SCARLET WITCH LOSES HER MARBLES AND VISION COMES BACK WRONG", "The WandaVision talk follows the finale's white Vision, the comics' darker Wanda trajectory, and the booth's description of a character losing her marbles in the most literal WWAM way possible."),
    H(1320, 1840, "SNYDER CUT", "THE JUSTICE LEAGUE RESHOOT THEORY, RAY FISHER, AND A FANDOM WITH RECEIPTS", "The hosts discuss the idea that the Snyder Cut became a revenge plot, the Ray Fisher/Joss Whedon fallout as they understood it, and why the reshoot story felt like a trail of smoke instead of a clean fact pattern."),
    H(1840, 2740, "SNYDER CUT", "DARKSEID, JOSS WHEDON, AND THE 'DON'T DANCE ON THE GRAVE' ARGUMENT", "The Snyder conversation grows into a debate over director control, whether the theatrical film was ever allowed to be itself, and why restoring a cut is different from pretending every rumor is confirmed history."),
    H(2880, 3210, "WWAM UP IN YA", "MACARONI, CHEESE, AND THE MYSTERY MAN NAMED BOBBY", "A break announcement becomes a snack argument, a stranger appears in the chat, and the booth discovers that even macaroni and cheese can be treated like a character audition."),
    H(3200, 3500, "GUEST INTRO", "DAMIAN MAFFEI ARRIVES IN A GHOST MASK WITH A NASCAR QUESTION", "The guest setup is pure WWAM: a ghost mask, a question about a NASCAR driver, and a story that sounds like a haunted-house entrance until the guest finally gets to talk."),
    H(3500, 4200, "DAMIAN MAFFEI INTERVIEW", "WRONG TURN'S DAMIAN MAFFEI GETS THE 'BUT YOU CAN'T TALK' JOKE", "The booth explains how people reacted to Damian's role in Wrong Turn, including the recurring joke that nobody expected the giant masked presence to have a voice. Damian takes it without losing the room."),
    H(4200, 5150, "DAMIAN MAFFEI INTERVIEW", "WRONG TURN, HAUNT, AND THE DIFFERENCE BETWEEN A BIG MASK AND A REAL PERFORMANCE", "Damian talks through intimidating scenes, the other actors who help sell the threat, and the freedom of playing a character whose identity is hidden without reducing the work to a costume."),
    H(5150, 6150, "DAMIAN MAFFEI INTERVIEW", "THE NEXT SLASHER, THE CHUCKY SKETCH, AND THE MAN IN THE MASK WHO SHOULD STILL BE ALIVE", "The interview moves through reboot fatigue, a possible animated Michael/Freddy/Chucky idea, Damian's Chucky and Haunt work, and the argument that Wrong Turn leaves enough oxygen for another story."),
    H(6150, 7000, "FAM / GUEST CANON", "GYPSY WARRIOR, WILL WILSON, AND TOMOEGATO TURN THE INTERVIEW INTO A LIVE Q&A", "The chat takes over with questions about acting, masks, sequels, and the work behind a performance. Damian answers like a guest who actually wants to hang out instead of reading a press-release script."),
    H(7000, 7800, "DAMIAN MAFFEI INTERVIEW", "THE WRONG TURN SEVEN ARGUMENT AND THE THREE-FINGER QUESTION", "The booth and Damian argue about whether anybody needed another Wrong Turn sequel, then give the FAM a practical monster question: what would a three-finger version of the character actually do?"),
    H(7800, 8300, "FAM ARTIFACT", "PUG JAB'S ANIMATED VIDEO STORE SHORTS TURN THE BOOTH INTO A CARTOON", "Pug Jab sends animated shorts of Mike and J doing video-store work. The hosts play the gift, discover a bizarre Michael Landon detour, and realize this could be an entire recurring visual lane."),
    H(8300, 8800, "CHARACTER CANON", "MICHAEL MYERS, JASON MYERS, AND A HALLOWEEN SONG THAT SHOULD BE ILLEGAL", "The post-interview character lane turns Halloween into a deliberately wrong singalong, mixes Michael and Jason, and lets the booth's own mythology become the punchline."),
    H(8800, 9500, "CHANNEL LORE", "WHY DAMIAN AND ANDY MADE THE BEST INTERVIEWS FEEL LIKE HANGING OUT", "The hosts explain that the strongest interviews are the ones where a guest wants to stay and talk. Damian's comfort level becomes part of the episode's review of itself."),
    H(9500, 9905, "LAST CALL", "DARKSEID IMAGES, THE SNYDER TRAMPOLINE, AND THE NEXT GUEST LIST", "The close returns to Darkseid, the restored Snyder universe, future Matthew Lillard and Michael Keaton interview hopes, Mortal Kombat guest ideas, and one last FAM question before the stream cuts out."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 1840, label: "THE COUNTDOWN BREAKS, WANDAVISION ENDS, AND THE SNYDER CUT GETS A COURTROOM", body: "The night begins with the countdown missing its cue and the hosts blaming Bluetooth headphones. Courtney Reed's Scream praise and a filthy FAM greeting establish the room before WandaVision's finale, white Vision, and Scarlet Witch's comic-book spiral give way to the Snyder Cut. The reshoot and Ray Fisher conversation is framed as a live fandom argument with rumors, receipts, and uncertainty kept separate.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1840, end: 3500, label: "DARKSEID, MACARONI, AND A GHOST MASK AT THE DOOR", body: "The Snyder debate grows into director-control and restoration talk, then crashes into macaroni and cheese, a stranger named Bobby, and Damian Maffei's entrance in a ghost mask with a NASCAR question. The tonal whiplash is not a bug; it is the exact route map for this episode.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 3500, end: 6150, label: "DAMIAN MAFFEI MAKES WRONG TURN'S MASK TALK LIKE A CAREER, NOT A GIMMICK", body: "Damian explains Wrong Turn, intimidating scenes, the freedom and constraint of a hidden face, Haunt, and the possibility of more stories. The hosts' running joke—'we thought you couldn't talk'—works because Damian turns it into a conversation about performance rather than a cheap gotcha. A possible animated Michael/Freddy/Chucky picnic and a Chucky sketch keep the interview in WWAM territory.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 6150, end: 8300, label: "THE FAM Q&A TURNS THE GUEST INTO PART OF THE CHANNEL", body: "Gypsy Warrior, Will Wilson, Tomoegato, and other chat voices ask Damian about acting, masks, sequels, and creature work. Wrong Turn Seven and the three-finger question become a miniature writers' room. Pug Jab's animated video-store shorts then turn the broadcast itself into an artifact the app can replay and preserve.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 8300, end: 9905, label: "THE INTERVIEW ENDS, THE CHARACTERS TAKE OVER, AND THE SNYDER TRAMPOLINE REOPENS", body: "A deliberately wrong Halloween song, Michael/Jason confusion, and a post-show reflection on guest chemistry lead back to Darkseid and the hope that the Snyder Cut could revive a larger universe. The close leaves future guests—Matthew Lillard, Michael Keaton, and Mortal Kombat possibilities—on the board without pretending they are booked.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h45m05s Damian Maffei Interview + Movie News & WandaVision stream; local audio, canonical captions, and Whisper ledger checked across the delayed opening, Scream FAM receipt, crude chat lane, WandaVision finale, Snyder Cut restoration debate, Darkseid and Joss Whedon discussion, Damian's ghost-mask entrance, Wrong Turn and Haunt performance talk, Chucky/animated ideas, Wrong Turn sequel debate, FAM Q&A, Pug Jab animated shorts, Halloween character singalong, interview self-review, and future guest tease",
    evidence: Object.freeze({
      duration: 9905,
      captionWords: 33306,
      captionEvents: 5092,
      captionSpanSeconds: 9906.8,
      captionDurationCoveragePercent: 100,
      captionSha256: "D4123E2F873314A518830EED6BF75386E4E43A4C4E2973B86FE88763665B4C0D",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "28EE1CBA16E80EDCB027AAAAAFF3F2CBF40CE672708496AC08B3AF899F07AEDD",
      asrSegmentCount: 524,
      asrSha256: "sha256:5227C8E6DBB2312B45AC830CF049A5D812F26C33A5348154E6AB1282FD9AF925",
      asrCoverageStartSeconds: 176,
      asrCoverageEndSeconds: 9517.28,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "DAMIAN MAFFEI INTERVIEW // MOVIE NEWS & WANDAVISION",
    badge: "FULL SHOW WIKI // WRONG TURN, SNYDER CUT, FAM Q&A, AND THE MASK",
    headline: "DAMIAN MAFFEI TALKS WRONG TURN, THE FAM TAKES OVER, AND DARKSEID COMES BACK",
    deck: "A full-audio WWAM read of the Damian Maffei interview night: WandaVision, the Snyder Cut, a ghost-mask entrance, Wrong Turn and Haunt craft, FAM questions, Pug Jab animation, and a final Darkseid detour.",
    overview: "This episode has a clean WWAM shape even when the subjects refuse to stay in their lanes. The countdown misses its cue, Bluetooth headphones take the blame, Courtney Reed praises the Scream video, WandaVision's finale gets a filthy Scarlet Witch explanation, and the Snyder Cut becomes a debate about reshoots, director control, Ray Fisher, Darkseid, and rumors that are not yet facts. Then Damian Maffei arrives in a ghost mask with a NASCAR question and turns Wrong Turn into the center of the night. The hosts joke that nobody expected the giant masked actor to speak, Damian talks about intimidation, hidden faces, Haunt, Chucky, and the possibility of a continuing monster story, and the FAM turns the interview into a live writers' room. Gypsy Warrior, Will Wilson, and Tomoegato ask questions; Wrong Turn Seven and a three-finger monster become improvised canon; Pug Jab's animated video-store shorts turn the stream into a keepsake; and a deliberately broken Halloween song sends the characters back into the booth. The final minutes explain why Damian and Andy made such strong interviews: they wanted to hang out, not just answer questions. Local audio and aligned ASR establish the routes; playback remains the authority.",
    topics: Object.freeze(["Damian Maffei", "Wrong Turn", "Haunt", "WandaVision", "Snyder Cut", "Darkseid", "Joss Whedon", "Ray Fisher", "Scream", "Dr. Loomis", "Michael Myers", "Pug Jab", "FAM culture", "future guests"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 3500, end: 4200, label: "DAMIAN TURNS THE MASK INTO A PERFORMANCE", topic: "Damian Maffei interview", body: "Play the Wrong Turn introduction for the strongest guest lane: the 'you can't talk' joke becomes a real discussion of hidden-face acting and intimidation.", playAt: 3500, playEnd: 4200 }),
      hated: Object.freeze({ at: 1840, end: 2740, label: "THE SNYDER CUT RUMOR SMOKE", topic: "Snyder Cut", body: "Play the reshoot and director-control argument for the night's most concentrated frustration with fan rumors and studio decisions.", playAt: 1840, playEnd: 2740 }),
      wildestDetour: Object.freeze({ at: 7800, end: 8300, label: "PUG JAB'S ANIMATED VIDEO-STORE GIFT", topic: "FAM artifacts", body: "Play the animated-short reveal for a genuine fan-made object that turns a livestream into a piece of channel history.", playAt: 7800, playEnd: 8300 }),
      lastWord: Object.freeze({ at: 8800, end: 9300, label: "WHY THE BEST GUESTS WANT TO HANG OUT", topic: "Channel lore", body: "Play the interview self-review for the clearest explanation of the WWAM guest standard: conversation beats questionnaire theater.", playAt: 8800, playEnd: 9300 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 290, end: 320, name: "Courtney Reed", kind: "Super Chat", note: "Calls the Scream video amazing and opens the FAM lane." },
        { at: 520, end: 560, name: "Alex", kind: "Super Chat", note: "Sends love while the hosts explain the delayed card shipments." },
        { at: 625, end: 660, name: "Sam", kind: "Super Chat", note: "Adds a crude greeting that the booth reads into the Friday welcome." },
        { at: 710, end: 750, name: "I Am The Commander", kind: "Super Chat", note: "Sends a Friday-night greeting during the opening news lane." },
        { at: 820, end: 850, name: "Eric James", kind: "Super Chat", note: "Closes the early greeting lane with a stay-safe message." },
        { at: 1215, end: 1260, name: "Joshua Ayers", kind: "Super Chat", note: "Checks in while the WandaVision and movie-news conversation is moving." },
        { at: 1585, end: 1625, name: "Kool-Aid Unleashed", kind: "Super Chat", note: "Shares a social-anxiety note and asks for a Stone Cold/character bit." },
        { at: 1775, end: 1815, name: "Edward Santiago", kind: "Super Chat", note: "Adds a question during the Scream and Snyder Cut lane." },
        { at: 6155, end: 6205, name: "Gypsy Warrior", kind: "chat receipt", note: "Asks Damian to take a few live questions from the FAM." },
        { at: 6710, end: 6755, name: "Will Wilson", kind: "chat receipt", note: "Asks Damian a performance question during the guest Q&A." },
        { at: 6805, end: 6855, name: "Tomoegato", kind: "chat receipt", note: "Adds another guest question in the Wrong Turn lane." },
        { at: 6955, end: 6995, name: "Gypsy Warrior", kind: "chat receipt", note: "Asks Damian for advice before the Q&A becomes the show's third act." },
        { at: 7655, end: 7705, name: "Gypsy Warrior", kind: "chat receipt", note: "Delivers the final Wrong Turn question before the guest signs off." },
        { at: 9275, end: 9320, name: "Gypsy Warrior", kind: "chat receipt", note: "Returns with a Snyder Cut question during the closing future-lore lane." },
        { at: 9515, end: 9565, name: "Jack Smith", kind: "chat receipt", note: "Asks for a movie pick during the final FAM run." },
        { at: 9618, end: 9660, name: "Austin", kind: "chat receipt", note: "Adds a final casting question as the stream winds down." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
