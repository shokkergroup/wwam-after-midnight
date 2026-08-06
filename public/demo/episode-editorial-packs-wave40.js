(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /*
   * March 21, 2026: a literal full-tape read of the 3:22 Movie News stream.
   * The source starts as a loose Chuck Norris / March Madness hangout, turns
   * into a Spider-Man trailer room, then spends its back half on Halloween,
   * Friday the 13th, Hellraiser, Bloodsport, Scream, and an increasingly
   * filthy fan aftershow. Copy stays bounded to the local Whisper ledger and
   * canonical caption/audio fingerprints; no speaker or visual reaction is
   * invented by the pack.
   */
  sources["yL8sO_EjWOI"] = Object.freeze({
    sourceId: "yL8sO_EjWOI",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 12120,
      captionWords: 8338,
      captionEvents: 895,
      captionSpanSeconds: 12120.49,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:8a79eaa1bbc5809849946f9a6f868d59f1c090481701ca4cfe16b8c4394336e7",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "9f8230c55a7493a59fe3baa07e4506d884876ef76a649ee6b2f1774c52a9e4ee2",
      asrWindowCount: 79,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE TRAILER ROOM THAT BECAME A HALLOWEEN TRIAL",
    badge: "FULL SHOW WIKI // 3:22:00 OF SPIDER-MAN, HALLOWEEN, HELLRAISER, AND FAM AFTERSHOCKS",
    headline: "SPIDER-MAN GETS A FRAME-BY-FRAME ARGUMENT; JAMIE LEE CURTIS GETS SENT TO THE CHUTE.",
    deck:
      "A March 21 movie-news stream that starts with Chuck Norris and March Madness, watches the new Spider-Man trailer in real time, then turns into a Halloween entitlement trial, a Hellraiser pitch meeting, a Bloodsport remake panic, and a fan room that refuses to let the hosts leave cleanly.",
    overview:
      "The title says Movie News and More, but the tape is really two shows stitched together by the same dirty living-room energy. The opening is a loose Chuck Norris memorial and bracket check-in: action-star roles, Sidekicks, Silent Rage, and the familiar WWAM habit of turning a sincere tribute into a joke before the sentiment can put on shoes. The first hard pivot is the new Spider-Man trailer. The hosts freeze-frame the Amazing Fantasy 15 pose, debate the suit's bright blue, complain that motion looks like a video game, and ask why a studio will let a gunshot into a trailer while treating an F-bomb like a controlled substance. From there the room drifts through Dune, The Odyssey, Robert Pattinson's look, practical effects, Val Kilmer's AI recreation, and an A24 Bloodsport remake that sounds exciting until the studio name arrives. The back half belongs to horror. Jamie Lee Curtis's claim that Halloween could not exist without Laurie Strode becomes a full Donald Pleasence defense, then Halloween, Michael Myers, Jason, Scream 7, Hellraiser, Tales from the Box, and a possible Friday Part II anthology all receive the WWAM courtroom treatment. The FAM keeps editing the show with super chats: Lee the Machine sends a Loomis/Challis doctor's appointment, Michael Parton supplies a Friday fact and a Baywatch image prompt, and viewers bring grief, birthday wishes, bleach jokes, and new movie requests into the same room. The final minutes are not a tidy sign-off. They are a rowdy aftershow about Best of the Best, old franchises, body parts, and what to watch next. That shape is the point: the archive needs the argument, the detour, and the exact moment the room loses its professional mask.",
    story: Object.freeze([
      { at: 0, end: 900, label: "CHUCK NORRIS GETS A DIRTY TRIBUTE", body: "The opening remembers Chuck Norris through Walker Texas Ranger, Bowflex, Sidekicks, and Silent Rage while the room tries to decide whether a great action career can be separated from a public political legacy. It is affectionate, blunt, and immediately interrupted by bathroom logistics." },
      { at: 901, end: 1800, label: "MARCH MADNESS AND THE TRAILER DOOR", body: "Bracket talk and a quick thanks to the FAM set up the real event: trailers are coming, Spider-Man is new to the hosts, and the broadcast may have to survive a copyright strike. The excitement is genuine even while the production plan is held together with profanity." },
      { at: 1801, end: 2700, label: "SPIDER-MAN FREEZES THE ROOM", body: "The new suit, the Amazing Fantasy 15 pose, Scorpion's silhouette, and the bright blue panels get watched instead of merely summarized. The hosts like pieces of the trailer, dislike the video-game motion, and keep rewinding until the chat becomes a second editing desk." },
      { at: 2701, end: 3600, label: "THE F-BOMB HAS A RATING BOARD", body: "A Spider-Man gunshot and a missing swear word become a broader complaint about studio logic. The room can accept a violent chest hit in a trailer while a single curse is treated like a nuclear launch, then immediately undercuts the argument with a Mallrats sailboat joke." },
      { at: 3601, end: 4500, label: "DUNE, THE ODYSSEY, AND THE PRACTICAL EFFECTS TEST", body: "The conversation widens into Dune, Christopher Nolan's The Odyssey, Tom Holland overexposure, and practical lasers and fireworks. The hosts are not anti-CGI; they want effects that feel like something was physically there before the computer arrived." },
      { at: 4501, end: 5400, label: "JAMIE LEE CURTIS ENTERS THE ENTITLEMENT COURT", body: "A clip of Jamie Lee Curtis saying Halloween could not exist without Laurie Strode triggers the show's sharpest argument. The room defends Donald Pleasence, calls the statement wildly dismissive, and makes the distinction between loving a performance and pretending one performer owns an entire franchise." },
      { at: 5401, end: 6300, label: "THE ACTOR, THE ESTATE, AND THE AI LINE", body: "Val Kilmer's posthumous AI recreation is treated more carefully than the earlier Halloween fight. The hosts dislike AI performers in principle but separate that discomfort from attacking a family that approved the use, leaving the viewer with a real ethical disagreement instead of a fake certainty." },
      { at: 6301, end: 7200, label: "BLOODSPORT GETS A NEW BODY", body: "An A24 remake of Bloodsport sounds promising until the studio becomes part of the discussion. The room wants Jean-Claude Van Damme's legacy respected, wonders how much can be remade without the original's strange magic, and keeps the pitch alive through fan questions." },
      { at: 7201, end: 8100, label: "HELLRAISER OPENS THE BOX AGAIN", body: "Hellraiser becomes the evening's most constructive franchise conversation: a new project should use the box, the Cenobites, Doug Bradley's practical legacy, and the guilt that makes the myth work. The hosts pitch Tales from the Box as a structure, then immediately notice that the title sounds like porn." },
      { at: 8101, end: 9000, label: "THE FAM TURNS THE HORROR DESK INTO A CLINIC", body: "Lee the Machine's super chat sends Loomis, Challis, and Michael to a fictional wiener doctor. Other viewers share grief, recommend Best of the Best, and keep the room moving from practical horror makeup to old-school action without letting the character lane disappear." },
      { at: 9001, end: 9900, label: "HALLOWEEN AND FRIDAY GO TO WAR", body: "Halloween's legacy, Michael Myers without weapons, Jason in the lake, Friday Part II's abandoned anthology plan, and the question of who owns a franchise all arrive in one long horror trial. The room's real verdict is that icons survive because the audience keeps arguing over them." },
      { at: 9901, end: 10800, label: "SCREAM, SUPERMAN, AND THE CHAT'S PERSONAL HISTORY", body: "Scream 7 gets a third-viewing shout-out, Superman gets a tearjerker defense, and viewers bring their own movie rituals into the broadcast. A Baywatch image prompt, a Spider-Man Mayday idea, and a report about a death in the film community make the stream feel lived-in rather than scheduled." },
      { at: 10801, end: 11700, label: "BEST OF THE BEST BECOMES HOMEWORK", body: "The hosts sell Best of the Best, debate Cobra Kai against the film's crew, and remember the pleasure of watching an entire old franchise in one sitting. A viewer asking about Jason Statham and Collateral becomes another excuse to let the FAM drive the syllabus." },
      { at: 11701, end: 12120, label: "THE AFTERSHOW REFUSES TO BEHAVE", body: "The last stretch is bleached-asshole jokes, milk science, a possible Bronson marathon, music requests, and a final promise to keep bringing the old franchises back. The broadcast ends only when the room has run out of ways to make the goodbye worse." },
    ]),
    highlights: Object.freeze([
      { at: 223, end: 240, category: "THE ROOM BREAKS", label: "CHUCK NORRIS TRANSCENDS HUMANITY", excerpt: "A tribute comment says Chuck Norris did not die; he defeated life and gained another level." },
      { at: 563, end: 580, category: "TAKE GETS NUCLEAR", label: "SIDEKICKS GETS THE FLOWERS", excerpt: "The room picks Sidekicks as a favorite Norris performance before the memorial can become respectable." },
      { at: 1131, end: 1148, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE MCRIB TASTES LIKE A HAIRNET", excerpt: "A fast-food detour ends with the McRib compared to a high-school lunch lady's hairnet." },
      { at: 1186, end: 1205, category: "FAN SIGNAL", label: "MARVEL HAS SHUT THEM DOWN BEFORE", excerpt: "The hosts admit a trailer stream has been shut down by Marvel before, turning the next watch into a copyright gamble." },
      { at: 1500, end: 1518, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE TRAILER ROOM NEEDS A PEE BREAK", excerpt: "The production schedule bends around bathroom logistics before the new Spider-Man trailer gets its grand entrance." },
      { at: 2129, end: 2147, category: "TAKE GETS NUCLEAR", label: "THE AMAZING FANTASY 15 POSE", excerpt: "A single Spider-Man frame is recognized as a deliberate Amazing Fantasy 15 echo and becomes the first freeze-frame argument." },
      { at: 2958, end: 2976, category: "WWAM UP IN YA", label: "THE TEARS GET QUESTIONED", excerpt: "A trailer reaction gets interrogated for emotional sincerity before the room can decide whether the scene earned it." },
      { at: 3015, end: 3033, category: "TAKE GETS NUCLEAR", label: "THE PUNISHER IS NOT NANCY FANCY", excerpt: "The hosts separate a brutal Punisher movie from a polished superhero fantasy and refuse to make the character polite." },
      { at: 3553, end: 3571, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE WIFE KNOWS THE TRAILER ALREADY", excerpt: "A domestic argument about watching ahead becomes a tiny marriage thriller inside the Spider-Man discussion." },
      { at: 3832, end: 3850, category: "WWAM UP IN YA", label: "THE SUIT LOOKS LIKE A VIDEO GAME", excerpt: "The new suit works while standing still and turns synthetic the moment it moves; the room cannot stop testing the difference." },
      { at: 4324, end: 4342, category: "FAN SIGNAL", label: "AL PACINO'S FACE STEALS THE FRAME", excerpt: "The chat and hosts lock onto a background expression and turn one reaction shot into its own mini-review." },
      { at: 4875, end: 4893, category: "CHARACTER PERFORMANCE", label: "LOOMIS DEFENDS THE STRODE LEGACY", excerpt: "The Loomis lane frames the Michael Myers argument around the Strode family and the cost of pretending one name carried Halloween alone.", characters: ["Dr. Loomis", "Michael Myers"] },
      { at: 4984, end: 5002, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "HARRISON FORD GETS THE HAN SOLO TEST", excerpt: "The room compares the Halloween claim to Harrison Ford saying Star Wars could not exist without Han Solo." },
      { at: 5102, end: 5120, category: "THE ROOM BREAKS", label: "THE DIVa ATTITUDE KEEPS ESCALATING", excerpt: "The argument stops being about a quote and starts being about the strange attitude surrounding it." },
      { at: 5339, end: 5357, category: "THE ROOM BREAKS", label: "THE MOTHBALLS VERDICT", excerpt: "A blunt sign-off sends the debate from criticism into the kind of personal roast that only WWAM would keep on tape." },
      { at: 5683, end: 5701, category: "COMMUNITY MEMORY", label: "SILENT RAGE GETS A CALLBACK", excerpt: "The Chuck Norris tribute loops back to the older WWAM review of Silent Rage and makes the archive feel connected." },
      { at: 6214, end: 6232, category: "WWAM UP IN YA", label: "BLOODSPORT'S LEGACY IS NOT A PROP", excerpt: "The remake discussion asks whether a new studio can honor Bloodsport without sanding off the movie's strange physical personality." },
      { at: 6877, end: 6895, category: "THE ROOM BREAKS", label: "THE MARRIED PEOPLE UNDERSTAND", excerpt: "A relationship aside gets the room laughing because the joke only works if somebody has survived a long marriage." },
      { at: 7516, end: 7534, category: "CHARACTER PERFORMANCE", label: "JASON IS STILL IN THE LAKE", excerpt: "The Jason lane reduces a franchise-history argument to one brutal fact: the movie left him in the lake.", characters: ["Jason Voorhees"] },
      { at: 7838, end: 7856, category: "TAKE GETS NUCLEAR", label: "TALES FROM THE BOX", excerpt: "A Hellraiser anthology pitch arrives with a clean hook—people open the box because they are guilty—then immediately acquires an R-rated alternate title." },
      { at: 8114, end: 8132, category: "COMMUNITY MEMORY", label: "THE ROOM STOPS FOR A DOG", excerpt: "A fan message about putting down a beloved dog briefly strips away the bits and shows why the FAM keeps returning." },
      { at: 8366, end: 8384, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE MESSAGE GETS SENT TWICE", excerpt: "A duplicated fan message becomes a tiny technical mistake that the room turns into a full insult." },
      { at: 8448, end: 8466, category: "TAKE GETS NUCLEAR", label: "COBRA KAI MEETS BEST OF THE BEST", excerpt: "The chat's martial-arts question turns into an emphatic prediction that the Best of the Best crew wipes the floor." },
      { at: 9296, end: 9314, category: "WWAM UP IN YA", label: "LEE PACE AS FREDDY", excerpt: "A fan casting suggestion for Lee Pace as Freddy lands in the middle of the horror conversation and changes the temperature." },
      { at: 9598, end: 9616, category: "CHARACTER PERFORMANCE", label: "MICHAEL MYERS NEEDS NO GUN", excerpt: "The Myers lane circles the franchise rule that the shape does not need a weapon to own the frame.", characters: ["Michael Myers"] },
      { at: 9841, end: 9859, category: "TAKE GETS NUCLEAR", label: "THE PARTY-LINE PROBLEM", excerpt: "A political detour becomes a blunt argument for thinking independently instead of letting a party do the thinking." },
      { at: 9927, end: 9945, category: "FAN SIGNAL", label: "MICHAEL PARTON BRINGS BAYWATCH", excerpt: "Michael Parton drops a Stephen Amell set-photo question into the stream and the horror desk happily takes the bait." },
      { at: 10059, end: 10077, category: "COMMUNITY MEMORY", label: "SCREAM 7 FOR THE THIRD TIME", excerpt: "Gary is already seeing Scream 7 for the third time, a perfect receipt for the personal relationship the room has with that franchise." },
      { at: 10577, end: 10595, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "DUNE GETS THE WORSE VERDICT", excerpt: "A comparison between Dune and another emotional letdown gets answered with the most insulting possible ranking." },
      { at: 10846, end: 10864, category: "TAKE GETS NUCLEAR", label: "THE COLLATERAL THEORY", excerpt: "A viewer asks whether Jason Statham's suit links Collateral to The Transporter and the room admits it has no responsible answer." },
      { at: 11090, end: 11108, category: "FAN SIGNAL", label: "FRIDAY PART II ALMOST WENT ANTHOLOGY", excerpt: "Michael Parton supplies a real franchise-history rabbit hole: Friday Part II was once imagined as an anthology instead of another Voorhees story." },
      { at: 11817, end: 11835, category: "WWAM UP IN YA", label: "BLEACH THE ASSHOLE, PLAY THE MOVIE", excerpt: "The aftershow reaches peak WWAM when a viewer pairs an upcoming watch with an aggressively personal grooming ritual." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2129, end: 3832, label: "THE SPIDER-MAN TRAILER ROOM", topic: "Amazing Fantasy 15, the new suit, Scorpion, and the F-bomb rating argument", body: "Play from 35:29. This is the cleanest example of the show doing the work live: watch, pause, argue, rewind, and let the chat become the second edit bay.", playAt: 2129, playEnd: 3832 }),
      hated: Object.freeze({ at: 4875, end: 5357, label: "THE JAMIE LEE CURTIS ENTITLEMENT TRIAL", topic: "Laurie Strode, Donald Pleasence, and who gets to claim Halloween", body: "Play from 1:21:15. The sharpest complaint of the night is also the most useful archive chapter because it explains why the hosts defend Pleasence so fiercely.", playAt: 4875, playEnd: 5357 }),
      wildestDetour: Object.freeze({ at: 7516, end: 8384, label: "JASON, THE BOX, AND THE PORN PITCH", topic: "Friday the 13th, Tales from the Box, and a Hellraiser idea that immediately gets filthy", body: "Play from 2:05:16. A serious anthology pitch survives for about thirty seconds before WWAM gives it an R-rated alternate title.", playAt: 7516, playEnd: 8384 }),
      lastWord: Object.freeze({ at: 11090, end: 12120, label: "THE FAM AFTERSHOW", topic: "Friday history, Bronson movies, music requests, and the final grooming threat", body: "Play from 3:04:50. The official show is over in spirit, but the room keeps accepting fan receipts until the goodbye finally runs out of oxygen.", playAt: 11090, playEnd: 12120 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
