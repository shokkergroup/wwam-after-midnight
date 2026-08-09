(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "DPZGZBWat04";
  var duration = 7280;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(130, 560, "OPENING / FAM", "LOOMIS MEYERS, A CHECK IN THE SHADOWS, AND THE SUICIDE SQUAD TRAILER PROMISE", "The opening floats a Loomis Meyers skin idea, reads the first FAM receipt, and sets the two big lanes: a new Suicide Squad trailer and a Nobody review."),
    H(560, 900, "NOBODY", "BOB ODENKIRK WALKS OUT OF A MOVIE AND THE ROOM REALIZES NOBODY IS NOT BEING TALKED ABOUT", "The hosts explain why Nobody grabbed them: a family attack, an ordinary man with a hidden past, and a John Wick-shaped action movie that still wants its own identity."),
    H(900, 1300, "LEATHERFACE", "OLD MAN LEATHERFACE, A DIRECT SEQUEL IDEA, AND THE TEXAS CHAINSAW TIMELINE", "A Leatherface news lane sketches an older killer and a story that follows the first film years later. The hosts are unsure of the exact shape, so the dossier preserves the theory as conversation rather than canon."),
    H(1300, 1700, "SNYDERVERSE", "THE RESTORE MOVEMENT GETS USED AS A CASE STUDY FOR THE DAVID AYER CUT", "The hosts ask whether the same fan pressure could bring back David Ayer's Suicide Squad cut, while admitting the four-hour Snyder release creates a different kind of precedent."),
    H(1600, 2200, "FAM / FRIDAY NIGHT FIGHTS", "JOHN CENA VERSUS RICK MORANIS AND THE FAM BUILDS THE NEXT FIGHT", "Brandon Barry suggests a John Cena versus Rick Moranis matchup, Joshua Ayers keeps the Friday Night Fights lane moving, and the chat turns casting into a voting card."),
    H(2200, 3100, "BATMAN / SNYDERVERSE", "AFFLECK, REEVES, AND THE BATMAN WHO COMES BACK ONLY IF SNYDER IS IN CHARGE", "The hosts separate Matt Reeves' future Batman from Ben Affleck's version, then debate the report that Affleck would return only with Snyder attached. The point is a conditional possibility, not a booking."),
    H(3100, 3900, "NOBODY REVIEW", "THE FAMILY ATTACK, THE BUS, AND THE JOHN WICK COMPARISON THAT NEVER FULLY FITS", "Nobody becomes the episode's actual review: Hutch's frustration, the family intrusion, the bus fight, and a third act that feels John Wick-ish without simply being a copy."),
    H(3900, 4300, "WWAM UP IN YA", "POLAR IS OLD-MAN JOHN WICK AND THE HOSTS TAKE ANOTHER PEE BREAK", "Will Arntwine's Polar comparison becomes the bridge to a break, with the hosts calling the movie badass and admitting the bladder has lost the argument."),
    H(4300, 4720, "SUICIDE SQUAD", "THE TRAILER REACTION STARTS WITH TECHNICAL FAILURE AND ENDS WITH A BIG, FILTHY YES", "The Suicide Squad trailer plays through an echo problem, but the room still gets the intended rhythm: James Gunn's tone, John Cena's Peacemaker, a nasty R-rated promise, and a cast that looks built to be disposable."),
    H(4720, 5300, "SUICIDE SQUAD", "JOHN CENA, BATISTA, AND THE QUESTION OF WHO GOT GOOD BY BEING THEMSELVES", "The booth compares John Cena's screen presence with Batista's Drax breakthrough, then asks whether the trailer is funny because the actors are good or because the material finally uses their weirdness correctly."),
    H(5300, 6500, "SUICIDE SQUAD", "STALLONE, GUNN, AND THE TRAILER THAT LOOKS LIKE A MOVIE PEOPLE WANT TO SEE", "Sylvester Stallone's involvement, the adult rating, and James Gunn's fit become the core verdict: do not judge the finished film yet, but the trailer looks like a fun, filthy, confidently assembled movie."),
    H(6500, 7150, "BATMAN CANON", "KEATON, BALE, AFFLECK, AND THE BATMAN VOICE THAT RAISED EVERYBODY", "The FAM asks for the favorite Batman. The booth moves through Keaton, Bale, Affleck, the animated-series voice, Batman Forever, George Clooney, and the difference between liking a Batman movie and liking the person in the suit."),
    H(7000, 7280, "LAST CALL", "GODZILLA VERSUS KONG, MICHAEL KEATON, AND THE BOARDROOM VERSION OF FLASHPOINT", "The close folds in Godzilla/Kong chat, a Michael Keaton restore wish, Flashpoint's Thomas Wayne possibility, and one last threat to settle the argument in the parking lot."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 130, end: 1700, label: "THE SHOW OPENS WITH LOOMIS MEYERS, NOBODY, LEATHERFACE, AND A CUT THAT MIGHT EXIST", body: "A Loomis Meyers skin idea and the first FAM receipts frame a night split between a Nobody review and the new Suicide Squad trailer. Leatherface news brings an older-killer theory, while the Snyderverse conversation asks whether fan pressure could ever move the David Ayer cut. The tape keeps the boundaries clear: reports and possibilities stay reports and possibilities.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1700, end: 3900, label: "NOBODY TURNS A JOHN WICK COMPARISON INTO ITS OWN REVIEW", body: "The FAM builds a John Cena/Rick Moranis fight, then the hosts work through Nobody: the family attack, Hutch's buried identity, the bus fight, and the third act. It has John Wick energy, but the booth keeps asking what makes the movie stand on its own instead of merely borrowing a silhouette.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 3900, end: 6500, label: "THE SUICIDE SQUAD TRAILER SURVIVES ECHO, PEE, AND A JOHN CENA/BATISTA LAB", body: "Polar is old-man John Wick, the hosts take a break, and the Suicide Squad trailer arrives through an echo problem. James Gunn's tone, John Cena's Peacemaker, Batista's Drax breakthrough, an adult rating, and Sylvester Stallone's presence create a provisional verdict: the trailer looks fun and filthy, but the finished movie still has to earn it.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 6500, end: 7280, label: "BATMAN IS A VOICE, A SUIT, A VERSION, AND A FLASHPOINT BOARDROOM FIGHT", body: "The favorite-Batman discussion distinguishes Keaton, Bale, Affleck, animated Batman, Forever, and Clooney. The close lets the FAM bring back Godzilla/Kong and Michael Keaton before Flashpoint's Thomas Wayne idea turns the next sequel pitch into a boardroom threat.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h01m20s The Suicide Squad, Nobody + More! WWAM Video Live stream; local audio, canonical captions, and Whisper ledger checked across Loomis Meyers setup, first FAM receipt, Nobody review, Leatherface timeline speculation, Ayer Cut/Snyderverse pressure, John Cena/Rick Moranis Friday Night Fight, Affleck/Reeves/Snyder Batman discussion, bus-fight and John Wick comparison, Polar detour, Suicide Squad trailer reaction and echo failure, John Cena/Batista acting comparison, Gunn/Stallone/adult-rating verdict, favorite Batman debate, Godzilla/Kong and Michael Keaton close, and Flashpoint/Thomas Wayne boardroom joke",
    evidence: Object.freeze({
      duration: 7280,
      captionWords: 25090,
      captionEvents: 3779,
      captionSpanSeconds: 7281.76,
      captionDurationCoveragePercent: 100,
      captionSha256: "D03360B8D4BA2A197685CAB34D228AD269580C80FBDB57C10AC44449B7BDCDE6",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "B7C9664BE0AC028C24F34E0E87F9696CEDBACD893C506B0FD3DEA4D608383FEF",
      asrSegmentCount: 466,
      asrSha256: "sha256:D165566384806355809028FF64BF2F7E686F284114B676DF3E075EDC4291C88C",
      asrCoverageStartSeconds: 435,
      asrCoverageEndSeconds: 7245.28,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "THE SUICIDE SQUAD // NOBODY + MORE! WWAM VIDEO LIVE",
    badge: "FULL SHOW WIKI // NOBODY, SUICIDE SQUAD, BATMAN, AND FAM CHAOS",
    headline: "NOBODY GETS THE JOHN WICK TEST, THE SUICIDE SQUAD TRAILER GETS THE ROOM, BATMAN GETS A VOTE",
    deck: "A full-audio WWAM read of the 2h01m20s live: Nobody's bus fight, Leatherface news, Ayer Cut hopes, a Suicide Squad trailer reaction, John Cena versus Batista, and a FAM-built Batman ranking.",
    overview: "This is a compact news-night dossier with three strong lanes. Nobody gets the full review: Hutch's family problem, the bus fight, the buried identity, and the question of whether a John Wick comparison is useful or lazy. Leatherface news floats an older-killer, direct-sequel idea without enough certainty to call it canon. The Snyderverse discussion asks whether the same fan pressure could bring back David Ayer's Suicide Squad cut, then the FAM builds a John Cena versus Rick Moranis Friday Night Fight. Matt Reeves, Ben Affleck, Michael Keaton, and Zack Snyder split the Batman conversation, with Affleck's possible return kept conditional on Snyder's involvement. A Polar detour leads into the Suicide Squad trailer, which survives an echo problem and gets a provisional thumbs-up for James Gunn's tone, John Cena's Peacemaker, Batista's Drax-to-actor trajectory, an adult rating, and Sylvester Stallone's presence. The close ranks Batman voices and suits, folds in Godzilla versus Kong and a Michael Keaton restore wish, then pitches Flashpoint's Thomas Wayne possibility like a boardroom threat. Local audio and aligned ASR establish every route; playback remains the authority.",
    topics: Object.freeze(["Nobody", "Bob Odenkirk", "John Wick", "The Suicide Squad", "James Gunn", "John Cena", "Batista", "Sylvester Stallone", "Leatherface", "David Ayer Cut", "Snyderverse", "Batman", "Ben Affleck", "Michael Keaton", "Flashpoint", "Thomas Wayne", "Godzilla vs Kong", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 3100, end: 3900, label: "NOBODY GETS THE FULL BUS-FIGHT RECEIPT", topic: "Nobody", body: "Play the Nobody review through the bus fight for the clearest film-specific lane in the episode.", playAt: 3100, playEnd: 3900 }),
      hated: Object.freeze({ at: 1300, end: 1700, label: "THE AYER CUT PRECEDENT ARGUMENT", topic: "Snyderverse", body: "Play the Ayer Cut discussion for the night's sharpest question about how much fan pressure can actually move a studio.", playAt: 1300, playEnd: 1700 }),
      wildestDetour: Object.freeze({ at: 3900, end: 4300, label: "POLAR IS OLD-MAN JOHN WICK AND THE BLADDER WINS", topic: "WWAM Up in Ya", body: "Play the Polar comparison and break announcement for the most concentrated detour before the trailer reaction.", playAt: 3900, playEnd: 4300 }),
      lastWord: Object.freeze({ at: 6500, end: 7150, label: "THE BATMAN VOICE VOTE", topic: "Batman canon", body: "Play the Batman ranking for the strongest evergreen debate in the close.", playAt: 6500, playEnd: 7150 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 425, end: 470, name: "Iron Wolf", kind: "Super Chat", note: "Opens the night with a greeting to Mike, Jay, and the Wham Fam." },
        { at: 680, end: 720, name: "Mark Dorman", kind: "chat receipt", note: "Adds a live reaction during the Nobody and Snyderverse setup." },
        { at: 810, end: 850, name: "Restore the Snyderverse", kind: "chat receipt", note: "Brings the fan movement back into the opening news lane." },
        { at: 1135, end: 1185, name: "Edward Santiago", kind: "Super Chat", note: "Asks whether the Snyderverse is actually going to happen." },
        { at: 1610, end: 1660, name: "Brandon Barry", kind: "chat receipt", note: "Suggests John Cena versus Rick Moranis for Friday Night Fights." },
        { at: 1655, end: 1705, name: "Joshua Ayers", kind: "Super Chat", note: "Checks in before the review lane gets underway." },
        { at: 1960, end: 2010, name: "Frank Knight Rises", kind: "chat receipt", note: "Adds another Snyderverse reaction." },
        { at: 2180, end: 2230, name: "Gypsy Warrior", kind: "chat receipt", note: "Says the hosts make Friday better during the Leatherface discussion." },
        { at: 2500, end: 2555, name: "J Dia", kind: "Super Chat", note: "Says Waiting is a favorite and asks about chef work." },
        { at: 2540, end: 2585, name: "CNC Trigger", kind: "chat receipt", note: "Adds a Snyder-versus-studio response." },
        { at: 2650, end: 2700, name: "AJ", kind: "Super Chat", note: "Greets the room before the Batman and Nobody lanes." },
        { at: 2890, end: 2935, name: "Eric James", kind: "chat receipt", note: "Adds a Rob Zombie complaint during the news shuffle." },
        { at: 3040, end: 3090, name: "Austin", kind: "chat receipt", note: "Asks about a movie trailer and a Disney villain." },
        { at: 3180, end: 3230, name: "FAM trailer question", kind: "chat receipt", note: "Asks for the Nobody review before the break." },
        { at: 3860, end: 3910, name: "Ryder", kind: "Super Chat", note: "Calls Polar old-man John Wick and sends love." },
        { at: 4310, end: 4380, name: "Gypsy Warrior", kind: "chat receipt", note: "Suggests a Slenderman bit during the trailer setup." },
        { at: 5570, end: 5620, name: "JT Castle", kind: "chat receipt", note: "Adds a trailer reaction during the replay troubleshooting." },
        { at: 5590, end: 5635, name: "Jeremy Raymond", kind: "chat receipt", note: "Asks for another trailer reaction." },
        { at: 6610, end: 6665, name: "Eric James", kind: "chat receipt", note: "Suggests another movie watch during the Batman debate." },
        { at: 6760, end: 6815, name: "Todd Feyer", kind: "chat receipt", note: "Brings the Martha line back into the Batman argument." },
        { at: 6790, end: 6845, name: "Gypsy Warrior", kind: "chat receipt", note: "Asks whether Christian Bale would return under Snyder." },
        { at: 6860, end: 6915, name: "Sean Davis", kind: "chat receipt", note: "Asks for the hosts' Ben Affleck Batman verdict." },
        { at: 6870, end: 6920, name: "Jeremy Blevin", kind: "chat receipt", note: "Offers an extremely unkind George Clinton Batman take." },
        { at: 7000, end: 7050, name: "Jim Dorsey", kind: "chat receipt", note: "Brings Godzilla versus Kong back into the close." },
        { at: 7100, end: 7150, name: "Jeff Harris", kind: "Super Chat", note: "Praises Keaton's silent-suit Batman and asks for a restore." },
        { at: 7180, end: 7225, name: "Samantha", kind: "chat receipt", note: "Adds a final FAM message before the Flashpoint boardroom joke." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
