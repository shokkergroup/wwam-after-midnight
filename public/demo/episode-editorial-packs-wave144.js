(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "6TB6CWpZs8o", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* January 28, 2025: full second read of the 1:26:57 movie-news room. */
  sources["6TB6CWpZs8o"] = Object.freeze({
    sourceId: "6TB6CWpZs8o",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; full caption-ledger pass across the January 28 room with audio-backed doors",
    evidence: Object.freeze({
      duration: 5217,
      captionWords: 18057,
      captionEvents: 2359,
      captionSpanSeconds: 5219.04,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:9f4332fbd1ba3de4d7f65aea76040453634096b54fd30e6cbf94a4869999147f",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:402650eb4191aefa68fd9a6c032c2aa82b80fc28c9785b8e894e46912768f02a",
      asrWindowCount: 250,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // JANUARY 28, 2025",
    badge: "FULL SHOW WIKI // 1:26:57 OF SINNERS, HORROR MOUNT RUSHMORE, RESIDENT EVIL, SUPERMAN, ALIEN EARTH, AND THE CORONA BOTTLE",
    headline: "THE JANUARY 28 ROOM BREAKS ITS MIC, BUILDS A HORROR MOUNT RUSHMORE, AND FINDS A FOURTH HOLE",
    deck: "A trailer/news room with Sinners, Chucky arguments, James Wan wish-casting, fan lore, and one giant beer bottle nobody was supposed to drink.",
    overview: "January 28 begins with new equipment refusing to work. The hosts are on an old twenty-dollar microphone, StreamYard is hiding the camera, and the show opens by asking whether it sounds like poop. Then Sinners arrives: Ryan Coogler's horror trailer, Michael B. Jordan's performance, Robert Rodriguez-like action, a southern accent that refuses to leave the theater, and a song that turns into a pretend life-changing gift. The room builds a current-horror Mount Rushmore and puts Ghostface on it, rejects Chucky because the TV series diluted the brand, and lets a birthday Super Chat steer the debate. From there it moves through fan-film ambitions, Mike Flanagan for Resident Evil, the investigation side of Umbrella, Captain America marketing, Superman's wide-angle face, and an Alien: Earth teaser that lowers the excitement without killing the show. The middle is classic WWAM: an imagined editing-room career where the hosts spend all day watching Shaun of the Dead clips, a Naked Attraction tangent about Mark Consuelos, and the question of whether a movie channel is allowed to discuss wiener sizes. A fan pitch for \"Loomis and Challis: The Mystery of the Fourth Hole\" gives the character archive a new comedy door, while a giant Corona bottle turns the absence of movie news into the content. The closing stretch folds in Michael Myers, 50 Cent, Stu Lives, a reporter-prank fantasy, and a last-minute reminder that the FAM is why these rooms keep coming back even when the equipment does not.",
    story: Object.freeze([
      { at: 0, end: 900, label: "THE OLD MIC AND SINNERS", body: "The equipment fails, the camera fights StreamYard, and Sinners arrives as the first real subject with action, music, and an accent the room cannot escape." },
      { at: 900, end: 1800, label: "HORROR MOUNT RUSHMORE AND THE BIRTHDAY LANE", body: "Current horror gets a Mount Rushmore, Chucky gets demoted, and a birthday message sends the room into a completely inappropriate celebration." },
      { at: 1800, end: 2700, label: "FAN FILMS AND RESIDENT EVIL'S UMBRELLA", body: "The room rejects another fan film for itself while arguing that a Resident Evil adaptation needs investigation, secrets, and the mansion—not just glowing effects." },
      { at: 2700, end: 3600, label: "CAPTAIN AMERICA, SUPERMAN, AND ALIEN EARTH", body: "Superhero marketing, a wide-angle Superman face, and an Alien: Earth teaser move the news lane from excitement to cautious disappointment." },
      { at: 3600, end: 4400, label: "EDITING SCHOOL AND THE FOURTH HOLE", body: "A fake editing-room career, a Naked Attraction detour, Goosebumps werewolves, and a fan's Loomis/Challis movie pitch turn the middle into a comedy block." },
      { at: 4400, end: 5217, label: "THE GIANT CORONA AND STU LIVES", body: "A giant Corona bottle becomes the visual, then the room circles Michael Myers, 50 Cent, Stu, reporter pranks, and the FAM before leaving." },
    ]),
    highlights: Object.freeze([
      H(24, 32, "ROOM BREAK", "THE NEW EQUIPMENT SOUNDS LIKE POOP", "A new mixer, a new microphone, and a camera that refuses to appear leave the room asking whether the replacement audio sounds like poop."),
      H(175, 183, "WWAM UP IN YA", "THE CURSE OF THAT VAGINA WON'T STOP", "The broken equipment gets a supernatural explanation that is too vulgar to be a troubleshooting guide but too funny to cut."),
      H(678, 686, "MAJOR TOPIC TURN", "SINNERS ARRIVES WITH A TRAILER", "Ryan Coogler's Sinners trailer is finally on screen, with Michael B. Jordan, Robert Rodriguez-style action, and a first look that feels like a real event."),
      H(820, 828, "SOUNDBYTE / REPLAY", "THE SOUTHERN ACCENT WILL NOT LEAVE", "The room predicts that the Sinners accent will follow them out of the theater and into every conversation they have afterward."),
      H(1018, 1026, "WWAM UP IN YA", "THE MOUNT RUSHMORE OF CURRENT HORROR", "Ghostface gets the final spot on the current-horror Mount Rushmore after the room argues over Chucky, Leatherface, and recency bias."),
      H(1320, 1328, "STRAIGHT TO STEVE'S ASSHOLE", "CHUCKY TV WATERED DOWN THE DOLL", "The Chucky show is blamed for spending too much time on teenagers making out, a complaint that becomes the reason Chucky misses the Mount Rushmore."),
      H(1542, 1550, "FAN SIGNAL", "THE STREAM IS OFF BY A DAY", "A birthday message arrives on the wrong day, giving the room a chance to roast the calendar before wishing the fan well."),
      H(1730, 1738, "WWAM UP IN YA", "THE BIRTHDAY CHEEK / STICK FIX", "A birthday Super Chat asks for help with a personal situation, and the room tries to solve it by staring at sexy faces and offering terrible advice."),
      H(1850, 1858, "ROOM BREAK", "BOOT SCOOT BOOGIE GETS REWRITTEN", "A country song is transformed into an incestuous live-room lyric by accident, then immediately regretted."),
      H(2160, 2168, "MAJOR TOPIC TURN", "RESIDENT EVIL NEEDS THE INVESTIGATION", "The room argues for a Resident Evil adaptation built around Umbrella, the mansion, and uncovering secrets instead of only lights and effects."),
      H(2450, 2458, "STRAIGHT TO STEVE'S ASSHOLE", "CAPTAIN AMERICA FORGOT WHAT AMERICA MEANS", "A Captain America interview answer is sent to Steve's Asshole for making a flag-wearing character sound unsure what the flag represents."),
      H(2925, 2933, "FAN SIGNAL", "SUPERMAN'S FACE IS A WIDE-ANGLE LENS", "A Superman teaser controversy gets a technical explanation: the face looks strange because of the lens, not because the studio secretly replaced Superman."),
      H(3210, 3218, "STRAIGHT TO STEVE'S ASSHOLE", "ALIEN EARTH LOWERED THE EXCITEMENT", "The Alien: Earth teaser is only forty-three seconds, but the room says it somehow makes a previously exciting show feel less exciting."),
      H(3492, 3500, "ROOM BREAK", "THE EDITORIAL CAREER LASTS ONE LIGHT SWITCH", "An imaginary first day in a movie studio collapses when the hosts confuse the editing controls with the room light and start watching Shaun of the Dead clips instead."),
      H(3650, 3658, "WWAM UP IN YA", "THE MOVIE CHANNEL WIENER-SIZE POLICY", "The room declares that movie discussion can include Mark Consuelos, magnesium, and wiener sizes, because the content is already too far gone to pretend otherwise."),
      H(3980, 3988, "CHARACTER APPEARANCE", "LOOMIS AND CHALLIS FIND THE FOURTH HOLE", "A fan pitches \"Loomis and Challis: The Mystery of the Fourth Hole,\" and the room immediately orders tickets for day one."),
      H(4250, 4258, "WWAM UP IN YA", "THE GIANT CORONA BOTTLE", "A giant Corona bottle appears on camera, becomes a dick joke, and is declared the last of the petty cash even though it is supposed to be saved for Saturday."),
      H(4470, 4478, "TAKE GETS NUCLEAR", "THE MICHAEL MYERS DEATH PREDICTION", "The room revisits a Michael Myers prediction while admitting the real takeaway is that the hosts drink a lot and notice their hair getting annoying."),
      H(4840, 4848, "STRAIGHT TO STEVE'S ASSHOLE", "50 CENT SURVIVED NINE BULLETS", "A street confrontation becomes a warning not to chase 50 Cent with a camera, followed by the inevitable comparison to Stu surviving."),
      H(5008, 5016, "CHARACTER APPEARANCE", "STU IS ALIVE AND UNEMPLOYED", "The room argues about whether Matthew Lillard's Stu can be found in a club or in the ground, then accidentally concedes that the actor is alive."),
      H(5130, 5138, "SOUNDBYTE / REPLAY", "THE REPORTER PRANK FANTASY", "The hosts imagine standing in front of a live reporter and silently doing a smiley character until the broadcast collapses."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 678, end: 1550, label: "SINNERS AND THE HORROR MOUNT RUSHMORE", topic: "the FAM gets a current canon", body: "Play from 11:18. Sinners, Ghostface, Chucky, Leatherface, and a birthday message give the episode its clearest community-facing lane.", playAt: 678, playEnd: 1550 }),
      hated: Object.freeze({ at: 2450, end: 3218, label: "CAPTAIN AMERICA AND ALIEN EARTH", topic: "marketing can drain the excitement", body: "Play from 40:50. A Captain America answer and an Alien: Earth teaser become two different versions of the same complaint: stop making the audience do the work.", playAt: 2450, playEnd: 3218 }),
      wildestDetour: Object.freeze({ at: 3492, end: 5008, label: "THE EDITING ROOM, THE FOURTH HOLE, AND 50 CENT", topic: "the show abandons the news on purpose", body: "Play from 58:12. Fake studio work, wiener-size policy, Loomis/Challis lore, a giant Corona, Michael Myers, and 50 Cent form the episode's strangest run.", playAt: 3492, playEnd: 5008 }),
      lastWord: Object.freeze({ at: 5008, end: 5138, label: "STU IS ALIVE, THE REPORTER IS NOT SAFE", topic: "the FAM leaves through a character door", body: "Play from 1:23:28. Stu's employment status gets debated, then a reporter prank fantasy closes the room.", playAt: 5008, playEnd: 5138 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
