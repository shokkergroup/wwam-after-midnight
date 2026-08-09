(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "ltQ3b_93Bgk";
  var duration = 10017;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(420, 620, "OPENING CHAOS", "THE WORDS ARE STRONG IN THE AIR AND SOMEBODY NEEDS TO WIPE THE LIES OFF THEIR LIPS", "The stream starts with a bathroom-adjacent accusation about strong smells and lies on lips. It is an opening that announces the night's rules: action heroes can wait; the room has bodily grievances to air first."),
    H(1000, 1100, "FAM RECEIPT", "DAVID MEAGER BRINGS THE FIRST SUPER CHAT AND THE TOURNAMENT GETS FUNDING", "David Meager's Super Chat lands before the bracket really starts. The receipt is kept as a playable fan beat without guessing at an amount or turning 'a big one' into a number."),
    H(1200, 1450, "ACTION HEROES VS HORROR VILLAINS", "RAMBO VERSUS JASON: NOTHING IS OVER, EXCEPT MAYBE THE LOGIC", "The first matchup is Rambo against Jason Voorhees. The room leans into the impossible math—Part Three Jason, Part Two Rambo—and lets the audience vote on which unstoppable body survives the collision."),
    H(1680, 1980, "CHARACTER SIGNAL", "CHUCKY CAN'T KILL A FIVE-YEAR-OLD, THEN THE ROOM TELLS HIM TO SHUT THE FUCK UP", "Chucky's size and limitations become the joke. The hosts argue whether a killer doll can actually handle a child, then the character lane collapses into a blunt command to stop talking."),
    H(1700, 1810, "THE ROOM BREAKS", "THE WORST YODA OF J'S LIFE SHOWS UP IN THE ACTION BRACKET", "A Yoda impression is judged in real time and immediately loses. The failure is the bit: the room is happy to document a performance that should never be attempted again."),
    H(3300, 3530, "FAM / MOVIE LORE", "JAMIE WADMAN ASKS FOR MOVIE-LOCATION VIDEOS WHILE THE ROOM REMEMBERS LIVING COLOR", "Jamie Wadman asks whether the channel would make movie-location videos. The question opens a useful production lane, then the room detours through older TV and the feeling that they do not make entertainment like they used to."),
    H(3880, 4080, "STRAIGHT TO STEVE'S ASSHOLE", "THE 'I SUCK' CONFESSION AND A FRIDAY-NIGHT STORY GET WAY TOO HONEST", "A late-work story turns into a self-deprecating confession, then the hosts start debating whether anyone can actually fool a kidder. It is a perfect Steve's Asshole receipt because the take is aimed inward first."),
    H(4320, 4520, "FAM / OPEN MIC", "THE CHAT ASKS FOR A SECRET NUMBER AND THE ROOM REFUSES TO PRETEND IT IS MAGIC", "The hosts are asked to guess a number if they are really themselves. The answer is not a trick; it is a small demonstration of how the live show keeps its feet on the floor while the chat tries to summon a séance."),
    H(4900, 5120, "ACTION HEROES VS HORROR VILLAINS", "ALIEN JOINS THE BRACKET AND MUSIC MAN MAKES THE WRONG KIND OF ARGUMENT", "Alien enters the action-versus-horror conversation through a viewer's comment. The hosts use it to ask whether survival skill, technology, or pure monster biology matters more than the hero's charisma."),
    H(5000, 5350, "CHARACTER SIGNAL", "INDIANA JONES COULD TAKE DOWN FREDDY KRUEGER—APPARENTLY", "The battle-royale lane proposes Indiana Jones against Freddy. The argument works because Indiana Jones has no supernatural powers and still sounds like the kind of man the room would send into a nightmare with a whip and a bad attitude."),
    H(5480, 5750, "HORROR LORE", "FREDDY'S TEENAGERS, JASON'S BODY COUNT, AND THE PRODUCT OF THEIR TIME", "The hosts compare horror villains as products of their eras. Freddy's teenagers, Jason's physical threat, and the changing rules of a franchise all become part of the question: is the villain still scary, or just historically recognizable?"),
    H(6000, 6190, "ACTION HEROES VS HORROR VILLAINS", "THE BAD GUYS CAN BE SMELLED FROM DOWNWIND, AND THE HERO STILL SAVES THE DAY", "One action-hero story gives the hero a ridiculous superpower—he can smell the bad guys coming from downwind. The room accepts it because action movies have never required permission from physics."),
    H(6100, 6400, "ACTION HEROES VS HORROR VILLAINS", "COMMANDO TAKES ON A GUY WHO LITERALLY CAN'T FUCKING DIE", "Commando gets measured against an opponent who cannot die. The hosts treat the matchup as a question of escalation rather than realism: if the hero cannot win, can he at least make the villain regret showing up?"),
    H(6200, 6440, "FAM RECEIPT", "COURTNEY PITCHES RAMBO VERSUS WARNER BROS. EXECUTIVES", "Courtney's Rambo-versus-Warner-Bros.-executives pitch turns the bracket inward. The real villain is no longer a mask or a monster; it is the studio meeting where the franchise gets softened into a product."),
    H(6500, 6720, "CHARACTER CANON", "THE LOOMIS RECEIPT IS A WORKDAY PLAYBACK PROMISE", "A viewer says they cannot wait to listen back to the stream at work tomorrow, and the caption lane catches Loomis nearby. The moment matters because the character archive is not just for first-time viewers; it is built for repeat listening."),
    H(6550, 6760, "WWAM UP IN YA", "STAPLES DOESN'T JUST SELL STAPLES, WHICH SOMEHOW NEEDS EXPLAINING", "The show pauses to explain that Staples sells more than staples. It is a tiny retail fact treated like a revelation, the sort of low-stakes Up in Ya detour that makes the long tournament feel lived-in."),
    H(7000, 7310, "ACTION HEROES VS HORROR VILLAINS", "PENNYWISE VERSUS THE YOUNG KARATE KID: CHILDREN'S MOVIES GET A BODY COUNT", "Pennywise is matched against the young kids from the '80s Karate Kid movies. The hosts ask whether skill, teamwork, and a tournament speech can survive an opponent that weaponizes fear."),
    H(7900, 8100, "FAM RECEIPT", "CHASE BAKER'S TWINS HAVE A BASEBALL GAME AND THE TOURNAMENT PAUSES FOR REAL LIFE", "Chase Baker mentions that the youngest twins, Hunter and Penny, have their first baseball game tomorrow. The show briefly makes room for an ordinary family morning inside a debate about monsters and movie violence."),
    H(8350, 8580, "WWAM UP IN YA", "THE HORROR-BUSINESS STORY GOES THROUGH A WHORE OFFER AND A SUBWAY SIMON SHIP", "A show-business story takes a vulgar turn, then the room wanders to a Subway Simon Ship. It is not a clean narrative beat; it is the archive's proof that WWAM can move from industry talk to filthy nonsense without changing gears."),
    H(9100, 9320, "LAST CALL", "JOHNNY'S GREATEST FEAR IS LOSING HIS GIRL TO THE NEW KID", "A final fear story gives the episode a strange human button: the scariest thing is not a monster, but a new kid stealing your girl. The room knows it is ridiculous and still lets the insecurity land."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 420, end: 3300, label: "THE BRACKET OPENS WITH BODY ODOR AND RAMBO VERSUS JASON", body: "A bathroom accusation, David Meager's Super Chat, and a Part Three Jason versus Part Two Rambo vote establish the show's method. The action heroes and horror villains are treated as equal pieces of mythology, even when the logic is held together with duct tape and movie quotes.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 3300, end: 4900, label: "THE FAM WANTS LOCATION VIDEOS AND THE ROOM FAILS AT YODA", body: "Jamie Wadman's movie-location question, Living Color nostalgia, a failed Yoda, a Friday-night self-own, and a number-guessing prompt turn the bracket into a community room. The chat is not decoration; it creates the episode's texture and keeps the hosts honest.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 4900, end: 6500, label: "ALIEN, INDIANA JONES, FREDDY, AND THE BAD GUYS DOWNWIND", body: "Alien, Indiana Jones versus Freddy, the products-of-their-time conversation, a hero who smells villains from downwind, and Commando against an immortal opponent make the middle act a catalog of impossible action-movie rules. Courtney's Rambo-versus-Warner-Bros.-executives pitch reveals the real villain: franchise management.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 6500, end: 7900, label: "LOOMIS, STAPLES, AND PENNYWISE VERSUS THE KARATE KIDS", body: "The Loomis lane becomes a repeat-listening promise, Staples becomes a retail revelation, and Pennywise gets matched with the young Karate Kid team. The show keeps asking the same question in different costumes: what counts as a hero when the villain cheats?", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 7900, end: 10017, label: "BASEBALL, SHOW-BUSINESS FILTH, AND JOHNNY'S ACTUAL NIGHTMARE", body: "Chase Baker's twins and their baseball game pull real life into the room, then a vulgar show-business story, Subway Simon Ship, and Johnny's fear of losing his girl to a new kid carry the tournament to a messy, human close. The monsters were never the only threat in this episode.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h46m57s Action Heroes vs Horror Villains ranking show; local audio, canonical captions, and Whisper ledger checked across the opening smell-and-lies bit, David Meager Super Chat, Rambo versus Jason vote, Chucky and Yoda detours, Jamie Wadman location-video question, Alien, Indiana Jones versus Freddy, villain-era comparison, downwind action-hero logic, Commando versus an immortal opponent, Courtney's Rambo versus Warner Bros. executives pitch, Loomis repeat-listening receipt, Staples detour, Pennywise versus Karate Kid, Chase Baker twins/baseball note, show-business/Subway Simon Ship story, and Johnny's final fear",
    evidence: Object.freeze({
      duration: 10017,
      captionWords: 32737,
      captionEvents: 5198,
      captionSpanSeconds: 10019.279,
      captionDurationCoveragePercent: 100,
      captionSha256: "0BA95B85F739910A1E9C17229CB38D6E912A3EDD26ABC047B4065953FEF65E53",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "19A6015B1BB7DE241E06836BFF2DA8F3A448484262DA8DE25368242A51E4F879",
      asrSegmentCount: 557,
      asrSha256: "sha256:E21C456844113F1574F6C8E328A244DF6AD1999081146A4009464A50245EF716",
      asrCoverageStartSeconds: 451,
      asrCoverageEndSeconds: 9883.02,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "ACTION HEROES VS HORROR VILLAINS",
    badge: "FULL SHOW WIKI // RAMBO, JASON, FREDDY, CHUCKY, ALIEN, AND THE STUDIO EXECUTIVE BOSS FIGHT",
    headline: "RAMBO FIGHTS JASON, INDIANA JONES FIGHTS FREDDY, AND WARNER BROS. GETS PUT IN THE BRACKET",
    deck: "A full-audio tournament where movie physics are optional: Rambo versus Jason, Chucky versus a five-year-old, Indiana Jones versus Freddy, Commando versus an immortal, Pennywise versus the Karate Kids, and a FAM that keeps dragging real life into the ring.",
    overview: "Action Heroes vs Horror Villains is a ranking night built from impossible math and very specific opinions. It opens with smells and lies on lips, takes David Meager's Super Chat, and sends Part Two Rambo against Part Three Jason. Chucky cannot kill a five-year-old, Yoda fails publicly, Jamie Wadman asks for movie-location videos, and Alien enters the bracket before Indiana Jones is sent after Freddy Krueger. The hosts compare villains as products of their eras, let an action hero smell bad guys from downwind, and put Commando against a man who cannot die. Courtney's Rambo-versus-Warner-Bros.-executives pitch reveals the show's real villain: the studio meeting that turns a dangerous franchise into a soft product. Loomis becomes a repeat-listening promise, Staples becomes an Up in Ya revelation, Pennywise meets the young Karate Kid team, Chase Baker brings twins and baseball into the room, and Johnny's final fear is losing his girl to the new kid. Local audio and aligned ASR support every route; playback remains the authority.",
    topics: Object.freeze(["Action Heroes vs Horror Villains", "Rambo", "Jason Voorhees", "Chucky", "Freddy Krueger", "Indiana Jones", "Alien", "Commando", "Pennywise", "Karate Kid", "Dr. Loomis", "Michael Myers", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 1200, end: 1450, label: "RAMBO VERSUS JASON", topic: "Action Heroes vs Horror Villains", body: "Play the first matchup for the cleanest statement of the night's rules: mythic hero, mythic killer, and a vote that refuses to respect physics.", playAt: 1200, playEnd: 1450 }),
      hated: Object.freeze({ at: 6200, end: 6440, label: "RAMBO VERSUS WARNER BROS. EXECUTIVES", topic: "Studio takes", body: "Play Courtney's pitch for the sharpest institutional target in the episode: the executive suite as the actual horror villain.", playAt: 6200, playEnd: 6440 }),
      wildestDetour: Object.freeze({ at: 8350, end: 8580, label: "THE SHOW-BUSINESS WHORE / SUBWAY SIMON SHIP DETOUR", topic: "WWAM Up in Ya", body: "Play the late detour for the most unrepeatable stretch of vulgar industry talk in the bracket.", playAt: 8350, playEnd: 8580 }),
      lastWord: Object.freeze({ at: 9100, end: 9320, label: "JOHNNY'S GREATEST FEAR", topic: "Horror psychology", body: "Play the close for the human fear hiding under all the monsters: the new kid taking your girl.", playAt: 9100, playEnd: 9320 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 1000, end: 1100, name: "David Meager", kind: "Super Chat", note: "Brings the first Super Chat into the action-versus-horror bracket." },
        { at: 3300, end: 3530, name: "Jamie Wadman", kind: "chat receipt", note: "Asks whether the channel would do movie-location videos." },
        { at: 6200, end: 6440, name: "Courtney", kind: "chat receipt", note: "Pitches Rambo versus Warner Bros. executives." },
        { at: 7900, end: 8100, name: "Chase Baker", kind: "chat receipt", note: "Mentions the youngest twins, Hunter and Penny, and their first baseball game." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
