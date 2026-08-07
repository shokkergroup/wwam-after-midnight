(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "huxYiVw_xns", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* February 4, 2025: full second read of the 1:36:35 trailer/news room. */
  sources["huxYiVw_xns"] = Object.freeze({
    sourceId: "huxYiVw_xns",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; caption-ledger pass across the full February 4 room with audio-backed doors",
    evidence: Object.freeze({
      duration: 5795,
      captionWords: 21455,
      captionEvents: 3175,
      captionSpanSeconds: 5796.32,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:9270395cf6247dae9a2f64539444c951265d7017709e1a94de036d4256f02621",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:b933959636aa6c07683ba99d910a12d28f8eba567e675a78edae959b749571a7",
      asrWindowCount: 296,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // FEBRUARY 4, 2025",
    badge: "FULL SHOW WIKI // 1:36:35 OF FINAL DESTINATION, FANTASTIC FOUR, TERRIFIER, HARD EYES, M3GAN 2, AND PATREON CHAOS",
    headline: "THE FEBRUARY 4 ROOM IS HUNGOVER, POLITICAL, AND STILL READY FOR A TONGUE-PIERCING DEATH",
    deck: "Final Destination Bloodlines, a hard-R horror argument, fan Super Chats, and a copyright takedown make this one impossible to confuse with a quiet news show.",
    overview: "February 4 begins with a crisp camera, a hungover host, and immediate enthusiasm for the Final Destination Bloodlines trailer. The room likes the song, suspects the trailer is hiding the real death, and locks onto the tongue-piercing image with the kind of disgust that makes a franchise moment memorable. Fantastic Four follows with casting jokes, a bank-loan Human Torch, and an argument about whether the Stranger Things actor can escape one annoying role. Then Damian Leone's statement about letting people enjoy Terrifier without political identity fights opens a long, surprisingly sincere conversation about movies as escape—before the room sends the whole topic through a profanity cannon. Hard Eyes gets a 92% Rotten Tomatoes read, The Monkey gets a possible Osgood Perkins identity crisis, and M3GAN 2's military-AI plot gets treated like a synopsis written by a committee. The middle of the tape is pure room life: burnt coffee, avocado disgust, a cucumber-in-the-ass promotion, Beyoncé and Post Malone in country music, and a Super Chat that turns Scream 7's Stu return into a meta-on-meta pitch. The late stretch gives Hellraiser its required alone-time warning, Final Destination tanning-bed dread, a Bobby \"The Brain\" Heenan comparison, a cursed Peddler's Mall VHS story, a Mama Agnes fan recommendation, and a Patreon stream that gets shut down for showing legally posted movie clips. It ends with the WWAM promise that they will be back, even if the platform tries to kill the link first.",
    story: Object.freeze([
      { at: 0, end: 900, label: "BLOODLINES, FANTASTIC FOUR, AND A HANGOVER", body: "The Final Destination trailer lands, the Human Torch gets a bank-loan joke, and the room admits it is operating through a brutal hangover." },
      { at: 900, end: 1500, label: "DAMIAN LEONE AND THE MOVIE ESCAPE ARGUMENT", body: "A Terrifier statement about letting people enjoy movies becomes a real conversation about identity, politics, and the relief of sitting down to watch something without joining a war." },
      { at: 1500, end: 2100, label: "THE TONGUE, THE NOSE, AND THE MISSING DEATH", body: "Bloodlines gets its tongue-piercing shot, a promised nose rip, and a trailer-editing conspiracy that the room hopes is hiding something much nastier." },
      { at: 2100, end: 3000, label: "HARD EYES, THE MONKEY, AND M3GAN 2", body: "Reviews, Rotten Tomatoes, Osgood Perkins, and a military-grade M3GAN sequel keep the news lane moving while the room argues about horror-comedy identity." },
      { at: 3000, end: 3900, label: "AVOCADO, THE ASS PROMO, AND FINAL DESTINATION", body: "Burnt coffee, avocado revulsion, cucumber promotion, and a Final Destination debate turn the room's domestic nonsense into part of the canon." },
      { at: 3900, end: 4600, label: "COUNTRY MUSIC AND STU ON THE META", body: "Beyoncé, Post Malone, Jelly Roll, and a Crimson Black Super Chat lead to a smart Scream 7 pitch where the actors who played the characters become part of the mystery." },
      { at: 4600, end: 5200, label: "HELLRAISER, TANNING BEDS, AND BOBBY HEENAN", body: "Hellraiser is declared a movie to watch alone, tanning beds become cancer tubes full of butt juice, and a fan sees Bobby the Brain Heenan in the room's character energy." },
      { at: 5200, end: 5600, label: "THE DEVIL'S PEDDLER'S MALL BOOTH", body: "A strange German VHS purchase becomes a Needful Things story, a possible Patreon documentary, and an admission that public filming often ends in somebody saying the channel sucks." },
      { at: 5600, end: 5795, label: "COPYRIGHT STRIKES AND MICHAEL MYERS RETURNS", body: "A Mama Agnes recommendation gives way to a Fandango takedown, a Patreon room that knows how to regroup, and the promise that Michael Myers will be back." },
    ]),
    highlights: Object.freeze([
      H(42, 50, "ROOM BREAK", "THE CAMERA IS CRISP BECAUSE OF GOD'S LIGHT", "A new camera is credited to morning sunlight, with the room immediately treating the image quality like a supernatural event."),
      H(155, 163, "MAJOR TOPIC TURN", "BLOODLINES HAS A SAD CLOWN SONG", "The Final Destination Bloodlines trailer wins the opening argument through its song, its comments section, and the suspicion that the visible death is not the whole scene."),
      H(338, 346, "WWAM UP IN YA", "EIGHT WHISKEY SOURS AND A VOLLEYBALL NIGHT", "A hangover is described as a multi-day injury, followed by the announcement that drinking and volleyball are still somehow on the schedule."),
      H(662, 670, "STRAIGHT TO STEVE'S ASSHOLE", "THE HUMAN TORCH TOOK OUT A BANK LOAN", "Fantastic Four casting turns Johnny Storm into a man who was denied a bank loan, then the room wonders whether the actor can escape an annoying earlier role."),
      H(845, 853, "STRAIGHT TO STEVE'S ASSHOLE", "THE ACTOR IN WHITE PANTS AFTER LABOR DAY", "A costume choice gets sent straight to Steve's Asshole, with white pants treated as a crime before the movie even arrives."),
      H(958, 966, "FAN SIGNAL", "DAMIAN LEONE SAYS LET PEOPLE ENJOY THE MOVIE", "A statement from Damian Leone becomes the room's most sincere topic turn: horror should be a place where people can watch together without importing every political identity fight."),
      H(1260, 1268, "STRAIGHT TO STEVE'S ASSHOLE", "TERRIFIER IS A MOVIE ABOUT NOTHING", "The room answers the political argument by roasting the Terrifier franchise as movies with no sauce, then admits the actual question is more complicated."),
      H(1642, 1650, "SOUNDBYTE / REPLAY", "THE TONGUE-PIERCING DEATH", "Final Destination Bloodlines gets one of its most uncomfortable doors when the tongue-piercing image is replayed and the room refuses to look away."),
      H(1847, 1855, "MAJOR TOPIC TURN", "THE NOSE RIP THE TRAILER HIDES", "The trailer cuts away just before the promised nose rip, so the room builds a whole theory that the real death is waiting outside the edit."),
      H(2175, 2183, "STRAIGHT TO STEVE'S ASSHOLE", "HARD EYES SCORES A 92", "A 92% Rotten Tomatoes score for a holiday slasher in February is treated as suspiciously good news, especially when the site itself takes eighteen clicks to show the reviews."),
      H(2470, 2478, "TAKE GETS NUCLEAR", "THE MONKEY HAS AN IDENTITY CRISIS", "Osgood Perkins is imagined as the strange director everyone expects to make slow weird movies, then the room wonders whether The Monkey can break that mold."),
      H(2925, 2933, "MAJOR TOPIC TURN", "M3GAN 2 IS A MILITARY-GRADE SYNOPSIS", "The M3GAN 2 plot is read aloud as a stolen-tech defense-contractor story, with the room quietly asking why the sequel needs three new layers of AI bureaucracy."),
      H(3355, 3363, "WWAM UP IN YA", "THE BURNT COFFEE PENIS CASE", "Bad coffee is blamed for burning a penis, and the courtroom in the room immediately starts preparing a lawsuit against the beverage."),
      H(3470, 3478, "STRAIGHT TO STEVE'S ASSHOLE", "AVOCADO LOOKS LIKE DIARRHEA BUTT", "Avocado and guacamole become a food fight, with green mush compared to a diseased butt and vegetables treated as a suspicious rumor."),
      H(3735, 3743, "ROOM BREAK", "THE CUCUMBER PROMO", "A sudden ass-themed promotion arrives just as the stream reaches its biggest audience, creating an accidental WWAM Up In Ya commercial break."),
      H(3845, 3853, "FAN SIGNAL", "FINAL DESTINATION AND STU LIVES", "Carrie McDonald's question pairs the Bloodlines hype with a Stu Lives prompt, letting the fan lane reopen two of the episode's strongest franchises."),
      H(4045, 4053, "STRAIGHT TO STEVE'S ASSHOLE", "COUNTRY MUSIC IS BEING INFILTRATED", "Beyoncé, Post Malone, and Jelly Roll get accused of infiltrating country music, with Cracker Barrel used as the unofficial measurement system."),
      H(4330, 4338, "FAN SIGNAL", "STU RETURNS ON THE META", "Crimson Black's Super Chat leads to a Scream 7 pitch where the actors who played the old characters are actors inside the story, a genuinely sharp meta route."),
      H(4410, 4418, "ROOM BREAK", "DR. DOOM SOUNDS LIKE A BROKEN DRIVE-THRU", "The connection breaks during the Scream 7 explanation and the voice turns into Doctor Doom through a drive-thru speaker."),
      H(4585, 4593, "STRAIGHT TO STEVE'S ASSHOLE", "HELLRAISER NEEDS A LONELY ROOM", "Hellraiser is declared too intense for a community watch, with the room recommending a private screening and a post-movie loofah."),
      H(4668, 4676, "WWAM UP IN YA", "THE TANNING BED CANCER TUBE", "A Final Destination 3 favorite becomes a tanning-bed warning, complete with the horrifying idea that someone else left butt juice behind."),
      H(4810, 4818, "CHARACTER APPEARANCE", "JAY HAS BOBBY THE BRAIN ENERGY", "A fan compares Jay to Bobby the Brain Heenan, and the room accepts the strange resemblance while remembering the wrestling manager's warmth."),
      H(5122, 5130, "WWAM UP IN YA", "THE DEVIL'S PEDDLER'S MALL BOOTH", "A weird German VHS purchase from an empty booth becomes a Needful Things horror premise and a possible Patreon investigation."),
      H(5268, 5276, "FAN SIGNAL", "THE CHANNEL'S DOCUMENTARY ON FAILURE", "The room imagines filming in public, handing someone the channel link, and having them immediately decide it sucks—a perfect self-aware WWAM pitch."),
      H(5522, 5530, "FAN SIGNAL", "MAMA AGNES GOES ON THE LIST", "Byron Hans recommends a scary short called Mama Agnes, and the room makes a mental and physical note for the next watch-scary-stuff session."),
      H(5708, 5716, "STRAIGHT TO STEVE'S ASSHOLE", "FANDANGO SHUT DOWN THE CLIP ROOM", "A Patreon stream of legally posted movie clips gets taken down, sending the room into a familiar regroup where everybody knows exactly where the replacement link will appear."),
      H(5778, 5786, "SOUNDBYTE / REPLAY", "MICHAEL MYERS WILL RETURN", "The final promise is not a neat sign-off: after the platform kills the stream, the room vows that Michael Myers will be back."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 958, end: 1268, label: "THE DAMIAN LEONE MOVIE-ESCAPE ARGUMENT", topic: "fans and creators reject political sorting", body: "Play from 15:58. A fan-facing statement about enjoying Terrifier opens the episode's most sincere conversation before the room turns it back into comedy.", playAt: 958, playEnd: 1268 }),
      hated: Object.freeze({ at: 1642, end: 2183, label: "THE TONGUE AND THE NOSE RIP", topic: "Final Destination refuses to show mercy", body: "Play from 27:22. The tongue-piercing shot and the trailer's missing nose rip give the episode its clearest physical-horror run.", playAt: 1642, playEnd: 2183 }),
      wildestDetour: Object.freeze({ at: 3355, end: 5276, label: "AVOCADO, COUNTRY MUSIC, AND THE DEVIL'S BOOTH", topic: "the room leaves the headline and never comes back", body: "Play from 55:55. Burnt coffee, avocado disgust, an ass promo, Beyoncé, Stu's meta return, Hellraiser, Bobby Heenan, and cursed VHS tapes make one long WWAM detour.", playAt: 3355, playEnd: 5276 }),
      lastWord: Object.freeze({ at: 5522, end: 5786, label: "MAMA AGNES AND THE TAKEDOWN", topic: "the FAM knows how to regroup", body: "Play from 1:32:02. A fan recommendation becomes a future watch, then a platform takedown turns the ending into a promise to return.", playAt: 5522, playEnd: 5786 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
