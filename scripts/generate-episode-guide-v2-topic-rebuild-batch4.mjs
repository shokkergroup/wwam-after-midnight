import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import { parseCaptionLines } from "./generate-episode-guide-v2-pilot.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "public",
  "demo",
  "episode-guide-v2-topic-rebuild-batch4.js",
);
const GENERATED = "2026-07-30";
const PUBLIC_EXCERPT_WORD_LIMIT = 16;
const CUT_LENGTH_SECONDS = 24;
const BOUNDARY_MODE = "standard-caption-candidates";

function cutRows(rows) {
  return rows.map(
    ([at, needle, label, topic, classification, summary]) => ({
      at,
      needle,
      label,
      topic,
      classification,
      summary,
    }),
  );
}

export const TOPIC_REBUILD_BATCH4_CONFIGS = Object.freeze([
  {
    id: "_PiftDXSf8k",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "ranking-show",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 90,
    cuts: cutRows([
      [
        58,
        "the chat",
        "MAFIA MOUNTAIN OPENS // CHAT CHECK",
        "Mafia-film Mount Rushmore",
        "format-cue",
        "The ranking stream opens by checking in with the live audience.",
      ],
      [
        394,
        "amazing actor",
        "ACTOR PRAISE // BALL TOUCHING DETOUR",
        "Mafia-film actors",
        "comedy-candidate",
        "Actor praise abruptly swerves into an explicit anatomy-related spoken joke.",
      ],
      [
        733,
        "you guys",
        "SUPER CHAT POLICY // NO PRESSURE",
        "Audience support",
        "evaluation-candidate",
        "The stream tells viewers that recurring broadcasts do not require donations.",
      ],
      [
        925,
        "Sopranos",
        "SOPRANOS CLAUSE // TELEVISION COUNTS",
        "The Sopranos",
        "evaluation-candidate",
        "The ranking expands to television and places The Sopranos in contention.",
      ],
      [
        1566,
        "caught you",
        "HAIR-OFF THREAT // CRIME RIFF",
        "Mafia-film confrontation",
        "comedy-candidate",
        "A quoted confrontation escalates into a profane hair-cutting spoken riff.",
      ],
      [
        1727,
        "hot socks",
        "NEW JACK CITY // HOT SOCKS SIDEBAR",
        "New Jack City",
        "topic-door",
        "The film survey reaches New Jack City after a brief repeated phrase.",
      ],
      [
        1989,
        "I grew up",
        "ROBIN'S STORY // GOOD HUSBAND DEFENSE",
        "Mafia-film supporting characters",
        "evaluation-candidate",
        "The discussion sympathizes with Robin as a husband trying to do right.",
      ],
      [
        2180,
        "different director",
        "DIRECTOR TEST // DIFFERENT MOVIE",
        "Mafia-film direction",
        "evaluation-candidate",
        "The conversation argues that another director would have changed the film.",
      ],
      [
        2710,
        "the world will talk",
        "BEDROOM WARNING // RANKING FIGHT",
        "Mafia-film ranking debate",
        "comedy-candidate",
        "A dramatic quoted warning punctuates disagreement over the top selections.",
      ],
      [
        2983,
        "top 50",
        "TOP-FIFTY PROBLEM // DARK KNIGHT ENTERS",
        "Expanded crime-film rankings",
        "topic-door",
        "The ranking scope widens toward fifty entries and includes The Dark Knight.",
      ],
      [
        3265,
        "I can't have this",
        "PAULIE PANIC // PEOPLE ARE TALKING",
        "Mafia-film secrecy",
        "comedy-candidate",
        "An anxious quoted exchange turns criminal secrecy into a spoken bit.",
      ],
      [
        3690,
        "I can't see you",
        "DIRTY MOUTH // SAUSAGE FINGERS",
        "Late-stream spoken riff",
        "comedy-candidate",
        "A visibility complaint mutates into an insult about a dirty mouth.",
      ],
      [
        3987,
        "Chucky",
        "CHUCKY CRASHES THE MOB // FLORIDA TURN",
        "Chucky",
        "comedy-candidate",
        "Repeated Chucky references launch a late detour away from mafia cinema.",
      ],
      [
        4386,
        "funeral",
        "FUNERAL SPEECH // BALLS IN HIS FACE",
        "Funeral-story riff",
        "comedy-candidate",
        "A funeral recollection becomes an extended explicit spoken comedy candidate.",
      ],
      [
        4628,
        "dick baskets",
        "DICK BASKETS FINALE // AFFECTIONATE EXIT",
        "Audience sign-off",
        "comedy-candidate",
        "The stream signs off with a profane but affectionate audience nickname.",
      ],
    ]),
  },
  {
    id: "qgUX3ySexeI",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "movie-news",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 90,
    cuts: cutRows([
      [
        87,
        "Alien Earth",
        "ALIEN EARTH // RABBIT-TURD VERDICT",
        "Alien: Earth",
        "evaluation-candidate",
        "The opening delivers a sharply negative Alien: Earth comparison.",
      ],
      [
        324,
        "dirty",
        "ZUCKERBERG TABLE // DIRTY DRINK RIFF",
        "Mark Zuckerberg",
        "comedy-candidate",
        "A drink anecdote turns into an explicit Mark Zuckerberg insult.",
      ],
      [
        776,
        "those fingers",
        "FOOTBALL DLC // THE BIT GOES OFF ROAD",
        "Football video-game riff",
        "comedy-candidate",
        "A football-game reference escalates into an intentionally graphic DLC joke.",
      ],
      [
        978,
        "shut down",
        "COMMENT SECTION // SUBSCRIBER MELTDOWN",
        "Online audience feedback",
        "comedy-candidate",
        "A mock online exchange answers criticism with an aggressive subscriber riff.",
      ],
      [
        1268,
        "wanted to make",
        "SEQUEL HOPE // FIRST ATTEMPT TANKED",
        "Movie sequel prospects",
        "evaluation-candidate",
        "The discussion balances sequel hope against the prior movie's poor performance.",
      ],
      [
        1548,
        "Nobody",
        "OPINION LINE // NOBODY DESERVES THAT",
        "Toxic audience reactions",
        "evaluation-candidate",
        "The conversation rejects wishing death on someone over a different opinion.",
      ],
      [
        1939,
        "Stephen King",
        "STEPHEN KING WIRE // POST DISPUTE",
        "Stephen King",
        "topic-door",
        "The movie-news feed pivots to a disputed Stephen King social post.",
      ],
      [
        2032,
        "Zombie sucks",
        "ROB ZOMBIE // DIRECTOR VERDICT",
        "Rob Zombie",
        "evaluation-candidate",
        "A blunt exchange separates personal dislike from criticism of directing.",
      ],
      [
        2224,
        "laughing",
        "THE PLOT IS LOST // LAUGHING AT WRONGNESS",
        "Online ridicule",
        "evaluation-candidate",
        "The discussion criticizes public ridicule and says the broader point is lost.",
      ],
      [
        2665,
        "someone's theory",
        "ALIEN THEORY // OBSERVERS SAY CHILL",
        "Alien: Earth fan theories",
        "topic-door",
        "A fan theory imagines aliens observing humanity and urging restraint.",
      ],
      [
        2878,
        "proven correct",
        "THEORY CHECK // ADS MAY GO TOO",
        "Alien: Earth theory follow-up",
        "evaluation-candidate",
        "The conversation revisits whether an earlier prediction might be proven correct.",
      ],
      [
        3193,
        "Streets of Hadenfield",
        "STREETS OF HADDONFIELD // REMAKE MEMORY",
        "Halloween remake pitch",
        "topic-door",
        "The stream recalls a prior Halloween remake concept titled Streets of Haddonfield.",
      ],
      [
        3510,
        "Dave",
        "BATMAN RETURN // DAVE REAPPEARS",
        "Late-stream reunion riff",
        "comedy-candidate",
        "An unexpected return is compared with Batman reappearing after years away.",
      ],
      [
        3791,
        "special season",
        "BLILL WARNING // HANDSOME DETOUR",
        "Late-stream spoken riff",
        "comedy-candidate",
        "A mock warning becomes an affectionate late-stream spoken detour.",
      ],
      [
        3985,
        "weather",
        "WEATHER DESK // BALLS ON THE NEWS",
        "Mock newscast",
        "comedy-candidate",
        "A mock weather-and-sports handoff ends with an explicit running joke.",
      ],
    ]),
  },
  {
    id: "zAbh9eGZJnY",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "episode-recap",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 90,
    cuts: cutRows([
      [
        109,
        "Like",
        "CHAT COUNT // MAGIC NUMBER NINE",
        "Live recap opening",
        "format-cue",
        "The recap opens with a playful correction about the audience count.",
      ],
      [
        322,
        "Michael Myers",
        "MICHAEL'S HORSE // HALLOWEEN CAMEO RIFF",
        "Game of Thrones white horse",
        "comedy-candidate",
        "The episode's white horse is jokingly assigned to Michael Myers.",
      ],
      [
        528,
        "whiskey",
        "WHISKEY PROBLEM // SARAH MARSHALL DETOUR",
        "Late-night recap riff",
        "comedy-candidate",
        "A sexual-performance joke invokes a scene from Forgetting Sarah Marshall.",
      ],
      [
        620,
        "Avengers Endgame",
        "ENDGAME VERSUS LAKE HOUSE // MOVIE ARGUMENT",
        "Audience movie choices",
        "comedy-candidate",
        "An Avengers-versus-Lake House dispute becomes an exaggerated punishment joke.",
      ],
      [
        954,
        "survived my childhood",
        "CHILDHOOD PAYOFF // EYES START SWEATING",
        "Game of Thrones emotional reaction",
        "evaluation-candidate",
        "The recap records an emotional response through a joking tears description.",
      ],
      [
        1146,
        "ran his mouth",
        "VARYS PROBLEM // CONVOLUTED DANGER",
        "Varys",
        "evaluation-candidate",
        "The recap criticizes the danger created by Varys and calls it convoluted.",
      ],
      [
        1436,
        "whoops his ass",
        "CLEGANEBOWL WISH // EXTREME PAYBACK",
        "Cleganebowl",
        "comedy-candidate",
        "A hoped-for beating escalates into an intentionally graphic spoken wish.",
      ],
      [
        1561,
        "going to be great",
        "THRONE THEORY // JON AND DANY TOGETHER",
        "Jon Snow and Daenerys",
        "evaluation-candidate",
        "The recap considers an optimistic shared-rule outcome for Jon and Daenerys.",
      ],
      [
        1869,
        "making, guys",
        "JON'S LOYALTY // THE CHOICE FAILS",
        "Jon Snow",
        "evaluation-candidate",
        "The discussion explicitly rejects Jon's behavior and questions his loyalty.",
      ],
      [
        2026,
        "Hound starts laughing",
        "HOUND LAUGHS // MARIO BROTHER RIFF",
        "The Hound",
        "comedy-candidate",
        "The Hound's reaction becomes a Super Mario brother comparison.",
      ],
      [
        2184,
        "never happened",
        "PAYOFF MISSING // FAN-SERVICE DEFENSE",
        "The Bells story payoffs",
        "evaluation-candidate",
        "The recap notes a missing payoff while anticipating a fan-service objection.",
      ],
      [
        2494,
        "Bruce Wayne",
        "BRUCE WAYNE FACE // SUPERMAN SONG",
        "Batman v Superman",
        "comedy-candidate",
        "A Batman v Superman memory interrupts the episode discussion with a musical riff.",
      ],
      [
        2657,
        "with people",
        "REVENGE DENIED // YEARS OF DAMAGE",
        "Daenerys conflict",
        "evaluation-candidate",
        "The recap argues that prolonged mistreatment should have produced meaningful revenge.",
      ],
      [
        2779,
        "decide to go",
        "DEATH VERDICT // TWO COMPLEX CHARACTERS",
        "The Bells character deaths",
        "evaluation-candidate",
        "A late verdict calls the deaths unworthy of two intricate characters.",
      ],
      [
        3087,
        "background",
        "JOE BOB BUTTON // BACKGROUND LAUGHERS",
        "Livestream close",
        "comedy-candidate",
        "The recap closes by recruiting background laughers for future jokes.",
      ],
    ]),
  },
  {
    id: "jBVlQGkeh-Q",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "episode-recap",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 89,
    cuts: cutRows([
      [
        106,
        "Avengers",
        "AVENGERS DETOUR // HOMEWORK CLOCK",
        "Livestream audience",
        "format-cue",
        "The recap pauses an Avengers aside to send a viewer toward homework.",
      ],
      [
        146,
        "Rambo",
        "RAMBO SWITCH-OFF // NOTHING LEFT",
        "Game of Thrones reaction",
        "comedy-candidate",
        "A Rambo quote becomes a compact late-night spoken riff.",
      ],
      [
        247,
        "this episode",
        "LONG NIGHT VERDICT // EPICNESS ARRIVES",
        "The Long Night",
        "evaluation-candidate",
        "The recap says the episode delivers the epic scale viewers wanted.",
      ],
      [
        338,
        "expecting",
        "BATTLE SCALE // EXPECTED MUCH BIGGER",
        "The Long Night battle",
        "evaluation-candidate",
        "The battle receives criticism for falling short of larger expectations.",
      ],
      [
        457,
        "throne",
        "CRYPT KEEPER // THRONE PANIC",
        "Winterfell crypts",
        "comedy-candidate",
        "A crypt scare is retold through an exaggerated Crypt Keeper comparison.",
      ],
      [
        531,
        "Gandhian",
        "BATTLE PACING // FLIGHT SIMULATOR",
        "The Long Night pacing",
        "comedy-candidate",
        "The battle's pacing is compared with choosing flight simulation over Star Fox.",
      ],
      [
        656,
        "my theory",
        "NIGHT KING THEORY // ARYA SUCCESSION",
        "Arya Stark and the Night King",
        "topic-door",
        "A speculative question asks whether killing the Night King creates a successor.",
      ],
      [
        725,
        "who died",
        "DEATH LEDGER // EXPECTED LOSSES",
        "The Long Night deaths",
        "topic-door",
        "The recap explicitly shifts into an inventory of episode deaths.",
      ],
      [
        819,
        "takes your girl",
        "GOBSTOPPER RIVAL // GIRLFRIEND SWOOP",
        "Jon Snow relationship riff",
        "comedy-candidate",
        "A relationship comparison uses gobstoppers and a romantic rival for comedy.",
      ],
      [
        933,
        "Elon Musk",
        "ELON MUSK DETOUR // NECKLACE EXIT",
        "Melisandre",
        "comedy-candidate",
        "Melisandre's exit is folded into an explicit Elon Musk aside.",
      ],
      [
        1045,
        "require me",
        "DRAGON SCREAM // EPICNESS REQUIRED",
        "Daenerys battle sequence",
        "evaluation-candidate",
        "The recap says the dragon battle needs a greater level of epicness.",
      ],
      [
        1109,
        "blew your load",
        "BATTLE CLIMAX // THE METAPHOR BREAKS",
        "The Long Night climax",
        "comedy-candidate",
        "A sexual metaphor critiques how the episode spends its dramatic climax.",
      ],
      [
        1204,
        "go back",
        "ROOTS OF THRONES // POLITICAL MEAT",
        "Game of Thrones political drama",
        "evaluation-candidate",
        "The discussion favors returning to the show's earlier political foundations.",
      ],
      [
        1316,
        "commie",
        "YOGURT CONSPIRACY // LATE-SHOW MELTDOWN",
        "Yogurt riff",
        "comedy-candidate",
        "A profane invented conspiracy about yogurt becomes a late comedy candidate.",
      ],
      [
        1387,
        "season three",
        "SEASON-THREE CALLBACK // PROMISE PAID",
        "Arya Stark callback",
        "evaluation-candidate",
        "The recap appreciates a season-three line returning in the current episode.",
      ],
    ]),
  },
  {
    id: "-h9tw8NjDGE",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "movie-news",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 86,
    cuts: cutRows([
      [
        63,
        "we can laugh",
        "KELCE BLOUSE // OPENING LAUGH",
        "Super Bowl aftermath",
        "comedy-candidate",
        "The news stream opens with a Travis Kelce blouse joke.",
      ],
      [
        346,
        "Netflix",
        "STREAMING PRICE BOARD // ALL CRAP",
        "Streaming services",
        "evaluation-candidate",
        "Netflix and other streaming services receive a blunt price-and-quality verdict.",
      ],
      [
        736,
        "halftime",
        "HALFTIME HEAT // GO BACK TO RAPPING",
        "Super Bowl halftime show",
        "evaluation-candidate",
        "The halftime discussion delivers an aggressive rejection of a musical complaint.",
      ],
      [
        1041,
        "Kendrick",
        "KENDRICK CAMERA // THE LOOK LANDS",
        "Kendrick Lamar halftime performance",
        "comedy-candidate",
        "A direct-to-camera Kendrick Lamar moment is recalled as uncontrollably funny.",
      ],
      [
        1166,
        "expand it",
        "HALFTIME FUTURE // EXPAND THE FORMAT",
        "Future halftime shows",
        "evaluation-candidate",
        "The conversation hopes next year's presentation expands beyond a familiar formula.",
      ],
      [
        1456,
        "in the trailer",
        "TRAILER VERDICT // VALENTINE IDEA",
        "Upcoming movie trailer",
        "evaluation-candidate",
        "A trailer premise is called foolish while its Valentine angle is examined.",
      ],
      [
        1680,
        "scream fans",
        "SCREAM AUDIENCE // EARLY-2000S FEEL",
        "Scream fandom",
        "evaluation-candidate",
        "The movie is assessed through its Scream audience and early-2000s tone.",
      ],
      [
        1815,
        "Batman 89",
        "BATMAN 89 // FRANCHISE PICK",
        "Batman films",
        "topic-door",
        "The stream opens a direct preference for the 1989 Batman film.",
      ],
      [
        2224,
        "would enjoy",
        "HIGHWAY BALONEY // HARD NO",
        "Music-listening scenario",
        "comedy-candidate",
        "An emphatic rejection becomes an intentionally crude highway-baloney riff.",
      ],
      [
        2453,
        "not that long",
        "VIDEO SEARCH // RUNTIME CHECK",
        "Source-video lookup",
        "format-cue",
        "The stream searches for a short source video during the discussion.",
      ],
      [
        2668,
        "awesome movie",
        "ENDING VERDICT // REVEAL WAS GARBAGE",
        "Movie ending discussion",
        "evaluation-candidate",
        "The film earns praise while its reveal and ending receive harsh criticism.",
      ],
      [
        2853,
        "can't see",
        "TIM DISAPPEARS // SCREEN CHECK",
        "Livestream technical check",
        "format-cue",
        "The live discussion pauses because a participant is no longer visible.",
      ],
      [
        3107,
        "Marvel",
        "MARVEL PANTRY // RELEASE WITHOUT SEQUELS",
        "Marvel release strategy",
        "evaluation-candidate",
        "The stream predicts Marvel will release a project without continuing it.",
      ],
      [
        3426,
        "into a remake",
        "SHINING REMAKE // OPEN TO THE IDEA",
        "The Shining remake",
        "evaluation-candidate",
        "The discussion expresses openness to remaking The Shining.",
      ],
      [
        3740,
        "get out ahead",
        "FLASHBACK ANNOUNCEMENT // SPOILER CONTROL",
        "Movie marketing",
        "evaluation-candidate",
        "The late discussion describes announcing a flashback to manage leaked information.",
      ],
    ]),
  },
  {
    id: "nPLI-6xF4IE",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "episode-recap",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 86,
    cuts: cutRows([
      [
        140,
        "grew up",
        "PENNYWISE GIRL // CHAT OPENS",
        "Live finale audience",
        "format-cue",
        "The finale recap opens with audience greetings and a viewing question.",
      ],
      [
        306,
        "praised",
        "SEASON EIGHT VERDICT // EXPECTATIONS COLLAPSE",
        "Game of Thrones season eight",
        "evaluation-candidate",
        "The recap contrasts earlier praise with a harsh season-eight verdict.",
      ],
      [
        394,
        "Halloween views",
        "HALLOWEEN THANKS // CHAT SIDEBAR",
        "Channel audience",
        "format-cue",
        "A brief audience thank-you interrupts the finale review.",
      ],
      [
        747,
        "Hayden Christensen",
        "ANAKIN COMPARISON // SCRIPT MATTERS",
        "Daenerys character arc",
        "evaluation-candidate",
        "A Star Wars comparison separates performance problems from weak writing.",
      ],
      [
        924,
        "like Batman",
        "BATMAN SHADOWS // JON NEEDS COURAGE",
        "Jon Snow",
        "comedy-candidate",
        "Jon's restraint is compared with Batman hiding silently in shadows.",
      ],
      [
        1158,
        "my story",
        "THRONE STORY // SELF-IMPORTANT RIFF",
        "Game of Thrones finale",
        "comedy-candidate",
        "A mocking voice satirizes a character's belief in personal importance.",
      ],
      [
        1267,
        "lock him up",
        "DRAGON SICKNESS // ANGRY PLEA",
        "Daenerys and Jon Snow",
        "comedy-candidate",
        "An angry plea about imprisonment escalates into wishing sickness on dragons.",
      ],
      [
        1421,
        "worst sin",
        "FINALE SIN // NO PAYOFF",
        "Game of Thrones finale verdict",
        "evaluation-candidate",
        "The recap identifies a core finale failure while weighing its severity.",
      ],
      [
        1655,
        "middle",
        "SCENE BRAKE // STORY STOPS",
        "Finale pacing",
        "evaluation-candidate",
        "The discussion criticizes a scene for interrupting more important story action.",
      ],
      [
        1849,
        "whole",
        "STORYLINE WASTE // KING UNDER THE TABLE",
        "Finale character resolution",
        "evaluation-candidate",
        "The recap questions why a long storyline ends with an ignored king.",
      ],
      [
        2042,
        "cameras",
        "BLACKBEARD DETOUR // CAMERA STORY",
        "Late-recap tangent",
        "comedy-candidate",
        "A fragmented camera story turns into a Captain Blackbeard tangent.",
      ],
      [
        2237,
        "hundred",
        "UNCERTAINTY DESK // TRYING TO HELP",
        "Audience clarification",
        "format-cue",
        "The discussion openly marks uncertainty while trying to clarify an answer.",
      ],
      [
        2411,
        "mentioned",
        "LAUGH TRACK // TYRION BUTTON",
        "Finale comedy",
        "comedy-candidate",
        "The recap says one exchange needed a sitcom laugh track.",
      ],
      [
        2567,
        "thousand different",
        "FAN WRITERS // BETTER ENDINGS",
        "Game of Thrones finale writing",
        "evaluation-candidate",
        "The review argues that unpaid fan ideas surpass the finale's writing.",
      ],
      [
        2781,
        "most crucial",
        "BATTLE DIARRHEA // WORST TIMING",
        "Battle-timing riff",
        "comedy-candidate",
        "A battle scenario becomes an intentionally crude worst-timing joke.",
      ],
    ]),
  },
  {
    id: "qocixR2FEA0",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "episode-recap",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 86,
    cuts: cutRows([
      [
        36,
        "inside the lights",
        "LIGHT BOX // PAPER MYSTERY",
        "Opening light-box discussion",
        "comedy-candidate",
        "The recap opens by puzzling over a light box and tissue paper.",
      ],
      [
        208,
        "Dracula",
        "DRACULA STEAK // SHOOTOUT VERDICT",
        "Welcome to Derry shootout",
        "comedy-candidate",
        "A Dracula sales joke precedes strong praise for the shootout.",
      ],
      [
        314,
        "good job",
        "MUSCHIETTI PRAISE // HALLORANN SAVIOR",
        "Andy Muschietti and Dick Hallorann",
        "evaluation-candidate",
        "The recap praises the storytelling while naming Hallorann its central savior.",
      ],
      [
        471,
        "in the chat",
        "GIGGLES BAN // CHAT TAKES OVER",
        "Livestream chat",
        "format-cue",
        "The recap addresses the live chat and rejects a clown nickname.",
      ],
      [
        595,
        "other big thing",
        "PILLARS FOUND // HALLORANN CONNECTS",
        "Welcome to Derry pillars",
        "topic-door",
        "The recap moves to the discovery of the pillars through Hallorann.",
      ],
      [
        742,
        "laughed",
        "MEETING REACTION // SERIOUS DELIVERY",
        "Welcome to Derry tribal meeting",
        "comedy-candidate",
        "The tribal meeting's solemn delivery triggers a self-questioning laugh.",
      ],
      [
        869,
        "season two",
        "SEASON TWO MAP // NEW TIMELINE",
        "Welcome to Derry season two",
        "topic-door",
        "The discussion explains that season two will move to another timeline.",
      ],
      [
        1043,
        "Mortal Kombat",
        "MORTAL KOMBAT YEAR // PARAMOUNT DETOUR",
        "Mortal Kombat and Paramount",
        "topic-door",
        "A Mortal Kombat release reference opens a Paramount news tangent.",
      ],
      [
        1164,
        "can't hear",
        "AUDIO BLACKOUT // I'M BEING SCARED",
        "Livestream audio problem",
        "comedy-candidate",
        "A live audio failure collides with a shouted fear reaction.",
      ],
      [
        1294,
        "No.",
        "DRAGONZORD SUMMON // VICTOR QUESTION",
        "Power Rangers riff",
        "comedy-candidate",
        "A Dragonzord reference interrupts the recap before a Victor question.",
      ],
      [
        1415,
        "college humor",
        "CHEERLEADER CLIP // COMEDY RECOMMENDATION",
        "CollegeHumor video",
        "evaluation-candidate",
        "The stream recommends a cheerleader video as an all-time comedy favorite.",
      ],
      [
        1559,
        "came off",
        "REFRIGERATOR LINEBACKER // PENNYWISE ATTACK",
        "Welcome to Derry attack",
        "comedy-candidate",
        "An attack is compared with a linebacker launching from a refrigerator.",
      ],
      [
        1690,
        "she was asleep",
        "BEDROOM DENIAL // YOU CALLED THAT",
        "Personal story",
        "comedy-candidate",
        "A bedroom anecdote ends with a denial and an immediate callback.",
      ],
      [
        1774,
        "HBO",
        "RIGHTS QUESTION // HBO AND BLUMHOUSE",
        "Welcome to Derry rights",
        "topic-door",
        "The discussion questions how HBO and Blumhouse ownership might intersect.",
      ],
      [
        1953,
        "available",
        "NEXT WEEK // MONDAY NIGHT PLAN",
        "WWAM programming schedule",
        "format-cue",
        "The show closes by moving the next livestream to Monday night.",
      ],
    ]),
  },
  {
    id: "ZipaD1w4oVg",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "episode-recap",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 86,
    cuts: cutRows([
      [
        46,
        "Dick's box",
        "DICK'S BOX // RECAP OPENS WRONG",
        "Dick Hallorann",
        "comedy-candidate",
        "The Hallorann discussion opens with an intentionally suggestive box joke.",
      ],
      [
        220,
        "Eagles",
        "EAGLES KICK // NEVER AGAIN",
        "Football sidebar",
        "comedy-candidate",
        "A football anecdote ends with an emphatic warning against repeating it.",
      ],
      [
        340,
        "really cool",
        "HALLORANN THREAD // STILL THE BEST",
        "Dick Hallorann",
        "evaluation-candidate",
        "The recap praises the Hallorann material while noting his unresolved fate.",
      ],
      [
        456,
        "Conjuring",
        "CONJURING MOVE // SCENE BREAKDOWN",
        "Welcome to Derry scare sequence",
        "topic-door",
        "The episode breakdown compares a scare sequence with The Conjuring.",
      ],
      [
        616,
        "bus crashes",
        "SHAWSHANK BUS // SECRET ROMANCE",
        "Welcome to Derry character story",
        "comedy-candidate",
        "A bus-crash reference leads into joking speculation about a hidden romance.",
      ],
      [
        752,
        "protect us",
        "PROTECTION PLAN // HEAR ME OUT",
        "Welcome to Derry theory",
        "comedy-candidate",
        "A far-fetched protection theory escalates into a drinking proposal.",
      ],
      [
        840,
        "been there",
        "ZIPPER DISASTER // LIFE IS OVER",
        "Personal mishap riff",
        "comedy-candidate",
        "A familiar zipper disaster is reenacted as a total-life-ending moment.",
      ],
      [
        1023,
        "Yeah",
        "LEFT BEHIND // NOT OUR PROBLEM",
        "Welcome to Derry character fate",
        "comedy-candidate",
        "A character being left behind triggers a blunt spoken dismissal.",
      ],
      [
        1159,
        "silly to me",
        "THEORY REPAIR // SAVE THE BRAIN",
        "Welcome to Derry story logic",
        "evaluation-candidate",
        "The recap chooses an explanatory theory because the alternative feels silly.",
      ],
      [
        1310,
        "IMDb",
        "DIRECTOR CHECK // MUSCHIETTI ANSWER",
        "Welcome to Derry episode director",
        "format-cue",
        "The stream checks the episode's directing credit during the recap.",
      ],
      [
        1459,
        "Terrifier",
        "TERRIFIER ARCADE // FUN BUT REPETITIVE",
        "Terrifier video game",
        "evaluation-candidate",
        "The Terrifier arcade game is called fun but repetitive.",
      ],
      [
        1624,
        "laughter",
        "BLEEDING LOOP // TEN-SECOND MELTDOWN",
        "Welcome to Derry injury scene",
        "comedy-candidate",
        "An injured character's repeated profanity becomes a compact comedy candidate.",
      ],
      [
        1693,
        "week",
        "STRANGER THINGS WEEK // THANKSGIVING DROP",
        "Stranger Things season five",
        "topic-door",
        "The post-recap discussion turns to the next Stranger Things release.",
      ],
      [
        1836,
        "whole ordeal",
        "RFK STORY // LAUGHING LATER",
        "News tangent",
        "comedy-candidate",
        "A news tangent promises future laughs before beginning an RFK anecdote.",
      ],
      [
        1974,
        "holiday",
        "HOLIDAY POEMS // WEDNESDAY BUTTON",
        "WWAM holiday stream",
        "format-cue",
        "The show closes by previewing holiday poems for Wednesday's stream.",
      ],
    ]),
  },
  {
    id: "G2OGPR70z_Y",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "movie-review",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 85,
    cuts: cutRows([
      [
        158,
        "Batman universe",
        "SNIPES BOARD // PASSENGER 57 TEST",
        "Wesley Snipes film ranking",
        "topic-door",
        "The review opens a comparison between Demolition Man and Passenger 57.",
      ],
      [
        421,
        "underrated",
        "SNIPES COMEBACK // UNDERRATED LEDGER",
        "Wesley Snipes",
        "evaluation-candidate",
        "The discussion calls Snipes underrated and considers his post-prison comeback.",
      ],
      [
        793,
        "booger",
        "BOOGER SPOTTED // CAN'T UNSEE IT",
        "Demolition Man detail",
        "comedy-candidate",
        "A newly noticed detail becomes impossible to ignore after being mentioned.",
      ],
      [
        914,
        "catch your poop",
        "THREE SEASHELLS // THE THEORY GETS GRAPHIC",
        "Demolition Man three seashells",
        "comedy-candidate",
        "The three-seashell mystery receives an intentionally graphic invented explanation.",
      ],
      [
        1121,
        "algebra",
        "ALGEBRA DETOUR // SENTENCE COLLAPSE",
        "Demolition Man education riff",
        "comedy-candidate",
        "An algebra reference spirals into a fragmented and explicit spoken riff.",
      ],
      [
        1541,
        "absolutely",
        "OBAMA VOICE // IMPRESSION ABORTED",
        "Livestream impression",
        "comedy-candidate",
        "A voice comparison begins and is immediately abandoned as impossible.",
      ],
      [
        1819,
        "Chucky",
        "CHUCKY PATCH // WESLEY LOOK",
        "Wesley Snipes appearance",
        "comedy-candidate",
        "A character's appearance is compared with Chucky and a Cabbage Patch figure.",
      ],
      [
        2096,
        "the chat",
        "CHAT VERDICT // ARE WE CRAZY",
        "Audience movie ranking",
        "format-cue",
        "The review asks the audience to judge a disputed ranking opinion.",
      ],
      [
        2487,
        "Netflix",
        "NETFLIX QUEUE // NIGHTHAWK SIDEBAR",
        "Demolition Man availability",
        "topic-door",
        "The conversation checks whether the film sits in a Netflix queue.",
      ],
      [
        2568,
        "grown as an actor",
        "ACTING GROWTH // ROLES REVERSED",
        "Demolition Man performances",
        "evaluation-candidate",
        "The review discusses acting growth and a reversal in performance strengths.",
      ],
      [
        2925,
        "chopsticks",
        "SEASHELLS AGAIN // CHOPSTICK THEORY",
        "Demolition Man three seashells",
        "comedy-candidate",
        "A second three-seashell explanation substitutes chopsticks and makes less sense.",
      ],
      [
        3178,
        "this computer",
        "COMPUTER CONFUSION // HATE BUT NEED",
        "Technology tangent",
        "comedy-candidate",
        "A Macintosh identification failure ends with frustrated dependence on computers.",
      ],
      [
        3388,
        "talking about",
        "BILLY BLANKS SEARCH // MEMORY FAILS",
        "Billy Blanks filmography",
        "topic-door",
        "The late discussion tries and fails to recall a Billy Blanks movie.",
      ],
      [
        3729,
        "thank you",
        "AUDIENCE THANKS // CHICAGO BUTTON",
        "Livestream audience",
        "format-cue",
        "The show pauses to offer emphatic thanks to the audience.",
      ],
      [
        4004,
        "40 wings",
        "WING ECONOMICS // FORTY FOR TWENTY",
        "Food-price tangent",
        "evaluation-candidate",
        "A late food tangent celebrates a forty-wings-for-twenty-dollars deal.",
      ],
    ]),
  },
  {
    id: "QwJb31dSo9Y",
    artifact: "public/demo/archive-recovery-batch1.js",
    global: "WWAM_ARCHIVE_RECOVERY_BATCH1",
    format: "spoiler-review",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 85,
    cuts: cutRows([
      [
        192,
        "seen in the trailer",
        "TRAILER BOUNDARY // SPOILER-FREE PROMISE",
        "Halloween Kills trailer material",
        "format-cue",
        "The review limits its opening example to footage already in the trailer.",
      ],
      [
        498,
        "cannot describe",
        "MICHAEL'S LOOK // IMPOSSIBLE TO DESCRIBE",
        "Michael Myers appearance",
        "evaluation-candidate",
        "The spoiler-free review delivers emphatic praise for Michael's appearance.",
      ],
      [
        878,
        "in the chat",
        "NO-SPOILER CHAT // VIEWERS PROTECTED",
        "Livestream spoiler policy",
        "format-cue",
        "The stream asks the chat to avoid spoilers for departing viewers.",
      ],
      [
        1252,
        "how stupid",
        "APRIL'S LOOK // SELF-AWARE REACTION",
        "Halloween Kills viewing reaction",
        "comedy-candidate",
        "A companion's expression makes the speaker notice an exaggerated reaction.",
      ],
      [
        1569,
        "aren't in the trailer",
        "TRAILER MAP // SNIPPETS EVERYWHERE",
        "Halloween Kills marketing",
        "evaluation-candidate",
        "The review argues that the trailer contains snippets of nearly everything.",
      ],
      [
        1894,
        "Mortal Kombat",
        "ANNIHILATION VOICE // HANDLER RIFF",
        "Mortal Kombat: Annihilation",
        "comedy-candidate",
        "A Mortal Kombat impression becomes an intentionally crude compliment.",
      ],
      [
        2148,
        "everybody around",
        "THEATER CROWD // LAUGHS ALIGN",
        "Halloween Kills theater experience",
        "evaluation-candidate",
        "The review praises the crowd for laughing together at odd moments.",
      ],
      [
        2555,
        "holy poop",
        "HOLY POOP // SHOCK AND LAUGH",
        "Halloween Kills shock moment",
        "comedy-candidate",
        "A surprise provokes laughter and a shouted sanitized expletive at once.",
      ],
      [
        3164,
        "patrol",
        "SHERIFF VERDICT // WORST IN MOVIE HISTORY",
        "Halloween Kills sheriff",
        "evaluation-candidate",
        "The review calls the sheriff one of movie history's worst.",
      ],
      [
        3502,
        "stoppers",
        "GOBSTOPPER SEARCH // EXTREME DEMAND",
        "Gobstopper riff",
        "comedy-candidate",
        "A demand for gobstoppers becomes an explicit spoken bit.",
      ],
      [
        3716,
        "main cast",
        "CRAFT LEDGER // CAST GORE AND KILLS",
        "Halloween Kills craft verdict",
        "evaluation-candidate",
        "The review praises the main cast, gore, and kills in succession.",
      ],
      [
        3997,
        "handled that",
        "KNIFE CHOICE // SCENE DETAIL",
        "Michael Myers knife selection",
        "evaluation-candidate",
        "A scene detail about Michael choosing a knife receives positive assessment.",
      ],
      [
        4345,
        "talking about",
        "2018 CALLBACK // GREAT LINE SEARCH",
        "Halloween 2018 callbacks",
        "topic-door",
        "The discussion searches for a memorable line connected with the 2018 film.",
      ],
      [
        4690,
        "gay happen",
        "REPRESENTATION VERDICT // STORY FIRST",
        "Movie representation",
        "evaluation-candidate",
        "The conversation says identity matters less than seeing a good movie.",
      ],
      [
        5038,
        "gary callas",
        "MOB THEORY // WRITING QUESTION",
        "Halloween Kills mob storyline",
        "evaluation-candidate",
        "The late review considers whether mob complaints stem from recent writing.",
      ],
    ]),
  },
  {
    id: "0NHYmg_pXyc",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "general-livestream",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 83,
    cuts: cutRows([
      [
        300,
        "watched the trailer",
        "TRAILER CHECK // FIRST LOOK",
        "Upcoming movie trailer",
        "format-cue",
        "The livestream establishes who has watched the new trailer.",
      ],
      [
        819,
        "constantly",
        "FANTASTIC FOUR // SPEEDWAY DETOUR",
        "Fantastic Four",
        "comedy-candidate",
        "A Fantastic Four verdict collides with a strange Speedway comparison.",
      ],
      [
        1080,
        "shitty movie",
        "OLD SCI-FI MEMORY // BAD BUT AWESOME",
        "Childhood science-fiction viewing",
        "evaluation-candidate",
        "The discussion remembers a flawed movie as awesome in its era.",
      ],
      [
        1266,
        "pockets",
        "EMPTY POCKET MEAL // WORST DIP",
        "Food improvisation",
        "comedy-candidate",
        "A broke-food confession promises the worst possible dip and chips.",
      ],
      [
        1911,
        "shout-out",
        "LOOMIS SHOUT-OUT // VIEWER WATCHING",
        "Dr. Loomis running gag",
        "format-cue",
        "An audience request asks for a Dr. Loomis shout-out.",
      ],
      [
        2283,
        "long driveway",
        "TRASH-NIGHT RUN // CHILDHOOD FEAR",
        "Childhood horror memory",
        "comedy-candidate",
        "A long-driveway memory describes sprinting back after taking out trash.",
      ],
      [
        2757,
        "serious now",
        "SERIOUS NOW // OVER THE TOP",
        "Late-stream spoken riff",
        "comedy-candidate",
        "A declaration of seriousness turns into an Over the Top reference.",
      ],
      [
        3243,
        "everybody got",
        "PUNCH-UP PANIC // OH MY GOD",
        "Movie-fight discussion",
        "comedy-candidate",
        "A violent sequence is reenacted through repeated shocked exclamations.",
      ],
      [
        3508,
        "Michael Myers",
        "MORGUE ESCAPE // MICHAEL DISAPPEARS",
        "Michael Myers",
        "topic-door",
        "The Halloween discussion reaches Michael's disappearance after the morgue.",
      ],
      [
        3962,
        "not one actress",
        "PERFORMANCE VERDICT // NOBODY BETTER",
        "Movie performance",
        "evaluation-candidate",
        "The discussion says no other performer did a better job.",
      ],
      [
        4569,
        "put on paper",
        "IDEA OVERLOAD // CAN'T FOCUS",
        "Creative writing process",
        "evaluation-candidate",
        "The stream describes too many story ideas preventing focused writing.",
      ],
      [
        4733,
        "Stephen King",
        "SOMETIMES THEY COME BACK // REMAKE CASE",
        "Stephen King adaptations",
        "evaluation-candidate",
        "A Stephen King tangent proposes Sometimes They Come Back for a remake.",
      ],
      [
        5293,
        "asking earlier",
        "REPEATED QUESTION // SIXTH TIME",
        "Livestream audience questions",
        "format-cue",
        "The stream notes that one audience question has been asked repeatedly.",
      ],
      [
        5625,
        "whatever it takes",
        "CREATOR GRIT // WORK THROUGH SUCKING",
        "Creative persistence",
        "evaluation-candidate",
        "The discussion argues that improvement requires persistence through harsh criticism.",
      ],
      [
        6135,
        "package",
        "MYSTERY PACKAGE // UNBOXING PROMISE",
        "Upcoming unboxing",
        "format-cue",
        "The late show previews a special package for a future unboxing video.",
      ],
    ]),
  },
  {
    id: "5rM39QsTBk4",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "spoiler-review",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 83,
    cuts: cutRows([
      [
        202,
        "interviewed",
        "NAME LOST // INTERVIEW MEMORY FAIL",
        "Maxxxine production discussion",
        "comedy-candidate",
        "An interview memory collapses while the correct name stays out of reach.",
      ],
      [
        851,
        "told him",
        "SUCK-IT NOTE // WORDING GETS GRAPHIC",
        "Maxxxine character exchange",
        "comedy-candidate",
        "A character's insult is exaggerated into a graphic delivery joke.",
      ],
      [
        1202,
        "Halloween 2018",
        "HALLOWEEN COMEDY // ACTOR DEFENSE",
        "Halloween 2018",
        "evaluation-candidate",
        "The review defends an actor associated with Halloween 2018's comedy.",
      ],
      [
        1651,
        "backlash",
        "MAXXXINE BACKLASH // HATE THEORY",
        "Maxxxine audience response",
        "topic-door",
        "The spoiler discussion enters the backlash surrounding Maxxxine.",
      ],
      [
        2121,
        "Scream five",
        "SCREAM COMPARISON // SHOW WEAKNESS",
        "Maxine character arc",
        "evaluation-candidate",
        "A Scream comparison argues that the lead should display more vulnerability.",
      ],
      [
        2159,
        "director's explaining",
        "DIRECTOR EXPLAINS // MOTIVATION QUESTION",
        "Maxxxine story logic",
        "evaluation-candidate",
        "The review questions why a director would explain a key motivation.",
      ],
      [
        2753,
        "take a rest",
        "SCAREFEST BAR // DRINKY-POO BREAK",
        "ScareFest",
        "comedy-candidate",
        "A ScareFest bar memory becomes a playful drinky-poo sidebar.",
      ],
      [
        3428,
        "explosions",
        "MAGIC TRICK REVIEW // SLOW AND DEPRESSING",
        "Maxxxine pacing",
        "evaluation-candidate",
        "The review contrasts explosive marketing with a slow, depressing delivery.",
      ],
      [
        3852,
        "in the scream",
        "SCREAM FRANCHISE // TONGUE TWISTER",
        "Scream franchise",
        "comedy-candidate",
        "A Scream-franchise compliment becomes a repeated verbal stumble.",
      ],
      [
        3913,
        "actress",
        "CAST RUMOR // HOPE IT ISN'T TRUE",
        "Maxxxine cast",
        "evaluation-candidate",
        "The cast discussion explicitly withholds certainty about a behind-the-scenes rumor.",
      ],
      [
        4616,
        "franchise",
        "X TRILOGY // UNDERDOG TO MACHINE",
        "X film series",
        "evaluation-candidate",
        "The series is described as growing from surprise underdog into an expanding franchise.",
      ],
      [
        4760,
        "timeline",
        "2024 TIMELINE // MAZE BALLS",
        "Franchise timeline",
        "comedy-candidate",
        "Timeline confusion becomes an extended maze-and-sauce wordplay riff.",
      ],
      [
        5282,
        "turkey burgers",
        "WAHLBURGERS THREAT // TURKEY BURGER ENDGAME",
        "Mark Wahlberg tangent",
        "comedy-candidate",
        "A turkey-burger complaint escalates into an intentionally graphic Wahlburgers threat.",
      ],
      [
        5817,
        "terrible ass name",
        "BOSS LEVEL // TITLE REJECTED",
        "Boss Level",
        "evaluation-candidate",
        "The late movie discussion harshly rejects Boss Level as a title.",
      ],
      [
        5938,
        "box office",
        "BOX OFFICE FLOP // BOOGIE NIGHTS RIFF",
        "Movie box office",
        "comedy-candidate",
        "A box-office flop comparison invokes an explicit Boogie Nights joke.",
      ],
    ]),
  },
  {
    id: "8cJ8HjSwH8w",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "general-livestream",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 83,
    cuts: cutRows([
      [
        141,
        "buttholes",
        "GAS SHORTAGE // WALMART-BAG PANIC",
        "Gas-shortage news",
        "comedy-candidate",
        "The stream opens with an exaggerated account of panic gas buying.",
      ],
      [
        758,
        "halloween 4",
        "HALLOWEEN CREW // FRANCHISE REBUILD",
        "Halloween sequel pitch",
        "topic-door",
        "The discussion assembles past Halloween filmmakers for an imagined sequel.",
      ],
      [
        1084,
        "hills have eyes",
        "HILLS REMAKE // DIRECTOR WISH LIST",
        "Alexandre Aja",
        "evaluation-candidate",
        "The Hills Have Eyes remake director enters a Halloween wish list.",
      ],
      [
        1859,
        "respect",
        "DIE HARD MOVE // SUDDEN PANIC",
        "Livestream disruption",
        "comedy-candidate",
        "A sudden disruption triggers a rapid Die Hard-related panic.",
      ],
      [
        1904,
        "pull up the trailer",
        "TRAILER DESK // BEFORE THE BREAK",
        "Upcoming trailer segment",
        "format-cue",
        "The show announces a trailer segment before the next break.",
      ],
      [
        2598,
        "super chat",
        "SUPER CHAT THANKS // WATER AND G2",
        "Livestream audience",
        "format-cue",
        "The stream thanks a viewer and briefly inventories the drinks.",
      ],
      [
        3133,
        "through him",
        "MONSTER ANATOMY // BUTT QUESTION",
        "Creature-feature riff",
        "comedy-candidate",
        "A creature discussion derails into a direct anatomical question.",
      ],
      [
        3505,
        "background",
        "BACKGROUND TAKES SHAPE // TERRIBLE VERDICT",
        "Late-stream reaction",
        "evaluation-candidate",
        "A background-related subject receives an immediate repeated negative verdict.",
      ],
      [
        3681,
        "you know",
        "CALLBACK ANXIETY // WHAT'S THE PROBLEM",
        "Communication tangent",
        "comedy-candidate",
        "An imagined unanswered phone call becomes an anxious spoken bit.",
      ],
      [
        4168,
        "sheriff",
        "SHERIFF BRACKETT // REINED-IN DEFENSE",
        "Sheriff Brackett",
        "evaluation-candidate",
        "A restrained Sheriff Brackett portrayal receives explicit praise.",
      ],
      [
        4765,
        "little bit",
        "COPYCAT MICHAEL // LOST ALTERNATE PATH",
        "Halloween alternate story",
        "evaluation-candidate",
        "The Halloween discussion considers a copycat-killer route that never materialized.",
      ],
      [
        5179,
        "Michael Myers",
        "MICHAEL VERSUS PINHEAD // CROSSOVER CASE",
        "Michael Myers versus Pinhead",
        "topic-door",
        "The stream tests whether a Michael-versus-Pinhead crossover could work.",
      ],
      [
        5610,
        "streaming service",
        "STREAMING OR CINEMA // RELEASE QUESTION",
        "Horror release strategy",
        "topic-door",
        "The audience discussion compares streaming and theatrical release routes.",
      ],
      [
        5844,
        "halloween six",
        "HALLOWEEN SIX // MISSED THE BOAT",
        "Halloween: The Curse of Michael Myers",
        "evaluation-candidate",
        "The conversation argues that additional Halloween 6 material could have worked.",
      ],
      [
        6663,
        "well i can't",
        "COUNT CHOCULA // QUOTE LOST",
        "Late-stream quote search",
        "comedy-candidate",
        "The stream loses a quote while repeatedly circling Count Chocula.",
      ],
    ]),
  },
]);

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/>>+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function boundedExcerpt(value, limit = PUBLIC_EXCERPT_WORD_LIMIT) {
  return words(value).slice(0, limit).join(" ");
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadWindowAssignment(filePath, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, {
    filename: filePath,
  });
  const payload = context.window[globalName];
  if (!payload || typeof payload !== "object") {
    throw new Error(`${globalName} was not found in ${filePath}.`);
  }
  return clone(payload);
}

function sourceRecords(payload) {
  for (const key of ["streams", "records", "sources"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  throw new Error("Canonical artifact does not expose a source array.");
}

function locateAnchor(lines, spec, sourceId) {
  const needle = clean(spec.needle).toLowerCase();
  const exact = lines.filter((line) => line.at === spec.at);
  const match = exact.find((line) =>
    clean(line.text).toLowerCase().includes(needle),
  );
  if (!match) {
    const diagnostic = exact.map((line) => line.text).join(" | ");
    throw new Error(
      `${sourceId} has no exact ${spec.at}s caption containing "${spec.needle}". Found: ${diagnostic}`,
    );
  }
  return match;
}

function excerptAt(lines, anchor) {
  const local = lines
    .filter((line) => line.at >= anchor.at && line.at <= anchor.at + 7)
    .slice(0, 4)
    .map((line) => line.text)
    .join(" ");
  return boundedExcerpt(local || anchor.text);
}

function classificationState(classification) {
  if (classification === "evaluation-candidate") {
    return {
      claimLane: "spoken-evaluation-candidate",
      navigationOnly: false,
      candidateType: "evaluation",
    };
  }
  if (classification === "comedy-candidate") {
    return {
      claimLane: "spoken-comedy-candidate",
      navigationOnly: false,
      candidateType: "comedy",
    };
  }
  return {
    claimLane: "topic-navigation",
    navigationOnly: true,
    candidateType: null,
  };
}

function loadSource(config, rootDir) {
  const artifactPath = path.join(rootDir, config.artifact);
  const captionPath = path.join(
    rootDir,
    "source-cache",
    "captions",
    `${config.id}.json`,
  );
  const metadataPath = path.join(
    rootDir,
    "source-cache",
    "metadata",
    `${config.id}.json`,
  );
  for (const filePath of [artifactPath, captionPath, metadataPath]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`${config.id} is missing evidence file ${filePath}.`);
    }
  }

  const artifactRaw = fs.readFileSync(artifactPath);
  const payload = loadWindowAssignment(artifactPath, config.global);
  const source = sourceRecords(payload).find((record) => record.id === config.id);
  if (!source) {
    throw new Error(`${config.id} was not found in ${config.artifact}.`);
  }

  const captionRaw = fs.readFileSync(captionPath);
  const captionPayload = JSON.parse(captionRaw.toString("utf8"));
  const metadataRaw = fs.readFileSync(metadataPath);
  const metadata = JSON.parse(metadataRaw.toString("utf8"));
  const duration = Number(source.duration);
  const lines = parseCaptionLines(captionPayload).filter(
    (line) => line.at < duration && words(line.text).length > 0,
  );

  if (
    metadata.id !== config.id ||
    clean(metadata.title) !== clean(source.title) ||
    Number(metadata.duration) !== duration ||
    clean(metadata.upload_date) !== clean(source.date).replace(/-/g, "")
  ) {
    throw new Error(`${config.id} metadata and canonical identity diverged.`);
  }
  const localProvenance = captionPayload._shokkerProvenance;
  const isLocalAsr =
    localProvenance?.kind === "local-speech-to-text" &&
    localProvenance?.language === "en" &&
    localProvenance?.speakerDiarized === false &&
    localProvenance?.canonicalTimestampMapping === true;
  const isYouTubeAsr =
    /[?&]kind=asr(?:&|$)/.test(clean(metadata.caption_url)) &&
    /[?&]lang=en(?:&|$)/.test(clean(metadata.caption_url));
  if (!isLocalAsr && !isYouTubeAsr) {
    throw new Error(`${config.id} lacks a proven English ASR track.`);
  }
  const rights = source.rightsPolicy || {};
  if (
    rights.mode !== config.boundaryMode ||
    rights.restrictedToTopicNavigation !== false ||
    rights.speakerClaimsAllowed !== false ||
    rights.performerClaimsAllowed !== false ||
    rights.originClaimsAllowed !== false ||
    rights.visualClaimsAllowed !== false ||
    rights.promotionAllowed !== false
  ) {
    throw new Error(`${config.id} rights boundary changed; re-audit required.`);
  }
  if (lines.length < 500 || lines.at(-1).at < duration * 0.8) {
    throw new Error(`${config.id} caption cache is too thin for this rebuild.`);
  }

  return {
    source,
    artifactRaw,
    captionRaw,
    metadataRaw,
    lines,
    captionProvenance: isLocalAsr
      ? {
          type: "local-speech-to-text",
          track: "Local English speech-to-text transcript",
          eventType: "local-asr-caption-event",
          kind: "asr",
          language: "en",
          engine: localProvenance.engine,
          model: localProvenance.model,
          speakerDiarized: false,
          canonicalTimestampMapping: true,
          fullPayloadPublic: false,
        }
      : {
          type: "youtube-automatic-caption",
          track: "English YouTube automatic captions (JSON3)",
          eventType: "youtube-json3-caption-event",
          kind: "asr",
          language: "en",
          speakerDiarized: false,
          canonicalTimestampMapping: true,
          fullPayloadPublic: false,
        },
  };
}

function buildGuide(config, input) {
  const duration = Number(input.source.duration);
  if (config.cuts.length !== 15) {
    throw new Error(`${config.id} must retain exactly 15 bounded cuts.`);
  }
  const cuts = config.cuts.map((spec, index) => {
    const anchor = locateAnchor(input.lines, spec, config.id);
    const classification = classificationState(spec.classification);
    return {
      id: `topic-rebuild-b4-${config.id}-${String(index + 1).padStart(2, "0")}-${anchor.at}`,
      at: anchor.at,
      end: Math.min(duration, anchor.at + CUT_LENGTH_SECONDS),
      evidenceAt: anchor.at,
      label: spec.label,
      topic: spec.topic,
      classification: spec.classification,
      claimLane: classification.claimLane,
      navigationOnly: classification.navigationOnly,
      candidateType: classification.candidateType,
      summary: spec.summary,
      excerpt: excerptAt(input.lines, anchor),
      evidence: {
        type: input.captionProvenance.type,
        track: input.captionProvenance.track,
        timestampStatus: "exact-caption-event",
        excerptStatus: "short-source-fragment",
        speakerStatus: "not-diarized",
        performerStatus: "not-inferred",
        originStatus: "not-inferred",
        visualContextStatus: "not-verified",
        placementStatus: "not-applicable",
        reviewStatus: "machine-surfaced-unreviewed",
        promotionAllowed: false,
        humanReviewRequired: true,
      },
      promotionAllowed: false,
      humanEditorialReviewPerformed: false,
    };
  });

  for (let index = 1; index < cuts.length; index += 1) {
    if (cuts[index - 1].at >= cuts[index].at) {
      throw new Error(`${config.id} cuts are not strictly chronological.`);
    }
  }

  const counts = cuts.reduce(
    (result, cut) => {
      result[cut.classification] += 1;
      return result;
    },
    {
      "topic-door": 0,
      "format-cue": 0,
      "evaluation-candidate": 0,
      "comedy-candidate": 0,
    },
  );
  if (
    counts["topic-door"] + counts["format-cue"] < 1 ||
    counts["evaluation-candidate"] < 1 ||
    counts["comedy-candidate"] < 1
  ) {
    throw new Error(
      `${config.id} must distinguish navigation, evaluation, and comedy lanes.`,
    );
  }

  const firstAt = cuts[0].at;
  const lastEnd = cuts.at(-1).end;
  const guide = {
    schema: "wwam-episode-guide-v2-topic-rebuild/v1",
    variant: "topic-rebuild-batch4-unreviewed",
    format: config.format,
    publicationStatus: "quarantined-rebuild-shard",
    promotionAllowed: false,
    humanEditorialReviewPerformed: false,
    creatorApprovalClaimed: false,
    basis:
      "Exact-source English ASR events with bounded playback. Topic and format doors are navigation. Evaluation and comedy lanes require explicit spoken wording and remain unreviewed candidates.",
    overview: `${input.source.title} receives ${cuts.length} bounded source cuts across ${counts["topic-door"] + counts["format-cue"]} navigation or format doors, ${counts["evaluation-candidate"]} spoken evaluation candidates, and ${counts["comedy-candidate"]} spoken comedy candidates. Speaker, performer, audio origin, and visual context remain unset.`,
    evidenceLimitations: [
      "The caption or speech-to-text events are not speaker-diarized.",
      "Caption words do not establish a speaker, performer, embedded-audio origin, scene, or visual context.",
      "A show title, guest name, or topic reference does not prove who spoke the captioned words.",
      "Every evaluation or comedy label is a machine-surfaced candidate pending exact-source human review.",
      "Promotion is disabled.",
    ],
    runtimeCoverage: {
      firstAt,
      lastEnd,
      firstPercent: Number(((firstAt / duration) * 100).toFixed(2)),
      lastPercent: Number(((lastEnd / duration) * 100).toFixed(2)),
      spanPercent: Number((((lastEnd - firstAt) / duration) * 100).toFixed(2)),
    },
    classificationCounts: counts,
    cuts,
    reviewChecklist: [
      "Play every proposed in and out point against the exact official upload.",
      "Confirm whether the words come from WWAM, a guest, embedded media, a reading, or another source.",
      "Set speaker, performer, and audio origin only after human verification.",
      "Do not convert spoken references into verified visual, scene, or source-media claims.",
      "Keep promotion disabled until context, rights, and final copy are approved.",
    ],
  };
  guide.generationSha256 = sha256(stableJson(guide));
  return guide;
}

export function payloadContentSha256(payload) {
  const value = clone(payload);
  if (value.provenance) delete value.provenance.contentSha256;
  return sha256(stableJson(value));
}

export function buildTopicRebuildBatch4({ rootDir = PROJECT_ROOT } = {}) {
  const guides = TOPIC_REBUILD_BATCH4_CONFIGS.map((config) => {
    const input = loadSource(config, rootDir);
    const episodeGuide = buildGuide(config, input);
    return {
      id: config.id,
      title: input.source.title,
      date: input.source.date,
      duration: Number(input.source.duration),
      url: input.source.url,
      thumbnail: input.source.thumbnail,
      sourceArtifact: config.artifact,
      sourceContentMode: input.source.contentMode,
      sourceAudit: {
        advisory: "generic-label-dominance",
        score: config.advisoryScore,
      },
      sourceState: {
        evidenceState: "machine-surfaced",
        reviewState: "machine-surfaced-unreviewed",
        publicationStatus: "quarantined-rebuild-shard",
        promotionAllowed: false,
        humanEditorialReviewPerformed: false,
        creatorApprovalClaimed: false,
      },
      rightsPolicy: {
        mode: config.boundaryMode,
        restrictedToTopicNavigation: false,
        publicExcerptWordLimit: PUBLIC_EXCERPT_WORD_LIMIT,
        speakerClaimsAllowed: false,
        performerClaimsAllowed: false,
        originClaimsAllowed: false,
        visualClaimsAllowed: false,
        visualResultClaimsAllowed: false,
        promotionAllowed: false,
      },
      inputEvidence: {
        canonicalArtifactSha256: sha256(input.artifactRaw),
        canonicalRecordSha256: sha256(stableJson(input.source)),
        captionSha256: sha256(input.captionRaw),
        metadataSha256: sha256(input.metadataRaw),
        captionEventsParsed: input.lines.length,
        firstCaptionAt: input.lines[0].at,
        lastCaptionAt: input.lines.at(-1).at,
        captionProvenance: input.captionProvenance,
      },
      episodeGuide,
    };
  });

  const payload = {
    schema: "wwam-episode-guide-v2-topic-rebuild-batch4/v1",
    generated: GENERATED,
    selection: {
      ids: TOPIC_REBUILD_BATCH4_CONFIGS.map((config) => config.id),
      count: TOPIC_REBUILD_BATCH4_CONFIGS.length,
      reason:
        "The thirteen remaining generic-label advisories after Batches 1 through 3, rebuilt across ranking, news, recap, review, and open-livestream formats.",
      integratedIntoSharedRuntime: false,
    },
    policy: {
      publicExcerptWordLimit: PUBLIC_EXCERPT_WORD_LIMIT,
      cutsPerShow: 15,
      speakerAttributionAllowed: false,
      performerAttributionAllowed: false,
      originAttributionAllowed: false,
      visualClaimsAllowed: false,
      unverifiedPlacementClaimsAllowed: false,
      promotionAllowed: false,
      humanEditorialReviewPerformed: false,
      creatorApprovalClaimed: false,
      reviewState: "machine-surfaced-unreviewed",
    },
    provenance: {
      generator:
        "scripts/generate-episode-guide-v2-topic-rebuild-batch4.mjs",
      method:
        "Deterministic exact-source rebuild from canonical source records, local English ASR event caches, exact caption-event anchors, bounded playback windows, and manually specified evidence-safe labels and summaries.",
    },
    meta: {
      guides: guides.length,
      cuts: guides.reduce(
        (total, record) => total + record.episodeGuide.cuts.length,
        0,
      ),
      topicDoors: guides.reduce(
        (total, record) =>
          total +
          record.episodeGuide.classificationCounts["topic-door"] +
          record.episodeGuide.classificationCounts["format-cue"],
        0,
      ),
      evaluationCandidates: guides.reduce(
        (total, record) =>
          total +
          record.episodeGuide.classificationCounts["evaluation-candidate"],
        0,
      ),
      comedyCandidates: guides.reduce(
        (total, record) =>
          total +
          record.episodeGuide.classificationCounts["comedy-candidate"],
        0,
      ),
    },
    guides,
  };
  payload.provenance.contentSha256 = payloadContentSha256(payload);
  return payload;
}

export function renderTopicRebuildBatch4(payload) {
  return `window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH4 = ${JSON.stringify(payload)};\n`;
}

function main() {
  const payload = buildTopicRebuildBatch4();
  fs.writeFileSync(OUTPUT_PATH, renderTopicRebuildBatch4(payload));
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)} with ${payload.meta.guides} guides and ${payload.meta.cuts} cuts.\n`,
  );
}

if (path.resolve(process.argv[1] || "") === path.resolve(SCRIPT_PATH)) {
  main();
}
