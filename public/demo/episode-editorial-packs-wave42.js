(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /* March 5, 2026: full-tape read of the open-line movie-news stream. */
  sources["_8rkO1gLQds"] = Object.freeze({
    sourceId: "_8rkO1gLQds",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 11359,
      captionWords: 7015,
      captionEvents: 780,
      captionSpanSeconds: 11358.83,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:3f85286372db5e3f91fc7d26e071ec81438f6e4100298a9c7d25890cf1a7a1dc",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "b1fd4e788cd7cde2e79895b8f883e9d8e6b2bb857e72759130883151d1a33145",
      asrWindowCount: 780,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE SCREAM 7 EPILOGUE, MATRIX 5 PANIC, AND THE HAWK-HANDS BOXING MATCH",
    badge: "FULL SHOW WIKI // 3:09:19 OF MOVIE NEWS, TRAILER COURT, AND FAM DAMAGE",
    headline: "THE SCREAM 7 EPILOGUE STARTS A FIGHT; BAGEL BITES AND HAWK HANDS FINISH IT.",
    deck:
      "A March 5 movie-news room that bounces from Resident Evil multiplayer fantasies to Green Lantern hair, Matrix 5 pessimism, Scream 7's secret epilogue, Van Damme what-ifs, Phases of Death, Twitter beef, and a character-heavy goodbye that keeps finding new ways to get weird.",
    overview:
      "This tape is not a tidy news desk. It is two friends trying to talk about movies while every side road turns into a bit. The opening starts with a disagreement about a movie somebody absolutely should not watch if they plan to enjoy it, then Resident Evil becomes a fake military résumé: one host hunted monsters with Leon Kennedy while the other was apparently busy acquiring a high-school yeast infection. A brief Green Lantern casting check becomes a Kyle Chandler hair appreciation society, then the news jumps to Matrix 5, Terrifier 4, Scary Movie 6, and the question of whether the Wayans can make the spoof franchise feel like itself again. The middle is a Van Damme museum: Predator, Bloodsport, Johnny Cage, and the roles that might have changed an entire decade of genre movies. Scream 7's filmed epilogue and the franchise's box-office numbers trigger the show's most useful argument—what counts as a good idea when the internet already knows the alternate ending? From there, the room gets gloriously small: bagel bites, a Phases of Death trailer, Twitter fights, Dave McCray's alleged big one, a basement boxing match with hawk hands, and fans asking for stories, rankings, and character voices. The final stretch is a radio play made of Ric Flair, The Rock, Batman, and an aggressively unhelpful Corey Feldman riff. The tape works because the jokes are not decoration; they are how WWAM stress-tests every movie idea it touches.",
    story: Object.freeze([
      { at: 0, end: 780, label: "THE MOVIE YOU SHOULD NOT LET HIM WATCH", body: "The room opens with a warning: one host already knows the other will hate a movie, and the argument becomes a miniature WWAM review philosophy. Critique is welcome; pretending the movie is beyond saving is not." },
      { at: 781, end: 1560, label: "RESIDENT EVIL TURNS INTO A MILITARY RÉSUMÉ", body: "Resident Evil multiplayer becomes a fake comparison between somebody who fought through Raccoon City and somebody who apparently spent high school elsewhere. The joke is crude, but the franchise affection underneath it is real." },
      { at: 1561, end: 2340, label: "GREEN LANTERN GETS A HAIR DEPARTMENT", body: "Kyle Chandler, Aaron Pierre, and the next Green Lantern story get a good-faith casting check before the room gets distracted by Coach Chandler's hair and the fear of losing one's own." },
      { at: 2341, end: 3120, label: "MATRIX 5 AND TERRIFIER 4 ENTER TRAILER COURT", body: "The Matrix is treated as a franchise that has lost its magic, while Terrifier 4 gets a cautious update. The hosts keep separating a promising premise from the studio history attached to it." },
      { at: 3121, end: 3900, label: "SCARY MOVIE AND THE VAN DAMME WHAT-IFS", body: "Scary Movie 6, Jean-Claude Van Damme, Predator, and Johnny Cage turn the show into a casting-history detour. The best part is the recognition that a single role can bend an entire genre sideways." },
      { at: 3901, end: 4680, label: "SCREAM 7'S SECRET EPILOGUE", body: "News that Scream 7 filmed an epilogue with Stu alive becomes a genuine argument about audience testing, spoiler culture, and whether an alternate ending can haunt the finished movie more than the one released." },
      { at: 4681, end: 5460, label: "BAGEL BITES, THE PHASES OF DEATH, AND A BAD TRAILER", body: "A microwave snack, a new trailer, and a questionable online clip share the same stretch of tape. The room is at its funniest when it admits that the internet has made every movie night a forensic exercise." },
      { at: 5461, end: 6240, label: "THE TWITTER FIGHT ROOM", body: "A Twitter argument becomes a lesson in why the hosts should not highlight every hater. The insults are loud, but the underlying rule is simple: do not let somebody else's bad faith choose the show's subject." },
      { at: 6241, end: 7020, label: "THE MOVIE HE DOES NOT WANT J TO REVIEW", body: "One host begs the other not to watch a movie precisely because the flaws are too easy to weaponize. It is the purest version of their recurring debate over whether loving a movie means protecting it from the room." },
      { at: 7021, end: 7800, label: "DAVE MCCRAY, DICK JOKES, AND THE CHAT'S COUNTERPROGRAMMING", body: "A creator clip, a fan-submitted story, and an escalating anatomy joke show the chat doing what it does best: turning a normal question into an entirely different broadcast." },
      { at: 7801, end: 8580, label: "THE HAWK-HANDS BASEMENT BOXING MATCH", body: "A story about boxing for roughly two seconds in a basement becomes a character study in fake confidence, real fear, and the kind of equipment choice that makes a fair fight impossible." },
      { at: 8581, end: 9360, label: "LEE THE MACHINE AND THE FAM'S BIG SWING", body: "The audience lane takes over. Lee the Machine gets a grateful shout-out, other viewers send questions and challenges, and the hosts make clear that fan money and fan attention are part of the show's memory, not background noise." },
      { at: 9361, end: 10140, label: "TEENAGE STORIES, SCREAM, AND THE FIGHT OVER WHO IS NICE", body: "The room moves through teenage memories, Scream rankings, and a debate over whether a character can be too nice to be interesting. The answer is delivered through performance rather than a tidy conclusion." },
      { at: 10141, end: 10775, label: "RIC FLAIR, THE ROCK, AND THE LAST BUTTON", body: "The sign-off becomes a rapid-fire character reel: Ric Flair as president, The Rock's catchphrases, a snow-day memory, and one more clip that sends the room into the end credits without actually calming down." },
      { at: 10776, end: 11359, label: "COREY FELDMAN, BATMAN, AND THE WOLF-PACK EXIT", body: "The final minutes are deliberately unhinged. A Corey Feldman riff, a Batman-versus-Darkseid question, and a last exchange about the Wolf Pack leave the tape on a joke instead of a thesis." },
    ]),
    highlights: Object.freeze([
      { at: 635, end: 653, category: "WWAM UP IN YA", label: "THE YEAST-INFECTION RÉSUMÉ", excerpt: "Resident Evil multiplayer becomes a wildly unnecessary comparison of who actually survived high school." },
      { at: 784, end: 802, category: "CHARACTER PERFORMANCE", label: "THE SLING BLADE IMPRESSION", excerpt: "A Sling Blade impression gets held up as one of the best the room has heard all night.", characters: ["Sling Blade"] },
      { at: 1443, end: 1461, category: "TAKE GETS NUCLEAR", label: "GREEN LANTERN NEEDS A BETTER STORY", excerpt: "The casting conversation turns into a blunt warning that a good actor cannot rescue a story nobody wants." },
      { at: 2007, end: 2025, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "MATRIX 5 HAS NO MAGIC LEFT", excerpt: "The Matrix gets sentenced by the room's harshest franchise test: the old magic is gone and everyone knows it." },
      { at: 2092, end: 2110, category: "FAN SIGNAL", label: "THE TERRIFIER 4 UPDATE", excerpt: "A Terrifier 4 update arrives in the middle of the show and sends the chat into immediate franchise speculation." },
      { at: 2450, end: 2468, category: "TAKE GETS NUCLEAR", label: "HALF-GAY NUT UP OR SHUT UP", excerpt: "A fan phrase becomes a full WWAM argument about whether a sentence can be only half committed to its own bit." },
      { at: 3135, end: 3153, category: "WWAM UP IN YA", label: "JOHNNY CAGE WAS THE ONE THAT GOT AWAY", excerpt: "Van Damme's missed Johnny Cage role becomes the casting what-if everybody in the room can actually see." },
      { at: 3940, end: 3958, category: "TAKE GETS NUCLEAR", label: "STU'S FILMED EPILOGUE", excerpt: "The Scream 7 alternate epilogue turns a news item into the night's biggest argument about audience testing." },
      { at: 4800, end: 4818, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "BAGEL BITES BURN THE MOUTH", excerpt: "The room agrees that microwaved Bagel Bites are a self-inflicted injury nobody learns from." },
      { at: 4850, end: 4868, category: "FAN SIGNAL", label: "THE PHASES OF DEATH TRAILER", excerpt: "A new trailer is introduced with enough enthusiasm to make the chat demand a full breakdown." },
      { at: 5190, end: 5208, category: "THE ROOM BREAKS", label: "THE TWITTER FIGHT AUTOPSY", excerpt: "A blocked account and a misunderstood insult become a complete forensic reconstruction of online stupidity." },
      { at: 5630, end: 5648, category: "WWAM UP IN YA", label: "PRIZZY'S NAME HAS TOO MANY NUMBERS", excerpt: "The room decides every extra digit in a username is evidence of a previous argument." },
      { at: 6010, end: 6028, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "DO NOT HIGHLIGHT THE HATER", excerpt: "The hosts agree that giving a bad-faith viewer the spotlight is its own form of self-harm." },
      { at: 6640, end: 6658, category: "TAKE GETS NUCLEAR", label: "THE MOVIE HE BEGS J NOT TO WATCH", excerpt: "A sincere plea not to review a movie becomes a confession that the flaws are simply too tempting." },
      { at: 7150, end: 7168, category: "WWAM UP IN YA", label: "DAVE MCCRAY'S BIG ONE", excerpt: "A fan memory about Dave McCray turns into a body-part punchline that the room cannot leave alone." },
      { at: 7370, end: 7388, category: "THE ROOM BREAKS", label: "THE CLUE BOARD GUY", excerpt: "A bizarre online personality gets compared to somebody who is permanently trapped inside a game of Clue." },
      { at: 7990, end: 8008, category: "THE ROOM BREAKS", label: "HAWK HANDS IN THE BASEMENT", excerpt: "A two-second boxing match becomes an unfair fight the moment the gloves come off and the hawk hands go on." },
      { at: 8370, end: 8388, category: "TAKE GETS NUCLEAR", label: "SCREAM 5 WINS THE REBOOT FIGHT", excerpt: "The ranking debate gets personal when the room refuses to move Scream 5 out of its chosen slot." },
      { at: 8990, end: 9008, category: "FAN SIGNAL", label: "LEE THE MACHINE GETS HIS FLOWERS", excerpt: "A big fan message is met with real gratitude before the show immediately tries to ruin the mood with a joke." },
      { at: 9050, end: 9068, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE FAN ROOM GOES ADULTS-ONLY", excerpt: "A question about a movie character takes one wrong turn and the whole room follows it." },
      { at: 9630, end: 9648, category: "CHARACTER PERFORMANCE", label: "THE WOLF-PACK VOICE", excerpt: "A character voice returns long enough to turn a normal answer into a miniature radio sketch.", characters: ["Corey Feldman"] },
      { at: 10342, end: 10360, category: "CHARACTER PERFORMANCE", label: "RIC FLAIR FOR PRESIDENT", excerpt: "Ric Flair is installed in the White House and the room refuses to explain the policy platform.", characters: ["Ric Flair"] },
      { at: 10633, end: 10651, category: "CHARACTER PERFORMANCE", label: "TIME TO PLAY THE GAMES", excerpt: "The Rock's catchphrase gets repeated until the phrase itself becomes the punchline.", characters: ["The Rock"] },
      { at: 10879, end: 10897, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE COREY FELDMAN BUTT DETOUR", excerpt: "A Corey Feldman reference sends the room into a deliberately tasteless, clearly comedic riff." },
      { at: 11010, end: 11028, category: "FAN SIGNAL", label: "BATMAN WITH A LIGHTSABER", excerpt: "The final fan question asks whether Batman can beat Darkseid with a lightsaber and gets the only answer this room would give." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 3936, end: 4090, label: "THE SECRET SCREAM EPILOGUE", topic: "Stu, audience testing, and whether a hidden ending can save a movie", body: "Play from 1:05:36. This is the tape's most useful argument: the hosts can disagree about Scream 7 while still naming exactly why the alternate ending matters.", playAt: 3936, playEnd: 4090 }),
      hated: Object.freeze({ at: 2007, end: 2130, label: "MATRIX 5 GETS THE CHUTE", topic: "franchise fatigue and the lost magic of The Matrix", body: "Play from 33:27. The take is blunt, but it is grounded in a specific fear: another sequel can repeat the brand without recovering the feeling.", playAt: 2007, playEnd: 2130 }),
      wildestDetour: Object.freeze({ at: 7801, end: 8100, label: "HAWK HANDS AND BAGEL BITES", topic: "basement boxing, fake confidence, and the snack that burns everybody", body: "Play from 2:10:01. The detour moves from a microwaved mouth injury to a basement fight story that could only be told by these two.", playAt: 7801, playEnd: 8100 }),
      lastWord: Object.freeze({ at: 10342, end: 11359, label: "THE CHARACTER-VOICE EXIT", topic: "Ric Flair, The Rock, Batman, Corey Feldman, and one last fan question", body: "Play from 2:52:22. The show tries to end with a clean button and instead opens a final character drawer full of catchphrases and bad ideas.", playAt: 10342, playEnd: 11359 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
