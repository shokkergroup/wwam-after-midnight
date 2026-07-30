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
  "episode-guide-v2-topic-rebuild-batch5.js",
);
const GENERATED = "2026-07-30";
const PUBLIC_EXCERPT_WORD_LIMIT = 16;
const CUT_LENGTH_SECONDS = 24;
const BOUNDARY_MODE = "standard-caption-candidates";

function summaryFor(classification, detail) {
  if (classification === "evaluation-candidate") {
    return `This stop captures ${detail}.`;
  }
  if (classification === "comedy-candidate") {
    return `This stop catches ${detail}.`;
  }
  if (classification === "format-cue") {
    return `The show shifts into ${detail} here.`;
  }
  return `Jump here for ${detail}.`;
}

function cutRows(rows) {
  return rows.map(
    ([at, needle, label, topic, classification, detail]) => ({
      at,
      needle,
      label,
      topic,
      classification,
      summary: summaryFor(classification, detail),
    }),
  );
}

function config(id, artifact, global, format, rows) {
  return {
    id,
    artifact,
    global,
    format,
    boundaryMode: BOUNDARY_MODE,
    advisoryScore: 83,
    cuts: cutRows(rows),
  };
}

export const TOPIC_REBUILD_BATCH5_CONFIGS = Object.freeze([
  config(
    "Bndzpde-ZZQ",
    "public/demo/year-canon-2025-2026.js",
    "WWAM_YEAR_CANON_2025_2026",
    "breaking-news-and-qa",
    [
      [
        288,
        "happened was Jay and I",
        "ALIEN COMMENTARY EXIT // BREAKING NEWS START",
        "Alien: Romulus commentary",
        "format-cue",
        "the jump from an Alien: Romulus commentary into the live news",
      ],
      [
        422,
        "twins uh so that's that's",
        "STU SURVIVAL DOOR // THE PREMISE",
        "Stu Macher",
        "topic-door",
        "the opening Stu Macher survival premise",
      ],
      [
        844,
        "this being such a popular",
        "STU THEORY // NOT A THROWAWAY",
        "Stu Macher return theory",
        "evaluation-candidate",
        "the hope that a Stu return would be more than a cameo",
      ],
      [
        1244,
        "I feel like Kevin Garnett",
        "HALLOWEEN TRACK RECORD // PREDICTION RIFF",
        "Halloween predictions",
        "comedy-candidate",
        "a joking comparison between earlier Halloween predictions and Stu",
      ],
      [
        1603,
        "be there like all these",
        "SCREAM SEVEN BOYCOTT // THE PUSHBACK",
        "Scream 7 audience reaction",
        "evaluation-candidate",
        "the proposed Scream 7 boycott",
      ],
      [
        2227,
        "hate the [BLEEP] out of",
        "DEWEY DECISION // WORST MOVE",
        "Dewey Riley",
        "evaluation-candidate",
        "the decision to kill Dewey",
      ],
      [
        2404,
        "have to explain that right",
        "SCREAM PITCH BOARD // WRITING THE RETURN",
        "Scream return pitch",
        "topic-door",
        "the writing challenge behind a Stu return pitch",
      ],
      [
        2951,
        "and scream two and scream",
        "CASTING FALLOUT // FRANCHISE ARGUMENT",
        "Scream casting controversy",
        "evaluation-candidate",
        "the casting controversy and calls to abandon the franchise",
      ],
      [
        3112,
        "makes it even more sense",
        "HOSPITAL KILL THEORY // CREDIT DISPUTE",
        "Scream hospital theory",
        "topic-door",
        "a theory about who committed the hospital kill",
      ],
      [
        3467,
        "silly but dwey was a",
        "CHAD AND KIRBY // FBI RIFF",
        "Chad and Kirby",
        "comedy-candidate",
        "the idea of Chad joining Kirby in the FBI",
      ],
      [
        3840,
        "and hope scream seven is",
        "SCREAM SEVEN HOPE // COMMUNITY TURN",
        "Scream 7",
        "evaluation-candidate",
        "optimism for Scream 7 during an audience exchange",
      ],
      [
        4279,
        "that's [BLEEP] genius dude that",
        "NOSTALGIA AND META // FULL APPROVAL",
        "Scream legacy pitch",
        "evaluation-candidate",
        "a nostalgia-heavy meta pitch for the Scream story",
      ],
      [
        4607,
        "secret entrance into the",
        "PARKER POSEY // GHOSTFACE REVEAL PITCH",
        "Parker Posey",
        "evaluation-candidate",
        "Parker Posey as a possible Ghostface reveal",
      ],
      [
        5311,
        "by the way do not",
        "SECOND TRAILER WARNING // DO NOT WATCH",
        "Companion trailer",
        "evaluation-candidate",
        "the warning to skip a second trailer for Companion",
      ],
      [
        5697,
        "holes which would you guys",
        "STU LIVES POLL // THE AUDIENCE CLOSE",
        "Stu Macher audience poll",
        "format-cue",
        "the closing audience poll on the Stu-lives theory",
      ],
    ],
  ),
  config(
    "DDY3dPaghWg",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "double-review-and-qa",
    [
      [
        108,
        "great Paul uh did you",
        "LIVE ROOM OPENS // MICHAEL RIFF",
        "Livestream audience",
        "format-cue",
        "the early audience roll call and Michael Myers riff",
      ],
      [
        482,
        "sitting in those theaters that",
        "THEATER ETIQUETTE // TICKET ANGER",
        "Movie theaters",
        "evaluation-candidate",
        "disruptive audience behavior after paying for an IMAX ticket",
      ],
      [
        836,
        "minutes too [BLEEP] long but",
        "GODZILLA VERDICT // MONSTER ACTION WINS",
        "Godzilla: King of the Monsters",
        "evaluation-candidate",
        "the length and monster-action payoff of Godzilla",
      ],
      [
        1384,
        "hang out and talk about",
        "CHANNEL MISSION // FRIENDS TALK MOVIES",
        "WWAM community",
        "format-cue",
        "the stated purpose of hanging out and talking movies as friends",
      ],
      [
        1799,
        "in it the only reason",
        "MA RATING RIFF // HALF A WIENER",
        "Ma",
        "comedy-candidate",
        "the R-rating discussion and its deliberately crude anatomy riff",
      ],
      [
        2107,
        "like um it's like the",
        "STUDIO EXECUTIVE // WAYNE'S WORLD TEST",
        "Ma production",
        "comedy-candidate",
        "a Wayne's World comparison used to criticize the production",
      ],
      [
        2842,
        "throw that out there yes",
        "MORTAL KOMBAT DOOR // SHANG TSUNG DLC",
        "Mortal Kombat",
        "topic-door",
        "the newly released Shang Tsung downloadable content",
      ],
      [
        3134,
        "Manson debut album so we",
        "SPOILER QUESTION // END-CREDIT CHECK",
        "Godzilla end-credit question",
        "format-cue",
        "an audience spoiler question about an end-credit sequence",
      ],
      [
        3310,
        "food fighting or something more",
        "GODZILLA VIEWPOINT // KNOWING THE CHARACTERS",
        "Godzilla characters",
        "evaluation-candidate",
        "how prior familiarity with Godzilla characters changes the review",
      ],
      [
        3908,
        "more impactful than a lot",
        "MA CHARACTER CHOICE // WILLPOWER READ",
        "Ma character discussion",
        "evaluation-candidate",
        "a proposed more forceful character response in Ma",
      ],
      [
        4380,
        "but i would still think",
        "SEVENTIES GODZILLA // PERIOD PRODUCT",
        "1970s Godzilla",
        "evaluation-candidate",
        "whether a 1970s-style Godzilla approach would work today",
      ],
      [
        4938,
        "what if that like the",
        "MA TRAILER PROBLEM // TOO MUCH GIVEN AWAY",
        "Ma trailer",
        "evaluation-candidate",
        "the amount of Ma material revealed by its trailer",
      ],
      [
        4971,
        "liked this one guy bin",
        "MA CLOSET STORY // BILL GATES DETOUR",
        "Ma story discussion",
        "comedy-candidate",
        "a deliberately crude retelling of a Ma relationship beat",
      ],
      [
        5423,
        "is what it is some",
        "MA AND MISERY // COMPARISON LINE",
        "Ma and Misery",
        "evaluation-candidate",
        "the comparison between Ma and Misery",
      ],
      [
        5806,
        "[BLEEP]",
        "FEAR Q&A // CONTORTIONISTS AND CLOWNS",
        "Audience fears",
        "topic-door",
        "a late audience discussion of contortionists, clowns, and spiders",
      ],
    ],
  ),
  config(
    "FTRWH0lgxa4",
    "public/demo/year-canon-2025-2026.js",
    "WWAM_YEAR_CANON_2025_2026",
    "episode-recap-and-qa",
    [
      [
        50,
        "awesome episode. I love getting",
        "EPISODE SIX VERDICT // AWESOME START",
        "Welcome to Derry episode 6",
        "evaluation-candidate",
        "the opening verdict on episode six",
      ],
      [
        148,
        "people and and hear them",
        "HALLORANN LINK // THE SHINING",
        "Dick Hallorann",
        "topic-door",
        "the connection between Hallorann's ability and The Shining",
      ],
      [
        286,
        "Pennywise this episode, but it",
        "PENNYWISE ARRIVAL // THREE NINJAS RIFF",
        "Pennywise",
        "comedy-candidate",
        "a Three Ninjas comparison attached to Pennywise's arrival",
      ],
      [
        426,
        "you a hug?\" Like, I",
        "MRS. KERS // ASYLUM IDEA WEIGHED",
        "Mrs. Kers",
        "evaluation-candidate",
        "the asylum backstory and the surrounding character choices",
      ],
      [
        625,
        "I'm [laughter] like, that's what",
        "CONSOLATION TURN // METAPHOR GOES OFF ROAD",
        "Episode reaction",
        "comedy-candidate",
        "a consoling exchange that turns into a crude metaphor",
      ],
      [
        697,
        "[laughter] nice. I'm glad you",
        "SILVER CHAIR // PUT IT BACK",
        "Audience exchange",
        "comedy-candidate",
        "the silver-chair audience exchange",
      ],
      [
        818,
        "Maybe watch episode one",
        "SEASON CHECKPOINT // BEST EPISODES SO FAR",
        "Welcome to Derry season ranking",
        "format-cue",
        "the recap's checkpoint ranking of episodes aired so far",
      ],
      [
        925,
        "Blue Beam. I think that's 100% actually",
        "PROJECT BLUE BEAM // CONSPIRACY DOOR",
        "Project Blue Beam",
        "topic-door",
        "the Project Blue Beam conspiracy discussion",
      ],
      [
        1081,
        "Knew it too. Just sound",
        "DUMPLING PIE // THE ROOM BREAKS",
        "Audience food riff",
        "comedy-candidate",
        "the improvised dumpling-pie exchange",
      ],
      [
        1181,
        "factor I think five four maybe depending",
        "ENTERPRISE PICK // WARP FACTOR BOARD",
        "Star Trek",
        "topic-door",
        "an audience choice involving the Enterprise and warp speed",
      ],
      [
        1301,
        "[BLEEP] up here, Byron. Alfred",
        "DIRECTOR DEBATE // HITCHCOCK OR RAIMI",
        "Alfred Hitchcock and Sam Raimi",
        "evaluation-candidate",
        "the Alfred Hitchcock versus Sam Raimi director choice",
      ],
      [
        1539,
        "Katie was like, \"No, no,",
        "GROCERY AISLE STORY // FACE MIX-UP",
        "Personal story",
        "comedy-candidate",
        "a grocery-aisle misunderstanding",
      ],
      [
        1664,
        "usually watch.",
        "STRANGER THINGS // VOLUME ONE CHECK",
        "Stranger Things season 5",
        "topic-door",
        "an audience question about Stranger Things season five",
      ],
      [
        1831,
        "of David Croninberg type of",
        "VIDEOGAME PICK // CRONENBERG ENERGY",
        "Horror video game",
        "evaluation-candidate",
        "a horror game's Cronenberg-like energy and Patreon potential",
      ],
      [
        1936,
        "The Shining took place in",
        "HALLORANN FATE // SURVIVAL PREDICTION",
        "Dick Hallorann prediction",
        "evaluation-candidate",
        "the prediction that Hallorann survives into The Shining",
      ],
    ],
  ),
  config(
    "Kv8kH3dusjM",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "livestream-review-and-qa",
    [
      [
        57,
        "sell that at Toys \"R\"",
        "MODERN TOYS // OPENING COMPLAINT",
        "Movie merchandise",
        "evaluation-candidate",
        "the quality of modern movie toys",
      ],
      [
        633,
        "No, we're going to own",
        "WHAMP COFFEE // MEDIOCRE BY DESIGN",
        "Whamp Coffee riff",
        "comedy-candidate",
        "an invented coffee shop selling intentionally mediocre coffee",
      ],
      [
        1069,
        "sorry you can't afford it.",
        "TEQUILA PRICE // NOT WATER",
        "Tequila",
        "comedy-candidate",
        "the price of tequila and the repeated not-water defense",
      ],
      [
        1368,
        "cuz they're like, 'I love",
        "LIVE-PD STORY // WAYNE AND GARTH",
        "Television audience story",
        "comedy-candidate",
        "a Wayne-and-Garth comparison inside an audience story",
      ],
      [
        1793,
        "always a good combo right",
        "FRIES AND PIZZA // GYM LATER",
        "Food tangent",
        "comedy-candidate",
        "the fries-and-pizza meal followed by a gym promise",
      ],
      [
        2492,
        "It's only 20 seconds long.",
        "CHUCKY TEASER // WATCH-AND-PAUSE PLAN",
        "Chucky teaser",
        "format-cue",
        "the plan to watch and pause a short Chucky teaser",
      ],
      [
        2718,
        "slices your face.",
        "CHUCKY THEFT // DOLL LOGIC",
        "Chucky",
        "topic-door",
        "whether the teaser establishes that the Chucky doll was stolen",
      ],
      [
        3561,
        "be honest, I [BLEEP] hated",
        "REMAKE CHUCKY // DESIGN VERSUS MOVIE",
        "Child's Play remake",
        "evaluation-candidate",
        "the remake doll design compared with the movie itself",
      ],
      [
        3815,
        "That's That's how Chucky works",
        "BRIDE OF CHUCKY // OPENING TWENTY",
        "Bride of Chucky",
        "evaluation-candidate",
        "the strong opening stretch of Bride of Chucky",
      ],
      [
        4392,
        "ever thought about that? We",
        "LOOMIS LEDGER // FIFTEEN YEARS LATER",
        "Dr. Loomis",
        "comedy-candidate",
        "a joke about Loomis's fifteen years treating Michael Myers",
      ],
      [
        4832,
        "trailer to anybody else look",
        "FEAR STREET PART THREE // NOT FILLER",
        "Fear Street Part Three",
        "evaluation-candidate",
        "whether Fear Street Part Three feels like filler",
      ],
      [
        5075,
        "but dude, I I you",
        "FEAR STREET BLEND // SCREAM JASON WITCH",
        "Fear Street trilogy",
        "evaluation-candidate",
        "the trilogy's blend of Scream, Jason, and witch material",
      ],
      [
        5603,
        "Marco Beltrami. Yeah, it it",
        "BELTRAMI SCORE // HE NAILED IT",
        "Fear Street music",
        "evaluation-candidate",
        "Marco Beltrami's score",
      ],
      [
        5804,
        "I said silk shirt.",
        "SILK SHIRT // CHARLIE SHEEN MODE",
        "Wardrobe story",
        "comedy-candidate",
        "a silk-shirt comparison to Charlie Sheen",
      ],
      [
        6264,
        "that's like saying, I don't",
        "BUDGET DATE // ALL THE MONEY",
        "Dating tangent",
        "comedy-candidate",
        "an improvised budget-date scenario",
      ],
    ],
  ),
  config(
    "m1XIB-ZdQ3Y",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "milestone-celebration",
    [
      [
        320,
        "We just PASSED 20 MILLION VIEWS.",
        "TWENTY MILLION // MILESTONE CONFIRMED",
        "20 million views",
        "format-cue",
        "the announcement that the channel passed twenty million views",
      ],
      [
        659,
        "think the last thing they're",
        "PRINCE OF HELL // CLUBHOUSE RETURN",
        "Hellraiser riff",
        "comedy-candidate",
        "an imagined Prince of Hell returning through a clubhouse",
      ],
      [
        882,
        "I deal with enough people",
        "MOVIE MARATHON MEMORY // MAN VS. MOVIE",
        "Man vs. Movie",
        "topic-door",
        "the earlier Man vs. Movie marathon",
      ],
      [
        1414,
        "like this as hard as",
        "BATMAN CAPE // CRISPY THROW",
        "Batman costume riff",
        "comedy-candidate",
        "a Batman-style cape and throwing motion",
      ],
      [
        1889,
        "fans? If so, have you",
        "MORTAL KOMBAT TRAILER // RAIDEN AND SCORPION",
        "Mortal Kombat trailer",
        "evaluation-candidate",
        "the Raiden-and-Scorpion trailer",
      ],
      [
        2088,
        "Yes, f e 30 y, 20 million views. Can you",
        "MILESTONE CHECK // CAN YOU BELIEVE IT",
        "20 million views",
        "evaluation-candidate",
        "the audience's contribution to twenty million views",
      ],
      [
        2488,
        "didn't sign up to watch",
        "HALLOWEEN WALL // BACKDROP MUTINY",
        "Halloween backdrop",
        "comedy-candidate",
        "the Halloween jack-o'-lantern backdrop",
      ],
      [
        3212,
        "Oh, uh hey, uh David",
        "JOKER MOVIE // PHOENIX EXCITEMENT",
        "Joker",
        "evaluation-candidate",
        "excitement for Joaquin Phoenix in Joker",
      ],
      [
        3342,
        "pool sticks to the dick",
        "POOL STICKS // ANATOMY CORRECTION",
        "Audience riff",
        "comedy-candidate",
        "a deliberately crude correction involving pool sticks",
      ],
      [
        3702,
        "name. Thank you. He says, \"Congrats on",
        "CONGRATS QUEUE // COMMUNITY ROLL CALL",
        "20 million views community",
        "format-cue",
        "the live queue of milestone congratulations",
      ],
      [
        4169,
        "Don't don't deep throat the",
        "BOTTLE NECK // BAD IDEA",
        "Livestream bottle riff",
        "comedy-candidate",
        "a warning about the neck of a bottle",
      ],
      [
        4394,
        "20 million [BLEEP] views.",
        "TWENTY MILLION // BEYOND BELIEF",
        "20 million views",
        "evaluation-candidate",
        "the scale of the twenty-million-view milestone",
      ],
      [
        4822,
        "I've never been to a",
        "DOCTOR OFFICE // STORY DERAILS",
        "Doctor-office story",
        "comedy-candidate",
        "an improvised doctor-office story",
      ],
      [
        5607,
        "know cuz then immediately says,",
        "PLAYGROUND WARNING // DOG INTERRUPTS",
        "Audience story",
        "comedy-candidate",
        "a playground warning interrupted by a dog",
      ],
      [
        5990,
        "20 million views, which all the people",
        "WHOLE REASON // COMMUNITY CREDIT",
        "20 million views",
        "format-cue",
        "the closing return to the purpose of the celebration",
      ],
    ],
  ),
  config(
    "MbbQPoGezy0",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "play-button-unboxing",
    [
      [
        167,
        "subscribers I think so I",
        "MICHAEL MYERS STEP // VIRAL DREAM",
        "Michael Myers video idea",
        "comedy-candidate",
        "a Michael Myers step-by-step video idea",
      ],
      [
        582,
        "Saturday going this is as",
        "PENGUIN WEATHER // OPENING CHAT",
        "Livestream opening",
        "comedy-candidate",
        "the cold-weather opening chat",
      ],
      [
        904,
        "a remake of a classic",
        "FREDDY REMAKE // CLASSIC ROLE ARGUMENT",
        "A Nightmare on Elm Street remake",
        "evaluation-candidate",
        "remaking the classic Freddy Krueger role",
      ],
      [
        1342,
        "watch all the action movies",
        "CHILDHOOD MOVIES // ACTION FIRST",
        "Action movies",
        "topic-door",
        "childhood access to R-rated action movies",
      ],
      [
        1991,
        "like why the [BLEEP] did",
        "MICHAEL MASK // NATURAL LIGHT RIFF",
        "Michael Myers mask",
        "comedy-candidate",
        "a Michael Myers mask complaint that becomes a beer riff",
      ],
      [
        2329,
        "the movie to find out",
        "NEW STORY // NOSTALGIA RESTRAINT",
        "Nostalgia in sequels",
        "evaluation-candidate",
        "favoring a new story over total nostalgia dependence",
      ],
      [
        3059,
        "[BLEEP] suck my ass ball",
        "SPORTS SCORE // ARGUMENT ERUPTS",
        "NFL tangent",
        "comedy-candidate",
        "a heated NFL score exchange",
      ],
      [
        3403,
        "only USA sport I watch",
        "UFC OR BOXING // COMBAT-SPORTS VERDICT",
        "UFC and boxing",
        "evaluation-candidate",
        "the boxing-versus-UFC argument",
      ],
      [
        3646,
        "ready we're gonna unbox the button uh",
        "UNBOXING CALL // BUTTON TIME",
        "YouTube play button",
        "format-cue",
        "the explicit start of the play-button unboxing",
      ],
      [
        3969,
        "no here is the play button guys this is",
        "BUTTON REVEAL // HERE IT IS",
        "YouTube play button",
        "topic-door",
        "the first captioned reveal of the play button",
      ],
      [
        4068,
        "box and uh before we even open it I want",
        "BEFORE THE BOX // COMMUNITY THANKS",
        "YouTube play button",
        "format-cue",
        "the community thank-you before opening the box",
      ],
      [
        4176,
        "and you still astonish 100,000 people",
        "CREATOR LETTER // DICK-JOKE TRANSLATION",
        "YouTube creator letter",
        "comedy-candidate",
        "the creator letter and its improvised wording",
      ],
      [
        4373,
        "passing 100,000 subscribers that's bad",
        "ENGRAVING REVEAL // ONE HUNDRED THOUSAND",
        "100,000 subscribers",
        "evaluation-candidate",
        "the engraved one-hundred-thousand-subscriber award",
      ],
      [
        4775,
        "all reflects from there and thank you",
        "BOTTOM OF OUR HEARTS // MILESTONE REFLECTION",
        "WWAM community",
        "evaluation-candidate",
        "the community's role in reaching the award",
      ],
      [
        6619,
        "you guys thank you guys this is your",
        "YOUR AWARD // LIVESTREAM CLOSE",
        "WWAM community",
        "format-cue",
        "the closing dedication of the award to the audience",
      ],
    ],
  ),
  config(
    "p7pL7mWBI58",
    "public/demo/year-canon-2025-2026.js",
    "WWAM_YEAR_CANON_2025_2026",
    "movie-news",
    [
      [
        156,
        "costs $10, that's 2 hours",
        "MOVIES OR GAMES // VALUE ARGUMENT",
        "Movie and video-game value",
        "evaluation-candidate",
        "the entertainment value of movie tickets versus videogames",
      ],
      [
        353,
        "they wouldn't make their money",
        "GAME COSTS // DEVELOPER CAVEAT",
        "Video-game economics",
        "evaluation-candidate",
        "the cost of making videogames",
      ],
      [
        752,
        "news that just came out.",
        "OSCAR MORNING // WORST NEWS DAY",
        "Academy Award nominations",
        "evaluation-candidate",
        "the annual flood of Academy Award nomination coverage",
      ],
      [
        1148,
        "What the [BLEEP] did I",
        "NOSFERATU NOMINATION // HORROR ARRIVES",
        "Nosferatu",
        "topic-door",
        "Nosferatu receiving a production-design nomination",
      ],
      [
        1492,
        "I'm winning an Oscar.",
        "TRAILER DESK // NEW VIDEO QUEUED",
        "Trailer reaction",
        "format-cue",
        "the move from Oscar talk into a trailer",
      ],
      [
        1630,
        "and [BLEEP] They always like",
        "MARVEL SUBSCRIPTION // CANCELLED",
        "Marvel",
        "evaluation-candidate",
        "the value of a Marvel online subscription",
      ],
      [
        2078,
        "comment like I just it",
        "TIER-LIST BACKLASH // COMMENTS SECTION",
        "2024 movie tier list",
        "comedy-candidate",
        "a hostile comment on a 2024 movie tier list",
      ],
      [
        2392,
        "Uh Michael Parton says, \"Absolute",
        "DC COMICS // SUPERMAN BATMAN WONDER WOMAN",
        "DC comics",
        "topic-door",
        "an audience recommendation for Superman, Batman, and Wonder Woman comics",
      ],
      [
        2619,
        "time for it because I",
        "BATMAN RETURNS // HATE-TAKE DEFENSE",
        "Batman Returns",
        "evaluation-candidate",
        "the backlash to a negative Batman Returns opinion",
      ],
      [
        3001,
        "Was that on a And",
        "ECW MEMORY // CHIHUAHUA RIFF",
        "Wrestling tangent",
        "comedy-candidate",
        "an ECW memory that turns into a crude Chihuahua riff",
      ],
      [
        3196,
        "Does that mean anything to",
        "WEEKEND STORY // WORDS COLLIDE",
        "Personal story",
        "comedy-candidate",
        "a personal story derailed by a verbal mix-up",
      ],
      [
        3595,
        "Uh see if there's anything",
        "ANOTHER TRAILER // SOURCE CHECK",
        "Trailer queue",
        "format-cue",
        "the check for another trailer that can be watched",
      ],
      [
        3760,
        "time. You can see everything",
        "LIVE SIGNAL // HOLD ON",
        "Livestream audience",
        "comedy-candidate",
        "a live-audience exchange interrupted by a startled reaction",
      ],
      [
        4240,
        "Worst case, Chiefs and Eagles.",
        "SUPER BOWL // WORST-CASE MATCHUP",
        "NFL playoffs",
        "evaluation-candidate",
        "a possible Chiefs-and-Eagles Super Bowl",
      ],
      [
        4520,
        "around watching this horse game",
        "SPORTS THIRST // HORSE-RACING DETOUR",
        "Sports tangent",
        "comedy-candidate",
        "watching horse racing while waiting for other sports",
      ],
    ],
  ),
  config(
    "Q13obIV4Dqc",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "trailer-talk-and-qa",
    [
      [
        410,
        "we don't know.",
        "LOOMIS JOB // UNSOLVED MYSTERIES",
        "Dr. Loomis",
        "comedy-candidate",
        "an audience question about Loomis and Unsolved Mysteries",
      ],
      [
        824,
        "[BLEEP] ever.",
        "TRAILER APPEARANCE // HOTTEST EVER",
        "Trailer casting",
        "evaluation-candidate",
        "an emphatic reaction to a trailer appearance",
      ],
      [
        873,
        "like like he's a [BLEEP]",
        "OPENING BAD-GUY READ // ARMORED LOOK",
        "Trailer character",
        "evaluation-candidate",
        "a character's armored bad-guy presentation",
      ],
      [
        1429,
        "should be ashamed of themselves",
        "TRAILER SPOILERS // TOO MUCH SHOWN",
        "Trailer editing",
        "evaluation-candidate",
        "a trailer revealing too much material",
      ],
      [
        2057,
        "all the stuff they're putting",
        "FLASH CAMEOS // BATMEN EVERYWHERE",
        "The Flash",
        "topic-door",
        "the multiple Batman appearances expected in The Flash",
      ],
      [
        2479,
        "college. I I felt like",
        "SPIDER-MAN RELATABILITY // COLLEGE YEARS",
        "Spider-Man",
        "evaluation-candidate",
        "which Spider-Man material feels most relatable",
      ],
      [
        2667,
        "sometimes but not as much",
        "AMAZING SPIDER-MAN // PARENT STORY REJECTED",
        "The Amazing Spider-Man",
        "evaluation-candidate",
        "the Richard and Mary Parker storyline",
      ],
      [
        3284,
        "the the the the the",
        "STAR WARS ANTICIPATION // LEGACY CAST",
        "Star Wars",
        "evaluation-candidate",
        "the excitement around possible legacy-character appearances",
      ],
      [
        3463,
        "like like [BLEEP] what they",
        "IP OVERLOAD // SPACE JAM WARNING",
        "Franchise crossovers",
        "evaluation-candidate",
        "the risk of overloading movies with familiar properties",
      ],
      [
        4249,
        "I have I still you",
        "HBO MAX // HOME-VIEWING RELIEF",
        "Streaming releases",
        "evaluation-candidate",
        "the availability of a movie on HBO Max",
      ],
      [
        4568,
        "\"I've seen far worse. Not",
        "FANDOM WARS // STAR WARS GETS HEATED",
        "Movie fandoms",
        "comedy-candidate",
        "a comparison of argumentative genre fandoms",
      ],
      [
        4926,
        "think that the Nightmare remake",
        "NIGHTMARE REMAKE // FUN BUT FLAWED",
        "A Nightmare on Elm Street remake",
        "evaluation-candidate",
        "the strengths and flaws of the Nightmare remake",
      ],
      [
        5394,
        "um Grease 3, the the",
        "ROBERT ENGLUND LOOK // SEAN PENN RIFF",
        "Robert Englund",
        "comedy-candidate",
        "a Robert Englund appearance comparison",
      ],
      [
        5772,
        "the film why she would",
        "COLLEGE PARENTS // CAN'T WAIT",
        "Movie character tangent",
        "comedy-candidate",
        "a parent-character reaction to children leaving for college",
      ],
      [
        6429,
        "You got to shower before",
        "SHOWER RULE // LATE-SHOW RIFF",
        "Livestream closing riff",
        "comedy-candidate",
        "a deliberately crude late-show rule",
      ],
    ],
  ),
  config(
    "SRZdhswykkA",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "three-movie-review-marathon",
    [
      [
        171,
        "contracted whoever thought sexual patron",
        "CONTRACTED OPENS // VIEWER PICK",
        "Contracted",
        "format-cue",
        "the viewer-selected Contracted review",
      ],
      [
        184,
        "all that was the grossest movie I've",
        "CONTRACTED VERDICT // GROSSEST EVER",
        "Contracted",
        "evaluation-candidate",
        "the film's body-horror effect",
      ],
      [
        787,
        "seen contracted like you got to know",
        "CONTRACTED CONTEXT // KNOW THE MOVIE",
        "Contracted",
        "topic-door",
        "the Contracted discussion context",
      ],
      [
        1197,
        "know what I would have done 1989 Michael",
        "CONTRACTED ESCAPE // KEATON BATMAN RIFF",
        "Contracted",
        "comedy-candidate",
        "a Michael Keaton Batman escape inserted into the review",
      ],
      [
        1351,
        "two more movies after that contracted to",
        "CONTRACTED SEQUELS // ROUND TWO",
        "Contracted sequels",
        "topic-door",
        "the existence of additional Contracted films",
      ],
      [
        1557,
        "alright let's go let's do clue let's",
        "CLUE START // CREEP SAVED FOR LAST",
        "Clue",
        "format-cue",
        "the transition from Contracted to Clue",
      ],
      [
        1589,
        "okay so clue clue clue clue uh dude Tim",
        "CLUE DOOR // TIM CURRY TAKES OVER",
        "Clue",
        "topic-door",
        "Tim Curry's role in Clue",
      ],
      [
        1900,
        "so [BLEEP] wonderful to see Tim Curry",
        "TIM CURRY RANGE // EXPRESSIVE PERFORMANCE",
        "Tim Curry",
        "evaluation-candidate",
        "Tim Curry's expressive range",
      ],
      [
        2067,
        "how fabulous fabulous Tim Curry is as an",
        "TIM CURRY LEDGER // FABULOUS ACTOR",
        "Tim Curry",
        "evaluation-candidate",
        "Tim Curry's acting",
      ],
      [
        2584,
        "I love Tim Curry what do you get it",
        "CLUE SCORE // EASY NINE",
        "Clue verdict",
        "evaluation-candidate",
        "the nine-out-of-ten Clue verdict",
      ],
      [
        2715,
        "shout-out to Deborah Hill producing clue",
        "DEBRA HILL // PRODUCER SHOUT-OUT",
        "Debra Hill",
        "evaluation-candidate",
        "Debra Hill's producing credit on Clue",
      ],
      [
        3577,
        "we like clue lot I gave clue a 9.0 it's",
        "CLUE FINAL VERDICT // NINE POINT ZERO",
        "Clue verdict",
        "evaluation-candidate",
        "the final 9.0 score for Clue",
      ],
      [
        4984,
        "will decree class movie is creep 2003 do",
        "CREEP START // YEAR CORRECTION",
        "Creep (2004)",
        "format-cue",
        "the transition into Creep with its year corrected",
      ],
      [
        5727,
        "release on VOD at like midnight we got",
        "VOD NIGHT MEMORY // PIZZA AND RENTAL",
        "Movie-night memory",
        "comedy-candidate",
        "a late-night VOD rental and pizza memory",
      ],
      [
        6313,
        "he's [BLEEP] Batman you guys were way",
        "BATMAN SIDEBAR // CHAT DETOUR",
        "Audience Q&A",
        "comedy-candidate",
        "a Batman tangent during the late audience discussion",
      ],
    ],
  ),
  config(
    "Ssp_-13AeKA",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "spoiler-free-review-and-qa",
    [
      [
        97,
        "Sorry. The Crow spoiler-free review.",
        "REVIEW GATE // SPOILER-FREE MAYBE",
        "The Crow (2024)",
        "format-cue",
        "the spoiler-free review boundary",
      ],
      [
        283,
        "Eric Draven, it's not The Crow. That was",
        "ERIC DRAVEN NAME // BRANDON LEE ARGUMENT",
        "Eric Draven",
        "evaluation-candidate",
        "using Eric Draven's name in the new film",
      ],
      [
        483,
        "like not even good sex scenes. Just like",
        "ROMANCE AND MUSIC // DOUBLE NEGATIVE",
        "The Crow romance",
        "evaluation-candidate",
        "the romance scenes and overlaid music",
      ],
      [
        816,
        "literally you guys when she appears on",
        "FIRST APPEARANCE // LAUGHTER CANDIDATE",
        "The Crow character introduction",
        "comedy-candidate",
        "a character entrance that prompts captioned laughter",
      ],
      [
        1148,
        "beautiful. Three things. Now",
        "CINEMATOGRAPHY // THE PRAISE COLUMN",
        "The Crow cinematography",
        "evaluation-candidate",
        "the film's cinematography",
      ],
      [
        1465,
        "that's what I will say about the crow,",
        "TITLE PROBLEM // THE CROW 2024",
        "The Crow title",
        "evaluation-candidate",
        "calling the film The Crow",
      ],
      [
        1787,
        "cuz they made it super gory up until you",
        "OPERA HOUSE // TRAILER GAVE IT AWAY",
        "The Crow trailer",
        "evaluation-candidate",
        "the trailer revealing the opera-house action",
      ],
      [
        1951,
        "come out with my mom. That's cool, man.",
        "SAVE YOUR MONEY // DIRECT WARNING",
        "The Crow verdict",
        "evaluation-candidate",
        "the recommendation to skip a theater ticket",
      ],
      [
        2076,
        "That would have fit in Hitman. The Crow",
        "HITMAN COMPARISON // WRONG ENERGY",
        "The Crow tone",
        "evaluation-candidate",
        "the movie's action compared with Hitman",
      ],
      [
        2406,
        "getting here we were going to film a",
        "LUST NOT LOVE // CHAT THESIS",
        "The Crow romance",
        "topic-door",
        "an audience thesis that the central relationship is lust",
      ],
      [
        2898,
        "like he looked good that's about it like",
        "PENNYWISE LOOK // SKARSGÅRD SIDEBAR",
        "Bill Skarsgård",
        "evaluation-candidate",
        "the lead actor's resemblance to Pennywise",
      ],
      [
        3133,
        "Crow 2024 is nihilistic as [BLEEP] It's",
        "NIHILISTIC ENDING // FINAL-TONE PROBLEM",
        "The Crow ending",
        "evaluation-candidate",
        "the film's nihilistic ending",
      ],
      [
        3244,
        "Remake the Crow if you want to. Just",
        "REMAKE RULE // DROP ERIC DRAVEN",
        "The Crow remake",
        "evaluation-candidate",
        "remaking The Crow without using Eric Draven",
      ],
      [
        3335,
        "Beetlejuice Beetlejuice Beetlejuice.",
        "BEETLEJUICE NEXT // TWO-WEEK PREVIEW",
        "Beetlejuice Beetlejuice",
        "format-cue",
        "the preview of the next scheduled review",
      ],
      [
        3775,
        "ourselves Yeah. Oh, JK says the new crow",
        "NEW CROW CLEARS // CHAT GETS ROASTED",
        "Audience reaction",
        "comedy-candidate",
        "a late audience claim that the new film beats the original",
      ],
    ],
  ),
  config(
    "vxKUwIxs72A",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "halloween-news-postshow",
    [
      [
        320,
        "trailer for Halloween kills now and",
        "HALLOWEEN KILLS UPDATE // RELEASE REALITIES",
        "Halloween Kills release",
        "format-cue",
        "the release-strategy update for Halloween Kills",
      ],
      [
        355,
        "on VOD as iron parents had released on",
        "VOD OR THEATERS // OCTOBER STILL OPEN",
        "Halloween Kills release",
        "evaluation-candidate",
        "the possibility of an October theatrical release",
      ],
      [
        392,
        "Halloween kills not release in October I",
        "TRAILER HOLD // WAITING FOR CERTAINTY",
        "Halloween Kills trailer",
        "evaluation-candidate",
        "holding the trailer until the October date is secure",
      ],
      [
        485,
        "Halloween kills comes out in October",
        "OCTOBER CONFIDENCE // SECOND-WAVE CAVEAT",
        "Halloween Kills release",
        "evaluation-candidate",
        "confidence in October with a pandemic caveat",
      ],
      [
        557,
        "about the VOD versus the theatrical",
        "RELEASE ARGUMENT // VOD VERSUS THEATRICAL",
        "VOD and theatrical release",
        "topic-door",
        "the competing VOD and theatrical options",
      ],
      [
        698,
        "news that we got about Halloween kills",
        "MYERS HOUSE // PRODUCTION UPDATE",
        "Myers house",
        "evaluation-candidate",
        "the news that the Myers house returns",
      ],
      [
        840,
        "say VOD or nothing like you don't want",
        "VOD-ONLY TAKE // THEATER PUSHBACK",
        "Halloween Kills theatrical release",
        "evaluation-candidate",
        "the demand for a VOD-only release",
      ],
      [
        994,
        "make the October theatrical deadline and",
        "TRAILER RISK // TWO-YEAR WAIT",
        "Halloween Kills trailer",
        "evaluation-candidate",
        "releasing a trailer before the date is certain",
      ],
      [
        1185,
        "you wily [BLEEP] what kind of a man",
        "HAWKINS LIVES // PIN-KNIFE RIFF",
        "Sheriff Hawkins",
        "comedy-candidate",
        "the prediction that Sheriff Hawkins survives",
      ],
      [
        1583,
        "started yet and this dude tweeted she",
        "HALLOWEEN AT HOME // TWEET DISPUTE",
        "Halloween at Home",
        "topic-door",
        "a tweet criticizing the Halloween at Home event",
      ],
      [
        2019,
        "able to release in October because of",
        "SECOND-WAVE SCENARIO // TRAILER ON ICE",
        "Halloween Kills delay risk",
        "evaluation-candidate",
        "a second pandemic wave delaying the movie",
      ],
      [
        2152,
        "don't think the movies gonna get delayed",
        "DELAY VERDICT // OCTOBER HOLDS",
        "Halloween Kills release",
        "evaluation-candidate",
        "the prediction that the movie avoids a delay",
      ],
      [
        2254,
        "hopefully not two months but I have a",
        "NOSTRADAMUS MODE // FINAL PREDICTION",
        "Halloween prediction",
        "format-cue",
        "the announced final prediction",
      ],
      [
        2544,
        "you don't just make it like oh I cut off",
        "BEST KILLS // CHARACTER WEIGHT",
        "Halloween kills",
        "evaluation-candidate",
        "why a kill matters more when the victim is established",
      ],
      [
        2699,
        "here I just open the door Mike I give",
        "PIZZA-DOOR STORY // TOMMY THREAT",
        "Personal story",
        "comedy-candidate",
        "a pizza-delivery story ending in an improvised threat",
      ],
    ],
  ),
  config(
    "x7ugsiecMio",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "spoiler-review-and-qa",
    [
      [
        72,
        "spoiler talk for longlegs here shortly",
        "LONGLEGS GATE // SPOILER TALK AHEAD",
        "Longlegs",
        "format-cue",
        "the announced transition into Longlegs spoiler talk",
      ],
      [
        270,
        "lot of the way through it but that that",
        "SCARY OR NOT // OPENING VERDICT",
        "Longlegs scares",
        "evaluation-candidate",
        "whether Longlegs is frightening",
      ],
      [
        426,
        "too man uh song ban",
        "WORLDVIEW QUESTION // NO EASY ANSWER",
        "Audience Q&A",
        "comedy-candidate",
        "an audience question about a movie changing a worldview",
      ],
      [
        877,
        "jump scares but uh opening",
        "EVIL DEAD CRAWL // OPENING PRAISE",
        "Longlegs opening",
        "evaluation-candidate",
        "the Evil Dead-like opening-title treatment",
      ],
      [
        1580,
        "that's a bad thing at all I think cage",
        "NICOLAS CAGE // SCARE AND COMEDY",
        "Nicolas Cage",
        "evaluation-candidate",
        "Nicolas Cage balancing menace and comedy",
      ],
      [
        2391,
        "this this is not really",
        "DID YOU LAUGH // AUDIENCE POLL",
        "Longlegs comedy",
        "format-cue",
        "the audience poll about laughing during Longlegs",
      ],
      [
        2783,
        "all that that the killer was satanic",
        "SATANIC REVEAL // LAST-SHOT DIVIDE",
        "Longlegs ending",
        "evaluation-candidate",
        "the satanic reveal and divisive final shot",
      ],
      [
        3137,
        "your breast real quick please",
        "ELEVATED-HORROR CHARACTER // QUIRK CRITIQUE",
        "Longlegs character writing",
        "evaluation-candidate",
        "a character-writing convention associated with elevated horror",
      ],
      [
        3611,
        "head doing a tie-in with",
        "PINHEAD AND MYERS // HELL CROSSOVER",
        "Horror crossover pitch",
        "comedy-candidate",
        "an improvised crossover involving Pinhead and Michael Myers",
      ],
      [
        3826,
        "answer was would you be into a longlegs",
        "LONGLEGS PREQUEL // POLL SAYS YES",
        "Longlegs prequel",
        "evaluation-candidate",
        "the audience vote for a Longlegs prequel",
      ],
      [
        4094,
        "did a movie called clemency in 2019 they",
        "NEON CATALOG // CLEMENCY TO POSSESSOR",
        "Neon films",
        "topic-door",
        "the distributor's earlier film catalog",
      ],
      [
        4313,
        "Market I never even got",
        "DATING APPS // OLD-SCHOOL METHOD",
        "Dating tangent",
        "comedy-candidate",
        "an old-school dating story",
      ],
      [
        4984,
        "100% gonna stick with cage",
        "CAGE PICK // CROCS DETOUR",
        "Nicolas Cage",
        "comedy-candidate",
        "choosing Nicolas Cage before a Crocs tangent",
      ],
      [
        5300,
        "hard-hitting disaster spectacle a",
        "TWISTERS QUOTE // NO NOSTALGIA PANDERING",
        "Twisters",
        "evaluation-candidate",
        "a quoted review praising the lack of nostalgia pandering",
      ],
      [
        5533,
        "actually for the dialogue is",
        "TWISTERS REVIEW // DIALOGUE CAVEAT",
        "Twisters",
        "evaluation-candidate",
        "a quoted criticism of the dialogue",
      ],
    ],
  ),
  config(
    "zPJ9hYgPH44",
    "public/demo/archive-completion.js",
    "WWAM_ARCHIVE_COMPLETION",
    "spoiler-free-review-and-qa",
    [
      [
        67,
        "the Matt Reeves Batman and it looks",
        "MATT REEVES BATMAN // REVIEW DOOR",
        "The Batman",
        "format-cue",
        "the opening move into the Matt Reeves Batman review",
      ],
      [
        205,
        "cuz I I said it's my favorite Batman",
        "FAVORITE BATMAN // OUT-OF-THE-GATE VERDICT",
        "The Batman verdict",
        "evaluation-candidate",
        "the claim that this is a favorite Batman movie",
      ],
      [
        332,
        "my top my top five is The Batman The",
        "TOP FIVE // THE BATMAN TIMES FIVE",
        "Batman ranking",
        "comedy-candidate",
        "an exaggerated top-five Batman ranking",
      ],
      [
        738,
        "movies.",
        "SPOILER-FREE LAUGH // ONE UNNAMED MOMENT",
        "The Batman comedy",
        "comedy-candidate",
        "a funny moment discussed without revealing its plot context",
      ],
      [
        870,
        "detective side of Batman. It's the most",
        "DETECTIVE BATMAN // MOST FOCUSED YET",
        "Batman detective work",
        "evaluation-candidate",
        "the movie's focus on Batman as a detective",
      ],
      [
        976,
        "Robert Pattinson [BLEEP] kills it. I",
        "PATTINSON VERDICT // HE KILLS IT",
        "Robert Pattinson",
        "evaluation-candidate",
        "Robert Pattinson's Batman performance",
      ],
      [
        1374,
        "Oldman just because of how much he had",
        "GORDON RANKING // OLDMAN COMPARISON",
        "James Gordon",
        "evaluation-candidate",
        "the new Gordon compared with Gary Oldman",
      ],
      [
        1859,
        "or or a dialogue fueled ex- you know,",
        "PSYCHOLOGICAL BATMAN // NUANCE COLUMN",
        "The Batman writing",
        "evaluation-candidate",
        "the film's quieter psychological writing",
      ],
      [
        2752,
        "awesome. Paul Dano is an extremely good",
        "PAUL DANO // RIDDLER PERFORMANCE",
        "Paul Dano",
        "evaluation-candidate",
        "Paul Dano's performance and career range",
      ],
      [
        3376,
        "Oh, I laughed my [BLEEP] ass off. I know",
        "SPRAY-PAINT LINE // LAUGH BREAK",
        "The Batman comedy",
        "comedy-candidate",
        "a quoted line that prompts captioned laughter",
      ],
      [
        3654,
        "on it. And now and now Matt Reeves has",
        "STICK WITH REEVES // FRANCHISE STABILITY",
        "Matt Reeves Batman series",
        "evaluation-candidate",
        "continuing with the Matt Reeves version",
      ],
      [
        4253,
        "Hey, that's cool, man. And this This",
        "FANDOM EXTREMES // LOVE-OR-HATE TRAP",
        "Movie fandom",
        "evaluation-candidate",
        "the tendency to frame every movie as best or worst",
      ],
      [
        5484,
        "like this demilitarized feel",
        "GOTHAM TEXTURE // COLOR AND MUSIC",
        "Gotham City",
        "evaluation-candidate",
        "Gotham's color, music, and atmosphere",
      ],
      [
        5792,
        "[BLEEP] One of my favorite Batman villains",
        "FAVORITE VILLAIN // PATTINSON IN THE SUIT",
        "Batman villains",
        "evaluation-candidate",
        "a favorite villain and Pattinson's batsuit performance",
      ],
      [
        6718,
        "love The Batman, so go see that. And",
        "GO SEE IT // FINAL RECOMMENDATION",
        "The Batman verdict",
        "format-cue",
        "the final recommendation and next-show notice",
      ],
    ],
  ),
]);

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function words(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function boundedExcerpt(value) {
  return words(value).slice(0, PUBLIC_EXCERPT_WORD_LIMIT).join(" ");
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

function loadSource(configValue, rootDir) {
  const artifactPath = path.join(rootDir, configValue.artifact);
  const captionPath = path.join(
    rootDir,
    "source-cache",
    "captions",
    `${configValue.id}.json`,
  );
  const metadataPath = path.join(
    rootDir,
    "source-cache",
    "metadata",
    `${configValue.id}.json`,
  );
  for (const filePath of [artifactPath, captionPath, metadataPath]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `${configValue.id} is missing evidence file ${filePath}.`,
      );
    }
  }

  const artifactRaw = fs.readFileSync(artifactPath);
  const canonicalPayload = loadWindowAssignment(
    artifactPath,
    configValue.global,
  );
  const source = sourceRecords(canonicalPayload).find(
    (record) => record.id === configValue.id,
  );
  if (!source) {
    throw new Error(
      `${configValue.id} was not found in ${configValue.artifact}.`,
    );
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
    metadata.id !== configValue.id ||
    clean(metadata.title) !== clean(source.title) ||
    Number(metadata.duration) !== duration ||
    clean(metadata.upload_date) !== clean(source.date).replace(/-/g, "")
  ) {
    throw new Error(
      `${configValue.id} metadata and canonical identity diverged.`,
    );
  }
  const isYouTubeAsr =
    /[?&]kind=asr(?:&|$)/.test(clean(metadata.caption_url)) &&
    /[?&]lang=en(?:&|$)/.test(clean(metadata.caption_url));
  if (!isYouTubeAsr) {
    throw new Error(`${configValue.id} lacks a proven English ASR track.`);
  }
  const rights = source.rightsPolicy || {};
  if (
    rights.mode !== configValue.boundaryMode ||
    rights.restrictedToTopicNavigation !== false ||
    rights.speakerClaimsAllowed !== false ||
    rights.performerClaimsAllowed !== false ||
    rights.originClaimsAllowed !== false ||
    rights.visualClaimsAllowed !== false ||
    rights.promotionAllowed !== false
  ) {
    throw new Error(
      `${configValue.id} rights boundary changed; re-audit required.`,
    );
  }
  if (lines.length < 500 || lines.at(-1).at < duration * 0.8) {
    throw new Error(
      `${configValue.id} caption cache is too thin for this rebuild.`,
    );
  }

  return {
    source,
    artifactRaw,
    captionRaw,
    metadataRaw,
    lines,
    captionProvenance: {
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

function buildGuide(configValue, input) {
  const duration = Number(input.source.duration);
  if (configValue.cuts.length !== 15) {
    throw new Error(`${configValue.id} must retain exactly 15 bounded cuts.`);
  }
  const cuts = configValue.cuts.map((spec, index) => {
    const anchor = locateAnchor(input.lines, spec, configValue.id);
    const classification = classificationState(spec.classification);
    return {
      id: `topic-rebuild-b5-${configValue.id}-${String(index + 1).padStart(2, "0")}-${anchor.at}`,
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
      throw new Error(
        `${configValue.id} cuts are not strictly chronological.`,
      );
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
      `${configValue.id} must distinguish navigation, evaluation, and comedy lanes.`,
    );
  }

  const firstAt = cuts[0].at;
  const lastEnd = cuts.at(-1).end;
  const guide = {
    schema: "wwam-episode-guide-v2-topic-rebuild/v1",
    variant: "topic-rebuild-batch5-unreviewed",
    format: configValue.format,
    publicationStatus: "quarantined-rebuild-shard",
    promotionAllowed: false,
    humanEditorialReviewPerformed: false,
    creatorApprovalClaimed: false,
    basis:
      "Exact-source English ASR events with bounded playback. Topic and format doors are navigation. Evaluation and comedy lanes require explicit spoken wording and remain unreviewed candidates.",
    overview: `${input.source.title} receives ${cuts.length} bounded source cuts across ${counts["topic-door"] + counts["format-cue"]} navigation or format doors, ${counts["evaluation-candidate"]} spoken evaluation candidates, and ${counts["comedy-candidate"]} spoken comedy candidates. Speaker, performer, audio origin, and visual context remain unset.`,
    evidenceLimitations: [
      "The automatic-caption events are not speaker-diarized.",
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

export function buildTopicRebuildBatch5({ rootDir = PROJECT_ROOT } = {}) {
  const guides = TOPIC_REBUILD_BATCH5_CONFIGS.map((configValue) => {
    const input = loadSource(configValue, rootDir);
    const episodeGuide = buildGuide(configValue, input);
    return {
      id: configValue.id,
      title: input.source.title,
      date: input.source.date,
      duration: Number(input.source.duration),
      url: input.source.url,
      thumbnail: input.source.thumbnail,
      sourceArtifact: configValue.artifact,
      sourceContentMode: input.source.contentMode,
      sourceAudit: {
        advisory: "generic-label-dominance",
        score: configValue.advisoryScore,
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
        mode: configValue.boundaryMode,
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
    schema: "wwam-episode-guide-v2-topic-rebuild-batch5/v1",
    generated: GENERATED,
    selection: {
      ids: TOPIC_REBUILD_BATCH5_CONFIGS.map((configValue) => configValue.id),
      count: TOPIC_REBUILD_BATCH5_CONFIGS.length,
      reason:
        "The thirteen remaining generic-label advisories after Batches 1 through 4, rebuilt across news, recap, review, celebration, unboxing, and open-line formats.",
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
        "scripts/generate-episode-guide-v2-topic-rebuild-batch5.mjs",
      method:
        "Deterministic exact-source rebuild from canonical source records, English YouTube ASR event caches, exact caption-event anchors, bounded playback windows, and manually specified evidence-safe labels and summaries.",
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

export function renderTopicRebuildBatch5(payload) {
  return `window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH5 = ${JSON.stringify(payload)};\n`;
}

function main() {
  const payload = buildTopicRebuildBatch5();
  fs.writeFileSync(OUTPUT_PATH, renderTopicRebuildBatch5(payload));
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)} with ${payload.meta.guides} guides and ${payload.meta.cuts} cuts.\n`,
  );
}

if (path.resolve(process.argv[1] || "") === path.resolve(SCRIPT_PATH)) {
  main();
}
