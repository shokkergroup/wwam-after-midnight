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
  "episode-guide-v2-topic-rebuild-batch1.js",
);
const GENERATED = "2026-07-30";
const PUBLIC_EXCERPT_WORD_LIMIT = 16;
const CUT_LENGTH_SECONDS = 24;

export const TOPIC_REBUILD_BATCH1_CONFIGS = Object.freeze([
  {
    id: "vjyNEQmgxC8",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "scary-video-watch-party",
    boundaryMode: "source-audio-boundary-unverified",
    cuts: [
      {
        at: 1,
        needle: "welcome back",
        label: "COLD OPEN // THE TAPE ROLLS",
        topic: "WWAM opening",
        classification: "format-cue",
        summary:
          "The opening caption text contains the WWAM welcome and the names Mike and Jay.",
      },
      {
        at: 2233,
        needle: "watch some scary",
        label: "WATCH-PARTY MISSION // SCARY SUBMISSIONS",
        topic: "Scary-video submissions",
        classification: "format-cue",
        summary:
          "The spoken setup says the show will watch viewer-sent scary clips, shorts, and TikToks.",
      },
      {
        at: 4287,
        needle: "hear the video",
        label: "PLAYBACK CHECK // CAN THE ROOM HEAR IT?",
        topic: "Playback setup",
        classification: "format-cue",
        summary:
          "The caption track records an audio check for both the live voices and the source video.",
      },
      {
        at: 4618,
        needle: "that was a good one",
        label: "FIRST CLEAN HIT // THE SCARE LANDS",
        topic: "Scary-video reaction",
        classification: "evaluation-candidate",
        summary:
          "An explicit spoken reaction calls the clip good and says its stillness is frightening.",
      },
      {
        at: 4839,
        needle: "jump scare",
        label: "JUMP-SCARE PANIC // EYES MOVED",
        topic: "Jump-scare reaction",
        classification: "comedy-candidate",
        summary:
          "A profane jump-scare reaction escalates into rapid warnings about the face and eyes.",
      },
      {
        at: 5527,
        needle: "creepy",
        label: "CEREBRAL CREEP // IP ADDRESS HAUNTED",
        topic: "Creepy-video reaction",
        classification: "evaluation-candidate",
        summary:
          "Explicit spoken wording calls the clip deeply creepy and scary on a cerebral level.",
      },
      {
        at: 5785,
        needle: "funny as",
        label: "INDIAN THRILLER DETOUR // FUNNY AS HELL",
        topic: "Indian Thriller",
        classification: "comedy-candidate",
        summary:
          "A comedy candidate explicitly calls the Indian Thriller detour extremely funny.",
      },
      {
        at: 6647,
        needle: "scary",
        label: "NUKE'S TOP FIVE // SMALL-SCREEN FEAR",
        topic: "Haunted-house clips",
        classification: "evaluation-candidate",
        summary:
          "The spoken reaction calls the compilation scary before noting a small-screen playback limit.",
      },
      {
        at: 6721,
        needle: "scary because",
        label: "REAL-WORLD FEAR // THE WALLS ARE WORSE",
        topic: "Plausible intruder fear",
        classification: "evaluation-candidate",
        summary:
          "An explicit assessment says the human-in-the-walls idea is scary because it can happen.",
      },
      {
        at: 6808,
        needle: "next one comes",
        label: "SUBMISSION HANDOFF // MICHAEL PARTON",
        topic: "Viewer submission",
        classification: "topic-door",
        summary:
          "The caption text introduces the next viewer submission and says it is a movie excerpt in short form.",
      },
      {
        at: 7595,
        needle: "well made",
        label: "HORROR SHORT HEAT // BETTER THAN BELIEVER",
        topic: "Horror short",
        classification: "evaluation-candidate",
        summary:
          "An explicit reaction calls the short well made and favorably compares it with The Exorcist: Believer.",
      },
      {
        at: 7725,
        needle: "that was a good",
        label: "SHORT-FILM VERDICT // REALLY GOOD",
        topic: "Horror short",
        classification: "evaluation-candidate",
        summary:
          "The caption track records repeated praise before discussing the budget limits of horror-short payoffs.",
      },
      {
        at: 8338,
        needle: "Halloween",
        label: "CHRISTMAS RAFTER HORROR // HOLIDAY DETOUR",
        topic: "Halloween decorations",
        classification: "comedy-candidate",
        summary:
          "A holiday-store joke says hanging Christmas figures felt scarier than the Halloween decorations.",
      },
      {
        at: 9214,
        needle: "wasn't that super scary",
        label: "SALEM'S LOT BUTTON // LIKED, NOT TERRIFIED",
        topic: "Vampire short",
        classification: "evaluation-candidate",
        summary:
          "The spoken verdict says the short was not especially scary but was still liked a lot.",
      },
      {
        at: 10300,
        needle: "20",
        label: "CREATOR SALUTE // SHORTS OVER HOLLYWOOD",
        topic: "Independent horror shorts",
        classification: "evaluation-candidate",
        summary:
          "The closing assessment praises short-form creators and compares their scares favorably with studio horror.",
      },
    ],
  },
  {
    id: "Lllp-P-euww",
    artifact: "public/demo/archive-completion.js",
    global: "WWAM_ARCHIVE_COMPLETION",
    format: "movie-commentary",
    boundaryMode: "source-audio-boundary-unverified",
    cuts: [
      {
        at: 125,
        needle: "remake",
        label: "PRE-SHOW WIRE // WHO VOICES CHUCKY?",
        topic: "Child's Play remake",
        classification: "format-cue",
        summary:
          "The pre-commentary setup opens on news about the remake and its Chucky voice casting.",
      },
      {
        at: 152,
        needle: "love Mark Hamill",
        label: "HAMILL VS DOURIF // THE VOICE QUESTION",
        topic: "Chucky voice casting",
        classification: "evaluation-candidate",
        summary:
          "Explicit spoken praise for Mark Hamill is paired with the view that Brad Dourif is Chucky.",
      },
      {
        at: 271,
        needle: "still hate",
        label: "REMAKE LEDGER // OPEN MIND, BAD BLOOD",
        topic: "Child's Play remake",
        classification: "evaluation-candidate",
        summary:
          "The spoken position criticizes how the remake was handled while promising to judge the finished movie fairly.",
      },
      {
        at: 302,
        needle: "Mark Hamill",
        label: "HAMILL UPSIDE // GREAT NEWS",
        topic: "Mark Hamill",
        classification: "evaluation-candidate",
        summary:
          "The caption track calls Mark Hamill voicing Chucky great news and expresses interest in the result.",
      },
      {
        at: 864,
        needle: "did you start",
        label: "PRIME SYNC // CLEAR THE AD",
        topic: "Commentary synchronization",
        classification: "format-cue",
        summary:
          "The spoken instructions tell Amazon Prime viewers to clear the ad and pause for synchronization.",
      },
      {
        at: 964,
        needle: "press play",
        label: "PRESS PLAY // THE MOVIE BEGINS",
        topic: "Commentary synchronization",
        classification: "format-cue",
        summary:
          "The countdown defines the play command and then explicitly announces that the movie has begun.",
      },
      {
        at: 1176,
        needle: "only time",
        label: "FRANCHISE NOTE // HUMAN CHUCKY",
        topic: "Chucky franchise",
        classification: "topic-door",
        summary:
          "The caption text discusses the first film as the franchise's human-Chucky appearance and mentions the TV series.",
      },
      {
        at: 1784,
        needle: "Chucky looks",
        label: "GARBAGE-PAIL CHUCKY // CHAT BUTTON",
        topic: "Chucky",
        classification: "comedy-candidate",
        summary:
          "A chat-fed comedy candidate compares Chucky with a Garbage Pail Kid and receives immediate agreement.",
      },
      {
        at: 2142,
        needle: "Chucky",
        label: "TIMELINE DOOR // CHUCKY IS MOVING",
        topic: "Chucky",
        classification: "topic-door",
        summary:
          "The commentary timeline names the babysitter passage and says Chucky is moving at this point.",
      },
      {
        at: 2684,
        needle: "expensive",
        label: "MERCH DETOUR // FOUR-HUNDRED-DOLLAR DOLL",
        topic: "Chucky merchandise",
        classification: "evaluation-candidate",
        summary:
          "A merchandise aside expresses sticker shock at replica Chucky dolls costing about four hundred dollars.",
      },
      {
        at: 3622,
        needle: "that's scary",
        label: "SCARE RECEIPT // UNDER-THE-COUCH PANIC",
        topic: "Scary commentary reaction",
        classification: "evaluation-candidate",
        summary:
          "An explicit spoken reaction calls the moment scary and says the jump is unwelcome.",
      },
      {
        at: 3902,
        needle: "give the remake a",
        label: "REMAKE POSITION // SECOND-BEST OPTION",
        topic: "Child's Play remake",
        classification: "evaluation-candidate",
        summary:
          "The remake position is restated: give it a chance, with Hamill described as the next-best voice option.",
      },
      {
        at: 4239,
        needle: "good Brad",
        label: "DOURIF RECEIPT // VOICE PRAISE",
        topic: "Brad Dourif",
        classification: "evaluation-candidate",
        summary:
          "The caption track explicitly praises the Brad Dourif voicing at this point in the commentary.",
      },
      {
        at: 4281,
        needle: "actually scary",
        label: "KNIFE-SHOT REACTION // ACTUALLY SCARY",
        topic: "Scary commentary reaction",
        classification: "evaluation-candidate",
        summary:
          "The spoken reaction twice calls the current commentary moment scary.",
      },
      {
        at: 6067,
        needle: "play is over",
        label: "POST-FILM BUTTON // ONE IN THE BOOKS",
        topic: "Commentary close",
        classification: "format-cue",
        summary:
          "The caption track announces that Child's Play is over, calls it in the books, and pivots to sequels.",
      },
    ],
  },
  {
    id: "nv99WEtXGvE",
    artifact: "public/demo/archive-deep-batch3.js",
    global: "WWAM_ARCHIVE_DEEP_BATCH3",
    format: "death-scene-tier-ranking",
    boundaryMode: "film-clip-audio-boundary-unverified",
    cuts: [
      {
        at: 1371,
        needle: "Freddy's Death",
        label: "TIER-LIST MISSION // EVERY FREDDY DEATH",
        topic: "Ranking premise",
        classification: "format-cue",
        summary:
          "The spoken setup says Freddy's death scenes will be sampled and tier-list ranked.",
      },
      {
        at: 4059,
        needle: "rank our tier list",
        label: "DEATH-REEL START // COPYRIGHT-SAFE SAMPLES",
        topic: "Ranking playback",
        classification: "format-cue",
        summary:
          "The ranking begins with a plan to sample each death briefly while avoiding long copyrighted playback.",
      },
      {
        at: 4097,
        needle: "garbage",
        label: "ELM STREET 1 // THE ENDING GETS BURIED",
        topic: "A Nightmare on Elm Street",
        classification: "evaluation-candidate",
        summary:
          "An explicit spoken verdict calls the first film's Freddy ending garbage and questions its execution.",
      },
      {
        at: 4283,
        needle: "shitty",
        label: "ELM STREET 1 // STRAIGHT TO STEVE",
        topic: "A Nightmare on Elm Street",
        classification: "evaluation-candidate",
        summary:
          "The ending is explicitly sent to Steve's lane despite strong affection for the movie itself.",
      },
      {
        at: 4554,
        needle: "visceral",
        label: "FREDDY'S REVENGE // VISCERAL UPGRADE",
        topic: "A Nightmare on Elm Street 2",
        classification: "evaluation-candidate",
        summary:
          "The spoken assessment favors this death over the first because it feels tangible and visceral.",
      },
      {
        at: 4894,
        needle: "Freddy's Revenge",
        label: "FREDDY'S REVENGE // CHAT VOTE",
        topic: "A Nightmare on Elm Street 2",
        classification: "topic-door",
        summary:
          "The caption track states a 59% 'pretty rad' vote result for Freddy's Revenge.",
      },
      {
        at: 4969,
        needle: "nightmare four",
        label: "DREAM MASTER // THE REAPPRAISAL",
        topic: "A Nightmare on Elm Street 4",
        classification: "evaluation-candidate",
        summary:
          "The spoken take says Nightmare 4 gains respect over time and is stronger than Nightmare 5.",
      },
      {
        at: 6468,
        needle: "nightmare 4",
        label: "MID-BOARD CHECK // DREAM MASTER LEADS",
        topic: "Ranking board",
        classification: "topic-door",
        summary:
          "The spoken board check calls Nightmare 4 the highest-ranked ending so far and names the other buckets.",
      },
      {
        at: 6557,
        needle: "company like",
        label: "FREDDY'S DEAD // MORTGAGE-COMMERCIAL ROAST",
        topic: "Freddy's Dead",
        classification: "comedy-candidate",
        summary:
          "A comedy candidate compares the ending to a cheesy mortgage-company or injury-lawyer advertisement.",
      },
      {
        at: 6725,
        needle: "Freddy Krueger",
        label: "FREDDY'S DEAD // MTV AUTOPSY",
        topic: "Freddy's Dead",
        classification: "evaluation-candidate",
        summary:
          "The spoken critique says mainstream treatment had turned Freddy into a complete joke by the sixth film.",
      },
      {
        at: 7146,
        needle: "Freddy's Burning",
        label: "NEW NIGHTMARE // FROZEN-PIZZA BUTTON",
        topic: "Wes Craven's New Nightmare",
        classification: "comedy-candidate",
        summary:
          "A joke candidate compares the spoken Freddy-burning passage with drunkenly making a frozen pizza.",
      },
      {
        at: 7270,
        needle: "Practical effects",
        label: "NEW NIGHTMARE // PRACTICAL-EFFECTS READ",
        topic: "Wes Craven's New Nightmare",
        classification: "evaluation-candidate",
        summary:
          "The spoken assessment praises the practical effects as gross and proposes a 'pretty rad' placement.",
      },
      {
        at: 7747,
        needle: "forgot to put",
        label: "NEW NIGHTMARE // CHAT RESULT",
        topic: "Wes Craven's New Nightmare",
        classification: "topic-door",
        summary:
          "The caption track recalls the missing board entry and states a 61% 'pretty rad' vote.",
      },
      {
        at: 8498,
        needle: "sucks my butt",
        label: "REMAKE // STRAIGHT TO STEVE",
        topic: "A Nightmare on Elm Street remake",
        classification: "evaluation-candidate",
        summary:
          "The caption track proposes a vote between an unrendered profane tier and Steve's lane.",
      },
      {
        at: 10195,
        needle: "Freddy vers Jason",
        label: "FINAL CANON CHECK // FREDDY VS JASON",
        topic: "Freddy vs. Jason",
        classification: "format-cue",
        summary:
          "A late board check asks where Freddy vs. Jason landed and settles on 'pretty rad' for the current canon.",
      },
    ],
  },
  {
    id: "uA5lTCjk7sQ",
    artifact: "public/demo/year-canon-2025-2026.js",
    global: "WWAM_YEAR_CANON_2025_2026",
    format: "trailer-reaction",
    boundaryMode: "source-audio-boundary-unverified",
    cuts: [
      {
        at: 1592,
        needle: "haven't watched",
        label: "TRAILER APPOINTMENT // ONE-HOUR MARK",
        topic: "Superman trailer",
        classification: "format-cue",
        summary:
          "The spoken setup schedules the Superman trailer for the one-hour mark and says it has not yet been watched.",
      },
      {
        at: 3602,
        needle: "watch",
        label: "PLAYBACK START // SUPERMAN",
        topic: "Superman trailer",
        classification: "format-cue",
        summary:
          "The caption track explicitly starts the trailer segment and names Superman.",
      },
      {
        at: 3673,
        needle: "going to do great",
        label: "BASELINE LEDGER // GOOD, CORNY, UNEVEN",
        topic: "Earlier Superman trailer",
        classification: "evaluation-candidate",
        summary:
          "The prior-trailer baseline names good and corny material and gives a sharply split effects estimate.",
      },
      {
        at: 3930,
        needle: "score hits",
        label: "FIRST REACTION // THE SCORE HITS",
        topic: "Superman trailer reaction",
        classification: "evaluation-candidate",
        summary:
          "The immediate spoken reaction praises the score and says the trailer was liked.",
      },
      {
        at: 3954,
        needle: "Lois",
        label: "LEX READ // THREAT, NOT PERSON",
        topic: "Lex Luthor",
        classification: "evaluation-candidate",
        summary:
          "The spoken reaction calls the trailer incredible and discusses Lex treating Superman as a threat.",
      },
      {
        at: 4041,
        needle: "other than that",
        label: "SPLIT VERDICT // STORY LOVE, EFFECTS FEAR",
        topic: "Superman trailer reaction",
        classification: "evaluation-candidate",
        summary:
          "The spoken ledger likes Lois and the family material while criticizing multiple effects shots.",
      },
      {
        at: 4087,
        needle: "looks like a",
        label: "TEMPERATURE CHECK // SOLID, NOT MIND-BLOWING",
        topic: "Superman trailer reaction",
        classification: "evaluation-candidate",
        summary:
          "An explicit assessment calls the movie solid and likely good without calling it mind-blowing.",
      },
      {
        at: 4158,
        needle: "cut pictures",
        label: "EFFECTS COURT // MAGAZINE CUTOUTS",
        topic: "Superman effects discussion",
        classification: "comedy-candidate",
        summary:
          "A visual-effects joke candidate compares the spoken impression to magazine cutouts.",
      },
      {
        at: 4200,
        needle: "dog looks",
        label: "KRYPTO ROAST // MOBY COMEBACK",
        topic: "Krypto and Lex Luthor",
        classification: "comedy-candidate",
        summary:
          "A comedy candidate pivots from a harsh dog-effects remark to Andrew Tate and Moby comparisons.",
      },
      {
        at: 4642,
        needle: "convincing",
        label: "CORENSWET LEDGER // ACTOR UP, EFFECTS DOWN",
        topic: "David Corenswet",
        classification: "evaluation-candidate",
        summary:
          "The spoken assessment finds Corenswet convincing while flagging too many villains and weak effects.",
      },
      {
        at: 4686,
        needle: "still good",
        label: "EXPECTATION MOVE // MORE EXCITED NOW",
        topic: "Superman expectations",
        classification: "evaluation-candidate",
        summary:
          "The caption track records increased interest in seeing the movie after the trailer.",
      },
      {
        at: 4793,
        needle: "trailer but",
        label: "STORY VS GRAPHICS // THE DIVIDED CARD",
        topic: "Superman trailer reaction",
        classification: "evaluation-candidate",
        summary:
          "The spoken wrap-up calls the story snippets good while remaining disappointed in the graphics.",
      },
      {
        at: 5855,
        needle: "more Lois Lane",
        label: "LOIS LANE FILE // BROSNAHAN VS ADAMS",
        topic: "Lois Lane casting",
        classification: "evaluation-candidate",
        summary:
          "An explicit casting take says Rachel Brosnahan reads as more Lois Lane than Amy Adams.",
      },
      {
        at: 5928,
        needle: "story is going",
        label: "EXPECTATION CHECK // STORY CONFIDENCE",
        topic: "Superman expectations",
        classification: "evaluation-candidate",
        summary:
          "The later expectation check predicts a good story and says confidence has increased.",
      },
      {
        at: 6764,
        needle: "Superman and The Flash",
        label: "CRAFT LOOKUP // SHARED PHOTOGRAPHY CREDIT",
        topic: "Superman cinematography",
        classification: "topic-door",
        summary:
          "The spoken lookup identifies one director of photography for both Superman and The Flash.",
      },
    ],
  },
  {
    id: "5T1wWUjCGWk",
    artifact: "public/demo/archive-deep-distill.js",
    global: "WWAM_ARCHIVE_DEEP",
    format: "script-reading",
    boundaryMode: "script-origin-boundary-unverified",
    cuts: [
      {
        at: 31,
        needle: "reading the Halloween",
        label: "NIGHT'S MISSION // HALLOWEEN 4 SCRIPT",
        topic: "Halloween 4 script reading",
        classification: "format-cue",
        summary:
          "The opening caption text explicitly announces a Halloween 4 script reading.",
      },
      {
        at: 491,
        needle: "worst",
        label: "CASTING RULES // TINY PARTS GO WILD",
        topic: "Script-reading format",
        classification: "comedy-candidate",
        summary:
          "The setup says unassigned small parts can be read in any voice and jokes about amateur search history.",
      },
      {
        at: 580,
        needle: "Halloween 4",
        label: "NARRATOR BUTTON // CHRISTOPHER NOLAN",
        topic: "Script-reading performance",
        classification: "comedy-candidate",
        summary:
          "A performance joke introduces the reading through a Christopher Nolan narrator voice.",
      },
      {
        at: 602,
        needle: "return of Michael Myers",
        label: "SCRIPT DOOR // THE RETURN OF MICHAEL MYERS",
        topic: "Script opening",
        classification: "topic-door",
        summary:
          "The spoken script text states the subtitle and opens on October 30, 1988.",
      },
      {
        at: 744,
        needle: "riveting",
        label: "EARLY READ // RIVETING, GUYS",
        topic: "Opening script pages",
        classification: "comedy-candidate",
        summary:
          "A dry comedy candidate calls the early reading riveting before the performance continues.",
      },
      {
        at: 1102,
        needle: "it's good",
        label: "VOICE CHECK // GOOD, THEN A TRANSFER RANT",
        topic: "Script-reading performance",
        classification: "evaluation-candidate",
        summary:
          "The spoken voice check is positive before the discussion questions Michael's Halloween transfer.",
      },
      {
        at: 1551,
        needle: "Rob Zombie",
        label: "ALT-CUT JOKE // ROB ZOMBIE OVERLAY",
        topic: "Rob Zombie's Halloween",
        classification: "comedy-candidate",
        summary:
          "A comedy candidate says the improvised character voices would fit a Rob Zombie Halloween script.",
      },
      {
        at: 1754,
        needle: "what is this movie",
        label: "DIRECTOR'S-BUTT CUT // WHAT MOVIE IS THIS?",
        topic: "Improvised script additions",
        classification: "comedy-candidate",
        summary:
          "The growing improvisation triggers a joke asking whether this is a special Rob Zombie edition.",
      },
      {
        at: 2263,
        needle: "added that line",
        label: "ADDED-LINE RECEIPT // MORE CINEMATIC",
        topic: "Improvised dialogue",
        classification: "comedy-candidate",
        summary:
          "The caption track admits an added Loomis line and says it sounded more cinematic.",
      },
      {
        at: 3827,
        needle: "good time",
        label: "HALFWAY CHECK // READING RAINBOW",
        topic: "Script-reading progress",
        classification: "format-cue",
        summary:
          "A midpoint check says the reading is around page 31 of 65 and compares the workload to Reading Rainbow.",
      },
      {
        at: 5606,
        needle: "perfect for Stone Cold",
        label: "STONE COLD CASTING // PERFECT LINE",
        topic: "Stone Cold performance",
        classification: "evaluation-candidate",
        summary:
          "An explicit performance reaction calls the emergency-radio line perfect for the Stone Cold voice.",
      },
      {
        at: 6215,
        needle: "love Rachel",
        label: "RACHEL WORKLOAD // THREE PAGES OF SCREAMING",
        topic: "Rachel dialogue",
        classification: "comedy-candidate",
        summary:
          "A comedy candidate says Rachel spends much of the script screaming and compares it with Poltergeist 3.",
      },
      {
        at: 7089,
        needle: "read the script",
        label: "POST-READ CLOCK // UNDER TWO HOURS",
        topic: "Script-reading close",
        classification: "evaluation-candidate",
        summary:
          "The post-read discussion expresses surprise that the script was completed in under two hours.",
      },
      {
        at: 7134,
        needle: "end of that movie",
        label: "SCRIPT AUTOPSY // JAMIE, MICHAEL, JAMIE",
        topic: "Halloween 4 script structure",
        classification: "comedy-candidate",
        summary:
          "The postmortem jokes that the back end of the script becomes people repeatedly yelling names.",
      },
      {
        at: 8321,
        needle: "Loomis",
        label: "CHARACTER AFTERSHOW // LOOMIS HIRES SLENDERMAN",
        topic: "Loomis and Slenderman",
        classification: "comedy-candidate",
        summary:
          "A late character-bit candidate asks Loomis to interview Slenderman for a Subway job.",
      },
    ],
  },
]);

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u201c\u201d]/g, "\"")
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
      throw new Error(`${config.id} is missing required evidence file ${filePath}.`);
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
    throw new Error(`${config.id} metadata and canonical source identity diverged.`);
  }
  if (
    !/[?&]kind=asr(?:&|$)/.test(clean(metadata.caption_url)) ||
    !/[?&]lang=en(?:&|$)/.test(clean(metadata.caption_url))
  ) {
    throw new Error(`${config.id} no longer proves an English automatic-caption track.`);
  }
  if (
    source.rightsPolicy?.restrictedToTopicNavigation !== true ||
    source.rightsPolicy?.mode !== config.boundaryMode
  ) {
    throw new Error(`${config.id} rights boundary changed; rebuild requires re-audit.`);
  }
  if (lines.length < 500 || lines.at(-1).at < duration * 0.8) {
    throw new Error(`${config.id} caption cache is too thin for this rebuild.`);
  }

  return {
    source,
    artifactRaw,
    captionRaw,
    metadataRaw,
    metadata,
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
      id: `topic-rebuild-b1-${config.id}-${String(index + 1).padStart(2, "0")}-${anchor.at}`,
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
        placementStatus:
          config.format === "death-scene-tier-ranking"
            ? "spoken-only-not-board-verified"
            : "not-applicable",
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
      throw new Error(`${config.id} cut specifications are not strictly chronological.`);
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
    variant: "topic-rebuild-batch1-unreviewed",
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
      "Spoken ranking language is not independent verification of an on-screen board.",
      "No visual event, scene detail, or reaction target is inferred beyond the words on the caption track.",
      "Every evaluation or comedy label is a machine-surfaced candidate pending exact-source human review.",
      "Promotion is disabled.",
    ],
    runtimeCoverage: {
      firstAt,
      lastEnd,
      firstPercent: Number((firstAt / duration * 100).toFixed(2)),
      lastPercent: Number((lastEnd / duration * 100).toFixed(2)),
      spanPercent: Number(((lastEnd - firstAt) / duration * 100).toFixed(2)),
    },
    classificationCounts: counts,
    cuts,
    reviewChecklist: [
      "Play every proposed in/out point against the exact official upload.",
      "Confirm whether the words come from WWAM, embedded media, a script reading, or another source.",
      "Set speaker and performer only after human verification.",
      "Verify any spoken tier result against the actual board before publishing it as placement.",
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

export function buildTopicRebuildBatch1({ rootDir = PROJECT_ROOT } = {}) {
  const guides = TOPIC_REBUILD_BATCH1_CONFIGS.map((config) => {
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
    schema: "wwam-episode-guide-v2-topic-rebuild-batch1/v1",
    generated: GENERATED,
    selection: {
      ids: TOPIC_REBUILD_BATCH1_CONFIGS.map((config) => config.id),
      count: TOPIC_REBUILD_BATCH1_CONFIGS.length,
      reason:
        "Five thin rights-restricted topic recaps selected for a source-evidence-first rebuild shard.",
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
      generator: "scripts/generate-episode-guide-v2-topic-rebuild-batch1.mjs",
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

export function renderTopicRebuildBatch1(payload) {
  return `window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH1 = ${JSON.stringify(payload)};\n`;
}

function main() {
  const payload = buildTopicRebuildBatch1();
  fs.writeFileSync(OUTPUT_PATH, renderTopicRebuildBatch1(payload));
  process.stdout.write(
    `Wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)} with ${payload.meta.guides} guides and ${payload.meta.cuts} cuts.\n`,
  );
}

if (path.resolve(process.argv[1] || "") === path.resolve(SCRIPT_PATH)) {
  main();
}
