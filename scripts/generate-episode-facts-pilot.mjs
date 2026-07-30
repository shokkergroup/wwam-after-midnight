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
  "episode-facts-pilot.js",
);
const GENERATED = "2026-07-30";
const EXCERPT_WORD_LIMIT = 16;
const EVIDENCE_TYPE = "youtube-automatic-caption";
const REVIEW_STATE = "machine-surfaced-needs-editor-review";

const TARGETS = Object.freeze([
  {
    id: "_PiftDXSf8k",
    format: "ranking-list",
    specificKey: "rankingEvents",
    topics: [
      ["Mafia films", ["mafia", "mob movie", "mob film"]],
      ["Mount Rushmore", ["mount rushmore"]],
      ["The Godfather", ["godfather", "michael corleone"]],
      ["Goodfellas", ["goodfellas", "henry hill"]],
      ["Casino", ["casino"]],
      ["Scarface", ["scarface", "tony montana"]],
    ],
  },
  {
    id: "ooLNfFkpH6M",
    format: "ranking-list",
    specificKey: "rankingEvents",
    topics: [
      ["Tier list", ["tier list", "alltime", "pretty rad"]],
      ["Scream", ["scream", "ghostface"]],
      ["Saw", ["saw franchise", "sa franchise"]],
      ["Child's Play", ["child's play", "chucky"]],
      ["Halloween", ["halloween", "michael myers"]],
      ["Final Destination", ["final destination"]],
    ],
  },
  {
    id: "QMYgsEfPMg0",
    format: "ranking-list",
    specificKey: "rankingEvents",
    topics: [
      ["Christmas tier list", ["christmas movies", "christmas movie", "tier list"]],
      ["Home Alone", ["home alone"]],
      ["The Grinch", ["the grinch", "grinch stole christmas"]],
      ["Christmas Vacation", ["christmas vacation"]],
      ["Gremlins", ["gremlins"]],
      ["Die Hard", ["die hard"]],
    ],
  },
  {
    id: "cQAVmNFQmoI",
    format: "parallel-ranking",
    specificKey: "rankingEvents",
    topics: [
      ["Ranking", ["start ranking", "my number"]],
      ["Alien", ["alien", "xenomorph"]],
      ["Predator", ["predator"]],
      ["RoboCop", ["robocop", "robo cop"]],
      ["Terminator", ["terminator", "t2"]],
    ],
  },
  {
    id: "fUCQoxTwKqo",
    format: "question-and-answer",
    specificKey: "questionAnswerPairs",
    topics: [
      ["Halloween", ["halloween", "michael myers", "loomis"]],
      ["A24", ["a24", "824"]],
      ["Heels", ["heels", "hills"]],
      ["Atmosphere", ["atmosphere", "shadows", "suspenseful"]],
      ["Candy", ["twix", "snickers"]],
    ],
  },
  {
    id: "xVUR68diEHQ",
    format: "question-and-answer",
    specificKey: "questionAnswerPairs",
    topics: [
      ["YouTube advice", ["youtube channel", "starting my youtube"]],
      ["Halloween", ["halloween", "michael myers"]],
      ["Scream", ["scream"]],
      ["Shared horror universe", ["crossover", "crystal", "elm street"]],
      ["Channel milestone", ["90k", "90,000", "subscribers"]],
    ],
  },
  {
    id: "-k3YduzBoGs",
    format: "review-and-qa",
    specificKey: "questionAnswerPairs",
    topics: [
      ["Halloween 2018", ["halloween 2018", "halloween"]],
      ["Michael Myers", ["michael myers", "michael mars"]],
      ["Dr. Loomis", ["loomis", "lumis"]],
      ["Pet Sematary", ["pet sematary", "pet cemetery"]],
      ["Q&A", ["answer some questions", "question"]],
    ],
  },
  {
    id: "uoxOvi0J5zQ",
    format: "news-agenda",
    specificKey: "agendaItems",
    topics: [
      ["The Flash", ["the flash", "flash trailer"]],
      ["Alien Day", ["alien day", "alien movie"]],
      ["Trailers", ["trailer"]],
      ["Blue Beetle", ["blue beetle"]],
      ["Evil Dead", ["evil dead"]],
    ],
  },
  {
    id: "wW9bdu_GtgQ",
    format: "news-agenda",
    specificKey: "agendaItems",
    topics: [
      ["Insidious: The Red Door", ["insidious", "red door"]],
      ["Scream news", ["scream news", "scream 3"]],
      ["Evil Dead Rise", ["evil dead rise", "evil dead rises"]],
      ["Trailer reaction", ["watch the trailer", "trailer"]],
    ],
  },
  {
    id: "Ppb0cXyB3rk",
    format: "trailer-breakdown",
    specificKey: "agendaItems",
    topics: [
      ["Scream", ["scream", "ghostface"]],
      ["Fan theory", ["theory"]],
      ["Final trailer", ["trailer"]],
      ["Box office", ["box office"]],
      ["Streaming aftertalk", ["streaming"]],
    ],
  },
  {
    id: "5T1wWUjCGWk",
    format: "script-reading",
    specificKey: "scriptSceneCues",
    topics: [
      ["Halloween 4", ["halloween 4", "return of michael myers"]],
      ["Script", ["script", "66-page"]],
      ["Scene directions", ["exterior", "interior", "cut to", "scene switches"]],
      ["Michael Myers", ["michael myers", "michael"]],
      ["Jamie and Rachel", ["jamie", "rachel"]],
      ["Dr. Loomis", ["loomis"]],
    ],
  },
  {
    id: "3Lu5KPrQhc8",
    format: "watchalong-commentary",
    specificKey: "syncCues",
    topics: [
      ["Bride of Chucky", ["bride of chucky"]],
      ["Chucky", ["chucky"]],
      ["Tiffany", ["tiffany"]],
      ["Playback sync", ["press play", "sync up", "count it down"]],
    ],
  },
]);

const REQUIRED_ANCHORS = Object.freeze({
  _PiftDXSf8k: [
    [543, "Mount Rushmore right not the characters", 8],
    [1886, "casino up there for my third", 8],
    [2528, "for my fourth one", 8],
    [2534, "put Scarface up there", 8],
    [4107, "Mount Rushmore of mob characters", 8],
    [4168, "Michael Corleone up there", 8],
  ],
  ooLNfFkpH6M: [
    [4360, "get to the tier list", 8],
    [4809, "it in an alltime", 8],
    [4891, "I put it at", 8],
    [4893, "pretty rad", 8],
    [5358, "going to be in", 8],
    [5359, "pretty rad", 8],
    [5432, "Child's Play is pretty rad", 8],
    [8001, "about Halloween", 8],
    [8002, "it in alltime", 8],
    [9744, "Final Destination franchise goes", 10],
    [9759, "almost touches the sun", 10],
  ],
  QMYgsEfPMg0: [
    [1032, "news before we get into the tier list", 8],
    [2092, "tier listwise Christmas movies", 8],
    [2675, "do we even have to discuss Home", 10],
    [2678, "alltimer business", 10],
    [2681, "I like Home Alone 2", 10],
    [3684, "Jim Car's The Grinch", 10],
    [3697, "the Grinch Stole Christmas", 10],
  ],
  cQAVmNFQmoI: [
    [3627, "start ranking these", 8],
    [8917, "covenant's my number nine", 8],
    [9159, "number eight is going to be predator", 8],
    [9604, "Robo cop two is my number seven", 8],
    [9770, "number five is going to be a predator", 8],
    [9960, "number four is going to be alien", 8],
    [10047, "number four is going to be Terminator", 8],
    [10166, "number three is going to be Robo cop", 8],
    [10414, "number two is actually Terminator", 8],
    [10559, "number two is Predator", 8],
    [10566, "number one will be T2", 8],
  ],
  fUCQoxTwKqo: [
    [582, "good question", 10],
    [584, "starting Hills now that it's canceled", 10],
    [586, "would still watch it", 10],
    [587, "wrestling fan I'd watch it", 10],
    [592, "mad about How It Ends", 10],
    [917, "your face aggressive", 12],
    [930, "concentrate more on the atmosphere", 12],
    [933, "the shadows and the filming", 12],
    [961, "make it suspenseful", 12],
    [2600, "very important question", 8],
    [2601, "Twix or Snickers", 8],
    [2615, "Snickers twits are just boring", 10],
  ],
  xVUR68diEHQ: [
    [823, "advice for me starting my", 8],
    [841, "what do you love the absolute", 8],
    [856, "tiny little niche thing", 10],
    [5070, "thoughts on having the end", 8],
    [5089, "scream okay so if you're gonna take", 10],
    [5097, "scream universe crossover", 10],
    [5115, "Crystal Light mentioned", 10],
    [5117, "see the Elm Street mention", 10],
  ],
  "-k3YduzBoGs": [
    [1796, "answer some questions", 8],
    [2687, "what do you think about the Pet Sematary", 8],
    [2703, "think it's gonna be really good", 10],
    [2713, "easily do with a remake", 10],
  ],
  uoxOvi0J5zQ: [
    [2447, "if the flash is successful", 15],
    [2558, "watch The Flash trailer", 8],
    [5856, "alien day", 15],
    [5873, "something called alien day", 15],
  ],
  wW9bdu_GtgQ: [
    [122, "watch the trailer", 8],
    [124, "insidious The Red Door", 8],
    [1889, "some scream news", 15],
    [1992, "Scream 3", 15],
    [2497, "updates on like Evil Dead rise", 15],
  ],
  Ppb0cXyB3rk: [
    [1164, "theory", 8],
    [1431, "watch this", 8],
    [1438, "break it down together", 8],
    [4152, "box office", 15],
    [4840, "movies are streaming", 15],
  ],
  "5T1wWUjCGWk": [
    [32, "4 script tonight", 8],
    [536, "66-page script", 8],
    [597, "reading of the script Halloween 4", 8],
    [602, "The return of Michael Myers", 8],
    [614, "Exterior", 8],
  ],
  "3Lu5KPrQhc8": [
    [344, "start Bride of Chucky", 8],
    [372, "Bride of Chucky in 321", 8],
    [378, "press play on Bride of Chucky", 8],
  ],
});

const FORMAT_FACT_CONFIG = Object.freeze({
  _PiftDXSf8k: {
    rankingEvents: [
      ["MOVIES, NOT CHARACTERS", 543, "Mount Rushmore right not the characters", { eventKind: "scope-rule" }],
      ["CASINO // THIRD", 1886, "casino up there for my third", { subject: "Casino", position: 3, sequenceLane: "single-caption-sequence" }],
      ["FOURTH PICK SETUP", 2528, "for my fourth one", { eventKind: "placement-setup" }],
      ["SCARFACE // FOURTH", 2534, "put Scarface up there", { subject: "Scarface", position: 4, sequenceLane: "single-caption-sequence", support: [[2528, "for my fourth one"]] }],
      ["CHARACTER LIST BEGINS", 4107, "Mount Rushmore of mob characters", { eventKind: "scope-transition" }],
      ["MICHAEL CORLEONE", 4168, "Michael Corleone up there", { subject: "Michael Corleone", sequenceLane: "character-caption-sequence" }],
    ],
  },
  ooLNfFkpH6M: {
    rankingEvents: [
      ["TIER LIST START", 4360, "get to the tier list", { eventKind: "ranking-start" }],
      ["SCREAM // ALLTIME", 4809, "it in an alltime", { subject: "Scream", placementLanguage: "alltime", support: [[4802, "I think Scream one"]] }],
      ["SAW // PRETTY RAD", 4893, "pretty rad", { subject: "Saw", placementLanguage: "pretty rad", support: [[4866, "sa franchise"]] }],
      ["CHILD'S PLAY // PRETTY RAD", 5359, "pretty rad", { subject: "Child's Play", placementLanguage: "pretty rad", support: [[5342, "child's play"]] }],
      ["CHUCKY PLACEMENT RESTATED", 5432, "Child's Play is pretty rad", { subject: "Child's Play", placementLanguage: "pretty rad", eventKind: "placement-restatement" }],
      ["HALLOWEEN // ALLTIME", 8002, "it in alltime", { subject: "Halloween", placementLanguage: "alltime", support: [[8001, "about Halloween"]] }],
      ["FINAL DESTINATION POLL", 9744, "Final Destination franchise goes", { subject: "Final Destination", eventKind: "captioned-poll-result-language", visualResultVerified: false, support: [[9746, "to pretty rad at 41"]] }],
      ["FINAL DESTINATION // ALMOST TOUCHES THE SUN", 9759, "almost touches the sun", { subject: "Final Destination", placementLanguage: "almost touches the sun", visualResultVerified: false, support: [[9764, "Final Destination"]] }],
    ],
  },
  QMYgsEfPMg0: {
    rankingEvents: [
      ["NEWS BEFORE THE LIST", 1032, "news before we get into the tier list", { eventKind: "agenda-transition" }],
      ["CHRISTMAS LIST START", 2092, "tier listwise Christmas movies", { eventKind: "ranking-start" }],
      ["HOME ALONE DEBATE OPENS", 2675, "do we even have to discuss Home", { subject: "Home Alone", eventKind: "placement-debate" }],
      ["HOME ALONE // ALLTIMER CUE", 2678, "alltimer business", { subject: "Home Alone", placementLanguage: "alltimer", support: [[2675, "do we even have to discuss Home"]] }],
      ["HOME ALONE 2 PREFERENCE CUE", 2681, "I like Home Alone 2", { subject: "Home Alone 2", eventKind: "captioned-preference-language" }],
      ["GRINCH PLACEMENT OPENS", 3684, "Jim Car's The Grinch", { subject: "The Grinch", eventKind: "placement-debate" }],
      ["GRINCH // ALMOST TOUCHES THE SUN", 3697, "the Grinch Stole Christmas", { subject: "The Grinch", placementLanguage: "almost touches the sun", support: [[3700, "put it at almost such as the"], [3702, "Sun I love it"]] }],
    ],
  },
  cQAVmNFQmoI: {
    rankingEvents: [
      ["RANKING START", 3627, "start ranking these", { eventKind: "ranking-start", parallelBallots: true }],
      ["ALIEN COVENANT // #9", 8917, "covenant's my number nine", { subject: "Alien: Covenant", position: 9, sequenceLane: "caption-ballot-a" }],
      ["PREDATOR 2 // #8", 9159, "number eight is going to be predator", { subject: "Predator 2", position: 8, sequenceLane: "caption-ballot-a" }],
      ["ROBOCOP 2 // #7", 9604, "Robo cop two is my number seven", { subject: "RoboCop 2", position: 7, sequenceLane: "caption-ballot-a" }],
      ["PREDATOR // #5", 9770, "number five is going to be a predator", { subject: "Predator", position: 5, sequenceLane: "caption-ballot-a" }],
      ["ALIEN // #4", 9960, "number four is going to be alien", { subject: "Alien", position: 4, sequenceLane: "caption-ballot-a" }],
      ["THE TERMINATOR // #4", 10047, "number four is going to be Terminator", { subject: "The Terminator", position: 4, sequenceLane: "caption-ballot-b" }],
      ["ROBOCOP // #3", 10166, "number three is going to be Robo cop", { subject: "RoboCop", position: 3, sequenceLane: "caption-ballot-a" }],
      ["TERMINATOR 2 // #2", 10414, "number two is actually Terminator", { subject: "Terminator 2", position: 2, sequenceLane: "caption-ballot-a" }],
      ["PREDATOR // #2", 10559, "number two is Predator", { subject: "Predator", position: 2, sequenceLane: "caption-ballot-b" }],
      ["TERMINATOR 2 // #1", 10566, "number one will be T2", { subject: "Terminator 2", position: 1, sequenceLane: "caption-ballot-b" }],
    ],
  },
  fUCQoxTwKqo: {
    questionAnswerPairs: [
      {
        label: "CANCELLED HEELS QUESTION",
        question: [582, "good question"],
        response: [587, "wrestling fan I'd watch it"],
        support: [
          [584, "starting Hills now that it's canceled"],
          [586, "would still watch it"],
          [592, "mad about How It Ends"],
        ],
        subject: "Heels",
      },
      {
        label: "TWIX OR SNICKERS",
        question: [2600, "very important question"],
        response: [2615, "Snickers twits are just boring"],
        support: [[2601, "Twix or Snickers"]],
        subject: "Candy",
      },
    ],
    localSeeds: [
      {
        label: "A24 / HALLOWEEN CRAFT RUN",
        at: 917,
        phrase: "your face aggressive",
        support: [
          [930, "concentrate more on the atmosphere"],
          [933, "the shadows and the filming"],
          [961, "make it suspenseful"],
        ],
        subject: "Halloween / A24",
      },
    ],
  },
  xVUR68diEHQ: {
    questionAnswerPairs: [
      {
        label: "STARTING A YOUTUBE CHANNEL",
        question: [823, "advice for me starting my"],
        response: [841, "what do you love the absolute"],
        support: [[856, "tiny little niche thing"]],
        subject: "YouTube advice",
      },
      {
        label: "SHARED HORROR UNIVERSE",
        question: [5070, "thoughts on having the end"],
        response: [5089, "scream okay so if you're gonna take"],
        support: [
          [5097, "scream universe crossover"],
          [5115, "Crystal Light mentioned"],
          [5117, "see the Elm Street mention"],
        ],
        subject: "Shared horror universe",
      },
    ],
  },
  "-k3YduzBoGs": {
    questionAnswerPairs: [
      {
        label: "PET SEMATARY TRAILER",
        question: [2687, "what do you think about the Pet Sematary"],
        response: [2703, "think it's gonna be really good"],
        support: [[2713, "easily do with a remake"]],
        subject: "Pet Sematary",
      },
    ],
    localSeeds: [
      {
        label: "REVIEW TO Q&A HANDOFF",
        at: 1796,
        phrase: "answer some questions",
        support: [],
        subject: "Q&A transition",
      },
    ],
  },
  uoxOvi0J5zQ: {
    agendaItems: [
      {
        label: "THE FLASH DISCUSSION DOOR",
        at: 2435,
        evidenceAt: 2447,
        phrase: "if the flash is successful",
        peakAt: 2447,
        subject: "The Flash",
      },
      {
        label: "THE FLASH TRAILER CUE",
        at: 2558,
        evidenceAt: 2558,
        phrase: "watch The Flash trailer",
        subject: "The Flash trailer",
      },
      {
        label: "ALIEN DAY DOOR",
        at: 5845,
        evidenceAt: 5856,
        phrase: "alien day",
        peakAt: 5857,
        support: [[5873, "something called alien day"]],
        subject: "Alien Day",
      },
    ],
  },
  wW9bdu_GtgQ: {
    agendaItems: [
      {
        label: "INSIDIOUS: THE RED DOOR",
        at: 122,
        evidenceAt: 124,
        phrase: "insidious The Red Door",
        support: [[122, "watch the trailer"]],
        subject: "Insidious: The Red Door",
      },
      {
        label: "SCREAM NEWS",
        at: 1878,
        evidenceAt: 1889,
        phrase: "some scream news",
        peakAt: 1992,
        support: [[1992, "Scream 3"]],
        subject: "Scream news",
      },
      {
        label: "EVIL DEAD RISE",
        at: 2485,
        evidenceAt: 2497,
        phrase: "updates on like Evil Dead rise",
        peakAt: 2497,
        subject: "Evil Dead Rise",
      },
    ],
  },
  Ppb0cXyB3rk: {
    agendaItems: [
      {
        label: "SCREAM THEORY BOARD",
        at: 1164,
        evidenceAt: 1164,
        phrase: "theory",
        subject: "Fan theory",
      },
      {
        label: "FINAL TRAILER BREAKDOWN",
        at: 1431,
        evidenceAt: 1431,
        phrase: "watch this",
        support: [[1438, "break it down together"]],
        subject: "Final trailer",
      },
      {
        label: "BOX-OFFICE AFTERTALK",
        at: 4152,
        evidenceAt: 4152,
        phrase: "box office",
        subject: "Box office",
      },
      {
        label: "STREAMING AFTERTALK",
        at: 4840,
        evidenceAt: 4840,
        phrase: "movies are streaming",
        subject: "Streaming",
      },
    ],
  },
  "5T1wWUjCGWk": {
    scriptSceneCues: [
      ["SCRIPT READING ANNOUNCED", 32, "4 script tonight", { cueKind: "show-setup" }],
      ["SCRIPT LENGTH", 536, "66-page script", { cueKind: "script-metadata-language", pageCountClaim: 66, originVerified: false }],
      ["READING START", 597, "reading of the script Halloween 4", { cueKind: "reading-start", originVerified: false }],
      ["TITLE / OPENING LINE", 602, "The return of Michael Myers", { cueKind: "captioned-title-line", originVerified: false }],
      ["EXTERIOR SCENE HEADER", 614, "Exterior", { cueKind: "captioned-scene-direction", visualSceneVerified: false, originVerified: false }],
    ],
  },
  "3Lu5KPrQhc8": {
    syncCues: [
      ["FEATURE START SETUP", 344, "start Bride of Chucky", { cueKind: "start-setup", playbackStateVerified: false }],
      ["COUNTDOWN", 372, "Bride of Chucky in 321", { cueKind: "countdown", playbackStateVerified: false }],
      ["PRESS PLAY", 378, "press play on Bride of Chucky", { cueKind: "play-press-language", playbackStateVerified: false }],
    ],
  },
});

function clean(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\[(?:\s*__\s*)\]/gi, "[BLEEP]")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'")
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
    .sort((left, right) => left.at - right.at || left.text.localeCompare(right.text));
}

function matchPhrase(line, phrase) {
  return normalized(line.text).includes(normalized(phrase));
}

function containsAlias(value, alias) {
  return ` ${normalized(value)} `.includes(` ${normalized(alias)} `);
}

export function resolveAnchor(lines, at, phrase, tolerance = 12) {
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
    throw new Error(
      `Required caption anchor drifted: ${at}s // "${phrase}"`,
    );
  }
  return matches[0];
}

function commonClaim(text) {
  return {
    text,
    kind: "caption-observation",
    scope: "source-local",
    rightsSafe: true,
    speakerClaim: false,
    performerClaim: false,
    visualResultClaim: false,
    intentClaim: false,
    originClaim: false,
    editorialVerdictClaim: false,
  };
}

function baseFact({
  id,
  type,
  line,
  phrase,
  claimText,
  confidence = "high",
  evidenceLines = [],
  details = {},
  at = line.at,
  end = line.end,
}) {
  const allEvidence = [line, ...evidenceLines]
    .filter(Boolean)
    .sort((left, right) => left.at - right.at || left.text.localeCompare(right.text));
  const evidencePayload = allEvidence.map((item) => ({
    at: item.at,
    end: item.end,
    text: item.text,
  }));
  return {
    id,
    type,
    at,
    end: Math.max(at + 1, end),
    excerpt: boundedExcerpt(line.text, phrase),
    evidenceHash: sha256(stableJson(evidencePayload)),
    evidenceType: EVIDENCE_TYPE,
    confidence,
    reviewState: REVIEW_STATE,
    speaker: null,
    claim: commonClaim(claimText),
    evidence: {
      anchorPhrase: clean(phrase),
      anchorAt: line.at,
      anchorEnd: line.end,
      excerptWordCount: wordTokens(boundedExcerpt(line.text, phrase)).length,
      fullCaptionPublic: false,
      speakerDiarized: false,
      promotionAllowed: false,
    },
    ...details,
  };
}

function nearestSubstantiveLine(lines, targetAt) {
  const eligible = lines.filter((line) => {
    const count = wordTokens(line.text).length;
    return count >= 6 && !/^\[(?:music|laughter|applause)\]$/i.test(line.text);
  });
  return eligible.reduce((best, line) => {
    if (!best) return line;
    return Math.abs(line.at - targetAt) < Math.abs(best.at - targetAt)
      ? line
      : best;
  }, null);
}

function buildPhaseBoundaries(source, lines) {
  const phases = [
    ["OPENING TAPE", 0.02],
    ["FIRST THIRD", 0.33],
    ["SECOND THIRD", 0.66],
    ["CLOSING TAPE", 0.96],
  ];
  return phases.map(([label, ratio], index) => {
    const targetAt = Math.floor(source.duration * ratio);
    const line = nearestSubstantiveLine(lines, targetAt);
    return baseFact({
      id: `${source.id}:phase:${String(index + 1).padStart(2, "0")}`,
      type: "phaseBoundary",
      line,
      phrase: wordTokens(line.text).slice(0, 3).join(" "),
      claimText: `${label} is the automatic-caption event nearest the ${Math.round(
        ratio * 100,
      )}% runtime boundary; it is a navigation boundary, not an inferred story beat.`,
      details: {
        label,
        targetAt,
        boundaryBasis: "runtime-quantile-nearest-substantive-caption",
        storyBeatClaimed: false,
      },
    });
  });
}

function topicMatches(lines, aliases) {
  return lines.filter((line) =>
    aliases.some((alias) => containsAlias(line.text, alias)),
  );
}

function clusterTopicLines(matches) {
  const clusters = [];
  for (const line of matches) {
    const current = clusters.at(-1);
    if (
      !current ||
      line.at - current.lines.at(-1).at > 75 ||
      line.end - current.lines[0].at > 240
    ) {
      clusters.push({ lines: [line] });
    } else {
      current.lines.push(line);
    }
  }
  return clusters;
}

function buildTopicRuns(source, lines, topics) {
  const candidates = [];
  for (const [topic, aliases] of topics) {
    const allMatches = topicMatches(lines, aliases);
    const episodeMatches = allMatches.length;
    const clusters = clusterTopicLines(allMatches);
    clusters.forEach((cluster, clusterIndex) => {
      const first = cluster.lines[0];
      const last = cluster.lines.at(-1);
      const best = [...cluster.lines].sort(
        (left, right) =>
          wordTokens(right.text).length - wordTokens(left.text).length ||
          left.at - right.at,
      )[0];
      const alias =
        aliases.find((candidate) => containsAlias(best.text, candidate)) ||
        aliases[0];
      candidates.push({
        topic,
        aliases,
        episodeMatches,
        clusterIndex,
        first,
        last,
        best,
        alias,
        mentions: cluster.lines.length,
        score: cluster.lines.length * 100 - first.at / Math.max(1, source.duration),
      });
    });
  }
  const selected = candidates
    .filter((candidate) => candidate.mentions >= 2)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.first.at - right.first.at ||
        left.topic.localeCompare(right.topic),
    )
    .filter((candidate, index, all) => {
      return (
        all
          .slice(0, index)
          .filter((other) => other.topic === candidate.topic).length < 2
      );
    })
    .slice(0, 10)
    .sort(
      (left, right) =>
        left.first.at - right.first.at || left.topic.localeCompare(right.topic),
    );

  return selected.map((candidate, index) =>
    baseFact({
      id: `${source.id}:topic-run:${String(index + 1).padStart(2, "0")}`,
      type: "topicRun",
      line: candidate.best,
      phrase: candidate.alias,
      at: candidate.first.at,
      end: candidate.last.end,
      evidenceLines: [candidate.first, candidate.last],
      claimText: `${candidate.topic} has ${candidate.mentions} matching caption events inside this bounded local cluster. The bounds do not claim uninterrupted discussion.`,
      details: {
        topic: candidate.topic,
        mentions: candidate.mentions,
        episodeMatches: candidate.episodeMatches,
        clusterMaxGapSeconds: 75,
        runContinuityClaimed: false,
        matchBasis: "configured-alias-local-caption-cluster",
        evidenceAt: candidate.best.at,
        evidenceEnd: candidate.best.end,
      },
    }),
  );
}

function reelScore(line, topicAliases, centerAt) {
  const count = wordTokens(line.text).length;
  const aliasHit = topicAliases.some((alias) => containsAlias(line.text, alias));
  const cueHit =
    /\b(?:question|trailer|tier|rank|script|scene|news|think|love|hate|best|worst|favorite|press play)\b/i.test(
      line.text,
    );
  const distancePenalty = Math.abs(line.at - centerAt) / 30;
  return (
    Math.min(16, count) +
    (aliasHit ? 10 : 0) +
    (cueHit ? 4 : 0) -
    distancePenalty
  );
}

function buildLocalReelAnchors(source, lines, target) {
  const count = source.duration > 10000 ? 12 : source.duration > 6000 ? 10 : 8;
  const aliases = target.topics.flatMap(([, topicAliases]) => topicAliases);
  const facts = [];
  for (let index = 0; index < count; index += 1) {
    const from = Math.floor((source.duration * index) / count);
    const to = Math.floor((source.duration * (index + 1)) / count);
    const center = Math.floor((from + to) / 2);
    const candidates = lines
      .filter(
        (line) =>
          line.at >= from &&
          line.at < to &&
          wordTokens(line.text).length >= 6,
      )
      .sort(
        (left, right) =>
          reelScore(right, aliases, center) -
            reelScore(left, aliases, center) ||
          left.at - right.at,
      );
    const line = candidates[0] || nearestSubstantiveLine(lines, center);
    const matchedAlias =
      aliases.find((alias) => containsAlias(line.text, alias)) ||
      wordTokens(line.text).slice(0, 3).join(" ");
    facts.push(
      baseFact({
        id: `${source.id}:reel:${String(index + 1).padStart(2, "0")}`,
        type: "localReelAnchor",
        line,
        phrase: matchedAlias,
        claimText:
          "Source-local caption anchor selected for even timeline coverage; it is not labeled a best moment, verdict, or speaker-owned quote.",
        confidence: "medium",
        details: {
          reel: index + 1,
          reelCount: count,
          binFrom: from,
          binTo: to,
          selectionBasis:
            "timeline-bin-local-caption-substance-and-configured-subject-score",
          highlightClaimed: false,
        },
      }),
    );
  }
  return facts;
}

function buildSeededLocalFacts(source, lines, config, startIndex) {
  return (config.localSeeds || []).map((seed, index) => {
    const line = resolveAnchor(lines, seed.at, seed.phrase, 15);
    const support = (seed.support || []).map(([at, phrase]) =>
      resolveAnchor(lines, at, phrase, 15),
    );
    return baseFact({
      id: `${source.id}:reel:${String(startIndex + index + 1).padStart(2, "0")}`,
      type: "localReelAnchor",
      line,
      phrase: seed.phrase,
      at: Math.min(line.at, ...support.map((item) => item.at)),
      end: Math.max(line.end, ...support.map((item) => item.end)),
      evidenceLines: support,
      claimText: `${seed.label} is a bounded caption-supported analysis lane. No speaker, intent, or final verdict is assigned.`,
      details: {
        label: seed.label,
        subject: seed.subject,
        selectionBasis: "format-audit-required-local-caption-run",
        highlightClaimed: false,
      },
    });
  });
}

function buildRankingEvents(source, lines, entries) {
  return entries.map(([label, at, phrase, details], index) => {
    const line = resolveAnchor(lines, at, phrase, 15);
    const { support: supportSpecs = [], ...safeDetails } = details || {};
    const support = supportSpecs.map(([supportAt, supportPhrase]) =>
      resolveAnchor(lines, supportAt, supportPhrase, 15),
    );
    return baseFact({
      id: `${source.id}:ranking:${String(index + 1).padStart(2, "0")}`,
      type: "rankingEvent",
      line,
      phrase,
      evidenceLines: support,
      claimText: `${label} is captioned ranking language at this exact source-local stop. No on-screen result or speaker identity is inferred.`,
      details: {
        label,
        rankingLanguage: clean(phrase),
        visiblePlacementVerified: false,
        ballotOwner: null,
        supportEvidence: support.map((item, supportIndex) => ({
          at: item.at,
          end: item.end,
          excerpt: boundedExcerpt(
            item.text,
            supportSpecs[supportIndex]?.[1] || "",
          ),
          hash: sha256(
            stableJson({ at: item.at, end: item.end, text: item.text }),
          ),
        })),
        ...safeDetails,
      },
    });
  });
}

function buildQuestionAnswerPairs(source, lines, entries) {
  return entries.map((entry, index) => {
    const [questionAt, questionPhrase] = entry.question;
    const [responseAt, responsePhrase] = entry.response;
    const question = resolveAnchor(lines, questionAt, questionPhrase, 15);
    const response = resolveAnchor(lines, responseAt, responsePhrase, 15);
    const support = (entry.support || []).map(([at, phrase]) =>
      resolveAnchor(lines, at, phrase, 15),
    );
    const evidenceLines = [response, ...support];
    return baseFact({
      id: `${source.id}:qa:${String(index + 1).padStart(2, "0")}`,
      type: "questionAnswerPair",
      line: question,
      phrase: questionPhrase,
      at: question.at,
      end: Math.max(response.end, ...support.map((line) => line.end)),
      evidenceLines,
      claimText: `${entry.label} pairs a captioned question cue with the nearest audited response window. Speaker and answer ownership remain unresolved.`,
      details: {
        label: entry.label,
        subject: entry.subject,
        questionEvidence: {
          at: question.at,
          end: question.end,
          excerpt: boundedExcerpt(question.text, questionPhrase),
          hash: sha256(
            stableJson({ at: question.at, end: question.end, text: question.text }),
          ),
        },
        responseEvidence: {
          at: response.at,
          end: response.end,
          excerpt: boundedExcerpt(response.text, responsePhrase),
          hash: sha256(
            stableJson({ at: response.at, end: response.end, text: response.text }),
          ),
        },
        pairingBasis: "format-audit-question-and-nearest-reviewed-response-window",
        answerOwner: null,
        answerSemanticsHumanVerified: false,
      },
    });
  });
}

function buildAgendaItems(source, lines, entries) {
  return entries.map((entry, index) => {
    const evidenceAt = Number.isFinite(entry.evidenceAt)
      ? entry.evidenceAt
      : entry.at;
    const line = resolveAnchor(lines, evidenceAt, entry.phrase, 18);
    const support = (entry.support || []).map(([at, phrase]) =>
      resolveAnchor(lines, at, phrase, 18),
    );
    return baseFact({
      id: `${source.id}:agenda:${String(index + 1).padStart(2, "0")}`,
      type: "agendaItem",
      line,
      phrase: entry.phrase,
      at: entry.at,
      end: Math.max(entry.at + 1, line.end),
      evidenceLines: support,
      claimText: `${entry.label} is an exact caption-backed subject door. Its timestamp does not imply importance, uninterrupted coverage, or a final take.`,
      details: {
        label: entry.label,
        subject: entry.subject,
        topicFirstAt: entry.at,
        topicPeakAt: entry.peakAt ?? null,
        topicContinuityClaimed: false,
        agendaImportanceClaimed: false,
      },
    });
  });
}

function buildSimpleCueFacts(source, lines, entries, type, key) {
  return entries.map(([label, at, phrase, details], index) => {
    const line = resolveAnchor(lines, at, phrase, 15);
    const noun = type === "syncCue" ? "playback cue" : "script/scene cue";
    return baseFact({
      id: `${source.id}:${key}:${String(index + 1).padStart(2, "0")}`,
      type,
      line,
      phrase,
      claimText: `${label} is captioned ${noun} language. No frame match, visual scene, source-script origin, or speaker identity is inferred.`,
      details: {
        label,
        frameMatchVerified: false,
        sourceScriptOriginVerified: false,
        ...details,
      },
    });
  });
}

function assertRequiredAnchors(sourceId, lines) {
  const requirements = REQUIRED_ANCHORS[sourceId] || [];
  const resolved = requirements.map(([at, phrase, tolerance]) => {
    const line = resolveAnchor(lines, at, phrase, tolerance);
    return {
      expectedAt: at,
      resolvedAt: line.at,
      phrase: clean(phrase),
      evidenceHash: sha256(
        stableJson({ at: line.at, end: line.end, text: line.text }),
      ),
    };
  });
  return {
    required: requirements.length,
    resolved: resolved.length,
    anchorSetSha256: sha256(stableJson(resolved)),
  };
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
  const captionPayload = JSON.parse(captionBuffer.toString("utf8"));
  const metadata = JSON.parse(metadataBuffer.toString("utf8"));
  return {
    captionPath,
    metadataPath,
    captionBuffer,
    metadataBuffer,
    captionPayload,
    metadata,
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
  const anchorAudit = assertRequiredAnchors(source.id, lines);
  const formatConfig = FORMAT_FACT_CONFIG[source.id] || {};
  const phaseBoundaries = buildPhaseBoundaries(source, lines);
  const topicRuns = buildTopicRuns(source, lines, target.topics);
  const standardReels = buildLocalReelAnchors(source, lines, target);
  const localReelAnchors = [
    ...standardReels,
    ...buildSeededLocalFacts(
      source,
      lines,
      formatConfig,
      standardReels.length,
    ),
  ].sort((left, right) => left.at - right.at || left.id.localeCompare(right.id));

  let formatFacts;
  if (target.specificKey === "rankingEvents") {
    formatFacts = buildRankingEvents(
      source,
      lines,
      formatConfig.rankingEvents || [],
    );
  } else if (target.specificKey === "questionAnswerPairs") {
    formatFacts = buildQuestionAnswerPairs(
      source,
      lines,
      formatConfig.questionAnswerPairs || [],
    );
  } else if (target.specificKey === "agendaItems") {
    formatFacts = buildAgendaItems(
      source,
      lines,
      formatConfig.agendaItems || [],
    );
  } else if (target.specificKey === "scriptSceneCues") {
    formatFacts = buildSimpleCueFacts(
      source,
      lines,
      formatConfig.scriptSceneCues || [],
      "scriptSceneCue",
      "script-cue",
    );
  } else {
    formatFacts = buildSimpleCueFacts(
      source,
      lines,
      formatConfig.syncCues || [],
      "syncCue",
      "sync-cue",
    );
  }

  const record = {
    ...source,
    format: target.format,
    formatSpecificFactType: target.specificKey,
    sourceState: {
      coverage: "caption-backed",
      evidenceState: "machine-surfaced",
      reviewState: REVIEW_STATE,
      promotionAllowed: false,
      speakerDiarized: false,
    },
    rightsPolicy: {
      publicExcerptWordLimitPerField: EXCERPT_WORD_LIMIT,
      fullCaptionPublic: false,
      speakerClaimsAllowed: false,
      performerClaimsAllowed: false,
      visualResultClaimsAllowed: false,
      originClaimsAllowed: false,
      promotionAllowed: false,
    },
    inputEvidence: {
      captionSha256: sha256(loaded.captionBuffer),
      metadataSha256: sha256(loaded.metadataBuffer),
      captionEvents: lines.length,
      anchorAudit,
    },
    phaseBoundaries,
    topicRuns,
    localReelAnchors,
    [target.specificKey]: formatFacts,
  };
  return {
    ...record,
    generationSha256: sha256(stableJson(record)),
  };
}

export function buildPilotPayload() {
  const sources = TARGETS.map(buildSource);
  const factArrays = sources.flatMap((source) => [
    source.phaseBoundaries,
    source.topicRuns,
    source.localReelAnchors,
    source[source.formatSpecificFactType],
  ]);
  const facts = factArrays.flat();
  const byType = {};
  for (const fact of facts) {
    byType[fact.type] = (byType[fact.type] || 0) + 1;
  }
  return {
    schema: "wwam-episode-facts-pilot/v1",
    generated: GENERATED,
    provenance: {
      generator: "scripts/generate-episode-facts-pilot.mjs",
      method:
        "Deterministic source-local automatic-caption facts with audited format anchors, bounded excerpts, hashed private evidence, and no speaker or visual-result inference.",
      contentSha256: sha256(stableJson(sources)),
    },
    policy: {
      privateCaptionCacheUsed: true,
      publicFullCaptionsIncluded: false,
      publicExcerptWordLimitPerField: EXCERPT_WORD_LIMIT,
      speakerAttributionAllowed: false,
      visualResultInferenceAllowed: false,
      sourceScriptOriginInferenceAllowed: false,
      promotionAllowed: false,
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

export function renderArtifact(payload = buildPilotPayload()) {
  return `window.WWAM_EPISODE_FACTS_PILOT = ${JSON.stringify(payload)};\n`;
}

function main() {
  const rendered = renderArtifact();
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated artifact: ${OUTPUT_PATH}`);
    }
    if (fs.readFileSync(OUTPUT_PATH, "utf8") !== rendered) {
      throw new Error(
        "episode-facts-pilot.js is stale; run generate-episode-facts-pilot.mjs",
      );
    }
    process.stdout.write("episode facts pilot is deterministic and current\n");
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered);
  process.stdout.write(
    `wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)}\n`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
