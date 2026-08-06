(function (root) {
  "use strict";

  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || {
    schema: "shokker-episode-editorial-packs/v1",
    sources: {},
  };
  var sources = Object.assign({}, registry.sources || {});

  /*
   * July 16, 2026 is a full-length live tape with a local Whisper ledger and
   * canonical-audio ranking pass. The copy below is bounded to those receipts:
   * no speaker, camera, performer, or visual outcome is inferred.
   */
  var editorialIz0 = Object.freeze({
    sourceId: "iz0WFhe6LYM",
    reviewState: "full-tape-human-editorial-read",
    evidence: Object.freeze({
      duration: 12879,
      captionWords: 3219,
      captionEvents: 3219,
      captionSpanSeconds: 12877.26,
      captionDurationCoveragePercent: 99.99,
      captionSha256: "sha256:9581adbc66a9678875d41b0c8cdff6aae202e0f7375b11d750929f7a12bc93c0",
      captionSourceKind: "local-whisper-transcript",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "FREDDY IS BACK. THE ROOM IS NOT SOBER.",
    badge: "FULL SHOW WIKI // 3:34 OF FIGHTING ABOUT FREDDY",
    headline:
      "PARAMOUNT BRINGS FREDDY BACK. WWAM BRINGS THE BODY-SWEAT, DICK JOKES, AND A VERY LOUD OPINION.",
    deck:
      "A new Nightmare on Elm Street announcement turns a Wednesday stream into a referendum on what Freddy should be: vile, practical, scary, and absolutely not an MTV mascot. Then Crystal Lake gets dissected, The Odyssey and Digger trailers get put on trial, Rocky makes the room unexpectedly emotional, and the chat keeps the show alive long after the hosts claim they are leaving.",
    overview:
      "This is the kind of WWAM livestream that refuses to stay in one lane. It opens with the Paramount Nightmare news and immediately asks the question that matters to this channel: do you make Freddy funny first, or do you make him disgusting enough to scare people again? The answer keeps circling back to the original child-murderer premise, the 2010 reboot's burnt-weasel CGI, Robert Englund's particular grime, and whether the Duffer brothers can deliver practical horror instead of another corporate dream sequence. Crystal Lake gets a parallel autopsy, including the trailer's baby Jason, the possibility of a Pamela framing device, and the relief that the show does not look like a green-screen Netflix apology. Midway through, the stream becomes a trailer court: a heartfelt Rocky origin story earns real emotion, Digger offers expensive-looking climate chaos with no comprehensible plot, and the chat starts cross-examining every superhero and horror decision in sight. The back half belongs to the fans, the old White Castle mythology, Loomis/Challis, a prank-call legend, a dog that may be Satan, and Lee the Machine's final $49.99 reminder that never trust a fart. It is not tidy. It is a three-hour-and-thirty-four-minute community room with a surprisingly coherent thesis: horror icons only stay alive when the people making them are willing to be mean, specific, and a little unwell.",
    story: Object.freeze([
      {
        at: 0,
        end: 999,
        label: "PARAMOUNT DROPS FREDDY INTO A BUSH-LIME EMERGENCY",
        body:
          "The cold open confirms the Nightmare on Elm Street news, checks the audience, mourns Sam Neill, and then turns a lime beer into a hostile workplace. Before the first serious franchise argument arrives, the tape has already established its rules: news, grief, beer, and filthy improvisation share the same desk.",
      },
      {
        at: 1000,
        end: 2099,
        label: "FREDDY HAS TO BE VILE BEFORE HE GETS TO BE FUNNY",
        body:
          "The hosts argue that Freddy's child-murderer origin is not a detail to sand off for merchandise. They want the new film to make him dangerous and revolting again, not a quip machine, while the 2010 reboot becomes the cautionary tale for turning nightmare fuel into a CGI burnt-weasel problem.",
      },
      {
        at: 2100,
        end: 3299,
        label: "THE DUFFER BROTHERS WALK INTO THE DREAM",
        body:
          "Director speculation lands on the Duffer brothers and Curry Barker, with the real question being whether a team associated with Stranger Things can make Freddy feel cruel. Practical effects, make-up, and the need for a performer with Robert Englund's grime matter more to this room than a recognizable logo on the poster.",
      },
      {
        at: 3300,
        end: 4499,
        label: "CRYSTAL LAKE MAY BE HIDING JASON'S FIRST NIGHT",
        body:
          "The Crystal Lake trailer gets read as a possible Pamela story, a campfire legend, and a bridge toward an adult Jason. The baby image, the machete grip, and the decision to release the whole season become evidence in a larger argument about whether this franchise understands what its audience actually wants to see.",
      },
      {
        at: 4500,
        end: 5599,
        label: "THE STREAM TURNS INTO A TRAILER FESTIVAL",
        body:
          "The room crosses 500 viewers, promises The I Play Rocky trailer, Digger, and more, then debates whether an all-at-once release is a gift or an invitation to get drunk and miss the final episodes. The chat is not background noise here; it is the programming department.",
      },
      {
        at: 5600,
        end: 6899,
        label: "DIGGER BRINGS A BILLION-DOLLAR PLATFORM AND NO EXPLANATION",
        body:
          "Merger speculation gives way to a Digger trailer full of climate disaster, Tom Cruise energy, old-rich-guy dialogue, and a penis-size comparison that turns a serious-looking threat into a WWAM UP IN YA exhibit. The hosts like the nerve of the trailer while admitting they have no idea what the movie is about.",
      },
      {
        at: 6900,
        end: 7899,
        label: "THE CHAT OPENS MOVIE COURT",
        body:
          "Fan questions move from John Wick versus Rambo to armored Batman versus Omni-Man, then detour into the White Castle backseat story and the practical problem of ranking fictional people who can all kill each other. The stream's debate engine works because the hosts answer the actual question before making it filthy.",
      },
      {
        at: 7900,
        end: 8899,
        label: "LOOMIS AND CHALLIS GET A DINNER DATE WITH FREDDY",
        body:
          "The character lane takes over: Challis gets dragged through a training-day fantasy, Loomis is tested against Jason, and Freddy casting questions become a running argument about whether the next icon needs menace, physicality, or a spectacularly bad hot-dog joke.",
      },
      {
        at: 8900,
        end: 9999,
        label: "SUPERMAN, CALL CENTERS, AND THE PRICE OF FOLLOWING A SCRIPT",
        body:
          "A Jason-mask discussion gives way to Snyder versus Gunn, then the show unexpectedly lands on call-center work and what happens when a company would rather have an obedient script than a human response to somebody's dying parent. The tonal whiplash is extreme, but the point is sharp: corporate language is its own kind of monster.",
      },
      {
        at: 10000,
        end: 11099,
        label: "FREDDY CASTING BECOMES A COMMUNITY TIER LIST",
        body:
          "The chat supplies Michael Shannon, Jim Carrey, Ethan Hawke, Matt Smith, Evan Peters, Lee Pace, and more. The hosts separate the names that can actually carry three films from the names that merely look creepy in a screenshot, while also rewarding members who stick around for the long version of the conversation.",
      },
      {
        at: 11100,
        end: 11999,
        label: "DIMITRI AND ANDRE RETURN FROM THE PRANK-CALL WILDERNESS",
        body:
          "A fan callback revives the hotel prank-call characters Dimitri and Andre, who tried to book a room as a couple and pushed the clerk all the way to a credit-card number. The story becomes a reminder that the Patreon archive is not a side room; it is a decade of older bits waiting to contaminate the current show.",
      },
      {
        at: 12000,
        end: 12879,
        label: "THE GOODBYE IS A NEW FREDDY ARGUMENT AND A LEE-THE-MACHINE BLESSING",
        body:
          "The last stretch returns to the central thesis: do not redeem Freddy, do not turn him into a brand-safe hero, and do not confuse gender-swapping with a new idea. A female Michael/Jason/Leatherface gag, Lee the Machine's $49.99 super chat, the never-trust-a-fart warning, and a final community thank-you make the sign-off feel like an aftershow instead of an ending.",
      },
    ]),
    highlights: Object.freeze([
      { at: 34, end: 48, category: "TAKE GETS NUCLEAR", label: "PARAMOUNT SAVES THE MOTHERFUCKING DAY", excerpt: "The Nightmare news lands before the audience has even finished loading, and the room immediately starts casting the new movie." },
      { at: 338, end: 344, category: "THE ROOM BREAKS", label: "SOMEONE TURNED OFF NCAA FOOTBALL FOR THIS", excerpt: "A viewer sacrifice becomes proof that the audience is treating the announcement like an event, not background noise." },
      { at: 690, end: 698, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE TALKING-HEAD COMPARISON ESCAPES", excerpt: "A cast discussion swerves into a comparison that makes the proposed Freddy sound like a television personality nobody asked for." },
      { at: 1048, end: 1053, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE CUP-HOLDER QUARTERS BEER", excerpt: "A cheap-beer defense becomes a financial autobiography involving scraped quarters and a car cup holder." },
      { at: 1240, end: 1248, category: "FAN SIGNAL", label: "LEE THE MACHINE GETS HIS DUE", excerpt: "Lee the Machine is thanked by name, establishing the fan-room lane before the stream gets deep into Freddy." },
      { at: 1519, end: 1527, category: "TAKE GETS NUCLEAR", label: "THE NIGHTMARE RIGHTS ARE REAL", excerpt: "The hosts stop treating the announcement as rumor and start asking what kind of Freddy the rights-holder will actually allow." },
      { at: 1653, end: 1661, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE SKARSGARD NAME GETS MANGLED", excerpt: "A potential Freddy name is pronounced badly enough to become its own Steve's Asshole receipt." },
      { at: 1898, end: 1903, category: "THE ROOM BREAKS", label: "THE REBOOT MAKES EVERYONE FEEL SORRY FOR FREDDY", excerpt: "The hosts reject the idea that Freddy should be a misunderstood victim, because pity is the opposite of nightmare fuel." },
      { at: 2317, end: 2325, category: "WWAM UP IN YA", label: "NIGHTMARE THREE GETS A VERY BAD PITCH", excerpt: "A sequel-era reference is delivered with enough double meaning to make the transition back to serious casting impossible." },
      { at: 2552, end: 2572, category: "WWAM UP IN YA", label: "SAMMY SOSA STEROIDS THE PLOT", excerpt: "The new Freddy is asked to steroid himself up and go to the plate, which is not a normal franchise note." },
      { at: 2715, end: 2721, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "OBSESSION OPENS THE SURREAL DOOR", excerpt: "A strange film sequence becomes evidence that a director might understand dream logic better than a corporate horror machine." },
      { at: 2847, end: 2855, category: "TAKE GETS NUCLEAR", label: "STRANGER THINGS IS NOT AUTOMATICALLY A FREDDY RESUME", excerpt: "The Duffer brothers get credit for a hit show, then immediately get put on trial for whether they can be mean." },
      { at: 3338, end: 3346, category: "WWAM UP IN YA", label: "THE NASTY LIME BEER RETURNS", excerpt: "A regretful lime beer keeps interrupting the franchise conversation like a carbonated witness nobody can dismiss." },
      { at: 3800, end: 3808, category: "CHARACTER SIGNAL", label: "ROBERT ENGLUND'S GRIME IS THE STANDARD", excerpt: "The room argues that a new Freddy needs the lived-in garbage-can menace that made Englund's version feel dangerous." },
      { at: 3884, end: 3892, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE ODYSSEY GETS A TOASTED CHALUPA NOTE", excerpt: "Christopher Nolan's next movie is introduced with a food-based nickname that should never appear in a press kit." },
      { at: 4303, end: 4311, category: "TAKE GETS NUCLEAR", label: "CRYSTAL LAKE SHOWS THE MACHETE HAND", excerpt: "A brief trailer image becomes the first serious clue that Jason may arrive before the series thinks it is ready for him." },
      { at: 4344, end: 4352, category: "TAKE GETS NUCLEAR", label: "DROP THE WHOLE SEASON, COWARDS", excerpt: "The hosts celebrate an all-at-once release while admitting that drinking through it may destroy the viewing experience." },
      { at: 4820, end: 4830, category: "FAN SIGNAL", label: "MICHAEL PARTON ENTERS THE FRIDAY ARGUMENT", excerpt: "A Michael Parton message helps turn a childhood Friday the 13th memory into a live franchise debate." },
      { at: 4852, end: 4860, category: "TAKE GETS NUCLEAR", label: "FRIDAY THE 13TH HAS A REWATCHABILITY PROBLEM", excerpt: "The first watch gets the origin-story rush; subsequent watches may be sentenced to the rental shelf." },
      { at: 5157, end: 5165, category: "THE ROOM BREAKS", label: "DISNEY WORLD BECOMES A HORROR TOPIC", excerpt: "A theme-park aside lands in the middle of Crystal Lake talk and proves no subject is safe from the detour engine." },
      { at: 5432, end: 5441, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "THE MERGER CONSPIRACY GETS A CORPORATE KNEE", excerpt: "A political merger story becomes a discussion of billionaires, platform deals, and who is willing to kiss the ring." },
      { at: 5650, end: 5658, category: "FAN SIGNAL", label: "THE ROCKY TRAILER MAKES THE ROOM FEEL THINGS", excerpt: "A trailer about Stallone fighting for his script gets an unexpectedly sincere reaction from two hosts who were prepared to joke." },
      { at: 6008, end: 6018, category: "WWAM UP IN YA", label: "DIGGER MEASURES THE DISASTER IN DICK UNITS", excerpt: "A billion-dollar platform and a ten-times-the-size comparison turn a serious climate trailer into a filthy measurement system." },
      { at: 6536, end: 6544, category: "TAKE GETS NUCLEAR", label: "DIGGER IS A VOD NIGHT, NOT A THEATER NIGHT", excerpt: "The trailer gets credit for weirdness while the room admits it still has no idea what the movie is about." },
      { at: 7280, end: 7292, category: "FAN SIGNAL", label: "THE CHAT OPENS THE CROSSOVER COURT", excerpt: "A fan question sends the hosts into a full John Wick-versus-Rambo terrain debate." },
      { at: 7664, end: 7672, category: "STRAIGHT TO STEVE'S ASSHOLE", label: "LEAVE THE WHITE CASTLE AT HOME", excerpt: "The old backseat White Castle mythology returns as a warning label for anybody who thinks WWAM lore stays retired." },
      { at: 8019, end: 8027, category: "CHARACTER SIGNAL", label: "CHALLIS ORDERS THE SUPREME BEAN ANCHORITO", excerpt: "The Challis character lane gets a full fast-food incantation that sounds like a cursed menu item." },
      { at: 8459, end: 8467, category: "CHARACTER SIGNAL", label: "CHALLIS IS MAXED OUT IN 1982", excerpt: "The character bit turns into a time-travel insult aimed at a version of Challis nobody should have to meet." },
      { at: 8900, end: 8908, category: "THE ROOM BREAKS", label: "THE FREDDY GRANDMA STORY GOES SIDEWAYS", excerpt: "A fan's story about a neighbor named Freddy becomes a school-bus anecdote before anyone can keep the timeline straight." },
      { at: 9090, end: 9098, category: "TAKE GETS NUCLEAR", label: "ABSOLUTE SUPERMAN GETS THE SNYDER STAMP", excerpt: "The Superman conversation becomes a referendum on whether the old DC direction deserved one more real sequel." },
      { at: 9329, end: 9337, category: "FAN SIGNAL", label: "THE INSULTING SUPERCHAT RETURNS", excerpt: "A story about a hostile donor is remembered as part of the community's ongoing archive of chat-room antagonists." },
      { at: 10091, end: 10101, category: "FAN SIGNAL", label: "MICHAEL PARTON MAKES THE NOVA PITCH", excerpt: "The chat turns Nova from a background Marvel name into a character the hosts genuinely want to see get a chance." },
      { at: 10570, end: 10582, category: "TAKE GETS NUCLEAR", label: "THE FREDDY TIER LIST STARTS BEFORE THE SHOW ENDS", excerpt: "Jim Carrey, Ethan Hawke, Matt Smith, Evan Peters, and Lee Pace are treated like a live casting draft." },
      { at: 11224, end: 11232, category: "TAKE GETS NUCLEAR", label: "FRIDAY THE 13TH GETS THE HITCHCOCK DIET-COKE DEFENSE", excerpt: "The first film is defended as popcorn suspense with just enough Hitchcock flavor to make the comparison fun." },
      { at: 11520, end: 11540, category: "CHARACTER SIGNAL", label: "THE KEYBOARD FIGHT GETS ITS OWN CANON", excerpt: "A warning about filming a Loomis/Michael sketch turns into a real-sounding argument over a keyboard to the kidney." },
      { at: 11880, end: 11910, category: "CHARACTER SIGNAL", label: "LOOMIS AND MICHAEL ARE STILL THE BEST BAD IDEA", excerpt: "The hosts explain why the old sketches work: the performers know how far the hit can go without making it real." },
      { at: 12450, end: 12480, category: "FAN SIGNAL", label: "LEE THE MACHINE SAYS NEVER TRUST A FART", excerpt: "Lee's $49.99 final super chat becomes the last practical instruction of the night and a perfect community sign-off." },
      { at: 12620, end: 12648, category: "WWAM UP IN YA", label: "DO NOT REDEEM FREDDY", excerpt: "The closing argument rejects a sympathetic retcon and insists that the new Freddy should be scary, vile, and specific." },
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({
        at: 5650,
        end: 5735,
        label: "THE I PLAY ROCKY TRAILER",
        topic: "Stallone fighting to make Rocky",
        body: "The stream is filthy for most of its runtime, so the sudden sincerity hits harder. The hosts recognize a real underdog story and let the trailer earn the emotion instead of immediately strangling it with a joke.",
        playAt: 5650,
        playEnd: 5735,
      }),
      hated: Object.freeze({
        at: 1653,
        end: 1720,
        label: "THE BRAND-SAFE FREDDY",
        topic: "turning a child murderer into a misunderstood mascot",
        body: "This is the lane the hosts absolutely refuse: pity, soft edges, and a studio-approved Freddy who can sell toys without making anyone uncomfortable. The anger is the point, and it is source-backed by the repeated insistence that the character should stay vile.",
        playAt: 1653,
        playEnd: 1720,
      }),
      wildestDetour: Object.freeze({
        at: 8019,
        end: 8065,
        label: "CHALLIS, BEAN ANCHORITOS, AND THE DREAM KITCHEN",
        topic: "the character bit that turns a fast-food order into canon",
        body: "A question about characters becomes a Challis performance, a cursed menu item, and a reminder that WWAM's best recurring bits are not separate from the movie talk. They are the movie talk after it has been left in the sun too long.",
        playAt: 8019,
        playEnd: 8065,
      }),
      lastWord: Object.freeze({
        at: 12450,
        end: 12780,
        label: "LEE'S LAST SUPER CHAT",
        topic: "community love, never-trust-a-fart, and the Freddy thesis",
        body: "The final fan lane is the entire reason to keep the aftershow playable: a huge Lee the Machine donation, a filthy warning, a sincere thank-you, and one final insistence that horror icons work best when nobody sands off their teeth.",
        playAt: 12450,
        playEnd: 12780,
      }),
    }),
  });

  var priorIz0 = sources["iz0WFhe6LYM"] || {};
  var mergedHighlights = (priorIz0.highlights || []).concat(editorialIz0.highlights || []);
  var seenHighlightAt = Object.create(null);
  mergedHighlights = mergedHighlights.filter(function (item) {
    var key = String(item && item.at != null ? item.at : "");
    if (!key || seenHighlightAt[key]) return false;
    seenHighlightAt[key] = true;
    return true;
  }).sort(function (left, right) {
    return Number(left && left.at || 0) - Number(right && right.at || 0);
  });
  var mergedStory = (priorIz0.story && priorIz0.story.length > editorialIz0.story.length)
    ? priorIz0.story
    : editorialIz0.story;
  sources["iz0WFhe6LYM"] = Object.freeze(Object.assign({}, priorIz0, editorialIz0, {
    evidence: Object.freeze(Object.assign({}, priorIz0.evidence || {}, editorialIz0.evidence || {}, {
      localAudioPass: editorialIz0.evidence.audioPass,
    })),
    story: mergedStory,
    highlights: Object.freeze(mergedHighlights),
    fanRead: Object.freeze(Object.assign({}, priorIz0.fanRead || {}, editorialIz0.fanRead || {})),
  }));

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-06",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
