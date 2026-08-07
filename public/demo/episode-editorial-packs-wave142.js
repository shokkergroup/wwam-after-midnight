(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "qONN2sNoK2k", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* January 30, 2025: full second read of the 42:11 emergency Scream 7 room. */
  sources["qONN2sNoK2k"] = Object.freeze({
    sourceId: "qONN2sNoK2k",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; short emergency tape read end to end with audio-backed doors",
    evidence: Object.freeze({
      duration: 2531,
      captionWords: 7973,
      captionEvents: 1104,
      captionSpanSeconds: 2532.64,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:4f4de87c5b9fbcdf8e915d4f5857aa89ebc992dd1747dc0564c12936eb662f92",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:d587953a789a494eea2777b4cc18e1fb2f2f6ce6cbdab1b698f76654195f5415",
      asrWindowCount: 161,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "EMERGENCY SCREAM 7 LIVESTREAM // JANUARY 30, 2025",
    badge: "FULL SHOW WIKI // 42:11 OF STU SPECULATION, NEW NIGHTMARE SCREAM, AI VOICE CHANGERS, AND A LIVE THEORY BOARD",
    headline: "THE EMERGENCY SCREAM 7 STREAM INVENTS AN AI GHOSTFACE BEFORE THE MIC COOLS OFF",
    deck: "A rapid-response Scream room where a casting rumor becomes a voice-changer theory, a New Nightmare poll, and a conspiracy the audience builds live.",
    overview: "January 30 is the short companion piece to the Stu Lives room: a true emergency stream, assembled in minutes because Scream news refuses to arrive on a normal schedule. The microphone is barely alive, the subscribers did not get a clean notification, and Mike keeps asking whether the story is even real while the audience piles into the room. Scott Foley, Roman Bridger, Matthew Lillard, a possible twin, a possible prequel, and a possible New Nightmare Scream all get tested against the same question: what can bring old Ghostface history back without turning the movie into a retcon grenade? The most useful idea arrives from the FAM: an AI-style voice changer that lets one killer call Sidney as every Ghostface she has ever survived. The room likes it because it is contemporary, plausible, and mean in exactly the right way. The rest of the tape becomes a fast writers' room—opening kills, Roman's death, Stu and Jill, Billy's voice, fan-service backlash, and the terrible possibility of simply remaking Scream 3. It ends before the theory board can settle, which is the point. This is not a finished verdict; it is the moment the archive caught the fandom thinking out loud.",
    story: Object.freeze([
      { at: 0, end: 600, label: "THE MIC, THE NOTIFICATION, AND THE RUMOR", body: "The emergency stream is built in minutes, the microphone behaves badly, and the audience gets the Scream news before anyone has a stable explanation." },
      { at: 600, end: 1100, label: "ROMAN, STU, AND THE CASTING PUZZLE", body: "Scott Foley, Roman's history, Stu's possible return, and a fan's reminder about a Roman connection make the casting rumor feel bigger than one name." },
      { at: 1100, end: 1700, label: "NEW NIGHTMARE SCREAM AND THE AI VOICE", body: "A poll asks whether the movie should go New Nightmare, while the room discovers an AI voice-changer version of Ghostface that could wear every old killer's voice." },
      { at: 1700, end: 2200, label: "OPENING KILLS AND FAN-SERVICE WAR", body: "The FAM pitches a real Ghostface opening kill, the room argues about fan-service backlash, and the current rumor becomes a cultural time capsule." },
      { at: 2200, end: 2531, label: "THE THEORY BOARD REFUSES TO CLOSE", body: "Stu, Roman, Jill, Scream 3, and the simplest possible news-story explanation all collide before the emergency room signs off." },
    ]),
    highlights: Object.freeze([
      H(38, 46, "ROOM BREAK", "THE FASTEST LIVESTREAM EVER", "The room is assembled in minutes because Scream news arrived without asking permission, and the hosts are still checking whether the microphone works."),
      H(170, 178, "STRAIGHT TO STEVE'S ASSHOLE", "SCREAM WILL NOT RELEASE NEWS NORMALLY", "The room begs the franchise to announce news at a normal Tuesday morning hour instead of creating another emergency stream."),
      H(328, 336, "FAN SIGNAL", "HAVE FAITH IN KEVIN WILLIAMSON", "A casting rumor about Scott Foley gets tied to faith in Kevin Williamson, opening a route back to The Faculty and the writer's old projects."),
      H(560, 568, "SOUNDBYTE / REPLAY", "THE STORY IS COMING FROM INSIDE THE HOUSE", "A copyright-safe pause becomes a horror button before the room confirms that the person on screen has indeed been shot."),
      H(705, 713, "FAN SIGNAL", "MICHAEL PARTON WANTS THE REAL NEWS", "Michael Parton's message becomes a joke about the best possible Scream news, with Matthew Lillard immediately named as the true prize."),
      H(820, 828, "MAJOR TOPIC TURN", "ROMAN HAS A TWIN?", "A fan theory suggests a Roman twin and a possible connection to Sidney, Billy, or a flashback, giving the emergency board a brand-new branch."),
      H(1018, 1026, "MAJOR TOPIC TURN", "THE PREQUEL ROUTE", "A prequel explanation for Maureen's story appears, and the room admits the emergency may be useful precisely because it catches ideas before they are polished."),
      H(1236, 1244, "FAN SIGNAL", "NEW NIGHTMARE SCREAM GETS A POLL", "The room asks whether fans would accept a New Nightmare Scream, using the seventh-installment parallel to Wes Craven's seventh Nightmare film."),
      H(1452, 1460, "WWAM UP IN YA", "THE KILLER PRANK-CALLS WITH EVERY VOICE", "The best theory arrives: an AI-like voice changer lets Ghostface call Sidney using every voice that has haunted her across seven movies."),
      H(1592, 1600, "CHARACTER APPEARANCE", "R. LEE ERMEY DOES THE VOICE", "The room imagines a returning voice performer handling the Ghostface archive while one killer cycles through the franchise's dead men."),
      H(1855, 1863, "TAKE GETS NUCLEAR", "THE OPENING KILL HAS TO TOP THE LAST ONE", "The audience demands a real Ghostface opening kill instead of another fake-out, and the room agrees the new movie has to outdo its predecessor."),
      H(1992, 2000, "STRAIGHT TO STEVE'S ASSHOLE", "FILM TWITTER IS UNINVITED", "The room enjoys the fandom's theory party while sending the most abusive corners of Film Twitter to the door."),
      H(2140, 2148, "FAN SIGNAL", "THE VOICE-CHANGER THEORY WINS THE ROOM", "A second audience message lands on the same idea, making the AI voice route feel like the emergency stream's first real consensus."),
      H(2318, 2326, "TAKE GETS NUCLEAR", "BRING BACK STU, ROMAN, AND JILL AT ONCE", "A fan pitch throws multiple killers at Sidney without letting them know the others exist, and the room admits it is gloriously chaotic."),
      H(2470, 2478, "STRAIGHT TO STEVE'S ASSHOLE", "REMAKE SCREAM 3? ABSOLUTELY NOT", "The emergency board briefly considers remaking Scream 3, then throws the idea away before it can damage the room permanently."),
      H(2508, 2516, "ROOM BREAK", "THE NEWS STORY COULD BE THAT SIMPLE", "After all the conspiracies, the room remembers the simplest explanation: a casting story may just be a casting story, which is almost disappointing."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1236, end: 1600, label: "NEW NIGHTMARE AND THE AI VOICE CHANGER", topic: "the FAM finds the modern angle", body: "Play from 20:36. The New Nightmare poll becomes an AI-voice Ghostface pitch that uses every old killer as a weapon against Sidney.", playAt: 1236, playEnd: 1600 }),
      hated: Object.freeze({ at: 1855, end: 2000, label: "THE OPENING-KILL PRESSURE", topic: "Scream 7 has to earn the event", body: "Play from 30:55. The room wants a real Ghostface opening kill and sends the ugliest parts of Film Twitter away from the theory board.", playAt: 1855, playEnd: 2000 }),
      wildestDetour: Object.freeze({ at: 820, end: 1592, label: "ROMAN'S TWIN AND THE VOICE ARCHIVE", topic: "one rumor grows six branches", body: "Play from 13:40. A Roman twin, a prequel, New Nightmare, and a voice-changing killer turn a casting rumor into a full conspiracy map.", playAt: 820, playEnd: 1592 }),
      lastWord: Object.freeze({ at: 2318, end: 2516, label: "STU, ROMAN, JILL, AND THE SIMPLE EXPLANATION", topic: "the board closes without closure", body: "Play from 38:38. Multiple killers, a rejected Scream 3 remake, and the reminder that the rumor may simply be a rumor end the emergency tape.", playAt: 2318, playEnd: 2516 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
