(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "aKEPm4kYc1s";
  var duration = 8979;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 520, "OPENING FILE", "THE STREAM STARTS MUTED, FACEBOOK IS BLAMED, AND MIKE'S HAIR BECOMES ITS OWN ENTITY", "The April 30 room takes several attempts to go live, then turns the technical delay into a roll call, football-game grudge, Husky Eddie Vedder jokes, and a viewer asking if the hair has become sentient."),
    H(520, 1150, "FAM ROOM", "THE AUDIENCE ARRIVES WITH SUPER CHATS, MRE QUESTIONS, AND A NAKED-SHOWER NEIGHBORHOOD THREAT", "The opening community lane carries sports rivalries, MRE curiosity, and the hosts' fear that their neighbors can see straight into the house. The jokes are filthy, but the underlying beat is real lockdown isolation."),
    H(1150, 1950, "WWAM HOUSE FILE", "NEIGHBORS, LOOMIS, AND THE KENTUCKY VERSION OF A NOSEY BINOCULAR CROUCHER", "The hosts explain that their neighbors have watched the videos and are cool with the Loomis voice. The imagined alternative—old people spying through binoculars while the hosts wear masks—is one of the show's best domestic horror sketches."),
    H(1950, 2700, "GAME ROOM", "A FOOTBALL LOSS, ROCKY QUOTES, AND THE DECISION TO OPEN THE BOX BEFORE EATING THE MRE", "Jordan's game victory becomes a lingering grievance, while Rocky Balboa and Rambo quotes fight for the correct movie reference. The hosts decide unboxing comes first because an MRE is not a snack you casually trust."),
    H(2700, 3600, "PACKAGE OPEN", "FRIGHT NIGHT NOVELTIES, HALLOWEEN MERCH, SOUR CANDY, AND THE BOX THAT KEEPS PRODUCING MORE BOX", "The first package contains Fright Night items, a classic Mr. Harker card, Sour Watermelon candy, and matching Halloween pieces. Every reveal gets a tactile reaction, a crude smell test, or a demand that the other host hold it up correctly."),
    H(3600, 4500, "FAN MAIL", "A LETTER ABOUT GROWN-UP PANIC, CIRCLE JERKS, AND THE WEIRD BEAUTY OF STILL TRYING", "A viewer's letter turns the unboxing into a small emotional room: tax returns, adulthood, coping badly, and the idea that a community can make a frightening transition feel less lonely. The booth reads the filthy lines and keeps the sincerity intact."),
    H(4500, 5250, "FAM / MAIL", "FACEBOOK GROUPS, ALCOHOL DELIVERY, AND WHY THE HOSTS DO NOT WANT FANS WASTING MONEY ON A HEADSET", "The audience offers a new headset, but the hosts push back: they will buy one themselves and do not want fans spending money they need. The conversation then detours through Facebook groups, take-home margaritas, and the economic weirdness of quarantine."),
    H(5250, 5650, "HALLOWEEN LORE", "THE LETTER DECLARES HALLOWEEN THE COMPLETE FRANCHISE AND INSULTS ANYONE WHO DISAGREES", "Sean O'Brien's letter argues that Halloween is more complete than Friday the 13th, even while admitting the Friday remake deserved more. Mike reads the closing insult like a wrestling heel and then agrees with most of the argument."),
    H(5650, 6300, "JOURNAL / FAM", "JWS, OLD COMMENTS, AND THE MOST ROMANTIC JAWS PROPOSAL THAT NEVER HAPPENED", "The hosts read more fan writing, argue about Halloween 4 and 5, and imagine proposing only after the Jaws ride's shark jumps out of the water. The joke is ridiculous; the affection for theme-park movie memories is not."),
    H(6300, 7200, "CHARACTER SERMON", "UNIVERSAL AND AMC ARE TURNED INTO A CHURCH WAR OVER TROLLS, HALLOWEEN, AND THE FUTURE OF THE THEATER", "A preacher-style bit asks the studios and theaters to find common ground. Under the profanity is a real business argument: Universal wants flexibility, AMC needs releases, and both sides can damage the movie ecosystem if they go nuclear."),
    H(7200, 7800, "INDUSTRY NEWS", "THE THEATER-VOD WAR GETS ITS MOST HONEST VERSION: TROLLS IS NOT THE WHOLE FIGHT", "The hosts argue that AMC's anger is less about Trolls going to VOD than Universal implying theaters are optional. The old release-window bargain, two-week waits, Blockbuster memories, and the pandemic all meet in one long rant."),
    H(7800, 8250, "MRE SETUP", "CHICKEN BURRITO BOWL, BRISKET, BISCUIT, TORTILLAS, AND A SPOON BECOME THE WAR PLAN", "After a pee break, the hosts finally read the MRE instructions and decide to eat it cold or mostly improvised. The chicken burrito bowl, beef brisket, biscuit, crackers, cheese, butter buds, and coffee rolls turn the table into a military-themed Taco Bell."),
    H(8250, 8550, "MRE CHAOS", "PEPPER SAUCE HITS THE BACK OF THE THROAT AND THE ENTIRE BOOTH DECLARES A STOMACH REBELLION", "The cheese spread, corn nuggets, tortillas, cocoa, orange drink, and coffee are tested in real time. One pepper sauce sample goes nuclear; the hosts call it mace, apologize to the audience, and keep eating anyway."),
    H(8550, 8850, "SERVICE / FAM", "THE MRE GETS A MARINE CORRECTION, A MILITARY THANK-YOU, AND A VEGETABLE-LASAGNA NIGHTMARE", "Shawn corrects the Army/Marsines confusion, and the hosts pivot from jokes to genuine respect for people who serve. Vegetable lasagna becomes the imagined trading-card disaster: nobody wants it, but someone has to eat it."),
    H(8850, 8979, "CLOSING FILE", "THE BRISKET SURVIVES, THE CHICKEN BOWL DOES NOT, AND BUSTER REFUSES THE WAR RATION", "The MRE is judged surprisingly good when assembled with barbecue sauce and patience. Buster rejects the chicken, the hosts choose Taco Bell for the next meal, and the tape closes with a kitchen that looks like a ration crate exploded."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 1150, label: "THE DELAYED OPENING TURNS THE HOUSE INTO A LOCKDOWN SITCOM", body: "A muted feed, Facebook notifications, sports resentment, Husky Eddie Vedder, and sentient hair make the opening a complete WWAM warm-up. The audience arrives before the actual unboxing has even begun.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1150, end: 1950, label: "THE NEIGHBORHOOD SEES THE LOOMIS BIT AND, MERCIFULLY, DOES NOT CALL THE COPS", body: "The hosts explain that their neighbors have watched the channel and understand the character voices. The imagined version—binoculars, masks, and a Kentucky morality crusade—becomes a miniature domestic horror story.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1950, end: 2700, label: "A GAME LOSS AND ROCKY QUOTES DELAY THE BOX", body: "Jordan's victory still hurts, and the hosts spend a while trying to identify a Rocky line before deciding to unbox first. The MRE is treated as an event, not a snack, because neither host trusts a sealed military meal to behave normally.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 2700, end: 3600, label: "FRIGHT NIGHT AND HALLOWEEN MERCH TURN THE PACKAGE INTO A FAN-MADE HAUNTED HOUSE", body: "The first package yields Fright Night novelties, a card, sour candy, and matching Halloween pieces. The camera problem becomes part of the comedy: every cool object has to be held up, smelled, tilted, and rescued from the wrong box.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3600, end: 4500, label: "THE LETTER ROOM GETS GROWN-UP AND THEN IMMEDIATELY FILTHY AGAIN", body: "A fan letter about tax returns and a frighteningly adult life is read with genuine appreciation. The hosts let the tenderness sit next to Circle Jerks jokes instead of sanding one side away.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 4500, end: 5650, label: "THE AUDIENCE OFFERS GEAR, MARGARITAS, AND A HALLOWEEN FRANCHISE THESIS", body: "The hosts refuse a fan-funded headset, discuss quarantine alcohol delivery, and read Sean O'Brien's argument that Halloween is the more complete franchise. The response is a perfect WWAM mixture of gratitude, agreement, and heel-promo insult.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 5650, end: 6300, label: "JAWS, HALLOWEEN 4, AND THE THEME-PARK MEMORY LANE", body: "A Jaws ride proposal joke becomes a real memory of movie attractions, while Halloween 4 and 5 get a serious comparative defense. The show understands that fan lore is made from rides, letters, comments, and arguments—not just videos.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 6300, end: 7800, label: "THE UNIVERSAL-AMPHITHEATER SERMON BECOMES A THEATER-BUSINESS ARGUMENT", body: "The hosts turn the Universal/AMC fight into a sermon about Trolls, Halloween, release windows, VOD, and the future of the movie theater. They miss Blockbuster and still want the films on a big screen, but they also understand why the companies are cornered.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 7800, end: 8550, label: "THE MRE TURNS THE TABLE INTO A MILITARY TACO BELL", body: "Chicken burrito bowl, brisket, biscuit, crackers, cheese, corn nuggets, tortillas, butter buds, coffee, cocoa, orange drink, and pepper sauce are assembled in real time. The hosts improvise the instructions and discover that some of the ration is genuinely good.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 8550, end: 8979, label: "THE PEPPER SAUCE WINS, THE SERVICE THANK-YOU LANDS, AND BUSTER DECLINES", body: "After correcting the Marine/Army mix-up, the hosts thank service members and compare the MRE to school food, Taco Bell, and war-time trading. The chicken bowl is discarded, Buster refuses a sample, and the brisket survives as the champion.", evidenceBasis: "full-tape-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-tape editorial read; canonical local audio aligned against the source-local caption ledger across the delayed opening, lockdown-neighbor bit, game-room detour, Fright Night/Halloween package, fan letter, headset boundary, Halloween franchise mail, Jaws ride memory, Universal/AMC sermon, theater/VOD business argument, MRE setup, pepper-sauce failure, service correction, and closing ration verdict",
    evidence: Object.freeze({ duration: duration, captionWords: 26745, captionEvents: 7311, captionSpanSeconds: 8980.351, captionDurationCoveragePercent: 100.0, captionSha256: "49989F213B01681CF325A3444715802913C7A93D93386774689BAA4BEA8A23F7", captionSourceKind: "source-local canonical speech-to-text caption ledger", audioPass: "canonical local source audio + caption alignment; local Whisper alignment retained for playback verification; playback remains the authority", audioSha256: "BD570F0C0342A97E9FCD095D095211B1CCA843780521CD3E5CE20620D56788E3", asrWindowCount: 1, asrSegmentCount: 571, asrSha256: "61E06F3BDB09B6B7EA554D66A4B1486BCF08111F90995C580756D046B84D4024", speakerAttribution: false, visualOutcomeInferred: false }),
    label: "LIVE UNBOXING // MRE, MAIL, HALLOWEEN, AND THE THEATER WAR",
    badge: "FULL SHOW WIKI // FAN MAIL, LOOMIS, UNIVERSAL VS AMC, AND A PEPPER-SAUCE CASUALTY",
    headline: "THE MRE SURVIVES THEATER POLITICS, HALLOWEEN MAIL, AND THE PEPPER SAUCE",
    deck: "A 2h29 source-local dossier where fan packages, a Halloween franchise letter, a Universal/AMC business sermon, and one disastrous MRE become one long WWAM community night.",
    overview: "The April 30, 2020 live show is an unboxing with a whole channel's worth of side doors. It begins with a delayed feed, Facebook notifications, sports resentment, Husky Eddie Vedder, and the running fear that Mike's hair has achieved sentience. The audience arrives with MRE questions and a naked-shower neighborhood story, then the hosts explain that their actual neighbors have watched the Loomis videos and are cool with the noise. The first package delivers Fright Night novelties, a classic card, sour candy, and matching Halloween items. A fan letter about tax returns, Circle Jerks, and the frightening transition into adult life gives the middle a real emotional center; the hosts let the sincerity sit next to the filth instead of pretending WWAM has to choose. More mail turns into a boundary lesson when fans offer a new headset and the hosts say they do not want people spending money they need. Sean O'Brien's letter argues that Halloween is the more complete franchise than Friday the 13th, and the booth answers with a heel-promo insult plus a real defense of Halloween 4 and Jamie Lee Curtis. A Jaws ride memory then becomes the most romantic proposal story that never happened. The late movie-business sermon is the episode's research-grade lane: Universal, AMC, Trolls, Halloween, release windows, VOD, Blockbuster, and the question of whether theaters and studios can survive a public divorce. Finally, after a pee break, the hosts open a military MRE. Chicken burrito bowl, brisket, biscuit, crackers, cheese, tortillas, corn nuggets, coffee, cocoa, orange drink, and pepper sauce are assembled like a cursed Taco Bell. The brisket wins, the pepper sauce attacks the back of the throat, Buster rejects the chicken, and the hosts close by thanking service members after correcting their Army/Marine mix-up.",
    topics: Object.freeze(["fan mail", "MRE", "military meal", "Fright Night", "Halloween merch", "Halloween 4", "Halloween 5", "Friday the 13th", "Jaws", "Universal", "AMC", "Trolls", "theater windows", "VOD", "Blockbuster", "Dr. Loomis", "Buster", "FAM", "quarantine"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 3600, end: 4500, label: "THE FAN LETTER MAKES THE LOCKDOWN FEEL LESS LONELY", topic: "Community memory", body: "Play from 1:00:00. A letter about adult panic, tax returns, and trying to cope gives the unboxing a real emotional center without losing the WWAM voice.", playAt: 3600, playEnd: 4500 }),
      hated: Object.freeze({ at: 7200, end: 7800, label: "THE THEATER-VOD WAR IS REALLY ABOUT WHO GETS TO SET THE RULES", topic: "Industry argument", body: "Play from 2:00:00. The hosts argue AMC is not only angry about Trolls; it is angry about Universal narrating a future where theaters are optional.", playAt: 7200, playEnd: 7800 }),
      wildestDetour: Object.freeze({ at: 8250, end: 8550, label: "THE PEPPER SAUCE TURNS THE MRE INTO A MEDICAL EVENT", topic: "MRE chaos", body: "Play from 2:17:30. One hot-sauce sample hits the back of the throat and the entire booth starts negotiating with its stomach.", playAt: 8250, playEnd: 8550 }),
      lastWord: Object.freeze({ at: 8850, end: 8979, label: "BUSTER REFUSES THE RATION AND THE BRISKET WINS", topic: "Closing verdict", body: "Play from 2:27:30. The chicken bowl is discarded, Buster says no, and the brisket earns the only medal that matters tonight.", playAt: 8850, playEnd: 8979 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(85, 170, "Robert", "OPENING ROLL CALL", "Robert is welcomed as the live room finally loads."),
        F(88, 175, "Jonathan Kells", "OPENING ROLL CALL", "Jonathan Kells is named in the first audience wave."),
        F(90, 180, "DJ Mexicano", "OPENING ROLL CALL", "DJ Mexicano appears in the opening roll call."),
        F(92, 182, "Kim Burnett", "OPENING ROLL CALL", "Kim Burnett is welcomed while the hosts check the feed."),
        F(96, 188, "Vanessa", "OPENING ROLL CALL", "Vanessa is acknowledged in the first community cluster."),
        F(107, 215, "Jordan Cruz", "GAME ROOM", "Jordan Cruz's win is still being held against him in the opening sports grudge."),
        F(146, 245, "Sean O'Brien", "MRE QUESTION", "Sean asks about the MRE and later sends the Halloween franchise letter."),
        F(164, 245, "Katie", "FAM SUPPORT", "Katie is thanked during the first Super Chat wave."),
        F(172, 255, "Ron Gillen", "FAM SUPPORT", "Ron is thanked during the opening hair and sports jokes."),
        F(197, 295, "Podcast 19:19", "MRE QUESTION", "The podcast message helps move the conversation toward the MRE test."),
        F(202, 305, "Manny", "FAM SUPPORT", "Manny is thanked for checking in during lockdown."),
        F(236, 330, "Jarvis", "FAM SUPPORT", "Jarvis appears in the early audience room."),
        F(279, 385, "Derek", "NEIGHBORHOOD BIT", "Derek's shower joke becomes the first full audience detour."),
        F(414, 520, "Gavin Gisela", "GAME ROOM", "Gavin's message lands during the Madden/2K game talk."),
        F(459, 560, "Patrick Hartnett", "FAM SUPPORT", "Patrick is thanked before the package and MRE debate begins."),
        F(932, 1040, "Barbara", "NEIGHBORHOOD CHAT", "Barbara's message starts the neighbor discussion and the apology that the Loomis voice is not real life."),
        F(936, 1035, "Lauren", "NEIGHBORHOOD CHAT", "Lauren is acknowledged while the hosts explain that their neighbors have watched the videos."),
        F(1221, 1310, "Katie", "FAM QUESTION", "Katie's words are cited during the neighborhood and lockdown detour."),
        F(1568, 1660, "Barbara", "FAM SUPPORT", "Barbara is thanked again in the game-room portion."),
        F(1695, 1810, "Cody", "GAME RIVALRY", "Cody's Madden win is the source of Mike's lingering frustration."),
        F(1852, 1955, "Jamie Gries", "MUSIC CHAT", "Jamie asks for 'Wonderwall,' opening the movie-quote and music detour."),
        F(1926, 2030, "Brendan Hill / Furball", "MOVIE QUOTE", "Brendan and Furball help identify the Rocky line before the unboxing begins."),
        F(2794, 2895, "Mr. Harker", "FAN PACKAGE", "Mr. Harker's classic card is shown during the first package reveal."),
        F(3020, 3130, "Mighty Thor", "FAM SUPPORT", "Mighty Thor's recovery is mentioned while the hosts handle the Halloween package."),
        F(3125, 3220, "Barbara", "FAN PACKAGE", "Barbara is thanked during the merch and card reveal."),
        F(3547, 3650, "Vanessa", "FAM SUPPORT", "Vanessa's message is acknowledged as the package room closes."),
        F(3588, 3680, "Bryce", "BUSTER QUESTION", "Bryce asks about Buster's breed, opening the dog detour."),
        F(3637, 3745, "Ryan Gilliland", "FAM SUPPORT", "Ryan is thanked before the second letter is read."),
        F(3663, 3770, "Je Mitchie", "HEADSET QUESTION", "Je Mitchie asks for a new headset for J, which the hosts answer with a spending boundary."),
        F(3696, 3830, "Grindle", "FAN LETTER", "Grindle's letter becomes the grown-up panic and Circle Jerks room."),
        F(4517, 4610, "Jessie Kid Entertainment", "FAM SUPPORT", "Jessie is welcomed into the Facebook group during the package break."),
        F(4567, 4660, "Chad", "FAM CORRECTION", "Chad's message helps explain that the headset talk is no longer relevant."),
        F(4597, 4705, "Jordan Cruz", "QUARANTINE CHAT", "Jordan asks about alcohol delivery and gets a margarita story."),
        F(4630, 4735, "Furball", "FAM SUPPORT", "Furball is thanked during the Facebook groups and quarantine economy detour."),
        F(5243, 5380, "Sean O'Brien", "HALLOWEEN LETTER", "Sean's letter argues for Halloween as the stronger, more complete franchise."),
        F(6193, 6290, "Courtney Reed", "CHARACTER REQUEST", "Courtney asks for a Halloween/Friday comparison before the Universal sermon begins."),
        F(6467, 6570, "Morris", "FAM SUPPORT", "Morris's platonic-love message gets a filthy but affectionate answer."),
        F(6486, 6590, "Cal Burnett", "FRANCHISE QUESTION", "Cal asks whether Halloween or Friday the 13th is the better franchise."),
        F(6529, 6640, "Eric", "CHARACTER QUESTION", "Eric asks who would win a cage fight between Paul Rudd's Tommy Doyle and Tommy Jarvis."),
        F(6569, 6680, "Cal", "CHAIR JOKE", "Cal's chair comment arrives as the sermon gives way to the MRE setup."),
        F(8522, 8615, "Shawn", "MRE / SERVICE", "Shawn's pepper-sauce message becomes part of the MRE casualty report."),
        F(8580, 8680, "Jarvis", "MRE CHAT", "Jarvis is challenged to try the family salmon patties during the ration reaction."),
        F(8617, 8720, "Tomoe", "MRE TIP", "Tomoe suggests dipping the toffee cookies into hot chocolate."),
        F(8637, 8750, "Brian", "MRE / SERVICE", "Brian's message prompts the hosts to ask what MRE eating is like in the service."),
        F(8786, 8900, "Shawn", "SERVICE THANK-YOU", "Shawn's Marine correction is accepted and followed by genuine thanks to service members."),
      ]),
      note: "Forty-three source-local FAM, package, question, support, character, correction, and service receipts are carried into this dossier. Names and interaction types are caption evidence; donation amounts, speaker identity, intent, and visual context remain unclaimed until playback review."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
