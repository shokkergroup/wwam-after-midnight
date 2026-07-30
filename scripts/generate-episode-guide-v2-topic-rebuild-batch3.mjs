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
  "episode-guide-v2-topic-rebuild-batch3.js",
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

export const TOPIC_REBUILD_BATCH3_CONFIGS = Object.freeze([
  {
    id: "1luh7mKQfz8",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "spoiler-review",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 90,
    cuts: cutRows([
      [
        184,
        "spoilered heavy",
        "SPOILER GATE // ENDGAME OPENS",
        "Avengers: Endgame spoiler review",
        "format-cue",
        "The spoken opening explicitly warns that the Endgame discussion will be spoiler heavy.",
      ],
      [
        329,
        "Superman flew",
        "SUPERMAN CRASHES MARVEL // OPENING RIFF",
        "Endgame opening discussion",
        "comedy-candidate",
        "A deliberately impossible Superman rescue becomes an early spoken comedy candidate.",
      ],
      [
        580,
        "Cathy Marvel",
        "CAPTAIN MARVEL ARRIVES // NAME GOES SIDEWAYS",
        "Captain Marvel",
        "comedy-candidate",
        "A mangled Captain Marvel reference opens a comic reaction to the character's arrival.",
      ],
      [
        779,
        "Pano's reveals",
        "THANOS REVEAL // THE STONES ARE GONE",
        "Thanos and the Infinity Stones",
        "topic-door",
        "The caption track enters the reveal about Thanos using and destroying the stones.",
      ],
      [
        851,
        "had a little",
        "HAWKEYE FAMILY LOSS // THE STORY PULLS",
        "Hawkeye",
        "evaluation-candidate",
        "The spoken reaction describes being pulled into Hawkeye's grief over his family.",
      ],
      [
        974,
        "butterfly effect",
        "TIME TRAVEL BOARD // BUTTERFLY EFFECT",
        "Endgame time travel",
        "topic-door",
        "An explicit butterfly-effect reference opens the movie's time-travel logic discussion.",
      ],
      [
        1300,
        "underrated actor",
        "RENNER LEDGER // UNDERRATED PERFORMANCE",
        "Jeremy Renner",
        "evaluation-candidate",
        "The spoken assessment calls Jeremy Renner underrated and praises the emotional performance.",
      ],
      [
        1568,
        "subtlety",
        "THOR STORY // FUNNY WITH WEIGHT",
        "Thor",
        "evaluation-candidate",
        "The review praises the subtle balance of comedy and meaning in Thor's story.",
      ],
      [
        1593,
        "party",
        "CRYING PARTY // BEER BREAK",
        "Endgame emotional reaction",
        "comedy-candidate",
        "A self-mocking crying riff turns the emotional discussion into a comedy candidate.",
      ],
      [
        1949,
        "starts to scream",
        "HAWKEYE BREAKS // THE SCREAM LANDS",
        "Hawkeye and Black Widow",
        "evaluation-candidate",
        "The captioned reaction focuses on Hawkeye's scream during the Black Widow aftermath.",
      ],
      [
        2154,
        "saw on the trailer",
        "TRAILER MEMORY // CAPTAIN AMERICA FEAR",
        "Captain America",
        "evaluation-candidate",
        "A remembered trailer scene is tied to expecting Captain America's death.",
      ],
      [
        2263,
        "whooping his ass",
        "MJOLNIR PAYOFF // CAP TAKES OVER",
        "Captain America and Mjolnir",
        "evaluation-candidate",
        "The excited spoken reaction celebrates Captain America's Mjolnir payoff.",
      ],
      [
        2533,
        "I was crying",
        "ENDGAME TEARS // UGLY CRY TERRITORY",
        "Endgame emotional finale",
        "evaluation-candidate",
        "The review openly records crying during the movie's late emotional payoff.",
      ],
      [
        2993,
        "better than I ever hoped",
        "FINAL VERDICT // BETTER THAN HOPED",
        "Endgame verdict",
        "evaluation-candidate",
        "The closing verdict says the movie exceeded what the review had hoped for.",
      ],
      [
        3257,
        "top five MCU",
        "MCU RANKING DOOR // TOP FIVE",
        "MCU movie ranking",
        "topic-door",
        "A super-chat prompt opens a direct top-five MCU movie discussion.",
      ],
    ]),
  },
  {
    id: "hZnTgxx7oUE",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "episode-recap",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 90,
    cuts: cutRows([
      [
        135,
        "good episode",
        "EPISODE VERDICT // GOOD START",
        "The Last of the Starks",
        "evaluation-candidate",
        "The recap opens with a concise positive assessment of the episode.",
      ],
      [
        210,
        "far from home",
        "TRAILER SIDEBAR // FAR FROM HOME",
        "Spider-Man: Far From Home trailer",
        "format-cue",
        "A brief programming note points viewers toward a separate trailer recap.",
      ],
      [
        385,
        "Batman speech",
        "SANSA SPEECH // BATMAN ENERGY",
        "Sansa Stark",
        "comedy-candidate",
        "A forceful Sansa moment is jokingly recast as a Batman speech.",
      ],
      [
        459,
        "tormund",
        "TORMUND WANTS IT // BRIENNE RIFF",
        "Tormund and Brienne",
        "comedy-candidate",
        "The Tormund and Brienne relationship discussion turns into an exaggerated spoken riff.",
      ],
      [
        831,
        "girlfriend cheating",
        "JON AND DANY // RELATIONSHIP ALARM",
        "Jon Snow and Daenerys",
        "evaluation-candidate",
        "The relationship conflict is criticized through a blunt cheating comparison.",
      ],
      [
        1285,
        "needle",
        "ARYA'S NEEDLE // EYEBALL THREAT",
        "Arya Stark",
        "comedy-candidate",
        "A Needle reference escalates into a graphic comic threat.",
      ],
      [
        1481,
        "King's",
        "KING'S LANDING THESIS // ALWAYS THE ENGINE",
        "King's Landing",
        "evaluation-candidate",
        "The recap argues that King's Landing has consistently supplied the most interesting material.",
      ],
      [
        1823,
        "middle of King's Landing",
        "BATTLE BOARD // KING'S LANDING COLLISION",
        "King's Landing battle prediction",
        "topic-door",
        "A possible multi-sided battle in King's Landing becomes a prediction topic.",
      ],
      [
        2191,
        "are depleted",
        "DANY'S RUSH // DEPLETED ARMY",
        "Daenerys strategy",
        "evaluation-candidate",
        "The spoken critique says depleted resources make Daenerys's rush a poor decision.",
      ],
      [
        2225,
        "one thing",
        "CERSEI'S CRACK // HER CHILDREN",
        "Cersei Lannister",
        "evaluation-candidate",
        "The recap identifies Cersei's attachment to her children as a vulnerability.",
      ],
      [
        2369,
        "prediction time",
        "PREDICTION MODE // FINAL EPISODES",
        "Game of Thrones predictions",
        "format-cue",
        "The caption track explicitly announces prediction time for the remaining episodes.",
      ],
      [
        2462,
        "wild",
        "MAURY IN WESTEROS // FRONT ROW",
        "Game of Thrones drama",
        "comedy-candidate",
        "The coming conflict is jokingly billed as an extreme Maury Povich episode.",
      ],
      [
        2489,
        "Game of Thrones",
        "SERIES ENGINE // DEEP DRAMA",
        "Game of Thrones final episodes",
        "evaluation-candidate",
        "The recap praises the deep drama and anticipates the final two episodes.",
      ],
      [
        2677,
        "White Walkers are dead",
        "WHITE WALKERS CLOSED // HUMAN WAR NOW",
        "White Walkers",
        "evaluation-candidate",
        "The closing assessment declares the White Walker story finished and shifts focus.",
      ],
      [
        2679,
        "missed in the chat",
        "CHAT SWEEP // RECAP CLOSES",
        "Livestream chat",
        "format-cue",
        "The show closes by checking for missed chat messages.",
      ],
    ]),
  },
  {
    id: "rtWl8c57SYk",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "episode-recap",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 90,
    cuts: cutRows([
      [
        232,
        "Welcome to Derry",
        "DERRY DOOR // EPISODE ONE",
        "IT: Welcome to Derry",
        "format-cue",
        "The conversation explicitly pivots into the Welcome to Derry episode recap.",
      ],
      [
        341,
        "best openings",
        "OPENING VERDICT // AMONG THE BEST",
        "Welcome to Derry opening",
        "evaluation-candidate",
        "The first sequence is called one of television's best openings.",
      ],
      [
        361,
        "technically",
        "BIRTH SCENE // TERRIFIER COMPARISON",
        "Welcome to Derry birth scene",
        "evaluation-candidate",
        "The grotesque birth is compared with Terrifier before practical and digital effects are weighed.",
      ],
      [
        611,
        "Hollerin",
        "SHINING CONNECTION // HALLORANN ENTERS",
        "Dick Hallorann",
        "topic-door",
        "The caption track recognizes Dick Hallorann and opens a Shining connection.",
      ],
      [
        840,
        "pop",
        "BABY RIFF // POP GOES DERRY",
        "Welcome to Derry creature birth",
        "comedy-candidate",
        "A short, profane reaction turns the creature-birth discussion into a comedy candidate.",
      ],
      [
        980,
        "thick",
        "THICK IN DERRY // RUNNING RIFF",
        "Welcome to Derry character discussion",
        "comedy-candidate",
        "A repeated thick-versus-fat exchange becomes a compact spoken riff.",
      ],
      [
        1049,
        "overall",
        "CAST LEDGER // ACTORS WERE FINE",
        "Welcome to Derry cast",
        "evaluation-candidate",
        "The review calls the dialogue uneven while finding the actors generally fine.",
      ],
      [
        1147,
        "lampshade",
        "LAMPSHADE SHOCK // EVIL DEAD ENERGY",
        "Welcome to Derry lampshade sequence",
        "evaluation-candidate",
        "The lampshade sequence is called wild and compared with Evil Dead.",
      ],
      [
        1336,
        "episode two",
        "NEXT EPISODE // EXCITEMENT HOLDS",
        "Welcome to Derry episode two",
        "evaluation-candidate",
        "The recap explicitly records excitement for the second episode.",
      ],
      [
        1358,
        "that dick",
        "HALLORANN RIFF // OLD DICK RETURNS",
        "Dick Hallorann",
        "comedy-candidate",
        "A Hallorann callback launches a deliberately crude spoken riff.",
      ],
      [
        1444,
        "trailer",
        "NEXT-WEEK TRAILER // THEORY DOOR",
        "Welcome to Derry next episode",
        "format-cue",
        "The next-episode trailer opens a new round of story theory.",
      ],
      [
        1680,
        "Friday the 13th",
        "CAST WIPEOUT // FRIDAY 2009 MODEL",
        "Welcome to Derry opening structure",
        "evaluation-candidate",
        "The surprise cast turnover is compared with Friday the 13th's 2009 opening.",
      ],
      [
        1805,
        "really",
        "FINAL VERDICT // REALLY GOOD",
        "Welcome to Derry episode verdict",
        "evaluation-candidate",
        "The recap closes its main review with a strongly positive verdict.",
      ],
      [
        1822,
        "super chat",
        "SUPER CHAT TURN // AUDIENCE QUESTIONS",
        "Livestream audience questions",
        "format-cue",
        "The program shifts from recap mode into the super-chat queue.",
      ],
      [
        1836,
        "Dr. Lumis",
        "LOOMIS QUESTION // THE DOCTOR DROPS IN",
        "Dr. Loomis running gag",
        "comedy-candidate",
        "A deliberately crude Dr. Loomis question becomes the closing comedy candidate.",
      ],
    ]),
  },
  {
    id: "VTy8U9-9qw8",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "episode-recap",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 90,
    cuts: cutRows([
      [
        162,
        "give it up",
        "JAMES GUNN LEDGER // CONNECTED SMART",
        "James Gunn's DC continuity",
        "evaluation-candidate",
        "The opening praises the subtle way James Gunn connects the DC stories.",
      ],
      [
        288,
        "season one",
        "THREE-YEAR RETURN // RIGHT BACK IN",
        "Peacemaker season one",
        "evaluation-candidate",
        "The recap says the return quickly restored the feel of season one.",
      ],
      [
        492,
        "Mr. Fog",
        "VAPE SIDEBAR // PRODUCTS SUCK",
        "Vaping products",
        "evaluation-candidate",
        "A product aside delivers a blunt negative verdict on disposable vapes.",
      ],
      [
        506,
        "back to Peacemaker",
        "RECAPPER RESET // BACK TO PEACEMAKER",
        "Peacemaker season two episode one",
        "format-cue",
        "The conversation explicitly returns to the Peacemaker episode after a sidebar.",
      ],
      [
        643,
        "skills",
        "ONE SPECIAL SKILL // CAR RIFF",
        "Peacemaker comedy",
        "comedy-candidate",
        "A quoted one-skill complaint triggers sustained laughter and a spoken comedy candidate.",
      ],
      [
        1136,
        "falls on his knees",
        "EARLOBE MOMENT // REACTION SPIRALS",
        "Peacemaker physical-comedy moment",
        "comedy-candidate",
        "The Peacemaker reaction launches an exaggerated earlobe-related riff.",
      ],
      [
        1255,
        "looking forward",
        "NEXT EPISODE // DARK HUMOR WINS",
        "Peacemaker episode two",
        "evaluation-candidate",
        "The recap favors Peacemaker's next episode for its dark humor and violence.",
      ],
      [
        1387,
        "kick ass",
        "FIGHT VERDICT // COULD KICK ASS",
        "Peacemaker character matchup",
        "evaluation-candidate",
        "A character's fighting ability receives a concise positive assessment.",
      ],
      [
        1692,
        "Halloween one",
        "HALLOWEEN CAR RIFF // BACKSEAT REWRITE",
        "Halloween car scene",
        "comedy-candidate",
        "A Halloween car-scene callback becomes an improvised spoken rewrite.",
      ],
      [
        1989,
        "Rowdy Piper",
        "PIPER APPRECIATION // THEY LIVE FOREVER",
        "Roddy Piper",
        "evaluation-candidate",
        "The discussion praises Roddy Piper through They Live and Hell Comes to Frogtown.",
      ],
      [
        2742,
        "Dunkin Donuts",
        "DUNKIN LEDGER // PAY AND PRODUCT",
        "Dunkin' Donuts",
        "evaluation-candidate",
        "A workplace tangent weighs Dunkin' Donuts pay and product quality.",
      ],
      [
        3415,
        "video game",
        "HALLOWEEN GAME // AUDIENCE DOOR",
        "Halloween video game",
        "topic-door",
        "An audience question opens discussion of the new Halloween video game.",
      ],
      [
        3639,
        "nightmare on Elm Street",
        "NIGHTMARE RETURN // FRANCHISE QUESTION",
        "A Nightmare on Elm Street",
        "topic-door",
        "A direct question asks whether A Nightmare on Elm Street needs to return.",
      ],
      [
        3664,
        "need to reboot",
        "NIGHTMARE VERDICT // REBOOT IT ALL",
        "A Nightmare on Elm Street reboot",
        "evaluation-candidate",
        "The response argues for a complete reboot with new creative leadership.",
      ],
      [
        4383,
        "Cracker Barrel",
        "CRACKER BARREL SIGN // LATE-SHOW RIFF",
        "Cracker Barrel",
        "comedy-candidate",
        "A Cracker Barrel comparison becomes a late-show visual-language joke without a visual claim.",
      ],
    ]),
  },
  {
    id: "_QLSlETb9E0",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "guest-interview",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 86,
    cuts: cutRows([
      [
        66,
        "mute me",
        "SKYPE CHECK // DOUBLE AUDIO",
        "Livestream audio setup",
        "format-cue",
        "The opening troubleshoots a possible doubled Skype audio feed.",
      ],
      [
        280,
        "take all the credit",
        "CREATOR PARTNERSHIP // WORK SPLIT",
        "The Merkins creative process",
        "topic-door",
        "The guest discussion explains how mixing, singing, and production work are divided.",
      ],
      [
        465,
        "alien",
        "ALIEN AUDIO // THE CALL MUTATES",
        "Livestream audio problems",
        "comedy-candidate",
        "A distorted-call diagnosis becomes a compact alien-voice joke.",
      ],
      [
        622,
        "first thing",
        "BREAKOUT QUESTION // FIRST BIG HIT",
        "The Merkins breakout video",
        "format-cue",
        "An interview question asks which early parody first broke through.",
      ],
      [
        640,
        "Freddy Krueger",
        "EARLY MERKINS // FREDDY BREAKOUT",
        "Freddy Krueger parody videos",
        "topic-door",
        "The answer traces early growth through Freddy Krueger parody videos.",
      ],
      [
        696,
        "plays Freddy",
        "FREDDY ROLES // PART TWO",
        "Freddy performer roles",
        "topic-door",
        "A follow-up question opens discussion of the different Freddy roles.",
      ],
      [
        946,
        "Michael Loomis",
        "CREATIVE RANGE // BEYOND MICHAEL AND LOOMIS",
        "Michael Myers and Dr. Loomis parodies",
        "evaluation-candidate",
        "The guest discussion appreciates Michael and Loomis material while defending broader creative interests.",
      ],
      [
        1048,
        "Real quick",
        "CHAT TURN // VIEWER QUESTION",
        "Livestream chat",
        "format-cue",
        "The interview pauses for a quick move into the live chat.",
      ],
      [
        1403,
        "fight",
        "LOOMIS FIGHT // INTERVIEW GOES OFF ROAD",
        "Dr. Loomis running gag",
        "comedy-candidate",
        "A combative Loomis-style line interrupts the interview with a comedy candidate.",
      ],
      [
        1480,
        "descriptive",
        "STEPHEN KING LEDGER // DEEP AND DARK",
        "Stephen King",
        "evaluation-candidate",
        "The spoken assessment describes Stephen King's work as deep, dark, and highly descriptive.",
      ],
      [
        2222,
        "shit happens",
        "LIVE SHOW LAW // THINGS BREAK",
        "Livestream technical failure",
        "comedy-candidate",
        "A blunt live-show maxim turns the technical interruption into a joke.",
      ],
      [
        2653,
        "Godzilla rap",
        "GODZILLA VERSE // SPEED LIMIT",
        "Eminem's Godzilla",
        "comedy-candidate",
        "The discussion jokes about the near-impossible speed of the Godzilla rap verse.",
      ],
      [
        2694,
        "nostalgia porn",
        "NOSTALGIA FORMULA // EIGHTIES SONGS",
        "Horror parody nostalgia",
        "evaluation-candidate",
        "A blunt thesis explains why eighties music and horror characters attract audiences.",
      ],
      [
        3214,
        "Leatherface shoot",
        "LEATHERFACE SET // LIGHT AND MEAT",
        "Leatherface parody production",
        "topic-door",
        "The production discussion opens a Leatherface shoot and its practical setup.",
      ],
      [
        4037,
        "Oh shit",
        "TECH FAILURE // APOLOGY TO THE GUEST",
        "Livestream technical failure",
        "format-cue",
        "A severe late technical failure forces an on-air apology and recovery attempt.",
      ],
    ]),
  },
  {
    id: "2m0BgJzEPCk",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "spoiler-review",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 86,
    cuts: cutRows([
      [
        137,
        "breath of fresh air",
        "OPENING VERDICT // FRESH AIR",
        "Child's Play review",
        "evaluation-candidate",
        "The spoiler review opens by calling the movie a breath of fresh air.",
      ],
      [
        499,
        "guy stares",
        "CHUCKY CHANGES // LOSSES AND GAINS",
        "Child's Play remake changes",
        "evaluation-candidate",
        "The review weighs missing legacy elements against the remake's new origin.",
      ],
      [
        742,
        "department store",
        "AUBREY PLAZA // DARKER THAN GENERIC",
        "Aubrey Plaza",
        "evaluation-candidate",
        "The review credits Aubrey Plaza with making the parent role less generic.",
      ],
      [
        1107,
        "laugh my ass off",
        "ARE WE HAVING FUN // THE LINE LANDS",
        "Child's Play comedy",
        "comedy-candidate",
        "A quoted line receives an immediate and emphatic laugh verdict.",
      ],
      [
        1245,
        "Texas Chainsaw",
        "TEXAS CHAINSAW // HORROR EDUCATION",
        "The Texas Chain Saw Massacre",
        "topic-door",
        "The review enters a sequence involving children watching The Texas Chain Saw Massacre.",
      ],
      [
        1313,
        "watch horror movies",
        "KIDS AND HORROR // WHY THE LAUGHS WORK",
        "Young horror audiences",
        "evaluation-candidate",
        "The discussion argues that young teens plausibly laugh while watching horror movies.",
      ],
      [
        1558,
        "casting",
        "DETECTIVE CASTING // PERIOD FEEL",
        "Child's Play detective casting",
        "evaluation-candidate",
        "The casting is praised for evoking a recognizable earlier-era character type.",
      ],
      [
        1592,
        "talks to Andy",
        "MR. PECK // INSTANT DISLIKE",
        "Mr. Peck",
        "evaluation-candidate",
        "The character's interactions with Andy are cited as an immediate reason for dislike.",
      ],
      [
        2327,
        "og Chucky",
        "CHUCKY VERSUS CHUCKY // ORIGINAL WINS",
        "Original and remake Chucky",
        "evaluation-candidate",
        "The spoken matchup chooses the original Chucky over the remake version.",
      ],
      [
        2517,
        "remotely",
        "THIRD-ACT PACE // MOVIE SPRINTS",
        "Child's Play pacing",
        "evaluation-candidate",
        "The review says the movie accelerates sharply as the remote-control material arrives.",
      ],
      [
        2913,
        "filming schedule",
        "PRODUCTION THEORY // TWO-THIRDS QUESTION",
        "Child's Play production",
        "topic-door",
        "A filming-schedule question opens a theory about how the movie was assembled.",
      ],
      [
        3183,
        "Bruce Banner",
        "BRUCE BANNER FEELING // HULK RIFF",
        "Audience question",
        "comedy-candidate",
        "A physical sensation is compared with Bruce Banner turning into the Hulk.",
      ],
      [
        3286,
        "gets a sequel",
        "SEQUEL BOARD // LEARN OR NOSEDIVE",
        "Child's Play sequel",
        "topic-door",
        "A viewer question asks whether a sequel would improve or nosedive.",
      ],
      [
        3374,
        "Michael Myers",
        "PARODY QUESTION // MICHAEL AND LOOMIS",
        "Michael Myers and Dr. Loomis parody",
        "topic-door",
        "A viewer prompt asks about a Child's Play-era Michael and Loomis parody.",
      ],
      [
        3947,
        "thought was gonna suck",
        "FINAL TURNAROUND // EXPECTATIONS BEATEN",
        "Child's Play verdict",
        "evaluation-candidate",
        "The closing admission says negative expectations gave way to enjoyment.",
      ],
    ]),
  },
  {
    id: "MrBpbfwDlAQ",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "news-panel",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 86,
    cuts: cutRows([
      [
        131,
        "authentic",
        "BASEMENT AUTHENTICITY // FAN DOME OPENS",
        "DC FanDome livestream",
        "comedy-candidate",
        "The home-broadcast setup is jokingly sold as maximum basement authenticity.",
      ],
      [
        343,
        "did not watch",
        "UNSEEN TRAILER // WATCH TOGETHER",
        "The Batman trailer",
        "format-cue",
        "The livestream promises a shared first viewing of the unviewed Batman trailer.",
      ],
      [
        740,
        "ryan reynolds",
        "GREEN LANTERN LETDOWN // NO REYNOLDS",
        "Ryan Reynolds and Green Lantern",
        "evaluation-candidate",
        "The panel discussion records disappointment over no Ryan Reynolds announcement.",
      ],
      [
        873,
        "superman",
        "SUPERMAN CLOCK // TRAIN MAY PASS",
        "Superman casting",
        "topic-door",
        "A Superman return becomes the subject of a near-term prediction.",
      ],
      [
        1091,
        "green lantern",
        "GREEN LANTERN SHOW // HBO MAX PITCH",
        "Green Lantern series",
        "topic-door",
        "The discussion opens a preferred Green Lantern series and casting question.",
      ],
      [
        1136,
        "doesn't even move",
        "MUSTACHE FREEZE // PANEL IMPRESSION",
        "DC FanDome panel presentation",
        "comedy-candidate",
        "A motionless-mustache observation becomes a quick panel-impression joke.",
      ],
      [
        1257,
        "suicide squad cast",
        "SUICIDE SQUAD CAST // PATIENCE BREAKS",
        "The Suicide Squad cast",
        "comedy-candidate",
        "The cast presentation triggers an impatient, exaggerated spoken reaction.",
      ],
      [
        1480,
        "batman",
        "BATMAN TRAILER // FINALLY",
        "The Batman trailer",
        "format-cue",
        "The livestream explicitly demands the Batman trailer after the long wait.",
      ],
      [
        1554,
        "velcro",
        "VELCRO RIFF // TRAILER REACTION",
        "The Batman trailer reaction",
        "comedy-candidate",
        "A one-word Velcro reaction grows into a comic trailer aside.",
      ],
      [
        1605,
        "evil dead",
        "EVIL DEAD COMPARISON // HORROR LANGUAGE",
        "The Batman trailer tone",
        "comedy-candidate",
        "The live reaction invokes Evil Dead during the trailer discussion.",
      ],
      [
        1615,
        "feel like",
        "SLIPKNOT OPENING // TRAILER GETS WEIRD",
        "The Batman trailer tone",
        "comedy-candidate",
        "The trailer's tone is jokingly compared with a Slipknot opening video.",
      ],
      [
        1704,
        "horror movie",
        "TRAILER VERDICT // HORROR MEETS ACTION",
        "The Batman trailer verdict",
        "evaluation-candidate",
        "The immediate verdict describes a hybrid of horror and action.",
      ],
      [
        1775,
        "beginning phase",
        "BATMAN DNA // GASLIGHT MEETS THE CROW",
        "The Batman influences",
        "evaluation-candidate",
        "The spoken comparison connects early Batman, Gotham by Gaslight, and The Crow.",
      ],
      [
        1939,
        "great",
        "FIGHT PAYOFF // GREAT JOB",
        "The Batman trailer fight",
        "evaluation-candidate",
        "An emphatic reaction praises the trailer's violent confrontation.",
      ],
      [
        1982,
        "marvel",
        "DC THESIS // DO NOT COPY MARVEL",
        "DC film strategy",
        "evaluation-candidate",
        "The post-trailer thesis argues that DC need not imitate Marvel's approach.",
      ],
    ]),
  },
  {
    id: "-k3YduzBoGs",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "review-and-qa",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 83,
    cuts: cutRows([
      [
        231,
        "review",
        "SHOW MAP // REVIEW THEN Q&A",
        "Halloween 2018 review and Q&A",
        "format-cue",
        "The opening explicitly maps a review followed by audience questions.",
      ],
      [
        1015,
        "cracking up",
        "MICHAEL NUANCES // SERIOUS SCENE LAUGHS",
        "Michael Myers mannerisms",
        "comedy-candidate",
        "The review admits that familiar Michael nuances caused laughter during serious scenes.",
      ],
      [
        1086,
        "ranking",
        "HALLOWEEN RANKING // TOP-TIER ENTRY",
        "Halloween franchise ranking",
        "evaluation-candidate",
        "The movie is projected to rank among the stronger Halloween entries.",
      ],
      [
        1345,
        "good horror movie",
        "HORROR RELIEF // SOMETHING TO BACK",
        "Halloween 2018 verdict",
        "evaluation-candidate",
        "The reaction celebrates finally having a good horror movie to support.",
      ],
      [
        1677,
        "Gores",
        "SPAGHETTIOS GORE // VALUE BRAND RIFF",
        "Halloween 2018 gore",
        "comedy-candidate",
        "The gore discussion abruptly swerves into a surreal SpaghettiOs comparison.",
      ],
      [
        1993,
        "Joker",
        "JOAQUIN JOKER // WILD CASTING WORKS",
        "Joaquin Phoenix as Joker",
        "evaluation-candidate",
        "The Q&A argues that an unconventional Joaquin Phoenix casting can work.",
      ],
      [
        2159,
        "Stephen King",
        "STEPHEN KING WEEK // AUDIENCE DOOR",
        "Stephen King week",
        "topic-door",
        "An audience question opens discussion of another Stephen King week.",
      ],
      [
        2707,
        "remake",
        "PET SEMATARY // REMAKE CAN WORK",
        "Pet Sematary remake",
        "evaluation-candidate",
        "The response argues that Pet Sematary could benefit from a remake.",
      ],
      [
        3267,
        "Loomis",
        "LOOMIS REQUEST // COMPLIMENT LAURA",
        "Dr. Loomis running gag",
        "topic-door",
        "A viewer request explicitly calls for a Loomis-style compliment.",
      ],
      [
        3540,
        "respect",
        "MICHAEL RESPONSIBILITY // KEEP THE HORROR",
        "Michael Myers",
        "evaluation-candidate",
        "The discussion stresses preserving both respect for Michael Myers and genuine horror.",
      ],
      [
        3624,
        "Nightmare on Elm Street",
        "NIGHTMARE WRITERS' ROOM // MCBRIDE QUESTION",
        "A Nightmare on Elm Street",
        "topic-door",
        "A new Nightmare on Elm Street script becomes an audience discussion topic.",
      ],
      [
        3850,
        "Michael Myers",
        "DANIELLE HARRIS // OLDER JAMIE PITCH",
        "Danielle Harris and Jamie Lloyd",
        "evaluation-candidate",
        "The response favors a Danielle Harris continuation centered on an older Jamie.",
      ],
      [
        4098,
        "we love",
        "SEQUEL DEFENSE // LOVE THE WEIRD ONES",
        "Horror sequels",
        "evaluation-candidate",
        "The Q&A defends affection for neglected and disreputable horror sequels.",
      ],
      [
        4518,
        "atmosphere",
        "CURSE ATMOSPHERE // SMOKE AND BLUE",
        "Halloween: The Curse of Michael Myers",
        "evaluation-candidate",
        "The movie's smoky, dark-blue atmosphere receives explicit praise.",
      ],
      [
        4661,
        "Super chat",
        "HYPER MODE // RAPID-FIRE Q&A",
        "Audience Q&A",
        "format-cue",
        "The show announces a final super chat and rapid-fire question mode.",
      ],
    ]),
  },
  {
    id: "NU-qb0l8pf0",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "movie-news",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 83,
    cuts: cutRows([
      [
        182,
        "Gilmore",
        "HAPPY GILMORE // PG MEMORY",
        "Happy Gilmore",
        "evaluation-candidate",
        "The discussion recalls Happy Gilmore as comparatively mild despite its comedy edge.",
      ],
      [
        305,
        "sequel",
        "LEGACY SEQUELS // BAD TRACK RECORD",
        "Comedy legacy sequels",
        "evaluation-candidate",
        "Several comedy sequels are cited as evidence for low expectations.",
      ],
      [
        646,
        "Predator 2",
        "PREDATOR 2 // UNDERRATED DEFENSE",
        "Predator 2",
        "evaluation-candidate",
        "A direct spoken verdict defends Predator 2 as underrated.",
      ],
      [
        672,
        "hate",
        "LOGAN PAUL HEAT // HARD NO",
        "Logan Paul",
        "evaluation-candidate",
        "The conversation delivers an emphatic negative verdict on Logan Paul.",
      ],
      [
        1203,
        "director",
        "STAR WARS BOARD // DIRECTOR MATTERS",
        "Shawn Levy and Star Wars",
        "evaluation-candidate",
        "A possible Star Wars movie is weighed against confidence in its director.",
      ],
      [
        1453,
        "4:00 a.m.",
        "DIRK DIGGLER DETOUR // WORKOUT ADVICE",
        "Workout routine riff",
        "comedy-candidate",
        "A workout claim swerves into an intentionally graphic Dirk Diggler riff.",
      ],
      [
        1480,
        "Dr chalice",
        "LOOMIS AND CHALLIS // TREE CREW",
        "Dr. Loomis and Dr. Challis running gag",
        "topic-door",
        "A viewer prompt requests Loomis and Challis help with frozen trees.",
      ],
      [
        1816,
        "one thing",
        "QUIET KILLER // RIPPER ADVICE",
        "Jack the Ripper",
        "comedy-candidate",
        "A killer discussion becomes absurd advice to commit crimes more quietly.",
      ],
      [
        2140,
        "Ghostbusters",
        "FRANCHISE CHOICE // GHOSTBUSTERS OR FUTURE",
        "Ghostbusters and Back to the Future",
        "topic-door",
        "A direct either-or question compares two beloved film series.",
      ],
      [
        2543,
        "Christopher Landon",
        "LANDON WIRE // SCREAM 7 HISTORY",
        "Christopher Landon",
        "topic-door",
        "A new Christopher Landon movie opens discussion of his Scream 7 history.",
      ],
      [
        2921,
        "isn't really",
        "BLUMHOUSE LEDGER // NOT HITTING",
        "Blumhouse",
        "evaluation-candidate",
        "A blunt assessment says Blumhouse has not been delivering recent home runs.",
      ],
      [
        3521,
        "Marvel",
        "DOCTOR STRANGE // STUDIO INTERFERENCE",
        "Sam Raimi and Doctor Strange",
        "evaluation-candidate",
        "The discussion argues that Marvel constrained a full Sam Raimi Doctor Strange movie.",
      ],
      [
        4266,
        "Halloween 3",
        "HALLOWEEN DEBATE // MICHAEL ONLY",
        "Halloween III and Michael Myers",
        "topic-door",
        "A meme opens the recurring debate over whether Halloween requires Michael Myers.",
      ],
      [
        4941,
        "one thing",
        "PSYCHO REMAKE // GOOD ACTOR, BAD IDEA",
        "Psycho remake",
        "evaluation-candidate",
        "The verdict praises Vince Vaughn while rejecting the shot-for-shot remake.",
      ],
      [
        5135,
        "trash's Revenge",
        "LIVING DEAD WIRE // TRASH'S REVENGE",
        "Return of the Living Dead",
        "topic-door",
        "The news feed introduces Trash's Revenge and its Living Dead connection.",
      ],
    ]),
  },
  {
    id: "xVUR68diEHQ",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "question-and-answer",
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 83,
    cuts: cutRows([
      [
        185,
        "junior year",
        "COMMUNITY IMPACT // SCHOOL STORY",
        "Audience community",
        "evaluation-candidate",
        "A viewer's school success is celebrated as meaningful community impact.",
      ],
      [
        381,
        "first super chat",
        "SUPER CHAT ONE // Q&A OPENS",
        "Audience Q&A",
        "format-cue",
        "The celebration explicitly marks its first super-chat question.",
      ],
      [
        845,
        "superhero",
        "QUESTION FILTER // SKIP THE GENERIC",
        "Audience question selection",
        "format-cue",
        "The show rejects generic favorite-superhero prompts in favor of stranger questions.",
      ],
      [
        1036,
        "YouTube",
        "CREATOR ADVICE // START SOMEWHERE",
        "Starting a creative channel",
        "evaluation-candidate",
        "The audience advice says creative work need not begin on YouTube.",
      ],
      [
        1500,
        "sweet",
        "SCHOOL HANGOVER // SILK SHIRT MEMORY",
        "School memory",
        "comedy-candidate",
        "A school-night memory escalates through sweet wine and a silk-shirt description.",
      ],
      [
        1707,
        "Rob Zombie",
        "HALLOWEEN REMAKE // SEQUEL HEAT",
        "Rob Zombie's Halloween films",
        "evaluation-candidate",
        "The Halloween franchise survey sharply separates the remake from its sequel.",
      ],
      [
        1862,
        "Halloween",
        "HALLOWEEN FUTURE // WHAT COMES NEXT",
        "Future Halloween films",
        "topic-door",
        "An audience prompt asks where the next Halloween films should go.",
      ],
      [
        2145,
        "under wraps",
        "FREE MICHAEL // LEAVE LAURIE BEHIND",
        "Michael Myers and Laurie Strode",
        "evaluation-candidate",
        "The proposed direction frees Michael Myers from the Laurie Strode storyline.",
      ],
      [
        2219,
        "Nolan",
        "BLUMHOUSE TRILOGY // BEST OUTCOME",
        "Halloween sequel trilogy",
        "evaluation-candidate",
        "The best-case pitch compares a self-contained Halloween trilogy with Nolan's Batman series.",
      ],
      [
        2941,
        "Derek Mears",
        "MICHAEL VERSUS JASON // FAN MATCHUP",
        "Michael Myers versus Jason Voorhees",
        "topic-door",
        "A fantasy matchup pairs Tyler Mane's Michael with Derek Mears's Jason.",
      ],
      [
        3214,
        "ash whooping",
        "ASH VERSUS ICONS // SCARE THEM AGAIN",
        "Ash, Jason, and Freddy",
        "evaluation-candidate",
        "The crossover discussion asks how Jason and Freddy could become frightening again.",
      ],
      [
        4163,
        "smells like ass",
        "BOLOGNA CLOUD // STREAM CLEARS OUT",
        "Livestream mishap",
        "comedy-candidate",
        "A smell complaint becomes a detergent joke and a mock audience exodus.",
      ],
      [
        4453,
        "trailer reactions",
        "TRAILER REACTION BOARD // THREE FILMED",
        "Upcoming trailer reactions",
        "format-cue",
        "The livestream announces that three separate trailer reactions were filmed.",
      ],
      [
        5089,
        "scream okay",
        "SCREAM REBOOT // BLUMHOUSE QUESTION",
        "Scream reboot",
        "topic-door",
        "The Q&A opens a hypothetical Blumhouse reboot of Scream.",
      ],
      [
        6244,
        "mean that much",
        "COMMUNITY FINALE // HARD TIMES TOGETHER",
        "Audience community",
        "evaluation-candidate",
        "The closing reflection describes mutual support through the worst parts of life.",
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
      id: `topic-rebuild-b3-${config.id}-${String(index + 1).padStart(2, "0")}-${anchor.at}`,
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
    variant: "topic-rebuild-batch3-unreviewed",
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

export function buildTopicRebuildBatch3({ rootDir = PROJECT_ROOT } = {}) {
  const guides = TOPIC_REBUILD_BATCH3_CONFIGS.map((config) => {
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
    schema: "wwam-episode-guide-v2-topic-rebuild-batch3/v1",
    generated: GENERATED,
    selection: {
      ids: TOPIC_REBUILD_BATCH3_CONFIGS.map((config) => config.id),
      count: TOPIC_REBUILD_BATCH3_CONFIGS.length,
      reason:
        "Ten additional high-priority generic-label advisories outside Batches 1 and 2, selected for review, recap, news, guest, panel, and Q&A variety.",
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
        "scripts/generate-episode-guide-v2-topic-rebuild-batch3.mjs",
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

export function renderTopicRebuildBatch3(payload) {
  return `window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH3 = ${JSON.stringify(payload)};\n`;
}

function main() {
  const payload = buildTopicRebuildBatch3();
  fs.writeFileSync(OUTPUT_PATH, renderTopicRebuildBatch3(payload));
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)} with ${payload.meta.guides} guides and ${payload.meta.cuts} cuts.\n`,
  );
}

if (path.resolve(process.argv[1] || "") === path.resolve(SCRIPT_PATH)) {
  main();
}
