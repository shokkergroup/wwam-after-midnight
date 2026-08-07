(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return {
      at: at,
      end: end,
      category: category,
      label: label,
      excerpt: excerpt,
      sourceId: "21hL29hicoU",
      evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority",
    };
  };

  /* April 23, 2025: a short trailer desk that was carrying far more WWAM
     texture than its old nine-receipt surface admitted. The audio pass finds
     the joke pivots; the source remains the authority for delivery and context. */
  sources["21hL29hicoU"] = Object.freeze({
    sourceId: "21hL29hicoU",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; audio-ranked windows reconciled to the visitor-facing trailer desk lanes",
    evidence: Object.freeze({
      duration: 2335,
      captionWords: 1989,
      captionEvents: 1078,
      captionSpanSeconds: 2334.5,
      captionDurationCoveragePercent: 99.98,
      captionSha256: "sha256:4ee3ac35ccb07c880e8b9941ce141c33c16ac81d851c7c3466234e6e9705f9e2",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:44c15b283506b2fb81baba892d1fca87a1e402a51a7abf57cd08a2a9b73e3e76",
      asrWindowCount: 19,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // APRIL 23, 2025",
    badge: "FULL SHOW WIKI // 38:55 OF PREDATOR, TRAILER COURT, CHAT HELP, AND A BOWEL-EMERGENCY SIGN-OFF",
    headline: "PREDATOR BADLANDS GETS A TRAILER COURT, A FAKE-REACTION CONFESSION, AND THE MOST STRESSFUL GOODNIGHT",
    deck: "A compact trailer desk that keeps swerving from Predator teeth and CGI to Fireball, gender reveals, fan money, and the sudden realization that somebody has needed to use the bathroom for twenty minutes.",
    overview: "This is a short WWAM trailer desk, but it is not a thin one. The opening is already off the rails: a bean-burrito economist, a question about whether the bad guys should stay bad, and a Super Chat that punctures the room's theory about why people donate. The stream then admits the quiet part out loud—fake-reacting for views—before returning to Predator: Badlands and the larger question of what makes a franchise trailer feel alive. The hosts are excited by the creature and the world, wary of computer-generated work, and especially interested in whether the next Predator can keep its teeth practical instead of sanding every sharp edge into digital mush. A T-Rex, a chair that is definitely not a fart, a bizarre gender-reveal memory, an NBA-logo detour, and an argument about being cornered turn the trailer desk into a miniature FAM room. The last minutes do not pretend to be polished: the hosts need the audience's help, thank Tim and Lee by name, and nearly lose the battle with an increasingly urgent bathroom situation. It is a 38-minute source with a clean beginning, a Predator middle, and a very human WWAM exit.",
    story: Object.freeze([
      { at: 0, end: 430, label: "THE ECONOMIST AND THE SUPER CHAT THEORY", body: "At the top, leftover-food economics, a blunt villain-versus-antihero argument, and a fan interruption blow up the idea that every Super Chat arrives after a few drinks." },
      { at: 430, end: 820, label: "FAKE REACTIONS, REAL TRAILER NERVES", body: "Fireball stories and the fake-reaction confession become the first comic spine, while the hosts admit that even a quick trailer desk still has to earn its reactions." },
      { at: 820, end: 1230, label: "PREDATOR GETS A BODY CHECK", body: "The Badlands conversation moves through a suspicious chair noise, a creature comparison, Jason-style scholarship jokes, and a warning that digital effects can make a big creature feel weightless." },
      { at: 1230, end: 1640, label: "THE WORLD GETS WEIRDER THAN THE TRAILER", body: "A tree twist, a gender reveal, a bizarre object, an NBA logo, and the larger Predator question turn the middle of the stream into the kind of associative detour only a live WWAM desk can sustain." },
      { at: 1640, end: 2040, label: "PRACTICAL TEETH OR NOTHING", body: "The most useful movie argument arrives here: the hosts want Predator to put visible effort into practical teeth and creature texture, then turn a cornered conversation into a body-horror punchline." },
      { at: 2040, end: 2335, label: "THE FAM SAVES THE SIGN-OFF", body: "Lee, Tim, the chat, and an increasingly urgent bathroom problem carry the final minutes. The stream ends less like a broadcast button and more like friends trying to escape before the situation becomes an incident." },
    ]),
    highlights: Object.freeze([
      H(46, 54, "WWAM UP IN YA", "THE BEAN-BURRITO ECONOMIST", "A stale-fridge premise becomes the show's first miniature thesis: even a questionable meal can be defended like a national economic policy."),
      H(188, 196, "STRAIGHT TO STEVE'S ASSHOLE", "PREDATOR SHOULD STAY THE BAD GUY", "The room rejects the soft reboot instinct and argues that Predator works best when the antagonists are still here to collect skulls, not audition as misunderstood buddies."),
      H(326, 334, "FAN SIGNAL", "THE SUPER CHAT THEORY COLLAPSES", "A fan arrival instantly wrecks the theory that every donation is alcohol-fueled, turning a thank-you into a tiny live-room correction."),
      H(454, 462, "WWAM UP IN YA", "FIREBALL HAS CONDITIONS", "Fireball is not a lifestyle, apparently. It is a once-in-a-while emergency measure that only becomes available when the night is already making bad choices."),
      H(547, 555, "BEST MOMENT", "FAKE-REACTION CONFESSION", "The hosts joke about faking reactions to get more views, then leave the confession sitting there like a dirty fingerprint on the trailer desk."),
      H(732, 740, "DEEP DIVE", "CGI IS THE WARNING LIGHT", "The Badlands conversation keeps circling the same useful concern: a creature can be exciting on paper and still look weightless if the computer work shows through."),
      H(861, 869, "WWAM UP IN YA", "THE CHAIR IS NOT A FART", "A suspicious noise gets a full courtroom defense from the chair, because no WWAM trailer reaction is allowed to pass without a butt-related mistrial."),
      H(942, 950, "ROOM BREAK", "YOU LOST THE SCHOLARSHIP", "A familiar action-movie line gets dragged into a Jason/Pest riff, turning a quick reference into the room's most recognizable character-shaped detour."),
      H(1204, 1212, "TAKE GETS NUCLEAR", "THE TREE TWIST GOES SIDEWAYS", "A sudden tree-story turn is treated as the kind of left-field reveal that makes a normal trailer conversation sound like it has wandered into a different movie."),
      H(1288, 1296, "BEST MOMENT", "THE WEIRDEST GENDER REVEAL", "The hosts remember a gender-reveal situation so strange it becomes its own genre, a perfect example of the real-life detours that make this short show feel lived-in."),
      H(1430, 1438, "WWAM UP IN YA", "THE MICHAEL JORDAN LOGO DETOUR", "A close look at a shirt or image blows the Predator desk into a basketball-logo tangent, proving the room can leave a monster movie for the NBA in one breath."),
      H(1579, 1587, "DEEP DIVE", "PREDATOR NEEDS ITS TEETH", "The franchise argument gets specific: the hosts want the next creature to have a physical identity, not a generic digital mouth that could belong to any monster."),
      H(1719, 1727, "TAKE GETS NUCLEAR", "PRACTICAL TEETH OR BUST", "The sharpest trailer note is also the simplest—if the production can build the teeth practically, the hosts want it to stop hiding behind computer shortcuts."),
      H(1878, 1886, "ROOM BREAK", "DON'T BACK ME INTO A CORNER", "A conversational pressure point turns into a boundary-setting bit, with the room acting like a live debate has become a hostage negotiation."),
      H(1990, 1998, "WWAM UP IN YA", "THE BUTTHOLE EMOTION TEST", "Movie fear gets translated into a bodily stress test, because the WWAM scale of emotional intensity apparently runs through the lower digestive tract."),
      H(2056, 2064, "FAN SIGNAL", "LEE GETS A WIENER-COURT WARNING", "A Lee shout-out takes the most direct possible route through the chat, turning gratitude into a crude mock-legal order that belongs in the FAM archive."),
      H(2177, 2185, "STRAIGHT TO STEVE'S ASSHOLE", "WE NEEDED THE CHAT'S HELP", "The hosts admit the live room is doing real work: without the audience, this quick desk would not have found its way through the trailer, the jokes, or the ending."),
      H(2257, 2265, "STRAIGHT TO STEVE'S ASSHOLE", "THE TWENTY-MINUTE BATHROOM EMERGENCY", "The sign-off becomes a ticking-clock story when somebody admits the bathroom problem has been waiting long enough to become a medical subplot."),
      H(2314, 2322, "FAN SIGNAL", "TIM AND LEE GET THE LAST THANK-YOU", "The final receipt belongs to the FAM: Tim, Lee, and everybody who showed up get named as the reason this little trailer desk made it to the finish line."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1579, end: 1727, label: "PREDATOR NEEDS A REAL MOUTH", topic: "practical creature work still matters", body: "Play from 26:19. The hosts' strongest movie note is specific: give the creature physical teeth and texture instead of letting a digital mouth do all the work.", playAt: 1579, playEnd: 1727 }),
      hated: Object.freeze({ at: 732, end: 800, label: "THE CGI WARNING LIGHT", topic: "when the trailer starts looking weightless", body: "Play from 12:12. The room's concern is not that Predator has effects; it is that visible computer work can drain the creature of the physical danger the franchise needs.", playAt: 732, playEnd: 800 }),
      wildestDetour: Object.freeze({ at: 1288, end: 1438, label: "THE GENDER-REVEAL-TO-NBA DETOUR", topic: "a normal trailer desk takes a hard left", body: "Play from 21:28. A bizarre gender-reveal memory and a Michael Jordan logo send the conversation so far away from Badlands that the detour becomes the point.", playAt: 1288, playEnd: 1438 }),
      lastWord: Object.freeze({ at: 2177, end: 2322, label: "THE BATHROOM EMERGENCY GOODNIGHT", topic: "the FAM gets the hosts over the line", body: "Play from 36:17. The chat is thanked, Tim and Lee get their flowers, and somebody tries to end the show before a twenty-minute bathroom problem becomes a full incident report.", playAt: 2177, playEnd: 2322 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-07",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
