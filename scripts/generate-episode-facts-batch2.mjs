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
  "episode-facts-batch2.js",
);
const GENERATED = "2026-07-30";
const EXCERPT_WORD_LIMIT = 16;
const EVIDENCE_TYPE = "youtube-automatic-caption";
const REVIEW_STATE = "machine-surfaced-needs-editor-review";

function anchor(at, phrase, tolerance = 8) {
  return [at, phrase, tolerance];
}

const TARGETS = Object.freeze([
  {
    id: "kX3wb5pBRDo",
    format: "ranking-list",
    specificKey: "rankingEvents",
    minimumFacts: 18,
    omissions: [
      "Parallel ballot owners are not assigned because the caption track does not reliably identify voices.",
      "Placements whose movie title or number dropped out of the automatic captions are omitted.",
    ],
  },
  {
    id: "16h8RkoAuQU",
    format: "ranking-list",
    specificKey: "rankingEvents",
    minimumFacts: 11,
    omissions: [
      "Parallel ballot owners are not assigned because the caption track does not reliably identify voices.",
      "The number-eight title and the final number-one declaration are omitted because the necessary wording is incomplete.",
    ],
  },
  {
    id: "YaE7bkZ2JAM",
    format: "ranking-list",
    specificKey: "rankingEvents",
    minimumFacts: 12,
    omissions: [
      "On-screen tier images and poll graphics are not certified; only captioned placement language is represented.",
      "Poll lines mistranscribed as “Alzheimer” are omitted rather than silently normalized to a tier name.",
    ],
  },
  {
    id: "ZMaNz5FTCwY",
    format: "question-and-answer",
    specificKey: "questionAnswerPairs",
    minimumFacts: 6,
    omissions: [
      "Question and response ownership is not assigned because the caption track is not diarized.",
      "Audience prompts without a nearby intelligible response are omitted.",
    ],
  },
  {
    id: "3Ndidoo_s58",
    format: "trailer-breakdown",
    specificKey: "trailerCues",
    minimumFacts: 10,
    omissions: [
      "Described trailer frames are not independently frame-matched in this batch.",
      "Predictions remain labeled as captioned theories or guesses, not movie facts.",
    ],
  },
  {
    id: "R_bXrnNOcwg",
    format: "script-reading",
    specificKey: "scriptSceneCues",
    minimumFacts: 11,
    omissions: [
      "The underlying document is not independently authenticated; the show describes the material as script excerpts.",
      "Character-performance ownership is not assigned without a reviewed voice pass.",
    ],
  },
  {
    id: "6VXSBDZ-3WE",
    format: "watchalong-commentary",
    specificKey: "syncCues",
    minimumFacts: 8,
    omissions: [
      "The successful play cue is exact, but the viewer’s disc edition and runtime offset are not certified.",
      "No character-performance ownership is assigned without a reviewed voice pass.",
    ],
  },
  {
    id: "YvjsGkVEu0A",
    format: "news-agenda",
    specificKey: "agendaItems",
    minimumFacts: 8,
    omissions: [
      "News claims are source-local agenda doors and are not presented as independently fact-checked reporting.",
      "Off-topic chat stretches are not promoted into agenda items.",
    ],
  },
  {
    id: "1luh7mKQfz8",
    format: "review-desk",
    specificKey: "reviewMoments",
    minimumFacts: 12,
    omissions: [
      "The review moments preserve the show’s reactions; they are not external facts about the film.",
      "Individual reaction ownership is not assigned without a reviewed voice pass.",
    ],
  },
  {
    id: "2m0BgJzEPCk",
    format: "review-desk",
    specificKey: "reviewMoments",
    minimumFacts: 14,
    omissions: [
      "The review moments preserve the show’s reactions; they are not external facts about the film.",
      "Individual reaction ownership is not assigned without a reviewed voice pass.",
    ],
  },
  {
    id: "QwJb31dSo9Y",
    format: "review-desk",
    specificKey: "reviewMoments",
    minimumFacts: 15,
    omissions: [
      "This source identifies itself as spoiler-free, so plot-specific inferences are intentionally avoided.",
      "Parallel ratings are preserved as separate captioned scores without assigning them to a person.",
    ],
  },
  {
    id: "rtWl8c57SYk",
    format: "episode-recap",
    specificKey: "reviewMoments",
    minimumFacts: 11,
    omissions: [
      "The recap reactions are source-local commentary, not independent production facts.",
      "Tentative effects language remains tentative and is not converted into a production-method claim.",
    ],
  },
]);

const FACT_CONFIG = Object.freeze({
  kX3wb5pBRDo: {
    rankingEvents: [
      {
        label: "FOUR-FRANCHISE BALLOT SCOPE",
        anchor: anchor(1430, "are going to rank every movie from"),
        support: [
          anchor(1431, "scream friday 13th nightmare on elm"),
          anchor(1433, "street and halloween tonight in one big"),
        ],
        summary:
          "The captions define one combined ranking across Scream, Friday the 13th, Elm Street, and Halloween.",
        details: {
          subject: "Combined four-franchise ranking",
          eventKind: "captioned-ranking-scope",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "SCREAM 3 // #30",
        anchor: anchor(3126, "is going to be scream 3 is my number"),
        support: [anchor(3129, "30")],
        summary: "The captions place Scream 3 at number 30 in one unresolved ballot.",
        details: {
          subject: "Scream 3",
          position: 30,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "ROB ZOMBIE'S HALLOWEEN II // #29",
        anchor: anchor(3766, "rob zombie's h2 is gonna be my number"),
        support: [anchor(3769, "29")],
        summary:
          "The captions place Rob Zombie’s Halloween II at number 29 in one unresolved ballot.",
        details: {
          subject: "Rob Zombie's Halloween II",
          position: 29,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "SCREAM 5 // #23",
        anchor: anchor(5843, "my number 23 is going to be uh scream 5"),
        summary: "The captions place Scream 5 at number 23 in one unresolved ballot.",
        details: {
          subject: "Scream 5",
          position: 23,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "JASON X // #22",
        anchor: anchor(6178, "my number 22 was jason x"),
        summary: "The captions place Jason X at number 22 in one unresolved ballot.",
        details: {
          subject: "Jason X",
          position: 22,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN H20 // #23",
        anchor: anchor(6240, "h2o my number 23 is h2o"),
        summary:
          "The captions place Halloween H20 at number 23 in another unresolved ballot.",
        details: {
          subject: "Halloween H20",
          position: 23,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "FRIDAY THE 13TH (2009) // #17",
        anchor: anchor(7462, "my number 17 is going to be friday the"),
        support: [
          anchor(7464, "13th"),
          anchor(7465, "the reboot"),
        ],
        summary:
          "The captions place the Friday the 13th reboot at number 17 in one unresolved ballot.",
        details: {
          subject: "Friday the 13th (2009)",
          position: 17,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "WES CRAVEN'S NEW NIGHTMARE // #15",
        anchor: anchor(7762, "nightmare is my number 15"),
        support: [anchor(7758, "wes craven's new")],
        summary:
          "The captions place Wes Craven’s New Nightmare at number 15 in one unresolved ballot.",
        details: {
          subject: "Wes Craven's New Nightmare",
          position: 15,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN 6 // #12",
        anchor: anchor(9210, "my number 12 is going to be"),
        support: [anchor(9213, "halloween six the curse of michael myers")],
        summary:
          "The captions place Halloween 6 at number 12 in one unresolved ballot.",
        details: {
          subject: "Halloween 6: The Curse of Michael Myers",
          position: 12,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN 6 // #9",
        anchor: anchor(10321, "halloween six is my number nine"),
        summary:
          "The captions place Halloween 6 at number nine in another unresolved ballot.",
        details: {
          subject: "Halloween 6: The Curse of Michael Myers",
          position: 9,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "SCREAM 2 // #7",
        anchor: anchor(10746, "my number seven is gonna be scream"),
        support: [anchor(10749, "two")],
        summary: "The captions place Scream 2 at number seven in one unresolved ballot.",
        details: {
          subject: "Scream 2",
          position: 7,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "A NIGHTMARE ON ELM STREET 2 // #7",
        anchor: anchor(10869, "my number seven is nightmare on street"),
        support: [anchor(10871, "two part two")],
        summary:
          "The captions place A Nightmare on Elm Street 2 at number seven in another unresolved ballot.",
        details: {
          subject: "A Nightmare on Elm Street 2",
          position: 7,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN 4 // #5",
        anchor: anchor(11116, "time number five is halloween"),
        support: [anchor(11118, "four")],
        summary:
          "The captions place Halloween 4 at number five in one unresolved ballot.",
        details: {
          subject: "Halloween 4: The Return of Michael Myers",
          position: 5,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "FRIDAY THE 13TH: THE FINAL CHAPTER // #5",
        anchor: anchor(11371, "my number five is going to be friday the"),
        support: [anchor(11372, "13th the final chapter")],
        summary:
          "The captions place Friday the 13th: The Final Chapter at number five in another unresolved ballot.",
        details: {
          subject: "Friday the 13th: The Final Chapter",
          position: 5,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "SCREAM (1996) // #4",
        anchor: anchor(11586, "my number four is going to be scream"),
        support: [anchor(11588, "one 96")],
        summary:
          "The captions place Scream (1996) at number four in one unresolved ballot.",
        details: {
          subject: "Scream (1996)",
          position: 4,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "A NIGHTMARE ON ELM STREET 2 // #3",
        anchor: anchor(12016, "street part two is my my third favorite"),
        summary:
          "The captions place A Nightmare on Elm Street 2 at number three in one unresolved ballot.",
        details: {
          subject: "A Nightmare on Elm Street 2",
          position: 3,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN (1978) // #2",
        anchor: anchor(12595, "for me my number two is"),
        support: [anchor(12597, "halloween 1978")],
        summary:
          "The captions place Halloween (1978) at number two in one unresolved ballot.",
        details: {
          subject: "Halloween (1978)",
          position: 2,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "SCREAM (1996) // #1",
        anchor: anchor(12610, "go ahead and put number one"),
        support: [anchor(12612, "scream")],
        summary:
          "The captions conclude one unresolved ballot with Scream (1996) at number one.",
        details: {
          subject: "Scream (1996)",
          position: 1,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
    ],
  },
  "16h8RkoAuQU": {
    rankingEvents: [
      {
        label: "UPDATED HALLOWEEN BALLOT",
        anchor: anchor(65, "tonight we're ranking the Halloween"),
        support: [
          anchor(66, "franchise including Halloween ends"),
          anchor(71, "first ranking with 2018 kills and ends"),
        ],
        summary:
          "The captions introduce an updated Halloween ranking that includes 2018, Kills, and Ends.",
        details: {
          subject: "Halloween franchise ranking",
          eventKind: "captioned-ranking-scope",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN 5 // #11",
        anchor: anchor(4947, "my number 11"),
        support: [anchor(4955, "pretty bad"), anchor(4956, "movie it's Halloween five")],
        summary:
          "The captions place Halloween 5 at number 11 in one unresolved ballot.",
        details: {
          subject: "Halloween 5: The Revenge of Michael Myers",
          position: 11,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN III // #10",
        anchor: anchor(5230, "my number 10 is going to"),
        support: [
          anchor(5238, "Halloween three Season"),
          anchor(5240, "of the Witch"),
        ],
        summary:
          "The captions place Halloween III at number 10 in one unresolved ballot.",
        details: {
          subject: "Halloween III: Season of the Witch",
          position: 10,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN III // #10 // SECOND BALLOT",
        anchor: anchor(5320, "my number 10's Halloween three"),
        summary:
          "The captions also place Halloween III at number 10 in another unresolved ballot.",
        details: {
          subject: "Halloween III: Season of the Witch",
          position: 10,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN KILLS // #7",
        anchor: anchor(6620, "my number seven is going to"),
        support: [anchor(6626, "Halloween kills")],
        summary:
          "The captions place Halloween Kills at number seven in one unresolved ballot.",
        details: {
          subject: "Halloween Kills",
          position: 7,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "ROB ZOMBIE'S HALLOWEEN // #6",
        anchor: anchor(7961, "my number six"),
        support: [anchor(7965, "Cox smoking Rob Zombie's"), anchor(7969, "Halloween")],
        summary:
          "The captions place Rob Zombie’s Halloween at number six in one unresolved ballot.",
        details: {
          subject: "Rob Zombie's Halloween",
          position: 6,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN II (1981) // #5",
        anchor: anchor(8315, "my number five is gonna be"),
        support: [anchor(8318, "Halloween two 1981")],
        summary:
          "The captions place Halloween II (1981) at number five in one unresolved ballot.",
        details: {
          subject: "Halloween II (1981)",
          position: 5,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "ROB ZOMBIE'S HALLOWEEN // #5",
        anchor: anchor(8436, "my number five is"),
        support: [anchor(8439, "gonna be Rob"), anchor(8441, "Zombie's Halloween")],
        summary:
          "The captions place Rob Zombie’s Halloween at number five in another unresolved ballot.",
        details: {
          subject: "Rob Zombie's Halloween",
          position: 5,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN (2018) // #4",
        anchor: anchor(9510, "my number four is Halloween 2018"),
        summary:
          "The captions place Halloween (2018) at number four in one unresolved ballot.",
        details: {
          subject: "Halloween (2018)",
          position: 4,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN 6 // #3",
        anchor: anchor(9706, "my number's three"),
        support: [anchor(9712, "Halloween six curse of"), anchor(9715, "Michael Myers is my number three")],
        summary:
          "The captions place Halloween 6 at number three in one unresolved ballot.",
        details: {
          subject: "Halloween 6: The Curse of Michael Myers",
          position: 3,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
      {
        label: "HALLOWEEN 4 // #2",
        anchor: anchor(10658, "Halloween fours my number two"),
        summary:
          "The captions place Halloween 4 at number two in one unresolved ballot.",
        details: {
          subject: "Halloween 4: The Return of Michael Myers",
          position: 2,
          eventKind: "captioned-ranking-placement",
          sequenceState: "parallel-ballots-unresolved",
        },
      },
    ],
  },
  YaE7bkZ2JAM: {
    rankingEvents: [
      {
        label: "REMAKE TIER LIST READY",
        anchor: anchor(831, "here it is that's the list"),
        support: [anchor(834, "big one and also a long list")],
        summary: "The captions mark the remake tier list as ready and describe it as long.",
        details: {
          subject: "Horror remake tier list",
          eventKind: "captioned-ranking-scope",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "THE HILLS HAVE EYES // REAL AWESOME",
        anchor: anchor(4929, "Hills Have Eyes remake"),
        support: [anchor(4932, "personally I put it real awesome")],
        summary:
          "The captions place The Hills Have Eyes remake in the “real awesome” tier.",
        details: {
          subject: "The Hills Have Eyes remake",
          tier: "real awesome",
          eventKind: "captioned-tier-placement",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "THE TEXAS CHAINSAW MASSACRE // ALL-TIMER",
        anchor: anchor(5051, "another awesome mid-2000s remake Texas"),
        support: [
          anchor(5053, "Chainsaw Massacre"),
          anchor(5056, "timer Dan let's go ahead and put it up"),
          anchor(5070, "old timer look at his face"),
        ],
        summary:
          "The captions place The Texas Chainsaw Massacre remake in the top “all-timer” tier.",
        details: {
          subject: "The Texas Chainsaw Massacre remake",
          tier: "all-timer",
          eventKind: "captioned-tier-placement",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "PSYCHO // SUCKS MY BUTT",
        anchor: anchor(6487, "psycho now let's look at the opposite"),
        support: [anchor(6474, "would put it in"), anchor(6476, "sucks my butt because it's pointless")],
        summary: "The captions place the Psycho remake in the “sucks my butt” tier.",
        details: {
          subject: "Psycho remake",
          tier: "sucks my butt",
          eventKind: "captioned-tier-placement",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "FUNNY GAMES // CROWD RESULT",
        anchor: anchor(6576, "previous vote as far as"),
        support: [
          anchor(6579, "funny games remake being an all-timer or"),
          anchor(6583, "real awesome 75 to 25"),
          anchor(6587, "goes in the real awesome category"),
        ],
        summary:
          "The captions report the Funny Games remake poll landing in “real awesome,” 75 to 25.",
        details: {
          subject: "Funny Games remake",
          tier: "real awesome",
          captionedTally: "75 to 25",
          eventKind: "captioned-poll-result-language",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "THE HITCHER // REAL AWESOME POSITION",
        anchor: anchor(8487, "how about the old Hitcher"),
        support: [anchor(8492, "this is real awesome")],
        summary:
          "The captions record a “real awesome” position during The Hitcher remake debate.",
        details: {
          subject: "The Hitcher remake",
          tier: "real awesome",
          eventKind: "captioned-tier-position",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "DAWN OF THE DEAD // OLD-TIMER POSITION",
        anchor: anchor(8796, "Dawn for the Dead remake"),
        support: [anchor(8804, "put it as an Old Timer")],
        summary:
          "The captions record an “old-timer” position during the Dawn of the Dead remake debate.",
        details: {
          subject: "Dawn of the Dead remake",
          tier: "old-timer",
          eventKind: "captioned-tier-position",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "DAWN OF THE DEAD // REAL AWESOME POSITION",
        anchor: anchor(8806, "gonna be fair I feel like it's real"),
        support: [anchor(8807, "awesome")],
        summary:
          "The captions also record a “real awesome” position during the Dawn of the Dead remake debate.",
        details: {
          subject: "Dawn of the Dead remake",
          tier: "real awesome",
          eventKind: "captioned-tier-position",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "THE RING // REAL AWESOME POSITION",
        anchor: anchor(9087, "the ring"),
        support: [anchor(9138, "I'll put it in real awesome")],
        summary:
          "The captions record a “real awesome” position during The Ring remake debate.",
        details: {
          subject: "The Ring remake",
          tier: "real awesome",
          eventKind: "captioned-tier-position",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "THE GRUDGE // SUCKS MY BUTT POSITION",
        anchor: anchor(9291, "The Grudge"),
        support: [anchor(9294, "this movie sucks my butt Steve")],
        summary:
          "The captions record a “sucks my butt Steve” position during The Grudge remake debate.",
        details: {
          subject: "The Grudge remake",
          tier: "sucks my butt Steve",
          eventKind: "captioned-tier-position",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "THE GRUDGE // RESOLUTION",
        anchor: anchor(9907, "this the garage remake"),
        support: [anchor(9910, "goes to sucks my butt Steve")],
        summary:
          "The captions resolve the Grudge remake discussion into “sucks my butt Steve.”",
        details: {
          subject: "The Grudge remake",
          tier: "sucks my butt Steve",
          eventKind: "captioned-tier-resolution",
          sequenceState: "parallel-placements-unresolved",
        },
      },
      {
        label: "FIRESTARTER // CROWD RESULT",
        anchor: anchor(11075, "question of the audience's choice"),
        support: [
          anchor(11076, "between Firestarter"),
          anchor(11081, "real awesome"),
          anchor(11082, "crowd says sucks my butt"),
        ],
        summary:
          "The captions report the Firestarter audience choice landing in “sucks my butt.”",
        details: {
          subject: "Firestarter remake",
          tier: "sucks my butt",
          eventKind: "captioned-poll-result-language",
          sequenceState: "parallel-placements-unresolved",
        },
      },
    ],
  },
  ZMaNz5FTCwY: {
    questionAnswerPairs: [
      {
        label: "FAVORITE DEATH // SARTAIN RESPONSE",
        anchor: anchor(848, "what was your favorite"),
        response: anchor(853, "mine was definitely doctor"),
        support: [anchor(855, "Sartain")],
        summary:
          "The captions ask for a favorite death, followed by one response naming Doctor Sartain.",
        details: {
          subject: "Favorite death",
          eventKind: "captioned-question-response-window",
        },
      },
      {
        label: "FAVORITE DEATH // BLONDE FRIEND RESPONSE",
        anchor: anchor(848, "what was your favorite"),
        response: anchor(903, "my favorite"),
        support: [anchor(905, "liked the blonde girl"), anchor(908, "death scene")],
        summary:
          "The same favorite-death question is followed later by a response naming the blonde friend’s scene.",
        details: {
          subject: "Favorite death",
          eventKind: "captioned-question-response-window",
        },
      },
      {
        label: "LAURIE FOCUS QUESTION",
        anchor: anchor(1659, "do you guys"),
        support: [
          anchor(1663, "think the movie suffered"),
          anchor(1663, "not"),
          anchor(1664, "focused on Laurie"),
        ],
        response: anchor(1668, "actually liked"),
        responseSupport: [anchor(1673, "Laurie blew me"), anchor(1680, "focused away from her I got excited")],
        summary:
          "The captions ask whether reduced Laurie focus hurt the movie, followed by a positive response.",
        details: {
          subject: "Laurie Strode focus",
          eventKind: "captioned-question-response-window",
        },
      },
      {
        label: "YEARLY HALLOWEEN MOVIES",
        anchor: anchor(3985, "would you"),
        support: [anchor(3988, "want a yearly Halloween movie")],
        response: anchor(3994, "every Halloween we doesn't want that"),
        responseSupport: [anchor(3997, "would")],
        summary:
          "The captions ask about yearly Halloween movies, followed by an enthusiastic yes.",
        details: {
          subject: "Yearly Halloween movies",
          eventKind: "captioned-question-response-window",
        },
      },
      {
        label: "HALLOWEEN ANTHOLOGY IDEA",
        anchor: anchor(4537, "says do you think"),
        support: [anchor(4541, "interesting idea"), anchor(4542, "anthology")],
        response: anchor(4545, "I'm gonna say no"),
        responseSupport: [anchor(4547, "hard now")],
        summary:
          "The captions ask about a Halloween anthology format, followed by a firm no.",
        details: {
          subject: "Halloween anthology format",
          eventKind: "captioned-question-response-window",
        },
      },
      {
        label: "MICHAEL'S ESCAPE",
        anchor: anchor(5446, "what about the escape do you think his"),
        support: [anchor(5448, "escape felt real")],
        response: anchor(5450, "we don't know but that seems like"),
        responseSupport: [anchor(5452, "doctor staged"), anchor(5454, "definitely helped him")],
        summary:
          "The captions ask whether the escape felt real, followed by a theory that the doctor helped.",
        details: {
          subject: "Michael Myers escape",
          eventKind: "captioned-question-response-window",
        },
      },
    ],
  },
  "3Ndidoo_s58": {
    trailerCues: [
      {
        label: "TRAILER RELEASE",
        anchor: anchor(11, "Scream Six trailer came out today"),
        summary: "The captions open by identifying the Scream VI trailer as that day’s subject.",
        details: {
          subject: "Scream VI trailer",
          cueKind: "captioned-trailer-setup",
        },
      },
      {
        label: "WHOLE TRAILER SCOPE",
        anchor: anchor(669, "today guys we got the whole trailer to"),
        support: [anchor(672, "get through")],
        summary: "The captions promise to work through the whole trailer.",
        details: {
          subject: "Full trailer walkthrough",
          cueKind: "captioned-trailer-setup",
        },
      },
      {
        label: "TRAILER WALKTHROUGH DOOR",
        anchor: anchor(1540, "we go through the trailer"),
        summary: "The captions mark the upcoming trailer walkthrough.",
        details: {
          subject: "Trailer walkthrough",
          cueKind: "captioned-trailer-door",
        },
      },
      {
        label: "SHRINE / STU THEORY",
        anchor: anchor(1665, "shrine actually adds"),
        support: [anchor(1668, "death Theory")],
        summary:
          "The captions surface a theory that the shrine supports the idea that Stu’s death was faked.",
        details: {
          subject: "Shrine and Stu theory",
          cueKind: "captioned-trailer-theory",
        },
      },
      {
        label: "SAM AND TARA BACK-TO-BACK SHOT",
        anchor: anchor(1871, "shot where Sam"),
        support: [anchor(1873, "and Tara are back to back")],
        summary:
          "The captions identify a trailer shot with Sam and Tara standing back to back.",
        details: {
          subject: "Sam and Tara back-to-back shot",
          cueKind: "captioned-trailer-reference",
        },
      },
      {
        label: "KIRBY BADGE PROMO",
        anchor: anchor(4451, "shot where Kirby has a police badge"),
        summary:
          "The captions reference a promo shot in which Kirby appears to have a police badge.",
        details: {
          subject: "Kirby police-badge promo",
          cueKind: "captioned-promo-reference",
        },
      },
      {
        label: "RED-BAND LINE",
        anchor: anchor(5109, "here's where in the red band"),
        support: [anchor(5111, "trailer so much cooler"), anchor(5114, "where I'm gonna shoot")],
        summary:
          "The captions distinguish a red-band line and praise that version as cooler.",
        details: {
          subject: "Red-band trailer line",
          cueKind: "captioned-trailer-comparison",
        },
      },
      {
        label: "SAMARA WEAVING OPENING-KILL GUESS",
        anchor: anchor(5591, "this entire trailer is getting to see"),
        support: [
          anchor(5595, "actress Samara weaving"),
          anchor(5605, "my guess is"),
          anchor(5608, "smart weaving is the"),
          anchor(5609, "opening kill"),
        ],
        summary:
          "The captions turn the Samara Weaving footage into an explicitly labeled opening-kill guess.",
        details: {
          subject: "Samara Weaving opening-kill guess",
          cueKind: "captioned-trailer-theory",
        },
      },
      {
        label: "SUBWAY PTSD THEORY",
        anchor: anchor(5791, "then we get the subway"),
        support: [
          anchor(5818, "dealing with a PTSD"),
          anchor(5820, "I think that this is a dream"),
          anchor(5822, "sequence personally"),
        ],
        summary:
          "The captions connect the subway footage to PTSD and explicitly call it a personal dream-sequence theory.",
        details: {
          subject: "Subway dream-sequence theory",
          cueKind: "captioned-trailer-theory",
        },
      },
      {
        label: "STREET SLASH SHOT",
        anchor: anchor(5826, "that shot of him slashing"),
        support: [anchor(5829, "in the streets")],
        summary: "The captions identify a shot of Ghostface slashing in the street.",
        details: {
          subject: "Street slash shot",
          cueKind: "captioned-trailer-reference",
        },
      },
    ],
  },
  R_bXrnNOcwg: {
    scriptSceneCues: [
      {
        label: "ROB ZOMBIE HALLOWEEN EXCERPTS",
        anchor: anchor(134, "taken excerpts from the Halloween Rob"),
        support: [anchor(137, "Zombie Halloween to be clear"), anchor(140, "scripts from of Rob Zombie's Halloween")],
        summary:
          "The show describes its selected material as excerpts from Rob Zombie’s Halloween script.",
        details: {
          subject: "Rob Zombie's Halloween excerpts",
          cueKind: "captioned-material-description",
        },
      },
      {
        label: "FULL SCRIPT PLAN ABANDONED",
        anchor: anchor(147, "originally the idea was do the"),
        support: [
          anchor(149, "whole thing"),
          anchor(151, "read through the whole script"),
          anchor(154, "several days"),
        ],
        summary:
          "The captions say a full-script read was considered, then rejected as too long.",
        details: {
          subject: "Full-script plan",
          cueKind: "captioned-script-plan",
        },
      },
      {
        label: "FOUR SELECTED SCENES",
        anchor: anchor(572, "what we did is we"),
        support: [anchor(574, "picked four"), anchor(576, "transcribed them")],
        summary: "The captions say four scenes were selected and transcribed.",
        details: {
          subject: "Four selected scenes",
          cueKind: "captioned-script-plan",
        },
      },
      {
        label: "LIVE SCRIPT READING",
        anchor: anchor(579, "we're going to do a live script reading"),
        summary: "The captions explicitly introduce a live script reading.",
        details: {
          subject: "Live script reading",
          cueKind: "captioned-format-door",
        },
      },
      {
        label: "NORMAL READ, THEN CHARACTER SWITCH",
        anchor: anchor(590, "going to read"),
        support: [
          anchor(592, "normally as the characters"),
          anchor(594, "then we're going to switch"),
          anchor(595, "throw some characters in"),
        ],
        summary:
          "The captions describe a normal read followed by altered character voices.",
        details: {
          subject: "Character-switch format",
          cueKind: "captioned-performance-plan",
        },
      },
      {
        label: "SMITH'S GROVE VIDEO SCENE",
        anchor: anchor(981, "Dr. Lumis"),
        support: [
          anchor(984, "watching the video footage"),
          anchor(986, "Michael Break Free from Smith's Grove"),
        ],
        summary:
          "The captions set a scene around doctors watching footage of Michael’s Smith’s Grove escape.",
        details: {
          subject: "Smith's Grove video scene",
          cueKind: "captioned-scene-setup",
        },
      },
      {
        label: "JOE GRIZZLY SCENE PROPOSAL",
        anchor: anchor(1568, "Joe Grizzly scene first"),
        support: [anchor(1570, "one-off"), anchor(1572, "person in that scene")],
        summary:
          "The captions propose the Joe Grizzly scene first and describe it as a one-person scene.",
        details: {
          subject: "Joe Grizzly scene",
          cueKind: "captioned-scene-selection",
        },
      },
      {
        label: "KITCHEN SCENE SELECTION",
        anchor: anchor(1579, "the kitchen scene"),
        support: [anchor(1581, "do that first")],
        summary: "The captions switch the immediate selection to the kitchen scene.",
        details: {
          subject: "Kitchen scene",
          cueKind: "captioned-scene-selection",
        },
      },
      {
        label: "JOE GRIZZLY / SUBWAY VARIANT",
        anchor: anchor(1842, "can you do the Joe"),
        support: [
          anchor(1845, "Grizzly as Subway"),
          anchor(1849, "Same scene but Subway sandwich"),
        ],
        summary:
          "The captions set a Joe Grizzly variant performed as a Subway sandwich character.",
        details: {
          subject: "Joe Grizzly / Subway variant",
          cueKind: "captioned-performance-variant",
        },
      },
      {
        label: "JOE GRIZZLY SCENE DIRECTIONS",
        anchor: anchor(1870, "Joe Grizzly walks into the truck stop"),
        support: [anchor(1873, "bathroom weary from the road")],
        summary:
          "The captions begin the Joe Grizzly scene with a truck-stop bathroom direction.",
        details: {
          subject: "Joe Grizzly scene directions",
          cueKind: "captioned-scene-direction",
        },
      },
      {
        label: "BREAKFAST SCENE FINALE",
        anchor: anchor(2464, "breakfast scene"),
        support: [anchor(2465, "Breakfast scene is the last one")],
        summary: "The captions identify the breakfast scene as the final selected scene.",
        details: {
          subject: "Breakfast scene",
          cueKind: "captioned-scene-selection",
        },
      },
    ],
  },
  "6VXSBDZ-3WE": {
    syncCues: [
      {
        label: "HALLOWEEN LIVE COMMENTARY",
        anchor: anchor(36, "a live sort of live commentary of"),
        support: [anchor(39, "Halloween")],
        summary: "The captions introduce a live-style commentary for Halloween.",
        details: {
          subject: "Halloween commentary",
          cueKind: "captioned-commentary-setup",
        },
      },
      {
        label: "MOVIE-READY CHECK",
        anchor: anchor(61, "this live with you guys"),
        support: [anchor(63, "watch this movie with you"), anchor(65, "popcorn ready")],
        summary: "The captions tell viewers to get ready to watch the movie together.",
        details: {
          subject: "Viewer readiness",
          cueKind: "captioned-sync-preparation",
        },
      },
      {
        label: "FIVE-SECOND PREP PAUSE",
        anchor: anchor(80, "give you five seconds"),
        support: [anchor(83, "press pause it's okay")],
        summary: "The captions provide a five-second preparation pause before synchronization.",
        details: {
          subject: "Preparation pause",
          cueKind: "captioned-sync-preparation",
        },
      },
      {
        label: "PRESS-PLAY PROMISE",
        anchor: anchor(108, "tell you guys exactly when"),
        support: [anchor(110, "press play and we'll press play")],
        summary: "The captions promise an exact press-play cue for viewers.",
        details: {
          subject: "Press-play instructions",
          cueKind: "captioned-sync-instruction",
        },
      },
      {
        label: "COMMENTARY TRACK WARNING",
        anchor: anchor(146, "forewarning this is kind of a commentary"),
        support: [anchor(148, "lot of talking"), anchor(149, "over that movie")],
        summary: "The captions warn that the commentary includes substantial talking over the movie.",
        details: {
          subject: "Commentary listening expectations",
          cueKind: "captioned-commentary-warning",
        },
      },
      {
        label: "FALSE-START COUNTDOWN",
        anchor: anchor(160, "pressing play in three two four one"),
        summary: "The captions record an initial countdown that immediately becomes a false start.",
        details: {
          subject: "Initial countdown",
          cueKind: "captioned-sync-false-start",
        },
      },
      {
        label: "FALSE-START CORRECTION",
        anchor: anchor(167, "which I press"),
        support: [anchor(169, "play god damn it no wait")],
        summary: "The captions immediately stop and correct the first play attempt.",
        details: {
          subject: "False-start correction",
          cueKind: "captioned-sync-correction",
        },
      },
      {
        label: "SUCCESSFUL PLAY CUE",
        anchor: anchor(183, "ready and press"),
        support: [anchor(184, "play now okay here we go")],
        summary: "The captions provide the successful “press play now” synchronization cue.",
        details: {
          subject: "Successful play cue",
          cueKind: "captioned-sync-start",
        },
      },
    ],
  },
  YvjsGkVEu0A: {
    agendaItems: [
      {
        label: "ROB ZOMBIE / THE MUNSTERS",
        anchor: anchor(501, "thoughts on rob zombie"),
        support: [anchor(503, "directing the new monsters movie"), anchor(505, "part of the news we're gonna talk")],
        summary:
          "The captions reserve Rob Zombie directing The Munsters for the news segment.",
        details: {
          subject: "Rob Zombie and The Munsters",
          itemKind: "captioned-news-door",
        },
      },
      {
        label: "NEWS SEGMENT START",
        anchor: anchor(1228, "we can start"),
        support: [anchor(1230, "with the news now"), anchor(1235, "rob zombie might be directing")],
        summary: "The captions start the news segment with the Rob Zombie / Munsters story.",
        details: {
          subject: "Movie-news segment",
          itemKind: "captioned-news-transition",
        },
      },
      {
        label: "CREED III AND SNYDER CUT AHEAD",
        anchor: anchor(2939, "if you guys are just here for the movie"),
        support: [
          anchor(2940, "news stick around"),
          anchor(2942, "talk creed three"),
          anchor(2943, "talk snyder cut"),
        ],
        summary: "The captions promise later agenda doors for Creed III and the Snyder Cut.",
        details: {
          subject: "Creed III and the Snyder Cut",
          itemKind: "captioned-agenda-preview",
        },
      },
      {
        label: "HALLOWEEN THEORY",
        anchor: anchor(4195, "there is a theory going on about"),
        support: [anchor(4199, "halloween"), anchor(4201, "the theory got started")],
        summary: "The captions open a sustained Halloween theory discussion.",
        details: {
          subject: "Halloween theory",
          itemKind: "captioned-news-analysis-door",
        },
      },
      {
        label: "CREED III TRANSITION",
        anchor: anchor(6975, "got creed three news to cover"),
        support: [anchor(6977, "talk about the snyder cut")],
        summary: "The captions transition from Halloween theory toward Creed III and Snyder Cut news.",
        details: {
          subject: "Creed III news",
          itemKind: "captioned-news-transition",
        },
      },
      {
        label: "CREED III CONFIRMATION TOPIC",
        anchor: anchor(7543, "creed three is happening"),
        summary: "The captions mark Creed III happening as the active news item.",
        details: {
          subject: "Creed III",
          itemKind: "captioned-news-door",
        },
      },
      {
        label: "DARKSEID / STEPPENWOLF TRAILER",
        anchor: anchor(8773, "on to other news"),
        support: [
          anchor(8776, "snyder cut news"),
          anchor(8786, "dark seed slash steppenwolf trailer"),
        ],
        summary: "The captions open Snyder Cut news with the Darkseid / Steppenwolf trailer.",
        details: {
          subject: "Darkseid / Steppenwolf trailer",
          itemKind: "captioned-news-door",
        },
      },
      {
        label: "ACCIDENTAL SNYDER CUT RELEASE",
        anchor: anchor(9755, "in other snyder cut news"),
        support: [anchor(9762, "the snyder cut accidentally got released")],
        summary: "The captions introduce the accidental Snyder Cut release as another news item.",
        details: {
          subject: "Accidental Snyder Cut release",
          itemKind: "captioned-news-door",
        },
      },
    ],
  },
  "1luh7mKQfz8": {
    reviewMoments: [
      {
        label: "SPOILER-HEAVY SETUP",
        anchor: anchor(93, "Avengers first off"),
        support: [anchor(102, "title its spoiler"), anchor(105, "spoiler heavy")],
        summary: "The captions warn that the Avengers discussion is spoiler-heavy.",
        details: {
          subject: "Spoiler warning",
          stance: "format",
          momentKind: "captioned-review-setup",
        },
      },
      {
        label: "TONY RETURNS / FIRST CRY",
        anchor: anchor(467, "when they landed"),
        support: [
          anchor(472, "sees Captain America"),
          anchor(476, "lost the kid first time I cried"),
        ],
        summary:
          "The review calls Tony’s return and “lost the kid” exchange its first crying moment.",
        details: {
          subject: "Tony Stark returns to Earth",
          stance: "emotional-positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "SCOTT AND CASSIE / SECOND CRY",
        anchor: anchor(551, "that scene when he goes"),
        support: [anchor(558, "daughter"), anchor(559, "answers the door"), anchor(559, "second")],
        summary: "The review identifies Scott reuniting with Cassie as its second crying moment.",
        details: {
          subject: "Scott and Cassie reunion",
          stance: "emotional-positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "TONY AND PEPPER / TIME-TRAVEL DECISION",
        anchor: anchor(990, "the scene that Tony and"),
        support: [
          anchor(993, "pepper"),
          anchor(1004, "never be able to sleep"),
          anchor(1006, "it's perfect"),
        ],
        summary:
          "The review calls Pepper’s answer to Tony’s time-travel dilemma a perfect character moment.",
        details: {
          subject: "Tony and Pepper time-travel decision",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "THOR'S COMEDY OVER DEPRESSION",
        anchor: anchor(1456, "comedy"),
        support: [
          anchor(1461, "subtle hints of tragedy"),
          anchor(1475, "tears welling up"),
          anchor(1497, "so subtle"),
        ],
        summary:
          "The review praises Thor’s comedy for carrying subtle tragedy and depression underneath.",
        details: {
          subject: "Thor's depression arc",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "BLACK WIDOW SACRIFICE",
        anchor: anchor(1905, "Black Widow"),
        support: [
          anchor(1917, "sacrifice herself"),
          anchor(1937, "let me go"),
          anchor(1965, "saddest"),
        ],
        summary: "The review frames Black Widow’s sacrifice as one of the film’s saddest sequences.",
        details: {
          subject: "Black Widow sacrifice",
          stance: "emotional-positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "AMERICA'S ASS",
        anchor: anchor(1973, "Captain America fighting"),
        support: [anchor(1976, "America's ass joke"), anchor(1978, "one of the best jokes")],
        summary: "The review names the “America’s ass” gag as one of the film’s best jokes.",
        details: {
          subject: "America's ass joke",
          stance: "positive",
          momentKind: "captioned-comedy-highlight",
        },
      },
      {
        label: "THANOS FIGHT",
        anchor: anchor(2037, "the fight happens when Thanos"),
        support: [anchor(2063, "fighting Thanos"), anchor(2069, "epic")],
        summary: "The review calls the central Thanos fight epic.",
        details: {
          subject: "Thanos battle",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "TONY'S DEATH",
        anchor: anchor(2520, "you can rest now and then he dies"),
        support: [anchor(2524, "more painful"), anchor(2526, "more perfect")],
        summary:
          "The review says the “you can rest now” death beat is both more painful and more perfect.",
        details: {
          subject: "Tony Stark's death",
          stance: "emotional-positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "CHEESEBURGER CALLBACK",
        anchor: anchor(2567, "what really ruined me"),
        support: [anchor(2577, "his daughter"), anchor(2580, "want some cheeseburgers")],
        summary: "The review says the cheeseburger callback is the moment that emotionally ruined it.",
        details: {
          subject: "Cheeseburger callback",
          stance: "emotional-positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "ASSEMBLED CAST PAYOFF",
        anchor: anchor(3100, "moment that they deserved"),
        support: [
          anchor(3104, "they all assembled"),
          anchor(3108, "best moments of the film"),
          anchor(3111, "appropriate time to shine"),
        ],
        summary:
          "The review says the assembled cast receives the film’s best moments and appropriate time to shine.",
        details: {
          subject: "Avengers assemble payoff",
          stance: "positive",
          momentKind: "captioned-review-summary",
        },
      },
      {
        label: "TOP MCU PICK",
        anchor: anchor(3271, "give you two right now"),
        support: [anchor(3274, "number one"), anchor(3288, "in game number one of all time")],
        summary: "The captions place Endgame at number one in the immediate MCU ranking response.",
        details: {
          subject: "Endgame MCU placement",
          stance: "positive",
          momentKind: "captioned-review-verdict",
        },
      },
    ],
  },
  "2m0BgJzEPCk": {
    reviewMoments: [
      {
        label: "BREATH OF FRESH AIR",
        anchor: anchor(135, "watching this film child's play was a"),
        support: [anchor(137, "breath of fresh air")],
        summary: "The review opens by calling Child’s Play a breath of fresh air.",
        details: {
          subject: "Opening verdict",
          stance: "positive",
          momentKind: "captioned-review-verdict",
        },
      },
      {
        label: "SPOILER SECTION START",
        anchor: anchor(350, "ready for spoilers"),
        support: [anchor(352, "childsplay spoilers")],
        summary: "The captions explicitly open the Child’s Play spoiler section.",
        details: {
          subject: "Spoiler section",
          stance: "format",
          momentKind: "captioned-review-setup",
        },
      },
      {
        label: "AI PREMISE WORKS",
        anchor: anchor(377, "the AI"),
        support: [anchor(381, "does it work it works"), anchor(384, "didn't think it was going to")],
        summary:
          "The review says the AI premise works despite expecting that it would not.",
        details: {
          subject: "AI Chucky premise",
          stance: "positive-surprise",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "LOVE-HATE ORIGIN",
        anchor: anchor(483, "it was so"),
        support: [anchor(485, "dark"), anchor(485, "I love"), anchor(487, "hate the origin story")],
        summary: "The review describes the new origin as a dark love-hate element.",
        details: {
          subject: "Chucky origin",
          stance: "mixed",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "NEW ANDY PRAISE",
        anchor: anchor(670, "kid that plays"),
        support: [anchor(672, "Andy is phenomenal"), anchor(678, "kid had depth")],
        summary: "The review calls the new Andy performer phenomenal and praises the character’s depth.",
        details: {
          subject: "Andy performance",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "GENUINE SCARES",
        anchor: anchor(993, "movies not"),
        support: [anchor(996, "couple moments where you're genuinely"), anchor(998, "janitors death")],
        summary:
          "The review says the movie is not broadly scary but identifies the janitor death as genuinely effective.",
        details: {
          subject: "Scare effectiveness",
          stance: "mixed-positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "TEXAS CHAINSAW LEARNING BEAT",
        anchor: anchor(1239, "scene where they're watching Texas"),
        support: [
          anchor(1245, "Texas Chainsaw Massacre"),
          anchor(1288, "such a genius idea"),
        ],
        summary:
          "The review calls Chucky learning from the Texas Chainsaw Massacre scene a genius idea.",
        details: {
          subject: "Texas Chainsaw Massacre learning scene",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "FIRST BRUTAL DEATH",
        anchor: anchor(1722, "one of the first cool death scenes"),
        support: [anchor(1788, "first"), anchor(1796, "felt like a fatality")],
        summary: "The review says an early death lands with the brutality of a fatality.",
        details: {
          subject: "Christmas-light death",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "JANITOR DEATH FAVORITE",
        anchor: anchor(2189, "his death scene was"),
        support: [anchor(2192, "probably my favorite")],
        summary: "The review identifies the janitor death as a probable favorite.",
        details: {
          subject: "Janitor death",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "BEST CHUCKY MID-KILL LOOK",
        anchor: anchor(2233, "it looked good"),
        support: [anchor(2234, "best I've ever seen Chucky look mid kill")],
        summary: "The review calls this the best Chucky has looked mid-kill.",
        details: {
          subject: "Chucky mid-kill movement",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "EXPECTED HATE, FOUND FUN",
        anchor: anchor(2471, "where I stand"),
        support: [anchor(2473, "hate it"), anchor(2477, "this is fun")],
        summary: "The review contrasts an expectation of hating the film with finding it fun.",
        details: {
          subject: "Expectation reversal",
          stance: "positive-surprise",
          momentKind: "captioned-review-summary",
        },
      },
      {
        label: "THIRD ACT LETDOWN",
        anchor: anchor(2618, "third act"),
        support: [anchor(2622, "having a blast"), anchor(2632, "surprised me in a bad kind of way")],
        summary:
          "The review says a fun first two-thirds gives way to a disappointing third act.",
        details: {
          subject: "Third act",
          stance: "negative",
          momentKind: "captioned-review-critique",
        },
      },
      {
        label: "ACTING AND STANDALONE VALUE",
        anchor: anchor(2844, "nonetheless"),
        support: [
          anchor(2850, "acting is"),
          anchor(2852, "done really well"),
          anchor(2875, "stand on its own two legs"),
        ],
        summary:
          "The review praises the acting and says the remake can stand on its own.",
        details: {
          subject: "Acting and standalone identity",
          stance: "positive",
          momentKind: "captioned-review-summary",
        },
      },
      {
        label: "7.5 VERDICT / CHECK IT OUT",
        anchor: anchor(2877, "overall"),
        support: [
          anchor(2879, "7.5 for me"),
          anchor(2881, "everybody should"),
          anchor(2882, "check it out"),
        ],
        summary: "The captions give a 7.5 verdict and recommend that horror fans check it out.",
        details: {
          subject: "Overall verdict",
          scoreText: "7.5",
          stance: "positive",
          momentKind: "captioned-review-verdict",
        },
      },
      {
        label: "ATE CROW RECOMMENDATION",
        anchor: anchor(3941, "enjoy child's play"),
        support: [
          anchor(3944, "say you should go see"),
          anchor(3945, "we ate crow"),
          anchor(3947, "thought was gonna suck"),
        ],
        summary:
          "The closing recommendation says to see the movie and admits the negative expectation was wrong.",
        details: {
          subject: "Closing recommendation",
          stance: "positive-surprise",
          momentKind: "captioned-review-verdict",
        },
      },
    ],
  },
  QwJb31dSo9Y: {
    reviewMoments: [
      {
        label: "SPOILER-FREE REVIEW",
        anchor: anchor(52, "spoiler-free review of"),
        support: [anchor(55, "halloween kills")],
        summary: "The captions identify the stream as a spoiler-free Halloween Kills review.",
        details: {
          subject: "Spoiler-free format",
          stance: "format",
          momentKind: "captioned-review-setup",
        },
      },
      {
        label: "AWESOME, NOT PERFECT",
        anchor: anchor(97, "it was"),
        support: [
          anchor(102, "overall"),
          anchor(102, "awesome"),
          anchor(104, "movie"),
          anchor(106, "is it perfect no"),
        ],
        summary: "The opening verdict calls the movie awesome while explicitly saying it is not perfect.",
        details: {
          subject: "Opening verdict",
          stance: "positive-mixed",
          momentKind: "captioned-review-verdict",
        },
      },
      {
        label: "SCORE PRAISE",
        anchor: anchor(183, "music overall"),
        support: [
          anchor(186, "using the old score"),
          anchor(190, "using the new score"),
          anchor(211, "score and I dug it"),
        ],
        summary: "The review praises how old and new score material is used.",
        details: {
          subject: "Music and score",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "GORE PRAISE",
        anchor: anchor(215, "the gore was great"),
        support: [anchor(220, "really good job")],
        summary: "The review calls the gore great and praises the effects work.",
        details: {
          subject: "Gore and effects",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "MICHAEL LIGHTING",
        anchor: anchor(327, "how"),
        support: [anchor(329, "lighting was on michael"), anchor(351, "looked great")],
        summary: "The review highlights the lighting and says Michael looked great.",
        details: {
          subject: "Michael Myers lighting",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "FLASHBACK DISCLOSURE",
        anchor: anchor(366, "not a spoiler"),
        support: [anchor(368, "flashback scene"), anchor(370, "flashback scene")],
        summary: "The review discloses the existence of a flashback while keeping plot details out.",
        details: {
          subject: "Flashback sequence",
          stance: "format",
          momentKind: "captioned-spoiler-boundary",
        },
      },
      {
        label: "NO-SPOILERS REMINDER",
        anchor: anchor(874, "tomorrow we will be doing a full spoiler"),
        support: [anchor(876, "refrain"), anchor(884, "no spoilers")],
        summary: "The captions remind the audience that a separate full-spoiler review will follow.",
        details: {
          subject: "Spoiler boundary",
          stance: "format",
          momentKind: "captioned-spoiler-boundary",
        },
      },
      {
        label: "GREAT VERSUS ANNOYING",
        anchor: anchor(3342, "great stuff is great"),
        support: [
          anchor(3342, "and the bad"),
          anchor(3344, "stuff is just kind of annoying"),
        ],
        summary: "The review summarizes the strengths as great and the weaknesses as annoying rather than fatal.",
        details: {
          subject: "Strengths and weaknesses",
          stance: "mixed-positive",
          momentKind: "captioned-review-summary",
        },
      },
      {
        label: "ATMOSPHERE AND MICHAEL",
        anchor: anchor(3442, "gore"),
        support: [
          anchor(3449, "music was amazing"),
          anchor(3451, "atmosphere was great"),
          anchor(3458, "brutality of michael was the best part"),
        ],
        summary:
          "The review praises the music, atmosphere, and Michael’s brutality as the best part.",
        details: {
          subject: "Music, atmosphere, and Michael",
          stance: "positive",
          momentKind: "captioned-review-summary",
        },
      },
      {
        label: "FAVORITE MICHAEL INCARNATION",
        anchor: anchor(3559, "probably my"),
        support: [
          anchor(3562, "favorite michael"),
          anchor(3563, "not my favorite movie"),
          anchor(3565, "favorite incarnation"),
        ],
        summary:
          "The review distinguishes the movie from what may be its favorite incarnation of Michael Myers.",
        details: {
          subject: "Michael Myers incarnation",
          stance: "positive",
          momentKind: "captioned-review-highlight",
        },
      },
      {
        label: "FLASHBACK // 10 OUT OF 10",
        anchor: anchor(3617, "summation"),
        support: [
          anchor(3623, "love that much"),
          anchor(3626, "strokes of genius"),
          anchor(3657, "10 out of"),
          anchor(3659, "10"),
        ],
        summary: "The review calls the flashback strokes of genius and scores that section 10 out of 10.",
        details: {
          subject: "Flashback sequence",
          scoreText: "10 out of 10",
          stance: "positive",
          momentKind: "captioned-section-score",
        },
      },
      {
        label: "MIDDLE // 6",
        anchor: anchor(3661, "middle of the movie"),
        support: [anchor(3662, "six"), anchor(3664, "hospital")],
        summary: "The review scores the middle a six and criticizes the hospital material.",
        details: {
          subject: "Middle section",
          scoreText: "6",
          stance: "negative-mixed",
          momentKind: "captioned-section-score",
        },
      },
      {
        label: "ENDING // 8.5",
        anchor: anchor(3704, "ending to"),
        support: [anchor(3706, "8.5"), anchor(3709, "wild and it was crazy")],
        summary: "The review scores the ending 8.5 and calls it wild and crazy.",
        details: {
          subject: "Ending",
          scoreText: "8.5",
          stance: "positive",
          momentKind: "captioned-section-score",
        },
      },
      {
        label: "OVERALL // 8",
        anchor: anchor(3713, "long story short"),
        support: [anchor(3723, "eight for me out of ten")],
        summary: "One unresolved captioned verdict gives the movie eight out of ten.",
        details: {
          subject: "Overall rating",
          scoreText: "8 out of 10",
          stance: "positive",
          momentKind: "captioned-review-verdict",
          sequenceState: "parallel-ratings-unresolved",
        },
      },
      {
        label: "OVERALL // 9",
        anchor: anchor(3726, "give you the overall"),
        support: [anchor(3728, "nine out of"), anchor(3729, "ten")],
        summary: "Another unresolved captioned verdict gives the movie nine out of ten.",
        details: {
          subject: "Overall rating",
          scoreText: "9 out of 10",
          stance: "positive",
          momentKind: "captioned-review-verdict",
          sequenceState: "parallel-ratings-unresolved",
        },
      },
    ],
  },
  rtWl8c57SYk: {
    reviewMoments: [
      {
        label: "NEW PENNYWISE SHOW WATCHED",
        anchor: anchor(64, "watched the new"),
        support: [anchor(66, "Penny Wise thing")],
        summary: "The captions identify the newly watched Pennywise show as the discussion subject.",
        details: {
          subject: "Welcome to Derry episode one",
          stance: "format",
          momentKind: "captioned-recap-setup",
        },
      },
      {
        label: "OPENING CAR SCENE",
        anchor: anchor(182, "opening car"),
        support: [anchor(184, "scene horrifying"), anchor(186, "wild")],
        summary: "The recap calls the opening car scene horrifying and wild.",
        details: {
          subject: "Opening car scene",
          stance: "positive",
          momentKind: "captioned-recap-highlight",
        },
      },
      {
        label: "BIRTH OPENING VERDICT",
        anchor: anchor(332, "Gross"),
        support: [
          anchor(334, "glad they did it"),
          anchor(341, "best openings to any TV show"),
          anchor(349, "greatest opening scenes"),
        ],
        summary: "The recap calls the grotesque birth sequence one of television’s best opening scenes.",
        details: {
          subject: "Birth opening sequence",
          stance: "positive",
          momentKind: "captioned-recap-highlight",
        },
      },
      {
        label: "THEATER MASSACRE TURN",
        anchor: anchor(887, "at the end in the movie"),
        support: [
          anchor(888, "theater"),
          anchor(890, "everyone"),
          anchor(893, "turning the script"),
          anchor(895, "saved it for me"),
        ],
        summary: "The recap says the theater massacre turns the script and saves the sequence.",
        details: {
          subject: "Theater massacre",
          stance: "positive",
          momentKind: "captioned-recap-highlight",
        },
      },
      {
        label: "LAMPSHADE SCENE",
        anchor: anchor(1147, "lampshade scene was wild"),
        support: [anchor(1150, "looked good"), anchor(1156, "awesome")],
        summary: "The recap calls the lampshade scene wild, good-looking, and awesome.",
        details: {
          subject: "Lampshade scene",
          stance: "positive",
          momentKind: "captioned-recap-highlight",
        },
      },
      {
        label: "NUCLEAR-WAR SIDE PLOT",
        anchor: anchor(1239, "side plot with the"),
        support: [anchor(1241, "nuclear war"), anchor(1242, "I don't mind it")],
        summary: "The recap says it does not mind the nuclear-war side plot.",
        details: {
          subject: "Nuclear-war side plot",
          stance: "mixed-positive",
          momentKind: "captioned-recap-highlight",
        },
      },
      {
        label: "EPISODE-TWO DREAM-SEQUENCE LINE",
        anchor: anchor(1458, "if episode two"),
        support: [
          anchor(1463, "mark my words"),
          anchor(1467, "starts and she wakes up"),
          anchor(1468, "dream sequence"),
        ],
        summary:
          "The recap draws a firm future line against episode two undoing the opening as a dream.",
        details: {
          subject: "Episode-two dream-sequence possibility",
          stance: "negative-prediction",
          momentKind: "captioned-recap-theory",
        },
      },
      {
        label: "PENNYWISE ABSENCE",
        anchor: anchor(1504, "thought he was"),
        support: [
          anchor(1505, "pop up"),
          anchor(1508, "perfect opportunity"),
          anchor(1509, "Pennywise"),
        ],
        summary: "The recap says the theater ending felt like a perfect opportunity for Pennywise to appear.",
        details: {
          subject: "Pennywise absence from theater ending",
          stance: "negative-mixed",
          momentKind: "captioned-recap-critique",
        },
      },
      {
        label: "CGI COMPLAINT",
        anchor: anchor(1521, "theater scene"),
        support: [anchor(1522, "CGI"), anchor(1529, "off dude")],
        summary: "The recap opens a blunt complaint about CGI in the theater scene.",
        details: {
          subject: "Theater-scene CGI",
          stance: "negative",
          momentKind: "captioned-recap-critique",
        },
      },
      {
        label: "PRACTICAL-EFFECTS PREFERENCE",
        anchor: anchor(1583, "there were some scenes"),
        support: [
          anchor(1584, "definitely"),
          anchor(1586, "practical effects"),
          anchor(1587, "made it better"),
        ],
        summary: "The recap says some scenes would have benefited from practical effects.",
        details: {
          subject: "Effects approach",
          stance: "negative-mixed",
          momentKind: "captioned-recap-critique",
        },
      },
      {
        label: "FINAL EPISODE VERDICT",
        anchor: anchor(1803, "it was good"),
        support: [
          anchor(1805, "episode was really"),
          anchor(1807, "really good"),
          anchor(1809, "better than Alien"),
          anchor(1810, "Earth"),
        ],
        summary:
          "The closing verdict calls the episode really good and better than Alien: Earth.",
        details: {
          subject: "Episode-one verdict",
          stance: "positive",
          momentKind: "captioned-recap-verdict",
        },
      },
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
    questionAnswerPairs: "questionAnswerPair",
    trailerCues: "trailerCue",
    scriptSceneCues: "scriptSceneCue",
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
  if (!Number.isFinite(fact.at) || !Number.isFinite(fact.end) || fact.end <= fact.at) {
    throw new Error(`${fact.id} has an invalid playback range.`);
  }
  for (const [key, value] of Object.entries(fact)) {
    if (/excerpt$/i.test(key) && wordTokens(value).length > EXCERPT_WORD_LIMIT) {
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

export function buildBatch2Payload() {
  const sources = TARGETS.map(buildSource);
  const facts = sources.flatMap(
    (source) => source[source.formatSpecificFactType],
  );
  const byType = {};
  for (const fact of facts) {
    byType[fact.type] = (byType[fact.type] || 0) + 1;
  }
  return {
    schema: "wwam-episode-facts-batch2/v1",
    generated: GENERATED,
    provenance: {
      generator: "scripts/generate-episode-facts-batch2.mjs",
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
        "Voice identity, frame certification, document provenance, and creator sign-off are intentionally not populated.",
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

export function renderArtifact(payload = buildBatch2Payload()) {
  return `window.WWAM_EPISODE_FACTS_BATCH2 = ${JSON.stringify(payload)};\n`;
}

function main() {
  const rendered = renderArtifact();
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(OUTPUT_PATH)) {
      throw new Error(`Missing generated artifact: ${OUTPUT_PATH}`);
    }
    if (fs.readFileSync(OUTPUT_PATH, "utf8") !== rendered) {
      throw new Error(
        "episode-facts-batch2.js is stale; run generate-episode-facts-batch2.mjs",
      );
    }
    process.stdout.write("episode facts batch 2 is deterministic and current\n");
    return;
  }
  fs.writeFileSync(OUTPUT_PATH, rendered);
  const payload = buildBatch2Payload();
  process.stdout.write(
    `wrote ${path.relative(PROJECT_ROOT, OUTPUT_PATH)} (${payload.meta.sources} sources, ${payload.meta.facts} typed facts)\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
