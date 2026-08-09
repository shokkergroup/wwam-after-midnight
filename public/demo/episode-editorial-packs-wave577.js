(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "GL_WYPtWgbM";
  var duration = 10442;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(400, 900, "MOVIE NEWS", "GHOSTBUSTERS AFTERLIFE ARRIVES WITH MINI-MARSHMALLOW-MAN BUSINESS", "The stream opens by promising a reaction to the Ghostbusters Afterlife clip, specifically the miniature Stay Puft marshmallow men. The hosts treat the tiny monsters as a real story beat, not just a cute trailer prop."),
    H(900, 1500, "WWAM UP IN YA", "THE SHINING, MARVEL, AND THE CHAT'S FIRST MOVIE-NEWS PILEUP", "The opening turns into an open-line movie room: Marvel, trailers, and The Shining get folded into the same conversation. It feels less like a press desk than friends throwing titles onto a table and seeing which one catches fire."),
    H(1980, 2150, "WWAM UP IN YA", "THE KEVIN TWITTER DETOUR GETS LACED WITH BAD SHIT", "A social-media tangent takes a sharp turn when the hosts compare what is happening on Twitter with something that is 'laced with bad shit.' The moment is a compact example of how quickly this show can turn a headline into a sideways riff."),
    H(2800, 3200, "STRAIGHT TO STEVE'S ASSHOLE", "THE CASTING ARGUMENT GETS TOUCHY WITHOUT PRETENDING IT IS SIMPLE", "The booth draws a line between disliking a casting choice and becoming a bigot. It is a messy, audible conversation about taste, representation, and the difference between an actor being wrong for a part and a viewer wanting the whole genre to stay frozen."),
    H(3100, 3450, "TAKE GETS NUCLEAR", "THE ACTOR IS WRONG FOR THE PART—AND THE ROOM HAS RECEIPTS", "The central take lands plainly: the actor does not fit the role. The hosts work through why the performance feels off instead of hiding behind a generic 'it was bad,' making this one of the episode's cleanest critical doors."),
    H(4100, 4450, "THE ROOM BREAKS", "A STORY GETS SO VISUAL THE CHAT CAN SEE IT IN ITS HEAD", "The room breaks when a story becomes easy to picture. The laughter is not a separate gag pasted over the conversation; it is the sound of the hosts realizing the mental image has already escaped and is now running around the studio."),
    H(4500, 4750, "CREATOR LORE", "THE CBS EXIT STORY TURNS A MOVIE SHOW INTO A WORK-LIFE CONFESSIONAL", "A memory about leaving CBS opens a lane about work, timing, and the strange way career stories turn into movie stories. It is a quieter passage, but it gives the broadcast a human hinge before the monster talk returns."),
    H(5200, 5400, "THE ROOM BREAKS", "CLAIRVOYANCE, SPIRIT PHOTOGRAPHY, ATLANTIS, AND THE LOCH NESS MONSTER WALK INTO ONE LIST", "The hosts rattle through paranormal abilities and legendary creatures—clairvoyance, spirit photography, telekinetic movement, the Loch Ness Monster, and Atlantis. It plays like a supernatural curriculum invented by people who should not be allowed to teach."),
    H(5880, 6160, "WWAM UP IN YA", "PREDATOR GETS A TV SHOW AND THE ROOM DEMANDS AN R RATING", "The Predator TV-show discussion becomes a mission statement: the franchise needs to put its teeth back in, stop sanding everything down for everyone, and let the hunters be nasty again. The phrase about putting balls back into the world is the whole argument in one sentence."),
    H(6600, 7150, "CHARACTER CANON", "CHUCKY AND CHILD'S PLAY TURN THE CHAT INTO A TOY-BOX CRIME SCENE", "Chucky and Child's Play re-enter the conversation as the hosts compare the character's comic timing with the uglier parts of the franchise. The character lane is present, but the tape does not prove a full performance; this is a source-backed Chucky discussion door."),
    H(7050, 7330, "WWAM UP IN YA", "KEEP YOUR SLUTTINESS IN THE BUBBLE: A FAMILY STORY GOES OFF THE RAILS", "A story about telling someone to keep their sluttiness contained in a home bubble becomes one of the episode's sharpest Up in Ya turns. It is vulgar, specific, and delivered with the exhausted confidence of a person who has already lost the argument."),
    H(7390, 7800, "CHARACTER / FRANCHISE LORE", "STAY PUFT IS A BRAND, MICHAEL MYERS IS A PROBLEM, AND THE MERCH IS THE REAL GHOST", "The hosts ask why the Stay Puft brand still exists inside Ghostbusters while Michael Myers gets treated like a threat that cannot be commercialized. The episode finds a weirdly smart franchise question inside the marshmallow-man joke."),
    H(7900, 8050, "TAKE GETS NUCLEAR", "THE WHOLE ANCHORMAN CAST AS GHOSTBUSTERS IS A TERRIBLE, PERFECT IDEA", "The casting fantasy expands until the whole Anchorman cast is in Ghostbusters. It is a deliberately stupid pitch that reveals what the hosts actually want: a comedy ensemble with enough personality to make the premise feel alive."),
    H(7980, 8150, "MOVIE NEWS", "JASON REITMAN'S FAMILY TIE BECOMES THE AFTERLIFE DEFENSE", "The hosts point out that Jason Reitman is Ivan Reitman's son, so Ghostbusters Afterlife has a direct tie to the original. That connection becomes the strongest argument for trusting the new movie before anyone has seen the whole thing."),
    H(8050, 8230, "STRAIGHT TO STEVE'S ASSHOLE", "THE 2016 GHOSTBUSTERS MOVIE GETS DRAGGED AS A GARBAGE HEAP", "The 2016 reboot is not spared. The hosts call it out for losing the original's texture and argue that the problem is not women in the cast; it is a movie that never found a tone worth defending."),
    H(8580, 8750, "TAKE GETS NUCLEAR", "THE HAPPY MADISON GHOSTBUSTERS IS FUNNY UNTIL IT BECOMES TOO STUPID", "The fantasy cast shifts to Chris Farley, Chris Rock, Adam Sandler, and Rob Schneider. The hosts want the old-school comic chemistry, but they also know a Happy Madison version could push the joke past the point of survival."),
    H(8750, 9050, "STRAIGHT TO STEVE'S ASSHOLE", "THE ACCIDENTAL GIANT-WIENER POP-UP IS PEAK LIVE-STREAM DAMAGE", "A supposed image or pop-up sends the room into an accidental giant-wiener panic. It is exactly the sort of uncontrollable, unplanned mess that cannot be recreated in a polished review and belongs in the Up in Ya archive."),
    H(8920, 9250, "STRAIGHT TO STEVE'S ASSHOLE", "EDDIE MURPHY READ THE SCRIPT AND SAID WHAT THE FUCK ARE Y'ALL DOING", "The Eddie Murphy story closes the casting lane: he reportedly read the script and turned it down because it was stupid. The line becomes a perfect WWAM verdict on a movie idea that never earned its own cast."),
    H(9500, 9750, "STREAMING LORE", "HBO MAX, TEEN VIEWERS, AND THE QUESTION OF WHO THE MOVIE IS FOR", "The conversation shifts to putting older movies on HBO Max and the teenage audience that will discover them there. The hosts are not just debating access; they are debating whether a franchise can stay dangerous when the next generation meets it through a streaming menu."),
    H(10200, 10442, "LAST CALL", "AFTER HOURS UNCUT GETS A SUPPORTER AND THE MOVIE ROOM FINALLY EXHALES", "The close circles back to the channel itself. A viewer supports the After Hours Uncut idea, the hosts keep throwing out movie hypotheticals, and the two-hour-fifty-four-minute room finally runs out of runway."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 400, end: 2800, label: "THE MARSHMALLOW MEN OPEN THE FLOODGATES", body: "Ghostbusters Afterlife's mini Stay Puft men lead into Marvel, The Shining, Twitter, and the sort of social-media tangent that arrives already laced with bad shit. The episode's shape is established immediately: a real movie-news hook, followed by every side road the room can reach.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 2800, end: 4750, label: "CASTING, REPRESENTATION, AND THE WORK STORY UNDERNEATH IT", body: "The actor-wrong-for-the-part argument is the episode's most grounded critique. The hosts separate taste from bigotry, then drift into a CBS exit story and a visual mental-image break that makes the broadcast feel like a conversation rather than a list of headlines.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 4750, end: 7390, label: "PARANORMAL SCHOOL, PREDATOR'S TEETH, AND CHUCKY'S RETURN", body: "A supernatural roll call runs from clairvoyance to Atlantis before Predator gets a demand for a real R-rated comeback. Chucky and Child's Play add a toy-box crime-scene lane, then a family story about contained sluttiness detonates just before the Stay Puft brand gets its own franchise autopsy.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 7390, end: 9250, label: "GHOSTBUSTERS AFTERLIFE VERSUS THE 2016 GARBAGE HEAP", body: "The Stay Puft brand question becomes a bridge to Ghostbusters Afterlife, Jason Reitman's family tie, and a dream cast built from Anchorman and old-school comedy. The hosts defend the new film's connection to the original while sending the 2016 reboot straight to Steve's Asshole, then Eddie Murphy supplies the final exclamation point.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 9250, end: 10442, label: "STREAMING, TEEN VIEWERS, AND THE AFTER HOURS EXIT", body: "HBO Max and teenage discovery turn into a question about who gets to inherit these franchises. The accidental giant-wiener pop-up keeps the ending filthy, and the final support for After Hours Uncut brings the focus back to the WWAM room itself.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h54m02s Ghostbusters, Rocky + Movie News livestream; local audio, canonical captions, and Whisper ledger checked across the Ghostbusters Afterlife mini Stay Puft opener, Marvel and The Shining side roads, Twitter detour, casting/representation argument, CBS work story, paranormal list, Predator TV-show R-rating demand, Chucky/Child's Play lane, Stay Puft brand lore, Afterlife/Jason Reitman defense, 2016 reboot critique, Happy Madison fantasy cast, giant-wiener pop-up, Eddie Murphy story, HBO Max/teen-viewer discussion, and After Hours Uncut close",
    evidence: Object.freeze({
      duration: 10442,
      captionWords: 37547,
      captionEvents: 5852,
      captionSpanSeconds: 10444,
      captionDurationCoveragePercent: 100,
      captionSha256: "9E9F29F29919C8A24BF5590CA7506CF161C88053FE09B81D7C7C30739CAAC156",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "50EF4C357EC98C14995BD5625B7F7F0C1B30778BCD24311171211F3081EB2B47",
      asrSegmentCount: 470,
      asrSha256: "sha256:1F989FB03600B081DB5C99219521D84F261565293333F7104D5DBA4A2BFB1C0C",
      asrCoverageStartSeconds: 403,
      asrCoverageEndSeconds: 10350.52,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "GHOSTBUSTERS, ROCKY + MOVIE NEWS // APRIL 8, 2021",
    badge: "FULL SHOW WIKI // STAY PUFT, PREDATOR, CHUCKY, AND THE 2016 GARBAGE HEAP",
    headline: "STAY PUFT GETS A FRANCHISE AUTOPSY, PREDATOR DEMANDS AN R, AND GHOSTBUSTERS 2016 GETS WRECKED",
    deck: "A full-audio movie-news room that starts with mini marshmallow men and ends with a giant-wiener pop-up: casting arguments, paranormal homework, Predator's missing teeth, Chucky, Jason Reitman, Eddie Murphy, and the After Hours Uncut lane.",
    overview: "The April 8 room opens on Ghostbusters Afterlife's mini Stay Puft marshmallow men and then refuses to stay on one subject. Marvel, The Shining, Twitter, casting, representation, and a work-life story all get dragged into the same live conversation. The hosts make one of the episode's clearest distinctions during a casting argument: an actor can be wrong for a role without the viewer needing to turn that preference into bigotry. From there the tape becomes a paranormal syllabus—clairvoyance, spirit photography, telekinetic movement, Atlantis, and the Loch Ness Monster—before Predator gets a demand for a real R-rated comeback. Chucky and Child's Play return, Stay Puft becomes a brand-lore problem, and Ghostbusters Afterlife gets defended through Jason Reitman's family connection. The 2016 reboot is sent straight to Steve's Asshole, while a fantasy cast of Farley, Rock, Sandler, and Schneider opens a filthy Happy Madison lane. A giant-wiener pop-up, an Eddie Murphy story, HBO Max, teenage viewers, and support for After Hours Uncut give the show its proper WWAM ending. Local audio and aligned ASR support every route; playback remains the authority.",
    topics: Object.freeze(["Ghostbusters Afterlife", "Stay Puft", "Ghostbusters 2016", "Predator", "Chucky", "Child's Play", "The Shining", "Marvel", "Jason Reitman", "Eddie Murphy", "HBO Max", "Dr. Loomis", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 7900, end: 8150, label: "THE ANCHORMAN GHOSTBUSTERS CASTING PITCH", topic: "Ghostbusters", body: "Play the fantasy-cast lane for the most joyful movie-nerd detour: the wrong idea that instantly explains why the room wants a comedy ensemble with chemistry.", playAt: 7900, playEnd: 8150 }),
      hated: Object.freeze({ at: 8050, end: 8230, label: "THE 2016 GHOSTBUSTERS GARBAGE-HEAP VERDICT", topic: "Ghostbusters 2016", body: "Play the critique for the sharpest negative take. The target is tone and execution, not the gender of the cast.", playAt: 8050, playEnd: 8230 }),
      wildestDetour: Object.freeze({ at: 8750, end: 9050, label: "THE GIANT-WIENER POP-UP", topic: "WWAM Up in Ya", body: "Play the accidental visual panic for the least reproducible, most live-stream-specific moment in the episode.", playAt: 8750, playEnd: 9050 }),
      lastWord: Object.freeze({ at: 10200, end: 10442, label: "AFTER HOURS UNCUT GETS A YES", topic: "WWAM community", body: "Play the close for the cleanest handoff from movie talk back to the channel's own future.", playAt: 10200, playEnd: 10442 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 400, end: 470, name: "Zach Cornett", kind: "Super Chat", note: "Named as the first Super Chat of the night during the opening Ghostbusters lane." },
        { at: 6800, end: 6870, name: "JT Kessman", kind: "chat receipt", note: "Asks whether the hosts would do a script review for JT Kessman." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
