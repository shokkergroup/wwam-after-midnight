import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "demo",
  "episode-facts-batch3.js",
);
const GENERATED = "2026-07-30";
const EXCERPT_WORD_LIMIT = 16;
const EVIDENCE_TYPE = "youtube-automatic-caption";
const REVIEW_STATE = "machine-surfaced-needs-editor-review";

function anchor(at, phrase, tolerance = 8) {
  return [at, phrase, tolerance];
}

function ranking(
  label,
  at,
  phrase,
  subject,
  position,
  summary,
  support = [],
  extra = {},
) {
  return {
    label,
    anchor: anchor(at, phrase),
    support: support.map(([supportAt, supportPhrase, tolerance]) =>
      anchor(supportAt, supportPhrase, tolerance)
    ),
    summary,
    details: {
      subject,
      position,
      eventKind: "captioned-ranking-placement",
      sequenceState: "parallel-ballots-unresolved",
      ...extra,
    },
  };
}

function agenda(
  label,
  at,
  phrase,
  subject,
  summary,
  support = [],
  extra = {},
) {
  return {
    label,
    anchor: anchor(at, phrase),
    support: support.map(([supportAt, supportPhrase, tolerance]) =>
      anchor(supportAt, supportPhrase, tolerance)
    ),
    summary,
    details: {
      subject,
      agendaKind: "captioned-discussion-door",
      ...extra,
    },
  };
}

function review(
  label,
  at,
  phrase,
  subject,
  summary,
  support = [],
  extra = {},
) {
  return {
    label,
    anchor: anchor(at, phrase),
    support: support.map(([supportAt, supportPhrase, tolerance]) =>
      anchor(supportAt, supportPhrase, tolerance)
    ),
    summary,
    details: {
      subject,
      stance: "mixed",
      momentKind: "captioned-review-observation",
      ...extra,
    },
  };
}

function sync(
  label,
  at,
  phrase,
  subject,
  summary,
  support = [],
  extra = {},
) {
  return {
    label,
    anchor: anchor(at, phrase),
    support: support.map(([supportAt, supportPhrase, tolerance]) =>
      anchor(supportAt, supportPhrase, tolerance)
    ),
    summary,
    details: {
      subject,
      cueKind: "captioned-commentary-beat",
      ...extra,
    },
  };
}

const TARGETS = Object.freeze([
  {
    id: "LiTEaN8mpl8",
    format: "watchalong-commentary",
    specificKey: "syncCues",
    minimumFacts: 12,
    auditOverlapPercent: 13,
    omissions: [
      "The play cue is source-exact, but disc edition and viewer-side offset are not independently certified.",
      "Character and host performance ownership remain unset because the caption track is not diarized.",
    ],
  },
  {
    id: "bBp6tSU8kAM",
    format: "ranking-list",
    specificKey: "rankingEvents",
    minimumFacts: 16,
    auditOverlapPercent: 18,
    omissions: [
      "Parallel ballot owners are not assigned because the caption track is not diarized.",
      "Placements with an unintelligible title or an on-screen-only result are omitted.",
    ],
  },
  {
    id: "nAjkqsn_JsQ",
    format: "news-agenda",
    specificKey: "agendaItems",
    minimumFacts: 15,
    auditOverlapPercent: 21,
    omissions: [
      "News and rumor items are source-local discussion doors, not independently fact-checked reporting.",
      "Character bits and audience prompts are not assigned to a performer or speaker.",
    ],
  },
  {
    id: "Var4sSlt-dk",
    format: "news-agenda",
    specificKey: "agendaItems",
    minimumFacts: 13,
    auditOverlapPercent: 21,
    omissions: [
      "The mixed-format livestream is represented as a chronological discussion agenda, not a single final verdict.",
      "Audience messages, host replies, and character bits are not assigned to named speakers.",
    ],
  },
  {
    id: "WKs1uPGMQvw",
    format: "review-desk",
    specificKey: "reviewMoments",
    minimumFacts: 16,
    auditOverlapPercent: 22,
    omissions: [
      "Review observations remain source-local reactions and are not external facts about Scream 7.",
      "Audience comments and host responses are not assigned to individuals without a reviewed voice pass.",
    ],
  },
  {
    id: "bK5e-m1HUjs",
    format: "ranking-list",
    specificKey: "rankingEvents",
    minimumFacts: 20,
    auditOverlapPercent: 24,
    omissions: [
      "The generic livestream title masks a Top 10 Movies of 1990 segment; the tape, not the upload title, controls the format.",
      "Parallel ballot owners are unresolved, and a corrected Tango & Cash placement is not retained as a final result.",
    ],
  },
  {
    id: "kl8j1AichcI",
    format: "ranking-list",
    specificKey: "rankingEvents",
    minimumFacts: 20,
    auditOverlapPercent: 24,
    omissions: [
      "Parallel ballot owners are not assigned because the caption track is not diarized.",
      "The list is treated as captioned personal favorites, not an objective best-of-decade result.",
    ],
  },
  {
    id: "qRcoPW7FLaQ",
    format: "ranking-list",
    specificKey: "rankingEvents",
    minimumFacts: 13,
    auditOverlapPercent: 24,
    omissions: [
      "Only final placements made intelligible by the closing spoken readout are represented.",
      "The browser pack does not claim that the on-screen ordering was independently inspected.",
    ],
  },
  {
    id: "AGL5yUH5Xy4",
    format: "news-agenda",
    specificKey: "agendaItems",
    minimumFacts: 17,
    auditOverlapPercent: 25,
    omissions: [
      "Film-history claims and current-news references are preserved as source-local discussion, not external verification.",
      "The physical-media mini-ranking remains a discussion item because this upload is a broader hangout.",
    ],
  },
  {
    id: "e7Guc5jtHQg",
    format: "news-agenda",
    specificKey: "agendaItems",
    minimumFacts: 14,
    auditOverlapPercent: 25,
    replacementFor: "fUCQoxTwKqo",
    omissions: [
      "This source replaces an already-typed pilot source to keep Batch 3 non-overlapping.",
      "News, remake, and industry claims remain source-local discussion doors pending external verification.",
    ],
  },
]);

const FACT_CONFIG = Object.freeze({
  LiTEaN8mpl8: {
    syncCues: [
      sync(
        "SYNC INSTRUCTIONS",
        50,
        "ready to press play",
        "Viewer sync setup",
        "The commentary explains that viewers should pause their copy and wait for the spoken play cue.",
        [[58, "Pause this"], [59, "when I say touch"]],
        { cueKind: "captioned-sync-instruction" },
      ),
      sync(
        "PLAY CUE",
        61,
        "press play",
        "Jason X playback start",
        "The commentary gives its explicit start cue for the standard edition of Jason X.",
        [[63, "touching"], [66, "It's live"]],
        { cueKind: "captioned-play-cue" },
      ),
      sync(
        "JASON IN SPACE // EXPECTATION SET",
        91,
        "this movie is bad",
        "Jason in outer space",
        "The opening read calls the movie bad but credits it with trying and having a story.",
        [[93, "they tried"], [95, "decent little story"], [97, "Jason is in literally outer"]],
        { cueKind: "captioned-commentary-verdict" },
      ),
      sync(
        "TOP-FIVE KILL PREVIEW",
        1880,
        "best kills",
        "Upcoming Jason X kill",
        "The commentary flags an approaching kill as one of the franchise's five best.",
        [[1881, "entire"], [1886, "top five"]],
        { cueKind: "captioned-commentary-forecast" },
      ),
      sync(
        "JASON GOES TO HELL COMPARISON",
        2041,
        "Jason Goes to",
        "Jason X versus Jason Goes to Hell",
        "The commentary rejects Jason Goes to Hell while saying Jason X is more coherently assembled.",
        [[2045, "movie"], [2050, "actually put together"]],
        { cueKind: "captioned-commentary-verdict" },
      ),
      sync(
        "VR SIMULATION CHECKPOINT",
        2329,
        "VR simulation",
        "Virtual-reality sequence",
        "A timestamp check identifies the virtual-reality sequence as the current movie position.",
        [[2330, "Jason"], [2334, "This isn't a game"]],
        { cueKind: "captioned-position-check" },
      ),
      sync(
        "MID-MOVIE RESYNC",
        2738,
        "pause it",
        "Commentary resynchronization",
        "The commentary pauses for a catch-up and gives a fresh go cue.",
        [[2739, "catch up"], [2740, "ready Go"]],
        { cueKind: "captioned-resync-cue" },
      ),
      sync(
        "JUMP-SCARE HIT",
        2905,
        "good jump scare",
        "Jason X jump scare",
        "The commentary explicitly marks a jump scare as effective.",
        [[2908, "what I'm talking about"]],
        { cueKind: "captioned-commentary-reaction" },
      ),
      sync(
        "KM FIGHT ENERGY",
        4073,
        "KILLING IT",
        "KM action sequence",
        "The commentary praises the action beat and calls the surrounding character work effective.",
        [[4079, "girl was badass"], [4082, "pretty much badass"]],
        { cueKind: "captioned-commentary-reaction" },
      ),
      sync(
        "UBER JASON ARRIVES",
        4340,
        "Jason super Jason",
        "Uber Jason transformation",
        "The commentary announces the approach of the Uber Jason transformation.",
        [[4347, "little bugs"], [4349, "help this serial"]],
        { cueKind: "captioned-commentary-forecast" },
      ),
      sync(
        "NEW MASK DESIGN",
        4487,
        "new mask",
        "Uber Jason design",
        "The commentary praises Jason's redesigned mask after the transformation.",
        [[4489, "great"], [4493, "new mask"]],
        { cueKind: "captioned-commentary-reaction" },
      ),
      sync(
        "SLEEPING-BAG CALLBACK",
        5075,
        "SLEEPING BAG",
        "Sleeping-bag sequence",
        "The commentary recognizes the sleeping-bag scene as a throwback kill.",
        [[5089, "cool throwback scene"], [5091, "sleeping bag kill"]],
        { cueKind: "captioned-commentary-callback" },
      ),
      sync(
        "COMMENTARY WRAP",
        5315,
        "Jason X is done",
        "Jason X commentary close",
        "The closing remarks mark Jason X complete and preview the remaining franchise commentaries.",
        [[5319, "remake"], [5325, "Freddy versus Jason"]],
        { cueKind: "captioned-commentary-close" },
      ),
    ],
  },
  bBp6tSU8kAM: {
    rankingEvents: [
      ranking(
        "1994 LIST SCOPE",
        1163,
        "top 10 films",
        "Top 10 films of 1994",
        null,
        "The captions define the central segment as a Top 10 films of 1994 ranking.",
        [],
        { eventKind: "captioned-ranking-scope", sequenceState: "shared-format" },
      ),
      ranking(
        "LITTLE GIANTS // #10",
        3581,
        "my number 10",
        "Little Giants",
        10,
        "One unresolved ballot places Little Giants at number 10.",
        [[3585, "little giants"]],
      ),
      ranking(
        "THE LION KING // #10",
        3722,
        "my number 10",
        "The Lion King",
        10,
        "Another unresolved ballot places The Lion King at number 10.",
        [[3726, "children's movie"], [3727, "Lion King"]],
      ),
      ranking(
        "INTERVIEW WITH THE VAMPIRE // #9",
        3998,
        "number Nine",
        "Interview with the Vampire",
        9,
        "The captions place Interview with the Vampire at number nine in one unresolved ballot.",
        [[4000, "Interview with the Vampire"]],
      ),
      ranking(
        "FORREST GUMP // #9",
        4315,
        "number nine",
        "Forrest Gump",
        9,
        "The captions place Forrest Gump at number nine in another unresolved ballot.",
        [[4323, "Force Gump"]],
      ),
      ranking(
        "PULP FICTION // #8",
        4465,
        "number eight",
        "Pulp Fiction",
        8,
        "The captions place Pulp Fiction at number eight.",
        [[4465, "pop fiction"], [4476, "Tarantino"]],
      ),
      ranking(
        "SPEED // #7",
        4634,
        "number seven",
        "Speed",
        7,
        "A number-seven prompt is answered with Speed.",
        [[4644, "above 50"], [4645, "speed"]],
      ),
      ranking(
        "THE CROW // #6",
        5353,
        "number six",
        "The Crow",
        6,
        "The captions place The Crow at number six.",
        [[5361, "crow"]],
      ),
      ranking(
        "DUMB AND DUMBER // #5",
        5475,
        "number five",
        "Dumb and Dumber",
        5,
        "One unresolved ballot places Dumb and Dumber at number five.",
        [[5479, "dumb and"], [5484, "best Jim Carrey"]],
      ),
      ranking(
        "TRUE LIES // #5",
        5690,
        "number five",
        "True Lies",
        5,
        "Another unresolved ballot places True Lies at number five.",
        [[5704, "James"], [5709, "career"]],
      ),
      ranking(
        "AIRHEADS // #4",
        6776,
        "number four",
        "Airheads",
        4,
        "The captions place Airheads at number four.",
        [[6781, "AirHeads"], [6786, "underrated"]],
      ),
      ranking(
        "DUMB AND DUMBER // #3",
        7132,
        "number three",
        "Dumb and Dumber",
        3,
        "The captions place Dumb and Dumber at number three in another ballot.",
        [[7137, "dumb and dumber"], [7147, "quotable"]],
      ),
      ranking(
        "TRUE LIES // #3",
        7324,
        "number three",
        "True Lies",
        3,
        "The captions place True Lies at number three.",
        [[7328, "lies"], [7330, "True Lies"]],
      ),
      ranking(
        "SPEED // #2",
        7588,
        "number two",
        "Speed",
        2,
        "The captions place Speed at number two.",
        [[7588, "speed"], [7615, "one of the best"]],
      ),
      ranking(
        "ACE VENTURA // #1",
        7957,
        "Ventura is my number one",
        "Ace Ventura: Pet Detective",
        1,
        "One unresolved ballot names Ace Ventura as its number-one movie of 1994.",
        [[7963, "favorite Jim Carrey"]],
      ),
      ranking(
        "THE CROW // #1",
        8215,
        "my number one",
        "The Crow",
        1,
        "Another unresolved ballot closes with The Crow at number one.",
        [[8232, "Bron Lee"], [8241, "Captured Moment"], [8243, "music"]],
      ),
    ],
  },
  nAjkqsn_JsQ: {
    agendaItems: [
      agenda(
        "SPIDER-MAN REBOUND RUMOR",
        240,
        "Spider-Man",
        "Rumored Spider-Man 4 title",
        "The show treats Spider-Man: Rebound as an unverified title rumor and tells listeners to be skeptical.",
        [[243, "possible leaked name"], [250, "grain of salt"], [254, "apparently"]],
        { agendaKind: "captioned-rumor-discussion" },
      ),
      agenda(
        "VENOM EARLY WORD",
        309,
        "new Venom movie",
        "Venom release discussion",
        "The show notes positive early word about the new Venom movie while expressing little urgency to see it.",
        [[310, "apparently really good"], [313, "still don't care"]],
      ),
      agenda(
        "PREDATOR WIN-LOSS DEBATE",
        496,
        "buddies drop down",
        "Predator movie outcomes",
        "A franchise detour debates whether the Predators actually win against human opponents.",
        [[502, "never win"], [506, "Alien versus"], [510, "Predator 2"]],
      ),
      agenda(
        "SCREAM 7 // RETURN TO ROOTS",
        2524,
        "return to the",
        "Scream 7 legacy-cast direction",
        "The Scream 7 discussion supports a return-to-roots direction with Neve Campbell and Courteney Cox.",
        [[2528, "roots scream"], [2530, "Nev"], [2531, "Courtney Cox"]],
      ),
      agenda(
        "STU SURVIVAL PUSHBACK",
        2539,
        "reboot the entire",
        "Stu Macher return",
        "The show argues that a literal Stu survival would strain Scream's grounded rules.",
        [[2554, "goes against"], [2558, "well he might have"], [2559, "survived"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "ROB ZOMBIE HALLOWEEN II DEFENSE",
        3163,
        "Rob Zombies",
        "Rob Zombie's Halloween II",
        "The show offers a limited defense of Rob Zombie's Halloween II, including its physically imposing Michael.",
        [[3166, "big scary"], [3177, "actors"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "NINJA TURTLE QUESTION",
        3267,
        "favorite Ninja",
        "Favorite Ninja Turtle",
        "An audience question opens a Teenage Mutant Ninja Turtles preference discussion.",
        [[3271, "Leonardo"], [3273, "whole group together"]],
        { agendaKind: "captioned-audience-question" },
      ),
      agenda(
        "STU POLL // 80 PERCENT",
        4007,
        "want Stu",
        "Audience poll on Stu",
        "The captions report that 80 percent of the live poll wants Stu alive.",
        [[4009, "80%"], [4010, "audience"], [4012, "Stu"]],
        { agendaKind: "captioned-live-poll", resultText: "80 percent yes" },
      ),
      agenda(
        "GREEN ARROW FANTASY CAST",
        4933,
        "Green Arrow",
        "Green Arrow casting",
        "A superhero casting riff selects Chuck Norris as Green Arrow.",
        [[4935, "Chuck"], [4937, "funny"]],
        { agendaKind: "captioned-fantasy-casting" },
      ),
      agenda(
        "TERRIFIER 3 VIEWER REPORT",
        5540,
        "terrifier 3",
        "Terrifier 3 audience message",
        "A viewer's Terrifier 3 message opens a Terminator-title mix-up and film reaction discussion.",
        [[5547, "stop saying T3"], [5551, "Terminator 3"]],
        { agendaKind: "captioned-audience-message" },
      ),
      agenda(
        "FAVORITE HORROR FRANCHISE",
        5604,
        "favorite horror",
        "Favorite horror film and franchise",
        "An audience question distinguishes a favorite individual horror film from a favorite franchise.",
        [[5607, "singular favorite"], [5619, "Halloween"], [5621, "favorite franchise"]],
        { agendaKind: "captioned-audience-question" },
      ),
      agenda(
        "INSIDIOUS LIVE EXPERIENCE",
        5976,
        "don't really say",
        "Insidious live experience",
        "The show describes a traveling Insidious theater experience while noting that details remain vague.",
        [[5980, "select"], [5982, "cities"], [5984, "it's a live"], [5986, "experience"]],
      ),
      agenda(
        "NIGHTMARE 4K STEELBOOK",
        7275,
        "Nightmare",
        "A Nightmare on Elm Street 4K",
        "An audience message praises the Nightmare on Elm Street 4K steelbook and starts a restoration discussion.",
        [[7279, "4K"], [7280, "steelbook"], [7281, "looks incredible"]],
        { agendaKind: "captioned-audience-message" },
      ),
      agenda(
        "HITCHCOCK INFLUENCE",
        8194,
        "Hitchcock's overrated",
        "Alfred Hitchcock's horror influence",
        "The show rejects the idea that Hitchcock is overrated and credits his scenes with setting later horror patterns.",
        [[8196, "Hitchcock was the first"], [8197, "guy"], [8200, "every other horror director"], [8204, "set the pace"]],
        { agendaKind: "captioned-film-history-take" },
      ),
      agenda(
        "EXORCIST AND FINAL DESTINATION PLANS",
        9001,
        "this Saturday",
        "Upcoming watchalong schedule",
        "The closing agenda announces an Exorcist watch stream and a Final Destination franchise marathon.",
        [[9004, "Exorcist"], [9007, "next Wednesday"], [9010, "Final Destination"]],
        { agendaKind: "captioned-programming-note" },
      ),
    ],
  },
  "Var4sSlt-dk": {
    agendaItems: [
      agenda(
        "X-MEN '97 EARLY READ",
        719,
        "really well done",
        "X-Men '97",
        "The show says X-Men '97 is well done while noting that the viewing is only through episode three.",
        [[723, "episode three"], [728, "gets even crazier"]],
        { agendaKind: "captioned-series-reaction" },
      ),
      agenda(
        "WOLVERINE RESERVATION",
        853,
        "only thing I don't",
        "Wolverine in X-Men '97",
        "The show identifies Wolverine as its main reservation about the series so far.",
        [[857, "don't love Wolverine"]],
        { agendaKind: "captioned-series-critique" },
      ),
      agenda(
        "TOP GUN 4K REACTION",
        1313,
        "4K for the first time",
        "Top Gun on 4K",
        "A physical-media detour says the Top Gun 4K presentation was striking enough to inspire more viewing.",
        [[1315, "coming of the Lord"], [1320, "blown away"]],
      ),
      agenda(
        "ALIEN ENCOUNTER QUESTION",
        2161,
        "seen anything strange",
        "Alien encounters",
        "An audience prompt opens a joking discussion of whether the hosts have seen anything alien.",
        [[2184, "alien"], [2185, "scare"]],
        { agendaKind: "captioned-audience-question" },
      ),
      agenda(
        "CORMAN FANTASTIC FOUR",
        3576,
        "1994 Fantastic 4",
        "Roger Corman's Fantastic Four",
        "An audience message argues that the unreleased 1994 Fantastic Four deserved release over Captain America.",
        [[3580, "Roger Corman"], [3583, "released"], [3585, "Captain America"]],
        { agendaKind: "captioned-audience-message" },
      ),
      agenda(
        "LONGLEGS TRAILER QUEUE",
        3593,
        "watch the long legs trailer",
        "Longlegs trailer",
        "The stream explicitly queues the Longlegs trailer for discussion.",
        [],
        { agendaKind: "captioned-trailer-door" },
      ),
      agenda(
        "PRACTICAL-EFFECTS ARGUMENT",
        4649,
        "forced you to be creative",
        "Practical effects and Jurassic Park",
        "The show argues that technical limits forced creative storytelling and uses Jurassic Park as an example.",
        [[4652, "multi-billion"], [4654, "CG"], [4658, "Jurassic Park"]],
        { agendaKind: "captioned-craft-take" },
      ),
      agenda(
        "UNMADE JASON SCRIPT",
        5724,
        "unmade Jason scripts",
        "Unmade Friday the 13th script",
        "The show recalls an unmade Jason script involving military and police forces.",
        [[5730, "military"], [5732, "cops"], [5734, "mowed through"]],
      ),
      agenda(
        "COREY FELDMAN MOVIE SEARCH",
        5934,
        "Cory Feldman",
        "Corey Feldman school movie",
        "A viewer-request memory tries to identify a darker Corey Feldman school movie.",
        [[5936, "school"], [5942, "rebellion"], [5947, "way darker"]],
        { agendaKind: "captioned-title-search" },
      ),
      agenda(
        "TERMINATOR AS SLASHER",
        7034,
        "more slasher feel",
        "The Terminator as horror",
        "The show supports a more horror-driven Terminator and calls the first film a slasher in key ways.",
        [[7039, "100"], [7042, "Terminator 1"], [7044, "horror movie"], [7051, "slasher film"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "POST-T2 MISSING THREAT",
        7161,
        "human being against",
        "Terminator sequels after T2",
        "The show says later Terminator films lost the original human-versus-unstoppable-threat draw.",
        [[7162, "unsolvable thing"], [7166, "missing"], [7168, "Terminator 2"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "SLASHER BREAKING POINTS",
        8220,
        "top five places",
        "Where slasher franchises went wrong",
        "The stream develops a possible ranking about the moments major slasher franchises went wrong.",
        [[8227, "Freddy's Dead"], [8237, "scream"]],
        { agendaKind: "captioned-format-pitch" },
      ),
      agenda(
        "BLACK PHONE OVERPRAISE",
        9007,
        "problem with the box",
        "The Black Phone",
        "The show argues that The Black Phone was treated as more exceptional than its average-movie assessment.",
        [[9011, "black phone"], [9012, "average movies"], [9015, "give away"]],
        { agendaKind: "captioned-film-take" },
      ),
      agenda(
        "WOLVERINE PERFORMANCE RELEASE",
        9800,
        "love this character",
        "Hugh Jackman's Wolverine",
        "The late discussion says the performer always wanted a harsher Wolverine and can finally play that version.",
        [[9803, "studios"], [9809, "character to be Wolverine"], [9814, "could do it"]],
        { agendaKind: "captioned-performance-take" },
      ),
    ],
  },
  WKs1uPGMQvw: {
    reviewMoments: [
      review(
        "SPOILER GATE",
        46,
        "all the spoilers",
        "Scream 7 spoiler review",
        "The opening explicitly establishes a full-spoiler Scream 7 discussion.",
        [[61, "cover that"]],
        { stance: "format", momentKind: "captioned-spoiler-boundary" },
      ),
      review(
        "STU THEORY // INTAKE FORM",
        409,
        "ending of Seven",
        "Stu Macher survival theory",
        "The review argues that the psychiatric-hospital intake-form detail leaves room for a Stu theory.",
        [[413, "Scream 8"], [426, "Stu's body"], [428, "intake form"]],
        { stance: "theory", momentKind: "captioned-review-theory" },
      ),
      review(
        "STU MOTIVE BOARD",
        526,
        "Scream 7",
        "Stu Macher motive",
        "The review says the broadcast taunt and AI likeness could supply a future motive for Stu.",
        [[531, "Gail called him"], [536, "spoke to Stu"], [546, "AI version"]],
        { stance: "theory", momentKind: "captioned-review-theory" },
      ),
      review(
        "AI STU UPSIDE",
        727,
        "rather have it be",
        "AI Stu sequence",
        "The review prefers a real return but credits the AI device with letting Matthew Lillard play Stu again.",
        [[732, "AI idea"], [734, "genius"], [736, "Matthew Lillard"]],
        { stance: "positive-mixed", momentKind: "captioned-review-highlight" },
      ),
      review(
        "RANKING HELD PENDING REWATCH",
        1291,
        "don't know my",
        "Scream 7 franchise ranking",
        "The review withholds a final franchise placement until Scream 5 can be rewatched.",
        [[1297, "struggling"], [1303, "Five"], [1305, "seven"]],
        { stance: "unresolved", momentKind: "captioned-ranking-boundary" },
      ),
      review(
        "KILLER REVEAL LOW POINT",
        1322,
        "reveal in this one",
        "Scream 7 killer reveal",
        "The review says it loves the movie while judging the killer reveal as possibly the franchise's weakest.",
        [[1324, "worst"], [1326, "reveal"]],
        { stance: "negative-mixed", momentKind: "captioned-review-critique" },
      ),
      review(
        "FANDOM-NUANCE EXPLANATION",
        1816,
        "nuance",
        "Legacy Scream details",
        "The review ties its affection to details that recall older films without explicitly announcing themselves.",
        [[1818, "older movies"], [1828, "where my love"]],
        { stance: "positive", momentKind: "captioned-review-rationale" },
      ),
      review(
        "MOTION-DETECTOR GAG",
        2156,
        "love that guy",
        "Ghostface motion-detector scene",
        "The review praises the actor and laughs at Ghostface mimicking a motion detector.",
        [[2164, "perfect for Scream"], [2170, "Ghost Face"], [2177, "motion detector"]],
        { stance: "positive", momentKind: "captioned-review-highlight" },
      ),
      review(
        "AI CAMEO CRITIQUE",
        2548,
        "AI cameo",
        "Scream 7 AI cameos",
        "The review agrees that the AI cameos disappoint, except for its positive response to Stu.",
        [[2553, "agree"], [2556, "apart from"], [2557, "Steu was great"]],
        { stance: "negative-mixed", momentKind: "captioned-review-critique" },
      ),
      review(
        "WRITER-REVEAL CONCERN",
        2808,
        "series needs a new writer",
        "Recent Scream killer reveals",
        "A writing discussion criticizes the last three killer reveals and wonders what Kevin Williamson would do alone.",
        [[2810, "killer reveals"], [2822, "Kevin Williamson"]],
        { stance: "negative", momentKind: "captioned-review-critique" },
      ),
      review(
        "TRAILER OVEREXPOSURE",
        4226,
        "way too much",
        "Scream 7 trailers",
        "The review says later trailers and clips undercut its earlier praise for spoiler restraint.",
        [[4239, "praised it"], [4243, "not spoil"], [4249, "second trailer"]],
        { stance: "negative", momentKind: "captioned-review-critique" },
      ),
      review(
        "GHOSTFACE PHOTOGRAPHY",
        5022,
        "Ghostface",
        "Ghostface cinematography",
        "The review praises how Ghostface was photographed despite an earlier trailer-design reservation.",
        [[5026, "shot him really well"], [5029, "trailers"], [5042, "really dug"]],
        { stance: "positive", momentKind: "captioned-review-highlight" },
      ),
      review(
        "CAMERA-ENGULFING ENTRANCE",
        5083,
        "encompasses the camera",
        "Ghostface entrance",
        "The review calls a camera-engulfing Ghostface entrance spooky and reminiscent of the first movie.",
        [[5093, "spooky"], [5097, "first movie"]],
        { stance: "positive", momentKind: "captioned-review-highlight" },
      ),
      review(
        "WES CRAVEN FEELING",
        5809,
        "Scream one",
        "Opening sequence",
        "The review says the opening evoked Scream and felt as though Wes Craven were behind the camera.",
        [[5811, "Wes"], [5820, "opening"]],
        { stance: "positive", momentKind: "captioned-review-highlight" },
      ),
      review(
        "SCREAM 6 DEATH COMPARISON",
        7001,
        "death in six",
        "Scream 7 kill design",
        "The review rejects a claim that a Scream 6 death beats every Scream 7 death and favors a tighter knife beat.",
        [[7003, "disagree"], [7014, "take that quick"], [7018, "his head and turning"]],
        { stance: "positive-mixed", momentKind: "captioned-review-comparison" },
      ),
      review(
        "SIDNEY FOCUS // RUNTIME COST",
        7408,
        "I loved",
        "Sidney-centered story",
        "The review loves the focus on Sidney while warning that the approach still consumes limited runtime.",
        [[7411, "focused on"], [7419, "clock"]],
        { stance: "positive-mixed", momentKind: "captioned-review-tradeoff" },
      ),
      review(
        "FAVORITE NEW SONG",
        9084,
        "favorite Scream Seven song",
        "Rearranging Scars",
        "The review names Rearranging Scars as its favorite new Scream 7 song outside Sidney's returning theme.",
        [[9085, "Sydney's Lament"], [9088, "Rearranging"], [9094, "best song"]],
        { stance: "positive", momentKind: "captioned-review-highlight" },
      ),
      review(
        "CLOSING TREAT VERDICT",
        10374,
        "those people loved",
        "Overall Scream 7 verdict",
        "The closing read acknowledges shared problems but calls the overall movie a treat.",
        [[10379, "same problems"], [10384, "overall"], [10385, "treat"]],
        { stance: "positive-mixed", momentKind: "captioned-review-verdict" },
      ),
    ],
  },
  "bK5e-m1HUjs": {
    rankingEvents: [
      ranking(
        "1990 LIST SCOPE",
        3627,
        "top",
        "Top 10 movies of 1990",
        null,
        "The generic livestream turns into parallel Top 10 Movies of 1990 ballots.",
        [[3627, "movies of"]],
        { eventKind: "captioned-ranking-scope", sequenceState: "parallel-ballots-unresolved" },
      ),
      ranking(
        "ERNEST GOES TO JAIL // #10",
        3834,
        "number 10",
        "Ernest Goes to Jail",
        10,
        "One unresolved 1990 ballot places Ernest Goes to Jail at number 10.",
        [[3840, "Ernest Goes to Jail"]],
      ),
      ranking(
        "THE EXORCIST III // #10",
        3993,
        "number 10",
        "The Exorcist III",
        10,
        "Another unresolved ballot places The Exorcist III at number 10.",
        [[4000, "exorcist part three"]],
      ),
      ranking(
        "THE EXORCIST III // #9",
        4072,
        "number nine",
        "The Exorcist III",
        9,
        "The Exorcist III also appears at number nine in the parallel ballot.",
        [[4073, "Exorcist 3"]],
      ),
      ranking(
        "MARKED FOR DEATH // #9",
        4252,
        "number nine",
        "Marked for Death",
        9,
        "The captions place Marked for Death at number nine.",
        [[4257, "Mark"], [4262, "Steven Seagal"]],
      ),
      ranking(
        "TREMORS // #8",
        4379,
        "number eight",
        "Tremors",
        8,
        "The captions place Tremors at number eight.",
        [[4381, "trimmers"], [4394, "this was like the last"], [4396, "straw for Kevin Bacon"]],
      ),
      ranking(
        "ROBOCOP 2 // #8",
        4525,
        "number eight",
        "RoboCop 2",
        8,
        "The captions place RoboCop 2 at number eight in another ballot.",
        [[4531, "robocock to"]],
      ),
      ranking(
        "FLATLINERS // #7",
        4715,
        "number seven",
        "Flatliners",
        7,
        "The captions place Flatliners at number seven.",
        [[4721, "flatliners"], [4723, "kefir"]],
      ),
      ranking(
        "TOTAL RECALL // #7",
        4894,
        "number seven",
        "Total Recall",
        7,
        "Another unresolved ballot places Total Recall at number seven.",
        [[4903, "Total"], [4906, "Recall"]],
      ),
      ranking(
        "DARKMAN // #6",
        5118,
        "number six",
        "Darkman",
        6,
        "The captions place Darkman at number six.",
        [[5121, "Sam classic"], [5123, "Darkman"]],
      ),
      ranking(
        "LIONHEART // #6",
        5440,
        "number six",
        "Lionheart",
        6,
        "Another unresolved ballot places Lionheart at number six.",
        [[5447, "lionard"], [5451, "Claud"]],
      ),
      ranking(
        "KINDERGARTEN COP // #5",
        5785,
        "number five",
        "Kindergarten Cop",
        5,
        "The captions place Kindergarten Cop at number five.",
        [[5792, "Kindergarten Cop"]],
      ),
      ranking(
        "ROBOCOP 2 // #5",
        6002,
        "number five",
        "RoboCop 2",
        5,
        "RoboCop 2 also appears at number five in the parallel ballot.",
        [[6011, "RoboCop"], [6013, "2"]],
      ),
      ranking(
        "TREMORS // #4",
        6203,
        "number four",
        "Tremors",
        4,
        "Tremors also appears at number four in the parallel ballot.",
        [[6206, "trimmers"], [6209, "horror comedies"]],
      ),
      ranking(
        "TOTAL RECALL // #4",
        6275,
        "number fourth",
        "Total Recall",
        4,
        "A number-four prompt is answered with Total Recall.",
        [[6279, "Total Recall"]],
      ),
      ranking(
        "HARD TO KILL // #3",
        6661,
        "number three",
        "Hard to Kill",
        3,
        "The captions place Hard to Kill at number three.",
        [[6671, "hard to kill"]],
      ),
      ranking(
        "TEENAGE MUTANT NINJA TURTLES // #3",
        6777,
        "number three",
        "Teenage Mutant Ninja Turtles",
        3,
        "Another unresolved ballot places Teenage Mutant Ninja Turtles at number three.",
        [[6779, "Mutant Ninja"], [6780, "Turtles"]],
      ),
      ranking(
        "TANGO & CASH // REMOVED #2",
        7270,
        "number two",
        "Tango & Cash",
        2,
        "Tango & Cash is proposed at number two before the tape catches the year mismatch and replaces it.",
        [[7274, "Tango"], [7282, "double check"]],
        { eventKind: "captioned-ranking-correction", sequenceState: "removed-on-tape" },
      ),
      ranking(
        "ARACHNOPHOBIA // #1",
        7381,
        "number one",
        "Arachnophobia",
        1,
        "One unresolved ballot names Arachnophobia as its number-one film of 1990.",
        [[7393, "Arachnophobia"]],
      ),
      ranking(
        "NIGHT OF THE LIVING DEAD // REPLACEMENT #2",
        7436,
        "my number one",
        "Night of the Living Dead (1990)",
        2,
        "After the Tango & Cash correction, the captions substitute the 1990 Night of the Living Dead.",
        [[7446, "Living Dead"], [7447, "Tom"]],
        { eventKind: "captioned-ranking-correction", sequenceState: "replacement-on-tape" },
      ),
      ranking(
        "GOODFELLAS // #1",
        7534,
        "number one",
        "Goodfellas",
        1,
        "Another unresolved ballot closes with Goodfellas at number one.",
        [[7537, "greatest Mafia"]],
      ),
    ],
  },
  kl8j1AichcI: {
    rankingEvents: [
      ranking(
        "DECADE LIST SCOPE",
        2724,
        "number 10",
        "Favorite horror movies from 2012 to 2022",
        null,
        "The captions define parallel personal-favorite horror lists covering 2012 through 2022.",
        [[2734, "horror movies"], [2739, "difficult list"]],
        { eventKind: "captioned-ranking-scope", sequenceState: "parallel-ballots-unresolved" },
      ),
      ranking(
        "THE HOUSE THAT JACK BUILT // #10",
        2794,
        "number 10",
        "The House That Jack Built",
        10,
        "One unresolved ballot places The House That Jack Built at number 10.",
        [[2799, "house"], [2801, "jack built"]],
      ),
      ranking(
        "THE DEVIL'S CANDY // #10",
        2894,
        "number 10",
        "The Devil's Candy",
        10,
        "Another unresolved ballot places The Devil's Candy at number 10.",
        [[2896, "devil's candy"]],
      ),
      ranking(
        "HALLOWEEN (2018) // #9",
        2981,
        "number nine",
        "Halloween (2018)",
        9,
        "The captions place Halloween (2018) at number nine.",
        [[2983, "2018"], [2988, "Halloween channel"]],
      ),
      ranking(
        "THE AUTOPSY OF JANE DOE // #9",
        3079,
        "number nine",
        "The Autopsy of Jane Doe",
        9,
        "Another unresolved ballot places The Autopsy of Jane Doe at number nine.",
        [[3087, "number nine"], [3091, "autopsy"]],
      ),
      ranking(
        "DOCTOR SLEEP // #8",
        3238,
        "dr sleep",
        "Doctor Sleep",
        8,
        "The captions place Doctor Sleep at number eight.",
        [[3238, "number eight"], [3244, "people sleep"]],
      ),
      ranking(
        "BONE TOMAHAWK // #8",
        3353,
        "number eight",
        "Bone Tomahawk",
        8,
        "Another unresolved ballot places Bone Tomahawk at number eight.",
        [[3362, "bone"], [3365, "tomahawk"]],
      ),
      ranking(
        "SCREAM (2022) // #7",
        3607,
        "number seven",
        "Scream (2022)",
        7,
        "The captions place Scream (2022) at number seven and explain the choice through rewatchability.",
        [[3623, "screen five"], [3675, "re-watchability"]],
      ),
      ranking(
        "IT FOLLOWS // #7",
        3760,
        "number",
        "It Follows",
        7,
        "Another unresolved ballot places It Follows at number seven.",
        [[3764, "number"], [3765, "it follows"]],
      ),
      ranking(
        "MAMA // #6",
        3880,
        "number six",
        "Mama",
        6,
        "The captions place Mama at number six.",
        [[3884, "mama"]],
      ),
      ranking(
        "TRAIN TO BUSAN // #5",
        4046,
        "number five",
        "Train to Busan",
        5,
        "One ballot places Train to Busan at number five.",
        [[4057, "Busan"], [4100, "father and daughter"]],
      ),
      ranking(
        "CREEP // #6",
        4314,
        "number",
        "Creep",
        6,
        "Another unresolved ballot places Creep at number six.",
        [[4315, "six"], [4315, "creep"]],
      ),
      ranking(
        "TRAIN TO BUSAN // SHARED #5",
        4433,
        "number five",
        "Train to Busan",
        5,
        "The parallel ballots converge on Train to Busan at number five.",
        [[4435, "same at number five"], [4437, "train"]],
        { sequenceState: "parallel-ballots-same-placement" },
      ),
      ranking(
        "BRIGHTBURN // #4",
        4535,
        "number four",
        "Brightburn",
        4,
        "The captions place Brightburn at number four.",
        [[4539, "bright burn"]],
      ),
      ranking(
        "HALLOWEEN (2018) // #4",
        4685,
        "number four",
        "Halloween (2018)",
        4,
        "Halloween (2018) also appears at number four in the parallel ballot.",
        [[4691, "halloween"], [4692, "2018"]],
      ),
      ranking(
        "LIGHTS OUT // #3",
        4908,
        "number three",
        "Lights Out",
        3,
        "The captions place Lights Out at number three.",
        [[4926, "lights out"], [4937, "big budget movie"]],
      ),
      ranking(
        "EVIL DEAD (2013) // #3",
        5107,
        "number three",
        "Evil Dead (2013)",
        3,
        "Another unresolved ballot places the Evil Dead remake at number three.",
        [[5111, "evil dead remake"]],
      ),
      ranking(
        "SINISTER // #2",
        5275,
        "number two",
        "Sinister",
        2,
        "One ballot places Sinister at number two.",
        [[5287, "sinister"], [5290, "very very"]],
      ),
      ranking(
        "SINISTER // SHARED #2",
        5421,
        "number two",
        "Sinister",
        2,
        "The parallel ballots converge on Sinister at number two.",
        [[5422, "sinister"], [5431, "made it separately"]],
        { sequenceState: "parallel-ballots-same-placement" },
      ),
      ranking(
        "THE CONJURING // #1",
        5718,
        "number one",
        "The Conjuring",
        1,
        "One unresolved ballot names The Conjuring as its number-one horror favorite of the decade.",
        [[5728, "conjuring"], [5736, "legit"]],
      ),
      ranking(
        "HEREDITARY // #1",
        6164,
        "agree with you",
        "Hereditary",
        1,
        "The other ballot identifies Hereditary as its actual number-one choice.",
        [[6166, "actual number one"]],
      ),
    ],
  },
  qRcoPW7FLaQ: {
    rankingEvents: [
      ranking(
        "MARVEL + DC TOP 50 SCOPE",
        1057,
        "rank our top 50",
        "Marvel and DC film ranking",
        null,
        "The show defines one combined Top 50 ranking across Marvel and DC films.",
        [[1059, "dc"], [1061, "marvel"]],
        { eventKind: "captioned-ranking-scope", sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "LOGAN // #1",
        10460,
        "number one",
        "Logan",
        1,
        "The closing spoken readout places Logan at number one.",
        [[10464, "Logan"]],
        { sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "AVENGERS: ENDGAME // #2",
        10464,
        "number two",
        "Avengers: Endgame",
        2,
        "The closing spoken readout places Avengers: Endgame at number two.",
        [[10467, "in game"]],
        { sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "THE DARK KNIGHT // #3",
        10468,
        "number three",
        "The Dark Knight",
        3,
        "The closing spoken readout places The Dark Knight at number three.",
        [[10468, "dark knight"]],
        { sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "THE AVENGERS // #4",
        10468,
        "number four",
        "The Avengers",
        4,
        "The closing spoken readout places The Avengers at number four.",
        [[10470, "avengers"]],
        { sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "DEADPOOL // #5",
        10470,
        "number five",
        "Deadpool",
        5,
        "The closing spoken readout places Deadpool at number five.",
        [[10471, "deadpool"]],
        { sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "BATMAN (1989) // #6",
        10472,
        "number six",
        "Batman (1989)",
        6,
        "The closing spoken readout places Batman (1989) at number six.",
        [[10472, "batman 1989"]],
        { sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "MAN OF STEEL // #7",
        10476,
        "man of steel",
        "Man of Steel",
        7,
        "The closing ordered readout continues with Man of Steel in the seventh slot.",
        [],
        { eventKind: "captioned-ordered-readout", sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "ZACK SNYDER'S JUSTICE LEAGUE // #8",
        10480,
        "Zack Snyder",
        "Zack Snyder's Justice League",
        8,
        "The closing ordered readout continues with Zack Snyder's Justice League in the eighth slot.",
        [[10483, "justice league"]],
        { eventKind: "captioned-ordered-readout", sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "IRON MAN // #9",
        10483,
        "iron man",
        "Iron Man",
        9,
        "The closing ordered readout places Iron Man ninth.",
        [],
        { eventKind: "captioned-ordered-readout", sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "JOKER // #10",
        10483,
        "joker",
        "Joker",
        10,
        "The closing ordered readout places Joker tenth.",
        [],
        { eventKind: "captioned-ordered-readout", sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "SPIDER-MAN 2 // #11",
        10485,
        "spider-man 2",
        "Spider-Man 2",
        11,
        "The closing ordered readout places Spider-Man 2 immediately after the Top 10.",
        [],
        { eventKind: "captioned-ordered-readout", sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "DAYS OF FUTURE PAST // #12",
        10485,
        "days of future past",
        "X-Men: Days of Future Past",
        12,
        "The closing ordered readout places X-Men: Days of Future Past at number 12.",
        [],
        { eventKind: "captioned-ordered-readout", sequenceState: "shared-consensus-list" },
      ),
      ranking(
        "FIRST AVENGER // #50",
        10555,
        "disagreements",
        "Captain America: The First Avenger",
        50,
        "The closing remarks explicitly identify Captain America: The First Avenger as the bottom placement.",
        [[10557, "captain"], [10560, "first avenger"], [10561, "bottom 50"]],
        { eventKind: "captioned-ranking-placement", sequenceState: "shared-consensus-list" },
      ),
    ],
  },
  AGL5yUH5Xy4: {
    agendaItems: [
      agenda(
        "DOOM: THE DARK AGES",
        298,
        "reveal trailer",
        "Doom: The Dark Ages",
        "The show opens a Doom: The Dark Ages discussion and notes its Game Pass availability.",
        [[302, "Dark Ages"], [306, "Game Pass"]],
        { agendaKind: "captioned-game-discussion" },
      ),
      agenda(
        "SINNERS REVIEW BACKLASH",
        938,
        "talking about sinners",
        "Response to the Sinners review",
        "The show explains that criticism of its recent Sinners review prompted the discussion.",
        [[941, "criticism"], [945, "sinners review"]],
        { agendaKind: "captioned-channel-response" },
      ),
      agenda(
        "LEX LUTHOR CASTING TAKE",
        1882,
        "cast that",
        "Nicholas Hoult as Lex Luthor",
        "The show questions Nicholas Hoult as Lex Luthor while still calling him a capable supporting actor.",
        [[1884, "Lex"], [1886, "Nicholas"], [1890, "good background"]],
        { agendaKind: "captioned-casting-take" },
      ),
      agenda(
        "PREDATOR IDENTITY QUESTION",
        1957,
        "didn't know",
        "New Predator character",
        "The stream treats the new Predator character's identity as an open question rather than a settled fact.",
        [[1965, "chick predator"], [1974, "supposed to be a girl"], [1975, "predator"]],
      ),
      agenda(
        "RESURRECTION VERSUS ENDS",
        2439,
        "Halloween Resurrection",
        "Halloween Resurrection versus Halloween Ends",
        "An audience comparison claiming Resurrection beats Ends receives immediate disagreement.",
        [[2441, "Halloween Ends"], [2442, "disagree"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "HALLOWEEN III REBOOT REJECTED",
        3097,
        "Halloween 3 reboot",
        "Halloween III reboot",
        "The show rejects restarting Halloween with a Michael-free Halloween III reboot.",
        [[3098, "awful idea"], [3105, "restart"], [3107, "Michael Myers"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "ANTHOLOGY MODEL REJECTED",
        3126,
        "firmly against",
        "Halloween anthology model",
        "The show says turning Halloween into an anthology would erase what makes it Halloween.",
        [[3128, "anthology"], [3130, "not Halloween"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "CARPENTER ON HALLOWEEN II",
        3152,
        "Halloween 2",
        "John Carpenter's Halloween II comments",
        "The show recalls an interview in which Halloween II is described as reluctant sequel work.",
        [[3155, "garbage"], [3158, "wrote the movie"], [3162, "sequel potential"]],
        { agendaKind: "captioned-interview-recollection" },
      ),
      agenda(
        "THE 1978 ENDING DEBATE",
        3293,
        "Halloween",
        "Halloween (1978) ending",
        "The stream debates whether the original film's disappearance-and-breathing ending naturally invited a sequel.",
        [[3295, "gets up"], [3296, "breathing"], [3303, "don't want to make a sequel"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "SCREAM AUTHORSHIP DEBATE",
        3963,
        "movie Scream",
        "Wes Craven's contribution to Scream",
        "The show argues that Wes Craven's direction materially shaped the remembered Scream film beyond the script.",
        [[3966, "Wes"], [3968, "made it what it is"], [3973, "Kevin Williamson"]],
        { agendaKind: "captioned-craft-take" },
      ),
      agenda(
        "THE SHINING ADAPTATION",
        4091,
        "The Shining",
        "Stanley Kubrick's The Shining",
        "The show separates Stephen King's successful novel from the distinct film Kubrick created.",
        [[4094, "Stephen King"], [4116, "Stanley"], [4118, "masterpiece"]],
        { agendaKind: "captioned-adaptation-take" },
      ),
      agenda(
        "LEATHERFACE ICON CASE",
        4625,
        "Texas Chainsaw",
        "Leatherface versus Jason",
        "The horror-icon debate says Texas Chainsaw may be the stronger single movie even when Jason remains cooler.",
        [[4632, "best single movie"], [4637, "Jason"], [4640, "Leatherface"]],
        { agendaKind: "captioned-franchise-comparison" },
      ),
      agenda(
        "PHYSICAL MEDIA BALLOT A",
        6410,
        "laser disc",
        "Physical-media format ranking",
        "One unresolved mini-ranking puts LaserDisc first, VHS second, and Blu-ray third.",
        [[6414, "VHS"], [6415, "Blu-ray"]],
        { agendaKind: "captioned-mini-ranking", resultText: "LaserDisc / VHS / Blu-ray" },
      ),
      agenda(
        "PHYSICAL MEDIA BALLOT B",
        6437,
        "laser disc",
        "Physical-media format ranking",
        "Another unresolved mini-ranking chooses VHS first before Blu-ray and DVD.",
        [[6440, "Blu-ray"], [6444, "VHS"], [6505, "VHS"]],
        { agendaKind: "captioned-mini-ranking", resultText: "VHS / Blu-ray / DVD" },
      ),
      agenda(
        "DVD // THIRD",
        6531,
        "number",
        "DVD in the physical-media ranking",
        "The physical-media segment places DVD third in one unresolved ballot.",
        [[6533, "DVD"], [6538, "cheap"]],
        { agendaKind: "captioned-mini-ranking-placement", resultText: "3" },
      ),
      agenda(
        "CLAMSHELL CASE HATE",
        6868,
        "hate",
        "Clamshell VHS cases",
        "The physical-media discussion singles out Disney-style clamshell cases for blunt criticism.",
        [[6872, "clam shell"], [6887, "Disney"], [6889, "hate them"]],
        { agendaKind: "captioned-format-critique" },
      ),
      agenda(
        "MIDNIGHT SCREENING MEMORY",
        9001,
        "back in the day",
        "Horror midnight screenings",
        "The show remembers midnight horror screenings as a special event that has largely disappeared.",
        [[9007, "horror movie"], [9009, "midnight"], [9012, "something special"]],
        { agendaKind: "captioned-theater-memory" },
      ),
    ],
  },
  e7Guc5jtHQg: {
    agendaItems: [
      agenda(
        "ONLINE ENGAGEMENT TRAP",
        1175,
        "obvious answer",
        "Responding to online criticism",
        "The show says ignoring strangers online is the obvious move while admitting it struggles to do that.",
        [[1177, "Move on"], [1182, "battle song"], [1184, "stranger"]],
        { agendaKind: "captioned-channel-reflection" },
      ),
      agenda(
        "SCREAM CREATOR THREATS DISCUSSION",
        1575,
        "Scream script",
        "Threats around the Scream production debate",
        "The show discusses reported threats surrounding the Scream controversy and keeps its criticism aimed at that conduct.",
        [[1586, "as a dad"], [1589, "kill him"], [1593, "children"]],
        { agendaKind: "captioned-industry-controversy" },
      ),
      agenda(
        "BLUMHOUSE DECISION CRITIQUE",
        2744,
        "Jason Blum",
        "Recent Blumhouse decisions",
        "The show criticizes recent public comments and decisions associated with Blumhouse.",
        [[2748, "weird decisions"], [2752, "Lady in the Yard"]],
        { agendaKind: "captioned-studio-take" },
      ),
      agenda(
        "JURASSIC PARK THEATER MEMORY",
        3042,
        "was a kid",
        "Jurassic Park theater memory",
        "A childhood movie-theater story recalls dropping candy when Jurassic Park's opening attack landed.",
        [[3047, "floor"], [3049, "Jurassic Park"], [3053, "violent"]],
        { agendaKind: "captioned-theater-memory" },
      ),
      agenda(
        "ALL AMERICAN MASSACRE",
        4710,
        "All American Massacre",
        "All American Massacre and Chop Top",
        "An audience question opens an All American Massacre discussion and a negative Chop Top take.",
        [[4715, "Chop Top"], [4719, "overrated"]],
        { agendaKind: "captioned-audience-question" },
      ),
      agenda(
        "HALLOWEEN 1978 BENCHMARK",
        5151,
        "78 Halloween",
        "Halloween (1978)",
        "The show notes Halloween (1978) as a frequent benchmark in best-horror conversations.",
        [[5154, "best horror movie"]],
        { agendaKind: "captioned-franchise-comparison" },
      ),
      agenda(
        "FRIDAY THE 13TH FIRST-VIEW PROBLEM",
        5158,
        "Friday",
        "Friday the 13th (1980)",
        "The show explains how knowing Jason's later icon status changes a first-film viewing.",
        [[5163, "original"], [5176, "Jason"], [5179, "iconic killer"]],
        { agendaKind: "captioned-franchise-take" },
      ),
      agenda(
        "NO-SEQUEL THOUGHT EXPERIMENT",
        5222,
        "what if",
        "Friday the 13th without sequels",
        "A thought experiment asks how the original Friday the 13th would be remembered without sequels.",
        [[5227, "never a sequel"], [5230, "another one"]],
        { agendaKind: "captioned-franchise-theory" },
      ),
      agenda(
        "SLENDERMAN SONG REQUEST",
        6243,
        "Slender Man",
        "Slenderman character-song request",
        "An audience request asks for a Slenderman and Mark Wahlberg performance of Truly Madly Deeply.",
        [[6245, "Mark"], [6247, "Truly Madly"]],
        { agendaKind: "captioned-character-request" },
      ),
      agenda(
        "SIGNED HORROR COLLECTIBLES",
        6660,
        "good price",
        "Signed horror collectibles",
        "The show estimates the value of signed horror memorabilia while labeling the numbers as rough.",
        [[6665, "Freddy glove"], [6667, "Robert"], [6675, "estimations"]],
        { agendaKind: "captioned-collectibles-discussion" },
      ),
      agenda(
        "NINTENDO INDUSTRY TAKE",
        7304,
        "Nintendo",
        "Nintendo's video-game influence",
        "The show calls Nintendo an industry pioneer while sharply criticizing its business posture.",
        [[7307, "pioneer"], [7311, "selfish"]],
        { agendaKind: "captioned-game-industry-take" },
      ),
      agenda(
        "GAME-PRICE ESCALATION",
        7442,
        "article",
        "Rising video-game prices",
        "The show warns that strong sales at higher prices could encourage Microsoft and Sony to follow.",
        [[7446, "Microsoft"], [7449, "buying"], [7455, "other companies"]],
        { agendaKind: "captioned-game-industry-take" },
      ),
      agenda(
        "A24 BLOODSPORT REMAKE",
        7789,
        "remake Blood Sport",
        "Bloodsport remake",
        "The news desk discusses A24 negotiations around a new Bloodsport remake.",
        [[7793, "project"], [7796, "A24"], [7807, "film rights"]],
        { agendaKind: "captioned-remake-news" },
      ),
      agenda(
        "HARD TARGET ACTION LEGACY",
        8620,
        "between the two",
        "Jean-Claude Van Damme in Hard Target",
        "The action-movie detour praises Van Damme's presence in Hard Target and remembers the John Woo pairing.",
        [[8624, "Hard Target"], [8630, "Woo"], [8633, "mullet"]],
        { agendaKind: "captioned-action-movie-take" },
      ),
      agenda(
        "THE BLACK PHONE OVERHYPE",
        10501,
        "Black Phone",
        "The Black Phone",
        "The show calls The Black Phone a good horror movie while rejecting the extraordinary praise around it.",
        [[10505, "bad movie"], [10507, "heaping praise"], [10514, "it's cool"], [10516, "horror movie"]],
        { agendaKind: "captioned-film-take" },
      ),
    ],
  },
});

function clean(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalized(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function wordTokens(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return `sha256:${crypto.createHash("sha256").update(input).digest("hex")}`;
}

function boundedExcerpt(value, focus = "", limit = EXCERPT_WORD_LIMIT) {
  const words = wordTokens(value);
  if (words.length <= limit) return words.join(" ");
  const focusWords = wordTokens(focus);
  let start = 0;
  if (focusWords.length) {
    const target = focusWords[0].toLowerCase();
    const found = words.findIndex((word) => word.toLowerCase() === target);
    if (found >= 0) {
      start = Math.max(0, Math.min(words.length - limit, found - 3));
    }
  }
  return words.slice(start, start + limit).join(" ");
}

function slug(value) {
  return normalized(value).replace(/\s+/g, "-").slice(0, 72) || "fact";
}

export function parseCaptionLines(payload) {
  return (Array.isArray(payload?.events) ? payload.events : [])
    .filter(
      (event) =>
        Array.isArray(event.segs) && Number.isFinite(event.tStartMs),
    )
    .map((event) => {
      const at = Math.max(0, Math.floor(event.tStartMs / 1000));
      const end = Math.max(
        at + 1,
        Math.ceil(
          (event.tStartMs + (Number(event.dDurationMs) || 4000)) / 1000,
        ),
      );
      return {
        at,
        end,
        text: clean(event.segs.map((segment) => segment.utf8 || "").join("")),
      };
    })
    .filter((line) => line.text && line.text !== "\\n")
    .sort(
      (left, right) =>
        left.at - right.at || left.text.localeCompare(right.text),
    );
}

function matchPhrase(line, phrase) {
  return normalized(line.text).includes(normalized(phrase));
}

export function resolveAnchor(lines, [at, phrase, tolerance = 8]) {
  const matches = lines
    .filter(
      (line) =>
        Math.abs(line.at - at) <= tolerance && matchPhrase(line, phrase),
    )
    .sort(
      (left, right) =>
        Math.abs(left.at - at) - Math.abs(right.at - at) ||
        left.at - right.at ||
        left.text.localeCompare(right.text),
    );
  if (!matches.length) {
    throw new Error(`Required caption anchor drifted: ${at}s // "${phrase}"`);
  }
  return matches[0];
}

function everyConfiguredAnchor(config) {
  return [
    config.anchor,
    config.response,
    ...(config.support || []),
    ...(config.responseSupport || []),
  ].filter(Boolean);
}

function commonClaim(text) {
  return {
    text,
    kind: "caption-observation",
    scope: "source-local",
    rightsSafe: true,
  };
}

function buildFact(source, key, config, index, lines) {
  const primary = resolveAnchor(lines, config.anchor);
  const support = (config.support || []).map((item) =>
    resolveAnchor(lines, item),
  );
  const response = config.response
    ? resolveAnchor(lines, config.response)
    : null;
  const responseSupport = (config.responseSupport || []).map((item) =>
    resolveAnchor(lines, item),
  );
  const allEvidence = [primary, ...support, response, ...responseSupport]
    .filter(Boolean)
    .sort(
      (left, right) =>
        left.at - right.at || left.text.localeCompare(right.text),
    );
  const evidencePayload = allEvidence.map((item) => ({
    at: item.at,
    end: item.end,
    text: item.text,
  }));
  const evidenceFrom = Math.min(...allEvidence.map((item) => item.at));
  const evidenceTo = Math.max(...allEvidence.map((item) => item.end));
  const typeMap = {
    rankingEvents: "rankingEvent",
    syncCues: "syncCue",
    agendaItems: "agendaItem",
    reviewMoments: "reviewMoment",
  };
  const responseFields = response
    ? {
        responseAt: response.at,
        responseEnd: response.end,
        responseExcerpt: boundedExcerpt(response.text, config.response[1]),
      }
    : {};
  const fact = {
    id: `${source.id}-${slug(key)}-${String(index + 1).padStart(2, "0")}-${slug(config.label)}`,
    type: typeMap[key],
    label: clean(config.label),
    at: evidenceFrom,
    end: evidenceTo,
    excerpt: boundedExcerpt(primary.text, config.anchor[1]),
    evidenceHash: sha256(stableJson(evidencePayload)),
    evidenceType: EVIDENCE_TYPE,
    confidence: "high",
    reviewState: REVIEW_STATE,
    claim: commonClaim(clean(config.summary)),
    evidence: {
      anchorPhrase: clean(config.anchor[1]),
      anchorAt: primary.at,
      anchorEnd: primary.end,
      excerptWordCount: wordTokens(
        boundedExcerpt(primary.text, config.anchor[1]),
      ).length,
      fullCaptionPublic: false,
    },
    ...responseFields,
    ...config.details,
  };
  assertFact(fact);
  return fact;
}

function assertFact(fact) {
  if (
    !Number.isFinite(fact.at) ||
    !Number.isFinite(fact.end) ||
    fact.end <= fact.at
  ) {
    throw new Error(`${fact.id} has an invalid playback range.`);
  }
  for (const [key, value] of Object.entries(fact)) {
    if (
      /excerpt$/i.test(key) &&
      wordTokens(value).length > EXCERPT_WORD_LIMIT
    ) {
      throw new Error(`${fact.id}.${key} exceeds ${EXCERPT_WORD_LIMIT} words.`);
    }
  }
  const forbidden = /(speaker|visual|origin|creator.?approval)/i;
  for (const key of Object.keys(fact)) {
    if (forbidden.test(key)) {
      throw new Error(`${fact.id} contains forbidden unset field ${key}.`);
    }
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(fact.evidenceHash)) {
    throw new Error(`${fact.id} is missing a deterministic evidence hash.`);
  }
}

function loadSource(target) {
  const captionPath = path.join(
    PROJECT_ROOT,
    "source-cache",
    "captions",
    `${target.id}.json`,
  );
  const metadataPath = path.join(
    PROJECT_ROOT,
    "source-cache",
    "metadata",
    `${target.id}.json`,
  );
  if (!fs.existsSync(captionPath) || !fs.existsSync(metadataPath)) {
    throw new Error(`${target.id} is missing a private caption or metadata cache.`);
  }
  const captionBuffer = fs.readFileSync(captionPath);
  const metadataBuffer = fs.readFileSync(metadataPath);
  return {
    captionBuffer,
    metadataBuffer,
    captionPayload: JSON.parse(captionBuffer.toString("utf8")),
    metadata: JSON.parse(metadataBuffer.toString("utf8")),
  };
}

function buildSource(target) {
  const loaded = loadSource(target);
  const source = {
    id: target.id,
    title: clean(loaded.metadata.title),
    date: String(loaded.metadata.upload_date || "").replace(
      /^(\d{4})(\d{2})(\d{2})$/,
      "$1-$2-$3",
    ),
    duration: Number(loaded.metadata.duration),
  };
  const lines = parseCaptionLines(loaded.captionPayload);
  if (!lines.length || !Number.isFinite(source.duration) || source.duration <= 0) {
    throw new Error(`${target.id} does not have a usable caption timeline.`);
  }
  const sourceConfig = FACT_CONFIG[target.id];
  const configs = sourceConfig?.[target.specificKey] || [];
  if (configs.length < target.minimumFacts) {
    throw new Error(
      `${target.id} is fail-closed: ${configs.length} configured facts is below ${target.minimumFacts}.`,
    );
  }
  const auditRows = configs.flatMap((config) =>
    everyConfiguredAnchor(config).map((item) => {
      const line = resolveAnchor(lines, item);
      return {
        expectedAt: item[0],
        resolvedAt: line.at,
        phrase: clean(item[1]),
        evidenceHash: sha256(
          stableJson({ at: line.at, end: line.end, text: line.text }),
        ),
      };
    }),
  );
  const facts = configs.map((config, index) =>
    buildFact(source, target.specificKey, config, index, lines),
  );
  const record = {
    ...source,
    format: target.format,
    formatSpecificFactType: target.specificKey,
    sourceState: {
      coverage: "typed-caption-batch",
      evidenceState: "machine-surfaced",
      reviewState: REVIEW_STATE,
      promotionAllowed: false,
    },
    rightsPolicy: {
      publicExcerptWordLimitPerField: EXCERPT_WORD_LIMIT,
      fullCaptionPublic: false,
      promotionAllowed: false,
    },
    auditSelection: {
      registeredOverviewCarryThroughPercent: target.auditOverlapPercent,
      replacementFor: target.replacementFor || null,
    },
    omissions: [...target.omissions],
    inputEvidence: {
      captionSha256: sha256(loaded.captionBuffer),
      metadataSha256: sha256(loaded.metadataBuffer),
      captionEvents: lines.length,
      anchorAudit: {
        required: auditRows.length,
        resolved: auditRows.length,
        anchorSetSha256: sha256(stableJson(auditRows)),
      },
    },
    [target.specificKey]: facts,
  };
  return {
    ...record,
    generationSha256: sha256(stableJson(record)),
  };
}

export function buildBatch3Payload() {
  const sources = TARGETS.map(buildSource);
  const facts = sources.flatMap(
    (source) => source[source.formatSpecificFactType],
  );
  const byType = {};
  for (const fact of facts) {
    byType[fact.type] = (byType[fact.type] || 0) + 1;
  }
  return {
    schema: "wwam-episode-facts-batch3/v1",
    generated: GENERATED,
    selection: {
      reason:
        "The weakest eligible registered-overview carry-through sources in the 2026-07-30 recap audit.",
      collision: {
        id: "fUCQoxTwKqo",
        title: "HALLOWEEN Q + A LIVESTREAM!",
        carryThroughPercent: 21,
        resolution:
          "Excluded because it already has a typed pilot pack; duplicate evidence packs are forbidden.",
      },
      replacement: {
        id: "e7Guc5jtHQg",
        title: "We Watched A Movie LIVE 4/9",
        carryThroughPercent: 25,
        reason: "Next weakest eligible non-overlapping source in the same audit.",
      },
    },
    provenance: {
      generator: "scripts/generate-episode-facts-batch3.mjs",
      method:
        "Deterministic typed source-local facts from private automatic-caption caches, exact mandatory anchors, bounded excerpts, and hashed evidence.",
      contentSha256: sha256(stableJson(sources)),
    },
    policy: {
      privateCaptionCacheUsed: true,
      publicFullCaptionsIncluded: false,
      publicExcerptWordLimitPerField: EXCERPT_WORD_LIMIT,
      promotionAllowed: false,
      unsetFields:
        "Voice identity, visual context, audio origin, and creator sign-off are intentionally not populated.",
    },
    meta: {
      sources: sources.length,
      facts: facts.length,
      byType,
      formats: Object.fromEntries(
        [...new Set(sources.map((source) => source.format))]
          .sort()
          .map((format) => [
            format,
            sources.filter((source) => source.format === format).length,
          ]),
      ),
    },
    sources,
  };
}

export function renderArtifact(payload = buildBatch3Payload()) {
  return `window.WWAM_EPISODE_FACTS_BATCH3 = ${JSON.stringify(payload)};\n`;
}

function main() {
  const rendered = renderArtifact();
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated artifact: ${OUTPUT_PATH}`);
    }
    if (fs.readFileSync(OUTPUT_PATH, "utf8") !== rendered) {
      throw new Error(
        "episode-facts-batch3.js is stale; run generate-episode-facts-batch3.mjs",
      );
    }
    process.stdout.write("episode facts batch 3 is deterministic and current\n");
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered);
  const payload = buildBatch3Payload();
  process.stdout.write(
    `wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)} (${payload.meta.sources} sources, ${payload.meta.facts} typed facts)\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
