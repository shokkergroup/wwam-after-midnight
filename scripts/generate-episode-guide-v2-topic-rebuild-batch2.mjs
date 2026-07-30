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
  "episode-guide-v2-topic-rebuild-batch2.js",
);
const GENERATED = "2026-07-30";
const PUBLIC_EXCERPT_WORD_LIMIT = 16;
const CUT_LENGTH_SECONDS = 24;

export const TOPIC_REBUILD_BATCH2_CONFIGS = Object.freeze([
  {
    id: "3Lu5KPrQhc8",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "movie-commentary",
    boundaryMode: "source-audio-boundary-unverified",
    cuts: [
      {
        at: 326,
        needle: "watch the movie",
        label: "COMMENTARY SETUP // COUNTDOWN PROMISED",
        topic: "Commentary synchronization",
        classification: "format-cue",
        summary:
          "The caption track tells viewers that the movie will be counted down for synchronized playback.",
      },
      {
        at: 408,
        needle: "sync up",
        label: "SYNC POINT // PLAYBACK BEGINS",
        topic: "Commentary synchronization",
        classification: "format-cue",
        summary:
          "An explicit spoken sync instruction marks the start of the commentary portion.",
      },
      {
        at: 533,
        needle: "mark hamill",
        label: "CHUCKY VOICE DEBATE // HAMILL OPTION",
        topic: "Chucky voice casting",
        classification: "evaluation-candidate",
        summary:
          "The nearby spoken exchange calls Mark Hamill the best alternative when Brad Dourif is unavailable.",
      },
      {
        at: 660,
        needle: "John Ritter",
        label: "JOHN RITTER ARRIVES // CAST DOOR",
        topic: "John Ritter",
        classification: "topic-door",
        summary:
          "The caption track explicitly names John Ritter and opens a cast discussion.",
      },
      {
        at: 891,
        needle: "lost John Ritter",
        label: "RITTER REMEMBRANCE // A REAL LOSS",
        topic: "John Ritter",
        classification: "evaluation-candidate",
        summary:
          "Explicit spoken wording expresses regret over John Ritter's death.",
      },
      {
        at: 1530,
        needle: "a doll",
        label: "DOLL-ROMANCE LINE // HARD LEFT TURN",
        topic: "Chucky and Tiffany",
        classification: "comedy-candidate",
        summary:
          "A profane doll-romance remark creates a clearly spoken comedy candidate.",
      },
      {
        at: 2572,
        needle: "good soundtrack",
        label: "BRIDE LEDGER // SOUNDTRACK AND ACTION",
        topic: "Bride of Chucky",
        classification: "evaluation-candidate",
        summary:
          "The spoken assessment praises the soundtrack, action, and Jennifer Tilly while defending the movie's appeal.",
      },
      {
        at: 2873,
        needle: "Ritter",
        label: "RITTER APPRECIATION // GOOD ACTOR",
        topic: "John Ritter",
        classification: "evaluation-candidate",
        summary:
          "The captioned reaction celebrates John Ritter's presence and calls him a good actor.",
      },
      {
        at: 4032,
        needle: "hard for us",
        label: "COMMENTARY META // RANDOM CONVERSATIONS",
        topic: "Commentary format",
        classification: "format-cue",
        summary:
          "The spoken aside explains that detailed scene commentary often gives way to random conversation.",
      },
      {
        at: 4151,
        needle: "Jennifer Tilly",
        label: "TILLY OR HEIGL // THE ROOM VOTES",
        topic: "Jennifer Tilly and Katherine Heigl",
        classification: "comedy-candidate",
        summary:
          "A direct Jennifer Tilly versus Katherine Heigl question launches an exaggerated spoken exchange.",
      },
      {
        at: 4632,
        needle: "character in the movie",
        label: "CHARACTER CONTEXT // MOVIE PERSONA ONLY",
        topic: "Movie-character discussion",
        classification: "topic-door",
        summary:
          "The caption text explicitly limits the conversation to a character in the movie.",
      },
      {
        at: 4792,
        needle: "actually kind of scary",
        label: "SCARE LANDS // KIND OF SCARY",
        topic: "Bride of Chucky scare",
        classification: "evaluation-candidate",
        summary:
          "An immediate spoken reaction explicitly calls the moment kind of scary.",
      },
      {
        at: 4976,
        needle: "Jennifer Tilly was fantastic",
        label: "TILLY VERDICT // TALES FROM THE CRYPT ENERGY",
        topic: "Jennifer Tilly",
        classification: "evaluation-candidate",
        summary:
          "The spoken verdict calls Jennifer Tilly fantastic and compares the movie's tone with Tales from the Crypt.",
      },
      {
        at: 5243,
        needle: "people hate these movies",
        label: "STEVE'S CHUTE // WHY PEOPLE HATE IT",
        topic: "Bride of Chucky criticism",
        classification: "evaluation-candidate",
        summary:
          "A blunt spoken criticism says the movie has reached a point that explains its detractors.",
      },
      {
        at: 5520,
        needle: "beginning",
        label: "FINAL VERDICT // GOOD ENDS, BAD MIDDLE",
        topic: "Bride of Chucky verdict",
        classification: "evaluation-candidate",
        summary:
          "The closing verdict praises the beginning and ending while rejecting the middle.",
      },
    ],
  },
  {
    id: "rLdk9JKeN68",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "trailer-reaction",
    boundaryMode: "source-audio-boundary-unverified",
    cuts: [
      {
        at: 5,
        needle: "We Watch Movies",
        label: "LIVE WIRE OPEN // THE SHOW CLOCK STARTS",
        topic: "WWAM live show",
        classification: "format-cue",
        summary:
          "The automatic captions open with the WWAM welcome and a rapid greeting.",
      },
      {
        at: 1260,
        needle: "Jennifer Tilly",
        label: "CHUCKY WIRE // TIFFANY MAY RETURN",
        topic: "Chucky and Tiffany report",
        classification: "topic-door",
        summary:
          "The captioned report says Jennifer Tilly described more Chucky and Tiffany work as being in development.",
      },
      {
        at: 1372,
        needle: "amazing soundtrack",
        label: "BRIDE TAKE // SOUNDTRACK LOVE",
        topic: "Bride of Chucky",
        classification: "evaluation-candidate",
        summary:
          "The spoken assessment calls Bride of Chucky's soundtrack amazing while acknowledging its fan base.",
      },
      {
        at: 1475,
        needle: "proud skank",
        label: "ROB ZOMBIE PITCH // CHUCKY GOES SKANK",
        topic: "Rob Zombie and Chucky",
        classification: "comedy-candidate",
        summary:
          "An intentionally exaggerated spoken pitch links Rob Zombie's style with a comic Chucky description.",
      },
      {
        at: 1642,
        needle: "Star Wars is dead",
        label: "STAR WARS ALARM // THE FRANCHISE IS DEAD",
        topic: "Star Wars",
        classification: "evaluation-candidate",
        summary:
          "A direct spoken verdict says Star Wars is dead and needs a drastic recovery.",
      },
      {
        at: 1780,
        needle: "CAMEL",
        label: "ROTTEN TOMATOES BLURB // CAMEL CUT",
        topic: "Star Wars criticism",
        classification: "comedy-candidate",
        summary:
          "A profane one-line put-down is immediately recast as a mock Rotten Tomatoes blurb.",
      },
      {
        at: 2081,
        needle: "intriguing",
        label: "MUMMY TRAILER // FULL WATCH SETUP",
        topic: "The Mummy trailer",
        classification: "format-cue",
        summary:
          "The caption track praises a teaser and announces a full watch of the newly released trailer.",
      },
      {
        at: 2301,
        needle: "skin",
        label: "MUMMY AFTERSHOCK // CRISPY VERDICT",
        topic: "The Mummy trailer reaction",
        classification: "comedy-candidate",
        summary:
          "An escalating post-trailer reaction mixes graphic wording with enthusiastic praise.",
      },
      {
        at: 2651,
        needle: "best part and worst",
        label: "SONY SUBSCRIPTION // THE CATCH",
        topic: "Sony console subscription",
        classification: "topic-door",
        summary:
          "The spoken explanation introduces the central tradeoff in a reported long-term console subscription.",
      },
      {
        at: 3043,
        needle: "LOVE SONY",
        label: "SONY SUPERFAN RIFF // BRAND WORSHIP",
        topic: "Sony fandom",
        classification: "comedy-candidate",
        summary:
          "An exaggerated Sony-superfan impression turns the hardware discussion into a comedy candidate.",
      },
      {
        at: 3113,
        needle: "Scream stuff",
        label: "SCREAM WIRE // UPDATE MODE",
        topic: "Scream franchise news",
        classification: "topic-door",
        summary:
          "The caption track explicitly pivots to Scream material and promises a deeper update.",
      },
      {
        at: 7079,
        needle: "looks cool",
        label: "BOND GAME VERDICT // MOVIE-WORTHY PITCH",
        topic: "James Bond game",
        classification: "evaluation-candidate",
        summary:
          "The spoken reaction calls the James Bond game good and says its story could work as a movie.",
      },
      {
        at: 9653,
        needle: "Halloween perfected",
        label: "HALLOWEEN VS SCREAM // THE THESIS",
        topic: "Halloween and Scream",
        classification: "evaluation-candidate",
        summary:
          "A concise spoken thesis says Halloween perfected the slasher while Scream broke the mold.",
      },
      {
        at: 10444,
        needle: "studios",
        label: "THEATER ECONOMICS // STUDIOS TAKE THE BLAME",
        topic: "Movie theaters",
        classification: "evaluation-candidate",
        summary:
          "The spoken position blames studios for theater pressure and describes higher prices as a survival response.",
      },
      {
        at: 11576,
        needle: "Superman Day",
        label: "SUPERMAN DAY // SUPERGIRL TAKEOVER",
        topic: "Superman and Supergirl",
        classification: "comedy-candidate",
        summary:
          "A profane Superman Day reaction turns a Supergirl promotion complaint into a closing riff.",
      },
    ],
  },
  {
    id: "QxJyVaAgZ_Y",
    artifact: "public/demo/archive-deep-batch2.js",
    global: "WWAM_ARCHIVE_DEEP_BATCH2",
    format: "watch-party",
    boundaryMode: "film-audio-boundary-unverified",
    cuts: [
      {
        at: 134,
        needle: "Final Chapter",
        label: "WATCH-ALONG CALL // FINAL CHAPTER",
        topic: "Friday the 13th: The Final Chapter",
        classification: "format-cue",
        summary:
          "The pre-show caption text invites viewers to watch The Final Chapter with the livestream.",
      },
      {
        at: 3603,
        needle: "movie has begun",
        label: "SYNC LOCK // THE MOVIE BEGINS",
        topic: "Watch-along synchronization",
        classification: "format-cue",
        summary:
          "The spoken countdown ends with an explicit announcement that the movie has begun.",
      },
      {
        at: 5793,
        needle: "chrisen",
        label: "CRISPIN GLOVER // GREAT IN THIS",
        topic: "Crispin Glover",
        classification: "evaluation-candidate",
        summary:
          "An explicit spoken reaction praises Crispin Glover's work in the movie.",
      },
      {
        at: 5981,
        needle: "banana",
        label: "BANANA BUSINESS // GREAT AND GROSS",
        topic: "Banana scene",
        classification: "comedy-candidate",
        summary:
          "The captioned reaction calls the banana moment great and gross in the same breath.",
      },
      {
        at: 6905,
        needle: "scary",
        label: "MONSTER TRANSITION // THE SCARE LANDS",
        topic: "Scary transition",
        classification: "evaluation-candidate",
        summary:
          "An immediate spoken reaction explicitly calls the moment scary and praises its transition.",
      },
      {
        at: 6940,
        needle: "just dance",
        label: "GLOVER DANCE // ELI MANNING FOOTWORK",
        topic: "Crispin Glover dance",
        classification: "comedy-candidate",
        summary:
          "The dance discussion becomes a spoken comparison with Eli Manning and a clear comedy candidate.",
      },
      {
        at: 7384,
        needle: "great kill",
        label: "DOUBLE KILL // AMAZING HIT",
        topic: "Friday the 13th kill",
        classification: "evaluation-candidate",
        summary:
          "The immediate spoken verdict calls the sequence a great and amazing double kill.",
      },
      {
        at: 7657,
        needle: "worst",
        label: "DOCK KILL // THE LIFT MAKES IT",
        topic: "Friday the 13th kill",
        classification: "evaluation-candidate",
        summary:
          "The captioned reaction identifies the upward lift as the worst part of the kill.",
      },
      {
        at: 8474,
        needle: "better kill",
        label: "GLOVER EXIT // DESERVED A BETTER KILL",
        topic: "Crispin Glover death",
        classification: "evaluation-candidate",
        summary:
          "The spoken critique says Crispin Glover should have received a better kill and lasted longer.",
      },
      {
        at: 9187,
        needle: "npaa",
        label: "CENSORSHIP RANT // MPAA HEAT",
        topic: "MPAA censorship",
        classification: "evaluation-candidate",
        summary:
          "A blunt spoken complaint targets the ratings board and its treatment of horror violence.",
      },
      {
        at: 9923,
        needle: "shot",
        label: "SAVINI EFFECT // THE SHOT IS SO GOOD",
        topic: "Tom Savini effects",
        classification: "evaluation-candidate",
        summary:
          "The reaction praises the captured shot and immediately asks whether Tom Savini created the effect.",
      },
      {
        at: 10077,
        needle: "hate this scene",
        label: "ENDING HEAT // AWFUL SCENE",
        topic: "Final Chapter ending",
        classification: "evaluation-candidate",
        summary:
          "A direct spoken verdict says the scene is hated, awful, and dumb.",
      },
      {
        at: 10464,
        needle: "great",
        label: "FINAL CHAPTER VERDICT // GREAT MOVIE",
        topic: "Final Chapter verdict",
        classification: "evaluation-candidate",
        summary:
          "The post-watch discussion explicitly calls The Final Chapter a great movie before comparing Jason Lives.",
      },
      {
        at: 10783,
        needle: "first film",
        label: "FRANCHISE LEDGER // FIRST FILM FALLS",
        topic: "Friday the 13th franchise",
        classification: "evaluation-candidate",
        summary:
          "The spoken franchise ranking says the first film has little replay value and is disliked.",
      },
      {
        at: 11119,
        needle: "best posters",
        label: "MANHATTAN VERDICT // GREAT POSTER, BAD MOVIE",
        topic: "Jason Takes Manhattan",
        classification: "evaluation-candidate",
        summary:
          "The closing franchise survey praises the Manhattan poster while strongly rejecting the movie.",
      },
    ],
  },
  {
    id: "bTzVQKD73L0",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "source-video-watch-party",
    boundaryMode: "source-audio-boundary-unverified",
    cuts: [
      {
        at: 1661,
        needle: "watch scary",
        label: "MISSION SWITCH // WATCH SCARY STUFF",
        topic: "Scary-video watch party",
        classification: "format-cue",
        summary:
          "The caption track says the planned discussion was replaced by another scary-video watch session.",
      },
      {
        at: 2754,
        needle: "watch one",
        label: "SUBMISSION FOLDER // RANDOM PICK",
        topic: "Viewer submissions",
        classification: "format-cue",
        summary:
          "The spoken setup opens an email folder of viewer submissions and announces a random selection.",
      },
      {
        at: 2784,
        needle: "denial heart",
        label: "FIRST FILE // DAYWALT TOUR",
        topic: "Daywalt short",
        classification: "topic-door",
        summary:
          "The caption track names the submitter and introduces a roughly five-minute source video.",
      },
      {
        at: 2818,
        needle: "share audio",
        label: "PLAYBACK CHECK // SHARE AUDIO",
        topic: "Playback setup",
        classification: "format-cue",
        summary:
          "An explicit screen-share and audio check defines the source-video playback boundary.",
      },
      {
        at: 3106,
        needle: "scar me",
        label: "FOOTSTEP HIT // WELL DONE",
        topic: "Scary-video reaction",
        classification: "evaluation-candidate",
        summary:
          "The immediate spoken reaction says the footsteps caused a scare and calls the execution well done.",
      },
      {
        at: 3808,
        needle: "comes from",
        label: "MIRROR FILE // JAPANESE GHOST GIRL",
        topic: "Japanese ghost-girl video",
        classification: "topic-door",
        summary:
          "The caption track introduces a submission titled Japanese Ghost Girl in a Mirror.",
      },
      {
        at: 3935,
        needle: "haunt me",
        label: "MIRROR AFTERMATH // HAUNTED TONIGHT",
        topic: "Japanese ghost-girl reaction",
        classification: "evaluation-candidate",
        summary:
          "A direct spoken reaction says the source will haunt the speaker that night.",
      },
      {
        at: 4964,
        needle: "bicycle kick",
        label: "LIU KANG SOLUTION // BICYCLE KICK",
        topic: "Ghost-story reaction",
        classification: "comedy-candidate",
        summary:
          "A spoken Liu Kang bicycle-kick suggestion turns the supernatural sequence into a comedy candidate.",
      },
      {
        at: 5054,
        needle: "Lonely Heart",
        label: "YES PUN // OWNER OF A LONELY HEART",
        topic: "Ghost-story reaction",
        classification: "comedy-candidate",
        summary:
          "A quick Owner of a Lonely Heart reference lands before the source is called cool but not scary.",
      },
      {
        at: 6243,
        needle: "another scary movie",
        label: "BACK TO THE FILES // NEXT SCARY MOVIE",
        topic: "Scary-video watch party",
        classification: "format-cue",
        summary:
          "The caption track explicitly returns from a story break to another scary source video.",
      },
      {
        at: 6633,
        needle: "creepy",
        label: "ROAD LOOP // PLAUSIBLE CREEP",
        topic: "Road-loop video",
        classification: "evaluation-candidate",
        summary:
          "The spoken reaction says the looping-road situation would be creepy if it happened.",
      },
      {
        at: 7522,
        needle: "abandoned",
        label: "HOSPITAL FILE // ABANDONED WARD",
        topic: "Scary abandoned hospital",
        classification: "topic-door",
        summary:
          "The caption track names the next source Scary Abandoned Hospital.",
      },
      {
        at: 8379,
        needle: "scary one",
        label: "SMILING MAN // PROMISING FILE",
        topic: "The Smiling Man",
        classification: "topic-door",
        summary:
          "The spoken introduction names The Smiling Man and calls it a promising scary selection.",
      },
      {
        at: 8764,
        needle: "really good",
        label: "SMILING MAN VERDICT // WELL FILMED",
        topic: "The Smiling Man verdict",
        classification: "evaluation-candidate",
        summary:
          "The reaction calls the source really good and well filmed while questioning its emotional connection.",
      },
      {
        at: 10264,
        needle: "honest",
        label: "NIGHT LEDGER // CREEPY OVER JUMP-SCARES",
        topic: "Scary-video night verdict",
        classification: "evaluation-candidate",
        summary:
          "The closing assessment distinguishes early gnarly scares from later atmosphere-driven creepy selections.",
      },
    ],
  },
  {
    id: "KIGg_I72x_M",
    artifact: "public/demo/archive-deep-batch2.js",
    global: "WWAM_ARCHIVE_DEEP_BATCH2",
    format: "script-reading",
    boundaryMode: "script-origin-boundary-unverified",
    cuts: [
      {
        at: 60,
        needle: "different scripts",
        label: "FORMAT ORIGIN // CHARACTER PROMPTS",
        topic: "Generated character scripts",
        classification: "format-cue",
        summary:
          "The opening explains that audience ideas became several generated scripts featuring recurring characters.",
      },
      {
        at: 1738,
        needle: "getting ready",
        label: "CAST BOARD // LOOMIS, SLENDY, WAHLBERG",
        topic: "WWAM character scripts",
        classification: "format-cue",
        summary:
          "The formal setup names the recurring-character script format and introduces an additional guest participant.",
      },
      {
        at: 1866,
        needle: "nobody look",
        label: "COLD READ RULE // NOBODY PEEKS",
        topic: "Cold script reading",
        classification: "format-cue",
        summary:
          "An explicit instruction tells the participants not to preview the first script.",
      },
      {
        at: 1970,
        needle: "read the narration",
        label: "SCRIPT ONE // ABANDONED HOUSE",
        topic: "First script reading",
        classification: "format-cue",
        summary:
          "The first reading begins with a narration cue and an abandoned-house storm setup.",
      },
      {
        at: 2272,
        needle: "real Halloween",
        label: "HALLOWEEN ENDS BUTTON // KILL CORY",
        topic: "Halloween Ends",
        classification: "comedy-candidate",
        summary:
          "A profane Halloween Ends rewrite joke interrupts the first generated script.",
      },
      {
        at: 2463,
        needle: "AI was bad",
        label: "SCRIPT ONE VERDICT // SURPRISINGLY GREAT",
        topic: "First script verdict",
        classification: "evaluation-candidate",
        summary:
          "The immediate verdict jokingly rejects the anti-AI warning and calls the result good.",
      },
      {
        at: 2580,
        needle: "scripts",
        label: "WRITERS' ROOM // WANTS A WHOLE MOVIE",
        topic: "Script-generation process",
        classification: "format-cue",
        summary:
          "The process discussion describes building scenarios and wanting a full feature-length generated movie.",
      },
      {
        at: 2821,
        needle: "goggles",
        label: "TANNING SALON // SLENDY GETS BRONZED",
        topic: "Tanning-salon script",
        classification: "comedy-candidate",
        summary:
          "A featureless character in tiny tanning goggles opens an intentionally absurd salon exchange.",
      },
      {
        at: 3004,
        needle: "MTV",
        label: "SALON VERDICT // LATE-NIGHT MTV WEIRD",
        topic: "Tanning-salon script verdict",
        classification: "evaluation-candidate",
        summary:
          "The spoken reaction compares the script's strangeness with late-night MTV animation.",
      },
      {
        at: 3180,
        needle: "cramped in a car",
        label: "CHRISTINE MASHUP // POSSESSED PLYMOUTH",
        topic: "Possessed-car script",
        classification: "topic-door",
        summary:
          "The next script places the characters in a 1958 Plymouth Fury with an unnatural engine.",
      },
      {
        at: 3588,
        needle: "next victim",
        label: "POSSESSED-CAR VERDICT // LOOMIS STAYS SULLEN",
        topic: "Possessed-car script verdict",
        classification: "evaluation-candidate",
        summary:
          "The post-script reaction calls the result great and praises the recurring detective-like Loomis characterization.",
      },
      {
        at: 3660,
        needle: "images in his mind",
        label: "LOOMIS DREAM // NOSFERATU ENTERS",
        topic: "Loomis and Nosferatu script",
        classification: "topic-door",
        summary:
          "A dream-sequence narration introduces a Loomis and Nosferatu scenario.",
      },
      {
        at: 4142,
        needle: "aching",
        label: "SOUND-EFFECTS LAB // MAC AND CHEESE",
        topic: "Script sound effects",
        classification: "comedy-candidate",
        summary:
          "A graphic spoken riff proposes macaroni and cheese as a practical sound effect.",
      },
      {
        at: 4190,
        needle: "Subway subterfuge",
        label: "SUBWAY SUBTERFUGE // HADDONFIELD PD",
        topic: "Subway Subterfuge script",
        classification: "topic-door",
        summary:
          "The next titled script opens inside the Haddonfield Police Department.",
      },
      {
        at: 6323,
        needle: "awesome",
        label: "READING FINALE // AWESOME NIGHT",
        topic: "Script-reading verdict",
        classification: "evaluation-candidate",
        summary:
          "The reading block closes with an immediate spoken verdict calling the experiment awesome.",
      },
    ],
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
    metadata.title !== source.title ||
    Number(metadata.duration) !== duration ||
    clean(metadata.upload_date) !== clean(source.date).replace(/-/g, "")
  ) {
    throw new Error(`${config.id} metadata and canonical identity diverged.`);
  }
  if (
    !/[?&]kind=asr(?:&|$)/.test(clean(metadata.caption_url)) ||
    !/[?&]lang=en(?:&|$)/.test(clean(metadata.caption_url))
  ) {
    throw new Error(`${config.id} lacks a proven English ASR track.`);
  }
  if (
    source.rightsPolicy?.restrictedToTopicNavigation !== true ||
    source.rightsPolicy?.mode !== config.boundaryMode
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
  };
}

function buildGuide(config, input) {
  const duration = Number(input.source.duration);
  if (config.cuts.length < 10 || config.cuts.length > 15) {
    throw new Error(`${config.id} must retain between 10 and 15 bounded cuts.`);
  }
  const cuts = config.cuts.map((spec, index) => {
    const anchor = locateAnchor(input.lines, spec, config.id);
    const classification = classificationState(spec.classification);
    return {
      id: `topic-rebuild-b2-${config.id}-${String(index + 1).padStart(2, "0")}-${anchor.at}`,
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
        type: "youtube-automatic-caption",
        track: "English YouTube automatic captions (JSON3)",
        timestampStatus: "exact-caption-event",
        excerptStatus: "short-source-fragment",
        speakerStatus: "not-diarized",
        performerStatus: "not-inferred",
        originStatus: "source-audio-boundary-unverified",
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
    variant: "topic-rebuild-batch2-unreviewed",
    format: config.format,
    publicationStatus: "quarantined-rebuild-shard",
    promotionAllowed: false,
    humanEditorialReviewPerformed: false,
    creatorApprovalClaimed: false,
    basis:
      "Exact-source English automatic-caption events with bounded playback. Topic doors are navigation. Evaluation and comedy lanes require explicit spoken wording and remain unreviewed candidates.",
    overview: `${input.source.title} receives ${cuts.length} bounded source cuts across ${counts["topic-door"] + counts["format-cue"]} navigation/format doors, ${counts["evaluation-candidate"]} spoken evaluation candidates, and ${counts["comedy-candidate"]} spoken comedy candidates. Speaker, performer, source-audio origin, and visual context remain unset.`,
    evidenceLimitations: [
      "The automatic captions are not speaker-diarized.",
      `The ${config.boundaryMode} rule prevents host, performer, and audio-origin attribution.`,
      "No visual event, scene detail, source-video identity, or reaction target is inferred beyond the caption words.",
      "Generated-script words are not attributed to a prompt author, reader, performer, or character voice.",
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
      "Play every proposed in/out point against the exact official upload.",
      "Confirm whether the words come from WWAM, embedded media, a script reading, or another source.",
      "Set speaker and performer only after human verification.",
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

export function buildTopicRebuildBatch2({ rootDir = PROJECT_ROOT } = {}) {
  const guides = TOPIC_REBUILD_BATCH2_CONFIGS.map((config) => {
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
        restrictedToTopicNavigation: true,
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
        captionProvenance: {
          type: "youtube-automatic-caption",
          track: "English YouTube automatic captions (JSON3)",
          eventType: "youtube-json3-caption-event",
          kind: "asr",
          language: "en",
          speakerDiarized: false,
          fullPayloadPublic: false,
        },
      },
      episodeGuide,
    };
  });

  const payload = {
    schema: "wwam-episode-guide-v2-topic-rebuild-batch2/v1",
    generated: GENERATED,
    selection: {
      ids: TOPIC_REBUILD_BATCH2_CONFIGS.map((config) => config.id),
      count: TOPIC_REBUILD_BATCH2_CONFIGS.length,
      reason:
        "The next five weakest rights-restricted topic recaps after Batch 1, selected by the current depth and semantics audits.",
      integratedIntoSharedRuntime: false,
    },
    policy: {
      publicExcerptWordLimit: PUBLIC_EXCERPT_WORD_LIMIT,
      minimumCutsPerShow: 10,
      maximumCutsPerShow: 15,
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
        "scripts/generate-episode-guide-v2-topic-rebuild-batch2.mjs",
      method:
        "Deterministic exact-source rebuild from canonical source records, local English automatic-caption caches, exact caption-event anchors, bounded playback windows, and manually specified evidence-safe labels and summaries.",
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

export function renderTopicRebuildBatch2(payload) {
  return `window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH2 = ${JSON.stringify(payload)};\n`;
}

function main() {
  const payload = buildTopicRebuildBatch2();
  fs.writeFileSync(OUTPUT_PATH, renderTopicRebuildBatch2(payload));
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)} with ${payload.meta.guides} guides and ${payload.meta.cuts} cuts.\n`,
  );
}

if (path.resolve(process.argv[1] || "") === path.resolve(SCRIPT_PATH)) {
  main();
}
