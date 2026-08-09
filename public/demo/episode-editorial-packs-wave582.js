(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "GDsexmabrDg";
  var duration = 8934;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(30, 180, "OPENING CHAOS", "THE THUNDERDOME OPENS WITH JM HORROR GUY, MARK DORMAN, TROY GRUBB, AND THE FAM IN THE ROOM", "The opening rolls through a Thunderdome greeting and a fast FAM roll call. JM Horror Guy, Mark Dorman, Troy Grubb, John Nichols, and Vanessa Johnson Brunder are audible before the movie-news lanes settle in."),
    H(300, 650, "MOVIE NEWS", "THINGS HEARD AND SEEN HAS A TERRIBLE TITLE, AMANDA SEYFRIED, AND A GHOST PROBLEM", "The hosts review Things Heard & Seen, complain that the title sounds like a forgotten Dr. Seuss story, then admit the trailer looks good. The ghosts stay peripheral until one doorway produces a chill from the anus to the nape of the neck."),
    H(580, 850, "THE BABADOOK-ADJACENT TAKE", "THE ENDING MAKES EVERYONE SAY WHAT THE FUCK JUST HAPPENED", "The Things Heard & Seen ending becomes the real review. The movie is interesting and accessible even to people who are frightened by horror, but the final turn leaves the booth genuinely unsure what the film just did."),
    H(1400, 1640, "WWAM UP IN YA", "THE DEVIL IS NOT THE PROBLEM—THE SILENCE AND THE FOOTSTEPS ARE", "A quiet horror passage turns into a church and footsteps argument. The hosts explain why a peripheral ghost can be worse than a full reveal: the audience has to finish the picture themselves."),
    H(2250, 2350, "FAM / MOVIE LORE", "A YOUNG ACTOR'S DEATH TURNS A THEN-AND-NOW VIDEO INTO A SAD DETOUR", "A cast then-and-now clip leads to the discovery that a performer died at forty or forty-one. The room pauses long enough to acknowledge the loss before moving back into movie-news mode."),
    H(2600, 2870, "MOVIE NEWS", "BUDAPEST, A KISS IN THE AIR, AND THE CHAT'S VERSION OF AN ASS-BEATING PROMISE", "A Budapest memory arrives half as threat and half as promise, with a kiss in the air and no agreement on who made it. The detour is pure live-room lore: the details are unstable, but the story is still funny."),
    H(2750, 2930, "STRAIGHT TO STEVE'S ASSHOLE", "FIVE HUNDRED DOLLARS FOR A BOOT AND A PS5 FUND THAT REFUSES TO GROW", "A price tag triggers a blunt reaction: for that money, the object can suck an asshole. The hosts compare the purchase with trying to save for a PlayStation 5, making the criticism personal instead of abstract."),
    H(4100, 4310, "JUSTICE LEAGUE", "WARNER BROS. RESTORES A 4K MASTER AND STILL MISSES THE POINT", "The Snyderverse argument turns into a 4K-release complaint. The hosts say Warner Bros. has the properties and the access but keeps mishandling what fans actually want, producing a new definition of a 'bruh moment.'"),
    H(4470, 4630, "TAKE GETS NUCLEAR", "THE HOT-FART CHANCE OF THE SNYDERVERSE RETURN", "The room gives the Snyderverse restoration a hot-fart chance in Texas-chili-dog terms. The joke is crude, but the underlying read is careful: a possibility can exist without being the likely outcome."),
    H(4760, 4870, "DC FUTURES", "BLACK ADAM, JUSTICE LEAGUE 2, AND THE RELEASE SCHEDULE THAT WOULD BREAK THE BOX OFFICE", "The hosts imagine Black Adam followed by Zack Snyder's Justice League Part 2. Their point is not a guaranteed business result; it is that the apocalyptic Jared Leto world would dominate the conversation if a studio actually let it exist."),
    H(5950, 6090, "CHARACTER CANON", "LOOMIS WORKS THE MCDONALD'S DRIVE-THRU", "The episode invents a McDonald's Loomis skit: advice from the drive-thru, a McFly order, and a customer being told to get out of the McDrive-thru. It is one of the cleanest source-local Dr. Loomis character receipts in the 2021 pass."),
    H(6120, 6280, "WWAM UP IN YA", "THIRD-SHIFT WALMART, HAZELNUT COFFEE, AND THE PUBLIC SHAME OF SHOPPING AT 8 A.M.", "A third-shift shopping story turns Walmart and hazelnut coffee into a social judgment ritual. The hosts argue over whether buying party supplies at eight in the morning is more embarrassing than admitting you work nights."),
    H(6550, 6710, "HALLOWEEN FUTURES", "HALLOWEEN ENDS COULD BE THE ONE EVERYONE AGREES IS THE BEST", "The room considers the possibility that Halloween Ends could become the universally agreed-upon favorite of the trilogy. They are nervous about the initial reception but leave space for time to be kinder than opening night."),
    H(6700, 6810, "CHARACTER CANON", "LOOMIS VERSUS SLENDERMAN: OUR LOOMIS PULLS THE RUG OUT AT THE LAST SECOND", "The hosts stage a full hypothetical battle. Slenderman has powers and patience; Loomis stays on the edge of death, then pulls the rug out and wins. The phrase 'our Slenderman and Loomis, not the world's' marks this as character canon, not a factual franchise claim."),
    H(6950, 7050, "HALLOWEEN LORE", "YOUNG HAWKINS, LAURIE'S HAND, AND THE TRENCH COAT IN THE BACKGROUND", "A Halloween future pitch imagines a young Hawkins holding Laurie's hand while a young Loomis or Sheriff Brackett passes in the background. The cameo is small by design: a silhouette that makes the universe feel connected without stealing the scene."),
    H(7980, 8160, "FRIDAY THE 13TH", "JASON'S LEGAL LIMBO IS BAD FOR THE CHARACTER AND GREAT FOR THE AUDIENCE'S FRUSTRATION", "The hosts admit Jason movies can cheapen the character if they arrive constantly, then immediately confess that every Friday the 13th release still feels like a must-see theater event. The legal problem is real; the appetite is realer."),
    H(8400, 8580, "CASTING", "JOHNNY CAGE: RYAN REYNOLDS OR THE MIZ? THE BODY ISN'T THE WHOLE JOB", "The Johnny Cage argument pits Ryan Reynolds against The Miz. The booth separates acting polish from athleticism, admits The Miz literally looks like the character, and still cannot agree on whether the role is a joke or a performance challenge."),
    H(8580, 8770, "THE ROOM BREAKS", "THE CAMERA DIES BECAUSE THE JOHNNY CAGE ARGUMENT GOT TOO HOT", "The camera freezes, both hosts go black, and the fight over The Miz versus Ryan Reynolds becomes its own production event. They argue so hard they kill the camera, then try to fix it while insisting they are still having sex later."),
    H(8770, 8934, "LAST CALL", "SUPER CHATS, BLACK SCREENS, AND A WEDNESDAY NIGHT THAT REFUSES TO END CLEANLY", "The close is a repair attempt, a return to the Super Chats, and an admission that the room is temporarily gone. The archive keeps the black-screen exit because it is the honest ending to an episode built on unstable energy."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 30, end: 2250, label: "THINGS HEARD AND SEEN STARTS THE NIGHT WITH GHOSTS AND A TERRIBLE TITLE", body: "A Thunderdome FAM roll call leads into Things Heard & Seen, Amanda Seyfried, a ghost in a doorway, a finale that leaves the room baffled, quiet footsteps, and a sad then-and-now actor detour. The movie review works because the hosts allow both the chills and the confusion to stay audible.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 2250, end: 4100, label: "BUDAPEST, ASS-BEATING PROMISES, AND THE ROAD BACK TO WARNER BROS.", body: "A Budapest memory, a $500 boot, a PS5 fund, and a late return to movie news carry the room into Justice League. The side roads are not filler; they show how the hosts convert personal memory and money into franchise criticism.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 4100, end: 5950, label: "THE SNYDERVERSE GETS A HOT-FART CHANCE AND A BOX-OFFICE FANTASY", body: "The 4K release and Warner Bros. complaints become a Snyderverse restoration debate. Black Adam, Justice League Part 2, Jared Leto's apocalyptic world, and the idea of a studio schedule that could overwhelm the box office all grow from one question: what would happen if the missing story were actually allowed to exist?", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5950, end: 7980, label: "LOOMIS WORKS THE DRIVE-THRU AND THEN FIGHTS SLENDERMAN", body: "A McDonald's Loomis skit, third-shift Walmart shame, Halloween Ends anxiety, a young Hawkins/ Laurie scene, and the full 'our Loomis versus our Slenderman' hypothetical make this the episode's character-canon center. The bit is invented, but the voices and recurring logic belong to the show's memory system.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 7980, end: 8934, label: "JASON'S LEGAL LIMBO MEETS THE JOHNNY CAGE CAMERA DEATH", body: "Friday the 13th's legal limbo, the appetite for Jason, Ryan Reynolds versus The Miz, and a camera that dies in the middle of the argument produce a close that is both franchise talk and live production lore. The black screen is not a flaw to hide; it is the final clip.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h28m54s Wednesday April 28, 2021 WWAM livestream; local audio, canonical captions, and Whisper ledger checked across the Thunderdome/FAM roll call, Things Heard and Seen review, ghost doorway and ending confusion, actor death detour, Budapest memory, $500 boot/PS5 argument, Justice League 4K and Warner Bros. criticism, Snyderverse/Black Adam/Justice League 2 box-office thought experiment, Loomis Works McDonald's skit, third-shift Walmart story, Halloween Ends prediction, Loomis versus Slenderman character canon, young Hawkins/Laurie/Brackett future pitch, Jason legal limbo, Johnny Cage casting, camera death, and black-screen close",
    evidence: Object.freeze({
      duration: 8934,
      captionWords: 32785,
      captionEvents: 5155,
      captionSpanSeconds: 8935.439,
      captionDurationCoveragePercent: 100,
      captionSha256: "0E1771EC2C468D0AF63F9F79FAC2B7CD9A6F535D635A2029DFE036D13CC54865",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "33DC764BA42843AEEDAF3A59E71D36CD3C2999161BD3B579A9A1A93B606AB3A9",
      asrSegmentCount: 458,
      asrSha256: "sha256:27E871987194C415C3A0EFA2E3F8FBCEC89CA5D77693E53FE7A9A14EA2EC4A20",
      asrCoverageStartSeconds: 36,
      asrCoverageEndSeconds: 8769.78,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "WEDNESDAY APRIL 28, 2021 // THINGS HEARD AND SEEN + MOVIE NEWS",
    badge: "FULL SHOW WIKI // LOOMIS WORKS THE MCDRIVE-THRU, SNYDERVERSE FANTASY, AND JOHNNY CAGE CAMERA DEATH",
    headline: "LOOMIS RUNS THE MCDRIVE-THRU, FIGHTS SLENDERMAN, AND KILLS THE CAMERA OVER JOHNNY CAGE",
    deck: "A full-audio WWAM night: Things Heard & Seen, Warner Bros. and Snyderverse frustration, a McDonald's Loomis skit, Halloween Ends, Jason's legal limbo, Ryan Reynolds versus The Miz, and a camera that cannot survive the argument.",
    overview: "The April 29 show opens in a Thunderdome with JM Horror Guy, Mark Dorman, Troy Grubb, John Nichols, and Vanessa Johnson Brunder before reviewing Things Heard & Seen. The hosts complain about the title, praise Amanda Seyfried, get a ghost doorway chill from the anus to the nape of the neck, and admit the ending leaves them asking what the fuck just happened. A then-and-now actor death, a Budapest memory, a $500 boot, and a PS5 fund carry the room into Warner Bros. and Justice League criticism. The Snyderverse gets a hot-fart chance, Black Adam and Justice League Part 2 become a box-office thought experiment, and a 4K release becomes proof that the studio still misunderstands the fans. Then Loomis Works the McDonald's drive-thru, third-shift Walmart becomes a public-shame story, Halloween Ends is imagined as the trilogy's sleeper favorite, and our Loomis fights our Slenderman. Jason's legal limbo meets the appetite for Friday the 13th, Ryan Reynolds battles The Miz for Johnny Cage, and the camera dies from the argument. Local audio and aligned ASR support every route; playback remains the authority.",
    topics: Object.freeze(["Things Heard and Seen", "Justice League", "Snyderverse", "Dr. Loomis", "Slenderman", "Halloween Ends", "Michael Myers", "Jason", "Friday the 13th", "Johnny Cage", "Ryan Reynolds", "The Miz", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 5950, end: 6090, label: "LOOMIS WORKS THE MCDRIVE-THRU", topic: "Character canon", body: "Play the McDonald's skit for the most portable character receipt in the episode: Dr. Loomis dispensing fast-food counseling at the speaker box.", playAt: 5950, playEnd: 6090 }),
      hated: Object.freeze({ at: 4100, end: 4630, label: "WARNER BROS. AND THE SNYDERVERSE HOT-FART CHANCE", topic: "DC / studio takes", body: "Play the 4K/Snyderverse lane for the episode's most sustained frustration with studio choices and fan trust.", playAt: 4100, playEnd: 4630 }),
      wildestDetour: Object.freeze({ at: 6700, end: 6810, label: "OUR LOOMIS VERSUS OUR SLENDERMAN", topic: "Character canon", body: "Play the full hypothetical for the episode's most unhinged character battle and its explicit distinction between WWAM's versions and the world's versions.", playAt: 6700, playEnd: 6810 }),
      lastWord: Object.freeze({ at: 8400, end: 8770, label: "JOHNNY CAGE KILLS THE CAMERA", topic: "Live-room lore", body: "Play the Ryan Reynolds/The Miz argument for the perfect live ending: a disagreement so intense the equipment quits.", playAt: 8400, playEnd: 8770 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 30, end: 90, name: "JM Horror Guy", kind: "chat receipt", note: "Named in the opening Thunderdome/FAM roll call." },
        { at: 30, end: 90, name: "Mark Dorman", kind: "chat receipt", note: "Named in the opening Thunderdome/FAM roll call." },
        { at: 30, end: 90, name: "Troy Grubb", kind: "chat receipt", note: "Named in the opening Thunderdome/FAM roll call." },
        { at: 30, end: 90, name: "John Nichols", kind: "chat receipt", note: "Named in the opening Thunderdome/FAM roll call." },
        { at: 30, end: 90, name: "Vanessa Johnson Brunder", kind: "chat receipt", note: "Named in the opening Thunderdome/FAM roll call." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
