(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* December 16, 2025: full-tape read of the Welcome to Derry finale recap. */
  sources["u9aRsfemqxg"] = Object.freeze({
    sourceId: "u9aRsfemqxg",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 5345,
      captionWords: 2869,
      captionEvents: 268,
      captionSpanSeconds: 5341.82,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:7b3582b84bcc99bb266edb87aa8638f993d2364f444917a73ccc97a203e483c2",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "06aac362119c07dcc01718a368c8e06c930dc62747f642ec9102a321b3271e3f",
      asrWindowCount: 27,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "IT: WELCOME TO DERRY SEASON FINALE RECAP // DICK HALLORAN, BEVERLY, PENNYWISE, AND THE FAM'S LAST QUESTIONS",
    badge: "FULL SHOW WIKI // 1:29:05 OF DERRY LORE, THE SHINING HANDOFF, SUPERCHATS, AND PENNYWISE MATCHUP MATH",
    headline: "THE WELCOME TO DERRY FINALE CONNECTS DICK HALLORAN TO THE SHINING, THEN LETS THE FAM FIGHT PENNYWISE FOR ANOTHER HOUR.",
    deck:
      "A finale recap that knows the big continuity handoff is only half the fun: Dick Halloran and Leroy Hanlon get the praise, Beverly opens the door to the movies, Pennywise's shape-shifting gets debated, and the chat brings in Jason, Ghostface, Tim Curry, Bill Skarsgård, Dan Stevens, Resident Evil 9, and one very specific Loomis-and-Challis driver's-test congratulations.",
    overview:
      "The room comes in ready to talk about Welcome to Derry's finale and immediately locks onto the connective tissue. Dick Halloran is headed toward the hotel, the episode makes the Shining link impossible to miss, and Beverly's appearance points straight at the next movie chapter. The hosts praise the performances while still taking shots at the finale's choices, especially the repeated visual emphasis and the question of whether every mystery needed one more explanation. After that, the show becomes a compact WWAM variety hour: Avatar: Fire and Ash gets accused of hiding its material, a tiny Indian thriller clip earns a drunk-watch recommendation, a new superhero teaser gets dragged for looking like AI, and Silent Night, Deadly Night gets a full theatrical endorsement. The FAM then takes over. They ask for Loomis and Challis to celebrate a driver's test, compare Pennywises, pit Jason against the Losers Club, ask whether Ghostface survives, and send the room into a Lord of the Rings argument before Resident Evil 9 and Nolan's Odyssey carry the last movie-news lane. It is a finale recap with a real ending, but the archive value is the way every fan prompt turns the ending into another doorway.",
    story: Object.freeze([
      { at: 0, end: 450, label: "THE FINALE'S HOTEL DOOR", body: "The recap starts with the finale's most obvious handoff: Dick Halloran is on his way to the hotel, and the show makes sure nobody misses the connection to The Shining. The joke is that the episode almost announces the future out loud, but the performance still makes the doorway work." },
      { at: 451, end: 900, label: "LEROY, SALLY, AND THE CHARACTER THE ROOM HATED", body: "Praise for Dick Halloran and Leroy Hanlon sits beside a very specific grudge against Leroy's wife. The room remembers every slap and chest-beating argument, proving that a finale can land its mythology while still leaving one character in the penalty box." },
      { at: 901, end: 1350, label: "BEVERLY ARRIVES AND DERRY OPENS INTO IT", body: "Beverly's appearance turns the ending into a bridge toward the IT films. The HBO Max-to-Netflix joke lands beside a real question: how much of the next chapter is the story, and how much is the platform telling viewers what to watch next?" },
      { at: 1351, end: 1800, label: "THE FINALE VERDICT AND A BIGGER MOVIE NIGHT", body: "The episode is still called great even after the room admits it had reservations. The conversation widens into what made the season work, why the effects team may have been stretching what they had, and why a strong supporting performance can carry a supernatural story." },
      { at: 1801, end: 2250, label: "DARK FATE, FIRE AND ASH, AND THE INTERNET RELEASE FIGHT", body: "Game prices and movie-release frustration share the same lane. Avatar: Fire and Ash becomes a case study in theatrical secrecy, with the room predicting that somebody will record the material on a phone if the studio keeps hiding it from the internet." },
      { at: 2251, end: 2700, label: "DOOMSDAY, SUPERGIRL, AND THE BIG-STUDIO COLLISION", body: "Marvel and DC release timing gets treated like a bar fight. The hosts argue about whether Doomsday arriving around Supergirl helps anybody, then pivot into a tiny teaser clip that is too small to judge and too weird not to replay." },
      { at: 2701, end: 3150, label: "THE INDIAN CLIP, THE SPIDER-MAN ENERGY, AND THE AI SHOT", body: "A short Indian thriller clip becomes an instant mood-lifter, while a superhero teaser earns both genuine excitement and a brutal charge that one shot looks artificial. The room even pitches an entire stream built around bizarre international superhero knockoffs." },
      { at: 3151, end: 3600, label: "SILENT NIGHT, DEADLY NIGHT AND THE FAM'S DRIVER", body: "The hosts strongly recommend Silent Night, Deadly Night after talking through its swings and kills. Then a fan asks Loomis and Challis to congratulate a newly licensed driver, giving the character lane a sincere little win before the jokes start again." },
      { at: 3601, end: 4050, label: "Denzel STORIES, IT LORE, AND SHAPE-SHIFTING", body: "Stories about Denzel Washington and Ryan Reynolds lead into a useful Pennywise question: the creature changes form according to what scares a time period. Tim Curry, Bill Skarsgård, and the logic of the clown shape all get a fair turn." },
      { at: 4051, end: 4500, label: "WONDER WOMAN, RE9, AND THE CHAT'S BIGGER CANON", body: "A fan asks who cares about Supergirl when Diana is still missed, then Resident Evil 9 arrives with Leon as a playable character. The stream briefly becomes a convention hallway where every franchise has a new door and the chat is holding the map." },
      { at: 4501, end: 4950, label: "NOLAN'S ODYSSEY AND THE LORD OF THE RINGS TRUCE", body: "Christopher Nolan's Odyssey is praised as a smart theatrical idea, but the real fight is Lord of the Rings. One host wants a serious rewatch, the other is accused of disrespecting Frodo and Sean Bean, and the Fellowship survives by sheer force of affection." },
      { at: 4951, end: 5345, label: "PENNYWISE VERSUS JASON AND THE GOODBYE DOOR", body: "The closing matchup asks whether Jason can beat Pennywise by being too dumb to fear him. The answer keeps changing, which is exactly why the question works. After a time-travel lore complaint, the room thanks the FAM, promises more shows, and exits with a final curse disguised as affection." },
    ]),
    highlights: Object.freeze([
      { at: 574, end: 622, category: "DEEP DIVE", label: "DICK HALLORAN'S HOTEL DOOR", excerpt: "The finale makes the Shining connection explicit: Dick is going to the hotel, and the room wonders why the show did not just let him announce the movie title." },
      { at: 627, end: 675, category: "WWAM UP IN YA", label: "I'M DICK HALLORAN", excerpt: "A fake self-introduction for Dick Halloran turns a continuity handoff into the kind of blunt punchline the finale almost delivers on its own." },
      { at: 637, end: 686, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE LEROY HANLON WIFE GRUDGE", excerpt: "The room's long-running problem with Leroy's wife returns immediately, proving a finale can be canonically important and still leave one character absolutely hated." },
      { at: 910, end: 958, category: "BEST MOMENT", label: "DICK AND LEROY CARRY THE SEASON", excerpt: "Dick Halloran and Leroy Hanlon are called the best parts of the season, with the performances getting more credit than the plot mechanics." },
      { at: 910, end: 960, category: "TAKE GETS NUCLEAR", label: "THE SPECIAL-EFFECTS TEAM HAD TWENTY LEFT", excerpt: "A practical excuse for the finale's effects becomes a WWAM theory: the crew had twenty of the same thing left and decided to spend every one." },
      { at: 1016, end: 1064, category: "DEEP DIVE", label: "BEVERLY OPENS THE IT DOOR", excerpt: "Beverly's appearance shifts the finale directly toward the IT films, turning the closing minutes into a franchise handoff." },
      { at: 1016, end: 1060, category: "THE ROOM BREAKS", label: "THE SONS OF BITCHES PROGRAMMING MOVE", excerpt: "The hosts react to the platform queue like it personally planned the binge, then admit the transition is smart." },
      { at: 1028, end: 1076, category: "FAN SIGNAL", label: "THE PLATFORM HANDOFF", excerpt: "The HBO Max-to-Netflix joke lands beside a real binge route: the next movie is waiting immediately after the finale." },
      { at: 1351, end: 1400, category: "BEST MOMENT", label: "THE FINALE IS STILL GREAT", excerpt: "The room keeps the verdict honest: the finale has issues, but the season still worked and the major performances earned their praise." },
      { at: 2117, end: 2166, category: "WWAM UP IN YA", label: "FUCK THE COLONIZER", excerpt: "A political phrase is dropped into a game-price conversation, then the room immediately retreats to the movie lane before the side quest grows teeth." },
      { at: 2321, end: 2370, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "GRACE RANDOLPH GETS A POINT", excerpt: "Even Grace Randolph gets agreement when the room asks how anybody is supposed to react to a movie the studio refuses to show online." },
      { at: 2375, end: 2424, category: "TAKE GETS NUCLEAR", label: "THE PHONE-RECORDED TRAILER", excerpt: "The room predicts a determined viewer will record the hidden footage on a phone and turn the studio's secrecy into free publicity." },
      { at: 2444, end: 2492, category: "DEEP DIVE", label: "DOOMSDAY VERSUS SUPERGIRL", excerpt: "Marvel and DC release timing is treated like a collision course, with the hosts wondering who benefits when two superhero events arrive together." },
      { at: 2718, end: 2768, category: "THE ROOM BREAKS", label: "THE TEASER IS TOO SMALL", excerpt: "A clip is so tiny the room reaches for microscopes, then decides the bad image quality is part of the entertainment." },
      { at: 2804, end: 2850, category: "WWAM UP IN YA", label: "THE KNEE-PAD CLUE", excerpt: "One tiny costume detail becomes the clue that keeps the room watching the teaser instead of dismissing it." },
      { at: 2892, end: 2940, category: "BEST MOMENT", label: "THE DANCE CLIP MOOD BOOST", excerpt: "A wild dance clip is filed as an emergency mood booster: watch it drunk when the day is bad and happiness arrives on schedule." },
      { at: 2944, end: 2994, category: "FAN SIGNAL", label: "THE INTERNATIONAL SUPERHERO STREAM", excerpt: "The hosts pitch a future stream built around Indian and Japanese superhero oddities, complete with a restaurant that plays the music videos all night." },
      { at: 3054, end: 3104, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE AI-LOOKING SHOT", excerpt: "One teaser image loses the room instantly for looking artificial, while the surrounding settings are still allowed a chance." },
      { at: 3304, end: 3352, category: "DEEP DIVE", label: "SILENT NIGHT, DEADLY NIGHT GETS THE TICKET", excerpt: "The hosts go from hating a cast-heavy teaser to urgently recommending Silent Night, Deadly Night for its swings and kills." },
      { at: 3393, end: 3442, category: "FAN SIGNAL", label: "LOOMIS AND CHALLIS PASS THE DRIVER", excerpt: "A fan asks for a driver's-test congratulations and the character lane turns a normal milestone into an official WWAM initiation." },
      { at: 3403, end: 3452, category: "CHARACTER PERFORMANCE", label: "FIRST STEP INTO MANHOOD", excerpt: "Dr. Loomis and Dr. Challis deliver a congratulatory character response for a fan who passed the driver's test.", characters: ["Dr. Loomis", "Dr. Challis"] },
      { at: 3502, end: 3550, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "ARBY'S HORSEY-SAUCE DETOUR", excerpt: "A driver's-test celebration becomes an Arby's scenario that should never be attempted behind a restaurant dumpster." },
      { at: 3521, end: 3568, category: "FAN SIGNAL", label: "RAMBO VERSUS LAW ABIDING CITIZEN", excerpt: "A fan asks whose tragedy is worse, Rambo's or Gerard Butler's, and the room warns everybody to handle that question carefully." },
      { at: 3765, end: 3814, category: "DEEP DIVE", label: "DENZEL'S FAVORITE SCENE", excerpt: "A story about Denzel praising a scene he was not in becomes a small lesson in how a great actor can build the room around everybody else." },
      { at: 3795, end: 3844, category: "WWAM UP IN YA", label: "RYAN REYNOLDS FAKES COURAGE", excerpt: "Ryan Reynolds is remembered pretending to be angry after Denzel's phone interruption, which is exactly how a set story becomes a character story." },
      { at: 3905, end: 3954, category: "DEEP DIVE", label: "PENNYWISE CHANGES WITH THE FEAR", excerpt: "Pennywise's shape-shifting is treated as a time-period problem: clowns work because they terrify the kids in that particular room." },
      { at: 4040, end: 4088, category: "FAN SIGNAL", label: "WONDER WOMAN OVER SUPERGIRL", excerpt: "Michael Parton misses Diana, and the room agrees Wonder Woman still has the stronger pull even while admitting the hosts are not her biggest fans." },
      { at: 4293, end: 4342, category: "BEST MOMENT", label: "LEON IS PLAYABLE IN RE9", excerpt: "Resident Evil 9 gets a clean burst of hype when the chat confirms Leon is playable, sending the room into a brief celebration." },
      { at: 4578, end: 4626, category: "DEEP DIVE", label: "NOLAN'S ODYSSEY IDEA", excerpt: "Christopher Nolan putting himself in front of the camera for The Odyssey is called a smart theatrical move and a potentially major awards play." },
      { at: 4912, end: 4960, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "FRODO DISRESPECT IS BANNED", excerpt: "Lord of the Rings becomes a friendship boundary: no drinking, no bad attitude, and absolutely no disrespecting Frodo or Sean Bean." },
      { at: 5051, end: 5100, category: "FAN SIGNAL", label: "TIM CURRY WINS THE PENNYWISE VOTE", excerpt: "A fan asks which Pennywise wins, and the room gives Tim Curry the charisma-and-creepiness crown before the matchup gets complicated." },
      { at: 5066, end: 5114, category: "TAKE GETS NUCLEAR", label: "JASON VERSUS PENNYWISE", excerpt: "Jason may beat Pennywise because he is too dumb to be scared, a ridiculous argument that becomes surprisingly coherent for thirty seconds." },
      { at: 5119, end: 5168, category: "DEEP DIVE", label: "THE TIME-TRAVEL BREADCRUMBS", excerpt: "Pennywise's relationship with time gets praised as a lore idea and criticized as a choice that might leave too many breadcrumbs on the table." },
      { at: 5195, end: 5244, category: "WWAM UP IN YA", label: "THE GOD-LEVEL PROBLEM", excerpt: "The room likes the world-eater mythology until the god-level explanation starts making time travel sound like a universal escape hatch." },
      { at: 5324, end: 5344, category: "BEST MOMENT", label: "THE FAM GOODBYE", excerpt: "The finale closes with gratitude, another show promise, and the affectionate insult language the room uses when it genuinely wants the audience back." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 910, end: 958, label: "DICK AND LEROY CARRY THE SEASON", topic: "the performances that survived the finale's rough edges", body: "Play from 15:10. The room may argue about the episode, but Dick Halloran and Leroy Hanlon are the season's undeniable anchors.", playAt: 910, playEnd: 958 }),
      hated: Object.freeze({ at: 637, end: 686, label: "THE LEROY HANLON WIFE GRUDGE", topic: "the character the room never forgave", body: "Play from 10:37. The finale cannot erase the accumulated frustration with Leroy's wife, and the room is happy to reopen the case.", playAt: 637, playEnd: 686 }),
      wildestDetour: Object.freeze({ at: 3403, end: 3452, label: "LOOMIS AND CHALLIS PASS THE DRIVER", topic: "a sincere fan milestone wearing a character costume", body: "Play from 56:43. A driver's-test congratulations becomes a proper Loomis-and-Challis receipt before the stream moves back to Pennywise math.", playAt: 3403, playEnd: 3452 }),
      lastWord: Object.freeze({ at: 5324, end: 5344, label: "THE FAM GOODBYE", topic: "the finale's affectionate last insult", body: "Play from 1:28:44. The room promises another show, thanks the audience, and exits with the exact crude warmth the FAM expects.", playAt: 5324, playEnd: 5344 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
