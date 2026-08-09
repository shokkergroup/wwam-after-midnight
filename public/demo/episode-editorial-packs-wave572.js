(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "UidcnWgctvU";
  var duration = 12320;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(120, 650, "ST PATTY'S DAY", "THE COUNTDOWN IS LATE, THE BEER IS WARM, AND THE GREEN DRINK IS ALREADY A BAD IDEA", "The St. Patrick's Day party opens with a missed countdown, green clothes, warm beer, and the first argument over what everybody is drinking. The show starts drunk before anyone has earned it."),
    H(650, 1250, "ST PATTY'S DAY", "A BAR FULL OF FRIDAY-THE-13TH ENERGY AND THE DOLLAR-BEER HANGOVER", "The hosts remember cheap beer, getting lost after the parade, and the particular horror of waking up after St. Paddy's Day. Their drinking stories are the episode's first unofficial movie reviews."),
    H(250, 760, "FAM RECEIPT", "RON RICHARDS JR. SAYS HAPPY SNYDER CUT EVE AND GYPSY WARRIOR WANTS LOOMIS", "Ron Richards Jr. celebrates Snyder Cut eve, Gypsy Warrior asks about Kip Weeks and a Loomis shout-out, and the FAM starts shaping the night's format before the hosts can settle on a topic."),
    H(1250, 1800, "SNYDER CUT", "THE SPOILER STREAM MOVES, THE REVIEWS ARRIVE, AND EVERYONE IS DRINKING THROUGH THE SCHEDULE", "The hosts explain why the Justice League spoiler stream has to move, then read the early positive and negative reactions while St. Patrick's Day keeps sabotaging their ability to sound sober."),
    H(1800, 3050, "SNYDER CUT", "THE NEGATIVE REVIEW THAT GETS SENT TO THE ACE VENTURA DEPARTMENT", "A review calling the Snyder Cut messy becomes a full booth prosecution: 'pick a side,' 'first day as a journalist,' and a detour into Ace Ventura, Steven Seagal, and the kind of criticism that makes the hosts want to throw the review into the street."),
    H(3050, 3450, "WWAM UP IN YA", "DANICA PATRICK, NASCAR ELITE, AND THE MACARONI BALLS INCIDENT", "A NASCAR tangent turns into a Danica Patrick argument, a cursed claim about certified elite status, and a sudden question about who put macaroni and cheese in somebody's good goddamn balls."),
    H(3450, 4300, "ERIC STRIFFLER INTERVIEW", "ERIC FROM PRETTY MUCH IT ARRIVES AFTER THE SEVEN-HOUR HORROR NIGHT", "Eric Striffler joins the show after a long night of horror and fast-food chaos. The hosts explain how they met, why the guest feels like an old friend, and why this interview never sounds like a press junket."),
    H(4300, 5200, "ERIC STRIFFLER INTERVIEW", "THE BAR, THE SHOTS, AND THE STRANGER WHO GOT ANNOYED WHEN ERIC ACCEPTED ONE", "Eric and the hosts trade St. Patrick's Day bar stories, including applesauce shots, a stranger offering an unwanted drink, and the strange social rules of being the person who says yes when everyone expected no."),
    H(5200, 6100, "MOVIE NEWS", "TERMINATOR LEGACY, THE TORPEDO TWIST, AND WHY A COOL TRAILER CAN STILL BREAK YOUR HEART", "The booth praises a movie's action while rejecting the twist that damages a beloved character. It is the clearest example of WWAM's two-lane review: the spectacle can work while the story still gets called bullshit."),
    H(6000, 6700, "CHARACTER CANON", "THIS IS MICHAEL MYERS, THIS IS JASON MYERS, AND NOBODY IS ALLOWED TO SING ANYMORE", "A St. Patrick's Day song mutates into a Halloween character mash-up, with Michael and Jason sharing a verse they absolutely did not rehearse."),
    H(6700, 7300, "ERIC STRIFFLER INTERVIEW", "THE VAN LOOKED INVITING, THEN THE HAUNT STORY GETS REAL", "The hosts remember seeing Eric's van and wanting a tour. Eric explains that the work is not just people jumping out and saying boo; the spaces, transitions, and atmosphere are the actual craft."),
    H(7300, 8100, "ERIC STRIFFLER INTERVIEW", "FESTIVALS, SCARFEST, AND WHY THE CHEAPEST ROOM IS PART OF THE ADVENTURE", "Eric talks festivals, Sundance, South by Southwest, and the practical economics of going where the work is. The conversation makes the creator life sound exciting, expensive, and occasionally like sleeping wherever the booking leaves a hole."),
    H(8100, 9000, "CREATOR LORE", "PRETTY MUCH IT STARTED FOR FUN, THEN THE GRIND BECAME THE JOB", "Eric explains how Pretty Much It began, why staying power matters, how the audience changes the work, and what it feels like when a hobby quietly becomes a business you have to keep feeding."),
    H(9000, 9800, "FAM / HORROR LORE", "HALLOWEEN 2018, THE NEW TRILOGY, AND THE FAM ASKING FOR LOOMIS AND CHALLIS", "The FAM asks Eric about Halloween 2018, the hosts frame it as a sequel that is also a rebooted trilogy, and Carrie Crowley asks for Loomis and Challis to appear before the show runs out of beer."),
    H(9800, 10650, "WWAM UP IN YA", "THE KARAOKE STORY, VANILLA ICE, AND MIKE SUDDENLY SOUNDS LIKE DR. DRE", "A karaoke memory becomes a full survival story: college kids, Vanilla Ice, drunk confidence, and Mike attempting a Dr. Dre impression that should be classified as a workplace incident."),
    H(10650, 11450, "HAUNT LORE", "NYCTOPHOBIA, BLACKOUT, AND THE FOLDING-TABLE ORIGIN STORY", "Eric traces his haunted-attraction work from early events and a folding table to larger, stranger spaces. The origin story shows how the scare business grows through persistence, risk, and learning what actually frightens a crowd."),
    H(11450, 12320, "LAST CALL", "VACCINE TALK, MICHAEL JORDAN SCIENCE, AND THE ST. PATTY'S DAY SPELLING BEE", "The close moves from public-health frustration to a Michael Jordan metaphor, heartfelt creator gratitude, a promise to hang out again, and the final correction: Paddy's has a D, you degenerate."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 120, end: 1800, label: "ST. PADDY'S DAY IS A DRINKING STORY WITH A SNYDER CUT CALENDAR ATTACHED", body: "The party starts with a missed countdown, warm beer, green clothing, and a debate over whether anyone should be drinking at all. Ron Richards Jr., Gypsy Warrior, Joshua Ayers, and the rest of the FAM turn the schedule into a live event: the Justice League spoiler stream moves, Kip Weeks gets mentioned, Loomis gets requested, and the hosts try to read movie news through a parade hangover.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1800, end: 3450, label: "THE SNYDER CUT REVIEW WAR ENDS IN MACARONI BALLS", body: "The hosts react to positive and negative Snyder Cut reviews, especially one that calls the film messy. The argument becomes a small masterclass in how WWAM handles criticism: challenge the review, ask for specifics, overuse the phrase 'first day as a journalist,' and then derail into Danica Patrick, NASCAR, and macaroni in a body part nobody should have to name.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 3450, end: 6700, label: "ERIC STRIFFLER ARRIVES WITH A SEVEN-HOUR HORROR NIGHT AND LEAVES WITH A HALLOWEEN SONG", body: "Eric from Pretty Much It joins after a long day of horror work. Bar stories, applesauce shots, a stranger who resents a volunteer drinker, Terminator legacy, and a beloved-character twist all lead into a Halloween song that misidentifies Michael and Jason. The guest lane feels like friends catching up because the interview never stops to become a commercial.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 6700, end: 9000, label: "THE HAUNT VAN, THE FESTIVAL ECONOMY, AND THE CREATOR GRIND", body: "Eric explains why a haunted attraction is more than people jumping out, talks festivals and the cost of getting to the work, and traces Pretty Much It from something done for fun into a career with a business attached. The episode's strongest creator lesson is simple: staying with the work is the part nobody can fake.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 9000, end: 12320, label: "HALLOWEEN, KARAOKE, NYCTOPHOBIA, AND THE D AT THE END OF PADDY'S", body: "The FAM asks about Halloween 2018 and Loomis/Challis. Karaoke turns into Vanilla Ice and a Dr. Dre impression. Eric maps the haunted-work origin story from a folding table into larger attractions, then the show closes with public-health frustration, creator gratitude, and the spelling lesson that St. Paddy's has a D.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 3h25m20s St Patty's Day Party, Eric Striffler + Snyder Cut Reviews stream; local audio, canonical captions, and Whisper ledger checked across the delayed green-drink opening, FAM/Snyder Cut scheduling, positive and negative review reactions, journalist/remember-the-details argument, Danica Patrick/NASCAR detour, Eric Striffler's Pretty Much It introduction, bar and applesauce-shot stories, Terminator legacy reaction, Michael/Jason character song, haunted-van and festival craft, creator-grind history, Halloween 2018 trilogy talk, Loomis/Challis requests, karaoke/Vanilla Ice/Dr. Dre, Nyctophobia and Blackout origins, public-health detour, creator gratitude, and final Paddy's correction",
    evidence: Object.freeze({
      duration: 12320,
      captionWords: 42384,
      captionEvents: 6396,
      captionSpanSeconds: 12321.84,
      captionDurationCoveragePercent: 100,
      captionSha256: "1F6A0FDB0A08F2213FECF7B6198A924C1D23125E0FDCB7535DC1D72AE5B79A30",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "EA0ED970ED01A99C6903561C9496230FA4BD6C1EDE5743E51380DA8346A68298",
      asrSegmentCount: 647,
      asrSha256: "sha256:D0DD780308D960F60A712E90D0EF76BC77B5733702EDEEA8B479C838D0033634",
      asrCoverageStartSeconds: 36,
      asrCoverageEndSeconds: 12242.86,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "ST PATTY'S DAY PARTY // ERIC STRIFFLER + SNYDER CUT REVIEWS",
    badge: "FULL SHOW WIKI // ERIC STRIFFLER, SNYDER CUT, FAM, AND HAUNT LORE",
    headline: "THE SNYDER CUT GETS REVIEWED, ERIC STRIFFLER GETS THE ROOM, AND ST. PADDY'S GETS A D",
    deck: "A full-audio WWAM read of the 3h25m party stream: Snyder Cut review warfare, warm beer, Eric Striffler's Pretty Much It and haunt stories, FAM Loomis requests, karaoke damage, and an origin story that ends with a spelling correction.",
    overview: "The St. Paddy's Day episode is a party, a Snyder Cut review desk, and a creator interview that slowly becomes a shared history lesson. It opens with a missed countdown, green clothes, warm beer, dollar-beer memories, and Ron Richards Jr. celebrating Snyder Cut eve. Gypsy Warrior asks about Kip Weeks and Loomis while the hosts explain the moved spoiler stream. Then a negative Snyder Cut review calling the movie messy gets prosecuted with Ace Ventura, Steven Seagal, 'first day as a journalist,' and a Danica Patrick/NASCAR detour that ends in the macaroni balls incident. Eric Striffler from Pretty Much It arrives after a long horror day and talks bar stories, applesauce shots, Terminator legacy, Wrong Turn-adjacent creature work, haunted attractions, festivals, and the economics of making the thing again tomorrow. The FAM asks Eric about Halloween 2018; the hosts frame the new trilogy as both sequel and reboot; Carrie Crowley requests Loomis and Challis; and karaoke turns Mike into a deeply unreliable Dr. Dre. Eric traces Nyctophobia and Blackout from folding-table beginnings to larger scare spaces. The close becomes a public-health tangent, a Michael Jordan metaphor, and a sincere thank-you before the final correction: Paddy's has a D. Local audio and aligned ASR establish every route; playback remains the authority.",
    topics: Object.freeze(["St. Patrick's Day", "Eric Striffler", "Pretty Much It", "Snyder Cut", "Zack Snyder", "WandaVision", "Halloween 2018", "Halloween trilogy", "Dr. Loomis", "Dr. Challis", "haunted attractions", "Nyctophobia", "Blackout", "karaoke", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 3450, end: 4300, label: "ERIC STRIFFLER GETS THE FRIENDS-ON-A-COUCH INTERVIEW", topic: "Eric Striffler interview", body: "Play Eric's entrance through the first shared stories for the cleanest example of a guest interview that feels like a reunion instead of a questionnaire.", playAt: 3450, playEnd: 4300 }),
      hated: Object.freeze({ at: 1800, end: 3050, label: "THE SNYDER CUT REVIEW THAT GOT SENT TO JOURNALISM SCHOOL", topic: "Snyder Cut", body: "Play the negative-review prosecution for the night's best concentrated annoyance with vague criticism and a review that refuses to pick a side.", playAt: 1800, playEnd: 3050 }),
      wildestDetour: Object.freeze({ at: 9800, end: 10650, label: "KARAOKE, VANILLA ICE, AND DR. DRE MIKE", topic: "WWAM Up in Ya", body: "Play the karaoke lane for the most gloriously avoidable musical incident in the episode.", playAt: 9800, playEnd: 10650 }),
      lastWord: Object.freeze({ at: 12015, end: 12320, label: "THE D IN PADDY'S AND THE LOVE UNDER THE DRUNK", topic: "Channel lore", body: "Play the gratitude and final spelling correction for the episode's actual thesis: the room is ridiculous because the room is close.", playAt: 12015, playEnd: 12320 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 250, end: 275, name: "Ron Richards Jr.", kind: "Super Chat", note: "Sends a St. Paddy's greeting and celebrates Snyder Cut eve." },
        { at: 360, end: 390, name: "Gypsy Warrior", kind: "Super Chat", note: "Asks about interviewing Kip Weeks and requests the Loomis lane." },
        { at: 615, end: 650, name: "Joshua Ayers", kind: "chat receipt", note: "Adds a shout-out request during the early party chatter." },
        { at: 705, end: 730, name: "Romaneri", kind: "chat receipt", note: "Checks in while doing DoorDash on St. Paddy's Day." },
        { at: 740, end: 770, name: "Put It Totally", kind: "chat receipt", note: "Says he came for Eric and is staying for the drip." },
        { at: 870, end: 900, name: "Glenn", kind: "chat receipt", note: "Joins the bracket-buster college basketball lane." },
        { at: 1000, end: 1040, name: "Build 88", kind: "chat receipt", note: "Reports being hammered, which the room treats as a St. Paddy's credential." },
        { at: 1050, end: 1085, name: "Jonathan Nichols", kind: "chat receipt", note: "Gets pulled into the Paddy's-versus-Patty's argument." },
        { at: 1210, end: 1245, name: "Mauren Colette", kind: "chat receipt", note: "Adds a message during the self-esteem and friendship lane." },
        { at: 1600, end: 1685, name: "Flavor Dave", kind: "chat receipt", note: "Asks when Eric will return and is answered during the Loomis/Challis and FAM lane." },
        { at: 1640, end: 1685, name: "Gypsy Warrior", kind: "Super Chat", note: "Shares a St. Paddy's fact and asks Mike and J to send Loomis/Challis wishes." },
        { at: 1800, end: 1840, name: "Destiny Turner", kind: "Super Chat", note: "Sends a large check-in that the booth thanks before the review reaction." },
        { at: 4330, end: 4385, name: "Ryder", kind: "Super Chat", note: "Says he loves all three men and asks for a little more stimulus." },
        { at: 4360, end: 4415, name: "The Captain", kind: "Super Chat", note: "Asks about Busta Rhymes' weight loss and the Michael Myers lane." },
        { at: 9005, end: 9065, name: "Carrie Crowley", kind: "Super Chat", note: "Wishes the room a happy St. Patrick's Day and requests Loomis and Challis." },
        { at: 9305, end: 9360, name: "Devin Davis", kind: "chat receipt", note: "Asks Eric what he thought of Halloween 2018." },
        { at: 9195, end: 9240, name: "Rhino's Lost Rhino Brewing", kind: "chat receipt", note: "Shares a beer during the Eric interview and asks what he is drinking." },
        { at: 10235, end: 10285, name: "FAM karaoke lane", kind: "chat receipt", note: "The room turns the viewer questions into the karaoke and song-choice segment." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
