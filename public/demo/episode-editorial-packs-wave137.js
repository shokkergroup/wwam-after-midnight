(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt) {
    return { at: at, end: end, category: category, label: label, excerpt: excerpt, sourceId: "7n7HYtyfacw", evidenceState: "machine surfaced; audio-feature-ranked candidate; playback remains the authority" };
  };

  /* February 13, 2025: full second read of the 1:08:19 movie-news room. */
  sources["7n7HYtyfacw"] = Object.freeze({
    sourceId: "7n7HYtyfacw",
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-07 fine-toothed second read; 23 audio-ranked windows reconciled across the full February 13 room",
    evidence: Object.freeze({
      duration: 4099,
      captionWords: 14334,
      captionEvents: 3764,
      captionSpanSeconds: 4100,
      captionDurationCoveragePercent: 100,
      captionSha256: "sha256:30a1476b34f1d2f2fe0bef789bc7a28b06b61bde93c3e3dfc436ef7e816721ba",
      captionSourceKind: "official YouTube caption ledger",
      audioPass: "canonical YouTube audio + source-local Whisper transcript alignment",
      audioSha256: "sha256:69dbc94a8d1e1690e18bcebd840a47a425e78a5e0820112c9570a3ade499d1ca",
      asrWindowCount: 23,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED A MOVIE LIVE // FEBRUARY 13, 2025",
    badge: "FULL SHOW WIKI // 1:08:19 OF HELLRAISER, FRIDAY, MARVEL, LOOMIS BIRTHDAY WISHES, AND A HORROR ROYAL RUMBLE",
    headline: "THE FEBRUARY 13 ROOM WANTS A HORROR ROYAL RUMBLE AND A LOOMIS BIRTHDAY WISH",
    deck: "A tight movie-news episode that packs casting rumors, Marvel fatigue, fan Super Chats, and one trailer button into a very concentrated WWAM night.",
    overview: "February 13 is short by WWAM standards but not light. The room opens with a Hellraiser complaint, a story it refuses to spoil yet, and a Friday the 13th casting rumor involving Pamela Voorhees. From there it moves through Taylor Lautner jokes, Jason's mother, the possibility of a Crystal Lake origin story, a movie the hosts plan to watch together, and Marvel's familiar cookie-cutter problem. The fan lane is unusually visible: a Captain America game question, a Loomis birthday request, a horror Royal Rumble concept built inside a wrestling game, and Super Chats that keep the host answering instead of merely reading headlines. The back half turns to a strange elevator-shaft story, Scream's aging cast, a simulated horror Royal Rumble, and a Borderline trailer that gets one final button before the weekend. The 23 doors are intentionally compact, but each one is a real turn in the room's rhythm: source topic, crude tangent, fan signal, character possibility, or the exact moment the show decides to press play.",
    story: Object.freeze([
      { at: 0, end: 600, label: "HELLRAISER AND THE SPOILER HELD BACK", body: "The room starts with a Hellraiser complaint and a story it is deliberately saving, proving that a short episode can still create a door before giving away the destination." },
      { at: 600, end: 1200, label: "PAMELA VOORHEES AND THE FRIDAY RUMOR", body: "A Friday casting rumor brings Jason's mother back into the desk, followed by a Crystal Lake origin-story joke and the fear that the prequel could last forever." },
      { at: 1200, end: 1800, label: "MARVEL, STAR WARS, AND THE COOKIE-CUTTER COMPLAINT", body: "The room pushes back on another familiar Marvel shape while admitting that Fantastic Four looks promising enough to keep the argument alive." },
      { at: 1800, end: 2400, label: "VALENTINE'S DAY AND THE WRONG KIND OF PRESENT", body: "A holiday question becomes a relationship test, then the room pivots to a theatrical release and a news item it has not finished reading." },
      { at: 2400, end: 3000, label: "CAPTAIN AMERICA, LOOMIS, AND SUPER CHAT", body: "Fan questions bring in a Captain America game, a Loomis birthday wish, and the kind of message that makes the channel feel like a live room instead of a news desk." },
      { at: 3000, end: 3600, label: "HORROR ROYAL RUMBLE AND THE BACKWOODS MAN", body: "Wild Willie pitches a wrestling-game Royal Rumble with horror icons, while the room falls into a recurring Backwoods Man line about dying and starting the night again." },
      { at: 3600, end: 3900, label: "THE TRAILER BUTTON", body: "One final trailer gets pressed before the weekend, but the room cannot reach the button without turning the moment into an air-humping performance." },
      { at: 3900, end: 4099, label: "BULGARIA, CHEEKS, AND THE LAST LAUGH", body: "The last room break turns a body-position joke into a Bulgaria lesson, leaving the short episode on the exact kind of unplanned vulgarity the archive should preserve." },
    ]),
    highlights: Object.freeze([
      H(99, 107, "STRAIGHT TO STEVE'S ASSHOLE", "HELLRAISER WANTS YOU TO FEEL BAD", "The Hellraiser discussion is reduced to a consumer-psychology attack: make people feel bad, then hope they buy more stuff to feel better."),
      H(193, 201, "TAKE GETS NUCLEAR", "KRISTEN STEWART AND ROBERT PATTINSON GET FORGOTTEN", "A show is criticized for pretending its stars have no past, and the room uses Twilight memory as evidence that the premise may be the whole program."),
      H(287, 295, "ROOM BREAK", "TAYLOR LAUTNER AS A HAUNTING", "A strange fan-casting idea turns Taylor Lautner into a werewolf who simply plays himself while haunting the world, a pitch the room compares to a Reddit fever dream."),
      H(468, 476, "TAKE GETS NUCLEAR", "LINDA CARDellINI AS PAMELA VOORHEES", "A Friday rumor suggests Linda Cardellini for Pamela Voorhees, and the room discovers it absolutely wants to see the casting even before the story exists."),
      H(589, 597, "CHARACTER SIGNAL", "JT WRITES THE JASON-MOM SCRIPT", "Jason's mother becomes a character lane, with JT Oley imagined as the person who would take the story in the most inappropriate possible direction."),
      H(704, 712, "CHARACTER SIGNAL", "CRYSTAL LAKE TAKES A CENTURY", "The prequel idea expands backward until the room imagines a historical epic about how Crystal Lake was settled before Jason can even arrive."),
      H(749, 757, "STRAIGHT TO STEVE'S ASSHOLE", "NUMBERS ARE THE EX-WIFE OF THE MOVIE", "A movie somebody has not watched gets dragged through an ex-wife accounting joke, proving that even a harmless title can be sent directly to Steve's Asshole."),
      H(1242, 1250, "STRAIGHT TO STEVE'S ASSHOLE", "THE LUKEWARM MOVIE NOBODY MISSED", "Rotten Tomatoes reactions are previewed, then the movie is dismissed as a flash-pan release with characters nobody cared about."),
      H(1425, 1433, "STRAIGHT TO STEVE'S ASSHOLE", "MARVEL'S GALACTIC COOKIE CUTTER", "The room insists it does not hate every Marvel project, then compares the familiar franchise shape to a cookie cutter the audience has already seen too many times."),
      H(1842, 1850, "TAKE GETS NUCLEAR", "NOTHING MEANS YOU ARE IN TROUBLE", "A Valentine's Day answer is interpreted as a trap, with the room deciding that the phrase nothing is the first sign somebody is walking into a dead-man situation."),
      H(1929, 1937, "TAKE GETS NUCLEAR", "WHITE DAY NEEDS ITS OWN HOLIDAY", "A chat message about Valentine's Day expands into the demand for a separate holiday, followed by a Resident Evil shirt getting pulled into the argument."),
      H(2076, 2084, "TAKE GETS NUCLEAR", "THE FULL-PRICE FLEX", "A discussion of expensive things turns into a critique of people who announce the price before anybody asks, making shopping itself a personality flaw."),
      H(2147, 2155, "ROOM BREAK", "THE SHORT-BUS INTERNET COMMENT", "A chat insult is read aloud, a hose threat appears, and the room has to reset before talking about a release that may already be finished."),
      H(2346, 2354, "ROOM BREAK", "DIDDY'S JAIL-CELL INTERNET", "A Wild Willie horror Royal Rumble suggestion gets mixed with a jail-cell internet joke, and the room explains that the game is too dead to play on stream."),
      H(2418, 2426, "TAKE GETS NUCLEAR", "VALENTINE'S DAY CALL OF DUTY", "The holiday becomes a gaming schedule: people are getting their Call of Duty in before they have to spend the next day with someone they love."),
      H(2626, 2634, "FAN SIGNAL", "CAPTAIN AMERICA 1943 IS THE SUPER CHAT GAME", "Michael Parton asks about the Captain America game, and the room gives the project a real look instead of burying the fan question under the news."),
      H(2841, 2849, "TAKE GETS NUCLEAR", "THE ELEVATOR SHAFT RETIREMENT PLAN", "A bizarre story about workers waiting for a shaft to lower them out of a job becomes a full horror premise, complete with a thousand-person backup plan."),
      H(2948, 2956, "TAKE GETS NUCLEAR", "SCREAM NEEDS A NEW GENERATION", "The room argues that Scream keeps returning to the same older faces, then asks whether a franchise can move forward without repeatedly rebuilding the same story."),
      H(2997, 3005, "TAKE GETS NUCLEAR", "THE NAME THAT SOUNDS LIKE A LIE", "A birthday message becomes a joke about a suspicious name, with the room deciding the person is hiding something even though the question is harmless."),
      H(3101, 3109, "WWAM UP IN YA", "LOOMIS WINS THE HORROR ROYAL RUMBLE", "Wild Willie pitches a wrestling-game Royal Rumble with thirty horror icons, then reveals Loomis wins it all, a perfect crossover for the character archive."),
      H(3254, 3262, "ROOM BREAK", "THE BACKWOODS MAN LOOP", "A game scene gets a recurring Backwoods Man line about dying and waking into a different night, giving the short show a miniature horror myth."),
      H(3736, 3750, "TAKE GETS NUCLEAR", "THE TRAILER BUTTON AIR-HUMP", "The room insists it has to press one trailer button before the weekend, then celebrates by humping the air and yelling at the interface."),
      H(4019, 4027, "ROOM BREAK", "THE BULGARIAN CHEEKS LESSON", "A final body-position joke becomes an impromptu Bulgaria lesson, the exact kind of vulgar, accidental closer that makes the short episode memorable."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2626, end: 3109, label: "CAPTAIN AMERICA AND LOOMIS WINS", topic: "fan questions become canon doors", body: "Play from 43:46. A Captain America game question, a Loomis birthday request, and Wild Willie's horror Royal Rumble idea show the FAM steering the actual show.", playAt: 2626, playEnd: 3109 }),
      hated: Object.freeze({ at: 1242, end: 1433, label: "THE COOKIE-CUTTER MARVEL RUN", topic: "franchise fatigue", body: "Play from 20:42. A lukewarm film and a familiar Marvel shape become one compact argument about why the room wants better stories, not just more products.", playAt: 1242, playEnd: 1433 }),
      wildestDetour: Object.freeze({ at: 2841, end: 3262, label: "THE ELEVATOR-SHAFT HORROR ROYAL RUMBLE", topic: "industrial dread meets wrestling games", body: "Play from 47:21. An elevator-shaft retirement story gives way to a thirty-icon Royal Rumble where Loomis wins, then the Backwoods Man keeps restarting the night.", playAt: 2841, playEnd: 3262 }),
      lastWord: Object.freeze({ at: 3736, end: 4027, label: "THE TRAILER BUTTON AND BULGARIA", topic: "the short show ends unhinged", body: "Play from 1:02:16. One last trailer, an air-humping button press, and a Bulgarian cheeks lesson close the archive door.", playAt: 3736, playEnd: 4027 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-07", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
