(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "S-vZztE1TE4";
  var duration = 5440;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 760, "MORTAL KOMBAT", "THE NAKED-WAIST COUNTDOWN, THE BIRTHDAY, AND THE TRAILER WWAM REFUSED TO SPOIL", "The stream opens with a fake waist-down anatomy contest, a birthday announcement, a Dark Knight promise for Ken Burnett, and a careful explanation of why the hosts dodged Mortal Kombat spoilers all day."),
    H(700, 1260, "WWAM UP IN YA", "ZACK SNYDER, TOASTY, A TEN-THOUSAND-DOLLAR ELECTRIC BILL, AND TEXAS AS A HORROR MOVIE", "Before the trailer, the hosts celebrate the Snyder Cut's worldwide release, riff on the Toasty guy, and turn Texas utility bills, Ted Cruz, and a three-bedroom apartment's $10,000 electric shock into a full rant."),
    H(1220, 1710, "FAM RECEIPT", "THE ENEMA, THE FLORIDA ORANGES, AND COURTNEY'S SEX-PUNISHMENT CHECK-IN", "Mark Dorman says the channel needs an enema, Nightbound92 talks Florida, Courtney warns he may return early from a sex punishment, and the chat turns the birthday stream into a community room before the trailer starts."),
    H(2260, 2580, "MORTAL KOMBAT", "PRESS PLAY: THE TRAILER STARTS WITH BLOOD, MUSIC, AND A VERY SQUIRRELY BOOTH", "The hosts synchronize both screens, announce that the trailer has begun, and immediately react to the gore, violence, music, mythology, and the question of what kind of Scorpion voice the movie is about to give them."),
    H(2580, 3030, "MORTAL KOMBAT", "SUB-ZERO IS GREAT, SCORPION SOUNDS LIKE HE HAS THREE COCKS IN HIS MOUTH", "The reaction turns specific: Sub-Zero is praised, the blood and mythology land, and Scorpion's delivery becomes the first major roast. The booth likes that the trailer finally treats the game as an adult fighting movie."),
    H(3000, 3440, "MORTAL KOMBAT LORE", "JOHNNY CAGE, SKULLS, RAiden, AND THE POWER RANGERS NOSTALGIA TEST", "The hosts remember the Johnny Cage and Scorpion fight, praise the skull effect and Christopher Lambert's Raiden, compare the old movie's charm with the new trailer, and beg for the Immortal song to appear."),
    H(3440, 3900, "WWAM UP IN YA", "WHITE GRAVY, THE PEE BREAK, AND THE STREAM'S WORST POSSIBLE OUT-OF-CONTEXT HEADLINE", "A gravy preference becomes an imagined internet headline, then the hosts announce a pee break before Friday Night Fights. Jake's 'getting wet' line sends the room directly into a filthy second act."),
    H(3900, 4450, "ASK THE CHARACTER", "LEATHERFACE GETS INTERROGATED AND RESPONDS WITH A FACE-SKIN SALES PITCH", "The character lane explodes into a Leatherface interview: why he wears victims' faces, what his house smells like, why his violence is different, and why every answer gets dirtier than the last."),
    H(4450, 4690, "CHARACTER CANON", "THE HOUSE SMELLS LIKE A PIECE OF POSSUM AND KEVIN GETS FIRED", "The Leatherface bit keeps escalating through spit on the camera, Kevin's firing, insults about faces and mouths, and the admission that the character's comedy and murder style may not be for everyone."),
    H(4690, 5050, "JIM CARREY VS ADAM SANDLER", "UNCUT GEMS VERSUS ETERNAL SUNSHINE, WITH CARREY'S SERIOUS ACTING ON TRIAL", "The first serious matchup pits Uncut Gems against Eternal Sunshine. The booth debates Sandler's anxious gambler against Carrey's memory-erasure heartbreak and gives the vote to Uncut Gems, 43–28."),
    H(4950, 5230, "ACTOR DOSSIER", "JIM CARREY AS JOKER, THE NUMBER 23, AND THE ANDY KAUFMAN WARNING LABEL", "The chat asks for Carrey as Joker, the hosts defend The Number 23 and his range, then admit the Andy Kaufman documentary shows a method actor who may have wandered too far into the costume."),
    H(5220, 5440, "JIM CARREY VS ADAM SANDLER", "HAPPY GILMORE VERSUS DUMB AND DUMBER, THE CALL SIGN RETURNS, AND THE VOTE GOES DARK", "The second fight is announced with a Klondike-bar call sign. The hosts pick Dumb and Dumber for the Carrey/Jeff Daniels chemistry, then leave the result suspended in a final burst of movie quotes and chat chaos."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 1710, label: "THE BIRTHDAY ROOM BUILDS A CAGE AROUND THE TRAILER", body: "The stream starts with an obscene fake countdown, a birthday, a Dark Knight commentary promise, and a vow not to spoil Mortal Kombat before the reaction. Zack Snyder, Toasty, Texas utility bills, Ted Cruz, Florida oranges, Mark Dorman's enema diagnosis, and Courtney's sex-punishment check-in all arrive before the trailer. The FAM is not a sidebar; it is the warm-up act that makes the eventual play button feel earned.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 2260, end: 3440, label: "MORTAL KOMBAT FINALLY GETS THE ADULT FIGHTING MOVIE THE BOOTH WANTED", body: "When the trailer starts, the hosts synchronize screens and read it as a promise: blood, violence, mythology, Sub-Zero, and fight choreography that understands the game. Scorpion's voice gets the filthy roast, but the larger verdict is positive. The old Mortal Kombat film and Power Rangers become nostalgia foils, Christopher Lambert's Raiden gets credit, and the booth asks for the Immortal song as the final adult-version victory lap.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 3440, end: 4690, label: "THE PEE BREAK OPENS THE CHARACTER DOOR", body: "A white-gravy joke and a promise to return for Friday Night Fights move the show into its character lane. Leatherface is asked why he wears victims' faces, what his house smells like, and why his violence is different from Michael Myers and Jason. The answers are not sanitized: possum insults, spit, a fired Kevin, a face-skin sales pitch, and the hosts admitting that a different style of comedy and murder may not be everybody's cup of tea. This is the kind of playable character receipt that belongs in Ask the Character, not buried as prose.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 4690, end: 5230, label: "THE FIRST FIGHT IS SERIOUS, THEN THE CHAT PUTS CARREY ON TRIAL", body: "Uncut Gems versus Eternal Sunshine is the serious matchup. The booth praises Sandler's broken gambler while giving the emotional and versatile acting case to Carrey; the chat votes Uncut Gems 43–28. That leads to the Number 23, Andy Kaufman, and Joker questions, where admiration and discomfort sit side by side. The actor discussion is unusually useful because it distinguishes 'strange guy' from 'bad performer' without pretending the documentary is comfortable viewing.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5220, end: 5440, label: "THE NEXT ROUND IS A CARREY/JEFF DANIELS CHEMISTRY TEST", body: "The stream ends by returning to the comedy bracket: Happy Gilmore versus Dumb and Dumber, called with a Klondike-bar signal. The hosts choose Dumb and Dumber because Jeff Daniels pulls a performance out of Carrey that Happy Gilmore cannot quite match. The final seconds are not a clean scoreboard; they are a promise that the fight, the character lane, and the FAM will all continue in the next room.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 1h30m40s Mortal Kombat trailer reaction plus Friday Night Fights upload; local audio, canonical captions, and Whisper ledger checked across the birthday opening, Snyder Cut/Dark Knight promises, Texas utility rant, Mortal Kombat reaction, Sub-Zero and Scorpion read, Johnny Cage and Raiden, Power Rangers/Immortal nostalgia, white-gravy break, Leatherface character interview, Uncut Gems versus Eternal Sunshine, Number 23/Andy Kaufman/Joker actor discussion, and Happy Gilmore versus Dumb and Dumber close",
    evidence: Object.freeze({
      duration: 5440,
      captionWords: 18733,
      captionEvents: 5703,
      captionSpanSeconds: 5441.92,
      captionDurationCoveragePercent: 100,
      captionSha256: "AE0E952BA609578537F5D5C8CFCDFE7775EF60E5CBD08D0C5A10D66AC5AB794A",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "ACC57D7BF447D9FFCE56A7515CA5AFFBCE7ECC59D61E1454FB95564F332AF843",
      asrSegmentCount: 342,
      asrSha256: "sha256:cf508f69f6d15f9a8bc08cac21cec8f777edae8e2010c058dcd334ec3173dc3e",
      asrCoverageStartSeconds: 763,
      asrCoverageEndSeconds: 5368.74,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "MORTAL KOMBAT TRAILER REACTION // JIM CARREY VS ADAM SANDLER",
    badge: "FULL SHOW WIKI // MORTAL KOMBAT GORE, LEATHERFACE INTERVIEW, AND THE FIRST COMEDY FIGHT",
    headline: "SUB-ZERO GETS THE CHEER, LEATHERFACE GETS THE THIRD DEGREE, AND UNCUT GEMS STEALS ONE",
    deck: "A full-audio read of the trailer-reaction night: Mortal Kombat finally gets the adult gore the booth wanted, a Leatherface character interview goes feral, and Uncut Gems beats Eternal Sunshine before the Carrey/Sandler bracket resumes.",
    overview: "This is the Mortal Kombat trailer night with a Friday Night Fights second act. The opening is deliberately WWAM: a fake waist-down contest, birthday panic, a Dark Knight promise for Ken Burnett, and a spoiler-dodging confession before the Mortal Kombat trailer even loads. Zack Snyder's worldwide release, Toasty, Texas electricity bills, Ted Cruz, Florida oranges, Mark Dorman's enema diagnosis, and Courtney's sex-punishment update make the FAM room feel lived-in. The trailer reaction is genuinely positive. The booth praises the blood, violence, music, mythology, Sub-Zero, Johnny Cage/Scorpion material, Christopher Lambert's Raiden, and the idea that an adult fighting-game movie can finally be as gnarly as the game. Scorpion's voice gets a filthy complaint, and the Immortal song becomes the nostalgia wish. A white-gravy pee break opens the character lane: Leatherface is interrogated about face-wearing, his house, his smell, his style of murder, and why he cannot compete with Michael Myers or Jason. The answer is a five-minute playable receipt full of possum insults, spit, a fired Kevin, and a face-skin sales pitch. Then the serious Carrey/Sandler fight starts. Uncut Gems beats Eternal Sunshine 43–28, while the hosts argue that Carrey is the more versatile actor and defend The Number 23, Joker casting, and the Andy Kaufman documentary with a warning label. The closing vote is Happy Gilmore versus Dumb and Dumber, with Carrey/Jeff Daniels chemistry taking the booth's side. Local audio and ASR establish every route; playback remains the authority.",
    topics: Object.freeze(["Mortal Kombat", "Sub-Zero", "Scorpion", "Johnny Cage", "Raiden", "Zack Snyder", "The Dark Knight", "Leatherface", "Ask the Character", "Uncut Gems", "Eternal Sunshine", "Jim Carrey", "Adam Sandler", "Happy Gilmore", "Dumb and Dumber", "The Number 23", "Andy Kaufman", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 2260, end: 3030, label: "THE MORTAL KOMBAT TRAILER DELIVERS", topic: "Trailer reaction", body: "Play the first reaction and the Sub-Zero/Scorpion verdict for the room's biggest clean win: the new movie looks like the adult fighting-game adaptation they wanted.", playAt: 2260, playEnd: 3030 }),
      hated: Object.freeze({ at: 3440, end: 3900, label: "THE WHITE-GRAVY OUT-OF-CONTEXT HEADLINE", topic: "WWAM Up in Ya", body: "Play the gravy argument and pee-break setup for the night's funniest self-inflicted headline before the show changes lanes.", playAt: 3440, playEnd: 3900 }),
      wildestDetour: Object.freeze({ at: 3900, end: 4450, label: "LEATHERFACE HAS A VERY SPECIFIC SKINCARE ROUTINE", topic: "Ask the Character", body: "Play the Leatherface interview for the most unhinged character receipt: face-wearing, possum insults, spit, and a murder philosophy that keeps getting interrupted.", playAt: 3900, playEnd: 4450 }),
      lastWord: Object.freeze({ at: 5220, end: 5440, label: "DUMB AND DUMBER GETS THE CALL SIGN", topic: "Comedy bracket", body: "Play the final call sign and the Carrey/Jeff Daniels chemistry case before the upload cuts into the next fight.", playAt: 5220, playEnd: 5440 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 360, end: 400, name: "Handsome Dan", kind: "chat receipt", note: "Is greeted during the opening bit before the hosts introduce the trailer reaction." },
        { at: 620, end: 665, name: "JT Customs", kind: "Super Chat", note: "Brings the Snyder Cut worldwide release into the opening conversation." },
        { at: 825, end: 875, name: "Ken Burnett", kind: "chat receipt", note: "Receives the Dark Knight commentary promise and remains part of the channel calendar." },
        { at: 1030, end: 1080, name: "Ryan Gilland", kind: "Super Chat", note: "Praises Leto in the Justice League trailer; the booth uses it as a transition into the Snyder discussion." },
        { at: 1270, end: 1320, name: "Mark Dorman", kind: "chat receipt", note: "Says the channel needs an enema and receives the exact kind of agreement the room expects." },
        { at: 1470, end: 1530, name: "Nightbound92", kind: "chat receipt", note: "Sends love from Florida and talks oranges before the vacation tangent." },
        { at: 1540, end: 1580, name: "Courtney", kind: "chat receipt", note: "Says Vanessa will count alone while he performs sex as punishment; the booth asks for a status update." },
        { at: 1740, end: 1790, name: "Sqweep Queen", kind: "chat receipt", note: "Adds the Cancun and wet-shirt-contest joke to the non-partisan Cruz riff." },
        { at: 2180, end: 2220, name: "Christopher Nelson", kind: "chat receipt", note: "Gets pulled into a filthy squeeze joke immediately before the trailer reaction." },
        { at: 4070, end: 4120, name: "Kevin", kind: "chat receipt", note: "Is named during the Leatherface bit and theatrically fired after the camera-spit gag." },
        { at: 4770, end: 4810, name: "Bat Seal", kind: "chat receipt", note: "Suggests Jim Carrey could play Joker in Matt Reeves' Batman." },
        { at: 5050, end: 5100, name: "Haidan Phil", kind: "chat receipt", note: "Calls Carrey cringe and points to the Andy Kaufman documentary, prompting the method-acting defense." },
        { at: 5130, end: 5180, name: "Latrell 316", kind: "chat receipt", note: "Tells Jay to watch Uncut Gems during the serious-movie argument." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
