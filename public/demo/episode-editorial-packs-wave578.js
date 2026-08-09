(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "M0VIoNjnoFc";
  var duration = 8359;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(420, 700, "OPENING CHAOS", "TWENTY-ONE-DOLLAR CDS, OLD MOVIE NEWS, AND THE ROOM STARTS SPENDING MONEY IT DOESN'T HAVE", "The opening is a tiny economic history lesson: CDs cost twenty-one dollars, movie news costs nothing, and the hosts immediately start treating both facts as personal betrayals."),
    H(1750, 2010, "WWAM UP IN YA", "THOR, MILEY CYRUS, AND A WRECKING-BALL JOKE THAT SHOULD HAVE STAYED IN THE CHAT", "A pop-culture tangent turns into a wrecking-ball line and the show does what it does best—take a mainstream reference, make it filthy, then move on before the punchline can apologize."),
    H(2260, 2460, "CHARACTER CANON", "LOOMIS, ROB ZOMBIE, TERRENCE STAMP, AND TERRENCE MALICK GET THROWN INTO ONE NAME-MIXUP", "The Loomis lane begins with a question about the Rob Zombie films, then swerves through Terrence Stamp and Terrence Malick. J's Loomis voice gives the confusion a character-shaped center even though the tape does not prove who performed every cue."),
    H(3000, 3180, "HORROR NEWS", "THE ONLY THING THE ROOM WANTS IS NIGHTMARE ON ELM STREET NEWS", "After all the superhero and studio talk, the hosts finally say what the horror brain has been waiting for: give us some Nightmare on Elm Street news. It is a clean, funny reminder of what this audience is actually here for."),
    H(3300, 3440, "THE ROOM BREAKS", "A MUTED BUTT-SEX QUESTION DETONATES IN THE MIDDLE OF MOVIE NEWS", "The chat asks whether Mike is talking about his first butt sex, then somebody wonders if they are muted too. It is a perfect live-room derailment: nobody planned it, everybody hears it, and the show keeps going."),
    H(3650, 3900, "HORROR LORE", "GHOSTBUSTERS AND THE LOOMIS ROUTE KEEP THE FRANCHISE CONVERSATION ALIVE", "Ghostbusters and Loomis cross paths in the middle of the broadcast. The episode is not a commentary track, but it keeps building the same character-and-franchise memory system that makes WWAM's live shows worth revisiting."),
    H(4080, 4380, "STRAIGHT TO STEVE'S ASSHOLE", "HAUNTED HOUSES FAIL THE TIDE TEST", "The strongest audio-ranked moment is a haunted-house verdict: if the attraction cannot make the tide come in correctly, why would anyone trust it with a scare? It is the most beautifully specific reason to hate an attraction in the archive."),
    H(4350, 4600, "HALLOWEEN", "MICHAEL MYERS SHOWS UP AS THE GHOST OF A FRANCHISE THAT WON'T STOP SELLING", "Michael Myers appears in the middle of the news conversation as the hosts compare horror icons, sequel fatigue, and what a character can survive once the merchandise outlives the fear."),
    H(4850, 5200, "JUSTICE LEAGUE", "THE WRITER SAYS THE ACT SABOTAGED THE NARRATIVE", "The Justice League writer conversation becomes the broadcast's serious spine. The hosts focus on the claim that studio decisions sabotaged the narrative, then ask whether a movie can be repaired after the damage is already baked into the cut."),
    H(6000, 6300, "DC / FAN PASSION", "THE SNYDER-CUT ARGUMENT TURNS PERSONAL BECAUSE PEOPLE SPENT MONEY ON IT", "The booth gets passionate about the DC conversation and the money fans spent chasing a different version of the movie. The anger is not abstract: it is about being sold one experience and then told the missing pieces never mattered."),
    H(6350, 6700, "TAKE GETS NUCLEAR", "THEY DON'T GIVE A FUCK HOW MUCH YOU SPENT—AND THAT'S THE PROBLEM", "A blunt line about studios not caring how much the audience spent lands as the episode's hard-edged thesis. Fandom is valuable enough to monetize, but apparently not valuable enough to respect."),
    H(6550, 6850, "CHARACTER / COMEDY", "LOOMIS, FREDDY, AND THE FAMILY PROBLEMS OF HORROR ICONS", "Freddy Krueger's mother and Loomis's continuing presence give the show a character-comedy lane. The hosts talk about horror icons as damaged families, then immediately make the family tree unsafe for children."),
    H(7300, 7520, "DISNEY / MOVIE NEWS", "THE DISNEY VERSION OF A MOVIE GETS THE SAME SIDE-EYE AS THE DC CUT", "A Disney version enters the conversation and the hosts ask what gets lost when a studio makes a safer, smoother product. The point is not that every family-friendly movie fails; it is that this room can smell the sanding."),
    H(7750, 7950, "TAKE GETS NUCLEAR", "AVATAR'S STYLE IS ENOUGH TO MAKE SOMEONE REJECT THE WHOLE DAMN MOVIE", "Avatar becomes a style argument. The hosts admit the visuals are the point while still refusing to pretend that visual scale automatically equals emotional connection."),
    H(8170, 8320, "MARVEL", "UNCLE BEN AND SPIDER-MAN ARE THE EMOTIONAL TEST THE ROOM KEEPS RETURNING TO", "The Uncle Ben/Spider-Man reference gives the superhero conversation a human measuring stick. Big universes still need one small loss that the audience can feel."),
    H(8270, 8359, "LAST CALL", "THE CHAT SAYS GOOD NIGHT, EVEN IF THE SENTENCE DOESN'T COME OUT RIGHT", "The close is a fan goodbye that arrives through a half-heard line—'I don't know what the fuck you said, but I hope you have a good night.' It is awkward, affectionate, and completely live."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 420, end: 2260, label: "THE ROOM STARTS WITH MONEY AND ENDS UP IN THE MARVEL GUTTER", body: "Twenty-one-dollar CDs, a wrecking-ball joke, and the general economics of being a movie fan set the tone. The episode does not march toward its Justice League topic; it wanders there through the exact kind of filthy pop-culture side roads that make the live archive useful.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 2260, end: 4850, label: "LOOMIS, FREDDY, NIGHTMARE NEWS, AND ONE MUTED BUTT-SEX QUESTION", body: "The Loomis/Rob Zombie/Terrence name mix-up, a demand for Nightmare on Elm Street news, Ghostbusters, and the haunted-house tide test make the middle of the show a character-and-horror showcase. The chat can derail the broadcast in one sentence, and the booth is better for it.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 4850, end: 6850, label: "THE JUSTICE LEAGUE WRITER PUTS THE DAMAGE ON THE TABLE", body: "The writer's claim that an act sabotaged the narrative becomes the central argument. The hosts connect the cut, fan money, studio indifference, and the demand for a different version into one emotional through-line: audiences can forgive a bad movie more easily than they forgive being told the missing movie never mattered.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 6850, end: 8170, label: "DISNEY, AVATAR, AND THE SUPERHERO FAMILY TREE", body: "The room returns to horror icons, then compares Disney smoothing to DC smoothing, argues about Avatar's visual style, and lands on Uncle Ben as the human test for Spider-Man. The genre talk keeps circling back to the same question: where did the feeling go?", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 8170, end: 8359, label: "THE GOODNIGHT THAT SOUNDS LIKE A BROKEN CAPTION", body: "A final Spider-Man reference gives way to an affectionate, garbled goodnight. After two hours of studio sabotage, horror-family trauma, and filthy detours, the tape closes by sounding exactly like a live room shutting down.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h19m19s Justice League Writer GOES OFF + More Movie News livestream; local audio, canonical captions, and Whisper ledger checked across the CD-price opener, Wrecking Ball detour, Loomis/Rob Zombie/Terrence Stamp-Terrence Malick confusion, Nightmare on Elm Street plea, muted butt-sex question, Ghostbusters/Michael Myers lanes, haunted-house tide verdict, Justice League writer narrative-sabotage claim, fan-spending and studio-indifference argument, Freddy/Loomis family lane, Disney and Avatar takes, Uncle Ben/Spider-Man test, and garbled goodnight",
    evidence: Object.freeze({
      duration: 8359,
      captionWords: 30923,
      captionEvents: 4823,
      captionSpanSeconds: 8360.24,
      captionDurationCoveragePercent: 100,
      captionSha256: "71FBE99C4EA803A558AC4A5DEC1A6F5CA72490A913F609EC287B6EDA8B2B82F1",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "4B5FFA7BEE1A92F410C45C2893929F7880A36C491DDF65DD51685D0C2FC703C2",
      asrSegmentCount: 410,
      asrSha256: "sha256:5CD3CA59C2F0D6F50F80AE7F5D3DB0DF5D35B6342A7BCC44461C4D18BC9F813D",
      asrCoverageStartSeconds: 158,
      asrCoverageEndSeconds: 8297.84,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "JUSTICE LEAGUE WRITER GOES OFF // MORE MOVIE NEWS",
    badge: "FULL SHOW WIKI // NARRATIVE SABOTAGE, LOOMIS, FREDDY, AND THE TIDE TEST",
    headline: "THE JUSTICE LEAGUE WRITER SAYS THE STORY WAS SABOTAGED, THEN LOOMIS FAILS THE TIDE TEST",
    deck: "A full-audio WWAM room about studio damage, fan money, Nightmare news, a Loomis identity crisis, a muted butt-sex question, Avatar's style, Uncle Ben, and the most specific haunted-house complaint in the archive.",
    overview: "The April 10 broadcast has a serious spine hiding inside a very unserious room. It starts with the price of CDs and a Wrecking Ball joke, swerves through a Loomis/Rob Zombie/Terrence Stamp/Terrence Malick name collision, asks for Nightmare on Elm Street news, and pauses for a muted butt-sex question before the haunted-house tide test sends the episode straight to Steve's Asshole. Then the Justice League writer conversation takes over: a claim that studio decisions sabotaged the narrative becomes a discussion about cuts, fan money, and why audiences can forgive a bad movie more easily than they forgive being told the missing movie never mattered. Freddy's family problems, Michael Myers, Disney's safer version of a movie, Avatar's visual style, and Uncle Ben's emotional test keep the genre map wide. The final goodnight is half-heard and affectionate. Local audio and aligned ASR support every route; playback remains the authority.",
    topics: Object.freeze(["Justice League", "Superman", "Batman", "DC", "The Snyder Cut", "Dr. Loomis", "Freddy Krueger", "Nightmare on Elm Street", "Michael Myers", "Ghostbusters", "Avatar", "Uncle Ben", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 4080, end: 4380, label: "THE HAUNTED-HOUSE TIDE TEST", topic: "Straight to Steve's Asshole", body: "Play the room's cleanest comedic verdict: the attraction has to make the tide come in correctly or it has already lost.", playAt: 4080, playEnd: 4380 }),
      hated: Object.freeze({ at: 6000, end: 6700, label: "THE STUDIO DOESN'T CARE WHAT FANS SPENT", topic: "Justice League", body: "Play the Justice League lane for the episode's most sincerely furious take about money, trust, and studio indifference.", playAt: 6000, playEnd: 6700 }),
      wildestDetour: Object.freeze({ at: 3300, end: 3440, label: "THE MUTED BUTT-SEX QUESTION", topic: "WWAM Up in Ya", body: "Play the chat derailment for a genuinely live moment that no polished segment producer could have invented.", playAt: 3300, playEnd: 3440 }),
      lastWord: Object.freeze({ at: 2260, end: 2460, label: "LOOMIS MEETS TERRENCE STAMP", topic: "Character canon", body: "Play the name-mixup lane for the most portable Dr. Loomis receipt in the episode.", playAt: 2260, playEnd: 2460 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([]),
      note: "The local ledger marks three fan-signal windows, but it does not make a fan name reliable enough to publish. The FAM lane remains playable and explicitly unnamed rather than guessed. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
