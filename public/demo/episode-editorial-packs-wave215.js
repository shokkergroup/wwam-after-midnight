(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "5rM39QsTBk4";
  var duration = 6348;
  var H = function (at, end, category, label, excerpt, characters) {
    var item = {
      at: Math.max(0, Math.round(at)),
      end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))),
      category: category,
      label: label,
      excerpt: excerpt,
      sourceId: sourceId,
      evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority"
    };
    if (characters) item.characters = characters;
    return item;
  };

  /* July 8/9, 2024: Mike's solo Maxxxine spoiler room. The movie becomes a
     Heaven's Gate crime story, a Night Stalker correction, a Scarefest memory,
     a Mark Wahlberg trailer roast, and a love letter to the FAM. */
  var highlights = [
    H(0,140,"ROOM BREAK","THE SOLO MAXXXINE CHECK-IN","Mike tests the microphone, warns the room that the movie will be spoiled to the last frame, and turns a bad haircut and a popcorn-stained shirt into the opening monologue."),
    H(140,280,"FAM SIGNAL","THE ROLL CALL IS THE SAFETY NET","Angel, Hydro, Jonathan, Robin, Iron Wolf, Clinton, Michael Parton, and the early room get named before the review begins. The show is solo, but the archive is not."),
    H(280,420,"LORE DOOR","CHARLES LEE RAY AS A SERIAL-KILLER PREQUEL","Mike recalls asking a Child's Play producer for a human-scale Charles Lee Ray prequel and hearing that the studio had considered a similar idea."),
    H(420,560,"FILM READ","HELLBOY GETS A HESITANT HORROR PASS","The Crooked Man trailer looks cheap, but the horror direction and creator involvement keep hope alive. The verdict is cautious, not dismissive."),
    H(560,700,"TRAILER ROOM","AGATHA IS A SPIN-OFF TOO FAR","The room asks whether a Marvel viewer needs another seven layers of backstory before watching Agatha. The answer is a tired maybe, which is its own review."),
    H(700,840,"FILM READ","THE NIGHT STALKER MIX-UP","Mike tries to identify Maxine's alley attacker, calls him the wrong famous killer, and lets the chat correct him in real time. The correction is the scene's best joke."),
    H(840,980,"SOUNDBYTE / REPLAY","THE BEANIE-WEENIE STOMP","The movie's nastiest practical death gets a playful replay. Public copy describes the shock and the smoke-filled Batman-1989 look without reproducing the graphic anatomy."),
    H(980,1120,"LORE DOOR","OLD MTV IS A HORROR SHOW OF ITS OWN","Room Raiders, Next, Jackass, and MXC become a nostalgia lane about the reality-TV era when humiliation was scheduled television instead of an algorithm."),
    H(1120,1260,"FILM READ","MAXINE'S SUPPORTING CAST IS STACKED","Mike finally identifies the friend who disappears early and praises the film's small roles, detectives, and veteran performers instead of only talking about the central trio."),
    H(1260,1400,"CHARACTER PERFORMANCE","CHALLIS DELIVERS A BIRTHDAY MEDICAL EXAM","DJ's birthday superchat summons Dr. Challis. He gives a wildly irresponsible fake diagnosis, so the archive keeps the character cadence and removes the dangerous specifics.",["Dr. Challis"]),
    H(1400,1540,"CHARACTER PERFORMANCE","MARK WAHLBERG CRASHES THE BIRTHDAY","A second character voice turns the birthday wish into a celebrity impersonation. The bit is catalogued as parody and the unsafe real-world claims are left out.",["Mark Wahlberg"]),
    H(1540,1680,"FAM SIGNAL","THE GUN-GLASS SUPERCHAT","A fan's joke gift becomes a recurring prop and a reminder that live donations can change the shape of the review without becoming the whole show."),
    H(1680,1820,"TAKE GETS NUCLEAR","MAXXXINE WAS MARKETED AS A SUPER-SLASHER","Mike thinks the backlash comes from a mismatch between the marketing promise and the film's actual blend of crime movie, horror, and Hollywood history."),
    H(1820,1960,"FILM READ","KEVIN BACON'S DETECTIVE IS A PERFECT SLEAZEBALL","The private investigator gets praise for being grimy, theatrical, and visibly delighted to play a man the audience wants to see lose."),
    H(1960,2100,"STRAIGHT TO STEVE'S ASSHOLE","THE CAR-COMPACTOR PLOT HOLE","Mike loves the death scene but cannot stop asking why Maxine and her agent do not question the detective before removing their best lead from the board."),
    H(2100,2240,"FILM READ","THE FACE-MOLD PANIC ATTACK WORKS","Maxine's flashback during the effects makeup scene gives the movie the vulnerability Mike thinks a supposedly unstoppable heroine needs."),
    H(2240,2380,"LORE DOOR","PSYCHO, THE OLD LADY, AND A SET THAT FEELS HAUNTED","The Psycho house, the window image, and the film's callbacks are discussed as emotional architecture rather than a checklist of references."),
    H(2380,2520,"FILM READ","THE DAD REVEAL IS NOT THE POINT","Mike understands why some viewers felt let down by the identity of the killer, but the reveal works for him because the final act is about the cult, the performance, and Maxine's choice."),
    H(2520,2660,"TAKE GETS NUCLEAR","HEAVEN'S GATE TURNS THE LAST ACT SIDEWAYS","A strange evangelical father, staged healing, and a Hollywood-hating cult give Maxxxine a final-act flavor that is more crime thriller than straight slasher—and Mike loves the nerve of it."),
    H(2660,2800,"FAM SIGNAL","BAD MOON WINS THE WEREWOLF QUESTION","Asked for a favorite werewolf design, Mike recommends Bad Moon, then gives American Werewolf and Fright Night their proper flowers."),
    H(2800,2940,"COMMUNITY DOOR","THE BUZZ BALLS INCIDENT AT SCAREFEST","A bartender places sugary drinks on the table, the room assumes they are free, and a manager eventually has to adjudicate the most preventable bar bill in convention history."),
    H(2940,3080,"CHARACTER PERFORMANCE","CAT 42 GETS THE CHALLIS TREATMENT","A fan asks Dr. Challis to greet a cat named 42. The doctor gets confused about whether the patient is an animal, which is the only medical distinction he manages all night.",["Dr. Challis"]),
    H(3080,3220,"STRAIGHT TO STEVE'S ASSHOLE","THE THEATER HEARTBURN INCIDENT","Mike describes watching the film at nine in the morning while fighting heartburn and trying not to ruin the theater for a stranger. The archive keeps the embarrassment, not the bodily play-by-play."),
    H(3220,3360,"VERDICT","MAXXXINE GETS AN EIGHT","The final score lands at 8/10. The reason is not a perfect plot; it is a stylish, entertaining movie that trusts its own odd mixture instead of chasing a single genre label."),
    H(3360,3500,"FILM READ","THE THIRD ACT'S COP-MOVIE SWERVE","The Hollywood Hills chase and police arrival surprise Mike. He thinks the movie earns the action detour because it refuses to finish as a safe cover version of another slasher."),
    H(3500,3640,"SOUNDBYTE / REPLAY","THE CHAT FIGHTS OVER THE ENDING","Members argue that the finale is a letdown while Mike explains why its tone, Heaven's Gate imagery, and Maxine's agency work for him."),
    H(3640,3780,"FAM SIGNAL","A NEW MEMBER AND A DEATH-SCENE DEBATE","The chat keeps the review moving with a membership welcome and questions about which Maxxxine death is most effective. Audience memory becomes the running order."),
    H(3780,3920,"FILM READ","THE PORN-SET SCENE IS DELIBERATELY AWKWARD","Mike says the production-within-the-production scene is meant to expose the industry's ugliness, not to turn the movie into a glossy erotic detour."),
    H(3920,4060,"STRAIGHT TO STEVE'S ASSHOLE","THE AUDITION ROOM WANTS A MONOLOGUE AND A BODY","An intense acting audition is answered with an exploitative request. The show files it under Steve's Asshole because the joke is aimed at the industry's contempt, not at the performer."),
    H(4060,4200,"FILM READ","MIA GOTH'S MAXINE DOES NOT GET A FORCE FIELD","Mike likes that Maxine is tough without being invulnerable. Panic, memory, and bad decisions keep the character human enough to survive the trilogy."),
    H(4200,4340,"FILM READ","THE MOVIE'S SEXUAL PROMISE IS LESS THAN EXPECTED","The room compares Maxxxine with X and Pearl and decides the third film is less explicitly sexual because its interests are fame, violence, and the cost of being seen."),
    H(4340,4480,"NEWS REACTION","JOHN CENA'S RETIREMENT GETS THE WWE SKEPTIC TEST","Lee's superchat starts a wrestling detour. Mike respects Cena's acting and charisma but assumes WWE will eventually bring him back when the company needs the pop."),
    H(4480,4620,"LORE DOOR","THE BALD-SPOT CAMERA SHOT","The room remembers a WrestleMania camera angle that made Cena's hairline the story, then argues that Batista and Cena are among the best wrestler-to-actor translations because they can do comedy."),
    H(4620,4760,"FILM READ","TAI WEST'S FRANCHISE HAS BECOME A REAL BRAND","Mike notices that X, Pearl, and Maxxxine have grown from an underdog experiment into a franchise people now expect to continue."),
    H(4760,4900,"LORE DOOR","TINA FROM HALLOWEEN 5 GETS A LIFETIME BAN","A Halloween detour becomes a character prosecution. Tina's decision to abandon a vulnerable child for a date is still the most infuriating side quest in the series."),
    H(4900,5040,"COMMUNITY DOOR","YOUTUBE NOTIFICATIONS MISS THE PARTY","Mike apologizes to late arrivals and explains why Twitter, Instagram, Facebook, and the channel feed are the safer way to catch a live room."),
    H(5040,5180,"FAM SIGNAL","THE FAM CHOOSES A FOURTH FILM","The poll lands in favor of another X/Pearl/Maxxxine chapter. The trust is not blind: it comes from three films that keep taking formal risks."),
    H(5180,5320,"TRAILER ROOM","FLIGHT RISK ENTERS THE ROOM","Mike and the FAM watch the Flight Risk teaser together: bald Mark Wahlberg, a hostage plane, Mel Gibson directing, and a premise that sounds more deranged every second."),
    H(5320,5460,"SOUNDBYTE / REPLAY","THE TRAILER HAS TWO MARK WAHLBERGS","The fake pilot voice makes Mike joke that the film is a Split-style personality story where the multiple personalities are just different Mark Wahlbergs."),
    H(5460,5600,"TRAILER ROOM","MARK WAHLBERG FINALLY PLAYS THE BAD GUY","A fan points out that Flight Risk may be Wahlberg's first full villain turn since Fear. Mike calls the casting idea a possible game changer even while roasting the accent."),
    H(5600,5740,"FILM READ","BOSS LEVEL GETS A SURPRISE RECOMMENDATION","The stream detours into a sincere action recommendation. Boss Level sounds like a bad video-game title but turns out to be a sharp, rewatchable movie."),
    H(5740,5880,"TRAILER ROOM","F1 GOES TOP GUN ON THE TRACK","Brad Pitt, Joseph Kosinski, Aaron Kruger, and the cockpit footage win Mike over. The trailer makes the racing movie look like Top Gun Maverick with tire temperature."),
    H(5880,6020,"STRAIGHT TO STEVE'S ASSHOLE","THE F1 TRAILER'S GENERAL-AUDIENCE PROBLEM","Mike is sold, then asks whether a normal audience will understand the pitch quickly enough to turn an expensive racing film into a theatrical event."),
    H(6020,6160,"FILM READ","LONGLEGS BECOMES NEXT WEEK'S BET","The room votes on whether the heavily praised horror film will be overrated. Mike chooses optimism even as every cell in his body predicts a hype hangover."),
    H(6160,6300,"FAM SIGNAL","THE BEST MOVIE WEEK OF 2024","Maxxxine, Longlegs, Twisters, and Deadpool & Wolverine turn the upcoming calendar into a run of live rooms the FAM genuinely wants to attend."),
    H(6300,6348,"CLOSING READ","THE SOLO ROOM LEAVES THE LIGHT ON","Mike thanks the chat, new members, and the silent viewers, promises another stream, and closes with a sincere reminder that the room only exists because people keep showing up.")
  ];

  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; local official caption ledger and canonical audio alignment across the July 9, 2024 Maxxxine spoiler livestream",
    evidence: Object.freeze({
      duration: duration,
      captionWords: 20875,
      captionEvents: 5552,
      captionSpanSeconds: 6349.64,
      captionDurationCoveragePercent: 100.03,
      captionSha256: "10efc1c232444e7b64b7a0ec24977467f77664f14de440ba3c2521860135c60e",
      captionSourceKind: "source-local official YouTube caption ledger acquired as JSON",
      audioPass: "canonical YouTube audio + source-local caption alignment; local audio available for playback verification; playback remains the authority",
      audioSha256: "07c66e465f2fab06da8f075e70ff14c61bf03bd962b7088ece705b2884908d2b",
      asrWindowCount: 39,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "MONDAY LIVE // JULY 8, 2024",
    badge: "FULL SHOW WIKI // MAXXXINE SPOILERS, HEAVEN'S GATE, AND TRAILER CHAOS",
    headline: "MAXXXINE, THE NIGHT STALKER CORRECTION, A BUZZ BALLS DEBT, AND TWO TRAILERS THAT STOLE THE LAST HOUR",
    deck: "A solo Maxxxine spoiler room where Mia Goth's third act, Heaven's Gate imagery, the FAM, a Scarefest bar bill, and Mark Wahlberg's bald Flight Risk all get a playable receipt.",
    overview: "Mike hosts this Maxxxine spoiler party alone, which means every mistaken name, music cue, and chat correction stays in the record. He opens by asking whether the microphone works, rolls through the FAM, and immediately starts building a Child's Play prequel pitch before the movie review settles in. His Maxxxine verdict is an 8/10 built on texture rather than surprise. The alley encounter, the practical death that looks like Batman-era smoke, Kevin Bacon's gloriously grimy private detective, the face-mold panic attack, and the Psycho-house imagery all earn specific praise. The killer reveal does not bother him because the father, the staged healing, the Heaven's Gate visual language, and the sudden cop-movie chase make the last act feel like a dare instead of a standard slasher ending. The chat supplies the countercase: some wanted more horror, more erotic material, or a cleaner mystery. Mike keeps returning to the same point—Maxxxine is a crime/horror/Hollywood movie, and its refusal to pick one lane is why it works for him. The live room then expands into Bad Moon, Fright Night, Blink concert logistics, a Scarefest Buzz Balls misunderstanding, Dr. Challis birthday and cat bits, John Cena's retirement, Tina from Halloween 5, and a poll for a fourth film. The last half is a miniature trailer festival. Flight Risk becomes a Mark Wahlberg villain experiment; F1 turns into Top Gun on a racetrack; and Longlegs gets the final optimism-versus-hype poll. It is a solo show with a crowd-shaped heartbeat.",
    topics: Object.freeze(["Maxxxine", "Mia Goth", "Ti West", "Kevin Bacon", "Heaven's Gate", "Psycho", "Dr. Challis", "Halloween 5", "John Cena", "Flight Risk", "F1", "Longlegs", "The FAM", "Scarefest"]),
    story: Object.freeze([
      { at: 0, end: 840, label: "THE SOLO ROOM AND THE NIGHT STALKER", body: "A mic check, a FAM roll call, a Child's Play prequel pitch, and one spectacularly wrong killer name turn the opening into its own comedy short." },
      { at: 840, end: 1680, label: "MAXINE'S TEXTURE WINS", body: "Practical gore, a stacked supporting cast, a birthday Challis performance, and marketing expectations establish what the movie is—and what it is not." },
      { at: 1680, end: 2520, label: "KEVIN BACON AND THE CAR COMPACTOR", body: "The private detective, the chase, and the plot hole of killing the best lead become the room's most forceful craft argument." },
      { at: 2520, end: 3360, label: "HEAVEN'S GATE TAKES THE LAST ACT", body: "A cult father, staged healing, a Hollywood Hills chase, Bad Moon, Blink, and the Scarefest bar story move the film from slasher to live-culture collage." },
      { at: 3360, end: 4200, label: "THE EIGHT-OUT-OF-TEN CASE", body: "The final score, the chat's ending disagreement, the theater heartburn story, and Maxine's vulnerability explain why the movie's vibe matters more than its reveal." },
      { at: 4200, end: 5040, label: "WRESTLING, SEXUAL PROMISE, AND TINA'S TRIAL", body: "The room weighs the film's restraint, John Cena's retirement, wrestler-actors, Ti West's franchise future, and Tina's permanent Halloween 5 sentence." },
      { at: 5040, end: 5880, label: "THE TRAILER ROOM OPENS", body: "A fourth-film poll, Flight Risk's hostage plane, Mark Wahlberg's first villain case, Boss Level, and F1's Top Gun pitch turn the close into a second show." },
      { at: 5880, end: 6348, label: "LONGLEGS AND A THANK-YOU", body: "Mike debates hype, chooses optimism, previews the next WWAM run, and leaves the room with appreciation for members and silent viewers alike." }
    ]),
    highlights: Object.freeze(highlights),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2520, end: 2800, label: "THE HEAVEN'S GATE SWERVE", topic: "Maxxxine refuses the standard slasher finish", body: "Play from 42:00. Mike explains why the cult, staged healing, and sudden crime-thriller chase make the third act feel like a risk worth taking.", playAt: 2520, playEnd: 2800 }),
      hated: Object.freeze({ at: 1960, end: 2100, label: "THE CAR-COMPACTOR PLOT HOLE", topic: "the best lead gets removed before answering the question", body: "Play from 32:40. The death is memorable; the decision to never question the detective first is the part Mike cannot forgive.", playAt: 1960, playEnd: 2100 }),
      wildestDetour: Object.freeze({ at: 2800, end: 3080, label: "THE SCAREFEST BUZZ BALLS BILL", topic: "free drinks turn into a manager meeting", body: "Play from 46:40. A convention bar, sugary drinks, a misunderstanding, and a reluctant tab make a better story than the beverage deserved.", playAt: 2800, playEnd: 3080 }),
      lastWord: Object.freeze({ at: 5180, end: 5600, label: "FLIGHT RISK'S TWO MARK WAHLBERGS", topic: "the trailer becomes a live personality experiment", body: "Play from 1:26:20. Bald Wahlberg, a hostage plane, and a fan theory about his first full villain turn make the trailer impossible to watch normally.", playAt: 5180, playEnd: 5600 })
    })
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-08", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
