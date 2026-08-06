(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /*
   * April 30, 2026 is the first of the next 2026 ranking-room tapes promoted
   * out of the structured layer. The copy is bounded to the local Whisper
   * ledger and the canonical audio pass; it does not infer a speaker, camera
   * reaction, or visual bracket state that the source does not establish.
   */
  sources["-31V7Dbyyqs"] = Object.freeze({
    sourceId: "-31V7Dbyyqs",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 12579,
      captionWords: 8029,
      captionEvents: 886,
      captionSpanSeconds: 12519.38,
      captionDurationCoveragePercent: 99.53,
      captionSha256: "sha256:5df69c7118bc8607d2cc0baf6ccf1139fad372d1bd99e27c5184162fabcfbc16",
      captionSourceKind: "local-whisper-transcript",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "THE BRACKET, WITHOUT THE FILLER",
    badge: "FULL SHOW WIKI // 3:29 OF HORROR CIVIL WAR",
    headline: "HORROR GOES TO WAR. ROBOCOP FILES A COMPLAINT. LOOMIS GETS A RESTRAINING ORDER.",
    deck:
      "A three-and-a-half-hour franchise bracket starts with a snoring neighbor and ends with Scream, Halloween, and Friday the 13th leaving the room smoking. In between: physical-media panic, Hellraiser game talk, Robocop versus Chucky, Lee the Machine's prank threat, and a Loomis/Challis bit that absolutely should have been supervised by an adult.",
    overview:
      "This is not a tidy tournament broadcast. It is a ranking-room tape that keeps getting hijacked by the room itself. The cold open is a neighbor-snoring emergency and a camera that refuses to behave. The first desk turns physical media into a fight over whether companies can quietly take away something viewers already bought. A Hellraiser game discussion then opens the door to Pinhead, the Cenobites, Doug Bradley, and the sort of lore tangent that makes a simple trailer feel like a constitutional convention. The middle is the main event: Halloween, Friday the 13th, Scream, Saw, Robocop, Child's Play, Mission: Impossible, James Bond, Rambo, Stephen King, and more are pushed through a live audience bracket. The final stretch is all chat, fan messages, a Lee the Machine cameo, fake professional-streamer confidence, and a Loomis/Challis scenario that ends with a Facebook threat and a light-pole story. It is messy in the way a good WWAM night is messy: the format keeps trying to be a bracket while the personalities keep setting fire to the scorecard.",
    story: Object.freeze([
      {
        at: 0,
        end: 1199,
        label: "THE COLD OPEN IS A SNORING-BASED CRIME SCENE",
        body:
          "Before the bracket exists, the room is dealing with a neighbor loud enough to defeat plywood walls, a spider story, and a camera setup that has already gone sideways. The first joke establishes the tape's operating system: filthy, loose, and one technical problem away from becoming a hostage negotiation.",
      },
      {
        at: 1200,
        end: 2399,
        label: "PHYSICAL MEDIA GETS ITS FUNERAL NOTICE",
        body:
          "The conversation turns serious about companies stopping physical copies and forcing audiences toward whatever access rules they feel like imposing. The argument is pro-disc, anti-lock-in, and still somehow makes room for an Olivia Newton-John lyric and a Michael Parton callback.",
      },
      {
        at: 2400,
        end: 3199,
        label: "HELLRAISER OPENS THE LORE TRAPDOOR",
        body:
          "Hellraiser's new game material becomes a discussion about Pinhead, the other Cenobites, their lack of on-screen teamwork, and what it would mean to interact with beings who cannot simply be defeated. The show is already talking like a franchise summit before the actual bracket begins.",
      },
      {
        at: 3200,
        end: 4499,
        label: "THE FIRST ROUND STARTS WITH HORROR AGAINST FAST FOOD",
        body:
          "The bracket opens with Halloween against the Halloween franchise and Fast & Furious, then immediately turns into a referendum on sequels, family speeches, and whether a horror audience was ever going to vote neutrally. Friday the 13th takes its first close-looking win, 58 to 42, and the room calls the bias out loud.",
      },
      {
        at: 4500,
        end: 5999,
        label: "STEPHEN KING, MISSION: IMPOSSIBLE & THE CHAT'S BAD IDEAS",
        body:
          "The middle rounds keep mixing serious franchise arguments with detours about Carrie, Misery, Cujo, Mission: Impossible, and whatever the chat can throw into the next poll. A clean tournament spine is impossible once the hosts start treating every matchup like a personal betrayal.",
      },
      {
        at: 6000,
        end: 7499,
        label: "LEE THE MACHINE ARRIVES WITH A PRANK AND A GORILLAZ COVER",
        body:
          "A run of fan messages brings Lee ‘The Machine’ Bowers into the room, followed by a Loomis message, a promised prank with Challis, and a comparison of Jay's on-screen image to a meth-fueled gas-station customer and a Gorillaz album cover. This is the point where the fan room stops being a comment feed and becomes part of the cast.",
      },
      {
        at: 7500,
        end: 8999,
        label: "THE ELITE EIGHT BECOMES A MORAL TEST",
        body:
          "Rambo, Bond, Halloween, Scream, and the remaining horror/action survivors reach the upper bracket. The choices are no longer just ‘which movie is better’; they become loyalty tests involving cancer, Vietnam, franchise identity, and whether anyone is allowed to abandon the films that raised them.",
      },
      {
        at: 9000,
        end: 10499,
        label: "THE SCORECARD CATCHES FIRE",
        body:
          "The room discovers that the bracket may have skipped a matchup. Scream and James Bond are suddenly being discussed as if the audience has to reconstruct the tournament from memory. The correction attempt produces the strongest acoustic spike in the pass and turns spreadsheet maintenance into live comedy.",
      },
      {
        at: 10500,
        end: 11699,
        label: "CHAT SUPPLIES THE LAST ROUND OF AMMUNITION",
        body:
          "Later fan messages pull the hosts through Evil Dead, The Texas Chain Saw Massacre, Bruce Campbell, Wes Craven, and a proposed Punisher commentary. The show keeps rewarding people who stay late: each new message becomes another doorway into the channel's older obsessions.",
      },
      {
        at: 11700,
        end: 12579,
        label: "LOOMIS, CHALLIS & THE FACEBOOK THREAT",
        body:
          "The closing room turns a question about Mark Wahlberg into a Loomis-versus-Challis casting argument, then swerves into a fake Facebook denunciation and a real story about a car hitting a light pole. The bracket ends, but the WWAM universe keeps rolling past the supposed goodbye.",
      },
    ]),
    highlights: Object.freeze([
      { at: 55, end: 63, category: "WWAM UP IN YA", label: "THE NEIGHBOR'S SNORING HAS ENTERED THE HOUSE", excerpt: "A dirty cold-open exchange about what can happen while Jay is unconscious gives the show its first unmistakable WWAM warning label." },
      { at: 190, end: 208, category: "THE ROOM BREAKS", label: "THE THREE-MINUTE DRY RUN BECOMES THE REAL SHOW", excerpt: "The broadcast finally starts after a failed warm-up, a spider story, and an admission that the room is already behind schedule." },
      { at: 260, end: 278, category: "THE ROOM BREAKS", label: "JAY'S BROKEN CAMERA GETS A MOOD RATING", excerpt: "While Jay's camera fights for its life, Mike compares the face on screen to his own internal state." },
      { at: 680, end: 688, category: "THE ROOM BREAKS", label: "THE COMPUTER RESTARTS LIKE A THIRD HOST", excerpt: "A restart becomes part of the show's plot instead of an interruption." },
      { at: 1337, end: 1357, category: "WWAM UP IN YA", label: "PUT UP A PICTURE OF JAY SO THE ROOM FEELS SAFE", excerpt: "The camera problem turns into a filthy fake-safety request before the physical-media argument gets serious." },
      { at: 1513, end: 1530, category: "TAKE GETS NUCLEAR", label: "THE DISC IS NOT DEAD YET", excerpt: "The hosts make the case for owning a physical copy before the industry decides access is a privilege instead of a purchase." },
      { at: 1914, end: 1927, category: "FAN SIGNAL", label: "MICHAEL PARTON FIXES THE DIARRHEA PUN", excerpt: "A Michael Parton message rewards Jay's worst wordplay and becomes a tiny example of the fan room steering the show." },
      { at: 2080, end: 2088, category: "TAKE GETS NUCLEAR", label: "DOUG BRADLEY GETS DRAFTED INTO THE GAME", excerpt: "Hellraiser game hopes become a casting discussion about Doug Bradley and the other Cenobites." },
      { at: 2161, end: 2169, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE TRAILER DESERVES A BETTER TRANSITION", excerpt: "The hosts try to move on from Doug Bradley and immediately make the transition itself the target." },
      { at: 2463, end: 2479, category: "THE ROOM BREAKS", label: "PINHEAD AND THE CENOBITES NEED A STAFF MEETING", excerpt: "A lore discussion asks why the Cenobites never seem to work together, then points toward the comic-book version of the answer." },
      { at: 3044, end: 3052, category: "TAKE GETS NUCLEAR", label: "THE FIRST ONE TO SNIFF IT OUT", excerpt: "A confident prediction lands just before the bracket begins, with the room claiming detective credit for spotting the pattern." },
      { at: 3216, end: 3226, category: "TAKE GETS NUCLEAR", label: "HALLOWEEN VERSUS FAST FOOD CONNECTION", excerpt: "The one-seed round starts with Halloween, the Halloween franchise, and Fast & Furious in the same sentence." },
      { at: 3686, end: 3694, category: "TAKE GETS NUCLEAR", label: "DIE HARD 3 GETS ITS CASE IN", excerpt: "Die Hard with a Vengeance is pushed through the bracket as the action movie that can actually survive the horror room." },
      { at: 3898, end: 3905, category: "ROOM BREAK", label: "FRIDAY THE 13TH WINS 58 TO 42", excerpt: "The closer-than-expected horror vote ends with everyone acknowledging the audience was never going to be neutral." },
      { at: 4842, end: 4851, category: "WWAM UP IN YA", label: "CUJO IS TOO MUCH WHEN YOU LOVE DOGS", excerpt: "The Stephen King lane gets personal when a dog movie becomes impossible to defend emotionally." },
      { at: 5945, end: 5953, category: "TAKE GETS NUCLEAR", label: "MISSION: IMPOSSIBLE ENTERS THE PREDICTION POOL", excerpt: "The room predicts the end of a bracket round before it has finished arguing about the round itself." },
      { at: 6029, end: 6045, category: "FAN SIGNAL", label: "LEE THE MACHINE SENDS A LOOMIS WARNING", excerpt: "Lee Bowers gets thanked, then a message arrives with Loomis and a promised prank involving Challis." },
      { at: 6067, end: 6085, category: "WWAM UP IN YA", label: "JAY'S IMAGE BECOMES A GORILLAZ ALBUM COVER", excerpt: "A rough-looking camera frame is reimagined as a gas-station meth head and then a Gorillaz cover." },
      { at: 6219, end: 6227, category: "TAKE GETS NUCLEAR", label: "ROBOCOP IS PUT ON TRIAL AGAINST CHUCKY", excerpt: "The hosts announce the matchup before the room has time to prepare for the level of disrespect coming for the doll." },
      { at: 6374, end: 6397, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "CHUCKY GETS LACED WITH ANGEL DUST", excerpt: "A Robocop-versus-Chucky argument becomes a drugged-out courtroom speech about bullets, nads, and franchise physics." },
      { at: 6444, end: 6452, category: "TAKE GETS NUCLEAR", label: "EVEN CODY WOULD VOTE ROBOCOP", excerpt: "The Robocop case is framed as so obvious that even the opposing side's imagined representative would agree." },
      { at: 6680, end: 6699, category: "CHARACTER SIGNAL", label: "JASON GETS THE PERSONAL VOTE", excerpt: "The bracket pauses for a direct Jason pick, with Insidious respected but dismissed as not quite the same kind of threat." },
      { at: 6741, end: 6763, category: "WWAM UP IN YA", label: "HALLOWEEN VERSUS FRIDAY IS THE HOLY-BALLS ROUND", excerpt: "The next matchup is announced with genuine panic, then Jean-Claude Van Damme is placed opposite Stephen King." },
      { at: 7702, end: 7722, category: "TAKE GETS NUCLEAR", label: "HALLOWEEN REACHES THE ELITE EIGHT", excerpt: "The bracket goes quick, the vote is sent to the chat, and Halloween is treated like the default answer nobody should overthink." },
      { at: 8199, end: 8207, category: "THE ROOM BREAKS", label: "SCREAM BEATS JAMES BOND", excerpt: "The winner announcement turns a genre bracket into a room-wide celebration of Scream." },
      { at: 8581, end: 8595, category: "TAKE GETS NUCLEAR", label: "THE SCORECARD MAY HAVE LOST A MATCH", excerpt: "The hosts realize Scream and James Bond may have skipped a matchup and try to repair the bracket live." },
      { at: 9471, end: 9489, category: "FAN SIGNAL", label: "MICHAEL PARTON GIVES JAMES GUNN A KUDOS", excerpt: "A chat message about The Authority becomes a reminder that fan prompts can reopen a news topic the hosts had already passed." },
      { at: 9583, end: 9595, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE RANKING BECOMES A BLOOD-PRESSURE SPORT", excerpt: "A promised drag-out UFC-style ranking is introduced as a deliberate invitation to complain, whine, and keep watching." },
      { at: 10042, end: 10059, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "FAKE CHARACTERS GET PUT ON TRIAL", excerpt: "The room laughs at the idea of trying to live as fictional characters and then turns the bit back on the people doing it." },
      { at: 10106, end: 10114, category: "WWAM UP IN YA", label: "THE PUNISHER GETS THE NEXT PATREON DOOR", excerpt: "The stream quietly advertises a Thomas Jane Punisher commentary while still pretending the show is about to end." },
      { at: 10942, end: 10962, category: "TAKE GETS NUCLEAR", label: "PROFESSIONAL STREAMERS, APPARENTLY", excerpt: "A technical stumble is instantly converted into fake professional confidence before the hosts recommend the day's commentary upload." },
      { at: 11886, end: 11916, category: "CHARACTER SIGNAL", label: "CHALLIS AS LOOMIS IS A TERRIBLELY GOOD IDEA", excerpt: "The closing casting question imagines a drunk, turned-on Challis as the better Loomis and lets the bit run." },
      { at: 11891, end: 11906, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE FACEBOOK DEVIL-WORSHIPPER THREAT", excerpt: "The sign-off threatens a public Facebook denunciation, proving that the goodbye is not remotely under control." },
      { at: 11965, end: 11978, category: "FAN SIGNAL", label: "A LIGHT POLE STORY EXTENDS THE AFTERSHOW", excerpt: "A viewer's story about a car leaving a curve and hitting a light pole keeps the room going after the bracket is already over." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({
        at: 3216,
        end: 3905,
        label: "THE HORROR BRACKET",
        topic: "Halloween, Fast & Furious, and Friday the 13th",
        body: "The central bracket is the reason to stay: it gives the audience a vote, gives the hosts something to fight about, and still leaves enough room for the crowd to expose the answer they wanted all along.",
        playAt: 3216,
        playEnd: 3905,
      }),
      hated: Object.freeze({
        at: 1501,
        end: 1530,
        label: "THE PHYSICAL-MEDIA PANIC",
        topic: "companies deciding what buyers are allowed to keep",
        body: "The anger here is not abstract. The complaint is that a paid-for disc is becoming a disappearing privilege, and the hosts are not interested in pretending that is progress.",
        playAt: 1501,
        playEnd: 1530,
      }),
      wildestDetour: Object.freeze({
        at: 6029,
        end: 6085,
        label: "LOOMIS, CHALLIS & THE GORILLAZ CAMERA",
        topic: "a fan message becomes a prank plan and a visual insult",
        body: "Lee the Machine, Loomis, Challis, a planned prank, and a meth-at-the-gas-station camera comparison all arrive in one short stretch. That is the exact kind of detour the archive should make easy to replay.",
        playAt: 6029,
        playEnd: 6085,
      }),
      lastWord: Object.freeze({
        at: 11886,
        end: 11978,
        label: "THE GOODBYE THAT REFUSES TO END",
        topic: "fake Facebook threats and a light-pole story",
        body: "The bracket is finished, but the room keeps taking fan messages until the sign-off becomes its own little aftershow.",
        playAt: 11886,
        playEnd: 11978,
      }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
