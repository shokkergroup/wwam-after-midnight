(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "YvjsGkVEu0A";
  var duration = 12270;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(47, 620, "OPENING CHAOS", "SENSORS, A DELAYED COUNTDOWN, AND THOR RUIN THE CURTAIN DROP", "The opening is already a bit: YouTube sensors, a countdown that refuses to sync, and Thor interrupting the Wednesday welcome before the show can pretend to be polished."),
    H(470, 650, "FAM RECEIPT", "BRANDON BARRY BRINGS ROB ZOMBIE'S MUNSTERS TO THE DOOR", "Brandon Barry asks about Rob Zombie directing The Munsters. The hosts park the answer for the movie-news lane, while the chat immediately turns the question into a promise to revisit the subject."),
    H(650, 1150, "WWAM UP IN YA", "RANGERS WIN 55 AND GYPSY WARRIOR HAS BEEN DRUNK SINCE SUNDAY", "Gypsy Warrior reports Glasgow Rangers' 55th championship and admits the celebration has lasted since Sunday. The booth translates soccer joy into a Patriots-fan comparison and keeps the toast moving."),
    H(1450, 1920, "HALLOWEEN UNIVERSE", "ROB ZOMBIE, HALLOWEEN II, AND THE 'SMARTEST DUMB KID' PROBLEM", "The hosts separate disliking choices from hating Rob Zombie, then argue that Halloween II is the work of a filmmaker with real potential making the most frustrating possible choices."),
    H(2050, 2470, "WWAM UP IN YA", "THE BAGEL WINDOW, CREAM CHEESE SPLATTER, AND TWENTY PEOPLE SAYING FUCK THIS", "A drive-by bagel bit escalates into cream cheese hitting the Ford Pinto behind it, then the booth notices viewers leaving because two men will not stop talking about Halloween."),
    H(2630, 2900, "MONSTER LAB", "GODZILLA, KING KONG, AND THE MECHAGODZILLA TEAM-UP THEORY", "The trailer conversation gives Godzilla the king-of-monsters advantage, then folds in the chat theory that Mechagodzilla is the reason Kong and Godzilla eventually have to team up."),
    H(3140, 3350, "CHARACTER CANON", "LOOMIS GETS ASKED ABOUT DR. FRANKENFURTER", "Ask the Character drops Dr. Frankenfurter into Dr. Loomis' office. Loomis knows nothing, Michael is misunderstood, and the bit lands because the answer sounds like a medical intake form written by two idiots."),
    H(4180, 4740, "HALLOWEEN THEORY", "DID MICHAEL PICK LAURIE FIRST AND USE THE OTHER BABYSITTERS AS COVER?", "The central theory argues that Michael was not wandering randomly in 1978: Annie may be the first visible kill while Laurie is the intended target. The booth tests the idea against the film instead of treating it as settled canon."),
    H(4740, 5320, "HALLOWEEN THEORY", "DEBORAH HILL, HALLOWEEN II, AND THE THEORY'S BIG CONTINUITY WOUND", "Laurie's intended-target reading collides with the Halloween II family reveal and Deborah Hill's comments. The hosts call the theory interesting, but admit it can shoot the sequel's premise in the dick."),
    H(5320, 6120, "HALLOWEEN LORE", "MICHAEL AS FORCE OF NATURE, JASON IN MANHATTAN, AND WHY MYSTERY NEEDS A LITTLE FUEL", "The booth compares Michael with Jason and Freddy, asks whether a killer needs a driving force, and rejects a version of Michael who simply teleports into whatever location the next sequel needs."),
    H(6120, 6770, "HALLOWEEN LORE", "THE HADDONFIELD ANCHOR AND A POSSIBLE HALLOWEEN 9 MORGUE OPENING", "They sketch a future Halloween that keeps Michael tied to Haddonfield: a morgue, an eye opening, attendants disappearing, cameras going wild, and a reboot that preserves the shape of the myth without explaining every inch of him."),
    H(6770, 7550, "CREED III", "ROCKY'S LEGACY VERSUS A CREED MOVIE THAT HAS TO STAND WITHOUT HIM", "The Creed III conversation becomes a referendum on Rocky's place in the series. Stallone's possible Rocky continuation is treated as a separate emotional promise, not a fact about a film that has not arrived in this tape's timeline."),
    H(8760, 9280, "SNYDER CUT", "DARKSEID AND STEPPENWOLF HIT LIKE A ROLLER COASTER WITH A WEIRDLY HAPPY WIENER", "The Snyder Cut trailer gets the full booth reaction: Darkseid looks like the threat Thanos wishes he was, Steppenwolf finally belongs in the same movie, and the first watch produces an extremely unhelpful anatomical metaphor."),
    H(9280, 9850, "SNYDER CUT", "JARED LETO'S JOKER, CONTEXT, AND THE SCREENING THEY COULDN'T GET", "The hosts argue that Leto's Joker can work when the director and cut give the performance a lane. They recount trying for a screener and a Zack Snyder interview, receiving a maybe, then a no."),
    H(9850, 10440, "WWAM UP IN YA", "MICHAEL BEAN IS NOT MICHAEL BAY AND THE INTERVIEW STORY KEEPS GETTING WORSE", "A celebrity-name mix-up becomes Michael Biehn/Michael Bay damage control, followed by an anecdote about an interview promise that sounded like 'I'll blog you' and left everybody asking what that meant."),
    H(11680, 11930, "FAM / CHARACTER CANON", "JESSE McLAUGHLIN ASKS LOOMIS AND CHALLIS TO SAVE HIS 12-HOUR SHIFT", "Jesse McLaughlin checks in from an overnight shift and asks Loomis and Challis for enough encouragement not to burn the place down. The characters answer with marriage complaints, AA jokes, and a dead-sister punchline."),
    H(11930, 12270, "LAST CALL", "DAMIAN MAFFEI, CREED 3, AND THE GOODBYE THAT KEEPS THE LORE OPEN", "The close tees up Damian Maffei, untangles a Creed 3/Halloween 3 slip, and leaves the room with more future topics than it can possibly finish in one Wednesday night."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 47, end: 1920, label: "THE NEWS DESK HAS A SENSOR, A SOCCER HANGOVER, AND A ROB ZOMBIE QUESTION", body: "The tape begins with a delayed countdown, a sensor joke, and Thor refusing to respect the curtain drop. Brandon Barry brings Rob Zombie's Munsters to the chat; Gypsy Warrior has been drunk since Glasgow Rangers won its 55th championship; and the booth turns Rob Zombie's Halloween II into a more useful argument than a simple thumbs-up or thumbs-down. The hosts can be frustrated by choices without pretending they hate the filmmaker.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1920, end: 3350, label: "THE BAGEL, THE MONSTER TRAILER, AND LOOMIS' WORST INTAKE APPOINTMENT", body: "A cream-cheese drive-by and a roomful of viewers abandoning the stream because Halloween talk has taken over lead into Godzilla versus Kong and a Mechagodzilla theory. Then Ask the Character gives Dr. Loomis a Frankenfurter question, letting the character lane function as a real recurring format instead of a one-off gag.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 4180, end: 6770, label: "THE WILD HALLOWEEN THEORY BREAKS THE SEQUEL, THEN REBUILDS THE MYTH", body: "The central theory asks whether Michael selected Laurie first and used the other babysitter murders as cover. The booth tests that against the 1978 blocking, Laurie and Annie's positions, the Halloween II family reveal, and Deborah Hill's comments. From there the discussion expands: Michael is smart, perhaps a force of nature, but not a teleporting franchise mascot. A Haddonfield-bound morgue opening becomes the seed of a possible Halloween 9.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 6770, end: 10440, label: "CREED AND THE SNYDER CUT TURN LEGACY INTO A CONTACT SPORT", body: "Creed III raises the question of whether a Rocky world can keep its heart when Rocky is absent. The Snyder Cut trailer then supplies Darkseid, Steppenwolf, Jared Leto's Joker, an accidental Tom and Jerry confusion, and the hosts' failed attempt to secure a screener or interview. The tape preserves the uncertainty: these are the hosts' reactions and outreach story, not retroactive release history.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 10440, end: 12270, label: "THE CHARACTER DEPARTMENT CLOCKS IN FOR JESSE AND CLOCKS OUT WITH DAMIAN MAFFEI", body: "The late show gets stranger and more specific: a Michael Biehn/Michael Bay correction, an interview promise nobody can translate, Jesse McLaughlin's 12-hour overnight shift, and a Loomis/Challis answer that should be filed under both encouragement and workplace hazard. Damian Maffei is teased for a future appearance, leaving the dossier with a clean next chapter instead of a fake conclusion.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 3h24m30s A Wild Halloween Theory, The Snyder Cut + More Movie News stream; local audio, canonical captions, and Whisper ledger checked across opening technical chaos, Rob Zombie/Munsters, Gypsy Warrior's Rangers celebration, Halloween II, the bagel and audience-exit bit, Godzilla/Mechagodzilla, Loomis/Frankenfurter, the Laurie-target theory, Halloween II continuity, Michael/Jason/Freddy lore, Haddonfield and Halloween 9 ideas, Creed III, Darkseid/Steppenwolf, Jared Leto's Joker, the screener/interview attempt, Michael Biehn/Michael Bay correction, Jesse McLaughlin's overnight shift, and the Damian Maffei close",
    evidence: Object.freeze({
      duration: 12270,
      captionWords: 42975,
      captionEvents: 13676,
      captionSpanSeconds: 12271.84,
      captionDurationCoveragePercent: 100,
      captionSha256: "CECAC58CCC4602BA429E0CCFAA0155714A65E8E6C56F1B530CA7AE2928399704",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "CF2593F0180DB8411B334490DF8A97E1C8103BCD8DB0C4B2348307446D0E0BCF",
      asrSegmentCount: 559,
      asrSha256: "sha256:76006c234f64172dc1b1b8c71527fc4e6e4993c58a104aeba8fb0003f17115ea",
      asrCoverageStartSeconds: 47,
      asrCoverageEndSeconds: 12269.9,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "A WILD HALLOWEEN THEORY // THE SNYDER CUT + MORE MOVIE NEWS",
    badge: "FULL SHOW WIKI // HALLOWEEN THEORY, DARKSEID, LOOMIS, AND FAM CHAOS",
    headline: "THE HALLOWEEN THEORY BREAKS THE SEQUEL, THE SNYDER CUT BREAKS THE ROOM",
    deck: "A full-audio WWAM read of the 3h24m30s news night: Rob Zombie's Munsters, a Laurie-target Halloween theory, a Haddonfield-bound Halloween 9 sketch, Creed III, Darkseid and Steppenwolf, a failed Snyder interview chase, and Jesse's overnight Loomis/Challis emergency.",
    overview: "This is the stream where a delayed countdown and Thor open the door to a serious Halloween question: did Michael Myers choose Laurie Strode first, with the other babysitter murders serving as cover? The booth tests the idea against the 1978 film, the Halloween II family reveal, and Deborah Hill's comments, then keeps the argument honest by calling it interesting rather than proven. Around that spine are the WWAM fingerprints: Brandon Barry asks about Rob Zombie's Munsters, Gypsy Warrior celebrates Glasgow Rangers' 55th championship while admitting he has been drunk since Sunday, a bagel becomes a cream-cheese projectile, and viewers leave because the show will not stop talking about Halloween. Godzilla versus Kong feeds a Mechagodzilla team-up theory. Ask the Character puts Dr. Frankenfurter in Dr. Loomis' office. Creed III becomes a Rocky legacy fight. The Snyder Cut trailer brings Darkseid, Steppenwolf, Jared Leto's Joker, a Tom and Jerry confusion, and a failed attempt to secure a screener or Zack Snyder interview. Late in the tape, Jesse McLaughlin asks Loomis and Challis for encouragement during a 12-hour overnight shift and receives the exact kind of medical advice nobody should put on a workplace poster. Every route is tied to local audio and aligned ASR; playback remains the authority.",
    topics: Object.freeze(["Halloween theory", "Laurie Strode", "Michael Myers", "Halloween II", "Rob Zombie", "The Munsters", "Godzilla vs Kong", "Mechagodzilla", "Dr. Loomis", "Dr. Challis", "Creed III", "Rocky", "Zack Snyder's Justice League", "Darkseid", "Steppenwolf", "Jared Leto Joker", "Damian Maffei", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 4180, end: 4740, label: "THE LAURIE-TARGET THEORY GETS A FAIR HEARING", topic: "Halloween theory", body: "Play the theory setup for the clearest explanation of the proposed target-selection idea before the booth starts trying to kill it with sequel continuity.", playAt: 4180, playEnd: 4740 }),
      hated: Object.freeze({ at: 1920, end: 2470, label: "THE BAGEL WINDOW AND THE VIEWERS WHO BAILED", topic: "WWAM Up in Ya", body: "Play the cream-cheese projectile and audience-exit section for the night's purest combination of gross imagery and self-inflicted programming problems.", playAt: 1920, playEnd: 2470 }),
      wildestDetour: Object.freeze({ at: 8760, end: 9850, label: "DARKSEID, LETO, AND THE SCREENING THAT NEVER HAPPENED", topic: "Snyder Cut", body: "Play the trailer reaction through the screener/interview story for the biggest tonal swing away from Halloween and back into creator-lore territory.", playAt: 8760, playEnd: 9850 }),
      lastWord: Object.freeze({ at: 11680, end: 11930, label: "JESSE'S 12-HOUR SHIFT GETS A LOOMIS/CHALLIS PRESCRIPTION", topic: "Character canon", body: "Play Jesse's overnight request and the character answer for the most reusable character-format receipt in the show.", playAt: 11680, playEnd: 11930 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 490, end: 570, name: "Brandon Barry", kind: "Super Chat", note: "Asks about Rob Zombie directing The Munsters and gets a promised movie-news answer." },
        { at: 555, end: 620, name: "Gypsy Warrior", kind: "Super Chat", note: "Reports being drunk since Sunday because Glasgow Rangers won its 55th championship." },
        { at: 7480, end: 7540, name: "Gary Catlow", kind: "chat receipt", note: "Calls out the demented cat noise when Michael opens his eyes." },
        { at: 9350, end: 9410, name: "Chap Wilson", kind: "chat receipt", note: "Gets named while the Snyder Cut chat goes off the rails." },
        { at: 9680, end: 9740, name: "Gypsy Warrior", kind: "chat receipt", note: "Asks whether Robin will appear in the Snyder Cut and mentions a Scarecrow hope." },
        { at: 9810, end: 9865, name: "Gypsy Warrior", kind: "chat receipt", note: "Adds a correction about Grayson and the future Batman material." },
        { at: 11685, end: 11720, name: "Jesse McLaughlin", kind: "Super Chat", note: "Writes from a 12-hour overnight shift and asks Loomis and Challis for encouragement." },
        { at: 11970, end: 12020, name: "Blood Red Skies", kind: "chat receipt", note: "Brings up a Jason autograph story during the final character and guest lane." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
