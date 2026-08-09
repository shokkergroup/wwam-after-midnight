(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "VhDy2yxlAVM";
  var duration = 378;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 60, "50/50 SCORE FIGHT", "SETH ROGEN'S COMEDY WORKS, JOSEPH GORDON-LEVITT'S JOKES DON'T, AND THE ROOM SPLITS 8.5 VS. 6", "The first review is a genuine disagreement about tone. Mike values the emotional investment and realistic friendship; J thinks parts of the humor feel forced and gives the movie a much lower score."),
    H(60, 120, "PARANORMAL FEAR MEMORY", "THE ORIGINAL SCARED THE ROOM, THE SECOND GOT HYPED PAST ITS SCARE, AND THE THIRD EARNS A SHOCK", "The hosts compare their first encounters with the franchise, including lights-on sleep and a house that looks too much like Mike's. The third film's late turn makes the room shout and brace for number four."),
    H(120, 180, "ORIGINALITY / HYPE", "PARANORMAL ACTIVITY 3 IS A SHOCK MOVIE THAT WORKS BEST WHEN YOU DON'T KNOW THE TRICK", "The hosts argue that the franchise is strongest when the viewer has not been over-briefed. The third entry follows the existing story but finds a new angle and a genuine surprise."),
    H(180, 245, "RUNNING ZOMBIES", "DAWN OF THE DEAD'S FAST ZOMBIES ARE 'FRIGGERS,' AND THE ROOM REFUSES TO APOLOGIZE", "The hosts defend the remake's running dead as more frightening, not less realistic. Zombies have never happened, so the rules are ours to break."),
    H(245, 325, "THE LITTLE GIRL OPENING", "A SICK-LOOKING CHILD BITES HER DAD, AND DAWN OF THE DEAD STARTS WITH A PERFECT NIGHTMARE", "The opening is the cleanest shared praise in the segment. The hosts describe the bite, the bubbling blood, and the way the sequence almost makes the rest of the movie feel like a comedown."),
    H(325, 378, "VING RHAMES / ZOMBIE BABY", "BETTER THEM THAN ME, A ZOMBIE BABY, AND A WEEKLY WATCHLIST THAT WANTS THE FAM TO TALK BACK", "The final Dawn of the Dead beat belongs to Ving Rhames and the zombie-baby image. The episode ends as a community prompt: praise it, hate it, or tell them to get off YouTube forever."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 60, label: "50/50 IS A REAL ARGUMENT ABOUT TONE", body: "The first title in the weekly stack is 50/50. Mike likes Seth Rogen's comedy and the emotional investment in the friendship, while J thinks Joseph Gordon-Levitt is trying to play a kind of humor that does not fit him. The scores split dramatically—8.5 for the viewer who felt the story's subject matter and 6 for the viewer who found too much of the humor forced. The disagreement is the point: the movie asks whether realism can coexist with jokes, and the hosts answer differently.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 60, end: 120, label: "PARANORMAL ACTIVITY IS A MEMORY OF BEING SCARED", body: "The conversation shifts to Paranormal Activity 3, but the real archive value is the history of the franchise's fear. The original scared the hosts badly enough to leave lights on. Mike's wife and friends said the house looked like his own, which he rejects as black magic at the door. The second movie was overhyped for them; the theater crowd screamed while they sat there wondering what they had missed. The third gets closer to the original feeling by finding a new angle.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 120, end: 180, label: "THE THIRD MOVIE EARNS ITS SHOCK", body: "The hosts avoid the spoiler but preserve the reaction. Paranormal Activity 3 is quiet for a while, then lands a moment that makes Mike say he did not expect that and did not like it. The surprise is why they rank it second to the first and why Mike is excited for number four. They also acknowledge the franchise risk: keep adding sequels and it could become the next Final Destination, but a sequel that finds a fresh angle earns another chance.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 180, end: 245, label: "DAWN OF THE DEAD BREAKS THE ZOMBIE RULEBOOK", body: "The third title is the Dawn of the Dead remake, bought on Blu-ray and watched with Mike's wife. The hosts defend the running zombies. Since zombies have never happened, there is no laboratory rulebook that says they must walk. The speed makes them more frightening because the threat can close distance before the viewer has time to make a plan. Their improvised name—friggers—becomes the episode's crude badge of approval.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 245, end: 325, label: "THE LITTLE GIRL IS THE PERFECT OPENING NIGHTMARE", body: "The hosts agree the opening is the film's high point. A girl who appears sick and normal suddenly bites her father's neck, leaves him bubbling blood, and turns the domestic room into a disaster zone. The sequence is so effective that it almost creates a letdown afterward, but it establishes the remake's core promise: the dead are fast, the violence is immediate, and no safe-looking person is safe.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 325, end: 378, label: "VING RHAMES AND THE ZOMBIE BABY CLOSE THE STACK", body: "Ving Rhames gets the final character praise with his 'better them than me' swagger in the mall, and the hosts cannot leave without mentioning a zombie baby. The episode ends by asking viewers to respond however they want—say the hosts did a good job, say they suck and should leave YouTube, or tell them which movie belongs in the next stack. The community lane stays intentionally open.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the full 6m18s weekly three-film review; local audio and caption evidence was checked across 50/50, Seth Rogen, Joseph Gordon-Levitt, the 8.5-versus-6 split, Paranormal Activity 1/2/3 fear memories, lights-on sleep, Mike's house comparison, the third-film shock, sequel fatigue, Dawn of the Dead, running zombies, 'friggers,' the little-girl opening, Ving Rhames, zombie baby, and the closing community prompt",
    evidence: Object.freeze({ duration: 378, captionWords: 1604, captionEvents: 404, captionSpanSeconds: 379.4, captionDurationCoveragePercent: 100.37, captionSha256: "D3CECB79C9512F53FE1CFFF9CCEABBE3B7E03AB3C1BFFDA8F8C72F424760DFA9", captionSourceKind: "source-local canonical YouTube automatic-caption ledger acquired as edge json3", audioPass: "canonical local source audio + source-local caption alignment; playback remains the authority", audioSha256: "162B0BEDC08ED4994B450C3E6AB8F5A12F065249141F6FBCDF4104B5AFAF3CFB", asrSegmentCount: 0, asrSha256: null, asrCoverageStartSeconds: null, asrCoverageEndSeconds: null, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "WEEKLY WATCH STACK // 50/50 / PARANORMAL ACTIVITY 3 / DAWN OF THE DEAD",
    badge: "FULL SHOW WIKI // CANCER COMEDY, PARANORMAL SHOCKS, AND FRIGGING FAST ZOMBIES",
    headline: "THREE MOVIES, THREE ARGUMENTS: 50/50, PARANORMAL ACTIVITY 3, DAWN OF THE DEAD",
    deck: "A source-grounded weekly stack: one 8.5-versus-6 comedy disagreement, one franchise fear-memory audit, and one defense of running zombies that ends with a little girl, Ving Rhames, and a zombie baby.",
    overview: "This weekly Watch the Movie stack is not one review; it is three separate arguments that happen to share a tape. First comes 50/50. Mike likes Seth Rogen's comedy, the friendship, and the emotional investment in a story about a difficult subject. J thinks Joseph Gordon-Levitt's attempts at humor feel forced and sees a more average movie. Their scores split 8.5 and 6, a useful example of how WWAM can disagree without treating one reaction as the official answer. The middle title is Paranormal Activity 3, and the hosts use it to remember how the franchise's fear actually worked. The original scared them enough to sleep with lights on. Mike's wife and friends said the house looked like his, which he rejects as black magic at the door. The second film was overhyped for the room, with a theater crowd screaming at an ending the hosts found less frightening than advertised. The third follows the same broad story but finds a new angle and lands a shock that makes Mike say he did not expect it and did not like it. They rank it below the first but above the second and admit the sequel treadmill could eventually become Final Destination. The final film is the Dawn of the Dead remake, watched on Blu-ray with Mike's wife. The hosts defend its running zombies because zombies have never happened and therefore have no rulebook demanding a walk. Speed makes the dead more frightening, especially when the opening introduces a sick-looking little girl who suddenly bites her father's neck and turns a domestic room into a nightmare. The opening is so strong it nearly makes the rest of the movie feel like a comedown. Ving Rhames gets the final character praise for his 'better them than me' swagger, and the room cannot resist mentioning a zombie baby. The episode closes by asking the FAM to talk back in whatever tone it wants: praise, insult, disagreement, or a suggestion for the next weekly stack. Its archive value is the contrast. 50/50 is about taste and emotional tolerance; Paranormal Activity is about the memory of being surprised; Dawn of the Dead is about whether speed changes the zombie contract. Keeping all three together makes the source feel like a real WWAM week rather than three isolated cards.",
    topics: Object.freeze(["50/50", "Seth Rogen", "Joseph Gordon-Levitt", "Paranormal Activity 3", "Paranormal Activity", "Dawn of the Dead", "running zombies", "Ving Rhames", "zombie baby", "WWAM FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 245, end: 325, label: "THE LITTLE GIRL OPENING", topic: "Dawn of the Dead", body: "Play from 4:05. A sick-looking child bites her father's neck and turns a normal room into the week's best nightmare.", playAt: 245, playEnd: 325 }),
      hated: Object.freeze({ at: 0, end: 60, label: "8.5 VS. 6", topic: "50/50", body: "Play the opener for the sharpest disagreement: emotional investment versus humor that does not fit.", playAt: 0, playEnd: 60 }),
      wildestDetour: Object.freeze({ at: 180, end: 245, label: "FRIGGERS", topic: "Running zombies", body: "Play from 3:00. The room defends running dead and invents its own crude category label.", playAt: 180, playEnd: 245 }),
      lastWord: Object.freeze({ at: 325, end: 378, label: "ZOMBIE BABY / FAM PROMPT", topic: "Closing", body: "Play the close for Ving Rhames, the zombie baby, and an open invitation to praise or insult the channel.", playAt: 325, playEnd: 378 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(5, 45, "THE FAM", "50/50", "The weekly stack opens with the emotional-comedy disagreement."),
        F(18, 58, "THE FAM", "SETH ROGEN", "Seth gets the comedy credit in the first score fight."),
        F(30, 65, "THE FAM", "8.5 VS. 6", "The room splits over humor and emotional investment."),
        F(65, 115, "THE FAM", "PARANORMAL FEAR", "The original sent the hosts to bed with the lights on."),
        F(105, 150, "THE FAM", "BLACK MAGIC HOUSE", "Mike rejects the claim that the movie house looks like his."),
        F(145, 190, "THE FAM", "PARANORMAL 2", "The theater screamed; the booth did not."),
        F(190, 240, "THE FAM", "PARANORMAL 3 SHOCK", "A late turn makes the room yell and brace for number four."),
        F(220, 245, "THE FAM", "FINAL DESTINATION FATIGUE", "The sequel machine gets a warning."),
        F(245, 295, "THE FAM", "DAWN OF THE DEAD", "The remake gets the third slot in the stack."),
        F(255, 300, "THE FAM", "RUNNING ZOMBIES", "The hosts refuse the walking-only rulebook."),
        F(270, 320, "THE FAM", "LITTLE GIRL OPENING", "The face-bite sets the night's horror high point."),
        F(320, 350, "THE FAM", "VING RHAMES", "Better them than me becomes a mall-memory receipt."),
        F(335, 365, "THE FAM", "ZOMBIE BABY", "The room asks how the movie could get more upsetting."),
        F(350, 378, "THE FAM", "SAY WE SUCK", "The viewers are invited to insult the channel if they want."),
        F(360, 378, "THE FAM", "NEXT WATCH STACK", "The close asks what the room should watch next.")
      ]),
      note: "Fifteen source-local audience receipts are retained. No supporter identity or donation claim is present; the community lane is the open invitation to praise, disagree, insult, and suggest the next weekly stack."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
